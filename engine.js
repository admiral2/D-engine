(function(window){
    "use strict";

    // -----------------------------------------------------------------------------
    // D Namespace
    
    window.D = {
        version: '0.01',
        global: window,	
        nocache: '',
        modules: [],
		_loadQueue: [],
		_loadQueueNotReady: 0,
		lib_path: '',
		ua: {},
        
        $: function( selector ) {
            if ( selector[0] === "<" && selector[ selector.length - 1 ] === ">" && selector.length >= 3 ) {
                // Assume that strings that start and end with <> are HTML element
                return document.createElement( selector.substring(1, selector.length - 1) );
            } else {
                return selector.charAt(0) == '#'
                    ? document.getElementById( selector.substr(1) )
                    : document.getElementsByTagName( selector );
            }
        },
        
        
        isArray: function (arg) {
            return Object.prototype.toString.call(arg) === "[object Array]";
        },
        
        
        isString: function (arg) {
            return typeof arg === "string";
        },
        
		isFunction: function(arg) {
        	return Object.prototype.toString.call(arg) === '[object Function]';
    	},
		
		/**
		 * Helper function for iterating over an array. If the func returns
		 * a true value, it will break out of the loop.
		 */
		each: function (ary, func) {
			if (ary) {
				var i;
				for (i = 0; i < ary.length; i += 1) {
					if (ary[i] && func(ary[i], i, ary)) {
						break;
					}
				}
			}
		},
 
        _normalizeArg: function(arg) {
			if(!arg || arg=='') {
                return [];
            }
			
            if(D.isString(arg)) {
                arg = arg.replace(/\s+/g,'').split(",");
            }
            else if(D.isArray(arg)) {
                arg = [ arg ];
            }
			
            return arg;
        },
 
		_loadModule: function( name, requiredFrom ) {
			D.modules[name] = {name: name, requires:[], loaded: false, body: null};
			D._loadQueueNotReady++;
			
			var path = D.lib_path + name.replace(/\./g, '/') + '.js' + D.nocache;
			var script = D.$('<script>');
			script.type = 'text/javascript';
			script.src = path;
			script.onload = function() {
				D._loadQueueNotReady--;
				D._initModules();
			};
			script.onerror = function() {
				throw(
					'Failed to load module '+name+' at ' + path + ' ' +
					'required from ' + requiredFrom
				);
			};
			D.$('head')[0].appendChild(script);
		},
		
        module: function(name, requires, body){
            if( D.modules[name] && D.modules[name].body ) {
			    throw( "Module '"+name+"' is already defined" );
		    }
             
			requires = D._normalizeArg(requires);
            D.modules[name] = {name: name, requires: requires, body: body, loaded: false}
    		
			for( var i = 0; i < requires.length; i++ ) {
				if (!D.modules[requires[i]]) {
					D._loadModule(requires[i], name);
				}
			}
	
            D.init();            
    
            return D;
        },
        
        
        copy: function( object ) {
            if(
               !object || typeof(object) != 'object' ||
               object instanceof HTMLElement ||
               object instanceof ig.Class
            ) {
                return object;
            }
            else if( object instanceof Array ) {
                var c = [];
                for( var i = 0, l = object.length; i < l; i++) {
                    c[i] = ig.copy(object[i]);
                }
                return c;
            }
            else {
                var c = {};
                for( var i in object ) {
                    c[i] = ig.copy(object[i]);
                }
                return c;
            }
        },
        
        
        merge: function( original, extended ) {
            for( var key in extended ) {
                var ext = extended[key];
                if(
                    typeof(ext) != 'object' ||
                    ext instanceof HTMLElement ||
                    ext instanceof ig.Class ||
                    ext === null
                ) {
                    original[key] = ext;
                }
                else {
                    if( !original[key] || typeof(original[key]) != 'object' ) {
                        original[key] = (ext instanceof Array) ? [] : {};
                    }
                    ig.merge( original[key], ext );
                }
            }
            return original;
        },
        
        
        ksort: function( obj ) {
            if( !obj || typeof(obj) != 'object' ) {
                return [];
            }
            
            var keys = [], values = [];
            for( var i in obj ) {
                keys.push(i);
            }
            
            keys.sort();
            for( var i = 0; i < keys.length; i++ ) {
                values.push( obj[keys[i]] );
            }
            
            return values;
        },
            
            
        setNocache: function( set ) {
		    D.nocache = set
			    ? '?' + Date.now()
			    : '';
	    },
        
			
		_initModules: function() {
			console.log('D._initModules');
			
			var modules_loaded = false;
			do {
				modules_loaded = false;
				
				for( var i in D.modules) {			
					if (D.modules[i].loaded) continue;
	
					var requires_loaded = true;
					for( var j = 0; j < D.modules[i].requires.length; j++ ) {
						if (!D.modules[D.modules[i].requires[j]].loaded) {
							console.log(D.modules[i].requires[j]+' not ready for '+i);
							requires_loaded = false;
							break;
						}
					}
									
					if (requires_loaded && D.modules[i].body) {
						console.log('init '+i);
						D.modules[i].body();
						D.modules[i].loaded = true;
						modules_loaded = true;
					}
				}
			} while (modules_loaded);
		},
			
			
		_DOMReady: function() {
			if (!D.modules['D.DOM']) {
				throw( "Module 'D.DOM' not defined" );
			}
			if(D.modules['D.DOM'].loaded) return;
			
			console.log('D._DOMReady');			
			D.modules['D.DOM'].loaded = true;
			D._initModules();
		},
			
			
        capabilities: function() {
			console.log('D.capabilities');
			
            // check browser type and capabilities
            if( document.location.href.match(/\?nocache/) ) {
			    D.setNocache( true );
		    }
			
			// Probe user agent string
			D.ua.pixelRatio = window.devicePixelRatio || 1;
			D.ua.viewport = {
				width: window.innerWidth,
				height: window.innerHeight
			};
			D.ua.screen = {
				width: window.screen.availWidth * D.ua.pixelRatio,
				height: window.screen.availHeight * D.ua.pixelRatio
			};
			
			var userAgent = navigator.userAgent;
			D.ua.iPhone = /iPhone/i.test(userAgent);
			D.ua.iPhone4 = (D.ua.iPhone && D.ua.pixelRatio == 2);
			D.ua.iPad = /iPad/i.test(userAgent);
			D.ua.android = /android/i.test(userAgent);
			D.ua.winPhone = /Windows Phone/i.test(userAgent);
			D.ua.iOS = D.ua.iPhone || D.ua.iPad;
			D.ua.mobile = D.ua.iOS || D.ua.android || D.ua.winPhone || /mobile/i.test(userAgent);
			D.ua.touchDevice = (('ontouchstart' in window) || ('ontouchstart' in document.documentElement) || (window.navigator.msMaxTouchPoints));
        },
			
			
        init: function() {
			if (D.modules['D.DOM']) {
				return; // init once
			}
				
			D.modules['D.DOM'] = {name: 'D.DOM', requires: [], body: null, loaded: false}
			console.log('D.init');
			
            D.capabilities();
			
			// wait for DOM ready
			if ( document.readyState === 'complete' ) {
				return setTimeout( D._DOMReady, 1 );
			} else {
				// Mozilla, Opera and webkit nightlies currently support this event
				if ( document.addEventListener ) {		
					document.addEventListener( 'DOMContentLoaded', D._DOMReady, false );
					window.addEventListener( 'load', D._DOMReady, false );
					
				// If IE event model is used
				} else if ( document.attachEvent ) {
					// ensure firing before onload,
					// maybe late but safe also for iframes
					document.attachEvent( "onreadystatechange", D._DOMReady );
	
					// A fallback to window.onload, that will always work
					window.attachEvent( "onload", D._DOMReady );				
				}
			}
        }
    };

    // -----------------------------------------------------------------------------
    // Class object based on John Resigs code; inspired by base2 and Prototype
    // http://ejohn.org/blog/simple-javascript-inheritance/
    
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\bparent\b/ : /.*/;
    var lastClassId = 0;
    
    window.D.Class = function(){};
                      
    var inject = function(prop) {	
        var proto = this.prototype;
        var parent = {};
        for( var name in prop ) {		
            if( 
                typeof(prop[name]) == "function" &&
                typeof(proto[name]) == "function" && 
                fnTest.test(prop[name])
            ) {
                parent[name] = proto[name]; // save original function
                proto[name] = (function(name, fn){
                    return function() {
                        var tmp = this.parent;
                        this.parent = parent[name];
                        var ret = fn.apply(this, arguments);			 
                        this.parent = tmp;
                        return ret;
                    };
                })( name, prop[name] );
            }
            else {
                proto[name] = prop[name];
            }
        }
    };
    
    window.D.Class.extend = function(prop) {
        var parent = this.prototype;
     
        initializing = true;
        var prototype = new this();
        initializing = false;
     
        for( var name in prop ) {
            if( 
                typeof(prop[name]) == "function" &&
                typeof(parent[name]) == "function" && 
                fnTest.test(prop[name])
            ) {
                prototype[name] = (function(name, fn){
                    return function() {
                        var tmp = this.parent;
                        this.parent = parent[name];
                        var ret = fn.apply(this, arguments);			 
                        this.parent = tmp;
                        return ret;
                    };
                })( name, prop[name] );
            }
            else {
                prototype[name] = prop[name];
            }
        }
     
        function Class() {
            if( !initializing ) {
                
                // If this class has a staticInstantiate method, invoke it
                // and check if we got something back. If not, the normal
                // constructor (init) is called.
                if( this.staticInstantiate ) {
                    var obj = this.staticInstantiate.apply(this, arguments);
                    if( obj ) {
                        return obj;
                    }
                }
                for( var p in this ) {
                    if( typeof(this[p]) == 'object' ) {
                        this[p] = ig.copy(this[p]); // deep copy!
                    }
                }
                if( this.init ) {
                    this.init.apply(this, arguments);
                }
            }
            return this;
        }
        
        Class.prototype = prototype;
        Class.prototype.constructor = Class;
        Class.extend = window.D.Class.extend;
        Class.inject = inject;
        Class.classId = prototype.classId = ++lastClassId;
        
        return Class;
    };             
})(window);

