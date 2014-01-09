/**
* Created with D-engine.
* User: admiral2
* Date: 2014-01-09
* Time: 08:35 AM
* To change this template use Tools | Templates.
*/
D.module('module1', null, function(){
    "use strict";
    
    D.module1 = D.Class.extend({
        init: function(){
        },
        name: function(){
            // Call the inherited version of dance()
            return 'module1';
        }
    });
});