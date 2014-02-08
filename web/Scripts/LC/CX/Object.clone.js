/**
  It provides a clone method to all objects through Object.prototype.
  A special clone method is added to functions, through Function.prototype.

  It relies in the 'extend' funcionality.
**/
var extend = require('./extend').extend;

if (typeof Object.prototype.clone !== 'function')
  Object.prototype.clone = function clone() {
    return extend({}, this);
  };

if (typeof Function.prototype.clone !== 'function') {
  // Testing if a string seems a function source code:
  // We test agains a simplisic regular expresion that match
  // a common start of function declaration.
  // Other ways to do this is at inverser, by checking
  // that the function toString is not a knowed text
  // as '[object Function]' or '[native code]', but
  // since tha can changes between browsers, is more conservative
  // check against a common construct an fallback on the
  // common solution if not matches.
  var testFunction = /^\s*function[^\(]\(/;

  Function.prototype.clone = function clone() {
    var temp;
    var contents = this.toString();
    // Copy to a new instance of the same prototype, for the not 'owned' properties.
    // Assinged at the end
    var tempProto = Object.create(this.prototype);

    if (!testFunction.test(contents)) {
      var fn = this;
      // Check if is already a cloned copy, to
      // reuse the original code and avoid more than
      // one depth in stack calls (great!)
      if (typeof fn.prototype.___cloned_of == 'function')
        fn = fn.prototype.___cloned_of;

      temp = function () { return fn.apply(this, arguments); };

      // Save mark as cloned. Done in its prototype
      // to not appear in the list of 'owned' properties.
      tempProto.___cloned_of = this;
      // Replace toString to return the original source:
      tempProto.toString = function () {
        return fn.toString();
      };
      // The name cannot be set, will just be anonymous
      //temp.name = that.name;
    } else {
      // This way on capable browsers preserve the original name,
      // do a real independent copy and avoid function subcalls that
      // can degrate performance after lot of 'clonning'.
      var f = Function;
      temp = (new f('return ' + contents))();
    }

    temp.prototype = tempProto;
    // Copy any properties it owns
    extend(temp, this);

    return temp;
  };
}