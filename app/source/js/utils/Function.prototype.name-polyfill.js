/**
    Fix Function#name on browsers that do not support it (IE9+):
    
    http://stackoverflow.com/a/17056530/1622346    
**/
'use strict';
/*jshint -W068 */
if (!(function f() {}).name) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function() {
            var name = this.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
            // For better performance only parse once, and then cache the
            // result through a new accessor for repeated access.
            Object.defineProperty(this, 'name', { value: name });
            return name;
        }
    });
}