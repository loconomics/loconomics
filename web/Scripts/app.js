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
        if (ctx && ctx.box)
            // Clean previous validation errors
            validation.setValidationSummaryAsValid(ctx.box);

        if (data.Code === 0) {
            // Special Code 0: general success code, show message saying that 'all was fine'
            showSuccessMessage(ctx, data.Result, data);
            if (ctx && ctx.form && ctx.form.trigger)
                ctx.form.trigger('ajaxSuccessPost', [data, text, jx]);
            // Special Code 1: do a redirect
        } else if (data.Code == 1) {
            redirectTo(data.Result);
        } else if (data.Code == 2) {
            // Special Code 2: show login popup (with the given url at data.Result)
            if (ctx && ctx.block && ctx.box.unblock)
                ctx.box.unblock();
            popup(data.Result, { width: 410, height: 320 });
        } else if (data.Code == 3) {
            // Special Code 3: reload current page content to the given url at data.Result)
            // Note: to reload same url page content, is better return the html directly from
            // this ajax server request.
            //container.unblock(); is blocked and unblocked again by the reload method:
            ctx.autoUnblockLoading = false;
            if (ctx && ctx.box && ctx.box.reload)
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
    'editor-hidden': 'crudl-editor-hidden',
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
          dtr.xhide(withcallback)
          .queue(function () {
              crudl.trigger(instance.settings.events['editor-hidden'], [dtr]);
              dtr.dequeue();
          });

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

},{}],"LC/googleMapReady":[function(require,module,exports){
module.exports=require('TPQyHE');
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
            scripts: ['https://www.google.com/jsapi'],
            completeVerification: function () { return !!window.google; },
            complete: function () {
                google.load('maps', '3.16',
                    { other_params: 'sensor=false', callback: function () {
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
        // Don't forget the center!
        var center = map.getCenter();
        google.maps.event.addListenerOnce(map, 'resize', function () {
            // Restore center
            if (center)
                map.setCenter(center);
        });
        google.maps.event.trigger(map, 'resize');
    });
};

},{"./loader":76}],63:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQXJyYXkucmVtb3ZlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0JpbmRhYmxlQ29tcG9uZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0NvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9EYXRhU291cmNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0xjV2lkZ2V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL2V4dGVuZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9Db29raWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvRmFjZWJvb2tDb25uZWN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0xjVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1ByaWNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1JlZ0V4cC5xdW90ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9TaW1wbGVTbGlkZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nLnByb3RvdHlwZS5jb250YWlucy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9TdHJpbmdGb3JtYXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguYXV0b2xvYWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguY2hhbmdlc05vdGlmaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC5zbGlkZXJUYWJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLndpemFyZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UaW1lU3Bhbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UaW1lU3BhbkV4dHJhLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1VJU2xpZGVyTGFiZWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhDYWxsYmFja3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYWpheEZvcm1zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9DYWxjdWxhdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXV0b0ZvY3VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9maWxsU3VibWVudS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9Cb29raW5nc05vdGlmaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9Nb250aGx5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL1dlZWtseS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9Xb3JrSG91cnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvY2xlYXJDdXJyZW50U2VsZWN0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2RhdGVVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9mb3JtYXREYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2luZGV4LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL21ha2VVbnNlbGVjdGFibGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvb2JqZWN0VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvdXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYmF0Y2hFdmVudEhhbmRsZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYmxvY2tQcmVzZXRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvY3JlYXRlSWZyYW1lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVJU084NjAxLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFRleHQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ29vZ2xlTWFwUmVhZHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ3VpZEdlbmVyYXRvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9oYXNDb25maXJtU3VwcG9ydC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pMThuLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2lzRW1wdHlTdHJpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmFyZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuYm91bmRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmlzQ2hpbGRPZi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkub3V0ZXJIdG1sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5yZWxvYWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL21hdGhVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tb3ZlRm9jdXNUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9udW1iZXJVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3B1cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9yZWRpcmVjdFRvLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9vbHRpcHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdXJsVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYWNjb3VudFBvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZmFxc1BvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvaG9tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvbGVnYWxQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3Byb3ZpZGVyV2VsY29tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvd2VsY29tZVBvcHVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvZGF0ZS1mb3JtYXQtbGl0ZS9kYXRlLWZvcm1hdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7OztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIEFycmF5IFJlbW92ZSAtIEJ5IEpvaG4gUmVzaWcgKE1JVCBMaWNlbnNlZClcclxuLypBcnJheS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGZyb20sIHRvKSB7XHJcbklhZ29TUkw6IGl0IHNlZW1zIGluY29tcGF0aWJsZSB3aXRoIE1vZGVybml6ciBsb2FkZXIgZmVhdHVyZSBsb2FkaW5nIFplbmRlc2sgc2NyaXB0LFxyXG5tb3ZlZCBmcm9tIHByb3RvdHlwZSB0byBhIGNsYXNzLXN0YXRpYyBtZXRob2QgKi9cclxuZnVuY3Rpb24gYXJyYXlSZW1vdmUoYW5BcnJheSwgZnJvbSwgdG8pIHtcclxuICAgIHZhciByZXN0ID0gYW5BcnJheS5zbGljZSgodG8gfHwgZnJvbSkgKyAxIHx8IGFuQXJyYXkubGVuZ3RoKTtcclxuICAgIGFuQXJyYXkubGVuZ3RoID0gZnJvbSA8IDAgPyBhbkFycmF5Lmxlbmd0aCArIGZyb20gOiBmcm9tO1xyXG4gICAgcmV0dXJuIGFuQXJyYXkucHVzaC5hcHBseShhbkFycmF5LCByZXN0KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGFycmF5UmVtb3ZlO1xyXG59IGVsc2Uge1xyXG4gICAgQXJyYXkucmVtb3ZlID0gYXJyYXlSZW1vdmU7XHJcbn0iLCIvKipcclxuICBCaW5kYWJsZSBVSSBDb21wb25lbnQuXHJcbiAgSXQgcmVsaWVzIG9uIENvbXBvbmVudCBidXQgYWRkcyBEYXRhU291cmNlIGNhcGFiaWxpdGllc1xyXG4qKi9cclxudmFyIERhdGFTb3VyY2UgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2UnKTtcclxudmFyIENvbXBvbmVudCA9IHJlcXVpcmUoJy4vQ29tcG9uZW50Jyk7XHJcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpO1xyXG52YXIgbWV2ZW50cyA9IHJlcXVpcmUoJ2V2ZW50cycpO1xyXG5cclxuLyoqXHJcblJldXNpbmcgdGhlIG9yaWdpbmFsIGZldGNoRGF0YSBtZXRob2QgYnV0IGFkZGluZyBjbGFzc2VzIHRvIG91clxyXG5jb21wb25lbnQgZWxlbWVudCBmb3IgYW55IHZpc3VhbCBub3RpZmljYXRpb24gb2YgdGhlIGRhdGEgbG9hZGluZy5cclxuTWV0aG9kIGdldCBleHRlbmRlZCB3aXRoIGlzUHJlZmV0Y2hpbmcgbWV0aG9kIGZvciBkaWZmZXJlbnRcclxuY2xhc3Nlcy9ub3RpZmljYXRpb25zIGRlcGVuZGFudCBvbiB0aGF0IGZsYWcsIGJ5IGRlZmF1bHQgZmFsc2U6XHJcbioqL1xyXG52YXIgY29tcG9uZW50RmV0Y2hEYXRhID0gZnVuY3Rpb24gYmluZGFibGVDb21wb25lbnRGZXRjaERhdGEocXVlcnlEYXRhLCBtb2RlLCBpc1ByZWZldGNoaW5nKSB7XHJcbiAgdmFyIGNsID0gaXNQcmVmZXRjaGluZyA/IHRoaXMuY2xhc3Nlcy5wcmVmZXRjaGluZyA6IHRoaXMuY2xhc3Nlcy5mZXRjaGluZztcclxuICB0aGlzLiRlbC5hZGRDbGFzcyhjbCk7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB2YXIgcmVxID0gRGF0YVNvdXJjZS5wcm90b3R5cGUuZmV0Y2hEYXRhLmNhbGwodGhpcywgcXVlcnlEYXRhLCBtb2RlKVxyXG4gIC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuJGVsLnJlbW92ZUNsYXNzKGNsIHx8ICdfJyk7XHJcbiAgICAvLyBVbm1hcmsgYW55IHBvc2libGUgcHJldmlvdXMgZXJyb3Igc2luY2Ugd2UgaGFkIGEgc3VjY2VzIGxvYWQ6XHJcbiAgICB0aGF0Lmhhc0Vycm9yKGZhbHNlKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHJlcTtcclxufTtcclxuLyoqXHJcblJlcGxhY2luZywgYnV0IHJldXNpbmcgaW50ZXJuYWxzLCB0aGUgZGVmYXVsdCBvbmVycm9yIGNhbGxiYWNrIGZvciB0aGVcclxuZmV0Y2hEYXRhIGZ1bmN0aW9uIHRvIGFkZCBub3RpZmljYXRpb24gY2xhc3NlcyB0byBvdXIgY29tcG9uZW50IG1vZGVsXHJcbioqL1xyXG5jb21wb25lbnRGZXRjaERhdGEub25lcnJvciA9IGZ1bmN0aW9uIGJpbmRhYmxlQ29tcG9uZW50RmVjaERhdGFPbmVycm9yKHgsIHMsIGUpIHtcclxuICBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaERhdGEub25lcnJvci5jYWxsKHRoaXMsIHgsIHMsIGUpO1xyXG4gIC8vIFJlbW92ZSBmZXRjaGluZyBjbGFzc2VzOlxyXG4gIHRoaXMuJGVsXHJcbiAgLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5mZXRjaGluZyB8fCAnXycpXHJcbiAgLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5wcmVmZXRjaGluZyB8fCAnXycpO1xyXG4gIC8vIE1hcmsgZXJyb3I6XHJcbiAgdGhpcy5oYXNFcnJvcih7IG5hbWU6ICdmZXRjaERhdGFFcnJvcicsIHJlcXVlc3Q6IHgsIHN0YXR1czogcywgZXhjZXB0aW9uOiBlIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgQmluZGFibGVDb21wb25lbnQgY2xhc3NcclxuKiovXHJcbnZhciBCaW5kYWJsZUNvbXBvbmVudCA9IENvbXBvbmVudC5leHRlbmQoXHJcbiAgRGF0YVNvdXJjZS5wcm90b3R5cGUsXHJcbiAgLy8gUHJvdG90eXBlXHJcbiAge1xyXG4gICAgY2xhc3Nlczoge1xyXG4gICAgICBmZXRjaGluZzogJ2lzLWxvYWRpbmcnLFxyXG4gICAgICBwcmVmZXRjaGluZzogJ2lzLXByZWxvYWRpbmcnLFxyXG4gICAgICBkaXNhYmxlZDogJ2lzLWRpc2FibGVkJyxcclxuICAgICAgaGFzRGF0YUVycm9yOiAnaGFzLWRhdGFFcnJvcidcclxuICAgIH0sXHJcbiAgICBmZXRjaERhdGE6IGNvbXBvbmVudEZldGNoRGF0YSxcclxuICAgIC8vIFdoYXQgYXR0cmlidXRlIG5hbWUgdXNlIHRvIG1hcmsgZWxlbWVudHMgaW5zaWRlIHRoZSBjb21wb25lbnRcclxuICAgIC8vIHdpdGggdGhlIHByb3BlcnR5IGZyb20gdGhlIHNvdXJjZSB0byBiaW5kLlxyXG4gICAgLy8gVGhlIHByZWZpeCAnZGF0YS0nIGluIGN1c3RvbSBhdHRyaWJ1dGVzIGlzIHJlcXVpcmVkIGJ5IGh0bWw1LFxyXG4gICAgLy8ganVzdCBzcGVjaWZ5IHRoZSBzZWNvbmQgcGFydCwgYmVpbmcgJ2JpbmQnIHRoZSBhdHRyaWJ1dGVcclxuICAgIC8vIG5hbWUgdG8gdXNlIGlzICdkYXRhLWJpbmQnXHJcbiAgICBkYXRhQmluZEF0dHJpYnV0ZTogJ2JpbmQnLFxyXG4gICAgLy8gRGVmYXVsdCBiaW5kRGF0YSBpbXBsZW1lbnRhdGlvbiwgY2FuIGJlIHJlcGxhY2Ugb24gZXh0ZW5kZWQgY29tcG9uZW50c1xyXG4gICAgLy8gdG8gc29tZXRoaW5nIG1vcmUgY29tcGxleCAobGlzdC9jb2xsZWN0aW9ucywgc3ViLW9iamVjdHMsIGN1c3RvbSBzdHJ1Y3R1cmVzXHJcbiAgICAvLyBhbmQgdmlzdWFsaXphdGlvbiAtLWtlZXAgYXMgcG9zc2libGUgdGhlIHVzZSBvZiBkYXRhQmluZEF0dHJpYnV0ZSBmb3IgcmV1c2FibGUgY29kZSkuXHJcbiAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIHdvcmtzIGZpbmUgZm9yIGRhdGEgYXMgcGxhaW4gb2JqZWN0IHdpdGggXHJcbiAgICAvLyBzaW1wbGUgdHlwZXMgYXMgcHJvcGVydGllcyAobm90IG9iamVjdHMgb3IgYXJyYXlzIGluc2lkZSB0aGVtKS5cclxuICAgIGJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YSgpIHtcclxuICAgICAgaWYgKCF0aGlzLmRhdGEpIHJldHVybjtcclxuICAgICAgLy8gQ2hlY2sgZXZlcnkgZWxlbWVudCBpbiB0aGUgY29tcG9uZW50IHdpdGggYSBiaW5kXHJcbiAgICAgIC8vIHByb3BlcnR5IGFuZCB1cGRhdGUgaXQgd2l0aCB0aGUgdmFsdWUgb2YgdGhhdCBwcm9wZXJ0eVxyXG4gICAgICAvLyBmcm9tIHRoZSBkYXRhIHNvdXJjZVxyXG4gICAgICB2YXIgYXR0ID0gdGhpcy5kYXRhQmluZEF0dHJpYnV0ZTtcclxuICAgICAgdmFyIGF0dHJTZWxlY3RvciA9ICdbZGF0YS0nICsgYXR0ICsgJ10nO1xyXG4gICAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICAgIHRoaXMuJGVsLmZpbmQoYXR0clNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgcHJvcCA9ICR0LmRhdGEoYXR0KSxcclxuICAgICAgICAgIGJpbmRlZFZhbHVlID0gdGhhdC5kYXRhW3Byb3BdO1xyXG5cclxuICAgICAgICBpZiAoJHQuaXMoJzppbnB1dCcpKVxyXG4gICAgICAgICAgJHQudmFsKGJpbmRlZFZhbHVlKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAkdC50ZXh0KGJpbmRlZFZhbHVlKTtcclxuICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgIEl0IGdldHMgdGhlIGxhdGVzdCBlcnJvciBoYXBwZW5lZCBpbiB0aGUgY29tcG9uZW50IChvciBudWxsL2ZhbHN5IGlmIHRoZXJlIGlzIG5vKSxcclxuICAgICAgb3Igc2V0cyB0aGUgZXJyb3IgKHBhc3NpbmcgaXQgaW4gdGhlIG9wdGlvbmFsIHZhbHVlKSByZXR1cm5pbmcgdGhlIHByZXZpb3VzIHJlZ2lzdGVyZWQgZXJyb3IuXHJcbiAgICAgIEl0cyByZWNvbW1lbmRlZCBhbiBvYmplY3QgYXMgZXJyb3IgaW5zdGVhZCBvZiBhIHNpbXBsZSB2YWx1ZSBvciBzdHJpbmcgKHRoYXQgY2FuIGdldCBjb25mdXNlZFxyXG4gICAgICB3aXRoIGZhbHN5IGlmIGlzIGVtcHR5IHN0cmluZyBvciAwLCBhbmQgYWxsb3cgYXR0YWNoIG1vcmUgc3RydWN0dXJlZCBpbmZvcm1hdGlvbikgd2l0aCBhblxyXG4gICAgICBpbmZvcm1hdGlvbmFsIHByb3BlcnR5ICduYW1lJy5cclxuICAgICAgVG8gc2V0IG9mZiB0aGUgZXJyb3IsIHBhc3MgbnVsbCB2YWx1ZSBvciBmYWxzZS5cclxuICAgICoqL1xyXG4gICAgaGFzRXJyb3I6IGZ1bmN0aW9uIGhhc0Vycm9yKGVycm9yVG9TZXQpIHtcclxuICAgICAgaWYgKHR5cGVvZiAoZXJyb3JUb1NldCkgPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZXJyb3IgfHwgbnVsbDtcclxuICAgICAgfVxyXG4gICAgICB2YXIgcHJldiA9IHRoaXMuX2Vycm9yIHx8IG51bGw7XHJcbiAgICAgIHRoaXMuX2Vycm9yID0gZXJyb3JUb1NldDtcclxuICAgICAgdGhpcy5ldmVudHMuZW1pdCgnaGFzRXJyb3JDaGFuZ2VkJywgZXJyb3JUb1NldCwgcHJldik7XHJcbiAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gQ29uc3RydWN0b3JcclxuICBmdW5jdGlvbiBCaW5kYWJsZUNvbXBvbmVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICBDb21wb25lbnQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICAgIFxyXG4gICAgLy8gSXQgaGFzIGFuIGV2ZW50IGVtaXR0ZXI6XHJcbiAgICB0aGlzLmV2ZW50cyA9IG5ldyBtZXZlbnRzLkV2ZW50RW1pdHRlcigpO1xyXG4gICAgLy8gRXZlbnRzIG9iamVjdCBoYXMgYSBwcm9wZXJ0eSB0byBhY2Nlc3MgdGhpcyBvYmplY3QsXHJcbiAgICAvLyB1c2VmdWxsIHRvIHJlZmVyZW5jZSBhcyAndGhpcy5jb21wb25lbnQnIGZyb20gaW5zaWRlXHJcbiAgICAvLyBldmVudCBoYW5kbGVyczpcclxuICAgIHRoaXMuZXZlbnRzLmNvbXBvbmVudCA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy5kYXRhID0gdGhpcy4kZWwuZGF0YSgnc291cmNlJykgfHwgdGhpcy5kYXRhIHx8IHt9O1xyXG4gICAgaWYgKHR5cGVvZiAodGhpcy5kYXRhKSA9PSAnc3RyaW5nJylcclxuICAgICAgdGhpcy5kYXRhID0gSlNPTi5wYXJzZSh0aGlzLmRhdGEpO1xyXG5cclxuICAgIC8vIE9uIGh0bWwgc291cmNlIHVybCBjb25maWd1cmF0aW9uOlxyXG4gICAgdGhpcy51cmwgPSB0aGlzLiRlbC5kYXRhKCdzb3VyY2UtdXJsJykgfHwgdGhpcy51cmw7XHJcblxyXG4gICAgLy8gQ2xhc3NlcyBvbiBmZXRjaERhdGFFcnJvclxyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgdGhpcy5ldmVudHMub24oJ2hhc0Vycm9yQ2hhbmdlZCcsIGZ1bmN0aW9uIChlcnIsIHByZXZFcnIpIHtcclxuICAgICAgaWYgKGVyciAmJiBlcnIubmFtZSA9PSAnZmV0Y2hEYXRhRXJyb3InKSB7XHJcbiAgICAgICAgdGhhdC4kZWwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLmhhc0RhdGFFcnJvcik7XHJcbiAgICAgIH0gZWxzZSBpZiAocHJldkVyciAmJiBwcmV2RXJyLm5hbWUgPT0gJ2ZldGNoRGF0YUVycm9yJykge1xyXG4gICAgICAgIHRoYXQuJGVsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5oYXNEYXRhRXJyb3IgfHwgJ18nKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gVE9ETzogJ2NoYW5nZScgZXZlbnQgaGFuZGxlcnMgb24gZm9ybXMgd2l0aCBkYXRhLWJpbmQgdG8gdXBkYXRlIGl0cyB2YWx1ZSBhdCB0aGlzLmRhdGFcclxuICAgIC8vIFRPRE86IGF1dG8gJ2JpbmREYXRhJyBvbiBmZXRjaERhdGEgZW5kcz8gY29uZmlndXJhYmxlLCBiaW5kRGF0YU1vZGV7IGlubWVkaWF0ZSwgbm90aWZ5IH1cclxuICB9XHJcbik7XHJcblxyXG4vLyBQdWJsaWMgbW9kdWxlOlxyXG5tb2R1bGUuZXhwb3J0cyA9IEJpbmRhYmxlQ29tcG9uZW50OyIsIi8qKiBDb21wb25lbnQgY2xhc3M6IHdyYXBwZXIgZm9yXHJcbiAgdGhlIGxvZ2ljIGFuZCBiZWhhdmlvciBhcm91bmRcclxuICBhIERPTSBlbGVtZW50XHJcbioqL1xyXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKTtcclxuXHJcbmZ1bmN0aW9uIENvbXBvbmVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgdGhpcy5lbCA9IGVsZW1lbnQ7XHJcbiAgdGhpcy4kZWwgPSAkKGVsZW1lbnQpO1xyXG4gIGV4dGVuZCh0aGlzLCBvcHRpb25zKTtcclxuICAvLyBVc2UgdGhlIGpRdWVyeSAnZGF0YScgc3RvcmFnZSB0byBwcmVzZXJ2ZSBhIHJlZmVyZW5jZVxyXG4gIC8vIHRvIHRoaXMgaW5zdGFuY2UgKHVzZWZ1bCB0byByZXRyaWV2ZSBpdCBmcm9tIGRvY3VtZW50KVxyXG4gIHRoaXMuJGVsLmRhdGEoJ2NvbXBvbmVudCcsIHRoaXMpO1xyXG59XHJcblxyXG5leHRlbmQucGx1Z0luKENvbXBvbmVudCk7XHJcbmV4dGVuZC5wbHVnSW4oQ29tcG9uZW50LnByb3RvdHlwZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDsiLCIvKipcclxuICBEYXRhU291cmNlIGNsYXNzIHRvIHNpbXBsaWZ5IGZldGNoaW5nIGRhdGEgYXMgSlNPTlxyXG4gIHRvIGZpbGwgYSBsb2NhbCBjYWNoZS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBmZXRjaEpTT04gPSAkLmdldEpTT04sXHJcbiAgICBleHRlbmQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAkLmV4dGVuZC5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTsgfTtcclxuXHJcbi8vIFRPRE86IHJlcGxhY2UgZWFjaCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgYnkgaW5zdGFuY2UgcHJvcGVydGllcywgc2luY2UgdGhhdCBwcm9wZXJ0aWVzIGJlY29tZVxyXG4vLyBzaGFyZWQgYmV0d2VlbiBpbnN0YW5jZXMgYW5kIGlzIG5vdCB3YW50ZWRcclxuXHJcbnZhciByZXFNb2RlcyA9IERhdGFTb3VyY2UucmVxdWVzdE1vZGVzID0ge1xyXG4gIC8vIFBhcmFsbGVsIHJlcXVlc3QsIG5vIG1hdHRlciBvZiBvdGhlcnNcclxuICBtdWx0aXBsZTogMCxcclxuICAvLyBXaWxsIGF2b2lkIGEgcmVxdWVzdCBpZiB0aGVyZSBpcyBvbmUgcnVubmluZ1xyXG4gIHNpbmdsZTogMSxcclxuICAvLyBMYXRlc3QgcmVxdWV0IHdpbGwgcmVwbGFjZSBhbnkgcHJldmlvdXMgb25lIChwcmV2aW91cyB3aWxsIGFib3J0KVxyXG4gIHJlcGxhY2U6IDJcclxufTtcclxuXHJcbnZhciB1cGRNb2RlcyA9IERhdGFTb3VyY2UudXBkYXRlTW9kZXMgPSB7XHJcbiAgLy8gRXZlcnkgbmV3IGRhdGEgdXBkYXRlLCBuZXcgY29udGVudCBpcyBhZGRlZCBpbmNyZW1lbnRhbGx5XHJcbiAgLy8gKG92ZXJ3cml0ZSBjb2luY2lkZW50IGNvbnRlbnQsIGFwcGVuZCBuZXcgY29udGVudCwgb2xkIGNvbnRlbnRcclxuICAvLyBnZXQgaW4gcGxhY2UpXHJcbiAgaW5jcmVtZW50YWw6IDAsXHJcbiAgLy8gT24gbmV3IGRhdGEgdXBkYXRlLCBuZXcgZGF0YSB0b3RhbGx5IHJlcGxhY2UgdGhlIHByZXZpb3VzIG9uZVxyXG4gIHJlcGxhY2VtZW50OiAxXHJcbn07XHJcblxyXG4vKipcclxuVXBkYXRlIHRoZSBkYXRhIHN0b3JlIG9yIGNhY2hlIHdpdGggdGhlIGdpdmVuIG9uZS5cclxuVGhlcmUgYXJlIGRpZmZlcmVudCBtb2RlcywgdGhpcyBtYW5hZ2VzIHRoYXQgbG9naWMgYW5kXHJcbml0cyBvd24gY29uZmlndXJhdGlvbi5cclxuSXMgZGVjb3VwbGVkIGZyb20gdGhlIHByb3RvdHlwZSBidXRcclxuaXQgd29ya3Mgb25seSBhcyBwYXJ0IG9mIGEgRGF0YVNvdXJjZSBpbnN0YW5jZS5cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURhdGEoZGF0YSwgbW9kZSkge1xyXG4gIHN3aXRjaCAobW9kZSB8fCB0aGlzLnVwZGF0ZURhdGEuZGVmYXVsdFVwZGF0ZU1vZGUpIHtcclxuXHJcbiAgICBjYXNlIHVwZE1vZGVzLnJlcGxhY2VtZW50OlxyXG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICAvL2Nhc2UgdXBkTW9kZXMuaW5jcmVtZW50YWw6ICBcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIC8vIEluIGNhc2UgaW5pdGlhbCBkYXRhIGlzIG51bGwsIGFzc2lnbiB0aGUgcmVzdWx0IHRvIGl0c2VsZjpcclxuICAgICAgdGhpcy5kYXRhID0gZXh0ZW5kKHRoaXMuZGF0YSwgZGF0YSk7XHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxufVxyXG5cclxuLyoqIERlZmF1bHQgdmFsdWUgZm9yIHRoZSBjb25maWd1cmFibGUgdXBkYXRlIG1vZGU6XHJcbioqL1xyXG51cGRhdGVEYXRhLmRlZmF1bHRVcGRhdGVNb2RlID0gdXBkTW9kZXMuaW5jcmVtZW50YWw7XHJcblxyXG4vKipcclxuRmV0Y2ggdGhlIGRhdGEgZnJvbSB0aGUgc2VydmVyLlxyXG5IZXJlIGlzIGRlY291cGxlZCBmcm9tIHRoZSByZXN0IG9mIHRoZSBwcm90b3R5cGUgZm9yXHJcbmNvbW1vZGl0eSwgYnV0IGl0IGNhbiB3b3JrcyBvbmx5IGFzIHBhcnQgb2YgYSBEYXRhU291cmNlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gZmV0Y2hEYXRhKHF1ZXJ5LCBtb2RlKSB7XHJcbiAgcXVlcnkgPSBleHRlbmQoe30sIHRoaXMucXVlcnksIHF1ZXJ5KTtcclxuICBzd2l0Y2ggKG1vZGUgfHwgdGhpcy5mZXRjaERhdGEuZGVmYXVsdFJlcXVlc3RNb2RlKSB7XHJcblxyXG4gICAgY2FzZSByZXFNb2Rlcy5zaW5nbGU6XHJcbiAgICAgIGlmICh0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHJldHVybiBudWxsO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIHJlcU1vZGVzLnJlcGxhY2U6XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHNbaV0uYWJvcnQoKTtcclxuICAgICAgICB9IGNhdGNoIChleCkgeyB9XHJcbiAgICAgICAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMgPSBbXTtcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuXHJcbiAgICAvLyBKdXN0IGRvIG5vdGhpbmcgZm9yIG11bHRpcGxlIG9yIGRlZmF1bHQgICAgIFxyXG4gICAgLy9jYXNlIHJlcU1vZGVzLm11bHRpcGxlOiAgXHJcbiAgICAvL2RlZmF1bHQ6IFxyXG4gIH1cclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIHZhciByZXEgPSB0aGlzLmZldGNoRGF0YS5wcm94eShcclxuICAgIHRoaXMudXJsLFxyXG4gICAgcXVlcnksXHJcbiAgICBmdW5jdGlvbiAoZGF0YSwgdCwgeGhyKSB7XHJcbiAgICAgIHZhciByZXQgPSB0aGF0LnVwZGF0ZURhdGEoZGF0YSk7XHJcbiAgICAgIHRoYXQuZmV0Y2hEYXRhLnJlcXVlc3RzLnNwbGljZSh0aGF0LmZldGNoRGF0YS5yZXF1ZXN0cy5pbmRleE9mKHJlcSksIDEpO1xyXG4gICAgICAvL2RlbGV0ZSBmZXRjaERhdGEucmVxdWVzdHNbZmV0Y2hEYXRhLnJlcXVlc3RzLmluZGV4T2YocmVxKV07XHJcblxyXG4gICAgICBpZiAocmV0ICYmIHJldC5uYW1lKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIGRhdGEgZW1pdHMgZXJyb3IsIHRoZSBBamF4IHN0aWxsIHJlc29sdmVzIGFzICdzdWNjZXNzJyBiZWNhdXNlIG9mIHRoZSByZXF1ZXN0LCBidXRcclxuICAgICAgICAvLyB3ZSBuZWVkIHRvIGV4ZWN1dGUgdGhlIGVycm9yLCBidXQgd2UgcGlwZSBpdCB0byBlbnN1cmUgaXMgZG9uZSBhZnRlciBvdGhlciAnZG9uZScgY2FsbGJhY2tzXHJcbiAgICAgICAgcmVxLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB0aGF0LmZldGNoRGF0YS5vbmVycm9yLmNhbGwodGhhdCwgbnVsbCwgcmV0Lm5hbWUsIHJldCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcbiAgKVxyXG4gIC5mYWlsKCQucHJveHkodGhpcy5mZXRjaERhdGEub25lcnJvciwgdGhpcykpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLnB1c2gocmVxKTtcclxuXHJcbiAgcmV0dXJuIHJlcTtcclxufVxyXG5cclxuLy8gRGVmYXVsdHMgZmV0Y2hEYXRhIHByb3BlcnRpZXMsIHRoZXkgYXJlIGRlY291cGxlZCB0byBhbGxvd1xyXG4vLyByZXBsYWNlbWVudCwgYW5kIGluc2lkZSB0aGUgZmV0Y2hEYXRhIGZ1bmN0aW9uIHRvIGRvbid0XHJcbi8vIGNvbnRhbWluYXRlIHRoZSBvYmplY3QgbmFtZXNwYWNlLlxyXG5cclxuLyogQ29sbGVjdGlvbiBvZiBhY3RpdmUgKGZldGNoaW5nKSByZXF1ZXN0cyB0byB0aGUgc2VydmVyXHJcbiovXHJcbmZldGNoRGF0YS5yZXF1ZXN0cyA9IFtdO1xyXG5cclxuLyogRGVjb3VwbGVkIGZ1bmN0aW9uYWxpdHkgdG8gcGVyZm9ybSB0aGUgQWpheCBvcGVyYXRpb24sXHJcbnRoaXMgYWxsb3dzIG92ZXJ3cml0ZSB0aGlzIGJlaGF2aW9yIHRvIGltcGxlbWVudCBhbm90aGVyXHJcbndheXMsIGxpa2UgYSBub24talF1ZXJ5IGltcGxlbWVudGF0aW9uLCBhIHByb3h5IHRvIGZha2Ugc2VydmVyXHJcbmZvciB0ZXN0aW5nIG9yIHByb3h5IHRvIGxvY2FsIHN0b3JhZ2UgaWYgb25saW5lLCBldGMuXHJcbkl0IG11c3QgcmV0dXJucyB0aGUgdXNlZCByZXF1ZXN0IG9iamVjdC5cclxuKi9cclxuZmV0Y2hEYXRhLnByb3h5ID0gZmV0Y2hKU09OO1xyXG5cclxuLyogQnkgZGVmYXVsdCwgZmV0Y2hEYXRhIGFsbG93cyBtdWx0aXBsZSBzaW11bHRhbmVvcyBjb25uZWN0aW9uLFxyXG5zaW5jZSB0aGUgc3RvcmFnZSBieSBkZWZhdWx0IGFsbG93cyBpbmNyZW1lbnRhbCB1cGRhdGVzIHJhdGhlclxyXG50aGFuIHJlcGxhY2VtZW50cy5cclxuKi9cclxuZmV0Y2hEYXRhLmRlZmF1bHRSZXF1ZXN0TW9kZSA9IHJlcU1vZGVzLm11bHRpcGxlO1xyXG5cclxuLyogRGVmYXVsdCBub3RpZmljYXRpb24gb2YgZXJyb3Igb24gZmV0Y2hpbmcsIGp1c3QgbG9nZ2luZyxcclxuY2FuIGJlIHJlcGxhY2VkLlxyXG5JdCByZWNlaXZlcyB0aGUgcmVxdWVzdCBvYmplY3QsIHN0YXR1cyBhbmQgZXJyb3IuXHJcbiovXHJcbmZldGNoRGF0YS5vbmVycm9yID0gZnVuY3Rpb24gZXJyb3IoeCwgcywgZSkge1xyXG4gIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ0ZldGNoIGRhdGEgZXJyb3IgJW8nLCBlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gIERhdGFTb3VyY2UgY2xhc3NcclxuKiovXHJcbi8vIENvbnN0cnVjdG9yOiBldmVyeXRoaW5nIGlzIGluIHRoZSBwcm90b3R5cGUuXHJcbmZ1bmN0aW9uIERhdGFTb3VyY2UoKSB7IH1cclxuRGF0YVNvdXJjZS5wcm90b3R5cGUgPSB7XHJcbiAgZGF0YTogbnVsbCxcclxuICB1cmw6ICcvJyxcclxuICAvLyBxdWVyeTogb2JqZWN0IHdpdGggZGVmYXVsdCBleHRyYSBpbmZvcm1hdGlvbiB0byBhcHBlbmQgdG8gdGhlIHVybFxyXG4gIC8vIHdoZW4gZmV0Y2hpbmcgZGF0YSwgZXh0ZW5kZWQgd2l0aCB0aGUgZXhwbGljaXQgcXVlcnkgc3BlY2lmaWVkXHJcbiAgLy8gZXhlY3V0aW5nIGZldGNoRGF0YShxdWVyeSlcclxuICBxdWVyeToge30sXHJcbiAgdXBkYXRlRGF0YTogdXBkYXRlRGF0YSxcclxuICBmZXRjaERhdGE6IGZldGNoRGF0YVxyXG4gIC8vIFRPRE8gIHB1c2hEYXRhOiBmdW5jdGlvbigpeyBwb3N0L3B1dCB0aGlzLmRhdGEgdG8gdXJsICB9XHJcbn07XHJcblxyXG4vLyBDbGFzcyBhcyBwdWJsaWMgbW9kdWxlOlxyXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFTb3VyY2U7IiwiLyoqXHJcbiAgTG9jb25vbWljcyBzcGVjaWZpYyBXaWRnZXQgYmFzZWQgb24gQmluZGFibGVDb21wb25lbnQuXHJcbiAgSnVzdCBkZWNvdXBsaW5nIHNwZWNpZmljIGJlaGF2aW9ycyBmcm9tIHNvbWV0aGluZyBtb3JlIGdlbmVyYWxcclxuICB0byBlYXNpbHkgdHJhY2sgdGhhdCBkZXRhaWxzLCBhbmQgbWF5YmUgZnV0dXJlIG1pZ3JhdGlvbnMgdG9cclxuICBvdGhlciBmcm9udC1lbmQgZnJhbWV3b3Jrcy5cclxuKiovXHJcbnZhciBEYXRhU291cmNlID0gcmVxdWlyZSgnLi9EYXRhU291cmNlJyk7XHJcbnZhciBCaW5kYWJsZUNvbXBvbmVudCA9IHJlcXVpcmUoJy4vQmluZGFibGVDb21wb25lbnQnKTtcclxuXHJcbnZhciBMY1dpZGdldCA9IEJpbmRhYmxlQ29tcG9uZW50LmV4dGVuZChcclxuICAvLyBQcm90b3R5cGVcclxuICB7XHJcbiAgICAvLyBSZXBsYWNpbmcgdXBkYXRlRGF0YSB0byBpbXBsZW1lbnQgdGhlIHBhcnRpY3VsYXJcclxuICAgIC8vIEpTT04gc2NoZW1lIG9mIExvY29ub21pY3MsIGJ1dCByZXVzaW5nIG9yaWdpbmFsXHJcbiAgICAvLyBsb2dpYyBpbmhlcml0IGZyb20gRGF0YVNvdXJjZVxyXG4gICAgdXBkYXRlRGF0YTogZnVuY3Rpb24gKGRhdGEsIG1vZGUpIHtcclxuICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgRGF0YVNvdXJjZS5wcm90b3R5cGUudXBkYXRlRGF0YS5jYWxsKHRoaXMsIGRhdGEuUmVzdWx0LCBtb2RlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBFcnJvciBtZXNzYWdlIGluIHRoZSBKU09OXHJcbiAgICAgICAgcmV0dXJuIHsgbmFtZTogJ2RhdGEtZm9ybWF0JywgbWVzc2FnZTogZGF0YS5SZXN1bHQgPyBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgPyBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgOiBkYXRhLlJlc3VsdCA6IFwidW5rbm93XCIgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gQ29uc3RydWN0b3JcclxuICBmdW5jdGlvbiBMY1dpZGdldChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICBCaW5kYWJsZUNvbXBvbmVudC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIH1cclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGNXaWRnZXQ7IiwiLyoqXHJcbiAgRGVlcCBFeHRlbmQgb2JqZWN0IHV0aWxpdHksIGlzIHJlY3Vyc2l2ZSB0byBnZXQgYWxsIHRoZSBkZXB0aFxyXG4gIGJ1dCBvbmx5IGZvciB0aGUgcHJvcGVydGllcyBvd25lZCBieSB0aGUgb2JqZWN0LFxyXG4gIGlmIHlvdSBuZWVkIHRoZSBub24tb3duZWQgcHJvcGVydGllcyB0byBpbiB0aGUgb2JqZWN0LFxyXG4gIGNvbnNpZGVyIGV4dGVuZCBmcm9tIHRoZSBzb3VyY2UgcHJvdG90eXBlIHRvbyAoYW5kIG1heWJlIHRvXHJcbiAgdGhlIGRlc3RpbmF0aW9uIHByb3RvdHlwZSBpbnN0ZWFkIG9mIHRoZSBpbnN0YW5jZSwgYnV0IHVwIHRvIHRvbykuXHJcbioqL1xyXG5cclxuLyoganF1ZXJ5IGltcGxlbWVudGF0aW9uOlxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5leHRlbmQgPSBmdW5jdGlvbiAoKSB7XHJcbnJldHVybiAkLmV4dGVuZC5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTsgXHJcbn07Ki9cclxuXHJcbnZhciBleHRlbmQgPSBmdW5jdGlvbiBleHRlbmQoZGVzdGluYXRpb24sIHNvdXJjZSkge1xyXG4gIGZvciAodmFyIHByb3BlcnR5IGluIHNvdXJjZSkge1xyXG4gICAgaWYgKCFzb3VyY2UuaGFzT3duUHJvcGVydHkocHJvcGVydHkpKVxyXG4gICAgICBjb250aW51ZTtcclxuXHJcbiAgICAvLyBBbGxvdyBwcm9wZXJ0aWVzIHJlbW92YWwsIGlmIHNvdXJjZSBjb250YWlucyB2YWx1ZSAndW5kZWZpbmVkJy5cclxuICAgIC8vIFRoZXJlIGFyZSBubyBzcGVjaWFsIGNvbnNpZGVyYXRpb25zIG9uIEFycmF5cywgdG8gZG9uJ3QgZ2V0IHVuZGVzaXJlZFxyXG4gICAgLy8gcmVzdWx0cyBqdXN0IHRoZSB3YW50ZWQgaXMgdG8gcmVwbGFjZSBzcGVjaWZpYyBwb3NpdGlvbnMsIG5vcm1hbGx5LlxyXG4gICAgaWYgKHNvdXJjZVtwcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkZWxldGUgZGVzdGluYXRpb25bcHJvcGVydHldO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoWydvYmplY3QnLCAnZnVuY3Rpb24nXS5pbmRleE9mKHR5cGVvZiBkZXN0aW5hdGlvbltwcm9wZXJ0eV0pICE9IC0xICYmXHJcbiAgICAgICAgICAgIHR5cGVvZiBzb3VyY2VbcHJvcGVydHldID09ICdvYmplY3QnKVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBzb3VyY2VbcHJvcGVydHldKTtcclxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPT0gJ2Z1bmN0aW9uJyAmJlxyXG4gICAgICAgICAgICAgICAgIHR5cGVvZiBzb3VyY2VbcHJvcGVydHldID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdmFyIG9yaWcgPSBkZXN0aW5hdGlvbltwcm9wZXJ0eV07XHJcbiAgICAgIC8vIENsb25lIGZ1bmN0aW9uXHJcbiAgICAgIHZhciBzb3VyID0gY2xvbmVGdW5jdGlvbihzb3VyY2VbcHJvcGVydHldKTtcclxuICAgICAgZGVzdGluYXRpb25bcHJvcGVydHldID0gc291cjtcclxuICAgICAgLy8gQW55IHByZXZpb3VzIGF0dGFjaGVkIHByb3BlcnR5XHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIG9yaWcpO1xyXG4gICAgICAvLyBBbnkgc291cmNlIGF0dGFjaGVkIHByb3BlcnR5XHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAgICBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPSBzb3VyY2VbcHJvcGVydHldO1xyXG4gIH1cclxuXHJcbiAgLy8gU28gbXVjaCAnc291cmNlJyBhcmd1bWVudHMgYXMgd2FudGVkLiBJbiBFUzYgd2lsbCBiZSAnc291cmNlLi4nXHJcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XHJcbiAgICB2YXIgbmV4dHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xyXG4gICAgbmV4dHMuc3BsaWNlKDEsIDEpO1xyXG4gICAgZXh0ZW5kLmFwcGx5KHRoaXMsIG5leHRzKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBkZXN0aW5hdGlvbjtcclxufTtcclxuXHJcbmV4dGVuZC5wbHVnSW4gPSBmdW5jdGlvbiBwbHVnSW4ob2JqKSB7XHJcbiAgb2JqID0gb2JqIHx8IE9iamVjdC5wcm90b3R5cGU7XHJcbiAgb2JqLmV4dGVuZE1lID0gZnVuY3Rpb24gZXh0ZW5kTWUoKSB7XHJcbiAgICBleHRlbmQuYXBwbHkodGhpcywgW3RoaXNdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XHJcbiAgfTtcclxuICBvYmouZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kSW5zdGFuY2UoKSB7XHJcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXHJcbiAgICAgIC8vIElmIHRoZSBvYmplY3QgdXNlZCB0byBleHRlbmQgZnJvbSBpcyBhIGZ1bmN0aW9uLCBpcyBjb25zaWRlcmVkXHJcbiAgICAgIC8vIGEgY29uc3RydWN0b3IsIHRoZW4gd2UgZXh0ZW5kIGZyb20gaXRzIHByb3RvdHlwZSwgb3RoZXJ3aXNlIGl0c2VsZi5cclxuICAgICAgY29uc3RydWN0b3JBID0gdHlwZW9mIHRoaXMgPT0gJ2Z1bmN0aW9uJyA/IHRoaXMgOiBudWxsLFxyXG4gICAgICBiYXNlQSA9IGNvbnN0cnVjdG9yQSA/IHRoaXMucHJvdG90eXBlIDogdGhpcyxcclxuICAgICAgLy8gSWYgbGFzdCBhcmd1bWVudCBpcyBhIGZ1bmN0aW9uLCBpcyBjb25zaWRlcmVkIGEgY29uc3RydWN0b3JcclxuICAgICAgLy8gb2YgdGhlIG5ldyBjbGFzcy9vYmplY3QgdGhlbiB3ZSBleHRlbmQgaXRzIHByb3RvdHlwZS5cclxuICAgICAgLy8gV2UgdXNlIGFuIGVtcHR5IG9iamVjdCBvdGhlcndpc2UuXHJcbiAgICAgIGNvbnN0cnVjdG9yQiA9IHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT0gJ2Z1bmN0aW9uJyA/XHJcbiAgICAgICAgYXJncy5zcGxpY2UoYXJncy5sZW5ndGggLSAxKVswXSA6XHJcbiAgICAgICAgbnVsbCxcclxuICAgICAgYmFzZUIgPSBjb25zdHJ1Y3RvckIgPyBjb25zdHJ1Y3RvckIucHJvdG90eXBlIDoge307XHJcblxyXG4gICAgdmFyIGV4dGVuZGVkUmVzdWx0ID0gZXh0ZW5kLmFwcGx5KHRoaXMsIFtiYXNlQiwgYmFzZUFdLmNvbmNhdChhcmdzKSk7XHJcbiAgICAvLyBJZiBib3RoIGFyZSBjb25zdHJ1Y3RvcnMsIHdlIHdhbnQgdGhlIHN0YXRpYyBtZXRob2RzIHRvIGJlIGNvcGllZCB0b286XHJcbiAgICBpZiAoY29uc3RydWN0b3JBICYmIGNvbnN0cnVjdG9yQilcclxuICAgICAgZXh0ZW5kKGNvbnN0cnVjdG9yQiwgY29uc3RydWN0b3JBKTtcclxuXHJcbiAgICAvLyBJZiB3ZSBhcmUgZXh0ZW5kaW5nIGEgY29uc3RydWN0b3IsIHdlIHJldHVybiB0aGF0LCBvdGhlcndpc2UgdGhlIHJlc3VsdFxyXG4gICAgcmV0dXJuIGNvbnN0cnVjdG9yQiB8fCBleHRlbmRlZFJlc3VsdDtcclxuICB9O1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBleHRlbmQ7XHJcbn0gZWxzZSB7XHJcbiAgLy8gZ2xvYmFsIHNjb3BlXHJcbiAgZXh0ZW5kLnBsdWdJbigpO1xyXG59XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICBDbG9uZSBVdGlsc1xyXG4qL1xyXG5mdW5jdGlvbiBjbG9uZU9iamVjdChvYmopIHtcclxuICByZXR1cm4gZXh0ZW5kKHt9LCBvYmopO1xyXG59XHJcblxyXG4vLyBUZXN0aW5nIGlmIGEgc3RyaW5nIHNlZW1zIGEgZnVuY3Rpb24gc291cmNlIGNvZGU6XHJcbi8vIFdlIHRlc3QgYWdhaW5zIGEgc2ltcGxpc2ljIHJlZ3VsYXIgZXhwcmVzaW9uIHRoYXQgbWF0Y2hcclxuLy8gYSBjb21tb24gc3RhcnQgb2YgZnVuY3Rpb24gZGVjbGFyYXRpb24uXHJcbi8vIE90aGVyIHdheXMgdG8gZG8gdGhpcyBpcyBhdCBpbnZlcnNlciwgYnkgY2hlY2tpbmdcclxuLy8gdGhhdCB0aGUgZnVuY3Rpb24gdG9TdHJpbmcgaXMgbm90IGEga25vd2VkIHRleHRcclxuLy8gYXMgJ1tvYmplY3QgRnVuY3Rpb25dJyBvciAnW25hdGl2ZSBjb2RlXScsIGJ1dFxyXG4vLyBzaW5jZSB0aGEgY2FuIGNoYW5nZXMgYmV0d2VlbiBicm93c2VycywgaXMgbW9yZSBjb25zZXJ2YXRpdmVcclxuLy8gY2hlY2sgYWdhaW5zdCBhIGNvbW1vbiBjb25zdHJ1Y3QgYW4gZmFsbGJhY2sgb24gdGhlXHJcbi8vIGNvbW1vbiBzb2x1dGlvbiBpZiBub3QgbWF0Y2hlcy5cclxudmFyIHRlc3RGdW5jdGlvbiA9IC9eXFxzKmZ1bmN0aW9uW15cXChdXFwoLztcclxuXHJcbmZ1bmN0aW9uIGNsb25lRnVuY3Rpb24oZm4pIHtcclxuICB2YXIgdGVtcDtcclxuICB2YXIgY29udGVudHMgPSBmbi50b1N0cmluZygpO1xyXG4gIC8vIENvcHkgdG8gYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIHNhbWUgcHJvdG90eXBlLCBmb3IgdGhlIG5vdCAnb3duZWQnIHByb3BlcnRpZXMuXHJcbiAgLy8gQXNzaW5nZWQgYXQgdGhlIGVuZFxyXG4gIHZhciB0ZW1wUHJvdG8gPSBPYmplY3QuY3JlYXRlKGZuLnByb3RvdHlwZSk7XHJcblxyXG4gIC8vIERJU0FCTEVEIHRoZSBjb250ZW50cy1jb3B5IHBhcnQgYmVjYXVzZSBpdCBmYWlscyB3aXRoIGNsb3N1cmVzXHJcbiAgLy8gZ2VuZXJhdGVkIGJ5IHRoZSBvcmlnaW5hbCBmdW5jdGlvbiwgdXNpbmcgdGhlIHN1Yi1jYWxsIHdheSBldmVyXHJcbiAgaWYgKHRydWUgfHwgIXRlc3RGdW5jdGlvbi50ZXN0KGNvbnRlbnRzKSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgaXMgYWxyZWFkeSBhIGNsb25lZCBjb3B5LCB0b1xyXG4gICAgLy8gcmV1c2UgdGhlIG9yaWdpbmFsIGNvZGUgYW5kIGF2b2lkIG1vcmUgdGhhblxyXG4gICAgLy8gb25lIGRlcHRoIGluIHN0YWNrIGNhbGxzIChncmVhdCEpXHJcbiAgICBpZiAodHlwZW9mIGZuLnByb3RvdHlwZS5fX19jbG9uZWRfb2YgPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgZm4gPSBmbi5wcm90b3R5cGUuX19fY2xvbmVkX29mO1xyXG5cclxuICAgIHRlbXAgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmbi5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTsgfTtcclxuXHJcbiAgICAvLyBTYXZlIG1hcmsgYXMgY2xvbmVkLiBEb25lIGluIGl0cyBwcm90b3R5cGVcclxuICAgIC8vIHRvIG5vdCBhcHBlYXIgaW4gdGhlIGxpc3Qgb2YgJ293bmVkJyBwcm9wZXJ0aWVzLlxyXG4gICAgdGVtcFByb3RvLl9fX2Nsb25lZF9vZiA9IGZuO1xyXG4gICAgLy8gUmVwbGFjZSB0b1N0cmluZyB0byByZXR1cm4gdGhlIG9yaWdpbmFsIHNvdXJjZTpcclxuICAgIHRlbXBQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIGZuLnRvU3RyaW5nKCk7XHJcbiAgICB9O1xyXG4gICAgLy8gVGhlIG5hbWUgY2Fubm90IGJlIHNldCwgd2lsbCBqdXN0IGJlIGFub255bW91c1xyXG4gICAgLy90ZW1wLm5hbWUgPSB0aGF0Lm5hbWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFRoaXMgd2F5IG9uIGNhcGFibGUgYnJvd3NlcnMgcHJlc2VydmUgdGhlIG9yaWdpbmFsIG5hbWUsXHJcbiAgICAvLyBkbyBhIHJlYWwgaW5kZXBlbmRlbnQgY29weSBhbmQgYXZvaWQgZnVuY3Rpb24gc3ViY2FsbHMgdGhhdFxyXG4gICAgLy8gY2FuIGRlZ3JhdGUgcGVyZm9ybWFuY2UgYWZ0ZXIgbG90IG9mICdjbG9ubmluZycuXHJcbiAgICB2YXIgZiA9IEZ1bmN0aW9uO1xyXG4gICAgdGVtcCA9IChuZXcgZigncmV0dXJuICcgKyBjb250ZW50cykpKCk7XHJcbiAgfVxyXG5cclxuICB0ZW1wLnByb3RvdHlwZSA9IHRlbXBQcm90bztcclxuICAvLyBDb3B5IGFueSBwcm9wZXJ0aWVzIGl0IG93bnNcclxuICBleHRlbmQodGVtcCwgZm4pO1xyXG5cclxuICByZXR1cm4gdGVtcDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xvbmVQbHVnSW4oKSB7XHJcbiAgaWYgKHR5cGVvZiBGdW5jdGlvbi5wcm90b3R5cGUuY2xvbmUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkgeyByZXR1cm4gY2xvbmVGdW5jdGlvbih0aGlzKTsgfTtcclxuICB9XHJcbiAgaWYgKHR5cGVvZiBPYmplY3QucHJvdG90eXBlLmNsb25lICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBPamJlY3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUoKSB7IHJldHVybiBjbG9uZU9iamVjdCh0aGlzKTsgfTtcclxuICB9XHJcbn1cclxuXHJcbmV4dGVuZC5jbG9uZU9iamVjdCA9IGNsb25lT2JqZWN0O1xyXG5leHRlbmQuY2xvbmVGdW5jdGlvbiA9IGNsb25lRnVuY3Rpb247XHJcbmV4dGVuZC5jbG9uZVBsdWdJbiA9IGNsb25lUGx1Z0luO1xyXG4iLCIvKipcclxuKiBDb29raWVzIG1hbmFnZW1lbnQuXHJcbiogTW9zdCBjb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNDgyNTY5NS8xNjIyMzQ2XHJcbiovXHJcbnZhciBDb29raWUgPSB7fTtcclxuXHJcbkNvb2tpZS5zZXQgPSBmdW5jdGlvbiBzZXRDb29raWUobmFtZSwgdmFsdWUsIGRheXMpIHtcclxuICAgIHZhciBleHBpcmVzID0gXCJcIjtcclxuICAgIGlmIChkYXlzKSB7XHJcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGRhdGUuc2V0VGltZShkYXRlLmdldFRpbWUoKSArIChkYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCkpO1xyXG4gICAgICAgIGV4cGlyZXMgPSBcIjsgZXhwaXJlcz1cIiArIGRhdGUudG9HTVRTdHJpbmcoKTtcclxuICAgIH1cclxuICAgIGRvY3VtZW50LmNvb2tpZSA9IG5hbWUgKyBcIj1cIiArIHZhbHVlICsgZXhwaXJlcyArIFwiOyBwYXRoPS9cIjtcclxufTtcclxuQ29va2llLmdldCA9IGZ1bmN0aW9uIGdldENvb2tpZShjX25hbWUpIHtcclxuICAgIGlmIChkb2N1bWVudC5jb29raWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNfc3RhcnQgPSBkb2N1bWVudC5jb29raWUuaW5kZXhPZihjX25hbWUgKyBcIj1cIik7XHJcbiAgICAgICAgaWYgKGNfc3RhcnQgIT0gLTEpIHtcclxuICAgICAgICAgICAgY19zdGFydCA9IGNfc3RhcnQgKyBjX25hbWUubGVuZ3RoICsgMTtcclxuICAgICAgICAgICAgY19lbmQgPSBkb2N1bWVudC5jb29raWUuaW5kZXhPZihcIjtcIiwgY19zdGFydCk7XHJcbiAgICAgICAgICAgIGlmIChjX2VuZCA9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgY19lbmQgPSBkb2N1bWVudC5jb29raWUubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB1bmVzY2FwZShkb2N1bWVudC5jb29raWUuc3Vic3RyaW5nKGNfc3RhcnQsIGNfZW5kKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFwiXCI7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IENvb2tpZTsiLCIvKiogQ29ubmVjdCBhY2NvdW50IHdpdGggRmFjZWJvb2tcclxuKiovXHJcbnZhclxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpLFxyXG4gIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyksXHJcbiAgTGNVcmwgPSByZXF1aXJlKCcuL0xjVXJsJyksXHJcbiAgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxuZnVuY3Rpb24gRmFjZWJvb2tDb25uZWN0KG9wdGlvbnMpIHtcclxuICAkLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcclxuICBpZiAoISQoJyNmYi1yb290JykubGVuZ3RoKVxyXG4gICAgJCgnPGRpdiBpZD1cImZiLXJvb3RcIiBzdHlsZT1cImRpc3BsYXk6IG5vbmVcIj48L2Rpdj4nKS5hcHBlbmRUbygnYm9keScpO1xyXG59XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlID0ge1xyXG4gIGFwcElkOiBudWxsLFxyXG4gIGxhbmc6ICdlbl9VUycsXHJcbiAgcmVzdWx0VHlwZTogJ2pzb24nLCAvLyAncmVkaXJlY3QnXHJcbiAgZmJVcmxCYXNlOiAnLy9jb25uZWN0LmZhY2Vib29rLm5ldC9AKGxhbmcpL2FsbC5qcycsXHJcbiAgc2VydmVyVXJsQmFzZTogTGNVcmwuTGFuZ1BhdGggKyAnQWNjb3VudC9GYWNlYm9vay9AKHVybFNlY3Rpb24pLz9SZWRpcmVjdD1AKHJlZGlyZWN0VXJsKSZwcm9maWxlPUAocHJvZmlsZVVybCknLFxyXG4gIHJlZGlyZWN0VXJsOiAnJyxcclxuICBwcm9maWxlVXJsOiAnJyxcclxuICB1cmxTZWN0aW9uOiAnJyxcclxuICBsb2FkaW5nVGV4dDogJ1ZlcmlmaW5nJyxcclxuICBwZXJtaXNzaW9uczogJycsXHJcbiAgbGliTG9hZGVkRXZlbnQ6ICdGYWNlYm9va0Nvbm5lY3RMaWJMb2FkZWQnLFxyXG4gIGNvbm5lY3RlZEV2ZW50OiAnRmFjZWJvb2tDb25uZWN0Q29ubmVjdGVkJ1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5nZXRGYlVybCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmZiVXJsQmFzZS5yZXBsYWNlKC9AXFwobGFuZ1xcKS9nLCB0aGlzLmxhbmcpO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5nZXRTZXJ2ZXJVcmwgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5zZXJ2ZXJVcmxCYXNlXHJcbiAgLnJlcGxhY2UoL0BcXChyZWRpcmVjdFVybFxcKS9nLCB0aGlzLnJlZGlyZWN0VXJsKVxyXG4gIC5yZXBsYWNlKC9AXFwocHJvZmlsZVVybFxcKS9nLCB0aGlzLnByb2ZpbGVVcmwpXHJcbiAgLnJlcGxhY2UoL0BcXCh1cmxTZWN0aW9uXFwpL2csIHRoaXMudXJsU2VjdGlvbik7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmxvYWRMaWIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgLy8gT25seSBpZiBpcyBub3QgbG9hZGVkIHN0aWxsXHJcbiAgLy8gKEZhY2Vib29rIHNjcmlwdCBhdHRhY2ggaXRzZWxmIGFzIHRoZSBnbG9iYWwgdmFyaWFibGUgJ0ZCJylcclxuICBpZiAoIXdpbmRvdy5GQiAmJiAhdGhpcy5fbG9hZGluZ0xpYikge1xyXG4gICAgdGhpcy5fbG9hZGluZ0xpYiA9IHRydWU7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICBsb2FkZXIubG9hZCh7XHJcbiAgICAgIHNjcmlwdHM6IFt0aGlzLmdldEZiVXJsKCldLFxyXG4gICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIEZCLmluaXQoeyBhcHBJZDogdGhhdC5hcHBJZCwgc3RhdHVzOiB0cnVlLCBjb29raWU6IHRydWUsIHhmYm1sOiB0cnVlIH0pO1xyXG4gICAgICAgIHRoYXQubG9hZGluZ0xpYiA9IGZhbHNlO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIodGhhdC5saWJMb2FkZWRFdmVudCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICEhd2luZG93LkZCO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLnByb2Nlc3NSZXNwb25zZSA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gIGlmIChyZXNwb25zZS5hdXRoUmVzcG9uc2UpIHtcclxuICAgIC8vY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogV2VsY29tZSEnKTtcclxuICAgIHZhciB1cmwgPSB0aGlzLmdldFNlcnZlclVybCgpO1xyXG4gICAgaWYgKHRoaXMucmVzdWx0VHlwZSA9PSBcInJlZGlyZWN0XCIpIHtcclxuICAgICAgcmVkaXJlY3RUbyh1cmwpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLnJlc3VsdFR5cGUgPT0gXCJqc29uXCIpIHtcclxuICAgICAgcG9wdXAodXJsLCAnc21hbGwnLCBudWxsLCB0aGlzLmxvYWRpbmdUZXh0KTtcclxuICAgICAgJChkb2N1bWVudCkudHJpZ2dlcih0aGlzLmNvbm5lY3RlZEV2ZW50KTtcclxuICAgIH1cclxuXHJcbiAgICAvKkZCLmFwaSgnL21lJywgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICBjb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBHb29kIHRvIHNlZSB5b3UsICcgKyByZXNwb25zZS5uYW1lICsgJy4nKTtcclxuICAgIH0pOyovXHJcbiAgfSBlbHNlIHtcclxuICAgIC8vY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogVXNlciBjYW5jZWxsZWQgbG9naW4gb3IgZGlkIG5vdCBmdWxseSBhdXRob3JpemUuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5vbkxpYlJlYWR5ID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgaWYgKHdpbmRvdy5GQilcclxuICAgIGNhbGxiYWNrKCk7XHJcbiAgZWxzZSB7XHJcbiAgICB0aGlzLmxvYWRMaWIoKTtcclxuICAgICQoZG9jdW1lbnQpLm9uKHRoaXMubGliTG9hZGVkRXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIHRoaXMub25MaWJSZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICBGQi5sb2dpbigkLnByb3h5KHRoYXQucHJvY2Vzc1Jlc3BvbnNlLCB0aGF0KSwgeyBzY29wZTogdGhhdC5wZXJtaXNzaW9ucyB9KTtcclxuICB9KTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuYXV0b0Nvbm5lY3RPbiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gIGpRdWVyeShkb2N1bWVudCkub24oJ2NsaWNrJywgc2VsZWN0b3IgfHwgJ2EuZmFjZWJvb2stY29ubmVjdCcsICQucHJveHkodGhpcy5jb25uZWN0LCB0aGlzKSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZhY2Vib29rQ29ubmVjdDsiLCIvKiogSW1wbGVtZW50cyBhIHNpbWlsYXIgTGNVcmwgb2JqZWN0IGxpa2UgdGhlIHNlcnZlci1zaWRlIG9uZSwgYmFzaW5nXHJcbiAgICBpbiB0aGUgaW5mb3JtYXRpb24gYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGF0ICdodG1sJyB0YWcgaW4gdGhlIFxyXG4gICAgJ2RhdGEtYmFzZS11cmwnIGF0dHJpYnV0ZSAodGhhdHMgdmFsdWUgaXMgdGhlIGVxdWl2YWxlbnQgZm9yIEFwcFBhdGgpLFxyXG4gICAgYW5kIHRoZSBsYW5nIGluZm9ybWF0aW9uIGF0ICdkYXRhLWN1bHR1cmUnLlxyXG4gICAgVGhlIHJlc3Qgb2YgVVJMcyBhcmUgYnVpbHQgZm9sbG93aW5nIHRoZSB3aW5kb3cubG9jYXRpb24gYW5kIHNhbWUgcnVsZXNcclxuICAgIHRoYW4gaW4gdGhlIHNlcnZlci1zaWRlIG9iamVjdC5cclxuKiovXHJcblxyXG52YXIgYmFzZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYmFzZS11cmwnKSxcclxuICAgIGxhbmcgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKSxcclxuICAgIGwgPSB3aW5kb3cubG9jYXRpb24sXHJcbiAgICB1cmwgPSBsLnByb3RvY29sICsgJy8vJyArIGwuaG9zdDtcclxuLy8gbG9jYXRpb24uaG9zdCBpbmNsdWRlcyBwb3J0LCBpZiBpcyBub3QgdGhlIGRlZmF1bHQsIHZzIGxvY2F0aW9uLmhvc3RuYW1lXHJcblxyXG5iYXNlID0gYmFzZSB8fCAnLyc7XHJcblxyXG52YXIgTGNVcmwgPSB7XHJcbiAgICBTaXRlVXJsOiB1cmwsXHJcbiAgICBBcHBQYXRoOiBiYXNlLFxyXG4gICAgQXBwVXJsOiB1cmwgKyBiYXNlLFxyXG4gICAgTGFuZ0lkOiBsYW5nLFxyXG4gICAgTGFuZ1BhdGg6IGJhc2UgKyBsYW5nICsgJy8nLFxyXG4gICAgTGFuZ1VybDogdXJsICsgYmFzZSArIGxhbmdcclxufTtcclxuTGNVcmwuTGFuZ1VybCA9IHVybCArIExjVXJsLkxhbmdQYXRoO1xyXG5MY1VybC5Kc29uUGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ0pTT04vJztcclxuTGNVcmwuSnNvblVybCA9IHVybCArIExjVXJsLkpzb25QYXRoO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1VybDsiLCIvKiBMb2Nvbm9taWNzIHNwZWNpZmljIFByaWNlLCBmZWVzIGFuZCBob3VyLXByaWNlIGNhbGN1bGF0aW9uXHJcbiAgICB1c2luZyBzb21lIHN0YXRpYyBtZXRob2RzIGFuZCB0aGUgUHJpY2UgY2xhc3MuXHJcbiovXHJcbnZhciBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG4vKiBDbGFzcyBQcmljZSB0byBjYWxjdWxhdGUgYSB0b3RhbCBwcmljZSBiYXNlZCBvbiBmZWVzIGluZm9ybWF0aW9uIChmaXhlZCBhbmQgcmF0ZSlcclxuICAgIGFuZCBkZXNpcmVkIGRlY2ltYWxzIGZvciBhcHByb3hpbWF0aW9ucy5cclxuKi9cclxuZnVuY3Rpb24gUHJpY2UoYmFzZVByaWNlLCBmZWUsIHJvdW5kZWREZWNpbWFscykge1xyXG4gICAgLy8gZmVlIHBhcmFtZXRlciBjYW4gYmUgYSBmbG9hdCBudW1iZXIgd2l0aCB0aGUgZmVlUmF0ZSBvciBhbiBvYmplY3RcclxuICAgIC8vIHRoYXQgaW5jbHVkZXMgYm90aCBhIGZlZVJhdGUgYW5kIGEgZml4ZWRGZWVBbW91bnRcclxuICAgIC8vIEV4dHJhY3RpbmcgZmVlIHZhbHVlcyBpbnRvIGxvY2FsIHZhcnM6XHJcbiAgICB2YXIgZmVlUmF0ZSA9IDAsIGZpeGVkRmVlQW1vdW50ID0gMDtcclxuICAgIGlmIChmZWUuZml4ZWRGZWVBbW91bnQgfHwgZmVlLmZlZVJhdGUpIHtcclxuICAgICAgICBmaXhlZEZlZUFtb3VudCA9IGZlZS5maXhlZEZlZUFtb3VudCB8fCAwO1xyXG4gICAgICAgIGZlZVJhdGUgPSBmZWUuZmVlUmF0ZSB8fCAwO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgZmVlUmF0ZSA9IGZlZTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGluZzpcclxuICAgIC8vIFRoZSByb3VuZFRvIHdpdGggYSBiaWcgZml4ZWQgZGVjaW1hbHMgaXMgdG8gYXZvaWQgdGhlXHJcbiAgICAvLyBkZWNpbWFsIGVycm9yIG9mIGZsb2F0aW5nIHBvaW50IG51bWJlcnNcclxuICAgIHZhciB0b3RhbFByaWNlID0gbXUuY2VpbFRvKG11LnJvdW5kVG8oYmFzZVByaWNlICogKDEgKyBmZWVSYXRlKSArIGZpeGVkRmVlQW1vdW50LCAxMiksIHJvdW5kZWREZWNpbWFscyk7XHJcbiAgICAvLyBmaW5hbCBmZWUgcHJpY2UgaXMgY2FsY3VsYXRlZCBhcyBhIHN1YnN0cmFjdGlvbiwgYnV0IGJlY2F1c2UgamF2YXNjcmlwdCBoYW5kbGVzXHJcbiAgICAvLyBmbG9hdCBudW1iZXJzIG9ubHksIGEgcm91bmQgb3BlcmF0aW9uIGlzIHJlcXVpcmVkIHRvIGF2b2lkIGFuIGlycmF0aW9uYWwgbnVtYmVyXHJcbiAgICB2YXIgZmVlUHJpY2UgPSBtdS5yb3VuZFRvKHRvdGFsUHJpY2UgLSBiYXNlUHJpY2UsIDIpO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIG9iamVjdCB3aXRoIGZ1bGwgZGV0YWlsczpcclxuICAgIHRoaXMuYmFzZVByaWNlID0gYmFzZVByaWNlO1xyXG4gICAgdGhpcy5mZWVSYXRlID0gZmVlUmF0ZTtcclxuICAgIHRoaXMuZml4ZWRGZWVBbW91bnQgPSBmaXhlZEZlZUFtb3VudDtcclxuICAgIHRoaXMucm91bmRlZERlY2ltYWxzID0gcm91bmRlZERlY2ltYWxzO1xyXG4gICAgdGhpcy50b3RhbFByaWNlID0gdG90YWxQcmljZTtcclxuICAgIHRoaXMuZmVlUHJpY2UgPSBmZWVQcmljZTtcclxufVxyXG5cclxuLyoqIENhbGN1bGF0ZSBhbmQgcmV0dXJucyB0aGUgcHJpY2UgYW5kIHJlbGV2YW50IGRhdGEgYXMgYW4gb2JqZWN0IGZvclxyXG50aW1lLCBob3VybHlSYXRlICh3aXRoIGZlZXMpIGFuZCB0aGUgaG91cmx5RmVlLlxyXG5UaGUgdGltZSAoQGR1cmF0aW9uKSBpcyB1c2VkICdhcyBpcycsIHdpdGhvdXQgdHJhbnNmb3JtYXRpb24sIG1heWJlIHlvdSBjYW4gcmVxdWlyZVxyXG51c2UgTEMucm91bmRUaW1lVG9RdWFydGVySG91ciBiZWZvcmUgcGFzcyB0aGUgZHVyYXRpb24gdG8gdGhpcyBmdW5jdGlvbi5cclxuSXQgcmVjZWl2ZXMgdGhlIHBhcmFtZXRlcnMgQGhvdXJseVByaWNlIGFuZCBAc3VyY2hhcmdlUHJpY2UgYXMgTEMuUHJpY2Ugb2JqZWN0cy5cclxuQHN1cmNoYXJnZVByaWNlIGlzIG9wdGlvbmFsLlxyXG4qKi9cclxuZnVuY3Rpb24gY2FsY3VsYXRlSG91cmx5UHJpY2UoZHVyYXRpb24sIGhvdXJseVByaWNlLCBzdXJjaGFyZ2VQcmljZSkge1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gc3VyY2hhcmdlLCBnZXQgemVyb3NcclxuICAgIHN1cmNoYXJnZVByaWNlID0gc3VyY2hhcmdlUHJpY2UgfHwgeyB0b3RhbFByaWNlOiAwLCBmZWVQcmljZTogMCwgYmFzZVByaWNlOiAwIH07XHJcbiAgICAvLyBHZXQgaG91cnMgZnJvbSByb3VuZGVkIGR1cmF0aW9uOlxyXG4gICAgdmFyIGhvdXJzID0gbXUucm91bmRUbyhkdXJhdGlvbi50b3RhbEhvdXJzKCksIDIpO1xyXG4gICAgLy8gQ2FsY3VsYXRlIGZpbmFsIHByaWNlc1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3RhbFByaWNlOiAgICAgbXUucm91bmRUbyhob3VybHlQcmljZS50b3RhbFByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS50b3RhbFByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIGZlZVByaWNlOiAgICAgICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLmZlZVByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS5mZWVQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAgbXUucm91bmRUbyhob3VybHlQcmljZS5iYXNlUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLmJhc2VQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBkdXJhdGlvbkhvdXJzOiAgaG91cnNcclxuICAgIH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIFByaWNlOiBQcmljZSxcclxuICAgICAgICBjYWxjdWxhdGVIb3VybHlQcmljZTogY2FsY3VsYXRlSG91cmx5UHJpY2VcclxuICAgIH07IiwiLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNTkzNjM3L2hvdy10by1lc2NhcGUtcmVndWxhci1leHByZXNzaW9uLWluLWphdmFzY3JpcHRcclxuUmVnRXhwLnF1b3RlID0gZnVuY3Rpb24gKHN0cikge1xyXG4gIHJldHVybiAoc3RyICsgJycpLnJlcGxhY2UoLyhbLj8qK14kW1xcXVxcXFwoKXt9fC1dKS9nLCBcIlxcXFwkMVwiKTtcclxufTtcclxuIiwiLyoqXHJcbiAgQSB2ZXJ5IHNpbXBsZSBzbGlkZXIgaW1wbGVtZW50YXRpb24gaW5pdGlhbGx5IGNyZWF0ZWRcclxuICBmb3IgdGhlIHByb3ZpZGVyLXdlbGNvbWUgbGFuZGluZyBwYWdlIGFuZFxyXG4gIG90aGVyIHNpbWlsYXIgdXNlcy5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vUmVnRXhwLnF1b3RlJyk7XHJcblxyXG52YXIgU2ltcGxlU2xpZGVyID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBTaW1wbGVTbGlkZXIob3B0cykge1xyXG4gICQuZXh0ZW5kKHRydWUsIHRoaXMsIG9wdHMpO1xyXG5cclxuICB0aGlzLmVsZW1lbnQgPSAkKHRoaXMuZWxlbWVudCk7XHJcbiAgdGhpcy5jdXJyZW50SW5kZXggPSAwO1xyXG5cclxuICAvKipcclxuICBBY3Rpb25zIGhhbmRsZXIgdG8gbW92ZSBzbGlkZXNcclxuICAqKi9cclxuICB2YXIgY2hlY2tIcmVmID0gbmV3IFJlZ0V4cCgnXiMnICsgUmVnRXhwLnF1b3RlKHRoaXMuaHJlZlByZWZpeCkgKyAnKC4qKScpLFxyXG4gICAgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5lbGVtZW50Lm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGhyZWYgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG4gICAgdmFyIHJlcyA9IGNoZWNrSHJlZi5leGVjKGhyZWYpO1xyXG5cclxuICAgIGlmIChyZXMgJiYgcmVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgdmFyIGluZGV4ID0gcmVzWzFdO1xyXG4gICAgICBpZiAoaW5kZXggPT0gJ3ByZXZpb3VzJykge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZSh0aGF0LmN1cnJlbnRJbmRleCAtIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGluZGV4ID09ICduZXh0Jykge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZSh0aGF0LmN1cnJlbnRJbmRleCArIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKC9cXGQrLy50ZXN0KGluZGV4KSkge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZShwYXJzZUludChpbmRleCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogRG8gYWxsIHRoZSBzZXR1cCBvbiBzbGlkZXIgYW5kIHNsaWRlc1xyXG4gIHRvIGVuc3VyZSB0aGUgbW92ZW1lbnQgd2lsbCB3b3JrIGZpbmUuXHJcbiAgSXRzIGRvbmUgYXV0b21hdGljIG9uXHJcbiAgaW5pdGlhbGl6aW5nLCBpcyBqdXN0IGEgcHVibGljIG1ldGhvZCBmb3IgXHJcbiAgY29udmVuaWVuY2UgKG1heWJlIHRvIGJlIGNhbGwgaWYgc2xpZGVzIGFyZVxyXG4gIGFkZGVkL3JlbW92ZWQgYWZ0ZXIgaW5pdCkuXHJcbiAgKiovXHJcbiAgdGhpcy5yZWRyYXcgPSBmdW5jdGlvbiBzbGlkZXNSZXBvc2l0aW9uKCkge1xyXG4gICAgdmFyIHNsaWRlcyA9IHRoaXMuZ2V0U2xpZGVzKCksXHJcbiAgICAgIGMgPSB0aGlzLmdldFNsaWRlc0NvbnRhaW5lcigpO1xyXG4gICAgLy8gTG9vayBmb3IgdGhlIGNvbnRhaW5lciBzaXplLCBmcm9tIHRoZSBcclxuICAgIC8vIGJpZ2dlciBzbGlkZTpcclxuICAgIHZhciBcclxuICAgICAgdyA9IDAsXHJcbiAgICAgIGggPSAwO1xyXG4gICAgc2xpZGVzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgXHJcbiAgICAgICAgdCA9ICQodGhpcyksXHJcbiAgICAgICAgdHcgPSB0Lm91dGVyV2lkdGgoKSxcclxuICAgICAgICB0aCA9IHQub3V0ZXJIZWlnaHQoKTtcclxuICAgICAgaWYgKHR3ID4gdylcclxuICAgICAgICB3ID0gdHc7XHJcbiAgICAgIGlmICh0aCA+IGgpXHJcbiAgICAgICAgaCA9IHRoO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ1NTIHNldHVwLCBcclxuICAgIC8vIGFsbCBzbGlkZXMgaW4gdGhlIHNhbWUgbGluZSxcclxuICAgIC8vIGFsbCB3aXRoIHNhbWUgc2l6ZSAoZXh0cmEgc3BhY2luZyBjYW5cclxuICAgIC8vIGJlIGdpdmVuIHdpdGggQ1NTKVxyXG4gICAgYy5jc3Moe1xyXG4gICAgICB3aWR0aDogdyAtIChjLm91dGVyV2lkdGgoKSAtIGMud2lkdGgoKSksXHJcbiAgICAgIC8vaGVpZ2h0OiBoIC0gKGMub3V0ZXJIZWlnaHQoKSAtIGMuaGVpZ2h0KCkpLFxyXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxyXG4gICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgc2xpZGVzLmNzcyh7XHJcbiAgICAgIHdoaXRlU3BhY2U6ICdub3JtYWwnLFxyXG4gICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ1xyXG4gICAgfSkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgdC5jc3Moe1xyXG4gICAgICAgIHdpZHRoOiB3IC0gKHQub3V0ZXJXaWR0aCgpIC0gdC53aWR0aCgpKVxyXG4gICAgICAgIC8vLGhlaWdodDogaCAtICh0Lm91dGVySGVpZ2h0KCkgLSB0LmhlaWdodCgpKVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlcG9zaXRpb25hdGUgYXQgdGhlIGJlZ2dpbmluZzpcclxuICAgIGNbMF0uc2Nyb2xsTGVmdCA9IDA7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR28gdG8gYSBzbGlkZSBieSBpbmRleFxyXG4gICoqL1xyXG4gIHRoaXMuZ29TbGlkZSA9IGZ1bmN0aW9uIGdvU2xpZGUoaW5kZXgpIHtcclxuICAgIHZhciBwcmV2ID0gdGhpcy5jdXJyZW50SW5kZXg7XHJcbiAgICBpZiAocHJldiA9PSBpbmRleClcclxuICAgICAgcmV0dXJuO1xyXG5cclxuICAgIC8vIENoZWNrIGJvdW5kc1xyXG4gICAgaWYgKGluZGV4IDwgMSlcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgdmFyIHNsaWRlcyA9IHRoaXMuZ2V0U2xpZGVzKCk7XHJcbiAgICBpZiAoaW5kZXggPiBzbGlkZXMubGVuZ3RoKVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgLy8gR29vZCBpbmRleCwgc2V0IGFzIGN1cnJlbnRcclxuICAgIHRoaXMuY3VycmVudEluZGV4ID0gaW5kZXg7XHJcbiAgICAvLyBTZXQgbGlua3MgdG8gdGhpcyBhcyBjdXJyZW50LCByZW1vdmluZyBhbnkgcHJldmlvdXM6XHJcbiAgICB0aGlzLmVsZW1lbnQuZmluZCgnW2hyZWY9IycgKyB0aGlzLmhyZWZQcmVmaXggKyBpbmRleCArICddJylcclxuICAgIC5hZGRDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKVxyXG4gICAgLnBhcmVudCgnbGknKS5hZGRDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKTtcclxuICAgIHRoaXMuZWxlbWVudC5maW5kKCdbaHJlZj0jJyArIHRoaXMuaHJlZlByZWZpeCArIHByZXYgKyAnXScpXHJcbiAgICAucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcylcclxuICAgIC5wYXJlbnQoJ2xpJykucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcyk7XHJcblxyXG4gICAgdmFyIFxyXG4gICAgICBzbGlkZSA9ICQoc2xpZGVzLmdldChpbmRleCAtIDEpKSxcclxuICAgICAgYyA9IHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyKCksXHJcbiAgICAgIGxlZnQgPSBjLnNjcm9sbExlZnQoKSArIHNsaWRlLnBvc2l0aW9uKCkubGVmdDtcclxuXHJcbiAgICBjLnN0b3AoKS5hbmltYXRlKHsgc2Nyb2xsTGVmdDogbGVmdCB9LCB0aGlzLmR1cmF0aW9uKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHZXQgdGhlIGpRdWVyeSBjb2xsZWN0aW9uIG9mIHNsaWRlc1xyXG4gICoqL1xyXG4gIHRoaXMuZ2V0U2xpZGVzID0gZnVuY3Rpb24gZ2V0U2xpZGVzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGVzKVxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGUpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR2V0IHRoZSBqUXVlcnkgZWxlbWVudCBmb3IgdGhlIGNvbnRhaW5lciBvZiBzbGlkZXNcclxuICAqKi9cclxuICB0aGlzLmdldFNsaWRlc0NvbnRhaW5lciA9IGZ1bmN0aW9uIGdldFNsaWRlc0NvbnRhaW5lcigpIHtcclxuICAgIHJldHVybiB0aGlzLmVsZW1lbnRcclxuICAgIC5maW5kKHRoaXMuc2VsZWN0b3JzLnNsaWRlcyk7XHJcbiAgfTtcclxuXHJcbiAgLyoqIExhc3QgaW5pdCBzdGVwc1xyXG4gICoqL1xyXG4gIHRoaXMucmVkcmF3KCk7XHJcbn07XHJcblxyXG5TaW1wbGVTbGlkZXIucHJvdG90eXBlID0ge1xyXG4gIGVsZW1lbnQ6IG51bGwsXHJcbiAgc2VsZWN0b3JzOiB7XHJcbiAgICBzbGlkZXM6ICcuc2xpZGVzJyxcclxuICAgIHNsaWRlOiAnbGkuc2xpZGUnXHJcbiAgfSxcclxuICBjdXJyZW50U2xpZGVDbGFzczogJ2pzLWlzQ3VycmVudCcsXHJcbiAgaHJlZlByZWZpeDogJ2dvU2xpZGVfJyxcclxuICAvLyBEdXJhdGlvbiBvZiBlYWNoIHNsaWRlIGluIG1pbGxpc2Vjb25kc1xyXG4gIGR1cmF0aW9uOiAxMDAwXHJcbn07IiwiLyoqIFBvbHlmaWxsIGZvciBzdHJpbmcuY29udGFpbnNcclxuKiovXHJcbmlmICghKCdjb250YWlucycgaW4gU3RyaW5nLnByb3RvdHlwZSkpXHJcbiAgICBTdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKHN0ciwgc3RhcnRJbmRleCkgeyByZXR1cm4gLTEgIT09IHRoaXMuaW5kZXhPZihzdHIsIHN0YXJ0SW5kZXgpOyB9OyIsIi8qKiA9PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIEEgc2ltcGxlIFN0cmluZyBGb3JtYXRcclxuICogZnVuY3Rpb24gZm9yIGphdmFzY3JpcHRcclxuICogQXV0aG9yOiBJYWdvIExvcmVuem8gU2FsZ3VlaXJvXHJcbiAqIE1vZHVsZTogQ29tbW9uSlNcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaW5nRm9ybWF0KCkge1xyXG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG5cdHZhciBmb3JtYXR0ZWQgPSBhcmdzWzBdO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7JytpKydcXFxcfScsICdnaScpO1xyXG5cdFx0Zm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UocmVnZXhwLCBhcmdzW2krMV0pO1xyXG5cdH1cclxuXHRyZXR1cm4gZm9ybWF0dGVkO1xyXG59OyIsIi8qKlxyXG4gICAgR2VuZXJhbCBhdXRvLWxvYWQgc3VwcG9ydCBmb3IgdGFiczogXHJcbiAgICBJZiB0aGVyZSBpcyBubyBjb250ZW50IHdoZW4gZm9jdXNlZCwgdGhleSB1c2UgdGhlICdyZWxvYWQnIGpxdWVyeSBwbHVnaW5cclxuICAgIHRvIGxvYWQgaXRzIGNvbnRlbnQgLXRhYnMgbmVlZCB0byBiZSBjb25maWd1cmVkIHdpdGggZGF0YS1zb3VyY2UtdXJsIGF0dHJpYnV0ZVxyXG4gICAgaW4gb3JkZXIgdG8ga25vdyB3aGVyZSB0byBmZXRjaCB0aGUgY29udGVudC0uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5yZWxvYWQnKTtcclxuXHJcbi8vIERlcGVuZGVuY3kgVGFiYmVkVVggZnJvbSBESVxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoVGFiYmVkVVgpIHtcclxuICAgIC8vIFRhYmJlZFVYLnNldHVwLnRhYkJvZHlTZWxlY3RvciB8fCAnLnRhYi1ib2R5J1xyXG4gICAgJCgnLnRhYi1ib2R5Jykub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoJHQuY2hpbGRyZW4oKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICR0LnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBUaGlzIGFkZHMgbm90aWZpY2F0aW9ucyB0byB0YWJzIGZyb20gdGhlIFRhYmJlZFVYIHN5c3RlbSB1c2luZ1xyXG4gICAgdGhlIGNoYW5nZXNOb3RpZmljYXRpb24gdXRpbGl0eSB0aGF0IGRldGVjdHMgbm90IHNhdmVkIGNoYW5nZXMgb24gZm9ybXMsXHJcbiAgICBzaG93aW5nIHdhcm5pbmcgbWVzc2FnZXMgdG8gdGhlXHJcbiAgICB1c2VyIGFuZCBtYXJraW5nIHRhYnMgKGFuZCBzdWItdGFicyAvIHBhcmVudC10YWJzIHByb3Blcmx5KSB0b1xyXG4gICAgZG9uJ3QgbG9zdCBjaGFuZ2VzIG1hZGUuXHJcbiAgICBBIGJpdCBvZiBDU1MgZm9yIHRoZSBhc3NpZ25lZCBjbGFzc2VzIHdpbGwgYWxsb3cgZm9yIHZpc3VhbCBtYXJrcy5cclxuXHJcbiAgICBBS0E6IERvbid0IGxvc3QgZGF0YSEgd2FybmluZyBtZXNzYWdlIDstKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxuLy8gVGFiYmVkVVggZGVwZW5kZW5jeSBhcyBESVxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoVGFiYmVkVVgsIHRhcmdldFNlbGVjdG9yKSB7XHJcbiAgICB2YXIgdGFyZ2V0ID0gJCh0YXJnZXRTZWxlY3RvciB8fCAnLmNoYW5nZXMtbm90aWZpY2F0aW9uLWVuYWJsZWQnKTtcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24uaW5pdCh7IHRhcmdldDogdGFyZ2V0IH0pO1xyXG5cclxuICAgIC8vIEFkZGluZyBjaGFuZ2Ugbm90aWZpY2F0aW9uIHRvIHRhYi1ib2R5IGRpdnNcclxuICAgIC8vIChvdXRzaWRlIHRoZSBMQy5DaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzIHRvIGxlYXZlIGl0IGFzIGdlbmVyaWMgYW5kIHNpbXBsZSBhcyBwb3NzaWJsZSlcclxuICAgICQodGFyZ2V0KS5vbignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsICdmb3JtJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQodGhpcykucGFyZW50cygnLnRhYi1ib2R5JykuYWRkQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkaW5nIGNsYXNzIHRvIHRoZSBtZW51IGl0ZW0gKHRhYiB0aXRsZSlcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0uYWRkQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCd0aXRsZScsICQoJyNsY3Jlcy1jaGFuZ2VzLW5vdC1zYXZlZCcpLnRleHQoKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5vbignbGNDaGFuZ2VzTm90aWZpY2F0aW9uU2F2ZVJlZ2lzdGVyZWQnLCAnZm9ybScsIGZ1bmN0aW9uIChlLCBmLCBlbHMsIGZ1bGwpIHtcclxuICAgICAgICBpZiAoZnVsbClcclxuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcudGFiLWJvZHk6bm90KDpoYXMoZm9ybS5oYXMtY2hhbmdlcykpJykucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZpbmcgY2xhc3MgZnJvbSB0aGUgbWVudSBpdGVtICh0YWIgdGl0bGUpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC8vIFRvIGF2b2lkIHVzZXIgYmUgbm90aWZpZWQgb2YgY2hhbmdlcyBhbGwgdGltZSB3aXRoIHRhYiBtYXJrcywgd2UgYWRkZWQgYSAnbm90aWZ5JyBjbGFzc1xyXG4gICAgLy8gb24gdGFicyB3aGVuIGEgY2hhbmdlIG9mIHRhYiBoYXBwZW5zXHJcbiAgICAuZmluZCgnLnRhYi1ib2R5Jykub24oJ3RhYlVuZm9jdXNlZCcsIGZ1bmN0aW9uIChldmVudCwgZm9jdXNlZEN0eCkge1xyXG4gICAgICAgIHZhciBtaSA9IFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW07XHJcbiAgICAgICAgaWYgKG1pLmlzKCcuaGFzLWNoYW5nZXMnKSkge1xyXG4gICAgICAgICAgICBtaS5hZGRDbGFzcygnbm90aWZ5LWNoYW5nZXMnKTsgLy9oYXMtdG9vbHRpcFxyXG4gICAgICAgICAgICAvLyBTaG93IG5vdGlmaWNhdGlvbiBwb3B1cFxyXG4gICAgICAgICAgICB2YXIgZCA9ICQoJzxkaXYgY2xhc3M9XCJ3YXJuaW5nXCI+QDA8L2Rpdj48ZGl2IGNsYXNzPVwiYWN0aW9uc1wiPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJhY3Rpb24gY29udGludWVcIiB2YWx1ZT1cIkAyXCIvPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJhY3Rpb24gc3RvcFwiIHZhbHVlPVwiQDFcIi8+PC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AwL2csIExDLmdldFRleHQoJ2NoYW5nZXMtbm90LXNhdmVkJykpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDEvZywgTEMuZ2V0VGV4dCgndGFiLWhhcy1jaGFuZ2VzLXN0YXktb24nKSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMi9nLCBMQy5nZXRUZXh0KCd0YWItaGFzLWNoYW5nZXMtY29udGludWUtd2l0aG91dC1jaGFuZ2UnKSkpO1xyXG4gICAgICAgICAgICBkLm9uKCdjbGljaycsICcuc3RvcCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHdpbmRvdyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbignY2xpY2snLCAnLmNvbnRpbnVlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2Uod2luZG93KTtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSAnaGFzLWNoYW5nZXMnIHRvIGF2b2lkIGZ1dHVyZSBibG9ja3MgKHVudGlsIG5ldyBjaGFuZ2VzIGhhcHBlbnMgb2YgY291cnNlIDstKVxyXG4gICAgICAgICAgICAgICAgbWkucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJyk7XHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYihmb2N1c2VkQ3R4LnRhYi5nZXQoMCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihkLCB3aW5kb3csICdub3Qtc2F2ZWQtcG9wdXAnLCB7IGNsb3NhYmxlOiBmYWxzZSwgY2VudGVyOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRXZlciByZXR1cm4gZmFsc2UgdG8gc3RvcCBjdXJyZW50IHRhYiBmb2N1c1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdub3RpZnktY2hhbmdlcycpOyAvL2hhcy10b29sdGlwXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIFRhYmJlZFVYOiBUYWJiZWQgaW50ZXJmYWNlIGxvZ2ljOyB3aXRoIG1pbmltYWwgSFRNTCB1c2luZyBjbGFzcyAndGFiYmVkJyBmb3IgdGhlXHJcbmNvbnRhaW5lciwgdGhlIG9iamVjdCBwcm92aWRlcyB0aGUgZnVsbCBBUEkgdG8gbWFuaXB1bGF0ZSB0YWJzIGFuZCBpdHMgc2V0dXBcclxubGlzdGVuZXJzIHRvIHBlcmZvcm0gbG9naWMgb24gdXNlciBpbnRlcmFjdGlvbi5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5oYXNTY3JvbGxCYXInKTtcclxuXHJcbnZhciBUYWJiZWRVWCA9IHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKCdib2R5JykuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicyA+IGxpOm5vdCgudGFicy1zbGlkZXIpID4gYScsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGlmIChUYWJiZWRVWC5mb2N1c1RhYigkdC5hdHRyKCdocmVmJykpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3QgPSAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhhc2ggPSAkdC5hdHRyKCdocmVmJyk7XHJcbiAgICAgICAgICAgICAgICAkKCdodG1sLGJvZHknKS5zY3JvbGxUb3Aoc3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnbW91c2Vkb3duJywgVGFiYmVkVVguc3RhcnRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ21vdXNldXAgbW91c2VsZWF2ZScsIFRhYmJlZFVYLmVuZE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC8vIHRoZSBjbGljayByZXR1cm4gZmFsc2UgaXMgdG8gZGlzYWJsZSBzdGFuZGFyIHVybCBiZWhhdmlvclxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXItbGltaXQnLCAnbW91c2VlbnRlcicsIFRhYmJlZFVYLnN0YXJ0TW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyLWxpbWl0JywgJ21vdXNlbGVhdmUnLCBUYWJiZWRVWC5lbmRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicyA+IGxpLnJlbW92YWJsZScsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIC8vIE9ubHkgb24gZGlyZWN0IGNsaWNrcyB0byB0aGUgdGFiLCB0byBhdm9pZFxyXG4gICAgICAgICAgICAvLyBjbGlja3MgdG8gdGhlIHRhYi1saW5rICh0aGF0IHNlbGVjdC9mb2N1cyB0aGUgdGFiKTpcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0ID09IGUuY3VycmVudFRhcmdldClcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLnJlbW92ZVRhYihudWxsLCB0aGlzKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gSW5pdCBwYWdlIGxvYWRlZCB0YWJiZWQgY29udGFpbmVyczpcclxuICAgICAgICAkKCcudGFiYmVkJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIC8vIENvbnNpc3RlbmNlIGNoZWNrOiB0aGlzIG11c3QgYmUgYSB2YWxpZCBjb250YWluZXIsIHRoaXMgaXMsIG11c3QgaGF2ZSAudGFic1xyXG4gICAgICAgICAgICBpZiAoJHQuY2hpbGRyZW4oJy50YWJzJykubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAvLyBJbml0IHNsaWRlclxyXG4gICAgICAgICAgICBUYWJiZWRVWC5zZXR1cFNsaWRlcigkdCk7XHJcbiAgICAgICAgICAgIC8vIENsZWFuIHdoaXRlIHNwYWNlcyAodGhleSBjcmVhdGUgZXhjZXNpdmUgc2VwYXJhdGlvbiBiZXR3ZWVuIHNvbWUgdGFicylcclxuICAgICAgICAgICAgJCgnLnRhYnMnLCB0aGlzKS5jb250ZW50cygpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhIHRleHQgbm9kZSwgcmVtb3ZlIGl0OlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9kZVR5cGUgPT0gMylcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBtb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgZGlyID0gJHQuaGFzQ2xhc3MoJ3RhYnMtc2xpZGVyLXJpZ2h0JykgPyAxIDogLTE7XHJcbiAgICAgICAgdmFyIHRhYnNTbGlkZXIgPSAkdC5wYXJlbnQoKTtcclxuICAgICAgICB2YXIgdGFicyA9IHRhYnNTbGlkZXIuc2libGluZ3MoJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgdGFic1swXS5zY3JvbGxMZWZ0ICs9IDIwICogZGlyO1xyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYnNTbGlkZXIucGFyZW50KCksIHRhYnMpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBzdGFydE1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciB0YWJzID0gdC5jbG9zZXN0KCcudGFiYmVkJykuY2hpbGRyZW4oJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgLy8gU3RvcCBwcmV2aW91cyBhbmltYXRpb25zOlxyXG4gICAgICAgIHRhYnMuc3RvcCh0cnVlKTtcclxuICAgICAgICB2YXIgc3BlZWQgPSAwLjM7IC8qIHNwZWVkIHVuaXQ6IHBpeGVscy9taWxpc2Vjb25kcyAqL1xyXG4gICAgICAgIHZhciBmeGEgPSBmdW5jdGlvbiAoKSB7IFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYnMucGFyZW50KCksIHRhYnMpOyB9O1xyXG4gICAgICAgIHZhciB0aW1lO1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdyaWdodCcpKSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIGJhc2VkIG9uIHNwZWVkIHdlIHdhbnQgYW5kIGhvdyBtYW55IGRpc3RhbmNlIHRoZXJlIGlzOlxyXG4gICAgICAgICAgICB0aW1lID0gKHRhYnNbMF0uc2Nyb2xsV2lkdGggLSB0YWJzWzBdLnNjcm9sbExlZnQgLSB0YWJzLndpZHRoKCkpICogMSAvIHNwZWVkO1xyXG4gICAgICAgICAgICB0YWJzLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiB0YWJzWzBdLnNjcm9sbFdpZHRoIC0gdGFicy53aWR0aCgpIH0sXHJcbiAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIHN0ZXA6IGZ4YSwgY29tcGxldGU6IGZ4YSwgZWFzaW5nOiAnc3dpbmcnIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIGJhc2VkIG9uIHNwZWVkIHdlIHdhbnQgYW5kIGhvdyBtYW55IGRpc3RhbmNlIHRoZXJlIGlzOlxyXG4gICAgICAgICAgICB0aW1lID0gdGFic1swXS5zY3JvbGxMZWZ0ICogMSAvIHNwZWVkO1xyXG4gICAgICAgICAgICB0YWJzLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiAwIH0sXHJcbiAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIHN0ZXA6IGZ4YSwgY29tcGxldGU6IGZ4YSwgZWFzaW5nOiAnc3dpbmcnIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgZW5kTW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGFiQ29udGFpbmVyID0gJCh0aGlzKS5jbG9zZXN0KCcudGFiYmVkJyk7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpLnN0b3AodHJ1ZSk7XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFiQ29udGFpbmVyKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgY2hlY2tUYWJTbGlkZXJMaW1pdHM6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIHRhYnMpIHtcclxuICAgICAgICB0YWJzID0gdGFicyB8fCB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgLy8gU2V0IHZpc2liaWxpdHkgb2YgdmlzdWFsIGxpbWl0ZXJzOlxyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyLWxpbWl0LWxlZnQnKS50b2dnbGUodGFic1swXS5zY3JvbGxMZWZ0ID4gMCk7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXItbGltaXQtcmlnaHQnKS50b2dnbGUoXHJcbiAgICAgICAgICAgICh0YWJzWzBdLnNjcm9sbExlZnQgKyB0YWJzLndpZHRoKCkpIDwgdGFic1swXS5zY3JvbGxXaWR0aCk7XHJcbiAgICB9LFxyXG4gICAgc2V0dXBTbGlkZXI6IGZ1bmN0aW9uICh0YWJDb250YWluZXIpIHtcclxuICAgICAgICB2YXIgdHMgPSB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlcicpO1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzJykuaGFzU2Nyb2xsQmFyKHsgeDogLTIgfSkuaG9yaXpvbnRhbCkge1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuYWRkQ2xhc3MoJ2hhcy10YWJzLXNsaWRlcicpO1xyXG4gICAgICAgICAgICBpZiAodHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgdHMuY2xhc3NOYW1lID0gJ3RhYnMtc2xpZGVyJztcclxuICAgICAgICAgICAgICAgICQodHMpXHJcbiAgICAgICAgICAgICAgICAvLyBBcnJvd3M6XHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJ0YWJzLXNsaWRlci1sZWZ0IGxlZnRcIiBocmVmPVwiI1wiPiZsdDsmbHQ7PC9hPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJ0YWJzLXNsaWRlci1yaWdodCByaWdodFwiIGhyZWY9XCIjXCI+Jmd0OyZndDs8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXIuYXBwZW5kKHRzKTtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lclxyXG4gICAgICAgICAgICAgICAgLy8gRGVzaW5nIGRldGFpbHM6XHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGRpdiBjbGFzcz1cInRhYnMtc2xpZGVyLWxpbWl0IHRhYnMtc2xpZGVyLWxpbWl0LWxlZnQgbGVmdFwiIGhyZWY9XCIjXCI+PC9kaXY+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGFicy1zbGlkZXItbGltaXQgdGFicy1zbGlkZXItbGltaXQtcmlnaHQgcmlnaHRcIiBocmVmPVwiI1wiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHMuc2hvdygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLnJlbW92ZUNsYXNzKCdoYXMtdGFicy1zbGlkZXInKTtcclxuICAgICAgICAgICAgdHMuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJDb250YWluZXIpO1xyXG4gICAgfSxcclxuICAgIGdldFRhYkNvbnRleHRCeUFyZ3M6IGZ1bmN0aW9uIChhcmdzKSB7XHJcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgdHlwZW9mIChhcmdzWzBdKSA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFiQ29udGV4dChhcmdzWzBdLCBudWxsKTtcclxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJiBhcmdzWzBdLnRhYilcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMF07XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUYWJDb250ZXh0KFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAwID8gYXJnc1swXSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDEgPyBhcmdzWzFdIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMiA/IGFyZ3NbMl0gOiBudWxsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiQ29udGV4dDogZnVuY3Rpb24gKHRhYk9yU2VsZWN0b3IsIG1lbnVpdGVtT3JTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBtaSwgbWEsIHRhYiwgdGFiQ29udGFpbmVyO1xyXG4gICAgICAgIGlmICh0YWJPclNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRhYiA9ICQodGFiT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmICh0YWIubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lciA9IHRhYi5wYXJlbnRzKCcudGFiYmVkOmVxKDApJyk7XHJcbiAgICAgICAgICAgICAgICBtYSA9IHRhYkNvbnRhaW5lci5maW5kKCc+IC50YWJzID4gbGkgPiBhW2hyZWY9IycgKyB0YWIuZ2V0KDApLmlkICsgJ10nKTtcclxuICAgICAgICAgICAgICAgIG1pID0gbWEucGFyZW50KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKG1lbnVpdGVtT3JTZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBtYSA9ICQobWVudWl0ZW1PclNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKG1hLmlzKCdsaScpKSB7XHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hO1xyXG4gICAgICAgICAgICAgICAgbWEgPSBtaS5jaGlsZHJlbignYTplcSgwKScpO1xyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgIG1pID0gbWEucGFyZW50KCk7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lciA9IG1pLmNsb3Nlc3QoJy50YWJiZWQnKTtcclxuICAgICAgICAgICAgdGFiID0gdGFiQ29udGFpbmVyLmZpbmQoJz4udGFiLWJvZHlAMCwgPi50YWItYm9keS1saXN0Pi50YWItYm9keUAwJy5yZXBsYWNlKC9AMC9nLCBtYS5hdHRyKCdocmVmJykpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgdGFiOiB0YWIsIG1lbnVhbmNob3I6IG1hLCBtZW51aXRlbTogbWksIHRhYkNvbnRhaW5lcjogdGFiQ29udGFpbmVyIH07XHJcbiAgICB9LFxyXG4gICAgY2hlY2tUYWJDb250ZXh0OiBmdW5jdGlvbiAoY3R4LCBmdW5jdGlvbm5hbWUsIGFyZ3MsIGlzVGVzdCkge1xyXG4gICAgICAgIGlmICghY3R4LnRhYiB8fCBjdHgudGFiLmxlbmd0aCAhPSAxIHx8XHJcbiAgICAgICAgICAgICFjdHgubWVudWl0ZW0gfHwgY3R4Lm1lbnVpdGVtLmxlbmd0aCAhPSAxIHx8XHJcbiAgICAgICAgICAgICFjdHgudGFiQ29udGFpbmVyIHx8IGN0eC50YWJDb250YWluZXIubGVuZ3RoICE9IDEgfHwgXHJcbiAgICAgICAgICAgICFjdHgubWVudWFuY2hvciB8fCBjdHgubWVudWFuY2hvci5sZW5ndGggIT0gMSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzVGVzdCAmJiBjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdUYWJiZWRVWC4nICsgZnVuY3Rpb25uYW1lICsgJywgYmFkIGFyZ3VtZW50czogJyArIEFycmF5LmpvaW4oYXJncywgJywgJykpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGdldFRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2ZvY3VzVGFiJywgYXJndW1lbnRzLCB0cnVlKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgcmV0dXJuIGN0eC50YWIuZ2V0KDApO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZm9jdXNUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIEdldCBwcmV2aW91cyBmb2N1c2VkIHRhYiwgdHJpZ2dlciAndGFiVW5mb2N1c2VkJyBoYW5kbGVyIHRoYXQgY2FuXHJcbiAgICAgICAgLy8gc3RvcCB0aGlzIGZvY3VzIChyZXR1cm5pbmcgZXhwbGljaXR5ICdmYWxzZScpXHJcbiAgICAgICAgdmFyIHByZXZUYWIgPSBjdHgudGFiLnNpYmxpbmdzKCcuY3VycmVudCcpO1xyXG4gICAgICAgIGlmIChwcmV2VGFiLnRyaWdnZXJIYW5kbGVyKCd0YWJVbmZvY3VzZWQnLCBbY3R4XSkgPT09IGZhbHNlKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIENoZWNrIChmaXJzdCEpIGlmIHRoZXJlIGlzIGEgcGFyZW50IHRhYiBhbmQgZm9jdXMgaXQgdG9vICh3aWxsIGJlIHJlY3Vyc2l2ZSBjYWxsaW5nIHRoaXMgc2FtZSBmdW5jdGlvbilcclxuICAgICAgICB2YXIgcGFyVGFiID0gY3R4LnRhYi5wYXJlbnRzKCcudGFiLWJvZHk6ZXEoMCknKTtcclxuICAgICAgICBpZiAocGFyVGFiLmxlbmd0aCA9PSAxKSB0aGlzLmZvY3VzVGFiKHBhclRhYik7XHJcblxyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2N1cnJlbnQnKSB8fFxyXG4gICAgICAgICAgICBjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2Rpc2FibGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gVW5zZXQgY3VycmVudCBtZW51IGVsZW1lbnRcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2libGluZ3MoJy5jdXJyZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAuZmluZCgnPmEnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIC8vIFNldCBjdXJyZW50IG1lbnUgZWxlbWVudFxyXG4gICAgICAgIGN0eC5tZW51aXRlbS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIGN0eC5tZW51YW5jaG9yLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcblxyXG4gICAgICAgIC8vIEhpZGUgY3VycmVudCB0YWItYm9keVxyXG4gICAgICAgIHByZXZUYWIucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAvLyBTaG93IGN1cnJlbnQgdGFiLWJvZHkgYW5kIHRyaWdnZXIgZXZlbnRcclxuICAgICAgICBjdHgudGFiLmFkZENsYXNzKCdjdXJyZW50JylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJGb2N1c2VkJyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVGFiSW5kZXg6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIHRhYkluZGV4KSB7XHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lcilcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9jdXNUYWIodGhpcy5nZXRUYWJDb250ZXh0KHRhYkNvbnRhaW5lci5maW5kKCc+LnRhYi1ib2R5OmVxKCcgKyB0YWJJbmRleCArICcpJykpKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgLyogRW5hYmxlIGEgdGFiLCBkaXNhYmxpbmcgYWxsIG90aGVycyB0YWJzIC11c2VmdWxsIGluIHdpemFyZCBzdHlsZSBwYWdlcy0gKi9cclxuICAgIGVuYWJsZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2VuYWJsZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICB2YXIgcnRuID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5pcygnLmRpc2FibGVkJykpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGRpc2FibGVkIGNsYXNzIGZyb20gZm9jdXNlZCB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgICAgICBjdHgudGFiLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRW5hYmxlZCcpO1xyXG4gICAgICAgICAgICBjdHgubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgICAgIHJ0biA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEZvY3VzIHRhYjpcclxuICAgICAgICB0aGlzLmZvY3VzVGFiKGN0eCk7XHJcbiAgICAgICAgLy8gRGlzYWJsZWQgdGFicyBhbmQgbWVudSBpdGVtczpcclxuICAgICAgICBjdHgudGFiLnNpYmxpbmdzKCc6bm90KC5kaXNhYmxlZCknKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2Rpc2FibGVkJylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJEaXNhYmxlZCcpO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaWJsaW5ncygnOm5vdCguZGlzYWJsZWQpJylcclxuICAgICAgICAgICAgLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgICAgIHJldHVybiBydG47XHJcbiAgICB9LFxyXG4gICAgc2hvd2hpZGVEdXJhdGlvbjogMCxcclxuICAgIHNob3doaWRlRWFzaW5nOiBudWxsLFxyXG4gICAgc2hvd1RhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3Nob3dUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2hvdyB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgIGN0eC50YWIuc2hvdyh0aGlzLnNob3doaWRlRHVyYXRpb24pO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaG93KHRoaXMuc2hvd2hpZGVFYXNpbmcpO1xyXG4gICAgfSxcclxuICAgIGhpZGVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdoaWRlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNob3cgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICBjdHgudGFiLmhpZGUodGhpcy5zaG93aGlkZUR1cmF0aW9uKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uaGlkZSh0aGlzLnNob3doaWRlRWFzaW5nKTtcclxuICAgIH0sXHJcbiAgICB0YWJCb2R5Q2xhc3NFeGNlcHRpb25zOiB7ICd0YWItYm9keSc6IDAsICd0YWJiZWQnOiAwLCAnY3VycmVudCc6IDAsICdkaXNhYmxlZCc6IDAgfSxcclxuICAgIGNyZWF0ZVRhYjogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgaWROYW1lLCBsYWJlbCkge1xyXG4gICAgICAgIHRhYkNvbnRhaW5lciA9ICQodGFiQ29udGFpbmVyKTtcclxuICAgICAgICAvLyB0YWJDb250YWluZXIgbXVzdCBiZSBvbmx5IG9uZSBhbmQgdmFsaWQgY29udGFpbmVyXHJcbiAgICAgICAgLy8gYW5kIGlkTmFtZSBtdXN0IG5vdCBleGlzdHNcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyLmxlbmd0aCA9PSAxICYmIHRhYkNvbnRhaW5lci5pcygnLnRhYmJlZCcpICYmXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkTmFtZSkgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIHRhYiBkaXY6XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgdGFiLmlkID0gaWROYW1lO1xyXG4gICAgICAgICAgICAvLyBSZXF1aXJlZCBjbGFzc2VzXHJcbiAgICAgICAgICAgIHRhYi5jbGFzc05hbWUgPSBcInRhYi1ib2R5XCI7XHJcbiAgICAgICAgICAgIHZhciAkdGFiID0gJCh0YWIpO1xyXG4gICAgICAgICAgICAvLyBHZXQgYW4gZXhpc3Rpbmcgc2libGluZyBhbmQgY29weSAod2l0aCBzb21lIGV4Y2VwdGlvbnMpIHRoZWlyIGNzcyBjbGFzc2VzXHJcbiAgICAgICAgICAgICQuZWFjaCh0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWItYm9keTplcSgwKScpLmF0dHIoJ2NsYXNzJykuc3BsaXQoL1xccysvKSwgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAgICAgICAgIGlmICghKHYgaW4gVGFiYmVkVVgudGFiQm9keUNsYXNzRXhjZXB0aW9ucykpXHJcbiAgICAgICAgICAgICAgICAgICAgJHRhYi5hZGRDbGFzcyh2KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIEFkZCB0byBjb250YWluZXJcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFwcGVuZCh0YWIpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1lbnUgZW50cnlcclxuICAgICAgICAgICAgdmFyIG1lbnVpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgICAgICAgICAgLy8gQmVjYXVzZSBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdGFiLCBpcyBhIGR5bmFtaWNhbGx5IHJlbW92YWJsZSB0YWI6XHJcbiAgICAgICAgICAgIG1lbnVpdGVtLmNsYXNzTmFtZSA9IFwicmVtb3ZhYmxlXCI7XHJcbiAgICAgICAgICAgIHZhciBtZW51YW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgICAgICBtZW51YW5jaG9yLnNldEF0dHJpYnV0ZSgnaHJlZicsICcjJyArIGlkTmFtZSk7XHJcbiAgICAgICAgICAgIC8vIGxhYmVsIGNhbm5vdCBiZSBudWxsIG9yIGVtcHR5XHJcbiAgICAgICAgICAgICQobWVudWFuY2hvcikudGV4dChpc0VtcHR5U3RyaW5nKGxhYmVsKSA/IFwiVGFiXCIgOiBsYWJlbCk7XHJcbiAgICAgICAgICAgICQobWVudWl0ZW0pLmFwcGVuZChtZW51YW5jaG9yKTtcclxuICAgICAgICAgICAgLy8gQWRkIHRvIHRhYnMgbGlzdCBjb250YWluZXJcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpLmFwcGVuZChtZW51aXRlbSk7XHJcblxyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50LCBvbiB0YWJDb250YWluZXIsIHdpdGggdGhlIG5ldyB0YWIgYXMgZGF0YVxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIudHJpZ2dlckhhbmRsZXIoJ3RhYkNyZWF0ZWQnLCBbdGFiXSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldHVwU2xpZGVyKHRhYkNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFiO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAncmVtb3ZlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBPbmx5IHJlbW92ZSBpZiBpcyBhICdyZW1vdmFibGUnIHRhYlxyXG4gICAgICAgIGlmICghY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdyZW1vdmFibGUnKSAmJiAhY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCd2b2xhdGlsZScpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy8gSWYgdGFiIGlzIGN1cnJlbnRseSBmb2N1c2VkIHRhYiwgY2hhbmdlIHRvIGZpcnN0IHRhYlxyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2N1cnJlbnQnKSlcclxuICAgICAgICAgICAgdGhpcy5mb2N1c1RhYkluZGV4KGN0eC50YWJDb250YWluZXIsIDApO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5yZW1vdmUoKTtcclxuICAgICAgICB2YXIgdGFiaWQgPSBjdHgudGFiLmdldCgwKS5pZDtcclxuICAgICAgICBjdHgudGFiLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnNldHVwU2xpZGVyKGN0eC50YWJDb250YWluZXIpO1xyXG5cclxuICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50LCBvbiB0YWJDb250YWluZXIsIHdpdGggdGhlIHJlbW92ZWQgdGFiIGlkIGFzIGRhdGFcclxuICAgICAgICBjdHgudGFiQ29udGFpbmVyLnRyaWdnZXJIYW5kbGVyKCd0YWJSZW1vdmVkJywgW3RhYmlkXSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgc2V0VGFiVGl0bGU6IGZ1bmN0aW9uICh0YWJPclNlbGVjdG9yLCBuZXdUaXRsZSkge1xyXG4gICAgICAgIHZhciBjdHggPSBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRhYk9yU2VsZWN0b3IpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnc2V0VGFiVGl0bGUnLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2V0IGFuIGVtcHR5IHN0cmluZyBpcyBub3QgYWxsb3dlZCwgcHJlc2VydmUgcHJldmlvdXNseTpcclxuICAgICAgICBpZiAoIWlzRW1wdHlTdHJpbmcobmV3VGl0bGUpKVxyXG4gICAgICAgICAgICBjdHgubWVudWFuY2hvci50ZXh0KG5ld1RpdGxlKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qIE1vcmUgc3RhdGljIHV0aWxpdGllcyAqL1xyXG5cclxuLyoqIExvb2sgdXAgdGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uIGFkZHJlc3MgYW5kIHRyeSB0byBmb2N1cyBhIHRhYiB3aXRoIHRoYXRcclxuICAgIG5hbWUsIGlmIHRoZXJlIGlzIG9uZS5cclxuKiovXHJcblRhYmJlZFVYLmZvY3VzQ3VycmVudExvY2F0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gSWYgdGhlIGN1cnJlbnQgbG9jYXRpb24gaGF2ZSBhIGhhc2ggdmFsdWUgYnV0IGlzIG5vdCBhIEhhc2hCYW5nXHJcbiAgICBpZiAoL14jW14hXS8udGVzdCh3aW5kb3cubG9jYXRpb24uaGFzaCkpIHtcclxuICAgICAgICAvLyBUcnkgZm9jdXMgYSB0YWIgd2l0aCB0aGF0IG5hbWVcclxuICAgICAgICB2YXIgdGFiID0gVGFiYmVkVVguZ2V0VGFiKHdpbmRvdy5sb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICBpZiAodGFiKVxyXG4gICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0YWIpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqIExvb2sgZm9yIHZvbGF0aWxlIHRhYnMgb24gdGhlIHBhZ2UsIGlmIHRoZXkgYXJlXHJcbiAgICBlbXB0eSBvciByZXF1ZXN0aW5nIGJlaW5nICd2b2xhdGl6ZWQnLCByZW1vdmUgaXQuXHJcbioqL1xyXG5UYWJiZWRVWC5jaGVja1ZvbGF0aWxlVGFicyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoJy50YWJiZWQgPiAudGFicyA+IC52b2xhdGlsZScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0YWIgPSBUYWJiZWRVWC5nZXRUYWIobnVsbCwgdGhpcyk7XHJcbiAgICAgICAgaWYgKHRhYiAmJiAoJCh0YWIpLmNoaWxkcmVuKCkubGVuZ3RoID09PSAwIHx8ICQodGFiKS5maW5kKCc6bm90KC50YWJiZWQpIC52b2xhdGl6ZS1teS10YWInKS5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgIFRhYmJlZFVYLnJlbW92ZVRhYih0YWIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGFiYmVkVVg7IiwiLyogc2xpZGVyLXRhYnMgbG9naWMuXHJcbiogRXhlY3V0ZSBpbml0IGFmdGVyIFRhYmJlZFVYLmluaXQgdG8gYXZvaWQgbGF1bmNoIGFuaW1hdGlvbiBvbiBwYWdlIGxvYWQuXHJcbiogSXQgcmVxdWlyZXMgVGFiYmVkVVggdGhyb3VnaHQgREkgb24gJ2luaXQnLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0U2xpZGVyVGFicyhUYWJiZWRVWCkge1xyXG4gICAgJCgnLnRhYmJlZC5zbGlkZXItdGFicycpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyICR0YWJzID0gJHQuY2hpbGRyZW4oJy50YWItYm9keScpO1xyXG4gICAgICAgIHZhciBjID0gJHRhYnNcclxuICAgICAgICAgICAgLndyYXBBbGwoJzxkaXYgY2xhc3M9XCJ0YWItYm9keS1saXN0XCIvPicpXHJcbiAgICAgICAgICAgIC5lbmQoKS5jaGlsZHJlbignLnRhYi1ib2R5LWxpc3QnKTtcclxuICAgICAgICAkdGFicy5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYy5zdG9wKHRydWUsIGZhbHNlKS5hbmltYXRlKHsgc2Nyb2xsTGVmdDogYy5zY3JvbGxMZWZ0KCkgKyAkKHRoaXMpLnBvc2l0aW9uKCkubGVmdCB9LCAxNDAwKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBTZXQgaG9yaXpvbnRhbCBzY3JvbGwgdG8gdGhlIHBvc2l0aW9uIG9mIGN1cnJlbnQgc2hvd2VkIHRhYiwgd2l0aG91dCBhbmltYXRpb24gKGZvciBwYWdlLWluaXQpOlxyXG4gICAgICAgIHZhciBjdXJyZW50VGFiID0gJCgkdC5maW5kKCc+LnRhYnM+bGkuY3VycmVudD5hJykuYXR0cignaHJlZicpKTtcclxuICAgICAgICBjLnNjcm9sbExlZnQoYy5zY3JvbGxMZWZ0KCkgKyBjdXJyZW50VGFiLnBvc2l0aW9uKCkubGVmdCk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIFdpemFyZCBUYWJiZWQgRm9ybXMuXHJcbiAgICBJdCB1c2UgdGFicyB0byBtYW5hZ2UgdGhlIGRpZmZlcmVudCBmb3Jtcy1zdGVwcyBpbiB0aGUgd2l6YXJkLFxyXG4gICAgbG9hZGVkIGJ5IEFKQVggYW5kIGZvbGxvd2luZyB0byB0aGUgbmV4dCB0YWIvc3RlcCBvbiBzdWNjZXNzLlxyXG5cclxuICAgIFJlcXVpcmUgVGFiYmVkVVggdmlhIERJIG9uICdpbml0J1xyXG4gKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKSxcclxuICAgIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0VGFiYmVkV2l6YXJkKFRhYmJlZFVYLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGxvYWRpbmdEZWxheTogMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChcImJvZHlcIikuZGVsZWdhdGUoXCIudGFiYmVkLndpemFyZCAubmV4dFwiLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBmb3JtXHJcbiAgICAgICAgdmFyIGZvcm0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBjdXJyZW50IHdpemFyZCBzdGVwLXRhYlxyXG4gICAgICAgIHZhciBjdXJyZW50U3RlcCA9IGZvcm0uY2xvc2VzdCgnLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgd2l6YXJkIGNvbnRhaW5lclxyXG4gICAgICAgIHZhciB3aXphcmQgPSBmb3JtLmNsb3Nlc3QoJy50YWJiZWQud2l6YXJkJyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgd2l6YXJkLW5leHQtc3RlcFxyXG4gICAgICAgIHZhciBuZXh0U3RlcCA9ICQodGhpcykuZGF0YSgnd2l6YXJkLW5leHQtc3RlcCcpO1xyXG5cclxuICAgICAgICB2YXIgY3R4ID0ge1xyXG4gICAgICAgICAgICBib3g6IGN1cnJlbnRTdGVwLFxyXG4gICAgICAgICAgICBmb3JtOiBmb3JtXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gRmlyc3QgYXQgYWxsLCBpZiB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICAgICAgdmFyIHZhbG9iamVjdCA9IGZvcm0uZGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKHZhbG9iamVjdCAmJiB2YWxvYmplY3QudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5nb1RvU3VtbWFyeUVycm9ycyhmb3JtKTtcclxuICAgICAgICAgICAgLy8gVmFsaWRhdGlvbiBpcyBhY3RpdmVkLCB3YXMgZXhlY3V0ZWQgYW5kIHRoZSByZXN1bHQgaXMgJ2ZhbHNlJzogYmFkIGRhdGEsIHN0b3AgUG9zdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgY3VzdG9tIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgICAgICB2YXIgY3VzdmFsID0gZm9ybS5kYXRhKCdjdXN0b21WYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKGN1c3ZhbCAmJiBjdXN2YWwudmFsaWRhdGUgJiYgY3VzdmFsLnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSk7XHJcbiAgICAgICAgICAgIC8vIGN1c3RvbSB2YWxpZGF0aW9uIG5vdCBwYXNzZWQsIG91dCFcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmFpc2UgZXZlbnRcclxuICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdiZWdpblN1Ym1pdFdpemFyZFN0ZXAnKTtcclxuXHJcbiAgICAgICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgICAgICBjdHgubG9hZGluZ3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwLmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgICAgICB9LCBvcHRpb25zLmxvYWRpbmdEZWxheSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBvayA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBNYXJrIGFzIHNhdmVkOlxyXG4gICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmb3JtLmdldCgwKSk7XHJcblxyXG4gICAgICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IChmb3JtLmF0dHIoJ2FjdGlvbicpIHx8ICcnKSxcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgICAgIGRhdGE6IGZvcm0uc2VyaWFsaXplKCksXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIHN1Y2Nlc3MsIGdvIG5leHQgc3RlcCwgdXNpbmcgY3VzdG9tIEpTT04gQWN0aW9uIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0ub24oJ2FqYXhTdWNjZXNzUG9zdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBuZXh0LXN0ZXBcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbmV4dCBzdGVwIGlzIGludGVybmFsIHVybCAoYSBuZXh0IHdpemFyZCB0YWIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvXiMvLnRlc3QobmV4dFN0ZXApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5leHRTdGVwKS50cmlnZ2VyKCdiZWdpbkxvYWRXaXphcmRTdGVwJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVGFiYmVkVVguZW5hYmxlVGFiKG5leHRTdGVwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5leHRTdGVwKS50cmlnZ2VyKCdlbmRMb2FkV2l6YXJkU3RlcCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBuZXh0LXN0ZXAgVVJJIHRoYXQgaXMgbm90IGludGVybmFsIGxpbmssIHdlIGxvYWQgaXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0VG8obmV4dFN0ZXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRG8gSlNPTiBhY3Rpb24gYnV0IGlmIGlzIG5vdCBKU09OIG9yIHZhbGlkLCBtYW5hZ2UgYXMgSFRNTDpcclxuICAgICAgICAgICAgICAgIGlmICghYWpheENhbGxiYWNrcy5kb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQb3N0ICdtYXliZScgd2FzIHdyb25nLCBodG1sIHdhcyByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9ybSBjb250YWluZXI6IHRoZSBhamF4LWJveC5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhbiBlbXB0eSBkb2N1bWVudCBvciBtYWxmb3JtZWQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvd2luZyBuZXcgaHRtbDpcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50U3RlcC5odG1sKG5ld2h0bWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdGb3JtID0gY3VycmVudFN0ZXA7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50U3RlcC5pcygnZm9ybScpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGb3JtID0gY3VycmVudFN0ZXAuZmluZCgnZm9ybTplcSgwKScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAgICAgICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50c1xyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ3JlbG9hZGVkSHRtbFdpemFyZFN0ZXAnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGFqYXhDYWxsYmFja3MuZXJyb3IsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBhamF4Q2FsbGJhY2tzLmNvbXBsZXRlXHJcbiAgICAgICAgfSkuY29tcGxldGUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdlbmRTdWJtaXRXaXphcmRTdGVwJywgb2spO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKiB0aW1lU3BhbiBjbGFzcyB0byBtYW5hZ2UgdGltZXMsIHBhcnNlLCBmb3JtYXQsIGNvbXB1dGUuXHJcbkl0cyBub3Qgc28gY29tcGxldGUgYXMgdGhlIEMjIG9uZXMgYnV0IGlzIHVzZWZ1bGwgc3RpbGwuXHJcbioqL1xyXG52YXIgVGltZVNwYW4gPSBmdW5jdGlvbiAoZGF5cywgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcykge1xyXG4gICAgdGhpcy5kYXlzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGRheXMpKSB8fCAwO1xyXG4gICAgdGhpcy5ob3VycyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChob3VycykpIHx8IDA7XHJcbiAgICB0aGlzLm1pbnV0ZXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQobWludXRlcykpIHx8IDA7XHJcbiAgICB0aGlzLnNlY29uZHMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoc2Vjb25kcykpIHx8IDA7XHJcbiAgICB0aGlzLm1pbGxpc2Vjb25kcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChtaWxsaXNlY29uZHMpKSB8fCAwO1xyXG5cclxuICAgIC8vIGludGVybmFsIHV0aWxpdHkgZnVuY3Rpb24gJ3RvIHN0cmluZyB3aXRoIHR3byBkaWdpdHMgYWxtb3N0J1xyXG4gICAgZnVuY3Rpb24gdChuKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobiAvIDEwKSArICcnICsgbiAlIDEwO1xyXG4gICAgfVxyXG4gICAgLyoqIFNob3cgb25seSBob3VycyBhbmQgbWludXRlcyBhcyBhIHN0cmluZyB3aXRoIHRoZSBmb3JtYXQgSEg6bW1cclxuICAgICoqL1xyXG4gICAgdGhpcy50b1Nob3J0U3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TaG9ydFN0cmluZygpIHtcclxuICAgICAgICB2YXIgaCA9IHQodGhpcy5ob3VycyksXHJcbiAgICAgICAgICAgIG0gPSB0KHRoaXMubWludXRlcyk7XHJcbiAgICAgICAgcmV0dXJuIChoICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgKyBtKTtcclxuICAgIH07XHJcbiAgICAvKiogU2hvdyB0aGUgZnVsbCB0aW1lIGFzIGEgc3RyaW5nLCBkYXlzIGNhbiBhcHBlYXIgYmVmb3JlIGhvdXJzIGlmIHRoZXJlIGFyZSAyNCBob3VycyBvciBtb3JlXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1N0cmluZygpIHtcclxuICAgICAgICB2YXIgaCA9IHQodGhpcy5ob3VycyksXHJcbiAgICAgICAgICAgIGQgPSAodGhpcy5kYXlzID4gMCA/IHRoaXMuZGF5cy50b1N0cmluZygpICsgVGltZVNwYW4uZGVjaW1hbHNEZWxpbWl0ZXIgOiAnJyksXHJcbiAgICAgICAgICAgIG0gPSB0KHRoaXMubWludXRlcyksXHJcbiAgICAgICAgICAgIHMgPSB0KHRoaXMuc2Vjb25kcyArIHRoaXMubWlsbGlzZWNvbmRzIC8gMTAwMCk7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgZCArXHJcbiAgICAgICAgICAgIGggKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArXHJcbiAgICAgICAgICAgIG0gKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArXHJcbiAgICAgICAgICAgIHMpO1xyXG4gICAgfTtcclxuICAgIHRoaXMudmFsdWVPZiA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3ZhbHVlT2YoKSB7XHJcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB0b3RhbCBtaWxsaXNlY29uZHMgY29udGFpbmVkIGJ5IHRoZSB0aW1lXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5kYXlzICogKDI0ICogMzYwMDAwMCkgK1xyXG4gICAgICAgICAgICB0aGlzLmhvdXJzICogMzYwMDAwMCArXHJcbiAgICAgICAgICAgIHRoaXMubWludXRlcyAqIDYwMDAwICtcclxuICAgICAgICAgICAgdGhpcy5zZWNvbmRzICogMTAwMCArXHJcbiAgICAgICAgICAgIHRoaXMubWlsbGlzZWNvbmRzXHJcbiAgICAgICAgKTtcclxuICAgIH07XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgbWlsbGlzZWNvbmRzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbU1pbGxpc2Vjb25kcyhtaWxsaXNlY29uZHMpIHtcclxuICAgIHZhciBtcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDAsXHJcbiAgICAgICAgcyA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gMTAwMCkgJSA2MCxcclxuICAgICAgICBtID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyA2MDAwMCkgJSA2MCxcclxuICAgICAgICBoID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAzNjAwMDAwKSAlIDI0LFxyXG4gICAgICAgIGQgPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvICgzNjAwMDAwICogMjQpKTtcclxuICAgIHJldHVybiBuZXcgVGltZVNwYW4oZCwgaCwgbSwgcywgbXMpO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgc2Vjb25kc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbVNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tU2Vjb25kcyhzZWNvbmRzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tTWlsbGlzZWNvbmRzKHNlY29uZHMgKiAxMDAwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIG1pbnV0ZXNcclxuKiovXHJcblRpbWVTcGFuLmZyb21NaW51dGVzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbU1pbnV0ZXMobWludXRlcykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbVNlY29uZHMobWludXRlcyAqIDYwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIGhvdXJzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tSG91cnMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tSG91cnMoaG91cnMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21NaW51dGVzKGhvdXJzICogNjApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgZGF5c1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbURheXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tRGF5cyhkYXlzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tSG91cnMoZGF5cyAqIDI0KTtcclxufTtcclxuXHJcbi8vIEZvciBzcGFuaXNoIGFuZCBlbmdsaXNoIHdvcmtzIGdvb2QgJzonIGFzIHVuaXRzRGVsaW1pdGVyIGFuZCAnLicgYXMgZGVjaW1hbERlbGltaXRlclxyXG4vLyBUT0RPOiB0aGlzIG11c3QgYmUgc2V0IGZyb20gYSBnbG9iYWwgTEMuaTE4biB2YXIgbG9jYWxpemVkIGZvciBjdXJyZW50IHVzZXJcclxuVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgPSAnOic7XHJcblRpbWVTcGFuLmRlY2ltYWxzRGVsaW1pdGVyID0gJy4nO1xyXG5UaW1lU3Bhbi5wYXJzZSA9IGZ1bmN0aW9uIChzdHJ0aW1lKSB7XHJcbiAgICBzdHJ0aW1lID0gKHN0cnRpbWUgfHwgJycpLnNwbGl0KHRoaXMudW5pdHNEZWxpbWl0ZXIpO1xyXG4gICAgLy8gQmFkIHN0cmluZywgcmV0dXJucyBudWxsXHJcbiAgICBpZiAoc3RydGltZS5sZW5ndGggPCAyKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIC8vIERlY291cGxlZCB1bml0czpcclxuICAgIHZhciBkLCBoLCBtLCBzLCBtcztcclxuICAgIGggPSBzdHJ0aW1lWzBdO1xyXG4gICAgbSA9IHN0cnRpbWVbMV07XHJcbiAgICBzID0gc3RydGltZS5sZW5ndGggPiAyID8gc3RydGltZVsyXSA6IDA7XHJcbiAgICAvLyBTdWJzdHJhY3RpbmcgZGF5cyBmcm9tIHRoZSBob3VycyBwYXJ0IChmb3JtYXQ6ICdkYXlzLmhvdXJzJyB3aGVyZSAnLicgaXMgZGVjaW1hbHNEZWxpbWl0ZXIpXHJcbiAgICBpZiAoaC5jb250YWlucyh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyKSkge1xyXG4gICAgICAgIHZhciBkaHNwbGl0ID0gaC5zcGxpdCh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyKTtcclxuICAgICAgICBkID0gZGhzcGxpdFswXTtcclxuICAgICAgICBoID0gZGhzcGxpdFsxXTtcclxuICAgIH1cclxuICAgIC8vIE1pbGxpc2Vjb25kcyBhcmUgZXh0cmFjdGVkIGZyb20gdGhlIHNlY29uZHMgKGFyZSByZXByZXNlbnRlZCBhcyBkZWNpbWFsIG51bWJlcnMgb24gdGhlIHNlY29uZHMgcGFydDogJ3NlY29uZHMubWlsbGlzZWNvbmRzJyB3aGVyZSAnLicgaXMgZGVjaW1hbHNEZWxpbWl0ZXIpXHJcbiAgICBtcyA9IE1hdGgucm91bmQocGFyc2VGbG9hdChzLnJlcGxhY2UodGhpcy5kZWNpbWFsc0RlbGltaXRlciwgJy4nKSkgKiAxMDAwICUgMTAwMCk7XHJcbiAgICAvLyBSZXR1cm4gdGhlIG5ldyB0aW1lIGluc3RhbmNlXHJcbiAgICByZXR1cm4gbmV3IFRpbWVTcGFuKGQsIGgsIG0sIHMsIG1zKTtcclxufTtcclxuVGltZVNwYW4uemVybyA9IG5ldyBUaW1lU3BhbigwLCAwLCAwLCAwLCAwKTtcclxuVGltZVNwYW4ucHJvdG90eXBlLmlzWmVybyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2lzWmVybygpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgdGhpcy5kYXlzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5ob3VycyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMubWludXRlcyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMuc2Vjb25kcyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMubWlsbGlzZWNvbmRzID09PSAwXHJcbiAgICApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxNaWxsaXNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbE1pbGxpc2Vjb25kcygpIHtcclxuICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsU2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsU2Vjb25kcygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbE1pbGxpc2Vjb25kcygpIC8gMTAwMCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbE1pbnV0ZXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbE1pbnV0ZXMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxTZWNvbmRzKCkgLyA2MCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbEhvdXJzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxIb3VycygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbE1pbnV0ZXMoKSAvIDYwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsRGF5cyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsRGF5cygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbEhvdXJzKCkgLyAyNCk7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRpbWVTcGFuOyIsIi8qIEV4dHJhIHV0aWxpdGllcyBhbmQgbWV0aG9kcyBcclxuICovXHJcbnZhciBUaW1lU3BhbiA9IHJlcXVpcmUoJy4vVGltZVNwYW4nKTtcclxudmFyIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbi8qKiBTaG93cyB0aW1lIGFzIGEgbGFyZ2Ugc3RyaW5nIHdpdGggdW5pdHMgbmFtZXMgZm9yIHZhbHVlcyBkaWZmZXJlbnQgdGhhbiB6ZXJvLlxyXG4gKiovXHJcbmZ1bmN0aW9uIHNtYXJ0VGltZSh0aW1lKSB7XHJcbiAgICB2YXIgciA9IFtdO1xyXG4gICAgaWYgKHRpbWUuZGF5cyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuZGF5cyArICcgZGF5cycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5kYXlzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIGRheScpO1xyXG4gICAgaWYgKHRpbWUuaG91cnMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLmhvdXJzICsgJyBob3VycycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5ob3VycyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBob3VyJyk7XHJcbiAgICBpZiAodGltZS5taW51dGVzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5taW51dGVzICsgJyBtaW51dGVzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLm1pbnV0ZXMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgbWludXRlJyk7XHJcbiAgICBpZiAodGltZS5zZWNvbmRzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5zZWNvbmRzICsgJyBzZWNvbmRzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLnNlY29uZHMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgc2Vjb25kJyk7XHJcbiAgICBpZiAodGltZS5taWxsaXNlY29uZHMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLm1pbGxpc2Vjb25kcyArICcgbWlsbGlzZWNvbmRzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLm1pbGxpc2Vjb25kcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBtaWxsaXNlY29uZCcpO1xyXG4gICAgcmV0dXJuIHIuam9pbignLCAnKTtcclxufVxyXG5cclxuLyoqIFJvdW5kcyBhIHRpbWUgdG8gdGhlIG5lYXJlc3QgMTUgbWludXRlcyBmcmFnbWVudC5cclxuQHJvdW5kVG8gc3BlY2lmeSB0aGUgTEMucm91bmRpbmdUeXBlRW51bSBhYm91dCBob3cgdG8gcm91bmQgdGhlIHRpbWUgKGRvd24sIG5lYXJlc3Qgb3IgdXApXHJcbioqL1xyXG5mdW5jdGlvbiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyKC8qIFRpbWVTcGFuICovdGltZSwgLyogbWF0aFV0aWxzLnJvdW5kaW5nVHlwZUVudW0gKi9yb3VuZFRvKSB7XHJcbiAgICB2YXIgcmVzdEZyb21RdWFydGVyID0gdGltZS50b3RhbEhvdXJzKCkgJSAwLjI1O1xyXG4gICAgdmFyIGhvdXJzID0gdGltZS50b3RhbEhvdXJzKCk7XHJcbiAgICBpZiAocmVzdEZyb21RdWFydGVyID4gMC4wKSB7XHJcbiAgICAgICAgc3dpdGNoIChyb3VuZFRvKSB7XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5Eb3duOlxyXG4gICAgICAgICAgICAgICAgaG91cnMgLT0gcmVzdEZyb21RdWFydGVyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5OZWFyZXN0OlxyXG4gICAgICAgICAgICAgICAgdmFyIGxpbWl0ID0gMC4yNSAvIDI7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdEZyb21RdWFydGVyID49IGxpbWl0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG91cnMgKz0gKDAuMjUgLSByZXN0RnJvbVF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBob3VycyAtPSByZXN0RnJvbVF1YXJ0ZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLlVwOlxyXG4gICAgICAgICAgICAgICAgaG91cnMgKz0gKDAuMjUgLSByZXN0RnJvbVF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFRpbWVTcGFuLmZyb21Ib3Vycyhob3Vycyk7XHJcbn1cclxuXHJcbi8vIEV4dGVuZCBhIGdpdmVuIFRpbWVTcGFuIG9iamVjdCB3aXRoIHRoZSBFeHRyYSBtZXRob2RzXHJcbmZ1bmN0aW9uIHBsdWdJbihUaW1lU3Bhbikge1xyXG4gICAgVGltZVNwYW4ucHJvdG90eXBlLnRvU21hcnRTdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1NtYXJ0U3RyaW5nKCkgeyByZXR1cm4gc21hcnRUaW1lKHRoaXMpOyB9O1xyXG4gICAgVGltZVNwYW4ucHJvdG90eXBlLnJvdW5kVG9RdWFydGVySG91ciA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3JvdW5kVG9RdWFydGVySG91cigpIHsgcmV0dXJuIHJvdW5kVGltZVRvUXVhcnRlckhvdXIuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTsgfTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgc21hcnRUaW1lOiBzbWFydFRpbWUsXHJcbiAgICAgICAgcm91bmRUb1F1YXJ0ZXJIb3VyOiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyLFxyXG4gICAgICAgIHBsdWdJbjogcGx1Z0luXHJcbiAgICB9O1xyXG4iLCIvKipcclxuICAgQVBJIGZvciBhdXRvbWF0aWMgY3JlYXRpb24gb2YgbGFiZWxzIGZvciBVSSBTbGlkZXJzIChqcXVlcnktdWkpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgdG9vbHRpcHMgPSByZXF1aXJlKCcuL3Rvb2x0aXBzJyksXHJcbiAgICBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyksXHJcbiAgICBUaW1lU3BhbiA9IHJlcXVpcmUoJy4vVGltZVNwYW4nKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG4vKiogQ3JlYXRlIGxhYmVscyBmb3IgYSBqcXVlcnktdWktc2xpZGVyLlxyXG4qKi9cclxuZnVuY3Rpb24gY3JlYXRlKHNsaWRlcikge1xyXG4gICAgLy8gcmVtb3ZlIG9sZCBvbmVzOlxyXG4gICAgdmFyIG9sZCA9IHNsaWRlci5zaWJsaW5ncygnLnVpLXNsaWRlci1sYWJlbHMnKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXInKS5nZXQoMCkgPT0gc2xpZGVyLmdldCgwKSk7XHJcbiAgICB9KS5yZW1vdmUoKTtcclxuICAgIC8vIENyZWF0ZSBsYWJlbHMgY29udGFpbmVyXHJcbiAgICB2YXIgbGFiZWxzID0gJCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbHNcIi8+Jyk7XHJcbiAgICBsYWJlbHMuZGF0YSgndWktc2xpZGVyJywgc2xpZGVyKTtcclxuXHJcbiAgICAvLyBTZXR1cCBvZiB1c2VmdWwgdmFycyBmb3IgbGFiZWwgY3JlYXRpb25cclxuICAgIHZhciBtYXggPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnbWF4JyksXHJcbiAgICAgICAgbWluID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ21pbicpLFxyXG4gICAgICAgIHN0ZXAgPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnc3RlcCcpLFxyXG4gICAgICAgIHN0ZXBzID0gTWF0aC5mbG9vcigobWF4IC0gbWluKSAvIHN0ZXApO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIGFuZCBwb3NpdGlvbmluZyBsYWJlbHNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0ZXBzOyBpKyspIHtcclxuICAgICAgICAvLyBDcmVhdGUgbGFiZWxcclxuICAgICAgICB2YXIgbGJsID0gJCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbFwiPjxzcGFuIGNsYXNzPVwidWktc2xpZGVyLWxhYmVsLXRleHRcIi8+PC9kaXY+Jyk7XHJcbiAgICAgICAgLy8gU2V0dXAgbGFiZWwgd2l0aCBpdHMgdmFsdWVcclxuICAgICAgICB2YXIgbGFiZWxWYWx1ZSA9IG1pbiArIGkgKiBzdGVwO1xyXG4gICAgICAgIGxibC5jaGlsZHJlbignLnVpLXNsaWRlci1sYWJlbC10ZXh0JykudGV4dChsYWJlbFZhbHVlKTtcclxuICAgICAgICBsYmwuZGF0YSgndWktc2xpZGVyLXZhbHVlJywgbGFiZWxWYWx1ZSk7XHJcbiAgICAgICAgLy8gUG9zaXRpb25hdGVcclxuICAgICAgICBwb3NpdGlvbmF0ZShsYmwsIGksIHN0ZXBzKTtcclxuICAgICAgICAvLyBBZGQgdG8gY29udGFpbmVyXHJcbiAgICAgICAgbGFiZWxzLmFwcGVuZChsYmwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZXIgZm9yIGxhYmVscyBjbGljayB0byBzZWxlY3QgaXRzIHBvc2l0aW9uIHZhbHVlXHJcbiAgICBsYWJlbHMub24oJ2NsaWNrJywgJy51aS1zbGlkZXItbGFiZWwnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHZhbCA9ICQodGhpcykuZGF0YSgndWktc2xpZGVyLXZhbHVlJyksXHJcbiAgICAgICAgICAgIHNsaWRlciA9ICQodGhpcykucGFyZW50KCkuZGF0YSgndWktc2xpZGVyJyk7XHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSW5zZXJ0IGxhYmVscyBhcyBhIHNpYmxpbmcgb2YgdGhlIHNsaWRlciAoY2Fubm90IGJlIGluc2VydGVkIGluc2lkZSlcclxuICAgIHNsaWRlci5hZnRlcihsYWJlbHMpO1xyXG59XHJcblxyXG4vKiogUG9zaXRpb25hdGUgdG8gdGhlIGNvcnJlY3QgcG9zaXRpb24gYW5kIHdpZHRoIGFuIFVJIGxhYmVsIGF0IEBsYmxcclxuZm9yIHRoZSByZXF1aXJlZCBwZXJjZW50YWdlLXdpZHRoIEBzd1xyXG4qKi9cclxuZnVuY3Rpb24gcG9zaXRpb25hdGUobGJsLCBpLCBzdGVwcykge1xyXG4gICAgdmFyIHN3ID0gMTAwIC8gc3RlcHM7XHJcbiAgICB2YXIgbGVmdCA9IGkgKiBzdyAtIHN3ICogMC41LFxyXG4gICAgICAgIHJpZ2h0ID0gMTAwIC0gbGVmdCAtIHN3LFxyXG4gICAgICAgIGFsaWduID0gJ2NlbnRlcic7XHJcbiAgICBpZiAoaSA9PT0gMCkge1xyXG4gICAgICAgIGFsaWduID0gJ2xlZnQnO1xyXG4gICAgICAgIGxlZnQgPSAwO1xyXG4gICAgfSBlbHNlIGlmIChpID09IHN0ZXBzKSB7XHJcbiAgICAgICAgYWxpZ24gPSAncmlnaHQnO1xyXG4gICAgICAgIHJpZ2h0ID0gMDtcclxuICAgIH1cclxuICAgIGxibC5jc3Moe1xyXG4gICAgICAgICd0ZXh0LWFsaWduJzogYWxpZ24sXHJcbiAgICAgICAgbGVmdDogbGVmdCArICclJyxcclxuICAgICAgICByaWdodDogcmlnaHQgKyAnJSdcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSB2aXNpYmlsaXR5IG9mIGxhYmVscyBvZiBhIGpxdWVyeS11aS1zbGlkZXIgZGVwZW5kaW5nIGlmIHRoZXkgZml0IGluIHRoZSBhdmFpbGFibGUgc3BhY2UuXHJcblNsaWRlciBuZWVkcyB0byBiZSB2aXNpYmxlLlxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlKHNsaWRlcikge1xyXG4gICAgLy8gR2V0IGxhYmVscyBmb3Igc2xpZGVyXHJcbiAgICB2YXIgbGFiZWxzX2MgPSBzbGlkZXIuc2libGluZ3MoJy51aS1zbGlkZXItbGFiZWxzJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCQodGhpcykuZGF0YSgndWktc2xpZGVyJykuZ2V0KDApID09IHNsaWRlci5nZXQoMCkpO1xyXG4gICAgfSk7XHJcbiAgICB2YXIgbGFiZWxzID0gbGFiZWxzX2MuZmluZCgnLnVpLXNsaWRlci1sYWJlbC10ZXh0Jyk7XHJcblxyXG4gICAgLy8gQXBwbHkgYXV0b3NpemVcclxuICAgIGlmICgoc2xpZGVyLmRhdGEoJ3NsaWRlci1hdXRvc2l6ZScpIHx8IGZhbHNlKS50b1N0cmluZygpID09ICd0cnVlJylcclxuICAgICAgICBhdXRvc2l6ZShzbGlkZXIsIGxhYmVscyk7XHJcblxyXG4gICAgLy8gR2V0IGFuZCBhcHBseSBsYXlvdXRcclxuICAgIHZhciBsYXlvdXRfbmFtZSA9IHNsaWRlci5kYXRhKCdzbGlkZXItbGFiZWxzLWxheW91dCcpIHx8ICdzdGFuZGFyZCcsXHJcbiAgICAgICAgbGF5b3V0ID0gbGF5b3V0X25hbWUgaW4gbGF5b3V0cyA/IGxheW91dHNbbGF5b3V0X25hbWVdIDogbGF5b3V0cy5zdGFuZGFyZDtcclxuICAgIGxhYmVsc19jLmFkZENsYXNzKCdsYXlvdXQtJyArIGxheW91dF9uYW1lKTtcclxuICAgIGxheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0b29sdGlwc1xyXG4gICAgdG9vbHRpcHMuY3JlYXRlVG9vbHRpcChsYWJlbHNfYy5jaGlsZHJlbigpLCB7XHJcbiAgICAgICAgdGl0bGU6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICQodGhpcykudGV4dCgpOyB9XHJcbiAgICAgICAgLCBwZXJzaXN0ZW50OiB0cnVlXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gYXV0b3NpemUoc2xpZGVyLCBsYWJlbHMpIHtcclxuICAgIHZhciB0b3RhbF93aWR0aCA9IDA7XHJcbiAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdG90YWxfd2lkdGggKz0gJCh0aGlzKS5vdXRlcldpZHRoKHRydWUpO1xyXG4gICAgfSk7XHJcbiAgICB2YXIgYyA9IHNsaWRlci5jbG9zZXN0KCcudWktc2xpZGVyLWNvbnRhaW5lcicpLFxyXG4gICAgICAgIG1heCA9IHBhcnNlRmxvYXQoYy5jc3MoJ21heC13aWR0aCcpKSxcclxuICAgICAgICBtaW4gPSBwYXJzZUZsb2F0KGMuY3NzKCdtaW4td2lkdGgnKSk7XHJcbiAgICBpZiAobWF4ICE9IE51bWJlci5OYU4gJiYgdG90YWxfd2lkdGggPiBtYXgpXHJcbiAgICAgICAgdG90YWxfd2lkdGggPSBtYXg7XHJcbiAgICBpZiAobWluICE9IE51bWJlci5OYU4gJiYgdG90YWxfd2lkdGggPCBtaW4pXHJcbiAgICAgICAgdG90YWxfd2lkdGggPSBtaW47XHJcbiAgICBjLndpZHRoKHRvdGFsX3dpZHRoKTtcclxufVxyXG5cclxuLyoqIFNldCBvZiBkaWZmZXJlbnQgbGF5b3V0cyBmb3IgbGFiZWxzLCBhbGxvd2luZyBkaWZmZXJlbnQga2luZHMgb2YgXHJcbnBsYWNlbWVudCBhbmQgdmlzdWFsaXphdGlvbiB1c2luZyB0aGUgc2xpZGVyIGRhdGEgb3B0aW9uICdsYWJlbHMtbGF5b3V0Jy5cclxuVXNlZCBieSAndXBkYXRlJywgYWxtb3N0IHRoZSAnc3RhbmRhcmQnIG11c3QgZXhpc3QgYW5kIGNhbiBiZSBpbmNyZWFzZWRcclxuZXh0ZXJuYWxseVxyXG4qKi9cclxudmFyIGxheW91dHMgPSB7fTtcclxuLyoqIFNob3cgdGhlIG1heGltdW0gbnVtYmVyIG9mIGxhYmVscyBpbiBlcXVhbGx5IHNpemVkIGdhcHMgYnV0XHJcbnRoZSBsYXN0IGxhYmVsIHRoYXQgaXMgZW5zdXJlZCB0byBiZSBzaG93ZWQgZXZlbiBpZiBpdCBjcmVhdGVzXHJcbmEgaGlnaGVyIGdhcCB3aXRoIHRoZSBwcmV2aW91cyBvbmUuXHJcbioqL1xyXG5sYXlvdXRzLnN0YW5kYXJkID0gZnVuY3Rpb24gc3RhbmRhcmRfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscykge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlcmUgYXJlIG1vcmUgbGFiZWxzIHRoYW4gYXZhaWxhYmxlIHNwYWNlXHJcbiAgICAvLyBHZXQgbWF4aW11bSBsYWJlbCB3aWR0aFxyXG4gICAgdmFyIGl0ZW1fd2lkdGggPSAwO1xyXG4gICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0dyA9ICQodGhpcykub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgICAgICBpZiAodHcgPj0gaXRlbV93aWR0aClcclxuICAgICAgICAgICAgaXRlbV93aWR0aCA9IHR3O1xyXG4gICAgfSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyB3aWR0aCwgaWYgbm90LCBlbGVtZW50IGlzIG5vdCB2aXNpYmxlIGNhbm5vdCBiZSBjb21wdXRlZFxyXG4gICAgaWYgKGl0ZW1fd2lkdGggPiAwKSB7XHJcbiAgICAgICAgLy8gR2V0IHRoZSByZXF1aXJlZCBzdGVwcGluZyBvZiBsYWJlbHNcclxuICAgICAgICB2YXIgbGFiZWxzX3N0ZXAgPSBNYXRoLmNlaWwoaXRlbV93aWR0aCAvIChzbGlkZXIud2lkdGgoKSAvIGxhYmVscy5sZW5ndGgpKSxcclxuICAgICAgICBsYWJlbHNfc3RlcHMgPSBsYWJlbHMubGVuZ3RoIC8gbGFiZWxzX3N0ZXA7XHJcbiAgICAgICAgaWYgKGxhYmVsc19zdGVwID4gMSkge1xyXG4gICAgICAgICAgICAvLyBIaWRlIHRoZSBsYWJlbHMgb24gcG9zaXRpb25zIG91dCBvZiB0aGUgc3RlcFxyXG4gICAgICAgICAgICB2YXIgbmV3aSA9IDAsXHJcbiAgICAgICAgICAgICAgICBsaW1pdCA9IGxhYmVscy5sZW5ndGggLSAxIC0gbGFiZWxzX3N0ZXA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFiZWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGJsID0gJChsYWJlbHNbaV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKChpICsgMSkgPCBsYWJlbHMubGVuZ3RoICYmIChcclxuICAgICAgICAgICAgICAgICAgICBpICUgbGFiZWxzX3N0ZXAgfHxcclxuICAgICAgICAgICAgICAgICAgICBpID4gbGltaXQpKVxyXG4gICAgICAgICAgICAgICAgICAgIGxibC5oaWRlKCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3dcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gbGJsLnNob3coKS5wYXJlbnQoKS5hZGRDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcG9zaXRpb25hdGUgcGFyZW50XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcG9zaXRpb25hdGUocGFyZW50LCBuZXdpLCBsYWJlbHNfc3RlcHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld2krKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuLyoqIFNob3cgbGFiZWxzIG51bWJlciB2YWx1ZXMgZm9ybWF0dGVkIGFzIGhvdXJzLCB3aXRoIG9ubHlcclxuaW50ZWdlciBob3VycyBiZWluZyBzaG93ZWQsIHRoZSBtYXhpbXVtIG51bWJlciBvZiBpdC5cclxuKiovXHJcbmxheW91dHMuaG91cnMgPSBmdW5jdGlvbiBob3Vyc19sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzLCBzaG93X2FsbCkge1xyXG4gICAgdmFyIGludExhYmVscyA9IHNsaWRlci5maW5kKCcuaW50ZWdlci1ob3VyJyk7XHJcbiAgICBpZiAoIWludExhYmVscy5sZW5ndGgpIHtcclxuICAgICAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGlmICghJHQuZGF0YSgnaG91ci1wcm9jZXNzZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHYgPSBwYXJzZUZsb2F0KCR0LnRleHQoKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodiAhPSBOdW1iZXIuTmFOKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdiA9IG11LnJvdW5kVG8odiwgMik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYgJSAxID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnZGVjaW1hbC1ob3VyJykuaGlkZSgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ICUgMC41ID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQucGFyZW50KCkuYWRkQ2xhc3MoJ3N0cm9uZycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC50ZXh0KFRpbWVTcGFuLmZyb21Ib3Vycyh2KS50b1Nob3J0U3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdpbnRlZ2VyLWhvdXInKS5zaG93KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW50TGFiZWxzID0gaW50TGFiZWxzLmFkZCgkdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnaG91ci1wcm9jZXNzZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKHNob3dfYWxsICE9PSB0cnVlKVxyXG4gICAgICAgIGxheW91dHMuc3RhbmRhcmQoc2xpZGVyLCBpbnRMYWJlbHMucGFyZW50KCksIGludExhYmVscyk7XHJcbn07XHJcbmxheW91dHNbJ2FsbC12YWx1ZXMnXSA9IGZ1bmN0aW9uIGFsbF9sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKSB7XHJcbiAgICAvLyBTaG93aW5nIGFsbCBsYWJlbHNcclxuICAgIGxhYmVsc19jLnNob3coKS5hZGRDbGFzcygndmlzaWJsZScpLmNoaWxkcmVuKCkuc2hvdygpO1xyXG59O1xyXG5sYXlvdXRzWydhbGwtaG91cnMnXSA9IGZ1bmN0aW9uIGFsbF9ob3Vyc19sYXlvdXQoKSB7XHJcbiAgICAvLyBKdXN0IHVzZSBob3VycyBsYXlvdXQgYnV0IHNob3dpbmcgYWxsIGludGVnZXIgaG91cnNcclxuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwoYXJndW1lbnRzLCB0cnVlKTtcclxuICAgIGxheW91dHMuaG91cnMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY3JlYXRlOiBjcmVhdGUsXHJcbiAgICB1cGRhdGU6IHVwZGF0ZSxcclxuICAgIGxheW91dHM6IGxheW91dHNcclxufTtcclxuIiwiLyogU2V0IG9mIGNvbW1vbiBMQyBjYWxsYmFja3MgZm9yIG1vc3QgQWpheCBvcGVyYXRpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG52YXIgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIEFLQTogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25FcnJvcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIC8vIElmIGlzIGEgY29ubmVjdGlvbiBhYm9ydGVkLCBubyBzaG93IG1lc3NhZ2UuXHJcbiAgICAvLyByZWFkeVN0YXRlIGRpZmZlcmVudCB0byAnZG9uZTo0JyBtZWFucyBhYm9ydGVkIHRvbywgXHJcbiAgICAvLyBiZWNhdXNlIHdpbmRvdyBiZWluZyBjbG9zZWQvbG9jYXRpb24gY2hhbmdlZFxyXG4gICAgaWYgKG1lc3NhZ2UgPT0gJ2Fib3J0JyB8fCBqeC5yZWFkeVN0YXRlICE9IDQpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIHZhciBtID0gbWVzc2FnZTtcclxuICAgIHZhciBpZnJhbWUgPSBudWxsO1xyXG4gICAgc2l6ZSA9IHBvcHVwLnNpemUoJ2xhcmdlJyk7XHJcbiAgICBzaXplLmhlaWdodCAtPSAzNDtcclxuICAgIGlmIChtID09ICdlcnJvcicpIHtcclxuICAgICAgICBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoangucmVzcG9uc2VUZXh0LCBzaXplKTtcclxuICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgIG0gPSBudWxsO1xyXG4gICAgfSAgZWxzZVxyXG4gICAgICAgIG0gPSBtICsgXCI7IFwiICsgZXg7XHJcblxyXG4gICAgLy8gQmxvY2sgYWxsIHdpbmRvdywgbm90IG9ubHkgY3VycmVudCBlbGVtZW50XHJcbiAgICAkLmJsb2NrVUkoZXJyb3JCbG9jayhtLCBudWxsLCBwb3B1cC5zdHlsZShzaXplKSkpO1xyXG4gICAgaWYgKGlmcmFtZSlcclxuICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICQoJy5ibG9ja1VJIC5jbG9zZS1wb3B1cCcpLmNsaWNrKGZ1bmN0aW9uICgpIHsgJC51bmJsb2NrVUkoKTsgcmV0dXJuIGZhbHNlOyB9KTtcclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkNvbXBsZXRlKCkge1xyXG4gICAgLy8gRGlzYWJsZSBsb2FkaW5nXHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5ndGltZXIgfHwgdGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgLy8gVW5ibG9ja1xyXG4gICAgaWYgKHRoaXMuYXV0b1VuYmxvY2tMb2FkaW5nKSB7XHJcbiAgICAgICAgLy8gRG91YmxlIHVuLWxvY2ssIGJlY2F1c2UgYW55IG9mIHRoZSB0d28gc3lzdGVtcyBjYW4gYmVpbmcgdXNlZDpcclxuICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh0aGlzLmJveCk7XHJcbiAgICAgICAgdGhpcy5ib3gudW5ibG9jaygpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICB2YXIgY3R4ID0gdGhpcztcclxuICAgIC8vIFN1cHBvcnRlZCB0aGUgZ2VuZXJpYyBjdHguZWxlbWVudCBmcm9tIGpxdWVyeS5yZWxvYWRcclxuICAgIGlmIChjdHguZWxlbWVudCkgY3R4LmZvcm0gPSBjdHguZWxlbWVudDtcclxuICAgIC8vIFNwZWNpZmljIHN0dWZmIG9mIGFqYXhGb3Jtc1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgaWYgKCFkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkpIHtcclxuICAgICAgICAvLyBQb3N0ICdtYXliZScgd2FzIHdyb25nLCBodG1sIHdhcyByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgXHJcbiAgICAgICAgLy8gZm9ybSBjb250YWluZXI6IHRoZSBhamF4LWJveC5cclxuXHJcbiAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgICAgIC8vIEF2b2lkIGVtcHR5IGRvY3VtZW50cyBiZWluZyBwYXJzZWQgKHJhaXNlIGVycm9yKVxyXG4gICAgICAgIGlmICgkLnRyaW0oZGF0YSkpIHtcclxuICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGEgbWFsZm9ybWVkIGRvY3VtZW50IGlzIHJldHVybmVkOlxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKGRhdGEpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRm9yICdyZWxvYWQnIHN1cHBvcnQsIGNoZWNrIHRvbyB0aGUgY29udGV4dC5tb2RlLCBhbmQgYm90aCByZWxvYWQgb3IgYWpheEZvcm1zIGNoZWNrIGRhdGEgYXR0cmlidXRlIHRvb1xyXG4gICAgICAgIGN0eC5ib3hJc0NvbnRhaW5lciA9IGN0eC5ib3hJc0NvbnRhaW5lcjtcclxuICAgICAgICB2YXIgcmVwbGFjZUJveENvbnRlbnQgPVxyXG4gICAgICAgICAgKGN0eC5vcHRpb25zICYmIGN0eC5vcHRpb25zLm1vZGUgPT09ICdyZXBsYWNlLWNvbnRlbnQnKSB8fFxyXG4gICAgICAgICAgY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JztcclxuXHJcbiAgICAgICAgLy8gU3VwcG9ydCBmb3IgcmVsb2FkLCBhdm9pZGluZyBpbXBvcnRhbnQgYnVncyB3aXRoIHJlbG9hZGluZyBib3hlcyB0aGF0IGNvbnRhaW5zIGZvcm1zOlxyXG4gICAgICAgIC8vIElmIG9wZXJhdGlvbiBpcyBhIHJlbG9hZCwgZG9uJ3QgY2hlY2sgdGhlIGFqYXgtYm94XHJcbiAgICAgICAgdmFyIGpiID0gbmV3aHRtbDtcclxuICAgICAgICBpZiAoIWN0eC5pc1JlbG9hZCkge1xyXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHJldHVybmVkIGVsZW1lbnQgaXMgdGhlIGFqYXgtYm94LCBpZiBub3QsIGZpbmRcclxuICAgICAgICAgIC8vIHRoZSBlbGVtZW50IGluIHRoZSBuZXdodG1sOlxyXG4gICAgICAgICAgamIgPSBuZXdodG1sLmZpbHRlcignLmFqYXgtYm94Jyk7XHJcbiAgICAgICAgICBpZiAoamIubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgICBpZiAoIWN0eC5ib3hJc0NvbnRhaW5lciAmJiAhamIuaXMoJy5hamF4LWJveCcpKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWwuZmluZCgnLmFqYXgtYm94OmVxKDApJyk7XHJcbiAgICAgICAgICBpZiAoIWpiIHx8IGpiLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBhamF4LWJveCwgdXNlIGFsbCBlbGVtZW50IHJldHVybmVkOlxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KVxyXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBib3ggY29udGVudCB3aXRoIHRoZSBjb250ZW50IG9mIHRoZSByZXR1cm5lZCBib3hcclxuICAgICAgICAgICAgLy8gb3IgYWxsIGlmIHRoZXJlIGlzIG5vIGFqYXgtYm94IGluIHRoZSByZXN1bHQuXHJcbiAgICAgICAgICAgIGpiID0gamIuaXMoJy5hamF4LWJveCcpID8gamIuY29udGVudHMoKSA6IGpiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KSB7XHJcbiAgICAgICAgICBjdHguYm94LmVtcHR5KCkuYXBwZW5kKGpiKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGN0eC5ib3hJc0NvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAvLyBqYiBpcyBjb250ZW50IG9mIHRoZSBib3ggY29udGFpbmVyOlxyXG4gICAgICAgICAgICBjdHguYm94Lmh0bWwoamIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGJveCBpcyBjb250ZW50IHRoYXQgbXVzdCBiZSByZXBsYWNlZCBieSB0aGUgbmV3IGNvbnRlbnQ6XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVwbGFjZVdpdGgoamIpO1xyXG4gICAgICAgICAgICAvLyBhbmQgcmVmcmVzaCB0aGUgcmVmZXJlbmNlIHRvIGJveCB3aXRoIHRoZSBuZXcgZWxlbWVudFxyXG4gICAgICAgICAgICBjdHguYm94ID0gamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJdCBzdXBwb3J0cyBub3JtYWwgYWpheCBmb3JtcyBhbmQgc3ViZm9ybXMgdGhyb3VnaCBmaWVsZHNldC5hamF4XHJcbiAgICAgICAgaWYgKGN0eC5ib3guaXMoJ2Zvcm0uYWpheCcpIHx8IGN0eC5ib3guaXMoJ2ZpZWxkc2V0LmFqYXgnKSlcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveDtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmb3JtLmFqYXg6ZXEoMCknKTtcclxuICAgICAgICAgIGlmIChjdHguZm9ybS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmaWVsZHNldC5hamF4OmVxKDApJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gTW92ZSBmb2N1cyB0byB0aGUgZXJyb3JzIGFwcGVhcmVkIG9uIHRoZSBwYWdlIChpZiB0aGVyZSBhcmUpOlxyXG4gICAgICAgIHZhciB2YWxpZGF0aW9uU3VtbWFyeSA9IGpiLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRpb25TdW1tYXJ5Lmxlbmd0aClcclxuICAgICAgICAgIG1vdmVGb2N1c1RvKHZhbGlkYXRpb25TdW1tYXJ5KTtcclxuICAgICAgICAvLyBUT0RPOiBJdCBzZWVtcyB0aGF0IGl0IHJldHVybnMgYSBkb2N1bWVudC1mcmFnbWVudCBpbnN0ZWFkIG9mIGEgZWxlbWVudCBhbHJlYWR5IGluIGRvY3VtZW50XHJcbiAgICAgICAgLy8gZm9yIGN0eC5mb3JtIChtYXliZSBqYiB0b28/KSB3aGVuIHVzaW5nICogY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JyAqIFxyXG4gICAgICAgIC8vIChtYXliZSBvbiBvdGhlciBjYXNlcyB0b28/KS5cclxuICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIFtqYiwgY3R4LmZvcm0sIGp4XSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgbWVzc2FnZSwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCBjdHguZm9ybS5kYXRhKCdzdWNjZXNzLXBvc3QtbWVzc2FnZScpIHx8ICdEb25lISc7XHJcbiAgICBjdHguYm94LmJsb2NrKGluZm9CbG9jayhtZXNzYWdlLCB7XHJcbiAgICAgICAgY3NzOiBwb3B1cC5zdHlsZShwb3B1cC5zaXplKCdzbWFsbCcpKVxyXG4gICAgfSkpXHJcbiAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgXHJcbiAgICB9KTtcclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gc2hvd09rR29Qb3B1cChjdHgsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdiBjbGFzcz1cIm9rLWdvLWJveFwiLz4nKTtcclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxzcGFuIGNsYXNzPVwic3VjY2Vzcy1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLlN1Y2Nlc3NNZXNzYWdlKSk7XHJcbiAgICBpZiAoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSlcclxuICAgICAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWRkaXRpb25hbC1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKSk7XHJcblxyXG4gICAgdmFyIG9rQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gb2stYWN0aW9uIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjb2tcIi8+JykuYXBwZW5kKGRhdGEuT2tMYWJlbCk7XHJcbiAgICB2YXIgZ29CdG4gPSAnJztcclxuICAgIGlmIChkYXRhLkdvVVJMICYmIGRhdGEuR29MYWJlbCkge1xyXG4gICAgICAgIGdvQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gZ28tYWN0aW9uXCIvPicpLmF0dHIoJ2hyZWYnLCBkYXRhLkdvVVJMKS5hcHBlbmQoZGF0YS5Hb0xhYmVsKTtcclxuICAgICAgICAvLyBGb3JjaW5nIHRoZSAnY2xvc2UtYWN0aW9uJyBpbiBzdWNoIGEgd2F5IHRoYXQgZm9yIGludGVybmFsIGxpbmtzIHRoZSBwb3B1cCBnZXRzIGNsb3NlZCBpbiBhIHNhZmUgd2F5OlxyXG4gICAgICAgIGdvQnRuLmNsaWNrKGZ1bmN0aW9uICgpIHsgb2tCdG4uY2xpY2soKTsgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFjdGlvbnMgY2xlYXJmaXhcIi8+JykuYXBwZW5kKG9rQnRuKS5hcHBlbmQoZ29CdG4pKTtcclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGN0eC5ib3gsIG51bGwsIHtcclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpIHtcclxuICAgIC8vIElmIGlzIGEgSlNPTiByZXN1bHQ6XHJcbiAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBpZiAoY3R4ICYmIGN0eC5ib3gpXHJcbiAgICAgICAgICAgIC8vIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzXHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGN0eC5ib3gpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAwOiBnZW5lcmFsIHN1Y2Nlc3MgY29kZSwgc2hvdyBtZXNzYWdlIHNheWluZyB0aGF0ICdhbGwgd2FzIGZpbmUnXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LCBkYXRhKTtcclxuICAgICAgICAgICAgaWYgKGN0eCAmJiBjdHguZm9ybSAmJiBjdHguZm9ybS50cmlnZ2VyKVxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAxOiBkbyBhIHJlZGlyZWN0XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMSkge1xyXG4gICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAyOiBzaG93IGxvZ2luIHBvcHVwICh3aXRoIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIGlmIChjdHggJiYgY3R4LmJsb2NrICYmIGN0eC5ib3gudW5ibG9jaylcclxuICAgICAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAzKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAzOiByZWxvYWQgY3VycmVudCBwYWdlIGNvbnRlbnQgdG8gdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgLy8gTm90ZTogdG8gcmVsb2FkIHNhbWUgdXJsIHBhZ2UgY29udGVudCwgaXMgYmV0dGVyIHJldHVybiB0aGUgaHRtbCBkaXJlY3RseSBmcm9tXHJcbiAgICAgICAgICAgIC8vIHRoaXMgYWpheCBzZXJ2ZXIgcmVxdWVzdC5cclxuICAgICAgICAgICAgLy9jb250YWluZXIudW5ibG9jaygpOyBpcyBibG9ja2VkIGFuZCB1bmJsb2NrZWQgYWdhaW4gYnkgdGhlIHJlbG9hZCBtZXRob2Q6XHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKGN0eCAmJiBjdHguYm94ICYmIGN0eC5ib3gucmVsb2FkKVxyXG4gICAgICAgICAgICAgICAgY3R4LmJveC5yZWxvYWQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDQpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyBTdWNjZXNzTWVzc2FnZSwgYXR0YWNoaW5nIGFuZCBldmVudCBoYW5kbGVyIHRvIGdvIHRvIFJlZGlyZWN0VVJMXHJcbiAgICAgICAgICAgIGN0eC5ib3gub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0LlJlZGlyZWN0VVJMKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LlN1Y2Nlc3NNZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA1KSB7XHJcbiAgICAgICAgICAgIC8vIENoYW5nZSBtYWluLWFjdGlvbiBidXR0b24gbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIGJ0biA9IGN0eC5mb3JtLmZpbmQoJy5tYWluLWFjdGlvbicpO1xyXG4gICAgICAgICAgICB2YXIgZG1zZyA9IGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKTtcclxuICAgICAgICAgICAgaWYgKCFkbXNnKVxyXG4gICAgICAgICAgICAgICAgYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcsIGJ0bi50ZXh0KCkpO1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZGF0YS5SZXN1bHQgfHwgYnRuLmRhdGEoJ3N1Y2Nlc3MtcG9zdC10ZXh0JykgfHwgJ0RvbmUhJztcclxuICAgICAgICAgICAgYnRuLnRleHQobXNnKTtcclxuICAgICAgICAgICAgLy8gQWRkaW5nIHN1cHBvcnQgdG8gcmVzZXQgYnV0dG9uIHRleHQgdG8gZGVmYXVsdCBvbmVcclxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgRmlyc3QgbmV4dCBjaGFuZ2VzIGhhcHBlbnMgb24gdGhlIGZvcm06XHJcbiAgICAgICAgICAgICQoY3R4LmZvcm0pLm9uZSgnbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGJ0bi50ZXh0KGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IGZvciBjdXN0b20gaGFuZGxlcnNcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBPay1HbyBhY3Rpb25zIHBvcHVwIHdpdGggJ3N1Y2Nlc3MnIGFuZCAnYWRkaXRpb25hbCcgbWVzc2FnZXMuXHJcbiAgICAgICAgICAgIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDcpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDc6IHNob3cgbWVzc2FnZSBzYXlpbmcgY29udGFpbmVkIGF0IGRhdGEuUmVzdWx0Lk1lc3NhZ2UuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgY29kZSBhbGxvdyBhdHRhY2ggYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpbiBkYXRhLlJlc3VsdCB0byBkaXN0aW5ndWlzaFxyXG4gICAgICAgICAgICAvLyBkaWZmZXJlbnQgcmVzdWx0cyBhbGwgc2hvd2luZyBhIG1lc3NhZ2UgYnV0IG1heWJlIG5vdCBiZWluZyBhIHN1Y2Nlc3MgYXQgYWxsXHJcbiAgICAgICAgICAgIC8vIGFuZCBtYXliZSBkb2luZyBzb21ldGhpbmcgbW9yZSBpbiB0aGUgdHJpZ2dlcmVkIGV2ZW50IHdpdGggdGhlIGRhdGEgb2JqZWN0LlxyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5NZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gOCkge1xyXG4gICAgICAgICAgICAvLyBTaG93IHZhbGlkYXRpb24gbWVzc2FnZXNcclxuICAgICAgICAgICAgdmFyIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKTtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbkhlbHBlci5zZXRFcnJvcnMoY3R4LmZvcm0sIGRhdGEuUmVzdWx0LkVycm9ycyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPiAxMDApIHtcclxuICAgICAgICAgICAgLy8gVXNlciBDb2RlOiB0cmlnZ2VyIGN1c3RvbSBldmVudCB0byBtYW5hZ2UgcmVzdWx0czpcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4LCBjdHhdKTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBkYXRhLkNvZGUgPCAwXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGFuIGVycm9yIGNvZGUuXHJcblxyXG4gICAgICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgICAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKGN0eC5mb3JtLmdldCgwKSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgICAgICAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gXCJFcnJvcjogXCIgKyBkYXRhLkNvZGUgKyBcIjogXCIgKyBKU09OLnN0cmluZ2lmeShkYXRhLlJlc3VsdCA/IChkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgPyBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgOiBkYXRhLlJlc3VsdCkgOiAnJyk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJCgnPGRpdi8+JykuYXBwZW5kKG1lc3NhZ2UpLCBjdHguYm94LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlcnJvcjogbGNPbkVycm9yLFxyXG4gICAgICAgIHN1Y2Nlc3M6IGxjT25TdWNjZXNzLFxyXG4gICAgICAgIGNvbXBsZXRlOiBsY09uQ29tcGxldGUsXHJcbiAgICAgICAgZG9KU09OQWN0aW9uOiBkb0pTT05BY3Rpb25cclxuICAgIH07XHJcbn0iLCIvKiBGb3JtcyBzdWJtaXR0ZWQgdmlhIEFKQVggKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICAgIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGdldFhQYXRoID0gcmVxdWlyZSgnLi9nZXRYUGF0aCcpO1xyXG5cclxualF1ZXJ5ID0gJDtcclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5ncywgd2lsbCBiZSB1cGRhdGVkIG9uIGluaXQgYnV0IGlzIGFjY2Vzc2VkXHJcbi8vIHRocm91Z2ggY2xvc3VyZSBmcm9tIGFsbCBmdW5jdGlvbnMuXHJcbi8vIE5PVEU6IGlzIHN0YXRpYywgZG9lc24ndCBhbGxvd3MgbXVsdGlwbGUgY29uZmlndXJhdGlvbiwgb25lIGluaXQgY2FsbCByZXBsYWNlIHByZXZpb3VzXHJcbi8vIERlZmF1bHRzOlxyXG52YXIgc2V0dGluZ3MgPSB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IDAsXHJcbiAgICBlbGVtZW50OiBkb2N1bWVudFxyXG59O1xyXG5cclxuLy8gQWRhcHRlZCBjYWxsYmFja3NcclxuZnVuY3Rpb24gYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyKCkge1xyXG4gICAgY2FsbGJhY2tzLmNvbXBsZXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFqYXhFcnJvclBvcHVwSGFuZGxlcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0sIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIENvbW1vbiBsb2dpY1xyXG4gICAgY2FsbGJhY2tzLmVycm9yLmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIoKSB7XHJcbiAgY2FsbGJhY2tzLnN1Y2Nlc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuLyoqXHJcbiAgUGVyZm9ybXMgdGhlIHZhbGlkYXRpb24gb24gdGhlIGZvcm0gb3Igc3ViZm9ybSBhcyBkZXRlcm1pbmVcclxuICB0aGUgdmFsdWVzIGluIHRoZSBjb250ZXh0IChAY3R4KSwgcmV0dXJuaW5nIHRydWUgZm9yIHN1Y2Nlc3NcclxuICBhbmQgZmFsc2UgZm9yIHNvbWUgZXJyb3IgKGVsZW1lbnRzIGdldCBtYXJrZWQgd2l0aCB0aGUgZXJyb3IsXHJcbiAganVzdCB0aGUgY2FsbGVyIG11c3Qgc3RvcCBhbnkgdGFzayBvbiBmYWxzZSkuXHJcbioqL1xyXG5mdW5jdGlvbiB2YWxpZGF0ZUZvcm0oY3R4KSB7XHJcbiAgLy8gVmFsaWRhdGlvbnNcclxuICB2YXIgdmFsaWRhdGlvblBhc3NlZCA9IHRydWU7XHJcbiAgLy8gVG8gc3VwcG9ydCBzdWItZm9ybXMgdGhyb3VoIGZpZWxkc2V0LmFqYXgsIHdlIG11c3QgZXhlY3V0ZSB2YWxpZGF0aW9ucyBhbmQgdmVyaWZpY2F0aW9uXHJcbiAgLy8gaW4gdHdvIHN0ZXBzIGFuZCB1c2luZyB0aGUgcmVhbCBmb3JtIHRvIGxldCB2YWxpZGF0aW9uIG1lY2hhbmlzbSB3b3JrXHJcbiAgdmFyIGlzU3ViZm9ybSA9IGN0eC5mb3JtLmlzKCdmaWVsZHNldC5hamF4Jyk7XHJcbiAgdmFyIGFjdHVhbEZvcm0gPSBpc1N1YmZvcm0gPyBjdHguZm9ybS5jbG9zZXN0KCdmb3JtJykgOiBjdHguZm9ybSxcclxuICAgICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBuZXcgalF1ZXJ5KCksXHJcbiAgICAgIGRpc2FibGVkRmllbGRzID0gbmV3IGpRdWVyeSgpO1xyXG5cclxuICAvLyBPbiBzdWJmb3JtIHZhbGlkYXRpb24sIHdlIGRvbid0IHdhbnQgdGhlIG91dHNpZGUgc3ViZm9ybSBlbGVtZW50cyBhbmQgdmFsaWRhdGlvbi1zdW1tYXJ5IGNvbnRyb2xzIHRvIGJlIGFmZmVjdGVkXHJcbiAgLy8gYnkgdGhpcyB2YWxpZGF0aW9uICh0byBhdm9pZCB0byBzaG93IGVycm9ycyB0aGVyZSB0aGF0IGRvZXNuJ3QgaW50ZXJlc3QgdG8gdGhlIHJlc3Qgb2YgdGhlIGZvcm0pXHJcbiAgLy8gVG8gZnVsbGZpbGwgdGhpcyByZXF1aXNpdCwgd2UgbmVlZCB0byBoaWRlIGl0IGZvciB0aGUgdmFsaWRhdG9yIGZvciBhIHdoaWxlIGFuZCBsZXQgb25seSBhZmZlY3RcclxuICAvLyBhbnkgbG9jYWwgc3VtbWFyeSAoaW5zaWRlIHRoZSBzdWJmb3JtKS5cclxuICAvLyBUaGUgc2FtZSBmb3IgZm9ybSBlbGVtZW50cyBvdXRzaWRlIHRoZSBzdWJmb3JtLCB3ZSBkb24ndCB3YW50IGl0cyBlcnJvcnMgZm9yIG5vdy5cclxuICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICB2YXIgb3V0c2lkZUVsZW1lbnRzID0gKGZ1bmN0aW9uKGYpIHtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBPbmx5IHRob3NlIHRoYXQgYXJlIG91dHNpZGUgdGhlIHN1YmZvcm1cclxuICAgICAgICByZXR1cm4gISQuY29udGFpbnMoZiwgdGhpcyk7XHJcbiAgICAgIH07XHJcbiAgICB9KShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIGRpc2FibGVkU3VtbWFyaWVzID0gYWN0dWFsRm9ybVxyXG4gICAgLmZpbmQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJylcclxuICAgIC5maWx0ZXIob3V0c2lkZUVsZW1lbnRzKVxyXG4gICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgLy8gKGluIG90aGVyIHdvcmRzLCB1c2luZyAnZGF0YScgd2lsbCBub3Qgd29yaylcclxuICAgIC5hdHRyKCdkYXRhLXZhbG1zZy1zdW1tYXJ5JywgJ2ZhbHNlJyk7XHJcblxyXG4gICAgZGlzYWJsZWRGaWVsZHMgPSBhY3R1YWxGb3JtXHJcbiAgICAuZmluZCgnW2RhdGEtdmFsPXRydWVdJylcclxuICAgIC5maWx0ZXIob3V0c2lkZUVsZW1lbnRzKVxyXG4gICAgLmF0dHIoJ2RhdGEtdmFsJywgJ2ZhbHNlJyk7XHJcbiAgfVxyXG5cclxuICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICB2YXIgdmFsb2JqZWN0ID0gYWN0dWFsRm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycyhjdHguZm9ybSk7XHJcbiAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZS5cclxuICAvLyBDdXN0b20gdmFsaWRhdGlvbiBjYW4gYmUgYXR0YWNoZWQgdG8gZm9ybXMgb3IgZmllbGRzZXQsIGJ1dFxyXG4gIC8vIHRvIHN1cHBvcnQgc3ViZm9ybXMsIG9ubHkgZXhlY3V0ZSBpbiB0aGUgY3R4LmZvcm0gZWxlbWVudCAoY2FuIGJlIFxyXG4gIC8vIGEgZmllbHNldCBzdWJmb3JtKSBhbmQgYW55IGNoaWxkcmVuIGZpZWxkc2V0LlxyXG4gIGN0eC5mb3JtLmFkZChjdHguZm9ybS5maW5kKCdmaWVsZHNldCcpKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjdXN2YWwgPSAkKHRoaXMpLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgIGlmIChjdXN2YWwgJiYgY3VzdmFsLnZhbGlkYXRlICYmIGN1c3ZhbC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgICAgdmFsaWRhdGlvblBhc3NlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3Jtcywgd2UgbXVzdCBjaGVjayB0aGF0IHZhbGlkYXRpb25zIGVycm9ycyBoYXBwZW5lZCBpbnNpZGUgdGhlXHJcbiAgLy8gc3ViZm9ybSBhbmQgbm90IGluIG90aGVyIGVsZW1lbnRzLCB0byBkb24ndCBzdG9wIHN1Ym1pdCBvbiBub3QgcmVsYXRlZCBlcnJvcnMuXHJcbiAgLy8gKHdlIGF2b2lkIGV4ZWN1dGUgdmFsaWRhdGlvbiBvbiB0aGF0IGVsZW1lbnRzIGJ1dCBjb3VsZCBoYXBwZW4gYSBwcmV2aW91cyB2YWxpZGF0aW9uKVxyXG4gIC8vIEp1c3QgbG9vayBmb3IgbWFya2VkIGVsZW1lbnRzOlxyXG4gIGlmIChpc1N1YmZvcm0gJiYgY3R4LmZvcm0uZmluZCgnLmlucHV0LXZhbGlkYXRpb24tZXJyb3InKS5sZW5ndGgpXHJcbiAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcblxyXG4gIC8vIFJlLWVuYWJsZSBhZ2FpbiB0aGF0IHN1bW1hcmllcyBwcmV2aW91c2x5IGRpc2FibGVkXHJcbiAgaWYgKGlzU3ViZm9ybSkge1xyXG4gICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgLy8gKGluIG90aGVyIHdvcmRzLCB1c2luZyAnZGF0YScgd2lsbCBub3Qgd29yaylcclxuICAgIGRpc2FibGVkU3VtbWFyaWVzLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAndHJ1ZScpO1xyXG4gICAgZGlzYWJsZWRGaWVsZHMuYXR0cignZGF0YS12YWwnLCAndHJ1ZScpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHZhbGlkYXRpb25QYXNzZWQ7XHJcbn1cclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiogQWpheCBGb3JtcyBnZW5lcmljIGZ1bmN0aW9uLlxyXG4qIFJlc3VsdCBleHBlY3RlZCBpczpcclxuKiAtIGh0bWwsIGZvciB2YWxpZGF0aW9uIGVycm9ycyBmcm9tIHNlcnZlciwgcmVwbGFjaW5nIGN1cnJlbnQgLmFqYXgtYm94IGNvbnRlbnRcclxuKiAtIGpzb24sIHdpdGggc3RydWN0dXJlOiB7IENvZGU6IGludGVnZXItbnVtYmVyLCBSZXN1bHQ6IHN0cmluZy1vci1vYmplY3QgfVxyXG4qICAgQ29kZSBudW1iZXJzOlxyXG4qICAgIC0gTmVnYXRpdmU6IGVycm9ycywgd2l0aCBhIFJlc3VsdCBvYmplY3QgeyBFcnJvck1lc3NhZ2U6IHN0cmluZyB9XHJcbiogICAgLSBaZXJvOiBzdWNjZXNzIHJlc3VsdCwgaXQgc2hvd3MgYSBtZXNzYWdlIHdpdGggY29udGVudDogUmVzdWx0IHN0cmluZywgZWxzZSBmb3JtIGRhdGEgYXR0cmlidXRlICdzdWNjZXNzLXBvc3QtbWVzc2FnZScsIGVsc2UgYSBnZW5lcmljIG1lc3NhZ2VcclxuKiAgICAtIDE6IHN1Y2Nlc3MgcmVzdWx0LCBSZXN1bHQgY29udGFpbnMgYSBVUkwsIHRoZSBwYWdlIHdpbGwgYmUgcmVkaXJlY3RlZCB0byB0aGF0LlxyXG4qICAgIC0gTWFqb3IgMTogc3VjY2VzcyByZXN1bHQsIHdpdGggY3VzdG9tIGhhbmRsZXIgdGhyb3VnaHQgdGhlIGZvcm0gZXZlbnQgJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJy5cclxuKi9cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VibWl0SGFuZGxlcihldmVudCkge1xyXG4gICAgLy8gQ29udGV4dCB2YXIsIHVzZWQgYXMgYWpheCBjb250ZXh0OlxyXG4gICAgdmFyIGN0eCA9IHt9O1xyXG4gICAgLy8gRGVmYXVsdCBkYXRhIGZvciByZXF1aXJlZCBwYXJhbXM6XHJcbiAgICBjdHguZm9ybSA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5mb3JtIDogbnVsbCkgfHwgJCh0aGlzKTtcclxuICAgIGN0eC5ib3ggPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuYm94IDogbnVsbCkgfHwgY3R4LmZvcm0uY2xvc2VzdChcIi5hamF4LWJveFwiKTtcclxuICAgIHZhciBhY3Rpb24gPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuYWN0aW9uIDogbnVsbCkgfHwgY3R4LmZvcm0uYXR0cignYWN0aW9uJykgfHwgJyc7XHJcblxyXG4gICAgdmFyIHBvc3RWYWxpZGF0aW9uID0gY3R4LmZvcm0uZGF0YSgncG9zdC12YWxpZGF0aW9uJyk7XHJcbiAgICB2YXIgcmVxdWVzdHMgPSBjdHguZm9ybS5kYXRhKCd4aHItcmVxdWVzdHMnKSB8fCBbXTtcclxuICAgIGN0eC5mb3JtLmRhdGEoJ3hoci1yZXF1ZXN0cycsIHJlcXVlc3RzKTtcclxuXHJcbiAgICBpZiAoIXBvc3RWYWxpZGF0aW9uKSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgdmFsaWRhdGlvblxyXG4gICAgICAgIGlmICh2YWxpZGF0ZUZvcm0oY3R4KSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgLy8gVmFsaWRhdGlvbiBmYWlsZWQsIHN1Ym1pdCBjYW5ub3QgY29udGludWUsIG91dCFcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5jaGFuZ2VkRWxlbWVudHMgOiBudWxsKSB8fCBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBldmVudCB0byBhbGxvdyBzY3JpcHRzIHRvIGhvb2sgYWRkaXRpb25hbCB0YXNrcyBiZWZvcmUgc2VuZCBkYXRhXHJcbiAgICBjdHguZm9ybS50cmlnZ2VyKCdwcmVzdWJtaXQnLCBbY3R4XSk7XHJcblxyXG4gICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgIH0sIHNldHRpbmdzLmxvYWRpbmdEZWxheSk7XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICB2YXIgZGF0YSA9IGN0eC5mb3JtLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpO1xyXG5cclxuICAgIC8vIEFib3J0IHByZXZpb3VzIHJlcXVlc3RzXHJcbiAgICAkLmVhY2gocmVxdWVzdHMsIGZ1bmN0aW9uIChyZXEpIHtcclxuICAgICAgICBpZiAocmVxICYmIHJlcS5hYm9ydClcclxuICAgICAgICAgICAgcmVxLmFib3J0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBhY3Rpb24sXHJcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgY29udGV4dDogY3R4LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyLFxyXG4gICAgICAgIGVycm9yOiBhamF4RXJyb3JQb3B1cEhhbmRsZXIsXHJcbiAgICAgICAgY29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVnaXN0ZXIgcmVxdWVzdFxyXG4gICAgcmVxdWVzdHMucHVzaChyZXF1ZXN0KTtcclxuICAgIC8vIFNldCBhdXRvLWRlc3JlZ2lzdHJhdGlvblxyXG4gICAgdmFyIHJlcUluZGV4ID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcclxuICAgIHJlcXVlc3QuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBEZWxldGUsIG5vdCBzcGxpY2UsIHNpbmNlIHdlIG5lZWQgdG8gcHJlc2VydmUgdGhlIG9yZGVyXHJcbiAgICAgICAgZGVsZXRlIHJlcXVlc3RzW3JlcUluZGV4XTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvIHBvc3QgdmFsaWRhdGlvbjpcclxuICAgIGlmIChwb3N0VmFsaWRhdGlvbiAmJiBwb3N0VmFsaWRhdGlvbiAhPT0gJ25ldmVyJykge1xyXG4gICAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRlRm9ybShjdHgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0b3Agbm9ybWFsIFBPU1Q6XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgSXQgcGVyZm9ybXMgYSBwb3N0IHN1Ym1pdCBvbiB0aGUgZ2l2ZW4gZm9ybSBvbiBiYWNrZ3JvdW5kLFxyXG4gICAgd2l0aG91dCBub3RpZmljYXRpb25zIG9mIGFueSBraW5kLCBqdXN0IGZvciB0aGUgaW5zdGFudCBzYXZpbmcgZmVhdHVyZS5cclxuKiovXHJcbmZ1bmN0aW9uIGRvSW5zdGFudFNhdmluZyhmb3JtLCBjaGFuZ2VkRWxlbWVudHMpIHtcclxuICAgIGZvcm0gPSAkKGZvcm0pO1xyXG4gICAgdmFyIGFjdGlvbiA9IGZvcm0uYXR0cignYWN0aW9uJykgfHwgZm9ybS5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpIHx8ICcnO1xyXG4gICAgdmFyIGN0eCA9IHsgZm9ybTogZm9ybSwgYm94OiBmb3JtIH07XHJcblxyXG4gICAgLy8gTm90aWZpY2F0aW9uIGV2ZW50IHRvIGFsbG93IHNjcmlwdHMgdG8gaG9vayBhZGRpdGlvbmFsIHRhc2tzIGJlZm9yZSBzZW5kIGRhdGFcclxuICAgIGZvcm0udHJpZ2dlcigncHJlc3VibWl0JywgW2N0eF0pO1xyXG5cclxuICAgIHZhciBkYXRhID0gY3R4LmZvcm0uZmluZCgnOmlucHV0Jykuc2VyaWFsaXplKCk7XHJcblxyXG4gICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogYWN0aW9uLFxyXG4gICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFRyYWNrZWQgY2hhbmdlZCBlbGVtZW50cyBhcmUgc2F2ZWRcclxuICAgICAgICAgICAgaWYgKGNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uY2xvc2VzdCgnZm9ybScpLmdldCgwKSwgY2hhbmdlZEVsZW1lbnRzKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmVxdWVzdHMgPSBmb3JtLmRhdGEoJ3hoci1yZXF1ZXN0cycpIHx8IFtdO1xyXG4gICAgZm9ybS5kYXRhKCd4aHItcmVxdWVzdHMnLCByZXF1ZXN0cyk7XHJcblxyXG4gICAgLy8gUmVnaXN0ZXIgcmVxdWVzdFxyXG4gICAgcmVxdWVzdHMucHVzaChyZXF1ZXN0KTtcclxuICAgIC8vIFNldCBhdXRvLWRlc3JlZ2lzdHJhdGlvblxyXG4gICAgdmFyIHJlcUluZGV4ID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcclxuICAgIHJlcXVlc3QuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBEZWxldGUsIG5vdCBzcGxpY2UsIHNpbmNlIHdlIG5lZWQgdG8gcHJlc2VydmUgdGhlIG9yZGVyXHJcbiAgICAgICAgZGVsZXRlIHJlcXVlc3RzW3JlcUluZGV4XTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByZXF1ZXN0O1xyXG59XHJcblxyXG4vLyBQdWJsaWMgaW5pdGlhbGl6YXRpb25cclxuZnVuY3Rpb24gaW5pdEFqYXhGb3JtcyhvcHRpb25zKSB7XHJcbiAgICAkLmV4dGVuZCh0cnVlLCBzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgdG8gbWFuYWdlIGFqYXggZm9ybXMgKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ3N1Ym1pdCcsICdmb3JtLmFqYXgnLCBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKTtcclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIGZvciBhIHNwZWNpYWwgYWpheCBmb3JtIGNhc2U6IHN1YmZvcm1zLCB1c2luZyBmaWVsZHNldHMuICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdjbGljaycsICdmaWVsZHNldC5hamF4IC5hamF4LWZpZWxkc2V0LXN1Ym1pdCcsXHJcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG5cclxuICAgICAgICAgIGV2ZW50LmRhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm06IGZvcm0sXHJcbiAgICAgICAgICAgIGJveDogZm9ybS5jbG9zZXN0KCcuYWpheC1ib3gnKSxcclxuICAgICAgICAgICAgYWN0aW9uOiBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGNoYW5nZWRFbGVtZW50czogY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCksIGZvcm0uZmluZCgnOmlucHV0W25hbWVdJykpXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuLyogVU5VU0VEP1xyXG5mdW5jdGlvbiBhamF4Rm9ybU1lc3NhZ2VPbkh0bWxSZXR1cm5lZFdpdGhvdXRWYWxpZGF0aW9uRXJyb3JzKGZvcm0sIG1lc3NhZ2UpIHtcclxuICAgIHZhciAkdCA9ICQoZm9ybSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb3JtIGVycm9ycywgc2hvdyBhIHN1Y2Nlc3NmdWwgbWVzc2FnZVxyXG4gICAgaWYgKCR0LmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAkdC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgICAgICBjc3M6IHBvcHVwU3R5bGUocG9wdXBTaXplKCdzbWFsbCcpKVxyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkgeyAkdC51bmJsb2NrKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbiAgICB9XHJcbn1cclxuKi9cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBpbml0QWpheEZvcm1zLFxyXG4gICAgICAgIG9uU3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgb25FcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlcixcclxuICAgICAgICBkb0luc3RhbnRTYXZpbmc6IGRvSW5zdGFudFNhdmluZ1xyXG4gICAgfTtcclxuIiwiLyogQXV0byBjYWxjdWxhdGUgc3VtbWFyeSBvbiBET00gdGFnZ2luZyB3aXRoIGNsYXNzZXMgdGhlIGVsZW1lbnRzIGludm9sdmVkLlxyXG4gKi9cclxudmFyIG51ID0gcmVxdWlyZSgnLi9udW1iZXJVdGlscycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzKCkge1xyXG4gICAgJCgndGFibGUuY2FsY3VsYXRlLWl0ZW1zLXRvdGFscycpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmRhdGEoJ2NhbGN1bGF0ZS1pdGVtcy10b3RhbHMtaW5pdGlhbGl6YXRlZCcpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgZnVuY3Rpb24gY2FsY3VsYXRlUm93KCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgdHIgPSAkdC5jbG9zZXN0KCd0cicpO1xyXG4gICAgICAgICAgICB2YXIgaXAgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcHJpY2UnKTtcclxuICAgICAgICAgICAgdmFyIGlxID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXF1YW50aXR5Jyk7XHJcbiAgICAgICAgICAgIHZhciBpdCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbCcpO1xyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihudS5nZXRNb25leU51bWJlcihpcCkgKiBudS5nZXRNb25leU51bWJlcihpcSwgMSksIGl0KTtcclxuICAgICAgICAgICAgdHIudHJpZ2dlcignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkKHRoaXMpLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZSwgLmNhbGN1bGF0ZS1pdGVtLXF1YW50aXR5Jykub24oJ2NoYW5nZScsIGNhbGN1bGF0ZVJvdyk7XHJcbiAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmRhdGEoJ2NhbGN1bGF0ZS1pdGVtcy10b3RhbHMtaW5pdGlhbGl6YXRlZCcsIHRydWUpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldHVwQ2FsY3VsYXRlU3VtbWFyeShmb3JjZSkge1xyXG4gICAgJCgnLmNhbGN1bGF0ZS1zdW1tYXJ5JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGMgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICghZm9yY2UgJiYgYy5kYXRhKCdjYWxjdWxhdGUtc3VtbWFyeS1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB2YXIgcyA9IGMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnknKTtcclxuICAgICAgICB2YXIgZCA9IGMuZmluZCgndGFibGUuY2FsY3VsYXRlLXN1bW1hcnktZ3JvdXAnKTtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjKCkge1xyXG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwLCBmZWUgPSAwLCBkdXJhdGlvbiA9IDA7XHJcbiAgICAgICAgICAgIHZhciBncm91cHMgPSB7fTtcclxuICAgICAgICAgICAgZC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBncm91cFRvdGFsID0gMDtcclxuICAgICAgICAgICAgICAgIHZhciBhbGxDaGVja2VkID0gJCh0aGlzKS5pcygnLmNhbGN1bGF0ZS1hbGwtaXRlbXMnKTtcclxuICAgICAgICAgICAgICAgICQodGhpcykuZmluZCgndHInKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbSA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFsbENoZWNrZWQgfHwgaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tY2hlY2tlZCcpLmlzKCc6Y2hlY2tlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwVG90YWwgKz0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tdG90YWw6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxID0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHk6ZXEoMCknKSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZlZSArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1mZWU6ZXEoMCknKSkgKiBxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1kdXJhdGlvbjplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0b3RhbCArPSBncm91cFRvdGFsO1xyXG4gICAgICAgICAgICAgICAgZ3JvdXBzWyQodGhpcykuZGF0YSgnY2FsY3VsYXRpb24tc3VtbWFyeS1ncm91cCcpXSA9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cFRvdGFsLCAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0JykuZmluZCgnLmdyb3VwLXRvdGFsLXByaWNlJykpO1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZHVyYXRpb24sICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtZHVyYXRpb24nKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gU2V0IHN1bW1hcnkgdG90YWwgdmFsdWVcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIodG90YWwsIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktdG90YWwnKSk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGZlZSwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS1mZWUnKSk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBldmVyeSBncm91cCB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBmb3IgKHZhciBnIGluIGdyb3Vwcykge1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZ3JvdXBzW2ddLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwLScgKyBnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZC5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tY2hlY2tlZCcpLmNoYW5nZShjYWxjKTtcclxuICAgICAgICBkLm9uKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCBjYWxjKTtcclxuICAgICAgICBjYWxjKCk7XHJcbiAgICAgICAgYy5kYXRhKCdjYWxjdWxhdGUtc3VtbWFyeS1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIFVwZGF0ZSB0aGUgZGV0YWlsIG9mIGEgcHJpY2luZyBzdW1tYXJ5LCBvbmUgZGV0YWlsIGxpbmUgcGVyIHNlbGVjdGVkIGl0ZW1cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkoKSB7XHJcbiAgICAkKCcucHJpY2luZy1zdW1tYXJ5LmRldGFpbGVkJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgJGQgPSAkcy5maW5kKCd0Ym9keS5kZXRhaWwnKSxcclxuICAgICAgICAgICAgJHQgPSAkcy5maW5kKCd0Ym9keS5kZXRhaWwtdHBsJykuY2hpbGRyZW4oJ3RyOmVxKDApJyksXHJcbiAgICAgICAgICAgICRjID0gJHMuY2xvc2VzdCgnZm9ybScpLFxyXG4gICAgICAgICAgICAkaXRlbXMgPSAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0nKTtcclxuXHJcbiAgICAgICAgLy8gRG8gaXQhXHJcbiAgICAgICAgLy8gUmVtb3ZlIG9sZCBsaW5lc1xyXG4gICAgICAgICRkLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gQ3JlYXRlIG5ldyBvbmVzXHJcbiAgICAgICAgJGl0ZW1zLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBHZXQgdmFsdWVzXHJcbiAgICAgICAgICAgIHZhciAkaSA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBjaGVja2VkID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNoZWNrZWQnKS5wcm9wKCdjaGVja2VkJyk7XHJcbiAgICAgICAgICAgIGlmIChjaGVja2VkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29uY2VwdCA9ICRpLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1jb25jZXB0JykudGV4dCgpLFxyXG4gICAgICAgICAgICAgICAgICAgIHByaWNlID0gbnUuZ2V0TW9uZXlOdW1iZXIoJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLXByaWNlOmVxKDApJykpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHJvdyBhbmQgc2V0IHZhbHVlc1xyXG4gICAgICAgICAgICAgICAgdmFyICRyb3cgPSAkdC5jbG9uZSgpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2RldGFpbC10cGwnKVxyXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdkZXRhaWwnKTtcclxuICAgICAgICAgICAgICAgICRyb3cuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KGNvbmNlcHQpO1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIocHJpY2UsICRyb3cuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLXByaWNlJykpO1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRvIHRoZSB0YWJsZVxyXG4gICAgICAgICAgICAgICAgJGQuYXBwZW5kKCRyb3cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBzZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkoKSB7XHJcbiAgICB2YXIgJGMgPSAkKCcucHJpY2luZy1zdW1tYXJ5LmRldGFpbGVkJykuY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgLy8gSW5pdGlhbCBjYWxjdWxhdGlvblxyXG4gICAgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpO1xyXG4gICAgLy8gQ2FsY3VsYXRlIG9uIHJlbGV2YW50IGZvcm0gY2hhbmdlc1xyXG4gICAgJGMuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNoZWNrZWQnKS5jaGFuZ2UodXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbiAgICAvLyBTdXBwb3J0IGZvciBsY1NldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyBldmVudFxyXG4gICAgJGMub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkpO1xyXG59XHJcblxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb25UYWJsZUl0ZW1zOiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMsXHJcbiAgICAgICAgb25TdW1tYXJ5OiBzZXR1cENhbGN1bGF0ZVN1bW1hcnksXHJcbiAgICAgICAgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSxcclxuICAgICAgICBvbkRldGFpbGVkUHJpY2luZ1N1bW1hcnk6IHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeVxyXG4gICAgfTsiLCIvKiBGb2N1cyB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgZG9jdW1lbnQgKG9yIGluIEBjb250YWluZXIpXHJcbndpdGggdGhlIGh0bWw1IGF0dHJpYnV0ZSAnYXV0b2ZvY3VzJyAob3IgYWx0ZXJuYXRpdmUgQGNzc1NlbGVjdG9yKS5cclxuSXQncyBmaW5lIGFzIGEgcG9seWZpbGwgYW5kIGZvciBhamF4IGxvYWRlZCBjb250ZW50IHRoYXQgd2lsbCBub3RcclxuZ2V0IHRoZSBicm93c2VyIHN1cHBvcnQgb2YgdGhlIGF0dHJpYnV0ZS5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGF1dG9Gb2N1cyhjb250YWluZXIsIGNzc1NlbGVjdG9yKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCk7XHJcbiAgICBjb250YWluZXIuZmluZChjc3NTZWxlY3RvciB8fCAnW2F1dG9mb2N1c10nKS5mb2N1cygpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGF1dG9Gb2N1czsiLCIvKiogQXV0by1maWxsIG1lbnUgc3ViLWl0ZW1zIHVzaW5nIHRhYmJlZCBwYWdlcyAtb25seSB3b3JrcyBmb3IgY3VycmVudCBwYWdlIGl0ZW1zLSAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYXV0b2ZpbGxTdWJtZW51KCkge1xyXG4gICAgJCgnLmF1dG9maWxsLXN1Ym1lbnUgLmN1cnJlbnQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcGFyZW50bWVudSA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgc3VibWVudSBlbGVtZW50cyBmcm9tIHRhYnMgbWFya2VkIHdpdGggY2xhc3MgJ2F1dG9maWxsLXN1Ym1lbnUtaXRlbXMnXHJcbiAgICAgICAgdmFyIGl0ZW1zID0gJCgnLmF1dG9maWxsLXN1Ym1lbnUtaXRlbXMgbGk6bm90KC5yZW1vdmFibGUpJyk7XHJcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgaXRlbXMsIGNyZWF0ZSB0aGUgc3VibWVudSBjbG9uaW5nIGl0IVxyXG4gICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciBzdWJtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xyXG4gICAgICAgICAgICBwYXJlbnRtZW51LmFwcGVuZChzdWJtZW51KTtcclxuICAgICAgICAgICAgLy8gQ2xvbmluZyB3aXRob3V0IGV2ZW50czpcclxuICAgICAgICAgICAgdmFyIG5ld2l0ZW1zID0gaXRlbXMuY2xvbmUoZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgJChzdWJtZW51KS5hcHBlbmQobmV3aXRlbXMpO1xyXG5cclxuICAgICAgICAgICAgLy8gV2UgbmVlZCBhdHRhY2ggZXZlbnRzIHRvIG1haW50YWluIHRoZSB0YWJiZWQgaW50ZXJmYWNlIHdvcmtpbmdcclxuICAgICAgICAgICAgLy8gTmV3IEl0ZW1zIChjbG9uZWQpIG11c3QgY2hhbmdlIHRhYnM6XHJcbiAgICAgICAgICAgIG5ld2l0ZW1zLmZpbmQoXCJhXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgaW4gdGhlIG9yaWdpbmFsIGl0ZW1cclxuICAgICAgICAgICAgICAgICQoXCJhW2hyZWY9J1wiICsgdGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpICsgXCInXVwiLCBpdGVtcykuY2xpY2soKTtcclxuICAgICAgICAgICAgICAgIC8vIENoYW5nZSBtZW51OlxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKFwiYVwiKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICAgICAgLy8gU3RvcCBldmVudDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIE9yaWdpbmFsIGl0ZW1zIG11c3QgY2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgIGl0ZW1zLmZpbmQoXCJhXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG5ld2l0ZW1zLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50JykuXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIoXCIqW2hyZWY9J1wiICsgdGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpICsgXCInXVwiKS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuTWFuYWdlIGFsbCB0aGF0IGV2ZW50cyBhdHRhY2hlZCB0byBkYXRlcyBtYWRlIHVuYXZhaWxhYmxlIGJ5IHRoZSB1c2VyXHJcbnRvIG5vdGlmeSBhYm91dCB3aGF0IHRoYXQgbWVhbnMuXHJcblxyXG5NYWRlIGZvciB1c2UgaW4gdGhlIE1vbnRobHkgY2FsZW5kYXIsIG1heWJlIHJldXNhYmxlLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBvYmplY3RVdGlscyA9IHJlcXVpcmUoJy4vb2JqZWN0VXRpbHMnKTtcclxucmVxdWlyZShcImRhdGUtZm9ybWF0LWxpdGVcIik7XHJcblxyXG4vKipcclxuVGhlIEBlbGVtZW50IG11c3QgYmUgYSBkb20gZWxlbWVudCBjb250YWluaW5nIHRoYXQgd2lsbCBjb250YWluIHRoZSBpbmZvcm1hdGlvblxyXG5hbmQgd2lsbCB1c2UgYW4gdWwgZWxlbWVudCB0byBsaXN0IG5vdGlmaWNhdGlvbnMuIFRoZSBlbGVtZW50IHdpbGwgYmUgaGlkZGVuXHJcbmluaXRpYWxseSBhbmQgYW55IHRpbWUgdGhhdCwgb24gcmVuZGVyaW5nLCB0aGVyZSBhcmUgbm90IG5vdGlmaWNhdGlvbnMuXHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEJvb2tpbmdzTm90aWZpY2F0aW9uKGVsZW1lbnQpIHtcclxuXHJcbiAgdGhpcy4kZWwgPSAkKGVsZW1lbnQpO1xyXG4gIHRoaXMuJGxpc3QgPSB0aGlzLiRlbC5maW5kKCd1bCcpO1xyXG4gIGlmICghdGhpcy4kbGlzdC5sZW5ndGgpXHJcbiAgICB0aGlzLiRsaXN0ID0gJCgnPHVsLz4nKS5hcHBlbmRUbyh0aGlzLiRlbCk7XHJcblxyXG4gIHRoaXMucmVnaXN0ZXJlZCA9IHt9O1xyXG5cclxuICB0aGlzLnJlZ2lzdGVyID0gZnVuY3Rpb24gcmVnaXN0ZXIodG9nZ2xlLCBkYXRhLCBzdHJEYXRlKSB7XHJcbiAgICB2YXIgbCA9IHRoaXMucmVnaXN0ZXJlZDtcclxuICAgIGlmICh0b2dnbGUpIHtcclxuICAgICAgLy8gcmVnaXN0ZXIgKGlmIHNvbWV0aGluZylcclxuICAgICAgdmFyIGV2cyA9IGRhdGEuc2xvdHNbc3RyRGF0ZV0uZXZlbnRzSWRzO1xyXG4gICAgICBpZiAoZXZzKSB7XHJcbiAgICAgICAgbFtzdHJEYXRlXSA9IG9iamVjdFV0aWxzLmZpbHRlclByb3BlcnRpZXMoZGF0YS5ldmVudHMsIGZ1bmN0aW9uIChrKSB7IHJldHVybiBldnMuaW5kZXhPZihrKSAhPSAtMTsgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHVucmVnaXN0ZXJcclxuICAgICAgZGVsZXRlIGxbc3RyRGF0ZV07XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XHJcbiAgICAvLyBSZW5ldyB0aGUgbGlzdFxyXG4gICAgdGhpcy4kbGlzdC5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG5cclxuICAgIHZhciBoYXNOb3RpZmljYXRpb25zID0gZmFsc2U7XHJcblxyXG4gICAgZm9yICh2YXIgc3RyRGF0ZSBpbiB0aGlzLnJlZ2lzdGVyZWQpIHtcclxuICAgICAgaWYgKCF0aGlzLnJlZ2lzdGVyZWQuaGFzT3duUHJvcGVydHkoc3RyRGF0ZSkpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMucmVnaXN0ZXJlZFtzdHJEYXRlXTtcclxuICAgICAgdmFyIGRhdGUgPSBkYXRlSVNPLnBhcnNlKHN0ckRhdGUpLmZvcm1hdCgnRERERCwgTU1NIEQnKTtcclxuICAgICAgdmFyIG1zZyA9ICQoJzxzcGFuLz4nKS50ZXh0KGRhdGUgKyBcIjogXCIpLm91dGVySHRtbCgpO1xyXG5cclxuICAgICAgdmFyIGV2ZW50c0h0bWwgPSBbXTtcclxuICAgICAgZm9yICh2YXIgcCBpbiBldmVudHMpIHtcclxuICAgICAgICBpZiAoIWV2ZW50cy5oYXNPd25Qcm9wZXJ0eShwKSkgY29udGludWU7XHJcbiAgICAgICAgdmFyIGV2ID0gZXZlbnRzW3BdO1xyXG4gICAgICAgIHZhciBpdGVtID0gJCgnPGEgdGFyZ2V0PVwiX2JsYW5rXCIgLz4nKS5hdHRyKCdocmVmJywgZXYudXJsKS50ZXh0KGV2LnN1bW1hcnkgfHwgJ2Jvb2tpbmcnKTtcclxuICAgICAgICBldmVudHNIdG1sLnB1c2goaXRlbS5vdXRlckh0bWwoKSk7XHJcblxyXG4gICAgICAgIGhhc05vdGlmaWNhdGlvbnMgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIG1zZyArPSBldmVudHNIdG1sLmpvaW4oJywgJyk7XHJcblxyXG4gICAgICAkKCc8bGkvPicpXHJcbiAgICAgIC5odG1sKG1zZylcclxuICAgICAgLmFwcGVuZFRvKHRoaXMuJGxpc3QpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChoYXNOb3RpZmljYXRpb25zKVxyXG4gICAgICB0aGlzLiRlbC5zaG93KCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMuJGVsLmhpZGUoKTtcclxuXHJcbiAgfTtcclxufTsiLCIvKipcclxuICBNb250aGx5IGNhbGVuZGFyIGNsYXNzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIExjV2lkZ2V0ID0gcmVxdWlyZSgnLi4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuLi9DWC9leHRlbmQnKSxcclxuICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuICBvYmplY3RVdGlscyA9IHJlcXVpcmUoJy4vb2JqZWN0VXRpbHMnKSxcclxuICBCb29raW5nc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vQm9va2luZ3NOb3RpZmljYXRpb24nKTtcclxuXHJcbnZhciBldmVudHMgPSB7XHJcbiAgICBkYXRhQ2hhbmdlZDogJ2RhdGFDaGFuZ2VkJ1xyXG59O1xyXG5cclxuLyoqXHJcbiAgUHJpdmF0ZSB1dGlsc1xyXG4qKi9cclxuXHJcbi8qKlxyXG4gIFByZWZldGNoIG5leHQgbW9udGggKGJhc2VkIG9uIHRoZSBnaXZlbiBkYXRlcylcclxuICBOb3RlOiB0aGlzIGNvZGUgaXMgdmVyeSBzaW1pbGFyIHRvIHV0aWxzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2hcclxuKiovXHJcbmZ1bmN0aW9uIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGN1cnJlbnREYXRlc1JhbmdlKSB7XHJcbiAgLy8gV2UgZ2V0IHRoZSBuZXh0IG1vbnRoIGRhdGVzLXJhbmdlLCBidXRcclxuICAvLyB1c2luZyBhcyBiYXNlLWRhdGUgYSBkYXRlIGluc2lkZSBjdXJyZW50IGRpc3BsYXllZCBtb250aCwgdGhhdCBtb3N0IHRpbWVzIGlzXHJcbiAgLy8gbm90IHRoZSBtb250aCBvZiB0aGUgc3RhcnQgZGF0ZSBpbiBjdXJyZW50IGRhdGUsIHRoZW4ganVzdCBmb3J3YXJkIDcgZGF5cyB0aGF0XHJcbiAgLy8gdG8gZW5zdXJlIHdlIHBpY2sgdGhlIGNvcnJlY3QgbW9udGg6XHJcbiAgdmFyIG5leHREYXRlc1JhbmdlID0gdXRpbHMuZGF0ZS5uZXh0TW9udGhXZWVrcyh1dGlscy5kYXRlLmFkZERheXMoY3VycmVudERhdGVzUmFuZ2Uuc3RhcnQsIDcpLCAxLCBtb250aGx5LnNob3dTaXhXZWVrcyk7XHJcbiAgLy8gQXMgd2UgbG9hZCBmdWxsIHdlZWtzLCBtb3N0IHRpbWVzIHRoZSBmaXJzdCB3ZWVrIG9mIGEgbW9udGggaXMgYWxyZWFkeSBsb2FkZWQgYmVjYXVzZSBcclxuICAvLyB0aGUgd2VlayBpcyBzaGFyZWQgd2l0aCB0aGUgcHJldmlvdXMgbW9udGgsIHRoZW4ganVzdCBjaGVjayBpZiB0aGUgc3RhcnQgb2YgdGhlIG5ld1xyXG4gIC8vIHJhbmdlIGlzIGFscmVhZHkgaW4gY2FjaGUgYW5kIHNocmluayB0aGUgcmFuZ2UgdG8gYmUgcmVxdWVzdGVkLCBhdm9pZGluZyBjb25mbGljdCBvblxyXG4gIC8vIGxvYWRpbmcgdGhlIHVkcGF0ZWQgZGF0YSAoaWYgdGhhdCB3ZWVrIHdhcyBiZWluZyBlZGl0ZWQpIGFuZCBmYXN0ZXIgcmVxdWVzdCBsb2FkIHNpbmNlXHJcbiAgLy8gdGhlIHNlcnZlciBuZWVkcyB0byBkbyBsZXNzIGNvbXB1dGF0aW9uOlxyXG4gIHZhciBkID0gbmV4dERhdGVzUmFuZ2Uuc3RhcnQsXHJcbiAgICBzdHJlbmQgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXh0RGF0ZXNSYW5nZS5lbmQpLFxyXG4gICAgc3RyZCA9IGRhdGVJU08uZGF0ZUxvY2FsKGQsIHRydWUpO1xyXG4gIGlmIChtb250aGx5LmRhdGEgJiYgbW9udGhseS5kYXRhLnNsb3RzKVxyXG4gIHdoaWxlIChtb250aGx5LmRhdGEuc2xvdHNbc3RyZF0gJiZcclxuICAgIHN0cmQgPD0gc3RyZW5kKSB7XHJcbiAgICBuZXh0RGF0ZXNSYW5nZS5zdGFydCA9IGQgPSB1dGlscy5kYXRlLmFkZERheXMoZCwgMSk7XHJcbiAgICBzdHJkID0gZGF0ZUlTTy5kYXRlTG9jYWwoZCwgdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXV0aWxzLm1vbnRobHlJc0RhdGFJbkNhY2hlKG1vbnRobHksIG5leHREYXRlc1JhbmdlKSkge1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHZhciBwcmVmZXRjaFF1ZXJ5ID0gdXRpbHMuZGF0ZXNUb1F1ZXJ5KG5leHREYXRlc1JhbmdlKTtcclxuICAgIG1vbnRobHkuZmV0Y2hEYXRhKHByZWZldGNoUXVlcnksIG51bGwsIHRydWUpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbk1vdmUgdGhlIGJpbmRlZCBkYXRlcyB0aGUgYW1vdW50IG9mIEBtb250aHMgc3BlY2lmaWVkLlxyXG5Ob3RlOiBtb3N0IG9mIHRoaXMgY29kZSBpcyBhZGFwdGVkIGZyb20gdXRpbHMubW92ZUJpbmRSYW5nZUluRGF5cyxcclxudGhlIGNvbXBsZXhpdHkgY29tZXMgZnJvbSB0aGUgcHJlZmV0Y2ggZmVhdHVyZSwgbWF5YmUgY2FuIGJlIHRoYXQgbG9naWNcclxuaXNvbGF0ZWQgYW5kIHNoYXJlZD9cclxuKiovXHJcbmZ1bmN0aW9uIG1vdmVCaW5kTW9udGgobW9udGhseSwgbW9udGhzKSB7XHJcbiAgLy8gV2UgZ2V0IHRoZSBuZXh0ICdtb250aHMnIChuZWdhdGl2ZSBmb3IgcHJldmlvdXMpIGRhdGVzLXJhbmdlLCBidXRcclxuICAvLyB1c2luZyBhcyBiYXNlLWRhdGUgYSBkYXRlIGluc2lkZSBjdXJyZW50IGRpc3BsYXllZCBtb250aCwgdGhhdCBtb3N0IHRpbWVzIGlzXHJcbiAgLy8gbm90IHRoZSBtb250aCBvZiB0aGUgc3RhcnQgZGF0ZSBpbiBjdXJyZW50IGRhdGUsIHRoZW4ganVzdCBmb3J3YXJkIDcgZGF5cyB0aGF0XHJcbiAgLy8gdG8gZW5zdXJlIHdlIHBpY2sgdGhlIGNvcnJlY3QgbW9udGg6XHJcbiAgdmFyIGRhdGVzUmFuZ2UgPSB1dGlscy5kYXRlLm5leHRNb250aFdlZWtzKHV0aWxzLmRhdGUuYWRkRGF5cyhtb250aGx5LmRhdGVzUmFuZ2Uuc3RhcnQsIDcpLCBtb250aHMsIG1vbnRobHkuc2hvd1NpeFdlZWtzKTtcclxuXHJcbiAgLy8gQ2hlY2sgY2FjaGUgYmVmb3JlIHRyeSB0byBmZXRjaFxyXG4gIHZhciBpbkNhY2hlID0gdXRpbHMubW9udGhseUlzRGF0YUluQ2FjaGUobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcblxyXG4gIGlmIChpbkNhY2hlKSB7XHJcbiAgICAvLyBKdXN0IHNob3cgdGhlIGRhdGFcclxuICAgIG1vbnRobHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAvLyBQcmVmZXRjaCBleGNlcHQgaWYgdGhlcmUgaXMgb3RoZXIgcmVxdWVzdCBpbiBjb3Vyc2UgKGNhbiBiZSB0aGUgc2FtZSBwcmVmZXRjaCxcclxuICAgIC8vIGJ1dCBzdGlsbCBkb24ndCBvdmVybG9hZCB0aGUgc2VydmVyKVxyXG4gICAgaWYgKG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgbW9udGhseUNoZWNrQW5kUHJlZmV0Y2gobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcbiAgfSBlbHNlIHtcclxuXHJcbiAgICAvLyBTdXBwb3J0IGZvciBwcmVmZXRjaGluZzpcclxuICAgIC8vIEl0cyBhdm9pZGVkIGlmIHRoZXJlIGFyZSByZXF1ZXN0cyBpbiBjb3Vyc2UsIHNpbmNlXHJcbiAgICAvLyB0aGF0IHdpbGwgYmUgYSBwcmVmZXRjaCBmb3IgdGhlIHNhbWUgZGF0YS5cclxuICAgIGlmIChtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHtcclxuICAgICAgLy8gVGhlIGxhc3QgcmVxdWVzdCBpbiB0aGUgcG9vbCAqbXVzdCogYmUgdGhlIGxhc3QgaW4gZmluaXNoXHJcbiAgICAgIC8vIChtdXN0IGJlIG9ubHkgb25lIGlmIGFsbCBnb2VzIGZpbmUpOlxyXG4gICAgICB2YXIgcmVxdWVzdCA9IG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzW21vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgLy8gV2FpdCBmb3IgdGhlIGZldGNoIHRvIHBlcmZvcm0gYW5kIHNldHMgbG9hZGluZyB0byBub3RpZnkgdXNlclxyXG4gICAgICBtb250aGx5LiRlbC5hZGRDbGFzcyhtb250aGx5LmNsYXNzZXMuZmV0Y2hpbmcpO1xyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIG1vdmVCaW5kTW9udGgobW9udGhseSwgbW9udGhzKTtcclxuICAgICAgICBtb250aGx5LiRlbC5yZW1vdmVDbGFzcyhtb250aGx5LmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgbW9udGhseVxyXG4gICAgLmZldGNoRGF0YSh1dGlscy5kYXRlc1RvUXVlcnkoZGF0ZXNSYW5nZSkpXHJcbiAgICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIG1vbnRobHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAgIC8vIFByZWZldGNoXHJcbiAgICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LW1vbnRoIGFuZCBkaXNhYmxlIHByZXYgYnV0dG9uLFxyXG5vciByZW1vdmUgdGhlIG1hcmsgYW5kIGVuYWJsZSBpdCBpZiBpcyBub3QuXHJcblxyXG5VcGRhdGVzIHRoZSBtb250aCBsYWJlbCB0b28gYW5kIHRvZGF5IGJ1dHRvblxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50TW9udGgoJGVsLCBzdGFydERhdGUsIG1vbnRobHkpIHtcclxuICAvLyBFbnN1cmUgdGhlIGRhdGUgdG8gYmUgZnJvbSBjdXJyZW50IG1vbnRoIGFuZCBub3Qgb25lIG9mIHRoZSBsYXRlc3QgZGF0ZXNcclxuICAvLyBvZiB0aGUgcHJldmlvdXMgb25lICh3aGVyZSB0aGUgcmFuZ2Ugc3RhcnQpIGFkZGluZyA3IGRheXMgZm9yIHRoZSBjaGVjazpcclxuICB2YXIgbW9udGhEYXRlID0gdXRpbHMuZGF0ZS5hZGREYXlzKHN0YXJ0RGF0ZSwgNyk7XHJcbiAgdmFyIHllcCA9IHV0aWxzLmRhdGUuaXNJbkN1cnJlbnRNb250aChtb250aERhdGUpO1xyXG4gICRlbC50b2dnbGVDbGFzcyhtb250aGx5LmNsYXNzZXMuY3VycmVudFdlZWssIHllcCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLnByZXZBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxuXHJcbiAgLy8gTW9udGggLSBZZWFyXHJcbiAgdmFyIG1sYmwgPSBtb250aGx5LnRleHRzLm1vbnRoc1ttb250aERhdGUuZ2V0TW9udGgoKV0gKyAnICcgKyBtb250aERhdGUuZ2V0RnVsbFllYXIoKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMubW9udGhMYWJlbCkudGV4dChtbGJsKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMudG9kYXlBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxufVxyXG5cclxuLyoqXHJcbiAgVXBkYXRlIHRoZSBjYWxlbmRhciBkYXRlcyBjZWxscyBmb3IgJ2RheSBvZiB0aGUgbW9udGgnIHZhbHVlc1xyXG4gIGFuZCBudW1iZXIgb2Ygd2Vla3Mvcm93cy5cclxuICBAZGF0ZXNSYW5nZSB7IHN0YXJ0LCBlbmQgfVxyXG4gIEBzbG90c0NvbnRhaW5lciBqUXVlcnktRE9NIGZvciBkYXRlcy1jZWxscyB0Ym9keVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgb2ZmTW9udGhEYXRlQ2xhc3MsIGN1cnJlbnREYXRlQ2xhc3MsIHNsb3REYXRlTGFiZWwsIHNob3dTaXhXZWVrcykge1xyXG4gIHZhciBsYXN0WSxcclxuICAgIGN1cnJlbnRNb250aCA9IHV0aWxzLmRhdGUuYWRkRGF5cyhkYXRlc1JhbmdlLnN0YXJ0LCA3KS5nZXRNb250aCgpLFxyXG4gICAgdG9kYXkgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXcgRGF0ZSgpKTtcclxuXHJcbiAgaXRlcmF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIGZ1bmN0aW9uIChkYXRlLCB4LCB5KSB7XHJcbiAgICBsYXN0WSA9IHk7XHJcbiAgICB0aGlzLmZpbmQoJy4nICsgc2xvdERhdGVMYWJlbCkudGV4dChkYXRlLmdldERhdGUoKSk7XHJcblxyXG4gICAgLy8gTWFyayBkYXlzIG5vdCBpbiB0aGlzIG1vbnRoXHJcbiAgICB0aGlzLnRvZ2dsZUNsYXNzKG9mZk1vbnRoRGF0ZUNsYXNzLCBkYXRlLmdldE1vbnRoKCkgIT0gY3VycmVudE1vbnRoKTtcclxuXHJcbiAgICAvLyBNYXJrIHRvZGF5XHJcbiAgICB0aGlzLnRvZ2dsZUNsYXNzKGN1cnJlbnREYXRlQ2xhc3MsIGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUpID09IHRvZGF5KTtcclxuICB9KTtcclxuXHJcbiAgaWYgKCFzaG93U2l4V2Vla3MpIHtcclxuICAgIC8vIFNvbWUgbW9udGhzIGFyZSA1IHdlZWtzIHdpZGUgYW5kIG90aGVycyA2OyBvdXIgbGF5b3V0IGhhcyBwZXJtYW5lbnQgNiByb3dzL3dlZWtzXHJcbiAgICAvLyBhbmQgd2UgZG9uJ3QgbG9vayB1cCB0aGUgNnRoIHdlZWsgaWYgaXMgbm90IHBhcnQgb2YgdGhlIG1vbnRoIHRoZW4gdGhhdCA2dGggcm93XHJcbiAgICAvLyBtdXN0IGJlIGhpZGRlbiBpZiB0aGVyZSBhcmUgb25seSA1LlxyXG4gICAgLy8gSWYgdGhlIGxhc3Qgcm93IHdhcyB0aGUgNSAoaW5kZXggNCwgemVyby1iYXNlZCksIHRoZSA2dGggaXMgaGlkZGVuOlxyXG4gICAgc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJ3RyOmVxKDUpJykueHRvZ2dsZShsYXN0WSAhPSA0LCB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAwIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAgSXQgZXhlY3V0ZXMgdGhlIGdpdmVuIGNhbGxiYWNrIChAZWFjaENlbGxDYWxsYmFjaykgZm9yIFxyXG4gIGVhY2ggY2VsbCAodGhpcyBpbnNpZGUgdGhlIGNhbGxiYWNrKSBpdGVyYXRlZCBiZXR3ZWVuIHRoZSBAZGF0ZXNSYW5nZVxyXG4gIGluc2lkZSB0aGUgQHNsb3RzQ29udGFpbmVyIChhIHRib2R5IG9yIHRhYmxlIHdpdGggdHItdGQgZGF0ZSBjZWxscylcclxuKiovXHJcbmZ1bmN0aW9uIGl0ZXJhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBlYWNoQ2VsbENhbGxiYWNrKSB7XHJcbiAgdmFyIHgsIHksIGRhdGVDZWxsO1xyXG4gIC8vIEl0ZXJhdGUgZGF0ZXNcclxuICB1dGlscy5kYXRlLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIC8vIGRhdGVzIGFyZSBzb3J0ZWQgYXMgNyBwZXIgcm93IChlYWNoIHdlZWstZGF5KSxcclxuICAgIC8vIGJ1dCByZW1lbWJlciB0aGF0IGRheS1jZWxsIHBvc2l0aW9uIGlzIG9mZnNldCAxIGJlY2F1c2VcclxuICAgIC8vIGVhY2ggcm93IGlzIDggY2VsbHMgKGZpcnN0IGlzIGhlYWRlciBhbmQgcmVzdCA3IGFyZSB0aGUgZGF0YS1jZWxscyBmb3IgZGF0ZXMpXHJcbiAgICAvLyBqdXN0IGxvb2tpbmcgb25seSAndGQncyB3ZSBjYW4gdXNlIHRoZSBwb3NpdGlvbiB3aXRob3V0IG9mZnNldFxyXG4gICAgeCA9IChpICUgNyk7XHJcbiAgICB5ID0gTWF0aC5mbG9vcihpIC8gNyk7XHJcbiAgICBkYXRlQ2VsbCA9IHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCd0cjplcSgnICsgeSArICcpJykuY2hpbGRyZW4oJ3RkOmVxKCcgKyB4ICsgJyknKTtcclxuXHJcbiAgICBlYWNoQ2VsbENhbGxiYWNrLmFwcGx5KGRhdGVDZWxsLCBbZGF0ZSwgeCwgeSwgaV0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICBUb2dnbGUgYSBzZWxlY3RlZCBkYXRlLWNlbGwgYXZhaWxhYmlsaXR5LFxyXG4gIGZvciB0aGUgJ2VkaXRhYmxlJyBtb2RlXHJcbioqL1xyXG5mdW5jdGlvbiB0b2dnbGVEYXRlQXZhaWxhYmlsaXR5KG1vbnRobHksIGNlbGwpIHtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBkYXRhLCBqdXN0IHJldHVybiAoZGF0YSBub3QgbG9hZGVkKVxyXG4gIGlmICghbW9udGhseS5kYXRhIHx8ICFtb250aGx5LmRhdGEuc2xvdHMpIHJldHVybjtcclxuICBcclxuICAvLyBHZXR0aW5nIHRoZSBwb3NpdGlvbiBvZiB0aGUgY2VsbCBpbiB0aGUgbWF0cml4IGZvciBkYXRlLXNsb3RzOlxyXG4gIHZhciB0ciA9IGNlbGwuY2xvc2VzdCgndHInKSxcclxuICAgIHggPSB0ci5maW5kKCd0ZCcpLmluZGV4KGNlbGwpLFxyXG4gICAgeSA9IHRyLmNsb3Nlc3QoJ3Rib2R5JykuZmluZCgndHInKS5pbmRleCh0ciksXHJcbiAgICBkYXlzT2Zmc2V0ID0geSAqIDcgKyB4O1xyXG5cclxuICAvLyBHZXR0aW5nIHRoZSBkYXRlIGZvciB0aGUgY2VsbCBiYXNlZCBvbiB0aGUgc2hvd2VkIGZpcnN0IGRhdGVcclxuICB2YXIgZGF0ZSA9IG1vbnRobHkuZGF0ZXNSYW5nZS5zdGFydDtcclxuICBkYXRlID0gdXRpbHMuZGF0ZS5hZGREYXlzKGRhdGUsIGRheXNPZmZzZXQpO1xyXG4gIHZhciBzdHJEYXRlID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcblxyXG4gIC8vIEdldCBhbmQgdXBkYXRlIGZyb20gdGhlIHVuZGVybGF5aW5nIGRhdGEsIFxyXG4gIC8vIHRoZSBzdGF0dXMgZm9yIHRoZSBkYXRlLCB0b2dnbGluZyBpdDpcclxuICB2YXIgc2xvdCA9IG1vbnRobHkuZGF0YS5zbG90c1tzdHJEYXRlXTtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBzbG90LCBqdXN0IHJldHVybiAoZGF0YSBub3QgbG9hZGVkKVxyXG4gIGlmICghc2xvdCkgcmV0dXJuO1xyXG4gIHNsb3Quc3RhdHVzID0gc2xvdC5zdGF0dXMgPT0gJ3VuYXZhaWxhYmxlJyA/ICdhdmFpbGFibGUnIDogJ3VuYXZhaWxhYmxlJztcclxuICBzbG90LnNvdXJjZSA9ICd1c2VyJztcclxuICBtb250aGx5LmJvb2tpbmdzTm90aWZpY2F0aW9uLnJlZ2lzdGVyKHNsb3Quc3RhdHVzID09ICd1bmF2YWlsYWJsZScsIG1vbnRobHkuZGF0YSwgc3RyRGF0ZSk7XHJcbiAgbW9udGhseS5ldmVudHMuZW1pdChldmVudHMuZGF0YUNoYW5nZWQsIGNlbGwsIHNsb3QpO1xyXG5cclxuICAvLyBVcGRhdGUgdmlzdWFsaXphdGlvbjpcclxuICBtb250aGx5LmJpbmREYXRhKCk7XHJcbn1cclxuXHJcbi8qKlxyXG5Nb250bHkgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBNb250aGx5ID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseUNsYXNzZXMsIHtcclxuICB3ZWVrbHlDYWxlbmRhcjogdW5kZWZpbmVkLFxyXG4gIGN1cnJlbnRXZWVrOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudE1vbnRoOiAnaXMtY3VycmVudE1vbnRoJyxcclxuICBtb250aGx5Q2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci0tbW9udGhseScsXHJcbiAgdG9kYXlBY3Rpb246ICdBY3Rpb25zLXRvZGF5JyxcclxuICBtb250aExhYmVsOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbW9udGhMYWJlbCcsXHJcbiAgc2xvdERhdGVMYWJlbDogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXNsb3REYXRlTGFiZWwnLFxyXG4gIG9mZk1vbnRoRGF0ZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLW9mZk1vbnRoRGF0ZScsXHJcbiAgY3VycmVudERhdGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1jdXJyZW50RGF0ZScsXHJcbiAgZWRpdGFibGU6ICdpcy1lZGl0YWJsZScsXHJcbiAgYm9va2luZ3NOb3RpZmljYXRpb246ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1ib29raW5nc05vdGlmaWNhdGlvbidcclxufSksXHJcbnRleHRzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseVRleHRzLCB7XHJcbiAgbW9udGhzOiBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXVxyXG59KSxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuc2hvd1NpeFdlZWtzOiB0cnVlLFxyXG5lZGl0YWJsZTogZmFsc2UsXHJcblxyXG4vLyBPdXIgJ3ZpZXcnIHdpbGwgYmUgYSBzdWJzZXQgb2YgdGhlIGRhdGEsXHJcbi8vIGRlbGltaXRlZCBieSB0aGUgbmV4dCBwcm9wZXJ0eSwgYSBkYXRlcyByYW5nZTpcclxuZGF0ZXNSYW5nZTogeyBzdGFydDogbnVsbCwgZW5kOiBudWxsIH0sXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YU1vbnRobHkoZGF0ZXNSYW5nZSkge1xyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuc2xvdHMpIHJldHVybjtcclxuXHJcbiAgdGhpcy5kYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgfHwgdGhpcy5kYXRlc1JhbmdlO1xyXG4gIHZhciBcclxuICAgICAgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyksXHJcbiAgICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgY2hlY2tDdXJyZW50TW9udGgodGhpcy4kZWwsIGRhdGVzUmFuZ2Uuc3RhcnQsIHRoaXMpO1xyXG5cclxuICB1cGRhdGVEYXRlc0NlbGxzKHRoaXMuZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIHRoaXMuY2xhc3Nlcy5vZmZNb250aERhdGUsIHRoaXMuY2xhc3Nlcy5jdXJyZW50RGF0ZSwgdGhpcy5jbGFzc2VzLnNsb3REYXRlTGFiZWwsIHRoaXMuc2hvd1NpeFdlZWtzKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIC8vIFNldCBhdmFpbGFiaWxpdHkgb2YgZWFjaCBkYXRlIHNsb3QvY2VsbDpcclxuICBpdGVyYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgZnVuY3Rpb24gKGRhdGUsIHgsIHksIGkpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICB2YXIgc2xvdCA9IHRoYXQuZGF0YS5zbG90c1tkYXRla2V5XTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIHNpbXBsZSBhbmQgZGV0YWlsZWQgc3RhdHVzIGRlc2NyaXB0aW9uOlxyXG4gICAgdmFyIGRhdGVTdGF0dXMgPSAkLmlzUGxhaW5PYmplY3Qoc2xvdCkgPyBzbG90LnN0YXR1cyA6IHNsb3Q7XHJcbiAgICAvLyBEZWZhdWx0IHZhbHVlIGZyb20gZGF0YTpcclxuICAgIGRhdGVTdGF0dXMgPSBkYXRlU3RhdHVzIHx8IHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICd1bmtub3cnO1xyXG5cclxuICAgIGlmIChkYXRlU3RhdHVzKVxyXG4gICAgICB0aGlzLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgZGF0ZVN0YXR1cyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIE5vdGlmaWNhdGlvbnM6XHJcbiAgdGhpcy5ib29raW5nc05vdGlmaWNhdGlvbi5yZW5kZXIoKTtcclxufSxcclxuZ2V0VXBkYXRlZERhdGE6IGZ1bmN0aW9uIGdldFVwZGF0ZWREYXRhKCkge1xyXG4gIHZhciBkID0ge307XHJcbiAgaWYgKHRoaXMuZWRpdGFibGUpIHtcclxuICAgIC8vIENvcHkgZGF0YSwgd2UgZG9uJ3Qgd2FudCBjaGFuZ2UgdGhlIG9yaWdpbmFsOlxyXG4gICAgZXh0ZW5kKGQsIHRoaXMuZGF0YSk7XHJcblxyXG4gICAgLy8gRmlsdGVyIHNsb3RzIHRvIGdldCBvbmx5IHRoYXQgdXBkYXRlZCBieSBkZSB1c2VyOlxyXG4gICAgZC5zbG90cyA9IG9iamVjdFV0aWxzLmZpbHRlclByb3BlcnRpZXMoZC5zbG90cywgZnVuY3Rpb24gKGssIHYpIHtcclxuICAgICAgcmV0dXJuIHYuc291cmNlID09ICd1c2VyJztcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gZDtcclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gTW9udGhseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAvLyBJbml0aWFsaXppbmcgc29tZSBkYXRhLCBiZWluZyBjYXJlIG9mIGFueSB2YWx1ZVxyXG4gIC8vIHRoYXQgY29tZXMgZnJvbSBtZXJnaW5nIG9wdGlvbnMgaW50byAndGhpcydcclxuICB0aGlzLnVzZXIgPSB0aGlzLnVzZXIgfHwgdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG4gIHRoaXMucXVlcnkgPSBleHRlbmQoe1xyXG4gICAgdXNlcjogdGhpcy51c2VyLFxyXG4gICAgdHlwZTogJ21vbnRobHktc2NoZWR1bGUnXHJcbiAgfSwgdGhpcy5xdWVyeSk7XHJcblxyXG4gIC8vIElmIGlzIG5vdCBzZXQgYnkgY29uc3RydWN0b3Igb3B0aW9ucywgZ2V0IFxyXG4gIC8vICdlZGl0YWJsZScgZnJvbSBkYXRhLCBvciBsZWZ0IGRlZmF1bHQ6XHJcbiAgaWYgKCEob3B0aW9ucyAmJiB0eXBlb2YgKG9wdGlvbnMuZWRpdGFibGUpICE9ICd1bmRlZmluZWQnKSAmJlxyXG4gICAgdHlwZW9mICh0aGlzLiRlbC5kYXRhKCdlZGl0YWJsZScpKSAhPSAndW5kZWZpbmVkJylcclxuICAgIHRoaXMuZWRpdGFibGUgPSAhIXRoaXMuJGVsLmRhdGEoJ2VkaXRhYmxlJyk7XHJcblxyXG5cclxuICAvLyBTZXQgaGFuZGxlcnMgZm9yIHByZXYtbmV4dCBhY3Rpb25zOlxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5wcmV2QWN0aW9uLCBmdW5jdGlvbiBwcmV2KCkge1xyXG4gICAgbW92ZUJpbmRNb250aCh0aGF0LCAtMSk7XHJcbiAgfSk7XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLm5leHRBY3Rpb24sIGZ1bmN0aW9uIG5leHQoKSB7XHJcbiAgICBtb3ZlQmluZE1vbnRoKHRoYXQsIDEpO1xyXG4gIH0pO1xyXG4gIC8vIEhhbmRsZXIgZm9yIHRvZGF5IGFjdGlvblxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy50b2RheUFjdGlvbiwgZnVuY3Rpb24gdG9kYXkoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MobnVsbCwgdGhpcy5zaG93U2l4V2Vla3MpKTtcclxuICB9KTtcclxuXHJcbiAgLy8gRWRpdGFibGUgbW9kZVxyXG4gIGlmICh0aGlzLmVkaXRhYmxlKSB7XHJcbiAgICB0aGlzLnF1ZXJ5LmVkaXRhYmxlID0gdHJ1ZTtcclxuICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyArICcgdGQnLCBmdW5jdGlvbiBjbGlja1RvZ2dsZUF2YWlsYWJpbGl0eSgpIHtcclxuICAgICAgdG9nZ2xlRGF0ZUF2YWlsYWJpbGl0eSh0aGF0LCAkKHRoaXMpKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy4kZWwuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLmVkaXRhYmxlKTtcclxuICB9XHJcblxyXG4gIC8vIENyZWF0aW5nIHRoZSBib29raW5nc05vdGlmaWNhdGlvbiBlbGVtZW50LCBib3RoIGVkaXRhYmxlIGFuZCByZWFkLW9ubHkgbW9kZXMuXHJcbiAgLy8gUmVhZC1vbmx5IG1vZGUgbmVlZCBoaWRkZW4gdGhlIGVsZW1lbnQgYW5kIHRoYXRzIGRvbmUgb24gY29uc3RydWN0b3IgYW5kIGVkaXRhYmxlXHJcbiAgLy8gd2lsbCByZW5kZXIgaXQgb24gYmluZERhdGFcclxuICB0aGlzLmJvb2tpbmdzTm90aWZpY2F0aW9uID0gbmV3IEJvb2tpbmdzTm90aWZpY2F0aW9uKHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLmJvb2tpbmdzTm90aWZpY2F0aW9uKSk7XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgbW9udGhcclxuICB2YXIgZmlyc3REYXRlcyA9IHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MobnVsbCwgdGhpcy5zaG93U2l4V2Vla3MpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShmaXJzdERhdGVzKSkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKGZpcnN0RGF0ZXMpO1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCBtb250aCBpbiBhZHZhbmNlXHJcbiAgICBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaCh0aGF0LCBmaXJzdERhdGVzKTtcclxuICB9KTtcclxuXHJcbiAgY2hlY2tDdXJyZW50TW9udGgodGhpcy4kZWwsIGZpcnN0RGF0ZXMuc3RhcnQsIHRoaXMpO1xyXG5cclxuICAvLyBTaG93IGVycm9yIG1lc3NhZ2VcclxuICB0aGlzLmV2ZW50cy5vbignaGFzRXJyb3JDaGFuZ2VkJywgdXRpbHMuaGFuZGxlckNhbGVuZGFyRXJyb3IpO1xyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbk1vbnRobHkuZW5hYmxlQWxsID0gZnVuY3Rpb24gb24ob3B0aW9ucykge1xyXG4gIHZhciBsaXN0ID0gW107XHJcbiAgJCgnLicgKyBNb250aGx5LnByb3RvdHlwZS5jbGFzc2VzLm1vbnRobHlDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IE1vbnRobHkodGhpcywgb3B0aW9ucykpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBsaXN0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb250aGx5O1xyXG4iLCIvKipcclxuICBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgTGNXaWRnZXQgPSByZXF1aXJlKCcuLi9DWC9MY1dpZGdldCcpLFxyXG4gIGV4dGVuZCA9IHJlcXVpcmUoJy4uL0NYL2V4dGVuZCcpO1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcblxyXG4vKipcclxuV2Vla2x5IGNhbGVuZGFyLCBpbmhlcml0cyBmcm9tIExjV2lkZ2V0XHJcbioqL1xyXG52YXIgV2Vla2x5ID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiB1dGlscy53ZWVrbHlDbGFzc2VzLFxyXG50ZXh0czogdXRpbHMud2Vla2x5VGV4dHMsXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcblxyXG4vLyBPdXIgJ3ZpZXcnIHdpbGwgYmUgYSBzdWJzZXQgb2YgdGhlIGRhdGEsXHJcbi8vIGRlbGltaXRlZCBieSB0aGUgbmV4dCBwcm9wZXJ0eSwgYSBkYXRlcyByYW5nZTpcclxuZGF0ZXNSYW5nZTogeyBzdGFydDogbnVsbCwgZW5kOiBudWxsIH0sXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YVdlZWtseShkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5zbG90cykgcmV0dXJuO1xyXG5cclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICB1dGlscy5jaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBkYXRlc1JhbmdlLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgdXRpbHMudXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIHRoaXMuJGVsLCB0aGlzKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB1dGlscy5kYXRlLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICB2YXIgZGF0ZVNsb3RzID0gdGhhdC5kYXRhLnNsb3RzW2RhdGVrZXldO1xyXG4gICAgaWYgKGRhdGVTbG90cykge1xyXG4gICAgICBmb3IgKHMgPSAwOyBzIDwgZGF0ZVNsb3RzLmxlbmd0aDsgcysrKSB7XHJcbiAgICAgICAgdmFyIHNsb3QgPSBkYXRlU2xvdHNbc107XHJcbiAgICAgICAgdmFyIHNsb3RDZWxsID0gdXRpbHMuZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIGksIHNsb3QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkZWZhdWx0IHN0YXR1c1xyXG4gICAgICAgIHNsb3RDZWxsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ18nKTtcclxuICAgICAgICAvLyBBZGRpbmcgc3RhdHVzIGNsYXNzXHJcbiAgICAgICAgc2xvdENlbGwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBXZWVrbHkoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIC8vIFJldXNpbmcgYmFzZSBjb25zdHJ1Y3RvciB0b28gZm9yIGluaXRpYWxpemluZzpcclxuICBMY1dpZGdldC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIC8vIFRvIHVzZSB0aGlzIGluIGNsb3N1cmVzOlxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdGhpcy51c2VyID0gdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG4gIHRoaXMucXVlcnkgPSB7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnd2Vla2x5J1xyXG4gIH07XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgd2Vla1xyXG4gIHZhciBmaXJzdERhdGVzID0gdXRpbHMuZGF0ZS5jdXJyZW50V2VlaygpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShmaXJzdERhdGVzKSkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKGZpcnN0RGF0ZXMpO1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHV0aWxzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2godGhhdCwgZmlyc3REYXRlcyk7XHJcbiAgfSk7XHJcbiAgdXRpbHMuY2hlY2tDdXJyZW50V2Vlayh0aGlzLiRlbCwgZmlyc3REYXRlcy5zdGFydCwgdGhpcyk7XHJcblxyXG4gIC8vIFNldCBoYW5kbGVycyBmb3IgcHJldi1uZXh0IGFjdGlvbnM6XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnByZXZBY3Rpb24sIGZ1bmN0aW9uIHByZXYoKSB7XHJcbiAgICB1dGlscy5tb3ZlQmluZFJhbmdlSW5EYXlzKHRoYXQsIC03KTtcclxuICB9KTtcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMubmV4dEFjdGlvbiwgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgNyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFNob3cgZXJyb3IgbWVzc2FnZVxyXG4gIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCB1dGlscy5oYW5kbGVyQ2FsZW5kYXJFcnJvcik7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldlZWtseS5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdlZWtseS5wcm90b3R5cGUuY2xhc3Nlcy53ZWVrbHlDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdlZWtseSh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdlZWtseTtcclxuIiwiLyoqXHJcbiAgV29yayBIb3VycyBjYWxlbmRhciBjbGFzc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4uL0NYL0xjV2lkZ2V0JyksXHJcbiAgZXh0ZW5kID0gcmVxdWlyZSgnLi4vQ1gvZXh0ZW5kJyksXHJcbiAgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXHJcbiAgY2xlYXJDdXJyZW50U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9jbGVhckN1cnJlbnRTZWxlY3Rpb24nKSxcclxuICBtYWtlVW5zZWxlY3RhYmxlID0gcmVxdWlyZSgnLi9tYWtlVW5zZWxlY3RhYmxlJyk7XHJcbnJlcXVpcmUoJy4uL2pxdWVyeS5ib3VuZHMnKTtcclxudmFyIGV2ZW50cyA9IHtcclxuICAgIGRhdGFDaGFuZ2VkOiAnZGF0YUNoYW5nZWQnXHJcbn07XHJcblxyXG4vKipcclxuV29yayBob3VycyBwcml2YXRlIHV0aWxzXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cEVkaXRXb3JrSG91cnMoKSB7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIC8vIFNldCBoYW5kbGVycyB0byBzd2l0Y2ggc3RhdHVzIGFuZCB1cGRhdGUgYmFja2VuZCBkYXRhXHJcbiAgLy8gd2hlbiB0aGUgdXNlciBzZWxlY3QgY2VsbHNcclxuICB2YXIgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyk7XHJcblxyXG4gIGZ1bmN0aW9uIHRvZ2dsZUNlbGwoY2VsbCkge1xyXG4gICAgLy8gRmluZCBkYXkgYW5kIHRpbWUgb2YgdGhlIGNlbGw6XHJcbiAgICB2YXIgc2xvdCA9IHV0aWxzLmZpbmRTbG90QnlDZWxsKHNsb3RzQ29udGFpbmVyLCBjZWxsKTtcclxuICAgIC8vIEdldCB3ZWVrLWRheSBzbG90cyBhcnJheTpcclxuICAgIHZhciB3a3Nsb3RzID0gdGhhdC5kYXRhLnNsb3RzW3V0aWxzLnN5c3RlbVdlZWtEYXlzW3Nsb3QuZGF5XV0gPSB0aGF0LmRhdGEuc2xvdHNbdXRpbHMuc3lzdGVtV2Vla0RheXNbc2xvdC5kYXldXSB8fCBbXTtcclxuICAgIC8vIElmIGl0IGhhcyBhbHJlYWR5IHRoZSBkYXRhLnN0YXR1cywgdG9nZ2xlIHRvIHRoZSBkZWZhdWx0U3RhdHVzXHJcbiAgICAvLyAgdmFyIHN0YXR1c0NsYXNzID0gdGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzLFxyXG4gICAgLy8gICAgICBkZWZhdWx0U3RhdHVzQ2xhc3MgPSB0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzO1xyXG4gICAgLy9pZiAoY2VsbC5oYXNDbGFzcyhzdGF0dXNDbGFzc1xyXG4gICAgLy8gVG9nZ2xlIGZyb20gdGhlIGFycmF5XHJcbiAgICB2YXIgc3Ryc2xvdCA9IGRhdGVJU08udGltZUxvY2FsKHNsb3Quc2xvdCwgdHJ1ZSksXHJcbiAgICAgIGlzbG90ID0gd2tzbG90cy5pbmRleE9mKHN0cnNsb3QpO1xyXG4gICAgaWYgKGlzbG90ID09IC0xKVxyXG4gICAgICB3a3Nsb3RzLnB1c2goc3Ryc2xvdCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIC8vZGVsZXRlIHdrc2xvdHNbaXNsb3RdO1xyXG4gICAgICB3a3Nsb3RzLnNwbGljZShpc2xvdCwgMSk7XHJcblxyXG4gICAgdGhhdC5ldmVudHMuZW1pdChldmVudHMuZGF0YUNoYW5nZWQsIGNlbGwsIHNsb3QpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2VsbFJhbmdlKGZpcnN0Q2VsbCwgbGFzdENlbGwpIHtcclxuICAgIHZhciBcclxuICAgICAgeCA9IGZpcnN0Q2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgoZmlyc3RDZWxsKSxcclxuICAgICAgeTEgPSBmaXJzdENlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpLFxyXG4gICAgLy94MiA9IGxhc3RDZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChsYXN0Q2VsbCksXHJcbiAgICAgIHkyID0gbGFzdENlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpO1xyXG5cclxuICAgIGlmICh5MSA+IHkyKSB7XHJcbiAgICAgIHZhciB5MCA9IHkxO1xyXG4gICAgICB5MSA9IHkyO1xyXG4gICAgICB5MiA9IHkwO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIHkgPSB5MTsgeSA8PSB5MjsgeSsrKSB7XHJcbiAgICAgIHZhciBjZWxsID0gZmlyc3RDZWxsLmNsb3Nlc3QoJ3Rib2R5JykuY2hpbGRyZW4oJ3RyOmVxKCcgKyB5ICsgJyknKS5jaGlsZHJlbigndGQ6ZXEoJyArIHggKyAnKScpO1xyXG4gICAgICB0b2dnbGVDZWxsKGNlbGwpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdmFyIGRyYWdnaW5nID0ge1xyXG4gICAgZmlyc3Q6IG51bGwsXHJcbiAgICBsYXN0OiBudWxsLFxyXG4gICAgc2VsZWN0aW9uTGF5ZXI6ICQoJzxkaXYgY2xhc3M9XCJTZWxlY3Rpb25MYXllclwiIC8+JykuYXBwZW5kVG8odGhpcy4kZWwpLFxyXG4gICAgZG9uZTogZmFsc2VcclxuICB9O1xyXG4gIFxyXG4gIGZ1bmN0aW9uIG9mZnNldFRvUG9zaXRpb24oZWwsIG9mZnNldCkge1xyXG4gICAgdmFyIHBiID0gJChlbC5vZmZzZXRQYXJlbnQpLmJvdW5kcygpLFxyXG4gICAgICBzID0ge307XHJcblxyXG4gICAgcy50b3AgPSBvZmZzZXQudG9wIC0gcGIudG9wO1xyXG4gICAgcy5sZWZ0ID0gb2Zmc2V0LmxlZnQgLSBwYi5sZWZ0O1xyXG5cclxuICAgIC8vcy5ib3R0b20gPSBwYi50b3AgLSBvZmZzZXQuYm90dG9tO1xyXG4gICAgLy9zLnJpZ2h0ID0gb2Zmc2V0LmxlZnQgLSBvZmZzZXQucmlnaHQ7XHJcbiAgICBzLmhlaWdodCA9IG9mZnNldC5ib3R0b20gLSBvZmZzZXQudG9wO1xyXG4gICAgcy53aWR0aCA9IG9mZnNldC5yaWdodCAtIG9mZnNldC5sZWZ0O1xyXG5cclxuICAgICQoZWwpLmNzcyhzKTtcclxuICAgIHJldHVybiBzO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXBkYXRlU2VsZWN0aW9uKGVsKSB7XHJcbiAgICB2YXIgYSA9IGRyYWdnaW5nLmZpcnN0LmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICB2YXIgYiA9IGVsLmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICB2YXIgcyA9IGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcblxyXG4gICAgcy50b3AgPSBhLnRvcCA8IGIudG9wID8gYS50b3AgOiBiLnRvcDtcclxuICAgIHMuYm90dG9tID0gYS5ib3R0b20gPiBiLmJvdHRvbSA/IGEuYm90dG9tIDogYi5ib3R0b207XHJcblxyXG4gICAgb2Zmc2V0VG9Qb3NpdGlvbihkcmFnZ2luZy5zZWxlY3Rpb25MYXllclswXSwgcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmaW5pc2hEcmFnKCkge1xyXG4gICAgaWYgKGRyYWdnaW5nLmZpcnN0ICYmIGRyYWdnaW5nLmxhc3QpIHtcclxuICAgICAgdG9nZ2xlQ2VsbFJhbmdlKGRyYWdnaW5nLmZpcnN0LCBkcmFnZ2luZy5sYXN0KTtcclxuICAgICAgdGhhdC5iaW5kRGF0YSgpO1xyXG5cclxuICAgICAgZHJhZ2dpbmcuZG9uZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBkcmFnZ2luZy5maXJzdCA9IGRyYWdnaW5nLmxhc3QgPSBudWxsO1xyXG4gICAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuaGlkZSgpO1xyXG4gICAgbWFrZVVuc2VsZWN0YWJsZS5vZmYodGhhdC4kZWwpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICB0aGlzLiRlbC5maW5kKHNsb3RzQ29udGFpbmVyKS5vbignY2xpY2snLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBEbyBleGNlcHQgYWZ0ZXIgYSBkcmFnZ2luZyBkb25lIGNvbXBsZXRlXHJcbiAgICBpZiAoZHJhZ2dpbmcuZG9uZSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgdG9nZ2xlQ2VsbCgkKHRoaXMpKTtcclxuICAgIHRoYXQuYmluZERhdGEoKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbiAgdGhpcy4kZWwuZmluZChzbG90c0NvbnRhaW5lcilcclxuICAub24oJ21vdXNlZG93bicsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGRyYWdnaW5nLmRvbmUgPSBmYWxzZTtcclxuICAgIGRyYWdnaW5nLmZpcnN0ID0gJCh0aGlzKTtcclxuICAgIGRyYWdnaW5nLmxhc3QgPSBudWxsO1xyXG4gICAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuc2hvdygpO1xyXG5cclxuICAgIG1ha2VVbnNlbGVjdGFibGUodGhhdC4kZWwpO1xyXG4gICAgY2xlYXJDdXJyZW50U2VsZWN0aW9uKCk7XHJcblxyXG4gICAgdmFyIHMgPSBkcmFnZ2luZy5maXJzdC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgb2Zmc2V0VG9Qb3NpdGlvbihkcmFnZ2luZy5zZWxlY3Rpb25MYXllclswXSwgcyk7XHJcblxyXG4gIH0pXHJcbiAgLm9uKCdtb3VzZWVudGVyJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKGRyYWdnaW5nLmZpcnN0KSB7XHJcbiAgICAgIGRyYWdnaW5nLmxhc3QgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgdXBkYXRlU2VsZWN0aW9uKGRyYWdnaW5nLmxhc3QpO1xyXG4gICAgfVxyXG4gIH0pXHJcbiAgLm9uKCdtb3VzZXVwJywgZmluaXNoRHJhZylcclxuICAuZmluZCgndGQnKVxyXG4gIC5hdHRyKCdkcmFnZ2FibGUnLCBmYWxzZSk7XHJcblxyXG4gIC8vIFRoaXMgd2lsbCBub3Qgd29yayB3aXRoIHBvaW50ZXItZXZlbnRzOm5vbmUsIGJ1dCBvbiBvdGhlclxyXG4gIC8vIGNhc2VzIChyZWNlbnRJRSlcclxuICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5vbignbW91c2V1cCcsIGZpbmlzaERyYWcpXHJcbiAgLmF0dHIoJ2RyYWdnYWJsZScsIGZhbHNlKTtcclxuXHJcbn1cclxuXHJcbi8qKlxyXG5Xb3JrIGhvdXJzIGNhbGVuZGFyLCBpbmhlcml0cyBmcm9tIExjV2lkZ2V0XHJcbioqL1xyXG52YXIgV29ya0hvdXJzID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseUNsYXNzZXMsIHtcclxuICB3ZWVrbHlDYWxlbmRhcjogdW5kZWZpbmVkLFxyXG4gIHdvcmtIb3Vyc0NhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItLXdvcmtIb3VycydcclxufSksXHJcbnRleHRzOiB1dGlscy53ZWVrbHlUZXh0cyxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhV29ya0hvdXJzKCkge1xyXG4gIHZhciBcclxuICAgIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpLFxyXG4gICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgdXRpbHMuc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdXRpbHMuc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgLy8gU2V0IGFsbCBzbG90cyB3aXRoIGRlZmF1bHQgc3RhdHVzXHJcbiAgc2xvdHMuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cyk7XHJcblxyXG4gIGlmICghdGhpcy5kYXRhLnNsb3RzIHx8ICF0aGlzLmRhdGEuc3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgZm9yICh2YXIgd2sgPSAwOyB3ayA8IHV0aWxzLnN5c3RlbVdlZWtEYXlzLmxlbmd0aDsgd2srKykge1xyXG4gICAgdmFyIGRhdGVTbG90cyA9IHRoYXQuZGF0YS5zbG90c1t1dGlscy5zeXN0ZW1XZWVrRGF5c1t3a11dO1xyXG4gICAgaWYgKGRhdGVTbG90cyAmJiBkYXRlU2xvdHMubGVuZ3RoKSB7XHJcbiAgICAgIGZvciAocyA9IDA7IHMgPCBkYXRlU2xvdHMubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICB2YXIgc2xvdCA9IGRhdGVTbG90c1tzXTtcclxuICAgICAgICB2YXIgc2xvdENlbGwgPSB1dGlscy5maW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgd2ssIHNsb3QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkZWZhdWx0IHN0YXR1c1xyXG4gICAgICAgIHNsb3RDZWxsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ18nKTtcclxuICAgICAgICAvLyBBZGRpbmcgc3RhdHVzIGNsYXNzXHJcbiAgICAgICAgc2xvdENlbGwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gV29ya0hvdXJzKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICBMY1dpZGdldC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdGhpcy51c2VyID0gdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG5cclxuICB0aGlzLnF1ZXJ5ID0ge1xyXG4gICAgdXNlcjogdGhpcy51c2VyLFxyXG4gICAgdHlwZTogJ3dvcmtIb3VycydcclxuICB9O1xyXG5cclxuICAvLyBGZXRjaCB0aGUgZGF0YTogdGhlcmUgaXMgbm90IGEgbW9yZSBzcGVjaWZpYyBxdWVyeSxcclxuICAvLyBpdCBqdXN0IGdldCB0aGUgaG91cnMgZm9yIGVhY2ggd2Vlay1kYXkgKGRhdGFcclxuICAvLyBzbG90cyBhcmUgcGVyIHdlZWstZGF5IGluc3RlYWQgb2YgcGVyIGRhdGUgY29tcGFyZWRcclxuICAvLyB0byAqd2Vla2x5KilcclxuICB0aGlzLmZldGNoRGF0YSgpLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC5iaW5kRGF0YSgpO1xyXG4gIH0pO1xyXG5cclxuICBzZXR1cEVkaXRXb3JrSG91cnMuY2FsbCh0aGlzKTtcclxuXHJcbiAgLy8gU2hvdyBlcnJvciBtZXNzYWdlXHJcbiAgdGhpcy5ldmVudHMub24oJ2hhc0Vycm9yQ2hhbmdlZCcsIHV0aWxzLmhhbmRsZXJDYWxlbmRhckVycm9yKTtcclxuXHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXb3JraG91cnMgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuV29ya0hvdXJzLmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgV29ya0hvdXJzLnByb3RvdHlwZS5jbGFzc2VzLndvcmtIb3Vyc0NhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgV29ya0hvdXJzKHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV29ya0hvdXJzOyIsIi8qKlxyXG5Dcm9zcyBicm93c2VyIHdheSB0byB1bnNlbGVjdCBjdXJyZW50IHNlbGVjdGlvblxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjbGVhckN1cnJlbnRTZWxlY3Rpb24oKSB7XHJcbiAgaWYgKHR5cGVvZiAod2luZG93LmdldFNlbGVjdGlvbikgPT09ICdmdW5jdGlvbicpXHJcbiAgLy8gU3RhbmRhcmRcclxuICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5yZW1vdmVBbGxSYW5nZXMoKTtcclxuICBlbHNlIGlmIChkb2N1bWVudC5zZWxlY3Rpb24gJiYgdHlwZW9mIChkb2N1bWVudC5zZWxlY3Rpb24uZW1wdHkpID09PSAnZnVuY3Rpb24nKVxyXG4gIC8vIElFXHJcbiAgICBkb2N1bWVudC5zZWxlY3Rpb24uZW1wdHkoKTtcclxufTsiLCIvKipcclxuICBBIGNvbGxlY3Rpb24gb2YgdXNlZnVsIGdlbmVyaWMgdXRpbHMgbWFuYWdpbmcgRGF0ZXNcclxuKiovXHJcbnZhciBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKTtcclxuXHJcbmZ1bmN0aW9uIGN1cnJlbnRXZWVrKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZ2V0Rmlyc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKSxcclxuICAgIGVuZDogZ2V0TGFzdFdlZWtEYXRlKG5ldyBEYXRlKCkpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmN1cnJlbnRXZWVrID0gY3VycmVudFdlZWs7XHJcblxyXG5mdW5jdGlvbiBuZXh0V2VlayhzdGFydCwgZW5kKSB7XHJcbiAgLy8gVW5pcXVlIHBhcmFtIHdpdGggYm90aCBwcm9waWVydGllczpcclxuICBpZiAoc3RhcnQuZW5kKSB7XHJcbiAgICBlbmQgPSBzdGFydC5lbmQ7XHJcbiAgICBzdGFydCA9IHN0YXJ0LnN0YXJ0O1xyXG4gIH1cclxuICAvLyBPcHRpb25hbCBlbmQ6XHJcbiAgZW5kID0gZW5kIHx8IGFkZERheXMoc3RhcnQsIDcpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogYWRkRGF5cyhzdGFydCwgNyksXHJcbiAgICBlbmQ6IGFkZERheXMoZW5kLCA3KVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5uZXh0V2VlayA9IG5leHRXZWVrO1xyXG5cclxuZnVuY3Rpb24gZ2V0Rmlyc3RXZWVrRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgLSBkLmdldERheSgpKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldEZpcnN0V2Vla0RhdGUgPSBnZXRGaXJzdFdlZWtEYXRlO1xyXG5cclxuZnVuY3Rpb24gZ2V0TGFzdFdlZWtEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSArICg2IC0gZC5nZXREYXkoKSkpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0TGFzdFdlZWtEYXRlID0gZ2V0TGFzdFdlZWtEYXRlO1xyXG5cclxuZnVuY3Rpb24gaXNJbkN1cnJlbnRXZWVrKGRhdGUpIHtcclxuICByZXR1cm4gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RXZWVrRGF0ZShkYXRlKSkgPT0gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKSk7XHJcbn1cclxuZXhwb3J0cy5pc0luQ3VycmVudFdlZWsgPSBpc0luQ3VycmVudFdlZWs7XHJcblxyXG5mdW5jdGlvbiBhZGREYXlzKGRhdGUsIGRheXMpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGRheXMpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuYWRkRGF5cyA9IGFkZERheXM7XHJcblxyXG5mdW5jdGlvbiBlYWNoRGF0ZUluUmFuZ2Uoc3RhcnQsIGVuZCwgZm4pIHtcclxuICBpZiAoIWZuLmNhbGwpIHRocm93IG5ldyBFcnJvcignZm4gbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIFwiY2FsbFwiYWJsZSBvYmplY3QnKTtcclxuICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHN0YXJ0KTtcclxuICB2YXIgaSA9IDAsIHJldDtcclxuICB3aGlsZSAoZGF0ZSA8PSBlbmQpIHtcclxuICAgIHJldCA9IGZuLmNhbGwoZm4sIGRhdGUsIGkpO1xyXG4gICAgLy8gQWxsb3cgZm4gdG8gY2FuY2VsIHRoZSBsb29wIHdpdGggc3RyaWN0ICdmYWxzZSdcclxuICAgIGlmIChyZXQgPT09IGZhbHNlKVxyXG4gICAgICBicmVhaztcclxuICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDEpO1xyXG4gICAgaSsrO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLmVhY2hEYXRlSW5SYW5nZSA9IGVhY2hEYXRlSW5SYW5nZTtcclxuXHJcbi8qKiBNb250aHMgKiovXHJcblxyXG5mdW5jdGlvbiBnZXRGaXJzdE1vbnRoRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoMSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRGaXJzdE1vbnRoRGF0ZSA9IGdldEZpcnN0TW9udGhEYXRlO1xyXG5cclxuZnVuY3Rpb24gZ2V0TGFzdE1vbnRoRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldE1vbnRoKGQuZ2V0TW9udGgoKSArIDEsIDEpO1xyXG4gIGQgPSBhZGREYXlzKGQsIC0xKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldExhc3RNb250aERhdGUgPSBnZXRMYXN0TW9udGhEYXRlO1xyXG5cclxuZnVuY3Rpb24gaXNJbkN1cnJlbnRNb250aChkYXRlKSB7XHJcbiAgcmV0dXJuIGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0TW9udGhEYXRlKGRhdGUpKSA9PSBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdE1vbnRoRGF0ZShuZXcgRGF0ZSgpKSk7XHJcbn1cclxuZXhwb3J0cy5pc0luQ3VycmVudE1vbnRoID0gaXNJbkN1cnJlbnRNb250aDtcclxuXHJcbi8qKlxyXG4gIEdldCBhIGRhdGVzIHJhbmdlIGZvciB0aGUgY3VycmVudCBtb250aFxyXG4gIChvciB0aGUgZ2l2ZW4gZGF0ZSBhcyBiYXNlKVxyXG4qKi9cclxuZnVuY3Rpb24gY3VycmVudE1vbnRoKGJhc2VEYXRlKSB7XHJcbiAgYmFzZURhdGUgPSBiYXNlRGF0ZSB8fCBuZXcgRGF0ZSgpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZ2V0Rmlyc3RNb250aERhdGUoYmFzZURhdGUpLFxyXG4gICAgZW5kOiBnZXRMYXN0TW9udGhEYXRlKGJhc2VEYXRlKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50TW9udGggPSBjdXJyZW50TW9udGg7XHJcblxyXG5mdW5jdGlvbiBuZXh0TW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykge1xyXG4gIGFtb3VudE1vbnRocyA9IGFtb3VudE1vbnRocyB8fCAxO1xyXG4gIHZhciBkID0gbmV3IERhdGUoZnJvbURhdGUpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZC5zZXRNb250aChkLmdldE1vbnRoKCkgKyBhbW91bnRNb250aHMsIDEpLFxyXG4gICAgZW5kOiBnZXRMYXN0TW9udGhEYXRlKGQpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLm5leHRNb250aCA9IG5leHRNb250aDtcclxuXHJcbmZ1bmN0aW9uIHByZXZpb3VzTW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykge1xyXG4gIHJldHVybiBuZXh0TW9udGgoZnJvbURhdGUsIDAgLSBhbW91bnRNb250aHMpO1xyXG59XHJcbmV4cG9ydHMucHJldmlvdXNNb250aCA9IHByZXZpb3VzTW9udGg7XHJcblxyXG4vKipcclxuICBHZXQgYSBkYXRlcyByYW5nZSBmb3IgdGhlIGNvbXBsZXRlIHdlZWtzXHJcbiAgdGhhdCBhcmUgcGFydCBvZiB0aGUgY3VycmVudCBtb250aFxyXG4gIChvciB0aGUgZ2l2ZW4gZGF0ZSBhcyBiYXNlKS5cclxuICBUaGF0IG1lYW5zLCB0aGF0IHN0YXJ0IGRhdGUgd2lsbCBiZSB0aGUgZmlyc3RcclxuICB3ZWVrIGRhdGUgb2YgdGhlIGZpcnN0IG1vbnRoIHdlZWsgKHRoYXQgY2FuXHJcbiAgYmUgdGhlIGRheSAxIG9mIHRoZSBtb250aCBvciBvbmUgb2YgdGhlIGxhc3RcclxuICBkYXRlcyBmcm9tIHRoZSBwcmV2aW91cyBtb250aHMpLFxyXG4gIGFuZCBzaW1pbGFyIGZvciB0aGUgZW5kIGRhdGUgYmVpbmcgdGhlIFxyXG4gIGxhc3Qgd2VlayBkYXRlIG9mIHRoZSBsYXN0IG1vbnRoIHdlZWsuXHJcblxyXG4gIEBpbmNsdWRlU2l4V2Vla3M6IHNvbWV0aW1lcyBpcyB1c2VmdWwgZ2V0IGV2ZXIgYVxyXG4gIHNpeCB3ZWVrcyBkYXRlcyByYW5nZSBzdGFyaW5nIGJ5IHRoZSBmaXJzdCB3ZWVrIG9mXHJcbiAgdGhlIGJhc2VEYXRlIG1vbnRoLiBCeSBkZWZhdWx0IGlzIGZhbHNlLlxyXG4qKi9cclxuZnVuY3Rpb24gY3VycmVudE1vbnRoV2Vla3MoYmFzZURhdGUsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHZhciByID0gY3VycmVudE1vbnRoKGJhc2VEYXRlKSxcclxuICAgIHMgPSBnZXRGaXJzdFdlZWtEYXRlKHIuc3RhcnQpLFxyXG4gICAgZSA9IGluY2x1ZGVTaXhXZWVrcyA/IGFkZERheXMocywgNio3IC0gMSkgOiBnZXRMYXN0V2Vla0RhdGUoci5lbmQpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogcyxcclxuICAgIGVuZDogZVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50TW9udGhXZWVrcyA9IGN1cnJlbnRNb250aFdlZWtzO1xyXG5cclxuZnVuY3Rpb24gbmV4dE1vbnRoV2Vla3MoZnJvbURhdGUsIGFtb3VudE1vbnRocywgaW5jbHVkZVNpeFdlZWtzKSB7XHJcbiAgcmV0dXJuIGN1cnJlbnRNb250aFdlZWtzKG5leHRNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKS5zdGFydCwgaW5jbHVkZVNpeFdlZWtzKTtcclxufVxyXG5leHBvcnRzLm5leHRNb250aFdlZWtzID0gbmV4dE1vbnRoV2Vla3M7XHJcblxyXG5mdW5jdGlvbiBwcmV2aW91c01vbnRoV2Vla3MoZnJvbURhdGUsIGFtb3VudE1vbnRocywgaW5jbHVkZVNpeFdlZWtzKSB7XHJcbiAgcmV0dXJuIGN1cnJlbnRNb250aFdlZWtzKHByZXZpb3VzTW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykuc3RhcnQsIGluY2x1ZGVTaXhXZWVrcyk7XHJcbn1cclxuZXhwb3J0cy5wcmV2aW91c01vbnRoV2Vla3MgPSBwcmV2aW91c01vbnRoV2Vla3M7XHJcbiIsIi8qKiBWZXJ5IHNpbXBsZSBjdXN0b20tZm9ybWF0IGZ1bmN0aW9uIHRvIGFsbG93IFxyXG5sMTBuIG9mIHRleHRzLlxyXG5Db3ZlciBjYXNlczpcclxuLSBNIGZvciBtb250aFxyXG4tIEQgZm9yIGRheVxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb3JtYXREYXRlKGRhdGUsIGZvcm1hdCkge1xyXG4gIHZhciBzID0gZm9ybWF0LFxyXG4gICAgICBNID0gZGF0ZS5nZXRNb250aCgpICsgMSxcclxuICAgICAgRCA9IGRhdGUuZ2V0RGF0ZSgpO1xyXG4gIHMgPSBzLnJlcGxhY2UoL00vZywgTSk7XHJcbiAgcyA9IHMucmVwbGFjZSgvRC9nLCBEKTtcclxuICByZXR1cm4gcztcclxufTsiLCIvKipcclxuICBFeHBvc2luZyBhbGwgdGhlIHB1YmxpYyBmZWF0dXJlcyBhbmQgY29tcG9uZW50cyBvZiBhdmFpbGFiaWxpdHlDYWxlbmRhclxyXG4qKi9cclxuZXhwb3J0cy5XZWVrbHkgPSByZXF1aXJlKCcuL1dlZWtseScpO1xyXG5leHBvcnRzLldvcmtIb3VycyA9IHJlcXVpcmUoJy4vV29ya0hvdXJzJyk7XHJcbmV4cG9ydHMuTW9udGhseSA9IHJlcXVpcmUoJy4vTW9udGhseScpOyIsIi8qKlxyXG4gIE1ha2UgYW4gZWxlbWVudCB1bnNlbGVjdGFibGUsIHVzZWZ1bCB0byBpbXBsZW1lbnQgc29tZSBjdXN0b21cclxuICBzZWxlY3Rpb24gYmVoYXZpb3Igb3IgZHJhZyZkcm9wLlxyXG4gIElmIG9mZmVycyBhbiAnb2ZmJyBtZXRob2QgdG8gcmVzdG9yZSBiYWNrIHRoZSBlbGVtZW50IGJlaGF2aW9yLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgdmFyIGZhbHN5Zm4gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcclxuICB2YXIgbm9kcmFnU3R5bGUgPSB7XHJcbiAgICAnLXdlYmtpdC10b3VjaC1jYWxsb3V0JzogJ25vbmUnLFxyXG4gICAgJy1raHRtbC11c2VyLWRyYWcnOiAnbm9uZScsXHJcbiAgICAnLXdlYmtpdC11c2VyLWRyYWcnOiAnbm9uZScsXHJcbiAgICAnLWtodG1sLXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy13ZWJraXQtdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLW1vei11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctbXMtdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAndXNlci1zZWxlY3QnOiAnbm9uZSdcclxuICB9O1xyXG4gIHZhciBkcmFnZGVmYXVsdFN0eWxlID0ge1xyXG4gICAgJy13ZWJraXQtdG91Y2gtY2FsbG91dCc6ICdpbmhlcml0JyxcclxuICAgICcta2h0bWwtdXNlci1kcmFnJzogJ2luaGVyaXQnLFxyXG4gICAgJy13ZWJraXQtdXNlci1kcmFnJzogJ2luaGVyaXQnLFxyXG4gICAgJy1raHRtbC11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctd2Via2l0LXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJ3VzZXItc2VsZWN0JzogJ2luaGVyaXQnXHJcbiAgfTtcclxuXHJcbiAgdmFyIG9uID0gZnVuY3Rpb24gbWFrZVVuc2VsZWN0YWJsZShlbCkge1xyXG4gICAgZWwgPSAkKGVsKTtcclxuICAgIGVsLm9uKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgLy8kKGRvY3VtZW50KS5vbignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIGVsLmNzcyhub2RyYWdTdHlsZSk7XHJcbiAgfTtcclxuXHJcbiAgdmFyIG9mZiA9IGZ1bmN0aW9uIG9mZk1ha2VVbnNlbGVjdGFibGUoZWwpIHtcclxuICAgIGVsID0gJChlbCk7XHJcbiAgICBlbC5vZmYoJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICAvLyQoZG9jdW1lbnQpLm9mZignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIGVsLmNzcyhkcmFnZGVmYXVsdFN0eWxlKTtcclxuICB9O1xyXG5cclxuICBvbi5vZmYgPSBvZmY7XHJcbiAgcmV0dXJuIG9uO1xyXG5cclxufSAoKSk7IiwiLyoqXHJcbiAgQSBzZXQgb2YgZ2VuZXJpYyB1dGlsaXRpZXMgdG8gbWFuYWdlIGpzIG9iamVjdHNcclxuKiovXHJcbnZhciB1ID0ge307XHJcblxyXG4vKipcclxuICBQZXJmb3JtcyBhIGNhbGxiYWNrIG9uIGVhY2ggcHJvcGVydHkgb3duZWQgYnkgdGhlIG9iamVjdFxyXG4qKi9cclxudS5lYWNoUHJvcGVydHkgPSBmdW5jdGlvbiBlYWNoUHJvcGVydHkob2JqLCBjYikge1xyXG4gIGZvciAodmFyIHAgaW4gb2JqKSB7XHJcbiAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShwKSkgY29udGludWU7XHJcbiAgICBjYi5jYWxsKG9iaiwgcCwgb2JqW3BdKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICBGaWx0ZXIgdGhlIGdpdmVuIG9iamVjdCByZXR1cm5pbmcgYSBuZXcgb25lIHdpdGggb25seSB0aGUgcHJvcGVydGllc1xyXG4gIChhbmQgb3JpZ2luYWwgdmFsdWVzIC1yZWZzIGZvciBvYmplY3QgdmFsdWVzLSkgdGhhdCBwYXNzXHJcbiAgdGhlIHByb3ZpZGVkIEBmaWx0ZXIgY2FsbGJhY2sgKGNhbGxiYWNrIG11c3QgcmV0dXJuIGEgdHJ1ZS90cnV0aHkgdmFsdWVcclxuICBmb3IgZWFjaCB2YWx1ZSBkZXNpcmVkIGluIHRoZSByZXN1bHQpLlxyXG4gIFRoZSBAZmlsdGVyIGNhbGxiYWNrIGl0cyBleGVjdXRlZCB3aXRoIHRoZSBvYmplY3QgYXMgY29udGV4dCBhbmQgcmVjZWl2ZXNcclxuICBhcyBwYXJlbWV0ZXJzIHRoZSBwcm9wZXJ0eSBrZXkgYW5kIGl0cyB2YWx1ZSBcImZpbHRlcihrLCB2KVwiLlxyXG4qKi9cclxudS5maWx0ZXJQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZmlsdGVyUHJvcGVyaWVzKG9iaiwgZmlsdGVyKSB7XHJcbiAgdmFyIHIgPSB7fTtcclxuICB1LmVhY2hQcm9wZXJ0eShvYmosIGZ1bmN0aW9uIChrLCB2KSB7XHJcbiAgICBpZiAoZmlsdGVyLmNhbGwob2JqLCBrLCB2KSlcclxuICAgICAgcltrXSA9IHY7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHU7IiwiLyoqXHJcbiAgQXZhaWxhYmlsaXR5Q2FsZW5kYXIgc2hhcmVkIHV0aWxzXHJcbioqL1xyXG52YXIgXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIGRhdGVVdGlscyA9IHJlcXVpcmUoJy4vZGF0ZVV0aWxzJyksXHJcbiAgZm9ybWF0RGF0ZSA9IHJlcXVpcmUoJy4vZm9ybWF0RGF0ZScpO1xyXG5cclxuLy8gUmUtZXhwb3J0aW5nOlxyXG5leHBvcnRzLmZvcm1hdERhdGUgPSBmb3JtYXREYXRlO1xyXG5leHBvcnRzLmRhdGUgPSBkYXRlVXRpbHM7XHJcblxyXG4vKi0tLS0tLSBDT05TVEFOVFMgLS0tLS0tLS0tKi9cclxudmFyIHN0YXR1c1R5cGVzID0gZXhwb3J0cy5zdGF0dXNUeXBlcyA9IFsndW5hdmFpbGFibGUnLCAnYXZhaWxhYmxlJ107XHJcbi8vIFdlZWsgZGF5cyBuYW1lcyBpbiBlbmdsaXNoIGZvciBpbnRlcm5hbCBzeXN0ZW1cclxuLy8gdXNlOyBOT1QgZm9yIGxvY2FsaXphdGlvbi90cmFuc2xhdGlvbi5cclxudmFyIHN5c3RlbVdlZWtEYXlzID0gZXhwb3J0cy5zeXN0ZW1XZWVrRGF5cyA9IFtcclxuICAnc3VuZGF5JyxcclxuICAnbW9uZGF5JyxcclxuICAndHVlc2RheScsXHJcbiAgJ3dlZG5lc2RheScsXHJcbiAgJ3RodXJzZGF5JyxcclxuICAnZnJpZGF5JyxcclxuICAnc2F0dXJkYXknXHJcbl07XHJcblxyXG4vKi0tLS0tLS0tLSBDT05GSUcgLSBJTlNUQU5DRSAtLS0tLS0tLS0tKi9cclxudmFyIHdlZWtseUNsYXNzZXMgPSBleHBvcnRzLndlZWtseUNsYXNzZXMgPSB7XHJcbiAgY2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhcicsXHJcbiAgd2Vla2x5Q2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci0td2Vla2x5JyxcclxuICBjdXJyZW50V2VlazogJ2lzLWN1cnJlbnRXZWVrJyxcclxuICBhY3Rpb25zOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItYWN0aW9ucycsXHJcbiAgcHJldkFjdGlvbjogJ0FjdGlvbnMtcHJldicsXHJcbiAgbmV4dEFjdGlvbjogJ0FjdGlvbnMtbmV4dCcsXHJcbiAgZGF5czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWRheXMnLFxyXG4gIHNsb3RzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc2xvdHMnLFxyXG4gIHNsb3RIb3VyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItaG91cicsXHJcbiAgc2xvdFN0YXR1c1ByZWZpeDogJ2lzLScsXHJcbiAgbGVnZW5kOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kJyxcclxuICBsZWdlbmRBdmFpbGFibGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQtYXZhaWxhYmxlJyxcclxuICBsZWdlbmRVbmF2YWlsYWJsZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZC11bmF2YWlsYWJsZScsXHJcbiAgc3RhdHVzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc3RhdHVzJyxcclxuICBlcnJvck1lc3NhZ2U6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1lcnJvck1lc3NhZ2UnXHJcbn07XHJcblxyXG52YXIgd2Vla2x5VGV4dHMgPSBleHBvcnRzLndlZWtseVRleHRzID0ge1xyXG4gIGFiYnJXZWVrRGF5czogW1xyXG4gICAgJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCdcclxuICBdLFxyXG4gIHRvZGF5OiAnVG9kYXknLFxyXG4gIC8vIEFsbG93ZWQgc3BlY2lhbCB2YWx1ZXM6IE06bW9udGgsIEQ6ZGF5XHJcbiAgYWJickRhdGVGb3JtYXQ6ICdNL0QnXHJcbn07XHJcblxyXG4vKi0tLS0tLS0tLS0tIFZJRVcgVVRJTFMgLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5mdW5jdGlvbiBoYW5kbGVyQ2FsZW5kYXJFcnJvcihlcnIpIHtcclxuICB2YXIgbXNnID0gJyc7XHJcbiAgaWYgKGVyciAmJiBlcnIubWVzc2FnZSlcclxuICAgIG1zZyA9IGVyci5tZXNzYWdlO1xyXG4gIGVsc2UgaWYgKGVyciAmJiBlcnIuZXhjZXB0aW9uICYmIGVyci5leGNlcHRpb24ubWVzc2FnZSlcclxuICAgIG1zZyA9IGVyci5leGNlcHRpb24ubWVzc2FnZTtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzLmNvbXBvbmVudDtcclxuICB2YXIgbXNnQ29udGFpbmVyID0gdGhhdC4kZWwuZmluZCgnLicgKyB0aGF0LmNsYXNzZXMuZXJyb3JNZXNzYWdlKTtcclxuXHJcbiAgaWYgKG1zZykgbXNnID0gKG1zZ0NvbnRhaW5lci5kYXRhKCdtZXNzYWdlLXByZWZpeCcpIHx8ICcnKSArIG1zZztcclxuXHJcbiAgbXNnQ29udGFpbmVyLnRleHQobXNnKTtcclxufVxyXG5leHBvcnRzLmhhbmRsZXJDYWxlbmRhckVycm9yID0gaGFuZGxlckNhbGVuZGFyRXJyb3I7XHJcblxyXG5mdW5jdGlvbiBtb3ZlQmluZFJhbmdlSW5EYXlzKHdlZWtseSwgZGF5cykge1xyXG4gIHZhciBcclxuICAgIHN0YXJ0ID0gZGF0ZVV0aWxzLmFkZERheXMod2Vla2x5LmRhdGVzUmFuZ2Uuc3RhcnQsIGRheXMpLFxyXG4gICAgZW5kID0gZGF0ZVV0aWxzLmFkZERheXMod2Vla2x5LmRhdGVzUmFuZ2UuZW5kLCBkYXlzKSxcclxuICAgIGRhdGVzUmFuZ2UgPSBkYXRlc1RvUmFuZ2Uoc3RhcnQsIGVuZCk7XHJcblxyXG4gIC8vIENoZWNrIGNhY2hlIGJlZm9yZSB0cnkgdG8gZmV0Y2hcclxuICB2YXIgaW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuXHJcbiAgaWYgKGluQ2FjaGUpIHtcclxuICAgIC8vIEp1c3Qgc2hvdyB0aGUgZGF0YVxyXG4gICAgd2Vla2x5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgLy8gUHJlZmV0Y2ggZXhjZXB0IGlmIHRoZXJlIGlzIG90aGVyIHJlcXVlc3QgaW4gY291cnNlIChjYW4gYmUgdGhlIHNhbWUgcHJlZmV0Y2gsXHJcbiAgICAvLyBidXQgc3RpbGwgZG9uJ3Qgb3ZlcmxvYWQgdGhlIHNlcnZlcilcclxuICAgIGlmICh3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBmb3IgcHJlZmV0Y2hpbmc6XHJcbiAgICAvLyBJdHMgYXZvaWRlZCBpZiB0aGVyZSBhcmUgcmVxdWVzdHMgaW4gY291cnNlLCBzaW5jZVxyXG4gICAgLy8gdGhhdCB3aWxsIGJlIGEgcHJlZmV0Y2ggZm9yIHRoZSBzYW1lIGRhdGEuXHJcbiAgICBpZiAod2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHtcclxuICAgICAgLy8gVGhlIGxhc3QgcmVxdWVzdCBpbiB0aGUgcG9vbCAqbXVzdCogYmUgdGhlIGxhc3QgaW4gZmluaXNoXHJcbiAgICAgIC8vIChtdXN0IGJlIG9ubHkgb25lIGlmIGFsbCBnb2VzIGZpbmUpOlxyXG4gICAgICB2YXIgcmVxdWVzdCA9IHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHNbd2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgIC8vIFdhaXQgZm9yIHRoZSBmZXRjaCB0byBwZXJmb3JtIGFuZCBzZXRzIGxvYWRpbmcgdG8gbm90aWZ5IHVzZXJcclxuICAgICAgd2Vla2x5LiRlbC5hZGRDbGFzcyh3ZWVrbHkuY2xhc3Nlcy5mZXRjaGluZyk7XHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgbW92ZUJpbmRSYW5nZUluRGF5cyh3ZWVrbHksIGRheXMpO1xyXG4gICAgICAgIHdlZWtseS4kZWwucmVtb3ZlQ2xhc3Mod2Vla2x5LmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgd2Vla2x5XHJcbiAgICAuZmV0Y2hEYXRhKGRhdGVzVG9RdWVyeShkYXRlc1JhbmdlKSlcclxuICAgIC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgd2Vla2x5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgICAvLyBQcmVmZXRjaFxyXG4gICAgICB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuZXhwb3J0cy5tb3ZlQmluZFJhbmdlSW5EYXlzID0gbW92ZUJpbmRSYW5nZUluRGF5cztcclxuXHJcbmZ1bmN0aW9uIHdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF3ZWVrbHkuZGF0YSB8fCAhd2Vla2x5LmRhdGEuc2xvdHMpIHJldHVybiBmYWxzZTtcclxuICAvLyBDaGVjayBjYWNoZTogaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBkYXRlIGluIHRoZSByYW5nZVxyXG4gIC8vIHdpdGhvdXQgZGF0YSwgd2Ugc2V0IGluQ2FjaGUgYXMgZmFsc2UgYW5kIGZldGNoIHRoZSBkYXRhOlxyXG4gIHZhciBpbkNhY2hlID0gdHJ1ZTtcclxuICBkYXRlVXRpbHMuZWFjaERhdGVJblJhbmdlKGRhdGVzUmFuZ2Uuc3RhcnQsIGRhdGVzUmFuZ2UuZW5kLCBmdW5jdGlvbiAoZGF0ZSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIGlmICghd2Vla2x5LmRhdGEuc2xvdHNbZGF0ZWtleV0pIHtcclxuICAgICAgaW5DYWNoZSA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGluQ2FjaGU7XHJcbn1cclxuZXhwb3J0cy53ZWVrbHlJc0RhdGFJbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZTtcclxuXHJcbi8qKlxyXG4gIEZvciBub3csIGdpdmVuIHRoZSBKU09OIHN0cnVjdHVyZSB1c2VkLCB0aGUgbG9naWNcclxuICBvZiBtb250aGx5SXNEYXRhSW5DYWNoZSBpcyB0aGUgc2FtZSBhcyB3ZWVrbHlJc0RhdGFJbkNhY2hlOlxyXG4qKi9cclxudmFyIG1vbnRobHlJc0RhdGFJbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZTtcclxuZXhwb3J0cy5tb250aGx5SXNEYXRhSW5DYWNoZSA9IG1vbnRobHlJc0RhdGFJbkNhY2hlO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBjdXJyZW50RGF0ZXNSYW5nZSkge1xyXG4gIHZhciBuZXh0RGF0ZXNSYW5nZSA9IGRhdGVzVG9SYW5nZShcclxuICAgIGRhdGVVdGlscy5hZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLnN0YXJ0LCA3KSxcclxuICAgIGRhdGVVdGlscy5hZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLmVuZCwgNylcclxuICApO1xyXG5cclxuICBpZiAoIXdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBuZXh0RGF0ZXNSYW5nZSkpIHtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgd2VlayBpbiBhZHZhbmNlXHJcbiAgICB2YXIgcHJlZmV0Y2hRdWVyeSA9IGRhdGVzVG9RdWVyeShuZXh0RGF0ZXNSYW5nZSk7XHJcbiAgICB3ZWVrbHkuZmV0Y2hEYXRhKHByZWZldGNoUXVlcnksIG51bGwsIHRydWUpO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2ggPSB3ZWVrbHlDaGVja0FuZFByZWZldGNoO1xyXG5cclxuLyoqIFVwZGF0ZSB0aGUgdmlldyBsYWJlbHMgZm9yIHRoZSB3ZWVrLWRheXMgKHRhYmxlIGhlYWRlcnMpXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVMYWJlbHMoZGF0ZXNSYW5nZSwgY2FsZW5kYXIsIG9wdGlvbnMpIHtcclxuICB2YXIgc3RhcnQgPSBkYXRlc1JhbmdlLnN0YXJ0LFxyXG4gICAgICBlbmQgPSBkYXRlc1JhbmdlLmVuZDtcclxuXHJcbiAgdmFyIGRheXMgPSBjYWxlbmRhci5maW5kKCcuJyArIG9wdGlvbnMuY2xhc3Nlcy5kYXlzICsgJyB0aCcpO1xyXG4gIHZhciB0b2RheSA9IGRhdGVJU08uZGF0ZUxvY2FsKG5ldyBEYXRlKCkpO1xyXG4gIC8vIEZpcnN0IGNlbGwgaXMgZW1wdHkgKCd0aGUgY3Jvc3MgaGVhZGVycyBjZWxsJyksIHRoZW4gb2Zmc2V0IGlzIDFcclxuICB2YXIgb2Zmc2V0ID0gMTtcclxuICBkYXRlVXRpbHMuZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICB2YXIgY2VsbCA9ICQoZGF5cy5nZXQob2Zmc2V0ICsgaSkpLFxyXG4gICAgICAgIHNkYXRlID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSksXHJcbiAgICAgICAgbGFiZWwgPSBzZGF0ZTtcclxuXHJcbiAgICBpZiAodG9kYXkgPT0gc2RhdGUpXHJcbiAgICAgIGxhYmVsID0gb3B0aW9ucy50ZXh0cy50b2RheTtcclxuICAgIGVsc2VcclxuICAgICAgbGFiZWwgPSBvcHRpb25zLnRleHRzLmFiYnJXZWVrRGF5c1tkYXRlLmdldERheSgpXSArICcgJyArIGZvcm1hdERhdGUoZGF0ZSwgb3B0aW9ucy50ZXh0cy5hYmJyRGF0ZUZvcm1hdCk7XHJcblxyXG4gICAgY2VsbC50ZXh0KGxhYmVsKTtcclxuICB9KTtcclxufVxyXG5leHBvcnRzLnVwZGF0ZUxhYmVscyA9IHVwZGF0ZUxhYmVscztcclxuXHJcbmZ1bmN0aW9uIGZpbmRDZWxsQnlTbG90KHNsb3RzQ29udGFpbmVyLCBkYXksIHNsb3QpIHtcclxuICBzbG90ID0gZGF0ZUlTTy5wYXJzZShzbG90KTtcclxuICB2YXIgXHJcbiAgICB4ID0gTWF0aC5yb3VuZChzbG90LmdldEhvdXJzKCkpLFxyXG4gIC8vIFRpbWUgZnJhbWVzIChzbG90cykgYXJlIDE1IG1pbnV0ZXMgZGl2aXNpb25zXHJcbiAgICB5ID0gTWF0aC5yb3VuZChzbG90LmdldE1pbnV0ZXMoKSAvIDE1KSxcclxuICAgIHRyID0gc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJzplcSgnICsgTWF0aC5yb3VuZCh4ICogNCArIHkpICsgJyknKTtcclxuXHJcbiAgLy8gU2xvdCBjZWxsIGZvciBvJ2Nsb2NrIGhvdXJzIGlzIGF0IDEgcG9zaXRpb24gb2Zmc2V0XHJcbiAgLy8gYmVjYXVzZSBvZiB0aGUgcm93LWhlYWQgY2VsbFxyXG4gIHZhciBkYXlPZmZzZXQgPSAoeSA9PT0gMCA/IGRheSArIDEgOiBkYXkpO1xyXG4gIHJldHVybiB0ci5jaGlsZHJlbignOmVxKCcgKyBkYXlPZmZzZXQgKyAnKScpO1xyXG59XHJcbmV4cG9ydHMuZmluZENlbGxCeVNsb3QgPSBmaW5kQ2VsbEJ5U2xvdDtcclxuXHJcbmZ1bmN0aW9uIGZpbmRTbG90QnlDZWxsKHNsb3RzQ29udGFpbmVyLCBjZWxsKSB7XHJcbiAgdmFyIFxyXG4gICAgeCA9IGNlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGNlbGwpLFxyXG4gICAgeSA9IGNlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpLFxyXG4gICAgZnVsbE1pbnV0ZXMgPSB5ICogMTUsXHJcbiAgICBob3VycyA9IE1hdGguZmxvb3IoZnVsbE1pbnV0ZXMgLyA2MCksXHJcbiAgICBtaW51dGVzID0gZnVsbE1pbnV0ZXMgLSAoaG91cnMgKiA2MCksXHJcbiAgICBzbG90ID0gbmV3IERhdGUoKTtcclxuICBzbG90LnNldEhvdXJzKGhvdXJzLCBtaW51dGVzLCAwLCAwKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGRheTogeCxcclxuICAgIHNsb3Q6IHNsb3RcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuZmluZFNsb3RCeUNlbGwgPSBmaW5kU2xvdEJ5Q2VsbDtcclxuXHJcbi8qKlxyXG5NYXJrIGNhbGVuZGFyIGFzIGN1cnJlbnQtd2VlayBhbmQgZGlzYWJsZSBwcmV2IGJ1dHRvbixcclxub3IgcmVtb3ZlIHRoZSBtYXJrIGFuZCBlbmFibGUgaXQgaWYgaXMgbm90LlxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50V2VlayhjYWxlbmRhciwgZGF0ZSwgb3B0aW9ucykge1xyXG4gIHZhciB5ZXAgPSBkYXRlVXRpbHMuaXNJbkN1cnJlbnRXZWVrKGRhdGUpO1xyXG4gIGNhbGVuZGFyLnRvZ2dsZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy5jdXJyZW50V2VlaywgeWVwKTtcclxuICBjYWxlbmRhci5maW5kKCcuJyArIG9wdGlvbnMuY2xhc3Nlcy5wcmV2QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcbn1cclxuZXhwb3J0cy5jaGVja0N1cnJlbnRXZWVrID0gY2hlY2tDdXJyZW50V2VlaztcclxuXHJcbi8qKiBHZXQgcXVlcnkgb2JqZWN0IHdpdGggdGhlIGRhdGUgcmFuZ2Ugc3BlY2lmaWVkOlxyXG4qKi9cclxuZnVuY3Rpb24gZGF0ZXNUb1F1ZXJ5KHN0YXJ0LCBlbmQpIHtcclxuICAvLyBVbmlxdWUgcGFyYW0gd2l0aCBib3RoIHByb3BpZXJ0aWVzOlxyXG4gIGlmIChzdGFydC5lbmQpIHtcclxuICAgIGVuZCA9IHN0YXJ0LmVuZDtcclxuICAgIHN0YXJ0ID0gc3RhcnQuc3RhcnQ7XHJcbiAgfVxyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZGF0ZUlTTy5kYXRlTG9jYWwoc3RhcnQsIHRydWUpLFxyXG4gICAgZW5kOiBkYXRlSVNPLmRhdGVMb2NhbChlbmQsIHRydWUpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmRhdGVzVG9RdWVyeSA9IGRhdGVzVG9RdWVyeTtcclxuXHJcbi8qKiBQYWNrIHR3byBkYXRlcyBpbiBhIHNpbXBsZSBidXQgdXNlZnVsXHJcbnN0cnVjdHVyZSB7IHN0YXJ0LCBlbmQgfVxyXG4qKi9cclxuZnVuY3Rpb24gZGF0ZXNUb1JhbmdlKHN0YXJ0LCBlbmQpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IHN0YXJ0LFxyXG4gICAgZW5kOiBlbmRcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuZGF0ZXNUb1JhbmdlID0gZGF0ZXNUb1JhbmdlO1xyXG4iLCIvKipcclxuICAgIFNtYWxsIHV0aWxpdHkgdG8gd3JhcCBhIGNhbGxiYWNrL2hhbmRsZXIgZnVuY3Rpb24gaW4gYSB0aW1lclxyXG4gICAgYmVpbmcgZXhlY3V0ZWQgb25seSBvbmNlICh0aGUgbGF0ZXN0IGNhbGwpIGluc2lkZSB0aGUgdGltZWZyYW1lLFxyXG4gICAgZGVmaW5lZCBieSB0aGUgaW50ZXJ2YWwgcGFyYW1ldGVyLCBpdHMganVzdCAxIG1pbGlzZWNvbmQgYnkgZGVmYXVsdC5cclxuICAgIEl0cyB1c2VmdWwgd2hlbiBhbiBldmVudCBnZXRzIGV4ZWN1dGVkXHJcbiAgICBsb3RzIG9mIHRpbWVzIHRvbyBxdWlja2x5IGFuZCBvbmx5IDEgZXhlY3V0aW9uIGlzIHdhbnRlZCB0byBhdm9pZFxyXG4gICAgaHVydCBwZXJmb3JtYW5jZS5cclxuICAgIFRoZSBkZWZhdWx0IGludGVydmFsIG9mIDEgd29ya3MgZmluZSBpZiB0aGUgZXZlbnQgZ2V0cyByYWlzZWRcclxuICAgIGEgbG90IGJ5IGNvbnNlY3V0aXZlIGNvZGUsIGJ1dCBpZiBjYWxscyBhcmUgZGVsYXllZCBhIGdyZWF0ZXJcclxuICAgIGludGVydmFsIHdpbGwgYmUgbmVlZC5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmF0Y2hFdmVudEhhbmRsZXIoY2IsIGludGVydmFsKSB7XHJcbiAgICB2YXIgdGltZXI7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xyXG4gICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfSwgaW50ZXJ2YWwgfHwgMSk7XHJcbiAgICB9O1xyXG59OyIsIi8qIEdlbmVyaWMgYmxvY2tVSSBvcHRpb25zIHNldHMgKi9cclxudmFyIGxvYWRpbmdCbG9jayA9IHsgbWVzc2FnZTogJzxpbWcgd2lkdGg9XCI0OHB4XCIgaGVpZ2h0PVwiNDhweFwiIGNsYXNzPVwibG9hZGluZy1pbmRpY2F0b3JcIiBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyB9O1xyXG52YXIgZXJyb3JCbG9jayA9IGZ1bmN0aW9uIChlcnJvciwgcmVsb2FkLCBzdHlsZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjc3M6ICQuZXh0ZW5kKHsgY3Vyc29yOiAnZGVmYXVsdCcgfSwgc3R5bGUgfHwge30pLFxyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj5UaGVyZSB3YXMgYW4gZXJyb3InICtcclxuICAgICAgICAgICAgKGVycm9yID8gJzogJyArIGVycm9yIDogJycpICtcclxuICAgICAgICAgICAgKHJlbG9hZCA/ICcgPGEgaHJlZj1cImphdmFzY3JpcHQ6ICcgKyByZWxvYWQgKyAnO1wiPkNsaWNrIHRvIHJlbG9hZDwvYT4nIDogJycpICtcclxuICAgICAgICAgICAgJzwvZGl2PidcclxuICAgIH07XHJcbn07XHJcbnZhciBpbmZvQmxvY2sgPSBmdW5jdGlvbiAobWVzc2FnZSwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuICQuZXh0ZW5kKHtcclxuICAgICAgICBtZXNzYWdlOiAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPjxkaXYgY2xhc3M9XCJpbmZvXCI+JyArIG1lc3NhZ2UgKyAnPC9kaXY+J1xyXG4gICAgICAgIC8qLGNzczogeyBjdXJzb3I6ICdkZWZhdWx0JyB9Ki9cclxuICAgICAgICAsIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGU6XHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgbG9hZGluZzogbG9hZGluZ0Jsb2NrLFxyXG4gICAgICAgIGVycm9yOiBlcnJvckJsb2NrLFxyXG4gICAgICAgIGluZm86IGluZm9CbG9ja1xyXG4gICAgfTtcclxufSIsIi8qPSBDaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzXHJcbiogdG8gbm90aWZ5IHVzZXIgYWJvdXQgY2hhbmdlcyBpbiBmb3JtcyxcclxuKiB0YWJzLCB0aGF0IHdpbGwgYmUgbG9zdCBpZiBnbyBhd2F5IGZyb21cclxuKiB0aGUgcGFnZS4gSXQga25vd3Mgd2hlbiBhIGZvcm0gaXMgc3VibWl0dGVkXHJcbiogYW5kIHNhdmVkIHRvIGRpc2FibGUgbm90aWZpY2F0aW9uLCBhbmQgZ2l2ZXNcclxuKiBtZXRob2RzIGZvciBvdGhlciBzY3JpcHRzIHRvIG5vdGlmeSBjaGFuZ2VzXHJcbiogb3Igc2F2aW5nLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZ2V0WFBhdGggPSByZXF1aXJlKCcuL2dldFhQYXRoJyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHtcclxuICAgIGNoYW5nZXNMaXN0OiB7fSxcclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBudWxsLFxyXG4gICAgICAgIGdlbmVyaWNDaGFuZ2VTdXBwb3J0OiB0cnVlLFxyXG4gICAgICAgIGdlbmVyaWNTdWJtaXRTdXBwb3J0OiBmYWxzZSxcclxuICAgICAgICBjaGFuZ2VkRm9ybUNsYXNzOiAnaGFzLWNoYW5nZXMnLFxyXG4gICAgICAgIGNoYW5nZWRFbGVtZW50Q2xhc3M6ICdjaGFuZ2VkJyxcclxuICAgICAgICBub3RpZnlDbGFzczogJ25vdGlmeS1jaGFuZ2VzJ1xyXG4gICAgfSxcclxuICAgIGluaXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gVXNlciBub3RpZmljYXRpb24gdG8gcHJldmVudCBsb3N0IGNoYW5nZXMgZG9uZVxyXG4gICAgICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hhbmdlc05vdGlmaWNhdGlvbi5ub3RpZnkoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQodGhpcy5kZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKCFvcHRpb25zLnRhcmdldClcclxuICAgICAgICAgICAgb3B0aW9ucy50YXJnZXQgPSBkb2N1bWVudDtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljQ2hhbmdlU3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ2NoYW5nZScsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpIDppbnB1dFtuYW1lXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoJCh0aGlzKS5jbG9zZXN0KCdmb3JtJykuZ2V0KDApLCB0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY1N1Ym1pdFN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdzdWJtaXQnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBBZGQgbm90aWZpY2F0aW9uIGNsYXNzIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLm5vdGlmeUNsYXNzKTtcclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGNoYW5nZSBpbiB0aGUgcHJvcGVydHkgbGlzdCByZXR1cm5pbmcgdGhlIG1lc3NhZ2U6XHJcbiAgICAgICAgZm9yICh2YXIgYyBpbiB0aGlzLmNoYW5nZXNMaXN0KVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWl0TWVzc2FnZSB8fCAodGhpcy5xdWl0TWVzc2FnZSA9ICQoJyNsY3Jlcy1xdWl0LXdpdGhvdXQtc2F2ZScpLnRleHQoKSkgfHwgJyc7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJDaGFuZ2U6IGZ1bmN0aW9uIChmLCBlKSB7XHJcbiAgICAgICAgaWYgKCFlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgdmFyIGZsID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSB8fCBbXTtcclxuICAgICAgICBpZiAoJC5pc0FycmF5KGUpKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZS5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJDaGFuZ2UoZiwgZVtpXSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG4gPSBlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgKGUpICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBuID0gZS5uYW1lO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiByZWFsbHkgdGhlcmUgd2FzIGEgY2hhbmdlIGNoZWNraW5nIGRlZmF1bHQgZWxlbWVudCB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChlLmRlZmF1bHRWYWx1ZSkgIT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5jaGVja2VkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLnNlbGVjdGVkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgZS52YWx1ZSA9PSBlLmRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlcmUgd2FzIG5vIGNoYW5nZSwgbm8gY29udGludWVcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBtYXliZSBpcyBhIHJlZ3Jlc3Npb24gZnJvbSBhIGNoYW5nZSBhbmQgbm93IHRoZSBvcmlnaW5hbCB2YWx1ZSBhZ2FpblxyXG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIHJlbW92ZSBmcm9tIGNoYW5nZXMgbGlzdCBkb2luZyByZWdpc3RlclNhdmVcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJTYXZlKGYsIFtuXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJChlKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIShuIGluIGZsKSlcclxuICAgICAgICAgICAgZmwucHVzaChuKTtcclxuICAgICAgICAkKGYpXHJcbiAgICAgICAgLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcylcclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnQgbmFtZSBjaGFuZ2VkLCBmb3JtIGVsZW1lbnQgY2hhbmdlZCAodGhpcyBjYW4gYmUgbnVsbClcclxuICAgICAgICAudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIFtmLCBuLCBlXSk7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJTYXZlOiBmdW5jdGlvbiAoZiwgZWxzKSB7XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSkgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgcHJldkVscyA9ICQuZXh0ZW5kKFtdLCB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSk7XHJcblxyXG4gICAgICAgIC8vICdlbHMnIChmaWx0ZXJlZCBmb3JtIGVsZW1lbnRzIGxpc3QpIGNhbiBiZSBhbiBhcnJheSBvZiBmaWVsZCAnbmFtZSdzIG9yIGFuIGFycmF5IG9mIERPTSBlbGVtZW50cyAob3IgbWl4ZWQpXHJcbiAgICAgICAgLy8gaXRzIGNvbnZlcnRlZCB0byBhbiBhcnJheSBvZiAnbmFtZSdzIGFueXdheTpcclxuICAgICAgICBpZiAoZWxzKSB7XHJcbiAgICAgICAgICAgIGVscyA9ICQubWFwKGVscywgZnVuY3Rpb24gKGVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHR5cGVvZiAoZWwpID09PSAnc3RyaW5nJyA/IGVsIDogZWwubmFtZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdG8tcmVtb3ZlIGZvcm0gbGlzdCBmbGFnOiBieSBkZWZhdWx0IHRydWUsIHNpbmNlIHdoZW4gbm8gZWxzIGxpc3Qgc2luY2UgaXMgYWxsIHRoZSBmb3JtIHNhdmVkXHJcbiAgICAgICAgdmFyIHIgPSB0cnVlO1xyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSAkLmdyZXAodGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0sIGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gKCQuaW5BcnJheShlbCwgZWxzKSA9PSAtMSk7IH0pO1xyXG4gICAgICAgICAgICAvLyBEb24ndCByZW1vdmUgJ2YnIGxpc3QgaWYgaXMgbm90IGVtcHR5XHJcbiAgICAgICAgICAgIHIgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXS5sZW5ndGggPT09IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgICAkKGYpLnJlbW92ZUNsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcyk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudHMgcmVnaXN0ZXJlZCBhcyBzYXZlICh0aGlzIGNhbiBiZSBudWxsKSwgYW5kICdmb3JtIGZ1bGx5IHNhdmVkJyBhcyB0aGlyZCBwYXJhbSAoYm9vbClcclxuICAgICAgICAkKGYpLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgW2YsIGVscyB8fCBwcmV2RWxzLCByXSk7XHJcbiAgICAgICAgdmFyIGxjaG4gPSB0aGlzO1xyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgJC5lYWNoKGVscywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCgnW25hbWU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSh0aGlzKSArICdcIl0nKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGxjaG4uZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcHJldkVscztcclxuICAgIH1cclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gY2hhbmdlc05vdGlmaWNhdGlvbjtcclxufSIsIi8qIFV0aWxpdHkgdG8gY3JlYXRlIGlmcmFtZSB3aXRoIGluamVjdGVkIGh0bWwvY29udGVudCBpbnN0ZWFkIG9mIFVSTC5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlSWZyYW1lKGNvbnRlbnQsIHNpemUpIHtcclxuICAgIHZhciAkaWZyYW1lID0gJCgnPGlmcmFtZSB3aWR0aD1cIicgKyBzaXplLndpZHRoICsgJ1wiIGhlaWdodD1cIicgKyBzaXplLmhlaWdodCArICdcIiBzdHlsZT1cImJvcmRlcjpub25lO1wiPjwvaWZyYW1lPicpO1xyXG4gICAgdmFyIGlmcmFtZSA9ICRpZnJhbWUuZ2V0KDApO1xyXG4gICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIHJlYWR5XHJcbiAgICB2YXIgaWZyYW1lbG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZnJhbWUub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIFVzaW5nIGlmcmFtZWxvYWRlZCB0byBhdm9pZCBpbmZpbml0ZSBsb29wc1xyXG4gICAgICAgIGlmICghaWZyYW1lbG9hZGVkKSB7XHJcbiAgICAgICAgICAgIGlmcmFtZWxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBjb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuICRpZnJhbWU7XHJcbn07XHJcblxyXG4vKiBQdXRzIGZ1bGwgaHRtbCBpbnNpZGUgdGhlIGlmcmFtZSBlbGVtZW50IHBhc3NlZCBpbiBhIHNlY3VyZSBhbmQgY29tcGxpYW50IG1vZGUgKi9cclxuZnVuY3Rpb24gaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGh0bWwpIHtcclxuICAgIC8vIHB1dCBhamF4IGRhdGEgaW5zaWRlIGlmcmFtZSByZXBsYWNpbmcgYWxsIHRoZWlyIGh0bWwgaW4gc2VjdXJlIFxyXG4gICAgLy8gY29tcGxpYW50IG1vZGUgKCQuaHRtbCBkb24ndCB3b3JrcyB0byBpbmplY3QgPGh0bWw+PGhlYWQ+IGNvbnRlbnQpXHJcblxyXG4gICAgLyogZG9jdW1lbnQgQVBJIHZlcnNpb24gKHByb2JsZW1zIHdpdGggSUUsIGRvbid0IGV4ZWN1dGUgaWZyYW1lLWh0bWwgc2NyaXB0cykgKi9cclxuICAgIC8qdmFyIGlmcmFtZURvYyA9XHJcbiAgICAvLyBXM0MgY29tcGxpYW50OiBucywgZmlyZWZveC1nZWNrbywgY2hyb21lL3NhZmFyaS13ZWJraXQsIG9wZXJhLCBpZTlcclxuICAgIGlmcmFtZS5jb250ZW50RG9jdW1lbnQgfHxcclxuICAgIC8vIG9sZCBJRSAoNS41KylcclxuICAgIChpZnJhbWUuY29udGVudFdpbmRvdyA/IGlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50IDogbnVsbCkgfHxcclxuICAgIC8vIGZhbGxiYWNrICh2ZXJ5IG9sZCBJRT8pXHJcbiAgICBkb2N1bWVudC5mcmFtZXNbaWZyYW1lLmlkXS5kb2N1bWVudDtcclxuICAgIGlmcmFtZURvYy5vcGVuKCk7XHJcbiAgICBpZnJhbWVEb2Mud3JpdGUoaHRtbCk7XHJcbiAgICBpZnJhbWVEb2MuY2xvc2UoKTsqL1xyXG5cclxuICAgIC8qIGphdmFzY3JpcHQgVVJJIHZlcnNpb24gKHdvcmtzIGZpbmUgZXZlcnl3aGVyZSEpICovXHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdy5jb250ZW50cyA9IGh0bWw7XHJcbiAgICBpZnJhbWUuc3JjID0gJ2phdmFzY3JpcHQ6d2luZG93W1wiY29udGVudHNcIl0nO1xyXG5cclxuICAgIC8vIEFib3V0IHRoaXMgdGVjaG5pcXVlLCB0aGlzIGh0dHA6Ly9zcGFyZWN5Y2xlcy53b3JkcHJlc3MuY29tLzIwMTIvMDMvMDgvaW5qZWN0LWNvbnRlbnQtaW50by1hLW5ldy1pZnJhbWUvXHJcbn1cclxuXHJcbiIsIi8qIENSVURMIEhlbHBlciAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcbnZhciBnZXRUZXh0ID0gcmVxdWlyZSgnLi9nZXRUZXh0Jyk7XHJcbnZhciBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxuXHJcbmV4cG9ydHMuZGVmYXVsdFNldHRpbmdzID0ge1xyXG4gIGVmZmVjdHM6IHtcclxuICAgICdzaG93LXZpZXdlcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LFxyXG4gICAgJ2hpZGUtdmlld2VyJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sXHJcbiAgICAnc2hvdy1lZGl0b3InOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSwgLy8gdGhlIHNhbWUgYXMganF1ZXJ5LXVpIHsgZWZmZWN0OiAnc2xpZGUnLCBkdXJhdGlvbjogJ3Nsb3cnLCBkaXJlY3Rpb246ICdkb3duJyB9XHJcbiAgICAnaGlkZS1lZGl0b3InOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfVxyXG4gIH0sXHJcbiAgZXZlbnRzOiB7XHJcbiAgICAnZWRpdC1lbmRzJzogJ2NydWRsLWVkaXQtZW5kcycsXHJcbiAgICAnZWRpdC1zdGFydHMnOiAnY3J1ZGwtZWRpdC1zdGFydHMnLFxyXG4gICAgJ2VkaXRvci1yZWFkeSc6ICdjcnVkbC1lZGl0b3ItcmVhZHknLFxyXG4gICAgJ2VkaXRvci1zaG93ZWQnOiAnY3J1ZGwtZWRpdG9yLXNob3dlZCcsXHJcbiAgICAnZWRpdG9yLWhpZGRlbic6ICdjcnVkbC1lZGl0b3ItaGlkZGVuJyxcclxuICAgICdjcmVhdGUnOiAnY3J1ZGwtY3JlYXRlJyxcclxuICAgICd1cGRhdGUnOiAnY3J1ZGwtdXBkYXRlJyxcclxuICAgICdkZWxldGUnOiAnY3J1ZGwtZGVsZXRlJ1xyXG4gIH0sXHJcbiAgZGF0YToge1xyXG4gICAgJ2ZvY3VzLWNsb3Nlc3QnOiB7XHJcbiAgICAgIG5hbWU6ICdjcnVkbC1mb2N1cy1jbG9zZXN0JyxcclxuICAgICAgJ2RlZmF1bHQnOiAnKidcclxuICAgIH0sXHJcbiAgICAnZm9jdXMtbWFyZ2luJzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtbWFyZ2luJyxcclxuICAgICAgJ2RlZmF1bHQnOiAwXHJcbiAgICB9LFxyXG4gICAgJ2ZvY3VzLWR1cmF0aW9uJzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtZHVyYXRpb24nLFxyXG4gICAgICAnZGVmYXVsdCc6IDIwMFxyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gIFV0aWxpdHkgdG8gZ2V0IGEgZGF0YSB2YWx1ZSBvciB0aGUgZGVmYXVsdCBiYXNlZCBvbiB0aGUgaW5zdGFuY2VcclxuICBzZXR0aW5ncyBvbiB0aGUgZ2l2ZW4gZWxlbWVudFxyXG4qKi9cclxuZnVuY3Rpb24gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBlbCwgc2V0dGluZ05hbWUpIHtcclxuICB2YXJcclxuICAgIHNldHRpbmcgPSBpbnN0YW5jZS5zZXR0aW5ncy5kYXRhW3NldHRpbmdOYW1lXSxcclxuICAgIHZhbCA9IGVsLmRhdGEoc2V0dGluZy5uYW1lKSB8fCBzZXR0aW5nWydkZWZhdWx0J107XHJcbiAgcmV0dXJuIHZhbDtcclxufVxyXG5cclxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uIHNldHVwQ3J1ZGwob25TdWNjZXNzLCBvbkVycm9yLCBvbkNvbXBsZXRlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uOiBmdW5jdGlvbiBvbihzZWxlY3Rvciwgc2V0dGluZ3MpIHtcclxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCAnLmNydWRsJztcclxuICAgICAgdmFyIGluc3RhbmNlID0ge1xyXG4gICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcclxuICAgICAgICBlbGVtZW50czogJChzZWxlY3RvcilcclxuICAgICAgfTtcclxuICAgICAgLy8gRXh0ZW5kaW5nIGRlZmF1bHQgc2V0dGluZ3Mgd2l0aCBwcm92aWRlZCBvbmVzLFxyXG4gICAgICAvLyBidXQgc29tZSBjYW4gYmUgdHdlYWsgb3V0c2lkZSB0b28uXHJcbiAgICAgIGluc3RhbmNlLnNldHRpbmdzID0gJC5leHRlbmQodHJ1ZSwgZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MsIHNldHRpbmdzKTtcclxuICAgICAgaW5zdGFuY2UuZWxlbWVudHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGNydWRsID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoY3J1ZGwuZGF0YSgnX19jcnVkbF9pbml0aWFsaXplZF9fJykgPT09IHRydWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZGN0eCA9IGNydWRsLmRhdGEoJ2NydWRsLWNvbnRleHQnKSB8fCAnJztcclxuICAgICAgICB2YXIgdndyID0gY3J1ZGwuZmluZCgnLmNydWRsLXZpZXdlcicpO1xyXG4gICAgICAgIHZhciBkdHIgPSBjcnVkbC5maW5kKCcuY3J1ZGwtZWRpdG9yJyk7XHJcbiAgICAgICAgdmFyIGlpZHBhciA9IGNydWRsLmRhdGEoJ2NydWRsLWl0ZW0taWQtcGFyYW1ldGVyJykgfHwgJ0l0ZW1JRCc7XHJcbiAgICAgICAgdmFyIGZvcm1wYXJzID0geyBhY3Rpb246ICdjcmVhdGUnIH07XHJcbiAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IDA7XHJcbiAgICAgICAgdmFyIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0RXh0cmFRdWVyeShlbCkge1xyXG4gICAgICAgICAgLy8gR2V0IGV4dHJhIHF1ZXJ5IG9mIHRoZSBlbGVtZW50LCBpZiBhbnk6XHJcbiAgICAgICAgICB2YXIgeHEgPSBlbC5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpIHx8ICcnO1xyXG4gICAgICAgICAgaWYgKHhxKSB4cSA9ICcmJyArIHhxO1xyXG4gICAgICAgICAgLy8gSXRlcmF0ZSBhbGwgcGFyZW50cyBpbmNsdWRpbmcgdGhlICdjcnVkbCcgZWxlbWVudCAocGFyZW50c1VudGlsIGV4Y2x1ZGVzIHRoZSBmaXJzdCBlbGVtZW50IGdpdmVuLFxyXG4gICAgICAgICAgLy8gYmVjYXVzZSBvZiB0aGF0IHdlIGdldCBpdHMgcGFyZW50KCkpXHJcbiAgICAgICAgICAvLyBGb3IgYW55IG9mIHRoZW0gd2l0aCBhbiBleHRyYS1xdWVyeSwgYXBwZW5kIGl0OlxyXG4gICAgICAgICAgZWwucGFyZW50c1VudGlsKGNydWRsLnBhcmVudCgpLCAnW2RhdGEtY3J1ZGwtZXh0cmEtcXVlcnldJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB4ID0gJCh0aGlzKS5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpO1xyXG4gICAgICAgICAgICBpZiAoeCkgeHEgKz0gJyYnICsgeDtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIHhxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3J1ZGwuZmluZCgnLmNydWRsLWNyZWF0ZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSAwO1xyXG4gICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ2NyZWF0ZSc7XHJcbiAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG4gICAgICAgICAgZHRyLnJlbG9hZCh7XHJcbiAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKHVybCwgZGVmYXVsdFVybCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VXJsICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGR0ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LWVkaXRvciddKVxyXG4gICAgICAgICAgICAgIC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgICBkdHIuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEhpZGUgdmlld2VyIHdoZW4gaW4gZWRpdG9yOlxyXG4gICAgICAgICAgdndyLnhoaWRlKGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtdmlld2VyJ10pO1xyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSlcclxuICAgICAgICAgIC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50cy5jcmVhdGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdndyXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtdXBkYXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAndXBkYXRlJztcclxuICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICBkdHIucmVsb2FkKHtcclxuICAgICAgICAgICAgdXJsOiBmdW5jdGlvbiAodXJsLCBkZWZhdWx0VXJsKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRVcmwgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgZHRyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctZWRpdG9yJ10pXHJcbiAgICAgICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIFtkdHJdKTtcclxuICAgICAgICAgICAgICAgIGR0ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgLy8gSGlkZSB2aWV3ZXIgd2hlbiBpbiBlZGl0b3I6XHJcbiAgICAgICAgICB2d3IueGhpZGUoaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS12aWV3ZXInXSk7XHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddKVxyXG4gICAgICAgICAgLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzLnVwZGF0ZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtZGVsZXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuXHJcbiAgICAgICAgICBpZiAoY29uZmlybShnZXRUZXh0KCdjb25maXJtLWRlbGV0ZS1jcnVkbC1pdGVtLW1lc3NhZ2U6JyArIGRjdHgpKSkge1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCc8ZGl2PicgKyBnZXRUZXh0KCdkZWxldGUtY3J1ZGwtaXRlbS1sb2FkaW5nLW1lc3NhZ2U6JyArIGRjdHgpICsgJzwvZGl2PicsIGl0ZW0pO1xyXG4gICAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gaXRlbWlkO1xyXG4gICAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAnZGVsZXRlJztcclxuICAgICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICB1cmw6IGR0ci5hdHRyKCdkYXRhLXNvdXJjZS11cmwnKSArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHEsXHJcbiAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbignPGRpdj4nICsgZGF0YS5SZXN1bHQgKyAnPC9kaXY+JywgaXRlbSwgbnVsbCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5mYWRlT3V0KCdzbG93JywgZnVuY3Rpb24gKCkgeyBpdGVtLnJlbW92ZSgpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgICAgICAgICAgICAgb25FcnJvcihqeCwgbWVzc2FnZSwgZXgpO1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UoaXRlbSk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjb21wbGV0ZTogb25Db21wbGV0ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydkZWxldGUnXSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBmaW5pc2hFZGl0KCkge1xyXG4gICAgICAgICAgZnVuY3Rpb24gb25jb21wbGV0ZShhbm90aGVyT25Db21wbGV0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIC8vIFNob3cgYWdhaW4gdGhlIFZpZXdlclxyXG4gICAgICAgICAgICAgIC8vdndyLnNsaWRlRG93bignc2xvdycpO1xyXG4gICAgICAgICAgICAgIGlmICghdndyLmlzKCc6dmlzaWJsZScpKVxyXG4gICAgICAgICAgICAgICAgdndyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctdmlld2VyJ10pO1xyXG4gICAgICAgICAgICAgIC8vIE1hcmsgdGhlIGZvcm0gYXMgdW5jaGFuZ2VkIHRvIGF2b2lkIHBlcnNpc3Rpbmcgd2FybmluZ3NcclxuICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcbiAgICAgICAgICAgICAgLy8gQXZvaWQgY2FjaGVkIGNvbnRlbnQgb24gdGhlIEVkaXRvclxyXG4gICAgICAgICAgICAgIGR0ci5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBTY3JvbGwgdG8gcHJlc2VydmUgY29ycmVjdCBmb2N1cyAob24gbGFyZ2UgcGFnZXMgd2l0aCBzaGFyZWQgY29udGVudCB1c2VyIGNhbiBnZXRcclxuICAgICAgICAgICAgICAvLyBsb3N0IGFmdGVyIGFuIGVkaXRpb24pXHJcbiAgICAgICAgICAgICAgLy8gKHdlIHF1ZXVlIGFmdGVyIHZ3ci54c2hvdyBiZWNhdXNlIHdlIG5lZWQgdG8gZG8gaXQgYWZ0ZXIgdGhlIHhzaG93IGZpbmlzaClcclxuICAgICAgICAgICAgICB2d3IucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzQ2xvc2VzdCA9IGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgY3J1ZGwsICdmb2N1cy1jbG9zZXN0Jyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNFbGVtZW50ID0gY3J1ZGwuY2xvc2VzdChmb2N1c0Nsb3Nlc3QpO1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gY2xvc2VzdCwgZ2V0IHRoZSBjcnVkbFxyXG4gICAgICAgICAgICAgICAgaWYgKGZvY3VzRWxlbWVudC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICAgIGZvY3VzRWxlbWVudCA9IGNydWRsO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzTWFyZ2luID0gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBjcnVkbCwgJ2ZvY3VzLW1hcmdpbicpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzRHVyYXRpb24gPSBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGNydWRsLCAnZm9jdXMtZHVyYXRpb24nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhmb2N1c0VsZW1lbnQsIHsgbWFyZ2luVG9wOiBmb2N1c01hcmdpbiwgZHVyYXRpb246IGZvY3VzRHVyYXRpb24gfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdndyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBjYWxsYmFjazpcclxuICAgICAgICAgICAgICBpZiAodHlwZW9mIChhbm90aGVyT25Db21wbGV0ZSkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICBhbm90aGVyT25Db21wbGV0ZS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBOT1RFOiBGaXJzdCwgd2Ugbm90aWZ5IHRoZSBjaGFuZ2VzLXNhdmVkIGFuZCBldmVudCwgdGhpcyBsYXN0IGFsbG93c1xyXG4gICAgICAgICAgLy8gY2xpZW50IHNjcmlwdHMgdG8gZG8gdGFza3MganVzdCBiZWZvcmUgdGhlIGVkaXRvciBiZWdpbnMgdG8gY2xvc2VcclxuICAgICAgICAgIC8vIChhdm9pZGluZyBwcm9ibGVtcyBsaWtlIHdpdGggdGhlICdtb3ZlRm9jdXNUbycgbm90IGJlaW5nIHByZWNpc2UgaWYgdGhlXHJcbiAgICAgICAgICAvLyBhbmltYXRpb24gZHVyYXRpb24gaXMgdGhlIHNhbWUgb24gY2xpZW50IHNjcmlwdCBhbmQgaGlkZS1lZGl0b3IpLlxyXG4gICAgICAgICAgLy8gVGhlbiwgZWRpdG9yIGdldHMgaGlkZGVuXHJcbiAgICAgICAgICAvLyBUT0RPOiBUaGlzIGNhbiBnZXQgZW5oYW5jZWQgdG8gYWxsb3cgbGFyZ2VyIGR1cmF0aW9ucyBvbiBjbGllbnQtc2NyaXB0c1xyXG4gICAgICAgICAgLy8gd2l0aG91dCBhZmZlY3QgbW92ZUZvY3VzVG8gcGFzc2luZyBpbiB0aGUgdHJpZ2dlciBhbiBvYmplY3QgdGhhdCBob2xkc1xyXG4gICAgICAgICAgLy8gYSBQcm9taXNlL0RlZmVycmVkIHRvIGJlIHNldCBieSBjbGllbnQtc2NyaXB0IGFzICdoaWRlLWVkaXRvciAmXHJcbiAgICAgICAgICAvLyB2aWV3ZXItc2hvdyBtdXN0IHN0YXJ0IHdoZW4gdGhpcyBwcm9taXNlIGdldHMgZnVsbGZpbGxlZCcsIGFsbG93aW5nIHRvXHJcbiAgICAgICAgICAvLyBoYXZlIGEgc2VxdWVuY2UgKGZpcnN0IGNsaWVudC1zY3JpcHRzLCB0aGVuIGhpZGUtZWRpdG9yKS5cclxuXHJcbiAgICAgICAgICAvLyBNYXJrIGZvcm0gYXMgc2F2ZWQgdG8gcmVtb3ZlIHRoZSAnaGFzLWNoYW5nZXMnIG1hcmtcclxuICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGR0ci5maW5kKCdmb3JtJykuZ2V0KDApKTtcclxuXHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSk7XHJcblxyXG4gICAgICAgICAgLy8gV2UgbmVlZCBhIGN1c3RvbSBjb21wbGV0ZSBjYWxsYmFjaywgYnV0IHRvIG5vdCByZXBsYWNlIHRoZSB1c2VyIGNhbGxiYWNrLCB3ZVxyXG4gICAgICAgICAgLy8gY2xvbmUgZmlyc3QgdGhlIHNldHRpbmdzIGFuZCB0aGVuIGFwcGx5IG91ciBjYWxsYmFjayB0aGF0IGludGVybmFsbHkgd2lsbCBjYWxsXHJcbiAgICAgICAgICAvLyB0aGUgdXNlciBjYWxsYmFjayBwcm9wZXJseSAoaWYgYW55KVxyXG4gICAgICAgICAgdmFyIHdpdGhjYWxsYmFjayA9ICQuZXh0ZW5kKHRydWUsIHt9LCBpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLWVkaXRvciddKTtcclxuICAgICAgICAgIHdpdGhjYWxsYmFjay5jb21wbGV0ZSA9IG9uY29tcGxldGUod2l0aGNhbGxiYWNrLmNvbXBsZXRlKTtcclxuICAgICAgICAgIC8vIEhpZGluZyBlZGl0b3I6XHJcbiAgICAgICAgICBkdHIueGhpZGUod2l0aGNhbGxiYWNrKVxyXG4gICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLWhpZGRlbiddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgZHRyLmRlcXVldWUoKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGR0clxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLWNhbmNlbCcsIGZpbmlzaEVkaXQpXHJcbiAgICAgICAgLm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgJy5hamF4LWJveCcsIGZpbmlzaEVkaXQpXHJcbiAgICAgICAgLy8gQW4gZXZlbnRlZCBtZXRob2Q6IHRyaWdnZXIgdGhpcyBldmVudCB0byBleGVjdXRlIGEgdmlld2VyIHJlbG9hZDpcclxuICAgICAgICAub24oJ3JlbG9hZExpc3QnLCAnKicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZ3ci5maW5kKCcuY3J1ZGwtbGlzdCcpLnJlbG9hZCh7IGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2FqYXhTdWNjZXNzUG9zdCcsICdmb3JtLCBmaWVsZHNldCcsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwIHx8IGRhdGEuQ29kZSA9PSA1IHx8IGRhdGEuQ29kZSA9PSA2KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgdmlld2VyIGFuZCByZWxvYWQgbGlzdDpcclxuICAgICAgICAgICAgdndyLmZpbmQoJy5jcnVkbC1saXN0JykucmVsb2FkKHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEEgc21hbGwgZGVsYXkgdG8gbGV0IHVzZXIgdG8gc2VlIHRoZSBuZXcgbWVzc2FnZSBvbiBidXR0b24gYmVmb3JlXHJcbiAgICAgICAgICAvLyBoaWRlIGl0IChiZWNhdXNlIGlzIGluc2lkZSB0aGUgZWRpdG9yKVxyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PSA1KVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZpbmlzaEVkaXQsIDEwMDApO1xyXG5cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybSxmaWVsZHNldCcsIGZ1bmN0aW9uIChqYiwgZm9ybSwgangpIHtcclxuICAgICAgICAgIC8vIEVtaXQgdGhlICdlZGl0b3ItcmVhZHknIGV2ZW50IG9uIGVkaXRvciBIdG1sIGJlaW5nIHJlcGxhY2VkXHJcbiAgICAgICAgICAvLyAoZmlyc3QgbG9hZCBvciBuZXh0IGxvYWRzIGJlY2F1c2Ugb2Ygc2VydmVyLXNpZGUgdmFsaWRhdGlvbiBlcnJvcnMpXHJcbiAgICAgICAgICAvLyB0byBhbGxvdyBsaXN0ZW5lcnMgdG8gZG8gYW55IHdvcmsgb3ZlciBpdHMgKG5ldykgRE9NIGVsZW1lbnRzLlxyXG4gICAgICAgICAgLy8gVGhlIHNlY29uZCBjdXN0b20gcGFyYW1ldGVyIHBhc3NlZCBtZWFucyBpcyBtZWFuIHRvXHJcbiAgICAgICAgICAvLyBkaXN0aW5ndWlzaCB0aGUgZmlyc3QgdGltZSBjb250ZW50IGxvYWQgYW5kIHN1Y2Nlc3NpdmUgdXBkYXRlcyAoZHVlIHRvIHZhbGlkYXRpb24gZXJyb3JzKS5cclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgW2R0ciwgZWRpdG9ySW5pdGlhbExvYWRdKTtcclxuXHJcbiAgICAgICAgICAvLyBOZXh0IHRpbWVzOlxyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY3J1ZGwuZGF0YSgnX19jcnVkbF9pbml0aWFsaXplZF9fJywgdHJ1ZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIGluc3RhbmNlO1xyXG4gICAgfVxyXG4gIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gIFRoaXMgbW9kdWxlIGhhcyB1dGlsaXRpZXMgdG8gY29udmVydCBhIERhdGUgb2JqZWN0IGludG9cclxuICBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBmb2xsb3dpbmcgSVNPLTg2MDEgc3BlY2lmaWNhdGlvbi5cclxuICBcclxuICBJTkNPTVBMRVRFIEJVVCBVU0VGVUwuXHJcbiAgXHJcbiAgU3RhbmRhcmQgcmVmZXJzIHRvIGZvcm1hdCB2YXJpYXRpb25zOlxyXG4gIC0gYmFzaWM6IG1pbmltdW0gc2VwYXJhdG9yc1xyXG4gIC0gZXh0ZW5kZWQ6IGFsbCBzZXBhcmF0b3JzLCBtb3JlIHJlYWRhYmxlXHJcbiAgQnkgZGVmYXVsdCwgYWxsIG1ldGhvZHMgcHJpbnRzIHRoZSBiYXNpYyBmb3JtYXQsXHJcbiAgZXhjZXB0cyB0aGUgcGFyYW1ldGVyICdleHRlbmRlZCcgaXMgc2V0IHRvIHRydWVcclxuXHJcbiAgVE9ETzpcclxuICAtIFRaOiBhbGxvdyBmb3IgVGltZSBab25lIHN1ZmZpeGVzIChwYXJzZSBhbGxvdyBpdCBhbmQgXHJcbiAgICBkZXRlY3QgVVRDIGJ1dCBkbyBub3RoaW5nIHdpdGggYW55IHRpbWUgem9uZSBvZmZzZXQgZGV0ZWN0ZWQpXHJcbiAgLSBGcmFjdGlvbnMgb2Ygc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy5kYXRlVVRDID0gZnVuY3Rpb24gZGF0ZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBtID0gKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgIGQgPSBkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpLFxyXG4gICAgICB5ID0gZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcbiAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICBkID0gJzAnICsgZDtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIHkgKyAnLScgKyBtICsgJy0nICsgZDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4geSArIG0gKyBkO1xyXG59O1xyXG5cclxuZXhwb3J0cy5kYXRlTG9jYWwgPSBmdW5jdGlvbiBkYXRlTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgbSA9IChkYXRlLmdldE1vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICBkID0gZGF0ZS5nZXREYXRlKCkudG9TdHJpbmcoKSxcclxuICAgICAgeSA9IGRhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcbiAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICBkID0gJzAnICsgZDtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIHkgKyAnLScgKyBtICsgJy0nICsgZDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4geSArIG0gKyBkO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMsIG1pbnV0ZXMgYW5kIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMudGltZUxvY2FsID0gZnVuY3Rpb24gdGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIHMgPSBkYXRlLmdldFNlY29uZHMoKS50b1N0cmluZygpLFxyXG4gICAgICBobSA9IGV4cG9ydHMuc2hvcnRUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAocy5sZW5ndGggPT0gMSlcclxuICAgIHMgPSAnMCcgKyBzO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaG0gKyAnOicgKyBzO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBobSArIHM7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycywgbWludXRlcyBhbmQgc2Vjb25kcyBVVENcclxuKiovXHJcbmV4cG9ydHMudGltZVVUQyA9IGZ1bmN0aW9uIHRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgcyA9IGRhdGUuZ2V0VVRDU2Vjb25kcygpLnRvU3RyaW5nKCksXHJcbiAgICAgIGhtID0gZXhwb3J0cy5zaG9ydFRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAocy5sZW5ndGggPT0gMSlcclxuICAgIHMgPSAnMCcgKyBzO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaG0gKyAnOicgKyBzO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBobSArIHM7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycyBhbmQgbWludXRlc1xyXG4qKi9cclxuZXhwb3J0cy5zaG9ydFRpbWVMb2NhbCA9IGZ1bmN0aW9uIHNob3J0VGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIGggPSBkYXRlLmdldEhvdXJzKCkudG9TdHJpbmcoKSxcclxuICAgICAgbSA9IGRhdGUuZ2V0TWludXRlcygpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChoLmxlbmd0aCA9PSAxKVxyXG4gICAgaCA9ICcwJyArIGg7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGggKyAnOicgKyBtO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBoICsgbTtcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzIGFuZCBtaW51dGVzIFVUQ1xyXG4qKi9cclxuZXhwb3J0cy5zaG9ydFRpbWVVVEMgPSBmdW5jdGlvbiBzaG9ydFRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgaCA9IGRhdGUuZ2V0VVRDSG91cnMoKS50b1N0cmluZygpLFxyXG4gICAgICBtID0gZGF0ZS5nZXRVVENNaW51dGVzKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKGgubGVuZ3RoID09IDEpXHJcbiAgICBoID0gJzAnICsgaDtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaCArICc6JyArIG07XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGggKyBtO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgVE9ETzogSG91cnMsIG1pbnV0ZXMsIHNlY29uZHMgYW5kIGZyYWN0aW9ucyBvZiBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLmxvbmdUaW1lTG9jYWwgPSBmdW5jdGlvbiBsb25nVGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgLy9UT0RPXHJcbn07XHJcblxyXG4vKipcclxuICBVVEMgRGF0ZSBhbmQgVGltZSBzZXBhcmF0ZWQgYnkgVC5cclxuICBTdGFuZGFyZCBhbGxvd3Mgb21pdCB0aGUgc2VwYXJhdG9yIGFzIGV4Y2VwdGlvbmFsLCBib3RoIHBhcnRzIGFncmVlbWVudCwgY2FzZXM7XHJcbiAgY2FuIGJlIGRvbmUgcGFzc2luZyB0cnVlIGFzIG9mIG9taXRTZXBhcmF0b3IgcGFyYW1ldGVyLCBieSBkZWZhdWx0IGZhbHNlLlxyXG4qKi9cclxuZXhwb3J0cy5kYXRldGltZUxvY2FsID0gZnVuY3Rpb24gZGF0ZXRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCwgb21pdFNlcGFyYXRvcikge1xyXG4gIHZhciBkID0gZXhwb3J0cy5kYXRlTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpLFxyXG4gICAgICB0ID0gZXhwb3J0cy50aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAob21pdFNlcGFyYXRvcilcclxuICAgIHJldHVybiBkICsgdDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZCArICdUJyArIHQ7XHJcbn07XHJcblxyXG4vKipcclxuICBMb2NhbCBEYXRlIGFuZCBUaW1lIHNlcGFyYXRlZCBieSBULlxyXG4gIFN0YW5kYXJkIGFsbG93cyBvbWl0IHRoZSBzZXBhcmF0b3IgYXMgZXhjZXB0aW9uYWwsIGJvdGggcGFydHMgYWdyZWVtZW50LCBjYXNlcztcclxuICBjYW4gYmUgZG9uZSBwYXNzaW5nIHRydWUgYXMgb2Ygb21pdFNlcGFyYXRvciBwYXJhbWV0ZXIsIGJ5IGRlZmF1bHQgZmFsc2UuXHJcbioqL1xyXG5leHBvcnRzLmRhdGV0aW1lVVRDID0gZnVuY3Rpb24gZGF0ZXRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQsIG9taXRTZXBhcmF0b3IpIHtcclxuICB2YXIgZCA9IGV4cG9ydHMuZGF0ZVVUQyhkYXRlLCBleHRlbmRlZCksXHJcbiAgICAgIHQgPSBleHBvcnRzLnRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAob21pdFNlcGFyYXRvcilcclxuICAgIHJldHVybiBkICsgdDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZCArICdUJyArIHQ7XHJcbn07XHJcblxyXG4vKipcclxuICBQYXJzZSBhIHN0cmluZyBpbnRvIGEgRGF0ZSBvYmplY3QgaWYgaXMgYSB2YWxpZCBJU08tODYwMSBmb3JtYXQuXHJcbiAgUGFyc2Ugc2luZ2xlIGRhdGUsIHNpbmdsZSB0aW1lIG9yIGRhdGUtdGltZSBmb3JtYXRzLlxyXG4gIElNUE9SVEFOVDogSXQgZG9lcyBOT1QgY29udmVydCBiZXR3ZWVuIHRoZSBkYXRlc3RyIFRpbWVab25lIGFuZCB0aGVcclxuICBsb2NhbCBUaW1lWm9uZSAoZWl0aGVyIGl0IGFsbG93cyBkYXRlc3RyIHRvIGluY2x1ZGVkIFRpbWVab25lIGluZm9ybWF0aW9uKVxyXG4gIFRPRE86IE9wdGlvbmFsIFQgc2VwYXJhdG9yIGlzIG5vdCBhbGxvd2VkLlxyXG4gIFRPRE86IE1pbGxpc2Vjb25kcy9mcmFjdGlvbnMgb2Ygc2Vjb25kcyBub3Qgc3VwcG9ydGVkXHJcbioqL1xyXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UoZGF0ZXN0cikge1xyXG4gIHZhciBkdCA9IGRhdGVzdHIuc3BsaXQoJ1QnKSxcclxuICAgIGRhdGUgPSBkdFswXSxcclxuICAgIHRpbWUgPSBkdC5sZW5ndGggPT0gMiA/IGR0WzFdIDogbnVsbDtcclxuXHJcbiAgaWYgKGR0Lmxlbmd0aCA+IDIpXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgZm9ybWF0XCIpO1xyXG5cclxuICAvLyBDaGVjayBpZiBkYXRlIGNvbnRhaW5zIGEgdGltZTtcclxuICAvLyBiZWNhdXNlIG1heWJlIGRhdGVzdHIgaXMgb25seSB0aGUgdGltZSBwYXJ0XHJcbiAgaWYgKC86fF5cXGR7NCw2fVteXFwtXShcXC5cXGQqKT8oPzpafFsrXFwtXS4qKT8kLy50ZXN0KGRhdGUpKSB7XHJcbiAgICB0aW1lID0gZGF0ZTtcclxuICAgIGRhdGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgdmFyIHksIG0sIGQsIGgsIG1tLCBzLCB0eiwgdXRjO1xyXG5cclxuICBpZiAoZGF0ZSkge1xyXG4gICAgdmFyIGRwYXJ0cyA9IC8oXFxkezR9KVxcLT8oXFxkezJ9KVxcLT8oXFxkezJ9KS8uZXhlYyhkYXRlKTtcclxuICAgIGlmICghZHBhcnRzKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgZGF0ZSBmb3JtYXRcIik7XHJcblxyXG4gICAgeSA9IGRwYXJ0c1sxXTtcclxuICAgIG0gPSBkcGFydHNbMl07XHJcbiAgICBkID0gZHBhcnRzWzNdO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRpbWUpIHtcclxuICAgIHZhciB0cGFydHMgPSAvKFxcZHsyfSk6PyhcXGR7Mn0pKD86Oj8oXFxkezJ9KSk/KFp8WytcXC1dLiopPy8uZXhlYyh0aW1lKTtcclxuICAgIGlmICghdHBhcnRzKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgdGltZSBmb3JtYXRcIik7XHJcblxyXG4gICAgaCA9IHRwYXJ0c1sxXTtcclxuICAgIG1tID0gdHBhcnRzWzJdO1xyXG4gICAgcyA9IHRwYXJ0cy5sZW5ndGggPiAzID8gdHBhcnRzWzNdIDogbnVsbDtcclxuICAgIHR6ID0gdHBhcnRzLmxlbmd0aCA+IDQgPyB0cGFydHNbNF0gOiBudWxsO1xyXG4gICAgLy8gRGV0ZWN0cyBpZiBpcyBhIHRpbWUgaW4gVVRDOlxyXG4gICAgdXRjID0gL15aJC9pLnRlc3QodHopO1xyXG4gIH1cclxuXHJcbiAgLy8gVmFyIHRvIGhvbGQgdGhlIHBhcnNlZCB2YWx1ZSwgd2Ugc3RhcnQgd2l0aCB0b2RheSxcclxuICAvLyB0aGF0IHdpbGwgZmlsbCB0aGUgbWlzc2luZyBwYXJ0c1xyXG4gIHZhciBwYXJzZWREYXRlID0gbmV3IERhdGUoKTtcclxuXHJcbiAgaWYgKGRhdGUpIHtcclxuICAgIC8vIFVwZGF0aW5nIHRoZSBkYXRlIG9iamVjdCB3aXRoIGVhY2ggeWVhciwgbW9udGggYW5kIGRhdGUvZGF5IGRldGVjdGVkOlxyXG4gICAgaWYgKHV0YylcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRVVENGdWxsWWVhcih5LCBtLCBkKTtcclxuICAgIGVsc2VcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRGdWxsWWVhcih5LCBtLCBkKTtcclxuICB9XHJcblxyXG4gIGlmICh0aW1lKSB7XHJcbiAgICBpZiAodXRjKVxyXG4gICAgICBwYXJzZWREYXRlLnNldFVUQ0hvdXJzKGgsIG1tLCBzKTtcclxuICAgIGVsc2VcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRIb3VycyhoLCBtbSwgcyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIEEgZGF0ZSB3aXRob3V0IHRpbWUgcGFydCBtdXN0IGJlIGNvbnNpZGVyZWQgYXMgMDA6MDA6MDAgaW5zdGVhZCBvZiBjdXJyZW50IHRpbWVcclxuICAgIHBhcnNlZERhdGUuc2V0SG91cnMoMCwgMCwgMCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGFyc2VkRGF0ZTtcclxufTsiLCIvKiBEYXRlIHBpY2tlciBpbml0aWFsaXphdGlvbiBhbmQgdXNlXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwRGF0ZVBpY2tlcigpIHtcclxuICAgIC8vIERhdGUgUGlja2VyXHJcbiAgICAkLmRhdGVwaWNrZXIuc2V0RGVmYXVsdHMoJC5kYXRlcGlja2VyLnJlZ2lvbmFsWyQoJ2h0bWwnKS5hdHRyKCdsYW5nJyldKTtcclxuICAgICQoJy5kYXRlLXBpY2snLCBkb2N1bWVudCkuZGF0ZXBpY2tlcih7XHJcbiAgICAgICAgc2hvd0FuaW06ICdibGluZCdcclxuICAgIH0pO1xyXG4gICAgYXBwbHlEYXRlUGlja2VyKCk7XHJcbn1cclxuZnVuY3Rpb24gYXBwbHlEYXRlUGlja2VyKGVsZW1lbnQpIHtcclxuICAgICQoXCIuZGF0ZS1waWNrXCIsIGVsZW1lbnQgfHwgZG9jdW1lbnQpXHJcbiAgICAvLy52YWwobmV3IERhdGUoKS5hc1N0cmluZygkLmRhdGVwaWNrZXIuX2RlZmF1bHRzLmRhdGVGb3JtYXQpKVxyXG4gICAgLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIHNob3dBbmltOiBcImJsaW5kXCJcclxuICAgIH0pO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBzZXR1cERhdGVQaWNrZXIsXHJcbiAgICAgICAgYXBwbHk6IGFwcGx5RGF0ZVBpY2tlclxyXG4gICAgfTtcclxuIiwiLyogRm9ybWF0IGEgZGF0ZSBhcyBZWVlZLU1NLUREIGluIFVUQyBmb3Igc2F2ZSB1c1xyXG4gICAgdG8gaW50ZXJjaGFuZ2Ugd2l0aCBvdGhlciBtb2R1bGVzIG9yIGFwcHMuXHJcbiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nKGRhdGUpIHtcclxuICAgIHZhciBtID0gKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgICAgZCA9IGRhdGUuZ2V0VVRDRGF0ZSgpLnRvU3RyaW5nKCk7XHJcbiAgICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgICAgICBtID0gJzAnICsgbTtcclxuICAgIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgIGQgPSAnMCcgKyBkO1xyXG4gICAgcmV0dXJuIGRhdGUuZ2V0VVRDRnVsbFllYXIoKS50b1N0cmluZygpICsgJy0nICsgbSArICctJyArIGQ7XHJcbn07IiwiLyoqIEFuIGkxOG4gdXRpbGl0eSwgZ2V0IGEgdHJhbnNsYXRpb24gdGV4dCBieSBsb29raW5nIGZvciBzcGVjaWZpYyBlbGVtZW50cyBpbiB0aGUgaHRtbFxyXG53aXRoIHRoZSBuYW1lIGdpdmVuIGFzIGZpcnN0IHBhcmFtZW50ZXIgYW5kIGFwcGx5aW5nIHRoZSBnaXZlbiB2YWx1ZXMgb24gc2Vjb25kIGFuZCBcclxub3RoZXIgcGFyYW1ldGVycy5cclxuICAgIFRPRE86IFJFLUlNUExFTUVOVCBub3QgdXNpbmcgalF1ZXJ5IG5lbHNlIERPTSBlbGVtZW50cywgb3IgYWxtb3N0IG5vdCBlbGVtZW50cyBpbnNpZGUgYm9keVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbmZ1bmN0aW9uIGdldFRleHQoKSB7XHJcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuICAgIC8vIEdldCBrZXkgYW5kIHRyYW5zbGF0ZSBpdFxyXG4gICAgdmFyIGZvcm1hdHRlZCA9IGFyZ3NbMF07XHJcbiAgICB2YXIgdGV4dCA9ICQoJyNsY3Jlcy0nICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShmb3JtYXR0ZWQpKS50ZXh0KCk7XHJcbiAgICBpZiAodGV4dClcclxuICAgICAgICBmb3JtYXR0ZWQgPSB0ZXh0O1xyXG4gICAgLy8gQXBwbHkgZm9ybWF0IHRvIHRoZSB0ZXh0IHdpdGggYWRkaXRpb25hbCBwYXJhbWV0ZXJzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXFxcXHsnICsgaSArICdcXFxcfScsICdnaScpO1xyXG4gICAgICAgIGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5yZXBsYWNlKHJlZ2V4cCwgYXJnc1tpICsgMV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZvcm1hdHRlZDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnZXRUZXh0OyIsIi8qKiBSZXR1cm5zIHRoZSBwYXRoIHRvIHRoZSBnaXZlbiBlbGVtZW50IGluIFhQYXRoIGNvbnZlbnRpb25cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBnZXRYUGF0aChlbGVtZW50KSB7XHJcbiAgICBpZiAoZWxlbWVudCAmJiBlbGVtZW50LmlkKVxyXG4gICAgICAgIHJldHVybiAnLy8qW0BpZD1cIicgKyBlbGVtZW50LmlkICsgJ1wiXSc7XHJcbiAgICB2YXIgeHBhdGggPSAnJztcclxuICAgIGZvciAoOyBlbGVtZW50ICYmIGVsZW1lbnQubm9kZVR5cGUgPT0gMTsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgIHZhciBpZCA9ICQoZWxlbWVudC5wYXJlbnROb2RlKS5jaGlsZHJlbihlbGVtZW50LnRhZ05hbWUpLmluZGV4KGVsZW1lbnQpICsgMTtcclxuICAgICAgICBpZCA9IChpZCA+IDEgPyAnWycgKyBpZCArICddJyA6ICcnKTtcclxuICAgICAgICB4cGF0aCA9ICcvJyArIGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpICsgaWQgKyB4cGF0aDtcclxuICAgIH1cclxuICAgIHJldHVybiB4cGF0aDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnZXRYUGF0aDtcclxuIiwiLy8gSXQgZXhlY3V0ZXMgdGhlIGdpdmVuICdyZWFkeScgZnVuY3Rpb24gYXMgcGFyYW1ldGVyIHdoZW5cclxuLy8gbWFwIGVudmlyb25tZW50IGlzIHJlYWR5ICh3aGVuIGdvb2dsZSBtYXBzIGFwaSBhbmQgc2NyaXB0IGlzXHJcbi8vIGxvYWRlZCBhbmQgcmVhZHkgdG8gdXNlLCBvciBpbm1lZGlhdGVseSBpZiBpcyBhbHJlYWR5IGxvYWRlZCkuXHJcblxyXG52YXIgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcclxuXHJcbi8vIFByaXZhdGUgc3RhdGljIGNvbGxlY3Rpb24gb2YgY2FsbGJhY2tzIHJlZ2lzdGVyZWRcclxudmFyIHN0YWNrID0gW107XHJcblxyXG52YXIgZ29vZ2xlTWFwUmVhZHkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdvb2dsZU1hcFJlYWR5KHJlYWR5KSB7XHJcbiAgICBzdGFjay5wdXNoKHJlYWR5KTtcclxuXHJcbiAgICBpZiAoZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSlcclxuICAgICAgICByZWFkeSgpO1xyXG4gICAgZWxzZSBpZiAoIWdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZykge1xyXG4gICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IHRydWU7XHJcbiAgICAgICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICAgICAgICBzY3JpcHRzOiBbJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vanNhcGknXSxcclxuICAgICAgICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHsgcmV0dXJuICEhd2luZG93Lmdvb2dsZTsgfSxcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGdvb2dsZS5sb2FkKCdtYXBzJywgJzMuMTYnLFxyXG4gICAgICAgICAgICAgICAgICAgIHsgb3RoZXJfcGFyYW1zOiAnc2Vuc29yPWZhbHNlJywgY2FsbGJhY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tbaV0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyBVdGlsaXR5IHRvIGZvcmNlIHRoZSByZWZyZXNoIG9mIG1hcHMgdGhhdCBzb2x2ZSB0aGUgcHJvYmxlbSB3aXRoIGJhZC1zaXplZCBtYXAgYXJlYVxyXG5nb29nbGVNYXBSZWFkeS5yZWZyZXNoTWFwID0gZnVuY3Rpb24gcmVmcmVzaE1hcHMobWFwKSB7XHJcbiAgICBnb29nbGVNYXBSZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gRG9uJ3QgZm9yZ2V0IHRoZSBjZW50ZXIhXHJcbiAgICAgICAgdmFyIGNlbnRlciA9IG1hcC5nZXRDZW50ZXIoKTtcclxuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lck9uY2UobWFwLCAncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBSZXN0b3JlIGNlbnRlclxyXG4gICAgICAgICAgICBpZiAoY2VudGVyKVxyXG4gICAgICAgICAgICAgICAgbWFwLnNldENlbnRlcihjZW50ZXIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIobWFwLCAncmVzaXplJyk7XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyogR1VJRCBHZW5lcmF0b3JcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ3VpZEdlbmVyYXRvcigpIHtcclxuICAgIHZhciBTNCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCgoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMCkgfCAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiAoUzQoKSArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBTNCgpICsgUzQoKSk7XHJcbn07IiwiLyoqXHJcbiAgICBHZW5lcmljIHNjcmlwdCBmb3IgZmllbGRzZXRzIHdpdGggY2xhc3MgLmhhcy1jb25maXJtLCBhbGxvd2luZyBzaG93XHJcbiAgICB0aGUgY29udGVudCBvbmx5IGlmIHRoZSBtYWluIGNvbmZpcm0gZmllbGRzIGhhdmUgJ3llcycgc2VsZWN0ZWQuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIGRlZmF1bHRTZWxlY3RvciA9ICdmaWVsZHNldC5oYXMtY29uZmlybSA+IC5jb25maXJtIGlucHV0JztcclxuXHJcbmZ1bmN0aW9uIG9uY2hhbmdlKCkge1xyXG4gICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGZzID0gdC5jbG9zZXN0KCdmaWVsZHNldCcpO1xyXG4gICAgaWYgKHQuaXMoJzpjaGVja2VkJykpXHJcbiAgICAgICAgaWYgKHQudmFsKCkgPT0gJ3llcycgfHwgdC52YWwoKSA9PSAnVHJ1ZScpXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKCdjb25maXJtZWQtbm8nKS5hZGRDbGFzcygnY29uZmlybWVkLXllcycpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3MoJ2NvbmZpcm1lZC15ZXMnKS5hZGRDbGFzcygnY29uZmlybWVkLW5vJyk7XHJcbn1cclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgZGVmYXVsdFNlbGVjdG9yO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCBzZWxlY3Rvciwgb25jaGFuZ2UpO1xyXG4gICAgLy8gUGVyZm9ybXMgZmlyc3QgY2hlY2s6XHJcbiAgICAkKHNlbGVjdG9yKS5jaGFuZ2UoKTtcclxufTtcclxuXHJcbmV4cG9ydHMub2ZmID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IGRlZmF1bHRTZWxlY3RvcjtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2NoYW5nZScsIHNlbGVjdG9yKTtcclxufTsiLCIvKiBJbnRlcm5hemlvbmFsaXphdGlvbiBVdGlsaXRpZXNcclxuICovXHJcbnZhciBpMThuID0ge307XHJcbmkxOG4uZGlzdGFuY2VVbml0cyA9IHtcclxuICAgICdFUyc6ICdrbScsXHJcbiAgICAnVVMnOiAnbWlsZXMnXHJcbn07XHJcbmkxOG4ubnVtZXJpY01pbGVzU2VwYXJhdG9yID0ge1xyXG4gICAgJ2VzLUVTJzogJy4nLFxyXG4gICAgJ2VzLVVTJzogJy4nLFxyXG4gICAgJ2VuLVVTJzogJywnLFxyXG4gICAgJ2VuLUVTJzogJywnXHJcbn07XHJcbmkxOG4ubnVtZXJpY0RlY2ltYWxTZXBhcmF0b3IgPSB7XHJcbiAgICAnZXMtRVMnOiAnLCcsXHJcbiAgICAnZXMtVVMnOiAnLCcsXHJcbiAgICAnZW4tVVMnOiAnLicsXHJcbiAgICAnZW4tRVMnOiAnLidcclxufTtcclxuaTE4bi5tb25leVN5bWJvbFByZWZpeCA9IHtcclxuICAgICdFUyc6ICcnLFxyXG4gICAgJ1VTJzogJyQnXHJcbn07XHJcbmkxOG4ubW9uZXlTeW1ib2xTdWZpeCA9IHtcclxuICAgICdFUyc6ICfigqwnLFxyXG4gICAgJ1VTJzogJydcclxufTtcclxuaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSA9IGZ1bmN0aW9uIGdldEN1cnJlbnRDdWx0dXJlKCkge1xyXG4gICAgdmFyIGMgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKTtcclxuICAgIHZhciBzID0gYy5zcGxpdCgnLScpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdWx0dXJlOiBjLFxyXG4gICAgICAgIGxhbmd1YWdlOiBzWzBdLFxyXG4gICAgICAgIGNvdW50cnk6IHNbMV1cclxuICAgIH07XHJcbn07XHJcbmkxOG4uY29udmVydE1pbGVzS20gPSBmdW5jdGlvbiBjb252ZXJ0TWlsZXNLbShxLCB1bml0KSB7XHJcbiAgICB2YXIgTUlMRVNfVE9fS00gPSAxLjYwOTtcclxuICAgIGlmICh1bml0ID09ICdtaWxlcycpXHJcbiAgICAgICAgcmV0dXJuIE1JTEVTX1RPX0tNICogcTtcclxuICAgIGVsc2UgaWYgKHVuaXQgPT0gJ2ttJylcclxuICAgICAgICByZXR1cm4gcSAvIE1JTEVTX1RPX0tNO1xyXG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5sb2cpIGNvbnNvbGUubG9nKCdjb252ZXJ0TWlsZXNLbTogVW5yZWNvZ25pemVkIHVuaXQgJyArIHVuaXQpO1xyXG4gICAgcmV0dXJuIDA7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGkxOG47IiwiLyogUmV0dXJucyB0cnVlIHdoZW4gc3RyIGlzXHJcbi0gbnVsbFxyXG4tIGVtcHR5IHN0cmluZ1xyXG4tIG9ubHkgd2hpdGUgc3BhY2VzIHN0cmluZ1xyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzRW1wdHlTdHJpbmcoc3RyKSB7XHJcbiAgICByZXR1cm4gISgvXFxTL2cudGVzdChzdHIgfHwgXCJcIikpO1xyXG59OyIsIi8qKiBBcyB0aGUgJ2lzJyBqUXVlcnkgbWV0aG9kLCBidXQgY2hlY2tpbmcgQHNlbGVjdG9yIGluIGFsbCBlbGVtZW50c1xyXG4qIEBtb2RpZmllciB2YWx1ZXM6XHJcbiogLSAnYWxsJzogYWxsIGVsZW1lbnRzIG11c3QgbWF0Y2ggc2VsZWN0b3IgdG8gcmV0dXJuIHRydWVcclxuKiAtICdhbG1vc3Qtb25lJzogYWxtb3N0IG9uZSBlbGVtZW50IG11c3QgbWF0Y2hcclxuKiAtICdwZXJjZW50YWdlJzogcmV0dXJucyBwZXJjZW50YWdlIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG1hdGNoIHNlbGVjdG9yICgwLTEwMClcclxuKiAtICdzdW1tYXJ5JzogcmV0dXJucyB0aGUgb2JqZWN0IHsgeWVzOiBudW1iZXIsIG5vOiBudW1iZXIsIHBlcmNlbnRhZ2U6IG51bWJlciwgdG90YWw6IG51bWJlciB9XHJcbiogLSB7anVzdDogYSBudW1iZXJ9OiBleGFjdCBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbiogLSB7YWxtb3N0OiBhIG51bWJlcn06IG1pbmltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qIC0ge3VudGlsOiBhIG51bWJlcn06IG1heGltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uYXJlID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBtb2RpZmllcikge1xyXG4gICAgbW9kaWZpZXIgPSBtb2RpZmllciB8fCAnYWxsJztcclxuICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmlzKHNlbGVjdG9yKSlcclxuICAgICAgICAgICAgY291bnQrKztcclxuICAgIH0pO1xyXG4gICAgc3dpdGNoIChtb2RpZmllcikge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCA9PSBjb3VudDtcclxuICAgICAgICBjYXNlICdhbG1vc3Qtb25lJzpcclxuICAgICAgICAgICAgcmV0dXJuIGNvdW50ID4gMDtcclxuICAgICAgICBjYXNlICdwZXJjZW50YWdlJzpcclxuICAgICAgICAgICAgcmV0dXJuIGNvdW50IC8gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgY2FzZSAnc3VtbWFyeSc6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB5ZXM6IGNvdW50LFxyXG4gICAgICAgICAgICAgICAgbm86IHRoaXMubGVuZ3RoIC0gY291bnQsXHJcbiAgICAgICAgICAgICAgICBwZXJjZW50YWdlOiBjb3VudCAvIHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgdG90YWw6IHRoaXMubGVuZ3RoXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCdqdXN0JyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuanVzdCAhPSBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ2FsbW9zdCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLmFsbW9zdCA+IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICgndW50aWwnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci51bnRpbCA8IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICB9XHJcbn07IiwiLyoqID09PT09PT09PT09PT09PT09PT1cclxuRXh0ZW5zaW9uIGpxdWVyeTogJ2JvdW5kcydcclxuUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgY29tYmluZWQgYm91bmRzIGZvciBhbGwgXHJcbmVsZW1lbnRzIGluIHRoZSBjb2xsZWN0aW9uXHJcbiovXHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgalF1ZXJ5LmZuLmJvdW5kcyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHtcclxuICAgICAgaW5jbHVkZUJvcmRlcjogZmFsc2UsXHJcbiAgICAgIGluY2x1ZGVNYXJnaW46IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgIHZhciBib3VuZHMgPSB7XHJcbiAgICAgIGxlZnQ6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcclxuICAgICAgdG9wOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHJpZ2h0OiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIGJvdHRvbTogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLFxyXG4gICAgICB3aWR0aDogTnVtYmVyLk5hTixcclxuICAgICAgaGVpZ2h0OiBOdW1iZXIuTmFOXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBmbldpZHRoID0gb3B0aW9ucy5pbmNsdWRlQm9yZGVyIHx8IG9wdGlvbnMuaW5jbHVkZU1hcmdpbiA/IFxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLm91dGVyV2lkdGguY2FsbChlbCwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luKTsgfSA6XHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ud2lkdGguY2FsbChlbCk7IH07XHJcbiAgICB2YXIgZm5IZWlnaHQgPSBvcHRpb25zLmluY2x1ZGVCb3JkZXIgfHwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luID8gXHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ub3V0ZXJIZWlnaHQuY2FsbChlbCwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luKTsgfSA6XHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4uaGVpZ2h0LmNhbGwoZWwpOyB9O1xyXG5cclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoaSwgZWwpIHtcclxuICAgICAgdmFyIGVsUSA9ICQoZWwpO1xyXG4gICAgICB2YXIgb2ZmID0gZWxRLm9mZnNldCgpO1xyXG4gICAgICBvZmYucmlnaHQgPSBvZmYubGVmdCArIGZuV2lkdGgoJChlbFEpKTtcclxuICAgICAgb2ZmLmJvdHRvbSA9IG9mZi50b3AgKyBmbkhlaWdodCgkKGVsUSkpO1xyXG5cclxuICAgICAgaWYgKG9mZi5sZWZ0IDwgYm91bmRzLmxlZnQpXHJcbiAgICAgICAgYm91bmRzLmxlZnQgPSBvZmYubGVmdDtcclxuXHJcbiAgICAgIGlmIChvZmYudG9wIDwgYm91bmRzLnRvcClcclxuICAgICAgICBib3VuZHMudG9wID0gb2ZmLnRvcDtcclxuXHJcbiAgICAgIGlmIChvZmYucmlnaHQgPiBib3VuZHMucmlnaHQpXHJcbiAgICAgICAgYm91bmRzLnJpZ2h0ID0gb2ZmLnJpZ2h0O1xyXG5cclxuICAgICAgaWYgKG9mZi5ib3R0b20gPiBib3VuZHMuYm90dG9tKVxyXG4gICAgICAgIGJvdW5kcy5ib3R0b20gPSBvZmYuYm90dG9tO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYm91bmRzLndpZHRoID0gYm91bmRzLnJpZ2h0IC0gYm91bmRzLmxlZnQ7XHJcbiAgICBib3VuZHMuaGVpZ2h0ID0gYm91bmRzLmJvdHRvbSAtIGJvdW5kcy50b3A7XHJcbiAgICByZXR1cm4gYm91bmRzO1xyXG4gIH07XHJcbn0pKCk7IiwiLyoqXHJcbiogSGFzU2Nyb2xsQmFyIHJldHVybnMgYW4gb2JqZWN0IHdpdGggYm9vbCBwcm9wZXJ0aWVzICd2ZXJ0aWNhbCcgYW5kICdob3Jpem9udGFsJ1xyXG4qIHNheWluZyBpZiB0aGUgZWxlbWVudCBoYXMgbmVlZCBvZiBzY3JvbGxiYXJzIGZvciBlYWNoIGRpbWVuc2lvbiBvciBub3QgKGVsZW1lbnRcclxuKiBjYW4gbmVlZCBzY3JvbGxiYXJzIGFuZCBzdGlsbCBub3QgYmVpbmcgc2hvd2VkIGJlY2F1c2UgdGhlIGNzcy1vdmVybGZsb3cgcHJvcGVydHlcclxuKiBiZWluZyBzZXQgYXMgJ2hpZGRlbicsIGJ1dCBzdGlsbCB3ZSBrbm93IHRoYXQgdGhlIGVsZW1lbnQgcmVxdWlyZXMgaXQgYW5kIGl0c1xyXG4qIGNvbnRlbnQgaXMgbm90IGJlaW5nIGZ1bGx5IGRpc3BsYXllZCkuXHJcbiogQGV4dHJhZ2FwLCBkZWZhdWx0cyB0byB7eDowLHk6MH0sIGxldHMgc3BlY2lmeSBhbiBleHRyYSBzaXplIGluIHBpeGVscyBmb3IgZWFjaCBkaW1lbnNpb24gdGhhdCBhbHRlciB0aGUgcmVhbCBjaGVjayxcclxuKiByZXN1bHRpbmcgaW4gYSBmYWtlIHJlc3VsdCB0aGF0IGNhbiBiZSBpbnRlcmVzdGluZyB0byBkaXNjYXJkIHNvbWUgcGl4ZWxzIG9mIGV4Y2Vzc1xyXG4qIHNpemUgKG5lZ2F0aXZlIHZhbHVlcykgb3IgZXhhZ2VyYXRlIHRoZSByZWFsIHVzZWQgc2l6ZSB3aXRoIHRoYXQgZXh0cmEgcGl4ZWxzIChwb3NpdGl2ZSB2YWx1ZXMpLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uaGFzU2Nyb2xsQmFyID0gZnVuY3Rpb24gKGV4dHJhZ2FwKSB7XHJcbiAgICBleHRyYWdhcCA9ICQuZXh0ZW5kKHtcclxuICAgICAgICB4OiAwLFxyXG4gICAgICAgIHk6IDBcclxuICAgIH0sIGV4dHJhZ2FwKTtcclxuICAgIGlmICghdGhpcyB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHsgdmVydGljYWw6IGZhbHNlLCBob3Jpem9udGFsOiBmYWxzZSB9O1xyXG4gICAgLy9ub3RlOiBjbGllbnRIZWlnaHQ9IGhlaWdodCBvZiBob2xkZXJcclxuICAgIC8vc2Nyb2xsSGVpZ2h0PSB3ZSBoYXZlIGNvbnRlbnQgdGlsbCB0aGlzIGhlaWdodFxyXG4gICAgdmFyIHQgPSB0aGlzLmdldCgwKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdmVydGljYWw6IHRoaXMub3V0ZXJIZWlnaHQoZmFsc2UpIDwgKHQuc2Nyb2xsSGVpZ2h0ICsgZXh0cmFnYXAueSksXHJcbiAgICAgICAgaG9yaXpvbnRhbDogdGhpcy5vdXRlcldpZHRoKGZhbHNlKSA8ICh0LnNjcm9sbFdpZHRoICsgZXh0cmFnYXAueClcclxuICAgIH07XHJcbn07IiwiLyoqIENoZWNrcyBpZiBjdXJyZW50IGVsZW1lbnQgb3Igb25lIG9mIHRoZSBjdXJyZW50IHNldCBvZiBlbGVtZW50cyBoYXNcclxuYSBwYXJlbnQgdGhhdCBtYXRjaCB0aGUgZWxlbWVudCBvciBleHByZXNzaW9uIGdpdmVuIGFzIGZpcnN0IHBhcmFtZXRlclxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uaXNDaGlsZE9mID0gZnVuY3Rpb24galF1ZXJ5X3BsdWdpbl9pc0NoaWxkT2YoZXhwKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnRzKCkuZmlsdGVyKGV4cCkubGVuZ3RoID4gMDtcclxufTsiLCIvKipcclxuICAgIEdldHMgdGhlIGh0bWwgc3RyaW5nIG9mIHRoZSBmaXJzdCBlbGVtZW50IGFuZCBhbGwgaXRzIGNvbnRlbnQuXHJcbiAgICBUaGUgJ2h0bWwnIG1ldGhvZCBvbmx5IHJldHJpZXZlcyB0aGUgaHRtbCBzdHJpbmcgb2YgdGhlIGNvbnRlbnQsIG5vdCB0aGUgZWxlbWVudCBpdHNlbGYuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5vdXRlckh0bWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRoaXMgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAnJztcclxuICAgIHZhciBlbCA9IHRoaXMuZ2V0KDApO1xyXG4gICAgdmFyIGh0bWwgPSAnJztcclxuICAgIGlmIChlbC5vdXRlckhUTUwpXHJcbiAgICAgICAgaHRtbCA9IGVsLm91dGVySFRNTDtcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGh0bWwgPSB0aGlzLndyYXBBbGwoJzxkaXY+PC9kaXY+JykucGFyZW50KCkuaHRtbCgpO1xyXG4gICAgICAgIHRoaXMudW53cmFwKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaHRtbDtcclxufTsiLCIvKipcclxuICAgIFVzaW5nIHRoZSBhdHRyaWJ1dGUgZGF0YS1zb3VyY2UtdXJsIG9uIGFueSBIVE1MIGVsZW1lbnQsXHJcbiAgICB0aGlzIGFsbG93cyByZWxvYWQgaXRzIGNvbnRlbnQgcGVyZm9ybWluZyBhbiBBSkFYIG9wZXJhdGlvblxyXG4gICAgb24gdGhlIGdpdmVuIFVSTCBvciB0aGUgb25lIGluIHRoZSBhdHRyaWJ1dGU7IHRoZSBlbmQtcG9pbnRcclxuICAgIG11c3QgcmV0dXJuIHRleHQvaHRtbCBjb250ZW50LlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIERlZmF1bHQgc3VjY2VzcyBjYWxsYmFjayBhbmQgcHVibGljIHV0aWxpdHksIGJhc2ljIGhvdy10byByZXBsYWNlIGVsZW1lbnQgY29udGVudCB3aXRoIGZldGNoZWQgaHRtbFxyXG5mdW5jdGlvbiB1cGRhdGVFbGVtZW50KGh0bWxDb250ZW50LCBjb250ZXh0KSB7XHJcbiAgICBjb250ZXh0ID0gJC5pc1BsYWluT2JqZWN0KGNvbnRleHQpICYmIGNvbnRleHQgPyBjb250ZXh0IDogdGhpcztcclxuXHJcbiAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgIC8vIEF2b2lkIGVtcHR5IGRvY3VtZW50cyBiZWluZyBwYXJzZWQgKHJhaXNlIGVycm9yKVxyXG4gICAgaHRtbENvbnRlbnQgPSAkLnRyaW0oaHRtbENvbnRlbnQpO1xyXG4gICAgaWYgKGh0bWxDb250ZW50KSB7XHJcbiAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhbiBlbXB0eSBkb2N1bWVudCBvciBtYWxmb3JtZWQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoaHRtbENvbnRlbnQpKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBuZXdodG1sID0gJChodG1sQ29udGVudCk7XHJcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBlbGVtZW50ID0gY29udGV4dC5lbGVtZW50O1xyXG4gICAgaWYgKGNvbnRleHQub3B0aW9ucy5tb2RlID09ICdyZXBsYWNlLW1lJylcclxuICAgICAgICBlbGVtZW50LnJlcGxhY2VXaXRoKG5ld2h0bWwpO1xyXG4gICAgZWxzZSAvLyAncmVwbGFjZS1jb250ZW50J1xyXG4gICAgICAgIGVsZW1lbnQuaHRtbChuZXdodG1sKTtcclxuXHJcbiAgICByZXR1cm4gY29udGV4dDtcclxufVxyXG5cclxuLy8gRGVmYXVsdCBjb21wbGV0ZSBjYWxsYmFjayBhbmQgcHVibGljIHV0aWxpdHlcclxuZnVuY3Rpb24gc3RvcExvYWRpbmdTcGlubmVyKCkge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuZWxlbWVudCk7XHJcbn1cclxuXHJcbi8vIERlZmF1bHRzXHJcbnZhciBkZWZhdWx0cyA9IHtcclxuICAgIHVybDogbnVsbCxcclxuICAgIHN1Y2Nlc3M6IFt1cGRhdGVFbGVtZW50XSxcclxuICAgIGVycm9yOiBbXSxcclxuICAgIGNvbXBsZXRlOiBbc3RvcExvYWRpbmdTcGlubmVyXSxcclxuICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgIG1vZGU6ICdyZXBsYWNlLWNvbnRlbnQnLFxyXG4gICAgbG9hZGluZzoge1xyXG4gICAgICAgIGxvY2tFbGVtZW50OiB0cnVlLFxyXG4gICAgICAgIGxvY2tPcHRpb25zOiB7fSxcclxuICAgICAgICBtZXNzYWdlOiBudWxsLFxyXG4gICAgICAgIHNob3dMb2FkaW5nSW5kaWNhdG9yOiB0cnVlLFxyXG4gICAgICAgIGRlbGF5OiAwXHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiBSZWxvYWQgbWV0aG9kICovXHJcbnZhciByZWxvYWQgPSAkLmZuLnJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIE9wdGlvbnMgZnJvbSBkZWZhdWx0cyAoaW50ZXJuYWwgYW5kIHB1YmxpYylcclxuICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCByZWxvYWQuZGVmYXVsdHMpO1xyXG4gICAgLy8gSWYgb3B0aW9ucyBvYmplY3QgaXMgcGFzc2VkIGFzIHVuaXF1ZSBwYXJhbWV0ZXJcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEgJiYgJC5pc1BsYWluT2JqZWN0KGFyZ3VtZW50c1swXSkpIHtcclxuICAgICAgICAvLyBNZXJnZSBvcHRpb25zOlxyXG4gICAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMsIGFyZ3VtZW50c1swXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIENvbW1vbiBvdmVybG9hZDogbmV3LXVybCBhbmQgY29tcGxldGUgY2FsbGJhY2ssIGJvdGggb3B0aW9uYWxzXHJcbiAgICAgICAgb3B0aW9ucy51cmwgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IG51bGw7XHJcbiAgICAgICAgb3B0aW9ucy5jb21wbGV0ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnVybCkge1xyXG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG9wdGlvbnMudXJsKSlcclxuICAgICAgICAgICAgLy8gRnVuY3Rpb24gcGFyYW1zOiBjdXJyZW50UmVsb2FkVXJsLCBkZWZhdWx0UmVsb2FkVXJsXHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdzb3VyY2UtdXJsJywgJC5wcm94eShvcHRpb25zLnVybCwgdGhpcykoJHQuZGF0YSgnc291cmNlLXVybCcpLCAkdC5hdHRyKCdkYXRhLXNvdXJjZS11cmwnKSkpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdzb3VyY2UtdXJsJywgb3B0aW9ucy51cmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdXJsID0gJHQuZGF0YSgnc291cmNlLXVybCcpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbHJlYWR5IGJlaW5nIHJlbG9hZGVkLCB0byBjYW5jZWwgcHJldmlvdXMgYXR0ZW1wdFxyXG4gICAgICAgIHZhciBqcSA9ICR0LmRhdGEoJ2lzUmVsb2FkaW5nJyk7XHJcbiAgICAgICAgaWYgKGpxKSB7XHJcbiAgICAgICAgICAgIGlmIChqcS51cmwgPT0gdXJsKVxyXG4gICAgICAgICAgICAgICAgLy8gSXMgdGhlIHNhbWUgdXJsLCBkbyBub3QgYWJvcnQgYmVjYXVzZSBpcyB0aGUgc2FtZSByZXN1bHQgYmVpbmcgcmV0cmlldmVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGpxLmFib3J0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPcHRpb25hbCBkYXRhIHBhcmFtZXRlciAncmVsb2FkLW1vZGUnIGFjY2VwdHMgdmFsdWVzOiBcclxuICAgICAgICAvLyAtICdyZXBsYWNlLW1lJzogVXNlIGh0bWwgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IHJlbG9hZGVkIGVsZW1lbnQgKGFrYTogcmVwbGFjZVdpdGgoKSlcclxuICAgICAgICAvLyAtICdyZXBsYWNlLWNvbnRlbnQnOiAoZGVmYXVsdCkgSHRtbCByZXR1cm5lZCByZXBsYWNlIGN1cnJlbnQgZWxlbWVudCBjb250ZW50IChha2E6IGh0bWwoKSlcclxuICAgICAgICBvcHRpb25zLm1vZGUgPSAkdC5kYXRhKCdyZWxvYWQtbW9kZScpIHx8IG9wdGlvbnMubW9kZTtcclxuXHJcbiAgICAgICAgaWYgKHVybCkge1xyXG5cclxuICAgICAgICAgICAgLy8gTG9hZGluZywgd2l0aCBkZWxheVxyXG4gICAgICAgICAgICB2YXIgbG9hZGluZ3RpbWVyID0gb3B0aW9ucy5sb2FkaW5nLmxvY2tFbGVtZW50ID9cclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0aW5nIGNvbnRlbnQgdXNpbmcgYSBmYWtlIHRlbXAgcGFyZW50IGVsZW1lbnQgdG8gcHJlbG9hZCBpbWFnZSBhbmQgdG8gZ2V0IHJlYWwgbWVzc2FnZSB3aWR0aDpcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG9hZGluZ2NvbnRlbnQgPSAkKCc8ZGl2Lz4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgPyAkKCc8ZGl2IGNsYXNzPVwibG9hZGluZy1tZXNzYWdlXCIvPicpLmFwcGVuZChvcHRpb25zLmxvYWRpbmcubWVzc2FnZSkgOiBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLnNob3dMb2FkaW5nSW5kaWNhdG9yID8gb3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgOiBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nY29udGVudC5jc3MoeyBwb3NpdGlvbjogJ2Fic29sdXRlJywgbGVmdDogLTk5OTk5IH0pLmFwcGVuZFRvKCdib2R5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHcgPSBsb2FkaW5nY29udGVudC53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdjb250ZW50LmRldGFjaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIExvY2tpbmc6XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zLmF1dG9mb2N1cyA9IG9wdGlvbnMuYXV0b2ZvY3VzO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucy53aWR0aCA9IHc7XHJcbiAgICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihsb2FkaW5nY29udGVudC5odG1sKCksICR0LCBvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA/ICdjdXN0b20tbG9hZGluZycgOiAnbG9hZGluZycsIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9LCBvcHRpb25zLmxvYWRpbmcuZGVsYXkpXHJcbiAgICAgICAgICAgICAgICA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICAvLyBQcmVwYXJlIGNvbnRleHRcclxuICAgICAgICAgICAgdmFyIGN0eCA9IHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICR0LFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGxvYWRpbmdUaW1lcjogbG9hZGluZ3RpbWVyXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICAgICAgICAgIGpxID0gJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0OiBjdHhcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBVcmwgaXMgc2V0IGluIHRoZSByZXR1cm5lZCBhamF4IG9iamVjdCBiZWNhdXNlIGlzIG5vdCBzZXQgYnkgYWxsIHZlcnNpb25zIG9mIGpRdWVyeVxyXG4gICAgICAgICAgICBqcS51cmwgPSB1cmw7XHJcblxyXG4gICAgICAgICAgICAvLyBNYXJrIGVsZW1lbnQgYXMgaXMgYmVpbmcgcmVsb2FkZWQsIHRvIGF2b2lkIG11bHRpcGxlIGF0dGVtcHMgYXQgc2FtZSB0aW1lLCBzYXZpbmdcclxuICAgICAgICAgICAgLy8gY3VycmVudCBhamF4IG9iamVjdCB0byBhbGxvdyBiZSBjYW5jZWxsZWRcclxuICAgICAgICAgICAgJHQuZGF0YSgnaXNSZWxvYWRpbmcnLCBqcSk7XHJcbiAgICAgICAgICAgIGpxLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdpc1JlbG9hZGluZycsIG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENhbGxiYWNrczogZmlyc3QgZ2xvYmFscyBhbmQgdGhlbiBmcm9tIG9wdGlvbnMgaWYgdGhleSBhcmUgZGlmZmVyZW50XHJcbiAgICAgICAgICAgIC8vIHN1Y2Nlc3NcclxuICAgICAgICAgICAganEuZG9uZShyZWxvYWQuZGVmYXVsdHMuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN1Y2Nlc3MgIT0gcmVsb2FkLmRlZmF1bHRzLnN1Y2Nlc3MpXHJcbiAgICAgICAgICAgICAgICBqcS5kb25lKG9wdGlvbnMuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIC8vIGVycm9yXHJcbiAgICAgICAgICAgIGpxLmZhaWwocmVsb2FkLmRlZmF1bHRzLmVycm9yKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZXJyb3IgIT0gcmVsb2FkLmRlZmF1bHRzLmVycm9yKVxyXG4gICAgICAgICAgICAgICAganEuZmFpbChvcHRpb25zLmVycm9yKTtcclxuICAgICAgICAgICAgLy8gY29tcGxldGVcclxuICAgICAgICAgICAganEuYWx3YXlzKHJlbG9hZC5kZWZhdWx0cy5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbXBsZXRlICE9IHJlbG9hZC5kZWZhdWx0cy5jb21wbGV0ZSlcclxuICAgICAgICAgICAgICAgIGpxLmRvbmUob3B0aW9ucy5jb21wbGV0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8vIFB1YmxpYyBkZWZhdWx0c1xyXG5yZWxvYWQuZGVmYXVsdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMpO1xyXG5cclxuLy8gUHVibGljIHV0aWxpdGllc1xyXG5yZWxvYWQudXBkYXRlRWxlbWVudCA9IHVwZGF0ZUVsZW1lbnQ7XHJcbnJlbG9hZC5zdG9wTG9hZGluZ1NwaW5uZXIgPSBzdG9wTG9hZGluZ1NwaW5uZXI7XHJcblxyXG4vLyBNb2R1bGVcclxubW9kdWxlLmV4cG9ydHMgPSByZWxvYWQ7IiwiLyoqIEV4dGVuZGVkIHRvZ2dsZS1zaG93LWhpZGUgZnVudGlvbnMuXHJcbiAgICBJYWdvU1JMQGdtYWlsLmNvbVxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICoqL1xyXG4oZnVuY3Rpb24oKXtcclxuXHJcbiAgICAvKiogSW1wbGVtZW50YXRpb246IHJlcXVpcmUgalF1ZXJ5IGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIHRoZVxyXG4gICAgICAgIHB1YmxpYyBtZXRob2RzLlxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24geHRzaChqUXVlcnkpIHtcclxuICAgICAgICB2YXIgJCA9IGpRdWVyeTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGlkZSBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnaGlkZScgYW5kICdmYWRlT3V0JyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5mYWRlT3V0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5zbGlkZVVwKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnaGlkZSdcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAkZS5oaWRlKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hoaWRlJywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICogU2hvdyBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnc2hvdycgYW5kICdmYWRlSW4nIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm1zIGEgZml4IG9uIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzXHJcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGVycm9yIHRoYXQgcHJldmVudHMgZnJvbSBydW5uaW5nXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdHMgb24gZWxlbWVudHMgdGhhdCBhcmUgYWxyZWFkeSB2aXNpYmxlLFxyXG4gICAgICAgICAgICAvLyB3aGF0IGxldHMgdGhlIHBvc3NpYmlsaXR5IG9mIGdldCBhIG1pZGRsZS1hbmltYXRlZFxyXG4gICAgICAgICAgICAvLyBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFdlIGp1c3QgY2hhbmdlIGRpc3BsYXk6bm9uZSwgZm9yY2luZyB0byAnaXMtdmlzaWJsZScgdG9cclxuICAgICAgICAgICAgLy8gYmUgZmFsc2UgYW5kIHRoZW4gcnVubmluZyB0aGUgZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBmbGlja2VyaW5nIGVmZmVjdCwgYmVjYXVzZSBqUXVlcnkganVzdCByZXNldHNcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBvbiBlZmZlY3Qgc3RhcnQuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuZmFkZUluKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ3Nob3cnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hzaG93JywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZW5lcmljIHV0aWxpdHkgZm9yIGhpZ2hseSBjb25maWd1cmFibGUgalF1ZXJ5LnRvZ2dsZSB3aXRoIHN1cHBvcnRcclxuICAgICAgICAgICAgdG8gc3BlY2lmeSB0aGUgdG9nZ2xlIHZhbHVlIGV4cGxpY2l0eSBmb3IgYW55IGtpbmQgb2YgZWZmZWN0OiBqdXN0IHBhc3MgdHJ1ZSBhcyBzZWNvbmQgcGFyYW1ldGVyICd0b2dnbGUnIHRvIHNob3dcclxuICAgICAgICAgICAgYW5kIGZhbHNlIHRvIGhpZGUuIFRvZ2dsZSBtdXN0IGJlIHN0cmljdGx5IGEgQm9vbGVhbiB2YWx1ZSB0byBhdm9pZCBhdXRvLWRldGVjdGlvbi5cclxuICAgICAgICAgICAgVG9nZ2xlIHBhcmFtZXRlciBjYW4gYmUgb21pdHRlZCB0byBhdXRvLWRldGVjdCBpdCwgYW5kIHNlY29uZCBwYXJhbWV0ZXIgY2FuIGJlIHRoZSBhbmltYXRpb24gb3B0aW9ucy5cclxuICAgICAgICAgICAgQWxsIHRoZSBvdGhlcnMgYmVoYXZlIGV4YWN0bHkgYXMgaGlkZUVsZW1lbnQgYW5kIHNob3dFbGVtZW50LlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUVsZW1lbnQoZWxlbWVudCwgdG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBub3QgYSBib29sZWFuXHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUgIT09IHRydWUgJiYgdG9nZ2xlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIGFuIG9iamVjdCwgdGhlbiBpcyB0aGUgb3B0aW9ucyBhcyBzZWNvbmQgcGFyYW1ldGVyXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRvZ2dsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRvZ2dsZTtcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tZGV0ZWN0IHRvZ2dsZSwgaXQgY2FuIHZhcnkgb24gYW55IGVsZW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGRldGVjdGlvbiBhbmQgYWN0aW9uIG11c3QgYmUgZG9uZSBwZXIgZWxlbWVudDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV1c2luZyBmdW5jdGlvbiwgd2l0aCBleHBsaWNpdCB0b2dnbGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsICEkKHRoaXMpLmlzKCc6dmlzaWJsZScpLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUpXHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBEbyBqUXVlcnkgaW50ZWdyYXRpb24gYXMgeHRvZ2dsZSwgeHNob3csIHhoaWRlXHJcbiAgICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsdWdJbihqUXVlcnkpIHtcclxuICAgICAgICAgICAgLyoqIHRvZ2dsZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4dG9nZ2xlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnh0b2dnbGUgPSBmdW5jdGlvbiB4dG9nZ2xlKHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCB0b2dnbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogc2hvd0VsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhzaG93ID0gZnVuY3Rpb24geHNob3cob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBoaWRlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhoaWRlID0gZnVuY3Rpb24geGhpZGUob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9ydGluZzpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0b2dnbGVFbGVtZW50OiB0b2dnbGVFbGVtZW50LFxyXG4gICAgICAgICAgICBzaG93RWxlbWVudDogc2hvd0VsZW1lbnQsXHJcbiAgICAgICAgICAgIGhpZGVFbGVtZW50OiBoaWRlRWxlbWVudCxcclxuICAgICAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vZHVsZVxyXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIHh0c2gpO1xyXG4gICAgfSBlbHNlIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICAgICAgdmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0geHRzaChqUXVlcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBOb3JtYWwgc2NyaXB0IGxvYWQsIGlmIGpRdWVyeSBpcyBnbG9iYWwgKGF0IHdpbmRvdyksIGl0cyBleHRlbmRlZCBhdXRvbWF0aWNhbGx5ICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5qUXVlcnkgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICB4dHNoKHdpbmRvdy5qUXVlcnkpLnBsdWdJbih3aW5kb3cualF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLyogU29tZSB1dGlsaXRpZXMgZm9yIHVzZSB3aXRoIGpRdWVyeSBvciBpdHMgZXhwcmVzc2lvbnNcclxuICAgIHRoYXQgYXJlIG5vdCBwbHVnaW5zLlxyXG4qL1xyXG5mdW5jdGlvbiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWyAjOyYsLisqflxcJzpcIiFeJFtcXF0oKT0+fFxcL10pL2csICdcXFxcJDEnKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTogZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZVxyXG4gICAgfTtcclxuIiwiLyogQXNzZXRzIGxvYWRlciB3aXRoIGxvYWRpbmcgY29uZmlybWF0aW9uIChtYWlubHkgZm9yIHNjcmlwdHMpXHJcbiAgICBiYXNlZCBvbiBNb2Rlcm5penIveWVwbm9wZSBsb2FkZXIuXHJcbiovXHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbmV4cG9ydHMubG9hZCA9IGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICBvcHRzID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIHNjcmlwdHM6IFtdLFxyXG4gICAgICAgIGNvbXBsZXRlOiBudWxsLFxyXG4gICAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBudWxsLFxyXG4gICAgICAgIGxvYWREZWxheTogMCxcclxuICAgICAgICB0cmlhbHNJbnRlcnZhbDogNTAwXHJcbiAgICB9LCBvcHRzKTtcclxuICAgIGlmICghb3B0cy5zY3JpcHRzLmxlbmd0aCkgcmV0dXJuO1xyXG4gICAgZnVuY3Rpb24gcGVyZm9ybUNvbXBsZXRlKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgKG9wdHMuY29tcGxldGVWZXJpZmljYXRpb24pICE9PSAnZnVuY3Rpb24nIHx8IG9wdHMuY29tcGxldGVWZXJpZmljYXRpb24oKSlcclxuICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSgpO1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHBlcmZvcm1Db21wbGV0ZSwgb3B0cy50cmlhbHNJbnRlcnZhbCk7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUud2FybilcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTEMubG9hZC5jb21wbGV0ZVZlcmlmaWNhdGlvbiBmYWlsZWQgZm9yICcgKyBvcHRzLnNjcmlwdHNbMF0gKyAnIHJldHJ5aW5nIGl0IGluICcgKyBvcHRzLnRyaWFsc0ludGVydmFsICsgJ21zJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbG9hZCgpIHtcclxuICAgICAgICBNb2Rlcm5penIubG9hZCh7XHJcbiAgICAgICAgICAgIGxvYWQ6IG9wdHMuc2NyaXB0cyxcclxuICAgICAgICAgICAgY29tcGxldGU6IG9wdHMuY29tcGxldGUgPyBwZXJmb3JtQ29tcGxldGUgOiBudWxsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAob3B0cy5sb2FkRGVsYXkpXHJcbiAgICAgICAgc2V0VGltZW91dChsb2FkLCBvcHRzLmxvYWREZWxheSk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgbG9hZCgpO1xyXG59OyIsIi8qLS0tLS0tLS0tLS0tXHJcblV0aWxpdGllcyB0byBtYW5pcHVsYXRlIG51bWJlcnMsIGFkZGl0aW9uYWxseVxyXG50byB0aGUgb25lcyBhdCBNYXRoXHJcbi0tLS0tLS0tLS0tLSovXHJcblxyXG4vKiogRW51bWVyYXRpb24gdG8gYmUgdXNlcyBieSBmdW5jdGlvbnMgdGhhdCBpbXBsZW1lbnRzICdyb3VuZGluZycgb3BlcmF0aW9ucyBvbiBkaWZmZXJlbnRcclxuZGF0YSB0eXBlcy5cclxuSXQgaG9sZHMgdGhlIGRpZmZlcmVudCB3YXlzIGEgcm91bmRpbmcgb3BlcmF0aW9uIGNhbiBiZSBhcHBseS5cclxuKiovXHJcbnZhciByb3VuZGluZ1R5cGVFbnVtID0ge1xyXG4gICAgRG93bjogLTEsXHJcbiAgICBOZWFyZXN0OiAwLFxyXG4gICAgVXA6IDFcclxufTtcclxuXHJcbmZ1bmN0aW9uIHJvdW5kVG8obnVtYmVyLCBkZWNpbWFscywgcm91bmRpbmdUeXBlKSB7XHJcbiAgICAvLyBjYXNlIE5lYXJlc3QgaXMgdGhlIGRlZmF1bHQ6XHJcbiAgICB2YXIgZiA9IG5lYXJlc3RUbztcclxuICAgIHN3aXRjaCAocm91bmRpbmdUeXBlKSB7XHJcbiAgICAgICAgY2FzZSByb3VuZGluZ1R5cGVFbnVtLkRvd246XHJcbiAgICAgICAgICAgIGYgPSBmbG9vclRvO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIHJvdW5kaW5nVHlwZUVudW0uVXA6XHJcbiAgICAgICAgICAgIGYgPSBjZWlsVG87XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGYobnVtYmVyLCBkZWNpbWFscyk7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXQgY2FuIHN1YnN0cmFjdCBpbnRlZ2VyIGRlY2ltYWxzIGJ5IHByb3ZpZGluZyBhIG5lZ2F0aXZlXHJcbm51bWJlciBvZiBkZWNpbWFscy5cclxuKiovXHJcbmZ1bmN0aW9uIG5lYXJlc3RUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5yb3VuZChudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBVcCBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXRzIHNpbWlsYXIgdG8gcm91bmRUbywgYnV0IHRoZSBudW1iZXIgaXMgZXZlciByb3VuZGVkIHVwLFxyXG50byB0aGUgbG93ZXIgaW50ZWdlciBncmVhdGVyIG9yIGVxdWFscyB0byB0aGUgbnVtYmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gY2VpbFRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vKiogUm91bmQgRG93biBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXRzIHNpbWlsYXIgdG8gcm91bmRUbywgYnV0IHRoZSBudW1iZXIgaXMgZXZlciByb3VuZGVkIGRvd24sXHJcbnRvIHRoZSBiaWdnZXIgaW50ZWdlciBsb3dlciBvciBlcXVhbHMgdG8gdGhlIG51bWJlci5cclxuKiovXHJcbmZ1bmN0aW9uIGZsb29yVG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgcm91bmRpbmdUeXBlRW51bTogcm91bmRpbmdUeXBlRW51bSxcclxuICAgICAgICByb3VuZFRvOiByb3VuZFRvLFxyXG4gICAgICAgIG5lYXJlc3RUbzogbmVhcmVzdFRvLFxyXG4gICAgICAgIGNlaWxUbzogY2VpbFRvLFxyXG4gICAgICAgIGZsb29yVG86IGZsb29yVG9cclxuICAgIH07IiwiZnVuY3Rpb24gbW92ZUZvY3VzVG8oZWwsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWFyZ2luVG9wOiAzMCxcclxuICAgICAgICBkdXJhdGlvbjogNTAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChlbCkub2Zmc2V0KCkudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3AgfSwgb3B0aW9ucy5kdXJhdGlvbiwgbnVsbCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb3ZlRm9jdXNUbztcclxufSIsIi8qIFNvbWUgdXRpbGl0aWVzIHRvIGZvcm1hdCBhbmQgZXh0cmFjdCBudW1iZXJzLCBmcm9tIHRleHQgb3IgRE9NLlxyXG4gKi9cclxudmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgaTE4biA9IHJlcXVpcmUoJy4vaTE4bicpLFxyXG4gICAgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuZnVuY3Rpb24gZ2V0TW9uZXlOdW1iZXIodiwgYWx0KSB7XHJcbiAgICBhbHQgPSBhbHQgfHwgMDtcclxuICAgIGlmICh2IGluc3RhbmNlb2YgalF1ZXJ5KVxyXG4gICAgICAgIHYgPSB2LnZhbCgpIHx8IHYudGV4dCgpO1xyXG4gICAgdiA9IHBhcnNlRmxvYXQodlxyXG4gICAgICAgIC5yZXBsYWNlKC9bJOKCrF0vZywgJycpXHJcbiAgICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChMQy5udW1lcmljTWlsZXNTZXBhcmF0b3JbaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmN1bHR1cmVdLCAnZycpLCAnJylcclxuICAgICk7XHJcbiAgICByZXR1cm4gaXNOYU4odikgPyBhbHQgOiB2O1xyXG59XHJcbmZ1bmN0aW9uIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcodikge1xyXG4gICAgdmFyIGN1bHR1cmUgPSBpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY3VsdHVyZTtcclxuICAgIC8vIEZpcnN0LCByb3VuZCB0byAyIGRlY2ltYWxzXHJcbiAgICB2ID0gbXUucm91bmRUbyh2LCAyKTtcclxuICAgIC8vIEdldCB0aGUgZGVjaW1hbCBwYXJ0IChyZXN0KVxyXG4gICAgdmFyIHJlc3QgPSBNYXRoLnJvdW5kKHYgKiAxMDAgJSAxMDApO1xyXG4gICAgcmV0dXJuICgnJyArXHJcbiAgICAvLyBJbnRlZ2VyIHBhcnQgKG5vIGRlY2ltYWxzKVxyXG4gICAgICAgIE1hdGguZmxvb3IodikgK1xyXG4gICAgLy8gRGVjaW1hbCBzZXBhcmF0b3IgZGVwZW5kaW5nIG9uIGxvY2FsZVxyXG4gICAgICAgIGkxOG4ubnVtZXJpY0RlY2ltYWxTZXBhcmF0b3JbY3VsdHVyZV0gK1xyXG4gICAgLy8gRGVjaW1hbHMsIGV2ZXIgdHdvIGRpZ2l0c1xyXG4gICAgICAgIE1hdGguZmxvb3IocmVzdCAvIDEwKSArIHJlc3QgJSAxMFxyXG4gICAgKTtcclxufVxyXG5mdW5jdGlvbiBudW1iZXJUb01vbmV5U3RyaW5nKHYpIHtcclxuICAgIHZhciBjb3VudHJ5ID0gaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmNvdW50cnk7XHJcbiAgICAvLyBUd28gZGlnaXRzIGluIGRlY2ltYWxzIGZvciByb3VuZGVkIHZhbHVlIHdpdGggbW9uZXkgc3ltYm9sIGFzIGZvclxyXG4gICAgLy8gY3VycmVudCBsb2NhbGVcclxuICAgIHJldHVybiAoaTE4bi5tb25leVN5bWJvbFByZWZpeFtjb3VudHJ5XSArIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcodikgKyBpMThuLm1vbmV5U3ltYm9sU3VmaXhbY291bnRyeV0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldE1vbmV5TnVtYmVyKHYsIGVsKSB7XHJcbiAgICAvLyBHZXQgdmFsdWUgaW4gbW9uZXkgZm9ybWF0OlxyXG4gICAgdiA9IG51bWJlclRvTW9uZXlTdHJpbmcodik7XHJcbiAgICAvLyBTZXR0aW5nIHZhbHVlOlxyXG4gICAgaWYgKGVsIGluc3RhbmNlb2YgalF1ZXJ5KVxyXG4gICAgICAgIGlmIChlbC5pcygnOmlucHV0JykpXHJcbiAgICAgICAgICAgIGVsLnZhbCh2KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGVsLnRleHQodik7XHJcbiAgICByZXR1cm4gdjtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZ2V0TW9uZXlOdW1iZXI6IGdldE1vbmV5TnVtYmVyLFxyXG4gICAgICAgIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmc6IG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcsXHJcbiAgICAgICAgbnVtYmVyVG9Nb25leVN0cmluZzogbnVtYmVyVG9Nb25leVN0cmluZyxcclxuICAgICAgICBzZXRNb25leU51bWJlcjogc2V0TW9uZXlOdW1iZXJcclxuICAgIH07IiwiLyoqXHJcbiogUGxhY2Vob2xkZXIgcG9seWZpbGwuXHJcbiogQWRkcyBhIG5ldyBqUXVlcnkgcGxhY2VIb2xkZXIgbWV0aG9kIHRvIHNldHVwIG9yIHJlYXBwbHkgcGxhY2VIb2xkZXJcclxuKiBvbiBlbGVtZW50cyAocmVjb21tZW50ZWQgdG8gYmUgYXBwbHkgb25seSB0byBzZWxlY3RvciAnW3BsYWNlaG9sZGVyXScpO1xyXG4qIHRoYXRzIG1ldGhvZCBpcyBmYWtlIG9uIGJyb3dzZXJzIHRoYXQgaGFzIG5hdGl2ZSBzdXBwb3J0IGZvciBwbGFjZWhvbGRlclxyXG4qKi9cclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFBsYWNlSG9sZGVycygpIHtcclxuICAgIGlmIChNb2Rlcm5penIuaW5wdXQucGxhY2Vob2xkZXIpXHJcbiAgICAgICAgJC5mbi5wbGFjZWhvbGRlciA9IGZ1bmN0aW9uICgpIHsgfTtcclxuICAgIGVsc2VcclxuICAgICAgICAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBkb1BsYWNlaG9sZGVyKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGlmICghJHQuZGF0YSgncGxhY2Vob2xkZXItc3VwcG9ydGVkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAkdC5vbignZm9jdXNpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQub24oJ2ZvY3Vzb3V0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICR0LmRhdGEoJ3BsYWNlaG9sZGVyLXN1cHBvcnRlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJC5mbi5wbGFjZWhvbGRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZG9QbGFjZWhvbGRlcik7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpO1xyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5hamF4Q29tcGxldGUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKCk7XHJcbn07IiwiLyogUG9wdXAgZnVuY3Rpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5yZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKlxyXG4qIFBvcHVwIHJlbGF0ZWQgXHJcbiogZnVuY3Rpb25zXHJcbiovXHJcbmZ1bmN0aW9uIHBvcHVwU2l6ZShzaXplKSB7XHJcbiAgICB2YXIgcyA9IChzaXplID09ICdsYXJnZScgPyAwLjggOiAoc2l6ZSA9PSAnbWVkaXVtJyA/IDAuNSA6IChzaXplID09ICdzbWFsbCcgPyAwLjIgOiBzaXplIHx8IDAuNSkpKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgd2lkdGg6IE1hdGgucm91bmQoJCh3aW5kb3cpLndpZHRoKCkgKiBzKSxcclxuICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQoJCh3aW5kb3cpLmhlaWdodCgpICogcyksXHJcbiAgICAgICAgc2l6ZUZhY3Rvcjogc1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBwb3B1cFN0eWxlKHNpemUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3Vyc29yOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgd2lkdGg6IHNpemUud2lkdGggKyAncHgnLFxyXG4gICAgICAgIGxlZnQ6IE1hdGgucm91bmQoKCQod2luZG93KS53aWR0aCgpIC0gc2l6ZS53aWR0aCkgLyAyKSAtIDI1ICsgJ3B4JyxcclxuICAgICAgICBoZWlnaHQ6IHNpemUuaGVpZ2h0ICsgJ3B4JyxcclxuICAgICAgICB0b3A6IE1hdGgucm91bmQoKCQod2luZG93KS5oZWlnaHQoKSAtIHNpemUuaGVpZ2h0KSAvIDIpIC0gMzIgKyAncHgnLFxyXG4gICAgICAgIHBhZGRpbmc6ICczNHB4IDI1cHggMzBweCcsXHJcbiAgICAgICAgb3ZlcmZsb3c6ICdhdXRvJyxcclxuICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAnLW1vei1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZycsXHJcbiAgICAgICAgJy13ZWJraXQtYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmctYm94JyxcclxuICAgICAgICAnYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmctYm94J1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBwb3B1cCh1cmwsIHNpemUsIGNvbXBsZXRlLCBsb2FkaW5nVGV4dCwgb3B0aW9ucykge1xyXG4gICAgaWYgKHR5cGVvZiAodXJsKSA9PT0gJ29iamVjdCcpXHJcbiAgICAgICAgb3B0aW9ucyA9IHVybDtcclxuXHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgdXJsOiB0eXBlb2YgKHVybCkgPT09ICdzdHJpbmcnID8gdXJsIDogJycsXHJcbiAgICAgICAgc2l6ZTogc2l6ZSB8fCB7IHdpZHRoOiAwLCBoZWlnaHQ6IDAgfSxcclxuICAgICAgICBjb21wbGV0ZTogY29tcGxldGUsXHJcbiAgICAgICAgbG9hZGluZ1RleHQ6IGxvYWRpbmdUZXh0LFxyXG4gICAgICAgIGNsb3NhYmxlOiB7XHJcbiAgICAgICAgICAgIG9uTG9hZDogZmFsc2UsXHJcbiAgICAgICAgICAgIGFmdGVyTG9hZDogdHJ1ZSxcclxuICAgICAgICAgICAgb25FcnJvcjogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b1NpemU6IGZhbHNlLFxyXG4gICAgICAgIGNvbnRhaW5lckNsYXNzOiAnJyxcclxuICAgICAgICBhdXRvRm9jdXM6IHRydWVcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIC8vIFByZXBhcmUgc2l6ZSBhbmQgbG9hZGluZ1xyXG4gICAgb3B0aW9ucy5sb2FkaW5nVGV4dCA9IG9wdGlvbnMubG9hZGluZ1RleHQgfHwgJyc7XHJcbiAgICBpZiAodHlwZW9mIChvcHRpb25zLnNpemUud2lkdGgpID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICBvcHRpb25zLnNpemUgPSBwb3B1cFNpemUob3B0aW9ucy5zaXplKTtcclxuXHJcbiAgICAkLmJsb2NrVUkoe1xyXG4gICAgICAgIG1lc3NhZ2U6IChvcHRpb25zLmNsb3NhYmxlLm9uTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKSArXHJcbiAgICAgICAnPGltZyBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyArIG9wdGlvbnMubG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2VudGVyWTogZmFsc2UsXHJcbiAgICAgICAgY3NzOiBwb3B1cFN0eWxlKG9wdGlvbnMuc2l6ZSksXHJcbiAgICAgICAgb3ZlcmxheUNTUzogeyBjdXJzb3I6ICdkZWZhdWx0JyB9LFxyXG4gICAgICAgIGZvY3VzSW5wdXQ6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExvYWRpbmcgVXJsIHdpdGggQWpheCBhbmQgcGxhY2UgY29udGVudCBpbnNpZGUgdGhlIGJsb2NrZWQtYm94XHJcbiAgICAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogb3B0aW9ucy51cmwsXHJcbiAgICAgICAgY29udGV4dDoge1xyXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxyXG4gICAgICAgICAgICBjb250YWluZXI6ICQoJy5ibG9ja01zZycpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5jb250YWluZXIuYWRkQ2xhc3Mob3B0aW9ucy5jb250YWluZXJDbGFzcyk7XHJcbiAgICAgICAgICAgIC8vIEFkZCBjbG9zZSBidXR0b24gaWYgcmVxdWlyZXMgaXQgb3IgZW1wdHkgbWVzc2FnZSBjb250ZW50IHRvIGFwcGVuZCB0aGVuIG1vcmVcclxuICAgICAgICAgICAgY29udGFpbmVyLmh0bWwob3B0aW9ucy5jbG9zYWJsZS5hZnRlckxvYWQgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJyk7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50SG9sZGVyID0gY29udGFpbmVyLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbnRlbnRcIi8+JykuY2hpbGRyZW4oJy5jb250ZW50Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLkNvZGUgJiYgZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIGNvZGUsIHNob3cgcmVzdWx0XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5hcHBlbmQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gUGFnZSBjb250ZW50IGdvdCwgcGFzdGUgaW50byB0aGUgcG9wdXAgaWYgaXMgcGFydGlhbCBodG1sICh1cmwgc3RhcnRzIHdpdGggJClcclxuICAgICAgICAgICAgICAgIGlmICgvKCheXFwkKXwoXFwvXFwkKSkvLnRlc3Qob3B0aW9ucy51cmwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5hcHBlbmQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50SG9sZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBdm9pZCBtaXNjYWxjdWxhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc3R5bGUud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCd3aWR0aCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2SGVpZ2h0ID0gY29udGVudEhvbGRlclswXS5zdHlsZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0dWFsV2lkdGggPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsSGVpZ2h0ID0gY29udGVudEhvbGRlclswXS5zY3JvbGxIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250V2lkdGggPSBjb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRIZWlnaHQgPSBjb250YWluZXIuaGVpZ2h0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYVdpZHRoID0gY29udGFpbmVyLm91dGVyV2lkdGgodHJ1ZSkgLSBjb250V2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYUhlaWdodCA9IGNvbnRhaW5lci5vdXRlckhlaWdodCh0cnVlKSAtIGNvbnRIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aCA9ICQod2luZG93KS53aWR0aCgpIC0gZXh0cmFXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKSAtIGV4dHJhSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgYW5kIGFwcGx5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaXplID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGFjdHVhbFdpZHRoID4gbWF4V2lkdGggPyBtYXhXaWR0aCA6IGFjdHVhbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBhY3R1YWxIZWlnaHQgPiBtYXhIZWlnaHQgPyBtYXhIZWlnaHQgOiBhY3R1YWxIZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFuaW1hdGUoc2l6ZSwgMzAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgbWlzY2FsY3VsYXRpb25zIGNvcnJlY3Rpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCd3aWR0aCcsIHByZXZXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCdoZWlnaHQnLCBwcmV2SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEVsc2UsIGlmIHVybCBpcyBhIGZ1bGwgaHRtbCBwYWdlIChub3JtYWwgcGFnZSksIHB1dCBjb250ZW50IGludG8gYW4gaWZyYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShkYXRhLCB0aGlzLm9wdGlvbnMuc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXBsYWNlIGJsb2NraW5nIGVsZW1lbnQgY29udGVudCAodGhlIGxvYWRpbmcpIHdpdGggdGhlIGlmcmFtZTpcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9Gb2N1cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oaWZyYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIGVycm9yOiBmdW5jdGlvbiAoaiwgdCwgZXgpIHtcclxuICAgICAgICAgICAgJCgnZGl2LmJsb2NrTXNnJykuaHRtbCgob3B0aW9ucy5jbG9zYWJsZS5vbkVycm9yID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICsgJzxkaXYgY2xhc3M9XCJjb250ZW50XCI+UGFnZSBub3QgZm91bmQ8L2Rpdj4nKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5pbmZvKSBjb25zb2xlLmluZm8oXCJQb3B1cC1hamF4IGVycm9yOiBcIiArIGV4KTtcclxuICAgICAgICB9LCBjb21wbGV0ZTogb3B0aW9ucy5jb21wbGV0ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHJldHVybmVkQmxvY2sgPSAkKCcuYmxvY2tVSScpO1xyXG5cclxuICAgIHJldHVybmVkQmxvY2sub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgcmV0dXJuZWRCbG9jay50cmlnZ2VyKCdwb3B1cC1jbG9zZWQnKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHJldHVybmVkQmxvY2suY2xvc2VQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldEJsb2NrRWxlbWVudCA9IGZ1bmN0aW9uIGdldEJsb2NrRWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmlsdGVyKCcuYmxvY2tNc2cnKTsgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0Q29udGVudEVsZW1lbnQgPSBmdW5jdGlvbiBnZXRDb250ZW50RWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmluZCgnLmNvbnRlbnQnKTsgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0T3ZlcmxheUVsZW1lbnQgPSBmdW5jdGlvbiBnZXRPdmVybGF5RWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmlsdGVyKCcuYmxvY2tPdmVybGF5Jyk7IH07XHJcbiAgICByZXR1cm4gcmV0dXJuZWRCbG9jaztcclxufVxyXG5cclxuLyogU29tZSBwb3B1cCB1dGlsaXRpdGVzL3Nob3J0aGFuZHMgKi9cclxuZnVuY3Rpb24gbWVzc2FnZVBvcHVwKG1lc3NhZ2UsIGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgJ2JvZHknKTtcclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdi8+JykudGV4dChtZXNzYWdlKTtcclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY29udGFpbmVyLCAnbWVzc2FnZS1wb3B1cCBmdWxsLWJsb2NrJywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiB0cnVlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25uZWN0UG9wdXBBY3Rpb24oYXBwbHlUb1NlbGVjdG9yKSB7XHJcbiAgICBhcHBseVRvU2VsZWN0b3IgPSBhcHBseVRvU2VsZWN0b3IgfHwgJy5wb3B1cC1hY3Rpb24nO1xyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgYXBwbHlUb1NlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGMgPSAkKCQodGhpcykuYXR0cignaHJlZicpKS5jbG9uZSgpO1xyXG4gICAgICAgIGlmIChjLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIGRvY3VtZW50LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vIFRoZSBwb3B1cCBmdW5jdGlvbiBjb250YWlucyBhbGwgdGhlIG90aGVycyBhcyBtZXRob2RzXHJcbnBvcHVwLnNpemUgPSBwb3B1cFNpemU7XHJcbnBvcHVwLnN0eWxlID0gcG9wdXBTdHlsZTtcclxucG9wdXAuY29ubmVjdEFjdGlvbiA9IGNvbm5lY3RQb3B1cEFjdGlvbjtcclxucG9wdXAubWVzc2FnZSA9IG1lc3NhZ2VQb3B1cDtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHBvcHVwOyIsIi8qKioqIFBvc3RhbCBDb2RlOiBvbiBmbHksIHNlcnZlci1zaWRlIHZhbGlkYXRpb24gKioqKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBiYXNlVXJsOiAnLycsXHJcbiAgICAgICAgc2VsZWN0b3I6ICdbZGF0YS12YWwtcG9zdGFsY29kZV0nLFxyXG4gICAgICAgIHVybDogJ0pTT04vVmFsaWRhdGVQb3N0YWxDb2RlLydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCBvcHRpb25zLnNlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBJZiBjb250YWlucyBhIHZhbHVlICh0aGlzIG5vdCB2YWxpZGF0ZSBpZiBpcyByZXF1aXJlZCkgYW5kIFxyXG4gICAgICAgIC8vIGhhcyB0aGUgZXJyb3IgZGVzY3JpcHRpdmUgbWVzc2FnZSwgdmFsaWRhdGUgdGhyb3VnaCBhamF4XHJcbiAgICAgICAgdmFyIHBjID0gJHQudmFsKCk7XHJcbiAgICAgICAgdmFyIG1zZyA9ICR0LmRhdGEoJ3ZhbC1wb3N0YWxjb2RlJyk7XHJcbiAgICAgICAgaWYgKHBjICYmIG1zZykge1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBvcHRpb25zLmJhc2VVcmwgKyBvcHRpb25zLnVybCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHsgUG9zdGFsQ29kZTogcGMgfSxcclxuICAgICAgICAgICAgICAgIGNhY2hlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdKU09OJyxcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5SZXN1bHQuSXNWYWxpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKS5hZGRDbGFzcygndmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnNpYmxpbmdzKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50ZXh0KCcnKS5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYW4gc3VtbWFyeSBlcnJvcnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJz4gdWwgPiBsaScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS50ZXh0KCkgPT0gbXNnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVycm9yIGxhYmVsIChpZiB0aGVyZSBpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCdbZGF0YS12YWxtc2ctZm9yPScgKyAkdC5hdHRyKCduYW1lJykgKyAnXScpLnRleHQoJycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKS5yZW1vdmVDbGFzcygndmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnNpYmxpbmdzKCcuZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxzcGFuIGZvcj1cIicgKyAkdC5hdHRyKCduYW1lJykgKyAnXCIgZ2VuZXJhdGVkPVwidHJ1ZVwiPicgKyBtc2cgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHN1bW1hcnkgZXJyb3IgKGlmIHRoZXJlIGlzIG5vdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2hpbGRyZW4oJ3VsJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8bGk+JyArIG1zZyArICc8L2xpPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXJyb3IgbGFiZWwgKGlmIHRoZXJlIGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ1tkYXRhLXZhbG1zZy1mb3I9JyArICR0LmF0dHIoJ25hbWUnKSArICddJykudGV4dChtc2cpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbGFiZWwgaXMgbm90IHZpc2libGUsIGp1c3QgcmVtb3ZlIHRoZSBiYWQgY29kZSB0byBsZXQgdXNlciBzZWUgdGhlIHBsYWNlaG9sZGVyICM1MTRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkbGFiZWwgPSAkdC5jbG9zZXN0KCdsYWJlbCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkbGFiZWwubGVuZ3RoICYmICR0LmF0dHIoJ2lkJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxhYmVsID0gJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ2xhYmVsW2Zvcj0nICsgJHQuYXR0cignaWQnKSArICddJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRsYWJlbC5pcygnOnZpc2libGUnKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC52YWwoJycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKiBBcHBseSBldmVyIGEgcmVkaXJlY3QgdG8gdGhlIGdpdmVuIFVSTCwgaWYgdGhpcyBpcyBhbiBpbnRlcm5hbCBVUkwgb3Igc2FtZVxyXG5wYWdlLCBpdCBmb3JjZXMgYSBwYWdlIHJlbG9hZCBmb3IgdGhlIGdpdmVuIFVSTC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlZGlyZWN0VG8odXJsKSB7XHJcbiAgICAvLyBCbG9jayB0byBhdm9pZCBtb3JlIHVzZXIgaW50ZXJhY3Rpb25zOlxyXG4gICAgJC5ibG9ja1VJKHsgbWVzc2FnZTogJycgfSk7IC8vbG9hZGluZ0Jsb2NrKTtcclxuICAgIC8vIENoZWNraW5nIGlmIGlzIGJlaW5nIHJlZGlyZWN0aW5nIG9yIG5vdFxyXG4gICAgdmFyIHJlZGlyZWN0ZWQgPSBmYWxzZTtcclxuICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gY2hlY2tSZWRpcmVjdCgpIHtcclxuICAgICAgICByZWRpcmVjdGVkID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgLy8gTmF2aWdhdGUgdG8gbmV3IGxvY2F0aW9uOlxyXG4gICAgd2luZG93LmxvY2F0aW9uID0gdXJsO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gSWYgcGFnZSBub3QgY2hhbmdlZCAoc2FtZSB1cmwgb3IgaW50ZXJuYWwgbGluayksIHBhZ2UgY29udGludWUgZXhlY3V0aW5nIHRoZW4gcmVmcmVzaDpcclxuICAgICAgICBpZiAoIXJlZGlyZWN0ZWQpXHJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0sIDUwKTtcclxufTtcclxuIiwiLyoqIFNhbml0aXplIHRoZSB3aGl0ZXNwYWNlcyBpbiBhIHRleHQgYnk6XHJcbi0gcmVwbGFjaW5nIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVyZXMgKGFueSBudW1iZXIgb2YgcmVwZXRpdGlvbiBcclxuYW5kIGFueSBraW5kIG9mIHdoaXRlIGNoYXJhY3RlcikgYnkgYSBub3JtYWwgd2hpdGUtc3BhY2VcclxuLSByZXBsYWNlIGVuY29kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlLXNwYWNlc1xyXG4tIGV2ZXIgcmV0dXJuIGEgc3RyaW5nLCBlbXB0eSB3aGVuIG51bGxcclxuKiovXHJcbmZ1bmN0aW9uIHNhbml0aXplV2hpdGVzcGFjZXModGV4dCkge1xyXG4gICAgLy8gRXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4gICAgdGV4dCA9ICh0ZXh0IHx8ICcnKVxyXG4gICAgLy8gUmVwbGFjZSBhbnkga2luZCBvZiBjb250aWd1b3VzIHdoaXRlc3BhY2VzIGNoYXJhY3RlcnMgYnkgYSBzaW5nbGUgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbiAgICAvLyAodGhhdHMgaW5jbHVkZSByZXBsYWNlIGVuY29uZGVkIG5vbi1icmVha2luZy1zcGFjZXMsXHJcbiAgICAvLyBhbmQgZHVwbGljYXRlZC1yZXBlYXRlZCBhcHBlYXJhbmNlcylcclxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJyk7XHJcbiAgICAvLyBSZW1vdmUgc3RhcnRpbmcgYW5kIGVuZGluZyB3aGl0ZXNwYWNlc1xyXG4gICAgcmV0dXJuICQudHJpbSh0ZXh0KTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gc2FuaXRpemVXaGl0ZXNwYWNlczsiLCIvKiogQ3VzdG9tIExvY29ub21pY3MgJ2xpa2UgYmxvY2tVSScgcG9wdXBzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlLFxyXG4gICAgYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi9hdXRvRm9jdXMnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG5cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2soY29udGVudEJveCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHtcclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBjbG9zYWJsZTogZmFsc2UsXHJcbiAgICAgICAgY2VudGVyOiBmYWxzZSxcclxuICAgICAgICAvKiBhcyBhIHZhbGlkIG9wdGlvbnMgcGFyYW1ldGVyIGZvciBMQy5oaWRlRWxlbWVudCBmdW5jdGlvbiAqL1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogNjAwLFxyXG4gICAgICAgICAgICBlZmZlY3Q6ICdmYWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgIGF1dG9mb2N1c09wdGlvbnM6IHsgbWFyZ2luVG9wOiA2MCB9LFxyXG4gICAgICAgIHdpZHRoOiAnYXV0bydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnRlbnRCb3ggPSAkKGNvbnRlbnRCb3gpO1xyXG4gICAgdmFyIGZ1bGwgPSBmYWxzZTtcclxuICAgIGlmIChibG9ja2VkID09IGRvY3VtZW50IHx8IGJsb2NrZWQgPT0gd2luZG93KSB7XHJcbiAgICAgICAgYmxvY2tlZCA9ICQoJ2JvZHknKTtcclxuICAgICAgICBmdWxsID0gdHJ1ZTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGJsb2NrZWQgPSAkKGJsb2NrZWQpO1xyXG5cclxuICAgIHZhciBib3hJbnNpZGVCbG9ja2VkID0gIWJsb2NrZWQuaXMoJ2JvZHksdHIsdGhlYWQsdGJvZHksdGZvb3QsdGFibGUsdWwsb2wsZGwnKTtcclxuXHJcbiAgICAvLyBHZXR0aW5nIGJveCBlbGVtZW50IGlmIGV4aXN0cyBhbmQgcmVmZXJlbmNpbmdcclxuICAgIHZhciBiSUQgPSBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnKTtcclxuICAgIGlmICghYklEKVxyXG4gICAgICAgIGJJRCA9IChjb250ZW50Qm94LmF0dHIoJ2lkJykgfHwgJycpICsgKGJsb2NrZWQuYXR0cignaWQnKSB8fCAnJykgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIGlmIChiSUQgPT0gJy1zbW9vdGhCb3hCbG9jaycpIHtcclxuICAgICAgICBiSUQgPSAnaWQtJyArIGd1aWRHZW5lcmF0b3IoKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgfVxyXG4gICAgYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJywgYklEKTtcclxuICAgIHZhciBib3ggPSAkKCcjJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoYklEKSk7XHJcbiAgICBcclxuICAgIC8vIEhpZGluZy9jbG9zaW5nIGJveDpcclxuICAgIGlmIChjb250ZW50Qm94Lmxlbmd0aCA9PT0gMCkge1xyXG5cclxuICAgICAgICBib3gueGhpZGUob3B0aW9ucy5jbG9zZU9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvLyBSZXN0b3JpbmcgdGhlIENTUyBwb3NpdGlvbiBhdHRyaWJ1dGUgb2YgdGhlIGJsb2NrZWQgZWxlbWVudFxyXG4gICAgICAgIC8vIHRvIGF2b2lkIHNvbWUgcHJvYmxlbXMgd2l0aCBsYXlvdXQgb24gc29tZSBlZGdlIGNhc2VzIGFsbW9zdFxyXG4gICAgICAgIC8vIHRoYXQgbWF5IGJlIG5vdCBhIHByb2JsZW0gZHVyaW5nIGJsb2NraW5nIGJ1dCB3aGVuIHVuYmxvY2tlZC5cclxuICAgICAgICB2YXIgcHJldiA9IGJsb2NrZWQuZGF0YSgnc2JiLXByZXZpb3VzLWNzcy1wb3NpdGlvbicpO1xyXG4gICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsIHByZXYgfHwgJycpO1xyXG4gICAgICAgIGJsb2NrZWQuZGF0YSgnc2JiLXByZXZpb3VzLWNzcy1wb3NpdGlvbicsIG51bGwpO1xyXG5cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGJveGM7XHJcbiAgICBpZiAoYm94Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGJveGMgPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1lbGVtZW50XCIvPicpO1xyXG4gICAgICAgIGJveCA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLW92ZXJsYXlcIj48L2Rpdj4nKTtcclxuICAgICAgICBib3guYWRkQ2xhc3MoYWRkY2xhc3MpO1xyXG4gICAgICAgIGlmIChmdWxsKSBib3guYWRkQ2xhc3MoJ2Z1bGwtYmxvY2snKTtcclxuICAgICAgICBib3guYXBwZW5kKGJveGMpO1xyXG4gICAgICAgIGJveC5hdHRyKCdpZCcsIGJJRCk7XHJcbiAgICAgICAgaWYgKGJveEluc2lkZUJsb2NrZWQpXHJcbiAgICAgICAgICAgIGJsb2NrZWQuYXBwZW5kKGJveCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKGJveCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGJveGMgPSBib3guY2hpbGRyZW4oJy5zbW9vdGgtYm94LWJsb2NrLWVsZW1lbnQnKTtcclxuICAgIH1cclxuICAgIC8vIEhpZGRlbiBmb3IgdXNlciwgYnV0IGF2YWlsYWJsZSB0byBjb21wdXRlOlxyXG4gICAgY29udGVudEJveC5zaG93KCk7XHJcbiAgICBib3guc2hvdygpLmNzcygnb3BhY2l0eScsIDApO1xyXG4gICAgLy8gU2V0dGluZyB1cCB0aGUgYm94IGFuZCBzdHlsZXMuXHJcbiAgICBib3hjLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICBpZiAob3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICBib3hjLmFwcGVuZCgkKCc8YSBjbGFzcz1cImNsb3NlLXBvcHVwIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicpKTtcclxuICAgIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycsIG9wdGlvbnMpO1xyXG4gICAgaWYgKCFib3hjLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnKSlcclxuICAgICAgYm94Y1xyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLWFjdGlvbicsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgbnVsbCwgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJykpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnLCB0cnVlKTtcclxuICAgIGJveGMuYXBwZW5kKGNvbnRlbnRCb3gpO1xyXG4gICAgYm94Yy53aWR0aChvcHRpb25zLndpZHRoKTtcclxuICAgIGJveC5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICBpZiAoYm94SW5zaWRlQmxvY2tlZCkge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIGluc2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBibG9ja2VkLmNzcygnei1pbmRleCcpICsgMTApO1xyXG4gICAgICAgIGlmICghYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgfHwgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgPT0gJ3N0YXRpYycpIHtcclxuICAgICAgICAgICAgYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJywgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykpO1xyXG4gICAgICAgICAgICBibG9ja2VkLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9vZmZzID0gYmxvY2tlZC5wb3NpdGlvbigpO1xyXG4gICAgICAgIGJveC5jc3MoJ3RvcCcsIDApO1xyXG4gICAgICAgIGJveC5jc3MoJ2xlZnQnLCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gb3V0c2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50LCBhcyBhIGRpcmVjdCBjaGlsZCBvZiBCb2R5OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBNYXRoLmZsb29yKE51bWJlci5NQVhfVkFMVUUpKTtcclxuICAgICAgICBib3guY3NzKGJsb2NrZWQub2Zmc2V0KCkpO1xyXG4gICAgfVxyXG4gICAgLy8gRGltZW5zaW9ucyBtdXN0IGJlIGNhbGN1bGF0ZWQgYWZ0ZXIgYmVpbmcgYXBwZW5kZWQgYW5kIHBvc2l0aW9uIHR5cGUgYmVpbmcgc2V0OlxyXG4gICAgYm94LndpZHRoKGJsb2NrZWQub3V0ZXJXaWR0aCgpKTtcclxuICAgIGJveC5oZWlnaHQoYmxvY2tlZC5vdXRlckhlaWdodCgpKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5jZW50ZXIpIHtcclxuICAgICAgICBib3hjLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgICAgICB2YXIgY2wsIGN0O1xyXG4gICAgICAgIGlmIChmdWxsKSB7XHJcbiAgICAgICAgICAgIGN0ID0gc2NyZWVuLmhlaWdodCAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gc2NyZWVuLndpZHRoIC8gMjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjdCA9IGJveC5vdXRlckhlaWdodCh0cnVlKSAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gYm94Lm91dGVyV2lkdGgodHJ1ZSkgLyAyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5jZW50ZXIgPT09IHRydWUgfHwgb3B0aW9ucy5jZW50ZXIgPT09ICd2ZXJ0aWNhbCcpXHJcbiAgICAgICAgICAgIGJveGMuY3NzKCd0b3AnLCBjdCAtIGJveGMub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyKTtcclxuICAgICAgICBpZiAob3B0aW9ucy5jZW50ZXIgPT09IHRydWUgfHwgb3B0aW9ucy5jZW50ZXIgPT09ICdob3Jpem9udGFsJylcclxuICAgICAgICAgICAgYm94Yy5jc3MoJ2xlZnQnLCBjbCAtIGJveGMub3V0ZXJXaWR0aCh0cnVlKSAvIDIpO1xyXG4gICAgfVxyXG4gICAgLy8gTGFzdCBzZXR1cFxyXG4gICAgYXV0b0ZvY3VzKGJveCk7XHJcbiAgICAvLyBTaG93IGJsb2NrXHJcbiAgICBib3guYW5pbWF0ZSh7IG9wYWNpdHk6IDEgfSwgMzAwKTtcclxuICAgIGlmIChvcHRpb25zLmF1dG9mb2N1cylcclxuICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50Qm94LCBvcHRpb25zLmF1dG9mb2N1c09wdGlvbnMpO1xyXG4gICAgcmV0dXJuIGJveDtcclxufVxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsKGNvbnRhaW5lcikge1xyXG4gICAgJChjb250YWluZXIgfHwgZG9jdW1lbnQpLmZpbmQoJy5zbW9vdGgtYm94LWJsb2NrLW92ZXJsYXknKS5oaWRlKCk7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvcGVuOiBzbW9vdGhCb3hCbG9jayxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHsgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpOyB9LFxyXG4gICAgICAgIGNsb3NlQWxsOiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsXHJcbiAgICB9OyIsIi8qKlxyXG4qKiBNb2R1bGU6OiB0b29sdGlwc1xyXG4qKiBDcmVhdGVzIHNtYXJ0IHRvb2x0aXBzIHdpdGggcG9zc2liaWxpdGllcyBmb3Igb24gaG92ZXIgYW5kIG9uIGNsaWNrLFxyXG4qKiBhZGRpdGlvbmFsIGRlc2NyaXB0aW9uIG9yIGV4dGVybmFsIHRvb2x0aXAgY29udGVudC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzYW5pdGl6ZVdoaXRlc3BhY2VzID0gcmVxdWlyZSgnLi9zYW5pdGl6ZVdoaXRlc3BhY2VzJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lm91dGVySHRtbCcpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5pc0NoaWxkT2YnKTtcclxuXHJcbi8vIE1haW4gaW50ZXJuYWwgcHJvcGVydGllc1xyXG52YXIgcG9zb2Zmc2V0ID0geyB4OiAxNiwgeTogOCB9O1xyXG52YXIgc2VsZWN0b3IgPSAnW3RpdGxlXVtkYXRhLWRlc2NyaXB0aW9uXSwgW3RpdGxlXS5oYXMtdG9vbHRpcCwgW3RpdGxlXS5zZWN1cmUtZGF0YSwgW2RhdGEtdG9vbHRpcC11cmxdLCBbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJztcclxuXHJcbi8qKiBQb3NpdGlvbmF0ZSB0aGUgdG9vbHRpcCBkZXBlbmRpbmcgb24gdGhlXHJcbmV2ZW50IG9yIHRoZSB0YXJnZXQgZWxlbWVudCBwb3NpdGlvbiBhbmQgYW4gb2Zmc2V0XHJcbioqL1xyXG5mdW5jdGlvbiBwb3ModCwgZSwgbCkge1xyXG4gICAgdmFyIHgsIHk7XHJcbiAgICBpZiAoZS5wYWdlWCAmJiBlLnBhZ2VZKSB7XHJcbiAgICAgICAgeCA9IGUucGFnZVg7XHJcbiAgICAgICAgeSA9IGUucGFnZVk7XHJcbiAgICB9IGVsc2UgaWYgKGUudGFyZ2V0KSB7XHJcbiAgICAgICAgdmFyICRldCA9ICQoZS50YXJnZXQpO1xyXG4gICAgICAgIHggPSAkZXQub3V0ZXJXaWR0aCgpICsgJGV0Lm9mZnNldCgpLmxlZnQ7XHJcbiAgICAgICAgeSA9ICRldC5vdXRlckhlaWdodCgpICsgJGV0Lm9mZnNldCgpLnRvcDtcclxuICAgIH1cclxuICAgIHQuY3NzKCdsZWZ0JywgeCArIHBvc29mZnNldC54KTtcclxuICAgIHQuY3NzKCd0b3AnLCB5ICsgcG9zb2Zmc2V0LnkpO1xyXG4gICAgLy8gQWRqdXN0IHdpZHRoIHRvIHZpc2libGUgdmlld3BvcnRcclxuICAgIHZhciB0ZGlmID0gdC5vdXRlcldpZHRoKCkgLSB0LndpZHRoKCk7XHJcbiAgICB0LmNzcygnbWF4LXdpZHRoJywgJCh3aW5kb3cpLndpZHRoKCkgLSB4IC0gcG9zb2Zmc2V0LnggLSB0ZGlmKTtcclxuICAgIC8vdC5oZWlnaHQoJChkb2N1bWVudCkuaGVpZ2h0KCkgLSB5IC0gcG9zb2Zmc2V0LnkpO1xyXG59XHJcbi8qKiBHZXQgb3IgY3JlYXRlLCBhbmQgcmV0dXJucywgdGhlIHRvb2x0aXAgY29udGVudCBmb3IgdGhlIGVsZW1lbnRcclxuKiovXHJcbmZ1bmN0aW9uIGNvbihsKSB7XHJcbiAgICBpZiAobC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGMgPSBsLmRhdGEoJ3Rvb2x0aXAtY29udGVudCcpLFxyXG4gICAgICAgIHBlcnNpc3RlbnQgPSBsLmRhdGEoJ3BlcnNpc3RlbnQtdG9vbHRpcCcpO1xyXG4gICAgaWYgKCFjKSB7XHJcbiAgICAgICAgdmFyIGggPSBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwuYXR0cigndGl0bGUnKSk7XHJcbiAgICAgICAgdmFyIGQgPSBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwuZGF0YSgnZGVzY3JpcHRpb24nKSk7XHJcbiAgICAgICAgaWYgKGQpXHJcbiAgICAgICAgICAgIGMgPSAnPGg0PicgKyBoICsgJzwvaDQ+PHA+JyArIGQgKyAnPC9wPic7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjID0gaDtcclxuICAgICAgICAvLyBBcHBlbmQgZGF0YS10b29sdGlwLXVybCBjb250ZW50IGlmIGV4aXN0c1xyXG4gICAgICAgIHZhciB1cmxjb250ZW50ID0gJChsLmRhdGEoJ3Rvb2x0aXAtdXJsJykpO1xyXG4gICAgICAgIGMgPSAoYyB8fCAnJykgKyB1cmxjb250ZW50Lm91dGVySHRtbCgpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBvcmlnaW5hbCwgaXMgbm8gbW9yZSBuZWVkIGFuZCBhdm9pZCBpZC1jb25mbGljdHNcclxuICAgICAgICB1cmxjb250ZW50LnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIFNhdmUgdG9vbHRpcCBjb250ZW50XHJcbiAgICAgICAgbC5kYXRhKCd0b29sdGlwLWNvbnRlbnQnLCBjKTtcclxuICAgICAgICAvLyBSZW1vdmUgYnJvd3NlciB0b29sdGlwIChib3RoIHdoZW4gd2UgYXJlIHVzaW5nIG91ciBvd24gdG9vbHRpcCBhbmQgd2hlbiBubyB0b29sdGlwXHJcbiAgICAgICAgLy8gaXMgbmVlZClcclxuICAgICAgICBsLmF0dHIoJ3RpdGxlJywgJycpO1xyXG4gICAgfVxyXG4gICAgLy8gUmVtb3ZlIHRvb2x0aXAgY29udGVudCAoYnV0IHByZXNlcnZlIGl0cyBjYWNoZSBpbiB0aGUgZWxlbWVudCBkYXRhKVxyXG4gICAgLy8gaWYgaXMgdGhlIHNhbWUgdGV4dCBhcyB0aGUgZWxlbWVudCBjb250ZW50IGFuZCB0aGUgZWxlbWVudCBjb250ZW50XHJcbiAgICAvLyBpcyBmdWxseSB2aXNpYmxlLiBUaGF0cywgZm9yIGNhc2VzIHdpdGggZGlmZmVyZW50IGNvbnRlbnQsIHdpbGwgYmUgc2hvd2VkLFxyXG4gICAgLy8gYW5kIGZvciBjYXNlcyB3aXRoIHNhbWUgY29udGVudCBidXQgaXMgbm90IHZpc2libGUgYmVjYXVzZSB0aGUgZWxlbWVudFxyXG4gICAgLy8gb3IgY29udGFpbmVyIHdpZHRoLCB0aGVuIHdpbGwgYmUgc2hvd2VkLlxyXG4gICAgLy8gRXhjZXB0IGlmIGlzIHBlcnNpc3RlbnRcclxuICAgIGlmIChwZXJzaXN0ZW50ICE9PSB0cnVlICYmXHJcbiAgICAgICAgc2FuaXRpemVXaGl0ZXNwYWNlcyhsLnRleHQoKSkgPT0gYyAmJlxyXG4gICAgICAgIGwub3V0ZXJXaWR0aCgpID49IGxbMF0uc2Nyb2xsV2lkdGgpIHtcclxuICAgICAgICBjID0gbnVsbDtcclxuICAgIH1cclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIGNvbnRlbnQ6XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICAvLyBVcGRhdGUgdGFyZ2V0IHJlbW92aW5nIHRoZSBjbGFzcyB0byBhdm9pZCBjc3MgbWFya2luZyB0b29sdGlwIHdoZW4gdGhlcmUgaXMgbm90XHJcbiAgICAgICAgbC5yZW1vdmVDbGFzcygnaGFzLXRvb2x0aXAnKS5yZW1vdmVDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIH1cclxuICAgIC8vIFJldHVybiB0aGUgY29udGVudCBhcyBzdHJpbmc6XHJcbiAgICByZXR1cm4gYztcclxufVxyXG4vKiogR2V0IG9yIGNyZWF0ZXMgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBmb3IgYSB0b29sdGlwIG9mIHRoZSBnaXZlbiB0eXBlXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRUb29sdGlwKHR5cGUpIHtcclxuICAgIHR5cGUgPSB0eXBlIHx8ICd0b29sdGlwJztcclxuICAgIHZhciBpZCA9ICdzaW5nbGV0b24tJyArIHR5cGU7XHJcbiAgICB2YXIgdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgIGlmICghdCkge1xyXG4gICAgICAgIHQgPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIiBjbGFzcz1cInRvb2x0aXBcIj48L2Rpdj4nKTtcclxuICAgICAgICB0LmF0dHIoJ2lkJywgaWQpO1xyXG4gICAgICAgIHQuaGlkZSgpO1xyXG4gICAgICAgICQoJ2JvZHknKS5hcHBlbmQodCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJCh0KTtcclxufVxyXG4vKiogU2hvdyB0aGUgdG9vbHRpcCBvbiBhbiBldmVudCB0cmlnZ2VyZWQgYnkgdGhlIGVsZW1lbnQgY29udGFpbmluZ1xyXG5pbmZvcm1hdGlvbiBmb3IgYSB0b29sdGlwXHJcbioqL1xyXG5mdW5jdGlvbiBzaG93VG9vbHRpcChlKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGlzUG9wdXAgPSAkdC5oYXNDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIC8vIEdldCBvciBjcmVhdGUgdG9vbHRpcCBsYXllclxyXG4gICAgdmFyIHQgPSBnZXRUb29sdGlwKGlzUG9wdXAgPyAncG9wdXAtdG9vbHRpcCcgOiAndG9vbHRpcCcpO1xyXG4gICAgLy8gSWYgdGhpcyBpcyBub3QgcG9wdXAgYW5kIHRoZSBldmVudCBpcyBjbGljaywgZGlzY2FyZCB3aXRob3V0IGNhbmNlbCBldmVudFxyXG4gICAgaWYgKCFpc1BvcHVwICYmIGUudHlwZSA9PSAnY2xpY2snKVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIC8vIENyZWF0ZSBjb250ZW50OiBpZiB0aGVyZSBpcyBjb250ZW50LCBjb250aW51ZVxyXG4gICAgdmFyIGNvbnRlbnQgPSBjb24oJHQpO1xyXG4gICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAvLyBJZiBpcyBhIGhhcy1wb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBkb24ndCBzaG93XHJcbiAgICAgICAgaWYgKGlzUG9wdXAgJiYgZS50eXBlICE9ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vIFRoZSB0b29sdGlwIHNldHVwIG11c3QgYmUgcXVldWVkIHRvIGF2b2lkIGNvbnRlbnQgdG8gYmUgc2hvd2VkIGFuZCBwbGFjZWRcclxuICAgICAgICAvLyB3aGVuIHN0aWxsIGhpZGRlbiB0aGUgcHJldmlvdXNcclxuICAgICAgICB0LnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gU2V0IHRvb2x0aXAgY29udGVudFxyXG4gICAgICAgICAgICB0Lmh0bWwoY29udGVudCk7XHJcbiAgICAgICAgICAgIC8vIEZvciBwb3B1cHMsIHNldHVwIGNsYXNzIGFuZCBjbG9zZSBidXR0b25cclxuICAgICAgICAgICAgaWYgKGlzUG9wdXApIHtcclxuICAgICAgICAgICAgICAgIHQuYWRkQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKTtcclxuICAgICAgICAgICAgICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxhIGhyZWY9XCIjY2xvc2UtcG9wdXBcIiBjbGFzcz1cImNsb3NlLWFjdGlvblwiPlg8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0LmFwcGVuZChjbG9zZUJ1dHRvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gUG9zaXRpb25hdGVcclxuICAgICAgICAgICAgcG9zKHQsIGUsICR0KTtcclxuICAgICAgICAgICAgdC5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgIC8vIFNob3cgKGFuaW1hdGlvbnMgYXJlIHN0b3BwZWQgb25seSBvbiBoaWRlIHRvIGF2b2lkIGNvbmZsaWN0cylcclxuICAgICAgICAgICAgdC5mYWRlSW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdG9wIGJ1YmJsaW5nIGFuZCBkZWZhdWx0XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEhpZGUgYWxsIG9wZW5lZCB0b29sdGlwcywgZm9yIGFueSB0eXBlLlxyXG5JdCBoYXMgc29tZSBzcGVjaWFsIGNvbnNpZGVyYXRpb25zIGZvciBwb3B1cC10b29sdGlwcyBkZXBlbmRpbmdcclxub24gdGhlIGV2ZW50IGJlaW5nIHRyaWdnZXJlZC5cclxuKiovXHJcbmZ1bmN0aW9uIGhpZGVUb29sdGlwKGUpIHtcclxuICAgICQoJy50b29sdGlwOnZpc2libGUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBvciB0aGUgaW52ZXJzZSxcclxuICAgICAgICAvLyB0aGlzIGlzIG5vdCBhIHBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgYSBjbGljaywgZG8gbm90aGluZ1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlICE9ICdjbGljaycgfHxcclxuICAgICAgICAgICAgIXQuaGFzQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKSAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIFN0b3AgYW5pbWF0aW9ucyBhbmQgaGlkZVxyXG4gICAgICAgIHQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEluaXRpYWxpemUgdG9vbHRpcHNcclxuKiovXHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyB0byBzaG93L2hpZGUgdG9vbHRpcHNcclxuICAgICQoJ2JvZHknKS5vbignbW91c2Vtb3ZlIGZvY3VzaW4nLCBzZWxlY3Rvciwgc2hvd1Rvb2x0aXApXHJcbiAgICAub24oJ21vdXNlbGVhdmUgZm9jdXNvdXQnLCBzZWxlY3RvciwgaGlkZVRvb2x0aXApXHJcbiAgICAvLyBMaXN0ZW4gZXZlbnQgZm9yIGNsaWNrYWJsZSBwb3B1cC10b29sdGlwc1xyXG4gICAgLm9uKCdjbGljaycsICdbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJywgc2hvd1Rvb2x0aXApXHJcbiAgICAvLyBBbGxvd2luZyBidXR0b25zIGluc2lkZSB0aGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcudG9vbHRpcC1idXR0b24nLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgIC8vIEFkZGluZyBjbG9zZS10b29sdGlwIGhhbmRsZXIgZm9yIHBvcHVwLXRvb2x0aXBzIChjbGljayBvbiBhbnkgZWxlbWVudCBleGNlcHQgdGhlIHRvb2x0aXAgaXRzZWxmKVxyXG4gICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKCcucG9wdXAtdG9vbHRpcDp2aXNpYmxlJykuZ2V0KDApO1xyXG4gICAgICAgIC8vIElmIHRoZSBjbGljayBpcyBOb3Qgb24gdGhlIHRvb2x0aXAgb3IgYW55IGVsZW1lbnQgY29udGFpbmVkXHJcbiAgICAgICAgLy8gaGlkZSB0b29sdGlwXHJcbiAgICAgICAgaWYgKGUudGFyZ2V0ICE9IHQgJiYgISQoZS50YXJnZXQpLmlzQ2hpbGRPZih0KSlcclxuICAgICAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KVxyXG4gICAgLy8gQXZvaWQgY2xvc2UtYWN0aW9uIGNsaWNrIGZyb20gcmVkaXJlY3QgcGFnZSwgYW5kIGhpZGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcucG9wdXAtdG9vbHRpcCAuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KTtcclxuICAgIHVwZGF0ZSgpO1xyXG59XHJcbi8qKiBVcGRhdGUgZWxlbWVudHMgb24gdGhlIHBhZ2UgdG8gcmVmbGVjdCBjaGFuZ2VzIG9yIG5lZWQgZm9yIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoZWxlbWVudF9zZWxlY3Rvcikge1xyXG4gICAgLy8gUmV2aWV3IGV2ZXJ5IHBvcHVwIHRvb2x0aXAgdG8gcHJlcGFyZSBjb250ZW50IGFuZCBtYXJrL3VubWFyayB0aGUgbGluayBvciB0ZXh0OlxyXG4gICAgJChlbGVtZW50X3NlbGVjdG9yIHx8IHNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb24oJCh0aGlzKSk7XHJcbiAgICB9KTtcclxufVxyXG4vKiogQ3JlYXRlIHRvb2x0aXAgb24gZWxlbWVudCBieSBkZW1hbmRcclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZV90b29sdGlwKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCB7XHJcbiAgICAgIHRpdGxlOiAnJ1xyXG4gICAgICAsIGRlc2NyaXB0aW9uOiBudWxsXHJcbiAgICAgICwgdXJsOiBudWxsXHJcbiAgICAgICwgaXNfcG9wdXA6IGZhbHNlXHJcbiAgICAgICwgcGVyc2lzdGVudDogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoZWxlbWVudClcclxuICAgIC5hdHRyKCd0aXRsZScsIHNldHRpbmdzLnRpdGxlKVxyXG4gICAgLmRhdGEoJ2Rlc2NyaXB0aW9uJywgc2V0dGluZ3MuZGVzY3JpcHRpb24pXHJcbiAgICAuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJywgc2V0dGluZ3MucGVyc2lzdGVudClcclxuICAgIC5hZGRDbGFzcyhzZXR0aW5ncy5pc19wb3B1cCA/ICdoYXMtcG9wdXAtdG9vbHRpcCcgOiAnaGFzLXRvb2x0aXAnKTtcclxuICAgIHVwZGF0ZShlbGVtZW50KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdFRvb2x0aXBzOiBpbml0LFxyXG4gICAgICAgIHVwZGF0ZVRvb2x0aXBzOiB1cGRhdGUsXHJcbiAgICAgICAgY3JlYXRlVG9vbHRpcDogY3JlYXRlX3Rvb2x0aXBcclxuICAgIH07XHJcbiIsIi8qIFNvbWUgdG9vbHMgZm9ybSBVUkwgbWFuYWdlbWVudFxyXG4qL1xyXG5leHBvcnRzLmdldFVSTFBhcmFtZXRlciA9IGZ1bmN0aW9uIGdldFVSTFBhcmFtZXRlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gZGVjb2RlVVJJKFxyXG4gICAgICAgIChSZWdFeHAobmFtZSArICc9JyArICcoLis/KSgmfCQpJywgJ2knKS5leGVjKGxvY2F0aW9uLnNlYXJjaCkgfHwgWywgbnVsbF0pWzFdKTtcclxufTtcclxuZXhwb3J0cy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSBmdW5jdGlvbiBnZXRIYXNoQmFuZ1BhcmFtZXRlcnMoaGFzaGJhbmd2YWx1ZSkge1xyXG4gICAgLy8gSGFzaGJhbmd2YWx1ZSBpcyBzb21ldGhpbmcgbGlrZTogVGhyZWFkLTFfTWVzc2FnZS0yXHJcbiAgICAvLyBXaGVyZSAnMScgaXMgdGhlIFRocmVhZElEIGFuZCAnMicgdGhlIG9wdGlvbmFsIE1lc3NhZ2VJRCwgb3Igb3RoZXIgcGFyYW1ldGVyc1xyXG4gICAgdmFyIHBhcnMgPSBoYXNoYmFuZ3ZhbHVlLnNwbGl0KCdfJyk7XHJcbiAgICB2YXIgdXJsUGFyYW1ldGVycyA9IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHBhcnN2YWx1ZXMgPSBwYXJzW2ldLnNwbGl0KCctJyk7XHJcbiAgICAgICAgaWYgKHBhcnN2YWx1ZXMubGVuZ3RoID09IDIpXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSBwYXJzdmFsdWVzWzFdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXJsUGFyYW1ldGVyc1twYXJzdmFsdWVzWzBdXSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXJsUGFyYW1ldGVycztcclxufTtcclxuIiwiLyoqIFZhbGlkYXRpb24gbG9naWMgd2l0aCBsb2FkIGFuZCBzZXR1cCBvZiB2YWxpZGF0b3JzIGFuZCBcclxuICAgIHZhbGlkYXRpb24gcmVsYXRlZCB1dGlsaXRpZXNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbi8vIFVzaW5nIG9uIHNldHVwIGFzeW5jcm9ub3VzIGxvYWQgaW5zdGVhZCBvZiB0aGlzIHN0YXRpYy1saW5rZWQgbG9hZFxyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qcycpO1xyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qcycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBWYWxpZGF0aW9uKHJlYXBwbHlPbmx5VG8pIHtcclxuICAgIHJlYXBwbHlPbmx5VG8gPSByZWFwcGx5T25seVRvIHx8IGRvY3VtZW50O1xyXG4gICAgaWYgKCF3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkgd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmICghanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkge1xyXG4gICAgICAgIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKFtcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qc1wiIH0sXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanNcIiB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDaGVjayBmaXJzdCBpZiB2YWxpZGF0aW9uIGlzIGVuYWJsZWQgKGNhbiBoYXBwZW4gdGhhdCB0d2ljZSBpbmNsdWRlcyBvZlxyXG4gICAgICAgIC8vIHRoaXMgY29kZSBoYXBwZW4gYXQgc2FtZSBwYWdlLCBiZWluZyBleGVjdXRlZCB0aGlzIGNvZGUgYWZ0ZXIgZmlyc3QgYXBwZWFyYW5jZVxyXG4gICAgICAgIC8vIHdpdGggdGhlIHN3aXRjaCBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkIGNoYW5nZWRcclxuICAgICAgICAvLyBidXQgd2l0aG91dCB2YWxpZGF0aW9uIGJlaW5nIGFscmVhZHkgbG9hZGVkIGFuZCBlbmFibGVkKVxyXG4gICAgICAgIGlmICgkICYmICQudmFsaWRhdG9yICYmICQudmFsaWRhdG9yLnVub2J0cnVzaXZlKSB7XHJcbiAgICAgICAgICAgIC8vIEFwcGx5IHRoZSB2YWxpZGF0aW9uIHJ1bGVzIHRvIHRoZSBuZXcgZWxlbWVudHNcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd2YWxpZGF0b3InKTtcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICAgICAgJC52YWxpZGF0b3IudW5vYnRydXNpdmUucGFyc2UocmVhcHBseU9ubHlUbyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXRpZXMgKi9cclxuXHJcbi8qIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzIG9mIHRoZSB2YWxpZGF0aW9uIHN1bW1hcnlcclxuaW5jbHVkZWQgaW4gJ2NvbnRhaW5lcicgYW5kIHNldCBhcyB2YWxpZCB0aGUgc3VtbWFyeVxyXG4qL1xyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgICAkKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAuZmluZCgnPnVsPmxpJykucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gU2V0IGFsbCBmaWVsZHMgdmFsaWRhdGlvbiBpbnNpZGUgdGhpcyBmb3JtIChhZmZlY3RlZCBieSB0aGUgc3VtbWFyeSB0b28pXHJcbiAgICAvLyBhcyB2YWxpZCB0b29cclxuICAgICQoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAudGV4dCgnJyk7XHJcblxyXG4gICAgLy8gUmUtYXBwbHkgc2V0dXAgdmFsaWRhdGlvbiB0byBlbnN1cmUgaXMgd29ya2luZywgYmVjYXVzZSBqdXN0IGFmdGVyIGEgc3VjY2Vzc2Z1bFxyXG4gICAgLy8gdmFsaWRhdGlvbiwgYXNwLm5ldCB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIHN0b3BzIHdvcmtpbmcgb24gY2xpZW50LXNpZGUuXHJcbiAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGNvbnRhaW5lciwgZXJyb3JzKSB7XHJcbiAgdmFyIHYgPSBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKTtcclxuICB2LmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRFcnJvcnMoY29udGFpbmVyLCBlcnJvcnMpIHtcclxuICAgIC8vdmFyIHZhbGlkYXRvciA9ICQoY29udGFpbmVyKS52YWxpZGF0ZSgpO1xyXG4gICAgLy92YWxpZGF0b3Iuc2hvd0Vycm9ycyhlcnJvcnMpO1xyXG4gICAgdmFyICRzID0gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcikuZmluZCgndWwnKTtcclxuICAgIHZhciB3aXRoRXJyb3JzID0gZmFsc2U7XHJcbiAgICBmb3IodmFyIGZpZWxkIGluIGVycm9ycykge1xyXG4gICAgICAgIGlmIChlcnJvcnMuaGFzT3duUHJvcGVydHkgJiYgIWVycm9ycy5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICQoJzxsaS8+JykudGV4dChlcnJvcnNbZmllbGRdKS5hcHBlbmRUbygkcyk7XHJcbiAgICAgICAgLy8kKGNvbnRhaW5lcikuZmluZCgnW25hbWU9XCInICsgZmllbGQgKyAnXCJdJylcclxuICAgICAgICAvLy5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgLy8ucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQgdmFsaWQnKTtcclxuICAgICAgICB3aXRoRXJyb3JzID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlmICh3aXRoRXJyb3JzKVxyXG4gICAgICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihjb250YWluZXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnb1RvU3VtbWFyeUVycm9ycyhmb3JtKSB7XHJcbiAgICB2YXIgb2ZmID0gZm9ybS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLm9mZnNldCgpO1xyXG4gICAgaWYgKG9mZilcclxuICAgICAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IG9mZi50b3AgfSwgNTAwKTtcclxuICAgIGVsc2VcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdnb1RvU3VtbWFyeUVycm9yczogbm8gc3VtbWFyeSB0byBmb2N1cycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKSB7XHJcbiAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gIHJldHVybiAkKCdbZGF0YS12YWxtc2ctc3VtbWFyeT10cnVlXScsIGNvbnRhaW5lcik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2V0dXA6IHNldHVwVmFsaWRhdGlvbixcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDogc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IsXHJcbiAgICBnb1RvU3VtbWFyeUVycm9yczogZ29Ub1N1bW1hcnlFcnJvcnMsXHJcbiAgICBmaW5kVmFsaWRhdGlvblN1bW1hcnk6IGZpbmRWYWxpZGF0aW9uU3VtbWFyeSxcclxuICAgIHNldEVycm9yczogc2V0RXJyb3JzXHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIEFjY291bnQgcGFnZXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudClcclxuICAgIC5vbignY2xpY2snLCAnYS5sb2dpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArICdBY2NvdW50LyRMb2dpbi8/UmV0dXJuVXJsPScgKyBlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5mb3Jnb3QtcGFzc3dvcmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvRm9yZ290UGFzc3dvcmQnLCAnL0FjY291bnQvJEZvcmdvdFBhc3N3b3JkJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0MDAsIGhlaWdodDogMjQwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EuY2hhbmdlLXBhc3N3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L0NoYW5nZVBhc3N3b3JkJywgJy9BY2NvdW50LyRDaGFuZ2VQYXNzd29yZCcpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDUwLCBoZWlnaHQ6IDM0MCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvLyBPVVIgbmFtZXNwYWNlIChhYmJyZXZpYXRlZCBMb2Nvbm9taWNzKVxyXG53aW5kb3cuTEMgPSB3aW5kb3cuTEMgfHwge307XHJcblxyXG4vLyBUT0RPIFJldmlldyBMY1VybCB1c2UgYXJvdW5kIGFsbCB0aGUgbW9kdWxlcywgdXNlIERJIHdoZW5ldmVyIHBvc3NpYmxlIChpbml0L3NldHVwIG1ldGhvZCBvciBpbiB1c2UgY2FzZXMpXHJcbi8vIGJ1dCBvbmx5IGZvciB0aGUgd2FudGVkIGJhc2VVcmwgb24gZWFjaCBjYXNlIGFuZCBub3QgcGFzcyBhbGwgdGhlIExjVXJsIG9iamVjdC5cclxuLy8gTGNVcmwgaXMgc2VydmVyLXNpZGUgZ2VuZXJhdGVkIGFuZCB3cm90ZSBpbiBhIExheW91dCBzY3JpcHQtdGFnLlxyXG5cclxuLy8gR2xvYmFsIHNldHRpbmdzXHJcbndpbmRvdy5nTG9hZGluZ1JldGFyZCA9IDMwMDtcclxuXHJcbi8qKipcclxuICoqIExvYWRpbmcgbW9kdWxlc1xyXG4qKiovXHJcbi8vVE9ETzogQ2xlYW4gZGVwZW5kZW5jaWVzLCByZW1vdmUgYWxsIHRoYXQgbm90IHVzZWQgZGlyZWN0bHkgaW4gdGhpcyBmaWxlLCBhbnkgb3RoZXIgZmlsZVxyXG4vLyBvciBwYWdlIG11c3QgcmVxdWlyZSBpdHMgZGVwZW5kZW5jaWVzLlxyXG5cclxud2luZG93LkxjVXJsID0gcmVxdWlyZSgnLi4vTEMvTGNVcmwnKTtcclxuXHJcbi8qIGpRdWVyeSwgc29tZSB2ZW5kb3IgcGx1Z2lucyAoZnJvbSBidW5kbGUpIGFuZCBvdXIgYWRkaXRpb25zIChzbWFsbCBwbHVnaW5zKSwgdGhleSBhcmUgYXV0b21hdGljYWxseSBwbHVnLWVkIG9uIHJlcXVpcmUgKi9cclxudmFyICQgPSB3aW5kb3cuJCA9IHdpbmRvdy5qUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5Lmhhc1Njcm9sbEJhcicpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmEtaGFzaGNoYW5nZScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkuYXJlJyk7XHJcbi8vIE1hc2tlZCBpbnB1dCwgZm9yIGRhdGVzIC1hdCBteS1hY2NvdW50LS5cclxucmVxdWlyZSgnanF1ZXJ5LmZvcm1hdHRlcicpO1xyXG5cclxuLy8gR2VuZXJhbCBjYWxsYmFja3MgZm9yIEFKQVggZXZlbnRzIHdpdGggY29tbW9uIGxvZ2ljXHJcbnZhciBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnLi4vTEMvYWpheENhbGxiYWNrcycpO1xyXG4vLyBGb3JtLmFqYXggbG9naWMgYW5kIG1vcmUgc3BlY2lmaWMgY2FsbGJhY2tzIGJhc2VkIG9uIGFqYXhDYWxsYmFja3NcclxudmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxud2luZG93LmFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyID0gYWpheEZvcm1zLm9uU3VjY2Vzcztcclxud2luZG93LmFqYXhFcnJvclBvcHVwSGFuZGxlciA9IGFqYXhGb3Jtcy5vbkVycm9yO1xyXG53aW5kb3cuYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyID0gYWpheEZvcm1zLm9uQ29tcGxldGU7XHJcbi8vfVxyXG5cclxuLyogUmVsb2FkICovXHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5yZWxvYWQnKTtcclxuLy8gV3JhcHBlciBmdW5jdGlvbiBhcm91bmQgb25TdWNjZXNzIHRvIG1hcmsgb3BlcmF0aW9uIGFzIHBhcnQgb2YgYSBcclxuLy8gcmVsb2FkIGF2b2lkaW5nIHNvbWUgYnVncyAoYXMgcmVwbGFjZS1jb250ZW50IG9uIGFqYXgtYm94LCBub3Qgd2FudGVkIGZvclxyXG4vLyByZWxvYWQgb3BlcmF0aW9ucylcclxuZnVuY3Rpb24gcmVsb2FkU3VjY2Vzc1dyYXBwZXIoKSB7XHJcbiAgdmFyIGNvbnRleHQgPSAkLmlzUGxhaW5PYmplY3QodGhpcykgPyB0aGlzIDogeyBlbGVtZW50OiB0aGlzIH07XHJcbiAgY29udGV4dC5pc1JlbG9hZCA9IHRydWU7XHJcbiAgYWpheEZvcm1zLm9uU3VjY2Vzcy5hcHBseShjb250ZXh0LCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcclxufVxyXG4kLmZuLnJlbG9hZC5kZWZhdWx0cyA9IHtcclxuICBzdWNjZXNzOiBbcmVsb2FkU3VjY2Vzc1dyYXBwZXJdLFxyXG4gIGVycm9yOiBbYWpheEZvcm1zLm9uRXJyb3JdLFxyXG4gIGRlbGF5OiBnTG9hZGluZ1JldGFyZFxyXG59O1xyXG5cclxuTEMubW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuLi9MQy9tb3ZlRm9jdXNUbycpO1xyXG4vKiBEaXNhYmxlZCBiZWNhdXNlIGNvbmZsaWN0cyB3aXRoIHRoZSBtb3ZlRm9jdXNUbyBvZiBcclxuICBhamF4Rm9ybS5vbnN1Y2Nlc3MsIGl0IGhhcHBlbnMgYSBibG9jay5sb2FkaW5nIGp1c3QgYWZ0ZXJcclxuICB0aGUgc3VjY2VzcyBoYXBwZW5zLlxyXG4kLmJsb2NrVUkuZGVmYXVsdHMub25CbG9jayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFNjcm9sbCB0byBibG9jay1tZXNzYWdlIHRvIGRvbid0IGxvc3QgaW4gbGFyZ2UgcGFnZXM6XHJcbiAgICBMQy5tb3ZlRm9jdXNUbyh0aGlzKTtcclxufTsqL1xyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4uL0xDL2xvYWRlcicpO1xyXG5MQy5sb2FkID0gbG9hZGVyLmxvYWQ7XHJcblxyXG52YXIgYmxvY2tzID0gTEMuYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi4vTEMvYmxvY2tQcmVzZXRzJyk7XHJcbi8ve1RFTVBcclxud2luZG93LmxvYWRpbmdCbG9jayA9IGJsb2Nrcy5sb2FkaW5nO1xyXG53aW5kb3cuaW5mb0Jsb2NrID0gYmxvY2tzLmluZm87XHJcbndpbmRvdy5lcnJvckJsb2NrID0gYmxvY2tzLmVycm9yO1xyXG4vL31cclxuXHJcbkFycmF5LnJlbW92ZSA9IHJlcXVpcmUoJy4uL0xDL0FycmF5LnJlbW92ZScpO1xyXG5yZXF1aXJlKCcuLi9MQy9TdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zJyk7XHJcblxyXG5MQy5nZXRUZXh0ID0gcmVxdWlyZSgnLi4vTEMvZ2V0VGV4dCcpO1xyXG5cclxudmFyIFRpbWVTcGFuID0gTEMudGltZVNwYW4gPSByZXF1aXJlKCcuLi9MQy9UaW1lU3BhbicpO1xyXG52YXIgdGltZVNwYW5FeHRyYSA9IHJlcXVpcmUoJy4uL0xDL1RpbWVTcGFuRXh0cmEnKTtcclxudGltZVNwYW5FeHRyYS5wbHVnSW4oVGltZVNwYW4pO1xyXG4vL3tURU1QICBvbGQgYWxpYXNlc1xyXG5MQy5zbWFydFRpbWUgPSB0aW1lU3BhbkV4dHJhLnNtYXJ0VGltZTtcclxuTEMucm91bmRUaW1lVG9RdWFydGVySG91ciA9IHRpbWVTcGFuRXh0cmEucm91bmRUb1F1YXJ0ZXJIb3VyO1xyXG4vL31cclxuXHJcbkxDLkNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuLi9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbndpbmRvdy5UYWJiZWRVWCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYJyk7XHJcbnZhciBzbGlkZXJUYWJzID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguc2xpZGVyVGFicycpO1xyXG5cclxuLy8gUG9wdXAgQVBJc1xyXG53aW5kb3cuc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuLi9MQy9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi4vTEMvcG9wdXAnKTtcclxuLy97VEVNUFxyXG52YXIgcG9wdXBTdHlsZSA9IHBvcHVwLnN0eWxlLFxyXG4gICAgcG9wdXBTaXplID0gcG9wdXAuc2l6ZTtcclxuTEMubWVzc2FnZVBvcHVwID0gcG9wdXAubWVzc2FnZTtcclxuTEMuY29ubmVjdFBvcHVwQWN0aW9uID0gcG9wdXAuY29ubmVjdEFjdGlvbjtcclxud2luZG93LnBvcHVwID0gcG9wdXA7XHJcbi8vfVxyXG5cclxuTEMuc2FuaXRpemVXaGl0ZXNwYWNlcyA9IHJlcXVpcmUoJy4uL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMnKTtcclxuLy97VEVNUCAgIGFsaWFzIGJlY2F1c2UgbWlzc3BlbGxpbmdcclxuTEMuc2FuaXRpemVXaGl0ZXBhY2VzID0gTEMuc2FuaXRpemVXaGl0ZXNwYWNlcztcclxuLy99XHJcblxyXG5MQy5nZXRYUGF0aCA9IHJlcXVpcmUoJy4uL0xDL2dldFhQYXRoJyk7XHJcblxyXG52YXIgc3RyaW5nRm9ybWF0ID0gcmVxdWlyZSgnLi4vTEMvU3RyaW5nRm9ybWF0Jyk7XHJcblxyXG4vLyBFeHBhbmRpbmcgZXhwb3J0ZWQgdXRpbGl0ZXMgZnJvbSBtb2R1bGVzIGRpcmVjdGx5IGFzIExDIG1lbWJlcnM6XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9QcmljZScpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL21hdGhVdGlscycpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL251bWJlclV0aWxzJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvdG9vbHRpcHMnKSk7XHJcbnZhciBpMThuID0gTEMuaTE4biA9IHJlcXVpcmUoJy4uL0xDL2kxOG4nKTtcclxuLy97VEVNUCBvbGQgYWxpc2VzIG9uIExDIGFuZCBnbG9iYWxcclxuJC5leHRlbmQoTEMsIGkxOG4pO1xyXG4kLmV4dGVuZCh3aW5kb3csIGkxOG4pO1xyXG4vL31cclxuXHJcbi8vIHh0c2g6IHBsdWdlZCBpbnRvIGpxdWVyeSBhbmQgcGFydCBvZiBMQ1xyXG52YXIgeHRzaCA9IHJlcXVpcmUoJy4uL0xDL2pxdWVyeS54dHNoJyk7XHJcbnh0c2gucGx1Z0luKCQpO1xyXG4vL3tURU1QICAgcmVtb3ZlIG9sZCBMQy4qIGFsaWFzXHJcbiQuZXh0ZW5kKExDLCB4dHNoKTtcclxuZGVsZXRlIExDLnBsdWdJbjtcclxuLy99XHJcblxyXG52YXIgYXV0b0NhbGN1bGF0ZSA9IExDLmF1dG9DYWxjdWxhdGUgPSByZXF1aXJlKCcuLi9MQy9hdXRvQ2FsY3VsYXRlJyk7XHJcbi8ve1RFTVAgICByZW1vdmUgb2xkIGFsaWFzIHVzZVxyXG52YXIgbGNTZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMgPSBhdXRvQ2FsY3VsYXRlLm9uVGFibGVJdGVtcztcclxuTEMuc2V0dXBDYWxjdWxhdGVTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnk7XHJcbkxDLnVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLnVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnk7XHJcbkxDLnNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUub25EZXRhaWxlZFByaWNpbmdTdW1tYXJ5O1xyXG4vL31cclxuXHJcbnZhciBDb29raWUgPSBMQy5Db29raWUgPSByZXF1aXJlKCcuLi9MQy9Db29raWUnKTtcclxuLy97VEVNUCAgICBvbGQgYWxpYXNcclxudmFyIGdldENvb2tpZSA9IENvb2tpZS5nZXQsXHJcbiAgICBzZXRDb29raWUgPSBDb29raWUuc2V0O1xyXG4vL31cclxuXHJcbkxDLmRhdGVQaWNrZXIgPSByZXF1aXJlKCcuLi9MQy9kYXRlUGlja2VyJyk7XHJcbi8ve1RFTVAgICBvbGQgYWxpYXNcclxud2luZG93LnNldHVwRGF0ZVBpY2tlciA9IExDLnNldHVwRGF0ZVBpY2tlciA9IExDLmRhdGVQaWNrZXIuaW5pdDtcclxud2luZG93LmFwcGx5RGF0ZVBpY2tlciA9IExDLmFwcGx5RGF0ZVBpY2tlciA9IExDLmRhdGVQaWNrZXIuYXBwbHk7XHJcbi8vfVxyXG5cclxuTEMuYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi4vTEMvYXV0b0ZvY3VzJyk7XHJcblxyXG4vLyBDUlVETDogbG9hZGluZyBtb2R1bGUsIHNldHRpbmcgdXAgY29tbW9uIGRlZmF1bHQgdmFsdWVzIGFuZCBjYWxsYmFja3M6XHJcbnZhciBjcnVkbE1vZHVsZSA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJyk7XHJcbmNydWRsTW9kdWxlLmRlZmF1bHRTZXR0aW5ncy5kYXRhWydmb2N1cy1jbG9zZXN0J11bJ2RlZmF1bHQnXSA9ICcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nO1xyXG5jcnVkbE1vZHVsZS5kZWZhdWx0U2V0dGluZ3MuZGF0YVsnZm9jdXMtbWFyZ2luJ11bJ2RlZmF1bHQnXSA9IDEwO1xyXG52YXIgY3J1ZGwgPSBjcnVkbE1vZHVsZS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vLyBQcmV2aW91cyB1c2VkIGFsaWFzIChkZXByZWNhdGVkKTpcclxuTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcblxyXG4vLyBVSSBTbGlkZXIgTGFiZWxzXHJcbnZhciBzbGlkZXJMYWJlbHMgPSByZXF1aXJlKCcuLi9MQy9VSVNsaWRlckxhYmVscycpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxuTEMuY3JlYXRlTGFiZWxzRm9yVUlTbGlkZXIgPSBzbGlkZXJMYWJlbHMuY3JlYXRlO1xyXG5MQy51cGRhdGVMYWJlbHNGb3JVSVNsaWRlciA9IHNsaWRlckxhYmVscy51cGRhdGU7XHJcbkxDLnVpU2xpZGVyTGFiZWxzTGF5b3V0cyA9IHNsaWRlckxhYmVscy5sYXlvdXRzO1xyXG4vL31cclxuXHJcbnZhciB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi4vTEMvdmFsaWRhdGlvbkhlbHBlcicpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxuTEMuc2V0dXBWYWxpZGF0aW9uID0gdmFsaWRhdGlvbkhlbHBlci5zZXR1cDtcclxuTEMuc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkID0gdmFsaWRhdGlvbkhlbHBlci5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQ7XHJcbkxDLmdvVG9TdW1tYXJ5RXJyb3JzID0gdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycztcclxuLy99XHJcblxyXG5MQy5wbGFjZUhvbGRlciA9IHJlcXVpcmUoJy4uL0xDL3BsYWNlaG9sZGVyLXBvbHlmaWxsJykuaW5pdDtcclxuXHJcbkxDLm1hcFJlYWR5ID0gcmVxdWlyZSgnLi4vTEMvZ29vZ2xlTWFwUmVhZHknKTtcclxuXHJcbndpbmRvdy5pc0VtcHR5U3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvaXNFbXB0eVN0cmluZycpO1xyXG5cclxud2luZG93Lmd1aWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9MQy9ndWlkR2VuZXJhdG9yJyk7XHJcblxyXG52YXIgdXJsVXRpbHMgPSByZXF1aXJlKCcuLi9MQy91cmxVdGlscycpO1xyXG53aW5kb3cuZ2V0VVJMUGFyYW1ldGVyID0gdXJsVXRpbHMuZ2V0VVJMUGFyYW1ldGVyO1xyXG53aW5kb3cuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzID0gdXJsVXRpbHMuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzO1xyXG5cclxudmFyIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZycpO1xyXG4vL3tURU1QXHJcbkxDLmRhdGVUb0ludGVyY2hhbmdsZVN0cmluZyA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZztcclxuLy99XHJcblxyXG4vLyBQYWdlcyBpbiBwb3B1cFxyXG52YXIgd2VsY29tZVBvcHVwID0gcmVxdWlyZSgnLi93ZWxjb21lUG9wdXAnKTtcclxudmFyIGZhcXNQb3B1cHMgPSByZXF1aXJlKCcuL2ZhcXNQb3B1cHMnKTtcclxudmFyIGFjY291bnRQb3B1cHMgPSByZXF1aXJlKCcuL2FjY291bnRQb3B1cHMnKTtcclxudmFyIGxlZ2FsUG9wdXBzID0gcmVxdWlyZSgnLi9sZWdhbFBvcHVwcycpO1xyXG5cclxuLy8gT2xkIGF2YWlsYWJsaXR5IGNhbGVuZGFyXHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldCA9IHJlcXVpcmUoJy4vYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQnKTtcclxuLy8gTmV3IGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXIgPSByZXF1aXJlKCcuLi9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhcicpO1xyXG5cclxudmFyIGF1dG9maWxsU3VibWVudSA9IHJlcXVpcmUoJy4uL0xDL2F1dG9maWxsU3VibWVudScpO1xyXG5cclxudmFyIHRhYmJlZFdpemFyZCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLndpemFyZCcpO1xyXG5cclxudmFyIGhhc0NvbmZpcm1TdXBwb3J0ID0gcmVxdWlyZSgnLi4vTEMvaGFzQ29uZmlybVN1cHBvcnQnKTtcclxuXHJcbnZhciBwb3N0YWxDb2RlVmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4uL0xDL3Bvc3RhbENvZGVTZXJ2ZXJWYWxpZGF0aW9uJyk7XHJcblxyXG52YXIgdGFiYmVkTm90aWZpY2F0aW9ucyA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24nKTtcclxuXHJcbnZhciB0YWJzQXV0b2xvYWQgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5hdXRvbG9hZCcpO1xyXG5cclxudmFyIGhvbWVQYWdlID0gcmVxdWlyZSgnLi9ob21lJyk7XHJcblxyXG4vL3tURU1QIHJlbW92ZSBnbG9iYWwgZGVwZW5kZW5jeSBmb3IgdGhpc1xyXG53aW5kb3cuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4uL0xDL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuLy99XHJcblxyXG52YXIgcHJvdmlkZXJXZWxjb21lID0gcmVxdWlyZSgnLi9wcm92aWRlcldlbGNvbWUnKTtcclxuXHJcbi8qKlxyXG4gKiogSW5pdCBjb2RlXHJcbioqKi9cclxuJCh3aW5kb3cpLmxvYWQoZnVuY3Rpb24gKCkge1xyXG4gIC8vIERpc2FibGUgYnJvd3NlciBiZWhhdmlvciB0byBhdXRvLXNjcm9sbCB0byB1cmwgZnJhZ21lbnQvaGFzaCBlbGVtZW50IHBvc2l0aW9uOlxyXG4gIC8vIEVYQ0VQVCBpbiBEYXNoYm9hcmQ6XHJcbiAgLy8gVE9ETzogUmV2aWV3IGlmIHRoaXMgaXMgcmVxdWlyZWQgb25seSBmb3IgSG93SXRXb3JrcyBvciBzb21ldGhpbmcgbW9yZSAodGFicywgcHJvZmlsZSlcclxuICAvLyBhbmQgcmVtb3ZlIGlmIHBvc3NpYmxlIG9yIG9ubHkgb24gdGhlIGNvbmNyZXRlIGNhc2VzLlxyXG4gIGlmICghL1xcL2Rhc2hib2FyZFxcLy9pLnRlc3QobG9jYXRpb24pKVxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7ICQoJ2h0bWwsYm9keScpLnNjcm9sbFRvcCgwKTsgfSwgMSk7XHJcbn0pO1xyXG4kKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgcHJvdmlkZXJXZWxjb21lLnNob3coKTtcclxuXHJcbiAgLy8gUGxhY2Vob2xkZXIgcG9seWZpbGxcclxuICBMQy5wbGFjZUhvbGRlcigpO1xyXG5cclxuICAvLyBBdXRvZm9jdXMgcG9seWZpbGxcclxuICBMQy5hdXRvRm9jdXMoKTtcclxuXHJcbiAgLy8gR2VuZXJpYyBzY3JpcHQgZm9yIGVuaGFuY2VkIHRvb2x0aXBzIGFuZCBlbGVtZW50IGRlc2NyaXB0aW9uc1xyXG4gIExDLmluaXRUb29sdGlwcygpO1xyXG5cclxuICBhamF4Rm9ybXMuaW5pdCgpO1xyXG5cclxuICB3ZWxjb21lUG9wdXAuaW5pdCgpO1xyXG5cclxuICAvLyBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgZm9yIHNvbWUgbGlua3MgdGhhdCBieSBkZWZhdWx0IG9wZW4gYSBuZXcgdGFiOlxyXG4gIGZhcXNQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuICBhY2NvdW50UG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcbiAgbGVnYWxQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuXHJcbiAgLy8gT2xkIGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG4gIGF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0LmluaXQoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gIC8vIE5ldyBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxuICBhdmFpbGFiaWxpdHlDYWxlbmRhci5XZWVrbHkuZW5hYmxlQWxsKCk7XHJcblxyXG4gIHBvcHVwLmNvbm5lY3RBY3Rpb24oKTtcclxuXHJcbiAgLy8gRGF0ZSBQaWNrZXJcclxuICBMQy5kYXRlUGlja2VyLmluaXQoKTtcclxuXHJcbiAgLyogQXV0byBjYWxjdWxhdGUgdGFibGUgaXRlbXMgdG90YWwgKHF1YW50aXR5KnVuaXRwcmljZT1pdGVtLXRvdGFsKSBzY3JpcHQgKi9cclxuICBhdXRvQ2FsY3VsYXRlLm9uVGFibGVJdGVtcygpO1xyXG4gIGF1dG9DYWxjdWxhdGUub25TdW1tYXJ5KCk7XHJcblxyXG4gIGhhc0NvbmZpcm1TdXBwb3J0Lm9uKCk7XHJcblxyXG4gIHBvc3RhbENvZGVWYWxpZGF0aW9uLmluaXQoeyBiYXNlVXJsOiBMY1VybC5MYW5nUGF0aCB9KTtcclxuXHJcbiAgLy8gVGFiYmVkIGludGVyZmFjZVxyXG4gIHRhYnNBdXRvbG9hZC5pbml0KFRhYmJlZFVYKTtcclxuICBUYWJiZWRVWC5pbml0KCk7XHJcbiAgVGFiYmVkVVguZm9jdXNDdXJyZW50TG9jYXRpb24oKTtcclxuICBUYWJiZWRVWC5jaGVja1ZvbGF0aWxlVGFicygpO1xyXG4gIHNsaWRlclRhYnMuaW5pdChUYWJiZWRVWCk7XHJcblxyXG4gIHRhYmJlZFdpemFyZC5pbml0KFRhYmJlZFVYLCB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IGdMb2FkaW5nUmV0YXJkXHJcbiAgfSk7XHJcblxyXG4gIHRhYmJlZE5vdGlmaWNhdGlvbnMuaW5pdChUYWJiZWRVWCk7XHJcblxyXG4gIGF1dG9maWxsU3VibWVudSgpO1xyXG5cclxuICAvLyBUT0RPOiAnbG9hZEhhc2hCYW5nJyBjdXN0b20gZXZlbnQgaW4gdXNlP1xyXG4gIC8vIElmIHRoZSBoYXNoIHZhbHVlIGZvbGxvdyB0aGUgJ2hhc2ggYmFuZycgY29udmVudGlvbiwgbGV0IG90aGVyXHJcbiAgLy8gc2NyaXB0cyBkbyB0aGVpciB3b3JrIHRocm91Z2h0IGEgJ2xvYWRIYXNoQmFuZycgZXZlbnQgaGFuZGxlclxyXG4gIGlmICgvXiMhLy50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSlcclxuICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2xvYWRIYXNoQmFuZycsIHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKSk7XHJcblxyXG4gIC8vIFJlbG9hZCBidXR0b25zXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5yZWxvYWQtYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gR2VuZXJpYyBhY3Rpb24gdG8gY2FsbCBsYy5qcXVlcnkgJ3JlbG9hZCcgZnVuY3Rpb24gZnJvbSBhbiBlbGVtZW50IGluc2lkZSBpdHNlbGYuXHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgJHQuY2xvc2VzdCgkdC5kYXRhKCdyZWxvYWQtdGFyZ2V0JykpLnJlbG9hZCgpO1xyXG4gIH0pO1xyXG5cclxuICAvKiBFbmFibGUgZm9jdXMgdGFiIG9uIGV2ZXJ5IGhhc2ggY2hhbmdlLCBub3cgdGhlcmUgYXJlIHR3byBzY3JpcHRzIG1vcmUgc3BlY2lmaWMgZm9yIHRoaXM6XHJcbiAgKiBvbmUgd2hlbiBwYWdlIGxvYWQgKHdoZXJlPyksXHJcbiAgKiBhbmQgYW5vdGhlciBvbmx5IGZvciBsaW5rcyB3aXRoICd0YXJnZXQtdGFiJyBjbGFzcy5cclxuICAqIE5lZWQgYmUgc3R1ZHkgaWYgc29tZXRoaW5nIG9mIHRoZXJlIG11c3QgYmUgcmVtb3ZlZCBvciBjaGFuZ2VkLlxyXG4gICogVGhpcyBpcyBuZWVkZWQgZm9yIG90aGVyIGJlaGF2aW9ycyB0byB3b3JrLiAqL1xyXG4gIC8vIE9uIHRhcmdldC10YWIgbGlua3NcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYS50YXJnZXQtdGFiJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIoJCh0aGlzKS5hdHRyKCdocmVmJykpO1xyXG4gICAgaWYgKHRoZXJlSXNUYWIpIHtcclxuICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGhlcmVJc1RhYik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuICAvLyBPbiBoYXNoIGNoYW5nZVxyXG4gIGlmICgkLmZuLmhhc2hjaGFuZ2UpXHJcbiAgICAkKHdpbmRvdykuaGFzaGNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGlmICghL14jIS8udGVzdChsb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgICAgIHZhciB0aGVyZUlzVGFiID0gVGFiYmVkVVguZ2V0VGFiKGxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIGlmICh0aGVyZUlzVGFiKVxyXG4gICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGhlcmVJc1RhYik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAvLyBIT01FIFBBR0UgLyBTRUFSQ0ggU1RVRkZcclxuICBob21lUGFnZS5pbml0KCk7XHJcblxyXG4gIC8vIFZhbGlkYXRpb24gYXV0byBzZXR1cCBmb3IgcGFnZSByZWFkeSBhbmQgYWZ0ZXIgZXZlcnkgYWpheCByZXF1ZXN0XHJcbiAgLy8gaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBmb3JtIGluIHRoZSBwYWdlLlxyXG4gIC8vIFRoaXMgYXZvaWQgdGhlIG5lZWQgZm9yIGV2ZXJ5IHBhZ2Ugd2l0aCBmb3JtIHRvIGRvIHRoZSBzZXR1cCBpdHNlbGZcclxuICAvLyBhbG1vc3QgZm9yIG1vc3Qgb2YgdGhlIGNhc2UuXHJcbiAgZnVuY3Rpb24gYXV0b1NldHVwVmFsaWRhdGlvbigpIHtcclxuICAgIGlmICgkKGRvY3VtZW50KS5oYXMoJ2Zvcm0nKS5sZW5ndGgpXHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuc2V0dXAoJ2Zvcm0nKTtcclxuICB9XHJcbiAgYXV0b1NldHVwVmFsaWRhdGlvbigpO1xyXG4gICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShhdXRvU2V0dXBWYWxpZGF0aW9uKTtcclxuXHJcbiAgLy8gVE9ETzogdXNlZCBzb21lIHRpbWU/IHN0aWxsIHJlcXVpcmVkIHVzaW5nIG1vZHVsZXM/XHJcbiAgLypcclxuICAqIENvbW11bmljYXRlIHRoYXQgc2NyaXB0LmpzIGlzIHJlYWR5IHRvIGJlIHVzZWRcclxuICAqIGFuZCB0aGUgY29tbW9uIExDIGxpYiB0b28uXHJcbiAgKiBCb3RoIGFyZSBlbnN1cmVkIHRvIGJlIHJhaXNlZCBldmVyIGFmdGVyIHBhZ2UgaXMgcmVhZHkgdG9vLlxyXG4gICovXHJcbiAgJChkb2N1bWVudClcclxuICAgIC50cmlnZ2VyKCdsY1NjcmlwdFJlYWR5JylcclxuICAgIC50cmlnZ2VyKCdsY0xpYlJlYWR5Jyk7XHJcbn0pOyIsIi8qKioqKiBBVkFJTEFCSUxJVFkgQ0FMRU5EQVIgV0lER0VUICoqKioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuLi9MQy9zbW9vdGhCb3hCbG9jaycpLFxyXG4gICAgZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nJyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5yZWxvYWQnKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRBdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmNhbGVuZGFyLWNvbnRyb2xzIC5hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoJHQuaGFzQ2xhc3MoJ3pvb20tYWN0aW9uJykpIHtcclxuICAgICAgICAgICAgLy8gRG8gem9vbVxyXG4gICAgICAgICAgICB2YXIgYyA9ICR0LmNsb3Nlc3QoJy5hdmFpbGFiaWxpdHktY2FsZW5kYXInKS5maW5kKCcuY2FsZW5kYXInKS5jbG9uZSgpO1xyXG4gICAgICAgICAgICBjLmNzcygnZm9udC1zaXplJywgJzJweCcpO1xyXG4gICAgICAgICAgICB2YXIgdGFiID0gJHQuY2xvc2VzdCgnLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgICAgIGMuZGF0YSgncG9wdXAtY29udGFpbmVyJywgdGFiKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihjLCB0YWIsICdhdmFpbGFiaWxpdHktY2FsZW5kYXInLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAvLyBOb3RoaW5nIG1vcmVcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBOYXZpZ2F0ZSBjYWxlbmRhclxyXG4gICAgICAgIHZhciBuZXh0ID0gJHQuaGFzQ2xhc3MoJ25leHQtd2Vlay1hY3Rpb24nKTtcclxuICAgICAgICB2YXIgY29udCA9ICR0LmNsb3Nlc3QoJy5hdmFpbGFiaWxpdHktY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsY29udCA9IGNvbnQuY2hpbGRyZW4oJy5jYWxlbmRhci1jb250YWluZXInKTtcclxuICAgICAgICB2YXIgY2FsID0gY2FsY29udC5jaGlsZHJlbignLmNhbGVuZGFyJyk7XHJcbiAgICAgICAgdmFyIGNhbGluZm8gPSBjb250LmZpbmQoJy5jYWxlbmRhci1pbmZvJyk7XHJcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShjYWwuZGF0YSgnc2hvd2VkLWRhdGUnKSk7XHJcbiAgICAgICAgdmFyIHVzZXJJZCA9IGNhbC5kYXRhKCd1c2VyLWlkJyk7XHJcbiAgICAgICAgaWYgKG5leHQpXHJcbiAgICAgICAgICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpIC0gNyk7XHJcbiAgICAgICAgdmFyIHN0cmRhdGUgPSBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcoZGF0ZSk7XHJcbiAgICAgICAgdmFyIHVybCA9IGJhc2VVcmwgKyBcIlByb2ZpbGUvJEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0L1dlZWsvXCIgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyZGF0ZSkgKyBcIi8/VXNlcklEPVwiICsgdXNlcklkO1xyXG4gICAgICAgIGNhbGNvbnQucmVsb2FkKHVybCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIG5ldyBvYmplY3Q6XHJcbiAgICAgICAgICAgIHZhciBjYWwgPSAkKCcuY2FsZW5kYXInLCB0aGlzLmVsZW1lbnQpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy55ZWFyLXdlZWsnKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtd2VlaycpKTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcuZmlyc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtZmlyc3QtZGF5JykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5sYXN0LXdlZWstZGF5JykudGV4dChjYWwuZGF0YSgnc2hvd2VkLWxhc3QtZGF5JykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gRkFRcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG52YXIgZmFxc0Jhc2VVcmwgPSAnSGVscENlbnRlci8kRkFRcyc7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgZmFxc0Jhc2VVcmwgPSAoYmFzZVVybCB8fCAnLycpICsgZmFxc0Jhc2VVcmw7XHJcblxyXG4gIC8vIEVuYWJsZSBGQVFzIGxpbmtzIGluIHBvcHVwXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2FbaHJlZnw9XCIjRkFRc1wiXScsIHBvcHVwRmFxcyk7XHJcblxyXG4gIC8vIEF1dG8gb3BlbiBjdXJyZW50IGRvY3VtZW50IGxvY2F0aW9uIGlmIGhhc2ggaXMgYSBGQVEgbGlua1xyXG4gIGlmICgvXiNGQVFzL2kudGVzdChsb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgcG9wdXBGYXFzKGxvY2F0aW9uLmhhc2gpO1xyXG4gIH1cclxuXHJcbiAgLy8gcmV0dXJuIGFzIHV0aWxpdHlcclxuICByZXR1cm4gcG9wdXBGYXFzO1xyXG59O1xyXG5cclxuLyogUGFzcyBhIEZhcXMgQHVybCBvciB1c2UgYXMgYSBsaW5rIGhhbmRsZXIgdG8gb3BlbiB0aGUgRkFRIGluIGEgcG9wdXBcclxuICovXHJcbmZ1bmN0aW9uIHBvcHVwRmFxcyh1cmwpIHtcclxuICB1cmwgPSB0eXBlb2YgKHVybCkgPT09ICdzdHJpbmcnID8gdXJsIDogJCh0aGlzKS5hdHRyKCdocmVmJyk7XHJcblxyXG4gIHZhciB1cmxwYXJ0cyA9IHVybC5zcGxpdCgnLScpO1xyXG5cclxuICBpZiAodXJscGFydHNbMF0gIT0gJyNGQVFzJykge1xyXG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignVGhlIFVSTCBpcyBub3QgYSBGQVEgdXJsIChkb2VzblxcJ3Qgc3RhcnRzIHdpdGggI0ZBUXMtKScsIHVybCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHZhciB1cmxzZWN0aW9uID0gdXJscGFydHMubGVuZ3RoID4gMSA/IHVybHBhcnRzWzFdIDogJyc7XHJcblxyXG4gIGlmICh1cmxzZWN0aW9uKSB7XHJcbiAgICB2YXIgcHVwID0gcG9wdXAoZmFxc0Jhc2VVcmwgKyB1cmxzZWN0aW9uLCAnbGFyZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBkID0gJCh1cmwpLFxyXG4gICAgICAgIHBlbCA9IHB1cC5nZXRDb250ZW50RWxlbWVudCgpO1xyXG4gICAgICBwZWwuc2Nyb2xsVG9wKHBlbC5zY3JvbGxUb3AoKSArIGQucG9zaXRpb24oKS50b3AgLSA1MCk7XHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGQuZWZmZWN0KFwiaGlnaGxpZ2h0XCIsIHt9LCAyMDAwKTtcclxuICAgICAgfSwgNDAwKTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn0iLCIvKiBJTklUICovXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIExvY2F0aW9uIGpzLWRyb3Bkb3duXHJcbiAgICB2YXIgcyA9ICQoJyNzZWFyY2gtbG9jYXRpb24nKTtcclxuICAgIHMucHJvcCgncmVhZG9ubHknLCB0cnVlKTtcclxuICAgIHMuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IExDLnNlYXJjaExvY2F0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgYXV0b0ZvY3VzOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBtaW5MZW5ndGg6IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIHNlbGVjdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBzLm9uKCdmb2N1cyBjbGljaycsIGZ1bmN0aW9uICgpIHsgcy5hdXRvY29tcGxldGUoJ3NlYXJjaCcsICcnKTsgfSk7XHJcblxyXG4gICAgLyogUG9zaXRpb25zIGF1dG9jb21wbGV0ZSAqL1xyXG4gICAgdmFyIHBvc2l0aW9uc0F1dG9jb21wbGV0ZSA9ICQoJyNzZWFyY2gtc2VydmljZScpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgICAgICBtaW5MZW5ndGg6IDAsXHJcbiAgICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICAgICAgIC8vJCh0aGlzKS52YWwodWkuaXRlbS5sYWJlbCk7XHJcbiAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvY3VzOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgICAgICAgLy8kKHRoaXMpLnZhbCh1aS5pdGVtLmxhYmVsKTtcclxuICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gTG9hZCBhbGwgcG9zaXRpb25zIGluIGJhY2tncm91bmQgdG8gcmVwbGFjZSB0aGUgYXV0b2NvbXBsZXRlIHNvdXJjZSAoYXZvaWRpbmcgbXVsdGlwbGUsIHNsb3cgbG9vay11cHMpXHJcbiAgICAvKiQuZ2V0SlNPTihMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgcG9zaXRpb25zQXV0b2NvbXBsZXRlLmF1dG9jb21wbGV0ZSgnb3B0aW9uJywgJ3NvdXJjZScsIGRhdGEpO1xyXG4gICAgfVxyXG4gICAgKTsqL1xyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gc29tZSBMZWdhbCBwYWdlcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KVxyXG4gICAgLm9uKCdjbGljaycsICcudmlldy1wcml2YWN5LXBvbGljeScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBwb3B1cChiYXNlVXJsICsgJ0hlbHBDZW50ZXIvJFByaXZhY3lQb2xpY3kvJywgJ2xhcmdlJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnLnZpZXctdGVybXMtb2YtdXNlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBvcHVwKGJhc2VVcmwgKyAnSGVscENlbnRlci8kVGVybXNPZlVzZS8nLCAnbGFyZ2UnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuKiBQcm92aWRlciBXZWxjb21lIHBhZ2VcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIFNpbXBsZVNsaWRlciA9IHJlcXVpcmUoJ0xDL1NpbXBsZVNsaWRlcicpO1xyXG5cclxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24gcHJvdmlkZXJXZWxjb21lKCkge1xyXG4gICQoJy5Qcm92aWRlcldlbGNvbWUgLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24nKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciB0ID0gJCh0aGlzKSxcclxuICAgICAgc2xpZGVyID0gbmV3IFNpbXBsZVNsaWRlcih7XHJcbiAgICAgICAgZWxlbWVudDogdCxcclxuICAgICAgICBzZWxlY3RvcnM6IHtcclxuICAgICAgICAgIHNsaWRlczogJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLXNsaWRlcycsXHJcbiAgICAgICAgICBzbGlkZTogJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLXNsaWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3VycmVudFNsaWRlQ2xhc3M6ICdqcy1pc0N1cnJlbnQnLFxyXG4gICAgICAgIGhyZWZQcmVmaXg6ICdnb1NsaWRlXycsXHJcbiAgICAgICAgLy8gRHVyYXRpb24gb2YgZWFjaCBzbGlkZSBpbiBtaWxsaXNlY29uZHNcclxuICAgICAgICBkdXJhdGlvbjogMTAwMFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAvLyBTbGlkZSBzdGVwcyBhY3Rpb25zIGluaXRpYWxseSBoaWRkZW4sIHZpc2libGUgYWZ0ZXIgJ3N0YXJ0J1xyXG4gICAgdmFyIHNsaWRlc0FjdGlvbnMgPSB0LmZpbmQoJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLWFjdGlvbnMtc2xpZGVzJykuaGlkZSgpO1xyXG4gICAgdC5maW5kKCcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1hY3Rpb25zLXN0YXJ0IC5zdGFydC1hY3Rpb24nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQodGhpcykuaGlkZSgpO1xyXG4gICAgICBzbGlkZXNBY3Rpb25zLmZhZGVJbigxMDAwKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKipcclxuKiBXZWxjb21lIHBvcHVwXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIGJvb3RzdHJhcCB0b29sdGlwczpcclxucmVxdWlyZSgnYm9vdHN0cmFwJyk7XHJcbi8vVE9ETyBtb3JlIGRlcGVuZGVuY2llcz9cclxuXHJcbnZhciBpbml0aWFsaXplZCA9IGZhbHNlO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFdlbGNvbWVQb3B1cCgpIHtcclxuXHJcbiAgZXhwb3J0cy5hdXRvU2hvdygpO1xyXG5cclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYS5zaWduLXVwLCBhLnJlZ2lzdGVyLCBhLm5lZWQtbG9naW4sIGJ1dHRvbi5uZWVkLWxvZ2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gUmVtb3ZlIGFueSBvcGVuZWQgcG9wdXAgKGl0IG92ZXJsYXlzIHRoZSB3ZWxjb21lcG9wdXApXHJcbiAgICAkLnVuYmxvY2tVSSgpO1xyXG5cclxuICAgIHJldHVybiAhZXhwb3J0cy5zaG93KCk7XHJcbiAgfSk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0cy5hdXRvU2hvdyA9IGZ1bmN0aW9uIGF1dG9TaG93V2VsY29tZVBvcHVwKCkge1xyXG4gIHZhciAkd3AgPSAkKCcjd2VsY29tZXBvcHVwJyk7XHJcbiAgdmFyICR3byA9ICQoJyN3ZWxjb21lLXBvcHVwLW92ZXJsYXknKTtcclxuXHJcbiAgLy8gV2hlbiB0aGUgcG9wdXAgaXMgaW50ZWdyYXRlZCBpbiB0aGUgcGFnZSBpbnN0ZWFkIG9mXHJcbiAgLy8gdGhlIGxheW91dCwgZXhlYyBzaG93IGFuZCBjbG9zZSBvcnBoYW4gb3ZlcmxheS5cclxuICBpZiAoJHdwLmxlbmd0aCAmJlxyXG4gICAgJHdwLmlzKCc6dmlzaWJsZScpICYmXHJcbiAgICAkd3AuY2xvc2VzdCgnI3dlbGNvbWUtcG9wdXAtb3ZlcmxheScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgJHdvLmhpZGUoKTtcclxuICAgIGV4cG9ydHMuc2hvdygpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH0gZWxzZSBpZiAoJHdvLmhhc0NsYXNzKCdhdXRvLXNob3cnKSkge1xyXG4gICAgZXhwb3J0cy5zaG93KCk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24gd2VsY29tZVBvcHVwKCkge1xyXG4gICAgdmFyIGMgPSAkKCcjd2VsY29tZXBvcHVwJyk7XHJcbiAgICBpZiAoYy5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB2YXIgb3ZlcmxheSA9IGMuY2xvc2VzdCgnI3dlbGNvbWUtcG9wdXAtb3ZlcmxheScpO1xyXG4gICAgb3ZlcmxheS5mYWRlSW4oMzAwKTtcclxuXHJcbiAgICAvKipcclxuICAgIEdvIHRvIHRoZSBmaXJzdCBzdGVwIG9uIGEgYWxyZWFkeSBpbml0aWFsaXplZCBwb3B1cFxyXG4gICAgKiovXHJcbiAgICBmdW5jdGlvbiBzdGFydEFnYWluKGFuaW1hdGUpIHtcclxuICAgICAgICAvLyBSZXR1cm4gcG9wdXAgdG8gdGhlIGZpcnN0IHN0ZXAgKGNob29zZSBwcm9maWxlLCAjNDg2KSBhbmQgZXhpdCAtaW5pdCBpcyByZWFkeS1cclxuICAgICAgICAvLyBTaG93IGZpcnN0IHN0ZXBcclxuICAgICAgICB2YXIgc3RlcDEgPSBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSwgaGVhZGVyIC5wcmVzZW50YXRpb24nKTtcclxuICAgICAgICBpZiAoYW5pbWF0ZSlcclxuICAgICAgICAgICAgc3RlcDEuc2xpZGVEb3duKCdmYXN0Jyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzdGVwMS5zaG93KCk7XHJcbiAgICAgICAgLy8gSGlkZSBzZWNvbmQgc3RlcFxyXG4gICAgICAgIHZhciBzdGVwMiA9IGMuZmluZCgnLnRlcm1zLCAucHJvZmlsZS1kYXRhJyk7XHJcbiAgICAgICAgaWYgKGFuaW1hdGUpXHJcbiAgICAgICAgICAgIHN0ZXAyLnNsaWRlVXAoJ2Zhc3QnKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHN0ZXAyLmhpZGUoKTtcclxuICAgICAgICAvLyBIaWRlIGJhY2stYWN0aW9uIGJ1dHRvblxyXG4gICAgICAgIGMuZmluZCgnLmJhY2stYWN0aW9uJykuaGlkZSgpO1xyXG4gICAgICAgIC8vIFJlc2V0IGhpZGRlbiBmaWVsZHMgcGVyIHByb2ZpbGUtdHlwZVxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaTpub3QoLnBvc2l0aW9uLWRlc2NyaXB0aW9uKScpLnNob3coKTtcclxuICAgICAgICAvLyBSZXNldCBjaG9vc2VuIHByb2ZpbGUtdHlwZVxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV0nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICAgIC8vIFJlc2V0IFVSTHMgcGVyIHByb2ZpbGUtdHlwZVxyXG4gICAgICAgIGMuZmluZCgnYS50ZXJtcy1vZi11c2UnKS5kYXRhKCd0b29sdGlwLXVybCcsIGZ1bmN0aW9uICgpIHsgcmV0dXJuICQodGhpcykuYXR0cignZGF0YS10b29sdGlwLXVybCcpOyB9KTtcclxuICAgICAgICAvLyBSZXNldCB2YWxpZGF0aW9uIHJ1bGVzXHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpIGlucHV0Om5vdChbdHlwZT1oaWRkZW5dKScpXHJcbiAgICAgICAgLmF0dHIoJ2RhdGEtdmFsJywgbnVsbClcclxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICBzdGFydEFnYWluKCk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgLy8gY2xvc2UgYnV0dG9uIGxvZ2ljIGFuZCBvbmx5IHdoZW4gYXMgcG9wdXAgKGl0IGhhcyBvdmVybGF5KVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gYy5maW5kKCcuY2xvc2UtcG9wdXAsIFtocmVmPVwiI2Nsb3NlLXBvcHVwXCJdJyk7XHJcbiAgICBpZiAob3ZlcmxheS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgY2xvc2VCdXR0b24uaGlkZSgpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGNsb3NlQnV0dG9uLnNob3coKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIG92ZXJsYXkuZmFkZU91dCgnbm9ybWFsJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBnbyBiYWNrIGJ1dHRvblxyXG4gICAgYy5maW5kKCcuYmFjay1hY3Rpb24nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHN0YXJ0QWdhaW4odHJ1ZSk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUG9wb3ZlcnMgZm9yIHRvb2x0aXAgcmVwbGFjZW1lbnRcclxuICAgIGMuZmluZCgnW2RhdGEtdG9nZ2xlPVwicG9wb3ZlclwiXScpXHJcbiAgICAucG9wb3ZlcigpXHJcbiAgICAuZmlsdGVyKCdhW2hyZWY9XCIjXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAvLyBBdm9pZCBuYXZpZ2F0ZSB0byB0aGUgbGlua1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBza2lwU3RlcDEgPSBjLmhhc0NsYXNzKCdzZWxlY3QtcG9zaXRpb24nKTtcclxuXHJcbiAgICAvLyBJbml0XHJcbiAgICBpZiAoIXNraXBTdGVwMSkge1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSwgLnRlcm1zLCAucG9zaXRpb24tZGVzY3JpcHRpb24nKS5oaWRlKCk7XHJcbiAgICB9XHJcbiAgICBjLmZpbmQoJ2Zvcm0nKS5nZXQoMCkucmVzZXQoKTtcclxuXHJcbiAgICAvLyBEZXNjcmlwdGlvbiBzaG93LXVwIG9uIGF1dG9jb21wbGV0ZSB2YXJpYXRpb25zXHJcbiAgICB2YXIgc2hvd1Bvc2l0aW9uRGVzY3JpcHRpb24gPSB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgU2hvdyBkZXNjcmlwdGlvbiBpbiBhIHRleHRhcmVhIHVuZGVyIHRoZSBwb3NpdGlvbiBzaW5ndWxhcixcclxuICAgICAgICBpdHMgc2hvd2VkIG9uIGRlbWFuZC5cclxuICAgICAgICAqKi9cclxuICAgICAgICB0ZXh0YXJlYTogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICBjLmZpbmQoJy5wb3NpdGlvbi1kZXNjcmlwdGlvbicpXHJcbiAgICAgICAgICAgIC5zbGlkZURvd24oJ2Zhc3QnKVxyXG4gICAgICAgICAgICAuZmluZCgndGV4dGFyZWEnKS52YWwodWkuaXRlbS5kZXNjcmlwdGlvbik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICBTaG93IGRlc2NyaXB0aW9uIGluIGEgdG9vbHRpcCB0aGF0IGNvbWVzIGZyb20gdGhlIHBvc2l0aW9uIHNpbmd1bGFyXHJcbiAgICAgICAgZmllbGRcclxuICAgICAgICAqKi9cclxuICAgICAgICB0b29sdGlwOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIC8vIEl0IG5lZWRzIHRvIGJlIGRlc3Ryb3llZCAobm8gcHJvYmxlbSB0aGUgZmlyc3QgdGltZSlcclxuICAgICAgICAgICAgLy8gdG8gZ2V0IGl0IHVwZGF0ZWQgb24gc3VjY2VzaXZlIGF0dGVtcHRzXHJcbiAgICAgICAgICAgIHZhciBlbCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGVsXHJcbiAgICAgICAgICAgIC5wb3BvdmVyKCdkZXN0cm95JylcclxuICAgICAgICAgICAgLnBvcG92ZXIoe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdEb2VzIHRoaXMgc291bmQgbGlrZSB5b3U/JyxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHVpLml0ZW0uZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICAgICAgICB0cmlnZ2VyOiAnZm9jdXMnLFxyXG4gICAgICAgICAgICAgICAgLy8gRGlmZmVyZW50IHBsYWNlbWVudCBmb3IgbW9iaWxlIGRlc2lnbiAodXAgdG8gNjQwcHggd2lkZSkgdG8gYXZvaWQgYmVpbmcgaGlkZGVuXHJcbiAgICAgICAgICAgICAgICBwbGFjZW1lbnQ6ICQoJ2h0bWwnKS53aWR0aCgpIDwgNjQwID8gJ3RvcCcgOiAnbGVmdCdcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnBvcG92ZXIoJ3Nob3cnKVxyXG4gICAgICAgICAgICAvLyBIaWRlIG9uIHBvc3NpYmxlIHBvc2l0aW9uIG5hbWUgY2hhbmdlIHRvIGF2b2lkIGNvbmZ1c2lvbnNcclxuICAgICAgICAgICAgLy8gKHdlIGNhbid0IHVzZSBvbi1jaGFuZ2UsIG5lZWQgdG8gYmUga2V5cHJlc3M7IGl0cyBuYW1lc3BhY2VkXHJcbiAgICAgICAgICAgIC8vIHRvIGxldCBvZmYgYW5kIG9uIGV2ZXJ5IHRpbWUgdG8gYXZvaWQgbXVsdGlwbGUgaGFuZGxlciByZWdpc3RyYXRpb25zKVxyXG4gICAgICAgICAgICAub2ZmKCdrZXlwcmVzcy5kZXNjcmlwdGlvbi10b29sdGlwJylcclxuICAgICAgICAgICAgLm9uKCdrZXlwcmVzcy5kZXNjcmlwdGlvbi10b29sdGlwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZWwucG9wb3ZlcignaGlkZScpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFJlLWVuYWJsZSBhdXRvY29tcGxldGU6XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgYy5maW5kKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTsgfSwgNTAwKTtcclxuICAgIGZ1bmN0aW9uIHNldHVwUG9zaXRpb25BdXRvY29tcGxldGUoc2VsZXRDYWxsYmFjaykge1xyXG4gICAgICAgIGMuZmluZCgnW25hbWU9am9idGl0bGVdJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgICAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgICAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBObyB2YWx1ZSwgbm8gYWN0aW9uIDooXHJcbiAgICAgICAgICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnZhbHVlKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBpZCAodmFsdWUpIGluIHRoZSBoaWRkZW4gZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgYy5maW5kKCdbbmFtZT1wb3NpdGlvbmlkXScpLnZhbCh1aS5pdGVtLnZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxldENhbGxiYWNrLmNhbGwodGhpcywgZXZlbnQsIHVpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBXZSB3YW50IHRvIHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZvY3VzOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHNldHVwUG9zaXRpb25BdXRvY29tcGxldGUoc2hvd1Bvc2l0aW9uRGVzY3JpcHRpb24udG9vbHRpcCk7XHJcbiAgICBjLmZpbmQoJyN3ZWxjb21lcG9wdXBMb2FkaW5nJykucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gQWN0aW9uc1xyXG4gICAgYy5vbignY2hhbmdlJywgJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIFNob3cgYmFjay1hY3Rpb24gYnV0dG9uXHJcbiAgICAgICAgYy5maW5kKCcuYmFjay1hY3Rpb24nKS5zaG93KCk7XHJcblxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaTpub3QoLicgKyB0aGlzLnZhbHVlICsgJyknKS5oaWRlKCk7XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UsIGhlYWRlciAucHJlc2VudGF0aW9uJykuc2xpZGVVcCgnZmFzdCcpO1xyXG4gICAgICAgIGMuZmluZCgnLnRlcm1zLCAucHJvZmlsZS1kYXRhJykuc2xpZGVEb3duKCdmYXN0Jyk7XHJcbiAgICAgICAgLy8gVGVybXMgb2YgdXNlIGRpZmZlcmVudCBmb3IgcHJvZmlsZSB0eXBlXHJcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gJ2N1c3RvbWVyJylcclxuICAgICAgICAgICAgYy5maW5kKCdhLnRlcm1zLW9mLXVzZScpLmRhdGEoJ3Rvb2x0aXAtdXJsJywgbnVsbCk7XHJcbiAgICAgICAgLy8gQ2hhbmdlIGZhY2Vib29rIHJlZGlyZWN0IGxpbmtcclxuICAgICAgICB2YXIgZmJjID0gYy5maW5kKCcuZmFjZWJvb2stY29ubmVjdCcpO1xyXG4gICAgICAgIHZhciBhZGRSZWRpcmVjdCA9ICdjdXN0b21lcnMnO1xyXG4gICAgICAgIGlmICh0aGlzLnZhbHVlID09ICdwcm92aWRlcicpXHJcbiAgICAgICAgICAgIGFkZFJlZGlyZWN0ID0gJ3Byb3ZpZGVycyc7XHJcbiAgICAgICAgZmJjLmRhdGEoJ3JlZGlyZWN0JywgZmJjLmRhdGEoJ3JlZGlyZWN0JykgKyBhZGRSZWRpcmVjdCk7XHJcbiAgICAgICAgZmJjLmRhdGEoJ3Byb2ZpbGUnLCB0aGlzLnZhbHVlKTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHZhbGlkYXRpb24tcmVxdWlyZWQgZm9yIGRlcGVuZGluZyBvZiBwcm9maWxlLXR5cGUgZm9ybSBlbGVtZW50czpcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGkuJyArIHRoaXMudmFsdWUgKyAnIGlucHV0Om5vdChbZGF0YS12YWxdKTpub3QoW3R5cGU9aGlkZGVuXSknKVxyXG4gICAgICAgIC5hdHRyKCdkYXRhLXZhbC1yZXF1aXJlZCcsICcnKVxyXG4gICAgICAgIC5hdHRyKCdkYXRhLXZhbCcsIHRydWUpO1xyXG4gICAgICAgIExDLnNldHVwVmFsaWRhdGlvbigpO1xyXG4gICAgfSk7XHJcbiAgICBjLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLmFqYXgnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzaG93UG9zaXRpb25EZXNjcmlwdGlvbi50b29sdGlwKTtcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdOmNoZWNrZWQnKS5jaGFuZ2UoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIElmIHByb2ZpbGUgdHlwZSBpcyBwcmVmaWxsZWQgYnkgcmVxdWVzdDpcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV06Y2hlY2tlZCcpLmNoYW5nZSgpO1xyXG5cclxuICAgIC8vIEFsbCBmaW5lXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufTtcclxuIiwiXG5cblxuLypcbiogQHZlcnNpb24gIDAuNS4wXG4qIEBhdXRob3IgICBMYXVyaSBSb29kZW4gLSBodHRwczovL2dpdGh1Yi5jb20vbGl0ZWpzL2RhdGUtZm9ybWF0LWxpdGVcbiogQGxpY2Vuc2UgIE1JVCBMaWNlbnNlICAtIGh0dHA6Ly9sYXVyaS5yb29kZW4uZWUvbWl0LWxpY2Vuc2UudHh0XG4qL1xuXG5cblxuIWZ1bmN0aW9uKERhdGUsIHByb3RvKSB7XG5cdHZhciBtYXNrUmUgPSAvKFtcIiddKSgoPzpbXlxcXFxdfFxcXFwuKSo/KVxcMXxZWVlZfChbTURdKVxcM1xcMyhcXDM/KXxTU3woW1lNREhobXNXXSkoXFw1Pyl8W3VVQVpTd29dL2dcblx0LCB5ZWFyRmlyc3RSZSA9IC8oXFxkezR9KVstLlxcL10oXFxkXFxkPylbLS5cXC9dKFxcZFxcZD8pL1xuXHQsIGRhdGVGaXJzdFJlID0gLyhcXGRcXGQ/KVstLlxcL10oXFxkXFxkPylbLS5cXC9dKFxcZHs0fSkvXG5cdCwgdGltZVJlID0gLyhcXGRcXGQ/KTooXFxkXFxkKTo/KFxcZFxcZCk/XFwuPyhcXGR7M30pPyg/OlxccyooPzooYSl8KHApKVxcLj9tXFwuPyk/KFxccyooPzpafEdNVHxVVEMpPyg/OihbLStdXFxkXFxkKTo/KFxcZFxcZCk/KT8pPy9pXG5cdCwgd29yZFJlID0gLy5bYS16XSsvZ1xuXHQsIHVuZXNjYXBlUmUgPSAvXFxcXCguKS9nXG5cdC8vLCBpc29EYXRlUmUgPSAvKFxcZHs0fSlbLS5cXC9dVyhcXGRcXGQ/KVstLlxcL10oXFxkKS9cblx0XG5cblx0Ly8gSVNPIDg2MDEgc3BlY2lmaWVzIG51bWVyaWMgcmVwcmVzZW50YXRpb25zIG9mIGRhdGUgYW5kIHRpbWUuXG5cdC8vXG5cdC8vIFRoZSBpbnRlcm5hdGlvbmFsIHN0YW5kYXJkIGRhdGUgbm90YXRpb24gaXNcblx0Ly8gWVlZWS1NTS1ERFxuXHQvL1xuXHQvLyBUaGUgaW50ZXJuYXRpb25hbCBzdGFuZGFyZCBub3RhdGlvbiBmb3IgdGhlIHRpbWUgb2YgZGF5IGlzXG5cdC8vIGhoOm1tOnNzXG5cdC8vXG5cdC8vIFRpbWUgem9uZVxuXHQvL1xuXHQvLyBUaGUgc3RyaW5ncyAraGg6bW0sICtoaG1tLCBvciAraGggKGFoZWFkIG9mIFVUQylcblx0Ly8gLWhoOm1tLCAtaGhtbSwgb3IgLWhoICh0aW1lIHpvbmVzIHdlc3Qgb2YgdGhlIHplcm8gbWVyaWRpYW4sIHdoaWNoIGFyZSBiZWhpbmQgVVRDKVxuXHQvL1xuXHQvLyAxMjowMFogPSAxMzowMCswMTowMCA9IDA3MDAtMDUwMFxuXHRcblx0RGF0ZVtwcm90b10uZm9ybWF0ID0gZnVuY3Rpb24obWFzaykge1xuXHRcdG1hc2sgPSBEYXRlLm1hc2tzW21hc2tdIHx8IG1hc2sgfHwgRGF0ZS5tYXNrc1tcImRlZmF1bHRcIl1cblxuXHRcdHZhciBzZWxmID0gdGhpc1xuXHRcdCwgZ2V0ID0gXCJnZXRcIiArIChtYXNrLnNsaWNlKDAsNCkgPT0gXCJVVEM6XCIgPyAobWFzaz1tYXNrLnNsaWNlKDQpLCBcIlVUQ1wiKTpcIlwiKVxuXG5cdFx0cmV0dXJuIG1hc2sucmVwbGFjZShtYXNrUmUsIGZ1bmN0aW9uKG1hdGNoLCBxdW90ZSwgdGV4dCwgTUQsIE1ENCwgc2luZ2xlLCBwYWQpIHtcblx0XHRcdHRleHQgPSBzaW5nbGUgPT0gXCJZXCIgICA/IHNlbGZbZ2V0ICsgXCJGdWxsWWVhclwiXSgpICUgMTAwXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiWVlZWVwiID8gc2VsZltnZXQgKyBcIkZ1bGxZZWFyXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwiTVwiICAgPyBzZWxmW2dldCArIFwiTW9udGhcIl0oKSsxXG5cdFx0XHRcdCA6IE1EICAgICA9PSBcIk1cIiA/IERhdGUubW9udGhOYW1lc1sgc2VsZltnZXQgKyBcIk1vbnRoXCJdKCkrKE1ENCA/IDEyIDogMCkgXVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJEXCIgICA/IHNlbGZbZ2V0ICsgXCJEYXRlXCJdKClcblx0XHRcdFx0IDogTUQgICAgID09IFwiRFwiID8gRGF0ZS5kYXlOYW1lc1sgc2VsZltnZXQgKyBcIkRheVwiXSgpICsgKE1ENCA/IDc6MCApIF1cblx0XHRcdFx0IDogc2luZ2xlID09IFwiSFwiICAgPyBzZWxmW2dldCArIFwiSG91cnNcIl0oKSAlIDEyIHx8IDEyXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcImhcIiAgID8gc2VsZltnZXQgKyBcIkhvdXJzXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwibVwiICAgPyBzZWxmW2dldCArIFwiTWludXRlc1wiXSgpXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcInNcIiAgID8gc2VsZltnZXQgKyBcIlNlY29uZHNcIl0oKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlNcIiAgICA/IHNlbGZbZ2V0ICsgXCJNaWxsaXNlY29uZHNcIl0oKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlNTXCIgICA/IChxdW90ZSA9IHNlbGZbZ2V0ICsgXCJNaWxsaXNlY29uZHNcIl0oKSwgcXVvdGUgPiA5OSA/IHF1b3RlIDogKHF1b3RlID4gOSA/IFwiMFwiIDogXCIwMFwiICkgKyBxdW90ZSlcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJ1XCIgICAgPyAoc2VsZi8xMDAwKT4+PjBcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJVXCIgICAgPyArc2VsZlxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIkFcIiAgICA/IERhdGVbc2VsZltnZXQgKyBcIkhvdXJzXCJdKCkgPiAxMSA/IFwicG1cIiA6IFwiYW1cIl1cblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJaXCIgICAgPyBcIkdNVCBcIiArICgtc2VsZi5nZXRUaW1lem9uZU9mZnNldCgpLzYwKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIndcIiAgICA/IHNlbGZbZ2V0ICsgXCJEYXlcIl0oKSB8fCA3XG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcIldcIiAgID8gKHF1b3RlID0gbmV3IERhdGUoK3NlbGYgKyAoKDQgLSAoc2VsZltnZXQgKyBcIkRheVwiXSgpfHw3KSkgKiA4NjQwMDAwMCkpLCBNYXRoLmNlaWwoKChxdW90ZS5nZXRUaW1lKCktcXVvdGVbXCJzXCIgKyBnZXQuc2xpY2UoMSkgKyBcIk1vbnRoXCJdKDAsMSkpIC8gODY0MDAwMDAgKyAxICkgLyA3KSApXG5cdFx0XHRcdCA6IG1hdGNoID09IFwib1wiICAgID8gbmV3IERhdGUoK3NlbGYgKyAoKDQgLSAoc2VsZltnZXQgKyBcIkRheVwiXSgpfHw3KSkgKiA4NjQwMDAwMCkpW2dldCArIFwiRnVsbFllYXJcIl0oKVxuXHRcdFx0XHQgOiBxdW90ZSAgICAgICAgICAgPyB0ZXh0LnJlcGxhY2UodW5lc2NhcGVSZSwgXCIkMVwiKVxuXHRcdFx0XHQgOiBtYXRjaFxuXHRcdFx0cmV0dXJuIHBhZCAmJiB0ZXh0IDwgMTAgPyBcIjBcIit0ZXh0IDogdGV4dFxuXHRcdH0pXG5cdH1cblxuXHREYXRlLmFtID0gXCJBTVwiXG5cdERhdGUucG0gPSBcIlBNXCJcblxuXHREYXRlLm1hc2tzID0ge1wiZGVmYXVsdFwiOlwiREREIE1NTSBERCBZWVlZIGhoOm1tOnNzXCIsXCJpc29VdGNEYXRlVGltZVwiOidVVEM6WVlZWS1NTS1ERFwiVFwiaGg6bW06c3NcIlpcIid9XG5cdERhdGUubW9udGhOYW1lcyA9IFwiSmFuRmViTWFyQXByTWF5SnVuSnVsQXVnU2VwT2N0Tm92RGVjSmFudWFyeUZlYnJ1YXJ5TWFyY2hBcHJpbE1heUp1bmVKdWx5QXVndXN0U2VwdGVtYmVyT2N0b2Jlck5vdmVtYmVyRGVjZW1iZXJcIi5tYXRjaCh3b3JkUmUpXG5cdERhdGUuZGF5TmFtZXMgPSBcIlN1bk1vblR1ZVdlZFRodUZyaVNhdFN1bmRheU1vbmRheVR1ZXNkYXlXZWRuZXNkYXlUaHVyc2RheUZyaWRheVNhdHVyZGF5XCIubWF0Y2god29yZFJlKVxuXG5cdC8vKi9cblxuXG5cdC8qXG5cdCogLy8gSW4gQ2hyb21lIERhdGUucGFyc2UoXCIwMS4wMi4yMDAxXCIpIGlzIEphblxuXHQqIG4gPSArc2VsZiB8fCBEYXRlLnBhcnNlKHNlbGYpIHx8IFwiXCIrc2VsZjtcblx0Ki9cblxuXHRTdHJpbmdbcHJvdG9dLmRhdGUgPSBOdW1iZXJbcHJvdG9dLmRhdGUgPSBmdW5jdGlvbihmb3JtYXQpIHtcblx0XHR2YXIgbSwgdGVtcFxuXHRcdCwgZCA9IG5ldyBEYXRlXG5cdFx0LCBuID0gK3RoaXMgfHwgXCJcIit0aGlzXG5cblx0XHRpZiAoaXNOYU4obikpIHtcblx0XHRcdC8vIEJpZyBlbmRpYW4gZGF0ZSwgc3RhcnRpbmcgd2l0aCB0aGUgeWVhciwgZWcuIDIwMTEtMDEtMzFcblx0XHRcdGlmIChtID0gbi5tYXRjaCh5ZWFyRmlyc3RSZSkpIGQuc2V0RnVsbFllYXIobVsxXSwgbVsyXS0xLCBtWzNdKVxuXG5cdFx0XHRlbHNlIGlmIChtID0gbi5tYXRjaChkYXRlRmlyc3RSZSkpIHtcblx0XHRcdFx0Ly8gTWlkZGxlIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSBtb250aCwgZWcuIDAxLzMxLzIwMTFcblx0XHRcdFx0Ly8gTGl0dGxlIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSBkYXksIGVnLiAzMS4wMS4yMDExXG5cdFx0XHRcdHRlbXAgPSBEYXRlLm1pZGRsZV9lbmRpYW4gPyAxIDogMlxuXHRcdFx0XHRkLnNldEZ1bGxZZWFyKG1bM10sIG1bdGVtcF0tMSwgbVszLXRlbXBdKVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBUaW1lXG5cdFx0XHRtID0gbi5tYXRjaCh0aW1lUmUpIHx8IFswLCAwLCAwXVxuXHRcdFx0ZC5zZXRIb3VycyggbVs2XSAmJiBtWzFdIDwgMTIgPyArbVsxXSsxMiA6IG1bNV0gJiYgbVsxXSA9PSAxMiA/IDAgOiBtWzFdLCBtWzJdLCBtWzNdfDAsIG1bNF18MClcblx0XHRcdC8vIFRpbWV6b25lXG5cdFx0XHRpZiAobVs3XSkge1xuXHRcdFx0XHRkLnNldFRpbWUoZC0oKGQuZ2V0VGltZXpvbmVPZmZzZXQoKSArIChtWzhdfDApKjYwICsgKChtWzhdPDA/LTE6MSkqKG1bOV18MCkpKSo2MDAwMCkpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGQuc2V0VGltZSggbiA8IDQyOTQ5NjcyOTYgPyBuICogMTAwMCA6IG4gKVxuXHRcdHJldHVybiBmb3JtYXQgPyBkLmZvcm1hdChmb3JtYXQpIDogZFxuXHR9XG5cbn0oRGF0ZSwgXCJwcm90b3R5cGVcIilcblxuXG5cblxuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
