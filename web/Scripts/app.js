require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Array Remove - By John Resig (MIT Licensed)
/*Array.prototype.remove = function (from, to) {
IagoSRL: it seems incompatible with Modernizr loader feature loading Zendesk script,
moved from prototype to a class-static method */
function arrayRemove(anArray, from, to) {
    var rest = anArray.slice((to || from) + 1 || anArray.length);
    anArray.length = from < 0 ? anArray.length + from : from;
    return anArray.push.apply(anArray, rest);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = arrayRemove;
} else {
    Array.remove = arrayRemove;
}
},{}],2:[function(require,module,exports){
/**
  Bindable UI Component.
  It relies on Component but adds DataSource capabilities
**/
var DataSource = require('./DataSource');
var Component = require('./Component');
var extend = require('./extend');
var mevents = require('events');

/**
Reusing the original fetchData method but adding classes to our
component element for any visual notification of the data loading.
Method get extended with isPrefetching method for different
classes/notifications dependant on that flag, by default false:
**/
var componentFetchData = function bindableComponentFetchData(queryData, mode, isPrefetching) {
  var cl = isPrefetching ? this.classes.prefetching : this.classes.fetching;
  this.$el.addClass(cl);
  var that = this;

  var req = DataSource.prototype.fetchData.call(this, queryData, mode)
  .done(function () {
    that.$el.removeClass(cl || '_');
    // Unmark any posible previous error since we had a succes load:
    that.hasError(false);
  });

  return req;
};
/**
Replacing, but reusing internals, the default onerror callback for the
fetchData function to add notification classes to our component model
**/
componentFetchData.onerror = function bindableComponentFechDataOnerror(x, s, e) {
  DataSource.prototype.fetchData.onerror.call(this, x, s, e);
  // Remove fetching classes:
  this.$el
  .removeClass(this.classes.fetching || '_')
  .removeClass(this.classes.prefetching || '_');
  // Mark error:
  this.hasError({ name: 'fetchDataError', request: x, status: s, exception: e });
};

/**
  BindableComponent class
**/
var BindableComponent = Component.extend(
  DataSource.prototype,
  // Prototype
  {
    classes: {
      fetching: 'is-loading',
      prefetching: 'is-preloading',
      disabled: 'is-disabled',
      hasDataError: 'has-dataError'
    },
    fetchData: componentFetchData,
    // What attribute name use to mark elements inside the component
    // with the property from the source to bind.
    // The prefix 'data-' in custom attributes is required by html5,
    // just specify the second part, being 'bind' the attribute
    // name to use is 'data-bind'
    dataBindAttribute: 'bind',
    // Default bindData implementation, can be replace on extended components
    // to something more complex (list/collections, sub-objects, custom structures
    // and visualization --keep as possible the use of dataBindAttribute for reusable code).
    // This implementation works fine for data as plain object with 
    // simple types as properties (not objects or arrays inside them).
    bindData: function bindData() {
      if (!this.data) return;
      // Check every element in the component with a bind
      // property and update it with the value of that property
      // from the data source
      var att = this.dataBindAttribute;
      var attrSelector = '[data-' + att + ']';
      var that = this;
      this.$el.find(attrSelector).each(function () {
        var $t = $(this),
          prop = $t.data(att),
          bindedValue = that.data[prop];

        if ($t.is(':input'))
          $t.val(bindedValue);
        else
          $t.text(bindedValue);
      });
    },
    /**
      It gets the latest error happened in the component (or null/falsy if there is no),
      or sets the error (passing it in the optional value) returning the previous registered error.
      Its recommended an object as error instead of a simple value or string (that can get confused
      with falsy if is empty string or 0, and allow attach more structured information) with an
      informational property 'name'.
      To set off the error, pass null value or false.
    **/
    hasError: function hasError(errorToSet) {
      if (typeof (errorToSet) == 'undefined') {
        return this._error || null;
      }
      var prev = this._error || null;
      this._error = errorToSet;
      this.events.emit('hasErrorChanged', errorToSet, prev);
      return prev;
    }
  },
  // Constructor
  function BindableComponent(element, options) {
    Component.call(this, element, options);
    
    // It has an event emitter:
    this.events = new mevents.EventEmitter();
    // Events object has a property to access this object,
    // usefull to reference as 'this.component' from inside
    // event handlers:
    this.events.component = this;

    this.data = this.$el.data('source') || this.data || {};
    if (typeof (this.data) == 'string')
      this.data = JSON.parse(this.data);

    // On html source url configuration:
    this.url = this.$el.data('source-url') || this.url;

    // Classes on fetchDataError
    var that = this;
    this.events.on('hasErrorChanged', function (err, prevErr) {
      if (err && err.name == 'fetchDataError') {
        that.$el.addClass(that.classes.hasDataError);
      } else if (prevErr && prevErr.name == 'fetchDataError') {
        that.$el.removeClass(that.classes.hasDataError || '_');
      }
    });

    // TODO: 'change' event handlers on forms with data-bind to update its value at this.data
    // TODO: auto 'bindData' on fetchData ends? configurable, bindDataMode{ inmediate, notify }
  }
);

// Public module:
module.exports = BindableComponent;
},{"./Component":3,"./DataSource":4,"./extend":6,"events":98}],3:[function(require,module,exports){
/** Component class: wrapper for
  the logic and behavior around
  a DOM element
**/
var extend = require('./extend');

function Component(element, options) {
  this.el = element;
  this.$el = $(element);
  extend(this, options);
  // Use the jQuery 'data' storage to preserve a reference
  // to this instance (useful to retrieve it from document)
  this.$el.data('component', this);
}

extend.plugIn(Component);
extend.plugIn(Component.prototype);

module.exports = Component;
},{"./extend":6}],4:[function(require,module,exports){
/**
  DataSource class to simplify fetching data as JSON
  to fill a local cache.
**/
var $ = require('jquery');
var fetchJSON = $.getJSON,
    extend = function () { return $.extend.apply(this, [true].concat(Array.prototype.slice.call(arguments, 0))); };

// TODO: replace each property of functions by instance properties, since that properties become
// shared between instances and is not wanted

var reqModes = DataSource.requestModes = {
  // Parallel request, no matter of others
  multiple: 0,
  // Will avoid a request if there is one running
  single: 1,
  // Latest requet will replace any previous one (previous will abort)
  replace: 2
};

var updModes = DataSource.updateModes = {
  // Every new data update, new content is added incrementally
  // (overwrite coincident content, append new content, old content
  // get in place)
  incremental: 0,
  // On new data update, new data totally replace the previous one
  replacement: 1
};

/**
Update the data store or cache with the given one.
There are different modes, this manages that logic and
its own configuration.
Is decoupled from the prototype but
it works only as part of a DataSource instance.
**/
function updateData(data, mode) {
  switch (mode || this.updateData.defaultUpdateMode) {

    case updModes.replacement:
      this.data = data;
      break;

    //case updModes.incremental:  
    default:
      // In case initial data is null, assign the result to itself:
      this.data = extend(this.data, data);
      break;
  }
}

/** Default value for the configurable update mode:
**/
updateData.defaultUpdateMode = updModes.incremental;

/**
Fetch the data from the server.
Here is decoupled from the rest of the prototype for
commodity, but it can works only as part of a DataSource instance.
**/
function fetchData(query, mode) {
  query = extend({}, this.query, query);
  switch (mode || this.fetchData.defaultRequestMode) {

    case reqModes.single:
      if (this.fetchData.requests.length) return null;
      break;

    case reqModes.replace:
      for (var i = 0; i < this.fetchData.requests.length; i++) {
        try {
          this.fetchData.requests[i].abort();
        } catch (ex) { }
        this.fetchData.requests = [];
      }
      break;

    // Just do nothing for multiple or default     
    //case reqModes.multiple:  
    //default: 
  }

  var that = this;
  var req = this.fetchData.proxy(
    this.url,
    query,
    function (data, t, xhr) {
      var ret = that.updateData(data);
      that.fetchData.requests.splice(that.fetchData.requests.indexOf(req), 1);
      //delete fetchData.requests[fetchData.requests.indexOf(req)];

      if (ret && ret.name) {
        // Update data emits error, the Ajax still resolves as 'success' because of the request, but
        // we need to execute the error, but we pipe it to ensure is done after other 'done' callbacks
        req.always(function () {
          that.fetchData.onerror.call(that, null, ret.name, ret);
        });
      }

    }
  )
  .fail($.proxy(this.fetchData.onerror, this));
  this.fetchData.requests.push(req);

  return req;
}

// Defaults fetchData properties, they are decoupled to allow
// replacement, and inside the fetchData function to don't
// contaminate the object namespace.

/* Collection of active (fetching) requests to the server
*/
fetchData.requests = [];

/* Decoupled functionality to perform the Ajax operation,
this allows overwrite this behavior to implement another
ways, like a non-jQuery implementation, a proxy to fake server
for testing or proxy to local storage if online, etc.
It must returns the used request object.
*/
fetchData.proxy = fetchJSON;

/* By default, fetchData allows multiple simultaneos connection,
since the storage by default allows incremental updates rather
than replacements.
*/
fetchData.defaultRequestMode = reqModes.multiple;

/* Default notification of error on fetching, just logging,
can be replaced.
It receives the request object, status and error.
*/
fetchData.onerror = function error(x, s, e) {
  if (console && console.error) console.error('Fetch data error %o', e);
};

/**
  DataSource class
**/
// Constructor: everything is in the prototype.
function DataSource() { }
DataSource.prototype = {
  data: null,
  url: '/',
  // query: object with default extra information to append to the url
  // when fetching data, extended with the explicit query specified
  // executing fetchData(query)
  query: {},
  updateData: updateData,
  fetchData: fetchData
  // TODO  pushData: function(){ post/put this.data to url  }
};

// Class as public module:
module.exports = DataSource;
},{}],5:[function(require,module,exports){
/**
  Loconomics specific Widget based on BindableComponent.
  Just decoupling specific behaviors from something more general
  to easily track that details, and maybe future migrations to
  other front-end frameworks.
**/
var DataSource = require('./DataSource');
var BindableComponent = require('./BindableComponent');

var LcWidget = BindableComponent.extend(
  // Prototype
  {
    // Replacing updateData to implement the particular
    // JSON scheme of Loconomics, but reusing original
    // logic inherit from DataSource
    updateData: function (data, mode) {
      if (data && data.Code === 0) {
        DataSource.prototype.updateData.call(this, data.Result, mode);
      } else {
        // Error message in the JSON
        return { name: 'data-format', message: data.Result ? data.Result.ErrorMessage ? data.Result.ErrorMessage : data.Result : "unknow" };
      }
    }
  },
  // Constructor
  function LcWidget(element, options) {
    BindableComponent.call(this, element, options);
  }
);

module.exports = LcWidget;
},{"./BindableComponent":2,"./DataSource":4}],6:[function(require,module,exports){
/**
  Deep Extend object utility, is recursive to get all the depth
  but only for the properties owned by the object,
  if you need the non-owned properties to in the object,
  consider extend from the source prototype too (and maybe to
  the destination prototype instead of the instance, but up to too).
**/

/* jquery implementation:
var $ = require('jquery');
extend = function () {
return $.extend.apply(this, [true].concat(Array.prototype.slice.call(arguments, 0))); 
};*/

var extend = function extend(destination, source) {
  for (var property in source) {
    if (!source.hasOwnProperty(property))
      continue;

    // Allow properties removal, if source contains value 'undefined'.
    // There are no special considerations on Arrays, to don't get undesired
    // results just the wanted is to replace specific positions, normally.
    if (source[property] === undefined) {
      delete destination[property];
      continue;
    }

    if (['object', 'function'].indexOf(typeof destination[property]) != -1 &&
            typeof source[property] == 'object')
      extend(destination[property], source[property]);
    else if (typeof destination[property] == 'function' &&
                 typeof source[property] == 'function') {
      var orig = destination[property];
      // Clone function
      var sour = cloneFunction(source[property]);
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
};

extend.plugIn = function plugIn(obj) {
  obj = obj || Object.prototype;
  obj.extendMe = function extendMe() {
    extend.apply(this, [this].concat(Array.prototype.slice.call(arguments)));
  };
  obj.extend = function extendInstance() {
    var args = Array.prototype.slice.call(arguments),
      // If the object used to extend from is a function, is considered
      // a constructor, then we extend from its prototype, otherwise itself.
      constructorA = typeof this == 'function' ? this : null,
      baseA = constructorA ? this.prototype : this,
      // If last argument is a function, is considered a constructor
      // of the new class/object then we extend its prototype.
      // We use an empty object otherwise.
      constructorB = typeof args[args.length - 1] == 'function' ?
        args.splice(args.length - 1)[0] :
        null,
      baseB = constructorB ? constructorB.prototype : {};

    var extendedResult = extend.apply(this, [baseB, baseA].concat(args));
    // If both are constructors, we want the static methods to be copied too:
    if (constructorA && constructorB)
      extend(constructorB, constructorA);

    // If we are extending a constructor, we return that, otherwise the result
    return constructorB || extendedResult;
  };
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = extend;
} else {
  // global scope
  extend.plugIn();
}

/*-------------------------
  Clone Utils
*/
function cloneObject(obj) {
  return extend({}, obj);
}

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

function cloneFunction(fn) {
  var temp;
  var contents = fn.toString();
  // Copy to a new instance of the same prototype, for the not 'owned' properties.
  // Assinged at the end
  var tempProto = Object.create(fn.prototype);

  // DISABLED the contents-copy part because it fails with closures
  // generated by the original function, using the sub-call way ever
  if (true || !testFunction.test(contents)) {
    // Check if is already a cloned copy, to
    // reuse the original code and avoid more than
    // one depth in stack calls (great!)
    if (typeof fn.prototype.___cloned_of == 'function')
      fn = fn.prototype.___cloned_of;

    temp = function () { return fn.apply(this, Array.prototype.slice.call(arguments)); };

    // Save mark as cloned. Done in its prototype
    // to not appear in the list of 'owned' properties.
    tempProto.___cloned_of = fn;
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
  extend(temp, fn);

  return temp;
}

function clonePlugIn() {
  if (typeof Function.prototype.clone !== 'function') {
    Function.prototype.clone = function clone() { return cloneFunction(this); };
  }
  if (typeof Object.prototype.clone !== 'function') {
    Ojbect.prototype.clone = function clone() { return cloneObject(this); };
  }
}

extend.cloneObject = cloneObject;
extend.cloneFunction = cloneFunction;
extend.clonePlugIn = clonePlugIn;

},{}],7:[function(require,module,exports){
/**
* Cookies management.
* Most code from http://stackoverflow.com/a/4825695/1622346
*/
var Cookie = {};

Cookie.set = function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
};
Cookie.get = function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
};

if (typeof module !== 'undefined' && module.exports)
    module.exports = Cookie;
},{}],"LC/FacebookConnect":[function(require,module,exports){
module.exports=require('cwp+TC');
},{}],"cwp+TC":[function(require,module,exports){
/** Connect account with Facebook
**/
var
  $ = require('jquery'),
  loader = require('./loader'),
  blockPresets = require('./blockPresets'),
  LcUrl = require('./LcUrl'),
  popup = require('./popup'),
  redirectTo = require('./redirectTo');
require('jquery.blockUI');

function FacebookConnect(options) {
  $.extend(this, options);
  if (!$('#fb-root').length)
    $('<div id="fb-root" style="display: none"></div>').appendTo('body');
}

FacebookConnect.prototype = {
  appId: null,
  lang: 'en_US',
  resultType: 'json', // 'redirect'
  fbUrlBase: '//connect.facebook.net/@(lang)/all.js',
  serverUrlBase: LcUrl.LangPath + 'Account/Facebook/@(urlSection)/?Redirect=@(redirectUrl)&profile=@(profileUrl)',
  redirectUrl: '',
  profileUrl: '',
  urlSection: '',
  loadingText: 'Verifing',
  permissions: '',
  libLoadedEvent: 'FacebookConnectLibLoaded',
  connectedEvent: 'FacebookConnectConnected'
};

FacebookConnect.prototype.getFbUrl = function() {
  return this.fbUrlBase.replace(/@\(lang\)/g, this.lang);
};

FacebookConnect.prototype.getServerUrl = function() {
  return this.serverUrlBase
  .replace(/@\(redirectUrl\)/g, this.redirectUrl)
  .replace(/@\(profileUrl\)/g, this.profileUrl)
  .replace(/@\(urlSection\)/g, this.urlSection);
};

FacebookConnect.prototype.loadLib = function () {
  // Only if is not loaded still
  // (Facebook script attach itself as the global variable 'FB')
  if (!window.FB && !this._loadingLib) {
    this._loadingLib = true;
    var that = this;
    loader.load({
      scripts: [this.getFbUrl()],
      complete: function () {
        FB.init({ appId: that.appId, status: true, cookie: true, xfbml: true });
        that.loadingLib = false;
        $(document).trigger(that.libLoadedEvent);
      },
      completeVerification: function () {
        return !!window.FB;
      }
    });
  }
};

FacebookConnect.prototype.processResponse = function (response) {
  if (response.authResponse) {
    //console.log('FacebookConnect: Welcome!');
    var url = this.getServerUrl();
    if (this.resultType == "redirect") {
      redirectTo(url);
    } else if (this.resultType == "json") {
      popup(url, 'small', null, this.loadingText);
      $(document).trigger(this.connectedEvent);
    }

    /*FB.api('/me', function (response) {
    console.log('FacebookConnect: Good to see you, ' + response.name + '.');
    });*/
  } else {
    //console.log('FacebookConnect: User cancelled login or did not fully authorize.');
  }
};

FacebookConnect.prototype.onLibReady = function (callback) {
  if (window.FB)
    callback();
  else {
    this.loadLib();
    $(document).on(this.libLoadedEvent, callback);
  }
};

FacebookConnect.prototype.connect = function () {
  var that = this;
  this.onLibReady(function () {
    FB.login($.proxy(that.processResponse, that), { scope: that.permissions });
  });
};

FacebookConnect.prototype.autoConnectOn = function (selector) {
  jQuery(document).on('click', selector || 'a.facebook-connect', $.proxy(this.connect, this));
};

module.exports = FacebookConnect;
},{"./LcUrl":10,"./blockPresets":45,"./loader":72,"./popup":78,"./redirectTo":80}],10:[function(require,module,exports){
/** Implements a similar LcUrl object like the server-side one, basing
    in the information attached to the document at 'html' tag in the 
    'data-base-url' attribute (thats value is the equivalent for AppPath),
    and the lang information at 'data-culture'.
    The rest of URLs are built following the window.location and same rules
    than in the server-side object.
**/

var base = document.documentElement.getAttribute('data-base-url'),
    lang = document.documentElement.getAttribute('data-culture'),
    l = window.location,
    url = l.protocol + '//' + l.host;
// location.host includes port, if is not the default, vs location.hostname

base = base || '/';

var LcUrl = {
    SiteUrl: url,
    AppPath: base,
    AppUrl: url + base,
    LangId: lang,
    LangPath: base + lang + '/',
    LangUrl: url + base + lang
};
LcUrl.LangUrl = url + LcUrl.LangPath;
LcUrl.JsonPath = LcUrl.LangPath + 'JSON/';
LcUrl.JsonUrl = url + LcUrl.JsonPath;

module.exports = LcUrl;
},{}],11:[function(require,module,exports){
/* Loconomics specific Price, fees and hour-price calculation
    using some static methods and the Price class.
*/
var mu = require('./mathUtils');

/* Class Price to calculate a total price based on fees information (fixed and rate)
    and desired decimals for approximations.
*/
function Price(basePrice, fee, roundedDecimals) {
    // fee parameter can be a float number with the feeRate or an object
    // that includes both a feeRate and a fixedFeeAmount
    // Extracting fee values into local vars:
    var feeRate = 0, fixedFeeAmount = 0;
    if (fee.fixedFeeAmount || fee.feeRate) {
        fixedFeeAmount = fee.fixedFeeAmount || 0;
        feeRate = fee.feeRate || 0;
    } else
        feeRate = fee;

    // Calculating:
    // The roundTo with a big fixed decimals is to avoid the
    // decimal error of floating point numbers
    var totalPrice = mu.ceilTo(mu.roundTo(basePrice * (1 + feeRate) + fixedFeeAmount, 12), roundedDecimals);
    // final fee price is calculated as a substraction, but because javascript handles
    // float numbers only, a round operation is required to avoid an irrational number
    var feePrice = mu.roundTo(totalPrice - basePrice, 2);

    // Creating object with full details:
    this.basePrice = basePrice;
    this.feeRate = feeRate;
    this.fixedFeeAmount = fixedFeeAmount;
    this.roundedDecimals = roundedDecimals;
    this.totalPrice = totalPrice;
    this.feePrice = feePrice;
}

/** Calculate and returns the price and relevant data as an object for
time, hourlyRate (with fees) and the hourlyFee.
The time (@duration) is used 'as is', without transformation, maybe you can require
use LC.roundTimeToQuarterHour before pass the duration to this function.
It receives the parameters @hourlyPrice and @surchargePrice as LC.Price objects.
@surchargePrice is optional.
**/
function calculateHourlyPrice(duration, hourlyPrice, surchargePrice) {
    // If there is no surcharge, get zeros
    surchargePrice = surchargePrice || { totalPrice: 0, feePrice: 0, basePrice: 0 };
    // Get hours from rounded duration:
    var hours = mu.roundTo(duration.totalHours(), 2);
    // Calculate final prices
    return {
        totalPrice:     mu.roundTo(hourlyPrice.totalPrice * hours + surchargePrice.totalPrice * hours, 2),
        feePrice:       mu.roundTo(hourlyPrice.feePrice * hours + surchargePrice.feePrice * hours, 2),
        subtotalPrice:  mu.roundTo(hourlyPrice.basePrice * hours + surchargePrice.basePrice * hours, 2),
        durationHours:  hours
    };
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        Price: Price,
        calculateHourlyPrice: calculateHourlyPrice
    };
},{"./mathUtils":73}],12:[function(require,module,exports){
// http://stackoverflow.com/questions/2593637/how-to-escape-regular-expression-in-javascript
RegExp.quote = function (str) {
  return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

},{}],"LC/SimpleSlider":[function(require,module,exports){
module.exports=require('aFoCK0');
},{}],"aFoCK0":[function(require,module,exports){
/**
  A very simple slider implementation initially created
  for the provider-welcome landing page and
  other similar uses.
**/
var $ = require('jquery');
require('./RegExp.quote');

var SimpleSlider = module.exports = function SimpleSlider(opts) {
  $.extend(true, this, opts);

  this.element = $(this.element);
  this.currentIndex = 0;

  /**
  Actions handler to move slides
  **/
  var checkHref = new RegExp('^#' + RegExp.quote(this.hrefPrefix) + '(.*)'),
    that = this;
  this.element.on('click', 'a', function () {
    var href = this.getAttribute('href');
    var res = checkHref.exec(href);

    if (res && res.length > 1) {
      var index = res[1];
      if (index == 'previous') {
        that.goSlide(that.currentIndex - 1);
      }
      else if (index == 'next') {
        that.goSlide(that.currentIndex + 1);
      }
      else if (/\d+/.test(index)) {
        that.goSlide(parseInt(index));
      }

      return false;
    }
  });

  /**
  Method: Do all the setup on slider and slides
  to ensure the movement will work fine.
  Its done automatic on
  initializing, is just a public method for 
  convenience (maybe to be call if slides are
  added/removed after init).
  **/
  this.redraw = function slidesReposition() {
    var slides = this.getSlides(),
      c = this.getSlidesContainer();
    // Look for the container size, from the 
    // bigger slide:
    var 
      w = 0,
      h = 0;
    slides.each(function () {
      var 
        t = $(this),
        tw = t.outerWidth(),
        th = t.outerHeight();
      if (tw > w)
        w = tw;
      if (th > h)
        h = th;
    });

    // CSS setup, 
    // all slides in the same line,
    // all with same size (extra spacing can
    // be given with CSS)
    c.css({
      width: w - (c.outerWidth() - c.width()),
      //height: h - (c.outerHeight() - c.height()),
      position: 'relative',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    });

    slides.css({
      whiteSpace: 'normal',
      display: 'inline-block'
    }).each(function () {
      var t = $(this);
      t.css({
        width: w - (t.outerWidth() - t.width())
        //,height: h - (t.outerHeight() - t.height())
      });
    });

    // Repositionate at the beggining:
    c[0].scrollLeft = 0;

  };

  /**
  Method: Go to a slide by index
  **/
  this.goSlide = function goSlide(index) {
    var prev = this.currentIndex;
    if (prev == index)
      return;

    // Check bounds
    if (index < 1)
      return false;
    var slides = this.getSlides();
    if (index > slides.length)
      return false;

    // Good index, set as current
    this.currentIndex = index;
    // Set links to this as current, removing any previous:
    this.element.find('[href=#' + this.hrefPrefix + index + ']')
    .addClass(this.currentSlideClass)
    .parent('li').addClass(this.currentSlideClass);
    this.element.find('[href=#' + this.hrefPrefix + prev + ']')
    .removeClass(this.currentSlideClass)
    .parent('li').removeClass(this.currentSlideClass);

    var 
      slide = $(slides.get(index - 1)),
      c = this.getSlidesContainer(),
      left = c.scrollLeft() + slide.position().left;

    c.stop().animate({ scrollLeft: left }, this.duration);

  };

  /**
  Method: Get the jQuery collection of slides
  **/
  this.getSlides = function getSlides() {
    return this.element
    .find(this.selectors.slides)
    .find(this.selectors.slide);
  };

  /**
  Method: Get the jQuery element for the container of slides
  **/
  this.getSlidesContainer = function getSlidesContainer() {
    return this.element
    .find(this.selectors.slides);
  };

  /** Last init steps
  **/
  this.redraw();
};

SimpleSlider.prototype = {
  element: null,
  selectors: {
    slides: '.slides',
    slide: 'li.slide'
  },
  currentSlideClass: 'js-isCurrent',
  hrefPrefix: 'goSlide_',
  // Duration of each slide in milliseconds
  duration: 1000
};
},{"./RegExp.quote":12}],15:[function(require,module,exports){
/** Polyfill for string.contains
**/
if (!('contains' in String.prototype))
    String.prototype.contains = function (str, startIndex) { return -1 !== this.indexOf(str, startIndex); };
},{}],"StringFormat":[function(require,module,exports){
module.exports=require('KqXDvj');
},{}],"KqXDvj":[function(require,module,exports){
/** ======================
 * A simple String Format
 * function for javascript
 * Author: Iago Lorenzo Salgueiro
 * Module: CommonJS
 */
module.exports = function stringFormat() {
  var args = arguments;
	var formatted = args[0];
	for (var i = 0; i < args.length; i++) {
		var regexp = new RegExp('\\{'+i+'\\}', 'gi');
		formatted = formatted.replace(regexp, args[i+1]);
	}
	return formatted;
};
},{}],18:[function(require,module,exports){
/**
    General auto-load support for tabs: 
    If there is no content when focused, they use the 'reload' jquery plugin
    to load its content -tabs need to be configured with data-source-url attribute
    in order to know where to fetch the content-.
**/
var $ = require('jquery');
require('./jquery.reload');

// Dependency TabbedUX from DI
exports.init = function (TabbedUX) {
    // TabbedUX.setup.tabBodySelector || '.tab-body'
    $('.tab-body').on('tabFocused', function () {
        var $t = $(this);
        if ($t.children().length === 0)
            $t.reload();
    });
};
},{"./jquery.reload":68}],19:[function(require,module,exports){
/**
    This adds notifications to tabs from the TabbedUX system using
    the changesNotification utility that detects not saved changes on forms,
    showing warning messages to the
    user and marking tabs (and sub-tabs / parent-tabs properly) to
    don't lost changes made.
    A bit of CSS for the assigned classes will allow for visual marks.

    AKA: Don't lost data! warning message ;-)
**/
var $ = require('jquery'),
    smoothBoxBlock = require('./smoothBoxBlock'),
    changesNotification = require('./changesNotification');

// TabbedUX dependency as DI
exports.init = function (TabbedUX, targetSelector) {
    var target = $(targetSelector || '.changes-notification-enabled');
    changesNotification.init({ target: target });

    // Adding change notification to tab-body divs
    // (outside the LC.ChangesNotification class to leave it as generic and simple as possible)
    $(target).on('lcChangesNotificationChangeRegistered', 'form', function () {
        $(this).parents('.tab-body').addClass('has-changes')
            .each(function () {
                // Adding class to the menu item (tab title)
                TabbedUX.getTabContext(this).menuitem.addClass('has-changes')
                .attr('title', $('#lcres-changes-not-saved').text());
            });
    })
    .on('lcChangesNotificationSaveRegistered', 'form', function (e, f, els, full) {
        if (full)
            $(this).parents('.tab-body:not(:has(form.has-changes))').removeClass('has-changes')
            .each(function () {
                // Removing class from the menu item (tab title)
                TabbedUX.getTabContext(this).menuitem.removeClass('has-changes')
                    .attr('title', null);
            });
    })
    // To avoid user be notified of changes all time with tab marks, we added a 'notify' class
    // on tabs when a change of tab happens
    .find('.tab-body').on('tabUnfocused', function (event, focusedCtx) {
        var mi = TabbedUX.getTabContext(this).menuitem;
        if (mi.is('.has-changes')) {
            mi.addClass('notify-changes'); //has-tooltip
            // Show notification popup
            var d = $('<div class="warning">@0</div><div class="actions"><input type="button" class="action continue" value="@2"/><input type="button" class="action stop" value="@1"/></div>'
                .replace(/@0/g, LC.getText('changes-not-saved'))
                .replace(/@1/g, LC.getText('tab-has-changes-stay-on'))
                .replace(/@2/g, LC.getText('tab-has-changes-continue-without-change')));
            d.on('click', '.stop', function () {
                smoothBoxBlock.close(window);
            })
            .on('click', '.continue', function () {
                smoothBoxBlock.close(window);
                // Remove 'has-changes' to avoid future blocks (until new changes happens of course ;-)
                mi.removeClass('has-changes');
                TabbedUX.focusTab(focusedCtx.tab.get(0));
            });
            smoothBoxBlock.open(d, window, 'not-saved-popup', { closable: false, center: true });

            // Ever return false to stop current tab focus
            return false;
        }
    })
    .on('tabFocused', function () {
        TabbedUX.getTabContext(this).menuitem.removeClass('notify-changes'); //has-tooltip
    });
};

},{"./changesNotification":"f5kckb","./smoothBoxBlock":"KQGzNM"}],20:[function(require,module,exports){
/** TabbedUX: Tabbed interface logic; with minimal HTML using class 'tabbed' for the
container, the object provides the full API to manipulate tabs and its setup
listeners to perform logic on user interaction.
**/
var $ = jQuery || require('jquery');
require('./jquery.hasScrollBar');

var TabbedUX = {
    init: function () {
        $('body').delegate('.tabbed > .tabs > li:not(.tabs-slider) > a', 'click', function (e) {
            var $t = $(this);
            if (TabbedUX.focusTab($t.attr('href'))) {
                var st = $(document).scrollTop();
                location.hash = $t.attr('href');
                $('html,body').scrollTop(st);
            }
            e.preventDefault();
        })
        .delegate('.tabbed > .tabs-slider > a', 'mousedown', TabbedUX.startMoveTabsSlider)
        .delegate('.tabbed > .tabs-slider > a', 'mouseup mouseleave', TabbedUX.endMoveTabsSlider)
        // the click return false is to disable standar url behavior
        .delegate('.tabbed > .tabs-slider > a', 'click', function () { return false; })
        .delegate('.tabbed > .tabs-slider-limit', 'mouseenter', TabbedUX.startMoveTabsSlider)
        .delegate('.tabbed > .tabs-slider-limit', 'mouseleave', TabbedUX.endMoveTabsSlider)
        .delegate('.tabbed > .tabs > li.removable', 'click', function (e) {
            // Only on direct clicks to the tab, to avoid
            // clicks to the tab-link (that select/focus the tab):
            if (e.target == e.currentTarget)
                TabbedUX.removeTab(null, this);
        });

        // Init page loaded tabbed containers:
        $('.tabbed').each(function () {
            var $t = $(this);
            // Consistence check: this must be a valid container, this is, must have .tabs
            if ($t.children('.tabs').length === 0)
                return;
            // Init slider
            TabbedUX.setupSlider($t);
            // Clean white spaces (they create excesive separation between some tabs)
            $('.tabs', this).contents().each(function () {
                // if this is a text node, remove it:
                if (this.nodeType == 3)
                    $(this).remove();
            });
        });
    },
    moveTabsSlider: function () {
        $t = $(this);
        var dir = $t.hasClass('tabs-slider-right') ? 1 : -1;
        var tabsSlider = $t.parent();
        var tabs = tabsSlider.siblings('.tabs:eq(0)');
        tabs[0].scrollLeft += 20 * dir;
        TabbedUX.checkTabSliderLimits(tabsSlider.parent(), tabs);
        return false;
    },
    startMoveTabsSlider: function () {
        var t = $(this);
        var tabs = t.closest('.tabbed').children('.tabs:eq(0)');
        // Stop previous animations:
        tabs.stop(true);
        var speed = 0.3; /* speed unit: pixels/miliseconds */
        var fxa = function () { TabbedUX.checkTabSliderLimits(tabs.parent(), tabs); };
        var time;
        if (t.hasClass('right')) {
            // Calculate time based on speed we want and how many distance there is:
            time = (tabs[0].scrollWidth - tabs[0].scrollLeft - tabs.width()) * 1 / speed;
            tabs.animate({ scrollLeft: tabs[0].scrollWidth - tabs.width() },
            { duration: time, step: fxa, complete: fxa, easing: 'swing' });
        } else {
            // Calculate time based on speed we want and how many distance there is:
            time = tabs[0].scrollLeft * 1 / speed;
            tabs.animate({ scrollLeft: 0 },
            { duration: time, step: fxa, complete: fxa, easing: 'swing' });
        }
        return false;
    },
    endMoveTabsSlider: function () {
        var tabContainer = $(this).closest('.tabbed');
        tabContainer.children('.tabs:eq(0)').stop(true);
        TabbedUX.checkTabSliderLimits(tabContainer);
        return false;
    },
    checkTabSliderLimits: function (tabContainer, tabs) {
        tabs = tabs || tabContainer.children('.tabs:eq(0)');
        // Set visibility of visual limiters:
        tabContainer.children('.tabs-slider-limit-left').toggle(tabs[0].scrollLeft > 0);
        tabContainer.children('.tabs-slider-limit-right').toggle(
            (tabs[0].scrollLeft + tabs.width()) < tabs[0].scrollWidth);
    },
    setupSlider: function (tabContainer) {
        var ts = tabContainer.children('.tabs-slider');
        if (tabContainer.children('.tabs').hasScrollBar({ x: -2 }).horizontal) {
            tabContainer.addClass('has-tabs-slider');
            if (ts.length === 0) {
                ts = document.createElement('div');
                ts.className = 'tabs-slider';
                $(ts)
                // Arrows:
                    .append('<a class="tabs-slider-left left" href="#">&lt;&lt;</a>')
                    .append('<a class="tabs-slider-right right" href="#">&gt;&gt;</a>');
                tabContainer.append(ts);
                tabContainer
                // Desing details:
                    .append('<div class="tabs-slider-limit tabs-slider-limit-left left" href="#"></div>')
                    .append('<div class="tabs-slider-limit tabs-slider-limit-right right" href="#"></div>');
            } else {
                ts.show();
            }
        } else {
            tabContainer.removeClass('has-tabs-slider');
            ts.hide();
        }
        TabbedUX.checkTabSliderLimits(tabContainer);
    },
    getTabContextByArgs: function (args) {
        if (args.length == 1 && typeof (args[0]) == 'string')
            return this.getTabContext(args[0], null);
        if (args.length == 1 && args[0].tab)
            return args[0];
        else
            return this.getTabContext(
                args.length > 0 ? args[0] : null,
                args.length > 1 ? args[1] : null,
                args.length > 2 ? args[2] : null
            );
    },
    getTabContext: function (tabOrSelector, menuitemOrSelector) {
        var mi, ma, tab, tabContainer;
        if (tabOrSelector) {
            tab = $(tabOrSelector);
            if (tab.length == 1) {
                tabContainer = tab.parents('.tabbed:eq(0)');
                ma = tabContainer.find('> .tabs > li > a[href=#' + tab.get(0).id + ']');
                mi = ma.parent();
            }
        } else if (menuitemOrSelector) {
            ma = $(menuitemOrSelector);
            if (ma.is('li')) {
                mi = ma;
                ma = mi.children('a:eq(0)');
            } else
                mi = ma.parent();
            tabContainer = mi.closest('.tabbed');
            tab = tabContainer.find('>.tab-body@0, >.tab-body-list>.tab-body@0'.replace(/@0/g, ma.attr('href')));
        }
        return { tab: tab, menuanchor: ma, menuitem: mi, tabContainer: tabContainer };
    },
    checkTabContext: function (ctx, functionname, args, isTest) {
        if (!ctx.tab || ctx.tab.length != 1 ||
            !ctx.menuitem || ctx.menuitem.length != 1 ||
            !ctx.tabContainer || ctx.tabContainer.length != 1 || 
            !ctx.menuanchor || ctx.menuanchor.length != 1) {
            if (!isTest && console && console.error)
                console.error('TabbedUX.' + functionname + ', bad arguments: ' + Array.join(args, ', '));
            return false;
        }
        return true;
    },
    getTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'focusTab', arguments, true)) return null;
        return ctx.tab.get(0);
    },
    focusTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'focusTab', arguments)) return;

        // Get previous focused tab, trigger 'tabUnfocused' handler that can
        // stop this focus (returning explicity 'false')
        var prevTab = ctx.tab.siblings('.current');
        if (prevTab.triggerHandler('tabUnfocused', [ctx]) === false)
            return;

        // Check (first!) if there is a parent tab and focus it too (will be recursive calling this same function)
        var parTab = ctx.tab.parents('.tab-body:eq(0)');
        if (parTab.length == 1) this.focusTab(parTab);

        if (ctx.menuitem.hasClass('current') ||
            ctx.menuitem.hasClass('disabled'))
            return false;

        // Unset current menu element
        ctx.menuitem.siblings('.current').removeClass('current')
            .find('>a').removeClass('current');
        // Set current menu element
        ctx.menuitem.addClass('current');
        ctx.menuanchor.addClass('current');

        // Hide current tab-body
        prevTab.removeClass('current');
        // Show current tab-body and trigger event
        ctx.tab.addClass('current')
            .triggerHandler('tabFocused');

        return true;
    },
    focusTabIndex: function (tabContainer, tabIndex) {
        if (tabContainer)
            return this.focusTab(this.getTabContext(tabContainer.find('>.tab-body:eq(' + tabIndex + ')')));
        return false;
    },
    /* Enable a tab, disabling all others tabs -usefull in wizard style pages- */
    enableTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'enableTab', arguments)) return;
        var rtn = false;
        if (ctx.menuitem.is('.disabled')) {
            // Remove disabled class from focused tab and menu item
            ctx.tab.removeClass('disabled')
            .triggerHandler('tabEnabled');
            ctx.menuitem.removeClass('disabled');
            rtn = true;
        }
        // Focus tab:
        this.focusTab(ctx);
        // Disabled tabs and menu items:
        ctx.tab.siblings(':not(.disabled)')
            .addClass('disabled')
            .triggerHandler('tabDisabled');
        ctx.menuitem.siblings(':not(.disabled)')
            .addClass('disabled');
        return rtn;
    },
    showhideDuration: 0,
    showhideEasing: null,
    showTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'showTab', arguments)) return;
        // Show tab and menu item
        ctx.tab.show(this.showhideDuration);
        ctx.menuitem.show(this.showhideEasing);
    },
    hideTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'hideTab', arguments)) return;
        // Show tab and menu item
        ctx.tab.hide(this.showhideDuration);
        ctx.menuitem.hide(this.showhideEasing);
    },
    tabBodyClassExceptions: { 'tab-body': 0, 'tabbed': 0, 'current': 0, 'disabled': 0 },
    createTab: function (tabContainer, idName, label) {
        tabContainer = $(tabContainer);
        // tabContainer must be only one and valid container
        // and idName must not exists
        if (tabContainer.length == 1 && tabContainer.is('.tabbed') &&
            document.getElementById(idName) === null) {
            // Create tab div:
            var tab = document.createElement('div');
            tab.id = idName;
            // Required classes
            tab.className = "tab-body";
            var $tab = $(tab);
            // Get an existing sibling and copy (with some exceptions) their css classes
            $.each(tabContainer.children('.tab-body:eq(0)').attr('class').split(/\s+/), function (i, v) {
                if (!(v in TabbedUX.tabBodyClassExceptions))
                    $tab.addClass(v);
            });
            // Add to container
            tabContainer.append(tab);

            // Create menu entry
            var menuitem = document.createElement('li');
            // Because is a dynamically created tab, is a dynamically removable tab:
            menuitem.className = "removable";
            var menuanchor = document.createElement('a');
            menuanchor.setAttribute('href', '#' + idName);
            // label cannot be null or empty
            $(menuanchor).text(isEmptyString(label) ? "Tab" : label);
            $(menuitem).append(menuanchor);
            // Add to tabs list container
            tabContainer.children('.tabs:eq(0)').append(menuitem);

            // Trigger event, on tabContainer, with the new tab as data
            tabContainer.triggerHandler('tabCreated', [tab]);

            this.setupSlider(tabContainer);

            return tab;
        }
        return false;
    },
    removeTab: function () {
        var ctx = this.getTabContextByArgs(arguments);
        if (!this.checkTabContext(ctx, 'removeTab', arguments)) return;

        // Only remove if is a 'removable' tab
        if (!ctx.menuitem.hasClass('removable') && !ctx.menuitem.hasClass('volatile'))
            return false;
        // If tab is currently focused tab, change to first tab
        if (ctx.menuitem.hasClass('current'))
            this.focusTabIndex(ctx.tabContainer, 0);
        ctx.menuitem.remove();
        var tabid = ctx.tab.get(0).id;
        ctx.tab.remove();

        this.setupSlider(ctx.tabContainer);

        // Trigger event, on tabContainer, with the removed tab id as data
        ctx.tabContainer.triggerHandler('tabRemoved', [tabid]);
        return true;
    },
    setTabTitle: function (tabOrSelector, newTitle) {
        var ctx = TabbedUX.getTabContext(tabOrSelector);
        if (!this.checkTabContext(ctx, 'setTabTitle', arguments)) return;
        // Set an empty string is not allowed, preserve previously:
        if (!isEmptyString(newTitle))
            ctx.menuanchor.text(newTitle);
    }
};

/* More static utilities */

/** Look up the current window location address and try to focus a tab with that
    name, if there is one.
**/
TabbedUX.focusCurrentLocation = function () {
    // If the current location have a hash value but is not a HashBang
    if (/^#[^!]/.test(window.location.hash)) {
        // Try focus a tab with that name
        var tab = TabbedUX.getTab(window.location.hash);
        if (tab)
            TabbedUX.focusTab(tab);
    }
};

/** Look for volatile tabs on the page, if they are
    empty or requesting being 'volatized', remove it.
**/
TabbedUX.checkVolatileTabs = function () {
    $('.tabbed > .tabs > .volatile').each(function () {
        var tab = TabbedUX.getTab(null, this);
        if (tab && ($(tab).children().length === 0 || $(tab).find(':not(.tabbed) .volatize-my-tab').length)) {
            TabbedUX.removeTab(tab);
        }
    });
};

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = TabbedUX;
},{"./jquery.hasScrollBar":65}],21:[function(require,module,exports){
/* slider-tabs logic.
* Execute init after TabbedUX.init to avoid launch animation on page load.
* It requires TabbedUX throught DI on 'init'.
*/
var $ = require('jquery');
exports.init = function initSliderTabs(TabbedUX) {
    $('.tabbed.slider-tabs').each(function () {
        var $t = $(this);
        var $tabs = $t.children('.tab-body');
        var c = $tabs
            .wrapAll('<div class="tab-body-list"/>')
            .end().children('.tab-body-list');
        $tabs.on('tabFocused', function () {
            c.stop(true, false).animate({ scrollLeft: c.scrollLeft() + $(this).position().left }, 1400);
        });
        // Set horizontal scroll to the position of current showed tab, without animation (for page-init):
        var currentTab = $($t.find('>.tabs>li.current>a').attr('href'));
        c.scrollLeft(c.scrollLeft() + currentTab.position().left);
    });
};
},{}],22:[function(require,module,exports){
/**
    Wizard Tabbed Forms.
    It use tabs to manage the different forms-steps in the wizard,
    loaded by AJAX and following to the next tab/step on success.

    Require TabbedUX via DI on 'init'
 **/
var $ = require('jquery'),
    validation = require('./validationHelper'),
    changesNotification = require('./changesNotification'),
    redirectTo = require('./redirectTo'),
    popup = require('./popup'),
    ajaxCallbacks = require('./ajaxCallbacks'),
    blockPresets = require('./blockPresets');
require('jquery.blockUI');

exports.init = function initTabbedWizard(TabbedUX, options) {
    options = $.extend(true, {
        loadingDelay: 0
    }, options);

    $("body").delegate(".tabbed.wizard .next", "click", function () {
        // getting the form
        var form = $(this).closest('form');
        // getting the current wizard step-tab
        var currentStep = form.closest('.tab-body');
        // getting the wizard container
        var wizard = form.closest('.tabbed.wizard');
        // getting the wizard-next-step
        var nextStep = $(this).data('wizard-next-step');

        var ctx = {
            box: currentStep,
            form: form
        };

        // First at all, if unobtrusive validation is enabled, validate
        var valobject = form.data('unobtrusiveValidation');
        if (valobject && valobject.validate() === false) {
            validation.goToSummaryErrors(form);
            // Validation is actived, was executed and the result is 'false': bad data, stop Post:
            return false;
        }

        // If custom validation is enabled, validate
        var cusval = form.data('customValidation');
        if (cusval && cusval.validate && cusval.validate() === false) {
            validation.goToSummaryErrors(form);
            // custom validation not passed, out!
            return false;
        }

        // Raise event
        currentStep.trigger('beginSubmitWizardStep');

        // Loading, with retard
        ctx.loadingtimer = setTimeout(function () {
            currentStep.block(blockPresets.loading);
        }, options.loadingDelay);
        
        ctx.autoUnblockLoading = true;

        var ok = false;

        // Mark as saved:
        ctx.changedElements = changesNotification.registerSave(form.get(0));

        // Do the Ajax post
        $.ajax({
            url: (form.attr('action') || ''),
            type: 'POST',
            context: ctx,
            data: form.serialize(),
            success: function (data, text, jx) {

                // If success, go next step, using custom JSON Action event:
                ctx.form.on('ajaxSuccessPost', function () {
                    // If there is next-step
                    if (nextStep) {
                        // If next step is internal url (a next wizard tab)
                        if (/^#/.test(nextStep)) {
                            $(nextStep).trigger('beginLoadWizardStep');

                            TabbedUX.enableTab(nextStep);

                            ok = true;
                            $(nextStep).trigger('endLoadWizardStep');
                        } else {
                            // If there is a next-step URI that is not internal link, we load it
                            redirectTo(nextStep);
                        }
                    }
                });

                // Do JSON action but if is not JSON or valid, manage as HTML:
                if (!ajaxCallbacks.doJSONAction(data, text, jx, ctx)) {
                    // Post 'maybe' was wrong, html was returned to replace current 
                    // form container: the ajax-box.

                    // create jQuery object with the HTML
                    var newhtml = new jQuery();
                    // Try-catch to avoid errors when an empty document or malformed is returned:
                    try {
                        // parseHTML since jquery-1.8 is more secure:
                        if (typeof ($.parseHTML) === 'function')
                            newhtml = $($.parseHTML(data));
                        else
                            newhtml = $(data);
                    } catch (ex) {
                        if (console && console.error)
                            console.error(ex);
                    }

                    // Showing new html:
                    currentStep.html(newhtml);
                    var newForm = currentStep;
                    if (!currentStep.is('form'))
                        newForm = currentStep.find('form:eq(0)');

                    // Changesnotification after append element to document, if not will not work:
                    // Data not saved (if was saved but server decide returns html instead a JSON code, page script must do 'registerSave' to avoid false positive):
                    changesNotification.registerChange(
                        newForm.get(0),
                        ctx.changedElements
                    );

                    currentStep.trigger('reloadedHtmlWizardStep');
                }
            },
            error: ajaxCallbacks.error,
            complete: ajaxCallbacks.complete
        }).complete(function () {
            currentStep.trigger('endSubmitWizardStep', ok);
        });
        return false;
    });
};
},{"./ajaxCallbacks":28,"./blockPresets":45,"./changesNotification":"f5kckb","./popup":78,"./redirectTo":80,"./validationHelper":"kqf9lt"}],"rqZkA9":[function(require,module,exports){
/** timeSpan class to manage times, parse, format, compute.
Its not so complete as the C# ones but is usefull still.
**/
var TimeSpan = function (days, hours, minutes, seconds, milliseconds) {
    this.days = Math.floor(parseFloat(days)) || 0;
    this.hours = Math.floor(parseFloat(hours)) || 0;
    this.minutes = Math.floor(parseFloat(minutes)) || 0;
    this.seconds = Math.floor(parseFloat(seconds)) || 0;
    this.milliseconds = Math.floor(parseFloat(milliseconds)) || 0;

    // internal utility function 'to string with two digits almost'
    function t(n) {
        return Math.floor(n / 10) + '' + n % 10;
    }
    /** Show only hours and minutes as a string with the format HH:mm
    **/
    this.toShortString = function timeSpan_proto_toShortString() {
        var h = t(this.hours),
            m = t(this.minutes);
        return (h + TimeSpan.unitsDelimiter + m);
    };
    /** Show the full time as a string, days can appear before hours if there are 24 hours or more
    **/
    this.toString = function timeSpan_proto_toString() {
        var h = t(this.hours),
            d = (this.days > 0 ? this.days.toString() + TimeSpan.decimalsDelimiter : ''),
            m = t(this.minutes),
            s = t(this.seconds + this.milliseconds / 1000);
        return (
            d +
            h + TimeSpan.unitsDelimiter +
            m + TimeSpan.unitsDelimiter +
            s);
    };
    this.valueOf = function timeSpan_proto_valueOf() {
        // Return the total milliseconds contained by the time
        return (
            this.days * (24 * 3600000) +
            this.hours * 3600000 +
            this.minutes * 60000 +
            this.seconds * 1000 +
            this.milliseconds
        );
    };
};
/** It creates a timeSpan object based on a milliseconds
**/
TimeSpan.fromMilliseconds = function timeSpan_proto_fromMilliseconds(milliseconds) {
    var ms = milliseconds % 1000,
        s = Math.floor(milliseconds / 1000) % 60,
        m = Math.floor(milliseconds / 60000) % 60,
        h = Math.floor(milliseconds / 3600000) % 24,
        d = Math.floor(milliseconds / (3600000 * 24));
    return new TimeSpan(d, h, m, s, ms);
};
/** It creates a timeSpan object based on a decimal seconds
**/
TimeSpan.fromSeconds = function timeSpan_proto_fromSeconds(seconds) {
    return this.fromMilliseconds(seconds * 1000);
};
/** It creates a timeSpan object based on a decimal minutes
**/
TimeSpan.fromMinutes = function timeSpan_proto_fromMinutes(minutes) {
    return this.fromSeconds(minutes * 60);
};
/** It creates a timeSpan object based on a decimal hours
**/
TimeSpan.fromHours = function timeSpan_proto_fromHours(hours) {
    return this.fromMinutes(hours * 60);
};
/** It creates a timeSpan object based on a decimal days
**/
TimeSpan.fromDays = function timeSpan_proto_fromDays(days) {
    return this.fromHours(days * 24);
};

// For spanish and english works good ':' as unitsDelimiter and '.' as decimalDelimiter
// TODO: this must be set from a global LC.i18n var localized for current user
TimeSpan.unitsDelimiter = ':';
TimeSpan.decimalsDelimiter = '.';
TimeSpan.parse = function (strtime) {
    strtime = (strtime || '').split(this.unitsDelimiter);
    // Bad string, returns null
    if (strtime.length < 2)
        return null;

    // Decoupled units:
    var d, h, m, s, ms;
    h = strtime[0];
    m = strtime[1];
    s = strtime.length > 2 ? strtime[2] : 0;
    // Substracting days from the hours part (format: 'days.hours' where '.' is decimalsDelimiter)
    if (h.contains(this.decimalsDelimiter)) {
        var dhsplit = h.split(this.decimalsDelimiter);
        d = dhsplit[0];
        h = dhsplit[1];
    }
    // Milliseconds are extracted from the seconds (are represented as decimal numbers on the seconds part: 'seconds.milliseconds' where '.' is decimalsDelimiter)
    ms = Math.round(parseFloat(s.replace(this.decimalsDelimiter, '.')) * 1000 % 1000);
    // Return the new time instance
    return new TimeSpan(d, h, m, s, ms);
};
TimeSpan.zero = new TimeSpan(0, 0, 0, 0, 0);
TimeSpan.prototype.isZero = function timeSpan_proto_isZero() {
    return (
        this.days === 0 &&
        this.hours === 0 &&
        this.minutes === 0 &&
        this.seconds === 0 &&
        this.milliseconds === 0
    );
};
TimeSpan.prototype.totalMilliseconds = function timeSpan_proto_totalMilliseconds() {
    return this.valueOf();
};
TimeSpan.prototype.totalSeconds = function timeSpan_proto_totalSeconds() {
    return (this.totalMilliseconds() / 1000);
};
TimeSpan.prototype.totalMinutes = function timeSpan_proto_totalMinutes() {
    return (this.totalSeconds() / 60);
};
TimeSpan.prototype.totalHours = function timeSpan_proto_totalHours() {
    return (this.totalMinutes() / 60);
};
TimeSpan.prototype.totalDays = function timeSpan_proto_totalDays() {
    return (this.totalHours() / 24);
};

if (typeof module !== 'undefined' && module.exports)
    module.exports = TimeSpan;
},{}],"LC/TimeSpan":[function(require,module,exports){
module.exports=require('rqZkA9');
},{}],"LC/TimeSpanExtra":[function(require,module,exports){
module.exports=require('5OLBBz');
},{}],"5OLBBz":[function(require,module,exports){
/* Extra utilities and methods 
 */
var TimeSpan = require('./TimeSpan');
var mu = require('./mathUtils');

/** Shows time as a large string with units names for values different than zero.
 **/
function smartTime(time) {
    var r = [];
    if (time.days > 1)
        r.push(time.days + ' days');
    else if (time.days == 1)
        r.push('1 day');
    if (time.hours > 1)
        r.push(time.hours + ' hours');
    else if (time.hours == 1)
        r.push('1 hour');
    if (time.minutes > 1)
        r.push(time.minutes + ' minutes');
    else if (time.minutes == 1)
        r.push('1 minute');
    if (time.seconds > 1)
        r.push(time.seconds + ' seconds');
    else if (time.seconds == 1)
        r.push('1 second');
    if (time.milliseconds > 1)
        r.push(time.milliseconds + ' milliseconds');
    else if (time.milliseconds == 1)
        r.push('1 millisecond');
    return r.join(', ');
}

/** Rounds a time to the nearest 15 minutes fragment.
@roundTo specify the LC.roundingTypeEnum about how to round the time (down, nearest or up)
**/
function roundTimeToQuarterHour(/* TimeSpan */time, /* mathUtils.roundingTypeEnum */roundTo) {
    var restFromQuarter = time.totalHours() % 0.25;
    var hours = time.totalHours();
    if (restFromQuarter > 0.0) {
        switch (roundTo) {
            case mu.roundingTypeEnum.Down:
                hours -= restFromQuarter;
                break;
            default:
            case mu.roundingTypeEnum.Nearest:
                var limit = 0.25 / 2;
                if (restFromQuarter >= limit) {
                    hours += (0.25 - restFromQuarter);
                } else {
                    hours -= restFromQuarter;
                }
                break;
            case mu.roundingTypeEnum.Up:
                hours += (0.25 - restFromQuarter);
                break;
        }
    }
    return TimeSpan.fromHours(hours);
}

// Extend a given TimeSpan object with the Extra methods
function plugIn(TimeSpan) {
    TimeSpan.prototype.toSmartString = function timeSpan_proto_toSmartString() { return smartTime(this); };
    TimeSpan.prototype.roundToQuarterHour = function timeSpan_proto_roundToQuarterHour() { return roundTimeToQuarterHour.call(this, parameters); };
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        smartTime: smartTime,
        roundToQuarterHour: roundTimeToQuarterHour,
        plugIn: plugIn
    };

},{"./TimeSpan":"rqZkA9","./mathUtils":73}],27:[function(require,module,exports){
/**
   API for automatic creation of labels for UI Sliders (jquery-ui)
**/
var $ = require('jquery'),
    tooltips = require('./tooltips'),
    mu = require('./mathUtils'),
    TimeSpan = require('./TimeSpan');
require('jquery-ui');

/** Create labels for a jquery-ui-slider.
**/
function create(slider) {
    // remove old ones:
    var old = slider.siblings('.ui-slider-labels').filter(function () {
        return ($(this).data('ui-slider').get(0) == slider.get(0));
    }).remove();
    // Create labels container
    var labels = $('<div class="ui-slider-labels"/>');
    labels.data('ui-slider', slider);

    // Setup of useful vars for label creation
    var max = slider.slider('option', 'max'),
        min = slider.slider('option', 'min'),
        step = slider.slider('option', 'step'),
        steps = Math.floor((max - min) / step);

    // Creating and positioning labels
    for (var i = 0; i <= steps; i++) {
        // Create label
        var lbl = $('<div class="ui-slider-label"><span class="ui-slider-label-text"/></div>');
        // Setup label with its value
        var labelValue = min + i * step;
        lbl.children('.ui-slider-label-text').text(labelValue);
        lbl.data('ui-slider-value', labelValue);
        // Positionate
        positionate(lbl, i, steps);
        // Add to container
        labels.append(lbl);
    }

    // Handler for labels click to select its position value
    labels.on('click', '.ui-slider-label', function () {
        var val = $(this).data('ui-slider-value'),
            slider = $(this).parent().data('ui-slider');
        slider.slider('value', val);
    });

    // Insert labels as a sibling of the slider (cannot be inserted inside)
    slider.after(labels);
}

/** Positionate to the correct position and width an UI label at @lbl
for the required percentage-width @sw
**/
function positionate(lbl, i, steps) {
    var sw = 100 / steps;
    var left = i * sw - sw * 0.5,
        right = 100 - left - sw,
        align = 'center';
    if (i === 0) {
        align = 'left';
        left = 0;
    } else if (i == steps) {
        align = 'right';
        right = 0;
    }
    lbl.css({
        'text-align': align,
        left: left + '%',
        right: right + '%'
    });
}

/** Update the visibility of labels of a jquery-ui-slider depending if they fit in the available space.
Slider needs to be visible.
**/
function update(slider) {
    // Get labels for slider
    var labels_c = slider.siblings('.ui-slider-labels').filter(function () {
        return ($(this).data('ui-slider').get(0) == slider.get(0));
    });
    var labels = labels_c.find('.ui-slider-label-text');

    // Apply autosize
    if ((slider.data('slider-autosize') || false).toString() == 'true')
        autosize(slider, labels);

    // Get and apply layout
    var layout_name = slider.data('slider-labels-layout') || 'standard',
        layout = layout_name in layouts ? layouts[layout_name] : layouts.standard;
    labels_c.addClass('layout-' + layout_name);
    layout(slider, labels_c, labels);

    // Update tooltips
    tooltips.createTooltip(labels_c.children(), {
        title: function () { return $(this).text(); }
        , persistent: true
    });
}

function autosize(slider, labels) {
    var total_width = 0;
    labels.each(function () {
        total_width += $(this).outerWidth(true);
    });
    var c = slider.closest('.ui-slider-container'),
        max = parseFloat(c.css('max-width')),
        min = parseFloat(c.css('min-width'));
    if (max != Number.NaN && total_width > max)
        total_width = max;
    if (min != Number.NaN && total_width < min)
        total_width = min;
    c.width(total_width);
}

/** Set of different layouts for labels, allowing different kinds of 
placement and visualization using the slider data option 'labels-layout'.
Used by 'update', almost the 'standard' must exist and can be increased
externally
**/
var layouts = {};
/** Show the maximum number of labels in equally sized gaps but
the last label that is ensured to be showed even if it creates
a higher gap with the previous one.
**/
layouts.standard = function standard_layout(slider, labels_c, labels) {
    // Check if there are more labels than available space
    // Get maximum label width
    var item_width = 0;
    labels.each(function () {
        var tw = $(this).outerWidth(true);
        if (tw >= item_width)
            item_width = tw;
    });
    // If there is width, if not, element is not visible cannot be computed
    if (item_width > 0) {
        // Get the required stepping of labels
        var labels_step = Math.ceil(item_width / (slider.width() / labels.length)),
        labels_steps = labels.length / labels_step;
        if (labels_step > 1) {
            // Hide the labels on positions out of the step
            var newi = 0,
                limit = labels.length - 1 - labels_step;
            for (var i = 0; i < labels.length; i++) {
                var lbl = $(labels[i]);
                if ((i + 1) < labels.length && (
                    i % labels_step ||
                    i > limit))
                    lbl.hide().parent().removeClass('visible');
                else {
                    // Show
                    var parent = lbl.show().parent().addClass('visible');
                    // repositionate parent
                    // positionate(parent, newi, labels_steps);
                    newi++;
                }
            }
        }
    }
};
/** Show labels number values formatted as hours, with only
integer hours being showed, the maximum number of it.
**/
layouts.hours = function hours_layout(slider, labels_c, labels, show_all) {
    var intLabels = slider.find('.integer-hour');
    if (!intLabels.length) {
        labels.each(function () {
            var $t = $(this);
            if (!$t.data('hour-processed')) {
                var v = parseFloat($t.text());
                if (v != Number.NaN) {
                    v = mu.roundTo(v, 2);
                    if (v % 1 > 0) {
                        $t.addClass('decimal-hour').hide().parent().removeClass('visible');
                        if (v % 0.5 === 0)
                            $t.parent().addClass('strong');
                        $t.text(TimeSpan.fromHours(v).toShortString());
                    } else {
                        $t.addClass('integer-hour').show().parent().addClass('visible');
                        intLabels = intLabels.add($t);
                    }
                }
                $t.data('hour-processed', true);
            }
        });
    }
    if (show_all !== true)
        layouts.standard(slider, intLabels.parent(), intLabels);
};
layouts['all-values'] = function all_layout(slider, labels_c, labels) {
    // Showing all labels
    labels_c.show().addClass('visible').children().show();
};
layouts['all-hours'] = function all_hours_layout() {
    // Just use hours layout but showing all integer hours
    Array.prototype.push.call(arguments, true);
    layouts.hours.apply(this, arguments);
};

module.exports = {
    create: create,
    update: update,
    layouts: layouts
};

},{"./TimeSpan":"rqZkA9","./mathUtils":73,"./tooltips":"UTsC2v"}],28:[function(require,module,exports){
/* Set of common LC callbacks for most Ajax operations
 */
var $ = require('jquery');
require('jquery.blockUI');
var popup = require('./popup'),
    validation = require('./validationHelper'),
    changesNotification = require('./changesNotification'),
    createIframe = require('./createIframe'),
    redirectTo = require('./redirectTo'),
    moveFocusTo = require('./moveFocusTo'),
    smoothBoxBlock = require('./smoothBoxBlock');

// AKA: ajaxErrorPopupHandler
function lcOnError(jx, message, ex) {
    // If is a connection aborted, no show message.
    // readyState different to 'done:4' means aborted too, 
    // because window being closed/location changed
    if (message == 'abort' || jx.readyState != 4)
        return;

    var m = message;
    var iframe = null;
    size = popup.size('large');
    size.height -= 34;
    if (m == 'error') {
        iframe = createIframe(jx.responseText, size);
        iframe.attr('id', 'blockUIIframe');
        m = null;
    }  else
        m = m + "; " + ex;

    // Block all window, not only current element
    $.blockUI(errorBlock(m, null, popup.style(size)));
    if (iframe)
        $('.blockMsg').append(iframe);
    $('.blockUI .close-popup').click(function () { $.unblockUI(); return false; });
}

// AKA: ajaxFormsCompleteHandler
function lcOnComplete() {
    // Disable loading
    clearTimeout(this.loadingtimer || this.loadingTimer);
    // Unblock
    if (this.autoUnblockLoading) {
        // Double un-lock, because any of the two systems can being used:
        smoothBoxBlock.close(this.box);
        this.box.unblock();
    }
}

// AKA: ajaxFormsSuccessHandler
function lcOnSuccess(data, text, jx) {
    var ctx = this;
    // Supported the generic ctx.element from jquery.reload
    if (ctx.element) ctx.form = ctx.element;
    // Specific stuff of ajaxForms
    if (!ctx.form) ctx.form = $(this);
    if (!ctx.box) ctx.box = ctx.form;
    ctx.autoUnblockLoading = true;

    // Do JSON action but if is not JSON or valid, manage as HTML:
    if (!doJSONAction(data, text, jx, ctx)) {
        // Post 'maybe' was wrong, html was returned to replace current 
        // form container: the ajax-box.

        // create jQuery object with the HTML
        var newhtml = new jQuery();
        // Avoid empty documents being parsed (raise error)
        if ($.trim(data)) {
            // Try-catch to avoid errors when a malformed document is returned:
            try {
                // parseHTML since jquery-1.8 is more secure:
                if (typeof ($.parseHTML) === 'function')
                    newhtml = $($.parseHTML(data));
                else
                    newhtml = $(data);
            } catch (ex) {
                if (console && console.error)
                    console.error(ex);
                return;
            }
        }

        // For 'reload' support, check too the context.mode, and both reload or ajaxForms check data attribute too
        ctx.boxIsContainer = ctx.boxIsContainer;
        var replaceBoxContent =
          (ctx.options && ctx.options.mode === 'replace-content') ||
          ctx.box.data('reload-mode') === 'replace-content';

        // Support for reload, avoiding important bugs with reloading boxes that contains forms:
        // If operation is a reload, don't check the ajax-box
        var jb = newhtml;
        if (!ctx.isReload) {
          // Check if the returned element is the ajax-box, if not, find
          // the element in the newhtml:
          jb = newhtml.filter('.ajax-box');
          if (jb.length === 0)
            jb = newhtml;
          if (!ctx.boxIsContainer && !jb.is('.ajax-box'))
            jb = newhtml.find('.ajax-box:eq(0)');
          if (!jb || jb.length === 0) {
            // There is no ajax-box, use all element returned:
            jb = newhtml;
          }

          if (replaceBoxContent)
            // Replace the box content with the content of the returned box
            // or all if there is no ajax-box in the result.
            jb = jb.is('.ajax-box') ? jb.contents() : jb;
        }

        if (replaceBoxContent) {
          ctx.box.empty().append(jb);
        } else if (ctx.boxIsContainer) {
            // jb is content of the box container:
            ctx.box.html(jb);
        } else {
            // box is content that must be replaced by the new content:
            ctx.box.replaceWith(jb);
            // and refresh the reference to box with the new element
            ctx.box = jb;
        }

        // It supports normal ajax forms and subforms through fieldset.ajax
        if (ctx.box.is('form.ajax') || ctx.box.is('fieldset.ajax'))
          ctx.form = ctx.box;
        else {
          ctx.form = ctx.box.find('form.ajax:eq(0)');
          if (ctx.form.length === 0)
            ctx.form = ctx.box.find('fieldset.ajax:eq(0)');
        }

        // Changesnotification after append element to document, if not will not work:
        // Data not saved (if was saved but server decide returns html instead a JSON code, page script must do 'registerSave' to avoid false positive):
        if (ctx.changedElements)
            changesNotification.registerChange(
                ctx.form.get(0),
                ctx.changedElements
            );

        // Move focus to the errors appeared on the page (if there are):
        var validationSummary = jb.find('.validation-summary-errors');
        if (validationSummary.length)
          moveFocusTo(validationSummary);
        // TODO: It seems that it returns a document-fragment instead of a element already in document
        // for ctx.form (maybe jb too?) when using * ctx.box.data('reload-mode') === 'replace-content' * 
        // (maybe on other cases too?).
        ctx.form.trigger('ajaxFormReturnedHtml', [jb, ctx.form, jx]);
    }
}

/* Utility for JSON actions
 */
function showSuccessMessage(ctx, message, data) {
    // Unblock loading:
    ctx.box.unblock();
    // Block with message:
    message = message || ctx.form.data('success-post-message') || 'Done!';
    ctx.box.block(infoBlock(message, {
        css: popup.style(popup.size('small'))
    }))
    .on('click', '.close-popup', function () {
        ctx.box.unblock();
        ctx.box.trigger('ajaxSuccessPostMessageClosed', [data]);
        return false; 
    });
    // Do not unblock in complete function!
    ctx.autoUnblockLoading = false;
}

/* Utility for JSON actions
*/
function showOkGoPopup(ctx, data) {
    // Unblock loading:
    ctx.box.unblock();

    var content = $('<div class="ok-go-box"/>');
    content.append($('<span class="success-message"/>').append(data.SuccessMessage));
    if (data.AdditionalMessage)
        content.append($('<div class="additional-message"/>').append(data.AdditionalMessage));

    var okBtn = $('<a class="action ok-action close-action" href="#ok"/>').append(data.OkLabel);
    var goBtn = '';
    if (data.GoURL && data.GoLabel) {
        goBtn = $('<a class="action go-action"/>').attr('href', data.GoURL).append(data.GoLabel);
        // Forcing the 'close-action' in such a way that for internal links the popup gets closed in a safe way:
        goBtn.click(function () { okBtn.click(); ctx.box.trigger('ajaxSuccessPostMessageClosed', [data]); });
    }

    content.append($('<div class="actions clearfix"/>').append(okBtn).append(goBtn));

    smoothBoxBlock.open(content, ctx.box, null, {
        closeOptions: {
            complete: function () {
                ctx.box.trigger('ajaxSuccessPostMessageClosed', [data]);
            }
        }
    });

    // Do not unblock in complete function!
    ctx.autoUnblockLoading = false;
}

function doJSONAction(data, text, jx, ctx) {
    // If is a JSON result:
    if (typeof (data) === 'object') {
        if (ctx.box)
            // Clean previous validation errors
            validation.setValidationSummaryAsValid(ctx.box);

        if (data.Code === 0) {
            // Special Code 0: general success code, show message saying that 'all was fine'
            showSuccessMessage(ctx, data.Result, data);
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
            // Special Code 1: do a redirect
        } else if (data.Code == 1) {
            redirectTo(data.Result);
        } else if (data.Code == 2) {
            // Special Code 2: show login popup (with the given url at data.Result)
            ctx.box.unblock();
            popup(data.Result, { width: 410, height: 320 });
        } else if (data.Code == 3) {
            // Special Code 3: reload current page content to the given url at data.Result)
            // Note: to reload same url page content, is better return the html directly from
            // this ajax server request.
            //container.unblock(); is blocked and unblocked again by the reload method:
            ctx.autoUnblockLoading = false;
            ctx.box.reload(data.Result);
        } else if (data.Code == 4) {
            // Show SuccessMessage, attaching and event handler to go to RedirectURL
            ctx.box.on('ajaxSuccessPostMessageClosed', function () {
                redirectTo(data.Result.RedirectURL);
            });
            showSuccessMessage(ctx, data.Result.SuccessMessage, data);
        } else if (data.Code == 5) {
            // Change main-action button message:
            var btn = ctx.form.find('.main-action');
            var dmsg = btn.data('default-text');
            if (!dmsg)
                btn.data('default-text', btn.text());
            var msg = data.Result || btn.data('success-post-text') || 'Done!';
            btn.text(msg);
            // Adding support to reset button text to default one
            // when the First next changes happens on the form:
            $(ctx.form).one('lcChangesNotificationChangeRegistered', function () {
                btn.text(btn.data('default-text'));
            });
            // Trigger event for custom handlers
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
        } else if (data.Code == 6) {
            // Ok-Go actions popup with 'success' and 'additional' messages.
            showOkGoPopup(ctx, data.Result);
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
        } else if (data.Code == 7) {
            // Special Code 7: show message saying contained at data.Result.Message.
            // This code allow attach additional information in data.Result to distinguish
            // different results all showing a message but maybe not being a success at all
            // and maybe doing something more in the triggered event with the data object.
            showSuccessMessage(ctx, data.Result.Message, data);
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
        } else if (data.Code == 8) {
            // Show validation messages
            var validationHelper = require('./validationHelper');
            validationHelper.setErrors(ctx.form, data.Result.Errors);
        } else if (data.Code > 100) {
            // User Code: trigger custom event to manage results:
            ctx.form.trigger('ajaxSuccessPost', [data, text, jx, ctx]);
        } else { // data.Code < 0
            // There is an error code.

            // Data not saved:
            if (ctx.changedElements)
                changesNotification.registerChange(ctx.form.get(0), ctx.changedElements);

            // Unblock loading:
            ctx.box.unblock();
            // Block with message:
            var message = "Error: " + data.Code + ": " + JSON.stringify(data.Result ? (data.Result.ErrorMessage ? data.Result.ErrorMessage : data.Result) : '');
            smoothBoxBlock.open($('<div/>').append(message), ctx.box, null, { closable: true });

            // Do not unblock in complete function!
            ctx.autoUnblockLoading = false;
        }
        return true;
    } else {
        return false;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        error: lcOnError,
        success: lcOnSuccess,
        complete: lcOnComplete,
        doJSONAction: doJSONAction
    };
}
},{"./changesNotification":"f5kckb","./createIframe":48,"./moveFocusTo":"9RKOGW","./popup":78,"./redirectTo":80,"./smoothBoxBlock":"KQGzNM","./validationHelper":"kqf9lt"}],29:[function(require,module,exports){
/* Forms submitted via AJAX */
var $ = require('jquery'),
    callbacks = require('./ajaxCallbacks'),
    changesNotification = require('./changesNotification'),
    blockPresets = require('./blockPresets'),
    validationHelper = require('./validationHelper');

jQuery = $;

// Global settings, will be updated on init but is accessed
// through closure from all functions.
// NOTE: is static, doesn't allows multiple configuration, one init call replace previous
// Defaults:
var settings = {
    loadingDelay: 0,
    element: document
};

// Adapted callbacks
function ajaxFormsCompleteHandler() {
    callbacks.complete.apply(this, arguments);
}

function ajaxErrorPopupHandler(jx, message, ex) {
    var ctx = this;
    if (!ctx.form) ctx.form = $(this);
    if (!ctx.box) ctx.box = ctx.form;
    // Data not saved:
    if (ctx.changedElements)
        changesNotification.registerChange(ctx.form, ctx.changedElements);

    ctx.autoUnblockLoading = true;

    // Common logic
    callbacks.error.apply(ctx, arguments);
}

function ajaxFormsSuccessHandler() {
  callbacks.success.apply(this, arguments);
}

/**
  Performs the validation on the form or subform as determine
  the values in the context (@ctx), returning true for success
  and false for some error (elements get marked with the error,
  just the caller must stop any task on false).
**/
function validateForm(ctx) {
  // Validations
  var validationPassed = true;
  // To support sub-forms throuh fieldset.ajax, we must execute validations and verification
  // in two steps and using the real form to let validation mechanism work
  var isSubform = ctx.form.is('fieldset.ajax');
  var actualForm = isSubform ? ctx.form.closest('form') : ctx.form,
      disabledSummaries = new jQuery(),
      disabledFields = new jQuery();

  // On subform validation, we don't want the outside subform elements and validation-summary controls to be affected
  // by this validation (to avoid to show errors there that doesn't interest to the rest of the form)
  // To fullfill this requisit, we need to hide it for the validator for a while and let only affect
  // any local summary (inside the subform).
  // The same for form elements outside the subform, we don't want its errors for now.
  if (isSubform) {
    var outsideElements = (function(f) {
      return function () {
        // Only those that are outside the subform
        return !$.contains(f, this);
      };
    })(ctx.form.get(0));

    disabledSummaries = actualForm
    .find('[data-valmsg-summary=true]')
    .filter(outsideElements)
    // We must use 'attr' instead of 'data' because is what we and unobtrusiveValidation checks
    // (in other words, using 'data' will not work)
    .attr('data-valmsg-summary', 'false');

    disabledFields = actualForm
    .find('[data-val=true]')
    .filter(outsideElements)
    .attr('data-val', 'false');
  }

  // First at all, if unobtrusive validation is enabled, validate
  var valobject = actualForm.data('unobtrusiveValidation');
  if (valobject && valobject.validate() === false) {
    validationHelper.goToSummaryErrors(ctx.form);
    validationPassed = false;
  }

  // If custom validation is enabled, validate.
  // Custom validation can be attached to forms or fieldset, but
  // to support subforms, only execute in the ctx.form element (can be 
  // a fielset subform) and any children fieldset.
  ctx.form.add(ctx.form.find('fieldset')).each(function () {
    var cusval = $(this).data('customValidation');
    if (cusval && cusval.validate && cusval.validate() === false) {
      validationHelper.goToSummaryErrors(ctx.form);
      validationPassed = false;
    }
  });

  // To support sub-forms, we must check that validations errors happened inside the
  // subform and not in other elements, to don't stop submit on not related errors.
  // (we avoid execute validation on that elements but could happen a previous validation)
  // Just look for marked elements:
  if (isSubform && ctx.form.find('.input-validation-error').length)
    validationPassed = false;

  // Re-enable again that summaries previously disabled
  if (isSubform) {
    // We must use 'attr' instead of 'data' because is what we and unobtrusiveValidation checks
    // (in other words, using 'data' will not work)
    disabledSummaries.attr('data-valmsg-summary', 'true');
    disabledFields.attr('data-val', 'true');
  }

  return validationPassed;
}

/*******************************
* Ajax Forms generic function.
* Result expected is:
* - html, for validation errors from server, replacing current .ajax-box content
* - json, with structure: { Code: integer-number, Result: string-or-object }
*   Code numbers:
*    - Negative: errors, with a Result object { ErrorMessage: string }
*    - Zero: success result, it shows a message with content: Result string, else form data attribute 'success-post-message', else a generic message
*    - 1: success result, Result contains a URL, the page will be redirected to that.
*    - Major 1: success result, with custom handler throught the form event 'success-post-message'.
*/
function ajaxFormsSubmitHandler(event) {
    // Context var, used as ajax context:
    var ctx = {};
    // Default data for required params:
    ctx.form = (event.data ? event.data.form : null) || $(this);
    ctx.box = (event.data ? event.data.box : null) || ctx.form.closest(".ajax-box");
    var action = (event.data ? event.data.action : null) || ctx.form.attr('action') || '';

    // Check validation
    if (validateForm(ctx) === false) {
      // Validation failed, submit cannot continue, out!
      return false;
    }

    // Data saved:
    ctx.changedElements = (event.data ? event.data.changedElements : null) || changesNotification.registerSave(ctx.form.get(0));

    // Notification event to allow scripts to hook additional tasks before send data
    ctx.form.trigger('presubmit', [ctx]);

    // Loading, with retard
    ctx.loadingtimer = setTimeout(function () {
        ctx.box.block(blockPresets.loading);
    }, settings.loadingDelay);
    ctx.autoUnblockLoading = true;

    var data = ctx.form.find(':input').serialize();

    // Do the Ajax post
    $.ajax({
        url: (action),
        type: 'POST',
        data: data,
        context: ctx,
        success: ajaxFormsSuccessHandler,
        error: ajaxErrorPopupHandler,
        complete: ajaxFormsCompleteHandler
    });

    // Stop normal POST:
    return false;
}

// Public initialization
function initAjaxForms(options) {
    $.extend(true, settings, options);

    /* Attach a delegated handler to manage ajax forms */
    $(settings.element).on('submit', 'form.ajax', ajaxFormsSubmitHandler);
    /* Attach a delegated handler for a special ajax form case: subforms, using fieldsets. */
    $(settings.element).on('click', 'fieldset.ajax .ajax-fieldset-submit',
        function (event) {
          var form = $(this).closest('fieldset.ajax');

          event.data = {
            form: form,
            box: form.closest('.ajax-box'),
            action: form.data('ajax-fieldset-action'),
            // Data saved:
            changedElements: changesNotification.registerSave(form.get(0), form.find(':input[name]'))
          };
          return ajaxFormsSubmitHandler(event);
        }
    );
}
/* UNUSED?
function ajaxFormMessageOnHtmlReturnedWithoutValidationErrors(form, message) {
    var $t = $(form);
    // If there is no form errors, show a successful message
    if ($t.find('.validation-summary-errors').length == 0) {
        $t.block(infoBlock(message, {
            css: popupStyle(popupSize('small'))
        }))
        .on('click', '.close-popup', function () { $t.unblock(); return false; });
    }
}
*/

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        init: initAjaxForms,
        onSuccess: ajaxFormsSuccessHandler,
        onError: ajaxErrorPopupHandler,
        onComplete: ajaxFormsCompleteHandler
    };
},{"./ajaxCallbacks":28,"./blockPresets":45,"./changesNotification":"f5kckb","./validationHelper":"kqf9lt"}],30:[function(require,module,exports){
/* Auto calculate summary on DOM tagging with classes the elements involved.
 */
var nu = require('./numberUtils');

function setupCalculateTableItemsTotals() {
    $('table.calculate-items-totals').each(function () {
        if ($(this).data('calculate-items-totals-initializated'))
            return;
        function calculateRow() {
            var $t = $(this);
            var tr = $t.closest('tr');
            var ip = tr.find('.calculate-item-price');
            var iq = tr.find('.calculate-item-quantity');
            var it = tr.find('.calculate-item-total');
            nu.setMoneyNumber(nu.getMoneyNumber(ip) * nu.getMoneyNumber(iq, 1), it);
            tr.trigger('lcCalculatedItemTotal', tr);
        }
        $(this).find('.calculate-item-price, .calculate-item-quantity').on('change', calculateRow);
        $(this).find('tr').each(calculateRow);
        $(this).data('calculate-items-totals-initializated', true);
    });
}

function setupCalculateSummary(force) {
    $('.calculate-summary').each(function () {
        var c = $(this);
        if (!force && c.data('calculate-summary-initializated'))
            return;
        var s = c.find('.calculation-summary');
        var d = c.find('table.calculate-summary-group');
        function calc() {
            var total = 0, fee = 0, duration = 0;
            var groups = {};
            d.each(function () {
                var groupTotal = 0;
                var allChecked = $(this).is('.calculate-all-items');
                $(this).find('tr').each(function () {
                    var item = $(this);
                    if (allChecked || item.find('.calculate-item-checked').is(':checked')) {
                        groupTotal += nu.getMoneyNumber(item.find('.calculate-item-total:eq(0)'));
                        var q = nu.getMoneyNumber(item.find('.calculate-item-quantity:eq(0)'), 1);
                        fee += nu.getMoneyNumber(item.find('.calculate-item-fee:eq(0)')) * q;
                        duration += nu.getMoneyNumber(item.find('.calculate-item-duration:eq(0)')) * q;
                    }
                });
                total += groupTotal;
                groups[$(this).data('calculation-summary-group')] = groupTotal;
                nu.setMoneyNumber(groupTotal, $(this).closest('fieldset').find('.group-total-price'));
                nu.setMoneyNumber(duration, $(this).closest('fieldset').find('.group-total-duration'));
            });

            // Set summary total value
            nu.setMoneyNumber(total, s.find('.calculation-summary-total'));
            nu.setMoneyNumber(fee, s.find('.calculation-summary-fee'));
            // And every group total value
            for (var g in groups) {
                nu.setMoneyNumber(groups[g], s.find('.calculation-summary-group-' + g));
            }
        }
        d.find('.calculate-item-checked').change(calc);
        d.on('lcCalculatedItemTotal', calc);
        calc();
        c.data('calculate-summary-initializated', true);
    });
}

/** Update the detail of a pricing summary, one detail line per selected item
**/
function updateDetailedPricingSummary() {
    $('.pricing-summary.detailed').each(function () {
        var $s = $(this),
            $d = $s.find('tbody.detail'),
            $t = $s.find('tbody.detail-tpl').children('tr:eq(0)'),
            $c = $s.closest('form'),
            $items = $c.find('.pricing-summary-item');

        // Do it!
        // Remove old lines
        $d.children().remove();
        // Create new ones
        $items.each(function () {
            // Get values
            var $i = $(this),
                checked = $i.find('.pricing-summary-item-checked').prop('checked');
            if (checked) {
                var concept = $i.find('.pricing-summary-item-concept').text(),
                    price = nu.getMoneyNumber($i.find('.pricing-summary-item-price:eq(0)'));
                // Create row and set values
                var $row = $t.clone()
                .removeClass('detail-tpl')
                .addClass('detail');
                $row.find('.pricing-summary-item-concept').text(concept);
                nu.setMoneyNumber(price, $row.find('.pricing-summary-item-price'));
                // Add to the table
                $d.append($row);
            }
        });
    });
}
function setupUpdateDetailedPricingSummary() {
    var $c = $('.pricing-summary.detailed').closest('form');
    // Initial calculation
    updateDetailedPricingSummary();
    // Calculate on relevant form changes
    $c.find('.pricing-summary-item-checked').change(updateDetailedPricingSummary);
    // Support for lcSetupCalculateTableItemsTotals event
    $c.on('lcCalculatedItemTotal', updateDetailedPricingSummary);
}


if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        onTableItems: setupCalculateTableItemsTotals,
        onSummary: setupCalculateSummary,
        updateDetailedPricingSummary: updateDetailedPricingSummary,
        onDetailedPricingSummary: setupUpdateDetailedPricingSummary
    };
},{"./numberUtils":76}],31:[function(require,module,exports){
/* Focus the first element in the document (or in @container)
with the html5 attribute 'autofocus' (or alternative @cssSelector).
It's fine as a polyfill and for ajax loaded content that will not
get the browser support of the attribute.
*/
var $ = require('jquery');

function autoFocus(container, cssSelector) {
    container = $(container || document);
    container.find(cssSelector || '[autofocus]').focus();
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = autoFocus;
},{}],32:[function(require,module,exports){
/** Auto-fill menu sub-items using tabbed pages -only works for current page items- **/
var $ = require('jquery');

module.exports = function autofillSubmenu() {
    $('.autofill-submenu .current').each(function () {
        var parentmenu = $(this);
        // getting the submenu elements from tabs marked with class 'autofill-submenu-items'
        var items = $('.autofill-submenu-items li:not(.removable)');
        // if there is items, create the submenu cloning it!
        if (items.length > 0) {
            var submenu = document.createElement("ul");
            parentmenu.append(submenu);
            // Cloning without events:
            var newitems = items.clone(false, false);
            $(submenu).append(newitems);

            // We need attach events to maintain the tabbed interface working
            // New Items (cloned) must change tabs:
            newitems.find("a").click(function () {
                // Trigger event in the original item
                $("a[href='" + this.getAttribute("href") + "']", items).click();
                // Change menu:
                $(this).parent().parent().find("a").removeClass('current');
                $(this).addClass('current');
                // Stop event:
                return false;
            });
            // Original items must change menu:
            items.find("a").click(function () {
                newitems.parent().find("a").removeClass('current').
                filter("*[href='" + this.getAttribute("href") + "']").addClass('current');
            });
        }
    });
};
},{}],33:[function(require,module,exports){
/**
Manage all that events attached to dates made unavailable by the user
to notify about what that means.

Made for use in the Monthly calendar, maybe reusable.
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  objectUtils = require('./objectUtils');
require("date-format-lite");

/**
The @element must be a dom element containing that will contain the information
and will use an ul element to list notifications. The element will be hidden
initially and any time that, on rendering, there are not notifications.
**/
module.exports = function BookingsNotification(element) {

  this.$el = $(element);
  this.$list = this.$el.find('ul');
  if (!this.$list.length)
    this.$list = $('<ul/>').appendTo(this.$el);

  this.registered = {};

  this.register = function register(toggle, data, strDate) {
    var l = this.registered;
    if (toggle) {
      // register (if something)
      var evs = data.slots[strDate].eventsIds;
      if (evs) {
        l[strDate] = objectUtils.filterProperties(data.events, function (k) { return evs.indexOf(k) != -1; });
      }
    } else {
      // unregister
      delete l[strDate];
    }
  };

  this.render = function render() {
    // Renew the list
    this.$list.children().remove();

    var hasNotifications = false;

    for (var strDate in this.registered) {
      if (!this.registered.hasOwnProperty(strDate)) continue;

      var events = this.registered[strDate];
      var date = dateISO.parse(strDate).format('DDDD, MMM D');
      var msg = $('<span/>').text(date + ": ").outerHtml();

      var eventsHtml = [];
      for (var p in events) {
        if (!events.hasOwnProperty(p)) continue;
        var ev = events[p];
        var item = $('<a target="_blank" />').attr('href', ev.url).text(ev.summary || 'booking');
        eventsHtml.push(item.outerHtml());

        hasNotifications = true;
      }
      msg += eventsHtml.join(', ');

      $('<li/>')
      .html(msg)
      .appendTo(this.$list);
    }

    if (hasNotifications)
      this.$el.show();
    else
      this.$el.hide();

  };
};
},{"./objectUtils":43,"LC/dateISO8601":"0dIKTs","date-format-lite":97}],34:[function(require,module,exports){
/**
  Monthly calendar class
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  LcWidget = require('../CX/LcWidget'),
  extend = require('../CX/extend'),
  utils = require('./utils'),
  objectUtils = require('./objectUtils'),
  BookingsNotification = require('./BookingsNotification');

/**
  Private utils
**/

/**
  Prefetch next month (based on the given dates)
  Note: this code is very similar to utils.weeklyCheckAndPrefetch
**/
function monthlyCheckAndPrefetch(monthly, currentDatesRange) {
  // We get the next month dates-range, but
  // using as base-date a date inside current displayed month, that most times is
  // not the month of the start date in current date, then just forward 7 days that
  // to ensure we pick the correct month:
  var nextDatesRange = utils.date.nextMonthWeeks(utils.date.addDays(currentDatesRange.start, 7), 1, monthly.showSixWeeks);
  // As we load full weeks, most times the first week of a month is already loaded because 
  // the week is shared with the previous month, then just check if the start of the new
  // range is already in cache and shrink the range to be requested, avoiding conflict on
  // loading the udpated data (if that week was being edited) and faster request load since
  // the server needs to do less computation:
  var d = nextDatesRange.start,
    strend = dateISO.dateLocal(nextDatesRange.end),
    strd = dateISO.dateLocal(d, true);
  if (monthly.data && monthly.data.slots)
  while (monthly.data.slots[strd] &&
    strd <= strend) {
    nextDatesRange.start = d = utils.date.addDays(d, 1);
    strd = dateISO.dateLocal(d, true);
  }

  if (!utils.monthlyIsDataInCache(monthly, nextDatesRange)) {
    // Prefetching next week in advance
    var prefetchQuery = utils.datesToQuery(nextDatesRange);
    monthly.fetchData(prefetchQuery, null, true);
  }
}

/**
Move the binded dates the amount of @months specified.
Note: most of this code is adapted from utils.moveBindRangeInDays,
the complexity comes from the prefetch feature, maybe can be that logic
isolated and shared?
**/
function moveBindMonth(monthly, months) {
  // We get the next 'months' (negative for previous) dates-range, but
  // using as base-date a date inside current displayed month, that most times is
  // not the month of the start date in current date, then just forward 7 days that
  // to ensure we pick the correct month:
  var datesRange = utils.date.nextMonthWeeks(utils.date.addDays(monthly.datesRange.start, 7), months, monthly.showSixWeeks);

  // Check cache before try to fetch
  var inCache = utils.monthlyIsDataInCache(monthly, datesRange);

  if (inCache) {
    // Just show the data
    monthly.bindData(datesRange);
    // Prefetch except if there is other request in course (can be the same prefetch,
    // but still don't overload the server)
    if (monthly.fetchData.requests.length === 0)
      monthlyCheckAndPrefetch(monthly, datesRange);
  } else {

    // Support for prefetching:
    // Its avoided if there are requests in course, since
    // that will be a prefetch for the same data.
    if (monthly.fetchData.requests.length) {
      // The last request in the pool *must* be the last in finish
      // (must be only one if all goes fine):
      var request = monthly.fetchData.requests[monthly.fetchData.requests.length - 1];

      // Wait for the fetch to perform and sets loading to notify user
      monthly.$el.addClass(monthly.classes.fetching);
      request.done(function () {
        moveBindMonth(monthly, months);
        monthly.$el.removeClass(monthly.classes.fetching || '_');
      });
      return;
    }

    // Fetch (download) the data and show on ready:
    monthly
    .fetchData(utils.datesToQuery(datesRange))
    .done(function () {
      monthly.bindData(datesRange);
      // Prefetch
      monthlyCheckAndPrefetch(monthly, datesRange);
    });
  }
}

/**
Mark calendar as current-month and disable prev button,
or remove the mark and enable it if is not.

Updates the month label too and today button
**/
function checkCurrentMonth($el, startDate, monthly) {
  // Ensure the date to be from current month and not one of the latest dates
  // of the previous one (where the range start) adding 7 days for the check:
  var monthDate = utils.date.addDays(startDate, 7);
  var yep = utils.date.isInCurrentMonth(monthDate);
  $el.toggleClass(monthly.classes.currentWeek, yep);
  $el.find('.' + monthly.classes.prevAction).prop('disabled', yep);

  // Month - Year
  var mlbl = monthly.texts.months[monthDate.getMonth()] + ' ' + monthDate.getFullYear();
  $el.find('.' + monthly.classes.monthLabel).text(mlbl);
  $el.find('.' + monthly.classes.todayAction).prop('disabled', yep);
}

/**
  Update the calendar dates cells for 'day of the month' values
  and number of weeks/rows.
  @datesRange { start, end }
  @slotsContainer jQuery-DOM for dates-cells tbody
**/
function updateDatesCells(datesRange, slotsContainer, offMonthDateClass, currentDateClass, slotDateLabel, showSixWeeks) {
  var lastY,
    currentMonth = utils.date.addDays(datesRange.start, 7).getMonth(),
    today = dateISO.dateLocal(new Date());

  iterateDatesCells(datesRange, slotsContainer, function (date, x, y) {
    lastY = y;
    this.find('.' + slotDateLabel).text(date.getDate());

    // Mark days not in this month
    this.toggleClass(offMonthDateClass, date.getMonth() != currentMonth);

    // Mark today
    this.toggleClass(currentDateClass, dateISO.dateLocal(date) == today);
  });

  if (!showSixWeeks) {
    // Some months are 5 weeks wide and others 6; our layout has permanent 6 rows/weeks
    // and we don't look up the 6th week if is not part of the month then that 6th row
    // must be hidden if there are only 5.
    // If the last row was the 5 (index 4, zero-based), the 6th is hidden:
    slotsContainer.children('tr:eq(5)').xtoggle(lastY != 4, { effect: 'height', duration: 0 });
  }
}

/**
  It executes the given callback (@eachCellCallback) for 
  each cell (this inside the callback) iterated between the @datesRange
  inside the @slotsContainer (a tbody or table with tr-td date cells)
**/
function iterateDatesCells(datesRange, slotsContainer, eachCellCallback) {
  var x, y, dateCell;
  // Iterate dates
  utils.date.eachDateInRange(datesRange.start, datesRange.end, function (date, i) {
    // dates are sorted as 7 per row (each week-day),
    // but remember that day-cell position is offset 1 because
    // each row is 8 cells (first is header and rest 7 are the data-cells for dates)
    // just looking only 'td's we can use the position without offset
    x = (i % 7);
    y = Math.floor(i / 7);
    dateCell = slotsContainer.children('tr:eq(' + y + ')').children('td:eq(' + x + ')');

    eachCellCallback.apply(dateCell, [date, x, y, i]);
  });
}

/**
  Toggle a selected date-cell availability,
  for the 'editable' mode
**/
function toggleDateAvailability(monthly, cell) {
  // If there is no data, just return (data not loaded)
  if (!monthly.data || !monthly.data.slots) return;
  
  // Getting the position of the cell in the matrix for date-slots:
  var tr = cell.closest('tr'),
    x = tr.find('td').index(cell),
    y = tr.closest('tbody').find('tr').index(tr),
    daysOffset = y * 7 + x;

  // Getting the date for the cell based on the showed first date
  var date = monthly.datesRange.start;
  date = utils.date.addDays(date, daysOffset);
  var strDate = dateISO.dateLocal(date, true);

  // Get and update from the underlaying data, 
  // the status for the date, toggling it:
  var slot = monthly.data.slots[strDate];
  // If there is no slot, just return (data not loaded)
  if (!slot) return;
  slot.status = slot.status == 'unavailable' ? 'available' : 'unavailable';
  slot.source = 'user';
  monthly.bookingsNotification.register(slot.status == 'unavailable', monthly.data, strDate);

  // Update visualization:
  monthly.bindData();
}

/**
Montly calendar, inherits from LcWidget
**/
var Monthly = LcWidget.extend(
// Prototype
{
classes: extend({}, utils.weeklyClasses, {
  weeklyCalendar: undefined,
  currentWeek: undefined,
  currentMonth: 'is-currentMonth',
  monthlyCalendar: 'AvailabilityCalendar--monthly',
  todayAction: 'Actions-today',
  monthLabel: 'AvailabilityCalendar-monthLabel',
  slotDateLabel: 'AvailabilityCalendar-slotDateLabel',
  offMonthDate: 'AvailabilityCalendar-offMonthDate',
  currentDate: 'AvailabilityCalendar-currentDate',
  editable: 'is-editable',
  bookingsNotification: 'AvailabilityCalendar-bookingsNotification'
}),
texts: extend({}, utils.weeklyTexts, {
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
}),
url: '/calendar/get-availability/',
showSixWeeks: true,
editable: false,

// Our 'view' will be a subset of the data,
// delimited by the next property, a dates range:
datesRange: { start: null, end: null },
bindData: function bindDataMonthly(datesRange) {
  if (!this.data || !this.data.slots) return;

  this.datesRange = datesRange = datesRange || this.datesRange;
  var 
      slotsContainer = this.$el.find('.' + this.classes.slots),
      slots = slotsContainer.find('td');

  checkCurrentMonth(this.$el, datesRange.start, this);

  updateDatesCells(this.datesRange, slotsContainer, this.classes.offMonthDate, this.classes.currentDate, this.classes.slotDateLabel, this.showSixWeeks);

  // Remove any previous status class from all slots
  for (var s = 0; s < utils.statusTypes.length; s++) {
    slots.removeClass(this.classes.slotStatusPrefix + utils.statusTypes[s] || '_');
  }

  var that = this;

  // Set availability of each date slot/cell:
  iterateDatesCells(datesRange, slotsContainer, function (date, x, y, i) {
    var datekey = dateISO.dateLocal(date, true);
    var slot = that.data.slots[datekey];
    // Support for simple and detailed status description:
    var dateStatus = $.isPlainObject(slot) ? slot.status : slot;
    // Default value from data:
    dateStatus = dateStatus || that.data.defaultStatus || 'unknow';

    if (dateStatus)
      this.addClass(that.classes.slotStatusPrefix + dateStatus);
  });

  // Notifications:
  this.bookingsNotification.render();
},
getUpdatedData: function getUpdatedData() {
  var d = {};
  if (this.editable) {
    // Copy data, we don't want change the original:
    extend(d, this.data);

    // Filter slots to get only that updated by de user:
    d.slots = objectUtils.filterProperties(d.slots, function (k, v) {
      return v.source == 'user';
    });
  }
  return d;
}
},
// Constructor:
function Monthly(element, options) {
  // Reusing base constructor too for initializing:
  LcWidget.call(this, element, options);
  // To use this in closures:
  var that = this;

  // Initializing some data, being care of any value
  // that comes from merging options into 'this'
  this.user = this.user || this.$el.data('calendar-user');
  this.query = extend({
    user: this.user,
    type: 'monthly-schedule'
  }, this.query);

  // If is not set by constructor options, get 
  // 'editable' from data, or left default:
  if (!(options && typeof (options.editable) != 'undefined') &&
    typeof (this.$el.data('editable')) != 'undefined')
    this.editable = !!this.$el.data('editable');


  // Set handlers for prev-next actions:
  this.$el.on('click', '.' + this.classes.prevAction, function prev() {
    moveBindMonth(that, -1);
  });
  this.$el.on('click', '.' + this.classes.nextAction, function next() {
    moveBindMonth(that, 1);
  });
  // Handler for today action
  this.$el.on('click', '.' + this.classes.todayAction, function today() {
    that.bindData(utils.date.currentMonthWeeks(null, this.showSixWeeks));
  });

  // Editable mode
  if (this.editable) {
    this.query.editable = true;
    this.$el.on('click', '.' + this.classes.slots + ' td', function clickToggleAvailability() {
      toggleDateAvailability(that, $(this));
    });
    this.$el.addClass(this.classes.editable);
  }

  // Creating the bookingsNotification element, both editable and read-only modes.
  // Read-only mode need hidden the element and thats done on constructor and editable
  // will render it on bindData
  this.bookingsNotification = new BookingsNotification(this.$el.find('.' + this.classes.bookingsNotification));

  // Start fetching current month
  var firstDates = utils.date.currentMonthWeeks(null, this.showSixWeeks);
  this.fetchData(utils.datesToQuery(firstDates)).done(function () {
    that.bindData(firstDates);
    // Prefetching next month in advance
    monthlyCheckAndPrefetch(that, firstDates);
  });

  checkCurrentMonth(this.$el, firstDates.start, this);

  // Show error message
  this.events.on('hasErrorChanged', utils.handlerCalendarError);
});

/** Static utility: found all components with the Weekly calendar class
and enable it
**/
Monthly.enableAll = function on(options) {
  var list = [];
  $('.' + Monthly.prototype.classes.monthlyCalendar).each(function () {
    list.push(new Monthly(this, options));
  });
  return list;
};

module.exports = Monthly;

},{"../CX/LcWidget":5,"../CX/extend":6,"./BookingsNotification":33,"./objectUtils":43,"./utils":44,"LC/dateISO8601":"0dIKTs"}],35:[function(require,module,exports){
/**
  Weekly calendar class
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  LcWidget = require('../CX/LcWidget'),
  extend = require('../CX/extend');
var utils = require('./utils');

/**
Weekly calendar, inherits from LcWidget
**/
var Weekly = LcWidget.extend(
// Prototype
{
classes: utils.weeklyClasses,
texts: utils.weeklyTexts,
url: '/calendar/get-availability/',

// Our 'view' will be a subset of the data,
// delimited by the next property, a dates range:
datesRange: { start: null, end: null },
bindData: function bindDataWeekly(datesRange) {
  if (!this.data || !this.data.slots) return;

  this.datesRange = datesRange = datesRange || this.datesRange;
  var 
      slotsContainer = this.$el.find('.' + this.classes.slots),
      slots = slotsContainer.find('td');

  utils.checkCurrentWeek(this.$el, datesRange.start, this);

  utils.updateLabels(datesRange, this.$el, this);

  // Remove any previous status class from all slots
  for (var s = 0; s < utils.statusTypes.length; s++) {
    slots.removeClass(this.classes.slotStatusPrefix + utils.statusTypes[s] || '_');
  }

  if (!this.data || !this.data.defaultStatus)
    return;

  // Set all slots with default status
  slots.addClass(this.classes.slotStatusPrefix + this.data.defaultStatus);

  if (!this.data.slots || !this.data.status)
    return;

  var that = this;

  utils.date.eachDateInRange(datesRange.start, datesRange.end, function (date, i) {
    var datekey = dateISO.dateLocal(date, true);
    var dateSlots = that.data.slots[datekey];
    if (dateSlots) {
      for (s = 0; s < dateSlots.length; s++) {
        var slot = dateSlots[s];
        var slotCell = utils.findCellBySlot(slotsContainer, i, slot);
        // Remove default status
        slotCell.removeClass(that.classes.slotStatusPrefix + that.data.defaultStatus || '_');
        // Adding status class
        slotCell.addClass(that.classes.slotStatusPrefix + that.data.status);
      }
    }
  });
}
},
// Constructor:
function Weekly(element, options) {
  // Reusing base constructor too for initializing:
  LcWidget.call(this, element, options);
  // To use this in closures:
  var that = this;

  this.user = this.$el.data('calendar-user');
  this.query = {
    user: this.user,
    type: 'weekly'
  };

  // Start fetching current week
  var firstDates = utils.date.currentWeek();
  this.fetchData(utils.datesToQuery(firstDates)).done(function () {
    that.bindData(firstDates);
    // Prefetching next week in advance
    utils.weeklyCheckAndPrefetch(that, firstDates);
  });
  utils.checkCurrentWeek(this.$el, firstDates.start, this);

  // Set handlers for prev-next actions:
  this.$el.on('click', '.' + this.classes.prevAction, function prev() {
    utils.moveBindRangeInDays(that, -7);
  });
  this.$el.on('click', '.' + this.classes.nextAction, function next() {
    utils.moveBindRangeInDays(that, 7);
  });

  // Show error message
  this.events.on('hasErrorChanged', utils.handlerCalendarError);

});

/** Static utility: found all components with the Weekly calendar class
and enable it
**/
Weekly.enableAll = function on(options) {
  var list = [];
  $('.' + Weekly.prototype.classes.weeklyCalendar).each(function () {
    list.push(new Weekly(this, options));
  });
  return list;
};

module.exports = Weekly;

},{"../CX/LcWidget":5,"../CX/extend":6,"./utils":44,"LC/dateISO8601":"0dIKTs"}],36:[function(require,module,exports){
/**
  Work Hours calendar class
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  LcWidget = require('../CX/LcWidget'),
  extend = require('../CX/extend'),
  utils = require('./utils'),
  clearCurrentSelection = require('./clearCurrentSelection'),
  makeUnselectable = require('./makeUnselectable');
require('../jquery.bounds');

/**
Work hours private utils
**/
function setupEditWorkHours() {
  var that = this;
  // Set handlers to switch status and update backend data
  // when the user select cells
  var slotsContainer = this.$el.find('.' + this.classes.slots);

  function toggleCell(cell) {
    // Find day and time of the cell:
    var slot = utils.findSlotByCell(slotsContainer, cell);
    // Get week-day slots array:
    var wkslots = that.data.slots[utils.systemWeekDays[slot.day]] = that.data.slots[utils.systemWeekDays[slot.day]] || [];
    // If it has already the data.status, toggle to the defaultStatus
    //  var statusClass = that.classes.slotStatusPrefix + that.data.status,
    //      defaultStatusClass = that.classes.slotStatusPrefix + that.data.defaultStatus;
    //if (cell.hasClass(statusClass
    // Toggle from the array
    var strslot = dateISO.timeLocal(slot.slot, true),
      islot = wkslots.indexOf(strslot);
    if (islot == -1)
      wkslots.push(strslot);
    else
    //delete wkslots[islot];
      wkslots.splice(islot, 1);
  }

  function toggleCellRange(firstCell, lastCell) {
    var 
      x = firstCell.siblings('td').andSelf().index(firstCell),
      y1 = firstCell.closest('tr').index(),
    //x2 = lastCell.siblings('td').andSelf().index(lastCell),
      y2 = lastCell.closest('tr').index();

    if (y1 > y2) {
      var y0 = y1;
      y1 = y2;
      y2 = y0;
    }

    for (var y = y1; y <= y2; y++) {
      var cell = firstCell.closest('tbody').children('tr:eq(' + y + ')').children('td:eq(' + x + ')');
      toggleCell(cell);
    }
  }

  var dragging = {
    first: null,
    last: null,
    selectionLayer: $('<div class="SelectionLayer" />').appendTo(this.$el),
    done: false
  };
  
  function offsetToPosition(el, offset) {
    var pb = $(el.offsetParent).bounds(),
      s = {};

    s.top = offset.top - pb.top;
    s.left = offset.left - pb.left;

    //s.bottom = pb.top - offset.bottom;
    //s.right = offset.left - offset.right;
    s.height = offset.bottom - offset.top;
    s.width = offset.right - offset.left;

    $(el).css(s);
    return s;
  }

  function updateSelection(el) {
    var a = dragging.first.bounds({ includeBorder: true });
    var b = el.bounds({ includeBorder: true });
    var s = dragging.selectionLayer.bounds({ includeBorder: true });

    s.top = a.top < b.top ? a.top : b.top;
    s.bottom = a.bottom > b.bottom ? a.bottom : b.bottom;

    offsetToPosition(dragging.selectionLayer[0], s);
  }

  function finishDrag() {
    if (dragging.first && dragging.last) {
      toggleCellRange(dragging.first, dragging.last);
      that.bindData();

      dragging.done = true;
    }
    dragging.first = dragging.last = null;
    dragging.selectionLayer.hide();
    makeUnselectable.off(that.$el);
    return true;
  }

  this.$el.find(slotsContainer).on('click', 'td', function () {
    // Do except after a dragging done complete
    if (dragging.done) return false;
    toggleCell($(this));
    that.bindData();
    return false;
  });

  this.$el.find(slotsContainer)
  .on('mousedown', 'td', function () {
    dragging.done = false;
    dragging.first = $(this);
    dragging.last = null;
    dragging.selectionLayer.show();

    makeUnselectable(that.$el);
    clearCurrentSelection();

    var s = dragging.first.bounds({ includeBorder: true });
    offsetToPosition(dragging.selectionLayer[0], s);

  })
  .on('mouseenter', 'td', function () {
    if (dragging.first) {
      dragging.last = $(this);

      updateSelection(dragging.last);
    }
  })
  .on('mouseup', finishDrag)
  .find('td')
  .attr('draggable', false);

  // This will not work with pointer-events:none, but on other
  // cases (recentIE)
  dragging.selectionLayer.on('mouseup', finishDrag)
  .attr('draggable', false);

}

/**
Work hours calendar, inherits from LcWidget
**/
var WorkHours = LcWidget.extend(
// Prototype
{
classes: extend({}, utils.weeklyClasses, {
  weeklyCalendar: undefined,
  workHoursCalendar: 'AvailabilityCalendar--workHours'
}),
texts: utils.weeklyTexts,
url: '/calendar/get-availability/',
bindData: function bindDataWorkHours() {
  var 
    slotsContainer = this.$el.find('.' + this.classes.slots),
    slots = slotsContainer.find('td');

  // Remove any previous status class from all slots
  for (var s = 0; s < utils.statusTypes.length; s++) {
    slots.removeClass(this.classes.slotStatusPrefix + utils.statusTypes[s] || '_');
  }

  if (!this.data || !this.data.defaultStatus)
    return;

  // Set all slots with default status
  slots.addClass(this.classes.slotStatusPrefix + this.data.defaultStatus);

  if (!this.data.slots || !this.data.status)
    return;

  var that = this;
  for (var wk = 0; wk < utils.systemWeekDays.length; wk++) {
    var dateSlots = that.data.slots[utils.systemWeekDays[wk]];
    if (dateSlots && dateSlots.length) {
      for (s = 0; s < dateSlots.length; s++) {
        var slot = dateSlots[s];
        var slotCell = utils.findCellBySlot(slotsContainer, wk, slot);
        // Remove default status
        slotCell.removeClass(that.classes.slotStatusPrefix + that.data.defaultStatus || '_');
        // Adding status class
        slotCell.addClass(that.classes.slotStatusPrefix + that.data.status);
      }
    }
  }
}
},
// Constructor:
function WorkHours(element, options) {
  LcWidget.call(this, element, options);
  var that = this;

  this.user = this.$el.data('calendar-user');

  this.query = {
    user: this.user,
    type: 'workHours'
  };

  // Fetch the data: there is not a more specific query,
  // it just get the hours for each week-day (data
  // slots are per week-day instead of per date compared
  // to *weekly*)
  this.fetchData().done(function () {
    that.bindData();
  });

  setupEditWorkHours.call(this);

  // Show error message
  this.events.on('hasErrorChanged', utils.handlerCalendarError);

});

/** Static utility: found all components with the Workhours calendar class
and enable it
**/
WorkHours.enableAll = function on(options) {
  var list = [];
  $('.' + WorkHours.prototype.classes.workHoursCalendar).each(function () {
    list.push(new WorkHours(this, options));
  });
  return list;
};

module.exports = WorkHours;
},{"../CX/LcWidget":5,"../CX/extend":6,"../jquery.bounds":64,"./clearCurrentSelection":37,"./makeUnselectable":42,"./utils":44,"LC/dateISO8601":"0dIKTs"}],37:[function(require,module,exports){
/**
Cross browser way to unselect current selection
**/
module.exports = function clearCurrentSelection() {
  if (typeof (window.getSelection) === 'function')
  // Standard
    window.getSelection().removeAllRanges();
  else if (document.selection && typeof (document.selection.empty) === 'function')
  // IE
    document.selection.empty();
};
},{}],38:[function(require,module,exports){
/**
  A collection of useful generic utils managing Dates
**/
var dateISO = require('LC/dateISO8601');

function currentWeek() {
  return {
    start: getFirstWeekDate(new Date()),
    end: getLastWeekDate(new Date())
  };
}
exports.currentWeek = currentWeek;

function nextWeek(start, end) {
  // Unique param with both propierties:
  if (start.end) {
    end = start.end;
    start = start.start;
  }
  // Optional end:
  end = end || addDays(start, 7);
  return {
    start: addDays(start, 7),
    end: addDays(end, 7)
  };
}
exports.nextWeek = nextWeek;

function getFirstWeekDate(date) {
  var d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}
exports.getFirstWeekDate = getFirstWeekDate;

function getLastWeekDate(date) {
  var d = new Date(date);
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d;
}
exports.getLastWeekDate = getLastWeekDate;

function isInCurrentWeek(date) {
  return dateISO.dateLocal(getFirstWeekDate(date)) == dateISO.dateLocal(getFirstWeekDate(new Date()));
}
exports.isInCurrentWeek = isInCurrentWeek;

function addDays(date, days) {
  var d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
exports.addDays = addDays;

function eachDateInRange(start, end, fn) {
  if (!fn.call) throw new Error('fn must be a function or "call"able object');
  var date = new Date(start);
  var i = 0, ret;
  while (date <= end) {
    ret = fn.call(fn, date, i);
    // Allow fn to cancel the loop with strict 'false'
    if (ret === false)
      break;
    date.setDate(date.getDate() + 1);
    i++;
  }
}
exports.eachDateInRange = eachDateInRange;

/** Months **/

function getFirstMonthDate(date) {
  var d = new Date(date);
  d.setDate(1);
  return d;
}
exports.getFirstMonthDate = getFirstMonthDate;

function getLastMonthDate(date) {
  var d = new Date(date);
  d.setMonth(d.getMonth() + 1, 1);
  d = addDays(d, -1);
  return d;
}
exports.getLastMonthDate = getLastMonthDate;

function isInCurrentMonth(date) {
  return dateISO.dateLocal(getFirstMonthDate(date)) == dateISO.dateLocal(getFirstMonthDate(new Date()));
}
exports.isInCurrentMonth = isInCurrentMonth;

/**
  Get a dates range for the current month
  (or the given date as base)
**/
function currentMonth(baseDate) {
  baseDate = baseDate || new Date();
  return {
    start: getFirstMonthDate(baseDate),
    end: getLastMonthDate(baseDate)
  };
}
exports.currentMonth = currentMonth;

function nextMonth(fromDate, amountMonths) {
  amountMonths = amountMonths || 1;
  var d = new Date(fromDate);
  return {
    start: d.setMonth(d.getMonth() + amountMonths, 1),
    end: getLastMonthDate(d)
  };
}
exports.nextMonth = nextMonth;

function previousMonth(fromDate, amountMonths) {
  return nextMonth(fromDate, 0 - amountMonths);
}
exports.previousMonth = previousMonth;

/**
  Get a dates range for the complete weeks
  that are part of the current month
  (or the given date as base).
  That means, that start date will be the first
  week date of the first month week (that can
  be the day 1 of the month or one of the last
  dates from the previous months),
  and similar for the end date being the 
  last week date of the last month week.

  @includeSixWeeks: sometimes is useful get ever a
  six weeks dates range staring by the first week of
  the baseDate month. By default is false.
**/
function currentMonthWeeks(baseDate, includeSixWeeks) {
  var r = currentMonth(baseDate),
    s = getFirstWeekDate(r.start),
    e = includeSixWeeks ? addDays(s, 6*7 - 1) : getLastWeekDate(r.end);
  return {
    start: s,
    end: e
  };
}
exports.currentMonthWeeks = currentMonthWeeks;

function nextMonthWeeks(fromDate, amountMonths, includeSixWeeks) {
  return currentMonthWeeks(nextMonth(fromDate, amountMonths).start, includeSixWeeks);
}
exports.nextMonthWeeks = nextMonthWeeks;

function previousMonthWeeks(fromDate, amountMonths, includeSixWeeks) {
  return currentMonthWeeks(previousMonth(fromDate, amountMonths).start, includeSixWeeks);
}
exports.previousMonthWeeks = previousMonthWeeks;

},{"LC/dateISO8601":"0dIKTs"}],39:[function(require,module,exports){
/** Very simple custom-format function to allow 
l10n of texts.
Cover cases:
- M for month
- D for day
**/
module.exports = function formatDate(date, format) {
  var s = format,
      M = date.getMonth() + 1,
      D = date.getDate();
  s = s.replace(/M/g, M);
  s = s.replace(/D/g, D);
  return s;
};
},{}],"xu1BAO":[function(require,module,exports){
/**
  Exposing all the public features and components of availabilityCalendar
**/
exports.Weekly = require('./Weekly');
exports.WorkHours = require('./WorkHours');
exports.Monthly = require('./Monthly');
},{"./Monthly":34,"./Weekly":35,"./WorkHours":36}],"LC/availabilityCalendar":[function(require,module,exports){
module.exports=require('xu1BAO');
},{}],42:[function(require,module,exports){
/**
  Make an element unselectable, useful to implement some custom
  selection behavior or drag&drop.
  If offers an 'off' method to restore back the element behavior.
**/
var $ = require('jquery');

module.exports = (function () {

  var falsyfn = function () { return false; };
  var nodragStyle = {
    '-webkit-touch-callout': 'none',
    '-khtml-user-drag': 'none',
    '-webkit-user-drag': 'none',
    '-khtml-user-select': 'none',
    '-webkit-user-select': 'none',
    '-moz-user-select': 'none',
    '-ms-user-select': 'none',
    'user-select': 'none'
  };
  var dragdefaultStyle = {
    '-webkit-touch-callout': 'inherit',
    '-khtml-user-drag': 'inherit',
    '-webkit-user-drag': 'inherit',
    '-khtml-user-select': 'inherit',
    '-webkit-user-select': 'inherit',
    '-moz-user-select': 'inherit',
    '-ms-user-select': 'inherit',
    'user-select': 'inherit'
  };

  var on = function makeUnselectable(el) {
    el = $(el);
    el.on('selectstart', falsyfn);
    //$(document).on('selectstart', falsyfn);
    el.css(nodragStyle);
  };

  var off = function offMakeUnselectable(el) {
    el = $(el);
    el.off('selectstart', falsyfn);
    //$(document).off('selectstart', falsyfn);
    el.css(dragdefaultStyle);
  };

  on.off = off;
  return on;

} ());
},{}],43:[function(require,module,exports){
/**
  A set of generic utilities to manage js objects
**/
var u = {};

/**
  Performs a callback on each property owned by the object
**/
u.eachProperty = function eachProperty(obj, cb) {
  for (var p in obj) {
    if (!obj.hasOwnProperty(p)) continue;
    cb.call(obj, p, obj[p]);
  }
};

/**
  Filter the given object returning a new one with only the properties
  (and original values -refs for object values-) that pass
  the provided @filter callback (callback must return a true/truthy value
  for each value desired in the result).
  The @filter callback its executed with the object as context and receives
  as paremeters the property key and its value "filter(k, v)".
**/
u.filterProperties = function filterProperies(obj, filter) {
  var r = {};
  u.eachProperty(obj, function (k, v) {
    if (filter.call(obj, k, v))
      r[k] = v;
  });
  return r;
};

module.exports = u;
},{}],44:[function(require,module,exports){
/**
  AvailabilityCalendar shared utils
**/
var 
  $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  dateUtils = require('./dateUtils'),
  formatDate = require('./formatDate');

// Re-exporting:
exports.formatDate = formatDate;
exports.date = dateUtils;

/*------ CONSTANTS ---------*/
var statusTypes = exports.statusTypes = ['unavailable', 'available'];
// Week days names in english for internal system
// use; NOT for localization/translation.
var systemWeekDays = exports.systemWeekDays = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

/*--------- CONFIG - INSTANCE ----------*/
var weeklyClasses = exports.weeklyClasses = {
  calendar: 'AvailabilityCalendar',
  weeklyCalendar: 'AvailabilityCalendar--weekly',
  currentWeek: 'is-currentWeek',
  actions: 'AvailabilityCalendar-actions',
  prevAction: 'Actions-prev',
  nextAction: 'Actions-next',
  days: 'AvailabilityCalendar-days',
  slots: 'AvailabilityCalendar-slots',
  slotHour: 'AvailabilityCalendar-hour',
  slotStatusPrefix: 'is-',
  legend: 'AvailabilityCalendar-legend',
  legendAvailable: 'AvailabilityCalendar-legend-available',
  legendUnavailable: 'AvailabilityCalendar-legend-unavailable',
  status: 'AvailabilityCalendar-status',
  errorMessage: 'AvailabilityCalendar-errorMessage'
};

var weeklyTexts = exports.weeklyTexts = {
  abbrWeekDays: [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ],
  today: 'Today',
  // Allowed special values: M:month, D:day
  abbrDateFormat: 'M/D'
};

/*----------- VIEW UTILS ----------------*/

function handlerCalendarError(err) {
  var msg = '';
  if (err && err.message)
    msg = err.message;
  else if (err && err.exception && err.exception.message)
    msg = err.exception.message;

  var that = this.component;
  var msgContainer = that.$el.find('.' + that.classes.errorMessage);

  if (msg) msg = (msgContainer.data('message-prefix') || '') + msg;

  msgContainer.text(msg);
}
exports.handlerCalendarError = handlerCalendarError;

function moveBindRangeInDays(weekly, days) {
  var 
    start = dateUtils.addDays(weekly.datesRange.start, days),
    end = dateUtils.addDays(weekly.datesRange.end, days),
    datesRange = datesToRange(start, end);

  // Check cache before try to fetch
  var inCache = weeklyIsDataInCache(weekly, datesRange);

  if (inCache) {
    // Just show the data
    weekly.bindData(datesRange);
    // Prefetch except if there is other request in course (can be the same prefetch,
    // but still don't overload the server)
    if (weekly.fetchData.requests.length === 0)
      weeklyCheckAndPrefetch(weekly, datesRange);
  } else {

    // Support for prefetching:
    // Its avoided if there are requests in course, since
    // that will be a prefetch for the same data.
    if (weekly.fetchData.requests.length) {
      // The last request in the pool *must* be the last in finish
      // (must be only one if all goes fine):
      var request = weekly.fetchData.requests[weekly.fetchData.requests.length - 1];

      // Wait for the fetch to perform and sets loading to notify user
      weekly.$el.addClass(weekly.classes.fetching);
      request.done(function () {
        moveBindRangeInDays(weekly, days);
        weekly.$el.removeClass(weekly.classes.fetching || '_');
      });
      return;
    }

    // Fetch (download) the data and show on ready:
    weekly
    .fetchData(datesToQuery(datesRange))
    .done(function () {
      weekly.bindData(datesRange);
      // Prefetch
      weeklyCheckAndPrefetch(weekly, datesRange);
    });
  }
}
exports.moveBindRangeInDays = moveBindRangeInDays;

function weeklyIsDataInCache(weekly, datesRange) {
  if (!weekly.data || !weekly.data.slots) return false;
  // Check cache: if there is almost one date in the range
  // without data, we set inCache as false and fetch the data:
  var inCache = true;
  dateUtils.eachDateInRange(datesRange.start, datesRange.end, function (date) {
    var datekey = dateISO.dateLocal(date, true);
    if (!weekly.data.slots[datekey]) {
      inCache = false;
      return false;
    }
  });
  return inCache;
}
exports.weeklyIsDataInCache = weeklyIsDataInCache;

/**
  For now, given the JSON structure used, the logic
  of monthlyIsDataInCache is the same as weeklyIsDataInCache:
**/
var monthlyIsDataInCache = weeklyIsDataInCache;
exports.monthlyIsDataInCache = monthlyIsDataInCache;


function weeklyCheckAndPrefetch(weekly, currentDatesRange) {
  var nextDatesRange = datesToRange(
    dateUtils.addDays(currentDatesRange.start, 7),
    dateUtils.addDays(currentDatesRange.end, 7)
  );

  if (!weeklyIsDataInCache(weekly, nextDatesRange)) {
    // Prefetching next week in advance
    var prefetchQuery = datesToQuery(nextDatesRange);
    weekly.fetchData(prefetchQuery, null, true);
  }
}
exports.weeklyCheckAndPrefetch = weeklyCheckAndPrefetch;

/** Update the view labels for the week-days (table headers)
**/
function updateLabels(datesRange, calendar, options) {
  var start = datesRange.start,
      end = datesRange.end;

  var days = calendar.find('.' + options.classes.days + ' th');
  var today = dateISO.dateLocal(new Date());
  // First cell is empty ('the cross headers cell'), then offset is 1
  var offset = 1;
  dateUtils.eachDateInRange(start, end, function (date, i) {
    var cell = $(days.get(offset + i)),
        sdate = dateISO.dateLocal(date),
        label = sdate;

    if (today == sdate)
      label = options.texts.today;
    else
      label = options.texts.abbrWeekDays[date.getDay()] + ' ' + formatDate(date, options.texts.abbrDateFormat);

    cell.text(label);
  });
}
exports.updateLabels = updateLabels;

function findCellBySlot(slotsContainer, day, slot) {
  slot = dateISO.parse(slot);
  var 
    x = Math.round(slot.getHours()),
  // Time frames (slots) are 15 minutes divisions
    y = Math.round(slot.getMinutes() / 15),
    tr = slotsContainer.children(':eq(' + Math.round(x * 4 + y) + ')');

  // Slot cell for o'clock hours is at 1 position offset
  // because of the row-head cell
  var dayOffset = (y === 0 ? day + 1 : day);
  return tr.children(':eq(' + dayOffset + ')');
}
exports.findCellBySlot = findCellBySlot;

function findSlotByCell(slotsContainer, cell) {
  var 
    x = cell.siblings('td').andSelf().index(cell),
    y = cell.closest('tr').index(),
    fullMinutes = y * 15,
    hours = Math.floor(fullMinutes / 60),
    minutes = fullMinutes - (hours * 60),
    slot = new Date();
  slot.setHours(hours, minutes, 0, 0);

  return {
    day: x,
    slot: slot
  };
}
exports.findSlotByCell = findSlotByCell;

/**
Mark calendar as current-week and disable prev button,
or remove the mark and enable it if is not.
**/
function checkCurrentWeek(calendar, date, options) {
  var yep = dateUtils.isInCurrentWeek(date);
  calendar.toggleClass(options.classes.currentWeek, yep);
  calendar.find('.' + options.classes.prevAction).prop('disabled', yep);
}
exports.checkCurrentWeek = checkCurrentWeek;

/** Get query object with the date range specified:
**/
function datesToQuery(start, end) {
  // Unique param with both propierties:
  if (start.end) {
    end = start.end;
    start = start.start;
  }
  return {
    start: dateISO.dateLocal(start, true),
    end: dateISO.dateLocal(end, true)
  };
}
exports.datesToQuery = datesToQuery;

/** Pack two dates in a simple but useful
structure { start, end }
**/
function datesToRange(start, end) {
  return {
    start: start,
    end: end
  };
}
exports.datesToRange = datesToRange;

},{"./dateUtils":38,"./formatDate":39,"LC/dateISO8601":"0dIKTs"}],45:[function(require,module,exports){
/* Generic blockUI options sets */
var loadingBlock = { message: '<img width="48px" height="48px" class="loading-indicator" src="' + LcUrl.AppPath + 'img/theme/loading.gif"/>' };
var errorBlock = function (error, reload, style) {
    return {
        css: $.extend({ cursor: 'default' }, style || {}),
        message: '<a class="close-popup" href="#close-popup">X</a><div class="info">There was an error' +
            (error ? ': ' + error : '') +
            (reload ? ' <a href="javascript: ' + reload + ';">Click to reload</a>' : '') +
            '</div>'
    };
};
var infoBlock = function (message, options) {
    return $.extend({
        message: '<a class="close-popup" href="#close-popup">X</a><div class="info">' + message + '</div>'
        /*,css: { cursor: 'default' }*/
        , overlayCSS: { cursor: 'default' }
    }, options);
};

// Module:
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loading: loadingBlock,
        error: errorBlock,
        info: infoBlock
    };
}
},{}],"f5kckb":[function(require,module,exports){
/*= ChangesNotification class
* to notify user about changes in forms,
* tabs, that will be lost if go away from
* the page. It knows when a form is submitted
* and saved to disable notification, and gives
* methods for other scripts to notify changes
* or saving.
*/
var $ = require('jquery'),
    getXPath = require('./getXPath'),
    escapeJQuerySelectorValue = require('./jqueryUtils').escapeJQuerySelectorValue;

var changesNotification = {
    changesList: {},
    defaults: {
        target: null,
        genericChangeSupport: true,
        genericSubmitSupport: false,
        changedFormClass: 'has-changes',
        changedElementClass: 'changed',
        notifyClass: 'notify-changes'
    },
    init: function (options) {
        // User notification to prevent lost changes done
        $(window).on('beforeunload', function () {
            return changesNotification.notify();
        });
        options = $.extend(this.defaults, options);
        if (!options.target)
            options.target = document;
        if (options.genericChangeSupport)
            $(options.target).on('change', 'form:not(.changes-notification-disabled) :input[name]', function () {
                changesNotification.registerChange($(this).closest('form').get(0), this);
            });
        if (options.genericSubmitSupport)
            $(options.target).on('submit', 'form:not(.changes-notification-disabled)', function () {
                changesNotification.registerSave(this);
            });
    },
    notify: function () {
        // Add notification class to the document
        $('html').addClass(this.defaults.notifyClass);
        // Check if there is almost one change in the property list returning the message:
        for (var c in this.changesList)
            return this.quitMessage || (this.quitMessage = $('#lcres-quit-without-save').text()) || '';
    },
    registerChange: function (f, e) {
        if (!e) return;
        var fname = getXPath(f);
        var fl = this.changesList[fname] = this.changesList[fname] || [];
        if ($.isArray(e)) {
            for (var i = 0; i < e.length; i++)
                this.registerChange(f, e[i]);
            return;
        }
        var n = e;
        if (typeof (e) !== 'string') {
            n = e.name;
            // Check if really there was a change checking default element value
            if (typeof (e.defaultValue) != 'undefined' &&
                typeof (e.checked) == 'undefined' &&
                typeof (e.selected) == 'undefined' &&
                e.value == e.defaultValue) {
                // There was no change, no continue
                // and maybe is a regression from a change and now the original value again
                // try to remove from changes list doing registerSave
                this.registerSave(f, [n]);
                return;
            }
            $(e).addClass(this.defaults.changedElementClass);
        }
        if (!(n in fl))
            fl.push(n);
        $(f)
        .addClass(this.defaults.changedFormClass)
        // pass data: form, element name changed, form element changed (this can be null)
        .trigger('lcChangesNotificationChangeRegistered', [f, n, e]);
    },
    registerSave: function (f, els) {
        var fname = getXPath(f);
        if (!this.changesList[fname]) return;
        var prevEls = $.extend([], this.changesList[fname]);
        var r = true;
        if (els) {
            this.changesList[fname] = $.grep(this.changesList[fname], function (el) { return ($.inArray(el, els) == -1); });
            // Don't remove 'f' list if is not empty
            r = this.changesList[fname].length === 0;
        }
        if (r) {
            $(f).removeClass(this.defaults.changedFormClass);
            delete this.changesList[fname];
            // link elements from els to clean-up its classes
            els = prevEls;
        }
        // pass data: form, elements registered as save (this can be null), and 'form fully saved' as third param (bool)
        $(f).trigger('lcChangesNotificationSaveRegistered', [f, els, r]);
        var lchn = this;
        if (els) $.each(els, function () { $('[name="' + escapeJQuerySelectorValue(this) + '"]').removeClass(lchn.defaults.changedElementClass); });
        return prevEls;
    }
};

// Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = changesNotification;
}
},{"./getXPath":56,"./jqueryUtils":"7/CV3J"}],"LC/changesNotification":[function(require,module,exports){
module.exports=require('f5kckb');
},{}],48:[function(require,module,exports){
/* Utility to create iframe with injected html/content instead of URL.
*/
var $ = require('jquery');

module.exports = function createIframe(content, size) {
    var $iframe = $('<iframe width="' + size.width + '" height="' + size.height + '" style="border:none;"></iframe>');
    var iframe = $iframe.get(0);
    // When the iframe is ready
    var iframeloaded = false;
    iframe.onload = function () {
        // Using iframeloaded to avoid infinite loops
        if (!iframeloaded) {
            iframeloaded = true;
            injectIframeHtml(iframe, content);
        }
    };
    return $iframe;
};

/* Puts full html inside the iframe element passed in a secure and compliant mode */
function injectIframeHtml(iframe, html) {
    // put ajax data inside iframe replacing all their html in secure 
    // compliant mode ($.html don't works to inject <html><head> content)

    /* document API version (problems with IE, don't execute iframe-html scripts) */
    /*var iframeDoc =
    // W3C compliant: ns, firefox-gecko, chrome/safari-webkit, opera, ie9
    iframe.contentDocument ||
    // old IE (5.5+)
    (iframe.contentWindow ? iframe.contentWindow.document : null) ||
    // fallback (very old IE?)
    document.frames[iframe.id].document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();*/

    /* javascript URI version (works fine everywhere!) */
    iframe.contentWindow.contents = html;
    iframe.src = 'javascript:window["contents"]';

    // About this technique, this http://sparecycles.wordpress.com/2012/03/08/inject-content-into-a-new-iframe/
}


},{}],49:[function(require,module,exports){
/* CRUDL Helper */
var $ = require('jquery');
var smoothBoxBlock = require('./smoothBoxBlock');
var changesNotification = require('./changesNotification');
require('./jquery.xtsh').plugIn($);
var getText = require('./getText');
var moveFocusTo = require('./moveFocusTo');

exports.defaultSettings = {
  effects: {
    'show-viewer': { effect: 'height', duration: 'slow' },
    'hide-viewer': { effect: 'height', duration: 'slow' },
    'show-editor': { effect: 'height', duration: 'slow' }, // the same as jquery-ui { effect: 'slide', duration: 'slow', direction: 'down' }
    'hide-editor': { effect: 'height', duration: 'slow' }
  },
  events: {
    'edit-ends': 'crudl-edit-ends',
    'edit-starts': 'crudl-edit-starts',
    'editor-ready': 'crudl-editor-ready',
    'editor-showed': 'crudl-editor-showed',
    'create': 'crudl-create',
    'update': 'crudl-update',
    'delete': 'crudl-delete'
  },
  data: {
    'focus-closest': {
      name: 'crudl-focus-closest',
      'default': '*'
    },
    'focus-margin': {
      name: 'crudl-focus-margin',
      'default': 0
    },
    'focus-duration': {
      name: 'crudl-focus-duration',
      'default': 200
    }
  }
};

/**
  Utility to get a data value or the default based on the instance
  settings on the given element
**/
function getDataForElementSetting(instance, el, settingName) {
  var
    setting = instance.settings.data[settingName],
    val = el.data(setting.name) || setting['default'];
  return val;
}

exports.setup = function setupCrudl(onSuccess, onError, onComplete) {
  return {
    on: function on(selector, settings) {
      selector = selector || '.crudl';
      var instance = {
        selector: selector,
        elements: $(selector)
      };
      // Extending default settings with provided ones,
      // but some can be tweak outside too.
      instance.settings = $.extend(true, exports.defaultSettings, settings);
      instance.elements.each(function () {
        var crudl = $(this);
        if (crudl.data('__crudl_initialized__') === true) return;
        var dctx = crudl.data('crudl-context') || '';
        var vwr = crudl.find('.crudl-viewer');
        var dtr = crudl.find('.crudl-editor');
        var iidpar = crudl.data('crudl-item-id-parameter') || 'ItemID';
        var formpars = { action: 'create' };
        formpars[iidpar] = 0;
        var editorInitialLoad = true;

        function getExtraQuery(el) {
          // Get extra query of the element, if any:
          var xq = el.data('crudl-extra-query') || '';
          if (xq) xq = '&' + xq;
          // Iterate all parents including the 'crudl' element (parentsUntil excludes the first element given,
          // because of that we get its parent())
          // For any of them with an extra-query, append it:
          el.parentsUntil(crudl.parent(), '[data-crudl-extra-query]').each(function () {
            var x = $(this).data('crudl-extra-query');
            if (x) xq += '&' + x;
          });
          return xq;
        }

        crudl.find('.crudl-create').click(function () {
          formpars[iidpar] = 0;
          formpars.action = 'create';
          var xq = getExtraQuery($(this));
          editorInitialLoad = true;
          dtr.reload({
            url: function (url, defaultUrl) {
              return defaultUrl + '?' + $.param(formpars) + xq;
            },
            success: function () {
              dtr.xshow(instance.settings.effects['show-editor'])
              .queue(function () {
                crudl.trigger(instance.settings.events['editor-showed'], [dtr]);
                dtr.dequeue();
              });
            }
          });
          // Hide viewer when in editor:
          vwr.xhide(instance.settings.effects['hide-viewer']);
          // Custom event
          crudl.trigger(instance.settings.events['edit-starts'])
          .trigger(instance.settings.events.create);

          return false;
        });

        vwr
        .on('click', '.crudl-update', function () {
          var $t = $(this);
          var item = $t.closest('.crudl-item');
          var itemid = item.data('crudl-item-id');
          formpars[iidpar] = itemid;
          formpars.action = 'update';
          var xq = getExtraQuery($(this));
          editorInitialLoad = true;
          dtr.reload({
            url: function (url, defaultUrl) {
              return defaultUrl + '?' + $.param(formpars) + xq;
            },
            success: function () {
              dtr.xshow(instance.settings.effects['show-editor'])
              .queue(function () {
                crudl.trigger(instance.settings.events['editor-showed'], [dtr]);
                dtr.dequeue();
              });
            }
          });
          // Hide viewer when in editor:
          vwr.xhide(instance.settings.effects['hide-viewer']);
          // Custom event
          crudl.trigger(instance.settings.events['edit-starts'])
          .trigger(instance.settings.events.update);

          return false;
        })
        .on('click', '.crudl-delete', function () {
          var $t = $(this);
          var item = $t.closest('.crudl-item');
          var itemid = item.data('crudl-item-id');

          if (confirm(getText('confirm-delete-crudl-item-message:' + dctx))) {
            smoothBoxBlock.open('<div>' + getText('delete-crudl-item-loading-message:' + dctx) + '</div>', item);
            formpars[iidpar] = itemid;
            formpars.action = 'delete';
            var xq = getExtraQuery($(this));
            $.ajax({
              url: dtr.attr('data-source-url') + '?' + $.param(formpars) + xq,
              success: function (data, text, jx) {
                if (data && data.Code === 0) {
                  smoothBoxBlock.open('<div>' + data.Result + '</div>', item, null, {
                    closable: true,
                    closeOptions: {
                      complete: function () {
                        item.fadeOut('slow', function () { item.remove(); });
                      }
                    }
                  });
                } else
                  onSuccess(data, text, jx);
              },
              error: function (jx, message, ex) {
                onError(jx, message, ex);
                smoothBoxBlock.close(item);
              },
              complete: onComplete
            });
          }

          // Custom event
          crudl.trigger(instance.settings.events['delete']);

          return false;
        });

        function finishEdit() {
          function oncomplete(anotherOnComplete) {
            return function () {
              // Show again the Viewer
              //vwr.slideDown('slow');
              if (!vwr.is(':visible'))
                vwr.xshow(instance.settings.effects['show-viewer']);
              // Mark the form as unchanged to avoid persisting warnings
              changesNotification.registerSave(dtr.find('form').get(0));
              // Avoid cached content on the Editor
              dtr.children().remove();

              // Scroll to preserve correct focus (on large pages with shared content user can get
              // lost after an edition)
              // (we queue after vwr.xshow because we need to do it after the xshow finish)
              vwr.queue(function () {
                var focusClosest = getDataForElementSetting(instance, crudl, 'focus-closest');
                var focusElement = crudl.closest(focusClosest);
                // If no closest, get the crudl
                if (focusElement.length === 0)
                  focusElement = crudl;
                var focusMargin = getDataForElementSetting(instance, crudl, 'focus-margin');
                var focusDuration = getDataForElementSetting(instance, crudl, 'focus-duration');

                moveFocusTo(focusElement, { marginTop: focusMargin, duration: focusDuration });

                vwr.dequeue();
              });

              // user callback:
              if (typeof (anotherOnComplete) === 'function')
                anotherOnComplete.apply(this, Array.prototype.slice.call(arguments, 0));
            };
          }

          // NOTE: First, we notify the changes-saved and event, this last allows
          // client scripts to do tasks just before the editor begins to close
          // (avoiding problems like with the 'moveFocusTo' not being precise if the
          // animation duration is the same on client script and hide-editor).
          // Then, editor gets hidden
          // TODO: This can get enhanced to allow larger durations on client-scripts
          // without affect moveFocusTo passing in the trigger an object that holds
          // a Promise/Deferred to be set by client-script as 'hide-editor &
          // viewer-show must start when this promise gets fullfilled', allowing to
          // have a sequence (first client-scripts, then hide-editor).

          // Mark form as saved to remove the 'has-changes' mark
          changesNotification.registerSave(dtr.find('form').get(0));

          // Custom event
          crudl.trigger(instance.settings.events['edit-ends']);

          // We need a custom complete callback, but to not replace the user callback, we
          // clone first the settings and then apply our callback that internally will call
          // the user callback properly (if any)
          var withcallback = $.extend(true, {}, instance.settings.effects['hide-editor']);
          withcallback.complete = oncomplete(withcallback.complete);
          // Hiding editor:
          dtr.xhide(withcallback);

          return false;
        }

        dtr
        .on('click', '.crudl-cancel', finishEdit)
        .on('ajaxSuccessPostMessageClosed', '.ajax-box', finishEdit)
        // An evented method: trigger this event to execute a viewer reload:
        .on('reloadList', '*', function () {
          vwr.find('.crudl-list').reload({ autofocus: false });
        })
        .on('ajaxSuccessPost', 'form, fieldset', function (e, data) {
          if (data.Code === 0 || data.Code == 5 || data.Code == 6) {
            // Show viewer and reload list:
            vwr.find('.crudl-list').reload({ autofocus: false });
          }
          // A small delay to let user to see the new message on button before
          // hide it (because is inside the editor)
          if (data.Code == 5)
            setTimeout(finishEdit, 1000);

        })
        .on('ajaxFormReturnedHtml', 'form,fieldset', function (jb, form, jx) {
          // Emit the 'editor-ready' event on editor Html being replaced
          // (first load or next loads because of server-side validation errors)
          // to allow listeners to do any work over its (new) DOM elements.
          // The second custom parameter passed means is mean to
          // distinguish the first time content load and successive updates (due to validation errors).
          crudl.trigger(instance.settings.events['editor-ready'], [dtr, editorInitialLoad]);

          // Next times:
          editorInitialLoad = false;
        });

        crudl.data('__crudl_initialized__', true);
      });

      return instance;
    }
  };
};

},{"./changesNotification":"f5kckb","./getText":"qf5Iz3","./jquery.xtsh":69,"./moveFocusTo":"9RKOGW","./smoothBoxBlock":"KQGzNM"}],"LC/dateISO8601":[function(require,module,exports){
module.exports=require('0dIKTs');
},{}],"0dIKTs":[function(require,module,exports){
/**
  This module has utilities to convert a Date object into
  a string representation following ISO-8601 specification.
  
  INCOMPLETE BUT USEFUL.
  
  Standard refers to format variations:
  - basic: minimum separators
  - extended: all separators, more readable
  By default, all methods prints the basic format,
  excepts the parameter 'extended' is set to true

  TODO:
  - TZ: allow for Time Zone suffixes (parse allow it and 
    detect UTC but do nothing with any time zone offset detected)
  - Fractions of seconds
**/
exports.dateUTC = function dateUTC(date, extended) {
  var m = (date.getUTCMonth() + 1).toString(),
      d = date.getUTCDate().toString(),
      y = date.getUTCFullYear().toString();

  if (m.length == 1)
    m = '0' + m;
  if (d.length == 1)
    d = '0' + d;

  if (extended)
    return y + '-' + m + '-' + d;
  else
    return y + m + d;
};

exports.dateLocal = function dateLocal(date, extended) {
  var m = (date.getMonth() + 1).toString(),
      d = date.getDate().toString(),
      y = date.getFullYear().toString();
  if (m.length == 1)
    m = '0' + m;
  if (d.length == 1)
    d = '0' + d;

  if (extended)
    return y + '-' + m + '-' + d;
  else
    return y + m + d;
};

/**
  Hours, minutes and seconds
**/
exports.timeLocal = function timeLocal(date, extended) {
  var s = date.getSeconds().toString(),
      hm = exports.shortTimeLocal(date, extended);

  if (s.length == 1)
    s = '0' + s;

  if (extended)
    return hm + ':' + s;
  else
    return hm + s;
};

/**
  Hours, minutes and seconds UTC
**/
exports.timeUTC = function timeUTC(date, extended) {
  var s = date.getUTCSeconds().toString(),
      hm = exports.shortTimeUTC(date, extended);

  if (s.length == 1)
    s = '0' + s;

  if (extended)
    return hm + ':' + s;
  else
    return hm + s;
};

/**
  Hours and minutes
**/
exports.shortTimeLocal = function shortTimeLocal(date, extended) {
  var h = date.getHours().toString(),
      m = date.getMinutes().toString();

  if (h.length == 1)
    h = '0' + h;
  if (m.length == 1)
    m = '0' + m;

  if (extended)
    return h + ':' + m;
  else
    return h + m;
};

/**
  Hours and minutes UTC
**/
exports.shortTimeUTC = function shortTimeUTC(date, extended) {
  var h = date.getUTCHours().toString(),
      m = date.getUTCMinutes().toString();

  if (h.length == 1)
    h = '0' + h;
  if (m.length == 1)
    m = '0' + m;

  if (extended)
    return h + ':' + m;
  else
    return h + m;
};

/**
  TODO: Hours, minutes, seconds and fractions of seconds
**/
exports.longTimeLocal = function longTimeLocal(date, extended) {
  //TODO
};

/**
  UTC Date and Time separated by T.
  Standard allows omit the separator as exceptional, both parts agreement, cases;
  can be done passing true as of omitSeparator parameter, by default false.
**/
exports.datetimeLocal = function datetimeLocal(date, extended, omitSeparator) {
  var d = exports.dateLocal(date, extended),
      t = exports.timeLocal(date, extended);

  if (omitSeparator)
    return d + t;
  else
    return d + 'T' + t;
};

/**
  Local Date and Time separated by T.
  Standard allows omit the separator as exceptional, both parts agreement, cases;
  can be done passing true as of omitSeparator parameter, by default false.
**/
exports.datetimeUTC = function datetimeUTC(date, extended, omitSeparator) {
  var d = exports.dateUTC(date, extended),
      t = exports.timeUTC(date, extended);

  if (omitSeparator)
    return d + t;
  else
    return d + 'T' + t;
};

/**
  Parse a string into a Date object if is a valid ISO-8601 format.
  Parse single date, single time or date-time formats.
  IMPORTANT: It does NOT convert between the datestr TimeZone and the
  local TimeZone (either it allows datestr to included TimeZone information)
  TODO: Optional T separator is not allowed.
  TODO: Milliseconds/fractions of seconds not supported
**/
exports.parse = function parse(datestr) {
  var dt = datestr.split('T'),
    date = dt[0],
    time = dt.length == 2 ? dt[1] : null;

  if (dt.length > 2)
    throw new Error("Bad input format");

  // Check if date contains a time;
  // because maybe datestr is only the time part
  if (/:|^\d{4,6}[^\-](\.\d*)?(?:Z|[+\-].*)?$/.test(date)) {
    time = date;
    date = null;
  }

  var y, m, d, h, mm, s, tz, utc;

  if (date) {
    var dparts = /(\d{4})\-?(\d{2})\-?(\d{2})/.exec(date);
    if (!dparts)
      throw new Error("Bad input date format");

    y = dparts[1];
    m = dparts[2];
    d = dparts[3];
  }

  if (time) {
    var tparts = /(\d{2}):?(\d{2})(?::?(\d{2}))?(Z|[+\-].*)?/.exec(time);
    if (!tparts)
      throw new Error("Bad input time format");

    h = tparts[1];
    mm = tparts[2];
    s = tparts.length > 3 ? tparts[3] : null;
    tz = tparts.length > 4 ? tparts[4] : null;
    // Detects if is a time in UTC:
    utc = /^Z$/i.test(tz);
  }

  // Var to hold the parsed value, we start with today,
  // that will fill the missing parts
  var parsedDate = new Date();

  if (date) {
    // Updating the date object with each year, month and date/day detected:
    if (utc)
      parsedDate.setUTCFullYear(y, m, d);
    else
      parsedDate.setFullYear(y, m, d);
  }

  if (time) {
    if (utc)
      parsedDate.setUTCHours(h, mm, s);
    else
      parsedDate.setHours(h, mm, s);
  } else {
    // A date without time part must be considered as 00:00:00 instead of current time
    parsedDate.setHours(0, 0, 0);
  }

  return parsedDate;
};
},{}],52:[function(require,module,exports){
/* Date picker initialization and use
 */
var $ = require('jquery');
require('jquery-ui');

function setupDatePicker() {
    // Date Picker
    $.datepicker.setDefaults($.datepicker.regional[$('html').attr('lang')]);
    $('.date-pick', document).datepicker({
        showAnim: 'blind'
    });
    applyDatePicker();
}
function applyDatePicker(element) {
    $(".date-pick", element || document)
    //.val(new Date().asString($.datepicker._defaults.dateFormat))
    .datepicker({
        showAnim: "blind"
    });
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        init: setupDatePicker,
        apply: applyDatePicker
    };

},{}],53:[function(require,module,exports){
/* Format a date as YYYY-MM-DD in UTC for save us
    to interchange with other modules or apps.
*/
module.exports = function dateToInterchangeableString(date) {
    var m = (date.getUTCMonth() + 1).toString(),
        d = date.getUTCDate().toString();
    if (m.length == 1)
        m = '0' + m;
    if (d.length == 1)
        d = '0' + d;
    return date.getUTCFullYear().toString() + '-' + m + '-' + d;
};
},{}],"qf5Iz3":[function(require,module,exports){
/** An i18n utility, get a translation text by looking for specific elements in the html
with the name given as first paramenter and applying the given values on second and 
other parameters.
    TODO: RE-IMPLEMENT not using jQuery nelse DOM elements, or almost not elements inside body
**/
var $ = require('jquery');
var escapeJQuerySelectorValue = require('./jqueryUtils').escapeJQuerySelectorValue;

function getText() {
    var args = arguments;
    // Get key and translate it
    var formatted = args[0];
    var text = $('#lcres-' + escapeJQuerySelectorValue(formatted)).text();
    if (text)
        formatted = text;
    // Apply format to the text with additional parameters
    for (var i = 0; i < args.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, args[i + 1]);
    }
    return formatted;
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = getText;
},{"./jqueryUtils":"7/CV3J"}],"LC/getText":[function(require,module,exports){
module.exports=require('qf5Iz3');
},{}],56:[function(require,module,exports){
/** Returns the path to the given element in XPath convention
**/
var $ = require('jquery');

function getXPath(element) {
    if (element && element.id)
        return '//*[@id="' + element.id + '"]';
    var xpath = '';
    for (; element && element.nodeType == 1; element = element.parentNode) {
        var id = $(element.parentNode).children(element.tagName).index(element) + 1;
        id = (id > 1 ? '[' + id + ']' : '');
        xpath = '/' + element.tagName.toLowerCase() + id + xpath;
    }
    return xpath;
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = getXPath;

},{}],"ygr/Yz":[function(require,module,exports){
// It executes the given 'ready' function as parameter when
// map environment is ready (when google maps api and script is
// loaded and ready to use, or inmediately if is already loaded).

var loader = require('./loader');

// Private static collection of callbacks registered
var stack = [];

var googleMapReady = module.exports = function googleMapReady(ready) {
  stack.push(ready);

  if (googleMapReady.isReady)
    ready();
  else if (!googleMapReady.isLoading) {
    googleMapReady.isLoading = true;
    loader.load({
      scripts: ["https://www.google.com/jsapi"],
      completeVerification: function () { return !!window.google; },
      complete: function () {
        google.load("maps", "3.10", { other_params: "sensor=false", "callback": function () {
          googleMapReady.isReady = true;
          googleMapReady.isLoading = false;

          for (var i = 0; i < stack.length; i++)
            try {
              stack[i]();
            } catch (e) { }
        }
        });
      }
    });
  }
};

// Utility to force the refresh of maps that solve the problem with bad-sized map area
googleMapReady.refreshMap = function refreshMaps(map) {
  googleMapReady(function () {
    google.maps.event.trigger(map, "resize");
  });
};

},{"./loader":72}],"LC/googleMapReady":[function(require,module,exports){
module.exports=require('ygr/Yz');
},{}],59:[function(require,module,exports){
/* GUID Generator
 */
module.exports = function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
},{}],60:[function(require,module,exports){
/**
    Generic script for fieldsets with class .has-confirm, allowing show
    the content only if the main confirm fields have 'yes' selected.
**/
var $ = require('jquery');

var defaultSelector = 'fieldset.has-confirm > .confirm input';

function onchange() {
    var t = $(this);
    var fs = t.closest('fieldset');
    if (t.is(':checked'))
        if (t.val() == 'yes' || t.val() == 'True')
            fs.removeClass('confirmed-no').addClass('confirmed-yes');
        else
            fs.removeClass('confirmed-yes').addClass('confirmed-no');
}

exports.on = function (selector) {
    selector = selector || defaultSelector;

    $(document).on('change', selector, onchange);
    // Performs first check:
    $(selector).change();
};

exports.off = function (selector) {
    selector = selector || defaultSelector;

    $(document).off('change', selector);
};
},{}],61:[function(require,module,exports){
/* Internazionalization Utilities
 */
var i18n = {};
i18n.distanceUnits = {
    'ES': 'km',
    'US': 'miles'
};
i18n.numericMilesSeparator = {
    'es-ES': '.',
    'es-US': '.',
    'en-US': ',',
    'en-ES': ','
};
i18n.numericDecimalSeparator = {
    'es-ES': ',',
    'es-US': ',',
    'en-US': '.',
    'en-ES': '.'
};
i18n.moneySymbolPrefix = {
    'ES': '',
    'US': '$'
};
i18n.moneySymbolSufix = {
    'ES': '€',
    'US': ''
};
i18n.getCurrentCulture = function getCurrentCulture() {
    var c = document.documentElement.getAttribute('data-culture');
    var s = c.split('-');
    return {
        culture: c,
        language: s[0],
        country: s[1]
    };
};
i18n.convertMilesKm = function convertMilesKm(q, unit) {
    var MILES_TO_KM = 1.609;
    if (unit == 'miles')
        return MILES_TO_KM * q;
    else if (unit == 'km')
        return q / MILES_TO_KM;
    if (console && console.log) console.log('convertMilesKm: Unrecognized unit ' + unit);
    return 0;
};

if (typeof module !== 'undefined' && module.exports)
    module.exports = i18n;
},{}],62:[function(require,module,exports){
/* Returns true when str is
- null
- empty string
- only white spaces string
*/
module.exports = function isEmptyString(str) {
    return !(/\S/g.test(str || ""));
};
},{}],63:[function(require,module,exports){
/** As the 'is' jQuery method, but checking @selector in all elements
* @modifier values:
* - 'all': all elements must match selector to return true
* - 'almost-one': almost one element must match
* - 'percentage': returns percentage number of elements that match selector (0-100)
* - 'summary': returns the object { yes: number, no: number, percentage: number, total: number }
* - {just: a number}: exact number of elements that must match to return true
* - {almost: a number}: minimum number of elements that must match to return true
* - {until: a number}: maximum number of elements that must match to return true
**/
var $ = jQuery || require('jquery');
$.fn.are = function (selector, modifier) {
    modifier = modifier || 'all';
    var count = 0;
    this.each(function () {
        if ($(this).is(selector))
            count++;
    });
    switch (modifier) {
        case 'all':
            return this.length == count;
        case 'almost-one':
            return count > 0;
        case 'percentage':
            return count / this.length;
        case 'summary':
            return {
                yes: count,
                no: this.length - count,
                percentage: count / this.length,
                total: this.length
            };
        default:
            {
                if ('just' in modifier &&
                modifier.just != count)
                    return false;
                if ('almost' in modifier &&
                modifier.almost > count)
                    return false;
                if ('until' in modifier &&
                modifier.until < count)
                    return false;
                return true;
            }
    }
};
},{}],64:[function(require,module,exports){
/** ===================
Extension jquery: 'bounds'
Returns an object with the combined bounds for all 
elements in the collection
*/
(function () {
  jQuery.fn.bounds = function (options) {
    options = $.extend(true, {}, {
      includeBorder: false,
      includeMargin: false
    }, options);
    var bounds = {
      left: Number.POSITIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
      width: Number.NaN,
      height: Number.NaN
    };

    var fnWidth = options.includeBorder || options.includeMargin ? 
      function(el){ return $.fn.outerWidth.call(el, options.includeMargin); } :
      function(el){ return $.fn.width.call(el); };
    var fnHeight = options.includeBorder || options.includeMargin ? 
      function(el){ return $.fn.outerHeight.call(el, options.includeMargin); } :
      function(el){ return $.fn.height.call(el); };

    this.each(function (i, el) {
      var elQ = $(el);
      var off = elQ.offset();
      off.right = off.left + fnWidth($(elQ));
      off.bottom = off.top + fnHeight($(elQ));

      if (off.left < bounds.left)
        bounds.left = off.left;

      if (off.top < bounds.top)
        bounds.top = off.top;

      if (off.right > bounds.right)
        bounds.right = off.right;

      if (off.bottom > bounds.bottom)
        bounds.bottom = off.bottom;
    });

    bounds.width = bounds.right - bounds.left;
    bounds.height = bounds.bottom - bounds.top;
    return bounds;
  };
})();
},{}],65:[function(require,module,exports){
/**
* HasScrollBar returns an object with bool properties 'vertical' and 'horizontal'
* saying if the element has need of scrollbars for each dimension or not (element
* can need scrollbars and still not being showed because the css-overlflow property
* being set as 'hidden', but still we know that the element requires it and its
* content is not being fully displayed).
* @extragap, defaults to {x:0,y:0}, lets specify an extra size in pixels for each dimension that alter the real check,
* resulting in a fake result that can be interesting to discard some pixels of excess
* size (negative values) or exagerate the real used size with that extra pixels (positive values).
**/
var $ = jQuery || require('jquery');
$.fn.hasScrollBar = function (extragap) {
    extragap = $.extend({
        x: 0,
        y: 0
    }, extragap);
    if (!this || this.length === 0) return { vertical: false, horizontal: false };
    //note: clientHeight= height of holder
    //scrollHeight= we have content till this height
    var t = this.get(0);
    return {
        vertical: this.outerHeight(false) < (t.scrollHeight + extragap.y),
        horizontal: this.outerWidth(false) < (t.scrollWidth + extragap.x)
    };
};
},{}],66:[function(require,module,exports){
/** Checks if current element or one of the current set of elements has
a parent that match the element or expression given as first parameter
**/
var $ = jQuery || require('jquery');
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};
},{}],67:[function(require,module,exports){
/**
    Gets the html string of the first element and all its content.
    The 'html' method only retrieves the html string of the content, not the element itself.
**/
var $ = jQuery || require('jquery');
$.fn.outerHtml = function () {
    if (!this || this.length === 0) return '';
    var el = this.get(0);
    var html = '';
    if (el.outerHTML)
        html = el.outerHTML;
    else {
        html = this.wrapAll('<div></div>').parent().html();
        this.unwrap();
    }
    return html;
};
},{}],68:[function(require,module,exports){
/**
    Using the attribute data-source-url on any HTML element,
    this allows reload its content performing an AJAX operation
    on the given URL or the one in the attribute; the end-point
    must return text/html content.
**/
var $ = jQuery || require('jquery');
var smoothBoxBlock = require('./smoothBoxBlock');

// Default success callback and public utility, basic how-to replace element content with fetched html
function updateElement(htmlContent, context) {
    context = $.isPlainObject(context) && context ? context : this;

    // create jQuery object with the HTML
    var newhtml = new jQuery();
    // Avoid empty documents being parsed (raise error)
    htmlContent = $.trim(htmlContent);
    if (htmlContent) {
      // Try-catch to avoid errors when an empty document or malformed is returned:
      try {
        // parseHTML since jquery-1.8 is more secure:
        if (typeof ($.parseHTML) === 'function')
          newhtml = $($.parseHTML(htmlContent));
        else
          newhtml = $(htmlContent);
      } catch (ex) {
        if (console && console.error)
          console.error(ex);
        return;
      }
    }

    var element = context.element;
    if (context.options.mode == 'replace-me')
        element.replaceWith(newhtml);
    else // 'replace-content'
        element.html(newhtml);

    return context;
}

// Default complete callback and public utility
function stopLoadingSpinner() {
    clearTimeout(this.loadingTimer);
    smoothBoxBlock.close(this.element);
}

// Defaults
var defaults = {
    url: null,
    success: [updateElement],
    error: [],
    complete: [stopLoadingSpinner],
    autofocus: true,
    mode: 'replace-content',
    loading: {
        lockElement: true,
        lockOptions: {},
        message: null,
        showLoadingIndicator: true,
        delay: 0
    }
};

/* Reload method */
var reload = $.fn.reload = function () {
    // Options from defaults (internal and public)
    var options = $.extend(true, {}, defaults, reload.defaults);
    // If options object is passed as unique parameter
    if (arguments.length == 1 && $.isPlainObject(arguments[0])) {
        // Merge options:
        $.extend(true, options, arguments[0]);
    } else {
        // Common overload: new-url and complete callback, both optionals
        options.url = arguments.length > 0 ? arguments[0] : null;
        options.complete = arguments.length > 1 ? arguments[1] : null;
    }

    this.each(function () {
        var $t = $(this);

        if (options.url) {
            if ($.isFunction(options.url))
            // Function params: currentReloadUrl, defaultReloadUrl
                $t.data('source-url', $.proxy(options.url, this)($t.data('source-url'), $t.attr('data-source-url')));
            else
                $t.data('source-url', options.url);
        }
        var url = $t.data('source-url');

        // Check if there is already being reloaded, to cancel previous attempt
        var jq = $t.data('isReloading');
        if (jq) {
            if (jq.url == url)
                // Is the same url, do not abort because is the same result being retrieved
                return;
            else
                jq.abort();
        }

        // Optional data parameter 'reload-mode' accepts values: 
        // - 'replace-me': Use html returned to replace current reloaded element (aka: replaceWith())
        // - 'replace-content': (default) Html returned replace current element content (aka: html())
        options.mode = $t.data('reload-mode') || options.mode;

        if (url) {

            // Loading, with delay
            var loadingtimer = options.loading.lockElement ?
                setTimeout(function () {
                    // Creating content using a fake temp parent element to preload image and to get real message width:
                    var loadingcontent = $('<div/>')
                    .append(options.loading.message ? $('<div class="loading-message"/>').append(options.loading.message) : null)
                    .append(options.loading.showLoadingIndicator ? options.loading.message : null);
                    loadingcontent.css({ position: 'absolute', left: -99999 }).appendTo('body');
                    var w = loadingcontent.width();
                    loadingcontent.detach();
                    // Locking:
                    options.loading.lockOptions.autofocus = options.autofocus;
                    options.loading.lockOptions.width = w;
                    smoothBoxBlock.open(loadingcontent.html(), $t, options.loading.message ? 'custom-loading' : 'loading', options.loading.lockOptions);
                }, options.loading.delay)
                : null;

            // Prepare context
            var ctx = {
                element: $t,
                options: options,
                loadingTimer: loadingtimer
            };

            // Do the Ajax post
            jq = $.ajax({
                url: url,
                type: 'GET',
                context: ctx
            });

            // Url is set in the returned ajax object because is not set by all versions of jQuery
            jq.url = url;

            // Mark element as is being reloaded, to avoid multiple attemps at same time, saving
            // current ajax object to allow be cancelled
            $t.data('isReloading', jq);
            jq.always(function () {
                $t.data('isReloading', null);
            });

            // Callbacks: first globals and then from options if they are different
            // success
            jq.done(reload.defaults.success);
            if (options.success != reload.defaults.success)
                jq.done(options.success);
            // error
            jq.fail(reload.defaults.error);
            if (options.error != reload.defaults.error)
                jq.fail(options.error);
            // complete
            jq.always(reload.defaults.complete);
            if (options.complete != reload.defaults.complete)
                jq.done(options.complete);
        }
    });
    return this;
};

// Public defaults
reload.defaults = $.extend(true, {}, defaults);

// Public utilities
reload.updateElement = updateElement;
reload.stopLoadingSpinner = stopLoadingSpinner;

// Module
module.exports = reload;
},{"./smoothBoxBlock":"KQGzNM"}],69:[function(require,module,exports){
/** Extended toggle-show-hide funtions.
    IagoSRL@gmail.com
    Dependencies: jquery
 **/
(function(){

    /** Implementation: require jQuery and returns object with the
        public methods.
     **/
    function xtsh(jQuery) {
        var $ = jQuery;

        /**
         * Hide an element using jQuery, allowing use standard  'hide' and 'fadeOut' effects, extended
         * jquery-ui effects (is loaded) or custom animation through jquery 'animate'.
         * Depending on options.effect:
         * - if not present, jQuery.hide(options)
         * - 'animate': jQuery.animate(options.properties, options)
         * - 'fade': jQuery.fadeOut
         */
        function hideElement(element, options) {
            var $e = $(element);
            switch (options.effect) {
                case 'animate':
                    $e.animate(options.properties, options);
                    break;
                case 'fade':
                    $e.fadeOut(options);
                    break;
                case 'height':
                    $e.slideUp(options);
                    break;
                // 'size' value and jquery-ui effects go to standard 'hide'
                // case 'size':
                default:
                    $e.hide(options);
                    break;
            }
            $e.trigger('xhide', [options]);
        }

        /**
        * Show an element using jQuery, allowing use standard  'show' and 'fadeIn' effects, extended
        * jquery-ui effects (is loaded) or custom animation through jquery 'animate'.
        * Depending on options.effect:
        * - if not present, jQuery.hide(options)
        * - 'animate': jQuery.animate(options.properties, options)
        * - 'fade': jQuery.fadeOut
        */
        function showElement(element, options) {
            var $e = $(element);
            // We performs a fix on standard jQuery effects
            // to avoid an error that prevents from running
            // effects on elements that are already visible,
            // what lets the possibility of get a middle-animated
            // effect.
            // We just change display:none, forcing to 'is-visible' to
            // be false and then running the effect.
            // There is no flickering effect, because jQuery just resets
            // display on effect start.
            switch (options.effect) {
                case 'animate':
                    $e.animate(options.properties, options);
                    break;
                case 'fade':
                    // Fix
                    $e.css('display', 'none')
                    .fadeIn(options);
                    break;
                case 'height':
                    // Fix
                    $e.css('display', 'none')
                    .slideDown(options);
                    break;
                // 'size' value and jquery-ui effects go to standard 'show'
                // case 'size':
                default:
                    // Fix
                    $e.css('display', 'none')
                    .show(options);
                    break;
            }
            $e.trigger('xshow', [options]);
        }

        /** Generic utility for highly configurable jQuery.toggle with support
            to specify the toggle value explicity for any kind of effect: just pass true as second parameter 'toggle' to show
            and false to hide. Toggle must be strictly a Boolean value to avoid auto-detection.
            Toggle parameter can be omitted to auto-detect it, and second parameter can be the animation options.
            All the others behave exactly as hideElement and showElement.
        **/
        function toggleElement(element, toggle, options) {
            // If toggle is not a boolean
            if (toggle !== true && toggle !== false) {
                // If toggle is an object, then is the options as second parameter
                if ($.isPlainObject(toggle))
                    options = toggle;
                // Auto-detect toggle, it can vary on any element in the collection,
                // then detection and action must be done per element:
                $(element).each(function () {
                    // Reusing function, with explicit toggle value
                    toggleElement(this, !$(this).is(':visible'), options);
                });
            }
            if (toggle)
                showElement(element, options);
            else
                hideElement(element, options);
        }
        
        /** Do jQuery integration as xtoggle, xshow, xhide
         **/
        function plugIn(jQuery) {
            /** toggleElement as a jQuery method: xtoggle
             **/
            jQuery.fn.xtoggle = function xtoggle(toggle, options) {
                toggleElement(this, toggle, options);
                return this;
            };

            /** showElement as a jQuery method: xhide
            **/
            jQuery.fn.xshow = function xshow(options) {
                showElement(this, options);
                return this;
            };

            /** hideElement as a jQuery method: xhide
             **/
            jQuery.fn.xhide = function xhide(options) {
                hideElement(this, options);
                return this;
            };
        }

        // Exporting:
        return {
            toggleElement: toggleElement,
            showElement: showElement,
            hideElement: hideElement,
            plugIn: plugIn
        };
    }

    // Module
    if(typeof define === 'function' && define.amd) {
        define(['jquery'], xtsh);
    } else if(typeof module !== 'undefined' && module.exports) {
        var jQuery = require('jquery');
        module.exports = xtsh(jQuery);
    } else {
        // Normal script load, if jQuery is global (at window), its extended automatically        
        if (typeof window.jQuery !== 'undefined')
            xtsh(window.jQuery).plugIn(window.jQuery);
    }

})();
},{}],"7/CV3J":[function(require,module,exports){
/* Some utilities for use with jQuery or its expressions
    that are not plugins.
*/
function escapeJQuerySelectorValue(str) {
    return str.replace(/([ #;&,.+*~\':"!^$[\]()=>|\/])/g, '\\$1');
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        escapeJQuerySelectorValue: escapeJQuerySelectorValue
    };

},{}],"LC/jqueryUtils":[function(require,module,exports){
module.exports=require('7/CV3J');
},{}],72:[function(require,module,exports){
/* Assets loader with loading confirmation (mainly for scripts)
    based on Modernizr/yepnope loader.
*/
var Modernizr = require('modernizr');

exports.load = function (opts) {
    opts = $.extend(true, {
        scripts: [],
        complete: null,
        completeVerification: null,
        loadDelay: 0,
        trialsInterval: 500
    }, opts);
    if (!opts.scripts.length) return;
    function performComplete() {
        if (typeof (opts.completeVerification) !== 'function' || opts.completeVerification())
            opts.complete();
        else {
            setTimeout(performComplete, opts.trialsInterval);
            if (console && console.warn)
                console.warn('LC.load.completeVerification failed for ' + opts.scripts[0] + ' retrying it in ' + opts.trialsInterval + 'ms');
        }
    }
    function load() {
        Modernizr.load({
            load: opts.scripts,
            complete: opts.complete ? performComplete : null
        });
    }
    if (opts.loadDelay)
        setTimeout(load, opts.loadDelay);
    else
        load();
};
},{}],73:[function(require,module,exports){
/*------------
Utilities to manipulate numbers, additionally
to the ones at Math
------------*/

/** Enumeration to be uses by functions that implements 'rounding' operations on different
data types.
It holds the different ways a rounding operation can be apply.
**/
var roundingTypeEnum = {
    Down: -1,
    Nearest: 0,
    Up: 1
};

function roundTo(number, decimals, roundingType) {
    // case Nearest is the default:
    var f = nearestTo;
    switch (roundingType) {
        case roundingTypeEnum.Down:
            f = floorTo;
            break;
        case roundingTypeEnum.Up:
            f = ceilTo;
            break;
    }
    return f(number, decimals);
}

/** Round a number to the specified number of decimals.
It can substract integer decimals by providing a negative
number of decimals.
**/
function nearestTo(number, decimals) {
    var tens = Math.pow(10, decimals);
    return Math.round(number * tens) / tens;
}

/** Round Up a number to the specified number of decimals.
Its similar to roundTo, but the number is ever rounded up,
to the lower integer greater or equals to the number.
**/
function ceilTo(number, decimals) {
    var tens = Math.pow(10, decimals);
    return Math.ceil(number * tens) / tens;
}

/** Round Down a number to the specified number of decimals.
Its similar to roundTo, but the number is ever rounded down,
to the bigger integer lower or equals to the number.
**/
function floorTo(number, decimals) {
    var tens = Math.pow(10, decimals);
    return Math.floor(number * tens) / tens;
}

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        roundingTypeEnum: roundingTypeEnum,
        roundTo: roundTo,
        nearestTo: nearestTo,
        ceilTo: ceilTo,
        floorTo: floorTo
    };
},{}],"9RKOGW":[function(require,module,exports){
function moveFocusTo(el, options) {
    options = $.extend({
        marginTop: 30,
        duration: 500
    }, options);
    $('html,body').stop(true, true).animate({ scrollTop: $(el).offset().top - options.marginTop }, options.duration, null);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = moveFocusTo;
}
},{}],"LC/moveFocusTo":[function(require,module,exports){
module.exports=require('9RKOGW');
},{}],76:[function(require,module,exports){
/* Some utilities to format and extract numbers, from text or DOM.
 */
var jQuery = require('jquery'),
    i18n = require('./i18n'),
    mu = require('./mathUtils');

function getMoneyNumber(v, alt) {
    alt = alt || 0;
    if (v instanceof jQuery)
        v = v.val() || v.text();
    v = parseFloat(v
        .replace(/[$€]/g, '')
        .replace(new RegExp(LC.numericMilesSeparator[i18n.getCurrentCulture().culture], 'g'), '')
    );
    return isNaN(v) ? alt : v;
}
function numberToTwoDecimalsString(v) {
    var culture = i18n.getCurrentCulture().culture;
    // First, round to 2 decimals
    v = mu.roundTo(v, 2);
    // Get the decimal part (rest)
    var rest = Math.round(v * 100 % 100);
    return ('' +
    // Integer part (no decimals)
        Math.floor(v) +
    // Decimal separator depending on locale
        i18n.numericDecimalSeparator[culture] +
    // Decimals, ever two digits
        Math.floor(rest / 10) + rest % 10
    );
}
function numberToMoneyString(v) {
    var country = i18n.getCurrentCulture().country;
    // Two digits in decimals for rounded value with money symbol as for
    // current locale
    return (i18n.moneySymbolPrefix[country] + numberToTwoDecimalsString(v) + i18n.moneySymbolSufix[country]);
}
function setMoneyNumber(v, el) {
    // Get value in money format:
    v = numberToMoneyString(v);
    // Setting value:
    if (el instanceof jQuery)
        if (el.is(':input'))
            el.val(v);
        else
            el.text(v);
    return v;
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        getMoneyNumber: getMoneyNumber,
        numberToTwoDecimalsString: numberToTwoDecimalsString,
        numberToMoneyString: numberToMoneyString,
        setMoneyNumber: setMoneyNumber
    };
},{"./i18n":61,"./mathUtils":73}],77:[function(require,module,exports){
/**
* Placeholder polyfill.
* Adds a new jQuery placeHolder method to setup or reapply placeHolder
* on elements (recommented to be apply only to selector '[placeholder]');
* thats method is fake on browsers that has native support for placeholder
**/
var Modernizr = require('modernizr'),
    $ = require('jquery');

exports.init = function initPlaceHolders() {
    if (Modernizr.input.placeholder)
        $.fn.placeholder = function () { };
    else
        (function () {
            function doPlaceholder() {
                var $t = $(this);
                if (!$t.data('placeholder-supported')) {
                    $t.on('focusin', function () {
                        if (this.value == this.getAttribute('placeholder'))
                            this.value = '';
                    });
                    $t.on('focusout', function () {
                        if (!this.value.length)
                            this.value = this.getAttribute('placeholder');
                    });
                    $t.data('placeholder-supported', true);
                }
                if (!this.value.length)
                    this.value = this.getAttribute('placeholder');
            }
            $.fn.placeholder = function () {
                return this.each(doPlaceholder);
            };
            $('[placeholder]').placeholder();
            $(document).ajaxComplete(function () {
                $('[placeholder]').placeholder();
            });
        })();
};
},{}],78:[function(require,module,exports){
/* Popup functions
 */
var $ = require('jquery'),
    createIframe = require('./createIframe'),
    moveFocusTo = require('./moveFocusTo');
require('jquery.blockUI');
require('./smoothBoxBlock');

/*******************
* Popup related 
* functions
*/
function popupSize(size) {
    var s = (size == 'large' ? 0.8 : (size == 'medium' ? 0.5 : (size == 'small' ? 0.2 : size || 0.5)));
    return {
        width: Math.round($(window).width() * s),
        height: Math.round($(window).height() * s),
        sizeFactor: s
    };
}
function popupStyle(size) {
    return {
        cursor: 'default',
        width: size.width + 'px',
        left: Math.round(($(window).width() - size.width) / 2) - 25 + 'px',
        height: size.height + 'px',
        top: Math.round(($(window).height() - size.height) / 2) - 32 + 'px',
        padding: '34px 25px 30px',
        overflow: 'auto',
        border: 'none',
        '-moz-background-clip': 'padding',
        '-webkit-background-clip': 'padding-box',
        'background-clip': 'padding-box'
    };
}
function popup(url, size, complete, loadingText, options) {
    if (typeof (url) === 'object')
        options = url;

    // Load options overwriting defaults
    options = $.extend(true, {
        url: typeof (url) === 'string' ? url : '',
        size: size || { width: 0, height: 0 },
        complete: complete,
        loadingText: loadingText,
        closable: {
            onLoad: false,
            afterLoad: true,
            onError: true
        },
        autoSize: false,
        containerClass: '',
        autoFocus: true
    }, options);

    // Prepare size and loading
    options.loadingText = options.loadingText || '';
    if (typeof (options.size.width) === 'undefined')
        options.size = popupSize(options.size);

    $.blockUI({
        message: (options.closable.onLoad ? '<a class="close-popup" href="#close-popup">X</a>' : '') +
       '<img src="' + LcUrl.AppPath + 'img/theme/loading.gif"/>' + options.loadingText,
        centerY: false,
        css: popupStyle(options.size),
        overlayCSS: { cursor: 'default' },
        focusInput: true
    });

    // Loading Url with Ajax and place content inside the blocked-box
    $.ajax({
        url: options.url,
        context: {
            options: options,
            container: $('.blockMsg')
        },
        success: function (data) {
            var container = this.container.addClass(options.containerClass);
            // Add close button if requires it or empty message content to append then more
            container.html(options.closable.afterLoad ? '<a class="close-popup" href="#close-popup">X</a>' : '');
            var contentHolder = container.append('<div class="content"/>').children('.content');

            if (typeof (data) === 'object') {
                if (data.Code && data.Code == 2) {
                    $.unblockUI();
                    popup(data.Result, { width: 410, height: 320 });
                } else {
                    // Unexpected code, show result
                    contentHolder.append(data.Result);
                }
            } else {
                // Page content got, paste into the popup if is partial html (url starts with $)
                if (/((^\$)|(\/\$))/.test(options.url)) {
                    contentHolder.append(data);
                    if (options.autoFocus)
                        moveFocusTo(contentHolder);
                    if (options.autoSize) {
                        // Avoid miscalculations
                        var prevWidth = contentHolder[0].style.width;
                        contentHolder.css('width', 'auto');
                        var prevHeight = contentHolder[0].style.height;
                        contentHolder.css('height', 'auto');
                        // Get data
                        var actualWidth = contentHolder[0].scrollWidth,
                            actualHeight = contentHolder[0].scrollHeight,
                            contWidth = container.width(),
                            contHeight = container.height(),
                            extraWidth = container.outerWidth(true) - contWidth,
                            extraHeight = container.outerHeight(true) - contHeight,
                            maxWidth = $(window).width() - extraWidth,
                            maxHeight = $(window).height() - extraHeight;
                        // Calculate and apply
                        var size = {
                            width: actualWidth > maxWidth ? maxWidth : actualWidth,
                            height: actualHeight > maxHeight ? maxHeight : actualHeight
                        };
                        container.animate(size, 300);
                        // Reset miscalculations corrections
                        contentHolder.css('width', prevWidth);
                        contentHolder.css('height', prevHeight);
                    }
                } else {
                    // Else, if url is a full html page (normal page), put content into an iframe
                    var iframe = createIframe(data, this.options.size);
                    iframe.attr('id', 'blockUIIframe');
                    // replace blocking element content (the loading) with the iframe:
                    contentHolder.remove();
                    $('.blockMsg').append(iframe);
                    if (options.autoFocus)
                        moveFocusTo(iframe);
                }
            }
        }, error: function (j, t, ex) {
            $('div.blockMsg').html((options.closable.onError ? '<a class="close-popup" href="#close-popup">X</a>' : '') + '<div class="content">Page not found</div>');
            if (console && console.info) console.info("Popup-ajax error: " + ex);
        }, complete: options.complete
    });

    var returnedBlock = $('.blockUI');

    returnedBlock.on('click', '.close-popup', function () {
      $.unblockUI();
      returnedBlock.trigger('popup-closed');
      return false;
    });
    
    returnedBlock.closePopup = function () {
      $.unblockUI();
    };
    returnedBlock.getBlockElement = function getBlockElement() { return returnedBlock.filter('.blockMsg'); };
    returnedBlock.getContentElement = function getContentElement() { return returnedBlock.find('.content'); };
    returnedBlock.getOverlayElement = function getOverlayElement() { return returnedBlock.filter('.blockOverlay'); };
    return returnedBlock;
}

/* Some popup utilitites/shorthands */
function messagePopup(message, container) {
    container = $(container || 'body');
    var content = $('<div/>').text(message);
    smoothBoxBlock.open(content, container, 'message-popup full-block', { closable: true, center: true, autofocus: false });
}

function connectPopupAction(applyToSelector) {
    applyToSelector = applyToSelector || '.popup-action';
    $(document).on('click', applyToSelector, function () {
        var c = $($(this).attr('href')).clone();
        if (c.length == 1)
            smoothBoxBlock.open(c, document, null, { closable: true, center: true });
        return false;
    });
}

// The popup function contains all the others as methods
popup.size = popupSize;
popup.style = popupStyle;
popup.connectAction = connectPopupAction;
popup.message = messagePopup;

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = popup;
},{"./createIframe":48,"./moveFocusTo":"9RKOGW","./smoothBoxBlock":"KQGzNM"}],79:[function(require,module,exports){
/**** Postal Code: on fly, server-side validation *****/
var $ = require('jquery');

exports.init = function (options) {
    options = $.extend({
        baseUrl: '/',
        selector: '[data-val-postalcode]',
        url: 'JSON/ValidatePostalCode/'
    }, options);

    $(document).on('change', options.selector, function () {
        var $t = $(this);
        // If contains a value (this not validate if is required) and 
        // has the error descriptive message, validate through ajax
        var pc = $t.val();
        var msg = $t.data('val-postalcode');
        if (pc && msg) {
            $.ajax({
                url: options.baseUrl + options.url,
                data: { PostalCode: pc },
                cache: true,
                dataType: 'JSON',
                success: function (data) {
                    if (data && data.Code === 0)
                        if (data.Result.IsValid) {
                            $t.removeClass('input-validation-error').addClass('valid');
                            $t.siblings('.field-validation-error')
                                .removeClass('field-validation-error')
                                .addClass('field-validation-valid')
                                .text('').children().remove();
                            // Clean summary errors
                            $t.closest('form').find('.validation-summary-errors')
                                .removeClass('validation-summary-errors')
                                .addClass('validation-summary-valid')
                                .find('> ul > li').each(function () {
                                    if ($(this).text() == msg)
                                        $(this).remove();
                                });
                        } else {
                            $t.addClass('input-validation-error').removeClass('valid');
                            $t.siblings('.field-validation-valid')
                                .addClass('field-validation-error')
                                .removeClass('field-validation-valid')
                                .append('<span for="' + $t.attr('name') + '" generated="true">' + msg + '</span>');
                            // Add summary error (if there is not)
                            $t.closest('form').find('.validation-summary-valid')
                                .addClass('validation-summary-errors')
                                .removeClass('validation-summary-valid')
                                .children('ul')
                                .append('<li>' + msg + '</li>');
                        }
                }
            });
        }
    });
};
},{}],80:[function(require,module,exports){
/** Apply ever a redirect to the given URL, if this is an internal URL or same
page, it forces a page reload for the given URL.
**/
var $ = require('jquery');
require('jquery.blockUI');

module.exports = function redirectTo(url) {
    // Block to avoid more user interactions:
    $.blockUI({ message: '' }); //loadingBlock);
    // Checking if is being redirecting or not
    var redirected = false;
    $(window).on('beforeunload', function checkRedirect() {
        redirected = true;
    });
    // Navigate to new location:
    window.location = url;
    setTimeout(function () {
        // If page not changed (same url or internal link), page continue executing then refresh:
        if (!redirected)
            window.location.reload();
    }, 50);
};

},{}],81:[function(require,module,exports){
/** Sanitize the whitespaces in a text by:
- replacing contiguous whitespaces characteres (any number of repetition 
and any kind of white character) by a normal white-space
- replace encoded non-breaking-spaces by a normal white-space
- remove starting and ending white-spaces
- ever return a string, empty when null
**/
function sanitizeWhitespaces(text) {
    // Ever return a string, empty when null
    text = (text || '')
    // Replace any kind of contiguous whitespaces characters by a single normal white-space
    // (thats include replace enconded non-breaking-spaces,
    // and duplicated-repeated appearances)
    .replace(/\s+/g, ' ');
    // Remove starting and ending whitespaces
    return $.trim(text);
}

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = sanitizeWhitespaces;
},{}],"LC/smoothBoxBlock":[function(require,module,exports){
module.exports=require('KQGzNM');
},{}],"KQGzNM":[function(require,module,exports){
/** Custom Loconomics 'like blockUI' popups
**/
var $ = require('jquery'),
    escapeJQuerySelectorValue = require('./jqueryUtils').escapeJQuerySelectorValue,
    autoFocus = require('./autoFocus'),
    moveFocusTo = require('./moveFocusTo');
require('./jquery.xtsh').plugIn($);

function smoothBoxBlock(contentBox, blocked, addclass, options) {
    // Load options overwriting defaults
    options = $.extend(true, {
        closable: false,
        center: false,
        /* as a valid options parameter for LC.hideElement function */
        closeOptions: {
            duration: 600,
            effect: 'fade'
        },
        autofocus: true,
        autofocusOptions: { marginTop: 60 },
        width: 'auto'
    }, options);

    contentBox = $(contentBox);
    var full = false;
    if (blocked == document || blocked == window) {
        blocked = $('body');
        full = true;
    } else
        blocked = $(blocked);

    var boxInsideBlocked = !blocked.is('body,tr,thead,tbody,tfoot,table,ul,ol,dl');

    // Getting box element if exists and referencing
    var bID = blocked.data('smooth-box-block-id');
    if (!bID)
        bID = (contentBox.attr('id') || '') + (blocked.attr('id') || '') + '-smoothBoxBlock';
    if (bID == '-smoothBoxBlock') {
        bID = 'id-' + guidGenerator() + '-smoothBoxBlock';
    }
    blocked.data('smooth-box-block-id', bID);
    var box = $('#' + escapeJQuerySelectorValue(bID));
    // Hiding box:
    if (contentBox.length === 0) {
        box.xhide(options.closeOptions);
        return;
    }
    var boxc;
    if (box.length === 0) {
        boxc = $('<div class="smooth-box-block-element"/>');
        box = $('<div class="smooth-box-block-overlay"></div>');
        box.addClass(addclass);
        if (full) box.addClass('full-block');
        box.append(boxc);
        box.attr('id', bID);
        if (boxInsideBlocked)
            blocked.append(box);
        else
            $('body').append(box);
    } else {
        boxc = box.children('.smooth-box-block-element');
    }
    // Hidden for user, but available to compute:
    contentBox.show();
    box.show().css('opacity', 0);
    // Setting up the box and styles.
    boxc.children().remove();
    if (options.closable)
        boxc.append($('<a class="close-popup close-action" href="#close-popup">X</a>'));
    box.data('modal-box-options', options);
    if (!boxc.data('_close-action-added'))
      boxc
        .on('click', '.close-action', function (e) { e.preventDefault(); smoothBoxBlock(null, blocked, null, box.data('modal-box-options')); })
        .data('_close-action-added', true);
    boxc.append(contentBox);
    boxc.width(options.width);
    box.css('position', 'absolute');
    if (boxInsideBlocked) {
        // Box positioning setup when inside the blocked element:
        box.css('z-index', blocked.css('z-index') + 10);
        if (!blocked.css('position') || blocked.css('position') == 'static')
            blocked.css('position', 'relative');
        //offs = blocked.position();
        box.css('top', 0);
        box.css('left', 0);
    } else {
        // Box positioning setup when outside the blocked element, as a direct child of Body:
        box.css('z-index', Math.floor(Number.MAX_VALUE));
        box.css(blocked.offset());
    }
    // Dimensions must be calculated after being appended and position type being set:
    box.width(blocked.outerWidth());
    box.height(blocked.outerHeight());

    if (options.center) {
        boxc.css('position', 'absolute');
        var cl, ct;
        if (full) {
            ct = screen.height / 2;
            cl = screen.width / 2;
        } else {
            ct = box.outerHeight(true) / 2;
            cl = box.outerWidth(true) / 2;
        }
        boxc.css('top', ct - boxc.outerHeight(true) / 2);
        boxc.css('left', cl - boxc.outerWidth(true) / 2);
    }
    // Last setup
    autoFocus(box);
    // Show block
    box.animate({ opacity: 1 }, 300);
    if (options.autofocus)
        moveFocusTo(contentBox, options.autofocusOptions);
    return box;
}
function smoothBoxBlockCloseAll(container) {
    $(container || document).find('.smooth-box-block-overlay').hide();
}

// Module
if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        open: smoothBoxBlock,
        close: function(blocked, addclass, options) { smoothBoxBlock(null, blocked, addclass, options); },
        closeAll: smoothBoxBlockCloseAll
    };
},{"./autoFocus":31,"./jquery.xtsh":69,"./jqueryUtils":"7/CV3J","./moveFocusTo":"9RKOGW"}],"LC/tooltips":[function(require,module,exports){
module.exports=require('UTsC2v');
},{}],"UTsC2v":[function(require,module,exports){
/**
** Module:: tooltips
** Creates smart tooltips with possibilities for on hover and on click,
** additional description or external tooltip content.
**/
var $ = require('jquery'),
    sanitizeWhitespaces = require('./sanitizeWhitespaces');
require('./jquery.outerHtml');
require('./jquery.isChildOf');

// Main internal properties
var posoffset = { x: 16, y: 8 };
var selector = '[title][data-description], [title].has-tooltip, [title].secure-data, [data-tooltip-url], [title].has-popup-tooltip';

/** Positionate the tooltip depending on the
event or the target element position and an offset
**/
function pos(t, e, l) {
    var x, y;
    if (e.pageX && e.pageY) {
        x = e.pageX;
        y = e.pageY;
    } else if (e.target) {
        var $et = $(e.target);
        x = $et.outerWidth() + $et.offset().left;
        y = $et.outerHeight() + $et.offset().top;
    }
    t.css('left', x + posoffset.x);
    t.css('top', y + posoffset.y);
    // Adjust width to visible viewport
    var tdif = t.outerWidth() - t.width();
    t.css('max-width', $(window).width() - x - posoffset.x - tdif);
    //t.height($(document).height() - y - posoffset.y);
}
/** Get or create, and returns, the tooltip content for the element
**/
function con(l) {
    if (l.length === 0) return null;
    var c = l.data('tooltip-content'),
        persistent = l.data('persistent-tooltip');
    if (!c) {
        var h = sanitizeWhitespaces(l.attr('title'));
        var d = sanitizeWhitespaces(l.data('description'));
        if (d)
            c = '<h4>' + h + '</h4><p>' + d + '</p>';
        else
            c = h;
        // Append data-tooltip-url content if exists
        var urlcontent = $(l.data('tooltip-url'));
        c = (c || '') + urlcontent.outerHtml();
        // Remove original, is no more need and avoid id-conflicts
        urlcontent.remove();
        // Save tooltip content
        l.data('tooltip-content', c);
        // Remove browser tooltip (both when we are using our own tooltip and when no tooltip
        // is need)
        l.attr('title', '');
    }
    // Remove tooltip content (but preserve its cache in the element data)
    // if is the same text as the element content and the element content
    // is fully visible. Thats, for cases with different content, will be showed,
    // and for cases with same content but is not visible because the element
    // or container width, then will be showed.
    // Except if is persistent
    if (persistent !== true &&
        sanitizeWhitespaces(l.text()) == c &&
        l.outerWidth() >= l[0].scrollWidth) {
        c = null;
    }
    // If there is no content:
    if (!c) {
        // Update target removing the class to avoid css marking tooltip when there is not
        l.removeClass('has-tooltip').removeClass('has-popup-tooltip');
    }
    // Return the content as string:
    return c;
}
/** Get or creates the singleton instance for a tooltip of the given type
**/
function getTooltip(type) {
    type = type || 'tooltip';
    var id = 'singleton-' + type;
    var t = document.getElementById(id);
    if (!t) {
        t = $('<div style="position:absolute" class="tooltip"></div>');
        t.attr('id', id);
        t.hide();
        $('body').append(t);
    }
    return $(t);
}
/** Show the tooltip on an event triggered by the element containing
information for a tooltip
**/
function showTooltip(e) {
    var $t = $(this);
    var isPopup = $t.hasClass('has-popup-tooltip');
    // Get or create tooltip layer
    var t = getTooltip(isPopup ? 'popup-tooltip' : 'tooltip');
    // If this is not popup and the event is click, discard without cancel event
    if (!isPopup && e.type == 'click')
        return true;

    // Create content: if there is content, continue
    var content = con($t);
    if (content) {
        // If is a has-popup-tooltip and this is not a click, don't show
        if (isPopup && e.type != 'click')
            return true;
        // The tooltip setup must be queued to avoid content to be showed and placed
        // when still hidden the previous
        t.queue(function () {
            // Set tooltip content
            t.html(content);
            // For popups, setup class and close button
            if (isPopup) {
                t.addClass('popup-tooltip');
                var closeButton = $('<a href="#close-popup" class="close-action">X</a>');
                t.append(closeButton);
            }
            // Positionate
            pos(t, e, $t);
            t.dequeue();
            // Show (animations are stopped only on hide to avoid conflicts)
            t.fadeIn();
        });
    }

    // Stop bubbling and default
    return false;
}
/** Hide all opened tooltips, for any type.
It has some special considerations for popup-tooltips depending
on the event being triggered.
**/
function hideTooltip(e) {
    $('.tooltip:visible').each(function () {
        var t = $(this);
        // If is a popup-tooltip and this is not a click, or the inverse,
        // this is not a popup-tooltip and this is a click, do nothing
        if (t.hasClass('popup-tooltip') && e.type != 'click' ||
            !t.hasClass('popup-tooltip') && e.type == 'click')
            return;
        // Stop animations and hide
        t.stop(true, true).fadeOut();
    });

    return false;
}
/** Initialize tooltips
**/
function init() {
    // Listen for events to show/hide tooltips
    $('body').on('mousemove focusin', selector, showTooltip)
    .on('mouseleave focusout', selector, hideTooltip)
    // Listen event for clickable popup-tooltips
    .on('click', '[title].has-popup-tooltip', showTooltip)
    // Allowing buttons inside the tooltip
    .on('click', '.tooltip-button', function () { return false; })
    // Adding close-tooltip handler for popup-tooltips (click on any element except the tooltip itself)
    .on('click', function (e) {
        var t = $('.popup-tooltip:visible').get(0);
        // If the click is Not on the tooltip or any element contained
        // hide tooltip
        if (e.target != t && !$(e.target).isChildOf(t))
            hideTooltip(e);
    })
    // Avoid close-action click from redirect page, and hide tooltip
    .on('click', '.popup-tooltip .close-action', function (e) {
        e.preventDefault();
        hideTooltip(e);
    });
    update();
}
/** Update elements on the page to reflect changes or need for tooltips
**/
function update(element_selector) {
    // Review every popup tooltip to prepare content and mark/unmark the link or text:
    $(element_selector || selector).each(function () {
        con($(this));
    });
}
/** Create tooltip on element by demand
**/
function create_tooltip(element, options) {
    var settings = $.extend({}, {
      title: ''
      , description: null
      , url: null
      , is_popup: false
      , persistent: false
    }, options);

    $(element)
    .attr('title', settings.title)
    .data('description', settings.description)
    .data('persistent-tooltip', settings.persistent)
    .addClass(settings.is_popup ? 'has-popup-tooltip' : 'has-tooltip');
    update(element);
}

if (typeof module !== 'undefined' && module.exports)
    module.exports = {
        initTooltips: init,
        updateTooltips: update,
        createTooltip: create_tooltip
    };

},{"./jquery.isChildOf":66,"./jquery.outerHtml":67,"./sanitizeWhitespaces":81}],86:[function(require,module,exports){
/* Some tools form URL management
*/
exports.getURLParameter = function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)', 'i').exec(location.search) || [, null])[1]);
};
exports.getHashBangParameters = function getHashBangParameters(hashbangvalue) {
    // Hashbangvalue is something like: Thread-1_Message-2
    // Where '1' is the ThreadID and '2' the optional MessageID, or other parameters
    var pars = hashbangvalue.split('_');
    var urlParameters = {};
    for (var i = 0; i < pars.length; i++) {
        var parsvalues = pars[i].split('-');
        if (parsvalues.length == 2)
            urlParameters[parsvalues[0]] = parsvalues[1];
        else
            urlParameters[parsvalues[0]] = true;
    }
    return urlParameters;
};

},{}],"LC/validationHelper":[function(require,module,exports){
module.exports=require('kqf9lt');
},{}],"kqf9lt":[function(require,module,exports){
/** Validation logic with load and setup of validators and 
    validation related utilities
**/
var $ = require('jquery');
var Modernizr = require('modernizr');

// Using on setup asyncronous load instead of this static-linked load
// require('jquery/jquery.validate.min.js');
// require('jquery/jquery.validate.unobtrusive.min.js');

function setupValidation(reapplyOnlyTo) {
    reapplyOnlyTo = reapplyOnlyTo || document;
    if (!window.jqueryValidateUnobtrusiveLoaded) window.jqueryValidateUnobtrusiveLoaded = false;
    if (!jqueryValidateUnobtrusiveLoaded) {
        jqueryValidateUnobtrusiveLoaded = true;
        
        Modernizr.load([
                { load: LcUrl.AppPath + "Scripts/jquery/jquery.validate.min.js" },
                { load: LcUrl.AppPath + "Scripts/jquery/jquery.validate.unobtrusive.min.js" }
            ]);
    } else {
        // Check first if validation is enabled (can happen that twice includes of
        // this code happen at same page, being executed this code after first appearance
        // with the switch jqueryValidateUnobtrusiveLoaded changed
        // but without validation being already loaded and enabled)
        if ($ && $.validator && $.validator.unobtrusive) {
            // Apply the validation rules to the new elements
            $(reapplyOnlyTo).removeData('validator');
            $(reapplyOnlyTo).removeData('unobtrusiveValidation');
            $.validator.unobtrusive.parse(reapplyOnlyTo);
        }
    }
}

/* Utilities */

/* Clean previous validation errors of the validation summary
included in 'container' and set as valid the summary
*/
function setValidationSummaryAsValid(container) {
    container = container || document;
    $('.validation-summary-errors', container)
    .removeClass('validation-summary-errors')
    .addClass('validation-summary-valid')
    .find('>ul>li').remove();

    // Set all fields validation inside this form (affected by the summary too)
    // as valid too
    $('.field-validation-error', container)
    .removeClass('field-validation-error')
    .addClass('field-validation-valid')
    .text('');

    // Re-apply setup validation to ensure is working, because just after a successful
    // validation, asp.net unobtrusive validation stops working on client-side.
    LC.setupValidation();
}

function setValidationSummaryAsError(container, errors) {
  var v = findValidationSummary(container);
  v.addClass('validation-summary-errors').removeClass('validation-summary-valid');
}

function setErrors(container, errors) {
    //var validator = $(container).validate();
    //validator.showErrors(errors);
    var $s = findValidationSummary(container).find('ul');
    var withErrors = false;
    for(var field in errors) {
        if (errors.hasOwnProperty && !errors.hasOwnProperty(field))
            continue;
        $('<li/>').text(errors[field]).appendTo($s);
        //$(container).find('[name="' + field + '"]')
        //.addClass('field-validation-error')
        //.removeClass('field-validation-valid valid');
        withErrors = true;
    }
    if (withErrors)
        setValidationSummaryAsError(container);
}

function goToSummaryErrors(form) {
    var off = form.find('.validation-summary-errors').offset();
    if (off)
        $('html,body').stop(true, true).animate({ scrollTop: off.top }, 500);
    else
        if (console && console.error) console.error('goToSummaryErrors: no summary to focus');
}

function findValidationSummary(container) {
  container = container || document;
  return $('[data-valmsg-summary=true]', container);
}

module.exports = {
    setup: setupValidation,
    setValidationSummaryAsValid: setValidationSummaryAsValid,
    setValidationSummaryAsError: setValidationSummaryAsError,
    goToSummaryErrors: goToSummaryErrors,
    findValidationSummary: findValidationSummary,
    setErrors: setErrors
};
},{}],89:[function(require,module,exports){
/**
    Enable the use of popups to show links to some Account pages (default links behavior is to open in a new tab)
**/
var $ = require('jquery');
require('jquery.blockUI');

exports.enable = function (baseUrl) {
    $(document)
    .on('click', 'a.login', function () {
        var url = baseUrl + 'Account/$Login/?ReturnUrl=' + encodeURIComponent(window.location);
        popup(url, { width: 410, height: 320 });
        return false;
    })
    .on('click', 'a.forgot-password', function () {
        var url = this.getAttribute('href').replace('/Account/ForgotPassword', '/Account/$ForgotPassword');
        popup(url, { width: 400, height: 240 });
        return false;
    })
    .on('click', 'a.change-password', function () {
        var url = this.getAttribute('href').replace('/Account/ChangePassword', '/Account/$ChangePassword');
        popup(url, { width: 450, height: 340 });
        return false;
    });
};
},{}],90:[function(require,module,exports){
// OUR namespace (abbreviated Loconomics)
window.LC = window.LC || {};

// TODO Review LcUrl use around all the modules, use DI whenever possible (init/setup method or in use cases)
// but only for the wanted baseUrl on each case and not pass all the LcUrl object.
// LcUrl is server-side generated and wrote in a Layout script-tag.

// Global settings
window.gLoadingRetard = 300;

/***
 ** Loading modules
***/
//TODO: Clean dependencies, remove all that not used directly in this file, any other file
// or page must require its dependencies.

window.LcUrl = require('../LC/LcUrl');

/* jQuery, some vendor plugins (from bundle) and our additions (small plugins), they are automatically plug-ed on require */
var $ = window.$ = window.jQuery = require('jquery');
require('../LC/jquery.hasScrollBar');
require('jquery.ba-hashchange');
require('jquery.blockUI');
require('../LC/jquery.are');
// Masked input, for dates -at my-account-.
require('jquery.formatter');

// General callbacks for AJAX events with common logic
var ajaxCallbacks = require('../LC/ajaxCallbacks');
// Form.ajax logic and more specific callbacks based on ajaxCallbacks
var ajaxForms = require('../LC/ajaxForms');
//{TEMP  old alias
window.ajaxFormsSuccessHandler = ajaxForms.onSuccess;
window.ajaxErrorPopupHandler = ajaxForms.onError;
window.ajaxFormsCompleteHandler = ajaxForms.onComplete;
//}

/* Reload */
require('../LC/jquery.reload');
// Wrapper function around onSuccess to mark operation as part of a 
// reload avoiding some bugs (as replace-content on ajax-box, not wanted for
// reload operations)
function reloadSuccessWrapper() {
  var context = $.isPlainObject(this) ? this : { element: this };
  context.isReload = true;
  ajaxForms.onSuccess.apply(context, Array.prototype.slice.call(arguments));
}
$.fn.reload.defaults = {
  success: [reloadSuccessWrapper],
  error: [ajaxForms.onError],
  delay: gLoadingRetard
};

LC.moveFocusTo = require('../LC/moveFocusTo');
/* Disabled because conflicts with the moveFocusTo of 
  ajaxForm.onsuccess, it happens a block.loading just after
  the success happens.
$.blockUI.defaults.onBlock = function () {
    // Scroll to block-message to don't lost in large pages:
    LC.moveFocusTo(this);
};*/

var loader = require('../LC/loader');
LC.load = loader.load;

var blocks = LC.blockPresets = require('../LC/blockPresets');
//{TEMP
window.loadingBlock = blocks.loading;
window.infoBlock = blocks.info;
window.errorBlock = blocks.error;
//}

Array.remove = require('../LC/Array.remove');
require('../LC/String.prototype.contains');

LC.getText = require('../LC/getText');

var TimeSpan = LC.timeSpan = require('../LC/TimeSpan');
var timeSpanExtra = require('../LC/TimeSpanExtra');
timeSpanExtra.plugIn(TimeSpan);
//{TEMP  old aliases
LC.smartTime = timeSpanExtra.smartTime;
LC.roundTimeToQuarterHour = timeSpanExtra.roundToQuarterHour;
//}

LC.ChangesNotification = require('../LC/changesNotification');
window.TabbedUX = require('../LC/TabbedUX');
var sliderTabs = require('../LC/TabbedUX.sliderTabs');

// Popup APIs
window.smoothBoxBlock = require('../LC/smoothBoxBlock');

var popup = require('../LC/popup');
//{TEMP
var popupStyle = popup.style,
    popupSize = popup.size;
LC.messagePopup = popup.message;
LC.connectPopupAction = popup.connectAction;
window.popup = popup;
//}

LC.sanitizeWhitespaces = require('../LC/sanitizeWhitespaces');
//{TEMP   alias because misspelling
LC.sanitizeWhitepaces = LC.sanitizeWhitespaces;
//}

LC.getXPath = require('../LC/getXPath');

var stringFormat = require('../LC/StringFormat');

// Expanding exported utilites from modules directly as LC members:
$.extend(LC, require('../LC/Price'));
$.extend(LC, require('../LC/mathUtils'));
$.extend(LC, require('../LC/numberUtils'));
$.extend(LC, require('../LC/tooltips'));
var i18n = LC.i18n = require('../LC/i18n');
//{TEMP old alises on LC and global
$.extend(LC, i18n);
$.extend(window, i18n);
//}

// xtsh: pluged into jquery and part of LC
var xtsh = require('../LC/jquery.xtsh');
xtsh.plugIn($);
//{TEMP   remove old LC.* alias
$.extend(LC, xtsh);
delete LC.plugIn;
//}

var autoCalculate = LC.autoCalculate = require('../LC/autoCalculate');
//{TEMP   remove old alias use
var lcSetupCalculateTableItemsTotals = autoCalculate.onTableItems;
LC.setupCalculateSummary = autoCalculate.onSummary;
LC.updateDetailedPricingSummary = autoCalculate.updateDetailedPricingSummary;
LC.setupUpdateDetailedPricingSummary = autoCalculate.onDetailedPricingSummary;
//}

var Cookie = LC.Cookie = require('../LC/Cookie');
//{TEMP    old alias
var getCookie = Cookie.get,
    setCookie = Cookie.set;
//}

LC.datePicker = require('../LC/datePicker');
//{TEMP   old alias
window.setupDatePicker = LC.setupDatePicker = LC.datePicker.init;
window.applyDatePicker = LC.applyDatePicker = LC.datePicker.apply;
//}

LC.autoFocus = require('../LC/autoFocus');

// CRUDL: loading module, setting up common default values and callbacks:
var crudlModule = require('../LC/crudl');
crudlModule.defaultSettings.data['focus-closest']['default'] = '.DashboardSection-page-section';
crudlModule.defaultSettings.data['focus-margin']['default'] = 10;
var crudl = crudlModule.setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
// Previous used alias (deprecated):
LC.initCrudl = crudl.on;

// UI Slider Labels
var sliderLabels = require('../LC/UISliderLabels');
//{TEMP  old alias
LC.createLabelsForUISlider = sliderLabels.create;
LC.updateLabelsForUISlider = sliderLabels.update;
LC.uiSliderLabelsLayouts = sliderLabels.layouts;
//}

var validationHelper = require('../LC/validationHelper');
//{TEMP  old alias
LC.setupValidation = validationHelper.setup;
LC.setValidationSummaryAsValid = validationHelper.setValidationSummaryAsValid;
LC.goToSummaryErrors = validationHelper.goToSummaryErrors;
//}

LC.placeHolder = require('../LC/placeholder-polyfill').init;

LC.mapReady = require('../LC/googleMapReady');

window.isEmptyString = require('../LC/isEmptyString');

window.guidGenerator = require('../LC/guidGenerator');

var urlUtils = require('../LC/urlUtils');
window.getURLParameter = urlUtils.getURLParameter;
window.getHashBangParameters = urlUtils.getHashBangParameters;

var dateToInterchangeableString = require('../LC/dateToInterchangeableString');
//{TEMP
LC.dateToInterchangleString = dateToInterchangeableString;
//}

// Pages in popup
var welcomePopup = require('./welcomePopup');
var faqsPopups = require('./faqsPopups');
var accountPopups = require('./accountPopups');
var legalPopups = require('./legalPopups');

// Old availablity calendar
var availabilityCalendarWidget = require('./availabilityCalendarWidget');
// New availability calendar
var availabilityCalendar = require('../LC/availabilityCalendar');

var autofillSubmenu = require('../LC/autofillSubmenu');

var tabbedWizard = require('../LC/TabbedUX.wizard');

var hasConfirmSupport = require('../LC/hasConfirmSupport');

var postalCodeValidation = require('../LC/postalCodeServerValidation');

var tabbedNotifications = require('../LC/TabbedUX.changesNotification');

var tabsAutoload = require('../LC/TabbedUX.autoload');

var homePage = require('./home');

//{TEMP remove global dependency for this
window.escapeJQuerySelectorValue = require('../LC/jqueryUtils').escapeJQuerySelectorValue;
//}

var providerWelcome = require('./providerWelcome');

/**
 ** Init code
***/
$(window).load(function () {
  // Disable browser behavior to auto-scroll to url fragment/hash element position:
  // EXCEPT in Dashboard:
  // TODO: Review if this is required only for HowItWorks or something more (tabs, profile)
  // and remove if possible or only on the concrete cases.
  if (!/\/dashboard\//i.test(location))
    setTimeout(function () { $('html,body').scrollTop(0); }, 1);
});
$(function () {

  providerWelcome.show();

  // Placeholder polyfill
  LC.placeHolder();

  // Autofocus polyfill
  LC.autoFocus();

  // Generic script for enhanced tooltips and element descriptions
  LC.initTooltips();

  ajaxForms.init();

  welcomePopup.init();

  // Enable the use of popups for some links that by default open a new tab:
  faqsPopups.enable(LcUrl.LangPath);
  accountPopups.enable(LcUrl.LangPath);
  legalPopups.enable(LcUrl.LangPath);

  // Old availability calendar
  availabilityCalendarWidget.init(LcUrl.LangPath);
  // New availability calendar
  availabilityCalendar.Weekly.enableAll();

  popup.connectAction();

  // Date Picker
  LC.datePicker.init();

  /* Auto calculate table items total (quantity*unitprice=item-total) script */
  autoCalculate.onTableItems();
  autoCalculate.onSummary();

  hasConfirmSupport.on();

  postalCodeValidation.init({ baseUrl: LcUrl.LangPath });

  // Tabbed interface
  tabsAutoload.init(TabbedUX);
  TabbedUX.init();
  TabbedUX.focusCurrentLocation();
  TabbedUX.checkVolatileTabs();
  sliderTabs.init(TabbedUX);

  tabbedWizard.init(TabbedUX, {
    loadingDelay: gLoadingRetard
  });

  tabbedNotifications.init(TabbedUX);

  autofillSubmenu();

  // TODO: 'loadHashBang' custom event in use?
  // If the hash value follow the 'hash bang' convention, let other
  // scripts do their work throught a 'loadHashBang' event handler
  if (/^#!/.test(window.location.hash))
    $(document).trigger('loadHashBang', window.location.hash.substring(1));

  // Reload buttons
  $(document).on('click', '.reload-action', function () {
    // Generic action to call lc.jquery 'reload' function from an element inside itself.
    var $t = $(this);
    $t.closest($t.data('reload-target')).reload();
  });

  /* Enable focus tab on every hash change, now there are two scripts more specific for this:
  * one when page load (where?),
  * and another only for links with 'target-tab' class.
  * Need be study if something of there must be removed or changed.
  * This is needed for other behaviors to work. */
  // On target-tab links
  $(document).on('click', 'a.target-tab', function () {
    var thereIsTab = TabbedUX.getTab($(this).attr('href'));
    if (thereIsTab) {
      TabbedUX.focusTab(thereIsTab);
      return false;
    }
  });
  // On hash change
  if ($.fn.hashchange)
    $(window).hashchange(function () {
      if (!/^#!/.test(location.hash)) {
        var thereIsTab = TabbedUX.getTab(location.hash);
        if (thereIsTab)
          TabbedUX.focusTab(thereIsTab);
      }
    });

  // HOME PAGE / SEARCH STUFF
  homePage.init();

  // Validation auto setup for page ready and after every ajax request
  // if there is almost one form in the page.
  // This avoid the need for every page with form to do the setup itself
  // almost for most of the case.
  function autoSetupValidation() {
    if ($(document).has('form').length)
      validationHelper.setup('form');
  }
  autoSetupValidation();
  $(document).ajaxComplete(autoSetupValidation);

  // TODO: used some time? still required using modules?
  /*
  * Communicate that script.js is ready to be used
  * and the common LC lib too.
  * Both are ensured to be raised ever after page is ready too.
  */
  $(document)
    .trigger('lcScriptReady')
    .trigger('lcLibReady');
});
},{"../LC/Array.remove":1,"../LC/Cookie":7,"../LC/LcUrl":10,"../LC/Price":11,"../LC/String.prototype.contains":15,"../LC/StringFormat":"KqXDvj","../LC/TabbedUX":20,"../LC/TabbedUX.autoload":18,"../LC/TabbedUX.changesNotification":19,"../LC/TabbedUX.sliderTabs":21,"../LC/TabbedUX.wizard":22,"../LC/TimeSpan":"rqZkA9","../LC/TimeSpanExtra":"5OLBBz","../LC/UISliderLabels":27,"../LC/ajaxCallbacks":28,"../LC/ajaxForms":29,"../LC/autoCalculate":30,"../LC/autoFocus":31,"../LC/autofillSubmenu":32,"../LC/availabilityCalendar":"xu1BAO","../LC/blockPresets":45,"../LC/changesNotification":"f5kckb","../LC/crudl":49,"../LC/datePicker":52,"../LC/dateToInterchangeableString":53,"../LC/getText":"qf5Iz3","../LC/getXPath":56,"../LC/googleMapReady":"ygr/Yz","../LC/guidGenerator":59,"../LC/hasConfirmSupport":60,"../LC/i18n":61,"../LC/isEmptyString":62,"../LC/jquery.are":63,"../LC/jquery.hasScrollBar":65,"../LC/jquery.reload":68,"../LC/jquery.xtsh":69,"../LC/jqueryUtils":"7/CV3J","../LC/loader":72,"../LC/mathUtils":73,"../LC/moveFocusTo":"9RKOGW","../LC/numberUtils":76,"../LC/placeholder-polyfill":77,"../LC/popup":78,"../LC/postalCodeServerValidation":79,"../LC/sanitizeWhitespaces":81,"../LC/smoothBoxBlock":"KQGzNM","../LC/tooltips":"UTsC2v","../LC/urlUtils":86,"../LC/validationHelper":"kqf9lt","./accountPopups":89,"./availabilityCalendarWidget":91,"./faqsPopups":92,"./home":93,"./legalPopups":94,"./providerWelcome":95,"./welcomePopup":96}],91:[function(require,module,exports){
/***** AVAILABILITY CALENDAR WIDGET *****/
var $ = require('jquery'),
    smoothBoxBlock = require('../LC/smoothBoxBlock'),
    dateToInterchangeableString = require('../LC/dateToInterchangeableString');
require('../LC/jquery.reload');

exports.init = function initAvailabilityCalendarWidget(baseUrl) {
    $(document).on('click', '.calendar-controls .action', function () {
        var $t = $(this);
        if ($t.hasClass('zoom-action')) {
            // Do zoom
            var c = $t.closest('.availability-calendar').find('.calendar').clone();
            c.css('font-size', '2px');
            var tab = $t.closest('.tab-body');
            c.data('popup-container', tab);
            smoothBoxBlock.open(c, tab, 'availability-calendar', { closable: true });
            // Nothing more
            return;
        }
        // Navigate calendar
        var next = $t.hasClass('next-week-action');
        var cont = $t.closest('.availability-calendar');
        var calcont = cont.children('.calendar-container');
        var cal = calcont.children('.calendar');
        var calinfo = cont.find('.calendar-info');
        var date = new Date(cal.data('showed-date'));
        var userId = cal.data('user-id');
        if (next)
            date.setDate(date.getDate() + 7);
        else
            date.setDate(date.getDate() - 7);
        var strdate = dateToInterchangeableString(date);
        var url = baseUrl + "Profile/$AvailabilityCalendarWidget/Week/" + encodeURIComponent(strdate) + "/?UserID=" + userId;
        calcont.reload(url, function () {
            // get the new object:
            var cal = $('.calendar', this.element);
            calinfo.find('.year-week').text(cal.data('showed-week'));
            calinfo.find('.first-week-day').text(cal.data('showed-first-day'));
            calinfo.find('.last-week-day').text(cal.data('showed-last-day'));
        });
        return false;
    });
};
},{"../LC/dateToInterchangeableString":53,"../LC/jquery.reload":68,"../LC/smoothBoxBlock":"KQGzNM"}],92:[function(require,module,exports){
/**
    Enable the use of popups to show links to FAQs (default links behavior is to open in a new tab)
**/
var $ = require('jquery');

var faqsBaseUrl = 'HelpCenter/$FAQs';

exports.enable = function (baseUrl) {
  faqsBaseUrl = (baseUrl || '/') + faqsBaseUrl;

  // Enable FAQs links in popup
  $(document).on('click', 'a[href|="#FAQs"]', popupFaqs);

  // Auto open current document location if hash is a FAQ link
  if (/^#FAQs/i.test(location.hash)) {
    popupFaqs(location.hash);
  }

  // return as utility
  return popupFaqs;
};

/* Pass a Faqs @url or use as a link handler to open the FAQ in a popup
 */
function popupFaqs(url) {
  url = typeof (url) === 'string' ? url : $(this).attr('href');

  var urlparts = url.split('-');

  if (urlparts[0] != '#FAQs') {
    if (console && console.error) console.error('The URL is not a FAQ url (doesn\'t starts with #FAQs-)', url);
    return true;
  }

  var urlsection = urlparts.length > 1 ? urlparts[1] : '';

  if (urlsection) {
    var pup = popup(faqsBaseUrl + urlsection, 'large', function () {
      var d = $(url),
        pel = pup.getContentElement();
      pel.scrollTop(pel.scrollTop() + d.position().top - 50);
      setTimeout(function () {
        d.effect("highlight", {}, 2000);
      }, 400);
    });
  }
  return false;
}
},{}],93:[function(require,module,exports){
/* INIT */
exports.init = function () {
    // Location js-dropdown
    var s = $('#search-location');
    s.prop('readonly', true);
    s.autocomplete({
        source: LC.searchLocations
                                , autoFocus: true
                                , minLength: 0
                                , select: function () {
                                    return false;
                                }
    });
    s.on('focus click', function () { s.autocomplete('search', ''); });

    /* Positions autocomplete */
    var positionsAutocomplete = $('#search-service').autocomplete({
        source: LcUrl.JsonPath + 'GetPositions/Autocomplete/',
        autoFocus: false,
        minLength: 0,
        select: function (event, ui) {
            // We want show the label (position name) in the textbox, not the id-value
            //$(this).val(ui.item.label);
            $(this).val(ui.item.positionSingular);
            return false;
        },
        focus: function (event, ui) {
            if (!ui || !ui.item || !ui.item.positionSingular);
            // We want the label in textbox, not the value
            //$(this).val(ui.item.label);
            $(this).val(ui.item.positionSingular);
            return false;
        }
    });
    // Load all positions in background to replace the autocomplete source (avoiding multiple, slow look-ups)
    /*$.getJSON(LcUrl.JsonPath + 'GetPositions/Autocomplete/',
    function (data) {
    positionsAutocomplete.autocomplete('option', 'source', data);
    }
    );*/
};
},{}],94:[function(require,module,exports){
/**
    Enable the use of popups to show links to some Legal pages (default links behavior is to open in a new tab)
**/
var $ = require('jquery');

exports.enable = function (baseUrl) {
    $(document)
    .on('click', '.view-privacy-policy', function () {
        popup(baseUrl + 'HelpCenter/$PrivacyPolicy/', 'large');
        return false;
    })
    .on('click', '.view-terms-of-use', function () {
        popup(baseUrl + 'HelpCenter/$TermsOfUse/', 'large');
        return false;
    });
};
},{}],95:[function(require,module,exports){
/**
* Provider Welcome page
*/
var $ = require('jquery');
var SimpleSlider = require('LC/SimpleSlider');

exports.show = function providerWelcome() {
  $('.ProviderWelcome .ProviderWelcome-presentation').each(function () {
    var t = $(this),
      slider = new SimpleSlider({
        element: t,
        selectors: {
          slides: '.ProviderWelcome-presentation-slides',
          slide: '.ProviderWelcome-presentation-slide'
        },
        currentSlideClass: 'js-isCurrent',
        hrefPrefix: 'goSlide_',
        // Duration of each slide in milliseconds
        duration: 1000
      });

    // Slide steps actions initially hidden, visible after 'start'
    var slidesActions = t.find('.ProviderWelcome-presentation-actions-slides').hide();
    t.find('.ProviderWelcome-presentation-actions-start .start-action').on('click', function () {
      $(this).hide();
      slidesActions.fadeIn(1000);
    });
  });
};

},{"LC/SimpleSlider":"aFoCK0"}],96:[function(require,module,exports){
/**
* Welcome popup
*/
var $ = require('jquery');
// bootstrap tooltips:
require('bootstrap');
//TODO more dependencies?

var initialized = false;

exports.init = function initWelcomePopup() {

  exports.autoShow();

  $(document).on('click', 'a.sign-up, a.register, a.need-login, button.need-login', function () {
    // Remove any opened popup (it overlays the welcomepopup)
    $.unblockUI();

    return !exports.show();
  });

};

exports.autoShow = function autoShowWelcomePopup() {
  var $wp = $('#welcomepopup');
  var $wo = $('#welcome-popup-overlay');

  // When the popup is integrated in the page instead of
  // the layout, exec show and close orphan overlay.
  if ($wp.length &&
    $wp.is(':visible') &&
    $wp.closest('#welcome-popup-overlay').length === 0) {
    $wo.hide();
    exports.show();
    return;
  } else if ($wo.hasClass('auto-show')) {
    exports.show();
  }
};

exports.show = function welcomePopup() {
    var c = $('#welcomepopup');
    if (c.length === 0) return false;

    var overlay = c.closest('#welcome-popup-overlay');
    overlay.fadeIn(300);

    if (initialized) {
        // Return popup to the first step (choose profile, #486) and exit -init is ready-
        // Show first step
        c.find('.profile-choice, header .presentation').show();
        // Hide second step
        c.find('.terms, .profile-data').hide();
        // Reset hidden fields per profile-type
        c.find('.profile-data li:not(.position-description)').show();
        // Reset choosen profile-type
        c.find('.profile-choice [name=profile-type]').prop('checked', false);
        // Reset URLs per profile-type
        c.find('a.terms-of-use').data('tooltip-url', function () { return $(this).attr('data-tooltip-url'); });
        // Reset validation rules
        c.find('.profile-data li input:not([type=hidden])')
        .attr('data-val', null)
        .removeClass('input-validation-error');

        return true;
    }
    initialized = true;

    // close button logic and only when as popup (it has overlay)
    var closeButton = c.find('.close-popup, [href="#close-popup"]');
    if (overlay.length === 0)
        closeButton.hide();
    else
        closeButton.show().on('click', function () {
            overlay.fadeOut('normal');
            return false;
        });

    var skipStep1 = c.hasClass('select-position');

    // Init
    if (!skipStep1) {
        c.find('.profile-data, .terms, .position-description').hide();
    }
    c.find('form').get(0).reset();

    // Description show-up on autocomplete variations
    var showPositionDescription = {
        /**
        Show description in a textarea under the position singular,
        its showed on demand.
        **/
        textarea: function (event, ui) {
            c.find('.position-description')
            .slideDown('fast')
            .find('textarea').val(ui.item.description);
        },
        /**
        Show description in a tooltip that comes from the position singular
        field
        **/
        tooltip: function (event, ui) {
            // It needs to be destroyed (no problem the first time)
            // to get it updated on succesive attempts
            var el = $(this);
            el
            .popover('destroy')
            .popover({
                title: 'Does this sound like you?',
                content: ui.item.description,
                trigger: 'focus',
                placement: 'left'
            })
            .popover('show')
            // Hide on possible position name change to avoid confusions
            // (we can't use on-change, need to be keypress; its namespaced
            // to let off and on every time to avoid multiple handler registrations)
            .off('keypress.description-tooltip')
            .on('keypress.description-tooltip', function () {
                el.popover('hide');
            });
        }
    };

    // Re-enable autocomplete:
    setTimeout(function () { c.find('[placeholder]').placeholder(); }, 500);
    function setupPositionAutocomplete(seletCallback) {
        c.find('[name=jobtitle]').autocomplete({
            source: LcUrl.JsonPath + 'GetPositions/Autocomplete/',
            autoFocus: false,
            minLength: 0,
            select: function (event, ui) {
                // No value, no action :(
                if (!ui || !ui.item || !ui.item.value) return;
                // Save the id (value) in the hidden element
                c.find('[name=positionid]').val(ui.item.value);

                seletCallback.call(this, event, ui);

                // We want to show the label (position name) in the textbox, not the id-value
                $(this).val(ui.item.positionSingular);

                return false;
            },
            focus: function (event, ui) {
                if (!ui || !ui.item || !ui.item.positionSingular) return false;
                // We want the label in textbox, not the value
                $(this).val(ui.item.positionSingular);
                return false;
            }
        });
    }
    setupPositionAutocomplete(showPositionDescription.tooltip);
    c.find('#welcomepopupLoading').remove();

    // Actions
    c.on('change', '.profile-choice [name=profile-type]', function () {
        c.find('.profile-data li:not(.' + this.value + ')').hide();
        c.find('.profile-choice, header .presentation').slideUp('fast');
        c.find('.terms, .profile-data').slideDown('fast');
        // Terms of use different for profile type
        if (this.value == 'customer')
            c.find('a.terms-of-use').data('tooltip-url', null);
        // Change facebook redirect link
        var fbc = c.find('.facebook-connect');
        var addRedirect = 'customers';
        if (this.value == 'provider')
            addRedirect = 'providers';
        fbc.data('redirect', fbc.data('redirect') + addRedirect);
        fbc.data('profile', this.value);

        // Set validation-required for depending of profile-type form elements:
        c.find('.profile-data li.' + this.value + ' input:not([data-val]):not([type=hidden])')
        .attr('data-val-required', '')
        .attr('data-val', true);
        LC.setupValidation();
    });
    c.on('ajaxFormReturnedHtml', 'form.ajax', function () {
        setupPositionAutocomplete(showPositionDescription.tooltip);
        c.find('.profile-choice [name=profile-type]:checked').change();
    });

    // If profile type is prefilled by request:
    c.find('.profile-choice [name=profile-type]:checked').change();

    // All fine
    return true;
};

},{}],97:[function(require,module,exports){



/*
* @version  0.5.0
* @author   Lauri Rooden - https://github.com/litejs/date-format-lite
* @license  MIT License  - http://lauri.rooden.ee/mit-license.txt
*/



!function(Date, proto) {
	var maskRe = /(["'])((?:[^\\]|\\.)*?)\1|YYYY|([MD])\3\3(\3?)|SS|([YMDHhmsW])(\5?)|[uUAZSwo]/g
	, yearFirstRe = /(\d{4})[-.\/](\d\d?)[-.\/](\d\d?)/
	, dateFirstRe = /(\d\d?)[-.\/](\d\d?)[-.\/](\d{4})/
	, timeRe = /(\d\d?):(\d\d):?(\d\d)?\.?(\d{3})?(?:\s*(?:(a)|(p))\.?m\.?)?(\s*(?:Z|GMT|UTC)?(?:([-+]\d\d):?(\d\d)?)?)?/i
	, wordRe = /.[a-z]+/g
	, unescapeRe = /\\(.)/g
	//, isoDateRe = /(\d{4})[-.\/]W(\d\d?)[-.\/](\d)/
	

	// ISO 8601 specifies numeric representations of date and time.
	//
	// The international standard date notation is
	// YYYY-MM-DD
	//
	// The international standard notation for the time of day is
	// hh:mm:ss
	//
	// Time zone
	//
	// The strings +hh:mm, +hhmm, or +hh (ahead of UTC)
	// -hh:mm, -hhmm, or -hh (time zones west of the zero meridian, which are behind UTC)
	//
	// 12:00Z = 13:00+01:00 = 0700-0500
	
	Date[proto].format = function(mask) {
		mask = Date.masks[mask] || mask || Date.masks["default"]

		var self = this
		, get = "get" + (mask.slice(0,4) == "UTC:" ? (mask=mask.slice(4), "UTC"):"")

		return mask.replace(maskRe, function(match, quote, text, MD, MD4, single, pad) {
			text = single == "Y"   ? self[get + "FullYear"]() % 100
				 : match == "YYYY" ? self[get + "FullYear"]()
				 : single == "M"   ? self[get + "Month"]()+1
				 : MD     == "M" ? Date.monthNames[ self[get + "Month"]()+(MD4 ? 12 : 0) ]
				 : single == "D"   ? self[get + "Date"]()
				 : MD     == "D" ? Date.dayNames[ self[get + "Day"]() + (MD4 ? 7:0 ) ]
				 : single == "H"   ? self[get + "Hours"]() % 12 || 12
				 : single == "h"   ? self[get + "Hours"]()
				 : single == "m"   ? self[get + "Minutes"]()
				 : single == "s"   ? self[get + "Seconds"]()
				 : match == "S"    ? self[get + "Milliseconds"]()
				 : match == "SS"   ? (quote = self[get + "Milliseconds"](), quote > 99 ? quote : (quote > 9 ? "0" : "00" ) + quote)
				 : match == "u"    ? (self/1000)>>>0
				 : match == "U"    ? +self
				 : match == "A"    ? Date[self[get + "Hours"]() > 11 ? "pm" : "am"]
				 : match == "Z"    ? "GMT " + (-self.getTimezoneOffset()/60)
				 : match == "w"    ? self[get + "Day"]() || 7
				 : single == "W"   ? (quote = new Date(+self + ((4 - (self[get + "Day"]()||7)) * 86400000)), Math.ceil(((quote.getTime()-quote["s" + get.slice(1) + "Month"](0,1)) / 86400000 + 1 ) / 7) )
				 : match == "o"    ? new Date(+self + ((4 - (self[get + "Day"]()||7)) * 86400000))[get + "FullYear"]()
				 : quote           ? text.replace(unescapeRe, "$1")
				 : match
			return pad && text < 10 ? "0"+text : text
		})
	}

	Date.am = "AM"
	Date.pm = "PM"

	Date.masks = {"default":"DDD MMM DD YYYY hh:mm:ss","isoUtcDateTime":'UTC:YYYY-MM-DD"T"hh:mm:ss"Z"'}
	Date.monthNames = "JanFebMarAprMayJunJulAugSepOctNovDecJanuaryFebruaryMarchAprilMayJuneJulyAugustSeptemberOctoberNovemberDecember".match(wordRe)
	Date.dayNames = "SunMonTueWedThuFriSatSundayMondayTuesdayWednesdayThursdayFridaySaturday".match(wordRe)

	//*/


	/*
	* // In Chrome Date.parse("01.02.2001") is Jan
	* n = +self || Date.parse(self) || ""+self;
	*/

	String[proto].date = Number[proto].date = function(format) {
		var m, temp
		, d = new Date
		, n = +this || ""+this

		if (isNaN(n)) {
			// Big endian date, starting with the year, eg. 2011-01-31
			if (m = n.match(yearFirstRe)) d.setFullYear(m[1], m[2]-1, m[3])

			else if (m = n.match(dateFirstRe)) {
				// Middle endian date, starting with the month, eg. 01/31/2011
				// Little endian date, starting with the day, eg. 31.01.2011
				temp = Date.middle_endian ? 1 : 2
				d.setFullYear(m[3], m[temp]-1, m[3-temp])
			}

			// Time
			m = n.match(timeRe) || [0, 0, 0]
			d.setHours( m[6] && m[1] < 12 ? +m[1]+12 : m[5] && m[1] == 12 ? 0 : m[1], m[2], m[3]|0, m[4]|0)
			// Timezone
			if (m[7]) {
				d.setTime(d-((d.getTimezoneOffset() + (m[8]|0)*60 + ((m[8]<0?-1:1)*(m[9]|0)))*60000))
			}
		} else d.setTime( n < 4294967296 ? n * 1000 : n )
		return format ? d.format(format) : d
	}

}(Date, "prototype")





},{}],98:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[90,"cwp+TC","0dIKTs","aFoCK0"])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0FycmF5LnJlbW92ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9CaW5kYWJsZUNvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9Db21wb25lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ1gvRGF0YVNvdXJjZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9MY1dpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9leHRlbmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ29va2llLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0ZhY2Vib29rQ29ubmVjdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9MY1VybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9QcmljZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9SZWdFeHAucXVvdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU2ltcGxlU2xpZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nRm9ybWF0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmF1dG9sb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguc2xpZGVyVGFicy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC53aXphcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW5FeHRyYS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9VSVNsaWRlckxhYmVscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Q2FsbGJhY2tzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhGb3Jtcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvQ2FsY3VsYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9Gb2N1cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvZmlsbFN1Ym1lbnUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvQm9va2luZ3NOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvTW9udGhseS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9XZWVrbHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvV29ya0hvdXJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2NsZWFyQ3VycmVudFNlbGVjdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9kYXRlVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvZm9ybWF0RGF0ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9tYWtlVW5zZWxlY3RhYmxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL29iamVjdFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL3V0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2Jsb2NrUHJlc2V0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NyZWF0ZUlmcmFtZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlSVNPODYwMS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9nZXRUZXh0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFhQYXRoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dvb2dsZU1hcFJlYWR5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2d1aWRHZW5lcmF0b3IuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvaGFzQ29uZmlybVN1cHBvcnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvaTE4bi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pc0VtcHR5U3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5hcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmJvdW5kcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5pc0NoaWxkT2YuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lm91dGVySHRtbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkucmVsb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS54dHNoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeVV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2xvYWRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tYXRoVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbnVtYmVyVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcGxhY2Vob2xkZXItcG9seWZpbGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Ntb290aEJveEJsb2NrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Rvb2x0aXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3VybFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3ZhbGlkYXRpb25IZWxwZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FjY291bnRQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FwcC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2ZhcXNQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2xlZ2FsUG9wdXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9wcm92aWRlcldlbGNvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3dlbGNvbWVQb3B1cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvbm9kZV9tb2R1bGVzL2RhdGUtZm9ybWF0LWxpdGUvZGF0ZS1mb3JtYXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDelJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIEFycmF5IFJlbW92ZSAtIEJ5IEpvaG4gUmVzaWcgKE1JVCBMaWNlbnNlZClcclxuLypBcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGZyb20sIHRvKSB7XHJcbklhZ29TUkw6IGl0IHNlZW1zIGluY29tcGF0aWJsZSB3aXRoIE1vZGVybml6ciBsb2FkZXIgZmVhdHVyZSBsb2FkaW5nIFplbmRlc2sgc2NyaXB0LFxyXG5tb3ZlZCBmcm9tIHByb3RvdHlwZSB0byBhIGNsYXNzLXN0YXRpYyBtZXRob2QgKi9cclxuZnVuY3Rpb24gYXJyYXlSZW1vdmUoYW5BcnJheSwgZnJvbSwgdG8pIHtcclxuICAgIHZhciByZXN0ID0gYW5BcnJheS5zbGljZSgodG8gfHwgZnJvbSkgKyAxIHx8IGFuQXJyYXkubGVuZ3RoKTtcclxuICAgIGFuQXJyYXkubGVuZ3RoID0gZnJvbSA8IDAgPyBhbkFycmF5Lmxlbmd0aCArIGZyb20gOiBmcm9tO1xyXG4gICAgcmV0dXJuIGFuQXJyYXkucHVzaC5hcHBseShhbkFycmF5LCByZXN0KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGFycmF5UmVtb3ZlO1xyXG59IGVsc2Uge1xyXG4gICAgQXJyYXkucmVtb3ZlID0gYXJyYXlSZW1vdmU7XHJcbn0iLCIvKipcclxuICBCaW5kYWJsZSBVSSBDb21wb25lbnQuXHJcbiAgSXQgcmVsaWVzIG9uIENvbXBvbmVudCBidXQgYWRkcyBEYXRhU291cmNlIGNhcGFiaWxpdGllc1xyXG4qKi9cclxudmFyIERhdGFTb3VyY2UgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2UnKTtcclxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoJy4vQ29tcG9uZW50Jyk7XHJcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpO1xyXG52YXIgbWV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xyXG5cclxuLyoqXHJcblJldXNpbmcgdGhlIG9yaWdpbmFsIGZldGNoRGF0YSBtZXRob2QgYnV0IGFkZGluZyBjbGFzc2VzIHRvIG91clxyXG5jb21wb25lbnQgZWxlbWVudCBmb3IgYW55IHZpc3VhbCBub3RpZmljYXRpb24gb2YgdGhlIGRhdGEgbG9hZGluZy5cclxuTWV0aG9kIGdldCBleHRlbmRlZCB3aXRoIGlzUHJlZmV0Y2hpbmcgbWV0aG9kIGZvciBkaWZmZXJlbnRcclxuY2xhc3Nlcy9ub3RpZmljYXRpb25zIGRlcGVuZGFudCBvbiB0aGF0IGZsYWcsIGJ5IGRlZmF1bHQgZmFsc2U6XHJcbioqL1xyXG52YXIgY29tcG9uZW50RmV0Y2hEYXRhID0gZnVuY3Rpb24gYmluZGFibGVDb21wb25lbnRGZXRjaERhdGEocXVlcnlEYXRhLCBtb2RlLCBpc1ByZWZldGNoaW5nKSB7XHJcbiAgdmFyIGNsID0gaXNQcmVmZXRjaGluZyA/IHRoaXMuY2xhc3Nlcy5wcmVmZXRjaGluZyA6IHRoaXMuY2xhc3Nlcy5mZXRjaGluZztcclxuICB0aGlzLiRlbC5hZGRDbGFzcyhjbCk7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB2YXIgcmVxID0gRGF0YVNvdXJjZS5wcm90b3R5cGUuZmV0Y2hEYXRhLmNhbGwodGhpcywgcXVlcnlEYXRhLCBtb2RlKVxyXG4gIC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuJGVsLnJlbW92ZUNsYXNzKGNsIHx8ICdfJyk7XHJcbiAgICAvLyBVbm1hcmsgYW55IHBvc2libGUgcHJldmlvdXMgZXJyb3Igc2luY2Ugd2UgaGFkIGEgc3VjY2VzIGxvYWQ6XHJcbiAgICB0aGF0Lmhhc0Vycm9yKGZhbHNlKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHJlcTtcclxufTtcclxuLyoqXHJcblJlcGxhY2luZywgYnV0IHJldXNpbmcgaW50ZXJuYWxzLCB0aGUgZGVmYXVsdCBvbmVycm9yIGNhbGxiYWNrIGZvciB0aGVcclxuZmV0Y2hEYXRhIGZ1bmN0aW9uIHRvIGFkZCBub3RpZmljYXRpb24gY2xhc3NlcyB0byBvdXIgY29tcG9uZW50IG1vZGVsXHJcbioqL1xyXG5jb21wb25lbnRGZXRjaERhdGEub25lcnJvciA9IGZ1bmN0aW9uIGJpbmRhYmxlQ29tcG9uZW50RmVjaERhdGFPbmVycm9yKHgsIHMsIGUpIHtcclxuICBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaERhdGEub25lcnJvci5jYWxsKHRoaXMsIHgsIHMsIGUpO1xyXG4gIC8vIFJlbW92ZSBmZXRjaGluZyBjbGFzc2VzOlxyXG4gIHRoaXMuJGVsXHJcbiAgLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5mZXRjaGluZyB8fCAnXycpXHJcbiAgLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5wcmVmZXRjaGluZyB8fCAnXycpO1xyXG4gIC8vIE1hcmsgZXJyb3I6XHJcbiAgdGhpcy5oYXNFcnJvcih7IG5hbWU6ICdmZXRjaERhdGFFcnJvcicsIHJlcXVlc3Q6IHgsIHN0YXR1czogcywgZXhjZXB0aW9uOiBlIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgQmluZGFibGVDb21wb25lbnQgY2xhc3NcclxuKiovXHJcbnZhciBCaW5kYWJsZUNvbXBvbmVudCA9IENvbXBvbmVudC5leHRlbmQoXHJcbiAgRGF0YVNvdXJjZS5wcm90b3R5cGUsXHJcbiAgLy8gUHJvdG90eXBlXHJcbiAge1xyXG4gICAgY2xhc3Nlczoge1xyXG4gICAgICBmZXRjaGluZzogJ2lzLWxvYWRpbmcnLFxyXG4gICAgICBwcmVmZXRjaGluZzogJ2lzLXByZWxvYWRpbmcnLFxyXG4gICAgICBkaXNhYmxlZDogJ2lzLWRpc2FibGVkJyxcclxuICAgICAgaGFzRGF0YUVycm9yOiAnaGFzLWRhdGFFcnJvcidcclxuICAgIH0sXHJcbiAgICBmZXRjaERhdGE6IGNvbXBvbmVudEZldGNoRGF0YSxcclxuICAgIC8vIFdoYXQgYXR0cmlidXRlIG5hbWUgdXNlIHRvIG1hcmsgZWxlbWVudHMgaW5zaWRlIHRoZSBjb21wb25lbnRcclxuICAgIC8vIHdpdGggdGhlIHByb3BlcnR5IGZyb20gdGhlIHNvdXJjZSB0byBiaW5kLlxyXG4gICAgLy8gVGhlIHByZWZpeCAnZGF0YS0nIGluIGN1c3RvbSBhdHRyaWJ1dGVzIGlzIHJlcXVpcmVkIGJ5IGh0bWw1LFxyXG4gICAgLy8ganVzdCBzcGVjaWZ5IHRoZSBzZWNvbmQgcGFydCwgYmVpbmcgJ2JpbmQnIHRoZSBhdHRyaWJ1dGVcclxuICAgIC8vIG5hbWUgdG8gdXNlIGlzICdkYXRhLWJpbmQnXHJcbiAgICBkYXRhQmluZEF0dHJpYnV0ZTogJ2JpbmQnLFxyXG4gICAgLy8gRGVmYXVsdCBiaW5kRGF0YSBpbXBsZW1lbnRhdGlvbiwgY2FuIGJlIHJlcGxhY2Ugb24gZXh0ZW5kZWQgY29tcG9uZW50c1xyXG4gICAgLy8gdG8gc29tZXRoaW5nIG1vcmUgY29tcGxleCAobGlzdC9jb2xsZWN0aW9ucywgc3ViLW9iamVjdHMsIGN1c3RvbSBzdHJ1Y3R1cmVzXHJcbiAgICAvLyBhbmQgdmlzdWFsaXphdGlvbiAtLWtlZXAgYXMgcG9zc2libGUgdGhlIHVzZSBvZiBkYXRhQmluZEF0dHJpYnV0ZSBmb3IgcmV1c2FibGUgY29kZSkuXHJcbiAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIHdvcmtzIGZpbmUgZm9yIGRhdGEgYXMgcGxhaW4gb2JqZWN0IHdpdGggXHJcbiAgICAvLyBzaW1wbGUgdHlwZXMgYXMgcHJvcGVydGllcyAobm90IG9iamVjdHMgb3IgYXJyYXlzIGluc2lkZSB0aGVtKS5cclxuICAgIGJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YSgpIHtcclxuICAgICAgaWYgKCF0aGlzLmRhdGEpIHJldHVybjtcclxuICAgICAgLy8gQ2hlY2sgZXZlcnkgZWxlbWVudCBpbiB0aGUgY29tcG9uZW50IHdpdGggYSBiaW5kXHJcbiAgICAgIC8vIHByb3BlcnR5IGFuZCB1cGRhdGUgaXQgd2l0aCB0aGUgdmFsdWUgb2YgdGhhdCBwcm9wZXJ0eVxyXG4gICAgICAvLyBmcm9tIHRoZSBkYXRhIHNvdXJjZVxyXG4gICAgICB2YXIgYXR0ID0gdGhpcy5kYXRhQmluZEF0dHJpYnV0ZTtcclxuICAgICAgdmFyIGF0dHJTZWxlY3RvciA9ICdbZGF0YS0nICsgYXR0ICsgJ10nO1xyXG4gICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgIHRoaXMuJGVsLmZpbmQoYXR0clNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgcHJvcCA9ICR0LmRhdGEoYXR0KSxcclxuICAgICAgICAgIGJpbmRlZFZhbHVlID0gdGhhdC5kYXRhW3Byb3BdO1xyXG5cclxuICAgICAgICBpZiAoJHQuaXMoJzppbnB1dCcpKVxyXG4gICAgICAgICAgJHQudmFsKGJpbmRlZFZhbHVlKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAkdC50ZXh0KGJpbmRlZFZhbHVlKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgIEl0IGdldHMgdGhlIGxhdGVzdCBlcnJvciBoYXBwZW5lZCBpbiB0aGUgY29tcG9uZW50IChvciBudWxsL2ZhbHN5IGlmIHRoZXJlIGlzIG5vKSxcclxuICAgICAgb3Igc2V0cyB0aGUgZXJyb3IgKHBhc3NpbmcgaXQgaW4gdGhlIG9wdGlvbmFsIHZhbHVlKSByZXR1cm5pbmcgdGhlIHByZXZpb3VzIHJlZ2lzdGVyZWQgZXJyb3IuXHJcbiAgICAgIEl0cyByZWNvbW1lbmRlZCBhbiBvYmplY3QgYXMgZXJyb3IgaW5zdGVhZCBvZiBhIHNpbXBsZSB2YWx1ZSBvciBzdHJpbmcgKHRoYXQgY2FuIGdldCBjb25mdXNlZFxyXG4gICAgICB3aXRoIGZhbHN5IGlmIGlzIGVtcHR5IHN0cmluZyBvciAwLCBhbmQgYWxsb3cgYXR0YWNoIG1vcmUgc3RydWN0dXJlZCBpbmZvcm1hdGlvbikgd2l0aCBhblxyXG4gICAgICBpbmZvcm1hdGlvbmFsIHByb3BlcnR5ICduYW1lJy5cclxuICAgICAgVG8gc2V0IG9mZiB0aGUgZXJyb3IsIHBhc3MgbnVsbCB2YWx1ZSBvciBmYWxzZS5cclxuICAgICoqL1xyXG4gICAgaGFzRXJyb3I6IGZ1bmN0aW9uIGhhc0Vycm9yKGVycm9yVG9TZXQpIHtcclxuICAgICAgaWYgKHR5cGVvZiAoZXJyb3JUb1NldCkgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZXJyb3IgfHwgbnVsbDtcclxuICAgICAgfVxyXG4gICAgICB2YXIgcHJldiA9IHRoaXMuX2Vycm9yIHx8IG51bGw7XHJcbiAgICAgIHRoaXMuX2Vycm9yID0gZXJyb3JUb1NldDtcclxuICAgICAgdGhpcy5ldmVudHMuZW1pdCgnaGFzRXJyb3JDaGFuZ2VkJywgZXJyb3JUb1NldCwgcHJldik7XHJcbiAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gQ29uc3RydWN0b3JcclxuICBmdW5jdGlvbiBCaW5kYWJsZUNvbXBvbmVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICBDb21wb25lbnQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICAgIFxyXG4gICAgLy8gSXQgaGFzIGFuIGV2ZW50IGVtaXR0ZXI6XHJcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBtZXZlbnRzLkV2ZW50RW1pdHRlcigpO1xyXG4gICAgLy8gRXZlbnRzIG9iamVjdCBoYXMgYSBwcm9wZXJ0eSB0byBhY2Nlc3MgdGhpcyBvYmplY3QsXHJcbiAgICAvLyB1c2VmdWxsIHRvIHJlZmVyZW5jZSBhcyAndGhpcy5jb21wb25lbnQnIGZyb20gaW5zaWRlXHJcbiAgICAvLyBldmVudCBoYW5kbGVyczpcclxuICAgIHRoaXMuZXZlbnRzLmNvbXBvbmVudCA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy5kYXRhID0gdGhpcy4kZWwuZGF0YSgnc291cmNlJykgfHwgdGhpcy5kYXRhIHx8IHt9O1xyXG4gICAgaWYgKHR5cGVvZiAodGhpcy5kYXRhKSA9PSAnc3RyaW5nJylcclxuICAgICAgdGhpcy5kYXRhID0gSlNPTi5wYXJzZSh0aGlzLmRhdGEpO1xyXG5cclxuICAgIC8vIE9uIGh0bWwgc291cmNlIHVybCBjb25maWd1cmF0aW9uOlxyXG4gICAgdGhpcy51cmwgPSB0aGlzLiRlbC5kYXRhKCdzb3VyY2UtdXJsJykgfHwgdGhpcy51cmw7XHJcblxyXG4gICAgLy8gQ2xhc3NlcyBvbiBmZXRjaERhdGFFcnJvclxyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgdGhpcy5ldmVudHMub24oJ2hhc0Vycm9yQ2hhbmdlZCcsIGZ1bmN0aW9uIChlcnIsIHByZXZFcnIpIHtcclxuICAgICAgaWYgKGVyciAmJiBlcnIubmFtZSA9PSAnZmV0Y2hEYXRhRXJyb3InKSB7XHJcbiAgICAgICAgdGhhdC4kZWwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLmhhc0RhdGFFcnJvcik7XHJcbiAgICAgIH0gZWxzZSBpZiAocHJldkVyciAmJiBwcmV2RXJyLm5hbWUgPT0gJ2ZldGNoRGF0YUVycm9yJykge1xyXG4gICAgICAgIHRoYXQuJGVsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5oYXNEYXRhRXJyb3IgfHwgJ18nKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gVE9ETzogJ2NoYW5nZScgZXZlbnQgaGFuZGxlcnMgb24gZm9ybXMgd2l0aCBkYXRhLWJpbmQgdG8gdXBkYXRlIGl0cyB2YWx1ZSBhdCB0aGlzLmRhdGFcclxuICAgIC8vIFRPRE86IGF1dG8gJ2JpbmREYXRhJyBvbiBmZXRjaERhdGEgZW5kcz8gY29uZmlndXJhYmxlLCBiaW5kRGF0YU1vZGV7IGlubWVkaWF0ZSwgbm90aWZ5IH1cclxuICB9XHJcbik7XHJcblxyXG4vLyBQdWJsaWMgbW9kdWxlOlxyXG5tb2R1bGUuZXhwb3J0cyA9IEJpbmRhYmxlQ29tcG9uZW50OyIsIi8qKiBDb21wb25lbnQgY2xhc3M6IHdyYXBwZXIgZm9yXHJcbiAgdGhlIGxvZ2ljIGFuZCBiZWhhdmlvciBhcm91bmRcclxuICBhIERPTSBlbGVtZW50XHJcbioqL1xyXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKTtcclxuXHJcbmZ1bmN0aW9uIENvbXBvbmVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgdGhpcy5lbCA9IGVsZW1lbnQ7XHJcbiAgdGhpcy4kZWwgPSAkKGVsZW1lbnQpO1xyXG4gIGV4dGVuZCh0aGlzLCBvcHRpb25zKTtcclxuICAvLyBVc2UgdGhlIGpRdWVyeSAnZGF0YScgc3RvcmFnZSB0byBwcmVzZXJ2ZSBhIHJlZmVyZW5jZVxyXG4gIC8vIHRvIHRoaXMgaW5zdGFuY2UgKHVzZWZ1bCB0byByZXRyaWV2ZSBpdCBmcm9tIGRvY3VtZW50KVxyXG4gIHRoaXMuJGVsLmRhdGEoJ2NvbXBvbmVudCcsIHRoaXMpO1xyXG59XHJcblxyXG5leHRlbmQucGx1Z0luKENvbXBvbmVudCk7XHJcbmV4dGVuZC5wbHVnSW4oQ29tcG9uZW50LnByb3RvdHlwZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDsiLCIvKipcclxuICBEYXRhU291cmNlIGNsYXNzIHRvIHNpbXBsaWZ5IGZldGNoaW5nIGRhdGEgYXMgSlNPTlxyXG4gIHRvIGZpbGwgYSBsb2NhbCBjYWNoZS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBmZXRjaEpTT04gPSAkLmdldEpTT04sXHJcbiAgICBleHRlbmQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAkLmV4dGVuZC5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTsgfTtcclxuXHJcbi8vIFRPRE86IHJlcGxhY2UgZWFjaCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgYnkgaW5zdGFuY2UgcHJvcGVydGllcywgc2luY2UgdGhhdCBwcm9wZXJ0aWVzIGJlY29tZVxyXG4vLyBzaGFyZWQgYmV0d2VlbiBpbnN0YW5jZXMgYW5kIGlzIG5vdCB3YW50ZWRcclxuXHJcbnZhciByZXFNb2RlcyA9IERhdGFTb3VyY2UucmVxdWVzdE1vZGVzID0ge1xyXG4gIC8vIFBhcmFsbGVsIHJlcXVlc3QsIG5vIG1hdHRlciBvZiBvdGhlcnNcclxuICBtdWx0aXBsZTogMCxcclxuICAvLyBXaWxsIGF2b2lkIGEgcmVxdWVzdCBpZiB0aGVyZSBpcyBvbmUgcnVubmluZ1xyXG4gIHNpbmdsZTogMSxcclxuICAvLyBMYXRlc3QgcmVxdWV0IHdpbGwgcmVwbGFjZSBhbnkgcHJldmlvdXMgb25lIChwcmV2aW91cyB3aWxsIGFib3J0KVxyXG4gIHJlcGxhY2U6IDJcclxufTtcclxuXHJcbnZhciB1cGRNb2RlcyA9IERhdGFTb3VyY2UudXBkYXRlTW9kZXMgPSB7XHJcbiAgLy8gRXZlcnkgbmV3IGRhdGEgdXBkYXRlLCBuZXcgY29udGVudCBpcyBhZGRlZCBpbmNyZW1lbnRhbGx5XHJcbiAgLy8gKG92ZXJ3cml0ZSBjb2luY2lkZW50IGNvbnRlbnQsIGFwcGVuZCBuZXcgY29udGVudCwgb2xkIGNvbnRlbnRcclxuICAvLyBnZXQgaW4gcGxhY2UpXHJcbiAgaW5jcmVtZW50YWw6IDAsXHJcbiAgLy8gT24gbmV3IGRhdGEgdXBkYXRlLCBuZXcgZGF0YSB0b3RhbGx5IHJlcGxhY2UgdGhlIHByZXZpb3VzIG9uZVxyXG4gIHJlcGxhY2VtZW50OiAxXHJcbn07XHJcblxyXG4vKipcclxuVXBkYXRlIHRoZSBkYXRhIHN0b3JlIG9yIGNhY2hlIHdpdGggdGhlIGdpdmVuIG9uZS5cclxuVGhlcmUgYXJlIGRpZmZlcmVudCBtb2RlcywgdGhpcyBtYW5hZ2VzIHRoYXQgbG9naWMgYW5kXHJcbml0cyBvd24gY29uZmlndXJhdGlvbi5cclxuSXMgZGVjb3VwbGVkIGZyb20gdGhlIHByb3RvdHlwZSBidXRcclxuaXQgd29ya3Mgb25seSBhcyBwYXJ0IG9mIGEgRGF0YVNvdXJjZSBpbnN0YW5jZS5cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURhdGEoZGF0YSwgbW9kZSkge1xyXG4gIHN3aXRjaCAobW9kZSB8fCB0aGlzLnVwZGF0ZURhdGEuZGVmYXVsdFVwZGF0ZU1vZGUpIHtcclxuXHJcbiAgICBjYXNlIHVwZE1vZGVzLnJlcGxhY2VtZW50OlxyXG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICAvL2Nhc2UgdXBkTW9kZXMuaW5jcmVtZW50YWw6ICBcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIC8vIEluIGNhc2UgaW5pdGlhbCBkYXRhIGlzIG51bGwsIGFzc2lnbiB0aGUgcmVzdWx0IHRvIGl0c2VsZjpcclxuICAgICAgdGhpcy5kYXRhID0gZXh0ZW5kKHRoaXMuZGF0YSwgZGF0YSk7XHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxufVxyXG5cclxuLyoqIERlZmF1bHQgdmFsdWUgZm9yIHRoZSBjb25maWd1cmFibGUgdXBkYXRlIG1vZGU6XHJcbioqL1xyXG51cGRhdGVEYXRhLmRlZmF1bHRVcGRhdGVNb2RlID0gdXBkTW9kZXMuaW5jcmVtZW50YWw7XHJcblxyXG4vKipcclxuRmV0Y2ggdGhlIGRhdGEgZnJvbSB0aGUgc2VydmVyLlxyXG5IZXJlIGlzIGRlY291cGxlZCBmcm9tIHRoZSByZXN0IG9mIHRoZSBwcm90b3R5cGUgZm9yXHJcbmNvbW1vZGl0eSwgYnV0IGl0IGNhbiB3b3JrcyBvbmx5IGFzIHBhcnQgb2YgYSBEYXRhU291cmNlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gZmV0Y2hEYXRhKHF1ZXJ5LCBtb2RlKSB7XHJcbiAgcXVlcnkgPSBleHRlbmQoe30sIHRoaXMucXVlcnksIHF1ZXJ5KTtcclxuICBzd2l0Y2ggKG1vZGUgfHwgdGhpcy5mZXRjaERhdGEuZGVmYXVsdFJlcXVlc3RNb2RlKSB7XHJcblxyXG4gICAgY2FzZSByZXFNb2Rlcy5zaW5nbGU6XHJcbiAgICAgIGlmICh0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHJldHVybiBudWxsO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIHJlcU1vZGVzLnJlcGxhY2U6XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHNbaV0uYWJvcnQoKTtcclxuICAgICAgICB9IGNhdGNoIChleCkgeyB9XHJcbiAgICAgICAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMgPSBbXTtcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuXHJcbiAgICAvLyBKdXN0IGRvIG5vdGhpbmcgZm9yIG11bHRpcGxlIG9yIGRlZmF1bHQgICAgIFxyXG4gICAgLy9jYXNlIHJlcU1vZGVzLm11bHRpcGxlOiAgXHJcbiAgICAvL2RlZmF1bHQ6IFxyXG4gIH1cclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIHZhciByZXEgPSB0aGlzLmZldGNoRGF0YS5wcm94eShcclxuICAgIHRoaXMudXJsLFxyXG4gICAgcXVlcnksXHJcbiAgICBmdW5jdGlvbiAoZGF0YSwgdCwgeGhyKSB7XHJcbiAgICAgIHZhciByZXQgPSB0aGF0LnVwZGF0ZURhdGEoZGF0YSk7XHJcbiAgICAgIHRoYXQuZmV0Y2hEYXRhLnJlcXVlc3RzLnNwbGljZSh0aGF0LmZldGNoRGF0YS5yZXF1ZXN0cy5pbmRleE9mKHJlcSksIDEpO1xyXG4gICAgICAvL2RlbGV0ZSBmZXRjaERhdGEucmVxdWVzdHNbZmV0Y2hEYXRhLnJlcXVlc3RzLmluZGV4T2YocmVxKV07XHJcblxyXG4gICAgICBpZiAocmV0ICYmIHJldC5uYW1lKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIGRhdGEgZW1pdHMgZXJyb3IsIHRoZSBBamF4IHN0aWxsIHJlc29sdmVzIGFzICdzdWNjZXNzJyBiZWNhdXNlIG9mIHRoZSByZXF1ZXN0LCBidXRcclxuICAgICAgICAvLyB3ZSBuZWVkIHRvIGV4ZWN1dGUgdGhlIGVycm9yLCBidXQgd2UgcGlwZSBpdCB0byBlbnN1cmUgaXMgZG9uZSBhZnRlciBvdGhlciAnZG9uZScgY2FsbGJhY2tzXHJcbiAgICAgICAgcmVxLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB0aGF0LmZldGNoRGF0YS5vbmVycm9yLmNhbGwodGhhdCwgbnVsbCwgcmV0Lm5hbWUsIHJldCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcbiAgKVxyXG4gIC5mYWlsKCQucHJveHkodGhpcy5mZXRjaERhdGEub25lcnJvciwgdGhpcykpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLnB1c2gocmVxKTtcclxuXHJcbiAgcmV0dXJuIHJlcTtcclxufVxyXG5cclxuLy8gRGVmYXVsdHMgZmV0Y2hEYXRhIHByb3BlcnRpZXMsIHRoZXkgYXJlIGRlY291cGxlZCB0byBhbGxvd1xyXG4vLyByZXBsYWNlbWVudCwgYW5kIGluc2lkZSB0aGUgZmV0Y2hEYXRhIGZ1bmN0aW9uIHRvIGRvbid0XHJcbi8vIGNvbnRhbWluYXRlIHRoZSBvYmplY3QgbmFtZXNwYWNlLlxyXG5cclxuLyogQ29sbGVjdGlvbiBvZiBhY3RpdmUgKGZldGNoaW5nKSByZXF1ZXN0cyB0byB0aGUgc2VydmVyXHJcbiovXHJcbmZldGNoRGF0YS5yZXF1ZXN0cyA9IFtdO1xyXG5cclxuLyogRGVjb3VwbGVkIGZ1bmN0aW9uYWxpdHkgdG8gcGVyZm9ybSB0aGUgQWpheCBvcGVyYXRpb24sXHJcbnRoaXMgYWxsb3dzIG92ZXJ3cml0ZSB0aGlzIGJlaGF2aW9yIHRvIGltcGxlbWVudCBhbm90aGVyXHJcbndheXMsIGxpa2UgYSBub24talF1ZXJ5IGltcGxlbWVudGF0aW9uLCBhIHByb3h5IHRvIGZha2Ugc2VydmVyXHJcbmZvciB0ZXN0aW5nIG9yIHByb3h5IHRvIGxvY2FsIHN0b3JhZ2UgaWYgb25saW5lLCBldGMuXHJcbkl0IG11c3QgcmV0dXJucyB0aGUgdXNlZCByZXF1ZXN0IG9iamVjdC5cclxuKi9cclxuZmV0Y2hEYXRhLnByb3h5ID0gZmV0Y2hKU09OO1xyXG5cclxuLyogQnkgZGVmYXVsdCwgZmV0Y2hEYXRhIGFsbG93cyBtdWx0aXBsZSBzaW11bHRhbmVvcyBjb25uZWN0aW9uLFxyXG5zaW5jZSB0aGUgc3RvcmFnZSBieSBkZWZhdWx0IGFsbG93cyBpbmNyZW1lbnRhbCB1cGRhdGVzIHJhdGhlclxyXG50aGFuIHJlcGxhY2VtZW50cy5cclxuKi9cclxuZmV0Y2hEYXRhLmRlZmF1bHRSZXF1ZXN0TW9kZSA9IHJlcU1vZGVzLm11bHRpcGxlO1xyXG5cclxuLyogRGVmYXVsdCBub3RpZmljYXRpb24gb2YgZXJyb3Igb24gZmV0Y2hpbmcsIGp1c3QgbG9nZ2luZyxcclxuY2FuIGJlIHJlcGxhY2VkLlxyXG5JdCByZWNlaXZlcyB0aGUgcmVxdWVzdCBvYmplY3QsIHN0YXR1cyBhbmQgZXJyb3IuXHJcbiovXHJcbmZldGNoRGF0YS5vbmVycm9yID0gZnVuY3Rpb24gZXJyb3IoeCwgcywgZSkge1xyXG4gIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ0ZldGNoIGRhdGEgZXJyb3IgJW8nLCBlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gIERhdGFTb3VyY2UgY2xhc3NcclxuKiovXHJcbi8vIENvbnN0cnVjdG9yOiBldmVyeXRoaW5nIGlzIGluIHRoZSBwcm90b3R5cGUuXHJcbmZ1bmN0aW9uIERhdGFTb3VyY2UoKSB7IH1cclxuRGF0YVNvdXJjZS5wcm90b3R5cGUgPSB7XHJcbiAgZGF0YTogbnVsbCxcclxuICB1cmw6ICcvJyxcclxuICAvLyBxdWVyeTogb2JqZWN0IHdpdGggZGVmYXVsdCBleHRyYSBpbmZvcm1hdGlvbiB0byBhcHBlbmQgdG8gdGhlIHVybFxyXG4gIC8vIHdoZW4gZmV0Y2hpbmcgZGF0YSwgZXh0ZW5kZWQgd2l0aCB0aGUgZXhwbGljaXQgcXVlcnkgc3BlY2lmaWVkXHJcbiAgLy8gZXhlY3V0aW5nIGZldGNoRGF0YShxdWVyeSlcclxuICBxdWVyeToge30sXHJcbiAgdXBkYXRlRGF0YTogdXBkYXRlRGF0YSxcclxuICBmZXRjaERhdGE6IGZldGNoRGF0YVxyXG4gIC8vIFRPRE8gIHB1c2hEYXRhOiBmdW5jdGlvbigpeyBwb3N0L3B1dCB0aGlzLmRhdGEgdG8gdXJsICB9XHJcbn07XHJcblxyXG4vLyBDbGFzcyBhcyBwdWJsaWMgbW9kdWxlOlxyXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFTb3VyY2U7IiwiLyoqXHJcbiAgTG9jb25vbWljcyBzcGVjaWZpYyBXaWRnZXQgYmFzZWQgb24gQmluZGFibGVDb21wb25lbnQuXHJcbiAgSnVzdCBkZWNvdXBsaW5nIHNwZWNpZmljIGJlaGF2aW9ycyBmcm9tIHNvbWV0aGluZyBtb3JlIGdlbmVyYWxcclxuICB0byBlYXNpbHkgdHJhY2sgdGhhdCBkZXRhaWxzLCBhbmQgbWF5YmUgZnV0dXJlIG1pZ3JhdGlvbnMgdG9cclxuICBvdGhlciBmcm9udC1lbmQgZnJhbWV3b3Jrcy5cclxuKiovXHJcbnZhciBEYXRhU291cmNlID0gcmVxdWlyZSgnLi9EYXRhU291cmNlJyk7XHJcbnZhciBCaW5kYWJsZUNvbXBvbmVudCA9IHJlcXVpcmUoJy4vQmluZGFibGVDb21wb25lbnQnKTtcclxuXHJcbnZhciBMY1dpZGdldCA9IEJpbmRhYmxlQ29tcG9uZW50LmV4dGVuZChcclxuICAvLyBQcm90b3R5cGVcclxuICB7XHJcbiAgICAvLyBSZXBsYWNpbmcgdXBkYXRlRGF0YSB0byBpbXBsZW1lbnQgdGhlIHBhcnRpY3VsYXJcclxuICAgIC8vIEpTT04gc2NoZW1lIG9mIExvY29ub21pY3MsIGJ1dCByZXVzaW5nIG9yaWdpbmFsXHJcbiAgICAvLyBsb2dpYyBpbmhlcml0IGZyb20gRGF0YVNvdXJjZVxyXG4gICAgdXBkYXRlRGF0YTogZnVuY3Rpb24gKGRhdGEsIG1vZGUpIHtcclxuICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgRGF0YVNvdXJjZS5wcm90b3R5cGUudXBkYXRlRGF0YS5jYWxsKHRoaXMsIGRhdGEuUmVzdWx0LCBtb2RlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBFcnJvciBtZXNzYWdlIGluIHRoZSBKU09OXHJcbiAgICAgICAgcmV0dXJuIHsgbmFtZTogJ2RhdGEtZm9ybWF0JywgbWVzc2FnZTogZGF0YS5SZXN1bHQgPyBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgPyBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgOiBkYXRhLlJlc3VsdCA6IFwidW5rbm93XCIgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gQ29uc3RydWN0b3JcclxuICBmdW5jdGlvbiBMY1dpZGdldChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICBCaW5kYWJsZUNvbXBvbmVudC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIH1cclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGNXaWRnZXQ7IiwiLyoqXHJcbiAgRGVlcCBFeHRlbmQgb2JqZWN0IHV0aWxpdHksIGlzIHJlY3Vyc2l2ZSB0byBnZXQgYWxsIHRoZSBkZXB0aFxyXG4gIGJ1dCBvbmx5IGZvciB0aGUgcHJvcGVydGllcyBvd25lZCBieSB0aGUgb2JqZWN0LFxyXG4gIGlmIHlvdSBuZWVkIHRoZSBub24tb3duZWQgcHJvcGVydGllcyB0byBpbiB0aGUgb2JqZWN0LFxyXG4gIGNvbnNpZGVyIGV4dGVuZCBmcm9tIHRoZSBzb3VyY2UgcHJvdG90eXBlIHRvbyAoYW5kIG1heWJlIHRvXHJcbiAgdGhlIGRlc3RpbmF0aW9uIHByb3RvdHlwZSBpbnN0ZWFkIG9mIHRoZSBpbnN0YW5jZSwgYnV0IHVwIHRvIHRvbykuXHJcbioqL1xyXG5cclxuLyoganF1ZXJ5IGltcGxlbWVudGF0aW9uOlxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5leHRlbmQgPSBmdW5jdGlvbiAoKSB7XHJcbnJldHVybiAkLmV4dGVuZC5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTsgXHJcbn07Ki9cclxuXHJcbnZhciBleHRlbmQgPSBmdW5jdGlvbiBleHRlbmQoZGVzdGluYXRpb24sIHNvdXJjZSkge1xyXG4gIGZvciAodmFyIHByb3BlcnR5IGluIHNvdXJjZSkge1xyXG4gICAgaWYgKCFzb3VyY2UuaGFzT3duUHJvcGVydHkocHJvcGVydHkpKVxyXG4gICAgICBjb250aW51ZTtcclxuXHJcbiAgICAvLyBBbGxvdyBwcm9wZXJ0aWVzIHJlbW92YWwsIGlmIHNvdXJjZSBjb250YWlucyB2YWx1ZSAndW5kZWZpbmVkJy5cclxuICAgIC8vIFRoZXJlIGFyZSBubyBzcGVjaWFsIGNvbnNpZGVyYXRpb25zIG9uIEFycmF5cywgdG8gZG9uJ3QgZ2V0IHVuZGVzaXJlZFxyXG4gICAgLy8gcmVzdWx0cyBqdXN0IHRoZSB3YW50ZWQgaXMgdG8gcmVwbGFjZSBzcGVjaWZpYyBwb3NpdGlvbnMsIG5vcm1hbGx5LlxyXG4gICAgaWYgKHNvdXJjZVtwcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkZWxldGUgZGVzdGluYXRpb25bcHJvcGVydHldO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoWydvYmplY3QnLCAnZnVuY3Rpb24nXS5pbmRleE9mKHR5cGVvZiBkZXN0aW5hdGlvbltwcm9wZXJ0eV0pICE9IC0xICYmXHJcbiAgICAgICAgICAgIHR5cGVvZiBzb3VyY2VbcHJvcGVydHldID09ICdvYmplY3QnKVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBzb3VyY2VbcHJvcGVydHldKTtcclxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPT0gJ2Z1bmN0aW9uJyAmJlxyXG4gICAgICAgICAgICAgICAgIHR5cGVvZiBzb3VyY2VbcHJvcGVydHldID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdmFyIG9yaWcgPSBkZXN0aW5hdGlvbltwcm9wZXJ0eV07XHJcbiAgICAgIC8vIENsb25lIGZ1bmN0aW9uXHJcbiAgICAgIHZhciBzb3VyID0gY2xvbmVGdW5jdGlvbihzb3VyY2VbcHJvcGVydHldKTtcclxuICAgICAgZGVzdGluYXRpb25bcHJvcGVydHldID0gc291cjtcclxuICAgICAgLy8gQW55IHByZXZpb3VzIGF0dGFjaGVkIHByb3BlcnR5XHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIG9yaWcpO1xyXG4gICAgICAvLyBBbnkgc291cmNlIGF0dGFjaGVkIHByb3BlcnR5XHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAgICBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPSBzb3VyY2VbcHJvcGVydHldO1xyXG4gIH1cclxuXHJcbiAgLy8gU28gbXVjaCAnc291cmNlJyBhcmd1bWVudHMgYXMgd2FudGVkLiBJbiBFUzYgd2lsbCBiZSAnc291cmNlLi4nXHJcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XHJcbiAgICB2YXIgbmV4dHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xyXG4gICAgbmV4dHMuc3BsaWNlKDEsIDEpO1xyXG4gICAgZXh0ZW5kLmFwcGx5KHRoaXMsIG5leHRzKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBkZXN0aW5hdGlvbjtcclxufTtcclxuXHJcbmV4dGVuZC5wbHVnSW4gPSBmdW5jdGlvbiBwbHVnSW4ob2JqKSB7XHJcbiAgb2JqID0gb2JqIHx8IE9iamVjdC5wcm90b3R5cGU7XHJcbiAgb2JqLmV4dGVuZE1lID0gZnVuY3Rpb24gZXh0ZW5kTWUoKSB7XHJcbiAgICBleHRlbmQuYXBwbHkodGhpcywgW3RoaXNdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XHJcbiAgfTtcclxuICBvYmouZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kSW5zdGFuY2UoKSB7XHJcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXHJcbiAgICAgIC8vIElmIHRoZSBvYmplY3QgdXNlZCB0byBleHRlbmQgZnJvbSBpcyBhIGZ1bmN0aW9uLCBpcyBjb25zaWRlcmVkXHJcbiAgICAgIC8vIGEgY29uc3RydWN0b3IsIHRoZW4gd2UgZXh0ZW5kIGZyb20gaXRzIHByb3RvdHlwZSwgb3RoZXJ3aXNlIGl0c2VsZi5cclxuICAgICAgY29uc3RydWN0b3JBID0gdHlwZW9mIHRoaXMgPT0gJ2Z1bmN0aW9uJyA/IHRoaXMgOiBudWxsLFxyXG4gICAgICBiYXNlQSA9IGNvbnN0cnVjdG9yQSA/IHRoaXMucHJvdG90eXBlIDogdGhpcyxcclxuICAgICAgLy8gSWYgbGFzdCBhcmd1bWVudCBpcyBhIGZ1bmN0aW9uLCBpcyBjb25zaWRlcmVkIGEgY29uc3RydWN0b3JcclxuICAgICAgLy8gb2YgdGhlIG5ldyBjbGFzcy9vYmplY3QgdGhlbiB3ZSBleHRlbmQgaXRzIHByb3RvdHlwZS5cclxuICAgICAgLy8gV2UgdXNlIGFuIGVtcHR5IG9iamVjdCBvdGhlcndpc2UuXHJcbiAgICAgIGNvbnN0cnVjdG9yQiA9IHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT0gJ2Z1bmN0aW9uJyA/XHJcbiAgICAgICAgYXJncy5zcGxpY2UoYXJncy5sZW5ndGggLSAxKVswXSA6XHJcbiAgICAgICAgbnVsbCxcclxuICAgICAgYmFzZUIgPSBjb25zdHJ1Y3RvckIgPyBjb25zdHJ1Y3RvckIucHJvdG90eXBlIDoge307XHJcblxyXG4gICAgdmFyIGV4dGVuZGVkUmVzdWx0ID0gZXh0ZW5kLmFwcGx5KHRoaXMsIFtiYXNlQiwgYmFzZUFdLmNvbmNhdChhcmdzKSk7XHJcbiAgICAvLyBJZiBib3RoIGFyZSBjb25zdHJ1Y3RvcnMsIHdlIHdhbnQgdGhlIHN0YXRpYyBtZXRob2RzIHRvIGJlIGNvcGllZCB0b286XHJcbiAgICBpZiAoY29uc3RydWN0b3JBICYmIGNvbnN0cnVjdG9yQilcclxuICAgICAgZXh0ZW5kKGNvbnN0cnVjdG9yQiwgY29uc3RydWN0b3JBKTtcclxuXHJcbiAgICAvLyBJZiB3ZSBhcmUgZXh0ZW5kaW5nIGEgY29uc3RydWN0b3IsIHdlIHJldHVybiB0aGF0LCBvdGhlcndpc2UgdGhlIHJlc3VsdFxyXG4gICAgcmV0dXJuIGNvbnN0cnVjdG9yQiB8fCBleHRlbmRlZFJlc3VsdDtcclxuICB9O1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBleHRlbmQ7XHJcbn0gZWxzZSB7XHJcbiAgLy8gZ2xvYmFsIHNjb3BlXHJcbiAgZXh0ZW5kLnBsdWdJbigpO1xyXG59XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICBDbG9uZSBVdGlsc1xyXG4qL1xyXG5mdW5jdGlvbiBjbG9uZU9iamVjdChvYmopIHtcclxuICByZXR1cm4gZXh0ZW5kKHt9LCBvYmopO1xyXG59XHJcblxyXG4vLyBUZXN0aW5nIGlmIGEgc3RyaW5nIHNlZW1zIGEgZnVuY3Rpb24gc291cmNlIGNvZGU6XHJcbi8vIFdlIHRlc3QgYWdhaW5zIGEgc2ltcGxpc2ljIHJlZ3VsYXIgZXhwcmVzaW9uIHRoYXQgbWF0Y2hcclxuLy8gYSBjb21tb24gc3RhcnQgb2YgZnVuY3Rpb24gZGVjbGFyYXRpb24uXHJcbi8vIE90aGVyIHdheXMgdG8gZG8gdGhpcyBpcyBhdCBpbnZlcnNlciwgYnkgY2hlY2tpbmdcclxuLy8gdGhhdCB0aGUgZnVuY3Rpb24gdG9TdHJpbmcgaXMgbm90IGEga25vd2VkIHRleHRcclxuLy8gYXMgJ1tvYmplY3QgRnVuY3Rpb25dJyBvciAnW25hdGl2ZSBjb2RlXScsIGJ1dFxyXG4vLyBzaW5jZSB0aGEgY2FuIGNoYW5nZXMgYmV0d2VlbiBicm93c2VycywgaXMgbW9yZSBjb25zZXJ2YXRpdmVcclxuLy8gY2hlY2sgYWdhaW5zdCBhIGNvbW1vbiBjb25zdHJ1Y3QgYW4gZmFsbGJhY2sgb24gdGhlXHJcbi8vIGNvbW1vbiBzb2x1dGlvbiBpZiBub3QgbWF0Y2hlcy5cclxudmFyIHRlc3RGdW5jdGlvbiA9IC9eXFxzKmZ1bmN0aW9uW15cXChdXFwoLztcclxuXHJcbmZ1bmN0aW9uIGNsb25lRnVuY3Rpb24oZm4pIHtcclxuICB2YXIgdGVtcDtcclxuICB2YXIgY29udGVudHMgPSBmbi50b1N0cmluZygpO1xyXG4gIC8vIENvcHkgdG8gYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIHNhbWUgcHJvdG90eXBlLCBmb3IgdGhlIG5vdCAnb3duZWQnIHByb3BlcnRpZXMuXHJcbiAgLy8gQXNzaW5nZWQgYXQgdGhlIGVuZFxyXG4gIHZhciB0ZW1wUHJvdG8gPSBPYmplY3QuY3JlYXRlKGZuLnByb3RvdHlwZSk7XHJcblxyXG4gIC8vIERJU0FCTEVEIHRoZSBjb250ZW50cy1jb3B5IHBhcnQgYmVjYXVzZSBpdCBmYWlscyB3aXRoIGNsb3N1cmVzXHJcbiAgLy8gZ2VuZXJhdGVkIGJ5IHRoZSBvcmlnaW5hbCBmdW5jdGlvbiwgdXNpbmcgdGhlIHN1Yi1jYWxsIHdheSBldmVyXHJcbiAgaWYgKHRydWUgfHwgIXRlc3RGdW5jdGlvbi50ZXN0KGNvbnRlbnRzKSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgaXMgYWxyZWFkeSBhIGNsb25lZCBjb3B5LCB0b1xyXG4gICAgLy8gcmV1c2UgdGhlIG9yaWdpbmFsIGNvZGUgYW5kIGF2b2lkIG1vcmUgdGhhblxyXG4gICAgLy8gb25lIGRlcHRoIGluIHN0YWNrIGNhbGxzIChncmVhdCEpXHJcbiAgICBpZiAodHlwZW9mIGZuLnByb3RvdHlwZS5fX19jbG9uZWRfb2YgPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgZm4gPSBmbi5wcm90b3R5cGUuX19fY2xvbmVkX29mO1xyXG5cclxuICAgIHRlbXAgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmbi5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTsgfTtcclxuXHJcbiAgICAvLyBTYXZlIG1hcmsgYXMgY2xvbmVkLiBEb25lIGluIGl0cyBwcm90b3R5cGVcclxuICAgIC8vIHRvIG5vdCBhcHBlYXIgaW4gdGhlIGxpc3Qgb2YgJ293bmVkJyBwcm9wZXJ0aWVzLlxyXG4gICAgdGVtcFByb3RvLl9fX2Nsb25lZF9vZiA9IGZuO1xyXG4gICAgLy8gUmVwbGFjZSB0b1N0cmluZyB0byByZXR1cm4gdGhlIG9yaWdpbmFsIHNvdXJjZTpcclxuICAgIHRlbXBQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIGZuLnRvU3RyaW5nKCk7XHJcbiAgICB9O1xyXG4gICAgLy8gVGhlIG5hbWUgY2Fubm90IGJlIHNldCwgd2lsbCBqdXN0IGJlIGFub255bW91c1xyXG4gICAgLy90ZW1wLm5hbWUgPSB0aGF0Lm5hbWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFRoaXMgd2F5IG9uIGNhcGFibGUgYnJvd3NlcnMgcHJlc2VydmUgdGhlIG9yaWdpbmFsIG5hbWUsXHJcbiAgICAvLyBkbyBhIHJlYWwgaW5kZXBlbmRlbnQgY29weSBhbmQgYXZvaWQgZnVuY3Rpb24gc3ViY2FsbHMgdGhhdFxyXG4gICAgLy8gY2FuIGRlZ3JhdGUgcGVyZm9ybWFuY2UgYWZ0ZXIgbG90IG9mICdjbG9ubmluZycuXHJcbiAgICB2YXIgZiA9IEZ1bmN0aW9uO1xyXG4gICAgdGVtcCA9IChuZXcgZigncmV0dXJuICcgKyBjb250ZW50cykpKCk7XHJcbiAgfVxyXG5cclxuICB0ZW1wLnByb3RvdHlwZSA9IHRlbXBQcm90bztcclxuICAvLyBDb3B5IGFueSBwcm9wZXJ0aWVzIGl0IG93bnNcclxuICBleHRlbmQodGVtcCwgZm4pO1xyXG5cclxuICByZXR1cm4gdGVtcDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xvbmVQbHVnSW4oKSB7XHJcbiAgaWYgKHR5cGVvZiBGdW5jdGlvbi5wcm90b3R5cGUuY2xvbmUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkgeyByZXR1cm4gY2xvbmVGdW5jdGlvbih0aGlzKTsgfTtcclxuICB9XHJcbiAgaWYgKHR5cGVvZiBPYmplY3QucHJvdG90eXBlLmNsb25lICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBPamJlY3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUoKSB7IHJldHVybiBjbG9uZU9iamVjdCh0aGlzKTsgfTtcclxuICB9XHJcbn1cclxuXHJcbmV4dGVuZC5jbG9uZU9iamVjdCA9IGNsb25lT2JqZWN0O1xyXG5leHRlbmQuY2xvbmVGdW5jdGlvbiA9IGNsb25lRnVuY3Rpb247XHJcbmV4dGVuZC5jbG9uZVBsdWdJbiA9IGNsb25lUGx1Z0luO1xyXG4iLCIvKipcclxuKiBDb29raWVzIG1hbmFnZW1lbnQuXHJcbiogTW9zdCBjb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNDgyNTY5NS8xNjIyMzQ2XHJcbiovXHJcbnZhciBDb29raWUgPSB7fTtcclxuXHJcbkNvb2tpZS5zZXQgPSBmdW5jdGlvbiBzZXRDb29raWUobmFtZSwgdmFsdWUsIGRheXMpIHtcclxuICAgIHZhciBleHBpcmVzID0gXCJcIjtcclxuICAgIGlmIChkYXlzKSB7XHJcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGRhdGUuc2V0VGltZShkYXRlLmdldFRpbWUoKSArIChkYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCkpO1xyXG4gICAgICAgIGV4cGlyZXMgPSBcIjsgZXhwaXJlcz1cIiArIGRhdGUudG9HTVRTdHJpbmcoKTtcclxuICAgIH1cclxuICAgIGRvY3VtZW50LmNvb2tpZSA9IG5hbWUgKyBcIj1cIiArIHZhbHVlICsgZXhwaXJlcyArIFwiOyBwYXRoPS9cIjtcclxufTtcclxuQ29va2llLmdldCA9IGZ1bmN0aW9uIGdldENvb2tpZShjX25hbWUpIHtcclxuICAgIGlmIChkb2N1bWVudC5jb29raWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNfc3RhcnQgPSBkb2N1bWVudC5jb29raWUuaW5kZXhPZihjX25hbWUgKyBcIj1cIik7XHJcbiAgICAgICAgaWYgKGNfc3RhcnQgIT0gLTEpIHtcclxuICAgICAgICAgICAgY19zdGFydCA9IGNfc3RhcnQgKyBjX25hbWUubGVuZ3RoICsgMTtcclxuICAgICAgICAgICAgY19lbmQgPSBkb2N1bWVudC5jb29raWUuaW5kZXhPZihcIjtcIiwgY19zdGFydCk7XHJcbiAgICAgICAgICAgIGlmIChjX2VuZCA9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgY19lbmQgPSBkb2N1bWVudC5jb29raWUubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB1bmVzY2FwZShkb2N1bWVudC5jb29raWUuc3Vic3RyaW5nKGNfc3RhcnQsIGNfZW5kKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFwiXCI7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IENvb2tpZTsiLCIvKiogQ29ubmVjdCBhY2NvdW50IHdpdGggRmFjZWJvb2tcclxuKiovXHJcbnZhclxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpLFxyXG4gIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyksXHJcbiAgTGNVcmwgPSByZXF1aXJlKCcuL0xjVXJsJyksXHJcbiAgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxuZnVuY3Rpb24gRmFjZWJvb2tDb25uZWN0KG9wdGlvbnMpIHtcclxuICAkLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcclxuICBpZiAoISQoJyNmYi1yb290JykubGVuZ3RoKVxyXG4gICAgJCgnPGRpdiBpZD1cImZiLXJvb3RcIiBzdHlsZT1cImRpc3BsYXk6IG5vbmVcIj48L2Rpdj4nKS5hcHBlbmRUbygnYm9keScpO1xyXG59XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlID0ge1xyXG4gIGFwcElkOiBudWxsLFxyXG4gIGxhbmc6ICdlbl9VUycsXHJcbiAgcmVzdWx0VHlwZTogJ2pzb24nLCAvLyAncmVkaXJlY3QnXHJcbiAgZmJVcmxCYXNlOiAnLy9jb25uZWN0LmZhY2Vib29rLm5ldC9AKGxhbmcpL2FsbC5qcycsXHJcbiAgc2VydmVyVXJsQmFzZTogTGNVcmwuTGFuZ1BhdGggKyAnQWNjb3VudC9GYWNlYm9vay9AKHVybFNlY3Rpb24pLz9SZWRpcmVjdD1AKHJlZGlyZWN0VXJsKSZwcm9maWxlPUAocHJvZmlsZVVybCknLFxyXG4gIHJlZGlyZWN0VXJsOiAnJyxcclxuICBwcm9maWxlVXJsOiAnJyxcclxuICB1cmxTZWN0aW9uOiAnJyxcclxuICBsb2FkaW5nVGV4dDogJ1ZlcmlmaW5nJyxcclxuICBwZXJtaXNzaW9uczogJycsXHJcbiAgbGliTG9hZGVkRXZlbnQ6ICdGYWNlYm9va0Nvbm5lY3RMaWJMb2FkZWQnLFxyXG4gIGNvbm5lY3RlZEV2ZW50OiAnRmFjZWJvb2tDb25uZWN0Q29ubmVjdGVkJ1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5nZXRGYlVybCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmZiVXJsQmFzZS5yZXBsYWNlKC9AXFwobGFuZ1xcKS9nLCB0aGlzLmxhbmcpO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5nZXRTZXJ2ZXJVcmwgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5zZXJ2ZXJVcmxCYXNlXHJcbiAgLnJlcGxhY2UoL0BcXChyZWRpcmVjdFVybFxcKS9nLCB0aGlzLnJlZGlyZWN0VXJsKVxyXG4gIC5yZXBsYWNlKC9AXFwocHJvZmlsZVVybFxcKS9nLCB0aGlzLnByb2ZpbGVVcmwpXHJcbiAgLnJlcGxhY2UoL0BcXCh1cmxTZWN0aW9uXFwpL2csIHRoaXMudXJsU2VjdGlvbik7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmxvYWRMaWIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgLy8gT25seSBpZiBpcyBub3QgbG9hZGVkIHN0aWxsXHJcbiAgLy8gKEZhY2Vib29rIHNjcmlwdCBhdHRhY2ggaXRzZWxmIGFzIHRoZSBnbG9iYWwgdmFyaWFibGUgJ0ZCJylcclxuICBpZiAoIXdpbmRvdy5GQiAmJiAhdGhpcy5fbG9hZGluZ0xpYikge1xyXG4gICAgdGhpcy5fbG9hZGluZ0xpYiA9IHRydWU7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICBsb2FkZXIubG9hZCh7XHJcbiAgICAgIHNjcmlwdHM6IFt0aGlzLmdldEZiVXJsKCldLFxyXG4gICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIEZCLmluaXQoeyBhcHBJZDogdGhhdC5hcHBJZCwgc3RhdHVzOiB0cnVlLCBjb29raWU6IHRydWUsIHhmYm1sOiB0cnVlIH0pO1xyXG4gICAgICAgIHRoYXQubG9hZGluZ0xpYiA9IGZhbHNlO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIodGhhdC5saWJMb2FkZWRFdmVudCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICEhd2luZG93LkZCO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLnByb2Nlc3NSZXNwb25zZSA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gIGlmIChyZXNwb25zZS5hdXRoUmVzcG9uc2UpIHtcclxuICAgIC8vY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogV2VsY29tZSEnKTtcclxuICAgIHZhciB1cmwgPSB0aGlzLmdldFNlcnZlclVybCgpO1xyXG4gICAgaWYgKHRoaXMucmVzdWx0VHlwZSA9PSBcInJlZGlyZWN0XCIpIHtcclxuICAgICAgcmVkaXJlY3RUbyh1cmwpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLnJlc3VsdFR5cGUgPT0gXCJqc29uXCIpIHtcclxuICAgICAgcG9wdXAodXJsLCAnc21hbGwnLCBudWxsLCB0aGlzLmxvYWRpbmdUZXh0KTtcclxuICAgICAgJChkb2N1bWVudCkudHJpZ2dlcih0aGlzLmNvbm5lY3RlZEV2ZW50KTtcclxuICAgIH1cclxuXHJcbiAgICAvKkZCLmFwaSgnL21lJywgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICBjb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBHb29kIHRvIHNlZSB5b3UsICcgKyByZXNwb25zZS5uYW1lICsgJy4nKTtcclxuICAgIH0pOyovXHJcbiAgfSBlbHNlIHtcclxuICAgIC8vY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogVXNlciBjYW5jZWxsZWQgbG9naW4gb3IgZGlkIG5vdCBmdWxseSBhdXRob3JpemUuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5vbkxpYlJlYWR5ID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgaWYgKHdpbmRvdy5GQilcclxuICAgIGNhbGxiYWNrKCk7XHJcbiAgZWxzZSB7XHJcbiAgICB0aGlzLmxvYWRMaWIoKTtcclxuICAgICQoZG9jdW1lbnQpLm9uKHRoaXMubGliTG9hZGVkRXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIHRoaXMub25MaWJSZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICBGQi5sb2dpbigkLnByb3h5KHRoYXQucHJvY2Vzc1Jlc3BvbnNlLCB0aGF0KSwgeyBzY29wZTogdGhhdC5wZXJtaXNzaW9ucyB9KTtcclxuICB9KTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuYXV0b0Nvbm5lY3RPbiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gIGpRdWVyeShkb2N1bWVudCkub24oJ2NsaWNrJywgc2VsZWN0b3IgfHwgJ2EuZmFjZWJvb2stY29ubmVjdCcsICQucHJveHkodGhpcy5jb25uZWN0LCB0aGlzKSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZhY2Vib29rQ29ubmVjdDsiLCIvKiogSW1wbGVtZW50cyBhIHNpbWlsYXIgTGNVcmwgb2JqZWN0IGxpa2UgdGhlIHNlcnZlci1zaWRlIG9uZSwgYmFzaW5nXHJcbiAgICBpbiB0aGUgaW5mb3JtYXRpb24gYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGF0ICdodG1sJyB0YWcgaW4gdGhlIFxyXG4gICAgJ2RhdGEtYmFzZS11cmwnIGF0dHJpYnV0ZSAodGhhdHMgdmFsdWUgaXMgdGhlIGVxdWl2YWxlbnQgZm9yIEFwcFBhdGgpLFxyXG4gICAgYW5kIHRoZSBsYW5nIGluZm9ybWF0aW9uIGF0ICdkYXRhLWN1bHR1cmUnLlxyXG4gICAgVGhlIHJlc3Qgb2YgVVJMcyBhcmUgYnVpbHQgZm9sbG93aW5nIHRoZSB3aW5kb3cubG9jYXRpb24gYW5kIHNhbWUgcnVsZXNcclxuICAgIHRoYW4gaW4gdGhlIHNlcnZlci1zaWRlIG9iamVjdC5cclxuKiovXHJcblxyXG52YXIgYmFzZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYmFzZS11cmwnKSxcclxuICAgIGxhbmcgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKSxcclxuICAgIGwgPSB3aW5kb3cubG9jYXRpb24sXHJcbiAgICB1cmwgPSBsLnByb3RvY29sICsgJy8vJyArIGwuaG9zdDtcclxuLy8gbG9jYXRpb24uaG9zdCBpbmNsdWRlcyBwb3J0LCBpZiBpcyBub3QgdGhlIGRlZmF1bHQsIHZzIGxvY2F0aW9uLmhvc3RuYW1lXHJcblxyXG5iYXNlID0gYmFzZSB8fCAnLyc7XHJcblxyXG52YXIgTGNVcmwgPSB7XHJcbiAgICBTaXRlVXJsOiB1cmwsXHJcbiAgICBBcHBQYXRoOiBiYXNlLFxyXG4gICAgQXBwVXJsOiB1cmwgKyBiYXNlLFxyXG4gICAgTGFuZ0lkOiBsYW5nLFxyXG4gICAgTGFuZ1BhdGg6IGJhc2UgKyBsYW5nICsgJy8nLFxyXG4gICAgTGFuZ1VybDogdXJsICsgYmFzZSArIGxhbmdcclxufTtcclxuTGNVcmwuTGFuZ1VybCA9IHVybCArIExjVXJsLkxhbmdQYXRoO1xyXG5MY1VybC5Kc29uUGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ0pTT04vJztcclxuTGNVcmwuSnNvblVybCA9IHVybCArIExjVXJsLkpzb25QYXRoO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1VybDsiLCIvKiBMb2Nvbm9taWNzIHNwZWNpZmljIFByaWNlLCBmZWVzIGFuZCBob3VyLXByaWNlIGNhbGN1bGF0aW9uXHJcbiAgICB1c2luZyBzb21lIHN0YXRpYyBtZXRob2RzIGFuZCB0aGUgUHJpY2UgY2xhc3MuXHJcbiovXHJcbnZhciBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG4vKiBDbGFzcyBQcmljZSB0byBjYWxjdWxhdGUgYSB0b3RhbCBwcmljZSBiYXNlZCBvbiBmZWVzIGluZm9ybWF0aW9uIChmaXhlZCBhbmQgcmF0ZSlcclxuICAgIGFuZCBkZXNpcmVkIGRlY2ltYWxzIGZvciBhcHByb3hpbWF0aW9ucy5cclxuKi9cclxuZnVuY3Rpb24gUHJpY2UoYmFzZVByaWNlLCBmZWUsIHJvdW5kZWREZWNpbWFscykge1xyXG4gICAgLy8gZmVlIHBhcmFtZXRlciBjYW4gYmUgYSBmbG9hdCBudW1iZXIgd2l0aCB0aGUgZmVlUmF0ZSBvciBhbiBvYmplY3RcclxuICAgIC8vIHRoYXQgaW5jbHVkZXMgYm90aCBhIGZlZVJhdGUgYW5kIGEgZml4ZWRGZWVBbW91bnRcclxuICAgIC8vIEV4dHJhY3RpbmcgZmVlIHZhbHVlcyBpbnRvIGxvY2FsIHZhcnM6XHJcbiAgICB2YXIgZmVlUmF0ZSA9IDAsIGZpeGVkRmVlQW1vdW50ID0gMDtcclxuICAgIGlmIChmZWUuZml4ZWRGZWVBbW91bnQgfHwgZmVlLmZlZVJhdGUpIHtcclxuICAgICAgICBmaXhlZEZlZUFtb3VudCA9IGZlZS5maXhlZEZlZUFtb3VudCB8fCAwO1xyXG4gICAgICAgIGZlZVJhdGUgPSBmZWUuZmVlUmF0ZSB8fCAwO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgZmVlUmF0ZSA9IGZlZTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGluZzpcclxuICAgIC8vIFRoZSByb3VuZFRvIHdpdGggYSBiaWcgZml4ZWQgZGVjaW1hbHMgaXMgdG8gYXZvaWQgdGhlXHJcbiAgICAvLyBkZWNpbWFsIGVycm9yIG9mIGZsb2F0aW5nIHBvaW50IG51bWJlcnNcclxuICAgIHZhciB0b3RhbFByaWNlID0gbXUuY2VpbFRvKG11LnJvdW5kVG8oYmFzZVByaWNlICogKDEgKyBmZWVSYXRlKSArIGZpeGVkRmVlQW1vdW50LCAxMiksIHJvdW5kZWREZWNpbWFscyk7XHJcbiAgICAvLyBmaW5hbCBmZWUgcHJpY2UgaXMgY2FsY3VsYXRlZCBhcyBhIHN1YnN0cmFjdGlvbiwgYnV0IGJlY2F1c2UgamF2YXNjcmlwdCBoYW5kbGVzXHJcbiAgICAvLyBmbG9hdCBudW1iZXJzIG9ubHksIGEgcm91bmQgb3BlcmF0aW9uIGlzIHJlcXVpcmVkIHRvIGF2b2lkIGFuIGlycmF0aW9uYWwgbnVtYmVyXHJcbiAgICB2YXIgZmVlUHJpY2UgPSBtdS5yb3VuZFRvKHRvdGFsUHJpY2UgLSBiYXNlUHJpY2UsIDIpO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIG9iamVjdCB3aXRoIGZ1bGwgZGV0YWlsczpcclxuICAgIHRoaXMuYmFzZVByaWNlID0gYmFzZVByaWNlO1xyXG4gICAgdGhpcy5mZWVSYXRlID0gZmVlUmF0ZTtcclxuICAgIHRoaXMuZml4ZWRGZWVBbW91bnQgPSBmaXhlZEZlZUFtb3VudDtcclxuICAgIHRoaXMucm91bmRlZERlY2ltYWxzID0gcm91bmRlZERlY2ltYWxzO1xyXG4gICAgdGhpcy50b3RhbFByaWNlID0gdG90YWxQcmljZTtcclxuICAgIHRoaXMuZmVlUHJpY2UgPSBmZWVQcmljZTtcclxufVxyXG5cclxuLyoqIENhbGN1bGF0ZSBhbmQgcmV0dXJucyB0aGUgcHJpY2UgYW5kIHJlbGV2YW50IGRhdGEgYXMgYW4gb2JqZWN0IGZvclxyXG50aW1lLCBob3VybHlSYXRlICh3aXRoIGZlZXMpIGFuZCB0aGUgaG91cmx5RmVlLlxyXG5UaGUgdGltZSAoQGR1cmF0aW9uKSBpcyB1c2VkICdhcyBpcycsIHdpdGhvdXQgdHJhbnNmb3JtYXRpb24sIG1heWJlIHlvdSBjYW4gcmVxdWlyZVxyXG51c2UgTEMucm91bmRUaW1lVG9RdWFydGVySG91ciBiZWZvcmUgcGFzcyB0aGUgZHVyYXRpb24gdG8gdGhpcyBmdW5jdGlvbi5cclxuSXQgcmVjZWl2ZXMgdGhlIHBhcmFtZXRlcnMgQGhvdXJseVByaWNlIGFuZCBAc3VyY2hhcmdlUHJpY2UgYXMgTEMuUHJpY2Ugb2JqZWN0cy5cclxuQHN1cmNoYXJnZVByaWNlIGlzIG9wdGlvbmFsLlxyXG4qKi9cclxuZnVuY3Rpb24gY2FsY3VsYXRlSG91cmx5UHJpY2UoZHVyYXRpb24sIGhvdXJseVByaWNlLCBzdXJjaGFyZ2VQcmljZSkge1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gc3VyY2hhcmdlLCBnZXQgemVyb3NcclxuICAgIHN1cmNoYXJnZVByaWNlID0gc3VyY2hhcmdlUHJpY2UgfHwgeyB0b3RhbFByaWNlOiAwLCBmZWVQcmljZTogMCwgYmFzZVByaWNlOiAwIH07XHJcbiAgICAvLyBHZXQgaG91cnMgZnJvbSByb3VuZGVkIGR1cmF0aW9uOlxyXG4gICAgdmFyIGhvdXJzID0gbXUucm91bmRUbyhkdXJhdGlvbi50b3RhbEhvdXJzKCksIDIpO1xyXG4gICAgLy8gQ2FsY3VsYXRlIGZpbmFsIHByaWNlc1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3RhbFByaWNlOiAgICAgbXUucm91bmRUbyhob3VybHlQcmljZS50b3RhbFByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS50b3RhbFByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIGZlZVByaWNlOiAgICAgICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLmZlZVByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS5mZWVQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAgbXUucm91bmRUbyhob3VybHlQcmljZS5iYXNlUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLmJhc2VQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBkdXJhdGlvbkhvdXJzOiAgaG91cnNcclxuICAgIH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIFByaWNlOiBQcmljZSxcclxuICAgICAgICBjYWxjdWxhdGVIb3VybHlQcmljZTogY2FsY3VsYXRlSG91cmx5UHJpY2VcclxuICAgIH07IiwiLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNTkzNjM3L2hvdy10by1lc2NhcGUtcmVndWxhci1leHByZXNzaW9uLWluLWphdmFzY3JpcHRcclxuUmVnRXhwLnF1b3RlID0gZnVuY3Rpb24gKHN0cikge1xyXG4gIHJldHVybiAoc3RyICsgJycpLnJlcGxhY2UoLyhbLj8qK14kW1xcXVxcXFwoKXt9fC1dKS9nLCBcIlxcXFwkMVwiKTtcclxufTtcclxuIiwiLyoqXHJcbiAgQSB2ZXJ5IHNpbXBsZSBzbGlkZXIgaW1wbGVtZW50YXRpb24gaW5pdGlhbGx5IGNyZWF0ZWRcclxuICBmb3IgdGhlIHByb3ZpZGVyLXdlbGNvbWUgbGFuZGluZyBwYWdlIGFuZFxyXG4gIG90aGVyIHNpbWlsYXIgdXNlcy5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vUmVnRXhwLnF1b3RlJyk7XHJcblxyXG52YXIgU2ltcGxlU2xpZGVyID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBTaW1wbGVTbGlkZXIob3B0cykge1xyXG4gICQuZXh0ZW5kKHRydWUsIHRoaXMsIG9wdHMpO1xyXG5cclxuICB0aGlzLmVsZW1lbnQgPSAkKHRoaXMuZWxlbWVudCk7XHJcbiAgdGhpcy5jdXJyZW50SW5kZXggPSAwO1xyXG5cclxuICAvKipcclxuICBBY3Rpb25zIGhhbmRsZXIgdG8gbW92ZSBzbGlkZXNcclxuICAqKi9cclxuICB2YXIgY2hlY2tIcmVmID0gbmV3IFJlZ0V4cCgnXiMnICsgUmVnRXhwLnF1b3RlKHRoaXMuaHJlZlByZWZpeCkgKyAnKC4qKScpLFxyXG4gICAgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5lbGVtZW50Lm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGhyZWYgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG4gICAgdmFyIHJlcyA9IGNoZWNrSHJlZi5leGVjKGhyZWYpO1xyXG5cclxuICAgIGlmIChyZXMgJiYgcmVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgdmFyIGluZGV4ID0gcmVzWzFdO1xyXG4gICAgICBpZiAoaW5kZXggPT0gJ3ByZXZpb3VzJykge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZSh0aGF0LmN1cnJlbnRJbmRleCAtIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGluZGV4ID09ICduZXh0Jykge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZSh0aGF0LmN1cnJlbnRJbmRleCArIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKC9cXGQrLy50ZXN0KGluZGV4KSkge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZShwYXJzZUludChpbmRleCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogRG8gYWxsIHRoZSBzZXR1cCBvbiBzbGlkZXIgYW5kIHNsaWRlc1xyXG4gIHRvIGVuc3VyZSB0aGUgbW92ZW1lbnQgd2lsbCB3b3JrIGZpbmUuXHJcbiAgSXRzIGRvbmUgYXV0b21hdGljIG9uXHJcbiAgaW5pdGlhbGl6aW5nLCBpcyBqdXN0IGEgcHVibGljIG1ldGhvZCBmb3IgXHJcbiAgY29udmVuaWVuY2UgKG1heWJlIHRvIGJlIGNhbGwgaWYgc2xpZGVzIGFyZVxyXG4gIGFkZGVkL3JlbW92ZWQgYWZ0ZXIgaW5pdCkuXHJcbiAgKiovXHJcbiAgdGhpcy5yZWRyYXcgPSBmdW5jdGlvbiBzbGlkZXNSZXBvc2l0aW9uKCkge1xyXG4gICAgdmFyIHNsaWRlcyA9IHRoaXMuZ2V0U2xpZGVzKCksXHJcbiAgICAgIGMgPSB0aGlzLmdldFNsaWRlc0NvbnRhaW5lcigpO1xyXG4gICAgLy8gTG9vayBmb3IgdGhlIGNvbnRhaW5lciBzaXplLCBmcm9tIHRoZSBcclxuICAgIC8vIGJpZ2dlciBzbGlkZTpcclxuICAgIHZhciBcclxuICAgICAgdyA9IDAsXHJcbiAgICAgIGggPSAwO1xyXG4gICAgc2xpZGVzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgXHJcbiAgICAgICAgdCA9ICQodGhpcyksXHJcbiAgICAgICAgdHcgPSB0Lm91dGVyV2lkdGgoKSxcclxuICAgICAgICB0aCA9IHQub3V0ZXJIZWlnaHQoKTtcclxuICAgICAgaWYgKHR3ID4gdylcclxuICAgICAgICB3ID0gdHc7XHJcbiAgICAgIGlmICh0aCA+IGgpXHJcbiAgICAgICAgaCA9IHRoO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ1NTIHNldHVwLCBcclxuICAgIC8vIGFsbCBzbGlkZXMgaW4gdGhlIHNhbWUgbGluZSxcclxuICAgIC8vIGFsbCB3aXRoIHNhbWUgc2l6ZSAoZXh0cmEgc3BhY2luZyBjYW5cclxuICAgIC8vIGJlIGdpdmVuIHdpdGggQ1NTKVxyXG4gICAgYy5jc3Moe1xyXG4gICAgICB3aWR0aDogdyAtIChjLm91dGVyV2lkdGgoKSAtIGMud2lkdGgoKSksXHJcbiAgICAgIC8vaGVpZ2h0OiBoIC0gKGMub3V0ZXJIZWlnaHQoKSAtIGMuaGVpZ2h0KCkpLFxyXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxyXG4gICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgc2xpZGVzLmNzcyh7XHJcbiAgICAgIHdoaXRlU3BhY2U6ICdub3JtYWwnLFxyXG4gICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ1xyXG4gICAgfSkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgdC5jc3Moe1xyXG4gICAgICAgIHdpZHRoOiB3IC0gKHQub3V0ZXJXaWR0aCgpIC0gdC53aWR0aCgpKVxyXG4gICAgICAgIC8vLGhlaWdodDogaCAtICh0Lm91dGVySGVpZ2h0KCkgLSB0LmhlaWdodCgpKVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlcG9zaXRpb25hdGUgYXQgdGhlIGJlZ2dpbmluZzpcclxuICAgIGNbMF0uc2Nyb2xsTGVmdCA9IDA7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR28gdG8gYSBzbGlkZSBieSBpbmRleFxyXG4gICoqL1xyXG4gIHRoaXMuZ29TbGlkZSA9IGZ1bmN0aW9uIGdvU2xpZGUoaW5kZXgpIHtcclxuICAgIHZhciBwcmV2ID0gdGhpcy5jdXJyZW50SW5kZXg7XHJcbiAgICBpZiAocHJldiA9PSBpbmRleClcclxuICAgICAgcmV0dXJuO1xyXG5cclxuICAgIC8vIENoZWNrIGJvdW5kc1xyXG4gICAgaWYgKGluZGV4IDwgMSlcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgdmFyIHNsaWRlcyA9IHRoaXMuZ2V0U2xpZGVzKCk7XHJcbiAgICBpZiAoaW5kZXggPiBzbGlkZXMubGVuZ3RoKVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgLy8gR29vZCBpbmRleCwgc2V0IGFzIGN1cnJlbnRcclxuICAgIHRoaXMuY3VycmVudEluZGV4ID0gaW5kZXg7XHJcbiAgICAvLyBTZXQgbGlua3MgdG8gdGhpcyBhcyBjdXJyZW50LCByZW1vdmluZyBhbnkgcHJldmlvdXM6XHJcbiAgICB0aGlzLmVsZW1lbnQuZmluZCgnW2hyZWY9IycgKyB0aGlzLmhyZWZQcmVmaXggKyBpbmRleCArICddJylcclxuICAgIC5hZGRDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKVxyXG4gICAgLnBhcmVudCgnbGknKS5hZGRDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKTtcclxuICAgIHRoaXMuZWxlbWVudC5maW5kKCdbaHJlZj0jJyArIHRoaXMuaHJlZlByZWZpeCArIHByZXYgKyAnXScpXHJcbiAgICAucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcylcclxuICAgIC5wYXJlbnQoJ2xpJykucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcyk7XHJcblxyXG4gICAgdmFyIFxyXG4gICAgICBzbGlkZSA9ICQoc2xpZGVzLmdldChpbmRleCAtIDEpKSxcclxuICAgICAgYyA9IHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyKCksXHJcbiAgICAgIGxlZnQgPSBjLnNjcm9sbExlZnQoKSArIHNsaWRlLnBvc2l0aW9uKCkubGVmdDtcclxuXHJcbiAgICBjLnN0b3AoKS5hbmltYXRlKHsgc2Nyb2xsTGVmdDogbGVmdCB9LCB0aGlzLmR1cmF0aW9uKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHZXQgdGhlIGpRdWVyeSBjb2xsZWN0aW9uIG9mIHNsaWRlc1xyXG4gICoqL1xyXG4gIHRoaXMuZ2V0U2xpZGVzID0gZnVuY3Rpb24gZ2V0U2xpZGVzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGVzKVxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGUpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR2V0IHRoZSBqUXVlcnkgZWxlbWVudCBmb3IgdGhlIGNvbnRhaW5lciBvZiBzbGlkZXNcclxuICAqKi9cclxuICB0aGlzLmdldFNsaWRlc0NvbnRhaW5lciA9IGZ1bmN0aW9uIGdldFNsaWRlc0NvbnRhaW5lcigpIHtcclxuICAgIHJldHVybiB0aGlzLmVsZW1lbnRcclxuICAgIC5maW5kKHRoaXMuc2VsZWN0b3JzLnNsaWRlcyk7XHJcbiAgfTtcclxuXHJcbiAgLyoqIExhc3QgaW5pdCBzdGVwc1xyXG4gICoqL1xyXG4gIHRoaXMucmVkcmF3KCk7XHJcbn07XHJcblxyXG5TaW1wbGVTbGlkZXIucHJvdG90eXBlID0ge1xyXG4gIGVsZW1lbnQ6IG51bGwsXHJcbiAgc2VsZWN0b3JzOiB7XHJcbiAgICBzbGlkZXM6ICcuc2xpZGVzJyxcclxuICAgIHNsaWRlOiAnbGkuc2xpZGUnXHJcbiAgfSxcclxuICBjdXJyZW50U2xpZGVDbGFzczogJ2pzLWlzQ3VycmVudCcsXHJcbiAgaHJlZlByZWZpeDogJ2dvU2xpZGVfJyxcclxuICAvLyBEdXJhdGlvbiBvZiBlYWNoIHNsaWRlIGluIG1pbGxpc2Vjb25kc1xyXG4gIGR1cmF0aW9uOiAxMDAwXHJcbn07IiwiLyoqIFBvbHlmaWxsIGZvciBzdHJpbmcuY29udGFpbnNcclxuKiovXHJcbmlmICghKCdjb250YWlucycgaW4gU3RyaW5nLnByb3RvdHlwZSkpXHJcbiAgICBTdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKHN0ciwgc3RhcnRJbmRleCkgeyByZXR1cm4gLTEgIT09IHRoaXMuaW5kZXhPZihzdHIsIHN0YXJ0SW5kZXgpOyB9OyIsIi8qKiA9PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIEEgc2ltcGxlIFN0cmluZyBGb3JtYXRcclxuICogZnVuY3Rpb24gZm9yIGphdmFzY3JpcHRcclxuICogQXV0aG9yOiBJYWdvIExvcmVuem8gU2FsZ3VlaXJvXHJcbiAqIE1vZHVsZTogQ29tbW9uSlNcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaW5nRm9ybWF0KCkge1xyXG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG5cdHZhciBmb3JtYXR0ZWQgPSBhcmdzWzBdO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7JytpKydcXFxcfScsICdnaScpO1xyXG5cdFx0Zm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UocmVnZXhwLCBhcmdzW2krMV0pO1xyXG5cdH1cclxuXHRyZXR1cm4gZm9ybWF0dGVkO1xyXG59OyIsIi8qKlxyXG4gICAgR2VuZXJhbCBhdXRvLWxvYWQgc3VwcG9ydCBmb3IgdGFiczogXHJcbiAgICBJZiB0aGVyZSBpcyBubyBjb250ZW50IHdoZW4gZm9jdXNlZCwgdGhleSB1c2UgdGhlICdyZWxvYWQnIGpxdWVyeSBwbHVnaW5cclxuICAgIHRvIGxvYWQgaXRzIGNvbnRlbnQgLXRhYnMgbmVlZCB0byBiZSBjb25maWd1cmVkIHdpdGggZGF0YS1zb3VyY2UtdXJsIGF0dHJpYnV0ZVxyXG4gICAgaW4gb3JkZXIgdG8ga25vdyB3aGVyZSB0byBmZXRjaCB0aGUgY29udGVudC0uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5yZWxvYWQnKTtcclxuXHJcbi8vIERlcGVuZGVuY3kgVGFiYmVkVVggZnJvbSBESVxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoVGFiYmVkVVgpIHtcclxuICAgIC8vIFRhYmJlZFVYLnNldHVwLnRhYkJvZHlTZWxlY3RvciB8fCAnLnRhYi1ib2R5J1xyXG4gICAgJCgnLnRhYi1ib2R5Jykub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoJHQuY2hpbGRyZW4oKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICR0LnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBUaGlzIGFkZHMgbm90aWZpY2F0aW9ucyB0byB0YWJzIGZyb20gdGhlIFRhYmJlZFVYIHN5c3RlbSB1c2luZ1xyXG4gICAgdGhlIGNoYW5nZXNOb3RpZmljYXRpb24gdXRpbGl0eSB0aGF0IGRldGVjdHMgbm90IHNhdmVkIGNoYW5nZXMgb24gZm9ybXMsXHJcbiAgICBzaG93aW5nIHdhcm5pbmcgbWVzc2FnZXMgdG8gdGhlXHJcbiAgICB1c2VyIGFuZCBtYXJraW5nIHRhYnMgKGFuZCBzdWItdGFicyAvIHBhcmVudC10YWJzIHByb3Blcmx5KSB0b1xyXG4gICAgZG9uJ3QgbG9zdCBjaGFuZ2VzIG1hZGUuXHJcbiAgICBBIGJpdCBvZiBDU1MgZm9yIHRoZSBhc3NpZ25lZCBjbGFzc2VzIHdpbGwgYWxsb3cgZm9yIHZpc3VhbCBtYXJrcy5cclxuXHJcbiAgICBBS0E6IERvbid0IGxvc3QgZGF0YSEgd2FybmluZyBtZXNzYWdlIDstKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxuLy8gVGFiYmVkVVggZGVwZW5kZW5jeSBhcyBESVxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoVGFiYmVkVVgsIHRhcmdldFNlbGVjdG9yKSB7XHJcbiAgICB2YXIgdGFyZ2V0ID0gJCh0YXJnZXRTZWxlY3RvciB8fCAnLmNoYW5nZXMtbm90aWZpY2F0aW9uLWVuYWJsZWQnKTtcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24uaW5pdCh7IHRhcmdldDogdGFyZ2V0IH0pO1xyXG5cclxuICAgIC8vIEFkZGluZyBjaGFuZ2Ugbm90aWZpY2F0aW9uIHRvIHRhYi1ib2R5IGRpdnNcclxuICAgIC8vIChvdXRzaWRlIHRoZSBMQy5DaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzIHRvIGxlYXZlIGl0IGFzIGdlbmVyaWMgYW5kIHNpbXBsZSBhcyBwb3NzaWJsZSlcclxuICAgICQodGFyZ2V0KS5vbignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsICdmb3JtJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQodGhpcykucGFyZW50cygnLnRhYi1ib2R5JykuYWRkQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkaW5nIGNsYXNzIHRvIHRoZSBtZW51IGl0ZW0gKHRhYiB0aXRsZSlcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0uYWRkQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCd0aXRsZScsICQoJyNsY3Jlcy1jaGFuZ2VzLW5vdC1zYXZlZCcpLnRleHQoKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5vbignbGNDaGFuZ2VzTm90aWZpY2F0aW9uU2F2ZVJlZ2lzdGVyZWQnLCAnZm9ybScsIGZ1bmN0aW9uIChlLCBmLCBlbHMsIGZ1bGwpIHtcclxuICAgICAgICBpZiAoZnVsbClcclxuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcudGFiLWJvZHk6bm90KDpoYXMoZm9ybS5oYXMtY2hhbmdlcykpJykucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZpbmcgY2xhc3MgZnJvbSB0aGUgbWVudSBpdGVtICh0YWIgdGl0bGUpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC8vIFRvIGF2b2lkIHVzZXIgYmUgbm90aWZpZWQgb2YgY2hhbmdlcyBhbGwgdGltZSB3aXRoIHRhYiBtYXJrcywgd2UgYWRkZWQgYSAnbm90aWZ5JyBjbGFzc1xyXG4gICAgLy8gb24gdGFicyB3aGVuIGEgY2hhbmdlIG9mIHRhYiBoYXBwZW5zXHJcbiAgICAuZmluZCgnLnRhYi1ib2R5Jykub24oJ3RhYlVuZm9jdXNlZCcsIGZ1bmN0aW9uIChldmVudCwgZm9jdXNlZEN0eCkge1xyXG4gICAgICAgIHZhciBtaSA9IFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW07XHJcbiAgICAgICAgaWYgKG1pLmlzKCcuaGFzLWNoYW5nZXMnKSkge1xyXG4gICAgICAgICAgICBtaS5hZGRDbGFzcygnbm90aWZ5LWNoYW5nZXMnKTsgLy9oYXMtdG9vbHRpcFxyXG4gICAgICAgICAgICAvLyBTaG93IG5vdGlmaWNhdGlvbiBwb3B1cFxyXG4gICAgICAgICAgICB2YXIgZCA9ICQoJzxkaXYgY2xhc3M9XCJ3YXJuaW5nXCI+QDA8L2Rpdj48ZGl2IGNsYXNzPVwiYWN0aW9uc1wiPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJhY3Rpb24gY29udGludWVcIiB2YWx1ZT1cIkAyXCIvPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJhY3Rpb24gc3RvcFwiIHZhbHVlPVwiQDFcIi8+PC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AwL2csIExDLmdldFRleHQoJ2NoYW5nZXMtbm90LXNhdmVkJykpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDEvZywgTEMuZ2V0VGV4dCgndGFiLWhhcy1jaGFuZ2VzLXN0YXktb24nKSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMi9nLCBMQy5nZXRUZXh0KCd0YWItaGFzLWNoYW5nZXMtY29udGludWUtd2l0aG91dC1jaGFuZ2UnKSkpO1xyXG4gICAgICAgICAgICBkLm9uKCdjbGljaycsICcuc3RvcCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHdpbmRvdyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbignY2xpY2snLCAnLmNvbnRpbnVlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2Uod2luZG93KTtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSAnaGFzLWNoYW5nZXMnIHRvIGF2b2lkIGZ1dHVyZSBibG9ja3MgKHVudGlsIG5ldyBjaGFuZ2VzIGhhcHBlbnMgb2YgY291cnNlIDstKVxyXG4gICAgICAgICAgICAgICAgbWkucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJyk7XHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYihmb2N1c2VkQ3R4LnRhYi5nZXQoMCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihkLCB3aW5kb3csICdub3Qtc2F2ZWQtcG9wdXAnLCB7IGNsb3NhYmxlOiBmYWxzZSwgY2VudGVyOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRXZlciByZXR1cm4gZmFsc2UgdG8gc3RvcCBjdXJyZW50IHRhYiBmb2N1c1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdub3RpZnktY2hhbmdlcycpOyAvL2hhcy10b29sdGlwXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIFRhYmJlZFVYOiBUYWJiZWQgaW50ZXJmYWNlIGxvZ2ljOyB3aXRoIG1pbmltYWwgSFRNTCB1c2luZyBjbGFzcyAndGFiYmVkJyBmb3IgdGhlXHJcbmNvbnRhaW5lciwgdGhlIG9iamVjdCBwcm92aWRlcyB0aGUgZnVsbCBBUEkgdG8gbWFuaXB1bGF0ZSB0YWJzIGFuZCBpdHMgc2V0dXBcclxubGlzdGVuZXJzIHRvIHBlcmZvcm0gbG9naWMgb24gdXNlciBpbnRlcmFjdGlvbi5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5oYXNTY3JvbGxCYXInKTtcclxuXHJcbnZhciBUYWJiZWRVWCA9IHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKCdib2R5JykuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicyA+IGxpOm5vdCgudGFicy1zbGlkZXIpID4gYScsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGlmIChUYWJiZWRVWC5mb2N1c1RhYigkdC5hdHRyKCdocmVmJykpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3QgPSAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhhc2ggPSAkdC5hdHRyKCdocmVmJyk7XHJcbiAgICAgICAgICAgICAgICAkKCdodG1sLGJvZHknKS5zY3JvbGxUb3Aoc3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnbW91c2Vkb3duJywgVGFiYmVkVVguc3RhcnRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ21vdXNldXAgbW91c2VsZWF2ZScsIFRhYmJlZFVYLmVuZE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC8vIHRoZSBjbGljayByZXR1cm4gZmFsc2UgaXMgdG8gZGlzYWJsZSBzdGFuZGFyIHVybCBiZWhhdmlvclxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXItbGltaXQnLCAnbW91c2VlbnRlcicsIFRhYmJlZFVYLnN0YXJ0TW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyLWxpbWl0JywgJ21vdXNlbGVhdmUnLCBUYWJiZWRVWC5lbmRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicyA+IGxpLnJlbW92YWJsZScsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIC8vIE9ubHkgb24gZGlyZWN0IGNsaWNrcyB0byB0aGUgdGFiLCB0byBhdm9pZFxyXG4gICAgICAgICAgICAvLyBjbGlja3MgdG8gdGhlIHRhYi1saW5rICh0aGF0IHNlbGVjdC9mb2N1cyB0aGUgdGFiKTpcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0ID09IGUuY3VycmVudFRhcmdldClcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLnJlbW92ZVRhYihudWxsLCB0aGlzKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gSW5pdCBwYWdlIGxvYWRlZCB0YWJiZWQgY29udGFpbmVyczpcclxuICAgICAgICAkKCcudGFiYmVkJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIC8vIENvbnNpc3RlbmNlIGNoZWNrOiB0aGlzIG11c3QgYmUgYSB2YWxpZCBjb250YWluZXIsIHRoaXMgaXMsIG11c3QgaGF2ZSAudGFic1xyXG4gICAgICAgICAgICBpZiAoJHQuY2hpbGRyZW4oJy50YWJzJykubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAvLyBJbml0IHNsaWRlclxyXG4gICAgICAgICAgICBUYWJiZWRVWC5zZXR1cFNsaWRlcigkdCk7XHJcbiAgICAgICAgICAgIC8vIENsZWFuIHdoaXRlIHNwYWNlcyAodGhleSBjcmVhdGUgZXhjZXNpdmUgc2VwYXJhdGlvbiBiZXR3ZWVuIHNvbWUgdGFicylcclxuICAgICAgICAgICAgJCgnLnRhYnMnLCB0aGlzKS5jb250ZW50cygpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhIHRleHQgbm9kZSwgcmVtb3ZlIGl0OlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9kZVR5cGUgPT0gMylcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBtb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgZGlyID0gJHQuaGFzQ2xhc3MoJ3RhYnMtc2xpZGVyLXJpZ2h0JykgPyAxIDogLTE7XHJcbiAgICAgICAgdmFyIHRhYnNTbGlkZXIgPSAkdC5wYXJlbnQoKTtcclxuICAgICAgICB2YXIgdGFicyA9IHRhYnNTbGlkZXIuc2libGluZ3MoJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgdGFic1swXS5zY3JvbGxMZWZ0ICs9IDIwICogZGlyO1xyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYnNTbGlkZXIucGFyZW50KCksIHRhYnMpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBzdGFydE1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciB0YWJzID0gdC5jbG9zZXN0KCcudGFiYmVkJykuY2hpbGRyZW4oJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgLy8gU3RvcCBwcmV2aW91cyBhbmltYXRpb25zOlxyXG4gICAgICAgIHRhYnMuc3RvcCh0cnVlKTtcclxuICAgICAgICB2YXIgc3BlZWQgPSAwLjM7IC8qIHNwZWVkIHVuaXQ6IHBpeGVscy9taWxpc2Vjb25kcyAqL1xyXG4gICAgICAgIHZhciBmeGEgPSBmdW5jdGlvbiAoKSB7IFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYnMucGFyZW50KCksIHRhYnMpOyB9O1xyXG4gICAgICAgIHZhciB0aW1lO1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdyaWdodCcpKSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIGJhc2VkIG9uIHNwZWVkIHdlIHdhbnQgYW5kIGhvdyBtYW55IGRpc3RhbmNlIHRoZXJlIGlzOlxyXG4gICAgICAgICAgICB0aW1lID0gKHRhYnNbMF0uc2Nyb2xsV2lkdGggLSB0YWJzWzBdLnNjcm9sbExlZnQgLSB0YWJzLndpZHRoKCkpICogMSAvIHNwZWVkO1xyXG4gICAgICAgICAgICB0YWJzLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiB0YWJzWzBdLnNjcm9sbFdpZHRoIC0gdGFicy53aWR0aCgpIH0sXHJcbiAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIHN0ZXA6IGZ4YSwgY29tcGxldGU6IGZ4YSwgZWFzaW5nOiAnc3dpbmcnIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIGJhc2VkIG9uIHNwZWVkIHdlIHdhbnQgYW5kIGhvdyBtYW55IGRpc3RhbmNlIHRoZXJlIGlzOlxyXG4gICAgICAgICAgICB0aW1lID0gdGFic1swXS5zY3JvbGxMZWZ0ICogMSAvIHNwZWVkO1xyXG4gICAgICAgICAgICB0YWJzLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiAwIH0sXHJcbiAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIHN0ZXA6IGZ4YSwgY29tcGxldGU6IGZ4YSwgZWFzaW5nOiAnc3dpbmcnIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgZW5kTW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGFiQ29udGFpbmVyID0gJCh0aGlzKS5jbG9zZXN0KCcudGFiYmVkJyk7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpLnN0b3AodHJ1ZSk7XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFiQ29udGFpbmVyKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgY2hlY2tUYWJTbGlkZXJMaW1pdHM6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIHRhYnMpIHtcclxuICAgICAgICB0YWJzID0gdGFicyB8fCB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgLy8gU2V0IHZpc2liaWxpdHkgb2YgdmlzdWFsIGxpbWl0ZXJzOlxyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyLWxpbWl0LWxlZnQnKS50b2dnbGUodGFic1swXS5zY3JvbGxMZWZ0ID4gMCk7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXItbGltaXQtcmlnaHQnKS50b2dnbGUoXHJcbiAgICAgICAgICAgICh0YWJzWzBdLnNjcm9sbExlZnQgKyB0YWJzLndpZHRoKCkpIDwgdGFic1swXS5zY3JvbGxXaWR0aCk7XHJcbiAgICB9LFxyXG4gICAgc2V0dXBTbGlkZXI6IGZ1bmN0aW9uICh0YWJDb250YWluZXIpIHtcclxuICAgICAgICB2YXIgdHMgPSB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlcicpO1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzJykuaGFzU2Nyb2xsQmFyKHsgeDogLTIgfSkuaG9yaXpvbnRhbCkge1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuYWRkQ2xhc3MoJ2hhcy10YWJzLXNsaWRlcicpO1xyXG4gICAgICAgICAgICBpZiAodHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgdHMuY2xhc3NOYW1lID0gJ3RhYnMtc2xpZGVyJztcclxuICAgICAgICAgICAgICAgICQodHMpXHJcbiAgICAgICAgICAgICAgICAvLyBBcnJvd3M6XHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJ0YWJzLXNsaWRlci1sZWZ0IGxlZnRcIiBocmVmPVwiI1wiPiZsdDsmbHQ7PC9hPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJ0YWJzLXNsaWRlci1yaWdodCByaWdodFwiIGhyZWY9XCIjXCI+Jmd0OyZndDs8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXIuYXBwZW5kKHRzKTtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lclxyXG4gICAgICAgICAgICAgICAgLy8gRGVzaW5nIGRldGFpbHM6XHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGRpdiBjbGFzcz1cInRhYnMtc2xpZGVyLWxpbWl0IHRhYnMtc2xpZGVyLWxpbWl0LWxlZnQgbGVmdFwiIGhyZWY9XCIjXCI+PC9kaXY+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGFicy1zbGlkZXItbGltaXQgdGFicy1zbGlkZXItbGltaXQtcmlnaHQgcmlnaHRcIiBocmVmPVwiI1wiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHMuc2hvdygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLnJlbW92ZUNsYXNzKCdoYXMtdGFicy1zbGlkZXInKTtcclxuICAgICAgICAgICAgdHMuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJDb250YWluZXIpO1xyXG4gICAgfSxcclxuICAgIGdldFRhYkNvbnRleHRCeUFyZ3M6IGZ1bmN0aW9uIChhcmdzKSB7XHJcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgdHlwZW9mIChhcmdzWzBdKSA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFiQ29udGV4dChhcmdzWzBdLCBudWxsKTtcclxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJiBhcmdzWzBdLnRhYilcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMF07XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUYWJDb250ZXh0KFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAwID8gYXJnc1swXSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDEgPyBhcmdzWzFdIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMiA/IGFyZ3NbMl0gOiBudWxsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiQ29udGV4dDogZnVuY3Rpb24gKHRhYk9yU2VsZWN0b3IsIG1lbnVpdGVtT3JTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBtaSwgbWEsIHRhYiwgdGFiQ29udGFpbmVyO1xyXG4gICAgICAgIGlmICh0YWJPclNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRhYiA9ICQodGFiT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmICh0YWIubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lciA9IHRhYi5wYXJlbnRzKCcudGFiYmVkOmVxKDApJyk7XHJcbiAgICAgICAgICAgICAgICBtYSA9IHRhYkNvbnRhaW5lci5maW5kKCc+IC50YWJzID4gbGkgPiBhW2hyZWY9IycgKyB0YWIuZ2V0KDApLmlkICsgJ10nKTtcclxuICAgICAgICAgICAgICAgIG1pID0gbWEucGFyZW50KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKG1lbnVpdGVtT3JTZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBtYSA9ICQobWVudWl0ZW1PclNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKG1hLmlzKCdsaScpKSB7XHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hO1xyXG4gICAgICAgICAgICAgICAgbWEgPSBtaS5jaGlsZHJlbignYTplcSgwKScpO1xyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgIG1pID0gbWEucGFyZW50KCk7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lciA9IG1pLmNsb3Nlc3QoJy50YWJiZWQnKTtcclxuICAgICAgICAgICAgdGFiID0gdGFiQ29udGFpbmVyLmZpbmQoJz4udGFiLWJvZHlAMCwgPi50YWItYm9keS1saXN0Pi50YWItYm9keUAwJy5yZXBsYWNlKC9AMC9nLCBtYS5hdHRyKCdocmVmJykpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgdGFiOiB0YWIsIG1lbnVhbmNob3I6IG1hLCBtZW51aXRlbTogbWksIHRhYkNvbnRhaW5lcjogdGFiQ29udGFpbmVyIH07XHJcbiAgICB9LFxyXG4gICAgY2hlY2tUYWJDb250ZXh0OiBmdW5jdGlvbiAoY3R4LCBmdW5jdGlvbm5hbWUsIGFyZ3MsIGlzVGVzdCkge1xyXG4gICAgICAgIGlmICghY3R4LnRhYiB8fCBjdHgudGFiLmxlbmd0aCAhPSAxIHx8XHJcbiAgICAgICAgICAgICFjdHgubWVudWl0ZW0gfHwgY3R4Lm1lbnVpdGVtLmxlbmd0aCAhPSAxIHx8XHJcbiAgICAgICAgICAgICFjdHgudGFiQ29udGFpbmVyIHx8IGN0eC50YWJDb250YWluZXIubGVuZ3RoICE9IDEgfHwgXHJcbiAgICAgICAgICAgICFjdHgubWVudWFuY2hvciB8fCBjdHgubWVudWFuY2hvci5sZW5ndGggIT0gMSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzVGVzdCAmJiBjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdUYWJiZWRVWC4nICsgZnVuY3Rpb25uYW1lICsgJywgYmFkIGFyZ3VtZW50czogJyArIEFycmF5LmpvaW4oYXJncywgJywgJykpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGdldFRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2ZvY3VzVGFiJywgYXJndW1lbnRzLCB0cnVlKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgcmV0dXJuIGN0eC50YWIuZ2V0KDApO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZm9jdXNUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIEdldCBwcmV2aW91cyBmb2N1c2VkIHRhYiwgdHJpZ2dlciAndGFiVW5mb2N1c2VkJyBoYW5kbGVyIHRoYXQgY2FuXHJcbiAgICAgICAgLy8gc3RvcCB0aGlzIGZvY3VzIChyZXR1cm5pbmcgZXhwbGljaXR5ICdmYWxzZScpXHJcbiAgICAgICAgdmFyIHByZXZUYWIgPSBjdHgudGFiLnNpYmxpbmdzKCcuY3VycmVudCcpO1xyXG4gICAgICAgIGlmIChwcmV2VGFiLnRyaWdnZXJIYW5kbGVyKCd0YWJVbmZvY3VzZWQnLCBbY3R4XSkgPT09IGZhbHNlKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIENoZWNrIChmaXJzdCEpIGlmIHRoZXJlIGlzIGEgcGFyZW50IHRhYiBhbmQgZm9jdXMgaXQgdG9vICh3aWxsIGJlIHJlY3Vyc2l2ZSBjYWxsaW5nIHRoaXMgc2FtZSBmdW5jdGlvbilcclxuICAgICAgICB2YXIgcGFyVGFiID0gY3R4LnRhYi5wYXJlbnRzKCcudGFiLWJvZHk6ZXEoMCknKTtcclxuICAgICAgICBpZiAocGFyVGFiLmxlbmd0aCA9PSAxKSB0aGlzLmZvY3VzVGFiKHBhclRhYik7XHJcblxyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2N1cnJlbnQnKSB8fFxyXG4gICAgICAgICAgICBjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2Rpc2FibGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gVW5zZXQgY3VycmVudCBtZW51IGVsZW1lbnRcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2libGluZ3MoJy5jdXJyZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAuZmluZCgnPmEnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIC8vIFNldCBjdXJyZW50IG1lbnUgZWxlbWVudFxyXG4gICAgICAgIGN0eC5tZW51aXRlbS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIGN0eC5tZW51YW5jaG9yLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcblxyXG4gICAgICAgIC8vIEhpZGUgY3VycmVudCB0YWItYm9keVxyXG4gICAgICAgIHByZXZUYWIucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAvLyBTaG93IGN1cnJlbnQgdGFiLWJvZHkgYW5kIHRyaWdnZXIgZXZlbnRcclxuICAgICAgICBjdHgudGFiLmFkZENsYXNzKCdjdXJyZW50JylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJGb2N1c2VkJyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVGFiSW5kZXg6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIHRhYkluZGV4KSB7XHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lcilcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9jdXNUYWIodGhpcy5nZXRUYWJDb250ZXh0KHRhYkNvbnRhaW5lci5maW5kKCc+LnRhYi1ib2R5OmVxKCcgKyB0YWJJbmRleCArICcpJykpKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgLyogRW5hYmxlIGEgdGFiLCBkaXNhYmxpbmcgYWxsIG90aGVycyB0YWJzIC11c2VmdWxsIGluIHdpemFyZCBzdHlsZSBwYWdlcy0gKi9cclxuICAgIGVuYWJsZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2VuYWJsZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICB2YXIgcnRuID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5pcygnLmRpc2FibGVkJykpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGRpc2FibGVkIGNsYXNzIGZyb20gZm9jdXNlZCB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgICAgICBjdHgudGFiLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRW5hYmxlZCcpO1xyXG4gICAgICAgICAgICBjdHgubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgICAgIHJ0biA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEZvY3VzIHRhYjpcclxuICAgICAgICB0aGlzLmZvY3VzVGFiKGN0eCk7XHJcbiAgICAgICAgLy8gRGlzYWJsZWQgdGFicyBhbmQgbWVudSBpdGVtczpcclxuICAgICAgICBjdHgudGFiLnNpYmxpbmdzKCc6bm90KC5kaXNhYmxlZCknKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2Rpc2FibGVkJylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJEaXNhYmxlZCcpO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaWJsaW5ncygnOm5vdCguZGlzYWJsZWQpJylcclxuICAgICAgICAgICAgLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgICAgIHJldHVybiBydG47XHJcbiAgICB9LFxyXG4gICAgc2hvd2hpZGVEdXJhdGlvbjogMCxcclxuICAgIHNob3doaWRlRWFzaW5nOiBudWxsLFxyXG4gICAgc2hvd1RhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3Nob3dUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2hvdyB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgIGN0eC50YWIuc2hvdyh0aGlzLnNob3doaWRlRHVyYXRpb24pO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaG93KHRoaXMuc2hvd2hpZGVFYXNpbmcpO1xyXG4gICAgfSxcclxuICAgIGhpZGVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdoaWRlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNob3cgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICBjdHgudGFiLmhpZGUodGhpcy5zaG93aGlkZUR1cmF0aW9uKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uaGlkZSh0aGlzLnNob3doaWRlRWFzaW5nKTtcclxuICAgIH0sXHJcbiAgICB0YWJCb2R5Q2xhc3NFeGNlcHRpb25zOiB7ICd0YWItYm9keSc6IDAsICd0YWJiZWQnOiAwLCAnY3VycmVudCc6IDAsICdkaXNhYmxlZCc6IDAgfSxcclxuICAgIGNyZWF0ZVRhYjogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgaWROYW1lLCBsYWJlbCkge1xyXG4gICAgICAgIHRhYkNvbnRhaW5lciA9ICQodGFiQ29udGFpbmVyKTtcclxuICAgICAgICAvLyB0YWJDb250YWluZXIgbXVzdCBiZSBvbmx5IG9uZSBhbmQgdmFsaWQgY29udGFpbmVyXHJcbiAgICAgICAgLy8gYW5kIGlkTmFtZSBtdXN0IG5vdCBleGlzdHNcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyLmxlbmd0aCA9PSAxICYmIHRhYkNvbnRhaW5lci5pcygnLnRhYmJlZCcpICYmXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkTmFtZSkgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIHRhYiBkaXY6XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgdGFiLmlkID0gaWROYW1lO1xyXG4gICAgICAgICAgICAvLyBSZXF1aXJlZCBjbGFzc2VzXHJcbiAgICAgICAgICAgIHRhYi5jbGFzc05hbWUgPSBcInRhYi1ib2R5XCI7XHJcbiAgICAgICAgICAgIHZhciAkdGFiID0gJCh0YWIpO1xyXG4gICAgICAgICAgICAvLyBHZXQgYW4gZXhpc3Rpbmcgc2libGluZyBhbmQgY29weSAod2l0aCBzb21lIGV4Y2VwdGlvbnMpIHRoZWlyIGNzcyBjbGFzc2VzXHJcbiAgICAgICAgICAgICQuZWFjaCh0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWItYm9keTplcSgwKScpLmF0dHIoJ2NsYXNzJykuc3BsaXQoL1xccysvKSwgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAgICAgICAgIGlmICghKHYgaW4gVGFiYmVkVVgudGFiQm9keUNsYXNzRXhjZXB0aW9ucykpXHJcbiAgICAgICAgICAgICAgICAgICAgJHRhYi5hZGRDbGFzcyh2KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIEFkZCB0byBjb250YWluZXJcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFwcGVuZCh0YWIpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1lbnUgZW50cnlcclxuICAgICAgICAgICAgdmFyIG1lbnVpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgICAgICAgICAgLy8gQmVjYXVzZSBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdGFiLCBpcyBhIGR5bmFtaWNhbGx5IHJlbW92YWJsZSB0YWI6XHJcbiAgICAgICAgICAgIG1lbnVpdGVtLmNsYXNzTmFtZSA9IFwicmVtb3ZhYmxlXCI7XHJcbiAgICAgICAgICAgIHZhciBtZW51YW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgICAgICBtZW51YW5jaG9yLnNldEF0dHJpYnV0ZSgnaHJlZicsICcjJyArIGlkTmFtZSk7XHJcbiAgICAgICAgICAgIC8vIGxhYmVsIGNhbm5vdCBiZSBudWxsIG9yIGVtcHR5XHJcbiAgICAgICAgICAgICQobWVudWFuY2hvcikudGV4dChpc0VtcHR5U3RyaW5nKGxhYmVsKSA/IFwiVGFiXCIgOiBsYWJlbCk7XHJcbiAgICAgICAgICAgICQobWVudWl0ZW0pLmFwcGVuZChtZW51YW5jaG9yKTtcclxuICAgICAgICAgICAgLy8gQWRkIHRvIHRhYnMgbGlzdCBjb250YWluZXJcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpLmFwcGVuZChtZW51aXRlbSk7XHJcblxyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50LCBvbiB0YWJDb250YWluZXIsIHdpdGggdGhlIG5ldyB0YWIgYXMgZGF0YVxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIudHJpZ2dlckhhbmRsZXIoJ3RhYkNyZWF0ZWQnLCBbdGFiXSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldHVwU2xpZGVyKHRhYkNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFiO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAncmVtb3ZlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBPbmx5IHJlbW92ZSBpZiBpcyBhICdyZW1vdmFibGUnIHRhYlxyXG4gICAgICAgIGlmICghY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdyZW1vdmFibGUnKSAmJiAhY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCd2b2xhdGlsZScpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy8gSWYgdGFiIGlzIGN1cnJlbnRseSBmb2N1c2VkIHRhYiwgY2hhbmdlIHRvIGZpcnN0IHRhYlxyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2N1cnJlbnQnKSlcclxuICAgICAgICAgICAgdGhpcy5mb2N1c1RhYkluZGV4KGN0eC50YWJDb250YWluZXIsIDApO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5yZW1vdmUoKTtcclxuICAgICAgICB2YXIgdGFiaWQgPSBjdHgudGFiLmdldCgwKS5pZDtcclxuICAgICAgICBjdHgudGFiLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnNldHVwU2xpZGVyKGN0eC50YWJDb250YWluZXIpO1xyXG5cclxuICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50LCBvbiB0YWJDb250YWluZXIsIHdpdGggdGhlIHJlbW92ZWQgdGFiIGlkIGFzIGRhdGFcclxuICAgICAgICBjdHgudGFiQ29udGFpbmVyLnRyaWdnZXJIYW5kbGVyKCd0YWJSZW1vdmVkJywgW3RhYmlkXSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgc2V0VGFiVGl0bGU6IGZ1bmN0aW9uICh0YWJPclNlbGVjdG9yLCBuZXdUaXRsZSkge1xyXG4gICAgICAgIHZhciBjdHggPSBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRhYk9yU2VsZWN0b3IpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnc2V0VGFiVGl0bGUnLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2V0IGFuIGVtcHR5IHN0cmluZyBpcyBub3QgYWxsb3dlZCwgcHJlc2VydmUgcHJldmlvdXNseTpcclxuICAgICAgICBpZiAoIWlzRW1wdHlTdHJpbmcobmV3VGl0bGUpKVxyXG4gICAgICAgICAgICBjdHgubWVudWFuY2hvci50ZXh0KG5ld1RpdGxlKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qIE1vcmUgc3RhdGljIHV0aWxpdGllcyAqL1xyXG5cclxuLyoqIExvb2sgdXAgdGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uIGFkZHJlc3MgYW5kIHRyeSB0byBmb2N1cyBhIHRhYiB3aXRoIHRoYXRcclxuICAgIG5hbWUsIGlmIHRoZXJlIGlzIG9uZS5cclxuKiovXHJcblRhYmJlZFVYLmZvY3VzQ3VycmVudExvY2F0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gSWYgdGhlIGN1cnJlbnQgbG9jYXRpb24gaGF2ZSBhIGhhc2ggdmFsdWUgYnV0IGlzIG5vdCBhIEhhc2hCYW5nXHJcbiAgICBpZiAoL14jW14hXS8udGVzdCh3aW5kb3cubG9jYXRpb24uaGFzaCkpIHtcclxuICAgICAgICAvLyBUcnkgZm9jdXMgYSB0YWIgd2l0aCB0aGF0IG5hbWVcclxuICAgICAgICB2YXIgdGFiID0gVGFiYmVkVVguZ2V0VGFiKHdpbmRvdy5sb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICBpZiAodGFiKVxyXG4gICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0YWIpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqIExvb2sgZm9yIHZvbGF0aWxlIHRhYnMgb24gdGhlIHBhZ2UsIGlmIHRoZXkgYXJlXHJcbiAgICBlbXB0eSBvciByZXF1ZXN0aW5nIGJlaW5nICd2b2xhdGl6ZWQnLCByZW1vdmUgaXQuXHJcbioqL1xyXG5UYWJiZWRVWC5jaGVja1ZvbGF0aWxlVGFicyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoJy50YWJiZWQgPiAudGFicyA+IC52b2xhdGlsZScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0YWIgPSBUYWJiZWRVWC5nZXRUYWIobnVsbCwgdGhpcyk7XHJcbiAgICAgICAgaWYgKHRhYiAmJiAoJCh0YWIpLmNoaWxkcmVuKCkubGVuZ3RoID09PSAwIHx8ICQodGFiKS5maW5kKCc6bm90KC50YWJiZWQpIC52b2xhdGl6ZS1teS10YWInKS5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgIFRhYmJlZFVYLnJlbW92ZVRhYih0YWIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGFiYmVkVVg7IiwiLyogc2xpZGVyLXRhYnMgbG9naWMuXHJcbiogRXhlY3V0ZSBpbml0IGFmdGVyIFRhYmJlZFVYLmluaXQgdG8gYXZvaWQgbGF1bmNoIGFuaW1hdGlvbiBvbiBwYWdlIGxvYWQuXHJcbiogSXQgcmVxdWlyZXMgVGFiYmVkVVggdGhyb3VnaHQgREkgb24gJ2luaXQnLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0U2xpZGVyVGFicyhUYWJiZWRVWCkge1xyXG4gICAgJCgnLnRhYmJlZC5zbGlkZXItdGFicycpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyICR0YWJzID0gJHQuY2hpbGRyZW4oJy50YWItYm9keScpO1xyXG4gICAgICAgIHZhciBjID0gJHRhYnNcclxuICAgICAgICAgICAgLndyYXBBbGwoJzxkaXYgY2xhc3M9XCJ0YWItYm9keS1saXN0XCIvPicpXHJcbiAgICAgICAgICAgIC5lbmQoKS5jaGlsZHJlbignLnRhYi1ib2R5LWxpc3QnKTtcclxuICAgICAgICAkdGFicy5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYy5zdG9wKHRydWUsIGZhbHNlKS5hbmltYXRlKHsgc2Nyb2xsTGVmdDogYy5zY3JvbGxMZWZ0KCkgKyAkKHRoaXMpLnBvc2l0aW9uKCkubGVmdCB9LCAxNDAwKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBTZXQgaG9yaXpvbnRhbCBzY3JvbGwgdG8gdGhlIHBvc2l0aW9uIG9mIGN1cnJlbnQgc2hvd2VkIHRhYiwgd2l0aG91dCBhbmltYXRpb24gKGZvciBwYWdlLWluaXQpOlxyXG4gICAgICAgIHZhciBjdXJyZW50VGFiID0gJCgkdC5maW5kKCc+LnRhYnM+bGkuY3VycmVudD5hJykuYXR0cignaHJlZicpKTtcclxuICAgICAgICBjLnNjcm9sbExlZnQoYy5zY3JvbGxMZWZ0KCkgKyBjdXJyZW50VGFiLnBvc2l0aW9uKCkubGVmdCk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIFdpemFyZCBUYWJiZWQgRm9ybXMuXHJcbiAgICBJdCB1c2UgdGFicyB0byBtYW5hZ2UgdGhlIGRpZmZlcmVudCBmb3Jtcy1zdGVwcyBpbiB0aGUgd2l6YXJkLFxyXG4gICAgbG9hZGVkIGJ5IEFKQVggYW5kIGZvbGxvd2luZyB0byB0aGUgbmV4dCB0YWIvc3RlcCBvbiBzdWNjZXNzLlxyXG5cclxuICAgIFJlcXVpcmUgVGFiYmVkVVggdmlhIERJIG9uICdpbml0J1xyXG4gKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKSxcclxuICAgIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0VGFiYmVkV2l6YXJkKFRhYmJlZFVYLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGxvYWRpbmdEZWxheTogMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChcImJvZHlcIikuZGVsZWdhdGUoXCIudGFiYmVkLndpemFyZCAubmV4dFwiLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBmb3JtXHJcbiAgICAgICAgdmFyIGZvcm0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBjdXJyZW50IHdpemFyZCBzdGVwLXRhYlxyXG4gICAgICAgIHZhciBjdXJyZW50U3RlcCA9IGZvcm0uY2xvc2VzdCgnLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgd2l6YXJkIGNvbnRhaW5lclxyXG4gICAgICAgIHZhciB3aXphcmQgPSBmb3JtLmNsb3Nlc3QoJy50YWJiZWQud2l6YXJkJyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgd2l6YXJkLW5leHQtc3RlcFxyXG4gICAgICAgIHZhciBuZXh0U3RlcCA9ICQodGhpcykuZGF0YSgnd2l6YXJkLW5leHQtc3RlcCcpO1xyXG5cclxuICAgICAgICB2YXIgY3R4ID0ge1xyXG4gICAgICAgICAgICBib3g6IGN1cnJlbnRTdGVwLFxyXG4gICAgICAgICAgICBmb3JtOiBmb3JtXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gRmlyc3QgYXQgYWxsLCBpZiB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICAgICAgdmFyIHZhbG9iamVjdCA9IGZvcm0uZGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKHZhbG9iamVjdCAmJiB2YWxvYmplY3QudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5nb1RvU3VtbWFyeUVycm9ycyhmb3JtKTtcclxuICAgICAgICAgICAgLy8gVmFsaWRhdGlvbiBpcyBhY3RpdmVkLCB3YXMgZXhlY3V0ZWQgYW5kIHRoZSByZXN1bHQgaXMgJ2ZhbHNlJzogYmFkIGRhdGEsIHN0b3AgUG9zdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgY3VzdG9tIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgICAgICB2YXIgY3VzdmFsID0gZm9ybS5kYXRhKCdjdXN0b21WYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKGN1c3ZhbCAmJiBjdXN2YWwudmFsaWRhdGUgJiYgY3VzdmFsLnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSk7XHJcbiAgICAgICAgICAgIC8vIGN1c3RvbSB2YWxpZGF0aW9uIG5vdCBwYXNzZWQsIG91dCFcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmFpc2UgZXZlbnRcclxuICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdiZWdpblN1Ym1pdFdpemFyZFN0ZXAnKTtcclxuXHJcbiAgICAgICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgICAgICBjdHgubG9hZGluZ3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwLmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgICAgICB9LCBvcHRpb25zLmxvYWRpbmdEZWxheSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBvayA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBNYXJrIGFzIHNhdmVkOlxyXG4gICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmb3JtLmdldCgwKSk7XHJcblxyXG4gICAgICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IChmb3JtLmF0dHIoJ2FjdGlvbicpIHx8ICcnKSxcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgICAgIGRhdGE6IGZvcm0uc2VyaWFsaXplKCksXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIHN1Y2Nlc3MsIGdvIG5leHQgc3RlcCwgdXNpbmcgY3VzdG9tIEpTT04gQWN0aW9uIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0ub24oJ2FqYXhTdWNjZXNzUG9zdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBuZXh0LXN0ZXBcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbmV4dCBzdGVwIGlzIGludGVybmFsIHVybCAoYSBuZXh0IHdpemFyZCB0YWIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvXiMvLnRlc3QobmV4dFN0ZXApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5leHRTdGVwKS50cmlnZ2VyKCdiZWdpbkxvYWRXaXphcmRTdGVwJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVGFiYmVkVVguZW5hYmxlVGFiKG5leHRTdGVwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5leHRTdGVwKS50cmlnZ2VyKCdlbmRMb2FkV2l6YXJkU3RlcCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBuZXh0LXN0ZXAgVVJJIHRoYXQgaXMgbm90IGludGVybmFsIGxpbmssIHdlIGxvYWQgaXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0VG8obmV4dFN0ZXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRG8gSlNPTiBhY3Rpb24gYnV0IGlmIGlzIG5vdCBKU09OIG9yIHZhbGlkLCBtYW5hZ2UgYXMgSFRNTDpcclxuICAgICAgICAgICAgICAgIGlmICghYWpheENhbGxiYWNrcy5kb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQb3N0ICdtYXliZScgd2FzIHdyb25nLCBodG1sIHdhcyByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9ybSBjb250YWluZXI6IHRoZSBhamF4LWJveC5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhbiBlbXB0eSBkb2N1bWVudCBvciBtYWxmb3JtZWQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvd2luZyBuZXcgaHRtbDpcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50U3RlcC5odG1sKG5ld2h0bWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdGb3JtID0gY3VycmVudFN0ZXA7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50U3RlcC5pcygnZm9ybScpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGb3JtID0gY3VycmVudFN0ZXAuZmluZCgnZm9ybTplcSgwKScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAgICAgICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50c1xyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ3JlbG9hZGVkSHRtbFdpemFyZFN0ZXAnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGFqYXhDYWxsYmFja3MuZXJyb3IsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBhamF4Q2FsbGJhY2tzLmNvbXBsZXRlXHJcbiAgICAgICAgfSkuY29tcGxldGUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdlbmRTdWJtaXRXaXphcmRTdGVwJywgb2spO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKiB0aW1lU3BhbiBjbGFzcyB0byBtYW5hZ2UgdGltZXMsIHBhcnNlLCBmb3JtYXQsIGNvbXB1dGUuXHJcbkl0cyBub3Qgc28gY29tcGxldGUgYXMgdGhlIEMjIG9uZXMgYnV0IGlzIHVzZWZ1bGwgc3RpbGwuXHJcbioqL1xyXG52YXIgVGltZVNwYW4gPSBmdW5jdGlvbiAoZGF5cywgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcykge1xyXG4gICAgdGhpcy5kYXlzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGRheXMpKSB8fCAwO1xyXG4gICAgdGhpcy5ob3VycyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChob3VycykpIHx8IDA7XHJcbiAgICB0aGlzLm1pbnV0ZXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQobWludXRlcykpIHx8IDA7XHJcbiAgICB0aGlzLnNlY29uZHMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoc2Vjb25kcykpIHx8IDA7XHJcbiAgICB0aGlzLm1pbGxpc2Vjb25kcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChtaWxsaXNlY29uZHMpKSB8fCAwO1xyXG5cclxuICAgIC8vIGludGVybmFsIHV0aWxpdHkgZnVuY3Rpb24gJ3RvIHN0cmluZyB3aXRoIHR3byBkaWdpdHMgYWxtb3N0J1xyXG4gICAgZnVuY3Rpb24gdChuKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobiAvIDEwKSArICcnICsgbiAlIDEwO1xyXG4gICAgfVxyXG4gICAgLyoqIFNob3cgb25seSBob3VycyBhbmQgbWludXRlcyBhcyBhIHN0cmluZyB3aXRoIHRoZSBmb3JtYXQgSEg6bW1cclxuICAgICoqL1xyXG4gICAgdGhpcy50b1Nob3J0U3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TaG9ydFN0cmluZygpIHtcclxuICAgICAgICB2YXIgaCA9IHQodGhpcy5ob3VycyksXHJcbiAgICAgICAgICAgIG0gPSB0KHRoaXMubWludXRlcyk7XHJcbiAgICAgICAgcmV0dXJuIChoICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgKyBtKTtcclxuICAgIH07XHJcbiAgICAvKiogU2hvdyB0aGUgZnVsbCB0aW1lIGFzIGEgc3RyaW5nLCBkYXlzIGNhbiBhcHBlYXIgYmVmb3JlIGhvdXJzIGlmIHRoZXJlIGFyZSAyNCBob3VycyBvciBtb3JlXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1N0cmluZygpIHtcclxuICAgICAgICB2YXIgaCA9IHQodGhpcy5ob3VycyksXHJcbiAgICAgICAgICAgIGQgPSAodGhpcy5kYXlzID4gMCA/IHRoaXMuZGF5cy50b1N0cmluZygpICsgVGltZVNwYW4uZGVjaW1hbHNEZWxpbWl0ZXIgOiAnJyksXHJcbiAgICAgICAgICAgIG0gPSB0KHRoaXMubWludXRlcyksXHJcbiAgICAgICAgICAgIHMgPSB0KHRoaXMuc2Vjb25kcyArIHRoaXMubWlsbGlzZWNvbmRzIC8gMTAwMCk7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgZCArXHJcbiAgICAgICAgICAgIGggKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArXHJcbiAgICAgICAgICAgIG0gKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArXHJcbiAgICAgICAgICAgIHMpO1xyXG4gICAgfTtcclxuICAgIHRoaXMudmFsdWVPZiA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3ZhbHVlT2YoKSB7XHJcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB0b3RhbCBtaWxsaXNlY29uZHMgY29udGFpbmVkIGJ5IHRoZSB0aW1lXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5kYXlzICogKDI0ICogMzYwMDAwMCkgK1xyXG4gICAgICAgICAgICB0aGlzLmhvdXJzICogMzYwMDAwMCArXHJcbiAgICAgICAgICAgIHRoaXMubWludXRlcyAqIDYwMDAwICtcclxuICAgICAgICAgICAgdGhpcy5zZWNvbmRzICogMTAwMCArXHJcbiAgICAgICAgICAgIHRoaXMubWlsbGlzZWNvbmRzXHJcbiAgICAgICAgKTtcclxuICAgIH07XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgbWlsbGlzZWNvbmRzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbU1pbGxpc2Vjb25kcyhtaWxsaXNlY29uZHMpIHtcclxuICAgIHZhciBtcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDAsXHJcbiAgICAgICAgcyA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gMTAwMCkgJSA2MCxcclxuICAgICAgICBtID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyA2MDAwMCkgJSA2MCxcclxuICAgICAgICBoID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAzNjAwMDAwKSAlIDI0LFxyXG4gICAgICAgIGQgPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvICgzNjAwMDAwICogMjQpKTtcclxuICAgIHJldHVybiBuZXcgVGltZVNwYW4oZCwgaCwgbSwgcywgbXMpO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgc2Vjb25kc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbVNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tU2Vjb25kcyhzZWNvbmRzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tTWlsbGlzZWNvbmRzKHNlY29uZHMgKiAxMDAwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIG1pbnV0ZXNcclxuKiovXHJcblRpbWVTcGFuLmZyb21NaW51dGVzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbU1pbnV0ZXMobWludXRlcykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbVNlY29uZHMobWludXRlcyAqIDYwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIGhvdXJzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tSG91cnMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tSG91cnMoaG91cnMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21NaW51dGVzKGhvdXJzICogNjApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgZGF5c1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbURheXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tRGF5cyhkYXlzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tSG91cnMoZGF5cyAqIDI0KTtcclxufTtcclxuXHJcbi8vIEZvciBzcGFuaXNoIGFuZCBlbmdsaXNoIHdvcmtzIGdvb2QgJzonIGFzIHVuaXRzRGVsaW1pdGVyIGFuZCAnLicgYXMgZGVjaW1hbERlbGltaXRlclxyXG4vLyBUT0RPOiB0aGlzIG11c3QgYmUgc2V0IGZyb20gYSBnbG9iYWwgTEMuaTE4biB2YXIgbG9jYWxpemVkIGZvciBjdXJyZW50IHVzZXJcclxuVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgPSAnOic7XHJcblRpbWVTcGFuLmRlY2ltYWxzRGVsaW1pdGVyID0gJy4nO1xyXG5UaW1lU3Bhbi5wYXJzZSA9IGZ1bmN0aW9uIChzdHJ0aW1lKSB7XHJcbiAgICBzdHJ0aW1lID0gKHN0cnRpbWUgfHwgJycpLnNwbGl0KHRoaXMudW5pdHNEZWxpbWl0ZXIpO1xyXG4gICAgLy8gQmFkIHN0cmluZywgcmV0dXJucyBudWxsXHJcbiAgICBpZiAoc3RydGltZS5sZW5ndGggPCAyKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIC8vIERlY291cGxlZCB1bml0czpcclxuICAgIHZhciBkLCBoLCBtLCBzLCBtcztcclxuICAgIGggPSBzdHJ0aW1lWzBdO1xyXG4gICAgbSA9IHN0cnRpbWVbMV07XHJcbiAgICBzID0gc3RydGltZS5sZW5ndGggPiAyID8gc3RydGltZVsyXSA6IDA7XHJcbiAgICAvLyBTdWJzdHJhY3RpbmcgZGF5cyBmcm9tIHRoZSBob3VycyBwYXJ0IChmb3JtYXQ6ICdkYXlzLmhvdXJzJyB3aGVyZSAnLicgaXMgZGVjaW1hbHNEZWxpbWl0ZXIpXHJcbiAgICBpZiAoaC5jb250YWlucyh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyKSkge1xyXG4gICAgICAgIHZhciBkaHNwbGl0ID0gaC5zcGxpdCh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyKTtcclxuICAgICAgICBkID0gZGhzcGxpdFswXTtcclxuICAgICAgICBoID0gZGhzcGxpdFsxXTtcclxuICAgIH1cclxuICAgIC8vIE1pbGxpc2Vjb25kcyBhcmUgZXh0cmFjdGVkIGZyb20gdGhlIHNlY29uZHMgKGFyZSByZXByZXNlbnRlZCBhcyBkZWNpbWFsIG51bWJlcnMgb24gdGhlIHNlY29uZHMgcGFydDogJ3NlY29uZHMubWlsbGlzZWNvbmRzJyB3aGVyZSAnLicgaXMgZGVjaW1hbHNEZWxpbWl0ZXIpXHJcbiAgICBtcyA9IE1hdGgucm91bmQocGFyc2VGbG9hdChzLnJlcGxhY2UodGhpcy5kZWNpbWFsc0RlbGltaXRlciwgJy4nKSkgKiAxMDAwICUgMTAwMCk7XHJcbiAgICAvLyBSZXR1cm4gdGhlIG5ldyB0aW1lIGluc3RhbmNlXHJcbiAgICByZXR1cm4gbmV3IFRpbWVTcGFuKGQsIGgsIG0sIHMsIG1zKTtcclxufTtcclxuVGltZVNwYW4uemVybyA9IG5ldyBUaW1lU3BhbigwLCAwLCAwLCAwLCAwKTtcclxuVGltZVNwYW4ucHJvdG90eXBlLmlzWmVybyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2lzWmVybygpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgdGhpcy5kYXlzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5ob3VycyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMubWludXRlcyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMuc2Vjb25kcyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMubWlsbGlzZWNvbmRzID09PSAwXHJcbiAgICApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxNaWxsaXNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbE1pbGxpc2Vjb25kcygpIHtcclxuICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsU2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsU2Vjb25kcygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbE1pbGxpc2Vjb25kcygpIC8gMTAwMCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbE1pbnV0ZXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbE1pbnV0ZXMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxTZWNvbmRzKCkgLyA2MCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbEhvdXJzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxIb3VycygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbE1pbnV0ZXMoKSAvIDYwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsRGF5cyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsRGF5cygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbEhvdXJzKCkgLyAyNCk7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRpbWVTcGFuOyIsIi8qIEV4dHJhIHV0aWxpdGllcyBhbmQgbWV0aG9kcyBcclxuICovXHJcbnZhciBUaW1lU3BhbiA9IHJlcXVpcmUoJy4vVGltZVNwYW4nKTtcclxudmFyIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbi8qKiBTaG93cyB0aW1lIGFzIGEgbGFyZ2Ugc3RyaW5nIHdpdGggdW5pdHMgbmFtZXMgZm9yIHZhbHVlcyBkaWZmZXJlbnQgdGhhbiB6ZXJvLlxyXG4gKiovXHJcbmZ1bmN0aW9uIHNtYXJ0VGltZSh0aW1lKSB7XHJcbiAgICB2YXIgciA9IFtdO1xyXG4gICAgaWYgKHRpbWUuZGF5cyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuZGF5cyArICcgZGF5cycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5kYXlzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIGRheScpO1xyXG4gICAgaWYgKHRpbWUuaG91cnMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLmhvdXJzICsgJyBob3VycycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5ob3VycyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBob3VyJyk7XHJcbiAgICBpZiAodGltZS5taW51dGVzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5taW51dGVzICsgJyBtaW51dGVzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLm1pbnV0ZXMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgbWludXRlJyk7XHJcbiAgICBpZiAodGltZS5zZWNvbmRzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5zZWNvbmRzICsgJyBzZWNvbmRzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLnNlY29uZHMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgc2Vjb25kJyk7XHJcbiAgICBpZiAodGltZS5taWxsaXNlY29uZHMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLm1pbGxpc2Vjb25kcyArICcgbWlsbGlzZWNvbmRzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLm1pbGxpc2Vjb25kcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBtaWxsaXNlY29uZCcpO1xyXG4gICAgcmV0dXJuIHIuam9pbignLCAnKTtcclxufVxyXG5cclxuLyoqIFJvdW5kcyBhIHRpbWUgdG8gdGhlIG5lYXJlc3QgMTUgbWludXRlcyBmcmFnbWVudC5cclxuQHJvdW5kVG8gc3BlY2lmeSB0aGUgTEMucm91bmRpbmdUeXBlRW51bSBhYm91dCBob3cgdG8gcm91bmQgdGhlIHRpbWUgKGRvd24sIG5lYXJlc3Qgb3IgdXApXHJcbioqL1xyXG5mdW5jdGlvbiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyKC8qIFRpbWVTcGFuICovdGltZSwgLyogbWF0aFV0aWxzLnJvdW5kaW5nVHlwZUVudW0gKi9yb3VuZFRvKSB7XHJcbiAgICB2YXIgcmVzdEZyb21RdWFydGVyID0gdGltZS50b3RhbEhvdXJzKCkgJSAwLjI1O1xyXG4gICAgdmFyIGhvdXJzID0gdGltZS50b3RhbEhvdXJzKCk7XHJcbiAgICBpZiAocmVzdEZyb21RdWFydGVyID4gMC4wKSB7XHJcbiAgICAgICAgc3dpdGNoIChyb3VuZFRvKSB7XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5Eb3duOlxyXG4gICAgICAgICAgICAgICAgaG91cnMgLT0gcmVzdEZyb21RdWFydGVyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5OZWFyZXN0OlxyXG4gICAgICAgICAgICAgICAgdmFyIGxpbWl0ID0gMC4yNSAvIDI7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdEZyb21RdWFydGVyID49IGxpbWl0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG91cnMgKz0gKDAuMjUgLSByZXN0RnJvbVF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBob3VycyAtPSByZXN0RnJvbVF1YXJ0ZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLlVwOlxyXG4gICAgICAgICAgICAgICAgaG91cnMgKz0gKDAuMjUgLSByZXN0RnJvbVF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFRpbWVTcGFuLmZyb21Ib3Vycyhob3Vycyk7XHJcbn1cclxuXHJcbi8vIEV4dGVuZCBhIGdpdmVuIFRpbWVTcGFuIG9iamVjdCB3aXRoIHRoZSBFeHRyYSBtZXRob2RzXHJcbmZ1bmN0aW9uIHBsdWdJbihUaW1lU3Bhbikge1xyXG4gICAgVGltZVNwYW4ucHJvdG90eXBlLnRvU21hcnRTdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1NtYXJ0U3RyaW5nKCkgeyByZXR1cm4gc21hcnRUaW1lKHRoaXMpOyB9O1xyXG4gICAgVGltZVNwYW4ucHJvdG90eXBlLnJvdW5kVG9RdWFydGVySG91ciA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3JvdW5kVG9RdWFydGVySG91cigpIHsgcmV0dXJuIHJvdW5kVGltZVRvUXVhcnRlckhvdXIuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTsgfTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgc21hcnRUaW1lOiBzbWFydFRpbWUsXHJcbiAgICAgICAgcm91bmRUb1F1YXJ0ZXJIb3VyOiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyLFxyXG4gICAgICAgIHBsdWdJbjogcGx1Z0luXHJcbiAgICB9O1xyXG4iLCIvKipcclxuICAgQVBJIGZvciBhdXRvbWF0aWMgY3JlYXRpb24gb2YgbGFiZWxzIGZvciBVSSBTbGlkZXJzIChqcXVlcnktdWkpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgdG9vbHRpcHMgPSByZXF1aXJlKCcuL3Rvb2x0aXBzJyksXHJcbiAgICBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyksXHJcbiAgICBUaW1lU3BhbiA9IHJlcXVpcmUoJy4vVGltZVNwYW4nKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG4vKiogQ3JlYXRlIGxhYmVscyBmb3IgYSBqcXVlcnktdWktc2xpZGVyLlxyXG4qKi9cclxuZnVuY3Rpb24gY3JlYXRlKHNsaWRlcikge1xyXG4gICAgLy8gcmVtb3ZlIG9sZCBvbmVzOlxyXG4gICAgdmFyIG9sZCA9IHNsaWRlci5zaWJsaW5ncygnLnVpLXNsaWRlci1sYWJlbHMnKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXInKS5nZXQoMCkgPT0gc2xpZGVyLmdldCgwKSk7XHJcbiAgICB9KS5yZW1vdmUoKTtcclxuICAgIC8vIENyZWF0ZSBsYWJlbHMgY29udGFpbmVyXHJcbiAgICB2YXIgbGFiZWxzID0gJCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbHNcIi8+Jyk7XHJcbiAgICBsYWJlbHMuZGF0YSgndWktc2xpZGVyJywgc2xpZGVyKTtcclxuXHJcbiAgICAvLyBTZXR1cCBvZiB1c2VmdWwgdmFycyBmb3IgbGFiZWwgY3JlYXRpb25cclxuICAgIHZhciBtYXggPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnbWF4JyksXHJcbiAgICAgICAgbWluID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ21pbicpLFxyXG4gICAgICAgIHN0ZXAgPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnc3RlcCcpLFxyXG4gICAgICAgIHN0ZXBzID0gTWF0aC5mbG9vcigobWF4IC0gbWluKSAvIHN0ZXApO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIGFuZCBwb3NpdGlvbmluZyBsYWJlbHNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0ZXBzOyBpKyspIHtcclxuICAgICAgICAvLyBDcmVhdGUgbGFiZWxcclxuICAgICAgICB2YXIgbGJsID0gJCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbFwiPjxzcGFuIGNsYXNzPVwidWktc2xpZGVyLWxhYmVsLXRleHRcIi8+PC9kaXY+Jyk7XHJcbiAgICAgICAgLy8gU2V0dXAgbGFiZWwgd2l0aCBpdHMgdmFsdWVcclxuICAgICAgICB2YXIgbGFiZWxWYWx1ZSA9IG1pbiArIGkgKiBzdGVwO1xyXG4gICAgICAgIGxibC5jaGlsZHJlbignLnVpLXNsaWRlci1sYWJlbC10ZXh0JykudGV4dChsYWJlbFZhbHVlKTtcclxuICAgICAgICBsYmwuZGF0YSgndWktc2xpZGVyLXZhbHVlJywgbGFiZWxWYWx1ZSk7XHJcbiAgICAgICAgLy8gUG9zaXRpb25hdGVcclxuICAgICAgICBwb3NpdGlvbmF0ZShsYmwsIGksIHN0ZXBzKTtcclxuICAgICAgICAvLyBBZGQgdG8gY29udGFpbmVyXHJcbiAgICAgICAgbGFiZWxzLmFwcGVuZChsYmwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZXIgZm9yIGxhYmVscyBjbGljayB0byBzZWxlY3QgaXRzIHBvc2l0aW9uIHZhbHVlXHJcbiAgICBsYWJlbHMub24oJ2NsaWNrJywgJy51aS1zbGlkZXItbGFiZWwnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHZhbCA9ICQodGhpcykuZGF0YSgndWktc2xpZGVyLXZhbHVlJyksXHJcbiAgICAgICAgICAgIHNsaWRlciA9ICQodGhpcykucGFyZW50KCkuZGF0YSgndWktc2xpZGVyJyk7XHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSW5zZXJ0IGxhYmVscyBhcyBhIHNpYmxpbmcgb2YgdGhlIHNsaWRlciAoY2Fubm90IGJlIGluc2VydGVkIGluc2lkZSlcclxuICAgIHNsaWRlci5hZnRlcihsYWJlbHMpO1xyXG59XHJcblxyXG4vKiogUG9zaXRpb25hdGUgdG8gdGhlIGNvcnJlY3QgcG9zaXRpb24gYW5kIHdpZHRoIGFuIFVJIGxhYmVsIGF0IEBsYmxcclxuZm9yIHRoZSByZXF1aXJlZCBwZXJjZW50YWdlLXdpZHRoIEBzd1xyXG4qKi9cclxuZnVuY3Rpb24gcG9zaXRpb25hdGUobGJsLCBpLCBzdGVwcykge1xyXG4gICAgdmFyIHN3ID0gMTAwIC8gc3RlcHM7XHJcbiAgICB2YXIgbGVmdCA9IGkgKiBzdyAtIHN3ICogMC41LFxyXG4gICAgICAgIHJpZ2h0ID0gMTAwIC0gbGVmdCAtIHN3LFxyXG4gICAgICAgIGFsaWduID0gJ2NlbnRlcic7XHJcbiAgICBpZiAoaSA9PT0gMCkge1xyXG4gICAgICAgIGFsaWduID0gJ2xlZnQnO1xyXG4gICAgICAgIGxlZnQgPSAwO1xyXG4gICAgfSBlbHNlIGlmIChpID09IHN0ZXBzKSB7XHJcbiAgICAgICAgYWxpZ24gPSAncmlnaHQnO1xyXG4gICAgICAgIHJpZ2h0ID0gMDtcclxuICAgIH1cclxuICAgIGxibC5jc3Moe1xyXG4gICAgICAgICd0ZXh0LWFsaWduJzogYWxpZ24sXHJcbiAgICAgICAgbGVmdDogbGVmdCArICclJyxcclxuICAgICAgICByaWdodDogcmlnaHQgKyAnJSdcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSB2aXNpYmlsaXR5IG9mIGxhYmVscyBvZiBhIGpxdWVyeS11aS1zbGlkZXIgZGVwZW5kaW5nIGlmIHRoZXkgZml0IGluIHRoZSBhdmFpbGFibGUgc3BhY2UuXHJcblNsaWRlciBuZWVkcyB0byBiZSB2aXNpYmxlLlxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlKHNsaWRlcikge1xyXG4gICAgLy8gR2V0IGxhYmVscyBmb3Igc2xpZGVyXHJcbiAgICB2YXIgbGFiZWxzX2MgPSBzbGlkZXIuc2libGluZ3MoJy51aS1zbGlkZXItbGFiZWxzJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCQodGhpcykuZGF0YSgndWktc2xpZGVyJykuZ2V0KDApID09IHNsaWRlci5nZXQoMCkpO1xyXG4gICAgfSk7XHJcbiAgICB2YXIgbGFiZWxzID0gbGFiZWxzX2MuZmluZCgnLnVpLXNsaWRlci1sYWJlbC10ZXh0Jyk7XHJcblxyXG4gICAgLy8gQXBwbHkgYXV0b3NpemVcclxuICAgIGlmICgoc2xpZGVyLmRhdGEoJ3NsaWRlci1hdXRvc2l6ZScpIHx8IGZhbHNlKS50b1N0cmluZygpID09ICd0cnVlJylcclxuICAgICAgICBhdXRvc2l6ZShzbGlkZXIsIGxhYmVscyk7XHJcblxyXG4gICAgLy8gR2V0IGFuZCBhcHBseSBsYXlvdXRcclxuICAgIHZhciBsYXlvdXRfbmFtZSA9IHNsaWRlci5kYXRhKCdzbGlkZXItbGFiZWxzLWxheW91dCcpIHx8ICdzdGFuZGFyZCcsXHJcbiAgICAgICAgbGF5b3V0ID0gbGF5b3V0X25hbWUgaW4gbGF5b3V0cyA/IGxheW91dHNbbGF5b3V0X25hbWVdIDogbGF5b3V0cy5zdGFuZGFyZDtcclxuICAgIGxhYmVsc19jLmFkZENsYXNzKCdsYXlvdXQtJyArIGxheW91dF9uYW1lKTtcclxuICAgIGxheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0b29sdGlwc1xyXG4gICAgdG9vbHRpcHMuY3JlYXRlVG9vbHRpcChsYWJlbHNfYy5jaGlsZHJlbigpLCB7XHJcbiAgICAgICAgdGl0bGU6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICQodGhpcykudGV4dCgpOyB9XHJcbiAgICAgICAgLCBwZXJzaXN0ZW50OiB0cnVlXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gYXV0b3NpemUoc2xpZGVyLCBsYWJlbHMpIHtcclxuICAgIHZhciB0b3RhbF93aWR0aCA9IDA7XHJcbiAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdG90YWxfd2lkdGggKz0gJCh0aGlzKS5vdXRlcldpZHRoKHRydWUpO1xyXG4gICAgfSk7XHJcbiAgICB2YXIgYyA9IHNsaWRlci5jbG9zZXN0KCcudWktc2xpZGVyLWNvbnRhaW5lcicpLFxyXG4gICAgICAgIG1heCA9IHBhcnNlRmxvYXQoYy5jc3MoJ21heC13aWR0aCcpKSxcclxuICAgICAgICBtaW4gPSBwYXJzZUZsb2F0KGMuY3NzKCdtaW4td2lkdGgnKSk7XHJcbiAgICBpZiAobWF4ICE9IE51bWJlci5OYU4gJiYgdG90YWxfd2lkdGggPiBtYXgpXHJcbiAgICAgICAgdG90YWxfd2lkdGggPSBtYXg7XHJcbiAgICBpZiAobWluICE9IE51bWJlci5OYU4gJiYgdG90YWxfd2lkdGggPCBtaW4pXHJcbiAgICAgICAgdG90YWxfd2lkdGggPSBtaW47XHJcbiAgICBjLndpZHRoKHRvdGFsX3dpZHRoKTtcclxufVxyXG5cclxuLyoqIFNldCBvZiBkaWZmZXJlbnQgbGF5b3V0cyBmb3IgbGFiZWxzLCBhbGxvd2luZyBkaWZmZXJlbnQga2luZHMgb2YgXHJcbnBsYWNlbWVudCBhbmQgdmlzdWFsaXphdGlvbiB1c2luZyB0aGUgc2xpZGVyIGRhdGEgb3B0aW9uICdsYWJlbHMtbGF5b3V0Jy5cclxuVXNlZCBieSAndXBkYXRlJywgYWxtb3N0IHRoZSAnc3RhbmRhcmQnIG11c3QgZXhpc3QgYW5kIGNhbiBiZSBpbmNyZWFzZWRcclxuZXh0ZXJuYWxseVxyXG4qKi9cclxudmFyIGxheW91dHMgPSB7fTtcclxuLyoqIFNob3cgdGhlIG1heGltdW0gbnVtYmVyIG9mIGxhYmVscyBpbiBlcXVhbGx5IHNpemVkIGdhcHMgYnV0XHJcbnRoZSBsYXN0IGxhYmVsIHRoYXQgaXMgZW5zdXJlZCB0byBiZSBzaG93ZWQgZXZlbiBpZiBpdCBjcmVhdGVzXHJcbmEgaGlnaGVyIGdhcCB3aXRoIHRoZSBwcmV2aW91cyBvbmUuXHJcbioqL1xyXG5sYXlvdXRzLnN0YW5kYXJkID0gZnVuY3Rpb24gc3RhbmRhcmRfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscykge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlcmUgYXJlIG1vcmUgbGFiZWxzIHRoYW4gYXZhaWxhYmxlIHNwYWNlXHJcbiAgICAvLyBHZXQgbWF4aW11bSBsYWJlbCB3aWR0aFxyXG4gICAgdmFyIGl0ZW1fd2lkdGggPSAwO1xyXG4gICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0dyA9ICQodGhpcykub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgICAgICBpZiAodHcgPj0gaXRlbV93aWR0aClcclxuICAgICAgICAgICAgaXRlbV93aWR0aCA9IHR3O1xyXG4gICAgfSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyB3aWR0aCwgaWYgbm90LCBlbGVtZW50IGlzIG5vdCB2aXNpYmxlIGNhbm5vdCBiZSBjb21wdXRlZFxyXG4gICAgaWYgKGl0ZW1fd2lkdGggPiAwKSB7XHJcbiAgICAgICAgLy8gR2V0IHRoZSByZXF1aXJlZCBzdGVwcGluZyBvZiBsYWJlbHNcclxuICAgICAgICB2YXIgbGFiZWxzX3N0ZXAgPSBNYXRoLmNlaWwoaXRlbV93aWR0aCAvIChzbGlkZXIud2lkdGgoKSAvIGxhYmVscy5sZW5ndGgpKSxcclxuICAgICAgICBsYWJlbHNfc3RlcHMgPSBsYWJlbHMubGVuZ3RoIC8gbGFiZWxzX3N0ZXA7XHJcbiAgICAgICAgaWYgKGxhYmVsc19zdGVwID4gMSkge1xyXG4gICAgICAgICAgICAvLyBIaWRlIHRoZSBsYWJlbHMgb24gcG9zaXRpb25zIG91dCBvZiB0aGUgc3RlcFxyXG4gICAgICAgICAgICB2YXIgbmV3aSA9IDAsXHJcbiAgICAgICAgICAgICAgICBsaW1pdCA9IGxhYmVscy5sZW5ndGggLSAxIC0gbGFiZWxzX3N0ZXA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFiZWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGJsID0gJChsYWJlbHNbaV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKChpICsgMSkgPCBsYWJlbHMubGVuZ3RoICYmIChcclxuICAgICAgICAgICAgICAgICAgICBpICUgbGFiZWxzX3N0ZXAgfHxcclxuICAgICAgICAgICAgICAgICAgICBpID4gbGltaXQpKVxyXG4gICAgICAgICAgICAgICAgICAgIGxibC5oaWRlKCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3dcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gbGJsLnNob3coKS5wYXJlbnQoKS5hZGRDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcG9zaXRpb25hdGUgcGFyZW50XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcG9zaXRpb25hdGUocGFyZW50LCBuZXdpLCBsYWJlbHNfc3RlcHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld2krKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuLyoqIFNob3cgbGFiZWxzIG51bWJlciB2YWx1ZXMgZm9ybWF0dGVkIGFzIGhvdXJzLCB3aXRoIG9ubHlcclxuaW50ZWdlciBob3VycyBiZWluZyBzaG93ZWQsIHRoZSBtYXhpbXVtIG51bWJlciBvZiBpdC5cclxuKiovXHJcbmxheW91dHMuaG91cnMgPSBmdW5jdGlvbiBob3Vyc19sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzLCBzaG93X2FsbCkge1xyXG4gICAgdmFyIGludExhYmVscyA9IHNsaWRlci5maW5kKCcuaW50ZWdlci1ob3VyJyk7XHJcbiAgICBpZiAoIWludExhYmVscy5sZW5ndGgpIHtcclxuICAgICAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGlmICghJHQuZGF0YSgnaG91ci1wcm9jZXNzZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHYgPSBwYXJzZUZsb2F0KCR0LnRleHQoKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodiAhPSBOdW1iZXIuTmFOKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdiA9IG11LnJvdW5kVG8odiwgMik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYgJSAxID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnZGVjaW1hbC1ob3VyJykuaGlkZSgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ICUgMC41ID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQucGFyZW50KCkuYWRkQ2xhc3MoJ3N0cm9uZycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC50ZXh0KFRpbWVTcGFuLmZyb21Ib3Vycyh2KS50b1Nob3J0U3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdpbnRlZ2VyLWhvdXInKS5zaG93KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW50TGFiZWxzID0gaW50TGFiZWxzLmFkZCgkdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnaG91ci1wcm9jZXNzZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKHNob3dfYWxsICE9PSB0cnVlKVxyXG4gICAgICAgIGxheW91dHMuc3RhbmRhcmQoc2xpZGVyLCBpbnRMYWJlbHMucGFyZW50KCksIGludExhYmVscyk7XHJcbn07XHJcbmxheW91dHNbJ2FsbC12YWx1ZXMnXSA9IGZ1bmN0aW9uIGFsbF9sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKSB7XHJcbiAgICAvLyBTaG93aW5nIGFsbCBsYWJlbHNcclxuICAgIGxhYmVsc19jLnNob3coKS5hZGRDbGFzcygndmlzaWJsZScpLmNoaWxkcmVuKCkuc2hvdygpO1xyXG59O1xyXG5sYXlvdXRzWydhbGwtaG91cnMnXSA9IGZ1bmN0aW9uIGFsbF9ob3Vyc19sYXlvdXQoKSB7XHJcbiAgICAvLyBKdXN0IHVzZSBob3VycyBsYXlvdXQgYnV0IHNob3dpbmcgYWxsIGludGVnZXIgaG91cnNcclxuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwoYXJndW1lbnRzLCB0cnVlKTtcclxuICAgIGxheW91dHMuaG91cnMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY3JlYXRlOiBjcmVhdGUsXHJcbiAgICB1cGRhdGU6IHVwZGF0ZSxcclxuICAgIGxheW91dHM6IGxheW91dHNcclxufTtcclxuIiwiLyogU2V0IG9mIGNvbW1vbiBMQyBjYWxsYmFja3MgZm9yIG1vc3QgQWpheCBvcGVyYXRpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG52YXIgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIEFLQTogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25FcnJvcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIC8vIElmIGlzIGEgY29ubmVjdGlvbiBhYm9ydGVkLCBubyBzaG93IG1lc3NhZ2UuXHJcbiAgICAvLyByZWFkeVN0YXRlIGRpZmZlcmVudCB0byAnZG9uZTo0JyBtZWFucyBhYm9ydGVkIHRvbywgXHJcbiAgICAvLyBiZWNhdXNlIHdpbmRvdyBiZWluZyBjbG9zZWQvbG9jYXRpb24gY2hhbmdlZFxyXG4gICAgaWYgKG1lc3NhZ2UgPT0gJ2Fib3J0JyB8fCBqeC5yZWFkeVN0YXRlICE9IDQpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIHZhciBtID0gbWVzc2FnZTtcclxuICAgIHZhciBpZnJhbWUgPSBudWxsO1xyXG4gICAgc2l6ZSA9IHBvcHVwLnNpemUoJ2xhcmdlJyk7XHJcbiAgICBzaXplLmhlaWdodCAtPSAzNDtcclxuICAgIGlmIChtID09ICdlcnJvcicpIHtcclxuICAgICAgICBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoangucmVzcG9uc2VUZXh0LCBzaXplKTtcclxuICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgIG0gPSBudWxsO1xyXG4gICAgfSAgZWxzZVxyXG4gICAgICAgIG0gPSBtICsgXCI7IFwiICsgZXg7XHJcblxyXG4gICAgLy8gQmxvY2sgYWxsIHdpbmRvdywgbm90IG9ubHkgY3VycmVudCBlbGVtZW50XHJcbiAgICAkLmJsb2NrVUkoZXJyb3JCbG9jayhtLCBudWxsLCBwb3B1cC5zdHlsZShzaXplKSkpO1xyXG4gICAgaWYgKGlmcmFtZSlcclxuICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICQoJy5ibG9ja1VJIC5jbG9zZS1wb3B1cCcpLmNsaWNrKGZ1bmN0aW9uICgpIHsgJC51bmJsb2NrVUkoKTsgcmV0dXJuIGZhbHNlOyB9KTtcclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkNvbXBsZXRlKCkge1xyXG4gICAgLy8gRGlzYWJsZSBsb2FkaW5nXHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5ndGltZXIgfHwgdGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgLy8gVW5ibG9ja1xyXG4gICAgaWYgKHRoaXMuYXV0b1VuYmxvY2tMb2FkaW5nKSB7XHJcbiAgICAgICAgLy8gRG91YmxlIHVuLWxvY2ssIGJlY2F1c2UgYW55IG9mIHRoZSB0d28gc3lzdGVtcyBjYW4gYmVpbmcgdXNlZDpcclxuICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh0aGlzLmJveCk7XHJcbiAgICAgICAgdGhpcy5ib3gudW5ibG9jaygpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICB2YXIgY3R4ID0gdGhpcztcclxuICAgIC8vIFN1cHBvcnRlZCB0aGUgZ2VuZXJpYyBjdHguZWxlbWVudCBmcm9tIGpxdWVyeS5yZWxvYWRcclxuICAgIGlmIChjdHguZWxlbWVudCkgY3R4LmZvcm0gPSBjdHguZWxlbWVudDtcclxuICAgIC8vIFNwZWNpZmljIHN0dWZmIG9mIGFqYXhGb3Jtc1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgaWYgKCFkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkpIHtcclxuICAgICAgICAvLyBQb3N0ICdtYXliZScgd2FzIHdyb25nLCBodG1sIHdhcyByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgXHJcbiAgICAgICAgLy8gZm9ybSBjb250YWluZXI6IHRoZSBhamF4LWJveC5cclxuXHJcbiAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgICAgIC8vIEF2b2lkIGVtcHR5IGRvY3VtZW50cyBiZWluZyBwYXJzZWQgKHJhaXNlIGVycm9yKVxyXG4gICAgICAgIGlmICgkLnRyaW0oZGF0YSkpIHtcclxuICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGEgbWFsZm9ybWVkIGRvY3VtZW50IGlzIHJldHVybmVkOlxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKGRhdGEpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRm9yICdyZWxvYWQnIHN1cHBvcnQsIGNoZWNrIHRvbyB0aGUgY29udGV4dC5tb2RlLCBhbmQgYm90aCByZWxvYWQgb3IgYWpheEZvcm1zIGNoZWNrIGRhdGEgYXR0cmlidXRlIHRvb1xyXG4gICAgICAgIGN0eC5ib3hJc0NvbnRhaW5lciA9IGN0eC5ib3hJc0NvbnRhaW5lcjtcclxuICAgICAgICB2YXIgcmVwbGFjZUJveENvbnRlbnQgPVxyXG4gICAgICAgICAgKGN0eC5vcHRpb25zICYmIGN0eC5vcHRpb25zLm1vZGUgPT09ICdyZXBsYWNlLWNvbnRlbnQnKSB8fFxyXG4gICAgICAgICAgY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JztcclxuXHJcbiAgICAgICAgLy8gU3VwcG9ydCBmb3IgcmVsb2FkLCBhdm9pZGluZyBpbXBvcnRhbnQgYnVncyB3aXRoIHJlbG9hZGluZyBib3hlcyB0aGF0IGNvbnRhaW5zIGZvcm1zOlxyXG4gICAgICAgIC8vIElmIG9wZXJhdGlvbiBpcyBhIHJlbG9hZCwgZG9uJ3QgY2hlY2sgdGhlIGFqYXgtYm94XHJcbiAgICAgICAgdmFyIGpiID0gbmV3aHRtbDtcclxuICAgICAgICBpZiAoIWN0eC5pc1JlbG9hZCkge1xyXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHJldHVybmVkIGVsZW1lbnQgaXMgdGhlIGFqYXgtYm94LCBpZiBub3QsIGZpbmRcclxuICAgICAgICAgIC8vIHRoZSBlbGVtZW50IGluIHRoZSBuZXdodG1sOlxyXG4gICAgICAgICAgamIgPSBuZXdodG1sLmZpbHRlcignLmFqYXgtYm94Jyk7XHJcbiAgICAgICAgICBpZiAoamIubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgICBpZiAoIWN0eC5ib3hJc0NvbnRhaW5lciAmJiAhamIuaXMoJy5hamF4LWJveCcpKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWwuZmluZCgnLmFqYXgtYm94OmVxKDApJyk7XHJcbiAgICAgICAgICBpZiAoIWpiIHx8IGpiLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBhamF4LWJveCwgdXNlIGFsbCBlbGVtZW50IHJldHVybmVkOlxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KVxyXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBib3ggY29udGVudCB3aXRoIHRoZSBjb250ZW50IG9mIHRoZSByZXR1cm5lZCBib3hcclxuICAgICAgICAgICAgLy8gb3IgYWxsIGlmIHRoZXJlIGlzIG5vIGFqYXgtYm94IGluIHRoZSByZXN1bHQuXHJcbiAgICAgICAgICAgIGpiID0gamIuaXMoJy5hamF4LWJveCcpID8gamIuY29udGVudHMoKSA6IGpiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KSB7XHJcbiAgICAgICAgICBjdHguYm94LmVtcHR5KCkuYXBwZW5kKGpiKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGN0eC5ib3hJc0NvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAvLyBqYiBpcyBjb250ZW50IG9mIHRoZSBib3ggY29udGFpbmVyOlxyXG4gICAgICAgICAgICBjdHguYm94Lmh0bWwoamIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGJveCBpcyBjb250ZW50IHRoYXQgbXVzdCBiZSByZXBsYWNlZCBieSB0aGUgbmV3IGNvbnRlbnQ6XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVwbGFjZVdpdGgoamIpO1xyXG4gICAgICAgICAgICAvLyBhbmQgcmVmcmVzaCB0aGUgcmVmZXJlbmNlIHRvIGJveCB3aXRoIHRoZSBuZXcgZWxlbWVudFxyXG4gICAgICAgICAgICBjdHguYm94ID0gamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJdCBzdXBwb3J0cyBub3JtYWwgYWpheCBmb3JtcyBhbmQgc3ViZm9ybXMgdGhyb3VnaCBmaWVsZHNldC5hamF4XHJcbiAgICAgICAgaWYgKGN0eC5ib3guaXMoJ2Zvcm0uYWpheCcpIHx8IGN0eC5ib3guaXMoJ2ZpZWxkc2V0LmFqYXgnKSlcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveDtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmb3JtLmFqYXg6ZXEoMCknKTtcclxuICAgICAgICAgIGlmIChjdHguZm9ybS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmaWVsZHNldC5hamF4OmVxKDApJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gTW92ZSBmb2N1cyB0byB0aGUgZXJyb3JzIGFwcGVhcmVkIG9uIHRoZSBwYWdlIChpZiB0aGVyZSBhcmUpOlxyXG4gICAgICAgIHZhciB2YWxpZGF0aW9uU3VtbWFyeSA9IGpiLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRpb25TdW1tYXJ5Lmxlbmd0aClcclxuICAgICAgICAgIG1vdmVGb2N1c1RvKHZhbGlkYXRpb25TdW1tYXJ5KTtcclxuICAgICAgICAvLyBUT0RPOiBJdCBzZWVtcyB0aGF0IGl0IHJldHVybnMgYSBkb2N1bWVudC1mcmFnbWVudCBpbnN0ZWFkIG9mIGEgZWxlbWVudCBhbHJlYWR5IGluIGRvY3VtZW50XHJcbiAgICAgICAgLy8gZm9yIGN0eC5mb3JtIChtYXliZSBqYiB0b28/KSB3aGVuIHVzaW5nICogY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JyAqIFxyXG4gICAgICAgIC8vIChtYXliZSBvbiBvdGhlciBjYXNlcyB0b28/KS5cclxuICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIFtqYiwgY3R4LmZvcm0sIGp4XSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgbWVzc2FnZSwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCBjdHguZm9ybS5kYXRhKCdzdWNjZXNzLXBvc3QtbWVzc2FnZScpIHx8ICdEb25lISc7XHJcbiAgICBjdHguYm94LmJsb2NrKGluZm9CbG9jayhtZXNzYWdlLCB7XHJcbiAgICAgICAgY3NzOiBwb3B1cC5zdHlsZShwb3B1cC5zaXplKCdzbWFsbCcpKVxyXG4gICAgfSkpXHJcbiAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgXHJcbiAgICB9KTtcclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gc2hvd09rR29Qb3B1cChjdHgsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdiBjbGFzcz1cIm9rLWdvLWJveFwiLz4nKTtcclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxzcGFuIGNsYXNzPVwic3VjY2Vzcy1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLlN1Y2Nlc3NNZXNzYWdlKSk7XHJcbiAgICBpZiAoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSlcclxuICAgICAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWRkaXRpb25hbC1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKSk7XHJcblxyXG4gICAgdmFyIG9rQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gb2stYWN0aW9uIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjb2tcIi8+JykuYXBwZW5kKGRhdGEuT2tMYWJlbCk7XHJcbiAgICB2YXIgZ29CdG4gPSAnJztcclxuICAgIGlmIChkYXRhLkdvVVJMICYmIGRhdGEuR29MYWJlbCkge1xyXG4gICAgICAgIGdvQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gZ28tYWN0aW9uXCIvPicpLmF0dHIoJ2hyZWYnLCBkYXRhLkdvVVJMKS5hcHBlbmQoZGF0YS5Hb0xhYmVsKTtcclxuICAgICAgICAvLyBGb3JjaW5nIHRoZSAnY2xvc2UtYWN0aW9uJyBpbiBzdWNoIGEgd2F5IHRoYXQgZm9yIGludGVybmFsIGxpbmtzIHRoZSBwb3B1cCBnZXRzIGNsb3NlZCBpbiBhIHNhZmUgd2F5OlxyXG4gICAgICAgIGdvQnRuLmNsaWNrKGZ1bmN0aW9uICgpIHsgb2tCdG4uY2xpY2soKTsgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFjdGlvbnMgY2xlYXJmaXhcIi8+JykuYXBwZW5kKG9rQnRuKS5hcHBlbmQoZ29CdG4pKTtcclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGN0eC5ib3gsIG51bGwsIHtcclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpIHtcclxuICAgIC8vIElmIGlzIGEgSlNPTiByZXN1bHQ6XHJcbiAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBpZiAoY3R4LmJveClcclxuICAgICAgICAgICAgLy8gQ2xlYW4gcHJldmlvdXMgdmFsaWRhdGlvbiBlcnJvcnNcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY3R4LmJveCk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDA6IGdlbmVyYWwgc3VjY2VzcyBjb2RlLCBzaG93IG1lc3NhZ2Ugc2F5aW5nIHRoYXQgJ2FsbCB3YXMgZmluZSdcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDE6IGRvIGEgcmVkaXJlY3RcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAxKSB7XHJcbiAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDI6IHNob3cgbG9naW4gcG9wdXAgKHdpdGggdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDMpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDM6IHJlbG9hZCBjdXJyZW50IHBhZ2UgY29udGVudCB0byB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICAvLyBOb3RlOiB0byByZWxvYWQgc2FtZSB1cmwgcGFnZSBjb250ZW50LCBpcyBiZXR0ZXIgcmV0dXJuIHRoZSBodG1sIGRpcmVjdGx5IGZyb21cclxuICAgICAgICAgICAgLy8gdGhpcyBhamF4IHNlcnZlciByZXF1ZXN0LlxyXG4gICAgICAgICAgICAvL2NvbnRhaW5lci51bmJsb2NrKCk7IGlzIGJsb2NrZWQgYW5kIHVuYmxvY2tlZCBhZ2FpbiBieSB0aGUgcmVsb2FkIG1ldGhvZDpcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBjdHguYm94LnJlbG9hZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNCkge1xyXG4gICAgICAgICAgICAvLyBTaG93IFN1Y2Nlc3NNZXNzYWdlLCBhdHRhY2hpbmcgYW5kIGV2ZW50IGhhbmRsZXIgdG8gZ28gdG8gUmVkaXJlY3RVUkxcclxuICAgICAgICAgICAgY3R4LmJveC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQuUmVkaXJlY3RVUkwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuU3VjY2Vzc01lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDUpIHtcclxuICAgICAgICAgICAgLy8gQ2hhbmdlIG1haW4tYWN0aW9uIGJ1dHRvbiBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgYnRuID0gY3R4LmZvcm0uZmluZCgnLm1haW4tYWN0aW9uJyk7XHJcbiAgICAgICAgICAgIHZhciBkbXNnID0gYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpO1xyXG4gICAgICAgICAgICBpZiAoIWRtc2cpXHJcbiAgICAgICAgICAgICAgICBidG4uZGF0YSgnZGVmYXVsdC10ZXh0JywgYnRuLnRleHQoKSk7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBkYXRhLlJlc3VsdCB8fCBidG4uZGF0YSgnc3VjY2Vzcy1wb3N0LXRleHQnKSB8fCAnRG9uZSEnO1xyXG4gICAgICAgICAgICBidG4udGV4dChtc2cpO1xyXG4gICAgICAgICAgICAvLyBBZGRpbmcgc3VwcG9ydCB0byByZXNldCBidXR0b24gdGV4dCB0byBkZWZhdWx0IG9uZVxyXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBGaXJzdCBuZXh0IGNoYW5nZXMgaGFwcGVucyBvbiB0aGUgZm9ybTpcclxuICAgICAgICAgICAgJChjdHguZm9ybSkub25lKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgYnRuLnRleHQoYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgZm9yIGN1c3RvbSBoYW5kbGVyc1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA2KSB7XHJcbiAgICAgICAgICAgIC8vIE9rLUdvIGFjdGlvbnMgcG9wdXAgd2l0aCAnc3VjY2VzcycgYW5kICdhZGRpdGlvbmFsJyBtZXNzYWdlcy5cclxuICAgICAgICAgICAgc2hvd09rR29Qb3B1cChjdHgsIGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgNzogc2hvdyBtZXNzYWdlIHNheWluZyBjb250YWluZWQgYXQgZGF0YS5SZXN1bHQuTWVzc2FnZS5cclxuICAgICAgICAgICAgLy8gVGhpcyBjb2RlIGFsbG93IGF0dGFjaCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGluIGRhdGEuUmVzdWx0IHRvIGRpc3Rpbmd1aXNoXHJcbiAgICAgICAgICAgIC8vIGRpZmZlcmVudCByZXN1bHRzIGFsbCBzaG93aW5nIGEgbWVzc2FnZSBidXQgbWF5YmUgbm90IGJlaW5nIGEgc3VjY2VzcyBhdCBhbGxcclxuICAgICAgICAgICAgLy8gYW5kIG1heWJlIGRvaW5nIHNvbWV0aGluZyBtb3JlIGluIHRoZSB0cmlnZ2VyZWQgZXZlbnQgd2l0aCB0aGUgZGF0YSBvYmplY3QuXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0Lk1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA4KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgdmFsaWRhdGlvbiBtZXNzYWdlc1xyXG4gICAgICAgICAgICB2YXIgdmFsaWRhdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpO1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uSGVscGVyLnNldEVycm9ycyhjdHguZm9ybSwgZGF0YS5SZXN1bHQuRXJyb3JzKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA+IDEwMCkge1xyXG4gICAgICAgICAgICAvLyBVc2VyIENvZGU6IHRyaWdnZXIgY3VzdG9tIGV2ZW50IHRvIG1hbmFnZSByZXN1bHRzOlxyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwgangsIGN0eF0pO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIGRhdGEuQ29kZSA8IDBcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYW4gZXJyb3IgY29kZS5cclxuXHJcbiAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0uZ2V0KDApLCBjdHguY2hhbmdlZEVsZW1lbnRzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBcIkVycm9yOiBcIiArIGRhdGEuQ29kZSArIFwiOiBcIiArIEpTT04uc3RyaW5naWZ5KGRhdGEuUmVzdWx0ID8gKGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA6IGRhdGEuUmVzdWx0KSA6ICcnKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbigkKCc8ZGl2Lz4nKS5hcHBlbmQobWVzc2FnZSksIGN0eC5ib3gsIG51bGwsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVycm9yOiBsY09uRXJyb3IsXHJcbiAgICAgICAgc3VjY2VzczogbGNPblN1Y2Nlc3MsXHJcbiAgICAgICAgY29tcGxldGU6IGxjT25Db21wbGV0ZSxcclxuICAgICAgICBkb0pTT05BY3Rpb246IGRvSlNPTkFjdGlvblxyXG4gICAgfTtcclxufSIsIi8qIEZvcm1zIHN1Ym1pdHRlZCB2aWEgQUpBWCAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgY2FsbGJhY2tzID0gcmVxdWlyZSgnLi9hamF4Q2FsbGJhY2tzJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpLFxyXG4gICAgdmFsaWRhdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpO1xyXG5cclxualF1ZXJ5ID0gJDtcclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5ncywgd2lsbCBiZSB1cGRhdGVkIG9uIGluaXQgYnV0IGlzIGFjY2Vzc2VkXHJcbi8vIHRocm91Z2ggY2xvc3VyZSBmcm9tIGFsbCBmdW5jdGlvbnMuXHJcbi8vIE5PVEU6IGlzIHN0YXRpYywgZG9lc24ndCBhbGxvd3MgbXVsdGlwbGUgY29uZmlndXJhdGlvbiwgb25lIGluaXQgY2FsbCByZXBsYWNlIHByZXZpb3VzXHJcbi8vIERlZmF1bHRzOlxyXG52YXIgc2V0dGluZ3MgPSB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IDAsXHJcbiAgICBlbGVtZW50OiBkb2N1bWVudFxyXG59O1xyXG5cclxuLy8gQWRhcHRlZCBjYWxsYmFja3NcclxuZnVuY3Rpb24gYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyKCkge1xyXG4gICAgY2FsbGJhY2tzLmNvbXBsZXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFqYXhFcnJvclBvcHVwSGFuZGxlcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0sIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIENvbW1vbiBsb2dpY1xyXG4gICAgY2FsbGJhY2tzLmVycm9yLmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIoKSB7XHJcbiAgY2FsbGJhY2tzLnN1Y2Nlc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuLyoqXHJcbiAgUGVyZm9ybXMgdGhlIHZhbGlkYXRpb24gb24gdGhlIGZvcm0gb3Igc3ViZm9ybSBhcyBkZXRlcm1pbmVcclxuICB0aGUgdmFsdWVzIGluIHRoZSBjb250ZXh0IChAY3R4KSwgcmV0dXJuaW5nIHRydWUgZm9yIHN1Y2Nlc3NcclxuICBhbmQgZmFsc2UgZm9yIHNvbWUgZXJyb3IgKGVsZW1lbnRzIGdldCBtYXJrZWQgd2l0aCB0aGUgZXJyb3IsXHJcbiAganVzdCB0aGUgY2FsbGVyIG11c3Qgc3RvcCBhbnkgdGFzayBvbiBmYWxzZSkuXHJcbioqL1xyXG5mdW5jdGlvbiB2YWxpZGF0ZUZvcm0oY3R4KSB7XHJcbiAgLy8gVmFsaWRhdGlvbnNcclxuICB2YXIgdmFsaWRhdGlvblBhc3NlZCA9IHRydWU7XHJcbiAgLy8gVG8gc3VwcG9ydCBzdWItZm9ybXMgdGhyb3VoIGZpZWxkc2V0LmFqYXgsIHdlIG11c3QgZXhlY3V0ZSB2YWxpZGF0aW9ucyBhbmQgdmVyaWZpY2F0aW9uXHJcbiAgLy8gaW4gdHdvIHN0ZXBzIGFuZCB1c2luZyB0aGUgcmVhbCBmb3JtIHRvIGxldCB2YWxpZGF0aW9uIG1lY2hhbmlzbSB3b3JrXHJcbiAgdmFyIGlzU3ViZm9ybSA9IGN0eC5mb3JtLmlzKCdmaWVsZHNldC5hamF4Jyk7XHJcbiAgdmFyIGFjdHVhbEZvcm0gPSBpc1N1YmZvcm0gPyBjdHguZm9ybS5jbG9zZXN0KCdmb3JtJykgOiBjdHguZm9ybSxcclxuICAgICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBuZXcgalF1ZXJ5KCksXHJcbiAgICAgIGRpc2FibGVkRmllbGRzID0gbmV3IGpRdWVyeSgpO1xyXG5cclxuICAvLyBPbiBzdWJmb3JtIHZhbGlkYXRpb24sIHdlIGRvbid0IHdhbnQgdGhlIG91dHNpZGUgc3ViZm9ybSBlbGVtZW50cyBhbmQgdmFsaWRhdGlvbi1zdW1tYXJ5IGNvbnRyb2xzIHRvIGJlIGFmZmVjdGVkXHJcbiAgLy8gYnkgdGhpcyB2YWxpZGF0aW9uICh0byBhdm9pZCB0byBzaG93IGVycm9ycyB0aGVyZSB0aGF0IGRvZXNuJ3QgaW50ZXJlc3QgdG8gdGhlIHJlc3Qgb2YgdGhlIGZvcm0pXHJcbiAgLy8gVG8gZnVsbGZpbGwgdGhpcyByZXF1aXNpdCwgd2UgbmVlZCB0byBoaWRlIGl0IGZvciB0aGUgdmFsaWRhdG9yIGZvciBhIHdoaWxlIGFuZCBsZXQgb25seSBhZmZlY3RcclxuICAvLyBhbnkgbG9jYWwgc3VtbWFyeSAoaW5zaWRlIHRoZSBzdWJmb3JtKS5cclxuICAvLyBUaGUgc2FtZSBmb3IgZm9ybSBlbGVtZW50cyBvdXRzaWRlIHRoZSBzdWJmb3JtLCB3ZSBkb24ndCB3YW50IGl0cyBlcnJvcnMgZm9yIG5vdy5cclxuICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICB2YXIgb3V0c2lkZUVsZW1lbnRzID0gKGZ1bmN0aW9uKGYpIHtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBPbmx5IHRob3NlIHRoYXQgYXJlIG91dHNpZGUgdGhlIHN1YmZvcm1cclxuICAgICAgICByZXR1cm4gISQuY29udGFpbnMoZiwgdGhpcyk7XHJcbiAgICAgIH07XHJcbiAgICB9KShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIGRpc2FibGVkU3VtbWFyaWVzID0gYWN0dWFsRm9ybVxyXG4gICAgLmZpbmQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJylcclxuICAgIC5maWx0ZXIob3V0c2lkZUVsZW1lbnRzKVxyXG4gICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgLy8gKGluIG90aGVyIHdvcmRzLCB1c2luZyAnZGF0YScgd2lsbCBub3Qgd29yaylcclxuICAgIC5hdHRyKCdkYXRhLXZhbG1zZy1zdW1tYXJ5JywgJ2ZhbHNlJyk7XHJcblxyXG4gICAgZGlzYWJsZWRGaWVsZHMgPSBhY3R1YWxGb3JtXHJcbiAgICAuZmluZCgnW2RhdGEtdmFsPXRydWVdJylcclxuICAgIC5maWx0ZXIob3V0c2lkZUVsZW1lbnRzKVxyXG4gICAgLmF0dHIoJ2RhdGEtdmFsJywgJ2ZhbHNlJyk7XHJcbiAgfVxyXG5cclxuICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICB2YXIgdmFsb2JqZWN0ID0gYWN0dWFsRm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycyhjdHguZm9ybSk7XHJcbiAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZS5cclxuICAvLyBDdXN0b20gdmFsaWRhdGlvbiBjYW4gYmUgYXR0YWNoZWQgdG8gZm9ybXMgb3IgZmllbGRzZXQsIGJ1dFxyXG4gIC8vIHRvIHN1cHBvcnQgc3ViZm9ybXMsIG9ubHkgZXhlY3V0ZSBpbiB0aGUgY3R4LmZvcm0gZWxlbWVudCAoY2FuIGJlIFxyXG4gIC8vIGEgZmllbHNldCBzdWJmb3JtKSBhbmQgYW55IGNoaWxkcmVuIGZpZWxkc2V0LlxyXG4gIGN0eC5mb3JtLmFkZChjdHguZm9ybS5maW5kKCdmaWVsZHNldCcpKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjdXN2YWwgPSAkKHRoaXMpLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgIGlmIChjdXN2YWwgJiYgY3VzdmFsLnZhbGlkYXRlICYmIGN1c3ZhbC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgICAgdmFsaWRhdGlvblBhc3NlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3Jtcywgd2UgbXVzdCBjaGVjayB0aGF0IHZhbGlkYXRpb25zIGVycm9ycyBoYXBwZW5lZCBpbnNpZGUgdGhlXHJcbiAgLy8gc3ViZm9ybSBhbmQgbm90IGluIG90aGVyIGVsZW1lbnRzLCB0byBkb24ndCBzdG9wIHN1Ym1pdCBvbiBub3QgcmVsYXRlZCBlcnJvcnMuXHJcbiAgLy8gKHdlIGF2b2lkIGV4ZWN1dGUgdmFsaWRhdGlvbiBvbiB0aGF0IGVsZW1lbnRzIGJ1dCBjb3VsZCBoYXBwZW4gYSBwcmV2aW91cyB2YWxpZGF0aW9uKVxyXG4gIC8vIEp1c3QgbG9vayBmb3IgbWFya2VkIGVsZW1lbnRzOlxyXG4gIGlmIChpc1N1YmZvcm0gJiYgY3R4LmZvcm0uZmluZCgnLmlucHV0LXZhbGlkYXRpb24tZXJyb3InKS5sZW5ndGgpXHJcbiAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcblxyXG4gIC8vIFJlLWVuYWJsZSBhZ2FpbiB0aGF0IHN1bW1hcmllcyBwcmV2aW91c2x5IGRpc2FibGVkXHJcbiAgaWYgKGlzU3ViZm9ybSkge1xyXG4gICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgLy8gKGluIG90aGVyIHdvcmRzLCB1c2luZyAnZGF0YScgd2lsbCBub3Qgd29yaylcclxuICAgIGRpc2FibGVkU3VtbWFyaWVzLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAndHJ1ZScpO1xyXG4gICAgZGlzYWJsZWRGaWVsZHMuYXR0cignZGF0YS12YWwnLCAndHJ1ZScpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHZhbGlkYXRpb25QYXNzZWQ7XHJcbn1cclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiogQWpheCBGb3JtcyBnZW5lcmljIGZ1bmN0aW9uLlxyXG4qIFJlc3VsdCBleHBlY3RlZCBpczpcclxuKiAtIGh0bWwsIGZvciB2YWxpZGF0aW9uIGVycm9ycyBmcm9tIHNlcnZlciwgcmVwbGFjaW5nIGN1cnJlbnQgLmFqYXgtYm94IGNvbnRlbnRcclxuKiAtIGpzb24sIHdpdGggc3RydWN0dXJlOiB7IENvZGU6IGludGVnZXItbnVtYmVyLCBSZXN1bHQ6IHN0cmluZy1vci1vYmplY3QgfVxyXG4qICAgQ29kZSBudW1iZXJzOlxyXG4qICAgIC0gTmVnYXRpdmU6IGVycm9ycywgd2l0aCBhIFJlc3VsdCBvYmplY3QgeyBFcnJvck1lc3NhZ2U6IHN0cmluZyB9XHJcbiogICAgLSBaZXJvOiBzdWNjZXNzIHJlc3VsdCwgaXQgc2hvd3MgYSBtZXNzYWdlIHdpdGggY29udGVudDogUmVzdWx0IHN0cmluZywgZWxzZSBmb3JtIGRhdGEgYXR0cmlidXRlICdzdWNjZXNzLXBvc3QtbWVzc2FnZScsIGVsc2UgYSBnZW5lcmljIG1lc3NhZ2VcclxuKiAgICAtIDE6IHN1Y2Nlc3MgcmVzdWx0LCBSZXN1bHQgY29udGFpbnMgYSBVUkwsIHRoZSBwYWdlIHdpbGwgYmUgcmVkaXJlY3RlZCB0byB0aGF0LlxyXG4qICAgIC0gTWFqb3IgMTogc3VjY2VzcyByZXN1bHQsIHdpdGggY3VzdG9tIGhhbmRsZXIgdGhyb3VnaHQgdGhlIGZvcm0gZXZlbnQgJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJy5cclxuKi9cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VibWl0SGFuZGxlcihldmVudCkge1xyXG4gICAgLy8gQ29udGV4dCB2YXIsIHVzZWQgYXMgYWpheCBjb250ZXh0OlxyXG4gICAgdmFyIGN0eCA9IHt9O1xyXG4gICAgLy8gRGVmYXVsdCBkYXRhIGZvciByZXF1aXJlZCBwYXJhbXM6XHJcbiAgICBjdHguZm9ybSA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5mb3JtIDogbnVsbCkgfHwgJCh0aGlzKTtcclxuICAgIGN0eC5ib3ggPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuYm94IDogbnVsbCkgfHwgY3R4LmZvcm0uY2xvc2VzdChcIi5hamF4LWJveFwiKTtcclxuICAgIHZhciBhY3Rpb24gPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuYWN0aW9uIDogbnVsbCkgfHwgY3R4LmZvcm0uYXR0cignYWN0aW9uJykgfHwgJyc7XHJcblxyXG4gICAgLy8gQ2hlY2sgdmFsaWRhdGlvblxyXG4gICAgaWYgKHZhbGlkYXRlRm9ybShjdHgpID09PSBmYWxzZSkge1xyXG4gICAgICAvLyBWYWxpZGF0aW9uIGZhaWxlZCwgc3VibWl0IGNhbm5vdCBjb250aW51ZSwgb3V0IVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGF0YSBzYXZlZDpcclxuICAgIGN0eC5jaGFuZ2VkRWxlbWVudHMgPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuY2hhbmdlZEVsZW1lbnRzIDogbnVsbCkgfHwgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoY3R4LmZvcm0uZ2V0KDApKTtcclxuXHJcbiAgICAvLyBOb3RpZmljYXRpb24gZXZlbnQgdG8gYWxsb3cgc2NyaXB0cyB0byBob29rIGFkZGl0aW9uYWwgdGFza3MgYmVmb3JlIHNlbmQgZGF0YVxyXG4gICAgY3R4LmZvcm0udHJpZ2dlcigncHJlc3VibWl0JywgW2N0eF0pO1xyXG5cclxuICAgIC8vIExvYWRpbmcsIHdpdGggcmV0YXJkXHJcbiAgICBjdHgubG9hZGluZ3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY3R4LmJveC5ibG9jayhibG9ja1ByZXNldHMubG9hZGluZyk7XHJcbiAgICB9LCBzZXR0aW5ncy5sb2FkaW5nRGVsYXkpO1xyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgdmFyIGRhdGEgPSBjdHguZm9ybS5maW5kKCc6aW5wdXQnKS5zZXJpYWxpemUoKTtcclxuXHJcbiAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogKGFjdGlvbiksXHJcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgY29udGV4dDogY3R4LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyLFxyXG4gICAgICAgIGVycm9yOiBhamF4RXJyb3JQb3B1cEhhbmRsZXIsXHJcbiAgICAgICAgY29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU3RvcCBub3JtYWwgUE9TVDpcclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLy8gUHVibGljIGluaXRpYWxpemF0aW9uXHJcbmZ1bmN0aW9uIGluaXRBamF4Rm9ybXMob3B0aW9ucykge1xyXG4gICAgJC5leHRlbmQodHJ1ZSwgc2V0dGluZ3MsIG9wdGlvbnMpO1xyXG5cclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIHRvIG1hbmFnZSBhamF4IGZvcm1zICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdzdWJtaXQnLCAnZm9ybS5hamF4JywgYWpheEZvcm1zU3VibWl0SGFuZGxlcik7XHJcbiAgICAvKiBBdHRhY2ggYSBkZWxlZ2F0ZWQgaGFuZGxlciBmb3IgYSBzcGVjaWFsIGFqYXggZm9ybSBjYXNlOiBzdWJmb3JtcywgdXNpbmcgZmllbGRzZXRzLiAqL1xyXG4gICAgJChzZXR0aW5ncy5lbGVtZW50KS5vbignY2xpY2snLCAnZmllbGRzZXQuYWpheCAuYWpheC1maWVsZHNldC1zdWJtaXQnLFxyXG4gICAgICAgIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgdmFyIGZvcm0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0LmFqYXgnKTtcclxuXHJcbiAgICAgICAgICBldmVudC5kYXRhID0ge1xyXG4gICAgICAgICAgICBmb3JtOiBmb3JtLFxyXG4gICAgICAgICAgICBib3g6IGZvcm0uY2xvc2VzdCgnLmFqYXgtYm94JyksXHJcbiAgICAgICAgICAgIGFjdGlvbjogZm9ybS5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpLFxyXG4gICAgICAgICAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgICAgICAgICBjaGFuZ2VkRWxlbWVudHM6IGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uZ2V0KDApLCBmb3JtLmZpbmQoJzppbnB1dFtuYW1lXScpKVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHJldHVybiBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKGV2ZW50KTtcclxuICAgICAgICB9XHJcbiAgICApO1xyXG59XHJcbi8qIFVOVVNFRD9cclxuZnVuY3Rpb24gYWpheEZvcm1NZXNzYWdlT25IdG1sUmV0dXJuZWRXaXRob3V0VmFsaWRhdGlvbkVycm9ycyhmb3JtLCBtZXNzYWdlKSB7XHJcbiAgICB2YXIgJHQgPSAkKGZvcm0pO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gZm9ybSBlcnJvcnMsIHNob3cgYSBzdWNjZXNzZnVsIG1lc3NhZ2VcclxuICAgIGlmICgkdC5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgJHQuYmxvY2soaW5mb0Jsb2NrKG1lc3NhZ2UsIHtcclxuICAgICAgICAgICAgY3NzOiBwb3B1cFN0eWxlKHBvcHVwU2l6ZSgnc21hbGwnKSlcclxuICAgICAgICB9KSlcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHsgJHQudW5ibG9jaygpOyByZXR1cm4gZmFsc2U7IH0pO1xyXG4gICAgfVxyXG59XHJcbiovXHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdDogaW5pdEFqYXhGb3JtcyxcclxuICAgICAgICBvblN1Y2Nlc3M6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyLFxyXG4gICAgICAgIG9uRXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlcixcclxuICAgICAgICBvbkNvbXBsZXRlOiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXJcclxuICAgIH07IiwiLyogQXV0byBjYWxjdWxhdGUgc3VtbWFyeSBvbiBET00gdGFnZ2luZyB3aXRoIGNsYXNzZXMgdGhlIGVsZW1lbnRzIGludm9sdmVkLlxyXG4gKi9cclxudmFyIG51ID0gcmVxdWlyZSgnLi9udW1iZXJVdGlscycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzKCkge1xyXG4gICAgJCgndGFibGUuY2FsY3VsYXRlLWl0ZW1zLXRvdGFscycpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmRhdGEoJ2NhbGN1bGF0ZS1pdGVtcy10b3RhbHMtaW5pdGlhbGl6YXRlZCcpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgZnVuY3Rpb24gY2FsY3VsYXRlUm93KCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgdHIgPSAkdC5jbG9zZXN0KCd0cicpO1xyXG4gICAgICAgICAgICB2YXIgaXAgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcHJpY2UnKTtcclxuICAgICAgICAgICAgdmFyIGlxID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXF1YW50aXR5Jyk7XHJcbiAgICAgICAgICAgIHZhciBpdCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbCcpO1xyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihudS5nZXRNb25leU51bWJlcihpcCkgKiBudS5nZXRNb25leU51bWJlcihpcSwgMSksIGl0KTtcclxuICAgICAgICAgICAgdHIudHJpZ2dlcignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkKHRoaXMpLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZSwgLmNhbGN1bGF0ZS1pdGVtLXF1YW50aXR5Jykub24oJ2NoYW5nZScsIGNhbGN1bGF0ZVJvdyk7XHJcbiAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmRhdGEoJ2NhbGN1bGF0ZS1pdGVtcy10b3RhbHMtaW5pdGlhbGl6YXRlZCcsIHRydWUpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldHVwQ2FsY3VsYXRlU3VtbWFyeShmb3JjZSkge1xyXG4gICAgJCgnLmNhbGN1bGF0ZS1zdW1tYXJ5JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGMgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICghZm9yY2UgJiYgYy5kYXRhKCdjYWxjdWxhdGUtc3VtbWFyeS1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB2YXIgcyA9IGMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnknKTtcclxuICAgICAgICB2YXIgZCA9IGMuZmluZCgndGFibGUuY2FsY3VsYXRlLXN1bW1hcnktZ3JvdXAnKTtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjKCkge1xyXG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwLCBmZWUgPSAwLCBkdXJhdGlvbiA9IDA7XHJcbiAgICAgICAgICAgIHZhciBncm91cHMgPSB7fTtcclxuICAgICAgICAgICAgZC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBncm91cFRvdGFsID0gMDtcclxuICAgICAgICAgICAgICAgIHZhciBhbGxDaGVja2VkID0gJCh0aGlzKS5pcygnLmNhbGN1bGF0ZS1hbGwtaXRlbXMnKTtcclxuICAgICAgICAgICAgICAgICQodGhpcykuZmluZCgndHInKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbSA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFsbENoZWNrZWQgfHwgaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tY2hlY2tlZCcpLmlzKCc6Y2hlY2tlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwVG90YWwgKz0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tdG90YWw6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxID0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHk6ZXEoMCknKSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZlZSArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1mZWU6ZXEoMCknKSkgKiBxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1kdXJhdGlvbjplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0b3RhbCArPSBncm91cFRvdGFsO1xyXG4gICAgICAgICAgICAgICAgZ3JvdXBzWyQodGhpcykuZGF0YSgnY2FsY3VsYXRpb24tc3VtbWFyeS1ncm91cCcpXSA9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cFRvdGFsLCAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0JykuZmluZCgnLmdyb3VwLXRvdGFsLXByaWNlJykpO1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZHVyYXRpb24sICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtZHVyYXRpb24nKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gU2V0IHN1bW1hcnkgdG90YWwgdmFsdWVcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIodG90YWwsIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktdG90YWwnKSk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGZlZSwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS1mZWUnKSk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBldmVyeSBncm91cCB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBmb3IgKHZhciBnIGluIGdyb3Vwcykge1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZ3JvdXBzW2ddLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwLScgKyBnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZC5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tY2hlY2tlZCcpLmNoYW5nZShjYWxjKTtcclxuICAgICAgICBkLm9uKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCBjYWxjKTtcclxuICAgICAgICBjYWxjKCk7XHJcbiAgICAgICAgYy5kYXRhKCdjYWxjdWxhdGUtc3VtbWFyeS1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIFVwZGF0ZSB0aGUgZGV0YWlsIG9mIGEgcHJpY2luZyBzdW1tYXJ5LCBvbmUgZGV0YWlsIGxpbmUgcGVyIHNlbGVjdGVkIGl0ZW1cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkoKSB7XHJcbiAgICAkKCcucHJpY2luZy1zdW1tYXJ5LmRldGFpbGVkJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgJGQgPSAkcy5maW5kKCd0Ym9keS5kZXRhaWwnKSxcclxuICAgICAgICAgICAgJHQgPSAkcy5maW5kKCd0Ym9keS5kZXRhaWwtdHBsJykuY2hpbGRyZW4oJ3RyOmVxKDApJyksXHJcbiAgICAgICAgICAgICRjID0gJHMuY2xvc2VzdCgnZm9ybScpLFxyXG4gICAgICAgICAgICAkaXRlbXMgPSAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0nKTtcclxuXHJcbiAgICAgICAgLy8gRG8gaXQhXHJcbiAgICAgICAgLy8gUmVtb3ZlIG9sZCBsaW5lc1xyXG4gICAgICAgICRkLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gQ3JlYXRlIG5ldyBvbmVzXHJcbiAgICAgICAgJGl0ZW1zLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBHZXQgdmFsdWVzXHJcbiAgICAgICAgICAgIHZhciAkaSA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBjaGVja2VkID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNoZWNrZWQnKS5wcm9wKCdjaGVja2VkJyk7XHJcbiAgICAgICAgICAgIGlmIChjaGVja2VkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29uY2VwdCA9ICRpLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1jb25jZXB0JykudGV4dCgpLFxyXG4gICAgICAgICAgICAgICAgICAgIHByaWNlID0gbnUuZ2V0TW9uZXlOdW1iZXIoJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLXByaWNlOmVxKDApJykpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHJvdyBhbmQgc2V0IHZhbHVlc1xyXG4gICAgICAgICAgICAgICAgdmFyICRyb3cgPSAkdC5jbG9uZSgpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2RldGFpbC10cGwnKVxyXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdkZXRhaWwnKTtcclxuICAgICAgICAgICAgICAgICRyb3cuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KGNvbmNlcHQpO1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIocHJpY2UsICRyb3cuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLXByaWNlJykpO1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRvIHRoZSB0YWJsZVxyXG4gICAgICAgICAgICAgICAgJGQuYXBwZW5kKCRyb3cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBzZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkoKSB7XHJcbiAgICB2YXIgJGMgPSAkKCcucHJpY2luZy1zdW1tYXJ5LmRldGFpbGVkJykuY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgLy8gSW5pdGlhbCBjYWxjdWxhdGlvblxyXG4gICAgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpO1xyXG4gICAgLy8gQ2FsY3VsYXRlIG9uIHJlbGV2YW50IGZvcm0gY2hhbmdlc1xyXG4gICAgJGMuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNoZWNrZWQnKS5jaGFuZ2UodXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbiAgICAvLyBTdXBwb3J0IGZvciBsY1NldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyBldmVudFxyXG4gICAgJGMub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkpO1xyXG59XHJcblxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb25UYWJsZUl0ZW1zOiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMsXHJcbiAgICAgICAgb25TdW1tYXJ5OiBzZXR1cENhbGN1bGF0ZVN1bW1hcnksXHJcbiAgICAgICAgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSxcclxuICAgICAgICBvbkRldGFpbGVkUHJpY2luZ1N1bW1hcnk6IHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeVxyXG4gICAgfTsiLCIvKiBGb2N1cyB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgZG9jdW1lbnQgKG9yIGluIEBjb250YWluZXIpXHJcbndpdGggdGhlIGh0bWw1IGF0dHJpYnV0ZSAnYXV0b2ZvY3VzJyAob3IgYWx0ZXJuYXRpdmUgQGNzc1NlbGVjdG9yKS5cclxuSXQncyBmaW5lIGFzIGEgcG9seWZpbGwgYW5kIGZvciBhamF4IGxvYWRlZCBjb250ZW50IHRoYXQgd2lsbCBub3RcclxuZ2V0IHRoZSBicm93c2VyIHN1cHBvcnQgb2YgdGhlIGF0dHJpYnV0ZS5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGF1dG9Gb2N1cyhjb250YWluZXIsIGNzc1NlbGVjdG9yKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCk7XHJcbiAgICBjb250YWluZXIuZmluZChjc3NTZWxlY3RvciB8fCAnW2F1dG9mb2N1c10nKS5mb2N1cygpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGF1dG9Gb2N1czsiLCIvKiogQXV0by1maWxsIG1lbnUgc3ViLWl0ZW1zIHVzaW5nIHRhYmJlZCBwYWdlcyAtb25seSB3b3JrcyBmb3IgY3VycmVudCBwYWdlIGl0ZW1zLSAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYXV0b2ZpbGxTdWJtZW51KCkge1xyXG4gICAgJCgnLmF1dG9maWxsLXN1Ym1lbnUgLmN1cnJlbnQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcGFyZW50bWVudSA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgc3VibWVudSBlbGVtZW50cyBmcm9tIHRhYnMgbWFya2VkIHdpdGggY2xhc3MgJ2F1dG9maWxsLXN1Ym1lbnUtaXRlbXMnXHJcbiAgICAgICAgdmFyIGl0ZW1zID0gJCgnLmF1dG9maWxsLXN1Ym1lbnUtaXRlbXMgbGk6bm90KC5yZW1vdmFibGUpJyk7XHJcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgaXRlbXMsIGNyZWF0ZSB0aGUgc3VibWVudSBjbG9uaW5nIGl0IVxyXG4gICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciBzdWJtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xyXG4gICAgICAgICAgICBwYXJlbnRtZW51LmFwcGVuZChzdWJtZW51KTtcclxuICAgICAgICAgICAgLy8gQ2xvbmluZyB3aXRob3V0IGV2ZW50czpcclxuICAgICAgICAgICAgdmFyIG5ld2l0ZW1zID0gaXRlbXMuY2xvbmUoZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgJChzdWJtZW51KS5hcHBlbmQobmV3aXRlbXMpO1xyXG5cclxuICAgICAgICAgICAgLy8gV2UgbmVlZCBhdHRhY2ggZXZlbnRzIHRvIG1haW50YWluIHRoZSB0YWJiZWQgaW50ZXJmYWNlIHdvcmtpbmdcclxuICAgICAgICAgICAgLy8gTmV3IEl0ZW1zIChjbG9uZWQpIG11c3QgY2hhbmdlIHRhYnM6XHJcbiAgICAgICAgICAgIG5ld2l0ZW1zLmZpbmQoXCJhXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgaW4gdGhlIG9yaWdpbmFsIGl0ZW1cclxuICAgICAgICAgICAgICAgICQoXCJhW2hyZWY9J1wiICsgdGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpICsgXCInXVwiLCBpdGVtcykuY2xpY2soKTtcclxuICAgICAgICAgICAgICAgIC8vIENoYW5nZSBtZW51OlxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKFwiYVwiKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICAgICAgLy8gU3RvcCBldmVudDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIE9yaWdpbmFsIGl0ZW1zIG11c3QgY2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgIGl0ZW1zLmZpbmQoXCJhXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG5ld2l0ZW1zLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50JykuXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIoXCIqW2hyZWY9J1wiICsgdGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpICsgXCInXVwiKS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuTWFuYWdlIGFsbCB0aGF0IGV2ZW50cyBhdHRhY2hlZCB0byBkYXRlcyBtYWRlIHVuYXZhaWxhYmxlIGJ5IHRoZSB1c2VyXHJcbnRvIG5vdGlmeSBhYm91dCB3aGF0IHRoYXQgbWVhbnMuXHJcblxyXG5NYWRlIGZvciB1c2UgaW4gdGhlIE1vbnRobHkgY2FsZW5kYXIsIG1heWJlIHJldXNhYmxlLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBvYmplY3RVdGlscyA9IHJlcXVpcmUoJy4vb2JqZWN0VXRpbHMnKTtcclxucmVxdWlyZShcImRhdGUtZm9ybWF0LWxpdGVcIik7XHJcblxyXG4vKipcclxuVGhlIEBlbGVtZW50IG11c3QgYmUgYSBkb20gZWxlbWVudCBjb250YWluaW5nIHRoYXQgd2lsbCBjb250YWluIHRoZSBpbmZvcm1hdGlvblxyXG5hbmQgd2lsbCB1c2UgYW4gdWwgZWxlbWVudCB0byBsaXN0IG5vdGlmaWNhdGlvbnMuIFRoZSBlbGVtZW50IHdpbGwgYmUgaGlkZGVuXHJcbmluaXRpYWxseSBhbmQgYW55IHRpbWUgdGhhdCwgb24gcmVuZGVyaW5nLCB0aGVyZSBhcmUgbm90IG5vdGlmaWNhdGlvbnMuXHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEJvb2tpbmdzTm90aWZpY2F0aW9uKGVsZW1lbnQpIHtcclxuXHJcbiAgdGhpcy4kZWwgPSAkKGVsZW1lbnQpO1xyXG4gIHRoaXMuJGxpc3QgPSB0aGlzLiRlbC5maW5kKCd1bCcpO1xyXG4gIGlmICghdGhpcy4kbGlzdC5sZW5ndGgpXHJcbiAgICB0aGlzLiRsaXN0ID0gJCgnPHVsLz4nKS5hcHBlbmRUbyh0aGlzLiRlbCk7XHJcblxyXG4gIHRoaXMucmVnaXN0ZXJlZCA9IHt9O1xyXG5cclxuICB0aGlzLnJlZ2lzdGVyID0gZnVuY3Rpb24gcmVnaXN0ZXIodG9nZ2xlLCBkYXRhLCBzdHJEYXRlKSB7XHJcbiAgICB2YXIgbCA9IHRoaXMucmVnaXN0ZXJlZDtcclxuICAgIGlmICh0b2dnbGUpIHtcclxuICAgICAgLy8gcmVnaXN0ZXIgKGlmIHNvbWV0aGluZylcclxuICAgICAgdmFyIGV2cyA9IGRhdGEuc2xvdHNbc3RyRGF0ZV0uZXZlbnRzSWRzO1xyXG4gICAgICBpZiAoZXZzKSB7XHJcbiAgICAgICAgbFtzdHJEYXRlXSA9IG9iamVjdFV0aWxzLmZpbHRlclByb3BlcnRpZXMoZGF0YS5ldmVudHMsIGZ1bmN0aW9uIChrKSB7IHJldHVybiBldnMuaW5kZXhPZihrKSAhPSAtMTsgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHVucmVnaXN0ZXJcclxuICAgICAgZGVsZXRlIGxbc3RyRGF0ZV07XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XHJcbiAgICAvLyBSZW5ldyB0aGUgbGlzdFxyXG4gICAgdGhpcy4kbGlzdC5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG5cclxuICAgIHZhciBoYXNOb3RpZmljYXRpb25zID0gZmFsc2U7XHJcblxyXG4gICAgZm9yICh2YXIgc3RyRGF0ZSBpbiB0aGlzLnJlZ2lzdGVyZWQpIHtcclxuICAgICAgaWYgKCF0aGlzLnJlZ2lzdGVyZWQuaGFzT3duUHJvcGVydHkoc3RyRGF0ZSkpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMucmVnaXN0ZXJlZFtzdHJEYXRlXTtcclxuICAgICAgdmFyIGRhdGUgPSBkYXRlSVNPLnBhcnNlKHN0ckRhdGUpLmZvcm1hdCgnRERERCwgTU1NIEQnKTtcclxuICAgICAgdmFyIG1zZyA9ICQoJzxzcGFuLz4nKS50ZXh0KGRhdGUgKyBcIjogXCIpLm91dGVySHRtbCgpO1xyXG5cclxuICAgICAgdmFyIGV2ZW50c0h0bWwgPSBbXTtcclxuICAgICAgZm9yICh2YXIgcCBpbiBldmVudHMpIHtcclxuICAgICAgICBpZiAoIWV2ZW50cy5oYXNPd25Qcm9wZXJ0eShwKSkgY29udGludWU7XHJcbiAgICAgICAgdmFyIGV2ID0gZXZlbnRzW3BdO1xyXG4gICAgICAgIHZhciBpdGVtID0gJCgnPGEgdGFyZ2V0PVwiX2JsYW5rXCIgLz4nKS5hdHRyKCdocmVmJywgZXYudXJsKS50ZXh0KGV2LnN1bW1hcnkgfHwgJ2Jvb2tpbmcnKTtcclxuICAgICAgICBldmVudHNIdG1sLnB1c2goaXRlbS5vdXRlckh0bWwoKSk7XHJcblxyXG4gICAgICAgIGhhc05vdGlmaWNhdGlvbnMgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIG1zZyArPSBldmVudHNIdG1sLmpvaW4oJywgJyk7XHJcblxyXG4gICAgICAkKCc8bGkvPicpXHJcbiAgICAgIC5odG1sKG1zZylcclxuICAgICAgLmFwcGVuZFRvKHRoaXMuJGxpc3QpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChoYXNOb3RpZmljYXRpb25zKVxyXG4gICAgICB0aGlzLiRlbC5zaG93KCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMuJGVsLmhpZGUoKTtcclxuXHJcbiAgfTtcclxufTsiLCIvKipcclxuICBNb250aGx5IGNhbGVuZGFyIGNsYXNzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIExjV2lkZ2V0ID0gcmVxdWlyZSgnLi4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuLi9DWC9leHRlbmQnKSxcclxuICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuICBvYmplY3RVdGlscyA9IHJlcXVpcmUoJy4vb2JqZWN0VXRpbHMnKSxcclxuICBCb29raW5nc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vQm9va2luZ3NOb3RpZmljYXRpb24nKTtcclxuXHJcbi8qKlxyXG4gIFByaXZhdGUgdXRpbHNcclxuKiovXHJcblxyXG4vKipcclxuICBQcmVmZXRjaCBuZXh0IG1vbnRoIChiYXNlZCBvbiB0aGUgZ2l2ZW4gZGF0ZXMpXHJcbiAgTm90ZTogdGhpcyBjb2RlIGlzIHZlcnkgc2ltaWxhciB0byB1dGlscy53ZWVrbHlDaGVja0FuZFByZWZldGNoXHJcbioqL1xyXG5mdW5jdGlvbiBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaChtb250aGx5LCBjdXJyZW50RGF0ZXNSYW5nZSkge1xyXG4gIC8vIFdlIGdldCB0aGUgbmV4dCBtb250aCBkYXRlcy1yYW5nZSwgYnV0XHJcbiAgLy8gdXNpbmcgYXMgYmFzZS1kYXRlIGEgZGF0ZSBpbnNpZGUgY3VycmVudCBkaXNwbGF5ZWQgbW9udGgsIHRoYXQgbW9zdCB0aW1lcyBpc1xyXG4gIC8vIG5vdCB0aGUgbW9udGggb2YgdGhlIHN0YXJ0IGRhdGUgaW4gY3VycmVudCBkYXRlLCB0aGVuIGp1c3QgZm9yd2FyZCA3IGRheXMgdGhhdFxyXG4gIC8vIHRvIGVuc3VyZSB3ZSBwaWNrIHRoZSBjb3JyZWN0IG1vbnRoOlxyXG4gIHZhciBuZXh0RGF0ZXNSYW5nZSA9IHV0aWxzLmRhdGUubmV4dE1vbnRoV2Vla3ModXRpbHMuZGF0ZS5hZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLnN0YXJ0LCA3KSwgMSwgbW9udGhseS5zaG93U2l4V2Vla3MpO1xyXG4gIC8vIEFzIHdlIGxvYWQgZnVsbCB3ZWVrcywgbW9zdCB0aW1lcyB0aGUgZmlyc3Qgd2VlayBvZiBhIG1vbnRoIGlzIGFscmVhZHkgbG9hZGVkIGJlY2F1c2UgXHJcbiAgLy8gdGhlIHdlZWsgaXMgc2hhcmVkIHdpdGggdGhlIHByZXZpb3VzIG1vbnRoLCB0aGVuIGp1c3QgY2hlY2sgaWYgdGhlIHN0YXJ0IG9mIHRoZSBuZXdcclxuICAvLyByYW5nZSBpcyBhbHJlYWR5IGluIGNhY2hlIGFuZCBzaHJpbmsgdGhlIHJhbmdlIHRvIGJlIHJlcXVlc3RlZCwgYXZvaWRpbmcgY29uZmxpY3Qgb25cclxuICAvLyBsb2FkaW5nIHRoZSB1ZHBhdGVkIGRhdGEgKGlmIHRoYXQgd2VlayB3YXMgYmVpbmcgZWRpdGVkKSBhbmQgZmFzdGVyIHJlcXVlc3QgbG9hZCBzaW5jZVxyXG4gIC8vIHRoZSBzZXJ2ZXIgbmVlZHMgdG8gZG8gbGVzcyBjb21wdXRhdGlvbjpcclxuICB2YXIgZCA9IG5leHREYXRlc1JhbmdlLnN0YXJ0LFxyXG4gICAgc3RyZW5kID0gZGF0ZUlTTy5kYXRlTG9jYWwobmV4dERhdGVzUmFuZ2UuZW5kKSxcclxuICAgIHN0cmQgPSBkYXRlSVNPLmRhdGVMb2NhbChkLCB0cnVlKTtcclxuICBpZiAobW9udGhseS5kYXRhICYmIG1vbnRobHkuZGF0YS5zbG90cylcclxuICB3aGlsZSAobW9udGhseS5kYXRhLnNsb3RzW3N0cmRdICYmXHJcbiAgICBzdHJkIDw9IHN0cmVuZCkge1xyXG4gICAgbmV4dERhdGVzUmFuZ2Uuc3RhcnQgPSBkID0gdXRpbHMuZGF0ZS5hZGREYXlzKGQsIDEpO1xyXG4gICAgc3RyZCA9IGRhdGVJU08uZGF0ZUxvY2FsKGQsIHRydWUpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCF1dGlscy5tb250aGx5SXNEYXRhSW5DYWNoZShtb250aGx5LCBuZXh0RGF0ZXNSYW5nZSkpIHtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgd2VlayBpbiBhZHZhbmNlXHJcbiAgICB2YXIgcHJlZmV0Y2hRdWVyeSA9IHV0aWxzLmRhdGVzVG9RdWVyeShuZXh0RGF0ZXNSYW5nZSk7XHJcbiAgICBtb250aGx5LmZldGNoRGF0YShwcmVmZXRjaFF1ZXJ5LCBudWxsLCB0cnVlKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG5Nb3ZlIHRoZSBiaW5kZWQgZGF0ZXMgdGhlIGFtb3VudCBvZiBAbW9udGhzIHNwZWNpZmllZC5cclxuTm90ZTogbW9zdCBvZiB0aGlzIGNvZGUgaXMgYWRhcHRlZCBmcm9tIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXMsXHJcbnRoZSBjb21wbGV4aXR5IGNvbWVzIGZyb20gdGhlIHByZWZldGNoIGZlYXR1cmUsIG1heWJlIGNhbiBiZSB0aGF0IGxvZ2ljXHJcbmlzb2xhdGVkIGFuZCBzaGFyZWQ/XHJcbioqL1xyXG5mdW5jdGlvbiBtb3ZlQmluZE1vbnRoKG1vbnRobHksIG1vbnRocykge1xyXG4gIC8vIFdlIGdldCB0aGUgbmV4dCAnbW9udGhzJyAobmVnYXRpdmUgZm9yIHByZXZpb3VzKSBkYXRlcy1yYW5nZSwgYnV0XHJcbiAgLy8gdXNpbmcgYXMgYmFzZS1kYXRlIGEgZGF0ZSBpbnNpZGUgY3VycmVudCBkaXNwbGF5ZWQgbW9udGgsIHRoYXQgbW9zdCB0aW1lcyBpc1xyXG4gIC8vIG5vdCB0aGUgbW9udGggb2YgdGhlIHN0YXJ0IGRhdGUgaW4gY3VycmVudCBkYXRlLCB0aGVuIGp1c3QgZm9yd2FyZCA3IGRheXMgdGhhdFxyXG4gIC8vIHRvIGVuc3VyZSB3ZSBwaWNrIHRoZSBjb3JyZWN0IG1vbnRoOlxyXG4gIHZhciBkYXRlc1JhbmdlID0gdXRpbHMuZGF0ZS5uZXh0TW9udGhXZWVrcyh1dGlscy5kYXRlLmFkZERheXMobW9udGhseS5kYXRlc1JhbmdlLnN0YXJ0LCA3KSwgbW9udGhzLCBtb250aGx5LnNob3dTaXhXZWVrcyk7XHJcblxyXG4gIC8vIENoZWNrIGNhY2hlIGJlZm9yZSB0cnkgdG8gZmV0Y2hcclxuICB2YXIgaW5DYWNoZSA9IHV0aWxzLm1vbnRobHlJc0RhdGFJbkNhY2hlKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG5cclxuICBpZiAoaW5DYWNoZSkge1xyXG4gICAgLy8gSnVzdCBzaG93IHRoZSBkYXRhXHJcbiAgICBtb250aGx5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgLy8gUHJlZmV0Y2ggZXhjZXB0IGlmIHRoZXJlIGlzIG90aGVyIHJlcXVlc3QgaW4gY291cnNlIChjYW4gYmUgdGhlIHNhbWUgcHJlZmV0Y2gsXHJcbiAgICAvLyBidXQgc3RpbGwgZG9uJ3Qgb3ZlcmxvYWQgdGhlIHNlcnZlcilcclxuICAgIGlmIChtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggPT09IDApXHJcbiAgICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBmb3IgcHJlZmV0Y2hpbmc6XHJcbiAgICAvLyBJdHMgYXZvaWRlZCBpZiB0aGVyZSBhcmUgcmVxdWVzdHMgaW4gY291cnNlLCBzaW5jZVxyXG4gICAgLy8gdGhhdCB3aWxsIGJlIGEgcHJlZmV0Y2ggZm9yIHRoZSBzYW1lIGRhdGEuXHJcbiAgICBpZiAobW9udGhseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSB7XHJcbiAgICAgIC8vIFRoZSBsYXN0IHJlcXVlc3QgaW4gdGhlIHBvb2wgKm11c3QqIGJlIHRoZSBsYXN0IGluIGZpbmlzaFxyXG4gICAgICAvLyAobXVzdCBiZSBvbmx5IG9uZSBpZiBhbGwgZ29lcyBmaW5lKTpcclxuICAgICAgdmFyIHJlcXVlc3QgPSBtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0c1ttb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgIC8vIFdhaXQgZm9yIHRoZSBmZXRjaCB0byBwZXJmb3JtIGFuZCBzZXRzIGxvYWRpbmcgdG8gbm90aWZ5IHVzZXJcclxuICAgICAgbW9udGhseS4kZWwuYWRkQ2xhc3MobW9udGhseS5jbGFzc2VzLmZldGNoaW5nKTtcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBtb3ZlQmluZE1vbnRoKG1vbnRobHksIG1vbnRocyk7XHJcbiAgICAgICAgbW9udGhseS4kZWwucmVtb3ZlQ2xhc3MobW9udGhseS5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmV0Y2ggKGRvd25sb2FkKSB0aGUgZGF0YSBhbmQgc2hvdyBvbiByZWFkeTpcclxuICAgIG1vbnRobHlcclxuICAgIC5mZXRjaERhdGEodXRpbHMuZGF0ZXNUb1F1ZXJ5KGRhdGVzUmFuZ2UpKVxyXG4gICAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICBtb250aGx5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgICAvLyBQcmVmZXRjaFxyXG4gICAgICBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaChtb250aGx5LCBkYXRlc1JhbmdlKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbk1hcmsgY2FsZW5kYXIgYXMgY3VycmVudC1tb250aCBhbmQgZGlzYWJsZSBwcmV2IGJ1dHRvbixcclxub3IgcmVtb3ZlIHRoZSBtYXJrIGFuZCBlbmFibGUgaXQgaWYgaXMgbm90LlxyXG5cclxuVXBkYXRlcyB0aGUgbW9udGggbGFiZWwgdG9vIGFuZCB0b2RheSBidXR0b25cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrQ3VycmVudE1vbnRoKCRlbCwgc3RhcnREYXRlLCBtb250aGx5KSB7XHJcbiAgLy8gRW5zdXJlIHRoZSBkYXRlIHRvIGJlIGZyb20gY3VycmVudCBtb250aCBhbmQgbm90IG9uZSBvZiB0aGUgbGF0ZXN0IGRhdGVzXHJcbiAgLy8gb2YgdGhlIHByZXZpb3VzIG9uZSAod2hlcmUgdGhlIHJhbmdlIHN0YXJ0KSBhZGRpbmcgNyBkYXlzIGZvciB0aGUgY2hlY2s6XHJcbiAgdmFyIG1vbnRoRGF0ZSA9IHV0aWxzLmRhdGUuYWRkRGF5cyhzdGFydERhdGUsIDcpO1xyXG4gIHZhciB5ZXAgPSB1dGlscy5kYXRlLmlzSW5DdXJyZW50TW9udGgobW9udGhEYXRlKTtcclxuICAkZWwudG9nZ2xlQ2xhc3MobW9udGhseS5jbGFzc2VzLmN1cnJlbnRXZWVrLCB5ZXApO1xyXG4gICRlbC5maW5kKCcuJyArIG1vbnRobHkuY2xhc3Nlcy5wcmV2QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcblxyXG4gIC8vIE1vbnRoIC0gWWVhclxyXG4gIHZhciBtbGJsID0gbW9udGhseS50ZXh0cy5tb250aHNbbW9udGhEYXRlLmdldE1vbnRoKCldICsgJyAnICsgbW9udGhEYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLm1vbnRoTGFiZWwpLnRleHQobWxibCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLnRvZGF5QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gIFVwZGF0ZSB0aGUgY2FsZW5kYXIgZGF0ZXMgY2VsbHMgZm9yICdkYXkgb2YgdGhlIG1vbnRoJyB2YWx1ZXNcclxuICBhbmQgbnVtYmVyIG9mIHdlZWtzL3Jvd3MuXHJcbiAgQGRhdGVzUmFuZ2UgeyBzdGFydCwgZW5kIH1cclxuICBAc2xvdHNDb250YWluZXIgalF1ZXJ5LURPTSBmb3IgZGF0ZXMtY2VsbHMgdGJvZHlcclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIG9mZk1vbnRoRGF0ZUNsYXNzLCBjdXJyZW50RGF0ZUNsYXNzLCBzbG90RGF0ZUxhYmVsLCBzaG93U2l4V2Vla3MpIHtcclxuICB2YXIgbGFzdFksXHJcbiAgICBjdXJyZW50TW9udGggPSB1dGlscy5kYXRlLmFkZERheXMoZGF0ZXNSYW5nZS5zdGFydCwgNykuZ2V0TW9udGgoKSxcclxuICAgIHRvZGF5ID0gZGF0ZUlTTy5kYXRlTG9jYWwobmV3IERhdGUoKSk7XHJcblxyXG4gIGl0ZXJhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBmdW5jdGlvbiAoZGF0ZSwgeCwgeSkge1xyXG4gICAgbGFzdFkgPSB5O1xyXG4gICAgdGhpcy5maW5kKCcuJyArIHNsb3REYXRlTGFiZWwpLnRleHQoZGF0ZS5nZXREYXRlKCkpO1xyXG5cclxuICAgIC8vIE1hcmsgZGF5cyBub3QgaW4gdGhpcyBtb250aFxyXG4gICAgdGhpcy50b2dnbGVDbGFzcyhvZmZNb250aERhdGVDbGFzcywgZGF0ZS5nZXRNb250aCgpICE9IGN1cnJlbnRNb250aCk7XHJcblxyXG4gICAgLy8gTWFyayB0b2RheVxyXG4gICAgdGhpcy50b2dnbGVDbGFzcyhjdXJyZW50RGF0ZUNsYXNzLCBkYXRlSVNPLmRhdGVMb2NhbChkYXRlKSA9PSB0b2RheSk7XHJcbiAgfSk7XHJcblxyXG4gIGlmICghc2hvd1NpeFdlZWtzKSB7XHJcbiAgICAvLyBTb21lIG1vbnRocyBhcmUgNSB3ZWVrcyB3aWRlIGFuZCBvdGhlcnMgNjsgb3VyIGxheW91dCBoYXMgcGVybWFuZW50IDYgcm93cy93ZWVrc1xyXG4gICAgLy8gYW5kIHdlIGRvbid0IGxvb2sgdXAgdGhlIDZ0aCB3ZWVrIGlmIGlzIG5vdCBwYXJ0IG9mIHRoZSBtb250aCB0aGVuIHRoYXQgNnRoIHJvd1xyXG4gICAgLy8gbXVzdCBiZSBoaWRkZW4gaWYgdGhlcmUgYXJlIG9ubHkgNS5cclxuICAgIC8vIElmIHRoZSBsYXN0IHJvdyB3YXMgdGhlIDUgKGluZGV4IDQsIHplcm8tYmFzZWQpLCB0aGUgNnRoIGlzIGhpZGRlbjpcclxuICAgIHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCd0cjplcSg1KScpLnh0b2dnbGUobGFzdFkgIT0gNCwgeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogMCB9KTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gIEl0IGV4ZWN1dGVzIHRoZSBnaXZlbiBjYWxsYmFjayAoQGVhY2hDZWxsQ2FsbGJhY2spIGZvciBcclxuICBlYWNoIGNlbGwgKHRoaXMgaW5zaWRlIHRoZSBjYWxsYmFjaykgaXRlcmF0ZWQgYmV0d2VlbiB0aGUgQGRhdGVzUmFuZ2VcclxuICBpbnNpZGUgdGhlIEBzbG90c0NvbnRhaW5lciAoYSB0Ym9keSBvciB0YWJsZSB3aXRoIHRyLXRkIGRhdGUgY2VsbHMpXHJcbioqL1xyXG5mdW5jdGlvbiBpdGVyYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgZWFjaENlbGxDYWxsYmFjaykge1xyXG4gIHZhciB4LCB5LCBkYXRlQ2VsbDtcclxuICAvLyBJdGVyYXRlIGRhdGVzXHJcbiAgdXRpbHMuZGF0ZS5lYWNoRGF0ZUluUmFuZ2UoZGF0ZXNSYW5nZS5zdGFydCwgZGF0ZXNSYW5nZS5lbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICAvLyBkYXRlcyBhcmUgc29ydGVkIGFzIDcgcGVyIHJvdyAoZWFjaCB3ZWVrLWRheSksXHJcbiAgICAvLyBidXQgcmVtZW1iZXIgdGhhdCBkYXktY2VsbCBwb3NpdGlvbiBpcyBvZmZzZXQgMSBiZWNhdXNlXHJcbiAgICAvLyBlYWNoIHJvdyBpcyA4IGNlbGxzIChmaXJzdCBpcyBoZWFkZXIgYW5kIHJlc3QgNyBhcmUgdGhlIGRhdGEtY2VsbHMgZm9yIGRhdGVzKVxyXG4gICAgLy8ganVzdCBsb29raW5nIG9ubHkgJ3RkJ3Mgd2UgY2FuIHVzZSB0aGUgcG9zaXRpb24gd2l0aG91dCBvZmZzZXRcclxuICAgIHggPSAoaSAlIDcpO1xyXG4gICAgeSA9IE1hdGguZmxvb3IoaSAvIDcpO1xyXG4gICAgZGF0ZUNlbGwgPSBzbG90c0NvbnRhaW5lci5jaGlsZHJlbigndHI6ZXEoJyArIHkgKyAnKScpLmNoaWxkcmVuKCd0ZDplcSgnICsgeCArICcpJyk7XHJcblxyXG4gICAgZWFjaENlbGxDYWxsYmFjay5hcHBseShkYXRlQ2VsbCwgW2RhdGUsIHgsIHksIGldKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAgVG9nZ2xlIGEgc2VsZWN0ZWQgZGF0ZS1jZWxsIGF2YWlsYWJpbGl0eSxcclxuICBmb3IgdGhlICdlZGl0YWJsZScgbW9kZVxyXG4qKi9cclxuZnVuY3Rpb24gdG9nZ2xlRGF0ZUF2YWlsYWJpbGl0eShtb250aGx5LCBjZWxsKSB7XHJcbiAgLy8gSWYgdGhlcmUgaXMgbm8gZGF0YSwganVzdCByZXR1cm4gKGRhdGEgbm90IGxvYWRlZClcclxuICBpZiAoIW1vbnRobHkuZGF0YSB8fCAhbW9udGhseS5kYXRhLnNsb3RzKSByZXR1cm47XHJcbiAgXHJcbiAgLy8gR2V0dGluZyB0aGUgcG9zaXRpb24gb2YgdGhlIGNlbGwgaW4gdGhlIG1hdHJpeCBmb3IgZGF0ZS1zbG90czpcclxuICB2YXIgdHIgPSBjZWxsLmNsb3Nlc3QoJ3RyJyksXHJcbiAgICB4ID0gdHIuZmluZCgndGQnKS5pbmRleChjZWxsKSxcclxuICAgIHkgPSB0ci5jbG9zZXN0KCd0Ym9keScpLmZpbmQoJ3RyJykuaW5kZXgodHIpLFxyXG4gICAgZGF5c09mZnNldCA9IHkgKiA3ICsgeDtcclxuXHJcbiAgLy8gR2V0dGluZyB0aGUgZGF0ZSBmb3IgdGhlIGNlbGwgYmFzZWQgb24gdGhlIHNob3dlZCBmaXJzdCBkYXRlXHJcbiAgdmFyIGRhdGUgPSBtb250aGx5LmRhdGVzUmFuZ2Uuc3RhcnQ7XHJcbiAgZGF0ZSA9IHV0aWxzLmRhdGUuYWRkRGF5cyhkYXRlLCBkYXlzT2Zmc2V0KTtcclxuICB2YXIgc3RyRGF0ZSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG5cclxuICAvLyBHZXQgYW5kIHVwZGF0ZSBmcm9tIHRoZSB1bmRlcmxheWluZyBkYXRhLCBcclxuICAvLyB0aGUgc3RhdHVzIGZvciB0aGUgZGF0ZSwgdG9nZ2xpbmcgaXQ6XHJcbiAgdmFyIHNsb3QgPSBtb250aGx5LmRhdGEuc2xvdHNbc3RyRGF0ZV07XHJcbiAgLy8gSWYgdGhlcmUgaXMgbm8gc2xvdCwganVzdCByZXR1cm4gKGRhdGEgbm90IGxvYWRlZClcclxuICBpZiAoIXNsb3QpIHJldHVybjtcclxuICBzbG90LnN0YXR1cyA9IHNsb3Quc3RhdHVzID09ICd1bmF2YWlsYWJsZScgPyAnYXZhaWxhYmxlJyA6ICd1bmF2YWlsYWJsZSc7XHJcbiAgc2xvdC5zb3VyY2UgPSAndXNlcic7XHJcbiAgbW9udGhseS5ib29raW5nc05vdGlmaWNhdGlvbi5yZWdpc3RlcihzbG90LnN0YXR1cyA9PSAndW5hdmFpbGFibGUnLCBtb250aGx5LmRhdGEsIHN0ckRhdGUpO1xyXG5cclxuICAvLyBVcGRhdGUgdmlzdWFsaXphdGlvbjpcclxuICBtb250aGx5LmJpbmREYXRhKCk7XHJcbn1cclxuXHJcbi8qKlxyXG5Nb250bHkgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBNb250aGx5ID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseUNsYXNzZXMsIHtcclxuICB3ZWVrbHlDYWxlbmRhcjogdW5kZWZpbmVkLFxyXG4gIGN1cnJlbnRXZWVrOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudE1vbnRoOiAnaXMtY3VycmVudE1vbnRoJyxcclxuICBtb250aGx5Q2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci0tbW9udGhseScsXHJcbiAgdG9kYXlBY3Rpb246ICdBY3Rpb25zLXRvZGF5JyxcclxuICBtb250aExhYmVsOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbW9udGhMYWJlbCcsXHJcbiAgc2xvdERhdGVMYWJlbDogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXNsb3REYXRlTGFiZWwnLFxyXG4gIG9mZk1vbnRoRGF0ZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLW9mZk1vbnRoRGF0ZScsXHJcbiAgY3VycmVudERhdGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1jdXJyZW50RGF0ZScsXHJcbiAgZWRpdGFibGU6ICdpcy1lZGl0YWJsZScsXHJcbiAgYm9va2luZ3NOb3RpZmljYXRpb246ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1ib29raW5nc05vdGlmaWNhdGlvbidcclxufSksXHJcbnRleHRzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseVRleHRzLCB7XHJcbiAgbW9udGhzOiBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXVxyXG59KSxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuc2hvd1NpeFdlZWtzOiB0cnVlLFxyXG5lZGl0YWJsZTogZmFsc2UsXHJcblxyXG4vLyBPdXIgJ3ZpZXcnIHdpbGwgYmUgYSBzdWJzZXQgb2YgdGhlIGRhdGEsXHJcbi8vIGRlbGltaXRlZCBieSB0aGUgbmV4dCBwcm9wZXJ0eSwgYSBkYXRlcyByYW5nZTpcclxuZGF0ZXNSYW5nZTogeyBzdGFydDogbnVsbCwgZW5kOiBudWxsIH0sXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YU1vbnRobHkoZGF0ZXNSYW5nZSkge1xyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuc2xvdHMpIHJldHVybjtcclxuXHJcbiAgdGhpcy5kYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgfHwgdGhpcy5kYXRlc1JhbmdlO1xyXG4gIHZhciBcclxuICAgICAgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyksXHJcbiAgICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgY2hlY2tDdXJyZW50TW9udGgodGhpcy4kZWwsIGRhdGVzUmFuZ2Uuc3RhcnQsIHRoaXMpO1xyXG5cclxuICB1cGRhdGVEYXRlc0NlbGxzKHRoaXMuZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIHRoaXMuY2xhc3Nlcy5vZmZNb250aERhdGUsIHRoaXMuY2xhc3Nlcy5jdXJyZW50RGF0ZSwgdGhpcy5jbGFzc2VzLnNsb3REYXRlTGFiZWwsIHRoaXMuc2hvd1NpeFdlZWtzKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIC8vIFNldCBhdmFpbGFiaWxpdHkgb2YgZWFjaCBkYXRlIHNsb3QvY2VsbDpcclxuICBpdGVyYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgZnVuY3Rpb24gKGRhdGUsIHgsIHksIGkpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICB2YXIgc2xvdCA9IHRoYXQuZGF0YS5zbG90c1tkYXRla2V5XTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIHNpbXBsZSBhbmQgZGV0YWlsZWQgc3RhdHVzIGRlc2NyaXB0aW9uOlxyXG4gICAgdmFyIGRhdGVTdGF0dXMgPSAkLmlzUGxhaW5PYmplY3Qoc2xvdCkgPyBzbG90LnN0YXR1cyA6IHNsb3Q7XHJcbiAgICAvLyBEZWZhdWx0IHZhbHVlIGZyb20gZGF0YTpcclxuICAgIGRhdGVTdGF0dXMgPSBkYXRlU3RhdHVzIHx8IHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICd1bmtub3cnO1xyXG5cclxuICAgIGlmIChkYXRlU3RhdHVzKVxyXG4gICAgICB0aGlzLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgZGF0ZVN0YXR1cyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIE5vdGlmaWNhdGlvbnM6XHJcbiAgdGhpcy5ib29raW5nc05vdGlmaWNhdGlvbi5yZW5kZXIoKTtcclxufSxcclxuZ2V0VXBkYXRlZERhdGE6IGZ1bmN0aW9uIGdldFVwZGF0ZWREYXRhKCkge1xyXG4gIHZhciBkID0ge307XHJcbiAgaWYgKHRoaXMuZWRpdGFibGUpIHtcclxuICAgIC8vIENvcHkgZGF0YSwgd2UgZG9uJ3Qgd2FudCBjaGFuZ2UgdGhlIG9yaWdpbmFsOlxyXG4gICAgZXh0ZW5kKGQsIHRoaXMuZGF0YSk7XHJcblxyXG4gICAgLy8gRmlsdGVyIHNsb3RzIHRvIGdldCBvbmx5IHRoYXQgdXBkYXRlZCBieSBkZSB1c2VyOlxyXG4gICAgZC5zbG90cyA9IG9iamVjdFV0aWxzLmZpbHRlclByb3BlcnRpZXMoZC5zbG90cywgZnVuY3Rpb24gKGssIHYpIHtcclxuICAgICAgcmV0dXJuIHYuc291cmNlID09ICd1c2VyJztcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gZDtcclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gTW9udGhseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAvLyBJbml0aWFsaXppbmcgc29tZSBkYXRhLCBiZWluZyBjYXJlIG9mIGFueSB2YWx1ZVxyXG4gIC8vIHRoYXQgY29tZXMgZnJvbSBtZXJnaW5nIG9wdGlvbnMgaW50byAndGhpcydcclxuICB0aGlzLnVzZXIgPSB0aGlzLnVzZXIgfHwgdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG4gIHRoaXMucXVlcnkgPSBleHRlbmQoe1xyXG4gICAgdXNlcjogdGhpcy51c2VyLFxyXG4gICAgdHlwZTogJ21vbnRobHktc2NoZWR1bGUnXHJcbiAgfSwgdGhpcy5xdWVyeSk7XHJcblxyXG4gIC8vIElmIGlzIG5vdCBzZXQgYnkgY29uc3RydWN0b3Igb3B0aW9ucywgZ2V0IFxyXG4gIC8vICdlZGl0YWJsZScgZnJvbSBkYXRhLCBvciBsZWZ0IGRlZmF1bHQ6XHJcbiAgaWYgKCEob3B0aW9ucyAmJiB0eXBlb2YgKG9wdGlvbnMuZWRpdGFibGUpICE9ICd1bmRlZmluZWQnKSAmJlxyXG4gICAgdHlwZW9mICh0aGlzLiRlbC5kYXRhKCdlZGl0YWJsZScpKSAhPSAndW5kZWZpbmVkJylcclxuICAgIHRoaXMuZWRpdGFibGUgPSAhIXRoaXMuJGVsLmRhdGEoJ2VkaXRhYmxlJyk7XHJcblxyXG5cclxuICAvLyBTZXQgaGFuZGxlcnMgZm9yIHByZXYtbmV4dCBhY3Rpb25zOlxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5wcmV2QWN0aW9uLCBmdW5jdGlvbiBwcmV2KCkge1xyXG4gICAgbW92ZUJpbmRNb250aCh0aGF0LCAtMSk7XHJcbiAgfSk7XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLm5leHRBY3Rpb24sIGZ1bmN0aW9uIG5leHQoKSB7XHJcbiAgICBtb3ZlQmluZE1vbnRoKHRoYXQsIDEpO1xyXG4gIH0pO1xyXG4gIC8vIEhhbmRsZXIgZm9yIHRvZGF5IGFjdGlvblxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy50b2RheUFjdGlvbiwgZnVuY3Rpb24gdG9kYXkoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MobnVsbCwgdGhpcy5zaG93U2l4V2Vla3MpKTtcclxuICB9KTtcclxuXHJcbiAgLy8gRWRpdGFibGUgbW9kZVxyXG4gIGlmICh0aGlzLmVkaXRhYmxlKSB7XHJcbiAgICB0aGlzLnF1ZXJ5LmVkaXRhYmxlID0gdHJ1ZTtcclxuICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyArICcgdGQnLCBmdW5jdGlvbiBjbGlja1RvZ2dsZUF2YWlsYWJpbGl0eSgpIHtcclxuICAgICAgdG9nZ2xlRGF0ZUF2YWlsYWJpbGl0eSh0aGF0LCAkKHRoaXMpKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy4kZWwuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLmVkaXRhYmxlKTtcclxuICB9XHJcblxyXG4gIC8vIENyZWF0aW5nIHRoZSBib29raW5nc05vdGlmaWNhdGlvbiBlbGVtZW50LCBib3RoIGVkaXRhYmxlIGFuZCByZWFkLW9ubHkgbW9kZXMuXHJcbiAgLy8gUmVhZC1vbmx5IG1vZGUgbmVlZCBoaWRkZW4gdGhlIGVsZW1lbnQgYW5kIHRoYXRzIGRvbmUgb24gY29uc3RydWN0b3IgYW5kIGVkaXRhYmxlXHJcbiAgLy8gd2lsbCByZW5kZXIgaXQgb24gYmluZERhdGFcclxuICB0aGlzLmJvb2tpbmdzTm90aWZpY2F0aW9uID0gbmV3IEJvb2tpbmdzTm90aWZpY2F0aW9uKHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLmJvb2tpbmdzTm90aWZpY2F0aW9uKSk7XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgbW9udGhcclxuICB2YXIgZmlyc3REYXRlcyA9IHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MobnVsbCwgdGhpcy5zaG93U2l4V2Vla3MpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShmaXJzdERhdGVzKSkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKGZpcnN0RGF0ZXMpO1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCBtb250aCBpbiBhZHZhbmNlXHJcbiAgICBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaCh0aGF0LCBmaXJzdERhdGVzKTtcclxuICB9KTtcclxuXHJcbiAgY2hlY2tDdXJyZW50TW9udGgodGhpcy4kZWwsIGZpcnN0RGF0ZXMuc3RhcnQsIHRoaXMpO1xyXG5cclxuICAvLyBTaG93IGVycm9yIG1lc3NhZ2VcclxuICB0aGlzLmV2ZW50cy5vbignaGFzRXJyb3JDaGFuZ2VkJywgdXRpbHMuaGFuZGxlckNhbGVuZGFyRXJyb3IpO1xyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbk1vbnRobHkuZW5hYmxlQWxsID0gZnVuY3Rpb24gb24ob3B0aW9ucykge1xyXG4gIHZhciBsaXN0ID0gW107XHJcbiAgJCgnLicgKyBNb250aGx5LnByb3RvdHlwZS5jbGFzc2VzLm1vbnRobHlDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IE1vbnRobHkodGhpcywgb3B0aW9ucykpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBsaXN0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb250aGx5O1xyXG4iLCIvKipcclxuICBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgTGNXaWRnZXQgPSByZXF1aXJlKCcuLi9DWC9MY1dpZGdldCcpLFxyXG4gIGV4dGVuZCA9IHJlcXVpcmUoJy4uL0NYL2V4dGVuZCcpO1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcblxyXG4vKipcclxuV2Vla2x5IGNhbGVuZGFyLCBpbmhlcml0cyBmcm9tIExjV2lkZ2V0XHJcbioqL1xyXG52YXIgV2Vla2x5ID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiB1dGlscy53ZWVrbHlDbGFzc2VzLFxyXG50ZXh0czogdXRpbHMud2Vla2x5VGV4dHMsXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcblxyXG4vLyBPdXIgJ3ZpZXcnIHdpbGwgYmUgYSBzdWJzZXQgb2YgdGhlIGRhdGEsXHJcbi8vIGRlbGltaXRlZCBieSB0aGUgbmV4dCBwcm9wZXJ0eSwgYSBkYXRlcyByYW5nZTpcclxuZGF0ZXNSYW5nZTogeyBzdGFydDogbnVsbCwgZW5kOiBudWxsIH0sXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YVdlZWtseShkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5zbG90cykgcmV0dXJuO1xyXG5cclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICB1dGlscy5jaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBkYXRlc1JhbmdlLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgdXRpbHMudXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIHRoaXMuJGVsLCB0aGlzKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB1dGlscy5kYXRlLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICB2YXIgZGF0ZVNsb3RzID0gdGhhdC5kYXRhLnNsb3RzW2RhdGVrZXldO1xyXG4gICAgaWYgKGRhdGVTbG90cykge1xyXG4gICAgICBmb3IgKHMgPSAwOyBzIDwgZGF0ZVNsb3RzLmxlbmd0aDsgcysrKSB7XHJcbiAgICAgICAgdmFyIHNsb3QgPSBkYXRlU2xvdHNbc107XHJcbiAgICAgICAgdmFyIHNsb3RDZWxsID0gdXRpbHMuZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIGksIHNsb3QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkZWZhdWx0IHN0YXR1c1xyXG4gICAgICAgIHNsb3RDZWxsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ18nKTtcclxuICAgICAgICAvLyBBZGRpbmcgc3RhdHVzIGNsYXNzXHJcbiAgICAgICAgc2xvdENlbGwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBXZWVrbHkoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIC8vIFJldXNpbmcgYmFzZSBjb25zdHJ1Y3RvciB0b28gZm9yIGluaXRpYWxpemluZzpcclxuICBMY1dpZGdldC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIC8vIFRvIHVzZSB0aGlzIGluIGNsb3N1cmVzOlxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdGhpcy51c2VyID0gdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG4gIHRoaXMucXVlcnkgPSB7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnd2Vla2x5J1xyXG4gIH07XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgd2Vla1xyXG4gIHZhciBmaXJzdERhdGVzID0gdXRpbHMuZGF0ZS5jdXJyZW50V2VlaygpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShmaXJzdERhdGVzKSkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKGZpcnN0RGF0ZXMpO1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHV0aWxzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2godGhhdCwgZmlyc3REYXRlcyk7XHJcbiAgfSk7XHJcbiAgdXRpbHMuY2hlY2tDdXJyZW50V2Vlayh0aGlzLiRlbCwgZmlyc3REYXRlcy5zdGFydCwgdGhpcyk7XHJcblxyXG4gIC8vIFNldCBoYW5kbGVycyBmb3IgcHJldi1uZXh0IGFjdGlvbnM6XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnByZXZBY3Rpb24sIGZ1bmN0aW9uIHByZXYoKSB7XHJcbiAgICB1dGlscy5tb3ZlQmluZFJhbmdlSW5EYXlzKHRoYXQsIC03KTtcclxuICB9KTtcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMubmV4dEFjdGlvbiwgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgNyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFNob3cgZXJyb3IgbWVzc2FnZVxyXG4gIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCB1dGlscy5oYW5kbGVyQ2FsZW5kYXJFcnJvcik7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldlZWtseS5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdlZWtseS5wcm90b3R5cGUuY2xhc3Nlcy53ZWVrbHlDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdlZWtseSh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdlZWtseTtcclxuIiwiLyoqXHJcbiAgV29yayBIb3VycyBjYWxlbmRhciBjbGFzc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4uL0NYL0xjV2lkZ2V0JyksXHJcbiAgZXh0ZW5kID0gcmVxdWlyZSgnLi4vQ1gvZXh0ZW5kJyksXHJcbiAgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXHJcbiAgY2xlYXJDdXJyZW50U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9jbGVhckN1cnJlbnRTZWxlY3Rpb24nKSxcclxuICBtYWtlVW5zZWxlY3RhYmxlID0gcmVxdWlyZSgnLi9tYWtlVW5zZWxlY3RhYmxlJyk7XHJcbnJlcXVpcmUoJy4uL2pxdWVyeS5ib3VuZHMnKTtcclxuXHJcbi8qKlxyXG5Xb3JrIGhvdXJzIHByaXZhdGUgdXRpbHNcclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwRWRpdFdvcmtIb3VycygpIHtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgLy8gU2V0IGhhbmRsZXJzIHRvIHN3aXRjaCBzdGF0dXMgYW5kIHVwZGF0ZSBiYWNrZW5kIGRhdGFcclxuICAvLyB3aGVuIHRoZSB1c2VyIHNlbGVjdCBjZWxsc1xyXG4gIHZhciBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKTtcclxuXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2VsbChjZWxsKSB7XHJcbiAgICAvLyBGaW5kIGRheSBhbmQgdGltZSBvZiB0aGUgY2VsbDpcclxuICAgIHZhciBzbG90ID0gdXRpbHMuZmluZFNsb3RCeUNlbGwoc2xvdHNDb250YWluZXIsIGNlbGwpO1xyXG4gICAgLy8gR2V0IHdlZWstZGF5IHNsb3RzIGFycmF5OlxyXG4gICAgdmFyIHdrc2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbdXRpbHMuc3lzdGVtV2Vla0RheXNbc2xvdC5kYXldXSA9IHRoYXQuZGF0YS5zbG90c1t1dGlscy5zeXN0ZW1XZWVrRGF5c1tzbG90LmRheV1dIHx8IFtdO1xyXG4gICAgLy8gSWYgaXQgaGFzIGFscmVhZHkgdGhlIGRhdGEuc3RhdHVzLCB0b2dnbGUgdG8gdGhlIGRlZmF1bHRTdGF0dXNcclxuICAgIC8vICB2YXIgc3RhdHVzQ2xhc3MgPSB0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMsXHJcbiAgICAvLyAgICAgIGRlZmF1bHRTdGF0dXNDbGFzcyA9IHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXM7XHJcbiAgICAvL2lmIChjZWxsLmhhc0NsYXNzKHN0YXR1c0NsYXNzXHJcbiAgICAvLyBUb2dnbGUgZnJvbSB0aGUgYXJyYXlcclxuICAgIHZhciBzdHJzbG90ID0gZGF0ZUlTTy50aW1lTG9jYWwoc2xvdC5zbG90LCB0cnVlKSxcclxuICAgICAgaXNsb3QgPSB3a3Nsb3RzLmluZGV4T2Yoc3Ryc2xvdCk7XHJcbiAgICBpZiAoaXNsb3QgPT0gLTEpXHJcbiAgICAgIHdrc2xvdHMucHVzaChzdHJzbG90KTtcclxuICAgIGVsc2VcclxuICAgIC8vZGVsZXRlIHdrc2xvdHNbaXNsb3RdO1xyXG4gICAgICB3a3Nsb3RzLnNwbGljZShpc2xvdCwgMSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB0b2dnbGVDZWxsUmFuZ2UoZmlyc3RDZWxsLCBsYXN0Q2VsbCkge1xyXG4gICAgdmFyIFxyXG4gICAgICB4ID0gZmlyc3RDZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChmaXJzdENlbGwpLFxyXG4gICAgICB5MSA9IGZpcnN0Q2VsbC5jbG9zZXN0KCd0cicpLmluZGV4KCksXHJcbiAgICAvL3gyID0gbGFzdENlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGxhc3RDZWxsKSxcclxuICAgICAgeTIgPSBsYXN0Q2VsbC5jbG9zZXN0KCd0cicpLmluZGV4KCk7XHJcblxyXG4gICAgaWYgKHkxID4geTIpIHtcclxuICAgICAgdmFyIHkwID0geTE7XHJcbiAgICAgIHkxID0geTI7XHJcbiAgICAgIHkyID0geTA7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgeSA9IHkxOyB5IDw9IHkyOyB5KyspIHtcclxuICAgICAgdmFyIGNlbGwgPSBmaXJzdENlbGwuY2xvc2VzdCgndGJvZHknKS5jaGlsZHJlbigndHI6ZXEoJyArIHkgKyAnKScpLmNoaWxkcmVuKCd0ZDplcSgnICsgeCArICcpJyk7XHJcbiAgICAgIHRvZ2dsZUNlbGwoY2VsbCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgZHJhZ2dpbmcgPSB7XHJcbiAgICBmaXJzdDogbnVsbCxcclxuICAgIGxhc3Q6IG51bGwsXHJcbiAgICBzZWxlY3Rpb25MYXllcjogJCgnPGRpdiBjbGFzcz1cIlNlbGVjdGlvbkxheWVyXCIgLz4nKS5hcHBlbmRUbyh0aGlzLiRlbCksXHJcbiAgICBkb25lOiBmYWxzZVxyXG4gIH07XHJcbiAgXHJcbiAgZnVuY3Rpb24gb2Zmc2V0VG9Qb3NpdGlvbihlbCwgb2Zmc2V0KSB7XHJcbiAgICB2YXIgcGIgPSAkKGVsLm9mZnNldFBhcmVudCkuYm91bmRzKCksXHJcbiAgICAgIHMgPSB7fTtcclxuXHJcbiAgICBzLnRvcCA9IG9mZnNldC50b3AgLSBwYi50b3A7XHJcbiAgICBzLmxlZnQgPSBvZmZzZXQubGVmdCAtIHBiLmxlZnQ7XHJcblxyXG4gICAgLy9zLmJvdHRvbSA9IHBiLnRvcCAtIG9mZnNldC5ib3R0b207XHJcbiAgICAvL3MucmlnaHQgPSBvZmZzZXQubGVmdCAtIG9mZnNldC5yaWdodDtcclxuICAgIHMuaGVpZ2h0ID0gb2Zmc2V0LmJvdHRvbSAtIG9mZnNldC50b3A7XHJcbiAgICBzLndpZHRoID0gb2Zmc2V0LnJpZ2h0IC0gb2Zmc2V0LmxlZnQ7XHJcblxyXG4gICAgJChlbCkuY3NzKHMpO1xyXG4gICAgcmV0dXJuIHM7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cGRhdGVTZWxlY3Rpb24oZWwpIHtcclxuICAgIHZhciBhID0gZHJhZ2dpbmcuZmlyc3QuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIHZhciBiID0gZWwuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIHZhciBzID0gZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuXHJcbiAgICBzLnRvcCA9IGEudG9wIDwgYi50b3AgPyBhLnRvcCA6IGIudG9wO1xyXG4gICAgcy5ib3R0b20gPSBhLmJvdHRvbSA+IGIuYm90dG9tID8gYS5ib3R0b20gOiBiLmJvdHRvbTtcclxuXHJcbiAgICBvZmZzZXRUb1Bvc2l0aW9uKGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyWzBdLCBzKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZpbmlzaERyYWcoKSB7XHJcbiAgICBpZiAoZHJhZ2dpbmcuZmlyc3QgJiYgZHJhZ2dpbmcubGFzdCkge1xyXG4gICAgICB0b2dnbGVDZWxsUmFuZ2UoZHJhZ2dpbmcuZmlyc3QsIGRyYWdnaW5nLmxhc3QpO1xyXG4gICAgICB0aGF0LmJpbmREYXRhKCk7XHJcblxyXG4gICAgICBkcmFnZ2luZy5kb25lID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGRyYWdnaW5nLmZpcnN0ID0gZHJhZ2dpbmcubGFzdCA9IG51bGw7XHJcbiAgICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5oaWRlKCk7XHJcbiAgICBtYWtlVW5zZWxlY3RhYmxlLm9mZih0aGF0LiRlbCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHRoaXMuJGVsLmZpbmQoc2xvdHNDb250YWluZXIpLm9uKCdjbGljaycsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIERvIGV4Y2VwdCBhZnRlciBhIGRyYWdnaW5nIGRvbmUgY29tcGxldGVcclxuICAgIGlmIChkcmFnZ2luZy5kb25lKSByZXR1cm4gZmFsc2U7XHJcbiAgICB0b2dnbGVDZWxsKCQodGhpcykpO1xyXG4gICAgdGhhdC5iaW5kRGF0YSgpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICB0aGlzLiRlbC5maW5kKHNsb3RzQ29udGFpbmVyKVxyXG4gIC5vbignbW91c2Vkb3duJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgZHJhZ2dpbmcuZG9uZSA9IGZhbHNlO1xyXG4gICAgZHJhZ2dpbmcuZmlyc3QgPSAkKHRoaXMpO1xyXG4gICAgZHJhZ2dpbmcubGFzdCA9IG51bGw7XHJcbiAgICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5zaG93KCk7XHJcblxyXG4gICAgbWFrZVVuc2VsZWN0YWJsZSh0aGF0LiRlbCk7XHJcbiAgICBjbGVhckN1cnJlbnRTZWxlY3Rpb24oKTtcclxuXHJcbiAgICB2YXIgcyA9IGRyYWdnaW5nLmZpcnN0LmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICBvZmZzZXRUb1Bvc2l0aW9uKGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyWzBdLCBzKTtcclxuXHJcbiAgfSlcclxuICAub24oJ21vdXNlZW50ZXInLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoZHJhZ2dpbmcuZmlyc3QpIHtcclxuICAgICAgZHJhZ2dpbmcubGFzdCA9ICQodGhpcyk7XHJcblxyXG4gICAgICB1cGRhdGVTZWxlY3Rpb24oZHJhZ2dpbmcubGFzdCk7XHJcbiAgICB9XHJcbiAgfSlcclxuICAub24oJ21vdXNldXAnLCBmaW5pc2hEcmFnKVxyXG4gIC5maW5kKCd0ZCcpXHJcbiAgLmF0dHIoJ2RyYWdnYWJsZScsIGZhbHNlKTtcclxuXHJcbiAgLy8gVGhpcyB3aWxsIG5vdCB3b3JrIHdpdGggcG9pbnRlci1ldmVudHM6bm9uZSwgYnV0IG9uIG90aGVyXHJcbiAgLy8gY2FzZXMgKHJlY2VudElFKVxyXG4gIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLm9uKCdtb3VzZXVwJywgZmluaXNoRHJhZylcclxuICAuYXR0cignZHJhZ2dhYmxlJywgZmFsc2UpO1xyXG5cclxufVxyXG5cclxuLyoqXHJcbldvcmsgaG91cnMgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBXb3JrSG91cnMgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5Q2xhc3Nlcywge1xyXG4gIHdlZWtseUNhbGVuZGFyOiB1bmRlZmluZWQsXHJcbiAgd29ya0hvdXJzQ2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci0td29ya0hvdXJzJ1xyXG59KSxcclxudGV4dHM6IHV0aWxzLndlZWtseVRleHRzLFxyXG51cmw6ICcvY2FsZW5kYXIvZ2V0LWF2YWlsYWJpbGl0eS8nLFxyXG5iaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGFXb3JrSG91cnMoKSB7XHJcbiAgdmFyIFxyXG4gICAgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyksXHJcbiAgICBzbG90cyA9IHNsb3RzQ29udGFpbmVyLmZpbmQoJ3RkJyk7XHJcblxyXG4gIC8vIFJlbW92ZSBhbnkgcHJldmlvdXMgc3RhdHVzIGNsYXNzIGZyb20gYWxsIHNsb3RzXHJcbiAgZm9yICh2YXIgcyA9IDA7IHMgPCB1dGlscy5zdGF0dXNUeXBlcy5sZW5ndGg7IHMrKykge1xyXG4gICAgc2xvdHMucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB1dGlscy5zdGF0dXNUeXBlc1tzXSB8fCAnXycpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5kZWZhdWx0U3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICAvLyBTZXQgYWxsIHNsb3RzIHdpdGggZGVmYXVsdCBzdGF0dXNcclxuICBzbG90cy5hZGRDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoaXMuZGF0YS5kZWZhdWx0U3RhdHVzKTtcclxuXHJcbiAgaWYgKCF0aGlzLmRhdGEuc2xvdHMgfHwgIXRoaXMuZGF0YS5zdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICBmb3IgKHZhciB3ayA9IDA7IHdrIDwgdXRpbHMuc3lzdGVtV2Vla0RheXMubGVuZ3RoOyB3aysrKSB7XHJcbiAgICB2YXIgZGF0ZVNsb3RzID0gdGhhdC5kYXRhLnNsb3RzW3V0aWxzLnN5c3RlbVdlZWtEYXlzW3drXV07XHJcbiAgICBpZiAoZGF0ZVNsb3RzICYmIGRhdGVTbG90cy5sZW5ndGgpIHtcclxuICAgICAgZm9yIChzID0gMDsgcyA8IGRhdGVTbG90cy5sZW5ndGg7IHMrKykge1xyXG4gICAgICAgIHZhciBzbG90ID0gZGF0ZVNsb3RzW3NdO1xyXG4gICAgICAgIHZhciBzbG90Q2VsbCA9IHV0aWxzLmZpbmRDZWxsQnlTbG90KHNsb3RzQ29udGFpbmVyLCB3aywgc2xvdCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGRlZmF1bHQgc3RhdHVzXHJcbiAgICAgICAgc2xvdENlbGwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cyB8fCAnXycpO1xyXG4gICAgICAgIC8vIEFkZGluZyBzdGF0dXMgY2xhc3NcclxuICAgICAgICBzbG90Q2VsbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBXb3JrSG91cnMoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB0aGlzLnVzZXIgPSB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcblxyXG4gIHRoaXMucXVlcnkgPSB7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnd29ya0hvdXJzJ1xyXG4gIH07XHJcblxyXG4gIC8vIEZldGNoIHRoZSBkYXRhOiB0aGVyZSBpcyBub3QgYSBtb3JlIHNwZWNpZmljIHF1ZXJ5LFxyXG4gIC8vIGl0IGp1c3QgZ2V0IHRoZSBob3VycyBmb3IgZWFjaCB3ZWVrLWRheSAoZGF0YVxyXG4gIC8vIHNsb3RzIGFyZSBwZXIgd2Vlay1kYXkgaW5zdGVhZCBvZiBwZXIgZGF0ZSBjb21wYXJlZFxyXG4gIC8vIHRvICp3ZWVrbHkqKVxyXG4gIHRoaXMuZmV0Y2hEYXRhKCkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKCk7XHJcbiAgfSk7XHJcblxyXG4gIHNldHVwRWRpdFdvcmtIb3Vycy5jYWxsKHRoaXMpO1xyXG5cclxuICAvLyBTaG93IGVycm9yIG1lc3NhZ2VcclxuICB0aGlzLmV2ZW50cy5vbignaGFzRXJyb3JDaGFuZ2VkJywgdXRpbHMuaGFuZGxlckNhbGVuZGFyRXJyb3IpO1xyXG5cclxufSk7XHJcblxyXG4vKiogU3RhdGljIHV0aWxpdHk6IGZvdW5kIGFsbCBjb21wb25lbnRzIHdpdGggdGhlIFdvcmtob3VycyBjYWxlbmRhciBjbGFzc1xyXG5hbmQgZW5hYmxlIGl0XHJcbioqL1xyXG5Xb3JrSG91cnMuZW5hYmxlQWxsID0gZnVuY3Rpb24gb24ob3B0aW9ucykge1xyXG4gIHZhciBsaXN0ID0gW107XHJcbiAgJCgnLicgKyBXb3JrSG91cnMucHJvdG90eXBlLmNsYXNzZXMud29ya0hvdXJzQ2FsZW5kYXIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgbGlzdC5wdXNoKG5ldyBXb3JrSG91cnModGhpcywgb3B0aW9ucykpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBsaXN0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXb3JrSG91cnM7IiwiLyoqXHJcbkNyb3NzIGJyb3dzZXIgd2F5IHRvIHVuc2VsZWN0IGN1cnJlbnQgc2VsZWN0aW9uXHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNsZWFyQ3VycmVudFNlbGVjdGlvbigpIHtcclxuICBpZiAodHlwZW9mICh3aW5kb3cuZ2V0U2VsZWN0aW9uKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAvLyBTdGFuZGFyZFxyXG4gICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xyXG4gIGVsc2UgaWYgKGRvY3VtZW50LnNlbGVjdGlvbiAmJiB0eXBlb2YgKGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSkgPT09ICdmdW5jdGlvbicpXHJcbiAgLy8gSUVcclxuICAgIGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSgpO1xyXG59OyIsIi8qKlxyXG4gIEEgY29sbGVjdGlvbiBvZiB1c2VmdWwgZ2VuZXJpYyB1dGlscyBtYW5hZ2luZyBEYXRlc1xyXG4qKi9cclxudmFyIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpO1xyXG5cclxuZnVuY3Rpb24gY3VycmVudFdlZWsoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBnZXRGaXJzdFdlZWtEYXRlKG5ldyBEYXRlKCkpLFxyXG4gICAgZW5kOiBnZXRMYXN0V2Vla0RhdGUobmV3IERhdGUoKSlcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudFdlZWsgPSBjdXJyZW50V2VlaztcclxuXHJcbmZ1bmN0aW9uIG5leHRXZWVrKHN0YXJ0LCBlbmQpIHtcclxuICAvLyBVbmlxdWUgcGFyYW0gd2l0aCBib3RoIHByb3BpZXJ0aWVzOlxyXG4gIGlmIChzdGFydC5lbmQpIHtcclxuICAgIGVuZCA9IHN0YXJ0LmVuZDtcclxuICAgIHN0YXJ0ID0gc3RhcnQuc3RhcnQ7XHJcbiAgfVxyXG4gIC8vIE9wdGlvbmFsIGVuZDpcclxuICBlbmQgPSBlbmQgfHwgYWRkRGF5cyhzdGFydCwgNyk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBhZGREYXlzKHN0YXJ0LCA3KSxcclxuICAgIGVuZDogYWRkRGF5cyhlbmQsIDcpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLm5leHRXZWVrID0gbmV4dFdlZWs7XHJcblxyXG5mdW5jdGlvbiBnZXRGaXJzdFdlZWtEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSAtIGQuZ2V0RGF5KCkpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0Rmlyc3RXZWVrRGF0ZSA9IGdldEZpcnN0V2Vla0RhdGU7XHJcblxyXG5mdW5jdGlvbiBnZXRMYXN0V2Vla0RhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgKDYgLSBkLmdldERheSgpKSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRMYXN0V2Vla0RhdGUgPSBnZXRMYXN0V2Vla0RhdGU7XHJcblxyXG5mdW5jdGlvbiBpc0luQ3VycmVudFdlZWsoZGF0ZSkge1xyXG4gIHJldHVybiBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdFdlZWtEYXRlKGRhdGUpKSA9PSBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdFdlZWtEYXRlKG5ldyBEYXRlKCkpKTtcclxufVxyXG5leHBvcnRzLmlzSW5DdXJyZW50V2VlayA9IGlzSW5DdXJyZW50V2VlaztcclxuXHJcbmZ1bmN0aW9uIGFkZERheXMoZGF0ZSwgZGF5cykge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgZGF5cyk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5hZGREYXlzID0gYWRkRGF5cztcclxuXHJcbmZ1bmN0aW9uIGVhY2hEYXRlSW5SYW5nZShzdGFydCwgZW5kLCBmbikge1xyXG4gIGlmICghZm4uY2FsbCkgdGhyb3cgbmV3IEVycm9yKCdmbiBtdXN0IGJlIGEgZnVuY3Rpb24gb3IgXCJjYWxsXCJhYmxlIG9iamVjdCcpO1xyXG4gIHZhciBkYXRlID0gbmV3IERhdGUoc3RhcnQpO1xyXG4gIHZhciBpID0gMCwgcmV0O1xyXG4gIHdoaWxlIChkYXRlIDw9IGVuZCkge1xyXG4gICAgcmV0ID0gZm4uY2FsbChmbiwgZGF0ZSwgaSk7XHJcbiAgICAvLyBBbGxvdyBmbiB0byBjYW5jZWwgdGhlIGxvb3Agd2l0aCBzdHJpY3QgJ2ZhbHNlJ1xyXG4gICAgaWYgKHJldCA9PT0gZmFsc2UpXHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgMSk7XHJcbiAgICBpKys7XHJcbiAgfVxyXG59XHJcbmV4cG9ydHMuZWFjaERhdGVJblJhbmdlID0gZWFjaERhdGVJblJhbmdlO1xyXG5cclxuLyoqIE1vbnRocyAqKi9cclxuXHJcbmZ1bmN0aW9uIGdldEZpcnN0TW9udGhEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZSgxKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldEZpcnN0TW9udGhEYXRlID0gZ2V0Rmlyc3RNb250aERhdGU7XHJcblxyXG5mdW5jdGlvbiBnZXRMYXN0TW9udGhEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0TW9udGgoZC5nZXRNb250aCgpICsgMSwgMSk7XHJcbiAgZCA9IGFkZERheXMoZCwgLTEpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0TGFzdE1vbnRoRGF0ZSA9IGdldExhc3RNb250aERhdGU7XHJcblxyXG5mdW5jdGlvbiBpc0luQ3VycmVudE1vbnRoKGRhdGUpIHtcclxuICByZXR1cm4gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RNb250aERhdGUoZGF0ZSkpID09IGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0TW9udGhEYXRlKG5ldyBEYXRlKCkpKTtcclxufVxyXG5leHBvcnRzLmlzSW5DdXJyZW50TW9udGggPSBpc0luQ3VycmVudE1vbnRoO1xyXG5cclxuLyoqXHJcbiAgR2V0IGEgZGF0ZXMgcmFuZ2UgZm9yIHRoZSBjdXJyZW50IG1vbnRoXHJcbiAgKG9yIHRoZSBnaXZlbiBkYXRlIGFzIGJhc2UpXHJcbioqL1xyXG5mdW5jdGlvbiBjdXJyZW50TW9udGgoYmFzZURhdGUpIHtcclxuICBiYXNlRGF0ZSA9IGJhc2VEYXRlIHx8IG5ldyBEYXRlKCk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBnZXRGaXJzdE1vbnRoRGF0ZShiYXNlRGF0ZSksXHJcbiAgICBlbmQ6IGdldExhc3RNb250aERhdGUoYmFzZURhdGUpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmN1cnJlbnRNb250aCA9IGN1cnJlbnRNb250aDtcclxuXHJcbmZ1bmN0aW9uIG5leHRNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKSB7XHJcbiAgYW1vdW50TW9udGhzID0gYW1vdW50TW9udGhzIHx8IDE7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShmcm9tRGF0ZSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBkLnNldE1vbnRoKGQuZ2V0TW9udGgoKSArIGFtb3VudE1vbnRocywgMSksXHJcbiAgICBlbmQ6IGdldExhc3RNb250aERhdGUoZClcclxuICB9O1xyXG59XHJcbmV4cG9ydHMubmV4dE1vbnRoID0gbmV4dE1vbnRoO1xyXG5cclxuZnVuY3Rpb24gcHJldmlvdXNNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKSB7XHJcbiAgcmV0dXJuIG5leHRNb250aChmcm9tRGF0ZSwgMCAtIGFtb3VudE1vbnRocyk7XHJcbn1cclxuZXhwb3J0cy5wcmV2aW91c01vbnRoID0gcHJldmlvdXNNb250aDtcclxuXHJcbi8qKlxyXG4gIEdldCBhIGRhdGVzIHJhbmdlIGZvciB0aGUgY29tcGxldGUgd2Vla3NcclxuICB0aGF0IGFyZSBwYXJ0IG9mIHRoZSBjdXJyZW50IG1vbnRoXHJcbiAgKG9yIHRoZSBnaXZlbiBkYXRlIGFzIGJhc2UpLlxyXG4gIFRoYXQgbWVhbnMsIHRoYXQgc3RhcnQgZGF0ZSB3aWxsIGJlIHRoZSBmaXJzdFxyXG4gIHdlZWsgZGF0ZSBvZiB0aGUgZmlyc3QgbW9udGggd2VlayAodGhhdCBjYW5cclxuICBiZSB0aGUgZGF5IDEgb2YgdGhlIG1vbnRoIG9yIG9uZSBvZiB0aGUgbGFzdFxyXG4gIGRhdGVzIGZyb20gdGhlIHByZXZpb3VzIG1vbnRocyksXHJcbiAgYW5kIHNpbWlsYXIgZm9yIHRoZSBlbmQgZGF0ZSBiZWluZyB0aGUgXHJcbiAgbGFzdCB3ZWVrIGRhdGUgb2YgdGhlIGxhc3QgbW9udGggd2Vlay5cclxuXHJcbiAgQGluY2x1ZGVTaXhXZWVrczogc29tZXRpbWVzIGlzIHVzZWZ1bCBnZXQgZXZlciBhXHJcbiAgc2l4IHdlZWtzIGRhdGVzIHJhbmdlIHN0YXJpbmcgYnkgdGhlIGZpcnN0IHdlZWsgb2ZcclxuICB0aGUgYmFzZURhdGUgbW9udGguIEJ5IGRlZmF1bHQgaXMgZmFsc2UuXHJcbioqL1xyXG5mdW5jdGlvbiBjdXJyZW50TW9udGhXZWVrcyhiYXNlRGF0ZSwgaW5jbHVkZVNpeFdlZWtzKSB7XHJcbiAgdmFyIHIgPSBjdXJyZW50TW9udGgoYmFzZURhdGUpLFxyXG4gICAgcyA9IGdldEZpcnN0V2Vla0RhdGUoci5zdGFydCksXHJcbiAgICBlID0gaW5jbHVkZVNpeFdlZWtzID8gYWRkRGF5cyhzLCA2KjcgLSAxKSA6IGdldExhc3RXZWVrRGF0ZShyLmVuZCk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBzLFxyXG4gICAgZW5kOiBlXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmN1cnJlbnRNb250aFdlZWtzID0gY3VycmVudE1vbnRoV2Vla3M7XHJcblxyXG5mdW5jdGlvbiBuZXh0TW9udGhXZWVrcyhmcm9tRGF0ZSwgYW1vdW50TW9udGhzLCBpbmNsdWRlU2l4V2Vla3MpIHtcclxuICByZXR1cm4gY3VycmVudE1vbnRoV2Vla3MobmV4dE1vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpLnN0YXJ0LCBpbmNsdWRlU2l4V2Vla3MpO1xyXG59XHJcbmV4cG9ydHMubmV4dE1vbnRoV2Vla3MgPSBuZXh0TW9udGhXZWVrcztcclxuXHJcbmZ1bmN0aW9uIHByZXZpb3VzTW9udGhXZWVrcyhmcm9tRGF0ZSwgYW1vdW50TW9udGhzLCBpbmNsdWRlU2l4V2Vla3MpIHtcclxuICByZXR1cm4gY3VycmVudE1vbnRoV2Vla3MocHJldmlvdXNNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKS5zdGFydCwgaW5jbHVkZVNpeFdlZWtzKTtcclxufVxyXG5leHBvcnRzLnByZXZpb3VzTW9udGhXZWVrcyA9IHByZXZpb3VzTW9udGhXZWVrcztcclxuIiwiLyoqIFZlcnkgc2ltcGxlIGN1c3RvbS1mb3JtYXQgZnVuY3Rpb24gdG8gYWxsb3cgXHJcbmwxMG4gb2YgdGV4dHMuXHJcbkNvdmVyIGNhc2VzOlxyXG4tIE0gZm9yIG1vbnRoXHJcbi0gRCBmb3IgZGF5XHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvcm1hdERhdGUoZGF0ZSwgZm9ybWF0KSB7XHJcbiAgdmFyIHMgPSBmb3JtYXQsXHJcbiAgICAgIE0gPSBkYXRlLmdldE1vbnRoKCkgKyAxLFxyXG4gICAgICBEID0gZGF0ZS5nZXREYXRlKCk7XHJcbiAgcyA9IHMucmVwbGFjZSgvTS9nLCBNKTtcclxuICBzID0gcy5yZXBsYWNlKC9EL2csIEQpO1xyXG4gIHJldHVybiBzO1xyXG59OyIsIi8qKlxyXG4gIEV4cG9zaW5nIGFsbCB0aGUgcHVibGljIGZlYXR1cmVzIGFuZCBjb21wb25lbnRzIG9mIGF2YWlsYWJpbGl0eUNhbGVuZGFyXHJcbioqL1xyXG5leHBvcnRzLldlZWtseSA9IHJlcXVpcmUoJy4vV2Vla2x5Jyk7XHJcbmV4cG9ydHMuV29ya0hvdXJzID0gcmVxdWlyZSgnLi9Xb3JrSG91cnMnKTtcclxuZXhwb3J0cy5Nb250aGx5ID0gcmVxdWlyZSgnLi9Nb250aGx5Jyk7IiwiLyoqXHJcbiAgTWFrZSBhbiBlbGVtZW50IHVuc2VsZWN0YWJsZSwgdXNlZnVsIHRvIGltcGxlbWVudCBzb21lIGN1c3RvbVxyXG4gIHNlbGVjdGlvbiBiZWhhdmlvciBvciBkcmFnJmRyb3AuXHJcbiAgSWYgb2ZmZXJzIGFuICdvZmYnIG1ldGhvZCB0byByZXN0b3JlIGJhY2sgdGhlIGVsZW1lbnQgYmVoYXZpb3IuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICB2YXIgZmFsc3lmbiA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9O1xyXG4gIHZhciBub2RyYWdTdHlsZSA9IHtcclxuICAgICctd2Via2l0LXRvdWNoLWNhbGxvdXQnOiAnbm9uZScsXHJcbiAgICAnLWtodG1sLXVzZXItZHJhZyc6ICdub25lJyxcclxuICAgICctd2Via2l0LXVzZXItZHJhZyc6ICdub25lJyxcclxuICAgICcta2h0bWwtdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLXdlYmtpdC11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctbW96LXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy1tcy11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICd1c2VyLXNlbGVjdCc6ICdub25lJ1xyXG4gIH07XHJcbiAgdmFyIGRyYWdkZWZhdWx0U3R5bGUgPSB7XHJcbiAgICAnLXdlYmtpdC10b3VjaC1jYWxsb3V0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1raHRtbC11c2VyLWRyYWcnOiAnaW5oZXJpdCcsXHJcbiAgICAnLXdlYmtpdC11c2VyLWRyYWcnOiAnaW5oZXJpdCcsXHJcbiAgICAnLWtodG1sLXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy13ZWJraXQtdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLW1vei11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctbXMtdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAndXNlci1zZWxlY3QnOiAnaW5oZXJpdCdcclxuICB9O1xyXG5cclxuICB2YXIgb24gPSBmdW5jdGlvbiBtYWtlVW5zZWxlY3RhYmxlKGVsKSB7XHJcbiAgICBlbCA9ICQoZWwpO1xyXG4gICAgZWwub24oJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICAvLyQoZG9jdW1lbnQpLm9uKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgZWwuY3NzKG5vZHJhZ1N0eWxlKTtcclxuICB9O1xyXG5cclxuICB2YXIgb2ZmID0gZnVuY3Rpb24gb2ZmTWFrZVVuc2VsZWN0YWJsZShlbCkge1xyXG4gICAgZWwgPSAkKGVsKTtcclxuICAgIGVsLm9mZignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIC8vJChkb2N1bWVudCkub2ZmKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgZWwuY3NzKGRyYWdkZWZhdWx0U3R5bGUpO1xyXG4gIH07XHJcblxyXG4gIG9uLm9mZiA9IG9mZjtcclxuICByZXR1cm4gb247XHJcblxyXG59ICgpKTsiLCIvKipcclxuICBBIHNldCBvZiBnZW5lcmljIHV0aWxpdGllcyB0byBtYW5hZ2UganMgb2JqZWN0c1xyXG4qKi9cclxudmFyIHUgPSB7fTtcclxuXHJcbi8qKlxyXG4gIFBlcmZvcm1zIGEgY2FsbGJhY2sgb24gZWFjaCBwcm9wZXJ0eSBvd25lZCBieSB0aGUgb2JqZWN0XHJcbioqL1xyXG51LmVhY2hQcm9wZXJ0eSA9IGZ1bmN0aW9uIGVhY2hQcm9wZXJ0eShvYmosIGNiKSB7XHJcbiAgZm9yICh2YXIgcCBpbiBvYmopIHtcclxuICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KHApKSBjb250aW51ZTtcclxuICAgIGNiLmNhbGwob2JqLCBwLCBvYmpbcF0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gIEZpbHRlciB0aGUgZ2l2ZW4gb2JqZWN0IHJldHVybmluZyBhIG5ldyBvbmUgd2l0aCBvbmx5IHRoZSBwcm9wZXJ0aWVzXHJcbiAgKGFuZCBvcmlnaW5hbCB2YWx1ZXMgLXJlZnMgZm9yIG9iamVjdCB2YWx1ZXMtKSB0aGF0IHBhc3NcclxuICB0aGUgcHJvdmlkZWQgQGZpbHRlciBjYWxsYmFjayAoY2FsbGJhY2sgbXVzdCByZXR1cm4gYSB0cnVlL3RydXRoeSB2YWx1ZVxyXG4gIGZvciBlYWNoIHZhbHVlIGRlc2lyZWQgaW4gdGhlIHJlc3VsdCkuXHJcbiAgVGhlIEBmaWx0ZXIgY2FsbGJhY2sgaXRzIGV4ZWN1dGVkIHdpdGggdGhlIG9iamVjdCBhcyBjb250ZXh0IGFuZCByZWNlaXZlc1xyXG4gIGFzIHBhcmVtZXRlcnMgdGhlIHByb3BlcnR5IGtleSBhbmQgaXRzIHZhbHVlIFwiZmlsdGVyKGssIHYpXCIuXHJcbioqL1xyXG51LmZpbHRlclByb3BlcnRpZXMgPSBmdW5jdGlvbiBmaWx0ZXJQcm9wZXJpZXMob2JqLCBmaWx0ZXIpIHtcclxuICB2YXIgciA9IHt9O1xyXG4gIHUuZWFjaFByb3BlcnR5KG9iaiwgZnVuY3Rpb24gKGssIHYpIHtcclxuICAgIGlmIChmaWx0ZXIuY2FsbChvYmosIGssIHYpKVxyXG4gICAgICByW2tdID0gdjtcclxuICB9KTtcclxuICByZXR1cm4gcjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdTsiLCIvKipcclxuICBBdmFpbGFiaWxpdHlDYWxlbmRhciBzaGFyZWQgdXRpbHNcclxuKiovXHJcbnZhciBcclxuICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgZGF0ZVV0aWxzID0gcmVxdWlyZSgnLi9kYXRlVXRpbHMnKSxcclxuICBmb3JtYXREYXRlID0gcmVxdWlyZSgnLi9mb3JtYXREYXRlJyk7XHJcblxyXG4vLyBSZS1leHBvcnRpbmc6XHJcbmV4cG9ydHMuZm9ybWF0RGF0ZSA9IGZvcm1hdERhdGU7XHJcbmV4cG9ydHMuZGF0ZSA9IGRhdGVVdGlscztcclxuXHJcbi8qLS0tLS0tIENPTlNUQU5UUyAtLS0tLS0tLS0qL1xyXG52YXIgc3RhdHVzVHlwZXMgPSBleHBvcnRzLnN0YXR1c1R5cGVzID0gWyd1bmF2YWlsYWJsZScsICdhdmFpbGFibGUnXTtcclxuLy8gV2VlayBkYXlzIG5hbWVzIGluIGVuZ2xpc2ggZm9yIGludGVybmFsIHN5c3RlbVxyXG4vLyB1c2U7IE5PVCBmb3IgbG9jYWxpemF0aW9uL3RyYW5zbGF0aW9uLlxyXG52YXIgc3lzdGVtV2Vla0RheXMgPSBleHBvcnRzLnN5c3RlbVdlZWtEYXlzID0gW1xyXG4gICdzdW5kYXknLFxyXG4gICdtb25kYXknLFxyXG4gICd0dWVzZGF5JyxcclxuICAnd2VkbmVzZGF5JyxcclxuICAndGh1cnNkYXknLFxyXG4gICdmcmlkYXknLFxyXG4gICdzYXR1cmRheSdcclxuXTtcclxuXHJcbi8qLS0tLS0tLS0tIENPTkZJRyAtIElOU1RBTkNFIC0tLS0tLS0tLS0qL1xyXG52YXIgd2Vla2x5Q2xhc3NlcyA9IGV4cG9ydHMud2Vla2x5Q2xhc3NlcyA9IHtcclxuICBjYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyJyxcclxuICB3ZWVrbHlDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS13ZWVrbHknLFxyXG4gIGN1cnJlbnRXZWVrOiAnaXMtY3VycmVudFdlZWsnLFxyXG4gIGFjdGlvbnM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1hY3Rpb25zJyxcclxuICBwcmV2QWN0aW9uOiAnQWN0aW9ucy1wcmV2JyxcclxuICBuZXh0QWN0aW9uOiAnQWN0aW9ucy1uZXh0JyxcclxuICBkYXlzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItZGF5cycsXHJcbiAgc2xvdHM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1zbG90cycsXHJcbiAgc2xvdEhvdXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1ob3VyJyxcclxuICBzbG90U3RhdHVzUHJlZml4OiAnaXMtJyxcclxuICBsZWdlbmQ6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQnLFxyXG4gIGxlZ2VuZEF2YWlsYWJsZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZC1hdmFpbGFibGUnLFxyXG4gIGxlZ2VuZFVuYXZhaWxhYmxlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kLXVuYXZhaWxhYmxlJyxcclxuICBzdGF0dXM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1zdGF0dXMnLFxyXG4gIGVycm9yTWVzc2FnZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWVycm9yTWVzc2FnZSdcclxufTtcclxuXHJcbnZhciB3ZWVrbHlUZXh0cyA9IGV4cG9ydHMud2Vla2x5VGV4dHMgPSB7XHJcbiAgYWJicldlZWtEYXlzOiBbXHJcbiAgICAnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J1xyXG4gIF0sXHJcbiAgdG9kYXk6ICdUb2RheScsXHJcbiAgLy8gQWxsb3dlZCBzcGVjaWFsIHZhbHVlczogTTptb250aCwgRDpkYXlcclxuICBhYmJyRGF0ZUZvcm1hdDogJ00vRCdcclxufTtcclxuXHJcbi8qLS0tLS0tLS0tLS0gVklFVyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZXJDYWxlbmRhckVycm9yKGVycikge1xyXG4gIHZhciBtc2cgPSAnJztcclxuICBpZiAoZXJyICYmIGVyci5tZXNzYWdlKVxyXG4gICAgbXNnID0gZXJyLm1lc3NhZ2U7XHJcbiAgZWxzZSBpZiAoZXJyICYmIGVyci5leGNlcHRpb24gJiYgZXJyLmV4Y2VwdGlvbi5tZXNzYWdlKVxyXG4gICAgbXNnID0gZXJyLmV4Y2VwdGlvbi5tZXNzYWdlO1xyXG5cclxuICB2YXIgdGhhdCA9IHRoaXMuY29tcG9uZW50O1xyXG4gIHZhciBtc2dDb250YWluZXIgPSB0aGF0LiRlbC5maW5kKCcuJyArIHRoYXQuY2xhc3Nlcy5lcnJvck1lc3NhZ2UpO1xyXG5cclxuICBpZiAobXNnKSBtc2cgPSAobXNnQ29udGFpbmVyLmRhdGEoJ21lc3NhZ2UtcHJlZml4JykgfHwgJycpICsgbXNnO1xyXG5cclxuICBtc2dDb250YWluZXIudGV4dChtc2cpO1xyXG59XHJcbmV4cG9ydHMuaGFuZGxlckNhbGVuZGFyRXJyb3IgPSBoYW5kbGVyQ2FsZW5kYXJFcnJvcjtcclxuXHJcbmZ1bmN0aW9uIG1vdmVCaW5kUmFuZ2VJbkRheXMod2Vla2x5LCBkYXlzKSB7XHJcbiAgdmFyIFxyXG4gICAgc3RhcnQgPSBkYXRlVXRpbHMuYWRkRGF5cyh3ZWVrbHkuZGF0ZXNSYW5nZS5zdGFydCwgZGF5cyksXHJcbiAgICBlbmQgPSBkYXRlVXRpbHMuYWRkRGF5cyh3ZWVrbHkuZGF0ZXNSYW5nZS5lbmQsIGRheXMpLFxyXG4gICAgZGF0ZXNSYW5nZSA9IGRhdGVzVG9SYW5nZShzdGFydCwgZW5kKTtcclxuXHJcbiAgLy8gQ2hlY2sgY2FjaGUgYmVmb3JlIHRyeSB0byBmZXRjaFxyXG4gIHZhciBpbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZSh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG5cclxuICBpZiAoaW5DYWNoZSkge1xyXG4gICAgLy8gSnVzdCBzaG93IHRoZSBkYXRhXHJcbiAgICB3ZWVrbHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAvLyBQcmVmZXRjaCBleGNlcHQgaWYgdGhlcmUgaXMgb3RoZXIgcmVxdWVzdCBpbiBjb3Vyc2UgKGNhbiBiZSB0aGUgc2FtZSBwcmVmZXRjaCxcclxuICAgIC8vIGJ1dCBzdGlsbCBkb24ndCBvdmVybG9hZCB0aGUgc2VydmVyKVxyXG4gICAgaWYgKHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcbiAgfSBlbHNlIHtcclxuXHJcbiAgICAvLyBTdXBwb3J0IGZvciBwcmVmZXRjaGluZzpcclxuICAgIC8vIEl0cyBhdm9pZGVkIGlmIHRoZXJlIGFyZSByZXF1ZXN0cyBpbiBjb3Vyc2UsIHNpbmNlXHJcbiAgICAvLyB0aGF0IHdpbGwgYmUgYSBwcmVmZXRjaCBmb3IgdGhlIHNhbWUgZGF0YS5cclxuICAgIGlmICh3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCkge1xyXG4gICAgICAvLyBUaGUgbGFzdCByZXF1ZXN0IGluIHRoZSBwb29sICptdXN0KiBiZSB0aGUgbGFzdCBpbiBmaW5pc2hcclxuICAgICAgLy8gKG11c3QgYmUgb25seSBvbmUgaWYgYWxsIGdvZXMgZmluZSk6XHJcbiAgICAgIHZhciByZXF1ZXN0ID0gd2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0c1t3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgLy8gV2FpdCBmb3IgdGhlIGZldGNoIHRvIHBlcmZvcm0gYW5kIHNldHMgbG9hZGluZyB0byBub3RpZnkgdXNlclxyXG4gICAgICB3ZWVrbHkuJGVsLmFkZENsYXNzKHdlZWtseS5jbGFzc2VzLmZldGNoaW5nKTtcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBtb3ZlQmluZFJhbmdlSW5EYXlzKHdlZWtseSwgZGF5cyk7XHJcbiAgICAgICAgd2Vla2x5LiRlbC5yZW1vdmVDbGFzcyh3ZWVrbHkuY2xhc3Nlcy5mZXRjaGluZyB8fCAnXycpO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZldGNoIChkb3dubG9hZCkgdGhlIGRhdGEgYW5kIHNob3cgb24gcmVhZHk6XHJcbiAgICB3ZWVrbHlcclxuICAgIC5mZXRjaERhdGEoZGF0ZXNUb1F1ZXJ5KGRhdGVzUmFuZ2UpKVxyXG4gICAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICB3ZWVrbHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAgIC8vIFByZWZldGNoXHJcbiAgICAgIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLm1vdmVCaW5kUmFuZ2VJbkRheXMgPSBtb3ZlQmluZFJhbmdlSW5EYXlzO1xyXG5cclxuZnVuY3Rpb24gd2Vla2x5SXNEYXRhSW5DYWNoZSh3ZWVrbHksIGRhdGVzUmFuZ2UpIHtcclxuICBpZiAoIXdlZWtseS5kYXRhIHx8ICF3ZWVrbHkuZGF0YS5zbG90cykgcmV0dXJuIGZhbHNlO1xyXG4gIC8vIENoZWNrIGNhY2hlOiBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGRhdGUgaW4gdGhlIHJhbmdlXHJcbiAgLy8gd2l0aG91dCBkYXRhLCB3ZSBzZXQgaW5DYWNoZSBhcyBmYWxzZSBhbmQgZmV0Y2ggdGhlIGRhdGE6XHJcbiAgdmFyIGluQ2FjaGUgPSB0cnVlO1xyXG4gIGRhdGVVdGlscy5lYWNoRGF0ZUluUmFuZ2UoZGF0ZXNSYW5nZS5zdGFydCwgZGF0ZXNSYW5nZS5lbmQsIGZ1bmN0aW9uIChkYXRlKSB7XHJcbiAgICB2YXIgZGF0ZWtleSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG4gICAgaWYgKCF3ZWVrbHkuZGF0YS5zbG90c1tkYXRla2V5XSkge1xyXG4gICAgICBpbkNhY2hlID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gaW5DYWNoZTtcclxufVxyXG5leHBvcnRzLndlZWtseUlzRGF0YUluQ2FjaGUgPSB3ZWVrbHlJc0RhdGFJbkNhY2hlO1xyXG5cclxuLyoqXHJcbiAgRm9yIG5vdywgZ2l2ZW4gdGhlIEpTT04gc3RydWN0dXJlIHVzZWQsIHRoZSBsb2dpY1xyXG4gIG9mIG1vbnRobHlJc0RhdGFJbkNhY2hlIGlzIHRoZSBzYW1lIGFzIHdlZWtseUlzRGF0YUluQ2FjaGU6XHJcbioqL1xyXG52YXIgbW9udGhseUlzRGF0YUluQ2FjaGUgPSB3ZWVrbHlJc0RhdGFJbkNhY2hlO1xyXG5leHBvcnRzLm1vbnRobHlJc0RhdGFJbkNhY2hlID0gbW9udGhseUlzRGF0YUluQ2FjaGU7XHJcblxyXG5cclxuZnVuY3Rpb24gd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh3ZWVrbHksIGN1cnJlbnREYXRlc1JhbmdlKSB7XHJcbiAgdmFyIG5leHREYXRlc1JhbmdlID0gZGF0ZXNUb1JhbmdlKFxyXG4gICAgZGF0ZVV0aWxzLmFkZERheXMoY3VycmVudERhdGVzUmFuZ2Uuc3RhcnQsIDcpLFxyXG4gICAgZGF0ZVV0aWxzLmFkZERheXMoY3VycmVudERhdGVzUmFuZ2UuZW5kLCA3KVxyXG4gICk7XHJcblxyXG4gIGlmICghd2Vla2x5SXNEYXRhSW5DYWNoZSh3ZWVrbHksIG5leHREYXRlc1JhbmdlKSkge1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHZhciBwcmVmZXRjaFF1ZXJ5ID0gZGF0ZXNUb1F1ZXJ5KG5leHREYXRlc1JhbmdlKTtcclxuICAgIHdlZWtseS5mZXRjaERhdGEocHJlZmV0Y2hRdWVyeSwgbnVsbCwgdHJ1ZSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydHMud2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCA9IHdlZWtseUNoZWNrQW5kUHJlZmV0Y2g7XHJcblxyXG4vKiogVXBkYXRlIHRoZSB2aWV3IGxhYmVscyBmb3IgdGhlIHdlZWstZGF5cyAodGFibGUgaGVhZGVycylcclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZUxhYmVscyhkYXRlc1JhbmdlLCBjYWxlbmRhciwgb3B0aW9ucykge1xyXG4gIHZhciBzdGFydCA9IGRhdGVzUmFuZ2Uuc3RhcnQsXHJcbiAgICAgIGVuZCA9IGRhdGVzUmFuZ2UuZW5kO1xyXG5cclxuICB2YXIgZGF5cyA9IGNhbGVuZGFyLmZpbmQoJy4nICsgb3B0aW9ucy5jbGFzc2VzLmRheXMgKyAnIHRoJyk7XHJcbiAgdmFyIHRvZGF5ID0gZGF0ZUlTTy5kYXRlTG9jYWwobmV3IERhdGUoKSk7XHJcbiAgLy8gRmlyc3QgY2VsbCBpcyBlbXB0eSAoJ3RoZSBjcm9zcyBoZWFkZXJzIGNlbGwnKSwgdGhlbiBvZmZzZXQgaXMgMVxyXG4gIHZhciBvZmZzZXQgPSAxO1xyXG4gIGRhdGVVdGlscy5lYWNoRGF0ZUluUmFuZ2Uoc3RhcnQsIGVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIHZhciBjZWxsID0gJChkYXlzLmdldChvZmZzZXQgKyBpKSksXHJcbiAgICAgICAgc2RhdGUgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlKSxcclxuICAgICAgICBsYWJlbCA9IHNkYXRlO1xyXG5cclxuICAgIGlmICh0b2RheSA9PSBzZGF0ZSlcclxuICAgICAgbGFiZWwgPSBvcHRpb25zLnRleHRzLnRvZGF5O1xyXG4gICAgZWxzZVxyXG4gICAgICBsYWJlbCA9IG9wdGlvbnMudGV4dHMuYWJicldlZWtEYXlzW2RhdGUuZ2V0RGF5KCldICsgJyAnICsgZm9ybWF0RGF0ZShkYXRlLCBvcHRpb25zLnRleHRzLmFiYnJEYXRlRm9ybWF0KTtcclxuXHJcbiAgICBjZWxsLnRleHQobGFiZWwpO1xyXG4gIH0pO1xyXG59XHJcbmV4cG9ydHMudXBkYXRlTGFiZWxzID0gdXBkYXRlTGFiZWxzO1xyXG5cclxuZnVuY3Rpb24gZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIGRheSwgc2xvdCkge1xyXG4gIHNsb3QgPSBkYXRlSVNPLnBhcnNlKHNsb3QpO1xyXG4gIHZhciBcclxuICAgIHggPSBNYXRoLnJvdW5kKHNsb3QuZ2V0SG91cnMoKSksXHJcbiAgLy8gVGltZSBmcmFtZXMgKHNsb3RzKSBhcmUgMTUgbWludXRlcyBkaXZpc2lvbnNcclxuICAgIHkgPSBNYXRoLnJvdW5kKHNsb3QuZ2V0TWludXRlcygpIC8gMTUpLFxyXG4gICAgdHIgPSBzbG90c0NvbnRhaW5lci5jaGlsZHJlbignOmVxKCcgKyBNYXRoLnJvdW5kKHggKiA0ICsgeSkgKyAnKScpO1xyXG5cclxuICAvLyBTbG90IGNlbGwgZm9yIG8nY2xvY2sgaG91cnMgaXMgYXQgMSBwb3NpdGlvbiBvZmZzZXRcclxuICAvLyBiZWNhdXNlIG9mIHRoZSByb3ctaGVhZCBjZWxsXHJcbiAgdmFyIGRheU9mZnNldCA9ICh5ID09PSAwID8gZGF5ICsgMSA6IGRheSk7XHJcbiAgcmV0dXJuIHRyLmNoaWxkcmVuKCc6ZXEoJyArIGRheU9mZnNldCArICcpJyk7XHJcbn1cclxuZXhwb3J0cy5maW5kQ2VsbEJ5U2xvdCA9IGZpbmRDZWxsQnlTbG90O1xyXG5cclxuZnVuY3Rpb24gZmluZFNsb3RCeUNlbGwoc2xvdHNDb250YWluZXIsIGNlbGwpIHtcclxuICB2YXIgXHJcbiAgICB4ID0gY2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgoY2VsbCksXHJcbiAgICB5ID0gY2VsbC5jbG9zZXN0KCd0cicpLmluZGV4KCksXHJcbiAgICBmdWxsTWludXRlcyA9IHkgKiAxNSxcclxuICAgIGhvdXJzID0gTWF0aC5mbG9vcihmdWxsTWludXRlcyAvIDYwKSxcclxuICAgIG1pbnV0ZXMgPSBmdWxsTWludXRlcyAtIChob3VycyAqIDYwKSxcclxuICAgIHNsb3QgPSBuZXcgRGF0ZSgpO1xyXG4gIHNsb3Quc2V0SG91cnMoaG91cnMsIG1pbnV0ZXMsIDAsIDApO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZGF5OiB4LFxyXG4gICAgc2xvdDogc2xvdFxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5maW5kU2xvdEJ5Q2VsbCA9IGZpbmRTbG90QnlDZWxsO1xyXG5cclxuLyoqXHJcbk1hcmsgY2FsZW5kYXIgYXMgY3VycmVudC13ZWVrIGFuZCBkaXNhYmxlIHByZXYgYnV0dG9uLFxyXG5vciByZW1vdmUgdGhlIG1hcmsgYW5kIGVuYWJsZSBpdCBpZiBpcyBub3QuXHJcbioqL1xyXG5mdW5jdGlvbiBjaGVja0N1cnJlbnRXZWVrKGNhbGVuZGFyLCBkYXRlLCBvcHRpb25zKSB7XHJcbiAgdmFyIHllcCA9IGRhdGVVdGlscy5pc0luQ3VycmVudFdlZWsoZGF0ZSk7XHJcbiAgY2FsZW5kYXIudG9nZ2xlQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLmN1cnJlbnRXZWVrLCB5ZXApO1xyXG4gIGNhbGVuZGFyLmZpbmQoJy4nICsgb3B0aW9ucy5jbGFzc2VzLnByZXZBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxufVxyXG5leHBvcnRzLmNoZWNrQ3VycmVudFdlZWsgPSBjaGVja0N1cnJlbnRXZWVrO1xyXG5cclxuLyoqIEdldCBxdWVyeSBvYmplY3Qgd2l0aCB0aGUgZGF0ZSByYW5nZSBzcGVjaWZpZWQ6XHJcbioqL1xyXG5mdW5jdGlvbiBkYXRlc1RvUXVlcnkoc3RhcnQsIGVuZCkge1xyXG4gIC8vIFVuaXF1ZSBwYXJhbSB3aXRoIGJvdGggcHJvcGllcnRpZXM6XHJcbiAgaWYgKHN0YXJ0LmVuZCkge1xyXG4gICAgZW5kID0gc3RhcnQuZW5kO1xyXG4gICAgc3RhcnQgPSBzdGFydC5zdGFydDtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBkYXRlSVNPLmRhdGVMb2NhbChzdGFydCwgdHJ1ZSksXHJcbiAgICBlbmQ6IGRhdGVJU08uZGF0ZUxvY2FsKGVuZCwgdHJ1ZSlcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuZGF0ZXNUb1F1ZXJ5ID0gZGF0ZXNUb1F1ZXJ5O1xyXG5cclxuLyoqIFBhY2sgdHdvIGRhdGVzIGluIGEgc2ltcGxlIGJ1dCB1c2VmdWxcclxuc3RydWN0dXJlIHsgc3RhcnQsIGVuZCB9XHJcbioqL1xyXG5mdW5jdGlvbiBkYXRlc1RvUmFuZ2Uoc3RhcnQsIGVuZCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogc3RhcnQsXHJcbiAgICBlbmQ6IGVuZFxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5kYXRlc1RvUmFuZ2UgPSBkYXRlc1RvUmFuZ2U7XHJcbiIsIi8qIEdlbmVyaWMgYmxvY2tVSSBvcHRpb25zIHNldHMgKi9cclxudmFyIGxvYWRpbmdCbG9jayA9IHsgbWVzc2FnZTogJzxpbWcgd2lkdGg9XCI0OHB4XCIgaGVpZ2h0PVwiNDhweFwiIGNsYXNzPVwibG9hZGluZy1pbmRpY2F0b3JcIiBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyB9O1xyXG52YXIgZXJyb3JCbG9jayA9IGZ1bmN0aW9uIChlcnJvciwgcmVsb2FkLCBzdHlsZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjc3M6ICQuZXh0ZW5kKHsgY3Vyc29yOiAnZGVmYXVsdCcgfSwgc3R5bGUgfHwge30pLFxyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj5UaGVyZSB3YXMgYW4gZXJyb3InICtcclxuICAgICAgICAgICAgKGVycm9yID8gJzogJyArIGVycm9yIDogJycpICtcclxuICAgICAgICAgICAgKHJlbG9hZCA/ICcgPGEgaHJlZj1cImphdmFzY3JpcHQ6ICcgKyByZWxvYWQgKyAnO1wiPkNsaWNrIHRvIHJlbG9hZDwvYT4nIDogJycpICtcclxuICAgICAgICAgICAgJzwvZGl2PidcclxuICAgIH07XHJcbn07XHJcbnZhciBpbmZvQmxvY2sgPSBmdW5jdGlvbiAobWVzc2FnZSwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuICQuZXh0ZW5kKHtcclxuICAgICAgICBtZXNzYWdlOiAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPjxkaXYgY2xhc3M9XCJpbmZvXCI+JyArIG1lc3NhZ2UgKyAnPC9kaXY+J1xyXG4gICAgICAgIC8qLGNzczogeyBjdXJzb3I6ICdkZWZhdWx0JyB9Ki9cclxuICAgICAgICAsIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGU6XHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgbG9hZGluZzogbG9hZGluZ0Jsb2NrLFxyXG4gICAgICAgIGVycm9yOiBlcnJvckJsb2NrLFxyXG4gICAgICAgIGluZm86IGluZm9CbG9ja1xyXG4gICAgfTtcclxufSIsIi8qPSBDaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzXHJcbiogdG8gbm90aWZ5IHVzZXIgYWJvdXQgY2hhbmdlcyBpbiBmb3JtcyxcclxuKiB0YWJzLCB0aGF0IHdpbGwgYmUgbG9zdCBpZiBnbyBhd2F5IGZyb21cclxuKiB0aGUgcGFnZS4gSXQga25vd3Mgd2hlbiBhIGZvcm0gaXMgc3VibWl0dGVkXHJcbiogYW5kIHNhdmVkIHRvIGRpc2FibGUgbm90aWZpY2F0aW9uLCBhbmQgZ2l2ZXNcclxuKiBtZXRob2RzIGZvciBvdGhlciBzY3JpcHRzIHRvIG5vdGlmeSBjaGFuZ2VzXHJcbiogb3Igc2F2aW5nLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZ2V0WFBhdGggPSByZXF1aXJlKCcuL2dldFhQYXRoJyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHtcclxuICAgIGNoYW5nZXNMaXN0OiB7fSxcclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBudWxsLFxyXG4gICAgICAgIGdlbmVyaWNDaGFuZ2VTdXBwb3J0OiB0cnVlLFxyXG4gICAgICAgIGdlbmVyaWNTdWJtaXRTdXBwb3J0OiBmYWxzZSxcclxuICAgICAgICBjaGFuZ2VkRm9ybUNsYXNzOiAnaGFzLWNoYW5nZXMnLFxyXG4gICAgICAgIGNoYW5nZWRFbGVtZW50Q2xhc3M6ICdjaGFuZ2VkJyxcclxuICAgICAgICBub3RpZnlDbGFzczogJ25vdGlmeS1jaGFuZ2VzJ1xyXG4gICAgfSxcclxuICAgIGluaXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gVXNlciBub3RpZmljYXRpb24gdG8gcHJldmVudCBsb3N0IGNoYW5nZXMgZG9uZVxyXG4gICAgICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hhbmdlc05vdGlmaWNhdGlvbi5ub3RpZnkoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQodGhpcy5kZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKCFvcHRpb25zLnRhcmdldClcclxuICAgICAgICAgICAgb3B0aW9ucy50YXJnZXQgPSBkb2N1bWVudDtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljQ2hhbmdlU3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ2NoYW5nZScsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpIDppbnB1dFtuYW1lXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoJCh0aGlzKS5jbG9zZXN0KCdmb3JtJykuZ2V0KDApLCB0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY1N1Ym1pdFN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdzdWJtaXQnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBBZGQgbm90aWZpY2F0aW9uIGNsYXNzIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLm5vdGlmeUNsYXNzKTtcclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGNoYW5nZSBpbiB0aGUgcHJvcGVydHkgbGlzdCByZXR1cm5pbmcgdGhlIG1lc3NhZ2U6XHJcbiAgICAgICAgZm9yICh2YXIgYyBpbiB0aGlzLmNoYW5nZXNMaXN0KVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWl0TWVzc2FnZSB8fCAodGhpcy5xdWl0TWVzc2FnZSA9ICQoJyNsY3Jlcy1xdWl0LXdpdGhvdXQtc2F2ZScpLnRleHQoKSkgfHwgJyc7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJDaGFuZ2U6IGZ1bmN0aW9uIChmLCBlKSB7XHJcbiAgICAgICAgaWYgKCFlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgdmFyIGZsID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSB8fCBbXTtcclxuICAgICAgICBpZiAoJC5pc0FycmF5KGUpKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZS5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJDaGFuZ2UoZiwgZVtpXSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG4gPSBlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgKGUpICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBuID0gZS5uYW1lO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiByZWFsbHkgdGhlcmUgd2FzIGEgY2hhbmdlIGNoZWNraW5nIGRlZmF1bHQgZWxlbWVudCB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChlLmRlZmF1bHRWYWx1ZSkgIT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5jaGVja2VkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLnNlbGVjdGVkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgZS52YWx1ZSA9PSBlLmRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlcmUgd2FzIG5vIGNoYW5nZSwgbm8gY29udGludWVcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBtYXliZSBpcyBhIHJlZ3Jlc3Npb24gZnJvbSBhIGNoYW5nZSBhbmQgbm93IHRoZSBvcmlnaW5hbCB2YWx1ZSBhZ2FpblxyXG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIHJlbW92ZSBmcm9tIGNoYW5nZXMgbGlzdCBkb2luZyByZWdpc3RlclNhdmVcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJTYXZlKGYsIFtuXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJChlKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIShuIGluIGZsKSlcclxuICAgICAgICAgICAgZmwucHVzaChuKTtcclxuICAgICAgICAkKGYpXHJcbiAgICAgICAgLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcylcclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnQgbmFtZSBjaGFuZ2VkLCBmb3JtIGVsZW1lbnQgY2hhbmdlZCAodGhpcyBjYW4gYmUgbnVsbClcclxuICAgICAgICAudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIFtmLCBuLCBlXSk7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJTYXZlOiBmdW5jdGlvbiAoZiwgZWxzKSB7XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBwcmV2RWxzID0gJC5leHRlbmQoW10sIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKTtcclxuICAgICAgICB2YXIgciA9IHRydWU7XHJcbiAgICAgICAgaWYgKGVscykge1xyXG4gICAgICAgICAgICB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9ICQuZ3JlcCh0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSwgZnVuY3Rpb24gKGVsKSB7IHJldHVybiAoJC5pbkFycmF5KGVsLCBlbHMpID09IC0xKTsgfSk7XHJcbiAgICAgICAgICAgIC8vIERvbid0IHJlbW92ZSAnZicgbGlzdCBpZiBpcyBub3QgZW1wdHlcclxuICAgICAgICAgICAgciA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLmxlbmd0aCA9PT0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHIpIHtcclxuICAgICAgICAgICAgJChmKS5yZW1vdmVDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRGb3JtQ2xhc3MpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV07XHJcbiAgICAgICAgICAgIC8vIGxpbmsgZWxlbWVudHMgZnJvbSBlbHMgdG8gY2xlYW4tdXAgaXRzIGNsYXNzZXNcclxuICAgICAgICAgICAgZWxzID0gcHJldkVscztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcGFzcyBkYXRhOiBmb3JtLCBlbGVtZW50cyByZWdpc3RlcmVkIGFzIHNhdmUgKHRoaXMgY2FuIGJlIG51bGwpLCBhbmQgJ2Zvcm0gZnVsbHkgc2F2ZWQnIGFzIHRoaXJkIHBhcmFtIChib29sKVxyXG4gICAgICAgICQoZikudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uU2F2ZVJlZ2lzdGVyZWQnLCBbZiwgZWxzLCByXSk7XHJcbiAgICAgICAgdmFyIGxjaG4gPSB0aGlzO1xyXG4gICAgICAgIGlmIChlbHMpICQuZWFjaChlbHMsIGZ1bmN0aW9uICgpIHsgJCgnW25hbWU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSh0aGlzKSArICdcIl0nKS5yZW1vdmVDbGFzcyhsY2huLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpOyB9KTtcclxuICAgICAgICByZXR1cm4gcHJldkVscztcclxuICAgIH1cclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gY2hhbmdlc05vdGlmaWNhdGlvbjtcclxufSIsIi8qIFV0aWxpdHkgdG8gY3JlYXRlIGlmcmFtZSB3aXRoIGluamVjdGVkIGh0bWwvY29udGVudCBpbnN0ZWFkIG9mIFVSTC5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlSWZyYW1lKGNvbnRlbnQsIHNpemUpIHtcclxuICAgIHZhciAkaWZyYW1lID0gJCgnPGlmcmFtZSB3aWR0aD1cIicgKyBzaXplLndpZHRoICsgJ1wiIGhlaWdodD1cIicgKyBzaXplLmhlaWdodCArICdcIiBzdHlsZT1cImJvcmRlcjpub25lO1wiPjwvaWZyYW1lPicpO1xyXG4gICAgdmFyIGlmcmFtZSA9ICRpZnJhbWUuZ2V0KDApO1xyXG4gICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIHJlYWR5XHJcbiAgICB2YXIgaWZyYW1lbG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZnJhbWUub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIFVzaW5nIGlmcmFtZWxvYWRlZCB0byBhdm9pZCBpbmZpbml0ZSBsb29wc1xyXG4gICAgICAgIGlmICghaWZyYW1lbG9hZGVkKSB7XHJcbiAgICAgICAgICAgIGlmcmFtZWxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBjb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuICRpZnJhbWU7XHJcbn07XHJcblxyXG4vKiBQdXRzIGZ1bGwgaHRtbCBpbnNpZGUgdGhlIGlmcmFtZSBlbGVtZW50IHBhc3NlZCBpbiBhIHNlY3VyZSBhbmQgY29tcGxpYW50IG1vZGUgKi9cclxuZnVuY3Rpb24gaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGh0bWwpIHtcclxuICAgIC8vIHB1dCBhamF4IGRhdGEgaW5zaWRlIGlmcmFtZSByZXBsYWNpbmcgYWxsIHRoZWlyIGh0bWwgaW4gc2VjdXJlIFxyXG4gICAgLy8gY29tcGxpYW50IG1vZGUgKCQuaHRtbCBkb24ndCB3b3JrcyB0byBpbmplY3QgPGh0bWw+PGhlYWQ+IGNvbnRlbnQpXHJcblxyXG4gICAgLyogZG9jdW1lbnQgQVBJIHZlcnNpb24gKHByb2JsZW1zIHdpdGggSUUsIGRvbid0IGV4ZWN1dGUgaWZyYW1lLWh0bWwgc2NyaXB0cykgKi9cclxuICAgIC8qdmFyIGlmcmFtZURvYyA9XHJcbiAgICAvLyBXM0MgY29tcGxpYW50OiBucywgZmlyZWZveC1nZWNrbywgY2hyb21lL3NhZmFyaS13ZWJraXQsIG9wZXJhLCBpZTlcclxuICAgIGlmcmFtZS5jb250ZW50RG9jdW1lbnQgfHxcclxuICAgIC8vIG9sZCBJRSAoNS41KylcclxuICAgIChpZnJhbWUuY29udGVudFdpbmRvdyA/IGlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50IDogbnVsbCkgfHxcclxuICAgIC8vIGZhbGxiYWNrICh2ZXJ5IG9sZCBJRT8pXHJcbiAgICBkb2N1bWVudC5mcmFtZXNbaWZyYW1lLmlkXS5kb2N1bWVudDtcclxuICAgIGlmcmFtZURvYy5vcGVuKCk7XHJcbiAgICBpZnJhbWVEb2Mud3JpdGUoaHRtbCk7XHJcbiAgICBpZnJhbWVEb2MuY2xvc2UoKTsqL1xyXG5cclxuICAgIC8qIGphdmFzY3JpcHQgVVJJIHZlcnNpb24gKHdvcmtzIGZpbmUgZXZlcnl3aGVyZSEpICovXHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdy5jb250ZW50cyA9IGh0bWw7XHJcbiAgICBpZnJhbWUuc3JjID0gJ2phdmFzY3JpcHQ6d2luZG93W1wiY29udGVudHNcIl0nO1xyXG5cclxuICAgIC8vIEFib3V0IHRoaXMgdGVjaG5pcXVlLCB0aGlzIGh0dHA6Ly9zcGFyZWN5Y2xlcy53b3JkcHJlc3MuY29tLzIwMTIvMDMvMDgvaW5qZWN0LWNvbnRlbnQtaW50by1hLW5ldy1pZnJhbWUvXHJcbn1cclxuXHJcbiIsIi8qIENSVURMIEhlbHBlciAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcbnZhciBnZXRUZXh0ID0gcmVxdWlyZSgnLi9nZXRUZXh0Jyk7XHJcbnZhciBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxuXHJcbmV4cG9ydHMuZGVmYXVsdFNldHRpbmdzID0ge1xyXG4gIGVmZmVjdHM6IHtcclxuICAgICdzaG93LXZpZXdlcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LFxyXG4gICAgJ2hpZGUtdmlld2VyJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sXHJcbiAgICAnc2hvdy1lZGl0b3InOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSwgLy8gdGhlIHNhbWUgYXMganF1ZXJ5LXVpIHsgZWZmZWN0OiAnc2xpZGUnLCBkdXJhdGlvbjogJ3Nsb3cnLCBkaXJlY3Rpb246ICdkb3duJyB9XHJcbiAgICAnaGlkZS1lZGl0b3InOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfVxyXG4gIH0sXHJcbiAgZXZlbnRzOiB7XHJcbiAgICAnZWRpdC1lbmRzJzogJ2NydWRsLWVkaXQtZW5kcycsXHJcbiAgICAnZWRpdC1zdGFydHMnOiAnY3J1ZGwtZWRpdC1zdGFydHMnLFxyXG4gICAgJ2VkaXRvci1yZWFkeSc6ICdjcnVkbC1lZGl0b3ItcmVhZHknLFxyXG4gICAgJ2VkaXRvci1zaG93ZWQnOiAnY3J1ZGwtZWRpdG9yLXNob3dlZCcsXHJcbiAgICAnY3JlYXRlJzogJ2NydWRsLWNyZWF0ZScsXHJcbiAgICAndXBkYXRlJzogJ2NydWRsLXVwZGF0ZScsXHJcbiAgICAnZGVsZXRlJzogJ2NydWRsLWRlbGV0ZSdcclxuICB9LFxyXG4gIGRhdGE6IHtcclxuICAgICdmb2N1cy1jbG9zZXN0Jzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtY2xvc2VzdCcsXHJcbiAgICAgICdkZWZhdWx0JzogJyonXHJcbiAgICB9LFxyXG4gICAgJ2ZvY3VzLW1hcmdpbic6IHtcclxuICAgICAgbmFtZTogJ2NydWRsLWZvY3VzLW1hcmdpbicsXHJcbiAgICAgICdkZWZhdWx0JzogMFxyXG4gICAgfSxcclxuICAgICdmb2N1cy1kdXJhdGlvbic6IHtcclxuICAgICAgbmFtZTogJ2NydWRsLWZvY3VzLWR1cmF0aW9uJyxcclxuICAgICAgJ2RlZmF1bHQnOiAyMDBcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICBVdGlsaXR5IHRvIGdldCBhIGRhdGEgdmFsdWUgb3IgdGhlIGRlZmF1bHQgYmFzZWQgb24gdGhlIGluc3RhbmNlXHJcbiAgc2V0dGluZ3Mgb24gdGhlIGdpdmVuIGVsZW1lbnRcclxuKiovXHJcbmZ1bmN0aW9uIGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgZWwsIHNldHRpbmdOYW1lKSB7XHJcbiAgdmFyXHJcbiAgICBzZXR0aW5nID0gaW5zdGFuY2Uuc2V0dGluZ3MuZGF0YVtzZXR0aW5nTmFtZV0sXHJcbiAgICB2YWwgPSBlbC5kYXRhKHNldHRpbmcubmFtZSkgfHwgc2V0dGluZ1snZGVmYXVsdCddO1xyXG4gIHJldHVybiB2YWw7XHJcbn1cclxuXHJcbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiBzZXR1cENydWRsKG9uU3VjY2Vzcywgb25FcnJvciwgb25Db21wbGV0ZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICBvbjogZnVuY3Rpb24gb24oc2VsZWN0b3IsIHNldHRpbmdzKSB7XHJcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgJy5jcnVkbCc7XHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IHtcclxuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXHJcbiAgICAgICAgZWxlbWVudHM6ICQoc2VsZWN0b3IpXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIEV4dGVuZGluZyBkZWZhdWx0IHNldHRpbmdzIHdpdGggcHJvdmlkZWQgb25lcyxcclxuICAgICAgLy8gYnV0IHNvbWUgY2FuIGJlIHR3ZWFrIG91dHNpZGUgdG9vLlxyXG4gICAgICBpbnN0YW5jZS5zZXR0aW5ncyA9ICQuZXh0ZW5kKHRydWUsIGV4cG9ydHMuZGVmYXVsdFNldHRpbmdzLCBzZXR0aW5ncyk7XHJcbiAgICAgIGluc3RhbmNlLmVsZW1lbnRzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjcnVkbCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKGNydWRsLmRhdGEoJ19fY3J1ZGxfaW5pdGlhbGl6ZWRfXycpID09PSB0cnVlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGRjdHggPSBjcnVkbC5kYXRhKCdjcnVkbC1jb250ZXh0JykgfHwgJyc7XHJcbiAgICAgICAgdmFyIHZ3ciA9IGNydWRsLmZpbmQoJy5jcnVkbC12aWV3ZXInKTtcclxuICAgICAgICB2YXIgZHRyID0gY3J1ZGwuZmluZCgnLmNydWRsLWVkaXRvcicpO1xyXG4gICAgICAgIHZhciBpaWRwYXIgPSBjcnVkbC5kYXRhKCdjcnVkbC1pdGVtLWlkLXBhcmFtZXRlcicpIHx8ICdJdGVtSUQnO1xyXG4gICAgICAgIHZhciBmb3JtcGFycyA9IHsgYWN0aW9uOiAnY3JlYXRlJyB9O1xyXG4gICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSAwO1xyXG4gICAgICAgIHZhciBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldEV4dHJhUXVlcnkoZWwpIHtcclxuICAgICAgICAgIC8vIEdldCBleHRyYSBxdWVyeSBvZiB0aGUgZWxlbWVudCwgaWYgYW55OlxyXG4gICAgICAgICAgdmFyIHhxID0gZWwuZGF0YSgnY3J1ZGwtZXh0cmEtcXVlcnknKSB8fCAnJztcclxuICAgICAgICAgIGlmICh4cSkgeHEgPSAnJicgKyB4cTtcclxuICAgICAgICAgIC8vIEl0ZXJhdGUgYWxsIHBhcmVudHMgaW5jbHVkaW5nIHRoZSAnY3J1ZGwnIGVsZW1lbnQgKHBhcmVudHNVbnRpbCBleGNsdWRlcyB0aGUgZmlyc3QgZWxlbWVudCBnaXZlbixcclxuICAgICAgICAgIC8vIGJlY2F1c2Ugb2YgdGhhdCB3ZSBnZXQgaXRzIHBhcmVudCgpKVxyXG4gICAgICAgICAgLy8gRm9yIGFueSBvZiB0aGVtIHdpdGggYW4gZXh0cmEtcXVlcnksIGFwcGVuZCBpdDpcclxuICAgICAgICAgIGVsLnBhcmVudHNVbnRpbChjcnVkbC5wYXJlbnQoKSwgJ1tkYXRhLWNydWRsLWV4dHJhLXF1ZXJ5XScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgeCA9ICQodGhpcykuZGF0YSgnY3J1ZGwtZXh0cmEtcXVlcnknKTtcclxuICAgICAgICAgICAgaWYgKHgpIHhxICs9ICcmJyArIHg7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHJldHVybiB4cTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNydWRsLmZpbmQoJy5jcnVkbC1jcmVhdGUnKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gMDtcclxuICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICdjcmVhdGUnO1xyXG4gICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuICAgICAgICAgIGR0ci5yZWxvYWQoe1xyXG4gICAgICAgICAgICB1cmw6IGZ1bmN0aW9uICh1cmwsIGRlZmF1bHRVcmwpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdFVybCArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBkdHIueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy1lZGl0b3InXSlcclxuICAgICAgICAgICAgICAucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1zaG93ZWQnXSwgW2R0cl0pO1xyXG4gICAgICAgICAgICAgICAgZHRyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBIaWRlIHZpZXdlciB3aGVuIGluIGVkaXRvcjpcclxuICAgICAgICAgIHZ3ci54aGlkZShpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLXZpZXdlciddKTtcclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10pXHJcbiAgICAgICAgICAudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHMuY3JlYXRlKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZ3clxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLXVwZGF0ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgaXRlbSA9ICR0LmNsb3Nlc3QoJy5jcnVkbC1pdGVtJyk7XHJcbiAgICAgICAgICB2YXIgaXRlbWlkID0gaXRlbS5kYXRhKCdjcnVkbC1pdGVtLWlkJyk7XHJcbiAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gaXRlbWlkO1xyXG4gICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ3VwZGF0ZSc7XHJcbiAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG4gICAgICAgICAgZHRyLnJlbG9hZCh7XHJcbiAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKHVybCwgZGVmYXVsdFVybCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VXJsICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGR0ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LWVkaXRvciddKVxyXG4gICAgICAgICAgICAgIC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgICBkdHIuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEhpZGUgdmlld2VyIHdoZW4gaW4gZWRpdG9yOlxyXG4gICAgICAgICAgdndyLnhoaWRlKGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtdmlld2VyJ10pO1xyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSlcclxuICAgICAgICAgIC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50cy51cGRhdGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLWRlbGV0ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgaXRlbSA9ICR0LmNsb3Nlc3QoJy5jcnVkbC1pdGVtJyk7XHJcbiAgICAgICAgICB2YXIgaXRlbWlkID0gaXRlbS5kYXRhKCdjcnVkbC1pdGVtLWlkJyk7XHJcblxyXG4gICAgICAgICAgaWYgKGNvbmZpcm0oZ2V0VGV4dCgnY29uZmlybS1kZWxldGUtY3J1ZGwtaXRlbS1tZXNzYWdlOicgKyBkY3R4KSkpIHtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbignPGRpdj4nICsgZ2V0VGV4dCgnZGVsZXRlLWNydWRsLWl0ZW0tbG9hZGluZy1tZXNzYWdlOicgKyBkY3R4KSArICc8L2Rpdj4nLCBpdGVtKTtcclxuICAgICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IGl0ZW1pZDtcclxuICAgICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ2RlbGV0ZSc7XHJcbiAgICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgdXJsOiBkdHIuYXR0cignZGF0YS1zb3VyY2UtdXJsJykgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxLFxyXG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJzxkaXY+JyArIGRhdGEuUmVzdWx0ICsgJzwvZGl2PicsIGl0ZW0sIG51bGwsIHtcclxuICAgICAgICAgICAgICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uZmFkZU91dCgnc2xvdycsIGZ1bmN0aW9uICgpIHsgaXRlbS5yZW1vdmUoKTsgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoZGF0YSwgdGV4dCwgangpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgICAgICAgICAgICAgIG9uRXJyb3IoangsIG1lc3NhZ2UsIGV4KTtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKGl0ZW0pO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgY29tcGxldGU6IG9uQ29tcGxldGVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZGVsZXRlJ10pO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZmluaXNoRWRpdCgpIHtcclxuICAgICAgICAgIGZ1bmN0aW9uIG9uY29tcGxldGUoYW5vdGhlck9uQ29tcGxldGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAvLyBTaG93IGFnYWluIHRoZSBWaWV3ZXJcclxuICAgICAgICAgICAgICAvL3Z3ci5zbGlkZURvd24oJ3Nsb3cnKTtcclxuICAgICAgICAgICAgICBpZiAoIXZ3ci5pcygnOnZpc2libGUnKSlcclxuICAgICAgICAgICAgICAgIHZ3ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LXZpZXdlciddKTtcclxuICAgICAgICAgICAgICAvLyBNYXJrIHRoZSBmb3JtIGFzIHVuY2hhbmdlZCB0byBhdm9pZCBwZXJzaXN0aW5nIHdhcm5pbmdzXHJcbiAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZHRyLmZpbmQoJ2Zvcm0nKS5nZXQoMCkpO1xyXG4gICAgICAgICAgICAgIC8vIEF2b2lkIGNhY2hlZCBjb250ZW50IG9uIHRoZSBFZGl0b3JcclxuICAgICAgICAgICAgICBkdHIuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gU2Nyb2xsIHRvIHByZXNlcnZlIGNvcnJlY3QgZm9jdXMgKG9uIGxhcmdlIHBhZ2VzIHdpdGggc2hhcmVkIGNvbnRlbnQgdXNlciBjYW4gZ2V0XHJcbiAgICAgICAgICAgICAgLy8gbG9zdCBhZnRlciBhbiBlZGl0aW9uKVxyXG4gICAgICAgICAgICAgIC8vICh3ZSBxdWV1ZSBhZnRlciB2d3IueHNob3cgYmVjYXVzZSB3ZSBuZWVkIHRvIGRvIGl0IGFmdGVyIHRoZSB4c2hvdyBmaW5pc2gpXHJcbiAgICAgICAgICAgICAgdndyLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c0Nsb3Nlc3QgPSBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGNydWRsLCAnZm9jdXMtY2xvc2VzdCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzRWxlbWVudCA9IGNydWRsLmNsb3Nlc3QoZm9jdXNDbG9zZXN0KTtcclxuICAgICAgICAgICAgICAgIC8vIElmIG5vIGNsb3Nlc3QsIGdldCB0aGUgY3J1ZGxcclxuICAgICAgICAgICAgICAgIGlmIChmb2N1c0VsZW1lbnQubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICBmb2N1c0VsZW1lbnQgPSBjcnVkbDtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c01hcmdpbiA9IGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgY3J1ZGwsICdmb2N1cy1tYXJnaW4nKTtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c0R1cmF0aW9uID0gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBjcnVkbCwgJ2ZvY3VzLWR1cmF0aW9uJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oZm9jdXNFbGVtZW50LCB7IG1hcmdpblRvcDogZm9jdXNNYXJnaW4sIGR1cmF0aW9uOiBmb2N1c0R1cmF0aW9uIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHZ3ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIHVzZXIgY2FsbGJhY2s6XHJcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoYW5vdGhlck9uQ29tcGxldGUpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgYW5vdGhlck9uQ29tcGxldGUuYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gTk9URTogRmlyc3QsIHdlIG5vdGlmeSB0aGUgY2hhbmdlcy1zYXZlZCBhbmQgZXZlbnQsIHRoaXMgbGFzdCBhbGxvd3NcclxuICAgICAgICAgIC8vIGNsaWVudCBzY3JpcHRzIHRvIGRvIHRhc2tzIGp1c3QgYmVmb3JlIHRoZSBlZGl0b3IgYmVnaW5zIHRvIGNsb3NlXHJcbiAgICAgICAgICAvLyAoYXZvaWRpbmcgcHJvYmxlbXMgbGlrZSB3aXRoIHRoZSAnbW92ZUZvY3VzVG8nIG5vdCBiZWluZyBwcmVjaXNlIGlmIHRoZVxyXG4gICAgICAgICAgLy8gYW5pbWF0aW9uIGR1cmF0aW9uIGlzIHRoZSBzYW1lIG9uIGNsaWVudCBzY3JpcHQgYW5kIGhpZGUtZWRpdG9yKS5cclxuICAgICAgICAgIC8vIFRoZW4sIGVkaXRvciBnZXRzIGhpZGRlblxyXG4gICAgICAgICAgLy8gVE9ETzogVGhpcyBjYW4gZ2V0IGVuaGFuY2VkIHRvIGFsbG93IGxhcmdlciBkdXJhdGlvbnMgb24gY2xpZW50LXNjcmlwdHNcclxuICAgICAgICAgIC8vIHdpdGhvdXQgYWZmZWN0IG1vdmVGb2N1c1RvIHBhc3NpbmcgaW4gdGhlIHRyaWdnZXIgYW4gb2JqZWN0IHRoYXQgaG9sZHNcclxuICAgICAgICAgIC8vIGEgUHJvbWlzZS9EZWZlcnJlZCB0byBiZSBzZXQgYnkgY2xpZW50LXNjcmlwdCBhcyAnaGlkZS1lZGl0b3IgJlxyXG4gICAgICAgICAgLy8gdmlld2VyLXNob3cgbXVzdCBzdGFydCB3aGVuIHRoaXMgcHJvbWlzZSBnZXRzIGZ1bGxmaWxsZWQnLCBhbGxvd2luZyB0b1xyXG4gICAgICAgICAgLy8gaGF2ZSBhIHNlcXVlbmNlIChmaXJzdCBjbGllbnQtc2NyaXB0cywgdGhlbiBoaWRlLWVkaXRvcikuXHJcblxyXG4gICAgICAgICAgLy8gTWFyayBmb3JtIGFzIHNhdmVkIHRvIHJlbW92ZSB0aGUgJ2hhcy1jaGFuZ2VzJyBtYXJrXHJcbiAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcblxyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10pO1xyXG5cclxuICAgICAgICAgIC8vIFdlIG5lZWQgYSBjdXN0b20gY29tcGxldGUgY2FsbGJhY2ssIGJ1dCB0byBub3QgcmVwbGFjZSB0aGUgdXNlciBjYWxsYmFjaywgd2VcclxuICAgICAgICAgIC8vIGNsb25lIGZpcnN0IHRoZSBzZXR0aW5ncyBhbmQgdGhlbiBhcHBseSBvdXIgY2FsbGJhY2sgdGhhdCBpbnRlcm5hbGx5IHdpbGwgY2FsbFxyXG4gICAgICAgICAgLy8gdGhlIHVzZXIgY2FsbGJhY2sgcHJvcGVybHkgKGlmIGFueSlcclxuICAgICAgICAgIHZhciB3aXRoY2FsbGJhY2sgPSAkLmV4dGVuZCh0cnVlLCB7fSwgaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS1lZGl0b3InXSk7XHJcbiAgICAgICAgICB3aXRoY2FsbGJhY2suY29tcGxldGUgPSBvbmNvbXBsZXRlKHdpdGhjYWxsYmFjay5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAvLyBIaWRpbmcgZWRpdG9yOlxyXG4gICAgICAgICAgZHRyLnhoaWRlKHdpdGhjYWxsYmFjayk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZHRyXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtY2FuY2VsJywgZmluaXNoRWRpdClcclxuICAgICAgICAub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCAnLmFqYXgtYm94JywgZmluaXNoRWRpdClcclxuICAgICAgICAvLyBBbiBldmVudGVkIG1ldGhvZDogdHJpZ2dlciB0aGlzIGV2ZW50IHRvIGV4ZWN1dGUgYSB2aWV3ZXIgcmVsb2FkOlxyXG4gICAgICAgIC5vbigncmVsb2FkTGlzdCcsICcqJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdndyLmZpbmQoJy5jcnVkbC1saXN0JykucmVsb2FkKHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0JywgJ2Zvcm0sIGZpZWxkc2V0JywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDAgfHwgZGF0YS5Db2RlID09IDUgfHwgZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyB2aWV3ZXIgYW5kIHJlbG9hZCBsaXN0OlxyXG4gICAgICAgICAgICB2d3IuZmluZCgnLmNydWRsLWxpc3QnKS5yZWxvYWQoeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gQSBzbWFsbCBkZWxheSB0byBsZXQgdXNlciB0byBzZWUgdGhlIG5ldyBtZXNzYWdlIG9uIGJ1dHRvbiBiZWZvcmVcclxuICAgICAgICAgIC8vIGhpZGUgaXQgKGJlY2F1c2UgaXMgaW5zaWRlIHRoZSBlZGl0b3IpXHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDUpXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmluaXNoRWRpdCwgMTAwMCk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLGZpZWxkc2V0JywgZnVuY3Rpb24gKGpiLCBmb3JtLCBqeCkge1xyXG4gICAgICAgICAgLy8gRW1pdCB0aGUgJ2VkaXRvci1yZWFkeScgZXZlbnQgb24gZWRpdG9yIEh0bWwgYmVpbmcgcmVwbGFjZWRcclxuICAgICAgICAgIC8vIChmaXJzdCBsb2FkIG9yIG5leHQgbG9hZHMgYmVjYXVzZSBvZiBzZXJ2ZXItc2lkZSB2YWxpZGF0aW9uIGVycm9ycylcclxuICAgICAgICAgIC8vIHRvIGFsbG93IGxpc3RlbmVycyB0byBkbyBhbnkgd29yayBvdmVyIGl0cyAobmV3KSBET00gZWxlbWVudHMuXHJcbiAgICAgICAgICAvLyBUaGUgc2Vjb25kIGN1c3RvbSBwYXJhbWV0ZXIgcGFzc2VkIG1lYW5zIGlzIG1lYW4gdG9cclxuICAgICAgICAgIC8vIGRpc3Rpbmd1aXNoIHRoZSBmaXJzdCB0aW1lIGNvbnRlbnQgbG9hZCBhbmQgc3VjY2Vzc2l2ZSB1cGRhdGVzIChkdWUgdG8gdmFsaWRhdGlvbiBlcnJvcnMpLlxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBbZHRyLCBlZGl0b3JJbml0aWFsTG9hZF0pO1xyXG5cclxuICAgICAgICAgIC8vIE5leHQgdGltZXM6XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nLCB0cnVlKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gaW5zdGFuY2U7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuIiwiLyoqXHJcbiAgVGhpcyBtb2R1bGUgaGFzIHV0aWxpdGllcyB0byBjb252ZXJ0IGEgRGF0ZSBvYmplY3QgaW50b1xyXG4gIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvbGxvd2luZyBJU08tODYwMSBzcGVjaWZpY2F0aW9uLlxyXG4gIFxyXG4gIElOQ09NUExFVEUgQlVUIFVTRUZVTC5cclxuICBcclxuICBTdGFuZGFyZCByZWZlcnMgdG8gZm9ybWF0IHZhcmlhdGlvbnM6XHJcbiAgLSBiYXNpYzogbWluaW11bSBzZXBhcmF0b3JzXHJcbiAgLSBleHRlbmRlZDogYWxsIHNlcGFyYXRvcnMsIG1vcmUgcmVhZGFibGVcclxuICBCeSBkZWZhdWx0LCBhbGwgbWV0aG9kcyBwcmludHMgdGhlIGJhc2ljIGZvcm1hdCxcclxuICBleGNlcHRzIHRoZSBwYXJhbWV0ZXIgJ2V4dGVuZGVkJyBpcyBzZXQgdG8gdHJ1ZVxyXG5cclxuICBUT0RPOlxyXG4gIC0gVFo6IGFsbG93IGZvciBUaW1lIFpvbmUgc3VmZml4ZXMgKHBhcnNlIGFsbG93IGl0IGFuZCBcclxuICAgIGRldGVjdCBVVEMgYnV0IGRvIG5vdGhpbmcgd2l0aCBhbnkgdGltZSB6b25lIG9mZnNldCBkZXRlY3RlZClcclxuICAtIEZyYWN0aW9ucyBvZiBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLmRhdGVVVEMgPSBmdW5jdGlvbiBkYXRlVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIG0gPSAoZGF0ZS5nZXRVVENNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgZCA9IGRhdGUuZ2V0VVRDRGF0ZSgpLnRvU3RyaW5nKCksXHJcbiAgICAgIHkgPSBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgIGQgPSAnMCcgKyBkO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4geSArICctJyArIG0gKyAnLScgKyBkO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiB5ICsgbSArIGQ7XHJcbn07XHJcblxyXG5leHBvcnRzLmRhdGVMb2NhbCA9IGZ1bmN0aW9uIGRhdGVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBtID0gKGRhdGUuZ2V0TW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgIGQgPSBkYXRlLmdldERhdGUoKS50b1N0cmluZygpLFxyXG4gICAgICB5ID0gZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCk7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgIGQgPSAnMCcgKyBkO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4geSArICctJyArIG0gKyAnLScgKyBkO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiB5ICsgbSArIGQ7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycywgbWludXRlcyBhbmQgc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy50aW1lTG9jYWwgPSBmdW5jdGlvbiB0aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgcyA9IGRhdGUuZ2V0U2Vjb25kcygpLnRvU3RyaW5nKCksXHJcbiAgICAgIGhtID0gZXhwb3J0cy5zaG9ydFRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PSAxKVxyXG4gICAgcyA9ICcwJyArIHM7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBobSArICc6JyArIHM7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGhtICsgcztcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzLCBtaW51dGVzIGFuZCBzZWNvbmRzIFVUQ1xyXG4qKi9cclxuZXhwb3J0cy50aW1lVVRDID0gZnVuY3Rpb24gdGltZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBzID0gZGF0ZS5nZXRVVENTZWNvbmRzKCkudG9TdHJpbmcoKSxcclxuICAgICAgaG0gPSBleHBvcnRzLnNob3J0VGltZVVUQyhkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PSAxKVxyXG4gICAgcyA9ICcwJyArIHM7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBobSArICc6JyArIHM7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGhtICsgcztcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzIGFuZCBtaW51dGVzXHJcbioqL1xyXG5leHBvcnRzLnNob3J0VGltZUxvY2FsID0gZnVuY3Rpb24gc2hvcnRUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgaCA9IGRhdGUuZ2V0SG91cnMoKS50b1N0cmluZygpLFxyXG4gICAgICBtID0gZGF0ZS5nZXRNaW51dGVzKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKGgubGVuZ3RoID09IDEpXHJcbiAgICBoID0gJzAnICsgaDtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaCArICc6JyArIG07XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGggKyBtO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMgYW5kIG1pbnV0ZXMgVVRDXHJcbioqL1xyXG5leHBvcnRzLnNob3J0VGltZVVUQyA9IGZ1bmN0aW9uIHNob3J0VGltZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBoID0gZGF0ZS5nZXRVVENIb3VycygpLnRvU3RyaW5nKCksXHJcbiAgICAgIG0gPSBkYXRlLmdldFVUQ01pbnV0ZXMoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAoaC5sZW5ndGggPT0gMSlcclxuICAgIGggPSAnMCcgKyBoO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBoICsgJzonICsgbTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaCArIG07XHJcbn07XHJcblxyXG4vKipcclxuICBUT0RPOiBIb3VycywgbWludXRlcywgc2Vjb25kcyBhbmQgZnJhY3Rpb25zIG9mIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMubG9uZ1RpbWVMb2NhbCA9IGZ1bmN0aW9uIGxvbmdUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICAvL1RPRE9cclxufTtcclxuXHJcbi8qKlxyXG4gIFVUQyBEYXRlIGFuZCBUaW1lIHNlcGFyYXRlZCBieSBULlxyXG4gIFN0YW5kYXJkIGFsbG93cyBvbWl0IHRoZSBzZXBhcmF0b3IgYXMgZXhjZXB0aW9uYWwsIGJvdGggcGFydHMgYWdyZWVtZW50LCBjYXNlcztcclxuICBjYW4gYmUgZG9uZSBwYXNzaW5nIHRydWUgYXMgb2Ygb21pdFNlcGFyYXRvciBwYXJhbWV0ZXIsIGJ5IGRlZmF1bHQgZmFsc2UuXHJcbioqL1xyXG5leHBvcnRzLmRhdGV0aW1lTG9jYWwgPSBmdW5jdGlvbiBkYXRldGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkLCBvbWl0U2VwYXJhdG9yKSB7XHJcbiAgdmFyIGQgPSBleHBvcnRzLmRhdGVMb2NhbChkYXRlLCBleHRlbmRlZCksXHJcbiAgICAgIHQgPSBleHBvcnRzLnRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChvbWl0U2VwYXJhdG9yKVxyXG4gICAgcmV0dXJuIGQgKyB0O1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBkICsgJ1QnICsgdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIExvY2FsIERhdGUgYW5kIFRpbWUgc2VwYXJhdGVkIGJ5IFQuXHJcbiAgU3RhbmRhcmQgYWxsb3dzIG9taXQgdGhlIHNlcGFyYXRvciBhcyBleGNlcHRpb25hbCwgYm90aCBwYXJ0cyBhZ3JlZW1lbnQsIGNhc2VzO1xyXG4gIGNhbiBiZSBkb25lIHBhc3NpbmcgdHJ1ZSBhcyBvZiBvbWl0U2VwYXJhdG9yIHBhcmFtZXRlciwgYnkgZGVmYXVsdCBmYWxzZS5cclxuKiovXHJcbmV4cG9ydHMuZGF0ZXRpbWVVVEMgPSBmdW5jdGlvbiBkYXRldGltZVVUQyhkYXRlLCBleHRlbmRlZCwgb21pdFNlcGFyYXRvcikge1xyXG4gIHZhciBkID0gZXhwb3J0cy5kYXRlVVRDKGRhdGUsIGV4dGVuZGVkKSxcclxuICAgICAgdCA9IGV4cG9ydHMudGltZVVUQyhkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChvbWl0U2VwYXJhdG9yKVxyXG4gICAgcmV0dXJuIGQgKyB0O1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBkICsgJ1QnICsgdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIFBhcnNlIGEgc3RyaW5nIGludG8gYSBEYXRlIG9iamVjdCBpZiBpcyBhIHZhbGlkIElTTy04NjAxIGZvcm1hdC5cclxuICBQYXJzZSBzaW5nbGUgZGF0ZSwgc2luZ2xlIHRpbWUgb3IgZGF0ZS10aW1lIGZvcm1hdHMuXHJcbiAgSU1QT1JUQU5UOiBJdCBkb2VzIE5PVCBjb252ZXJ0IGJldHdlZW4gdGhlIGRhdGVzdHIgVGltZVpvbmUgYW5kIHRoZVxyXG4gIGxvY2FsIFRpbWVab25lIChlaXRoZXIgaXQgYWxsb3dzIGRhdGVzdHIgdG8gaW5jbHVkZWQgVGltZVpvbmUgaW5mb3JtYXRpb24pXHJcbiAgVE9ETzogT3B0aW9uYWwgVCBzZXBhcmF0b3IgaXMgbm90IGFsbG93ZWQuXHJcbiAgVE9ETzogTWlsbGlzZWNvbmRzL2ZyYWN0aW9ucyBvZiBzZWNvbmRzIG5vdCBzdXBwb3J0ZWRcclxuKiovXHJcbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiBwYXJzZShkYXRlc3RyKSB7XHJcbiAgdmFyIGR0ID0gZGF0ZXN0ci5zcGxpdCgnVCcpLFxyXG4gICAgZGF0ZSA9IGR0WzBdLFxyXG4gICAgdGltZSA9IGR0Lmxlbmd0aCA9PSAyID8gZHRbMV0gOiBudWxsO1xyXG5cclxuICBpZiAoZHQubGVuZ3RoID4gMilcclxuICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCBmb3JtYXRcIik7XHJcblxyXG4gIC8vIENoZWNrIGlmIGRhdGUgY29udGFpbnMgYSB0aW1lO1xyXG4gIC8vIGJlY2F1c2UgbWF5YmUgZGF0ZXN0ciBpcyBvbmx5IHRoZSB0aW1lIHBhcnRcclxuICBpZiAoLzp8XlxcZHs0LDZ9W15cXC1dKFxcLlxcZCopPyg/Olp8WytcXC1dLiopPyQvLnRlc3QoZGF0ZSkpIHtcclxuICAgIHRpbWUgPSBkYXRlO1xyXG4gICAgZGF0ZSA9IG51bGw7XHJcbiAgfVxyXG5cclxuICB2YXIgeSwgbSwgZCwgaCwgbW0sIHMsIHR6LCB1dGM7XHJcblxyXG4gIGlmIChkYXRlKSB7XHJcbiAgICB2YXIgZHBhcnRzID0gLyhcXGR7NH0pXFwtPyhcXGR7Mn0pXFwtPyhcXGR7Mn0pLy5leGVjKGRhdGUpO1xyXG4gICAgaWYgKCFkcGFydHMpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCBkYXRlIGZvcm1hdFwiKTtcclxuXHJcbiAgICB5ID0gZHBhcnRzWzFdO1xyXG4gICAgbSA9IGRwYXJ0c1syXTtcclxuICAgIGQgPSBkcGFydHNbM107XHJcbiAgfVxyXG5cclxuICBpZiAodGltZSkge1xyXG4gICAgdmFyIHRwYXJ0cyA9IC8oXFxkezJ9KTo/KFxcZHsyfSkoPzo6PyhcXGR7Mn0pKT8oWnxbK1xcLV0uKik/Ly5leGVjKHRpbWUpO1xyXG4gICAgaWYgKCF0cGFydHMpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCB0aW1lIGZvcm1hdFwiKTtcclxuXHJcbiAgICBoID0gdHBhcnRzWzFdO1xyXG4gICAgbW0gPSB0cGFydHNbMl07XHJcbiAgICBzID0gdHBhcnRzLmxlbmd0aCA+IDMgPyB0cGFydHNbM10gOiBudWxsO1xyXG4gICAgdHogPSB0cGFydHMubGVuZ3RoID4gNCA/IHRwYXJ0c1s0XSA6IG51bGw7XHJcbiAgICAvLyBEZXRlY3RzIGlmIGlzIGEgdGltZSBpbiBVVEM6XHJcbiAgICB1dGMgPSAvXlokL2kudGVzdCh0eik7XHJcbiAgfVxyXG5cclxuICAvLyBWYXIgdG8gaG9sZCB0aGUgcGFyc2VkIHZhbHVlLCB3ZSBzdGFydCB3aXRoIHRvZGF5LFxyXG4gIC8vIHRoYXQgd2lsbCBmaWxsIHRoZSBtaXNzaW5nIHBhcnRzXHJcbiAgdmFyIHBhcnNlZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICBpZiAoZGF0ZSkge1xyXG4gICAgLy8gVXBkYXRpbmcgdGhlIGRhdGUgb2JqZWN0IHdpdGggZWFjaCB5ZWFyLCBtb250aCBhbmQgZGF0ZS9kYXkgZGV0ZWN0ZWQ6XHJcbiAgICBpZiAodXRjKVxyXG4gICAgICBwYXJzZWREYXRlLnNldFVUQ0Z1bGxZZWFyKHksIG0sIGQpO1xyXG4gICAgZWxzZVxyXG4gICAgICBwYXJzZWREYXRlLnNldEZ1bGxZZWFyKHksIG0sIGQpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRpbWUpIHtcclxuICAgIGlmICh1dGMpXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0VVRDSG91cnMoaCwgbW0sIHMpO1xyXG4gICAgZWxzZVxyXG4gICAgICBwYXJzZWREYXRlLnNldEhvdXJzKGgsIG1tLCBzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gQSBkYXRlIHdpdGhvdXQgdGltZSBwYXJ0IG11c3QgYmUgY29uc2lkZXJlZCBhcyAwMDowMDowMCBpbnN0ZWFkIG9mIGN1cnJlbnQgdGltZVxyXG4gICAgcGFyc2VkRGF0ZS5zZXRIb3VycygwLCAwLCAwKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBwYXJzZWREYXRlO1xyXG59OyIsIi8qIERhdGUgcGlja2VyIGluaXRpYWxpemF0aW9uIGFuZCB1c2VcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBEYXRlUGlja2VyKCkge1xyXG4gICAgLy8gRGF0ZSBQaWNrZXJcclxuICAgICQuZGF0ZXBpY2tlci5zZXREZWZhdWx0cygkLmRhdGVwaWNrZXIucmVnaW9uYWxbJCgnaHRtbCcpLmF0dHIoJ2xhbmcnKV0pO1xyXG4gICAgJCgnLmRhdGUtcGljaycsIGRvY3VtZW50KS5kYXRlcGlja2VyKHtcclxuICAgICAgICBzaG93QW5pbTogJ2JsaW5kJ1xyXG4gICAgfSk7XHJcbiAgICBhcHBseURhdGVQaWNrZXIoKTtcclxufVxyXG5mdW5jdGlvbiBhcHBseURhdGVQaWNrZXIoZWxlbWVudCkge1xyXG4gICAgJChcIi5kYXRlLXBpY2tcIiwgZWxlbWVudCB8fCBkb2N1bWVudClcclxuICAgIC8vLnZhbChuZXcgRGF0ZSgpLmFzU3RyaW5nKCQuZGF0ZXBpY2tlci5fZGVmYXVsdHMuZGF0ZUZvcm1hdCkpXHJcbiAgICAuZGF0ZXBpY2tlcih7XHJcbiAgICAgICAgc2hvd0FuaW06IFwiYmxpbmRcIlxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXQ6IHNldHVwRGF0ZVBpY2tlcixcclxuICAgICAgICBhcHBseTogYXBwbHlEYXRlUGlja2VyXHJcbiAgICB9O1xyXG4iLCIvKiBGb3JtYXQgYSBkYXRlIGFzIFlZWVktTU0tREQgaW4gVVRDIGZvciBzYXZlIHVzXHJcbiAgICB0byBpbnRlcmNoYW5nZSB3aXRoIG90aGVyIG1vZHVsZXMgb3IgYXBwcy5cclxuKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcoZGF0ZSkge1xyXG4gICAgdmFyIG0gPSAoZGF0ZS5nZXRVVENNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgICBkID0gZGF0ZS5nZXRVVENEYXRlKCkudG9TdHJpbmcoKTtcclxuICAgIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgIG0gPSAnMCcgKyBtO1xyXG4gICAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICAgICAgZCA9ICcwJyArIGQ7XHJcbiAgICByZXR1cm4gZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCkgKyAnLScgKyBtICsgJy0nICsgZDtcclxufTsiLCIvKiogQW4gaTE4biB1dGlsaXR5LCBnZXQgYSB0cmFuc2xhdGlvbiB0ZXh0IGJ5IGxvb2tpbmcgZm9yIHNwZWNpZmljIGVsZW1lbnRzIGluIHRoZSBodG1sXHJcbndpdGggdGhlIG5hbWUgZ2l2ZW4gYXMgZmlyc3QgcGFyYW1lbnRlciBhbmQgYXBwbHlpbmcgdGhlIGdpdmVuIHZhbHVlcyBvbiBzZWNvbmQgYW5kIFxyXG5vdGhlciBwYXJhbWV0ZXJzLlxyXG4gICAgVE9ETzogUkUtSU1QTEVNRU5UIG5vdCB1c2luZyBqUXVlcnkgbmVsc2UgRE9NIGVsZW1lbnRzLCBvciBhbG1vc3Qgbm90IGVsZW1lbnRzIGluc2lkZSBib2R5XHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxuZnVuY3Rpb24gZ2V0VGV4dCgpIHtcclxuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgLy8gR2V0IGtleSBhbmQgdHJhbnNsYXRlIGl0XHJcbiAgICB2YXIgZm9ybWF0dGVkID0gYXJnc1swXTtcclxuICAgIHZhciB0ZXh0ID0gJCgnI2xjcmVzLScgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGZvcm1hdHRlZCkpLnRleHQoKTtcclxuICAgIGlmICh0ZXh0KVxyXG4gICAgICAgIGZvcm1hdHRlZCA9IHRleHQ7XHJcbiAgICAvLyBBcHBseSBmb3JtYXQgdG8gdGhlIHRleHQgd2l0aCBhZGRpdGlvbmFsIHBhcmFtZXRlcnNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCdcXFxceycgKyBpICsgJ1xcXFx9JywgJ2dpJyk7XHJcbiAgICAgICAgZm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UocmVnZXhwLCBhcmdzW2kgKyAxXSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZm9ybWF0dGVkO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFRleHQ7IiwiLyoqIFJldHVybnMgdGhlIHBhdGggdG8gdGhlIGdpdmVuIGVsZW1lbnQgaW4gWFBhdGggY29udmVudGlvblxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGdldFhQYXRoKGVsZW1lbnQpIHtcclxuICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnQuaWQpXHJcbiAgICAgICAgcmV0dXJuICcvLypbQGlkPVwiJyArIGVsZW1lbnQuaWQgKyAnXCJdJztcclxuICAgIHZhciB4cGF0aCA9ICcnO1xyXG4gICAgZm9yICg7IGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PSAxOyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gJChlbGVtZW50LnBhcmVudE5vZGUpLmNoaWxkcmVuKGVsZW1lbnQudGFnTmFtZSkuaW5kZXgoZWxlbWVudCkgKyAxO1xyXG4gICAgICAgIGlkID0gKGlkID4gMSA/ICdbJyArIGlkICsgJ10nIDogJycpO1xyXG4gICAgICAgIHhwYXRoID0gJy8nICsgZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgKyBpZCArIHhwYXRoO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHhwYXRoO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFhQYXRoO1xyXG4iLCIvLyBJdCBleGVjdXRlcyB0aGUgZ2l2ZW4gJ3JlYWR5JyBmdW5jdGlvbiBhcyBwYXJhbWV0ZXIgd2hlblxyXG4vLyBtYXAgZW52aXJvbm1lbnQgaXMgcmVhZHkgKHdoZW4gZ29vZ2xlIG1hcHMgYXBpIGFuZCBzY3JpcHQgaXNcclxuLy8gbG9hZGVkIGFuZCByZWFkeSB0byB1c2UsIG9yIGlubWVkaWF0ZWx5IGlmIGlzIGFscmVhZHkgbG9hZGVkKS5cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpO1xyXG5cclxuLy8gUHJpdmF0ZSBzdGF0aWMgY29sbGVjdGlvbiBvZiBjYWxsYmFja3MgcmVnaXN0ZXJlZFxyXG52YXIgc3RhY2sgPSBbXTtcclxuXHJcbnZhciBnb29nbGVNYXBSZWFkeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ29vZ2xlTWFwUmVhZHkocmVhZHkpIHtcclxuICBzdGFjay5wdXNoKHJlYWR5KTtcclxuXHJcbiAgaWYgKGdvb2dsZU1hcFJlYWR5LmlzUmVhZHkpXHJcbiAgICByZWFkeSgpO1xyXG4gIGVsc2UgaWYgKCFnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcpIHtcclxuICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IHRydWU7XHJcbiAgICBsb2FkZXIubG9hZCh7XHJcbiAgICAgIHNjcmlwdHM6IFtcImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vanNhcGlcIl0sXHJcbiAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBmdW5jdGlvbiAoKSB7IHJldHVybiAhIXdpbmRvdy5nb29nbGU7IH0sXHJcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZ29vZ2xlLmxvYWQoXCJtYXBzXCIsIFwiMy4xMFwiLCB7IG90aGVyX3BhcmFtczogXCJzZW5zb3I9ZmFsc2VcIiwgXCJjYWxsYmFja1wiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBnb29nbGVNYXBSZWFkeS5pc1JlYWR5ID0gdHJ1ZTtcclxuICAgICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgc3RhY2tbaV0oKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBVdGlsaXR5IHRvIGZvcmNlIHRoZSByZWZyZXNoIG9mIG1hcHMgdGhhdCBzb2x2ZSB0aGUgcHJvYmxlbSB3aXRoIGJhZC1zaXplZCBtYXAgYXJlYVxyXG5nb29nbGVNYXBSZWFkeS5yZWZyZXNoTWFwID0gZnVuY3Rpb24gcmVmcmVzaE1hcHMobWFwKSB7XHJcbiAgZ29vZ2xlTWFwUmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlcihtYXAsIFwicmVzaXplXCIpO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiBHVUlEIEdlbmVyYXRvclxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBndWlkR2VuZXJhdG9yKCkge1xyXG4gICAgdmFyIFM0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKSB8IDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIChTNCgpICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFM0KCkgKyBTNCgpKTtcclxufTsiLCIvKipcclxuICAgIEdlbmVyaWMgc2NyaXB0IGZvciBmaWVsZHNldHMgd2l0aCBjbGFzcyAuaGFzLWNvbmZpcm0sIGFsbG93aW5nIHNob3dcclxuICAgIHRoZSBjb250ZW50IG9ubHkgaWYgdGhlIG1haW4gY29uZmlybSBmaWVsZHMgaGF2ZSAneWVzJyBzZWxlY3RlZC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG52YXIgZGVmYXVsdFNlbGVjdG9yID0gJ2ZpZWxkc2V0Lmhhcy1jb25maXJtID4gLmNvbmZpcm0gaW5wdXQnO1xyXG5cclxuZnVuY3Rpb24gb25jaGFuZ2UoKSB7XHJcbiAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgZnMgPSB0LmNsb3Nlc3QoJ2ZpZWxkc2V0Jyk7XHJcbiAgICBpZiAodC5pcygnOmNoZWNrZWQnKSlcclxuICAgICAgICBpZiAodC52YWwoKSA9PSAneWVzJyB8fCB0LnZhbCgpID09ICdUcnVlJylcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3MoJ2NvbmZpcm1lZC1ubycpLmFkZENsYXNzKCdjb25maXJtZWQteWVzJyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcygnY29uZmlybWVkLXllcycpLmFkZENsYXNzKCdjb25maXJtZWQtbm8nKTtcclxufVxyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBkZWZhdWx0U2VsZWN0b3I7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIHNlbGVjdG9yLCBvbmNoYW5nZSk7XHJcbiAgICAvLyBQZXJmb3JtcyBmaXJzdCBjaGVjazpcclxuICAgICQoc2VsZWN0b3IpLmNoYW5nZSgpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5vZmYgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgZGVmYXVsdFNlbGVjdG9yO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9mZignY2hhbmdlJywgc2VsZWN0b3IpO1xyXG59OyIsIi8qIEludGVybmF6aW9uYWxpemF0aW9uIFV0aWxpdGllc1xyXG4gKi9cclxudmFyIGkxOG4gPSB7fTtcclxuaTE4bi5kaXN0YW5jZVVuaXRzID0ge1xyXG4gICAgJ0VTJzogJ2ttJyxcclxuICAgICdVUyc6ICdtaWxlcydcclxufTtcclxuaTE4bi5udW1lcmljTWlsZXNTZXBhcmF0b3IgPSB7XHJcbiAgICAnZXMtRVMnOiAnLicsXHJcbiAgICAnZXMtVVMnOiAnLicsXHJcbiAgICAnZW4tVVMnOiAnLCcsXHJcbiAgICAnZW4tRVMnOiAnLCdcclxufTtcclxuaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvciA9IHtcclxuICAgICdlcy1FUyc6ICcsJyxcclxuICAgICdlcy1VUyc6ICcsJyxcclxuICAgICdlbi1VUyc6ICcuJyxcclxuICAgICdlbi1FUyc6ICcuJ1xyXG59O1xyXG5pMThuLm1vbmV5U3ltYm9sUHJlZml4ID0ge1xyXG4gICAgJ0VTJzogJycsXHJcbiAgICAnVVMnOiAnJCdcclxufTtcclxuaTE4bi5tb25leVN5bWJvbFN1Zml4ID0ge1xyXG4gICAgJ0VTJzogJ+KCrCcsXHJcbiAgICAnVVMnOiAnJ1xyXG59O1xyXG5pMThuLmdldEN1cnJlbnRDdWx0dXJlID0gZnVuY3Rpb24gZ2V0Q3VycmVudEN1bHR1cmUoKSB7XHJcbiAgICB2YXIgYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpO1xyXG4gICAgdmFyIHMgPSBjLnNwbGl0KCctJyk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGN1bHR1cmU6IGMsXHJcbiAgICAgICAgbGFuZ3VhZ2U6IHNbMF0sXHJcbiAgICAgICAgY291bnRyeTogc1sxXVxyXG4gICAgfTtcclxufTtcclxuaTE4bi5jb252ZXJ0TWlsZXNLbSA9IGZ1bmN0aW9uIGNvbnZlcnRNaWxlc0ttKHEsIHVuaXQpIHtcclxuICAgIHZhciBNSUxFU19UT19LTSA9IDEuNjA5O1xyXG4gICAgaWYgKHVuaXQgPT0gJ21pbGVzJylcclxuICAgICAgICByZXR1cm4gTUlMRVNfVE9fS00gKiBxO1xyXG4gICAgZWxzZSBpZiAodW5pdCA9PSAna20nKVxyXG4gICAgICAgIHJldHVybiBxIC8gTUlMRVNfVE9fS007XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykgY29uc29sZS5sb2coJ2NvbnZlcnRNaWxlc0ttOiBVbnJlY29nbml6ZWQgdW5pdCAnICsgdW5pdCk7XHJcbiAgICByZXR1cm4gMDtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gaTE4bjsiLCIvKiBSZXR1cm5zIHRydWUgd2hlbiBzdHIgaXNcclxuLSBudWxsXHJcbi0gZW1wdHkgc3RyaW5nXHJcbi0gb25seSB3aGl0ZSBzcGFjZXMgc3RyaW5nXHJcbiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNFbXB0eVN0cmluZyhzdHIpIHtcclxuICAgIHJldHVybiAhKC9cXFMvZy50ZXN0KHN0ciB8fCBcIlwiKSk7XHJcbn07IiwiLyoqIEFzIHRoZSAnaXMnIGpRdWVyeSBtZXRob2QsIGJ1dCBjaGVja2luZyBAc2VsZWN0b3IgaW4gYWxsIGVsZW1lbnRzXHJcbiogQG1vZGlmaWVyIHZhbHVlczpcclxuKiAtICdhbGwnOiBhbGwgZWxlbWVudHMgbXVzdCBtYXRjaCBzZWxlY3RvciB0byByZXR1cm4gdHJ1ZVxyXG4qIC0gJ2FsbW9zdC1vbmUnOiBhbG1vc3Qgb25lIGVsZW1lbnQgbXVzdCBtYXRjaFxyXG4qIC0gJ3BlcmNlbnRhZ2UnOiByZXR1cm5zIHBlcmNlbnRhZ2UgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbWF0Y2ggc2VsZWN0b3IgKDAtMTAwKVxyXG4qIC0gJ3N1bW1hcnknOiByZXR1cm5zIHRoZSBvYmplY3QgeyB5ZXM6IG51bWJlciwgbm86IG51bWJlciwgcGVyY2VudGFnZTogbnVtYmVyLCB0b3RhbDogbnVtYmVyIH1cclxuKiAtIHtqdXN0OiBhIG51bWJlcn06IGV4YWN0IG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiAtIHthbG1vc3Q6IGEgbnVtYmVyfTogbWluaW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbiogLSB7dW50aWw6IGEgbnVtYmVyfTogbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5hcmUgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIG1vZGlmaWVyKSB7XHJcbiAgICBtb2RpZmllciA9IG1vZGlmaWVyIHx8ICdhbGwnO1xyXG4gICAgdmFyIGNvdW50ID0gMDtcclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuaXMoc2VsZWN0b3IpKVxyXG4gICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgfSk7XHJcbiAgICBzd2l0Y2ggKG1vZGlmaWVyKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID09IGNvdW50O1xyXG4gICAgICAgIGNhc2UgJ2FsbW9zdC1vbmUnOlxyXG4gICAgICAgICAgICByZXR1cm4gY291bnQgPiAwO1xyXG4gICAgICAgIGNhc2UgJ3BlcmNlbnRhZ2UnOlxyXG4gICAgICAgICAgICByZXR1cm4gY291bnQgLyB0aGlzLmxlbmd0aDtcclxuICAgICAgICBjYXNlICdzdW1tYXJ5JzpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHllczogY291bnQsXHJcbiAgICAgICAgICAgICAgICBubzogdGhpcy5sZW5ndGggLSBjb3VudCxcclxuICAgICAgICAgICAgICAgIHBlcmNlbnRhZ2U6IGNvdW50IC8gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICB0b3RhbDogdGhpcy5sZW5ndGhcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ2p1c3QnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci5qdXN0ICE9IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICgnYWxtb3N0JyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuYWxtb3N0ID4gY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCd1bnRpbCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLnVudGlsIDwgY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgIH1cclxufTsiLCIvKiogPT09PT09PT09PT09PT09PT09PVxyXG5FeHRlbnNpb24ganF1ZXJ5OiAnYm91bmRzJ1xyXG5SZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSBjb21iaW5lZCBib3VuZHMgZm9yIGFsbCBcclxuZWxlbWVudHMgaW4gdGhlIGNvbGxlY3Rpb25cclxuKi9cclxuKGZ1bmN0aW9uICgpIHtcclxuICBqUXVlcnkuZm4uYm91bmRzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwge1xyXG4gICAgICBpbmNsdWRlQm9yZGVyOiBmYWxzZSxcclxuICAgICAgaW5jbHVkZU1hcmdpbjogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgdmFyIGJvdW5kcyA9IHtcclxuICAgICAgbGVmdDogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICB0b3A6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcclxuICAgICAgcmlnaHQ6IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcclxuICAgICAgYm90dG9tOiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHdpZHRoOiBOdW1iZXIuTmFOLFxyXG4gICAgICBoZWlnaHQ6IE51bWJlci5OYU5cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGZuV2lkdGggPSBvcHRpb25zLmluY2x1ZGVCb3JkZXIgfHwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luID8gXHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ub3V0ZXJXaWR0aC5jYWxsKGVsLCBvcHRpb25zLmluY2x1ZGVNYXJnaW4pOyB9IDpcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi53aWR0aC5jYWxsKGVsKTsgfTtcclxuICAgIHZhciBmbkhlaWdodCA9IG9wdGlvbnMuaW5jbHVkZUJvcmRlciB8fCBvcHRpb25zLmluY2x1ZGVNYXJnaW4gPyBcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5vdXRlckhlaWdodC5jYWxsKGVsLCBvcHRpb25zLmluY2x1ZGVNYXJnaW4pOyB9IDpcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5oZWlnaHQuY2FsbChlbCk7IH07XHJcblxyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uIChpLCBlbCkge1xyXG4gICAgICB2YXIgZWxRID0gJChlbCk7XHJcbiAgICAgIHZhciBvZmYgPSBlbFEub2Zmc2V0KCk7XHJcbiAgICAgIG9mZi5yaWdodCA9IG9mZi5sZWZ0ICsgZm5XaWR0aCgkKGVsUSkpO1xyXG4gICAgICBvZmYuYm90dG9tID0gb2ZmLnRvcCArIGZuSGVpZ2h0KCQoZWxRKSk7XHJcblxyXG4gICAgICBpZiAob2ZmLmxlZnQgPCBib3VuZHMubGVmdClcclxuICAgICAgICBib3VuZHMubGVmdCA9IG9mZi5sZWZ0O1xyXG5cclxuICAgICAgaWYgKG9mZi50b3AgPCBib3VuZHMudG9wKVxyXG4gICAgICAgIGJvdW5kcy50b3AgPSBvZmYudG9wO1xyXG5cclxuICAgICAgaWYgKG9mZi5yaWdodCA+IGJvdW5kcy5yaWdodClcclxuICAgICAgICBib3VuZHMucmlnaHQgPSBvZmYucmlnaHQ7XHJcblxyXG4gICAgICBpZiAob2ZmLmJvdHRvbSA+IGJvdW5kcy5ib3R0b20pXHJcbiAgICAgICAgYm91bmRzLmJvdHRvbSA9IG9mZi5ib3R0b207XHJcbiAgICB9KTtcclxuXHJcbiAgICBib3VuZHMud2lkdGggPSBib3VuZHMucmlnaHQgLSBib3VuZHMubGVmdDtcclxuICAgIGJvdW5kcy5oZWlnaHQgPSBib3VuZHMuYm90dG9tIC0gYm91bmRzLnRvcDtcclxuICAgIHJldHVybiBib3VuZHM7XHJcbiAgfTtcclxufSkoKTsiLCIvKipcclxuKiBIYXNTY3JvbGxCYXIgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBib29sIHByb3BlcnRpZXMgJ3ZlcnRpY2FsJyBhbmQgJ2hvcml6b250YWwnXHJcbiogc2F5aW5nIGlmIHRoZSBlbGVtZW50IGhhcyBuZWVkIG9mIHNjcm9sbGJhcnMgZm9yIGVhY2ggZGltZW5zaW9uIG9yIG5vdCAoZWxlbWVudFxyXG4qIGNhbiBuZWVkIHNjcm9sbGJhcnMgYW5kIHN0aWxsIG5vdCBiZWluZyBzaG93ZWQgYmVjYXVzZSB0aGUgY3NzLW92ZXJsZmxvdyBwcm9wZXJ0eVxyXG4qIGJlaW5nIHNldCBhcyAnaGlkZGVuJywgYnV0IHN0aWxsIHdlIGtub3cgdGhhdCB0aGUgZWxlbWVudCByZXF1aXJlcyBpdCBhbmQgaXRzXHJcbiogY29udGVudCBpcyBub3QgYmVpbmcgZnVsbHkgZGlzcGxheWVkKS5cclxuKiBAZXh0cmFnYXAsIGRlZmF1bHRzIHRvIHt4OjAseTowfSwgbGV0cyBzcGVjaWZ5IGFuIGV4dHJhIHNpemUgaW4gcGl4ZWxzIGZvciBlYWNoIGRpbWVuc2lvbiB0aGF0IGFsdGVyIHRoZSByZWFsIGNoZWNrLFxyXG4qIHJlc3VsdGluZyBpbiBhIGZha2UgcmVzdWx0IHRoYXQgY2FuIGJlIGludGVyZXN0aW5nIHRvIGRpc2NhcmQgc29tZSBwaXhlbHMgb2YgZXhjZXNzXHJcbiogc2l6ZSAobmVnYXRpdmUgdmFsdWVzKSBvciBleGFnZXJhdGUgdGhlIHJlYWwgdXNlZCBzaXplIHdpdGggdGhhdCBleHRyYSBwaXhlbHMgKHBvc2l0aXZlIHZhbHVlcykuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5oYXNTY3JvbGxCYXIgPSBmdW5jdGlvbiAoZXh0cmFnYXApIHtcclxuICAgIGV4dHJhZ2FwID0gJC5leHRlbmQoe1xyXG4gICAgICAgIHg6IDAsXHJcbiAgICAgICAgeTogMFxyXG4gICAgfSwgZXh0cmFnYXApO1xyXG4gICAgaWYgKCF0aGlzIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4geyB2ZXJ0aWNhbDogZmFsc2UsIGhvcml6b250YWw6IGZhbHNlIH07XHJcbiAgICAvL25vdGU6IGNsaWVudEhlaWdodD0gaGVpZ2h0IG9mIGhvbGRlclxyXG4gICAgLy9zY3JvbGxIZWlnaHQ9IHdlIGhhdmUgY29udGVudCB0aWxsIHRoaXMgaGVpZ2h0XHJcbiAgICB2YXIgdCA9IHRoaXMuZ2V0KDApO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2ZXJ0aWNhbDogdGhpcy5vdXRlckhlaWdodChmYWxzZSkgPCAodC5zY3JvbGxIZWlnaHQgKyBleHRyYWdhcC55KSxcclxuICAgICAgICBob3Jpem9udGFsOiB0aGlzLm91dGVyV2lkdGgoZmFsc2UpIDwgKHQuc2Nyb2xsV2lkdGggKyBleHRyYWdhcC54KVxyXG4gICAgfTtcclxufTsiLCIvKiogQ2hlY2tzIGlmIGN1cnJlbnQgZWxlbWVudCBvciBvbmUgb2YgdGhlIGN1cnJlbnQgc2V0IG9mIGVsZW1lbnRzIGhhc1xyXG5hIHBhcmVudCB0aGF0IG1hdGNoIHRoZSBlbGVtZW50IG9yIGV4cHJlc3Npb24gZ2l2ZW4gYXMgZmlyc3QgcGFyYW1ldGVyXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5pc0NoaWxkT2YgPSBmdW5jdGlvbiBqUXVlcnlfcGx1Z2luX2lzQ2hpbGRPZihleHApIHtcclxuICAgIHJldHVybiB0aGlzLnBhcmVudHMoKS5maWx0ZXIoZXhwKS5sZW5ndGggPiAwO1xyXG59OyIsIi8qKlxyXG4gICAgR2V0cyB0aGUgaHRtbCBzdHJpbmcgb2YgdGhlIGZpcnN0IGVsZW1lbnQgYW5kIGFsbCBpdHMgY29udGVudC5cclxuICAgIFRoZSAnaHRtbCcgbWV0aG9kIG9ubHkgcmV0cmlldmVzIHRoZSBodG1sIHN0cmluZyBvZiB0aGUgY29udGVudCwgbm90IHRoZSBlbGVtZW50IGl0c2VsZi5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLm91dGVySHRtbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICghdGhpcyB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnO1xyXG4gICAgdmFyIGVsID0gdGhpcy5nZXQoMCk7XHJcbiAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgaWYgKGVsLm91dGVySFRNTClcclxuICAgICAgICBodG1sID0gZWwub3V0ZXJIVE1MO1xyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaHRtbCA9IHRoaXMud3JhcEFsbCgnPGRpdj48L2Rpdj4nKS5wYXJlbnQoKS5odG1sKCk7XHJcbiAgICAgICAgdGhpcy51bndyYXAoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBodG1sO1xyXG59OyIsIi8qKlxyXG4gICAgVXNpbmcgdGhlIGF0dHJpYnV0ZSBkYXRhLXNvdXJjZS11cmwgb24gYW55IEhUTUwgZWxlbWVudCxcclxuICAgIHRoaXMgYWxsb3dzIHJlbG9hZCBpdHMgY29udGVudCBwZXJmb3JtaW5nIGFuIEFKQVggb3BlcmF0aW9uXHJcbiAgICBvbiB0aGUgZ2l2ZW4gVVJMIG9yIHRoZSBvbmUgaW4gdGhlIGF0dHJpYnV0ZTsgdGhlIGVuZC1wb2ludFxyXG4gICAgbXVzdCByZXR1cm4gdGV4dC9odG1sIGNvbnRlbnQuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gRGVmYXVsdCBzdWNjZXNzIGNhbGxiYWNrIGFuZCBwdWJsaWMgdXRpbGl0eSwgYmFzaWMgaG93LXRvIHJlcGxhY2UgZWxlbWVudCBjb250ZW50IHdpdGggZmV0Y2hlZCBodG1sXHJcbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoaHRtbENvbnRlbnQsIGNvbnRleHQpIHtcclxuICAgIGNvbnRleHQgPSAkLmlzUGxhaW5PYmplY3QoY29udGV4dCkgJiYgY29udGV4dCA/IGNvbnRleHQgOiB0aGlzO1xyXG5cclxuICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgLy8gQXZvaWQgZW1wdHkgZG9jdW1lbnRzIGJlaW5nIHBhcnNlZCAocmFpc2UgZXJyb3IpXHJcbiAgICBodG1sQ29udGVudCA9ICQudHJpbShodG1sQ29udGVudCk7XHJcbiAgICBpZiAoaHRtbENvbnRlbnQpIHtcclxuICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChodG1sQ29udGVudCkpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIG5ld2h0bWwgPSAkKGh0bWxDb250ZW50KTtcclxuICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGVsZW1lbnQgPSBjb250ZXh0LmVsZW1lbnQ7XHJcbiAgICBpZiAoY29udGV4dC5vcHRpb25zLm1vZGUgPT0gJ3JlcGxhY2UtbWUnKVxyXG4gICAgICAgIGVsZW1lbnQucmVwbGFjZVdpdGgobmV3aHRtbCk7XHJcbiAgICBlbHNlIC8vICdyZXBsYWNlLWNvbnRlbnQnXHJcbiAgICAgICAgZWxlbWVudC5odG1sKG5ld2h0bWwpO1xyXG5cclxuICAgIHJldHVybiBjb250ZXh0O1xyXG59XHJcblxyXG4vLyBEZWZhdWx0IGNvbXBsZXRlIGNhbGxiYWNrIGFuZCBwdWJsaWMgdXRpbGl0eVxyXG5mdW5jdGlvbiBzdG9wTG9hZGluZ1NwaW5uZXIoKSB7XHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5lbGVtZW50KTtcclxufVxyXG5cclxuLy8gRGVmYXVsdHNcclxudmFyIGRlZmF1bHRzID0ge1xyXG4gICAgdXJsOiBudWxsLFxyXG4gICAgc3VjY2VzczogW3VwZGF0ZUVsZW1lbnRdLFxyXG4gICAgZXJyb3I6IFtdLFxyXG4gICAgY29tcGxldGU6IFtzdG9wTG9hZGluZ1NwaW5uZXJdLFxyXG4gICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgbW9kZTogJ3JlcGxhY2UtY29udGVudCcsXHJcbiAgICBsb2FkaW5nOiB7XHJcbiAgICAgICAgbG9ja0VsZW1lbnQ6IHRydWUsXHJcbiAgICAgICAgbG9ja09wdGlvbnM6IHt9LFxyXG4gICAgICAgIG1lc3NhZ2U6IG51bGwsXHJcbiAgICAgICAgc2hvd0xvYWRpbmdJbmRpY2F0b3I6IHRydWUsXHJcbiAgICAgICAgZGVsYXk6IDBcclxuICAgIH1cclxufTtcclxuXHJcbi8qIFJlbG9hZCBtZXRob2QgKi9cclxudmFyIHJlbG9hZCA9ICQuZm4ucmVsb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gT3B0aW9ucyBmcm9tIGRlZmF1bHRzIChpbnRlcm5hbCBhbmQgcHVibGljKVxyXG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIHJlbG9hZC5kZWZhdWx0cyk7XHJcbiAgICAvLyBJZiBvcHRpb25zIG9iamVjdCBpcyBwYXNzZWQgYXMgdW5pcXVlIHBhcmFtZXRlclxyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSAmJiAkLmlzUGxhaW5PYmplY3QoYXJndW1lbnRzWzBdKSkge1xyXG4gICAgICAgIC8vIE1lcmdlIG9wdGlvbnM6XHJcbiAgICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0aW9ucywgYXJndW1lbnRzWzBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ29tbW9uIG92ZXJsb2FkOiBuZXctdXJsIGFuZCBjb21wbGV0ZSBjYWxsYmFjaywgYm90aCBvcHRpb25hbHNcclxuICAgICAgICBvcHRpb25zLnVybCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogbnVsbDtcclxuICAgICAgICBvcHRpb25zLmNvbXBsZXRlID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMudXJsKSB7XHJcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3B0aW9ucy51cmwpKVxyXG4gICAgICAgICAgICAvLyBGdW5jdGlvbiBwYXJhbXM6IGN1cnJlbnRSZWxvYWRVcmwsIGRlZmF1bHRSZWxvYWRVcmxcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ3NvdXJjZS11cmwnLCAkLnByb3h5KG9wdGlvbnMudXJsLCB0aGlzKSgkdC5kYXRhKCdzb3VyY2UtdXJsJyksICR0LmF0dHIoJ2RhdGEtc291cmNlLXVybCcpKSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ3NvdXJjZS11cmwnLCBvcHRpb25zLnVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB1cmwgPSAkdC5kYXRhKCdzb3VyY2UtdXJsJyk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFscmVhZHkgYmVpbmcgcmVsb2FkZWQsIHRvIGNhbmNlbCBwcmV2aW91cyBhdHRlbXB0XHJcbiAgICAgICAgdmFyIGpxID0gJHQuZGF0YSgnaXNSZWxvYWRpbmcnKTtcclxuICAgICAgICBpZiAoanEpIHtcclxuICAgICAgICAgICAgaWYgKGpxLnVybCA9PSB1cmwpXHJcbiAgICAgICAgICAgICAgICAvLyBJcyB0aGUgc2FtZSB1cmwsIGRvIG5vdCBhYm9ydCBiZWNhdXNlIGlzIHRoZSBzYW1lIHJlc3VsdCBiZWluZyByZXRyaWV2ZWRcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAganEuYWJvcnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9wdGlvbmFsIGRhdGEgcGFyYW1ldGVyICdyZWxvYWQtbW9kZScgYWNjZXB0cyB2YWx1ZXM6IFxyXG4gICAgICAgIC8vIC0gJ3JlcGxhY2UtbWUnOiBVc2UgaHRtbCByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgcmVsb2FkZWQgZWxlbWVudCAoYWthOiByZXBsYWNlV2l0aCgpKVxyXG4gICAgICAgIC8vIC0gJ3JlcGxhY2UtY29udGVudCc6IChkZWZhdWx0KSBIdG1sIHJldHVybmVkIHJlcGxhY2UgY3VycmVudCBlbGVtZW50IGNvbnRlbnQgKGFrYTogaHRtbCgpKVxyXG4gICAgICAgIG9wdGlvbnMubW9kZSA9ICR0LmRhdGEoJ3JlbG9hZC1tb2RlJykgfHwgb3B0aW9ucy5tb2RlO1xyXG5cclxuICAgICAgICBpZiAodXJsKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIGRlbGF5XHJcbiAgICAgICAgICAgIHZhciBsb2FkaW5ndGltZXIgPSBvcHRpb25zLmxvYWRpbmcubG9ja0VsZW1lbnQgP1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRpbmcgY29udGVudCB1c2luZyBhIGZha2UgdGVtcCBwYXJlbnQgZWxlbWVudCB0byBwcmVsb2FkIGltYWdlIGFuZCB0byBnZXQgcmVhbCBtZXNzYWdlIHdpZHRoOlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2FkaW5nY29udGVudCA9ICQoJzxkaXYvPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA/ICQoJzxkaXYgY2xhc3M9XCJsb2FkaW5nLW1lc3NhZ2VcIi8+JykuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5tZXNzYWdlKSA6IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChvcHRpb25zLmxvYWRpbmcuc2hvd0xvYWRpbmdJbmRpY2F0b3IgPyBvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA6IG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdjb250ZW50LmNzcyh7IHBvc2l0aW9uOiAnYWJzb2x1dGUnLCBsZWZ0OiAtOTk5OTkgfSkuYXBwZW5kVG8oJ2JvZHknKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdyA9IGxvYWRpbmdjb250ZW50LndpZHRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ2NvbnRlbnQuZGV0YWNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTG9ja2luZzpcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMuYXV0b2ZvY3VzID0gb3B0aW9ucy5hdXRvZm9jdXM7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zLndpZHRoID0gdztcclxuICAgICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGxvYWRpbmdjb250ZW50Lmh0bWwoKSwgJHQsIG9wdGlvbnMubG9hZGluZy5tZXNzYWdlID8gJ2N1c3RvbS1sb2FkaW5nJyA6ICdsb2FkaW5nJywgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMubG9hZGluZy5kZWxheSlcclxuICAgICAgICAgICAgICAgIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIC8vIFByZXBhcmUgY29udGV4dFxyXG4gICAgICAgICAgICB2YXIgY3R4ID0ge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudDogJHQsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgbG9hZGluZ1RpbWVyOiBsb2FkaW5ndGltZXJcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICAgICAgICAganEgPSAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIGNvbnRleHQ6IGN0eFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVybCBpcyBzZXQgaW4gdGhlIHJldHVybmVkIGFqYXggb2JqZWN0IGJlY2F1c2UgaXMgbm90IHNldCBieSBhbGwgdmVyc2lvbnMgb2YgalF1ZXJ5XHJcbiAgICAgICAgICAgIGpxLnVybCA9IHVybDtcclxuXHJcbiAgICAgICAgICAgIC8vIE1hcmsgZWxlbWVudCBhcyBpcyBiZWluZyByZWxvYWRlZCwgdG8gYXZvaWQgbXVsdGlwbGUgYXR0ZW1wcyBhdCBzYW1lIHRpbWUsIHNhdmluZ1xyXG4gICAgICAgICAgICAvLyBjdXJyZW50IGFqYXggb2JqZWN0IHRvIGFsbG93IGJlIGNhbmNlbGxlZFxyXG4gICAgICAgICAgICAkdC5kYXRhKCdpc1JlbG9hZGluZycsIGpxKTtcclxuICAgICAgICAgICAganEuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ2lzUmVsb2FkaW5nJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2FsbGJhY2tzOiBmaXJzdCBnbG9iYWxzIGFuZCB0aGVuIGZyb20gb3B0aW9ucyBpZiB0aGV5IGFyZSBkaWZmZXJlbnRcclxuICAgICAgICAgICAgLy8gc3VjY2Vzc1xyXG4gICAgICAgICAgICBqcS5kb25lKHJlbG9hZC5kZWZhdWx0cy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3VjY2VzcyAhPSByZWxvYWQuZGVmYXVsdHMuc3VjY2VzcylcclxuICAgICAgICAgICAgICAgIGpxLmRvbmUob3B0aW9ucy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgLy8gZXJyb3JcclxuICAgICAgICAgICAganEuZmFpbChyZWxvYWQuZGVmYXVsdHMuZXJyb3IpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5lcnJvciAhPSByZWxvYWQuZGVmYXVsdHMuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICBqcS5mYWlsKG9wdGlvbnMuZXJyb3IpO1xyXG4gICAgICAgICAgICAvLyBjb21wbGV0ZVxyXG4gICAgICAgICAgICBqcS5hbHdheXMocmVsb2FkLmRlZmF1bHRzLmNvbXBsZXRlKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29tcGxldGUgIT0gcmVsb2FkLmRlZmF1bHRzLmNvbXBsZXRlKVxyXG4gICAgICAgICAgICAgICAganEuZG9uZShvcHRpb25zLmNvbXBsZXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLy8gUHVibGljIGRlZmF1bHRzXHJcbnJlbG9hZC5kZWZhdWx0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cyk7XHJcblxyXG4vLyBQdWJsaWMgdXRpbGl0aWVzXHJcbnJlbG9hZC51cGRhdGVFbGVtZW50ID0gdXBkYXRlRWxlbWVudDtcclxucmVsb2FkLnN0b3BMb2FkaW5nU3Bpbm5lciA9IHN0b3BMb2FkaW5nU3Bpbm5lcjtcclxuXHJcbi8vIE1vZHVsZVxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlbG9hZDsiLCIvKiogRXh0ZW5kZWQgdG9nZ2xlLXNob3ctaGlkZSBmdW50aW9ucy5cclxuICAgIElhZ29TUkxAZ21haWwuY29tXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gKiovXHJcbihmdW5jdGlvbigpe1xyXG5cclxuICAgIC8qKiBJbXBsZW1lbnRhdGlvbjogcmVxdWlyZSBqUXVlcnkgYW5kIHJldHVybnMgb2JqZWN0IHdpdGggdGhlXHJcbiAgICAgICAgcHVibGljIG1ldGhvZHMuXHJcbiAgICAgKiovXHJcbiAgICBmdW5jdGlvbiB4dHNoKGpRdWVyeSkge1xyXG4gICAgICAgIHZhciAkID0galF1ZXJ5O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBIaWRlIGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdoaWRlJyBhbmQgJ2ZhZGVPdXQnIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmZhZGVPdXQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLnNsaWRlVXAob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdoaWRlJ1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmhpZGUob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneGhpZGUnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgKiBTaG93IGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdzaG93JyBhbmQgJ2ZhZGVJbicgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgLy8gV2UgcGVyZm9ybXMgYSBmaXggb24gc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHNcclxuICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gZXJyb3IgdGhhdCBwcmV2ZW50cyBmcm9tIHJ1bm5pbmdcclxuICAgICAgICAgICAgLy8gZWZmZWN0cyBvbiBlbGVtZW50cyB0aGF0IGFyZSBhbHJlYWR5IHZpc2libGUsXHJcbiAgICAgICAgICAgIC8vIHdoYXQgbGV0cyB0aGUgcG9zc2liaWxpdHkgb2YgZ2V0IGEgbWlkZGxlLWFuaW1hdGVkXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gV2UganVzdCBjaGFuZ2UgZGlzcGxheTpub25lLCBmb3JjaW5nIHRvICdpcy12aXNpYmxlJyB0b1xyXG4gICAgICAgICAgICAvLyBiZSBmYWxzZSBhbmQgdGhlbiBydW5uaW5nIHRoZSBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGZsaWNrZXJpbmcgZWZmZWN0LCBiZWNhdXNlIGpRdWVyeSBqdXN0IHJlc2V0c1xyXG4gICAgICAgICAgICAvLyBkaXNwbGF5IG9uIGVmZmVjdCBzdGFydC5cclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mYWRlSW4ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2xpZGVEb3duKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnc2hvdydcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNob3cob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneHNob3cnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdlbmVyaWMgdXRpbGl0eSBmb3IgaGlnaGx5IGNvbmZpZ3VyYWJsZSBqUXVlcnkudG9nZ2xlIHdpdGggc3VwcG9ydFxyXG4gICAgICAgICAgICB0byBzcGVjaWZ5IHRoZSB0b2dnbGUgdmFsdWUgZXhwbGljaXR5IGZvciBhbnkga2luZCBvZiBlZmZlY3Q6IGp1c3QgcGFzcyB0cnVlIGFzIHNlY29uZCBwYXJhbWV0ZXIgJ3RvZ2dsZScgdG8gc2hvd1xyXG4gICAgICAgICAgICBhbmQgZmFsc2UgdG8gaGlkZS4gVG9nZ2xlIG11c3QgYmUgc3RyaWN0bHkgYSBCb29sZWFuIHZhbHVlIHRvIGF2b2lkIGF1dG8tZGV0ZWN0aW9uLlxyXG4gICAgICAgICAgICBUb2dnbGUgcGFyYW1ldGVyIGNhbiBiZSBvbWl0dGVkIHRvIGF1dG8tZGV0ZWN0IGl0LCBhbmQgc2Vjb25kIHBhcmFtZXRlciBjYW4gYmUgdGhlIGFuaW1hdGlvbiBvcHRpb25zLlxyXG4gICAgICAgICAgICBBbGwgdGhlIG90aGVycyBiZWhhdmUgZXhhY3RseSBhcyBoaWRlRWxlbWVudCBhbmQgc2hvd0VsZW1lbnQuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlRWxlbWVudChlbGVtZW50LCB0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIG5vdCBhIGJvb2xlYW5cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSAhPT0gdHJ1ZSAmJiB0b2dnbGUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgYW4gb2JqZWN0LCB0aGVuIGlzIHRoZSBvcHRpb25zIGFzIHNlY29uZCBwYXJhbWV0ZXJcclxuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QodG9nZ2xlKSlcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gdG9nZ2xlO1xyXG4gICAgICAgICAgICAgICAgLy8gQXV0by1kZXRlY3QgdG9nZ2xlLCBpdCBjYW4gdmFyeSBvbiBhbnkgZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIC8vIHRoZW4gZGV0ZWN0aW9uIGFuZCBhY3Rpb24gbXVzdCBiZSBkb25lIHBlciBlbGVtZW50OlxyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXVzaW5nIGZ1bmN0aW9uLCB3aXRoIGV4cGxpY2l0IHRvZ2dsZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgISQodGhpcykuaXMoJzp2aXNpYmxlJyksIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSlcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqIERvIGpRdWVyeSBpbnRlZ3JhdGlvbiBhcyB4dG9nZ2xlLCB4c2hvdywgeGhpZGVcclxuICAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gcGx1Z0luKGpRdWVyeSkge1xyXG4gICAgICAgICAgICAvKiogdG9nZ2xlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHh0b2dnbGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHRvZ2dsZSA9IGZ1bmN0aW9uIHh0b2dnbGUodG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsIHRvZ2dsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBzaG93RWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHNob3cgPSBmdW5jdGlvbiB4c2hvdyhvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIGhpZGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueGhpZGUgPSBmdW5jdGlvbiB4aGlkZShvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb3J0aW5nOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQ6IHRvZ2dsZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHNob3dFbGVtZW50OiBzaG93RWxlbWVudCxcclxuICAgICAgICAgICAgaGlkZUVsZW1lbnQ6IGhpZGVFbGVtZW50LFxyXG4gICAgICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9kdWxlXHJcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgeHRzaCk7XHJcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgICAgICB2YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB4dHNoKGpRdWVyeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIE5vcm1hbCBzY3JpcHQgbG9hZCwgaWYgalF1ZXJ5IGlzIGdsb2JhbCAoYXQgd2luZG93KSwgaXRzIGV4dGVuZGVkIGF1dG9tYXRpY2FsbHkgICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHh0c2god2luZG93LmpRdWVyeSkucGx1Z0luKHdpbmRvdy5qUXVlcnkpO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvKiBTb21lIHV0aWxpdGllcyBmb3IgdXNlIHdpdGggalF1ZXJ5IG9yIGl0cyBleHByZXNzaW9uc1xyXG4gICAgdGhhdCBhcmUgbm90IHBsdWdpbnMuXHJcbiovXHJcbmZ1bmN0aW9uIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbICM7JiwuKyp+XFwnOlwiIV4kW1xcXSgpPT58XFwvXSkvZywgJ1xcXFwkMScpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlOiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlXHJcbiAgICB9O1xyXG4iLCIvKiBBc3NldHMgbG9hZGVyIHdpdGggbG9hZGluZyBjb25maXJtYXRpb24gKG1haW5seSBmb3Igc2NyaXB0cylcclxuICAgIGJhc2VkIG9uIE1vZGVybml6ci95ZXBub3BlIGxvYWRlci5cclxuKi9cclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpO1xyXG5cclxuZXhwb3J0cy5sb2FkID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgc2NyaXB0czogW10sXHJcbiAgICAgICAgY29tcGxldGU6IG51bGwsXHJcbiAgICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IG51bGwsXHJcbiAgICAgICAgbG9hZERlbGF5OiAwLFxyXG4gICAgICAgIHRyaWFsc0ludGVydmFsOiA1MDBcclxuICAgIH0sIG9wdHMpO1xyXG4gICAgaWYgKCFvcHRzLnNjcmlwdHMubGVuZ3RoKSByZXR1cm47XHJcbiAgICBmdW5jdGlvbiBwZXJmb3JtQ29tcGxldGUoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAob3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbikgIT09ICdmdW5jdGlvbicgfHwgb3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbigpKVxyXG4gICAgICAgICAgICBvcHRzLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQocGVyZm9ybUNvbXBsZXRlLCBvcHRzLnRyaWFsc0ludGVydmFsKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS53YXJuKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdMQy5sb2FkLmNvbXBsZXRlVmVyaWZpY2F0aW9uIGZhaWxlZCBmb3IgJyArIG9wdHMuc2NyaXB0c1swXSArICcgcmV0cnlpbmcgaXQgaW4gJyArIG9wdHMudHJpYWxzSW50ZXJ2YWwgKyAnbXMnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKHtcclxuICAgICAgICAgICAgbG9hZDogb3B0cy5zY3JpcHRzLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogb3B0cy5jb21wbGV0ZSA/IHBlcmZvcm1Db21wbGV0ZSA6IG51bGxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChvcHRzLmxvYWREZWxheSlcclxuICAgICAgICBzZXRUaW1lb3V0KGxvYWQsIG9wdHMubG9hZERlbGF5KTtcclxuICAgIGVsc2VcclxuICAgICAgICBsb2FkKCk7XHJcbn07IiwiLyotLS0tLS0tLS0tLS1cclxuVXRpbGl0aWVzIHRvIG1hbmlwdWxhdGUgbnVtYmVycywgYWRkaXRpb25hbGx5XHJcbnRvIHRoZSBvbmVzIGF0IE1hdGhcclxuLS0tLS0tLS0tLS0tKi9cclxuXHJcbi8qKiBFbnVtZXJhdGlvbiB0byBiZSB1c2VzIGJ5IGZ1bmN0aW9ucyB0aGF0IGltcGxlbWVudHMgJ3JvdW5kaW5nJyBvcGVyYXRpb25zIG9uIGRpZmZlcmVudFxyXG5kYXRhIHR5cGVzLlxyXG5JdCBob2xkcyB0aGUgZGlmZmVyZW50IHdheXMgYSByb3VuZGluZyBvcGVyYXRpb24gY2FuIGJlIGFwcGx5LlxyXG4qKi9cclxudmFyIHJvdW5kaW5nVHlwZUVudW0gPSB7XHJcbiAgICBEb3duOiAtMSxcclxuICAgIE5lYXJlc3Q6IDAsXHJcbiAgICBVcDogMVxyXG59O1xyXG5cclxuZnVuY3Rpb24gcm91bmRUbyhudW1iZXIsIGRlY2ltYWxzLCByb3VuZGluZ1R5cGUpIHtcclxuICAgIC8vIGNhc2UgTmVhcmVzdCBpcyB0aGUgZGVmYXVsdDpcclxuICAgIHZhciBmID0gbmVhcmVzdFRvO1xyXG4gICAgc3dpdGNoIChyb3VuZGluZ1R5cGUpIHtcclxuICAgICAgICBjYXNlIHJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgZiA9IGZsb29yVG87XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2Ugcm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgZiA9IGNlaWxUbztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZihudW1iZXIsIGRlY2ltYWxzKTtcclxufVxyXG5cclxuLyoqIFJvdW5kIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdCBjYW4gc3Vic3RyYWN0IGludGVnZXIgZGVjaW1hbHMgYnkgcHJvdmlkaW5nIGEgbmVnYXRpdmVcclxubnVtYmVyIG9mIGRlY2ltYWxzLlxyXG4qKi9cclxuZnVuY3Rpb24gbmVhcmVzdFRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLyoqIFJvdW5kIFVwIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgdXAsXHJcbnRvIHRoZSBsb3dlciBpbnRlZ2VyIGdyZWF0ZXIgb3IgZXF1YWxzIHRvIHRoZSBudW1iZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjZWlsVG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBEb3duIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgZG93bixcclxudG8gdGhlIGJpZ2dlciBpbnRlZ2VyIGxvd2VyIG9yIGVxdWFscyB0byB0aGUgbnVtYmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gZmxvb3JUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICByb3VuZGluZ1R5cGVFbnVtOiByb3VuZGluZ1R5cGVFbnVtLFxyXG4gICAgICAgIHJvdW5kVG86IHJvdW5kVG8sXHJcbiAgICAgICAgbmVhcmVzdFRvOiBuZWFyZXN0VG8sXHJcbiAgICAgICAgY2VpbFRvOiBjZWlsVG8sXHJcbiAgICAgICAgZmxvb3JUbzogZmxvb3JUb1xyXG4gICAgfTsiLCJmdW5jdGlvbiBtb3ZlRm9jdXNUbyhlbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBtYXJnaW5Ub3A6IDMwLFxyXG4gICAgICAgIGR1cmF0aW9uOiA1MDBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiAkKGVsKS5vZmZzZXQoKS50b3AgLSBvcHRpb25zLm1hcmdpblRvcCB9LCBvcHRpb25zLmR1cmF0aW9uLCBudWxsKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vdmVGb2N1c1RvO1xyXG59IiwiLyogU29tZSB1dGlsaXRpZXMgdG8gZm9ybWF0IGFuZCBleHRyYWN0IG51bWJlcnMsIGZyb20gdGV4dCBvciBET00uXHJcbiAqL1xyXG52YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBpMThuID0gcmVxdWlyZSgnLi9pMThuJyksXHJcbiAgICBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBnZXRNb25leU51bWJlcih2LCBhbHQpIHtcclxuICAgIGFsdCA9IGFsdCB8fCAwO1xyXG4gICAgaWYgKHYgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgdiA9IHYudmFsKCkgfHwgdi50ZXh0KCk7XHJcbiAgICB2ID0gcGFyc2VGbG9hdCh2XHJcbiAgICAgICAgLnJlcGxhY2UoL1sk4oKsXS9nLCAnJylcclxuICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKExDLm51bWVyaWNNaWxlc1NlcGFyYXRvcltpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY3VsdHVyZV0sICdnJyksICcnKVxyXG4gICAgKTtcclxuICAgIHJldHVybiBpc05hTih2KSA/IGFsdCA6IHY7XHJcbn1cclxuZnVuY3Rpb24gbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSB7XHJcbiAgICB2YXIgY3VsdHVyZSA9IGkxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jdWx0dXJlO1xyXG4gICAgLy8gRmlyc3QsIHJvdW5kIHRvIDIgZGVjaW1hbHNcclxuICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgLy8gR2V0IHRoZSBkZWNpbWFsIHBhcnQgKHJlc3QpXHJcbiAgICB2YXIgcmVzdCA9IE1hdGgucm91bmQodiAqIDEwMCAlIDEwMCk7XHJcbiAgICByZXR1cm4gKCcnICtcclxuICAgIC8vIEludGVnZXIgcGFydCAobm8gZGVjaW1hbHMpXHJcbiAgICAgICAgTWF0aC5mbG9vcih2KSArXHJcbiAgICAvLyBEZWNpbWFsIHNlcGFyYXRvciBkZXBlbmRpbmcgb24gbG9jYWxlXHJcbiAgICAgICAgaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvcltjdWx0dXJlXSArXHJcbiAgICAvLyBEZWNpbWFscywgZXZlciB0d28gZGlnaXRzXHJcbiAgICAgICAgTWF0aC5mbG9vcihyZXN0IC8gMTApICsgcmVzdCAlIDEwXHJcbiAgICApO1xyXG59XHJcbmZ1bmN0aW9uIG51bWJlclRvTW9uZXlTdHJpbmcodikge1xyXG4gICAgdmFyIGNvdW50cnkgPSBpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY291bnRyeTtcclxuICAgIC8vIFR3byBkaWdpdHMgaW4gZGVjaW1hbHMgZm9yIHJvdW5kZWQgdmFsdWUgd2l0aCBtb25leSBzeW1ib2wgYXMgZm9yXHJcbiAgICAvLyBjdXJyZW50IGxvY2FsZVxyXG4gICAgcmV0dXJuIChpMThuLm1vbmV5U3ltYm9sUHJlZml4W2NvdW50cnldICsgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSArIGkxOG4ubW9uZXlTeW1ib2xTdWZpeFtjb3VudHJ5XSk7XHJcbn1cclxuZnVuY3Rpb24gc2V0TW9uZXlOdW1iZXIodiwgZWwpIHtcclxuICAgIC8vIEdldCB2YWx1ZSBpbiBtb25leSBmb3JtYXQ6XHJcbiAgICB2ID0gbnVtYmVyVG9Nb25leVN0cmluZyh2KTtcclxuICAgIC8vIFNldHRpbmcgdmFsdWU6XHJcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgaWYgKGVsLmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICAgZWwudmFsKHYpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZWwudGV4dCh2KTtcclxuICAgIHJldHVybiB2O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBnZXRNb25leU51bWJlcjogZ2V0TW9uZXlOdW1iZXIsXHJcbiAgICAgICAgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZzogbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyxcclxuICAgICAgICBudW1iZXJUb01vbmV5U3RyaW5nOiBudW1iZXJUb01vbmV5U3RyaW5nLFxyXG4gICAgICAgIHNldE1vbmV5TnVtYmVyOiBzZXRNb25leU51bWJlclxyXG4gICAgfTsiLCIvKipcclxuKiBQbGFjZWhvbGRlciBwb2x5ZmlsbC5cclxuKiBBZGRzIGEgbmV3IGpRdWVyeSBwbGFjZUhvbGRlciBtZXRob2QgdG8gc2V0dXAgb3IgcmVhcHBseSBwbGFjZUhvbGRlclxyXG4qIG9uIGVsZW1lbnRzIChyZWNvbW1lbnRlZCB0byBiZSBhcHBseSBvbmx5IHRvIHNlbGVjdG9yICdbcGxhY2Vob2xkZXJdJyk7XHJcbiogdGhhdHMgbWV0aG9kIGlzIGZha2Ugb24gYnJvd3NlcnMgdGhhdCBoYXMgbmF0aXZlIHN1cHBvcnQgZm9yIHBsYWNlaG9sZGVyXHJcbioqL1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0UGxhY2VIb2xkZXJzKCkge1xyXG4gICAgaWYgKE1vZGVybml6ci5pbnB1dC5wbGFjZWhvbGRlcilcclxuICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkgeyB9O1xyXG4gICAgZWxzZVxyXG4gICAgICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvUGxhY2Vob2xkZXIoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdwbGFjZWhvbGRlci1zdXBwb3J0ZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0Lm9uKCdmb2N1c2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkdC5vbignZm9jdXNvdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQuZGF0YSgncGxhY2Vob2xkZXItc3VwcG9ydGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChkb1BsYWNlaG9sZGVyKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgJCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkoKTtcclxufTsiLCIvKiBQb3B1cCBmdW5jdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqXHJcbiogUG9wdXAgcmVsYXRlZCBcclxuKiBmdW5jdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gcG9wdXBTaXplKHNpemUpIHtcclxuICAgIHZhciBzID0gKHNpemUgPT0gJ2xhcmdlJyA/IDAuOCA6IChzaXplID09ICdtZWRpdW0nID8gMC41IDogKHNpemUgPT0gJ3NtYWxsJyA/IDAuMiA6IHNpemUgfHwgMC41KSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB3aWR0aDogTWF0aC5yb3VuZCgkKHdpbmRvdykud2lkdGgoKSAqIHMpLFxyXG4gICAgICAgIGhlaWdodDogTWF0aC5yb3VuZCgkKHdpbmRvdykuaGVpZ2h0KCkgKiBzKSxcclxuICAgICAgICBzaXplRmFjdG9yOiBzXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwU3R5bGUoc2l6ZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdXJzb3I6ICdkZWZhdWx0JyxcclxuICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCArICdweCcsXHJcbiAgICAgICAgbGVmdDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLndpZHRoKCkgLSBzaXplLndpZHRoKSAvIDIpIC0gMjUgKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHQgKyAncHgnLFxyXG4gICAgICAgIHRvcDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLmhlaWdodCgpIC0gc2l6ZS5oZWlnaHQpIC8gMikgLSAzMiArICdweCcsXHJcbiAgICAgICAgcGFkZGluZzogJzM0cHggMjVweCAzMHB4JyxcclxuICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICctbW96LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nJyxcclxuICAgICAgICAnLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnLFxyXG4gICAgICAgICdiYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwKHVybCwgc2l6ZSwgY29tcGxldGUsIGxvYWRpbmdUZXh0LCBvcHRpb25zKSB7XHJcbiAgICBpZiAodHlwZW9mICh1cmwpID09PSAnb2JqZWN0JylcclxuICAgICAgICBvcHRpb25zID0gdXJsO1xyXG5cclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICB1cmw6IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAnJyxcclxuICAgICAgICBzaXplOiBzaXplIHx8IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9LFxyXG4gICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcclxuICAgICAgICBsb2FkaW5nVGV4dDogbG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2xvc2FibGU6IHtcclxuICAgICAgICAgICAgb25Mb2FkOiBmYWxzZSxcclxuICAgICAgICAgICAgYWZ0ZXJMb2FkOiB0cnVlLFxyXG4gICAgICAgICAgICBvbkVycm9yOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvU2l6ZTogZmFsc2UsXHJcbiAgICAgICAgY29udGFpbmVyQ2xhc3M6ICcnLFxyXG4gICAgICAgIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLy8gUHJlcGFyZSBzaXplIGFuZCBsb2FkaW5nXHJcbiAgICBvcHRpb25zLmxvYWRpbmdUZXh0ID0gb3B0aW9ucy5sb2FkaW5nVGV4dCB8fCAnJztcclxuICAgIGlmICh0eXBlb2YgKG9wdGlvbnMuc2l6ZS53aWR0aCkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHBvcHVwU2l6ZShvcHRpb25zLnNpemUpO1xyXG5cclxuICAgICQuYmxvY2tVSSh7XHJcbiAgICAgICAgbWVzc2FnZTogKG9wdGlvbnMuY2xvc2FibGUub25Mb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICtcclxuICAgICAgICc8aW1nIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nICsgb3B0aW9ucy5sb2FkaW5nVGV4dCxcclxuICAgICAgICBjZW50ZXJZOiBmYWxzZSxcclxuICAgICAgICBjc3M6IHBvcHVwU3R5bGUob3B0aW9ucy5zaXplKSxcclxuICAgICAgICBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0sXHJcbiAgICAgICAgZm9jdXNJbnB1dDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTG9hZGluZyBVcmwgd2l0aCBBamF4IGFuZCBwbGFjZSBjb250ZW50IGluc2lkZSB0aGUgYmxvY2tlZC1ib3hcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcclxuICAgICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJCgnLmJsb2NrTXNnJylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhvcHRpb25zLmNvbnRhaW5lckNsYXNzKTtcclxuICAgICAgICAgICAgLy8gQWRkIGNsb3NlIGJ1dHRvbiBpZiByZXF1aXJlcyBpdCBvciBlbXB0eSBtZXNzYWdlIGNvbnRlbnQgdG8gYXBwZW5kIHRoZW4gbW9yZVxyXG4gICAgICAgICAgICBjb250YWluZXIuaHRtbChvcHRpb25zLmNsb3NhYmxlLmFmdGVyTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRIb2xkZXIgPSBjb250YWluZXIuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29udGVudFwiLz4nKS5jaGlsZHJlbignLmNvbnRlbnQnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuQ29kZSAmJiBkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgY29kZSwgc2hvdyByZXN1bHRcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQYWdlIGNvbnRlbnQgZ290LCBwYXN0ZSBpbnRvIHRoZSBwb3B1cCBpZiBpcyBwYXJ0aWFsIGh0bWwgKHVybCBzdGFydHMgd2l0aCAkKVxyXG4gICAgICAgICAgICAgICAgaWYgKC8oKF5cXCQpfChcXC9cXCQpKS8udGVzdChvcHRpb25zLnVybCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRIb2xkZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9TaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2b2lkIG1pc2NhbGN1bGF0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldldpZHRoID0gY29udGVudEhvbGRlclswXS5zdHlsZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRXaWR0aCA9IGNvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udEhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhV2lkdGggPSBjb250YWluZXIub3V0ZXJXaWR0aCh0cnVlKSAtIGNvbnRXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSGVpZ2h0ID0gY29udGFpbmVyLm91dGVySGVpZ2h0KHRydWUpIC0gY29udEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkgLSBleHRyYVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gZXh0cmFIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBhbmQgYXBwbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogYWN0dWFsV2lkdGggPiBtYXhXaWR0aCA/IG1heFdpZHRoIDogYWN0dWFsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGFjdHVhbEhlaWdodCA+IG1heEhlaWdodCA/IG1heEhlaWdodCA6IGFjdHVhbEhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuYW5pbWF0ZShzaXplLCAzMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBtaXNjYWxjdWxhdGlvbnMgY29ycmVjdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgcHJldldpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsIHByZXZIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRWxzZSwgaWYgdXJsIGlzIGEgZnVsbCBodG1sIHBhZ2UgKG5vcm1hbCBwYWdlKSwgcHV0IGNvbnRlbnQgaW50byBhbiBpZnJhbWVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGRhdGEsIHRoaXMub3B0aW9ucy5zaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2tpbmcgZWxlbWVudCBjb250ZW50ICh0aGUgbG9hZGluZykgd2l0aCB0aGUgaWZyYW1lOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZXJyb3I6IGZ1bmN0aW9uIChqLCB0LCBleCkge1xyXG4gICAgICAgICAgICAkKCdkaXYuYmxvY2tNc2cnKS5odG1sKChvcHRpb25zLmNsb3NhYmxlLm9uRXJyb3IgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgKyAnPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5QYWdlIG5vdCBmb3VuZDwvZGl2PicpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmluZm8pIGNvbnNvbGUuaW5mbyhcIlBvcHVwLWFqYXggZXJyb3I6IFwiICsgZXgpO1xyXG4gICAgICAgIH0sIGNvbXBsZXRlOiBvcHRpb25zLmNvbXBsZXRlXHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmV0dXJuZWRCbG9jayA9ICQoJy5ibG9ja1VJJyk7XHJcblxyXG4gICAgcmV0dXJuZWRCbG9jay5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICByZXR1cm5lZEJsb2NrLnRyaWdnZXIoJ3BvcHVwLWNsb3NlZCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuZWRCbG9jay5jbG9zZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0QmxvY2tFbGVtZW50ID0gZnVuY3Rpb24gZ2V0QmxvY2tFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja01zZycpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRDb250ZW50RWxlbWVudCA9IGZ1bmN0aW9uIGdldENvbnRlbnRFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maW5kKCcuY29udGVudCcpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRPdmVybGF5RWxlbWVudCA9IGZ1bmN0aW9uIGdldE92ZXJsYXlFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja092ZXJsYXknKTsgfTtcclxuICAgIHJldHVybiByZXR1cm5lZEJsb2NrO1xyXG59XHJcblxyXG4vKiBTb21lIHBvcHVwIHV0aWxpdGl0ZXMvc2hvcnRoYW5kcyAqL1xyXG5mdW5jdGlvbiBtZXNzYWdlUG9wdXAobWVzc2FnZSwgY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCAnYm9keScpO1xyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2Lz4nKS50ZXh0KG1lc3NhZ2UpO1xyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjb250YWluZXIsICdtZXNzYWdlLXBvcHVwIGZ1bGwtYmxvY2snLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbm5lY3RQb3B1cEFjdGlvbihhcHBseVRvU2VsZWN0b3IpIHtcclxuICAgIGFwcGx5VG9TZWxlY3RvciA9IGFwcGx5VG9TZWxlY3RvciB8fCAnLnBvcHVwLWFjdGlvbic7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBhcHBseVRvU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQoJCh0aGlzKS5hdHRyKCdocmVmJykpLmNsb25lKCk7XHJcbiAgICAgICAgaWYgKGMubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgZG9jdW1lbnQsIG51bGwsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy8gVGhlIHBvcHVwIGZ1bmN0aW9uIGNvbnRhaW5zIGFsbCB0aGUgb3RoZXJzIGFzIG1ldGhvZHNcclxucG9wdXAuc2l6ZSA9IHBvcHVwU2l6ZTtcclxucG9wdXAuc3R5bGUgPSBwb3B1cFN0eWxlO1xyXG5wb3B1cC5jb25uZWN0QWN0aW9uID0gY29ubmVjdFBvcHVwQWN0aW9uO1xyXG5wb3B1cC5tZXNzYWdlID0gbWVzc2FnZVBvcHVwO1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcG9wdXA7IiwiLyoqKiogUG9zdGFsIENvZGU6IG9uIGZseSwgc2VydmVyLXNpZGUgdmFsaWRhdGlvbiAqKioqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIGJhc2VVcmw6ICcvJyxcclxuICAgICAgICBzZWxlY3RvcjogJ1tkYXRhLXZhbC1wb3N0YWxjb2RlXScsXHJcbiAgICAgICAgdXJsOiAnSlNPTi9WYWxpZGF0ZVBvc3RhbENvZGUvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIG9wdGlvbnMuc2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGNvbnRhaW5zIGEgdmFsdWUgKHRoaXMgbm90IHZhbGlkYXRlIGlmIGlzIHJlcXVpcmVkKSBhbmQgXHJcbiAgICAgICAgLy8gaGFzIHRoZSBlcnJvciBkZXNjcmlwdGl2ZSBtZXNzYWdlLCB2YWxpZGF0ZSB0aHJvdWdoIGFqYXhcclxuICAgICAgICB2YXIgcGMgPSAkdC52YWwoKTtcclxuICAgICAgICB2YXIgbXNnID0gJHQuZGF0YSgndmFsLXBvc3RhbGNvZGUnKTtcclxuICAgICAgICBpZiAocGMgJiYgbXNnKSB7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMuYmFzZVVybCArIG9wdGlvbnMudXJsLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogeyBQb3N0YWxDb2RlOiBwYyB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ0pTT04nLFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLlJlc3VsdC5Jc1ZhbGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmFkZENsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoJycpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhbiBzdW1tYXJ5IGVycm9yc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgnPiB1bCA+IGxpJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLnRleHQoKSA9PSBtc2cpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKS5yZW1vdmVDbGFzcygndmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnNpYmxpbmdzKCcuZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxzcGFuIGZvcj1cIicgKyAkdC5hdHRyKCduYW1lJykgKyAnXCIgZ2VuZXJhdGVkPVwidHJ1ZVwiPicgKyBtc2cgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHN1bW1hcnkgZXJyb3IgKGlmIHRoZXJlIGlzIG5vdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2hpbGRyZW4oJ3VsJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8bGk+JyArIG1zZyArICc8L2xpPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKiBBcHBseSBldmVyIGEgcmVkaXJlY3QgdG8gdGhlIGdpdmVuIFVSTCwgaWYgdGhpcyBpcyBhbiBpbnRlcm5hbCBVUkwgb3Igc2FtZVxyXG5wYWdlLCBpdCBmb3JjZXMgYSBwYWdlIHJlbG9hZCBmb3IgdGhlIGdpdmVuIFVSTC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlZGlyZWN0VG8odXJsKSB7XHJcbiAgICAvLyBCbG9jayB0byBhdm9pZCBtb3JlIHVzZXIgaW50ZXJhY3Rpb25zOlxyXG4gICAgJC5ibG9ja1VJKHsgbWVzc2FnZTogJycgfSk7IC8vbG9hZGluZ0Jsb2NrKTtcclxuICAgIC8vIENoZWNraW5nIGlmIGlzIGJlaW5nIHJlZGlyZWN0aW5nIG9yIG5vdFxyXG4gICAgdmFyIHJlZGlyZWN0ZWQgPSBmYWxzZTtcclxuICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gY2hlY2tSZWRpcmVjdCgpIHtcclxuICAgICAgICByZWRpcmVjdGVkID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgLy8gTmF2aWdhdGUgdG8gbmV3IGxvY2F0aW9uOlxyXG4gICAgd2luZG93LmxvY2F0aW9uID0gdXJsO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gSWYgcGFnZSBub3QgY2hhbmdlZCAoc2FtZSB1cmwgb3IgaW50ZXJuYWwgbGluayksIHBhZ2UgY29udGludWUgZXhlY3V0aW5nIHRoZW4gcmVmcmVzaDpcclxuICAgICAgICBpZiAoIXJlZGlyZWN0ZWQpXHJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0sIDUwKTtcclxufTtcclxuIiwiLyoqIFNhbml0aXplIHRoZSB3aGl0ZXNwYWNlcyBpbiBhIHRleHQgYnk6XHJcbi0gcmVwbGFjaW5nIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVyZXMgKGFueSBudW1iZXIgb2YgcmVwZXRpdGlvbiBcclxuYW5kIGFueSBraW5kIG9mIHdoaXRlIGNoYXJhY3RlcikgYnkgYSBub3JtYWwgd2hpdGUtc3BhY2VcclxuLSByZXBsYWNlIGVuY29kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlLXNwYWNlc1xyXG4tIGV2ZXIgcmV0dXJuIGEgc3RyaW5nLCBlbXB0eSB3aGVuIG51bGxcclxuKiovXHJcbmZ1bmN0aW9uIHNhbml0aXplV2hpdGVzcGFjZXModGV4dCkge1xyXG4gICAgLy8gRXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4gICAgdGV4dCA9ICh0ZXh0IHx8ICcnKVxyXG4gICAgLy8gUmVwbGFjZSBhbnkga2luZCBvZiBjb250aWd1b3VzIHdoaXRlc3BhY2VzIGNoYXJhY3RlcnMgYnkgYSBzaW5nbGUgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbiAgICAvLyAodGhhdHMgaW5jbHVkZSByZXBsYWNlIGVuY29uZGVkIG5vbi1icmVha2luZy1zcGFjZXMsXHJcbiAgICAvLyBhbmQgZHVwbGljYXRlZC1yZXBlYXRlZCBhcHBlYXJhbmNlcylcclxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJyk7XHJcbiAgICAvLyBSZW1vdmUgc3RhcnRpbmcgYW5kIGVuZGluZyB3aGl0ZXNwYWNlc1xyXG4gICAgcmV0dXJuICQudHJpbSh0ZXh0KTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gc2FuaXRpemVXaGl0ZXNwYWNlczsiLCIvKiogQ3VzdG9tIExvY29ub21pY3MgJ2xpa2UgYmxvY2tVSScgcG9wdXBzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlLFxyXG4gICAgYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi9hdXRvRm9jdXMnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG5cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2soY29udGVudEJveCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHtcclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBjbG9zYWJsZTogZmFsc2UsXHJcbiAgICAgICAgY2VudGVyOiBmYWxzZSxcclxuICAgICAgICAvKiBhcyBhIHZhbGlkIG9wdGlvbnMgcGFyYW1ldGVyIGZvciBMQy5oaWRlRWxlbWVudCBmdW5jdGlvbiAqL1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogNjAwLFxyXG4gICAgICAgICAgICBlZmZlY3Q6ICdmYWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgIGF1dG9mb2N1c09wdGlvbnM6IHsgbWFyZ2luVG9wOiA2MCB9LFxyXG4gICAgICAgIHdpZHRoOiAnYXV0bydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnRlbnRCb3ggPSAkKGNvbnRlbnRCb3gpO1xyXG4gICAgdmFyIGZ1bGwgPSBmYWxzZTtcclxuICAgIGlmIChibG9ja2VkID09IGRvY3VtZW50IHx8IGJsb2NrZWQgPT0gd2luZG93KSB7XHJcbiAgICAgICAgYmxvY2tlZCA9ICQoJ2JvZHknKTtcclxuICAgICAgICBmdWxsID0gdHJ1ZTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGJsb2NrZWQgPSAkKGJsb2NrZWQpO1xyXG5cclxuICAgIHZhciBib3hJbnNpZGVCbG9ja2VkID0gIWJsb2NrZWQuaXMoJ2JvZHksdHIsdGhlYWQsdGJvZHksdGZvb3QsdGFibGUsdWwsb2wsZGwnKTtcclxuXHJcbiAgICAvLyBHZXR0aW5nIGJveCBlbGVtZW50IGlmIGV4aXN0cyBhbmQgcmVmZXJlbmNpbmdcclxuICAgIHZhciBiSUQgPSBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnKTtcclxuICAgIGlmICghYklEKVxyXG4gICAgICAgIGJJRCA9IChjb250ZW50Qm94LmF0dHIoJ2lkJykgfHwgJycpICsgKGJsb2NrZWQuYXR0cignaWQnKSB8fCAnJykgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIGlmIChiSUQgPT0gJy1zbW9vdGhCb3hCbG9jaycpIHtcclxuICAgICAgICBiSUQgPSAnaWQtJyArIGd1aWRHZW5lcmF0b3IoKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgfVxyXG4gICAgYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJywgYklEKTtcclxuICAgIHZhciBib3ggPSAkKCcjJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoYklEKSk7XHJcbiAgICAvLyBIaWRpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94LnhoaWRlKG9wdGlvbnMuY2xvc2VPcHRpb25zKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICBib3hjXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBudWxsLCBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnKSk7IH0pXHJcbiAgICAgICAgLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnLCB0cnVlKTtcclxuICAgIGJveGMuYXBwZW5kKGNvbnRlbnRCb3gpO1xyXG4gICAgYm94Yy53aWR0aChvcHRpb25zLndpZHRoKTtcclxuICAgIGJveC5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICBpZiAoYm94SW5zaWRlQmxvY2tlZCkge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIGluc2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBibG9ja2VkLmNzcygnei1pbmRleCcpICsgMTApO1xyXG4gICAgICAgIGlmICghYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgfHwgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgPT0gJ3N0YXRpYycpXHJcbiAgICAgICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIC8vb2ZmcyA9IGJsb2NrZWQucG9zaXRpb24oKTtcclxuICAgICAgICBib3guY3NzKCd0b3AnLCAwKTtcclxuICAgICAgICBib3guY3NzKCdsZWZ0JywgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIG91dHNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudCwgYXMgYSBkaXJlY3QgY2hpbGQgb2YgQm9keTpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgTWF0aC5mbG9vcihOdW1iZXIuTUFYX1ZBTFVFKSk7XHJcbiAgICAgICAgYm94LmNzcyhibG9ja2VkLm9mZnNldCgpKTtcclxuICAgIH1cclxuICAgIC8vIERpbWVuc2lvbnMgbXVzdCBiZSBjYWxjdWxhdGVkIGFmdGVyIGJlaW5nIGFwcGVuZGVkIGFuZCBwb3NpdGlvbiB0eXBlIGJlaW5nIHNldDpcclxuICAgIGJveC53aWR0aChibG9ja2VkLm91dGVyV2lkdGgoKSk7XHJcbiAgICBib3guaGVpZ2h0KGJsb2NrZWQub3V0ZXJIZWlnaHQoKSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuY2VudGVyKSB7XHJcbiAgICAgICAgYm94Yy5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICAgICAgdmFyIGNsLCBjdDtcclxuICAgICAgICBpZiAoZnVsbCkge1xyXG4gICAgICAgICAgICBjdCA9IHNjcmVlbi5oZWlnaHQgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IHNjcmVlbi53aWR0aCAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3QgPSBib3gub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IGJveC5vdXRlcldpZHRoKHRydWUpIC8gMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYm94Yy5jc3MoJ3RvcCcsIGN0IC0gYm94Yy5vdXRlckhlaWdodCh0cnVlKSAvIDIpO1xyXG4gICAgICAgIGJveGMuY3NzKCdsZWZ0JywgY2wgLSBib3hjLm91dGVyV2lkdGgodHJ1ZSkgLyAyKTtcclxuICAgIH1cclxuICAgIC8vIExhc3Qgc2V0dXBcclxuICAgIGF1dG9Gb2N1cyhib3gpO1xyXG4gICAgLy8gU2hvdyBibG9ja1xyXG4gICAgYm94LmFuaW1hdGUoeyBvcGFjaXR5OiAxIH0sIDMwMCk7XHJcbiAgICBpZiAob3B0aW9ucy5hdXRvZm9jdXMpXHJcbiAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEJveCwgb3B0aW9ucy5hdXRvZm9jdXNPcHRpb25zKTtcclxuICAgIHJldHVybiBib3g7XHJcbn1cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2tDbG9zZUFsbChjb250YWluZXIpIHtcclxuICAgICQoY29udGFpbmVyIHx8IGRvY3VtZW50KS5maW5kKCcuc21vb3RoLWJveC1ibG9jay1vdmVybGF5JykuaGlkZSgpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb3Blbjogc21vb3RoQm94QmxvY2ssXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKTsgfSxcclxuICAgICAgICBjbG9zZUFsbDogc21vb3RoQm94QmxvY2tDbG9zZUFsbFxyXG4gICAgfTsiLCIvKipcclxuKiogTW9kdWxlOjogdG9vbHRpcHNcclxuKiogQ3JlYXRlcyBzbWFydCB0b29sdGlwcyB3aXRoIHBvc3NpYmlsaXRpZXMgZm9yIG9uIGhvdmVyIGFuZCBvbiBjbGljayxcclxuKiogYWRkaXRpb25hbCBkZXNjcmlwdGlvbiBvciBleHRlcm5hbCB0b29sdGlwIGNvbnRlbnQuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc2FuaXRpemVXaGl0ZXNwYWNlcyA9IHJlcXVpcmUoJy4vc2FuaXRpemVXaGl0ZXNwYWNlcycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5vdXRlckh0bWwnKTtcclxucmVxdWlyZSgnLi9qcXVlcnkuaXNDaGlsZE9mJyk7XHJcblxyXG4vLyBNYWluIGludGVybmFsIHByb3BlcnRpZXNcclxudmFyIHBvc29mZnNldCA9IHsgeDogMTYsIHk6IDggfTtcclxudmFyIHNlbGVjdG9yID0gJ1t0aXRsZV1bZGF0YS1kZXNjcmlwdGlvbl0sIFt0aXRsZV0uaGFzLXRvb2x0aXAsIFt0aXRsZV0uc2VjdXJlLWRhdGEsIFtkYXRhLXRvb2x0aXAtdXJsXSwgW3RpdGxlXS5oYXMtcG9wdXAtdG9vbHRpcCc7XHJcblxyXG4vKiogUG9zaXRpb25hdGUgdGhlIHRvb2x0aXAgZGVwZW5kaW5nIG9uIHRoZVxyXG5ldmVudCBvciB0aGUgdGFyZ2V0IGVsZW1lbnQgcG9zaXRpb24gYW5kIGFuIG9mZnNldFxyXG4qKi9cclxuZnVuY3Rpb24gcG9zKHQsIGUsIGwpIHtcclxuICAgIHZhciB4LCB5O1xyXG4gICAgaWYgKGUucGFnZVggJiYgZS5wYWdlWSkge1xyXG4gICAgICAgIHggPSBlLnBhZ2VYO1xyXG4gICAgICAgIHkgPSBlLnBhZ2VZO1xyXG4gICAgfSBlbHNlIGlmIChlLnRhcmdldCkge1xyXG4gICAgICAgIHZhciAkZXQgPSAkKGUudGFyZ2V0KTtcclxuICAgICAgICB4ID0gJGV0Lm91dGVyV2lkdGgoKSArICRldC5vZmZzZXQoKS5sZWZ0O1xyXG4gICAgICAgIHkgPSAkZXQub3V0ZXJIZWlnaHQoKSArICRldC5vZmZzZXQoKS50b3A7XHJcbiAgICB9XHJcbiAgICB0LmNzcygnbGVmdCcsIHggKyBwb3NvZmZzZXQueCk7XHJcbiAgICB0LmNzcygndG9wJywgeSArIHBvc29mZnNldC55KTtcclxuICAgIC8vIEFkanVzdCB3aWR0aCB0byB2aXNpYmxlIHZpZXdwb3J0XHJcbiAgICB2YXIgdGRpZiA9IHQub3V0ZXJXaWR0aCgpIC0gdC53aWR0aCgpO1xyXG4gICAgdC5jc3MoJ21heC13aWR0aCcsICQod2luZG93KS53aWR0aCgpIC0geCAtIHBvc29mZnNldC54IC0gdGRpZik7XHJcbiAgICAvL3QuaGVpZ2h0KCQoZG9jdW1lbnQpLmhlaWdodCgpIC0geSAtIHBvc29mZnNldC55KTtcclxufVxyXG4vKiogR2V0IG9yIGNyZWF0ZSwgYW5kIHJldHVybnMsIHRoZSB0b29sdGlwIGNvbnRlbnQgZm9yIHRoZSBlbGVtZW50XHJcbioqL1xyXG5mdW5jdGlvbiBjb24obCkge1xyXG4gICAgaWYgKGwubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciBjID0gbC5kYXRhKCd0b29sdGlwLWNvbnRlbnQnKSxcclxuICAgICAgICBwZXJzaXN0ZW50ID0gbC5kYXRhKCdwZXJzaXN0ZW50LXRvb2x0aXAnKTtcclxuICAgIGlmICghYykge1xyXG4gICAgICAgIHZhciBoID0gc2FuaXRpemVXaGl0ZXNwYWNlcyhsLmF0dHIoJ3RpdGxlJykpO1xyXG4gICAgICAgIHZhciBkID0gc2FuaXRpemVXaGl0ZXNwYWNlcyhsLmRhdGEoJ2Rlc2NyaXB0aW9uJykpO1xyXG4gICAgICAgIGlmIChkKVxyXG4gICAgICAgICAgICBjID0gJzxoND4nICsgaCArICc8L2g0PjxwPicgKyBkICsgJzwvcD4nO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgYyA9IGg7XHJcbiAgICAgICAgLy8gQXBwZW5kIGRhdGEtdG9vbHRpcC11cmwgY29udGVudCBpZiBleGlzdHNcclxuICAgICAgICB2YXIgdXJsY29udGVudCA9ICQobC5kYXRhKCd0b29sdGlwLXVybCcpKTtcclxuICAgICAgICBjID0gKGMgfHwgJycpICsgdXJsY29udGVudC5vdXRlckh0bWwoKTtcclxuICAgICAgICAvLyBSZW1vdmUgb3JpZ2luYWwsIGlzIG5vIG1vcmUgbmVlZCBhbmQgYXZvaWQgaWQtY29uZmxpY3RzXHJcbiAgICAgICAgdXJsY29udGVudC5yZW1vdmUoKTtcclxuICAgICAgICAvLyBTYXZlIHRvb2x0aXAgY29udGVudFxyXG4gICAgICAgIGwuZGF0YSgndG9vbHRpcC1jb250ZW50JywgYyk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGJyb3dzZXIgdG9vbHRpcCAoYm90aCB3aGVuIHdlIGFyZSB1c2luZyBvdXIgb3duIHRvb2x0aXAgYW5kIHdoZW4gbm8gdG9vbHRpcFxyXG4gICAgICAgIC8vIGlzIG5lZWQpXHJcbiAgICAgICAgbC5hdHRyKCd0aXRsZScsICcnKTtcclxuICAgIH1cclxuICAgIC8vIFJlbW92ZSB0b29sdGlwIGNvbnRlbnQgKGJ1dCBwcmVzZXJ2ZSBpdHMgY2FjaGUgaW4gdGhlIGVsZW1lbnQgZGF0YSlcclxuICAgIC8vIGlmIGlzIHRoZSBzYW1lIHRleHQgYXMgdGhlIGVsZW1lbnQgY29udGVudCBhbmQgdGhlIGVsZW1lbnQgY29udGVudFxyXG4gICAgLy8gaXMgZnVsbHkgdmlzaWJsZS4gVGhhdHMsIGZvciBjYXNlcyB3aXRoIGRpZmZlcmVudCBjb250ZW50LCB3aWxsIGJlIHNob3dlZCxcclxuICAgIC8vIGFuZCBmb3IgY2FzZXMgd2l0aCBzYW1lIGNvbnRlbnQgYnV0IGlzIG5vdCB2aXNpYmxlIGJlY2F1c2UgdGhlIGVsZW1lbnRcclxuICAgIC8vIG9yIGNvbnRhaW5lciB3aWR0aCwgdGhlbiB3aWxsIGJlIHNob3dlZC5cclxuICAgIC8vIEV4Y2VwdCBpZiBpcyBwZXJzaXN0ZW50XHJcbiAgICBpZiAocGVyc2lzdGVudCAhPT0gdHJ1ZSAmJlxyXG4gICAgICAgIHNhbml0aXplV2hpdGVzcGFjZXMobC50ZXh0KCkpID09IGMgJiZcclxuICAgICAgICBsLm91dGVyV2lkdGgoKSA+PSBsWzBdLnNjcm9sbFdpZHRoKSB7XHJcbiAgICAgICAgYyA9IG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBjb250ZW50OlxyXG4gICAgaWYgKCFjKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIHRhcmdldCByZW1vdmluZyB0aGUgY2xhc3MgdG8gYXZvaWQgY3NzIG1hcmtpbmcgdG9vbHRpcCB3aGVuIHRoZXJlIGlzIG5vdFxyXG4gICAgICAgIGwucmVtb3ZlQ2xhc3MoJ2hhcy10b29sdGlwJykucmVtb3ZlQ2xhc3MoJ2hhcy1wb3B1cC10b29sdGlwJyk7XHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm4gdGhlIGNvbnRlbnQgYXMgc3RyaW5nOlxyXG4gICAgcmV0dXJuIGM7XHJcbn1cclxuLyoqIEdldCBvciBjcmVhdGVzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2UgZm9yIGEgdG9vbHRpcCBvZiB0aGUgZ2l2ZW4gdHlwZVxyXG4qKi9cclxuZnVuY3Rpb24gZ2V0VG9vbHRpcCh0eXBlKSB7XHJcbiAgICB0eXBlID0gdHlwZSB8fCAndG9vbHRpcCc7XHJcbiAgICB2YXIgaWQgPSAnc2luZ2xldG9uLScgKyB0eXBlO1xyXG4gICAgdmFyIHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICBpZiAoIXQpIHtcclxuICAgICAgICB0ID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlXCIgY2xhc3M9XCJ0b29sdGlwXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgdC5hdHRyKCdpZCcsIGlkKTtcclxuICAgICAgICB0LmhpZGUoKTtcclxuICAgICAgICAkKCdib2R5JykuYXBwZW5kKHQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICQodCk7XHJcbn1cclxuLyoqIFNob3cgdGhlIHRvb2x0aXAgb24gYW4gZXZlbnQgdHJpZ2dlcmVkIGJ5IHRoZSBlbGVtZW50IGNvbnRhaW5pbmdcclxuaW5mb3JtYXRpb24gZm9yIGEgdG9vbHRpcFxyXG4qKi9cclxuZnVuY3Rpb24gc2hvd1Rvb2x0aXAoZSkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBpc1BvcHVwID0gJHQuaGFzQ2xhc3MoJ2hhcy1wb3B1cC10b29sdGlwJyk7XHJcbiAgICAvLyBHZXQgb3IgY3JlYXRlIHRvb2x0aXAgbGF5ZXJcclxuICAgIHZhciB0ID0gZ2V0VG9vbHRpcChpc1BvcHVwID8gJ3BvcHVwLXRvb2x0aXAnIDogJ3Rvb2x0aXAnKTtcclxuICAgIC8vIElmIHRoaXMgaXMgbm90IHBvcHVwIGFuZCB0aGUgZXZlbnQgaXMgY2xpY2ssIGRpc2NhcmQgd2l0aG91dCBjYW5jZWwgZXZlbnRcclxuICAgIGlmICghaXNQb3B1cCAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAvLyBDcmVhdGUgY29udGVudDogaWYgdGhlcmUgaXMgY29udGVudCwgY29udGludWVcclxuICAgIHZhciBjb250ZW50ID0gY29uKCR0KTtcclxuICAgIGlmIChjb250ZW50KSB7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBoYXMtcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBub3QgYSBjbGljaywgZG9uJ3Qgc2hvd1xyXG4gICAgICAgIGlmIChpc1BvcHVwICYmIGUudHlwZSAhPSAnY2xpY2snKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAvLyBUaGUgdG9vbHRpcCBzZXR1cCBtdXN0IGJlIHF1ZXVlZCB0byBhdm9pZCBjb250ZW50IHRvIGJlIHNob3dlZCBhbmQgcGxhY2VkXHJcbiAgICAgICAgLy8gd2hlbiBzdGlsbCBoaWRkZW4gdGhlIHByZXZpb3VzXHJcbiAgICAgICAgdC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFNldCB0b29sdGlwIGNvbnRlbnRcclxuICAgICAgICAgICAgdC5odG1sKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAvLyBGb3IgcG9wdXBzLCBzZXR1cCBjbGFzcyBhbmQgY2xvc2UgYnV0dG9uXHJcbiAgICAgICAgICAgIGlmIChpc1BvcHVwKSB7XHJcbiAgICAgICAgICAgICAgICB0LmFkZENsYXNzKCdwb3B1cC10b29sdGlwJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YSBocmVmPVwiI2Nsb3NlLXBvcHVwXCIgY2xhc3M9XCJjbG9zZS1hY3Rpb25cIj5YPC9hPicpO1xyXG4gICAgICAgICAgICAgICAgdC5hcHBlbmQoY2xvc2VCdXR0b24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFBvc2l0aW9uYXRlXHJcbiAgICAgICAgICAgIHBvcyh0LCBlLCAkdCk7XHJcbiAgICAgICAgICAgIHQuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAvLyBTaG93IChhbmltYXRpb25zIGFyZSBzdG9wcGVkIG9ubHkgb24gaGlkZSB0byBhdm9pZCBjb25mbGljdHMpXHJcbiAgICAgICAgICAgIHQuZmFkZUluKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RvcCBidWJibGluZyBhbmQgZGVmYXVsdFxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKiBIaWRlIGFsbCBvcGVuZWQgdG9vbHRpcHMsIGZvciBhbnkgdHlwZS5cclxuSXQgaGFzIHNvbWUgc3BlY2lhbCBjb25zaWRlcmF0aW9ucyBmb3IgcG9wdXAtdG9vbHRpcHMgZGVwZW5kaW5nXHJcbm9uIHRoZSBldmVudCBiZWluZyB0cmlnZ2VyZWQuXHJcbioqL1xyXG5mdW5jdGlvbiBoaWRlVG9vbHRpcChlKSB7XHJcbiAgICAkKCcudG9vbHRpcDp2aXNpYmxlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGlzIGEgcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBub3QgYSBjbGljaywgb3IgdGhlIGludmVyc2UsXHJcbiAgICAgICAgLy8gdGhpcyBpcyBub3QgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIGEgY2xpY2ssIGRvIG5vdGhpbmdcclxuICAgICAgICBpZiAodC5oYXNDbGFzcygncG9wdXAtdG9vbHRpcCcpICYmIGUudHlwZSAhPSAnY2xpY2snIHx8XHJcbiAgICAgICAgICAgICF0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlID09ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAvLyBTdG9wIGFuaW1hdGlvbnMgYW5kIGhpZGVcclxuICAgICAgICB0LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKiBJbml0aWFsaXplIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiBpbml0KCkge1xyXG4gICAgLy8gTGlzdGVuIGZvciBldmVudHMgdG8gc2hvdy9oaWRlIHRvb2x0aXBzXHJcbiAgICAkKCdib2R5Jykub24oJ21vdXNlbW92ZSBmb2N1c2luJywgc2VsZWN0b3IsIHNob3dUb29sdGlwKVxyXG4gICAgLm9uKCdtb3VzZWxlYXZlIGZvY3Vzb3V0Jywgc2VsZWN0b3IsIGhpZGVUb29sdGlwKVxyXG4gICAgLy8gTGlzdGVuIGV2ZW50IGZvciBjbGlja2FibGUgcG9wdXAtdG9vbHRpcHNcclxuICAgIC5vbignY2xpY2snLCAnW3RpdGxlXS5oYXMtcG9wdXAtdG9vbHRpcCcsIHNob3dUb29sdGlwKVxyXG4gICAgLy8gQWxsb3dpbmcgYnV0dG9ucyBpbnNpZGUgdGhlIHRvb2x0aXBcclxuICAgIC5vbignY2xpY2snLCAnLnRvb2x0aXAtYnV0dG9uJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAvLyBBZGRpbmcgY2xvc2UtdG9vbHRpcCBoYW5kbGVyIGZvciBwb3B1cC10b29sdGlwcyAoY2xpY2sgb24gYW55IGVsZW1lbnQgZXhjZXB0IHRoZSB0b29sdGlwIGl0c2VsZilcclxuICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHZhciB0ID0gJCgnLnBvcHVwLXRvb2x0aXA6dmlzaWJsZScpLmdldCgwKTtcclxuICAgICAgICAvLyBJZiB0aGUgY2xpY2sgaXMgTm90IG9uIHRoZSB0b29sdGlwIG9yIGFueSBlbGVtZW50IGNvbnRhaW5lZFxyXG4gICAgICAgIC8vIGhpZGUgdG9vbHRpcFxyXG4gICAgICAgIGlmIChlLnRhcmdldCAhPSB0ICYmICEkKGUudGFyZ2V0KS5pc0NoaWxkT2YodCkpXHJcbiAgICAgICAgICAgIGhpZGVUb29sdGlwKGUpO1xyXG4gICAgfSlcclxuICAgIC8vIEF2b2lkIGNsb3NlLWFjdGlvbiBjbGljayBmcm9tIHJlZGlyZWN0IHBhZ2UsIGFuZCBoaWRlIHRvb2x0aXBcclxuICAgIC5vbignY2xpY2snLCAnLnBvcHVwLXRvb2x0aXAgLmNsb3NlLWFjdGlvbicsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGhpZGVUb29sdGlwKGUpO1xyXG4gICAgfSk7XHJcbiAgICB1cGRhdGUoKTtcclxufVxyXG4vKiogVXBkYXRlIGVsZW1lbnRzIG9uIHRoZSBwYWdlIHRvIHJlZmxlY3QgY2hhbmdlcyBvciBuZWVkIGZvciB0b29sdGlwc1xyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlKGVsZW1lbnRfc2VsZWN0b3IpIHtcclxuICAgIC8vIFJldmlldyBldmVyeSBwb3B1cCB0b29sdGlwIHRvIHByZXBhcmUgY29udGVudCBhbmQgbWFyay91bm1hcmsgdGhlIGxpbmsgb3IgdGV4dDpcclxuICAgICQoZWxlbWVudF9zZWxlY3RvciB8fCBzZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uKCQodGhpcykpO1xyXG4gICAgfSk7XHJcbn1cclxuLyoqIENyZWF0ZSB0b29sdGlwIG9uIGVsZW1lbnQgYnkgZGVtYW5kXHJcbioqL1xyXG5mdW5jdGlvbiBjcmVhdGVfdG9vbHRpcChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwge1xyXG4gICAgICB0aXRsZTogJydcclxuICAgICAgLCBkZXNjcmlwdGlvbjogbnVsbFxyXG4gICAgICAsIHVybDogbnVsbFxyXG4gICAgICAsIGlzX3BvcHVwOiBmYWxzZVxyXG4gICAgICAsIHBlcnNpc3RlbnQ6IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKGVsZW1lbnQpXHJcbiAgICAuYXR0cigndGl0bGUnLCBzZXR0aW5ncy50aXRsZSlcclxuICAgIC5kYXRhKCdkZXNjcmlwdGlvbicsIHNldHRpbmdzLmRlc2NyaXB0aW9uKVxyXG4gICAgLmRhdGEoJ3BlcnNpc3RlbnQtdG9vbHRpcCcsIHNldHRpbmdzLnBlcnNpc3RlbnQpXHJcbiAgICAuYWRkQ2xhc3Moc2V0dGluZ3MuaXNfcG9wdXAgPyAnaGFzLXBvcHVwLXRvb2x0aXAnIDogJ2hhcy10b29sdGlwJyk7XHJcbiAgICB1cGRhdGUoZWxlbWVudCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXRUb29sdGlwczogaW5pdCxcclxuICAgICAgICB1cGRhdGVUb29sdGlwczogdXBkYXRlLFxyXG4gICAgICAgIGNyZWF0ZVRvb2x0aXA6IGNyZWF0ZV90b29sdGlwXHJcbiAgICB9O1xyXG4iLCIvKiBTb21lIHRvb2xzIGZvcm0gVVJMIG1hbmFnZW1lbnRcclxuKi9cclxuZXhwb3J0cy5nZXRVUkxQYXJhbWV0ZXIgPSBmdW5jdGlvbiBnZXRVUkxQYXJhbWV0ZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIGRlY29kZVVSSShcclxuICAgICAgICAoUmVnRXhwKG5hbWUgKyAnPScgKyAnKC4rPykoJnwkKScsICdpJykuZXhlYyhsb2NhdGlvbi5zZWFyY2gpIHx8IFssIG51bGxdKVsxXSk7XHJcbn07XHJcbmV4cG9ydHMuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzID0gZnVuY3Rpb24gZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzKGhhc2hiYW5ndmFsdWUpIHtcclxuICAgIC8vIEhhc2hiYW5ndmFsdWUgaXMgc29tZXRoaW5nIGxpa2U6IFRocmVhZC0xX01lc3NhZ2UtMlxyXG4gICAgLy8gV2hlcmUgJzEnIGlzIHRoZSBUaHJlYWRJRCBhbmQgJzInIHRoZSBvcHRpb25hbCBNZXNzYWdlSUQsIG9yIG90aGVyIHBhcmFtZXRlcnNcclxuICAgIHZhciBwYXJzID0gaGFzaGJhbmd2YWx1ZS5zcGxpdCgnXycpO1xyXG4gICAgdmFyIHVybFBhcmFtZXRlcnMgPSB7fTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBwYXJzdmFsdWVzID0gcGFyc1tpXS5zcGxpdCgnLScpO1xyXG4gICAgICAgIGlmIChwYXJzdmFsdWVzLmxlbmd0aCA9PSAyKVxyXG4gICAgICAgICAgICB1cmxQYXJhbWV0ZXJzW3BhcnN2YWx1ZXNbMF1dID0gcGFyc3ZhbHVlc1sxXTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVybFBhcmFtZXRlcnM7XHJcbn07XHJcbiIsIi8qKiBWYWxpZGF0aW9uIGxvZ2ljIHdpdGggbG9hZCBhbmQgc2V0dXAgb2YgdmFsaWRhdG9ycyBhbmQgXHJcbiAgICB2YWxpZGF0aW9uIHJlbGF0ZWQgdXRpbGl0aWVzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG4vLyBVc2luZyBvbiBzZXR1cCBhc3luY3Jvbm91cyBsb2FkIGluc3RlYWQgb2YgdGhpcyBzdGF0aWMtbGlua2VkIGxvYWRcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanMnKTtcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanMnKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwVmFsaWRhdGlvbihyZWFwcGx5T25seVRvKSB7XHJcbiAgICByZWFwcGx5T25seVRvID0gcmVhcHBseU9ubHlUbyB8fCBkb2N1bWVudDtcclxuICAgIGlmICghd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZiAoIWpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHtcclxuICAgICAgICBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICBNb2Rlcm5penIubG9hZChbXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanNcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzXCIgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgZmlyc3QgaWYgdmFsaWRhdGlvbiBpcyBlbmFibGVkIChjYW4gaGFwcGVuIHRoYXQgdHdpY2UgaW5jbHVkZXMgb2ZcclxuICAgICAgICAvLyB0aGlzIGNvZGUgaGFwcGVuIGF0IHNhbWUgcGFnZSwgYmVpbmcgZXhlY3V0ZWQgdGhpcyBjb2RlIGFmdGVyIGZpcnN0IGFwcGVhcmFuY2VcclxuICAgICAgICAvLyB3aXRoIHRoZSBzd2l0Y2gganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCBjaGFuZ2VkXHJcbiAgICAgICAgLy8gYnV0IHdpdGhvdXQgdmFsaWRhdGlvbiBiZWluZyBhbHJlYWR5IGxvYWRlZCBhbmQgZW5hYmxlZClcclxuICAgICAgICBpZiAoJCAmJiAkLnZhbGlkYXRvciAmJiAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZSkge1xyXG4gICAgICAgICAgICAvLyBBcHBseSB0aGUgdmFsaWRhdGlvbiBydWxlcyB0byB0aGUgbmV3IGVsZW1lbnRzXHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndmFsaWRhdG9yJyk7XHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgICAgICQudmFsaWRhdG9yLnVub2J0cnVzaXZlLnBhcnNlKHJlYXBwbHlPbmx5VG8pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0aWVzICovXHJcblxyXG4vKiBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9ycyBvZiB0aGUgdmFsaWRhdGlvbiBzdW1tYXJ5XHJcbmluY2x1ZGVkIGluICdjb250YWluZXInIGFuZCBzZXQgYXMgdmFsaWQgdGhlIHN1bW1hcnlcclxuKi9cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gICAgJCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgLmZpbmQoJz51bD5saScpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFNldCBhbGwgZmllbGRzIHZhbGlkYXRpb24gaW5zaWRlIHRoaXMgZm9ybSAoYWZmZWN0ZWQgYnkgdGhlIHN1bW1hcnkgdG9vKVxyXG4gICAgLy8gYXMgdmFsaWQgdG9vXHJcbiAgICAkKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgLnRleHQoJycpO1xyXG5cclxuICAgIC8vIFJlLWFwcGx5IHNldHVwIHZhbGlkYXRpb24gdG8gZW5zdXJlIGlzIHdvcmtpbmcsIGJlY2F1c2UganVzdCBhZnRlciBhIHN1Y2Nlc3NmdWxcclxuICAgIC8vIHZhbGlkYXRpb24sIGFzcC5uZXQgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBzdG9wcyB3b3JraW5nIG9uIGNsaWVudC1zaWRlLlxyXG4gICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihjb250YWluZXIsIGVycm9ycykge1xyXG4gIHZhciB2ID0gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcik7XHJcbiAgdi5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0RXJyb3JzKGNvbnRhaW5lciwgZXJyb3JzKSB7XHJcbiAgICAvL3ZhciB2YWxpZGF0b3IgPSAkKGNvbnRhaW5lcikudmFsaWRhdGUoKTtcclxuICAgIC8vdmFsaWRhdG9yLnNob3dFcnJvcnMoZXJyb3JzKTtcclxuICAgIHZhciAkcyA9IGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpLmZpbmQoJ3VsJyk7XHJcbiAgICB2YXIgd2l0aEVycm9ycyA9IGZhbHNlO1xyXG4gICAgZm9yKHZhciBmaWVsZCBpbiBlcnJvcnMpIHtcclxuICAgICAgICBpZiAoZXJyb3JzLmhhc093blByb3BlcnR5ICYmICFlcnJvcnMuaGFzT3duUHJvcGVydHkoZmllbGQpKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAkKCc8bGkvPicpLnRleHQoZXJyb3JzW2ZpZWxkXSkuYXBwZW5kVG8oJHMpO1xyXG4gICAgICAgIC8vJChjb250YWluZXIpLmZpbmQoJ1tuYW1lPVwiJyArIGZpZWxkICsgJ1wiXScpXHJcbiAgICAgICAgLy8uYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgIC8vLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkIHZhbGlkJyk7XHJcbiAgICAgICAgd2l0aEVycm9ycyA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBpZiAod2l0aEVycm9ycylcclxuICAgICAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IoY29udGFpbmVyKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSkge1xyXG4gICAgdmFyIG9mZiA9IGZvcm0uZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5vZmZzZXQoKTtcclxuICAgIGlmIChvZmYpXHJcbiAgICAgICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBvZmYudG9wIH0sIDUwMCk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignZ29Ub1N1bW1hcnlFcnJvcnM6IG5vIHN1bW1hcnkgdG8gZm9jdXMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcikge1xyXG4gIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudDtcclxuICByZXR1cm4gJCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nLCBjb250YWluZXIpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNldHVwOiBzZXR1cFZhbGlkYXRpb24sXHJcbiAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQ6IHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZCxcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcjogc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yLFxyXG4gICAgZ29Ub1N1bW1hcnlFcnJvcnM6IGdvVG9TdW1tYXJ5RXJyb3JzLFxyXG4gICAgZmluZFZhbGlkYXRpb25TdW1tYXJ5OiBmaW5kVmFsaWRhdGlvblN1bW1hcnksXHJcbiAgICBzZXRFcnJvcnM6IHNldEVycm9yc1xyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gc29tZSBBY2NvdW50IHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJ2EubG9naW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IGJhc2VVcmwgKyAnQWNjb3VudC8kTG9naW4vP1JldHVyblVybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbik7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EuZm9yZ290LXBhc3N3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L0ZvcmdvdFBhc3N3b3JkJywgJy9BY2NvdW50LyRGb3Jnb3RQYXNzd29yZCcpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDAwLCBoZWlnaHQ6IDI0MCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmNoYW5nZS1wYXNzd29yZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9DaGFuZ2VQYXNzd29yZCcsICcvQWNjb3VudC8kQ2hhbmdlUGFzc3dvcmQnKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQ1MCwgaGVpZ2h0OiAzNDAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLy8gT1VSIG5hbWVzcGFjZSAoYWJicmV2aWF0ZWQgTG9jb25vbWljcylcclxud2luZG93LkxDID0gd2luZG93LkxDIHx8IHt9O1xyXG5cclxuLy8gVE9ETyBSZXZpZXcgTGNVcmwgdXNlIGFyb3VuZCBhbGwgdGhlIG1vZHVsZXMsIHVzZSBESSB3aGVuZXZlciBwb3NzaWJsZSAoaW5pdC9zZXR1cCBtZXRob2Qgb3IgaW4gdXNlIGNhc2VzKVxyXG4vLyBidXQgb25seSBmb3IgdGhlIHdhbnRlZCBiYXNlVXJsIG9uIGVhY2ggY2FzZSBhbmQgbm90IHBhc3MgYWxsIHRoZSBMY1VybCBvYmplY3QuXHJcbi8vIExjVXJsIGlzIHNlcnZlci1zaWRlIGdlbmVyYXRlZCBhbmQgd3JvdGUgaW4gYSBMYXlvdXQgc2NyaXB0LXRhZy5cclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5nc1xyXG53aW5kb3cuZ0xvYWRpbmdSZXRhcmQgPSAzMDA7XHJcblxyXG4vKioqXHJcbiAqKiBMb2FkaW5nIG1vZHVsZXNcclxuKioqL1xyXG4vL1RPRE86IENsZWFuIGRlcGVuZGVuY2llcywgcmVtb3ZlIGFsbCB0aGF0IG5vdCB1c2VkIGRpcmVjdGx5IGluIHRoaXMgZmlsZSwgYW55IG90aGVyIGZpbGVcclxuLy8gb3IgcGFnZSBtdXN0IHJlcXVpcmUgaXRzIGRlcGVuZGVuY2llcy5cclxuXHJcbndpbmRvdy5MY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyk7XHJcblxyXG4vKiBqUXVlcnksIHNvbWUgdmVuZG9yIHBsdWdpbnMgKGZyb20gYnVuZGxlKSBhbmQgb3VyIGFkZGl0aW9ucyAoc21hbGwgcGx1Z2lucyksIHRoZXkgYXJlIGF1dG9tYXRpY2FsbHkgcGx1Zy1lZCBvbiByZXF1aXJlICovXHJcbnZhciAkID0gd2luZG93LiQgPSB3aW5kb3cualF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXInKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJhLWhhc2hjaGFuZ2UnKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LmFyZScpO1xyXG4vLyBNYXNrZWQgaW5wdXQsIGZvciBkYXRlcyAtYXQgbXktYWNjb3VudC0uXHJcbnJlcXVpcmUoJ2pxdWVyeS5mb3JtYXR0ZXInKTtcclxuXHJcbi8vIEdlbmVyYWwgY2FsbGJhY2tzIGZvciBBSkFYIGV2ZW50cyB3aXRoIGNvbW1vbiBsb2dpY1xyXG52YXIgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhDYWxsYmFja3MnKTtcclxuLy8gRm9ybS5hamF4IGxvZ2ljIGFuZCBtb3JlIHNwZWNpZmljIGNhbGxiYWNrcyBiYXNlZCBvbiBhamF4Q2FsbGJhY2tzXHJcbnZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbndpbmRvdy5hamF4Rm9ybXNTdWNjZXNzSGFuZGxlciA9IGFqYXhGb3Jtcy5vblN1Y2Nlc3M7XHJcbndpbmRvdy5hamF4RXJyb3JQb3B1cEhhbmRsZXIgPSBhamF4Rm9ybXMub25FcnJvcjtcclxud2luZG93LmFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlciA9IGFqYXhGb3Jtcy5vbkNvbXBsZXRlO1xyXG4vL31cclxuXHJcbi8qIFJlbG9hZCAqL1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkucmVsb2FkJyk7XHJcbi8vIFdyYXBwZXIgZnVuY3Rpb24gYXJvdW5kIG9uU3VjY2VzcyB0byBtYXJrIG9wZXJhdGlvbiBhcyBwYXJ0IG9mIGEgXHJcbi8vIHJlbG9hZCBhdm9pZGluZyBzb21lIGJ1Z3MgKGFzIHJlcGxhY2UtY29udGVudCBvbiBhamF4LWJveCwgbm90IHdhbnRlZCBmb3JcclxuLy8gcmVsb2FkIG9wZXJhdGlvbnMpXHJcbmZ1bmN0aW9uIHJlbG9hZFN1Y2Nlc3NXcmFwcGVyKCkge1xyXG4gIHZhciBjb250ZXh0ID0gJC5pc1BsYWluT2JqZWN0KHRoaXMpID8gdGhpcyA6IHsgZWxlbWVudDogdGhpcyB9O1xyXG4gIGNvbnRleHQuaXNSZWxvYWQgPSB0cnVlO1xyXG4gIGFqYXhGb3Jtcy5vblN1Y2Nlc3MuYXBwbHkoY29udGV4dCwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XHJcbn1cclxuJC5mbi5yZWxvYWQuZGVmYXVsdHMgPSB7XHJcbiAgc3VjY2VzczogW3JlbG9hZFN1Y2Nlc3NXcmFwcGVyXSxcclxuICBlcnJvcjogW2FqYXhGb3Jtcy5vbkVycm9yXSxcclxuICBkZWxheTogZ0xvYWRpbmdSZXRhcmRcclxufTtcclxuXHJcbkxDLm1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi4vTEMvbW92ZUZvY3VzVG8nKTtcclxuLyogRGlzYWJsZWQgYmVjYXVzZSBjb25mbGljdHMgd2l0aCB0aGUgbW92ZUZvY3VzVG8gb2YgXHJcbiAgYWpheEZvcm0ub25zdWNjZXNzLCBpdCBoYXBwZW5zIGEgYmxvY2subG9hZGluZyBqdXN0IGFmdGVyXHJcbiAgdGhlIHN1Y2Nlc3MgaGFwcGVucy5cclxuJC5ibG9ja1VJLmRlZmF1bHRzLm9uQmxvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBTY3JvbGwgdG8gYmxvY2stbWVzc2FnZSB0byBkb24ndCBsb3N0IGluIGxhcmdlIHBhZ2VzOlxyXG4gICAgTEMubW92ZUZvY3VzVG8odGhpcyk7XHJcbn07Ki9cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuLi9MQy9sb2FkZXInKTtcclxuTEMubG9hZCA9IGxvYWRlci5sb2FkO1xyXG5cclxudmFyIGJsb2NrcyA9IExDLmJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4uL0xDL2Jsb2NrUHJlc2V0cycpO1xyXG4vL3tURU1QXHJcbndpbmRvdy5sb2FkaW5nQmxvY2sgPSBibG9ja3MubG9hZGluZztcclxud2luZG93LmluZm9CbG9jayA9IGJsb2Nrcy5pbmZvO1xyXG53aW5kb3cuZXJyb3JCbG9jayA9IGJsb2Nrcy5lcnJvcjtcclxuLy99XHJcblxyXG5BcnJheS5yZW1vdmUgPSByZXF1aXJlKCcuLi9MQy9BcnJheS5yZW1vdmUnKTtcclxucmVxdWlyZSgnLi4vTEMvU3RyaW5nLnByb3RvdHlwZS5jb250YWlucycpO1xyXG5cclxuTEMuZ2V0VGV4dCA9IHJlcXVpcmUoJy4uL0xDL2dldFRleHQnKTtcclxuXHJcbnZhciBUaW1lU3BhbiA9IExDLnRpbWVTcGFuID0gcmVxdWlyZSgnLi4vTEMvVGltZVNwYW4nKTtcclxudmFyIHRpbWVTcGFuRXh0cmEgPSByZXF1aXJlKCcuLi9MQy9UaW1lU3BhbkV4dHJhJyk7XHJcbnRpbWVTcGFuRXh0cmEucGx1Z0luKFRpbWVTcGFuKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzZXNcclxuTEMuc21hcnRUaW1lID0gdGltZVNwYW5FeHRyYS5zbWFydFRpbWU7XHJcbkxDLnJvdW5kVGltZVRvUXVhcnRlckhvdXIgPSB0aW1lU3BhbkV4dHJhLnJvdW5kVG9RdWFydGVySG91cjtcclxuLy99XHJcblxyXG5MQy5DaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi4vTEMvY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG53aW5kb3cuVGFiYmVkVVggPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWCcpO1xyXG52YXIgc2xpZGVyVGFicyA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLnNsaWRlclRhYnMnKTtcclxuXHJcbi8vIFBvcHVwIEFQSXNcclxud2luZG93LnNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi4vTEMvc21vb3RoQm94QmxvY2snKTtcclxuXHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4uL0xDL3BvcHVwJyk7XHJcbi8ve1RFTVBcclxudmFyIHBvcHVwU3R5bGUgPSBwb3B1cC5zdHlsZSxcclxuICAgIHBvcHVwU2l6ZSA9IHBvcHVwLnNpemU7XHJcbkxDLm1lc3NhZ2VQb3B1cCA9IHBvcHVwLm1lc3NhZ2U7XHJcbkxDLmNvbm5lY3RQb3B1cEFjdGlvbiA9IHBvcHVwLmNvbm5lY3RBY3Rpb247XHJcbndpbmRvdy5wb3B1cCA9IHBvcHVwO1xyXG4vL31cclxuXHJcbkxDLnNhbml0aXplV2hpdGVzcGFjZXMgPSByZXF1aXJlKCcuLi9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzJyk7XHJcbi8ve1RFTVAgICBhbGlhcyBiZWNhdXNlIG1pc3NwZWxsaW5nXHJcbkxDLnNhbml0aXplV2hpdGVwYWNlcyA9IExDLnNhbml0aXplV2hpdGVzcGFjZXM7XHJcbi8vfVxyXG5cclxuTEMuZ2V0WFBhdGggPSByZXF1aXJlKCcuLi9MQy9nZXRYUGF0aCcpO1xyXG5cclxudmFyIHN0cmluZ0Zvcm1hdCA9IHJlcXVpcmUoJy4uL0xDL1N0cmluZ0Zvcm1hdCcpO1xyXG5cclxuLy8gRXhwYW5kaW5nIGV4cG9ydGVkIHV0aWxpdGVzIGZyb20gbW9kdWxlcyBkaXJlY3RseSBhcyBMQyBtZW1iZXJzOlxyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvUHJpY2UnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9tYXRoVXRpbHMnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9udW1iZXJVdGlscycpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL3Rvb2x0aXBzJykpO1xyXG52YXIgaTE4biA9IExDLmkxOG4gPSByZXF1aXJlKCcuLi9MQy9pMThuJyk7XHJcbi8ve1RFTVAgb2xkIGFsaXNlcyBvbiBMQyBhbmQgZ2xvYmFsXHJcbiQuZXh0ZW5kKExDLCBpMThuKTtcclxuJC5leHRlbmQod2luZG93LCBpMThuKTtcclxuLy99XHJcblxyXG4vLyB4dHNoOiBwbHVnZWQgaW50byBqcXVlcnkgYW5kIHBhcnQgb2YgTENcclxudmFyIHh0c2ggPSByZXF1aXJlKCcuLi9MQy9qcXVlcnkueHRzaCcpO1xyXG54dHNoLnBsdWdJbigkKTtcclxuLy97VEVNUCAgIHJlbW92ZSBvbGQgTEMuKiBhbGlhc1xyXG4kLmV4dGVuZChMQywgeHRzaCk7XHJcbmRlbGV0ZSBMQy5wbHVnSW47XHJcbi8vfVxyXG5cclxudmFyIGF1dG9DYWxjdWxhdGUgPSBMQy5hdXRvQ2FsY3VsYXRlID0gcmVxdWlyZSgnLi4vTEMvYXV0b0NhbGN1bGF0ZScpO1xyXG4vL3tURU1QICAgcmVtb3ZlIG9sZCBhbGlhcyB1c2VcclxudmFyIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzID0gYXV0b0NhbGN1bGF0ZS5vblRhYmxlSXRlbXM7XHJcbkxDLnNldHVwQ2FsY3VsYXRlU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUub25TdW1tYXJ5O1xyXG5MQy51cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS51cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5O1xyXG5MQy5zZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLm9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTtcclxuLy99XHJcblxyXG52YXIgQ29va2llID0gTEMuQ29va2llID0gcmVxdWlyZSgnLi4vTEMvQ29va2llJyk7XHJcbi8ve1RFTVAgICAgb2xkIGFsaWFzXHJcbnZhciBnZXRDb29raWUgPSBDb29raWUuZ2V0LFxyXG4gICAgc2V0Q29va2llID0gQ29va2llLnNldDtcclxuLy99XHJcblxyXG5MQy5kYXRlUGlja2VyID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVBpY2tlcicpO1xyXG4vL3tURU1QICAgb2xkIGFsaWFzXHJcbndpbmRvdy5zZXR1cERhdGVQaWNrZXIgPSBMQy5zZXR1cERhdGVQaWNrZXIgPSBMQy5kYXRlUGlja2VyLmluaXQ7XHJcbndpbmRvdy5hcHBseURhdGVQaWNrZXIgPSBMQy5hcHBseURhdGVQaWNrZXIgPSBMQy5kYXRlUGlja2VyLmFwcGx5O1xyXG4vL31cclxuXHJcbkxDLmF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4uL0xDL2F1dG9Gb2N1cycpO1xyXG5cclxuLy8gQ1JVREw6IGxvYWRpbmcgbW9kdWxlLCBzZXR0aW5nIHVwIGNvbW1vbiBkZWZhdWx0IHZhbHVlcyBhbmQgY2FsbGJhY2tzOlxyXG52YXIgY3J1ZGxNb2R1bGUgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpO1xyXG5jcnVkbE1vZHVsZS5kZWZhdWx0U2V0dGluZ3MuZGF0YVsnZm9jdXMtY2xvc2VzdCddWydkZWZhdWx0J10gPSAnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJztcclxuY3J1ZGxNb2R1bGUuZGVmYXVsdFNldHRpbmdzLmRhdGFbJ2ZvY3VzLW1hcmdpbiddWydkZWZhdWx0J10gPSAxMDtcclxudmFyIGNydWRsID0gY3J1ZGxNb2R1bGUuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy8gUHJldmlvdXMgdXNlZCBhbGlhcyAoZGVwcmVjYXRlZCk6XHJcbkxDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG5cclxuLy8gVUkgU2xpZGVyIExhYmVsc1xyXG52YXIgc2xpZGVyTGFiZWxzID0gcmVxdWlyZSgnLi4vTEMvVUlTbGlkZXJMYWJlbHMnKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbkxDLmNyZWF0ZUxhYmVsc0ZvclVJU2xpZGVyID0gc2xpZGVyTGFiZWxzLmNyZWF0ZTtcclxuTEMudXBkYXRlTGFiZWxzRm9yVUlTbGlkZXIgPSBzbGlkZXJMYWJlbHMudXBkYXRlO1xyXG5MQy51aVNsaWRlckxhYmVsc0xheW91dHMgPSBzbGlkZXJMYWJlbHMubGF5b3V0cztcclxuLy99XHJcblxyXG52YXIgdmFsaWRhdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4uL0xDL3ZhbGlkYXRpb25IZWxwZXInKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbkxDLnNldHVwVmFsaWRhdGlvbiA9IHZhbGlkYXRpb25IZWxwZXIuc2V0dXA7XHJcbkxDLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZCA9IHZhbGlkYXRpb25IZWxwZXIuc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkO1xyXG5MQy5nb1RvU3VtbWFyeUVycm9ycyA9IHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnM7XHJcbi8vfVxyXG5cclxuTEMucGxhY2VIb2xkZXIgPSByZXF1aXJlKCcuLi9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbCcpLmluaXQ7XHJcblxyXG5MQy5tYXBSZWFkeSA9IHJlcXVpcmUoJy4uL0xDL2dvb2dsZU1hcFJlYWR5Jyk7XHJcblxyXG53aW5kb3cuaXNFbXB0eVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2lzRW1wdHlTdHJpbmcnKTtcclxuXHJcbndpbmRvdy5ndWlkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vTEMvZ3VpZEdlbmVyYXRvcicpO1xyXG5cclxudmFyIHVybFV0aWxzID0gcmVxdWlyZSgnLi4vTEMvdXJsVXRpbHMnKTtcclxud2luZG93LmdldFVSTFBhcmFtZXRlciA9IHVybFV0aWxzLmdldFVSTFBhcmFtZXRlcjtcclxud2luZG93LmdldEhhc2hCYW5nUGFyYW1ldGVycyA9IHVybFV0aWxzLmdldEhhc2hCYW5nUGFyYW1ldGVycztcclxuXHJcbnZhciBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9kYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcnKTtcclxuLy97VEVNUFxyXG5MQy5kYXRlVG9JbnRlcmNoYW5nbGVTdHJpbmcgPSBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmc7XHJcbi8vfVxyXG5cclxuLy8gUGFnZXMgaW4gcG9wdXBcclxudmFyIHdlbGNvbWVQb3B1cCA9IHJlcXVpcmUoJy4vd2VsY29tZVBvcHVwJyk7XHJcbnZhciBmYXFzUG9wdXBzID0gcmVxdWlyZSgnLi9mYXFzUG9wdXBzJyk7XHJcbnZhciBhY2NvdW50UG9wdXBzID0gcmVxdWlyZSgnLi9hY2NvdW50UG9wdXBzJyk7XHJcbnZhciBsZWdhbFBvcHVwcyA9IHJlcXVpcmUoJy4vbGVnYWxQb3B1cHMnKTtcclxuXHJcbi8vIE9sZCBhdmFpbGFibGl0eSBjYWxlbmRhclxyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQgPSByZXF1aXJlKCcuL2F2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0Jyk7XHJcbi8vIE5ldyBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyID0gcmVxdWlyZSgnLi4vTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXInKTtcclxuXHJcbnZhciBhdXRvZmlsbFN1Ym1lbnUgPSByZXF1aXJlKCcuLi9MQy9hdXRvZmlsbFN1Ym1lbnUnKTtcclxuXHJcbnZhciB0YWJiZWRXaXphcmQgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC53aXphcmQnKTtcclxuXHJcbnZhciBoYXNDb25maXJtU3VwcG9ydCA9IHJlcXVpcmUoJy4uL0xDL2hhc0NvbmZpcm1TdXBwb3J0Jyk7XHJcblxyXG52YXIgcG9zdGFsQ29kZVZhbGlkYXRpb24gPSByZXF1aXJlKCcuLi9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbicpO1xyXG5cclxudmFyIHRhYmJlZE5vdGlmaWNhdGlvbnMgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcblxyXG52YXIgdGFic0F1dG9sb2FkID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguYXV0b2xvYWQnKTtcclxuXHJcbnZhciBob21lUGFnZSA9IHJlcXVpcmUoJy4vaG9tZScpO1xyXG5cclxuLy97VEVNUCByZW1vdmUgZ2xvYmFsIGRlcGVuZGVuY3kgZm9yIHRoaXNcclxud2luZG93LmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuLi9MQy9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcbi8vfVxyXG5cclxudmFyIHByb3ZpZGVyV2VsY29tZSA9IHJlcXVpcmUoJy4vcHJvdmlkZXJXZWxjb21lJyk7XHJcblxyXG4vKipcclxuICoqIEluaXQgY29kZVxyXG4qKiovXHJcbiQod2luZG93KS5sb2FkKGZ1bmN0aW9uICgpIHtcclxuICAvLyBEaXNhYmxlIGJyb3dzZXIgYmVoYXZpb3IgdG8gYXV0by1zY3JvbGwgdG8gdXJsIGZyYWdtZW50L2hhc2ggZWxlbWVudCBwb3NpdGlvbjpcclxuICAvLyBFWENFUFQgaW4gRGFzaGJvYXJkOlxyXG4gIC8vIFRPRE86IFJldmlldyBpZiB0aGlzIGlzIHJlcXVpcmVkIG9ubHkgZm9yIEhvd0l0V29ya3Mgb3Igc29tZXRoaW5nIG1vcmUgKHRhYnMsIHByb2ZpbGUpXHJcbiAgLy8gYW5kIHJlbW92ZSBpZiBwb3NzaWJsZSBvciBvbmx5IG9uIHRoZSBjb25jcmV0ZSBjYXNlcy5cclxuICBpZiAoIS9cXC9kYXNoYm9hcmRcXC8vaS50ZXN0KGxvY2F0aW9uKSlcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyAkKCdodG1sLGJvZHknKS5zY3JvbGxUb3AoMCk7IH0sIDEpO1xyXG59KTtcclxuJChmdW5jdGlvbiAoKSB7XHJcblxyXG4gIHByb3ZpZGVyV2VsY29tZS5zaG93KCk7XHJcblxyXG4gIC8vIFBsYWNlaG9sZGVyIHBvbHlmaWxsXHJcbiAgTEMucGxhY2VIb2xkZXIoKTtcclxuXHJcbiAgLy8gQXV0b2ZvY3VzIHBvbHlmaWxsXHJcbiAgTEMuYXV0b0ZvY3VzKCk7XHJcblxyXG4gIC8vIEdlbmVyaWMgc2NyaXB0IGZvciBlbmhhbmNlZCB0b29sdGlwcyBhbmQgZWxlbWVudCBkZXNjcmlwdGlvbnNcclxuICBMQy5pbml0VG9vbHRpcHMoKTtcclxuXHJcbiAgYWpheEZvcm1zLmluaXQoKTtcclxuXHJcbiAgd2VsY29tZVBvcHVwLmluaXQoKTtcclxuXHJcbiAgLy8gRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIGZvciBzb21lIGxpbmtzIHRoYXQgYnkgZGVmYXVsdCBvcGVuIGEgbmV3IHRhYjpcclxuICBmYXFzUG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcbiAgYWNjb3VudFBvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gIGxlZ2FsUG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcblxyXG4gIC8vIE9sZCBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxuICBhdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5pbml0KExjVXJsLkxhbmdQYXRoKTtcclxuICAvLyBOZXcgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbiAgYXZhaWxhYmlsaXR5Q2FsZW5kYXIuV2Vla2x5LmVuYWJsZUFsbCgpO1xyXG5cclxuICBwb3B1cC5jb25uZWN0QWN0aW9uKCk7XHJcblxyXG4gIC8vIERhdGUgUGlja2VyXHJcbiAgTEMuZGF0ZVBpY2tlci5pbml0KCk7XHJcblxyXG4gIC8qIEF1dG8gY2FsY3VsYXRlIHRhYmxlIGl0ZW1zIHRvdGFsIChxdWFudGl0eSp1bml0cHJpY2U9aXRlbS10b3RhbCkgc2NyaXB0ICovXHJcbiAgYXV0b0NhbGN1bGF0ZS5vblRhYmxlSXRlbXMoKTtcclxuICBhdXRvQ2FsY3VsYXRlLm9uU3VtbWFyeSgpO1xyXG5cclxuICBoYXNDb25maXJtU3VwcG9ydC5vbigpO1xyXG5cclxuICBwb3N0YWxDb2RlVmFsaWRhdGlvbi5pbml0KHsgYmFzZVVybDogTGNVcmwuTGFuZ1BhdGggfSk7XHJcblxyXG4gIC8vIFRhYmJlZCBpbnRlcmZhY2VcclxuICB0YWJzQXV0b2xvYWQuaW5pdChUYWJiZWRVWCk7XHJcbiAgVGFiYmVkVVguaW5pdCgpO1xyXG4gIFRhYmJlZFVYLmZvY3VzQ3VycmVudExvY2F0aW9uKCk7XHJcbiAgVGFiYmVkVVguY2hlY2tWb2xhdGlsZVRhYnMoKTtcclxuICBzbGlkZXJUYWJzLmluaXQoVGFiYmVkVVgpO1xyXG5cclxuICB0YWJiZWRXaXphcmQuaW5pdChUYWJiZWRVWCwge1xyXG4gICAgbG9hZGluZ0RlbGF5OiBnTG9hZGluZ1JldGFyZFxyXG4gIH0pO1xyXG5cclxuICB0YWJiZWROb3RpZmljYXRpb25zLmluaXQoVGFiYmVkVVgpO1xyXG5cclxuICBhdXRvZmlsbFN1Ym1lbnUoKTtcclxuXHJcbiAgLy8gVE9ETzogJ2xvYWRIYXNoQmFuZycgY3VzdG9tIGV2ZW50IGluIHVzZT9cclxuICAvLyBJZiB0aGUgaGFzaCB2YWx1ZSBmb2xsb3cgdGhlICdoYXNoIGJhbmcnIGNvbnZlbnRpb24sIGxldCBvdGhlclxyXG4gIC8vIHNjcmlwdHMgZG8gdGhlaXIgd29yayB0aHJvdWdodCBhICdsb2FkSGFzaEJhbmcnIGV2ZW50IGhhbmRsZXJcclxuICBpZiAoL14jIS8udGVzdCh3aW5kb3cubG9jYXRpb24uaGFzaCkpXHJcbiAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdsb2FkSGFzaEJhbmcnLCB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSkpO1xyXG5cclxuICAvLyBSZWxvYWQgYnV0dG9uc1xyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucmVsb2FkLWFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIEdlbmVyaWMgYWN0aW9uIHRvIGNhbGwgbGMuanF1ZXJ5ICdyZWxvYWQnIGZ1bmN0aW9uIGZyb20gYW4gZWxlbWVudCBpbnNpZGUgaXRzZWxmLlxyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICR0LmNsb3Nlc3QoJHQuZGF0YSgncmVsb2FkLXRhcmdldCcpKS5yZWxvYWQoKTtcclxuICB9KTtcclxuXHJcbiAgLyogRW5hYmxlIGZvY3VzIHRhYiBvbiBldmVyeSBoYXNoIGNoYW5nZSwgbm93IHRoZXJlIGFyZSB0d28gc2NyaXB0cyBtb3JlIHNwZWNpZmljIGZvciB0aGlzOlxyXG4gICogb25lIHdoZW4gcGFnZSBsb2FkICh3aGVyZT8pLFxyXG4gICogYW5kIGFub3RoZXIgb25seSBmb3IgbGlua3Mgd2l0aCAndGFyZ2V0LXRhYicgY2xhc3MuXHJcbiAgKiBOZWVkIGJlIHN0dWR5IGlmIHNvbWV0aGluZyBvZiB0aGVyZSBtdXN0IGJlIHJlbW92ZWQgb3IgY2hhbmdlZC5cclxuICAqIFRoaXMgaXMgbmVlZGVkIGZvciBvdGhlciBiZWhhdmlvcnMgdG8gd29yay4gKi9cclxuICAvLyBPbiB0YXJnZXQtdGFiIGxpbmtzXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2EudGFyZ2V0LXRhYicsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciB0aGVyZUlzVGFiID0gVGFiYmVkVVguZ2V0VGFiKCQodGhpcykuYXR0cignaHJlZicpKTtcclxuICAgIGlmICh0aGVyZUlzVGFiKSB7XHJcbiAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRoZXJlSXNUYWIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgLy8gT24gaGFzaCBjaGFuZ2VcclxuICBpZiAoJC5mbi5oYXNoY2hhbmdlKVxyXG4gICAgJCh3aW5kb3cpLmhhc2hjaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICBpZiAoIS9eIyEvLnRlc3QobG9jYXRpb24uaGFzaCkpIHtcclxuICAgICAgICB2YXIgdGhlcmVJc1RhYiA9IFRhYmJlZFVYLmdldFRhYihsb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICBpZiAodGhlcmVJc1RhYilcclxuICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRoZXJlSXNUYWIpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgLy8gSE9NRSBQQUdFIC8gU0VBUkNIIFNUVUZGXHJcbiAgaG9tZVBhZ2UuaW5pdCgpO1xyXG5cclxuICAvLyBWYWxpZGF0aW9uIGF1dG8gc2V0dXAgZm9yIHBhZ2UgcmVhZHkgYW5kIGFmdGVyIGV2ZXJ5IGFqYXggcmVxdWVzdFxyXG4gIC8vIGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgZm9ybSBpbiB0aGUgcGFnZS5cclxuICAvLyBUaGlzIGF2b2lkIHRoZSBuZWVkIGZvciBldmVyeSBwYWdlIHdpdGggZm9ybSB0byBkbyB0aGUgc2V0dXAgaXRzZWxmXHJcbiAgLy8gYWxtb3N0IGZvciBtb3N0IG9mIHRoZSBjYXNlLlxyXG4gIGZ1bmN0aW9uIGF1dG9TZXR1cFZhbGlkYXRpb24oKSB7XHJcbiAgICBpZiAoJChkb2N1bWVudCkuaGFzKCdmb3JtJykubGVuZ3RoKVxyXG4gICAgICB2YWxpZGF0aW9uSGVscGVyLnNldHVwKCdmb3JtJyk7XHJcbiAgfVxyXG4gIGF1dG9TZXR1cFZhbGlkYXRpb24oKTtcclxuICAkKGRvY3VtZW50KS5hamF4Q29tcGxldGUoYXV0b1NldHVwVmFsaWRhdGlvbik7XHJcblxyXG4gIC8vIFRPRE86IHVzZWQgc29tZSB0aW1lPyBzdGlsbCByZXF1aXJlZCB1c2luZyBtb2R1bGVzP1xyXG4gIC8qXHJcbiAgKiBDb21tdW5pY2F0ZSB0aGF0IHNjcmlwdC5qcyBpcyByZWFkeSB0byBiZSB1c2VkXHJcbiAgKiBhbmQgdGhlIGNvbW1vbiBMQyBsaWIgdG9vLlxyXG4gICogQm90aCBhcmUgZW5zdXJlZCB0byBiZSByYWlzZWQgZXZlciBhZnRlciBwYWdlIGlzIHJlYWR5IHRvby5cclxuICAqL1xyXG4gICQoZG9jdW1lbnQpXHJcbiAgICAudHJpZ2dlcignbGNTY3JpcHRSZWFkeScpXHJcbiAgICAudHJpZ2dlcignbGNMaWJSZWFkeScpO1xyXG59KTsiLCIvKioqKiogQVZBSUxBQklMSVRZIENBTEVOREFSIFdJREdFVCAqKioqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi4vTEMvc21vb3RoQm94QmxvY2snKSxcclxuICAgIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZycpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkucmVsb2FkJyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0QXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5jYWxlbmRhci1jb250cm9scyAuYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCR0Lmhhc0NsYXNzKCd6b29tLWFjdGlvbicpKSB7XHJcbiAgICAgICAgICAgIC8vIERvIHpvb21cclxuICAgICAgICAgICAgdmFyIGMgPSAkdC5jbG9zZXN0KCcuYXZhaWxhYmlsaXR5LWNhbGVuZGFyJykuZmluZCgnLmNhbGVuZGFyJykuY2xvbmUoKTtcclxuICAgICAgICAgICAgYy5jc3MoJ2ZvbnQtc2l6ZScsICcycHgnKTtcclxuICAgICAgICAgICAgdmFyIHRhYiA9ICR0LmNsb3Nlc3QoJy50YWItYm9keScpO1xyXG4gICAgICAgICAgICBjLmRhdGEoJ3BvcHVwLWNvbnRhaW5lcicsIHRhYik7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgdGFiLCAnYXZhaWxhYmlsaXR5LWNhbGVuZGFyJywgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgLy8gTm90aGluZyBtb3JlXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTmF2aWdhdGUgY2FsZW5kYXJcclxuICAgICAgICB2YXIgbmV4dCA9ICR0Lmhhc0NsYXNzKCduZXh0LXdlZWstYWN0aW9uJyk7XHJcbiAgICAgICAgdmFyIGNvbnQgPSAkdC5jbG9zZXN0KCcuYXZhaWxhYmlsaXR5LWNhbGVuZGFyJyk7XHJcbiAgICAgICAgdmFyIGNhbGNvbnQgPSBjb250LmNoaWxkcmVuKCcuY2FsZW5kYXItY29udGFpbmVyJyk7XHJcbiAgICAgICAgdmFyIGNhbCA9IGNhbGNvbnQuY2hpbGRyZW4oJy5jYWxlbmRhcicpO1xyXG4gICAgICAgIHZhciBjYWxpbmZvID0gY29udC5maW5kKCcuY2FsZW5kYXItaW5mbycpO1xyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoY2FsLmRhdGEoJ3Nob3dlZC1kYXRlJykpO1xyXG4gICAgICAgIHZhciB1c2VySWQgPSBjYWwuZGF0YSgndXNlci1pZCcpO1xyXG4gICAgICAgIGlmIChuZXh0KVxyXG4gICAgICAgICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyA3KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSAtIDcpO1xyXG4gICAgICAgIHZhciBzdHJkYXRlID0gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nKGRhdGUpO1xyXG4gICAgICAgIHZhciB1cmwgPSBiYXNlVXJsICsgXCJQcm9maWxlLyRBdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC9XZWVrL1wiICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmRhdGUpICsgXCIvP1VzZXJJRD1cIiArIHVzZXJJZDtcclxuICAgICAgICBjYWxjb250LnJlbG9hZCh1cmwsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBuZXcgb2JqZWN0OlxyXG4gICAgICAgICAgICB2YXIgY2FsID0gJCgnLmNhbGVuZGFyJywgdGhpcy5lbGVtZW50KTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcueWVhci13ZWVrJykudGV4dChjYWwuZGF0YSgnc2hvd2VkLXdlZWsnKSk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLmZpcnN0LXdlZWstZGF5JykudGV4dChjYWwuZGF0YSgnc2hvd2VkLWZpcnN0LWRheScpKTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcubGFzdC13ZWVrLWRheScpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC1sYXN0LWRheScpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIEZBUXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIGZhcXNCYXNlVXJsID0gJ0hlbHBDZW50ZXIvJEZBUXMnO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gIGZhcXNCYXNlVXJsID0gKGJhc2VVcmwgfHwgJy8nKSArIGZhcXNCYXNlVXJsO1xyXG5cclxuICAvLyBFbmFibGUgRkFRcyBsaW5rcyBpbiBwb3B1cFxyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhW2hyZWZ8PVwiI0ZBUXNcIl0nLCBwb3B1cEZhcXMpO1xyXG5cclxuICAvLyBBdXRvIG9wZW4gY3VycmVudCBkb2N1bWVudCBsb2NhdGlvbiBpZiBoYXNoIGlzIGEgRkFRIGxpbmtcclxuICBpZiAoL14jRkFRcy9pLnRlc3QobG9jYXRpb24uaGFzaCkpIHtcclxuICAgIHBvcHVwRmFxcyhsb2NhdGlvbi5oYXNoKTtcclxuICB9XHJcblxyXG4gIC8vIHJldHVybiBhcyB1dGlsaXR5XHJcbiAgcmV0dXJuIHBvcHVwRmFxcztcclxufTtcclxuXHJcbi8qIFBhc3MgYSBGYXFzIEB1cmwgb3IgdXNlIGFzIGEgbGluayBoYW5kbGVyIHRvIG9wZW4gdGhlIEZBUSBpbiBhIHBvcHVwXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3B1cEZhcXModXJsKSB7XHJcbiAgdXJsID0gdHlwZW9mICh1cmwpID09PSAnc3RyaW5nJyA/IHVybCA6ICQodGhpcykuYXR0cignaHJlZicpO1xyXG5cclxuICB2YXIgdXJscGFydHMgPSB1cmwuc3BsaXQoJy0nKTtcclxuXHJcbiAgaWYgKHVybHBhcnRzWzBdICE9ICcjRkFRcycpIHtcclxuICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ1RoZSBVUkwgaXMgbm90IGEgRkFRIHVybCAoZG9lc25cXCd0IHN0YXJ0cyB3aXRoICNGQVFzLSknLCB1cmwpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICB2YXIgdXJsc2VjdGlvbiA9IHVybHBhcnRzLmxlbmd0aCA+IDEgPyB1cmxwYXJ0c1sxXSA6ICcnO1xyXG5cclxuICBpZiAodXJsc2VjdGlvbikge1xyXG4gICAgdmFyIHB1cCA9IHBvcHVwKGZhcXNCYXNlVXJsICsgdXJsc2VjdGlvbiwgJ2xhcmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgZCA9ICQodXJsKSxcclxuICAgICAgICBwZWwgPSBwdXAuZ2V0Q29udGVudEVsZW1lbnQoKTtcclxuICAgICAgcGVsLnNjcm9sbFRvcChwZWwuc2Nyb2xsVG9wKCkgKyBkLnBvc2l0aW9uKCkudG9wIC0gNTApO1xyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBkLmVmZmVjdChcImhpZ2hsaWdodFwiLCB7fSwgMjAwMCk7XHJcbiAgICAgIH0sIDQwMCk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59IiwiLyogSU5JVCAqL1xyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBMb2NhdGlvbiBqcy1kcm9wZG93blxyXG4gICAgdmFyIHMgPSAkKCcjc2VhcmNoLWxvY2F0aW9uJyk7XHJcbiAgICBzLnByb3AoJ3JlYWRvbmx5JywgdHJ1ZSk7XHJcbiAgICBzLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgc291cmNlOiBMQy5zZWFyY2hMb2NhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgbWluTGVuZ3RoOiAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBzZWxlY3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcy5vbignZm9jdXMgY2xpY2snLCBmdW5jdGlvbiAoKSB7IHMuYXV0b2NvbXBsZXRlKCdzZWFyY2gnLCAnJyk7IH0pO1xyXG5cclxuICAgIC8qIFBvc2l0aW9ucyBhdXRvY29tcGxldGUgKi9cclxuICAgIHZhciBwb3NpdGlvbnNBdXRvY29tcGxldGUgPSAkKCcjc2VhcmNoLXNlcnZpY2UnKS5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAvLyBXZSB3YW50IHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAgICAgICAvLyQodGhpcykudmFsKHVpLml0ZW0ubGFiZWwpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb2N1czogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICAvLyBXZSB3YW50IHRoZSBsYWJlbCBpbiB0ZXh0Ym94LCBub3QgdGhlIHZhbHVlXHJcbiAgICAgICAgICAgIC8vJCh0aGlzKS52YWwodWkuaXRlbS5sYWJlbCk7XHJcbiAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIExvYWQgYWxsIHBvc2l0aW9ucyBpbiBiYWNrZ3JvdW5kIHRvIHJlcGxhY2UgdGhlIGF1dG9jb21wbGV0ZSBzb3VyY2UgKGF2b2lkaW5nIG11bHRpcGxlLCBzbG93IGxvb2stdXBzKVxyXG4gICAgLyokLmdldEpTT04oTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgIHBvc2l0aW9uc0F1dG9jb21wbGV0ZS5hdXRvY29tcGxldGUoJ29wdGlvbicsICdzb3VyY2UnLCBkYXRhKTtcclxuICAgIH1cclxuICAgICk7Ki9cclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIHNvbWUgTGVnYWwgcGFnZXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudClcclxuICAgIC5vbignY2xpY2snLCAnLnZpZXctcHJpdmFjeS1wb2xpY3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcG9wdXAoYmFzZVVybCArICdIZWxwQ2VudGVyLyRQcml2YWN5UG9saWN5LycsICdsYXJnZScpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy52aWV3LXRlcm1zLW9mLXVzZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBwb3B1cChiYXNlVXJsICsgJ0hlbHBDZW50ZXIvJFRlcm1zT2ZVc2UvJywgJ2xhcmdlJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiogUHJvdmlkZXIgV2VsY29tZSBwYWdlXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBTaW1wbGVTbGlkZXIgPSByZXF1aXJlKCdMQy9TaW1wbGVTbGlkZXInKTtcclxuXHJcbmV4cG9ydHMuc2hvdyA9IGZ1bmN0aW9uIHByb3ZpZGVyV2VsY29tZSgpIHtcclxuICAkKCcuUHJvdmlkZXJXZWxjb21lIC5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgdCA9ICQodGhpcyksXHJcbiAgICAgIHNsaWRlciA9IG5ldyBTaW1wbGVTbGlkZXIoe1xyXG4gICAgICAgIGVsZW1lbnQ6IHQsXHJcbiAgICAgICAgc2VsZWN0b3JzOiB7XHJcbiAgICAgICAgICBzbGlkZXM6ICcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1zbGlkZXMnLFxyXG4gICAgICAgICAgc2xpZGU6ICcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1zbGlkZSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGN1cnJlbnRTbGlkZUNsYXNzOiAnanMtaXNDdXJyZW50JyxcclxuICAgICAgICBocmVmUHJlZml4OiAnZ29TbGlkZV8nLFxyXG4gICAgICAgIC8vIER1cmF0aW9uIG9mIGVhY2ggc2xpZGUgaW4gbWlsbGlzZWNvbmRzXHJcbiAgICAgICAgZHVyYXRpb246IDEwMDBcclxuICAgICAgfSk7XHJcblxyXG4gICAgLy8gU2xpZGUgc3RlcHMgYWN0aW9ucyBpbml0aWFsbHkgaGlkZGVuLCB2aXNpYmxlIGFmdGVyICdzdGFydCdcclxuICAgIHZhciBzbGlkZXNBY3Rpb25zID0gdC5maW5kKCcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1hY3Rpb25zLXNsaWRlcycpLmhpZGUoKTtcclxuICAgIHQuZmluZCgnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tYWN0aW9ucy1zdGFydCAuc3RhcnQtYWN0aW9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkKHRoaXMpLmhpZGUoKTtcclxuICAgICAgc2xpZGVzQWN0aW9ucy5mYWRlSW4oMTAwMCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiogV2VsY29tZSBwb3B1cFxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vLyBib290c3RyYXAgdG9vbHRpcHM6XHJcbnJlcXVpcmUoJ2Jvb3RzdHJhcCcpO1xyXG4vL1RPRE8gbW9yZSBkZXBlbmRlbmNpZXM/XHJcblxyXG52YXIgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRXZWxjb21lUG9wdXAoKSB7XHJcblxyXG4gIGV4cG9ydHMuYXV0b1Nob3coKTtcclxuXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2Euc2lnbi11cCwgYS5yZWdpc3RlciwgYS5uZWVkLWxvZ2luLCBidXR0b24ubmVlZC1sb2dpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFJlbW92ZSBhbnkgb3BlbmVkIHBvcHVwIChpdCBvdmVybGF5cyB0aGUgd2VsY29tZXBvcHVwKVxyXG4gICAgJC51bmJsb2NrVUkoKTtcclxuXHJcbiAgICByZXR1cm4gIWV4cG9ydHMuc2hvdygpO1xyXG4gIH0pO1xyXG5cclxufTtcclxuXHJcbmV4cG9ydHMuYXV0b1Nob3cgPSBmdW5jdGlvbiBhdXRvU2hvd1dlbGNvbWVQb3B1cCgpIHtcclxuICB2YXIgJHdwID0gJCgnI3dlbGNvbWVwb3B1cCcpO1xyXG4gIHZhciAkd28gPSAkKCcjd2VsY29tZS1wb3B1cC1vdmVybGF5Jyk7XHJcblxyXG4gIC8vIFdoZW4gdGhlIHBvcHVwIGlzIGludGVncmF0ZWQgaW4gdGhlIHBhZ2UgaW5zdGVhZCBvZlxyXG4gIC8vIHRoZSBsYXlvdXQsIGV4ZWMgc2hvdyBhbmQgY2xvc2Ugb3JwaGFuIG92ZXJsYXkuXHJcbiAgaWYgKCR3cC5sZW5ndGggJiZcclxuICAgICR3cC5pcygnOnZpc2libGUnKSAmJlxyXG4gICAgJHdwLmNsb3Nlc3QoJyN3ZWxjb21lLXBvcHVwLW92ZXJsYXknKS5sZW5ndGggPT09IDApIHtcclxuICAgICR3by5oaWRlKCk7XHJcbiAgICBleHBvcnRzLnNob3coKTtcclxuICAgIHJldHVybjtcclxuICB9IGVsc2UgaWYgKCR3by5oYXNDbGFzcygnYXV0by1zaG93JykpIHtcclxuICAgIGV4cG9ydHMuc2hvdygpO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydHMuc2hvdyA9IGZ1bmN0aW9uIHdlbGNvbWVQb3B1cCgpIHtcclxuICAgIHZhciBjID0gJCgnI3dlbGNvbWVwb3B1cCcpO1xyXG4gICAgaWYgKGMubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgdmFyIG92ZXJsYXkgPSBjLmNsb3Nlc3QoJyN3ZWxjb21lLXBvcHVwLW92ZXJsYXknKTtcclxuICAgIG92ZXJsYXkuZmFkZUluKDMwMCk7XHJcblxyXG4gICAgaWYgKGluaXRpYWxpemVkKSB7XHJcbiAgICAgICAgLy8gUmV0dXJuIHBvcHVwIHRvIHRoZSBmaXJzdCBzdGVwIChjaG9vc2UgcHJvZmlsZSwgIzQ4NikgYW5kIGV4aXQgLWluaXQgaXMgcmVhZHktXHJcbiAgICAgICAgLy8gU2hvdyBmaXJzdCBzdGVwXHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UsIGhlYWRlciAucHJlc2VudGF0aW9uJykuc2hvdygpO1xyXG4gICAgICAgIC8vIEhpZGUgc2Vjb25kIHN0ZXBcclxuICAgICAgICBjLmZpbmQoJy50ZXJtcywgLnByb2ZpbGUtZGF0YScpLmhpZGUoKTtcclxuICAgICAgICAvLyBSZXNldCBoaWRkZW4gZmllbGRzIHBlciBwcm9maWxlLXR5cGVcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGk6bm90KC5wb3NpdGlvbi1kZXNjcmlwdGlvbiknKS5zaG93KCk7XHJcbiAgICAgICAgLy8gUmVzZXQgY2hvb3NlbiBwcm9maWxlLXR5cGVcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgICAvLyBSZXNldCBVUkxzIHBlciBwcm9maWxlLXR5cGVcclxuICAgICAgICBjLmZpbmQoJ2EudGVybXMtb2YtdXNlJykuZGF0YSgndG9vbHRpcC11cmwnLCBmdW5jdGlvbiAoKSB7IHJldHVybiAkKHRoaXMpLmF0dHIoJ2RhdGEtdG9vbHRpcC11cmwnKTsgfSk7XHJcbiAgICAgICAgLy8gUmVzZXQgdmFsaWRhdGlvbiBydWxlc1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaSBpbnB1dDpub3QoW3R5cGU9aGlkZGVuXSknKVxyXG4gICAgICAgIC5hdHRyKCdkYXRhLXZhbCcsIG51bGwpXHJcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZGF0aW9uLWVycm9yJyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cclxuICAgIC8vIGNsb3NlIGJ1dHRvbiBsb2dpYyBhbmQgb25seSB3aGVuIGFzIHBvcHVwIChpdCBoYXMgb3ZlcmxheSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9IGMuZmluZCgnLmNsb3NlLXBvcHVwLCBbaHJlZj1cIiNjbG9zZS1wb3B1cFwiXScpO1xyXG4gICAgaWYgKG92ZXJsYXkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIGNsb3NlQnV0dG9uLmhpZGUoKTtcclxuICAgIGVsc2VcclxuICAgICAgICBjbG9zZUJ1dHRvbi5zaG93KCkub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBvdmVybGF5LmZhZGVPdXQoJ25vcm1hbCcpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgdmFyIHNraXBTdGVwMSA9IGMuaGFzQ2xhc3MoJ3NlbGVjdC1wb3NpdGlvbicpO1xyXG5cclxuICAgIC8vIEluaXRcclxuICAgIGlmICghc2tpcFN0ZXAxKSB7XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhLCAudGVybXMsIC5wb3NpdGlvbi1kZXNjcmlwdGlvbicpLmhpZGUoKTtcclxuICAgIH1cclxuICAgIGMuZmluZCgnZm9ybScpLmdldCgwKS5yZXNldCgpO1xyXG5cclxuICAgIC8vIERlc2NyaXB0aW9uIHNob3ctdXAgb24gYXV0b2NvbXBsZXRlIHZhcmlhdGlvbnNcclxuICAgIHZhciBzaG93UG9zaXRpb25EZXNjcmlwdGlvbiA9IHtcclxuICAgICAgICAvKipcclxuICAgICAgICBTaG93IGRlc2NyaXB0aW9uIGluIGEgdGV4dGFyZWEgdW5kZXIgdGhlIHBvc2l0aW9uIHNpbmd1bGFyLFxyXG4gICAgICAgIGl0cyBzaG93ZWQgb24gZGVtYW5kLlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHRleHRhcmVhOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIGMuZmluZCgnLnBvc2l0aW9uLWRlc2NyaXB0aW9uJylcclxuICAgICAgICAgICAgLnNsaWRlRG93bignZmFzdCcpXHJcbiAgICAgICAgICAgIC5maW5kKCd0ZXh0YXJlYScpLnZhbCh1aS5pdGVtLmRlc2NyaXB0aW9uKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgIFNob3cgZGVzY3JpcHRpb24gaW4gYSB0b29sdGlwIHRoYXQgY29tZXMgZnJvbSB0aGUgcG9zaXRpb24gc2luZ3VsYXJcclxuICAgICAgICBmaWVsZFxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHRvb2x0aXA6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgLy8gSXQgbmVlZHMgdG8gYmUgZGVzdHJveWVkIChubyBwcm9ibGVtIHRoZSBmaXJzdCB0aW1lKVxyXG4gICAgICAgICAgICAvLyB0byBnZXQgaXQgdXBkYXRlZCBvbiBzdWNjZXNpdmUgYXR0ZW1wdHNcclxuICAgICAgICAgICAgdmFyIGVsID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgZWxcclxuICAgICAgICAgICAgLnBvcG92ZXIoJ2Rlc3Ryb3knKVxyXG4gICAgICAgICAgICAucG9wb3Zlcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0RvZXMgdGhpcyBzb3VuZCBsaWtlIHlvdT8nLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogdWkuaXRlbS5kZXNjcmlwdGlvbixcclxuICAgICAgICAgICAgICAgIHRyaWdnZXI6ICdmb2N1cycsXHJcbiAgICAgICAgICAgICAgICBwbGFjZW1lbnQ6ICdsZWZ0J1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAucG9wb3Zlcignc2hvdycpXHJcbiAgICAgICAgICAgIC8vIEhpZGUgb24gcG9zc2libGUgcG9zaXRpb24gbmFtZSBjaGFuZ2UgdG8gYXZvaWQgY29uZnVzaW9uc1xyXG4gICAgICAgICAgICAvLyAod2UgY2FuJ3QgdXNlIG9uLWNoYW5nZSwgbmVlZCB0byBiZSBrZXlwcmVzczsgaXRzIG5hbWVzcGFjZWRcclxuICAgICAgICAgICAgLy8gdG8gbGV0IG9mZiBhbmQgb24gZXZlcnkgdGltZSB0byBhdm9pZCBtdWx0aXBsZSBoYW5kbGVyIHJlZ2lzdHJhdGlvbnMpXHJcbiAgICAgICAgICAgIC5vZmYoJ2tleXByZXNzLmRlc2NyaXB0aW9uLXRvb2x0aXAnKVxyXG4gICAgICAgICAgICAub24oJ2tleXByZXNzLmRlc2NyaXB0aW9uLXRvb2x0aXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBlbC5wb3BvdmVyKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gUmUtZW5hYmxlIGF1dG9jb21wbGV0ZTpcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBjLmZpbmQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpOyB9LCA1MDApO1xyXG4gICAgZnVuY3Rpb24gc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzZWxldENhbGxiYWNrKSB7XHJcbiAgICAgICAgYy5maW5kKCdbbmFtZT1qb2J0aXRsZV0nKS5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgICAgICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgICAgICAgICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgIC8vIE5vIHZhbHVlLCBubyBhY3Rpb24gOihcclxuICAgICAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0udmFsdWUpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGlkICh2YWx1ZSkgaW4gdGhlIGhpZGRlbiBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICBjLmZpbmQoJ1tuYW1lPXBvc2l0aW9uaWRdJykudmFsKHVpLml0ZW0udmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGV0Q2FsbGJhY2suY2FsbCh0aGlzLCBldmVudCwgdWkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgdG8gc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcikgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzaG93UG9zaXRpb25EZXNjcmlwdGlvbi50b29sdGlwKTtcclxuICAgIGMuZmluZCgnI3dlbGNvbWVwb3B1cExvYWRpbmcnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBBY3Rpb25zXHJcbiAgICBjLm9uKCdjaGFuZ2UnLCAnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpOm5vdCguJyArIHRoaXMudmFsdWUgKyAnKScpLmhpZGUoKTtcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSwgaGVhZGVyIC5wcmVzZW50YXRpb24nKS5zbGlkZVVwKCdmYXN0Jyk7XHJcbiAgICAgICAgYy5maW5kKCcudGVybXMsIC5wcm9maWxlLWRhdGEnKS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuICAgICAgICAvLyBUZXJtcyBvZiB1c2UgZGlmZmVyZW50IGZvciBwcm9maWxlIHR5cGVcclxuICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSAnY3VzdG9tZXInKVxyXG4gICAgICAgICAgICBjLmZpbmQoJ2EudGVybXMtb2YtdXNlJykuZGF0YSgndG9vbHRpcC11cmwnLCBudWxsKTtcclxuICAgICAgICAvLyBDaGFuZ2UgZmFjZWJvb2sgcmVkaXJlY3QgbGlua1xyXG4gICAgICAgIHZhciBmYmMgPSBjLmZpbmQoJy5mYWNlYm9vay1jb25uZWN0Jyk7XHJcbiAgICAgICAgdmFyIGFkZFJlZGlyZWN0ID0gJ2N1c3RvbWVycyc7XHJcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gJ3Byb3ZpZGVyJylcclxuICAgICAgICAgICAgYWRkUmVkaXJlY3QgPSAncHJvdmlkZXJzJztcclxuICAgICAgICBmYmMuZGF0YSgncmVkaXJlY3QnLCBmYmMuZGF0YSgncmVkaXJlY3QnKSArIGFkZFJlZGlyZWN0KTtcclxuICAgICAgICBmYmMuZGF0YSgncHJvZmlsZScsIHRoaXMudmFsdWUpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdmFsaWRhdGlvbi1yZXF1aXJlZCBmb3IgZGVwZW5kaW5nIG9mIHByb2ZpbGUtdHlwZSBmb3JtIGVsZW1lbnRzOlxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaS4nICsgdGhpcy52YWx1ZSArICcgaW5wdXQ6bm90KFtkYXRhLXZhbF0pOm5vdChbdHlwZT1oaWRkZW5dKScpXHJcbiAgICAgICAgLmF0dHIoJ2RhdGEtdmFsLXJlcXVpcmVkJywgJycpXHJcbiAgICAgICAgLmF0dHIoJ2RhdGEtdmFsJywgdHJ1ZSk7XHJcbiAgICAgICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgICB9KTtcclxuICAgIGMub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0uYWpheCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBzZXR1cFBvc2l0aW9uQXV0b2NvbXBsZXRlKHNob3dQb3NpdGlvbkRlc2NyaXB0aW9uLnRvb2x0aXApO1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV06Y2hlY2tlZCcpLmNoYW5nZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSWYgcHJvZmlsZSB0eXBlIGlzIHByZWZpbGxlZCBieSByZXF1ZXN0OlxyXG4gICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXTpjaGVja2VkJykuY2hhbmdlKCk7XHJcblxyXG4gICAgLy8gQWxsIGZpbmVcclxuICAgIHJldHVybiB0cnVlO1xyXG59O1xyXG4iLCJcblxuXG4vKlxuKiBAdmVyc2lvbiAgMC41LjBcbiogQGF1dGhvciAgIExhdXJpIFJvb2RlbiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9saXRlanMvZGF0ZS1mb3JtYXQtbGl0ZVxuKiBAbGljZW5zZSAgTUlUIExpY2Vuc2UgIC0gaHR0cDovL2xhdXJpLnJvb2Rlbi5lZS9taXQtbGljZW5zZS50eHRcbiovXG5cblxuXG4hZnVuY3Rpb24oRGF0ZSwgcHJvdG8pIHtcblx0dmFyIG1hc2tSZSA9IC8oW1wiJ10pKCg/OlteXFxcXF18XFxcXC4pKj8pXFwxfFlZWVl8KFtNRF0pXFwzXFwzKFxcMz8pfFNTfChbWU1ESGhtc1ddKShcXDU/KXxbdVVBWlN3b10vZ1xuXHQsIHllYXJGaXJzdFJlID0gLyhcXGR7NH0pWy0uXFwvXShcXGRcXGQ/KVstLlxcL10oXFxkXFxkPykvXG5cdCwgZGF0ZUZpcnN0UmUgPSAvKFxcZFxcZD8pWy0uXFwvXShcXGRcXGQ/KVstLlxcL10oXFxkezR9KS9cblx0LCB0aW1lUmUgPSAvKFxcZFxcZD8pOihcXGRcXGQpOj8oXFxkXFxkKT9cXC4/KFxcZHszfSk/KD86XFxzKig/OihhKXwocCkpXFwuP21cXC4/KT8oXFxzKig/Olp8R01UfFVUQyk/KD86KFstK11cXGRcXGQpOj8oXFxkXFxkKT8pPyk/L2lcblx0LCB3b3JkUmUgPSAvLlthLXpdKy9nXG5cdCwgdW5lc2NhcGVSZSA9IC9cXFxcKC4pL2dcblx0Ly8sIGlzb0RhdGVSZSA9IC8oXFxkezR9KVstLlxcL11XKFxcZFxcZD8pWy0uXFwvXShcXGQpL1xuXHRcblxuXHQvLyBJU08gODYwMSBzcGVjaWZpZXMgbnVtZXJpYyByZXByZXNlbnRhdGlvbnMgb2YgZGF0ZSBhbmQgdGltZS5cblx0Ly9cblx0Ly8gVGhlIGludGVybmF0aW9uYWwgc3RhbmRhcmQgZGF0ZSBub3RhdGlvbiBpc1xuXHQvLyBZWVlZLU1NLUREXG5cdC8vXG5cdC8vIFRoZSBpbnRlcm5hdGlvbmFsIHN0YW5kYXJkIG5vdGF0aW9uIGZvciB0aGUgdGltZSBvZiBkYXkgaXNcblx0Ly8gaGg6bW06c3Ncblx0Ly9cblx0Ly8gVGltZSB6b25lXG5cdC8vXG5cdC8vIFRoZSBzdHJpbmdzICtoaDptbSwgK2hobW0sIG9yICtoaCAoYWhlYWQgb2YgVVRDKVxuXHQvLyAtaGg6bW0sIC1oaG1tLCBvciAtaGggKHRpbWUgem9uZXMgd2VzdCBvZiB0aGUgemVybyBtZXJpZGlhbiwgd2hpY2ggYXJlIGJlaGluZCBVVEMpXG5cdC8vXG5cdC8vIDEyOjAwWiA9IDEzOjAwKzAxOjAwID0gMDcwMC0wNTAwXG5cdFxuXHREYXRlW3Byb3RvXS5mb3JtYXQgPSBmdW5jdGlvbihtYXNrKSB7XG5cdFx0bWFzayA9IERhdGUubWFza3NbbWFza10gfHwgbWFzayB8fCBEYXRlLm1hc2tzW1wiZGVmYXVsdFwiXVxuXG5cdFx0dmFyIHNlbGYgPSB0aGlzXG5cdFx0LCBnZXQgPSBcImdldFwiICsgKG1hc2suc2xpY2UoMCw0KSA9PSBcIlVUQzpcIiA/IChtYXNrPW1hc2suc2xpY2UoNCksIFwiVVRDXCIpOlwiXCIpXG5cblx0XHRyZXR1cm4gbWFzay5yZXBsYWNlKG1hc2tSZSwgZnVuY3Rpb24obWF0Y2gsIHF1b3RlLCB0ZXh0LCBNRCwgTUQ0LCBzaW5nbGUsIHBhZCkge1xuXHRcdFx0dGV4dCA9IHNpbmdsZSA9PSBcIllcIiAgID8gc2VsZltnZXQgKyBcIkZ1bGxZZWFyXCJdKCkgJSAxMDBcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJZWVlZXCIgPyBzZWxmW2dldCArIFwiRnVsbFllYXJcIl0oKVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJNXCIgICA/IHNlbGZbZ2V0ICsgXCJNb250aFwiXSgpKzFcblx0XHRcdFx0IDogTUQgICAgID09IFwiTVwiID8gRGF0ZS5tb250aE5hbWVzWyBzZWxmW2dldCArIFwiTW9udGhcIl0oKSsoTUQ0ID8gMTIgOiAwKSBdXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcIkRcIiAgID8gc2VsZltnZXQgKyBcIkRhdGVcIl0oKVxuXHRcdFx0XHQgOiBNRCAgICAgPT0gXCJEXCIgPyBEYXRlLmRheU5hbWVzWyBzZWxmW2dldCArIFwiRGF5XCJdKCkgKyAoTUQ0ID8gNzowICkgXVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJIXCIgICA/IHNlbGZbZ2V0ICsgXCJIb3Vyc1wiXSgpICUgMTIgfHwgMTJcblx0XHRcdFx0IDogc2luZ2xlID09IFwiaFwiICAgPyBzZWxmW2dldCArIFwiSG91cnNcIl0oKVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJtXCIgICA/IHNlbGZbZ2V0ICsgXCJNaW51dGVzXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwic1wiICAgPyBzZWxmW2dldCArIFwiU2Vjb25kc1wiXSgpXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiU1wiICAgID8gc2VsZltnZXQgKyBcIk1pbGxpc2Vjb25kc1wiXSgpXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiU1NcIiAgID8gKHF1b3RlID0gc2VsZltnZXQgKyBcIk1pbGxpc2Vjb25kc1wiXSgpLCBxdW90ZSA+IDk5ID8gcXVvdGUgOiAocXVvdGUgPiA5ID8gXCIwXCIgOiBcIjAwXCIgKSArIHF1b3RlKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcInVcIiAgICA/IChzZWxmLzEwMDApPj4+MFxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlVcIiAgICA/ICtzZWxmXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiQVwiICAgID8gRGF0ZVtzZWxmW2dldCArIFwiSG91cnNcIl0oKSA+IDExID8gXCJwbVwiIDogXCJhbVwiXVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlpcIiAgICA/IFwiR01UIFwiICsgKC1zZWxmLmdldFRpbWV6b25lT2Zmc2V0KCkvNjApXG5cdFx0XHRcdCA6IG1hdGNoID09IFwid1wiICAgID8gc2VsZltnZXQgKyBcIkRheVwiXSgpIHx8IDdcblx0XHRcdFx0IDogc2luZ2xlID09IFwiV1wiICAgPyAocXVvdGUgPSBuZXcgRGF0ZSgrc2VsZiArICgoNCAtIChzZWxmW2dldCArIFwiRGF5XCJdKCl8fDcpKSAqIDg2NDAwMDAwKSksIE1hdGguY2VpbCgoKHF1b3RlLmdldFRpbWUoKS1xdW90ZVtcInNcIiArIGdldC5zbGljZSgxKSArIFwiTW9udGhcIl0oMCwxKSkgLyA4NjQwMDAwMCArIDEgKSAvIDcpIClcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJvXCIgICAgPyBuZXcgRGF0ZSgrc2VsZiArICgoNCAtIChzZWxmW2dldCArIFwiRGF5XCJdKCl8fDcpKSAqIDg2NDAwMDAwKSlbZ2V0ICsgXCJGdWxsWWVhclwiXSgpXG5cdFx0XHRcdCA6IHF1b3RlICAgICAgICAgICA/IHRleHQucmVwbGFjZSh1bmVzY2FwZVJlLCBcIiQxXCIpXG5cdFx0XHRcdCA6IG1hdGNoXG5cdFx0XHRyZXR1cm4gcGFkICYmIHRleHQgPCAxMCA/IFwiMFwiK3RleHQgOiB0ZXh0XG5cdFx0fSlcblx0fVxuXG5cdERhdGUuYW0gPSBcIkFNXCJcblx0RGF0ZS5wbSA9IFwiUE1cIlxuXG5cdERhdGUubWFza3MgPSB7XCJkZWZhdWx0XCI6XCJEREQgTU1NIEREIFlZWVkgaGg6bW06c3NcIixcImlzb1V0Y0RhdGVUaW1lXCI6J1VUQzpZWVlZLU1NLUREXCJUXCJoaDptbTpzc1wiWlwiJ31cblx0RGF0ZS5tb250aE5hbWVzID0gXCJKYW5GZWJNYXJBcHJNYXlKdW5KdWxBdWdTZXBPY3ROb3ZEZWNKYW51YXJ5RmVicnVhcnlNYXJjaEFwcmlsTWF5SnVuZUp1bHlBdWd1c3RTZXB0ZW1iZXJPY3RvYmVyTm92ZW1iZXJEZWNlbWJlclwiLm1hdGNoKHdvcmRSZSlcblx0RGF0ZS5kYXlOYW1lcyA9IFwiU3VuTW9uVHVlV2VkVGh1RnJpU2F0U3VuZGF5TW9uZGF5VHVlc2RheVdlZG5lc2RheVRodXJzZGF5RnJpZGF5U2F0dXJkYXlcIi5tYXRjaCh3b3JkUmUpXG5cblx0Ly8qL1xuXG5cblx0Lypcblx0KiAvLyBJbiBDaHJvbWUgRGF0ZS5wYXJzZShcIjAxLjAyLjIwMDFcIikgaXMgSmFuXG5cdCogbiA9ICtzZWxmIHx8IERhdGUucGFyc2Uoc2VsZikgfHwgXCJcIitzZWxmO1xuXHQqL1xuXG5cdFN0cmluZ1twcm90b10uZGF0ZSA9IE51bWJlcltwcm90b10uZGF0ZSA9IGZ1bmN0aW9uKGZvcm1hdCkge1xuXHRcdHZhciBtLCB0ZW1wXG5cdFx0LCBkID0gbmV3IERhdGVcblx0XHQsIG4gPSArdGhpcyB8fCBcIlwiK3RoaXNcblxuXHRcdGlmIChpc05hTihuKSkge1xuXHRcdFx0Ly8gQmlnIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSB5ZWFyLCBlZy4gMjAxMS0wMS0zMVxuXHRcdFx0aWYgKG0gPSBuLm1hdGNoKHllYXJGaXJzdFJlKSkgZC5zZXRGdWxsWWVhcihtWzFdLCBtWzJdLTEsIG1bM10pXG5cblx0XHRcdGVsc2UgaWYgKG0gPSBuLm1hdGNoKGRhdGVGaXJzdFJlKSkge1xuXHRcdFx0XHQvLyBNaWRkbGUgZW5kaWFuIGRhdGUsIHN0YXJ0aW5nIHdpdGggdGhlIG1vbnRoLCBlZy4gMDEvMzEvMjAxMVxuXHRcdFx0XHQvLyBMaXR0bGUgZW5kaWFuIGRhdGUsIHN0YXJ0aW5nIHdpdGggdGhlIGRheSwgZWcuIDMxLjAxLjIwMTFcblx0XHRcdFx0dGVtcCA9IERhdGUubWlkZGxlX2VuZGlhbiA/IDEgOiAyXG5cdFx0XHRcdGQuc2V0RnVsbFllYXIobVszXSwgbVt0ZW1wXS0xLCBtWzMtdGVtcF0pXG5cdFx0XHR9XG5cblx0XHRcdC8vIFRpbWVcblx0XHRcdG0gPSBuLm1hdGNoKHRpbWVSZSkgfHwgWzAsIDAsIDBdXG5cdFx0XHRkLnNldEhvdXJzKCBtWzZdICYmIG1bMV0gPCAxMiA/ICttWzFdKzEyIDogbVs1XSAmJiBtWzFdID09IDEyID8gMCA6IG1bMV0sIG1bMl0sIG1bM118MCwgbVs0XXwwKVxuXHRcdFx0Ly8gVGltZXpvbmVcblx0XHRcdGlmIChtWzddKSB7XG5cdFx0XHRcdGQuc2V0VGltZShkLSgoZC5nZXRUaW1lem9uZU9mZnNldCgpICsgKG1bOF18MCkqNjAgKyAoKG1bOF08MD8tMToxKSoobVs5XXwwKSkpKjYwMDAwKSlcblx0XHRcdH1cblx0XHR9IGVsc2UgZC5zZXRUaW1lKCBuIDwgNDI5NDk2NzI5NiA/IG4gKiAxMDAwIDogbiApXG5cdFx0cmV0dXJuIGZvcm1hdCA/IGQuZm9ybWF0KGZvcm1hdCkgOiBkXG5cdH1cblxufShEYXRlLCBcInByb3RvdHlwZVwiKVxuXG5cblxuXG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
