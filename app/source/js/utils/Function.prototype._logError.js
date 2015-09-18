/**
    Wrapper the function to be executed,
    binded to the given object if is a method,
    catching any error and logging it to the console.
    Useful for event handlers, on other cases may be a problem
    since its returns undefined.
**/
'use strict';
Function.prototype._logError = function(bindedThis) {
    var fn = this;
    return function() {
        try {
            return fn.apply(bindedThis, arguments);
        }
        catch (err) {
            console.error(err);
        }
    };
};
