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
},{"./ajaxCallbacks":28,"./blockPresets":45,"./changesNotification":"f5kckb","./popup":78,"./redirectTo":80,"./validationHelper":"kqf9lt"}],"LC/TimeSpan":[function(require,module,exports){
module.exports=require('rqZkA9');
},{}],"rqZkA9":[function(require,module,exports){
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

},{"./TimeSpan":"rqZkA9","./mathUtils":73}],"LC/TimeSpanExtra":[function(require,module,exports){
module.exports=require('5OLBBz');
},{}],27:[function(require,module,exports){
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
},{}],"LC/availabilityCalendar":[function(require,module,exports){
module.exports=require('xu1BAO');
},{}],"xu1BAO":[function(require,module,exports){
/**
  Exposing all the public features and components of availabilityCalendar
**/
exports.Weekly = require('./Weekly');
exports.WorkHours = require('./WorkHours');
exports.Monthly = require('./Monthly');
},{"./Monthly":34,"./Weekly":35,"./WorkHours":36}],42:[function(require,module,exports){
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

},{}],"LC/googleMapReady":[function(require,module,exports){
module.exports=require('ygr/Yz');
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

},{"./loader":72}],59:[function(require,module,exports){
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
},{}],"LC/jqueryUtils":[function(require,module,exports){
module.exports=require('7/CV3J');
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
},{}],"LC/moveFocusTo":[function(require,module,exports){
module.exports=require('9RKOGW');
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
        .on('click', '.close-action', function () { smoothBoxBlock(null, blocked, null, box.data('modal-box-options')); return false; })
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
},{"./autoFocus":31,"./jquery.xtsh":69,"./jqueryUtils":"7/CV3J","./moveFocusTo":"9RKOGW"}],"LC/smoothBoxBlock":[function(require,module,exports){
module.exports=require('KQGzNM');
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

},{"./jquery.isChildOf":66,"./jquery.outerHtml":67,"./sanitizeWhitespaces":81}],"LC/tooltips":[function(require,module,exports){
module.exports=require('UTsC2v');
},{}],86:[function(require,module,exports){
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

function setValidationSummaryAsError(container) {
  var v = findValidationSummary(container);
  v.addClass('validation-summary-errors').removeClass('validation-summary-valid');
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
  return $('[data-valmsg-summary=true]');
}

module.exports = {
    setup: setupValidation,
    setValidationSummaryAsValid: setValidationSummaryAsValid,
    setValidationSummaryAsError: setValidationSummaryAsError,
    goToSummaryErrors: goToSummaryErrors,
    findValidationSummary: findValidationSummary
};
},{}],"LC/validationHelper":[function(require,module,exports){
module.exports=require('kqf9lt');
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

  $(document).on('click', 'a.sign-up, a.register', function () {

    // Remove any opened popup (it overlays the welcomepopup)
    $.unblockUI();

    exports.show();
    return false;
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
  if (c.length === 0) return;

  c.closest('#welcome-popup-overlay').fadeIn(300);

  if (initialized) return;
  initialized = true;

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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0FycmF5LnJlbW92ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9CaW5kYWJsZUNvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9Db21wb25lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ1gvRGF0YVNvdXJjZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9MY1dpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9leHRlbmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ29va2llLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0ZhY2Vib29rQ29ubmVjdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9MY1VybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9QcmljZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9SZWdFeHAucXVvdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU2ltcGxlU2xpZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nRm9ybWF0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmF1dG9sb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguc2xpZGVyVGFicy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC53aXphcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW5FeHRyYS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9VSVNsaWRlckxhYmVscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Q2FsbGJhY2tzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhGb3Jtcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvQ2FsY3VsYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9Gb2N1cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvZmlsbFN1Ym1lbnUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvQm9va2luZ3NOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvTW9udGhseS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9XZWVrbHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvV29ya0hvdXJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2NsZWFyQ3VycmVudFNlbGVjdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9kYXRlVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvZm9ybWF0RGF0ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9tYWtlVW5zZWxlY3RhYmxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL29iamVjdFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL3V0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2Jsb2NrUHJlc2V0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NyZWF0ZUlmcmFtZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlSVNPODYwMS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9nZXRUZXh0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFhQYXRoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dvb2dsZU1hcFJlYWR5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2d1aWRHZW5lcmF0b3IuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvaGFzQ29uZmlybVN1cHBvcnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvaTE4bi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pc0VtcHR5U3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5hcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmJvdW5kcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5pc0NoaWxkT2YuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lm91dGVySHRtbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkucmVsb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS54dHNoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeVV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2xvYWRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tYXRoVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbnVtYmVyVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcGxhY2Vob2xkZXItcG9seWZpbGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Ntb290aEJveEJsb2NrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Rvb2x0aXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3VybFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3ZhbGlkYXRpb25IZWxwZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FjY291bnRQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FwcC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2ZhcXNQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2xlZ2FsUG9wdXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9wcm92aWRlcldlbGNvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3dlbGNvbWVQb3B1cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvbm9kZV9tb2R1bGVzL2RhdGUtZm9ybWF0LWxpdGUvZGF0ZS1mb3JtYXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNyUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQXJyYXkgUmVtb3ZlIC0gQnkgSm9obiBSZXNpZyAoTUlUIExpY2Vuc2VkKVxyXG4vKkFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcclxuSWFnb1NSTDogaXQgc2VlbXMgaW5jb21wYXRpYmxlIHdpdGggTW9kZXJuaXpyIGxvYWRlciBmZWF0dXJlIGxvYWRpbmcgWmVuZGVzayBzY3JpcHQsXHJcbm1vdmVkIGZyb20gcHJvdG90eXBlIHRvIGEgY2xhc3Mtc3RhdGljIG1ldGhvZCAqL1xyXG5mdW5jdGlvbiBhcnJheVJlbW92ZShhbkFycmF5LCBmcm9tLCB0bykge1xyXG4gICAgdmFyIHJlc3QgPSBhbkFycmF5LnNsaWNlKCh0byB8fCBmcm9tKSArIDEgfHwgYW5BcnJheS5sZW5ndGgpO1xyXG4gICAgYW5BcnJheS5sZW5ndGggPSBmcm9tIDwgMCA/IGFuQXJyYXkubGVuZ3RoICsgZnJvbSA6IGZyb207XHJcbiAgICByZXR1cm4gYW5BcnJheS5wdXNoLmFwcGx5KGFuQXJyYXksIHJlc3QpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXJyYXlSZW1vdmU7XHJcbn0gZWxzZSB7XHJcbiAgICBBcnJheS5yZW1vdmUgPSBhcnJheVJlbW92ZTtcclxufSIsIi8qKlxyXG4gIEJpbmRhYmxlIFVJIENvbXBvbmVudC5cclxuICBJdCByZWxpZXMgb24gQ29tcG9uZW50IGJ1dCBhZGRzIERhdGFTb3VyY2UgY2FwYWJpbGl0aWVzXHJcbioqL1xyXG52YXIgRGF0YVNvdXJjZSA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZScpO1xyXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9Db21wb25lbnQnKTtcclxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4vZXh0ZW5kJyk7XHJcbnZhciBtZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XHJcblxyXG4vKipcclxuUmV1c2luZyB0aGUgb3JpZ2luYWwgZmV0Y2hEYXRhIG1ldGhvZCBidXQgYWRkaW5nIGNsYXNzZXMgdG8gb3VyXHJcbmNvbXBvbmVudCBlbGVtZW50IGZvciBhbnkgdmlzdWFsIG5vdGlmaWNhdGlvbiBvZiB0aGUgZGF0YSBsb2FkaW5nLlxyXG5NZXRob2QgZ2V0IGV4dGVuZGVkIHdpdGggaXNQcmVmZXRjaGluZyBtZXRob2QgZm9yIGRpZmZlcmVudFxyXG5jbGFzc2VzL25vdGlmaWNhdGlvbnMgZGVwZW5kYW50IG9uIHRoYXQgZmxhZywgYnkgZGVmYXVsdCBmYWxzZTpcclxuKiovXHJcbnZhciBjb21wb25lbnRGZXRjaERhdGEgPSBmdW5jdGlvbiBiaW5kYWJsZUNvbXBvbmVudEZldGNoRGF0YShxdWVyeURhdGEsIG1vZGUsIGlzUHJlZmV0Y2hpbmcpIHtcclxuICB2YXIgY2wgPSBpc1ByZWZldGNoaW5nID8gdGhpcy5jbGFzc2VzLnByZWZldGNoaW5nIDogdGhpcy5jbGFzc2VzLmZldGNoaW5nO1xyXG4gIHRoaXMuJGVsLmFkZENsYXNzKGNsKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHZhciByZXEgPSBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaERhdGEuY2FsbCh0aGlzLCBxdWVyeURhdGEsIG1vZGUpXHJcbiAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC4kZWwucmVtb3ZlQ2xhc3MoY2wgfHwgJ18nKTtcclxuICAgIC8vIFVubWFyayBhbnkgcG9zaWJsZSBwcmV2aW91cyBlcnJvciBzaW5jZSB3ZSBoYWQgYSBzdWNjZXMgbG9hZDpcclxuICAgIHRoYXQuaGFzRXJyb3IoZmFsc2UpO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gcmVxO1xyXG59O1xyXG4vKipcclxuUmVwbGFjaW5nLCBidXQgcmV1c2luZyBpbnRlcm5hbHMsIHRoZSBkZWZhdWx0IG9uZXJyb3IgY2FsbGJhY2sgZm9yIHRoZVxyXG5mZXRjaERhdGEgZnVuY3Rpb24gdG8gYWRkIG5vdGlmaWNhdGlvbiBjbGFzc2VzIHRvIG91ciBjb21wb25lbnQgbW9kZWxcclxuKiovXHJcbmNvbXBvbmVudEZldGNoRGF0YS5vbmVycm9yID0gZnVuY3Rpb24gYmluZGFibGVDb21wb25lbnRGZWNoRGF0YU9uZXJyb3IoeCwgcywgZSkge1xyXG4gIERhdGFTb3VyY2UucHJvdG90eXBlLmZldGNoRGF0YS5vbmVycm9yLmNhbGwodGhpcywgeCwgcywgZSk7XHJcbiAgLy8gUmVtb3ZlIGZldGNoaW5nIGNsYXNzZXM6XHJcbiAgdGhpcy4kZWxcclxuICAucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJylcclxuICAucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnByZWZldGNoaW5nIHx8ICdfJyk7XHJcbiAgLy8gTWFyayBlcnJvcjpcclxuICB0aGlzLmhhc0Vycm9yKHsgbmFtZTogJ2ZldGNoRGF0YUVycm9yJywgcmVxdWVzdDogeCwgc3RhdHVzOiBzLCBleGNlcHRpb246IGUgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICBCaW5kYWJsZUNvbXBvbmVudCBjbGFzc1xyXG4qKi9cclxudmFyIEJpbmRhYmxlQ29tcG9uZW50ID0gQ29tcG9uZW50LmV4dGVuZChcclxuICBEYXRhU291cmNlLnByb3RvdHlwZSxcclxuICAvLyBQcm90b3R5cGVcclxuICB7XHJcbiAgICBjbGFzc2VzOiB7XHJcbiAgICAgIGZldGNoaW5nOiAnaXMtbG9hZGluZycsXHJcbiAgICAgIHByZWZldGNoaW5nOiAnaXMtcHJlbG9hZGluZycsXHJcbiAgICAgIGRpc2FibGVkOiAnaXMtZGlzYWJsZWQnLFxyXG4gICAgICBoYXNEYXRhRXJyb3I6ICdoYXMtZGF0YUVycm9yJ1xyXG4gICAgfSxcclxuICAgIGZldGNoRGF0YTogY29tcG9uZW50RmV0Y2hEYXRhLFxyXG4gICAgLy8gV2hhdCBhdHRyaWJ1dGUgbmFtZSB1c2UgdG8gbWFyayBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbXBvbmVudFxyXG4gICAgLy8gd2l0aCB0aGUgcHJvcGVydHkgZnJvbSB0aGUgc291cmNlIHRvIGJpbmQuXHJcbiAgICAvLyBUaGUgcHJlZml4ICdkYXRhLScgaW4gY3VzdG9tIGF0dHJpYnV0ZXMgaXMgcmVxdWlyZWQgYnkgaHRtbDUsXHJcbiAgICAvLyBqdXN0IHNwZWNpZnkgdGhlIHNlY29uZCBwYXJ0LCBiZWluZyAnYmluZCcgdGhlIGF0dHJpYnV0ZVxyXG4gICAgLy8gbmFtZSB0byB1c2UgaXMgJ2RhdGEtYmluZCdcclxuICAgIGRhdGFCaW5kQXR0cmlidXRlOiAnYmluZCcsXHJcbiAgICAvLyBEZWZhdWx0IGJpbmREYXRhIGltcGxlbWVudGF0aW9uLCBjYW4gYmUgcmVwbGFjZSBvbiBleHRlbmRlZCBjb21wb25lbnRzXHJcbiAgICAvLyB0byBzb21ldGhpbmcgbW9yZSBjb21wbGV4IChsaXN0L2NvbGxlY3Rpb25zLCBzdWItb2JqZWN0cywgY3VzdG9tIHN0cnVjdHVyZXNcclxuICAgIC8vIGFuZCB2aXN1YWxpemF0aW9uIC0ta2VlcCBhcyBwb3NzaWJsZSB0aGUgdXNlIG9mIGRhdGFCaW5kQXR0cmlidXRlIGZvciByZXVzYWJsZSBjb2RlKS5cclxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gd29ya3MgZmluZSBmb3IgZGF0YSBhcyBwbGFpbiBvYmplY3Qgd2l0aCBcclxuICAgIC8vIHNpbXBsZSB0eXBlcyBhcyBwcm9wZXJ0aWVzIChub3Qgb2JqZWN0cyBvciBhcnJheXMgaW5zaWRlIHRoZW0pLlxyXG4gICAgYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhKCkge1xyXG4gICAgICBpZiAoIXRoaXMuZGF0YSkgcmV0dXJuO1xyXG4gICAgICAvLyBDaGVjayBldmVyeSBlbGVtZW50IGluIHRoZSBjb21wb25lbnQgd2l0aCBhIGJpbmRcclxuICAgICAgLy8gcHJvcGVydHkgYW5kIHVwZGF0ZSBpdCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGF0IHByb3BlcnR5XHJcbiAgICAgIC8vIGZyb20gdGhlIGRhdGEgc291cmNlXHJcbiAgICAgIHZhciBhdHQgPSB0aGlzLmRhdGFCaW5kQXR0cmlidXRlO1xyXG4gICAgICB2YXIgYXR0clNlbGVjdG9yID0gJ1tkYXRhLScgKyBhdHQgKyAnXSc7XHJcbiAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgdGhpcy4kZWwuZmluZChhdHRyU2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyksXHJcbiAgICAgICAgICBwcm9wID0gJHQuZGF0YShhdHQpLFxyXG4gICAgICAgICAgYmluZGVkVmFsdWUgPSB0aGF0LmRhdGFbcHJvcF07XHJcblxyXG4gICAgICAgIGlmICgkdC5pcygnOmlucHV0JykpXHJcbiAgICAgICAgICAkdC52YWwoYmluZGVkVmFsdWUpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICR0LnRleHQoYmluZGVkVmFsdWUpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAgSXQgZ2V0cyB0aGUgbGF0ZXN0IGVycm9yIGhhcHBlbmVkIGluIHRoZSBjb21wb25lbnQgKG9yIG51bGwvZmFsc3kgaWYgdGhlcmUgaXMgbm8pLFxyXG4gICAgICBvciBzZXRzIHRoZSBlcnJvciAocGFzc2luZyBpdCBpbiB0aGUgb3B0aW9uYWwgdmFsdWUpIHJldHVybmluZyB0aGUgcHJldmlvdXMgcmVnaXN0ZXJlZCBlcnJvci5cclxuICAgICAgSXRzIHJlY29tbWVuZGVkIGFuIG9iamVjdCBhcyBlcnJvciBpbnN0ZWFkIG9mIGEgc2ltcGxlIHZhbHVlIG9yIHN0cmluZyAodGhhdCBjYW4gZ2V0IGNvbmZ1c2VkXHJcbiAgICAgIHdpdGggZmFsc3kgaWYgaXMgZW1wdHkgc3RyaW5nIG9yIDAsIGFuZCBhbGxvdyBhdHRhY2ggbW9yZSBzdHJ1Y3R1cmVkIGluZm9ybWF0aW9uKSB3aXRoIGFuXHJcbiAgICAgIGluZm9ybWF0aW9uYWwgcHJvcGVydHkgJ25hbWUnLlxyXG4gICAgICBUbyBzZXQgb2ZmIHRoZSBlcnJvciwgcGFzcyBudWxsIHZhbHVlIG9yIGZhbHNlLlxyXG4gICAgKiovXHJcbiAgICBoYXNFcnJvcjogZnVuY3Rpb24gaGFzRXJyb3IoZXJyb3JUb1NldCkge1xyXG4gICAgICBpZiAodHlwZW9mIChlcnJvclRvU2V0KSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9lcnJvciB8fCBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBwcmV2ID0gdGhpcy5fZXJyb3IgfHwgbnVsbDtcclxuICAgICAgdGhpcy5fZXJyb3IgPSBlcnJvclRvU2V0O1xyXG4gICAgICB0aGlzLmV2ZW50cy5lbWl0KCdoYXNFcnJvckNoYW5nZWQnLCBlcnJvclRvU2V0LCBwcmV2KTtcclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9XHJcbiAgfSxcclxuICAvLyBDb25zdHJ1Y3RvclxyXG4gIGZ1bmN0aW9uIEJpbmRhYmxlQ29tcG9uZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIENvbXBvbmVudC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgXHJcbiAgICAvLyBJdCBoYXMgYW4gZXZlbnQgZW1pdHRlcjpcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IG1ldmVudHMuRXZlbnRFbWl0dGVyKCk7XHJcbiAgICAvLyBFdmVudHMgb2JqZWN0IGhhcyBhIHByb3BlcnR5IHRvIGFjY2VzcyB0aGlzIG9iamVjdCxcclxuICAgIC8vIHVzZWZ1bGwgdG8gcmVmZXJlbmNlIGFzICd0aGlzLmNvbXBvbmVudCcgZnJvbSBpbnNpZGVcclxuICAgIC8vIGV2ZW50IGhhbmRsZXJzOlxyXG4gICAgdGhpcy5ldmVudHMuY29tcG9uZW50ID0gdGhpcztcclxuXHJcbiAgICB0aGlzLmRhdGEgPSB0aGlzLiRlbC5kYXRhKCdzb3VyY2UnKSB8fCB0aGlzLmRhdGEgfHwge307XHJcbiAgICBpZiAodHlwZW9mICh0aGlzLmRhdGEpID09ICdzdHJpbmcnKVxyXG4gICAgICB0aGlzLmRhdGEgPSBKU09OLnBhcnNlKHRoaXMuZGF0YSk7XHJcblxyXG4gICAgLy8gT24gaHRtbCBzb3VyY2UgdXJsIGNvbmZpZ3VyYXRpb246XHJcbiAgICB0aGlzLnVybCA9IHRoaXMuJGVsLmRhdGEoJ3NvdXJjZS11cmwnKSB8fCB0aGlzLnVybDtcclxuXHJcbiAgICAvLyBDbGFzc2VzIG9uIGZldGNoRGF0YUVycm9yXHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICB0aGlzLmV2ZW50cy5vbignaGFzRXJyb3JDaGFuZ2VkJywgZnVuY3Rpb24gKGVyciwgcHJldkVycikge1xyXG4gICAgICBpZiAoZXJyICYmIGVyci5uYW1lID09ICdmZXRjaERhdGFFcnJvcicpIHtcclxuICAgICAgICB0aGF0LiRlbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuaGFzRGF0YUVycm9yKTtcclxuICAgICAgfSBlbHNlIGlmIChwcmV2RXJyICYmIHByZXZFcnIubmFtZSA9PSAnZmV0Y2hEYXRhRXJyb3InKSB7XHJcbiAgICAgICAgdGhhdC4kZWwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLmhhc0RhdGFFcnJvciB8fCAnXycpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBUT0RPOiAnY2hhbmdlJyBldmVudCBoYW5kbGVycyBvbiBmb3JtcyB3aXRoIGRhdGEtYmluZCB0byB1cGRhdGUgaXRzIHZhbHVlIGF0IHRoaXMuZGF0YVxyXG4gICAgLy8gVE9ETzogYXV0byAnYmluZERhdGEnIG9uIGZldGNoRGF0YSBlbmRzPyBjb25maWd1cmFibGUsIGJpbmREYXRhTW9kZXsgaW5tZWRpYXRlLCBub3RpZnkgfVxyXG4gIH1cclxuKTtcclxuXHJcbi8vIFB1YmxpYyBtb2R1bGU6XHJcbm1vZHVsZS5leHBvcnRzID0gQmluZGFibGVDb21wb25lbnQ7IiwiLyoqIENvbXBvbmVudCBjbGFzczogd3JhcHBlciBmb3JcclxuICB0aGUgbG9naWMgYW5kIGJlaGF2aW9yIGFyb3VuZFxyXG4gIGEgRE9NIGVsZW1lbnRcclxuKiovXHJcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpO1xyXG5cclxuZnVuY3Rpb24gQ29tcG9uZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICB0aGlzLmVsID0gZWxlbWVudDtcclxuICB0aGlzLiRlbCA9ICQoZWxlbWVudCk7XHJcbiAgZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIC8vIFVzZSB0aGUgalF1ZXJ5ICdkYXRhJyBzdG9yYWdlIHRvIHByZXNlcnZlIGEgcmVmZXJlbmNlXHJcbiAgLy8gdG8gdGhpcyBpbnN0YW5jZSAodXNlZnVsIHRvIHJldHJpZXZlIGl0IGZyb20gZG9jdW1lbnQpXHJcbiAgdGhpcy4kZWwuZGF0YSgnY29tcG9uZW50JywgdGhpcyk7XHJcbn1cclxuXHJcbmV4dGVuZC5wbHVnSW4oQ29tcG9uZW50KTtcclxuZXh0ZW5kLnBsdWdJbihDb21wb25lbnQucHJvdG90eXBlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50OyIsIi8qKlxyXG4gIERhdGFTb3VyY2UgY2xhc3MgdG8gc2ltcGxpZnkgZmV0Y2hpbmcgZGF0YSBhcyBKU09OXHJcbiAgdG8gZmlsbCBhIGxvY2FsIGNhY2hlLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGZldGNoSlNPTiA9ICQuZ2V0SlNPTixcclxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICQuZXh0ZW5kLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpOyB9O1xyXG5cclxuLy8gVE9ETzogcmVwbGFjZSBlYWNoIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyBieSBpbnN0YW5jZSBwcm9wZXJ0aWVzLCBzaW5jZSB0aGF0IHByb3BlcnRpZXMgYmVjb21lXHJcbi8vIHNoYXJlZCBiZXR3ZWVuIGluc3RhbmNlcyBhbmQgaXMgbm90IHdhbnRlZFxyXG5cclxudmFyIHJlcU1vZGVzID0gRGF0YVNvdXJjZS5yZXF1ZXN0TW9kZXMgPSB7XHJcbiAgLy8gUGFyYWxsZWwgcmVxdWVzdCwgbm8gbWF0dGVyIG9mIG90aGVyc1xyXG4gIG11bHRpcGxlOiAwLFxyXG4gIC8vIFdpbGwgYXZvaWQgYSByZXF1ZXN0IGlmIHRoZXJlIGlzIG9uZSBydW5uaW5nXHJcbiAgc2luZ2xlOiAxLFxyXG4gIC8vIExhdGVzdCByZXF1ZXQgd2lsbCByZXBsYWNlIGFueSBwcmV2aW91cyBvbmUgKHByZXZpb3VzIHdpbGwgYWJvcnQpXHJcbiAgcmVwbGFjZTogMlxyXG59O1xyXG5cclxudmFyIHVwZE1vZGVzID0gRGF0YVNvdXJjZS51cGRhdGVNb2RlcyA9IHtcclxuICAvLyBFdmVyeSBuZXcgZGF0YSB1cGRhdGUsIG5ldyBjb250ZW50IGlzIGFkZGVkIGluY3JlbWVudGFsbHlcclxuICAvLyAob3ZlcndyaXRlIGNvaW5jaWRlbnQgY29udGVudCwgYXBwZW5kIG5ldyBjb250ZW50LCBvbGQgY29udGVudFxyXG4gIC8vIGdldCBpbiBwbGFjZSlcclxuICBpbmNyZW1lbnRhbDogMCxcclxuICAvLyBPbiBuZXcgZGF0YSB1cGRhdGUsIG5ldyBkYXRhIHRvdGFsbHkgcmVwbGFjZSB0aGUgcHJldmlvdXMgb25lXHJcbiAgcmVwbGFjZW1lbnQ6IDFcclxufTtcclxuXHJcbi8qKlxyXG5VcGRhdGUgdGhlIGRhdGEgc3RvcmUgb3IgY2FjaGUgd2l0aCB0aGUgZ2l2ZW4gb25lLlxyXG5UaGVyZSBhcmUgZGlmZmVyZW50IG1vZGVzLCB0aGlzIG1hbmFnZXMgdGhhdCBsb2dpYyBhbmRcclxuaXRzIG93biBjb25maWd1cmF0aW9uLlxyXG5JcyBkZWNvdXBsZWQgZnJvbSB0aGUgcHJvdG90eXBlIGJ1dFxyXG5pdCB3b3JrcyBvbmx5IGFzIHBhcnQgb2YgYSBEYXRhU291cmNlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGF0YShkYXRhLCBtb2RlKSB7XHJcbiAgc3dpdGNoIChtb2RlIHx8IHRoaXMudXBkYXRlRGF0YS5kZWZhdWx0VXBkYXRlTW9kZSkge1xyXG5cclxuICAgIGNhc2UgdXBkTW9kZXMucmVwbGFjZW1lbnQ6XHJcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIC8vY2FzZSB1cGRNb2Rlcy5pbmNyZW1lbnRhbDogIFxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgLy8gSW4gY2FzZSBpbml0aWFsIGRhdGEgaXMgbnVsbCwgYXNzaWduIHRoZSByZXN1bHQgdG8gaXRzZWxmOlxyXG4gICAgICB0aGlzLmRhdGEgPSBleHRlbmQodGhpcy5kYXRhLCBkYXRhKTtcclxuICAgICAgYnJlYWs7XHJcbiAgfVxyXG59XHJcblxyXG4vKiogRGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGNvbmZpZ3VyYWJsZSB1cGRhdGUgbW9kZTpcclxuKiovXHJcbnVwZGF0ZURhdGEuZGVmYXVsdFVwZGF0ZU1vZGUgPSB1cGRNb2Rlcy5pbmNyZW1lbnRhbDtcclxuXHJcbi8qKlxyXG5GZXRjaCB0aGUgZGF0YSBmcm9tIHRoZSBzZXJ2ZXIuXHJcbkhlcmUgaXMgZGVjb3VwbGVkIGZyb20gdGhlIHJlc3Qgb2YgdGhlIHByb3RvdHlwZSBmb3JcclxuY29tbW9kaXR5LCBidXQgaXQgY2FuIHdvcmtzIG9ubHkgYXMgcGFydCBvZiBhIERhdGFTb3VyY2UgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiBmZXRjaERhdGEocXVlcnksIG1vZGUpIHtcclxuICBxdWVyeSA9IGV4dGVuZCh7fSwgdGhpcy5xdWVyeSwgcXVlcnkpO1xyXG4gIHN3aXRjaCAobW9kZSB8fCB0aGlzLmZldGNoRGF0YS5kZWZhdWx0UmVxdWVzdE1vZGUpIHtcclxuXHJcbiAgICBjYXNlIHJlcU1vZGVzLnNpbmdsZTpcclxuICAgICAgaWYgKHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCkgcmV0dXJuIG51bGw7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgcmVxTW9kZXMucmVwbGFjZTpcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0c1tpXS5hYm9ydCgpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7IH1cclxuICAgICAgICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cyA9IFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIC8vIEp1c3QgZG8gbm90aGluZyBmb3IgbXVsdGlwbGUgb3IgZGVmYXVsdCAgICAgXHJcbiAgICAvL2Nhc2UgcmVxTW9kZXMubXVsdGlwbGU6ICBcclxuICAgIC8vZGVmYXVsdDogXHJcbiAgfVxyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdmFyIHJlcSA9IHRoaXMuZmV0Y2hEYXRhLnByb3h5KFxyXG4gICAgdGhpcy51cmwsXHJcbiAgICBxdWVyeSxcclxuICAgIGZ1bmN0aW9uIChkYXRhLCB0LCB4aHIpIHtcclxuICAgICAgdmFyIHJldCA9IHRoYXQudXBkYXRlRGF0YShkYXRhKTtcclxuICAgICAgdGhhdC5mZXRjaERhdGEucmVxdWVzdHMuc3BsaWNlKHRoYXQuZmV0Y2hEYXRhLnJlcXVlc3RzLmluZGV4T2YocmVxKSwgMSk7XHJcbiAgICAgIC8vZGVsZXRlIGZldGNoRGF0YS5yZXF1ZXN0c1tmZXRjaERhdGEucmVxdWVzdHMuaW5kZXhPZihyZXEpXTtcclxuXHJcbiAgICAgIGlmIChyZXQgJiYgcmV0Lm5hbWUpIHtcclxuICAgICAgICAvLyBVcGRhdGUgZGF0YSBlbWl0cyBlcnJvciwgdGhlIEFqYXggc3RpbGwgcmVzb2x2ZXMgYXMgJ3N1Y2Nlc3MnIGJlY2F1c2Ugb2YgdGhlIHJlcXVlc3QsIGJ1dFxyXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gZXhlY3V0ZSB0aGUgZXJyb3IsIGJ1dCB3ZSBwaXBlIGl0IHRvIGVuc3VyZSBpcyBkb25lIGFmdGVyIG90aGVyICdkb25lJyBjYWxsYmFja3NcclxuICAgICAgICByZXEuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHRoYXQuZmV0Y2hEYXRhLm9uZXJyb3IuY2FsbCh0aGF0LCBudWxsLCByZXQubmFtZSwgcmV0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuICApXHJcbiAgLmZhaWwoJC5wcm94eSh0aGlzLmZldGNoRGF0YS5vbmVycm9yLCB0aGlzKSk7XHJcbiAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMucHVzaChyZXEpO1xyXG5cclxuICByZXR1cm4gcmVxO1xyXG59XHJcblxyXG4vLyBEZWZhdWx0cyBmZXRjaERhdGEgcHJvcGVydGllcywgdGhleSBhcmUgZGVjb3VwbGVkIHRvIGFsbG93XHJcbi8vIHJlcGxhY2VtZW50LCBhbmQgaW5zaWRlIHRoZSBmZXRjaERhdGEgZnVuY3Rpb24gdG8gZG9uJ3RcclxuLy8gY29udGFtaW5hdGUgdGhlIG9iamVjdCBuYW1lc3BhY2UuXHJcblxyXG4vKiBDb2xsZWN0aW9uIG9mIGFjdGl2ZSAoZmV0Y2hpbmcpIHJlcXVlc3RzIHRvIHRoZSBzZXJ2ZXJcclxuKi9cclxuZmV0Y2hEYXRhLnJlcXVlc3RzID0gW107XHJcblxyXG4vKiBEZWNvdXBsZWQgZnVuY3Rpb25hbGl0eSB0byBwZXJmb3JtIHRoZSBBamF4IG9wZXJhdGlvbixcclxudGhpcyBhbGxvd3Mgb3ZlcndyaXRlIHRoaXMgYmVoYXZpb3IgdG8gaW1wbGVtZW50IGFub3RoZXJcclxud2F5cywgbGlrZSBhIG5vbi1qUXVlcnkgaW1wbGVtZW50YXRpb24sIGEgcHJveHkgdG8gZmFrZSBzZXJ2ZXJcclxuZm9yIHRlc3Rpbmcgb3IgcHJveHkgdG8gbG9jYWwgc3RvcmFnZSBpZiBvbmxpbmUsIGV0Yy5cclxuSXQgbXVzdCByZXR1cm5zIHRoZSB1c2VkIHJlcXVlc3Qgb2JqZWN0LlxyXG4qL1xyXG5mZXRjaERhdGEucHJveHkgPSBmZXRjaEpTT047XHJcblxyXG4vKiBCeSBkZWZhdWx0LCBmZXRjaERhdGEgYWxsb3dzIG11bHRpcGxlIHNpbXVsdGFuZW9zIGNvbm5lY3Rpb24sXHJcbnNpbmNlIHRoZSBzdG9yYWdlIGJ5IGRlZmF1bHQgYWxsb3dzIGluY3JlbWVudGFsIHVwZGF0ZXMgcmF0aGVyXHJcbnRoYW4gcmVwbGFjZW1lbnRzLlxyXG4qL1xyXG5mZXRjaERhdGEuZGVmYXVsdFJlcXVlc3RNb2RlID0gcmVxTW9kZXMubXVsdGlwbGU7XHJcblxyXG4vKiBEZWZhdWx0IG5vdGlmaWNhdGlvbiBvZiBlcnJvciBvbiBmZXRjaGluZywganVzdCBsb2dnaW5nLFxyXG5jYW4gYmUgcmVwbGFjZWQuXHJcbkl0IHJlY2VpdmVzIHRoZSByZXF1ZXN0IG9iamVjdCwgc3RhdHVzIGFuZCBlcnJvci5cclxuKi9cclxuZmV0Y2hEYXRhLm9uZXJyb3IgPSBmdW5jdGlvbiBlcnJvcih4LCBzLCBlKSB7XHJcbiAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignRmV0Y2ggZGF0YSBlcnJvciAlbycsIGUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgRGF0YVNvdXJjZSBjbGFzc1xyXG4qKi9cclxuLy8gQ29uc3RydWN0b3I6IGV2ZXJ5dGhpbmcgaXMgaW4gdGhlIHByb3RvdHlwZS5cclxuZnVuY3Rpb24gRGF0YVNvdXJjZSgpIHsgfVxyXG5EYXRhU291cmNlLnByb3RvdHlwZSA9IHtcclxuICBkYXRhOiBudWxsLFxyXG4gIHVybDogJy8nLFxyXG4gIC8vIHF1ZXJ5OiBvYmplY3Qgd2l0aCBkZWZhdWx0IGV4dHJhIGluZm9ybWF0aW9uIHRvIGFwcGVuZCB0byB0aGUgdXJsXHJcbiAgLy8gd2hlbiBmZXRjaGluZyBkYXRhLCBleHRlbmRlZCB3aXRoIHRoZSBleHBsaWNpdCBxdWVyeSBzcGVjaWZpZWRcclxuICAvLyBleGVjdXRpbmcgZmV0Y2hEYXRhKHF1ZXJ5KVxyXG4gIHF1ZXJ5OiB7fSxcclxuICB1cGRhdGVEYXRhOiB1cGRhdGVEYXRhLFxyXG4gIGZldGNoRGF0YTogZmV0Y2hEYXRhXHJcbiAgLy8gVE9ETyAgcHVzaERhdGE6IGZ1bmN0aW9uKCl7IHBvc3QvcHV0IHRoaXMuZGF0YSB0byB1cmwgIH1cclxufTtcclxuXHJcbi8vIENsYXNzIGFzIHB1YmxpYyBtb2R1bGU6XHJcbm1vZHVsZS5leHBvcnRzID0gRGF0YVNvdXJjZTsiLCIvKipcclxuICBMb2Nvbm9taWNzIHNwZWNpZmljIFdpZGdldCBiYXNlZCBvbiBCaW5kYWJsZUNvbXBvbmVudC5cclxuICBKdXN0IGRlY291cGxpbmcgc3BlY2lmaWMgYmVoYXZpb3JzIGZyb20gc29tZXRoaW5nIG1vcmUgZ2VuZXJhbFxyXG4gIHRvIGVhc2lseSB0cmFjayB0aGF0IGRldGFpbHMsIGFuZCBtYXliZSBmdXR1cmUgbWlncmF0aW9ucyB0b1xyXG4gIG90aGVyIGZyb250LWVuZCBmcmFtZXdvcmtzLlxyXG4qKi9cclxudmFyIERhdGFTb3VyY2UgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2UnKTtcclxudmFyIEJpbmRhYmxlQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9CaW5kYWJsZUNvbXBvbmVudCcpO1xyXG5cclxudmFyIExjV2lkZ2V0ID0gQmluZGFibGVDb21wb25lbnQuZXh0ZW5kKFxyXG4gIC8vIFByb3RvdHlwZVxyXG4gIHtcclxuICAgIC8vIFJlcGxhY2luZyB1cGRhdGVEYXRhIHRvIGltcGxlbWVudCB0aGUgcGFydGljdWxhclxyXG4gICAgLy8gSlNPTiBzY2hlbWUgb2YgTG9jb25vbWljcywgYnV0IHJldXNpbmcgb3JpZ2luYWxcclxuICAgIC8vIGxvZ2ljIGluaGVyaXQgZnJvbSBEYXRhU291cmNlXHJcbiAgICB1cGRhdGVEYXRhOiBmdW5jdGlvbiAoZGF0YSwgbW9kZSkge1xyXG4gICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICBEYXRhU291cmNlLnByb3RvdHlwZS51cGRhdGVEYXRhLmNhbGwodGhpcywgZGF0YS5SZXN1bHQsIG1vZGUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEVycm9yIG1lc3NhZ2UgaW4gdGhlIEpTT05cclxuICAgICAgICByZXR1cm4geyBuYW1lOiAnZGF0YS1mb3JtYXQnLCBtZXNzYWdlOiBkYXRhLlJlc3VsdCA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA6IGRhdGEuUmVzdWx0IDogXCJ1bmtub3dcIiB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICAvLyBDb25zdHJ1Y3RvclxyXG4gIGZ1bmN0aW9uIExjV2lkZ2V0KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIEJpbmRhYmxlQ29tcG9uZW50LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgfVxyXG4pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1dpZGdldDsiLCIvKipcclxuICBEZWVwIEV4dGVuZCBvYmplY3QgdXRpbGl0eSwgaXMgcmVjdXJzaXZlIHRvIGdldCBhbGwgdGhlIGRlcHRoXHJcbiAgYnV0IG9ubHkgZm9yIHRoZSBwcm9wZXJ0aWVzIG93bmVkIGJ5IHRoZSBvYmplY3QsXHJcbiAgaWYgeW91IG5lZWQgdGhlIG5vbi1vd25lZCBwcm9wZXJ0aWVzIHRvIGluIHRoZSBvYmplY3QsXHJcbiAgY29uc2lkZXIgZXh0ZW5kIGZyb20gdGhlIHNvdXJjZSBwcm90b3R5cGUgdG9vIChhbmQgbWF5YmUgdG9cclxuICB0aGUgZGVzdGluYXRpb24gcHJvdG90eXBlIGluc3RlYWQgb2YgdGhlIGluc3RhbmNlLCBidXQgdXAgdG8gdG9vKS5cclxuKiovXHJcblxyXG4vKiBqcXVlcnkgaW1wbGVtZW50YXRpb246XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcclxucmV0dXJuICQuZXh0ZW5kLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpOyBcclxufTsqL1xyXG5cclxudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChkZXN0aW5hdGlvbiwgc291cmNlKSB7XHJcbiAgZm9yICh2YXIgcHJvcGVydHkgaW4gc291cmNlKSB7XHJcbiAgICBpZiAoIXNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpXHJcbiAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgIC8vIEFsbG93IHByb3BlcnRpZXMgcmVtb3ZhbCwgaWYgc291cmNlIGNvbnRhaW5zIHZhbHVlICd1bmRlZmluZWQnLlxyXG4gICAgLy8gVGhlcmUgYXJlIG5vIHNwZWNpYWwgY29uc2lkZXJhdGlvbnMgb24gQXJyYXlzLCB0byBkb24ndCBnZXQgdW5kZXNpcmVkXHJcbiAgICAvLyByZXN1bHRzIGp1c3QgdGhlIHdhbnRlZCBpcyB0byByZXBsYWNlIHNwZWNpZmljIHBvc2l0aW9ucywgbm9ybWFsbHkuXHJcbiAgICBpZiAoc291cmNlW3Byb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRlbGV0ZSBkZXN0aW5hdGlvbltwcm9wZXJ0eV07XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChbJ29iamVjdCcsICdmdW5jdGlvbiddLmluZGV4T2YodHlwZW9mIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSkgIT0gLTEgJiZcclxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZVtwcm9wZXJ0eV0gPT0gJ29iamVjdCcpXHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9PSAnZnVuY3Rpb24nICYmXHJcbiAgICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZVtwcm9wZXJ0eV0gPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB2YXIgb3JpZyA9IGRlc3RpbmF0aW9uW3Byb3BlcnR5XTtcclxuICAgICAgLy8gQ2xvbmUgZnVuY3Rpb25cclxuICAgICAgdmFyIHNvdXIgPSBjbG9uZUZ1bmN0aW9uKHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgICBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPSBzb3VyO1xyXG4gICAgICAvLyBBbnkgcHJldmlvdXMgYXR0YWNoZWQgcHJvcGVydHlcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgb3JpZyk7XHJcbiAgICAgIC8vIEFueSBzb3VyY2UgYXR0YWNoZWQgcHJvcGVydHlcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICAgIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV07XHJcbiAgfVxyXG5cclxuICAvLyBTbyBtdWNoICdzb3VyY2UnIGFyZ3VtZW50cyBhcyB3YW50ZWQuIEluIEVTNiB3aWxsIGJlICdzb3VyY2UuLidcclxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcclxuICAgIHZhciBuZXh0cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XHJcbiAgICBuZXh0cy5zcGxpY2UoMSwgMSk7XHJcbiAgICBleHRlbmQuYXBwbHkodGhpcywgbmV4dHMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRlc3RpbmF0aW9uO1xyXG59O1xyXG5cclxuZXh0ZW5kLnBsdWdJbiA9IGZ1bmN0aW9uIHBsdWdJbihvYmopIHtcclxuICBvYmogPSBvYmogfHwgT2JqZWN0LnByb3RvdHlwZTtcclxuICBvYmouZXh0ZW5kTWUgPSBmdW5jdGlvbiBleHRlbmRNZSgpIHtcclxuICAgIGV4dGVuZC5hcHBseSh0aGlzLCBbdGhpc10uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcclxuICB9O1xyXG4gIG9iai5leHRlbmQgPSBmdW5jdGlvbiBleHRlbmRJbnN0YW5jZSgpIHtcclxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcclxuICAgICAgLy8gSWYgdGhlIG9iamVjdCB1c2VkIHRvIGV4dGVuZCBmcm9tIGlzIGEgZnVuY3Rpb24sIGlzIGNvbnNpZGVyZWRcclxuICAgICAgLy8gYSBjb25zdHJ1Y3RvciwgdGhlbiB3ZSBleHRlbmQgZnJvbSBpdHMgcHJvdG90eXBlLCBvdGhlcndpc2UgaXRzZWxmLlxyXG4gICAgICBjb25zdHJ1Y3RvckEgPSB0eXBlb2YgdGhpcyA9PSAnZnVuY3Rpb24nID8gdGhpcyA6IG51bGwsXHJcbiAgICAgIGJhc2VBID0gY29uc3RydWN0b3JBID8gdGhpcy5wcm90b3R5cGUgOiB0aGlzLFxyXG4gICAgICAvLyBJZiBsYXN0IGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24sIGlzIGNvbnNpZGVyZWQgYSBjb25zdHJ1Y3RvclxyXG4gICAgICAvLyBvZiB0aGUgbmV3IGNsYXNzL29iamVjdCB0aGVuIHdlIGV4dGVuZCBpdHMgcHJvdG90eXBlLlxyXG4gICAgICAvLyBXZSB1c2UgYW4gZW1wdHkgb2JqZWN0IG90aGVyd2lzZS5cclxuICAgICAgY29uc3RydWN0b3JCID0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PSAnZnVuY3Rpb24nID9cclxuICAgICAgICBhcmdzLnNwbGljZShhcmdzLmxlbmd0aCAtIDEpWzBdIDpcclxuICAgICAgICBudWxsLFxyXG4gICAgICBiYXNlQiA9IGNvbnN0cnVjdG9yQiA/IGNvbnN0cnVjdG9yQi5wcm90b3R5cGUgOiB7fTtcclxuXHJcbiAgICB2YXIgZXh0ZW5kZWRSZXN1bHQgPSBleHRlbmQuYXBwbHkodGhpcywgW2Jhc2VCLCBiYXNlQV0uY29uY2F0KGFyZ3MpKTtcclxuICAgIC8vIElmIGJvdGggYXJlIGNvbnN0cnVjdG9ycywgd2Ugd2FudCB0aGUgc3RhdGljIG1ldGhvZHMgdG8gYmUgY29waWVkIHRvbzpcclxuICAgIGlmIChjb25zdHJ1Y3RvckEgJiYgY29uc3RydWN0b3JCKVxyXG4gICAgICBleHRlbmQoY29uc3RydWN0b3JCLCBjb25zdHJ1Y3RvckEpO1xyXG5cclxuICAgIC8vIElmIHdlIGFyZSBleHRlbmRpbmcgYSBjb25zdHJ1Y3Rvciwgd2UgcmV0dXJuIHRoYXQsIG90aGVyd2lzZSB0aGUgcmVzdWx0XHJcbiAgICByZXR1cm4gY29uc3RydWN0b3JCIHx8IGV4dGVuZGVkUmVzdWx0O1xyXG4gIH07XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICBtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZDtcclxufSBlbHNlIHtcclxuICAvLyBnbG9iYWwgc2NvcGVcclxuICBleHRlbmQucGx1Z0luKCk7XHJcbn1cclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gIENsb25lIFV0aWxzXHJcbiovXHJcbmZ1bmN0aW9uIGNsb25lT2JqZWN0KG9iaikge1xyXG4gIHJldHVybiBleHRlbmQoe30sIG9iaik7XHJcbn1cclxuXHJcbi8vIFRlc3RpbmcgaWYgYSBzdHJpbmcgc2VlbXMgYSBmdW5jdGlvbiBzb3VyY2UgY29kZTpcclxuLy8gV2UgdGVzdCBhZ2FpbnMgYSBzaW1wbGlzaWMgcmVndWxhciBleHByZXNpb24gdGhhdCBtYXRjaFxyXG4vLyBhIGNvbW1vbiBzdGFydCBvZiBmdW5jdGlvbiBkZWNsYXJhdGlvbi5cclxuLy8gT3RoZXIgd2F5cyB0byBkbyB0aGlzIGlzIGF0IGludmVyc2VyLCBieSBjaGVja2luZ1xyXG4vLyB0aGF0IHRoZSBmdW5jdGlvbiB0b1N0cmluZyBpcyBub3QgYSBrbm93ZWQgdGV4dFxyXG4vLyBhcyAnW29iamVjdCBGdW5jdGlvbl0nIG9yICdbbmF0aXZlIGNvZGVdJywgYnV0XHJcbi8vIHNpbmNlIHRoYSBjYW4gY2hhbmdlcyBiZXR3ZWVuIGJyb3dzZXJzLCBpcyBtb3JlIGNvbnNlcnZhdGl2ZVxyXG4vLyBjaGVjayBhZ2FpbnN0IGEgY29tbW9uIGNvbnN0cnVjdCBhbiBmYWxsYmFjayBvbiB0aGVcclxuLy8gY29tbW9uIHNvbHV0aW9uIGlmIG5vdCBtYXRjaGVzLlxyXG52YXIgdGVzdEZ1bmN0aW9uID0gL15cXHMqZnVuY3Rpb25bXlxcKF1cXCgvO1xyXG5cclxuZnVuY3Rpb24gY2xvbmVGdW5jdGlvbihmbikge1xyXG4gIHZhciB0ZW1wO1xyXG4gIHZhciBjb250ZW50cyA9IGZuLnRvU3RyaW5nKCk7XHJcbiAgLy8gQ29weSB0byBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgc2FtZSBwcm90b3R5cGUsIGZvciB0aGUgbm90ICdvd25lZCcgcHJvcGVydGllcy5cclxuICAvLyBBc3NpbmdlZCBhdCB0aGUgZW5kXHJcbiAgdmFyIHRlbXBQcm90byA9IE9iamVjdC5jcmVhdGUoZm4ucHJvdG90eXBlKTtcclxuXHJcbiAgLy8gRElTQUJMRUQgdGhlIGNvbnRlbnRzLWNvcHkgcGFydCBiZWNhdXNlIGl0IGZhaWxzIHdpdGggY2xvc3VyZXNcclxuICAvLyBnZW5lcmF0ZWQgYnkgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLCB1c2luZyB0aGUgc3ViLWNhbGwgd2F5IGV2ZXJcclxuICBpZiAodHJ1ZSB8fCAhdGVzdEZ1bmN0aW9uLnRlc3QoY29udGVudHMpKSB7XHJcbiAgICAvLyBDaGVjayBpZiBpcyBhbHJlYWR5IGEgY2xvbmVkIGNvcHksIHRvXHJcbiAgICAvLyByZXVzZSB0aGUgb3JpZ2luYWwgY29kZSBhbmQgYXZvaWQgbW9yZSB0aGFuXHJcbiAgICAvLyBvbmUgZGVwdGggaW4gc3RhY2sgY2FsbHMgKGdyZWF0ISlcclxuICAgIGlmICh0eXBlb2YgZm4ucHJvdG90eXBlLl9fX2Nsb25lZF9vZiA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICBmbiA9IGZuLnByb3RvdHlwZS5fX19jbG9uZWRfb2Y7XHJcblxyXG4gICAgdGVtcCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpOyB9O1xyXG5cclxuICAgIC8vIFNhdmUgbWFyayBhcyBjbG9uZWQuIERvbmUgaW4gaXRzIHByb3RvdHlwZVxyXG4gICAgLy8gdG8gbm90IGFwcGVhciBpbiB0aGUgbGlzdCBvZiAnb3duZWQnIHByb3BlcnRpZXMuXHJcbiAgICB0ZW1wUHJvdG8uX19fY2xvbmVkX29mID0gZm47XHJcbiAgICAvLyBSZXBsYWNlIHRvU3RyaW5nIHRvIHJldHVybiB0aGUgb3JpZ2luYWwgc291cmNlOlxyXG4gICAgdGVtcFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gZm4udG9TdHJpbmcoKTtcclxuICAgIH07XHJcbiAgICAvLyBUaGUgbmFtZSBjYW5ub3QgYmUgc2V0LCB3aWxsIGp1c3QgYmUgYW5vbnltb3VzXHJcbiAgICAvL3RlbXAubmFtZSA9IHRoYXQubmFtZTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gVGhpcyB3YXkgb24gY2FwYWJsZSBicm93c2VycyBwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgbmFtZSxcclxuICAgIC8vIGRvIGEgcmVhbCBpbmRlcGVuZGVudCBjb3B5IGFuZCBhdm9pZCBmdW5jdGlvbiBzdWJjYWxscyB0aGF0XHJcbiAgICAvLyBjYW4gZGVncmF0ZSBwZXJmb3JtYW5jZSBhZnRlciBsb3Qgb2YgJ2Nsb25uaW5nJy5cclxuICAgIHZhciBmID0gRnVuY3Rpb247XHJcbiAgICB0ZW1wID0gKG5ldyBmKCdyZXR1cm4gJyArIGNvbnRlbnRzKSkoKTtcclxuICB9XHJcblxyXG4gIHRlbXAucHJvdG90eXBlID0gdGVtcFByb3RvO1xyXG4gIC8vIENvcHkgYW55IHByb3BlcnRpZXMgaXQgb3duc1xyXG4gIGV4dGVuZCh0ZW1wLCBmbik7XHJcblxyXG4gIHJldHVybiB0ZW1wO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbG9uZVBsdWdJbigpIHtcclxuICBpZiAodHlwZW9mIEZ1bmN0aW9uLnByb3RvdHlwZS5jbG9uZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgRnVuY3Rpb24ucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUoKSB7IHJldHVybiBjbG9uZUZ1bmN0aW9uKHRoaXMpOyB9O1xyXG4gIH1cclxuICBpZiAodHlwZW9mIE9iamVjdC5wcm90b3R5cGUuY2xvbmUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgIE9qYmVjdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSgpIHsgcmV0dXJuIGNsb25lT2JqZWN0KHRoaXMpOyB9O1xyXG4gIH1cclxufVxyXG5cclxuZXh0ZW5kLmNsb25lT2JqZWN0ID0gY2xvbmVPYmplY3Q7XHJcbmV4dGVuZC5jbG9uZUZ1bmN0aW9uID0gY2xvbmVGdW5jdGlvbjtcclxuZXh0ZW5kLmNsb25lUGx1Z0luID0gY2xvbmVQbHVnSW47XHJcbiIsIi8qKlxyXG4qIENvb2tpZXMgbWFuYWdlbWVudC5cclxuKiBNb3N0IGNvZGUgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80ODI1Njk1LzE2MjIzNDZcclxuKi9cclxudmFyIENvb2tpZSA9IHt9O1xyXG5cclxuQ29va2llLnNldCA9IGZ1bmN0aW9uIHNldENvb2tpZShuYW1lLCB2YWx1ZSwgZGF5cykge1xyXG4gICAgdmFyIGV4cGlyZXMgPSBcIlwiO1xyXG4gICAgaWYgKGRheXMpIHtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgKGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKSk7XHJcbiAgICAgICAgZXhwaXJlcyA9IFwiOyBleHBpcmVzPVwiICsgZGF0ZS50b0dNVFN0cmluZygpO1xyXG4gICAgfVxyXG4gICAgZG9jdW1lbnQuY29va2llID0gbmFtZSArIFwiPVwiICsgdmFsdWUgKyBleHBpcmVzICsgXCI7IHBhdGg9L1wiO1xyXG59O1xyXG5Db29raWUuZ2V0ID0gZnVuY3Rpb24gZ2V0Q29va2llKGNfbmFtZSkge1xyXG4gICAgaWYgKGRvY3VtZW50LmNvb2tpZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY19zdGFydCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKGNfbmFtZSArIFwiPVwiKTtcclxuICAgICAgICBpZiAoY19zdGFydCAhPSAtMSkge1xyXG4gICAgICAgICAgICBjX3N0YXJ0ID0gY19zdGFydCArIGNfbmFtZS5sZW5ndGggKyAxO1xyXG4gICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKFwiO1wiLCBjX3N0YXJ0KTtcclxuICAgICAgICAgICAgaWYgKGNfZW5kID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHVuZXNjYXBlKGRvY3VtZW50LmNvb2tpZS5zdWJzdHJpbmcoY19zdGFydCwgY19lbmQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gXCJcIjtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gQ29va2llOyIsIi8qKiBDb25uZWN0IGFjY291bnQgd2l0aCBGYWNlYm9va1xyXG4qKi9cclxudmFyXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyksXHJcbiAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5mdW5jdGlvbiBGYWNlYm9va0Nvbm5lY3Qob3B0aW9ucykge1xyXG4gICQuZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIGlmICghJCgnI2ZiLXJvb3QnKS5sZW5ndGgpXHJcbiAgICAkKCc8ZGl2IGlkPVwiZmItcm9vdFwiIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiPjwvZGl2PicpLmFwcGVuZFRvKCdib2R5Jyk7XHJcbn1cclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUgPSB7XHJcbiAgYXBwSWQ6IG51bGwsXHJcbiAgbGFuZzogJ2VuX1VTJyxcclxuICByZXN1bHRUeXBlOiAnanNvbicsIC8vICdyZWRpcmVjdCdcclxuICBmYlVybEJhc2U6ICcvL2Nvbm5lY3QuZmFjZWJvb2submV0L0AobGFuZykvYWxsLmpzJyxcclxuICBzZXJ2ZXJVcmxCYXNlOiBMY1VybC5MYW5nUGF0aCArICdBY2NvdW50L0ZhY2Vib29rL0AodXJsU2VjdGlvbikvP1JlZGlyZWN0PUAocmVkaXJlY3RVcmwpJnByb2ZpbGU9QChwcm9maWxlVXJsKScsXHJcbiAgcmVkaXJlY3RVcmw6ICcnLFxyXG4gIHByb2ZpbGVVcmw6ICcnLFxyXG4gIHVybFNlY3Rpb246ICcnLFxyXG4gIGxvYWRpbmdUZXh0OiAnVmVyaWZpbmcnLFxyXG4gIHBlcm1pc3Npb25zOiAnJyxcclxuICBsaWJMb2FkZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdExpYkxvYWRlZCcsXHJcbiAgY29ubmVjdGVkRXZlbnQ6ICdGYWNlYm9va0Nvbm5lY3RDb25uZWN0ZWQnXHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldEZiVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZmJVcmxCYXNlLnJlcGxhY2UoL0BcXChsYW5nXFwpL2csIHRoaXMubGFuZyk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldFNlcnZlclVybCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnNlcnZlclVybEJhc2VcclxuICAucmVwbGFjZSgvQFxcKHJlZGlyZWN0VXJsXFwpL2csIHRoaXMucmVkaXJlY3RVcmwpXHJcbiAgLnJlcGxhY2UoL0BcXChwcm9maWxlVXJsXFwpL2csIHRoaXMucHJvZmlsZVVybClcclxuICAucmVwbGFjZSgvQFxcKHVybFNlY3Rpb25cXCkvZywgdGhpcy51cmxTZWN0aW9uKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUubG9hZExpYiA9IGZ1bmN0aW9uICgpIHtcclxuICAvLyBPbmx5IGlmIGlzIG5vdCBsb2FkZWQgc3RpbGxcclxuICAvLyAoRmFjZWJvb2sgc2NyaXB0IGF0dGFjaCBpdHNlbGYgYXMgdGhlIGdsb2JhbCB2YXJpYWJsZSAnRkInKVxyXG4gIGlmICghd2luZG93LkZCICYmICF0aGlzLl9sb2FkaW5nTGliKSB7XHJcbiAgICB0aGlzLl9sb2FkaW5nTGliID0gdHJ1ZTtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgc2NyaXB0czogW3RoaXMuZ2V0RmJVcmwoKV0sXHJcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgRkIuaW5pdCh7IGFwcElkOiB0aGF0LmFwcElkLCBzdGF0dXM6IHRydWUsIGNvb2tpZTogdHJ1ZSwgeGZibWw6IHRydWUgfSk7XHJcbiAgICAgICAgdGhhdC5sb2FkaW5nTGliID0gZmFsc2U7XHJcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcih0aGF0LmxpYkxvYWRlZEV2ZW50KTtcclxuICAgICAgfSxcclxuICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuRkI7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUucHJvY2Vzc1Jlc3BvbnNlID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgaWYgKHJlc3BvbnNlLmF1dGhSZXNwb25zZSkge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBXZWxjb21lIScpO1xyXG4gICAgdmFyIHVybCA9IHRoaXMuZ2V0U2VydmVyVXJsKCk7XHJcbiAgICBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwicmVkaXJlY3RcIikge1xyXG4gICAgICByZWRpcmVjdFRvKHVybCk7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMucmVzdWx0VHlwZSA9PSBcImpzb25cIikge1xyXG4gICAgICBwb3B1cCh1cmwsICdzbWFsbCcsIG51bGwsIHRoaXMubG9hZGluZ1RleHQpO1xyXG4gICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoaXMuY29ubmVjdGVkRXZlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qRkIuYXBpKCcvbWUnLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgIGNvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IEdvb2QgdG8gc2VlIHlvdSwgJyArIHJlc3BvbnNlLm5hbWUgKyAnLicpO1xyXG4gICAgfSk7Ki9cclxuICB9IGVsc2Uge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBVc2VyIGNhbmNlbGxlZCBsb2dpbiBvciBkaWQgbm90IGZ1bGx5IGF1dGhvcml6ZS4nKTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLm9uTGliUmVhZHkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICBpZiAod2luZG93LkZCKVxyXG4gICAgY2FsbGJhY2soKTtcclxuICBlbHNlIHtcclxuICAgIHRoaXMubG9hZExpYigpO1xyXG4gICAgJChkb2N1bWVudCkub24odGhpcy5saWJMb2FkZWRFdmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5vbkxpYlJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgIEZCLmxvZ2luKCQucHJveHkodGhhdC5wcm9jZXNzUmVzcG9uc2UsIHRoYXQpLCB7IHNjb3BlOiB0aGF0LnBlcm1pc3Npb25zIH0pO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5hdXRvQ29ubmVjdE9uID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgalF1ZXJ5KGRvY3VtZW50KS5vbignY2xpY2snLCBzZWxlY3RvciB8fCAnYS5mYWNlYm9vay1jb25uZWN0JywgJC5wcm94eSh0aGlzLmNvbm5lY3QsIHRoaXMpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmFjZWJvb2tDb25uZWN0OyIsIi8qKiBJbXBsZW1lbnRzIGEgc2ltaWxhciBMY1VybCBvYmplY3QgbGlrZSB0aGUgc2VydmVyLXNpZGUgb25lLCBiYXNpbmdcclxuICAgIGluIHRoZSBpbmZvcm1hdGlvbiBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgYXQgJ2h0bWwnIHRhZyBpbiB0aGUgXHJcbiAgICAnZGF0YS1iYXNlLXVybCcgYXR0cmlidXRlICh0aGF0cyB2YWx1ZSBpcyB0aGUgZXF1aXZhbGVudCBmb3IgQXBwUGF0aCksXHJcbiAgICBhbmQgdGhlIGxhbmcgaW5mb3JtYXRpb24gYXQgJ2RhdGEtY3VsdHVyZScuXHJcbiAgICBUaGUgcmVzdCBvZiBVUkxzIGFyZSBidWlsdCBmb2xsb3dpbmcgdGhlIHdpbmRvdy5sb2NhdGlvbiBhbmQgc2FtZSBydWxlc1xyXG4gICAgdGhhbiBpbiB0aGUgc2VydmVyLXNpZGUgb2JqZWN0LlxyXG4qKi9cclxuXHJcbnZhciBiYXNlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1iYXNlLXVybCcpLFxyXG4gICAgbGFuZyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpLFxyXG4gICAgbCA9IHdpbmRvdy5sb2NhdGlvbixcclxuICAgIHVybCA9IGwucHJvdG9jb2wgKyAnLy8nICsgbC5ob3N0O1xyXG4vLyBsb2NhdGlvbi5ob3N0IGluY2x1ZGVzIHBvcnQsIGlmIGlzIG5vdCB0aGUgZGVmYXVsdCwgdnMgbG9jYXRpb24uaG9zdG5hbWVcclxuXHJcbmJhc2UgPSBiYXNlIHx8ICcvJztcclxuXHJcbnZhciBMY1VybCA9IHtcclxuICAgIFNpdGVVcmw6IHVybCxcclxuICAgIEFwcFBhdGg6IGJhc2UsXHJcbiAgICBBcHBVcmw6IHVybCArIGJhc2UsXHJcbiAgICBMYW5nSWQ6IGxhbmcsXHJcbiAgICBMYW5nUGF0aDogYmFzZSArIGxhbmcgKyAnLycsXHJcbiAgICBMYW5nVXJsOiB1cmwgKyBiYXNlICsgbGFuZ1xyXG59O1xyXG5MY1VybC5MYW5nVXJsID0gdXJsICsgTGNVcmwuTGFuZ1BhdGg7XHJcbkxjVXJsLkpzb25QYXRoID0gTGNVcmwuTGFuZ1BhdGggKyAnSlNPTi8nO1xyXG5MY1VybC5Kc29uVXJsID0gdXJsICsgTGNVcmwuSnNvblBhdGg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjVXJsOyIsIi8qIExvY29ub21pY3Mgc3BlY2lmaWMgUHJpY2UsIGZlZXMgYW5kIGhvdXItcHJpY2UgY2FsY3VsYXRpb25cclxuICAgIHVzaW5nIHNvbWUgc3RhdGljIG1ldGhvZHMgYW5kIHRoZSBQcmljZSBjbGFzcy5cclxuKi9cclxudmFyIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbi8qIENsYXNzIFByaWNlIHRvIGNhbGN1bGF0ZSBhIHRvdGFsIHByaWNlIGJhc2VkIG9uIGZlZXMgaW5mb3JtYXRpb24gKGZpeGVkIGFuZCByYXRlKVxyXG4gICAgYW5kIGRlc2lyZWQgZGVjaW1hbHMgZm9yIGFwcHJveGltYXRpb25zLlxyXG4qL1xyXG5mdW5jdGlvbiBQcmljZShiYXNlUHJpY2UsIGZlZSwgcm91bmRlZERlY2ltYWxzKSB7XHJcbiAgICAvLyBmZWUgcGFyYW1ldGVyIGNhbiBiZSBhIGZsb2F0IG51bWJlciB3aXRoIHRoZSBmZWVSYXRlIG9yIGFuIG9iamVjdFxyXG4gICAgLy8gdGhhdCBpbmNsdWRlcyBib3RoIGEgZmVlUmF0ZSBhbmQgYSBmaXhlZEZlZUFtb3VudFxyXG4gICAgLy8gRXh0cmFjdGluZyBmZWUgdmFsdWVzIGludG8gbG9jYWwgdmFyczpcclxuICAgIHZhciBmZWVSYXRlID0gMCwgZml4ZWRGZWVBbW91bnQgPSAwO1xyXG4gICAgaWYgKGZlZS5maXhlZEZlZUFtb3VudCB8fCBmZWUuZmVlUmF0ZSkge1xyXG4gICAgICAgIGZpeGVkRmVlQW1vdW50ID0gZmVlLmZpeGVkRmVlQW1vdW50IHx8IDA7XHJcbiAgICAgICAgZmVlUmF0ZSA9IGZlZS5mZWVSYXRlIHx8IDA7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBmZWVSYXRlID0gZmVlO1xyXG5cclxuICAgIC8vIENhbGN1bGF0aW5nOlxyXG4gICAgLy8gVGhlIHJvdW5kVG8gd2l0aCBhIGJpZyBmaXhlZCBkZWNpbWFscyBpcyB0byBhdm9pZCB0aGVcclxuICAgIC8vIGRlY2ltYWwgZXJyb3Igb2YgZmxvYXRpbmcgcG9pbnQgbnVtYmVyc1xyXG4gICAgdmFyIHRvdGFsUHJpY2UgPSBtdS5jZWlsVG8obXUucm91bmRUbyhiYXNlUHJpY2UgKiAoMSArIGZlZVJhdGUpICsgZml4ZWRGZWVBbW91bnQsIDEyKSwgcm91bmRlZERlY2ltYWxzKTtcclxuICAgIC8vIGZpbmFsIGZlZSBwcmljZSBpcyBjYWxjdWxhdGVkIGFzIGEgc3Vic3RyYWN0aW9uLCBidXQgYmVjYXVzZSBqYXZhc2NyaXB0IGhhbmRsZXNcclxuICAgIC8vIGZsb2F0IG51bWJlcnMgb25seSwgYSByb3VuZCBvcGVyYXRpb24gaXMgcmVxdWlyZWQgdG8gYXZvaWQgYW4gaXJyYXRpb25hbCBudW1iZXJcclxuICAgIHZhciBmZWVQcmljZSA9IG11LnJvdW5kVG8odG90YWxQcmljZSAtIGJhc2VQcmljZSwgMik7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgb2JqZWN0IHdpdGggZnVsbCBkZXRhaWxzOlxyXG4gICAgdGhpcy5iYXNlUHJpY2UgPSBiYXNlUHJpY2U7XHJcbiAgICB0aGlzLmZlZVJhdGUgPSBmZWVSYXRlO1xyXG4gICAgdGhpcy5maXhlZEZlZUFtb3VudCA9IGZpeGVkRmVlQW1vdW50O1xyXG4gICAgdGhpcy5yb3VuZGVkRGVjaW1hbHMgPSByb3VuZGVkRGVjaW1hbHM7XHJcbiAgICB0aGlzLnRvdGFsUHJpY2UgPSB0b3RhbFByaWNlO1xyXG4gICAgdGhpcy5mZWVQcmljZSA9IGZlZVByaWNlO1xyXG59XHJcblxyXG4vKiogQ2FsY3VsYXRlIGFuZCByZXR1cm5zIHRoZSBwcmljZSBhbmQgcmVsZXZhbnQgZGF0YSBhcyBhbiBvYmplY3QgZm9yXHJcbnRpbWUsIGhvdXJseVJhdGUgKHdpdGggZmVlcykgYW5kIHRoZSBob3VybHlGZWUuXHJcblRoZSB0aW1lIChAZHVyYXRpb24pIGlzIHVzZWQgJ2FzIGlzJywgd2l0aG91dCB0cmFuc2Zvcm1hdGlvbiwgbWF5YmUgeW91IGNhbiByZXF1aXJlXHJcbnVzZSBMQy5yb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyIGJlZm9yZSBwYXNzIHRoZSBkdXJhdGlvbiB0byB0aGlzIGZ1bmN0aW9uLlxyXG5JdCByZWNlaXZlcyB0aGUgcGFyYW1ldGVycyBAaG91cmx5UHJpY2UgYW5kIEBzdXJjaGFyZ2VQcmljZSBhcyBMQy5QcmljZSBvYmplY3RzLlxyXG5Ac3VyY2hhcmdlUHJpY2UgaXMgb3B0aW9uYWwuXHJcbioqL1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVIb3VybHlQcmljZShkdXJhdGlvbiwgaG91cmx5UHJpY2UsIHN1cmNoYXJnZVByaWNlKSB7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBzdXJjaGFyZ2UsIGdldCB6ZXJvc1xyXG4gICAgc3VyY2hhcmdlUHJpY2UgPSBzdXJjaGFyZ2VQcmljZSB8fCB7IHRvdGFsUHJpY2U6IDAsIGZlZVByaWNlOiAwLCBiYXNlUHJpY2U6IDAgfTtcclxuICAgIC8vIEdldCBob3VycyBmcm9tIHJvdW5kZWQgZHVyYXRpb246XHJcbiAgICB2YXIgaG91cnMgPSBtdS5yb3VuZFRvKGR1cmF0aW9uLnRvdGFsSG91cnMoKSwgMik7XHJcbiAgICAvLyBDYWxjdWxhdGUgZmluYWwgcHJpY2VzXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvdGFsUHJpY2U6ICAgICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLnRvdGFsUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLnRvdGFsUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgZmVlUHJpY2U6ICAgICAgIG11LnJvdW5kVG8oaG91cmx5UHJpY2UuZmVlUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLmZlZVByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6ICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLmJhc2VQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UuYmFzZVByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIGR1cmF0aW9uSG91cnM6ICBob3Vyc1xyXG4gICAgfTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgUHJpY2U6IFByaWNlLFxyXG4gICAgICAgIGNhbGN1bGF0ZUhvdXJseVByaWNlOiBjYWxjdWxhdGVIb3VybHlQcmljZVxyXG4gICAgfTsiLCIvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI1OTM2MzcvaG93LXRvLWVzY2FwZS1yZWd1bGFyLWV4cHJlc3Npb24taW4tamF2YXNjcmlwdFxyXG5SZWdFeHAucXVvdGUgPSBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgcmV0dXJuIChzdHIgKyAnJykucmVwbGFjZSgvKFsuPyorXiRbXFxdXFxcXCgpe318LV0pL2csIFwiXFxcXCQxXCIpO1xyXG59O1xyXG4iLCIvKipcclxuICBBIHZlcnkgc2ltcGxlIHNsaWRlciBpbXBsZW1lbnRhdGlvbiBpbml0aWFsbHkgY3JlYXRlZFxyXG4gIGZvciB0aGUgcHJvdmlkZXItd2VsY29tZSBsYW5kaW5nIHBhZ2UgYW5kXHJcbiAgb3RoZXIgc2ltaWxhciB1c2VzLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9SZWdFeHAucXVvdGUnKTtcclxuXHJcbnZhciBTaW1wbGVTbGlkZXIgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFNpbXBsZVNsaWRlcihvcHRzKSB7XHJcbiAgJC5leHRlbmQodHJ1ZSwgdGhpcywgb3B0cyk7XHJcblxyXG4gIHRoaXMuZWxlbWVudCA9ICQodGhpcy5lbGVtZW50KTtcclxuICB0aGlzLmN1cnJlbnRJbmRleCA9IDA7XHJcblxyXG4gIC8qKlxyXG4gIEFjdGlvbnMgaGFuZGxlciB0byBtb3ZlIHNsaWRlc1xyXG4gICoqL1xyXG4gIHZhciBjaGVja0hyZWYgPSBuZXcgUmVnRXhwKCdeIycgKyBSZWdFeHAucXVvdGUodGhpcy5ocmVmUHJlZml4KSArICcoLiopJyksXHJcbiAgICB0aGF0ID0gdGhpcztcclxuICB0aGlzLmVsZW1lbnQub24oJ2NsaWNrJywgJ2EnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgaHJlZiA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJyk7XHJcbiAgICB2YXIgcmVzID0gY2hlY2tIcmVmLmV4ZWMoaHJlZik7XHJcblxyXG4gICAgaWYgKHJlcyAmJiByZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICB2YXIgaW5kZXggPSByZXNbMV07XHJcbiAgICAgIGlmIChpbmRleCA9PSAncHJldmlvdXMnKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHRoYXQuY3VycmVudEluZGV4IC0gMSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoaW5kZXggPT0gJ25leHQnKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHRoYXQuY3VycmVudEluZGV4ICsgMSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoL1xcZCsvLnRlc3QoaW5kZXgpKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHBhcnNlSW50KGluZGV4KSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBEbyBhbGwgdGhlIHNldHVwIG9uIHNsaWRlciBhbmQgc2xpZGVzXHJcbiAgdG8gZW5zdXJlIHRoZSBtb3ZlbWVudCB3aWxsIHdvcmsgZmluZS5cclxuICBJdHMgZG9uZSBhdXRvbWF0aWMgb25cclxuICBpbml0aWFsaXppbmcsIGlzIGp1c3QgYSBwdWJsaWMgbWV0aG9kIGZvciBcclxuICBjb252ZW5pZW5jZSAobWF5YmUgdG8gYmUgY2FsbCBpZiBzbGlkZXMgYXJlXHJcbiAgYWRkZWQvcmVtb3ZlZCBhZnRlciBpbml0KS5cclxuICAqKi9cclxuICB0aGlzLnJlZHJhdyA9IGZ1bmN0aW9uIHNsaWRlc1JlcG9zaXRpb24oKSB7XHJcbiAgICB2YXIgc2xpZGVzID0gdGhpcy5nZXRTbGlkZXMoKSxcclxuICAgICAgYyA9IHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyKCk7XHJcbiAgICAvLyBMb29rIGZvciB0aGUgY29udGFpbmVyIHNpemUsIGZyb20gdGhlIFxyXG4gICAgLy8gYmlnZ2VyIHNsaWRlOlxyXG4gICAgdmFyIFxyXG4gICAgICB3ID0gMCxcclxuICAgICAgaCA9IDA7XHJcbiAgICBzbGlkZXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBcclxuICAgICAgICB0ID0gJCh0aGlzKSxcclxuICAgICAgICB0dyA9IHQub3V0ZXJXaWR0aCgpLFxyXG4gICAgICAgIHRoID0gdC5vdXRlckhlaWdodCgpO1xyXG4gICAgICBpZiAodHcgPiB3KVxyXG4gICAgICAgIHcgPSB0dztcclxuICAgICAgaWYgKHRoID4gaClcclxuICAgICAgICBoID0gdGg7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDU1Mgc2V0dXAsIFxyXG4gICAgLy8gYWxsIHNsaWRlcyBpbiB0aGUgc2FtZSBsaW5lLFxyXG4gICAgLy8gYWxsIHdpdGggc2FtZSBzaXplIChleHRyYSBzcGFjaW5nIGNhblxyXG4gICAgLy8gYmUgZ2l2ZW4gd2l0aCBDU1MpXHJcbiAgICBjLmNzcyh7XHJcbiAgICAgIHdpZHRoOiB3IC0gKGMub3V0ZXJXaWR0aCgpIC0gYy53aWR0aCgpKSxcclxuICAgICAgLy9oZWlnaHQ6IGggLSAoYy5vdXRlckhlaWdodCgpIC0gYy5oZWlnaHQoKSksXHJcbiAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxyXG4gICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXHJcbiAgICAgIHdoaXRlU3BhY2U6ICdub3dyYXAnXHJcbiAgICB9KTtcclxuXHJcbiAgICBzbGlkZXMuY3NzKHtcclxuICAgICAgd2hpdGVTcGFjZTogJ25vcm1hbCcsXHJcbiAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXHJcbiAgICB9KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICB0LmNzcyh7XHJcbiAgICAgICAgd2lkdGg6IHcgLSAodC5vdXRlcldpZHRoKCkgLSB0LndpZHRoKCkpXHJcbiAgICAgICAgLy8saGVpZ2h0OiBoIC0gKHQub3V0ZXJIZWlnaHQoKSAtIHQuaGVpZ2h0KCkpXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVwb3NpdGlvbmF0ZSBhdCB0aGUgYmVnZ2luaW5nOlxyXG4gICAgY1swXS5zY3JvbGxMZWZ0ID0gMDtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHbyB0byBhIHNsaWRlIGJ5IGluZGV4XHJcbiAgKiovXHJcbiAgdGhpcy5nb1NsaWRlID0gZnVuY3Rpb24gZ29TbGlkZShpbmRleCkge1xyXG4gICAgdmFyIHByZXYgPSB0aGlzLmN1cnJlbnRJbmRleDtcclxuICAgIGlmIChwcmV2ID09IGluZGV4KVxyXG4gICAgICByZXR1cm47XHJcblxyXG4gICAgLy8gQ2hlY2sgYm91bmRzXHJcbiAgICBpZiAoaW5kZXggPCAxKVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB2YXIgc2xpZGVzID0gdGhpcy5nZXRTbGlkZXMoKTtcclxuICAgIGlmIChpbmRleCA+IHNsaWRlcy5sZW5ndGgpXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAvLyBHb29kIGluZGV4LCBzZXQgYXMgY3VycmVudFxyXG4gICAgdGhpcy5jdXJyZW50SW5kZXggPSBpbmRleDtcclxuICAgIC8vIFNldCBsaW5rcyB0byB0aGlzIGFzIGN1cnJlbnQsIHJlbW92aW5nIGFueSBwcmV2aW91czpcclxuICAgIHRoaXMuZWxlbWVudC5maW5kKCdbaHJlZj0jJyArIHRoaXMuaHJlZlByZWZpeCArIGluZGV4ICsgJ10nKVxyXG4gICAgLmFkZENsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpXHJcbiAgICAucGFyZW50KCdsaScpLmFkZENsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpO1xyXG4gICAgdGhpcy5lbGVtZW50LmZpbmQoJ1tocmVmPSMnICsgdGhpcy5ocmVmUHJlZml4ICsgcHJldiArICddJylcclxuICAgIC5yZW1vdmVDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKVxyXG4gICAgLnBhcmVudCgnbGknKS5yZW1vdmVDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKTtcclxuXHJcbiAgICB2YXIgXHJcbiAgICAgIHNsaWRlID0gJChzbGlkZXMuZ2V0KGluZGV4IC0gMSkpLFxyXG4gICAgICBjID0gdGhpcy5nZXRTbGlkZXNDb250YWluZXIoKSxcclxuICAgICAgbGVmdCA9IGMuc2Nyb2xsTGVmdCgpICsgc2xpZGUucG9zaXRpb24oKS5sZWZ0O1xyXG5cclxuICAgIGMuc3RvcCgpLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiBsZWZ0IH0sIHRoaXMuZHVyYXRpb24pO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICBNZXRob2Q6IEdldCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gb2Ygc2xpZGVzXHJcbiAgKiovXHJcbiAgdGhpcy5nZXRTbGlkZXMgPSBmdW5jdGlvbiBnZXRTbGlkZXMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50XHJcbiAgICAuZmluZCh0aGlzLnNlbGVjdG9ycy5zbGlkZXMpXHJcbiAgICAuZmluZCh0aGlzLnNlbGVjdG9ycy5zbGlkZSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHZXQgdGhlIGpRdWVyeSBlbGVtZW50IGZvciB0aGUgY29udGFpbmVyIG9mIHNsaWRlc1xyXG4gICoqL1xyXG4gIHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyID0gZnVuY3Rpb24gZ2V0U2xpZGVzQ29udGFpbmVyKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGVzKTtcclxuICB9O1xyXG5cclxuICAvKiogTGFzdCBpbml0IHN0ZXBzXHJcbiAgKiovXHJcbiAgdGhpcy5yZWRyYXcoKTtcclxufTtcclxuXHJcblNpbXBsZVNsaWRlci5wcm90b3R5cGUgPSB7XHJcbiAgZWxlbWVudDogbnVsbCxcclxuICBzZWxlY3RvcnM6IHtcclxuICAgIHNsaWRlczogJy5zbGlkZXMnLFxyXG4gICAgc2xpZGU6ICdsaS5zbGlkZSdcclxuICB9LFxyXG4gIGN1cnJlbnRTbGlkZUNsYXNzOiAnanMtaXNDdXJyZW50JyxcclxuICBocmVmUHJlZml4OiAnZ29TbGlkZV8nLFxyXG4gIC8vIER1cmF0aW9uIG9mIGVhY2ggc2xpZGUgaW4gbWlsbGlzZWNvbmRzXHJcbiAgZHVyYXRpb246IDEwMDBcclxufTsiLCIvKiogUG9seWZpbGwgZm9yIHN0cmluZy5jb250YWluc1xyXG4qKi9cclxuaWYgKCEoJ2NvbnRhaW5zJyBpbiBTdHJpbmcucHJvdG90eXBlKSlcclxuICAgIFN0cmluZy5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoc3RyLCBzdGFydEluZGV4KSB7IHJldHVybiAtMSAhPT0gdGhpcy5pbmRleE9mKHN0ciwgc3RhcnRJbmRleCk7IH07IiwiLyoqID09PT09PT09PT09PT09PT09PT09PT1cclxuICogQSBzaW1wbGUgU3RyaW5nIEZvcm1hdFxyXG4gKiBmdW5jdGlvbiBmb3IgamF2YXNjcmlwdFxyXG4gKiBBdXRob3I6IElhZ28gTG9yZW56byBTYWxndWVpcm9cclxuICogTW9kdWxlOiBDb21tb25KU1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzdHJpbmdGb3JtYXQoKSB7XHJcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcblx0dmFyIGZvcm1hdHRlZCA9IGFyZ3NbMF07XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXFxcXHsnK2krJ1xcXFx9JywgJ2dpJyk7XHJcblx0XHRmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZShyZWdleHAsIGFyZ3NbaSsxXSk7XHJcblx0fVxyXG5cdHJldHVybiBmb3JtYXR0ZWQ7XHJcbn07IiwiLyoqXHJcbiAgICBHZW5lcmFsIGF1dG8tbG9hZCBzdXBwb3J0IGZvciB0YWJzOiBcclxuICAgIElmIHRoZXJlIGlzIG5vIGNvbnRlbnQgd2hlbiBmb2N1c2VkLCB0aGV5IHVzZSB0aGUgJ3JlbG9hZCcganF1ZXJ5IHBsdWdpblxyXG4gICAgdG8gbG9hZCBpdHMgY29udGVudCAtdGFicyBuZWVkIHRvIGJlIGNvbmZpZ3VyZWQgd2l0aCBkYXRhLXNvdXJjZS11cmwgYXR0cmlidXRlXHJcbiAgICBpbiBvcmRlciB0byBrbm93IHdoZXJlIHRvIGZldGNoIHRoZSBjb250ZW50LS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuLy8gRGVwZW5kZW5jeSBUYWJiZWRVWCBmcm9tIERJXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChUYWJiZWRVWCkge1xyXG4gICAgLy8gVGFiYmVkVVguc2V0dXAudGFiQm9keVNlbGVjdG9yIHx8ICcudGFiLWJvZHknXHJcbiAgICAkKCcudGFiLWJvZHknKS5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgJHQucmVsb2FkKCk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIFRoaXMgYWRkcyBub3RpZmljYXRpb25zIHRvIHRhYnMgZnJvbSB0aGUgVGFiYmVkVVggc3lzdGVtIHVzaW5nXHJcbiAgICB0aGUgY2hhbmdlc05vdGlmaWNhdGlvbiB1dGlsaXR5IHRoYXQgZGV0ZWN0cyBub3Qgc2F2ZWQgY2hhbmdlcyBvbiBmb3JtcyxcclxuICAgIHNob3dpbmcgd2FybmluZyBtZXNzYWdlcyB0byB0aGVcclxuICAgIHVzZXIgYW5kIG1hcmtpbmcgdGFicyAoYW5kIHN1Yi10YWJzIC8gcGFyZW50LXRhYnMgcHJvcGVybHkpIHRvXHJcbiAgICBkb24ndCBsb3N0IGNoYW5nZXMgbWFkZS5cclxuICAgIEEgYml0IG9mIENTUyBmb3IgdGhlIGFzc2lnbmVkIGNsYXNzZXMgd2lsbCBhbGxvdyBmb3IgdmlzdWFsIG1hcmtzLlxyXG5cclxuICAgIEFLQTogRG9uJ3QgbG9zdCBkYXRhISB3YXJuaW5nIG1lc3NhZ2UgOy0pXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcblxyXG4vLyBUYWJiZWRVWCBkZXBlbmRlbmN5IGFzIERJXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChUYWJiZWRVWCwgdGFyZ2V0U2VsZWN0b3IpIHtcclxuICAgIHZhciB0YXJnZXQgPSAkKHRhcmdldFNlbGVjdG9yIHx8ICcuY2hhbmdlcy1ub3RpZmljYXRpb24tZW5hYmxlZCcpO1xyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbi5pbml0KHsgdGFyZ2V0OiB0YXJnZXQgfSk7XHJcblxyXG4gICAgLy8gQWRkaW5nIGNoYW5nZSBub3RpZmljYXRpb24gdG8gdGFiLWJvZHkgZGl2c1xyXG4gICAgLy8gKG91dHNpZGUgdGhlIExDLkNoYW5nZXNOb3RpZmljYXRpb24gY2xhc3MgdG8gbGVhdmUgaXQgYXMgZ2VuZXJpYyBhbmQgc2ltcGxlIGFzIHBvc3NpYmxlKVxyXG4gICAgJCh0YXJnZXQpLm9uKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgJ2Zvcm0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcudGFiLWJvZHknKS5hZGRDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGRpbmcgY2xhc3MgdG8gdGhlIG1lbnUgaXRlbSAodGFiIHRpdGxlKVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5hZGRDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgJCgnI2xjcmVzLWNoYW5nZXMtbm90LXNhdmVkJykudGV4dCgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsICdmb3JtJywgZnVuY3Rpb24gKGUsIGYsIGVscywgZnVsbCkge1xyXG4gICAgICAgIGlmIChmdWxsKVxyXG4gICAgICAgICAgICAkKHRoaXMpLnBhcmVudHMoJy50YWItYm9keTpub3QoOmhhcyhmb3JtLmhhcy1jaGFuZ2VzKSknKS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmluZyBjbGFzcyBmcm9tIHRoZSBtZW51IGl0ZW0gKHRhYiB0aXRsZSlcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cigndGl0bGUnLCBudWxsKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLy8gVG8gYXZvaWQgdXNlciBiZSBub3RpZmllZCBvZiBjaGFuZ2VzIGFsbCB0aW1lIHdpdGggdGFiIG1hcmtzLCB3ZSBhZGRlZCBhICdub3RpZnknIGNsYXNzXHJcbiAgICAvLyBvbiB0YWJzIHdoZW4gYSBjaGFuZ2Ugb2YgdGFiIGhhcHBlbnNcclxuICAgIC5maW5kKCcudGFiLWJvZHknKS5vbigndGFiVW5mb2N1c2VkJywgZnVuY3Rpb24gKGV2ZW50LCBmb2N1c2VkQ3R4KSB7XHJcbiAgICAgICAgdmFyIG1pID0gVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbTtcclxuICAgICAgICBpZiAobWkuaXMoJy5oYXMtY2hhbmdlcycpKSB7XHJcbiAgICAgICAgICAgIG1pLmFkZENsYXNzKCdub3RpZnktY2hhbmdlcycpOyAvL2hhcy10b29sdGlwXHJcbiAgICAgICAgICAgIC8vIFNob3cgbm90aWZpY2F0aW9uIHBvcHVwXHJcbiAgICAgICAgICAgIHZhciBkID0gJCgnPGRpdiBjbGFzcz1cIndhcm5pbmdcIj5AMDwvZGl2PjxkaXYgY2xhc3M9XCJhY3Rpb25zXCI+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImFjdGlvbiBjb250aW51ZVwiIHZhbHVlPVwiQDJcIi8+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImFjdGlvbiBzdG9wXCIgdmFsdWU9XCJAMVwiLz48L2Rpdj4nXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDAvZywgTEMuZ2V0VGV4dCgnY2hhbmdlcy1ub3Qtc2F2ZWQnKSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMS9nLCBMQy5nZXRUZXh0KCd0YWItaGFzLWNoYW5nZXMtc3RheS1vbicpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AyL2csIExDLmdldFRleHQoJ3RhYi1oYXMtY2hhbmdlcy1jb250aW51ZS13aXRob3V0LWNoYW5nZScpKSk7XHJcbiAgICAgICAgICAgIGQub24oJ2NsaWNrJywgJy5zdG9wJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2Uod2luZG93KTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKCdjbGljaycsICcuY29udGludWUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh3aW5kb3cpO1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlICdoYXMtY2hhbmdlcycgdG8gYXZvaWQgZnV0dXJlIGJsb2NrcyAodW50aWwgbmV3IGNoYW5nZXMgaGFwcGVucyBvZiBjb3Vyc2UgOy0pXHJcbiAgICAgICAgICAgICAgICBtaS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKTtcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKGZvY3VzZWRDdHgudGFiLmdldCgwKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGQsIHdpbmRvdywgJ25vdC1zYXZlZC1wb3B1cCcsIHsgY2xvc2FibGU6IGZhbHNlLCBjZW50ZXI6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBFdmVyIHJldHVybiBmYWxzZSB0byBzdG9wIGN1cnJlbnQgdGFiIGZvY3VzXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ25vdGlmeS1jaGFuZ2VzJyk7IC8vaGFzLXRvb2x0aXBcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogVGFiYmVkVVg6IFRhYmJlZCBpbnRlcmZhY2UgbG9naWM7IHdpdGggbWluaW1hbCBIVE1MIHVzaW5nIGNsYXNzICd0YWJiZWQnIGZvciB0aGVcclxuY29udGFpbmVyLCB0aGUgb2JqZWN0IHByb3ZpZGVzIHRoZSBmdWxsIEFQSSB0byBtYW5pcHVsYXRlIHRhYnMgYW5kIGl0cyBzZXR1cFxyXG5saXN0ZW5lcnMgdG8gcGVyZm9ybSBsb2dpYyBvbiB1c2VyIGludGVyYWN0aW9uLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lmhhc1Njcm9sbEJhcicpO1xyXG5cclxudmFyIFRhYmJlZFVYID0ge1xyXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoJ2JvZHknKS5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzID4gbGk6bm90KC50YWJzLXNsaWRlcikgPiBhJywgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKFRhYmJlZFVYLmZvY3VzVGFiKCR0LmF0dHIoJ2hyZWYnKSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdCA9ICQoZG9jdW1lbnQpLnNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24uaGFzaCA9ICR0LmF0dHIoJ2hyZWYnKTtcclxuICAgICAgICAgICAgICAgICQoJ2h0bWwsYm9keScpLnNjcm9sbFRvcChzdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdtb3VzZWRvd24nLCBUYWJiZWRVWC5zdGFydE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnbW91c2V1cCBtb3VzZWxlYXZlJywgVGFiYmVkVVguZW5kTW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLy8gdGhlIGNsaWNrIHJldHVybiBmYWxzZSBpcyB0byBkaXNhYmxlIHN0YW5kYXIgdXJsIGJlaGF2aW9yXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdjbGljaycsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlci1saW1pdCcsICdtb3VzZWVudGVyJywgVGFiYmVkVVguc3RhcnRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXItbGltaXQnLCAnbW91c2VsZWF2ZScsIFRhYmJlZFVYLmVuZE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzID4gbGkucmVtb3ZhYmxlJywgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgLy8gT25seSBvbiBkaXJlY3QgY2xpY2tzIHRvIHRoZSB0YWIsIHRvIGF2b2lkXHJcbiAgICAgICAgICAgIC8vIGNsaWNrcyB0byB0aGUgdGFiLWxpbmsgKHRoYXQgc2VsZWN0L2ZvY3VzIHRoZSB0YWIpOlxyXG4gICAgICAgICAgICBpZiAoZS50YXJnZXQgPT0gZS5jdXJyZW50VGFyZ2V0KVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVgucmVtb3ZlVGFiKG51bGwsIHRoaXMpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBJbml0IHBhZ2UgbG9hZGVkIHRhYmJlZCBjb250YWluZXJzOlxyXG4gICAgICAgICQoJy50YWJiZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgLy8gQ29uc2lzdGVuY2UgY2hlY2s6IHRoaXMgbXVzdCBiZSBhIHZhbGlkIGNvbnRhaW5lciwgdGhpcyBpcywgbXVzdCBoYXZlIC50YWJzXHJcbiAgICAgICAgICAgIGlmICgkdC5jaGlsZHJlbignLnRhYnMnKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIC8vIEluaXQgc2xpZGVyXHJcbiAgICAgICAgICAgIFRhYmJlZFVYLnNldHVwU2xpZGVyKCR0KTtcclxuICAgICAgICAgICAgLy8gQ2xlYW4gd2hpdGUgc3BhY2VzICh0aGV5IGNyZWF0ZSBleGNlc2l2ZSBzZXBhcmF0aW9uIGJldHdlZW4gc29tZSB0YWJzKVxyXG4gICAgICAgICAgICAkKCcudGFicycsIHRoaXMpLmNvbnRlbnRzKCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGEgdGV4dCBub2RlLCByZW1vdmUgaXQ6XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ub2RlVHlwZSA9PSAzKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciBkaXIgPSAkdC5oYXNDbGFzcygndGFicy1zbGlkZXItcmlnaHQnKSA/IDEgOiAtMTtcclxuICAgICAgICB2YXIgdGFic1NsaWRlciA9ICR0LnBhcmVudCgpO1xyXG4gICAgICAgIHZhciB0YWJzID0gdGFic1NsaWRlci5zaWJsaW5ncygnLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICB0YWJzWzBdLnNjcm9sbExlZnQgKz0gMjAgKiBkaXI7XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFic1NsaWRlci5wYXJlbnQoKSwgdGFicyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIHN0YXJ0TW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIHRhYnMgPSB0LmNsb3Nlc3QoJy50YWJiZWQnKS5jaGlsZHJlbignLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICAvLyBTdG9wIHByZXZpb3VzIGFuaW1hdGlvbnM6XHJcbiAgICAgICAgdGFicy5zdG9wKHRydWUpO1xyXG4gICAgICAgIHZhciBzcGVlZCA9IDAuMzsgLyogc3BlZWQgdW5pdDogcGl4ZWxzL21pbGlzZWNvbmRzICovXHJcbiAgICAgICAgdmFyIGZ4YSA9IGZ1bmN0aW9uICgpIHsgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFicy5wYXJlbnQoKSwgdGFicyk7IH07XHJcbiAgICAgICAgdmFyIHRpbWU7XHJcbiAgICAgICAgaWYgKHQuaGFzQ2xhc3MoJ3JpZ2h0JykpIHtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRpbWUgYmFzZWQgb24gc3BlZWQgd2Ugd2FudCBhbmQgaG93IG1hbnkgZGlzdGFuY2UgdGhlcmUgaXM6XHJcbiAgICAgICAgICAgIHRpbWUgPSAodGFic1swXS5zY3JvbGxXaWR0aCAtIHRhYnNbMF0uc2Nyb2xsTGVmdCAtIHRhYnMud2lkdGgoKSkgKiAxIC8gc3BlZWQ7XHJcbiAgICAgICAgICAgIHRhYnMuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IHRhYnNbMF0uc2Nyb2xsV2lkdGggLSB0YWJzLndpZHRoKCkgfSxcclxuICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgc3RlcDogZnhhLCBjb21wbGV0ZTogZnhhLCBlYXNpbmc6ICdzd2luZycgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRpbWUgYmFzZWQgb24gc3BlZWQgd2Ugd2FudCBhbmQgaG93IG1hbnkgZGlzdGFuY2UgdGhlcmUgaXM6XHJcbiAgICAgICAgICAgIHRpbWUgPSB0YWJzWzBdLnNjcm9sbExlZnQgKiAxIC8gc3BlZWQ7XHJcbiAgICAgICAgICAgIHRhYnMuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IDAgfSxcclxuICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgc3RlcDogZnhhLCBjb21wbGV0ZTogZnhhLCBlYXNpbmc6ICdzd2luZycgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBlbmRNb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0YWJDb250YWluZXIgPSAkKHRoaXMpLmNsb3Nlc3QoJy50YWJiZWQnKTtcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJykuc3RvcCh0cnVlKTtcclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJDb250YWluZXIpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBjaGVja1RhYlNsaWRlckxpbWl0czogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgdGFicykge1xyXG4gICAgICAgIHRhYnMgPSB0YWJzIHx8IHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICAvLyBTZXQgdmlzaWJpbGl0eSBvZiB2aXN1YWwgbGltaXRlcnM6XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXItbGltaXQtbGVmdCcpLnRvZ2dsZSh0YWJzWzBdLnNjcm9sbExlZnQgPiAwKTtcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlci1saW1pdC1yaWdodCcpLnRvZ2dsZShcclxuICAgICAgICAgICAgKHRhYnNbMF0uc2Nyb2xsTGVmdCArIHRhYnMud2lkdGgoKSkgPCB0YWJzWzBdLnNjcm9sbFdpZHRoKTtcclxuICAgIH0sXHJcbiAgICBzZXR1cFNsaWRlcjogZnVuY3Rpb24gKHRhYkNvbnRhaW5lcikge1xyXG4gICAgICAgIHZhciB0cyA9IHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMnKS5oYXNTY3JvbGxCYXIoeyB4OiAtMiB9KS5ob3Jpem9udGFsKSB7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hZGRDbGFzcygnaGFzLXRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgICAgIGlmICh0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICB0cy5jbGFzc05hbWUgPSAndGFicy1zbGlkZXInO1xyXG4gICAgICAgICAgICAgICAgJCh0cylcclxuICAgICAgICAgICAgICAgIC8vIEFycm93czpcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cInRhYnMtc2xpZGVyLWxlZnQgbGVmdFwiIGhyZWY9XCIjXCI+Jmx0OyZsdDs8L2E+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cInRhYnMtc2xpZGVyLXJpZ2h0IHJpZ2h0XCIgaHJlZj1cIiNcIj4mZ3Q7Jmd0OzwvYT4nKTtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hcHBlbmQodHMpO1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyXHJcbiAgICAgICAgICAgICAgICAvLyBEZXNpbmcgZGV0YWlsczpcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGFicy1zbGlkZXItbGltaXQgdGFicy1zbGlkZXItbGltaXQtbGVmdCBsZWZ0XCIgaHJlZj1cIiNcIj48L2Rpdj4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ0YWJzLXNsaWRlci1saW1pdCB0YWJzLXNsaWRlci1saW1pdC1yaWdodCByaWdodFwiIGhyZWY9XCIjXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0cy5zaG93KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIucmVtb3ZlQ2xhc3MoJ2hhcy10YWJzLXNsaWRlcicpO1xyXG4gICAgICAgICAgICB0cy5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYkNvbnRhaW5lcik7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiQ29udGV4dEJ5QXJnczogZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJiB0eXBlb2YgKGFyZ3NbMF0pID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUYWJDb250ZXh0KGFyZ3NbMF0sIG51bGwpO1xyXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIGFyZ3NbMF0udGFiKVxyXG4gICAgICAgICAgICByZXR1cm4gYXJnc1swXTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFRhYkNvbnRleHQoXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDAgPyBhcmdzWzBdIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMSA/IGFyZ3NbMV0gOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAyID8gYXJnc1syXSA6IG51bGxcclxuICAgICAgICAgICAgKTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWJDb250ZXh0OiBmdW5jdGlvbiAodGFiT3JTZWxlY3RvciwgbWVudWl0ZW1PclNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIG1pLCBtYSwgdGFiLCB0YWJDb250YWluZXI7XHJcbiAgICAgICAgaWYgKHRhYk9yU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdGFiID0gJCh0YWJPclNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKHRhYi5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyID0gdGFiLnBhcmVudHMoJy50YWJiZWQ6ZXEoMCknKTtcclxuICAgICAgICAgICAgICAgIG1hID0gdGFiQ29udGFpbmVyLmZpbmQoJz4gLnRhYnMgPiBsaSA+IGFbaHJlZj0jJyArIHRhYi5nZXQoMCkuaWQgKyAnXScpO1xyXG4gICAgICAgICAgICAgICAgbWkgPSBtYS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAobWVudWl0ZW1PclNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIG1hID0gJChtZW51aXRlbU9yU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAobWEuaXMoJ2xpJykpIHtcclxuICAgICAgICAgICAgICAgIG1pID0gbWE7XHJcbiAgICAgICAgICAgICAgICBtYSA9IG1pLmNoaWxkcmVuKCdhOmVxKDApJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgbWkgPSBtYS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyID0gbWkuY2xvc2VzdCgnLnRhYmJlZCcpO1xyXG4gICAgICAgICAgICB0YWIgPSB0YWJDb250YWluZXIuZmluZCgnPi50YWItYm9keUAwLCA+LnRhYi1ib2R5LWxpc3Q+LnRhYi1ib2R5QDAnLnJlcGxhY2UoL0AwL2csIG1hLmF0dHIoJ2hyZWYnKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyB0YWI6IHRhYiwgbWVudWFuY2hvcjogbWEsIG1lbnVpdGVtOiBtaSwgdGFiQ29udGFpbmVyOiB0YWJDb250YWluZXIgfTtcclxuICAgIH0sXHJcbiAgICBjaGVja1RhYkNvbnRleHQ6IGZ1bmN0aW9uIChjdHgsIGZ1bmN0aW9ubmFtZSwgYXJncywgaXNUZXN0KSB7XHJcbiAgICAgICAgaWYgKCFjdHgudGFiIHx8IGN0eC50YWIubGVuZ3RoICE9IDEgfHxcclxuICAgICAgICAgICAgIWN0eC5tZW51aXRlbSB8fCBjdHgubWVudWl0ZW0ubGVuZ3RoICE9IDEgfHxcclxuICAgICAgICAgICAgIWN0eC50YWJDb250YWluZXIgfHwgY3R4LnRhYkNvbnRhaW5lci5sZW5ndGggIT0gMSB8fCBcclxuICAgICAgICAgICAgIWN0eC5tZW51YW5jaG9yIHx8IGN0eC5tZW51YW5jaG9yLmxlbmd0aCAhPSAxKSB7XHJcbiAgICAgICAgICAgIGlmICghaXNUZXN0ICYmIGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RhYmJlZFVYLicgKyBmdW5jdGlvbm5hbWUgKyAnLCBiYWQgYXJndW1lbnRzOiAnICsgQXJyYXkuam9pbihhcmdzLCAnLCAnKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZm9jdXNUYWInLCBhcmd1bWVudHMsIHRydWUpKSByZXR1cm4gbnVsbDtcclxuICAgICAgICByZXR1cm4gY3R4LnRhYi5nZXQoMCk7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdmb2N1c1RhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gR2V0IHByZXZpb3VzIGZvY3VzZWQgdGFiLCB0cmlnZ2VyICd0YWJVbmZvY3VzZWQnIGhhbmRsZXIgdGhhdCBjYW5cclxuICAgICAgICAvLyBzdG9wIHRoaXMgZm9jdXMgKHJldHVybmluZyBleHBsaWNpdHkgJ2ZhbHNlJylcclxuICAgICAgICB2YXIgcHJldlRhYiA9IGN0eC50YWIuc2libGluZ3MoJy5jdXJyZW50Jyk7XHJcbiAgICAgICAgaWYgKHByZXZUYWIudHJpZ2dlckhhbmRsZXIoJ3RhYlVuZm9jdXNlZCcsIFtjdHhdKSA9PT0gZmFsc2UpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgKGZpcnN0ISkgaWYgdGhlcmUgaXMgYSBwYXJlbnQgdGFiIGFuZCBmb2N1cyBpdCB0b28gKHdpbGwgYmUgcmVjdXJzaXZlIGNhbGxpbmcgdGhpcyBzYW1lIGZ1bmN0aW9uKVxyXG4gICAgICAgIHZhciBwYXJUYWIgPSBjdHgudGFiLnBhcmVudHMoJy50YWItYm9keTplcSgwKScpO1xyXG4gICAgICAgIGlmIChwYXJUYWIubGVuZ3RoID09IDEpIHRoaXMuZm9jdXNUYWIocGFyVGFiKTtcclxuXHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5oYXNDbGFzcygnY3VycmVudCcpIHx8XHJcbiAgICAgICAgICAgIGN0eC5tZW51aXRlbS5oYXNDbGFzcygnZGlzYWJsZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBVbnNldCBjdXJyZW50IG1lbnUgZWxlbWVudFxyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaWJsaW5ncygnLmN1cnJlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpXHJcbiAgICAgICAgICAgIC5maW5kKCc+YScpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgLy8gU2V0IGN1cnJlbnQgbWVudSBlbGVtZW50XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgY3R4Lm1lbnVhbmNob3IuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuXHJcbiAgICAgICAgLy8gSGlkZSBjdXJyZW50IHRhYi1ib2R5XHJcbiAgICAgICAgcHJldlRhYi5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIC8vIFNob3cgY3VycmVudCB0YWItYm9keSBhbmQgdHJpZ2dlciBldmVudFxyXG4gICAgICAgIGN0eC50YWIuYWRkQ2xhc3MoJ2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkZvY3VzZWQnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUYWJJbmRleDogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgdGFiSW5kZXgpIHtcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb2N1c1RhYih0aGlzLmdldFRhYkNvbnRleHQodGFiQ29udGFpbmVyLmZpbmQoJz4udGFiLWJvZHk6ZXEoJyArIHRhYkluZGV4ICsgJyknKSkpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICAvKiBFbmFibGUgYSB0YWIsIGRpc2FibGluZyBhbGwgb3RoZXJzIHRhYnMgLXVzZWZ1bGwgaW4gd2l6YXJkIHN0eWxlIHBhZ2VzLSAqL1xyXG4gICAgZW5hYmxlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZW5hYmxlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBydG4gPSBmYWxzZTtcclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmlzKCcuZGlzYWJsZWQnKSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZGlzYWJsZWQgY2xhc3MgZnJvbSBmb2N1c2VkIHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgICAgIGN0eC50YWIucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJFbmFibGVkJyk7XHJcbiAgICAgICAgICAgIGN0eC5tZW51aXRlbS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgcnRuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRm9jdXMgdGFiOlxyXG4gICAgICAgIHRoaXMuZm9jdXNUYWIoY3R4KTtcclxuICAgICAgICAvLyBEaXNhYmxlZCB0YWJzIGFuZCBtZW51IGl0ZW1zOlxyXG4gICAgICAgIGN0eC50YWIuc2libGluZ3MoJzpub3QoLmRpc2FibGVkKScpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnZGlzYWJsZWQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkRpc2FibGVkJyk7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNpYmxpbmdzKCc6bm90KC5kaXNhYmxlZCknKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgcmV0dXJuIHJ0bjtcclxuICAgIH0sXHJcbiAgICBzaG93aGlkZUR1cmF0aW9uOiAwLFxyXG4gICAgc2hvd2hpZGVFYXNpbmc6IG51bGwsXHJcbiAgICBzaG93VGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnc2hvd1RhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTaG93IHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgY3R4LnRhYi5zaG93KHRoaXMuc2hvd2hpZGVEdXJhdGlvbik7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNob3codGhpcy5zaG93aGlkZUVhc2luZyk7XHJcbiAgICB9LFxyXG4gICAgaGlkZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2hpZGVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2hvdyB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgIGN0eC50YWIuaGlkZSh0aGlzLnNob3doaWRlRHVyYXRpb24pO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5oaWRlKHRoaXMuc2hvd2hpZGVFYXNpbmcpO1xyXG4gICAgfSxcclxuICAgIHRhYkJvZHlDbGFzc0V4Y2VwdGlvbnM6IHsgJ3RhYi1ib2R5JzogMCwgJ3RhYmJlZCc6IDAsICdjdXJyZW50JzogMCwgJ2Rpc2FibGVkJzogMCB9LFxyXG4gICAgY3JlYXRlVGFiOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCBpZE5hbWUsIGxhYmVsKSB7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyID0gJCh0YWJDb250YWluZXIpO1xyXG4gICAgICAgIC8vIHRhYkNvbnRhaW5lciBtdXN0IGJlIG9ubHkgb25lIGFuZCB2YWxpZCBjb250YWluZXJcclxuICAgICAgICAvLyBhbmQgaWROYW1lIG11c3Qgbm90IGV4aXN0c1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIubGVuZ3RoID09IDEgJiYgdGFiQ29udGFpbmVyLmlzKCcudGFiYmVkJykgJiZcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWROYW1lKSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGFiIGRpdjpcclxuICAgICAgICAgICAgdmFyIHRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICB0YWIuaWQgPSBpZE5hbWU7XHJcbiAgICAgICAgICAgIC8vIFJlcXVpcmVkIGNsYXNzZXNcclxuICAgICAgICAgICAgdGFiLmNsYXNzTmFtZSA9IFwidGFiLWJvZHlcIjtcclxuICAgICAgICAgICAgdmFyICR0YWIgPSAkKHRhYik7XHJcbiAgICAgICAgICAgIC8vIEdldCBhbiBleGlzdGluZyBzaWJsaW5nIGFuZCBjb3B5ICh3aXRoIHNvbWUgZXhjZXB0aW9ucykgdGhlaXIgY3NzIGNsYXNzZXNcclxuICAgICAgICAgICAgJC5lYWNoKHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYi1ib2R5OmVxKDApJykuYXR0cignY2xhc3MnKS5zcGxpdCgvXFxzKy8pLCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEodiBpbiBUYWJiZWRVWC50YWJCb2R5Q2xhc3NFeGNlcHRpb25zKSlcclxuICAgICAgICAgICAgICAgICAgICAkdGFiLmFkZENsYXNzKHYpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gQWRkIHRvIGNvbnRhaW5lclxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuYXBwZW5kKHRhYik7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgbWVudSBlbnRyeVxyXG4gICAgICAgICAgICB2YXIgbWVudWl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB0YWIsIGlzIGEgZHluYW1pY2FsbHkgcmVtb3ZhYmxlIHRhYjpcclxuICAgICAgICAgICAgbWVudWl0ZW0uY2xhc3NOYW1lID0gXCJyZW1vdmFibGVcIjtcclxuICAgICAgICAgICAgdmFyIG1lbnVhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgICAgIG1lbnVhbmNob3Iuc2V0QXR0cmlidXRlKCdocmVmJywgJyMnICsgaWROYW1lKTtcclxuICAgICAgICAgICAgLy8gbGFiZWwgY2Fubm90IGJlIG51bGwgb3IgZW1wdHlcclxuICAgICAgICAgICAgJChtZW51YW5jaG9yKS50ZXh0KGlzRW1wdHlTdHJpbmcobGFiZWwpID8gXCJUYWJcIiA6IGxhYmVsKTtcclxuICAgICAgICAgICAgJChtZW51aXRlbSkuYXBwZW5kKG1lbnVhbmNob3IpO1xyXG4gICAgICAgICAgICAvLyBBZGQgdG8gdGFicyBsaXN0IGNvbnRhaW5lclxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJykuYXBwZW5kKG1lbnVpdGVtKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQsIG9uIHRhYkNvbnRhaW5lciwgd2l0aCB0aGUgbmV3IHRhYiBhcyBkYXRhXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci50cmlnZ2VySGFuZGxlcigndGFiQ3JlYXRlZCcsIFt0YWJdKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0dXBTbGlkZXIodGFiQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICByZW1vdmVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdyZW1vdmVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIE9ubHkgcmVtb3ZlIGlmIGlzIGEgJ3JlbW92YWJsZScgdGFiXHJcbiAgICAgICAgaWYgKCFjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ3JlbW92YWJsZScpICYmICFjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ3ZvbGF0aWxlJykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAvLyBJZiB0YWIgaXMgY3VycmVudGx5IGZvY3VzZWQgdGFiLCBjaGFuZ2UgdG8gZmlyc3QgdGFiXHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5oYXNDbGFzcygnY3VycmVudCcpKVxyXG4gICAgICAgICAgICB0aGlzLmZvY3VzVGFiSW5kZXgoY3R4LnRhYkNvbnRhaW5lciwgMCk7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnJlbW92ZSgpO1xyXG4gICAgICAgIHZhciB0YWJpZCA9IGN0eC50YWIuZ2V0KDApLmlkO1xyXG4gICAgICAgIGN0eC50YWIucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dXBTbGlkZXIoY3R4LnRhYkNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgIC8vIFRyaWdnZXIgZXZlbnQsIG9uIHRhYkNvbnRhaW5lciwgd2l0aCB0aGUgcmVtb3ZlZCB0YWIgaWQgYXMgZGF0YVxyXG4gICAgICAgIGN0eC50YWJDb250YWluZXIudHJpZ2dlckhhbmRsZXIoJ3RhYlJlbW92ZWQnLCBbdGFiaWRdKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBzZXRUYWJUaXRsZTogZnVuY3Rpb24gKHRhYk9yU2VsZWN0b3IsIG5ld1RpdGxlKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGFiT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdzZXRUYWJUaXRsZScsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTZXQgYW4gZW1wdHkgc3RyaW5nIGlzIG5vdCBhbGxvd2VkLCBwcmVzZXJ2ZSBwcmV2aW91c2x5OlxyXG4gICAgICAgIGlmICghaXNFbXB0eVN0cmluZyhuZXdUaXRsZSkpXHJcbiAgICAgICAgICAgIGN0eC5tZW51YW5jaG9yLnRleHQobmV3VGl0bGUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyogTW9yZSBzdGF0aWMgdXRpbGl0aWVzICovXHJcblxyXG4vKiogTG9vayB1cCB0aGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb24gYWRkcmVzcyBhbmQgdHJ5IHRvIGZvY3VzIGEgdGFiIHdpdGggdGhhdFxyXG4gICAgbmFtZSwgaWYgdGhlcmUgaXMgb25lLlxyXG4qKi9cclxuVGFiYmVkVVguZm9jdXNDdXJyZW50TG9jYXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBJZiB0aGUgY3VycmVudCBsb2NhdGlvbiBoYXZlIGEgaGFzaCB2YWx1ZSBidXQgaXMgbm90IGEgSGFzaEJhbmdcclxuICAgIGlmICgvXiNbXiFdLy50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgICAgIC8vIFRyeSBmb2N1cyBhIHRhYiB3aXRoIHRoYXQgbmFtZVxyXG4gICAgICAgIHZhciB0YWIgPSBUYWJiZWRVWC5nZXRUYWIod2luZG93LmxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIGlmICh0YWIpXHJcbiAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRhYik7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiogTG9vayBmb3Igdm9sYXRpbGUgdGFicyBvbiB0aGUgcGFnZSwgaWYgdGhleSBhcmVcclxuICAgIGVtcHR5IG9yIHJlcXVlc3RpbmcgYmVpbmcgJ3ZvbGF0aXplZCcsIHJlbW92ZSBpdC5cclxuKiovXHJcblRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJCgnLnRhYmJlZCA+IC50YWJzID4gLnZvbGF0aWxlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRhYiA9IFRhYmJlZFVYLmdldFRhYihudWxsLCB0aGlzKTtcclxuICAgICAgICBpZiAodGFiICYmICgkKHRhYikuY2hpbGRyZW4oKS5sZW5ndGggPT09IDAgfHwgJCh0YWIpLmZpbmQoJzpub3QoLnRhYmJlZCkgLnZvbGF0aXplLW15LXRhYicpLmxlbmd0aCkpIHtcclxuICAgICAgICAgICAgVGFiYmVkVVgucmVtb3ZlVGFiKHRhYik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUYWJiZWRVWDsiLCIvKiBzbGlkZXItdGFicyBsb2dpYy5cclxuKiBFeGVjdXRlIGluaXQgYWZ0ZXIgVGFiYmVkVVguaW5pdCB0byBhdm9pZCBsYXVuY2ggYW5pbWF0aW9uIG9uIHBhZ2UgbG9hZC5cclxuKiBJdCByZXF1aXJlcyBUYWJiZWRVWCB0aHJvdWdodCBESSBvbiAnaW5pdCcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRTbGlkZXJUYWJzKFRhYmJlZFVYKSB7XHJcbiAgICAkKCcudGFiYmVkLnNsaWRlci10YWJzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgJHRhYnMgPSAkdC5jaGlsZHJlbignLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgdmFyIGMgPSAkdGFic1xyXG4gICAgICAgICAgICAud3JhcEFsbCgnPGRpdiBjbGFzcz1cInRhYi1ib2R5LWxpc3RcIi8+JylcclxuICAgICAgICAgICAgLmVuZCgpLmNoaWxkcmVuKCcudGFiLWJvZHktbGlzdCcpO1xyXG4gICAgICAgICR0YWJzLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjLnN0b3AodHJ1ZSwgZmFsc2UpLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiBjLnNjcm9sbExlZnQoKSArICQodGhpcykucG9zaXRpb24oKS5sZWZ0IH0sIDE0MDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIFNldCBob3Jpem9udGFsIHNjcm9sbCB0byB0aGUgcG9zaXRpb24gb2YgY3VycmVudCBzaG93ZWQgdGFiLCB3aXRob3V0IGFuaW1hdGlvbiAoZm9yIHBhZ2UtaW5pdCk6XHJcbiAgICAgICAgdmFyIGN1cnJlbnRUYWIgPSAkKCR0LmZpbmQoJz4udGFicz5saS5jdXJyZW50PmEnKS5hdHRyKCdocmVmJykpO1xyXG4gICAgICAgIGMuc2Nyb2xsTGVmdChjLnNjcm9sbExlZnQoKSArIGN1cnJlbnRUYWIucG9zaXRpb24oKS5sZWZ0KTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgV2l6YXJkIFRhYmJlZCBGb3Jtcy5cclxuICAgIEl0IHVzZSB0YWJzIHRvIG1hbmFnZSB0aGUgZGlmZmVyZW50IGZvcm1zLXN0ZXBzIGluIHRoZSB3aXphcmQsXHJcbiAgICBsb2FkZWQgYnkgQUpBWCBhbmQgZm9sbG93aW5nIHRvIHRoZSBuZXh0IHRhYi9zdGVwIG9uIHN1Y2Nlc3MuXHJcblxyXG4gICAgUmVxdWlyZSBUYWJiZWRVWCB2aWEgREkgb24gJ2luaXQnXHJcbiAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRUYWJiZWRXaXphcmQoVGFiYmVkVVgsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgbG9hZGluZ0RlbGF5OiAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKFwiYm9keVwiKS5kZWxlZ2F0ZShcIi50YWJiZWQud2l6YXJkIC5uZXh0XCIsIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGZvcm1cclxuICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGN1cnJlbnQgd2l6YXJkIHN0ZXAtdGFiXHJcbiAgICAgICAgdmFyIGN1cnJlbnRTdGVwID0gZm9ybS5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQgY29udGFpbmVyXHJcbiAgICAgICAgdmFyIHdpemFyZCA9IGZvcm0uY2xvc2VzdCgnLnRhYmJlZC53aXphcmQnKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQtbmV4dC1zdGVwXHJcbiAgICAgICAgdmFyIG5leHRTdGVwID0gJCh0aGlzKS5kYXRhKCd3aXphcmQtbmV4dC1zdGVwJyk7XHJcblxyXG4gICAgICAgIHZhciBjdHggPSB7XHJcbiAgICAgICAgICAgIGJveDogY3VycmVudFN0ZXAsXHJcbiAgICAgICAgICAgIGZvcm06IGZvcm1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgICAgICB2YXIgdmFsb2JqZWN0ID0gZm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLmdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pO1xyXG4gICAgICAgICAgICAvLyBWYWxpZGF0aW9uIGlzIGFjdGl2ZWQsIHdhcyBleGVjdXRlZCBhbmQgdGhlIHJlc3VsdCBpcyAnZmFsc2UnOiBiYWQgZGF0YSwgc3RvcCBQb3N0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgICAgIHZhciBjdXN2YWwgPSBmb3JtLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAoY3VzdmFsICYmIGN1c3ZhbC52YWxpZGF0ZSAmJiBjdXN2YWwudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5nb1RvU3VtbWFyeUVycm9ycyhmb3JtKTtcclxuICAgICAgICAgICAgLy8gY3VzdG9tIHZhbGlkYXRpb24gbm90IHBhc3NlZCwgb3V0IVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSYWlzZSBldmVudFxyXG4gICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2JlZ2luU3VibWl0V2l6YXJkU3RlcCcpO1xyXG5cclxuICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIHJldGFyZFxyXG4gICAgICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY3VycmVudFN0ZXAuYmxvY2soYmxvY2tQcmVzZXRzLmxvYWRpbmcpO1xyXG4gICAgICAgIH0sIG9wdGlvbnMubG9hZGluZ0RlbGF5KTtcclxuICAgICAgICBcclxuICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIG9rID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIE1hcmsgYXMgc2F2ZWQ6XHJcbiAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uZ2V0KDApKTtcclxuXHJcbiAgICAgICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogKGZvcm0uYXR0cignYWN0aW9uJykgfHwgJycpLFxyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICAgICAgZGF0YTogZm9ybS5zZXJpYWxpemUoKSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgc3VjY2VzcywgZ28gbmV4dCBzdGVwLCB1c2luZyBjdXN0b20gSlNPTiBBY3Rpb24gZXZlbnQ6XHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5vbignYWpheFN1Y2Nlc3NQb3N0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5leHQtc3RlcFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0U3RlcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBuZXh0IHN0ZXAgaXMgaW50ZXJuYWwgdXJsIChhIG5leHQgd2l6YXJkIHRhYilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eIy8udGVzdChuZXh0U3RlcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2JlZ2luTG9hZFdpemFyZFN0ZXAnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYWJiZWRVWC5lbmFibGVUYWIobmV4dFN0ZXApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9rID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2VuZExvYWRXaXphcmRTdGVwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG5leHQtc3RlcCBVUkkgdGhhdCBpcyBub3QgaW50ZXJuYWwgbGluaywgd2UgbG9hZCBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhuZXh0U3RlcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgICAgICAgICAgICAgaWYgKCFhamF4Q2FsbGJhY2tzLmRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAgICAgICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93aW5nIG5ldyBodG1sOlxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwLmh0bWwobmV3aHRtbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0Zvcm0gPSBjdXJyZW50U3RlcDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnRTdGVwLmlzKCdmb3JtJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0gPSBjdXJyZW50U3RlcC5maW5kKCdmb3JtOmVxKDApJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcigncmVsb2FkZWRIdG1sV2l6YXJkU3RlcCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgICAgICAgICAgY29tcGxldGU6IGFqYXhDYWxsYmFja3MuY29tcGxldGVcclxuICAgICAgICB9KS5jb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2VuZFN1Ym1pdFdpemFyZFN0ZXAnLCBvayk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqIHRpbWVTcGFuIGNsYXNzIHRvIG1hbmFnZSB0aW1lcywgcGFyc2UsIGZvcm1hdCwgY29tcHV0ZS5cclxuSXRzIG5vdCBzbyBjb21wbGV0ZSBhcyB0aGUgQyMgb25lcyBidXQgaXMgdXNlZnVsbCBzdGlsbC5cclxuKiovXHJcbnZhciBUaW1lU3BhbiA9IGZ1bmN0aW9uIChkYXlzLCBob3VycywgbWludXRlcywgc2Vjb25kcywgbWlsbGlzZWNvbmRzKSB7XHJcbiAgICB0aGlzLmRheXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoZGF5cykpIHx8IDA7XHJcbiAgICB0aGlzLmhvdXJzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGhvdXJzKSkgfHwgMDtcclxuICAgIHRoaXMubWludXRlcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChtaW51dGVzKSkgfHwgMDtcclxuICAgIHRoaXMuc2Vjb25kcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChzZWNvbmRzKSkgfHwgMDtcclxuICAgIHRoaXMubWlsbGlzZWNvbmRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KG1pbGxpc2Vjb25kcykpIHx8IDA7XHJcblxyXG4gICAgLy8gaW50ZXJuYWwgdXRpbGl0eSBmdW5jdGlvbiAndG8gc3RyaW5nIHdpdGggdHdvIGRpZ2l0cyBhbG1vc3QnXHJcbiAgICBmdW5jdGlvbiB0KG4pIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihuIC8gMTApICsgJycgKyBuICUgMTA7XHJcbiAgICB9XHJcbiAgICAvKiogU2hvdyBvbmx5IGhvdXJzIGFuZCBtaW51dGVzIGFzIGEgc3RyaW5nIHdpdGggdGhlIGZvcm1hdCBISDptbVxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvU2hvcnRTdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1Nob3J0U3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKTtcclxuICAgICAgICByZXR1cm4gKGggKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArIG0pO1xyXG4gICAgfTtcclxuICAgIC8qKiBTaG93IHRoZSBmdWxsIHRpbWUgYXMgYSBzdHJpbmcsIGRheXMgY2FuIGFwcGVhciBiZWZvcmUgaG91cnMgaWYgdGhlcmUgYXJlIDI0IGhvdXJzIG9yIG1vcmVcclxuICAgICoqL1xyXG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgZCA9ICh0aGlzLmRheXMgPiAwID8gdGhpcy5kYXlzLnRvU3RyaW5nKCkgKyBUaW1lU3Bhbi5kZWNpbWFsc0RlbGltaXRlciA6ICcnKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKSxcclxuICAgICAgICAgICAgcyA9IHQodGhpcy5zZWNvbmRzICsgdGhpcy5taWxsaXNlY29uZHMgLyAxMDAwKTtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBkICtcclxuICAgICAgICAgICAgaCArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgbSArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgcyk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy52YWx1ZU9mID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdmFsdWVPZigpIHtcclxuICAgICAgICAvLyBSZXR1cm4gdGhlIHRvdGFsIG1pbGxpc2Vjb25kcyBjb250YWluZWQgYnkgdGhlIHRpbWVcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmRheXMgKiAoMjQgKiAzNjAwMDAwKSArXHJcbiAgICAgICAgICAgIHRoaXMuaG91cnMgKiAzNjAwMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taW51dGVzICogNjAwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLnNlY29uZHMgKiAxMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHNcclxuICAgICAgICApO1xyXG4gICAgfTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBtaWxsaXNlY29uZHNcclxuKiovXHJcblRpbWVTcGFuLmZyb21NaWxsaXNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWlsbGlzZWNvbmRzKG1pbGxpc2Vjb25kcykge1xyXG4gICAgdmFyIG1zID0gbWlsbGlzZWNvbmRzICUgMTAwMCxcclxuICAgICAgICBzID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAxMDAwKSAlIDYwLFxyXG4gICAgICAgIG0gPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDYwMDAwKSAlIDYwLFxyXG4gICAgICAgIGggPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDM2MDAwMDApICUgMjQsXHJcbiAgICAgICAgZCA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gKDM2MDAwMDAgKiAyNCkpO1xyXG4gICAgcmV0dXJuIG5ldyBUaW1lU3BhbihkLCBoLCBtLCBzLCBtcyk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBzZWNvbmRzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tU2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21TZWNvbmRzKHNlY29uZHMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21NaWxsaXNlY29uZHMoc2Vjb25kcyAqIDEwMDApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgbWludXRlc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbU1pbnV0ZXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWludXRlcyhtaW51dGVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tU2Vjb25kcyhtaW51dGVzICogNjApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgaG91cnNcclxuKiovXHJcblRpbWVTcGFuLmZyb21Ib3VycyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21Ib3Vycyhob3Vycykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbU1pbnV0ZXMoaG91cnMgKiA2MCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBkYXlzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tRGF5cyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21EYXlzKGRheXMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21Ib3VycyhkYXlzICogMjQpO1xyXG59O1xyXG5cclxuLy8gRm9yIHNwYW5pc2ggYW5kIGVuZ2xpc2ggd29ya3MgZ29vZCAnOicgYXMgdW5pdHNEZWxpbWl0ZXIgYW5kICcuJyBhcyBkZWNpbWFsRGVsaW1pdGVyXHJcbi8vIFRPRE86IHRoaXMgbXVzdCBiZSBzZXQgZnJvbSBhIGdsb2JhbCBMQy5pMThuIHZhciBsb2NhbGl6ZWQgZm9yIGN1cnJlbnQgdXNlclxyXG5UaW1lU3Bhbi51bml0c0RlbGltaXRlciA9ICc6JztcclxuVGltZVNwYW4uZGVjaW1hbHNEZWxpbWl0ZXIgPSAnLic7XHJcblRpbWVTcGFuLnBhcnNlID0gZnVuY3Rpb24gKHN0cnRpbWUpIHtcclxuICAgIHN0cnRpbWUgPSAoc3RydGltZSB8fCAnJykuc3BsaXQodGhpcy51bml0c0RlbGltaXRlcik7XHJcbiAgICAvLyBCYWQgc3RyaW5nLCByZXR1cm5zIG51bGxcclxuICAgIGlmIChzdHJ0aW1lLmxlbmd0aCA8IDIpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgLy8gRGVjb3VwbGVkIHVuaXRzOlxyXG4gICAgdmFyIGQsIGgsIG0sIHMsIG1zO1xyXG4gICAgaCA9IHN0cnRpbWVbMF07XHJcbiAgICBtID0gc3RydGltZVsxXTtcclxuICAgIHMgPSBzdHJ0aW1lLmxlbmd0aCA+IDIgPyBzdHJ0aW1lWzJdIDogMDtcclxuICAgIC8vIFN1YnN0cmFjdGluZyBkYXlzIGZyb20gdGhlIGhvdXJzIHBhcnQgKGZvcm1hdDogJ2RheXMuaG91cnMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIGlmIChoLmNvbnRhaW5zKHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpKSB7XHJcbiAgICAgICAgdmFyIGRoc3BsaXQgPSBoLnNwbGl0KHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpO1xyXG4gICAgICAgIGQgPSBkaHNwbGl0WzBdO1xyXG4gICAgICAgIGggPSBkaHNwbGl0WzFdO1xyXG4gICAgfVxyXG4gICAgLy8gTWlsbGlzZWNvbmRzIGFyZSBleHRyYWN0ZWQgZnJvbSB0aGUgc2Vjb25kcyAoYXJlIHJlcHJlc2VudGVkIGFzIGRlY2ltYWwgbnVtYmVycyBvbiB0aGUgc2Vjb25kcyBwYXJ0OiAnc2Vjb25kcy5taWxsaXNlY29uZHMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIG1zID0gTWF0aC5yb3VuZChwYXJzZUZsb2F0KHMucmVwbGFjZSh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyLCAnLicpKSAqIDEwMDAgJSAxMDAwKTtcclxuICAgIC8vIFJldHVybiB0aGUgbmV3IHRpbWUgaW5zdGFuY2VcclxuICAgIHJldHVybiBuZXcgVGltZVNwYW4oZCwgaCwgbSwgcywgbXMpO1xyXG59O1xyXG5UaW1lU3Bhbi56ZXJvID0gbmV3IFRpbWVTcGFuKDAsIDAsIDAsIDAsIDApO1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9faXNaZXJvKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICB0aGlzLmRheXMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLmhvdXJzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taW51dGVzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5zZWNvbmRzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taWxsaXNlY29uZHMgPT09IDBcclxuICAgICk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbE1pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWlsbGlzZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWVPZigpO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxTZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxTZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsTWludXRlcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWludXRlcygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbFNlY29uZHMoKSAvIDYwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsSG91cnMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbEhvdXJzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWludXRlcygpIC8gNjApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxEYXlzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxEYXlzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsSG91cnMoKSAvIDI0KTtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGltZVNwYW47IiwiLyogRXh0cmEgdXRpbGl0aWVzIGFuZCBtZXRob2RzIFxyXG4gKi9cclxudmFyIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG52YXIgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuLyoqIFNob3dzIHRpbWUgYXMgYSBsYXJnZSBzdHJpbmcgd2l0aCB1bml0cyBuYW1lcyBmb3IgdmFsdWVzIGRpZmZlcmVudCB0aGFuIHplcm8uXHJcbiAqKi9cclxuZnVuY3Rpb24gc21hcnRUaW1lKHRpbWUpIHtcclxuICAgIHZhciByID0gW107XHJcbiAgICBpZiAodGltZS5kYXlzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5kYXlzICsgJyBkYXlzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmRheXMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgZGF5Jyk7XHJcbiAgICBpZiAodGltZS5ob3VycyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuaG91cnMgKyAnIGhvdXJzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmhvdXJzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIGhvdXInKTtcclxuICAgIGlmICh0aW1lLm1pbnV0ZXMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLm1pbnV0ZXMgKyAnIG1pbnV0ZXMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWludXRlcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBtaW51dGUnKTtcclxuICAgIGlmICh0aW1lLnNlY29uZHMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLnNlY29uZHMgKyAnIHNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuc2Vjb25kcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBzZWNvbmQnKTtcclxuICAgIGlmICh0aW1lLm1pbGxpc2Vjb25kcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUubWlsbGlzZWNvbmRzICsgJyBtaWxsaXNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWlsbGlzZWNvbmRzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIG1pbGxpc2Vjb25kJyk7XHJcbiAgICByZXR1cm4gci5qb2luKCcsICcpO1xyXG59XHJcblxyXG4vKiogUm91bmRzIGEgdGltZSB0byB0aGUgbmVhcmVzdCAxNSBtaW51dGVzIGZyYWdtZW50LlxyXG5Acm91bmRUbyBzcGVjaWZ5IHRoZSBMQy5yb3VuZGluZ1R5cGVFbnVtIGFib3V0IGhvdyB0byByb3VuZCB0aGUgdGltZSAoZG93biwgbmVhcmVzdCBvciB1cClcclxuKiovXHJcbmZ1bmN0aW9uIHJvdW5kVGltZVRvUXVhcnRlckhvdXIoLyogVGltZVNwYW4gKi90aW1lLCAvKiBtYXRoVXRpbHMucm91bmRpbmdUeXBlRW51bSAqL3JvdW5kVG8pIHtcclxuICAgIHZhciByZXN0RnJvbVF1YXJ0ZXIgPSB0aW1lLnRvdGFsSG91cnMoKSAlIDAuMjU7XHJcbiAgICB2YXIgaG91cnMgPSB0aW1lLnRvdGFsSG91cnMoKTtcclxuICAgIGlmIChyZXN0RnJvbVF1YXJ0ZXIgPiAwLjApIHtcclxuICAgICAgICBzd2l0Y2ggKHJvdW5kVG8pIHtcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLkRvd246XHJcbiAgICAgICAgICAgICAgICBob3VycyAtPSByZXN0RnJvbVF1YXJ0ZXI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLk5lYXJlc3Q6XHJcbiAgICAgICAgICAgICAgICB2YXIgbGltaXQgPSAwLjI1IC8gMjtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN0RnJvbVF1YXJ0ZXIgPj0gbGltaXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBob3VycyArPSAoMC4yNSAtIHJlc3RGcm9tUXVhcnRlcik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzIC09IHJlc3RGcm9tUXVhcnRlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uVXA6XHJcbiAgICAgICAgICAgICAgICBob3VycyArPSAoMC4yNSAtIHJlc3RGcm9tUXVhcnRlcik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gVGltZVNwYW4uZnJvbUhvdXJzKGhvdXJzKTtcclxufVxyXG5cclxuLy8gRXh0ZW5kIGEgZ2l2ZW4gVGltZVNwYW4gb2JqZWN0IHdpdGggdGhlIEV4dHJhIG1ldGhvZHNcclxuZnVuY3Rpb24gcGx1Z0luKFRpbWVTcGFuKSB7XHJcbiAgICBUaW1lU3Bhbi5wcm90b3R5cGUudG9TbWFydFN0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU21hcnRTdHJpbmcoKSB7IHJldHVybiBzbWFydFRpbWUodGhpcyk7IH07XHJcbiAgICBUaW1lU3Bhbi5wcm90b3R5cGUucm91bmRUb1F1YXJ0ZXJIb3VyID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fcm91bmRUb1F1YXJ0ZXJIb3VyKCkgeyByZXR1cm4gcm91bmRUaW1lVG9RdWFydGVySG91ci5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpOyB9O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBzbWFydFRpbWU6IHNtYXJ0VGltZSxcclxuICAgICAgICByb3VuZFRvUXVhcnRlckhvdXI6IHJvdW5kVGltZVRvUXVhcnRlckhvdXIsXHJcbiAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgIH07XHJcbiIsIi8qKlxyXG4gICBBUEkgZm9yIGF1dG9tYXRpYyBjcmVhdGlvbiBvZiBsYWJlbHMgZm9yIFVJIFNsaWRlcnMgKGpxdWVyeS11aSlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICB0b29sdGlwcyA9IHJlcXVpcmUoJy4vdG9vbHRpcHMnKSxcclxuICAgIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKSxcclxuICAgIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbi8qKiBDcmVhdGUgbGFiZWxzIGZvciBhIGpxdWVyeS11aS1zbGlkZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjcmVhdGUoc2xpZGVyKSB7XHJcbiAgICAvLyByZW1vdmUgb2xkIG9uZXM6XHJcbiAgICB2YXIgb2xkID0gc2xpZGVyLnNpYmxpbmdzKCcudWktc2xpZGVyLWxhYmVscycpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlcicpLmdldCgwKSA9PSBzbGlkZXIuZ2V0KDApKTtcclxuICAgIH0pLnJlbW92ZSgpO1xyXG4gICAgLy8gQ3JlYXRlIGxhYmVscyBjb250YWluZXJcclxuICAgIHZhciBsYWJlbHMgPSAkKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLWxhYmVsc1wiLz4nKTtcclxuICAgIGxhYmVscy5kYXRhKCd1aS1zbGlkZXInLCBzbGlkZXIpO1xyXG5cclxuICAgIC8vIFNldHVwIG9mIHVzZWZ1bCB2YXJzIGZvciBsYWJlbCBjcmVhdGlvblxyXG4gICAgdmFyIG1heCA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdtYXgnKSxcclxuICAgICAgICBtaW4gPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnbWluJyksXHJcbiAgICAgICAgc3RlcCA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdzdGVwJyksXHJcbiAgICAgICAgc3RlcHMgPSBNYXRoLmZsb29yKChtYXggLSBtaW4pIC8gc3RlcCk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgYW5kIHBvc2l0aW9uaW5nIGxhYmVsc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gc3RlcHM7IGkrKykge1xyXG4gICAgICAgIC8vIENyZWF0ZSBsYWJlbFxyXG4gICAgICAgIHZhciBsYmwgPSAkKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLWxhYmVsXCI+PHNwYW4gY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWwtdGV4dFwiLz48L2Rpdj4nKTtcclxuICAgICAgICAvLyBTZXR1cCBsYWJlbCB3aXRoIGl0cyB2YWx1ZVxyXG4gICAgICAgIHZhciBsYWJlbFZhbHVlID0gbWluICsgaSAqIHN0ZXA7XHJcbiAgICAgICAgbGJsLmNoaWxkcmVuKCcudWktc2xpZGVyLWxhYmVsLXRleHQnKS50ZXh0KGxhYmVsVmFsdWUpO1xyXG4gICAgICAgIGxibC5kYXRhKCd1aS1zbGlkZXItdmFsdWUnLCBsYWJlbFZhbHVlKTtcclxuICAgICAgICAvLyBQb3NpdGlvbmF0ZVxyXG4gICAgICAgIHBvc2l0aW9uYXRlKGxibCwgaSwgc3RlcHMpO1xyXG4gICAgICAgIC8vIEFkZCB0byBjb250YWluZXJcclxuICAgICAgICBsYWJlbHMuYXBwZW5kKGxibCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlciBmb3IgbGFiZWxzIGNsaWNrIHRvIHNlbGVjdCBpdHMgcG9zaXRpb24gdmFsdWVcclxuICAgIGxhYmVscy5vbignY2xpY2snLCAnLnVpLXNsaWRlci1sYWJlbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsID0gJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXItdmFsdWUnKSxcclxuICAgICAgICAgICAgc2xpZGVyID0gJCh0aGlzKS5wYXJlbnQoKS5kYXRhKCd1aS1zbGlkZXInKTtcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHZhbCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbnNlcnQgbGFiZWxzIGFzIGEgc2libGluZyBvZiB0aGUgc2xpZGVyIChjYW5ub3QgYmUgaW5zZXJ0ZWQgaW5zaWRlKVxyXG4gICAgc2xpZGVyLmFmdGVyKGxhYmVscyk7XHJcbn1cclxuXHJcbi8qKiBQb3NpdGlvbmF0ZSB0byB0aGUgY29ycmVjdCBwb3NpdGlvbiBhbmQgd2lkdGggYW4gVUkgbGFiZWwgYXQgQGxibFxyXG5mb3IgdGhlIHJlcXVpcmVkIHBlcmNlbnRhZ2Utd2lkdGggQHN3XHJcbioqL1xyXG5mdW5jdGlvbiBwb3NpdGlvbmF0ZShsYmwsIGksIHN0ZXBzKSB7XHJcbiAgICB2YXIgc3cgPSAxMDAgLyBzdGVwcztcclxuICAgIHZhciBsZWZ0ID0gaSAqIHN3IC0gc3cgKiAwLjUsXHJcbiAgICAgICAgcmlnaHQgPSAxMDAgLSBsZWZ0IC0gc3csXHJcbiAgICAgICAgYWxpZ24gPSAnY2VudGVyJztcclxuICAgIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgYWxpZ24gPSAnbGVmdCc7XHJcbiAgICAgICAgbGVmdCA9IDA7XHJcbiAgICB9IGVsc2UgaWYgKGkgPT0gc3RlcHMpIHtcclxuICAgICAgICBhbGlnbiA9ICdyaWdodCc7XHJcbiAgICAgICAgcmlnaHQgPSAwO1xyXG4gICAgfVxyXG4gICAgbGJsLmNzcyh7XHJcbiAgICAgICAgJ3RleHQtYWxpZ24nOiBhbGlnbixcclxuICAgICAgICBsZWZ0OiBsZWZ0ICsgJyUnLFxyXG4gICAgICAgIHJpZ2h0OiByaWdodCArICclJ1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBVcGRhdGUgdGhlIHZpc2liaWxpdHkgb2YgbGFiZWxzIG9mIGEganF1ZXJ5LXVpLXNsaWRlciBkZXBlbmRpbmcgaWYgdGhleSBmaXQgaW4gdGhlIGF2YWlsYWJsZSBzcGFjZS5cclxuU2xpZGVyIG5lZWRzIHRvIGJlIHZpc2libGUuXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoc2xpZGVyKSB7XHJcbiAgICAvLyBHZXQgbGFiZWxzIGZvciBzbGlkZXJcclxuICAgIHZhciBsYWJlbHNfYyA9IHNsaWRlci5zaWJsaW5ncygnLnVpLXNsaWRlci1sYWJlbHMnKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXInKS5nZXQoMCkgPT0gc2xpZGVyLmdldCgwKSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBsYWJlbHMgPSBsYWJlbHNfYy5maW5kKCcudWktc2xpZGVyLWxhYmVsLXRleHQnKTtcclxuXHJcbiAgICAvLyBBcHBseSBhdXRvc2l6ZVxyXG4gICAgaWYgKChzbGlkZXIuZGF0YSgnc2xpZGVyLWF1dG9zaXplJykgfHwgZmFsc2UpLnRvU3RyaW5nKCkgPT0gJ3RydWUnKVxyXG4gICAgICAgIGF1dG9zaXplKHNsaWRlciwgbGFiZWxzKTtcclxuXHJcbiAgICAvLyBHZXQgYW5kIGFwcGx5IGxheW91dFxyXG4gICAgdmFyIGxheW91dF9uYW1lID0gc2xpZGVyLmRhdGEoJ3NsaWRlci1sYWJlbHMtbGF5b3V0JykgfHwgJ3N0YW5kYXJkJyxcclxuICAgICAgICBsYXlvdXQgPSBsYXlvdXRfbmFtZSBpbiBsYXlvdXRzID8gbGF5b3V0c1tsYXlvdXRfbmFtZV0gOiBsYXlvdXRzLnN0YW5kYXJkO1xyXG4gICAgbGFiZWxzX2MuYWRkQ2xhc3MoJ2xheW91dC0nICsgbGF5b3V0X25hbWUpO1xyXG4gICAgbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscyk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRvb2x0aXBzXHJcbiAgICB0b29sdGlwcy5jcmVhdGVUb29sdGlwKGxhYmVsc19jLmNoaWxkcmVuKCksIHtcclxuICAgICAgICB0aXRsZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJCh0aGlzKS50ZXh0KCk7IH1cclxuICAgICAgICAsIHBlcnNpc3RlbnQ6IHRydWVcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhdXRvc2l6ZShzbGlkZXIsIGxhYmVscykge1xyXG4gICAgdmFyIHRvdGFsX3dpZHRoID0gMDtcclxuICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0b3RhbF93aWR0aCArPSAkKHRoaXMpLm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBjID0gc2xpZGVyLmNsb3Nlc3QoJy51aS1zbGlkZXItY29udGFpbmVyJyksXHJcbiAgICAgICAgbWF4ID0gcGFyc2VGbG9hdChjLmNzcygnbWF4LXdpZHRoJykpLFxyXG4gICAgICAgIG1pbiA9IHBhcnNlRmxvYXQoYy5jc3MoJ21pbi13aWR0aCcpKTtcclxuICAgIGlmIChtYXggIT0gTnVtYmVyLk5hTiAmJiB0b3RhbF93aWR0aCA+IG1heClcclxuICAgICAgICB0b3RhbF93aWR0aCA9IG1heDtcclxuICAgIGlmIChtaW4gIT0gTnVtYmVyLk5hTiAmJiB0b3RhbF93aWR0aCA8IG1pbilcclxuICAgICAgICB0b3RhbF93aWR0aCA9IG1pbjtcclxuICAgIGMud2lkdGgodG90YWxfd2lkdGgpO1xyXG59XHJcblxyXG4vKiogU2V0IG9mIGRpZmZlcmVudCBsYXlvdXRzIGZvciBsYWJlbHMsIGFsbG93aW5nIGRpZmZlcmVudCBraW5kcyBvZiBcclxucGxhY2VtZW50IGFuZCB2aXN1YWxpemF0aW9uIHVzaW5nIHRoZSBzbGlkZXIgZGF0YSBvcHRpb24gJ2xhYmVscy1sYXlvdXQnLlxyXG5Vc2VkIGJ5ICd1cGRhdGUnLCBhbG1vc3QgdGhlICdzdGFuZGFyZCcgbXVzdCBleGlzdCBhbmQgY2FuIGJlIGluY3JlYXNlZFxyXG5leHRlcm5hbGx5XHJcbioqL1xyXG52YXIgbGF5b3V0cyA9IHt9O1xyXG4vKiogU2hvdyB0aGUgbWF4aW11bSBudW1iZXIgb2YgbGFiZWxzIGluIGVxdWFsbHkgc2l6ZWQgZ2FwcyBidXRcclxudGhlIGxhc3QgbGFiZWwgdGhhdCBpcyBlbnN1cmVkIHRvIGJlIHNob3dlZCBldmVuIGlmIGl0IGNyZWF0ZXNcclxuYSBoaWdoZXIgZ2FwIHdpdGggdGhlIHByZXZpb3VzIG9uZS5cclxuKiovXHJcbmxheW91dHMuc3RhbmRhcmQgPSBmdW5jdGlvbiBzdGFuZGFyZF9sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGVyZSBhcmUgbW9yZSBsYWJlbHMgdGhhbiBhdmFpbGFibGUgc3BhY2VcclxuICAgIC8vIEdldCBtYXhpbXVtIGxhYmVsIHdpZHRoXHJcbiAgICB2YXIgaXRlbV93aWR0aCA9IDA7XHJcbiAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHR3ID0gJCh0aGlzKS5vdXRlcldpZHRoKHRydWUpO1xyXG4gICAgICAgIGlmICh0dyA+PSBpdGVtX3dpZHRoKVxyXG4gICAgICAgICAgICBpdGVtX3dpZHRoID0gdHc7XHJcbiAgICB9KTtcclxuICAgIC8vIElmIHRoZXJlIGlzIHdpZHRoLCBpZiBub3QsIGVsZW1lbnQgaXMgbm90IHZpc2libGUgY2Fubm90IGJlIGNvbXB1dGVkXHJcbiAgICBpZiAoaXRlbV93aWR0aCA+IDApIHtcclxuICAgICAgICAvLyBHZXQgdGhlIHJlcXVpcmVkIHN0ZXBwaW5nIG9mIGxhYmVsc1xyXG4gICAgICAgIHZhciBsYWJlbHNfc3RlcCA9IE1hdGguY2VpbChpdGVtX3dpZHRoIC8gKHNsaWRlci53aWR0aCgpIC8gbGFiZWxzLmxlbmd0aCkpLFxyXG4gICAgICAgIGxhYmVsc19zdGVwcyA9IGxhYmVscy5sZW5ndGggLyBsYWJlbHNfc3RlcDtcclxuICAgICAgICBpZiAobGFiZWxzX3N0ZXAgPiAxKSB7XHJcbiAgICAgICAgICAgIC8vIEhpZGUgdGhlIGxhYmVscyBvbiBwb3NpdGlvbnMgb3V0IG9mIHRoZSBzdGVwXHJcbiAgICAgICAgICAgIHZhciBuZXdpID0gMCxcclxuICAgICAgICAgICAgICAgIGxpbWl0ID0gbGFiZWxzLmxlbmd0aCAtIDEgLSBsYWJlbHNfc3RlcDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYWJlbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBsYmwgPSAkKGxhYmVsc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKGkgKyAxKSA8IGxhYmVscy5sZW5ndGggJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgIGkgJSBsYWJlbHNfc3RlcCB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGkgPiBsaW1pdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgbGJsLmhpZGUoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvd1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYmwuc2hvdygpLnBhcmVudCgpLmFkZENsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwb3NpdGlvbmF0ZSBwYXJlbnRcclxuICAgICAgICAgICAgICAgICAgICAvLyBwb3NpdGlvbmF0ZShwYXJlbnQsIG5ld2ksIGxhYmVsc19zdGVwcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aSsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4vKiogU2hvdyBsYWJlbHMgbnVtYmVyIHZhbHVlcyBmb3JtYXR0ZWQgYXMgaG91cnMsIHdpdGggb25seVxyXG5pbnRlZ2VyIGhvdXJzIGJlaW5nIHNob3dlZCwgdGhlIG1heGltdW0gbnVtYmVyIG9mIGl0LlxyXG4qKi9cclxubGF5b3V0cy5ob3VycyA9IGZ1bmN0aW9uIGhvdXJzX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMsIHNob3dfYWxsKSB7XHJcbiAgICB2YXIgaW50TGFiZWxzID0gc2xpZGVyLmZpbmQoJy5pbnRlZ2VyLWhvdXInKTtcclxuICAgIGlmICghaW50TGFiZWxzLmxlbmd0aCkge1xyXG4gICAgICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdob3VyLXByb2Nlc3NlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHBhcnNlRmxvYXQoJHQudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgIGlmICh2ICE9IE51bWJlci5OYU4pIHtcclxuICAgICAgICAgICAgICAgICAgICB2ID0gbXUucm91bmRUbyh2LCAyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodiAlIDEgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdkZWNpbWFsLWhvdXInKS5oaWRlKCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYgJSAwLjUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5wYXJlbnQoKS5hZGRDbGFzcygnc3Ryb25nJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LnRleHQoVGltZVNwYW4uZnJvbUhvdXJzKHYpLnRvU2hvcnRTdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2ludGVnZXItaG91cicpLnNob3coKS5wYXJlbnQoKS5hZGRDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnRMYWJlbHMgPSBpbnRMYWJlbHMuYWRkKCR0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdob3VyLXByb2Nlc3NlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAoc2hvd19hbGwgIT09IHRydWUpXHJcbiAgICAgICAgbGF5b3V0cy5zdGFuZGFyZChzbGlkZXIsIGludExhYmVscy5wYXJlbnQoKSwgaW50TGFiZWxzKTtcclxufTtcclxubGF5b3V0c1snYWxsLXZhbHVlcyddID0gZnVuY3Rpb24gYWxsX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpIHtcclxuICAgIC8vIFNob3dpbmcgYWxsIGxhYmVsc1xyXG4gICAgbGFiZWxzX2Muc2hvdygpLmFkZENsYXNzKCd2aXNpYmxlJykuY2hpbGRyZW4oKS5zaG93KCk7XHJcbn07XHJcbmxheW91dHNbJ2FsbC1ob3VycyddID0gZnVuY3Rpb24gYWxsX2hvdXJzX2xheW91dCgpIHtcclxuICAgIC8vIEp1c3QgdXNlIGhvdXJzIGxheW91dCBidXQgc2hvd2luZyBhbGwgaW50ZWdlciBob3Vyc1xyXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2guY2FsbChhcmd1bWVudHMsIHRydWUpO1xyXG4gICAgbGF5b3V0cy5ob3Vycy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjcmVhdGU6IGNyZWF0ZSxcclxuICAgIHVwZGF0ZTogdXBkYXRlLFxyXG4gICAgbGF5b3V0czogbGF5b3V0c1xyXG59O1xyXG4iLCIvKiBTZXQgb2YgY29tbW9uIExDIGNhbGxiYWNrcyBmb3IgbW9zdCBBamF4IG9wZXJhdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gQUtBOiBhamF4RXJyb3JQb3B1cEhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkVycm9yKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgLy8gSWYgaXMgYSBjb25uZWN0aW9uIGFib3J0ZWQsIG5vIHNob3cgbWVzc2FnZS5cclxuICAgIC8vIHJlYWR5U3RhdGUgZGlmZmVyZW50IHRvICdkb25lOjQnIG1lYW5zIGFib3J0ZWQgdG9vLCBcclxuICAgIC8vIGJlY2F1c2Ugd2luZG93IGJlaW5nIGNsb3NlZC9sb2NhdGlvbiBjaGFuZ2VkXHJcbiAgICBpZiAobWVzc2FnZSA9PSAnYWJvcnQnIHx8IGp4LnJlYWR5U3RhdGUgIT0gNClcclxuICAgICAgICByZXR1cm47XHJcblxyXG4gICAgdmFyIG0gPSBtZXNzYWdlO1xyXG4gICAgdmFyIGlmcmFtZSA9IG51bGw7XHJcbiAgICBzaXplID0gcG9wdXAuc2l6ZSgnbGFyZ2UnKTtcclxuICAgIHNpemUuaGVpZ2h0IC09IDM0O1xyXG4gICAgaWYgKG0gPT0gJ2Vycm9yJykge1xyXG4gICAgICAgIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShqeC5yZXNwb25zZVRleHQsIHNpemUpO1xyXG4gICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgbSA9IG51bGw7XHJcbiAgICB9ICBlbHNlXHJcbiAgICAgICAgbSA9IG0gKyBcIjsgXCIgKyBleDtcclxuXHJcbiAgICAvLyBCbG9jayBhbGwgd2luZG93LCBub3Qgb25seSBjdXJyZW50IGVsZW1lbnRcclxuICAgICQuYmxvY2tVSShlcnJvckJsb2NrKG0sIG51bGwsIHBvcHVwLnN0eWxlKHNpemUpKSk7XHJcbiAgICBpZiAoaWZyYW1lKVxyXG4gICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgJCgnLmJsb2NrVUkgLmNsb3NlLXBvcHVwJykuY2xpY2soZnVuY3Rpb24gKCkgeyAkLnVuYmxvY2tVSSgpOyByZXR1cm4gZmFsc2U7IH0pO1xyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uQ29tcGxldGUoKSB7XHJcbiAgICAvLyBEaXNhYmxlIGxvYWRpbmdcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxvYWRpbmd0aW1lciB8fCB0aGlzLmxvYWRpbmdUaW1lcik7XHJcbiAgICAvLyBVbmJsb2NrXHJcbiAgICBpZiAodGhpcy5hdXRvVW5ibG9ja0xvYWRpbmcpIHtcclxuICAgICAgICAvLyBEb3VibGUgdW4tbG9jaywgYmVjYXVzZSBhbnkgb2YgdGhlIHR3byBzeXN0ZW1zIGNhbiBiZWluZyB1c2VkOlxyXG4gICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuYm94KTtcclxuICAgICAgICB0aGlzLmJveC51bmJsb2NrKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXJcclxuZnVuY3Rpb24gbGNPblN1Y2Nlc3MoZGF0YSwgdGV4dCwgangpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgLy8gU3VwcG9ydGVkIHRoZSBnZW5lcmljIGN0eC5lbGVtZW50IGZyb20ganF1ZXJ5LnJlbG9hZFxyXG4gICAgaWYgKGN0eC5lbGVtZW50KSBjdHguZm9ybSA9IGN0eC5lbGVtZW50O1xyXG4gICAgLy8gU3BlY2lmaWMgc3R1ZmYgb2YgYWpheEZvcm1zXHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIERvIEpTT04gYWN0aW9uIGJ1dCBpZiBpcyBub3QgSlNPTiBvciB2YWxpZCwgbWFuYWdlIGFzIEhUTUw6XHJcbiAgICBpZiAoIWRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgLy8gQXZvaWQgZW1wdHkgZG9jdW1lbnRzIGJlaW5nIHBhcnNlZCAocmFpc2UgZXJyb3IpXHJcbiAgICAgICAgaWYgKCQudHJpbShkYXRhKSkge1xyXG4gICAgICAgICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYSBtYWxmb3JtZWQgZG9jdW1lbnQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGb3IgJ3JlbG9hZCcgc3VwcG9ydCwgY2hlY2sgdG9vIHRoZSBjb250ZXh0Lm1vZGUsIGFuZCBib3RoIHJlbG9hZCBvciBhamF4Rm9ybXMgY2hlY2sgZGF0YSBhdHRyaWJ1dGUgdG9vXHJcbiAgICAgICAgY3R4LmJveElzQ29udGFpbmVyID0gY3R4LmJveElzQ29udGFpbmVyO1xyXG4gICAgICAgIHZhciByZXBsYWNlQm94Q29udGVudCA9XHJcbiAgICAgICAgICAoY3R4Lm9wdGlvbnMgJiYgY3R4Lm9wdGlvbnMubW9kZSA9PT0gJ3JlcGxhY2UtY29udGVudCcpIHx8XHJcbiAgICAgICAgICBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnO1xyXG5cclxuICAgICAgICAvLyBTdXBwb3J0IGZvciByZWxvYWQsIGF2b2lkaW5nIGltcG9ydGFudCBidWdzIHdpdGggcmVsb2FkaW5nIGJveGVzIHRoYXQgY29udGFpbnMgZm9ybXM6XHJcbiAgICAgICAgLy8gSWYgb3BlcmF0aW9uIGlzIGEgcmVsb2FkLCBkb24ndCBjaGVjayB0aGUgYWpheC1ib3hcclxuICAgICAgICB2YXIgamIgPSBuZXdodG1sO1xyXG4gICAgICAgIGlmICghY3R4LmlzUmVsb2FkKSB7XHJcbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgcmV0dXJuZWQgZWxlbWVudCBpcyB0aGUgYWpheC1ib3gsIGlmIG5vdCwgZmluZFxyXG4gICAgICAgICAgLy8gdGhlIGVsZW1lbnQgaW4gdGhlIG5ld2h0bWw6XHJcbiAgICAgICAgICBqYiA9IG5ld2h0bWwuZmlsdGVyKCcuYWpheC1ib3gnKTtcclxuICAgICAgICAgIGlmIChqYi5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICAgIGlmICghY3R4LmJveElzQ29udGFpbmVyICYmICFqYi5pcygnLmFqYXgtYm94JykpXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbC5maW5kKCcuYWpheC1ib3g6ZXEoMCknKTtcclxuICAgICAgICAgIGlmICghamIgfHwgamIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGFqYXgtYm94LCB1c2UgYWxsIGVsZW1lbnQgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpXHJcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIGJveCBjb250ZW50IHdpdGggdGhlIGNvbnRlbnQgb2YgdGhlIHJldHVybmVkIGJveFxyXG4gICAgICAgICAgICAvLyBvciBhbGwgaWYgdGhlcmUgaXMgbm8gYWpheC1ib3ggaW4gdGhlIHJlc3VsdC5cclxuICAgICAgICAgICAgamIgPSBqYi5pcygnLmFqYXgtYm94JykgPyBqYi5jb250ZW50cygpIDogamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpIHtcclxuICAgICAgICAgIGN0eC5ib3guZW1wdHkoKS5hcHBlbmQoamIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY3R4LmJveElzQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIC8vIGpiIGlzIGNvbnRlbnQgb2YgdGhlIGJveCBjb250YWluZXI6XHJcbiAgICAgICAgICAgIGN0eC5ib3guaHRtbChqYik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gYm94IGlzIGNvbnRlbnQgdGhhdCBtdXN0IGJlIHJlcGxhY2VkIGJ5IHRoZSBuZXcgY29udGVudDpcclxuICAgICAgICAgICAgY3R4LmJveC5yZXBsYWNlV2l0aChqYik7XHJcbiAgICAgICAgICAgIC8vIGFuZCByZWZyZXNoIHRoZSByZWZlcmVuY2UgdG8gYm94IHdpdGggdGhlIG5ldyBlbGVtZW50XHJcbiAgICAgICAgICAgIGN0eC5ib3ggPSBqYjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEl0IHN1cHBvcnRzIG5vcm1hbCBhamF4IGZvcm1zIGFuZCBzdWJmb3JtcyB0aHJvdWdoIGZpZWxkc2V0LmFqYXhcclxuICAgICAgICBpZiAoY3R4LmJveC5pcygnZm9ybS5hamF4JykgfHwgY3R4LmJveC5pcygnZmllbGRzZXQuYWpheCcpKVxyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94O1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2Zvcm0uYWpheDplcSgwKScpO1xyXG4gICAgICAgICAgaWYgKGN0eC5mb3JtLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2ZpZWxkc2V0LmFqYXg6ZXEoMCknKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKFxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50c1xyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBNb3ZlIGZvY3VzIHRvIHRoZSBlcnJvcnMgYXBwZWFyZWQgb24gdGhlIHBhZ2UgKGlmIHRoZXJlIGFyZSk6XHJcbiAgICAgICAgdmFyIHZhbGlkYXRpb25TdW1tYXJ5ID0gamIuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKTtcclxuICAgICAgICBpZiAodmFsaWRhdGlvblN1bW1hcnkubGVuZ3RoKVxyXG4gICAgICAgICAgbW92ZUZvY3VzVG8odmFsaWRhdGlvblN1bW1hcnkpO1xyXG4gICAgICAgIC8vIFRPRE86IEl0IHNlZW1zIHRoYXQgaXQgcmV0dXJucyBhIGRvY3VtZW50LWZyYWdtZW50IGluc3RlYWQgb2YgYSBlbGVtZW50IGFscmVhZHkgaW4gZG9jdW1lbnRcclxuICAgICAgICAvLyBmb3IgY3R4LmZvcm0gKG1heWJlIGpiIHRvbz8pIHdoZW4gdXNpbmcgKiBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnICogXHJcbiAgICAgICAgLy8gKG1heWJlIG9uIG90aGVyIGNhc2VzIHRvbz8pLlxyXG4gICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgW2piLCBjdHguZm9ybSwganhdKTtcclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IGN0eC5mb3JtLmRhdGEoJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJykgfHwgJ0RvbmUhJztcclxuICAgIGN0eC5ib3guYmxvY2soaW5mb0Jsb2NrKG1lc3NhZ2UsIHtcclxuICAgICAgICBjc3M6IHBvcHVwLnN0eWxlKHBvcHVwLnNpemUoJ3NtYWxsJykpXHJcbiAgICB9KSlcclxuICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyBcclxuICAgIH0pO1xyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcblxyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2IGNsYXNzPVwib2stZ28tYm94XCIvPicpO1xyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPHNwYW4gY2xhc3M9XCJzdWNjZXNzLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuU3VjY2Vzc01lc3NhZ2UpKTtcclxuICAgIGlmIChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKVxyXG4gICAgICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhZGRpdGlvbmFsLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpKTtcclxuXHJcbiAgICB2YXIgb2tCdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBvay1hY3Rpb24gY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNva1wiLz4nKS5hcHBlbmQoZGF0YS5Pa0xhYmVsKTtcclxuICAgIHZhciBnb0J0biA9ICcnO1xyXG4gICAgaWYgKGRhdGEuR29VUkwgJiYgZGF0YS5Hb0xhYmVsKSB7XHJcbiAgICAgICAgZ29CdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBnby1hY3Rpb25cIi8+JykuYXR0cignaHJlZicsIGRhdGEuR29VUkwpLmFwcGVuZChkYXRhLkdvTGFiZWwpO1xyXG4gICAgICAgIC8vIEZvcmNpbmcgdGhlICdjbG9zZS1hY3Rpb24nIGluIHN1Y2ggYSB3YXkgdGhhdCBmb3IgaW50ZXJuYWwgbGlua3MgdGhlIHBvcHVwIGdldHMgY2xvc2VkIGluIGEgc2FmZSB3YXk6XHJcbiAgICAgICAgZ29CdG4uY2xpY2soZnVuY3Rpb24gKCkgeyBva0J0bi5jbGljaygpOyBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pOyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWN0aW9ucyBjbGVhcmZpeFwiLz4nKS5hcHBlbmQob2tCdG4pLmFwcGVuZChnb0J0bikpO1xyXG5cclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY3R4LmJveCwgbnVsbCwge1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkge1xyXG4gICAgLy8gSWYgaXMgYSBKU09OIHJlc3VsdDpcclxuICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGlmIChjdHguYm94KVxyXG4gICAgICAgICAgICAvLyBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9yc1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChjdHguYm94KTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMDogZ2VuZXJhbCBzdWNjZXNzIGNvZGUsIHNob3cgbWVzc2FnZSBzYXlpbmcgdGhhdCAnYWxsIHdhcyBmaW5lJ1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdCwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMTogZG8gYSByZWRpcmVjdFxyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDEpIHtcclxuICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMjogc2hvdyBsb2dpbiBwb3B1cCAod2l0aCB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMzogcmVsb2FkIGN1cnJlbnQgcGFnZSBjb250ZW50IHRvIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIC8vIE5vdGU6IHRvIHJlbG9hZCBzYW1lIHVybCBwYWdlIGNvbnRlbnQsIGlzIGJldHRlciByZXR1cm4gdGhlIGh0bWwgZGlyZWN0bHkgZnJvbVxyXG4gICAgICAgICAgICAvLyB0aGlzIGFqYXggc2VydmVyIHJlcXVlc3QuXHJcbiAgICAgICAgICAgIC8vY29udGFpbmVyLnVuYmxvY2soKTsgaXMgYmxvY2tlZCBhbmQgdW5ibG9ja2VkIGFnYWluIGJ5IHRoZSByZWxvYWQgbWV0aG9kOlxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVsb2FkKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA0KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgU3VjY2Vzc01lc3NhZ2UsIGF0dGFjaGluZyBhbmQgZXZlbnQgaGFuZGxlciB0byBnbyB0byBSZWRpcmVjdFVSTFxyXG4gICAgICAgICAgICBjdHguYm94Lm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdC5SZWRpcmVjdFVSTCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5TdWNjZXNzTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNSkge1xyXG4gICAgICAgICAgICAvLyBDaGFuZ2UgbWFpbi1hY3Rpb24gYnV0dG9uIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBidG4gPSBjdHguZm9ybS5maW5kKCcubWFpbi1hY3Rpb24nKTtcclxuICAgICAgICAgICAgdmFyIGRtc2cgPSBidG4uZGF0YSgnZGVmYXVsdC10ZXh0Jyk7XHJcbiAgICAgICAgICAgIGlmICghZG1zZylcclxuICAgICAgICAgICAgICAgIGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnLCBidG4udGV4dCgpKTtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGRhdGEuUmVzdWx0IHx8IGJ0bi5kYXRhKCdzdWNjZXNzLXBvc3QtdGV4dCcpIHx8ICdEb25lISc7XHJcbiAgICAgICAgICAgIGJ0bi50ZXh0KG1zZyk7XHJcbiAgICAgICAgICAgIC8vIEFkZGluZyBzdXBwb3J0IHRvIHJlc2V0IGJ1dHRvbiB0ZXh0IHRvIGRlZmF1bHQgb25lXHJcbiAgICAgICAgICAgIC8vIHdoZW4gdGhlIEZpcnN0IG5leHQgY2hhbmdlcyBoYXBwZW5zIG9uIHRoZSBmb3JtOlxyXG4gICAgICAgICAgICAkKGN0eC5mb3JtKS5vbmUoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBidG4udGV4dChidG4uZGF0YSgnZGVmYXVsdC10ZXh0JykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBmb3IgY3VzdG9tIGhhbmRsZXJzXHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gT2stR28gYWN0aW9ucyBwb3B1cCB3aXRoICdzdWNjZXNzJyBhbmQgJ2FkZGl0aW9uYWwnIG1lc3NhZ2VzLlxyXG4gICAgICAgICAgICBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA3KSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSA3OiBzaG93IG1lc3NhZ2Ugc2F5aW5nIGNvbnRhaW5lZCBhdCBkYXRhLlJlc3VsdC5NZXNzYWdlLlxyXG4gICAgICAgICAgICAvLyBUaGlzIGNvZGUgYWxsb3cgYXR0YWNoIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gaW4gZGF0YS5SZXN1bHQgdG8gZGlzdGluZ3Vpc2hcclxuICAgICAgICAgICAgLy8gZGlmZmVyZW50IHJlc3VsdHMgYWxsIHNob3dpbmcgYSBtZXNzYWdlIGJ1dCBtYXliZSBub3QgYmVpbmcgYSBzdWNjZXNzIGF0IGFsbFxyXG4gICAgICAgICAgICAvLyBhbmQgbWF5YmUgZG9pbmcgc29tZXRoaW5nIG1vcmUgaW4gdGhlIHRyaWdnZXJlZCBldmVudCB3aXRoIHRoZSBkYXRhIG9iamVjdC5cclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICAgIC8vIFVzZXIgQ29kZTogdHJpZ2dlciBjdXN0b20gZXZlbnQgdG8gbWFuYWdlIHJlc3VsdHM6XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeCwgY3R4XSk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gZGF0YS5Db2RlIDwgMFxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhbiBlcnJvciBjb2RlLlxyXG5cclxuICAgICAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybS5nZXQoMCksIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgICAgICAgICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IFwiRXJyb3I6IFwiICsgZGF0YS5Db2RlICsgXCI6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YS5SZXN1bHQgPyAoZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlIDogZGF0YS5SZXN1bHQpIDogJycpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCQoJzxkaXYvPicpLmFwcGVuZChtZXNzYWdlKSwgY3R4LmJveCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXJyb3I6IGxjT25FcnJvcixcclxuICAgICAgICBzdWNjZXNzOiBsY09uU3VjY2VzcyxcclxuICAgICAgICBjb21wbGV0ZTogbGNPbkNvbXBsZXRlLFxyXG4gICAgICAgIGRvSlNPTkFjdGlvbjogZG9KU09OQWN0aW9uXHJcbiAgICB9O1xyXG59IiwiLyogRm9ybXMgc3VibWl0dGVkIHZpYSBBSkFYICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyksXHJcbiAgICB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyk7XHJcblxyXG5qUXVlcnkgPSAkO1xyXG5cclxuLy8gR2xvYmFsIHNldHRpbmdzLCB3aWxsIGJlIHVwZGF0ZWQgb24gaW5pdCBidXQgaXMgYWNjZXNzZWRcclxuLy8gdGhyb3VnaCBjbG9zdXJlIGZyb20gYWxsIGZ1bmN0aW9ucy5cclxuLy8gTk9URTogaXMgc3RhdGljLCBkb2Vzbid0IGFsbG93cyBtdWx0aXBsZSBjb25maWd1cmF0aW9uLCBvbmUgaW5pdCBjYWxsIHJlcGxhY2UgcHJldmlvdXNcclxuLy8gRGVmYXVsdHM6XHJcbnZhciBzZXR0aW5ncyA9IHtcclxuICAgIGxvYWRpbmdEZWxheTogMCxcclxuICAgIGVsZW1lbnQ6IGRvY3VtZW50XHJcbn07XHJcblxyXG4vLyBBZGFwdGVkIGNhbGxiYWNrc1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXIoKSB7XHJcbiAgICBjYWxsYmFja3MuY29tcGxldGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEVycm9yUG9wdXBIYW5kbGVyKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gQ29tbW9uIGxvZ2ljXHJcbiAgICBjYWxsYmFja3MuZXJyb3IuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlcigpIHtcclxuICBjYWxsYmFja3Muc3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG4vKipcclxuICBQZXJmb3JtcyB0aGUgdmFsaWRhdGlvbiBvbiB0aGUgZm9ybSBvciBzdWJmb3JtIGFzIGRldGVybWluZVxyXG4gIHRoZSB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgKEBjdHgpLCByZXR1cm5pbmcgdHJ1ZSBmb3Igc3VjY2Vzc1xyXG4gIGFuZCBmYWxzZSBmb3Igc29tZSBlcnJvciAoZWxlbWVudHMgZ2V0IG1hcmtlZCB3aXRoIHRoZSBlcnJvcixcclxuICBqdXN0IHRoZSBjYWxsZXIgbXVzdCBzdG9wIGFueSB0YXNrIG9uIGZhbHNlKS5cclxuKiovXHJcbmZ1bmN0aW9uIHZhbGlkYXRlRm9ybShjdHgpIHtcclxuICAvLyBWYWxpZGF0aW9uc1xyXG4gIHZhciB2YWxpZGF0aW9uUGFzc2VkID0gdHJ1ZTtcclxuICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3JtcyB0aHJvdWggZmllbGRzZXQuYWpheCwgd2UgbXVzdCBleGVjdXRlIHZhbGlkYXRpb25zIGFuZCB2ZXJpZmljYXRpb25cclxuICAvLyBpbiB0d28gc3RlcHMgYW5kIHVzaW5nIHRoZSByZWFsIGZvcm0gdG8gbGV0IHZhbGlkYXRpb24gbWVjaGFuaXNtIHdvcmtcclxuICB2YXIgaXNTdWJmb3JtID0gY3R4LmZvcm0uaXMoJ2ZpZWxkc2V0LmFqYXgnKTtcclxuICB2YXIgYWN0dWFsRm9ybSA9IGlzU3ViZm9ybSA/IGN0eC5mb3JtLmNsb3Nlc3QoJ2Zvcm0nKSA6IGN0eC5mb3JtLFxyXG4gICAgICBkaXNhYmxlZFN1bW1hcmllcyA9IG5ldyBqUXVlcnkoKSxcclxuICAgICAgZGlzYWJsZWRGaWVsZHMgPSBuZXcgalF1ZXJ5KCk7XHJcblxyXG4gIC8vIE9uIHN1YmZvcm0gdmFsaWRhdGlvbiwgd2UgZG9uJ3Qgd2FudCB0aGUgb3V0c2lkZSBzdWJmb3JtIGVsZW1lbnRzIGFuZCB2YWxpZGF0aW9uLXN1bW1hcnkgY29udHJvbHMgdG8gYmUgYWZmZWN0ZWRcclxuICAvLyBieSB0aGlzIHZhbGlkYXRpb24gKHRvIGF2b2lkIHRvIHNob3cgZXJyb3JzIHRoZXJlIHRoYXQgZG9lc24ndCBpbnRlcmVzdCB0byB0aGUgcmVzdCBvZiB0aGUgZm9ybSlcclxuICAvLyBUbyBmdWxsZmlsbCB0aGlzIHJlcXVpc2l0LCB3ZSBuZWVkIHRvIGhpZGUgaXQgZm9yIHRoZSB2YWxpZGF0b3IgZm9yIGEgd2hpbGUgYW5kIGxldCBvbmx5IGFmZmVjdFxyXG4gIC8vIGFueSBsb2NhbCBzdW1tYXJ5IChpbnNpZGUgdGhlIHN1YmZvcm0pLlxyXG4gIC8vIFRoZSBzYW1lIGZvciBmb3JtIGVsZW1lbnRzIG91dHNpZGUgdGhlIHN1YmZvcm0sIHdlIGRvbid0IHdhbnQgaXRzIGVycm9ycyBmb3Igbm93LlxyXG4gIGlmIChpc1N1YmZvcm0pIHtcclxuICAgIHZhciBvdXRzaWRlRWxlbWVudHMgPSAoZnVuY3Rpb24oZikge1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIE9ubHkgdGhvc2UgdGhhdCBhcmUgb3V0c2lkZSB0aGUgc3ViZm9ybVxyXG4gICAgICAgIHJldHVybiAhJC5jb250YWlucyhmLCB0aGlzKTtcclxuICAgICAgfTtcclxuICAgIH0pKGN0eC5mb3JtLmdldCgwKSk7XHJcblxyXG4gICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBhY3R1YWxGb3JtXHJcbiAgICAuZmluZCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nKVxyXG4gICAgLmZpbHRlcihvdXRzaWRlRWxlbWVudHMpXHJcbiAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAnZmFsc2UnKTtcclxuXHJcbiAgICBkaXNhYmxlZEZpZWxkcyA9IGFjdHVhbEZvcm1cclxuICAgIC5maW5kKCdbZGF0YS12YWw9dHJ1ZV0nKVxyXG4gICAgLmZpbHRlcihvdXRzaWRlRWxlbWVudHMpXHJcbiAgICAuYXR0cignZGF0YS12YWwnLCAnZmFsc2UnKTtcclxuICB9XHJcblxyXG4gIC8vIEZpcnN0IGF0IGFsbCwgaWYgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gIHZhciB2YWxvYmplY3QgPSBhY3R1YWxGb3JtLmRhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlLlxyXG4gIC8vIEN1c3RvbSB2YWxpZGF0aW9uIGNhbiBiZSBhdHRhY2hlZCB0byBmb3JtcyBvciBmaWVsZHNldCwgYnV0XHJcbiAgLy8gdG8gc3VwcG9ydCBzdWJmb3Jtcywgb25seSBleGVjdXRlIGluIHRoZSBjdHguZm9ybSBlbGVtZW50IChjYW4gYmUgXHJcbiAgLy8gYSBmaWVsc2V0IHN1YmZvcm0pIGFuZCBhbnkgY2hpbGRyZW4gZmllbGRzZXQuXHJcbiAgY3R4LmZvcm0uYWRkKGN0eC5mb3JtLmZpbmQoJ2ZpZWxkc2V0JykpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGN1c3ZhbCA9ICQodGhpcykuZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicpO1xyXG4gICAgaWYgKGN1c3ZhbCAmJiBjdXN2YWwudmFsaWRhdGUgJiYgY3VzdmFsLnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnMoY3R4LmZvcm0pO1xyXG4gICAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIFRvIHN1cHBvcnQgc3ViLWZvcm1zLCB3ZSBtdXN0IGNoZWNrIHRoYXQgdmFsaWRhdGlvbnMgZXJyb3JzIGhhcHBlbmVkIGluc2lkZSB0aGVcclxuICAvLyBzdWJmb3JtIGFuZCBub3QgaW4gb3RoZXIgZWxlbWVudHMsIHRvIGRvbid0IHN0b3Agc3VibWl0IG9uIG5vdCByZWxhdGVkIGVycm9ycy5cclxuICAvLyAod2UgYXZvaWQgZXhlY3V0ZSB2YWxpZGF0aW9uIG9uIHRoYXQgZWxlbWVudHMgYnV0IGNvdWxkIGhhcHBlbiBhIHByZXZpb3VzIHZhbGlkYXRpb24pXHJcbiAgLy8gSnVzdCBsb29rIGZvciBtYXJrZWQgZWxlbWVudHM6XHJcbiAgaWYgKGlzU3ViZm9ybSAmJiBjdHguZm9ybS5maW5kKCcuaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmxlbmd0aClcclxuICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuXHJcbiAgLy8gUmUtZW5hYmxlIGFnYWluIHRoYXQgc3VtbWFyaWVzIHByZXZpb3VzbHkgZGlzYWJsZWRcclxuICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgZGlzYWJsZWRTdW1tYXJpZXMuYXR0cignZGF0YS12YWxtc2ctc3VtbWFyeScsICd0cnVlJyk7XHJcbiAgICBkaXNhYmxlZEZpZWxkcy5hdHRyKCdkYXRhLXZhbCcsICd0cnVlJyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdmFsaWRhdGlvblBhc3NlZDtcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuKiBBamF4IEZvcm1zIGdlbmVyaWMgZnVuY3Rpb24uXHJcbiogUmVzdWx0IGV4cGVjdGVkIGlzOlxyXG4qIC0gaHRtbCwgZm9yIHZhbGlkYXRpb24gZXJyb3JzIGZyb20gc2VydmVyLCByZXBsYWNpbmcgY3VycmVudCAuYWpheC1ib3ggY29udGVudFxyXG4qIC0ganNvbiwgd2l0aCBzdHJ1Y3R1cmU6IHsgQ29kZTogaW50ZWdlci1udW1iZXIsIFJlc3VsdDogc3RyaW5nLW9yLW9iamVjdCB9XHJcbiogICBDb2RlIG51bWJlcnM6XHJcbiogICAgLSBOZWdhdGl2ZTogZXJyb3JzLCB3aXRoIGEgUmVzdWx0IG9iamVjdCB7IEVycm9yTWVzc2FnZTogc3RyaW5nIH1cclxuKiAgICAtIFplcm86IHN1Y2Nlc3MgcmVzdWx0LCBpdCBzaG93cyBhIG1lc3NhZ2Ugd2l0aCBjb250ZW50OiBSZXN1bHQgc3RyaW5nLCBlbHNlIGZvcm0gZGF0YSBhdHRyaWJ1dGUgJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJywgZWxzZSBhIGdlbmVyaWMgbWVzc2FnZVxyXG4qICAgIC0gMTogc3VjY2VzcyByZXN1bHQsIFJlc3VsdCBjb250YWlucyBhIFVSTCwgdGhlIHBhZ2Ugd2lsbCBiZSByZWRpcmVjdGVkIHRvIHRoYXQuXHJcbiogICAgLSBNYWpvciAxOiBzdWNjZXNzIHJlc3VsdCwgd2l0aCBjdXN0b20gaGFuZGxlciB0aHJvdWdodCB0aGUgZm9ybSBldmVudCAnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnLlxyXG4qL1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKGV2ZW50KSB7XHJcbiAgICAvLyBDb250ZXh0IHZhciwgdXNlZCBhcyBhamF4IGNvbnRleHQ6XHJcbiAgICB2YXIgY3R4ID0ge307XHJcbiAgICAvLyBEZWZhdWx0IGRhdGEgZm9yIHJlcXVpcmVkIHBhcmFtczpcclxuICAgIGN0eC5mb3JtID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmZvcm0gOiBudWxsKSB8fCAkKHRoaXMpO1xyXG4gICAgY3R4LmJveCA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5ib3ggOiBudWxsKSB8fCBjdHguZm9ybS5jbG9zZXN0KFwiLmFqYXgtYm94XCIpO1xyXG4gICAgdmFyIGFjdGlvbiA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5hY3Rpb24gOiBudWxsKSB8fCBjdHguZm9ybS5hdHRyKCdhY3Rpb24nKSB8fCAnJztcclxuXHJcbiAgICAvLyBDaGVjayB2YWxpZGF0aW9uXHJcbiAgICBpZiAodmFsaWRhdGVGb3JtKGN0eCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIC8vIFZhbGlkYXRpb24gZmFpbGVkLCBzdWJtaXQgY2Fubm90IGNvbnRpbnVlLCBvdXQhXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5jaGFuZ2VkRWxlbWVudHMgOiBudWxsKSB8fCBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBldmVudCB0byBhbGxvdyBzY3JpcHRzIHRvIGhvb2sgYWRkaXRpb25hbCB0YXNrcyBiZWZvcmUgc2VuZCBkYXRhXHJcbiAgICBjdHguZm9ybS50cmlnZ2VyKCdwcmVzdWJtaXQnLCBbY3R4XSk7XHJcblxyXG4gICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgIH0sIHNldHRpbmdzLmxvYWRpbmdEZWxheSk7XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICB2YXIgZGF0YSA9IGN0eC5mb3JtLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpO1xyXG5cclxuICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiAoYWN0aW9uKSxcclxuICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgc3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlcixcclxuICAgICAgICBjb21wbGV0ZTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTdG9wIG5vcm1hbCBQT1NUOlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBQdWJsaWMgaW5pdGlhbGl6YXRpb25cclxuZnVuY3Rpb24gaW5pdEFqYXhGb3JtcyhvcHRpb25zKSB7XHJcbiAgICAkLmV4dGVuZCh0cnVlLCBzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgdG8gbWFuYWdlIGFqYXggZm9ybXMgKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ3N1Ym1pdCcsICdmb3JtLmFqYXgnLCBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKTtcclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIGZvciBhIHNwZWNpYWwgYWpheCBmb3JtIGNhc2U6IHN1YmZvcm1zLCB1c2luZyBmaWVsZHNldHMuICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdjbGljaycsICdmaWVsZHNldC5hamF4IC5hamF4LWZpZWxkc2V0LXN1Ym1pdCcsXHJcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG5cclxuICAgICAgICAgIGV2ZW50LmRhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm06IGZvcm0sXHJcbiAgICAgICAgICAgIGJveDogZm9ybS5jbG9zZXN0KCcuYWpheC1ib3gnKSxcclxuICAgICAgICAgICAgYWN0aW9uOiBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGNoYW5nZWRFbGVtZW50czogY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCksIGZvcm0uZmluZCgnOmlucHV0W25hbWVdJykpXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuLyogVU5VU0VEP1xyXG5mdW5jdGlvbiBhamF4Rm9ybU1lc3NhZ2VPbkh0bWxSZXR1cm5lZFdpdGhvdXRWYWxpZGF0aW9uRXJyb3JzKGZvcm0sIG1lc3NhZ2UpIHtcclxuICAgIHZhciAkdCA9ICQoZm9ybSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb3JtIGVycm9ycywgc2hvdyBhIHN1Y2Nlc3NmdWwgbWVzc2FnZVxyXG4gICAgaWYgKCR0LmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAkdC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgICAgICBjc3M6IHBvcHVwU3R5bGUocG9wdXBTaXplKCdzbWFsbCcpKVxyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkgeyAkdC51bmJsb2NrKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbiAgICB9XHJcbn1cclxuKi9cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBpbml0QWpheEZvcm1zLFxyXG4gICAgICAgIG9uU3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgb25FcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfTsiLCIvKiBBdXRvIGNhbGN1bGF0ZSBzdW1tYXJ5IG9uIERPTSB0YWdnaW5nIHdpdGggY2xhc3NlcyB0aGUgZWxlbWVudHMgaW52b2x2ZWQuXHJcbiAqL1xyXG52YXIgbnUgPSByZXF1aXJlKCcuL251bWJlclV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMoKSB7XHJcbiAgICAkKCd0YWJsZS5jYWxjdWxhdGUtaXRlbXMtdG90YWxzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVSb3coKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciB0ciA9ICR0LmNsb3Nlc3QoJ3RyJyk7XHJcbiAgICAgICAgICAgIHZhciBpcCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZScpO1xyXG4gICAgICAgICAgICB2YXIgaXEgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKTtcclxuICAgICAgICAgICAgdmFyIGl0ID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXRvdGFsJyk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKG51LmdldE1vbmV5TnVtYmVyKGlwKSAqIG51LmdldE1vbmV5TnVtYmVyKGlxLCAxKSwgaXQpO1xyXG4gICAgICAgICAgICB0ci50cmlnZ2VyKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQodGhpcykuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXByaWNlLCAuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKS5vbignY2hhbmdlJywgY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChjYWxjdWxhdGVSb3cpO1xyXG4gICAgICAgICQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVTdW1tYXJ5KGZvcmNlKSB7XHJcbiAgICAkKCcuY2FsY3VsYXRlLXN1bW1hcnknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciBzID0gYy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeScpO1xyXG4gICAgICAgIHZhciBkID0gYy5maW5kKCd0YWJsZS5jYWxjdWxhdGUtc3VtbWFyeS1ncm91cCcpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGMoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAsIGZlZSA9IDAsIGR1cmF0aW9uID0gMDtcclxuICAgICAgICAgICAgdmFyIGdyb3VwcyA9IHt9O1xyXG4gICAgICAgICAgICBkLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwVG90YWwgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbENoZWNrZWQgPSAkKHRoaXMpLmlzKCcuY2FsY3VsYXRlLWFsbC1pdGVtcycpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQ2hlY2tlZCB8fCBpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuaXMoJzpjaGVja2VkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBUb3RhbCArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbDplcSgwKScpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eTplcSgwKScpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmVlICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWZlZTplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWR1cmF0aW9uOmVxKDApJykpICogcTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRvdGFsICs9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBncm91cHNbJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwJyldID0gZ3JvdXBUb3RhbDtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGdyb3VwVG90YWwsICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihkdXJhdGlvbiwgJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLmZpbmQoJy5ncm91cC10b3RhbC1kdXJhdGlvbicpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgc3VtbWFyeSB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcih0b3RhbCwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS10b3RhbCcpKTtcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZmVlLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWZlZScpKTtcclxuICAgICAgICAgICAgLy8gQW5kIGV2ZXJ5IGdyb3VwIHRvdGFsIHZhbHVlXHJcbiAgICAgICAgICAgIGZvciAodmFyIGcgaW4gZ3JvdXBzKSB7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cHNbZ10sIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktZ3JvdXAtJyArIGcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuY2hhbmdlKGNhbGMpO1xyXG4gICAgICAgIGQub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIGNhbGMpO1xyXG4gICAgICAgIGNhbGMoKTtcclxuICAgICAgICBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnLCB0cnVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSBkZXRhaWwgb2YgYSBwcmljaW5nIHN1bW1hcnksIG9uZSBkZXRhaWwgbGluZSBwZXIgc2VsZWN0ZWQgaXRlbVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkZCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbCcpLFxyXG4gICAgICAgICAgICAkdCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbC10cGwnKS5jaGlsZHJlbigndHI6ZXEoMCknKSxcclxuICAgICAgICAgICAgJGMgPSAkcy5jbG9zZXN0KCdmb3JtJyksXHJcbiAgICAgICAgICAgICRpdGVtcyA9ICRjLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbScpO1xyXG5cclxuICAgICAgICAvLyBEbyBpdCFcclxuICAgICAgICAvLyBSZW1vdmUgb2xkIGxpbmVzXHJcbiAgICAgICAgJGQuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyBDcmVhdGUgbmV3IG9uZXNcclxuICAgICAgICAkaXRlbXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyICRpID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25jZXB0ID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgcHJpY2UgPSBudS5nZXRNb25leU51bWJlcigkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2U6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgcm93IGFuZCBzZXQgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICB2YXIgJHJvdyA9ICR0LmNsb25lKClcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZGV0YWlsLXRwbCcpXHJcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2RldGFpbCcpO1xyXG4gICAgICAgICAgICAgICAgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY29uY2VwdCcpLnRleHQoY29uY2VwdCk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihwcmljZSwgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIHRhYmxlXHJcbiAgICAgICAgICAgICAgICAkZC5hcHBlbmQoJHJvdyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgIHZhciAkYyA9ICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAvLyBJbml0aWFsIGNhbGN1bGF0aW9uXHJcbiAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCk7XHJcbiAgICAvLyBDYWxjdWxhdGUgb24gcmVsZXZhbnQgZm9ybSBjaGFuZ2VzXHJcbiAgICAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLmNoYW5nZSh1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzIGV2ZW50XHJcbiAgICAkYy5vbignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbn1cclxuXHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvblRhYmxlSXRlbXM6IHNldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyxcclxuICAgICAgICBvblN1bW1hcnk6IHNldHVwQ2FsY3VsYXRlU3VtbWFyeSxcclxuICAgICAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5OiB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5LFxyXG4gICAgICAgIG9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5XHJcbiAgICB9OyIsIi8qIEZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBkb2N1bWVudCAob3IgaW4gQGNvbnRhaW5lcilcclxud2l0aCB0aGUgaHRtbDUgYXR0cmlidXRlICdhdXRvZm9jdXMnIChvciBhbHRlcm5hdGl2ZSBAY3NzU2VsZWN0b3IpLlxyXG5JdCdzIGZpbmUgYXMgYSBwb2x5ZmlsbCBhbmQgZm9yIGFqYXggbG9hZGVkIGNvbnRlbnQgdGhhdCB3aWxsIG5vdFxyXG5nZXQgdGhlIGJyb3dzZXIgc3VwcG9ydCBvZiB0aGUgYXR0cmlidXRlLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZvY3VzKGNvbnRhaW5lciwgY3NzU2VsZWN0b3IpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8IGRvY3VtZW50KTtcclxuICAgIGNvbnRhaW5lci5maW5kKGNzc1NlbGVjdG9yIHx8ICdbYXV0b2ZvY3VzXScpLmZvY3VzKCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0ZvY3VzOyIsIi8qKiBBdXRvLWZpbGwgbWVudSBzdWItaXRlbXMgdXNpbmcgdGFiYmVkIHBhZ2VzIC1vbmx5IHdvcmtzIGZvciBjdXJyZW50IHBhZ2UgaXRlbXMtICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdXRvZmlsbFN1Ym1lbnUoKSB7XHJcbiAgICAkKCcuYXV0b2ZpbGwtc3VibWVudSAuY3VycmVudCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRtZW51ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBzdWJtZW51IGVsZW1lbnRzIGZyb20gdGFicyBtYXJrZWQgd2l0aCBjbGFzcyAnYXV0b2ZpbGwtc3VibWVudS1pdGVtcydcclxuICAgICAgICB2YXIgaXRlbXMgPSAkKCcuYXV0b2ZpbGwtc3VibWVudS1pdGVtcyBsaTpub3QoLnJlbW92YWJsZSknKTtcclxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBpdGVtcywgY3JlYXRlIHRoZSBzdWJtZW51IGNsb25pbmcgaXQhXHJcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHN1Ym1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHBhcmVudG1lbnUuYXBwZW5kKHN1Ym1lbnUpO1xyXG4gICAgICAgICAgICAvLyBDbG9uaW5nIHdpdGhvdXQgZXZlbnRzOlxyXG4gICAgICAgICAgICB2YXIgbmV3aXRlbXMgPSBpdGVtcy5jbG9uZShmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAkKHN1Ym1lbnUpLmFwcGVuZChuZXdpdGVtcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIGF0dGFjaCBldmVudHMgdG8gbWFpbnRhaW4gdGhlIHRhYmJlZCBpbnRlcmZhY2Ugd29ya2luZ1xyXG4gICAgICAgICAgICAvLyBOZXcgSXRlbXMgKGNsb25lZCkgbXVzdCBjaGFuZ2UgdGFiczpcclxuICAgICAgICAgICAgbmV3aXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBpbiB0aGUgb3JpZ2luYWwgaXRlbVxyXG4gICAgICAgICAgICAgICAgJChcImFbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIsIGl0ZW1zKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTdG9wIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gT3JpZ2luYWwgaXRlbXMgbXVzdCBjaGFuZ2UgbWVudTpcclxuICAgICAgICAgICAgaXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbmV3aXRlbXMucGFyZW50KCkuZmluZChcImFcIikucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKS5cclxuICAgICAgICAgICAgICAgIGZpbHRlcihcIipbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG5NYW5hZ2UgYWxsIHRoYXQgZXZlbnRzIGF0dGFjaGVkIHRvIGRhdGVzIG1hZGUgdW5hdmFpbGFibGUgYnkgdGhlIHVzZXJcclxudG8gbm90aWZ5IGFib3V0IHdoYXQgdGhhdCBtZWFucy5cclxuXHJcbk1hZGUgZm9yIHVzZSBpbiB0aGUgTW9udGhseSBjYWxlbmRhciwgbWF5YmUgcmV1c2FibGUuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIG9iamVjdFV0aWxzID0gcmVxdWlyZSgnLi9vYmplY3RVdGlscycpO1xyXG5yZXF1aXJlKFwiZGF0ZS1mb3JtYXQtbGl0ZVwiKTtcclxuXHJcbi8qKlxyXG5UaGUgQGVsZW1lbnQgbXVzdCBiZSBhIGRvbSBlbGVtZW50IGNvbnRhaW5pbmcgdGhhdCB3aWxsIGNvbnRhaW4gdGhlIGluZm9ybWF0aW9uXHJcbmFuZCB3aWxsIHVzZSBhbiB1bCBlbGVtZW50IHRvIGxpc3Qgbm90aWZpY2F0aW9ucy4gVGhlIGVsZW1lbnQgd2lsbCBiZSBoaWRkZW5cclxuaW5pdGlhbGx5IGFuZCBhbnkgdGltZSB0aGF0LCBvbiByZW5kZXJpbmcsIHRoZXJlIGFyZSBub3Qgbm90aWZpY2F0aW9ucy5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQm9va2luZ3NOb3RpZmljYXRpb24oZWxlbWVudCkge1xyXG5cclxuICB0aGlzLiRlbCA9ICQoZWxlbWVudCk7XHJcbiAgdGhpcy4kbGlzdCA9IHRoaXMuJGVsLmZpbmQoJ3VsJyk7XHJcbiAgaWYgKCF0aGlzLiRsaXN0Lmxlbmd0aClcclxuICAgIHRoaXMuJGxpc3QgPSAkKCc8dWwvPicpLmFwcGVuZFRvKHRoaXMuJGVsKTtcclxuXHJcbiAgdGhpcy5yZWdpc3RlcmVkID0ge307XHJcblxyXG4gIHRoaXMucmVnaXN0ZXIgPSBmdW5jdGlvbiByZWdpc3Rlcih0b2dnbGUsIGRhdGEsIHN0ckRhdGUpIHtcclxuICAgIHZhciBsID0gdGhpcy5yZWdpc3RlcmVkO1xyXG4gICAgaWYgKHRvZ2dsZSkge1xyXG4gICAgICAvLyByZWdpc3RlciAoaWYgc29tZXRoaW5nKVxyXG4gICAgICB2YXIgZXZzID0gZGF0YS5zbG90c1tzdHJEYXRlXS5ldmVudHNJZHM7XHJcbiAgICAgIGlmIChldnMpIHtcclxuICAgICAgICBsW3N0ckRhdGVdID0gb2JqZWN0VXRpbHMuZmlsdGVyUHJvcGVydGllcyhkYXRhLmV2ZW50cywgZnVuY3Rpb24gKGspIHsgcmV0dXJuIGV2cy5pbmRleE9mKGspICE9IC0xOyB9KTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gdW5yZWdpc3RlclxyXG4gICAgICBkZWxldGUgbFtzdHJEYXRlXTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcclxuICAgIC8vIFJlbmV3IHRoZSBsaXN0XHJcbiAgICB0aGlzLiRsaXN0LmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcblxyXG4gICAgdmFyIGhhc05vdGlmaWNhdGlvbnMgPSBmYWxzZTtcclxuXHJcbiAgICBmb3IgKHZhciBzdHJEYXRlIGluIHRoaXMucmVnaXN0ZXJlZCkge1xyXG4gICAgICBpZiAoIXRoaXMucmVnaXN0ZXJlZC5oYXNPd25Qcm9wZXJ0eShzdHJEYXRlKSkgY29udGludWU7XHJcblxyXG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5yZWdpc3RlcmVkW3N0ckRhdGVdO1xyXG4gICAgICB2YXIgZGF0ZSA9IGRhdGVJU08ucGFyc2Uoc3RyRGF0ZSkuZm9ybWF0KCdERERELCBNTU0gRCcpO1xyXG4gICAgICB2YXIgbXNnID0gJCgnPHNwYW4vPicpLnRleHQoZGF0ZSArIFwiOiBcIikub3V0ZXJIdG1sKCk7XHJcblxyXG4gICAgICB2YXIgZXZlbnRzSHRtbCA9IFtdO1xyXG4gICAgICBmb3IgKHZhciBwIGluIGV2ZW50cykge1xyXG4gICAgICAgIGlmICghZXZlbnRzLmhhc093blByb3BlcnR5KHApKSBjb250aW51ZTtcclxuICAgICAgICB2YXIgZXYgPSBldmVudHNbcF07XHJcbiAgICAgICAgdmFyIGl0ZW0gPSAkKCc8YSB0YXJnZXQ9XCJfYmxhbmtcIiAvPicpLmF0dHIoJ2hyZWYnLCBldi51cmwpLnRleHQoZXYuc3VtbWFyeSB8fCAnYm9va2luZycpO1xyXG4gICAgICAgIGV2ZW50c0h0bWwucHVzaChpdGVtLm91dGVySHRtbCgpKTtcclxuXHJcbiAgICAgICAgaGFzTm90aWZpY2F0aW9ucyA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgbXNnICs9IGV2ZW50c0h0bWwuam9pbignLCAnKTtcclxuXHJcbiAgICAgICQoJzxsaS8+JylcclxuICAgICAgLmh0bWwobXNnKVxyXG4gICAgICAuYXBwZW5kVG8odGhpcy4kbGlzdCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGhhc05vdGlmaWNhdGlvbnMpXHJcbiAgICAgIHRoaXMuJGVsLnNob3coKTtcclxuICAgIGVsc2VcclxuICAgICAgdGhpcy4kZWwuaGlkZSgpO1xyXG5cclxuICB9O1xyXG59OyIsIi8qKlxyXG4gIE1vbnRobHkgY2FsZW5kYXIgY2xhc3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgTGNXaWRnZXQgPSByZXF1aXJlKCcuLi9DWC9MY1dpZGdldCcpLFxyXG4gIGV4dGVuZCA9IHJlcXVpcmUoJy4uL0NYL2V4dGVuZCcpLFxyXG4gIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpLFxyXG4gIG9iamVjdFV0aWxzID0gcmVxdWlyZSgnLi9vYmplY3RVdGlscycpLFxyXG4gIEJvb2tpbmdzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9Cb29raW5nc05vdGlmaWNhdGlvbicpO1xyXG5cclxuLyoqXHJcbiAgUHJpdmF0ZSB1dGlsc1xyXG4qKi9cclxuXHJcbi8qKlxyXG4gIFByZWZldGNoIG5leHQgbW9udGggKGJhc2VkIG9uIHRoZSBnaXZlbiBkYXRlcylcclxuICBOb3RlOiB0aGlzIGNvZGUgaXMgdmVyeSBzaW1pbGFyIHRvIHV0aWxzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2hcclxuKiovXHJcbmZ1bmN0aW9uIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGN1cnJlbnREYXRlc1JhbmdlKSB7XHJcbiAgLy8gV2UgZ2V0IHRoZSBuZXh0IG1vbnRoIGRhdGVzLXJhbmdlLCBidXRcclxuICAvLyB1c2luZyBhcyBiYXNlLWRhdGUgYSBkYXRlIGluc2lkZSBjdXJyZW50IGRpc3BsYXllZCBtb250aCwgdGhhdCBtb3N0IHRpbWVzIGlzXHJcbiAgLy8gbm90IHRoZSBtb250aCBvZiB0aGUgc3RhcnQgZGF0ZSBpbiBjdXJyZW50IGRhdGUsIHRoZW4ganVzdCBmb3J3YXJkIDcgZGF5cyB0aGF0XHJcbiAgLy8gdG8gZW5zdXJlIHdlIHBpY2sgdGhlIGNvcnJlY3QgbW9udGg6XHJcbiAgdmFyIG5leHREYXRlc1JhbmdlID0gdXRpbHMuZGF0ZS5uZXh0TW9udGhXZWVrcyh1dGlscy5kYXRlLmFkZERheXMoY3VycmVudERhdGVzUmFuZ2Uuc3RhcnQsIDcpLCAxLCBtb250aGx5LnNob3dTaXhXZWVrcyk7XHJcbiAgLy8gQXMgd2UgbG9hZCBmdWxsIHdlZWtzLCBtb3N0IHRpbWVzIHRoZSBmaXJzdCB3ZWVrIG9mIGEgbW9udGggaXMgYWxyZWFkeSBsb2FkZWQgYmVjYXVzZSBcclxuICAvLyB0aGUgd2VlayBpcyBzaGFyZWQgd2l0aCB0aGUgcHJldmlvdXMgbW9udGgsIHRoZW4ganVzdCBjaGVjayBpZiB0aGUgc3RhcnQgb2YgdGhlIG5ld1xyXG4gIC8vIHJhbmdlIGlzIGFscmVhZHkgaW4gY2FjaGUgYW5kIHNocmluayB0aGUgcmFuZ2UgdG8gYmUgcmVxdWVzdGVkLCBhdm9pZGluZyBjb25mbGljdCBvblxyXG4gIC8vIGxvYWRpbmcgdGhlIHVkcGF0ZWQgZGF0YSAoaWYgdGhhdCB3ZWVrIHdhcyBiZWluZyBlZGl0ZWQpIGFuZCBmYXN0ZXIgcmVxdWVzdCBsb2FkIHNpbmNlXHJcbiAgLy8gdGhlIHNlcnZlciBuZWVkcyB0byBkbyBsZXNzIGNvbXB1dGF0aW9uOlxyXG4gIHZhciBkID0gbmV4dERhdGVzUmFuZ2Uuc3RhcnQsXHJcbiAgICBzdHJlbmQgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXh0RGF0ZXNSYW5nZS5lbmQpLFxyXG4gICAgc3RyZCA9IGRhdGVJU08uZGF0ZUxvY2FsKGQsIHRydWUpO1xyXG4gIGlmIChtb250aGx5LmRhdGEgJiYgbW9udGhseS5kYXRhLnNsb3RzKVxyXG4gIHdoaWxlIChtb250aGx5LmRhdGEuc2xvdHNbc3RyZF0gJiZcclxuICAgIHN0cmQgPD0gc3RyZW5kKSB7XHJcbiAgICBuZXh0RGF0ZXNSYW5nZS5zdGFydCA9IGQgPSB1dGlscy5kYXRlLmFkZERheXMoZCwgMSk7XHJcbiAgICBzdHJkID0gZGF0ZUlTTy5kYXRlTG9jYWwoZCwgdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXV0aWxzLm1vbnRobHlJc0RhdGFJbkNhY2hlKG1vbnRobHksIG5leHREYXRlc1JhbmdlKSkge1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHZhciBwcmVmZXRjaFF1ZXJ5ID0gdXRpbHMuZGF0ZXNUb1F1ZXJ5KG5leHREYXRlc1JhbmdlKTtcclxuICAgIG1vbnRobHkuZmV0Y2hEYXRhKHByZWZldGNoUXVlcnksIG51bGwsIHRydWUpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbk1vdmUgdGhlIGJpbmRlZCBkYXRlcyB0aGUgYW1vdW50IG9mIEBtb250aHMgc3BlY2lmaWVkLlxyXG5Ob3RlOiBtb3N0IG9mIHRoaXMgY29kZSBpcyBhZGFwdGVkIGZyb20gdXRpbHMubW92ZUJpbmRSYW5nZUluRGF5cyxcclxudGhlIGNvbXBsZXhpdHkgY29tZXMgZnJvbSB0aGUgcHJlZmV0Y2ggZmVhdHVyZSwgbWF5YmUgY2FuIGJlIHRoYXQgbG9naWNcclxuaXNvbGF0ZWQgYW5kIHNoYXJlZD9cclxuKiovXHJcbmZ1bmN0aW9uIG1vdmVCaW5kTW9udGgobW9udGhseSwgbW9udGhzKSB7XHJcbiAgLy8gV2UgZ2V0IHRoZSBuZXh0ICdtb250aHMnIChuZWdhdGl2ZSBmb3IgcHJldmlvdXMpIGRhdGVzLXJhbmdlLCBidXRcclxuICAvLyB1c2luZyBhcyBiYXNlLWRhdGUgYSBkYXRlIGluc2lkZSBjdXJyZW50IGRpc3BsYXllZCBtb250aCwgdGhhdCBtb3N0IHRpbWVzIGlzXHJcbiAgLy8gbm90IHRoZSBtb250aCBvZiB0aGUgc3RhcnQgZGF0ZSBpbiBjdXJyZW50IGRhdGUsIHRoZW4ganVzdCBmb3J3YXJkIDcgZGF5cyB0aGF0XHJcbiAgLy8gdG8gZW5zdXJlIHdlIHBpY2sgdGhlIGNvcnJlY3QgbW9udGg6XHJcbiAgdmFyIGRhdGVzUmFuZ2UgPSB1dGlscy5kYXRlLm5leHRNb250aFdlZWtzKHV0aWxzLmRhdGUuYWRkRGF5cyhtb250aGx5LmRhdGVzUmFuZ2Uuc3RhcnQsIDcpLCBtb250aHMsIG1vbnRobHkuc2hvd1NpeFdlZWtzKTtcclxuXHJcbiAgLy8gQ2hlY2sgY2FjaGUgYmVmb3JlIHRyeSB0byBmZXRjaFxyXG4gIHZhciBpbkNhY2hlID0gdXRpbHMubW9udGhseUlzRGF0YUluQ2FjaGUobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcblxyXG4gIGlmIChpbkNhY2hlKSB7XHJcbiAgICAvLyBKdXN0IHNob3cgdGhlIGRhdGFcclxuICAgIG1vbnRobHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAvLyBQcmVmZXRjaCBleGNlcHQgaWYgdGhlcmUgaXMgb3RoZXIgcmVxdWVzdCBpbiBjb3Vyc2UgKGNhbiBiZSB0aGUgc2FtZSBwcmVmZXRjaCxcclxuICAgIC8vIGJ1dCBzdGlsbCBkb24ndCBvdmVybG9hZCB0aGUgc2VydmVyKVxyXG4gICAgaWYgKG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgbW9udGhseUNoZWNrQW5kUHJlZmV0Y2gobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcbiAgfSBlbHNlIHtcclxuXHJcbiAgICAvLyBTdXBwb3J0IGZvciBwcmVmZXRjaGluZzpcclxuICAgIC8vIEl0cyBhdm9pZGVkIGlmIHRoZXJlIGFyZSByZXF1ZXN0cyBpbiBjb3Vyc2UsIHNpbmNlXHJcbiAgICAvLyB0aGF0IHdpbGwgYmUgYSBwcmVmZXRjaCBmb3IgdGhlIHNhbWUgZGF0YS5cclxuICAgIGlmIChtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHtcclxuICAgICAgLy8gVGhlIGxhc3QgcmVxdWVzdCBpbiB0aGUgcG9vbCAqbXVzdCogYmUgdGhlIGxhc3QgaW4gZmluaXNoXHJcbiAgICAgIC8vIChtdXN0IGJlIG9ubHkgb25lIGlmIGFsbCBnb2VzIGZpbmUpOlxyXG4gICAgICB2YXIgcmVxdWVzdCA9IG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzW21vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgLy8gV2FpdCBmb3IgdGhlIGZldGNoIHRvIHBlcmZvcm0gYW5kIHNldHMgbG9hZGluZyB0byBub3RpZnkgdXNlclxyXG4gICAgICBtb250aGx5LiRlbC5hZGRDbGFzcyhtb250aGx5LmNsYXNzZXMuZmV0Y2hpbmcpO1xyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIG1vdmVCaW5kTW9udGgobW9udGhseSwgbW9udGhzKTtcclxuICAgICAgICBtb250aGx5LiRlbC5yZW1vdmVDbGFzcyhtb250aGx5LmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgbW9udGhseVxyXG4gICAgLmZldGNoRGF0YSh1dGlscy5kYXRlc1RvUXVlcnkoZGF0ZXNSYW5nZSkpXHJcbiAgICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIG1vbnRobHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAgIC8vIFByZWZldGNoXHJcbiAgICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LW1vbnRoIGFuZCBkaXNhYmxlIHByZXYgYnV0dG9uLFxyXG5vciByZW1vdmUgdGhlIG1hcmsgYW5kIGVuYWJsZSBpdCBpZiBpcyBub3QuXHJcblxyXG5VcGRhdGVzIHRoZSBtb250aCBsYWJlbCB0b28gYW5kIHRvZGF5IGJ1dHRvblxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50TW9udGgoJGVsLCBzdGFydERhdGUsIG1vbnRobHkpIHtcclxuICAvLyBFbnN1cmUgdGhlIGRhdGUgdG8gYmUgZnJvbSBjdXJyZW50IG1vbnRoIGFuZCBub3Qgb25lIG9mIHRoZSBsYXRlc3QgZGF0ZXNcclxuICAvLyBvZiB0aGUgcHJldmlvdXMgb25lICh3aGVyZSB0aGUgcmFuZ2Ugc3RhcnQpIGFkZGluZyA3IGRheXMgZm9yIHRoZSBjaGVjazpcclxuICB2YXIgbW9udGhEYXRlID0gdXRpbHMuZGF0ZS5hZGREYXlzKHN0YXJ0RGF0ZSwgNyk7XHJcbiAgdmFyIHllcCA9IHV0aWxzLmRhdGUuaXNJbkN1cnJlbnRNb250aChtb250aERhdGUpO1xyXG4gICRlbC50b2dnbGVDbGFzcyhtb250aGx5LmNsYXNzZXMuY3VycmVudFdlZWssIHllcCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLnByZXZBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxuXHJcbiAgLy8gTW9udGggLSBZZWFyXHJcbiAgdmFyIG1sYmwgPSBtb250aGx5LnRleHRzLm1vbnRoc1ttb250aERhdGUuZ2V0TW9udGgoKV0gKyAnICcgKyBtb250aERhdGUuZ2V0RnVsbFllYXIoKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMubW9udGhMYWJlbCkudGV4dChtbGJsKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMudG9kYXlBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxufVxyXG5cclxuLyoqXHJcbiAgVXBkYXRlIHRoZSBjYWxlbmRhciBkYXRlcyBjZWxscyBmb3IgJ2RheSBvZiB0aGUgbW9udGgnIHZhbHVlc1xyXG4gIGFuZCBudW1iZXIgb2Ygd2Vla3Mvcm93cy5cclxuICBAZGF0ZXNSYW5nZSB7IHN0YXJ0LCBlbmQgfVxyXG4gIEBzbG90c0NvbnRhaW5lciBqUXVlcnktRE9NIGZvciBkYXRlcy1jZWxscyB0Ym9keVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgb2ZmTW9udGhEYXRlQ2xhc3MsIGN1cnJlbnREYXRlQ2xhc3MsIHNsb3REYXRlTGFiZWwsIHNob3dTaXhXZWVrcykge1xyXG4gIHZhciBsYXN0WSxcclxuICAgIGN1cnJlbnRNb250aCA9IHV0aWxzLmRhdGUuYWRkRGF5cyhkYXRlc1JhbmdlLnN0YXJ0LCA3KS5nZXRNb250aCgpLFxyXG4gICAgdG9kYXkgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXcgRGF0ZSgpKTtcclxuXHJcbiAgaXRlcmF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIGZ1bmN0aW9uIChkYXRlLCB4LCB5KSB7XHJcbiAgICBsYXN0WSA9IHk7XHJcbiAgICB0aGlzLmZpbmQoJy4nICsgc2xvdERhdGVMYWJlbCkudGV4dChkYXRlLmdldERhdGUoKSk7XHJcblxyXG4gICAgLy8gTWFyayBkYXlzIG5vdCBpbiB0aGlzIG1vbnRoXHJcbiAgICB0aGlzLnRvZ2dsZUNsYXNzKG9mZk1vbnRoRGF0ZUNsYXNzLCBkYXRlLmdldE1vbnRoKCkgIT0gY3VycmVudE1vbnRoKTtcclxuXHJcbiAgICAvLyBNYXJrIHRvZGF5XHJcbiAgICB0aGlzLnRvZ2dsZUNsYXNzKGN1cnJlbnREYXRlQ2xhc3MsIGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUpID09IHRvZGF5KTtcclxuICB9KTtcclxuXHJcbiAgaWYgKCFzaG93U2l4V2Vla3MpIHtcclxuICAgIC8vIFNvbWUgbW9udGhzIGFyZSA1IHdlZWtzIHdpZGUgYW5kIG90aGVycyA2OyBvdXIgbGF5b3V0IGhhcyBwZXJtYW5lbnQgNiByb3dzL3dlZWtzXHJcbiAgICAvLyBhbmQgd2UgZG9uJ3QgbG9vayB1cCB0aGUgNnRoIHdlZWsgaWYgaXMgbm90IHBhcnQgb2YgdGhlIG1vbnRoIHRoZW4gdGhhdCA2dGggcm93XHJcbiAgICAvLyBtdXN0IGJlIGhpZGRlbiBpZiB0aGVyZSBhcmUgb25seSA1LlxyXG4gICAgLy8gSWYgdGhlIGxhc3Qgcm93IHdhcyB0aGUgNSAoaW5kZXggNCwgemVyby1iYXNlZCksIHRoZSA2dGggaXMgaGlkZGVuOlxyXG4gICAgc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJ3RyOmVxKDUpJykueHRvZ2dsZShsYXN0WSAhPSA0LCB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAwIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAgSXQgZXhlY3V0ZXMgdGhlIGdpdmVuIGNhbGxiYWNrIChAZWFjaENlbGxDYWxsYmFjaykgZm9yIFxyXG4gIGVhY2ggY2VsbCAodGhpcyBpbnNpZGUgdGhlIGNhbGxiYWNrKSBpdGVyYXRlZCBiZXR3ZWVuIHRoZSBAZGF0ZXNSYW5nZVxyXG4gIGluc2lkZSB0aGUgQHNsb3RzQ29udGFpbmVyIChhIHRib2R5IG9yIHRhYmxlIHdpdGggdHItdGQgZGF0ZSBjZWxscylcclxuKiovXHJcbmZ1bmN0aW9uIGl0ZXJhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBlYWNoQ2VsbENhbGxiYWNrKSB7XHJcbiAgdmFyIHgsIHksIGRhdGVDZWxsO1xyXG4gIC8vIEl0ZXJhdGUgZGF0ZXNcclxuICB1dGlscy5kYXRlLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIC8vIGRhdGVzIGFyZSBzb3J0ZWQgYXMgNyBwZXIgcm93IChlYWNoIHdlZWstZGF5KSxcclxuICAgIC8vIGJ1dCByZW1lbWJlciB0aGF0IGRheS1jZWxsIHBvc2l0aW9uIGlzIG9mZnNldCAxIGJlY2F1c2VcclxuICAgIC8vIGVhY2ggcm93IGlzIDggY2VsbHMgKGZpcnN0IGlzIGhlYWRlciBhbmQgcmVzdCA3IGFyZSB0aGUgZGF0YS1jZWxscyBmb3IgZGF0ZXMpXHJcbiAgICAvLyBqdXN0IGxvb2tpbmcgb25seSAndGQncyB3ZSBjYW4gdXNlIHRoZSBwb3NpdGlvbiB3aXRob3V0IG9mZnNldFxyXG4gICAgeCA9IChpICUgNyk7XHJcbiAgICB5ID0gTWF0aC5mbG9vcihpIC8gNyk7XHJcbiAgICBkYXRlQ2VsbCA9IHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCd0cjplcSgnICsgeSArICcpJykuY2hpbGRyZW4oJ3RkOmVxKCcgKyB4ICsgJyknKTtcclxuXHJcbiAgICBlYWNoQ2VsbENhbGxiYWNrLmFwcGx5KGRhdGVDZWxsLCBbZGF0ZSwgeCwgeSwgaV0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICBUb2dnbGUgYSBzZWxlY3RlZCBkYXRlLWNlbGwgYXZhaWxhYmlsaXR5LFxyXG4gIGZvciB0aGUgJ2VkaXRhYmxlJyBtb2RlXHJcbioqL1xyXG5mdW5jdGlvbiB0b2dnbGVEYXRlQXZhaWxhYmlsaXR5KG1vbnRobHksIGNlbGwpIHtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBkYXRhLCBqdXN0IHJldHVybiAoZGF0YSBub3QgbG9hZGVkKVxyXG4gIGlmICghbW9udGhseS5kYXRhIHx8ICFtb250aGx5LmRhdGEuc2xvdHMpIHJldHVybjtcclxuICBcclxuICAvLyBHZXR0aW5nIHRoZSBwb3NpdGlvbiBvZiB0aGUgY2VsbCBpbiB0aGUgbWF0cml4IGZvciBkYXRlLXNsb3RzOlxyXG4gIHZhciB0ciA9IGNlbGwuY2xvc2VzdCgndHInKSxcclxuICAgIHggPSB0ci5maW5kKCd0ZCcpLmluZGV4KGNlbGwpLFxyXG4gICAgeSA9IHRyLmNsb3Nlc3QoJ3Rib2R5JykuZmluZCgndHInKS5pbmRleCh0ciksXHJcbiAgICBkYXlzT2Zmc2V0ID0geSAqIDcgKyB4O1xyXG5cclxuICAvLyBHZXR0aW5nIHRoZSBkYXRlIGZvciB0aGUgY2VsbCBiYXNlZCBvbiB0aGUgc2hvd2VkIGZpcnN0IGRhdGVcclxuICB2YXIgZGF0ZSA9IG1vbnRobHkuZGF0ZXNSYW5nZS5zdGFydDtcclxuICBkYXRlID0gdXRpbHMuZGF0ZS5hZGREYXlzKGRhdGUsIGRheXNPZmZzZXQpO1xyXG4gIHZhciBzdHJEYXRlID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcblxyXG4gIC8vIEdldCBhbmQgdXBkYXRlIGZyb20gdGhlIHVuZGVybGF5aW5nIGRhdGEsIFxyXG4gIC8vIHRoZSBzdGF0dXMgZm9yIHRoZSBkYXRlLCB0b2dnbGluZyBpdDpcclxuICB2YXIgc2xvdCA9IG1vbnRobHkuZGF0YS5zbG90c1tzdHJEYXRlXTtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBzbG90LCBqdXN0IHJldHVybiAoZGF0YSBub3QgbG9hZGVkKVxyXG4gIGlmICghc2xvdCkgcmV0dXJuO1xyXG4gIHNsb3Quc3RhdHVzID0gc2xvdC5zdGF0dXMgPT0gJ3VuYXZhaWxhYmxlJyA/ICdhdmFpbGFibGUnIDogJ3VuYXZhaWxhYmxlJztcclxuICBzbG90LnNvdXJjZSA9ICd1c2VyJztcclxuICBtb250aGx5LmJvb2tpbmdzTm90aWZpY2F0aW9uLnJlZ2lzdGVyKHNsb3Quc3RhdHVzID09ICd1bmF2YWlsYWJsZScsIG1vbnRobHkuZGF0YSwgc3RyRGF0ZSk7XHJcblxyXG4gIC8vIFVwZGF0ZSB2aXN1YWxpemF0aW9uOlxyXG4gIG1vbnRobHkuYmluZERhdGEoKTtcclxufVxyXG5cclxuLyoqXHJcbk1vbnRseSBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIE1vbnRobHkgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5Q2xhc3Nlcywge1xyXG4gIHdlZWtseUNhbGVuZGFyOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudFdlZWs6IHVuZGVmaW5lZCxcclxuICBjdXJyZW50TW9udGg6ICdpcy1jdXJyZW50TW9udGgnLFxyXG4gIG1vbnRobHlDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS1tb250aGx5JyxcclxuICB0b2RheUFjdGlvbjogJ0FjdGlvbnMtdG9kYXknLFxyXG4gIG1vbnRoTGFiZWw6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1tb250aExhYmVsJyxcclxuICBzbG90RGF0ZUxhYmVsOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc2xvdERhdGVMYWJlbCcsXHJcbiAgb2ZmTW9udGhEYXRlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItb2ZmTW9udGhEYXRlJyxcclxuICBjdXJyZW50RGF0ZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWN1cnJlbnREYXRlJyxcclxuICBlZGl0YWJsZTogJ2lzLWVkaXRhYmxlJyxcclxuICBib29raW5nc05vdGlmaWNhdGlvbjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWJvb2tpbmdzTm90aWZpY2F0aW9uJ1xyXG59KSxcclxudGV4dHM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5VGV4dHMsIHtcclxuICBtb250aHM6IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddXHJcbn0pLFxyXG51cmw6ICcvY2FsZW5kYXIvZ2V0LWF2YWlsYWJpbGl0eS8nLFxyXG5zaG93U2l4V2Vla3M6IHRydWUsXHJcbmVkaXRhYmxlOiBmYWxzZSxcclxuXHJcbi8vIE91ciAndmlldycgd2lsbCBiZSBhIHN1YnNldCBvZiB0aGUgZGF0YSxcclxuLy8gZGVsaW1pdGVkIGJ5IHRoZSBuZXh0IHByb3BlcnR5LCBhIGRhdGVzIHJhbmdlOlxyXG5kYXRlc1JhbmdlOiB7IHN0YXJ0OiBudWxsLCBlbmQ6IG51bGwgfSxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhTW9udGhseShkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5zbG90cykgcmV0dXJuO1xyXG5cclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICBjaGVja0N1cnJlbnRNb250aCh0aGlzLiRlbCwgZGF0ZXNSYW5nZS5zdGFydCwgdGhpcyk7XHJcblxyXG4gIHVwZGF0ZURhdGVzQ2VsbHModGhpcy5kYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgdGhpcy5jbGFzc2VzLm9mZk1vbnRoRGF0ZSwgdGhpcy5jbGFzc2VzLmN1cnJlbnREYXRlLCB0aGlzLmNsYXNzZXMuc2xvdERhdGVMYWJlbCwgdGhpcy5zaG93U2l4V2Vla3MpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgdXRpbHMuc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdXRpbHMuc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgLy8gU2V0IGF2YWlsYWJpbGl0eSBvZiBlYWNoIGRhdGUgc2xvdC9jZWxsOlxyXG4gIGl0ZXJhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBmdW5jdGlvbiAoZGF0ZSwgeCwgeSwgaSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIHZhciBzbG90ID0gdGhhdC5kYXRhLnNsb3RzW2RhdGVrZXldO1xyXG4gICAgLy8gU3VwcG9ydCBmb3Igc2ltcGxlIGFuZCBkZXRhaWxlZCBzdGF0dXMgZGVzY3JpcHRpb246XHJcbiAgICB2YXIgZGF0ZVN0YXR1cyA9ICQuaXNQbGFpbk9iamVjdChzbG90KSA/IHNsb3Quc3RhdHVzIDogc2xvdDtcclxuICAgIC8vIERlZmF1bHQgdmFsdWUgZnJvbSBkYXRhOlxyXG4gICAgZGF0ZVN0YXR1cyA9IGRhdGVTdGF0dXMgfHwgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ3Vua25vdyc7XHJcblxyXG4gICAgaWYgKGRhdGVTdGF0dXMpXHJcbiAgICAgIHRoaXMuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyBkYXRlU3RhdHVzKTtcclxuICB9KTtcclxuXHJcbiAgLy8gTm90aWZpY2F0aW9uczpcclxuICB0aGlzLmJvb2tpbmdzTm90aWZpY2F0aW9uLnJlbmRlcigpO1xyXG59LFxyXG5nZXRVcGRhdGVkRGF0YTogZnVuY3Rpb24gZ2V0VXBkYXRlZERhdGEoKSB7XHJcbiAgdmFyIGQgPSB7fTtcclxuICBpZiAodGhpcy5lZGl0YWJsZSkge1xyXG4gICAgLy8gQ29weSBkYXRhLCB3ZSBkb24ndCB3YW50IGNoYW5nZSB0aGUgb3JpZ2luYWw6XHJcbiAgICBleHRlbmQoZCwgdGhpcy5kYXRhKTtcclxuXHJcbiAgICAvLyBGaWx0ZXIgc2xvdHMgdG8gZ2V0IG9ubHkgdGhhdCB1cGRhdGVkIGJ5IGRlIHVzZXI6XHJcbiAgICBkLnNsb3RzID0gb2JqZWN0VXRpbHMuZmlsdGVyUHJvcGVydGllcyhkLnNsb3RzLCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgICByZXR1cm4gdi5zb3VyY2UgPT0gJ3VzZXInO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBkO1xyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBNb250aGx5KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAvLyBSZXVzaW5nIGJhc2UgY29uc3RydWN0b3IgdG9vIGZvciBpbml0aWFsaXppbmc6XHJcbiAgTGNXaWRnZXQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICAvLyBUbyB1c2UgdGhpcyBpbiBjbG9zdXJlczpcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIC8vIEluaXRpYWxpemluZyBzb21lIGRhdGEsIGJlaW5nIGNhcmUgb2YgYW55IHZhbHVlXHJcbiAgLy8gdGhhdCBjb21lcyBmcm9tIG1lcmdpbmcgb3B0aW9ucyBpbnRvICd0aGlzJ1xyXG4gIHRoaXMudXNlciA9IHRoaXMudXNlciB8fCB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcbiAgdGhpcy5xdWVyeSA9IGV4dGVuZCh7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnbW9udGhseS1zY2hlZHVsZSdcclxuICB9LCB0aGlzLnF1ZXJ5KTtcclxuXHJcbiAgLy8gSWYgaXMgbm90IHNldCBieSBjb25zdHJ1Y3RvciBvcHRpb25zLCBnZXQgXHJcbiAgLy8gJ2VkaXRhYmxlJyBmcm9tIGRhdGEsIG9yIGxlZnQgZGVmYXVsdDpcclxuICBpZiAoIShvcHRpb25zICYmIHR5cGVvZiAob3B0aW9ucy5lZGl0YWJsZSkgIT0gJ3VuZGVmaW5lZCcpICYmXHJcbiAgICB0eXBlb2YgKHRoaXMuJGVsLmRhdGEoJ2VkaXRhYmxlJykpICE9ICd1bmRlZmluZWQnKVxyXG4gICAgdGhpcy5lZGl0YWJsZSA9ICEhdGhpcy4kZWwuZGF0YSgnZWRpdGFibGUnKTtcclxuXHJcblxyXG4gIC8vIFNldCBoYW5kbGVycyBmb3IgcHJldi1uZXh0IGFjdGlvbnM6XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnByZXZBY3Rpb24sIGZ1bmN0aW9uIHByZXYoKSB7XHJcbiAgICBtb3ZlQmluZE1vbnRoKHRoYXQsIC0xKTtcclxuICB9KTtcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMubmV4dEFjdGlvbiwgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgIG1vdmVCaW5kTW9udGgodGhhdCwgMSk7XHJcbiAgfSk7XHJcbiAgLy8gSGFuZGxlciBmb3IgdG9kYXkgYWN0aW9uXHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnRvZGF5QWN0aW9uLCBmdW5jdGlvbiB0b2RheSgpIHtcclxuICAgIHRoYXQuYmluZERhdGEodXRpbHMuZGF0ZS5jdXJyZW50TW9udGhXZWVrcyhudWxsLCB0aGlzLnNob3dTaXhXZWVrcykpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBFZGl0YWJsZSBtb2RlXHJcbiAgaWYgKHRoaXMuZWRpdGFibGUpIHtcclxuICAgIHRoaXMucXVlcnkuZWRpdGFibGUgPSB0cnVlO1xyXG4gICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzICsgJyB0ZCcsIGZ1bmN0aW9uIGNsaWNrVG9nZ2xlQXZhaWxhYmlsaXR5KCkge1xyXG4gICAgICB0b2dnbGVEYXRlQXZhaWxhYmlsaXR5KHRoYXQsICQodGhpcykpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLiRlbC5hZGRDbGFzcyh0aGlzLmNsYXNzZXMuZWRpdGFibGUpO1xyXG4gIH1cclxuXHJcbiAgLy8gQ3JlYXRpbmcgdGhlIGJvb2tpbmdzTm90aWZpY2F0aW9uIGVsZW1lbnQsIGJvdGggZWRpdGFibGUgYW5kIHJlYWQtb25seSBtb2Rlcy5cclxuICAvLyBSZWFkLW9ubHkgbW9kZSBuZWVkIGhpZGRlbiB0aGUgZWxlbWVudCBhbmQgdGhhdHMgZG9uZSBvbiBjb25zdHJ1Y3RvciBhbmQgZWRpdGFibGVcclxuICAvLyB3aWxsIHJlbmRlciBpdCBvbiBiaW5kRGF0YVxyXG4gIHRoaXMuYm9va2luZ3NOb3RpZmljYXRpb24gPSBuZXcgQm9va2luZ3NOb3RpZmljYXRpb24odGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuYm9va2luZ3NOb3RpZmljYXRpb24pKTtcclxuXHJcbiAgLy8gU3RhcnQgZmV0Y2hpbmcgY3VycmVudCBtb250aFxyXG4gIHZhciBmaXJzdERhdGVzID0gdXRpbHMuZGF0ZS5jdXJyZW50TW9udGhXZWVrcyhudWxsLCB0aGlzLnNob3dTaXhXZWVrcyk7XHJcbiAgdGhpcy5mZXRjaERhdGEodXRpbHMuZGF0ZXNUb1F1ZXJ5KGZpcnN0RGF0ZXMpKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoZmlyc3REYXRlcyk7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IG1vbnRoIGluIGFkdmFuY2VcclxuICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKHRoYXQsIGZpcnN0RGF0ZXMpO1xyXG4gIH0pO1xyXG5cclxuICBjaGVja0N1cnJlbnRNb250aCh0aGlzLiRlbCwgZmlyc3REYXRlcy5zdGFydCwgdGhpcyk7XHJcblxyXG4gIC8vIFNob3cgZXJyb3IgbWVzc2FnZVxyXG4gIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCB1dGlscy5oYW5kbGVyQ2FsZW5kYXJFcnJvcik7XHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuTW9udGhseS5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIE1vbnRobHkucHJvdG90eXBlLmNsYXNzZXMubW9udGhseUNhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgTW9udGhseSh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vbnRobHk7XHJcbiIsIi8qKlxyXG4gIFdlZWtseSBjYWxlbmRhciBjbGFzc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4uL0NYL0xjV2lkZ2V0JyksXHJcbiAgZXh0ZW5kID0gcmVxdWlyZSgnLi4vQ1gvZXh0ZW5kJyk7XHJcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcclxuXHJcbi8qKlxyXG5XZWVrbHkgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBXZWVrbHkgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IHV0aWxzLndlZWtseUNsYXNzZXMsXHJcbnRleHRzOiB1dGlscy53ZWVrbHlUZXh0cyxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuXHJcbi8vIE91ciAndmlldycgd2lsbCBiZSBhIHN1YnNldCBvZiB0aGUgZGF0YSxcclxuLy8gZGVsaW1pdGVkIGJ5IHRoZSBuZXh0IHByb3BlcnR5LCBhIGRhdGVzIHJhbmdlOlxyXG5kYXRlc1JhbmdlOiB7IHN0YXJ0OiBudWxsLCBlbmQ6IG51bGwgfSxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhV2Vla2x5KGRhdGVzUmFuZ2UpIHtcclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLnNsb3RzKSByZXR1cm47XHJcblxyXG4gIHRoaXMuZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlIHx8IHRoaXMuZGF0ZXNSYW5nZTtcclxuICB2YXIgXHJcbiAgICAgIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpLFxyXG4gICAgICBzbG90cyA9IHNsb3RzQ29udGFpbmVyLmZpbmQoJ3RkJyk7XHJcblxyXG4gIHV0aWxzLmNoZWNrQ3VycmVudFdlZWsodGhpcy4kZWwsIGRhdGVzUmFuZ2Uuc3RhcnQsIHRoaXMpO1xyXG5cclxuICB1dGlscy51cGRhdGVMYWJlbHMoZGF0ZXNSYW5nZSwgdGhpcy4kZWwsIHRoaXMpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgdXRpbHMuc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdXRpbHMuc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgLy8gU2V0IGFsbCBzbG90cyB3aXRoIGRlZmF1bHQgc3RhdHVzXHJcbiAgc2xvdHMuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cyk7XHJcblxyXG4gIGlmICghdGhpcy5kYXRhLnNsb3RzIHx8ICF0aGlzLmRhdGEuc3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHV0aWxzLmRhdGUuZWFjaERhdGVJblJhbmdlKGRhdGVzUmFuZ2Uuc3RhcnQsIGRhdGVzUmFuZ2UuZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIHZhciBkYXRlU2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbZGF0ZWtleV07XHJcbiAgICBpZiAoZGF0ZVNsb3RzKSB7XHJcbiAgICAgIGZvciAocyA9IDA7IHMgPCBkYXRlU2xvdHMubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICB2YXIgc2xvdCA9IGRhdGVTbG90c1tzXTtcclxuICAgICAgICB2YXIgc2xvdENlbGwgPSB1dGlscy5maW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgaSwgc2xvdCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGRlZmF1bHQgc3RhdHVzXHJcbiAgICAgICAgc2xvdENlbGwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cyB8fCAnXycpO1xyXG4gICAgICAgIC8vIEFkZGluZyBzdGF0dXMgY2xhc3NcclxuICAgICAgICBzbG90Q2VsbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIFdlZWtseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB0aGlzLnVzZXIgPSB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICd3ZWVrbHknXHJcbiAgfTtcclxuXHJcbiAgLy8gU3RhcnQgZmV0Y2hpbmcgY3VycmVudCB3ZWVrXHJcbiAgdmFyIGZpcnN0RGF0ZXMgPSB1dGlscy5kYXRlLmN1cnJlbnRXZWVrKCk7XHJcbiAgdGhpcy5mZXRjaERhdGEodXRpbHMuZGF0ZXNUb1F1ZXJ5KGZpcnN0RGF0ZXMpKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoZmlyc3REYXRlcyk7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IHdlZWsgaW4gYWR2YW5jZVxyXG4gICAgdXRpbHMud2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh0aGF0LCBmaXJzdERhdGVzKTtcclxuICB9KTtcclxuICB1dGlscy5jaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBmaXJzdERhdGVzLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgLy8gU2V0IGhhbmRsZXJzIGZvciBwcmV2LW5leHQgYWN0aW9uczpcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMucHJldkFjdGlvbiwgZnVuY3Rpb24gcHJldigpIHtcclxuICAgIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgLTcpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5uZXh0QWN0aW9uLCBmdW5jdGlvbiBuZXh0KCkge1xyXG4gICAgdXRpbHMubW92ZUJpbmRSYW5nZUluRGF5cyh0aGF0LCA3KTtcclxuICB9KTtcclxuXHJcbiAgLy8gU2hvdyBlcnJvciBtZXNzYWdlXHJcbiAgdGhpcy5ldmVudHMub24oJ2hhc0Vycm9yQ2hhbmdlZCcsIHV0aWxzLmhhbmRsZXJDYWxlbmRhckVycm9yKTtcclxuXHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuV2Vla2x5LmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgV2Vla2x5LnByb3RvdHlwZS5jbGFzc2VzLndlZWtseUNhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgV2Vla2x5KHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2Vla2x5O1xyXG4iLCIvKipcclxuICBXb3JrIEhvdXJzIGNhbGVuZGFyIGNsYXNzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIExjV2lkZ2V0ID0gcmVxdWlyZSgnLi4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuLi9DWC9leHRlbmQnKSxcclxuICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuICBjbGVhckN1cnJlbnRTZWxlY3Rpb24gPSByZXF1aXJlKCcuL2NsZWFyQ3VycmVudFNlbGVjdGlvbicpLFxyXG4gIG1ha2VVbnNlbGVjdGFibGUgPSByZXF1aXJlKCcuL21ha2VVbnNlbGVjdGFibGUnKTtcclxucmVxdWlyZSgnLi4vanF1ZXJ5LmJvdW5kcycpO1xyXG5cclxuLyoqXHJcbldvcmsgaG91cnMgcHJpdmF0ZSB1dGlsc1xyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBFZGl0V29ya0hvdXJzKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICAvLyBTZXQgaGFuZGxlcnMgdG8gc3dpdGNoIHN0YXR1cyBhbmQgdXBkYXRlIGJhY2tlbmQgZGF0YVxyXG4gIC8vIHdoZW4gdGhlIHVzZXIgc2VsZWN0IGNlbGxzXHJcbiAgdmFyIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpO1xyXG5cclxuICBmdW5jdGlvbiB0b2dnbGVDZWxsKGNlbGwpIHtcclxuICAgIC8vIEZpbmQgZGF5IGFuZCB0aW1lIG9mIHRoZSBjZWxsOlxyXG4gICAgdmFyIHNsb3QgPSB1dGlscy5maW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCk7XHJcbiAgICAvLyBHZXQgd2Vlay1kYXkgc2xvdHMgYXJyYXk6XHJcbiAgICB2YXIgd2tzbG90cyA9IHRoYXQuZGF0YS5zbG90c1t1dGlscy5zeXN0ZW1XZWVrRGF5c1tzbG90LmRheV1dID0gdGhhdC5kYXRhLnNsb3RzW3V0aWxzLnN5c3RlbVdlZWtEYXlzW3Nsb3QuZGF5XV0gfHwgW107XHJcbiAgICAvLyBJZiBpdCBoYXMgYWxyZWFkeSB0aGUgZGF0YS5zdGF0dXMsIHRvZ2dsZSB0byB0aGUgZGVmYXVsdFN0YXR1c1xyXG4gICAgLy8gIHZhciBzdGF0dXNDbGFzcyA9IHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyxcclxuICAgIC8vICAgICAgZGVmYXVsdFN0YXR1c0NsYXNzID0gdGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cztcclxuICAgIC8vaWYgKGNlbGwuaGFzQ2xhc3Moc3RhdHVzQ2xhc3NcclxuICAgIC8vIFRvZ2dsZSBmcm9tIHRoZSBhcnJheVxyXG4gICAgdmFyIHN0cnNsb3QgPSBkYXRlSVNPLnRpbWVMb2NhbChzbG90LnNsb3QsIHRydWUpLFxyXG4gICAgICBpc2xvdCA9IHdrc2xvdHMuaW5kZXhPZihzdHJzbG90KTtcclxuICAgIGlmIChpc2xvdCA9PSAtMSlcclxuICAgICAgd2tzbG90cy5wdXNoKHN0cnNsb3QpO1xyXG4gICAgZWxzZVxyXG4gICAgLy9kZWxldGUgd2tzbG90c1tpc2xvdF07XHJcbiAgICAgIHdrc2xvdHMuc3BsaWNlKGlzbG90LCAxKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHRvZ2dsZUNlbGxSYW5nZShmaXJzdENlbGwsIGxhc3RDZWxsKSB7XHJcbiAgICB2YXIgXHJcbiAgICAgIHggPSBmaXJzdENlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGZpcnN0Q2VsbCksXHJcbiAgICAgIHkxID0gZmlyc3RDZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKSxcclxuICAgIC8veDIgPSBsYXN0Q2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgobGFzdENlbGwpLFxyXG4gICAgICB5MiA9IGxhc3RDZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKTtcclxuXHJcbiAgICBpZiAoeTEgPiB5Mikge1xyXG4gICAgICB2YXIgeTAgPSB5MTtcclxuICAgICAgeTEgPSB5MjtcclxuICAgICAgeTIgPSB5MDtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciB5ID0geTE7IHkgPD0geTI7IHkrKykge1xyXG4gICAgICB2YXIgY2VsbCA9IGZpcnN0Q2VsbC5jbG9zZXN0KCd0Ym9keScpLmNoaWxkcmVuKCd0cjplcSgnICsgeSArICcpJykuY2hpbGRyZW4oJ3RkOmVxKCcgKyB4ICsgJyknKTtcclxuICAgICAgdG9nZ2xlQ2VsbChjZWxsKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhciBkcmFnZ2luZyA9IHtcclxuICAgIGZpcnN0OiBudWxsLFxyXG4gICAgbGFzdDogbnVsbCxcclxuICAgIHNlbGVjdGlvbkxheWVyOiAkKCc8ZGl2IGNsYXNzPVwiU2VsZWN0aW9uTGF5ZXJcIiAvPicpLmFwcGVuZFRvKHRoaXMuJGVsKSxcclxuICAgIGRvbmU6IGZhbHNlXHJcbiAgfTtcclxuICBcclxuICBmdW5jdGlvbiBvZmZzZXRUb1Bvc2l0aW9uKGVsLCBvZmZzZXQpIHtcclxuICAgIHZhciBwYiA9ICQoZWwub2Zmc2V0UGFyZW50KS5ib3VuZHMoKSxcclxuICAgICAgcyA9IHt9O1xyXG5cclxuICAgIHMudG9wID0gb2Zmc2V0LnRvcCAtIHBiLnRvcDtcclxuICAgIHMubGVmdCA9IG9mZnNldC5sZWZ0IC0gcGIubGVmdDtcclxuXHJcbiAgICAvL3MuYm90dG9tID0gcGIudG9wIC0gb2Zmc2V0LmJvdHRvbTtcclxuICAgIC8vcy5yaWdodCA9IG9mZnNldC5sZWZ0IC0gb2Zmc2V0LnJpZ2h0O1xyXG4gICAgcy5oZWlnaHQgPSBvZmZzZXQuYm90dG9tIC0gb2Zmc2V0LnRvcDtcclxuICAgIHMud2lkdGggPSBvZmZzZXQucmlnaHQgLSBvZmZzZXQubGVmdDtcclxuXHJcbiAgICAkKGVsKS5jc3Mocyk7XHJcbiAgICByZXR1cm4gcztcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVwZGF0ZVNlbGVjdGlvbihlbCkge1xyXG4gICAgdmFyIGEgPSBkcmFnZ2luZy5maXJzdC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgdmFyIGIgPSBlbC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgdmFyIHMgPSBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG5cclxuICAgIHMudG9wID0gYS50b3AgPCBiLnRvcCA/IGEudG9wIDogYi50b3A7XHJcbiAgICBzLmJvdHRvbSA9IGEuYm90dG9tID4gYi5ib3R0b20gPyBhLmJvdHRvbSA6IGIuYm90dG9tO1xyXG5cclxuICAgIG9mZnNldFRvUG9zaXRpb24oZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXJbMF0sIHMpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZmluaXNoRHJhZygpIHtcclxuICAgIGlmIChkcmFnZ2luZy5maXJzdCAmJiBkcmFnZ2luZy5sYXN0KSB7XHJcbiAgICAgIHRvZ2dsZUNlbGxSYW5nZShkcmFnZ2luZy5maXJzdCwgZHJhZ2dpbmcubGFzdCk7XHJcbiAgICAgIHRoYXQuYmluZERhdGEoKTtcclxuXHJcbiAgICAgIGRyYWdnaW5nLmRvbmUgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgZHJhZ2dpbmcuZmlyc3QgPSBkcmFnZ2luZy5sYXN0ID0gbnVsbDtcclxuICAgIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLmhpZGUoKTtcclxuICAgIG1ha2VVbnNlbGVjdGFibGUub2ZmKHRoYXQuJGVsKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgdGhpcy4kZWwuZmluZChzbG90c0NvbnRhaW5lcikub24oJ2NsaWNrJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gRG8gZXhjZXB0IGFmdGVyIGEgZHJhZ2dpbmcgZG9uZSBjb21wbGV0ZVxyXG4gICAgaWYgKGRyYWdnaW5nLmRvbmUpIHJldHVybiBmYWxzZTtcclxuICAgIHRvZ2dsZUNlbGwoJCh0aGlzKSk7XHJcbiAgICB0aGF0LmJpbmREYXRhKCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG4gIHRoaXMuJGVsLmZpbmQoc2xvdHNDb250YWluZXIpXHJcbiAgLm9uKCdtb3VzZWRvd24nLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBkcmFnZ2luZy5kb25lID0gZmFsc2U7XHJcbiAgICBkcmFnZ2luZy5maXJzdCA9ICQodGhpcyk7XHJcbiAgICBkcmFnZ2luZy5sYXN0ID0gbnVsbDtcclxuICAgIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLnNob3coKTtcclxuXHJcbiAgICBtYWtlVW5zZWxlY3RhYmxlKHRoYXQuJGVsKTtcclxuICAgIGNsZWFyQ3VycmVudFNlbGVjdGlvbigpO1xyXG5cclxuICAgIHZhciBzID0gZHJhZ2dpbmcuZmlyc3QuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIG9mZnNldFRvUG9zaXRpb24oZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXJbMF0sIHMpO1xyXG5cclxuICB9KVxyXG4gIC5vbignbW91c2VlbnRlcicsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGlmIChkcmFnZ2luZy5maXJzdCkge1xyXG4gICAgICBkcmFnZ2luZy5sYXN0ID0gJCh0aGlzKTtcclxuXHJcbiAgICAgIHVwZGF0ZVNlbGVjdGlvbihkcmFnZ2luZy5sYXN0KTtcclxuICAgIH1cclxuICB9KVxyXG4gIC5vbignbW91c2V1cCcsIGZpbmlzaERyYWcpXHJcbiAgLmZpbmQoJ3RkJylcclxuICAuYXR0cignZHJhZ2dhYmxlJywgZmFsc2UpO1xyXG5cclxuICAvLyBUaGlzIHdpbGwgbm90IHdvcmsgd2l0aCBwb2ludGVyLWV2ZW50czpub25lLCBidXQgb24gb3RoZXJcclxuICAvLyBjYXNlcyAocmVjZW50SUUpXHJcbiAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIub24oJ21vdXNldXAnLCBmaW5pc2hEcmFnKVxyXG4gIC5hdHRyKCdkcmFnZ2FibGUnLCBmYWxzZSk7XHJcblxyXG59XHJcblxyXG4vKipcclxuV29yayBob3VycyBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIFdvcmtIb3VycyA9IExjV2lkZ2V0LmV4dGVuZChcclxuLy8gUHJvdG90eXBlXHJcbntcclxuY2xhc3NlczogZXh0ZW5kKHt9LCB1dGlscy53ZWVrbHlDbGFzc2VzLCB7XHJcbiAgd2Vla2x5Q2FsZW5kYXI6IHVuZGVmaW5lZCxcclxuICB3b3JrSG91cnNDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS13b3JrSG91cnMnXHJcbn0pLFxyXG50ZXh0czogdXRpbHMud2Vla2x5VGV4dHMsXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YVdvcmtIb3VycygpIHtcclxuICB2YXIgXHJcbiAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIGZvciAodmFyIHdrID0gMDsgd2sgPCB1dGlscy5zeXN0ZW1XZWVrRGF5cy5sZW5ndGg7IHdrKyspIHtcclxuICAgIHZhciBkYXRlU2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbdXRpbHMuc3lzdGVtV2Vla0RheXNbd2tdXTtcclxuICAgIGlmIChkYXRlU2xvdHMgJiYgZGF0ZVNsb3RzLmxlbmd0aCkge1xyXG4gICAgICBmb3IgKHMgPSAwOyBzIDwgZGF0ZVNsb3RzLmxlbmd0aDsgcysrKSB7XHJcbiAgICAgICAgdmFyIHNsb3QgPSBkYXRlU2xvdHNbc107XHJcbiAgICAgICAgdmFyIHNsb3RDZWxsID0gdXRpbHMuZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIHdrLCBzbG90KTtcclxuICAgICAgICAvLyBSZW1vdmUgZGVmYXVsdCBzdGF0dXNcclxuICAgICAgICBzbG90Q2VsbC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICdfJyk7XHJcbiAgICAgICAgLy8gQWRkaW5nIHN0YXR1cyBjbGFzc1xyXG4gICAgICAgIHNsb3RDZWxsLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIFdvcmtIb3VycyhlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgTGNXaWRnZXQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHRoaXMudXNlciA9IHRoaXMuJGVsLmRhdGEoJ2NhbGVuZGFyLXVzZXInKTtcclxuXHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICd3b3JrSG91cnMnXHJcbiAgfTtcclxuXHJcbiAgLy8gRmV0Y2ggdGhlIGRhdGE6IHRoZXJlIGlzIG5vdCBhIG1vcmUgc3BlY2lmaWMgcXVlcnksXHJcbiAgLy8gaXQganVzdCBnZXQgdGhlIGhvdXJzIGZvciBlYWNoIHdlZWstZGF5IChkYXRhXHJcbiAgLy8gc2xvdHMgYXJlIHBlciB3ZWVrLWRheSBpbnN0ZWFkIG9mIHBlciBkYXRlIGNvbXBhcmVkXHJcbiAgLy8gdG8gKndlZWtseSopXHJcbiAgdGhpcy5mZXRjaERhdGEoKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoKTtcclxuICB9KTtcclxuXHJcbiAgc2V0dXBFZGl0V29ya0hvdXJzLmNhbGwodGhpcyk7XHJcblxyXG4gIC8vIFNob3cgZXJyb3IgbWVzc2FnZVxyXG4gIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCB1dGlscy5oYW5kbGVyQ2FsZW5kYXJFcnJvcik7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV29ya2hvdXJzIGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldvcmtIb3Vycy5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdvcmtIb3Vycy5wcm90b3R5cGUuY2xhc3Nlcy53b3JrSG91cnNDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdvcmtIb3Vycyh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmtIb3VyczsiLCIvKipcclxuQ3Jvc3MgYnJvd3NlciB3YXkgdG8gdW5zZWxlY3QgY3VycmVudCBzZWxlY3Rpb25cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xlYXJDdXJyZW50U2VsZWN0aW9uKCkge1xyXG4gIGlmICh0eXBlb2YgKHdpbmRvdy5nZXRTZWxlY3Rpb24pID09PSAnZnVuY3Rpb24nKVxyXG4gIC8vIFN0YW5kYXJkXHJcbiAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcbiAgZWxzZSBpZiAoZG9jdW1lbnQuc2VsZWN0aW9uICYmIHR5cGVvZiAoZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KSA9PT0gJ2Z1bmN0aW9uJylcclxuICAvLyBJRVxyXG4gICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XHJcbn07IiwiLyoqXHJcbiAgQSBjb2xsZWN0aW9uIG9mIHVzZWZ1bCBnZW5lcmljIHV0aWxzIG1hbmFnaW5nIERhdGVzXHJcbioqL1xyXG52YXIgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyk7XHJcblxyXG5mdW5jdGlvbiBjdXJyZW50V2VlaygpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGdldEZpcnN0V2Vla0RhdGUobmV3IERhdGUoKSksXHJcbiAgICBlbmQ6IGdldExhc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50V2VlayA9IGN1cnJlbnRXZWVrO1xyXG5cclxuZnVuY3Rpb24gbmV4dFdlZWsoc3RhcnQsIGVuZCkge1xyXG4gIC8vIFVuaXF1ZSBwYXJhbSB3aXRoIGJvdGggcHJvcGllcnRpZXM6XHJcbiAgaWYgKHN0YXJ0LmVuZCkge1xyXG4gICAgZW5kID0gc3RhcnQuZW5kO1xyXG4gICAgc3RhcnQgPSBzdGFydC5zdGFydDtcclxuICB9XHJcbiAgLy8gT3B0aW9uYWwgZW5kOlxyXG4gIGVuZCA9IGVuZCB8fCBhZGREYXlzKHN0YXJ0LCA3KTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGFkZERheXMoc3RhcnQsIDcpLFxyXG4gICAgZW5kOiBhZGREYXlzKGVuZCwgNylcclxuICB9O1xyXG59XHJcbmV4cG9ydHMubmV4dFdlZWsgPSBuZXh0V2VlaztcclxuXHJcbmZ1bmN0aW9uIGdldEZpcnN0V2Vla0RhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpIC0gZC5nZXREYXkoKSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRGaXJzdFdlZWtEYXRlID0gZ2V0Rmlyc3RXZWVrRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGdldExhc3RXZWVrRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyAoNiAtIGQuZ2V0RGF5KCkpKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldExhc3RXZWVrRGF0ZSA9IGdldExhc3RXZWVrRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGlzSW5DdXJyZW50V2VlayhkYXRlKSB7XHJcbiAgcmV0dXJuIGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0V2Vla0RhdGUoZGF0ZSkpID09IGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0V2Vla0RhdGUobmV3IERhdGUoKSkpO1xyXG59XHJcbmV4cG9ydHMuaXNJbkN1cnJlbnRXZWVrID0gaXNJbkN1cnJlbnRXZWVrO1xyXG5cclxuZnVuY3Rpb24gYWRkRGF5cyhkYXRlLCBkYXlzKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkYXlzKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmFkZERheXMgPSBhZGREYXlzO1xyXG5cclxuZnVuY3Rpb24gZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZuKSB7XHJcbiAgaWYgKCFmbi5jYWxsKSB0aHJvdyBuZXcgRXJyb3IoJ2ZuIG11c3QgYmUgYSBmdW5jdGlvbiBvciBcImNhbGxcImFibGUgb2JqZWN0Jyk7XHJcbiAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzdGFydCk7XHJcbiAgdmFyIGkgPSAwLCByZXQ7XHJcbiAgd2hpbGUgKGRhdGUgPD0gZW5kKSB7XHJcbiAgICByZXQgPSBmbi5jYWxsKGZuLCBkYXRlLCBpKTtcclxuICAgIC8vIEFsbG93IGZuIHRvIGNhbmNlbCB0aGUgbG9vcCB3aXRoIHN0cmljdCAnZmFsc2UnXHJcbiAgICBpZiAocmV0ID09PSBmYWxzZSlcclxuICAgICAgYnJlYWs7XHJcbiAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyAxKTtcclxuICAgIGkrKztcclxuICB9XHJcbn1cclxuZXhwb3J0cy5lYWNoRGF0ZUluUmFuZ2UgPSBlYWNoRGF0ZUluUmFuZ2U7XHJcblxyXG4vKiogTW9udGhzICoqL1xyXG5cclxuZnVuY3Rpb24gZ2V0Rmlyc3RNb250aERhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKDEpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0Rmlyc3RNb250aERhdGUgPSBnZXRGaXJzdE1vbnRoRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGdldExhc3RNb250aERhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXRNb250aChkLmdldE1vbnRoKCkgKyAxLCAxKTtcclxuICBkID0gYWRkRGF5cyhkLCAtMSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRMYXN0TW9udGhEYXRlID0gZ2V0TGFzdE1vbnRoRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGlzSW5DdXJyZW50TW9udGgoZGF0ZSkge1xyXG4gIHJldHVybiBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdE1vbnRoRGF0ZShkYXRlKSkgPT0gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RNb250aERhdGUobmV3IERhdGUoKSkpO1xyXG59XHJcbmV4cG9ydHMuaXNJbkN1cnJlbnRNb250aCA9IGlzSW5DdXJyZW50TW9udGg7XHJcblxyXG4vKipcclxuICBHZXQgYSBkYXRlcyByYW5nZSBmb3IgdGhlIGN1cnJlbnQgbW9udGhcclxuICAob3IgdGhlIGdpdmVuIGRhdGUgYXMgYmFzZSlcclxuKiovXHJcbmZ1bmN0aW9uIGN1cnJlbnRNb250aChiYXNlRGF0ZSkge1xyXG4gIGJhc2VEYXRlID0gYmFzZURhdGUgfHwgbmV3IERhdGUoKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGdldEZpcnN0TW9udGhEYXRlKGJhc2VEYXRlKSxcclxuICAgIGVuZDogZ2V0TGFzdE1vbnRoRGF0ZShiYXNlRGF0ZSlcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudE1vbnRoID0gY3VycmVudE1vbnRoO1xyXG5cclxuZnVuY3Rpb24gbmV4dE1vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpIHtcclxuICBhbW91bnRNb250aHMgPSBhbW91bnRNb250aHMgfHwgMTtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGZyb21EYXRlKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGQuc2V0TW9udGgoZC5nZXRNb250aCgpICsgYW1vdW50TW9udGhzLCAxKSxcclxuICAgIGVuZDogZ2V0TGFzdE1vbnRoRGF0ZShkKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5uZXh0TW9udGggPSBuZXh0TW9udGg7XHJcblxyXG5mdW5jdGlvbiBwcmV2aW91c01vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpIHtcclxuICByZXR1cm4gbmV4dE1vbnRoKGZyb21EYXRlLCAwIC0gYW1vdW50TW9udGhzKTtcclxufVxyXG5leHBvcnRzLnByZXZpb3VzTW9udGggPSBwcmV2aW91c01vbnRoO1xyXG5cclxuLyoqXHJcbiAgR2V0IGEgZGF0ZXMgcmFuZ2UgZm9yIHRoZSBjb21wbGV0ZSB3ZWVrc1xyXG4gIHRoYXQgYXJlIHBhcnQgb2YgdGhlIGN1cnJlbnQgbW9udGhcclxuICAob3IgdGhlIGdpdmVuIGRhdGUgYXMgYmFzZSkuXHJcbiAgVGhhdCBtZWFucywgdGhhdCBzdGFydCBkYXRlIHdpbGwgYmUgdGhlIGZpcnN0XHJcbiAgd2VlayBkYXRlIG9mIHRoZSBmaXJzdCBtb250aCB3ZWVrICh0aGF0IGNhblxyXG4gIGJlIHRoZSBkYXkgMSBvZiB0aGUgbW9udGggb3Igb25lIG9mIHRoZSBsYXN0XHJcbiAgZGF0ZXMgZnJvbSB0aGUgcHJldmlvdXMgbW9udGhzKSxcclxuICBhbmQgc2ltaWxhciBmb3IgdGhlIGVuZCBkYXRlIGJlaW5nIHRoZSBcclxuICBsYXN0IHdlZWsgZGF0ZSBvZiB0aGUgbGFzdCBtb250aCB3ZWVrLlxyXG5cclxuICBAaW5jbHVkZVNpeFdlZWtzOiBzb21ldGltZXMgaXMgdXNlZnVsIGdldCBldmVyIGFcclxuICBzaXggd2Vla3MgZGF0ZXMgcmFuZ2Ugc3RhcmluZyBieSB0aGUgZmlyc3Qgd2VlayBvZlxyXG4gIHRoZSBiYXNlRGF0ZSBtb250aC4gQnkgZGVmYXVsdCBpcyBmYWxzZS5cclxuKiovXHJcbmZ1bmN0aW9uIGN1cnJlbnRNb250aFdlZWtzKGJhc2VEYXRlLCBpbmNsdWRlU2l4V2Vla3MpIHtcclxuICB2YXIgciA9IGN1cnJlbnRNb250aChiYXNlRGF0ZSksXHJcbiAgICBzID0gZ2V0Rmlyc3RXZWVrRGF0ZShyLnN0YXJ0KSxcclxuICAgIGUgPSBpbmNsdWRlU2l4V2Vla3MgPyBhZGREYXlzKHMsIDYqNyAtIDEpIDogZ2V0TGFzdFdlZWtEYXRlKHIuZW5kKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IHMsXHJcbiAgICBlbmQ6IGVcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudE1vbnRoV2Vla3MgPSBjdXJyZW50TW9udGhXZWVrcztcclxuXHJcbmZ1bmN0aW9uIG5leHRNb250aFdlZWtzKGZyb21EYXRlLCBhbW91bnRNb250aHMsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHJldHVybiBjdXJyZW50TW9udGhXZWVrcyhuZXh0TW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykuc3RhcnQsIGluY2x1ZGVTaXhXZWVrcyk7XHJcbn1cclxuZXhwb3J0cy5uZXh0TW9udGhXZWVrcyA9IG5leHRNb250aFdlZWtzO1xyXG5cclxuZnVuY3Rpb24gcHJldmlvdXNNb250aFdlZWtzKGZyb21EYXRlLCBhbW91bnRNb250aHMsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHJldHVybiBjdXJyZW50TW9udGhXZWVrcyhwcmV2aW91c01vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpLnN0YXJ0LCBpbmNsdWRlU2l4V2Vla3MpO1xyXG59XHJcbmV4cG9ydHMucHJldmlvdXNNb250aFdlZWtzID0gcHJldmlvdXNNb250aFdlZWtzO1xyXG4iLCIvKiogVmVyeSBzaW1wbGUgY3VzdG9tLWZvcm1hdCBmdW5jdGlvbiB0byBhbGxvdyBcclxubDEwbiBvZiB0ZXh0cy5cclxuQ292ZXIgY2FzZXM6XHJcbi0gTSBmb3IgbW9udGhcclxuLSBEIGZvciBkYXlcclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlLCBmb3JtYXQpIHtcclxuICB2YXIgcyA9IGZvcm1hdCxcclxuICAgICAgTSA9IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgIEQgPSBkYXRlLmdldERhdGUoKTtcclxuICBzID0gcy5yZXBsYWNlKC9NL2csIE0pO1xyXG4gIHMgPSBzLnJlcGxhY2UoL0QvZywgRCk7XHJcbiAgcmV0dXJuIHM7XHJcbn07IiwiLyoqXHJcbiAgRXhwb3NpbmcgYWxsIHRoZSBwdWJsaWMgZmVhdHVyZXMgYW5kIGNvbXBvbmVudHMgb2YgYXZhaWxhYmlsaXR5Q2FsZW5kYXJcclxuKiovXHJcbmV4cG9ydHMuV2Vla2x5ID0gcmVxdWlyZSgnLi9XZWVrbHknKTtcclxuZXhwb3J0cy5Xb3JrSG91cnMgPSByZXF1aXJlKCcuL1dvcmtIb3VycycpO1xyXG5leHBvcnRzLk1vbnRobHkgPSByZXF1aXJlKCcuL01vbnRobHknKTsiLCIvKipcclxuICBNYWtlIGFuIGVsZW1lbnQgdW5zZWxlY3RhYmxlLCB1c2VmdWwgdG8gaW1wbGVtZW50IHNvbWUgY3VzdG9tXHJcbiAgc2VsZWN0aW9uIGJlaGF2aW9yIG9yIGRyYWcmZHJvcC5cclxuICBJZiBvZmZlcnMgYW4gJ29mZicgbWV0aG9kIHRvIHJlc3RvcmUgYmFjayB0aGUgZWxlbWVudCBiZWhhdmlvci5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gIHZhciBmYWxzeWZuID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07XHJcbiAgdmFyIG5vZHJhZ1N0eWxlID0ge1xyXG4gICAgJy13ZWJraXQtdG91Y2gtY2FsbG91dCc6ICdub25lJyxcclxuICAgICcta2h0bWwtdXNlci1kcmFnJzogJ25vbmUnLFxyXG4gICAgJy13ZWJraXQtdXNlci1kcmFnJzogJ25vbmUnLFxyXG4gICAgJy1raHRtbC11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctd2Via2l0LXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnXHJcbiAgfTtcclxuICB2YXIgZHJhZ2RlZmF1bHRTdHlsZSA9IHtcclxuICAgICctd2Via2l0LXRvdWNoLWNhbGxvdXQnOiAnaW5oZXJpdCcsXHJcbiAgICAnLWtodG1sLXVzZXItZHJhZyc6ICdpbmhlcml0JyxcclxuICAgICctd2Via2l0LXVzZXItZHJhZyc6ICdpbmhlcml0JyxcclxuICAgICcta2h0bWwtdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLXdlYmtpdC11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctbW96LXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1tcy11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICd1c2VyLXNlbGVjdCc6ICdpbmhlcml0J1xyXG4gIH07XHJcblxyXG4gIHZhciBvbiA9IGZ1bmN0aW9uIG1ha2VVbnNlbGVjdGFibGUoZWwpIHtcclxuICAgIGVsID0gJChlbCk7XHJcbiAgICBlbC5vbignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIC8vJChkb2N1bWVudCkub24oJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICBlbC5jc3Mobm9kcmFnU3R5bGUpO1xyXG4gIH07XHJcblxyXG4gIHZhciBvZmYgPSBmdW5jdGlvbiBvZmZNYWtlVW5zZWxlY3RhYmxlKGVsKSB7XHJcbiAgICBlbCA9ICQoZWwpO1xyXG4gICAgZWwub2ZmKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgLy8kKGRvY3VtZW50KS5vZmYoJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICBlbC5jc3MoZHJhZ2RlZmF1bHRTdHlsZSk7XHJcbiAgfTtcclxuXHJcbiAgb24ub2ZmID0gb2ZmO1xyXG4gIHJldHVybiBvbjtcclxuXHJcbn0gKCkpOyIsIi8qKlxyXG4gIEEgc2V0IG9mIGdlbmVyaWMgdXRpbGl0aWVzIHRvIG1hbmFnZSBqcyBvYmplY3RzXHJcbioqL1xyXG52YXIgdSA9IHt9O1xyXG5cclxuLyoqXHJcbiAgUGVyZm9ybXMgYSBjYWxsYmFjayBvbiBlYWNoIHByb3BlcnR5IG93bmVkIGJ5IHRoZSBvYmplY3RcclxuKiovXHJcbnUuZWFjaFByb3BlcnR5ID0gZnVuY3Rpb24gZWFjaFByb3BlcnR5KG9iaiwgY2IpIHtcclxuICBmb3IgKHZhciBwIGluIG9iaikge1xyXG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkocCkpIGNvbnRpbnVlO1xyXG4gICAgY2IuY2FsbChvYmosIHAsIG9ialtwXSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgRmlsdGVyIHRoZSBnaXZlbiBvYmplY3QgcmV0dXJuaW5nIGEgbmV3IG9uZSB3aXRoIG9ubHkgdGhlIHByb3BlcnRpZXNcclxuICAoYW5kIG9yaWdpbmFsIHZhbHVlcyAtcmVmcyBmb3Igb2JqZWN0IHZhbHVlcy0pIHRoYXQgcGFzc1xyXG4gIHRoZSBwcm92aWRlZCBAZmlsdGVyIGNhbGxiYWNrIChjYWxsYmFjayBtdXN0IHJldHVybiBhIHRydWUvdHJ1dGh5IHZhbHVlXHJcbiAgZm9yIGVhY2ggdmFsdWUgZGVzaXJlZCBpbiB0aGUgcmVzdWx0KS5cclxuICBUaGUgQGZpbHRlciBjYWxsYmFjayBpdHMgZXhlY3V0ZWQgd2l0aCB0aGUgb2JqZWN0IGFzIGNvbnRleHQgYW5kIHJlY2VpdmVzXHJcbiAgYXMgcGFyZW1ldGVycyB0aGUgcHJvcGVydHkga2V5IGFuZCBpdHMgdmFsdWUgXCJmaWx0ZXIoaywgdilcIi5cclxuKiovXHJcbnUuZmlsdGVyUHJvcGVydGllcyA9IGZ1bmN0aW9uIGZpbHRlclByb3BlcmllcyhvYmosIGZpbHRlcikge1xyXG4gIHZhciByID0ge307XHJcbiAgdS5lYWNoUHJvcGVydHkob2JqLCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgaWYgKGZpbHRlci5jYWxsKG9iaiwgaywgdikpXHJcbiAgICAgIHJba10gPSB2O1xyXG4gIH0pO1xyXG4gIHJldHVybiByO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB1OyIsIi8qKlxyXG4gIEF2YWlsYWJpbGl0eUNhbGVuZGFyIHNoYXJlZCB1dGlsc1xyXG4qKi9cclxudmFyIFxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBkYXRlVXRpbHMgPSByZXF1aXJlKCcuL2RhdGVVdGlscycpLFxyXG4gIGZvcm1hdERhdGUgPSByZXF1aXJlKCcuL2Zvcm1hdERhdGUnKTtcclxuXHJcbi8vIFJlLWV4cG9ydGluZzpcclxuZXhwb3J0cy5mb3JtYXREYXRlID0gZm9ybWF0RGF0ZTtcclxuZXhwb3J0cy5kYXRlID0gZGF0ZVV0aWxzO1xyXG5cclxuLyotLS0tLS0gQ09OU1RBTlRTIC0tLS0tLS0tLSovXHJcbnZhciBzdGF0dXNUeXBlcyA9IGV4cG9ydHMuc3RhdHVzVHlwZXMgPSBbJ3VuYXZhaWxhYmxlJywgJ2F2YWlsYWJsZSddO1xyXG4vLyBXZWVrIGRheXMgbmFtZXMgaW4gZW5nbGlzaCBmb3IgaW50ZXJuYWwgc3lzdGVtXHJcbi8vIHVzZTsgTk9UIGZvciBsb2NhbGl6YXRpb24vdHJhbnNsYXRpb24uXHJcbnZhciBzeXN0ZW1XZWVrRGF5cyA9IGV4cG9ydHMuc3lzdGVtV2Vla0RheXMgPSBbXHJcbiAgJ3N1bmRheScsXHJcbiAgJ21vbmRheScsXHJcbiAgJ3R1ZXNkYXknLFxyXG4gICd3ZWRuZXNkYXknLFxyXG4gICd0aHVyc2RheScsXHJcbiAgJ2ZyaWRheScsXHJcbiAgJ3NhdHVyZGF5J1xyXG5dO1xyXG5cclxuLyotLS0tLS0tLS0gQ09ORklHIC0gSU5TVEFOQ0UgLS0tLS0tLS0tLSovXHJcbnZhciB3ZWVrbHlDbGFzc2VzID0gZXhwb3J0cy53ZWVrbHlDbGFzc2VzID0ge1xyXG4gIGNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXInLFxyXG4gIHdlZWtseUNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItLXdlZWtseScsXHJcbiAgY3VycmVudFdlZWs6ICdpcy1jdXJyZW50V2VlaycsXHJcbiAgYWN0aW9uczogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWFjdGlvbnMnLFxyXG4gIHByZXZBY3Rpb246ICdBY3Rpb25zLXByZXYnLFxyXG4gIG5leHRBY3Rpb246ICdBY3Rpb25zLW5leHQnLFxyXG4gIGRheXM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1kYXlzJyxcclxuICBzbG90czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXNsb3RzJyxcclxuICBzbG90SG91cjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWhvdXInLFxyXG4gIHNsb3RTdGF0dXNQcmVmaXg6ICdpcy0nLFxyXG4gIGxlZ2VuZDogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZCcsXHJcbiAgbGVnZW5kQXZhaWxhYmxlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kLWF2YWlsYWJsZScsXHJcbiAgbGVnZW5kVW5hdmFpbGFibGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQtdW5hdmFpbGFibGUnLFxyXG4gIHN0YXR1czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXN0YXR1cycsXHJcbiAgZXJyb3JNZXNzYWdlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItZXJyb3JNZXNzYWdlJ1xyXG59O1xyXG5cclxudmFyIHdlZWtseVRleHRzID0gZXhwb3J0cy53ZWVrbHlUZXh0cyA9IHtcclxuICBhYmJyV2Vla0RheXM6IFtcclxuICAgICdTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXHJcbiAgXSxcclxuICB0b2RheTogJ1RvZGF5JyxcclxuICAvLyBBbGxvd2VkIHNwZWNpYWwgdmFsdWVzOiBNOm1vbnRoLCBEOmRheVxyXG4gIGFiYnJEYXRlRm9ybWF0OiAnTS9EJ1xyXG59O1xyXG5cclxuLyotLS0tLS0tLS0tLSBWSUVXIFVUSUxTIC0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuZnVuY3Rpb24gaGFuZGxlckNhbGVuZGFyRXJyb3IoZXJyKSB7XHJcbiAgdmFyIG1zZyA9ICcnO1xyXG4gIGlmIChlcnIgJiYgZXJyLm1lc3NhZ2UpXHJcbiAgICBtc2cgPSBlcnIubWVzc2FnZTtcclxuICBlbHNlIGlmIChlcnIgJiYgZXJyLmV4Y2VwdGlvbiAmJiBlcnIuZXhjZXB0aW9uLm1lc3NhZ2UpXHJcbiAgICBtc2cgPSBlcnIuZXhjZXB0aW9uLm1lc3NhZ2U7XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcy5jb21wb25lbnQ7XHJcbiAgdmFyIG1zZ0NvbnRhaW5lciA9IHRoYXQuJGVsLmZpbmQoJy4nICsgdGhhdC5jbGFzc2VzLmVycm9yTWVzc2FnZSk7XHJcblxyXG4gIGlmIChtc2cpIG1zZyA9IChtc2dDb250YWluZXIuZGF0YSgnbWVzc2FnZS1wcmVmaXgnKSB8fCAnJykgKyBtc2c7XHJcblxyXG4gIG1zZ0NvbnRhaW5lci50ZXh0KG1zZyk7XHJcbn1cclxuZXhwb3J0cy5oYW5kbGVyQ2FsZW5kYXJFcnJvciA9IGhhbmRsZXJDYWxlbmRhckVycm9yO1xyXG5cclxuZnVuY3Rpb24gbW92ZUJpbmRSYW5nZUluRGF5cyh3ZWVrbHksIGRheXMpIHtcclxuICB2YXIgXHJcbiAgICBzdGFydCA9IGRhdGVVdGlscy5hZGREYXlzKHdlZWtseS5kYXRlc1JhbmdlLnN0YXJ0LCBkYXlzKSxcclxuICAgIGVuZCA9IGRhdGVVdGlscy5hZGREYXlzKHdlZWtseS5kYXRlc1JhbmdlLmVuZCwgZGF5cyksXHJcbiAgICBkYXRlc1JhbmdlID0gZGF0ZXNUb1JhbmdlKHN0YXJ0LCBlbmQpO1xyXG5cclxuICAvLyBDaGVjayBjYWNoZSBiZWZvcmUgdHJ5IHRvIGZldGNoXHJcbiAgdmFyIGluQ2FjaGUgPSB3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcblxyXG4gIGlmIChpbkNhY2hlKSB7XHJcbiAgICAvLyBKdXN0IHNob3cgdGhlIGRhdGFcclxuICAgIHdlZWtseS5iaW5kRGF0YShkYXRlc1JhbmdlKTtcclxuICAgIC8vIFByZWZldGNoIGV4Y2VwdCBpZiB0aGVyZSBpcyBvdGhlciByZXF1ZXN0IGluIGNvdXJzZSAoY2FuIGJlIHRoZSBzYW1lIHByZWZldGNoLFxyXG4gICAgLy8gYnV0IHN0aWxsIGRvbid0IG92ZXJsb2FkIHRoZSBzZXJ2ZXIpXHJcbiAgICBpZiAod2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggPT09IDApXHJcbiAgICAgIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuICB9IGVsc2Uge1xyXG5cclxuICAgIC8vIFN1cHBvcnQgZm9yIHByZWZldGNoaW5nOlxyXG4gICAgLy8gSXRzIGF2b2lkZWQgaWYgdGhlcmUgYXJlIHJlcXVlc3RzIGluIGNvdXJzZSwgc2luY2VcclxuICAgIC8vIHRoYXQgd2lsbCBiZSBhIHByZWZldGNoIGZvciB0aGUgc2FtZSBkYXRhLlxyXG4gICAgaWYgKHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSB7XHJcbiAgICAgIC8vIFRoZSBsYXN0IHJlcXVlc3QgaW4gdGhlIHBvb2wgKm11c3QqIGJlIHRoZSBsYXN0IGluIGZpbmlzaFxyXG4gICAgICAvLyAobXVzdCBiZSBvbmx5IG9uZSBpZiBhbGwgZ29lcyBmaW5lKTpcclxuICAgICAgdmFyIHJlcXVlc3QgPSB3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzW3dlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAvLyBXYWl0IGZvciB0aGUgZmV0Y2ggdG8gcGVyZm9ybSBhbmQgc2V0cyBsb2FkaW5nIHRvIG5vdGlmeSB1c2VyXHJcbiAgICAgIHdlZWtseS4kZWwuYWRkQ2xhc3Mod2Vla2x5LmNsYXNzZXMuZmV0Y2hpbmcpO1xyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIG1vdmVCaW5kUmFuZ2VJbkRheXMod2Vla2x5LCBkYXlzKTtcclxuICAgICAgICB3ZWVrbHkuJGVsLnJlbW92ZUNsYXNzKHdlZWtseS5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmV0Y2ggKGRvd25sb2FkKSB0aGUgZGF0YSBhbmQgc2hvdyBvbiByZWFkeTpcclxuICAgIHdlZWtseVxyXG4gICAgLmZldGNoRGF0YShkYXRlc1RvUXVlcnkoZGF0ZXNSYW5nZSkpXHJcbiAgICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHdlZWtseS5iaW5kRGF0YShkYXRlc1JhbmdlKTtcclxuICAgICAgLy8gUHJlZmV0Y2hcclxuICAgICAgd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydHMubW92ZUJpbmRSYW5nZUluRGF5cyA9IG1vdmVCaW5kUmFuZ2VJbkRheXM7XHJcblxyXG5mdW5jdGlvbiB3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgZGF0ZXNSYW5nZSkge1xyXG4gIGlmICghd2Vla2x5LmRhdGEgfHwgIXdlZWtseS5kYXRhLnNsb3RzKSByZXR1cm4gZmFsc2U7XHJcbiAgLy8gQ2hlY2sgY2FjaGU6IGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgZGF0ZSBpbiB0aGUgcmFuZ2VcclxuICAvLyB3aXRob3V0IGRhdGEsIHdlIHNldCBpbkNhY2hlIGFzIGZhbHNlIGFuZCBmZXRjaCB0aGUgZGF0YTpcclxuICB2YXIgaW5DYWNoZSA9IHRydWU7XHJcbiAgZGF0ZVV0aWxzLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICBpZiAoIXdlZWtseS5kYXRhLnNsb3RzW2RhdGVrZXldKSB7XHJcbiAgICAgIGluQ2FjaGUgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiBpbkNhY2hlO1xyXG59XHJcbmV4cG9ydHMud2Vla2x5SXNEYXRhSW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGU7XHJcblxyXG4vKipcclxuICBGb3Igbm93LCBnaXZlbiB0aGUgSlNPTiBzdHJ1Y3R1cmUgdXNlZCwgdGhlIGxvZ2ljXHJcbiAgb2YgbW9udGhseUlzRGF0YUluQ2FjaGUgaXMgdGhlIHNhbWUgYXMgd2Vla2x5SXNEYXRhSW5DYWNoZTpcclxuKiovXHJcbnZhciBtb250aGx5SXNEYXRhSW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGU7XHJcbmV4cG9ydHMubW9udGhseUlzRGF0YUluQ2FjaGUgPSBtb250aGx5SXNEYXRhSW5DYWNoZTtcclxuXHJcblxyXG5mdW5jdGlvbiB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgY3VycmVudERhdGVzUmFuZ2UpIHtcclxuICB2YXIgbmV4dERhdGVzUmFuZ2UgPSBkYXRlc1RvUmFuZ2UoXHJcbiAgICBkYXRlVXRpbHMuYWRkRGF5cyhjdXJyZW50RGF0ZXNSYW5nZS5zdGFydCwgNyksXHJcbiAgICBkYXRlVXRpbHMuYWRkRGF5cyhjdXJyZW50RGF0ZXNSYW5nZS5lbmQsIDcpXHJcbiAgKTtcclxuXHJcbiAgaWYgKCF3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgbmV4dERhdGVzUmFuZ2UpKSB7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IHdlZWsgaW4gYWR2YW5jZVxyXG4gICAgdmFyIHByZWZldGNoUXVlcnkgPSBkYXRlc1RvUXVlcnkobmV4dERhdGVzUmFuZ2UpO1xyXG4gICAgd2Vla2x5LmZldGNoRGF0YShwcmVmZXRjaFF1ZXJ5LCBudWxsLCB0cnVlKTtcclxuICB9XHJcbn1cclxuZXhwb3J0cy53ZWVrbHlDaGVja0FuZFByZWZldGNoID0gd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaDtcclxuXHJcbi8qKiBVcGRhdGUgdGhlIHZpZXcgbGFiZWxzIGZvciB0aGUgd2Vlay1kYXlzICh0YWJsZSBoZWFkZXJzKVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIGNhbGVuZGFyLCBvcHRpb25zKSB7XHJcbiAgdmFyIHN0YXJ0ID0gZGF0ZXNSYW5nZS5zdGFydCxcclxuICAgICAgZW5kID0gZGF0ZXNSYW5nZS5lbmQ7XHJcblxyXG4gIHZhciBkYXlzID0gY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMuZGF5cyArICcgdGgnKTtcclxuICB2YXIgdG9kYXkgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXcgRGF0ZSgpKTtcclxuICAvLyBGaXJzdCBjZWxsIGlzIGVtcHR5ICgndGhlIGNyb3NzIGhlYWRlcnMgY2VsbCcpLCB0aGVuIG9mZnNldCBpcyAxXHJcbiAgdmFyIG9mZnNldCA9IDE7XHJcbiAgZGF0ZVV0aWxzLmVhY2hEYXRlSW5SYW5nZShzdGFydCwgZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgdmFyIGNlbGwgPSAkKGRheXMuZ2V0KG9mZnNldCArIGkpKSxcclxuICAgICAgICBzZGF0ZSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUpLFxyXG4gICAgICAgIGxhYmVsID0gc2RhdGU7XHJcblxyXG4gICAgaWYgKHRvZGF5ID09IHNkYXRlKVxyXG4gICAgICBsYWJlbCA9IG9wdGlvbnMudGV4dHMudG9kYXk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGxhYmVsID0gb3B0aW9ucy50ZXh0cy5hYmJyV2Vla0RheXNbZGF0ZS5nZXREYXkoKV0gKyAnICcgKyBmb3JtYXREYXRlKGRhdGUsIG9wdGlvbnMudGV4dHMuYWJickRhdGVGb3JtYXQpO1xyXG5cclxuICAgIGNlbGwudGV4dChsYWJlbCk7XHJcbiAgfSk7XHJcbn1cclxuZXhwb3J0cy51cGRhdGVMYWJlbHMgPSB1cGRhdGVMYWJlbHM7XHJcblxyXG5mdW5jdGlvbiBmaW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgZGF5LCBzbG90KSB7XHJcbiAgc2xvdCA9IGRhdGVJU08ucGFyc2Uoc2xvdCk7XHJcbiAgdmFyIFxyXG4gICAgeCA9IE1hdGgucm91bmQoc2xvdC5nZXRIb3VycygpKSxcclxuICAvLyBUaW1lIGZyYW1lcyAoc2xvdHMpIGFyZSAxNSBtaW51dGVzIGRpdmlzaW9uc1xyXG4gICAgeSA9IE1hdGgucm91bmQoc2xvdC5nZXRNaW51dGVzKCkgLyAxNSksXHJcbiAgICB0ciA9IHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCc6ZXEoJyArIE1hdGgucm91bmQoeCAqIDQgKyB5KSArICcpJyk7XHJcblxyXG4gIC8vIFNsb3QgY2VsbCBmb3IgbydjbG9jayBob3VycyBpcyBhdCAxIHBvc2l0aW9uIG9mZnNldFxyXG4gIC8vIGJlY2F1c2Ugb2YgdGhlIHJvdy1oZWFkIGNlbGxcclxuICB2YXIgZGF5T2Zmc2V0ID0gKHkgPT09IDAgPyBkYXkgKyAxIDogZGF5KTtcclxuICByZXR1cm4gdHIuY2hpbGRyZW4oJzplcSgnICsgZGF5T2Zmc2V0ICsgJyknKTtcclxufVxyXG5leHBvcnRzLmZpbmRDZWxsQnlTbG90ID0gZmluZENlbGxCeVNsb3Q7XHJcblxyXG5mdW5jdGlvbiBmaW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCkge1xyXG4gIHZhciBcclxuICAgIHggPSBjZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChjZWxsKSxcclxuICAgIHkgPSBjZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKSxcclxuICAgIGZ1bGxNaW51dGVzID0geSAqIDE1LFxyXG4gICAgaG91cnMgPSBNYXRoLmZsb29yKGZ1bGxNaW51dGVzIC8gNjApLFxyXG4gICAgbWludXRlcyA9IGZ1bGxNaW51dGVzIC0gKGhvdXJzICogNjApLFxyXG4gICAgc2xvdCA9IG5ldyBEYXRlKCk7XHJcbiAgc2xvdC5zZXRIb3Vycyhob3VycywgbWludXRlcywgMCwgMCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBkYXk6IHgsXHJcbiAgICBzbG90OiBzbG90XHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmZpbmRTbG90QnlDZWxsID0gZmluZFNsb3RCeUNlbGw7XHJcblxyXG4vKipcclxuTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LXdlZWsgYW5kIGRpc2FibGUgcHJldiBidXR0b24sXHJcbm9yIHJlbW92ZSB0aGUgbWFyayBhbmQgZW5hYmxlIGl0IGlmIGlzIG5vdC5cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrQ3VycmVudFdlZWsoY2FsZW5kYXIsIGRhdGUsIG9wdGlvbnMpIHtcclxuICB2YXIgeWVwID0gZGF0ZVV0aWxzLmlzSW5DdXJyZW50V2VlayhkYXRlKTtcclxuICBjYWxlbmRhci50b2dnbGVDbGFzcyhvcHRpb25zLmNsYXNzZXMuY3VycmVudFdlZWssIHllcCk7XHJcbiAgY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMucHJldkFjdGlvbikucHJvcCgnZGlzYWJsZWQnLCB5ZXApO1xyXG59XHJcbmV4cG9ydHMuY2hlY2tDdXJyZW50V2VlayA9IGNoZWNrQ3VycmVudFdlZWs7XHJcblxyXG4vKiogR2V0IHF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBkYXRlIHJhbmdlIHNwZWNpZmllZDpcclxuKiovXHJcbmZ1bmN0aW9uIGRhdGVzVG9RdWVyeShzdGFydCwgZW5kKSB7XHJcbiAgLy8gVW5pcXVlIHBhcmFtIHdpdGggYm90aCBwcm9waWVydGllczpcclxuICBpZiAoc3RhcnQuZW5kKSB7XHJcbiAgICBlbmQgPSBzdGFydC5lbmQ7XHJcbiAgICBzdGFydCA9IHN0YXJ0LnN0YXJ0O1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGRhdGVJU08uZGF0ZUxvY2FsKHN0YXJ0LCB0cnVlKSxcclxuICAgIGVuZDogZGF0ZUlTTy5kYXRlTG9jYWwoZW5kLCB0cnVlKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5kYXRlc1RvUXVlcnkgPSBkYXRlc1RvUXVlcnk7XHJcblxyXG4vKiogUGFjayB0d28gZGF0ZXMgaW4gYSBzaW1wbGUgYnV0IHVzZWZ1bFxyXG5zdHJ1Y3R1cmUgeyBzdGFydCwgZW5kIH1cclxuKiovXHJcbmZ1bmN0aW9uIGRhdGVzVG9SYW5nZShzdGFydCwgZW5kKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBzdGFydCxcclxuICAgIGVuZDogZW5kXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmRhdGVzVG9SYW5nZSA9IGRhdGVzVG9SYW5nZTtcclxuIiwiLyogR2VuZXJpYyBibG9ja1VJIG9wdGlvbnMgc2V0cyAqL1xyXG52YXIgbG9hZGluZ0Jsb2NrID0geyBtZXNzYWdlOiAnPGltZyB3aWR0aD1cIjQ4cHhcIiBoZWlnaHQ9XCI0OHB4XCIgY2xhc3M9XCJsb2FkaW5nLWluZGljYXRvclwiIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nIH07XHJcbnZhciBlcnJvckJsb2NrID0gZnVuY3Rpb24gKGVycm9yLCByZWxvYWQsIHN0eWxlKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGNzczogJC5leHRlbmQoeyBjdXJzb3I6ICdkZWZhdWx0JyB9LCBzdHlsZSB8fCB7fSksXHJcbiAgICAgICAgbWVzc2FnZTogJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT48ZGl2IGNsYXNzPVwiaW5mb1wiPlRoZXJlIHdhcyBhbiBlcnJvcicgK1xyXG4gICAgICAgICAgICAoZXJyb3IgPyAnOiAnICsgZXJyb3IgOiAnJykgK1xyXG4gICAgICAgICAgICAocmVsb2FkID8gJyA8YSBocmVmPVwiamF2YXNjcmlwdDogJyArIHJlbG9hZCArICc7XCI+Q2xpY2sgdG8gcmVsb2FkPC9hPicgOiAnJykgK1xyXG4gICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgfTtcclxufTtcclxudmFyIGluZm9CbG9jayA9IGZ1bmN0aW9uIChtZXNzYWdlLCBvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gJC5leHRlbmQoe1xyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj4nICsgbWVzc2FnZSArICc8L2Rpdj4nXHJcbiAgICAgICAgLyosY3NzOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0qL1xyXG4gICAgICAgICwgb3ZlcmxheUNTUzogeyBjdXJzb3I6ICdkZWZhdWx0JyB9XHJcbiAgICB9LCBvcHRpb25zKTtcclxufTtcclxuXHJcbi8vIE1vZHVsZTpcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBsb2FkaW5nOiBsb2FkaW5nQmxvY2ssXHJcbiAgICAgICAgZXJyb3I6IGVycm9yQmxvY2ssXHJcbiAgICAgICAgaW5mbzogaW5mb0Jsb2NrXHJcbiAgICB9O1xyXG59IiwiLyo9IENoYW5nZXNOb3RpZmljYXRpb24gY2xhc3NcclxuKiB0byBub3RpZnkgdXNlciBhYm91dCBjaGFuZ2VzIGluIGZvcm1zLFxyXG4qIHRhYnMsIHRoYXQgd2lsbCBiZSBsb3N0IGlmIGdvIGF3YXkgZnJvbVxyXG4qIHRoZSBwYWdlLiBJdCBrbm93cyB3aGVuIGEgZm9ybSBpcyBzdWJtaXR0ZWRcclxuKiBhbmQgc2F2ZWQgdG8gZGlzYWJsZSBub3RpZmljYXRpb24sIGFuZCBnaXZlc1xyXG4qIG1ldGhvZHMgZm9yIG90aGVyIHNjcmlwdHMgdG8gbm90aWZ5IGNoYW5nZXNcclxuKiBvciBzYXZpbmcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBnZXRYUGF0aCA9IHJlcXVpcmUoJy4vZ2V0WFBhdGgnKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0ge1xyXG4gICAgY2hhbmdlc0xpc3Q6IHt9LFxyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgICB0YXJnZXQ6IG51bGwsXHJcbiAgICAgICAgZ2VuZXJpY0NoYW5nZVN1cHBvcnQ6IHRydWUsXHJcbiAgICAgICAgZ2VuZXJpY1N1Ym1pdFN1cHBvcnQ6IGZhbHNlLFxyXG4gICAgICAgIGNoYW5nZWRGb3JtQ2xhc3M6ICdoYXMtY2hhbmdlcycsXHJcbiAgICAgICAgY2hhbmdlZEVsZW1lbnRDbGFzczogJ2NoYW5nZWQnLFxyXG4gICAgICAgIG5vdGlmeUNsYXNzOiAnbm90aWZ5LWNoYW5nZXMnXHJcbiAgICB9LFxyXG4gICAgaW5pdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICAvLyBVc2VyIG5vdGlmaWNhdGlvbiB0byBwcmV2ZW50IGxvc3QgY2hhbmdlcyBkb25lXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VzTm90aWZpY2F0aW9uLm5vdGlmeSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0aGlzLmRlZmF1bHRzLCBvcHRpb25zKTtcclxuICAgICAgICBpZiAoIW9wdGlvbnMudGFyZ2V0KVxyXG4gICAgICAgICAgICBvcHRpb25zLnRhcmdldCA9IGRvY3VtZW50O1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNDaGFuZ2VTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignY2hhbmdlJywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCkgOmlucHV0W25hbWVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZSgkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksIHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljU3VibWl0U3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ3N1Ym1pdCcsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUodGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG5vdGlmeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIEFkZCBub3RpZmljYXRpb24gY2xhc3MgdG8gdGhlIGRvY3VtZW50XHJcbiAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMubm90aWZ5Q2xhc3MpO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgY2hhbmdlIGluIHRoZSBwcm9wZXJ0eSBsaXN0IHJldHVybmluZyB0aGUgbWVzc2FnZTpcclxuICAgICAgICBmb3IgKHZhciBjIGluIHRoaXMuY2hhbmdlc0xpc3QpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1aXRNZXNzYWdlIHx8ICh0aGlzLnF1aXRNZXNzYWdlID0gJCgnI2xjcmVzLXF1aXQtd2l0aG91dC1zYXZlJykudGV4dCgpKSB8fCAnJztcclxuICAgIH0sXHJcbiAgICByZWdpc3RlckNoYW5nZTogZnVuY3Rpb24gKGYsIGUpIHtcclxuICAgICAgICBpZiAoIWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICB2YXIgZmwgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdIHx8IFtdO1xyXG4gICAgICAgIGlmICgkLmlzQXJyYXkoZSkpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlckNoYW5nZShmLCBlW2ldKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbiA9IGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAoZSkgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIG4gPSBlLm5hbWU7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHJlYWxseSB0aGVyZSB3YXMgYSBjaGFuZ2UgY2hlY2tpbmcgZGVmYXVsdCBlbGVtZW50IHZhbHVlXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGUuZGVmYXVsdFZhbHVlKSAhPSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLmNoZWNrZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuc2VsZWN0ZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICBlLnZhbHVlID09IGUuZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSB3YXMgbm8gY2hhbmdlLCBubyBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgLy8gYW5kIG1heWJlIGlzIGEgcmVncmVzc2lvbiBmcm9tIGEgY2hhbmdlIGFuZCBub3cgdGhlIG9yaWdpbmFsIHZhbHVlIGFnYWluXHJcbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gcmVtb3ZlIGZyb20gY2hhbmdlcyBsaXN0IGRvaW5nIHJlZ2lzdGVyU2F2ZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlclNhdmUoZiwgW25dKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkKGUpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghKG4gaW4gZmwpKVxyXG4gICAgICAgICAgICBmbC5wdXNoKG4pO1xyXG4gICAgICAgICQoZilcclxuICAgICAgICAuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKVxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudCBuYW1lIGNoYW5nZWQsIGZvcm0gZWxlbWVudCBjaGFuZ2VkICh0aGlzIGNhbiBiZSBudWxsKVxyXG4gICAgICAgIC50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgW2YsIG4sIGVdKTtcclxuICAgIH0sXHJcbiAgICByZWdpc3RlclNhdmU6IGZ1bmN0aW9uIChmLCBlbHMpIHtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHByZXZFbHMgPSAkLmV4dGVuZChbXSwgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pO1xyXG4gICAgICAgIHZhciByID0gdHJ1ZTtcclxuICAgICAgICBpZiAoZWxzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gJC5ncmVwKHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLCBmdW5jdGlvbiAoZWwpIHsgcmV0dXJuICgkLmluQXJyYXkoZWwsIGVscykgPT0gLTEpOyB9KTtcclxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVtb3ZlICdmJyBsaXN0IGlmIGlzIG5vdCBlbXB0eVxyXG4gICAgICAgICAgICByID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0ubGVuZ3RoID09PSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgICAkKGYpLnJlbW92ZUNsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcyk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXTtcclxuICAgICAgICAgICAgLy8gbGluayBlbGVtZW50cyBmcm9tIGVscyB0byBjbGVhbi11cCBpdHMgY2xhc3Nlc1xyXG4gICAgICAgICAgICBlbHMgPSBwcmV2RWxzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnRzIHJlZ2lzdGVyZWQgYXMgc2F2ZSAodGhpcyBjYW4gYmUgbnVsbCksIGFuZCAnZm9ybSBmdWxseSBzYXZlZCcgYXMgdGhpcmQgcGFyYW0gKGJvb2wpXHJcbiAgICAgICAgJChmKS50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsIFtmLCBlbHMsIHJdKTtcclxuICAgICAgICB2YXIgbGNobiA9IHRoaXM7XHJcbiAgICAgICAgaWYgKGVscykgJC5lYWNoKGVscywgZnVuY3Rpb24gKCkgeyAkKCdbbmFtZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHRoaXMpICsgJ1wiXScpLnJlbW92ZUNsYXNzKGxjaG4uZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7IH0pO1xyXG4gICAgICAgIHJldHVybiBwcmV2RWxzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uO1xyXG59IiwiLyogVXRpbGl0eSB0byBjcmVhdGUgaWZyYW1lIHdpdGggaW5qZWN0ZWQgaHRtbC9jb250ZW50IGluc3RlYWQgb2YgVVJMLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVJZnJhbWUoY29udGVudCwgc2l6ZSkge1xyXG4gICAgdmFyICRpZnJhbWUgPSAkKCc8aWZyYW1lIHdpZHRoPVwiJyArIHNpemUud2lkdGggKyAnXCIgaGVpZ2h0PVwiJyArIHNpemUuaGVpZ2h0ICsgJ1wiIHN0eWxlPVwiYm9yZGVyOm5vbmU7XCI+PC9pZnJhbWU+Jyk7XHJcbiAgICB2YXIgaWZyYW1lID0gJGlmcmFtZS5nZXQoMCk7XHJcbiAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgcmVhZHlcclxuICAgIHZhciBpZnJhbWVsb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmcmFtZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gVXNpbmcgaWZyYW1lbG9hZGVkIHRvIGF2b2lkIGluZmluaXRlIGxvb3BzXHJcbiAgICAgICAgaWYgKCFpZnJhbWVsb2FkZWQpIHtcclxuICAgICAgICAgICAgaWZyYW1lbG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gJGlmcmFtZTtcclxufTtcclxuXHJcbi8qIFB1dHMgZnVsbCBodG1sIGluc2lkZSB0aGUgaWZyYW1lIGVsZW1lbnQgcGFzc2VkIGluIGEgc2VjdXJlIGFuZCBjb21wbGlhbnQgbW9kZSAqL1xyXG5mdW5jdGlvbiBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgaHRtbCkge1xyXG4gICAgLy8gcHV0IGFqYXggZGF0YSBpbnNpZGUgaWZyYW1lIHJlcGxhY2luZyBhbGwgdGhlaXIgaHRtbCBpbiBzZWN1cmUgXHJcbiAgICAvLyBjb21wbGlhbnQgbW9kZSAoJC5odG1sIGRvbid0IHdvcmtzIHRvIGluamVjdCA8aHRtbD48aGVhZD4gY29udGVudClcclxuXHJcbiAgICAvKiBkb2N1bWVudCBBUEkgdmVyc2lvbiAocHJvYmxlbXMgd2l0aCBJRSwgZG9uJ3QgZXhlY3V0ZSBpZnJhbWUtaHRtbCBzY3JpcHRzKSAqL1xyXG4gICAgLyp2YXIgaWZyYW1lRG9jID1cclxuICAgIC8vIFczQyBjb21wbGlhbnQ6IG5zLCBmaXJlZm94LWdlY2tvLCBjaHJvbWUvc2FmYXJpLXdlYmtpdCwgb3BlcmEsIGllOVxyXG4gICAgaWZyYW1lLmNvbnRlbnREb2N1bWVudCB8fFxyXG4gICAgLy8gb2xkIElFICg1LjUrKVxyXG4gICAgKGlmcmFtZS5jb250ZW50V2luZG93ID8gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgOiBudWxsKSB8fFxyXG4gICAgLy8gZmFsbGJhY2sgKHZlcnkgb2xkIElFPylcclxuICAgIGRvY3VtZW50LmZyYW1lc1tpZnJhbWUuaWRdLmRvY3VtZW50O1xyXG4gICAgaWZyYW1lRG9jLm9wZW4oKTtcclxuICAgIGlmcmFtZURvYy53cml0ZShodG1sKTtcclxuICAgIGlmcmFtZURvYy5jbG9zZSgpOyovXHJcblxyXG4gICAgLyogamF2YXNjcmlwdCBVUkkgdmVyc2lvbiAod29ya3MgZmluZSBldmVyeXdoZXJlISkgKi9cclxuICAgIGlmcmFtZS5jb250ZW50V2luZG93LmNvbnRlbnRzID0gaHRtbDtcclxuICAgIGlmcmFtZS5zcmMgPSAnamF2YXNjcmlwdDp3aW5kb3dbXCJjb250ZW50c1wiXSc7XHJcblxyXG4gICAgLy8gQWJvdXQgdGhpcyB0ZWNobmlxdWUsIHRoaXMgaHR0cDovL3NwYXJlY3ljbGVzLndvcmRwcmVzcy5jb20vMjAxMi8wMy8wOC9pbmplY3QtY29udGVudC1pbnRvLWEtbmV3LWlmcmFtZS9cclxufVxyXG5cclxuIiwiLyogQ1JVREwgSGVscGVyICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxudmFyIGdldFRleHQgPSByZXF1aXJlKCcuL2dldFRleHQnKTtcclxudmFyIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5cclxuZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MgPSB7XHJcbiAgZWZmZWN0czoge1xyXG4gICAgJ3Nob3ctdmlld2VyJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sXHJcbiAgICAnaGlkZS12aWV3ZXInOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSxcclxuICAgICdzaG93LWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LCAvLyB0aGUgc2FtZSBhcyBqcXVlcnktdWkgeyBlZmZlY3Q6ICdzbGlkZScsIGR1cmF0aW9uOiAnc2xvdycsIGRpcmVjdGlvbjogJ2Rvd24nIH1cclxuICAgICdoaWRlLWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9XHJcbiAgfSxcclxuICBldmVudHM6IHtcclxuICAgICdlZGl0LWVuZHMnOiAnY3J1ZGwtZWRpdC1lbmRzJyxcclxuICAgICdlZGl0LXN0YXJ0cyc6ICdjcnVkbC1lZGl0LXN0YXJ0cycsXHJcbiAgICAnZWRpdG9yLXJlYWR5JzogJ2NydWRsLWVkaXRvci1yZWFkeScsXHJcbiAgICAnZWRpdG9yLXNob3dlZCc6ICdjcnVkbC1lZGl0b3Itc2hvd2VkJyxcclxuICAgICdjcmVhdGUnOiAnY3J1ZGwtY3JlYXRlJyxcclxuICAgICd1cGRhdGUnOiAnY3J1ZGwtdXBkYXRlJyxcclxuICAgICdkZWxldGUnOiAnY3J1ZGwtZGVsZXRlJ1xyXG4gIH0sXHJcbiAgZGF0YToge1xyXG4gICAgJ2ZvY3VzLWNsb3Nlc3QnOiB7XHJcbiAgICAgIG5hbWU6ICdjcnVkbC1mb2N1cy1jbG9zZXN0JyxcclxuICAgICAgJ2RlZmF1bHQnOiAnKidcclxuICAgIH0sXHJcbiAgICAnZm9jdXMtbWFyZ2luJzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtbWFyZ2luJyxcclxuICAgICAgJ2RlZmF1bHQnOiAwXHJcbiAgICB9LFxyXG4gICAgJ2ZvY3VzLWR1cmF0aW9uJzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtZHVyYXRpb24nLFxyXG4gICAgICAnZGVmYXVsdCc6IDIwMFxyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gIFV0aWxpdHkgdG8gZ2V0IGEgZGF0YSB2YWx1ZSBvciB0aGUgZGVmYXVsdCBiYXNlZCBvbiB0aGUgaW5zdGFuY2VcclxuICBzZXR0aW5ncyBvbiB0aGUgZ2l2ZW4gZWxlbWVudFxyXG4qKi9cclxuZnVuY3Rpb24gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBlbCwgc2V0dGluZ05hbWUpIHtcclxuICB2YXJcclxuICAgIHNldHRpbmcgPSBpbnN0YW5jZS5zZXR0aW5ncy5kYXRhW3NldHRpbmdOYW1lXSxcclxuICAgIHZhbCA9IGVsLmRhdGEoc2V0dGluZy5uYW1lKSB8fCBzZXR0aW5nWydkZWZhdWx0J107XHJcbiAgcmV0dXJuIHZhbDtcclxufVxyXG5cclxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uIHNldHVwQ3J1ZGwob25TdWNjZXNzLCBvbkVycm9yLCBvbkNvbXBsZXRlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uOiBmdW5jdGlvbiBvbihzZWxlY3Rvciwgc2V0dGluZ3MpIHtcclxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCAnLmNydWRsJztcclxuICAgICAgdmFyIGluc3RhbmNlID0ge1xyXG4gICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcclxuICAgICAgICBlbGVtZW50czogJChzZWxlY3RvcilcclxuICAgICAgfTtcclxuICAgICAgLy8gRXh0ZW5kaW5nIGRlZmF1bHQgc2V0dGluZ3Mgd2l0aCBwcm92aWRlZCBvbmVzLFxyXG4gICAgICAvLyBidXQgc29tZSBjYW4gYmUgdHdlYWsgb3V0c2lkZSB0b28uXHJcbiAgICAgIGluc3RhbmNlLnNldHRpbmdzID0gJC5leHRlbmQodHJ1ZSwgZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MsIHNldHRpbmdzKTtcclxuICAgICAgaW5zdGFuY2UuZWxlbWVudHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGNydWRsID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoY3J1ZGwuZGF0YSgnX19jcnVkbF9pbml0aWFsaXplZF9fJykgPT09IHRydWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZGN0eCA9IGNydWRsLmRhdGEoJ2NydWRsLWNvbnRleHQnKSB8fCAnJztcclxuICAgICAgICB2YXIgdndyID0gY3J1ZGwuZmluZCgnLmNydWRsLXZpZXdlcicpO1xyXG4gICAgICAgIHZhciBkdHIgPSBjcnVkbC5maW5kKCcuY3J1ZGwtZWRpdG9yJyk7XHJcbiAgICAgICAgdmFyIGlpZHBhciA9IGNydWRsLmRhdGEoJ2NydWRsLWl0ZW0taWQtcGFyYW1ldGVyJykgfHwgJ0l0ZW1JRCc7XHJcbiAgICAgICAgdmFyIGZvcm1wYXJzID0geyBhY3Rpb246ICdjcmVhdGUnIH07XHJcbiAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IDA7XHJcbiAgICAgICAgdmFyIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0RXh0cmFRdWVyeShlbCkge1xyXG4gICAgICAgICAgLy8gR2V0IGV4dHJhIHF1ZXJ5IG9mIHRoZSBlbGVtZW50LCBpZiBhbnk6XHJcbiAgICAgICAgICB2YXIgeHEgPSBlbC5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpIHx8ICcnO1xyXG4gICAgICAgICAgaWYgKHhxKSB4cSA9ICcmJyArIHhxO1xyXG4gICAgICAgICAgLy8gSXRlcmF0ZSBhbGwgcGFyZW50cyBpbmNsdWRpbmcgdGhlICdjcnVkbCcgZWxlbWVudCAocGFyZW50c1VudGlsIGV4Y2x1ZGVzIHRoZSBmaXJzdCBlbGVtZW50IGdpdmVuLFxyXG4gICAgICAgICAgLy8gYmVjYXVzZSBvZiB0aGF0IHdlIGdldCBpdHMgcGFyZW50KCkpXHJcbiAgICAgICAgICAvLyBGb3IgYW55IG9mIHRoZW0gd2l0aCBhbiBleHRyYS1xdWVyeSwgYXBwZW5kIGl0OlxyXG4gICAgICAgICAgZWwucGFyZW50c1VudGlsKGNydWRsLnBhcmVudCgpLCAnW2RhdGEtY3J1ZGwtZXh0cmEtcXVlcnldJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB4ID0gJCh0aGlzKS5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpO1xyXG4gICAgICAgICAgICBpZiAoeCkgeHEgKz0gJyYnICsgeDtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIHhxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3J1ZGwuZmluZCgnLmNydWRsLWNyZWF0ZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSAwO1xyXG4gICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ2NyZWF0ZSc7XHJcbiAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG4gICAgICAgICAgZHRyLnJlbG9hZCh7XHJcbiAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKHVybCwgZGVmYXVsdFVybCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VXJsICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGR0ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LWVkaXRvciddKVxyXG4gICAgICAgICAgICAgIC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgICBkdHIuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEhpZGUgdmlld2VyIHdoZW4gaW4gZWRpdG9yOlxyXG4gICAgICAgICAgdndyLnhoaWRlKGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtdmlld2VyJ10pO1xyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSlcclxuICAgICAgICAgIC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50cy5jcmVhdGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdndyXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtdXBkYXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAndXBkYXRlJztcclxuICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICBkdHIucmVsb2FkKHtcclxuICAgICAgICAgICAgdXJsOiBmdW5jdGlvbiAodXJsLCBkZWZhdWx0VXJsKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRVcmwgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgZHRyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctZWRpdG9yJ10pXHJcbiAgICAgICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIFtkdHJdKTtcclxuICAgICAgICAgICAgICAgIGR0ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgLy8gSGlkZSB2aWV3ZXIgd2hlbiBpbiBlZGl0b3I6XHJcbiAgICAgICAgICB2d3IueGhpZGUoaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS12aWV3ZXInXSk7XHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddKVxyXG4gICAgICAgICAgLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzLnVwZGF0ZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtZGVsZXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuXHJcbiAgICAgICAgICBpZiAoY29uZmlybShnZXRUZXh0KCdjb25maXJtLWRlbGV0ZS1jcnVkbC1pdGVtLW1lc3NhZ2U6JyArIGRjdHgpKSkge1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCc8ZGl2PicgKyBnZXRUZXh0KCdkZWxldGUtY3J1ZGwtaXRlbS1sb2FkaW5nLW1lc3NhZ2U6JyArIGRjdHgpICsgJzwvZGl2PicsIGl0ZW0pO1xyXG4gICAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gaXRlbWlkO1xyXG4gICAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAnZGVsZXRlJztcclxuICAgICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICB1cmw6IGR0ci5hdHRyKCdkYXRhLXNvdXJjZS11cmwnKSArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHEsXHJcbiAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbignPGRpdj4nICsgZGF0YS5SZXN1bHQgKyAnPC9kaXY+JywgaXRlbSwgbnVsbCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5mYWRlT3V0KCdzbG93JywgZnVuY3Rpb24gKCkgeyBpdGVtLnJlbW92ZSgpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgICAgICAgICAgICAgb25FcnJvcihqeCwgbWVzc2FnZSwgZXgpO1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UoaXRlbSk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjb21wbGV0ZTogb25Db21wbGV0ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydkZWxldGUnXSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBmaW5pc2hFZGl0KCkge1xyXG4gICAgICAgICAgZnVuY3Rpb24gb25jb21wbGV0ZShhbm90aGVyT25Db21wbGV0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIC8vIFNob3cgYWdhaW4gdGhlIFZpZXdlclxyXG4gICAgICAgICAgICAgIC8vdndyLnNsaWRlRG93bignc2xvdycpO1xyXG4gICAgICAgICAgICAgIGlmICghdndyLmlzKCc6dmlzaWJsZScpKVxyXG4gICAgICAgICAgICAgICAgdndyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctdmlld2VyJ10pO1xyXG4gICAgICAgICAgICAgIC8vIE1hcmsgdGhlIGZvcm0gYXMgdW5jaGFuZ2VkIHRvIGF2b2lkIHBlcnNpc3Rpbmcgd2FybmluZ3NcclxuICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcbiAgICAgICAgICAgICAgLy8gQXZvaWQgY2FjaGVkIGNvbnRlbnQgb24gdGhlIEVkaXRvclxyXG4gICAgICAgICAgICAgIGR0ci5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBTY3JvbGwgdG8gcHJlc2VydmUgY29ycmVjdCBmb2N1cyAob24gbGFyZ2UgcGFnZXMgd2l0aCBzaGFyZWQgY29udGVudCB1c2VyIGNhbiBnZXRcclxuICAgICAgICAgICAgICAvLyBsb3N0IGFmdGVyIGFuIGVkaXRpb24pXHJcbiAgICAgICAgICAgICAgLy8gKHdlIHF1ZXVlIGFmdGVyIHZ3ci54c2hvdyBiZWNhdXNlIHdlIG5lZWQgdG8gZG8gaXQgYWZ0ZXIgdGhlIHhzaG93IGZpbmlzaClcclxuICAgICAgICAgICAgICB2d3IucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzQ2xvc2VzdCA9IGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgY3J1ZGwsICdmb2N1cy1jbG9zZXN0Jyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNFbGVtZW50ID0gY3J1ZGwuY2xvc2VzdChmb2N1c0Nsb3Nlc3QpO1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gY2xvc2VzdCwgZ2V0IHRoZSBjcnVkbFxyXG4gICAgICAgICAgICAgICAgaWYgKGZvY3VzRWxlbWVudC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICAgIGZvY3VzRWxlbWVudCA9IGNydWRsO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzTWFyZ2luID0gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBjcnVkbCwgJ2ZvY3VzLW1hcmdpbicpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzRHVyYXRpb24gPSBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGNydWRsLCAnZm9jdXMtZHVyYXRpb24nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhmb2N1c0VsZW1lbnQsIHsgbWFyZ2luVG9wOiBmb2N1c01hcmdpbiwgZHVyYXRpb246IGZvY3VzRHVyYXRpb24gfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdndyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBjYWxsYmFjazpcclxuICAgICAgICAgICAgICBpZiAodHlwZW9mIChhbm90aGVyT25Db21wbGV0ZSkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICBhbm90aGVyT25Db21wbGV0ZS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBOT1RFOiBGaXJzdCwgd2Ugbm90aWZ5IHRoZSBjaGFuZ2VzLXNhdmVkIGFuZCBldmVudCwgdGhpcyBsYXN0IGFsbG93c1xyXG4gICAgICAgICAgLy8gY2xpZW50IHNjcmlwdHMgdG8gZG8gdGFza3MganVzdCBiZWZvcmUgdGhlIGVkaXRvciBiZWdpbnMgdG8gY2xvc2VcclxuICAgICAgICAgIC8vIChhdm9pZGluZyBwcm9ibGVtcyBsaWtlIHdpdGggdGhlICdtb3ZlRm9jdXNUbycgbm90IGJlaW5nIHByZWNpc2UgaWYgdGhlXHJcbiAgICAgICAgICAvLyBhbmltYXRpb24gZHVyYXRpb24gaXMgdGhlIHNhbWUgb24gY2xpZW50IHNjcmlwdCBhbmQgaGlkZS1lZGl0b3IpLlxyXG4gICAgICAgICAgLy8gVGhlbiwgZWRpdG9yIGdldHMgaGlkZGVuXHJcbiAgICAgICAgICAvLyBUT0RPOiBUaGlzIGNhbiBnZXQgZW5oYW5jZWQgdG8gYWxsb3cgbGFyZ2VyIGR1cmF0aW9ucyBvbiBjbGllbnQtc2NyaXB0c1xyXG4gICAgICAgICAgLy8gd2l0aG91dCBhZmZlY3QgbW92ZUZvY3VzVG8gcGFzc2luZyBpbiB0aGUgdHJpZ2dlciBhbiBvYmplY3QgdGhhdCBob2xkc1xyXG4gICAgICAgICAgLy8gYSBQcm9taXNlL0RlZmVycmVkIHRvIGJlIHNldCBieSBjbGllbnQtc2NyaXB0IGFzICdoaWRlLWVkaXRvciAmXHJcbiAgICAgICAgICAvLyB2aWV3ZXItc2hvdyBtdXN0IHN0YXJ0IHdoZW4gdGhpcyBwcm9taXNlIGdldHMgZnVsbGZpbGxlZCcsIGFsbG93aW5nIHRvXHJcbiAgICAgICAgICAvLyBoYXZlIGEgc2VxdWVuY2UgKGZpcnN0IGNsaWVudC1zY3JpcHRzLCB0aGVuIGhpZGUtZWRpdG9yKS5cclxuXHJcbiAgICAgICAgICAvLyBNYXJrIGZvcm0gYXMgc2F2ZWQgdG8gcmVtb3ZlIHRoZSAnaGFzLWNoYW5nZXMnIG1hcmtcclxuICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGR0ci5maW5kKCdmb3JtJykuZ2V0KDApKTtcclxuXHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSk7XHJcblxyXG4gICAgICAgICAgLy8gV2UgbmVlZCBhIGN1c3RvbSBjb21wbGV0ZSBjYWxsYmFjaywgYnV0IHRvIG5vdCByZXBsYWNlIHRoZSB1c2VyIGNhbGxiYWNrLCB3ZVxyXG4gICAgICAgICAgLy8gY2xvbmUgZmlyc3QgdGhlIHNldHRpbmdzIGFuZCB0aGVuIGFwcGx5IG91ciBjYWxsYmFjayB0aGF0IGludGVybmFsbHkgd2lsbCBjYWxsXHJcbiAgICAgICAgICAvLyB0aGUgdXNlciBjYWxsYmFjayBwcm9wZXJseSAoaWYgYW55KVxyXG4gICAgICAgICAgdmFyIHdpdGhjYWxsYmFjayA9ICQuZXh0ZW5kKHRydWUsIHt9LCBpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLWVkaXRvciddKTtcclxuICAgICAgICAgIHdpdGhjYWxsYmFjay5jb21wbGV0ZSA9IG9uY29tcGxldGUod2l0aGNhbGxiYWNrLmNvbXBsZXRlKTtcclxuICAgICAgICAgIC8vIEhpZGluZyBlZGl0b3I6XHJcbiAgICAgICAgICBkdHIueGhpZGUod2l0aGNhbGxiYWNrKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkdHJcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC1jYW5jZWwnLCBmaW5pc2hFZGl0KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsICcuYWpheC1ib3gnLCBmaW5pc2hFZGl0KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0JywgJ2Zvcm0sIGZpZWxkc2V0JywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDAgfHwgZGF0YS5Db2RlID09IDUgfHwgZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyB2aWV3ZXIgYW5kIHJlbG9hZCBsaXN0OlxyXG4gICAgICAgICAgICB2d3IuZmluZCgnLmNydWRsLWxpc3QnKS5yZWxvYWQoeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gQSBzbWFsbCBkZWxheSB0byBsZXQgdXNlciB0byBzZWUgdGhlIG5ldyBtZXNzYWdlIG9uIGJ1dHRvbiBiZWZvcmVcclxuICAgICAgICAgIC8vIGhpZGUgaXQgKGJlY2F1c2UgaXMgaW5zaWRlIHRoZSBlZGl0b3IpXHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDUpXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmluaXNoRWRpdCwgMTAwMCk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLGZpZWxkc2V0JywgZnVuY3Rpb24gKGpiLCBmb3JtLCBqeCkge1xyXG4gICAgICAgICAgLy8gRW1pdCB0aGUgJ2VkaXRvci1yZWFkeScgZXZlbnQgb24gZWRpdG9yIEh0bWwgYmVpbmcgcmVwbGFjZWRcclxuICAgICAgICAgIC8vIChmaXJzdCBsb2FkIG9yIG5leHQgbG9hZHMgYmVjYXVzZSBvZiBzZXJ2ZXItc2lkZSB2YWxpZGF0aW9uIGVycm9ycylcclxuICAgICAgICAgIC8vIHRvIGFsbG93IGxpc3RlbmVycyB0byBkbyBhbnkgd29yayBvdmVyIGl0cyAobmV3KSBET00gZWxlbWVudHMuXHJcbiAgICAgICAgICAvLyBUaGUgc2Vjb25kIGN1c3RvbSBwYXJhbWV0ZXIgcGFzc2VkIG1lYW5zIGlzIG1lYW4gdG9cclxuICAgICAgICAgIC8vIGRpc3Rpbmd1aXNoIHRoZSBmaXJzdCB0aW1lIGNvbnRlbnQgbG9hZCBhbmQgc3VjY2Vzc2l2ZSB1cGRhdGVzIChkdWUgdG8gdmFsaWRhdGlvbiBlcnJvcnMpLlxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBbZHRyLCBlZGl0b3JJbml0aWFsTG9hZF0pO1xyXG5cclxuICAgICAgICAgIC8vIE5leHQgdGltZXM6XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nLCB0cnVlKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gaW5zdGFuY2U7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuIiwiLyoqXHJcbiAgVGhpcyBtb2R1bGUgaGFzIHV0aWxpdGllcyB0byBjb252ZXJ0IGEgRGF0ZSBvYmplY3QgaW50b1xyXG4gIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvbGxvd2luZyBJU08tODYwMSBzcGVjaWZpY2F0aW9uLlxyXG4gIFxyXG4gIElOQ09NUExFVEUgQlVUIFVTRUZVTC5cclxuICBcclxuICBTdGFuZGFyZCByZWZlcnMgdG8gZm9ybWF0IHZhcmlhdGlvbnM6XHJcbiAgLSBiYXNpYzogbWluaW11bSBzZXBhcmF0b3JzXHJcbiAgLSBleHRlbmRlZDogYWxsIHNlcGFyYXRvcnMsIG1vcmUgcmVhZGFibGVcclxuICBCeSBkZWZhdWx0LCBhbGwgbWV0aG9kcyBwcmludHMgdGhlIGJhc2ljIGZvcm1hdCxcclxuICBleGNlcHRzIHRoZSBwYXJhbWV0ZXIgJ2V4dGVuZGVkJyBpcyBzZXQgdG8gdHJ1ZVxyXG5cclxuICBUT0RPOlxyXG4gIC0gVFo6IGFsbG93IGZvciBUaW1lIFpvbmUgc3VmZml4ZXMgKHBhcnNlIGFsbG93IGl0IGFuZCBcclxuICAgIGRldGVjdCBVVEMgYnV0IGRvIG5vdGhpbmcgd2l0aCBhbnkgdGltZSB6b25lIG9mZnNldCBkZXRlY3RlZClcclxuICAtIEZyYWN0aW9ucyBvZiBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLmRhdGVVVEMgPSBmdW5jdGlvbiBkYXRlVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIG0gPSAoZGF0ZS5nZXRVVENNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgZCA9IGRhdGUuZ2V0VVRDRGF0ZSgpLnRvU3RyaW5nKCksXHJcbiAgICAgIHkgPSBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgIGQgPSAnMCcgKyBkO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4geSArICctJyArIG0gKyAnLScgKyBkO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiB5ICsgbSArIGQ7XHJcbn07XHJcblxyXG5leHBvcnRzLmRhdGVMb2NhbCA9IGZ1bmN0aW9uIGRhdGVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBtID0gKGRhdGUuZ2V0TW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgIGQgPSBkYXRlLmdldERhdGUoKS50b1N0cmluZygpLFxyXG4gICAgICB5ID0gZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCk7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgIGQgPSAnMCcgKyBkO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4geSArICctJyArIG0gKyAnLScgKyBkO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiB5ICsgbSArIGQ7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycywgbWludXRlcyBhbmQgc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy50aW1lTG9jYWwgPSBmdW5jdGlvbiB0aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgcyA9IGRhdGUuZ2V0U2Vjb25kcygpLnRvU3RyaW5nKCksXHJcbiAgICAgIGhtID0gZXhwb3J0cy5zaG9ydFRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PSAxKVxyXG4gICAgcyA9ICcwJyArIHM7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBobSArICc6JyArIHM7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGhtICsgcztcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzLCBtaW51dGVzIGFuZCBzZWNvbmRzIFVUQ1xyXG4qKi9cclxuZXhwb3J0cy50aW1lVVRDID0gZnVuY3Rpb24gdGltZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBzID0gZGF0ZS5nZXRVVENTZWNvbmRzKCkudG9TdHJpbmcoKSxcclxuICAgICAgaG0gPSBleHBvcnRzLnNob3J0VGltZVVUQyhkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PSAxKVxyXG4gICAgcyA9ICcwJyArIHM7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBobSArICc6JyArIHM7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGhtICsgcztcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzIGFuZCBtaW51dGVzXHJcbioqL1xyXG5leHBvcnRzLnNob3J0VGltZUxvY2FsID0gZnVuY3Rpb24gc2hvcnRUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgaCA9IGRhdGUuZ2V0SG91cnMoKS50b1N0cmluZygpLFxyXG4gICAgICBtID0gZGF0ZS5nZXRNaW51dGVzKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKGgubGVuZ3RoID09IDEpXHJcbiAgICBoID0gJzAnICsgaDtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaCArICc6JyArIG07XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGggKyBtO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMgYW5kIG1pbnV0ZXMgVVRDXHJcbioqL1xyXG5leHBvcnRzLnNob3J0VGltZVVUQyA9IGZ1bmN0aW9uIHNob3J0VGltZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBoID0gZGF0ZS5nZXRVVENIb3VycygpLnRvU3RyaW5nKCksXHJcbiAgICAgIG0gPSBkYXRlLmdldFVUQ01pbnV0ZXMoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAoaC5sZW5ndGggPT0gMSlcclxuICAgIGggPSAnMCcgKyBoO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBoICsgJzonICsgbTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaCArIG07XHJcbn07XHJcblxyXG4vKipcclxuICBUT0RPOiBIb3VycywgbWludXRlcywgc2Vjb25kcyBhbmQgZnJhY3Rpb25zIG9mIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMubG9uZ1RpbWVMb2NhbCA9IGZ1bmN0aW9uIGxvbmdUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICAvL1RPRE9cclxufTtcclxuXHJcbi8qKlxyXG4gIFVUQyBEYXRlIGFuZCBUaW1lIHNlcGFyYXRlZCBieSBULlxyXG4gIFN0YW5kYXJkIGFsbG93cyBvbWl0IHRoZSBzZXBhcmF0b3IgYXMgZXhjZXB0aW9uYWwsIGJvdGggcGFydHMgYWdyZWVtZW50LCBjYXNlcztcclxuICBjYW4gYmUgZG9uZSBwYXNzaW5nIHRydWUgYXMgb2Ygb21pdFNlcGFyYXRvciBwYXJhbWV0ZXIsIGJ5IGRlZmF1bHQgZmFsc2UuXHJcbioqL1xyXG5leHBvcnRzLmRhdGV0aW1lTG9jYWwgPSBmdW5jdGlvbiBkYXRldGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkLCBvbWl0U2VwYXJhdG9yKSB7XHJcbiAgdmFyIGQgPSBleHBvcnRzLmRhdGVMb2NhbChkYXRlLCBleHRlbmRlZCksXHJcbiAgICAgIHQgPSBleHBvcnRzLnRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChvbWl0U2VwYXJhdG9yKVxyXG4gICAgcmV0dXJuIGQgKyB0O1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBkICsgJ1QnICsgdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIExvY2FsIERhdGUgYW5kIFRpbWUgc2VwYXJhdGVkIGJ5IFQuXHJcbiAgU3RhbmRhcmQgYWxsb3dzIG9taXQgdGhlIHNlcGFyYXRvciBhcyBleGNlcHRpb25hbCwgYm90aCBwYXJ0cyBhZ3JlZW1lbnQsIGNhc2VzO1xyXG4gIGNhbiBiZSBkb25lIHBhc3NpbmcgdHJ1ZSBhcyBvZiBvbWl0U2VwYXJhdG9yIHBhcmFtZXRlciwgYnkgZGVmYXVsdCBmYWxzZS5cclxuKiovXHJcbmV4cG9ydHMuZGF0ZXRpbWVVVEMgPSBmdW5jdGlvbiBkYXRldGltZVVUQyhkYXRlLCBleHRlbmRlZCwgb21pdFNlcGFyYXRvcikge1xyXG4gIHZhciBkID0gZXhwb3J0cy5kYXRlVVRDKGRhdGUsIGV4dGVuZGVkKSxcclxuICAgICAgdCA9IGV4cG9ydHMudGltZVVUQyhkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChvbWl0U2VwYXJhdG9yKVxyXG4gICAgcmV0dXJuIGQgKyB0O1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBkICsgJ1QnICsgdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIFBhcnNlIGEgc3RyaW5nIGludG8gYSBEYXRlIG9iamVjdCBpZiBpcyBhIHZhbGlkIElTTy04NjAxIGZvcm1hdC5cclxuICBQYXJzZSBzaW5nbGUgZGF0ZSwgc2luZ2xlIHRpbWUgb3IgZGF0ZS10aW1lIGZvcm1hdHMuXHJcbiAgSU1QT1JUQU5UOiBJdCBkb2VzIE5PVCBjb252ZXJ0IGJldHdlZW4gdGhlIGRhdGVzdHIgVGltZVpvbmUgYW5kIHRoZVxyXG4gIGxvY2FsIFRpbWVab25lIChlaXRoZXIgaXQgYWxsb3dzIGRhdGVzdHIgdG8gaW5jbHVkZWQgVGltZVpvbmUgaW5mb3JtYXRpb24pXHJcbiAgVE9ETzogT3B0aW9uYWwgVCBzZXBhcmF0b3IgaXMgbm90IGFsbG93ZWQuXHJcbiAgVE9ETzogTWlsbGlzZWNvbmRzL2ZyYWN0aW9ucyBvZiBzZWNvbmRzIG5vdCBzdXBwb3J0ZWRcclxuKiovXHJcbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiBwYXJzZShkYXRlc3RyKSB7XHJcbiAgdmFyIGR0ID0gZGF0ZXN0ci5zcGxpdCgnVCcpLFxyXG4gICAgZGF0ZSA9IGR0WzBdLFxyXG4gICAgdGltZSA9IGR0Lmxlbmd0aCA9PSAyID8gZHRbMV0gOiBudWxsO1xyXG5cclxuICBpZiAoZHQubGVuZ3RoID4gMilcclxuICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCBmb3JtYXRcIik7XHJcblxyXG4gIC8vIENoZWNrIGlmIGRhdGUgY29udGFpbnMgYSB0aW1lO1xyXG4gIC8vIGJlY2F1c2UgbWF5YmUgZGF0ZXN0ciBpcyBvbmx5IHRoZSB0aW1lIHBhcnRcclxuICBpZiAoLzp8XlxcZHs0LDZ9W15cXC1dKFxcLlxcZCopPyg/Olp8WytcXC1dLiopPyQvLnRlc3QoZGF0ZSkpIHtcclxuICAgIHRpbWUgPSBkYXRlO1xyXG4gICAgZGF0ZSA9IG51bGw7XHJcbiAgfVxyXG5cclxuICB2YXIgeSwgbSwgZCwgaCwgbW0sIHMsIHR6LCB1dGM7XHJcblxyXG4gIGlmIChkYXRlKSB7XHJcbiAgICB2YXIgZHBhcnRzID0gLyhcXGR7NH0pXFwtPyhcXGR7Mn0pXFwtPyhcXGR7Mn0pLy5leGVjKGRhdGUpO1xyXG4gICAgaWYgKCFkcGFydHMpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCBkYXRlIGZvcm1hdFwiKTtcclxuXHJcbiAgICB5ID0gZHBhcnRzWzFdO1xyXG4gICAgbSA9IGRwYXJ0c1syXTtcclxuICAgIGQgPSBkcGFydHNbM107XHJcbiAgfVxyXG5cclxuICBpZiAodGltZSkge1xyXG4gICAgdmFyIHRwYXJ0cyA9IC8oXFxkezJ9KTo/KFxcZHsyfSkoPzo6PyhcXGR7Mn0pKT8oWnxbK1xcLV0uKik/Ly5leGVjKHRpbWUpO1xyXG4gICAgaWYgKCF0cGFydHMpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCB0aW1lIGZvcm1hdFwiKTtcclxuXHJcbiAgICBoID0gdHBhcnRzWzFdO1xyXG4gICAgbW0gPSB0cGFydHNbMl07XHJcbiAgICBzID0gdHBhcnRzLmxlbmd0aCA+IDMgPyB0cGFydHNbM10gOiBudWxsO1xyXG4gICAgdHogPSB0cGFydHMubGVuZ3RoID4gNCA/IHRwYXJ0c1s0XSA6IG51bGw7XHJcbiAgICAvLyBEZXRlY3RzIGlmIGlzIGEgdGltZSBpbiBVVEM6XHJcbiAgICB1dGMgPSAvXlokL2kudGVzdCh0eik7XHJcbiAgfVxyXG5cclxuICAvLyBWYXIgdG8gaG9sZCB0aGUgcGFyc2VkIHZhbHVlLCB3ZSBzdGFydCB3aXRoIHRvZGF5LFxyXG4gIC8vIHRoYXQgd2lsbCBmaWxsIHRoZSBtaXNzaW5nIHBhcnRzXHJcbiAgdmFyIHBhcnNlZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICBpZiAoZGF0ZSkge1xyXG4gICAgLy8gVXBkYXRpbmcgdGhlIGRhdGUgb2JqZWN0IHdpdGggZWFjaCB5ZWFyLCBtb250aCBhbmQgZGF0ZS9kYXkgZGV0ZWN0ZWQ6XHJcbiAgICBpZiAodXRjKVxyXG4gICAgICBwYXJzZWREYXRlLnNldFVUQ0Z1bGxZZWFyKHksIG0sIGQpO1xyXG4gICAgZWxzZVxyXG4gICAgICBwYXJzZWREYXRlLnNldEZ1bGxZZWFyKHksIG0sIGQpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRpbWUpIHtcclxuICAgIGlmICh1dGMpXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0VVRDSG91cnMoaCwgbW0sIHMpO1xyXG4gICAgZWxzZVxyXG4gICAgICBwYXJzZWREYXRlLnNldEhvdXJzKGgsIG1tLCBzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gQSBkYXRlIHdpdGhvdXQgdGltZSBwYXJ0IG11c3QgYmUgY29uc2lkZXJlZCBhcyAwMDowMDowMCBpbnN0ZWFkIG9mIGN1cnJlbnQgdGltZVxyXG4gICAgcGFyc2VkRGF0ZS5zZXRIb3VycygwLCAwLCAwKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBwYXJzZWREYXRlO1xyXG59OyIsIi8qIERhdGUgcGlja2VyIGluaXRpYWxpemF0aW9uIGFuZCB1c2VcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBEYXRlUGlja2VyKCkge1xyXG4gICAgLy8gRGF0ZSBQaWNrZXJcclxuICAgICQuZGF0ZXBpY2tlci5zZXREZWZhdWx0cygkLmRhdGVwaWNrZXIucmVnaW9uYWxbJCgnaHRtbCcpLmF0dHIoJ2xhbmcnKV0pO1xyXG4gICAgJCgnLmRhdGUtcGljaycsIGRvY3VtZW50KS5kYXRlcGlja2VyKHtcclxuICAgICAgICBzaG93QW5pbTogJ2JsaW5kJ1xyXG4gICAgfSk7XHJcbiAgICBhcHBseURhdGVQaWNrZXIoKTtcclxufVxyXG5mdW5jdGlvbiBhcHBseURhdGVQaWNrZXIoZWxlbWVudCkge1xyXG4gICAgJChcIi5kYXRlLXBpY2tcIiwgZWxlbWVudCB8fCBkb2N1bWVudClcclxuICAgIC8vLnZhbChuZXcgRGF0ZSgpLmFzU3RyaW5nKCQuZGF0ZXBpY2tlci5fZGVmYXVsdHMuZGF0ZUZvcm1hdCkpXHJcbiAgICAuZGF0ZXBpY2tlcih7XHJcbiAgICAgICAgc2hvd0FuaW06IFwiYmxpbmRcIlxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXQ6IHNldHVwRGF0ZVBpY2tlcixcclxuICAgICAgICBhcHBseTogYXBwbHlEYXRlUGlja2VyXHJcbiAgICB9O1xyXG4iLCIvKiBGb3JtYXQgYSBkYXRlIGFzIFlZWVktTU0tREQgaW4gVVRDIGZvciBzYXZlIHVzXHJcbiAgICB0byBpbnRlcmNoYW5nZSB3aXRoIG90aGVyIG1vZHVsZXMgb3IgYXBwcy5cclxuKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcoZGF0ZSkge1xyXG4gICAgdmFyIG0gPSAoZGF0ZS5nZXRVVENNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgICBkID0gZGF0ZS5nZXRVVENEYXRlKCkudG9TdHJpbmcoKTtcclxuICAgIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgIG0gPSAnMCcgKyBtO1xyXG4gICAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICAgICAgZCA9ICcwJyArIGQ7XHJcbiAgICByZXR1cm4gZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCkgKyAnLScgKyBtICsgJy0nICsgZDtcclxufTsiLCIvKiogQW4gaTE4biB1dGlsaXR5LCBnZXQgYSB0cmFuc2xhdGlvbiB0ZXh0IGJ5IGxvb2tpbmcgZm9yIHNwZWNpZmljIGVsZW1lbnRzIGluIHRoZSBodG1sXHJcbndpdGggdGhlIG5hbWUgZ2l2ZW4gYXMgZmlyc3QgcGFyYW1lbnRlciBhbmQgYXBwbHlpbmcgdGhlIGdpdmVuIHZhbHVlcyBvbiBzZWNvbmQgYW5kIFxyXG5vdGhlciBwYXJhbWV0ZXJzLlxyXG4gICAgVE9ETzogUkUtSU1QTEVNRU5UIG5vdCB1c2luZyBqUXVlcnkgbmVsc2UgRE9NIGVsZW1lbnRzLCBvciBhbG1vc3Qgbm90IGVsZW1lbnRzIGluc2lkZSBib2R5XHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxuZnVuY3Rpb24gZ2V0VGV4dCgpIHtcclxuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgLy8gR2V0IGtleSBhbmQgdHJhbnNsYXRlIGl0XHJcbiAgICB2YXIgZm9ybWF0dGVkID0gYXJnc1swXTtcclxuICAgIHZhciB0ZXh0ID0gJCgnI2xjcmVzLScgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGZvcm1hdHRlZCkpLnRleHQoKTtcclxuICAgIGlmICh0ZXh0KVxyXG4gICAgICAgIGZvcm1hdHRlZCA9IHRleHQ7XHJcbiAgICAvLyBBcHBseSBmb3JtYXQgdG8gdGhlIHRleHQgd2l0aCBhZGRpdGlvbmFsIHBhcmFtZXRlcnNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCdcXFxceycgKyBpICsgJ1xcXFx9JywgJ2dpJyk7XHJcbiAgICAgICAgZm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UocmVnZXhwLCBhcmdzW2kgKyAxXSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZm9ybWF0dGVkO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFRleHQ7IiwiLyoqIFJldHVybnMgdGhlIHBhdGggdG8gdGhlIGdpdmVuIGVsZW1lbnQgaW4gWFBhdGggY29udmVudGlvblxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGdldFhQYXRoKGVsZW1lbnQpIHtcclxuICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnQuaWQpXHJcbiAgICAgICAgcmV0dXJuICcvLypbQGlkPVwiJyArIGVsZW1lbnQuaWQgKyAnXCJdJztcclxuICAgIHZhciB4cGF0aCA9ICcnO1xyXG4gICAgZm9yICg7IGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PSAxOyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gJChlbGVtZW50LnBhcmVudE5vZGUpLmNoaWxkcmVuKGVsZW1lbnQudGFnTmFtZSkuaW5kZXgoZWxlbWVudCkgKyAxO1xyXG4gICAgICAgIGlkID0gKGlkID4gMSA/ICdbJyArIGlkICsgJ10nIDogJycpO1xyXG4gICAgICAgIHhwYXRoID0gJy8nICsgZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgKyBpZCArIHhwYXRoO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHhwYXRoO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFhQYXRoO1xyXG4iLCIvLyBJdCBleGVjdXRlcyB0aGUgZ2l2ZW4gJ3JlYWR5JyBmdW5jdGlvbiBhcyBwYXJhbWV0ZXIgd2hlblxyXG4vLyBtYXAgZW52aXJvbm1lbnQgaXMgcmVhZHkgKHdoZW4gZ29vZ2xlIG1hcHMgYXBpIGFuZCBzY3JpcHQgaXNcclxuLy8gbG9hZGVkIGFuZCByZWFkeSB0byB1c2UsIG9yIGlubWVkaWF0ZWx5IGlmIGlzIGFscmVhZHkgbG9hZGVkKS5cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpO1xyXG5cclxuLy8gUHJpdmF0ZSBzdGF0aWMgY29sbGVjdGlvbiBvZiBjYWxsYmFja3MgcmVnaXN0ZXJlZFxyXG52YXIgc3RhY2sgPSBbXTtcclxuXHJcbnZhciBnb29nbGVNYXBSZWFkeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ29vZ2xlTWFwUmVhZHkocmVhZHkpIHtcclxuICBzdGFjay5wdXNoKHJlYWR5KTtcclxuXHJcbiAgaWYgKGdvb2dsZU1hcFJlYWR5LmlzUmVhZHkpXHJcbiAgICByZWFkeSgpO1xyXG4gIGVsc2UgaWYgKCFnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcpIHtcclxuICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IHRydWU7XHJcbiAgICBsb2FkZXIubG9hZCh7XHJcbiAgICAgIHNjcmlwdHM6IFtcImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vanNhcGlcIl0sXHJcbiAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBmdW5jdGlvbiAoKSB7IHJldHVybiAhIXdpbmRvdy5nb29nbGU7IH0sXHJcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZ29vZ2xlLmxvYWQoXCJtYXBzXCIsIFwiMy4xMFwiLCB7IG90aGVyX3BhcmFtczogXCJzZW5zb3I9ZmFsc2VcIiwgXCJjYWxsYmFja1wiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBnb29nbGVNYXBSZWFkeS5pc1JlYWR5ID0gdHJ1ZTtcclxuICAgICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgc3RhY2tbaV0oKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBVdGlsaXR5IHRvIGZvcmNlIHRoZSByZWZyZXNoIG9mIG1hcHMgdGhhdCBzb2x2ZSB0aGUgcHJvYmxlbSB3aXRoIGJhZC1zaXplZCBtYXAgYXJlYVxyXG5nb29nbGVNYXBSZWFkeS5yZWZyZXNoTWFwID0gZnVuY3Rpb24gcmVmcmVzaE1hcHMobWFwKSB7XHJcbiAgZ29vZ2xlTWFwUmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlcihtYXAsIFwicmVzaXplXCIpO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiBHVUlEIEdlbmVyYXRvclxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBndWlkR2VuZXJhdG9yKCkge1xyXG4gICAgdmFyIFM0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKSB8IDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIChTNCgpICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFM0KCkgKyBTNCgpKTtcclxufTsiLCIvKipcclxuICAgIEdlbmVyaWMgc2NyaXB0IGZvciBmaWVsZHNldHMgd2l0aCBjbGFzcyAuaGFzLWNvbmZpcm0sIGFsbG93aW5nIHNob3dcclxuICAgIHRoZSBjb250ZW50IG9ubHkgaWYgdGhlIG1haW4gY29uZmlybSBmaWVsZHMgaGF2ZSAneWVzJyBzZWxlY3RlZC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG52YXIgZGVmYXVsdFNlbGVjdG9yID0gJ2ZpZWxkc2V0Lmhhcy1jb25maXJtID4gLmNvbmZpcm0gaW5wdXQnO1xyXG5cclxuZnVuY3Rpb24gb25jaGFuZ2UoKSB7XHJcbiAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgZnMgPSB0LmNsb3Nlc3QoJ2ZpZWxkc2V0Jyk7XHJcbiAgICBpZiAodC5pcygnOmNoZWNrZWQnKSlcclxuICAgICAgICBpZiAodC52YWwoKSA9PSAneWVzJyB8fCB0LnZhbCgpID09ICdUcnVlJylcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3MoJ2NvbmZpcm1lZC1ubycpLmFkZENsYXNzKCdjb25maXJtZWQteWVzJyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcygnY29uZmlybWVkLXllcycpLmFkZENsYXNzKCdjb25maXJtZWQtbm8nKTtcclxufVxyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBkZWZhdWx0U2VsZWN0b3I7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIHNlbGVjdG9yLCBvbmNoYW5nZSk7XHJcbiAgICAvLyBQZXJmb3JtcyBmaXJzdCBjaGVjazpcclxuICAgICQoc2VsZWN0b3IpLmNoYW5nZSgpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5vZmYgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgZGVmYXVsdFNlbGVjdG9yO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9mZignY2hhbmdlJywgc2VsZWN0b3IpO1xyXG59OyIsIi8qIEludGVybmF6aW9uYWxpemF0aW9uIFV0aWxpdGllc1xyXG4gKi9cclxudmFyIGkxOG4gPSB7fTtcclxuaTE4bi5kaXN0YW5jZVVuaXRzID0ge1xyXG4gICAgJ0VTJzogJ2ttJyxcclxuICAgICdVUyc6ICdtaWxlcydcclxufTtcclxuaTE4bi5udW1lcmljTWlsZXNTZXBhcmF0b3IgPSB7XHJcbiAgICAnZXMtRVMnOiAnLicsXHJcbiAgICAnZXMtVVMnOiAnLicsXHJcbiAgICAnZW4tVVMnOiAnLCcsXHJcbiAgICAnZW4tRVMnOiAnLCdcclxufTtcclxuaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvciA9IHtcclxuICAgICdlcy1FUyc6ICcsJyxcclxuICAgICdlcy1VUyc6ICcsJyxcclxuICAgICdlbi1VUyc6ICcuJyxcclxuICAgICdlbi1FUyc6ICcuJ1xyXG59O1xyXG5pMThuLm1vbmV5U3ltYm9sUHJlZml4ID0ge1xyXG4gICAgJ0VTJzogJycsXHJcbiAgICAnVVMnOiAnJCdcclxufTtcclxuaTE4bi5tb25leVN5bWJvbFN1Zml4ID0ge1xyXG4gICAgJ0VTJzogJ+KCrCcsXHJcbiAgICAnVVMnOiAnJ1xyXG59O1xyXG5pMThuLmdldEN1cnJlbnRDdWx0dXJlID0gZnVuY3Rpb24gZ2V0Q3VycmVudEN1bHR1cmUoKSB7XHJcbiAgICB2YXIgYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpO1xyXG4gICAgdmFyIHMgPSBjLnNwbGl0KCctJyk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGN1bHR1cmU6IGMsXHJcbiAgICAgICAgbGFuZ3VhZ2U6IHNbMF0sXHJcbiAgICAgICAgY291bnRyeTogc1sxXVxyXG4gICAgfTtcclxufTtcclxuaTE4bi5jb252ZXJ0TWlsZXNLbSA9IGZ1bmN0aW9uIGNvbnZlcnRNaWxlc0ttKHEsIHVuaXQpIHtcclxuICAgIHZhciBNSUxFU19UT19LTSA9IDEuNjA5O1xyXG4gICAgaWYgKHVuaXQgPT0gJ21pbGVzJylcclxuICAgICAgICByZXR1cm4gTUlMRVNfVE9fS00gKiBxO1xyXG4gICAgZWxzZSBpZiAodW5pdCA9PSAna20nKVxyXG4gICAgICAgIHJldHVybiBxIC8gTUlMRVNfVE9fS007XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykgY29uc29sZS5sb2coJ2NvbnZlcnRNaWxlc0ttOiBVbnJlY29nbml6ZWQgdW5pdCAnICsgdW5pdCk7XHJcbiAgICByZXR1cm4gMDtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gaTE4bjsiLCIvKiBSZXR1cm5zIHRydWUgd2hlbiBzdHIgaXNcclxuLSBudWxsXHJcbi0gZW1wdHkgc3RyaW5nXHJcbi0gb25seSB3aGl0ZSBzcGFjZXMgc3RyaW5nXHJcbiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNFbXB0eVN0cmluZyhzdHIpIHtcclxuICAgIHJldHVybiAhKC9cXFMvZy50ZXN0KHN0ciB8fCBcIlwiKSk7XHJcbn07IiwiLyoqIEFzIHRoZSAnaXMnIGpRdWVyeSBtZXRob2QsIGJ1dCBjaGVja2luZyBAc2VsZWN0b3IgaW4gYWxsIGVsZW1lbnRzXHJcbiogQG1vZGlmaWVyIHZhbHVlczpcclxuKiAtICdhbGwnOiBhbGwgZWxlbWVudHMgbXVzdCBtYXRjaCBzZWxlY3RvciB0byByZXR1cm4gdHJ1ZVxyXG4qIC0gJ2FsbW9zdC1vbmUnOiBhbG1vc3Qgb25lIGVsZW1lbnQgbXVzdCBtYXRjaFxyXG4qIC0gJ3BlcmNlbnRhZ2UnOiByZXR1cm5zIHBlcmNlbnRhZ2UgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbWF0Y2ggc2VsZWN0b3IgKDAtMTAwKVxyXG4qIC0gJ3N1bW1hcnknOiByZXR1cm5zIHRoZSBvYmplY3QgeyB5ZXM6IG51bWJlciwgbm86IG51bWJlciwgcGVyY2VudGFnZTogbnVtYmVyLCB0b3RhbDogbnVtYmVyIH1cclxuKiAtIHtqdXN0OiBhIG51bWJlcn06IGV4YWN0IG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiAtIHthbG1vc3Q6IGEgbnVtYmVyfTogbWluaW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbiogLSB7dW50aWw6IGEgbnVtYmVyfTogbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5hcmUgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIG1vZGlmaWVyKSB7XHJcbiAgICBtb2RpZmllciA9IG1vZGlmaWVyIHx8ICdhbGwnO1xyXG4gICAgdmFyIGNvdW50ID0gMDtcclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuaXMoc2VsZWN0b3IpKVxyXG4gICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgfSk7XHJcbiAgICBzd2l0Y2ggKG1vZGlmaWVyKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID09IGNvdW50O1xyXG4gICAgICAgIGNhc2UgJ2FsbW9zdC1vbmUnOlxyXG4gICAgICAgICAgICByZXR1cm4gY291bnQgPiAwO1xyXG4gICAgICAgIGNhc2UgJ3BlcmNlbnRhZ2UnOlxyXG4gICAgICAgICAgICByZXR1cm4gY291bnQgLyB0aGlzLmxlbmd0aDtcclxuICAgICAgICBjYXNlICdzdW1tYXJ5JzpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHllczogY291bnQsXHJcbiAgICAgICAgICAgICAgICBubzogdGhpcy5sZW5ndGggLSBjb3VudCxcclxuICAgICAgICAgICAgICAgIHBlcmNlbnRhZ2U6IGNvdW50IC8gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICB0b3RhbDogdGhpcy5sZW5ndGhcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ2p1c3QnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci5qdXN0ICE9IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICgnYWxtb3N0JyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuYWxtb3N0ID4gY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCd1bnRpbCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLnVudGlsIDwgY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgIH1cclxufTsiLCIvKiogPT09PT09PT09PT09PT09PT09PVxyXG5FeHRlbnNpb24ganF1ZXJ5OiAnYm91bmRzJ1xyXG5SZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSBjb21iaW5lZCBib3VuZHMgZm9yIGFsbCBcclxuZWxlbWVudHMgaW4gdGhlIGNvbGxlY3Rpb25cclxuKi9cclxuKGZ1bmN0aW9uICgpIHtcclxuICBqUXVlcnkuZm4uYm91bmRzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwge1xyXG4gICAgICBpbmNsdWRlQm9yZGVyOiBmYWxzZSxcclxuICAgICAgaW5jbHVkZU1hcmdpbjogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgdmFyIGJvdW5kcyA9IHtcclxuICAgICAgbGVmdDogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICB0b3A6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcclxuICAgICAgcmlnaHQ6IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcclxuICAgICAgYm90dG9tOiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHdpZHRoOiBOdW1iZXIuTmFOLFxyXG4gICAgICBoZWlnaHQ6IE51bWJlci5OYU5cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGZuV2lkdGggPSBvcHRpb25zLmluY2x1ZGVCb3JkZXIgfHwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luID8gXHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ub3V0ZXJXaWR0aC5jYWxsKGVsLCBvcHRpb25zLmluY2x1ZGVNYXJnaW4pOyB9IDpcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi53aWR0aC5jYWxsKGVsKTsgfTtcclxuICAgIHZhciBmbkhlaWdodCA9IG9wdGlvbnMuaW5jbHVkZUJvcmRlciB8fCBvcHRpb25zLmluY2x1ZGVNYXJnaW4gPyBcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5vdXRlckhlaWdodC5jYWxsKGVsLCBvcHRpb25zLmluY2x1ZGVNYXJnaW4pOyB9IDpcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5oZWlnaHQuY2FsbChlbCk7IH07XHJcblxyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uIChpLCBlbCkge1xyXG4gICAgICB2YXIgZWxRID0gJChlbCk7XHJcbiAgICAgIHZhciBvZmYgPSBlbFEub2Zmc2V0KCk7XHJcbiAgICAgIG9mZi5yaWdodCA9IG9mZi5sZWZ0ICsgZm5XaWR0aCgkKGVsUSkpO1xyXG4gICAgICBvZmYuYm90dG9tID0gb2ZmLnRvcCArIGZuSGVpZ2h0KCQoZWxRKSk7XHJcblxyXG4gICAgICBpZiAob2ZmLmxlZnQgPCBib3VuZHMubGVmdClcclxuICAgICAgICBib3VuZHMubGVmdCA9IG9mZi5sZWZ0O1xyXG5cclxuICAgICAgaWYgKG9mZi50b3AgPCBib3VuZHMudG9wKVxyXG4gICAgICAgIGJvdW5kcy50b3AgPSBvZmYudG9wO1xyXG5cclxuICAgICAgaWYgKG9mZi5yaWdodCA+IGJvdW5kcy5yaWdodClcclxuICAgICAgICBib3VuZHMucmlnaHQgPSBvZmYucmlnaHQ7XHJcblxyXG4gICAgICBpZiAob2ZmLmJvdHRvbSA+IGJvdW5kcy5ib3R0b20pXHJcbiAgICAgICAgYm91bmRzLmJvdHRvbSA9IG9mZi5ib3R0b207XHJcbiAgICB9KTtcclxuXHJcbiAgICBib3VuZHMud2lkdGggPSBib3VuZHMucmlnaHQgLSBib3VuZHMubGVmdDtcclxuICAgIGJvdW5kcy5oZWlnaHQgPSBib3VuZHMuYm90dG9tIC0gYm91bmRzLnRvcDtcclxuICAgIHJldHVybiBib3VuZHM7XHJcbiAgfTtcclxufSkoKTsiLCIvKipcclxuKiBIYXNTY3JvbGxCYXIgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBib29sIHByb3BlcnRpZXMgJ3ZlcnRpY2FsJyBhbmQgJ2hvcml6b250YWwnXHJcbiogc2F5aW5nIGlmIHRoZSBlbGVtZW50IGhhcyBuZWVkIG9mIHNjcm9sbGJhcnMgZm9yIGVhY2ggZGltZW5zaW9uIG9yIG5vdCAoZWxlbWVudFxyXG4qIGNhbiBuZWVkIHNjcm9sbGJhcnMgYW5kIHN0aWxsIG5vdCBiZWluZyBzaG93ZWQgYmVjYXVzZSB0aGUgY3NzLW92ZXJsZmxvdyBwcm9wZXJ0eVxyXG4qIGJlaW5nIHNldCBhcyAnaGlkZGVuJywgYnV0IHN0aWxsIHdlIGtub3cgdGhhdCB0aGUgZWxlbWVudCByZXF1aXJlcyBpdCBhbmQgaXRzXHJcbiogY29udGVudCBpcyBub3QgYmVpbmcgZnVsbHkgZGlzcGxheWVkKS5cclxuKiBAZXh0cmFnYXAsIGRlZmF1bHRzIHRvIHt4OjAseTowfSwgbGV0cyBzcGVjaWZ5IGFuIGV4dHJhIHNpemUgaW4gcGl4ZWxzIGZvciBlYWNoIGRpbWVuc2lvbiB0aGF0IGFsdGVyIHRoZSByZWFsIGNoZWNrLFxyXG4qIHJlc3VsdGluZyBpbiBhIGZha2UgcmVzdWx0IHRoYXQgY2FuIGJlIGludGVyZXN0aW5nIHRvIGRpc2NhcmQgc29tZSBwaXhlbHMgb2YgZXhjZXNzXHJcbiogc2l6ZSAobmVnYXRpdmUgdmFsdWVzKSBvciBleGFnZXJhdGUgdGhlIHJlYWwgdXNlZCBzaXplIHdpdGggdGhhdCBleHRyYSBwaXhlbHMgKHBvc2l0aXZlIHZhbHVlcykuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5oYXNTY3JvbGxCYXIgPSBmdW5jdGlvbiAoZXh0cmFnYXApIHtcclxuICAgIGV4dHJhZ2FwID0gJC5leHRlbmQoe1xyXG4gICAgICAgIHg6IDAsXHJcbiAgICAgICAgeTogMFxyXG4gICAgfSwgZXh0cmFnYXApO1xyXG4gICAgaWYgKCF0aGlzIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4geyB2ZXJ0aWNhbDogZmFsc2UsIGhvcml6b250YWw6IGZhbHNlIH07XHJcbiAgICAvL25vdGU6IGNsaWVudEhlaWdodD0gaGVpZ2h0IG9mIGhvbGRlclxyXG4gICAgLy9zY3JvbGxIZWlnaHQ9IHdlIGhhdmUgY29udGVudCB0aWxsIHRoaXMgaGVpZ2h0XHJcbiAgICB2YXIgdCA9IHRoaXMuZ2V0KDApO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2ZXJ0aWNhbDogdGhpcy5vdXRlckhlaWdodChmYWxzZSkgPCAodC5zY3JvbGxIZWlnaHQgKyBleHRyYWdhcC55KSxcclxuICAgICAgICBob3Jpem9udGFsOiB0aGlzLm91dGVyV2lkdGgoZmFsc2UpIDwgKHQuc2Nyb2xsV2lkdGggKyBleHRyYWdhcC54KVxyXG4gICAgfTtcclxufTsiLCIvKiogQ2hlY2tzIGlmIGN1cnJlbnQgZWxlbWVudCBvciBvbmUgb2YgdGhlIGN1cnJlbnQgc2V0IG9mIGVsZW1lbnRzIGhhc1xyXG5hIHBhcmVudCB0aGF0IG1hdGNoIHRoZSBlbGVtZW50IG9yIGV4cHJlc3Npb24gZ2l2ZW4gYXMgZmlyc3QgcGFyYW1ldGVyXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5pc0NoaWxkT2YgPSBmdW5jdGlvbiBqUXVlcnlfcGx1Z2luX2lzQ2hpbGRPZihleHApIHtcclxuICAgIHJldHVybiB0aGlzLnBhcmVudHMoKS5maWx0ZXIoZXhwKS5sZW5ndGggPiAwO1xyXG59OyIsIi8qKlxyXG4gICAgR2V0cyB0aGUgaHRtbCBzdHJpbmcgb2YgdGhlIGZpcnN0IGVsZW1lbnQgYW5kIGFsbCBpdHMgY29udGVudC5cclxuICAgIFRoZSAnaHRtbCcgbWV0aG9kIG9ubHkgcmV0cmlldmVzIHRoZSBodG1sIHN0cmluZyBvZiB0aGUgY29udGVudCwgbm90IHRoZSBlbGVtZW50IGl0c2VsZi5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLm91dGVySHRtbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICghdGhpcyB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnO1xyXG4gICAgdmFyIGVsID0gdGhpcy5nZXQoMCk7XHJcbiAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgaWYgKGVsLm91dGVySFRNTClcclxuICAgICAgICBodG1sID0gZWwub3V0ZXJIVE1MO1xyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaHRtbCA9IHRoaXMud3JhcEFsbCgnPGRpdj48L2Rpdj4nKS5wYXJlbnQoKS5odG1sKCk7XHJcbiAgICAgICAgdGhpcy51bndyYXAoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBodG1sO1xyXG59OyIsIi8qKlxyXG4gICAgVXNpbmcgdGhlIGF0dHJpYnV0ZSBkYXRhLXNvdXJjZS11cmwgb24gYW55IEhUTUwgZWxlbWVudCxcclxuICAgIHRoaXMgYWxsb3dzIHJlbG9hZCBpdHMgY29udGVudCBwZXJmb3JtaW5nIGFuIEFKQVggb3BlcmF0aW9uXHJcbiAgICBvbiB0aGUgZ2l2ZW4gVVJMIG9yIHRoZSBvbmUgaW4gdGhlIGF0dHJpYnV0ZTsgdGhlIGVuZC1wb2ludFxyXG4gICAgbXVzdCByZXR1cm4gdGV4dC9odG1sIGNvbnRlbnQuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gRGVmYXVsdCBzdWNjZXNzIGNhbGxiYWNrIGFuZCBwdWJsaWMgdXRpbGl0eSwgYmFzaWMgaG93LXRvIHJlcGxhY2UgZWxlbWVudCBjb250ZW50IHdpdGggZmV0Y2hlZCBodG1sXHJcbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoaHRtbENvbnRlbnQsIGNvbnRleHQpIHtcclxuICAgIGNvbnRleHQgPSAkLmlzUGxhaW5PYmplY3QoY29udGV4dCkgJiYgY29udGV4dCA/IGNvbnRleHQgOiB0aGlzO1xyXG5cclxuICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgLy8gQXZvaWQgZW1wdHkgZG9jdW1lbnRzIGJlaW5nIHBhcnNlZCAocmFpc2UgZXJyb3IpXHJcbiAgICBodG1sQ29udGVudCA9ICQudHJpbShodG1sQ29udGVudCk7XHJcbiAgICBpZiAoaHRtbENvbnRlbnQpIHtcclxuICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChodG1sQ29udGVudCkpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIG5ld2h0bWwgPSAkKGh0bWxDb250ZW50KTtcclxuICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGVsZW1lbnQgPSBjb250ZXh0LmVsZW1lbnQ7XHJcbiAgICBpZiAoY29udGV4dC5vcHRpb25zLm1vZGUgPT0gJ3JlcGxhY2UtbWUnKVxyXG4gICAgICAgIGVsZW1lbnQucmVwbGFjZVdpdGgobmV3aHRtbCk7XHJcbiAgICBlbHNlIC8vICdyZXBsYWNlLWNvbnRlbnQnXHJcbiAgICAgICAgZWxlbWVudC5odG1sKG5ld2h0bWwpO1xyXG5cclxuICAgIHJldHVybiBjb250ZXh0O1xyXG59XHJcblxyXG4vLyBEZWZhdWx0IGNvbXBsZXRlIGNhbGxiYWNrIGFuZCBwdWJsaWMgdXRpbGl0eVxyXG5mdW5jdGlvbiBzdG9wTG9hZGluZ1NwaW5uZXIoKSB7XHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5lbGVtZW50KTtcclxufVxyXG5cclxuLy8gRGVmYXVsdHNcclxudmFyIGRlZmF1bHRzID0ge1xyXG4gICAgdXJsOiBudWxsLFxyXG4gICAgc3VjY2VzczogW3VwZGF0ZUVsZW1lbnRdLFxyXG4gICAgZXJyb3I6IFtdLFxyXG4gICAgY29tcGxldGU6IFtzdG9wTG9hZGluZ1NwaW5uZXJdLFxyXG4gICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgbW9kZTogJ3JlcGxhY2UtY29udGVudCcsXHJcbiAgICBsb2FkaW5nOiB7XHJcbiAgICAgICAgbG9ja0VsZW1lbnQ6IHRydWUsXHJcbiAgICAgICAgbG9ja09wdGlvbnM6IHt9LFxyXG4gICAgICAgIG1lc3NhZ2U6IG51bGwsXHJcbiAgICAgICAgc2hvd0xvYWRpbmdJbmRpY2F0b3I6IHRydWUsXHJcbiAgICAgICAgZGVsYXk6IDBcclxuICAgIH1cclxufTtcclxuXHJcbi8qIFJlbG9hZCBtZXRob2QgKi9cclxudmFyIHJlbG9hZCA9ICQuZm4ucmVsb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gT3B0aW9ucyBmcm9tIGRlZmF1bHRzIChpbnRlcm5hbCBhbmQgcHVibGljKVxyXG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIHJlbG9hZC5kZWZhdWx0cyk7XHJcbiAgICAvLyBJZiBvcHRpb25zIG9iamVjdCBpcyBwYXNzZWQgYXMgdW5pcXVlIHBhcmFtZXRlclxyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSAmJiAkLmlzUGxhaW5PYmplY3QoYXJndW1lbnRzWzBdKSkge1xyXG4gICAgICAgIC8vIE1lcmdlIG9wdGlvbnM6XHJcbiAgICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0aW9ucywgYXJndW1lbnRzWzBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ29tbW9uIG92ZXJsb2FkOiBuZXctdXJsIGFuZCBjb21wbGV0ZSBjYWxsYmFjaywgYm90aCBvcHRpb25hbHNcclxuICAgICAgICBvcHRpb25zLnVybCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogbnVsbDtcclxuICAgICAgICBvcHRpb25zLmNvbXBsZXRlID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMudXJsKSB7XHJcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3B0aW9ucy51cmwpKVxyXG4gICAgICAgICAgICAvLyBGdW5jdGlvbiBwYXJhbXM6IGN1cnJlbnRSZWxvYWRVcmwsIGRlZmF1bHRSZWxvYWRVcmxcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ3NvdXJjZS11cmwnLCAkLnByb3h5KG9wdGlvbnMudXJsLCB0aGlzKSgkdC5kYXRhKCdzb3VyY2UtdXJsJyksICR0LmF0dHIoJ2RhdGEtc291cmNlLXVybCcpKSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ3NvdXJjZS11cmwnLCBvcHRpb25zLnVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB1cmwgPSAkdC5kYXRhKCdzb3VyY2UtdXJsJyk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFscmVhZHkgYmVpbmcgcmVsb2FkZWQsIHRvIGNhbmNlbCBwcmV2aW91cyBhdHRlbXB0XHJcbiAgICAgICAgdmFyIGpxID0gJHQuZGF0YSgnaXNSZWxvYWRpbmcnKTtcclxuICAgICAgICBpZiAoanEpIHtcclxuICAgICAgICAgICAgaWYgKGpxLnVybCA9PSB1cmwpXHJcbiAgICAgICAgICAgICAgICAvLyBJcyB0aGUgc2FtZSB1cmwsIGRvIG5vdCBhYm9ydCBiZWNhdXNlIGlzIHRoZSBzYW1lIHJlc3VsdCBiZWluZyByZXRyaWV2ZWRcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAganEuYWJvcnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9wdGlvbmFsIGRhdGEgcGFyYW1ldGVyICdyZWxvYWQtbW9kZScgYWNjZXB0cyB2YWx1ZXM6IFxyXG4gICAgICAgIC8vIC0gJ3JlcGxhY2UtbWUnOiBVc2UgaHRtbCByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgcmVsb2FkZWQgZWxlbWVudCAoYWthOiByZXBsYWNlV2l0aCgpKVxyXG4gICAgICAgIC8vIC0gJ3JlcGxhY2UtY29udGVudCc6IChkZWZhdWx0KSBIdG1sIHJldHVybmVkIHJlcGxhY2UgY3VycmVudCBlbGVtZW50IGNvbnRlbnQgKGFrYTogaHRtbCgpKVxyXG4gICAgICAgIG9wdGlvbnMubW9kZSA9ICR0LmRhdGEoJ3JlbG9hZC1tb2RlJykgfHwgb3B0aW9ucy5tb2RlO1xyXG5cclxuICAgICAgICBpZiAodXJsKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIGRlbGF5XHJcbiAgICAgICAgICAgIHZhciBsb2FkaW5ndGltZXIgPSBvcHRpb25zLmxvYWRpbmcubG9ja0VsZW1lbnQgP1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRpbmcgY29udGVudCB1c2luZyBhIGZha2UgdGVtcCBwYXJlbnQgZWxlbWVudCB0byBwcmVsb2FkIGltYWdlIGFuZCB0byBnZXQgcmVhbCBtZXNzYWdlIHdpZHRoOlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2FkaW5nY29udGVudCA9ICQoJzxkaXYvPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA/ICQoJzxkaXYgY2xhc3M9XCJsb2FkaW5nLW1lc3NhZ2VcIi8+JykuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5tZXNzYWdlKSA6IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChvcHRpb25zLmxvYWRpbmcuc2hvd0xvYWRpbmdJbmRpY2F0b3IgPyBvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA6IG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdjb250ZW50LmNzcyh7IHBvc2l0aW9uOiAnYWJzb2x1dGUnLCBsZWZ0OiAtOTk5OTkgfSkuYXBwZW5kVG8oJ2JvZHknKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdyA9IGxvYWRpbmdjb250ZW50LndpZHRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ2NvbnRlbnQuZGV0YWNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTG9ja2luZzpcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMuYXV0b2ZvY3VzID0gb3B0aW9ucy5hdXRvZm9jdXM7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zLndpZHRoID0gdztcclxuICAgICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGxvYWRpbmdjb250ZW50Lmh0bWwoKSwgJHQsIG9wdGlvbnMubG9hZGluZy5tZXNzYWdlID8gJ2N1c3RvbS1sb2FkaW5nJyA6ICdsb2FkaW5nJywgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMubG9hZGluZy5kZWxheSlcclxuICAgICAgICAgICAgICAgIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIC8vIFByZXBhcmUgY29udGV4dFxyXG4gICAgICAgICAgICB2YXIgY3R4ID0ge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudDogJHQsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgbG9hZGluZ1RpbWVyOiBsb2FkaW5ndGltZXJcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICAgICAgICAganEgPSAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIGNvbnRleHQ6IGN0eFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVybCBpcyBzZXQgaW4gdGhlIHJldHVybmVkIGFqYXggb2JqZWN0IGJlY2F1c2UgaXMgbm90IHNldCBieSBhbGwgdmVyc2lvbnMgb2YgalF1ZXJ5XHJcbiAgICAgICAgICAgIGpxLnVybCA9IHVybDtcclxuXHJcbiAgICAgICAgICAgIC8vIE1hcmsgZWxlbWVudCBhcyBpcyBiZWluZyByZWxvYWRlZCwgdG8gYXZvaWQgbXVsdGlwbGUgYXR0ZW1wcyBhdCBzYW1lIHRpbWUsIHNhdmluZ1xyXG4gICAgICAgICAgICAvLyBjdXJyZW50IGFqYXggb2JqZWN0IHRvIGFsbG93IGJlIGNhbmNlbGxlZFxyXG4gICAgICAgICAgICAkdC5kYXRhKCdpc1JlbG9hZGluZycsIGpxKTtcclxuICAgICAgICAgICAganEuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ2lzUmVsb2FkaW5nJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2FsbGJhY2tzOiBmaXJzdCBnbG9iYWxzIGFuZCB0aGVuIGZyb20gb3B0aW9ucyBpZiB0aGV5IGFyZSBkaWZmZXJlbnRcclxuICAgICAgICAgICAgLy8gc3VjY2Vzc1xyXG4gICAgICAgICAgICBqcS5kb25lKHJlbG9hZC5kZWZhdWx0cy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3VjY2VzcyAhPSByZWxvYWQuZGVmYXVsdHMuc3VjY2VzcylcclxuICAgICAgICAgICAgICAgIGpxLmRvbmUob3B0aW9ucy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgLy8gZXJyb3JcclxuICAgICAgICAgICAganEuZmFpbChyZWxvYWQuZGVmYXVsdHMuZXJyb3IpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5lcnJvciAhPSByZWxvYWQuZGVmYXVsdHMuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICBqcS5mYWlsKG9wdGlvbnMuZXJyb3IpO1xyXG4gICAgICAgICAgICAvLyBjb21wbGV0ZVxyXG4gICAgICAgICAgICBqcS5hbHdheXMocmVsb2FkLmRlZmF1bHRzLmNvbXBsZXRlKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29tcGxldGUgIT0gcmVsb2FkLmRlZmF1bHRzLmNvbXBsZXRlKVxyXG4gICAgICAgICAgICAgICAganEuZG9uZShvcHRpb25zLmNvbXBsZXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLy8gUHVibGljIGRlZmF1bHRzXHJcbnJlbG9hZC5kZWZhdWx0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cyk7XHJcblxyXG4vLyBQdWJsaWMgdXRpbGl0aWVzXHJcbnJlbG9hZC51cGRhdGVFbGVtZW50ID0gdXBkYXRlRWxlbWVudDtcclxucmVsb2FkLnN0b3BMb2FkaW5nU3Bpbm5lciA9IHN0b3BMb2FkaW5nU3Bpbm5lcjtcclxuXHJcbi8vIE1vZHVsZVxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlbG9hZDsiLCIvKiogRXh0ZW5kZWQgdG9nZ2xlLXNob3ctaGlkZSBmdW50aW9ucy5cclxuICAgIElhZ29TUkxAZ21haWwuY29tXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gKiovXHJcbihmdW5jdGlvbigpe1xyXG5cclxuICAgIC8qKiBJbXBsZW1lbnRhdGlvbjogcmVxdWlyZSBqUXVlcnkgYW5kIHJldHVybnMgb2JqZWN0IHdpdGggdGhlXHJcbiAgICAgICAgcHVibGljIG1ldGhvZHMuXHJcbiAgICAgKiovXHJcbiAgICBmdW5jdGlvbiB4dHNoKGpRdWVyeSkge1xyXG4gICAgICAgIHZhciAkID0galF1ZXJ5O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBIaWRlIGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdoaWRlJyBhbmQgJ2ZhZGVPdXQnIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmZhZGVPdXQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLnNsaWRlVXAob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdoaWRlJ1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmhpZGUob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneGhpZGUnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgKiBTaG93IGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdzaG93JyBhbmQgJ2ZhZGVJbicgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgLy8gV2UgcGVyZm9ybXMgYSBmaXggb24gc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHNcclxuICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gZXJyb3IgdGhhdCBwcmV2ZW50cyBmcm9tIHJ1bm5pbmdcclxuICAgICAgICAgICAgLy8gZWZmZWN0cyBvbiBlbGVtZW50cyB0aGF0IGFyZSBhbHJlYWR5IHZpc2libGUsXHJcbiAgICAgICAgICAgIC8vIHdoYXQgbGV0cyB0aGUgcG9zc2liaWxpdHkgb2YgZ2V0IGEgbWlkZGxlLWFuaW1hdGVkXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gV2UganVzdCBjaGFuZ2UgZGlzcGxheTpub25lLCBmb3JjaW5nIHRvICdpcy12aXNpYmxlJyB0b1xyXG4gICAgICAgICAgICAvLyBiZSBmYWxzZSBhbmQgdGhlbiBydW5uaW5nIHRoZSBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGZsaWNrZXJpbmcgZWZmZWN0LCBiZWNhdXNlIGpRdWVyeSBqdXN0IHJlc2V0c1xyXG4gICAgICAgICAgICAvLyBkaXNwbGF5IG9uIGVmZmVjdCBzdGFydC5cclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mYWRlSW4ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2xpZGVEb3duKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnc2hvdydcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNob3cob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneHNob3cnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdlbmVyaWMgdXRpbGl0eSBmb3IgaGlnaGx5IGNvbmZpZ3VyYWJsZSBqUXVlcnkudG9nZ2xlIHdpdGggc3VwcG9ydFxyXG4gICAgICAgICAgICB0byBzcGVjaWZ5IHRoZSB0b2dnbGUgdmFsdWUgZXhwbGljaXR5IGZvciBhbnkga2luZCBvZiBlZmZlY3Q6IGp1c3QgcGFzcyB0cnVlIGFzIHNlY29uZCBwYXJhbWV0ZXIgJ3RvZ2dsZScgdG8gc2hvd1xyXG4gICAgICAgICAgICBhbmQgZmFsc2UgdG8gaGlkZS4gVG9nZ2xlIG11c3QgYmUgc3RyaWN0bHkgYSBCb29sZWFuIHZhbHVlIHRvIGF2b2lkIGF1dG8tZGV0ZWN0aW9uLlxyXG4gICAgICAgICAgICBUb2dnbGUgcGFyYW1ldGVyIGNhbiBiZSBvbWl0dGVkIHRvIGF1dG8tZGV0ZWN0IGl0LCBhbmQgc2Vjb25kIHBhcmFtZXRlciBjYW4gYmUgdGhlIGFuaW1hdGlvbiBvcHRpb25zLlxyXG4gICAgICAgICAgICBBbGwgdGhlIG90aGVycyBiZWhhdmUgZXhhY3RseSBhcyBoaWRlRWxlbWVudCBhbmQgc2hvd0VsZW1lbnQuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlRWxlbWVudChlbGVtZW50LCB0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIG5vdCBhIGJvb2xlYW5cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSAhPT0gdHJ1ZSAmJiB0b2dnbGUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgYW4gb2JqZWN0LCB0aGVuIGlzIHRoZSBvcHRpb25zIGFzIHNlY29uZCBwYXJhbWV0ZXJcclxuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QodG9nZ2xlKSlcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gdG9nZ2xlO1xyXG4gICAgICAgICAgICAgICAgLy8gQXV0by1kZXRlY3QgdG9nZ2xlLCBpdCBjYW4gdmFyeSBvbiBhbnkgZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIC8vIHRoZW4gZGV0ZWN0aW9uIGFuZCBhY3Rpb24gbXVzdCBiZSBkb25lIHBlciBlbGVtZW50OlxyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXVzaW5nIGZ1bmN0aW9uLCB3aXRoIGV4cGxpY2l0IHRvZ2dsZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgISQodGhpcykuaXMoJzp2aXNpYmxlJyksIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSlcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqIERvIGpRdWVyeSBpbnRlZ3JhdGlvbiBhcyB4dG9nZ2xlLCB4c2hvdywgeGhpZGVcclxuICAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gcGx1Z0luKGpRdWVyeSkge1xyXG4gICAgICAgICAgICAvKiogdG9nZ2xlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHh0b2dnbGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHRvZ2dsZSA9IGZ1bmN0aW9uIHh0b2dnbGUodG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsIHRvZ2dsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBzaG93RWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHNob3cgPSBmdW5jdGlvbiB4c2hvdyhvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIGhpZGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueGhpZGUgPSBmdW5jdGlvbiB4aGlkZShvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb3J0aW5nOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQ6IHRvZ2dsZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHNob3dFbGVtZW50OiBzaG93RWxlbWVudCxcclxuICAgICAgICAgICAgaGlkZUVsZW1lbnQ6IGhpZGVFbGVtZW50LFxyXG4gICAgICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9kdWxlXHJcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgeHRzaCk7XHJcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgICAgICB2YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB4dHNoKGpRdWVyeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIE5vcm1hbCBzY3JpcHQgbG9hZCwgaWYgalF1ZXJ5IGlzIGdsb2JhbCAoYXQgd2luZG93KSwgaXRzIGV4dGVuZGVkIGF1dG9tYXRpY2FsbHkgICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHh0c2god2luZG93LmpRdWVyeSkucGx1Z0luKHdpbmRvdy5qUXVlcnkpO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvKiBTb21lIHV0aWxpdGllcyBmb3IgdXNlIHdpdGggalF1ZXJ5IG9yIGl0cyBleHByZXNzaW9uc1xyXG4gICAgdGhhdCBhcmUgbm90IHBsdWdpbnMuXHJcbiovXHJcbmZ1bmN0aW9uIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbICM7JiwuKyp+XFwnOlwiIV4kW1xcXSgpPT58XFwvXSkvZywgJ1xcXFwkMScpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlOiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlXHJcbiAgICB9O1xyXG4iLCIvKiBBc3NldHMgbG9hZGVyIHdpdGggbG9hZGluZyBjb25maXJtYXRpb24gKG1haW5seSBmb3Igc2NyaXB0cylcclxuICAgIGJhc2VkIG9uIE1vZGVybml6ci95ZXBub3BlIGxvYWRlci5cclxuKi9cclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpO1xyXG5cclxuZXhwb3J0cy5sb2FkID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgc2NyaXB0czogW10sXHJcbiAgICAgICAgY29tcGxldGU6IG51bGwsXHJcbiAgICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IG51bGwsXHJcbiAgICAgICAgbG9hZERlbGF5OiAwLFxyXG4gICAgICAgIHRyaWFsc0ludGVydmFsOiA1MDBcclxuICAgIH0sIG9wdHMpO1xyXG4gICAgaWYgKCFvcHRzLnNjcmlwdHMubGVuZ3RoKSByZXR1cm47XHJcbiAgICBmdW5jdGlvbiBwZXJmb3JtQ29tcGxldGUoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAob3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbikgIT09ICdmdW5jdGlvbicgfHwgb3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbigpKVxyXG4gICAgICAgICAgICBvcHRzLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQocGVyZm9ybUNvbXBsZXRlLCBvcHRzLnRyaWFsc0ludGVydmFsKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS53YXJuKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdMQy5sb2FkLmNvbXBsZXRlVmVyaWZpY2F0aW9uIGZhaWxlZCBmb3IgJyArIG9wdHMuc2NyaXB0c1swXSArICcgcmV0cnlpbmcgaXQgaW4gJyArIG9wdHMudHJpYWxzSW50ZXJ2YWwgKyAnbXMnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKHtcclxuICAgICAgICAgICAgbG9hZDogb3B0cy5zY3JpcHRzLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogb3B0cy5jb21wbGV0ZSA/IHBlcmZvcm1Db21wbGV0ZSA6IG51bGxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChvcHRzLmxvYWREZWxheSlcclxuICAgICAgICBzZXRUaW1lb3V0KGxvYWQsIG9wdHMubG9hZERlbGF5KTtcclxuICAgIGVsc2VcclxuICAgICAgICBsb2FkKCk7XHJcbn07IiwiLyotLS0tLS0tLS0tLS1cclxuVXRpbGl0aWVzIHRvIG1hbmlwdWxhdGUgbnVtYmVycywgYWRkaXRpb25hbGx5XHJcbnRvIHRoZSBvbmVzIGF0IE1hdGhcclxuLS0tLS0tLS0tLS0tKi9cclxuXHJcbi8qKiBFbnVtZXJhdGlvbiB0byBiZSB1c2VzIGJ5IGZ1bmN0aW9ucyB0aGF0IGltcGxlbWVudHMgJ3JvdW5kaW5nJyBvcGVyYXRpb25zIG9uIGRpZmZlcmVudFxyXG5kYXRhIHR5cGVzLlxyXG5JdCBob2xkcyB0aGUgZGlmZmVyZW50IHdheXMgYSByb3VuZGluZyBvcGVyYXRpb24gY2FuIGJlIGFwcGx5LlxyXG4qKi9cclxudmFyIHJvdW5kaW5nVHlwZUVudW0gPSB7XHJcbiAgICBEb3duOiAtMSxcclxuICAgIE5lYXJlc3Q6IDAsXHJcbiAgICBVcDogMVxyXG59O1xyXG5cclxuZnVuY3Rpb24gcm91bmRUbyhudW1iZXIsIGRlY2ltYWxzLCByb3VuZGluZ1R5cGUpIHtcclxuICAgIC8vIGNhc2UgTmVhcmVzdCBpcyB0aGUgZGVmYXVsdDpcclxuICAgIHZhciBmID0gbmVhcmVzdFRvO1xyXG4gICAgc3dpdGNoIChyb3VuZGluZ1R5cGUpIHtcclxuICAgICAgICBjYXNlIHJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgZiA9IGZsb29yVG87XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2Ugcm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgZiA9IGNlaWxUbztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZihudW1iZXIsIGRlY2ltYWxzKTtcclxufVxyXG5cclxuLyoqIFJvdW5kIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdCBjYW4gc3Vic3RyYWN0IGludGVnZXIgZGVjaW1hbHMgYnkgcHJvdmlkaW5nIGEgbmVnYXRpdmVcclxubnVtYmVyIG9mIGRlY2ltYWxzLlxyXG4qKi9cclxuZnVuY3Rpb24gbmVhcmVzdFRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLyoqIFJvdW5kIFVwIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgdXAsXHJcbnRvIHRoZSBsb3dlciBpbnRlZ2VyIGdyZWF0ZXIgb3IgZXF1YWxzIHRvIHRoZSBudW1iZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjZWlsVG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBEb3duIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgZG93bixcclxudG8gdGhlIGJpZ2dlciBpbnRlZ2VyIGxvd2VyIG9yIGVxdWFscyB0byB0aGUgbnVtYmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gZmxvb3JUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICByb3VuZGluZ1R5cGVFbnVtOiByb3VuZGluZ1R5cGVFbnVtLFxyXG4gICAgICAgIHJvdW5kVG86IHJvdW5kVG8sXHJcbiAgICAgICAgbmVhcmVzdFRvOiBuZWFyZXN0VG8sXHJcbiAgICAgICAgY2VpbFRvOiBjZWlsVG8sXHJcbiAgICAgICAgZmxvb3JUbzogZmxvb3JUb1xyXG4gICAgfTsiLCJmdW5jdGlvbiBtb3ZlRm9jdXNUbyhlbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBtYXJnaW5Ub3A6IDMwLFxyXG4gICAgICAgIGR1cmF0aW9uOiA1MDBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiAkKGVsKS5vZmZzZXQoKS50b3AgLSBvcHRpb25zLm1hcmdpblRvcCB9LCBvcHRpb25zLmR1cmF0aW9uLCBudWxsKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vdmVGb2N1c1RvO1xyXG59IiwiLyogU29tZSB1dGlsaXRpZXMgdG8gZm9ybWF0IGFuZCBleHRyYWN0IG51bWJlcnMsIGZyb20gdGV4dCBvciBET00uXHJcbiAqL1xyXG52YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBpMThuID0gcmVxdWlyZSgnLi9pMThuJyksXHJcbiAgICBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBnZXRNb25leU51bWJlcih2LCBhbHQpIHtcclxuICAgIGFsdCA9IGFsdCB8fCAwO1xyXG4gICAgaWYgKHYgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgdiA9IHYudmFsKCkgfHwgdi50ZXh0KCk7XHJcbiAgICB2ID0gcGFyc2VGbG9hdCh2XHJcbiAgICAgICAgLnJlcGxhY2UoL1sk4oKsXS9nLCAnJylcclxuICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKExDLm51bWVyaWNNaWxlc1NlcGFyYXRvcltpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY3VsdHVyZV0sICdnJyksICcnKVxyXG4gICAgKTtcclxuICAgIHJldHVybiBpc05hTih2KSA/IGFsdCA6IHY7XHJcbn1cclxuZnVuY3Rpb24gbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSB7XHJcbiAgICB2YXIgY3VsdHVyZSA9IGkxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jdWx0dXJlO1xyXG4gICAgLy8gRmlyc3QsIHJvdW5kIHRvIDIgZGVjaW1hbHNcclxuICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgLy8gR2V0IHRoZSBkZWNpbWFsIHBhcnQgKHJlc3QpXHJcbiAgICB2YXIgcmVzdCA9IE1hdGgucm91bmQodiAqIDEwMCAlIDEwMCk7XHJcbiAgICByZXR1cm4gKCcnICtcclxuICAgIC8vIEludGVnZXIgcGFydCAobm8gZGVjaW1hbHMpXHJcbiAgICAgICAgTWF0aC5mbG9vcih2KSArXHJcbiAgICAvLyBEZWNpbWFsIHNlcGFyYXRvciBkZXBlbmRpbmcgb24gbG9jYWxlXHJcbiAgICAgICAgaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvcltjdWx0dXJlXSArXHJcbiAgICAvLyBEZWNpbWFscywgZXZlciB0d28gZGlnaXRzXHJcbiAgICAgICAgTWF0aC5mbG9vcihyZXN0IC8gMTApICsgcmVzdCAlIDEwXHJcbiAgICApO1xyXG59XHJcbmZ1bmN0aW9uIG51bWJlclRvTW9uZXlTdHJpbmcodikge1xyXG4gICAgdmFyIGNvdW50cnkgPSBpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY291bnRyeTtcclxuICAgIC8vIFR3byBkaWdpdHMgaW4gZGVjaW1hbHMgZm9yIHJvdW5kZWQgdmFsdWUgd2l0aCBtb25leSBzeW1ib2wgYXMgZm9yXHJcbiAgICAvLyBjdXJyZW50IGxvY2FsZVxyXG4gICAgcmV0dXJuIChpMThuLm1vbmV5U3ltYm9sUHJlZml4W2NvdW50cnldICsgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSArIGkxOG4ubW9uZXlTeW1ib2xTdWZpeFtjb3VudHJ5XSk7XHJcbn1cclxuZnVuY3Rpb24gc2V0TW9uZXlOdW1iZXIodiwgZWwpIHtcclxuICAgIC8vIEdldCB2YWx1ZSBpbiBtb25leSBmb3JtYXQ6XHJcbiAgICB2ID0gbnVtYmVyVG9Nb25leVN0cmluZyh2KTtcclxuICAgIC8vIFNldHRpbmcgdmFsdWU6XHJcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgaWYgKGVsLmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICAgZWwudmFsKHYpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZWwudGV4dCh2KTtcclxuICAgIHJldHVybiB2O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBnZXRNb25leU51bWJlcjogZ2V0TW9uZXlOdW1iZXIsXHJcbiAgICAgICAgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZzogbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyxcclxuICAgICAgICBudW1iZXJUb01vbmV5U3RyaW5nOiBudW1iZXJUb01vbmV5U3RyaW5nLFxyXG4gICAgICAgIHNldE1vbmV5TnVtYmVyOiBzZXRNb25leU51bWJlclxyXG4gICAgfTsiLCIvKipcclxuKiBQbGFjZWhvbGRlciBwb2x5ZmlsbC5cclxuKiBBZGRzIGEgbmV3IGpRdWVyeSBwbGFjZUhvbGRlciBtZXRob2QgdG8gc2V0dXAgb3IgcmVhcHBseSBwbGFjZUhvbGRlclxyXG4qIG9uIGVsZW1lbnRzIChyZWNvbW1lbnRlZCB0byBiZSBhcHBseSBvbmx5IHRvIHNlbGVjdG9yICdbcGxhY2Vob2xkZXJdJyk7XHJcbiogdGhhdHMgbWV0aG9kIGlzIGZha2Ugb24gYnJvd3NlcnMgdGhhdCBoYXMgbmF0aXZlIHN1cHBvcnQgZm9yIHBsYWNlaG9sZGVyXHJcbioqL1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0UGxhY2VIb2xkZXJzKCkge1xyXG4gICAgaWYgKE1vZGVybml6ci5pbnB1dC5wbGFjZWhvbGRlcilcclxuICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkgeyB9O1xyXG4gICAgZWxzZVxyXG4gICAgICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvUGxhY2Vob2xkZXIoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdwbGFjZWhvbGRlci1zdXBwb3J0ZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0Lm9uKCdmb2N1c2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkdC5vbignZm9jdXNvdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQuZGF0YSgncGxhY2Vob2xkZXItc3VwcG9ydGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChkb1BsYWNlaG9sZGVyKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgJCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkoKTtcclxufTsiLCIvKiBQb3B1cCBmdW5jdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqXHJcbiogUG9wdXAgcmVsYXRlZCBcclxuKiBmdW5jdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gcG9wdXBTaXplKHNpemUpIHtcclxuICAgIHZhciBzID0gKHNpemUgPT0gJ2xhcmdlJyA/IDAuOCA6IChzaXplID09ICdtZWRpdW0nID8gMC41IDogKHNpemUgPT0gJ3NtYWxsJyA/IDAuMiA6IHNpemUgfHwgMC41KSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB3aWR0aDogTWF0aC5yb3VuZCgkKHdpbmRvdykud2lkdGgoKSAqIHMpLFxyXG4gICAgICAgIGhlaWdodDogTWF0aC5yb3VuZCgkKHdpbmRvdykuaGVpZ2h0KCkgKiBzKSxcclxuICAgICAgICBzaXplRmFjdG9yOiBzXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwU3R5bGUoc2l6ZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdXJzb3I6ICdkZWZhdWx0JyxcclxuICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCArICdweCcsXHJcbiAgICAgICAgbGVmdDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLndpZHRoKCkgLSBzaXplLndpZHRoKSAvIDIpIC0gMjUgKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHQgKyAncHgnLFxyXG4gICAgICAgIHRvcDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLmhlaWdodCgpIC0gc2l6ZS5oZWlnaHQpIC8gMikgLSAzMiArICdweCcsXHJcbiAgICAgICAgcGFkZGluZzogJzM0cHggMjVweCAzMHB4JyxcclxuICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICctbW96LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nJyxcclxuICAgICAgICAnLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnLFxyXG4gICAgICAgICdiYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwKHVybCwgc2l6ZSwgY29tcGxldGUsIGxvYWRpbmdUZXh0LCBvcHRpb25zKSB7XHJcbiAgICBpZiAodHlwZW9mICh1cmwpID09PSAnb2JqZWN0JylcclxuICAgICAgICBvcHRpb25zID0gdXJsO1xyXG5cclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICB1cmw6IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAnJyxcclxuICAgICAgICBzaXplOiBzaXplIHx8IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9LFxyXG4gICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcclxuICAgICAgICBsb2FkaW5nVGV4dDogbG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2xvc2FibGU6IHtcclxuICAgICAgICAgICAgb25Mb2FkOiBmYWxzZSxcclxuICAgICAgICAgICAgYWZ0ZXJMb2FkOiB0cnVlLFxyXG4gICAgICAgICAgICBvbkVycm9yOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvU2l6ZTogZmFsc2UsXHJcbiAgICAgICAgY29udGFpbmVyQ2xhc3M6ICcnLFxyXG4gICAgICAgIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLy8gUHJlcGFyZSBzaXplIGFuZCBsb2FkaW5nXHJcbiAgICBvcHRpb25zLmxvYWRpbmdUZXh0ID0gb3B0aW9ucy5sb2FkaW5nVGV4dCB8fCAnJztcclxuICAgIGlmICh0eXBlb2YgKG9wdGlvbnMuc2l6ZS53aWR0aCkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHBvcHVwU2l6ZShvcHRpb25zLnNpemUpO1xyXG5cclxuICAgICQuYmxvY2tVSSh7XHJcbiAgICAgICAgbWVzc2FnZTogKG9wdGlvbnMuY2xvc2FibGUub25Mb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICtcclxuICAgICAgICc8aW1nIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nICsgb3B0aW9ucy5sb2FkaW5nVGV4dCxcclxuICAgICAgICBjZW50ZXJZOiBmYWxzZSxcclxuICAgICAgICBjc3M6IHBvcHVwU3R5bGUob3B0aW9ucy5zaXplKSxcclxuICAgICAgICBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0sXHJcbiAgICAgICAgZm9jdXNJbnB1dDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTG9hZGluZyBVcmwgd2l0aCBBamF4IGFuZCBwbGFjZSBjb250ZW50IGluc2lkZSB0aGUgYmxvY2tlZC1ib3hcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcclxuICAgICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJCgnLmJsb2NrTXNnJylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhvcHRpb25zLmNvbnRhaW5lckNsYXNzKTtcclxuICAgICAgICAgICAgLy8gQWRkIGNsb3NlIGJ1dHRvbiBpZiByZXF1aXJlcyBpdCBvciBlbXB0eSBtZXNzYWdlIGNvbnRlbnQgdG8gYXBwZW5kIHRoZW4gbW9yZVxyXG4gICAgICAgICAgICBjb250YWluZXIuaHRtbChvcHRpb25zLmNsb3NhYmxlLmFmdGVyTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRIb2xkZXIgPSBjb250YWluZXIuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29udGVudFwiLz4nKS5jaGlsZHJlbignLmNvbnRlbnQnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuQ29kZSAmJiBkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgY29kZSwgc2hvdyByZXN1bHRcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQYWdlIGNvbnRlbnQgZ290LCBwYXN0ZSBpbnRvIHRoZSBwb3B1cCBpZiBpcyBwYXJ0aWFsIGh0bWwgKHVybCBzdGFydHMgd2l0aCAkKVxyXG4gICAgICAgICAgICAgICAgaWYgKC8oKF5cXCQpfChcXC9cXCQpKS8udGVzdChvcHRpb25zLnVybCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRIb2xkZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9TaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2b2lkIG1pc2NhbGN1bGF0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldldpZHRoID0gY29udGVudEhvbGRlclswXS5zdHlsZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRXaWR0aCA9IGNvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udEhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhV2lkdGggPSBjb250YWluZXIub3V0ZXJXaWR0aCh0cnVlKSAtIGNvbnRXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSGVpZ2h0ID0gY29udGFpbmVyLm91dGVySGVpZ2h0KHRydWUpIC0gY29udEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkgLSBleHRyYVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gZXh0cmFIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBhbmQgYXBwbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogYWN0dWFsV2lkdGggPiBtYXhXaWR0aCA/IG1heFdpZHRoIDogYWN0dWFsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGFjdHVhbEhlaWdodCA+IG1heEhlaWdodCA/IG1heEhlaWdodCA6IGFjdHVhbEhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuYW5pbWF0ZShzaXplLCAzMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBtaXNjYWxjdWxhdGlvbnMgY29ycmVjdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgcHJldldpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsIHByZXZIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRWxzZSwgaWYgdXJsIGlzIGEgZnVsbCBodG1sIHBhZ2UgKG5vcm1hbCBwYWdlKSwgcHV0IGNvbnRlbnQgaW50byBhbiBpZnJhbWVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGRhdGEsIHRoaXMub3B0aW9ucy5zaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2tpbmcgZWxlbWVudCBjb250ZW50ICh0aGUgbG9hZGluZykgd2l0aCB0aGUgaWZyYW1lOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZXJyb3I6IGZ1bmN0aW9uIChqLCB0LCBleCkge1xyXG4gICAgICAgICAgICAkKCdkaXYuYmxvY2tNc2cnKS5odG1sKChvcHRpb25zLmNsb3NhYmxlLm9uRXJyb3IgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgKyAnPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5QYWdlIG5vdCBmb3VuZDwvZGl2PicpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmluZm8pIGNvbnNvbGUuaW5mbyhcIlBvcHVwLWFqYXggZXJyb3I6IFwiICsgZXgpO1xyXG4gICAgICAgIH0sIGNvbXBsZXRlOiBvcHRpb25zLmNvbXBsZXRlXHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmV0dXJuZWRCbG9jayA9ICQoJy5ibG9ja1VJJyk7XHJcblxyXG4gICAgcmV0dXJuZWRCbG9jay5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICByZXR1cm5lZEJsb2NrLnRyaWdnZXIoJ3BvcHVwLWNsb3NlZCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuZWRCbG9jay5jbG9zZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0QmxvY2tFbGVtZW50ID0gZnVuY3Rpb24gZ2V0QmxvY2tFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja01zZycpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRDb250ZW50RWxlbWVudCA9IGZ1bmN0aW9uIGdldENvbnRlbnRFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maW5kKCcuY29udGVudCcpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRPdmVybGF5RWxlbWVudCA9IGZ1bmN0aW9uIGdldE92ZXJsYXlFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja092ZXJsYXknKTsgfTtcclxuICAgIHJldHVybiByZXR1cm5lZEJsb2NrO1xyXG59XHJcblxyXG4vKiBTb21lIHBvcHVwIHV0aWxpdGl0ZXMvc2hvcnRoYW5kcyAqL1xyXG5mdW5jdGlvbiBtZXNzYWdlUG9wdXAobWVzc2FnZSwgY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCAnYm9keScpO1xyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2Lz4nKS50ZXh0KG1lc3NhZ2UpO1xyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjb250YWluZXIsICdtZXNzYWdlLXBvcHVwIGZ1bGwtYmxvY2snLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbm5lY3RQb3B1cEFjdGlvbihhcHBseVRvU2VsZWN0b3IpIHtcclxuICAgIGFwcGx5VG9TZWxlY3RvciA9IGFwcGx5VG9TZWxlY3RvciB8fCAnLnBvcHVwLWFjdGlvbic7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBhcHBseVRvU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQoJCh0aGlzKS5hdHRyKCdocmVmJykpLmNsb25lKCk7XHJcbiAgICAgICAgaWYgKGMubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgZG9jdW1lbnQsIG51bGwsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy8gVGhlIHBvcHVwIGZ1bmN0aW9uIGNvbnRhaW5zIGFsbCB0aGUgb3RoZXJzIGFzIG1ldGhvZHNcclxucG9wdXAuc2l6ZSA9IHBvcHVwU2l6ZTtcclxucG9wdXAuc3R5bGUgPSBwb3B1cFN0eWxlO1xyXG5wb3B1cC5jb25uZWN0QWN0aW9uID0gY29ubmVjdFBvcHVwQWN0aW9uO1xyXG5wb3B1cC5tZXNzYWdlID0gbWVzc2FnZVBvcHVwO1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcG9wdXA7IiwiLyoqKiogUG9zdGFsIENvZGU6IG9uIGZseSwgc2VydmVyLXNpZGUgdmFsaWRhdGlvbiAqKioqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIGJhc2VVcmw6ICcvJyxcclxuICAgICAgICBzZWxlY3RvcjogJ1tkYXRhLXZhbC1wb3N0YWxjb2RlXScsXHJcbiAgICAgICAgdXJsOiAnSlNPTi9WYWxpZGF0ZVBvc3RhbENvZGUvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIG9wdGlvbnMuc2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGNvbnRhaW5zIGEgdmFsdWUgKHRoaXMgbm90IHZhbGlkYXRlIGlmIGlzIHJlcXVpcmVkKSBhbmQgXHJcbiAgICAgICAgLy8gaGFzIHRoZSBlcnJvciBkZXNjcmlwdGl2ZSBtZXNzYWdlLCB2YWxpZGF0ZSB0aHJvdWdoIGFqYXhcclxuICAgICAgICB2YXIgcGMgPSAkdC52YWwoKTtcclxuICAgICAgICB2YXIgbXNnID0gJHQuZGF0YSgndmFsLXBvc3RhbGNvZGUnKTtcclxuICAgICAgICBpZiAocGMgJiYgbXNnKSB7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMuYmFzZVVybCArIG9wdGlvbnMudXJsLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogeyBQb3N0YWxDb2RlOiBwYyB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ0pTT04nLFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLlJlc3VsdC5Jc1ZhbGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmFkZENsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoJycpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhbiBzdW1tYXJ5IGVycm9yc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgnPiB1bCA+IGxpJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLnRleHQoKSA9PSBtc2cpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKS5yZW1vdmVDbGFzcygndmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnNpYmxpbmdzKCcuZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxzcGFuIGZvcj1cIicgKyAkdC5hdHRyKCduYW1lJykgKyAnXCIgZ2VuZXJhdGVkPVwidHJ1ZVwiPicgKyBtc2cgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHN1bW1hcnkgZXJyb3IgKGlmIHRoZXJlIGlzIG5vdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2hpbGRyZW4oJ3VsJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8bGk+JyArIG1zZyArICc8L2xpPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKiBBcHBseSBldmVyIGEgcmVkaXJlY3QgdG8gdGhlIGdpdmVuIFVSTCwgaWYgdGhpcyBpcyBhbiBpbnRlcm5hbCBVUkwgb3Igc2FtZVxyXG5wYWdlLCBpdCBmb3JjZXMgYSBwYWdlIHJlbG9hZCBmb3IgdGhlIGdpdmVuIFVSTC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlZGlyZWN0VG8odXJsKSB7XHJcbiAgICAvLyBCbG9jayB0byBhdm9pZCBtb3JlIHVzZXIgaW50ZXJhY3Rpb25zOlxyXG4gICAgJC5ibG9ja1VJKHsgbWVzc2FnZTogJycgfSk7IC8vbG9hZGluZ0Jsb2NrKTtcclxuICAgIC8vIENoZWNraW5nIGlmIGlzIGJlaW5nIHJlZGlyZWN0aW5nIG9yIG5vdFxyXG4gICAgdmFyIHJlZGlyZWN0ZWQgPSBmYWxzZTtcclxuICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gY2hlY2tSZWRpcmVjdCgpIHtcclxuICAgICAgICByZWRpcmVjdGVkID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgLy8gTmF2aWdhdGUgdG8gbmV3IGxvY2F0aW9uOlxyXG4gICAgd2luZG93LmxvY2F0aW9uID0gdXJsO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gSWYgcGFnZSBub3QgY2hhbmdlZCAoc2FtZSB1cmwgb3IgaW50ZXJuYWwgbGluayksIHBhZ2UgY29udGludWUgZXhlY3V0aW5nIHRoZW4gcmVmcmVzaDpcclxuICAgICAgICBpZiAoIXJlZGlyZWN0ZWQpXHJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0sIDUwKTtcclxufTtcclxuIiwiLyoqIFNhbml0aXplIHRoZSB3aGl0ZXNwYWNlcyBpbiBhIHRleHQgYnk6XHJcbi0gcmVwbGFjaW5nIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVyZXMgKGFueSBudW1iZXIgb2YgcmVwZXRpdGlvbiBcclxuYW5kIGFueSBraW5kIG9mIHdoaXRlIGNoYXJhY3RlcikgYnkgYSBub3JtYWwgd2hpdGUtc3BhY2VcclxuLSByZXBsYWNlIGVuY29kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlLXNwYWNlc1xyXG4tIGV2ZXIgcmV0dXJuIGEgc3RyaW5nLCBlbXB0eSB3aGVuIG51bGxcclxuKiovXHJcbmZ1bmN0aW9uIHNhbml0aXplV2hpdGVzcGFjZXModGV4dCkge1xyXG4gICAgLy8gRXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4gICAgdGV4dCA9ICh0ZXh0IHx8ICcnKVxyXG4gICAgLy8gUmVwbGFjZSBhbnkga2luZCBvZiBjb250aWd1b3VzIHdoaXRlc3BhY2VzIGNoYXJhY3RlcnMgYnkgYSBzaW5nbGUgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbiAgICAvLyAodGhhdHMgaW5jbHVkZSByZXBsYWNlIGVuY29uZGVkIG5vbi1icmVha2luZy1zcGFjZXMsXHJcbiAgICAvLyBhbmQgZHVwbGljYXRlZC1yZXBlYXRlZCBhcHBlYXJhbmNlcylcclxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJyk7XHJcbiAgICAvLyBSZW1vdmUgc3RhcnRpbmcgYW5kIGVuZGluZyB3aGl0ZXNwYWNlc1xyXG4gICAgcmV0dXJuICQudHJpbSh0ZXh0KTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gc2FuaXRpemVXaGl0ZXNwYWNlczsiLCIvKiogQ3VzdG9tIExvY29ub21pY3MgJ2xpa2UgYmxvY2tVSScgcG9wdXBzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlLFxyXG4gICAgYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi9hdXRvRm9jdXMnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG5cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2soY29udGVudEJveCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHtcclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBjbG9zYWJsZTogZmFsc2UsXHJcbiAgICAgICAgY2VudGVyOiBmYWxzZSxcclxuICAgICAgICAvKiBhcyBhIHZhbGlkIG9wdGlvbnMgcGFyYW1ldGVyIGZvciBMQy5oaWRlRWxlbWVudCBmdW5jdGlvbiAqL1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogNjAwLFxyXG4gICAgICAgICAgICBlZmZlY3Q6ICdmYWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgIGF1dG9mb2N1c09wdGlvbnM6IHsgbWFyZ2luVG9wOiA2MCB9LFxyXG4gICAgICAgIHdpZHRoOiAnYXV0bydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnRlbnRCb3ggPSAkKGNvbnRlbnRCb3gpO1xyXG4gICAgdmFyIGZ1bGwgPSBmYWxzZTtcclxuICAgIGlmIChibG9ja2VkID09IGRvY3VtZW50IHx8IGJsb2NrZWQgPT0gd2luZG93KSB7XHJcbiAgICAgICAgYmxvY2tlZCA9ICQoJ2JvZHknKTtcclxuICAgICAgICBmdWxsID0gdHJ1ZTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGJsb2NrZWQgPSAkKGJsb2NrZWQpO1xyXG5cclxuICAgIHZhciBib3hJbnNpZGVCbG9ja2VkID0gIWJsb2NrZWQuaXMoJ2JvZHksdHIsdGhlYWQsdGJvZHksdGZvb3QsdGFibGUsdWwsb2wsZGwnKTtcclxuXHJcbiAgICAvLyBHZXR0aW5nIGJveCBlbGVtZW50IGlmIGV4aXN0cyBhbmQgcmVmZXJlbmNpbmdcclxuICAgIHZhciBiSUQgPSBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnKTtcclxuICAgIGlmICghYklEKVxyXG4gICAgICAgIGJJRCA9IChjb250ZW50Qm94LmF0dHIoJ2lkJykgfHwgJycpICsgKGJsb2NrZWQuYXR0cignaWQnKSB8fCAnJykgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIGlmIChiSUQgPT0gJy1zbW9vdGhCb3hCbG9jaycpIHtcclxuICAgICAgICBiSUQgPSAnaWQtJyArIGd1aWRHZW5lcmF0b3IoKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgfVxyXG4gICAgYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJywgYklEKTtcclxuICAgIHZhciBib3ggPSAkKCcjJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoYklEKSk7XHJcbiAgICAvLyBIaWRpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94LnhoaWRlKG9wdGlvbnMuY2xvc2VPcHRpb25zKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICAgIGJveGNcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIG51bGwsIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycpKTsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgICAgIC5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJywgdHJ1ZSk7XHJcbiAgICBib3hjLmFwcGVuZChjb250ZW50Qm94KTtcclxuICAgIGJveGMud2lkdGgob3B0aW9ucy53aWR0aCk7XHJcbiAgICBib3guY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgaWYgKGJveEluc2lkZUJsb2NrZWQpIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBpbnNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudDpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgYmxvY2tlZC5jc3MoJ3otaW5kZXgnKSArIDEwKTtcclxuICAgICAgICBpZiAoIWJsb2NrZWQuY3NzKCdwb3NpdGlvbicpIHx8IGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpID09ICdzdGF0aWMnKVxyXG4gICAgICAgICAgICBibG9ja2VkLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJveGMuY3NzKCd0b3AnLCBjdCAtIGJveGMub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyKTtcclxuICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07IiwiLyoqXHJcbioqIE1vZHVsZTo6IHRvb2x0aXBzXHJcbioqIENyZWF0ZXMgc21hcnQgdG9vbHRpcHMgd2l0aCBwb3NzaWJpbGl0aWVzIGZvciBvbiBob3ZlciBhbmQgb24gY2xpY2ssXHJcbioqIGFkZGl0aW9uYWwgZGVzY3JpcHRpb24gb3IgZXh0ZXJuYWwgdG9vbHRpcCBjb250ZW50LlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNhbml0aXplV2hpdGVzcGFjZXMgPSByZXF1aXJlKCcuL3Nhbml0aXplV2hpdGVzcGFjZXMnKTtcclxucmVxdWlyZSgnLi9qcXVlcnkub3V0ZXJIdG1sJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5LmlzQ2hpbGRPZicpO1xyXG5cclxuLy8gTWFpbiBpbnRlcm5hbCBwcm9wZXJ0aWVzXHJcbnZhciBwb3NvZmZzZXQgPSB7IHg6IDE2LCB5OiA4IH07XHJcbnZhciBzZWxlY3RvciA9ICdbdGl0bGVdW2RhdGEtZGVzY3JpcHRpb25dLCBbdGl0bGVdLmhhcy10b29sdGlwLCBbdGl0bGVdLnNlY3VyZS1kYXRhLCBbZGF0YS10b29sdGlwLXVybF0sIFt0aXRsZV0uaGFzLXBvcHVwLXRvb2x0aXAnO1xyXG5cclxuLyoqIFBvc2l0aW9uYXRlIHRoZSB0b29sdGlwIGRlcGVuZGluZyBvbiB0aGVcclxuZXZlbnQgb3IgdGhlIHRhcmdldCBlbGVtZW50IHBvc2l0aW9uIGFuZCBhbiBvZmZzZXRcclxuKiovXHJcbmZ1bmN0aW9uIHBvcyh0LCBlLCBsKSB7XHJcbiAgICB2YXIgeCwgeTtcclxuICAgIGlmIChlLnBhZ2VYICYmIGUucGFnZVkpIHtcclxuICAgICAgICB4ID0gZS5wYWdlWDtcclxuICAgICAgICB5ID0gZS5wYWdlWTtcclxuICAgIH0gZWxzZSBpZiAoZS50YXJnZXQpIHtcclxuICAgICAgICB2YXIgJGV0ID0gJChlLnRhcmdldCk7XHJcbiAgICAgICAgeCA9ICRldC5vdXRlcldpZHRoKCkgKyAkZXQub2Zmc2V0KCkubGVmdDtcclxuICAgICAgICB5ID0gJGV0Lm91dGVySGVpZ2h0KCkgKyAkZXQub2Zmc2V0KCkudG9wO1xyXG4gICAgfVxyXG4gICAgdC5jc3MoJ2xlZnQnLCB4ICsgcG9zb2Zmc2V0LngpO1xyXG4gICAgdC5jc3MoJ3RvcCcsIHkgKyBwb3NvZmZzZXQueSk7XHJcbiAgICAvLyBBZGp1c3Qgd2lkdGggdG8gdmlzaWJsZSB2aWV3cG9ydFxyXG4gICAgdmFyIHRkaWYgPSB0Lm91dGVyV2lkdGgoKSAtIHQud2lkdGgoKTtcclxuICAgIHQuY3NzKCdtYXgtd2lkdGgnLCAkKHdpbmRvdykud2lkdGgoKSAtIHggLSBwb3NvZmZzZXQueCAtIHRkaWYpO1xyXG4gICAgLy90LmhlaWdodCgkKGRvY3VtZW50KS5oZWlnaHQoKSAtIHkgLSBwb3NvZmZzZXQueSk7XHJcbn1cclxuLyoqIEdldCBvciBjcmVhdGUsIGFuZCByZXR1cm5zLCB0aGUgdG9vbHRpcCBjb250ZW50IGZvciB0aGUgZWxlbWVudFxyXG4qKi9cclxuZnVuY3Rpb24gY29uKGwpIHtcclxuICAgIGlmIChsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgYyA9IGwuZGF0YSgndG9vbHRpcC1jb250ZW50JyksXHJcbiAgICAgICAgcGVyc2lzdGVudCA9IGwuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJyk7XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICB2YXIgaCA9IHNhbml0aXplV2hpdGVzcGFjZXMobC5hdHRyKCd0aXRsZScpKTtcclxuICAgICAgICB2YXIgZCA9IHNhbml0aXplV2hpdGVzcGFjZXMobC5kYXRhKCdkZXNjcmlwdGlvbicpKTtcclxuICAgICAgICBpZiAoZClcclxuICAgICAgICAgICAgYyA9ICc8aDQ+JyArIGggKyAnPC9oND48cD4nICsgZCArICc8L3A+JztcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGMgPSBoO1xyXG4gICAgICAgIC8vIEFwcGVuZCBkYXRhLXRvb2x0aXAtdXJsIGNvbnRlbnQgaWYgZXhpc3RzXHJcbiAgICAgICAgdmFyIHVybGNvbnRlbnQgPSAkKGwuZGF0YSgndG9vbHRpcC11cmwnKSk7XHJcbiAgICAgICAgYyA9IChjIHx8ICcnKSArIHVybGNvbnRlbnQub3V0ZXJIdG1sKCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIG9yaWdpbmFsLCBpcyBubyBtb3JlIG5lZWQgYW5kIGF2b2lkIGlkLWNvbmZsaWN0c1xyXG4gICAgICAgIHVybGNvbnRlbnQucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gU2F2ZSB0b29sdGlwIGNvbnRlbnRcclxuICAgICAgICBsLmRhdGEoJ3Rvb2x0aXAtY29udGVudCcsIGMpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBicm93c2VyIHRvb2x0aXAgKGJvdGggd2hlbiB3ZSBhcmUgdXNpbmcgb3VyIG93biB0b29sdGlwIGFuZCB3aGVuIG5vIHRvb2x0aXBcclxuICAgICAgICAvLyBpcyBuZWVkKVxyXG4gICAgICAgIGwuYXR0cigndGl0bGUnLCAnJyk7XHJcbiAgICB9XHJcbiAgICAvLyBSZW1vdmUgdG9vbHRpcCBjb250ZW50IChidXQgcHJlc2VydmUgaXRzIGNhY2hlIGluIHRoZSBlbGVtZW50IGRhdGEpXHJcbiAgICAvLyBpZiBpcyB0aGUgc2FtZSB0ZXh0IGFzIHRoZSBlbGVtZW50IGNvbnRlbnQgYW5kIHRoZSBlbGVtZW50IGNvbnRlbnRcclxuICAgIC8vIGlzIGZ1bGx5IHZpc2libGUuIFRoYXRzLCBmb3IgY2FzZXMgd2l0aCBkaWZmZXJlbnQgY29udGVudCwgd2lsbCBiZSBzaG93ZWQsXHJcbiAgICAvLyBhbmQgZm9yIGNhc2VzIHdpdGggc2FtZSBjb250ZW50IGJ1dCBpcyBub3QgdmlzaWJsZSBiZWNhdXNlIHRoZSBlbGVtZW50XHJcbiAgICAvLyBvciBjb250YWluZXIgd2lkdGgsIHRoZW4gd2lsbCBiZSBzaG93ZWQuXHJcbiAgICAvLyBFeGNlcHQgaWYgaXMgcGVyc2lzdGVudFxyXG4gICAgaWYgKHBlcnNpc3RlbnQgIT09IHRydWUgJiZcclxuICAgICAgICBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwudGV4dCgpKSA9PSBjICYmXHJcbiAgICAgICAgbC5vdXRlcldpZHRoKCkgPj0gbFswXS5zY3JvbGxXaWR0aCkge1xyXG4gICAgICAgIGMgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gY29udGVudDpcclxuICAgIGlmICghYykge1xyXG4gICAgICAgIC8vIFVwZGF0ZSB0YXJnZXQgcmVtb3ZpbmcgdGhlIGNsYXNzIHRvIGF2b2lkIGNzcyBtYXJraW5nIHRvb2x0aXAgd2hlbiB0aGVyZSBpcyBub3RcclxuICAgICAgICBsLnJlbW92ZUNsYXNzKCdoYXMtdG9vbHRpcCcpLnJlbW92ZUNsYXNzKCdoYXMtcG9wdXAtdG9vbHRpcCcpO1xyXG4gICAgfVxyXG4gICAgLy8gUmV0dXJuIHRoZSBjb250ZW50IGFzIHN0cmluZzpcclxuICAgIHJldHVybiBjO1xyXG59XHJcbi8qKiBHZXQgb3IgY3JlYXRlcyB0aGUgc2luZ2xldG9uIGluc3RhbmNlIGZvciBhIHRvb2x0aXAgb2YgdGhlIGdpdmVuIHR5cGVcclxuKiovXHJcbmZ1bmN0aW9uIGdldFRvb2x0aXAodHlwZSkge1xyXG4gICAgdHlwZSA9IHR5cGUgfHwgJ3Rvb2x0aXAnO1xyXG4gICAgdmFyIGlkID0gJ3NpbmdsZXRvbi0nICsgdHlwZTtcclxuICAgIHZhciB0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgaWYgKCF0KSB7XHJcbiAgICAgICAgdCA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZVwiIGNsYXNzPVwidG9vbHRpcFwiPjwvZGl2PicpO1xyXG4gICAgICAgIHQuYXR0cignaWQnLCBpZCk7XHJcbiAgICAgICAgdC5oaWRlKCk7XHJcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0KTtcclxuICAgIH1cclxuICAgIHJldHVybiAkKHQpO1xyXG59XHJcbi8qKiBTaG93IHRoZSB0b29sdGlwIG9uIGFuIGV2ZW50IHRyaWdnZXJlZCBieSB0aGUgZWxlbWVudCBjb250YWluaW5nXHJcbmluZm9ybWF0aW9uIGZvciBhIHRvb2x0aXBcclxuKiovXHJcbmZ1bmN0aW9uIHNob3dUb29sdGlwKGUpIHtcclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgaXNQb3B1cCA9ICR0Lmhhc0NsYXNzKCdoYXMtcG9wdXAtdG9vbHRpcCcpO1xyXG4gICAgLy8gR2V0IG9yIGNyZWF0ZSB0b29sdGlwIGxheWVyXHJcbiAgICB2YXIgdCA9IGdldFRvb2x0aXAoaXNQb3B1cCA/ICdwb3B1cC10b29sdGlwJyA6ICd0b29sdGlwJyk7XHJcbiAgICAvLyBJZiB0aGlzIGlzIG5vdCBwb3B1cCBhbmQgdGhlIGV2ZW50IGlzIGNsaWNrLCBkaXNjYXJkIHdpdGhvdXQgY2FuY2VsIGV2ZW50XHJcbiAgICBpZiAoIWlzUG9wdXAgJiYgZS50eXBlID09ICdjbGljaycpXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGNvbnRlbnQ6IGlmIHRoZXJlIGlzIGNvbnRlbnQsIGNvbnRpbnVlXHJcbiAgICB2YXIgY29udGVudCA9IGNvbigkdCk7XHJcbiAgICBpZiAoY29udGVudCkge1xyXG4gICAgICAgIC8vIElmIGlzIGEgaGFzLXBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgbm90IGEgY2xpY2ssIGRvbid0IHNob3dcclxuICAgICAgICBpZiAoaXNQb3B1cCAmJiBlLnR5cGUgIT0gJ2NsaWNrJylcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgLy8gVGhlIHRvb2x0aXAgc2V0dXAgbXVzdCBiZSBxdWV1ZWQgdG8gYXZvaWQgY29udGVudCB0byBiZSBzaG93ZWQgYW5kIHBsYWNlZFxyXG4gICAgICAgIC8vIHdoZW4gc3RpbGwgaGlkZGVuIHRoZSBwcmV2aW91c1xyXG4gICAgICAgIHQucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBTZXQgdG9vbHRpcCBjb250ZW50XHJcbiAgICAgICAgICAgIHQuaHRtbChjb250ZW50KTtcclxuICAgICAgICAgICAgLy8gRm9yIHBvcHVwcywgc2V0dXAgY2xhc3MgYW5kIGNsb3NlIGJ1dHRvblxyXG4gICAgICAgICAgICBpZiAoaXNQb3B1cCkge1xyXG4gICAgICAgICAgICAgICAgdC5hZGRDbGFzcygncG9wdXAtdG9vbHRpcCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGEgaHJlZj1cIiNjbG9zZS1wb3B1cFwiIGNsYXNzPVwiY2xvc2UtYWN0aW9uXCI+WDwvYT4nKTtcclxuICAgICAgICAgICAgICAgIHQuYXBwZW5kKGNsb3NlQnV0dG9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBQb3NpdGlvbmF0ZVxyXG4gICAgICAgICAgICBwb3ModCwgZSwgJHQpO1xyXG4gICAgICAgICAgICB0LmRlcXVldWUoKTtcclxuICAgICAgICAgICAgLy8gU2hvdyAoYW5pbWF0aW9ucyBhcmUgc3RvcHBlZCBvbmx5IG9uIGhpZGUgdG8gYXZvaWQgY29uZmxpY3RzKVxyXG4gICAgICAgICAgICB0LmZhZGVJbigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0b3AgYnViYmxpbmcgYW5kIGRlZmF1bHRcclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG4vKiogSGlkZSBhbGwgb3BlbmVkIHRvb2x0aXBzLCBmb3IgYW55IHR5cGUuXHJcbkl0IGhhcyBzb21lIHNwZWNpYWwgY29uc2lkZXJhdGlvbnMgZm9yIHBvcHVwLXRvb2x0aXBzIGRlcGVuZGluZ1xyXG5vbiB0aGUgZXZlbnQgYmVpbmcgdHJpZ2dlcmVkLlxyXG4qKi9cclxuZnVuY3Rpb24gaGlkZVRvb2x0aXAoZSkge1xyXG4gICAgJCgnLnRvb2x0aXA6dmlzaWJsZScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBJZiBpcyBhIHBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgbm90IGEgY2xpY2ssIG9yIHRoZSBpbnZlcnNlLFxyXG4gICAgICAgIC8vIHRoaXMgaXMgbm90IGEgcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBhIGNsaWNrLCBkbyBub3RoaW5nXHJcbiAgICAgICAgaWYgKHQuaGFzQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKSAmJiBlLnR5cGUgIT0gJ2NsaWNrJyB8fFxyXG4gICAgICAgICAgICAhdC5oYXNDbGFzcygncG9wdXAtdG9vbHRpcCcpICYmIGUudHlwZSA9PSAnY2xpY2snKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgLy8gU3RvcCBhbmltYXRpb25zIGFuZCBoaWRlXHJcbiAgICAgICAgdC5zdG9wKHRydWUsIHRydWUpLmZhZGVPdXQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG4vKiogSW5pdGlhbGl6ZSB0b29sdGlwc1xyXG4qKi9cclxuZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIC8vIExpc3RlbiBmb3IgZXZlbnRzIHRvIHNob3cvaGlkZSB0b29sdGlwc1xyXG4gICAgJCgnYm9keScpLm9uKCdtb3VzZW1vdmUgZm9jdXNpbicsIHNlbGVjdG9yLCBzaG93VG9vbHRpcClcclxuICAgIC5vbignbW91c2VsZWF2ZSBmb2N1c291dCcsIHNlbGVjdG9yLCBoaWRlVG9vbHRpcClcclxuICAgIC8vIExpc3RlbiBldmVudCBmb3IgY2xpY2thYmxlIHBvcHVwLXRvb2x0aXBzXHJcbiAgICAub24oJ2NsaWNrJywgJ1t0aXRsZV0uaGFzLXBvcHVwLXRvb2x0aXAnLCBzaG93VG9vbHRpcClcclxuICAgIC8vIEFsbG93aW5nIGJ1dHRvbnMgaW5zaWRlIHRoZSB0b29sdGlwXHJcbiAgICAub24oJ2NsaWNrJywgJy50b29sdGlwLWJ1dHRvbicsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgLy8gQWRkaW5nIGNsb3NlLXRvb2x0aXAgaGFuZGxlciBmb3IgcG9wdXAtdG9vbHRpcHMgKGNsaWNrIG9uIGFueSBlbGVtZW50IGV4Y2VwdCB0aGUgdG9vbHRpcCBpdHNlbGYpXHJcbiAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB2YXIgdCA9ICQoJy5wb3B1cC10b29sdGlwOnZpc2libGUnKS5nZXQoMCk7XHJcbiAgICAgICAgLy8gSWYgdGhlIGNsaWNrIGlzIE5vdCBvbiB0aGUgdG9vbHRpcCBvciBhbnkgZWxlbWVudCBjb250YWluZWRcclxuICAgICAgICAvLyBoaWRlIHRvb2x0aXBcclxuICAgICAgICBpZiAoZS50YXJnZXQgIT0gdCAmJiAhJChlLnRhcmdldCkuaXNDaGlsZE9mKHQpKVxyXG4gICAgICAgICAgICBoaWRlVG9vbHRpcChlKTtcclxuICAgIH0pXHJcbiAgICAvLyBBdm9pZCBjbG9zZS1hY3Rpb24gY2xpY2sgZnJvbSByZWRpcmVjdCBwYWdlLCBhbmQgaGlkZSB0b29sdGlwXHJcbiAgICAub24oJ2NsaWNrJywgJy5wb3B1cC10b29sdGlwIC5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBoaWRlVG9vbHRpcChlKTtcclxuICAgIH0pO1xyXG4gICAgdXBkYXRlKCk7XHJcbn1cclxuLyoqIFVwZGF0ZSBlbGVtZW50cyBvbiB0aGUgcGFnZSB0byByZWZsZWN0IGNoYW5nZXMgb3IgbmVlZCBmb3IgdG9vbHRpcHNcclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZShlbGVtZW50X3NlbGVjdG9yKSB7XHJcbiAgICAvLyBSZXZpZXcgZXZlcnkgcG9wdXAgdG9vbHRpcCB0byBwcmVwYXJlIGNvbnRlbnQgYW5kIG1hcmsvdW5tYXJrIHRoZSBsaW5rIG9yIHRleHQ6XHJcbiAgICAkKGVsZW1lbnRfc2VsZWN0b3IgfHwgc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbigkKHRoaXMpKTtcclxuICAgIH0pO1xyXG59XHJcbi8qKiBDcmVhdGUgdG9vbHRpcCBvbiBlbGVtZW50IGJ5IGRlbWFuZFxyXG4qKi9cclxuZnVuY3Rpb24gY3JlYXRlX3Rvb2x0aXAoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdmFyIHNldHRpbmdzID0gJC5leHRlbmQoe30sIHtcclxuICAgICAgdGl0bGU6ICcnXHJcbiAgICAgICwgZGVzY3JpcHRpb246IG51bGxcclxuICAgICAgLCB1cmw6IG51bGxcclxuICAgICAgLCBpc19wb3B1cDogZmFsc2VcclxuICAgICAgLCBwZXJzaXN0ZW50OiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChlbGVtZW50KVxyXG4gICAgLmF0dHIoJ3RpdGxlJywgc2V0dGluZ3MudGl0bGUpXHJcbiAgICAuZGF0YSgnZGVzY3JpcHRpb24nLCBzZXR0aW5ncy5kZXNjcmlwdGlvbilcclxuICAgIC5kYXRhKCdwZXJzaXN0ZW50LXRvb2x0aXAnLCBzZXR0aW5ncy5wZXJzaXN0ZW50KVxyXG4gICAgLmFkZENsYXNzKHNldHRpbmdzLmlzX3BvcHVwID8gJ2hhcy1wb3B1cC10b29sdGlwJyA6ICdoYXMtdG9vbHRpcCcpO1xyXG4gICAgdXBkYXRlKGVsZW1lbnQpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0VG9vbHRpcHM6IGluaXQsXHJcbiAgICAgICAgdXBkYXRlVG9vbHRpcHM6IHVwZGF0ZSxcclxuICAgICAgICBjcmVhdGVUb29sdGlwOiBjcmVhdGVfdG9vbHRpcFxyXG4gICAgfTtcclxuIiwiLyogU29tZSB0b29scyBmb3JtIFVSTCBtYW5hZ2VtZW50XHJcbiovXHJcbmV4cG9ydHMuZ2V0VVJMUGFyYW1ldGVyID0gZnVuY3Rpb24gZ2V0VVJMUGFyYW1ldGVyKG5hbWUpIHtcclxuICAgIHJldHVybiBkZWNvZGVVUkkoXHJcbiAgICAgICAgKFJlZ0V4cChuYW1lICsgJz0nICsgJyguKz8pKCZ8JCknLCAnaScpLmV4ZWMobG9jYXRpb24uc2VhcmNoKSB8fCBbLCBudWxsXSlbMV0pO1xyXG59O1xyXG5leHBvcnRzLmdldEhhc2hCYW5nUGFyYW1ldGVycyA9IGZ1bmN0aW9uIGdldEhhc2hCYW5nUGFyYW1ldGVycyhoYXNoYmFuZ3ZhbHVlKSB7XHJcbiAgICAvLyBIYXNoYmFuZ3ZhbHVlIGlzIHNvbWV0aGluZyBsaWtlOiBUaHJlYWQtMV9NZXNzYWdlLTJcclxuICAgIC8vIFdoZXJlICcxJyBpcyB0aGUgVGhyZWFkSUQgYW5kICcyJyB0aGUgb3B0aW9uYWwgTWVzc2FnZUlELCBvciBvdGhlciBwYXJhbWV0ZXJzXHJcbiAgICB2YXIgcGFycyA9IGhhc2hiYW5ndmFsdWUuc3BsaXQoJ18nKTtcclxuICAgIHZhciB1cmxQYXJhbWV0ZXJzID0ge307XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgcGFyc3ZhbHVlcyA9IHBhcnNbaV0uc3BsaXQoJy0nKTtcclxuICAgICAgICBpZiAocGFyc3ZhbHVlcy5sZW5ndGggPT0gMilcclxuICAgICAgICAgICAgdXJsUGFyYW1ldGVyc1twYXJzdmFsdWVzWzBdXSA9IHBhcnN2YWx1ZXNbMV07XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB1cmxQYXJhbWV0ZXJzW3BhcnN2YWx1ZXNbMF1dID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiB1cmxQYXJhbWV0ZXJzO1xyXG59O1xyXG4iLCIvKiogVmFsaWRhdGlvbiBsb2dpYyB3aXRoIGxvYWQgYW5kIHNldHVwIG9mIHZhbGlkYXRvcnMgYW5kIFxyXG4gICAgdmFsaWRhdGlvbiByZWxhdGVkIHV0aWxpdGllc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpO1xyXG5cclxuLy8gVXNpbmcgb24gc2V0dXAgYXN5bmNyb25vdXMgbG9hZCBpbnN0ZWFkIG9mIHRoaXMgc3RhdGljLWxpbmtlZCBsb2FkXHJcbi8vIHJlcXVpcmUoJ2pxdWVyeS9qcXVlcnkudmFsaWRhdGUubWluLmpzJyk7XHJcbi8vIHJlcXVpcmUoJ2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cFZhbGlkYXRpb24ocmVhcHBseU9ubHlUbykge1xyXG4gICAgcmVhcHBseU9ubHlUbyA9IHJlYXBwbHlPbmx5VG8gfHwgZG9jdW1lbnQ7XHJcbiAgICBpZiAoIXdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkKSB3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCA9IGZhbHNlO1xyXG4gICAgaWYgKCFqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkKSB7XHJcbiAgICAgICAganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgTW9kZXJuaXpyLmxvYWQoW1xyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUubWluLmpzXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qc1wiIH1cclxuICAgICAgICAgICAgXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIENoZWNrIGZpcnN0IGlmIHZhbGlkYXRpb24gaXMgZW5hYmxlZCAoY2FuIGhhcHBlbiB0aGF0IHR3aWNlIGluY2x1ZGVzIG9mXHJcbiAgICAgICAgLy8gdGhpcyBjb2RlIGhhcHBlbiBhdCBzYW1lIHBhZ2UsIGJlaW5nIGV4ZWN1dGVkIHRoaXMgY29kZSBhZnRlciBmaXJzdCBhcHBlYXJhbmNlXHJcbiAgICAgICAgLy8gd2l0aCB0aGUgc3dpdGNoIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgY2hhbmdlZFxyXG4gICAgICAgIC8vIGJ1dCB3aXRob3V0IHZhbGlkYXRpb24gYmVpbmcgYWxyZWFkeSBsb2FkZWQgYW5kIGVuYWJsZWQpXHJcbiAgICAgICAgaWYgKCQgJiYgJC52YWxpZGF0b3IgJiYgJC52YWxpZGF0b3IudW5vYnRydXNpdmUpIHtcclxuICAgICAgICAgICAgLy8gQXBwbHkgdGhlIHZhbGlkYXRpb24gcnVsZXMgdG8gdGhlIG5ldyBlbGVtZW50c1xyXG4gICAgICAgICAgICAkKHJlYXBwbHlPbmx5VG8pLnJlbW92ZURhdGEoJ3ZhbGlkYXRvcicpO1xyXG4gICAgICAgICAgICAkKHJlYXBwbHlPbmx5VG8pLnJlbW92ZURhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gICAgICAgICAgICAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZS5wYXJzZShyZWFwcGx5T25seVRvKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdGllcyAqL1xyXG5cclxuLyogQ2xlYW4gcHJldmlvdXMgdmFsaWRhdGlvbiBlcnJvcnMgb2YgdGhlIHZhbGlkYXRpb24gc3VtbWFyeVxyXG5pbmNsdWRlZCBpbiAnY29udGFpbmVyJyBhbmQgc2V0IGFzIHZhbGlkIHRoZSBzdW1tYXJ5XHJcbiovXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudDtcclxuICAgICQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgIC5maW5kKCc+dWw+bGknKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBTZXQgYWxsIGZpZWxkcyB2YWxpZGF0aW9uIGluc2lkZSB0aGlzIGZvcm0gKGFmZmVjdGVkIGJ5IHRoZSBzdW1tYXJ5IHRvbylcclxuICAgIC8vIGFzIHZhbGlkIHRvb1xyXG4gICAgJCgnLmZpZWxkLXZhbGlkYXRpb24tZXJyb3InLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgIC50ZXh0KCcnKTtcclxuXHJcbiAgICAvLyBSZS1hcHBseSBzZXR1cCB2YWxpZGF0aW9uIHRvIGVuc3VyZSBpcyB3b3JraW5nLCBiZWNhdXNlIGp1c3QgYWZ0ZXIgYSBzdWNjZXNzZnVsXHJcbiAgICAvLyB2YWxpZGF0aW9uLCBhc3AubmV0IHVub2J0cnVzaXZlIHZhbGlkYXRpb24gc3RvcHMgd29ya2luZyBvbiBjbGllbnQtc2lkZS5cclxuICAgIExDLnNldHVwVmFsaWRhdGlvbigpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IoY29udGFpbmVyKSB7XHJcbiAgdmFyIHYgPSBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKTtcclxuICB2LmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnb1RvU3VtbWFyeUVycm9ycyhmb3JtKSB7XHJcbiAgICB2YXIgb2ZmID0gZm9ybS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLm9mZnNldCgpO1xyXG4gICAgaWYgKG9mZilcclxuICAgICAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IG9mZi50b3AgfSwgNTAwKTtcclxuICAgIGVsc2VcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdnb1RvU3VtbWFyeUVycm9yczogbm8gc3VtbWFyeSB0byBmb2N1cycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKSB7XHJcbiAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gIHJldHVybiAkKCdbZGF0YS12YWxtc2ctc3VtbWFyeT10cnVlXScpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNldHVwOiBzZXR1cFZhbGlkYXRpb24sXHJcbiAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQ6IHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZCxcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcjogc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yLFxyXG4gICAgZ29Ub1N1bW1hcnlFcnJvcnM6IGdvVG9TdW1tYXJ5RXJyb3JzLFxyXG4gICAgZmluZFZhbGlkYXRpb25TdW1tYXJ5OiBmaW5kVmFsaWRhdGlvblN1bW1hcnlcclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIHNvbWUgQWNjb3VudCBwYWdlcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmxvZ2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSBiYXNlVXJsICsgJ0FjY291bnQvJExvZ2luLz9SZXR1cm5Vcmw9JyArIGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24pO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmZvcmdvdC1wYXNzd29yZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9Gb3Jnb3RQYXNzd29yZCcsICcvQWNjb3VudC8kRm9yZ290UGFzc3dvcmQnKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQwMCwgaGVpZ2h0OiAyNDAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5jaGFuZ2UtcGFzc3dvcmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvQ2hhbmdlUGFzc3dvcmQnLCAnL0FjY291bnQvJENoYW5nZVBhc3N3b3JkJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0NTAsIGhlaWdodDogMzQwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8vIE9VUiBuYW1lc3BhY2UgKGFiYnJldmlhdGVkIExvY29ub21pY3MpXHJcbndpbmRvdy5MQyA9IHdpbmRvdy5MQyB8fCB7fTtcclxuXHJcbi8vIFRPRE8gUmV2aWV3IExjVXJsIHVzZSBhcm91bmQgYWxsIHRoZSBtb2R1bGVzLCB1c2UgREkgd2hlbmV2ZXIgcG9zc2libGUgKGluaXQvc2V0dXAgbWV0aG9kIG9yIGluIHVzZSBjYXNlcylcclxuLy8gYnV0IG9ubHkgZm9yIHRoZSB3YW50ZWQgYmFzZVVybCBvbiBlYWNoIGNhc2UgYW5kIG5vdCBwYXNzIGFsbCB0aGUgTGNVcmwgb2JqZWN0LlxyXG4vLyBMY1VybCBpcyBzZXJ2ZXItc2lkZSBnZW5lcmF0ZWQgYW5kIHdyb3RlIGluIGEgTGF5b3V0IHNjcmlwdC10YWcuXHJcblxyXG4vLyBHbG9iYWwgc2V0dGluZ3Ncclxud2luZG93LmdMb2FkaW5nUmV0YXJkID0gMzAwO1xyXG5cclxuLyoqKlxyXG4gKiogTG9hZGluZyBtb2R1bGVzXHJcbioqKi9cclxuLy9UT0RPOiBDbGVhbiBkZXBlbmRlbmNpZXMsIHJlbW92ZSBhbGwgdGhhdCBub3QgdXNlZCBkaXJlY3RseSBpbiB0aGlzIGZpbGUsIGFueSBvdGhlciBmaWxlXHJcbi8vIG9yIHBhZ2UgbXVzdCByZXF1aXJlIGl0cyBkZXBlbmRlbmNpZXMuXHJcblxyXG53aW5kb3cuTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG5cclxuLyogalF1ZXJ5LCBzb21lIHZlbmRvciBwbHVnaW5zIChmcm9tIGJ1bmRsZSkgYW5kIG91ciBhZGRpdGlvbnMgKHNtYWxsIHBsdWdpbnMpLCB0aGV5IGFyZSBhdXRvbWF0aWNhbGx5IHBsdWctZWQgb24gcmVxdWlyZSAqL1xyXG52YXIgJCA9IHdpbmRvdy4kID0gd2luZG93LmpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5iYS1oYXNoY2hhbmdlJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5hcmUnKTtcclxuLy8gTWFza2VkIGlucHV0LCBmb3IgZGF0ZXMgLWF0IG15LWFjY291bnQtLlxyXG5yZXF1aXJlKCdqcXVlcnkuZm9ybWF0dGVyJyk7XHJcblxyXG4vLyBHZW5lcmFsIGNhbGxiYWNrcyBmb3IgQUpBWCBldmVudHMgd2l0aCBjb21tb24gbG9naWNcclxudmFyIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuLi9MQy9hamF4Q2FsbGJhY2tzJyk7XHJcbi8vIEZvcm0uYWpheCBsb2dpYyBhbmQgbW9yZSBzcGVjaWZpYyBjYWxsYmFja3MgYmFzZWQgb24gYWpheENhbGxiYWNrc1xyXG52YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG53aW5kb3cuYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIgPSBhamF4Rm9ybXMub25TdWNjZXNzO1xyXG53aW5kb3cuYWpheEVycm9yUG9wdXBIYW5kbGVyID0gYWpheEZvcm1zLm9uRXJyb3I7XHJcbndpbmRvdy5hamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXIgPSBhamF4Rm9ybXMub25Db21wbGV0ZTtcclxuLy99XHJcblxyXG4vKiBSZWxvYWQgKi9cclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LnJlbG9hZCcpO1xyXG4vLyBXcmFwcGVyIGZ1bmN0aW9uIGFyb3VuZCBvblN1Y2Nlc3MgdG8gbWFyayBvcGVyYXRpb24gYXMgcGFydCBvZiBhIFxyXG4vLyByZWxvYWQgYXZvaWRpbmcgc29tZSBidWdzIChhcyByZXBsYWNlLWNvbnRlbnQgb24gYWpheC1ib3gsIG5vdCB3YW50ZWQgZm9yXHJcbi8vIHJlbG9hZCBvcGVyYXRpb25zKVxyXG5mdW5jdGlvbiByZWxvYWRTdWNjZXNzV3JhcHBlcigpIHtcclxuICB2YXIgY29udGV4dCA9ICQuaXNQbGFpbk9iamVjdCh0aGlzKSA/IHRoaXMgOiB7IGVsZW1lbnQ6IHRoaXMgfTtcclxuICBjb250ZXh0LmlzUmVsb2FkID0gdHJ1ZTtcclxuICBhamF4Rm9ybXMub25TdWNjZXNzLmFwcGx5KGNvbnRleHQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xyXG59XHJcbiQuZm4ucmVsb2FkLmRlZmF1bHRzID0ge1xyXG4gIHN1Y2Nlc3M6IFtyZWxvYWRTdWNjZXNzV3JhcHBlcl0sXHJcbiAgZXJyb3I6IFthamF4Rm9ybXMub25FcnJvcl0sXHJcbiAgZGVsYXk6IGdMb2FkaW5nUmV0YXJkXHJcbn07XHJcblxyXG5MQy5tb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4uL0xDL21vdmVGb2N1c1RvJyk7XHJcbi8qIERpc2FibGVkIGJlY2F1c2UgY29uZmxpY3RzIHdpdGggdGhlIG1vdmVGb2N1c1RvIG9mIFxyXG4gIGFqYXhGb3JtLm9uc3VjY2VzcywgaXQgaGFwcGVucyBhIGJsb2NrLmxvYWRpbmcganVzdCBhZnRlclxyXG4gIHRoZSBzdWNjZXNzIGhhcHBlbnMuXHJcbiQuYmxvY2tVSS5kZWZhdWx0cy5vbkJsb2NrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gU2Nyb2xsIHRvIGJsb2NrLW1lc3NhZ2UgdG8gZG9uJ3QgbG9zdCBpbiBsYXJnZSBwYWdlczpcclxuICAgIExDLm1vdmVGb2N1c1RvKHRoaXMpO1xyXG59OyovXHJcblxyXG52YXIgbG9hZGVyID0gcmVxdWlyZSgnLi4vTEMvbG9hZGVyJyk7XHJcbkxDLmxvYWQgPSBsb2FkZXIubG9hZDtcclxuXHJcbnZhciBibG9ja3MgPSBMQy5ibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuLi9MQy9ibG9ja1ByZXNldHMnKTtcclxuLy97VEVNUFxyXG53aW5kb3cubG9hZGluZ0Jsb2NrID0gYmxvY2tzLmxvYWRpbmc7XHJcbndpbmRvdy5pbmZvQmxvY2sgPSBibG9ja3MuaW5mbztcclxud2luZG93LmVycm9yQmxvY2sgPSBibG9ja3MuZXJyb3I7XHJcbi8vfVxyXG5cclxuQXJyYXkucmVtb3ZlID0gcmVxdWlyZSgnLi4vTEMvQXJyYXkucmVtb3ZlJyk7XHJcbnJlcXVpcmUoJy4uL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMnKTtcclxuXHJcbkxDLmdldFRleHQgPSByZXF1aXJlKCcuLi9MQy9nZXRUZXh0Jyk7XHJcblxyXG52YXIgVGltZVNwYW4gPSBMQy50aW1lU3BhbiA9IHJlcXVpcmUoJy4uL0xDL1RpbWVTcGFuJyk7XHJcbnZhciB0aW1lU3BhbkV4dHJhID0gcmVxdWlyZSgnLi4vTEMvVGltZVNwYW5FeHRyYScpO1xyXG50aW1lU3BhbkV4dHJhLnBsdWdJbihUaW1lU3Bhbik7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc2VzXHJcbkxDLnNtYXJ0VGltZSA9IHRpbWVTcGFuRXh0cmEuc21hcnRUaW1lO1xyXG5MQy5yb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyID0gdGltZVNwYW5FeHRyYS5yb3VuZFRvUXVhcnRlckhvdXI7XHJcbi8vfVxyXG5cclxuTEMuQ2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4uL0xDL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxud2luZG93LlRhYmJlZFVYID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVgnKTtcclxudmFyIHNsaWRlclRhYnMgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5zbGlkZXJUYWJzJyk7XHJcblxyXG4vLyBQb3B1cCBBUElzXHJcbndpbmRvdy5zbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4uL0xDL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG52YXIgcG9wdXAgPSByZXF1aXJlKCcuLi9MQy9wb3B1cCcpO1xyXG4vL3tURU1QXHJcbnZhciBwb3B1cFN0eWxlID0gcG9wdXAuc3R5bGUsXHJcbiAgICBwb3B1cFNpemUgPSBwb3B1cC5zaXplO1xyXG5MQy5tZXNzYWdlUG9wdXAgPSBwb3B1cC5tZXNzYWdlO1xyXG5MQy5jb25uZWN0UG9wdXBBY3Rpb24gPSBwb3B1cC5jb25uZWN0QWN0aW9uO1xyXG53aW5kb3cucG9wdXAgPSBwb3B1cDtcclxuLy99XHJcblxyXG5MQy5zYW5pdGl6ZVdoaXRlc3BhY2VzID0gcmVxdWlyZSgnLi4vTEMvc2FuaXRpemVXaGl0ZXNwYWNlcycpO1xyXG4vL3tURU1QICAgYWxpYXMgYmVjYXVzZSBtaXNzcGVsbGluZ1xyXG5MQy5zYW5pdGl6ZVdoaXRlcGFjZXMgPSBMQy5zYW5pdGl6ZVdoaXRlc3BhY2VzO1xyXG4vL31cclxuXHJcbkxDLmdldFhQYXRoID0gcmVxdWlyZSgnLi4vTEMvZ2V0WFBhdGgnKTtcclxuXHJcbnZhciBzdHJpbmdGb3JtYXQgPSByZXF1aXJlKCcuLi9MQy9TdHJpbmdGb3JtYXQnKTtcclxuXHJcbi8vIEV4cGFuZGluZyBleHBvcnRlZCB1dGlsaXRlcyBmcm9tIG1vZHVsZXMgZGlyZWN0bHkgYXMgTEMgbWVtYmVyczpcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL1ByaWNlJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvbWF0aFV0aWxzJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvbnVtYmVyVXRpbHMnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy90b29sdGlwcycpKTtcclxudmFyIGkxOG4gPSBMQy5pMThuID0gcmVxdWlyZSgnLi4vTEMvaTE4bicpO1xyXG4vL3tURU1QIG9sZCBhbGlzZXMgb24gTEMgYW5kIGdsb2JhbFxyXG4kLmV4dGVuZChMQywgaTE4bik7XHJcbiQuZXh0ZW5kKHdpbmRvdywgaTE4bik7XHJcbi8vfVxyXG5cclxuLy8geHRzaDogcGx1Z2VkIGludG8ganF1ZXJ5IGFuZCBwYXJ0IG9mIExDXHJcbnZhciB4dHNoID0gcmVxdWlyZSgnLi4vTEMvanF1ZXJ5Lnh0c2gnKTtcclxueHRzaC5wbHVnSW4oJCk7XHJcbi8ve1RFTVAgICByZW1vdmUgb2xkIExDLiogYWxpYXNcclxuJC5leHRlbmQoTEMsIHh0c2gpO1xyXG5kZWxldGUgTEMucGx1Z0luO1xyXG4vL31cclxuXHJcbnZhciBhdXRvQ2FsY3VsYXRlID0gTEMuYXV0b0NhbGN1bGF0ZSA9IHJlcXVpcmUoJy4uL0xDL2F1dG9DYWxjdWxhdGUnKTtcclxuLy97VEVNUCAgIHJlbW92ZSBvbGQgYWxpYXMgdXNlXHJcbnZhciBsY1NldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyA9IGF1dG9DYWxjdWxhdGUub25UYWJsZUl0ZW1zO1xyXG5MQy5zZXR1cENhbGN1bGF0ZVN1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLm9uU3VtbWFyeTtcclxuTEMudXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUudXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeTtcclxuTEMuc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS5vbkRldGFpbGVkUHJpY2luZ1N1bW1hcnk7XHJcbi8vfVxyXG5cclxudmFyIENvb2tpZSA9IExDLkNvb2tpZSA9IHJlcXVpcmUoJy4uL0xDL0Nvb2tpZScpO1xyXG4vL3tURU1QICAgIG9sZCBhbGlhc1xyXG52YXIgZ2V0Q29va2llID0gQ29va2llLmdldCxcclxuICAgIHNldENvb2tpZSA9IENvb2tpZS5zZXQ7XHJcbi8vfVxyXG5cclxuTEMuZGF0ZVBpY2tlciA9IHJlcXVpcmUoJy4uL0xDL2RhdGVQaWNrZXInKTtcclxuLy97VEVNUCAgIG9sZCBhbGlhc1xyXG53aW5kb3cuc2V0dXBEYXRlUGlja2VyID0gTEMuc2V0dXBEYXRlUGlja2VyID0gTEMuZGF0ZVBpY2tlci5pbml0O1xyXG53aW5kb3cuYXBwbHlEYXRlUGlja2VyID0gTEMuYXBwbHlEYXRlUGlja2VyID0gTEMuZGF0ZVBpY2tlci5hcHBseTtcclxuLy99XHJcblxyXG5MQy5hdXRvRm9jdXMgPSByZXF1aXJlKCcuLi9MQy9hdXRvRm9jdXMnKTtcclxuXHJcbi8vIENSVURMOiBsb2FkaW5nIG1vZHVsZSwgc2V0dGluZyB1cCBjb21tb24gZGVmYXVsdCB2YWx1ZXMgYW5kIGNhbGxiYWNrczpcclxudmFyIGNydWRsTW9kdWxlID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKTtcclxuY3J1ZGxNb2R1bGUuZGVmYXVsdFNldHRpbmdzLmRhdGFbJ2ZvY3VzLWNsb3Nlc3QnXVsnZGVmYXVsdCddID0gJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbic7XHJcbmNydWRsTW9kdWxlLmRlZmF1bHRTZXR0aW5ncy5kYXRhWydmb2N1cy1tYXJnaW4nXVsnZGVmYXVsdCddID0gMTA7XHJcbnZhciBjcnVkbCA9IGNydWRsTW9kdWxlLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vIFByZXZpb3VzIHVzZWQgYWxpYXMgKGRlcHJlY2F0ZWQpOlxyXG5MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxuXHJcbi8vIFVJIFNsaWRlciBMYWJlbHNcclxudmFyIHNsaWRlckxhYmVscyA9IHJlcXVpcmUoJy4uL0xDL1VJU2xpZGVyTGFiZWxzJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG5MQy5jcmVhdGVMYWJlbHNGb3JVSVNsaWRlciA9IHNsaWRlckxhYmVscy5jcmVhdGU7XHJcbkxDLnVwZGF0ZUxhYmVsc0ZvclVJU2xpZGVyID0gc2xpZGVyTGFiZWxzLnVwZGF0ZTtcclxuTEMudWlTbGlkZXJMYWJlbHNMYXlvdXRzID0gc2xpZGVyTGFiZWxzLmxheW91dHM7XHJcbi8vfVxyXG5cclxudmFyIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuLi9MQy92YWxpZGF0aW9uSGVscGVyJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG5MQy5zZXR1cFZhbGlkYXRpb24gPSB2YWxpZGF0aW9uSGVscGVyLnNldHVwO1xyXG5MQy5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQgPSB2YWxpZGF0aW9uSGVscGVyLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDtcclxuTEMuZ29Ub1N1bW1hcnlFcnJvcnMgPSB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzO1xyXG4vL31cclxuXHJcbkxDLnBsYWNlSG9sZGVyID0gcmVxdWlyZSgnLi4vTEMvcGxhY2Vob2xkZXItcG9seWZpbGwnKS5pbml0O1xyXG5cclxuTEMubWFwUmVhZHkgPSByZXF1aXJlKCcuLi9MQy9nb29nbGVNYXBSZWFkeScpO1xyXG5cclxud2luZG93LmlzRW1wdHlTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9pc0VtcHR5U3RyaW5nJyk7XHJcblxyXG53aW5kb3cuZ3VpZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL0xDL2d1aWRHZW5lcmF0b3InKTtcclxuXHJcbnZhciB1cmxVdGlscyA9IHJlcXVpcmUoJy4uL0xDL3VybFV0aWxzJyk7XHJcbndpbmRvdy5nZXRVUkxQYXJhbWV0ZXIgPSB1cmxVdGlscy5nZXRVUkxQYXJhbWV0ZXI7XHJcbndpbmRvdy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSB1cmxVdGlscy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnM7XHJcblxyXG52YXIgZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nJyk7XHJcbi8ve1RFTVBcclxuTEMuZGF0ZVRvSW50ZXJjaGFuZ2xlU3RyaW5nID0gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nO1xyXG4vL31cclxuXHJcbi8vIFBhZ2VzIGluIHBvcHVwXHJcbnZhciB3ZWxjb21lUG9wdXAgPSByZXF1aXJlKCcuL3dlbGNvbWVQb3B1cCcpO1xyXG52YXIgZmFxc1BvcHVwcyA9IHJlcXVpcmUoJy4vZmFxc1BvcHVwcycpO1xyXG52YXIgYWNjb3VudFBvcHVwcyA9IHJlcXVpcmUoJy4vYWNjb3VudFBvcHVwcycpO1xyXG52YXIgbGVnYWxQb3B1cHMgPSByZXF1aXJlKCcuL2xlZ2FsUG9wdXBzJyk7XHJcblxyXG4vLyBPbGQgYXZhaWxhYmxpdHkgY2FsZW5kYXJcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0ID0gcmVxdWlyZSgnLi9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldCcpO1xyXG4vLyBOZXcgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhciA9IHJlcXVpcmUoJy4uL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyJyk7XHJcblxyXG52YXIgYXV0b2ZpbGxTdWJtZW51ID0gcmVxdWlyZSgnLi4vTEMvYXV0b2ZpbGxTdWJtZW51Jyk7XHJcblxyXG52YXIgdGFiYmVkV2l6YXJkID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVgud2l6YXJkJyk7XHJcblxyXG52YXIgaGFzQ29uZmlybVN1cHBvcnQgPSByZXF1aXJlKCcuLi9MQy9oYXNDb25maXJtU3VwcG9ydCcpO1xyXG5cclxudmFyIHBvc3RhbENvZGVWYWxpZGF0aW9uID0gcmVxdWlyZSgnLi4vTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24nKTtcclxuXHJcbnZhciB0YWJiZWROb3RpZmljYXRpb25zID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxudmFyIHRhYnNBdXRvbG9hZCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLmF1dG9sb2FkJyk7XHJcblxyXG52YXIgaG9tZVBhZ2UgPSByZXF1aXJlKCcuL2hvbWUnKTtcclxuXHJcbi8ve1RFTVAgcmVtb3ZlIGdsb2JhbCBkZXBlbmRlbmN5IGZvciB0aGlzXHJcbndpbmRvdy5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi4vTEMvanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG4vL31cclxuXHJcbnZhciBwcm92aWRlcldlbGNvbWUgPSByZXF1aXJlKCcuL3Byb3ZpZGVyV2VsY29tZScpO1xyXG5cclxuLyoqXHJcbiAqKiBJbml0IGNvZGVcclxuKioqL1xyXG4kKHdpbmRvdykubG9hZChmdW5jdGlvbiAoKSB7XHJcbiAgLy8gRGlzYWJsZSBicm93c2VyIGJlaGF2aW9yIHRvIGF1dG8tc2Nyb2xsIHRvIHVybCBmcmFnbWVudC9oYXNoIGVsZW1lbnQgcG9zaXRpb246XHJcbiAgLy8gRVhDRVBUIGluIERhc2hib2FyZDpcclxuICAvLyBUT0RPOiBSZXZpZXcgaWYgdGhpcyBpcyByZXF1aXJlZCBvbmx5IGZvciBIb3dJdFdvcmtzIG9yIHNvbWV0aGluZyBtb3JlICh0YWJzLCBwcm9maWxlKVxyXG4gIC8vIGFuZCByZW1vdmUgaWYgcG9zc2libGUgb3Igb25seSBvbiB0aGUgY29uY3JldGUgY2FzZXMuXHJcbiAgaWYgKCEvXFwvZGFzaGJvYXJkXFwvL2kudGVzdChsb2NhdGlvbikpXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgJCgnaHRtbCxib2R5Jykuc2Nyb2xsVG9wKDApOyB9LCAxKTtcclxufSk7XHJcbiQoZnVuY3Rpb24gKCkge1xyXG5cclxuICBwcm92aWRlcldlbGNvbWUuc2hvdygpO1xyXG5cclxuICAvLyBQbGFjZWhvbGRlciBwb2x5ZmlsbFxyXG4gIExDLnBsYWNlSG9sZGVyKCk7XHJcblxyXG4gIC8vIEF1dG9mb2N1cyBwb2x5ZmlsbFxyXG4gIExDLmF1dG9Gb2N1cygpO1xyXG5cclxuICAvLyBHZW5lcmljIHNjcmlwdCBmb3IgZW5oYW5jZWQgdG9vbHRpcHMgYW5kIGVsZW1lbnQgZGVzY3JpcHRpb25zXHJcbiAgTEMuaW5pdFRvb2x0aXBzKCk7XHJcblxyXG4gIGFqYXhGb3Jtcy5pbml0KCk7XHJcblxyXG4gIHdlbGNvbWVQb3B1cC5pbml0KCk7XHJcblxyXG4gIC8vIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyBmb3Igc29tZSBsaW5rcyB0aGF0IGJ5IGRlZmF1bHQgb3BlbiBhIG5ldyB0YWI6XHJcbiAgZmFxc1BvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gIGFjY291bnRQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuICBsZWdhbFBvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG5cclxuICAvLyBPbGQgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbiAgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuaW5pdChMY1VybC5MYW5nUGF0aCk7XHJcbiAgLy8gTmV3IGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG4gIGF2YWlsYWJpbGl0eUNhbGVuZGFyLldlZWtseS5lbmFibGVBbGwoKTtcclxuXHJcbiAgcG9wdXAuY29ubmVjdEFjdGlvbigpO1xyXG5cclxuICAvLyBEYXRlIFBpY2tlclxyXG4gIExDLmRhdGVQaWNrZXIuaW5pdCgpO1xyXG5cclxuICAvKiBBdXRvIGNhbGN1bGF0ZSB0YWJsZSBpdGVtcyB0b3RhbCAocXVhbnRpdHkqdW5pdHByaWNlPWl0ZW0tdG90YWwpIHNjcmlwdCAqL1xyXG4gIGF1dG9DYWxjdWxhdGUub25UYWJsZUl0ZW1zKCk7XHJcbiAgYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnkoKTtcclxuXHJcbiAgaGFzQ29uZmlybVN1cHBvcnQub24oKTtcclxuXHJcbiAgcG9zdGFsQ29kZVZhbGlkYXRpb24uaW5pdCh7IGJhc2VVcmw6IExjVXJsLkxhbmdQYXRoIH0pO1xyXG5cclxuICAvLyBUYWJiZWQgaW50ZXJmYWNlXHJcbiAgdGFic0F1dG9sb2FkLmluaXQoVGFiYmVkVVgpO1xyXG4gIFRhYmJlZFVYLmluaXQoKTtcclxuICBUYWJiZWRVWC5mb2N1c0N1cnJlbnRMb2NhdGlvbigpO1xyXG4gIFRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzKCk7XHJcbiAgc2xpZGVyVGFicy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgdGFiYmVkV2l6YXJkLmluaXQoVGFiYmVkVVgsIHtcclxuICAgIGxvYWRpbmdEZWxheTogZ0xvYWRpbmdSZXRhcmRcclxuICB9KTtcclxuXHJcbiAgdGFiYmVkTm90aWZpY2F0aW9ucy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgYXV0b2ZpbGxTdWJtZW51KCk7XHJcblxyXG4gIC8vIFRPRE86ICdsb2FkSGFzaEJhbmcnIGN1c3RvbSBldmVudCBpbiB1c2U/XHJcbiAgLy8gSWYgdGhlIGhhc2ggdmFsdWUgZm9sbG93IHRoZSAnaGFzaCBiYW5nJyBjb252ZW50aW9uLCBsZXQgb3RoZXJcclxuICAvLyBzY3JpcHRzIGRvIHRoZWlyIHdvcmsgdGhyb3VnaHQgYSAnbG9hZEhhc2hCYW5nJyBldmVudCBoYW5kbGVyXHJcbiAgaWYgKC9eIyEvLnRlc3Qod2luZG93LmxvY2F0aW9uLmhhc2gpKVxyXG4gICAgJChkb2N1bWVudCkudHJpZ2dlcignbG9hZEhhc2hCYW5nJywgd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpKTtcclxuXHJcbiAgLy8gUmVsb2FkIGJ1dHRvbnNcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnJlbG9hZC1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBHZW5lcmljIGFjdGlvbiB0byBjYWxsIGxjLmpxdWVyeSAncmVsb2FkJyBmdW5jdGlvbiBmcm9tIGFuIGVsZW1lbnQgaW5zaWRlIGl0c2VsZi5cclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAkdC5jbG9zZXN0KCR0LmRhdGEoJ3JlbG9hZC10YXJnZXQnKSkucmVsb2FkKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8qIEVuYWJsZSBmb2N1cyB0YWIgb24gZXZlcnkgaGFzaCBjaGFuZ2UsIG5vdyB0aGVyZSBhcmUgdHdvIHNjcmlwdHMgbW9yZSBzcGVjaWZpYyBmb3IgdGhpczpcclxuICAqIG9uZSB3aGVuIHBhZ2UgbG9hZCAod2hlcmU/KSxcclxuICAqIGFuZCBhbm90aGVyIG9ubHkgZm9yIGxpbmtzIHdpdGggJ3RhcmdldC10YWInIGNsYXNzLlxyXG4gICogTmVlZCBiZSBzdHVkeSBpZiBzb21ldGhpbmcgb2YgdGhlcmUgbXVzdCBiZSByZW1vdmVkIG9yIGNoYW5nZWQuXHJcbiAgKiBUaGlzIGlzIG5lZWRlZCBmb3Igb3RoZXIgYmVoYXZpb3JzIHRvIHdvcmsuICovXHJcbiAgLy8gT24gdGFyZ2V0LXRhYiBsaW5rc1xyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhLnRhcmdldC10YWInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgdGhlcmVJc1RhYiA9IFRhYmJlZFVYLmdldFRhYigkKHRoaXMpLmF0dHIoJ2hyZWYnKSk7XHJcbiAgICBpZiAodGhlcmVJc1RhYikge1xyXG4gICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIC8vIE9uIGhhc2ggY2hhbmdlXHJcbiAgaWYgKCQuZm4uaGFzaGNoYW5nZSlcclxuICAgICQod2luZG93KS5oYXNoY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgaWYgKCEvXiMhLy50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICAgICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgaWYgKHRoZXJlSXNUYWIpXHJcbiAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIC8vIEhPTUUgUEFHRSAvIFNFQVJDSCBTVFVGRlxyXG4gIGhvbWVQYWdlLmluaXQoKTtcclxuXHJcbiAgLy8gVmFsaWRhdGlvbiBhdXRvIHNldHVwIGZvciBwYWdlIHJlYWR5IGFuZCBhZnRlciBldmVyeSBhamF4IHJlcXVlc3RcclxuICAvLyBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGZvcm0gaW4gdGhlIHBhZ2UuXHJcbiAgLy8gVGhpcyBhdm9pZCB0aGUgbmVlZCBmb3IgZXZlcnkgcGFnZSB3aXRoIGZvcm0gdG8gZG8gdGhlIHNldHVwIGl0c2VsZlxyXG4gIC8vIGFsbW9zdCBmb3IgbW9zdCBvZiB0aGUgY2FzZS5cclxuICBmdW5jdGlvbiBhdXRvU2V0dXBWYWxpZGF0aW9uKCkge1xyXG4gICAgaWYgKCQoZG9jdW1lbnQpLmhhcygnZm9ybScpLmxlbmd0aClcclxuICAgICAgdmFsaWRhdGlvbkhlbHBlci5zZXR1cCgnZm9ybScpO1xyXG4gIH1cclxuICBhdXRvU2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgJChkb2N1bWVudCkuYWpheENvbXBsZXRlKGF1dG9TZXR1cFZhbGlkYXRpb24pO1xyXG5cclxuICAvLyBUT0RPOiB1c2VkIHNvbWUgdGltZT8gc3RpbGwgcmVxdWlyZWQgdXNpbmcgbW9kdWxlcz9cclxuICAvKlxyXG4gICogQ29tbXVuaWNhdGUgdGhhdCBzY3JpcHQuanMgaXMgcmVhZHkgdG8gYmUgdXNlZFxyXG4gICogYW5kIHRoZSBjb21tb24gTEMgbGliIHRvby5cclxuICAqIEJvdGggYXJlIGVuc3VyZWQgdG8gYmUgcmFpc2VkIGV2ZXIgYWZ0ZXIgcGFnZSBpcyByZWFkeSB0b28uXHJcbiAgKi9cclxuICAkKGRvY3VtZW50KVxyXG4gICAgLnRyaWdnZXIoJ2xjU2NyaXB0UmVhZHknKVxyXG4gICAgLnRyaWdnZXIoJ2xjTGliUmVhZHknKTtcclxufSk7IiwiLyoqKioqIEFWQUlMQUJJTElUWSBDQUxFTkRBUiBXSURHRVQgKioqKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4uL0xDL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9kYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcnKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0KGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY2FsZW5kYXItY29udHJvbHMgLmFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5oYXNDbGFzcygnem9vbS1hY3Rpb24nKSkge1xyXG4gICAgICAgICAgICAvLyBEbyB6b29tXHJcbiAgICAgICAgICAgIHZhciBjID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpLmZpbmQoJy5jYWxlbmRhcicpLmNsb25lKCk7XHJcbiAgICAgICAgICAgIGMuY3NzKCdmb250LXNpemUnLCAnMnB4Jyk7XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSAkdC5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAgICAgYy5kYXRhKCdwb3B1cC1jb250YWluZXInLCB0YWIpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIHRhYiwgJ2F2YWlsYWJpbGl0eS1jYWxlbmRhcicsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIC8vIE5vdGhpbmcgbW9yZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5hdmlnYXRlIGNhbGVuZGFyXHJcbiAgICAgICAgdmFyIG5leHQgPSAkdC5oYXNDbGFzcygnbmV4dC13ZWVrLWFjdGlvbicpO1xyXG4gICAgICAgIHZhciBjb250ID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpO1xyXG4gICAgICAgIHZhciBjYWxjb250ID0gY29udC5jaGlsZHJlbignLmNhbGVuZGFyLWNvbnRhaW5lcicpO1xyXG4gICAgICAgIHZhciBjYWwgPSBjYWxjb250LmNoaWxkcmVuKCcuY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsaW5mbyA9IGNvbnQuZmluZCgnLmNhbGVuZGFyLWluZm8nKTtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKGNhbC5kYXRhKCdzaG93ZWQtZGF0ZScpKTtcclxuICAgICAgICB2YXIgdXNlcklkID0gY2FsLmRhdGEoJ3VzZXItaWQnKTtcclxuICAgICAgICBpZiAobmV4dClcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgNyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgLSA3KTtcclxuICAgICAgICB2YXIgc3RyZGF0ZSA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKTtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArIFwiUHJvZmlsZS8kQXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQvV2Vlay9cIiArIGVuY29kZVVSSUNvbXBvbmVudChzdHJkYXRlKSArIFwiLz9Vc2VySUQ9XCIgKyB1c2VySWQ7XHJcbiAgICAgICAgY2FsY29udC5yZWxvYWQodXJsLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIGdldCB0aGUgbmV3IG9iamVjdDpcclxuICAgICAgICAgICAgdmFyIGNhbCA9ICQoJy5jYWxlbmRhcicsIHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLnllYXItd2VlaycpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC13ZWVrJykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5maXJzdC13ZWVrLWRheScpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC1maXJzdC1kYXknKSk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLmxhc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtbGFzdC1kYXknKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBGQVFzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBmYXFzQmFzZVVybCA9ICdIZWxwQ2VudGVyLyRGQVFzJztcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICBmYXFzQmFzZVVybCA9IChiYXNlVXJsIHx8ICcvJykgKyBmYXFzQmFzZVVybDtcclxuXHJcbiAgLy8gRW5hYmxlIEZBUXMgbGlua3MgaW4gcG9wdXBcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYVtocmVmfD1cIiNGQVFzXCJdJywgcG9wdXBGYXFzKTtcclxuXHJcbiAgLy8gQXV0byBvcGVuIGN1cnJlbnQgZG9jdW1lbnQgbG9jYXRpb24gaWYgaGFzaCBpcyBhIEZBUSBsaW5rXHJcbiAgaWYgKC9eI0ZBUXMvaS50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICBwb3B1cEZhcXMobG9jYXRpb24uaGFzaCk7XHJcbiAgfVxyXG5cclxuICAvLyByZXR1cm4gYXMgdXRpbGl0eVxyXG4gIHJldHVybiBwb3B1cEZhcXM7XHJcbn07XHJcblxyXG4vKiBQYXNzIGEgRmFxcyBAdXJsIG9yIHVzZSBhcyBhIGxpbmsgaGFuZGxlciB0byBvcGVuIHRoZSBGQVEgaW4gYSBwb3B1cFxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdXBGYXFzKHVybCkge1xyXG4gIHVybCA9IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcclxuXHJcbiAgdmFyIHVybHBhcnRzID0gdXJsLnNwbGl0KCctJyk7XHJcblxyXG4gIGlmICh1cmxwYXJ0c1swXSAhPSAnI0ZBUXMnKSB7XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdUaGUgVVJMIGlzIG5vdCBhIEZBUSB1cmwgKGRvZXNuXFwndCBzdGFydHMgd2l0aCAjRkFRcy0pJywgdXJsKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgdmFyIHVybHNlY3Rpb24gPSB1cmxwYXJ0cy5sZW5ndGggPiAxID8gdXJscGFydHNbMV0gOiAnJztcclxuXHJcbiAgaWYgKHVybHNlY3Rpb24pIHtcclxuICAgIHZhciBwdXAgPSBwb3B1cChmYXFzQmFzZVVybCArIHVybHNlY3Rpb24sICdsYXJnZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGQgPSAkKHVybCksXHJcbiAgICAgICAgcGVsID0gcHVwLmdldENvbnRlbnRFbGVtZW50KCk7XHJcbiAgICAgIHBlbC5zY3JvbGxUb3AocGVsLnNjcm9sbFRvcCgpICsgZC5wb3NpdGlvbigpLnRvcCAtIDUwKTtcclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZC5lZmZlY3QoXCJoaWdobGlnaHRcIiwge30sIDIwMDApO1xyXG4gICAgICB9LCA0MDApO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufSIsIi8qIElOSVQgKi9cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gTG9jYXRpb24ganMtZHJvcGRvd25cclxuICAgIHZhciBzID0gJCgnI3NlYXJjaC1sb2NhdGlvbicpO1xyXG4gICAgcy5wcm9wKCdyZWFkb25seScsIHRydWUpO1xyXG4gICAgcy5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgIHNvdXJjZTogTEMuc2VhcmNoTG9jYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBhdXRvRm9jdXM6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIG1pbkxlbmd0aDogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgc2VsZWN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHMub24oJ2ZvY3VzIGNsaWNrJywgZnVuY3Rpb24gKCkgeyBzLmF1dG9jb21wbGV0ZSgnc2VhcmNoJywgJycpOyB9KTtcclxuXHJcbiAgICAvKiBQb3NpdGlvbnMgYXV0b2NvbXBsZXRlICovXHJcbiAgICB2YXIgcG9zaXRpb25zQXV0b2NvbXBsZXRlID0gJCgnI3NlYXJjaC1zZXJ2aWNlJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgICAgICAgLy8kKHRoaXMpLnZhbCh1aS5pdGVtLmxhYmVsKTtcclxuICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICAgICAvLyQodGhpcykudmFsKHVpLml0ZW0ubGFiZWwpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBMb2FkIGFsbCBwb3NpdGlvbnMgaW4gYmFja2dyb3VuZCB0byByZXBsYWNlIHRoZSBhdXRvY29tcGxldGUgc291cmNlIChhdm9pZGluZyBtdWx0aXBsZSwgc2xvdyBsb29rLXVwcylcclxuICAgIC8qJC5nZXRKU09OKExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdvcHRpb24nLCAnc291cmNlJywgZGF0YSk7XHJcbiAgICB9XHJcbiAgICApOyovXHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIExlZ2FsIHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJy52aWV3LXByaXZhY3ktcG9saWN5JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBvcHVwKGJhc2VVcmwgKyAnSGVscENlbnRlci8kUHJpdmFjeVBvbGljeS8nLCAnbGFyZ2UnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcudmlldy10ZXJtcy1vZi11c2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcG9wdXAoYmFzZVVybCArICdIZWxwQ2VudGVyLyRUZXJtc09mVXNlLycsICdsYXJnZScpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4qIFByb3ZpZGVyIFdlbGNvbWUgcGFnZVxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgU2ltcGxlU2xpZGVyID0gcmVxdWlyZSgnTEMvU2ltcGxlU2xpZGVyJyk7XHJcblxyXG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbiBwcm92aWRlcldlbGNvbWUoKSB7XHJcbiAgJCgnLlByb3ZpZGVyV2VsY29tZSAuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHQgPSAkKHRoaXMpLFxyXG4gICAgICBzbGlkZXIgPSBuZXcgU2ltcGxlU2xpZGVyKHtcclxuICAgICAgICBlbGVtZW50OiB0LFxyXG4gICAgICAgIHNlbGVjdG9yczoge1xyXG4gICAgICAgICAgc2xpZGVzOiAnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tc2xpZGVzJyxcclxuICAgICAgICAgIHNsaWRlOiAnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tc2xpZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjdXJyZW50U2xpZGVDbGFzczogJ2pzLWlzQ3VycmVudCcsXHJcbiAgICAgICAgaHJlZlByZWZpeDogJ2dvU2xpZGVfJyxcclxuICAgICAgICAvLyBEdXJhdGlvbiBvZiBlYWNoIHNsaWRlIGluIG1pbGxpc2Vjb25kc1xyXG4gICAgICAgIGR1cmF0aW9uOiAxMDAwXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIC8vIFNsaWRlIHN0ZXBzIGFjdGlvbnMgaW5pdGlhbGx5IGhpZGRlbiwgdmlzaWJsZSBhZnRlciAnc3RhcnQnXHJcbiAgICB2YXIgc2xpZGVzQWN0aW9ucyA9IHQuZmluZCgnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tYWN0aW9ucy1zbGlkZXMnKS5oaWRlKCk7XHJcbiAgICB0LmZpbmQoJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLWFjdGlvbnMtc3RhcnQgLnN0YXJ0LWFjdGlvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJCh0aGlzKS5oaWRlKCk7XHJcbiAgICAgIHNsaWRlc0FjdGlvbnMuZmFkZUluKDEwMDApO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4qIFdlbGNvbWUgcG9wdXBcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gYm9vdHN0cmFwIHRvb2x0aXBzOlxyXG5yZXF1aXJlKCdib290c3RyYXAnKTtcclxuLy9UT0RPIG1vcmUgZGVwZW5kZW5jaWVzP1xyXG5cclxudmFyIGluaXRpYWxpemVkID0gZmFsc2U7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0V2VsY29tZVBvcHVwKCkge1xyXG5cclxuICBleHBvcnRzLmF1dG9TaG93KCk7XHJcblxyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhLnNpZ24tdXAsIGEucmVnaXN0ZXInLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgLy8gUmVtb3ZlIGFueSBvcGVuZWQgcG9wdXAgKGl0IG92ZXJsYXlzIHRoZSB3ZWxjb21lcG9wdXApXHJcbiAgICAkLnVuYmxvY2tVSSgpO1xyXG5cclxuICAgIGV4cG9ydHMuc2hvdygpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxufTtcclxuXHJcbmV4cG9ydHMuYXV0b1Nob3cgPSBmdW5jdGlvbiBhdXRvU2hvd1dlbGNvbWVQb3B1cCgpIHtcclxuICB2YXIgJHdwID0gJCgnI3dlbGNvbWVwb3B1cCcpO1xyXG4gIHZhciAkd28gPSAkKCcjd2VsY29tZS1wb3B1cC1vdmVybGF5Jyk7XHJcblxyXG4gIC8vIFdoZW4gdGhlIHBvcHVwIGlzIGludGVncmF0ZWQgaW4gdGhlIHBhZ2UgaW5zdGVhZCBvZlxyXG4gIC8vIHRoZSBsYXlvdXQsIGV4ZWMgc2hvdyBhbmQgY2xvc2Ugb3JwaGFuIG92ZXJsYXkuXHJcbiAgaWYgKCR3cC5sZW5ndGggJiZcclxuICAgICR3cC5pcygnOnZpc2libGUnKSAmJlxyXG4gICAgJHdwLmNsb3Nlc3QoJyN3ZWxjb21lLXBvcHVwLW92ZXJsYXknKS5sZW5ndGggPT09IDApIHtcclxuICAgICR3by5oaWRlKCk7XHJcbiAgICBleHBvcnRzLnNob3coKTtcclxuICAgIHJldHVybjtcclxuICB9IGVsc2UgaWYgKCR3by5oYXNDbGFzcygnYXV0by1zaG93JykpIHtcclxuICAgIGV4cG9ydHMuc2hvdygpO1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydHMuc2hvdyA9IGZ1bmN0aW9uIHdlbGNvbWVQb3B1cCgpIHtcclxuICB2YXIgYyA9ICQoJyN3ZWxjb21lcG9wdXAnKTtcclxuICBpZiAoYy5sZW5ndGggPT09IDApIHJldHVybjtcclxuXHJcbiAgYy5jbG9zZXN0KCcjd2VsY29tZS1wb3B1cC1vdmVybGF5JykuZmFkZUluKDMwMCk7XHJcblxyXG4gIGlmIChpbml0aWFsaXplZCkgcmV0dXJuO1xyXG4gIGluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgdmFyIHNraXBTdGVwMSA9IGMuaGFzQ2xhc3MoJ3NlbGVjdC1wb3NpdGlvbicpO1xyXG5cclxuICAvLyBJbml0XHJcbiAgaWYgKCFza2lwU3RlcDEpIHtcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSwgLnRlcm1zLCAucG9zaXRpb24tZGVzY3JpcHRpb24nKS5oaWRlKCk7XHJcbiAgfVxyXG4gIGMuZmluZCgnZm9ybScpLmdldCgwKS5yZXNldCgpO1xyXG5cclxuICAvLyBEZXNjcmlwdGlvbiBzaG93LXVwIG9uIGF1dG9jb21wbGV0ZSB2YXJpYXRpb25zXHJcbiAgdmFyIHNob3dQb3NpdGlvbkRlc2NyaXB0aW9uID0ge1xyXG4gICAgLyoqXHJcbiAgICBTaG93IGRlc2NyaXB0aW9uIGluIGEgdGV4dGFyZWEgdW5kZXIgdGhlIHBvc2l0aW9uIHNpbmd1bGFyLFxyXG4gICAgaXRzIHNob3dlZCBvbiBkZW1hbmQuXHJcbiAgICAqKi9cclxuICAgIHRleHRhcmVhOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgIGMuZmluZCgnLnBvc2l0aW9uLWRlc2NyaXB0aW9uJylcclxuICAgICAgLnNsaWRlRG93bignZmFzdCcpXHJcbiAgICAgIC5maW5kKCd0ZXh0YXJlYScpLnZhbCh1aS5pdGVtLmRlc2NyaXB0aW9uKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgIFNob3cgZGVzY3JpcHRpb24gaW4gYSB0b29sdGlwIHRoYXQgY29tZXMgZnJvbSB0aGUgcG9zaXRpb24gc2luZ3VsYXJcclxuICAgIGZpZWxkXHJcbiAgICAqKi9cclxuICAgIHRvb2x0aXA6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgLy8gSXQgbmVlZHMgdG8gYmUgZGVzdHJveWVkIChubyBwcm9ibGVtIHRoZSBmaXJzdCB0aW1lKVxyXG4gICAgICAvLyB0byBnZXQgaXQgdXBkYXRlZCBvbiBzdWNjZXNpdmUgYXR0ZW1wdHNcclxuICAgICAgdmFyIGVsID0gJCh0aGlzKTtcclxuICAgICAgZWxcclxuICAgICAgLnBvcG92ZXIoJ2Rlc3Ryb3knKVxyXG4gICAgICAucG9wb3Zlcih7XHJcbiAgICAgICAgdGl0bGU6ICdEb2VzIHRoaXMgc291bmQgbGlrZSB5b3U/JyxcclxuICAgICAgICBjb250ZW50OiB1aS5pdGVtLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgIHRyaWdnZXI6ICdmb2N1cycsXHJcbiAgICAgICAgcGxhY2VtZW50OiAnbGVmdCdcclxuICAgICAgfSlcclxuICAgICAgLnBvcG92ZXIoJ3Nob3cnKVxyXG4gICAgICAvLyBIaWRlIG9uIHBvc3NpYmxlIHBvc2l0aW9uIG5hbWUgY2hhbmdlIHRvIGF2b2lkIGNvbmZ1c2lvbnNcclxuICAgICAgLy8gKHdlIGNhbid0IHVzZSBvbi1jaGFuZ2UsIG5lZWQgdG8gYmUga2V5cHJlc3M7IGl0cyBuYW1lc3BhY2VkXHJcbiAgICAgIC8vIHRvIGxldCBvZmYgYW5kIG9uIGV2ZXJ5IHRpbWUgdG8gYXZvaWQgbXVsdGlwbGUgaGFuZGxlciByZWdpc3RyYXRpb25zKVxyXG4gICAgICAub2ZmKCdrZXlwcmVzcy5kZXNjcmlwdGlvbi10b29sdGlwJylcclxuICAgICAgLm9uKCdrZXlwcmVzcy5kZXNjcmlwdGlvbi10b29sdGlwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGVsLnBvcG92ZXIoJ2hpZGUnKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8vIFJlLWVuYWJsZSBhdXRvY29tcGxldGU6XHJcbiAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IGMuZmluZCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7IH0sIDUwMCk7XHJcbiAgZnVuY3Rpb24gc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzZWxldENhbGxiYWNrKSB7XHJcbiAgICBjLmZpbmQoJ1tuYW1lPWpvYnRpdGxlXScpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICBtaW5MZW5ndGg6IDAsXHJcbiAgICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgIC8vIE5vIHZhbHVlLCBubyBhY3Rpb24gOihcclxuICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnZhbHVlKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2F2ZSB0aGUgaWQgKHZhbHVlKSBpbiB0aGUgaGlkZGVuIGVsZW1lbnRcclxuICAgICAgICBjLmZpbmQoJ1tuYW1lPXBvc2l0aW9uaWRdJykudmFsKHVpLml0ZW0udmFsdWUpO1xyXG5cclxuICAgICAgICBzZWxldENhbGxiYWNrLmNhbGwodGhpcywgZXZlbnQsIHVpKTtcclxuXHJcbiAgICAgICAgLy8gV2Ugd2FudCB0byBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH0sXHJcbiAgICAgIGZvY3VzOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbiAgc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzaG93UG9zaXRpb25EZXNjcmlwdGlvbi50b29sdGlwKTtcclxuICBjLmZpbmQoJyN3ZWxjb21lcG9wdXBMb2FkaW5nJykucmVtb3ZlKCk7XHJcblxyXG4gIC8vIEFjdGlvbnNcclxuICBjLm9uKCdjaGFuZ2UnLCAnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGk6bm90KC4nICsgdGhpcy52YWx1ZSArICcpJykuaGlkZSgpO1xyXG4gICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UsIGhlYWRlciAucHJlc2VudGF0aW9uJykuc2xpZGVVcCgnZmFzdCcpO1xyXG4gICAgYy5maW5kKCcudGVybXMsIC5wcm9maWxlLWRhdGEnKS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuICAgIC8vIFRlcm1zIG9mIHVzZSBkaWZmZXJlbnQgZm9yIHByb2ZpbGUgdHlwZVxyXG4gICAgaWYgKHRoaXMudmFsdWUgPT0gJ2N1c3RvbWVyJylcclxuICAgICAgYy5maW5kKCdhLnRlcm1zLW9mLXVzZScpLmRhdGEoJ3Rvb2x0aXAtdXJsJywgbnVsbCk7XHJcbiAgICAvLyBDaGFuZ2UgZmFjZWJvb2sgcmVkaXJlY3QgbGlua1xyXG4gICAgdmFyIGZiYyA9IGMuZmluZCgnLmZhY2Vib29rLWNvbm5lY3QnKTtcclxuICAgIHZhciBhZGRSZWRpcmVjdCA9ICdjdXN0b21lcnMnO1xyXG4gICAgaWYgKHRoaXMudmFsdWUgPT0gJ3Byb3ZpZGVyJylcclxuICAgICAgYWRkUmVkaXJlY3QgPSAncHJvdmlkZXJzJztcclxuICAgIGZiYy5kYXRhKCdyZWRpcmVjdCcsIGZiYy5kYXRhKCdyZWRpcmVjdCcpICsgYWRkUmVkaXJlY3QpO1xyXG4gICAgZmJjLmRhdGEoJ3Byb2ZpbGUnLCB0aGlzLnZhbHVlKTtcclxuXHJcbiAgICAvLyBTZXQgdmFsaWRhdGlvbi1yZXF1aXJlZCBmb3IgZGVwZW5kaW5nIG9mIHByb2ZpbGUtdHlwZSBmb3JtIGVsZW1lbnRzOlxyXG4gICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpLicgKyB0aGlzLnZhbHVlICsgJyBpbnB1dDpub3QoW2RhdGEtdmFsXSk6bm90KFt0eXBlPWhpZGRlbl0pJylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cignZGF0YS12YWwtcmVxdWlyZWQnLCAnJylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cignZGF0YS12YWwnLCB0cnVlKTtcclxuICAgIExDLnNldHVwVmFsaWRhdGlvbigpO1xyXG4gIH0pO1xyXG4gIGMub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0uYWpheCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIHNldHVwUG9zaXRpb25BdXRvY29tcGxldGUoc2hvd1Bvc2l0aW9uRGVzY3JpcHRpb24udG9vbHRpcCk7XHJcbiAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdOmNoZWNrZWQnKS5jaGFuZ2UoKTtcclxuICB9KTtcclxuXHJcbiAgLy8gSWYgcHJvZmlsZSB0eXBlIGlzIHByZWZpbGxlZCBieSByZXF1ZXN0OlxyXG4gIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV06Y2hlY2tlZCcpLmNoYW5nZSgpO1xyXG59O1xyXG4iLCJcblxuXG4vKlxuKiBAdmVyc2lvbiAgMC41LjBcbiogQGF1dGhvciAgIExhdXJpIFJvb2RlbiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9saXRlanMvZGF0ZS1mb3JtYXQtbGl0ZVxuKiBAbGljZW5zZSAgTUlUIExpY2Vuc2UgIC0gaHR0cDovL2xhdXJpLnJvb2Rlbi5lZS9taXQtbGljZW5zZS50eHRcbiovXG5cblxuXG4hZnVuY3Rpb24oRGF0ZSwgcHJvdG8pIHtcblx0dmFyIG1hc2tSZSA9IC8oW1wiJ10pKCg/OlteXFxcXF18XFxcXC4pKj8pXFwxfFlZWVl8KFtNRF0pXFwzXFwzKFxcMz8pfFNTfChbWU1ESGhtc1ddKShcXDU/KXxbdVVBWlN3b10vZ1xuXHQsIHllYXJGaXJzdFJlID0gLyhcXGR7NH0pWy0uXFwvXShcXGRcXGQ/KVstLlxcL10oXFxkXFxkPykvXG5cdCwgZGF0ZUZpcnN0UmUgPSAvKFxcZFxcZD8pWy0uXFwvXShcXGRcXGQ/KVstLlxcL10oXFxkezR9KS9cblx0LCB0aW1lUmUgPSAvKFxcZFxcZD8pOihcXGRcXGQpOj8oXFxkXFxkKT9cXC4/KFxcZHszfSk/KD86XFxzKig/OihhKXwocCkpXFwuP21cXC4/KT8oXFxzKig/Olp8R01UfFVUQyk/KD86KFstK11cXGRcXGQpOj8oXFxkXFxkKT8pPyk/L2lcblx0LCB3b3JkUmUgPSAvLlthLXpdKy9nXG5cdCwgdW5lc2NhcGVSZSA9IC9cXFxcKC4pL2dcblx0Ly8sIGlzb0RhdGVSZSA9IC8oXFxkezR9KVstLlxcL11XKFxcZFxcZD8pWy0uXFwvXShcXGQpL1xuXHRcblxuXHQvLyBJU08gODYwMSBzcGVjaWZpZXMgbnVtZXJpYyByZXByZXNlbnRhdGlvbnMgb2YgZGF0ZSBhbmQgdGltZS5cblx0Ly9cblx0Ly8gVGhlIGludGVybmF0aW9uYWwgc3RhbmRhcmQgZGF0ZSBub3RhdGlvbiBpc1xuXHQvLyBZWVlZLU1NLUREXG5cdC8vXG5cdC8vIFRoZSBpbnRlcm5hdGlvbmFsIHN0YW5kYXJkIG5vdGF0aW9uIGZvciB0aGUgdGltZSBvZiBkYXkgaXNcblx0Ly8gaGg6bW06c3Ncblx0Ly9cblx0Ly8gVGltZSB6b25lXG5cdC8vXG5cdC8vIFRoZSBzdHJpbmdzICtoaDptbSwgK2hobW0sIG9yICtoaCAoYWhlYWQgb2YgVVRDKVxuXHQvLyAtaGg6bW0sIC1oaG1tLCBvciAtaGggKHRpbWUgem9uZXMgd2VzdCBvZiB0aGUgemVybyBtZXJpZGlhbiwgd2hpY2ggYXJlIGJlaGluZCBVVEMpXG5cdC8vXG5cdC8vIDEyOjAwWiA9IDEzOjAwKzAxOjAwID0gMDcwMC0wNTAwXG5cdFxuXHREYXRlW3Byb3RvXS5mb3JtYXQgPSBmdW5jdGlvbihtYXNrKSB7XG5cdFx0bWFzayA9IERhdGUubWFza3NbbWFza10gfHwgbWFzayB8fCBEYXRlLm1hc2tzW1wiZGVmYXVsdFwiXVxuXG5cdFx0dmFyIHNlbGYgPSB0aGlzXG5cdFx0LCBnZXQgPSBcImdldFwiICsgKG1hc2suc2xpY2UoMCw0KSA9PSBcIlVUQzpcIiA/IChtYXNrPW1hc2suc2xpY2UoNCksIFwiVVRDXCIpOlwiXCIpXG5cblx0XHRyZXR1cm4gbWFzay5yZXBsYWNlKG1hc2tSZSwgZnVuY3Rpb24obWF0Y2gsIHF1b3RlLCB0ZXh0LCBNRCwgTUQ0LCBzaW5nbGUsIHBhZCkge1xuXHRcdFx0dGV4dCA9IHNpbmdsZSA9PSBcIllcIiAgID8gc2VsZltnZXQgKyBcIkZ1bGxZZWFyXCJdKCkgJSAxMDBcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJZWVlZXCIgPyBzZWxmW2dldCArIFwiRnVsbFllYXJcIl0oKVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJNXCIgICA/IHNlbGZbZ2V0ICsgXCJNb250aFwiXSgpKzFcblx0XHRcdFx0IDogTUQgICAgID09IFwiTVwiID8gRGF0ZS5tb250aE5hbWVzWyBzZWxmW2dldCArIFwiTW9udGhcIl0oKSsoTUQ0ID8gMTIgOiAwKSBdXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcIkRcIiAgID8gc2VsZltnZXQgKyBcIkRhdGVcIl0oKVxuXHRcdFx0XHQgOiBNRCAgICAgPT0gXCJEXCIgPyBEYXRlLmRheU5hbWVzWyBzZWxmW2dldCArIFwiRGF5XCJdKCkgKyAoTUQ0ID8gNzowICkgXVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJIXCIgICA/IHNlbGZbZ2V0ICsgXCJIb3Vyc1wiXSgpICUgMTIgfHwgMTJcblx0XHRcdFx0IDogc2luZ2xlID09IFwiaFwiICAgPyBzZWxmW2dldCArIFwiSG91cnNcIl0oKVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJtXCIgICA/IHNlbGZbZ2V0ICsgXCJNaW51dGVzXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwic1wiICAgPyBzZWxmW2dldCArIFwiU2Vjb25kc1wiXSgpXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiU1wiICAgID8gc2VsZltnZXQgKyBcIk1pbGxpc2Vjb25kc1wiXSgpXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiU1NcIiAgID8gKHF1b3RlID0gc2VsZltnZXQgKyBcIk1pbGxpc2Vjb25kc1wiXSgpLCBxdW90ZSA+IDk5ID8gcXVvdGUgOiAocXVvdGUgPiA5ID8gXCIwXCIgOiBcIjAwXCIgKSArIHF1b3RlKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcInVcIiAgICA/IChzZWxmLzEwMDApPj4+MFxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlVcIiAgICA/ICtzZWxmXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiQVwiICAgID8gRGF0ZVtzZWxmW2dldCArIFwiSG91cnNcIl0oKSA+IDExID8gXCJwbVwiIDogXCJhbVwiXVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlpcIiAgICA/IFwiR01UIFwiICsgKC1zZWxmLmdldFRpbWV6b25lT2Zmc2V0KCkvNjApXG5cdFx0XHRcdCA6IG1hdGNoID09IFwid1wiICAgID8gc2VsZltnZXQgKyBcIkRheVwiXSgpIHx8IDdcblx0XHRcdFx0IDogc2luZ2xlID09IFwiV1wiICAgPyAocXVvdGUgPSBuZXcgRGF0ZSgrc2VsZiArICgoNCAtIChzZWxmW2dldCArIFwiRGF5XCJdKCl8fDcpKSAqIDg2NDAwMDAwKSksIE1hdGguY2VpbCgoKHF1b3RlLmdldFRpbWUoKS1xdW90ZVtcInNcIiArIGdldC5zbGljZSgxKSArIFwiTW9udGhcIl0oMCwxKSkgLyA4NjQwMDAwMCArIDEgKSAvIDcpIClcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJvXCIgICAgPyBuZXcgRGF0ZSgrc2VsZiArICgoNCAtIChzZWxmW2dldCArIFwiRGF5XCJdKCl8fDcpKSAqIDg2NDAwMDAwKSlbZ2V0ICsgXCJGdWxsWWVhclwiXSgpXG5cdFx0XHRcdCA6IHF1b3RlICAgICAgICAgICA/IHRleHQucmVwbGFjZSh1bmVzY2FwZVJlLCBcIiQxXCIpXG5cdFx0XHRcdCA6IG1hdGNoXG5cdFx0XHRyZXR1cm4gcGFkICYmIHRleHQgPCAxMCA/IFwiMFwiK3RleHQgOiB0ZXh0XG5cdFx0fSlcblx0fVxuXG5cdERhdGUuYW0gPSBcIkFNXCJcblx0RGF0ZS5wbSA9IFwiUE1cIlxuXG5cdERhdGUubWFza3MgPSB7XCJkZWZhdWx0XCI6XCJEREQgTU1NIEREIFlZWVkgaGg6bW06c3NcIixcImlzb1V0Y0RhdGVUaW1lXCI6J1VUQzpZWVlZLU1NLUREXCJUXCJoaDptbTpzc1wiWlwiJ31cblx0RGF0ZS5tb250aE5hbWVzID0gXCJKYW5GZWJNYXJBcHJNYXlKdW5KdWxBdWdTZXBPY3ROb3ZEZWNKYW51YXJ5RmVicnVhcnlNYXJjaEFwcmlsTWF5SnVuZUp1bHlBdWd1c3RTZXB0ZW1iZXJPY3RvYmVyTm92ZW1iZXJEZWNlbWJlclwiLm1hdGNoKHdvcmRSZSlcblx0RGF0ZS5kYXlOYW1lcyA9IFwiU3VuTW9uVHVlV2VkVGh1RnJpU2F0U3VuZGF5TW9uZGF5VHVlc2RheVdlZG5lc2RheVRodXJzZGF5RnJpZGF5U2F0dXJkYXlcIi5tYXRjaCh3b3JkUmUpXG5cblx0Ly8qL1xuXG5cblx0Lypcblx0KiAvLyBJbiBDaHJvbWUgRGF0ZS5wYXJzZShcIjAxLjAyLjIwMDFcIikgaXMgSmFuXG5cdCogbiA9ICtzZWxmIHx8IERhdGUucGFyc2Uoc2VsZikgfHwgXCJcIitzZWxmO1xuXHQqL1xuXG5cdFN0cmluZ1twcm90b10uZGF0ZSA9IE51bWJlcltwcm90b10uZGF0ZSA9IGZ1bmN0aW9uKGZvcm1hdCkge1xuXHRcdHZhciBtLCB0ZW1wXG5cdFx0LCBkID0gbmV3IERhdGVcblx0XHQsIG4gPSArdGhpcyB8fCBcIlwiK3RoaXNcblxuXHRcdGlmIChpc05hTihuKSkge1xuXHRcdFx0Ly8gQmlnIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSB5ZWFyLCBlZy4gMjAxMS0wMS0zMVxuXHRcdFx0aWYgKG0gPSBuLm1hdGNoKHllYXJGaXJzdFJlKSkgZC5zZXRGdWxsWWVhcihtWzFdLCBtWzJdLTEsIG1bM10pXG5cblx0XHRcdGVsc2UgaWYgKG0gPSBuLm1hdGNoKGRhdGVGaXJzdFJlKSkge1xuXHRcdFx0XHQvLyBNaWRkbGUgZW5kaWFuIGRhdGUsIHN0YXJ0aW5nIHdpdGggdGhlIG1vbnRoLCBlZy4gMDEvMzEvMjAxMVxuXHRcdFx0XHQvLyBMaXR0bGUgZW5kaWFuIGRhdGUsIHN0YXJ0aW5nIHdpdGggdGhlIGRheSwgZWcuIDMxLjAxLjIwMTFcblx0XHRcdFx0dGVtcCA9IERhdGUubWlkZGxlX2VuZGlhbiA/IDEgOiAyXG5cdFx0XHRcdGQuc2V0RnVsbFllYXIobVszXSwgbVt0ZW1wXS0xLCBtWzMtdGVtcF0pXG5cdFx0XHR9XG5cblx0XHRcdC8vIFRpbWVcblx0XHRcdG0gPSBuLm1hdGNoKHRpbWVSZSkgfHwgWzAsIDAsIDBdXG5cdFx0XHRkLnNldEhvdXJzKCBtWzZdICYmIG1bMV0gPCAxMiA/ICttWzFdKzEyIDogbVs1XSAmJiBtWzFdID09IDEyID8gMCA6IG1bMV0sIG1bMl0sIG1bM118MCwgbVs0XXwwKVxuXHRcdFx0Ly8gVGltZXpvbmVcblx0XHRcdGlmIChtWzddKSB7XG5cdFx0XHRcdGQuc2V0VGltZShkLSgoZC5nZXRUaW1lem9uZU9mZnNldCgpICsgKG1bOF18MCkqNjAgKyAoKG1bOF08MD8tMToxKSoobVs5XXwwKSkpKjYwMDAwKSlcblx0XHRcdH1cblx0XHR9IGVsc2UgZC5zZXRUaW1lKCBuIDwgNDI5NDk2NzI5NiA/IG4gKiAxMDAwIDogbiApXG5cdFx0cmV0dXJuIGZvcm1hdCA/IGQuZm9ybWF0KGZvcm1hdCkgOiBkXG5cdH1cblxufShEYXRlLCBcInByb3RvdHlwZVwiKVxuXG5cblxuXG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
