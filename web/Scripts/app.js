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
},{"./Component":3,"./DataSource":4,"./extend":6,"events":102}],3:[function(require,module,exports){
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
module.exports=require('4b8n5S');
},{}],"4b8n5S":[function(require,module,exports){
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
},{"./LcUrl":10,"./blockPresets":49,"./loader":76,"./popup":82,"./redirectTo":84}],10:[function(require,module,exports){
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
},{"./mathUtils":77}],12:[function(require,module,exports){
// http://stackoverflow.com/questions/2593637/how-to-escape-regular-expression-in-javascript
RegExp.quote = function (str) {
  return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

},{}],"LC/SimpleSlider":[function(require,module,exports){
module.exports=require('BhQbxR');
},{}],"BhQbxR":[function(require,module,exports){
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
},{}],"NBNrUh":[function(require,module,exports){
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
},{}],"StringFormat":[function(require,module,exports){
module.exports=require('NBNrUh');
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
},{"./jquery.reload":72}],19:[function(require,module,exports){
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

},{"./changesNotification":"bQChrF","./smoothBoxBlock":"TinZqq"}],20:[function(require,module,exports){
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
},{"./jquery.hasScrollBar":69}],21:[function(require,module,exports){
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
},{"./ajaxCallbacks":"g22qGq","./blockPresets":49,"./changesNotification":"bQChrF","./popup":82,"./redirectTo":84,"./validationHelper":"UpLaI0"}],"BE/3cj":[function(require,module,exports){
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
module.exports=require('BE/3cj');
},{}],"LC/TimeSpanExtra":[function(require,module,exports){
module.exports=require('so8zgW');
},{}],"so8zgW":[function(require,module,exports){
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

},{"./TimeSpan":"BE/3cj","./mathUtils":77}],27:[function(require,module,exports){
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

},{"./TimeSpan":"BE/3cj","./mathUtils":77,"./tooltips":"3mmOyL"}],"g22qGq":[function(require,module,exports){
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
},{"./changesNotification":"bQChrF","./createIframe":52,"./moveFocusTo":"lyuNFv","./popup":82,"./redirectTo":84,"./smoothBoxBlock":"TinZqq","./validationHelper":"UpLaI0"}],"LC/ajaxCallbacks":[function(require,module,exports){
module.exports=require('g22qGq');
},{}],"0NFXny":[function(require,module,exports){
/* Forms submitted via AJAX */
var $ = require('jquery'),
    callbacks = require('./ajaxCallbacks'),
    changesNotification = require('./changesNotification'),
    blockPresets = require('./blockPresets'),
    validationHelper = require('./validationHelper'),
    getXPath = require('./getXPath');

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

    var postValidation = ctx.form.data('post-validation');
    var requests = ctx.form.data('xhr-requests') || [];
    ctx.form.data('xhr-requests', requests);

    if (!postValidation) {
        // Check validation
        if (validateForm(ctx) === false) {
            // Validation failed, submit cannot continue, out!
            return false;
        }
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

    // Abort previous requests
    $.each(requests, function (req) {
        if (req && req.abort)
            req.abort();
    });

    // Do the Ajax post
    var request = $.ajax({
        url: action,
        type: 'POST',
        data: data,
        context: ctx,
        success: ajaxFormsSuccessHandler,
        error: ajaxErrorPopupHandler,
        complete: ajaxFormsCompleteHandler
    });

    // Register request
    requests.push(request);
    // Set auto-desregistration
    var reqIndex = requests.length - 1;
    request.always(function () {
        // Delete, not splice, since we need to preserve the order
        delete requests[reqIndex];
    });

    // Do post validation:
    if (postValidation && postValidation !== 'never') {
        request.done(function () {
            validateForm(ctx);
        });
    }

    // Stop normal POST:
    return false;
}

/**
    It performs a post submit on the given form on background,
    without notifications of any kind, just for the instant saving feature.
**/
function doInstantSaving(form, changedElements) {
    form = $(form);
    var action = form.attr('action') || form.data('ajax-fieldset-action') || '';
    var ctx = { form: form, box: form };

    // Notification event to allow scripts to hook additional tasks before send data
    form.trigger('presubmit', [ctx]);

    var data = ctx.form.find(':input').serialize();

    // Do the Ajax post
    var request = $.ajax({
        url: action,
        type: 'POST',
        data: data,
        context: ctx,
        success: function () {
            // Tracked changed elements are saved
            if (changedElements)
                changesNotification.registerSave(form.closest('form').get(0), changedElements);
        }
    });

    var requests = form.data('xhr-requests') || [];
    form.data('xhr-requests', requests);

    // Register request
    requests.push(request);
    // Set auto-desregistration
    var reqIndex = requests.length - 1;
    request.always(function () {
        // Delete, not splice, since we need to preserve the order
        delete requests[reqIndex];
    });

    return request;
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
        onComplete: ajaxFormsCompleteHandler,
        doInstantSaving: doInstantSaving
    };

},{"./ajaxCallbacks":"g22qGq","./blockPresets":49,"./changesNotification":"bQChrF","./getXPath":60,"./validationHelper":"UpLaI0"}],"LC/ajaxForms":[function(require,module,exports){
module.exports=require('0NFXny');
},{}],32:[function(require,module,exports){
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
},{"./numberUtils":80}],33:[function(require,module,exports){
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
},{}],34:[function(require,module,exports){
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
},{}],35:[function(require,module,exports){
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
},{"./objectUtils":45,"LC/dateISO8601":"rgrJsD","date-format-lite":101}],36:[function(require,module,exports){
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

var events = {
    dataChanged: 'dataChanged'
};

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
  monthly.events.emit(events.dataChanged, cell, slot);

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

},{"../CX/LcWidget":5,"../CX/extend":6,"./BookingsNotification":35,"./objectUtils":45,"./utils":46,"LC/dateISO8601":"rgrJsD"}],37:[function(require,module,exports){
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

},{"../CX/LcWidget":5,"../CX/extend":6,"./utils":46,"LC/dateISO8601":"rgrJsD"}],38:[function(require,module,exports){
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
var events = {
    dataChanged: 'dataChanged'
};

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

    that.events.emit(events.dataChanged, cell, slot);
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
},{"../CX/LcWidget":5,"../CX/extend":6,"../jquery.bounds":68,"./clearCurrentSelection":39,"./makeUnselectable":44,"./utils":46,"LC/dateISO8601":"rgrJsD"}],39:[function(require,module,exports){
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
},{}],40:[function(require,module,exports){
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

},{"LC/dateISO8601":"rgrJsD"}],41:[function(require,module,exports){
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
},{}],"qcqtAx":[function(require,module,exports){
/**
  Exposing all the public features and components of availabilityCalendar
**/
exports.Weekly = require('./Weekly');
exports.WorkHours = require('./WorkHours');
exports.Monthly = require('./Monthly');
},{"./Monthly":36,"./Weekly":37,"./WorkHours":38}],"LC/availabilityCalendar":[function(require,module,exports){
module.exports=require('qcqtAx');
},{}],44:[function(require,module,exports){
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
},{}],45:[function(require,module,exports){
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
},{}],46:[function(require,module,exports){
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

},{"./dateUtils":40,"./formatDate":41,"LC/dateISO8601":"rgrJsD"}],"LC/batchEventHandler":[function(require,module,exports){
module.exports=require('hXLJ4a');
},{}],"hXLJ4a":[function(require,module,exports){
/**
    Small utility to wrap a callback/handler function in a timer
    being executed only once (the latest call) inside the timeframe,
    defined by the interval parameter, its just 1 milisecond by default.
    Its useful when an event gets executed
    lots of times too quickly and only 1 execution is wanted to avoid
    hurt performance.
    The default interval of 1 works fine if the event gets raised
    a lot by consecutive code, but if calls are delayed a greater
    interval will be need.
**/
module.exports = function batchEventHandler(cb, interval) {
    var timer;

    return function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            cb.apply(null, arguments);
        }, interval || 1);
    };
};
},{}],49:[function(require,module,exports){
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
},{}],"LC/changesNotification":[function(require,module,exports){
module.exports=require('bQChrF');
},{}],"bQChrF":[function(require,module,exports){
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

        // 'els' (filtered form elements list) can be an array of field 'name's or an array of DOM elements (or mixed)
        // its converted to an array of 'name's anyway:
        if (els) {
            els = $.map(els, function (el) {
                return (typeof (el) === 'string' ? el : el.name);
            });
        }

        // to-remove form list flag: by default true, since when no els list since is all the form saved
        var r = true;
        if (els) {
            this.changesList[fname] = $.grep(this.changesList[fname], function (el) { return ($.inArray(el, els) == -1); });
            // Don't remove 'f' list if is not empty
            r = this.changesList[fname].length === 0;
        }

        if (r) {
            $(f).removeClass(this.defaults.changedFormClass);
            delete this.changesList[fname];
        }

        // pass data: form, elements registered as save (this can be null), and 'form fully saved' as third param (bool)
        $(f).trigger('lcChangesNotificationSaveRegistered', [f, els || prevEls, r]);
        var lchn = this;
        if (els) {
            $.each(els, function () {
                $('[name="' + escapeJQuerySelectorValue(this) + '"]')
                .removeClass(lchn.defaults.changedElementClass);
            });
        }
        return prevEls;
    }
};

// Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = changesNotification;
}
},{"./getXPath":60,"./jqueryUtils":"iWea/N"}],52:[function(require,module,exports){
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


},{}],53:[function(require,module,exports){
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

},{"./changesNotification":"bQChrF","./getText":"B9HwAX","./jquery.xtsh":73,"./moveFocusTo":"lyuNFv","./smoothBoxBlock":"TinZqq"}],"LC/dateISO8601":[function(require,module,exports){
module.exports=require('rgrJsD');
},{}],"rgrJsD":[function(require,module,exports){
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
},{}],56:[function(require,module,exports){
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

},{}],57:[function(require,module,exports){
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
},{}],"LC/getText":[function(require,module,exports){
module.exports=require('B9HwAX');
},{}],"B9HwAX":[function(require,module,exports){
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
},{"./jqueryUtils":"iWea/N"}],60:[function(require,module,exports){
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

},{}],"TPQyHE":[function(require,module,exports){
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

},{"./loader":76}],"LC/googleMapReady":[function(require,module,exports){
module.exports=require('TPQyHE');
},{}],63:[function(require,module,exports){
/* GUID Generator
 */
module.exports = function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
},{}],64:[function(require,module,exports){
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
},{}],65:[function(require,module,exports){
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
},{}],66:[function(require,module,exports){
/* Returns true when str is
- null
- empty string
- only white spaces string
*/
module.exports = function isEmptyString(str) {
    return !(/\S/g.test(str || ""));
};
},{}],67:[function(require,module,exports){
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
},{}],68:[function(require,module,exports){
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
},{}],69:[function(require,module,exports){
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
},{}],70:[function(require,module,exports){
/** Checks if current element or one of the current set of elements has
a parent that match the element or expression given as first parameter
**/
var $ = jQuery || require('jquery');
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};
},{}],71:[function(require,module,exports){
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
},{}],72:[function(require,module,exports){
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
},{"./smoothBoxBlock":"TinZqq"}],73:[function(require,module,exports){
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
module.exports=require('iWea/N');
},{}],"iWea/N":[function(require,module,exports){
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

},{}],76:[function(require,module,exports){
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
},{}],77:[function(require,module,exports){
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
module.exports=require('lyuNFv');
},{}],"lyuNFv":[function(require,module,exports){
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
},{}],80:[function(require,module,exports){
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
},{"./i18n":65,"./mathUtils":77}],81:[function(require,module,exports){
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
},{}],82:[function(require,module,exports){
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
},{"./createIframe":52,"./moveFocusTo":"lyuNFv","./smoothBoxBlock":"TinZqq"}],83:[function(require,module,exports){
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
                            // Error label (if there is)
                            $t.closest('form').find('[data-valmsg-for=' + $t.attr('name') + ']').text('');
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
                            // Error label (if there is)
                            $t.closest('form').find('[data-valmsg-for=' + $t.attr('name') + ']').text(msg);
                            // If label is not visible, just remove the bad code to let user see the placeholder #514
                            var $label = $t.closest('label');
                            if (!$label.length && $t.attr('id'))
                                $label = $t.closest('form').find('label[for=' + $t.attr('id') + ']');
                            if (!$label.is(':visible'))
                                $t.val('');
                        }
                }
            });
        }
    });
};
},{}],84:[function(require,module,exports){
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

},{}],85:[function(require,module,exports){
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
},{}],"TinZqq":[function(require,module,exports){
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
    
    // Hiding/closing box:
    if (contentBox.length === 0) {

        box.xhide(options.closeOptions);

        // Restoring the CSS position attribute of the blocked element
        // to avoid some problems with layout on some edge cases almost
        // that may be not a problem during blocking but when unblocked.
        var prev = blocked.data('sbb-previous-css-position');
        blocked.css('position', prev || '');
        blocked.data('sbb-previous-css-position', null);

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
        .on('click', '.close-action', function (e) {
            e.preventDefault();
            smoothBoxBlock(null, blocked, null, box.data('modal-box-options'));
        })
        .data('_close-action-added', true);
    boxc.append(contentBox);
    boxc.width(options.width);
    box.css('position', 'absolute');
    if (boxInsideBlocked) {
        // Box positioning setup when inside the blocked element:
        box.css('z-index', blocked.css('z-index') + 10);
        if (!blocked.css('position') || blocked.css('position') == 'static') {
            blocked.data('sbb-previous-css-position', blocked.css('position'));
            blocked.css('position', 'relative');
        }
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
        if (options.center === true || options.center === 'vertical')
            boxc.css('top', ct - boxc.outerHeight(true) / 2);
        if (options.center === true || options.center === 'horizontal')
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
},{"./autoFocus":33,"./jquery.xtsh":73,"./jqueryUtils":"iWea/N","./moveFocusTo":"lyuNFv"}],"LC/smoothBoxBlock":[function(require,module,exports){
module.exports=require('TinZqq');
},{}],"3mmOyL":[function(require,module,exports){
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

},{"./jquery.isChildOf":70,"./jquery.outerHtml":71,"./sanitizeWhitespaces":85}],"LC/tooltips":[function(require,module,exports){
module.exports=require('3mmOyL');
},{}],90:[function(require,module,exports){
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
module.exports=require('UpLaI0');
},{}],"UpLaI0":[function(require,module,exports){
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
},{}],93:[function(require,module,exports){
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
},{}],94:[function(require,module,exports){
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
},{"../LC/Array.remove":1,"../LC/Cookie":7,"../LC/LcUrl":10,"../LC/Price":11,"../LC/String.prototype.contains":15,"../LC/StringFormat":"NBNrUh","../LC/TabbedUX":20,"../LC/TabbedUX.autoload":18,"../LC/TabbedUX.changesNotification":19,"../LC/TabbedUX.sliderTabs":21,"../LC/TabbedUX.wizard":22,"../LC/TimeSpan":"BE/3cj","../LC/TimeSpanExtra":"so8zgW","../LC/UISliderLabels":27,"../LC/ajaxCallbacks":"g22qGq","../LC/ajaxForms":"0NFXny","../LC/autoCalculate":32,"../LC/autoFocus":33,"../LC/autofillSubmenu":34,"../LC/availabilityCalendar":"qcqtAx","../LC/blockPresets":49,"../LC/changesNotification":"bQChrF","../LC/crudl":53,"../LC/datePicker":56,"../LC/dateToInterchangeableString":57,"../LC/getText":"B9HwAX","../LC/getXPath":60,"../LC/googleMapReady":"TPQyHE","../LC/guidGenerator":63,"../LC/hasConfirmSupport":64,"../LC/i18n":65,"../LC/isEmptyString":66,"../LC/jquery.are":67,"../LC/jquery.hasScrollBar":69,"../LC/jquery.reload":72,"../LC/jquery.xtsh":73,"../LC/jqueryUtils":"iWea/N","../LC/loader":76,"../LC/mathUtils":77,"../LC/moveFocusTo":"lyuNFv","../LC/numberUtils":80,"../LC/placeholder-polyfill":81,"../LC/popup":82,"../LC/postalCodeServerValidation":83,"../LC/sanitizeWhitespaces":85,"../LC/smoothBoxBlock":"TinZqq","../LC/tooltips":"3mmOyL","../LC/urlUtils":90,"../LC/validationHelper":"UpLaI0","./accountPopups":93,"./availabilityCalendarWidget":95,"./faqsPopups":96,"./home":97,"./legalPopups":98,"./providerWelcome":99,"./welcomePopup":100}],95:[function(require,module,exports){
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
},{"../LC/dateToInterchangeableString":57,"../LC/jquery.reload":72,"../LC/smoothBoxBlock":"TinZqq"}],96:[function(require,module,exports){
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
},{}],97:[function(require,module,exports){
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
},{}],98:[function(require,module,exports){
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
},{}],99:[function(require,module,exports){
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

},{"LC/SimpleSlider":"BhQbxR"}],100:[function(require,module,exports){
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

    /**
    Go to the first step on a already initialized popup
    **/
    function startAgain(animate) {
        // Return popup to the first step (choose profile, #486) and exit -init is ready-
        // Show first step
        var step1 = c.find('.profile-choice, header .presentation');
        if (animate)
            step1.slideDown('fast');
        else
            step1.show();
        // Hide second step
        var step2 = c.find('.terms, .profile-data');
        if (animate)
            step2.slideUp('fast');
        else
            step2.hide();
        // Hide back-action button
        c.find('.back-action').hide();
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
    }

    if (initialized) {
        startAgain();
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

    // go back button
    c.find('.back-action').on('click', function (e) {
        startAgain(true);
        e.preventDefault();
    });

    // Popovers for tooltip replacement
    c.find('[data-toggle="popover"]')
    .popover()
    .filter('a[href="#"]').on('click', function (e) {
        // Avoid navigate to the link
        e.preventDefault();
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
                // Different placement for mobile design (up to 640px wide) to avoid being hidden
                placement: $('html').width() < 640 ? 'top' : 'left'
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
        // Show back-action button
        c.find('.back-action').show();

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

},{}],101:[function(require,module,exports){



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





},{}],102:[function(require,module,exports){
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
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
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

},{}]},{},[94,"4b8n5S","rgrJsD","BhQbxR"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQXJyYXkucmVtb3ZlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0JpbmRhYmxlQ29tcG9uZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0NvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9EYXRhU291cmNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0xjV2lkZ2V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL2V4dGVuZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9Db29raWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvRmFjZWJvb2tDb25uZWN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0xjVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1ByaWNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1JlZ0V4cC5xdW90ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9TaW1wbGVTbGlkZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nLnByb3RvdHlwZS5jb250YWlucy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9TdHJpbmdGb3JtYXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguYXV0b2xvYWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguY2hhbmdlc05vdGlmaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC5zbGlkZXJUYWJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLndpemFyZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UaW1lU3Bhbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UaW1lU3BhbkV4dHJhLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1VJU2xpZGVyTGFiZWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhDYWxsYmFja3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYWpheEZvcm1zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9DYWxjdWxhdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXV0b0ZvY3VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9maWxsU3VibWVudS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9Cb29raW5nc05vdGlmaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9Nb250aGx5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL1dlZWtseS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9Xb3JrSG91cnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvY2xlYXJDdXJyZW50U2VsZWN0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2RhdGVVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9mb3JtYXREYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2luZGV4LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL21ha2VVbnNlbGVjdGFibGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvb2JqZWN0VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvdXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYmF0Y2hFdmVudEhhbmRsZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYmxvY2tQcmVzZXRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvY3JlYXRlSWZyYW1lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVJU084NjAxLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFRleHQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ29vZ2xlTWFwUmVhZHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ3VpZEdlbmVyYXRvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9oYXNDb25maXJtU3VwcG9ydC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pMThuLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2lzRW1wdHlTdHJpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmFyZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuYm91bmRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmlzQ2hpbGRPZi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkub3V0ZXJIdG1sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5yZWxvYWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL21hdGhVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tb3ZlRm9jdXNUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9udW1iZXJVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3B1cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9yZWRpcmVjdFRvLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9vbHRpcHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdXJsVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYWNjb3VudFBvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZmFxc1BvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvaG9tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvbGVnYWxQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3Byb3ZpZGVyV2VsY29tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvd2VsY29tZVBvcHVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvZGF0ZS1mb3JtYXQtbGl0ZS9kYXRlLWZvcm1hdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBcnJheSBSZW1vdmUgLSBCeSBKb2huIFJlc2lnIChNSVQgTGljZW5zZWQpXHJcbi8qQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xyXG5JYWdvU1JMOiBpdCBzZWVtcyBpbmNvbXBhdGlibGUgd2l0aCBNb2Rlcm5penIgbG9hZGVyIGZlYXR1cmUgbG9hZGluZyBaZW5kZXNrIHNjcmlwdCxcclxubW92ZWQgZnJvbSBwcm90b3R5cGUgdG8gYSBjbGFzcy1zdGF0aWMgbWV0aG9kICovXHJcbmZ1bmN0aW9uIGFycmF5UmVtb3ZlKGFuQXJyYXksIGZyb20sIHRvKSB7XHJcbiAgICB2YXIgcmVzdCA9IGFuQXJyYXkuc2xpY2UoKHRvIHx8IGZyb20pICsgMSB8fCBhbkFycmF5Lmxlbmd0aCk7XHJcbiAgICBhbkFycmF5Lmxlbmd0aCA9IGZyb20gPCAwID8gYW5BcnJheS5sZW5ndGggKyBmcm9tIDogZnJvbTtcclxuICAgIHJldHVybiBhbkFycmF5LnB1c2guYXBwbHkoYW5BcnJheSwgcmVzdCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhcnJheVJlbW92ZTtcclxufSBlbHNlIHtcclxuICAgIEFycmF5LnJlbW92ZSA9IGFycmF5UmVtb3ZlO1xyXG59IiwiLyoqXHJcbiAgQmluZGFibGUgVUkgQ29tcG9uZW50LlxyXG4gIEl0IHJlbGllcyBvbiBDb21wb25lbnQgYnV0IGFkZHMgRGF0YVNvdXJjZSBjYXBhYmlsaXRpZXNcclxuKiovXHJcbnZhciBEYXRhU291cmNlID0gcmVxdWlyZSgnLi9EYXRhU291cmNlJyk7XHJcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKCcuL0NvbXBvbmVudCcpO1xyXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKTtcclxudmFyIG1ldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcclxuXHJcbi8qKlxyXG5SZXVzaW5nIHRoZSBvcmlnaW5hbCBmZXRjaERhdGEgbWV0aG9kIGJ1dCBhZGRpbmcgY2xhc3NlcyB0byBvdXJcclxuY29tcG9uZW50IGVsZW1lbnQgZm9yIGFueSB2aXN1YWwgbm90aWZpY2F0aW9uIG9mIHRoZSBkYXRhIGxvYWRpbmcuXHJcbk1ldGhvZCBnZXQgZXh0ZW5kZWQgd2l0aCBpc1ByZWZldGNoaW5nIG1ldGhvZCBmb3IgZGlmZmVyZW50XHJcbmNsYXNzZXMvbm90aWZpY2F0aW9ucyBkZXBlbmRhbnQgb24gdGhhdCBmbGFnLCBieSBkZWZhdWx0IGZhbHNlOlxyXG4qKi9cclxudmFyIGNvbXBvbmVudEZldGNoRGF0YSA9IGZ1bmN0aW9uIGJpbmRhYmxlQ29tcG9uZW50RmV0Y2hEYXRhKHF1ZXJ5RGF0YSwgbW9kZSwgaXNQcmVmZXRjaGluZykge1xyXG4gIHZhciBjbCA9IGlzUHJlZmV0Y2hpbmcgPyB0aGlzLmNsYXNzZXMucHJlZmV0Y2hpbmcgOiB0aGlzLmNsYXNzZXMuZmV0Y2hpbmc7XHJcbiAgdGhpcy4kZWwuYWRkQ2xhc3MoY2wpO1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdmFyIHJlcSA9IERhdGFTb3VyY2UucHJvdG90eXBlLmZldGNoRGF0YS5jYWxsKHRoaXMsIHF1ZXJ5RGF0YSwgbW9kZSlcclxuICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LiRlbC5yZW1vdmVDbGFzcyhjbCB8fCAnXycpO1xyXG4gICAgLy8gVW5tYXJrIGFueSBwb3NpYmxlIHByZXZpb3VzIGVycm9yIHNpbmNlIHdlIGhhZCBhIHN1Y2NlcyBsb2FkOlxyXG4gICAgdGhhdC5oYXNFcnJvcihmYWxzZSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiByZXE7XHJcbn07XHJcbi8qKlxyXG5SZXBsYWNpbmcsIGJ1dCByZXVzaW5nIGludGVybmFscywgdGhlIGRlZmF1bHQgb25lcnJvciBjYWxsYmFjayBmb3IgdGhlXHJcbmZldGNoRGF0YSBmdW5jdGlvbiB0byBhZGQgbm90aWZpY2F0aW9uIGNsYXNzZXMgdG8gb3VyIGNvbXBvbmVudCBtb2RlbFxyXG4qKi9cclxuY29tcG9uZW50RmV0Y2hEYXRhLm9uZXJyb3IgPSBmdW5jdGlvbiBiaW5kYWJsZUNvbXBvbmVudEZlY2hEYXRhT25lcnJvcih4LCBzLCBlKSB7XHJcbiAgRGF0YVNvdXJjZS5wcm90b3R5cGUuZmV0Y2hEYXRhLm9uZXJyb3IuY2FsbCh0aGlzLCB4LCBzLCBlKTtcclxuICAvLyBSZW1vdmUgZmV0Y2hpbmcgY2xhc3NlczpcclxuICB0aGlzLiRlbFxyXG4gIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKVxyXG4gIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMucHJlZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAvLyBNYXJrIGVycm9yOlxyXG4gIHRoaXMuaGFzRXJyb3IoeyBuYW1lOiAnZmV0Y2hEYXRhRXJyb3InLCByZXF1ZXN0OiB4LCBzdGF0dXM6IHMsIGV4Y2VwdGlvbjogZSB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gIEJpbmRhYmxlQ29tcG9uZW50IGNsYXNzXHJcbioqL1xyXG52YXIgQmluZGFibGVDb21wb25lbnQgPSBDb21wb25lbnQuZXh0ZW5kKFxyXG4gIERhdGFTb3VyY2UucHJvdG90eXBlLFxyXG4gIC8vIFByb3RvdHlwZVxyXG4gIHtcclxuICAgIGNsYXNzZXM6IHtcclxuICAgICAgZmV0Y2hpbmc6ICdpcy1sb2FkaW5nJyxcclxuICAgICAgcHJlZmV0Y2hpbmc6ICdpcy1wcmVsb2FkaW5nJyxcclxuICAgICAgZGlzYWJsZWQ6ICdpcy1kaXNhYmxlZCcsXHJcbiAgICAgIGhhc0RhdGFFcnJvcjogJ2hhcy1kYXRhRXJyb3InXHJcbiAgICB9LFxyXG4gICAgZmV0Y2hEYXRhOiBjb21wb25lbnRGZXRjaERhdGEsXHJcbiAgICAvLyBXaGF0IGF0dHJpYnV0ZSBuYW1lIHVzZSB0byBtYXJrIGVsZW1lbnRzIGluc2lkZSB0aGUgY29tcG9uZW50XHJcbiAgICAvLyB3aXRoIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBzb3VyY2UgdG8gYmluZC5cclxuICAgIC8vIFRoZSBwcmVmaXggJ2RhdGEtJyBpbiBjdXN0b20gYXR0cmlidXRlcyBpcyByZXF1aXJlZCBieSBodG1sNSxcclxuICAgIC8vIGp1c3Qgc3BlY2lmeSB0aGUgc2Vjb25kIHBhcnQsIGJlaW5nICdiaW5kJyB0aGUgYXR0cmlidXRlXHJcbiAgICAvLyBuYW1lIHRvIHVzZSBpcyAnZGF0YS1iaW5kJ1xyXG4gICAgZGF0YUJpbmRBdHRyaWJ1dGU6ICdiaW5kJyxcclxuICAgIC8vIERlZmF1bHQgYmluZERhdGEgaW1wbGVtZW50YXRpb24sIGNhbiBiZSByZXBsYWNlIG9uIGV4dGVuZGVkIGNvbXBvbmVudHNcclxuICAgIC8vIHRvIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggKGxpc3QvY29sbGVjdGlvbnMsIHN1Yi1vYmplY3RzLCBjdXN0b20gc3RydWN0dXJlc1xyXG4gICAgLy8gYW5kIHZpc3VhbGl6YXRpb24gLS1rZWVwIGFzIHBvc3NpYmxlIHRoZSB1c2Ugb2YgZGF0YUJpbmRBdHRyaWJ1dGUgZm9yIHJldXNhYmxlIGNvZGUpLlxyXG4gICAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiB3b3JrcyBmaW5lIGZvciBkYXRhIGFzIHBsYWluIG9iamVjdCB3aXRoIFxyXG4gICAgLy8gc2ltcGxlIHR5cGVzIGFzIHByb3BlcnRpZXMgKG5vdCBvYmplY3RzIG9yIGFycmF5cyBpbnNpZGUgdGhlbSkuXHJcbiAgICBiaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGEoKSB7XHJcbiAgICAgIGlmICghdGhpcy5kYXRhKSByZXR1cm47XHJcbiAgICAgIC8vIENoZWNrIGV2ZXJ5IGVsZW1lbnQgaW4gdGhlIGNvbXBvbmVudCB3aXRoIGEgYmluZFxyXG4gICAgICAvLyBwcm9wZXJ0eSBhbmQgdXBkYXRlIGl0IHdpdGggdGhlIHZhbHVlIG9mIHRoYXQgcHJvcGVydHlcclxuICAgICAgLy8gZnJvbSB0aGUgZGF0YSBzb3VyY2VcclxuICAgICAgdmFyIGF0dCA9IHRoaXMuZGF0YUJpbmRBdHRyaWJ1dGU7XHJcbiAgICAgIHZhciBhdHRyU2VsZWN0b3IgPSAnW2RhdGEtJyArIGF0dCArICddJztcclxuICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICB0aGlzLiRlbC5maW5kKGF0dHJTZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKSxcclxuICAgICAgICAgIHByb3AgPSAkdC5kYXRhKGF0dCksXHJcbiAgICAgICAgICBiaW5kZWRWYWx1ZSA9IHRoYXQuZGF0YVtwcm9wXTtcclxuXHJcbiAgICAgICAgaWYgKCR0LmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICR0LnZhbChiaW5kZWRWYWx1ZSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgJHQudGV4dChiaW5kZWRWYWx1ZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICBJdCBnZXRzIHRoZSBsYXRlc3QgZXJyb3IgaGFwcGVuZWQgaW4gdGhlIGNvbXBvbmVudCAob3IgbnVsbC9mYWxzeSBpZiB0aGVyZSBpcyBubyksXHJcbiAgICAgIG9yIHNldHMgdGhlIGVycm9yIChwYXNzaW5nIGl0IGluIHRoZSBvcHRpb25hbCB2YWx1ZSkgcmV0dXJuaW5nIHRoZSBwcmV2aW91cyByZWdpc3RlcmVkIGVycm9yLlxyXG4gICAgICBJdHMgcmVjb21tZW5kZWQgYW4gb2JqZWN0IGFzIGVycm9yIGluc3RlYWQgb2YgYSBzaW1wbGUgdmFsdWUgb3Igc3RyaW5nICh0aGF0IGNhbiBnZXQgY29uZnVzZWRcclxuICAgICAgd2l0aCBmYWxzeSBpZiBpcyBlbXB0eSBzdHJpbmcgb3IgMCwgYW5kIGFsbG93IGF0dGFjaCBtb3JlIHN0cnVjdHVyZWQgaW5mb3JtYXRpb24pIHdpdGggYW5cclxuICAgICAgaW5mb3JtYXRpb25hbCBwcm9wZXJ0eSAnbmFtZScuXHJcbiAgICAgIFRvIHNldCBvZmYgdGhlIGVycm9yLCBwYXNzIG51bGwgdmFsdWUgb3IgZmFsc2UuXHJcbiAgICAqKi9cclxuICAgIGhhc0Vycm9yOiBmdW5jdGlvbiBoYXNFcnJvcihlcnJvclRvU2V0KSB7XHJcbiAgICAgIGlmICh0eXBlb2YgKGVycm9yVG9TZXQpID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Vycm9yIHx8IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIHByZXYgPSB0aGlzLl9lcnJvciB8fCBudWxsO1xyXG4gICAgICB0aGlzLl9lcnJvciA9IGVycm9yVG9TZXQ7XHJcbiAgICAgIHRoaXMuZXZlbnRzLmVtaXQoJ2hhc0Vycm9yQ2hhbmdlZCcsIGVycm9yVG9TZXQsIHByZXYpO1xyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH1cclxuICB9LFxyXG4gIC8vIENvbnN0cnVjdG9yXHJcbiAgZnVuY3Rpb24gQmluZGFibGVDb21wb25lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgQ29tcG9uZW50LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICBcclxuICAgIC8vIEl0IGhhcyBhbiBldmVudCBlbWl0dGVyOlxyXG4gICAgdGhpcy5ldmVudHMgPSBuZXcgbWV2ZW50cy5FdmVudEVtaXR0ZXIoKTtcclxuICAgIC8vIEV2ZW50cyBvYmplY3QgaGFzIGEgcHJvcGVydHkgdG8gYWNjZXNzIHRoaXMgb2JqZWN0LFxyXG4gICAgLy8gdXNlZnVsbCB0byByZWZlcmVuY2UgYXMgJ3RoaXMuY29tcG9uZW50JyBmcm9tIGluc2lkZVxyXG4gICAgLy8gZXZlbnQgaGFuZGxlcnM6XHJcbiAgICB0aGlzLmV2ZW50cy5jb21wb25lbnQgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuZGF0YSA9IHRoaXMuJGVsLmRhdGEoJ3NvdXJjZScpIHx8IHRoaXMuZGF0YSB8fCB7fTtcclxuICAgIGlmICh0eXBlb2YgKHRoaXMuZGF0YSkgPT0gJ3N0cmluZycpXHJcbiAgICAgIHRoaXMuZGF0YSA9IEpTT04ucGFyc2UodGhpcy5kYXRhKTtcclxuXHJcbiAgICAvLyBPbiBodG1sIHNvdXJjZSB1cmwgY29uZmlndXJhdGlvbjpcclxuICAgIHRoaXMudXJsID0gdGhpcy4kZWwuZGF0YSgnc291cmNlLXVybCcpIHx8IHRoaXMudXJsO1xyXG5cclxuICAgIC8vIENsYXNzZXMgb24gZmV0Y2hEYXRhRXJyb3JcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCBmdW5jdGlvbiAoZXJyLCBwcmV2RXJyKSB7XHJcbiAgICAgIGlmIChlcnIgJiYgZXJyLm5hbWUgPT0gJ2ZldGNoRGF0YUVycm9yJykge1xyXG4gICAgICAgIHRoYXQuJGVsLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5oYXNEYXRhRXJyb3IpO1xyXG4gICAgICB9IGVsc2UgaWYgKHByZXZFcnIgJiYgcHJldkVyci5uYW1lID09ICdmZXRjaERhdGFFcnJvcicpIHtcclxuICAgICAgICB0aGF0LiRlbC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuaGFzRGF0YUVycm9yIHx8ICdfJyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFRPRE86ICdjaGFuZ2UnIGV2ZW50IGhhbmRsZXJzIG9uIGZvcm1zIHdpdGggZGF0YS1iaW5kIHRvIHVwZGF0ZSBpdHMgdmFsdWUgYXQgdGhpcy5kYXRhXHJcbiAgICAvLyBUT0RPOiBhdXRvICdiaW5kRGF0YScgb24gZmV0Y2hEYXRhIGVuZHM/IGNvbmZpZ3VyYWJsZSwgYmluZERhdGFNb2RleyBpbm1lZGlhdGUsIG5vdGlmeSB9XHJcbiAgfVxyXG4pO1xyXG5cclxuLy8gUHVibGljIG1vZHVsZTpcclxubW9kdWxlLmV4cG9ydHMgPSBCaW5kYWJsZUNvbXBvbmVudDsiLCIvKiogQ29tcG9uZW50IGNsYXNzOiB3cmFwcGVyIGZvclxyXG4gIHRoZSBsb2dpYyBhbmQgYmVoYXZpb3IgYXJvdW5kXHJcbiAgYSBET00gZWxlbWVudFxyXG4qKi9cclxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4vZXh0ZW5kJyk7XHJcblxyXG5mdW5jdGlvbiBDb21wb25lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIHRoaXMuZWwgPSBlbGVtZW50O1xyXG4gIHRoaXMuJGVsID0gJChlbGVtZW50KTtcclxuICBleHRlbmQodGhpcywgb3B0aW9ucyk7XHJcbiAgLy8gVXNlIHRoZSBqUXVlcnkgJ2RhdGEnIHN0b3JhZ2UgdG8gcHJlc2VydmUgYSByZWZlcmVuY2VcclxuICAvLyB0byB0aGlzIGluc3RhbmNlICh1c2VmdWwgdG8gcmV0cmlldmUgaXQgZnJvbSBkb2N1bWVudClcclxuICB0aGlzLiRlbC5kYXRhKCdjb21wb25lbnQnLCB0aGlzKTtcclxufVxyXG5cclxuZXh0ZW5kLnBsdWdJbihDb21wb25lbnQpO1xyXG5leHRlbmQucGx1Z0luKENvbXBvbmVudC5wcm90b3R5cGUpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQ7IiwiLyoqXHJcbiAgRGF0YVNvdXJjZSBjbGFzcyB0byBzaW1wbGlmeSBmZXRjaGluZyBkYXRhIGFzIEpTT05cclxuICB0byBmaWxsIGEgbG9jYWwgY2FjaGUuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZmV0Y2hKU09OID0gJC5nZXRKU09OLFxyXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJC5leHRlbmQuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7IH07XHJcblxyXG4vLyBUT0RPOiByZXBsYWNlIGVhY2ggcHJvcGVydHkgb2YgZnVuY3Rpb25zIGJ5IGluc3RhbmNlIHByb3BlcnRpZXMsIHNpbmNlIHRoYXQgcHJvcGVydGllcyBiZWNvbWVcclxuLy8gc2hhcmVkIGJldHdlZW4gaW5zdGFuY2VzIGFuZCBpcyBub3Qgd2FudGVkXHJcblxyXG52YXIgcmVxTW9kZXMgPSBEYXRhU291cmNlLnJlcXVlc3RNb2RlcyA9IHtcclxuICAvLyBQYXJhbGxlbCByZXF1ZXN0LCBubyBtYXR0ZXIgb2Ygb3RoZXJzXHJcbiAgbXVsdGlwbGU6IDAsXHJcbiAgLy8gV2lsbCBhdm9pZCBhIHJlcXVlc3QgaWYgdGhlcmUgaXMgb25lIHJ1bm5pbmdcclxuICBzaW5nbGU6IDEsXHJcbiAgLy8gTGF0ZXN0IHJlcXVldCB3aWxsIHJlcGxhY2UgYW55IHByZXZpb3VzIG9uZSAocHJldmlvdXMgd2lsbCBhYm9ydClcclxuICByZXBsYWNlOiAyXHJcbn07XHJcblxyXG52YXIgdXBkTW9kZXMgPSBEYXRhU291cmNlLnVwZGF0ZU1vZGVzID0ge1xyXG4gIC8vIEV2ZXJ5IG5ldyBkYXRhIHVwZGF0ZSwgbmV3IGNvbnRlbnQgaXMgYWRkZWQgaW5jcmVtZW50YWxseVxyXG4gIC8vIChvdmVyd3JpdGUgY29pbmNpZGVudCBjb250ZW50LCBhcHBlbmQgbmV3IGNvbnRlbnQsIG9sZCBjb250ZW50XHJcbiAgLy8gZ2V0IGluIHBsYWNlKVxyXG4gIGluY3JlbWVudGFsOiAwLFxyXG4gIC8vIE9uIG5ldyBkYXRhIHVwZGF0ZSwgbmV3IGRhdGEgdG90YWxseSByZXBsYWNlIHRoZSBwcmV2aW91cyBvbmVcclxuICByZXBsYWNlbWVudDogMVxyXG59O1xyXG5cclxuLyoqXHJcblVwZGF0ZSB0aGUgZGF0YSBzdG9yZSBvciBjYWNoZSB3aXRoIHRoZSBnaXZlbiBvbmUuXHJcblRoZXJlIGFyZSBkaWZmZXJlbnQgbW9kZXMsIHRoaXMgbWFuYWdlcyB0aGF0IGxvZ2ljIGFuZFxyXG5pdHMgb3duIGNvbmZpZ3VyYXRpb24uXHJcbklzIGRlY291cGxlZCBmcm9tIHRoZSBwcm90b3R5cGUgYnV0XHJcbml0IHdvcmtzIG9ubHkgYXMgcGFydCBvZiBhIERhdGFTb3VyY2UgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVEYXRhKGRhdGEsIG1vZGUpIHtcclxuICBzd2l0Y2ggKG1vZGUgfHwgdGhpcy51cGRhdGVEYXRhLmRlZmF1bHRVcGRhdGVNb2RlKSB7XHJcblxyXG4gICAgY2FzZSB1cGRNb2Rlcy5yZXBsYWNlbWVudDpcclxuICAgICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgLy9jYXNlIHVwZE1vZGVzLmluY3JlbWVudGFsOiAgXHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICAvLyBJbiBjYXNlIGluaXRpYWwgZGF0YSBpcyBudWxsLCBhc3NpZ24gdGhlIHJlc3VsdCB0byBpdHNlbGY6XHJcbiAgICAgIHRoaXMuZGF0YSA9IGV4dGVuZCh0aGlzLmRhdGEsIGRhdGEpO1xyXG4gICAgICBicmVhaztcclxuICB9XHJcbn1cclxuXHJcbi8qKiBEZWZhdWx0IHZhbHVlIGZvciB0aGUgY29uZmlndXJhYmxlIHVwZGF0ZSBtb2RlOlxyXG4qKi9cclxudXBkYXRlRGF0YS5kZWZhdWx0VXBkYXRlTW9kZSA9IHVwZE1vZGVzLmluY3JlbWVudGFsO1xyXG5cclxuLyoqXHJcbkZldGNoIHRoZSBkYXRhIGZyb20gdGhlIHNlcnZlci5cclxuSGVyZSBpcyBkZWNvdXBsZWQgZnJvbSB0aGUgcmVzdCBvZiB0aGUgcHJvdG90eXBlIGZvclxyXG5jb21tb2RpdHksIGJ1dCBpdCBjYW4gd29ya3Mgb25seSBhcyBwYXJ0IG9mIGEgRGF0YVNvdXJjZSBpbnN0YW5jZS5cclxuKiovXHJcbmZ1bmN0aW9uIGZldGNoRGF0YShxdWVyeSwgbW9kZSkge1xyXG4gIHF1ZXJ5ID0gZXh0ZW5kKHt9LCB0aGlzLnF1ZXJ5LCBxdWVyeSk7XHJcbiAgc3dpdGNoIChtb2RlIHx8IHRoaXMuZmV0Y2hEYXRhLmRlZmF1bHRSZXF1ZXN0TW9kZSkge1xyXG5cclxuICAgIGNhc2UgcmVxTW9kZXMuc2luZ2xlOlxyXG4gICAgICBpZiAodGhpcy5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSByZXR1cm4gbnVsbDtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSByZXFNb2Rlcy5yZXBsYWNlOlxyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzW2ldLmFib3J0KCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXgpIHsgfVxyXG4gICAgICAgIHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzID0gW107XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgLy8gSnVzdCBkbyBub3RoaW5nIGZvciBtdWx0aXBsZSBvciBkZWZhdWx0ICAgICBcclxuICAgIC8vY2FzZSByZXFNb2Rlcy5tdWx0aXBsZTogIFxyXG4gICAgLy9kZWZhdWx0OiBcclxuICB9XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB2YXIgcmVxID0gdGhpcy5mZXRjaERhdGEucHJveHkoXHJcbiAgICB0aGlzLnVybCxcclxuICAgIHF1ZXJ5LFxyXG4gICAgZnVuY3Rpb24gKGRhdGEsIHQsIHhocikge1xyXG4gICAgICB2YXIgcmV0ID0gdGhhdC51cGRhdGVEYXRhKGRhdGEpO1xyXG4gICAgICB0aGF0LmZldGNoRGF0YS5yZXF1ZXN0cy5zcGxpY2UodGhhdC5mZXRjaERhdGEucmVxdWVzdHMuaW5kZXhPZihyZXEpLCAxKTtcclxuICAgICAgLy9kZWxldGUgZmV0Y2hEYXRhLnJlcXVlc3RzW2ZldGNoRGF0YS5yZXF1ZXN0cy5pbmRleE9mKHJlcSldO1xyXG5cclxuICAgICAgaWYgKHJldCAmJiByZXQubmFtZSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSBkYXRhIGVtaXRzIGVycm9yLCB0aGUgQWpheCBzdGlsbCByZXNvbHZlcyBhcyAnc3VjY2VzcycgYmVjYXVzZSBvZiB0aGUgcmVxdWVzdCwgYnV0XHJcbiAgICAgICAgLy8gd2UgbmVlZCB0byBleGVjdXRlIHRoZSBlcnJvciwgYnV0IHdlIHBpcGUgaXQgdG8gZW5zdXJlIGlzIGRvbmUgYWZ0ZXIgb3RoZXIgJ2RvbmUnIGNhbGxiYWNrc1xyXG4gICAgICAgIHJlcS5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdGhhdC5mZXRjaERhdGEub25lcnJvci5jYWxsKHRoYXQsIG51bGwsIHJldC5uYW1lLCByZXQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG4gIClcclxuICAuZmFpbCgkLnByb3h5KHRoaXMuZmV0Y2hEYXRhLm9uZXJyb3IsIHRoaXMpKTtcclxuICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5wdXNoKHJlcSk7XHJcblxyXG4gIHJldHVybiByZXE7XHJcbn1cclxuXHJcbi8vIERlZmF1bHRzIGZldGNoRGF0YSBwcm9wZXJ0aWVzLCB0aGV5IGFyZSBkZWNvdXBsZWQgdG8gYWxsb3dcclxuLy8gcmVwbGFjZW1lbnQsIGFuZCBpbnNpZGUgdGhlIGZldGNoRGF0YSBmdW5jdGlvbiB0byBkb24ndFxyXG4vLyBjb250YW1pbmF0ZSB0aGUgb2JqZWN0IG5hbWVzcGFjZS5cclxuXHJcbi8qIENvbGxlY3Rpb24gb2YgYWN0aXZlIChmZXRjaGluZykgcmVxdWVzdHMgdG8gdGhlIHNlcnZlclxyXG4qL1xyXG5mZXRjaERhdGEucmVxdWVzdHMgPSBbXTtcclxuXHJcbi8qIERlY291cGxlZCBmdW5jdGlvbmFsaXR5IHRvIHBlcmZvcm0gdGhlIEFqYXggb3BlcmF0aW9uLFxyXG50aGlzIGFsbG93cyBvdmVyd3JpdGUgdGhpcyBiZWhhdmlvciB0byBpbXBsZW1lbnQgYW5vdGhlclxyXG53YXlzLCBsaWtlIGEgbm9uLWpRdWVyeSBpbXBsZW1lbnRhdGlvbiwgYSBwcm94eSB0byBmYWtlIHNlcnZlclxyXG5mb3IgdGVzdGluZyBvciBwcm94eSB0byBsb2NhbCBzdG9yYWdlIGlmIG9ubGluZSwgZXRjLlxyXG5JdCBtdXN0IHJldHVybnMgdGhlIHVzZWQgcmVxdWVzdCBvYmplY3QuXHJcbiovXHJcbmZldGNoRGF0YS5wcm94eSA9IGZldGNoSlNPTjtcclxuXHJcbi8qIEJ5IGRlZmF1bHQsIGZldGNoRGF0YSBhbGxvd3MgbXVsdGlwbGUgc2ltdWx0YW5lb3MgY29ubmVjdGlvbixcclxuc2luY2UgdGhlIHN0b3JhZ2UgYnkgZGVmYXVsdCBhbGxvd3MgaW5jcmVtZW50YWwgdXBkYXRlcyByYXRoZXJcclxudGhhbiByZXBsYWNlbWVudHMuXHJcbiovXHJcbmZldGNoRGF0YS5kZWZhdWx0UmVxdWVzdE1vZGUgPSByZXFNb2Rlcy5tdWx0aXBsZTtcclxuXHJcbi8qIERlZmF1bHQgbm90aWZpY2F0aW9uIG9mIGVycm9yIG9uIGZldGNoaW5nLCBqdXN0IGxvZ2dpbmcsXHJcbmNhbiBiZSByZXBsYWNlZC5cclxuSXQgcmVjZWl2ZXMgdGhlIHJlcXVlc3Qgb2JqZWN0LCBzdGF0dXMgYW5kIGVycm9yLlxyXG4qL1xyXG5mZXRjaERhdGEub25lcnJvciA9IGZ1bmN0aW9uIGVycm9yKHgsIHMsIGUpIHtcclxuICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdGZXRjaCBkYXRhIGVycm9yICVvJywgZSk7XHJcbn07XHJcblxyXG4vKipcclxuICBEYXRhU291cmNlIGNsYXNzXHJcbioqL1xyXG4vLyBDb25zdHJ1Y3RvcjogZXZlcnl0aGluZyBpcyBpbiB0aGUgcHJvdG90eXBlLlxyXG5mdW5jdGlvbiBEYXRhU291cmNlKCkgeyB9XHJcbkRhdGFTb3VyY2UucHJvdG90eXBlID0ge1xyXG4gIGRhdGE6IG51bGwsXHJcbiAgdXJsOiAnLycsXHJcbiAgLy8gcXVlcnk6IG9iamVjdCB3aXRoIGRlZmF1bHQgZXh0cmEgaW5mb3JtYXRpb24gdG8gYXBwZW5kIHRvIHRoZSB1cmxcclxuICAvLyB3aGVuIGZldGNoaW5nIGRhdGEsIGV4dGVuZGVkIHdpdGggdGhlIGV4cGxpY2l0IHF1ZXJ5IHNwZWNpZmllZFxyXG4gIC8vIGV4ZWN1dGluZyBmZXRjaERhdGEocXVlcnkpXHJcbiAgcXVlcnk6IHt9LFxyXG4gIHVwZGF0ZURhdGE6IHVwZGF0ZURhdGEsXHJcbiAgZmV0Y2hEYXRhOiBmZXRjaERhdGFcclxuICAvLyBUT0RPICBwdXNoRGF0YTogZnVuY3Rpb24oKXsgcG9zdC9wdXQgdGhpcy5kYXRhIHRvIHVybCAgfVxyXG59O1xyXG5cclxuLy8gQ2xhc3MgYXMgcHVibGljIG1vZHVsZTpcclxubW9kdWxlLmV4cG9ydHMgPSBEYXRhU291cmNlOyIsIi8qKlxyXG4gIExvY29ub21pY3Mgc3BlY2lmaWMgV2lkZ2V0IGJhc2VkIG9uIEJpbmRhYmxlQ29tcG9uZW50LlxyXG4gIEp1c3QgZGVjb3VwbGluZyBzcGVjaWZpYyBiZWhhdmlvcnMgZnJvbSBzb21ldGhpbmcgbW9yZSBnZW5lcmFsXHJcbiAgdG8gZWFzaWx5IHRyYWNrIHRoYXQgZGV0YWlscywgYW5kIG1heWJlIGZ1dHVyZSBtaWdyYXRpb25zIHRvXHJcbiAgb3RoZXIgZnJvbnQtZW5kIGZyYW1ld29ya3MuXHJcbioqL1xyXG52YXIgRGF0YVNvdXJjZSA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZScpO1xyXG52YXIgQmluZGFibGVDb21wb25lbnQgPSByZXF1aXJlKCcuL0JpbmRhYmxlQ29tcG9uZW50Jyk7XHJcblxyXG52YXIgTGNXaWRnZXQgPSBCaW5kYWJsZUNvbXBvbmVudC5leHRlbmQoXHJcbiAgLy8gUHJvdG90eXBlXHJcbiAge1xyXG4gICAgLy8gUmVwbGFjaW5nIHVwZGF0ZURhdGEgdG8gaW1wbGVtZW50IHRoZSBwYXJ0aWN1bGFyXHJcbiAgICAvLyBKU09OIHNjaGVtZSBvZiBMb2Nvbm9taWNzLCBidXQgcmV1c2luZyBvcmlnaW5hbFxyXG4gICAgLy8gbG9naWMgaW5oZXJpdCBmcm9tIERhdGFTb3VyY2VcclxuICAgIHVwZGF0ZURhdGE6IGZ1bmN0aW9uIChkYXRhLCBtb2RlKSB7XHJcbiAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgIERhdGFTb3VyY2UucHJvdG90eXBlLnVwZGF0ZURhdGEuY2FsbCh0aGlzLCBkYXRhLlJlc3VsdCwgbW9kZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRXJyb3IgbWVzc2FnZSBpbiB0aGUgSlNPTlxyXG4gICAgICAgIHJldHVybiB7IG5hbWU6ICdkYXRhLWZvcm1hdCcsIG1lc3NhZ2U6IGRhdGEuUmVzdWx0ID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlIDogZGF0YS5SZXN1bHQgOiBcInVua25vd1wiIH07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIC8vIENvbnN0cnVjdG9yXHJcbiAgZnVuY3Rpb24gTGNXaWRnZXQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgQmluZGFibGVDb21wb25lbnQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICB9XHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjV2lkZ2V0OyIsIi8qKlxyXG4gIERlZXAgRXh0ZW5kIG9iamVjdCB1dGlsaXR5LCBpcyByZWN1cnNpdmUgdG8gZ2V0IGFsbCB0aGUgZGVwdGhcclxuICBidXQgb25seSBmb3IgdGhlIHByb3BlcnRpZXMgb3duZWQgYnkgdGhlIG9iamVjdCxcclxuICBpZiB5b3UgbmVlZCB0aGUgbm9uLW93bmVkIHByb3BlcnRpZXMgdG8gaW4gdGhlIG9iamVjdCxcclxuICBjb25zaWRlciBleHRlbmQgZnJvbSB0aGUgc291cmNlIHByb3RvdHlwZSB0b28gKGFuZCBtYXliZSB0b1xyXG4gIHRoZSBkZXN0aW5hdGlvbiBwcm90b3R5cGUgaW5zdGVhZCBvZiB0aGUgaW5zdGFuY2UsIGJ1dCB1cCB0byB0b28pLlxyXG4qKi9cclxuXHJcbi8qIGpxdWVyeSBpbXBsZW1lbnRhdGlvbjpcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuZXh0ZW5kID0gZnVuY3Rpb24gKCkge1xyXG5yZXR1cm4gJC5leHRlbmQuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7IFxyXG59OyovXHJcblxyXG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kKGRlc3RpbmF0aW9uLCBzb3VyY2UpIHtcclxuICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBzb3VyY2UpIHtcclxuICAgIGlmICghc291cmNlLmhhc093blByb3BlcnR5KHByb3BlcnR5KSlcclxuICAgICAgY29udGludWU7XHJcblxyXG4gICAgLy8gQWxsb3cgcHJvcGVydGllcyByZW1vdmFsLCBpZiBzb3VyY2UgY29udGFpbnMgdmFsdWUgJ3VuZGVmaW5lZCcuXHJcbiAgICAvLyBUaGVyZSBhcmUgbm8gc3BlY2lhbCBjb25zaWRlcmF0aW9ucyBvbiBBcnJheXMsIHRvIGRvbid0IGdldCB1bmRlc2lyZWRcclxuICAgIC8vIHJlc3VsdHMganVzdCB0aGUgd2FudGVkIGlzIHRvIHJlcGxhY2Ugc3BlY2lmaWMgcG9zaXRpb25zLCBub3JtYWxseS5cclxuICAgIGlmIChzb3VyY2VbcHJvcGVydHldID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgZGVsZXRlIGRlc3RpbmF0aW9uW3Byb3BlcnR5XTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFsnb2JqZWN0JywgJ2Z1bmN0aW9uJ10uaW5kZXhPZih0eXBlb2YgZGVzdGluYXRpb25bcHJvcGVydHldKSAhPSAtMSAmJlxyXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlW3Byb3BlcnR5XSA9PSAnb2JqZWN0JylcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVzdGluYXRpb25bcHJvcGVydHldID09ICdmdW5jdGlvbicgJiZcclxuICAgICAgICAgICAgICAgICB0eXBlb2Ygc291cmNlW3Byb3BlcnR5XSA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHZhciBvcmlnID0gZGVzdGluYXRpb25bcHJvcGVydHldO1xyXG4gICAgICAvLyBDbG9uZSBmdW5jdGlvblxyXG4gICAgICB2YXIgc291ciA9IGNsb25lRnVuY3Rpb24oc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICAgIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9IHNvdXI7XHJcbiAgICAgIC8vIEFueSBwcmV2aW91cyBhdHRhY2hlZCBwcm9wZXJ0eVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBvcmlnKTtcclxuICAgICAgLy8gQW55IHNvdXJjZSBhdHRhY2hlZCBwcm9wZXJ0eVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBzb3VyY2VbcHJvcGVydHldKTtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgICAgZGVzdGluYXRpb25bcHJvcGVydHldID0gc291cmNlW3Byb3BlcnR5XTtcclxuICB9XHJcblxyXG4gIC8vIFNvIG11Y2ggJ3NvdXJjZScgYXJndW1lbnRzIGFzIHdhbnRlZC4gSW4gRVM2IHdpbGwgYmUgJ3NvdXJjZS4uJ1xyXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xyXG4gICAgdmFyIG5leHRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcclxuICAgIG5leHRzLnNwbGljZSgxLCAxKTtcclxuICAgIGV4dGVuZC5hcHBseSh0aGlzLCBuZXh0cyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGVzdGluYXRpb247XHJcbn07XHJcblxyXG5leHRlbmQucGx1Z0luID0gZnVuY3Rpb24gcGx1Z0luKG9iaikge1xyXG4gIG9iaiA9IG9iaiB8fCBPYmplY3QucHJvdG90eXBlO1xyXG4gIG9iai5leHRlbmRNZSA9IGZ1bmN0aW9uIGV4dGVuZE1lKCkge1xyXG4gICAgZXh0ZW5kLmFwcGx5KHRoaXMsIFt0aGlzXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xyXG4gIH07XHJcbiAgb2JqLmV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZEluc3RhbmNlKCkge1xyXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxyXG4gICAgICAvLyBJZiB0aGUgb2JqZWN0IHVzZWQgdG8gZXh0ZW5kIGZyb20gaXMgYSBmdW5jdGlvbiwgaXMgY29uc2lkZXJlZFxyXG4gICAgICAvLyBhIGNvbnN0cnVjdG9yLCB0aGVuIHdlIGV4dGVuZCBmcm9tIGl0cyBwcm90b3R5cGUsIG90aGVyd2lzZSBpdHNlbGYuXHJcbiAgICAgIGNvbnN0cnVjdG9yQSA9IHR5cGVvZiB0aGlzID09ICdmdW5jdGlvbicgPyB0aGlzIDogbnVsbCxcclxuICAgICAgYmFzZUEgPSBjb25zdHJ1Y3RvckEgPyB0aGlzLnByb3RvdHlwZSA6IHRoaXMsXHJcbiAgICAgIC8vIElmIGxhc3QgYXJndW1lbnQgaXMgYSBmdW5jdGlvbiwgaXMgY29uc2lkZXJlZCBhIGNvbnN0cnVjdG9yXHJcbiAgICAgIC8vIG9mIHRoZSBuZXcgY2xhc3Mvb2JqZWN0IHRoZW4gd2UgZXh0ZW5kIGl0cyBwcm90b3R5cGUuXHJcbiAgICAgIC8vIFdlIHVzZSBhbiBlbXB0eSBvYmplY3Qgb3RoZXJ3aXNlLlxyXG4gICAgICBjb25zdHJ1Y3RvckIgPSB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICdmdW5jdGlvbicgP1xyXG4gICAgICAgIGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSlbMF0gOlxyXG4gICAgICAgIG51bGwsXHJcbiAgICAgIGJhc2VCID0gY29uc3RydWN0b3JCID8gY29uc3RydWN0b3JCLnByb3RvdHlwZSA6IHt9O1xyXG5cclxuICAgIHZhciBleHRlbmRlZFJlc3VsdCA9IGV4dGVuZC5hcHBseSh0aGlzLCBbYmFzZUIsIGJhc2VBXS5jb25jYXQoYXJncykpO1xyXG4gICAgLy8gSWYgYm90aCBhcmUgY29uc3RydWN0b3JzLCB3ZSB3YW50IHRoZSBzdGF0aWMgbWV0aG9kcyB0byBiZSBjb3BpZWQgdG9vOlxyXG4gICAgaWYgKGNvbnN0cnVjdG9yQSAmJiBjb25zdHJ1Y3RvckIpXHJcbiAgICAgIGV4dGVuZChjb25zdHJ1Y3RvckIsIGNvbnN0cnVjdG9yQSk7XHJcblxyXG4gICAgLy8gSWYgd2UgYXJlIGV4dGVuZGluZyBhIGNvbnN0cnVjdG9yLCB3ZSByZXR1cm4gdGhhdCwgb3RoZXJ3aXNlIHRoZSByZXN1bHRcclxuICAgIHJldHVybiBjb25zdHJ1Y3RvckIgfHwgZXh0ZW5kZWRSZXN1bHQ7XHJcbiAgfTtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gIG1vZHVsZS5leHBvcnRzID0gZXh0ZW5kO1xyXG59IGVsc2Uge1xyXG4gIC8vIGdsb2JhbCBzY29wZVxyXG4gIGV4dGVuZC5wbHVnSW4oKTtcclxufVxyXG5cclxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgQ2xvbmUgVXRpbHNcclxuKi9cclxuZnVuY3Rpb24gY2xvbmVPYmplY3Qob2JqKSB7XHJcbiAgcmV0dXJuIGV4dGVuZCh7fSwgb2JqKTtcclxufVxyXG5cclxuLy8gVGVzdGluZyBpZiBhIHN0cmluZyBzZWVtcyBhIGZ1bmN0aW9uIHNvdXJjZSBjb2RlOlxyXG4vLyBXZSB0ZXN0IGFnYWlucyBhIHNpbXBsaXNpYyByZWd1bGFyIGV4cHJlc2lvbiB0aGF0IG1hdGNoXHJcbi8vIGEgY29tbW9uIHN0YXJ0IG9mIGZ1bmN0aW9uIGRlY2xhcmF0aW9uLlxyXG4vLyBPdGhlciB3YXlzIHRvIGRvIHRoaXMgaXMgYXQgaW52ZXJzZXIsIGJ5IGNoZWNraW5nXHJcbi8vIHRoYXQgdGhlIGZ1bmN0aW9uIHRvU3RyaW5nIGlzIG5vdCBhIGtub3dlZCB0ZXh0XHJcbi8vIGFzICdbb2JqZWN0IEZ1bmN0aW9uXScgb3IgJ1tuYXRpdmUgY29kZV0nLCBidXRcclxuLy8gc2luY2UgdGhhIGNhbiBjaGFuZ2VzIGJldHdlZW4gYnJvd3NlcnMsIGlzIG1vcmUgY29uc2VydmF0aXZlXHJcbi8vIGNoZWNrIGFnYWluc3QgYSBjb21tb24gY29uc3RydWN0IGFuIGZhbGxiYWNrIG9uIHRoZVxyXG4vLyBjb21tb24gc29sdXRpb24gaWYgbm90IG1hdGNoZXMuXHJcbnZhciB0ZXN0RnVuY3Rpb24gPSAvXlxccypmdW5jdGlvblteXFwoXVxcKC87XHJcblxyXG5mdW5jdGlvbiBjbG9uZUZ1bmN0aW9uKGZuKSB7XHJcbiAgdmFyIHRlbXA7XHJcbiAgdmFyIGNvbnRlbnRzID0gZm4udG9TdHJpbmcoKTtcclxuICAvLyBDb3B5IHRvIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBzYW1lIHByb3RvdHlwZSwgZm9yIHRoZSBub3QgJ293bmVkJyBwcm9wZXJ0aWVzLlxyXG4gIC8vIEFzc2luZ2VkIGF0IHRoZSBlbmRcclxuICB2YXIgdGVtcFByb3RvID0gT2JqZWN0LmNyZWF0ZShmbi5wcm90b3R5cGUpO1xyXG5cclxuICAvLyBESVNBQkxFRCB0aGUgY29udGVudHMtY29weSBwYXJ0IGJlY2F1c2UgaXQgZmFpbHMgd2l0aCBjbG9zdXJlc1xyXG4gIC8vIGdlbmVyYXRlZCBieSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24sIHVzaW5nIHRoZSBzdWItY2FsbCB3YXkgZXZlclxyXG4gIGlmICh0cnVlIHx8ICF0ZXN0RnVuY3Rpb24udGVzdChjb250ZW50cykpIHtcclxuICAgIC8vIENoZWNrIGlmIGlzIGFscmVhZHkgYSBjbG9uZWQgY29weSwgdG9cclxuICAgIC8vIHJldXNlIHRoZSBvcmlnaW5hbCBjb2RlIGFuZCBhdm9pZCBtb3JlIHRoYW5cclxuICAgIC8vIG9uZSBkZXB0aCBpbiBzdGFjayBjYWxscyAoZ3JlYXQhKVxyXG4gICAgaWYgKHR5cGVvZiBmbi5wcm90b3R5cGUuX19fY2xvbmVkX29mID09ICdmdW5jdGlvbicpXHJcbiAgICAgIGZuID0gZm4ucHJvdG90eXBlLl9fX2Nsb25lZF9vZjtcclxuXHJcbiAgICB0ZW1wID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZm4uYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7IH07XHJcblxyXG4gICAgLy8gU2F2ZSBtYXJrIGFzIGNsb25lZC4gRG9uZSBpbiBpdHMgcHJvdG90eXBlXHJcbiAgICAvLyB0byBub3QgYXBwZWFyIGluIHRoZSBsaXN0IG9mICdvd25lZCcgcHJvcGVydGllcy5cclxuICAgIHRlbXBQcm90by5fX19jbG9uZWRfb2YgPSBmbjtcclxuICAgIC8vIFJlcGxhY2UgdG9TdHJpbmcgdG8gcmV0dXJuIHRoZSBvcmlnaW5hbCBzb3VyY2U6XHJcbiAgICB0ZW1wUHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBmbi50b1N0cmluZygpO1xyXG4gICAgfTtcclxuICAgIC8vIFRoZSBuYW1lIGNhbm5vdCBiZSBzZXQsIHdpbGwganVzdCBiZSBhbm9ueW1vdXNcclxuICAgIC8vdGVtcC5uYW1lID0gdGhhdC5uYW1lO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBUaGlzIHdheSBvbiBjYXBhYmxlIGJyb3dzZXJzIHByZXNlcnZlIHRoZSBvcmlnaW5hbCBuYW1lLFxyXG4gICAgLy8gZG8gYSByZWFsIGluZGVwZW5kZW50IGNvcHkgYW5kIGF2b2lkIGZ1bmN0aW9uIHN1YmNhbGxzIHRoYXRcclxuICAgIC8vIGNhbiBkZWdyYXRlIHBlcmZvcm1hbmNlIGFmdGVyIGxvdCBvZiAnY2xvbm5pbmcnLlxyXG4gICAgdmFyIGYgPSBGdW5jdGlvbjtcclxuICAgIHRlbXAgPSAobmV3IGYoJ3JldHVybiAnICsgY29udGVudHMpKSgpO1xyXG4gIH1cclxuXHJcbiAgdGVtcC5wcm90b3R5cGUgPSB0ZW1wUHJvdG87XHJcbiAgLy8gQ29weSBhbnkgcHJvcGVydGllcyBpdCBvd25zXHJcbiAgZXh0ZW5kKHRlbXAsIGZuKTtcclxuXHJcbiAgcmV0dXJuIHRlbXA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsb25lUGx1Z0luKCkge1xyXG4gIGlmICh0eXBlb2YgRnVuY3Rpb24ucHJvdG90eXBlLmNsb25lICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBGdW5jdGlvbi5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSgpIHsgcmV0dXJuIGNsb25lRnVuY3Rpb24odGhpcyk7IH07XHJcbiAgfVxyXG4gIGlmICh0eXBlb2YgT2JqZWN0LnByb3RvdHlwZS5jbG9uZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgT2piZWN0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkgeyByZXR1cm4gY2xvbmVPYmplY3QodGhpcyk7IH07XHJcbiAgfVxyXG59XHJcblxyXG5leHRlbmQuY2xvbmVPYmplY3QgPSBjbG9uZU9iamVjdDtcclxuZXh0ZW5kLmNsb25lRnVuY3Rpb24gPSBjbG9uZUZ1bmN0aW9uO1xyXG5leHRlbmQuY2xvbmVQbHVnSW4gPSBjbG9uZVBsdWdJbjtcclxuIiwiLyoqXHJcbiogQ29va2llcyBtYW5hZ2VtZW50LlxyXG4qIE1vc3QgY29kZSBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQ4MjU2OTUvMTYyMjM0NlxyXG4qL1xyXG52YXIgQ29va2llID0ge307XHJcblxyXG5Db29raWUuc2V0ID0gZnVuY3Rpb24gc2V0Q29va2llKG5hbWUsIHZhbHVlLCBkYXlzKSB7XHJcbiAgICB2YXIgZXhwaXJlcyA9IFwiXCI7XHJcbiAgICBpZiAoZGF5cykge1xyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldFRpbWUoZGF0ZS5nZXRUaW1lKCkgKyAoZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApKTtcclxuICAgICAgICBleHBpcmVzID0gXCI7IGV4cGlyZXM9XCIgKyBkYXRlLnRvR01UU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsgXCI9XCIgKyB2YWx1ZSArIGV4cGlyZXMgKyBcIjsgcGF0aD0vXCI7XHJcbn07XHJcbkNvb2tpZS5nZXQgPSBmdW5jdGlvbiBnZXRDb29raWUoY19uYW1lKSB7XHJcbiAgICBpZiAoZG9jdW1lbnQuY29va2llLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjX3N0YXJ0ID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoY19uYW1lICsgXCI9XCIpO1xyXG4gICAgICAgIGlmIChjX3N0YXJ0ICE9IC0xKSB7XHJcbiAgICAgICAgICAgIGNfc3RhcnQgPSBjX3N0YXJ0ICsgY19uYW1lLmxlbmd0aCArIDE7XHJcbiAgICAgICAgICAgIGNfZW5kID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoXCI7XCIsIGNfc3RhcnQpO1xyXG4gICAgICAgICAgICBpZiAoY19lbmQgPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGNfZW5kID0gZG9jdW1lbnQuY29va2llLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdW5lc2NhcGUoZG9jdW1lbnQuY29va2llLnN1YnN0cmluZyhjX3N0YXJ0LCBjX2VuZCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBcIlwiO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDb29raWU7IiwiLyoqIENvbm5lY3QgYWNjb3VudCB3aXRoIEZhY2Vib29rXHJcbioqL1xyXG52YXJcclxuICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKSxcclxuICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpLFxyXG4gIExjVXJsID0gcmVxdWlyZSgnLi9MY1VybCcpLFxyXG4gIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmZ1bmN0aW9uIEZhY2Vib29rQ29ubmVjdChvcHRpb25zKSB7XHJcbiAgJC5leHRlbmQodGhpcywgb3B0aW9ucyk7XHJcbiAgaWYgKCEkKCcjZmItcm9vdCcpLmxlbmd0aClcclxuICAgICQoJzxkaXYgaWQ9XCJmYi1yb290XCIgc3R5bGU9XCJkaXNwbGF5OiBub25lXCI+PC9kaXY+JykuYXBwZW5kVG8oJ2JvZHknKTtcclxufVxyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZSA9IHtcclxuICBhcHBJZDogbnVsbCxcclxuICBsYW5nOiAnZW5fVVMnLFxyXG4gIHJlc3VsdFR5cGU6ICdqc29uJywgLy8gJ3JlZGlyZWN0J1xyXG4gIGZiVXJsQmFzZTogJy8vY29ubmVjdC5mYWNlYm9vay5uZXQvQChsYW5nKS9hbGwuanMnLFxyXG4gIHNlcnZlclVybEJhc2U6IExjVXJsLkxhbmdQYXRoICsgJ0FjY291bnQvRmFjZWJvb2svQCh1cmxTZWN0aW9uKS8/UmVkaXJlY3Q9QChyZWRpcmVjdFVybCkmcHJvZmlsZT1AKHByb2ZpbGVVcmwpJyxcclxuICByZWRpcmVjdFVybDogJycsXHJcbiAgcHJvZmlsZVVybDogJycsXHJcbiAgdXJsU2VjdGlvbjogJycsXHJcbiAgbG9hZGluZ1RleHQ6ICdWZXJpZmluZycsXHJcbiAgcGVybWlzc2lvbnM6ICcnLFxyXG4gIGxpYkxvYWRlZEV2ZW50OiAnRmFjZWJvb2tDb25uZWN0TGliTG9hZGVkJyxcclxuICBjb25uZWN0ZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdENvbm5lY3RlZCdcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuZ2V0RmJVcmwgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5mYlVybEJhc2UucmVwbGFjZSgvQFxcKGxhbmdcXCkvZywgdGhpcy5sYW5nKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuZ2V0U2VydmVyVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuc2VydmVyVXJsQmFzZVxyXG4gIC5yZXBsYWNlKC9AXFwocmVkaXJlY3RVcmxcXCkvZywgdGhpcy5yZWRpcmVjdFVybClcclxuICAucmVwbGFjZSgvQFxcKHByb2ZpbGVVcmxcXCkvZywgdGhpcy5wcm9maWxlVXJsKVxyXG4gIC5yZXBsYWNlKC9AXFwodXJsU2VjdGlvblxcKS9nLCB0aGlzLnVybFNlY3Rpb24pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5sb2FkTGliID0gZnVuY3Rpb24gKCkge1xyXG4gIC8vIE9ubHkgaWYgaXMgbm90IGxvYWRlZCBzdGlsbFxyXG4gIC8vIChGYWNlYm9vayBzY3JpcHQgYXR0YWNoIGl0c2VsZiBhcyB0aGUgZ2xvYmFsIHZhcmlhYmxlICdGQicpXHJcbiAgaWYgKCF3aW5kb3cuRkIgJiYgIXRoaXMuX2xvYWRpbmdMaWIpIHtcclxuICAgIHRoaXMuX2xvYWRpbmdMaWIgPSB0cnVlO1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICBzY3JpcHRzOiBbdGhpcy5nZXRGYlVybCgpXSxcclxuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBGQi5pbml0KHsgYXBwSWQ6IHRoYXQuYXBwSWQsIHN0YXR1czogdHJ1ZSwgY29va2llOiB0cnVlLCB4ZmJtbDogdHJ1ZSB9KTtcclxuICAgICAgICB0aGF0LmxvYWRpbmdMaWIgPSBmYWxzZTtcclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoYXQubGliTG9hZGVkRXZlbnQpO1xyXG4gICAgICB9LFxyXG4gICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5GQjtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5wcm9jZXNzUmVzcG9uc2UgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICBpZiAocmVzcG9uc2UuYXV0aFJlc3BvbnNlKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IFdlbGNvbWUhJyk7XHJcbiAgICB2YXIgdXJsID0gdGhpcy5nZXRTZXJ2ZXJVcmwoKTtcclxuICAgIGlmICh0aGlzLnJlc3VsdFR5cGUgPT0gXCJyZWRpcmVjdFwiKSB7XHJcbiAgICAgIHJlZGlyZWN0VG8odXJsKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwianNvblwiKSB7XHJcbiAgICAgIHBvcHVwKHVybCwgJ3NtYWxsJywgbnVsbCwgdGhpcy5sb2FkaW5nVGV4dCk7XHJcbiAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIodGhpcy5jb25uZWN0ZWRFdmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLypGQi5hcGkoJy9tZScsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogR29vZCB0byBzZWUgeW91LCAnICsgcmVzcG9uc2UubmFtZSArICcuJyk7XHJcbiAgICB9KTsqL1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IFVzZXIgY2FuY2VsbGVkIGxvZ2luIG9yIGRpZCBub3QgZnVsbHkgYXV0aG9yaXplLicpO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUub25MaWJSZWFkeSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gIGlmICh3aW5kb3cuRkIpXHJcbiAgICBjYWxsYmFjaygpO1xyXG4gIGVsc2Uge1xyXG4gICAgdGhpcy5sb2FkTGliKCk7XHJcbiAgICAkKGRvY3VtZW50KS5vbih0aGlzLmxpYkxvYWRlZEV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB0aGlzLm9uTGliUmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgRkIubG9naW4oJC5wcm94eSh0aGF0LnByb2Nlc3NSZXNwb25zZSwgdGhhdCksIHsgc2NvcGU6IHRoYXQucGVybWlzc2lvbnMgfSk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmF1dG9Db25uZWN0T24gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdjbGljaycsIHNlbGVjdG9yIHx8ICdhLmZhY2Vib29rLWNvbm5lY3QnLCAkLnByb3h5KHRoaXMuY29ubmVjdCwgdGhpcykpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGYWNlYm9va0Nvbm5lY3Q7IiwiLyoqIEltcGxlbWVudHMgYSBzaW1pbGFyIExjVXJsIG9iamVjdCBsaWtlIHRoZSBzZXJ2ZXItc2lkZSBvbmUsIGJhc2luZ1xyXG4gICAgaW4gdGhlIGluZm9ybWF0aW9uIGF0dGFjaGVkIHRvIHRoZSBkb2N1bWVudCBhdCAnaHRtbCcgdGFnIGluIHRoZSBcclxuICAgICdkYXRhLWJhc2UtdXJsJyBhdHRyaWJ1dGUgKHRoYXRzIHZhbHVlIGlzIHRoZSBlcXVpdmFsZW50IGZvciBBcHBQYXRoKSxcclxuICAgIGFuZCB0aGUgbGFuZyBpbmZvcm1hdGlvbiBhdCAnZGF0YS1jdWx0dXJlJy5cclxuICAgIFRoZSByZXN0IG9mIFVSTHMgYXJlIGJ1aWx0IGZvbGxvd2luZyB0aGUgd2luZG93LmxvY2F0aW9uIGFuZCBzYW1lIHJ1bGVzXHJcbiAgICB0aGFuIGluIHRoZSBzZXJ2ZXItc2lkZSBvYmplY3QuXHJcbioqL1xyXG5cclxudmFyIGJhc2UgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWJhc2UtdXJsJyksXHJcbiAgICBsYW5nID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1jdWx0dXJlJyksXHJcbiAgICBsID0gd2luZG93LmxvY2F0aW9uLFxyXG4gICAgdXJsID0gbC5wcm90b2NvbCArICcvLycgKyBsLmhvc3Q7XHJcbi8vIGxvY2F0aW9uLmhvc3QgaW5jbHVkZXMgcG9ydCwgaWYgaXMgbm90IHRoZSBkZWZhdWx0LCB2cyBsb2NhdGlvbi5ob3N0bmFtZVxyXG5cclxuYmFzZSA9IGJhc2UgfHwgJy8nO1xyXG5cclxudmFyIExjVXJsID0ge1xyXG4gICAgU2l0ZVVybDogdXJsLFxyXG4gICAgQXBwUGF0aDogYmFzZSxcclxuICAgIEFwcFVybDogdXJsICsgYmFzZSxcclxuICAgIExhbmdJZDogbGFuZyxcclxuICAgIExhbmdQYXRoOiBiYXNlICsgbGFuZyArICcvJyxcclxuICAgIExhbmdVcmw6IHVybCArIGJhc2UgKyBsYW5nXHJcbn07XHJcbkxjVXJsLkxhbmdVcmwgPSB1cmwgKyBMY1VybC5MYW5nUGF0aDtcclxuTGNVcmwuSnNvblBhdGggPSBMY1VybC5MYW5nUGF0aCArICdKU09OLyc7XHJcbkxjVXJsLkpzb25VcmwgPSB1cmwgKyBMY1VybC5Kc29uUGF0aDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGNVcmw7IiwiLyogTG9jb25vbWljcyBzcGVjaWZpYyBQcmljZSwgZmVlcyBhbmQgaG91ci1wcmljZSBjYWxjdWxhdGlvblxyXG4gICAgdXNpbmcgc29tZSBzdGF0aWMgbWV0aG9kcyBhbmQgdGhlIFByaWNlIGNsYXNzLlxyXG4qL1xyXG52YXIgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuLyogQ2xhc3MgUHJpY2UgdG8gY2FsY3VsYXRlIGEgdG90YWwgcHJpY2UgYmFzZWQgb24gZmVlcyBpbmZvcm1hdGlvbiAoZml4ZWQgYW5kIHJhdGUpXHJcbiAgICBhbmQgZGVzaXJlZCBkZWNpbWFscyBmb3IgYXBwcm94aW1hdGlvbnMuXHJcbiovXHJcbmZ1bmN0aW9uIFByaWNlKGJhc2VQcmljZSwgZmVlLCByb3VuZGVkRGVjaW1hbHMpIHtcclxuICAgIC8vIGZlZSBwYXJhbWV0ZXIgY2FuIGJlIGEgZmxvYXQgbnVtYmVyIHdpdGggdGhlIGZlZVJhdGUgb3IgYW4gb2JqZWN0XHJcbiAgICAvLyB0aGF0IGluY2x1ZGVzIGJvdGggYSBmZWVSYXRlIGFuZCBhIGZpeGVkRmVlQW1vdW50XHJcbiAgICAvLyBFeHRyYWN0aW5nIGZlZSB2YWx1ZXMgaW50byBsb2NhbCB2YXJzOlxyXG4gICAgdmFyIGZlZVJhdGUgPSAwLCBmaXhlZEZlZUFtb3VudCA9IDA7XHJcbiAgICBpZiAoZmVlLmZpeGVkRmVlQW1vdW50IHx8IGZlZS5mZWVSYXRlKSB7XHJcbiAgICAgICAgZml4ZWRGZWVBbW91bnQgPSBmZWUuZml4ZWRGZWVBbW91bnQgfHwgMDtcclxuICAgICAgICBmZWVSYXRlID0gZmVlLmZlZVJhdGUgfHwgMDtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGZlZVJhdGUgPSBmZWU7XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRpbmc6XHJcbiAgICAvLyBUaGUgcm91bmRUbyB3aXRoIGEgYmlnIGZpeGVkIGRlY2ltYWxzIGlzIHRvIGF2b2lkIHRoZVxyXG4gICAgLy8gZGVjaW1hbCBlcnJvciBvZiBmbG9hdGluZyBwb2ludCBudW1iZXJzXHJcbiAgICB2YXIgdG90YWxQcmljZSA9IG11LmNlaWxUbyhtdS5yb3VuZFRvKGJhc2VQcmljZSAqICgxICsgZmVlUmF0ZSkgKyBmaXhlZEZlZUFtb3VudCwgMTIpLCByb3VuZGVkRGVjaW1hbHMpO1xyXG4gICAgLy8gZmluYWwgZmVlIHByaWNlIGlzIGNhbGN1bGF0ZWQgYXMgYSBzdWJzdHJhY3Rpb24sIGJ1dCBiZWNhdXNlIGphdmFzY3JpcHQgaGFuZGxlc1xyXG4gICAgLy8gZmxvYXQgbnVtYmVycyBvbmx5LCBhIHJvdW5kIG9wZXJhdGlvbiBpcyByZXF1aXJlZCB0byBhdm9pZCBhbiBpcnJhdGlvbmFsIG51bWJlclxyXG4gICAgdmFyIGZlZVByaWNlID0gbXUucm91bmRUbyh0b3RhbFByaWNlIC0gYmFzZVByaWNlLCAyKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBvYmplY3Qgd2l0aCBmdWxsIGRldGFpbHM6XHJcbiAgICB0aGlzLmJhc2VQcmljZSA9IGJhc2VQcmljZTtcclxuICAgIHRoaXMuZmVlUmF0ZSA9IGZlZVJhdGU7XHJcbiAgICB0aGlzLmZpeGVkRmVlQW1vdW50ID0gZml4ZWRGZWVBbW91bnQ7XHJcbiAgICB0aGlzLnJvdW5kZWREZWNpbWFscyA9IHJvdW5kZWREZWNpbWFscztcclxuICAgIHRoaXMudG90YWxQcmljZSA9IHRvdGFsUHJpY2U7XHJcbiAgICB0aGlzLmZlZVByaWNlID0gZmVlUHJpY2U7XHJcbn1cclxuXHJcbi8qKiBDYWxjdWxhdGUgYW5kIHJldHVybnMgdGhlIHByaWNlIGFuZCByZWxldmFudCBkYXRhIGFzIGFuIG9iamVjdCBmb3JcclxudGltZSwgaG91cmx5UmF0ZSAod2l0aCBmZWVzKSBhbmQgdGhlIGhvdXJseUZlZS5cclxuVGhlIHRpbWUgKEBkdXJhdGlvbikgaXMgdXNlZCAnYXMgaXMnLCB3aXRob3V0IHRyYW5zZm9ybWF0aW9uLCBtYXliZSB5b3UgY2FuIHJlcXVpcmVcclxudXNlIExDLnJvdW5kVGltZVRvUXVhcnRlckhvdXIgYmVmb3JlIHBhc3MgdGhlIGR1cmF0aW9uIHRvIHRoaXMgZnVuY3Rpb24uXHJcbkl0IHJlY2VpdmVzIHRoZSBwYXJhbWV0ZXJzIEBob3VybHlQcmljZSBhbmQgQHN1cmNoYXJnZVByaWNlIGFzIExDLlByaWNlIG9iamVjdHMuXHJcbkBzdXJjaGFyZ2VQcmljZSBpcyBvcHRpb25hbC5cclxuKiovXHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZUhvdXJseVByaWNlKGR1cmF0aW9uLCBob3VybHlQcmljZSwgc3VyY2hhcmdlUHJpY2UpIHtcclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIHN1cmNoYXJnZSwgZ2V0IHplcm9zXHJcbiAgICBzdXJjaGFyZ2VQcmljZSA9IHN1cmNoYXJnZVByaWNlIHx8IHsgdG90YWxQcmljZTogMCwgZmVlUHJpY2U6IDAsIGJhc2VQcmljZTogMCB9O1xyXG4gICAgLy8gR2V0IGhvdXJzIGZyb20gcm91bmRlZCBkdXJhdGlvbjpcclxuICAgIHZhciBob3VycyA9IG11LnJvdW5kVG8oZHVyYXRpb24udG90YWxIb3VycygpLCAyKTtcclxuICAgIC8vIENhbGN1bGF0ZSBmaW5hbCBwcmljZXNcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG90YWxQcmljZTogICAgIG11LnJvdW5kVG8oaG91cmx5UHJpY2UudG90YWxQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UudG90YWxQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBmZWVQcmljZTogICAgICAgbXUucm91bmRUbyhob3VybHlQcmljZS5mZWVQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UuZmVlUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgc3VidG90YWxQcmljZTogIG11LnJvdW5kVG8oaG91cmx5UHJpY2UuYmFzZVByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS5iYXNlUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgZHVyYXRpb25Ib3VyczogIGhvdXJzXHJcbiAgICB9O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBQcmljZTogUHJpY2UsXHJcbiAgICAgICAgY2FsY3VsYXRlSG91cmx5UHJpY2U6IGNhbGN1bGF0ZUhvdXJseVByaWNlXHJcbiAgICB9OyIsIi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjU5MzYzNy9ob3ctdG8tZXNjYXBlLXJlZ3VsYXItZXhwcmVzc2lvbi1pbi1qYXZhc2NyaXB0XHJcblJlZ0V4cC5xdW90ZSA9IGZ1bmN0aW9uIChzdHIpIHtcclxuICByZXR1cm4gKHN0ciArICcnKS5yZXBsYWNlKC8oWy4/KiteJFtcXF1cXFxcKCl7fXwtXSkvZywgXCJcXFxcJDFcIik7XHJcbn07XHJcbiIsIi8qKlxyXG4gIEEgdmVyeSBzaW1wbGUgc2xpZGVyIGltcGxlbWVudGF0aW9uIGluaXRpYWxseSBjcmVhdGVkXHJcbiAgZm9yIHRoZSBwcm92aWRlci13ZWxjb21lIGxhbmRpbmcgcGFnZSBhbmRcclxuICBvdGhlciBzaW1pbGFyIHVzZXMuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL1JlZ0V4cC5xdW90ZScpO1xyXG5cclxudmFyIFNpbXBsZVNsaWRlciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gU2ltcGxlU2xpZGVyKG9wdHMpIHtcclxuICAkLmV4dGVuZCh0cnVlLCB0aGlzLCBvcHRzKTtcclxuXHJcbiAgdGhpcy5lbGVtZW50ID0gJCh0aGlzLmVsZW1lbnQpO1xyXG4gIHRoaXMuY3VycmVudEluZGV4ID0gMDtcclxuXHJcbiAgLyoqXHJcbiAgQWN0aW9ucyBoYW5kbGVyIHRvIG1vdmUgc2xpZGVzXHJcbiAgKiovXHJcbiAgdmFyIGNoZWNrSHJlZiA9IG5ldyBSZWdFeHAoJ14jJyArIFJlZ0V4cC5xdW90ZSh0aGlzLmhyZWZQcmVmaXgpICsgJyguKiknKSxcclxuICAgIHRoYXQgPSB0aGlzO1xyXG4gIHRoaXMuZWxlbWVudC5vbignY2xpY2snLCAnYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBocmVmID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcclxuICAgIHZhciByZXMgPSBjaGVja0hyZWYuZXhlYyhocmVmKTtcclxuXHJcbiAgICBpZiAocmVzICYmIHJlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIHZhciBpbmRleCA9IHJlc1sxXTtcclxuICAgICAgaWYgKGluZGV4ID09ICdwcmV2aW91cycpIHtcclxuICAgICAgICB0aGF0LmdvU2xpZGUodGhhdC5jdXJyZW50SW5kZXggLSAxKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChpbmRleCA9PSAnbmV4dCcpIHtcclxuICAgICAgICB0aGF0LmdvU2xpZGUodGhhdC5jdXJyZW50SW5kZXggKyAxKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICgvXFxkKy8udGVzdChpbmRleCkpIHtcclxuICAgICAgICB0aGF0LmdvU2xpZGUocGFyc2VJbnQoaW5kZXgpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICBNZXRob2Q6IERvIGFsbCB0aGUgc2V0dXAgb24gc2xpZGVyIGFuZCBzbGlkZXNcclxuICB0byBlbnN1cmUgdGhlIG1vdmVtZW50IHdpbGwgd29yayBmaW5lLlxyXG4gIEl0cyBkb25lIGF1dG9tYXRpYyBvblxyXG4gIGluaXRpYWxpemluZywgaXMganVzdCBhIHB1YmxpYyBtZXRob2QgZm9yIFxyXG4gIGNvbnZlbmllbmNlIChtYXliZSB0byBiZSBjYWxsIGlmIHNsaWRlcyBhcmVcclxuICBhZGRlZC9yZW1vdmVkIGFmdGVyIGluaXQpLlxyXG4gICoqL1xyXG4gIHRoaXMucmVkcmF3ID0gZnVuY3Rpb24gc2xpZGVzUmVwb3NpdGlvbigpIHtcclxuICAgIHZhciBzbGlkZXMgPSB0aGlzLmdldFNsaWRlcygpLFxyXG4gICAgICBjID0gdGhpcy5nZXRTbGlkZXNDb250YWluZXIoKTtcclxuICAgIC8vIExvb2sgZm9yIHRoZSBjb250YWluZXIgc2l6ZSwgZnJvbSB0aGUgXHJcbiAgICAvLyBiaWdnZXIgc2xpZGU6XHJcbiAgICB2YXIgXHJcbiAgICAgIHcgPSAwLFxyXG4gICAgICBoID0gMDtcclxuICAgIHNsaWRlcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIFxyXG4gICAgICAgIHQgPSAkKHRoaXMpLFxyXG4gICAgICAgIHR3ID0gdC5vdXRlcldpZHRoKCksXHJcbiAgICAgICAgdGggPSB0Lm91dGVySGVpZ2h0KCk7XHJcbiAgICAgIGlmICh0dyA+IHcpXHJcbiAgICAgICAgdyA9IHR3O1xyXG4gICAgICBpZiAodGggPiBoKVxyXG4gICAgICAgIGggPSB0aDtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENTUyBzZXR1cCwgXHJcbiAgICAvLyBhbGwgc2xpZGVzIGluIHRoZSBzYW1lIGxpbmUsXHJcbiAgICAvLyBhbGwgd2l0aCBzYW1lIHNpemUgKGV4dHJhIHNwYWNpbmcgY2FuXHJcbiAgICAvLyBiZSBnaXZlbiB3aXRoIENTUylcclxuICAgIGMuY3NzKHtcclxuICAgICAgd2lkdGg6IHcgLSAoYy5vdXRlcldpZHRoKCkgLSBjLndpZHRoKCkpLFxyXG4gICAgICAvL2hlaWdodDogaCAtIChjLm91dGVySGVpZ2h0KCkgLSBjLmhlaWdodCgpKSxcclxuICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXHJcbiAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcclxuICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCdcclxuICAgIH0pO1xyXG5cclxuICAgIHNsaWRlcy5jc3Moe1xyXG4gICAgICB3aGl0ZVNwYWNlOiAnbm9ybWFsJyxcclxuICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaydcclxuICAgIH0pLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgIHQuY3NzKHtcclxuICAgICAgICB3aWR0aDogdyAtICh0Lm91dGVyV2lkdGgoKSAtIHQud2lkdGgoKSlcclxuICAgICAgICAvLyxoZWlnaHQ6IGggLSAodC5vdXRlckhlaWdodCgpIC0gdC5oZWlnaHQoKSlcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZXBvc2l0aW9uYXRlIGF0IHRoZSBiZWdnaW5pbmc6XHJcbiAgICBjWzBdLnNjcm9sbExlZnQgPSAwO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICBNZXRob2Q6IEdvIHRvIGEgc2xpZGUgYnkgaW5kZXhcclxuICAqKi9cclxuICB0aGlzLmdvU2xpZGUgPSBmdW5jdGlvbiBnb1NsaWRlKGluZGV4KSB7XHJcbiAgICB2YXIgcHJldiA9IHRoaXMuY3VycmVudEluZGV4O1xyXG4gICAgaWYgKHByZXYgPT0gaW5kZXgpXHJcbiAgICAgIHJldHVybjtcclxuXHJcbiAgICAvLyBDaGVjayBib3VuZHNcclxuICAgIGlmIChpbmRleCA8IDEpXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIHZhciBzbGlkZXMgPSB0aGlzLmdldFNsaWRlcygpO1xyXG4gICAgaWYgKGluZGV4ID4gc2xpZGVzLmxlbmd0aClcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIC8vIEdvb2QgaW5kZXgsIHNldCBhcyBjdXJyZW50XHJcbiAgICB0aGlzLmN1cnJlbnRJbmRleCA9IGluZGV4O1xyXG4gICAgLy8gU2V0IGxpbmtzIHRvIHRoaXMgYXMgY3VycmVudCwgcmVtb3ZpbmcgYW55IHByZXZpb3VzOlxyXG4gICAgdGhpcy5lbGVtZW50LmZpbmQoJ1tocmVmPSMnICsgdGhpcy5ocmVmUHJlZml4ICsgaW5kZXggKyAnXScpXHJcbiAgICAuYWRkQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcylcclxuICAgIC5wYXJlbnQoJ2xpJykuYWRkQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcyk7XHJcbiAgICB0aGlzLmVsZW1lbnQuZmluZCgnW2hyZWY9IycgKyB0aGlzLmhyZWZQcmVmaXggKyBwcmV2ICsgJ10nKVxyXG4gICAgLnJlbW92ZUNsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpXHJcbiAgICAucGFyZW50KCdsaScpLnJlbW92ZUNsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpO1xyXG5cclxuICAgIHZhciBcclxuICAgICAgc2xpZGUgPSAkKHNsaWRlcy5nZXQoaW5kZXggLSAxKSksXHJcbiAgICAgIGMgPSB0aGlzLmdldFNsaWRlc0NvbnRhaW5lcigpLFxyXG4gICAgICBsZWZ0ID0gYy5zY3JvbGxMZWZ0KCkgKyBzbGlkZS5wb3NpdGlvbigpLmxlZnQ7XHJcblxyXG4gICAgYy5zdG9wKCkuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IGxlZnQgfSwgdGhpcy5kdXJhdGlvbik7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR2V0IHRoZSBqUXVlcnkgY29sbGVjdGlvbiBvZiBzbGlkZXNcclxuICAqKi9cclxuICB0aGlzLmdldFNsaWRlcyA9IGZ1bmN0aW9uIGdldFNsaWRlcygpIHtcclxuICAgIHJldHVybiB0aGlzLmVsZW1lbnRcclxuICAgIC5maW5kKHRoaXMuc2VsZWN0b3JzLnNsaWRlcylcclxuICAgIC5maW5kKHRoaXMuc2VsZWN0b3JzLnNsaWRlKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICBNZXRob2Q6IEdldCB0aGUgalF1ZXJ5IGVsZW1lbnQgZm9yIHRoZSBjb250YWluZXIgb2Ygc2xpZGVzXHJcbiAgKiovXHJcbiAgdGhpcy5nZXRTbGlkZXNDb250YWluZXIgPSBmdW5jdGlvbiBnZXRTbGlkZXNDb250YWluZXIoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50XHJcbiAgICAuZmluZCh0aGlzLnNlbGVjdG9ycy5zbGlkZXMpO1xyXG4gIH07XHJcblxyXG4gIC8qKiBMYXN0IGluaXQgc3RlcHNcclxuICAqKi9cclxuICB0aGlzLnJlZHJhdygpO1xyXG59O1xyXG5cclxuU2ltcGxlU2xpZGVyLnByb3RvdHlwZSA9IHtcclxuICBlbGVtZW50OiBudWxsLFxyXG4gIHNlbGVjdG9yczoge1xyXG4gICAgc2xpZGVzOiAnLnNsaWRlcycsXHJcbiAgICBzbGlkZTogJ2xpLnNsaWRlJ1xyXG4gIH0sXHJcbiAgY3VycmVudFNsaWRlQ2xhc3M6ICdqcy1pc0N1cnJlbnQnLFxyXG4gIGhyZWZQcmVmaXg6ICdnb1NsaWRlXycsXHJcbiAgLy8gRHVyYXRpb24gb2YgZWFjaCBzbGlkZSBpbiBtaWxsaXNlY29uZHNcclxuICBkdXJhdGlvbjogMTAwMFxyXG59OyIsIi8qKiBQb2x5ZmlsbCBmb3Igc3RyaW5nLmNvbnRhaW5zXHJcbioqL1xyXG5pZiAoISgnY29udGFpbnMnIGluIFN0cmluZy5wcm90b3R5cGUpKVxyXG4gICAgU3RyaW5nLnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChzdHIsIHN0YXJ0SW5kZXgpIHsgcmV0dXJuIC0xICE9PSB0aGlzLmluZGV4T2Yoc3RyLCBzdGFydEluZGV4KTsgfTsiLCIvKiogPT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBBIHNpbXBsZSBTdHJpbmcgRm9ybWF0XHJcbiAqIGZ1bmN0aW9uIGZvciBqYXZhc2NyaXB0XHJcbiAqIEF1dGhvcjogSWFnbyBMb3JlbnpvIFNhbGd1ZWlyb1xyXG4gKiBNb2R1bGU6IENvbW1vbkpTXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN0cmluZ0Zvcm1hdCgpIHtcclxuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuXHR2YXIgZm9ybWF0dGVkID0gYXJnc1swXTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCdcXFxceycraSsnXFxcXH0nLCAnZ2knKTtcclxuXHRcdGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5yZXBsYWNlKHJlZ2V4cCwgYXJnc1tpKzFdKTtcclxuXHR9XHJcblx0cmV0dXJuIGZvcm1hdHRlZDtcclxufTsiLCIvKipcclxuICAgIEdlbmVyYWwgYXV0by1sb2FkIHN1cHBvcnQgZm9yIHRhYnM6IFxyXG4gICAgSWYgdGhlcmUgaXMgbm8gY29udGVudCB3aGVuIGZvY3VzZWQsIHRoZXkgdXNlIHRoZSAncmVsb2FkJyBqcXVlcnkgcGx1Z2luXHJcbiAgICB0byBsb2FkIGl0cyBjb250ZW50IC10YWJzIG5lZWQgdG8gYmUgY29uZmlndXJlZCB3aXRoIGRhdGEtc291cmNlLXVybCBhdHRyaWJ1dGVcclxuICAgIGluIG9yZGVyIHRvIGtub3cgd2hlcmUgdG8gZmV0Y2ggdGhlIGNvbnRlbnQtLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9qcXVlcnkucmVsb2FkJyk7XHJcblxyXG4vLyBEZXBlbmRlbmN5IFRhYmJlZFVYIGZyb20gRElcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKFRhYmJlZFVYKSB7XHJcbiAgICAvLyBUYWJiZWRVWC5zZXR1cC50YWJCb2R5U2VsZWN0b3IgfHwgJy50YWItYm9keSdcclxuICAgICQoJy50YWItYm9keScpLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCR0LmNoaWxkcmVuKCkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAkdC5yZWxvYWQoKTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgVGhpcyBhZGRzIG5vdGlmaWNhdGlvbnMgdG8gdGFicyBmcm9tIHRoZSBUYWJiZWRVWCBzeXN0ZW0gdXNpbmdcclxuICAgIHRoZSBjaGFuZ2VzTm90aWZpY2F0aW9uIHV0aWxpdHkgdGhhdCBkZXRlY3RzIG5vdCBzYXZlZCBjaGFuZ2VzIG9uIGZvcm1zLFxyXG4gICAgc2hvd2luZyB3YXJuaW5nIG1lc3NhZ2VzIHRvIHRoZVxyXG4gICAgdXNlciBhbmQgbWFya2luZyB0YWJzIChhbmQgc3ViLXRhYnMgLyBwYXJlbnQtdGFicyBwcm9wZXJseSkgdG9cclxuICAgIGRvbid0IGxvc3QgY2hhbmdlcyBtYWRlLlxyXG4gICAgQSBiaXQgb2YgQ1NTIGZvciB0aGUgYXNzaWduZWQgY2xhc3NlcyB3aWxsIGFsbG93IGZvciB2aXN1YWwgbWFya3MuXHJcblxyXG4gICAgQUtBOiBEb24ndCBsb3N0IGRhdGEhIHdhcm5pbmcgbWVzc2FnZSA7LSlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxuXHJcbi8vIFRhYmJlZFVYIGRlcGVuZGVuY3kgYXMgRElcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKFRhYmJlZFVYLCB0YXJnZXRTZWxlY3Rvcikge1xyXG4gICAgdmFyIHRhcmdldCA9ICQodGFyZ2V0U2VsZWN0b3IgfHwgJy5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1lbmFibGVkJyk7XHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLmluaXQoeyB0YXJnZXQ6IHRhcmdldCB9KTtcclxuXHJcbiAgICAvLyBBZGRpbmcgY2hhbmdlIG5vdGlmaWNhdGlvbiB0byB0YWItYm9keSBkaXZzXHJcbiAgICAvLyAob3V0c2lkZSB0aGUgTEMuQ2hhbmdlc05vdGlmaWNhdGlvbiBjbGFzcyB0byBsZWF2ZSBpdCBhcyBnZW5lcmljIGFuZCBzaW1wbGUgYXMgcG9zc2libGUpXHJcbiAgICAkKHRhcmdldCkub24oJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCAnZm9ybScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKHRoaXMpLnBhcmVudHMoJy50YWItYm9keScpLmFkZENsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFkZGluZyBjbGFzcyB0byB0aGUgbWVudSBpdGVtICh0YWIgdGl0bGUpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLmFkZENsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgICAgICAuYXR0cigndGl0bGUnLCAkKCcjbGNyZXMtY2hhbmdlcy1ub3Qtc2F2ZWQnKS50ZXh0KCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAub24oJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgJ2Zvcm0nLCBmdW5jdGlvbiAoZSwgZiwgZWxzLCBmdWxsKSB7XHJcbiAgICAgICAgaWYgKGZ1bGwpXHJcbiAgICAgICAgICAgICQodGhpcykucGFyZW50cygnLnRhYi1ib2R5Om5vdCg6aGFzKGZvcm0uaGFzLWNoYW5nZXMpKScpLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92aW5nIGNsYXNzIGZyb20gdGhlIG1lbnUgaXRlbSAodGFiIHRpdGxlKVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCd0aXRsZScsIG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAvLyBUbyBhdm9pZCB1c2VyIGJlIG5vdGlmaWVkIG9mIGNoYW5nZXMgYWxsIHRpbWUgd2l0aCB0YWIgbWFya3MsIHdlIGFkZGVkIGEgJ25vdGlmeScgY2xhc3NcclxuICAgIC8vIG9uIHRhYnMgd2hlbiBhIGNoYW5nZSBvZiB0YWIgaGFwcGVuc1xyXG4gICAgLmZpbmQoJy50YWItYm9keScpLm9uKCd0YWJVbmZvY3VzZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGZvY3VzZWRDdHgpIHtcclxuICAgICAgICB2YXIgbWkgPSBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtO1xyXG4gICAgICAgIGlmIChtaS5pcygnLmhhcy1jaGFuZ2VzJykpIHtcclxuICAgICAgICAgICAgbWkuYWRkQ2xhc3MoJ25vdGlmeS1jaGFuZ2VzJyk7IC8vaGFzLXRvb2x0aXBcclxuICAgICAgICAgICAgLy8gU2hvdyBub3RpZmljYXRpb24gcG9wdXBcclxuICAgICAgICAgICAgdmFyIGQgPSAkKCc8ZGl2IGNsYXNzPVwid2FybmluZ1wiPkAwPC9kaXY+PGRpdiBjbGFzcz1cImFjdGlvbnNcIj48aW5wdXQgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYWN0aW9uIGNvbnRpbnVlXCIgdmFsdWU9XCJAMlwiLz48aW5wdXQgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYWN0aW9uIHN0b3BcIiB2YWx1ZT1cIkAxXCIvPjwvZGl2PidcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMC9nLCBMQy5nZXRUZXh0KCdjaGFuZ2VzLW5vdC1zYXZlZCcpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AxL2csIExDLmdldFRleHQoJ3RhYi1oYXMtY2hhbmdlcy1zdGF5LW9uJykpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDIvZywgTEMuZ2V0VGV4dCgndGFiLWhhcy1jaGFuZ2VzLWNvbnRpbnVlLXdpdGhvdXQtY2hhbmdlJykpKTtcclxuICAgICAgICAgICAgZC5vbignY2xpY2snLCAnLnN0b3AnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh3aW5kb3cpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgJy5jb250aW51ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHdpbmRvdyk7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgJ2hhcy1jaGFuZ2VzJyB0byBhdm9pZCBmdXR1cmUgYmxvY2tzICh1bnRpbCBuZXcgY2hhbmdlcyBoYXBwZW5zIG9mIGNvdXJzZSA7LSlcclxuICAgICAgICAgICAgICAgIG1pLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpO1xyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIoZm9jdXNlZEN0eC50YWIuZ2V0KDApKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oZCwgd2luZG93LCAnbm90LXNhdmVkLXBvcHVwJywgeyBjbG9zYWJsZTogZmFsc2UsIGNlbnRlcjogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEV2ZXIgcmV0dXJuIGZhbHNlIHRvIHN0b3AgY3VycmVudCB0YWIgZm9jdXNcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5yZW1vdmVDbGFzcygnbm90aWZ5LWNoYW5nZXMnKTsgLy9oYXMtdG9vbHRpcFxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKiBUYWJiZWRVWDogVGFiYmVkIGludGVyZmFjZSBsb2dpYzsgd2l0aCBtaW5pbWFsIEhUTUwgdXNpbmcgY2xhc3MgJ3RhYmJlZCcgZm9yIHRoZVxyXG5jb250YWluZXIsIHRoZSBvYmplY3QgcHJvdmlkZXMgdGhlIGZ1bGwgQVBJIHRvIG1hbmlwdWxhdGUgdGFicyBhbmQgaXRzIHNldHVwXHJcbmxpc3RlbmVycyB0byBwZXJmb3JtIGxvZ2ljIG9uIHVzZXIgaW50ZXJhY3Rpb24uXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9qcXVlcnkuaGFzU2Nyb2xsQmFyJyk7XHJcblxyXG52YXIgVGFiYmVkVVggPSB7XHJcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCgnYm9keScpLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMgPiBsaTpub3QoLnRhYnMtc2xpZGVyKSA+IGEnLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAoVGFiYmVkVVguZm9jdXNUYWIoJHQuYXR0cignaHJlZicpKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0ID0gJChkb2N1bWVudCkuc2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5oYXNoID0gJHQuYXR0cignaHJlZicpO1xyXG4gICAgICAgICAgICAgICAgJCgnaHRtbCxib2R5Jykuc2Nyb2xsVG9wKHN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ21vdXNlZG93bicsIFRhYmJlZFVYLnN0YXJ0TW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdtb3VzZXVwIG1vdXNlbGVhdmUnLCBUYWJiZWRVWC5lbmRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAvLyB0aGUgY2xpY2sgcmV0dXJuIGZhbHNlIGlzIHRvIGRpc2FibGUgc3RhbmRhciB1cmwgYmVoYXZpb3JcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ2NsaWNrJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyLWxpbWl0JywgJ21vdXNlZW50ZXInLCBUYWJiZWRVWC5zdGFydE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlci1saW1pdCcsICdtb3VzZWxlYXZlJywgVGFiYmVkVVguZW5kTW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMgPiBsaS5yZW1vdmFibGUnLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAvLyBPbmx5IG9uIGRpcmVjdCBjbGlja3MgdG8gdGhlIHRhYiwgdG8gYXZvaWRcclxuICAgICAgICAgICAgLy8gY2xpY2tzIHRvIHRoZSB0YWItbGluayAodGhhdCBzZWxlY3QvZm9jdXMgdGhlIHRhYik6XHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldCA9PSBlLmN1cnJlbnRUYXJnZXQpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5yZW1vdmVUYWIobnVsbCwgdGhpcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEluaXQgcGFnZSBsb2FkZWQgdGFiYmVkIGNvbnRhaW5lcnM6XHJcbiAgICAgICAgJCgnLnRhYmJlZCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAvLyBDb25zaXN0ZW5jZSBjaGVjazogdGhpcyBtdXN0IGJlIGEgdmFsaWQgY29udGFpbmVyLCB0aGlzIGlzLCBtdXN0IGhhdmUgLnRhYnNcclxuICAgICAgICAgICAgaWYgKCR0LmNoaWxkcmVuKCcudGFicycpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgLy8gSW5pdCBzbGlkZXJcclxuICAgICAgICAgICAgVGFiYmVkVVguc2V0dXBTbGlkZXIoJHQpO1xyXG4gICAgICAgICAgICAvLyBDbGVhbiB3aGl0ZSBzcGFjZXMgKHRoZXkgY3JlYXRlIGV4Y2VzaXZlIHNlcGFyYXRpb24gYmV0d2VlbiBzb21lIHRhYnMpXHJcbiAgICAgICAgICAgICQoJy50YWJzJywgdGhpcykuY29udGVudHMoKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgYSB0ZXh0IG5vZGUsIHJlbW92ZSBpdDpcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5vZGVUeXBlID09IDMpXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgbW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIGRpciA9ICR0Lmhhc0NsYXNzKCd0YWJzLXNsaWRlci1yaWdodCcpID8gMSA6IC0xO1xyXG4gICAgICAgIHZhciB0YWJzU2xpZGVyID0gJHQucGFyZW50KCk7XHJcbiAgICAgICAgdmFyIHRhYnMgPSB0YWJzU2xpZGVyLnNpYmxpbmdzKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIHRhYnNbMF0uc2Nyb2xsTGVmdCArPSAyMCAqIGRpcjtcclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJzU2xpZGVyLnBhcmVudCgpLCB0YWJzKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgc3RhcnRNb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgdGFicyA9IHQuY2xvc2VzdCgnLnRhYmJlZCcpLmNoaWxkcmVuKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIC8vIFN0b3AgcHJldmlvdXMgYW5pbWF0aW9uczpcclxuICAgICAgICB0YWJzLnN0b3AodHJ1ZSk7XHJcbiAgICAgICAgdmFyIHNwZWVkID0gMC4zOyAvKiBzcGVlZCB1bml0OiBwaXhlbHMvbWlsaXNlY29uZHMgKi9cclxuICAgICAgICB2YXIgZnhhID0gZnVuY3Rpb24gKCkgeyBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJzLnBhcmVudCgpLCB0YWJzKTsgfTtcclxuICAgICAgICB2YXIgdGltZTtcclxuICAgICAgICBpZiAodC5oYXNDbGFzcygncmlnaHQnKSkge1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGltZSBiYXNlZCBvbiBzcGVlZCB3ZSB3YW50IGFuZCBob3cgbWFueSBkaXN0YW5jZSB0aGVyZSBpczpcclxuICAgICAgICAgICAgdGltZSA9ICh0YWJzWzBdLnNjcm9sbFdpZHRoIC0gdGFic1swXS5zY3JvbGxMZWZ0IC0gdGFicy53aWR0aCgpKSAqIDEgLyBzcGVlZDtcclxuICAgICAgICAgICAgdGFicy5hbmltYXRlKHsgc2Nyb2xsTGVmdDogdGFic1swXS5zY3JvbGxXaWR0aCAtIHRhYnMud2lkdGgoKSB9LFxyXG4gICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBzdGVwOiBmeGEsIGNvbXBsZXRlOiBmeGEsIGVhc2luZzogJ3N3aW5nJyB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGltZSBiYXNlZCBvbiBzcGVlZCB3ZSB3YW50IGFuZCBob3cgbWFueSBkaXN0YW5jZSB0aGVyZSBpczpcclxuICAgICAgICAgICAgdGltZSA9IHRhYnNbMF0uc2Nyb2xsTGVmdCAqIDEgLyBzcGVlZDtcclxuICAgICAgICAgICAgdGFicy5hbmltYXRlKHsgc2Nyb2xsTGVmdDogMCB9LFxyXG4gICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBzdGVwOiBmeGEsIGNvbXBsZXRlOiBmeGEsIGVhc2luZzogJ3N3aW5nJyB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGVuZE1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRhYkNvbnRhaW5lciA9ICQodGhpcykuY2xvc2VzdCgnLnRhYmJlZCcpO1xyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKS5zdG9wKHRydWUpO1xyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYkNvbnRhaW5lcik7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGNoZWNrVGFiU2xpZGVyTGltaXRzOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCB0YWJzKSB7XHJcbiAgICAgICAgdGFicyA9IHRhYnMgfHwgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIC8vIFNldCB2aXNpYmlsaXR5IG9mIHZpc3VhbCBsaW1pdGVyczpcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlci1saW1pdC1sZWZ0JykudG9nZ2xlKHRhYnNbMF0uc2Nyb2xsTGVmdCA+IDApO1xyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyLWxpbWl0LXJpZ2h0JykudG9nZ2xlKFxyXG4gICAgICAgICAgICAodGFic1swXS5zY3JvbGxMZWZ0ICsgdGFicy53aWR0aCgpKSA8IHRhYnNbMF0uc2Nyb2xsV2lkdGgpO1xyXG4gICAgfSxcclxuICAgIHNldHVwU2xpZGVyOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyKSB7XHJcbiAgICAgICAgdmFyIHRzID0gdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXInKTtcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicycpLmhhc1Njcm9sbEJhcih7IHg6IC0yIH0pLmhvcml6b250YWwpIHtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFkZENsYXNzKCdoYXMtdGFicy1zbGlkZXInKTtcclxuICAgICAgICAgICAgaWYgKHRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgIHRzLmNsYXNzTmFtZSA9ICd0YWJzLXNsaWRlcic7XHJcbiAgICAgICAgICAgICAgICAkKHRzKVxyXG4gICAgICAgICAgICAgICAgLy8gQXJyb3dzOlxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxhIGNsYXNzPVwidGFicy1zbGlkZXItbGVmdCBsZWZ0XCIgaHJlZj1cIiNcIj4mbHQ7Jmx0OzwvYT4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxhIGNsYXNzPVwidGFicy1zbGlkZXItcmlnaHQgcmlnaHRcIiBocmVmPVwiI1wiPiZndDsmZ3Q7PC9hPicpO1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFwcGVuZCh0cyk7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXJcclxuICAgICAgICAgICAgICAgIC8vIERlc2luZyBkZXRhaWxzOlxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ0YWJzLXNsaWRlci1saW1pdCB0YWJzLXNsaWRlci1saW1pdC1sZWZ0IGxlZnRcIiBocmVmPVwiI1wiPjwvZGl2PicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGRpdiBjbGFzcz1cInRhYnMtc2xpZGVyLWxpbWl0IHRhYnMtc2xpZGVyLWxpbWl0LXJpZ2h0IHJpZ2h0XCIgaHJlZj1cIiNcIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRzLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5yZW1vdmVDbGFzcygnaGFzLXRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgICAgIHRzLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFiQ29udGFpbmVyKTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWJDb250ZXh0QnlBcmdzOiBmdW5jdGlvbiAoYXJncykge1xyXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIHR5cGVvZiAoYXJnc1swXSkgPT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFRhYkNvbnRleHQoYXJnc1swXSwgbnVsbCk7XHJcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgYXJnc1swXS50YWIpXHJcbiAgICAgICAgICAgIHJldHVybiBhcmdzWzBdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFiQ29udGV4dChcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMCA/IGFyZ3NbMF0gOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAxID8gYXJnc1sxXSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDIgPyBhcmdzWzJdIDogbnVsbFxyXG4gICAgICAgICAgICApO1xyXG4gICAgfSxcclxuICAgIGdldFRhYkNvbnRleHQ6IGZ1bmN0aW9uICh0YWJPclNlbGVjdG9yLCBtZW51aXRlbU9yU2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgbWksIG1hLCB0YWIsIHRhYkNvbnRhaW5lcjtcclxuICAgICAgICBpZiAodGFiT3JTZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB0YWIgPSAkKHRhYk9yU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAodGFiLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXIgPSB0YWIucGFyZW50cygnLnRhYmJlZDplcSgwKScpO1xyXG4gICAgICAgICAgICAgICAgbWEgPSB0YWJDb250YWluZXIuZmluZCgnPiAudGFicyA+IGxpID4gYVtocmVmPSMnICsgdGFiLmdldCgwKS5pZCArICddJyk7XHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hLnBhcmVudCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChtZW51aXRlbU9yU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgbWEgPSAkKG1lbnVpdGVtT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmIChtYS5pcygnbGknKSkge1xyXG4gICAgICAgICAgICAgICAgbWkgPSBtYTtcclxuICAgICAgICAgICAgICAgIG1hID0gbWkuY2hpbGRyZW4oJ2E6ZXEoMCknKTtcclxuICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hLnBhcmVudCgpO1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIgPSBtaS5jbG9zZXN0KCcudGFiYmVkJyk7XHJcbiAgICAgICAgICAgIHRhYiA9IHRhYkNvbnRhaW5lci5maW5kKCc+LnRhYi1ib2R5QDAsID4udGFiLWJvZHktbGlzdD4udGFiLWJvZHlAMCcucmVwbGFjZSgvQDAvZywgbWEuYXR0cignaHJlZicpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IHRhYjogdGFiLCBtZW51YW5jaG9yOiBtYSwgbWVudWl0ZW06IG1pLCB0YWJDb250YWluZXI6IHRhYkNvbnRhaW5lciB9O1xyXG4gICAgfSxcclxuICAgIGNoZWNrVGFiQ29udGV4dDogZnVuY3Rpb24gKGN0eCwgZnVuY3Rpb25uYW1lLCBhcmdzLCBpc1Rlc3QpIHtcclxuICAgICAgICBpZiAoIWN0eC50YWIgfHwgY3R4LnRhYi5sZW5ndGggIT0gMSB8fFxyXG4gICAgICAgICAgICAhY3R4Lm1lbnVpdGVtIHx8IGN0eC5tZW51aXRlbS5sZW5ndGggIT0gMSB8fFxyXG4gICAgICAgICAgICAhY3R4LnRhYkNvbnRhaW5lciB8fCBjdHgudGFiQ29udGFpbmVyLmxlbmd0aCAhPSAxIHx8IFxyXG4gICAgICAgICAgICAhY3R4Lm1lbnVhbmNob3IgfHwgY3R4Lm1lbnVhbmNob3IubGVuZ3RoICE9IDEpIHtcclxuICAgICAgICAgICAgaWYgKCFpc1Rlc3QgJiYgY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVGFiYmVkVVguJyArIGZ1bmN0aW9ubmFtZSArICcsIGJhZCBhcmd1bWVudHM6ICcgKyBBcnJheS5qb2luKGFyZ3MsICcsICcpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdmb2N1c1RhYicsIGFyZ3VtZW50cywgdHJ1ZSkpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHJldHVybiBjdHgudGFiLmdldCgwKTtcclxuICAgIH0sXHJcbiAgICBmb2N1c1RhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2ZvY3VzVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBHZXQgcHJldmlvdXMgZm9jdXNlZCB0YWIsIHRyaWdnZXIgJ3RhYlVuZm9jdXNlZCcgaGFuZGxlciB0aGF0IGNhblxyXG4gICAgICAgIC8vIHN0b3AgdGhpcyBmb2N1cyAocmV0dXJuaW5nIGV4cGxpY2l0eSAnZmFsc2UnKVxyXG4gICAgICAgIHZhciBwcmV2VGFiID0gY3R4LnRhYi5zaWJsaW5ncygnLmN1cnJlbnQnKTtcclxuICAgICAgICBpZiAocHJldlRhYi50cmlnZ2VySGFuZGxlcigndGFiVW5mb2N1c2VkJywgW2N0eF0pID09PSBmYWxzZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBDaGVjayAoZmlyc3QhKSBpZiB0aGVyZSBpcyBhIHBhcmVudCB0YWIgYW5kIGZvY3VzIGl0IHRvbyAod2lsbCBiZSByZWN1cnNpdmUgY2FsbGluZyB0aGlzIHNhbWUgZnVuY3Rpb24pXHJcbiAgICAgICAgdmFyIHBhclRhYiA9IGN0eC50YWIucGFyZW50cygnLnRhYi1ib2R5OmVxKDApJyk7XHJcbiAgICAgICAgaWYgKHBhclRhYi5sZW5ndGggPT0gMSkgdGhpcy5mb2N1c1RhYihwYXJUYWIpO1xyXG5cclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdjdXJyZW50JykgfHxcclxuICAgICAgICAgICAgY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdkaXNhYmxlZCcpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIFVuc2V0IGN1cnJlbnQgbWVudSBlbGVtZW50XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNpYmxpbmdzKCcuY3VycmVudCcpLnJlbW92ZUNsYXNzKCdjdXJyZW50JylcclxuICAgICAgICAgICAgLmZpbmQoJz5hJykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAvLyBTZXQgY3VycmVudCBtZW51IGVsZW1lbnRcclxuICAgICAgICBjdHgubWVudWl0ZW0uYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICBjdHgubWVudWFuY2hvci5hZGRDbGFzcygnY3VycmVudCcpO1xyXG5cclxuICAgICAgICAvLyBIaWRlIGN1cnJlbnQgdGFiLWJvZHlcclxuICAgICAgICBwcmV2VGFiLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgLy8gU2hvdyBjdXJyZW50IHRhYi1ib2R5IGFuZCB0cmlnZ2VyIGV2ZW50XHJcbiAgICAgICAgY3R4LnRhYi5hZGRDbGFzcygnY3VycmVudCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRm9jdXNlZCcpO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBmb2N1c1RhYkluZGV4OiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCB0YWJJbmRleCkge1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZvY3VzVGFiKHRoaXMuZ2V0VGFiQ29udGV4dCh0YWJDb250YWluZXIuZmluZCgnPi50YWItYm9keTplcSgnICsgdGFiSW5kZXggKyAnKScpKSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIC8qIEVuYWJsZSBhIHRhYiwgZGlzYWJsaW5nIGFsbCBvdGhlcnMgdGFicyAtdXNlZnVsbCBpbiB3aXphcmQgc3R5bGUgcGFnZXMtICovXHJcbiAgICBlbmFibGVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdlbmFibGVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHJ0biA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaXMoJy5kaXNhYmxlZCcpKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBkaXNhYmxlZCBjbGFzcyBmcm9tIGZvY3VzZWQgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICAgICAgY3R4LnRhYi5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkVuYWJsZWQnKTtcclxuICAgICAgICAgICAgY3R4Lm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICBydG4gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBGb2N1cyB0YWI6XHJcbiAgICAgICAgdGhpcy5mb2N1c1RhYihjdHgpO1xyXG4gICAgICAgIC8vIERpc2FibGVkIHRhYnMgYW5kIG1lbnUgaXRlbXM6XHJcbiAgICAgICAgY3R4LnRhYi5zaWJsaW5ncygnOm5vdCguZGlzYWJsZWQpJylcclxuICAgICAgICAgICAgLmFkZENsYXNzKCdkaXNhYmxlZCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRGlzYWJsZWQnKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2libGluZ3MoJzpub3QoLmRpc2FibGVkKScpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnZGlzYWJsZWQnKTtcclxuICAgICAgICByZXR1cm4gcnRuO1xyXG4gICAgfSxcclxuICAgIHNob3doaWRlRHVyYXRpb246IDAsXHJcbiAgICBzaG93aGlkZUVhc2luZzogbnVsbCxcclxuICAgIHNob3dUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdzaG93VGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNob3cgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICBjdHgudGFiLnNob3codGhpcy5zaG93aGlkZUR1cmF0aW9uKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2hvdyh0aGlzLnNob3doaWRlRWFzaW5nKTtcclxuICAgIH0sXHJcbiAgICBoaWRlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnaGlkZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTaG93IHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgY3R4LnRhYi5oaWRlKHRoaXMuc2hvd2hpZGVEdXJhdGlvbik7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLmhpZGUodGhpcy5zaG93aGlkZUVhc2luZyk7XHJcbiAgICB9LFxyXG4gICAgdGFiQm9keUNsYXNzRXhjZXB0aW9uczogeyAndGFiLWJvZHknOiAwLCAndGFiYmVkJzogMCwgJ2N1cnJlbnQnOiAwLCAnZGlzYWJsZWQnOiAwIH0sXHJcbiAgICBjcmVhdGVUYWI6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIGlkTmFtZSwgbGFiZWwpIHtcclxuICAgICAgICB0YWJDb250YWluZXIgPSAkKHRhYkNvbnRhaW5lcik7XHJcbiAgICAgICAgLy8gdGFiQ29udGFpbmVyIG11c3QgYmUgb25seSBvbmUgYW5kIHZhbGlkIGNvbnRhaW5lclxyXG4gICAgICAgIC8vIGFuZCBpZE5hbWUgbXVzdCBub3QgZXhpc3RzXHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lci5sZW5ndGggPT0gMSAmJiB0YWJDb250YWluZXIuaXMoJy50YWJiZWQnKSAmJlxyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZE5hbWUpID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0YWIgZGl2OlxyXG4gICAgICAgICAgICB2YXIgdGFiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIHRhYi5pZCA9IGlkTmFtZTtcclxuICAgICAgICAgICAgLy8gUmVxdWlyZWQgY2xhc3Nlc1xyXG4gICAgICAgICAgICB0YWIuY2xhc3NOYW1lID0gXCJ0YWItYm9keVwiO1xyXG4gICAgICAgICAgICB2YXIgJHRhYiA9ICQodGFiKTtcclxuICAgICAgICAgICAgLy8gR2V0IGFuIGV4aXN0aW5nIHNpYmxpbmcgYW5kIGNvcHkgKHdpdGggc29tZSBleGNlcHRpb25zKSB0aGVpciBjc3MgY2xhc3Nlc1xyXG4gICAgICAgICAgICAkLmVhY2godGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiLWJvZHk6ZXEoMCknKS5hdHRyKCdjbGFzcycpLnNwbGl0KC9cXHMrLyksIGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISh2IGluIFRhYmJlZFVYLnRhYkJvZHlDbGFzc0V4Y2VwdGlvbnMpKVxyXG4gICAgICAgICAgICAgICAgICAgICR0YWIuYWRkQ2xhc3Modik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBBZGQgdG8gY29udGFpbmVyXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hcHBlbmQodGFiKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtZW51IGVudHJ5XHJcbiAgICAgICAgICAgIHZhciBtZW51aXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICAgICAgICAgIC8vIEJlY2F1c2UgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIHRhYiwgaXMgYSBkeW5hbWljYWxseSByZW1vdmFibGUgdGFiOlxyXG4gICAgICAgICAgICBtZW51aXRlbS5jbGFzc05hbWUgPSBcInJlbW92YWJsZVwiO1xyXG4gICAgICAgICAgICB2YXIgbWVudWFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICAgICAgbWVudWFuY2hvci5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCAnIycgKyBpZE5hbWUpO1xyXG4gICAgICAgICAgICAvLyBsYWJlbCBjYW5ub3QgYmUgbnVsbCBvciBlbXB0eVxyXG4gICAgICAgICAgICAkKG1lbnVhbmNob3IpLnRleHQoaXNFbXB0eVN0cmluZyhsYWJlbCkgPyBcIlRhYlwiIDogbGFiZWwpO1xyXG4gICAgICAgICAgICAkKG1lbnVpdGVtKS5hcHBlbmQobWVudWFuY2hvcik7XHJcbiAgICAgICAgICAgIC8vIEFkZCB0byB0YWJzIGxpc3QgY29udGFpbmVyXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKS5hcHBlbmQobWVudWl0ZW0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCwgb24gdGFiQ29udGFpbmVyLCB3aXRoIHRoZSBuZXcgdGFiIGFzIGRhdGFcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLnRyaWdnZXJIYW5kbGVyKCd0YWJDcmVhdGVkJywgW3RhYl0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZXR1cFNsaWRlcih0YWJDb250YWluZXIpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhYjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIHJlbW92ZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3JlbW92ZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gT25seSByZW1vdmUgaWYgaXMgYSAncmVtb3ZhYmxlJyB0YWJcclxuICAgICAgICBpZiAoIWN0eC5tZW51aXRlbS5oYXNDbGFzcygncmVtb3ZhYmxlJykgJiYgIWN0eC5tZW51aXRlbS5oYXNDbGFzcygndm9sYXRpbGUnKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIC8vIElmIHRhYiBpcyBjdXJyZW50bHkgZm9jdXNlZCB0YWIsIGNoYW5nZSB0byBmaXJzdCB0YWJcclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdjdXJyZW50JykpXHJcbiAgICAgICAgICAgIHRoaXMuZm9jdXNUYWJJbmRleChjdHgudGFiQ29udGFpbmVyLCAwKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0ucmVtb3ZlKCk7XHJcbiAgICAgICAgdmFyIHRhYmlkID0gY3R4LnRhYi5nZXQoMCkuaWQ7XHJcbiAgICAgICAgY3R4LnRhYi5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXR1cFNsaWRlcihjdHgudGFiQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgLy8gVHJpZ2dlciBldmVudCwgb24gdGFiQ29udGFpbmVyLCB3aXRoIHRoZSByZW1vdmVkIHRhYiBpZCBhcyBkYXRhXHJcbiAgICAgICAgY3R4LnRhYkNvbnRhaW5lci50cmlnZ2VySGFuZGxlcigndGFiUmVtb3ZlZCcsIFt0YWJpZF0pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIHNldFRhYlRpdGxlOiBmdW5jdGlvbiAodGFiT3JTZWxlY3RvciwgbmV3VGl0bGUpIHtcclxuICAgICAgICB2YXIgY3R4ID0gVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0YWJPclNlbGVjdG9yKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3NldFRhYlRpdGxlJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNldCBhbiBlbXB0eSBzdHJpbmcgaXMgbm90IGFsbG93ZWQsIHByZXNlcnZlIHByZXZpb3VzbHk6XHJcbiAgICAgICAgaWYgKCFpc0VtcHR5U3RyaW5nKG5ld1RpdGxlKSlcclxuICAgICAgICAgICAgY3R4Lm1lbnVhbmNob3IudGV4dChuZXdUaXRsZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiBNb3JlIHN0YXRpYyB1dGlsaXRpZXMgKi9cclxuXHJcbi8qKiBMb29rIHVwIHRoZSBjdXJyZW50IHdpbmRvdyBsb2NhdGlvbiBhZGRyZXNzIGFuZCB0cnkgdG8gZm9jdXMgYSB0YWIgd2l0aCB0aGF0XHJcbiAgICBuYW1lLCBpZiB0aGVyZSBpcyBvbmUuXHJcbioqL1xyXG5UYWJiZWRVWC5mb2N1c0N1cnJlbnRMb2NhdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIElmIHRoZSBjdXJyZW50IGxvY2F0aW9uIGhhdmUgYSBoYXNoIHZhbHVlIGJ1dCBpcyBub3QgYSBIYXNoQmFuZ1xyXG4gICAgaWYgKC9eI1teIV0vLnRlc3Qod2luZG93LmxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICAgICAgLy8gVHJ5IGZvY3VzIGEgdGFiIHdpdGggdGhhdCBuYW1lXHJcbiAgICAgICAgdmFyIHRhYiA9IFRhYmJlZFVYLmdldFRhYih3aW5kb3cubG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgaWYgKHRhYilcclxuICAgICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGFiKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKiBMb29rIGZvciB2b2xhdGlsZSB0YWJzIG9uIHRoZSBwYWdlLCBpZiB0aGV5IGFyZVxyXG4gICAgZW1wdHkgb3IgcmVxdWVzdGluZyBiZWluZyAndm9sYXRpemVkJywgcmVtb3ZlIGl0LlxyXG4qKi9cclxuVGFiYmVkVVguY2hlY2tWb2xhdGlsZVRhYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKCcudGFiYmVkID4gLnRhYnMgPiAudm9sYXRpbGUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGFiID0gVGFiYmVkVVguZ2V0VGFiKG51bGwsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0YWIgJiYgKCQodGFiKS5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMCB8fCAkKHRhYikuZmluZCgnOm5vdCgudGFiYmVkKSAudm9sYXRpemUtbXktdGFiJykubGVuZ3RoKSkge1xyXG4gICAgICAgICAgICBUYWJiZWRVWC5yZW1vdmVUYWIodGFiKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRhYmJlZFVYOyIsIi8qIHNsaWRlci10YWJzIGxvZ2ljLlxyXG4qIEV4ZWN1dGUgaW5pdCBhZnRlciBUYWJiZWRVWC5pbml0IHRvIGF2b2lkIGxhdW5jaCBhbmltYXRpb24gb24gcGFnZSBsb2FkLlxyXG4qIEl0IHJlcXVpcmVzIFRhYmJlZFVYIHRocm91Z2h0IERJIG9uICdpbml0Jy5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFNsaWRlclRhYnMoVGFiYmVkVVgpIHtcclxuICAgICQoJy50YWJiZWQuc2xpZGVyLXRhYnMnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciAkdGFicyA9ICR0LmNoaWxkcmVuKCcudGFiLWJvZHknKTtcclxuICAgICAgICB2YXIgYyA9ICR0YWJzXHJcbiAgICAgICAgICAgIC53cmFwQWxsKCc8ZGl2IGNsYXNzPVwidGFiLWJvZHktbGlzdFwiLz4nKVxyXG4gICAgICAgICAgICAuZW5kKCkuY2hpbGRyZW4oJy50YWItYm9keS1saXN0Jyk7XHJcbiAgICAgICAgJHRhYnMub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGMuc3RvcCh0cnVlLCBmYWxzZSkuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IGMuc2Nyb2xsTGVmdCgpICsgJCh0aGlzKS5wb3NpdGlvbigpLmxlZnQgfSwgMTQwMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gU2V0IGhvcml6b250YWwgc2Nyb2xsIHRvIHRoZSBwb3NpdGlvbiBvZiBjdXJyZW50IHNob3dlZCB0YWIsIHdpdGhvdXQgYW5pbWF0aW9uIChmb3IgcGFnZS1pbml0KTpcclxuICAgICAgICB2YXIgY3VycmVudFRhYiA9ICQoJHQuZmluZCgnPi50YWJzPmxpLmN1cnJlbnQ+YScpLmF0dHIoJ2hyZWYnKSk7XHJcbiAgICAgICAgYy5zY3JvbGxMZWZ0KGMuc2Nyb2xsTGVmdCgpICsgY3VycmVudFRhYi5wb3NpdGlvbigpLmxlZnQpO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBXaXphcmQgVGFiYmVkIEZvcm1zLlxyXG4gICAgSXQgdXNlIHRhYnMgdG8gbWFuYWdlIHRoZSBkaWZmZXJlbnQgZm9ybXMtc3RlcHMgaW4gdGhlIHdpemFyZCxcclxuICAgIGxvYWRlZCBieSBBSkFYIGFuZCBmb2xsb3dpbmcgdG8gdGhlIG5leHQgdGFiL3N0ZXAgb24gc3VjY2Vzcy5cclxuXHJcbiAgICBSZXF1aXJlIFRhYmJlZFVYIHZpYSBESSBvbiAnaW5pdCdcclxuICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgdmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpLFxyXG4gICAgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgICBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnLi9hamF4Q2FsbGJhY2tzJyksXHJcbiAgICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFRhYmJlZFdpemFyZChUYWJiZWRVWCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBsb2FkaW5nRGVsYXk6IDBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoXCJib2R5XCIpLmRlbGVnYXRlKFwiLnRhYmJlZC53aXphcmQgLm5leHRcIiwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgZm9ybVxyXG4gICAgICAgIHZhciBmb3JtID0gJCh0aGlzKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgY3VycmVudCB3aXphcmQgc3RlcC10YWJcclxuICAgICAgICB2YXIgY3VycmVudFN0ZXAgPSBmb3JtLmNsb3Nlc3QoJy50YWItYm9keScpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIHdpemFyZCBjb250YWluZXJcclxuICAgICAgICB2YXIgd2l6YXJkID0gZm9ybS5jbG9zZXN0KCcudGFiYmVkLndpemFyZCcpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIHdpemFyZC1uZXh0LXN0ZXBcclxuICAgICAgICB2YXIgbmV4dFN0ZXAgPSAkKHRoaXMpLmRhdGEoJ3dpemFyZC1uZXh0LXN0ZXAnKTtcclxuXHJcbiAgICAgICAgdmFyIGN0eCA9IHtcclxuICAgICAgICAgICAgYm94OiBjdXJyZW50U3RlcCxcclxuICAgICAgICAgICAgZm9ybTogZm9ybVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEZpcnN0IGF0IGFsbCwgaWYgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgICAgIHZhciB2YWxvYmplY3QgPSBmb3JtLmRhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gICAgICAgIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSk7XHJcbiAgICAgICAgICAgIC8vIFZhbGlkYXRpb24gaXMgYWN0aXZlZCwgd2FzIGV4ZWN1dGVkIGFuZCB0aGUgcmVzdWx0IGlzICdmYWxzZSc6IGJhZCBkYXRhLCBzdG9wIFBvc3Q6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICAgICAgdmFyIGN1c3ZhbCA9IGZvcm0uZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicpO1xyXG4gICAgICAgIGlmIChjdXN2YWwgJiYgY3VzdmFsLnZhbGlkYXRlICYmIGN1c3ZhbC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLmdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pO1xyXG4gICAgICAgICAgICAvLyBjdXN0b20gdmFsaWRhdGlvbiBub3QgcGFzc2VkLCBvdXQhXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJhaXNlIGV2ZW50XHJcbiAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcignYmVnaW5TdWJtaXRXaXphcmRTdGVwJyk7XHJcblxyXG4gICAgICAgIC8vIExvYWRpbmcsIHdpdGggcmV0YXJkXHJcbiAgICAgICAgY3R4LmxvYWRpbmd0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjdXJyZW50U3RlcC5ibG9jayhibG9ja1ByZXNldHMubG9hZGluZyk7XHJcbiAgICAgICAgfSwgb3B0aW9ucy5sb2FkaW5nRGVsYXkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgb2sgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gTWFyayBhcyBzYXZlZDpcclxuICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzID0gY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgICAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAoZm9ybS5hdHRyKCdhY3Rpb24nKSB8fCAnJyksXHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgY29udGV4dDogY3R4LFxyXG4gICAgICAgICAgICBkYXRhOiBmb3JtLnNlcmlhbGl6ZSgpLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBzdWNjZXNzLCBnbyBuZXh0IHN0ZXAsIHVzaW5nIGN1c3RvbSBKU09OIEFjdGlvbiBldmVudDpcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgbmV4dC1zdGVwXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRTdGVwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIG5leHQgc3RlcCBpcyBpbnRlcm5hbCB1cmwgKGEgbmV4dCB3aXphcmQgdGFiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoL14jLy50ZXN0KG5leHRTdGVwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChuZXh0U3RlcCkudHJpZ2dlcignYmVnaW5Mb2FkV2l6YXJkU3RlcCcpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRhYmJlZFVYLmVuYWJsZVRhYihuZXh0U3RlcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2sgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChuZXh0U3RlcCkudHJpZ2dlcignZW5kTG9hZFdpemFyZFN0ZXAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgbmV4dC1zdGVwIFVSSSB0aGF0IGlzIG5vdCBpbnRlcm5hbCBsaW5rLCB3ZSBsb2FkIGl0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWRpcmVjdFRvKG5leHRTdGVwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIERvIEpTT04gYWN0aW9uIGJ1dCBpZiBpcyBub3QgSlNPTiBvciB2YWxpZCwgbWFuYWdlIGFzIEhUTUw6XHJcbiAgICAgICAgICAgICAgICBpZiAoIWFqYXhDYWxsYmFja3MuZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUG9zdCAnbWF5YmUnIHdhcyB3cm9uZywgaHRtbCB3YXMgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZvcm0gY29udGFpbmVyOiB0aGUgYWpheC1ib3guXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYW4gZW1wdHkgZG9jdW1lbnQgb3IgbWFsZm9ybWVkIGlzIHJldHVybmVkOlxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3dpbmcgbmV3IGh0bWw6XHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFN0ZXAuaHRtbChuZXdodG1sKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Rm9ybSA9IGN1cnJlbnRTdGVwO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghY3VycmVudFN0ZXAuaXMoJ2Zvcm0nKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Rm9ybSA9IGN1cnJlbnRTdGVwLmZpbmQoJ2Zvcm06ZXEoMCknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hhbmdlc25vdGlmaWNhdGlvbiBhZnRlciBhcHBlbmQgZWxlbWVudCB0byBkb2N1bWVudCwgaWYgbm90IHdpbGwgbm90IHdvcms6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQgKGlmIHdhcyBzYXZlZCBidXQgc2VydmVyIGRlY2lkZSByZXR1cm5zIGh0bWwgaW5zdGVhZCBhIEpTT04gY29kZSwgcGFnZSBzY3JpcHQgbXVzdCBkbyAncmVnaXN0ZXJTYXZlJyB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZSk6XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Rm9ybS5nZXQoMCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdyZWxvYWRlZEh0bWxXaXphcmRTdGVwJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBhamF4Q2FsbGJhY2tzLmVycm9yLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogYWpheENhbGxiYWNrcy5jb21wbGV0ZVxyXG4gICAgICAgIH0pLmNvbXBsZXRlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcignZW5kU3VibWl0V2l6YXJkU3RlcCcsIG9rKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvKiogdGltZVNwYW4gY2xhc3MgdG8gbWFuYWdlIHRpbWVzLCBwYXJzZSwgZm9ybWF0LCBjb21wdXRlLlxyXG5JdHMgbm90IHNvIGNvbXBsZXRlIGFzIHRoZSBDIyBvbmVzIGJ1dCBpcyB1c2VmdWxsIHN0aWxsLlxyXG4qKi9cclxudmFyIFRpbWVTcGFuID0gZnVuY3Rpb24gKGRheXMsIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBtaWxsaXNlY29uZHMpIHtcclxuICAgIHRoaXMuZGF5cyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChkYXlzKSkgfHwgMDtcclxuICAgIHRoaXMuaG91cnMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoaG91cnMpKSB8fCAwO1xyXG4gICAgdGhpcy5taW51dGVzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KG1pbnV0ZXMpKSB8fCAwO1xyXG4gICAgdGhpcy5zZWNvbmRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KHNlY29uZHMpKSB8fCAwO1xyXG4gICAgdGhpcy5taWxsaXNlY29uZHMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQobWlsbGlzZWNvbmRzKSkgfHwgMDtcclxuXHJcbiAgICAvLyBpbnRlcm5hbCB1dGlsaXR5IGZ1bmN0aW9uICd0byBzdHJpbmcgd2l0aCB0d28gZGlnaXRzIGFsbW9zdCdcclxuICAgIGZ1bmN0aW9uIHQobikge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKG4gLyAxMCkgKyAnJyArIG4gJSAxMDtcclxuICAgIH1cclxuICAgIC8qKiBTaG93IG9ubHkgaG91cnMgYW5kIG1pbnV0ZXMgYXMgYSBzdHJpbmcgd2l0aCB0aGUgZm9ybWF0IEhIOm1tXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9TaG9ydFN0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU2hvcnRTdHJpbmcoKSB7XHJcbiAgICAgICAgdmFyIGggPSB0KHRoaXMuaG91cnMpLFxyXG4gICAgICAgICAgICBtID0gdCh0aGlzLm1pbnV0ZXMpO1xyXG4gICAgICAgIHJldHVybiAoaCArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICsgbSk7XHJcbiAgICB9O1xyXG4gICAgLyoqIFNob3cgdGhlIGZ1bGwgdGltZSBhcyBhIHN0cmluZywgZGF5cyBjYW4gYXBwZWFyIGJlZm9yZSBob3VycyBpZiB0aGVyZSBhcmUgMjQgaG91cnMgb3IgbW9yZVxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgdmFyIGggPSB0KHRoaXMuaG91cnMpLFxyXG4gICAgICAgICAgICBkID0gKHRoaXMuZGF5cyA+IDAgPyB0aGlzLmRheXMudG9TdHJpbmcoKSArIFRpbWVTcGFuLmRlY2ltYWxzRGVsaW1pdGVyIDogJycpLFxyXG4gICAgICAgICAgICBtID0gdCh0aGlzLm1pbnV0ZXMpLFxyXG4gICAgICAgICAgICBzID0gdCh0aGlzLnNlY29uZHMgKyB0aGlzLm1pbGxpc2Vjb25kcyAvIDEwMDApO1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIGQgK1xyXG4gICAgICAgICAgICBoICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgK1xyXG4gICAgICAgICAgICBtICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgK1xyXG4gICAgICAgICAgICBzKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnZhbHVlT2YgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b192YWx1ZU9mKCkge1xyXG4gICAgICAgIC8vIFJldHVybiB0aGUgdG90YWwgbWlsbGlzZWNvbmRzIGNvbnRhaW5lZCBieSB0aGUgdGltZVxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuZGF5cyAqICgyNCAqIDM2MDAwMDApICtcclxuICAgICAgICAgICAgdGhpcy5ob3VycyAqIDM2MDAwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLm1pbnV0ZXMgKiA2MDAwMCArXHJcbiAgICAgICAgICAgIHRoaXMuc2Vjb25kcyAqIDEwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLm1pbGxpc2Vjb25kc1xyXG4gICAgICAgICk7XHJcbiAgICB9O1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIG1pbGxpc2Vjb25kc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbU1pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21NaWxsaXNlY29uZHMobWlsbGlzZWNvbmRzKSB7XHJcbiAgICB2YXIgbXMgPSBtaWxsaXNlY29uZHMgJSAxMDAwLFxyXG4gICAgICAgIHMgPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDEwMDApICUgNjAsXHJcbiAgICAgICAgbSA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gNjAwMDApICUgNjAsXHJcbiAgICAgICAgaCA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gMzYwMDAwMCkgJSAyNCxcclxuICAgICAgICBkID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAoMzYwMDAwMCAqIDI0KSk7XHJcbiAgICByZXR1cm4gbmV3IFRpbWVTcGFuKGQsIGgsIG0sIHMsIG1zKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIHNlY29uZHNcclxuKiovXHJcblRpbWVTcGFuLmZyb21TZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbVNlY29uZHMoc2Vjb25kcykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbU1pbGxpc2Vjb25kcyhzZWNvbmRzICogMTAwMCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBtaW51dGVzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tTWludXRlcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21NaW51dGVzKG1pbnV0ZXMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21TZWNvbmRzKG1pbnV0ZXMgKiA2MCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBob3Vyc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbUhvdXJzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbUhvdXJzKGhvdXJzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tTWludXRlcyhob3VycyAqIDYwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIGRheXNcclxuKiovXHJcblRpbWVTcGFuLmZyb21EYXlzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbURheXMoZGF5cykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbUhvdXJzKGRheXMgKiAyNCk7XHJcbn07XHJcblxyXG4vLyBGb3Igc3BhbmlzaCBhbmQgZW5nbGlzaCB3b3JrcyBnb29kICc6JyBhcyB1bml0c0RlbGltaXRlciBhbmQgJy4nIGFzIGRlY2ltYWxEZWxpbWl0ZXJcclxuLy8gVE9ETzogdGhpcyBtdXN0IGJlIHNldCBmcm9tIGEgZ2xvYmFsIExDLmkxOG4gdmFyIGxvY2FsaXplZCBmb3IgY3VycmVudCB1c2VyXHJcblRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyID0gJzonO1xyXG5UaW1lU3Bhbi5kZWNpbWFsc0RlbGltaXRlciA9ICcuJztcclxuVGltZVNwYW4ucGFyc2UgPSBmdW5jdGlvbiAoc3RydGltZSkge1xyXG4gICAgc3RydGltZSA9IChzdHJ0aW1lIHx8ICcnKS5zcGxpdCh0aGlzLnVuaXRzRGVsaW1pdGVyKTtcclxuICAgIC8vIEJhZCBzdHJpbmcsIHJldHVybnMgbnVsbFxyXG4gICAgaWYgKHN0cnRpbWUubGVuZ3RoIDwgMilcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAvLyBEZWNvdXBsZWQgdW5pdHM6XHJcbiAgICB2YXIgZCwgaCwgbSwgcywgbXM7XHJcbiAgICBoID0gc3RydGltZVswXTtcclxuICAgIG0gPSBzdHJ0aW1lWzFdO1xyXG4gICAgcyA9IHN0cnRpbWUubGVuZ3RoID4gMiA/IHN0cnRpbWVbMl0gOiAwO1xyXG4gICAgLy8gU3Vic3RyYWN0aW5nIGRheXMgZnJvbSB0aGUgaG91cnMgcGFydCAoZm9ybWF0OiAnZGF5cy5ob3Vycycgd2hlcmUgJy4nIGlzIGRlY2ltYWxzRGVsaW1pdGVyKVxyXG4gICAgaWYgKGguY29udGFpbnModGhpcy5kZWNpbWFsc0RlbGltaXRlcikpIHtcclxuICAgICAgICB2YXIgZGhzcGxpdCA9IGguc3BsaXQodGhpcy5kZWNpbWFsc0RlbGltaXRlcik7XHJcbiAgICAgICAgZCA9IGRoc3BsaXRbMF07XHJcbiAgICAgICAgaCA9IGRoc3BsaXRbMV07XHJcbiAgICB9XHJcbiAgICAvLyBNaWxsaXNlY29uZHMgYXJlIGV4dHJhY3RlZCBmcm9tIHRoZSBzZWNvbmRzIChhcmUgcmVwcmVzZW50ZWQgYXMgZGVjaW1hbCBudW1iZXJzIG9uIHRoZSBzZWNvbmRzIHBhcnQ6ICdzZWNvbmRzLm1pbGxpc2Vjb25kcycgd2hlcmUgJy4nIGlzIGRlY2ltYWxzRGVsaW1pdGVyKVxyXG4gICAgbXMgPSBNYXRoLnJvdW5kKHBhcnNlRmxvYXQocy5yZXBsYWNlKHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIsICcuJykpICogMTAwMCAlIDEwMDApO1xyXG4gICAgLy8gUmV0dXJuIHRoZSBuZXcgdGltZSBpbnN0YW5jZVxyXG4gICAgcmV0dXJuIG5ldyBUaW1lU3BhbihkLCBoLCBtLCBzLCBtcyk7XHJcbn07XHJcblRpbWVTcGFuLnplcm8gPSBuZXcgVGltZVNwYW4oMCwgMCwgMCwgMCwgMCk7XHJcblRpbWVTcGFuLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19pc1plcm8oKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIHRoaXMuZGF5cyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMuaG91cnMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLm1pbnV0ZXMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLnNlY29uZHMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLm1pbGxpc2Vjb25kcyA9PT0gMFxyXG4gICAgKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxNaWxsaXNlY29uZHMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbFNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbFNlY29uZHMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxNaWxsaXNlY29uZHMoKSAvIDEwMDApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxNaW51dGVzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxNaW51dGVzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsU2Vjb25kcygpIC8gNjApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxIb3VycyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsSG91cnMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxNaW51dGVzKCkgLyA2MCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbERheXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbERheXMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxIb3VycygpIC8gMjQpO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUaW1lU3BhbjsiLCIvKiBFeHRyYSB1dGlsaXRpZXMgYW5kIG1ldGhvZHMgXHJcbiAqL1xyXG52YXIgVGltZVNwYW4gPSByZXF1aXJlKCcuL1RpbWVTcGFuJyk7XHJcbnZhciBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG4vKiogU2hvd3MgdGltZSBhcyBhIGxhcmdlIHN0cmluZyB3aXRoIHVuaXRzIG5hbWVzIGZvciB2YWx1ZXMgZGlmZmVyZW50IHRoYW4gemVyby5cclxuICoqL1xyXG5mdW5jdGlvbiBzbWFydFRpbWUodGltZSkge1xyXG4gICAgdmFyIHIgPSBbXTtcclxuICAgIGlmICh0aW1lLmRheXMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLmRheXMgKyAnIGRheXMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuZGF5cyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBkYXknKTtcclxuICAgIGlmICh0aW1lLmhvdXJzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5ob3VycyArICcgaG91cnMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuaG91cnMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgaG91cicpO1xyXG4gICAgaWYgKHRpbWUubWludXRlcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUubWludXRlcyArICcgbWludXRlcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5taW51dGVzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIG1pbnV0ZScpO1xyXG4gICAgaWYgKHRpbWUuc2Vjb25kcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuc2Vjb25kcyArICcgc2Vjb25kcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5zZWNvbmRzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIHNlY29uZCcpO1xyXG4gICAgaWYgKHRpbWUubWlsbGlzZWNvbmRzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5taWxsaXNlY29uZHMgKyAnIG1pbGxpc2Vjb25kcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5taWxsaXNlY29uZHMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgbWlsbGlzZWNvbmQnKTtcclxuICAgIHJldHVybiByLmpvaW4oJywgJyk7XHJcbn1cclxuXHJcbi8qKiBSb3VuZHMgYSB0aW1lIHRvIHRoZSBuZWFyZXN0IDE1IG1pbnV0ZXMgZnJhZ21lbnQuXHJcbkByb3VuZFRvIHNwZWNpZnkgdGhlIExDLnJvdW5kaW5nVHlwZUVudW0gYWJvdXQgaG93IHRvIHJvdW5kIHRoZSB0aW1lIChkb3duLCBuZWFyZXN0IG9yIHVwKVxyXG4qKi9cclxuZnVuY3Rpb24gcm91bmRUaW1lVG9RdWFydGVySG91cigvKiBUaW1lU3BhbiAqL3RpbWUsIC8qIG1hdGhVdGlscy5yb3VuZGluZ1R5cGVFbnVtICovcm91bmRUbykge1xyXG4gICAgdmFyIHJlc3RGcm9tUXVhcnRlciA9IHRpbWUudG90YWxIb3VycygpICUgMC4yNTtcclxuICAgIHZhciBob3VycyA9IHRpbWUudG90YWxIb3VycygpO1xyXG4gICAgaWYgKHJlc3RGcm9tUXVhcnRlciA+IDAuMCkge1xyXG4gICAgICAgIHN3aXRjaCAocm91bmRUbykge1xyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgICAgIGhvdXJzIC09IHJlc3RGcm9tUXVhcnRlcjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uTmVhcmVzdDpcclxuICAgICAgICAgICAgICAgIHZhciBsaW1pdCA9IDAuMjUgLyAyO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3RGcm9tUXVhcnRlciA+PSBsaW1pdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzICs9ICgwLjI1IC0gcmVzdEZyb21RdWFydGVyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG91cnMgLT0gcmVzdEZyb21RdWFydGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgICAgIGhvdXJzICs9ICgwLjI1IC0gcmVzdEZyb21RdWFydGVyKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBUaW1lU3Bhbi5mcm9tSG91cnMoaG91cnMpO1xyXG59XHJcblxyXG4vLyBFeHRlbmQgYSBnaXZlbiBUaW1lU3BhbiBvYmplY3Qgd2l0aCB0aGUgRXh0cmEgbWV0aG9kc1xyXG5mdW5jdGlvbiBwbHVnSW4oVGltZVNwYW4pIHtcclxuICAgIFRpbWVTcGFuLnByb3RvdHlwZS50b1NtYXJ0U3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TbWFydFN0cmluZygpIHsgcmV0dXJuIHNtYXJ0VGltZSh0aGlzKTsgfTtcclxuICAgIFRpbWVTcGFuLnByb3RvdHlwZS5yb3VuZFRvUXVhcnRlckhvdXIgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19yb3VuZFRvUXVhcnRlckhvdXIoKSB7IHJldHVybiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyLmNhbGwodGhpcywgcGFyYW1ldGVycyk7IH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIHNtYXJ0VGltZTogc21hcnRUaW1lLFxyXG4gICAgICAgIHJvdW5kVG9RdWFydGVySG91cjogcm91bmRUaW1lVG9RdWFydGVySG91cixcclxuICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgfTtcclxuIiwiLyoqXHJcbiAgIEFQSSBmb3IgYXV0b21hdGljIGNyZWF0aW9uIG9mIGxhYmVscyBmb3IgVUkgU2xpZGVycyAoanF1ZXJ5LXVpKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHRvb2x0aXBzID0gcmVxdWlyZSgnLi90b29sdGlwcycpLFxyXG4gICAgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpLFxyXG4gICAgVGltZVNwYW4gPSByZXF1aXJlKCcuL1RpbWVTcGFuJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuLyoqIENyZWF0ZSBsYWJlbHMgZm9yIGEganF1ZXJ5LXVpLXNsaWRlci5cclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZShzbGlkZXIpIHtcclxuICAgIC8vIHJlbW92ZSBvbGQgb25lczpcclxuICAgIHZhciBvbGQgPSBzbGlkZXIuc2libGluZ3MoJy51aS1zbGlkZXItbGFiZWxzJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCQodGhpcykuZGF0YSgndWktc2xpZGVyJykuZ2V0KDApID09IHNsaWRlci5nZXQoMCkpO1xyXG4gICAgfSkucmVtb3ZlKCk7XHJcbiAgICAvLyBDcmVhdGUgbGFiZWxzIGNvbnRhaW5lclxyXG4gICAgdmFyIGxhYmVscyA9ICQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWxzXCIvPicpO1xyXG4gICAgbGFiZWxzLmRhdGEoJ3VpLXNsaWRlcicsIHNsaWRlcik7XHJcblxyXG4gICAgLy8gU2V0dXAgb2YgdXNlZnVsIHZhcnMgZm9yIGxhYmVsIGNyZWF0aW9uXHJcbiAgICB2YXIgbWF4ID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ21heCcpLFxyXG4gICAgICAgIG1pbiA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdtaW4nKSxcclxuICAgICAgICBzdGVwID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ3N0ZXAnKSxcclxuICAgICAgICBzdGVwcyA9IE1hdGguZmxvb3IoKG1heCAtIG1pbikgLyBzdGVwKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBhbmQgcG9zaXRpb25pbmcgbGFiZWxzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBzdGVwczsgaSsrKSB7XHJcbiAgICAgICAgLy8gQ3JlYXRlIGxhYmVsXHJcbiAgICAgICAgdmFyIGxibCA9ICQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWxcIj48c3BhbiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbC10ZXh0XCIvPjwvZGl2PicpO1xyXG4gICAgICAgIC8vIFNldHVwIGxhYmVsIHdpdGggaXRzIHZhbHVlXHJcbiAgICAgICAgdmFyIGxhYmVsVmFsdWUgPSBtaW4gKyBpICogc3RlcDtcclxuICAgICAgICBsYmwuY2hpbGRyZW4oJy51aS1zbGlkZXItbGFiZWwtdGV4dCcpLnRleHQobGFiZWxWYWx1ZSk7XHJcbiAgICAgICAgbGJsLmRhdGEoJ3VpLXNsaWRlci12YWx1ZScsIGxhYmVsVmFsdWUpO1xyXG4gICAgICAgIC8vIFBvc2l0aW9uYXRlXHJcbiAgICAgICAgcG9zaXRpb25hdGUobGJsLCBpLCBzdGVwcyk7XHJcbiAgICAgICAgLy8gQWRkIHRvIGNvbnRhaW5lclxyXG4gICAgICAgIGxhYmVscy5hcHBlbmQobGJsKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGVyIGZvciBsYWJlbHMgY2xpY2sgdG8gc2VsZWN0IGl0cyBwb3NpdGlvbiB2YWx1ZVxyXG4gICAgbGFiZWxzLm9uKCdjbGljaycsICcudWktc2xpZGVyLWxhYmVsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWwgPSAkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlci12YWx1ZScpLFxyXG4gICAgICAgICAgICBzbGlkZXIgPSAkKHRoaXMpLnBhcmVudCgpLmRhdGEoJ3VpLXNsaWRlcicpO1xyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluc2VydCBsYWJlbHMgYXMgYSBzaWJsaW5nIG9mIHRoZSBzbGlkZXIgKGNhbm5vdCBiZSBpbnNlcnRlZCBpbnNpZGUpXHJcbiAgICBzbGlkZXIuYWZ0ZXIobGFiZWxzKTtcclxufVxyXG5cclxuLyoqIFBvc2l0aW9uYXRlIHRvIHRoZSBjb3JyZWN0IHBvc2l0aW9uIGFuZCB3aWR0aCBhbiBVSSBsYWJlbCBhdCBAbGJsXHJcbmZvciB0aGUgcmVxdWlyZWQgcGVyY2VudGFnZS13aWR0aCBAc3dcclxuKiovXHJcbmZ1bmN0aW9uIHBvc2l0aW9uYXRlKGxibCwgaSwgc3RlcHMpIHtcclxuICAgIHZhciBzdyA9IDEwMCAvIHN0ZXBzO1xyXG4gICAgdmFyIGxlZnQgPSBpICogc3cgLSBzdyAqIDAuNSxcclxuICAgICAgICByaWdodCA9IDEwMCAtIGxlZnQgLSBzdyxcclxuICAgICAgICBhbGlnbiA9ICdjZW50ZXInO1xyXG4gICAgaWYgKGkgPT09IDApIHtcclxuICAgICAgICBhbGlnbiA9ICdsZWZ0JztcclxuICAgICAgICBsZWZ0ID0gMDtcclxuICAgIH0gZWxzZSBpZiAoaSA9PSBzdGVwcykge1xyXG4gICAgICAgIGFsaWduID0gJ3JpZ2h0JztcclxuICAgICAgICByaWdodCA9IDA7XHJcbiAgICB9XHJcbiAgICBsYmwuY3NzKHtcclxuICAgICAgICAndGV4dC1hbGlnbic6IGFsaWduLFxyXG4gICAgICAgIGxlZnQ6IGxlZnQgKyAnJScsXHJcbiAgICAgICAgcmlnaHQ6IHJpZ2h0ICsgJyUnXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIFVwZGF0ZSB0aGUgdmlzaWJpbGl0eSBvZiBsYWJlbHMgb2YgYSBqcXVlcnktdWktc2xpZGVyIGRlcGVuZGluZyBpZiB0aGV5IGZpdCBpbiB0aGUgYXZhaWxhYmxlIHNwYWNlLlxyXG5TbGlkZXIgbmVlZHMgdG8gYmUgdmlzaWJsZS5cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZShzbGlkZXIpIHtcclxuICAgIC8vIEdldCBsYWJlbHMgZm9yIHNsaWRlclxyXG4gICAgdmFyIGxhYmVsc19jID0gc2xpZGVyLnNpYmxpbmdzKCcudWktc2xpZGVyLWxhYmVscycpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlcicpLmdldCgwKSA9PSBzbGlkZXIuZ2V0KDApKTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGxhYmVscyA9IGxhYmVsc19jLmZpbmQoJy51aS1zbGlkZXItbGFiZWwtdGV4dCcpO1xyXG5cclxuICAgIC8vIEFwcGx5IGF1dG9zaXplXHJcbiAgICBpZiAoKHNsaWRlci5kYXRhKCdzbGlkZXItYXV0b3NpemUnKSB8fCBmYWxzZSkudG9TdHJpbmcoKSA9PSAndHJ1ZScpXHJcbiAgICAgICAgYXV0b3NpemUoc2xpZGVyLCBsYWJlbHMpO1xyXG5cclxuICAgIC8vIEdldCBhbmQgYXBwbHkgbGF5b3V0XHJcbiAgICB2YXIgbGF5b3V0X25hbWUgPSBzbGlkZXIuZGF0YSgnc2xpZGVyLWxhYmVscy1sYXlvdXQnKSB8fCAnc3RhbmRhcmQnLFxyXG4gICAgICAgIGxheW91dCA9IGxheW91dF9uYW1lIGluIGxheW91dHMgPyBsYXlvdXRzW2xheW91dF9uYW1lXSA6IGxheW91dHMuc3RhbmRhcmQ7XHJcbiAgICBsYWJlbHNfYy5hZGRDbGFzcygnbGF5b3V0LScgKyBsYXlvdXRfbmFtZSk7XHJcbiAgICBsYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdG9vbHRpcHNcclxuICAgIHRvb2x0aXBzLmNyZWF0ZVRvb2x0aXAobGFiZWxzX2MuY2hpbGRyZW4oKSwge1xyXG4gICAgICAgIHRpdGxlOiBmdW5jdGlvbiAoKSB7IHJldHVybiAkKHRoaXMpLnRleHQoKTsgfVxyXG4gICAgICAgICwgcGVyc2lzdGVudDogdHJ1ZVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGF1dG9zaXplKHNsaWRlciwgbGFiZWxzKSB7XHJcbiAgICB2YXIgdG90YWxfd2lkdGggPSAwO1xyXG4gICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRvdGFsX3dpZHRoICs9ICQodGhpcykub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGMgPSBzbGlkZXIuY2xvc2VzdCgnLnVpLXNsaWRlci1jb250YWluZXInKSxcclxuICAgICAgICBtYXggPSBwYXJzZUZsb2F0KGMuY3NzKCdtYXgtd2lkdGgnKSksXHJcbiAgICAgICAgbWluID0gcGFyc2VGbG9hdChjLmNzcygnbWluLXdpZHRoJykpO1xyXG4gICAgaWYgKG1heCAhPSBOdW1iZXIuTmFOICYmIHRvdGFsX3dpZHRoID4gbWF4KVxyXG4gICAgICAgIHRvdGFsX3dpZHRoID0gbWF4O1xyXG4gICAgaWYgKG1pbiAhPSBOdW1iZXIuTmFOICYmIHRvdGFsX3dpZHRoIDwgbWluKVxyXG4gICAgICAgIHRvdGFsX3dpZHRoID0gbWluO1xyXG4gICAgYy53aWR0aCh0b3RhbF93aWR0aCk7XHJcbn1cclxuXHJcbi8qKiBTZXQgb2YgZGlmZmVyZW50IGxheW91dHMgZm9yIGxhYmVscywgYWxsb3dpbmcgZGlmZmVyZW50IGtpbmRzIG9mIFxyXG5wbGFjZW1lbnQgYW5kIHZpc3VhbGl6YXRpb24gdXNpbmcgdGhlIHNsaWRlciBkYXRhIG9wdGlvbiAnbGFiZWxzLWxheW91dCcuXHJcblVzZWQgYnkgJ3VwZGF0ZScsIGFsbW9zdCB0aGUgJ3N0YW5kYXJkJyBtdXN0IGV4aXN0IGFuZCBjYW4gYmUgaW5jcmVhc2VkXHJcbmV4dGVybmFsbHlcclxuKiovXHJcbnZhciBsYXlvdXRzID0ge307XHJcbi8qKiBTaG93IHRoZSBtYXhpbXVtIG51bWJlciBvZiBsYWJlbHMgaW4gZXF1YWxseSBzaXplZCBnYXBzIGJ1dFxyXG50aGUgbGFzdCBsYWJlbCB0aGF0IGlzIGVuc3VyZWQgdG8gYmUgc2hvd2VkIGV2ZW4gaWYgaXQgY3JlYXRlc1xyXG5hIGhpZ2hlciBnYXAgd2l0aCB0aGUgcHJldmlvdXMgb25lLlxyXG4qKi9cclxubGF5b3V0cy5zdGFuZGFyZCA9IGZ1bmN0aW9uIHN0YW5kYXJkX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoZXJlIGFyZSBtb3JlIGxhYmVscyB0aGFuIGF2YWlsYWJsZSBzcGFjZVxyXG4gICAgLy8gR2V0IG1heGltdW0gbGFiZWwgd2lkdGhcclxuICAgIHZhciBpdGVtX3dpZHRoID0gMDtcclxuICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdHcgPSAkKHRoaXMpLm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICAgICAgaWYgKHR3ID49IGl0ZW1fd2lkdGgpXHJcbiAgICAgICAgICAgIGl0ZW1fd2lkdGggPSB0dztcclxuICAgIH0pO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgd2lkdGgsIGlmIG5vdCwgZWxlbWVudCBpcyBub3QgdmlzaWJsZSBjYW5ub3QgYmUgY29tcHV0ZWRcclxuICAgIGlmIChpdGVtX3dpZHRoID4gMCkge1xyXG4gICAgICAgIC8vIEdldCB0aGUgcmVxdWlyZWQgc3RlcHBpbmcgb2YgbGFiZWxzXHJcbiAgICAgICAgdmFyIGxhYmVsc19zdGVwID0gTWF0aC5jZWlsKGl0ZW1fd2lkdGggLyAoc2xpZGVyLndpZHRoKCkgLyBsYWJlbHMubGVuZ3RoKSksXHJcbiAgICAgICAgbGFiZWxzX3N0ZXBzID0gbGFiZWxzLmxlbmd0aCAvIGxhYmVsc19zdGVwO1xyXG4gICAgICAgIGlmIChsYWJlbHNfc3RlcCA+IDEpIHtcclxuICAgICAgICAgICAgLy8gSGlkZSB0aGUgbGFiZWxzIG9uIHBvc2l0aW9ucyBvdXQgb2YgdGhlIHN0ZXBcclxuICAgICAgICAgICAgdmFyIG5ld2kgPSAwLFxyXG4gICAgICAgICAgICAgICAgbGltaXQgPSBsYWJlbHMubGVuZ3RoIC0gMSAtIGxhYmVsc19zdGVwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhYmVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxibCA9ICQobGFiZWxzW2ldKTtcclxuICAgICAgICAgICAgICAgIGlmICgoaSArIDEpIDwgbGFiZWxzLmxlbmd0aCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgaSAlIGxhYmVsc19zdGVwIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgaSA+IGxpbWl0KSlcclxuICAgICAgICAgICAgICAgICAgICBsYmwuaGlkZSgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxibC5zaG93KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXBvc2l0aW9uYXRlIHBhcmVudFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uYXRlKHBhcmVudCwgbmV3aSwgbGFiZWxzX3N0ZXBzKTtcclxuICAgICAgICAgICAgICAgICAgICBuZXdpKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbi8qKiBTaG93IGxhYmVscyBudW1iZXIgdmFsdWVzIGZvcm1hdHRlZCBhcyBob3Vycywgd2l0aCBvbmx5XHJcbmludGVnZXIgaG91cnMgYmVpbmcgc2hvd2VkLCB0aGUgbWF4aW11bSBudW1iZXIgb2YgaXQuXHJcbioqL1xyXG5sYXlvdXRzLmhvdXJzID0gZnVuY3Rpb24gaG91cnNfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscywgc2hvd19hbGwpIHtcclxuICAgIHZhciBpbnRMYWJlbHMgPSBzbGlkZXIuZmluZCgnLmludGVnZXItaG91cicpO1xyXG4gICAgaWYgKCFpbnRMYWJlbHMubGVuZ3RoKSB7XHJcbiAgICAgICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAoISR0LmRhdGEoJ2hvdXItcHJvY2Vzc2VkJykpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2ID0gcGFyc2VGbG9hdCgkdC50ZXh0KCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHYgIT0gTnVtYmVyLk5hTikge1xyXG4gICAgICAgICAgICAgICAgICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2ICUgMSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2RlY2ltYWwtaG91cicpLmhpZGUoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodiAlIDAuNSA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnBhcmVudCgpLmFkZENsYXNzKCdzdHJvbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQudGV4dChUaW1lU3Bhbi5mcm9tSG91cnModikudG9TaG9ydFN0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnaW50ZWdlci1ob3VyJykuc2hvdygpLnBhcmVudCgpLmFkZENsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGludExhYmVscyA9IGludExhYmVscy5hZGQoJHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ2hvdXItcHJvY2Vzc2VkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChzaG93X2FsbCAhPT0gdHJ1ZSlcclxuICAgICAgICBsYXlvdXRzLnN0YW5kYXJkKHNsaWRlciwgaW50TGFiZWxzLnBhcmVudCgpLCBpbnRMYWJlbHMpO1xyXG59O1xyXG5sYXlvdXRzWydhbGwtdmFsdWVzJ10gPSBmdW5jdGlvbiBhbGxfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscykge1xyXG4gICAgLy8gU2hvd2luZyBhbGwgbGFiZWxzXHJcbiAgICBsYWJlbHNfYy5zaG93KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKS5jaGlsZHJlbigpLnNob3coKTtcclxufTtcclxubGF5b3V0c1snYWxsLWhvdXJzJ10gPSBmdW5jdGlvbiBhbGxfaG91cnNfbGF5b3V0KCkge1xyXG4gICAgLy8gSnVzdCB1c2UgaG91cnMgbGF5b3V0IGJ1dCBzaG93aW5nIGFsbCBpbnRlZ2VyIGhvdXJzXHJcbiAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKGFyZ3VtZW50cywgdHJ1ZSk7XHJcbiAgICBsYXlvdXRzLmhvdXJzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNyZWF0ZTogY3JlYXRlLFxyXG4gICAgdXBkYXRlOiB1cGRhdGUsXHJcbiAgICBsYXlvdXRzOiBsYXlvdXRzXHJcbn07XHJcbiIsIi8qIFNldCBvZiBjb21tb24gTEMgY2FsbGJhY2tzIGZvciBtb3N0IEFqYXggb3BlcmF0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgdmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vLyBBS0E6IGFqYXhFcnJvclBvcHVwSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uRXJyb3IoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAvLyBJZiBpcyBhIGNvbm5lY3Rpb24gYWJvcnRlZCwgbm8gc2hvdyBtZXNzYWdlLlxyXG4gICAgLy8gcmVhZHlTdGF0ZSBkaWZmZXJlbnQgdG8gJ2RvbmU6NCcgbWVhbnMgYWJvcnRlZCB0b28sIFxyXG4gICAgLy8gYmVjYXVzZSB3aW5kb3cgYmVpbmcgY2xvc2VkL2xvY2F0aW9uIGNoYW5nZWRcclxuICAgIGlmIChtZXNzYWdlID09ICdhYm9ydCcgfHwgangucmVhZHlTdGF0ZSAhPSA0KVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICB2YXIgbSA9IG1lc3NhZ2U7XHJcbiAgICB2YXIgaWZyYW1lID0gbnVsbDtcclxuICAgIHNpemUgPSBwb3B1cC5zaXplKCdsYXJnZScpO1xyXG4gICAgc2l6ZS5oZWlnaHQgLT0gMzQ7XHJcbiAgICBpZiAobSA9PSAnZXJyb3InKSB7XHJcbiAgICAgICAgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGp4LnJlc3BvbnNlVGV4dCwgc2l6ZSk7XHJcbiAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICBtID0gbnVsbDtcclxuICAgIH0gIGVsc2VcclxuICAgICAgICBtID0gbSArIFwiOyBcIiArIGV4O1xyXG5cclxuICAgIC8vIEJsb2NrIGFsbCB3aW5kb3csIG5vdCBvbmx5IGN1cnJlbnQgZWxlbWVudFxyXG4gICAgJC5ibG9ja1VJKGVycm9yQmxvY2sobSwgbnVsbCwgcG9wdXAuc3R5bGUoc2l6ZSkpKTtcclxuICAgIGlmIChpZnJhbWUpXHJcbiAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAkKCcuYmxvY2tVSSAuY2xvc2UtcG9wdXAnKS5jbGljayhmdW5jdGlvbiAoKSB7ICQudW5ibG9ja1VJKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25Db21wbGV0ZSgpIHtcclxuICAgIC8vIERpc2FibGUgbG9hZGluZ1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ3RpbWVyIHx8IHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIC8vIFVuYmxvY2tcclxuICAgIGlmICh0aGlzLmF1dG9VbmJsb2NrTG9hZGluZykge1xyXG4gICAgICAgIC8vIERvdWJsZSB1bi1sb2NrLCBiZWNhdXNlIGFueSBvZiB0aGUgdHdvIHN5c3RlbXMgY2FuIGJlaW5nIHVzZWQ6XHJcbiAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5ib3gpO1xyXG4gICAgICAgIHRoaXMuYm94LnVuYmxvY2soKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICAvLyBTdXBwb3J0ZWQgdGhlIGdlbmVyaWMgY3R4LmVsZW1lbnQgZnJvbSBqcXVlcnkucmVsb2FkXHJcbiAgICBpZiAoY3R4LmVsZW1lbnQpIGN0eC5mb3JtID0gY3R4LmVsZW1lbnQ7XHJcbiAgICAvLyBTcGVjaWZpYyBzdHVmZiBvZiBhamF4Rm9ybXNcclxuICAgIGlmICghY3R4LmZvcm0pIGN0eC5mb3JtID0gJCh0aGlzKTtcclxuICAgIGlmICghY3R4LmJveCkgY3R4LmJveCA9IGN0eC5mb3JtO1xyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gRG8gSlNPTiBhY3Rpb24gYnV0IGlmIGlzIG5vdCBKU09OIG9yIHZhbGlkLCBtYW5hZ2UgYXMgSFRNTDpcclxuICAgIGlmICghZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpKSB7XHJcbiAgICAgICAgLy8gUG9zdCAnbWF5YmUnIHdhcyB3cm9uZywgaHRtbCB3YXMgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IFxyXG4gICAgICAgIC8vIGZvcm0gY29udGFpbmVyOiB0aGUgYWpheC1ib3guXHJcblxyXG4gICAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgICAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgICAgICAvLyBBdm9pZCBlbXB0eSBkb2N1bWVudHMgYmVpbmcgcGFyc2VkIChyYWlzZSBlcnJvcilcclxuICAgICAgICBpZiAoJC50cmltKGRhdGEpKSB7XHJcbiAgICAgICAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhIG1hbGZvcm1lZCBkb2N1bWVudCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZvciAncmVsb2FkJyBzdXBwb3J0LCBjaGVjayB0b28gdGhlIGNvbnRleHQubW9kZSwgYW5kIGJvdGggcmVsb2FkIG9yIGFqYXhGb3JtcyBjaGVjayBkYXRhIGF0dHJpYnV0ZSB0b29cclxuICAgICAgICBjdHguYm94SXNDb250YWluZXIgPSBjdHguYm94SXNDb250YWluZXI7XHJcbiAgICAgICAgdmFyIHJlcGxhY2VCb3hDb250ZW50ID1cclxuICAgICAgICAgIChjdHgub3B0aW9ucyAmJiBjdHgub3B0aW9ucy5tb2RlID09PSAncmVwbGFjZS1jb250ZW50JykgfHxcclxuICAgICAgICAgIGN0eC5ib3guZGF0YSgncmVsb2FkLW1vZGUnKSA9PT0gJ3JlcGxhY2UtY29udGVudCc7XHJcblxyXG4gICAgICAgIC8vIFN1cHBvcnQgZm9yIHJlbG9hZCwgYXZvaWRpbmcgaW1wb3J0YW50IGJ1Z3Mgd2l0aCByZWxvYWRpbmcgYm94ZXMgdGhhdCBjb250YWlucyBmb3JtczpcclxuICAgICAgICAvLyBJZiBvcGVyYXRpb24gaXMgYSByZWxvYWQsIGRvbid0IGNoZWNrIHRoZSBhamF4LWJveFxyXG4gICAgICAgIHZhciBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgaWYgKCFjdHguaXNSZWxvYWQpIHtcclxuICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSByZXR1cm5lZCBlbGVtZW50IGlzIHRoZSBhamF4LWJveCwgaWYgbm90LCBmaW5kXHJcbiAgICAgICAgICAvLyB0aGUgZWxlbWVudCBpbiB0aGUgbmV3aHRtbDpcclxuICAgICAgICAgIGpiID0gbmV3aHRtbC5maWx0ZXIoJy5hamF4LWJveCcpO1xyXG4gICAgICAgICAgaWYgKGpiLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sO1xyXG4gICAgICAgICAgaWYgKCFjdHguYm94SXNDb250YWluZXIgJiYgIWpiLmlzKCcuYWpheC1ib3gnKSlcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sLmZpbmQoJy5hamF4LWJveDplcSgwKScpO1xyXG4gICAgICAgICAgaWYgKCFqYiB8fCBqYi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gYWpheC1ib3gsIHVzZSBhbGwgZWxlbWVudCByZXR1cm5lZDpcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChyZXBsYWNlQm94Q29udGVudClcclxuICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgYm94IGNvbnRlbnQgd2l0aCB0aGUgY29udGVudCBvZiB0aGUgcmV0dXJuZWQgYm94XHJcbiAgICAgICAgICAgIC8vIG9yIGFsbCBpZiB0aGVyZSBpcyBubyBhamF4LWJveCBpbiB0aGUgcmVzdWx0LlxyXG4gICAgICAgICAgICBqYiA9IGpiLmlzKCcuYWpheC1ib3gnKSA/IGpiLmNvbnRlbnRzKCkgOiBqYjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZXBsYWNlQm94Q29udGVudCkge1xyXG4gICAgICAgICAgY3R4LmJveC5lbXB0eSgpLmFwcGVuZChqYik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjdHguYm94SXNDb250YWluZXIpIHtcclxuICAgICAgICAgICAgLy8gamIgaXMgY29udGVudCBvZiB0aGUgYm94IGNvbnRhaW5lcjpcclxuICAgICAgICAgICAgY3R4LmJveC5odG1sKGpiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBib3ggaXMgY29udGVudCB0aGF0IG11c3QgYmUgcmVwbGFjZWQgYnkgdGhlIG5ldyBjb250ZW50OlxyXG4gICAgICAgICAgICBjdHguYm94LnJlcGxhY2VXaXRoKGpiKTtcclxuICAgICAgICAgICAgLy8gYW5kIHJlZnJlc2ggdGhlIHJlZmVyZW5jZSB0byBib3ggd2l0aCB0aGUgbmV3IGVsZW1lbnRcclxuICAgICAgICAgICAgY3R4LmJveCA9IGpiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSXQgc3VwcG9ydHMgbm9ybWFsIGFqYXggZm9ybXMgYW5kIHN1YmZvcm1zIHRocm91Z2ggZmllbGRzZXQuYWpheFxyXG4gICAgICAgIGlmIChjdHguYm94LmlzKCdmb3JtLmFqYXgnKSB8fCBjdHguYm94LmlzKCdmaWVsZHNldC5hamF4JykpXHJcbiAgICAgICAgICBjdHguZm9ybSA9IGN0eC5ib3g7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBjdHguZm9ybSA9IGN0eC5ib3guZmluZCgnZm9ybS5hamF4OmVxKDApJyk7XHJcbiAgICAgICAgICBpZiAoY3R4LmZvcm0ubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBjdHguZm9ybSA9IGN0eC5ib3guZmluZCgnZmllbGRzZXQuYWpheDplcSgwKScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ2hhbmdlc25vdGlmaWNhdGlvbiBhZnRlciBhcHBlbmQgZWxlbWVudCB0byBkb2N1bWVudCwgaWYgbm90IHdpbGwgbm90IHdvcms6XHJcbiAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQgKGlmIHdhcyBzYXZlZCBidXQgc2VydmVyIGRlY2lkZSByZXR1cm5zIGh0bWwgaW5zdGVhZCBhIEpTT04gY29kZSwgcGFnZSBzY3JpcHQgbXVzdCBkbyAncmVnaXN0ZXJTYXZlJyB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZSk6XHJcbiAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5nZXQoMCksXHJcbiAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIE1vdmUgZm9jdXMgdG8gdGhlIGVycm9ycyBhcHBlYXJlZCBvbiB0aGUgcGFnZSAoaWYgdGhlcmUgYXJlKTpcclxuICAgICAgICB2YXIgdmFsaWRhdGlvblN1bW1hcnkgPSBqYi5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0aW9uU3VtbWFyeS5sZW5ndGgpXHJcbiAgICAgICAgICBtb3ZlRm9jdXNUbyh2YWxpZGF0aW9uU3VtbWFyeSk7XHJcbiAgICAgICAgLy8gVE9ETzogSXQgc2VlbXMgdGhhdCBpdCByZXR1cm5zIGEgZG9jdW1lbnQtZnJhZ21lbnQgaW5zdGVhZCBvZiBhIGVsZW1lbnQgYWxyZWFkeSBpbiBkb2N1bWVudFxyXG4gICAgICAgIC8vIGZvciBjdHguZm9ybSAobWF5YmUgamIgdG9vPykgd2hlbiB1c2luZyAqIGN0eC5ib3guZGF0YSgncmVsb2FkLW1vZGUnKSA9PT0gJ3JlcGxhY2UtY29udGVudCcgKiBcclxuICAgICAgICAvLyAobWF5YmUgb24gb3RoZXIgY2FzZXMgdG9vPykuXHJcbiAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCBbamIsIGN0eC5mb3JtLCBqeF0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuICovXHJcbmZ1bmN0aW9uIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgbWVzc2FnZSA9IG1lc3NhZ2UgfHwgY3R4LmZvcm0uZGF0YSgnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnKSB8fCAnRG9uZSEnO1xyXG4gICAgY3R4LmJveC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgIGNzczogcG9wdXAuc3R5bGUocG9wdXAuc2l6ZSgnc21hbGwnKSlcclxuICAgIH0pKVxyXG4gICAgLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IFxyXG4gICAgfSk7XHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiovXHJcbmZ1bmN0aW9uIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuXHJcbiAgICB2YXIgY29udGVudCA9ICQoJzxkaXYgY2xhc3M9XCJvay1nby1ib3hcIi8+Jyk7XHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8c3BhbiBjbGFzcz1cInN1Y2Nlc3MtbWVzc2FnZVwiLz4nKS5hcHBlbmQoZGF0YS5TdWNjZXNzTWVzc2FnZSkpO1xyXG4gICAgaWYgKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpXHJcbiAgICAgICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFkZGl0aW9uYWwtbWVzc2FnZVwiLz4nKS5hcHBlbmQoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSkpO1xyXG5cclxuICAgIHZhciBva0J0biA9ICQoJzxhIGNsYXNzPVwiYWN0aW9uIG9rLWFjdGlvbiBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI29rXCIvPicpLmFwcGVuZChkYXRhLk9rTGFiZWwpO1xyXG4gICAgdmFyIGdvQnRuID0gJyc7XHJcbiAgICBpZiAoZGF0YS5Hb1VSTCAmJiBkYXRhLkdvTGFiZWwpIHtcclxuICAgICAgICBnb0J0biA9ICQoJzxhIGNsYXNzPVwiYWN0aW9uIGdvLWFjdGlvblwiLz4nKS5hdHRyKCdocmVmJywgZGF0YS5Hb1VSTCkuYXBwZW5kKGRhdGEuR29MYWJlbCk7XHJcbiAgICAgICAgLy8gRm9yY2luZyB0aGUgJ2Nsb3NlLWFjdGlvbicgaW4gc3VjaCBhIHdheSB0aGF0IGZvciBpbnRlcm5hbCBsaW5rcyB0aGUgcG9wdXAgZ2V0cyBjbG9zZWQgaW4gYSBzYWZlIHdheTpcclxuICAgICAgICBnb0J0bi5jbGljayhmdW5jdGlvbiAoKSB7IG9rQnRuLmNsaWNrKCk7IGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhY3Rpb25zIGNsZWFyZml4XCIvPicpLmFwcGVuZChva0J0bikuYXBwZW5kKGdvQnRuKSk7XHJcblxyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjdHguYm94LCBudWxsLCB7XHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSB7XHJcbiAgICAvLyBJZiBpcyBhIEpTT04gcmVzdWx0OlxyXG4gICAgaWYgKHR5cGVvZiAoZGF0YSkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgaWYgKGN0eC5ib3gpXHJcbiAgICAgICAgICAgIC8vIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzXHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGN0eC5ib3gpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAwOiBnZW5lcmFsIHN1Y2Nlc3MgY29kZSwgc2hvdyBtZXNzYWdlIHNheWluZyB0aGF0ICdhbGwgd2FzIGZpbmUnXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LCBkYXRhKTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAxOiBkbyBhIHJlZGlyZWN0XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMSkge1xyXG4gICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAyOiBzaG93IGxvZ2luIHBvcHVwICh3aXRoIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAzKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAzOiByZWxvYWQgY3VycmVudCBwYWdlIGNvbnRlbnQgdG8gdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgLy8gTm90ZTogdG8gcmVsb2FkIHNhbWUgdXJsIHBhZ2UgY29udGVudCwgaXMgYmV0dGVyIHJldHVybiB0aGUgaHRtbCBkaXJlY3RseSBmcm9tXHJcbiAgICAgICAgICAgIC8vIHRoaXMgYWpheCBzZXJ2ZXIgcmVxdWVzdC5cclxuICAgICAgICAgICAgLy9jb250YWluZXIudW5ibG9jaygpOyBpcyBibG9ja2VkIGFuZCB1bmJsb2NrZWQgYWdhaW4gYnkgdGhlIHJlbG9hZCBtZXRob2Q6XHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgY3R4LmJveC5yZWxvYWQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDQpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyBTdWNjZXNzTWVzc2FnZSwgYXR0YWNoaW5nIGFuZCBldmVudCBoYW5kbGVyIHRvIGdvIHRvIFJlZGlyZWN0VVJMXHJcbiAgICAgICAgICAgIGN0eC5ib3gub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0LlJlZGlyZWN0VVJMKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LlN1Y2Nlc3NNZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA1KSB7XHJcbiAgICAgICAgICAgIC8vIENoYW5nZSBtYWluLWFjdGlvbiBidXR0b24gbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIGJ0biA9IGN0eC5mb3JtLmZpbmQoJy5tYWluLWFjdGlvbicpO1xyXG4gICAgICAgICAgICB2YXIgZG1zZyA9IGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKTtcclxuICAgICAgICAgICAgaWYgKCFkbXNnKVxyXG4gICAgICAgICAgICAgICAgYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcsIGJ0bi50ZXh0KCkpO1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZGF0YS5SZXN1bHQgfHwgYnRuLmRhdGEoJ3N1Y2Nlc3MtcG9zdC10ZXh0JykgfHwgJ0RvbmUhJztcclxuICAgICAgICAgICAgYnRuLnRleHQobXNnKTtcclxuICAgICAgICAgICAgLy8gQWRkaW5nIHN1cHBvcnQgdG8gcmVzZXQgYnV0dG9uIHRleHQgdG8gZGVmYXVsdCBvbmVcclxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgRmlyc3QgbmV4dCBjaGFuZ2VzIGhhcHBlbnMgb24gdGhlIGZvcm06XHJcbiAgICAgICAgICAgICQoY3R4LmZvcm0pLm9uZSgnbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGJ0bi50ZXh0KGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IGZvciBjdXN0b20gaGFuZGxlcnNcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBPay1HbyBhY3Rpb25zIHBvcHVwIHdpdGggJ3N1Y2Nlc3MnIGFuZCAnYWRkaXRpb25hbCcgbWVzc2FnZXMuXHJcbiAgICAgICAgICAgIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDcpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDc6IHNob3cgbWVzc2FnZSBzYXlpbmcgY29udGFpbmVkIGF0IGRhdGEuUmVzdWx0Lk1lc3NhZ2UuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgY29kZSBhbGxvdyBhdHRhY2ggYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpbiBkYXRhLlJlc3VsdCB0byBkaXN0aW5ndWlzaFxyXG4gICAgICAgICAgICAvLyBkaWZmZXJlbnQgcmVzdWx0cyBhbGwgc2hvd2luZyBhIG1lc3NhZ2UgYnV0IG1heWJlIG5vdCBiZWluZyBhIHN1Y2Nlc3MgYXQgYWxsXHJcbiAgICAgICAgICAgIC8vIGFuZCBtYXliZSBkb2luZyBzb21ldGhpbmcgbW9yZSBpbiB0aGUgdHJpZ2dlcmVkIGV2ZW50IHdpdGggdGhlIGRhdGEgb2JqZWN0LlxyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5NZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gOCkge1xyXG4gICAgICAgICAgICAvLyBTaG93IHZhbGlkYXRpb24gbWVzc2FnZXNcclxuICAgICAgICAgICAgdmFyIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKTtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbkhlbHBlci5zZXRFcnJvcnMoY3R4LmZvcm0sIGRhdGEuUmVzdWx0LkVycm9ycyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPiAxMDApIHtcclxuICAgICAgICAgICAgLy8gVXNlciBDb2RlOiB0cmlnZ2VyIGN1c3RvbSBldmVudCB0byBtYW5hZ2UgcmVzdWx0czpcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4LCBjdHhdKTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBkYXRhLkNvZGUgPCAwXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGFuIGVycm9yIGNvZGUuXHJcblxyXG4gICAgICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgICAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKGN0eC5mb3JtLmdldCgwKSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgICAgICAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gXCJFcnJvcjogXCIgKyBkYXRhLkNvZGUgKyBcIjogXCIgKyBKU09OLnN0cmluZ2lmeShkYXRhLlJlc3VsdCA/IChkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgPyBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgOiBkYXRhLlJlc3VsdCkgOiAnJyk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJCgnPGRpdi8+JykuYXBwZW5kKG1lc3NhZ2UpLCBjdHguYm94LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlcnJvcjogbGNPbkVycm9yLFxyXG4gICAgICAgIHN1Y2Nlc3M6IGxjT25TdWNjZXNzLFxyXG4gICAgICAgIGNvbXBsZXRlOiBsY09uQ29tcGxldGUsXHJcbiAgICAgICAgZG9KU09OQWN0aW9uOiBkb0pTT05BY3Rpb25cclxuICAgIH07XHJcbn0iLCIvKiBGb3JtcyBzdWJtaXR0ZWQgdmlhIEFKQVggKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICAgIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGdldFhQYXRoID0gcmVxdWlyZSgnLi9nZXRYUGF0aCcpO1xyXG5cclxualF1ZXJ5ID0gJDtcclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5ncywgd2lsbCBiZSB1cGRhdGVkIG9uIGluaXQgYnV0IGlzIGFjY2Vzc2VkXHJcbi8vIHRocm91Z2ggY2xvc3VyZSBmcm9tIGFsbCBmdW5jdGlvbnMuXHJcbi8vIE5PVEU6IGlzIHN0YXRpYywgZG9lc24ndCBhbGxvd3MgbXVsdGlwbGUgY29uZmlndXJhdGlvbiwgb25lIGluaXQgY2FsbCByZXBsYWNlIHByZXZpb3VzXHJcbi8vIERlZmF1bHRzOlxyXG52YXIgc2V0dGluZ3MgPSB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IDAsXHJcbiAgICBlbGVtZW50OiBkb2N1bWVudFxyXG59O1xyXG5cclxuLy8gQWRhcHRlZCBjYWxsYmFja3NcclxuZnVuY3Rpb24gYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyKCkge1xyXG4gICAgY2FsbGJhY2tzLmNvbXBsZXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFqYXhFcnJvclBvcHVwSGFuZGxlcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0sIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIENvbW1vbiBsb2dpY1xyXG4gICAgY2FsbGJhY2tzLmVycm9yLmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIoKSB7XHJcbiAgY2FsbGJhY2tzLnN1Y2Nlc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuLyoqXHJcbiAgUGVyZm9ybXMgdGhlIHZhbGlkYXRpb24gb24gdGhlIGZvcm0gb3Igc3ViZm9ybSBhcyBkZXRlcm1pbmVcclxuICB0aGUgdmFsdWVzIGluIHRoZSBjb250ZXh0IChAY3R4KSwgcmV0dXJuaW5nIHRydWUgZm9yIHN1Y2Nlc3NcclxuICBhbmQgZmFsc2UgZm9yIHNvbWUgZXJyb3IgKGVsZW1lbnRzIGdldCBtYXJrZWQgd2l0aCB0aGUgZXJyb3IsXHJcbiAganVzdCB0aGUgY2FsbGVyIG11c3Qgc3RvcCBhbnkgdGFzayBvbiBmYWxzZSkuXHJcbioqL1xyXG5mdW5jdGlvbiB2YWxpZGF0ZUZvcm0oY3R4KSB7XHJcbiAgLy8gVmFsaWRhdGlvbnNcclxuICB2YXIgdmFsaWRhdGlvblBhc3NlZCA9IHRydWU7XHJcbiAgLy8gVG8gc3VwcG9ydCBzdWItZm9ybXMgdGhyb3VoIGZpZWxkc2V0LmFqYXgsIHdlIG11c3QgZXhlY3V0ZSB2YWxpZGF0aW9ucyBhbmQgdmVyaWZpY2F0aW9uXHJcbiAgLy8gaW4gdHdvIHN0ZXBzIGFuZCB1c2luZyB0aGUgcmVhbCBmb3JtIHRvIGxldCB2YWxpZGF0aW9uIG1lY2hhbmlzbSB3b3JrXHJcbiAgdmFyIGlzU3ViZm9ybSA9IGN0eC5mb3JtLmlzKCdmaWVsZHNldC5hamF4Jyk7XHJcbiAgdmFyIGFjdHVhbEZvcm0gPSBpc1N1YmZvcm0gPyBjdHguZm9ybS5jbG9zZXN0KCdmb3JtJykgOiBjdHguZm9ybSxcclxuICAgICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBuZXcgalF1ZXJ5KCksXHJcbiAgICAgIGRpc2FibGVkRmllbGRzID0gbmV3IGpRdWVyeSgpO1xyXG5cclxuICAvLyBPbiBzdWJmb3JtIHZhbGlkYXRpb24sIHdlIGRvbid0IHdhbnQgdGhlIG91dHNpZGUgc3ViZm9ybSBlbGVtZW50cyBhbmQgdmFsaWRhdGlvbi1zdW1tYXJ5IGNvbnRyb2xzIHRvIGJlIGFmZmVjdGVkXHJcbiAgLy8gYnkgdGhpcyB2YWxpZGF0aW9uICh0byBhdm9pZCB0byBzaG93IGVycm9ycyB0aGVyZSB0aGF0IGRvZXNuJ3QgaW50ZXJlc3QgdG8gdGhlIHJlc3Qgb2YgdGhlIGZvcm0pXHJcbiAgLy8gVG8gZnVsbGZpbGwgdGhpcyByZXF1aXNpdCwgd2UgbmVlZCB0byBoaWRlIGl0IGZvciB0aGUgdmFsaWRhdG9yIGZvciBhIHdoaWxlIGFuZCBsZXQgb25seSBhZmZlY3RcclxuICAvLyBhbnkgbG9jYWwgc3VtbWFyeSAoaW5zaWRlIHRoZSBzdWJmb3JtKS5cclxuICAvLyBUaGUgc2FtZSBmb3IgZm9ybSBlbGVtZW50cyBvdXRzaWRlIHRoZSBzdWJmb3JtLCB3ZSBkb24ndCB3YW50IGl0cyBlcnJvcnMgZm9yIG5vdy5cclxuICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICB2YXIgb3V0c2lkZUVsZW1lbnRzID0gKGZ1bmN0aW9uKGYpIHtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBPbmx5IHRob3NlIHRoYXQgYXJlIG91dHNpZGUgdGhlIHN1YmZvcm1cclxuICAgICAgICByZXR1cm4gISQuY29udGFpbnMoZiwgdGhpcyk7XHJcbiAgICAgIH07XHJcbiAgICB9KShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIGRpc2FibGVkU3VtbWFyaWVzID0gYWN0dWFsRm9ybVxyXG4gICAgLmZpbmQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJylcclxuICAgIC5maWx0ZXIob3V0c2lkZUVsZW1lbnRzKVxyXG4gICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgLy8gKGluIG90aGVyIHdvcmRzLCB1c2luZyAnZGF0YScgd2lsbCBub3Qgd29yaylcclxuICAgIC5hdHRyKCdkYXRhLXZhbG1zZy1zdW1tYXJ5JywgJ2ZhbHNlJyk7XHJcblxyXG4gICAgZGlzYWJsZWRGaWVsZHMgPSBhY3R1YWxGb3JtXHJcbiAgICAuZmluZCgnW2RhdGEtdmFsPXRydWVdJylcclxuICAgIC5maWx0ZXIob3V0c2lkZUVsZW1lbnRzKVxyXG4gICAgLmF0dHIoJ2RhdGEtdmFsJywgJ2ZhbHNlJyk7XHJcbiAgfVxyXG5cclxuICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICB2YXIgdmFsb2JqZWN0ID0gYWN0dWFsRm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycyhjdHguZm9ybSk7XHJcbiAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZS5cclxuICAvLyBDdXN0b20gdmFsaWRhdGlvbiBjYW4gYmUgYXR0YWNoZWQgdG8gZm9ybXMgb3IgZmllbGRzZXQsIGJ1dFxyXG4gIC8vIHRvIHN1cHBvcnQgc3ViZm9ybXMsIG9ubHkgZXhlY3V0ZSBpbiB0aGUgY3R4LmZvcm0gZWxlbWVudCAoY2FuIGJlIFxyXG4gIC8vIGEgZmllbHNldCBzdWJmb3JtKSBhbmQgYW55IGNoaWxkcmVuIGZpZWxkc2V0LlxyXG4gIGN0eC5mb3JtLmFkZChjdHguZm9ybS5maW5kKCdmaWVsZHNldCcpKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjdXN2YWwgPSAkKHRoaXMpLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgIGlmIChjdXN2YWwgJiYgY3VzdmFsLnZhbGlkYXRlICYmIGN1c3ZhbC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgICAgdmFsaWRhdGlvblBhc3NlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3Jtcywgd2UgbXVzdCBjaGVjayB0aGF0IHZhbGlkYXRpb25zIGVycm9ycyBoYXBwZW5lZCBpbnNpZGUgdGhlXHJcbiAgLy8gc3ViZm9ybSBhbmQgbm90IGluIG90aGVyIGVsZW1lbnRzLCB0byBkb24ndCBzdG9wIHN1Ym1pdCBvbiBub3QgcmVsYXRlZCBlcnJvcnMuXHJcbiAgLy8gKHdlIGF2b2lkIGV4ZWN1dGUgdmFsaWRhdGlvbiBvbiB0aGF0IGVsZW1lbnRzIGJ1dCBjb3VsZCBoYXBwZW4gYSBwcmV2aW91cyB2YWxpZGF0aW9uKVxyXG4gIC8vIEp1c3QgbG9vayBmb3IgbWFya2VkIGVsZW1lbnRzOlxyXG4gIGlmIChpc1N1YmZvcm0gJiYgY3R4LmZvcm0uZmluZCgnLmlucHV0LXZhbGlkYXRpb24tZXJyb3InKS5sZW5ndGgpXHJcbiAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcblxyXG4gIC8vIFJlLWVuYWJsZSBhZ2FpbiB0aGF0IHN1bW1hcmllcyBwcmV2aW91c2x5IGRpc2FibGVkXHJcbiAgaWYgKGlzU3ViZm9ybSkge1xyXG4gICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgLy8gKGluIG90aGVyIHdvcmRzLCB1c2luZyAnZGF0YScgd2lsbCBub3Qgd29yaylcclxuICAgIGRpc2FibGVkU3VtbWFyaWVzLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAndHJ1ZScpO1xyXG4gICAgZGlzYWJsZWRGaWVsZHMuYXR0cignZGF0YS12YWwnLCAndHJ1ZScpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHZhbGlkYXRpb25QYXNzZWQ7XHJcbn1cclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiogQWpheCBGb3JtcyBnZW5lcmljIGZ1bmN0aW9uLlxyXG4qIFJlc3VsdCBleHBlY3RlZCBpczpcclxuKiAtIGh0bWwsIGZvciB2YWxpZGF0aW9uIGVycm9ycyBmcm9tIHNlcnZlciwgcmVwbGFjaW5nIGN1cnJlbnQgLmFqYXgtYm94IGNvbnRlbnRcclxuKiAtIGpzb24sIHdpdGggc3RydWN0dXJlOiB7IENvZGU6IGludGVnZXItbnVtYmVyLCBSZXN1bHQ6IHN0cmluZy1vci1vYmplY3QgfVxyXG4qICAgQ29kZSBudW1iZXJzOlxyXG4qICAgIC0gTmVnYXRpdmU6IGVycm9ycywgd2l0aCBhIFJlc3VsdCBvYmplY3QgeyBFcnJvck1lc3NhZ2U6IHN0cmluZyB9XHJcbiogICAgLSBaZXJvOiBzdWNjZXNzIHJlc3VsdCwgaXQgc2hvd3MgYSBtZXNzYWdlIHdpdGggY29udGVudDogUmVzdWx0IHN0cmluZywgZWxzZSBmb3JtIGRhdGEgYXR0cmlidXRlICdzdWNjZXNzLXBvc3QtbWVzc2FnZScsIGVsc2UgYSBnZW5lcmljIG1lc3NhZ2VcclxuKiAgICAtIDE6IHN1Y2Nlc3MgcmVzdWx0LCBSZXN1bHQgY29udGFpbnMgYSBVUkwsIHRoZSBwYWdlIHdpbGwgYmUgcmVkaXJlY3RlZCB0byB0aGF0LlxyXG4qICAgIC0gTWFqb3IgMTogc3VjY2VzcyByZXN1bHQsIHdpdGggY3VzdG9tIGhhbmRsZXIgdGhyb3VnaHQgdGhlIGZvcm0gZXZlbnQgJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJy5cclxuKi9cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VibWl0SGFuZGxlcihldmVudCkge1xyXG4gICAgLy8gQ29udGV4dCB2YXIsIHVzZWQgYXMgYWpheCBjb250ZXh0OlxyXG4gICAgdmFyIGN0eCA9IHt9O1xyXG4gICAgLy8gRGVmYXVsdCBkYXRhIGZvciByZXF1aXJlZCBwYXJhbXM6XHJcbiAgICBjdHguZm9ybSA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5mb3JtIDogbnVsbCkgfHwgJCh0aGlzKTtcclxuICAgIGN0eC5ib3ggPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuYm94IDogbnVsbCkgfHwgY3R4LmZvcm0uY2xvc2VzdChcIi5hamF4LWJveFwiKTtcclxuICAgIHZhciBhY3Rpb24gPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuYWN0aW9uIDogbnVsbCkgfHwgY3R4LmZvcm0uYXR0cignYWN0aW9uJykgfHwgJyc7XHJcblxyXG4gICAgdmFyIHBvc3RWYWxpZGF0aW9uID0gY3R4LmZvcm0uZGF0YSgncG9zdC12YWxpZGF0aW9uJyk7XHJcbiAgICB2YXIgcmVxdWVzdHMgPSBjdHguZm9ybS5kYXRhKCd4aHItcmVxdWVzdHMnKSB8fCBbXTtcclxuICAgIGN0eC5mb3JtLmRhdGEoJ3hoci1yZXF1ZXN0cycsIHJlcXVlc3RzKTtcclxuXHJcbiAgICBpZiAoIXBvc3RWYWxpZGF0aW9uKSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgdmFsaWRhdGlvblxyXG4gICAgICAgIGlmICh2YWxpZGF0ZUZvcm0oY3R4KSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgLy8gVmFsaWRhdGlvbiBmYWlsZWQsIHN1Ym1pdCBjYW5ub3QgY29udGludWUsIG91dCFcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5jaGFuZ2VkRWxlbWVudHMgOiBudWxsKSB8fCBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBldmVudCB0byBhbGxvdyBzY3JpcHRzIHRvIGhvb2sgYWRkaXRpb25hbCB0YXNrcyBiZWZvcmUgc2VuZCBkYXRhXHJcbiAgICBjdHguZm9ybS50cmlnZ2VyKCdwcmVzdWJtaXQnLCBbY3R4XSk7XHJcblxyXG4gICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgIH0sIHNldHRpbmdzLmxvYWRpbmdEZWxheSk7XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICB2YXIgZGF0YSA9IGN0eC5mb3JtLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpO1xyXG5cclxuICAgIC8vIEFib3J0IHByZXZpb3VzIHJlcXVlc3RzXHJcbiAgICAkLmVhY2gocmVxdWVzdHMsIGZ1bmN0aW9uIChyZXEpIHtcclxuICAgICAgICBpZiAocmVxICYmIHJlcS5hYm9ydClcclxuICAgICAgICAgICAgcmVxLmFib3J0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBhY3Rpb24sXHJcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgY29udGV4dDogY3R4LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyLFxyXG4gICAgICAgIGVycm9yOiBhamF4RXJyb3JQb3B1cEhhbmRsZXIsXHJcbiAgICAgICAgY29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVnaXN0ZXIgcmVxdWVzdFxyXG4gICAgcmVxdWVzdHMucHVzaChyZXF1ZXN0KTtcclxuICAgIC8vIFNldCBhdXRvLWRlc3JlZ2lzdHJhdGlvblxyXG4gICAgdmFyIHJlcUluZGV4ID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcclxuICAgIHJlcXVlc3QuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBEZWxldGUsIG5vdCBzcGxpY2UsIHNpbmNlIHdlIG5lZWQgdG8gcHJlc2VydmUgdGhlIG9yZGVyXHJcbiAgICAgICAgZGVsZXRlIHJlcXVlc3RzW3JlcUluZGV4XTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvIHBvc3QgdmFsaWRhdGlvbjpcclxuICAgIGlmIChwb3N0VmFsaWRhdGlvbiAmJiBwb3N0VmFsaWRhdGlvbiAhPT0gJ25ldmVyJykge1xyXG4gICAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRlRm9ybShjdHgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0b3Agbm9ybWFsIFBPU1Q6XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgSXQgcGVyZm9ybXMgYSBwb3N0IHN1Ym1pdCBvbiB0aGUgZ2l2ZW4gZm9ybSBvbiBiYWNrZ3JvdW5kLFxyXG4gICAgd2l0aG91dCBub3RpZmljYXRpb25zIG9mIGFueSBraW5kLCBqdXN0IGZvciB0aGUgaW5zdGFudCBzYXZpbmcgZmVhdHVyZS5cclxuKiovXHJcbmZ1bmN0aW9uIGRvSW5zdGFudFNhdmluZyhmb3JtLCBjaGFuZ2VkRWxlbWVudHMpIHtcclxuICAgIGZvcm0gPSAkKGZvcm0pO1xyXG4gICAgdmFyIGFjdGlvbiA9IGZvcm0uYXR0cignYWN0aW9uJykgfHwgZm9ybS5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpIHx8ICcnO1xyXG4gICAgdmFyIGN0eCA9IHsgZm9ybTogZm9ybSwgYm94OiBmb3JtIH07XHJcblxyXG4gICAgLy8gTm90aWZpY2F0aW9uIGV2ZW50IHRvIGFsbG93IHNjcmlwdHMgdG8gaG9vayBhZGRpdGlvbmFsIHRhc2tzIGJlZm9yZSBzZW5kIGRhdGFcclxuICAgIGZvcm0udHJpZ2dlcigncHJlc3VibWl0JywgW2N0eF0pO1xyXG5cclxuICAgIHZhciBkYXRhID0gY3R4LmZvcm0uZmluZCgnOmlucHV0Jykuc2VyaWFsaXplKCk7XHJcblxyXG4gICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogYWN0aW9uLFxyXG4gICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFRyYWNrZWQgY2hhbmdlZCBlbGVtZW50cyBhcmUgc2F2ZWRcclxuICAgICAgICAgICAgaWYgKGNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uY2xvc2VzdCgnZm9ybScpLmdldCgwKSwgY2hhbmdlZEVsZW1lbnRzKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmVxdWVzdHMgPSBmb3JtLmRhdGEoJ3hoci1yZXF1ZXN0cycpIHx8IFtdO1xyXG4gICAgZm9ybS5kYXRhKCd4aHItcmVxdWVzdHMnLCByZXF1ZXN0cyk7XHJcblxyXG4gICAgLy8gUmVnaXN0ZXIgcmVxdWVzdFxyXG4gICAgcmVxdWVzdHMucHVzaChyZXF1ZXN0KTtcclxuICAgIC8vIFNldCBhdXRvLWRlc3JlZ2lzdHJhdGlvblxyXG4gICAgdmFyIHJlcUluZGV4ID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcclxuICAgIHJlcXVlc3QuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBEZWxldGUsIG5vdCBzcGxpY2UsIHNpbmNlIHdlIG5lZWQgdG8gcHJlc2VydmUgdGhlIG9yZGVyXHJcbiAgICAgICAgZGVsZXRlIHJlcXVlc3RzW3JlcUluZGV4XTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByZXF1ZXN0O1xyXG59XHJcblxyXG4vLyBQdWJsaWMgaW5pdGlhbGl6YXRpb25cclxuZnVuY3Rpb24gaW5pdEFqYXhGb3JtcyhvcHRpb25zKSB7XHJcbiAgICAkLmV4dGVuZCh0cnVlLCBzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgdG8gbWFuYWdlIGFqYXggZm9ybXMgKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ3N1Ym1pdCcsICdmb3JtLmFqYXgnLCBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKTtcclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIGZvciBhIHNwZWNpYWwgYWpheCBmb3JtIGNhc2U6IHN1YmZvcm1zLCB1c2luZyBmaWVsZHNldHMuICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdjbGljaycsICdmaWVsZHNldC5hamF4IC5hamF4LWZpZWxkc2V0LXN1Ym1pdCcsXHJcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG5cclxuICAgICAgICAgIGV2ZW50LmRhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm06IGZvcm0sXHJcbiAgICAgICAgICAgIGJveDogZm9ybS5jbG9zZXN0KCcuYWpheC1ib3gnKSxcclxuICAgICAgICAgICAgYWN0aW9uOiBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGNoYW5nZWRFbGVtZW50czogY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCksIGZvcm0uZmluZCgnOmlucHV0W25hbWVdJykpXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuLyogVU5VU0VEP1xyXG5mdW5jdGlvbiBhamF4Rm9ybU1lc3NhZ2VPbkh0bWxSZXR1cm5lZFdpdGhvdXRWYWxpZGF0aW9uRXJyb3JzKGZvcm0sIG1lc3NhZ2UpIHtcclxuICAgIHZhciAkdCA9ICQoZm9ybSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb3JtIGVycm9ycywgc2hvdyBhIHN1Y2Nlc3NmdWwgbWVzc2FnZVxyXG4gICAgaWYgKCR0LmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAkdC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgICAgICBjc3M6IHBvcHVwU3R5bGUocG9wdXBTaXplKCdzbWFsbCcpKVxyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkgeyAkdC51bmJsb2NrKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbiAgICB9XHJcbn1cclxuKi9cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBpbml0QWpheEZvcm1zLFxyXG4gICAgICAgIG9uU3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgb25FcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlcixcclxuICAgICAgICBkb0luc3RhbnRTYXZpbmc6IGRvSW5zdGFudFNhdmluZ1xyXG4gICAgfTtcclxuIiwiLyogQXV0byBjYWxjdWxhdGUgc3VtbWFyeSBvbiBET00gdGFnZ2luZyB3aXRoIGNsYXNzZXMgdGhlIGVsZW1lbnRzIGludm9sdmVkLlxyXG4gKi9cclxudmFyIG51ID0gcmVxdWlyZSgnLi9udW1iZXJVdGlscycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzKCkge1xyXG4gICAgJCgndGFibGUuY2FsY3VsYXRlLWl0ZW1zLXRvdGFscycpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmRhdGEoJ2NhbGN1bGF0ZS1pdGVtcy10b3RhbHMtaW5pdGlhbGl6YXRlZCcpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgZnVuY3Rpb24gY2FsY3VsYXRlUm93KCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgdHIgPSAkdC5jbG9zZXN0KCd0cicpO1xyXG4gICAgICAgICAgICB2YXIgaXAgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcHJpY2UnKTtcclxuICAgICAgICAgICAgdmFyIGlxID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXF1YW50aXR5Jyk7XHJcbiAgICAgICAgICAgIHZhciBpdCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbCcpO1xyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihudS5nZXRNb25leU51bWJlcihpcCkgKiBudS5nZXRNb25leU51bWJlcihpcSwgMSksIGl0KTtcclxuICAgICAgICAgICAgdHIudHJpZ2dlcignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkKHRoaXMpLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZSwgLmNhbGN1bGF0ZS1pdGVtLXF1YW50aXR5Jykub24oJ2NoYW5nZScsIGNhbGN1bGF0ZVJvdyk7XHJcbiAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmRhdGEoJ2NhbGN1bGF0ZS1pdGVtcy10b3RhbHMtaW5pdGlhbGl6YXRlZCcsIHRydWUpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldHVwQ2FsY3VsYXRlU3VtbWFyeShmb3JjZSkge1xyXG4gICAgJCgnLmNhbGN1bGF0ZS1zdW1tYXJ5JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGMgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICghZm9yY2UgJiYgYy5kYXRhKCdjYWxjdWxhdGUtc3VtbWFyeS1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB2YXIgcyA9IGMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnknKTtcclxuICAgICAgICB2YXIgZCA9IGMuZmluZCgndGFibGUuY2FsY3VsYXRlLXN1bW1hcnktZ3JvdXAnKTtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjKCkge1xyXG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwLCBmZWUgPSAwLCBkdXJhdGlvbiA9IDA7XHJcbiAgICAgICAgICAgIHZhciBncm91cHMgPSB7fTtcclxuICAgICAgICAgICAgZC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBncm91cFRvdGFsID0gMDtcclxuICAgICAgICAgICAgICAgIHZhciBhbGxDaGVja2VkID0gJCh0aGlzKS5pcygnLmNhbGN1bGF0ZS1hbGwtaXRlbXMnKTtcclxuICAgICAgICAgICAgICAgICQodGhpcykuZmluZCgndHInKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbSA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFsbENoZWNrZWQgfHwgaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tY2hlY2tlZCcpLmlzKCc6Y2hlY2tlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwVG90YWwgKz0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tdG90YWw6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxID0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHk6ZXEoMCknKSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZlZSArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1mZWU6ZXEoMCknKSkgKiBxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1kdXJhdGlvbjplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0b3RhbCArPSBncm91cFRvdGFsO1xyXG4gICAgICAgICAgICAgICAgZ3JvdXBzWyQodGhpcykuZGF0YSgnY2FsY3VsYXRpb24tc3VtbWFyeS1ncm91cCcpXSA9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cFRvdGFsLCAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0JykuZmluZCgnLmdyb3VwLXRvdGFsLXByaWNlJykpO1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZHVyYXRpb24sICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtZHVyYXRpb24nKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gU2V0IHN1bW1hcnkgdG90YWwgdmFsdWVcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIodG90YWwsIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktdG90YWwnKSk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGZlZSwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS1mZWUnKSk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBldmVyeSBncm91cCB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBmb3IgKHZhciBnIGluIGdyb3Vwcykge1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZ3JvdXBzW2ddLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwLScgKyBnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZC5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tY2hlY2tlZCcpLmNoYW5nZShjYWxjKTtcclxuICAgICAgICBkLm9uKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCBjYWxjKTtcclxuICAgICAgICBjYWxjKCk7XHJcbiAgICAgICAgYy5kYXRhKCdjYWxjdWxhdGUtc3VtbWFyeS1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIFVwZGF0ZSB0aGUgZGV0YWlsIG9mIGEgcHJpY2luZyBzdW1tYXJ5LCBvbmUgZGV0YWlsIGxpbmUgcGVyIHNlbGVjdGVkIGl0ZW1cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkoKSB7XHJcbiAgICAkKCcucHJpY2luZy1zdW1tYXJ5LmRldGFpbGVkJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgJGQgPSAkcy5maW5kKCd0Ym9keS5kZXRhaWwnKSxcclxuICAgICAgICAgICAgJHQgPSAkcy5maW5kKCd0Ym9keS5kZXRhaWwtdHBsJykuY2hpbGRyZW4oJ3RyOmVxKDApJyksXHJcbiAgICAgICAgICAgICRjID0gJHMuY2xvc2VzdCgnZm9ybScpLFxyXG4gICAgICAgICAgICAkaXRlbXMgPSAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0nKTtcclxuXHJcbiAgICAgICAgLy8gRG8gaXQhXHJcbiAgICAgICAgLy8gUmVtb3ZlIG9sZCBsaW5lc1xyXG4gICAgICAgICRkLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gQ3JlYXRlIG5ldyBvbmVzXHJcbiAgICAgICAgJGl0ZW1zLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBHZXQgdmFsdWVzXHJcbiAgICAgICAgICAgIHZhciAkaSA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBjaGVja2VkID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNoZWNrZWQnKS5wcm9wKCdjaGVja2VkJyk7XHJcbiAgICAgICAgICAgIGlmIChjaGVja2VkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29uY2VwdCA9ICRpLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1jb25jZXB0JykudGV4dCgpLFxyXG4gICAgICAgICAgICAgICAgICAgIHByaWNlID0gbnUuZ2V0TW9uZXlOdW1iZXIoJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLXByaWNlOmVxKDApJykpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHJvdyBhbmQgc2V0IHZhbHVlc1xyXG4gICAgICAgICAgICAgICAgdmFyICRyb3cgPSAkdC5jbG9uZSgpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2RldGFpbC10cGwnKVxyXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdkZXRhaWwnKTtcclxuICAgICAgICAgICAgICAgICRyb3cuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KGNvbmNlcHQpO1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIocHJpY2UsICRyb3cuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLXByaWNlJykpO1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRvIHRoZSB0YWJsZVxyXG4gICAgICAgICAgICAgICAgJGQuYXBwZW5kKCRyb3cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBzZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkoKSB7XHJcbiAgICB2YXIgJGMgPSAkKCcucHJpY2luZy1zdW1tYXJ5LmRldGFpbGVkJykuY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgLy8gSW5pdGlhbCBjYWxjdWxhdGlvblxyXG4gICAgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpO1xyXG4gICAgLy8gQ2FsY3VsYXRlIG9uIHJlbGV2YW50IGZvcm0gY2hhbmdlc1xyXG4gICAgJGMuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNoZWNrZWQnKS5jaGFuZ2UodXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbiAgICAvLyBTdXBwb3J0IGZvciBsY1NldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyBldmVudFxyXG4gICAgJGMub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkpO1xyXG59XHJcblxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb25UYWJsZUl0ZW1zOiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMsXHJcbiAgICAgICAgb25TdW1tYXJ5OiBzZXR1cENhbGN1bGF0ZVN1bW1hcnksXHJcbiAgICAgICAgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSxcclxuICAgICAgICBvbkRldGFpbGVkUHJpY2luZ1N1bW1hcnk6IHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeVxyXG4gICAgfTsiLCIvKiBGb2N1cyB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgZG9jdW1lbnQgKG9yIGluIEBjb250YWluZXIpXHJcbndpdGggdGhlIGh0bWw1IGF0dHJpYnV0ZSAnYXV0b2ZvY3VzJyAob3IgYWx0ZXJuYXRpdmUgQGNzc1NlbGVjdG9yKS5cclxuSXQncyBmaW5lIGFzIGEgcG9seWZpbGwgYW5kIGZvciBhamF4IGxvYWRlZCBjb250ZW50IHRoYXQgd2lsbCBub3RcclxuZ2V0IHRoZSBicm93c2VyIHN1cHBvcnQgb2YgdGhlIGF0dHJpYnV0ZS5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGF1dG9Gb2N1cyhjb250YWluZXIsIGNzc1NlbGVjdG9yKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCk7XHJcbiAgICBjb250YWluZXIuZmluZChjc3NTZWxlY3RvciB8fCAnW2F1dG9mb2N1c10nKS5mb2N1cygpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGF1dG9Gb2N1czsiLCIvKiogQXV0by1maWxsIG1lbnUgc3ViLWl0ZW1zIHVzaW5nIHRhYmJlZCBwYWdlcyAtb25seSB3b3JrcyBmb3IgY3VycmVudCBwYWdlIGl0ZW1zLSAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYXV0b2ZpbGxTdWJtZW51KCkge1xyXG4gICAgJCgnLmF1dG9maWxsLXN1Ym1lbnUgLmN1cnJlbnQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcGFyZW50bWVudSA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgc3VibWVudSBlbGVtZW50cyBmcm9tIHRhYnMgbWFya2VkIHdpdGggY2xhc3MgJ2F1dG9maWxsLXN1Ym1lbnUtaXRlbXMnXHJcbiAgICAgICAgdmFyIGl0ZW1zID0gJCgnLmF1dG9maWxsLXN1Ym1lbnUtaXRlbXMgbGk6bm90KC5yZW1vdmFibGUpJyk7XHJcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgaXRlbXMsIGNyZWF0ZSB0aGUgc3VibWVudSBjbG9uaW5nIGl0IVxyXG4gICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciBzdWJtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xyXG4gICAgICAgICAgICBwYXJlbnRtZW51LmFwcGVuZChzdWJtZW51KTtcclxuICAgICAgICAgICAgLy8gQ2xvbmluZyB3aXRob3V0IGV2ZW50czpcclxuICAgICAgICAgICAgdmFyIG5ld2l0ZW1zID0gaXRlbXMuY2xvbmUoZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgJChzdWJtZW51KS5hcHBlbmQobmV3aXRlbXMpO1xyXG5cclxuICAgICAgICAgICAgLy8gV2UgbmVlZCBhdHRhY2ggZXZlbnRzIHRvIG1haW50YWluIHRoZSB0YWJiZWQgaW50ZXJmYWNlIHdvcmtpbmdcclxuICAgICAgICAgICAgLy8gTmV3IEl0ZW1zIChjbG9uZWQpIG11c3QgY2hhbmdlIHRhYnM6XHJcbiAgICAgICAgICAgIG5ld2l0ZW1zLmZpbmQoXCJhXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgaW4gdGhlIG9yaWdpbmFsIGl0ZW1cclxuICAgICAgICAgICAgICAgICQoXCJhW2hyZWY9J1wiICsgdGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpICsgXCInXVwiLCBpdGVtcykuY2xpY2soKTtcclxuICAgICAgICAgICAgICAgIC8vIENoYW5nZSBtZW51OlxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKFwiYVwiKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICAgICAgLy8gU3RvcCBldmVudDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIE9yaWdpbmFsIGl0ZW1zIG11c3QgY2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgIGl0ZW1zLmZpbmQoXCJhXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG5ld2l0ZW1zLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50JykuXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIoXCIqW2hyZWY9J1wiICsgdGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpICsgXCInXVwiKS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuTWFuYWdlIGFsbCB0aGF0IGV2ZW50cyBhdHRhY2hlZCB0byBkYXRlcyBtYWRlIHVuYXZhaWxhYmxlIGJ5IHRoZSB1c2VyXHJcbnRvIG5vdGlmeSBhYm91dCB3aGF0IHRoYXQgbWVhbnMuXHJcblxyXG5NYWRlIGZvciB1c2UgaW4gdGhlIE1vbnRobHkgY2FsZW5kYXIsIG1heWJlIHJldXNhYmxlLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBvYmplY3RVdGlscyA9IHJlcXVpcmUoJy4vb2JqZWN0VXRpbHMnKTtcclxucmVxdWlyZShcImRhdGUtZm9ybWF0LWxpdGVcIik7XHJcblxyXG4vKipcclxuVGhlIEBlbGVtZW50IG11c3QgYmUgYSBkb20gZWxlbWVudCBjb250YWluaW5nIHRoYXQgd2lsbCBjb250YWluIHRoZSBpbmZvcm1hdGlvblxyXG5hbmQgd2lsbCB1c2UgYW4gdWwgZWxlbWVudCB0byBsaXN0IG5vdGlmaWNhdGlvbnMuIFRoZSBlbGVtZW50IHdpbGwgYmUgaGlkZGVuXHJcbmluaXRpYWxseSBhbmQgYW55IHRpbWUgdGhhdCwgb24gcmVuZGVyaW5nLCB0aGVyZSBhcmUgbm90IG5vdGlmaWNhdGlvbnMuXHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEJvb2tpbmdzTm90aWZpY2F0aW9uKGVsZW1lbnQpIHtcclxuXHJcbiAgdGhpcy4kZWwgPSAkKGVsZW1lbnQpO1xyXG4gIHRoaXMuJGxpc3QgPSB0aGlzLiRlbC5maW5kKCd1bCcpO1xyXG4gIGlmICghdGhpcy4kbGlzdC5sZW5ndGgpXHJcbiAgICB0aGlzLiRsaXN0ID0gJCgnPHVsLz4nKS5hcHBlbmRUbyh0aGlzLiRlbCk7XHJcblxyXG4gIHRoaXMucmVnaXN0ZXJlZCA9IHt9O1xyXG5cclxuICB0aGlzLnJlZ2lzdGVyID0gZnVuY3Rpb24gcmVnaXN0ZXIodG9nZ2xlLCBkYXRhLCBzdHJEYXRlKSB7XHJcbiAgICB2YXIgbCA9IHRoaXMucmVnaXN0ZXJlZDtcclxuICAgIGlmICh0b2dnbGUpIHtcclxuICAgICAgLy8gcmVnaXN0ZXIgKGlmIHNvbWV0aGluZylcclxuICAgICAgdmFyIGV2cyA9IGRhdGEuc2xvdHNbc3RyRGF0ZV0uZXZlbnRzSWRzO1xyXG4gICAgICBpZiAoZXZzKSB7XHJcbiAgICAgICAgbFtzdHJEYXRlXSA9IG9iamVjdFV0aWxzLmZpbHRlclByb3BlcnRpZXMoZGF0YS5ldmVudHMsIGZ1bmN0aW9uIChrKSB7IHJldHVybiBldnMuaW5kZXhPZihrKSAhPSAtMTsgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHVucmVnaXN0ZXJcclxuICAgICAgZGVsZXRlIGxbc3RyRGF0ZV07XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XHJcbiAgICAvLyBSZW5ldyB0aGUgbGlzdFxyXG4gICAgdGhpcy4kbGlzdC5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG5cclxuICAgIHZhciBoYXNOb3RpZmljYXRpb25zID0gZmFsc2U7XHJcblxyXG4gICAgZm9yICh2YXIgc3RyRGF0ZSBpbiB0aGlzLnJlZ2lzdGVyZWQpIHtcclxuICAgICAgaWYgKCF0aGlzLnJlZ2lzdGVyZWQuaGFzT3duUHJvcGVydHkoc3RyRGF0ZSkpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMucmVnaXN0ZXJlZFtzdHJEYXRlXTtcclxuICAgICAgdmFyIGRhdGUgPSBkYXRlSVNPLnBhcnNlKHN0ckRhdGUpLmZvcm1hdCgnRERERCwgTU1NIEQnKTtcclxuICAgICAgdmFyIG1zZyA9ICQoJzxzcGFuLz4nKS50ZXh0KGRhdGUgKyBcIjogXCIpLm91dGVySHRtbCgpO1xyXG5cclxuICAgICAgdmFyIGV2ZW50c0h0bWwgPSBbXTtcclxuICAgICAgZm9yICh2YXIgcCBpbiBldmVudHMpIHtcclxuICAgICAgICBpZiAoIWV2ZW50cy5oYXNPd25Qcm9wZXJ0eShwKSkgY29udGludWU7XHJcbiAgICAgICAgdmFyIGV2ID0gZXZlbnRzW3BdO1xyXG4gICAgICAgIHZhciBpdGVtID0gJCgnPGEgdGFyZ2V0PVwiX2JsYW5rXCIgLz4nKS5hdHRyKCdocmVmJywgZXYudXJsKS50ZXh0KGV2LnN1bW1hcnkgfHwgJ2Jvb2tpbmcnKTtcclxuICAgICAgICBldmVudHNIdG1sLnB1c2goaXRlbS5vdXRlckh0bWwoKSk7XHJcblxyXG4gICAgICAgIGhhc05vdGlmaWNhdGlvbnMgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIG1zZyArPSBldmVudHNIdG1sLmpvaW4oJywgJyk7XHJcblxyXG4gICAgICAkKCc8bGkvPicpXHJcbiAgICAgIC5odG1sKG1zZylcclxuICAgICAgLmFwcGVuZFRvKHRoaXMuJGxpc3QpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChoYXNOb3RpZmljYXRpb25zKVxyXG4gICAgICB0aGlzLiRlbC5zaG93KCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMuJGVsLmhpZGUoKTtcclxuXHJcbiAgfTtcclxufTsiLCIvKipcclxuICBNb250aGx5IGNhbGVuZGFyIGNsYXNzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIExjV2lkZ2V0ID0gcmVxdWlyZSgnLi4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuLi9DWC9leHRlbmQnKSxcclxuICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuICBvYmplY3RVdGlscyA9IHJlcXVpcmUoJy4vb2JqZWN0VXRpbHMnKSxcclxuICBCb29raW5nc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vQm9va2luZ3NOb3RpZmljYXRpb24nKTtcclxuXHJcbnZhciBldmVudHMgPSB7XHJcbiAgICBkYXRhQ2hhbmdlZDogJ2RhdGFDaGFuZ2VkJ1xyXG59O1xyXG5cclxuLyoqXHJcbiAgUHJpdmF0ZSB1dGlsc1xyXG4qKi9cclxuXHJcbi8qKlxyXG4gIFByZWZldGNoIG5leHQgbW9udGggKGJhc2VkIG9uIHRoZSBnaXZlbiBkYXRlcylcclxuICBOb3RlOiB0aGlzIGNvZGUgaXMgdmVyeSBzaW1pbGFyIHRvIHV0aWxzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2hcclxuKiovXHJcbmZ1bmN0aW9uIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGN1cnJlbnREYXRlc1JhbmdlKSB7XHJcbiAgLy8gV2UgZ2V0IHRoZSBuZXh0IG1vbnRoIGRhdGVzLXJhbmdlLCBidXRcclxuICAvLyB1c2luZyBhcyBiYXNlLWRhdGUgYSBkYXRlIGluc2lkZSBjdXJyZW50IGRpc3BsYXllZCBtb250aCwgdGhhdCBtb3N0IHRpbWVzIGlzXHJcbiAgLy8gbm90IHRoZSBtb250aCBvZiB0aGUgc3RhcnQgZGF0ZSBpbiBjdXJyZW50IGRhdGUsIHRoZW4ganVzdCBmb3J3YXJkIDcgZGF5cyB0aGF0XHJcbiAgLy8gdG8gZW5zdXJlIHdlIHBpY2sgdGhlIGNvcnJlY3QgbW9udGg6XHJcbiAgdmFyIG5leHREYXRlc1JhbmdlID0gdXRpbHMuZGF0ZS5uZXh0TW9udGhXZWVrcyh1dGlscy5kYXRlLmFkZERheXMoY3VycmVudERhdGVzUmFuZ2Uuc3RhcnQsIDcpLCAxLCBtb250aGx5LnNob3dTaXhXZWVrcyk7XHJcbiAgLy8gQXMgd2UgbG9hZCBmdWxsIHdlZWtzLCBtb3N0IHRpbWVzIHRoZSBmaXJzdCB3ZWVrIG9mIGEgbW9udGggaXMgYWxyZWFkeSBsb2FkZWQgYmVjYXVzZSBcclxuICAvLyB0aGUgd2VlayBpcyBzaGFyZWQgd2l0aCB0aGUgcHJldmlvdXMgbW9udGgsIHRoZW4ganVzdCBjaGVjayBpZiB0aGUgc3RhcnQgb2YgdGhlIG5ld1xyXG4gIC8vIHJhbmdlIGlzIGFscmVhZHkgaW4gY2FjaGUgYW5kIHNocmluayB0aGUgcmFuZ2UgdG8gYmUgcmVxdWVzdGVkLCBhdm9pZGluZyBjb25mbGljdCBvblxyXG4gIC8vIGxvYWRpbmcgdGhlIHVkcGF0ZWQgZGF0YSAoaWYgdGhhdCB3ZWVrIHdhcyBiZWluZyBlZGl0ZWQpIGFuZCBmYXN0ZXIgcmVxdWVzdCBsb2FkIHNpbmNlXHJcbiAgLy8gdGhlIHNlcnZlciBuZWVkcyB0byBkbyBsZXNzIGNvbXB1dGF0aW9uOlxyXG4gIHZhciBkID0gbmV4dERhdGVzUmFuZ2Uuc3RhcnQsXHJcbiAgICBzdHJlbmQgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXh0RGF0ZXNSYW5nZS5lbmQpLFxyXG4gICAgc3RyZCA9IGRhdGVJU08uZGF0ZUxvY2FsKGQsIHRydWUpO1xyXG4gIGlmIChtb250aGx5LmRhdGEgJiYgbW9udGhseS5kYXRhLnNsb3RzKVxyXG4gIHdoaWxlIChtb250aGx5LmRhdGEuc2xvdHNbc3RyZF0gJiZcclxuICAgIHN0cmQgPD0gc3RyZW5kKSB7XHJcbiAgICBuZXh0RGF0ZXNSYW5nZS5zdGFydCA9IGQgPSB1dGlscy5kYXRlLmFkZERheXMoZCwgMSk7XHJcbiAgICBzdHJkID0gZGF0ZUlTTy5kYXRlTG9jYWwoZCwgdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXV0aWxzLm1vbnRobHlJc0RhdGFJbkNhY2hlKG1vbnRobHksIG5leHREYXRlc1JhbmdlKSkge1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHZhciBwcmVmZXRjaFF1ZXJ5ID0gdXRpbHMuZGF0ZXNUb1F1ZXJ5KG5leHREYXRlc1JhbmdlKTtcclxuICAgIG1vbnRobHkuZmV0Y2hEYXRhKHByZWZldGNoUXVlcnksIG51bGwsIHRydWUpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbk1vdmUgdGhlIGJpbmRlZCBkYXRlcyB0aGUgYW1vdW50IG9mIEBtb250aHMgc3BlY2lmaWVkLlxyXG5Ob3RlOiBtb3N0IG9mIHRoaXMgY29kZSBpcyBhZGFwdGVkIGZyb20gdXRpbHMubW92ZUJpbmRSYW5nZUluRGF5cyxcclxudGhlIGNvbXBsZXhpdHkgY29tZXMgZnJvbSB0aGUgcHJlZmV0Y2ggZmVhdHVyZSwgbWF5YmUgY2FuIGJlIHRoYXQgbG9naWNcclxuaXNvbGF0ZWQgYW5kIHNoYXJlZD9cclxuKiovXHJcbmZ1bmN0aW9uIG1vdmVCaW5kTW9udGgobW9udGhseSwgbW9udGhzKSB7XHJcbiAgLy8gV2UgZ2V0IHRoZSBuZXh0ICdtb250aHMnIChuZWdhdGl2ZSBmb3IgcHJldmlvdXMpIGRhdGVzLXJhbmdlLCBidXRcclxuICAvLyB1c2luZyBhcyBiYXNlLWRhdGUgYSBkYXRlIGluc2lkZSBjdXJyZW50IGRpc3BsYXllZCBtb250aCwgdGhhdCBtb3N0IHRpbWVzIGlzXHJcbiAgLy8gbm90IHRoZSBtb250aCBvZiB0aGUgc3RhcnQgZGF0ZSBpbiBjdXJyZW50IGRhdGUsIHRoZW4ganVzdCBmb3J3YXJkIDcgZGF5cyB0aGF0XHJcbiAgLy8gdG8gZW5zdXJlIHdlIHBpY2sgdGhlIGNvcnJlY3QgbW9udGg6XHJcbiAgdmFyIGRhdGVzUmFuZ2UgPSB1dGlscy5kYXRlLm5leHRNb250aFdlZWtzKHV0aWxzLmRhdGUuYWRkRGF5cyhtb250aGx5LmRhdGVzUmFuZ2Uuc3RhcnQsIDcpLCBtb250aHMsIG1vbnRobHkuc2hvd1NpeFdlZWtzKTtcclxuXHJcbiAgLy8gQ2hlY2sgY2FjaGUgYmVmb3JlIHRyeSB0byBmZXRjaFxyXG4gIHZhciBpbkNhY2hlID0gdXRpbHMubW9udGhseUlzRGF0YUluQ2FjaGUobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcblxyXG4gIGlmIChpbkNhY2hlKSB7XHJcbiAgICAvLyBKdXN0IHNob3cgdGhlIGRhdGFcclxuICAgIG1vbnRobHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAvLyBQcmVmZXRjaCBleGNlcHQgaWYgdGhlcmUgaXMgb3RoZXIgcmVxdWVzdCBpbiBjb3Vyc2UgKGNhbiBiZSB0aGUgc2FtZSBwcmVmZXRjaCxcclxuICAgIC8vIGJ1dCBzdGlsbCBkb24ndCBvdmVybG9hZCB0aGUgc2VydmVyKVxyXG4gICAgaWYgKG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgbW9udGhseUNoZWNrQW5kUHJlZmV0Y2gobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcbiAgfSBlbHNlIHtcclxuXHJcbiAgICAvLyBTdXBwb3J0IGZvciBwcmVmZXRjaGluZzpcclxuICAgIC8vIEl0cyBhdm9pZGVkIGlmIHRoZXJlIGFyZSByZXF1ZXN0cyBpbiBjb3Vyc2UsIHNpbmNlXHJcbiAgICAvLyB0aGF0IHdpbGwgYmUgYSBwcmVmZXRjaCBmb3IgdGhlIHNhbWUgZGF0YS5cclxuICAgIGlmIChtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHtcclxuICAgICAgLy8gVGhlIGxhc3QgcmVxdWVzdCBpbiB0aGUgcG9vbCAqbXVzdCogYmUgdGhlIGxhc3QgaW4gZmluaXNoXHJcbiAgICAgIC8vIChtdXN0IGJlIG9ubHkgb25lIGlmIGFsbCBnb2VzIGZpbmUpOlxyXG4gICAgICB2YXIgcmVxdWVzdCA9IG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzW21vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgLy8gV2FpdCBmb3IgdGhlIGZldGNoIHRvIHBlcmZvcm0gYW5kIHNldHMgbG9hZGluZyB0byBub3RpZnkgdXNlclxyXG4gICAgICBtb250aGx5LiRlbC5hZGRDbGFzcyhtb250aGx5LmNsYXNzZXMuZmV0Y2hpbmcpO1xyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIG1vdmVCaW5kTW9udGgobW9udGhseSwgbW9udGhzKTtcclxuICAgICAgICBtb250aGx5LiRlbC5yZW1vdmVDbGFzcyhtb250aGx5LmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgbW9udGhseVxyXG4gICAgLmZldGNoRGF0YSh1dGlscy5kYXRlc1RvUXVlcnkoZGF0ZXNSYW5nZSkpXHJcbiAgICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIG1vbnRobHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAgIC8vIFByZWZldGNoXHJcbiAgICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LW1vbnRoIGFuZCBkaXNhYmxlIHByZXYgYnV0dG9uLFxyXG5vciByZW1vdmUgdGhlIG1hcmsgYW5kIGVuYWJsZSBpdCBpZiBpcyBub3QuXHJcblxyXG5VcGRhdGVzIHRoZSBtb250aCBsYWJlbCB0b28gYW5kIHRvZGF5IGJ1dHRvblxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50TW9udGgoJGVsLCBzdGFydERhdGUsIG1vbnRobHkpIHtcclxuICAvLyBFbnN1cmUgdGhlIGRhdGUgdG8gYmUgZnJvbSBjdXJyZW50IG1vbnRoIGFuZCBub3Qgb25lIG9mIHRoZSBsYXRlc3QgZGF0ZXNcclxuICAvLyBvZiB0aGUgcHJldmlvdXMgb25lICh3aGVyZSB0aGUgcmFuZ2Ugc3RhcnQpIGFkZGluZyA3IGRheXMgZm9yIHRoZSBjaGVjazpcclxuICB2YXIgbW9udGhEYXRlID0gdXRpbHMuZGF0ZS5hZGREYXlzKHN0YXJ0RGF0ZSwgNyk7XHJcbiAgdmFyIHllcCA9IHV0aWxzLmRhdGUuaXNJbkN1cnJlbnRNb250aChtb250aERhdGUpO1xyXG4gICRlbC50b2dnbGVDbGFzcyhtb250aGx5LmNsYXNzZXMuY3VycmVudFdlZWssIHllcCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLnByZXZBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxuXHJcbiAgLy8gTW9udGggLSBZZWFyXHJcbiAgdmFyIG1sYmwgPSBtb250aGx5LnRleHRzLm1vbnRoc1ttb250aERhdGUuZ2V0TW9udGgoKV0gKyAnICcgKyBtb250aERhdGUuZ2V0RnVsbFllYXIoKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMubW9udGhMYWJlbCkudGV4dChtbGJsKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMudG9kYXlBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxufVxyXG5cclxuLyoqXHJcbiAgVXBkYXRlIHRoZSBjYWxlbmRhciBkYXRlcyBjZWxscyBmb3IgJ2RheSBvZiB0aGUgbW9udGgnIHZhbHVlc1xyXG4gIGFuZCBudW1iZXIgb2Ygd2Vla3Mvcm93cy5cclxuICBAZGF0ZXNSYW5nZSB7IHN0YXJ0LCBlbmQgfVxyXG4gIEBzbG90c0NvbnRhaW5lciBqUXVlcnktRE9NIGZvciBkYXRlcy1jZWxscyB0Ym9keVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgb2ZmTW9udGhEYXRlQ2xhc3MsIGN1cnJlbnREYXRlQ2xhc3MsIHNsb3REYXRlTGFiZWwsIHNob3dTaXhXZWVrcykge1xyXG4gIHZhciBsYXN0WSxcclxuICAgIGN1cnJlbnRNb250aCA9IHV0aWxzLmRhdGUuYWRkRGF5cyhkYXRlc1JhbmdlLnN0YXJ0LCA3KS5nZXRNb250aCgpLFxyXG4gICAgdG9kYXkgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXcgRGF0ZSgpKTtcclxuXHJcbiAgaXRlcmF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIGZ1bmN0aW9uIChkYXRlLCB4LCB5KSB7XHJcbiAgICBsYXN0WSA9IHk7XHJcbiAgICB0aGlzLmZpbmQoJy4nICsgc2xvdERhdGVMYWJlbCkudGV4dChkYXRlLmdldERhdGUoKSk7XHJcblxyXG4gICAgLy8gTWFyayBkYXlzIG5vdCBpbiB0aGlzIG1vbnRoXHJcbiAgICB0aGlzLnRvZ2dsZUNsYXNzKG9mZk1vbnRoRGF0ZUNsYXNzLCBkYXRlLmdldE1vbnRoKCkgIT0gY3VycmVudE1vbnRoKTtcclxuXHJcbiAgICAvLyBNYXJrIHRvZGF5XHJcbiAgICB0aGlzLnRvZ2dsZUNsYXNzKGN1cnJlbnREYXRlQ2xhc3MsIGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUpID09IHRvZGF5KTtcclxuICB9KTtcclxuXHJcbiAgaWYgKCFzaG93U2l4V2Vla3MpIHtcclxuICAgIC8vIFNvbWUgbW9udGhzIGFyZSA1IHdlZWtzIHdpZGUgYW5kIG90aGVycyA2OyBvdXIgbGF5b3V0IGhhcyBwZXJtYW5lbnQgNiByb3dzL3dlZWtzXHJcbiAgICAvLyBhbmQgd2UgZG9uJ3QgbG9vayB1cCB0aGUgNnRoIHdlZWsgaWYgaXMgbm90IHBhcnQgb2YgdGhlIG1vbnRoIHRoZW4gdGhhdCA2dGggcm93XHJcbiAgICAvLyBtdXN0IGJlIGhpZGRlbiBpZiB0aGVyZSBhcmUgb25seSA1LlxyXG4gICAgLy8gSWYgdGhlIGxhc3Qgcm93IHdhcyB0aGUgNSAoaW5kZXggNCwgemVyby1iYXNlZCksIHRoZSA2dGggaXMgaGlkZGVuOlxyXG4gICAgc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJ3RyOmVxKDUpJykueHRvZ2dsZShsYXN0WSAhPSA0LCB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAwIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAgSXQgZXhlY3V0ZXMgdGhlIGdpdmVuIGNhbGxiYWNrIChAZWFjaENlbGxDYWxsYmFjaykgZm9yIFxyXG4gIGVhY2ggY2VsbCAodGhpcyBpbnNpZGUgdGhlIGNhbGxiYWNrKSBpdGVyYXRlZCBiZXR3ZWVuIHRoZSBAZGF0ZXNSYW5nZVxyXG4gIGluc2lkZSB0aGUgQHNsb3RzQ29udGFpbmVyIChhIHRib2R5IG9yIHRhYmxlIHdpdGggdHItdGQgZGF0ZSBjZWxscylcclxuKiovXHJcbmZ1bmN0aW9uIGl0ZXJhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBlYWNoQ2VsbENhbGxiYWNrKSB7XHJcbiAgdmFyIHgsIHksIGRhdGVDZWxsO1xyXG4gIC8vIEl0ZXJhdGUgZGF0ZXNcclxuICB1dGlscy5kYXRlLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIC8vIGRhdGVzIGFyZSBzb3J0ZWQgYXMgNyBwZXIgcm93IChlYWNoIHdlZWstZGF5KSxcclxuICAgIC8vIGJ1dCByZW1lbWJlciB0aGF0IGRheS1jZWxsIHBvc2l0aW9uIGlzIG9mZnNldCAxIGJlY2F1c2VcclxuICAgIC8vIGVhY2ggcm93IGlzIDggY2VsbHMgKGZpcnN0IGlzIGhlYWRlciBhbmQgcmVzdCA3IGFyZSB0aGUgZGF0YS1jZWxscyBmb3IgZGF0ZXMpXHJcbiAgICAvLyBqdXN0IGxvb2tpbmcgb25seSAndGQncyB3ZSBjYW4gdXNlIHRoZSBwb3NpdGlvbiB3aXRob3V0IG9mZnNldFxyXG4gICAgeCA9IChpICUgNyk7XHJcbiAgICB5ID0gTWF0aC5mbG9vcihpIC8gNyk7XHJcbiAgICBkYXRlQ2VsbCA9IHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCd0cjplcSgnICsgeSArICcpJykuY2hpbGRyZW4oJ3RkOmVxKCcgKyB4ICsgJyknKTtcclxuXHJcbiAgICBlYWNoQ2VsbENhbGxiYWNrLmFwcGx5KGRhdGVDZWxsLCBbZGF0ZSwgeCwgeSwgaV0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICBUb2dnbGUgYSBzZWxlY3RlZCBkYXRlLWNlbGwgYXZhaWxhYmlsaXR5LFxyXG4gIGZvciB0aGUgJ2VkaXRhYmxlJyBtb2RlXHJcbioqL1xyXG5mdW5jdGlvbiB0b2dnbGVEYXRlQXZhaWxhYmlsaXR5KG1vbnRobHksIGNlbGwpIHtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBkYXRhLCBqdXN0IHJldHVybiAoZGF0YSBub3QgbG9hZGVkKVxyXG4gIGlmICghbW9udGhseS5kYXRhIHx8ICFtb250aGx5LmRhdGEuc2xvdHMpIHJldHVybjtcclxuICBcclxuICAvLyBHZXR0aW5nIHRoZSBwb3NpdGlvbiBvZiB0aGUgY2VsbCBpbiB0aGUgbWF0cml4IGZvciBkYXRlLXNsb3RzOlxyXG4gIHZhciB0ciA9IGNlbGwuY2xvc2VzdCgndHInKSxcclxuICAgIHggPSB0ci5maW5kKCd0ZCcpLmluZGV4KGNlbGwpLFxyXG4gICAgeSA9IHRyLmNsb3Nlc3QoJ3Rib2R5JykuZmluZCgndHInKS5pbmRleCh0ciksXHJcbiAgICBkYXlzT2Zmc2V0ID0geSAqIDcgKyB4O1xyXG5cclxuICAvLyBHZXR0aW5nIHRoZSBkYXRlIGZvciB0aGUgY2VsbCBiYXNlZCBvbiB0aGUgc2hvd2VkIGZpcnN0IGRhdGVcclxuICB2YXIgZGF0ZSA9IG1vbnRobHkuZGF0ZXNSYW5nZS5zdGFydDtcclxuICBkYXRlID0gdXRpbHMuZGF0ZS5hZGREYXlzKGRhdGUsIGRheXNPZmZzZXQpO1xyXG4gIHZhciBzdHJEYXRlID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcblxyXG4gIC8vIEdldCBhbmQgdXBkYXRlIGZyb20gdGhlIHVuZGVybGF5aW5nIGRhdGEsIFxyXG4gIC8vIHRoZSBzdGF0dXMgZm9yIHRoZSBkYXRlLCB0b2dnbGluZyBpdDpcclxuICB2YXIgc2xvdCA9IG1vbnRobHkuZGF0YS5zbG90c1tzdHJEYXRlXTtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBzbG90LCBqdXN0IHJldHVybiAoZGF0YSBub3QgbG9hZGVkKVxyXG4gIGlmICghc2xvdCkgcmV0dXJuO1xyXG4gIHNsb3Quc3RhdHVzID0gc2xvdC5zdGF0dXMgPT0gJ3VuYXZhaWxhYmxlJyA/ICdhdmFpbGFibGUnIDogJ3VuYXZhaWxhYmxlJztcclxuICBzbG90LnNvdXJjZSA9ICd1c2VyJztcclxuICBtb250aGx5LmJvb2tpbmdzTm90aWZpY2F0aW9uLnJlZ2lzdGVyKHNsb3Quc3RhdHVzID09ICd1bmF2YWlsYWJsZScsIG1vbnRobHkuZGF0YSwgc3RyRGF0ZSk7XHJcbiAgbW9udGhseS5ldmVudHMuZW1pdChldmVudHMuZGF0YUNoYW5nZWQsIGNlbGwsIHNsb3QpO1xyXG5cclxuICAvLyBVcGRhdGUgdmlzdWFsaXphdGlvbjpcclxuICBtb250aGx5LmJpbmREYXRhKCk7XHJcbn1cclxuXHJcbi8qKlxyXG5Nb250bHkgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBNb250aGx5ID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseUNsYXNzZXMsIHtcclxuICB3ZWVrbHlDYWxlbmRhcjogdW5kZWZpbmVkLFxyXG4gIGN1cnJlbnRXZWVrOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudE1vbnRoOiAnaXMtY3VycmVudE1vbnRoJyxcclxuICBtb250aGx5Q2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci0tbW9udGhseScsXHJcbiAgdG9kYXlBY3Rpb246ICdBY3Rpb25zLXRvZGF5JyxcclxuICBtb250aExhYmVsOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbW9udGhMYWJlbCcsXHJcbiAgc2xvdERhdGVMYWJlbDogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXNsb3REYXRlTGFiZWwnLFxyXG4gIG9mZk1vbnRoRGF0ZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLW9mZk1vbnRoRGF0ZScsXHJcbiAgY3VycmVudERhdGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1jdXJyZW50RGF0ZScsXHJcbiAgZWRpdGFibGU6ICdpcy1lZGl0YWJsZScsXHJcbiAgYm9va2luZ3NOb3RpZmljYXRpb246ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1ib29raW5nc05vdGlmaWNhdGlvbidcclxufSksXHJcbnRleHRzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseVRleHRzLCB7XHJcbiAgbW9udGhzOiBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXVxyXG59KSxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuc2hvd1NpeFdlZWtzOiB0cnVlLFxyXG5lZGl0YWJsZTogZmFsc2UsXHJcblxyXG4vLyBPdXIgJ3ZpZXcnIHdpbGwgYmUgYSBzdWJzZXQgb2YgdGhlIGRhdGEsXHJcbi8vIGRlbGltaXRlZCBieSB0aGUgbmV4dCBwcm9wZXJ0eSwgYSBkYXRlcyByYW5nZTpcclxuZGF0ZXNSYW5nZTogeyBzdGFydDogbnVsbCwgZW5kOiBudWxsIH0sXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YU1vbnRobHkoZGF0ZXNSYW5nZSkge1xyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuc2xvdHMpIHJldHVybjtcclxuXHJcbiAgdGhpcy5kYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgfHwgdGhpcy5kYXRlc1JhbmdlO1xyXG4gIHZhciBcclxuICAgICAgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyksXHJcbiAgICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgY2hlY2tDdXJyZW50TW9udGgodGhpcy4kZWwsIGRhdGVzUmFuZ2Uuc3RhcnQsIHRoaXMpO1xyXG5cclxuICB1cGRhdGVEYXRlc0NlbGxzKHRoaXMuZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIHRoaXMuY2xhc3Nlcy5vZmZNb250aERhdGUsIHRoaXMuY2xhc3Nlcy5jdXJyZW50RGF0ZSwgdGhpcy5jbGFzc2VzLnNsb3REYXRlTGFiZWwsIHRoaXMuc2hvd1NpeFdlZWtzKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIC8vIFNldCBhdmFpbGFiaWxpdHkgb2YgZWFjaCBkYXRlIHNsb3QvY2VsbDpcclxuICBpdGVyYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgZnVuY3Rpb24gKGRhdGUsIHgsIHksIGkpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICB2YXIgc2xvdCA9IHRoYXQuZGF0YS5zbG90c1tkYXRla2V5XTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIHNpbXBsZSBhbmQgZGV0YWlsZWQgc3RhdHVzIGRlc2NyaXB0aW9uOlxyXG4gICAgdmFyIGRhdGVTdGF0dXMgPSAkLmlzUGxhaW5PYmplY3Qoc2xvdCkgPyBzbG90LnN0YXR1cyA6IHNsb3Q7XHJcbiAgICAvLyBEZWZhdWx0IHZhbHVlIGZyb20gZGF0YTpcclxuICAgIGRhdGVTdGF0dXMgPSBkYXRlU3RhdHVzIHx8IHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICd1bmtub3cnO1xyXG5cclxuICAgIGlmIChkYXRlU3RhdHVzKVxyXG4gICAgICB0aGlzLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgZGF0ZVN0YXR1cyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIE5vdGlmaWNhdGlvbnM6XHJcbiAgdGhpcy5ib29raW5nc05vdGlmaWNhdGlvbi5yZW5kZXIoKTtcclxufSxcclxuZ2V0VXBkYXRlZERhdGE6IGZ1bmN0aW9uIGdldFVwZGF0ZWREYXRhKCkge1xyXG4gIHZhciBkID0ge307XHJcbiAgaWYgKHRoaXMuZWRpdGFibGUpIHtcclxuICAgIC8vIENvcHkgZGF0YSwgd2UgZG9uJ3Qgd2FudCBjaGFuZ2UgdGhlIG9yaWdpbmFsOlxyXG4gICAgZXh0ZW5kKGQsIHRoaXMuZGF0YSk7XHJcblxyXG4gICAgLy8gRmlsdGVyIHNsb3RzIHRvIGdldCBvbmx5IHRoYXQgdXBkYXRlZCBieSBkZSB1c2VyOlxyXG4gICAgZC5zbG90cyA9IG9iamVjdFV0aWxzLmZpbHRlclByb3BlcnRpZXMoZC5zbG90cywgZnVuY3Rpb24gKGssIHYpIHtcclxuICAgICAgcmV0dXJuIHYuc291cmNlID09ICd1c2VyJztcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gZDtcclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gTW9udGhseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAvLyBJbml0aWFsaXppbmcgc29tZSBkYXRhLCBiZWluZyBjYXJlIG9mIGFueSB2YWx1ZVxyXG4gIC8vIHRoYXQgY29tZXMgZnJvbSBtZXJnaW5nIG9wdGlvbnMgaW50byAndGhpcydcclxuICB0aGlzLnVzZXIgPSB0aGlzLnVzZXIgfHwgdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG4gIHRoaXMucXVlcnkgPSBleHRlbmQoe1xyXG4gICAgdXNlcjogdGhpcy51c2VyLFxyXG4gICAgdHlwZTogJ21vbnRobHktc2NoZWR1bGUnXHJcbiAgfSwgdGhpcy5xdWVyeSk7XHJcblxyXG4gIC8vIElmIGlzIG5vdCBzZXQgYnkgY29uc3RydWN0b3Igb3B0aW9ucywgZ2V0IFxyXG4gIC8vICdlZGl0YWJsZScgZnJvbSBkYXRhLCBvciBsZWZ0IGRlZmF1bHQ6XHJcbiAgaWYgKCEob3B0aW9ucyAmJiB0eXBlb2YgKG9wdGlvbnMuZWRpdGFibGUpICE9ICd1bmRlZmluZWQnKSAmJlxyXG4gICAgdHlwZW9mICh0aGlzLiRlbC5kYXRhKCdlZGl0YWJsZScpKSAhPSAndW5kZWZpbmVkJylcclxuICAgIHRoaXMuZWRpdGFibGUgPSAhIXRoaXMuJGVsLmRhdGEoJ2VkaXRhYmxlJyk7XHJcblxyXG5cclxuICAvLyBTZXQgaGFuZGxlcnMgZm9yIHByZXYtbmV4dCBhY3Rpb25zOlxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5wcmV2QWN0aW9uLCBmdW5jdGlvbiBwcmV2KCkge1xyXG4gICAgbW92ZUJpbmRNb250aCh0aGF0LCAtMSk7XHJcbiAgfSk7XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLm5leHRBY3Rpb24sIGZ1bmN0aW9uIG5leHQoKSB7XHJcbiAgICBtb3ZlQmluZE1vbnRoKHRoYXQsIDEpO1xyXG4gIH0pO1xyXG4gIC8vIEhhbmRsZXIgZm9yIHRvZGF5IGFjdGlvblxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy50b2RheUFjdGlvbiwgZnVuY3Rpb24gdG9kYXkoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MobnVsbCwgdGhpcy5zaG93U2l4V2Vla3MpKTtcclxuICB9KTtcclxuXHJcbiAgLy8gRWRpdGFibGUgbW9kZVxyXG4gIGlmICh0aGlzLmVkaXRhYmxlKSB7XHJcbiAgICB0aGlzLnF1ZXJ5LmVkaXRhYmxlID0gdHJ1ZTtcclxuICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyArICcgdGQnLCBmdW5jdGlvbiBjbGlja1RvZ2dsZUF2YWlsYWJpbGl0eSgpIHtcclxuICAgICAgdG9nZ2xlRGF0ZUF2YWlsYWJpbGl0eSh0aGF0LCAkKHRoaXMpKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy4kZWwuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLmVkaXRhYmxlKTtcclxuICB9XHJcblxyXG4gIC8vIENyZWF0aW5nIHRoZSBib29raW5nc05vdGlmaWNhdGlvbiBlbGVtZW50LCBib3RoIGVkaXRhYmxlIGFuZCByZWFkLW9ubHkgbW9kZXMuXHJcbiAgLy8gUmVhZC1vbmx5IG1vZGUgbmVlZCBoaWRkZW4gdGhlIGVsZW1lbnQgYW5kIHRoYXRzIGRvbmUgb24gY29uc3RydWN0b3IgYW5kIGVkaXRhYmxlXHJcbiAgLy8gd2lsbCByZW5kZXIgaXQgb24gYmluZERhdGFcclxuICB0aGlzLmJvb2tpbmdzTm90aWZpY2F0aW9uID0gbmV3IEJvb2tpbmdzTm90aWZpY2F0aW9uKHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLmJvb2tpbmdzTm90aWZpY2F0aW9uKSk7XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgbW9udGhcclxuICB2YXIgZmlyc3REYXRlcyA9IHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MobnVsbCwgdGhpcy5zaG93U2l4V2Vla3MpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShmaXJzdERhdGVzKSkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKGZpcnN0RGF0ZXMpO1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCBtb250aCBpbiBhZHZhbmNlXHJcbiAgICBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaCh0aGF0LCBmaXJzdERhdGVzKTtcclxuICB9KTtcclxuXHJcbiAgY2hlY2tDdXJyZW50TW9udGgodGhpcy4kZWwsIGZpcnN0RGF0ZXMuc3RhcnQsIHRoaXMpO1xyXG5cclxuICAvLyBTaG93IGVycm9yIG1lc3NhZ2VcclxuICB0aGlzLmV2ZW50cy5vbignaGFzRXJyb3JDaGFuZ2VkJywgdXRpbHMuaGFuZGxlckNhbGVuZGFyRXJyb3IpO1xyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbk1vbnRobHkuZW5hYmxlQWxsID0gZnVuY3Rpb24gb24ob3B0aW9ucykge1xyXG4gIHZhciBsaXN0ID0gW107XHJcbiAgJCgnLicgKyBNb250aGx5LnByb3RvdHlwZS5jbGFzc2VzLm1vbnRobHlDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IE1vbnRobHkodGhpcywgb3B0aW9ucykpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBsaXN0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb250aGx5O1xyXG4iLCIvKipcclxuICBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgTGNXaWRnZXQgPSByZXF1aXJlKCcuLi9DWC9MY1dpZGdldCcpLFxyXG4gIGV4dGVuZCA9IHJlcXVpcmUoJy4uL0NYL2V4dGVuZCcpO1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcblxyXG4vKipcclxuV2Vla2x5IGNhbGVuZGFyLCBpbmhlcml0cyBmcm9tIExjV2lkZ2V0XHJcbioqL1xyXG52YXIgV2Vla2x5ID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiB1dGlscy53ZWVrbHlDbGFzc2VzLFxyXG50ZXh0czogdXRpbHMud2Vla2x5VGV4dHMsXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcblxyXG4vLyBPdXIgJ3ZpZXcnIHdpbGwgYmUgYSBzdWJzZXQgb2YgdGhlIGRhdGEsXHJcbi8vIGRlbGltaXRlZCBieSB0aGUgbmV4dCBwcm9wZXJ0eSwgYSBkYXRlcyByYW5nZTpcclxuZGF0ZXNSYW5nZTogeyBzdGFydDogbnVsbCwgZW5kOiBudWxsIH0sXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YVdlZWtseShkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5zbG90cykgcmV0dXJuO1xyXG5cclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICB1dGlscy5jaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBkYXRlc1JhbmdlLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgdXRpbHMudXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIHRoaXMuJGVsLCB0aGlzKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB1dGlscy5kYXRlLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICB2YXIgZGF0ZVNsb3RzID0gdGhhdC5kYXRhLnNsb3RzW2RhdGVrZXldO1xyXG4gICAgaWYgKGRhdGVTbG90cykge1xyXG4gICAgICBmb3IgKHMgPSAwOyBzIDwgZGF0ZVNsb3RzLmxlbmd0aDsgcysrKSB7XHJcbiAgICAgICAgdmFyIHNsb3QgPSBkYXRlU2xvdHNbc107XHJcbiAgICAgICAgdmFyIHNsb3RDZWxsID0gdXRpbHMuZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIGksIHNsb3QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkZWZhdWx0IHN0YXR1c1xyXG4gICAgICAgIHNsb3RDZWxsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ18nKTtcclxuICAgICAgICAvLyBBZGRpbmcgc3RhdHVzIGNsYXNzXHJcbiAgICAgICAgc2xvdENlbGwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBXZWVrbHkoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIC8vIFJldXNpbmcgYmFzZSBjb25zdHJ1Y3RvciB0b28gZm9yIGluaXRpYWxpemluZzpcclxuICBMY1dpZGdldC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIC8vIFRvIHVzZSB0aGlzIGluIGNsb3N1cmVzOlxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdGhpcy51c2VyID0gdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG4gIHRoaXMucXVlcnkgPSB7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnd2Vla2x5J1xyXG4gIH07XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgd2Vla1xyXG4gIHZhciBmaXJzdERhdGVzID0gdXRpbHMuZGF0ZS5jdXJyZW50V2VlaygpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShmaXJzdERhdGVzKSkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKGZpcnN0RGF0ZXMpO1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHV0aWxzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2godGhhdCwgZmlyc3REYXRlcyk7XHJcbiAgfSk7XHJcbiAgdXRpbHMuY2hlY2tDdXJyZW50V2Vlayh0aGlzLiRlbCwgZmlyc3REYXRlcy5zdGFydCwgdGhpcyk7XHJcblxyXG4gIC8vIFNldCBoYW5kbGVycyBmb3IgcHJldi1uZXh0IGFjdGlvbnM6XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnByZXZBY3Rpb24sIGZ1bmN0aW9uIHByZXYoKSB7XHJcbiAgICB1dGlscy5tb3ZlQmluZFJhbmdlSW5EYXlzKHRoYXQsIC03KTtcclxuICB9KTtcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMubmV4dEFjdGlvbiwgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgNyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFNob3cgZXJyb3IgbWVzc2FnZVxyXG4gIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCB1dGlscy5oYW5kbGVyQ2FsZW5kYXJFcnJvcik7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldlZWtseS5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdlZWtseS5wcm90b3R5cGUuY2xhc3Nlcy53ZWVrbHlDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdlZWtseSh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdlZWtseTtcclxuIiwiLyoqXHJcbiAgV29yayBIb3VycyBjYWxlbmRhciBjbGFzc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4uL0NYL0xjV2lkZ2V0JyksXHJcbiAgZXh0ZW5kID0gcmVxdWlyZSgnLi4vQ1gvZXh0ZW5kJyksXHJcbiAgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXHJcbiAgY2xlYXJDdXJyZW50U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9jbGVhckN1cnJlbnRTZWxlY3Rpb24nKSxcclxuICBtYWtlVW5zZWxlY3RhYmxlID0gcmVxdWlyZSgnLi9tYWtlVW5zZWxlY3RhYmxlJyk7XHJcbnJlcXVpcmUoJy4uL2pxdWVyeS5ib3VuZHMnKTtcclxudmFyIGV2ZW50cyA9IHtcclxuICAgIGRhdGFDaGFuZ2VkOiAnZGF0YUNoYW5nZWQnXHJcbn07XHJcblxyXG4vKipcclxuV29yayBob3VycyBwcml2YXRlIHV0aWxzXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cEVkaXRXb3JrSG91cnMoKSB7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIC8vIFNldCBoYW5kbGVycyB0byBzd2l0Y2ggc3RhdHVzIGFuZCB1cGRhdGUgYmFja2VuZCBkYXRhXHJcbiAgLy8gd2hlbiB0aGUgdXNlciBzZWxlY3QgY2VsbHNcclxuICB2YXIgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyk7XHJcblxyXG4gIGZ1bmN0aW9uIHRvZ2dsZUNlbGwoY2VsbCkge1xyXG4gICAgLy8gRmluZCBkYXkgYW5kIHRpbWUgb2YgdGhlIGNlbGw6XHJcbiAgICB2YXIgc2xvdCA9IHV0aWxzLmZpbmRTbG90QnlDZWxsKHNsb3RzQ29udGFpbmVyLCBjZWxsKTtcclxuICAgIC8vIEdldCB3ZWVrLWRheSBzbG90cyBhcnJheTpcclxuICAgIHZhciB3a3Nsb3RzID0gdGhhdC5kYXRhLnNsb3RzW3V0aWxzLnN5c3RlbVdlZWtEYXlzW3Nsb3QuZGF5XV0gPSB0aGF0LmRhdGEuc2xvdHNbdXRpbHMuc3lzdGVtV2Vla0RheXNbc2xvdC5kYXldXSB8fCBbXTtcclxuICAgIC8vIElmIGl0IGhhcyBhbHJlYWR5IHRoZSBkYXRhLnN0YXR1cywgdG9nZ2xlIHRvIHRoZSBkZWZhdWx0U3RhdHVzXHJcbiAgICAvLyAgdmFyIHN0YXR1c0NsYXNzID0gdGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzLFxyXG4gICAgLy8gICAgICBkZWZhdWx0U3RhdHVzQ2xhc3MgPSB0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzO1xyXG4gICAgLy9pZiAoY2VsbC5oYXNDbGFzcyhzdGF0dXNDbGFzc1xyXG4gICAgLy8gVG9nZ2xlIGZyb20gdGhlIGFycmF5XHJcbiAgICB2YXIgc3Ryc2xvdCA9IGRhdGVJU08udGltZUxvY2FsKHNsb3Quc2xvdCwgdHJ1ZSksXHJcbiAgICAgIGlzbG90ID0gd2tzbG90cy5pbmRleE9mKHN0cnNsb3QpO1xyXG4gICAgaWYgKGlzbG90ID09IC0xKVxyXG4gICAgICB3a3Nsb3RzLnB1c2goc3Ryc2xvdCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIC8vZGVsZXRlIHdrc2xvdHNbaXNsb3RdO1xyXG4gICAgICB3a3Nsb3RzLnNwbGljZShpc2xvdCwgMSk7XHJcblxyXG4gICAgdGhhdC5ldmVudHMuZW1pdChldmVudHMuZGF0YUNoYW5nZWQsIGNlbGwsIHNsb3QpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2VsbFJhbmdlKGZpcnN0Q2VsbCwgbGFzdENlbGwpIHtcclxuICAgIHZhciBcclxuICAgICAgeCA9IGZpcnN0Q2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgoZmlyc3RDZWxsKSxcclxuICAgICAgeTEgPSBmaXJzdENlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpLFxyXG4gICAgLy94MiA9IGxhc3RDZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChsYXN0Q2VsbCksXHJcbiAgICAgIHkyID0gbGFzdENlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpO1xyXG5cclxuICAgIGlmICh5MSA+IHkyKSB7XHJcbiAgICAgIHZhciB5MCA9IHkxO1xyXG4gICAgICB5MSA9IHkyO1xyXG4gICAgICB5MiA9IHkwO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIHkgPSB5MTsgeSA8PSB5MjsgeSsrKSB7XHJcbiAgICAgIHZhciBjZWxsID0gZmlyc3RDZWxsLmNsb3Nlc3QoJ3Rib2R5JykuY2hpbGRyZW4oJ3RyOmVxKCcgKyB5ICsgJyknKS5jaGlsZHJlbigndGQ6ZXEoJyArIHggKyAnKScpO1xyXG4gICAgICB0b2dnbGVDZWxsKGNlbGwpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdmFyIGRyYWdnaW5nID0ge1xyXG4gICAgZmlyc3Q6IG51bGwsXHJcbiAgICBsYXN0OiBudWxsLFxyXG4gICAgc2VsZWN0aW9uTGF5ZXI6ICQoJzxkaXYgY2xhc3M9XCJTZWxlY3Rpb25MYXllclwiIC8+JykuYXBwZW5kVG8odGhpcy4kZWwpLFxyXG4gICAgZG9uZTogZmFsc2VcclxuICB9O1xyXG4gIFxyXG4gIGZ1bmN0aW9uIG9mZnNldFRvUG9zaXRpb24oZWwsIG9mZnNldCkge1xyXG4gICAgdmFyIHBiID0gJChlbC5vZmZzZXRQYXJlbnQpLmJvdW5kcygpLFxyXG4gICAgICBzID0ge307XHJcblxyXG4gICAgcy50b3AgPSBvZmZzZXQudG9wIC0gcGIudG9wO1xyXG4gICAgcy5sZWZ0ID0gb2Zmc2V0LmxlZnQgLSBwYi5sZWZ0O1xyXG5cclxuICAgIC8vcy5ib3R0b20gPSBwYi50b3AgLSBvZmZzZXQuYm90dG9tO1xyXG4gICAgLy9zLnJpZ2h0ID0gb2Zmc2V0LmxlZnQgLSBvZmZzZXQucmlnaHQ7XHJcbiAgICBzLmhlaWdodCA9IG9mZnNldC5ib3R0b20gLSBvZmZzZXQudG9wO1xyXG4gICAgcy53aWR0aCA9IG9mZnNldC5yaWdodCAtIG9mZnNldC5sZWZ0O1xyXG5cclxuICAgICQoZWwpLmNzcyhzKTtcclxuICAgIHJldHVybiBzO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXBkYXRlU2VsZWN0aW9uKGVsKSB7XHJcbiAgICB2YXIgYSA9IGRyYWdnaW5nLmZpcnN0LmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICB2YXIgYiA9IGVsLmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICB2YXIgcyA9IGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcblxyXG4gICAgcy50b3AgPSBhLnRvcCA8IGIudG9wID8gYS50b3AgOiBiLnRvcDtcclxuICAgIHMuYm90dG9tID0gYS5ib3R0b20gPiBiLmJvdHRvbSA/IGEuYm90dG9tIDogYi5ib3R0b207XHJcblxyXG4gICAgb2Zmc2V0VG9Qb3NpdGlvbihkcmFnZ2luZy5zZWxlY3Rpb25MYXllclswXSwgcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmaW5pc2hEcmFnKCkge1xyXG4gICAgaWYgKGRyYWdnaW5nLmZpcnN0ICYmIGRyYWdnaW5nLmxhc3QpIHtcclxuICAgICAgdG9nZ2xlQ2VsbFJhbmdlKGRyYWdnaW5nLmZpcnN0LCBkcmFnZ2luZy5sYXN0KTtcclxuICAgICAgdGhhdC5iaW5kRGF0YSgpO1xyXG5cclxuICAgICAgZHJhZ2dpbmcuZG9uZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBkcmFnZ2luZy5maXJzdCA9IGRyYWdnaW5nLmxhc3QgPSBudWxsO1xyXG4gICAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuaGlkZSgpO1xyXG4gICAgbWFrZVVuc2VsZWN0YWJsZS5vZmYodGhhdC4kZWwpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICB0aGlzLiRlbC5maW5kKHNsb3RzQ29udGFpbmVyKS5vbignY2xpY2snLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBEbyBleGNlcHQgYWZ0ZXIgYSBkcmFnZ2luZyBkb25lIGNvbXBsZXRlXHJcbiAgICBpZiAoZHJhZ2dpbmcuZG9uZSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgdG9nZ2xlQ2VsbCgkKHRoaXMpKTtcclxuICAgIHRoYXQuYmluZERhdGEoKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbiAgdGhpcy4kZWwuZmluZChzbG90c0NvbnRhaW5lcilcclxuICAub24oJ21vdXNlZG93bicsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGRyYWdnaW5nLmRvbmUgPSBmYWxzZTtcclxuICAgIGRyYWdnaW5nLmZpcnN0ID0gJCh0aGlzKTtcclxuICAgIGRyYWdnaW5nLmxhc3QgPSBudWxsO1xyXG4gICAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuc2hvdygpO1xyXG5cclxuICAgIG1ha2VVbnNlbGVjdGFibGUodGhhdC4kZWwpO1xyXG4gICAgY2xlYXJDdXJyZW50U2VsZWN0aW9uKCk7XHJcblxyXG4gICAgdmFyIHMgPSBkcmFnZ2luZy5maXJzdC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgb2Zmc2V0VG9Qb3NpdGlvbihkcmFnZ2luZy5zZWxlY3Rpb25MYXllclswXSwgcyk7XHJcblxyXG4gIH0pXHJcbiAgLm9uKCdtb3VzZWVudGVyJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKGRyYWdnaW5nLmZpcnN0KSB7XHJcbiAgICAgIGRyYWdnaW5nLmxhc3QgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgdXBkYXRlU2VsZWN0aW9uKGRyYWdnaW5nLmxhc3QpO1xyXG4gICAgfVxyXG4gIH0pXHJcbiAgLm9uKCdtb3VzZXVwJywgZmluaXNoRHJhZylcclxuICAuZmluZCgndGQnKVxyXG4gIC5hdHRyKCdkcmFnZ2FibGUnLCBmYWxzZSk7XHJcblxyXG4gIC8vIFRoaXMgd2lsbCBub3Qgd29yayB3aXRoIHBvaW50ZXItZXZlbnRzOm5vbmUsIGJ1dCBvbiBvdGhlclxyXG4gIC8vIGNhc2VzIChyZWNlbnRJRSlcclxuICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5vbignbW91c2V1cCcsIGZpbmlzaERyYWcpXHJcbiAgLmF0dHIoJ2RyYWdnYWJsZScsIGZhbHNlKTtcclxuXHJcbn1cclxuXHJcbi8qKlxyXG5Xb3JrIGhvdXJzIGNhbGVuZGFyLCBpbmhlcml0cyBmcm9tIExjV2lkZ2V0XHJcbioqL1xyXG52YXIgV29ya0hvdXJzID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseUNsYXNzZXMsIHtcclxuICB3ZWVrbHlDYWxlbmRhcjogdW5kZWZpbmVkLFxyXG4gIHdvcmtIb3Vyc0NhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItLXdvcmtIb3VycydcclxufSksXHJcbnRleHRzOiB1dGlscy53ZWVrbHlUZXh0cyxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhV29ya0hvdXJzKCkge1xyXG4gIHZhciBcclxuICAgIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpLFxyXG4gICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgdXRpbHMuc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdXRpbHMuc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgLy8gU2V0IGFsbCBzbG90cyB3aXRoIGRlZmF1bHQgc3RhdHVzXHJcbiAgc2xvdHMuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cyk7XHJcblxyXG4gIGlmICghdGhpcy5kYXRhLnNsb3RzIHx8ICF0aGlzLmRhdGEuc3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgZm9yICh2YXIgd2sgPSAwOyB3ayA8IHV0aWxzLnN5c3RlbVdlZWtEYXlzLmxlbmd0aDsgd2srKykge1xyXG4gICAgdmFyIGRhdGVTbG90cyA9IHRoYXQuZGF0YS5zbG90c1t1dGlscy5zeXN0ZW1XZWVrRGF5c1t3a11dO1xyXG4gICAgaWYgKGRhdGVTbG90cyAmJiBkYXRlU2xvdHMubGVuZ3RoKSB7XHJcbiAgICAgIGZvciAocyA9IDA7IHMgPCBkYXRlU2xvdHMubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICB2YXIgc2xvdCA9IGRhdGVTbG90c1tzXTtcclxuICAgICAgICB2YXIgc2xvdENlbGwgPSB1dGlscy5maW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgd2ssIHNsb3QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkZWZhdWx0IHN0YXR1c1xyXG4gICAgICAgIHNsb3RDZWxsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ18nKTtcclxuICAgICAgICAvLyBBZGRpbmcgc3RhdHVzIGNsYXNzXHJcbiAgICAgICAgc2xvdENlbGwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gV29ya0hvdXJzKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICBMY1dpZGdldC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdGhpcy51c2VyID0gdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG5cclxuICB0aGlzLnF1ZXJ5ID0ge1xyXG4gICAgdXNlcjogdGhpcy51c2VyLFxyXG4gICAgdHlwZTogJ3dvcmtIb3VycydcclxuICB9O1xyXG5cclxuICAvLyBGZXRjaCB0aGUgZGF0YTogdGhlcmUgaXMgbm90IGEgbW9yZSBzcGVjaWZpYyBxdWVyeSxcclxuICAvLyBpdCBqdXN0IGdldCB0aGUgaG91cnMgZm9yIGVhY2ggd2Vlay1kYXkgKGRhdGFcclxuICAvLyBzbG90cyBhcmUgcGVyIHdlZWstZGF5IGluc3RlYWQgb2YgcGVyIGRhdGUgY29tcGFyZWRcclxuICAvLyB0byAqd2Vla2x5KilcclxuICB0aGlzLmZldGNoRGF0YSgpLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC5iaW5kRGF0YSgpO1xyXG4gIH0pO1xyXG5cclxuICBzZXR1cEVkaXRXb3JrSG91cnMuY2FsbCh0aGlzKTtcclxuXHJcbiAgLy8gU2hvdyBlcnJvciBtZXNzYWdlXHJcbiAgdGhpcy5ldmVudHMub24oJ2hhc0Vycm9yQ2hhbmdlZCcsIHV0aWxzLmhhbmRsZXJDYWxlbmRhckVycm9yKTtcclxuXHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXb3JraG91cnMgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuV29ya0hvdXJzLmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgV29ya0hvdXJzLnByb3RvdHlwZS5jbGFzc2VzLndvcmtIb3Vyc0NhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgV29ya0hvdXJzKHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV29ya0hvdXJzOyIsIi8qKlxyXG5Dcm9zcyBicm93c2VyIHdheSB0byB1bnNlbGVjdCBjdXJyZW50IHNlbGVjdGlvblxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjbGVhckN1cnJlbnRTZWxlY3Rpb24oKSB7XHJcbiAgaWYgKHR5cGVvZiAod2luZG93LmdldFNlbGVjdGlvbikgPT09ICdmdW5jdGlvbicpXHJcbiAgLy8gU3RhbmRhcmRcclxuICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5yZW1vdmVBbGxSYW5nZXMoKTtcclxuICBlbHNlIGlmIChkb2N1bWVudC5zZWxlY3Rpb24gJiYgdHlwZW9mIChkb2N1bWVudC5zZWxlY3Rpb24uZW1wdHkpID09PSAnZnVuY3Rpb24nKVxyXG4gIC8vIElFXHJcbiAgICBkb2N1bWVudC5zZWxlY3Rpb24uZW1wdHkoKTtcclxufTsiLCIvKipcclxuICBBIGNvbGxlY3Rpb24gb2YgdXNlZnVsIGdlbmVyaWMgdXRpbHMgbWFuYWdpbmcgRGF0ZXNcclxuKiovXHJcbnZhciBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKTtcclxuXHJcbmZ1bmN0aW9uIGN1cnJlbnRXZWVrKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZ2V0Rmlyc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKSxcclxuICAgIGVuZDogZ2V0TGFzdFdlZWtEYXRlKG5ldyBEYXRlKCkpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmN1cnJlbnRXZWVrID0gY3VycmVudFdlZWs7XHJcblxyXG5mdW5jdGlvbiBuZXh0V2VlayhzdGFydCwgZW5kKSB7XHJcbiAgLy8gVW5pcXVlIHBhcmFtIHdpdGggYm90aCBwcm9waWVydGllczpcclxuICBpZiAoc3RhcnQuZW5kKSB7XHJcbiAgICBlbmQgPSBzdGFydC5lbmQ7XHJcbiAgICBzdGFydCA9IHN0YXJ0LnN0YXJ0O1xyXG4gIH1cclxuICAvLyBPcHRpb25hbCBlbmQ6XHJcbiAgZW5kID0gZW5kIHx8IGFkZERheXMoc3RhcnQsIDcpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogYWRkRGF5cyhzdGFydCwgNyksXHJcbiAgICBlbmQ6IGFkZERheXMoZW5kLCA3KVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5uZXh0V2VlayA9IG5leHRXZWVrO1xyXG5cclxuZnVuY3Rpb24gZ2V0Rmlyc3RXZWVrRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgLSBkLmdldERheSgpKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldEZpcnN0V2Vla0RhdGUgPSBnZXRGaXJzdFdlZWtEYXRlO1xyXG5cclxuZnVuY3Rpb24gZ2V0TGFzdFdlZWtEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSArICg2IC0gZC5nZXREYXkoKSkpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0TGFzdFdlZWtEYXRlID0gZ2V0TGFzdFdlZWtEYXRlO1xyXG5cclxuZnVuY3Rpb24gaXNJbkN1cnJlbnRXZWVrKGRhdGUpIHtcclxuICByZXR1cm4gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RXZWVrRGF0ZShkYXRlKSkgPT0gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKSk7XHJcbn1cclxuZXhwb3J0cy5pc0luQ3VycmVudFdlZWsgPSBpc0luQ3VycmVudFdlZWs7XHJcblxyXG5mdW5jdGlvbiBhZGREYXlzKGRhdGUsIGRheXMpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGRheXMpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuYWRkRGF5cyA9IGFkZERheXM7XHJcblxyXG5mdW5jdGlvbiBlYWNoRGF0ZUluUmFuZ2Uoc3RhcnQsIGVuZCwgZm4pIHtcclxuICBpZiAoIWZuLmNhbGwpIHRocm93IG5ldyBFcnJvcignZm4gbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIFwiY2FsbFwiYWJsZSBvYmplY3QnKTtcclxuICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHN0YXJ0KTtcclxuICB2YXIgaSA9IDAsIHJldDtcclxuICB3aGlsZSAoZGF0ZSA8PSBlbmQpIHtcclxuICAgIHJldCA9IGZuLmNhbGwoZm4sIGRhdGUsIGkpO1xyXG4gICAgLy8gQWxsb3cgZm4gdG8gY2FuY2VsIHRoZSBsb29wIHdpdGggc3RyaWN0ICdmYWxzZSdcclxuICAgIGlmIChyZXQgPT09IGZhbHNlKVxyXG4gICAgICBicmVhaztcclxuICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDEpO1xyXG4gICAgaSsrO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLmVhY2hEYXRlSW5SYW5nZSA9IGVhY2hEYXRlSW5SYW5nZTtcclxuXHJcbi8qKiBNb250aHMgKiovXHJcblxyXG5mdW5jdGlvbiBnZXRGaXJzdE1vbnRoRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoMSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRGaXJzdE1vbnRoRGF0ZSA9IGdldEZpcnN0TW9udGhEYXRlO1xyXG5cclxuZnVuY3Rpb24gZ2V0TGFzdE1vbnRoRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldE1vbnRoKGQuZ2V0TW9udGgoKSArIDEsIDEpO1xyXG4gIGQgPSBhZGREYXlzKGQsIC0xKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldExhc3RNb250aERhdGUgPSBnZXRMYXN0TW9udGhEYXRlO1xyXG5cclxuZnVuY3Rpb24gaXNJbkN1cnJlbnRNb250aChkYXRlKSB7XHJcbiAgcmV0dXJuIGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0TW9udGhEYXRlKGRhdGUpKSA9PSBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdE1vbnRoRGF0ZShuZXcgRGF0ZSgpKSk7XHJcbn1cclxuZXhwb3J0cy5pc0luQ3VycmVudE1vbnRoID0gaXNJbkN1cnJlbnRNb250aDtcclxuXHJcbi8qKlxyXG4gIEdldCBhIGRhdGVzIHJhbmdlIGZvciB0aGUgY3VycmVudCBtb250aFxyXG4gIChvciB0aGUgZ2l2ZW4gZGF0ZSBhcyBiYXNlKVxyXG4qKi9cclxuZnVuY3Rpb24gY3VycmVudE1vbnRoKGJhc2VEYXRlKSB7XHJcbiAgYmFzZURhdGUgPSBiYXNlRGF0ZSB8fCBuZXcgRGF0ZSgpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZ2V0Rmlyc3RNb250aERhdGUoYmFzZURhdGUpLFxyXG4gICAgZW5kOiBnZXRMYXN0TW9udGhEYXRlKGJhc2VEYXRlKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50TW9udGggPSBjdXJyZW50TW9udGg7XHJcblxyXG5mdW5jdGlvbiBuZXh0TW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykge1xyXG4gIGFtb3VudE1vbnRocyA9IGFtb3VudE1vbnRocyB8fCAxO1xyXG4gIHZhciBkID0gbmV3IERhdGUoZnJvbURhdGUpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZC5zZXRNb250aChkLmdldE1vbnRoKCkgKyBhbW91bnRNb250aHMsIDEpLFxyXG4gICAgZW5kOiBnZXRMYXN0TW9udGhEYXRlKGQpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLm5leHRNb250aCA9IG5leHRNb250aDtcclxuXHJcbmZ1bmN0aW9uIHByZXZpb3VzTW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykge1xyXG4gIHJldHVybiBuZXh0TW9udGgoZnJvbURhdGUsIDAgLSBhbW91bnRNb250aHMpO1xyXG59XHJcbmV4cG9ydHMucHJldmlvdXNNb250aCA9IHByZXZpb3VzTW9udGg7XHJcblxyXG4vKipcclxuICBHZXQgYSBkYXRlcyByYW5nZSBmb3IgdGhlIGNvbXBsZXRlIHdlZWtzXHJcbiAgdGhhdCBhcmUgcGFydCBvZiB0aGUgY3VycmVudCBtb250aFxyXG4gIChvciB0aGUgZ2l2ZW4gZGF0ZSBhcyBiYXNlKS5cclxuICBUaGF0IG1lYW5zLCB0aGF0IHN0YXJ0IGRhdGUgd2lsbCBiZSB0aGUgZmlyc3RcclxuICB3ZWVrIGRhdGUgb2YgdGhlIGZpcnN0IG1vbnRoIHdlZWsgKHRoYXQgY2FuXHJcbiAgYmUgdGhlIGRheSAxIG9mIHRoZSBtb250aCBvciBvbmUgb2YgdGhlIGxhc3RcclxuICBkYXRlcyBmcm9tIHRoZSBwcmV2aW91cyBtb250aHMpLFxyXG4gIGFuZCBzaW1pbGFyIGZvciB0aGUgZW5kIGRhdGUgYmVpbmcgdGhlIFxyXG4gIGxhc3Qgd2VlayBkYXRlIG9mIHRoZSBsYXN0IG1vbnRoIHdlZWsuXHJcblxyXG4gIEBpbmNsdWRlU2l4V2Vla3M6IHNvbWV0aW1lcyBpcyB1c2VmdWwgZ2V0IGV2ZXIgYVxyXG4gIHNpeCB3ZWVrcyBkYXRlcyByYW5nZSBzdGFyaW5nIGJ5IHRoZSBmaXJzdCB3ZWVrIG9mXHJcbiAgdGhlIGJhc2VEYXRlIG1vbnRoLiBCeSBkZWZhdWx0IGlzIGZhbHNlLlxyXG4qKi9cclxuZnVuY3Rpb24gY3VycmVudE1vbnRoV2Vla3MoYmFzZURhdGUsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHZhciByID0gY3VycmVudE1vbnRoKGJhc2VEYXRlKSxcclxuICAgIHMgPSBnZXRGaXJzdFdlZWtEYXRlKHIuc3RhcnQpLFxyXG4gICAgZSA9IGluY2x1ZGVTaXhXZWVrcyA/IGFkZERheXMocywgNio3IC0gMSkgOiBnZXRMYXN0V2Vla0RhdGUoci5lbmQpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogcyxcclxuICAgIGVuZDogZVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50TW9udGhXZWVrcyA9IGN1cnJlbnRNb250aFdlZWtzO1xyXG5cclxuZnVuY3Rpb24gbmV4dE1vbnRoV2Vla3MoZnJvbURhdGUsIGFtb3VudE1vbnRocywgaW5jbHVkZVNpeFdlZWtzKSB7XHJcbiAgcmV0dXJuIGN1cnJlbnRNb250aFdlZWtzKG5leHRNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKS5zdGFydCwgaW5jbHVkZVNpeFdlZWtzKTtcclxufVxyXG5leHBvcnRzLm5leHRNb250aFdlZWtzID0gbmV4dE1vbnRoV2Vla3M7XHJcblxyXG5mdW5jdGlvbiBwcmV2aW91c01vbnRoV2Vla3MoZnJvbURhdGUsIGFtb3VudE1vbnRocywgaW5jbHVkZVNpeFdlZWtzKSB7XHJcbiAgcmV0dXJuIGN1cnJlbnRNb250aFdlZWtzKHByZXZpb3VzTW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykuc3RhcnQsIGluY2x1ZGVTaXhXZWVrcyk7XHJcbn1cclxuZXhwb3J0cy5wcmV2aW91c01vbnRoV2Vla3MgPSBwcmV2aW91c01vbnRoV2Vla3M7XHJcbiIsIi8qKiBWZXJ5IHNpbXBsZSBjdXN0b20tZm9ybWF0IGZ1bmN0aW9uIHRvIGFsbG93IFxyXG5sMTBuIG9mIHRleHRzLlxyXG5Db3ZlciBjYXNlczpcclxuLSBNIGZvciBtb250aFxyXG4tIEQgZm9yIGRheVxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb3JtYXREYXRlKGRhdGUsIGZvcm1hdCkge1xyXG4gIHZhciBzID0gZm9ybWF0LFxyXG4gICAgICBNID0gZGF0ZS5nZXRNb250aCgpICsgMSxcclxuICAgICAgRCA9IGRhdGUuZ2V0RGF0ZSgpO1xyXG4gIHMgPSBzLnJlcGxhY2UoL00vZywgTSk7XHJcbiAgcyA9IHMucmVwbGFjZSgvRC9nLCBEKTtcclxuICByZXR1cm4gcztcclxufTsiLCIvKipcclxuICBFeHBvc2luZyBhbGwgdGhlIHB1YmxpYyBmZWF0dXJlcyBhbmQgY29tcG9uZW50cyBvZiBhdmFpbGFiaWxpdHlDYWxlbmRhclxyXG4qKi9cclxuZXhwb3J0cy5XZWVrbHkgPSByZXF1aXJlKCcuL1dlZWtseScpO1xyXG5leHBvcnRzLldvcmtIb3VycyA9IHJlcXVpcmUoJy4vV29ya0hvdXJzJyk7XHJcbmV4cG9ydHMuTW9udGhseSA9IHJlcXVpcmUoJy4vTW9udGhseScpOyIsIi8qKlxyXG4gIE1ha2UgYW4gZWxlbWVudCB1bnNlbGVjdGFibGUsIHVzZWZ1bCB0byBpbXBsZW1lbnQgc29tZSBjdXN0b21cclxuICBzZWxlY3Rpb24gYmVoYXZpb3Igb3IgZHJhZyZkcm9wLlxyXG4gIElmIG9mZmVycyBhbiAnb2ZmJyBtZXRob2QgdG8gcmVzdG9yZSBiYWNrIHRoZSBlbGVtZW50IGJlaGF2aW9yLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgdmFyIGZhbHN5Zm4gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcclxuICB2YXIgbm9kcmFnU3R5bGUgPSB7XHJcbiAgICAnLXdlYmtpdC10b3VjaC1jYWxsb3V0JzogJ25vbmUnLFxyXG4gICAgJy1raHRtbC11c2VyLWRyYWcnOiAnbm9uZScsXHJcbiAgICAnLXdlYmtpdC11c2VyLWRyYWcnOiAnbm9uZScsXHJcbiAgICAnLWtodG1sLXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy13ZWJraXQtdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLW1vei11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctbXMtdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAndXNlci1zZWxlY3QnOiAnbm9uZSdcclxuICB9O1xyXG4gIHZhciBkcmFnZGVmYXVsdFN0eWxlID0ge1xyXG4gICAgJy13ZWJraXQtdG91Y2gtY2FsbG91dCc6ICdpbmhlcml0JyxcclxuICAgICcta2h0bWwtdXNlci1kcmFnJzogJ2luaGVyaXQnLFxyXG4gICAgJy13ZWJraXQtdXNlci1kcmFnJzogJ2luaGVyaXQnLFxyXG4gICAgJy1raHRtbC11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctd2Via2l0LXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJ3VzZXItc2VsZWN0JzogJ2luaGVyaXQnXHJcbiAgfTtcclxuXHJcbiAgdmFyIG9uID0gZnVuY3Rpb24gbWFrZVVuc2VsZWN0YWJsZShlbCkge1xyXG4gICAgZWwgPSAkKGVsKTtcclxuICAgIGVsLm9uKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgLy8kKGRvY3VtZW50KS5vbignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIGVsLmNzcyhub2RyYWdTdHlsZSk7XHJcbiAgfTtcclxuXHJcbiAgdmFyIG9mZiA9IGZ1bmN0aW9uIG9mZk1ha2VVbnNlbGVjdGFibGUoZWwpIHtcclxuICAgIGVsID0gJChlbCk7XHJcbiAgICBlbC5vZmYoJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICAvLyQoZG9jdW1lbnQpLm9mZignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIGVsLmNzcyhkcmFnZGVmYXVsdFN0eWxlKTtcclxuICB9O1xyXG5cclxuICBvbi5vZmYgPSBvZmY7XHJcbiAgcmV0dXJuIG9uO1xyXG5cclxufSAoKSk7IiwiLyoqXHJcbiAgQSBzZXQgb2YgZ2VuZXJpYyB1dGlsaXRpZXMgdG8gbWFuYWdlIGpzIG9iamVjdHNcclxuKiovXHJcbnZhciB1ID0ge307XHJcblxyXG4vKipcclxuICBQZXJmb3JtcyBhIGNhbGxiYWNrIG9uIGVhY2ggcHJvcGVydHkgb3duZWQgYnkgdGhlIG9iamVjdFxyXG4qKi9cclxudS5lYWNoUHJvcGVydHkgPSBmdW5jdGlvbiBlYWNoUHJvcGVydHkob2JqLCBjYikge1xyXG4gIGZvciAodmFyIHAgaW4gb2JqKSB7XHJcbiAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShwKSkgY29udGludWU7XHJcbiAgICBjYi5jYWxsKG9iaiwgcCwgb2JqW3BdKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICBGaWx0ZXIgdGhlIGdpdmVuIG9iamVjdCByZXR1cm5pbmcgYSBuZXcgb25lIHdpdGggb25seSB0aGUgcHJvcGVydGllc1xyXG4gIChhbmQgb3JpZ2luYWwgdmFsdWVzIC1yZWZzIGZvciBvYmplY3QgdmFsdWVzLSkgdGhhdCBwYXNzXHJcbiAgdGhlIHByb3ZpZGVkIEBmaWx0ZXIgY2FsbGJhY2sgKGNhbGxiYWNrIG11c3QgcmV0dXJuIGEgdHJ1ZS90cnV0aHkgdmFsdWVcclxuICBmb3IgZWFjaCB2YWx1ZSBkZXNpcmVkIGluIHRoZSByZXN1bHQpLlxyXG4gIFRoZSBAZmlsdGVyIGNhbGxiYWNrIGl0cyBleGVjdXRlZCB3aXRoIHRoZSBvYmplY3QgYXMgY29udGV4dCBhbmQgcmVjZWl2ZXNcclxuICBhcyBwYXJlbWV0ZXJzIHRoZSBwcm9wZXJ0eSBrZXkgYW5kIGl0cyB2YWx1ZSBcImZpbHRlcihrLCB2KVwiLlxyXG4qKi9cclxudS5maWx0ZXJQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZmlsdGVyUHJvcGVyaWVzKG9iaiwgZmlsdGVyKSB7XHJcbiAgdmFyIHIgPSB7fTtcclxuICB1LmVhY2hQcm9wZXJ0eShvYmosIGZ1bmN0aW9uIChrLCB2KSB7XHJcbiAgICBpZiAoZmlsdGVyLmNhbGwob2JqLCBrLCB2KSlcclxuICAgICAgcltrXSA9IHY7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHU7IiwiLyoqXHJcbiAgQXZhaWxhYmlsaXR5Q2FsZW5kYXIgc2hhcmVkIHV0aWxzXHJcbioqL1xyXG52YXIgXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIGRhdGVVdGlscyA9IHJlcXVpcmUoJy4vZGF0ZVV0aWxzJyksXHJcbiAgZm9ybWF0RGF0ZSA9IHJlcXVpcmUoJy4vZm9ybWF0RGF0ZScpO1xyXG5cclxuLy8gUmUtZXhwb3J0aW5nOlxyXG5leHBvcnRzLmZvcm1hdERhdGUgPSBmb3JtYXREYXRlO1xyXG5leHBvcnRzLmRhdGUgPSBkYXRlVXRpbHM7XHJcblxyXG4vKi0tLS0tLSBDT05TVEFOVFMgLS0tLS0tLS0tKi9cclxudmFyIHN0YXR1c1R5cGVzID0gZXhwb3J0cy5zdGF0dXNUeXBlcyA9IFsndW5hdmFpbGFibGUnLCAnYXZhaWxhYmxlJ107XHJcbi8vIFdlZWsgZGF5cyBuYW1lcyBpbiBlbmdsaXNoIGZvciBpbnRlcm5hbCBzeXN0ZW1cclxuLy8gdXNlOyBOT1QgZm9yIGxvY2FsaXphdGlvbi90cmFuc2xhdGlvbi5cclxudmFyIHN5c3RlbVdlZWtEYXlzID0gZXhwb3J0cy5zeXN0ZW1XZWVrRGF5cyA9IFtcclxuICAnc3VuZGF5JyxcclxuICAnbW9uZGF5JyxcclxuICAndHVlc2RheScsXHJcbiAgJ3dlZG5lc2RheScsXHJcbiAgJ3RodXJzZGF5JyxcclxuICAnZnJpZGF5JyxcclxuICAnc2F0dXJkYXknXHJcbl07XHJcblxyXG4vKi0tLS0tLS0tLSBDT05GSUcgLSBJTlNUQU5DRSAtLS0tLS0tLS0tKi9cclxudmFyIHdlZWtseUNsYXNzZXMgPSBleHBvcnRzLndlZWtseUNsYXNzZXMgPSB7XHJcbiAgY2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhcicsXHJcbiAgd2Vla2x5Q2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci0td2Vla2x5JyxcclxuICBjdXJyZW50V2VlazogJ2lzLWN1cnJlbnRXZWVrJyxcclxuICBhY3Rpb25zOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItYWN0aW9ucycsXHJcbiAgcHJldkFjdGlvbjogJ0FjdGlvbnMtcHJldicsXHJcbiAgbmV4dEFjdGlvbjogJ0FjdGlvbnMtbmV4dCcsXHJcbiAgZGF5czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWRheXMnLFxyXG4gIHNsb3RzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc2xvdHMnLFxyXG4gIHNsb3RIb3VyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItaG91cicsXHJcbiAgc2xvdFN0YXR1c1ByZWZpeDogJ2lzLScsXHJcbiAgbGVnZW5kOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kJyxcclxuICBsZWdlbmRBdmFpbGFibGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQtYXZhaWxhYmxlJyxcclxuICBsZWdlbmRVbmF2YWlsYWJsZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZC11bmF2YWlsYWJsZScsXHJcbiAgc3RhdHVzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc3RhdHVzJyxcclxuICBlcnJvck1lc3NhZ2U6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1lcnJvck1lc3NhZ2UnXHJcbn07XHJcblxyXG52YXIgd2Vla2x5VGV4dHMgPSBleHBvcnRzLndlZWtseVRleHRzID0ge1xyXG4gIGFiYnJXZWVrRGF5czogW1xyXG4gICAgJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCdcclxuICBdLFxyXG4gIHRvZGF5OiAnVG9kYXknLFxyXG4gIC8vIEFsbG93ZWQgc3BlY2lhbCB2YWx1ZXM6IE06bW9udGgsIEQ6ZGF5XHJcbiAgYWJickRhdGVGb3JtYXQ6ICdNL0QnXHJcbn07XHJcblxyXG4vKi0tLS0tLS0tLS0tIFZJRVcgVVRJTFMgLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5mdW5jdGlvbiBoYW5kbGVyQ2FsZW5kYXJFcnJvcihlcnIpIHtcclxuICB2YXIgbXNnID0gJyc7XHJcbiAgaWYgKGVyciAmJiBlcnIubWVzc2FnZSlcclxuICAgIG1zZyA9IGVyci5tZXNzYWdlO1xyXG4gIGVsc2UgaWYgKGVyciAmJiBlcnIuZXhjZXB0aW9uICYmIGVyci5leGNlcHRpb24ubWVzc2FnZSlcclxuICAgIG1zZyA9IGVyci5leGNlcHRpb24ubWVzc2FnZTtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzLmNvbXBvbmVudDtcclxuICB2YXIgbXNnQ29udGFpbmVyID0gdGhhdC4kZWwuZmluZCgnLicgKyB0aGF0LmNsYXNzZXMuZXJyb3JNZXNzYWdlKTtcclxuXHJcbiAgaWYgKG1zZykgbXNnID0gKG1zZ0NvbnRhaW5lci5kYXRhKCdtZXNzYWdlLXByZWZpeCcpIHx8ICcnKSArIG1zZztcclxuXHJcbiAgbXNnQ29udGFpbmVyLnRleHQobXNnKTtcclxufVxyXG5leHBvcnRzLmhhbmRsZXJDYWxlbmRhckVycm9yID0gaGFuZGxlckNhbGVuZGFyRXJyb3I7XHJcblxyXG5mdW5jdGlvbiBtb3ZlQmluZFJhbmdlSW5EYXlzKHdlZWtseSwgZGF5cykge1xyXG4gIHZhciBcclxuICAgIHN0YXJ0ID0gZGF0ZVV0aWxzLmFkZERheXMod2Vla2x5LmRhdGVzUmFuZ2Uuc3RhcnQsIGRheXMpLFxyXG4gICAgZW5kID0gZGF0ZVV0aWxzLmFkZERheXMod2Vla2x5LmRhdGVzUmFuZ2UuZW5kLCBkYXlzKSxcclxuICAgIGRhdGVzUmFuZ2UgPSBkYXRlc1RvUmFuZ2Uoc3RhcnQsIGVuZCk7XHJcblxyXG4gIC8vIENoZWNrIGNhY2hlIGJlZm9yZSB0cnkgdG8gZmV0Y2hcclxuICB2YXIgaW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuXHJcbiAgaWYgKGluQ2FjaGUpIHtcclxuICAgIC8vIEp1c3Qgc2hvdyB0aGUgZGF0YVxyXG4gICAgd2Vla2x5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgLy8gUHJlZmV0Y2ggZXhjZXB0IGlmIHRoZXJlIGlzIG90aGVyIHJlcXVlc3QgaW4gY291cnNlIChjYW4gYmUgdGhlIHNhbWUgcHJlZmV0Y2gsXHJcbiAgICAvLyBidXQgc3RpbGwgZG9uJ3Qgb3ZlcmxvYWQgdGhlIHNlcnZlcilcclxuICAgIGlmICh3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBmb3IgcHJlZmV0Y2hpbmc6XHJcbiAgICAvLyBJdHMgYXZvaWRlZCBpZiB0aGVyZSBhcmUgcmVxdWVzdHMgaW4gY291cnNlLCBzaW5jZVxyXG4gICAgLy8gdGhhdCB3aWxsIGJlIGEgcHJlZmV0Y2ggZm9yIHRoZSBzYW1lIGRhdGEuXHJcbiAgICBpZiAod2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHtcclxuICAgICAgLy8gVGhlIGxhc3QgcmVxdWVzdCBpbiB0aGUgcG9vbCAqbXVzdCogYmUgdGhlIGxhc3QgaW4gZmluaXNoXHJcbiAgICAgIC8vIChtdXN0IGJlIG9ubHkgb25lIGlmIGFsbCBnb2VzIGZpbmUpOlxyXG4gICAgICB2YXIgcmVxdWVzdCA9IHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHNbd2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgIC8vIFdhaXQgZm9yIHRoZSBmZXRjaCB0byBwZXJmb3JtIGFuZCBzZXRzIGxvYWRpbmcgdG8gbm90aWZ5IHVzZXJcclxuICAgICAgd2Vla2x5LiRlbC5hZGRDbGFzcyh3ZWVrbHkuY2xhc3Nlcy5mZXRjaGluZyk7XHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgbW92ZUJpbmRSYW5nZUluRGF5cyh3ZWVrbHksIGRheXMpO1xyXG4gICAgICAgIHdlZWtseS4kZWwucmVtb3ZlQ2xhc3Mod2Vla2x5LmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgd2Vla2x5XHJcbiAgICAuZmV0Y2hEYXRhKGRhdGVzVG9RdWVyeShkYXRlc1JhbmdlKSlcclxuICAgIC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgd2Vla2x5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgICAvLyBQcmVmZXRjaFxyXG4gICAgICB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuZXhwb3J0cy5tb3ZlQmluZFJhbmdlSW5EYXlzID0gbW92ZUJpbmRSYW5nZUluRGF5cztcclxuXHJcbmZ1bmN0aW9uIHdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF3ZWVrbHkuZGF0YSB8fCAhd2Vla2x5LmRhdGEuc2xvdHMpIHJldHVybiBmYWxzZTtcclxuICAvLyBDaGVjayBjYWNoZTogaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBkYXRlIGluIHRoZSByYW5nZVxyXG4gIC8vIHdpdGhvdXQgZGF0YSwgd2Ugc2V0IGluQ2FjaGUgYXMgZmFsc2UgYW5kIGZldGNoIHRoZSBkYXRhOlxyXG4gIHZhciBpbkNhY2hlID0gdHJ1ZTtcclxuICBkYXRlVXRpbHMuZWFjaERhdGVJblJhbmdlKGRhdGVzUmFuZ2Uuc3RhcnQsIGRhdGVzUmFuZ2UuZW5kLCBmdW5jdGlvbiAoZGF0ZSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIGlmICghd2Vla2x5LmRhdGEuc2xvdHNbZGF0ZWtleV0pIHtcclxuICAgICAgaW5DYWNoZSA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGluQ2FjaGU7XHJcbn1cclxuZXhwb3J0cy53ZWVrbHlJc0RhdGFJbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZTtcclxuXHJcbi8qKlxyXG4gIEZvciBub3csIGdpdmVuIHRoZSBKU09OIHN0cnVjdHVyZSB1c2VkLCB0aGUgbG9naWNcclxuICBvZiBtb250aGx5SXNEYXRhSW5DYWNoZSBpcyB0aGUgc2FtZSBhcyB3ZWVrbHlJc0RhdGFJbkNhY2hlOlxyXG4qKi9cclxudmFyIG1vbnRobHlJc0RhdGFJbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZTtcclxuZXhwb3J0cy5tb250aGx5SXNEYXRhSW5DYWNoZSA9IG1vbnRobHlJc0RhdGFJbkNhY2hlO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBjdXJyZW50RGF0ZXNSYW5nZSkge1xyXG4gIHZhciBuZXh0RGF0ZXNSYW5nZSA9IGRhdGVzVG9SYW5nZShcclxuICAgIGRhdGVVdGlscy5hZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLnN0YXJ0LCA3KSxcclxuICAgIGRhdGVVdGlscy5hZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLmVuZCwgNylcclxuICApO1xyXG5cclxuICBpZiAoIXdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBuZXh0RGF0ZXNSYW5nZSkpIHtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgd2VlayBpbiBhZHZhbmNlXHJcbiAgICB2YXIgcHJlZmV0Y2hRdWVyeSA9IGRhdGVzVG9RdWVyeShuZXh0RGF0ZXNSYW5nZSk7XHJcbiAgICB3ZWVrbHkuZmV0Y2hEYXRhKHByZWZldGNoUXVlcnksIG51bGwsIHRydWUpO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2ggPSB3ZWVrbHlDaGVja0FuZFByZWZldGNoO1xyXG5cclxuLyoqIFVwZGF0ZSB0aGUgdmlldyBsYWJlbHMgZm9yIHRoZSB3ZWVrLWRheXMgKHRhYmxlIGhlYWRlcnMpXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVMYWJlbHMoZGF0ZXNSYW5nZSwgY2FsZW5kYXIsIG9wdGlvbnMpIHtcclxuICB2YXIgc3RhcnQgPSBkYXRlc1JhbmdlLnN0YXJ0LFxyXG4gICAgICBlbmQgPSBkYXRlc1JhbmdlLmVuZDtcclxuXHJcbiAgdmFyIGRheXMgPSBjYWxlbmRhci5maW5kKCcuJyArIG9wdGlvbnMuY2xhc3Nlcy5kYXlzICsgJyB0aCcpO1xyXG4gIHZhciB0b2RheSA9IGRhdGVJU08uZGF0ZUxvY2FsKG5ldyBEYXRlKCkpO1xyXG4gIC8vIEZpcnN0IGNlbGwgaXMgZW1wdHkgKCd0aGUgY3Jvc3MgaGVhZGVycyBjZWxsJyksIHRoZW4gb2Zmc2V0IGlzIDFcclxuICB2YXIgb2Zmc2V0ID0gMTtcclxuICBkYXRlVXRpbHMuZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICB2YXIgY2VsbCA9ICQoZGF5cy5nZXQob2Zmc2V0ICsgaSkpLFxyXG4gICAgICAgIHNkYXRlID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSksXHJcbiAgICAgICAgbGFiZWwgPSBzZGF0ZTtcclxuXHJcbiAgICBpZiAodG9kYXkgPT0gc2RhdGUpXHJcbiAgICAgIGxhYmVsID0gb3B0aW9ucy50ZXh0cy50b2RheTtcclxuICAgIGVsc2VcclxuICAgICAgbGFiZWwgPSBvcHRpb25zLnRleHRzLmFiYnJXZWVrRGF5c1tkYXRlLmdldERheSgpXSArICcgJyArIGZvcm1hdERhdGUoZGF0ZSwgb3B0aW9ucy50ZXh0cy5hYmJyRGF0ZUZvcm1hdCk7XHJcblxyXG4gICAgY2VsbC50ZXh0KGxhYmVsKTtcclxuICB9KTtcclxufVxyXG5leHBvcnRzLnVwZGF0ZUxhYmVscyA9IHVwZGF0ZUxhYmVscztcclxuXHJcbmZ1bmN0aW9uIGZpbmRDZWxsQnlTbG90KHNsb3RzQ29udGFpbmVyLCBkYXksIHNsb3QpIHtcclxuICBzbG90ID0gZGF0ZUlTTy5wYXJzZShzbG90KTtcclxuICB2YXIgXHJcbiAgICB4ID0gTWF0aC5yb3VuZChzbG90LmdldEhvdXJzKCkpLFxyXG4gIC8vIFRpbWUgZnJhbWVzIChzbG90cykgYXJlIDE1IG1pbnV0ZXMgZGl2aXNpb25zXHJcbiAgICB5ID0gTWF0aC5yb3VuZChzbG90LmdldE1pbnV0ZXMoKSAvIDE1KSxcclxuICAgIHRyID0gc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJzplcSgnICsgTWF0aC5yb3VuZCh4ICogNCArIHkpICsgJyknKTtcclxuXHJcbiAgLy8gU2xvdCBjZWxsIGZvciBvJ2Nsb2NrIGhvdXJzIGlzIGF0IDEgcG9zaXRpb24gb2Zmc2V0XHJcbiAgLy8gYmVjYXVzZSBvZiB0aGUgcm93LWhlYWQgY2VsbFxyXG4gIHZhciBkYXlPZmZzZXQgPSAoeSA9PT0gMCA/IGRheSArIDEgOiBkYXkpO1xyXG4gIHJldHVybiB0ci5jaGlsZHJlbignOmVxKCcgKyBkYXlPZmZzZXQgKyAnKScpO1xyXG59XHJcbmV4cG9ydHMuZmluZENlbGxCeVNsb3QgPSBmaW5kQ2VsbEJ5U2xvdDtcclxuXHJcbmZ1bmN0aW9uIGZpbmRTbG90QnlDZWxsKHNsb3RzQ29udGFpbmVyLCBjZWxsKSB7XHJcbiAgdmFyIFxyXG4gICAgeCA9IGNlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGNlbGwpLFxyXG4gICAgeSA9IGNlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpLFxyXG4gICAgZnVsbE1pbnV0ZXMgPSB5ICogMTUsXHJcbiAgICBob3VycyA9IE1hdGguZmxvb3IoZnVsbE1pbnV0ZXMgLyA2MCksXHJcbiAgICBtaW51dGVzID0gZnVsbE1pbnV0ZXMgLSAoaG91cnMgKiA2MCksXHJcbiAgICBzbG90ID0gbmV3IERhdGUoKTtcclxuICBzbG90LnNldEhvdXJzKGhvdXJzLCBtaW51dGVzLCAwLCAwKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGRheTogeCxcclxuICAgIHNsb3Q6IHNsb3RcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuZmluZFNsb3RCeUNlbGwgPSBmaW5kU2xvdEJ5Q2VsbDtcclxuXHJcbi8qKlxyXG5NYXJrIGNhbGVuZGFyIGFzIGN1cnJlbnQtd2VlayBhbmQgZGlzYWJsZSBwcmV2IGJ1dHRvbixcclxub3IgcmVtb3ZlIHRoZSBtYXJrIGFuZCBlbmFibGUgaXQgaWYgaXMgbm90LlxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50V2VlayhjYWxlbmRhciwgZGF0ZSwgb3B0aW9ucykge1xyXG4gIHZhciB5ZXAgPSBkYXRlVXRpbHMuaXNJbkN1cnJlbnRXZWVrKGRhdGUpO1xyXG4gIGNhbGVuZGFyLnRvZ2dsZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy5jdXJyZW50V2VlaywgeWVwKTtcclxuICBjYWxlbmRhci5maW5kKCcuJyArIG9wdGlvbnMuY2xhc3Nlcy5wcmV2QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcbn1cclxuZXhwb3J0cy5jaGVja0N1cnJlbnRXZWVrID0gY2hlY2tDdXJyZW50V2VlaztcclxuXHJcbi8qKiBHZXQgcXVlcnkgb2JqZWN0IHdpdGggdGhlIGRhdGUgcmFuZ2Ugc3BlY2lmaWVkOlxyXG4qKi9cclxuZnVuY3Rpb24gZGF0ZXNUb1F1ZXJ5KHN0YXJ0LCBlbmQpIHtcclxuICAvLyBVbmlxdWUgcGFyYW0gd2l0aCBib3RoIHByb3BpZXJ0aWVzOlxyXG4gIGlmIChzdGFydC5lbmQpIHtcclxuICAgIGVuZCA9IHN0YXJ0LmVuZDtcclxuICAgIHN0YXJ0ID0gc3RhcnQuc3RhcnQ7XHJcbiAgfVxyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZGF0ZUlTTy5kYXRlTG9jYWwoc3RhcnQsIHRydWUpLFxyXG4gICAgZW5kOiBkYXRlSVNPLmRhdGVMb2NhbChlbmQsIHRydWUpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmRhdGVzVG9RdWVyeSA9IGRhdGVzVG9RdWVyeTtcclxuXHJcbi8qKiBQYWNrIHR3byBkYXRlcyBpbiBhIHNpbXBsZSBidXQgdXNlZnVsXHJcbnN0cnVjdHVyZSB7IHN0YXJ0LCBlbmQgfVxyXG4qKi9cclxuZnVuY3Rpb24gZGF0ZXNUb1JhbmdlKHN0YXJ0LCBlbmQpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IHN0YXJ0LFxyXG4gICAgZW5kOiBlbmRcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuZGF0ZXNUb1JhbmdlID0gZGF0ZXNUb1JhbmdlO1xyXG4iLCIvKipcclxuICAgIFNtYWxsIHV0aWxpdHkgdG8gd3JhcCBhIGNhbGxiYWNrL2hhbmRsZXIgZnVuY3Rpb24gaW4gYSB0aW1lclxyXG4gICAgYmVpbmcgZXhlY3V0ZWQgb25seSBvbmNlICh0aGUgbGF0ZXN0IGNhbGwpIGluc2lkZSB0aGUgdGltZWZyYW1lLFxyXG4gICAgZGVmaW5lZCBieSB0aGUgaW50ZXJ2YWwgcGFyYW1ldGVyLCBpdHMganVzdCAxIG1pbGlzZWNvbmQgYnkgZGVmYXVsdC5cclxuICAgIEl0cyB1c2VmdWwgd2hlbiBhbiBldmVudCBnZXRzIGV4ZWN1dGVkXHJcbiAgICBsb3RzIG9mIHRpbWVzIHRvbyBxdWlja2x5IGFuZCBvbmx5IDEgZXhlY3V0aW9uIGlzIHdhbnRlZCB0byBhdm9pZFxyXG4gICAgaHVydCBwZXJmb3JtYW5jZS5cclxuICAgIFRoZSBkZWZhdWx0IGludGVydmFsIG9mIDEgd29ya3MgZmluZSBpZiB0aGUgZXZlbnQgZ2V0cyByYWlzZWRcclxuICAgIGEgbG90IGJ5IGNvbnNlY3V0aXZlIGNvZGUsIGJ1dCBpZiBjYWxscyBhcmUgZGVsYXllZCBhIGdyZWF0ZXJcclxuICAgIGludGVydmFsIHdpbGwgYmUgbmVlZC5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmF0Y2hFdmVudEhhbmRsZXIoY2IsIGludGVydmFsKSB7XHJcbiAgICB2YXIgdGltZXI7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xyXG4gICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfSwgaW50ZXJ2YWwgfHwgMSk7XHJcbiAgICB9O1xyXG59OyIsIi8qIEdlbmVyaWMgYmxvY2tVSSBvcHRpb25zIHNldHMgKi9cclxudmFyIGxvYWRpbmdCbG9jayA9IHsgbWVzc2FnZTogJzxpbWcgd2lkdGg9XCI0OHB4XCIgaGVpZ2h0PVwiNDhweFwiIGNsYXNzPVwibG9hZGluZy1pbmRpY2F0b3JcIiBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyB9O1xyXG52YXIgZXJyb3JCbG9jayA9IGZ1bmN0aW9uIChlcnJvciwgcmVsb2FkLCBzdHlsZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjc3M6ICQuZXh0ZW5kKHsgY3Vyc29yOiAnZGVmYXVsdCcgfSwgc3R5bGUgfHwge30pLFxyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj5UaGVyZSB3YXMgYW4gZXJyb3InICtcclxuICAgICAgICAgICAgKGVycm9yID8gJzogJyArIGVycm9yIDogJycpICtcclxuICAgICAgICAgICAgKHJlbG9hZCA/ICcgPGEgaHJlZj1cImphdmFzY3JpcHQ6ICcgKyByZWxvYWQgKyAnO1wiPkNsaWNrIHRvIHJlbG9hZDwvYT4nIDogJycpICtcclxuICAgICAgICAgICAgJzwvZGl2PidcclxuICAgIH07XHJcbn07XHJcbnZhciBpbmZvQmxvY2sgPSBmdW5jdGlvbiAobWVzc2FnZSwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuICQuZXh0ZW5kKHtcclxuICAgICAgICBtZXNzYWdlOiAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPjxkaXYgY2xhc3M9XCJpbmZvXCI+JyArIG1lc3NhZ2UgKyAnPC9kaXY+J1xyXG4gICAgICAgIC8qLGNzczogeyBjdXJzb3I6ICdkZWZhdWx0JyB9Ki9cclxuICAgICAgICAsIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGU6XHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgbG9hZGluZzogbG9hZGluZ0Jsb2NrLFxyXG4gICAgICAgIGVycm9yOiBlcnJvckJsb2NrLFxyXG4gICAgICAgIGluZm86IGluZm9CbG9ja1xyXG4gICAgfTtcclxufSIsIi8qPSBDaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzXHJcbiogdG8gbm90aWZ5IHVzZXIgYWJvdXQgY2hhbmdlcyBpbiBmb3JtcyxcclxuKiB0YWJzLCB0aGF0IHdpbGwgYmUgbG9zdCBpZiBnbyBhd2F5IGZyb21cclxuKiB0aGUgcGFnZS4gSXQga25vd3Mgd2hlbiBhIGZvcm0gaXMgc3VibWl0dGVkXHJcbiogYW5kIHNhdmVkIHRvIGRpc2FibGUgbm90aWZpY2F0aW9uLCBhbmQgZ2l2ZXNcclxuKiBtZXRob2RzIGZvciBvdGhlciBzY3JpcHRzIHRvIG5vdGlmeSBjaGFuZ2VzXHJcbiogb3Igc2F2aW5nLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZ2V0WFBhdGggPSByZXF1aXJlKCcuL2dldFhQYXRoJyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHtcclxuICAgIGNoYW5nZXNMaXN0OiB7fSxcclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBudWxsLFxyXG4gICAgICAgIGdlbmVyaWNDaGFuZ2VTdXBwb3J0OiB0cnVlLFxyXG4gICAgICAgIGdlbmVyaWNTdWJtaXRTdXBwb3J0OiBmYWxzZSxcclxuICAgICAgICBjaGFuZ2VkRm9ybUNsYXNzOiAnaGFzLWNoYW5nZXMnLFxyXG4gICAgICAgIGNoYW5nZWRFbGVtZW50Q2xhc3M6ICdjaGFuZ2VkJyxcclxuICAgICAgICBub3RpZnlDbGFzczogJ25vdGlmeS1jaGFuZ2VzJ1xyXG4gICAgfSxcclxuICAgIGluaXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gVXNlciBub3RpZmljYXRpb24gdG8gcHJldmVudCBsb3N0IGNoYW5nZXMgZG9uZVxyXG4gICAgICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hhbmdlc05vdGlmaWNhdGlvbi5ub3RpZnkoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQodGhpcy5kZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKCFvcHRpb25zLnRhcmdldClcclxuICAgICAgICAgICAgb3B0aW9ucy50YXJnZXQgPSBkb2N1bWVudDtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljQ2hhbmdlU3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ2NoYW5nZScsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpIDppbnB1dFtuYW1lXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoJCh0aGlzKS5jbG9zZXN0KCdmb3JtJykuZ2V0KDApLCB0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY1N1Ym1pdFN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdzdWJtaXQnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBBZGQgbm90aWZpY2F0aW9uIGNsYXNzIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLm5vdGlmeUNsYXNzKTtcclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGNoYW5nZSBpbiB0aGUgcHJvcGVydHkgbGlzdCByZXR1cm5pbmcgdGhlIG1lc3NhZ2U6XHJcbiAgICAgICAgZm9yICh2YXIgYyBpbiB0aGlzLmNoYW5nZXNMaXN0KVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWl0TWVzc2FnZSB8fCAodGhpcy5xdWl0TWVzc2FnZSA9ICQoJyNsY3Jlcy1xdWl0LXdpdGhvdXQtc2F2ZScpLnRleHQoKSkgfHwgJyc7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJDaGFuZ2U6IGZ1bmN0aW9uIChmLCBlKSB7XHJcbiAgICAgICAgaWYgKCFlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgdmFyIGZsID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSB8fCBbXTtcclxuICAgICAgICBpZiAoJC5pc0FycmF5KGUpKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZS5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJDaGFuZ2UoZiwgZVtpXSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG4gPSBlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgKGUpICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBuID0gZS5uYW1lO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiByZWFsbHkgdGhlcmUgd2FzIGEgY2hhbmdlIGNoZWNraW5nIGRlZmF1bHQgZWxlbWVudCB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChlLmRlZmF1bHRWYWx1ZSkgIT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5jaGVja2VkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLnNlbGVjdGVkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgZS52YWx1ZSA9PSBlLmRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlcmUgd2FzIG5vIGNoYW5nZSwgbm8gY29udGludWVcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBtYXliZSBpcyBhIHJlZ3Jlc3Npb24gZnJvbSBhIGNoYW5nZSBhbmQgbm93IHRoZSBvcmlnaW5hbCB2YWx1ZSBhZ2FpblxyXG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIHJlbW92ZSBmcm9tIGNoYW5nZXMgbGlzdCBkb2luZyByZWdpc3RlclNhdmVcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJTYXZlKGYsIFtuXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJChlKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIShuIGluIGZsKSlcclxuICAgICAgICAgICAgZmwucHVzaChuKTtcclxuICAgICAgICAkKGYpXHJcbiAgICAgICAgLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcylcclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnQgbmFtZSBjaGFuZ2VkLCBmb3JtIGVsZW1lbnQgY2hhbmdlZCAodGhpcyBjYW4gYmUgbnVsbClcclxuICAgICAgICAudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIFtmLCBuLCBlXSk7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJTYXZlOiBmdW5jdGlvbiAoZiwgZWxzKSB7XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSkgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgcHJldkVscyA9ICQuZXh0ZW5kKFtdLCB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSk7XHJcblxyXG4gICAgICAgIC8vICdlbHMnIChmaWx0ZXJlZCBmb3JtIGVsZW1lbnRzIGxpc3QpIGNhbiBiZSBhbiBhcnJheSBvZiBmaWVsZCAnbmFtZSdzIG9yIGFuIGFycmF5IG9mIERPTSBlbGVtZW50cyAob3IgbWl4ZWQpXHJcbiAgICAgICAgLy8gaXRzIGNvbnZlcnRlZCB0byBhbiBhcnJheSBvZiAnbmFtZSdzIGFueXdheTpcclxuICAgICAgICBpZiAoZWxzKSB7XHJcbiAgICAgICAgICAgIGVscyA9ICQubWFwKGVscywgZnVuY3Rpb24gKGVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHR5cGVvZiAoZWwpID09PSAnc3RyaW5nJyA/IGVsIDogZWwubmFtZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdG8tcmVtb3ZlIGZvcm0gbGlzdCBmbGFnOiBieSBkZWZhdWx0IHRydWUsIHNpbmNlIHdoZW4gbm8gZWxzIGxpc3Qgc2luY2UgaXMgYWxsIHRoZSBmb3JtIHNhdmVkXHJcbiAgICAgICAgdmFyIHIgPSB0cnVlO1xyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSAkLmdyZXAodGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0sIGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gKCQuaW5BcnJheShlbCwgZWxzKSA9PSAtMSk7IH0pO1xyXG4gICAgICAgICAgICAvLyBEb24ndCByZW1vdmUgJ2YnIGxpc3QgaWYgaXMgbm90IGVtcHR5XHJcbiAgICAgICAgICAgIHIgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXS5sZW5ndGggPT09IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgICAkKGYpLnJlbW92ZUNsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcyk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudHMgcmVnaXN0ZXJlZCBhcyBzYXZlICh0aGlzIGNhbiBiZSBudWxsKSwgYW5kICdmb3JtIGZ1bGx5IHNhdmVkJyBhcyB0aGlyZCBwYXJhbSAoYm9vbClcclxuICAgICAgICAkKGYpLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgW2YsIGVscyB8fCBwcmV2RWxzLCByXSk7XHJcbiAgICAgICAgdmFyIGxjaG4gPSB0aGlzO1xyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgJC5lYWNoKGVscywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCgnW25hbWU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSh0aGlzKSArICdcIl0nKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGxjaG4uZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcHJldkVscztcclxuICAgIH1cclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gY2hhbmdlc05vdGlmaWNhdGlvbjtcclxufSIsIi8qIFV0aWxpdHkgdG8gY3JlYXRlIGlmcmFtZSB3aXRoIGluamVjdGVkIGh0bWwvY29udGVudCBpbnN0ZWFkIG9mIFVSTC5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlSWZyYW1lKGNvbnRlbnQsIHNpemUpIHtcclxuICAgIHZhciAkaWZyYW1lID0gJCgnPGlmcmFtZSB3aWR0aD1cIicgKyBzaXplLndpZHRoICsgJ1wiIGhlaWdodD1cIicgKyBzaXplLmhlaWdodCArICdcIiBzdHlsZT1cImJvcmRlcjpub25lO1wiPjwvaWZyYW1lPicpO1xyXG4gICAgdmFyIGlmcmFtZSA9ICRpZnJhbWUuZ2V0KDApO1xyXG4gICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIHJlYWR5XHJcbiAgICB2YXIgaWZyYW1lbG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZnJhbWUub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIFVzaW5nIGlmcmFtZWxvYWRlZCB0byBhdm9pZCBpbmZpbml0ZSBsb29wc1xyXG4gICAgICAgIGlmICghaWZyYW1lbG9hZGVkKSB7XHJcbiAgICAgICAgICAgIGlmcmFtZWxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBjb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuICRpZnJhbWU7XHJcbn07XHJcblxyXG4vKiBQdXRzIGZ1bGwgaHRtbCBpbnNpZGUgdGhlIGlmcmFtZSBlbGVtZW50IHBhc3NlZCBpbiBhIHNlY3VyZSBhbmQgY29tcGxpYW50IG1vZGUgKi9cclxuZnVuY3Rpb24gaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGh0bWwpIHtcclxuICAgIC8vIHB1dCBhamF4IGRhdGEgaW5zaWRlIGlmcmFtZSByZXBsYWNpbmcgYWxsIHRoZWlyIGh0bWwgaW4gc2VjdXJlIFxyXG4gICAgLy8gY29tcGxpYW50IG1vZGUgKCQuaHRtbCBkb24ndCB3b3JrcyB0byBpbmplY3QgPGh0bWw+PGhlYWQ+IGNvbnRlbnQpXHJcblxyXG4gICAgLyogZG9jdW1lbnQgQVBJIHZlcnNpb24gKHByb2JsZW1zIHdpdGggSUUsIGRvbid0IGV4ZWN1dGUgaWZyYW1lLWh0bWwgc2NyaXB0cykgKi9cclxuICAgIC8qdmFyIGlmcmFtZURvYyA9XHJcbiAgICAvLyBXM0MgY29tcGxpYW50OiBucywgZmlyZWZveC1nZWNrbywgY2hyb21lL3NhZmFyaS13ZWJraXQsIG9wZXJhLCBpZTlcclxuICAgIGlmcmFtZS5jb250ZW50RG9jdW1lbnQgfHxcclxuICAgIC8vIG9sZCBJRSAoNS41KylcclxuICAgIChpZnJhbWUuY29udGVudFdpbmRvdyA/IGlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50IDogbnVsbCkgfHxcclxuICAgIC8vIGZhbGxiYWNrICh2ZXJ5IG9sZCBJRT8pXHJcbiAgICBkb2N1bWVudC5mcmFtZXNbaWZyYW1lLmlkXS5kb2N1bWVudDtcclxuICAgIGlmcmFtZURvYy5vcGVuKCk7XHJcbiAgICBpZnJhbWVEb2Mud3JpdGUoaHRtbCk7XHJcbiAgICBpZnJhbWVEb2MuY2xvc2UoKTsqL1xyXG5cclxuICAgIC8qIGphdmFzY3JpcHQgVVJJIHZlcnNpb24gKHdvcmtzIGZpbmUgZXZlcnl3aGVyZSEpICovXHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdy5jb250ZW50cyA9IGh0bWw7XHJcbiAgICBpZnJhbWUuc3JjID0gJ2phdmFzY3JpcHQ6d2luZG93W1wiY29udGVudHNcIl0nO1xyXG5cclxuICAgIC8vIEFib3V0IHRoaXMgdGVjaG5pcXVlLCB0aGlzIGh0dHA6Ly9zcGFyZWN5Y2xlcy53b3JkcHJlc3MuY29tLzIwMTIvMDMvMDgvaW5qZWN0LWNvbnRlbnQtaW50by1hLW5ldy1pZnJhbWUvXHJcbn1cclxuXHJcbiIsIi8qIENSVURMIEhlbHBlciAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcbnZhciBnZXRUZXh0ID0gcmVxdWlyZSgnLi9nZXRUZXh0Jyk7XHJcbnZhciBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxuXHJcbmV4cG9ydHMuZGVmYXVsdFNldHRpbmdzID0ge1xyXG4gIGVmZmVjdHM6IHtcclxuICAgICdzaG93LXZpZXdlcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LFxyXG4gICAgJ2hpZGUtdmlld2VyJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sXHJcbiAgICAnc2hvdy1lZGl0b3InOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSwgLy8gdGhlIHNhbWUgYXMganF1ZXJ5LXVpIHsgZWZmZWN0OiAnc2xpZGUnLCBkdXJhdGlvbjogJ3Nsb3cnLCBkaXJlY3Rpb246ICdkb3duJyB9XHJcbiAgICAnaGlkZS1lZGl0b3InOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfVxyXG4gIH0sXHJcbiAgZXZlbnRzOiB7XHJcbiAgICAnZWRpdC1lbmRzJzogJ2NydWRsLWVkaXQtZW5kcycsXHJcbiAgICAnZWRpdC1zdGFydHMnOiAnY3J1ZGwtZWRpdC1zdGFydHMnLFxyXG4gICAgJ2VkaXRvci1yZWFkeSc6ICdjcnVkbC1lZGl0b3ItcmVhZHknLFxyXG4gICAgJ2VkaXRvci1zaG93ZWQnOiAnY3J1ZGwtZWRpdG9yLXNob3dlZCcsXHJcbiAgICAnY3JlYXRlJzogJ2NydWRsLWNyZWF0ZScsXHJcbiAgICAndXBkYXRlJzogJ2NydWRsLXVwZGF0ZScsXHJcbiAgICAnZGVsZXRlJzogJ2NydWRsLWRlbGV0ZSdcclxuICB9LFxyXG4gIGRhdGE6IHtcclxuICAgICdmb2N1cy1jbG9zZXN0Jzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtY2xvc2VzdCcsXHJcbiAgICAgICdkZWZhdWx0JzogJyonXHJcbiAgICB9LFxyXG4gICAgJ2ZvY3VzLW1hcmdpbic6IHtcclxuICAgICAgbmFtZTogJ2NydWRsLWZvY3VzLW1hcmdpbicsXHJcbiAgICAgICdkZWZhdWx0JzogMFxyXG4gICAgfSxcclxuICAgICdmb2N1cy1kdXJhdGlvbic6IHtcclxuICAgICAgbmFtZTogJ2NydWRsLWZvY3VzLWR1cmF0aW9uJyxcclxuICAgICAgJ2RlZmF1bHQnOiAyMDBcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICBVdGlsaXR5IHRvIGdldCBhIGRhdGEgdmFsdWUgb3IgdGhlIGRlZmF1bHQgYmFzZWQgb24gdGhlIGluc3RhbmNlXHJcbiAgc2V0dGluZ3Mgb24gdGhlIGdpdmVuIGVsZW1lbnRcclxuKiovXHJcbmZ1bmN0aW9uIGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgZWwsIHNldHRpbmdOYW1lKSB7XHJcbiAgdmFyXHJcbiAgICBzZXR0aW5nID0gaW5zdGFuY2Uuc2V0dGluZ3MuZGF0YVtzZXR0aW5nTmFtZV0sXHJcbiAgICB2YWwgPSBlbC5kYXRhKHNldHRpbmcubmFtZSkgfHwgc2V0dGluZ1snZGVmYXVsdCddO1xyXG4gIHJldHVybiB2YWw7XHJcbn1cclxuXHJcbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiBzZXR1cENydWRsKG9uU3VjY2Vzcywgb25FcnJvciwgb25Db21wbGV0ZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICBvbjogZnVuY3Rpb24gb24oc2VsZWN0b3IsIHNldHRpbmdzKSB7XHJcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgJy5jcnVkbCc7XHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IHtcclxuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXHJcbiAgICAgICAgZWxlbWVudHM6ICQoc2VsZWN0b3IpXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIEV4dGVuZGluZyBkZWZhdWx0IHNldHRpbmdzIHdpdGggcHJvdmlkZWQgb25lcyxcclxuICAgICAgLy8gYnV0IHNvbWUgY2FuIGJlIHR3ZWFrIG91dHNpZGUgdG9vLlxyXG4gICAgICBpbnN0YW5jZS5zZXR0aW5ncyA9ICQuZXh0ZW5kKHRydWUsIGV4cG9ydHMuZGVmYXVsdFNldHRpbmdzLCBzZXR0aW5ncyk7XHJcbiAgICAgIGluc3RhbmNlLmVsZW1lbnRzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjcnVkbCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKGNydWRsLmRhdGEoJ19fY3J1ZGxfaW5pdGlhbGl6ZWRfXycpID09PSB0cnVlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGRjdHggPSBjcnVkbC5kYXRhKCdjcnVkbC1jb250ZXh0JykgfHwgJyc7XHJcbiAgICAgICAgdmFyIHZ3ciA9IGNydWRsLmZpbmQoJy5jcnVkbC12aWV3ZXInKTtcclxuICAgICAgICB2YXIgZHRyID0gY3J1ZGwuZmluZCgnLmNydWRsLWVkaXRvcicpO1xyXG4gICAgICAgIHZhciBpaWRwYXIgPSBjcnVkbC5kYXRhKCdjcnVkbC1pdGVtLWlkLXBhcmFtZXRlcicpIHx8ICdJdGVtSUQnO1xyXG4gICAgICAgIHZhciBmb3JtcGFycyA9IHsgYWN0aW9uOiAnY3JlYXRlJyB9O1xyXG4gICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSAwO1xyXG4gICAgICAgIHZhciBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldEV4dHJhUXVlcnkoZWwpIHtcclxuICAgICAgICAgIC8vIEdldCBleHRyYSBxdWVyeSBvZiB0aGUgZWxlbWVudCwgaWYgYW55OlxyXG4gICAgICAgICAgdmFyIHhxID0gZWwuZGF0YSgnY3J1ZGwtZXh0cmEtcXVlcnknKSB8fCAnJztcclxuICAgICAgICAgIGlmICh4cSkgeHEgPSAnJicgKyB4cTtcclxuICAgICAgICAgIC8vIEl0ZXJhdGUgYWxsIHBhcmVudHMgaW5jbHVkaW5nIHRoZSAnY3J1ZGwnIGVsZW1lbnQgKHBhcmVudHNVbnRpbCBleGNsdWRlcyB0aGUgZmlyc3QgZWxlbWVudCBnaXZlbixcclxuICAgICAgICAgIC8vIGJlY2F1c2Ugb2YgdGhhdCB3ZSBnZXQgaXRzIHBhcmVudCgpKVxyXG4gICAgICAgICAgLy8gRm9yIGFueSBvZiB0aGVtIHdpdGggYW4gZXh0cmEtcXVlcnksIGFwcGVuZCBpdDpcclxuICAgICAgICAgIGVsLnBhcmVudHNVbnRpbChjcnVkbC5wYXJlbnQoKSwgJ1tkYXRhLWNydWRsLWV4dHJhLXF1ZXJ5XScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgeCA9ICQodGhpcykuZGF0YSgnY3J1ZGwtZXh0cmEtcXVlcnknKTtcclxuICAgICAgICAgICAgaWYgKHgpIHhxICs9ICcmJyArIHg7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHJldHVybiB4cTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNydWRsLmZpbmQoJy5jcnVkbC1jcmVhdGUnKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gMDtcclxuICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICdjcmVhdGUnO1xyXG4gICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuICAgICAgICAgIGR0ci5yZWxvYWQoe1xyXG4gICAgICAgICAgICB1cmw6IGZ1bmN0aW9uICh1cmwsIGRlZmF1bHRVcmwpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdFVybCArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBkdHIueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy1lZGl0b3InXSlcclxuICAgICAgICAgICAgICAucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1zaG93ZWQnXSwgW2R0cl0pO1xyXG4gICAgICAgICAgICAgICAgZHRyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBIaWRlIHZpZXdlciB3aGVuIGluIGVkaXRvcjpcclxuICAgICAgICAgIHZ3ci54aGlkZShpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLXZpZXdlciddKTtcclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10pXHJcbiAgICAgICAgICAudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHMuY3JlYXRlKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZ3clxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLXVwZGF0ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgaXRlbSA9ICR0LmNsb3Nlc3QoJy5jcnVkbC1pdGVtJyk7XHJcbiAgICAgICAgICB2YXIgaXRlbWlkID0gaXRlbS5kYXRhKCdjcnVkbC1pdGVtLWlkJyk7XHJcbiAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gaXRlbWlkO1xyXG4gICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ3VwZGF0ZSc7XHJcbiAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG4gICAgICAgICAgZHRyLnJlbG9hZCh7XHJcbiAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKHVybCwgZGVmYXVsdFVybCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VXJsICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGR0ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LWVkaXRvciddKVxyXG4gICAgICAgICAgICAgIC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgICBkdHIuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEhpZGUgdmlld2VyIHdoZW4gaW4gZWRpdG9yOlxyXG4gICAgICAgICAgdndyLnhoaWRlKGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtdmlld2VyJ10pO1xyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSlcclxuICAgICAgICAgIC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50cy51cGRhdGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLWRlbGV0ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgaXRlbSA9ICR0LmNsb3Nlc3QoJy5jcnVkbC1pdGVtJyk7XHJcbiAgICAgICAgICB2YXIgaXRlbWlkID0gaXRlbS5kYXRhKCdjcnVkbC1pdGVtLWlkJyk7XHJcblxyXG4gICAgICAgICAgaWYgKGNvbmZpcm0oZ2V0VGV4dCgnY29uZmlybS1kZWxldGUtY3J1ZGwtaXRlbS1tZXNzYWdlOicgKyBkY3R4KSkpIHtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbignPGRpdj4nICsgZ2V0VGV4dCgnZGVsZXRlLWNydWRsLWl0ZW0tbG9hZGluZy1tZXNzYWdlOicgKyBkY3R4KSArICc8L2Rpdj4nLCBpdGVtKTtcclxuICAgICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IGl0ZW1pZDtcclxuICAgICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ2RlbGV0ZSc7XHJcbiAgICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgdXJsOiBkdHIuYXR0cignZGF0YS1zb3VyY2UtdXJsJykgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxLFxyXG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJzxkaXY+JyArIGRhdGEuUmVzdWx0ICsgJzwvZGl2PicsIGl0ZW0sIG51bGwsIHtcclxuICAgICAgICAgICAgICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uZmFkZU91dCgnc2xvdycsIGZ1bmN0aW9uICgpIHsgaXRlbS5yZW1vdmUoKTsgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoZGF0YSwgdGV4dCwgangpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgICAgICAgICAgICAgIG9uRXJyb3IoangsIG1lc3NhZ2UsIGV4KTtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKGl0ZW0pO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgY29tcGxldGU6IG9uQ29tcGxldGVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZGVsZXRlJ10pO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZmluaXNoRWRpdCgpIHtcclxuICAgICAgICAgIGZ1bmN0aW9uIG9uY29tcGxldGUoYW5vdGhlck9uQ29tcGxldGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAvLyBTaG93IGFnYWluIHRoZSBWaWV3ZXJcclxuICAgICAgICAgICAgICAvL3Z3ci5zbGlkZURvd24oJ3Nsb3cnKTtcclxuICAgICAgICAgICAgICBpZiAoIXZ3ci5pcygnOnZpc2libGUnKSlcclxuICAgICAgICAgICAgICAgIHZ3ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LXZpZXdlciddKTtcclxuICAgICAgICAgICAgICAvLyBNYXJrIHRoZSBmb3JtIGFzIHVuY2hhbmdlZCB0byBhdm9pZCBwZXJzaXN0aW5nIHdhcm5pbmdzXHJcbiAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZHRyLmZpbmQoJ2Zvcm0nKS5nZXQoMCkpO1xyXG4gICAgICAgICAgICAgIC8vIEF2b2lkIGNhY2hlZCBjb250ZW50IG9uIHRoZSBFZGl0b3JcclxuICAgICAgICAgICAgICBkdHIuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gU2Nyb2xsIHRvIHByZXNlcnZlIGNvcnJlY3QgZm9jdXMgKG9uIGxhcmdlIHBhZ2VzIHdpdGggc2hhcmVkIGNvbnRlbnQgdXNlciBjYW4gZ2V0XHJcbiAgICAgICAgICAgICAgLy8gbG9zdCBhZnRlciBhbiBlZGl0aW9uKVxyXG4gICAgICAgICAgICAgIC8vICh3ZSBxdWV1ZSBhZnRlciB2d3IueHNob3cgYmVjYXVzZSB3ZSBuZWVkIHRvIGRvIGl0IGFmdGVyIHRoZSB4c2hvdyBmaW5pc2gpXHJcbiAgICAgICAgICAgICAgdndyLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c0Nsb3Nlc3QgPSBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGNydWRsLCAnZm9jdXMtY2xvc2VzdCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzRWxlbWVudCA9IGNydWRsLmNsb3Nlc3QoZm9jdXNDbG9zZXN0KTtcclxuICAgICAgICAgICAgICAgIC8vIElmIG5vIGNsb3Nlc3QsIGdldCB0aGUgY3J1ZGxcclxuICAgICAgICAgICAgICAgIGlmIChmb2N1c0VsZW1lbnQubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICBmb2N1c0VsZW1lbnQgPSBjcnVkbDtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c01hcmdpbiA9IGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgY3J1ZGwsICdmb2N1cy1tYXJnaW4nKTtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c0R1cmF0aW9uID0gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBjcnVkbCwgJ2ZvY3VzLWR1cmF0aW9uJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oZm9jdXNFbGVtZW50LCB7IG1hcmdpblRvcDogZm9jdXNNYXJnaW4sIGR1cmF0aW9uOiBmb2N1c0R1cmF0aW9uIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHZ3ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIHVzZXIgY2FsbGJhY2s6XHJcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoYW5vdGhlck9uQ29tcGxldGUpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgYW5vdGhlck9uQ29tcGxldGUuYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gTk9URTogRmlyc3QsIHdlIG5vdGlmeSB0aGUgY2hhbmdlcy1zYXZlZCBhbmQgZXZlbnQsIHRoaXMgbGFzdCBhbGxvd3NcclxuICAgICAgICAgIC8vIGNsaWVudCBzY3JpcHRzIHRvIGRvIHRhc2tzIGp1c3QgYmVmb3JlIHRoZSBlZGl0b3IgYmVnaW5zIHRvIGNsb3NlXHJcbiAgICAgICAgICAvLyAoYXZvaWRpbmcgcHJvYmxlbXMgbGlrZSB3aXRoIHRoZSAnbW92ZUZvY3VzVG8nIG5vdCBiZWluZyBwcmVjaXNlIGlmIHRoZVxyXG4gICAgICAgICAgLy8gYW5pbWF0aW9uIGR1cmF0aW9uIGlzIHRoZSBzYW1lIG9uIGNsaWVudCBzY3JpcHQgYW5kIGhpZGUtZWRpdG9yKS5cclxuICAgICAgICAgIC8vIFRoZW4sIGVkaXRvciBnZXRzIGhpZGRlblxyXG4gICAgICAgICAgLy8gVE9ETzogVGhpcyBjYW4gZ2V0IGVuaGFuY2VkIHRvIGFsbG93IGxhcmdlciBkdXJhdGlvbnMgb24gY2xpZW50LXNjcmlwdHNcclxuICAgICAgICAgIC8vIHdpdGhvdXQgYWZmZWN0IG1vdmVGb2N1c1RvIHBhc3NpbmcgaW4gdGhlIHRyaWdnZXIgYW4gb2JqZWN0IHRoYXQgaG9sZHNcclxuICAgICAgICAgIC8vIGEgUHJvbWlzZS9EZWZlcnJlZCB0byBiZSBzZXQgYnkgY2xpZW50LXNjcmlwdCBhcyAnaGlkZS1lZGl0b3IgJlxyXG4gICAgICAgICAgLy8gdmlld2VyLXNob3cgbXVzdCBzdGFydCB3aGVuIHRoaXMgcHJvbWlzZSBnZXRzIGZ1bGxmaWxsZWQnLCBhbGxvd2luZyB0b1xyXG4gICAgICAgICAgLy8gaGF2ZSBhIHNlcXVlbmNlIChmaXJzdCBjbGllbnQtc2NyaXB0cywgdGhlbiBoaWRlLWVkaXRvcikuXHJcblxyXG4gICAgICAgICAgLy8gTWFyayBmb3JtIGFzIHNhdmVkIHRvIHJlbW92ZSB0aGUgJ2hhcy1jaGFuZ2VzJyBtYXJrXHJcbiAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcblxyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10pO1xyXG5cclxuICAgICAgICAgIC8vIFdlIG5lZWQgYSBjdXN0b20gY29tcGxldGUgY2FsbGJhY2ssIGJ1dCB0byBub3QgcmVwbGFjZSB0aGUgdXNlciBjYWxsYmFjaywgd2VcclxuICAgICAgICAgIC8vIGNsb25lIGZpcnN0IHRoZSBzZXR0aW5ncyBhbmQgdGhlbiBhcHBseSBvdXIgY2FsbGJhY2sgdGhhdCBpbnRlcm5hbGx5IHdpbGwgY2FsbFxyXG4gICAgICAgICAgLy8gdGhlIHVzZXIgY2FsbGJhY2sgcHJvcGVybHkgKGlmIGFueSlcclxuICAgICAgICAgIHZhciB3aXRoY2FsbGJhY2sgPSAkLmV4dGVuZCh0cnVlLCB7fSwgaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS1lZGl0b3InXSk7XHJcbiAgICAgICAgICB3aXRoY2FsbGJhY2suY29tcGxldGUgPSBvbmNvbXBsZXRlKHdpdGhjYWxsYmFjay5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAvLyBIaWRpbmcgZWRpdG9yOlxyXG4gICAgICAgICAgZHRyLnhoaWRlKHdpdGhjYWxsYmFjayk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZHRyXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtY2FuY2VsJywgZmluaXNoRWRpdClcclxuICAgICAgICAub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCAnLmFqYXgtYm94JywgZmluaXNoRWRpdClcclxuICAgICAgICAvLyBBbiBldmVudGVkIG1ldGhvZDogdHJpZ2dlciB0aGlzIGV2ZW50IHRvIGV4ZWN1dGUgYSB2aWV3ZXIgcmVsb2FkOlxyXG4gICAgICAgIC5vbigncmVsb2FkTGlzdCcsICcqJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdndyLmZpbmQoJy5jcnVkbC1saXN0JykucmVsb2FkKHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0JywgJ2Zvcm0sIGZpZWxkc2V0JywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDAgfHwgZGF0YS5Db2RlID09IDUgfHwgZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyB2aWV3ZXIgYW5kIHJlbG9hZCBsaXN0OlxyXG4gICAgICAgICAgICB2d3IuZmluZCgnLmNydWRsLWxpc3QnKS5yZWxvYWQoeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gQSBzbWFsbCBkZWxheSB0byBsZXQgdXNlciB0byBzZWUgdGhlIG5ldyBtZXNzYWdlIG9uIGJ1dHRvbiBiZWZvcmVcclxuICAgICAgICAgIC8vIGhpZGUgaXQgKGJlY2F1c2UgaXMgaW5zaWRlIHRoZSBlZGl0b3IpXHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDUpXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmluaXNoRWRpdCwgMTAwMCk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLGZpZWxkc2V0JywgZnVuY3Rpb24gKGpiLCBmb3JtLCBqeCkge1xyXG4gICAgICAgICAgLy8gRW1pdCB0aGUgJ2VkaXRvci1yZWFkeScgZXZlbnQgb24gZWRpdG9yIEh0bWwgYmVpbmcgcmVwbGFjZWRcclxuICAgICAgICAgIC8vIChmaXJzdCBsb2FkIG9yIG5leHQgbG9hZHMgYmVjYXVzZSBvZiBzZXJ2ZXItc2lkZSB2YWxpZGF0aW9uIGVycm9ycylcclxuICAgICAgICAgIC8vIHRvIGFsbG93IGxpc3RlbmVycyB0byBkbyBhbnkgd29yayBvdmVyIGl0cyAobmV3KSBET00gZWxlbWVudHMuXHJcbiAgICAgICAgICAvLyBUaGUgc2Vjb25kIGN1c3RvbSBwYXJhbWV0ZXIgcGFzc2VkIG1lYW5zIGlzIG1lYW4gdG9cclxuICAgICAgICAgIC8vIGRpc3Rpbmd1aXNoIHRoZSBmaXJzdCB0aW1lIGNvbnRlbnQgbG9hZCBhbmQgc3VjY2Vzc2l2ZSB1cGRhdGVzIChkdWUgdG8gdmFsaWRhdGlvbiBlcnJvcnMpLlxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBbZHRyLCBlZGl0b3JJbml0aWFsTG9hZF0pO1xyXG5cclxuICAgICAgICAgIC8vIE5leHQgdGltZXM6XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nLCB0cnVlKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gaW5zdGFuY2U7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuIiwiLyoqXHJcbiAgVGhpcyBtb2R1bGUgaGFzIHV0aWxpdGllcyB0byBjb252ZXJ0IGEgRGF0ZSBvYmplY3QgaW50b1xyXG4gIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvbGxvd2luZyBJU08tODYwMSBzcGVjaWZpY2F0aW9uLlxyXG4gIFxyXG4gIElOQ09NUExFVEUgQlVUIFVTRUZVTC5cclxuICBcclxuICBTdGFuZGFyZCByZWZlcnMgdG8gZm9ybWF0IHZhcmlhdGlvbnM6XHJcbiAgLSBiYXNpYzogbWluaW11bSBzZXBhcmF0b3JzXHJcbiAgLSBleHRlbmRlZDogYWxsIHNlcGFyYXRvcnMsIG1vcmUgcmVhZGFibGVcclxuICBCeSBkZWZhdWx0LCBhbGwgbWV0aG9kcyBwcmludHMgdGhlIGJhc2ljIGZvcm1hdCxcclxuICBleGNlcHRzIHRoZSBwYXJhbWV0ZXIgJ2V4dGVuZGVkJyBpcyBzZXQgdG8gdHJ1ZVxyXG5cclxuICBUT0RPOlxyXG4gIC0gVFo6IGFsbG93IGZvciBUaW1lIFpvbmUgc3VmZml4ZXMgKHBhcnNlIGFsbG93IGl0IGFuZCBcclxuICAgIGRldGVjdCBVVEMgYnV0IGRvIG5vdGhpbmcgd2l0aCBhbnkgdGltZSB6b25lIG9mZnNldCBkZXRlY3RlZClcclxuICAtIEZyYWN0aW9ucyBvZiBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLmRhdGVVVEMgPSBmdW5jdGlvbiBkYXRlVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIG0gPSAoZGF0ZS5nZXRVVENNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgZCA9IGRhdGUuZ2V0VVRDRGF0ZSgpLnRvU3RyaW5nKCksXHJcbiAgICAgIHkgPSBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgIGQgPSAnMCcgKyBkO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4geSArICctJyArIG0gKyAnLScgKyBkO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiB5ICsgbSArIGQ7XHJcbn07XHJcblxyXG5leHBvcnRzLmRhdGVMb2NhbCA9IGZ1bmN0aW9uIGRhdGVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBtID0gKGRhdGUuZ2V0TW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgIGQgPSBkYXRlLmdldERhdGUoKS50b1N0cmluZygpLFxyXG4gICAgICB5ID0gZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCk7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgIGQgPSAnMCcgKyBkO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4geSArICctJyArIG0gKyAnLScgKyBkO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiB5ICsgbSArIGQ7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycywgbWludXRlcyBhbmQgc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy50aW1lTG9jYWwgPSBmdW5jdGlvbiB0aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgcyA9IGRhdGUuZ2V0U2Vjb25kcygpLnRvU3RyaW5nKCksXHJcbiAgICAgIGhtID0gZXhwb3J0cy5zaG9ydFRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PSAxKVxyXG4gICAgcyA9ICcwJyArIHM7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBobSArICc6JyArIHM7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGhtICsgcztcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzLCBtaW51dGVzIGFuZCBzZWNvbmRzIFVUQ1xyXG4qKi9cclxuZXhwb3J0cy50aW1lVVRDID0gZnVuY3Rpb24gdGltZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBzID0gZGF0ZS5nZXRVVENTZWNvbmRzKCkudG9TdHJpbmcoKSxcclxuICAgICAgaG0gPSBleHBvcnRzLnNob3J0VGltZVVUQyhkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PSAxKVxyXG4gICAgcyA9ICcwJyArIHM7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBobSArICc6JyArIHM7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGhtICsgcztcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzIGFuZCBtaW51dGVzXHJcbioqL1xyXG5leHBvcnRzLnNob3J0VGltZUxvY2FsID0gZnVuY3Rpb24gc2hvcnRUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgaCA9IGRhdGUuZ2V0SG91cnMoKS50b1N0cmluZygpLFxyXG4gICAgICBtID0gZGF0ZS5nZXRNaW51dGVzKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKGgubGVuZ3RoID09IDEpXHJcbiAgICBoID0gJzAnICsgaDtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaCArICc6JyArIG07XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGggKyBtO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMgYW5kIG1pbnV0ZXMgVVRDXHJcbioqL1xyXG5leHBvcnRzLnNob3J0VGltZVVUQyA9IGZ1bmN0aW9uIHNob3J0VGltZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBoID0gZGF0ZS5nZXRVVENIb3VycygpLnRvU3RyaW5nKCksXHJcbiAgICAgIG0gPSBkYXRlLmdldFVUQ01pbnV0ZXMoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAoaC5sZW5ndGggPT0gMSlcclxuICAgIGggPSAnMCcgKyBoO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBoICsgJzonICsgbTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaCArIG07XHJcbn07XHJcblxyXG4vKipcclxuICBUT0RPOiBIb3VycywgbWludXRlcywgc2Vjb25kcyBhbmQgZnJhY3Rpb25zIG9mIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMubG9uZ1RpbWVMb2NhbCA9IGZ1bmN0aW9uIGxvbmdUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICAvL1RPRE9cclxufTtcclxuXHJcbi8qKlxyXG4gIFVUQyBEYXRlIGFuZCBUaW1lIHNlcGFyYXRlZCBieSBULlxyXG4gIFN0YW5kYXJkIGFsbG93cyBvbWl0IHRoZSBzZXBhcmF0b3IgYXMgZXhjZXB0aW9uYWwsIGJvdGggcGFydHMgYWdyZWVtZW50LCBjYXNlcztcclxuICBjYW4gYmUgZG9uZSBwYXNzaW5nIHRydWUgYXMgb2Ygb21pdFNlcGFyYXRvciBwYXJhbWV0ZXIsIGJ5IGRlZmF1bHQgZmFsc2UuXHJcbioqL1xyXG5leHBvcnRzLmRhdGV0aW1lTG9jYWwgPSBmdW5jdGlvbiBkYXRldGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkLCBvbWl0U2VwYXJhdG9yKSB7XHJcbiAgdmFyIGQgPSBleHBvcnRzLmRhdGVMb2NhbChkYXRlLCBleHRlbmRlZCksXHJcbiAgICAgIHQgPSBleHBvcnRzLnRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChvbWl0U2VwYXJhdG9yKVxyXG4gICAgcmV0dXJuIGQgKyB0O1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBkICsgJ1QnICsgdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIExvY2FsIERhdGUgYW5kIFRpbWUgc2VwYXJhdGVkIGJ5IFQuXHJcbiAgU3RhbmRhcmQgYWxsb3dzIG9taXQgdGhlIHNlcGFyYXRvciBhcyBleGNlcHRpb25hbCwgYm90aCBwYXJ0cyBhZ3JlZW1lbnQsIGNhc2VzO1xyXG4gIGNhbiBiZSBkb25lIHBhc3NpbmcgdHJ1ZSBhcyBvZiBvbWl0U2VwYXJhdG9yIHBhcmFtZXRlciwgYnkgZGVmYXVsdCBmYWxzZS5cclxuKiovXHJcbmV4cG9ydHMuZGF0ZXRpbWVVVEMgPSBmdW5jdGlvbiBkYXRldGltZVVUQyhkYXRlLCBleHRlbmRlZCwgb21pdFNlcGFyYXRvcikge1xyXG4gIHZhciBkID0gZXhwb3J0cy5kYXRlVVRDKGRhdGUsIGV4dGVuZGVkKSxcclxuICAgICAgdCA9IGV4cG9ydHMudGltZVVUQyhkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChvbWl0U2VwYXJhdG9yKVxyXG4gICAgcmV0dXJuIGQgKyB0O1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBkICsgJ1QnICsgdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIFBhcnNlIGEgc3RyaW5nIGludG8gYSBEYXRlIG9iamVjdCBpZiBpcyBhIHZhbGlkIElTTy04NjAxIGZvcm1hdC5cclxuICBQYXJzZSBzaW5nbGUgZGF0ZSwgc2luZ2xlIHRpbWUgb3IgZGF0ZS10aW1lIGZvcm1hdHMuXHJcbiAgSU1QT1JUQU5UOiBJdCBkb2VzIE5PVCBjb252ZXJ0IGJldHdlZW4gdGhlIGRhdGVzdHIgVGltZVpvbmUgYW5kIHRoZVxyXG4gIGxvY2FsIFRpbWVab25lIChlaXRoZXIgaXQgYWxsb3dzIGRhdGVzdHIgdG8gaW5jbHVkZWQgVGltZVpvbmUgaW5mb3JtYXRpb24pXHJcbiAgVE9ETzogT3B0aW9uYWwgVCBzZXBhcmF0b3IgaXMgbm90IGFsbG93ZWQuXHJcbiAgVE9ETzogTWlsbGlzZWNvbmRzL2ZyYWN0aW9ucyBvZiBzZWNvbmRzIG5vdCBzdXBwb3J0ZWRcclxuKiovXHJcbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiBwYXJzZShkYXRlc3RyKSB7XHJcbiAgdmFyIGR0ID0gZGF0ZXN0ci5zcGxpdCgnVCcpLFxyXG4gICAgZGF0ZSA9IGR0WzBdLFxyXG4gICAgdGltZSA9IGR0Lmxlbmd0aCA9PSAyID8gZHRbMV0gOiBudWxsO1xyXG5cclxuICBpZiAoZHQubGVuZ3RoID4gMilcclxuICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCBmb3JtYXRcIik7XHJcblxyXG4gIC8vIENoZWNrIGlmIGRhdGUgY29udGFpbnMgYSB0aW1lO1xyXG4gIC8vIGJlY2F1c2UgbWF5YmUgZGF0ZXN0ciBpcyBvbmx5IHRoZSB0aW1lIHBhcnRcclxuICBpZiAoLzp8XlxcZHs0LDZ9W15cXC1dKFxcLlxcZCopPyg/Olp8WytcXC1dLiopPyQvLnRlc3QoZGF0ZSkpIHtcclxuICAgIHRpbWUgPSBkYXRlO1xyXG4gICAgZGF0ZSA9IG51bGw7XHJcbiAgfVxyXG5cclxuICB2YXIgeSwgbSwgZCwgaCwgbW0sIHMsIHR6LCB1dGM7XHJcblxyXG4gIGlmIChkYXRlKSB7XHJcbiAgICB2YXIgZHBhcnRzID0gLyhcXGR7NH0pXFwtPyhcXGR7Mn0pXFwtPyhcXGR7Mn0pLy5leGVjKGRhdGUpO1xyXG4gICAgaWYgKCFkcGFydHMpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCBkYXRlIGZvcm1hdFwiKTtcclxuXHJcbiAgICB5ID0gZHBhcnRzWzFdO1xyXG4gICAgbSA9IGRwYXJ0c1syXTtcclxuICAgIGQgPSBkcGFydHNbM107XHJcbiAgfVxyXG5cclxuICBpZiAodGltZSkge1xyXG4gICAgdmFyIHRwYXJ0cyA9IC8oXFxkezJ9KTo/KFxcZHsyfSkoPzo6PyhcXGR7Mn0pKT8oWnxbK1xcLV0uKik/Ly5leGVjKHRpbWUpO1xyXG4gICAgaWYgKCF0cGFydHMpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCB0aW1lIGZvcm1hdFwiKTtcclxuXHJcbiAgICBoID0gdHBhcnRzWzFdO1xyXG4gICAgbW0gPSB0cGFydHNbMl07XHJcbiAgICBzID0gdHBhcnRzLmxlbmd0aCA+IDMgPyB0cGFydHNbM10gOiBudWxsO1xyXG4gICAgdHogPSB0cGFydHMubGVuZ3RoID4gNCA/IHRwYXJ0c1s0XSA6IG51bGw7XHJcbiAgICAvLyBEZXRlY3RzIGlmIGlzIGEgdGltZSBpbiBVVEM6XHJcbiAgICB1dGMgPSAvXlokL2kudGVzdCh0eik7XHJcbiAgfVxyXG5cclxuICAvLyBWYXIgdG8gaG9sZCB0aGUgcGFyc2VkIHZhbHVlLCB3ZSBzdGFydCB3aXRoIHRvZGF5LFxyXG4gIC8vIHRoYXQgd2lsbCBmaWxsIHRoZSBtaXNzaW5nIHBhcnRzXHJcbiAgdmFyIHBhcnNlZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICBpZiAoZGF0ZSkge1xyXG4gICAgLy8gVXBkYXRpbmcgdGhlIGRhdGUgb2JqZWN0IHdpdGggZWFjaCB5ZWFyLCBtb250aCBhbmQgZGF0ZS9kYXkgZGV0ZWN0ZWQ6XHJcbiAgICBpZiAodXRjKVxyXG4gICAgICBwYXJzZWREYXRlLnNldFVUQ0Z1bGxZZWFyKHksIG0sIGQpO1xyXG4gICAgZWxzZVxyXG4gICAgICBwYXJzZWREYXRlLnNldEZ1bGxZZWFyKHksIG0sIGQpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRpbWUpIHtcclxuICAgIGlmICh1dGMpXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0VVRDSG91cnMoaCwgbW0sIHMpO1xyXG4gICAgZWxzZVxyXG4gICAgICBwYXJzZWREYXRlLnNldEhvdXJzKGgsIG1tLCBzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gQSBkYXRlIHdpdGhvdXQgdGltZSBwYXJ0IG11c3QgYmUgY29uc2lkZXJlZCBhcyAwMDowMDowMCBpbnN0ZWFkIG9mIGN1cnJlbnQgdGltZVxyXG4gICAgcGFyc2VkRGF0ZS5zZXRIb3VycygwLCAwLCAwKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBwYXJzZWREYXRlO1xyXG59OyIsIi8qIERhdGUgcGlja2VyIGluaXRpYWxpemF0aW9uIGFuZCB1c2VcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBEYXRlUGlja2VyKCkge1xyXG4gICAgLy8gRGF0ZSBQaWNrZXJcclxuICAgICQuZGF0ZXBpY2tlci5zZXREZWZhdWx0cygkLmRhdGVwaWNrZXIucmVnaW9uYWxbJCgnaHRtbCcpLmF0dHIoJ2xhbmcnKV0pO1xyXG4gICAgJCgnLmRhdGUtcGljaycsIGRvY3VtZW50KS5kYXRlcGlja2VyKHtcclxuICAgICAgICBzaG93QW5pbTogJ2JsaW5kJ1xyXG4gICAgfSk7XHJcbiAgICBhcHBseURhdGVQaWNrZXIoKTtcclxufVxyXG5mdW5jdGlvbiBhcHBseURhdGVQaWNrZXIoZWxlbWVudCkge1xyXG4gICAgJChcIi5kYXRlLXBpY2tcIiwgZWxlbWVudCB8fCBkb2N1bWVudClcclxuICAgIC8vLnZhbChuZXcgRGF0ZSgpLmFzU3RyaW5nKCQuZGF0ZXBpY2tlci5fZGVmYXVsdHMuZGF0ZUZvcm1hdCkpXHJcbiAgICAuZGF0ZXBpY2tlcih7XHJcbiAgICAgICAgc2hvd0FuaW06IFwiYmxpbmRcIlxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXQ6IHNldHVwRGF0ZVBpY2tlcixcclxuICAgICAgICBhcHBseTogYXBwbHlEYXRlUGlja2VyXHJcbiAgICB9O1xyXG4iLCIvKiBGb3JtYXQgYSBkYXRlIGFzIFlZWVktTU0tREQgaW4gVVRDIGZvciBzYXZlIHVzXHJcbiAgICB0byBpbnRlcmNoYW5nZSB3aXRoIG90aGVyIG1vZHVsZXMgb3IgYXBwcy5cclxuKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcoZGF0ZSkge1xyXG4gICAgdmFyIG0gPSAoZGF0ZS5nZXRVVENNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgICBkID0gZGF0ZS5nZXRVVENEYXRlKCkudG9TdHJpbmcoKTtcclxuICAgIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgIG0gPSAnMCcgKyBtO1xyXG4gICAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICAgICAgZCA9ICcwJyArIGQ7XHJcbiAgICByZXR1cm4gZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCkgKyAnLScgKyBtICsgJy0nICsgZDtcclxufTsiLCIvKiogQW4gaTE4biB1dGlsaXR5LCBnZXQgYSB0cmFuc2xhdGlvbiB0ZXh0IGJ5IGxvb2tpbmcgZm9yIHNwZWNpZmljIGVsZW1lbnRzIGluIHRoZSBodG1sXHJcbndpdGggdGhlIG5hbWUgZ2l2ZW4gYXMgZmlyc3QgcGFyYW1lbnRlciBhbmQgYXBwbHlpbmcgdGhlIGdpdmVuIHZhbHVlcyBvbiBzZWNvbmQgYW5kIFxyXG5vdGhlciBwYXJhbWV0ZXJzLlxyXG4gICAgVE9ETzogUkUtSU1QTEVNRU5UIG5vdCB1c2luZyBqUXVlcnkgbmVsc2UgRE9NIGVsZW1lbnRzLCBvciBhbG1vc3Qgbm90IGVsZW1lbnRzIGluc2lkZSBib2R5XHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxuZnVuY3Rpb24gZ2V0VGV4dCgpIHtcclxuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgLy8gR2V0IGtleSBhbmQgdHJhbnNsYXRlIGl0XHJcbiAgICB2YXIgZm9ybWF0dGVkID0gYXJnc1swXTtcclxuICAgIHZhciB0ZXh0ID0gJCgnI2xjcmVzLScgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGZvcm1hdHRlZCkpLnRleHQoKTtcclxuICAgIGlmICh0ZXh0KVxyXG4gICAgICAgIGZvcm1hdHRlZCA9IHRleHQ7XHJcbiAgICAvLyBBcHBseSBmb3JtYXQgdG8gdGhlIHRleHQgd2l0aCBhZGRpdGlvbmFsIHBhcmFtZXRlcnNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCdcXFxceycgKyBpICsgJ1xcXFx9JywgJ2dpJyk7XHJcbiAgICAgICAgZm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UocmVnZXhwLCBhcmdzW2kgKyAxXSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZm9ybWF0dGVkO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFRleHQ7IiwiLyoqIFJldHVybnMgdGhlIHBhdGggdG8gdGhlIGdpdmVuIGVsZW1lbnQgaW4gWFBhdGggY29udmVudGlvblxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGdldFhQYXRoKGVsZW1lbnQpIHtcclxuICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnQuaWQpXHJcbiAgICAgICAgcmV0dXJuICcvLypbQGlkPVwiJyArIGVsZW1lbnQuaWQgKyAnXCJdJztcclxuICAgIHZhciB4cGF0aCA9ICcnO1xyXG4gICAgZm9yICg7IGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PSAxOyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gJChlbGVtZW50LnBhcmVudE5vZGUpLmNoaWxkcmVuKGVsZW1lbnQudGFnTmFtZSkuaW5kZXgoZWxlbWVudCkgKyAxO1xyXG4gICAgICAgIGlkID0gKGlkID4gMSA/ICdbJyArIGlkICsgJ10nIDogJycpO1xyXG4gICAgICAgIHhwYXRoID0gJy8nICsgZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgKyBpZCArIHhwYXRoO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHhwYXRoO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFhQYXRoO1xyXG4iLCIvLyBJdCBleGVjdXRlcyB0aGUgZ2l2ZW4gJ3JlYWR5JyBmdW5jdGlvbiBhcyBwYXJhbWV0ZXIgd2hlblxyXG4vLyBtYXAgZW52aXJvbm1lbnQgaXMgcmVhZHkgKHdoZW4gZ29vZ2xlIG1hcHMgYXBpIGFuZCBzY3JpcHQgaXNcclxuLy8gbG9hZGVkIGFuZCByZWFkeSB0byB1c2UsIG9yIGlubWVkaWF0ZWx5IGlmIGlzIGFscmVhZHkgbG9hZGVkKS5cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpO1xyXG5cclxuLy8gUHJpdmF0ZSBzdGF0aWMgY29sbGVjdGlvbiBvZiBjYWxsYmFja3MgcmVnaXN0ZXJlZFxyXG52YXIgc3RhY2sgPSBbXTtcclxuXHJcbnZhciBnb29nbGVNYXBSZWFkeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ29vZ2xlTWFwUmVhZHkocmVhZHkpIHtcclxuICBzdGFjay5wdXNoKHJlYWR5KTtcclxuXHJcbiAgaWYgKGdvb2dsZU1hcFJlYWR5LmlzUmVhZHkpXHJcbiAgICByZWFkeSgpO1xyXG4gIGVsc2UgaWYgKCFnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcpIHtcclxuICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IHRydWU7XHJcbiAgICBsb2FkZXIubG9hZCh7XHJcbiAgICAgIHNjcmlwdHM6IFtcImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vanNhcGlcIl0sXHJcbiAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBmdW5jdGlvbiAoKSB7IHJldHVybiAhIXdpbmRvdy5nb29nbGU7IH0sXHJcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZ29vZ2xlLmxvYWQoXCJtYXBzXCIsIFwiMy4xMFwiLCB7IG90aGVyX3BhcmFtczogXCJzZW5zb3I9ZmFsc2VcIiwgXCJjYWxsYmFja1wiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBnb29nbGVNYXBSZWFkeS5pc1JlYWR5ID0gdHJ1ZTtcclxuICAgICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgc3RhY2tbaV0oKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBVdGlsaXR5IHRvIGZvcmNlIHRoZSByZWZyZXNoIG9mIG1hcHMgdGhhdCBzb2x2ZSB0aGUgcHJvYmxlbSB3aXRoIGJhZC1zaXplZCBtYXAgYXJlYVxyXG5nb29nbGVNYXBSZWFkeS5yZWZyZXNoTWFwID0gZnVuY3Rpb24gcmVmcmVzaE1hcHMobWFwKSB7XHJcbiAgZ29vZ2xlTWFwUmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlcihtYXAsIFwicmVzaXplXCIpO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiBHVUlEIEdlbmVyYXRvclxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBndWlkR2VuZXJhdG9yKCkge1xyXG4gICAgdmFyIFM0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKSB8IDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIChTNCgpICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFM0KCkgKyBTNCgpKTtcclxufTsiLCIvKipcclxuICAgIEdlbmVyaWMgc2NyaXB0IGZvciBmaWVsZHNldHMgd2l0aCBjbGFzcyAuaGFzLWNvbmZpcm0sIGFsbG93aW5nIHNob3dcclxuICAgIHRoZSBjb250ZW50IG9ubHkgaWYgdGhlIG1haW4gY29uZmlybSBmaWVsZHMgaGF2ZSAneWVzJyBzZWxlY3RlZC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG52YXIgZGVmYXVsdFNlbGVjdG9yID0gJ2ZpZWxkc2V0Lmhhcy1jb25maXJtID4gLmNvbmZpcm0gaW5wdXQnO1xyXG5cclxuZnVuY3Rpb24gb25jaGFuZ2UoKSB7XHJcbiAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgZnMgPSB0LmNsb3Nlc3QoJ2ZpZWxkc2V0Jyk7XHJcbiAgICBpZiAodC5pcygnOmNoZWNrZWQnKSlcclxuICAgICAgICBpZiAodC52YWwoKSA9PSAneWVzJyB8fCB0LnZhbCgpID09ICdUcnVlJylcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3MoJ2NvbmZpcm1lZC1ubycpLmFkZENsYXNzKCdjb25maXJtZWQteWVzJyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcygnY29uZmlybWVkLXllcycpLmFkZENsYXNzKCdjb25maXJtZWQtbm8nKTtcclxufVxyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBkZWZhdWx0U2VsZWN0b3I7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIHNlbGVjdG9yLCBvbmNoYW5nZSk7XHJcbiAgICAvLyBQZXJmb3JtcyBmaXJzdCBjaGVjazpcclxuICAgICQoc2VsZWN0b3IpLmNoYW5nZSgpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5vZmYgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgZGVmYXVsdFNlbGVjdG9yO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9mZignY2hhbmdlJywgc2VsZWN0b3IpO1xyXG59OyIsIi8qIEludGVybmF6aW9uYWxpemF0aW9uIFV0aWxpdGllc1xyXG4gKi9cclxudmFyIGkxOG4gPSB7fTtcclxuaTE4bi5kaXN0YW5jZVVuaXRzID0ge1xyXG4gICAgJ0VTJzogJ2ttJyxcclxuICAgICdVUyc6ICdtaWxlcydcclxufTtcclxuaTE4bi5udW1lcmljTWlsZXNTZXBhcmF0b3IgPSB7XHJcbiAgICAnZXMtRVMnOiAnLicsXHJcbiAgICAnZXMtVVMnOiAnLicsXHJcbiAgICAnZW4tVVMnOiAnLCcsXHJcbiAgICAnZW4tRVMnOiAnLCdcclxufTtcclxuaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvciA9IHtcclxuICAgICdlcy1FUyc6ICcsJyxcclxuICAgICdlcy1VUyc6ICcsJyxcclxuICAgICdlbi1VUyc6ICcuJyxcclxuICAgICdlbi1FUyc6ICcuJ1xyXG59O1xyXG5pMThuLm1vbmV5U3ltYm9sUHJlZml4ID0ge1xyXG4gICAgJ0VTJzogJycsXHJcbiAgICAnVVMnOiAnJCdcclxufTtcclxuaTE4bi5tb25leVN5bWJvbFN1Zml4ID0ge1xyXG4gICAgJ0VTJzogJ+KCrCcsXHJcbiAgICAnVVMnOiAnJ1xyXG59O1xyXG5pMThuLmdldEN1cnJlbnRDdWx0dXJlID0gZnVuY3Rpb24gZ2V0Q3VycmVudEN1bHR1cmUoKSB7XHJcbiAgICB2YXIgYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpO1xyXG4gICAgdmFyIHMgPSBjLnNwbGl0KCctJyk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGN1bHR1cmU6IGMsXHJcbiAgICAgICAgbGFuZ3VhZ2U6IHNbMF0sXHJcbiAgICAgICAgY291bnRyeTogc1sxXVxyXG4gICAgfTtcclxufTtcclxuaTE4bi5jb252ZXJ0TWlsZXNLbSA9IGZ1bmN0aW9uIGNvbnZlcnRNaWxlc0ttKHEsIHVuaXQpIHtcclxuICAgIHZhciBNSUxFU19UT19LTSA9IDEuNjA5O1xyXG4gICAgaWYgKHVuaXQgPT0gJ21pbGVzJylcclxuICAgICAgICByZXR1cm4gTUlMRVNfVE9fS00gKiBxO1xyXG4gICAgZWxzZSBpZiAodW5pdCA9PSAna20nKVxyXG4gICAgICAgIHJldHVybiBxIC8gTUlMRVNfVE9fS007XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykgY29uc29sZS5sb2coJ2NvbnZlcnRNaWxlc0ttOiBVbnJlY29nbml6ZWQgdW5pdCAnICsgdW5pdCk7XHJcbiAgICByZXR1cm4gMDtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gaTE4bjsiLCIvKiBSZXR1cm5zIHRydWUgd2hlbiBzdHIgaXNcclxuLSBudWxsXHJcbi0gZW1wdHkgc3RyaW5nXHJcbi0gb25seSB3aGl0ZSBzcGFjZXMgc3RyaW5nXHJcbiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNFbXB0eVN0cmluZyhzdHIpIHtcclxuICAgIHJldHVybiAhKC9cXFMvZy50ZXN0KHN0ciB8fCBcIlwiKSk7XHJcbn07IiwiLyoqIEFzIHRoZSAnaXMnIGpRdWVyeSBtZXRob2QsIGJ1dCBjaGVja2luZyBAc2VsZWN0b3IgaW4gYWxsIGVsZW1lbnRzXHJcbiogQG1vZGlmaWVyIHZhbHVlczpcclxuKiAtICdhbGwnOiBhbGwgZWxlbWVudHMgbXVzdCBtYXRjaCBzZWxlY3RvciB0byByZXR1cm4gdHJ1ZVxyXG4qIC0gJ2FsbW9zdC1vbmUnOiBhbG1vc3Qgb25lIGVsZW1lbnQgbXVzdCBtYXRjaFxyXG4qIC0gJ3BlcmNlbnRhZ2UnOiByZXR1cm5zIHBlcmNlbnRhZ2UgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbWF0Y2ggc2VsZWN0b3IgKDAtMTAwKVxyXG4qIC0gJ3N1bW1hcnknOiByZXR1cm5zIHRoZSBvYmplY3QgeyB5ZXM6IG51bWJlciwgbm86IG51bWJlciwgcGVyY2VudGFnZTogbnVtYmVyLCB0b3RhbDogbnVtYmVyIH1cclxuKiAtIHtqdXN0OiBhIG51bWJlcn06IGV4YWN0IG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiAtIHthbG1vc3Q6IGEgbnVtYmVyfTogbWluaW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbiogLSB7dW50aWw6IGEgbnVtYmVyfTogbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5hcmUgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIG1vZGlmaWVyKSB7XHJcbiAgICBtb2RpZmllciA9IG1vZGlmaWVyIHx8ICdhbGwnO1xyXG4gICAgdmFyIGNvdW50ID0gMDtcclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuaXMoc2VsZWN0b3IpKVxyXG4gICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgfSk7XHJcbiAgICBzd2l0Y2ggKG1vZGlmaWVyKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID09IGNvdW50O1xyXG4gICAgICAgIGNhc2UgJ2FsbW9zdC1vbmUnOlxyXG4gICAgICAgICAgICByZXR1cm4gY291bnQgPiAwO1xyXG4gICAgICAgIGNhc2UgJ3BlcmNlbnRhZ2UnOlxyXG4gICAgICAgICAgICByZXR1cm4gY291bnQgLyB0aGlzLmxlbmd0aDtcclxuICAgICAgICBjYXNlICdzdW1tYXJ5JzpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHllczogY291bnQsXHJcbiAgICAgICAgICAgICAgICBubzogdGhpcy5sZW5ndGggLSBjb3VudCxcclxuICAgICAgICAgICAgICAgIHBlcmNlbnRhZ2U6IGNvdW50IC8gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICB0b3RhbDogdGhpcy5sZW5ndGhcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ2p1c3QnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci5qdXN0ICE9IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICgnYWxtb3N0JyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuYWxtb3N0ID4gY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCd1bnRpbCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLnVudGlsIDwgY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgIH1cclxufTsiLCIvKiogPT09PT09PT09PT09PT09PT09PVxyXG5FeHRlbnNpb24ganF1ZXJ5OiAnYm91bmRzJ1xyXG5SZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSBjb21iaW5lZCBib3VuZHMgZm9yIGFsbCBcclxuZWxlbWVudHMgaW4gdGhlIGNvbGxlY3Rpb25cclxuKi9cclxuKGZ1bmN0aW9uICgpIHtcclxuICBqUXVlcnkuZm4uYm91bmRzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwge1xyXG4gICAgICBpbmNsdWRlQm9yZGVyOiBmYWxzZSxcclxuICAgICAgaW5jbHVkZU1hcmdpbjogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgdmFyIGJvdW5kcyA9IHtcclxuICAgICAgbGVmdDogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICB0b3A6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcclxuICAgICAgcmlnaHQ6IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcclxuICAgICAgYm90dG9tOiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHdpZHRoOiBOdW1iZXIuTmFOLFxyXG4gICAgICBoZWlnaHQ6IE51bWJlci5OYU5cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGZuV2lkdGggPSBvcHRpb25zLmluY2x1ZGVCb3JkZXIgfHwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luID8gXHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ub3V0ZXJXaWR0aC5jYWxsKGVsLCBvcHRpb25zLmluY2x1ZGVNYXJnaW4pOyB9IDpcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi53aWR0aC5jYWxsKGVsKTsgfTtcclxuICAgIHZhciBmbkhlaWdodCA9IG9wdGlvbnMuaW5jbHVkZUJvcmRlciB8fCBvcHRpb25zLmluY2x1ZGVNYXJnaW4gPyBcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5vdXRlckhlaWdodC5jYWxsKGVsLCBvcHRpb25zLmluY2x1ZGVNYXJnaW4pOyB9IDpcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5oZWlnaHQuY2FsbChlbCk7IH07XHJcblxyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uIChpLCBlbCkge1xyXG4gICAgICB2YXIgZWxRID0gJChlbCk7XHJcbiAgICAgIHZhciBvZmYgPSBlbFEub2Zmc2V0KCk7XHJcbiAgICAgIG9mZi5yaWdodCA9IG9mZi5sZWZ0ICsgZm5XaWR0aCgkKGVsUSkpO1xyXG4gICAgICBvZmYuYm90dG9tID0gb2ZmLnRvcCArIGZuSGVpZ2h0KCQoZWxRKSk7XHJcblxyXG4gICAgICBpZiAob2ZmLmxlZnQgPCBib3VuZHMubGVmdClcclxuICAgICAgICBib3VuZHMubGVmdCA9IG9mZi5sZWZ0O1xyXG5cclxuICAgICAgaWYgKG9mZi50b3AgPCBib3VuZHMudG9wKVxyXG4gICAgICAgIGJvdW5kcy50b3AgPSBvZmYudG9wO1xyXG5cclxuICAgICAgaWYgKG9mZi5yaWdodCA+IGJvdW5kcy5yaWdodClcclxuICAgICAgICBib3VuZHMucmlnaHQgPSBvZmYucmlnaHQ7XHJcblxyXG4gICAgICBpZiAob2ZmLmJvdHRvbSA+IGJvdW5kcy5ib3R0b20pXHJcbiAgICAgICAgYm91bmRzLmJvdHRvbSA9IG9mZi5ib3R0b207XHJcbiAgICB9KTtcclxuXHJcbiAgICBib3VuZHMud2lkdGggPSBib3VuZHMucmlnaHQgLSBib3VuZHMubGVmdDtcclxuICAgIGJvdW5kcy5oZWlnaHQgPSBib3VuZHMuYm90dG9tIC0gYm91bmRzLnRvcDtcclxuICAgIHJldHVybiBib3VuZHM7XHJcbiAgfTtcclxufSkoKTsiLCIvKipcclxuKiBIYXNTY3JvbGxCYXIgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBib29sIHByb3BlcnRpZXMgJ3ZlcnRpY2FsJyBhbmQgJ2hvcml6b250YWwnXHJcbiogc2F5aW5nIGlmIHRoZSBlbGVtZW50IGhhcyBuZWVkIG9mIHNjcm9sbGJhcnMgZm9yIGVhY2ggZGltZW5zaW9uIG9yIG5vdCAoZWxlbWVudFxyXG4qIGNhbiBuZWVkIHNjcm9sbGJhcnMgYW5kIHN0aWxsIG5vdCBiZWluZyBzaG93ZWQgYmVjYXVzZSB0aGUgY3NzLW92ZXJsZmxvdyBwcm9wZXJ0eVxyXG4qIGJlaW5nIHNldCBhcyAnaGlkZGVuJywgYnV0IHN0aWxsIHdlIGtub3cgdGhhdCB0aGUgZWxlbWVudCByZXF1aXJlcyBpdCBhbmQgaXRzXHJcbiogY29udGVudCBpcyBub3QgYmVpbmcgZnVsbHkgZGlzcGxheWVkKS5cclxuKiBAZXh0cmFnYXAsIGRlZmF1bHRzIHRvIHt4OjAseTowfSwgbGV0cyBzcGVjaWZ5IGFuIGV4dHJhIHNpemUgaW4gcGl4ZWxzIGZvciBlYWNoIGRpbWVuc2lvbiB0aGF0IGFsdGVyIHRoZSByZWFsIGNoZWNrLFxyXG4qIHJlc3VsdGluZyBpbiBhIGZha2UgcmVzdWx0IHRoYXQgY2FuIGJlIGludGVyZXN0aW5nIHRvIGRpc2NhcmQgc29tZSBwaXhlbHMgb2YgZXhjZXNzXHJcbiogc2l6ZSAobmVnYXRpdmUgdmFsdWVzKSBvciBleGFnZXJhdGUgdGhlIHJlYWwgdXNlZCBzaXplIHdpdGggdGhhdCBleHRyYSBwaXhlbHMgKHBvc2l0aXZlIHZhbHVlcykuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5oYXNTY3JvbGxCYXIgPSBmdW5jdGlvbiAoZXh0cmFnYXApIHtcclxuICAgIGV4dHJhZ2FwID0gJC5leHRlbmQoe1xyXG4gICAgICAgIHg6IDAsXHJcbiAgICAgICAgeTogMFxyXG4gICAgfSwgZXh0cmFnYXApO1xyXG4gICAgaWYgKCF0aGlzIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4geyB2ZXJ0aWNhbDogZmFsc2UsIGhvcml6b250YWw6IGZhbHNlIH07XHJcbiAgICAvL25vdGU6IGNsaWVudEhlaWdodD0gaGVpZ2h0IG9mIGhvbGRlclxyXG4gICAgLy9zY3JvbGxIZWlnaHQ9IHdlIGhhdmUgY29udGVudCB0aWxsIHRoaXMgaGVpZ2h0XHJcbiAgICB2YXIgdCA9IHRoaXMuZ2V0KDApO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2ZXJ0aWNhbDogdGhpcy5vdXRlckhlaWdodChmYWxzZSkgPCAodC5zY3JvbGxIZWlnaHQgKyBleHRyYWdhcC55KSxcclxuICAgICAgICBob3Jpem9udGFsOiB0aGlzLm91dGVyV2lkdGgoZmFsc2UpIDwgKHQuc2Nyb2xsV2lkdGggKyBleHRyYWdhcC54KVxyXG4gICAgfTtcclxufTsiLCIvKiogQ2hlY2tzIGlmIGN1cnJlbnQgZWxlbWVudCBvciBvbmUgb2YgdGhlIGN1cnJlbnQgc2V0IG9mIGVsZW1lbnRzIGhhc1xyXG5hIHBhcmVudCB0aGF0IG1hdGNoIHRoZSBlbGVtZW50IG9yIGV4cHJlc3Npb24gZ2l2ZW4gYXMgZmlyc3QgcGFyYW1ldGVyXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5pc0NoaWxkT2YgPSBmdW5jdGlvbiBqUXVlcnlfcGx1Z2luX2lzQ2hpbGRPZihleHApIHtcclxuICAgIHJldHVybiB0aGlzLnBhcmVudHMoKS5maWx0ZXIoZXhwKS5sZW5ndGggPiAwO1xyXG59OyIsIi8qKlxyXG4gICAgR2V0cyB0aGUgaHRtbCBzdHJpbmcgb2YgdGhlIGZpcnN0IGVsZW1lbnQgYW5kIGFsbCBpdHMgY29udGVudC5cclxuICAgIFRoZSAnaHRtbCcgbWV0aG9kIG9ubHkgcmV0cmlldmVzIHRoZSBodG1sIHN0cmluZyBvZiB0aGUgY29udGVudCwgbm90IHRoZSBlbGVtZW50IGl0c2VsZi5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLm91dGVySHRtbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICghdGhpcyB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnO1xyXG4gICAgdmFyIGVsID0gdGhpcy5nZXQoMCk7XHJcbiAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgaWYgKGVsLm91dGVySFRNTClcclxuICAgICAgICBodG1sID0gZWwub3V0ZXJIVE1MO1xyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaHRtbCA9IHRoaXMud3JhcEFsbCgnPGRpdj48L2Rpdj4nKS5wYXJlbnQoKS5odG1sKCk7XHJcbiAgICAgICAgdGhpcy51bndyYXAoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBodG1sO1xyXG59OyIsIi8qKlxyXG4gICAgVXNpbmcgdGhlIGF0dHJpYnV0ZSBkYXRhLXNvdXJjZS11cmwgb24gYW55IEhUTUwgZWxlbWVudCxcclxuICAgIHRoaXMgYWxsb3dzIHJlbG9hZCBpdHMgY29udGVudCBwZXJmb3JtaW5nIGFuIEFKQVggb3BlcmF0aW9uXHJcbiAgICBvbiB0aGUgZ2l2ZW4gVVJMIG9yIHRoZSBvbmUgaW4gdGhlIGF0dHJpYnV0ZTsgdGhlIGVuZC1wb2ludFxyXG4gICAgbXVzdCByZXR1cm4gdGV4dC9odG1sIGNvbnRlbnQuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gRGVmYXVsdCBzdWNjZXNzIGNhbGxiYWNrIGFuZCBwdWJsaWMgdXRpbGl0eSwgYmFzaWMgaG93LXRvIHJlcGxhY2UgZWxlbWVudCBjb250ZW50IHdpdGggZmV0Y2hlZCBodG1sXHJcbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoaHRtbENvbnRlbnQsIGNvbnRleHQpIHtcclxuICAgIGNvbnRleHQgPSAkLmlzUGxhaW5PYmplY3QoY29udGV4dCkgJiYgY29udGV4dCA/IGNvbnRleHQgOiB0aGlzO1xyXG5cclxuICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgLy8gQXZvaWQgZW1wdHkgZG9jdW1lbnRzIGJlaW5nIHBhcnNlZCAocmFpc2UgZXJyb3IpXHJcbiAgICBodG1sQ29udGVudCA9ICQudHJpbShodG1sQ29udGVudCk7XHJcbiAgICBpZiAoaHRtbENvbnRlbnQpIHtcclxuICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChodG1sQ29udGVudCkpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIG5ld2h0bWwgPSAkKGh0bWxDb250ZW50KTtcclxuICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGVsZW1lbnQgPSBjb250ZXh0LmVsZW1lbnQ7XHJcbiAgICBpZiAoY29udGV4dC5vcHRpb25zLm1vZGUgPT0gJ3JlcGxhY2UtbWUnKVxyXG4gICAgICAgIGVsZW1lbnQucmVwbGFjZVdpdGgobmV3aHRtbCk7XHJcbiAgICBlbHNlIC8vICdyZXBsYWNlLWNvbnRlbnQnXHJcbiAgICAgICAgZWxlbWVudC5odG1sKG5ld2h0bWwpO1xyXG5cclxuICAgIHJldHVybiBjb250ZXh0O1xyXG59XHJcblxyXG4vLyBEZWZhdWx0IGNvbXBsZXRlIGNhbGxiYWNrIGFuZCBwdWJsaWMgdXRpbGl0eVxyXG5mdW5jdGlvbiBzdG9wTG9hZGluZ1NwaW5uZXIoKSB7XHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5lbGVtZW50KTtcclxufVxyXG5cclxuLy8gRGVmYXVsdHNcclxudmFyIGRlZmF1bHRzID0ge1xyXG4gICAgdXJsOiBudWxsLFxyXG4gICAgc3VjY2VzczogW3VwZGF0ZUVsZW1lbnRdLFxyXG4gICAgZXJyb3I6IFtdLFxyXG4gICAgY29tcGxldGU6IFtzdG9wTG9hZGluZ1NwaW5uZXJdLFxyXG4gICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgbW9kZTogJ3JlcGxhY2UtY29udGVudCcsXHJcbiAgICBsb2FkaW5nOiB7XHJcbiAgICAgICAgbG9ja0VsZW1lbnQ6IHRydWUsXHJcbiAgICAgICAgbG9ja09wdGlvbnM6IHt9LFxyXG4gICAgICAgIG1lc3NhZ2U6IG51bGwsXHJcbiAgICAgICAgc2hvd0xvYWRpbmdJbmRpY2F0b3I6IHRydWUsXHJcbiAgICAgICAgZGVsYXk6IDBcclxuICAgIH1cclxufTtcclxuXHJcbi8qIFJlbG9hZCBtZXRob2QgKi9cclxudmFyIHJlbG9hZCA9ICQuZm4ucmVsb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gT3B0aW9ucyBmcm9tIGRlZmF1bHRzIChpbnRlcm5hbCBhbmQgcHVibGljKVxyXG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIHJlbG9hZC5kZWZhdWx0cyk7XHJcbiAgICAvLyBJZiBvcHRpb25zIG9iamVjdCBpcyBwYXNzZWQgYXMgdW5pcXVlIHBhcmFtZXRlclxyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSAmJiAkLmlzUGxhaW5PYmplY3QoYXJndW1lbnRzWzBdKSkge1xyXG4gICAgICAgIC8vIE1lcmdlIG9wdGlvbnM6XHJcbiAgICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0aW9ucywgYXJndW1lbnRzWzBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ29tbW9uIG92ZXJsb2FkOiBuZXctdXJsIGFuZCBjb21wbGV0ZSBjYWxsYmFjaywgYm90aCBvcHRpb25hbHNcclxuICAgICAgICBvcHRpb25zLnVybCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogbnVsbDtcclxuICAgICAgICBvcHRpb25zLmNvbXBsZXRlID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMudXJsKSB7XHJcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3B0aW9ucy51cmwpKVxyXG4gICAgICAgICAgICAvLyBGdW5jdGlvbiBwYXJhbXM6IGN1cnJlbnRSZWxvYWRVcmwsIGRlZmF1bHRSZWxvYWRVcmxcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ3NvdXJjZS11cmwnLCAkLnByb3h5KG9wdGlvbnMudXJsLCB0aGlzKSgkdC5kYXRhKCdzb3VyY2UtdXJsJyksICR0LmF0dHIoJ2RhdGEtc291cmNlLXVybCcpKSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ3NvdXJjZS11cmwnLCBvcHRpb25zLnVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB1cmwgPSAkdC5kYXRhKCdzb3VyY2UtdXJsJyk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFscmVhZHkgYmVpbmcgcmVsb2FkZWQsIHRvIGNhbmNlbCBwcmV2aW91cyBhdHRlbXB0XHJcbiAgICAgICAgdmFyIGpxID0gJHQuZGF0YSgnaXNSZWxvYWRpbmcnKTtcclxuICAgICAgICBpZiAoanEpIHtcclxuICAgICAgICAgICAgaWYgKGpxLnVybCA9PSB1cmwpXHJcbiAgICAgICAgICAgICAgICAvLyBJcyB0aGUgc2FtZSB1cmwsIGRvIG5vdCBhYm9ydCBiZWNhdXNlIGlzIHRoZSBzYW1lIHJlc3VsdCBiZWluZyByZXRyaWV2ZWRcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAganEuYWJvcnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9wdGlvbmFsIGRhdGEgcGFyYW1ldGVyICdyZWxvYWQtbW9kZScgYWNjZXB0cyB2YWx1ZXM6IFxyXG4gICAgICAgIC8vIC0gJ3JlcGxhY2UtbWUnOiBVc2UgaHRtbCByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgcmVsb2FkZWQgZWxlbWVudCAoYWthOiByZXBsYWNlV2l0aCgpKVxyXG4gICAgICAgIC8vIC0gJ3JlcGxhY2UtY29udGVudCc6IChkZWZhdWx0KSBIdG1sIHJldHVybmVkIHJlcGxhY2UgY3VycmVudCBlbGVtZW50IGNvbnRlbnQgKGFrYTogaHRtbCgpKVxyXG4gICAgICAgIG9wdGlvbnMubW9kZSA9ICR0LmRhdGEoJ3JlbG9hZC1tb2RlJykgfHwgb3B0aW9ucy5tb2RlO1xyXG5cclxuICAgICAgICBpZiAodXJsKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIGRlbGF5XHJcbiAgICAgICAgICAgIHZhciBsb2FkaW5ndGltZXIgPSBvcHRpb25zLmxvYWRpbmcubG9ja0VsZW1lbnQgP1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRpbmcgY29udGVudCB1c2luZyBhIGZha2UgdGVtcCBwYXJlbnQgZWxlbWVudCB0byBwcmVsb2FkIGltYWdlIGFuZCB0byBnZXQgcmVhbCBtZXNzYWdlIHdpZHRoOlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2FkaW5nY29udGVudCA9ICQoJzxkaXYvPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA/ICQoJzxkaXYgY2xhc3M9XCJsb2FkaW5nLW1lc3NhZ2VcIi8+JykuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5tZXNzYWdlKSA6IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChvcHRpb25zLmxvYWRpbmcuc2hvd0xvYWRpbmdJbmRpY2F0b3IgPyBvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA6IG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdjb250ZW50LmNzcyh7IHBvc2l0aW9uOiAnYWJzb2x1dGUnLCBsZWZ0OiAtOTk5OTkgfSkuYXBwZW5kVG8oJ2JvZHknKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdyA9IGxvYWRpbmdjb250ZW50LndpZHRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ2NvbnRlbnQuZGV0YWNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTG9ja2luZzpcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMuYXV0b2ZvY3VzID0gb3B0aW9ucy5hdXRvZm9jdXM7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zLndpZHRoID0gdztcclxuICAgICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGxvYWRpbmdjb250ZW50Lmh0bWwoKSwgJHQsIG9wdGlvbnMubG9hZGluZy5tZXNzYWdlID8gJ2N1c3RvbS1sb2FkaW5nJyA6ICdsb2FkaW5nJywgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMubG9hZGluZy5kZWxheSlcclxuICAgICAgICAgICAgICAgIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIC8vIFByZXBhcmUgY29udGV4dFxyXG4gICAgICAgICAgICB2YXIgY3R4ID0ge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudDogJHQsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgbG9hZGluZ1RpbWVyOiBsb2FkaW5ndGltZXJcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICAgICAgICAganEgPSAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIGNvbnRleHQ6IGN0eFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVybCBpcyBzZXQgaW4gdGhlIHJldHVybmVkIGFqYXggb2JqZWN0IGJlY2F1c2UgaXMgbm90IHNldCBieSBhbGwgdmVyc2lvbnMgb2YgalF1ZXJ5XHJcbiAgICAgICAgICAgIGpxLnVybCA9IHVybDtcclxuXHJcbiAgICAgICAgICAgIC8vIE1hcmsgZWxlbWVudCBhcyBpcyBiZWluZyByZWxvYWRlZCwgdG8gYXZvaWQgbXVsdGlwbGUgYXR0ZW1wcyBhdCBzYW1lIHRpbWUsIHNhdmluZ1xyXG4gICAgICAgICAgICAvLyBjdXJyZW50IGFqYXggb2JqZWN0IHRvIGFsbG93IGJlIGNhbmNlbGxlZFxyXG4gICAgICAgICAgICAkdC5kYXRhKCdpc1JlbG9hZGluZycsIGpxKTtcclxuICAgICAgICAgICAganEuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ2lzUmVsb2FkaW5nJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2FsbGJhY2tzOiBmaXJzdCBnbG9iYWxzIGFuZCB0aGVuIGZyb20gb3B0aW9ucyBpZiB0aGV5IGFyZSBkaWZmZXJlbnRcclxuICAgICAgICAgICAgLy8gc3VjY2Vzc1xyXG4gICAgICAgICAgICBqcS5kb25lKHJlbG9hZC5kZWZhdWx0cy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3VjY2VzcyAhPSByZWxvYWQuZGVmYXVsdHMuc3VjY2VzcylcclxuICAgICAgICAgICAgICAgIGpxLmRvbmUob3B0aW9ucy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgLy8gZXJyb3JcclxuICAgICAgICAgICAganEuZmFpbChyZWxvYWQuZGVmYXVsdHMuZXJyb3IpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5lcnJvciAhPSByZWxvYWQuZGVmYXVsdHMuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICBqcS5mYWlsKG9wdGlvbnMuZXJyb3IpO1xyXG4gICAgICAgICAgICAvLyBjb21wbGV0ZVxyXG4gICAgICAgICAgICBqcS5hbHdheXMocmVsb2FkLmRlZmF1bHRzLmNvbXBsZXRlKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29tcGxldGUgIT0gcmVsb2FkLmRlZmF1bHRzLmNvbXBsZXRlKVxyXG4gICAgICAgICAgICAgICAganEuZG9uZShvcHRpb25zLmNvbXBsZXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLy8gUHVibGljIGRlZmF1bHRzXHJcbnJlbG9hZC5kZWZhdWx0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cyk7XHJcblxyXG4vLyBQdWJsaWMgdXRpbGl0aWVzXHJcbnJlbG9hZC51cGRhdGVFbGVtZW50ID0gdXBkYXRlRWxlbWVudDtcclxucmVsb2FkLnN0b3BMb2FkaW5nU3Bpbm5lciA9IHN0b3BMb2FkaW5nU3Bpbm5lcjtcclxuXHJcbi8vIE1vZHVsZVxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlbG9hZDsiLCIvKiogRXh0ZW5kZWQgdG9nZ2xlLXNob3ctaGlkZSBmdW50aW9ucy5cclxuICAgIElhZ29TUkxAZ21haWwuY29tXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gKiovXHJcbihmdW5jdGlvbigpe1xyXG5cclxuICAgIC8qKiBJbXBsZW1lbnRhdGlvbjogcmVxdWlyZSBqUXVlcnkgYW5kIHJldHVybnMgb2JqZWN0IHdpdGggdGhlXHJcbiAgICAgICAgcHVibGljIG1ldGhvZHMuXHJcbiAgICAgKiovXHJcbiAgICBmdW5jdGlvbiB4dHNoKGpRdWVyeSkge1xyXG4gICAgICAgIHZhciAkID0galF1ZXJ5O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBIaWRlIGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdoaWRlJyBhbmQgJ2ZhZGVPdXQnIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmZhZGVPdXQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLnNsaWRlVXAob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdoaWRlJ1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmhpZGUob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneGhpZGUnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgKiBTaG93IGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdzaG93JyBhbmQgJ2ZhZGVJbicgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgLy8gV2UgcGVyZm9ybXMgYSBmaXggb24gc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHNcclxuICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gZXJyb3IgdGhhdCBwcmV2ZW50cyBmcm9tIHJ1bm5pbmdcclxuICAgICAgICAgICAgLy8gZWZmZWN0cyBvbiBlbGVtZW50cyB0aGF0IGFyZSBhbHJlYWR5IHZpc2libGUsXHJcbiAgICAgICAgICAgIC8vIHdoYXQgbGV0cyB0aGUgcG9zc2liaWxpdHkgb2YgZ2V0IGEgbWlkZGxlLWFuaW1hdGVkXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gV2UganVzdCBjaGFuZ2UgZGlzcGxheTpub25lLCBmb3JjaW5nIHRvICdpcy12aXNpYmxlJyB0b1xyXG4gICAgICAgICAgICAvLyBiZSBmYWxzZSBhbmQgdGhlbiBydW5uaW5nIHRoZSBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGZsaWNrZXJpbmcgZWZmZWN0LCBiZWNhdXNlIGpRdWVyeSBqdXN0IHJlc2V0c1xyXG4gICAgICAgICAgICAvLyBkaXNwbGF5IG9uIGVmZmVjdCBzdGFydC5cclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mYWRlSW4ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2xpZGVEb3duKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnc2hvdydcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNob3cob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneHNob3cnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdlbmVyaWMgdXRpbGl0eSBmb3IgaGlnaGx5IGNvbmZpZ3VyYWJsZSBqUXVlcnkudG9nZ2xlIHdpdGggc3VwcG9ydFxyXG4gICAgICAgICAgICB0byBzcGVjaWZ5IHRoZSB0b2dnbGUgdmFsdWUgZXhwbGljaXR5IGZvciBhbnkga2luZCBvZiBlZmZlY3Q6IGp1c3QgcGFzcyB0cnVlIGFzIHNlY29uZCBwYXJhbWV0ZXIgJ3RvZ2dsZScgdG8gc2hvd1xyXG4gICAgICAgICAgICBhbmQgZmFsc2UgdG8gaGlkZS4gVG9nZ2xlIG11c3QgYmUgc3RyaWN0bHkgYSBCb29sZWFuIHZhbHVlIHRvIGF2b2lkIGF1dG8tZGV0ZWN0aW9uLlxyXG4gICAgICAgICAgICBUb2dnbGUgcGFyYW1ldGVyIGNhbiBiZSBvbWl0dGVkIHRvIGF1dG8tZGV0ZWN0IGl0LCBhbmQgc2Vjb25kIHBhcmFtZXRlciBjYW4gYmUgdGhlIGFuaW1hdGlvbiBvcHRpb25zLlxyXG4gICAgICAgICAgICBBbGwgdGhlIG90aGVycyBiZWhhdmUgZXhhY3RseSBhcyBoaWRlRWxlbWVudCBhbmQgc2hvd0VsZW1lbnQuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlRWxlbWVudChlbGVtZW50LCB0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIG5vdCBhIGJvb2xlYW5cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSAhPT0gdHJ1ZSAmJiB0b2dnbGUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgYW4gb2JqZWN0LCB0aGVuIGlzIHRoZSBvcHRpb25zIGFzIHNlY29uZCBwYXJhbWV0ZXJcclxuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QodG9nZ2xlKSlcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gdG9nZ2xlO1xyXG4gICAgICAgICAgICAgICAgLy8gQXV0by1kZXRlY3QgdG9nZ2xlLCBpdCBjYW4gdmFyeSBvbiBhbnkgZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIC8vIHRoZW4gZGV0ZWN0aW9uIGFuZCBhY3Rpb24gbXVzdCBiZSBkb25lIHBlciBlbGVtZW50OlxyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXVzaW5nIGZ1bmN0aW9uLCB3aXRoIGV4cGxpY2l0IHRvZ2dsZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgISQodGhpcykuaXMoJzp2aXNpYmxlJyksIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSlcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqIERvIGpRdWVyeSBpbnRlZ3JhdGlvbiBhcyB4dG9nZ2xlLCB4c2hvdywgeGhpZGVcclxuICAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gcGx1Z0luKGpRdWVyeSkge1xyXG4gICAgICAgICAgICAvKiogdG9nZ2xlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHh0b2dnbGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHRvZ2dsZSA9IGZ1bmN0aW9uIHh0b2dnbGUodG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsIHRvZ2dsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBzaG93RWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHNob3cgPSBmdW5jdGlvbiB4c2hvdyhvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIGhpZGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueGhpZGUgPSBmdW5jdGlvbiB4aGlkZShvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb3J0aW5nOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQ6IHRvZ2dsZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHNob3dFbGVtZW50OiBzaG93RWxlbWVudCxcclxuICAgICAgICAgICAgaGlkZUVsZW1lbnQ6IGhpZGVFbGVtZW50LFxyXG4gICAgICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9kdWxlXHJcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgeHRzaCk7XHJcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgICAgICB2YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB4dHNoKGpRdWVyeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIE5vcm1hbCBzY3JpcHQgbG9hZCwgaWYgalF1ZXJ5IGlzIGdsb2JhbCAoYXQgd2luZG93KSwgaXRzIGV4dGVuZGVkIGF1dG9tYXRpY2FsbHkgICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHh0c2god2luZG93LmpRdWVyeSkucGx1Z0luKHdpbmRvdy5qUXVlcnkpO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvKiBTb21lIHV0aWxpdGllcyBmb3IgdXNlIHdpdGggalF1ZXJ5IG9yIGl0cyBleHByZXNzaW9uc1xyXG4gICAgdGhhdCBhcmUgbm90IHBsdWdpbnMuXHJcbiovXHJcbmZ1bmN0aW9uIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbICM7JiwuKyp+XFwnOlwiIV4kW1xcXSgpPT58XFwvXSkvZywgJ1xcXFwkMScpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlOiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlXHJcbiAgICB9O1xyXG4iLCIvKiBBc3NldHMgbG9hZGVyIHdpdGggbG9hZGluZyBjb25maXJtYXRpb24gKG1haW5seSBmb3Igc2NyaXB0cylcclxuICAgIGJhc2VkIG9uIE1vZGVybml6ci95ZXBub3BlIGxvYWRlci5cclxuKi9cclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpO1xyXG5cclxuZXhwb3J0cy5sb2FkID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgc2NyaXB0czogW10sXHJcbiAgICAgICAgY29tcGxldGU6IG51bGwsXHJcbiAgICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IG51bGwsXHJcbiAgICAgICAgbG9hZERlbGF5OiAwLFxyXG4gICAgICAgIHRyaWFsc0ludGVydmFsOiA1MDBcclxuICAgIH0sIG9wdHMpO1xyXG4gICAgaWYgKCFvcHRzLnNjcmlwdHMubGVuZ3RoKSByZXR1cm47XHJcbiAgICBmdW5jdGlvbiBwZXJmb3JtQ29tcGxldGUoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAob3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbikgIT09ICdmdW5jdGlvbicgfHwgb3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbigpKVxyXG4gICAgICAgICAgICBvcHRzLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQocGVyZm9ybUNvbXBsZXRlLCBvcHRzLnRyaWFsc0ludGVydmFsKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS53YXJuKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdMQy5sb2FkLmNvbXBsZXRlVmVyaWZpY2F0aW9uIGZhaWxlZCBmb3IgJyArIG9wdHMuc2NyaXB0c1swXSArICcgcmV0cnlpbmcgaXQgaW4gJyArIG9wdHMudHJpYWxzSW50ZXJ2YWwgKyAnbXMnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKHtcclxuICAgICAgICAgICAgbG9hZDogb3B0cy5zY3JpcHRzLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogb3B0cy5jb21wbGV0ZSA/IHBlcmZvcm1Db21wbGV0ZSA6IG51bGxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChvcHRzLmxvYWREZWxheSlcclxuICAgICAgICBzZXRUaW1lb3V0KGxvYWQsIG9wdHMubG9hZERlbGF5KTtcclxuICAgIGVsc2VcclxuICAgICAgICBsb2FkKCk7XHJcbn07IiwiLyotLS0tLS0tLS0tLS1cclxuVXRpbGl0aWVzIHRvIG1hbmlwdWxhdGUgbnVtYmVycywgYWRkaXRpb25hbGx5XHJcbnRvIHRoZSBvbmVzIGF0IE1hdGhcclxuLS0tLS0tLS0tLS0tKi9cclxuXHJcbi8qKiBFbnVtZXJhdGlvbiB0byBiZSB1c2VzIGJ5IGZ1bmN0aW9ucyB0aGF0IGltcGxlbWVudHMgJ3JvdW5kaW5nJyBvcGVyYXRpb25zIG9uIGRpZmZlcmVudFxyXG5kYXRhIHR5cGVzLlxyXG5JdCBob2xkcyB0aGUgZGlmZmVyZW50IHdheXMgYSByb3VuZGluZyBvcGVyYXRpb24gY2FuIGJlIGFwcGx5LlxyXG4qKi9cclxudmFyIHJvdW5kaW5nVHlwZUVudW0gPSB7XHJcbiAgICBEb3duOiAtMSxcclxuICAgIE5lYXJlc3Q6IDAsXHJcbiAgICBVcDogMVxyXG59O1xyXG5cclxuZnVuY3Rpb24gcm91bmRUbyhudW1iZXIsIGRlY2ltYWxzLCByb3VuZGluZ1R5cGUpIHtcclxuICAgIC8vIGNhc2UgTmVhcmVzdCBpcyB0aGUgZGVmYXVsdDpcclxuICAgIHZhciBmID0gbmVhcmVzdFRvO1xyXG4gICAgc3dpdGNoIChyb3VuZGluZ1R5cGUpIHtcclxuICAgICAgICBjYXNlIHJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgZiA9IGZsb29yVG87XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2Ugcm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgZiA9IGNlaWxUbztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZihudW1iZXIsIGRlY2ltYWxzKTtcclxufVxyXG5cclxuLyoqIFJvdW5kIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdCBjYW4gc3Vic3RyYWN0IGludGVnZXIgZGVjaW1hbHMgYnkgcHJvdmlkaW5nIGEgbmVnYXRpdmVcclxubnVtYmVyIG9mIGRlY2ltYWxzLlxyXG4qKi9cclxuZnVuY3Rpb24gbmVhcmVzdFRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLyoqIFJvdW5kIFVwIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgdXAsXHJcbnRvIHRoZSBsb3dlciBpbnRlZ2VyIGdyZWF0ZXIgb3IgZXF1YWxzIHRvIHRoZSBudW1iZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjZWlsVG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBEb3duIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgZG93bixcclxudG8gdGhlIGJpZ2dlciBpbnRlZ2VyIGxvd2VyIG9yIGVxdWFscyB0byB0aGUgbnVtYmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gZmxvb3JUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICByb3VuZGluZ1R5cGVFbnVtOiByb3VuZGluZ1R5cGVFbnVtLFxyXG4gICAgICAgIHJvdW5kVG86IHJvdW5kVG8sXHJcbiAgICAgICAgbmVhcmVzdFRvOiBuZWFyZXN0VG8sXHJcbiAgICAgICAgY2VpbFRvOiBjZWlsVG8sXHJcbiAgICAgICAgZmxvb3JUbzogZmxvb3JUb1xyXG4gICAgfTsiLCJmdW5jdGlvbiBtb3ZlRm9jdXNUbyhlbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBtYXJnaW5Ub3A6IDMwLFxyXG4gICAgICAgIGR1cmF0aW9uOiA1MDBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiAkKGVsKS5vZmZzZXQoKS50b3AgLSBvcHRpb25zLm1hcmdpblRvcCB9LCBvcHRpb25zLmR1cmF0aW9uLCBudWxsKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vdmVGb2N1c1RvO1xyXG59IiwiLyogU29tZSB1dGlsaXRpZXMgdG8gZm9ybWF0IGFuZCBleHRyYWN0IG51bWJlcnMsIGZyb20gdGV4dCBvciBET00uXHJcbiAqL1xyXG52YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBpMThuID0gcmVxdWlyZSgnLi9pMThuJyksXHJcbiAgICBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBnZXRNb25leU51bWJlcih2LCBhbHQpIHtcclxuICAgIGFsdCA9IGFsdCB8fCAwO1xyXG4gICAgaWYgKHYgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgdiA9IHYudmFsKCkgfHwgdi50ZXh0KCk7XHJcbiAgICB2ID0gcGFyc2VGbG9hdCh2XHJcbiAgICAgICAgLnJlcGxhY2UoL1sk4oKsXS9nLCAnJylcclxuICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKExDLm51bWVyaWNNaWxlc1NlcGFyYXRvcltpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY3VsdHVyZV0sICdnJyksICcnKVxyXG4gICAgKTtcclxuICAgIHJldHVybiBpc05hTih2KSA/IGFsdCA6IHY7XHJcbn1cclxuZnVuY3Rpb24gbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSB7XHJcbiAgICB2YXIgY3VsdHVyZSA9IGkxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jdWx0dXJlO1xyXG4gICAgLy8gRmlyc3QsIHJvdW5kIHRvIDIgZGVjaW1hbHNcclxuICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgLy8gR2V0IHRoZSBkZWNpbWFsIHBhcnQgKHJlc3QpXHJcbiAgICB2YXIgcmVzdCA9IE1hdGgucm91bmQodiAqIDEwMCAlIDEwMCk7XHJcbiAgICByZXR1cm4gKCcnICtcclxuICAgIC8vIEludGVnZXIgcGFydCAobm8gZGVjaW1hbHMpXHJcbiAgICAgICAgTWF0aC5mbG9vcih2KSArXHJcbiAgICAvLyBEZWNpbWFsIHNlcGFyYXRvciBkZXBlbmRpbmcgb24gbG9jYWxlXHJcbiAgICAgICAgaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvcltjdWx0dXJlXSArXHJcbiAgICAvLyBEZWNpbWFscywgZXZlciB0d28gZGlnaXRzXHJcbiAgICAgICAgTWF0aC5mbG9vcihyZXN0IC8gMTApICsgcmVzdCAlIDEwXHJcbiAgICApO1xyXG59XHJcbmZ1bmN0aW9uIG51bWJlclRvTW9uZXlTdHJpbmcodikge1xyXG4gICAgdmFyIGNvdW50cnkgPSBpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY291bnRyeTtcclxuICAgIC8vIFR3byBkaWdpdHMgaW4gZGVjaW1hbHMgZm9yIHJvdW5kZWQgdmFsdWUgd2l0aCBtb25leSBzeW1ib2wgYXMgZm9yXHJcbiAgICAvLyBjdXJyZW50IGxvY2FsZVxyXG4gICAgcmV0dXJuIChpMThuLm1vbmV5U3ltYm9sUHJlZml4W2NvdW50cnldICsgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSArIGkxOG4ubW9uZXlTeW1ib2xTdWZpeFtjb3VudHJ5XSk7XHJcbn1cclxuZnVuY3Rpb24gc2V0TW9uZXlOdW1iZXIodiwgZWwpIHtcclxuICAgIC8vIEdldCB2YWx1ZSBpbiBtb25leSBmb3JtYXQ6XHJcbiAgICB2ID0gbnVtYmVyVG9Nb25leVN0cmluZyh2KTtcclxuICAgIC8vIFNldHRpbmcgdmFsdWU6XHJcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgaWYgKGVsLmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICAgZWwudmFsKHYpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZWwudGV4dCh2KTtcclxuICAgIHJldHVybiB2O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBnZXRNb25leU51bWJlcjogZ2V0TW9uZXlOdW1iZXIsXHJcbiAgICAgICAgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZzogbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyxcclxuICAgICAgICBudW1iZXJUb01vbmV5U3RyaW5nOiBudW1iZXJUb01vbmV5U3RyaW5nLFxyXG4gICAgICAgIHNldE1vbmV5TnVtYmVyOiBzZXRNb25leU51bWJlclxyXG4gICAgfTsiLCIvKipcclxuKiBQbGFjZWhvbGRlciBwb2x5ZmlsbC5cclxuKiBBZGRzIGEgbmV3IGpRdWVyeSBwbGFjZUhvbGRlciBtZXRob2QgdG8gc2V0dXAgb3IgcmVhcHBseSBwbGFjZUhvbGRlclxyXG4qIG9uIGVsZW1lbnRzIChyZWNvbW1lbnRlZCB0byBiZSBhcHBseSBvbmx5IHRvIHNlbGVjdG9yICdbcGxhY2Vob2xkZXJdJyk7XHJcbiogdGhhdHMgbWV0aG9kIGlzIGZha2Ugb24gYnJvd3NlcnMgdGhhdCBoYXMgbmF0aXZlIHN1cHBvcnQgZm9yIHBsYWNlaG9sZGVyXHJcbioqL1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0UGxhY2VIb2xkZXJzKCkge1xyXG4gICAgaWYgKE1vZGVybml6ci5pbnB1dC5wbGFjZWhvbGRlcilcclxuICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkgeyB9O1xyXG4gICAgZWxzZVxyXG4gICAgICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvUGxhY2Vob2xkZXIoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdwbGFjZWhvbGRlci1zdXBwb3J0ZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0Lm9uKCdmb2N1c2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkdC5vbignZm9jdXNvdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQuZGF0YSgncGxhY2Vob2xkZXItc3VwcG9ydGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChkb1BsYWNlaG9sZGVyKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgJCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkoKTtcclxufTsiLCIvKiBQb3B1cCBmdW5jdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqXHJcbiogUG9wdXAgcmVsYXRlZCBcclxuKiBmdW5jdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gcG9wdXBTaXplKHNpemUpIHtcclxuICAgIHZhciBzID0gKHNpemUgPT0gJ2xhcmdlJyA/IDAuOCA6IChzaXplID09ICdtZWRpdW0nID8gMC41IDogKHNpemUgPT0gJ3NtYWxsJyA/IDAuMiA6IHNpemUgfHwgMC41KSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB3aWR0aDogTWF0aC5yb3VuZCgkKHdpbmRvdykud2lkdGgoKSAqIHMpLFxyXG4gICAgICAgIGhlaWdodDogTWF0aC5yb3VuZCgkKHdpbmRvdykuaGVpZ2h0KCkgKiBzKSxcclxuICAgICAgICBzaXplRmFjdG9yOiBzXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwU3R5bGUoc2l6ZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdXJzb3I6ICdkZWZhdWx0JyxcclxuICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCArICdweCcsXHJcbiAgICAgICAgbGVmdDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLndpZHRoKCkgLSBzaXplLndpZHRoKSAvIDIpIC0gMjUgKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHQgKyAncHgnLFxyXG4gICAgICAgIHRvcDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLmhlaWdodCgpIC0gc2l6ZS5oZWlnaHQpIC8gMikgLSAzMiArICdweCcsXHJcbiAgICAgICAgcGFkZGluZzogJzM0cHggMjVweCAzMHB4JyxcclxuICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICctbW96LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nJyxcclxuICAgICAgICAnLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnLFxyXG4gICAgICAgICdiYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwKHVybCwgc2l6ZSwgY29tcGxldGUsIGxvYWRpbmdUZXh0LCBvcHRpb25zKSB7XHJcbiAgICBpZiAodHlwZW9mICh1cmwpID09PSAnb2JqZWN0JylcclxuICAgICAgICBvcHRpb25zID0gdXJsO1xyXG5cclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICB1cmw6IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAnJyxcclxuICAgICAgICBzaXplOiBzaXplIHx8IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9LFxyXG4gICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcclxuICAgICAgICBsb2FkaW5nVGV4dDogbG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2xvc2FibGU6IHtcclxuICAgICAgICAgICAgb25Mb2FkOiBmYWxzZSxcclxuICAgICAgICAgICAgYWZ0ZXJMb2FkOiB0cnVlLFxyXG4gICAgICAgICAgICBvbkVycm9yOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvU2l6ZTogZmFsc2UsXHJcbiAgICAgICAgY29udGFpbmVyQ2xhc3M6ICcnLFxyXG4gICAgICAgIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLy8gUHJlcGFyZSBzaXplIGFuZCBsb2FkaW5nXHJcbiAgICBvcHRpb25zLmxvYWRpbmdUZXh0ID0gb3B0aW9ucy5sb2FkaW5nVGV4dCB8fCAnJztcclxuICAgIGlmICh0eXBlb2YgKG9wdGlvbnMuc2l6ZS53aWR0aCkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHBvcHVwU2l6ZShvcHRpb25zLnNpemUpO1xyXG5cclxuICAgICQuYmxvY2tVSSh7XHJcbiAgICAgICAgbWVzc2FnZTogKG9wdGlvbnMuY2xvc2FibGUub25Mb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICtcclxuICAgICAgICc8aW1nIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nICsgb3B0aW9ucy5sb2FkaW5nVGV4dCxcclxuICAgICAgICBjZW50ZXJZOiBmYWxzZSxcclxuICAgICAgICBjc3M6IHBvcHVwU3R5bGUob3B0aW9ucy5zaXplKSxcclxuICAgICAgICBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0sXHJcbiAgICAgICAgZm9jdXNJbnB1dDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTG9hZGluZyBVcmwgd2l0aCBBamF4IGFuZCBwbGFjZSBjb250ZW50IGluc2lkZSB0aGUgYmxvY2tlZC1ib3hcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcclxuICAgICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJCgnLmJsb2NrTXNnJylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhvcHRpb25zLmNvbnRhaW5lckNsYXNzKTtcclxuICAgICAgICAgICAgLy8gQWRkIGNsb3NlIGJ1dHRvbiBpZiByZXF1aXJlcyBpdCBvciBlbXB0eSBtZXNzYWdlIGNvbnRlbnQgdG8gYXBwZW5kIHRoZW4gbW9yZVxyXG4gICAgICAgICAgICBjb250YWluZXIuaHRtbChvcHRpb25zLmNsb3NhYmxlLmFmdGVyTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRIb2xkZXIgPSBjb250YWluZXIuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29udGVudFwiLz4nKS5jaGlsZHJlbignLmNvbnRlbnQnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuQ29kZSAmJiBkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgY29kZSwgc2hvdyByZXN1bHRcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQYWdlIGNvbnRlbnQgZ290LCBwYXN0ZSBpbnRvIHRoZSBwb3B1cCBpZiBpcyBwYXJ0aWFsIGh0bWwgKHVybCBzdGFydHMgd2l0aCAkKVxyXG4gICAgICAgICAgICAgICAgaWYgKC8oKF5cXCQpfChcXC9cXCQpKS8udGVzdChvcHRpb25zLnVybCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRIb2xkZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9TaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2b2lkIG1pc2NhbGN1bGF0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldldpZHRoID0gY29udGVudEhvbGRlclswXS5zdHlsZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRXaWR0aCA9IGNvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udEhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhV2lkdGggPSBjb250YWluZXIub3V0ZXJXaWR0aCh0cnVlKSAtIGNvbnRXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSGVpZ2h0ID0gY29udGFpbmVyLm91dGVySGVpZ2h0KHRydWUpIC0gY29udEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkgLSBleHRyYVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gZXh0cmFIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBhbmQgYXBwbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogYWN0dWFsV2lkdGggPiBtYXhXaWR0aCA/IG1heFdpZHRoIDogYWN0dWFsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGFjdHVhbEhlaWdodCA+IG1heEhlaWdodCA/IG1heEhlaWdodCA6IGFjdHVhbEhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuYW5pbWF0ZShzaXplLCAzMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBtaXNjYWxjdWxhdGlvbnMgY29ycmVjdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgcHJldldpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsIHByZXZIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRWxzZSwgaWYgdXJsIGlzIGEgZnVsbCBodG1sIHBhZ2UgKG5vcm1hbCBwYWdlKSwgcHV0IGNvbnRlbnQgaW50byBhbiBpZnJhbWVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGRhdGEsIHRoaXMub3B0aW9ucy5zaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2tpbmcgZWxlbWVudCBjb250ZW50ICh0aGUgbG9hZGluZykgd2l0aCB0aGUgaWZyYW1lOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZXJyb3I6IGZ1bmN0aW9uIChqLCB0LCBleCkge1xyXG4gICAgICAgICAgICAkKCdkaXYuYmxvY2tNc2cnKS5odG1sKChvcHRpb25zLmNsb3NhYmxlLm9uRXJyb3IgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgKyAnPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5QYWdlIG5vdCBmb3VuZDwvZGl2PicpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmluZm8pIGNvbnNvbGUuaW5mbyhcIlBvcHVwLWFqYXggZXJyb3I6IFwiICsgZXgpO1xyXG4gICAgICAgIH0sIGNvbXBsZXRlOiBvcHRpb25zLmNvbXBsZXRlXHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmV0dXJuZWRCbG9jayA9ICQoJy5ibG9ja1VJJyk7XHJcblxyXG4gICAgcmV0dXJuZWRCbG9jay5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICByZXR1cm5lZEJsb2NrLnRyaWdnZXIoJ3BvcHVwLWNsb3NlZCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuZWRCbG9jay5jbG9zZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0QmxvY2tFbGVtZW50ID0gZnVuY3Rpb24gZ2V0QmxvY2tFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja01zZycpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRDb250ZW50RWxlbWVudCA9IGZ1bmN0aW9uIGdldENvbnRlbnRFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maW5kKCcuY29udGVudCcpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRPdmVybGF5RWxlbWVudCA9IGZ1bmN0aW9uIGdldE92ZXJsYXlFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja092ZXJsYXknKTsgfTtcclxuICAgIHJldHVybiByZXR1cm5lZEJsb2NrO1xyXG59XHJcblxyXG4vKiBTb21lIHBvcHVwIHV0aWxpdGl0ZXMvc2hvcnRoYW5kcyAqL1xyXG5mdW5jdGlvbiBtZXNzYWdlUG9wdXAobWVzc2FnZSwgY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCAnYm9keScpO1xyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2Lz4nKS50ZXh0KG1lc3NhZ2UpO1xyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjb250YWluZXIsICdtZXNzYWdlLXBvcHVwIGZ1bGwtYmxvY2snLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbm5lY3RQb3B1cEFjdGlvbihhcHBseVRvU2VsZWN0b3IpIHtcclxuICAgIGFwcGx5VG9TZWxlY3RvciA9IGFwcGx5VG9TZWxlY3RvciB8fCAnLnBvcHVwLWFjdGlvbic7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBhcHBseVRvU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQoJCh0aGlzKS5hdHRyKCdocmVmJykpLmNsb25lKCk7XHJcbiAgICAgICAgaWYgKGMubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgZG9jdW1lbnQsIG51bGwsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy8gVGhlIHBvcHVwIGZ1bmN0aW9uIGNvbnRhaW5zIGFsbCB0aGUgb3RoZXJzIGFzIG1ldGhvZHNcclxucG9wdXAuc2l6ZSA9IHBvcHVwU2l6ZTtcclxucG9wdXAuc3R5bGUgPSBwb3B1cFN0eWxlO1xyXG5wb3B1cC5jb25uZWN0QWN0aW9uID0gY29ubmVjdFBvcHVwQWN0aW9uO1xyXG5wb3B1cC5tZXNzYWdlID0gbWVzc2FnZVBvcHVwO1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcG9wdXA7IiwiLyoqKiogUG9zdGFsIENvZGU6IG9uIGZseSwgc2VydmVyLXNpZGUgdmFsaWRhdGlvbiAqKioqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIGJhc2VVcmw6ICcvJyxcclxuICAgICAgICBzZWxlY3RvcjogJ1tkYXRhLXZhbC1wb3N0YWxjb2RlXScsXHJcbiAgICAgICAgdXJsOiAnSlNPTi9WYWxpZGF0ZVBvc3RhbENvZGUvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIG9wdGlvbnMuc2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGNvbnRhaW5zIGEgdmFsdWUgKHRoaXMgbm90IHZhbGlkYXRlIGlmIGlzIHJlcXVpcmVkKSBhbmQgXHJcbiAgICAgICAgLy8gaGFzIHRoZSBlcnJvciBkZXNjcmlwdGl2ZSBtZXNzYWdlLCB2YWxpZGF0ZSB0aHJvdWdoIGFqYXhcclxuICAgICAgICB2YXIgcGMgPSAkdC52YWwoKTtcclxuICAgICAgICB2YXIgbXNnID0gJHQuZGF0YSgndmFsLXBvc3RhbGNvZGUnKTtcclxuICAgICAgICBpZiAocGMgJiYgbXNnKSB7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMuYmFzZVVybCArIG9wdGlvbnMudXJsLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogeyBQb3N0YWxDb2RlOiBwYyB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ0pTT04nLFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLlJlc3VsdC5Jc1ZhbGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmFkZENsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoJycpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhbiBzdW1tYXJ5IGVycm9yc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgnPiB1bCA+IGxpJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLnRleHQoKSA9PSBtc2cpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXJyb3IgbGFiZWwgKGlmIHRoZXJlIGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ1tkYXRhLXZhbG1zZy1mb3I9JyArICR0LmF0dHIoJ25hbWUnKSArICddJykudGV4dCgnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLnJlbW92ZUNsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPHNwYW4gZm9yPVwiJyArICR0LmF0dHIoJ25hbWUnKSArICdcIiBnZW5lcmF0ZWQ9XCJ0cnVlXCI+JyArIG1zZyArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgc3VtbWFyeSBlcnJvciAoaWYgdGhlcmUgaXMgbm90KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jaGlsZHJlbigndWwnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxsaT4nICsgbXNnICsgJzwvbGk+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFcnJvciBsYWJlbCAoaWYgdGhlcmUgaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnW2RhdGEtdmFsbXNnLWZvcj0nICsgJHQuYXR0cignbmFtZScpICsgJ10nKS50ZXh0KG1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBsYWJlbCBpcyBub3QgdmlzaWJsZSwganVzdCByZW1vdmUgdGhlIGJhZCBjb2RlIHRvIGxldCB1c2VyIHNlZSB0aGUgcGxhY2Vob2xkZXIgIzUxNFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRsYWJlbCA9ICR0LmNsb3Nlc3QoJ2xhYmVsJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRsYWJlbC5sZW5ndGggJiYgJHQuYXR0cignaWQnKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbGFiZWwgPSAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnbGFiZWxbZm9yPScgKyAkdC5hdHRyKCdpZCcpICsgJ10nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJGxhYmVsLmlzKCc6dmlzaWJsZScpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnZhbCgnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07IiwiLyoqIEFwcGx5IGV2ZXIgYSByZWRpcmVjdCB0byB0aGUgZ2l2ZW4gVVJMLCBpZiB0aGlzIGlzIGFuIGludGVybmFsIFVSTCBvciBzYW1lXHJcbnBhZ2UsIGl0IGZvcmNlcyBhIHBhZ2UgcmVsb2FkIGZvciB0aGUgZ2l2ZW4gVVJMLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVkaXJlY3RUbyh1cmwpIHtcclxuICAgIC8vIEJsb2NrIHRvIGF2b2lkIG1vcmUgdXNlciBpbnRlcmFjdGlvbnM6XHJcbiAgICAkLmJsb2NrVUkoeyBtZXNzYWdlOiAnJyB9KTsgLy9sb2FkaW5nQmxvY2spO1xyXG4gICAgLy8gQ2hlY2tpbmcgaWYgaXMgYmVpbmcgcmVkaXJlY3Rpbmcgb3Igbm90XHJcbiAgICB2YXIgcmVkaXJlY3RlZCA9IGZhbHNlO1xyXG4gICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiBjaGVja1JlZGlyZWN0KCkge1xyXG4gICAgICAgIHJlZGlyZWN0ZWQgPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBOYXZpZ2F0ZSB0byBuZXcgbG9jYXRpb246XHJcbiAgICB3aW5kb3cubG9jYXRpb24gPSB1cmw7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJZiBwYWdlIG5vdCBjaGFuZ2VkIChzYW1lIHVybCBvciBpbnRlcm5hbCBsaW5rKSwgcGFnZSBjb250aW51ZSBleGVjdXRpbmcgdGhlbiByZWZyZXNoOlxyXG4gICAgICAgIGlmICghcmVkaXJlY3RlZClcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSwgNTApO1xyXG59O1xyXG4iLCIvKiogU2FuaXRpemUgdGhlIHdoaXRlc3BhY2VzIGluIGEgdGV4dCBieTpcclxuLSByZXBsYWNpbmcgY29udGlndW91cyB3aGl0ZXNwYWNlcyBjaGFyYWN0ZXJlcyAoYW55IG51bWJlciBvZiByZXBldGl0aW9uIFxyXG5hbmQgYW55IGtpbmQgb2Ygd2hpdGUgY2hhcmFjdGVyKSBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlcGxhY2UgZW5jb2RlZCBub24tYnJlYWtpbmctc3BhY2VzIGJ5IGEgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbi0gcmVtb3ZlIHN0YXJ0aW5nIGFuZCBlbmRpbmcgd2hpdGUtc3BhY2VzXHJcbi0gZXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4qKi9cclxuZnVuY3Rpb24gc2FuaXRpemVXaGl0ZXNwYWNlcyh0ZXh0KSB7XHJcbiAgICAvLyBFdmVyIHJldHVybiBhIHN0cmluZywgZW1wdHkgd2hlbiBudWxsXHJcbiAgICB0ZXh0ID0gKHRleHQgfHwgJycpXHJcbiAgICAvLyBSZXBsYWNlIGFueSBraW5kIG9mIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVycyBieSBhIHNpbmdsZSBub3JtYWwgd2hpdGUtc3BhY2VcclxuICAgIC8vICh0aGF0cyBpbmNsdWRlIHJlcGxhY2UgZW5jb25kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyxcclxuICAgIC8vIGFuZCBkdXBsaWNhdGVkLXJlcGVhdGVkIGFwcGVhcmFuY2VzKVxyXG4gICAgLnJlcGxhY2UoL1xccysvZywgJyAnKTtcclxuICAgIC8vIFJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlc3BhY2VzXHJcbiAgICByZXR1cm4gJC50cmltKHRleHQpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzYW5pdGl6ZVdoaXRlc3BhY2VzOyIsIi8qKiBDdXN0b20gTG9jb25vbWljcyAnbGlrZSBibG9ja1VJJyBwb3B1cHNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUsXHJcbiAgICBhdXRvRm9jdXMgPSByZXF1aXJlKCcuL2F1dG9Gb2N1cycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcblxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9jayhjb250ZW50Qm94LCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykge1xyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcclxuICAgICAgICBjZW50ZXI6IGZhbHNlLFxyXG4gICAgICAgIC8qIGFzIGEgdmFsaWQgb3B0aW9ucyBwYXJhbWV0ZXIgZm9yIExDLmhpZGVFbGVtZW50IGZ1bmN0aW9uICovXHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiA2MDAsXHJcbiAgICAgICAgICAgIGVmZmVjdDogJ2ZhZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgYXV0b2ZvY3VzT3B0aW9uczogeyBtYXJnaW5Ub3A6IDYwIH0sXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgY29udGVudEJveCA9ICQoY29udGVudEJveCk7XHJcbiAgICB2YXIgZnVsbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJsb2NrZWQgPT0gZG9jdW1lbnQgfHwgYmxvY2tlZCA9PSB3aW5kb3cpIHtcclxuICAgICAgICBibG9ja2VkID0gJCgnYm9keScpO1xyXG4gICAgICAgIGZ1bGwgPSB0cnVlO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgYmxvY2tlZCA9ICQoYmxvY2tlZCk7XHJcblxyXG4gICAgdmFyIGJveEluc2lkZUJsb2NrZWQgPSAhYmxvY2tlZC5pcygnYm9keSx0cix0aGVhZCx0Ym9keSx0Zm9vdCx0YWJsZSx1bCxvbCxkbCcpO1xyXG5cclxuICAgIC8vIEdldHRpbmcgYm94IGVsZW1lbnQgaWYgZXhpc3RzIGFuZCByZWZlcmVuY2luZ1xyXG4gICAgdmFyIGJJRCA9IGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcpO1xyXG4gICAgaWYgKCFiSUQpXHJcbiAgICAgICAgYklEID0gKGNvbnRlbnRCb3guYXR0cignaWQnKSB8fCAnJykgKyAoYmxvY2tlZC5hdHRyKCdpZCcpIHx8ICcnKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgaWYgKGJJRCA9PSAnLXNtb290aEJveEJsb2NrJykge1xyXG4gICAgICAgIGJJRCA9ICdpZC0nICsgZ3VpZEdlbmVyYXRvcigpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICB9XHJcbiAgICBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnLCBiSUQpO1xyXG4gICAgdmFyIGJveCA9ICQoJyMnICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShiSUQpKTtcclxuICAgIFxyXG4gICAgLy8gSGlkaW5nL2Nsb3NpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgIGJveC54aGlkZShvcHRpb25zLmNsb3NlT3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIFJlc3RvcmluZyB0aGUgQ1NTIHBvc2l0aW9uIGF0dHJpYnV0ZSBvZiB0aGUgYmxvY2tlZCBlbGVtZW50XHJcbiAgICAgICAgLy8gdG8gYXZvaWQgc29tZSBwcm9ibGVtcyB3aXRoIGxheW91dCBvbiBzb21lIGVkZ2UgY2FzZXMgYWxtb3N0XHJcbiAgICAgICAgLy8gdGhhdCBtYXkgYmUgbm90IGEgcHJvYmxlbSBkdXJpbmcgYmxvY2tpbmcgYnV0IHdoZW4gdW5ibG9ja2VkLlxyXG4gICAgICAgIHZhciBwcmV2ID0gYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJyk7XHJcbiAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgcHJldiB8fCAnJyk7XHJcbiAgICAgICAgYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJywgbnVsbCk7XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICBib3hjXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBudWxsLCBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcsIHRydWUpO1xyXG4gICAgYm94Yy5hcHBlbmQoY29udGVudEJveCk7XHJcbiAgICBib3hjLndpZHRoKG9wdGlvbnMud2lkdGgpO1xyXG4gICAgYm94LmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gaW5zaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQ6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIGJsb2NrZWQuY3NzKCd6LWluZGV4JykgKyAxMCk7XHJcbiAgICAgICAgaWYgKCFibG9ja2VkLmNzcygncG9zaXRpb24nKSB8fCBibG9ja2VkLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJykge1xyXG4gICAgICAgICAgICBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nLCBibG9ja2VkLmNzcygncG9zaXRpb24nKSk7XHJcbiAgICAgICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmNlbnRlciA9PT0gdHJ1ZSB8fCBvcHRpb25zLmNlbnRlciA9PT0gJ3ZlcnRpY2FsJylcclxuICAgICAgICAgICAgYm94Yy5jc3MoJ3RvcCcsIGN0IC0gYm94Yy5vdXRlckhlaWdodCh0cnVlKSAvIDIpO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmNlbnRlciA9PT0gdHJ1ZSB8fCBvcHRpb25zLmNlbnRlciA9PT0gJ2hvcml6b250YWwnKVxyXG4gICAgICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07IiwiLyoqXHJcbioqIE1vZHVsZTo6IHRvb2x0aXBzXHJcbioqIENyZWF0ZXMgc21hcnQgdG9vbHRpcHMgd2l0aCBwb3NzaWJpbGl0aWVzIGZvciBvbiBob3ZlciBhbmQgb24gY2xpY2ssXHJcbioqIGFkZGl0aW9uYWwgZGVzY3JpcHRpb24gb3IgZXh0ZXJuYWwgdG9vbHRpcCBjb250ZW50LlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNhbml0aXplV2hpdGVzcGFjZXMgPSByZXF1aXJlKCcuL3Nhbml0aXplV2hpdGVzcGFjZXMnKTtcclxucmVxdWlyZSgnLi9qcXVlcnkub3V0ZXJIdG1sJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5LmlzQ2hpbGRPZicpO1xyXG5cclxuLy8gTWFpbiBpbnRlcm5hbCBwcm9wZXJ0aWVzXHJcbnZhciBwb3NvZmZzZXQgPSB7IHg6IDE2LCB5OiA4IH07XHJcbnZhciBzZWxlY3RvciA9ICdbdGl0bGVdW2RhdGEtZGVzY3JpcHRpb25dLCBbdGl0bGVdLmhhcy10b29sdGlwLCBbdGl0bGVdLnNlY3VyZS1kYXRhLCBbZGF0YS10b29sdGlwLXVybF0sIFt0aXRsZV0uaGFzLXBvcHVwLXRvb2x0aXAnO1xyXG5cclxuLyoqIFBvc2l0aW9uYXRlIHRoZSB0b29sdGlwIGRlcGVuZGluZyBvbiB0aGVcclxuZXZlbnQgb3IgdGhlIHRhcmdldCBlbGVtZW50IHBvc2l0aW9uIGFuZCBhbiBvZmZzZXRcclxuKiovXHJcbmZ1bmN0aW9uIHBvcyh0LCBlLCBsKSB7XHJcbiAgICB2YXIgeCwgeTtcclxuICAgIGlmIChlLnBhZ2VYICYmIGUucGFnZVkpIHtcclxuICAgICAgICB4ID0gZS5wYWdlWDtcclxuICAgICAgICB5ID0gZS5wYWdlWTtcclxuICAgIH0gZWxzZSBpZiAoZS50YXJnZXQpIHtcclxuICAgICAgICB2YXIgJGV0ID0gJChlLnRhcmdldCk7XHJcbiAgICAgICAgeCA9ICRldC5vdXRlcldpZHRoKCkgKyAkZXQub2Zmc2V0KCkubGVmdDtcclxuICAgICAgICB5ID0gJGV0Lm91dGVySGVpZ2h0KCkgKyAkZXQub2Zmc2V0KCkudG9wO1xyXG4gICAgfVxyXG4gICAgdC5jc3MoJ2xlZnQnLCB4ICsgcG9zb2Zmc2V0LngpO1xyXG4gICAgdC5jc3MoJ3RvcCcsIHkgKyBwb3NvZmZzZXQueSk7XHJcbiAgICAvLyBBZGp1c3Qgd2lkdGggdG8gdmlzaWJsZSB2aWV3cG9ydFxyXG4gICAgdmFyIHRkaWYgPSB0Lm91dGVyV2lkdGgoKSAtIHQud2lkdGgoKTtcclxuICAgIHQuY3NzKCdtYXgtd2lkdGgnLCAkKHdpbmRvdykud2lkdGgoKSAtIHggLSBwb3NvZmZzZXQueCAtIHRkaWYpO1xyXG4gICAgLy90LmhlaWdodCgkKGRvY3VtZW50KS5oZWlnaHQoKSAtIHkgLSBwb3NvZmZzZXQueSk7XHJcbn1cclxuLyoqIEdldCBvciBjcmVhdGUsIGFuZCByZXR1cm5zLCB0aGUgdG9vbHRpcCBjb250ZW50IGZvciB0aGUgZWxlbWVudFxyXG4qKi9cclxuZnVuY3Rpb24gY29uKGwpIHtcclxuICAgIGlmIChsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgYyA9IGwuZGF0YSgndG9vbHRpcC1jb250ZW50JyksXHJcbiAgICAgICAgcGVyc2lzdGVudCA9IGwuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJyk7XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICB2YXIgaCA9IHNhbml0aXplV2hpdGVzcGFjZXMobC5hdHRyKCd0aXRsZScpKTtcclxuICAgICAgICB2YXIgZCA9IHNhbml0aXplV2hpdGVzcGFjZXMobC5kYXRhKCdkZXNjcmlwdGlvbicpKTtcclxuICAgICAgICBpZiAoZClcclxuICAgICAgICAgICAgYyA9ICc8aDQ+JyArIGggKyAnPC9oND48cD4nICsgZCArICc8L3A+JztcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGMgPSBoO1xyXG4gICAgICAgIC8vIEFwcGVuZCBkYXRhLXRvb2x0aXAtdXJsIGNvbnRlbnQgaWYgZXhpc3RzXHJcbiAgICAgICAgdmFyIHVybGNvbnRlbnQgPSAkKGwuZGF0YSgndG9vbHRpcC11cmwnKSk7XHJcbiAgICAgICAgYyA9IChjIHx8ICcnKSArIHVybGNvbnRlbnQub3V0ZXJIdG1sKCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIG9yaWdpbmFsLCBpcyBubyBtb3JlIG5lZWQgYW5kIGF2b2lkIGlkLWNvbmZsaWN0c1xyXG4gICAgICAgIHVybGNvbnRlbnQucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gU2F2ZSB0b29sdGlwIGNvbnRlbnRcclxuICAgICAgICBsLmRhdGEoJ3Rvb2x0aXAtY29udGVudCcsIGMpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBicm93c2VyIHRvb2x0aXAgKGJvdGggd2hlbiB3ZSBhcmUgdXNpbmcgb3VyIG93biB0b29sdGlwIGFuZCB3aGVuIG5vIHRvb2x0aXBcclxuICAgICAgICAvLyBpcyBuZWVkKVxyXG4gICAgICAgIGwuYXR0cigndGl0bGUnLCAnJyk7XHJcbiAgICB9XHJcbiAgICAvLyBSZW1vdmUgdG9vbHRpcCBjb250ZW50IChidXQgcHJlc2VydmUgaXRzIGNhY2hlIGluIHRoZSBlbGVtZW50IGRhdGEpXHJcbiAgICAvLyBpZiBpcyB0aGUgc2FtZSB0ZXh0IGFzIHRoZSBlbGVtZW50IGNvbnRlbnQgYW5kIHRoZSBlbGVtZW50IGNvbnRlbnRcclxuICAgIC8vIGlzIGZ1bGx5IHZpc2libGUuIFRoYXRzLCBmb3IgY2FzZXMgd2l0aCBkaWZmZXJlbnQgY29udGVudCwgd2lsbCBiZSBzaG93ZWQsXHJcbiAgICAvLyBhbmQgZm9yIGNhc2VzIHdpdGggc2FtZSBjb250ZW50IGJ1dCBpcyBub3QgdmlzaWJsZSBiZWNhdXNlIHRoZSBlbGVtZW50XHJcbiAgICAvLyBvciBjb250YWluZXIgd2lkdGgsIHRoZW4gd2lsbCBiZSBzaG93ZWQuXHJcbiAgICAvLyBFeGNlcHQgaWYgaXMgcGVyc2lzdGVudFxyXG4gICAgaWYgKHBlcnNpc3RlbnQgIT09IHRydWUgJiZcclxuICAgICAgICBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwudGV4dCgpKSA9PSBjICYmXHJcbiAgICAgICAgbC5vdXRlcldpZHRoKCkgPj0gbFswXS5zY3JvbGxXaWR0aCkge1xyXG4gICAgICAgIGMgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gY29udGVudDpcclxuICAgIGlmICghYykge1xyXG4gICAgICAgIC8vIFVwZGF0ZSB0YXJnZXQgcmVtb3ZpbmcgdGhlIGNsYXNzIHRvIGF2b2lkIGNzcyBtYXJraW5nIHRvb2x0aXAgd2hlbiB0aGVyZSBpcyBub3RcclxuICAgICAgICBsLnJlbW92ZUNsYXNzKCdoYXMtdG9vbHRpcCcpLnJlbW92ZUNsYXNzKCdoYXMtcG9wdXAtdG9vbHRpcCcpO1xyXG4gICAgfVxyXG4gICAgLy8gUmV0dXJuIHRoZSBjb250ZW50IGFzIHN0cmluZzpcclxuICAgIHJldHVybiBjO1xyXG59XHJcbi8qKiBHZXQgb3IgY3JlYXRlcyB0aGUgc2luZ2xldG9uIGluc3RhbmNlIGZvciBhIHRvb2x0aXAgb2YgdGhlIGdpdmVuIHR5cGVcclxuKiovXHJcbmZ1bmN0aW9uIGdldFRvb2x0aXAodHlwZSkge1xyXG4gICAgdHlwZSA9IHR5cGUgfHwgJ3Rvb2x0aXAnO1xyXG4gICAgdmFyIGlkID0gJ3NpbmdsZXRvbi0nICsgdHlwZTtcclxuICAgIHZhciB0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgaWYgKCF0KSB7XHJcbiAgICAgICAgdCA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZVwiIGNsYXNzPVwidG9vbHRpcFwiPjwvZGl2PicpO1xyXG4gICAgICAgIHQuYXR0cignaWQnLCBpZCk7XHJcbiAgICAgICAgdC5oaWRlKCk7XHJcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0KTtcclxuICAgIH1cclxuICAgIHJldHVybiAkKHQpO1xyXG59XHJcbi8qKiBTaG93IHRoZSB0b29sdGlwIG9uIGFuIGV2ZW50IHRyaWdnZXJlZCBieSB0aGUgZWxlbWVudCBjb250YWluaW5nXHJcbmluZm9ybWF0aW9uIGZvciBhIHRvb2x0aXBcclxuKiovXHJcbmZ1bmN0aW9uIHNob3dUb29sdGlwKGUpIHtcclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgaXNQb3B1cCA9ICR0Lmhhc0NsYXNzKCdoYXMtcG9wdXAtdG9vbHRpcCcpO1xyXG4gICAgLy8gR2V0IG9yIGNyZWF0ZSB0b29sdGlwIGxheWVyXHJcbiAgICB2YXIgdCA9IGdldFRvb2x0aXAoaXNQb3B1cCA/ICdwb3B1cC10b29sdGlwJyA6ICd0b29sdGlwJyk7XHJcbiAgICAvLyBJZiB0aGlzIGlzIG5vdCBwb3B1cCBhbmQgdGhlIGV2ZW50IGlzIGNsaWNrLCBkaXNjYXJkIHdpdGhvdXQgY2FuY2VsIGV2ZW50XHJcbiAgICBpZiAoIWlzUG9wdXAgJiYgZS50eXBlID09ICdjbGljaycpXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGNvbnRlbnQ6IGlmIHRoZXJlIGlzIGNvbnRlbnQsIGNvbnRpbnVlXHJcbiAgICB2YXIgY29udGVudCA9IGNvbigkdCk7XHJcbiAgICBpZiAoY29udGVudCkge1xyXG4gICAgICAgIC8vIElmIGlzIGEgaGFzLXBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgbm90IGEgY2xpY2ssIGRvbid0IHNob3dcclxuICAgICAgICBpZiAoaXNQb3B1cCAmJiBlLnR5cGUgIT0gJ2NsaWNrJylcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgLy8gVGhlIHRvb2x0aXAgc2V0dXAgbXVzdCBiZSBxdWV1ZWQgdG8gYXZvaWQgY29udGVudCB0byBiZSBzaG93ZWQgYW5kIHBsYWNlZFxyXG4gICAgICAgIC8vIHdoZW4gc3RpbGwgaGlkZGVuIHRoZSBwcmV2aW91c1xyXG4gICAgICAgIHQucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBTZXQgdG9vbHRpcCBjb250ZW50XHJcbiAgICAgICAgICAgIHQuaHRtbChjb250ZW50KTtcclxuICAgICAgICAgICAgLy8gRm9yIHBvcHVwcywgc2V0dXAgY2xhc3MgYW5kIGNsb3NlIGJ1dHRvblxyXG4gICAgICAgICAgICBpZiAoaXNQb3B1cCkge1xyXG4gICAgICAgICAgICAgICAgdC5hZGRDbGFzcygncG9wdXAtdG9vbHRpcCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGEgaHJlZj1cIiNjbG9zZS1wb3B1cFwiIGNsYXNzPVwiY2xvc2UtYWN0aW9uXCI+WDwvYT4nKTtcclxuICAgICAgICAgICAgICAgIHQuYXBwZW5kKGNsb3NlQnV0dG9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBQb3NpdGlvbmF0ZVxyXG4gICAgICAgICAgICBwb3ModCwgZSwgJHQpO1xyXG4gICAgICAgICAgICB0LmRlcXVldWUoKTtcclxuICAgICAgICAgICAgLy8gU2hvdyAoYW5pbWF0aW9ucyBhcmUgc3RvcHBlZCBvbmx5IG9uIGhpZGUgdG8gYXZvaWQgY29uZmxpY3RzKVxyXG4gICAgICAgICAgICB0LmZhZGVJbigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0b3AgYnViYmxpbmcgYW5kIGRlZmF1bHRcclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG4vKiogSGlkZSBhbGwgb3BlbmVkIHRvb2x0aXBzLCBmb3IgYW55IHR5cGUuXHJcbkl0IGhhcyBzb21lIHNwZWNpYWwgY29uc2lkZXJhdGlvbnMgZm9yIHBvcHVwLXRvb2x0aXBzIGRlcGVuZGluZ1xyXG5vbiB0aGUgZXZlbnQgYmVpbmcgdHJpZ2dlcmVkLlxyXG4qKi9cclxuZnVuY3Rpb24gaGlkZVRvb2x0aXAoZSkge1xyXG4gICAgJCgnLnRvb2x0aXA6dmlzaWJsZScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBJZiBpcyBhIHBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgbm90IGEgY2xpY2ssIG9yIHRoZSBpbnZlcnNlLFxyXG4gICAgICAgIC8vIHRoaXMgaXMgbm90IGEgcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBhIGNsaWNrLCBkbyBub3RoaW5nXHJcbiAgICAgICAgaWYgKHQuaGFzQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKSAmJiBlLnR5cGUgIT0gJ2NsaWNrJyB8fFxyXG4gICAgICAgICAgICAhdC5oYXNDbGFzcygncG9wdXAtdG9vbHRpcCcpICYmIGUudHlwZSA9PSAnY2xpY2snKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgLy8gU3RvcCBhbmltYXRpb25zIGFuZCBoaWRlXHJcbiAgICAgICAgdC5zdG9wKHRydWUsIHRydWUpLmZhZGVPdXQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG4vKiogSW5pdGlhbGl6ZSB0b29sdGlwc1xyXG4qKi9cclxuZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIC8vIExpc3RlbiBmb3IgZXZlbnRzIHRvIHNob3cvaGlkZSB0b29sdGlwc1xyXG4gICAgJCgnYm9keScpLm9uKCdtb3VzZW1vdmUgZm9jdXNpbicsIHNlbGVjdG9yLCBzaG93VG9vbHRpcClcclxuICAgIC5vbignbW91c2VsZWF2ZSBmb2N1c291dCcsIHNlbGVjdG9yLCBoaWRlVG9vbHRpcClcclxuICAgIC8vIExpc3RlbiBldmVudCBmb3IgY2xpY2thYmxlIHBvcHVwLXRvb2x0aXBzXHJcbiAgICAub24oJ2NsaWNrJywgJ1t0aXRsZV0uaGFzLXBvcHVwLXRvb2x0aXAnLCBzaG93VG9vbHRpcClcclxuICAgIC8vIEFsbG93aW5nIGJ1dHRvbnMgaW5zaWRlIHRoZSB0b29sdGlwXHJcbiAgICAub24oJ2NsaWNrJywgJy50b29sdGlwLWJ1dHRvbicsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgLy8gQWRkaW5nIGNsb3NlLXRvb2x0aXAgaGFuZGxlciBmb3IgcG9wdXAtdG9vbHRpcHMgKGNsaWNrIG9uIGFueSBlbGVtZW50IGV4Y2VwdCB0aGUgdG9vbHRpcCBpdHNlbGYpXHJcbiAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB2YXIgdCA9ICQoJy5wb3B1cC10b29sdGlwOnZpc2libGUnKS5nZXQoMCk7XHJcbiAgICAgICAgLy8gSWYgdGhlIGNsaWNrIGlzIE5vdCBvbiB0aGUgdG9vbHRpcCBvciBhbnkgZWxlbWVudCBjb250YWluZWRcclxuICAgICAgICAvLyBoaWRlIHRvb2x0aXBcclxuICAgICAgICBpZiAoZS50YXJnZXQgIT0gdCAmJiAhJChlLnRhcmdldCkuaXNDaGlsZE9mKHQpKVxyXG4gICAgICAgICAgICBoaWRlVG9vbHRpcChlKTtcclxuICAgIH0pXHJcbiAgICAvLyBBdm9pZCBjbG9zZS1hY3Rpb24gY2xpY2sgZnJvbSByZWRpcmVjdCBwYWdlLCBhbmQgaGlkZSB0b29sdGlwXHJcbiAgICAub24oJ2NsaWNrJywgJy5wb3B1cC10b29sdGlwIC5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBoaWRlVG9vbHRpcChlKTtcclxuICAgIH0pO1xyXG4gICAgdXBkYXRlKCk7XHJcbn1cclxuLyoqIFVwZGF0ZSBlbGVtZW50cyBvbiB0aGUgcGFnZSB0byByZWZsZWN0IGNoYW5nZXMgb3IgbmVlZCBmb3IgdG9vbHRpcHNcclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZShlbGVtZW50X3NlbGVjdG9yKSB7XHJcbiAgICAvLyBSZXZpZXcgZXZlcnkgcG9wdXAgdG9vbHRpcCB0byBwcmVwYXJlIGNvbnRlbnQgYW5kIG1hcmsvdW5tYXJrIHRoZSBsaW5rIG9yIHRleHQ6XHJcbiAgICAkKGVsZW1lbnRfc2VsZWN0b3IgfHwgc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbigkKHRoaXMpKTtcclxuICAgIH0pO1xyXG59XHJcbi8qKiBDcmVhdGUgdG9vbHRpcCBvbiBlbGVtZW50IGJ5IGRlbWFuZFxyXG4qKi9cclxuZnVuY3Rpb24gY3JlYXRlX3Rvb2x0aXAoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdmFyIHNldHRpbmdzID0gJC5leHRlbmQoe30sIHtcclxuICAgICAgdGl0bGU6ICcnXHJcbiAgICAgICwgZGVzY3JpcHRpb246IG51bGxcclxuICAgICAgLCB1cmw6IG51bGxcclxuICAgICAgLCBpc19wb3B1cDogZmFsc2VcclxuICAgICAgLCBwZXJzaXN0ZW50OiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChlbGVtZW50KVxyXG4gICAgLmF0dHIoJ3RpdGxlJywgc2V0dGluZ3MudGl0bGUpXHJcbiAgICAuZGF0YSgnZGVzY3JpcHRpb24nLCBzZXR0aW5ncy5kZXNjcmlwdGlvbilcclxuICAgIC5kYXRhKCdwZXJzaXN0ZW50LXRvb2x0aXAnLCBzZXR0aW5ncy5wZXJzaXN0ZW50KVxyXG4gICAgLmFkZENsYXNzKHNldHRpbmdzLmlzX3BvcHVwID8gJ2hhcy1wb3B1cC10b29sdGlwJyA6ICdoYXMtdG9vbHRpcCcpO1xyXG4gICAgdXBkYXRlKGVsZW1lbnQpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0VG9vbHRpcHM6IGluaXQsXHJcbiAgICAgICAgdXBkYXRlVG9vbHRpcHM6IHVwZGF0ZSxcclxuICAgICAgICBjcmVhdGVUb29sdGlwOiBjcmVhdGVfdG9vbHRpcFxyXG4gICAgfTtcclxuIiwiLyogU29tZSB0b29scyBmb3JtIFVSTCBtYW5hZ2VtZW50XHJcbiovXHJcbmV4cG9ydHMuZ2V0VVJMUGFyYW1ldGVyID0gZnVuY3Rpb24gZ2V0VVJMUGFyYW1ldGVyKG5hbWUpIHtcclxuICAgIHJldHVybiBkZWNvZGVVUkkoXHJcbiAgICAgICAgKFJlZ0V4cChuYW1lICsgJz0nICsgJyguKz8pKCZ8JCknLCAnaScpLmV4ZWMobG9jYXRpb24uc2VhcmNoKSB8fCBbLCBudWxsXSlbMV0pO1xyXG59O1xyXG5leHBvcnRzLmdldEhhc2hCYW5nUGFyYW1ldGVycyA9IGZ1bmN0aW9uIGdldEhhc2hCYW5nUGFyYW1ldGVycyhoYXNoYmFuZ3ZhbHVlKSB7XHJcbiAgICAvLyBIYXNoYmFuZ3ZhbHVlIGlzIHNvbWV0aGluZyBsaWtlOiBUaHJlYWQtMV9NZXNzYWdlLTJcclxuICAgIC8vIFdoZXJlICcxJyBpcyB0aGUgVGhyZWFkSUQgYW5kICcyJyB0aGUgb3B0aW9uYWwgTWVzc2FnZUlELCBvciBvdGhlciBwYXJhbWV0ZXJzXHJcbiAgICB2YXIgcGFycyA9IGhhc2hiYW5ndmFsdWUuc3BsaXQoJ18nKTtcclxuICAgIHZhciB1cmxQYXJhbWV0ZXJzID0ge307XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgcGFyc3ZhbHVlcyA9IHBhcnNbaV0uc3BsaXQoJy0nKTtcclxuICAgICAgICBpZiAocGFyc3ZhbHVlcy5sZW5ndGggPT0gMilcclxuICAgICAgICAgICAgdXJsUGFyYW1ldGVyc1twYXJzdmFsdWVzWzBdXSA9IHBhcnN2YWx1ZXNbMV07XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB1cmxQYXJhbWV0ZXJzW3BhcnN2YWx1ZXNbMF1dID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiB1cmxQYXJhbWV0ZXJzO1xyXG59O1xyXG4iLCIvKiogVmFsaWRhdGlvbiBsb2dpYyB3aXRoIGxvYWQgYW5kIHNldHVwIG9mIHZhbGlkYXRvcnMgYW5kIFxyXG4gICAgdmFsaWRhdGlvbiByZWxhdGVkIHV0aWxpdGllc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpO1xyXG5cclxuLy8gVXNpbmcgb24gc2V0dXAgYXN5bmNyb25vdXMgbG9hZCBpbnN0ZWFkIG9mIHRoaXMgc3RhdGljLWxpbmtlZCBsb2FkXHJcbi8vIHJlcXVpcmUoJ2pxdWVyeS9qcXVlcnkudmFsaWRhdGUubWluLmpzJyk7XHJcbi8vIHJlcXVpcmUoJ2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cFZhbGlkYXRpb24ocmVhcHBseU9ubHlUbykge1xyXG4gICAgcmVhcHBseU9ubHlUbyA9IHJlYXBwbHlPbmx5VG8gfHwgZG9jdW1lbnQ7XHJcbiAgICBpZiAoIXdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkKSB3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCA9IGZhbHNlO1xyXG4gICAgaWYgKCFqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkKSB7XHJcbiAgICAgICAganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgTW9kZXJuaXpyLmxvYWQoW1xyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUubWluLmpzXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qc1wiIH1cclxuICAgICAgICAgICAgXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIENoZWNrIGZpcnN0IGlmIHZhbGlkYXRpb24gaXMgZW5hYmxlZCAoY2FuIGhhcHBlbiB0aGF0IHR3aWNlIGluY2x1ZGVzIG9mXHJcbiAgICAgICAgLy8gdGhpcyBjb2RlIGhhcHBlbiBhdCBzYW1lIHBhZ2UsIGJlaW5nIGV4ZWN1dGVkIHRoaXMgY29kZSBhZnRlciBmaXJzdCBhcHBlYXJhbmNlXHJcbiAgICAgICAgLy8gd2l0aCB0aGUgc3dpdGNoIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgY2hhbmdlZFxyXG4gICAgICAgIC8vIGJ1dCB3aXRob3V0IHZhbGlkYXRpb24gYmVpbmcgYWxyZWFkeSBsb2FkZWQgYW5kIGVuYWJsZWQpXHJcbiAgICAgICAgaWYgKCQgJiYgJC52YWxpZGF0b3IgJiYgJC52YWxpZGF0b3IudW5vYnRydXNpdmUpIHtcclxuICAgICAgICAgICAgLy8gQXBwbHkgdGhlIHZhbGlkYXRpb24gcnVsZXMgdG8gdGhlIG5ldyBlbGVtZW50c1xyXG4gICAgICAgICAgICAkKHJlYXBwbHlPbmx5VG8pLnJlbW92ZURhdGEoJ3ZhbGlkYXRvcicpO1xyXG4gICAgICAgICAgICAkKHJlYXBwbHlPbmx5VG8pLnJlbW92ZURhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gICAgICAgICAgICAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZS5wYXJzZShyZWFwcGx5T25seVRvKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdGllcyAqL1xyXG5cclxuLyogQ2xlYW4gcHJldmlvdXMgdmFsaWRhdGlvbiBlcnJvcnMgb2YgdGhlIHZhbGlkYXRpb24gc3VtbWFyeVxyXG5pbmNsdWRlZCBpbiAnY29udGFpbmVyJyBhbmQgc2V0IGFzIHZhbGlkIHRoZSBzdW1tYXJ5XHJcbiovXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudDtcclxuICAgICQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgIC5maW5kKCc+dWw+bGknKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBTZXQgYWxsIGZpZWxkcyB2YWxpZGF0aW9uIGluc2lkZSB0aGlzIGZvcm0gKGFmZmVjdGVkIGJ5IHRoZSBzdW1tYXJ5IHRvbylcclxuICAgIC8vIGFzIHZhbGlkIHRvb1xyXG4gICAgJCgnLmZpZWxkLXZhbGlkYXRpb24tZXJyb3InLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgIC50ZXh0KCcnKTtcclxuXHJcbiAgICAvLyBSZS1hcHBseSBzZXR1cCB2YWxpZGF0aW9uIHRvIGVuc3VyZSBpcyB3b3JraW5nLCBiZWNhdXNlIGp1c3QgYWZ0ZXIgYSBzdWNjZXNzZnVsXHJcbiAgICAvLyB2YWxpZGF0aW9uLCBhc3AubmV0IHVub2J0cnVzaXZlIHZhbGlkYXRpb24gc3RvcHMgd29ya2luZyBvbiBjbGllbnQtc2lkZS5cclxuICAgIExDLnNldHVwVmFsaWRhdGlvbigpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IoY29udGFpbmVyLCBlcnJvcnMpIHtcclxuICB2YXIgdiA9IGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpO1xyXG4gIHYuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldEVycm9ycyhjb250YWluZXIsIGVycm9ycykge1xyXG4gICAgLy92YXIgdmFsaWRhdG9yID0gJChjb250YWluZXIpLnZhbGlkYXRlKCk7XHJcbiAgICAvL3ZhbGlkYXRvci5zaG93RXJyb3JzKGVycm9ycyk7XHJcbiAgICB2YXIgJHMgPSBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKS5maW5kKCd1bCcpO1xyXG4gICAgdmFyIHdpdGhFcnJvcnMgPSBmYWxzZTtcclxuICAgIGZvcih2YXIgZmllbGQgaW4gZXJyb3JzKSB7XHJcbiAgICAgICAgaWYgKGVycm9ycy5oYXNPd25Qcm9wZXJ0eSAmJiAhZXJyb3JzLmhhc093blByb3BlcnR5KGZpZWxkKSlcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgJCgnPGxpLz4nKS50ZXh0KGVycm9yc1tmaWVsZF0pLmFwcGVuZFRvKCRzKTtcclxuICAgICAgICAvLyQoY29udGFpbmVyKS5maW5kKCdbbmFtZT1cIicgKyBmaWVsZCArICdcIl0nKVxyXG4gICAgICAgIC8vLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAvLy5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCB2YWxpZCcpO1xyXG4gICAgICAgIHdpdGhFcnJvcnMgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKHdpdGhFcnJvcnMpXHJcbiAgICAgICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGNvbnRhaW5lcik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pIHtcclxuICAgIHZhciBvZmYgPSBmb3JtLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykub2Zmc2V0KCk7XHJcbiAgICBpZiAob2ZmKVxyXG4gICAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogb2ZmLnRvcCB9LCA1MDApO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ2dvVG9TdW1tYXJ5RXJyb3JzOiBubyBzdW1tYXJ5IHRvIGZvY3VzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpIHtcclxuICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgcmV0dXJuICQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJywgY29udGFpbmVyKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZXR1cDogc2V0dXBWYWxpZGF0aW9uLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQsXHJcbiAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3I6IHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcixcclxuICAgIGdvVG9TdW1tYXJ5RXJyb3JzOiBnb1RvU3VtbWFyeUVycm9ycyxcclxuICAgIGZpbmRWYWxpZGF0aW9uU3VtbWFyeTogZmluZFZhbGlkYXRpb25TdW1tYXJ5LFxyXG4gICAgc2V0RXJyb3JzOiBzZXRFcnJvcnNcclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIHNvbWUgQWNjb3VudCBwYWdlcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmxvZ2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSBiYXNlVXJsICsgJ0FjY291bnQvJExvZ2luLz9SZXR1cm5Vcmw9JyArIGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24pO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmZvcmdvdC1wYXNzd29yZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9Gb3Jnb3RQYXNzd29yZCcsICcvQWNjb3VudC8kRm9yZ290UGFzc3dvcmQnKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQwMCwgaGVpZ2h0OiAyNDAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5jaGFuZ2UtcGFzc3dvcmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvQ2hhbmdlUGFzc3dvcmQnLCAnL0FjY291bnQvJENoYW5nZVBhc3N3b3JkJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0NTAsIGhlaWdodDogMzQwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8vIE9VUiBuYW1lc3BhY2UgKGFiYnJldmlhdGVkIExvY29ub21pY3MpXHJcbndpbmRvdy5MQyA9IHdpbmRvdy5MQyB8fCB7fTtcclxuXHJcbi8vIFRPRE8gUmV2aWV3IExjVXJsIHVzZSBhcm91bmQgYWxsIHRoZSBtb2R1bGVzLCB1c2UgREkgd2hlbmV2ZXIgcG9zc2libGUgKGluaXQvc2V0dXAgbWV0aG9kIG9yIGluIHVzZSBjYXNlcylcclxuLy8gYnV0IG9ubHkgZm9yIHRoZSB3YW50ZWQgYmFzZVVybCBvbiBlYWNoIGNhc2UgYW5kIG5vdCBwYXNzIGFsbCB0aGUgTGNVcmwgb2JqZWN0LlxyXG4vLyBMY1VybCBpcyBzZXJ2ZXItc2lkZSBnZW5lcmF0ZWQgYW5kIHdyb3RlIGluIGEgTGF5b3V0IHNjcmlwdC10YWcuXHJcblxyXG4vLyBHbG9iYWwgc2V0dGluZ3Ncclxud2luZG93LmdMb2FkaW5nUmV0YXJkID0gMzAwO1xyXG5cclxuLyoqKlxyXG4gKiogTG9hZGluZyBtb2R1bGVzXHJcbioqKi9cclxuLy9UT0RPOiBDbGVhbiBkZXBlbmRlbmNpZXMsIHJlbW92ZSBhbGwgdGhhdCBub3QgdXNlZCBkaXJlY3RseSBpbiB0aGlzIGZpbGUsIGFueSBvdGhlciBmaWxlXHJcbi8vIG9yIHBhZ2UgbXVzdCByZXF1aXJlIGl0cyBkZXBlbmRlbmNpZXMuXHJcblxyXG53aW5kb3cuTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG5cclxuLyogalF1ZXJ5LCBzb21lIHZlbmRvciBwbHVnaW5zIChmcm9tIGJ1bmRsZSkgYW5kIG91ciBhZGRpdGlvbnMgKHNtYWxsIHBsdWdpbnMpLCB0aGV5IGFyZSBhdXRvbWF0aWNhbGx5IHBsdWctZWQgb24gcmVxdWlyZSAqL1xyXG52YXIgJCA9IHdpbmRvdy4kID0gd2luZG93LmpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5iYS1oYXNoY2hhbmdlJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5hcmUnKTtcclxuLy8gTWFza2VkIGlucHV0LCBmb3IgZGF0ZXMgLWF0IG15LWFjY291bnQtLlxyXG5yZXF1aXJlKCdqcXVlcnkuZm9ybWF0dGVyJyk7XHJcblxyXG4vLyBHZW5lcmFsIGNhbGxiYWNrcyBmb3IgQUpBWCBldmVudHMgd2l0aCBjb21tb24gbG9naWNcclxudmFyIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuLi9MQy9hamF4Q2FsbGJhY2tzJyk7XHJcbi8vIEZvcm0uYWpheCBsb2dpYyBhbmQgbW9yZSBzcGVjaWZpYyBjYWxsYmFja3MgYmFzZWQgb24gYWpheENhbGxiYWNrc1xyXG52YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG53aW5kb3cuYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIgPSBhamF4Rm9ybXMub25TdWNjZXNzO1xyXG53aW5kb3cuYWpheEVycm9yUG9wdXBIYW5kbGVyID0gYWpheEZvcm1zLm9uRXJyb3I7XHJcbndpbmRvdy5hamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXIgPSBhamF4Rm9ybXMub25Db21wbGV0ZTtcclxuLy99XHJcblxyXG4vKiBSZWxvYWQgKi9cclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LnJlbG9hZCcpO1xyXG4vLyBXcmFwcGVyIGZ1bmN0aW9uIGFyb3VuZCBvblN1Y2Nlc3MgdG8gbWFyayBvcGVyYXRpb24gYXMgcGFydCBvZiBhIFxyXG4vLyByZWxvYWQgYXZvaWRpbmcgc29tZSBidWdzIChhcyByZXBsYWNlLWNvbnRlbnQgb24gYWpheC1ib3gsIG5vdCB3YW50ZWQgZm9yXHJcbi8vIHJlbG9hZCBvcGVyYXRpb25zKVxyXG5mdW5jdGlvbiByZWxvYWRTdWNjZXNzV3JhcHBlcigpIHtcclxuICB2YXIgY29udGV4dCA9ICQuaXNQbGFpbk9iamVjdCh0aGlzKSA/IHRoaXMgOiB7IGVsZW1lbnQ6IHRoaXMgfTtcclxuICBjb250ZXh0LmlzUmVsb2FkID0gdHJ1ZTtcclxuICBhamF4Rm9ybXMub25TdWNjZXNzLmFwcGx5KGNvbnRleHQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xyXG59XHJcbiQuZm4ucmVsb2FkLmRlZmF1bHRzID0ge1xyXG4gIHN1Y2Nlc3M6IFtyZWxvYWRTdWNjZXNzV3JhcHBlcl0sXHJcbiAgZXJyb3I6IFthamF4Rm9ybXMub25FcnJvcl0sXHJcbiAgZGVsYXk6IGdMb2FkaW5nUmV0YXJkXHJcbn07XHJcblxyXG5MQy5tb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4uL0xDL21vdmVGb2N1c1RvJyk7XHJcbi8qIERpc2FibGVkIGJlY2F1c2UgY29uZmxpY3RzIHdpdGggdGhlIG1vdmVGb2N1c1RvIG9mIFxyXG4gIGFqYXhGb3JtLm9uc3VjY2VzcywgaXQgaGFwcGVucyBhIGJsb2NrLmxvYWRpbmcganVzdCBhZnRlclxyXG4gIHRoZSBzdWNjZXNzIGhhcHBlbnMuXHJcbiQuYmxvY2tVSS5kZWZhdWx0cy5vbkJsb2NrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gU2Nyb2xsIHRvIGJsb2NrLW1lc3NhZ2UgdG8gZG9uJ3QgbG9zdCBpbiBsYXJnZSBwYWdlczpcclxuICAgIExDLm1vdmVGb2N1c1RvKHRoaXMpO1xyXG59OyovXHJcblxyXG52YXIgbG9hZGVyID0gcmVxdWlyZSgnLi4vTEMvbG9hZGVyJyk7XHJcbkxDLmxvYWQgPSBsb2FkZXIubG9hZDtcclxuXHJcbnZhciBibG9ja3MgPSBMQy5ibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuLi9MQy9ibG9ja1ByZXNldHMnKTtcclxuLy97VEVNUFxyXG53aW5kb3cubG9hZGluZ0Jsb2NrID0gYmxvY2tzLmxvYWRpbmc7XHJcbndpbmRvdy5pbmZvQmxvY2sgPSBibG9ja3MuaW5mbztcclxud2luZG93LmVycm9yQmxvY2sgPSBibG9ja3MuZXJyb3I7XHJcbi8vfVxyXG5cclxuQXJyYXkucmVtb3ZlID0gcmVxdWlyZSgnLi4vTEMvQXJyYXkucmVtb3ZlJyk7XHJcbnJlcXVpcmUoJy4uL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMnKTtcclxuXHJcbkxDLmdldFRleHQgPSByZXF1aXJlKCcuLi9MQy9nZXRUZXh0Jyk7XHJcblxyXG52YXIgVGltZVNwYW4gPSBMQy50aW1lU3BhbiA9IHJlcXVpcmUoJy4uL0xDL1RpbWVTcGFuJyk7XHJcbnZhciB0aW1lU3BhbkV4dHJhID0gcmVxdWlyZSgnLi4vTEMvVGltZVNwYW5FeHRyYScpO1xyXG50aW1lU3BhbkV4dHJhLnBsdWdJbihUaW1lU3Bhbik7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc2VzXHJcbkxDLnNtYXJ0VGltZSA9IHRpbWVTcGFuRXh0cmEuc21hcnRUaW1lO1xyXG5MQy5yb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyID0gdGltZVNwYW5FeHRyYS5yb3VuZFRvUXVhcnRlckhvdXI7XHJcbi8vfVxyXG5cclxuTEMuQ2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4uL0xDL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxud2luZG93LlRhYmJlZFVYID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVgnKTtcclxudmFyIHNsaWRlclRhYnMgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5zbGlkZXJUYWJzJyk7XHJcblxyXG4vLyBQb3B1cCBBUElzXHJcbndpbmRvdy5zbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4uL0xDL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG52YXIgcG9wdXAgPSByZXF1aXJlKCcuLi9MQy9wb3B1cCcpO1xyXG4vL3tURU1QXHJcbnZhciBwb3B1cFN0eWxlID0gcG9wdXAuc3R5bGUsXHJcbiAgICBwb3B1cFNpemUgPSBwb3B1cC5zaXplO1xyXG5MQy5tZXNzYWdlUG9wdXAgPSBwb3B1cC5tZXNzYWdlO1xyXG5MQy5jb25uZWN0UG9wdXBBY3Rpb24gPSBwb3B1cC5jb25uZWN0QWN0aW9uO1xyXG53aW5kb3cucG9wdXAgPSBwb3B1cDtcclxuLy99XHJcblxyXG5MQy5zYW5pdGl6ZVdoaXRlc3BhY2VzID0gcmVxdWlyZSgnLi4vTEMvc2FuaXRpemVXaGl0ZXNwYWNlcycpO1xyXG4vL3tURU1QICAgYWxpYXMgYmVjYXVzZSBtaXNzcGVsbGluZ1xyXG5MQy5zYW5pdGl6ZVdoaXRlcGFjZXMgPSBMQy5zYW5pdGl6ZVdoaXRlc3BhY2VzO1xyXG4vL31cclxuXHJcbkxDLmdldFhQYXRoID0gcmVxdWlyZSgnLi4vTEMvZ2V0WFBhdGgnKTtcclxuXHJcbnZhciBzdHJpbmdGb3JtYXQgPSByZXF1aXJlKCcuLi9MQy9TdHJpbmdGb3JtYXQnKTtcclxuXHJcbi8vIEV4cGFuZGluZyBleHBvcnRlZCB1dGlsaXRlcyBmcm9tIG1vZHVsZXMgZGlyZWN0bHkgYXMgTEMgbWVtYmVyczpcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL1ByaWNlJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvbWF0aFV0aWxzJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvbnVtYmVyVXRpbHMnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy90b29sdGlwcycpKTtcclxudmFyIGkxOG4gPSBMQy5pMThuID0gcmVxdWlyZSgnLi4vTEMvaTE4bicpO1xyXG4vL3tURU1QIG9sZCBhbGlzZXMgb24gTEMgYW5kIGdsb2JhbFxyXG4kLmV4dGVuZChMQywgaTE4bik7XHJcbiQuZXh0ZW5kKHdpbmRvdywgaTE4bik7XHJcbi8vfVxyXG5cclxuLy8geHRzaDogcGx1Z2VkIGludG8ganF1ZXJ5IGFuZCBwYXJ0IG9mIExDXHJcbnZhciB4dHNoID0gcmVxdWlyZSgnLi4vTEMvanF1ZXJ5Lnh0c2gnKTtcclxueHRzaC5wbHVnSW4oJCk7XHJcbi8ve1RFTVAgICByZW1vdmUgb2xkIExDLiogYWxpYXNcclxuJC5leHRlbmQoTEMsIHh0c2gpO1xyXG5kZWxldGUgTEMucGx1Z0luO1xyXG4vL31cclxuXHJcbnZhciBhdXRvQ2FsY3VsYXRlID0gTEMuYXV0b0NhbGN1bGF0ZSA9IHJlcXVpcmUoJy4uL0xDL2F1dG9DYWxjdWxhdGUnKTtcclxuLy97VEVNUCAgIHJlbW92ZSBvbGQgYWxpYXMgdXNlXHJcbnZhciBsY1NldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyA9IGF1dG9DYWxjdWxhdGUub25UYWJsZUl0ZW1zO1xyXG5MQy5zZXR1cENhbGN1bGF0ZVN1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLm9uU3VtbWFyeTtcclxuTEMudXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUudXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeTtcclxuTEMuc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS5vbkRldGFpbGVkUHJpY2luZ1N1bW1hcnk7XHJcbi8vfVxyXG5cclxudmFyIENvb2tpZSA9IExDLkNvb2tpZSA9IHJlcXVpcmUoJy4uL0xDL0Nvb2tpZScpO1xyXG4vL3tURU1QICAgIG9sZCBhbGlhc1xyXG52YXIgZ2V0Q29va2llID0gQ29va2llLmdldCxcclxuICAgIHNldENvb2tpZSA9IENvb2tpZS5zZXQ7XHJcbi8vfVxyXG5cclxuTEMuZGF0ZVBpY2tlciA9IHJlcXVpcmUoJy4uL0xDL2RhdGVQaWNrZXInKTtcclxuLy97VEVNUCAgIG9sZCBhbGlhc1xyXG53aW5kb3cuc2V0dXBEYXRlUGlja2VyID0gTEMuc2V0dXBEYXRlUGlja2VyID0gTEMuZGF0ZVBpY2tlci5pbml0O1xyXG53aW5kb3cuYXBwbHlEYXRlUGlja2VyID0gTEMuYXBwbHlEYXRlUGlja2VyID0gTEMuZGF0ZVBpY2tlci5hcHBseTtcclxuLy99XHJcblxyXG5MQy5hdXRvRm9jdXMgPSByZXF1aXJlKCcuLi9MQy9hdXRvRm9jdXMnKTtcclxuXHJcbi8vIENSVURMOiBsb2FkaW5nIG1vZHVsZSwgc2V0dGluZyB1cCBjb21tb24gZGVmYXVsdCB2YWx1ZXMgYW5kIGNhbGxiYWNrczpcclxudmFyIGNydWRsTW9kdWxlID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKTtcclxuY3J1ZGxNb2R1bGUuZGVmYXVsdFNldHRpbmdzLmRhdGFbJ2ZvY3VzLWNsb3Nlc3QnXVsnZGVmYXVsdCddID0gJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbic7XHJcbmNydWRsTW9kdWxlLmRlZmF1bHRTZXR0aW5ncy5kYXRhWydmb2N1cy1tYXJnaW4nXVsnZGVmYXVsdCddID0gMTA7XHJcbnZhciBjcnVkbCA9IGNydWRsTW9kdWxlLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vIFByZXZpb3VzIHVzZWQgYWxpYXMgKGRlcHJlY2F0ZWQpOlxyXG5MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxuXHJcbi8vIFVJIFNsaWRlciBMYWJlbHNcclxudmFyIHNsaWRlckxhYmVscyA9IHJlcXVpcmUoJy4uL0xDL1VJU2xpZGVyTGFiZWxzJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG5MQy5jcmVhdGVMYWJlbHNGb3JVSVNsaWRlciA9IHNsaWRlckxhYmVscy5jcmVhdGU7XHJcbkxDLnVwZGF0ZUxhYmVsc0ZvclVJU2xpZGVyID0gc2xpZGVyTGFiZWxzLnVwZGF0ZTtcclxuTEMudWlTbGlkZXJMYWJlbHNMYXlvdXRzID0gc2xpZGVyTGFiZWxzLmxheW91dHM7XHJcbi8vfVxyXG5cclxudmFyIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuLi9MQy92YWxpZGF0aW9uSGVscGVyJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG5MQy5zZXR1cFZhbGlkYXRpb24gPSB2YWxpZGF0aW9uSGVscGVyLnNldHVwO1xyXG5MQy5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQgPSB2YWxpZGF0aW9uSGVscGVyLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDtcclxuTEMuZ29Ub1N1bW1hcnlFcnJvcnMgPSB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzO1xyXG4vL31cclxuXHJcbkxDLnBsYWNlSG9sZGVyID0gcmVxdWlyZSgnLi4vTEMvcGxhY2Vob2xkZXItcG9seWZpbGwnKS5pbml0O1xyXG5cclxuTEMubWFwUmVhZHkgPSByZXF1aXJlKCcuLi9MQy9nb29nbGVNYXBSZWFkeScpO1xyXG5cclxud2luZG93LmlzRW1wdHlTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9pc0VtcHR5U3RyaW5nJyk7XHJcblxyXG53aW5kb3cuZ3VpZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL0xDL2d1aWRHZW5lcmF0b3InKTtcclxuXHJcbnZhciB1cmxVdGlscyA9IHJlcXVpcmUoJy4uL0xDL3VybFV0aWxzJyk7XHJcbndpbmRvdy5nZXRVUkxQYXJhbWV0ZXIgPSB1cmxVdGlscy5nZXRVUkxQYXJhbWV0ZXI7XHJcbndpbmRvdy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSB1cmxVdGlscy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnM7XHJcblxyXG52YXIgZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nJyk7XHJcbi8ve1RFTVBcclxuTEMuZGF0ZVRvSW50ZXJjaGFuZ2xlU3RyaW5nID0gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nO1xyXG4vL31cclxuXHJcbi8vIFBhZ2VzIGluIHBvcHVwXHJcbnZhciB3ZWxjb21lUG9wdXAgPSByZXF1aXJlKCcuL3dlbGNvbWVQb3B1cCcpO1xyXG52YXIgZmFxc1BvcHVwcyA9IHJlcXVpcmUoJy4vZmFxc1BvcHVwcycpO1xyXG52YXIgYWNjb3VudFBvcHVwcyA9IHJlcXVpcmUoJy4vYWNjb3VudFBvcHVwcycpO1xyXG52YXIgbGVnYWxQb3B1cHMgPSByZXF1aXJlKCcuL2xlZ2FsUG9wdXBzJyk7XHJcblxyXG4vLyBPbGQgYXZhaWxhYmxpdHkgY2FsZW5kYXJcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0ID0gcmVxdWlyZSgnLi9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldCcpO1xyXG4vLyBOZXcgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhciA9IHJlcXVpcmUoJy4uL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyJyk7XHJcblxyXG52YXIgYXV0b2ZpbGxTdWJtZW51ID0gcmVxdWlyZSgnLi4vTEMvYXV0b2ZpbGxTdWJtZW51Jyk7XHJcblxyXG52YXIgdGFiYmVkV2l6YXJkID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVgud2l6YXJkJyk7XHJcblxyXG52YXIgaGFzQ29uZmlybVN1cHBvcnQgPSByZXF1aXJlKCcuLi9MQy9oYXNDb25maXJtU3VwcG9ydCcpO1xyXG5cclxudmFyIHBvc3RhbENvZGVWYWxpZGF0aW9uID0gcmVxdWlyZSgnLi4vTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24nKTtcclxuXHJcbnZhciB0YWJiZWROb3RpZmljYXRpb25zID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxudmFyIHRhYnNBdXRvbG9hZCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLmF1dG9sb2FkJyk7XHJcblxyXG52YXIgaG9tZVBhZ2UgPSByZXF1aXJlKCcuL2hvbWUnKTtcclxuXHJcbi8ve1RFTVAgcmVtb3ZlIGdsb2JhbCBkZXBlbmRlbmN5IGZvciB0aGlzXHJcbndpbmRvdy5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi4vTEMvanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG4vL31cclxuXHJcbnZhciBwcm92aWRlcldlbGNvbWUgPSByZXF1aXJlKCcuL3Byb3ZpZGVyV2VsY29tZScpO1xyXG5cclxuLyoqXHJcbiAqKiBJbml0IGNvZGVcclxuKioqL1xyXG4kKHdpbmRvdykubG9hZChmdW5jdGlvbiAoKSB7XHJcbiAgLy8gRGlzYWJsZSBicm93c2VyIGJlaGF2aW9yIHRvIGF1dG8tc2Nyb2xsIHRvIHVybCBmcmFnbWVudC9oYXNoIGVsZW1lbnQgcG9zaXRpb246XHJcbiAgLy8gRVhDRVBUIGluIERhc2hib2FyZDpcclxuICAvLyBUT0RPOiBSZXZpZXcgaWYgdGhpcyBpcyByZXF1aXJlZCBvbmx5IGZvciBIb3dJdFdvcmtzIG9yIHNvbWV0aGluZyBtb3JlICh0YWJzLCBwcm9maWxlKVxyXG4gIC8vIGFuZCByZW1vdmUgaWYgcG9zc2libGUgb3Igb25seSBvbiB0aGUgY29uY3JldGUgY2FzZXMuXHJcbiAgaWYgKCEvXFwvZGFzaGJvYXJkXFwvL2kudGVzdChsb2NhdGlvbikpXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgJCgnaHRtbCxib2R5Jykuc2Nyb2xsVG9wKDApOyB9LCAxKTtcclxufSk7XHJcbiQoZnVuY3Rpb24gKCkge1xyXG5cclxuICBwcm92aWRlcldlbGNvbWUuc2hvdygpO1xyXG5cclxuICAvLyBQbGFjZWhvbGRlciBwb2x5ZmlsbFxyXG4gIExDLnBsYWNlSG9sZGVyKCk7XHJcblxyXG4gIC8vIEF1dG9mb2N1cyBwb2x5ZmlsbFxyXG4gIExDLmF1dG9Gb2N1cygpO1xyXG5cclxuICAvLyBHZW5lcmljIHNjcmlwdCBmb3IgZW5oYW5jZWQgdG9vbHRpcHMgYW5kIGVsZW1lbnQgZGVzY3JpcHRpb25zXHJcbiAgTEMuaW5pdFRvb2x0aXBzKCk7XHJcblxyXG4gIGFqYXhGb3Jtcy5pbml0KCk7XHJcblxyXG4gIHdlbGNvbWVQb3B1cC5pbml0KCk7XHJcblxyXG4gIC8vIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyBmb3Igc29tZSBsaW5rcyB0aGF0IGJ5IGRlZmF1bHQgb3BlbiBhIG5ldyB0YWI6XHJcbiAgZmFxc1BvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gIGFjY291bnRQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuICBsZWdhbFBvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG5cclxuICAvLyBPbGQgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbiAgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuaW5pdChMY1VybC5MYW5nUGF0aCk7XHJcbiAgLy8gTmV3IGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG4gIGF2YWlsYWJpbGl0eUNhbGVuZGFyLldlZWtseS5lbmFibGVBbGwoKTtcclxuXHJcbiAgcG9wdXAuY29ubmVjdEFjdGlvbigpO1xyXG5cclxuICAvLyBEYXRlIFBpY2tlclxyXG4gIExDLmRhdGVQaWNrZXIuaW5pdCgpO1xyXG5cclxuICAvKiBBdXRvIGNhbGN1bGF0ZSB0YWJsZSBpdGVtcyB0b3RhbCAocXVhbnRpdHkqdW5pdHByaWNlPWl0ZW0tdG90YWwpIHNjcmlwdCAqL1xyXG4gIGF1dG9DYWxjdWxhdGUub25UYWJsZUl0ZW1zKCk7XHJcbiAgYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnkoKTtcclxuXHJcbiAgaGFzQ29uZmlybVN1cHBvcnQub24oKTtcclxuXHJcbiAgcG9zdGFsQ29kZVZhbGlkYXRpb24uaW5pdCh7IGJhc2VVcmw6IExjVXJsLkxhbmdQYXRoIH0pO1xyXG5cclxuICAvLyBUYWJiZWQgaW50ZXJmYWNlXHJcbiAgdGFic0F1dG9sb2FkLmluaXQoVGFiYmVkVVgpO1xyXG4gIFRhYmJlZFVYLmluaXQoKTtcclxuICBUYWJiZWRVWC5mb2N1c0N1cnJlbnRMb2NhdGlvbigpO1xyXG4gIFRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzKCk7XHJcbiAgc2xpZGVyVGFicy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgdGFiYmVkV2l6YXJkLmluaXQoVGFiYmVkVVgsIHtcclxuICAgIGxvYWRpbmdEZWxheTogZ0xvYWRpbmdSZXRhcmRcclxuICB9KTtcclxuXHJcbiAgdGFiYmVkTm90aWZpY2F0aW9ucy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgYXV0b2ZpbGxTdWJtZW51KCk7XHJcblxyXG4gIC8vIFRPRE86ICdsb2FkSGFzaEJhbmcnIGN1c3RvbSBldmVudCBpbiB1c2U/XHJcbiAgLy8gSWYgdGhlIGhhc2ggdmFsdWUgZm9sbG93IHRoZSAnaGFzaCBiYW5nJyBjb252ZW50aW9uLCBsZXQgb3RoZXJcclxuICAvLyBzY3JpcHRzIGRvIHRoZWlyIHdvcmsgdGhyb3VnaHQgYSAnbG9hZEhhc2hCYW5nJyBldmVudCBoYW5kbGVyXHJcbiAgaWYgKC9eIyEvLnRlc3Qod2luZG93LmxvY2F0aW9uLmhhc2gpKVxyXG4gICAgJChkb2N1bWVudCkudHJpZ2dlcignbG9hZEhhc2hCYW5nJywgd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpKTtcclxuXHJcbiAgLy8gUmVsb2FkIGJ1dHRvbnNcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnJlbG9hZC1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBHZW5lcmljIGFjdGlvbiB0byBjYWxsIGxjLmpxdWVyeSAncmVsb2FkJyBmdW5jdGlvbiBmcm9tIGFuIGVsZW1lbnQgaW5zaWRlIGl0c2VsZi5cclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAkdC5jbG9zZXN0KCR0LmRhdGEoJ3JlbG9hZC10YXJnZXQnKSkucmVsb2FkKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8qIEVuYWJsZSBmb2N1cyB0YWIgb24gZXZlcnkgaGFzaCBjaGFuZ2UsIG5vdyB0aGVyZSBhcmUgdHdvIHNjcmlwdHMgbW9yZSBzcGVjaWZpYyBmb3IgdGhpczpcclxuICAqIG9uZSB3aGVuIHBhZ2UgbG9hZCAod2hlcmU/KSxcclxuICAqIGFuZCBhbm90aGVyIG9ubHkgZm9yIGxpbmtzIHdpdGggJ3RhcmdldC10YWInIGNsYXNzLlxyXG4gICogTmVlZCBiZSBzdHVkeSBpZiBzb21ldGhpbmcgb2YgdGhlcmUgbXVzdCBiZSByZW1vdmVkIG9yIGNoYW5nZWQuXHJcbiAgKiBUaGlzIGlzIG5lZWRlZCBmb3Igb3RoZXIgYmVoYXZpb3JzIHRvIHdvcmsuICovXHJcbiAgLy8gT24gdGFyZ2V0LXRhYiBsaW5rc1xyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhLnRhcmdldC10YWInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgdGhlcmVJc1RhYiA9IFRhYmJlZFVYLmdldFRhYigkKHRoaXMpLmF0dHIoJ2hyZWYnKSk7XHJcbiAgICBpZiAodGhlcmVJc1RhYikge1xyXG4gICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIC8vIE9uIGhhc2ggY2hhbmdlXHJcbiAgaWYgKCQuZm4uaGFzaGNoYW5nZSlcclxuICAgICQod2luZG93KS5oYXNoY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgaWYgKCEvXiMhLy50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICAgICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgaWYgKHRoZXJlSXNUYWIpXHJcbiAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIC8vIEhPTUUgUEFHRSAvIFNFQVJDSCBTVFVGRlxyXG4gIGhvbWVQYWdlLmluaXQoKTtcclxuXHJcbiAgLy8gVmFsaWRhdGlvbiBhdXRvIHNldHVwIGZvciBwYWdlIHJlYWR5IGFuZCBhZnRlciBldmVyeSBhamF4IHJlcXVlc3RcclxuICAvLyBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGZvcm0gaW4gdGhlIHBhZ2UuXHJcbiAgLy8gVGhpcyBhdm9pZCB0aGUgbmVlZCBmb3IgZXZlcnkgcGFnZSB3aXRoIGZvcm0gdG8gZG8gdGhlIHNldHVwIGl0c2VsZlxyXG4gIC8vIGFsbW9zdCBmb3IgbW9zdCBvZiB0aGUgY2FzZS5cclxuICBmdW5jdGlvbiBhdXRvU2V0dXBWYWxpZGF0aW9uKCkge1xyXG4gICAgaWYgKCQoZG9jdW1lbnQpLmhhcygnZm9ybScpLmxlbmd0aClcclxuICAgICAgdmFsaWRhdGlvbkhlbHBlci5zZXR1cCgnZm9ybScpO1xyXG4gIH1cclxuICBhdXRvU2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgJChkb2N1bWVudCkuYWpheENvbXBsZXRlKGF1dG9TZXR1cFZhbGlkYXRpb24pO1xyXG5cclxuICAvLyBUT0RPOiB1c2VkIHNvbWUgdGltZT8gc3RpbGwgcmVxdWlyZWQgdXNpbmcgbW9kdWxlcz9cclxuICAvKlxyXG4gICogQ29tbXVuaWNhdGUgdGhhdCBzY3JpcHQuanMgaXMgcmVhZHkgdG8gYmUgdXNlZFxyXG4gICogYW5kIHRoZSBjb21tb24gTEMgbGliIHRvby5cclxuICAqIEJvdGggYXJlIGVuc3VyZWQgdG8gYmUgcmFpc2VkIGV2ZXIgYWZ0ZXIgcGFnZSBpcyByZWFkeSB0b28uXHJcbiAgKi9cclxuICAkKGRvY3VtZW50KVxyXG4gICAgLnRyaWdnZXIoJ2xjU2NyaXB0UmVhZHknKVxyXG4gICAgLnRyaWdnZXIoJ2xjTGliUmVhZHknKTtcclxufSk7IiwiLyoqKioqIEFWQUlMQUJJTElUWSBDQUxFTkRBUiBXSURHRVQgKioqKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4uL0xDL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9kYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcnKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0KGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY2FsZW5kYXItY29udHJvbHMgLmFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5oYXNDbGFzcygnem9vbS1hY3Rpb24nKSkge1xyXG4gICAgICAgICAgICAvLyBEbyB6b29tXHJcbiAgICAgICAgICAgIHZhciBjID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpLmZpbmQoJy5jYWxlbmRhcicpLmNsb25lKCk7XHJcbiAgICAgICAgICAgIGMuY3NzKCdmb250LXNpemUnLCAnMnB4Jyk7XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSAkdC5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAgICAgYy5kYXRhKCdwb3B1cC1jb250YWluZXInLCB0YWIpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIHRhYiwgJ2F2YWlsYWJpbGl0eS1jYWxlbmRhcicsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIC8vIE5vdGhpbmcgbW9yZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5hdmlnYXRlIGNhbGVuZGFyXHJcbiAgICAgICAgdmFyIG5leHQgPSAkdC5oYXNDbGFzcygnbmV4dC13ZWVrLWFjdGlvbicpO1xyXG4gICAgICAgIHZhciBjb250ID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpO1xyXG4gICAgICAgIHZhciBjYWxjb250ID0gY29udC5jaGlsZHJlbignLmNhbGVuZGFyLWNvbnRhaW5lcicpO1xyXG4gICAgICAgIHZhciBjYWwgPSBjYWxjb250LmNoaWxkcmVuKCcuY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsaW5mbyA9IGNvbnQuZmluZCgnLmNhbGVuZGFyLWluZm8nKTtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKGNhbC5kYXRhKCdzaG93ZWQtZGF0ZScpKTtcclxuICAgICAgICB2YXIgdXNlcklkID0gY2FsLmRhdGEoJ3VzZXItaWQnKTtcclxuICAgICAgICBpZiAobmV4dClcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgNyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgLSA3KTtcclxuICAgICAgICB2YXIgc3RyZGF0ZSA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKTtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArIFwiUHJvZmlsZS8kQXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQvV2Vlay9cIiArIGVuY29kZVVSSUNvbXBvbmVudChzdHJkYXRlKSArIFwiLz9Vc2VySUQ9XCIgKyB1c2VySWQ7XHJcbiAgICAgICAgY2FsY29udC5yZWxvYWQodXJsLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIGdldCB0aGUgbmV3IG9iamVjdDpcclxuICAgICAgICAgICAgdmFyIGNhbCA9ICQoJy5jYWxlbmRhcicsIHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLnllYXItd2VlaycpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC13ZWVrJykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5maXJzdC13ZWVrLWRheScpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC1maXJzdC1kYXknKSk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLmxhc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtbGFzdC1kYXknKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBGQVFzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBmYXFzQmFzZVVybCA9ICdIZWxwQ2VudGVyLyRGQVFzJztcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICBmYXFzQmFzZVVybCA9IChiYXNlVXJsIHx8ICcvJykgKyBmYXFzQmFzZVVybDtcclxuXHJcbiAgLy8gRW5hYmxlIEZBUXMgbGlua3MgaW4gcG9wdXBcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYVtocmVmfD1cIiNGQVFzXCJdJywgcG9wdXBGYXFzKTtcclxuXHJcbiAgLy8gQXV0byBvcGVuIGN1cnJlbnQgZG9jdW1lbnQgbG9jYXRpb24gaWYgaGFzaCBpcyBhIEZBUSBsaW5rXHJcbiAgaWYgKC9eI0ZBUXMvaS50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICBwb3B1cEZhcXMobG9jYXRpb24uaGFzaCk7XHJcbiAgfVxyXG5cclxuICAvLyByZXR1cm4gYXMgdXRpbGl0eVxyXG4gIHJldHVybiBwb3B1cEZhcXM7XHJcbn07XHJcblxyXG4vKiBQYXNzIGEgRmFxcyBAdXJsIG9yIHVzZSBhcyBhIGxpbmsgaGFuZGxlciB0byBvcGVuIHRoZSBGQVEgaW4gYSBwb3B1cFxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdXBGYXFzKHVybCkge1xyXG4gIHVybCA9IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcclxuXHJcbiAgdmFyIHVybHBhcnRzID0gdXJsLnNwbGl0KCctJyk7XHJcblxyXG4gIGlmICh1cmxwYXJ0c1swXSAhPSAnI0ZBUXMnKSB7XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdUaGUgVVJMIGlzIG5vdCBhIEZBUSB1cmwgKGRvZXNuXFwndCBzdGFydHMgd2l0aCAjRkFRcy0pJywgdXJsKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgdmFyIHVybHNlY3Rpb24gPSB1cmxwYXJ0cy5sZW5ndGggPiAxID8gdXJscGFydHNbMV0gOiAnJztcclxuXHJcbiAgaWYgKHVybHNlY3Rpb24pIHtcclxuICAgIHZhciBwdXAgPSBwb3B1cChmYXFzQmFzZVVybCArIHVybHNlY3Rpb24sICdsYXJnZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGQgPSAkKHVybCksXHJcbiAgICAgICAgcGVsID0gcHVwLmdldENvbnRlbnRFbGVtZW50KCk7XHJcbiAgICAgIHBlbC5zY3JvbGxUb3AocGVsLnNjcm9sbFRvcCgpICsgZC5wb3NpdGlvbigpLnRvcCAtIDUwKTtcclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZC5lZmZlY3QoXCJoaWdobGlnaHRcIiwge30sIDIwMDApO1xyXG4gICAgICB9LCA0MDApO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufSIsIi8qIElOSVQgKi9cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gTG9jYXRpb24ganMtZHJvcGRvd25cclxuICAgIHZhciBzID0gJCgnI3NlYXJjaC1sb2NhdGlvbicpO1xyXG4gICAgcy5wcm9wKCdyZWFkb25seScsIHRydWUpO1xyXG4gICAgcy5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgIHNvdXJjZTogTEMuc2VhcmNoTG9jYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBhdXRvRm9jdXM6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIG1pbkxlbmd0aDogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgc2VsZWN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHMub24oJ2ZvY3VzIGNsaWNrJywgZnVuY3Rpb24gKCkgeyBzLmF1dG9jb21wbGV0ZSgnc2VhcmNoJywgJycpOyB9KTtcclxuXHJcbiAgICAvKiBQb3NpdGlvbnMgYXV0b2NvbXBsZXRlICovXHJcbiAgICB2YXIgcG9zaXRpb25zQXV0b2NvbXBsZXRlID0gJCgnI3NlYXJjaC1zZXJ2aWNlJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgICAgICAgLy8kKHRoaXMpLnZhbCh1aS5pdGVtLmxhYmVsKTtcclxuICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICAgICAvLyQodGhpcykudmFsKHVpLml0ZW0ubGFiZWwpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBMb2FkIGFsbCBwb3NpdGlvbnMgaW4gYmFja2dyb3VuZCB0byByZXBsYWNlIHRoZSBhdXRvY29tcGxldGUgc291cmNlIChhdm9pZGluZyBtdWx0aXBsZSwgc2xvdyBsb29rLXVwcylcclxuICAgIC8qJC5nZXRKU09OKExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdvcHRpb24nLCAnc291cmNlJywgZGF0YSk7XHJcbiAgICB9XHJcbiAgICApOyovXHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIExlZ2FsIHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJy52aWV3LXByaXZhY3ktcG9saWN5JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBvcHVwKGJhc2VVcmwgKyAnSGVscENlbnRlci8kUHJpdmFjeVBvbGljeS8nLCAnbGFyZ2UnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcudmlldy10ZXJtcy1vZi11c2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcG9wdXAoYmFzZVVybCArICdIZWxwQ2VudGVyLyRUZXJtc09mVXNlLycsICdsYXJnZScpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4qIFByb3ZpZGVyIFdlbGNvbWUgcGFnZVxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgU2ltcGxlU2xpZGVyID0gcmVxdWlyZSgnTEMvU2ltcGxlU2xpZGVyJyk7XHJcblxyXG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbiBwcm92aWRlcldlbGNvbWUoKSB7XHJcbiAgJCgnLlByb3ZpZGVyV2VsY29tZSAuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHQgPSAkKHRoaXMpLFxyXG4gICAgICBzbGlkZXIgPSBuZXcgU2ltcGxlU2xpZGVyKHtcclxuICAgICAgICBlbGVtZW50OiB0LFxyXG4gICAgICAgIHNlbGVjdG9yczoge1xyXG4gICAgICAgICAgc2xpZGVzOiAnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tc2xpZGVzJyxcclxuICAgICAgICAgIHNsaWRlOiAnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tc2xpZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjdXJyZW50U2xpZGVDbGFzczogJ2pzLWlzQ3VycmVudCcsXHJcbiAgICAgICAgaHJlZlByZWZpeDogJ2dvU2xpZGVfJyxcclxuICAgICAgICAvLyBEdXJhdGlvbiBvZiBlYWNoIHNsaWRlIGluIG1pbGxpc2Vjb25kc1xyXG4gICAgICAgIGR1cmF0aW9uOiAxMDAwXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIC8vIFNsaWRlIHN0ZXBzIGFjdGlvbnMgaW5pdGlhbGx5IGhpZGRlbiwgdmlzaWJsZSBhZnRlciAnc3RhcnQnXHJcbiAgICB2YXIgc2xpZGVzQWN0aW9ucyA9IHQuZmluZCgnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tYWN0aW9ucy1zbGlkZXMnKS5oaWRlKCk7XHJcbiAgICB0LmZpbmQoJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLWFjdGlvbnMtc3RhcnQgLnN0YXJ0LWFjdGlvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJCh0aGlzKS5oaWRlKCk7XHJcbiAgICAgIHNsaWRlc0FjdGlvbnMuZmFkZUluKDEwMDApO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4qIFdlbGNvbWUgcG9wdXBcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gYm9vdHN0cmFwIHRvb2x0aXBzOlxyXG5yZXF1aXJlKCdib290c3RyYXAnKTtcclxuLy9UT0RPIG1vcmUgZGVwZW5kZW5jaWVzP1xyXG5cclxudmFyIGluaXRpYWxpemVkID0gZmFsc2U7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0V2VsY29tZVBvcHVwKCkge1xyXG5cclxuICBleHBvcnRzLmF1dG9TaG93KCk7XHJcblxyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhLnNpZ24tdXAsIGEucmVnaXN0ZXIsIGEubmVlZC1sb2dpbiwgYnV0dG9uLm5lZWQtbG9naW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBSZW1vdmUgYW55IG9wZW5lZCBwb3B1cCAoaXQgb3ZlcmxheXMgdGhlIHdlbGNvbWVwb3B1cClcclxuICAgICQudW5ibG9ja1VJKCk7XHJcblxyXG4gICAgcmV0dXJuICFleHBvcnRzLnNob3coKTtcclxuICB9KTtcclxuXHJcbn07XHJcblxyXG5leHBvcnRzLmF1dG9TaG93ID0gZnVuY3Rpb24gYXV0b1Nob3dXZWxjb21lUG9wdXAoKSB7XHJcbiAgdmFyICR3cCA9ICQoJyN3ZWxjb21lcG9wdXAnKTtcclxuICB2YXIgJHdvID0gJCgnI3dlbGNvbWUtcG9wdXAtb3ZlcmxheScpO1xyXG5cclxuICAvLyBXaGVuIHRoZSBwb3B1cCBpcyBpbnRlZ3JhdGVkIGluIHRoZSBwYWdlIGluc3RlYWQgb2ZcclxuICAvLyB0aGUgbGF5b3V0LCBleGVjIHNob3cgYW5kIGNsb3NlIG9ycGhhbiBvdmVybGF5LlxyXG4gIGlmICgkd3AubGVuZ3RoICYmXHJcbiAgICAkd3AuaXMoJzp2aXNpYmxlJykgJiZcclxuICAgICR3cC5jbG9zZXN0KCcjd2VsY29tZS1wb3B1cC1vdmVybGF5JykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAkd28uaGlkZSgpO1xyXG4gICAgZXhwb3J0cy5zaG93KCk7XHJcbiAgICByZXR1cm47XHJcbiAgfSBlbHNlIGlmICgkd28uaGFzQ2xhc3MoJ2F1dG8tc2hvdycpKSB7XHJcbiAgICBleHBvcnRzLnNob3coKTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbiB3ZWxjb21lUG9wdXAoKSB7XHJcbiAgICB2YXIgYyA9ICQoJyN3ZWxjb21lcG9wdXAnKTtcclxuICAgIGlmIChjLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIHZhciBvdmVybGF5ID0gYy5jbG9zZXN0KCcjd2VsY29tZS1wb3B1cC1vdmVybGF5Jyk7XHJcbiAgICBvdmVybGF5LmZhZGVJbigzMDApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgR28gdG8gdGhlIGZpcnN0IHN0ZXAgb24gYSBhbHJlYWR5IGluaXRpYWxpemVkIHBvcHVwXHJcbiAgICAqKi9cclxuICAgIGZ1bmN0aW9uIHN0YXJ0QWdhaW4oYW5pbWF0ZSkge1xyXG4gICAgICAgIC8vIFJldHVybiBwb3B1cCB0byB0aGUgZmlyc3Qgc3RlcCAoY2hvb3NlIHByb2ZpbGUsICM0ODYpIGFuZCBleGl0IC1pbml0IGlzIHJlYWR5LVxyXG4gICAgICAgIC8vIFNob3cgZmlyc3Qgc3RlcFxyXG4gICAgICAgIHZhciBzdGVwMSA9IGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlLCBoZWFkZXIgLnByZXNlbnRhdGlvbicpO1xyXG4gICAgICAgIGlmIChhbmltYXRlKVxyXG4gICAgICAgICAgICBzdGVwMS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHN0ZXAxLnNob3coKTtcclxuICAgICAgICAvLyBIaWRlIHNlY29uZCBzdGVwXHJcbiAgICAgICAgdmFyIHN0ZXAyID0gYy5maW5kKCcudGVybXMsIC5wcm9maWxlLWRhdGEnKTtcclxuICAgICAgICBpZiAoYW5pbWF0ZSlcclxuICAgICAgICAgICAgc3RlcDIuc2xpZGVVcCgnZmFzdCcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc3RlcDIuaGlkZSgpO1xyXG4gICAgICAgIC8vIEhpZGUgYmFjay1hY3Rpb24gYnV0dG9uXHJcbiAgICAgICAgYy5maW5kKCcuYmFjay1hY3Rpb24nKS5oaWRlKCk7XHJcbiAgICAgICAgLy8gUmVzZXQgaGlkZGVuIGZpZWxkcyBwZXIgcHJvZmlsZS10eXBlXHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpOm5vdCgucG9zaXRpb24tZGVzY3JpcHRpb24pJykuc2hvdygpO1xyXG4gICAgICAgIC8vIFJlc2V0IGNob29zZW4gcHJvZmlsZS10eXBlXHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICAgICAgLy8gUmVzZXQgVVJMcyBwZXIgcHJvZmlsZS10eXBlXHJcbiAgICAgICAgYy5maW5kKCdhLnRlcm1zLW9mLXVzZScpLmRhdGEoJ3Rvb2x0aXAtdXJsJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gJCh0aGlzKS5hdHRyKCdkYXRhLXRvb2x0aXAtdXJsJyk7IH0pO1xyXG4gICAgICAgIC8vIFJlc2V0IHZhbGlkYXRpb24gcnVsZXNcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGkgaW5wdXQ6bm90KFt0eXBlPWhpZGRlbl0pJylcclxuICAgICAgICAuYXR0cignZGF0YS12YWwnLCBudWxsKVxyXG4gICAgICAgIC5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpbml0aWFsaXplZCkge1xyXG4gICAgICAgIHN0YXJ0QWdhaW4oKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBjbG9zZSBidXR0b24gbG9naWMgYW5kIG9ubHkgd2hlbiBhcyBwb3B1cCAoaXQgaGFzIG92ZXJsYXkpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSBjLmZpbmQoJy5jbG9zZS1wb3B1cCwgW2hyZWY9XCIjY2xvc2UtcG9wdXBcIl0nKTtcclxuICAgIGlmIChvdmVybGF5Lmxlbmd0aCA9PT0gMClcclxuICAgICAgICBjbG9zZUJ1dHRvbi5oaWRlKCk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgY2xvc2VCdXR0b24uc2hvdygpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgb3ZlcmxheS5mYWRlT3V0KCdub3JtYWwnKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIGdvIGJhY2sgYnV0dG9uXHJcbiAgICBjLmZpbmQoJy5iYWNrLWFjdGlvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgc3RhcnRBZ2Fpbih0cnVlKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBQb3BvdmVycyBmb3IgdG9vbHRpcCByZXBsYWNlbWVudFxyXG4gICAgYy5maW5kKCdbZGF0YS10b2dnbGU9XCJwb3BvdmVyXCJdJylcclxuICAgIC5wb3BvdmVyKClcclxuICAgIC5maWx0ZXIoJ2FbaHJlZj1cIiNcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIC8vIEF2b2lkIG5hdmlnYXRlIHRvIHRoZSBsaW5rXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHNraXBTdGVwMSA9IGMuaGFzQ2xhc3MoJ3NlbGVjdC1wb3NpdGlvbicpO1xyXG5cclxuICAgIC8vIEluaXRcclxuICAgIGlmICghc2tpcFN0ZXAxKSB7XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhLCAudGVybXMsIC5wb3NpdGlvbi1kZXNjcmlwdGlvbicpLmhpZGUoKTtcclxuICAgIH1cclxuICAgIGMuZmluZCgnZm9ybScpLmdldCgwKS5yZXNldCgpO1xyXG5cclxuICAgIC8vIERlc2NyaXB0aW9uIHNob3ctdXAgb24gYXV0b2NvbXBsZXRlIHZhcmlhdGlvbnNcclxuICAgIHZhciBzaG93UG9zaXRpb25EZXNjcmlwdGlvbiA9IHtcclxuICAgICAgICAvKipcclxuICAgICAgICBTaG93IGRlc2NyaXB0aW9uIGluIGEgdGV4dGFyZWEgdW5kZXIgdGhlIHBvc2l0aW9uIHNpbmd1bGFyLFxyXG4gICAgICAgIGl0cyBzaG93ZWQgb24gZGVtYW5kLlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHRleHRhcmVhOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIGMuZmluZCgnLnBvc2l0aW9uLWRlc2NyaXB0aW9uJylcclxuICAgICAgICAgICAgLnNsaWRlRG93bignZmFzdCcpXHJcbiAgICAgICAgICAgIC5maW5kKCd0ZXh0YXJlYScpLnZhbCh1aS5pdGVtLmRlc2NyaXB0aW9uKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgIFNob3cgZGVzY3JpcHRpb24gaW4gYSB0b29sdGlwIHRoYXQgY29tZXMgZnJvbSB0aGUgcG9zaXRpb24gc2luZ3VsYXJcclxuICAgICAgICBmaWVsZFxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHRvb2x0aXA6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgLy8gSXQgbmVlZHMgdG8gYmUgZGVzdHJveWVkIChubyBwcm9ibGVtIHRoZSBmaXJzdCB0aW1lKVxyXG4gICAgICAgICAgICAvLyB0byBnZXQgaXQgdXBkYXRlZCBvbiBzdWNjZXNpdmUgYXR0ZW1wdHNcclxuICAgICAgICAgICAgdmFyIGVsID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgZWxcclxuICAgICAgICAgICAgLnBvcG92ZXIoJ2Rlc3Ryb3knKVxyXG4gICAgICAgICAgICAucG9wb3Zlcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0RvZXMgdGhpcyBzb3VuZCBsaWtlIHlvdT8nLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogdWkuaXRlbS5kZXNjcmlwdGlvbixcclxuICAgICAgICAgICAgICAgIHRyaWdnZXI6ICdmb2N1cycsXHJcbiAgICAgICAgICAgICAgICAvLyBEaWZmZXJlbnQgcGxhY2VtZW50IGZvciBtb2JpbGUgZGVzaWduICh1cCB0byA2NDBweCB3aWRlKSB0byBhdm9pZCBiZWluZyBoaWRkZW5cclxuICAgICAgICAgICAgICAgIHBsYWNlbWVudDogJCgnaHRtbCcpLndpZHRoKCkgPCA2NDAgPyAndG9wJyA6ICdsZWZ0J1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAucG9wb3Zlcignc2hvdycpXHJcbiAgICAgICAgICAgIC8vIEhpZGUgb24gcG9zc2libGUgcG9zaXRpb24gbmFtZSBjaGFuZ2UgdG8gYXZvaWQgY29uZnVzaW9uc1xyXG4gICAgICAgICAgICAvLyAod2UgY2FuJ3QgdXNlIG9uLWNoYW5nZSwgbmVlZCB0byBiZSBrZXlwcmVzczsgaXRzIG5hbWVzcGFjZWRcclxuICAgICAgICAgICAgLy8gdG8gbGV0IG9mZiBhbmQgb24gZXZlcnkgdGltZSB0byBhdm9pZCBtdWx0aXBsZSBoYW5kbGVyIHJlZ2lzdHJhdGlvbnMpXHJcbiAgICAgICAgICAgIC5vZmYoJ2tleXByZXNzLmRlc2NyaXB0aW9uLXRvb2x0aXAnKVxyXG4gICAgICAgICAgICAub24oJ2tleXByZXNzLmRlc2NyaXB0aW9uLXRvb2x0aXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBlbC5wb3BvdmVyKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gUmUtZW5hYmxlIGF1dG9jb21wbGV0ZTpcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBjLmZpbmQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpOyB9LCA1MDApO1xyXG4gICAgZnVuY3Rpb24gc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzZWxldENhbGxiYWNrKSB7XHJcbiAgICAgICAgYy5maW5kKCdbbmFtZT1qb2J0aXRsZV0nKS5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgICAgICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgICAgICAgICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgIC8vIE5vIHZhbHVlLCBubyBhY3Rpb24gOihcclxuICAgICAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0udmFsdWUpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGlkICh2YWx1ZSkgaW4gdGhlIGhpZGRlbiBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICBjLmZpbmQoJ1tuYW1lPXBvc2l0aW9uaWRdJykudmFsKHVpLml0ZW0udmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGV0Q2FsbGJhY2suY2FsbCh0aGlzLCBldmVudCwgdWkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgdG8gc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcikgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzaG93UG9zaXRpb25EZXNjcmlwdGlvbi50b29sdGlwKTtcclxuICAgIGMuZmluZCgnI3dlbGNvbWVwb3B1cExvYWRpbmcnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBBY3Rpb25zXHJcbiAgICBjLm9uKCdjaGFuZ2UnLCAnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gU2hvdyBiYWNrLWFjdGlvbiBidXR0b25cclxuICAgICAgICBjLmZpbmQoJy5iYWNrLWFjdGlvbicpLnNob3coKTtcclxuXHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpOm5vdCguJyArIHRoaXMudmFsdWUgKyAnKScpLmhpZGUoKTtcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSwgaGVhZGVyIC5wcmVzZW50YXRpb24nKS5zbGlkZVVwKCdmYXN0Jyk7XHJcbiAgICAgICAgYy5maW5kKCcudGVybXMsIC5wcm9maWxlLWRhdGEnKS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuICAgICAgICAvLyBUZXJtcyBvZiB1c2UgZGlmZmVyZW50IGZvciBwcm9maWxlIHR5cGVcclxuICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSAnY3VzdG9tZXInKVxyXG4gICAgICAgICAgICBjLmZpbmQoJ2EudGVybXMtb2YtdXNlJykuZGF0YSgndG9vbHRpcC11cmwnLCBudWxsKTtcclxuICAgICAgICAvLyBDaGFuZ2UgZmFjZWJvb2sgcmVkaXJlY3QgbGlua1xyXG4gICAgICAgIHZhciBmYmMgPSBjLmZpbmQoJy5mYWNlYm9vay1jb25uZWN0Jyk7XHJcbiAgICAgICAgdmFyIGFkZFJlZGlyZWN0ID0gJ2N1c3RvbWVycyc7XHJcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gJ3Byb3ZpZGVyJylcclxuICAgICAgICAgICAgYWRkUmVkaXJlY3QgPSAncHJvdmlkZXJzJztcclxuICAgICAgICBmYmMuZGF0YSgncmVkaXJlY3QnLCBmYmMuZGF0YSgncmVkaXJlY3QnKSArIGFkZFJlZGlyZWN0KTtcclxuICAgICAgICBmYmMuZGF0YSgncHJvZmlsZScsIHRoaXMudmFsdWUpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdmFsaWRhdGlvbi1yZXF1aXJlZCBmb3IgZGVwZW5kaW5nIG9mIHByb2ZpbGUtdHlwZSBmb3JtIGVsZW1lbnRzOlxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaS4nICsgdGhpcy52YWx1ZSArICcgaW5wdXQ6bm90KFtkYXRhLXZhbF0pOm5vdChbdHlwZT1oaWRkZW5dKScpXHJcbiAgICAgICAgLmF0dHIoJ2RhdGEtdmFsLXJlcXVpcmVkJywgJycpXHJcbiAgICAgICAgLmF0dHIoJ2RhdGEtdmFsJywgdHJ1ZSk7XHJcbiAgICAgICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgICB9KTtcclxuICAgIGMub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0uYWpheCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBzZXR1cFBvc2l0aW9uQXV0b2NvbXBsZXRlKHNob3dQb3NpdGlvbkRlc2NyaXB0aW9uLnRvb2x0aXApO1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV06Y2hlY2tlZCcpLmNoYW5nZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSWYgcHJvZmlsZSB0eXBlIGlzIHByZWZpbGxlZCBieSByZXF1ZXN0OlxyXG4gICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXTpjaGVja2VkJykuY2hhbmdlKCk7XHJcblxyXG4gICAgLy8gQWxsIGZpbmVcclxuICAgIHJldHVybiB0cnVlO1xyXG59O1xyXG4iLCJcblxuXG4vKlxuKiBAdmVyc2lvbiAgMC41LjBcbiogQGF1dGhvciAgIExhdXJpIFJvb2RlbiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9saXRlanMvZGF0ZS1mb3JtYXQtbGl0ZVxuKiBAbGljZW5zZSAgTUlUIExpY2Vuc2UgIC0gaHR0cDovL2xhdXJpLnJvb2Rlbi5lZS9taXQtbGljZW5zZS50eHRcbiovXG5cblxuXG4hZnVuY3Rpb24oRGF0ZSwgcHJvdG8pIHtcblx0dmFyIG1hc2tSZSA9IC8oW1wiJ10pKCg/OlteXFxcXF18XFxcXC4pKj8pXFwxfFlZWVl8KFtNRF0pXFwzXFwzKFxcMz8pfFNTfChbWU1ESGhtc1ddKShcXDU/KXxbdVVBWlN3b10vZ1xuXHQsIHllYXJGaXJzdFJlID0gLyhcXGR7NH0pWy0uXFwvXShcXGRcXGQ/KVstLlxcL10oXFxkXFxkPykvXG5cdCwgZGF0ZUZpcnN0UmUgPSAvKFxcZFxcZD8pWy0uXFwvXShcXGRcXGQ/KVstLlxcL10oXFxkezR9KS9cblx0LCB0aW1lUmUgPSAvKFxcZFxcZD8pOihcXGRcXGQpOj8oXFxkXFxkKT9cXC4/KFxcZHszfSk/KD86XFxzKig/OihhKXwocCkpXFwuP21cXC4/KT8oXFxzKig/Olp8R01UfFVUQyk/KD86KFstK11cXGRcXGQpOj8oXFxkXFxkKT8pPyk/L2lcblx0LCB3b3JkUmUgPSAvLlthLXpdKy9nXG5cdCwgdW5lc2NhcGVSZSA9IC9cXFxcKC4pL2dcblx0Ly8sIGlzb0RhdGVSZSA9IC8oXFxkezR9KVstLlxcL11XKFxcZFxcZD8pWy0uXFwvXShcXGQpL1xuXHRcblxuXHQvLyBJU08gODYwMSBzcGVjaWZpZXMgbnVtZXJpYyByZXByZXNlbnRhdGlvbnMgb2YgZGF0ZSBhbmQgdGltZS5cblx0Ly9cblx0Ly8gVGhlIGludGVybmF0aW9uYWwgc3RhbmRhcmQgZGF0ZSBub3RhdGlvbiBpc1xuXHQvLyBZWVlZLU1NLUREXG5cdC8vXG5cdC8vIFRoZSBpbnRlcm5hdGlvbmFsIHN0YW5kYXJkIG5vdGF0aW9uIGZvciB0aGUgdGltZSBvZiBkYXkgaXNcblx0Ly8gaGg6bW06c3Ncblx0Ly9cblx0Ly8gVGltZSB6b25lXG5cdC8vXG5cdC8vIFRoZSBzdHJpbmdzICtoaDptbSwgK2hobW0sIG9yICtoaCAoYWhlYWQgb2YgVVRDKVxuXHQvLyAtaGg6bW0sIC1oaG1tLCBvciAtaGggKHRpbWUgem9uZXMgd2VzdCBvZiB0aGUgemVybyBtZXJpZGlhbiwgd2hpY2ggYXJlIGJlaGluZCBVVEMpXG5cdC8vXG5cdC8vIDEyOjAwWiA9IDEzOjAwKzAxOjAwID0gMDcwMC0wNTAwXG5cdFxuXHREYXRlW3Byb3RvXS5mb3JtYXQgPSBmdW5jdGlvbihtYXNrKSB7XG5cdFx0bWFzayA9IERhdGUubWFza3NbbWFza10gfHwgbWFzayB8fCBEYXRlLm1hc2tzW1wiZGVmYXVsdFwiXVxuXG5cdFx0dmFyIHNlbGYgPSB0aGlzXG5cdFx0LCBnZXQgPSBcImdldFwiICsgKG1hc2suc2xpY2UoMCw0KSA9PSBcIlVUQzpcIiA/IChtYXNrPW1hc2suc2xpY2UoNCksIFwiVVRDXCIpOlwiXCIpXG5cblx0XHRyZXR1cm4gbWFzay5yZXBsYWNlKG1hc2tSZSwgZnVuY3Rpb24obWF0Y2gsIHF1b3RlLCB0ZXh0LCBNRCwgTUQ0LCBzaW5nbGUsIHBhZCkge1xuXHRcdFx0dGV4dCA9IHNpbmdsZSA9PSBcIllcIiAgID8gc2VsZltnZXQgKyBcIkZ1bGxZZWFyXCJdKCkgJSAxMDBcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJZWVlZXCIgPyBzZWxmW2dldCArIFwiRnVsbFllYXJcIl0oKVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJNXCIgICA/IHNlbGZbZ2V0ICsgXCJNb250aFwiXSgpKzFcblx0XHRcdFx0IDogTUQgICAgID09IFwiTVwiID8gRGF0ZS5tb250aE5hbWVzWyBzZWxmW2dldCArIFwiTW9udGhcIl0oKSsoTUQ0ID8gMTIgOiAwKSBdXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcIkRcIiAgID8gc2VsZltnZXQgKyBcIkRhdGVcIl0oKVxuXHRcdFx0XHQgOiBNRCAgICAgPT0gXCJEXCIgPyBEYXRlLmRheU5hbWVzWyBzZWxmW2dldCArIFwiRGF5XCJdKCkgKyAoTUQ0ID8gNzowICkgXVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJIXCIgICA/IHNlbGZbZ2V0ICsgXCJIb3Vyc1wiXSgpICUgMTIgfHwgMTJcblx0XHRcdFx0IDogc2luZ2xlID09IFwiaFwiICAgPyBzZWxmW2dldCArIFwiSG91cnNcIl0oKVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJtXCIgICA/IHNlbGZbZ2V0ICsgXCJNaW51dGVzXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwic1wiICAgPyBzZWxmW2dldCArIFwiU2Vjb25kc1wiXSgpXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiU1wiICAgID8gc2VsZltnZXQgKyBcIk1pbGxpc2Vjb25kc1wiXSgpXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiU1NcIiAgID8gKHF1b3RlID0gc2VsZltnZXQgKyBcIk1pbGxpc2Vjb25kc1wiXSgpLCBxdW90ZSA+IDk5ID8gcXVvdGUgOiAocXVvdGUgPiA5ID8gXCIwXCIgOiBcIjAwXCIgKSArIHF1b3RlKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcInVcIiAgICA/IChzZWxmLzEwMDApPj4+MFxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlVcIiAgICA/ICtzZWxmXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiQVwiICAgID8gRGF0ZVtzZWxmW2dldCArIFwiSG91cnNcIl0oKSA+IDExID8gXCJwbVwiIDogXCJhbVwiXVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlpcIiAgICA/IFwiR01UIFwiICsgKC1zZWxmLmdldFRpbWV6b25lT2Zmc2V0KCkvNjApXG5cdFx0XHRcdCA6IG1hdGNoID09IFwid1wiICAgID8gc2VsZltnZXQgKyBcIkRheVwiXSgpIHx8IDdcblx0XHRcdFx0IDogc2luZ2xlID09IFwiV1wiICAgPyAocXVvdGUgPSBuZXcgRGF0ZSgrc2VsZiArICgoNCAtIChzZWxmW2dldCArIFwiRGF5XCJdKCl8fDcpKSAqIDg2NDAwMDAwKSksIE1hdGguY2VpbCgoKHF1b3RlLmdldFRpbWUoKS1xdW90ZVtcInNcIiArIGdldC5zbGljZSgxKSArIFwiTW9udGhcIl0oMCwxKSkgLyA4NjQwMDAwMCArIDEgKSAvIDcpIClcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJvXCIgICAgPyBuZXcgRGF0ZSgrc2VsZiArICgoNCAtIChzZWxmW2dldCArIFwiRGF5XCJdKCl8fDcpKSAqIDg2NDAwMDAwKSlbZ2V0ICsgXCJGdWxsWWVhclwiXSgpXG5cdFx0XHRcdCA6IHF1b3RlICAgICAgICAgICA/IHRleHQucmVwbGFjZSh1bmVzY2FwZVJlLCBcIiQxXCIpXG5cdFx0XHRcdCA6IG1hdGNoXG5cdFx0XHRyZXR1cm4gcGFkICYmIHRleHQgPCAxMCA/IFwiMFwiK3RleHQgOiB0ZXh0XG5cdFx0fSlcblx0fVxuXG5cdERhdGUuYW0gPSBcIkFNXCJcblx0RGF0ZS5wbSA9IFwiUE1cIlxuXG5cdERhdGUubWFza3MgPSB7XCJkZWZhdWx0XCI6XCJEREQgTU1NIEREIFlZWVkgaGg6bW06c3NcIixcImlzb1V0Y0RhdGVUaW1lXCI6J1VUQzpZWVlZLU1NLUREXCJUXCJoaDptbTpzc1wiWlwiJ31cblx0RGF0ZS5tb250aE5hbWVzID0gXCJKYW5GZWJNYXJBcHJNYXlKdW5KdWxBdWdTZXBPY3ROb3ZEZWNKYW51YXJ5RmVicnVhcnlNYXJjaEFwcmlsTWF5SnVuZUp1bHlBdWd1c3RTZXB0ZW1iZXJPY3RvYmVyTm92ZW1iZXJEZWNlbWJlclwiLm1hdGNoKHdvcmRSZSlcblx0RGF0ZS5kYXlOYW1lcyA9IFwiU3VuTW9uVHVlV2VkVGh1RnJpU2F0U3VuZGF5TW9uZGF5VHVlc2RheVdlZG5lc2RheVRodXJzZGF5RnJpZGF5U2F0dXJkYXlcIi5tYXRjaCh3b3JkUmUpXG5cblx0Ly8qL1xuXG5cblx0Lypcblx0KiAvLyBJbiBDaHJvbWUgRGF0ZS5wYXJzZShcIjAxLjAyLjIwMDFcIikgaXMgSmFuXG5cdCogbiA9ICtzZWxmIHx8IERhdGUucGFyc2Uoc2VsZikgfHwgXCJcIitzZWxmO1xuXHQqL1xuXG5cdFN0cmluZ1twcm90b10uZGF0ZSA9IE51bWJlcltwcm90b10uZGF0ZSA9IGZ1bmN0aW9uKGZvcm1hdCkge1xuXHRcdHZhciBtLCB0ZW1wXG5cdFx0LCBkID0gbmV3IERhdGVcblx0XHQsIG4gPSArdGhpcyB8fCBcIlwiK3RoaXNcblxuXHRcdGlmIChpc05hTihuKSkge1xuXHRcdFx0Ly8gQmlnIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSB5ZWFyLCBlZy4gMjAxMS0wMS0zMVxuXHRcdFx0aWYgKG0gPSBuLm1hdGNoKHllYXJGaXJzdFJlKSkgZC5zZXRGdWxsWWVhcihtWzFdLCBtWzJdLTEsIG1bM10pXG5cblx0XHRcdGVsc2UgaWYgKG0gPSBuLm1hdGNoKGRhdGVGaXJzdFJlKSkge1xuXHRcdFx0XHQvLyBNaWRkbGUgZW5kaWFuIGRhdGUsIHN0YXJ0aW5nIHdpdGggdGhlIG1vbnRoLCBlZy4gMDEvMzEvMjAxMVxuXHRcdFx0XHQvLyBMaXR0bGUgZW5kaWFuIGRhdGUsIHN0YXJ0aW5nIHdpdGggdGhlIGRheSwgZWcuIDMxLjAxLjIwMTFcblx0XHRcdFx0dGVtcCA9IERhdGUubWlkZGxlX2VuZGlhbiA/IDEgOiAyXG5cdFx0XHRcdGQuc2V0RnVsbFllYXIobVszXSwgbVt0ZW1wXS0xLCBtWzMtdGVtcF0pXG5cdFx0XHR9XG5cblx0XHRcdC8vIFRpbWVcblx0XHRcdG0gPSBuLm1hdGNoKHRpbWVSZSkgfHwgWzAsIDAsIDBdXG5cdFx0XHRkLnNldEhvdXJzKCBtWzZdICYmIG1bMV0gPCAxMiA/ICttWzFdKzEyIDogbVs1XSAmJiBtWzFdID09IDEyID8gMCA6IG1bMV0sIG1bMl0sIG1bM118MCwgbVs0XXwwKVxuXHRcdFx0Ly8gVGltZXpvbmVcblx0XHRcdGlmIChtWzddKSB7XG5cdFx0XHRcdGQuc2V0VGltZShkLSgoZC5nZXRUaW1lem9uZU9mZnNldCgpICsgKG1bOF18MCkqNjAgKyAoKG1bOF08MD8tMToxKSoobVs5XXwwKSkpKjYwMDAwKSlcblx0XHRcdH1cblx0XHR9IGVsc2UgZC5zZXRUaW1lKCBuIDwgNDI5NDk2NzI5NiA/IG4gKiAxMDAwIDogbiApXG5cdFx0cmV0dXJuIGZvcm1hdCA/IGQuZm9ybWF0KGZvcm1hdCkgOiBkXG5cdH1cblxufShEYXRlLCBcInByb3RvdHlwZVwiKVxuXG5cblxuXG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