D.module('D.Person', '', function(){
    "use strict";
    
    D.Person = D.Class.extend({
        init: function(isDancing){
            this.dancing = isDancing;
        },
        dance: function(){
            return this.dancing;
        }
    });
});

D.module('D.Ninja', 'D.Person', function(){
    "use strict";
    
    D.Ninja = D.Person.extend({
        init: function(){
            this.parent( false );
        },
        dance: function(){
            // Call the inherited version of dance()
            return this.parent();
        },
        swingSword: function(){
            return true;
        }
    });
});

D.module('D.main', 'D.DOM,D.Person, D.Ninja,module2',
function(){
    "use strict";
    
	var p = new D.Person(true);
	console.log('p.dance() ', p.dance()); // => true
	 
	var n = new D.Ninja();
	console.log('n.dance() ', n.dance()); // => false
	console.log('n.swingSword() ', n.swingSword()); // => true
	 
	// Should all be true
	console.log('instanceof ', p instanceof D.Person && p instanceof D.Class &&
	n instanceof D.Ninja && n instanceof D.Person && n instanceof D.Class);
	
	var m = new D.module1();
	console.log('m.name() ', m.name()); // => false
});

/*fdsfds
var Game = new function() {                                                                  
  var boards = [];

  // Game Initialization
  this.initialize = function(canvasElementId,sprite_data,callback) {
    this.canvas = document.getElementById(canvasElementId)
    this.width = this.canvas.width;
    this.height= this.canvas.height;

    this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
    if(!this.ctx) { return alert("Please upgrade your browser to play"); }

    this.setupInput();

    this.loop(); 

    SpriteSheet.load(sprite_data,callback);
  };

  // Handle Input
  var KEY_CODES = { 37:'left', 39:'right', 32 :'fire' };
  this.keys = {};

  this.setupInput = function() {
    window.addEventListener('keydown',function(e) {
      if(KEY_CODES[event.keyCode]) {
       Game.keys[KEY_CODES[event.keyCode]] = true;
       e.preventDefault();
      }
    },false);

    window.addEventListener('keyup',function(e) {
      if(KEY_CODES[event.keyCode]) {
       Game.keys[KEY_CODES[event.keyCode]] = false; 
       e.preventDefault();
      }
    },false);
  }

  // Game Loop
  this.loop = function() { 
    var dt = 30 / 1000;
    setTimeout(Game.loop,30);

    for(var i=0,len = boards.length;i<len;i++) {
      if(boards[i]) { 
        boards[i].step(dt);
        boards[i].draw(Game.ctx);
      }
    }

  };
  
  // Change an active game board
  this.setBoard = function(num,board) { boards[num] = board; };
};


var SpriteSheet = new function() {
  this.map = { }; 

  this.load = function(spriteData,callback) { 
    this.map = spriteData;
    this.image = new Image();
    this.image.onload = callback;
    this.image.src = 'images/sprites.png';
  };

  this.draw = function(ctx,sprite,x,y,frame) {
    var s = this.map[sprite];
    if(!frame) frame = 0;
    ctx.drawImage(this.image,
                     s.sx + frame * s.w, 
                     s.sy, 
                     s.w, s.h, 
                     Math.floor(x), Math.floor(y),
                     s.w, s.h);
  };
}

var TitleScreen = function TitleScreen(title,subtitle,callback) {
  var up = false;
  this.step = function(dt) {
    if(!Game.keys['fire']) up = true;
    if(up && Game.keys['fire'] && callback) callback();
  };

  this.draw = function(ctx) {
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";

    ctx.font = "bold 40px bangers";
    ctx.fillText(title,Game.width/2,Game.height/2);

    ctx.font = "bold 20px bangers";
    ctx.fillText(subtitle,Game.width/2,Game.height/2 + 40);
  };
};

var GameBoard = function() {
  var board = this;

  // The current list of objects
  this.objects = [];

  // Add a new object to the object list
  this.add = function(obj) { 
    obj.board=this; 
    this.objects.push(obj); 
    return obj; 
  };

  // Mark an object for removal
  this.remove = function(obj) { 
    this.removed.push(obj); 
  };

  // Reset the list of removed objects
  this.resetRemoved = function() { this.removed = []; }

  // Removed an objects marked for removal from the list
  this.finalizeRemoved = function() {
    for(var i=0,len=this.removed.length;i<len;i++) {
      var idx = this.objects.indexOf(this.removed[i]);
      if(idx != -1) this.objects.splice(idx,1);
    }
  }


  // Call the same method on all current objects 
  this.iterate = function(funcName) {
     var args = Array.prototype.slice.call(arguments,1);
     for(var i=0,len=this.objects.length;i<len;i++) {
       var obj = this.objects[i];
       obj[funcName].apply(obj,args)
     }
  };

  // Find the first object for which func is true
  this.detect = function(func) {
    for(var i = 0,val=null, len=this.objects.length; i < len; i++) {
      if(func.call(this.objects[i])) return this.objects[i];
    }
    return false;
  };

  // Call step on all objects and them delete
  // any object that have been marked for removal
  this.step = function(dt) { 
    this.resetRemoved();
    this.iterate('step',dt);
    this.finalizeRemoved();
  };

  // Draw all the objects
  this.draw= function(ctx) {
    this.iterate('draw',ctx);
  };

  // Check for a collision between the 
  // bounding rects of two objects
  this.overlap = function(o1,o2) {
    return !((o1.y+o1.h-1<o2.y) || (o1.y>o2.y+o2.h-1) ||
             (o1.x+o1.w-1<o2.x) || (o1.x>o2.x+o2.w-1));
  };

  // Find the first object that collides with obj
  // match against an optional type
  this.collide = function(obj,type) {
    return this.detect(function() {
      if(obj != this) {
       var col = (!type || this.type & type) && board.overlap(obj,this)
       return col ? this : false;
      }
    });
  };


};

var Sprite = function() { }

Sprite.prototype.setup = function(sprite,props) {
  this.sprite = sprite;
  this.merge(props);
  this.frame = this.frame || 0;
  this.w =  SpriteSheet.map[sprite].w;
  this.h =  SpriteSheet.map[sprite].h;
}

Sprite.prototype.merge = function(props) {
  if(props) {
    for (var prop in props) {
      this[prop] = props[prop];
    }
  }
}

Sprite.prototype.draw = function(ctx) {
  SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
}
*/