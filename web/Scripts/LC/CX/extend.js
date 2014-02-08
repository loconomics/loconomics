/**
  Deep Extend object utility, is recursive to get all the depth
  but only for the properties owned by the object,
  if you need the non-owned properties to in the object,
  consider extend from the source prototype too (and maybe to
  the destination prototype instead of the instance, but up to too).

  If function objects include a 'clone' method, that will be used instead
  of the default reference copy.
  Its recommended install a Function.prototype.clone, by the way.
**/
function extend(destination, source) {
  for (var property in source) {
    if (!source.hasOwnProperty(property))
      continue;

    if (['object', 'function'].indexOf(typeof destination[property]) != -1 &&
            typeof source[property] == 'object')
      extend(destination[property], source[property]);
    else if (typeof destination[property] == 'function' &&
                 typeof source[property] == 'function') {
      var orig = destination[property];
      // Allow the Function.clone method (if exist or was polyfilled)
      var sour = (typeof (source[property].clone) == 'function') ? source[property].clone() : source[property];
      destination[property] = sour;
      // Any previous attached property
      extend(destination[property], orig);
      // Any source attached property
      extend(destination[property], source[property]);
    }
    else
      destination[property] = source[property];
  }

  // So much 'source' arguments as wanted. In ES6 will be 'source..'
  if (arguments.length > 2) {
    var nexts = Array.prototype.slice.call(arguments, 0);
    nexts.splice(1, 1);
    extend.apply(this, nexts);
  }

  return destination;
}

(function() {
  function plugIn(obj) {
    obj = Object.prototype;
    obj.extendMe = function extendMe() {
      extend.apply(this, [this].concat(Array.prototype.slice.call(arguments)));
    };
    obj.extend = function extendInstance() {
      var args = Array.prototype.slice.call(arguments),
        // If last argument is a function, is considered a constructor
        // of the new class/object then we extend its prototype.
        // We use an empty object otherwise.
        theConstructor = typeof args[args.length - 1] == 'function' ?
          args.splice(args.length - 1)[0] :
          null,
        base = theConstructor ? theConstructor.prototype : {},
        // If the object used to extend from is a function, is considered
        // a constructor, then we extend from its prototype, otherwise itself.
        extended = typeof this == 'function' ?
          this.prototype :
          this;

      var newBase = extend.apply(this, [base, extended].concat(args));
      return theConstructor || newBase;
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    exports.extend = extend;
    exports.plugIn = plugIn;
  } else {
    // global scope
    plugIn();
  }
})();