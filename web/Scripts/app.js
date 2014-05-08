require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
﻿// Array Remove - By John Resig (MIT Licensed)
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
﻿/**
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
﻿/** Component class: wrapper for
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
﻿/**
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
﻿/**
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
﻿/**
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
﻿/**
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
﻿/** Connect account with Facebook
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
﻿/** Implements a similar LcUrl object like the server-side one, basing
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
﻿/* Loconomics specific Price, fees and hour-price calculation
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
﻿// http://stackoverflow.com/questions/2593637/how-to-escape-regular-expression-in-javascript
RegExp.quote = function (str) {
  return (str + '').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
};

},{}],"LC/SimpleSlider":[function(require,module,exports){
module.exports=require('aFoCK0');
},{}],"aFoCK0":[function(require,module,exports){
﻿/**
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
﻿/** Polyfill for string.contains
**/
if (!('contains' in String.prototype))
    String.prototype.contains = function (str, startIndex) { return -1 !== this.indexOf(str, startIndex); };
},{}],"KqXDvj":[function(require,module,exports){
﻿/** ======================
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
module.exports=require('KqXDvj');
},{}],18:[function(require,module,exports){
﻿/**
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
﻿/**
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
﻿/** TabbedUX: Tabbed interface logic; with minimal HTML using class 'tabbed' for the
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
﻿/* slider-tabs logic.
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
﻿/**
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
﻿/** timeSpan class to manage times, parse, format, compute.
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
﻿/* Extra utilities and methods 
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
﻿/**
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
﻿/* Set of common LC callbacks for most Ajax operations
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
﻿/* Forms submitted via AJAX */
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
﻿/* Auto calculate summary on DOM tagging with classes the elements involved.
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
﻿/* Focus the first element in the document (or in @container)
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
﻿/** Auto-fill menu sub-items using tabbed pages -only works for current page items- **/
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
﻿/**
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
},{"./objectUtils":43,"LC/dateISO8601":"0dIKTs","date-format-lite":100}],34:[function(require,module,exports){
﻿/**
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
﻿/**
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
﻿/**
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
﻿/**
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
﻿/**
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
﻿/** Very simple custom-format function to allow 
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
﻿/**
  Exposing all the public features and components of availabilityCalendar
**/
exports.Weekly = require('./Weekly');
exports.WorkHours = require('./WorkHours');
exports.Monthly = require('./Monthly');
},{"./Monthly":34,"./Weekly":35,"./WorkHours":36}],"LC/availabilityCalendar":[function(require,module,exports){
module.exports=require('xu1BAO');
},{}],42:[function(require,module,exports){
﻿/**
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
﻿/**
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
﻿/**
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
﻿/* Generic blockUI options sets */
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
﻿/*= ChangesNotification class
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
﻿/* Utility to create iframe with injected html/content instead of URL.
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
﻿/* CRUDL Helper */
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
﻿/**
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
﻿/* Date picker initialization and use
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
﻿/* Format a date as YYYY-MM-DD in UTC for save us
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
﻿/** An i18n utility, get a translation text by looking for specific elements in the html
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
﻿/** Returns the path to the given element in XPath convention
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
﻿// It executes the given 'ready' function as parameter when
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
﻿/* GUID Generator
 */
module.exports = function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
},{}],60:[function(require,module,exports){
﻿/**
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
﻿/* Internazionalization Utilities
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
﻿/* Returns true when str is
- null
- empty string
- only white spaces string
*/
module.exports = function isEmptyString(str) {
    return !(/\S/g.test(str || ""));
};
},{}],63:[function(require,module,exports){
﻿/** As the 'is' jQuery method, but checking @selector in all elements
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
﻿/** ===================
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
﻿/**
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
﻿/** Checks if current element or one of the current set of elements has
a parent that match the element or expression given as first parameter
**/
var $ = jQuery || require('jquery');
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};
},{}],67:[function(require,module,exports){
﻿/**
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
﻿/**
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
﻿/* Some utilities for use with jQuery or its expressions
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
﻿/* Assets loader with loading confirmation (mainly for scripts)
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
﻿/*------------
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
﻿function moveFocusTo(el, options) {
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
﻿/* Some utilities to format and extract numbers, from text or DOM.
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
﻿/**
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
﻿/* Popup functions
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
﻿/**** Postal Code: on fly, server-side validation *****/
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
﻿/** Apply ever a redirect to the given URL, if this is an internal URL or same
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
﻿/** Sanitize the whitespaces in a text by:
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
﻿/** Custom Loconomics 'like blockUI' popups
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
﻿/**
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
﻿/* Some tools form URL management
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
﻿/** Validation logic with load and setup of validators and 
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
﻿/**
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
﻿// OUR namespace (abbreviated Loconomics)
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
﻿/***** AVAILABILITY CALENDAR WIDGET *****/
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
﻿/**
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
﻿/* INIT */
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
﻿/**
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
﻿/**
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
﻿/**
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


//
// The shims in this file are not fully implemented shims for the ES5
// features, but do work for the particular usecases there is in
// the other modules.
//

var toString = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

// Array.isArray is supported in IE9
function isArray(xs) {
  return toString.call(xs) === '[object Array]';
}
exports.isArray = typeof Array.isArray === 'function' ? Array.isArray : isArray;

// Array.prototype.indexOf is supported in IE9
exports.indexOf = function indexOf(xs, x) {
  if (xs.indexOf) return xs.indexOf(x);
  for (var i = 0; i < xs.length; i++) {
    if (x === xs[i]) return i;
  }
  return -1;
};

// Array.prototype.filter is supported in IE9
exports.filter = function filter(xs, fn) {
  if (xs.filter) return xs.filter(fn);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    if (fn(xs[i], i, xs)) res.push(xs[i]);
  }
  return res;
};

// Array.prototype.forEach is supported in IE9
exports.forEach = function forEach(xs, fn, self) {
  if (xs.forEach) return xs.forEach(fn, self);
  for (var i = 0; i < xs.length; i++) {
    fn.call(self, xs[i], i, xs);
  }
};

// Array.prototype.map is supported in IE9
exports.map = function map(xs, fn) {
  if (xs.map) return xs.map(fn);
  var out = new Array(xs.length);
  for (var i = 0; i < xs.length; i++) {
    out[i] = fn(xs[i], i, xs);
  }
  return out;
};

// Array.prototype.reduce is supported in IE9
exports.reduce = function reduce(array, callback, opt_initialValue) {
  if (array.reduce) return array.reduce(callback, opt_initialValue);
  var value, isValueSet = false;

  if (2 < arguments.length) {
    value = opt_initialValue;
    isValueSet = true;
  }
  for (var i = 0, l = array.length; l > i; ++i) {
    if (array.hasOwnProperty(i)) {
      if (isValueSet) {
        value = callback(value, array[i], i, array);
      }
      else {
        value = array[i];
        isValueSet = true;
      }
    }
  }

  return value;
};

// String.prototype.substr - negative index don't work in IE8
if ('ab'.substr(-1) !== 'b') {
  exports.substr = function (str, start, length) {
    // did we get a negative start, calculate how much it is from the beginning of the string
    if (start < 0) start = str.length + start;

    // call the original function
    return str.substr(start, length);
  };
} else {
  exports.substr = function (str, start, length) {
    return str.substr(start, length);
  };
}

// String.prototype.trim is supported in IE9
exports.trim = function (str) {
  if (str.trim) return str.trim();
  return str.replace(/^\s+|\s+$/g, '');
};

// Function.prototype.bind is supported in IE9
exports.bind = function () {
  var args = Array.prototype.slice.call(arguments);
  var fn = args.shift();
  if (fn.bind) return fn.bind.apply(fn, args);
  var self = args.shift();
  return function () {
    fn.apply(self, args.concat([Array.prototype.slice.call(arguments)]));
  };
};

// Object.create is supported in IE9
function create(prototype, properties) {
  var object;
  if (prototype === null) {
    object = { '__proto__' : null };
  }
  else {
    if (typeof prototype !== 'object') {
      throw new TypeError(
        'typeof prototype[' + (typeof prototype) + '] != \'object\''
      );
    }
    var Type = function () {};
    Type.prototype = prototype;
    object = new Type();
    object.__proto__ = prototype;
  }
  if (typeof properties !== 'undefined' && Object.defineProperties) {
    Object.defineProperties(object, properties);
  }
  return object;
}
exports.create = typeof Object.create === 'function' ? Object.create : create;

// Object.keys and Object.getOwnPropertyNames is supported in IE9 however
// they do show a description and number property on Error objects
function notObject(object) {
  return ((typeof object != "object" && typeof object != "function") || object === null);
}

function keysShim(object) {
  if (notObject(object)) {
    throw new TypeError("Object.keys called on a non-object");
  }

  var result = [];
  for (var name in object) {
    if (hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
}

// getOwnPropertyNames is almost the same as Object.keys one key feature
//  is that it returns hidden properties, since that can't be implemented,
//  this feature gets reduced so it just shows the length property on arrays
function propertyShim(object) {
  if (notObject(object)) {
    throw new TypeError("Object.getOwnPropertyNames called on a non-object");
  }

  var result = keysShim(object);
  if (exports.isArray(object) && exports.indexOf(object, 'length') === -1) {
    result.push('length');
  }
  return result;
}

var keys = typeof Object.keys === 'function' ? Object.keys : keysShim;
var getOwnPropertyNames = typeof Object.getOwnPropertyNames === 'function' ?
  Object.getOwnPropertyNames : propertyShim;

if (new Error().hasOwnProperty('description')) {
  var ERROR_PROPERTY_FILTER = function (obj, array) {
    if (toString.call(obj) === '[object Error]') {
      array = exports.filter(array, function (name) {
        return name !== 'description' && name !== 'number' && name !== 'message';
      });
    }
    return array;
  };

  exports.keys = function (object) {
    return ERROR_PROPERTY_FILTER(object, keys(object));
  };
  exports.getOwnPropertyNames = function (object) {
    return ERROR_PROPERTY_FILTER(object, getOwnPropertyNames(object));
  };
} else {
  exports.keys = keys;
  exports.getOwnPropertyNames = getOwnPropertyNames;
}

// Object.getOwnPropertyDescriptor - supported in IE8 but only on dom elements
function valueObject(value, key) {
  return { value: value[key] };
}

if (typeof Object.getOwnPropertyDescriptor === 'function') {
  try {
    Object.getOwnPropertyDescriptor({'a': 1}, 'a');
    exports.getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
  } catch (e) {
    // IE8 dom element issue - use a try catch and default to valueObject
    exports.getOwnPropertyDescriptor = function (value, key) {
      try {
        return Object.getOwnPropertyDescriptor(value, key);
      } catch (e) {
        return valueObject(value, key);
      }
    };
  }
} else {
  exports.getOwnPropertyDescriptor = valueObject;
}

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

var util = require('util');

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
  if (!util.isNumber(n) || n < 0)
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
        (util.isObject(this._events.error) && !this._events.error.length)) {
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

  if (util.isUndefined(handler))
    return false;

  if (util.isFunction(handler)) {
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
  } else if (util.isObject(handler)) {
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

  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              util.isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (util.isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (util.isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!util.isUndefined(this._maxListeners)) {
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
  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  function g() {
    this.removeListener(type, g);
    listener.apply(this, arguments);
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!util.isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (util.isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (util.isObject(list)) {
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

  if (util.isFunction(listeners)) {
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
  else if (util.isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (util.isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};
},{"util":99}],99:[function(require,module,exports){
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

var shims = require('_shims');

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};

/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  shims.forEach(array, function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = shims.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = shims.getOwnPropertyNames(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }

  shims.forEach(keys, function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = shims.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }

  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (shims.indexOf(ctx.seen, desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = shims.reduce(output, function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return shims.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) && objectToString(e) === '[object Error]';
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.binarySlice === 'function'
  ;
}
exports.isBuffer = isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = shims.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = shims.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

},{"_shims":97}],100:[function(require,module,exports){



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





},{}]},{},[90,"0dIKTs","aFoCK0","cwp+TC"])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQXJyYXkucmVtb3ZlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0JpbmRhYmxlQ29tcG9uZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0NvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9EYXRhU291cmNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0xjV2lkZ2V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL2V4dGVuZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9Db29raWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvRmFjZWJvb2tDb25uZWN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0xjVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1ByaWNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1JlZ0V4cC5xdW90ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9TaW1wbGVTbGlkZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nLnByb3RvdHlwZS5jb250YWlucy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9TdHJpbmdGb3JtYXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguYXV0b2xvYWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguY2hhbmdlc05vdGlmaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC5zbGlkZXJUYWJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLndpemFyZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UaW1lU3Bhbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UaW1lU3BhbkV4dHJhLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1VJU2xpZGVyTGFiZWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhDYWxsYmFja3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYWpheEZvcm1zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9DYWxjdWxhdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXV0b0ZvY3VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9maWxsU3VibWVudS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9Cb29raW5nc05vdGlmaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9Nb250aGx5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL1dlZWtseS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9Xb3JrSG91cnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvY2xlYXJDdXJyZW50U2VsZWN0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2RhdGVVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9mb3JtYXREYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2luZGV4LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL21ha2VVbnNlbGVjdGFibGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvb2JqZWN0VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvdXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYmxvY2tQcmVzZXRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvY3JlYXRlSWZyYW1lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVJU084NjAxLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFRleHQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ29vZ2xlTWFwUmVhZHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ3VpZEdlbmVyYXRvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9oYXNDb25maXJtU3VwcG9ydC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pMThuLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2lzRW1wdHlTdHJpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmFyZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuYm91bmRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmlzQ2hpbGRPZi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkub3V0ZXJIdG1sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5yZWxvYWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL21hdGhVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tb3ZlRm9jdXNUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9udW1iZXJVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3B1cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9yZWRpcmVjdFRvLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9vbHRpcHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdXJsVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYWNjb3VudFBvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZmFxc1BvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvaG9tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvbGVnYWxQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3Byb3ZpZGVyV2VsY29tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvd2VsY29tZVBvcHVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1idWlsdGlucy9idWlsdGluL19zaGltcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItYnVpbHRpbnMvYnVpbHRpbi9ldmVudHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLWJ1aWx0aW5zL2J1aWx0aW4vdXRpbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvbm9kZV9tb2R1bGVzL2RhdGUtZm9ybWF0LWxpdGUvZGF0ZS1mb3JtYXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsi77u/Ly8gQXJyYXkgUmVtb3ZlIC0gQnkgSm9obiBSZXNpZyAoTUlUIExpY2Vuc2VkKVxyXG4vKkFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcclxuSWFnb1NSTDogaXQgc2VlbXMgaW5jb21wYXRpYmxlIHdpdGggTW9kZXJuaXpyIGxvYWRlciBmZWF0dXJlIGxvYWRpbmcgWmVuZGVzayBzY3JpcHQsXHJcbm1vdmVkIGZyb20gcHJvdG90eXBlIHRvIGEgY2xhc3Mtc3RhdGljIG1ldGhvZCAqL1xyXG5mdW5jdGlvbiBhcnJheVJlbW92ZShhbkFycmF5LCBmcm9tLCB0bykge1xyXG4gICAgdmFyIHJlc3QgPSBhbkFycmF5LnNsaWNlKCh0byB8fCBmcm9tKSArIDEgfHwgYW5BcnJheS5sZW5ndGgpO1xyXG4gICAgYW5BcnJheS5sZW5ndGggPSBmcm9tIDwgMCA/IGFuQXJyYXkubGVuZ3RoICsgZnJvbSA6IGZyb207XHJcbiAgICByZXR1cm4gYW5BcnJheS5wdXNoLmFwcGx5KGFuQXJyYXksIHJlc3QpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXJyYXlSZW1vdmU7XHJcbn0gZWxzZSB7XHJcbiAgICBBcnJheS5yZW1vdmUgPSBhcnJheVJlbW92ZTtcclxufSIsIu+7vy8qKlxyXG4gIEJpbmRhYmxlIFVJIENvbXBvbmVudC5cclxuICBJdCByZWxpZXMgb24gQ29tcG9uZW50IGJ1dCBhZGRzIERhdGFTb3VyY2UgY2FwYWJpbGl0aWVzXHJcbioqL1xyXG52YXIgRGF0YVNvdXJjZSA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZScpO1xyXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9Db21wb25lbnQnKTtcclxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4vZXh0ZW5kJyk7XHJcbnZhciBtZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XHJcblxyXG4vKipcclxuUmV1c2luZyB0aGUgb3JpZ2luYWwgZmV0Y2hEYXRhIG1ldGhvZCBidXQgYWRkaW5nIGNsYXNzZXMgdG8gb3VyXHJcbmNvbXBvbmVudCBlbGVtZW50IGZvciBhbnkgdmlzdWFsIG5vdGlmaWNhdGlvbiBvZiB0aGUgZGF0YSBsb2FkaW5nLlxyXG5NZXRob2QgZ2V0IGV4dGVuZGVkIHdpdGggaXNQcmVmZXRjaGluZyBtZXRob2QgZm9yIGRpZmZlcmVudFxyXG5jbGFzc2VzL25vdGlmaWNhdGlvbnMgZGVwZW5kYW50IG9uIHRoYXQgZmxhZywgYnkgZGVmYXVsdCBmYWxzZTpcclxuKiovXHJcbnZhciBjb21wb25lbnRGZXRjaERhdGEgPSBmdW5jdGlvbiBiaW5kYWJsZUNvbXBvbmVudEZldGNoRGF0YShxdWVyeURhdGEsIG1vZGUsIGlzUHJlZmV0Y2hpbmcpIHtcclxuICB2YXIgY2wgPSBpc1ByZWZldGNoaW5nID8gdGhpcy5jbGFzc2VzLnByZWZldGNoaW5nIDogdGhpcy5jbGFzc2VzLmZldGNoaW5nO1xyXG4gIHRoaXMuJGVsLmFkZENsYXNzKGNsKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHZhciByZXEgPSBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaERhdGEuY2FsbCh0aGlzLCBxdWVyeURhdGEsIG1vZGUpXHJcbiAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC4kZWwucmVtb3ZlQ2xhc3MoY2wgfHwgJ18nKTtcclxuICAgIC8vIFVubWFyayBhbnkgcG9zaWJsZSBwcmV2aW91cyBlcnJvciBzaW5jZSB3ZSBoYWQgYSBzdWNjZXMgbG9hZDpcclxuICAgIHRoYXQuaGFzRXJyb3IoZmFsc2UpO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gcmVxO1xyXG59O1xyXG4vKipcclxuUmVwbGFjaW5nLCBidXQgcmV1c2luZyBpbnRlcm5hbHMsIHRoZSBkZWZhdWx0IG9uZXJyb3IgY2FsbGJhY2sgZm9yIHRoZVxyXG5mZXRjaERhdGEgZnVuY3Rpb24gdG8gYWRkIG5vdGlmaWNhdGlvbiBjbGFzc2VzIHRvIG91ciBjb21wb25lbnQgbW9kZWxcclxuKiovXHJcbmNvbXBvbmVudEZldGNoRGF0YS5vbmVycm9yID0gZnVuY3Rpb24gYmluZGFibGVDb21wb25lbnRGZWNoRGF0YU9uZXJyb3IoeCwgcywgZSkge1xyXG4gIERhdGFTb3VyY2UucHJvdG90eXBlLmZldGNoRGF0YS5vbmVycm9yLmNhbGwodGhpcywgeCwgcywgZSk7XHJcbiAgLy8gUmVtb3ZlIGZldGNoaW5nIGNsYXNzZXM6XHJcbiAgdGhpcy4kZWxcclxuICAucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJylcclxuICAucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnByZWZldGNoaW5nIHx8ICdfJyk7XHJcbiAgLy8gTWFyayBlcnJvcjpcclxuICB0aGlzLmhhc0Vycm9yKHsgbmFtZTogJ2ZldGNoRGF0YUVycm9yJywgcmVxdWVzdDogeCwgc3RhdHVzOiBzLCBleGNlcHRpb246IGUgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICBCaW5kYWJsZUNvbXBvbmVudCBjbGFzc1xyXG4qKi9cclxudmFyIEJpbmRhYmxlQ29tcG9uZW50ID0gQ29tcG9uZW50LmV4dGVuZChcclxuICBEYXRhU291cmNlLnByb3RvdHlwZSxcclxuICAvLyBQcm90b3R5cGVcclxuICB7XHJcbiAgICBjbGFzc2VzOiB7XHJcbiAgICAgIGZldGNoaW5nOiAnaXMtbG9hZGluZycsXHJcbiAgICAgIHByZWZldGNoaW5nOiAnaXMtcHJlbG9hZGluZycsXHJcbiAgICAgIGRpc2FibGVkOiAnaXMtZGlzYWJsZWQnLFxyXG4gICAgICBoYXNEYXRhRXJyb3I6ICdoYXMtZGF0YUVycm9yJ1xyXG4gICAgfSxcclxuICAgIGZldGNoRGF0YTogY29tcG9uZW50RmV0Y2hEYXRhLFxyXG4gICAgLy8gV2hhdCBhdHRyaWJ1dGUgbmFtZSB1c2UgdG8gbWFyayBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbXBvbmVudFxyXG4gICAgLy8gd2l0aCB0aGUgcHJvcGVydHkgZnJvbSB0aGUgc291cmNlIHRvIGJpbmQuXHJcbiAgICAvLyBUaGUgcHJlZml4ICdkYXRhLScgaW4gY3VzdG9tIGF0dHJpYnV0ZXMgaXMgcmVxdWlyZWQgYnkgaHRtbDUsXHJcbiAgICAvLyBqdXN0IHNwZWNpZnkgdGhlIHNlY29uZCBwYXJ0LCBiZWluZyAnYmluZCcgdGhlIGF0dHJpYnV0ZVxyXG4gICAgLy8gbmFtZSB0byB1c2UgaXMgJ2RhdGEtYmluZCdcclxuICAgIGRhdGFCaW5kQXR0cmlidXRlOiAnYmluZCcsXHJcbiAgICAvLyBEZWZhdWx0IGJpbmREYXRhIGltcGxlbWVudGF0aW9uLCBjYW4gYmUgcmVwbGFjZSBvbiBleHRlbmRlZCBjb21wb25lbnRzXHJcbiAgICAvLyB0byBzb21ldGhpbmcgbW9yZSBjb21wbGV4IChsaXN0L2NvbGxlY3Rpb25zLCBzdWItb2JqZWN0cywgY3VzdG9tIHN0cnVjdHVyZXNcclxuICAgIC8vIGFuZCB2aXN1YWxpemF0aW9uIC0ta2VlcCBhcyBwb3NzaWJsZSB0aGUgdXNlIG9mIGRhdGFCaW5kQXR0cmlidXRlIGZvciByZXVzYWJsZSBjb2RlKS5cclxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gd29ya3MgZmluZSBmb3IgZGF0YSBhcyBwbGFpbiBvYmplY3Qgd2l0aCBcclxuICAgIC8vIHNpbXBsZSB0eXBlcyBhcyBwcm9wZXJ0aWVzIChub3Qgb2JqZWN0cyBvciBhcnJheXMgaW5zaWRlIHRoZW0pLlxyXG4gICAgYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhKCkge1xyXG4gICAgICBpZiAoIXRoaXMuZGF0YSkgcmV0dXJuO1xyXG4gICAgICAvLyBDaGVjayBldmVyeSBlbGVtZW50IGluIHRoZSBjb21wb25lbnQgd2l0aCBhIGJpbmRcclxuICAgICAgLy8gcHJvcGVydHkgYW5kIHVwZGF0ZSBpdCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGF0IHByb3BlcnR5XHJcbiAgICAgIC8vIGZyb20gdGhlIGRhdGEgc291cmNlXHJcbiAgICAgIHZhciBhdHQgPSB0aGlzLmRhdGFCaW5kQXR0cmlidXRlO1xyXG4gICAgICB2YXIgYXR0clNlbGVjdG9yID0gJ1tkYXRhLScgKyBhdHQgKyAnXSc7XHJcbiAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgdGhpcy4kZWwuZmluZChhdHRyU2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyksXHJcbiAgICAgICAgICBwcm9wID0gJHQuZGF0YShhdHQpLFxyXG4gICAgICAgICAgYmluZGVkVmFsdWUgPSB0aGF0LmRhdGFbcHJvcF07XHJcblxyXG4gICAgICAgIGlmICgkdC5pcygnOmlucHV0JykpXHJcbiAgICAgICAgICAkdC52YWwoYmluZGVkVmFsdWUpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICR0LnRleHQoYmluZGVkVmFsdWUpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAgSXQgZ2V0cyB0aGUgbGF0ZXN0IGVycm9yIGhhcHBlbmVkIGluIHRoZSBjb21wb25lbnQgKG9yIG51bGwvZmFsc3kgaWYgdGhlcmUgaXMgbm8pLFxyXG4gICAgICBvciBzZXRzIHRoZSBlcnJvciAocGFzc2luZyBpdCBpbiB0aGUgb3B0aW9uYWwgdmFsdWUpIHJldHVybmluZyB0aGUgcHJldmlvdXMgcmVnaXN0ZXJlZCBlcnJvci5cclxuICAgICAgSXRzIHJlY29tbWVuZGVkIGFuIG9iamVjdCBhcyBlcnJvciBpbnN0ZWFkIG9mIGEgc2ltcGxlIHZhbHVlIG9yIHN0cmluZyAodGhhdCBjYW4gZ2V0IGNvbmZ1c2VkXHJcbiAgICAgIHdpdGggZmFsc3kgaWYgaXMgZW1wdHkgc3RyaW5nIG9yIDAsIGFuZCBhbGxvdyBhdHRhY2ggbW9yZSBzdHJ1Y3R1cmVkIGluZm9ybWF0aW9uKSB3aXRoIGFuXHJcbiAgICAgIGluZm9ybWF0aW9uYWwgcHJvcGVydHkgJ25hbWUnLlxyXG4gICAgICBUbyBzZXQgb2ZmIHRoZSBlcnJvciwgcGFzcyBudWxsIHZhbHVlIG9yIGZhbHNlLlxyXG4gICAgKiovXHJcbiAgICBoYXNFcnJvcjogZnVuY3Rpb24gaGFzRXJyb3IoZXJyb3JUb1NldCkge1xyXG4gICAgICBpZiAodHlwZW9mIChlcnJvclRvU2V0KSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9lcnJvciB8fCBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBwcmV2ID0gdGhpcy5fZXJyb3IgfHwgbnVsbDtcclxuICAgICAgdGhpcy5fZXJyb3IgPSBlcnJvclRvU2V0O1xyXG4gICAgICB0aGlzLmV2ZW50cy5lbWl0KCdoYXNFcnJvckNoYW5nZWQnLCBlcnJvclRvU2V0LCBwcmV2KTtcclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9XHJcbiAgfSxcclxuICAvLyBDb25zdHJ1Y3RvclxyXG4gIGZ1bmN0aW9uIEJpbmRhYmxlQ29tcG9uZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIENvbXBvbmVudC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgXHJcbiAgICAvLyBJdCBoYXMgYW4gZXZlbnQgZW1pdHRlcjpcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IG1ldmVudHMuRXZlbnRFbWl0dGVyKCk7XHJcbiAgICAvLyBFdmVudHMgb2JqZWN0IGhhcyBhIHByb3BlcnR5IHRvIGFjY2VzcyB0aGlzIG9iamVjdCxcclxuICAgIC8vIHVzZWZ1bGwgdG8gcmVmZXJlbmNlIGFzICd0aGlzLmNvbXBvbmVudCcgZnJvbSBpbnNpZGVcclxuICAgIC8vIGV2ZW50IGhhbmRsZXJzOlxyXG4gICAgdGhpcy5ldmVudHMuY29tcG9uZW50ID0gdGhpcztcclxuXHJcbiAgICB0aGlzLmRhdGEgPSB0aGlzLiRlbC5kYXRhKCdzb3VyY2UnKSB8fCB0aGlzLmRhdGEgfHwge307XHJcbiAgICBpZiAodHlwZW9mICh0aGlzLmRhdGEpID09ICdzdHJpbmcnKVxyXG4gICAgICB0aGlzLmRhdGEgPSBKU09OLnBhcnNlKHRoaXMuZGF0YSk7XHJcblxyXG4gICAgLy8gT24gaHRtbCBzb3VyY2UgdXJsIGNvbmZpZ3VyYXRpb246XHJcbiAgICB0aGlzLnVybCA9IHRoaXMuJGVsLmRhdGEoJ3NvdXJjZS11cmwnKSB8fCB0aGlzLnVybDtcclxuXHJcbiAgICAvLyBDbGFzc2VzIG9uIGZldGNoRGF0YUVycm9yXHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICB0aGlzLmV2ZW50cy5vbignaGFzRXJyb3JDaGFuZ2VkJywgZnVuY3Rpb24gKGVyciwgcHJldkVycikge1xyXG4gICAgICBpZiAoZXJyICYmIGVyci5uYW1lID09ICdmZXRjaERhdGFFcnJvcicpIHtcclxuICAgICAgICB0aGF0LiRlbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuaGFzRGF0YUVycm9yKTtcclxuICAgICAgfSBlbHNlIGlmIChwcmV2RXJyICYmIHByZXZFcnIubmFtZSA9PSAnZmV0Y2hEYXRhRXJyb3InKSB7XHJcbiAgICAgICAgdGhhdC4kZWwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLmhhc0RhdGFFcnJvciB8fCAnXycpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBUT0RPOiAnY2hhbmdlJyBldmVudCBoYW5kbGVycyBvbiBmb3JtcyB3aXRoIGRhdGEtYmluZCB0byB1cGRhdGUgaXRzIHZhbHVlIGF0IHRoaXMuZGF0YVxyXG4gICAgLy8gVE9ETzogYXV0byAnYmluZERhdGEnIG9uIGZldGNoRGF0YSBlbmRzPyBjb25maWd1cmFibGUsIGJpbmREYXRhTW9kZXsgaW5tZWRpYXRlLCBub3RpZnkgfVxyXG4gIH1cclxuKTtcclxuXHJcbi8vIFB1YmxpYyBtb2R1bGU6XHJcbm1vZHVsZS5leHBvcnRzID0gQmluZGFibGVDb21wb25lbnQ7Iiwi77u/LyoqIENvbXBvbmVudCBjbGFzczogd3JhcHBlciBmb3JcclxuICB0aGUgbG9naWMgYW5kIGJlaGF2aW9yIGFyb3VuZFxyXG4gIGEgRE9NIGVsZW1lbnRcclxuKiovXHJcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpO1xyXG5cclxuZnVuY3Rpb24gQ29tcG9uZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICB0aGlzLmVsID0gZWxlbWVudDtcclxuICB0aGlzLiRlbCA9ICQoZWxlbWVudCk7XHJcbiAgZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIC8vIFVzZSB0aGUgalF1ZXJ5ICdkYXRhJyBzdG9yYWdlIHRvIHByZXNlcnZlIGEgcmVmZXJlbmNlXHJcbiAgLy8gdG8gdGhpcyBpbnN0YW5jZSAodXNlZnVsIHRvIHJldHJpZXZlIGl0IGZyb20gZG9jdW1lbnQpXHJcbiAgdGhpcy4kZWwuZGF0YSgnY29tcG9uZW50JywgdGhpcyk7XHJcbn1cclxuXHJcbmV4dGVuZC5wbHVnSW4oQ29tcG9uZW50KTtcclxuZXh0ZW5kLnBsdWdJbihDb21wb25lbnQucHJvdG90eXBlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50OyIsIu+7vy8qKlxyXG4gIERhdGFTb3VyY2UgY2xhc3MgdG8gc2ltcGxpZnkgZmV0Y2hpbmcgZGF0YSBhcyBKU09OXHJcbiAgdG8gZmlsbCBhIGxvY2FsIGNhY2hlLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGZldGNoSlNPTiA9ICQuZ2V0SlNPTixcclxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICQuZXh0ZW5kLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpOyB9O1xyXG5cclxuLy8gVE9ETzogcmVwbGFjZSBlYWNoIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyBieSBpbnN0YW5jZSBwcm9wZXJ0aWVzLCBzaW5jZSB0aGF0IHByb3BlcnRpZXMgYmVjb21lXHJcbi8vIHNoYXJlZCBiZXR3ZWVuIGluc3RhbmNlcyBhbmQgaXMgbm90IHdhbnRlZFxyXG5cclxudmFyIHJlcU1vZGVzID0gRGF0YVNvdXJjZS5yZXF1ZXN0TW9kZXMgPSB7XHJcbiAgLy8gUGFyYWxsZWwgcmVxdWVzdCwgbm8gbWF0dGVyIG9mIG90aGVyc1xyXG4gIG11bHRpcGxlOiAwLFxyXG4gIC8vIFdpbGwgYXZvaWQgYSByZXF1ZXN0IGlmIHRoZXJlIGlzIG9uZSBydW5uaW5nXHJcbiAgc2luZ2xlOiAxLFxyXG4gIC8vIExhdGVzdCByZXF1ZXQgd2lsbCByZXBsYWNlIGFueSBwcmV2aW91cyBvbmUgKHByZXZpb3VzIHdpbGwgYWJvcnQpXHJcbiAgcmVwbGFjZTogMlxyXG59O1xyXG5cclxudmFyIHVwZE1vZGVzID0gRGF0YVNvdXJjZS51cGRhdGVNb2RlcyA9IHtcclxuICAvLyBFdmVyeSBuZXcgZGF0YSB1cGRhdGUsIG5ldyBjb250ZW50IGlzIGFkZGVkIGluY3JlbWVudGFsbHlcclxuICAvLyAob3ZlcndyaXRlIGNvaW5jaWRlbnQgY29udGVudCwgYXBwZW5kIG5ldyBjb250ZW50LCBvbGQgY29udGVudFxyXG4gIC8vIGdldCBpbiBwbGFjZSlcclxuICBpbmNyZW1lbnRhbDogMCxcclxuICAvLyBPbiBuZXcgZGF0YSB1cGRhdGUsIG5ldyBkYXRhIHRvdGFsbHkgcmVwbGFjZSB0aGUgcHJldmlvdXMgb25lXHJcbiAgcmVwbGFjZW1lbnQ6IDFcclxufTtcclxuXHJcbi8qKlxyXG5VcGRhdGUgdGhlIGRhdGEgc3RvcmUgb3IgY2FjaGUgd2l0aCB0aGUgZ2l2ZW4gb25lLlxyXG5UaGVyZSBhcmUgZGlmZmVyZW50IG1vZGVzLCB0aGlzIG1hbmFnZXMgdGhhdCBsb2dpYyBhbmRcclxuaXRzIG93biBjb25maWd1cmF0aW9uLlxyXG5JcyBkZWNvdXBsZWQgZnJvbSB0aGUgcHJvdG90eXBlIGJ1dFxyXG5pdCB3b3JrcyBvbmx5IGFzIHBhcnQgb2YgYSBEYXRhU291cmNlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGF0YShkYXRhLCBtb2RlKSB7XHJcbiAgc3dpdGNoIChtb2RlIHx8IHRoaXMudXBkYXRlRGF0YS5kZWZhdWx0VXBkYXRlTW9kZSkge1xyXG5cclxuICAgIGNhc2UgdXBkTW9kZXMucmVwbGFjZW1lbnQ6XHJcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIC8vY2FzZSB1cGRNb2Rlcy5pbmNyZW1lbnRhbDogIFxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgLy8gSW4gY2FzZSBpbml0aWFsIGRhdGEgaXMgbnVsbCwgYXNzaWduIHRoZSByZXN1bHQgdG8gaXRzZWxmOlxyXG4gICAgICB0aGlzLmRhdGEgPSBleHRlbmQodGhpcy5kYXRhLCBkYXRhKTtcclxuICAgICAgYnJlYWs7XHJcbiAgfVxyXG59XHJcblxyXG4vKiogRGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGNvbmZpZ3VyYWJsZSB1cGRhdGUgbW9kZTpcclxuKiovXHJcbnVwZGF0ZURhdGEuZGVmYXVsdFVwZGF0ZU1vZGUgPSB1cGRNb2Rlcy5pbmNyZW1lbnRhbDtcclxuXHJcbi8qKlxyXG5GZXRjaCB0aGUgZGF0YSBmcm9tIHRoZSBzZXJ2ZXIuXHJcbkhlcmUgaXMgZGVjb3VwbGVkIGZyb20gdGhlIHJlc3Qgb2YgdGhlIHByb3RvdHlwZSBmb3JcclxuY29tbW9kaXR5LCBidXQgaXQgY2FuIHdvcmtzIG9ubHkgYXMgcGFydCBvZiBhIERhdGFTb3VyY2UgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiBmZXRjaERhdGEocXVlcnksIG1vZGUpIHtcclxuICBxdWVyeSA9IGV4dGVuZCh7fSwgdGhpcy5xdWVyeSwgcXVlcnkpO1xyXG4gIHN3aXRjaCAobW9kZSB8fCB0aGlzLmZldGNoRGF0YS5kZWZhdWx0UmVxdWVzdE1vZGUpIHtcclxuXHJcbiAgICBjYXNlIHJlcU1vZGVzLnNpbmdsZTpcclxuICAgICAgaWYgKHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCkgcmV0dXJuIG51bGw7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgcmVxTW9kZXMucmVwbGFjZTpcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0c1tpXS5hYm9ydCgpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7IH1cclxuICAgICAgICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cyA9IFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIC8vIEp1c3QgZG8gbm90aGluZyBmb3IgbXVsdGlwbGUgb3IgZGVmYXVsdCAgICAgXHJcbiAgICAvL2Nhc2UgcmVxTW9kZXMubXVsdGlwbGU6ICBcclxuICAgIC8vZGVmYXVsdDogXHJcbiAgfVxyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdmFyIHJlcSA9IHRoaXMuZmV0Y2hEYXRhLnByb3h5KFxyXG4gICAgdGhpcy51cmwsXHJcbiAgICBxdWVyeSxcclxuICAgIGZ1bmN0aW9uIChkYXRhLCB0LCB4aHIpIHtcclxuICAgICAgdmFyIHJldCA9IHRoYXQudXBkYXRlRGF0YShkYXRhKTtcclxuICAgICAgdGhhdC5mZXRjaERhdGEucmVxdWVzdHMuc3BsaWNlKHRoYXQuZmV0Y2hEYXRhLnJlcXVlc3RzLmluZGV4T2YocmVxKSwgMSk7XHJcbiAgICAgIC8vZGVsZXRlIGZldGNoRGF0YS5yZXF1ZXN0c1tmZXRjaERhdGEucmVxdWVzdHMuaW5kZXhPZihyZXEpXTtcclxuXHJcbiAgICAgIGlmIChyZXQgJiYgcmV0Lm5hbWUpIHtcclxuICAgICAgICAvLyBVcGRhdGUgZGF0YSBlbWl0cyBlcnJvciwgdGhlIEFqYXggc3RpbGwgcmVzb2x2ZXMgYXMgJ3N1Y2Nlc3MnIGJlY2F1c2Ugb2YgdGhlIHJlcXVlc3QsIGJ1dFxyXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gZXhlY3V0ZSB0aGUgZXJyb3IsIGJ1dCB3ZSBwaXBlIGl0IHRvIGVuc3VyZSBpcyBkb25lIGFmdGVyIG90aGVyICdkb25lJyBjYWxsYmFja3NcclxuICAgICAgICByZXEuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHRoYXQuZmV0Y2hEYXRhLm9uZXJyb3IuY2FsbCh0aGF0LCBudWxsLCByZXQubmFtZSwgcmV0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuICApXHJcbiAgLmZhaWwoJC5wcm94eSh0aGlzLmZldGNoRGF0YS5vbmVycm9yLCB0aGlzKSk7XHJcbiAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMucHVzaChyZXEpO1xyXG5cclxuICByZXR1cm4gcmVxO1xyXG59XHJcblxyXG4vLyBEZWZhdWx0cyBmZXRjaERhdGEgcHJvcGVydGllcywgdGhleSBhcmUgZGVjb3VwbGVkIHRvIGFsbG93XHJcbi8vIHJlcGxhY2VtZW50LCBhbmQgaW5zaWRlIHRoZSBmZXRjaERhdGEgZnVuY3Rpb24gdG8gZG9uJ3RcclxuLy8gY29udGFtaW5hdGUgdGhlIG9iamVjdCBuYW1lc3BhY2UuXHJcblxyXG4vKiBDb2xsZWN0aW9uIG9mIGFjdGl2ZSAoZmV0Y2hpbmcpIHJlcXVlc3RzIHRvIHRoZSBzZXJ2ZXJcclxuKi9cclxuZmV0Y2hEYXRhLnJlcXVlc3RzID0gW107XHJcblxyXG4vKiBEZWNvdXBsZWQgZnVuY3Rpb25hbGl0eSB0byBwZXJmb3JtIHRoZSBBamF4IG9wZXJhdGlvbixcclxudGhpcyBhbGxvd3Mgb3ZlcndyaXRlIHRoaXMgYmVoYXZpb3IgdG8gaW1wbGVtZW50IGFub3RoZXJcclxud2F5cywgbGlrZSBhIG5vbi1qUXVlcnkgaW1wbGVtZW50YXRpb24sIGEgcHJveHkgdG8gZmFrZSBzZXJ2ZXJcclxuZm9yIHRlc3Rpbmcgb3IgcHJveHkgdG8gbG9jYWwgc3RvcmFnZSBpZiBvbmxpbmUsIGV0Yy5cclxuSXQgbXVzdCByZXR1cm5zIHRoZSB1c2VkIHJlcXVlc3Qgb2JqZWN0LlxyXG4qL1xyXG5mZXRjaERhdGEucHJveHkgPSBmZXRjaEpTT047XHJcblxyXG4vKiBCeSBkZWZhdWx0LCBmZXRjaERhdGEgYWxsb3dzIG11bHRpcGxlIHNpbXVsdGFuZW9zIGNvbm5lY3Rpb24sXHJcbnNpbmNlIHRoZSBzdG9yYWdlIGJ5IGRlZmF1bHQgYWxsb3dzIGluY3JlbWVudGFsIHVwZGF0ZXMgcmF0aGVyXHJcbnRoYW4gcmVwbGFjZW1lbnRzLlxyXG4qL1xyXG5mZXRjaERhdGEuZGVmYXVsdFJlcXVlc3RNb2RlID0gcmVxTW9kZXMubXVsdGlwbGU7XHJcblxyXG4vKiBEZWZhdWx0IG5vdGlmaWNhdGlvbiBvZiBlcnJvciBvbiBmZXRjaGluZywganVzdCBsb2dnaW5nLFxyXG5jYW4gYmUgcmVwbGFjZWQuXHJcbkl0IHJlY2VpdmVzIHRoZSByZXF1ZXN0IG9iamVjdCwgc3RhdHVzIGFuZCBlcnJvci5cclxuKi9cclxuZmV0Y2hEYXRhLm9uZXJyb3IgPSBmdW5jdGlvbiBlcnJvcih4LCBzLCBlKSB7XHJcbiAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignRmV0Y2ggZGF0YSBlcnJvciAlbycsIGUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgRGF0YVNvdXJjZSBjbGFzc1xyXG4qKi9cclxuLy8gQ29uc3RydWN0b3I6IGV2ZXJ5dGhpbmcgaXMgaW4gdGhlIHByb3RvdHlwZS5cclxuZnVuY3Rpb24gRGF0YVNvdXJjZSgpIHsgfVxyXG5EYXRhU291cmNlLnByb3RvdHlwZSA9IHtcclxuICBkYXRhOiBudWxsLFxyXG4gIHVybDogJy8nLFxyXG4gIC8vIHF1ZXJ5OiBvYmplY3Qgd2l0aCBkZWZhdWx0IGV4dHJhIGluZm9ybWF0aW9uIHRvIGFwcGVuZCB0byB0aGUgdXJsXHJcbiAgLy8gd2hlbiBmZXRjaGluZyBkYXRhLCBleHRlbmRlZCB3aXRoIHRoZSBleHBsaWNpdCBxdWVyeSBzcGVjaWZpZWRcclxuICAvLyBleGVjdXRpbmcgZmV0Y2hEYXRhKHF1ZXJ5KVxyXG4gIHF1ZXJ5OiB7fSxcclxuICB1cGRhdGVEYXRhOiB1cGRhdGVEYXRhLFxyXG4gIGZldGNoRGF0YTogZmV0Y2hEYXRhXHJcbiAgLy8gVE9ETyAgcHVzaERhdGE6IGZ1bmN0aW9uKCl7IHBvc3QvcHV0IHRoaXMuZGF0YSB0byB1cmwgIH1cclxufTtcclxuXHJcbi8vIENsYXNzIGFzIHB1YmxpYyBtb2R1bGU6XHJcbm1vZHVsZS5leHBvcnRzID0gRGF0YVNvdXJjZTsiLCLvu78vKipcclxuICBMb2Nvbm9taWNzIHNwZWNpZmljIFdpZGdldCBiYXNlZCBvbiBCaW5kYWJsZUNvbXBvbmVudC5cclxuICBKdXN0IGRlY291cGxpbmcgc3BlY2lmaWMgYmVoYXZpb3JzIGZyb20gc29tZXRoaW5nIG1vcmUgZ2VuZXJhbFxyXG4gIHRvIGVhc2lseSB0cmFjayB0aGF0IGRldGFpbHMsIGFuZCBtYXliZSBmdXR1cmUgbWlncmF0aW9ucyB0b1xyXG4gIG90aGVyIGZyb250LWVuZCBmcmFtZXdvcmtzLlxyXG4qKi9cclxudmFyIERhdGFTb3VyY2UgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2UnKTtcclxudmFyIEJpbmRhYmxlQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9CaW5kYWJsZUNvbXBvbmVudCcpO1xyXG5cclxudmFyIExjV2lkZ2V0ID0gQmluZGFibGVDb21wb25lbnQuZXh0ZW5kKFxyXG4gIC8vIFByb3RvdHlwZVxyXG4gIHtcclxuICAgIC8vIFJlcGxhY2luZyB1cGRhdGVEYXRhIHRvIGltcGxlbWVudCB0aGUgcGFydGljdWxhclxyXG4gICAgLy8gSlNPTiBzY2hlbWUgb2YgTG9jb25vbWljcywgYnV0IHJldXNpbmcgb3JpZ2luYWxcclxuICAgIC8vIGxvZ2ljIGluaGVyaXQgZnJvbSBEYXRhU291cmNlXHJcbiAgICB1cGRhdGVEYXRhOiBmdW5jdGlvbiAoZGF0YSwgbW9kZSkge1xyXG4gICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICBEYXRhU291cmNlLnByb3RvdHlwZS51cGRhdGVEYXRhLmNhbGwodGhpcywgZGF0YS5SZXN1bHQsIG1vZGUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEVycm9yIG1lc3NhZ2UgaW4gdGhlIEpTT05cclxuICAgICAgICByZXR1cm4geyBuYW1lOiAnZGF0YS1mb3JtYXQnLCBtZXNzYWdlOiBkYXRhLlJlc3VsdCA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA6IGRhdGEuUmVzdWx0IDogXCJ1bmtub3dcIiB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICAvLyBDb25zdHJ1Y3RvclxyXG4gIGZ1bmN0aW9uIExjV2lkZ2V0KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIEJpbmRhYmxlQ29tcG9uZW50LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgfVxyXG4pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1dpZGdldDsiLCLvu78vKipcclxuICBEZWVwIEV4dGVuZCBvYmplY3QgdXRpbGl0eSwgaXMgcmVjdXJzaXZlIHRvIGdldCBhbGwgdGhlIGRlcHRoXHJcbiAgYnV0IG9ubHkgZm9yIHRoZSBwcm9wZXJ0aWVzIG93bmVkIGJ5IHRoZSBvYmplY3QsXHJcbiAgaWYgeW91IG5lZWQgdGhlIG5vbi1vd25lZCBwcm9wZXJ0aWVzIHRvIGluIHRoZSBvYmplY3QsXHJcbiAgY29uc2lkZXIgZXh0ZW5kIGZyb20gdGhlIHNvdXJjZSBwcm90b3R5cGUgdG9vIChhbmQgbWF5YmUgdG9cclxuICB0aGUgZGVzdGluYXRpb24gcHJvdG90eXBlIGluc3RlYWQgb2YgdGhlIGluc3RhbmNlLCBidXQgdXAgdG8gdG9vKS5cclxuKiovXHJcblxyXG4vKiBqcXVlcnkgaW1wbGVtZW50YXRpb246XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcclxucmV0dXJuICQuZXh0ZW5kLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpOyBcclxufTsqL1xyXG5cclxudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChkZXN0aW5hdGlvbiwgc291cmNlKSB7XHJcbiAgZm9yICh2YXIgcHJvcGVydHkgaW4gc291cmNlKSB7XHJcbiAgICBpZiAoIXNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpXHJcbiAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgIC8vIEFsbG93IHByb3BlcnRpZXMgcmVtb3ZhbCwgaWYgc291cmNlIGNvbnRhaW5zIHZhbHVlICd1bmRlZmluZWQnLlxyXG4gICAgLy8gVGhlcmUgYXJlIG5vIHNwZWNpYWwgY29uc2lkZXJhdGlvbnMgb24gQXJyYXlzLCB0byBkb24ndCBnZXQgdW5kZXNpcmVkXHJcbiAgICAvLyByZXN1bHRzIGp1c3QgdGhlIHdhbnRlZCBpcyB0byByZXBsYWNlIHNwZWNpZmljIHBvc2l0aW9ucywgbm9ybWFsbHkuXHJcbiAgICBpZiAoc291cmNlW3Byb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRlbGV0ZSBkZXN0aW5hdGlvbltwcm9wZXJ0eV07XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChbJ29iamVjdCcsICdmdW5jdGlvbiddLmluZGV4T2YodHlwZW9mIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSkgIT0gLTEgJiZcclxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZVtwcm9wZXJ0eV0gPT0gJ29iamVjdCcpXHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9PSAnZnVuY3Rpb24nICYmXHJcbiAgICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZVtwcm9wZXJ0eV0gPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB2YXIgb3JpZyA9IGRlc3RpbmF0aW9uW3Byb3BlcnR5XTtcclxuICAgICAgLy8gQ2xvbmUgZnVuY3Rpb25cclxuICAgICAgdmFyIHNvdXIgPSBjbG9uZUZ1bmN0aW9uKHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgICBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPSBzb3VyO1xyXG4gICAgICAvLyBBbnkgcHJldmlvdXMgYXR0YWNoZWQgcHJvcGVydHlcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgb3JpZyk7XHJcbiAgICAgIC8vIEFueSBzb3VyY2UgYXR0YWNoZWQgcHJvcGVydHlcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICAgIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV07XHJcbiAgfVxyXG5cclxuICAvLyBTbyBtdWNoICdzb3VyY2UnIGFyZ3VtZW50cyBhcyB3YW50ZWQuIEluIEVTNiB3aWxsIGJlICdzb3VyY2UuLidcclxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcclxuICAgIHZhciBuZXh0cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XHJcbiAgICBuZXh0cy5zcGxpY2UoMSwgMSk7XHJcbiAgICBleHRlbmQuYXBwbHkodGhpcywgbmV4dHMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRlc3RpbmF0aW9uO1xyXG59O1xyXG5cclxuZXh0ZW5kLnBsdWdJbiA9IGZ1bmN0aW9uIHBsdWdJbihvYmopIHtcclxuICBvYmogPSBvYmogfHwgT2JqZWN0LnByb3RvdHlwZTtcclxuICBvYmouZXh0ZW5kTWUgPSBmdW5jdGlvbiBleHRlbmRNZSgpIHtcclxuICAgIGV4dGVuZC5hcHBseSh0aGlzLCBbdGhpc10uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcclxuICB9O1xyXG4gIG9iai5leHRlbmQgPSBmdW5jdGlvbiBleHRlbmRJbnN0YW5jZSgpIHtcclxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcclxuICAgICAgLy8gSWYgdGhlIG9iamVjdCB1c2VkIHRvIGV4dGVuZCBmcm9tIGlzIGEgZnVuY3Rpb24sIGlzIGNvbnNpZGVyZWRcclxuICAgICAgLy8gYSBjb25zdHJ1Y3RvciwgdGhlbiB3ZSBleHRlbmQgZnJvbSBpdHMgcHJvdG90eXBlLCBvdGhlcndpc2UgaXRzZWxmLlxyXG4gICAgICBjb25zdHJ1Y3RvckEgPSB0eXBlb2YgdGhpcyA9PSAnZnVuY3Rpb24nID8gdGhpcyA6IG51bGwsXHJcbiAgICAgIGJhc2VBID0gY29uc3RydWN0b3JBID8gdGhpcy5wcm90b3R5cGUgOiB0aGlzLFxyXG4gICAgICAvLyBJZiBsYXN0IGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24sIGlzIGNvbnNpZGVyZWQgYSBjb25zdHJ1Y3RvclxyXG4gICAgICAvLyBvZiB0aGUgbmV3IGNsYXNzL29iamVjdCB0aGVuIHdlIGV4dGVuZCBpdHMgcHJvdG90eXBlLlxyXG4gICAgICAvLyBXZSB1c2UgYW4gZW1wdHkgb2JqZWN0IG90aGVyd2lzZS5cclxuICAgICAgY29uc3RydWN0b3JCID0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PSAnZnVuY3Rpb24nID9cclxuICAgICAgICBhcmdzLnNwbGljZShhcmdzLmxlbmd0aCAtIDEpWzBdIDpcclxuICAgICAgICBudWxsLFxyXG4gICAgICBiYXNlQiA9IGNvbnN0cnVjdG9yQiA/IGNvbnN0cnVjdG9yQi5wcm90b3R5cGUgOiB7fTtcclxuXHJcbiAgICB2YXIgZXh0ZW5kZWRSZXN1bHQgPSBleHRlbmQuYXBwbHkodGhpcywgW2Jhc2VCLCBiYXNlQV0uY29uY2F0KGFyZ3MpKTtcclxuICAgIC8vIElmIGJvdGggYXJlIGNvbnN0cnVjdG9ycywgd2Ugd2FudCB0aGUgc3RhdGljIG1ldGhvZHMgdG8gYmUgY29waWVkIHRvbzpcclxuICAgIGlmIChjb25zdHJ1Y3RvckEgJiYgY29uc3RydWN0b3JCKVxyXG4gICAgICBleHRlbmQoY29uc3RydWN0b3JCLCBjb25zdHJ1Y3RvckEpO1xyXG5cclxuICAgIC8vIElmIHdlIGFyZSBleHRlbmRpbmcgYSBjb25zdHJ1Y3Rvciwgd2UgcmV0dXJuIHRoYXQsIG90aGVyd2lzZSB0aGUgcmVzdWx0XHJcbiAgICByZXR1cm4gY29uc3RydWN0b3JCIHx8IGV4dGVuZGVkUmVzdWx0O1xyXG4gIH07XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICBtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZDtcclxufSBlbHNlIHtcclxuICAvLyBnbG9iYWwgc2NvcGVcclxuICBleHRlbmQucGx1Z0luKCk7XHJcbn1cclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gIENsb25lIFV0aWxzXHJcbiovXHJcbmZ1bmN0aW9uIGNsb25lT2JqZWN0KG9iaikge1xyXG4gIHJldHVybiBleHRlbmQoe30sIG9iaik7XHJcbn1cclxuXHJcbi8vIFRlc3RpbmcgaWYgYSBzdHJpbmcgc2VlbXMgYSBmdW5jdGlvbiBzb3VyY2UgY29kZTpcclxuLy8gV2UgdGVzdCBhZ2FpbnMgYSBzaW1wbGlzaWMgcmVndWxhciBleHByZXNpb24gdGhhdCBtYXRjaFxyXG4vLyBhIGNvbW1vbiBzdGFydCBvZiBmdW5jdGlvbiBkZWNsYXJhdGlvbi5cclxuLy8gT3RoZXIgd2F5cyB0byBkbyB0aGlzIGlzIGF0IGludmVyc2VyLCBieSBjaGVja2luZ1xyXG4vLyB0aGF0IHRoZSBmdW5jdGlvbiB0b1N0cmluZyBpcyBub3QgYSBrbm93ZWQgdGV4dFxyXG4vLyBhcyAnW29iamVjdCBGdW5jdGlvbl0nIG9yICdbbmF0aXZlIGNvZGVdJywgYnV0XHJcbi8vIHNpbmNlIHRoYSBjYW4gY2hhbmdlcyBiZXR3ZWVuIGJyb3dzZXJzLCBpcyBtb3JlIGNvbnNlcnZhdGl2ZVxyXG4vLyBjaGVjayBhZ2FpbnN0IGEgY29tbW9uIGNvbnN0cnVjdCBhbiBmYWxsYmFjayBvbiB0aGVcclxuLy8gY29tbW9uIHNvbHV0aW9uIGlmIG5vdCBtYXRjaGVzLlxyXG52YXIgdGVzdEZ1bmN0aW9uID0gL15cXHMqZnVuY3Rpb25bXlxcKF1cXCgvO1xyXG5cclxuZnVuY3Rpb24gY2xvbmVGdW5jdGlvbihmbikge1xyXG4gIHZhciB0ZW1wO1xyXG4gIHZhciBjb250ZW50cyA9IGZuLnRvU3RyaW5nKCk7XHJcbiAgLy8gQ29weSB0byBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgc2FtZSBwcm90b3R5cGUsIGZvciB0aGUgbm90ICdvd25lZCcgcHJvcGVydGllcy5cclxuICAvLyBBc3NpbmdlZCBhdCB0aGUgZW5kXHJcbiAgdmFyIHRlbXBQcm90byA9IE9iamVjdC5jcmVhdGUoZm4ucHJvdG90eXBlKTtcclxuXHJcbiAgLy8gRElTQUJMRUQgdGhlIGNvbnRlbnRzLWNvcHkgcGFydCBiZWNhdXNlIGl0IGZhaWxzIHdpdGggY2xvc3VyZXNcclxuICAvLyBnZW5lcmF0ZWQgYnkgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLCB1c2luZyB0aGUgc3ViLWNhbGwgd2F5IGV2ZXJcclxuICBpZiAodHJ1ZSB8fCAhdGVzdEZ1bmN0aW9uLnRlc3QoY29udGVudHMpKSB7XHJcbiAgICAvLyBDaGVjayBpZiBpcyBhbHJlYWR5IGEgY2xvbmVkIGNvcHksIHRvXHJcbiAgICAvLyByZXVzZSB0aGUgb3JpZ2luYWwgY29kZSBhbmQgYXZvaWQgbW9yZSB0aGFuXHJcbiAgICAvLyBvbmUgZGVwdGggaW4gc3RhY2sgY2FsbHMgKGdyZWF0ISlcclxuICAgIGlmICh0eXBlb2YgZm4ucHJvdG90eXBlLl9fX2Nsb25lZF9vZiA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICBmbiA9IGZuLnByb3RvdHlwZS5fX19jbG9uZWRfb2Y7XHJcblxyXG4gICAgdGVtcCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpOyB9O1xyXG5cclxuICAgIC8vIFNhdmUgbWFyayBhcyBjbG9uZWQuIERvbmUgaW4gaXRzIHByb3RvdHlwZVxyXG4gICAgLy8gdG8gbm90IGFwcGVhciBpbiB0aGUgbGlzdCBvZiAnb3duZWQnIHByb3BlcnRpZXMuXHJcbiAgICB0ZW1wUHJvdG8uX19fY2xvbmVkX29mID0gZm47XHJcbiAgICAvLyBSZXBsYWNlIHRvU3RyaW5nIHRvIHJldHVybiB0aGUgb3JpZ2luYWwgc291cmNlOlxyXG4gICAgdGVtcFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gZm4udG9TdHJpbmcoKTtcclxuICAgIH07XHJcbiAgICAvLyBUaGUgbmFtZSBjYW5ub3QgYmUgc2V0LCB3aWxsIGp1c3QgYmUgYW5vbnltb3VzXHJcbiAgICAvL3RlbXAubmFtZSA9IHRoYXQubmFtZTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gVGhpcyB3YXkgb24gY2FwYWJsZSBicm93c2VycyBwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgbmFtZSxcclxuICAgIC8vIGRvIGEgcmVhbCBpbmRlcGVuZGVudCBjb3B5IGFuZCBhdm9pZCBmdW5jdGlvbiBzdWJjYWxscyB0aGF0XHJcbiAgICAvLyBjYW4gZGVncmF0ZSBwZXJmb3JtYW5jZSBhZnRlciBsb3Qgb2YgJ2Nsb25uaW5nJy5cclxuICAgIHZhciBmID0gRnVuY3Rpb247XHJcbiAgICB0ZW1wID0gKG5ldyBmKCdyZXR1cm4gJyArIGNvbnRlbnRzKSkoKTtcclxuICB9XHJcblxyXG4gIHRlbXAucHJvdG90eXBlID0gdGVtcFByb3RvO1xyXG4gIC8vIENvcHkgYW55IHByb3BlcnRpZXMgaXQgb3duc1xyXG4gIGV4dGVuZCh0ZW1wLCBmbik7XHJcblxyXG4gIHJldHVybiB0ZW1wO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbG9uZVBsdWdJbigpIHtcclxuICBpZiAodHlwZW9mIEZ1bmN0aW9uLnByb3RvdHlwZS5jbG9uZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgRnVuY3Rpb24ucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUoKSB7IHJldHVybiBjbG9uZUZ1bmN0aW9uKHRoaXMpOyB9O1xyXG4gIH1cclxuICBpZiAodHlwZW9mIE9iamVjdC5wcm90b3R5cGUuY2xvbmUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgIE9qYmVjdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSgpIHsgcmV0dXJuIGNsb25lT2JqZWN0KHRoaXMpOyB9O1xyXG4gIH1cclxufVxyXG5cclxuZXh0ZW5kLmNsb25lT2JqZWN0ID0gY2xvbmVPYmplY3Q7XHJcbmV4dGVuZC5jbG9uZUZ1bmN0aW9uID0gY2xvbmVGdW5jdGlvbjtcclxuZXh0ZW5kLmNsb25lUGx1Z0luID0gY2xvbmVQbHVnSW47XHJcbiIsIu+7vy8qKlxyXG4qIENvb2tpZXMgbWFuYWdlbWVudC5cclxuKiBNb3N0IGNvZGUgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80ODI1Njk1LzE2MjIzNDZcclxuKi9cclxudmFyIENvb2tpZSA9IHt9O1xyXG5cclxuQ29va2llLnNldCA9IGZ1bmN0aW9uIHNldENvb2tpZShuYW1lLCB2YWx1ZSwgZGF5cykge1xyXG4gICAgdmFyIGV4cGlyZXMgPSBcIlwiO1xyXG4gICAgaWYgKGRheXMpIHtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgKGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKSk7XHJcbiAgICAgICAgZXhwaXJlcyA9IFwiOyBleHBpcmVzPVwiICsgZGF0ZS50b0dNVFN0cmluZygpO1xyXG4gICAgfVxyXG4gICAgZG9jdW1lbnQuY29va2llID0gbmFtZSArIFwiPVwiICsgdmFsdWUgKyBleHBpcmVzICsgXCI7IHBhdGg9L1wiO1xyXG59O1xyXG5Db29raWUuZ2V0ID0gZnVuY3Rpb24gZ2V0Q29va2llKGNfbmFtZSkge1xyXG4gICAgaWYgKGRvY3VtZW50LmNvb2tpZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY19zdGFydCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKGNfbmFtZSArIFwiPVwiKTtcclxuICAgICAgICBpZiAoY19zdGFydCAhPSAtMSkge1xyXG4gICAgICAgICAgICBjX3N0YXJ0ID0gY19zdGFydCArIGNfbmFtZS5sZW5ndGggKyAxO1xyXG4gICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKFwiO1wiLCBjX3N0YXJ0KTtcclxuICAgICAgICAgICAgaWYgKGNfZW5kID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHVuZXNjYXBlKGRvY3VtZW50LmNvb2tpZS5zdWJzdHJpbmcoY19zdGFydCwgY19lbmQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gXCJcIjtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gQ29va2llOyIsIu+7vy8qKiBDb25uZWN0IGFjY291bnQgd2l0aCBGYWNlYm9va1xyXG4qKi9cclxudmFyXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyksXHJcbiAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5mdW5jdGlvbiBGYWNlYm9va0Nvbm5lY3Qob3B0aW9ucykge1xyXG4gICQuZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIGlmICghJCgnI2ZiLXJvb3QnKS5sZW5ndGgpXHJcbiAgICAkKCc8ZGl2IGlkPVwiZmItcm9vdFwiIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiPjwvZGl2PicpLmFwcGVuZFRvKCdib2R5Jyk7XHJcbn1cclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUgPSB7XHJcbiAgYXBwSWQ6IG51bGwsXHJcbiAgbGFuZzogJ2VuX1VTJyxcclxuICByZXN1bHRUeXBlOiAnanNvbicsIC8vICdyZWRpcmVjdCdcclxuICBmYlVybEJhc2U6ICcvL2Nvbm5lY3QuZmFjZWJvb2submV0L0AobGFuZykvYWxsLmpzJyxcclxuICBzZXJ2ZXJVcmxCYXNlOiBMY1VybC5MYW5nUGF0aCArICdBY2NvdW50L0ZhY2Vib29rL0AodXJsU2VjdGlvbikvP1JlZGlyZWN0PUAocmVkaXJlY3RVcmwpJnByb2ZpbGU9QChwcm9maWxlVXJsKScsXHJcbiAgcmVkaXJlY3RVcmw6ICcnLFxyXG4gIHByb2ZpbGVVcmw6ICcnLFxyXG4gIHVybFNlY3Rpb246ICcnLFxyXG4gIGxvYWRpbmdUZXh0OiAnVmVyaWZpbmcnLFxyXG4gIHBlcm1pc3Npb25zOiAnJyxcclxuICBsaWJMb2FkZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdExpYkxvYWRlZCcsXHJcbiAgY29ubmVjdGVkRXZlbnQ6ICdGYWNlYm9va0Nvbm5lY3RDb25uZWN0ZWQnXHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldEZiVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZmJVcmxCYXNlLnJlcGxhY2UoL0BcXChsYW5nXFwpL2csIHRoaXMubGFuZyk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldFNlcnZlclVybCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnNlcnZlclVybEJhc2VcclxuICAucmVwbGFjZSgvQFxcKHJlZGlyZWN0VXJsXFwpL2csIHRoaXMucmVkaXJlY3RVcmwpXHJcbiAgLnJlcGxhY2UoL0BcXChwcm9maWxlVXJsXFwpL2csIHRoaXMucHJvZmlsZVVybClcclxuICAucmVwbGFjZSgvQFxcKHVybFNlY3Rpb25cXCkvZywgdGhpcy51cmxTZWN0aW9uKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUubG9hZExpYiA9IGZ1bmN0aW9uICgpIHtcclxuICAvLyBPbmx5IGlmIGlzIG5vdCBsb2FkZWQgc3RpbGxcclxuICAvLyAoRmFjZWJvb2sgc2NyaXB0IGF0dGFjaCBpdHNlbGYgYXMgdGhlIGdsb2JhbCB2YXJpYWJsZSAnRkInKVxyXG4gIGlmICghd2luZG93LkZCICYmICF0aGlzLl9sb2FkaW5nTGliKSB7XHJcbiAgICB0aGlzLl9sb2FkaW5nTGliID0gdHJ1ZTtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgc2NyaXB0czogW3RoaXMuZ2V0RmJVcmwoKV0sXHJcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgRkIuaW5pdCh7IGFwcElkOiB0aGF0LmFwcElkLCBzdGF0dXM6IHRydWUsIGNvb2tpZTogdHJ1ZSwgeGZibWw6IHRydWUgfSk7XHJcbiAgICAgICAgdGhhdC5sb2FkaW5nTGliID0gZmFsc2U7XHJcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcih0aGF0LmxpYkxvYWRlZEV2ZW50KTtcclxuICAgICAgfSxcclxuICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuRkI7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUucHJvY2Vzc1Jlc3BvbnNlID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgaWYgKHJlc3BvbnNlLmF1dGhSZXNwb25zZSkge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBXZWxjb21lIScpO1xyXG4gICAgdmFyIHVybCA9IHRoaXMuZ2V0U2VydmVyVXJsKCk7XHJcbiAgICBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwicmVkaXJlY3RcIikge1xyXG4gICAgICByZWRpcmVjdFRvKHVybCk7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMucmVzdWx0VHlwZSA9PSBcImpzb25cIikge1xyXG4gICAgICBwb3B1cCh1cmwsICdzbWFsbCcsIG51bGwsIHRoaXMubG9hZGluZ1RleHQpO1xyXG4gICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoaXMuY29ubmVjdGVkRXZlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qRkIuYXBpKCcvbWUnLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgIGNvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IEdvb2QgdG8gc2VlIHlvdSwgJyArIHJlc3BvbnNlLm5hbWUgKyAnLicpO1xyXG4gICAgfSk7Ki9cclxuICB9IGVsc2Uge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBVc2VyIGNhbmNlbGxlZCBsb2dpbiBvciBkaWQgbm90IGZ1bGx5IGF1dGhvcml6ZS4nKTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLm9uTGliUmVhZHkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICBpZiAod2luZG93LkZCKVxyXG4gICAgY2FsbGJhY2soKTtcclxuICBlbHNlIHtcclxuICAgIHRoaXMubG9hZExpYigpO1xyXG4gICAgJChkb2N1bWVudCkub24odGhpcy5saWJMb2FkZWRFdmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5vbkxpYlJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgIEZCLmxvZ2luKCQucHJveHkodGhhdC5wcm9jZXNzUmVzcG9uc2UsIHRoYXQpLCB7IHNjb3BlOiB0aGF0LnBlcm1pc3Npb25zIH0pO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5hdXRvQ29ubmVjdE9uID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgalF1ZXJ5KGRvY3VtZW50KS5vbignY2xpY2snLCBzZWxlY3RvciB8fCAnYS5mYWNlYm9vay1jb25uZWN0JywgJC5wcm94eSh0aGlzLmNvbm5lY3QsIHRoaXMpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmFjZWJvb2tDb25uZWN0OyIsIu+7vy8qKiBJbXBsZW1lbnRzIGEgc2ltaWxhciBMY1VybCBvYmplY3QgbGlrZSB0aGUgc2VydmVyLXNpZGUgb25lLCBiYXNpbmdcclxuICAgIGluIHRoZSBpbmZvcm1hdGlvbiBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgYXQgJ2h0bWwnIHRhZyBpbiB0aGUgXHJcbiAgICAnZGF0YS1iYXNlLXVybCcgYXR0cmlidXRlICh0aGF0cyB2YWx1ZSBpcyB0aGUgZXF1aXZhbGVudCBmb3IgQXBwUGF0aCksXHJcbiAgICBhbmQgdGhlIGxhbmcgaW5mb3JtYXRpb24gYXQgJ2RhdGEtY3VsdHVyZScuXHJcbiAgICBUaGUgcmVzdCBvZiBVUkxzIGFyZSBidWlsdCBmb2xsb3dpbmcgdGhlIHdpbmRvdy5sb2NhdGlvbiBhbmQgc2FtZSBydWxlc1xyXG4gICAgdGhhbiBpbiB0aGUgc2VydmVyLXNpZGUgb2JqZWN0LlxyXG4qKi9cclxuXHJcbnZhciBiYXNlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1iYXNlLXVybCcpLFxyXG4gICAgbGFuZyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpLFxyXG4gICAgbCA9IHdpbmRvdy5sb2NhdGlvbixcclxuICAgIHVybCA9IGwucHJvdG9jb2wgKyAnLy8nICsgbC5ob3N0O1xyXG4vLyBsb2NhdGlvbi5ob3N0IGluY2x1ZGVzIHBvcnQsIGlmIGlzIG5vdCB0aGUgZGVmYXVsdCwgdnMgbG9jYXRpb24uaG9zdG5hbWVcclxuXHJcbmJhc2UgPSBiYXNlIHx8ICcvJztcclxuXHJcbnZhciBMY1VybCA9IHtcclxuICAgIFNpdGVVcmw6IHVybCxcclxuICAgIEFwcFBhdGg6IGJhc2UsXHJcbiAgICBBcHBVcmw6IHVybCArIGJhc2UsXHJcbiAgICBMYW5nSWQ6IGxhbmcsXHJcbiAgICBMYW5nUGF0aDogYmFzZSArIGxhbmcgKyAnLycsXHJcbiAgICBMYW5nVXJsOiB1cmwgKyBiYXNlICsgbGFuZ1xyXG59O1xyXG5MY1VybC5MYW5nVXJsID0gdXJsICsgTGNVcmwuTGFuZ1BhdGg7XHJcbkxjVXJsLkpzb25QYXRoID0gTGNVcmwuTGFuZ1BhdGggKyAnSlNPTi8nO1xyXG5MY1VybC5Kc29uVXJsID0gdXJsICsgTGNVcmwuSnNvblBhdGg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjVXJsOyIsIu+7vy8qIExvY29ub21pY3Mgc3BlY2lmaWMgUHJpY2UsIGZlZXMgYW5kIGhvdXItcHJpY2UgY2FsY3VsYXRpb25cclxuICAgIHVzaW5nIHNvbWUgc3RhdGljIG1ldGhvZHMgYW5kIHRoZSBQcmljZSBjbGFzcy5cclxuKi9cclxudmFyIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbi8qIENsYXNzIFByaWNlIHRvIGNhbGN1bGF0ZSBhIHRvdGFsIHByaWNlIGJhc2VkIG9uIGZlZXMgaW5mb3JtYXRpb24gKGZpeGVkIGFuZCByYXRlKVxyXG4gICAgYW5kIGRlc2lyZWQgZGVjaW1hbHMgZm9yIGFwcHJveGltYXRpb25zLlxyXG4qL1xyXG5mdW5jdGlvbiBQcmljZShiYXNlUHJpY2UsIGZlZSwgcm91bmRlZERlY2ltYWxzKSB7XHJcbiAgICAvLyBmZWUgcGFyYW1ldGVyIGNhbiBiZSBhIGZsb2F0IG51bWJlciB3aXRoIHRoZSBmZWVSYXRlIG9yIGFuIG9iamVjdFxyXG4gICAgLy8gdGhhdCBpbmNsdWRlcyBib3RoIGEgZmVlUmF0ZSBhbmQgYSBmaXhlZEZlZUFtb3VudFxyXG4gICAgLy8gRXh0cmFjdGluZyBmZWUgdmFsdWVzIGludG8gbG9jYWwgdmFyczpcclxuICAgIHZhciBmZWVSYXRlID0gMCwgZml4ZWRGZWVBbW91bnQgPSAwO1xyXG4gICAgaWYgKGZlZS5maXhlZEZlZUFtb3VudCB8fCBmZWUuZmVlUmF0ZSkge1xyXG4gICAgICAgIGZpeGVkRmVlQW1vdW50ID0gZmVlLmZpeGVkRmVlQW1vdW50IHx8IDA7XHJcbiAgICAgICAgZmVlUmF0ZSA9IGZlZS5mZWVSYXRlIHx8IDA7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBmZWVSYXRlID0gZmVlO1xyXG5cclxuICAgIC8vIENhbGN1bGF0aW5nOlxyXG4gICAgLy8gVGhlIHJvdW5kVG8gd2l0aCBhIGJpZyBmaXhlZCBkZWNpbWFscyBpcyB0byBhdm9pZCB0aGVcclxuICAgIC8vIGRlY2ltYWwgZXJyb3Igb2YgZmxvYXRpbmcgcG9pbnQgbnVtYmVyc1xyXG4gICAgdmFyIHRvdGFsUHJpY2UgPSBtdS5jZWlsVG8obXUucm91bmRUbyhiYXNlUHJpY2UgKiAoMSArIGZlZVJhdGUpICsgZml4ZWRGZWVBbW91bnQsIDEyKSwgcm91bmRlZERlY2ltYWxzKTtcclxuICAgIC8vIGZpbmFsIGZlZSBwcmljZSBpcyBjYWxjdWxhdGVkIGFzIGEgc3Vic3RyYWN0aW9uLCBidXQgYmVjYXVzZSBqYXZhc2NyaXB0IGhhbmRsZXNcclxuICAgIC8vIGZsb2F0IG51bWJlcnMgb25seSwgYSByb3VuZCBvcGVyYXRpb24gaXMgcmVxdWlyZWQgdG8gYXZvaWQgYW4gaXJyYXRpb25hbCBudW1iZXJcclxuICAgIHZhciBmZWVQcmljZSA9IG11LnJvdW5kVG8odG90YWxQcmljZSAtIGJhc2VQcmljZSwgMik7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgb2JqZWN0IHdpdGggZnVsbCBkZXRhaWxzOlxyXG4gICAgdGhpcy5iYXNlUHJpY2UgPSBiYXNlUHJpY2U7XHJcbiAgICB0aGlzLmZlZVJhdGUgPSBmZWVSYXRlO1xyXG4gICAgdGhpcy5maXhlZEZlZUFtb3VudCA9IGZpeGVkRmVlQW1vdW50O1xyXG4gICAgdGhpcy5yb3VuZGVkRGVjaW1hbHMgPSByb3VuZGVkRGVjaW1hbHM7XHJcbiAgICB0aGlzLnRvdGFsUHJpY2UgPSB0b3RhbFByaWNlO1xyXG4gICAgdGhpcy5mZWVQcmljZSA9IGZlZVByaWNlO1xyXG59XHJcblxyXG4vKiogQ2FsY3VsYXRlIGFuZCByZXR1cm5zIHRoZSBwcmljZSBhbmQgcmVsZXZhbnQgZGF0YSBhcyBhbiBvYmplY3QgZm9yXHJcbnRpbWUsIGhvdXJseVJhdGUgKHdpdGggZmVlcykgYW5kIHRoZSBob3VybHlGZWUuXHJcblRoZSB0aW1lIChAZHVyYXRpb24pIGlzIHVzZWQgJ2FzIGlzJywgd2l0aG91dCB0cmFuc2Zvcm1hdGlvbiwgbWF5YmUgeW91IGNhbiByZXF1aXJlXHJcbnVzZSBMQy5yb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyIGJlZm9yZSBwYXNzIHRoZSBkdXJhdGlvbiB0byB0aGlzIGZ1bmN0aW9uLlxyXG5JdCByZWNlaXZlcyB0aGUgcGFyYW1ldGVycyBAaG91cmx5UHJpY2UgYW5kIEBzdXJjaGFyZ2VQcmljZSBhcyBMQy5QcmljZSBvYmplY3RzLlxyXG5Ac3VyY2hhcmdlUHJpY2UgaXMgb3B0aW9uYWwuXHJcbioqL1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVIb3VybHlQcmljZShkdXJhdGlvbiwgaG91cmx5UHJpY2UsIHN1cmNoYXJnZVByaWNlKSB7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBzdXJjaGFyZ2UsIGdldCB6ZXJvc1xyXG4gICAgc3VyY2hhcmdlUHJpY2UgPSBzdXJjaGFyZ2VQcmljZSB8fCB7IHRvdGFsUHJpY2U6IDAsIGZlZVByaWNlOiAwLCBiYXNlUHJpY2U6IDAgfTtcclxuICAgIC8vIEdldCBob3VycyBmcm9tIHJvdW5kZWQgZHVyYXRpb246XHJcbiAgICB2YXIgaG91cnMgPSBtdS5yb3VuZFRvKGR1cmF0aW9uLnRvdGFsSG91cnMoKSwgMik7XHJcbiAgICAvLyBDYWxjdWxhdGUgZmluYWwgcHJpY2VzXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvdGFsUHJpY2U6ICAgICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLnRvdGFsUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLnRvdGFsUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgZmVlUHJpY2U6ICAgICAgIG11LnJvdW5kVG8oaG91cmx5UHJpY2UuZmVlUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLmZlZVByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6ICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLmJhc2VQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UuYmFzZVByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIGR1cmF0aW9uSG91cnM6ICBob3Vyc1xyXG4gICAgfTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgUHJpY2U6IFByaWNlLFxyXG4gICAgICAgIGNhbGN1bGF0ZUhvdXJseVByaWNlOiBjYWxjdWxhdGVIb3VybHlQcmljZVxyXG4gICAgfTsiLCLvu78vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI1OTM2MzcvaG93LXRvLWVzY2FwZS1yZWd1bGFyLWV4cHJlc3Npb24taW4tamF2YXNjcmlwdFxyXG5SZWdFeHAucXVvdGUgPSBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgcmV0dXJuIChzdHIgKyAnJykucmVwbGFjZSgvKFsuPyorXiRbXFxdXFxcXCgpe318LV0pL2csIFwiXFxcXCQxXCIpO1xyXG59O1xyXG4iLCLvu78vKipcclxuICBBIHZlcnkgc2ltcGxlIHNsaWRlciBpbXBsZW1lbnRhdGlvbiBpbml0aWFsbHkgY3JlYXRlZFxyXG4gIGZvciB0aGUgcHJvdmlkZXItd2VsY29tZSBsYW5kaW5nIHBhZ2UgYW5kXHJcbiAgb3RoZXIgc2ltaWxhciB1c2VzLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9SZWdFeHAucXVvdGUnKTtcclxuXHJcbnZhciBTaW1wbGVTbGlkZXIgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFNpbXBsZVNsaWRlcihvcHRzKSB7XHJcbiAgJC5leHRlbmQodHJ1ZSwgdGhpcywgb3B0cyk7XHJcblxyXG4gIHRoaXMuZWxlbWVudCA9ICQodGhpcy5lbGVtZW50KTtcclxuICB0aGlzLmN1cnJlbnRJbmRleCA9IDA7XHJcblxyXG4gIC8qKlxyXG4gIEFjdGlvbnMgaGFuZGxlciB0byBtb3ZlIHNsaWRlc1xyXG4gICoqL1xyXG4gIHZhciBjaGVja0hyZWYgPSBuZXcgUmVnRXhwKCdeIycgKyBSZWdFeHAucXVvdGUodGhpcy5ocmVmUHJlZml4KSArICcoLiopJyksXHJcbiAgICB0aGF0ID0gdGhpcztcclxuICB0aGlzLmVsZW1lbnQub24oJ2NsaWNrJywgJ2EnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgaHJlZiA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJyk7XHJcbiAgICB2YXIgcmVzID0gY2hlY2tIcmVmLmV4ZWMoaHJlZik7XHJcblxyXG4gICAgaWYgKHJlcyAmJiByZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICB2YXIgaW5kZXggPSByZXNbMV07XHJcbiAgICAgIGlmIChpbmRleCA9PSAncHJldmlvdXMnKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHRoYXQuY3VycmVudEluZGV4IC0gMSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoaW5kZXggPT0gJ25leHQnKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHRoYXQuY3VycmVudEluZGV4ICsgMSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoL1xcZCsvLnRlc3QoaW5kZXgpKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHBhcnNlSW50KGluZGV4KSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBEbyBhbGwgdGhlIHNldHVwIG9uIHNsaWRlciBhbmQgc2xpZGVzXHJcbiAgdG8gZW5zdXJlIHRoZSBtb3ZlbWVudCB3aWxsIHdvcmsgZmluZS5cclxuICBJdHMgZG9uZSBhdXRvbWF0aWMgb25cclxuICBpbml0aWFsaXppbmcsIGlzIGp1c3QgYSBwdWJsaWMgbWV0aG9kIGZvciBcclxuICBjb252ZW5pZW5jZSAobWF5YmUgdG8gYmUgY2FsbCBpZiBzbGlkZXMgYXJlXHJcbiAgYWRkZWQvcmVtb3ZlZCBhZnRlciBpbml0KS5cclxuICAqKi9cclxuICB0aGlzLnJlZHJhdyA9IGZ1bmN0aW9uIHNsaWRlc1JlcG9zaXRpb24oKSB7XHJcbiAgICB2YXIgc2xpZGVzID0gdGhpcy5nZXRTbGlkZXMoKSxcclxuICAgICAgYyA9IHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyKCk7XHJcbiAgICAvLyBMb29rIGZvciB0aGUgY29udGFpbmVyIHNpemUsIGZyb20gdGhlIFxyXG4gICAgLy8gYmlnZ2VyIHNsaWRlOlxyXG4gICAgdmFyIFxyXG4gICAgICB3ID0gMCxcclxuICAgICAgaCA9IDA7XHJcbiAgICBzbGlkZXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBcclxuICAgICAgICB0ID0gJCh0aGlzKSxcclxuICAgICAgICB0dyA9IHQub3V0ZXJXaWR0aCgpLFxyXG4gICAgICAgIHRoID0gdC5vdXRlckhlaWdodCgpO1xyXG4gICAgICBpZiAodHcgPiB3KVxyXG4gICAgICAgIHcgPSB0dztcclxuICAgICAgaWYgKHRoID4gaClcclxuICAgICAgICBoID0gdGg7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDU1Mgc2V0dXAsIFxyXG4gICAgLy8gYWxsIHNsaWRlcyBpbiB0aGUgc2FtZSBsaW5lLFxyXG4gICAgLy8gYWxsIHdpdGggc2FtZSBzaXplIChleHRyYSBzcGFjaW5nIGNhblxyXG4gICAgLy8gYmUgZ2l2ZW4gd2l0aCBDU1MpXHJcbiAgICBjLmNzcyh7XHJcbiAgICAgIHdpZHRoOiB3IC0gKGMub3V0ZXJXaWR0aCgpIC0gYy53aWR0aCgpKSxcclxuICAgICAgLy9oZWlnaHQ6IGggLSAoYy5vdXRlckhlaWdodCgpIC0gYy5oZWlnaHQoKSksXHJcbiAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxyXG4gICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXHJcbiAgICAgIHdoaXRlU3BhY2U6ICdub3dyYXAnXHJcbiAgICB9KTtcclxuXHJcbiAgICBzbGlkZXMuY3NzKHtcclxuICAgICAgd2hpdGVTcGFjZTogJ25vcm1hbCcsXHJcbiAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXHJcbiAgICB9KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICB0LmNzcyh7XHJcbiAgICAgICAgd2lkdGg6IHcgLSAodC5vdXRlcldpZHRoKCkgLSB0LndpZHRoKCkpXHJcbiAgICAgICAgLy8saGVpZ2h0OiBoIC0gKHQub3V0ZXJIZWlnaHQoKSAtIHQuaGVpZ2h0KCkpXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVwb3NpdGlvbmF0ZSBhdCB0aGUgYmVnZ2luaW5nOlxyXG4gICAgY1swXS5zY3JvbGxMZWZ0ID0gMDtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHbyB0byBhIHNsaWRlIGJ5IGluZGV4XHJcbiAgKiovXHJcbiAgdGhpcy5nb1NsaWRlID0gZnVuY3Rpb24gZ29TbGlkZShpbmRleCkge1xyXG4gICAgdmFyIHByZXYgPSB0aGlzLmN1cnJlbnRJbmRleDtcclxuICAgIGlmIChwcmV2ID09IGluZGV4KVxyXG4gICAgICByZXR1cm47XHJcblxyXG4gICAgLy8gQ2hlY2sgYm91bmRzXHJcbiAgICBpZiAoaW5kZXggPCAxKVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB2YXIgc2xpZGVzID0gdGhpcy5nZXRTbGlkZXMoKTtcclxuICAgIGlmIChpbmRleCA+IHNsaWRlcy5sZW5ndGgpXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAvLyBHb29kIGluZGV4LCBzZXQgYXMgY3VycmVudFxyXG4gICAgdGhpcy5jdXJyZW50SW5kZXggPSBpbmRleDtcclxuICAgIC8vIFNldCBsaW5rcyB0byB0aGlzIGFzIGN1cnJlbnQsIHJlbW92aW5nIGFueSBwcmV2aW91czpcclxuICAgIHRoaXMuZWxlbWVudC5maW5kKCdbaHJlZj0jJyArIHRoaXMuaHJlZlByZWZpeCArIGluZGV4ICsgJ10nKVxyXG4gICAgLmFkZENsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpXHJcbiAgICAucGFyZW50KCdsaScpLmFkZENsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpO1xyXG4gICAgdGhpcy5lbGVtZW50LmZpbmQoJ1tocmVmPSMnICsgdGhpcy5ocmVmUHJlZml4ICsgcHJldiArICddJylcclxuICAgIC5yZW1vdmVDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKVxyXG4gICAgLnBhcmVudCgnbGknKS5yZW1vdmVDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKTtcclxuXHJcbiAgICB2YXIgXHJcbiAgICAgIHNsaWRlID0gJChzbGlkZXMuZ2V0KGluZGV4IC0gMSkpLFxyXG4gICAgICBjID0gdGhpcy5nZXRTbGlkZXNDb250YWluZXIoKSxcclxuICAgICAgbGVmdCA9IGMuc2Nyb2xsTGVmdCgpICsgc2xpZGUucG9zaXRpb24oKS5sZWZ0O1xyXG5cclxuICAgIGMuc3RvcCgpLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiBsZWZ0IH0sIHRoaXMuZHVyYXRpb24pO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICBNZXRob2Q6IEdldCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gb2Ygc2xpZGVzXHJcbiAgKiovXHJcbiAgdGhpcy5nZXRTbGlkZXMgPSBmdW5jdGlvbiBnZXRTbGlkZXMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50XHJcbiAgICAuZmluZCh0aGlzLnNlbGVjdG9ycy5zbGlkZXMpXHJcbiAgICAuZmluZCh0aGlzLnNlbGVjdG9ycy5zbGlkZSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHZXQgdGhlIGpRdWVyeSBlbGVtZW50IGZvciB0aGUgY29udGFpbmVyIG9mIHNsaWRlc1xyXG4gICoqL1xyXG4gIHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyID0gZnVuY3Rpb24gZ2V0U2xpZGVzQ29udGFpbmVyKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGVzKTtcclxuICB9O1xyXG5cclxuICAvKiogTGFzdCBpbml0IHN0ZXBzXHJcbiAgKiovXHJcbiAgdGhpcy5yZWRyYXcoKTtcclxufTtcclxuXHJcblNpbXBsZVNsaWRlci5wcm90b3R5cGUgPSB7XHJcbiAgZWxlbWVudDogbnVsbCxcclxuICBzZWxlY3RvcnM6IHtcclxuICAgIHNsaWRlczogJy5zbGlkZXMnLFxyXG4gICAgc2xpZGU6ICdsaS5zbGlkZSdcclxuICB9LFxyXG4gIGN1cnJlbnRTbGlkZUNsYXNzOiAnanMtaXNDdXJyZW50JyxcclxuICBocmVmUHJlZml4OiAnZ29TbGlkZV8nLFxyXG4gIC8vIER1cmF0aW9uIG9mIGVhY2ggc2xpZGUgaW4gbWlsbGlzZWNvbmRzXHJcbiAgZHVyYXRpb246IDEwMDBcclxufTsiLCLvu78vKiogUG9seWZpbGwgZm9yIHN0cmluZy5jb250YWluc1xyXG4qKi9cclxuaWYgKCEoJ2NvbnRhaW5zJyBpbiBTdHJpbmcucHJvdG90eXBlKSlcclxuICAgIFN0cmluZy5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoc3RyLCBzdGFydEluZGV4KSB7IHJldHVybiAtMSAhPT0gdGhpcy5pbmRleE9mKHN0ciwgc3RhcnRJbmRleCk7IH07Iiwi77u/LyoqID09PT09PT09PT09PT09PT09PT09PT1cclxuICogQSBzaW1wbGUgU3RyaW5nIEZvcm1hdFxyXG4gKiBmdW5jdGlvbiBmb3IgamF2YXNjcmlwdFxyXG4gKiBBdXRob3I6IElhZ28gTG9yZW56byBTYWxndWVpcm9cclxuICogTW9kdWxlOiBDb21tb25KU1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzdHJpbmdGb3JtYXQoKSB7XHJcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcblx0dmFyIGZvcm1hdHRlZCA9IGFyZ3NbMF07XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXFxcXHsnK2krJ1xcXFx9JywgJ2dpJyk7XHJcblx0XHRmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZShyZWdleHAsIGFyZ3NbaSsxXSk7XHJcblx0fVxyXG5cdHJldHVybiBmb3JtYXR0ZWQ7XHJcbn07Iiwi77u/LyoqXHJcbiAgICBHZW5lcmFsIGF1dG8tbG9hZCBzdXBwb3J0IGZvciB0YWJzOiBcclxuICAgIElmIHRoZXJlIGlzIG5vIGNvbnRlbnQgd2hlbiBmb2N1c2VkLCB0aGV5IHVzZSB0aGUgJ3JlbG9hZCcganF1ZXJ5IHBsdWdpblxyXG4gICAgdG8gbG9hZCBpdHMgY29udGVudCAtdGFicyBuZWVkIHRvIGJlIGNvbmZpZ3VyZWQgd2l0aCBkYXRhLXNvdXJjZS11cmwgYXR0cmlidXRlXHJcbiAgICBpbiBvcmRlciB0byBrbm93IHdoZXJlIHRvIGZldGNoIHRoZSBjb250ZW50LS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuLy8gRGVwZW5kZW5jeSBUYWJiZWRVWCBmcm9tIERJXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChUYWJiZWRVWCkge1xyXG4gICAgLy8gVGFiYmVkVVguc2V0dXAudGFiQm9keVNlbGVjdG9yIHx8ICcudGFiLWJvZHknXHJcbiAgICAkKCcudGFiLWJvZHknKS5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgJHQucmVsb2FkKCk7XHJcbiAgICB9KTtcclxufTsiLCLvu78vKipcclxuICAgIFRoaXMgYWRkcyBub3RpZmljYXRpb25zIHRvIHRhYnMgZnJvbSB0aGUgVGFiYmVkVVggc3lzdGVtIHVzaW5nXHJcbiAgICB0aGUgY2hhbmdlc05vdGlmaWNhdGlvbiB1dGlsaXR5IHRoYXQgZGV0ZWN0cyBub3Qgc2F2ZWQgY2hhbmdlcyBvbiBmb3JtcyxcclxuICAgIHNob3dpbmcgd2FybmluZyBtZXNzYWdlcyB0byB0aGVcclxuICAgIHVzZXIgYW5kIG1hcmtpbmcgdGFicyAoYW5kIHN1Yi10YWJzIC8gcGFyZW50LXRhYnMgcHJvcGVybHkpIHRvXHJcbiAgICBkb24ndCBsb3N0IGNoYW5nZXMgbWFkZS5cclxuICAgIEEgYml0IG9mIENTUyBmb3IgdGhlIGFzc2lnbmVkIGNsYXNzZXMgd2lsbCBhbGxvdyBmb3IgdmlzdWFsIG1hcmtzLlxyXG5cclxuICAgIEFLQTogRG9uJ3QgbG9zdCBkYXRhISB3YXJuaW5nIG1lc3NhZ2UgOy0pXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcblxyXG4vLyBUYWJiZWRVWCBkZXBlbmRlbmN5IGFzIERJXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChUYWJiZWRVWCwgdGFyZ2V0U2VsZWN0b3IpIHtcclxuICAgIHZhciB0YXJnZXQgPSAkKHRhcmdldFNlbGVjdG9yIHx8ICcuY2hhbmdlcy1ub3RpZmljYXRpb24tZW5hYmxlZCcpO1xyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbi5pbml0KHsgdGFyZ2V0OiB0YXJnZXQgfSk7XHJcblxyXG4gICAgLy8gQWRkaW5nIGNoYW5nZSBub3RpZmljYXRpb24gdG8gdGFiLWJvZHkgZGl2c1xyXG4gICAgLy8gKG91dHNpZGUgdGhlIExDLkNoYW5nZXNOb3RpZmljYXRpb24gY2xhc3MgdG8gbGVhdmUgaXQgYXMgZ2VuZXJpYyBhbmQgc2ltcGxlIGFzIHBvc3NpYmxlKVxyXG4gICAgJCh0YXJnZXQpLm9uKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgJ2Zvcm0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcudGFiLWJvZHknKS5hZGRDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGRpbmcgY2xhc3MgdG8gdGhlIG1lbnUgaXRlbSAodGFiIHRpdGxlKVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5hZGRDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgJCgnI2xjcmVzLWNoYW5nZXMtbm90LXNhdmVkJykudGV4dCgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsICdmb3JtJywgZnVuY3Rpb24gKGUsIGYsIGVscywgZnVsbCkge1xyXG4gICAgICAgIGlmIChmdWxsKVxyXG4gICAgICAgICAgICAkKHRoaXMpLnBhcmVudHMoJy50YWItYm9keTpub3QoOmhhcyhmb3JtLmhhcy1jaGFuZ2VzKSknKS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmluZyBjbGFzcyBmcm9tIHRoZSBtZW51IGl0ZW0gKHRhYiB0aXRsZSlcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cigndGl0bGUnLCBudWxsKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLy8gVG8gYXZvaWQgdXNlciBiZSBub3RpZmllZCBvZiBjaGFuZ2VzIGFsbCB0aW1lIHdpdGggdGFiIG1hcmtzLCB3ZSBhZGRlZCBhICdub3RpZnknIGNsYXNzXHJcbiAgICAvLyBvbiB0YWJzIHdoZW4gYSBjaGFuZ2Ugb2YgdGFiIGhhcHBlbnNcclxuICAgIC5maW5kKCcudGFiLWJvZHknKS5vbigndGFiVW5mb2N1c2VkJywgZnVuY3Rpb24gKGV2ZW50LCBmb2N1c2VkQ3R4KSB7XHJcbiAgICAgICAgdmFyIG1pID0gVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbTtcclxuICAgICAgICBpZiAobWkuaXMoJy5oYXMtY2hhbmdlcycpKSB7XHJcbiAgICAgICAgICAgIG1pLmFkZENsYXNzKCdub3RpZnktY2hhbmdlcycpOyAvL2hhcy10b29sdGlwXHJcbiAgICAgICAgICAgIC8vIFNob3cgbm90aWZpY2F0aW9uIHBvcHVwXHJcbiAgICAgICAgICAgIHZhciBkID0gJCgnPGRpdiBjbGFzcz1cIndhcm5pbmdcIj5AMDwvZGl2PjxkaXYgY2xhc3M9XCJhY3Rpb25zXCI+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImFjdGlvbiBjb250aW51ZVwiIHZhbHVlPVwiQDJcIi8+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImFjdGlvbiBzdG9wXCIgdmFsdWU9XCJAMVwiLz48L2Rpdj4nXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDAvZywgTEMuZ2V0VGV4dCgnY2hhbmdlcy1ub3Qtc2F2ZWQnKSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMS9nLCBMQy5nZXRUZXh0KCd0YWItaGFzLWNoYW5nZXMtc3RheS1vbicpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AyL2csIExDLmdldFRleHQoJ3RhYi1oYXMtY2hhbmdlcy1jb250aW51ZS13aXRob3V0LWNoYW5nZScpKSk7XHJcbiAgICAgICAgICAgIGQub24oJ2NsaWNrJywgJy5zdG9wJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2Uod2luZG93KTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKCdjbGljaycsICcuY29udGludWUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh3aW5kb3cpO1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlICdoYXMtY2hhbmdlcycgdG8gYXZvaWQgZnV0dXJlIGJsb2NrcyAodW50aWwgbmV3IGNoYW5nZXMgaGFwcGVucyBvZiBjb3Vyc2UgOy0pXHJcbiAgICAgICAgICAgICAgICBtaS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKTtcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKGZvY3VzZWRDdHgudGFiLmdldCgwKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGQsIHdpbmRvdywgJ25vdC1zYXZlZC1wb3B1cCcsIHsgY2xvc2FibGU6IGZhbHNlLCBjZW50ZXI6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBFdmVyIHJldHVybiBmYWxzZSB0byBzdG9wIGN1cnJlbnQgdGFiIGZvY3VzXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ25vdGlmeS1jaGFuZ2VzJyk7IC8vaGFzLXRvb2x0aXBcclxuICAgIH0pO1xyXG59O1xyXG4iLCLvu78vKiogVGFiYmVkVVg6IFRhYmJlZCBpbnRlcmZhY2UgbG9naWM7IHdpdGggbWluaW1hbCBIVE1MIHVzaW5nIGNsYXNzICd0YWJiZWQnIGZvciB0aGVcclxuY29udGFpbmVyLCB0aGUgb2JqZWN0IHByb3ZpZGVzIHRoZSBmdWxsIEFQSSB0byBtYW5pcHVsYXRlIHRhYnMgYW5kIGl0cyBzZXR1cFxyXG5saXN0ZW5lcnMgdG8gcGVyZm9ybSBsb2dpYyBvbiB1c2VyIGludGVyYWN0aW9uLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lmhhc1Njcm9sbEJhcicpO1xyXG5cclxudmFyIFRhYmJlZFVYID0ge1xyXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoJ2JvZHknKS5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzID4gbGk6bm90KC50YWJzLXNsaWRlcikgPiBhJywgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKFRhYmJlZFVYLmZvY3VzVGFiKCR0LmF0dHIoJ2hyZWYnKSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdCA9ICQoZG9jdW1lbnQpLnNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24uaGFzaCA9ICR0LmF0dHIoJ2hyZWYnKTtcclxuICAgICAgICAgICAgICAgICQoJ2h0bWwsYm9keScpLnNjcm9sbFRvcChzdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdtb3VzZWRvd24nLCBUYWJiZWRVWC5zdGFydE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnbW91c2V1cCBtb3VzZWxlYXZlJywgVGFiYmVkVVguZW5kTW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLy8gdGhlIGNsaWNrIHJldHVybiBmYWxzZSBpcyB0byBkaXNhYmxlIHN0YW5kYXIgdXJsIGJlaGF2aW9yXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdjbGljaycsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlci1saW1pdCcsICdtb3VzZWVudGVyJywgVGFiYmVkVVguc3RhcnRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXItbGltaXQnLCAnbW91c2VsZWF2ZScsIFRhYmJlZFVYLmVuZE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzID4gbGkucmVtb3ZhYmxlJywgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgLy8gT25seSBvbiBkaXJlY3QgY2xpY2tzIHRvIHRoZSB0YWIsIHRvIGF2b2lkXHJcbiAgICAgICAgICAgIC8vIGNsaWNrcyB0byB0aGUgdGFiLWxpbmsgKHRoYXQgc2VsZWN0L2ZvY3VzIHRoZSB0YWIpOlxyXG4gICAgICAgICAgICBpZiAoZS50YXJnZXQgPT0gZS5jdXJyZW50VGFyZ2V0KVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVgucmVtb3ZlVGFiKG51bGwsIHRoaXMpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBJbml0IHBhZ2UgbG9hZGVkIHRhYmJlZCBjb250YWluZXJzOlxyXG4gICAgICAgICQoJy50YWJiZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgLy8gQ29uc2lzdGVuY2UgY2hlY2s6IHRoaXMgbXVzdCBiZSBhIHZhbGlkIGNvbnRhaW5lciwgdGhpcyBpcywgbXVzdCBoYXZlIC50YWJzXHJcbiAgICAgICAgICAgIGlmICgkdC5jaGlsZHJlbignLnRhYnMnKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIC8vIEluaXQgc2xpZGVyXHJcbiAgICAgICAgICAgIFRhYmJlZFVYLnNldHVwU2xpZGVyKCR0KTtcclxuICAgICAgICAgICAgLy8gQ2xlYW4gd2hpdGUgc3BhY2VzICh0aGV5IGNyZWF0ZSBleGNlc2l2ZSBzZXBhcmF0aW9uIGJldHdlZW4gc29tZSB0YWJzKVxyXG4gICAgICAgICAgICAkKCcudGFicycsIHRoaXMpLmNvbnRlbnRzKCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGEgdGV4dCBub2RlLCByZW1vdmUgaXQ6XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ub2RlVHlwZSA9PSAzKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciBkaXIgPSAkdC5oYXNDbGFzcygndGFicy1zbGlkZXItcmlnaHQnKSA/IDEgOiAtMTtcclxuICAgICAgICB2YXIgdGFic1NsaWRlciA9ICR0LnBhcmVudCgpO1xyXG4gICAgICAgIHZhciB0YWJzID0gdGFic1NsaWRlci5zaWJsaW5ncygnLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICB0YWJzWzBdLnNjcm9sbExlZnQgKz0gMjAgKiBkaXI7XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFic1NsaWRlci5wYXJlbnQoKSwgdGFicyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIHN0YXJ0TW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIHRhYnMgPSB0LmNsb3Nlc3QoJy50YWJiZWQnKS5jaGlsZHJlbignLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICAvLyBTdG9wIHByZXZpb3VzIGFuaW1hdGlvbnM6XHJcbiAgICAgICAgdGFicy5zdG9wKHRydWUpO1xyXG4gICAgICAgIHZhciBzcGVlZCA9IDAuMzsgLyogc3BlZWQgdW5pdDogcGl4ZWxzL21pbGlzZWNvbmRzICovXHJcbiAgICAgICAgdmFyIGZ4YSA9IGZ1bmN0aW9uICgpIHsgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFicy5wYXJlbnQoKSwgdGFicyk7IH07XHJcbiAgICAgICAgdmFyIHRpbWU7XHJcbiAgICAgICAgaWYgKHQuaGFzQ2xhc3MoJ3JpZ2h0JykpIHtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRpbWUgYmFzZWQgb24gc3BlZWQgd2Ugd2FudCBhbmQgaG93IG1hbnkgZGlzdGFuY2UgdGhlcmUgaXM6XHJcbiAgICAgICAgICAgIHRpbWUgPSAodGFic1swXS5zY3JvbGxXaWR0aCAtIHRhYnNbMF0uc2Nyb2xsTGVmdCAtIHRhYnMud2lkdGgoKSkgKiAxIC8gc3BlZWQ7XHJcbiAgICAgICAgICAgIHRhYnMuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IHRhYnNbMF0uc2Nyb2xsV2lkdGggLSB0YWJzLndpZHRoKCkgfSxcclxuICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgc3RlcDogZnhhLCBjb21wbGV0ZTogZnhhLCBlYXNpbmc6ICdzd2luZycgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRpbWUgYmFzZWQgb24gc3BlZWQgd2Ugd2FudCBhbmQgaG93IG1hbnkgZGlzdGFuY2UgdGhlcmUgaXM6XHJcbiAgICAgICAgICAgIHRpbWUgPSB0YWJzWzBdLnNjcm9sbExlZnQgKiAxIC8gc3BlZWQ7XHJcbiAgICAgICAgICAgIHRhYnMuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IDAgfSxcclxuICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgc3RlcDogZnhhLCBjb21wbGV0ZTogZnhhLCBlYXNpbmc6ICdzd2luZycgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBlbmRNb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0YWJDb250YWluZXIgPSAkKHRoaXMpLmNsb3Nlc3QoJy50YWJiZWQnKTtcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJykuc3RvcCh0cnVlKTtcclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJDb250YWluZXIpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBjaGVja1RhYlNsaWRlckxpbWl0czogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgdGFicykge1xyXG4gICAgICAgIHRhYnMgPSB0YWJzIHx8IHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICAvLyBTZXQgdmlzaWJpbGl0eSBvZiB2aXN1YWwgbGltaXRlcnM6XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXItbGltaXQtbGVmdCcpLnRvZ2dsZSh0YWJzWzBdLnNjcm9sbExlZnQgPiAwKTtcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlci1saW1pdC1yaWdodCcpLnRvZ2dsZShcclxuICAgICAgICAgICAgKHRhYnNbMF0uc2Nyb2xsTGVmdCArIHRhYnMud2lkdGgoKSkgPCB0YWJzWzBdLnNjcm9sbFdpZHRoKTtcclxuICAgIH0sXHJcbiAgICBzZXR1cFNsaWRlcjogZnVuY3Rpb24gKHRhYkNvbnRhaW5lcikge1xyXG4gICAgICAgIHZhciB0cyA9IHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMnKS5oYXNTY3JvbGxCYXIoeyB4OiAtMiB9KS5ob3Jpem9udGFsKSB7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hZGRDbGFzcygnaGFzLXRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgICAgIGlmICh0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICB0cy5jbGFzc05hbWUgPSAndGFicy1zbGlkZXInO1xyXG4gICAgICAgICAgICAgICAgJCh0cylcclxuICAgICAgICAgICAgICAgIC8vIEFycm93czpcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cInRhYnMtc2xpZGVyLWxlZnQgbGVmdFwiIGhyZWY9XCIjXCI+Jmx0OyZsdDs8L2E+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cInRhYnMtc2xpZGVyLXJpZ2h0IHJpZ2h0XCIgaHJlZj1cIiNcIj4mZ3Q7Jmd0OzwvYT4nKTtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hcHBlbmQodHMpO1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyXHJcbiAgICAgICAgICAgICAgICAvLyBEZXNpbmcgZGV0YWlsczpcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGFicy1zbGlkZXItbGltaXQgdGFicy1zbGlkZXItbGltaXQtbGVmdCBsZWZ0XCIgaHJlZj1cIiNcIj48L2Rpdj4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ0YWJzLXNsaWRlci1saW1pdCB0YWJzLXNsaWRlci1saW1pdC1yaWdodCByaWdodFwiIGhyZWY9XCIjXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0cy5zaG93KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIucmVtb3ZlQ2xhc3MoJ2hhcy10YWJzLXNsaWRlcicpO1xyXG4gICAgICAgICAgICB0cy5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYkNvbnRhaW5lcik7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiQ29udGV4dEJ5QXJnczogZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJiB0eXBlb2YgKGFyZ3NbMF0pID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUYWJDb250ZXh0KGFyZ3NbMF0sIG51bGwpO1xyXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIGFyZ3NbMF0udGFiKVxyXG4gICAgICAgICAgICByZXR1cm4gYXJnc1swXTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFRhYkNvbnRleHQoXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDAgPyBhcmdzWzBdIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMSA/IGFyZ3NbMV0gOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAyID8gYXJnc1syXSA6IG51bGxcclxuICAgICAgICAgICAgKTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWJDb250ZXh0OiBmdW5jdGlvbiAodGFiT3JTZWxlY3RvciwgbWVudWl0ZW1PclNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIG1pLCBtYSwgdGFiLCB0YWJDb250YWluZXI7XHJcbiAgICAgICAgaWYgKHRhYk9yU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdGFiID0gJCh0YWJPclNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKHRhYi5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyID0gdGFiLnBhcmVudHMoJy50YWJiZWQ6ZXEoMCknKTtcclxuICAgICAgICAgICAgICAgIG1hID0gdGFiQ29udGFpbmVyLmZpbmQoJz4gLnRhYnMgPiBsaSA+IGFbaHJlZj0jJyArIHRhYi5nZXQoMCkuaWQgKyAnXScpO1xyXG4gICAgICAgICAgICAgICAgbWkgPSBtYS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAobWVudWl0ZW1PclNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIG1hID0gJChtZW51aXRlbU9yU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAobWEuaXMoJ2xpJykpIHtcclxuICAgICAgICAgICAgICAgIG1pID0gbWE7XHJcbiAgICAgICAgICAgICAgICBtYSA9IG1pLmNoaWxkcmVuKCdhOmVxKDApJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgbWkgPSBtYS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyID0gbWkuY2xvc2VzdCgnLnRhYmJlZCcpO1xyXG4gICAgICAgICAgICB0YWIgPSB0YWJDb250YWluZXIuZmluZCgnPi50YWItYm9keUAwLCA+LnRhYi1ib2R5LWxpc3Q+LnRhYi1ib2R5QDAnLnJlcGxhY2UoL0AwL2csIG1hLmF0dHIoJ2hyZWYnKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyB0YWI6IHRhYiwgbWVudWFuY2hvcjogbWEsIG1lbnVpdGVtOiBtaSwgdGFiQ29udGFpbmVyOiB0YWJDb250YWluZXIgfTtcclxuICAgIH0sXHJcbiAgICBjaGVja1RhYkNvbnRleHQ6IGZ1bmN0aW9uIChjdHgsIGZ1bmN0aW9ubmFtZSwgYXJncywgaXNUZXN0KSB7XHJcbiAgICAgICAgaWYgKCFjdHgudGFiIHx8IGN0eC50YWIubGVuZ3RoICE9IDEgfHxcclxuICAgICAgICAgICAgIWN0eC5tZW51aXRlbSB8fCBjdHgubWVudWl0ZW0ubGVuZ3RoICE9IDEgfHxcclxuICAgICAgICAgICAgIWN0eC50YWJDb250YWluZXIgfHwgY3R4LnRhYkNvbnRhaW5lci5sZW5ndGggIT0gMSB8fCBcclxuICAgICAgICAgICAgIWN0eC5tZW51YW5jaG9yIHx8IGN0eC5tZW51YW5jaG9yLmxlbmd0aCAhPSAxKSB7XHJcbiAgICAgICAgICAgIGlmICghaXNUZXN0ICYmIGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RhYmJlZFVYLicgKyBmdW5jdGlvbm5hbWUgKyAnLCBiYWQgYXJndW1lbnRzOiAnICsgQXJyYXkuam9pbihhcmdzLCAnLCAnKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZm9jdXNUYWInLCBhcmd1bWVudHMsIHRydWUpKSByZXR1cm4gbnVsbDtcclxuICAgICAgICByZXR1cm4gY3R4LnRhYi5nZXQoMCk7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdmb2N1c1RhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gR2V0IHByZXZpb3VzIGZvY3VzZWQgdGFiLCB0cmlnZ2VyICd0YWJVbmZvY3VzZWQnIGhhbmRsZXIgdGhhdCBjYW5cclxuICAgICAgICAvLyBzdG9wIHRoaXMgZm9jdXMgKHJldHVybmluZyBleHBsaWNpdHkgJ2ZhbHNlJylcclxuICAgICAgICB2YXIgcHJldlRhYiA9IGN0eC50YWIuc2libGluZ3MoJy5jdXJyZW50Jyk7XHJcbiAgICAgICAgaWYgKHByZXZUYWIudHJpZ2dlckhhbmRsZXIoJ3RhYlVuZm9jdXNlZCcsIFtjdHhdKSA9PT0gZmFsc2UpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgKGZpcnN0ISkgaWYgdGhlcmUgaXMgYSBwYXJlbnQgdGFiIGFuZCBmb2N1cyBpdCB0b28gKHdpbGwgYmUgcmVjdXJzaXZlIGNhbGxpbmcgdGhpcyBzYW1lIGZ1bmN0aW9uKVxyXG4gICAgICAgIHZhciBwYXJUYWIgPSBjdHgudGFiLnBhcmVudHMoJy50YWItYm9keTplcSgwKScpO1xyXG4gICAgICAgIGlmIChwYXJUYWIubGVuZ3RoID09IDEpIHRoaXMuZm9jdXNUYWIocGFyVGFiKTtcclxuXHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5oYXNDbGFzcygnY3VycmVudCcpIHx8XHJcbiAgICAgICAgICAgIGN0eC5tZW51aXRlbS5oYXNDbGFzcygnZGlzYWJsZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBVbnNldCBjdXJyZW50IG1lbnUgZWxlbWVudFxyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaWJsaW5ncygnLmN1cnJlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpXHJcbiAgICAgICAgICAgIC5maW5kKCc+YScpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgLy8gU2V0IGN1cnJlbnQgbWVudSBlbGVtZW50XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgY3R4Lm1lbnVhbmNob3IuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuXHJcbiAgICAgICAgLy8gSGlkZSBjdXJyZW50IHRhYi1ib2R5XHJcbiAgICAgICAgcHJldlRhYi5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIC8vIFNob3cgY3VycmVudCB0YWItYm9keSBhbmQgdHJpZ2dlciBldmVudFxyXG4gICAgICAgIGN0eC50YWIuYWRkQ2xhc3MoJ2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkZvY3VzZWQnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUYWJJbmRleDogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgdGFiSW5kZXgpIHtcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb2N1c1RhYih0aGlzLmdldFRhYkNvbnRleHQodGFiQ29udGFpbmVyLmZpbmQoJz4udGFiLWJvZHk6ZXEoJyArIHRhYkluZGV4ICsgJyknKSkpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICAvKiBFbmFibGUgYSB0YWIsIGRpc2FibGluZyBhbGwgb3RoZXJzIHRhYnMgLXVzZWZ1bGwgaW4gd2l6YXJkIHN0eWxlIHBhZ2VzLSAqL1xyXG4gICAgZW5hYmxlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZW5hYmxlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBydG4gPSBmYWxzZTtcclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmlzKCcuZGlzYWJsZWQnKSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZGlzYWJsZWQgY2xhc3MgZnJvbSBmb2N1c2VkIHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgICAgIGN0eC50YWIucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJFbmFibGVkJyk7XHJcbiAgICAgICAgICAgIGN0eC5tZW51aXRlbS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgcnRuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRm9jdXMgdGFiOlxyXG4gICAgICAgIHRoaXMuZm9jdXNUYWIoY3R4KTtcclxuICAgICAgICAvLyBEaXNhYmxlZCB0YWJzIGFuZCBtZW51IGl0ZW1zOlxyXG4gICAgICAgIGN0eC50YWIuc2libGluZ3MoJzpub3QoLmRpc2FibGVkKScpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnZGlzYWJsZWQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkRpc2FibGVkJyk7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNpYmxpbmdzKCc6bm90KC5kaXNhYmxlZCknKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgcmV0dXJuIHJ0bjtcclxuICAgIH0sXHJcbiAgICBzaG93aGlkZUR1cmF0aW9uOiAwLFxyXG4gICAgc2hvd2hpZGVFYXNpbmc6IG51bGwsXHJcbiAgICBzaG93VGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnc2hvd1RhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTaG93IHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgY3R4LnRhYi5zaG93KHRoaXMuc2hvd2hpZGVEdXJhdGlvbik7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNob3codGhpcy5zaG93aGlkZUVhc2luZyk7XHJcbiAgICB9LFxyXG4gICAgaGlkZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2hpZGVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2hvdyB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgIGN0eC50YWIuaGlkZSh0aGlzLnNob3doaWRlRHVyYXRpb24pO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5oaWRlKHRoaXMuc2hvd2hpZGVFYXNpbmcpO1xyXG4gICAgfSxcclxuICAgIHRhYkJvZHlDbGFzc0V4Y2VwdGlvbnM6IHsgJ3RhYi1ib2R5JzogMCwgJ3RhYmJlZCc6IDAsICdjdXJyZW50JzogMCwgJ2Rpc2FibGVkJzogMCB9LFxyXG4gICAgY3JlYXRlVGFiOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCBpZE5hbWUsIGxhYmVsKSB7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyID0gJCh0YWJDb250YWluZXIpO1xyXG4gICAgICAgIC8vIHRhYkNvbnRhaW5lciBtdXN0IGJlIG9ubHkgb25lIGFuZCB2YWxpZCBjb250YWluZXJcclxuICAgICAgICAvLyBhbmQgaWROYW1lIG11c3Qgbm90IGV4aXN0c1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIubGVuZ3RoID09IDEgJiYgdGFiQ29udGFpbmVyLmlzKCcudGFiYmVkJykgJiZcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWROYW1lKSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGFiIGRpdjpcclxuICAgICAgICAgICAgdmFyIHRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICB0YWIuaWQgPSBpZE5hbWU7XHJcbiAgICAgICAgICAgIC8vIFJlcXVpcmVkIGNsYXNzZXNcclxuICAgICAgICAgICAgdGFiLmNsYXNzTmFtZSA9IFwidGFiLWJvZHlcIjtcclxuICAgICAgICAgICAgdmFyICR0YWIgPSAkKHRhYik7XHJcbiAgICAgICAgICAgIC8vIEdldCBhbiBleGlzdGluZyBzaWJsaW5nIGFuZCBjb3B5ICh3aXRoIHNvbWUgZXhjZXB0aW9ucykgdGhlaXIgY3NzIGNsYXNzZXNcclxuICAgICAgICAgICAgJC5lYWNoKHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYi1ib2R5OmVxKDApJykuYXR0cignY2xhc3MnKS5zcGxpdCgvXFxzKy8pLCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEodiBpbiBUYWJiZWRVWC50YWJCb2R5Q2xhc3NFeGNlcHRpb25zKSlcclxuICAgICAgICAgICAgICAgICAgICAkdGFiLmFkZENsYXNzKHYpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gQWRkIHRvIGNvbnRhaW5lclxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuYXBwZW5kKHRhYik7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgbWVudSBlbnRyeVxyXG4gICAgICAgICAgICB2YXIgbWVudWl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB0YWIsIGlzIGEgZHluYW1pY2FsbHkgcmVtb3ZhYmxlIHRhYjpcclxuICAgICAgICAgICAgbWVudWl0ZW0uY2xhc3NOYW1lID0gXCJyZW1vdmFibGVcIjtcclxuICAgICAgICAgICAgdmFyIG1lbnVhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgICAgIG1lbnVhbmNob3Iuc2V0QXR0cmlidXRlKCdocmVmJywgJyMnICsgaWROYW1lKTtcclxuICAgICAgICAgICAgLy8gbGFiZWwgY2Fubm90IGJlIG51bGwgb3IgZW1wdHlcclxuICAgICAgICAgICAgJChtZW51YW5jaG9yKS50ZXh0KGlzRW1wdHlTdHJpbmcobGFiZWwpID8gXCJUYWJcIiA6IGxhYmVsKTtcclxuICAgICAgICAgICAgJChtZW51aXRlbSkuYXBwZW5kKG1lbnVhbmNob3IpO1xyXG4gICAgICAgICAgICAvLyBBZGQgdG8gdGFicyBsaXN0IGNvbnRhaW5lclxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJykuYXBwZW5kKG1lbnVpdGVtKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQsIG9uIHRhYkNvbnRhaW5lciwgd2l0aCB0aGUgbmV3IHRhYiBhcyBkYXRhXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci50cmlnZ2VySGFuZGxlcigndGFiQ3JlYXRlZCcsIFt0YWJdKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0dXBTbGlkZXIodGFiQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICByZW1vdmVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdyZW1vdmVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIE9ubHkgcmVtb3ZlIGlmIGlzIGEgJ3JlbW92YWJsZScgdGFiXHJcbiAgICAgICAgaWYgKCFjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ3JlbW92YWJsZScpICYmICFjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ3ZvbGF0aWxlJykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAvLyBJZiB0YWIgaXMgY3VycmVudGx5IGZvY3VzZWQgdGFiLCBjaGFuZ2UgdG8gZmlyc3QgdGFiXHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5oYXNDbGFzcygnY3VycmVudCcpKVxyXG4gICAgICAgICAgICB0aGlzLmZvY3VzVGFiSW5kZXgoY3R4LnRhYkNvbnRhaW5lciwgMCk7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnJlbW92ZSgpO1xyXG4gICAgICAgIHZhciB0YWJpZCA9IGN0eC50YWIuZ2V0KDApLmlkO1xyXG4gICAgICAgIGN0eC50YWIucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dXBTbGlkZXIoY3R4LnRhYkNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgIC8vIFRyaWdnZXIgZXZlbnQsIG9uIHRhYkNvbnRhaW5lciwgd2l0aCB0aGUgcmVtb3ZlZCB0YWIgaWQgYXMgZGF0YVxyXG4gICAgICAgIGN0eC50YWJDb250YWluZXIudHJpZ2dlckhhbmRsZXIoJ3RhYlJlbW92ZWQnLCBbdGFiaWRdKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBzZXRUYWJUaXRsZTogZnVuY3Rpb24gKHRhYk9yU2VsZWN0b3IsIG5ld1RpdGxlKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGFiT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdzZXRUYWJUaXRsZScsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTZXQgYW4gZW1wdHkgc3RyaW5nIGlzIG5vdCBhbGxvd2VkLCBwcmVzZXJ2ZSBwcmV2aW91c2x5OlxyXG4gICAgICAgIGlmICghaXNFbXB0eVN0cmluZyhuZXdUaXRsZSkpXHJcbiAgICAgICAgICAgIGN0eC5tZW51YW5jaG9yLnRleHQobmV3VGl0bGUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyogTW9yZSBzdGF0aWMgdXRpbGl0aWVzICovXHJcblxyXG4vKiogTG9vayB1cCB0aGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb24gYWRkcmVzcyBhbmQgdHJ5IHRvIGZvY3VzIGEgdGFiIHdpdGggdGhhdFxyXG4gICAgbmFtZSwgaWYgdGhlcmUgaXMgb25lLlxyXG4qKi9cclxuVGFiYmVkVVguZm9jdXNDdXJyZW50TG9jYXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBJZiB0aGUgY3VycmVudCBsb2NhdGlvbiBoYXZlIGEgaGFzaCB2YWx1ZSBidXQgaXMgbm90IGEgSGFzaEJhbmdcclxuICAgIGlmICgvXiNbXiFdLy50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgICAgIC8vIFRyeSBmb2N1cyBhIHRhYiB3aXRoIHRoYXQgbmFtZVxyXG4gICAgICAgIHZhciB0YWIgPSBUYWJiZWRVWC5nZXRUYWIod2luZG93LmxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIGlmICh0YWIpXHJcbiAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRhYik7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiogTG9vayBmb3Igdm9sYXRpbGUgdGFicyBvbiB0aGUgcGFnZSwgaWYgdGhleSBhcmVcclxuICAgIGVtcHR5IG9yIHJlcXVlc3RpbmcgYmVpbmcgJ3ZvbGF0aXplZCcsIHJlbW92ZSBpdC5cclxuKiovXHJcblRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJCgnLnRhYmJlZCA+IC50YWJzID4gLnZvbGF0aWxlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRhYiA9IFRhYmJlZFVYLmdldFRhYihudWxsLCB0aGlzKTtcclxuICAgICAgICBpZiAodGFiICYmICgkKHRhYikuY2hpbGRyZW4oKS5sZW5ndGggPT09IDAgfHwgJCh0YWIpLmZpbmQoJzpub3QoLnRhYmJlZCkgLnZvbGF0aXplLW15LXRhYicpLmxlbmd0aCkpIHtcclxuICAgICAgICAgICAgVGFiYmVkVVgucmVtb3ZlVGFiKHRhYik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUYWJiZWRVWDsiLCLvu78vKiBzbGlkZXItdGFicyBsb2dpYy5cclxuKiBFeGVjdXRlIGluaXQgYWZ0ZXIgVGFiYmVkVVguaW5pdCB0byBhdm9pZCBsYXVuY2ggYW5pbWF0aW9uIG9uIHBhZ2UgbG9hZC5cclxuKiBJdCByZXF1aXJlcyBUYWJiZWRVWCB0aHJvdWdodCBESSBvbiAnaW5pdCcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRTbGlkZXJUYWJzKFRhYmJlZFVYKSB7XHJcbiAgICAkKCcudGFiYmVkLnNsaWRlci10YWJzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgJHRhYnMgPSAkdC5jaGlsZHJlbignLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgdmFyIGMgPSAkdGFic1xyXG4gICAgICAgICAgICAud3JhcEFsbCgnPGRpdiBjbGFzcz1cInRhYi1ib2R5LWxpc3RcIi8+JylcclxuICAgICAgICAgICAgLmVuZCgpLmNoaWxkcmVuKCcudGFiLWJvZHktbGlzdCcpO1xyXG4gICAgICAgICR0YWJzLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjLnN0b3AodHJ1ZSwgZmFsc2UpLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiBjLnNjcm9sbExlZnQoKSArICQodGhpcykucG9zaXRpb24oKS5sZWZ0IH0sIDE0MDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIFNldCBob3Jpem9udGFsIHNjcm9sbCB0byB0aGUgcG9zaXRpb24gb2YgY3VycmVudCBzaG93ZWQgdGFiLCB3aXRob3V0IGFuaW1hdGlvbiAoZm9yIHBhZ2UtaW5pdCk6XHJcbiAgICAgICAgdmFyIGN1cnJlbnRUYWIgPSAkKCR0LmZpbmQoJz4udGFicz5saS5jdXJyZW50PmEnKS5hdHRyKCdocmVmJykpO1xyXG4gICAgICAgIGMuc2Nyb2xsTGVmdChjLnNjcm9sbExlZnQoKSArIGN1cnJlbnRUYWIucG9zaXRpb24oKS5sZWZ0KTtcclxuICAgIH0pO1xyXG59OyIsIu+7vy8qKlxyXG4gICAgV2l6YXJkIFRhYmJlZCBGb3Jtcy5cclxuICAgIEl0IHVzZSB0YWJzIHRvIG1hbmFnZSB0aGUgZGlmZmVyZW50IGZvcm1zLXN0ZXBzIGluIHRoZSB3aXphcmQsXHJcbiAgICBsb2FkZWQgYnkgQUpBWCBhbmQgZm9sbG93aW5nIHRvIHRoZSBuZXh0IHRhYi9zdGVwIG9uIHN1Y2Nlc3MuXHJcblxyXG4gICAgUmVxdWlyZSBUYWJiZWRVWCB2aWEgREkgb24gJ2luaXQnXHJcbiAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRUYWJiZWRXaXphcmQoVGFiYmVkVVgsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgbG9hZGluZ0RlbGF5OiAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKFwiYm9keVwiKS5kZWxlZ2F0ZShcIi50YWJiZWQud2l6YXJkIC5uZXh0XCIsIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGZvcm1cclxuICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGN1cnJlbnQgd2l6YXJkIHN0ZXAtdGFiXHJcbiAgICAgICAgdmFyIGN1cnJlbnRTdGVwID0gZm9ybS5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQgY29udGFpbmVyXHJcbiAgICAgICAgdmFyIHdpemFyZCA9IGZvcm0uY2xvc2VzdCgnLnRhYmJlZC53aXphcmQnKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQtbmV4dC1zdGVwXHJcbiAgICAgICAgdmFyIG5leHRTdGVwID0gJCh0aGlzKS5kYXRhKCd3aXphcmQtbmV4dC1zdGVwJyk7XHJcblxyXG4gICAgICAgIHZhciBjdHggPSB7XHJcbiAgICAgICAgICAgIGJveDogY3VycmVudFN0ZXAsXHJcbiAgICAgICAgICAgIGZvcm06IGZvcm1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgICAgICB2YXIgdmFsb2JqZWN0ID0gZm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLmdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pO1xyXG4gICAgICAgICAgICAvLyBWYWxpZGF0aW9uIGlzIGFjdGl2ZWQsIHdhcyBleGVjdXRlZCBhbmQgdGhlIHJlc3VsdCBpcyAnZmFsc2UnOiBiYWQgZGF0YSwgc3RvcCBQb3N0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgICAgIHZhciBjdXN2YWwgPSBmb3JtLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAoY3VzdmFsICYmIGN1c3ZhbC52YWxpZGF0ZSAmJiBjdXN2YWwudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5nb1RvU3VtbWFyeUVycm9ycyhmb3JtKTtcclxuICAgICAgICAgICAgLy8gY3VzdG9tIHZhbGlkYXRpb24gbm90IHBhc3NlZCwgb3V0IVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSYWlzZSBldmVudFxyXG4gICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2JlZ2luU3VibWl0V2l6YXJkU3RlcCcpO1xyXG5cclxuICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIHJldGFyZFxyXG4gICAgICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY3VycmVudFN0ZXAuYmxvY2soYmxvY2tQcmVzZXRzLmxvYWRpbmcpO1xyXG4gICAgICAgIH0sIG9wdGlvbnMubG9hZGluZ0RlbGF5KTtcclxuICAgICAgICBcclxuICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIG9rID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIE1hcmsgYXMgc2F2ZWQ6XHJcbiAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uZ2V0KDApKTtcclxuXHJcbiAgICAgICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogKGZvcm0uYXR0cignYWN0aW9uJykgfHwgJycpLFxyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICAgICAgZGF0YTogZm9ybS5zZXJpYWxpemUoKSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgc3VjY2VzcywgZ28gbmV4dCBzdGVwLCB1c2luZyBjdXN0b20gSlNPTiBBY3Rpb24gZXZlbnQ6XHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5vbignYWpheFN1Y2Nlc3NQb3N0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5leHQtc3RlcFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0U3RlcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBuZXh0IHN0ZXAgaXMgaW50ZXJuYWwgdXJsIChhIG5leHQgd2l6YXJkIHRhYilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eIy8udGVzdChuZXh0U3RlcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2JlZ2luTG9hZFdpemFyZFN0ZXAnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYWJiZWRVWC5lbmFibGVUYWIobmV4dFN0ZXApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9rID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2VuZExvYWRXaXphcmRTdGVwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG5leHQtc3RlcCBVUkkgdGhhdCBpcyBub3QgaW50ZXJuYWwgbGluaywgd2UgbG9hZCBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhuZXh0U3RlcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgICAgICAgICAgICAgaWYgKCFhamF4Q2FsbGJhY2tzLmRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAgICAgICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93aW5nIG5ldyBodG1sOlxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwLmh0bWwobmV3aHRtbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0Zvcm0gPSBjdXJyZW50U3RlcDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnRTdGVwLmlzKCdmb3JtJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0gPSBjdXJyZW50U3RlcC5maW5kKCdmb3JtOmVxKDApJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcigncmVsb2FkZWRIdG1sV2l6YXJkU3RlcCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgICAgICAgICAgY29tcGxldGU6IGFqYXhDYWxsYmFja3MuY29tcGxldGVcclxuICAgICAgICB9KS5jb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2VuZFN1Ym1pdFdpemFyZFN0ZXAnLCBvayk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07Iiwi77u/LyoqIHRpbWVTcGFuIGNsYXNzIHRvIG1hbmFnZSB0aW1lcywgcGFyc2UsIGZvcm1hdCwgY29tcHV0ZS5cclxuSXRzIG5vdCBzbyBjb21wbGV0ZSBhcyB0aGUgQyMgb25lcyBidXQgaXMgdXNlZnVsbCBzdGlsbC5cclxuKiovXHJcbnZhciBUaW1lU3BhbiA9IGZ1bmN0aW9uIChkYXlzLCBob3VycywgbWludXRlcywgc2Vjb25kcywgbWlsbGlzZWNvbmRzKSB7XHJcbiAgICB0aGlzLmRheXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoZGF5cykpIHx8IDA7XHJcbiAgICB0aGlzLmhvdXJzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGhvdXJzKSkgfHwgMDtcclxuICAgIHRoaXMubWludXRlcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChtaW51dGVzKSkgfHwgMDtcclxuICAgIHRoaXMuc2Vjb25kcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChzZWNvbmRzKSkgfHwgMDtcclxuICAgIHRoaXMubWlsbGlzZWNvbmRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KG1pbGxpc2Vjb25kcykpIHx8IDA7XHJcblxyXG4gICAgLy8gaW50ZXJuYWwgdXRpbGl0eSBmdW5jdGlvbiAndG8gc3RyaW5nIHdpdGggdHdvIGRpZ2l0cyBhbG1vc3QnXHJcbiAgICBmdW5jdGlvbiB0KG4pIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihuIC8gMTApICsgJycgKyBuICUgMTA7XHJcbiAgICB9XHJcbiAgICAvKiogU2hvdyBvbmx5IGhvdXJzIGFuZCBtaW51dGVzIGFzIGEgc3RyaW5nIHdpdGggdGhlIGZvcm1hdCBISDptbVxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvU2hvcnRTdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1Nob3J0U3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKTtcclxuICAgICAgICByZXR1cm4gKGggKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArIG0pO1xyXG4gICAgfTtcclxuICAgIC8qKiBTaG93IHRoZSBmdWxsIHRpbWUgYXMgYSBzdHJpbmcsIGRheXMgY2FuIGFwcGVhciBiZWZvcmUgaG91cnMgaWYgdGhlcmUgYXJlIDI0IGhvdXJzIG9yIG1vcmVcclxuICAgICoqL1xyXG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgZCA9ICh0aGlzLmRheXMgPiAwID8gdGhpcy5kYXlzLnRvU3RyaW5nKCkgKyBUaW1lU3Bhbi5kZWNpbWFsc0RlbGltaXRlciA6ICcnKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKSxcclxuICAgICAgICAgICAgcyA9IHQodGhpcy5zZWNvbmRzICsgdGhpcy5taWxsaXNlY29uZHMgLyAxMDAwKTtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBkICtcclxuICAgICAgICAgICAgaCArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgbSArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgcyk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy52YWx1ZU9mID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdmFsdWVPZigpIHtcclxuICAgICAgICAvLyBSZXR1cm4gdGhlIHRvdGFsIG1pbGxpc2Vjb25kcyBjb250YWluZWQgYnkgdGhlIHRpbWVcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmRheXMgKiAoMjQgKiAzNjAwMDAwKSArXHJcbiAgICAgICAgICAgIHRoaXMuaG91cnMgKiAzNjAwMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taW51dGVzICogNjAwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLnNlY29uZHMgKiAxMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHNcclxuICAgICAgICApO1xyXG4gICAgfTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBtaWxsaXNlY29uZHNcclxuKiovXHJcblRpbWVTcGFuLmZyb21NaWxsaXNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWlsbGlzZWNvbmRzKG1pbGxpc2Vjb25kcykge1xyXG4gICAgdmFyIG1zID0gbWlsbGlzZWNvbmRzICUgMTAwMCxcclxuICAgICAgICBzID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAxMDAwKSAlIDYwLFxyXG4gICAgICAgIG0gPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDYwMDAwKSAlIDYwLFxyXG4gICAgICAgIGggPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDM2MDAwMDApICUgMjQsXHJcbiAgICAgICAgZCA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gKDM2MDAwMDAgKiAyNCkpO1xyXG4gICAgcmV0dXJuIG5ldyBUaW1lU3BhbihkLCBoLCBtLCBzLCBtcyk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBzZWNvbmRzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tU2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21TZWNvbmRzKHNlY29uZHMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21NaWxsaXNlY29uZHMoc2Vjb25kcyAqIDEwMDApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgbWludXRlc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbU1pbnV0ZXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWludXRlcyhtaW51dGVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tU2Vjb25kcyhtaW51dGVzICogNjApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgaG91cnNcclxuKiovXHJcblRpbWVTcGFuLmZyb21Ib3VycyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21Ib3Vycyhob3Vycykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbU1pbnV0ZXMoaG91cnMgKiA2MCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBkYXlzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tRGF5cyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21EYXlzKGRheXMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21Ib3VycyhkYXlzICogMjQpO1xyXG59O1xyXG5cclxuLy8gRm9yIHNwYW5pc2ggYW5kIGVuZ2xpc2ggd29ya3MgZ29vZCAnOicgYXMgdW5pdHNEZWxpbWl0ZXIgYW5kICcuJyBhcyBkZWNpbWFsRGVsaW1pdGVyXHJcbi8vIFRPRE86IHRoaXMgbXVzdCBiZSBzZXQgZnJvbSBhIGdsb2JhbCBMQy5pMThuIHZhciBsb2NhbGl6ZWQgZm9yIGN1cnJlbnQgdXNlclxyXG5UaW1lU3Bhbi51bml0c0RlbGltaXRlciA9ICc6JztcclxuVGltZVNwYW4uZGVjaW1hbHNEZWxpbWl0ZXIgPSAnLic7XHJcblRpbWVTcGFuLnBhcnNlID0gZnVuY3Rpb24gKHN0cnRpbWUpIHtcclxuICAgIHN0cnRpbWUgPSAoc3RydGltZSB8fCAnJykuc3BsaXQodGhpcy51bml0c0RlbGltaXRlcik7XHJcbiAgICAvLyBCYWQgc3RyaW5nLCByZXR1cm5zIG51bGxcclxuICAgIGlmIChzdHJ0aW1lLmxlbmd0aCA8IDIpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgLy8gRGVjb3VwbGVkIHVuaXRzOlxyXG4gICAgdmFyIGQsIGgsIG0sIHMsIG1zO1xyXG4gICAgaCA9IHN0cnRpbWVbMF07XHJcbiAgICBtID0gc3RydGltZVsxXTtcclxuICAgIHMgPSBzdHJ0aW1lLmxlbmd0aCA+IDIgPyBzdHJ0aW1lWzJdIDogMDtcclxuICAgIC8vIFN1YnN0cmFjdGluZyBkYXlzIGZyb20gdGhlIGhvdXJzIHBhcnQgKGZvcm1hdDogJ2RheXMuaG91cnMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIGlmIChoLmNvbnRhaW5zKHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpKSB7XHJcbiAgICAgICAgdmFyIGRoc3BsaXQgPSBoLnNwbGl0KHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpO1xyXG4gICAgICAgIGQgPSBkaHNwbGl0WzBdO1xyXG4gICAgICAgIGggPSBkaHNwbGl0WzFdO1xyXG4gICAgfVxyXG4gICAgLy8gTWlsbGlzZWNvbmRzIGFyZSBleHRyYWN0ZWQgZnJvbSB0aGUgc2Vjb25kcyAoYXJlIHJlcHJlc2VudGVkIGFzIGRlY2ltYWwgbnVtYmVycyBvbiB0aGUgc2Vjb25kcyBwYXJ0OiAnc2Vjb25kcy5taWxsaXNlY29uZHMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIG1zID0gTWF0aC5yb3VuZChwYXJzZUZsb2F0KHMucmVwbGFjZSh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyLCAnLicpKSAqIDEwMDAgJSAxMDAwKTtcclxuICAgIC8vIFJldHVybiB0aGUgbmV3IHRpbWUgaW5zdGFuY2VcclxuICAgIHJldHVybiBuZXcgVGltZVNwYW4oZCwgaCwgbSwgcywgbXMpO1xyXG59O1xyXG5UaW1lU3Bhbi56ZXJvID0gbmV3IFRpbWVTcGFuKDAsIDAsIDAsIDAsIDApO1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9faXNaZXJvKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICB0aGlzLmRheXMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLmhvdXJzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taW51dGVzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5zZWNvbmRzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taWxsaXNlY29uZHMgPT09IDBcclxuICAgICk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbE1pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWlsbGlzZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWVPZigpO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxTZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxTZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsTWludXRlcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWludXRlcygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbFNlY29uZHMoKSAvIDYwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsSG91cnMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbEhvdXJzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWludXRlcygpIC8gNjApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxEYXlzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxEYXlzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsSG91cnMoKSAvIDI0KTtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGltZVNwYW47Iiwi77u/LyogRXh0cmEgdXRpbGl0aWVzIGFuZCBtZXRob2RzIFxyXG4gKi9cclxudmFyIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG52YXIgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuLyoqIFNob3dzIHRpbWUgYXMgYSBsYXJnZSBzdHJpbmcgd2l0aCB1bml0cyBuYW1lcyBmb3IgdmFsdWVzIGRpZmZlcmVudCB0aGFuIHplcm8uXHJcbiAqKi9cclxuZnVuY3Rpb24gc21hcnRUaW1lKHRpbWUpIHtcclxuICAgIHZhciByID0gW107XHJcbiAgICBpZiAodGltZS5kYXlzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5kYXlzICsgJyBkYXlzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmRheXMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgZGF5Jyk7XHJcbiAgICBpZiAodGltZS5ob3VycyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuaG91cnMgKyAnIGhvdXJzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmhvdXJzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIGhvdXInKTtcclxuICAgIGlmICh0aW1lLm1pbnV0ZXMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLm1pbnV0ZXMgKyAnIG1pbnV0ZXMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWludXRlcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBtaW51dGUnKTtcclxuICAgIGlmICh0aW1lLnNlY29uZHMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLnNlY29uZHMgKyAnIHNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuc2Vjb25kcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBzZWNvbmQnKTtcclxuICAgIGlmICh0aW1lLm1pbGxpc2Vjb25kcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUubWlsbGlzZWNvbmRzICsgJyBtaWxsaXNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWlsbGlzZWNvbmRzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIG1pbGxpc2Vjb25kJyk7XHJcbiAgICByZXR1cm4gci5qb2luKCcsICcpO1xyXG59XHJcblxyXG4vKiogUm91bmRzIGEgdGltZSB0byB0aGUgbmVhcmVzdCAxNSBtaW51dGVzIGZyYWdtZW50LlxyXG5Acm91bmRUbyBzcGVjaWZ5IHRoZSBMQy5yb3VuZGluZ1R5cGVFbnVtIGFib3V0IGhvdyB0byByb3VuZCB0aGUgdGltZSAoZG93biwgbmVhcmVzdCBvciB1cClcclxuKiovXHJcbmZ1bmN0aW9uIHJvdW5kVGltZVRvUXVhcnRlckhvdXIoLyogVGltZVNwYW4gKi90aW1lLCAvKiBtYXRoVXRpbHMucm91bmRpbmdUeXBlRW51bSAqL3JvdW5kVG8pIHtcclxuICAgIHZhciByZXN0RnJvbVF1YXJ0ZXIgPSB0aW1lLnRvdGFsSG91cnMoKSAlIDAuMjU7XHJcbiAgICB2YXIgaG91cnMgPSB0aW1lLnRvdGFsSG91cnMoKTtcclxuICAgIGlmIChyZXN0RnJvbVF1YXJ0ZXIgPiAwLjApIHtcclxuICAgICAgICBzd2l0Y2ggKHJvdW5kVG8pIHtcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLkRvd246XHJcbiAgICAgICAgICAgICAgICBob3VycyAtPSByZXN0RnJvbVF1YXJ0ZXI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLk5lYXJlc3Q6XHJcbiAgICAgICAgICAgICAgICB2YXIgbGltaXQgPSAwLjI1IC8gMjtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN0RnJvbVF1YXJ0ZXIgPj0gbGltaXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBob3VycyArPSAoMC4yNSAtIHJlc3RGcm9tUXVhcnRlcik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzIC09IHJlc3RGcm9tUXVhcnRlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uVXA6XHJcbiAgICAgICAgICAgICAgICBob3VycyArPSAoMC4yNSAtIHJlc3RGcm9tUXVhcnRlcik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gVGltZVNwYW4uZnJvbUhvdXJzKGhvdXJzKTtcclxufVxyXG5cclxuLy8gRXh0ZW5kIGEgZ2l2ZW4gVGltZVNwYW4gb2JqZWN0IHdpdGggdGhlIEV4dHJhIG1ldGhvZHNcclxuZnVuY3Rpb24gcGx1Z0luKFRpbWVTcGFuKSB7XHJcbiAgICBUaW1lU3Bhbi5wcm90b3R5cGUudG9TbWFydFN0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU21hcnRTdHJpbmcoKSB7IHJldHVybiBzbWFydFRpbWUodGhpcyk7IH07XHJcbiAgICBUaW1lU3Bhbi5wcm90b3R5cGUucm91bmRUb1F1YXJ0ZXJIb3VyID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fcm91bmRUb1F1YXJ0ZXJIb3VyKCkgeyByZXR1cm4gcm91bmRUaW1lVG9RdWFydGVySG91ci5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpOyB9O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBzbWFydFRpbWU6IHNtYXJ0VGltZSxcclxuICAgICAgICByb3VuZFRvUXVhcnRlckhvdXI6IHJvdW5kVGltZVRvUXVhcnRlckhvdXIsXHJcbiAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgIH07XHJcbiIsIu+7vy8qKlxyXG4gICBBUEkgZm9yIGF1dG9tYXRpYyBjcmVhdGlvbiBvZiBsYWJlbHMgZm9yIFVJIFNsaWRlcnMgKGpxdWVyeS11aSlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICB0b29sdGlwcyA9IHJlcXVpcmUoJy4vdG9vbHRpcHMnKSxcclxuICAgIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKSxcclxuICAgIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbi8qKiBDcmVhdGUgbGFiZWxzIGZvciBhIGpxdWVyeS11aS1zbGlkZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjcmVhdGUoc2xpZGVyKSB7XHJcbiAgICAvLyByZW1vdmUgb2xkIG9uZXM6XHJcbiAgICB2YXIgb2xkID0gc2xpZGVyLnNpYmxpbmdzKCcudWktc2xpZGVyLWxhYmVscycpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlcicpLmdldCgwKSA9PSBzbGlkZXIuZ2V0KDApKTtcclxuICAgIH0pLnJlbW92ZSgpO1xyXG4gICAgLy8gQ3JlYXRlIGxhYmVscyBjb250YWluZXJcclxuICAgIHZhciBsYWJlbHMgPSAkKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLWxhYmVsc1wiLz4nKTtcclxuICAgIGxhYmVscy5kYXRhKCd1aS1zbGlkZXInLCBzbGlkZXIpO1xyXG5cclxuICAgIC8vIFNldHVwIG9mIHVzZWZ1bCB2YXJzIGZvciBsYWJlbCBjcmVhdGlvblxyXG4gICAgdmFyIG1heCA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdtYXgnKSxcclxuICAgICAgICBtaW4gPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnbWluJyksXHJcbiAgICAgICAgc3RlcCA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdzdGVwJyksXHJcbiAgICAgICAgc3RlcHMgPSBNYXRoLmZsb29yKChtYXggLSBtaW4pIC8gc3RlcCk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgYW5kIHBvc2l0aW9uaW5nIGxhYmVsc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gc3RlcHM7IGkrKykge1xyXG4gICAgICAgIC8vIENyZWF0ZSBsYWJlbFxyXG4gICAgICAgIHZhciBsYmwgPSAkKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLWxhYmVsXCI+PHNwYW4gY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWwtdGV4dFwiLz48L2Rpdj4nKTtcclxuICAgICAgICAvLyBTZXR1cCBsYWJlbCB3aXRoIGl0cyB2YWx1ZVxyXG4gICAgICAgIHZhciBsYWJlbFZhbHVlID0gbWluICsgaSAqIHN0ZXA7XHJcbiAgICAgICAgbGJsLmNoaWxkcmVuKCcudWktc2xpZGVyLWxhYmVsLXRleHQnKS50ZXh0KGxhYmVsVmFsdWUpO1xyXG4gICAgICAgIGxibC5kYXRhKCd1aS1zbGlkZXItdmFsdWUnLCBsYWJlbFZhbHVlKTtcclxuICAgICAgICAvLyBQb3NpdGlvbmF0ZVxyXG4gICAgICAgIHBvc2l0aW9uYXRlKGxibCwgaSwgc3RlcHMpO1xyXG4gICAgICAgIC8vIEFkZCB0byBjb250YWluZXJcclxuICAgICAgICBsYWJlbHMuYXBwZW5kKGxibCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlciBmb3IgbGFiZWxzIGNsaWNrIHRvIHNlbGVjdCBpdHMgcG9zaXRpb24gdmFsdWVcclxuICAgIGxhYmVscy5vbignY2xpY2snLCAnLnVpLXNsaWRlci1sYWJlbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsID0gJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXItdmFsdWUnKSxcclxuICAgICAgICAgICAgc2xpZGVyID0gJCh0aGlzKS5wYXJlbnQoKS5kYXRhKCd1aS1zbGlkZXInKTtcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHZhbCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbnNlcnQgbGFiZWxzIGFzIGEgc2libGluZyBvZiB0aGUgc2xpZGVyIChjYW5ub3QgYmUgaW5zZXJ0ZWQgaW5zaWRlKVxyXG4gICAgc2xpZGVyLmFmdGVyKGxhYmVscyk7XHJcbn1cclxuXHJcbi8qKiBQb3NpdGlvbmF0ZSB0byB0aGUgY29ycmVjdCBwb3NpdGlvbiBhbmQgd2lkdGggYW4gVUkgbGFiZWwgYXQgQGxibFxyXG5mb3IgdGhlIHJlcXVpcmVkIHBlcmNlbnRhZ2Utd2lkdGggQHN3XHJcbioqL1xyXG5mdW5jdGlvbiBwb3NpdGlvbmF0ZShsYmwsIGksIHN0ZXBzKSB7XHJcbiAgICB2YXIgc3cgPSAxMDAgLyBzdGVwcztcclxuICAgIHZhciBsZWZ0ID0gaSAqIHN3IC0gc3cgKiAwLjUsXHJcbiAgICAgICAgcmlnaHQgPSAxMDAgLSBsZWZ0IC0gc3csXHJcbiAgICAgICAgYWxpZ24gPSAnY2VudGVyJztcclxuICAgIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgYWxpZ24gPSAnbGVmdCc7XHJcbiAgICAgICAgbGVmdCA9IDA7XHJcbiAgICB9IGVsc2UgaWYgKGkgPT0gc3RlcHMpIHtcclxuICAgICAgICBhbGlnbiA9ICdyaWdodCc7XHJcbiAgICAgICAgcmlnaHQgPSAwO1xyXG4gICAgfVxyXG4gICAgbGJsLmNzcyh7XHJcbiAgICAgICAgJ3RleHQtYWxpZ24nOiBhbGlnbixcclxuICAgICAgICBsZWZ0OiBsZWZ0ICsgJyUnLFxyXG4gICAgICAgIHJpZ2h0OiByaWdodCArICclJ1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBVcGRhdGUgdGhlIHZpc2liaWxpdHkgb2YgbGFiZWxzIG9mIGEganF1ZXJ5LXVpLXNsaWRlciBkZXBlbmRpbmcgaWYgdGhleSBmaXQgaW4gdGhlIGF2YWlsYWJsZSBzcGFjZS5cclxuU2xpZGVyIG5lZWRzIHRvIGJlIHZpc2libGUuXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoc2xpZGVyKSB7XHJcbiAgICAvLyBHZXQgbGFiZWxzIGZvciBzbGlkZXJcclxuICAgIHZhciBsYWJlbHNfYyA9IHNsaWRlci5zaWJsaW5ncygnLnVpLXNsaWRlci1sYWJlbHMnKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXInKS5nZXQoMCkgPT0gc2xpZGVyLmdldCgwKSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBsYWJlbHMgPSBsYWJlbHNfYy5maW5kKCcudWktc2xpZGVyLWxhYmVsLXRleHQnKTtcclxuXHJcbiAgICAvLyBBcHBseSBhdXRvc2l6ZVxyXG4gICAgaWYgKChzbGlkZXIuZGF0YSgnc2xpZGVyLWF1dG9zaXplJykgfHwgZmFsc2UpLnRvU3RyaW5nKCkgPT0gJ3RydWUnKVxyXG4gICAgICAgIGF1dG9zaXplKHNsaWRlciwgbGFiZWxzKTtcclxuXHJcbiAgICAvLyBHZXQgYW5kIGFwcGx5IGxheW91dFxyXG4gICAgdmFyIGxheW91dF9uYW1lID0gc2xpZGVyLmRhdGEoJ3NsaWRlci1sYWJlbHMtbGF5b3V0JykgfHwgJ3N0YW5kYXJkJyxcclxuICAgICAgICBsYXlvdXQgPSBsYXlvdXRfbmFtZSBpbiBsYXlvdXRzID8gbGF5b3V0c1tsYXlvdXRfbmFtZV0gOiBsYXlvdXRzLnN0YW5kYXJkO1xyXG4gICAgbGFiZWxzX2MuYWRkQ2xhc3MoJ2xheW91dC0nICsgbGF5b3V0X25hbWUpO1xyXG4gICAgbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscyk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRvb2x0aXBzXHJcbiAgICB0b29sdGlwcy5jcmVhdGVUb29sdGlwKGxhYmVsc19jLmNoaWxkcmVuKCksIHtcclxuICAgICAgICB0aXRsZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJCh0aGlzKS50ZXh0KCk7IH1cclxuICAgICAgICAsIHBlcnNpc3RlbnQ6IHRydWVcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhdXRvc2l6ZShzbGlkZXIsIGxhYmVscykge1xyXG4gICAgdmFyIHRvdGFsX3dpZHRoID0gMDtcclxuICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0b3RhbF93aWR0aCArPSAkKHRoaXMpLm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBjID0gc2xpZGVyLmNsb3Nlc3QoJy51aS1zbGlkZXItY29udGFpbmVyJyksXHJcbiAgICAgICAgbWF4ID0gcGFyc2VGbG9hdChjLmNzcygnbWF4LXdpZHRoJykpLFxyXG4gICAgICAgIG1pbiA9IHBhcnNlRmxvYXQoYy5jc3MoJ21pbi13aWR0aCcpKTtcclxuICAgIGlmIChtYXggIT0gTnVtYmVyLk5hTiAmJiB0b3RhbF93aWR0aCA+IG1heClcclxuICAgICAgICB0b3RhbF93aWR0aCA9IG1heDtcclxuICAgIGlmIChtaW4gIT0gTnVtYmVyLk5hTiAmJiB0b3RhbF93aWR0aCA8IG1pbilcclxuICAgICAgICB0b3RhbF93aWR0aCA9IG1pbjtcclxuICAgIGMud2lkdGgodG90YWxfd2lkdGgpO1xyXG59XHJcblxyXG4vKiogU2V0IG9mIGRpZmZlcmVudCBsYXlvdXRzIGZvciBsYWJlbHMsIGFsbG93aW5nIGRpZmZlcmVudCBraW5kcyBvZiBcclxucGxhY2VtZW50IGFuZCB2aXN1YWxpemF0aW9uIHVzaW5nIHRoZSBzbGlkZXIgZGF0YSBvcHRpb24gJ2xhYmVscy1sYXlvdXQnLlxyXG5Vc2VkIGJ5ICd1cGRhdGUnLCBhbG1vc3QgdGhlICdzdGFuZGFyZCcgbXVzdCBleGlzdCBhbmQgY2FuIGJlIGluY3JlYXNlZFxyXG5leHRlcm5hbGx5XHJcbioqL1xyXG52YXIgbGF5b3V0cyA9IHt9O1xyXG4vKiogU2hvdyB0aGUgbWF4aW11bSBudW1iZXIgb2YgbGFiZWxzIGluIGVxdWFsbHkgc2l6ZWQgZ2FwcyBidXRcclxudGhlIGxhc3QgbGFiZWwgdGhhdCBpcyBlbnN1cmVkIHRvIGJlIHNob3dlZCBldmVuIGlmIGl0IGNyZWF0ZXNcclxuYSBoaWdoZXIgZ2FwIHdpdGggdGhlIHByZXZpb3VzIG9uZS5cclxuKiovXHJcbmxheW91dHMuc3RhbmRhcmQgPSBmdW5jdGlvbiBzdGFuZGFyZF9sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGVyZSBhcmUgbW9yZSBsYWJlbHMgdGhhbiBhdmFpbGFibGUgc3BhY2VcclxuICAgIC8vIEdldCBtYXhpbXVtIGxhYmVsIHdpZHRoXHJcbiAgICB2YXIgaXRlbV93aWR0aCA9IDA7XHJcbiAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHR3ID0gJCh0aGlzKS5vdXRlcldpZHRoKHRydWUpO1xyXG4gICAgICAgIGlmICh0dyA+PSBpdGVtX3dpZHRoKVxyXG4gICAgICAgICAgICBpdGVtX3dpZHRoID0gdHc7XHJcbiAgICB9KTtcclxuICAgIC8vIElmIHRoZXJlIGlzIHdpZHRoLCBpZiBub3QsIGVsZW1lbnQgaXMgbm90IHZpc2libGUgY2Fubm90IGJlIGNvbXB1dGVkXHJcbiAgICBpZiAoaXRlbV93aWR0aCA+IDApIHtcclxuICAgICAgICAvLyBHZXQgdGhlIHJlcXVpcmVkIHN0ZXBwaW5nIG9mIGxhYmVsc1xyXG4gICAgICAgIHZhciBsYWJlbHNfc3RlcCA9IE1hdGguY2VpbChpdGVtX3dpZHRoIC8gKHNsaWRlci53aWR0aCgpIC8gbGFiZWxzLmxlbmd0aCkpLFxyXG4gICAgICAgIGxhYmVsc19zdGVwcyA9IGxhYmVscy5sZW5ndGggLyBsYWJlbHNfc3RlcDtcclxuICAgICAgICBpZiAobGFiZWxzX3N0ZXAgPiAxKSB7XHJcbiAgICAgICAgICAgIC8vIEhpZGUgdGhlIGxhYmVscyBvbiBwb3NpdGlvbnMgb3V0IG9mIHRoZSBzdGVwXHJcbiAgICAgICAgICAgIHZhciBuZXdpID0gMCxcclxuICAgICAgICAgICAgICAgIGxpbWl0ID0gbGFiZWxzLmxlbmd0aCAtIDEgLSBsYWJlbHNfc3RlcDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYWJlbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBsYmwgPSAkKGxhYmVsc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKGkgKyAxKSA8IGxhYmVscy5sZW5ndGggJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgIGkgJSBsYWJlbHNfc3RlcCB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGkgPiBsaW1pdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgbGJsLmhpZGUoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvd1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYmwuc2hvdygpLnBhcmVudCgpLmFkZENsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwb3NpdGlvbmF0ZSBwYXJlbnRcclxuICAgICAgICAgICAgICAgICAgICAvLyBwb3NpdGlvbmF0ZShwYXJlbnQsIG5ld2ksIGxhYmVsc19zdGVwcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aSsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4vKiogU2hvdyBsYWJlbHMgbnVtYmVyIHZhbHVlcyBmb3JtYXR0ZWQgYXMgaG91cnMsIHdpdGggb25seVxyXG5pbnRlZ2VyIGhvdXJzIGJlaW5nIHNob3dlZCwgdGhlIG1heGltdW0gbnVtYmVyIG9mIGl0LlxyXG4qKi9cclxubGF5b3V0cy5ob3VycyA9IGZ1bmN0aW9uIGhvdXJzX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMsIHNob3dfYWxsKSB7XHJcbiAgICB2YXIgaW50TGFiZWxzID0gc2xpZGVyLmZpbmQoJy5pbnRlZ2VyLWhvdXInKTtcclxuICAgIGlmICghaW50TGFiZWxzLmxlbmd0aCkge1xyXG4gICAgICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdob3VyLXByb2Nlc3NlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHBhcnNlRmxvYXQoJHQudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgIGlmICh2ICE9IE51bWJlci5OYU4pIHtcclxuICAgICAgICAgICAgICAgICAgICB2ID0gbXUucm91bmRUbyh2LCAyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodiAlIDEgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdkZWNpbWFsLWhvdXInKS5oaWRlKCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYgJSAwLjUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5wYXJlbnQoKS5hZGRDbGFzcygnc3Ryb25nJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LnRleHQoVGltZVNwYW4uZnJvbUhvdXJzKHYpLnRvU2hvcnRTdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2ludGVnZXItaG91cicpLnNob3coKS5wYXJlbnQoKS5hZGRDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnRMYWJlbHMgPSBpbnRMYWJlbHMuYWRkKCR0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdob3VyLXByb2Nlc3NlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAoc2hvd19hbGwgIT09IHRydWUpXHJcbiAgICAgICAgbGF5b3V0cy5zdGFuZGFyZChzbGlkZXIsIGludExhYmVscy5wYXJlbnQoKSwgaW50TGFiZWxzKTtcclxufTtcclxubGF5b3V0c1snYWxsLXZhbHVlcyddID0gZnVuY3Rpb24gYWxsX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpIHtcclxuICAgIC8vIFNob3dpbmcgYWxsIGxhYmVsc1xyXG4gICAgbGFiZWxzX2Muc2hvdygpLmFkZENsYXNzKCd2aXNpYmxlJykuY2hpbGRyZW4oKS5zaG93KCk7XHJcbn07XHJcbmxheW91dHNbJ2FsbC1ob3VycyddID0gZnVuY3Rpb24gYWxsX2hvdXJzX2xheW91dCgpIHtcclxuICAgIC8vIEp1c3QgdXNlIGhvdXJzIGxheW91dCBidXQgc2hvd2luZyBhbGwgaW50ZWdlciBob3Vyc1xyXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2guY2FsbChhcmd1bWVudHMsIHRydWUpO1xyXG4gICAgbGF5b3V0cy5ob3Vycy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjcmVhdGU6IGNyZWF0ZSxcclxuICAgIHVwZGF0ZTogdXBkYXRlLFxyXG4gICAgbGF5b3V0czogbGF5b3V0c1xyXG59O1xyXG4iLCLvu78vKiBTZXQgb2YgY29tbW9uIExDIGNhbGxiYWNrcyBmb3IgbW9zdCBBamF4IG9wZXJhdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gQUtBOiBhamF4RXJyb3JQb3B1cEhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkVycm9yKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgLy8gSWYgaXMgYSBjb25uZWN0aW9uIGFib3J0ZWQsIG5vIHNob3cgbWVzc2FnZS5cclxuICAgIC8vIHJlYWR5U3RhdGUgZGlmZmVyZW50IHRvICdkb25lOjQnIG1lYW5zIGFib3J0ZWQgdG9vLCBcclxuICAgIC8vIGJlY2F1c2Ugd2luZG93IGJlaW5nIGNsb3NlZC9sb2NhdGlvbiBjaGFuZ2VkXHJcbiAgICBpZiAobWVzc2FnZSA9PSAnYWJvcnQnIHx8IGp4LnJlYWR5U3RhdGUgIT0gNClcclxuICAgICAgICByZXR1cm47XHJcblxyXG4gICAgdmFyIG0gPSBtZXNzYWdlO1xyXG4gICAgdmFyIGlmcmFtZSA9IG51bGw7XHJcbiAgICBzaXplID0gcG9wdXAuc2l6ZSgnbGFyZ2UnKTtcclxuICAgIHNpemUuaGVpZ2h0IC09IDM0O1xyXG4gICAgaWYgKG0gPT0gJ2Vycm9yJykge1xyXG4gICAgICAgIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShqeC5yZXNwb25zZVRleHQsIHNpemUpO1xyXG4gICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgbSA9IG51bGw7XHJcbiAgICB9ICBlbHNlXHJcbiAgICAgICAgbSA9IG0gKyBcIjsgXCIgKyBleDtcclxuXHJcbiAgICAvLyBCbG9jayBhbGwgd2luZG93LCBub3Qgb25seSBjdXJyZW50IGVsZW1lbnRcclxuICAgICQuYmxvY2tVSShlcnJvckJsb2NrKG0sIG51bGwsIHBvcHVwLnN0eWxlKHNpemUpKSk7XHJcbiAgICBpZiAoaWZyYW1lKVxyXG4gICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgJCgnLmJsb2NrVUkgLmNsb3NlLXBvcHVwJykuY2xpY2soZnVuY3Rpb24gKCkgeyAkLnVuYmxvY2tVSSgpOyByZXR1cm4gZmFsc2U7IH0pO1xyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uQ29tcGxldGUoKSB7XHJcbiAgICAvLyBEaXNhYmxlIGxvYWRpbmdcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxvYWRpbmd0aW1lciB8fCB0aGlzLmxvYWRpbmdUaW1lcik7XHJcbiAgICAvLyBVbmJsb2NrXHJcbiAgICBpZiAodGhpcy5hdXRvVW5ibG9ja0xvYWRpbmcpIHtcclxuICAgICAgICAvLyBEb3VibGUgdW4tbG9jaywgYmVjYXVzZSBhbnkgb2YgdGhlIHR3byBzeXN0ZW1zIGNhbiBiZWluZyB1c2VkOlxyXG4gICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuYm94KTtcclxuICAgICAgICB0aGlzLmJveC51bmJsb2NrKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXJcclxuZnVuY3Rpb24gbGNPblN1Y2Nlc3MoZGF0YSwgdGV4dCwgangpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgLy8gU3VwcG9ydGVkIHRoZSBnZW5lcmljIGN0eC5lbGVtZW50IGZyb20ganF1ZXJ5LnJlbG9hZFxyXG4gICAgaWYgKGN0eC5lbGVtZW50KSBjdHguZm9ybSA9IGN0eC5lbGVtZW50O1xyXG4gICAgLy8gU3BlY2lmaWMgc3R1ZmYgb2YgYWpheEZvcm1zXHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIERvIEpTT04gYWN0aW9uIGJ1dCBpZiBpcyBub3QgSlNPTiBvciB2YWxpZCwgbWFuYWdlIGFzIEhUTUw6XHJcbiAgICBpZiAoIWRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgLy8gQXZvaWQgZW1wdHkgZG9jdW1lbnRzIGJlaW5nIHBhcnNlZCAocmFpc2UgZXJyb3IpXHJcbiAgICAgICAgaWYgKCQudHJpbShkYXRhKSkge1xyXG4gICAgICAgICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYSBtYWxmb3JtZWQgZG9jdW1lbnQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGb3IgJ3JlbG9hZCcgc3VwcG9ydCwgY2hlY2sgdG9vIHRoZSBjb250ZXh0Lm1vZGUsIGFuZCBib3RoIHJlbG9hZCBvciBhamF4Rm9ybXMgY2hlY2sgZGF0YSBhdHRyaWJ1dGUgdG9vXHJcbiAgICAgICAgY3R4LmJveElzQ29udGFpbmVyID0gY3R4LmJveElzQ29udGFpbmVyO1xyXG4gICAgICAgIHZhciByZXBsYWNlQm94Q29udGVudCA9XHJcbiAgICAgICAgICAoY3R4Lm9wdGlvbnMgJiYgY3R4Lm9wdGlvbnMubW9kZSA9PT0gJ3JlcGxhY2UtY29udGVudCcpIHx8XHJcbiAgICAgICAgICBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnO1xyXG5cclxuICAgICAgICAvLyBTdXBwb3J0IGZvciByZWxvYWQsIGF2b2lkaW5nIGltcG9ydGFudCBidWdzIHdpdGggcmVsb2FkaW5nIGJveGVzIHRoYXQgY29udGFpbnMgZm9ybXM6XHJcbiAgICAgICAgLy8gSWYgb3BlcmF0aW9uIGlzIGEgcmVsb2FkLCBkb24ndCBjaGVjayB0aGUgYWpheC1ib3hcclxuICAgICAgICB2YXIgamIgPSBuZXdodG1sO1xyXG4gICAgICAgIGlmICghY3R4LmlzUmVsb2FkKSB7XHJcbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgcmV0dXJuZWQgZWxlbWVudCBpcyB0aGUgYWpheC1ib3gsIGlmIG5vdCwgZmluZFxyXG4gICAgICAgICAgLy8gdGhlIGVsZW1lbnQgaW4gdGhlIG5ld2h0bWw6XHJcbiAgICAgICAgICBqYiA9IG5ld2h0bWwuZmlsdGVyKCcuYWpheC1ib3gnKTtcclxuICAgICAgICAgIGlmIChqYi5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICAgIGlmICghY3R4LmJveElzQ29udGFpbmVyICYmICFqYi5pcygnLmFqYXgtYm94JykpXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbC5maW5kKCcuYWpheC1ib3g6ZXEoMCknKTtcclxuICAgICAgICAgIGlmICghamIgfHwgamIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGFqYXgtYm94LCB1c2UgYWxsIGVsZW1lbnQgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpXHJcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIGJveCBjb250ZW50IHdpdGggdGhlIGNvbnRlbnQgb2YgdGhlIHJldHVybmVkIGJveFxyXG4gICAgICAgICAgICAvLyBvciBhbGwgaWYgdGhlcmUgaXMgbm8gYWpheC1ib3ggaW4gdGhlIHJlc3VsdC5cclxuICAgICAgICAgICAgamIgPSBqYi5pcygnLmFqYXgtYm94JykgPyBqYi5jb250ZW50cygpIDogamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpIHtcclxuICAgICAgICAgIGN0eC5ib3guZW1wdHkoKS5hcHBlbmQoamIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY3R4LmJveElzQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIC8vIGpiIGlzIGNvbnRlbnQgb2YgdGhlIGJveCBjb250YWluZXI6XHJcbiAgICAgICAgICAgIGN0eC5ib3guaHRtbChqYik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gYm94IGlzIGNvbnRlbnQgdGhhdCBtdXN0IGJlIHJlcGxhY2VkIGJ5IHRoZSBuZXcgY29udGVudDpcclxuICAgICAgICAgICAgY3R4LmJveC5yZXBsYWNlV2l0aChqYik7XHJcbiAgICAgICAgICAgIC8vIGFuZCByZWZyZXNoIHRoZSByZWZlcmVuY2UgdG8gYm94IHdpdGggdGhlIG5ldyBlbGVtZW50XHJcbiAgICAgICAgICAgIGN0eC5ib3ggPSBqYjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEl0IHN1cHBvcnRzIG5vcm1hbCBhamF4IGZvcm1zIGFuZCBzdWJmb3JtcyB0aHJvdWdoIGZpZWxkc2V0LmFqYXhcclxuICAgICAgICBpZiAoY3R4LmJveC5pcygnZm9ybS5hamF4JykgfHwgY3R4LmJveC5pcygnZmllbGRzZXQuYWpheCcpKVxyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94O1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2Zvcm0uYWpheDplcSgwKScpO1xyXG4gICAgICAgICAgaWYgKGN0eC5mb3JtLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2ZpZWxkc2V0LmFqYXg6ZXEoMCknKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKFxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50c1xyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBNb3ZlIGZvY3VzIHRvIHRoZSBlcnJvcnMgYXBwZWFyZWQgb24gdGhlIHBhZ2UgKGlmIHRoZXJlIGFyZSk6XHJcbiAgICAgICAgdmFyIHZhbGlkYXRpb25TdW1tYXJ5ID0gamIuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKTtcclxuICAgICAgICBpZiAodmFsaWRhdGlvblN1bW1hcnkubGVuZ3RoKVxyXG4gICAgICAgICAgbW92ZUZvY3VzVG8odmFsaWRhdGlvblN1bW1hcnkpO1xyXG4gICAgICAgIC8vIFRPRE86IEl0IHNlZW1zIHRoYXQgaXQgcmV0dXJucyBhIGRvY3VtZW50LWZyYWdtZW50IGluc3RlYWQgb2YgYSBlbGVtZW50IGFscmVhZHkgaW4gZG9jdW1lbnRcclxuICAgICAgICAvLyBmb3IgY3R4LmZvcm0gKG1heWJlIGpiIHRvbz8pIHdoZW4gdXNpbmcgKiBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnICogXHJcbiAgICAgICAgLy8gKG1heWJlIG9uIG90aGVyIGNhc2VzIHRvbz8pLlxyXG4gICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgW2piLCBjdHguZm9ybSwganhdKTtcclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IGN0eC5mb3JtLmRhdGEoJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJykgfHwgJ0RvbmUhJztcclxuICAgIGN0eC5ib3guYmxvY2soaW5mb0Jsb2NrKG1lc3NhZ2UsIHtcclxuICAgICAgICBjc3M6IHBvcHVwLnN0eWxlKHBvcHVwLnNpemUoJ3NtYWxsJykpXHJcbiAgICB9KSlcclxuICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyBcclxuICAgIH0pO1xyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcblxyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2IGNsYXNzPVwib2stZ28tYm94XCIvPicpO1xyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPHNwYW4gY2xhc3M9XCJzdWNjZXNzLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuU3VjY2Vzc01lc3NhZ2UpKTtcclxuICAgIGlmIChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKVxyXG4gICAgICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhZGRpdGlvbmFsLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpKTtcclxuXHJcbiAgICB2YXIgb2tCdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBvay1hY3Rpb24gY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNva1wiLz4nKS5hcHBlbmQoZGF0YS5Pa0xhYmVsKTtcclxuICAgIHZhciBnb0J0biA9ICcnO1xyXG4gICAgaWYgKGRhdGEuR29VUkwgJiYgZGF0YS5Hb0xhYmVsKSB7XHJcbiAgICAgICAgZ29CdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBnby1hY3Rpb25cIi8+JykuYXR0cignaHJlZicsIGRhdGEuR29VUkwpLmFwcGVuZChkYXRhLkdvTGFiZWwpO1xyXG4gICAgICAgIC8vIEZvcmNpbmcgdGhlICdjbG9zZS1hY3Rpb24nIGluIHN1Y2ggYSB3YXkgdGhhdCBmb3IgaW50ZXJuYWwgbGlua3MgdGhlIHBvcHVwIGdldHMgY2xvc2VkIGluIGEgc2FmZSB3YXk6XHJcbiAgICAgICAgZ29CdG4uY2xpY2soZnVuY3Rpb24gKCkgeyBva0J0bi5jbGljaygpOyBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pOyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWN0aW9ucyBjbGVhcmZpeFwiLz4nKS5hcHBlbmQob2tCdG4pLmFwcGVuZChnb0J0bikpO1xyXG5cclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY3R4LmJveCwgbnVsbCwge1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkge1xyXG4gICAgLy8gSWYgaXMgYSBKU09OIHJlc3VsdDpcclxuICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGlmIChjdHguYm94KVxyXG4gICAgICAgICAgICAvLyBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9yc1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChjdHguYm94KTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMDogZ2VuZXJhbCBzdWNjZXNzIGNvZGUsIHNob3cgbWVzc2FnZSBzYXlpbmcgdGhhdCAnYWxsIHdhcyBmaW5lJ1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdCwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMTogZG8gYSByZWRpcmVjdFxyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDEpIHtcclxuICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMjogc2hvdyBsb2dpbiBwb3B1cCAod2l0aCB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMzogcmVsb2FkIGN1cnJlbnQgcGFnZSBjb250ZW50IHRvIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIC8vIE5vdGU6IHRvIHJlbG9hZCBzYW1lIHVybCBwYWdlIGNvbnRlbnQsIGlzIGJldHRlciByZXR1cm4gdGhlIGh0bWwgZGlyZWN0bHkgZnJvbVxyXG4gICAgICAgICAgICAvLyB0aGlzIGFqYXggc2VydmVyIHJlcXVlc3QuXHJcbiAgICAgICAgICAgIC8vY29udGFpbmVyLnVuYmxvY2soKTsgaXMgYmxvY2tlZCBhbmQgdW5ibG9ja2VkIGFnYWluIGJ5IHRoZSByZWxvYWQgbWV0aG9kOlxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVsb2FkKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA0KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgU3VjY2Vzc01lc3NhZ2UsIGF0dGFjaGluZyBhbmQgZXZlbnQgaGFuZGxlciB0byBnbyB0byBSZWRpcmVjdFVSTFxyXG4gICAgICAgICAgICBjdHguYm94Lm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdC5SZWRpcmVjdFVSTCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5TdWNjZXNzTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNSkge1xyXG4gICAgICAgICAgICAvLyBDaGFuZ2UgbWFpbi1hY3Rpb24gYnV0dG9uIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBidG4gPSBjdHguZm9ybS5maW5kKCcubWFpbi1hY3Rpb24nKTtcclxuICAgICAgICAgICAgdmFyIGRtc2cgPSBidG4uZGF0YSgnZGVmYXVsdC10ZXh0Jyk7XHJcbiAgICAgICAgICAgIGlmICghZG1zZylcclxuICAgICAgICAgICAgICAgIGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnLCBidG4udGV4dCgpKTtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGRhdGEuUmVzdWx0IHx8IGJ0bi5kYXRhKCdzdWNjZXNzLXBvc3QtdGV4dCcpIHx8ICdEb25lISc7XHJcbiAgICAgICAgICAgIGJ0bi50ZXh0KG1zZyk7XHJcbiAgICAgICAgICAgIC8vIEFkZGluZyBzdXBwb3J0IHRvIHJlc2V0IGJ1dHRvbiB0ZXh0IHRvIGRlZmF1bHQgb25lXHJcbiAgICAgICAgICAgIC8vIHdoZW4gdGhlIEZpcnN0IG5leHQgY2hhbmdlcyBoYXBwZW5zIG9uIHRoZSBmb3JtOlxyXG4gICAgICAgICAgICAkKGN0eC5mb3JtKS5vbmUoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBidG4udGV4dChidG4uZGF0YSgnZGVmYXVsdC10ZXh0JykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBmb3IgY3VzdG9tIGhhbmRsZXJzXHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gT2stR28gYWN0aW9ucyBwb3B1cCB3aXRoICdzdWNjZXNzJyBhbmQgJ2FkZGl0aW9uYWwnIG1lc3NhZ2VzLlxyXG4gICAgICAgICAgICBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA3KSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSA3OiBzaG93IG1lc3NhZ2Ugc2F5aW5nIGNvbnRhaW5lZCBhdCBkYXRhLlJlc3VsdC5NZXNzYWdlLlxyXG4gICAgICAgICAgICAvLyBUaGlzIGNvZGUgYWxsb3cgYXR0YWNoIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gaW4gZGF0YS5SZXN1bHQgdG8gZGlzdGluZ3Vpc2hcclxuICAgICAgICAgICAgLy8gZGlmZmVyZW50IHJlc3VsdHMgYWxsIHNob3dpbmcgYSBtZXNzYWdlIGJ1dCBtYXliZSBub3QgYmVpbmcgYSBzdWNjZXNzIGF0IGFsbFxyXG4gICAgICAgICAgICAvLyBhbmQgbWF5YmUgZG9pbmcgc29tZXRoaW5nIG1vcmUgaW4gdGhlIHRyaWdnZXJlZCBldmVudCB3aXRoIHRoZSBkYXRhIG9iamVjdC5cclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDgpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyB2YWxpZGF0aW9uIG1lc3NhZ2VzXHJcbiAgICAgICAgICAgIHZhciB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyk7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb25IZWxwZXIuc2V0RXJyb3JzKGN0eC5mb3JtLCBkYXRhLlJlc3VsdC5FcnJvcnMpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICAgIC8vIFVzZXIgQ29kZTogdHJpZ2dlciBjdXN0b20gZXZlbnQgdG8gbWFuYWdlIHJlc3VsdHM6XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeCwgY3R4XSk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gZGF0YS5Db2RlIDwgMFxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhbiBlcnJvciBjb2RlLlxyXG5cclxuICAgICAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybS5nZXQoMCksIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgICAgICAgICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IFwiRXJyb3I6IFwiICsgZGF0YS5Db2RlICsgXCI6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YS5SZXN1bHQgPyAoZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlIDogZGF0YS5SZXN1bHQpIDogJycpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCQoJzxkaXYvPicpLmFwcGVuZChtZXNzYWdlKSwgY3R4LmJveCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXJyb3I6IGxjT25FcnJvcixcclxuICAgICAgICBzdWNjZXNzOiBsY09uU3VjY2VzcyxcclxuICAgICAgICBjb21wbGV0ZTogbGNPbkNvbXBsZXRlLFxyXG4gICAgICAgIGRvSlNPTkFjdGlvbjogZG9KU09OQWN0aW9uXHJcbiAgICB9O1xyXG59Iiwi77u/LyogRm9ybXMgc3VibWl0dGVkIHZpYSBBSkFYICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyksXHJcbiAgICB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyk7XHJcblxyXG5qUXVlcnkgPSAkO1xyXG5cclxuLy8gR2xvYmFsIHNldHRpbmdzLCB3aWxsIGJlIHVwZGF0ZWQgb24gaW5pdCBidXQgaXMgYWNjZXNzZWRcclxuLy8gdGhyb3VnaCBjbG9zdXJlIGZyb20gYWxsIGZ1bmN0aW9ucy5cclxuLy8gTk9URTogaXMgc3RhdGljLCBkb2Vzbid0IGFsbG93cyBtdWx0aXBsZSBjb25maWd1cmF0aW9uLCBvbmUgaW5pdCBjYWxsIHJlcGxhY2UgcHJldmlvdXNcclxuLy8gRGVmYXVsdHM6XHJcbnZhciBzZXR0aW5ncyA9IHtcclxuICAgIGxvYWRpbmdEZWxheTogMCxcclxuICAgIGVsZW1lbnQ6IGRvY3VtZW50XHJcbn07XHJcblxyXG4vLyBBZGFwdGVkIGNhbGxiYWNrc1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXIoKSB7XHJcbiAgICBjYWxsYmFja3MuY29tcGxldGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEVycm9yUG9wdXBIYW5kbGVyKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gQ29tbW9uIGxvZ2ljXHJcbiAgICBjYWxsYmFja3MuZXJyb3IuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlcigpIHtcclxuICBjYWxsYmFja3Muc3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG4vKipcclxuICBQZXJmb3JtcyB0aGUgdmFsaWRhdGlvbiBvbiB0aGUgZm9ybSBvciBzdWJmb3JtIGFzIGRldGVybWluZVxyXG4gIHRoZSB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgKEBjdHgpLCByZXR1cm5pbmcgdHJ1ZSBmb3Igc3VjY2Vzc1xyXG4gIGFuZCBmYWxzZSBmb3Igc29tZSBlcnJvciAoZWxlbWVudHMgZ2V0IG1hcmtlZCB3aXRoIHRoZSBlcnJvcixcclxuICBqdXN0IHRoZSBjYWxsZXIgbXVzdCBzdG9wIGFueSB0YXNrIG9uIGZhbHNlKS5cclxuKiovXHJcbmZ1bmN0aW9uIHZhbGlkYXRlRm9ybShjdHgpIHtcclxuICAvLyBWYWxpZGF0aW9uc1xyXG4gIHZhciB2YWxpZGF0aW9uUGFzc2VkID0gdHJ1ZTtcclxuICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3JtcyB0aHJvdWggZmllbGRzZXQuYWpheCwgd2UgbXVzdCBleGVjdXRlIHZhbGlkYXRpb25zIGFuZCB2ZXJpZmljYXRpb25cclxuICAvLyBpbiB0d28gc3RlcHMgYW5kIHVzaW5nIHRoZSByZWFsIGZvcm0gdG8gbGV0IHZhbGlkYXRpb24gbWVjaGFuaXNtIHdvcmtcclxuICB2YXIgaXNTdWJmb3JtID0gY3R4LmZvcm0uaXMoJ2ZpZWxkc2V0LmFqYXgnKTtcclxuICB2YXIgYWN0dWFsRm9ybSA9IGlzU3ViZm9ybSA/IGN0eC5mb3JtLmNsb3Nlc3QoJ2Zvcm0nKSA6IGN0eC5mb3JtLFxyXG4gICAgICBkaXNhYmxlZFN1bW1hcmllcyA9IG5ldyBqUXVlcnkoKSxcclxuICAgICAgZGlzYWJsZWRGaWVsZHMgPSBuZXcgalF1ZXJ5KCk7XHJcblxyXG4gIC8vIE9uIHN1YmZvcm0gdmFsaWRhdGlvbiwgd2UgZG9uJ3Qgd2FudCB0aGUgb3V0c2lkZSBzdWJmb3JtIGVsZW1lbnRzIGFuZCB2YWxpZGF0aW9uLXN1bW1hcnkgY29udHJvbHMgdG8gYmUgYWZmZWN0ZWRcclxuICAvLyBieSB0aGlzIHZhbGlkYXRpb24gKHRvIGF2b2lkIHRvIHNob3cgZXJyb3JzIHRoZXJlIHRoYXQgZG9lc24ndCBpbnRlcmVzdCB0byB0aGUgcmVzdCBvZiB0aGUgZm9ybSlcclxuICAvLyBUbyBmdWxsZmlsbCB0aGlzIHJlcXVpc2l0LCB3ZSBuZWVkIHRvIGhpZGUgaXQgZm9yIHRoZSB2YWxpZGF0b3IgZm9yIGEgd2hpbGUgYW5kIGxldCBvbmx5IGFmZmVjdFxyXG4gIC8vIGFueSBsb2NhbCBzdW1tYXJ5IChpbnNpZGUgdGhlIHN1YmZvcm0pLlxyXG4gIC8vIFRoZSBzYW1lIGZvciBmb3JtIGVsZW1lbnRzIG91dHNpZGUgdGhlIHN1YmZvcm0sIHdlIGRvbid0IHdhbnQgaXRzIGVycm9ycyBmb3Igbm93LlxyXG4gIGlmIChpc1N1YmZvcm0pIHtcclxuICAgIHZhciBvdXRzaWRlRWxlbWVudHMgPSAoZnVuY3Rpb24oZikge1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIE9ubHkgdGhvc2UgdGhhdCBhcmUgb3V0c2lkZSB0aGUgc3ViZm9ybVxyXG4gICAgICAgIHJldHVybiAhJC5jb250YWlucyhmLCB0aGlzKTtcclxuICAgICAgfTtcclxuICAgIH0pKGN0eC5mb3JtLmdldCgwKSk7XHJcblxyXG4gICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBhY3R1YWxGb3JtXHJcbiAgICAuZmluZCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nKVxyXG4gICAgLmZpbHRlcihvdXRzaWRlRWxlbWVudHMpXHJcbiAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAnZmFsc2UnKTtcclxuXHJcbiAgICBkaXNhYmxlZEZpZWxkcyA9IGFjdHVhbEZvcm1cclxuICAgIC5maW5kKCdbZGF0YS12YWw9dHJ1ZV0nKVxyXG4gICAgLmZpbHRlcihvdXRzaWRlRWxlbWVudHMpXHJcbiAgICAuYXR0cignZGF0YS12YWwnLCAnZmFsc2UnKTtcclxuICB9XHJcblxyXG4gIC8vIEZpcnN0IGF0IGFsbCwgaWYgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gIHZhciB2YWxvYmplY3QgPSBhY3R1YWxGb3JtLmRhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlLlxyXG4gIC8vIEN1c3RvbSB2YWxpZGF0aW9uIGNhbiBiZSBhdHRhY2hlZCB0byBmb3JtcyBvciBmaWVsZHNldCwgYnV0XHJcbiAgLy8gdG8gc3VwcG9ydCBzdWJmb3Jtcywgb25seSBleGVjdXRlIGluIHRoZSBjdHguZm9ybSBlbGVtZW50IChjYW4gYmUgXHJcbiAgLy8gYSBmaWVsc2V0IHN1YmZvcm0pIGFuZCBhbnkgY2hpbGRyZW4gZmllbGRzZXQuXHJcbiAgY3R4LmZvcm0uYWRkKGN0eC5mb3JtLmZpbmQoJ2ZpZWxkc2V0JykpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGN1c3ZhbCA9ICQodGhpcykuZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicpO1xyXG4gICAgaWYgKGN1c3ZhbCAmJiBjdXN2YWwudmFsaWRhdGUgJiYgY3VzdmFsLnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnMoY3R4LmZvcm0pO1xyXG4gICAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIFRvIHN1cHBvcnQgc3ViLWZvcm1zLCB3ZSBtdXN0IGNoZWNrIHRoYXQgdmFsaWRhdGlvbnMgZXJyb3JzIGhhcHBlbmVkIGluc2lkZSB0aGVcclxuICAvLyBzdWJmb3JtIGFuZCBub3QgaW4gb3RoZXIgZWxlbWVudHMsIHRvIGRvbid0IHN0b3Agc3VibWl0IG9uIG5vdCByZWxhdGVkIGVycm9ycy5cclxuICAvLyAod2UgYXZvaWQgZXhlY3V0ZSB2YWxpZGF0aW9uIG9uIHRoYXQgZWxlbWVudHMgYnV0IGNvdWxkIGhhcHBlbiBhIHByZXZpb3VzIHZhbGlkYXRpb24pXHJcbiAgLy8gSnVzdCBsb29rIGZvciBtYXJrZWQgZWxlbWVudHM6XHJcbiAgaWYgKGlzU3ViZm9ybSAmJiBjdHguZm9ybS5maW5kKCcuaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmxlbmd0aClcclxuICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuXHJcbiAgLy8gUmUtZW5hYmxlIGFnYWluIHRoYXQgc3VtbWFyaWVzIHByZXZpb3VzbHkgZGlzYWJsZWRcclxuICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgZGlzYWJsZWRTdW1tYXJpZXMuYXR0cignZGF0YS12YWxtc2ctc3VtbWFyeScsICd0cnVlJyk7XHJcbiAgICBkaXNhYmxlZEZpZWxkcy5hdHRyKCdkYXRhLXZhbCcsICd0cnVlJyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdmFsaWRhdGlvblBhc3NlZDtcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuKiBBamF4IEZvcm1zIGdlbmVyaWMgZnVuY3Rpb24uXHJcbiogUmVzdWx0IGV4cGVjdGVkIGlzOlxyXG4qIC0gaHRtbCwgZm9yIHZhbGlkYXRpb24gZXJyb3JzIGZyb20gc2VydmVyLCByZXBsYWNpbmcgY3VycmVudCAuYWpheC1ib3ggY29udGVudFxyXG4qIC0ganNvbiwgd2l0aCBzdHJ1Y3R1cmU6IHsgQ29kZTogaW50ZWdlci1udW1iZXIsIFJlc3VsdDogc3RyaW5nLW9yLW9iamVjdCB9XHJcbiogICBDb2RlIG51bWJlcnM6XHJcbiogICAgLSBOZWdhdGl2ZTogZXJyb3JzLCB3aXRoIGEgUmVzdWx0IG9iamVjdCB7IEVycm9yTWVzc2FnZTogc3RyaW5nIH1cclxuKiAgICAtIFplcm86IHN1Y2Nlc3MgcmVzdWx0LCBpdCBzaG93cyBhIG1lc3NhZ2Ugd2l0aCBjb250ZW50OiBSZXN1bHQgc3RyaW5nLCBlbHNlIGZvcm0gZGF0YSBhdHRyaWJ1dGUgJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJywgZWxzZSBhIGdlbmVyaWMgbWVzc2FnZVxyXG4qICAgIC0gMTogc3VjY2VzcyByZXN1bHQsIFJlc3VsdCBjb250YWlucyBhIFVSTCwgdGhlIHBhZ2Ugd2lsbCBiZSByZWRpcmVjdGVkIHRvIHRoYXQuXHJcbiogICAgLSBNYWpvciAxOiBzdWNjZXNzIHJlc3VsdCwgd2l0aCBjdXN0b20gaGFuZGxlciB0aHJvdWdodCB0aGUgZm9ybSBldmVudCAnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnLlxyXG4qL1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKGV2ZW50KSB7XHJcbiAgICAvLyBDb250ZXh0IHZhciwgdXNlZCBhcyBhamF4IGNvbnRleHQ6XHJcbiAgICB2YXIgY3R4ID0ge307XHJcbiAgICAvLyBEZWZhdWx0IGRhdGEgZm9yIHJlcXVpcmVkIHBhcmFtczpcclxuICAgIGN0eC5mb3JtID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmZvcm0gOiBudWxsKSB8fCAkKHRoaXMpO1xyXG4gICAgY3R4LmJveCA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5ib3ggOiBudWxsKSB8fCBjdHguZm9ybS5jbG9zZXN0KFwiLmFqYXgtYm94XCIpO1xyXG4gICAgdmFyIGFjdGlvbiA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5hY3Rpb24gOiBudWxsKSB8fCBjdHguZm9ybS5hdHRyKCdhY3Rpb24nKSB8fCAnJztcclxuXHJcbiAgICAvLyBDaGVjayB2YWxpZGF0aW9uXHJcbiAgICBpZiAodmFsaWRhdGVGb3JtKGN0eCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIC8vIFZhbGlkYXRpb24gZmFpbGVkLCBzdWJtaXQgY2Fubm90IGNvbnRpbnVlLCBvdXQhXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5jaGFuZ2VkRWxlbWVudHMgOiBudWxsKSB8fCBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBldmVudCB0byBhbGxvdyBzY3JpcHRzIHRvIGhvb2sgYWRkaXRpb25hbCB0YXNrcyBiZWZvcmUgc2VuZCBkYXRhXHJcbiAgICBjdHguZm9ybS50cmlnZ2VyKCdwcmVzdWJtaXQnLCBbY3R4XSk7XHJcblxyXG4gICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgIH0sIHNldHRpbmdzLmxvYWRpbmdEZWxheSk7XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICB2YXIgZGF0YSA9IGN0eC5mb3JtLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpO1xyXG5cclxuICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiAoYWN0aW9uKSxcclxuICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgc3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlcixcclxuICAgICAgICBjb21wbGV0ZTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTdG9wIG5vcm1hbCBQT1NUOlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBQdWJsaWMgaW5pdGlhbGl6YXRpb25cclxuZnVuY3Rpb24gaW5pdEFqYXhGb3JtcyhvcHRpb25zKSB7XHJcbiAgICAkLmV4dGVuZCh0cnVlLCBzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgdG8gbWFuYWdlIGFqYXggZm9ybXMgKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ3N1Ym1pdCcsICdmb3JtLmFqYXgnLCBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKTtcclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIGZvciBhIHNwZWNpYWwgYWpheCBmb3JtIGNhc2U6IHN1YmZvcm1zLCB1c2luZyBmaWVsZHNldHMuICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdjbGljaycsICdmaWVsZHNldC5hamF4IC5hamF4LWZpZWxkc2V0LXN1Ym1pdCcsXHJcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG5cclxuICAgICAgICAgIGV2ZW50LmRhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm06IGZvcm0sXHJcbiAgICAgICAgICAgIGJveDogZm9ybS5jbG9zZXN0KCcuYWpheC1ib3gnKSxcclxuICAgICAgICAgICAgYWN0aW9uOiBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGNoYW5nZWRFbGVtZW50czogY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCksIGZvcm0uZmluZCgnOmlucHV0W25hbWVdJykpXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuLyogVU5VU0VEP1xyXG5mdW5jdGlvbiBhamF4Rm9ybU1lc3NhZ2VPbkh0bWxSZXR1cm5lZFdpdGhvdXRWYWxpZGF0aW9uRXJyb3JzKGZvcm0sIG1lc3NhZ2UpIHtcclxuICAgIHZhciAkdCA9ICQoZm9ybSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb3JtIGVycm9ycywgc2hvdyBhIHN1Y2Nlc3NmdWwgbWVzc2FnZVxyXG4gICAgaWYgKCR0LmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAkdC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgICAgICBjc3M6IHBvcHVwU3R5bGUocG9wdXBTaXplKCdzbWFsbCcpKVxyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkgeyAkdC51bmJsb2NrKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbiAgICB9XHJcbn1cclxuKi9cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBpbml0QWpheEZvcm1zLFxyXG4gICAgICAgIG9uU3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgb25FcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfTsiLCLvu78vKiBBdXRvIGNhbGN1bGF0ZSBzdW1tYXJ5IG9uIERPTSB0YWdnaW5nIHdpdGggY2xhc3NlcyB0aGUgZWxlbWVudHMgaW52b2x2ZWQuXHJcbiAqL1xyXG52YXIgbnUgPSByZXF1aXJlKCcuL251bWJlclV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMoKSB7XHJcbiAgICAkKCd0YWJsZS5jYWxjdWxhdGUtaXRlbXMtdG90YWxzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVSb3coKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciB0ciA9ICR0LmNsb3Nlc3QoJ3RyJyk7XHJcbiAgICAgICAgICAgIHZhciBpcCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZScpO1xyXG4gICAgICAgICAgICB2YXIgaXEgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKTtcclxuICAgICAgICAgICAgdmFyIGl0ID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXRvdGFsJyk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKG51LmdldE1vbmV5TnVtYmVyKGlwKSAqIG51LmdldE1vbmV5TnVtYmVyKGlxLCAxKSwgaXQpO1xyXG4gICAgICAgICAgICB0ci50cmlnZ2VyKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQodGhpcykuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXByaWNlLCAuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKS5vbignY2hhbmdlJywgY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChjYWxjdWxhdGVSb3cpO1xyXG4gICAgICAgICQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVTdW1tYXJ5KGZvcmNlKSB7XHJcbiAgICAkKCcuY2FsY3VsYXRlLXN1bW1hcnknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciBzID0gYy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeScpO1xyXG4gICAgICAgIHZhciBkID0gYy5maW5kKCd0YWJsZS5jYWxjdWxhdGUtc3VtbWFyeS1ncm91cCcpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGMoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAsIGZlZSA9IDAsIGR1cmF0aW9uID0gMDtcclxuICAgICAgICAgICAgdmFyIGdyb3VwcyA9IHt9O1xyXG4gICAgICAgICAgICBkLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwVG90YWwgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbENoZWNrZWQgPSAkKHRoaXMpLmlzKCcuY2FsY3VsYXRlLWFsbC1pdGVtcycpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQ2hlY2tlZCB8fCBpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuaXMoJzpjaGVja2VkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBUb3RhbCArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbDplcSgwKScpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eTplcSgwKScpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmVlICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWZlZTplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWR1cmF0aW9uOmVxKDApJykpICogcTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRvdGFsICs9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBncm91cHNbJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwJyldID0gZ3JvdXBUb3RhbDtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGdyb3VwVG90YWwsICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihkdXJhdGlvbiwgJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLmZpbmQoJy5ncm91cC10b3RhbC1kdXJhdGlvbicpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgc3VtbWFyeSB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcih0b3RhbCwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS10b3RhbCcpKTtcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZmVlLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWZlZScpKTtcclxuICAgICAgICAgICAgLy8gQW5kIGV2ZXJ5IGdyb3VwIHRvdGFsIHZhbHVlXHJcbiAgICAgICAgICAgIGZvciAodmFyIGcgaW4gZ3JvdXBzKSB7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cHNbZ10sIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktZ3JvdXAtJyArIGcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuY2hhbmdlKGNhbGMpO1xyXG4gICAgICAgIGQub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIGNhbGMpO1xyXG4gICAgICAgIGNhbGMoKTtcclxuICAgICAgICBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnLCB0cnVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSBkZXRhaWwgb2YgYSBwcmljaW5nIHN1bW1hcnksIG9uZSBkZXRhaWwgbGluZSBwZXIgc2VsZWN0ZWQgaXRlbVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkZCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbCcpLFxyXG4gICAgICAgICAgICAkdCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbC10cGwnKS5jaGlsZHJlbigndHI6ZXEoMCknKSxcclxuICAgICAgICAgICAgJGMgPSAkcy5jbG9zZXN0KCdmb3JtJyksXHJcbiAgICAgICAgICAgICRpdGVtcyA9ICRjLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbScpO1xyXG5cclxuICAgICAgICAvLyBEbyBpdCFcclxuICAgICAgICAvLyBSZW1vdmUgb2xkIGxpbmVzXHJcbiAgICAgICAgJGQuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyBDcmVhdGUgbmV3IG9uZXNcclxuICAgICAgICAkaXRlbXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyICRpID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25jZXB0ID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgcHJpY2UgPSBudS5nZXRNb25leU51bWJlcigkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2U6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgcm93IGFuZCBzZXQgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICB2YXIgJHJvdyA9ICR0LmNsb25lKClcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZGV0YWlsLXRwbCcpXHJcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2RldGFpbCcpO1xyXG4gICAgICAgICAgICAgICAgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY29uY2VwdCcpLnRleHQoY29uY2VwdCk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihwcmljZSwgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIHRhYmxlXHJcbiAgICAgICAgICAgICAgICAkZC5hcHBlbmQoJHJvdyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgIHZhciAkYyA9ICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAvLyBJbml0aWFsIGNhbGN1bGF0aW9uXHJcbiAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCk7XHJcbiAgICAvLyBDYWxjdWxhdGUgb24gcmVsZXZhbnQgZm9ybSBjaGFuZ2VzXHJcbiAgICAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLmNoYW5nZSh1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzIGV2ZW50XHJcbiAgICAkYy5vbignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbn1cclxuXHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvblRhYmxlSXRlbXM6IHNldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyxcclxuICAgICAgICBvblN1bW1hcnk6IHNldHVwQ2FsY3VsYXRlU3VtbWFyeSxcclxuICAgICAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5OiB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5LFxyXG4gICAgICAgIG9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5XHJcbiAgICB9OyIsIu+7vy8qIEZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBkb2N1bWVudCAob3IgaW4gQGNvbnRhaW5lcilcclxud2l0aCB0aGUgaHRtbDUgYXR0cmlidXRlICdhdXRvZm9jdXMnIChvciBhbHRlcm5hdGl2ZSBAY3NzU2VsZWN0b3IpLlxyXG5JdCdzIGZpbmUgYXMgYSBwb2x5ZmlsbCBhbmQgZm9yIGFqYXggbG9hZGVkIGNvbnRlbnQgdGhhdCB3aWxsIG5vdFxyXG5nZXQgdGhlIGJyb3dzZXIgc3VwcG9ydCBvZiB0aGUgYXR0cmlidXRlLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZvY3VzKGNvbnRhaW5lciwgY3NzU2VsZWN0b3IpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8IGRvY3VtZW50KTtcclxuICAgIGNvbnRhaW5lci5maW5kKGNzc1NlbGVjdG9yIHx8ICdbYXV0b2ZvY3VzXScpLmZvY3VzKCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0ZvY3VzOyIsIu+7vy8qKiBBdXRvLWZpbGwgbWVudSBzdWItaXRlbXMgdXNpbmcgdGFiYmVkIHBhZ2VzIC1vbmx5IHdvcmtzIGZvciBjdXJyZW50IHBhZ2UgaXRlbXMtICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdXRvZmlsbFN1Ym1lbnUoKSB7XHJcbiAgICAkKCcuYXV0b2ZpbGwtc3VibWVudSAuY3VycmVudCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRtZW51ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBzdWJtZW51IGVsZW1lbnRzIGZyb20gdGFicyBtYXJrZWQgd2l0aCBjbGFzcyAnYXV0b2ZpbGwtc3VibWVudS1pdGVtcydcclxuICAgICAgICB2YXIgaXRlbXMgPSAkKCcuYXV0b2ZpbGwtc3VibWVudS1pdGVtcyBsaTpub3QoLnJlbW92YWJsZSknKTtcclxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBpdGVtcywgY3JlYXRlIHRoZSBzdWJtZW51IGNsb25pbmcgaXQhXHJcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHN1Ym1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHBhcmVudG1lbnUuYXBwZW5kKHN1Ym1lbnUpO1xyXG4gICAgICAgICAgICAvLyBDbG9uaW5nIHdpdGhvdXQgZXZlbnRzOlxyXG4gICAgICAgICAgICB2YXIgbmV3aXRlbXMgPSBpdGVtcy5jbG9uZShmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAkKHN1Ym1lbnUpLmFwcGVuZChuZXdpdGVtcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIGF0dGFjaCBldmVudHMgdG8gbWFpbnRhaW4gdGhlIHRhYmJlZCBpbnRlcmZhY2Ugd29ya2luZ1xyXG4gICAgICAgICAgICAvLyBOZXcgSXRlbXMgKGNsb25lZCkgbXVzdCBjaGFuZ2UgdGFiczpcclxuICAgICAgICAgICAgbmV3aXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBpbiB0aGUgb3JpZ2luYWwgaXRlbVxyXG4gICAgICAgICAgICAgICAgJChcImFbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIsIGl0ZW1zKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTdG9wIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gT3JpZ2luYWwgaXRlbXMgbXVzdCBjaGFuZ2UgbWVudTpcclxuICAgICAgICAgICAgaXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbmV3aXRlbXMucGFyZW50KCkuZmluZChcImFcIikucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKS5cclxuICAgICAgICAgICAgICAgIGZpbHRlcihcIipbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIu+7vy8qKlxyXG5NYW5hZ2UgYWxsIHRoYXQgZXZlbnRzIGF0dGFjaGVkIHRvIGRhdGVzIG1hZGUgdW5hdmFpbGFibGUgYnkgdGhlIHVzZXJcclxudG8gbm90aWZ5IGFib3V0IHdoYXQgdGhhdCBtZWFucy5cclxuXHJcbk1hZGUgZm9yIHVzZSBpbiB0aGUgTW9udGhseSBjYWxlbmRhciwgbWF5YmUgcmV1c2FibGUuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIG9iamVjdFV0aWxzID0gcmVxdWlyZSgnLi9vYmplY3RVdGlscycpO1xyXG5yZXF1aXJlKFwiZGF0ZS1mb3JtYXQtbGl0ZVwiKTtcclxuXHJcbi8qKlxyXG5UaGUgQGVsZW1lbnQgbXVzdCBiZSBhIGRvbSBlbGVtZW50IGNvbnRhaW5pbmcgdGhhdCB3aWxsIGNvbnRhaW4gdGhlIGluZm9ybWF0aW9uXHJcbmFuZCB3aWxsIHVzZSBhbiB1bCBlbGVtZW50IHRvIGxpc3Qgbm90aWZpY2F0aW9ucy4gVGhlIGVsZW1lbnQgd2lsbCBiZSBoaWRkZW5cclxuaW5pdGlhbGx5IGFuZCBhbnkgdGltZSB0aGF0LCBvbiByZW5kZXJpbmcsIHRoZXJlIGFyZSBub3Qgbm90aWZpY2F0aW9ucy5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQm9va2luZ3NOb3RpZmljYXRpb24oZWxlbWVudCkge1xyXG5cclxuICB0aGlzLiRlbCA9ICQoZWxlbWVudCk7XHJcbiAgdGhpcy4kbGlzdCA9IHRoaXMuJGVsLmZpbmQoJ3VsJyk7XHJcbiAgaWYgKCF0aGlzLiRsaXN0Lmxlbmd0aClcclxuICAgIHRoaXMuJGxpc3QgPSAkKCc8dWwvPicpLmFwcGVuZFRvKHRoaXMuJGVsKTtcclxuXHJcbiAgdGhpcy5yZWdpc3RlcmVkID0ge307XHJcblxyXG4gIHRoaXMucmVnaXN0ZXIgPSBmdW5jdGlvbiByZWdpc3Rlcih0b2dnbGUsIGRhdGEsIHN0ckRhdGUpIHtcclxuICAgIHZhciBsID0gdGhpcy5yZWdpc3RlcmVkO1xyXG4gICAgaWYgKHRvZ2dsZSkge1xyXG4gICAgICAvLyByZWdpc3RlciAoaWYgc29tZXRoaW5nKVxyXG4gICAgICB2YXIgZXZzID0gZGF0YS5zbG90c1tzdHJEYXRlXS5ldmVudHNJZHM7XHJcbiAgICAgIGlmIChldnMpIHtcclxuICAgICAgICBsW3N0ckRhdGVdID0gb2JqZWN0VXRpbHMuZmlsdGVyUHJvcGVydGllcyhkYXRhLmV2ZW50cywgZnVuY3Rpb24gKGspIHsgcmV0dXJuIGV2cy5pbmRleE9mKGspICE9IC0xOyB9KTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gdW5yZWdpc3RlclxyXG4gICAgICBkZWxldGUgbFtzdHJEYXRlXTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcclxuICAgIC8vIFJlbmV3IHRoZSBsaXN0XHJcbiAgICB0aGlzLiRsaXN0LmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcblxyXG4gICAgdmFyIGhhc05vdGlmaWNhdGlvbnMgPSBmYWxzZTtcclxuXHJcbiAgICBmb3IgKHZhciBzdHJEYXRlIGluIHRoaXMucmVnaXN0ZXJlZCkge1xyXG4gICAgICBpZiAoIXRoaXMucmVnaXN0ZXJlZC5oYXNPd25Qcm9wZXJ0eShzdHJEYXRlKSkgY29udGludWU7XHJcblxyXG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5yZWdpc3RlcmVkW3N0ckRhdGVdO1xyXG4gICAgICB2YXIgZGF0ZSA9IGRhdGVJU08ucGFyc2Uoc3RyRGF0ZSkuZm9ybWF0KCdERERELCBNTU0gRCcpO1xyXG4gICAgICB2YXIgbXNnID0gJCgnPHNwYW4vPicpLnRleHQoZGF0ZSArIFwiOiBcIikub3V0ZXJIdG1sKCk7XHJcblxyXG4gICAgICB2YXIgZXZlbnRzSHRtbCA9IFtdO1xyXG4gICAgICBmb3IgKHZhciBwIGluIGV2ZW50cykge1xyXG4gICAgICAgIGlmICghZXZlbnRzLmhhc093blByb3BlcnR5KHApKSBjb250aW51ZTtcclxuICAgICAgICB2YXIgZXYgPSBldmVudHNbcF07XHJcbiAgICAgICAgdmFyIGl0ZW0gPSAkKCc8YSB0YXJnZXQ9XCJfYmxhbmtcIiAvPicpLmF0dHIoJ2hyZWYnLCBldi51cmwpLnRleHQoZXYuc3VtbWFyeSB8fCAnYm9va2luZycpO1xyXG4gICAgICAgIGV2ZW50c0h0bWwucHVzaChpdGVtLm91dGVySHRtbCgpKTtcclxuXHJcbiAgICAgICAgaGFzTm90aWZpY2F0aW9ucyA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgbXNnICs9IGV2ZW50c0h0bWwuam9pbignLCAnKTtcclxuXHJcbiAgICAgICQoJzxsaS8+JylcclxuICAgICAgLmh0bWwobXNnKVxyXG4gICAgICAuYXBwZW5kVG8odGhpcy4kbGlzdCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGhhc05vdGlmaWNhdGlvbnMpXHJcbiAgICAgIHRoaXMuJGVsLnNob3coKTtcclxuICAgIGVsc2VcclxuICAgICAgdGhpcy4kZWwuaGlkZSgpO1xyXG5cclxuICB9O1xyXG59OyIsIu+7vy8qKlxyXG4gIE1vbnRobHkgY2FsZW5kYXIgY2xhc3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgTGNXaWRnZXQgPSByZXF1aXJlKCcuLi9DWC9MY1dpZGdldCcpLFxyXG4gIGV4dGVuZCA9IHJlcXVpcmUoJy4uL0NYL2V4dGVuZCcpLFxyXG4gIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpLFxyXG4gIG9iamVjdFV0aWxzID0gcmVxdWlyZSgnLi9vYmplY3RVdGlscycpLFxyXG4gIEJvb2tpbmdzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9Cb29raW5nc05vdGlmaWNhdGlvbicpO1xyXG5cclxuLyoqXHJcbiAgUHJpdmF0ZSB1dGlsc1xyXG4qKi9cclxuXHJcbi8qKlxyXG4gIFByZWZldGNoIG5leHQgbW9udGggKGJhc2VkIG9uIHRoZSBnaXZlbiBkYXRlcylcclxuICBOb3RlOiB0aGlzIGNvZGUgaXMgdmVyeSBzaW1pbGFyIHRvIHV0aWxzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2hcclxuKiovXHJcbmZ1bmN0aW9uIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGN1cnJlbnREYXRlc1JhbmdlKSB7XHJcbiAgLy8gV2UgZ2V0IHRoZSBuZXh0IG1vbnRoIGRhdGVzLXJhbmdlLCBidXRcclxuICAvLyB1c2luZyBhcyBiYXNlLWRhdGUgYSBkYXRlIGluc2lkZSBjdXJyZW50IGRpc3BsYXllZCBtb250aCwgdGhhdCBtb3N0IHRpbWVzIGlzXHJcbiAgLy8gbm90IHRoZSBtb250aCBvZiB0aGUgc3RhcnQgZGF0ZSBpbiBjdXJyZW50IGRhdGUsIHRoZW4ganVzdCBmb3J3YXJkIDcgZGF5cyB0aGF0XHJcbiAgLy8gdG8gZW5zdXJlIHdlIHBpY2sgdGhlIGNvcnJlY3QgbW9udGg6XHJcbiAgdmFyIG5leHREYXRlc1JhbmdlID0gdXRpbHMuZGF0ZS5uZXh0TW9udGhXZWVrcyh1dGlscy5kYXRlLmFkZERheXMoY3VycmVudERhdGVzUmFuZ2Uuc3RhcnQsIDcpLCAxLCBtb250aGx5LnNob3dTaXhXZWVrcyk7XHJcbiAgLy8gQXMgd2UgbG9hZCBmdWxsIHdlZWtzLCBtb3N0IHRpbWVzIHRoZSBmaXJzdCB3ZWVrIG9mIGEgbW9udGggaXMgYWxyZWFkeSBsb2FkZWQgYmVjYXVzZSBcclxuICAvLyB0aGUgd2VlayBpcyBzaGFyZWQgd2l0aCB0aGUgcHJldmlvdXMgbW9udGgsIHRoZW4ganVzdCBjaGVjayBpZiB0aGUgc3RhcnQgb2YgdGhlIG5ld1xyXG4gIC8vIHJhbmdlIGlzIGFscmVhZHkgaW4gY2FjaGUgYW5kIHNocmluayB0aGUgcmFuZ2UgdG8gYmUgcmVxdWVzdGVkLCBhdm9pZGluZyBjb25mbGljdCBvblxyXG4gIC8vIGxvYWRpbmcgdGhlIHVkcGF0ZWQgZGF0YSAoaWYgdGhhdCB3ZWVrIHdhcyBiZWluZyBlZGl0ZWQpIGFuZCBmYXN0ZXIgcmVxdWVzdCBsb2FkIHNpbmNlXHJcbiAgLy8gdGhlIHNlcnZlciBuZWVkcyB0byBkbyBsZXNzIGNvbXB1dGF0aW9uOlxyXG4gIHZhciBkID0gbmV4dERhdGVzUmFuZ2Uuc3RhcnQsXHJcbiAgICBzdHJlbmQgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXh0RGF0ZXNSYW5nZS5lbmQpLFxyXG4gICAgc3RyZCA9IGRhdGVJU08uZGF0ZUxvY2FsKGQsIHRydWUpO1xyXG4gIGlmIChtb250aGx5LmRhdGEgJiYgbW9udGhseS5kYXRhLnNsb3RzKVxyXG4gIHdoaWxlIChtb250aGx5LmRhdGEuc2xvdHNbc3RyZF0gJiZcclxuICAgIHN0cmQgPD0gc3RyZW5kKSB7XHJcbiAgICBuZXh0RGF0ZXNSYW5nZS5zdGFydCA9IGQgPSB1dGlscy5kYXRlLmFkZERheXMoZCwgMSk7XHJcbiAgICBzdHJkID0gZGF0ZUlTTy5kYXRlTG9jYWwoZCwgdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXV0aWxzLm1vbnRobHlJc0RhdGFJbkNhY2hlKG1vbnRobHksIG5leHREYXRlc1JhbmdlKSkge1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHZhciBwcmVmZXRjaFF1ZXJ5ID0gdXRpbHMuZGF0ZXNUb1F1ZXJ5KG5leHREYXRlc1JhbmdlKTtcclxuICAgIG1vbnRobHkuZmV0Y2hEYXRhKHByZWZldGNoUXVlcnksIG51bGwsIHRydWUpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbk1vdmUgdGhlIGJpbmRlZCBkYXRlcyB0aGUgYW1vdW50IG9mIEBtb250aHMgc3BlY2lmaWVkLlxyXG5Ob3RlOiBtb3N0IG9mIHRoaXMgY29kZSBpcyBhZGFwdGVkIGZyb20gdXRpbHMubW92ZUJpbmRSYW5nZUluRGF5cyxcclxudGhlIGNvbXBsZXhpdHkgY29tZXMgZnJvbSB0aGUgcHJlZmV0Y2ggZmVhdHVyZSwgbWF5YmUgY2FuIGJlIHRoYXQgbG9naWNcclxuaXNvbGF0ZWQgYW5kIHNoYXJlZD9cclxuKiovXHJcbmZ1bmN0aW9uIG1vdmVCaW5kTW9udGgobW9udGhseSwgbW9udGhzKSB7XHJcbiAgLy8gV2UgZ2V0IHRoZSBuZXh0ICdtb250aHMnIChuZWdhdGl2ZSBmb3IgcHJldmlvdXMpIGRhdGVzLXJhbmdlLCBidXRcclxuICAvLyB1c2luZyBhcyBiYXNlLWRhdGUgYSBkYXRlIGluc2lkZSBjdXJyZW50IGRpc3BsYXllZCBtb250aCwgdGhhdCBtb3N0IHRpbWVzIGlzXHJcbiAgLy8gbm90IHRoZSBtb250aCBvZiB0aGUgc3RhcnQgZGF0ZSBpbiBjdXJyZW50IGRhdGUsIHRoZW4ganVzdCBmb3J3YXJkIDcgZGF5cyB0aGF0XHJcbiAgLy8gdG8gZW5zdXJlIHdlIHBpY2sgdGhlIGNvcnJlY3QgbW9udGg6XHJcbiAgdmFyIGRhdGVzUmFuZ2UgPSB1dGlscy5kYXRlLm5leHRNb250aFdlZWtzKHV0aWxzLmRhdGUuYWRkRGF5cyhtb250aGx5LmRhdGVzUmFuZ2Uuc3RhcnQsIDcpLCBtb250aHMsIG1vbnRobHkuc2hvd1NpeFdlZWtzKTtcclxuXHJcbiAgLy8gQ2hlY2sgY2FjaGUgYmVmb3JlIHRyeSB0byBmZXRjaFxyXG4gIHZhciBpbkNhY2hlID0gdXRpbHMubW9udGhseUlzRGF0YUluQ2FjaGUobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcblxyXG4gIGlmIChpbkNhY2hlKSB7XHJcbiAgICAvLyBKdXN0IHNob3cgdGhlIGRhdGFcclxuICAgIG1vbnRobHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAvLyBQcmVmZXRjaCBleGNlcHQgaWYgdGhlcmUgaXMgb3RoZXIgcmVxdWVzdCBpbiBjb3Vyc2UgKGNhbiBiZSB0aGUgc2FtZSBwcmVmZXRjaCxcclxuICAgIC8vIGJ1dCBzdGlsbCBkb24ndCBvdmVybG9hZCB0aGUgc2VydmVyKVxyXG4gICAgaWYgKG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgbW9udGhseUNoZWNrQW5kUHJlZmV0Y2gobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcbiAgfSBlbHNlIHtcclxuXHJcbiAgICAvLyBTdXBwb3J0IGZvciBwcmVmZXRjaGluZzpcclxuICAgIC8vIEl0cyBhdm9pZGVkIGlmIHRoZXJlIGFyZSByZXF1ZXN0cyBpbiBjb3Vyc2UsIHNpbmNlXHJcbiAgICAvLyB0aGF0IHdpbGwgYmUgYSBwcmVmZXRjaCBmb3IgdGhlIHNhbWUgZGF0YS5cclxuICAgIGlmIChtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHtcclxuICAgICAgLy8gVGhlIGxhc3QgcmVxdWVzdCBpbiB0aGUgcG9vbCAqbXVzdCogYmUgdGhlIGxhc3QgaW4gZmluaXNoXHJcbiAgICAgIC8vIChtdXN0IGJlIG9ubHkgb25lIGlmIGFsbCBnb2VzIGZpbmUpOlxyXG4gICAgICB2YXIgcmVxdWVzdCA9IG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzW21vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgLy8gV2FpdCBmb3IgdGhlIGZldGNoIHRvIHBlcmZvcm0gYW5kIHNldHMgbG9hZGluZyB0byBub3RpZnkgdXNlclxyXG4gICAgICBtb250aGx5LiRlbC5hZGRDbGFzcyhtb250aGx5LmNsYXNzZXMuZmV0Y2hpbmcpO1xyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIG1vdmVCaW5kTW9udGgobW9udGhseSwgbW9udGhzKTtcclxuICAgICAgICBtb250aGx5LiRlbC5yZW1vdmVDbGFzcyhtb250aGx5LmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgbW9udGhseVxyXG4gICAgLmZldGNoRGF0YSh1dGlscy5kYXRlc1RvUXVlcnkoZGF0ZXNSYW5nZSkpXHJcbiAgICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIG1vbnRobHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAgIC8vIFByZWZldGNoXHJcbiAgICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LW1vbnRoIGFuZCBkaXNhYmxlIHByZXYgYnV0dG9uLFxyXG5vciByZW1vdmUgdGhlIG1hcmsgYW5kIGVuYWJsZSBpdCBpZiBpcyBub3QuXHJcblxyXG5VcGRhdGVzIHRoZSBtb250aCBsYWJlbCB0b28gYW5kIHRvZGF5IGJ1dHRvblxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50TW9udGgoJGVsLCBzdGFydERhdGUsIG1vbnRobHkpIHtcclxuICAvLyBFbnN1cmUgdGhlIGRhdGUgdG8gYmUgZnJvbSBjdXJyZW50IG1vbnRoIGFuZCBub3Qgb25lIG9mIHRoZSBsYXRlc3QgZGF0ZXNcclxuICAvLyBvZiB0aGUgcHJldmlvdXMgb25lICh3aGVyZSB0aGUgcmFuZ2Ugc3RhcnQpIGFkZGluZyA3IGRheXMgZm9yIHRoZSBjaGVjazpcclxuICB2YXIgbW9udGhEYXRlID0gdXRpbHMuZGF0ZS5hZGREYXlzKHN0YXJ0RGF0ZSwgNyk7XHJcbiAgdmFyIHllcCA9IHV0aWxzLmRhdGUuaXNJbkN1cnJlbnRNb250aChtb250aERhdGUpO1xyXG4gICRlbC50b2dnbGVDbGFzcyhtb250aGx5LmNsYXNzZXMuY3VycmVudFdlZWssIHllcCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLnByZXZBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxuXHJcbiAgLy8gTW9udGggLSBZZWFyXHJcbiAgdmFyIG1sYmwgPSBtb250aGx5LnRleHRzLm1vbnRoc1ttb250aERhdGUuZ2V0TW9udGgoKV0gKyAnICcgKyBtb250aERhdGUuZ2V0RnVsbFllYXIoKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMubW9udGhMYWJlbCkudGV4dChtbGJsKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMudG9kYXlBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxufVxyXG5cclxuLyoqXHJcbiAgVXBkYXRlIHRoZSBjYWxlbmRhciBkYXRlcyBjZWxscyBmb3IgJ2RheSBvZiB0aGUgbW9udGgnIHZhbHVlc1xyXG4gIGFuZCBudW1iZXIgb2Ygd2Vla3Mvcm93cy5cclxuICBAZGF0ZXNSYW5nZSB7IHN0YXJ0LCBlbmQgfVxyXG4gIEBzbG90c0NvbnRhaW5lciBqUXVlcnktRE9NIGZvciBkYXRlcy1jZWxscyB0Ym9keVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgb2ZmTW9udGhEYXRlQ2xhc3MsIGN1cnJlbnREYXRlQ2xhc3MsIHNsb3REYXRlTGFiZWwsIHNob3dTaXhXZWVrcykge1xyXG4gIHZhciBsYXN0WSxcclxuICAgIGN1cnJlbnRNb250aCA9IHV0aWxzLmRhdGUuYWRkRGF5cyhkYXRlc1JhbmdlLnN0YXJ0LCA3KS5nZXRNb250aCgpLFxyXG4gICAgdG9kYXkgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXcgRGF0ZSgpKTtcclxuXHJcbiAgaXRlcmF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIGZ1bmN0aW9uIChkYXRlLCB4LCB5KSB7XHJcbiAgICBsYXN0WSA9IHk7XHJcbiAgICB0aGlzLmZpbmQoJy4nICsgc2xvdERhdGVMYWJlbCkudGV4dChkYXRlLmdldERhdGUoKSk7XHJcblxyXG4gICAgLy8gTWFyayBkYXlzIG5vdCBpbiB0aGlzIG1vbnRoXHJcbiAgICB0aGlzLnRvZ2dsZUNsYXNzKG9mZk1vbnRoRGF0ZUNsYXNzLCBkYXRlLmdldE1vbnRoKCkgIT0gY3VycmVudE1vbnRoKTtcclxuXHJcbiAgICAvLyBNYXJrIHRvZGF5XHJcbiAgICB0aGlzLnRvZ2dsZUNsYXNzKGN1cnJlbnREYXRlQ2xhc3MsIGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUpID09IHRvZGF5KTtcclxuICB9KTtcclxuXHJcbiAgaWYgKCFzaG93U2l4V2Vla3MpIHtcclxuICAgIC8vIFNvbWUgbW9udGhzIGFyZSA1IHdlZWtzIHdpZGUgYW5kIG90aGVycyA2OyBvdXIgbGF5b3V0IGhhcyBwZXJtYW5lbnQgNiByb3dzL3dlZWtzXHJcbiAgICAvLyBhbmQgd2UgZG9uJ3QgbG9vayB1cCB0aGUgNnRoIHdlZWsgaWYgaXMgbm90IHBhcnQgb2YgdGhlIG1vbnRoIHRoZW4gdGhhdCA2dGggcm93XHJcbiAgICAvLyBtdXN0IGJlIGhpZGRlbiBpZiB0aGVyZSBhcmUgb25seSA1LlxyXG4gICAgLy8gSWYgdGhlIGxhc3Qgcm93IHdhcyB0aGUgNSAoaW5kZXggNCwgemVyby1iYXNlZCksIHRoZSA2dGggaXMgaGlkZGVuOlxyXG4gICAgc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJ3RyOmVxKDUpJykueHRvZ2dsZShsYXN0WSAhPSA0LCB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAwIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAgSXQgZXhlY3V0ZXMgdGhlIGdpdmVuIGNhbGxiYWNrIChAZWFjaENlbGxDYWxsYmFjaykgZm9yIFxyXG4gIGVhY2ggY2VsbCAodGhpcyBpbnNpZGUgdGhlIGNhbGxiYWNrKSBpdGVyYXRlZCBiZXR3ZWVuIHRoZSBAZGF0ZXNSYW5nZVxyXG4gIGluc2lkZSB0aGUgQHNsb3RzQ29udGFpbmVyIChhIHRib2R5IG9yIHRhYmxlIHdpdGggdHItdGQgZGF0ZSBjZWxscylcclxuKiovXHJcbmZ1bmN0aW9uIGl0ZXJhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBlYWNoQ2VsbENhbGxiYWNrKSB7XHJcbiAgdmFyIHgsIHksIGRhdGVDZWxsO1xyXG4gIC8vIEl0ZXJhdGUgZGF0ZXNcclxuICB1dGlscy5kYXRlLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIC8vIGRhdGVzIGFyZSBzb3J0ZWQgYXMgNyBwZXIgcm93IChlYWNoIHdlZWstZGF5KSxcclxuICAgIC8vIGJ1dCByZW1lbWJlciB0aGF0IGRheS1jZWxsIHBvc2l0aW9uIGlzIG9mZnNldCAxIGJlY2F1c2VcclxuICAgIC8vIGVhY2ggcm93IGlzIDggY2VsbHMgKGZpcnN0IGlzIGhlYWRlciBhbmQgcmVzdCA3IGFyZSB0aGUgZGF0YS1jZWxscyBmb3IgZGF0ZXMpXHJcbiAgICAvLyBqdXN0IGxvb2tpbmcgb25seSAndGQncyB3ZSBjYW4gdXNlIHRoZSBwb3NpdGlvbiB3aXRob3V0IG9mZnNldFxyXG4gICAgeCA9IChpICUgNyk7XHJcbiAgICB5ID0gTWF0aC5mbG9vcihpIC8gNyk7XHJcbiAgICBkYXRlQ2VsbCA9IHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCd0cjplcSgnICsgeSArICcpJykuY2hpbGRyZW4oJ3RkOmVxKCcgKyB4ICsgJyknKTtcclxuXHJcbiAgICBlYWNoQ2VsbENhbGxiYWNrLmFwcGx5KGRhdGVDZWxsLCBbZGF0ZSwgeCwgeSwgaV0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICBUb2dnbGUgYSBzZWxlY3RlZCBkYXRlLWNlbGwgYXZhaWxhYmlsaXR5LFxyXG4gIGZvciB0aGUgJ2VkaXRhYmxlJyBtb2RlXHJcbioqL1xyXG5mdW5jdGlvbiB0b2dnbGVEYXRlQXZhaWxhYmlsaXR5KG1vbnRobHksIGNlbGwpIHtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBkYXRhLCBqdXN0IHJldHVybiAoZGF0YSBub3QgbG9hZGVkKVxyXG4gIGlmICghbW9udGhseS5kYXRhIHx8ICFtb250aGx5LmRhdGEuc2xvdHMpIHJldHVybjtcclxuICBcclxuICAvLyBHZXR0aW5nIHRoZSBwb3NpdGlvbiBvZiB0aGUgY2VsbCBpbiB0aGUgbWF0cml4IGZvciBkYXRlLXNsb3RzOlxyXG4gIHZhciB0ciA9IGNlbGwuY2xvc2VzdCgndHInKSxcclxuICAgIHggPSB0ci5maW5kKCd0ZCcpLmluZGV4KGNlbGwpLFxyXG4gICAgeSA9IHRyLmNsb3Nlc3QoJ3Rib2R5JykuZmluZCgndHInKS5pbmRleCh0ciksXHJcbiAgICBkYXlzT2Zmc2V0ID0geSAqIDcgKyB4O1xyXG5cclxuICAvLyBHZXR0aW5nIHRoZSBkYXRlIGZvciB0aGUgY2VsbCBiYXNlZCBvbiB0aGUgc2hvd2VkIGZpcnN0IGRhdGVcclxuICB2YXIgZGF0ZSA9IG1vbnRobHkuZGF0ZXNSYW5nZS5zdGFydDtcclxuICBkYXRlID0gdXRpbHMuZGF0ZS5hZGREYXlzKGRhdGUsIGRheXNPZmZzZXQpO1xyXG4gIHZhciBzdHJEYXRlID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcblxyXG4gIC8vIEdldCBhbmQgdXBkYXRlIGZyb20gdGhlIHVuZGVybGF5aW5nIGRhdGEsIFxyXG4gIC8vIHRoZSBzdGF0dXMgZm9yIHRoZSBkYXRlLCB0b2dnbGluZyBpdDpcclxuICB2YXIgc2xvdCA9IG1vbnRobHkuZGF0YS5zbG90c1tzdHJEYXRlXTtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBzbG90LCBqdXN0IHJldHVybiAoZGF0YSBub3QgbG9hZGVkKVxyXG4gIGlmICghc2xvdCkgcmV0dXJuO1xyXG4gIHNsb3Quc3RhdHVzID0gc2xvdC5zdGF0dXMgPT0gJ3VuYXZhaWxhYmxlJyA/ICdhdmFpbGFibGUnIDogJ3VuYXZhaWxhYmxlJztcclxuICBzbG90LnNvdXJjZSA9ICd1c2VyJztcclxuICBtb250aGx5LmJvb2tpbmdzTm90aWZpY2F0aW9uLnJlZ2lzdGVyKHNsb3Quc3RhdHVzID09ICd1bmF2YWlsYWJsZScsIG1vbnRobHkuZGF0YSwgc3RyRGF0ZSk7XHJcblxyXG4gIC8vIFVwZGF0ZSB2aXN1YWxpemF0aW9uOlxyXG4gIG1vbnRobHkuYmluZERhdGEoKTtcclxufVxyXG5cclxuLyoqXHJcbk1vbnRseSBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIE1vbnRobHkgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5Q2xhc3Nlcywge1xyXG4gIHdlZWtseUNhbGVuZGFyOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudFdlZWs6IHVuZGVmaW5lZCxcclxuICBjdXJyZW50TW9udGg6ICdpcy1jdXJyZW50TW9udGgnLFxyXG4gIG1vbnRobHlDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS1tb250aGx5JyxcclxuICB0b2RheUFjdGlvbjogJ0FjdGlvbnMtdG9kYXknLFxyXG4gIG1vbnRoTGFiZWw6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1tb250aExhYmVsJyxcclxuICBzbG90RGF0ZUxhYmVsOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc2xvdERhdGVMYWJlbCcsXHJcbiAgb2ZmTW9udGhEYXRlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItb2ZmTW9udGhEYXRlJyxcclxuICBjdXJyZW50RGF0ZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWN1cnJlbnREYXRlJyxcclxuICBlZGl0YWJsZTogJ2lzLWVkaXRhYmxlJyxcclxuICBib29raW5nc05vdGlmaWNhdGlvbjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWJvb2tpbmdzTm90aWZpY2F0aW9uJ1xyXG59KSxcclxudGV4dHM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5VGV4dHMsIHtcclxuICBtb250aHM6IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddXHJcbn0pLFxyXG51cmw6ICcvY2FsZW5kYXIvZ2V0LWF2YWlsYWJpbGl0eS8nLFxyXG5zaG93U2l4V2Vla3M6IHRydWUsXHJcbmVkaXRhYmxlOiBmYWxzZSxcclxuXHJcbi8vIE91ciAndmlldycgd2lsbCBiZSBhIHN1YnNldCBvZiB0aGUgZGF0YSxcclxuLy8gZGVsaW1pdGVkIGJ5IHRoZSBuZXh0IHByb3BlcnR5LCBhIGRhdGVzIHJhbmdlOlxyXG5kYXRlc1JhbmdlOiB7IHN0YXJ0OiBudWxsLCBlbmQ6IG51bGwgfSxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhTW9udGhseShkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5zbG90cykgcmV0dXJuO1xyXG5cclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICBjaGVja0N1cnJlbnRNb250aCh0aGlzLiRlbCwgZGF0ZXNSYW5nZS5zdGFydCwgdGhpcyk7XHJcblxyXG4gIHVwZGF0ZURhdGVzQ2VsbHModGhpcy5kYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgdGhpcy5jbGFzc2VzLm9mZk1vbnRoRGF0ZSwgdGhpcy5jbGFzc2VzLmN1cnJlbnREYXRlLCB0aGlzLmNsYXNzZXMuc2xvdERhdGVMYWJlbCwgdGhpcy5zaG93U2l4V2Vla3MpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgdXRpbHMuc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdXRpbHMuc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgLy8gU2V0IGF2YWlsYWJpbGl0eSBvZiBlYWNoIGRhdGUgc2xvdC9jZWxsOlxyXG4gIGl0ZXJhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBmdW5jdGlvbiAoZGF0ZSwgeCwgeSwgaSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIHZhciBzbG90ID0gdGhhdC5kYXRhLnNsb3RzW2RhdGVrZXldO1xyXG4gICAgLy8gU3VwcG9ydCBmb3Igc2ltcGxlIGFuZCBkZXRhaWxlZCBzdGF0dXMgZGVzY3JpcHRpb246XHJcbiAgICB2YXIgZGF0ZVN0YXR1cyA9ICQuaXNQbGFpbk9iamVjdChzbG90KSA/IHNsb3Quc3RhdHVzIDogc2xvdDtcclxuICAgIC8vIERlZmF1bHQgdmFsdWUgZnJvbSBkYXRhOlxyXG4gICAgZGF0ZVN0YXR1cyA9IGRhdGVTdGF0dXMgfHwgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ3Vua25vdyc7XHJcblxyXG4gICAgaWYgKGRhdGVTdGF0dXMpXHJcbiAgICAgIHRoaXMuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyBkYXRlU3RhdHVzKTtcclxuICB9KTtcclxuXHJcbiAgLy8gTm90aWZpY2F0aW9uczpcclxuICB0aGlzLmJvb2tpbmdzTm90aWZpY2F0aW9uLnJlbmRlcigpO1xyXG59LFxyXG5nZXRVcGRhdGVkRGF0YTogZnVuY3Rpb24gZ2V0VXBkYXRlZERhdGEoKSB7XHJcbiAgdmFyIGQgPSB7fTtcclxuICBpZiAodGhpcy5lZGl0YWJsZSkge1xyXG4gICAgLy8gQ29weSBkYXRhLCB3ZSBkb24ndCB3YW50IGNoYW5nZSB0aGUgb3JpZ2luYWw6XHJcbiAgICBleHRlbmQoZCwgdGhpcy5kYXRhKTtcclxuXHJcbiAgICAvLyBGaWx0ZXIgc2xvdHMgdG8gZ2V0IG9ubHkgdGhhdCB1cGRhdGVkIGJ5IGRlIHVzZXI6XHJcbiAgICBkLnNsb3RzID0gb2JqZWN0VXRpbHMuZmlsdGVyUHJvcGVydGllcyhkLnNsb3RzLCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgICByZXR1cm4gdi5zb3VyY2UgPT0gJ3VzZXInO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBkO1xyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBNb250aGx5KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAvLyBSZXVzaW5nIGJhc2UgY29uc3RydWN0b3IgdG9vIGZvciBpbml0aWFsaXppbmc6XHJcbiAgTGNXaWRnZXQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICAvLyBUbyB1c2UgdGhpcyBpbiBjbG9zdXJlczpcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIC8vIEluaXRpYWxpemluZyBzb21lIGRhdGEsIGJlaW5nIGNhcmUgb2YgYW55IHZhbHVlXHJcbiAgLy8gdGhhdCBjb21lcyBmcm9tIG1lcmdpbmcgb3B0aW9ucyBpbnRvICd0aGlzJ1xyXG4gIHRoaXMudXNlciA9IHRoaXMudXNlciB8fCB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcbiAgdGhpcy5xdWVyeSA9IGV4dGVuZCh7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnbW9udGhseS1zY2hlZHVsZSdcclxuICB9LCB0aGlzLnF1ZXJ5KTtcclxuXHJcbiAgLy8gSWYgaXMgbm90IHNldCBieSBjb25zdHJ1Y3RvciBvcHRpb25zLCBnZXQgXHJcbiAgLy8gJ2VkaXRhYmxlJyBmcm9tIGRhdGEsIG9yIGxlZnQgZGVmYXVsdDpcclxuICBpZiAoIShvcHRpb25zICYmIHR5cGVvZiAob3B0aW9ucy5lZGl0YWJsZSkgIT0gJ3VuZGVmaW5lZCcpICYmXHJcbiAgICB0eXBlb2YgKHRoaXMuJGVsLmRhdGEoJ2VkaXRhYmxlJykpICE9ICd1bmRlZmluZWQnKVxyXG4gICAgdGhpcy5lZGl0YWJsZSA9ICEhdGhpcy4kZWwuZGF0YSgnZWRpdGFibGUnKTtcclxuXHJcblxyXG4gIC8vIFNldCBoYW5kbGVycyBmb3IgcHJldi1uZXh0IGFjdGlvbnM6XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnByZXZBY3Rpb24sIGZ1bmN0aW9uIHByZXYoKSB7XHJcbiAgICBtb3ZlQmluZE1vbnRoKHRoYXQsIC0xKTtcclxuICB9KTtcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMubmV4dEFjdGlvbiwgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgIG1vdmVCaW5kTW9udGgodGhhdCwgMSk7XHJcbiAgfSk7XHJcbiAgLy8gSGFuZGxlciBmb3IgdG9kYXkgYWN0aW9uXHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnRvZGF5QWN0aW9uLCBmdW5jdGlvbiB0b2RheSgpIHtcclxuICAgIHRoYXQuYmluZERhdGEodXRpbHMuZGF0ZS5jdXJyZW50TW9udGhXZWVrcyhudWxsLCB0aGlzLnNob3dTaXhXZWVrcykpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBFZGl0YWJsZSBtb2RlXHJcbiAgaWYgKHRoaXMuZWRpdGFibGUpIHtcclxuICAgIHRoaXMucXVlcnkuZWRpdGFibGUgPSB0cnVlO1xyXG4gICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzICsgJyB0ZCcsIGZ1bmN0aW9uIGNsaWNrVG9nZ2xlQXZhaWxhYmlsaXR5KCkge1xyXG4gICAgICB0b2dnbGVEYXRlQXZhaWxhYmlsaXR5KHRoYXQsICQodGhpcykpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLiRlbC5hZGRDbGFzcyh0aGlzLmNsYXNzZXMuZWRpdGFibGUpO1xyXG4gIH1cclxuXHJcbiAgLy8gQ3JlYXRpbmcgdGhlIGJvb2tpbmdzTm90aWZpY2F0aW9uIGVsZW1lbnQsIGJvdGggZWRpdGFibGUgYW5kIHJlYWQtb25seSBtb2Rlcy5cclxuICAvLyBSZWFkLW9ubHkgbW9kZSBuZWVkIGhpZGRlbiB0aGUgZWxlbWVudCBhbmQgdGhhdHMgZG9uZSBvbiBjb25zdHJ1Y3RvciBhbmQgZWRpdGFibGVcclxuICAvLyB3aWxsIHJlbmRlciBpdCBvbiBiaW5kRGF0YVxyXG4gIHRoaXMuYm9va2luZ3NOb3RpZmljYXRpb24gPSBuZXcgQm9va2luZ3NOb3RpZmljYXRpb24odGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuYm9va2luZ3NOb3RpZmljYXRpb24pKTtcclxuXHJcbiAgLy8gU3RhcnQgZmV0Y2hpbmcgY3VycmVudCBtb250aFxyXG4gIHZhciBmaXJzdERhdGVzID0gdXRpbHMuZGF0ZS5jdXJyZW50TW9udGhXZWVrcyhudWxsLCB0aGlzLnNob3dTaXhXZWVrcyk7XHJcbiAgdGhpcy5mZXRjaERhdGEodXRpbHMuZGF0ZXNUb1F1ZXJ5KGZpcnN0RGF0ZXMpKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoZmlyc3REYXRlcyk7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IG1vbnRoIGluIGFkdmFuY2VcclxuICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKHRoYXQsIGZpcnN0RGF0ZXMpO1xyXG4gIH0pO1xyXG5cclxuICBjaGVja0N1cnJlbnRNb250aCh0aGlzLiRlbCwgZmlyc3REYXRlcy5zdGFydCwgdGhpcyk7XHJcblxyXG4gIC8vIFNob3cgZXJyb3IgbWVzc2FnZVxyXG4gIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCB1dGlscy5oYW5kbGVyQ2FsZW5kYXJFcnJvcik7XHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuTW9udGhseS5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIE1vbnRobHkucHJvdG90eXBlLmNsYXNzZXMubW9udGhseUNhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgTW9udGhseSh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vbnRobHk7XHJcbiIsIu+7vy8qKlxyXG4gIFdlZWtseSBjYWxlbmRhciBjbGFzc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4uL0NYL0xjV2lkZ2V0JyksXHJcbiAgZXh0ZW5kID0gcmVxdWlyZSgnLi4vQ1gvZXh0ZW5kJyk7XHJcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcclxuXHJcbi8qKlxyXG5XZWVrbHkgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBXZWVrbHkgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IHV0aWxzLndlZWtseUNsYXNzZXMsXHJcbnRleHRzOiB1dGlscy53ZWVrbHlUZXh0cyxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuXHJcbi8vIE91ciAndmlldycgd2lsbCBiZSBhIHN1YnNldCBvZiB0aGUgZGF0YSxcclxuLy8gZGVsaW1pdGVkIGJ5IHRoZSBuZXh0IHByb3BlcnR5LCBhIGRhdGVzIHJhbmdlOlxyXG5kYXRlc1JhbmdlOiB7IHN0YXJ0OiBudWxsLCBlbmQ6IG51bGwgfSxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhV2Vla2x5KGRhdGVzUmFuZ2UpIHtcclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLnNsb3RzKSByZXR1cm47XHJcblxyXG4gIHRoaXMuZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlIHx8IHRoaXMuZGF0ZXNSYW5nZTtcclxuICB2YXIgXHJcbiAgICAgIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpLFxyXG4gICAgICBzbG90cyA9IHNsb3RzQ29udGFpbmVyLmZpbmQoJ3RkJyk7XHJcblxyXG4gIHV0aWxzLmNoZWNrQ3VycmVudFdlZWsodGhpcy4kZWwsIGRhdGVzUmFuZ2Uuc3RhcnQsIHRoaXMpO1xyXG5cclxuICB1dGlscy51cGRhdGVMYWJlbHMoZGF0ZXNSYW5nZSwgdGhpcy4kZWwsIHRoaXMpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgdXRpbHMuc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdXRpbHMuc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgLy8gU2V0IGFsbCBzbG90cyB3aXRoIGRlZmF1bHQgc3RhdHVzXHJcbiAgc2xvdHMuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cyk7XHJcblxyXG4gIGlmICghdGhpcy5kYXRhLnNsb3RzIHx8ICF0aGlzLmRhdGEuc3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHV0aWxzLmRhdGUuZWFjaERhdGVJblJhbmdlKGRhdGVzUmFuZ2Uuc3RhcnQsIGRhdGVzUmFuZ2UuZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIHZhciBkYXRlU2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbZGF0ZWtleV07XHJcbiAgICBpZiAoZGF0ZVNsb3RzKSB7XHJcbiAgICAgIGZvciAocyA9IDA7IHMgPCBkYXRlU2xvdHMubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICB2YXIgc2xvdCA9IGRhdGVTbG90c1tzXTtcclxuICAgICAgICB2YXIgc2xvdENlbGwgPSB1dGlscy5maW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgaSwgc2xvdCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGRlZmF1bHQgc3RhdHVzXHJcbiAgICAgICAgc2xvdENlbGwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cyB8fCAnXycpO1xyXG4gICAgICAgIC8vIEFkZGluZyBzdGF0dXMgY2xhc3NcclxuICAgICAgICBzbG90Q2VsbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIFdlZWtseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB0aGlzLnVzZXIgPSB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICd3ZWVrbHknXHJcbiAgfTtcclxuXHJcbiAgLy8gU3RhcnQgZmV0Y2hpbmcgY3VycmVudCB3ZWVrXHJcbiAgdmFyIGZpcnN0RGF0ZXMgPSB1dGlscy5kYXRlLmN1cnJlbnRXZWVrKCk7XHJcbiAgdGhpcy5mZXRjaERhdGEodXRpbHMuZGF0ZXNUb1F1ZXJ5KGZpcnN0RGF0ZXMpKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoZmlyc3REYXRlcyk7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IHdlZWsgaW4gYWR2YW5jZVxyXG4gICAgdXRpbHMud2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh0aGF0LCBmaXJzdERhdGVzKTtcclxuICB9KTtcclxuICB1dGlscy5jaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBmaXJzdERhdGVzLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgLy8gU2V0IGhhbmRsZXJzIGZvciBwcmV2LW5leHQgYWN0aW9uczpcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMucHJldkFjdGlvbiwgZnVuY3Rpb24gcHJldigpIHtcclxuICAgIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgLTcpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5uZXh0QWN0aW9uLCBmdW5jdGlvbiBuZXh0KCkge1xyXG4gICAgdXRpbHMubW92ZUJpbmRSYW5nZUluRGF5cyh0aGF0LCA3KTtcclxuICB9KTtcclxuXHJcbiAgLy8gU2hvdyBlcnJvciBtZXNzYWdlXHJcbiAgdGhpcy5ldmVudHMub24oJ2hhc0Vycm9yQ2hhbmdlZCcsIHV0aWxzLmhhbmRsZXJDYWxlbmRhckVycm9yKTtcclxuXHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuV2Vla2x5LmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgV2Vla2x5LnByb3RvdHlwZS5jbGFzc2VzLndlZWtseUNhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgV2Vla2x5KHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2Vla2x5O1xyXG4iLCLvu78vKipcclxuICBXb3JrIEhvdXJzIGNhbGVuZGFyIGNsYXNzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIExjV2lkZ2V0ID0gcmVxdWlyZSgnLi4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuLi9DWC9leHRlbmQnKSxcclxuICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuICBjbGVhckN1cnJlbnRTZWxlY3Rpb24gPSByZXF1aXJlKCcuL2NsZWFyQ3VycmVudFNlbGVjdGlvbicpLFxyXG4gIG1ha2VVbnNlbGVjdGFibGUgPSByZXF1aXJlKCcuL21ha2VVbnNlbGVjdGFibGUnKTtcclxucmVxdWlyZSgnLi4vanF1ZXJ5LmJvdW5kcycpO1xyXG5cclxuLyoqXHJcbldvcmsgaG91cnMgcHJpdmF0ZSB1dGlsc1xyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBFZGl0V29ya0hvdXJzKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICAvLyBTZXQgaGFuZGxlcnMgdG8gc3dpdGNoIHN0YXR1cyBhbmQgdXBkYXRlIGJhY2tlbmQgZGF0YVxyXG4gIC8vIHdoZW4gdGhlIHVzZXIgc2VsZWN0IGNlbGxzXHJcbiAgdmFyIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpO1xyXG5cclxuICBmdW5jdGlvbiB0b2dnbGVDZWxsKGNlbGwpIHtcclxuICAgIC8vIEZpbmQgZGF5IGFuZCB0aW1lIG9mIHRoZSBjZWxsOlxyXG4gICAgdmFyIHNsb3QgPSB1dGlscy5maW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCk7XHJcbiAgICAvLyBHZXQgd2Vlay1kYXkgc2xvdHMgYXJyYXk6XHJcbiAgICB2YXIgd2tzbG90cyA9IHRoYXQuZGF0YS5zbG90c1t1dGlscy5zeXN0ZW1XZWVrRGF5c1tzbG90LmRheV1dID0gdGhhdC5kYXRhLnNsb3RzW3V0aWxzLnN5c3RlbVdlZWtEYXlzW3Nsb3QuZGF5XV0gfHwgW107XHJcbiAgICAvLyBJZiBpdCBoYXMgYWxyZWFkeSB0aGUgZGF0YS5zdGF0dXMsIHRvZ2dsZSB0byB0aGUgZGVmYXVsdFN0YXR1c1xyXG4gICAgLy8gIHZhciBzdGF0dXNDbGFzcyA9IHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyxcclxuICAgIC8vICAgICAgZGVmYXVsdFN0YXR1c0NsYXNzID0gdGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cztcclxuICAgIC8vaWYgKGNlbGwuaGFzQ2xhc3Moc3RhdHVzQ2xhc3NcclxuICAgIC8vIFRvZ2dsZSBmcm9tIHRoZSBhcnJheVxyXG4gICAgdmFyIHN0cnNsb3QgPSBkYXRlSVNPLnRpbWVMb2NhbChzbG90LnNsb3QsIHRydWUpLFxyXG4gICAgICBpc2xvdCA9IHdrc2xvdHMuaW5kZXhPZihzdHJzbG90KTtcclxuICAgIGlmIChpc2xvdCA9PSAtMSlcclxuICAgICAgd2tzbG90cy5wdXNoKHN0cnNsb3QpO1xyXG4gICAgZWxzZVxyXG4gICAgLy9kZWxldGUgd2tzbG90c1tpc2xvdF07XHJcbiAgICAgIHdrc2xvdHMuc3BsaWNlKGlzbG90LCAxKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHRvZ2dsZUNlbGxSYW5nZShmaXJzdENlbGwsIGxhc3RDZWxsKSB7XHJcbiAgICB2YXIgXHJcbiAgICAgIHggPSBmaXJzdENlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGZpcnN0Q2VsbCksXHJcbiAgICAgIHkxID0gZmlyc3RDZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKSxcclxuICAgIC8veDIgPSBsYXN0Q2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgobGFzdENlbGwpLFxyXG4gICAgICB5MiA9IGxhc3RDZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKTtcclxuXHJcbiAgICBpZiAoeTEgPiB5Mikge1xyXG4gICAgICB2YXIgeTAgPSB5MTtcclxuICAgICAgeTEgPSB5MjtcclxuICAgICAgeTIgPSB5MDtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciB5ID0geTE7IHkgPD0geTI7IHkrKykge1xyXG4gICAgICB2YXIgY2VsbCA9IGZpcnN0Q2VsbC5jbG9zZXN0KCd0Ym9keScpLmNoaWxkcmVuKCd0cjplcSgnICsgeSArICcpJykuY2hpbGRyZW4oJ3RkOmVxKCcgKyB4ICsgJyknKTtcclxuICAgICAgdG9nZ2xlQ2VsbChjZWxsKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhciBkcmFnZ2luZyA9IHtcclxuICAgIGZpcnN0OiBudWxsLFxyXG4gICAgbGFzdDogbnVsbCxcclxuICAgIHNlbGVjdGlvbkxheWVyOiAkKCc8ZGl2IGNsYXNzPVwiU2VsZWN0aW9uTGF5ZXJcIiAvPicpLmFwcGVuZFRvKHRoaXMuJGVsKSxcclxuICAgIGRvbmU6IGZhbHNlXHJcbiAgfTtcclxuICBcclxuICBmdW5jdGlvbiBvZmZzZXRUb1Bvc2l0aW9uKGVsLCBvZmZzZXQpIHtcclxuICAgIHZhciBwYiA9ICQoZWwub2Zmc2V0UGFyZW50KS5ib3VuZHMoKSxcclxuICAgICAgcyA9IHt9O1xyXG5cclxuICAgIHMudG9wID0gb2Zmc2V0LnRvcCAtIHBiLnRvcDtcclxuICAgIHMubGVmdCA9IG9mZnNldC5sZWZ0IC0gcGIubGVmdDtcclxuXHJcbiAgICAvL3MuYm90dG9tID0gcGIudG9wIC0gb2Zmc2V0LmJvdHRvbTtcclxuICAgIC8vcy5yaWdodCA9IG9mZnNldC5sZWZ0IC0gb2Zmc2V0LnJpZ2h0O1xyXG4gICAgcy5oZWlnaHQgPSBvZmZzZXQuYm90dG9tIC0gb2Zmc2V0LnRvcDtcclxuICAgIHMud2lkdGggPSBvZmZzZXQucmlnaHQgLSBvZmZzZXQubGVmdDtcclxuXHJcbiAgICAkKGVsKS5jc3Mocyk7XHJcbiAgICByZXR1cm4gcztcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVwZGF0ZVNlbGVjdGlvbihlbCkge1xyXG4gICAgdmFyIGEgPSBkcmFnZ2luZy5maXJzdC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgdmFyIGIgPSBlbC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgdmFyIHMgPSBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG5cclxuICAgIHMudG9wID0gYS50b3AgPCBiLnRvcCA/IGEudG9wIDogYi50b3A7XHJcbiAgICBzLmJvdHRvbSA9IGEuYm90dG9tID4gYi5ib3R0b20gPyBhLmJvdHRvbSA6IGIuYm90dG9tO1xyXG5cclxuICAgIG9mZnNldFRvUG9zaXRpb24oZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXJbMF0sIHMpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZmluaXNoRHJhZygpIHtcclxuICAgIGlmIChkcmFnZ2luZy5maXJzdCAmJiBkcmFnZ2luZy5sYXN0KSB7XHJcbiAgICAgIHRvZ2dsZUNlbGxSYW5nZShkcmFnZ2luZy5maXJzdCwgZHJhZ2dpbmcubGFzdCk7XHJcbiAgICAgIHRoYXQuYmluZERhdGEoKTtcclxuXHJcbiAgICAgIGRyYWdnaW5nLmRvbmUgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgZHJhZ2dpbmcuZmlyc3QgPSBkcmFnZ2luZy5sYXN0ID0gbnVsbDtcclxuICAgIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLmhpZGUoKTtcclxuICAgIG1ha2VVbnNlbGVjdGFibGUub2ZmKHRoYXQuJGVsKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgdGhpcy4kZWwuZmluZChzbG90c0NvbnRhaW5lcikub24oJ2NsaWNrJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gRG8gZXhjZXB0IGFmdGVyIGEgZHJhZ2dpbmcgZG9uZSBjb21wbGV0ZVxyXG4gICAgaWYgKGRyYWdnaW5nLmRvbmUpIHJldHVybiBmYWxzZTtcclxuICAgIHRvZ2dsZUNlbGwoJCh0aGlzKSk7XHJcbiAgICB0aGF0LmJpbmREYXRhKCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG4gIHRoaXMuJGVsLmZpbmQoc2xvdHNDb250YWluZXIpXHJcbiAgLm9uKCdtb3VzZWRvd24nLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBkcmFnZ2luZy5kb25lID0gZmFsc2U7XHJcbiAgICBkcmFnZ2luZy5maXJzdCA9ICQodGhpcyk7XHJcbiAgICBkcmFnZ2luZy5sYXN0ID0gbnVsbDtcclxuICAgIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLnNob3coKTtcclxuXHJcbiAgICBtYWtlVW5zZWxlY3RhYmxlKHRoYXQuJGVsKTtcclxuICAgIGNsZWFyQ3VycmVudFNlbGVjdGlvbigpO1xyXG5cclxuICAgIHZhciBzID0gZHJhZ2dpbmcuZmlyc3QuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIG9mZnNldFRvUG9zaXRpb24oZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXJbMF0sIHMpO1xyXG5cclxuICB9KVxyXG4gIC5vbignbW91c2VlbnRlcicsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGlmIChkcmFnZ2luZy5maXJzdCkge1xyXG4gICAgICBkcmFnZ2luZy5sYXN0ID0gJCh0aGlzKTtcclxuXHJcbiAgICAgIHVwZGF0ZVNlbGVjdGlvbihkcmFnZ2luZy5sYXN0KTtcclxuICAgIH1cclxuICB9KVxyXG4gIC5vbignbW91c2V1cCcsIGZpbmlzaERyYWcpXHJcbiAgLmZpbmQoJ3RkJylcclxuICAuYXR0cignZHJhZ2dhYmxlJywgZmFsc2UpO1xyXG5cclxuICAvLyBUaGlzIHdpbGwgbm90IHdvcmsgd2l0aCBwb2ludGVyLWV2ZW50czpub25lLCBidXQgb24gb3RoZXJcclxuICAvLyBjYXNlcyAocmVjZW50SUUpXHJcbiAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIub24oJ21vdXNldXAnLCBmaW5pc2hEcmFnKVxyXG4gIC5hdHRyKCdkcmFnZ2FibGUnLCBmYWxzZSk7XHJcblxyXG59XHJcblxyXG4vKipcclxuV29yayBob3VycyBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIFdvcmtIb3VycyA9IExjV2lkZ2V0LmV4dGVuZChcclxuLy8gUHJvdG90eXBlXHJcbntcclxuY2xhc3NlczogZXh0ZW5kKHt9LCB1dGlscy53ZWVrbHlDbGFzc2VzLCB7XHJcbiAgd2Vla2x5Q2FsZW5kYXI6IHVuZGVmaW5lZCxcclxuICB3b3JrSG91cnNDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS13b3JrSG91cnMnXHJcbn0pLFxyXG50ZXh0czogdXRpbHMud2Vla2x5VGV4dHMsXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YVdvcmtIb3VycygpIHtcclxuICB2YXIgXHJcbiAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIGZvciAodmFyIHdrID0gMDsgd2sgPCB1dGlscy5zeXN0ZW1XZWVrRGF5cy5sZW5ndGg7IHdrKyspIHtcclxuICAgIHZhciBkYXRlU2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbdXRpbHMuc3lzdGVtV2Vla0RheXNbd2tdXTtcclxuICAgIGlmIChkYXRlU2xvdHMgJiYgZGF0ZVNsb3RzLmxlbmd0aCkge1xyXG4gICAgICBmb3IgKHMgPSAwOyBzIDwgZGF0ZVNsb3RzLmxlbmd0aDsgcysrKSB7XHJcbiAgICAgICAgdmFyIHNsb3QgPSBkYXRlU2xvdHNbc107XHJcbiAgICAgICAgdmFyIHNsb3RDZWxsID0gdXRpbHMuZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIHdrLCBzbG90KTtcclxuICAgICAgICAvLyBSZW1vdmUgZGVmYXVsdCBzdGF0dXNcclxuICAgICAgICBzbG90Q2VsbC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICdfJyk7XHJcbiAgICAgICAgLy8gQWRkaW5nIHN0YXR1cyBjbGFzc1xyXG4gICAgICAgIHNsb3RDZWxsLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIFdvcmtIb3VycyhlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgTGNXaWRnZXQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHRoaXMudXNlciA9IHRoaXMuJGVsLmRhdGEoJ2NhbGVuZGFyLXVzZXInKTtcclxuXHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICd3b3JrSG91cnMnXHJcbiAgfTtcclxuXHJcbiAgLy8gRmV0Y2ggdGhlIGRhdGE6IHRoZXJlIGlzIG5vdCBhIG1vcmUgc3BlY2lmaWMgcXVlcnksXHJcbiAgLy8gaXQganVzdCBnZXQgdGhlIGhvdXJzIGZvciBlYWNoIHdlZWstZGF5IChkYXRhXHJcbiAgLy8gc2xvdHMgYXJlIHBlciB3ZWVrLWRheSBpbnN0ZWFkIG9mIHBlciBkYXRlIGNvbXBhcmVkXHJcbiAgLy8gdG8gKndlZWtseSopXHJcbiAgdGhpcy5mZXRjaERhdGEoKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoKTtcclxuICB9KTtcclxuXHJcbiAgc2V0dXBFZGl0V29ya0hvdXJzLmNhbGwodGhpcyk7XHJcblxyXG4gIC8vIFNob3cgZXJyb3IgbWVzc2FnZVxyXG4gIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCB1dGlscy5oYW5kbGVyQ2FsZW5kYXJFcnJvcik7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV29ya2hvdXJzIGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldvcmtIb3Vycy5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdvcmtIb3Vycy5wcm90b3R5cGUuY2xhc3Nlcy53b3JrSG91cnNDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdvcmtIb3Vycyh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmtIb3VyczsiLCLvu78vKipcclxuQ3Jvc3MgYnJvd3NlciB3YXkgdG8gdW5zZWxlY3QgY3VycmVudCBzZWxlY3Rpb25cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xlYXJDdXJyZW50U2VsZWN0aW9uKCkge1xyXG4gIGlmICh0eXBlb2YgKHdpbmRvdy5nZXRTZWxlY3Rpb24pID09PSAnZnVuY3Rpb24nKVxyXG4gIC8vIFN0YW5kYXJkXHJcbiAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcbiAgZWxzZSBpZiAoZG9jdW1lbnQuc2VsZWN0aW9uICYmIHR5cGVvZiAoZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KSA9PT0gJ2Z1bmN0aW9uJylcclxuICAvLyBJRVxyXG4gICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XHJcbn07Iiwi77u/LyoqXHJcbiAgQSBjb2xsZWN0aW9uIG9mIHVzZWZ1bCBnZW5lcmljIHV0aWxzIG1hbmFnaW5nIERhdGVzXHJcbioqL1xyXG52YXIgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyk7XHJcblxyXG5mdW5jdGlvbiBjdXJyZW50V2VlaygpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGdldEZpcnN0V2Vla0RhdGUobmV3IERhdGUoKSksXHJcbiAgICBlbmQ6IGdldExhc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50V2VlayA9IGN1cnJlbnRXZWVrO1xyXG5cclxuZnVuY3Rpb24gbmV4dFdlZWsoc3RhcnQsIGVuZCkge1xyXG4gIC8vIFVuaXF1ZSBwYXJhbSB3aXRoIGJvdGggcHJvcGllcnRpZXM6XHJcbiAgaWYgKHN0YXJ0LmVuZCkge1xyXG4gICAgZW5kID0gc3RhcnQuZW5kO1xyXG4gICAgc3RhcnQgPSBzdGFydC5zdGFydDtcclxuICB9XHJcbiAgLy8gT3B0aW9uYWwgZW5kOlxyXG4gIGVuZCA9IGVuZCB8fCBhZGREYXlzKHN0YXJ0LCA3KTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGFkZERheXMoc3RhcnQsIDcpLFxyXG4gICAgZW5kOiBhZGREYXlzKGVuZCwgNylcclxuICB9O1xyXG59XHJcbmV4cG9ydHMubmV4dFdlZWsgPSBuZXh0V2VlaztcclxuXHJcbmZ1bmN0aW9uIGdldEZpcnN0V2Vla0RhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpIC0gZC5nZXREYXkoKSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRGaXJzdFdlZWtEYXRlID0gZ2V0Rmlyc3RXZWVrRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGdldExhc3RXZWVrRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyAoNiAtIGQuZ2V0RGF5KCkpKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldExhc3RXZWVrRGF0ZSA9IGdldExhc3RXZWVrRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGlzSW5DdXJyZW50V2VlayhkYXRlKSB7XHJcbiAgcmV0dXJuIGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0V2Vla0RhdGUoZGF0ZSkpID09IGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0V2Vla0RhdGUobmV3IERhdGUoKSkpO1xyXG59XHJcbmV4cG9ydHMuaXNJbkN1cnJlbnRXZWVrID0gaXNJbkN1cnJlbnRXZWVrO1xyXG5cclxuZnVuY3Rpb24gYWRkRGF5cyhkYXRlLCBkYXlzKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkYXlzKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmFkZERheXMgPSBhZGREYXlzO1xyXG5cclxuZnVuY3Rpb24gZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZuKSB7XHJcbiAgaWYgKCFmbi5jYWxsKSB0aHJvdyBuZXcgRXJyb3IoJ2ZuIG11c3QgYmUgYSBmdW5jdGlvbiBvciBcImNhbGxcImFibGUgb2JqZWN0Jyk7XHJcbiAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzdGFydCk7XHJcbiAgdmFyIGkgPSAwLCByZXQ7XHJcbiAgd2hpbGUgKGRhdGUgPD0gZW5kKSB7XHJcbiAgICByZXQgPSBmbi5jYWxsKGZuLCBkYXRlLCBpKTtcclxuICAgIC8vIEFsbG93IGZuIHRvIGNhbmNlbCB0aGUgbG9vcCB3aXRoIHN0cmljdCAnZmFsc2UnXHJcbiAgICBpZiAocmV0ID09PSBmYWxzZSlcclxuICAgICAgYnJlYWs7XHJcbiAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyAxKTtcclxuICAgIGkrKztcclxuICB9XHJcbn1cclxuZXhwb3J0cy5lYWNoRGF0ZUluUmFuZ2UgPSBlYWNoRGF0ZUluUmFuZ2U7XHJcblxyXG4vKiogTW9udGhzICoqL1xyXG5cclxuZnVuY3Rpb24gZ2V0Rmlyc3RNb250aERhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKDEpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0Rmlyc3RNb250aERhdGUgPSBnZXRGaXJzdE1vbnRoRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGdldExhc3RNb250aERhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXRNb250aChkLmdldE1vbnRoKCkgKyAxLCAxKTtcclxuICBkID0gYWRkRGF5cyhkLCAtMSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRMYXN0TW9udGhEYXRlID0gZ2V0TGFzdE1vbnRoRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGlzSW5DdXJyZW50TW9udGgoZGF0ZSkge1xyXG4gIHJldHVybiBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdE1vbnRoRGF0ZShkYXRlKSkgPT0gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RNb250aERhdGUobmV3IERhdGUoKSkpO1xyXG59XHJcbmV4cG9ydHMuaXNJbkN1cnJlbnRNb250aCA9IGlzSW5DdXJyZW50TW9udGg7XHJcblxyXG4vKipcclxuICBHZXQgYSBkYXRlcyByYW5nZSBmb3IgdGhlIGN1cnJlbnQgbW9udGhcclxuICAob3IgdGhlIGdpdmVuIGRhdGUgYXMgYmFzZSlcclxuKiovXHJcbmZ1bmN0aW9uIGN1cnJlbnRNb250aChiYXNlRGF0ZSkge1xyXG4gIGJhc2VEYXRlID0gYmFzZURhdGUgfHwgbmV3IERhdGUoKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGdldEZpcnN0TW9udGhEYXRlKGJhc2VEYXRlKSxcclxuICAgIGVuZDogZ2V0TGFzdE1vbnRoRGF0ZShiYXNlRGF0ZSlcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudE1vbnRoID0gY3VycmVudE1vbnRoO1xyXG5cclxuZnVuY3Rpb24gbmV4dE1vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpIHtcclxuICBhbW91bnRNb250aHMgPSBhbW91bnRNb250aHMgfHwgMTtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGZyb21EYXRlKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGQuc2V0TW9udGgoZC5nZXRNb250aCgpICsgYW1vdW50TW9udGhzLCAxKSxcclxuICAgIGVuZDogZ2V0TGFzdE1vbnRoRGF0ZShkKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5uZXh0TW9udGggPSBuZXh0TW9udGg7XHJcblxyXG5mdW5jdGlvbiBwcmV2aW91c01vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpIHtcclxuICByZXR1cm4gbmV4dE1vbnRoKGZyb21EYXRlLCAwIC0gYW1vdW50TW9udGhzKTtcclxufVxyXG5leHBvcnRzLnByZXZpb3VzTW9udGggPSBwcmV2aW91c01vbnRoO1xyXG5cclxuLyoqXHJcbiAgR2V0IGEgZGF0ZXMgcmFuZ2UgZm9yIHRoZSBjb21wbGV0ZSB3ZWVrc1xyXG4gIHRoYXQgYXJlIHBhcnQgb2YgdGhlIGN1cnJlbnQgbW9udGhcclxuICAob3IgdGhlIGdpdmVuIGRhdGUgYXMgYmFzZSkuXHJcbiAgVGhhdCBtZWFucywgdGhhdCBzdGFydCBkYXRlIHdpbGwgYmUgdGhlIGZpcnN0XHJcbiAgd2VlayBkYXRlIG9mIHRoZSBmaXJzdCBtb250aCB3ZWVrICh0aGF0IGNhblxyXG4gIGJlIHRoZSBkYXkgMSBvZiB0aGUgbW9udGggb3Igb25lIG9mIHRoZSBsYXN0XHJcbiAgZGF0ZXMgZnJvbSB0aGUgcHJldmlvdXMgbW9udGhzKSxcclxuICBhbmQgc2ltaWxhciBmb3IgdGhlIGVuZCBkYXRlIGJlaW5nIHRoZSBcclxuICBsYXN0IHdlZWsgZGF0ZSBvZiB0aGUgbGFzdCBtb250aCB3ZWVrLlxyXG5cclxuICBAaW5jbHVkZVNpeFdlZWtzOiBzb21ldGltZXMgaXMgdXNlZnVsIGdldCBldmVyIGFcclxuICBzaXggd2Vla3MgZGF0ZXMgcmFuZ2Ugc3RhcmluZyBieSB0aGUgZmlyc3Qgd2VlayBvZlxyXG4gIHRoZSBiYXNlRGF0ZSBtb250aC4gQnkgZGVmYXVsdCBpcyBmYWxzZS5cclxuKiovXHJcbmZ1bmN0aW9uIGN1cnJlbnRNb250aFdlZWtzKGJhc2VEYXRlLCBpbmNsdWRlU2l4V2Vla3MpIHtcclxuICB2YXIgciA9IGN1cnJlbnRNb250aChiYXNlRGF0ZSksXHJcbiAgICBzID0gZ2V0Rmlyc3RXZWVrRGF0ZShyLnN0YXJ0KSxcclxuICAgIGUgPSBpbmNsdWRlU2l4V2Vla3MgPyBhZGREYXlzKHMsIDYqNyAtIDEpIDogZ2V0TGFzdFdlZWtEYXRlKHIuZW5kKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IHMsXHJcbiAgICBlbmQ6IGVcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudE1vbnRoV2Vla3MgPSBjdXJyZW50TW9udGhXZWVrcztcclxuXHJcbmZ1bmN0aW9uIG5leHRNb250aFdlZWtzKGZyb21EYXRlLCBhbW91bnRNb250aHMsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHJldHVybiBjdXJyZW50TW9udGhXZWVrcyhuZXh0TW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykuc3RhcnQsIGluY2x1ZGVTaXhXZWVrcyk7XHJcbn1cclxuZXhwb3J0cy5uZXh0TW9udGhXZWVrcyA9IG5leHRNb250aFdlZWtzO1xyXG5cclxuZnVuY3Rpb24gcHJldmlvdXNNb250aFdlZWtzKGZyb21EYXRlLCBhbW91bnRNb250aHMsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHJldHVybiBjdXJyZW50TW9udGhXZWVrcyhwcmV2aW91c01vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpLnN0YXJ0LCBpbmNsdWRlU2l4V2Vla3MpO1xyXG59XHJcbmV4cG9ydHMucHJldmlvdXNNb250aFdlZWtzID0gcHJldmlvdXNNb250aFdlZWtzO1xyXG4iLCLvu78vKiogVmVyeSBzaW1wbGUgY3VzdG9tLWZvcm1hdCBmdW5jdGlvbiB0byBhbGxvdyBcclxubDEwbiBvZiB0ZXh0cy5cclxuQ292ZXIgY2FzZXM6XHJcbi0gTSBmb3IgbW9udGhcclxuLSBEIGZvciBkYXlcclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlLCBmb3JtYXQpIHtcclxuICB2YXIgcyA9IGZvcm1hdCxcclxuICAgICAgTSA9IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgIEQgPSBkYXRlLmdldERhdGUoKTtcclxuICBzID0gcy5yZXBsYWNlKC9NL2csIE0pO1xyXG4gIHMgPSBzLnJlcGxhY2UoL0QvZywgRCk7XHJcbiAgcmV0dXJuIHM7XHJcbn07Iiwi77u/LyoqXHJcbiAgRXhwb3NpbmcgYWxsIHRoZSBwdWJsaWMgZmVhdHVyZXMgYW5kIGNvbXBvbmVudHMgb2YgYXZhaWxhYmlsaXR5Q2FsZW5kYXJcclxuKiovXHJcbmV4cG9ydHMuV2Vla2x5ID0gcmVxdWlyZSgnLi9XZWVrbHknKTtcclxuZXhwb3J0cy5Xb3JrSG91cnMgPSByZXF1aXJlKCcuL1dvcmtIb3VycycpO1xyXG5leHBvcnRzLk1vbnRobHkgPSByZXF1aXJlKCcuL01vbnRobHknKTsiLCLvu78vKipcclxuICBNYWtlIGFuIGVsZW1lbnQgdW5zZWxlY3RhYmxlLCB1c2VmdWwgdG8gaW1wbGVtZW50IHNvbWUgY3VzdG9tXHJcbiAgc2VsZWN0aW9uIGJlaGF2aW9yIG9yIGRyYWcmZHJvcC5cclxuICBJZiBvZmZlcnMgYW4gJ29mZicgbWV0aG9kIHRvIHJlc3RvcmUgYmFjayB0aGUgZWxlbWVudCBiZWhhdmlvci5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gIHZhciBmYWxzeWZuID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07XHJcbiAgdmFyIG5vZHJhZ1N0eWxlID0ge1xyXG4gICAgJy13ZWJraXQtdG91Y2gtY2FsbG91dCc6ICdub25lJyxcclxuICAgICcta2h0bWwtdXNlci1kcmFnJzogJ25vbmUnLFxyXG4gICAgJy13ZWJraXQtdXNlci1kcmFnJzogJ25vbmUnLFxyXG4gICAgJy1raHRtbC11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctd2Via2l0LXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnXHJcbiAgfTtcclxuICB2YXIgZHJhZ2RlZmF1bHRTdHlsZSA9IHtcclxuICAgICctd2Via2l0LXRvdWNoLWNhbGxvdXQnOiAnaW5oZXJpdCcsXHJcbiAgICAnLWtodG1sLXVzZXItZHJhZyc6ICdpbmhlcml0JyxcclxuICAgICctd2Via2l0LXVzZXItZHJhZyc6ICdpbmhlcml0JyxcclxuICAgICcta2h0bWwtdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLXdlYmtpdC11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctbW96LXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1tcy11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICd1c2VyLXNlbGVjdCc6ICdpbmhlcml0J1xyXG4gIH07XHJcblxyXG4gIHZhciBvbiA9IGZ1bmN0aW9uIG1ha2VVbnNlbGVjdGFibGUoZWwpIHtcclxuICAgIGVsID0gJChlbCk7XHJcbiAgICBlbC5vbignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIC8vJChkb2N1bWVudCkub24oJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICBlbC5jc3Mobm9kcmFnU3R5bGUpO1xyXG4gIH07XHJcblxyXG4gIHZhciBvZmYgPSBmdW5jdGlvbiBvZmZNYWtlVW5zZWxlY3RhYmxlKGVsKSB7XHJcbiAgICBlbCA9ICQoZWwpO1xyXG4gICAgZWwub2ZmKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgLy8kKGRvY3VtZW50KS5vZmYoJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICBlbC5jc3MoZHJhZ2RlZmF1bHRTdHlsZSk7XHJcbiAgfTtcclxuXHJcbiAgb24ub2ZmID0gb2ZmO1xyXG4gIHJldHVybiBvbjtcclxuXHJcbn0gKCkpOyIsIu+7vy8qKlxyXG4gIEEgc2V0IG9mIGdlbmVyaWMgdXRpbGl0aWVzIHRvIG1hbmFnZSBqcyBvYmplY3RzXHJcbioqL1xyXG52YXIgdSA9IHt9O1xyXG5cclxuLyoqXHJcbiAgUGVyZm9ybXMgYSBjYWxsYmFjayBvbiBlYWNoIHByb3BlcnR5IG93bmVkIGJ5IHRoZSBvYmplY3RcclxuKiovXHJcbnUuZWFjaFByb3BlcnR5ID0gZnVuY3Rpb24gZWFjaFByb3BlcnR5KG9iaiwgY2IpIHtcclxuICBmb3IgKHZhciBwIGluIG9iaikge1xyXG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkocCkpIGNvbnRpbnVlO1xyXG4gICAgY2IuY2FsbChvYmosIHAsIG9ialtwXSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgRmlsdGVyIHRoZSBnaXZlbiBvYmplY3QgcmV0dXJuaW5nIGEgbmV3IG9uZSB3aXRoIG9ubHkgdGhlIHByb3BlcnRpZXNcclxuICAoYW5kIG9yaWdpbmFsIHZhbHVlcyAtcmVmcyBmb3Igb2JqZWN0IHZhbHVlcy0pIHRoYXQgcGFzc1xyXG4gIHRoZSBwcm92aWRlZCBAZmlsdGVyIGNhbGxiYWNrIChjYWxsYmFjayBtdXN0IHJldHVybiBhIHRydWUvdHJ1dGh5IHZhbHVlXHJcbiAgZm9yIGVhY2ggdmFsdWUgZGVzaXJlZCBpbiB0aGUgcmVzdWx0KS5cclxuICBUaGUgQGZpbHRlciBjYWxsYmFjayBpdHMgZXhlY3V0ZWQgd2l0aCB0aGUgb2JqZWN0IGFzIGNvbnRleHQgYW5kIHJlY2VpdmVzXHJcbiAgYXMgcGFyZW1ldGVycyB0aGUgcHJvcGVydHkga2V5IGFuZCBpdHMgdmFsdWUgXCJmaWx0ZXIoaywgdilcIi5cclxuKiovXHJcbnUuZmlsdGVyUHJvcGVydGllcyA9IGZ1bmN0aW9uIGZpbHRlclByb3BlcmllcyhvYmosIGZpbHRlcikge1xyXG4gIHZhciByID0ge307XHJcbiAgdS5lYWNoUHJvcGVydHkob2JqLCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgaWYgKGZpbHRlci5jYWxsKG9iaiwgaywgdikpXHJcbiAgICAgIHJba10gPSB2O1xyXG4gIH0pO1xyXG4gIHJldHVybiByO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB1OyIsIu+7vy8qKlxyXG4gIEF2YWlsYWJpbGl0eUNhbGVuZGFyIHNoYXJlZCB1dGlsc1xyXG4qKi9cclxudmFyIFxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBkYXRlVXRpbHMgPSByZXF1aXJlKCcuL2RhdGVVdGlscycpLFxyXG4gIGZvcm1hdERhdGUgPSByZXF1aXJlKCcuL2Zvcm1hdERhdGUnKTtcclxuXHJcbi8vIFJlLWV4cG9ydGluZzpcclxuZXhwb3J0cy5mb3JtYXREYXRlID0gZm9ybWF0RGF0ZTtcclxuZXhwb3J0cy5kYXRlID0gZGF0ZVV0aWxzO1xyXG5cclxuLyotLS0tLS0gQ09OU1RBTlRTIC0tLS0tLS0tLSovXHJcbnZhciBzdGF0dXNUeXBlcyA9IGV4cG9ydHMuc3RhdHVzVHlwZXMgPSBbJ3VuYXZhaWxhYmxlJywgJ2F2YWlsYWJsZSddO1xyXG4vLyBXZWVrIGRheXMgbmFtZXMgaW4gZW5nbGlzaCBmb3IgaW50ZXJuYWwgc3lzdGVtXHJcbi8vIHVzZTsgTk9UIGZvciBsb2NhbGl6YXRpb24vdHJhbnNsYXRpb24uXHJcbnZhciBzeXN0ZW1XZWVrRGF5cyA9IGV4cG9ydHMuc3lzdGVtV2Vla0RheXMgPSBbXHJcbiAgJ3N1bmRheScsXHJcbiAgJ21vbmRheScsXHJcbiAgJ3R1ZXNkYXknLFxyXG4gICd3ZWRuZXNkYXknLFxyXG4gICd0aHVyc2RheScsXHJcbiAgJ2ZyaWRheScsXHJcbiAgJ3NhdHVyZGF5J1xyXG5dO1xyXG5cclxuLyotLS0tLS0tLS0gQ09ORklHIC0gSU5TVEFOQ0UgLS0tLS0tLS0tLSovXHJcbnZhciB3ZWVrbHlDbGFzc2VzID0gZXhwb3J0cy53ZWVrbHlDbGFzc2VzID0ge1xyXG4gIGNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXInLFxyXG4gIHdlZWtseUNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItLXdlZWtseScsXHJcbiAgY3VycmVudFdlZWs6ICdpcy1jdXJyZW50V2VlaycsXHJcbiAgYWN0aW9uczogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWFjdGlvbnMnLFxyXG4gIHByZXZBY3Rpb246ICdBY3Rpb25zLXByZXYnLFxyXG4gIG5leHRBY3Rpb246ICdBY3Rpb25zLW5leHQnLFxyXG4gIGRheXM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1kYXlzJyxcclxuICBzbG90czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXNsb3RzJyxcclxuICBzbG90SG91cjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWhvdXInLFxyXG4gIHNsb3RTdGF0dXNQcmVmaXg6ICdpcy0nLFxyXG4gIGxlZ2VuZDogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZCcsXHJcbiAgbGVnZW5kQXZhaWxhYmxlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kLWF2YWlsYWJsZScsXHJcbiAgbGVnZW5kVW5hdmFpbGFibGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQtdW5hdmFpbGFibGUnLFxyXG4gIHN0YXR1czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXN0YXR1cycsXHJcbiAgZXJyb3JNZXNzYWdlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItZXJyb3JNZXNzYWdlJ1xyXG59O1xyXG5cclxudmFyIHdlZWtseVRleHRzID0gZXhwb3J0cy53ZWVrbHlUZXh0cyA9IHtcclxuICBhYmJyV2Vla0RheXM6IFtcclxuICAgICdTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXHJcbiAgXSxcclxuICB0b2RheTogJ1RvZGF5JyxcclxuICAvLyBBbGxvd2VkIHNwZWNpYWwgdmFsdWVzOiBNOm1vbnRoLCBEOmRheVxyXG4gIGFiYnJEYXRlRm9ybWF0OiAnTS9EJ1xyXG59O1xyXG5cclxuLyotLS0tLS0tLS0tLSBWSUVXIFVUSUxTIC0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuZnVuY3Rpb24gaGFuZGxlckNhbGVuZGFyRXJyb3IoZXJyKSB7XHJcbiAgdmFyIG1zZyA9ICcnO1xyXG4gIGlmIChlcnIgJiYgZXJyLm1lc3NhZ2UpXHJcbiAgICBtc2cgPSBlcnIubWVzc2FnZTtcclxuICBlbHNlIGlmIChlcnIgJiYgZXJyLmV4Y2VwdGlvbiAmJiBlcnIuZXhjZXB0aW9uLm1lc3NhZ2UpXHJcbiAgICBtc2cgPSBlcnIuZXhjZXB0aW9uLm1lc3NhZ2U7XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcy5jb21wb25lbnQ7XHJcbiAgdmFyIG1zZ0NvbnRhaW5lciA9IHRoYXQuJGVsLmZpbmQoJy4nICsgdGhhdC5jbGFzc2VzLmVycm9yTWVzc2FnZSk7XHJcblxyXG4gIGlmIChtc2cpIG1zZyA9IChtc2dDb250YWluZXIuZGF0YSgnbWVzc2FnZS1wcmVmaXgnKSB8fCAnJykgKyBtc2c7XHJcblxyXG4gIG1zZ0NvbnRhaW5lci50ZXh0KG1zZyk7XHJcbn1cclxuZXhwb3J0cy5oYW5kbGVyQ2FsZW5kYXJFcnJvciA9IGhhbmRsZXJDYWxlbmRhckVycm9yO1xyXG5cclxuZnVuY3Rpb24gbW92ZUJpbmRSYW5nZUluRGF5cyh3ZWVrbHksIGRheXMpIHtcclxuICB2YXIgXHJcbiAgICBzdGFydCA9IGRhdGVVdGlscy5hZGREYXlzKHdlZWtseS5kYXRlc1JhbmdlLnN0YXJ0LCBkYXlzKSxcclxuICAgIGVuZCA9IGRhdGVVdGlscy5hZGREYXlzKHdlZWtseS5kYXRlc1JhbmdlLmVuZCwgZGF5cyksXHJcbiAgICBkYXRlc1JhbmdlID0gZGF0ZXNUb1JhbmdlKHN0YXJ0LCBlbmQpO1xyXG5cclxuICAvLyBDaGVjayBjYWNoZSBiZWZvcmUgdHJ5IHRvIGZldGNoXHJcbiAgdmFyIGluQ2FjaGUgPSB3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcblxyXG4gIGlmIChpbkNhY2hlKSB7XHJcbiAgICAvLyBKdXN0IHNob3cgdGhlIGRhdGFcclxuICAgIHdlZWtseS5iaW5kRGF0YShkYXRlc1JhbmdlKTtcclxuICAgIC8vIFByZWZldGNoIGV4Y2VwdCBpZiB0aGVyZSBpcyBvdGhlciByZXF1ZXN0IGluIGNvdXJzZSAoY2FuIGJlIHRoZSBzYW1lIHByZWZldGNoLFxyXG4gICAgLy8gYnV0IHN0aWxsIGRvbid0IG92ZXJsb2FkIHRoZSBzZXJ2ZXIpXHJcbiAgICBpZiAod2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggPT09IDApXHJcbiAgICAgIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuICB9IGVsc2Uge1xyXG5cclxuICAgIC8vIFN1cHBvcnQgZm9yIHByZWZldGNoaW5nOlxyXG4gICAgLy8gSXRzIGF2b2lkZWQgaWYgdGhlcmUgYXJlIHJlcXVlc3RzIGluIGNvdXJzZSwgc2luY2VcclxuICAgIC8vIHRoYXQgd2lsbCBiZSBhIHByZWZldGNoIGZvciB0aGUgc2FtZSBkYXRhLlxyXG4gICAgaWYgKHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSB7XHJcbiAgICAgIC8vIFRoZSBsYXN0IHJlcXVlc3QgaW4gdGhlIHBvb2wgKm11c3QqIGJlIHRoZSBsYXN0IGluIGZpbmlzaFxyXG4gICAgICAvLyAobXVzdCBiZSBvbmx5IG9uZSBpZiBhbGwgZ29lcyBmaW5lKTpcclxuICAgICAgdmFyIHJlcXVlc3QgPSB3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzW3dlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAvLyBXYWl0IGZvciB0aGUgZmV0Y2ggdG8gcGVyZm9ybSBhbmQgc2V0cyBsb2FkaW5nIHRvIG5vdGlmeSB1c2VyXHJcbiAgICAgIHdlZWtseS4kZWwuYWRkQ2xhc3Mod2Vla2x5LmNsYXNzZXMuZmV0Y2hpbmcpO1xyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIG1vdmVCaW5kUmFuZ2VJbkRheXMod2Vla2x5LCBkYXlzKTtcclxuICAgICAgICB3ZWVrbHkuJGVsLnJlbW92ZUNsYXNzKHdlZWtseS5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmV0Y2ggKGRvd25sb2FkKSB0aGUgZGF0YSBhbmQgc2hvdyBvbiByZWFkeTpcclxuICAgIHdlZWtseVxyXG4gICAgLmZldGNoRGF0YShkYXRlc1RvUXVlcnkoZGF0ZXNSYW5nZSkpXHJcbiAgICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHdlZWtseS5iaW5kRGF0YShkYXRlc1JhbmdlKTtcclxuICAgICAgLy8gUHJlZmV0Y2hcclxuICAgICAgd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydHMubW92ZUJpbmRSYW5nZUluRGF5cyA9IG1vdmVCaW5kUmFuZ2VJbkRheXM7XHJcblxyXG5mdW5jdGlvbiB3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgZGF0ZXNSYW5nZSkge1xyXG4gIGlmICghd2Vla2x5LmRhdGEgfHwgIXdlZWtseS5kYXRhLnNsb3RzKSByZXR1cm4gZmFsc2U7XHJcbiAgLy8gQ2hlY2sgY2FjaGU6IGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgZGF0ZSBpbiB0aGUgcmFuZ2VcclxuICAvLyB3aXRob3V0IGRhdGEsIHdlIHNldCBpbkNhY2hlIGFzIGZhbHNlIGFuZCBmZXRjaCB0aGUgZGF0YTpcclxuICB2YXIgaW5DYWNoZSA9IHRydWU7XHJcbiAgZGF0ZVV0aWxzLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICBpZiAoIXdlZWtseS5kYXRhLnNsb3RzW2RhdGVrZXldKSB7XHJcbiAgICAgIGluQ2FjaGUgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiBpbkNhY2hlO1xyXG59XHJcbmV4cG9ydHMud2Vla2x5SXNEYXRhSW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGU7XHJcblxyXG4vKipcclxuICBGb3Igbm93LCBnaXZlbiB0aGUgSlNPTiBzdHJ1Y3R1cmUgdXNlZCwgdGhlIGxvZ2ljXHJcbiAgb2YgbW9udGhseUlzRGF0YUluQ2FjaGUgaXMgdGhlIHNhbWUgYXMgd2Vla2x5SXNEYXRhSW5DYWNoZTpcclxuKiovXHJcbnZhciBtb250aGx5SXNEYXRhSW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGU7XHJcbmV4cG9ydHMubW9udGhseUlzRGF0YUluQ2FjaGUgPSBtb250aGx5SXNEYXRhSW5DYWNoZTtcclxuXHJcblxyXG5mdW5jdGlvbiB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgY3VycmVudERhdGVzUmFuZ2UpIHtcclxuICB2YXIgbmV4dERhdGVzUmFuZ2UgPSBkYXRlc1RvUmFuZ2UoXHJcbiAgICBkYXRlVXRpbHMuYWRkRGF5cyhjdXJyZW50RGF0ZXNSYW5nZS5zdGFydCwgNyksXHJcbiAgICBkYXRlVXRpbHMuYWRkRGF5cyhjdXJyZW50RGF0ZXNSYW5nZS5lbmQsIDcpXHJcbiAgKTtcclxuXHJcbiAgaWYgKCF3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgbmV4dERhdGVzUmFuZ2UpKSB7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IHdlZWsgaW4gYWR2YW5jZVxyXG4gICAgdmFyIHByZWZldGNoUXVlcnkgPSBkYXRlc1RvUXVlcnkobmV4dERhdGVzUmFuZ2UpO1xyXG4gICAgd2Vla2x5LmZldGNoRGF0YShwcmVmZXRjaFF1ZXJ5LCBudWxsLCB0cnVlKTtcclxuICB9XHJcbn1cclxuZXhwb3J0cy53ZWVrbHlDaGVja0FuZFByZWZldGNoID0gd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaDtcclxuXHJcbi8qKiBVcGRhdGUgdGhlIHZpZXcgbGFiZWxzIGZvciB0aGUgd2Vlay1kYXlzICh0YWJsZSBoZWFkZXJzKVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIGNhbGVuZGFyLCBvcHRpb25zKSB7XHJcbiAgdmFyIHN0YXJ0ID0gZGF0ZXNSYW5nZS5zdGFydCxcclxuICAgICAgZW5kID0gZGF0ZXNSYW5nZS5lbmQ7XHJcblxyXG4gIHZhciBkYXlzID0gY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMuZGF5cyArICcgdGgnKTtcclxuICB2YXIgdG9kYXkgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXcgRGF0ZSgpKTtcclxuICAvLyBGaXJzdCBjZWxsIGlzIGVtcHR5ICgndGhlIGNyb3NzIGhlYWRlcnMgY2VsbCcpLCB0aGVuIG9mZnNldCBpcyAxXHJcbiAgdmFyIG9mZnNldCA9IDE7XHJcbiAgZGF0ZVV0aWxzLmVhY2hEYXRlSW5SYW5nZShzdGFydCwgZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgdmFyIGNlbGwgPSAkKGRheXMuZ2V0KG9mZnNldCArIGkpKSxcclxuICAgICAgICBzZGF0ZSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUpLFxyXG4gICAgICAgIGxhYmVsID0gc2RhdGU7XHJcblxyXG4gICAgaWYgKHRvZGF5ID09IHNkYXRlKVxyXG4gICAgICBsYWJlbCA9IG9wdGlvbnMudGV4dHMudG9kYXk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGxhYmVsID0gb3B0aW9ucy50ZXh0cy5hYmJyV2Vla0RheXNbZGF0ZS5nZXREYXkoKV0gKyAnICcgKyBmb3JtYXREYXRlKGRhdGUsIG9wdGlvbnMudGV4dHMuYWJickRhdGVGb3JtYXQpO1xyXG5cclxuICAgIGNlbGwudGV4dChsYWJlbCk7XHJcbiAgfSk7XHJcbn1cclxuZXhwb3J0cy51cGRhdGVMYWJlbHMgPSB1cGRhdGVMYWJlbHM7XHJcblxyXG5mdW5jdGlvbiBmaW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgZGF5LCBzbG90KSB7XHJcbiAgc2xvdCA9IGRhdGVJU08ucGFyc2Uoc2xvdCk7XHJcbiAgdmFyIFxyXG4gICAgeCA9IE1hdGgucm91bmQoc2xvdC5nZXRIb3VycygpKSxcclxuICAvLyBUaW1lIGZyYW1lcyAoc2xvdHMpIGFyZSAxNSBtaW51dGVzIGRpdmlzaW9uc1xyXG4gICAgeSA9IE1hdGgucm91bmQoc2xvdC5nZXRNaW51dGVzKCkgLyAxNSksXHJcbiAgICB0ciA9IHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCc6ZXEoJyArIE1hdGgucm91bmQoeCAqIDQgKyB5KSArICcpJyk7XHJcblxyXG4gIC8vIFNsb3QgY2VsbCBmb3IgbydjbG9jayBob3VycyBpcyBhdCAxIHBvc2l0aW9uIG9mZnNldFxyXG4gIC8vIGJlY2F1c2Ugb2YgdGhlIHJvdy1oZWFkIGNlbGxcclxuICB2YXIgZGF5T2Zmc2V0ID0gKHkgPT09IDAgPyBkYXkgKyAxIDogZGF5KTtcclxuICByZXR1cm4gdHIuY2hpbGRyZW4oJzplcSgnICsgZGF5T2Zmc2V0ICsgJyknKTtcclxufVxyXG5leHBvcnRzLmZpbmRDZWxsQnlTbG90ID0gZmluZENlbGxCeVNsb3Q7XHJcblxyXG5mdW5jdGlvbiBmaW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCkge1xyXG4gIHZhciBcclxuICAgIHggPSBjZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChjZWxsKSxcclxuICAgIHkgPSBjZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKSxcclxuICAgIGZ1bGxNaW51dGVzID0geSAqIDE1LFxyXG4gICAgaG91cnMgPSBNYXRoLmZsb29yKGZ1bGxNaW51dGVzIC8gNjApLFxyXG4gICAgbWludXRlcyA9IGZ1bGxNaW51dGVzIC0gKGhvdXJzICogNjApLFxyXG4gICAgc2xvdCA9IG5ldyBEYXRlKCk7XHJcbiAgc2xvdC5zZXRIb3Vycyhob3VycywgbWludXRlcywgMCwgMCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBkYXk6IHgsXHJcbiAgICBzbG90OiBzbG90XHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmZpbmRTbG90QnlDZWxsID0gZmluZFNsb3RCeUNlbGw7XHJcblxyXG4vKipcclxuTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LXdlZWsgYW5kIGRpc2FibGUgcHJldiBidXR0b24sXHJcbm9yIHJlbW92ZSB0aGUgbWFyayBhbmQgZW5hYmxlIGl0IGlmIGlzIG5vdC5cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrQ3VycmVudFdlZWsoY2FsZW5kYXIsIGRhdGUsIG9wdGlvbnMpIHtcclxuICB2YXIgeWVwID0gZGF0ZVV0aWxzLmlzSW5DdXJyZW50V2VlayhkYXRlKTtcclxuICBjYWxlbmRhci50b2dnbGVDbGFzcyhvcHRpb25zLmNsYXNzZXMuY3VycmVudFdlZWssIHllcCk7XHJcbiAgY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMucHJldkFjdGlvbikucHJvcCgnZGlzYWJsZWQnLCB5ZXApO1xyXG59XHJcbmV4cG9ydHMuY2hlY2tDdXJyZW50V2VlayA9IGNoZWNrQ3VycmVudFdlZWs7XHJcblxyXG4vKiogR2V0IHF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBkYXRlIHJhbmdlIHNwZWNpZmllZDpcclxuKiovXHJcbmZ1bmN0aW9uIGRhdGVzVG9RdWVyeShzdGFydCwgZW5kKSB7XHJcbiAgLy8gVW5pcXVlIHBhcmFtIHdpdGggYm90aCBwcm9waWVydGllczpcclxuICBpZiAoc3RhcnQuZW5kKSB7XHJcbiAgICBlbmQgPSBzdGFydC5lbmQ7XHJcbiAgICBzdGFydCA9IHN0YXJ0LnN0YXJ0O1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGRhdGVJU08uZGF0ZUxvY2FsKHN0YXJ0LCB0cnVlKSxcclxuICAgIGVuZDogZGF0ZUlTTy5kYXRlTG9jYWwoZW5kLCB0cnVlKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5kYXRlc1RvUXVlcnkgPSBkYXRlc1RvUXVlcnk7XHJcblxyXG4vKiogUGFjayB0d28gZGF0ZXMgaW4gYSBzaW1wbGUgYnV0IHVzZWZ1bFxyXG5zdHJ1Y3R1cmUgeyBzdGFydCwgZW5kIH1cclxuKiovXHJcbmZ1bmN0aW9uIGRhdGVzVG9SYW5nZShzdGFydCwgZW5kKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBzdGFydCxcclxuICAgIGVuZDogZW5kXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmRhdGVzVG9SYW5nZSA9IGRhdGVzVG9SYW5nZTtcclxuIiwi77u/LyogR2VuZXJpYyBibG9ja1VJIG9wdGlvbnMgc2V0cyAqL1xyXG52YXIgbG9hZGluZ0Jsb2NrID0geyBtZXNzYWdlOiAnPGltZyB3aWR0aD1cIjQ4cHhcIiBoZWlnaHQ9XCI0OHB4XCIgY2xhc3M9XCJsb2FkaW5nLWluZGljYXRvclwiIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nIH07XHJcbnZhciBlcnJvckJsb2NrID0gZnVuY3Rpb24gKGVycm9yLCByZWxvYWQsIHN0eWxlKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGNzczogJC5leHRlbmQoeyBjdXJzb3I6ICdkZWZhdWx0JyB9LCBzdHlsZSB8fCB7fSksXHJcbiAgICAgICAgbWVzc2FnZTogJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT48ZGl2IGNsYXNzPVwiaW5mb1wiPlRoZXJlIHdhcyBhbiBlcnJvcicgK1xyXG4gICAgICAgICAgICAoZXJyb3IgPyAnOiAnICsgZXJyb3IgOiAnJykgK1xyXG4gICAgICAgICAgICAocmVsb2FkID8gJyA8YSBocmVmPVwiamF2YXNjcmlwdDogJyArIHJlbG9hZCArICc7XCI+Q2xpY2sgdG8gcmVsb2FkPC9hPicgOiAnJykgK1xyXG4gICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgfTtcclxufTtcclxudmFyIGluZm9CbG9jayA9IGZ1bmN0aW9uIChtZXNzYWdlLCBvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gJC5leHRlbmQoe1xyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj4nICsgbWVzc2FnZSArICc8L2Rpdj4nXHJcbiAgICAgICAgLyosY3NzOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0qL1xyXG4gICAgICAgICwgb3ZlcmxheUNTUzogeyBjdXJzb3I6ICdkZWZhdWx0JyB9XHJcbiAgICB9LCBvcHRpb25zKTtcclxufTtcclxuXHJcbi8vIE1vZHVsZTpcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBsb2FkaW5nOiBsb2FkaW5nQmxvY2ssXHJcbiAgICAgICAgZXJyb3I6IGVycm9yQmxvY2ssXHJcbiAgICAgICAgaW5mbzogaW5mb0Jsb2NrXHJcbiAgICB9O1xyXG59Iiwi77u/Lyo9IENoYW5nZXNOb3RpZmljYXRpb24gY2xhc3NcclxuKiB0byBub3RpZnkgdXNlciBhYm91dCBjaGFuZ2VzIGluIGZvcm1zLFxyXG4qIHRhYnMsIHRoYXQgd2lsbCBiZSBsb3N0IGlmIGdvIGF3YXkgZnJvbVxyXG4qIHRoZSBwYWdlLiBJdCBrbm93cyB3aGVuIGEgZm9ybSBpcyBzdWJtaXR0ZWRcclxuKiBhbmQgc2F2ZWQgdG8gZGlzYWJsZSBub3RpZmljYXRpb24sIGFuZCBnaXZlc1xyXG4qIG1ldGhvZHMgZm9yIG90aGVyIHNjcmlwdHMgdG8gbm90aWZ5IGNoYW5nZXNcclxuKiBvciBzYXZpbmcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBnZXRYUGF0aCA9IHJlcXVpcmUoJy4vZ2V0WFBhdGgnKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0ge1xyXG4gICAgY2hhbmdlc0xpc3Q6IHt9LFxyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgICB0YXJnZXQ6IG51bGwsXHJcbiAgICAgICAgZ2VuZXJpY0NoYW5nZVN1cHBvcnQ6IHRydWUsXHJcbiAgICAgICAgZ2VuZXJpY1N1Ym1pdFN1cHBvcnQ6IGZhbHNlLFxyXG4gICAgICAgIGNoYW5nZWRGb3JtQ2xhc3M6ICdoYXMtY2hhbmdlcycsXHJcbiAgICAgICAgY2hhbmdlZEVsZW1lbnRDbGFzczogJ2NoYW5nZWQnLFxyXG4gICAgICAgIG5vdGlmeUNsYXNzOiAnbm90aWZ5LWNoYW5nZXMnXHJcbiAgICB9LFxyXG4gICAgaW5pdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICAvLyBVc2VyIG5vdGlmaWNhdGlvbiB0byBwcmV2ZW50IGxvc3QgY2hhbmdlcyBkb25lXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VzTm90aWZpY2F0aW9uLm5vdGlmeSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0aGlzLmRlZmF1bHRzLCBvcHRpb25zKTtcclxuICAgICAgICBpZiAoIW9wdGlvbnMudGFyZ2V0KVxyXG4gICAgICAgICAgICBvcHRpb25zLnRhcmdldCA9IGRvY3VtZW50O1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNDaGFuZ2VTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignY2hhbmdlJywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCkgOmlucHV0W25hbWVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZSgkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksIHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljU3VibWl0U3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ3N1Ym1pdCcsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUodGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG5vdGlmeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIEFkZCBub3RpZmljYXRpb24gY2xhc3MgdG8gdGhlIGRvY3VtZW50XHJcbiAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMubm90aWZ5Q2xhc3MpO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgY2hhbmdlIGluIHRoZSBwcm9wZXJ0eSBsaXN0IHJldHVybmluZyB0aGUgbWVzc2FnZTpcclxuICAgICAgICBmb3IgKHZhciBjIGluIHRoaXMuY2hhbmdlc0xpc3QpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1aXRNZXNzYWdlIHx8ICh0aGlzLnF1aXRNZXNzYWdlID0gJCgnI2xjcmVzLXF1aXQtd2l0aG91dC1zYXZlJykudGV4dCgpKSB8fCAnJztcclxuICAgIH0sXHJcbiAgICByZWdpc3RlckNoYW5nZTogZnVuY3Rpb24gKGYsIGUpIHtcclxuICAgICAgICBpZiAoIWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICB2YXIgZmwgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdIHx8IFtdO1xyXG4gICAgICAgIGlmICgkLmlzQXJyYXkoZSkpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlckNoYW5nZShmLCBlW2ldKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbiA9IGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAoZSkgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIG4gPSBlLm5hbWU7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHJlYWxseSB0aGVyZSB3YXMgYSBjaGFuZ2UgY2hlY2tpbmcgZGVmYXVsdCBlbGVtZW50IHZhbHVlXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGUuZGVmYXVsdFZhbHVlKSAhPSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLmNoZWNrZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuc2VsZWN0ZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICBlLnZhbHVlID09IGUuZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSB3YXMgbm8gY2hhbmdlLCBubyBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgLy8gYW5kIG1heWJlIGlzIGEgcmVncmVzc2lvbiBmcm9tIGEgY2hhbmdlIGFuZCBub3cgdGhlIG9yaWdpbmFsIHZhbHVlIGFnYWluXHJcbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gcmVtb3ZlIGZyb20gY2hhbmdlcyBsaXN0IGRvaW5nIHJlZ2lzdGVyU2F2ZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlclNhdmUoZiwgW25dKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkKGUpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghKG4gaW4gZmwpKVxyXG4gICAgICAgICAgICBmbC5wdXNoKG4pO1xyXG4gICAgICAgICQoZilcclxuICAgICAgICAuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKVxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudCBuYW1lIGNoYW5nZWQsIGZvcm0gZWxlbWVudCBjaGFuZ2VkICh0aGlzIGNhbiBiZSBudWxsKVxyXG4gICAgICAgIC50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgW2YsIG4sIGVdKTtcclxuICAgIH0sXHJcbiAgICByZWdpc3RlclNhdmU6IGZ1bmN0aW9uIChmLCBlbHMpIHtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHByZXZFbHMgPSAkLmV4dGVuZChbXSwgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pO1xyXG4gICAgICAgIHZhciByID0gdHJ1ZTtcclxuICAgICAgICBpZiAoZWxzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gJC5ncmVwKHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLCBmdW5jdGlvbiAoZWwpIHsgcmV0dXJuICgkLmluQXJyYXkoZWwsIGVscykgPT0gLTEpOyB9KTtcclxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVtb3ZlICdmJyBsaXN0IGlmIGlzIG5vdCBlbXB0eVxyXG4gICAgICAgICAgICByID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0ubGVuZ3RoID09PSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgICAkKGYpLnJlbW92ZUNsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcyk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXTtcclxuICAgICAgICAgICAgLy8gbGluayBlbGVtZW50cyBmcm9tIGVscyB0byBjbGVhbi11cCBpdHMgY2xhc3Nlc1xyXG4gICAgICAgICAgICBlbHMgPSBwcmV2RWxzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnRzIHJlZ2lzdGVyZWQgYXMgc2F2ZSAodGhpcyBjYW4gYmUgbnVsbCksIGFuZCAnZm9ybSBmdWxseSBzYXZlZCcgYXMgdGhpcmQgcGFyYW0gKGJvb2wpXHJcbiAgICAgICAgJChmKS50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsIFtmLCBlbHMsIHJdKTtcclxuICAgICAgICB2YXIgbGNobiA9IHRoaXM7XHJcbiAgICAgICAgaWYgKGVscykgJC5lYWNoKGVscywgZnVuY3Rpb24gKCkgeyAkKCdbbmFtZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHRoaXMpICsgJ1wiXScpLnJlbW92ZUNsYXNzKGxjaG4uZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7IH0pO1xyXG4gICAgICAgIHJldHVybiBwcmV2RWxzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uO1xyXG59Iiwi77u/LyogVXRpbGl0eSB0byBjcmVhdGUgaWZyYW1lIHdpdGggaW5qZWN0ZWQgaHRtbC9jb250ZW50IGluc3RlYWQgb2YgVVJMLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVJZnJhbWUoY29udGVudCwgc2l6ZSkge1xyXG4gICAgdmFyICRpZnJhbWUgPSAkKCc8aWZyYW1lIHdpZHRoPVwiJyArIHNpemUud2lkdGggKyAnXCIgaGVpZ2h0PVwiJyArIHNpemUuaGVpZ2h0ICsgJ1wiIHN0eWxlPVwiYm9yZGVyOm5vbmU7XCI+PC9pZnJhbWU+Jyk7XHJcbiAgICB2YXIgaWZyYW1lID0gJGlmcmFtZS5nZXQoMCk7XHJcbiAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgcmVhZHlcclxuICAgIHZhciBpZnJhbWVsb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmcmFtZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gVXNpbmcgaWZyYW1lbG9hZGVkIHRvIGF2b2lkIGluZmluaXRlIGxvb3BzXHJcbiAgICAgICAgaWYgKCFpZnJhbWVsb2FkZWQpIHtcclxuICAgICAgICAgICAgaWZyYW1lbG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gJGlmcmFtZTtcclxufTtcclxuXHJcbi8qIFB1dHMgZnVsbCBodG1sIGluc2lkZSB0aGUgaWZyYW1lIGVsZW1lbnQgcGFzc2VkIGluIGEgc2VjdXJlIGFuZCBjb21wbGlhbnQgbW9kZSAqL1xyXG5mdW5jdGlvbiBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgaHRtbCkge1xyXG4gICAgLy8gcHV0IGFqYXggZGF0YSBpbnNpZGUgaWZyYW1lIHJlcGxhY2luZyBhbGwgdGhlaXIgaHRtbCBpbiBzZWN1cmUgXHJcbiAgICAvLyBjb21wbGlhbnQgbW9kZSAoJC5odG1sIGRvbid0IHdvcmtzIHRvIGluamVjdCA8aHRtbD48aGVhZD4gY29udGVudClcclxuXHJcbiAgICAvKiBkb2N1bWVudCBBUEkgdmVyc2lvbiAocHJvYmxlbXMgd2l0aCBJRSwgZG9uJ3QgZXhlY3V0ZSBpZnJhbWUtaHRtbCBzY3JpcHRzKSAqL1xyXG4gICAgLyp2YXIgaWZyYW1lRG9jID1cclxuICAgIC8vIFczQyBjb21wbGlhbnQ6IG5zLCBmaXJlZm94LWdlY2tvLCBjaHJvbWUvc2FmYXJpLXdlYmtpdCwgb3BlcmEsIGllOVxyXG4gICAgaWZyYW1lLmNvbnRlbnREb2N1bWVudCB8fFxyXG4gICAgLy8gb2xkIElFICg1LjUrKVxyXG4gICAgKGlmcmFtZS5jb250ZW50V2luZG93ID8gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgOiBudWxsKSB8fFxyXG4gICAgLy8gZmFsbGJhY2sgKHZlcnkgb2xkIElFPylcclxuICAgIGRvY3VtZW50LmZyYW1lc1tpZnJhbWUuaWRdLmRvY3VtZW50O1xyXG4gICAgaWZyYW1lRG9jLm9wZW4oKTtcclxuICAgIGlmcmFtZURvYy53cml0ZShodG1sKTtcclxuICAgIGlmcmFtZURvYy5jbG9zZSgpOyovXHJcblxyXG4gICAgLyogamF2YXNjcmlwdCBVUkkgdmVyc2lvbiAod29ya3MgZmluZSBldmVyeXdoZXJlISkgKi9cclxuICAgIGlmcmFtZS5jb250ZW50V2luZG93LmNvbnRlbnRzID0gaHRtbDtcclxuICAgIGlmcmFtZS5zcmMgPSAnamF2YXNjcmlwdDp3aW5kb3dbXCJjb250ZW50c1wiXSc7XHJcblxyXG4gICAgLy8gQWJvdXQgdGhpcyB0ZWNobmlxdWUsIHRoaXMgaHR0cDovL3NwYXJlY3ljbGVzLndvcmRwcmVzcy5jb20vMjAxMi8wMy8wOC9pbmplY3QtY29udGVudC1pbnRvLWEtbmV3LWlmcmFtZS9cclxufVxyXG5cclxuIiwi77u/LyogQ1JVREwgSGVscGVyICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxudmFyIGdldFRleHQgPSByZXF1aXJlKCcuL2dldFRleHQnKTtcclxudmFyIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5cclxuZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MgPSB7XHJcbiAgZWZmZWN0czoge1xyXG4gICAgJ3Nob3ctdmlld2VyJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sXHJcbiAgICAnaGlkZS12aWV3ZXInOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSxcclxuICAgICdzaG93LWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LCAvLyB0aGUgc2FtZSBhcyBqcXVlcnktdWkgeyBlZmZlY3Q6ICdzbGlkZScsIGR1cmF0aW9uOiAnc2xvdycsIGRpcmVjdGlvbjogJ2Rvd24nIH1cclxuICAgICdoaWRlLWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9XHJcbiAgfSxcclxuICBldmVudHM6IHtcclxuICAgICdlZGl0LWVuZHMnOiAnY3J1ZGwtZWRpdC1lbmRzJyxcclxuICAgICdlZGl0LXN0YXJ0cyc6ICdjcnVkbC1lZGl0LXN0YXJ0cycsXHJcbiAgICAnZWRpdG9yLXJlYWR5JzogJ2NydWRsLWVkaXRvci1yZWFkeScsXHJcbiAgICAnZWRpdG9yLXNob3dlZCc6ICdjcnVkbC1lZGl0b3Itc2hvd2VkJyxcclxuICAgICdjcmVhdGUnOiAnY3J1ZGwtY3JlYXRlJyxcclxuICAgICd1cGRhdGUnOiAnY3J1ZGwtdXBkYXRlJyxcclxuICAgICdkZWxldGUnOiAnY3J1ZGwtZGVsZXRlJ1xyXG4gIH0sXHJcbiAgZGF0YToge1xyXG4gICAgJ2ZvY3VzLWNsb3Nlc3QnOiB7XHJcbiAgICAgIG5hbWU6ICdjcnVkbC1mb2N1cy1jbG9zZXN0JyxcclxuICAgICAgJ2RlZmF1bHQnOiAnKidcclxuICAgIH0sXHJcbiAgICAnZm9jdXMtbWFyZ2luJzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtbWFyZ2luJyxcclxuICAgICAgJ2RlZmF1bHQnOiAwXHJcbiAgICB9LFxyXG4gICAgJ2ZvY3VzLWR1cmF0aW9uJzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtZHVyYXRpb24nLFxyXG4gICAgICAnZGVmYXVsdCc6IDIwMFxyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gIFV0aWxpdHkgdG8gZ2V0IGEgZGF0YSB2YWx1ZSBvciB0aGUgZGVmYXVsdCBiYXNlZCBvbiB0aGUgaW5zdGFuY2VcclxuICBzZXR0aW5ncyBvbiB0aGUgZ2l2ZW4gZWxlbWVudFxyXG4qKi9cclxuZnVuY3Rpb24gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBlbCwgc2V0dGluZ05hbWUpIHtcclxuICB2YXJcclxuICAgIHNldHRpbmcgPSBpbnN0YW5jZS5zZXR0aW5ncy5kYXRhW3NldHRpbmdOYW1lXSxcclxuICAgIHZhbCA9IGVsLmRhdGEoc2V0dGluZy5uYW1lKSB8fCBzZXR0aW5nWydkZWZhdWx0J107XHJcbiAgcmV0dXJuIHZhbDtcclxufVxyXG5cclxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uIHNldHVwQ3J1ZGwob25TdWNjZXNzLCBvbkVycm9yLCBvbkNvbXBsZXRlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uOiBmdW5jdGlvbiBvbihzZWxlY3Rvciwgc2V0dGluZ3MpIHtcclxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCAnLmNydWRsJztcclxuICAgICAgdmFyIGluc3RhbmNlID0ge1xyXG4gICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcclxuICAgICAgICBlbGVtZW50czogJChzZWxlY3RvcilcclxuICAgICAgfTtcclxuICAgICAgLy8gRXh0ZW5kaW5nIGRlZmF1bHQgc2V0dGluZ3Mgd2l0aCBwcm92aWRlZCBvbmVzLFxyXG4gICAgICAvLyBidXQgc29tZSBjYW4gYmUgdHdlYWsgb3V0c2lkZSB0b28uXHJcbiAgICAgIGluc3RhbmNlLnNldHRpbmdzID0gJC5leHRlbmQodHJ1ZSwgZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MsIHNldHRpbmdzKTtcclxuICAgICAgaW5zdGFuY2UuZWxlbWVudHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGNydWRsID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoY3J1ZGwuZGF0YSgnX19jcnVkbF9pbml0aWFsaXplZF9fJykgPT09IHRydWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZGN0eCA9IGNydWRsLmRhdGEoJ2NydWRsLWNvbnRleHQnKSB8fCAnJztcclxuICAgICAgICB2YXIgdndyID0gY3J1ZGwuZmluZCgnLmNydWRsLXZpZXdlcicpO1xyXG4gICAgICAgIHZhciBkdHIgPSBjcnVkbC5maW5kKCcuY3J1ZGwtZWRpdG9yJyk7XHJcbiAgICAgICAgdmFyIGlpZHBhciA9IGNydWRsLmRhdGEoJ2NydWRsLWl0ZW0taWQtcGFyYW1ldGVyJykgfHwgJ0l0ZW1JRCc7XHJcbiAgICAgICAgdmFyIGZvcm1wYXJzID0geyBhY3Rpb246ICdjcmVhdGUnIH07XHJcbiAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IDA7XHJcbiAgICAgICAgdmFyIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0RXh0cmFRdWVyeShlbCkge1xyXG4gICAgICAgICAgLy8gR2V0IGV4dHJhIHF1ZXJ5IG9mIHRoZSBlbGVtZW50LCBpZiBhbnk6XHJcbiAgICAgICAgICB2YXIgeHEgPSBlbC5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpIHx8ICcnO1xyXG4gICAgICAgICAgaWYgKHhxKSB4cSA9ICcmJyArIHhxO1xyXG4gICAgICAgICAgLy8gSXRlcmF0ZSBhbGwgcGFyZW50cyBpbmNsdWRpbmcgdGhlICdjcnVkbCcgZWxlbWVudCAocGFyZW50c1VudGlsIGV4Y2x1ZGVzIHRoZSBmaXJzdCBlbGVtZW50IGdpdmVuLFxyXG4gICAgICAgICAgLy8gYmVjYXVzZSBvZiB0aGF0IHdlIGdldCBpdHMgcGFyZW50KCkpXHJcbiAgICAgICAgICAvLyBGb3IgYW55IG9mIHRoZW0gd2l0aCBhbiBleHRyYS1xdWVyeSwgYXBwZW5kIGl0OlxyXG4gICAgICAgICAgZWwucGFyZW50c1VudGlsKGNydWRsLnBhcmVudCgpLCAnW2RhdGEtY3J1ZGwtZXh0cmEtcXVlcnldJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB4ID0gJCh0aGlzKS5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpO1xyXG4gICAgICAgICAgICBpZiAoeCkgeHEgKz0gJyYnICsgeDtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIHhxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3J1ZGwuZmluZCgnLmNydWRsLWNyZWF0ZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSAwO1xyXG4gICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ2NyZWF0ZSc7XHJcbiAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG4gICAgICAgICAgZHRyLnJlbG9hZCh7XHJcbiAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKHVybCwgZGVmYXVsdFVybCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VXJsICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGR0ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LWVkaXRvciddKVxyXG4gICAgICAgICAgICAgIC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgICBkdHIuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEhpZGUgdmlld2VyIHdoZW4gaW4gZWRpdG9yOlxyXG4gICAgICAgICAgdndyLnhoaWRlKGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtdmlld2VyJ10pO1xyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSlcclxuICAgICAgICAgIC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50cy5jcmVhdGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdndyXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtdXBkYXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAndXBkYXRlJztcclxuICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICBkdHIucmVsb2FkKHtcclxuICAgICAgICAgICAgdXJsOiBmdW5jdGlvbiAodXJsLCBkZWZhdWx0VXJsKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRVcmwgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgZHRyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctZWRpdG9yJ10pXHJcbiAgICAgICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIFtkdHJdKTtcclxuICAgICAgICAgICAgICAgIGR0ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgLy8gSGlkZSB2aWV3ZXIgd2hlbiBpbiBlZGl0b3I6XHJcbiAgICAgICAgICB2d3IueGhpZGUoaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS12aWV3ZXInXSk7XHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddKVxyXG4gICAgICAgICAgLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzLnVwZGF0ZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtZGVsZXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuXHJcbiAgICAgICAgICBpZiAoY29uZmlybShnZXRUZXh0KCdjb25maXJtLWRlbGV0ZS1jcnVkbC1pdGVtLW1lc3NhZ2U6JyArIGRjdHgpKSkge1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCc8ZGl2PicgKyBnZXRUZXh0KCdkZWxldGUtY3J1ZGwtaXRlbS1sb2FkaW5nLW1lc3NhZ2U6JyArIGRjdHgpICsgJzwvZGl2PicsIGl0ZW0pO1xyXG4gICAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gaXRlbWlkO1xyXG4gICAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAnZGVsZXRlJztcclxuICAgICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICB1cmw6IGR0ci5hdHRyKCdkYXRhLXNvdXJjZS11cmwnKSArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHEsXHJcbiAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbignPGRpdj4nICsgZGF0YS5SZXN1bHQgKyAnPC9kaXY+JywgaXRlbSwgbnVsbCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5mYWRlT3V0KCdzbG93JywgZnVuY3Rpb24gKCkgeyBpdGVtLnJlbW92ZSgpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgICAgICAgICAgICAgb25FcnJvcihqeCwgbWVzc2FnZSwgZXgpO1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UoaXRlbSk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjb21wbGV0ZTogb25Db21wbGV0ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydkZWxldGUnXSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBmaW5pc2hFZGl0KCkge1xyXG4gICAgICAgICAgZnVuY3Rpb24gb25jb21wbGV0ZShhbm90aGVyT25Db21wbGV0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIC8vIFNob3cgYWdhaW4gdGhlIFZpZXdlclxyXG4gICAgICAgICAgICAgIC8vdndyLnNsaWRlRG93bignc2xvdycpO1xyXG4gICAgICAgICAgICAgIGlmICghdndyLmlzKCc6dmlzaWJsZScpKVxyXG4gICAgICAgICAgICAgICAgdndyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctdmlld2VyJ10pO1xyXG4gICAgICAgICAgICAgIC8vIE1hcmsgdGhlIGZvcm0gYXMgdW5jaGFuZ2VkIHRvIGF2b2lkIHBlcnNpc3Rpbmcgd2FybmluZ3NcclxuICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcbiAgICAgICAgICAgICAgLy8gQXZvaWQgY2FjaGVkIGNvbnRlbnQgb24gdGhlIEVkaXRvclxyXG4gICAgICAgICAgICAgIGR0ci5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBTY3JvbGwgdG8gcHJlc2VydmUgY29ycmVjdCBmb2N1cyAob24gbGFyZ2UgcGFnZXMgd2l0aCBzaGFyZWQgY29udGVudCB1c2VyIGNhbiBnZXRcclxuICAgICAgICAgICAgICAvLyBsb3N0IGFmdGVyIGFuIGVkaXRpb24pXHJcbiAgICAgICAgICAgICAgLy8gKHdlIHF1ZXVlIGFmdGVyIHZ3ci54c2hvdyBiZWNhdXNlIHdlIG5lZWQgdG8gZG8gaXQgYWZ0ZXIgdGhlIHhzaG93IGZpbmlzaClcclxuICAgICAgICAgICAgICB2d3IucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzQ2xvc2VzdCA9IGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgY3J1ZGwsICdmb2N1cy1jbG9zZXN0Jyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNFbGVtZW50ID0gY3J1ZGwuY2xvc2VzdChmb2N1c0Nsb3Nlc3QpO1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gY2xvc2VzdCwgZ2V0IHRoZSBjcnVkbFxyXG4gICAgICAgICAgICAgICAgaWYgKGZvY3VzRWxlbWVudC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICAgIGZvY3VzRWxlbWVudCA9IGNydWRsO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzTWFyZ2luID0gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBjcnVkbCwgJ2ZvY3VzLW1hcmdpbicpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzRHVyYXRpb24gPSBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGNydWRsLCAnZm9jdXMtZHVyYXRpb24nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhmb2N1c0VsZW1lbnQsIHsgbWFyZ2luVG9wOiBmb2N1c01hcmdpbiwgZHVyYXRpb246IGZvY3VzRHVyYXRpb24gfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdndyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBjYWxsYmFjazpcclxuICAgICAgICAgICAgICBpZiAodHlwZW9mIChhbm90aGVyT25Db21wbGV0ZSkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICBhbm90aGVyT25Db21wbGV0ZS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBOT1RFOiBGaXJzdCwgd2Ugbm90aWZ5IHRoZSBjaGFuZ2VzLXNhdmVkIGFuZCBldmVudCwgdGhpcyBsYXN0IGFsbG93c1xyXG4gICAgICAgICAgLy8gY2xpZW50IHNjcmlwdHMgdG8gZG8gdGFza3MganVzdCBiZWZvcmUgdGhlIGVkaXRvciBiZWdpbnMgdG8gY2xvc2VcclxuICAgICAgICAgIC8vIChhdm9pZGluZyBwcm9ibGVtcyBsaWtlIHdpdGggdGhlICdtb3ZlRm9jdXNUbycgbm90IGJlaW5nIHByZWNpc2UgaWYgdGhlXHJcbiAgICAgICAgICAvLyBhbmltYXRpb24gZHVyYXRpb24gaXMgdGhlIHNhbWUgb24gY2xpZW50IHNjcmlwdCBhbmQgaGlkZS1lZGl0b3IpLlxyXG4gICAgICAgICAgLy8gVGhlbiwgZWRpdG9yIGdldHMgaGlkZGVuXHJcbiAgICAgICAgICAvLyBUT0RPOiBUaGlzIGNhbiBnZXQgZW5oYW5jZWQgdG8gYWxsb3cgbGFyZ2VyIGR1cmF0aW9ucyBvbiBjbGllbnQtc2NyaXB0c1xyXG4gICAgICAgICAgLy8gd2l0aG91dCBhZmZlY3QgbW92ZUZvY3VzVG8gcGFzc2luZyBpbiB0aGUgdHJpZ2dlciBhbiBvYmplY3QgdGhhdCBob2xkc1xyXG4gICAgICAgICAgLy8gYSBQcm9taXNlL0RlZmVycmVkIHRvIGJlIHNldCBieSBjbGllbnQtc2NyaXB0IGFzICdoaWRlLWVkaXRvciAmXHJcbiAgICAgICAgICAvLyB2aWV3ZXItc2hvdyBtdXN0IHN0YXJ0IHdoZW4gdGhpcyBwcm9taXNlIGdldHMgZnVsbGZpbGxlZCcsIGFsbG93aW5nIHRvXHJcbiAgICAgICAgICAvLyBoYXZlIGEgc2VxdWVuY2UgKGZpcnN0IGNsaWVudC1zY3JpcHRzLCB0aGVuIGhpZGUtZWRpdG9yKS5cclxuXHJcbiAgICAgICAgICAvLyBNYXJrIGZvcm0gYXMgc2F2ZWQgdG8gcmVtb3ZlIHRoZSAnaGFzLWNoYW5nZXMnIG1hcmtcclxuICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGR0ci5maW5kKCdmb3JtJykuZ2V0KDApKTtcclxuXHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSk7XHJcblxyXG4gICAgICAgICAgLy8gV2UgbmVlZCBhIGN1c3RvbSBjb21wbGV0ZSBjYWxsYmFjaywgYnV0IHRvIG5vdCByZXBsYWNlIHRoZSB1c2VyIGNhbGxiYWNrLCB3ZVxyXG4gICAgICAgICAgLy8gY2xvbmUgZmlyc3QgdGhlIHNldHRpbmdzIGFuZCB0aGVuIGFwcGx5IG91ciBjYWxsYmFjayB0aGF0IGludGVybmFsbHkgd2lsbCBjYWxsXHJcbiAgICAgICAgICAvLyB0aGUgdXNlciBjYWxsYmFjayBwcm9wZXJseSAoaWYgYW55KVxyXG4gICAgICAgICAgdmFyIHdpdGhjYWxsYmFjayA9ICQuZXh0ZW5kKHRydWUsIHt9LCBpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLWVkaXRvciddKTtcclxuICAgICAgICAgIHdpdGhjYWxsYmFjay5jb21wbGV0ZSA9IG9uY29tcGxldGUod2l0aGNhbGxiYWNrLmNvbXBsZXRlKTtcclxuICAgICAgICAgIC8vIEhpZGluZyBlZGl0b3I6XHJcbiAgICAgICAgICBkdHIueGhpZGUod2l0aGNhbGxiYWNrKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkdHJcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC1jYW5jZWwnLCBmaW5pc2hFZGl0KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsICcuYWpheC1ib3gnLCBmaW5pc2hFZGl0KVxyXG4gICAgICAgIC8vIEFuIGV2ZW50ZWQgbWV0aG9kOiB0cmlnZ2VyIHRoaXMgZXZlbnQgdG8gZXhlY3V0ZSBhIHZpZXdlciByZWxvYWQ6XHJcbiAgICAgICAgLm9uKCdyZWxvYWRMaXN0JywgJyonLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2d3IuZmluZCgnLmNydWRsLWxpc3QnKS5yZWxvYWQoeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCAnZm9ybSwgZmllbGRzZXQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCB8fCBkYXRhLkNvZGUgPT0gNSB8fCBkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBTaG93IHZpZXdlciBhbmQgcmVsb2FkIGxpc3Q6XHJcbiAgICAgICAgICAgIHZ3ci5maW5kKCcuY3J1ZGwtbGlzdCcpLnJlbG9hZCh7IGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBBIHNtYWxsIGRlbGF5IHRvIGxldCB1c2VyIHRvIHNlZSB0aGUgbmV3IG1lc3NhZ2Ugb24gYnV0dG9uIGJlZm9yZVxyXG4gICAgICAgICAgLy8gaGlkZSBpdCAoYmVjYXVzZSBpcyBpbnNpZGUgdGhlIGVkaXRvcilcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT0gNSlcclxuICAgICAgICAgICAgc2V0VGltZW91dChmaW5pc2hFZGl0LCAxMDAwKTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0sZmllbGRzZXQnLCBmdW5jdGlvbiAoamIsIGZvcm0sIGp4KSB7XHJcbiAgICAgICAgICAvLyBFbWl0IHRoZSAnZWRpdG9yLXJlYWR5JyBldmVudCBvbiBlZGl0b3IgSHRtbCBiZWluZyByZXBsYWNlZFxyXG4gICAgICAgICAgLy8gKGZpcnN0IGxvYWQgb3IgbmV4dCBsb2FkcyBiZWNhdXNlIG9mIHNlcnZlci1zaWRlIHZhbGlkYXRpb24gZXJyb3JzKVxyXG4gICAgICAgICAgLy8gdG8gYWxsb3cgbGlzdGVuZXJzIHRvIGRvIGFueSB3b3JrIG92ZXIgaXRzIChuZXcpIERPTSBlbGVtZW50cy5cclxuICAgICAgICAgIC8vIFRoZSBzZWNvbmQgY3VzdG9tIHBhcmFtZXRlciBwYXNzZWQgbWVhbnMgaXMgbWVhbiB0b1xyXG4gICAgICAgICAgLy8gZGlzdGluZ3Vpc2ggdGhlIGZpcnN0IHRpbWUgY29udGVudCBsb2FkIGFuZCBzdWNjZXNzaXZlIHVwZGF0ZXMgKGR1ZSB0byB2YWxpZGF0aW9uIGVycm9ycykuXHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIFtkdHIsIGVkaXRvckluaXRpYWxMb2FkXSk7XHJcblxyXG4gICAgICAgICAgLy8gTmV4dCB0aW1lczpcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNydWRsLmRhdGEoJ19fY3J1ZGxfaW5pdGlhbGl6ZWRfXycsIHRydWUpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG4iLCLvu78vKipcclxuICBUaGlzIG1vZHVsZSBoYXMgdXRpbGl0aWVzIHRvIGNvbnZlcnQgYSBEYXRlIG9iamVjdCBpbnRvXHJcbiAgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gZm9sbG93aW5nIElTTy04NjAxIHNwZWNpZmljYXRpb24uXHJcbiAgXHJcbiAgSU5DT01QTEVURSBCVVQgVVNFRlVMLlxyXG4gIFxyXG4gIFN0YW5kYXJkIHJlZmVycyB0byBmb3JtYXQgdmFyaWF0aW9uczpcclxuICAtIGJhc2ljOiBtaW5pbXVtIHNlcGFyYXRvcnNcclxuICAtIGV4dGVuZGVkOiBhbGwgc2VwYXJhdG9ycywgbW9yZSByZWFkYWJsZVxyXG4gIEJ5IGRlZmF1bHQsIGFsbCBtZXRob2RzIHByaW50cyB0aGUgYmFzaWMgZm9ybWF0LFxyXG4gIGV4Y2VwdHMgdGhlIHBhcmFtZXRlciAnZXh0ZW5kZWQnIGlzIHNldCB0byB0cnVlXHJcblxyXG4gIFRPRE86XHJcbiAgLSBUWjogYWxsb3cgZm9yIFRpbWUgWm9uZSBzdWZmaXhlcyAocGFyc2UgYWxsb3cgaXQgYW5kIFxyXG4gICAgZGV0ZWN0IFVUQyBidXQgZG8gbm90aGluZyB3aXRoIGFueSB0aW1lIHpvbmUgb2Zmc2V0IGRldGVjdGVkKVxyXG4gIC0gRnJhY3Rpb25zIG9mIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMuZGF0ZVVUQyA9IGZ1bmN0aW9uIGRhdGVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgbSA9IChkYXRlLmdldFVUQ01vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICBkID0gZGF0ZS5nZXRVVENEYXRlKCkudG9TdHJpbmcoKSxcclxuICAgICAgeSA9IGRhdGUuZ2V0VVRDRnVsbFllYXIoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG4gIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgZCA9ICcwJyArIGQ7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiB5ICsgJy0nICsgbSArICctJyArIGQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIHkgKyBtICsgZDtcclxufTtcclxuXHJcbmV4cG9ydHMuZGF0ZUxvY2FsID0gZnVuY3Rpb24gZGF0ZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIG0gPSAoZGF0ZS5nZXRNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgZCA9IGRhdGUuZ2V0RGF0ZSgpLnRvU3RyaW5nKCksXHJcbiAgICAgIHkgPSBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG4gIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgZCA9ICcwJyArIGQ7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiB5ICsgJy0nICsgbSArICctJyArIGQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIHkgKyBtICsgZDtcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzLCBtaW51dGVzIGFuZCBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLnRpbWVMb2NhbCA9IGZ1bmN0aW9uIHRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBzID0gZGF0ZS5nZXRTZWNvbmRzKCkudG9TdHJpbmcoKSxcclxuICAgICAgaG0gPSBleHBvcnRzLnNob3J0VGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKHMubGVuZ3RoID09IDEpXHJcbiAgICBzID0gJzAnICsgcztcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGhtICsgJzonICsgcztcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaG0gKyBzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMsIG1pbnV0ZXMgYW5kIHNlY29uZHMgVVRDXHJcbioqL1xyXG5leHBvcnRzLnRpbWVVVEMgPSBmdW5jdGlvbiB0aW1lVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIHMgPSBkYXRlLmdldFVUQ1NlY29uZHMoKS50b1N0cmluZygpLFxyXG4gICAgICBobSA9IGV4cG9ydHMuc2hvcnRUaW1lVVRDKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKHMubGVuZ3RoID09IDEpXHJcbiAgICBzID0gJzAnICsgcztcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGhtICsgJzonICsgcztcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaG0gKyBzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMgYW5kIG1pbnV0ZXNcclxuKiovXHJcbmV4cG9ydHMuc2hvcnRUaW1lTG9jYWwgPSBmdW5jdGlvbiBzaG9ydFRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBoID0gZGF0ZS5nZXRIb3VycygpLnRvU3RyaW5nKCksXHJcbiAgICAgIG0gPSBkYXRlLmdldE1pbnV0ZXMoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAoaC5sZW5ndGggPT0gMSlcclxuICAgIGggPSAnMCcgKyBoO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBoICsgJzonICsgbTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaCArIG07XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycyBhbmQgbWludXRlcyBVVENcclxuKiovXHJcbmV4cG9ydHMuc2hvcnRUaW1lVVRDID0gZnVuY3Rpb24gc2hvcnRUaW1lVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIGggPSBkYXRlLmdldFVUQ0hvdXJzKCkudG9TdHJpbmcoKSxcclxuICAgICAgbSA9IGRhdGUuZ2V0VVRDTWludXRlcygpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChoLmxlbmd0aCA9PSAxKVxyXG4gICAgaCA9ICcwJyArIGg7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGggKyAnOicgKyBtO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBoICsgbTtcclxufTtcclxuXHJcbi8qKlxyXG4gIFRPRE86IEhvdXJzLCBtaW51dGVzLCBzZWNvbmRzIGFuZCBmcmFjdGlvbnMgb2Ygc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy5sb25nVGltZUxvY2FsID0gZnVuY3Rpb24gbG9uZ1RpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIC8vVE9ET1xyXG59O1xyXG5cclxuLyoqXHJcbiAgVVRDIERhdGUgYW5kIFRpbWUgc2VwYXJhdGVkIGJ5IFQuXHJcbiAgU3RhbmRhcmQgYWxsb3dzIG9taXQgdGhlIHNlcGFyYXRvciBhcyBleGNlcHRpb25hbCwgYm90aCBwYXJ0cyBhZ3JlZW1lbnQsIGNhc2VzO1xyXG4gIGNhbiBiZSBkb25lIHBhc3NpbmcgdHJ1ZSBhcyBvZiBvbWl0U2VwYXJhdG9yIHBhcmFtZXRlciwgYnkgZGVmYXVsdCBmYWxzZS5cclxuKiovXHJcbmV4cG9ydHMuZGF0ZXRpbWVMb2NhbCA9IGZ1bmN0aW9uIGRhdGV0aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQsIG9taXRTZXBhcmF0b3IpIHtcclxuICB2YXIgZCA9IGV4cG9ydHMuZGF0ZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSxcclxuICAgICAgdCA9IGV4cG9ydHMudGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKG9taXRTZXBhcmF0b3IpXHJcbiAgICByZXR1cm4gZCArIHQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGQgKyAnVCcgKyB0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgTG9jYWwgRGF0ZSBhbmQgVGltZSBzZXBhcmF0ZWQgYnkgVC5cclxuICBTdGFuZGFyZCBhbGxvd3Mgb21pdCB0aGUgc2VwYXJhdG9yIGFzIGV4Y2VwdGlvbmFsLCBib3RoIHBhcnRzIGFncmVlbWVudCwgY2FzZXM7XHJcbiAgY2FuIGJlIGRvbmUgcGFzc2luZyB0cnVlIGFzIG9mIG9taXRTZXBhcmF0b3IgcGFyYW1ldGVyLCBieSBkZWZhdWx0IGZhbHNlLlxyXG4qKi9cclxuZXhwb3J0cy5kYXRldGltZVVUQyA9IGZ1bmN0aW9uIGRhdGV0aW1lVVRDKGRhdGUsIGV4dGVuZGVkLCBvbWl0U2VwYXJhdG9yKSB7XHJcbiAgdmFyIGQgPSBleHBvcnRzLmRhdGVVVEMoZGF0ZSwgZXh0ZW5kZWQpLFxyXG4gICAgICB0ID0gZXhwb3J0cy50aW1lVVRDKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKG9taXRTZXBhcmF0b3IpXHJcbiAgICByZXR1cm4gZCArIHQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGQgKyAnVCcgKyB0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgUGFyc2UgYSBzdHJpbmcgaW50byBhIERhdGUgb2JqZWN0IGlmIGlzIGEgdmFsaWQgSVNPLTg2MDEgZm9ybWF0LlxyXG4gIFBhcnNlIHNpbmdsZSBkYXRlLCBzaW5nbGUgdGltZSBvciBkYXRlLXRpbWUgZm9ybWF0cy5cclxuICBJTVBPUlRBTlQ6IEl0IGRvZXMgTk9UIGNvbnZlcnQgYmV0d2VlbiB0aGUgZGF0ZXN0ciBUaW1lWm9uZSBhbmQgdGhlXHJcbiAgbG9jYWwgVGltZVpvbmUgKGVpdGhlciBpdCBhbGxvd3MgZGF0ZXN0ciB0byBpbmNsdWRlZCBUaW1lWm9uZSBpbmZvcm1hdGlvbilcclxuICBUT0RPOiBPcHRpb25hbCBUIHNlcGFyYXRvciBpcyBub3QgYWxsb3dlZC5cclxuICBUT0RPOiBNaWxsaXNlY29uZHMvZnJhY3Rpb25zIG9mIHNlY29uZHMgbm90IHN1cHBvcnRlZFxyXG4qKi9cclxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIHBhcnNlKGRhdGVzdHIpIHtcclxuICB2YXIgZHQgPSBkYXRlc3RyLnNwbGl0KCdUJyksXHJcbiAgICBkYXRlID0gZHRbMF0sXHJcbiAgICB0aW1lID0gZHQubGVuZ3RoID09IDIgPyBkdFsxXSA6IG51bGw7XHJcblxyXG4gIGlmIChkdC5sZW5ndGggPiAyKVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IGZvcm1hdFwiKTtcclxuXHJcbiAgLy8gQ2hlY2sgaWYgZGF0ZSBjb250YWlucyBhIHRpbWU7XHJcbiAgLy8gYmVjYXVzZSBtYXliZSBkYXRlc3RyIGlzIG9ubHkgdGhlIHRpbWUgcGFydFxyXG4gIGlmICgvOnxeXFxkezQsNn1bXlxcLV0oXFwuXFxkKik/KD86WnxbK1xcLV0uKik/JC8udGVzdChkYXRlKSkge1xyXG4gICAgdGltZSA9IGRhdGU7XHJcbiAgICBkYXRlID0gbnVsbDtcclxuICB9XHJcblxyXG4gIHZhciB5LCBtLCBkLCBoLCBtbSwgcywgdHosIHV0YztcclxuXHJcbiAgaWYgKGRhdGUpIHtcclxuICAgIHZhciBkcGFydHMgPSAvKFxcZHs0fSlcXC0/KFxcZHsyfSlcXC0/KFxcZHsyfSkvLmV4ZWMoZGF0ZSk7XHJcbiAgICBpZiAoIWRwYXJ0cylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IGRhdGUgZm9ybWF0XCIpO1xyXG5cclxuICAgIHkgPSBkcGFydHNbMV07XHJcbiAgICBtID0gZHBhcnRzWzJdO1xyXG4gICAgZCA9IGRwYXJ0c1szXTtcclxuICB9XHJcblxyXG4gIGlmICh0aW1lKSB7XHJcbiAgICB2YXIgdHBhcnRzID0gLyhcXGR7Mn0pOj8oXFxkezJ9KSg/Ojo/KFxcZHsyfSkpPyhafFsrXFwtXS4qKT8vLmV4ZWModGltZSk7XHJcbiAgICBpZiAoIXRwYXJ0cylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IHRpbWUgZm9ybWF0XCIpO1xyXG5cclxuICAgIGggPSB0cGFydHNbMV07XHJcbiAgICBtbSA9IHRwYXJ0c1syXTtcclxuICAgIHMgPSB0cGFydHMubGVuZ3RoID4gMyA/IHRwYXJ0c1szXSA6IG51bGw7XHJcbiAgICB0eiA9IHRwYXJ0cy5sZW5ndGggPiA0ID8gdHBhcnRzWzRdIDogbnVsbDtcclxuICAgIC8vIERldGVjdHMgaWYgaXMgYSB0aW1lIGluIFVUQzpcclxuICAgIHV0YyA9IC9eWiQvaS50ZXN0KHR6KTtcclxuICB9XHJcblxyXG4gIC8vIFZhciB0byBob2xkIHRoZSBwYXJzZWQgdmFsdWUsIHdlIHN0YXJ0IHdpdGggdG9kYXksXHJcbiAgLy8gdGhhdCB3aWxsIGZpbGwgdGhlIG1pc3NpbmcgcGFydHNcclxuICB2YXIgcGFyc2VkRGF0ZSA9IG5ldyBEYXRlKCk7XHJcblxyXG4gIGlmIChkYXRlKSB7XHJcbiAgICAvLyBVcGRhdGluZyB0aGUgZGF0ZSBvYmplY3Qgd2l0aCBlYWNoIHllYXIsIG1vbnRoIGFuZCBkYXRlL2RheSBkZXRlY3RlZDpcclxuICAgIGlmICh1dGMpXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0VVRDRnVsbFllYXIoeSwgbSwgZCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0RnVsbFllYXIoeSwgbSwgZCk7XHJcbiAgfVxyXG5cclxuICBpZiAodGltZSkge1xyXG4gICAgaWYgKHV0YylcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRVVENIb3VycyhoLCBtbSwgcyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0SG91cnMoaCwgbW0sIHMpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBBIGRhdGUgd2l0aG91dCB0aW1lIHBhcnQgbXVzdCBiZSBjb25zaWRlcmVkIGFzIDAwOjAwOjAwIGluc3RlYWQgb2YgY3VycmVudCB0aW1lXHJcbiAgICBwYXJzZWREYXRlLnNldEhvdXJzKDAsIDAsIDApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHBhcnNlZERhdGU7XHJcbn07Iiwi77u/LyogRGF0ZSBwaWNrZXIgaW5pdGlhbGl6YXRpb24gYW5kIHVzZVxyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cERhdGVQaWNrZXIoKSB7XHJcbiAgICAvLyBEYXRlIFBpY2tlclxyXG4gICAgJC5kYXRlcGlja2VyLnNldERlZmF1bHRzKCQuZGF0ZXBpY2tlci5yZWdpb25hbFskKCdodG1sJykuYXR0cignbGFuZycpXSk7XHJcbiAgICAkKCcuZGF0ZS1waWNrJywgZG9jdW1lbnQpLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIHNob3dBbmltOiAnYmxpbmQnXHJcbiAgICB9KTtcclxuICAgIGFwcGx5RGF0ZVBpY2tlcigpO1xyXG59XHJcbmZ1bmN0aW9uIGFwcGx5RGF0ZVBpY2tlcihlbGVtZW50KSB7XHJcbiAgICAkKFwiLmRhdGUtcGlja1wiLCBlbGVtZW50IHx8IGRvY3VtZW50KVxyXG4gICAgLy8udmFsKG5ldyBEYXRlKCkuYXNTdHJpbmcoJC5kYXRlcGlja2VyLl9kZWZhdWx0cy5kYXRlRm9ybWF0KSlcclxuICAgIC5kYXRlcGlja2VyKHtcclxuICAgICAgICBzaG93QW5pbTogXCJibGluZFwiXHJcbiAgICB9KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdDogc2V0dXBEYXRlUGlja2VyLFxyXG4gICAgICAgIGFwcGx5OiBhcHBseURhdGVQaWNrZXJcclxuICAgIH07XHJcbiIsIu+7vy8qIEZvcm1hdCBhIGRhdGUgYXMgWVlZWS1NTS1ERCBpbiBVVEMgZm9yIHNhdmUgdXNcclxuICAgIHRvIGludGVyY2hhbmdlIHdpdGggb3RoZXIgbW9kdWxlcyBvciBhcHBzLlxyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKSB7XHJcbiAgICB2YXIgbSA9IChkYXRlLmdldFVUQ01vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICAgIGQgPSBkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpO1xyXG4gICAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICAgICAgbSA9ICcwJyArIG07XHJcbiAgICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgICAgICBkID0gJzAnICsgZDtcclxuICAgIHJldHVybiBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKSArICctJyArIG0gKyAnLScgKyBkO1xyXG59OyIsIu+7vy8qKiBBbiBpMThuIHV0aWxpdHksIGdldCBhIHRyYW5zbGF0aW9uIHRleHQgYnkgbG9va2luZyBmb3Igc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlIGh0bWxcclxud2l0aCB0aGUgbmFtZSBnaXZlbiBhcyBmaXJzdCBwYXJhbWVudGVyIGFuZCBhcHBseWluZyB0aGUgZ2l2ZW4gdmFsdWVzIG9uIHNlY29uZCBhbmQgXHJcbm90aGVyIHBhcmFtZXRlcnMuXHJcbiAgICBUT0RPOiBSRS1JTVBMRU1FTlQgbm90IHVzaW5nIGpRdWVyeSBuZWxzZSBET00gZWxlbWVudHMsIG9yIGFsbW9zdCBub3QgZWxlbWVudHMgaW5zaWRlIGJvZHlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG5mdW5jdGlvbiBnZXRUZXh0KCkge1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAvLyBHZXQga2V5IGFuZCB0cmFuc2xhdGUgaXRcclxuICAgIHZhciBmb3JtYXR0ZWQgPSBhcmdzWzBdO1xyXG4gICAgdmFyIHRleHQgPSAkKCcjbGNyZXMtJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoZm9ybWF0dGVkKSkudGV4dCgpO1xyXG4gICAgaWYgKHRleHQpXHJcbiAgICAgICAgZm9ybWF0dGVkID0gdGV4dDtcclxuICAgIC8vIEFwcGx5IGZvcm1hdCB0byB0aGUgdGV4dCB3aXRoIGFkZGl0aW9uYWwgcGFyYW1ldGVyc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7JyArIGkgKyAnXFxcXH0nLCAnZ2knKTtcclxuICAgICAgICBmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZShyZWdleHAsIGFyZ3NbaSArIDFdKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmb3JtYXR0ZWQ7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0VGV4dDsiLCLvu78vKiogUmV0dXJucyB0aGUgcGF0aCB0byB0aGUgZ2l2ZW4gZWxlbWVudCBpbiBYUGF0aCBjb252ZW50aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gZ2V0WFBhdGgoZWxlbWVudCkge1xyXG4gICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5pZClcclxuICAgICAgICByZXR1cm4gJy8vKltAaWQ9XCInICsgZWxlbWVudC5pZCArICdcIl0nO1xyXG4gICAgdmFyIHhwYXRoID0gJyc7XHJcbiAgICBmb3IgKDsgZWxlbWVudCAmJiBlbGVtZW50Lm5vZGVUeXBlID09IDE7IGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICB2YXIgaWQgPSAkKGVsZW1lbnQucGFyZW50Tm9kZSkuY2hpbGRyZW4oZWxlbWVudC50YWdOYW1lKS5pbmRleChlbGVtZW50KSArIDE7XHJcbiAgICAgICAgaWQgPSAoaWQgPiAxID8gJ1snICsgaWQgKyAnXScgOiAnJyk7XHJcbiAgICAgICAgeHBhdGggPSAnLycgKyBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSArIGlkICsgeHBhdGg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geHBhdGg7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0WFBhdGg7XHJcbiIsIu+7vy8vIEl0IGV4ZWN1dGVzIHRoZSBnaXZlbiAncmVhZHknIGZ1bmN0aW9uIGFzIHBhcmFtZXRlciB3aGVuXHJcbi8vIG1hcCBlbnZpcm9ubWVudCBpcyByZWFkeSAod2hlbiBnb29nbGUgbWFwcyBhcGkgYW5kIHNjcmlwdCBpc1xyXG4vLyBsb2FkZWQgYW5kIHJlYWR5IHRvIHVzZSwgb3IgaW5tZWRpYXRlbHkgaWYgaXMgYWxyZWFkeSBsb2FkZWQpLlxyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XHJcblxyXG4vLyBQcml2YXRlIHN0YXRpYyBjb2xsZWN0aW9uIG9mIGNhbGxiYWNrcyByZWdpc3RlcmVkXHJcbnZhciBzdGFjayA9IFtdO1xyXG5cclxudmFyIGdvb2dsZU1hcFJlYWR5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnb29nbGVNYXBSZWFkeShyZWFkeSkge1xyXG4gIHN0YWNrLnB1c2gocmVhZHkpO1xyXG5cclxuICBpZiAoZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSlcclxuICAgIHJlYWR5KCk7XHJcbiAgZWxzZSBpZiAoIWdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZykge1xyXG4gICAgZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nID0gdHJ1ZTtcclxuICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgc2NyaXB0czogW1wiaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9qc2FwaVwiXSxcclxuICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHsgcmV0dXJuICEhd2luZG93Lmdvb2dsZTsgfSxcclxuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBnb29nbGUubG9hZChcIm1hcHNcIiwgXCIzLjEwXCIsIHsgb3RoZXJfcGFyYW1zOiBcInNlbnNvcj1mYWxzZVwiLCBcImNhbGxiYWNrXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzUmVhZHkgPSB0cnVlO1xyXG4gICAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBzdGFja1tpXSgpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFV0aWxpdHkgdG8gZm9yY2UgdGhlIHJlZnJlc2ggb2YgbWFwcyB0aGF0IHNvbHZlIHRoZSBwcm9ibGVtIHdpdGggYmFkLXNpemVkIG1hcCBhcmVhXHJcbmdvb2dsZU1hcFJlYWR5LnJlZnJlc2hNYXAgPSBmdW5jdGlvbiByZWZyZXNoTWFwcyhtYXApIHtcclxuICBnb29nbGVNYXBSZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyKG1hcCwgXCJyZXNpemVcIik7XHJcbiAgfSk7XHJcbn07XHJcbiIsIu+7vy8qIEdVSUQgR2VuZXJhdG9yXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGd1aWRHZW5lcmF0b3IoKSB7XHJcbiAgICB2YXIgUzQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDApIHwgMCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gKFM0KCkgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgUzQoKSArIFM0KCkpO1xyXG59OyIsIu+7vy8qKlxyXG4gICAgR2VuZXJpYyBzY3JpcHQgZm9yIGZpZWxkc2V0cyB3aXRoIGNsYXNzIC5oYXMtY29uZmlybSwgYWxsb3dpbmcgc2hvd1xyXG4gICAgdGhlIGNvbnRlbnQgb25seSBpZiB0aGUgbWFpbiBjb25maXJtIGZpZWxkcyBoYXZlICd5ZXMnIHNlbGVjdGVkLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBkZWZhdWx0U2VsZWN0b3IgPSAnZmllbGRzZXQuaGFzLWNvbmZpcm0gPiAuY29uZmlybSBpbnB1dCc7XHJcblxyXG5mdW5jdGlvbiBvbmNoYW5nZSgpIHtcclxuICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgIHZhciBmcyA9IHQuY2xvc2VzdCgnZmllbGRzZXQnKTtcclxuICAgIGlmICh0LmlzKCc6Y2hlY2tlZCcpKVxyXG4gICAgICAgIGlmICh0LnZhbCgpID09ICd5ZXMnIHx8IHQudmFsKCkgPT0gJ1RydWUnKVxyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcygnY29uZmlybWVkLW5vJykuYWRkQ2xhc3MoJ2NvbmZpcm1lZC15ZXMnKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKCdjb25maXJtZWQteWVzJykuYWRkQ2xhc3MoJ2NvbmZpcm1lZC1ubycpO1xyXG59XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IGRlZmF1bHRTZWxlY3RvcjtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgc2VsZWN0b3IsIG9uY2hhbmdlKTtcclxuICAgIC8vIFBlcmZvcm1zIGZpcnN0IGNoZWNrOlxyXG4gICAgJChzZWxlY3RvcikuY2hhbmdlKCk7XHJcbn07XHJcblxyXG5leHBvcnRzLm9mZiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBkZWZhdWx0U2VsZWN0b3I7XHJcblxyXG4gICAgJChkb2N1bWVudCkub2ZmKCdjaGFuZ2UnLCBzZWxlY3Rvcik7XHJcbn07Iiwi77u/LyogSW50ZXJuYXppb25hbGl6YXRpb24gVXRpbGl0aWVzXHJcbiAqL1xyXG52YXIgaTE4biA9IHt9O1xyXG5pMThuLmRpc3RhbmNlVW5pdHMgPSB7XHJcbiAgICAnRVMnOiAna20nLFxyXG4gICAgJ1VTJzogJ21pbGVzJ1xyXG59O1xyXG5pMThuLm51bWVyaWNNaWxlc1NlcGFyYXRvciA9IHtcclxuICAgICdlcy1FUyc6ICcuJyxcclxuICAgICdlcy1VUyc6ICcuJyxcclxuICAgICdlbi1VUyc6ICcsJyxcclxuICAgICdlbi1FUyc6ICcsJ1xyXG59O1xyXG5pMThuLm51bWVyaWNEZWNpbWFsU2VwYXJhdG9yID0ge1xyXG4gICAgJ2VzLUVTJzogJywnLFxyXG4gICAgJ2VzLVVTJzogJywnLFxyXG4gICAgJ2VuLVVTJzogJy4nLFxyXG4gICAgJ2VuLUVTJzogJy4nXHJcbn07XHJcbmkxOG4ubW9uZXlTeW1ib2xQcmVmaXggPSB7XHJcbiAgICAnRVMnOiAnJyxcclxuICAgICdVUyc6ICckJ1xyXG59O1xyXG5pMThuLm1vbmV5U3ltYm9sU3VmaXggPSB7XHJcbiAgICAnRVMnOiAn4oKsJyxcclxuICAgICdVUyc6ICcnXHJcbn07XHJcbmkxOG4uZ2V0Q3VycmVudEN1bHR1cmUgPSBmdW5jdGlvbiBnZXRDdXJyZW50Q3VsdHVyZSgpIHtcclxuICAgIHZhciBjID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1jdWx0dXJlJyk7XHJcbiAgICB2YXIgcyA9IGMuc3BsaXQoJy0nKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3VsdHVyZTogYyxcclxuICAgICAgICBsYW5ndWFnZTogc1swXSxcclxuICAgICAgICBjb3VudHJ5OiBzWzFdXHJcbiAgICB9O1xyXG59O1xyXG5pMThuLmNvbnZlcnRNaWxlc0ttID0gZnVuY3Rpb24gY29udmVydE1pbGVzS20ocSwgdW5pdCkge1xyXG4gICAgdmFyIE1JTEVTX1RPX0tNID0gMS42MDk7XHJcbiAgICBpZiAodW5pdCA9PSAnbWlsZXMnKVxyXG4gICAgICAgIHJldHVybiBNSUxFU19UT19LTSAqIHE7XHJcbiAgICBlbHNlIGlmICh1bml0ID09ICdrbScpXHJcbiAgICAgICAgcmV0dXJuIHEgLyBNSUxFU19UT19LTTtcclxuICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUubG9nKSBjb25zb2xlLmxvZygnY29udmVydE1pbGVzS206IFVucmVjb2duaXplZCB1bml0ICcgKyB1bml0KTtcclxuICAgIHJldHVybiAwO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBpMThuOyIsIu+7vy8qIFJldHVybnMgdHJ1ZSB3aGVuIHN0ciBpc1xyXG4tIG51bGxcclxuLSBlbXB0eSBzdHJpbmdcclxuLSBvbmx5IHdoaXRlIHNwYWNlcyBzdHJpbmdcclxuKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0VtcHR5U3RyaW5nKHN0cikge1xyXG4gICAgcmV0dXJuICEoL1xcUy9nLnRlc3Qoc3RyIHx8IFwiXCIpKTtcclxufTsiLCLvu78vKiogQXMgdGhlICdpcycgalF1ZXJ5IG1ldGhvZCwgYnV0IGNoZWNraW5nIEBzZWxlY3RvciBpbiBhbGwgZWxlbWVudHNcclxuKiBAbW9kaWZpZXIgdmFsdWVzOlxyXG4qIC0gJ2FsbCc6IGFsbCBlbGVtZW50cyBtdXN0IG1hdGNoIHNlbGVjdG9yIHRvIHJldHVybiB0cnVlXHJcbiogLSAnYWxtb3N0LW9uZSc6IGFsbW9zdCBvbmUgZWxlbWVudCBtdXN0IG1hdGNoXHJcbiogLSAncGVyY2VudGFnZSc6IHJldHVybnMgcGVyY2VudGFnZSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtYXRjaCBzZWxlY3RvciAoMC0xMDApXHJcbiogLSAnc3VtbWFyeSc6IHJldHVybnMgdGhlIG9iamVjdCB7IHllczogbnVtYmVyLCBubzogbnVtYmVyLCBwZXJjZW50YWdlOiBudW1iZXIsIHRvdGFsOiBudW1iZXIgfVxyXG4qIC0ge2p1c3Q6IGEgbnVtYmVyfTogZXhhY3QgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qIC0ge2FsbW9zdDogYSBudW1iZXJ9OiBtaW5pbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiAtIHt1bnRpbDogYSBudW1iZXJ9OiBtYXhpbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmFyZSA9IGZ1bmN0aW9uIChzZWxlY3RvciwgbW9kaWZpZXIpIHtcclxuICAgIG1vZGlmaWVyID0gbW9kaWZpZXIgfHwgJ2FsbCc7XHJcbiAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5pcyhzZWxlY3RvcikpXHJcbiAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICB9KTtcclxuICAgIHN3aXRjaCAobW9kaWZpZXIpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPT0gY291bnQ7XHJcbiAgICAgICAgY2FzZSAnYWxtb3N0LW9uZSc6XHJcbiAgICAgICAgICAgIHJldHVybiBjb3VudCA+IDA7XHJcbiAgICAgICAgY2FzZSAncGVyY2VudGFnZSc6XHJcbiAgICAgICAgICAgIHJldHVybiBjb3VudCAvIHRoaXMubGVuZ3RoO1xyXG4gICAgICAgIGNhc2UgJ3N1bW1hcnknOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgeWVzOiBjb3VudCxcclxuICAgICAgICAgICAgICAgIG5vOiB0aGlzLmxlbmd0aCAtIGNvdW50LFxyXG4gICAgICAgICAgICAgICAgcGVyY2VudGFnZTogY291bnQgLyB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIHRvdGFsOiB0aGlzLmxlbmd0aFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICgnanVzdCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLmp1c3QgIT0gY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCdhbG1vc3QnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci5hbG1vc3QgPiBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ3VudGlsJyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIudW50aWwgPCBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgfVxyXG59OyIsIu+7vy8qKiA9PT09PT09PT09PT09PT09PT09XHJcbkV4dGVuc2lvbiBqcXVlcnk6ICdib3VuZHMnXHJcblJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGNvbWJpbmVkIGJvdW5kcyBmb3IgYWxsIFxyXG5lbGVtZW50cyBpbiB0aGUgY29sbGVjdGlvblxyXG4qL1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gIGpRdWVyeS5mbi5ib3VuZHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XHJcbiAgICAgIGluY2x1ZGVCb3JkZXI6IGZhbHNlLFxyXG4gICAgICBpbmNsdWRlTWFyZ2luOiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICB2YXIgYm91bmRzID0ge1xyXG4gICAgICBsZWZ0OiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHRvcDogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICByaWdodDogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLFxyXG4gICAgICBib3R0b206IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcclxuICAgICAgd2lkdGg6IE51bWJlci5OYU4sXHJcbiAgICAgIGhlaWdodDogTnVtYmVyLk5hTlxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZm5XaWR0aCA9IG9wdGlvbnMuaW5jbHVkZUJvcmRlciB8fCBvcHRpb25zLmluY2x1ZGVNYXJnaW4gPyBcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5vdXRlcldpZHRoLmNhbGwoZWwsIG9wdGlvbnMuaW5jbHVkZU1hcmdpbik7IH0gOlxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLndpZHRoLmNhbGwoZWwpOyB9O1xyXG4gICAgdmFyIGZuSGVpZ2h0ID0gb3B0aW9ucy5pbmNsdWRlQm9yZGVyIHx8IG9wdGlvbnMuaW5jbHVkZU1hcmdpbiA/IFxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLm91dGVySGVpZ2h0LmNhbGwoZWwsIG9wdGlvbnMuaW5jbHVkZU1hcmdpbik7IH0gOlxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLmhlaWdodC5jYWxsKGVsKTsgfTtcclxuXHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKGksIGVsKSB7XHJcbiAgICAgIHZhciBlbFEgPSAkKGVsKTtcclxuICAgICAgdmFyIG9mZiA9IGVsUS5vZmZzZXQoKTtcclxuICAgICAgb2ZmLnJpZ2h0ID0gb2ZmLmxlZnQgKyBmbldpZHRoKCQoZWxRKSk7XHJcbiAgICAgIG9mZi5ib3R0b20gPSBvZmYudG9wICsgZm5IZWlnaHQoJChlbFEpKTtcclxuXHJcbiAgICAgIGlmIChvZmYubGVmdCA8IGJvdW5kcy5sZWZ0KVxyXG4gICAgICAgIGJvdW5kcy5sZWZ0ID0gb2ZmLmxlZnQ7XHJcblxyXG4gICAgICBpZiAob2ZmLnRvcCA8IGJvdW5kcy50b3ApXHJcbiAgICAgICAgYm91bmRzLnRvcCA9IG9mZi50b3A7XHJcblxyXG4gICAgICBpZiAob2ZmLnJpZ2h0ID4gYm91bmRzLnJpZ2h0KVxyXG4gICAgICAgIGJvdW5kcy5yaWdodCA9IG9mZi5yaWdodDtcclxuXHJcbiAgICAgIGlmIChvZmYuYm90dG9tID4gYm91bmRzLmJvdHRvbSlcclxuICAgICAgICBib3VuZHMuYm90dG9tID0gb2ZmLmJvdHRvbTtcclxuICAgIH0pO1xyXG5cclxuICAgIGJvdW5kcy53aWR0aCA9IGJvdW5kcy5yaWdodCAtIGJvdW5kcy5sZWZ0O1xyXG4gICAgYm91bmRzLmhlaWdodCA9IGJvdW5kcy5ib3R0b20gLSBib3VuZHMudG9wO1xyXG4gICAgcmV0dXJuIGJvdW5kcztcclxuICB9O1xyXG59KSgpOyIsIu+7vy8qKlxyXG4qIEhhc1Njcm9sbEJhciByZXR1cm5zIGFuIG9iamVjdCB3aXRoIGJvb2wgcHJvcGVydGllcyAndmVydGljYWwnIGFuZCAnaG9yaXpvbnRhbCdcclxuKiBzYXlpbmcgaWYgdGhlIGVsZW1lbnQgaGFzIG5lZWQgb2Ygc2Nyb2xsYmFycyBmb3IgZWFjaCBkaW1lbnNpb24gb3Igbm90IChlbGVtZW50XHJcbiogY2FuIG5lZWQgc2Nyb2xsYmFycyBhbmQgc3RpbGwgbm90IGJlaW5nIHNob3dlZCBiZWNhdXNlIHRoZSBjc3Mtb3ZlcmxmbG93IHByb3BlcnR5XHJcbiogYmVpbmcgc2V0IGFzICdoaWRkZW4nLCBidXQgc3RpbGwgd2Uga25vdyB0aGF0IHRoZSBlbGVtZW50IHJlcXVpcmVzIGl0IGFuZCBpdHNcclxuKiBjb250ZW50IGlzIG5vdCBiZWluZyBmdWxseSBkaXNwbGF5ZWQpLlxyXG4qIEBleHRyYWdhcCwgZGVmYXVsdHMgdG8ge3g6MCx5OjB9LCBsZXRzIHNwZWNpZnkgYW4gZXh0cmEgc2l6ZSBpbiBwaXhlbHMgZm9yIGVhY2ggZGltZW5zaW9uIHRoYXQgYWx0ZXIgdGhlIHJlYWwgY2hlY2ssXHJcbiogcmVzdWx0aW5nIGluIGEgZmFrZSByZXN1bHQgdGhhdCBjYW4gYmUgaW50ZXJlc3RpbmcgdG8gZGlzY2FyZCBzb21lIHBpeGVscyBvZiBleGNlc3NcclxuKiBzaXplIChuZWdhdGl2ZSB2YWx1ZXMpIG9yIGV4YWdlcmF0ZSB0aGUgcmVhbCB1c2VkIHNpemUgd2l0aCB0aGF0IGV4dHJhIHBpeGVscyAocG9zaXRpdmUgdmFsdWVzKS5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmhhc1Njcm9sbEJhciA9IGZ1bmN0aW9uIChleHRyYWdhcCkge1xyXG4gICAgZXh0cmFnYXAgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgeDogMCxcclxuICAgICAgICB5OiAwXHJcbiAgICB9LCBleHRyYWdhcCk7XHJcbiAgICBpZiAoIXRoaXMgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiB7IHZlcnRpY2FsOiBmYWxzZSwgaG9yaXpvbnRhbDogZmFsc2UgfTtcclxuICAgIC8vbm90ZTogY2xpZW50SGVpZ2h0PSBoZWlnaHQgb2YgaG9sZGVyXHJcbiAgICAvL3Njcm9sbEhlaWdodD0gd2UgaGF2ZSBjb250ZW50IHRpbGwgdGhpcyBoZWlnaHRcclxuICAgIHZhciB0ID0gdGhpcy5nZXQoMCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHZlcnRpY2FsOiB0aGlzLm91dGVySGVpZ2h0KGZhbHNlKSA8ICh0LnNjcm9sbEhlaWdodCArIGV4dHJhZ2FwLnkpLFxyXG4gICAgICAgIGhvcml6b250YWw6IHRoaXMub3V0ZXJXaWR0aChmYWxzZSkgPCAodC5zY3JvbGxXaWR0aCArIGV4dHJhZ2FwLngpXHJcbiAgICB9O1xyXG59OyIsIu+7vy8qKiBDaGVja3MgaWYgY3VycmVudCBlbGVtZW50IG9yIG9uZSBvZiB0aGUgY3VycmVudCBzZXQgb2YgZWxlbWVudHMgaGFzXHJcbmEgcGFyZW50IHRoYXQgbWF0Y2ggdGhlIGVsZW1lbnQgb3IgZXhwcmVzc2lvbiBnaXZlbiBhcyBmaXJzdCBwYXJhbWV0ZXJcclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmlzQ2hpbGRPZiA9IGZ1bmN0aW9uIGpRdWVyeV9wbHVnaW5faXNDaGlsZE9mKGV4cCkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50cygpLmZpbHRlcihleHApLmxlbmd0aCA+IDA7XHJcbn07Iiwi77u/LyoqXHJcbiAgICBHZXRzIHRoZSBodG1sIHN0cmluZyBvZiB0aGUgZmlyc3QgZWxlbWVudCBhbmQgYWxsIGl0cyBjb250ZW50LlxyXG4gICAgVGhlICdodG1sJyBtZXRob2Qgb25seSByZXRyaWV2ZXMgdGhlIGh0bWwgc3RyaW5nIG9mIHRoZSBjb250ZW50LCBub3QgdGhlIGVsZW1lbnQgaXRzZWxmLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4ub3V0ZXJIdG1sID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKCF0aGlzIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gJyc7XHJcbiAgICB2YXIgZWwgPSB0aGlzLmdldCgwKTtcclxuICAgIHZhciBodG1sID0gJyc7XHJcbiAgICBpZiAoZWwub3V0ZXJIVE1MKVxyXG4gICAgICAgIGh0bWwgPSBlbC5vdXRlckhUTUw7XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBodG1sID0gdGhpcy53cmFwQWxsKCc8ZGl2PjwvZGl2PicpLnBhcmVudCgpLmh0bWwoKTtcclxuICAgICAgICB0aGlzLnVud3JhcCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGh0bWw7XHJcbn07Iiwi77u/LyoqXHJcbiAgICBVc2luZyB0aGUgYXR0cmlidXRlIGRhdGEtc291cmNlLXVybCBvbiBhbnkgSFRNTCBlbGVtZW50LFxyXG4gICAgdGhpcyBhbGxvd3MgcmVsb2FkIGl0cyBjb250ZW50IHBlcmZvcm1pbmcgYW4gQUpBWCBvcGVyYXRpb25cclxuICAgIG9uIHRoZSBnaXZlbiBVUkwgb3IgdGhlIG9uZSBpbiB0aGUgYXR0cmlidXRlOyB0aGUgZW5kLXBvaW50XHJcbiAgICBtdXN0IHJldHVybiB0ZXh0L2h0bWwgY29udGVudC5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vLyBEZWZhdWx0IHN1Y2Nlc3MgY2FsbGJhY2sgYW5kIHB1YmxpYyB1dGlsaXR5LCBiYXNpYyBob3ctdG8gcmVwbGFjZSBlbGVtZW50IGNvbnRlbnQgd2l0aCBmZXRjaGVkIGh0bWxcclxuZnVuY3Rpb24gdXBkYXRlRWxlbWVudChodG1sQ29udGVudCwgY29udGV4dCkge1xyXG4gICAgY29udGV4dCA9ICQuaXNQbGFpbk9iamVjdChjb250ZXh0KSAmJiBjb250ZXh0ID8gY29udGV4dCA6IHRoaXM7XHJcblxyXG4gICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAvLyBBdm9pZCBlbXB0eSBkb2N1bWVudHMgYmVpbmcgcGFyc2VkIChyYWlzZSBlcnJvcilcclxuICAgIGh0bWxDb250ZW50ID0gJC50cmltKGh0bWxDb250ZW50KTtcclxuICAgIGlmIChodG1sQ29udGVudCkge1xyXG4gICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYW4gZW1wdHkgZG9jdW1lbnQgb3IgbWFsZm9ybWVkIGlzIHJldHVybmVkOlxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGh0bWxDb250ZW50KSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgbmV3aHRtbCA9ICQoaHRtbENvbnRlbnQpO1xyXG4gICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgZWxlbWVudCA9IGNvbnRleHQuZWxlbWVudDtcclxuICAgIGlmIChjb250ZXh0Lm9wdGlvbnMubW9kZSA9PSAncmVwbGFjZS1tZScpXHJcbiAgICAgICAgZWxlbWVudC5yZXBsYWNlV2l0aChuZXdodG1sKTtcclxuICAgIGVsc2UgLy8gJ3JlcGxhY2UtY29udGVudCdcclxuICAgICAgICBlbGVtZW50Lmh0bWwobmV3aHRtbCk7XHJcblxyXG4gICAgcmV0dXJuIGNvbnRleHQ7XHJcbn1cclxuXHJcbi8vIERlZmF1bHQgY29tcGxldGUgY2FsbGJhY2sgYW5kIHB1YmxpYyB1dGlsaXR5XHJcbmZ1bmN0aW9uIHN0b3BMb2FkaW5nU3Bpbm5lcigpIHtcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxvYWRpbmdUaW1lcik7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh0aGlzLmVsZW1lbnQpO1xyXG59XHJcblxyXG4vLyBEZWZhdWx0c1xyXG52YXIgZGVmYXVsdHMgPSB7XHJcbiAgICB1cmw6IG51bGwsXHJcbiAgICBzdWNjZXNzOiBbdXBkYXRlRWxlbWVudF0sXHJcbiAgICBlcnJvcjogW10sXHJcbiAgICBjb21wbGV0ZTogW3N0b3BMb2FkaW5nU3Bpbm5lcl0sXHJcbiAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICBtb2RlOiAncmVwbGFjZS1jb250ZW50JyxcclxuICAgIGxvYWRpbmc6IHtcclxuICAgICAgICBsb2NrRWxlbWVudDogdHJ1ZSxcclxuICAgICAgICBsb2NrT3B0aW9uczoge30sXHJcbiAgICAgICAgbWVzc2FnZTogbnVsbCxcclxuICAgICAgICBzaG93TG9hZGluZ0luZGljYXRvcjogdHJ1ZSxcclxuICAgICAgICBkZWxheTogMFxyXG4gICAgfVxyXG59O1xyXG5cclxuLyogUmVsb2FkIG1ldGhvZCAqL1xyXG52YXIgcmVsb2FkID0gJC5mbi5yZWxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBPcHRpb25zIGZyb20gZGVmYXVsdHMgKGludGVybmFsIGFuZCBwdWJsaWMpXHJcbiAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgcmVsb2FkLmRlZmF1bHRzKTtcclxuICAgIC8vIElmIG9wdGlvbnMgb2JqZWN0IGlzIHBhc3NlZCBhcyB1bmlxdWUgcGFyYW1ldGVyXHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxICYmICQuaXNQbGFpbk9iamVjdChhcmd1bWVudHNbMF0pKSB7XHJcbiAgICAgICAgLy8gTWVyZ2Ugb3B0aW9uczpcclxuICAgICAgICAkLmV4dGVuZCh0cnVlLCBvcHRpb25zLCBhcmd1bWVudHNbMF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDb21tb24gb3ZlcmxvYWQ6IG5ldy11cmwgYW5kIGNvbXBsZXRlIGNhbGxiYWNrLCBib3RoIG9wdGlvbmFsc1xyXG4gICAgICAgIG9wdGlvbnMudXJsID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiBudWxsO1xyXG4gICAgICAgIG9wdGlvbnMuY29tcGxldGUgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucy51cmwpIHtcclxuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihvcHRpb25zLnVybCkpXHJcbiAgICAgICAgICAgIC8vIEZ1bmN0aW9uIHBhcmFtczogY3VycmVudFJlbG9hZFVybCwgZGVmYXVsdFJlbG9hZFVybFxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnc291cmNlLXVybCcsICQucHJveHkob3B0aW9ucy51cmwsIHRoaXMpKCR0LmRhdGEoJ3NvdXJjZS11cmwnKSwgJHQuYXR0cignZGF0YS1zb3VyY2UtdXJsJykpKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnc291cmNlLXVybCcsIG9wdGlvbnMudXJsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHVybCA9ICR0LmRhdGEoJ3NvdXJjZS11cmwnKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYWxyZWFkeSBiZWluZyByZWxvYWRlZCwgdG8gY2FuY2VsIHByZXZpb3VzIGF0dGVtcHRcclxuICAgICAgICB2YXIganEgPSAkdC5kYXRhKCdpc1JlbG9hZGluZycpO1xyXG4gICAgICAgIGlmIChqcSkge1xyXG4gICAgICAgICAgICBpZiAoanEudXJsID09IHVybClcclxuICAgICAgICAgICAgICAgIC8vIElzIHRoZSBzYW1lIHVybCwgZG8gbm90IGFib3J0IGJlY2F1c2UgaXMgdGhlIHNhbWUgcmVzdWx0IGJlaW5nIHJldHJpZXZlZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBqcS5hYm9ydCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT3B0aW9uYWwgZGF0YSBwYXJhbWV0ZXIgJ3JlbG9hZC1tb2RlJyBhY2NlcHRzIHZhbHVlczogXHJcbiAgICAgICAgLy8gLSAncmVwbGFjZS1tZSc6IFVzZSBodG1sIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCByZWxvYWRlZCBlbGVtZW50IChha2E6IHJlcGxhY2VXaXRoKCkpXHJcbiAgICAgICAgLy8gLSAncmVwbGFjZS1jb250ZW50JzogKGRlZmF1bHQpIEh0bWwgcmV0dXJuZWQgcmVwbGFjZSBjdXJyZW50IGVsZW1lbnQgY29udGVudCAoYWthOiBodG1sKCkpXHJcbiAgICAgICAgb3B0aW9ucy5tb2RlID0gJHQuZGF0YSgncmVsb2FkLW1vZGUnKSB8fCBvcHRpb25zLm1vZGU7XHJcblxyXG4gICAgICAgIGlmICh1cmwpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIExvYWRpbmcsIHdpdGggZGVsYXlcclxuICAgICAgICAgICAgdmFyIGxvYWRpbmd0aW1lciA9IG9wdGlvbnMubG9hZGluZy5sb2NrRWxlbWVudCA/XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGluZyBjb250ZW50IHVzaW5nIGEgZmFrZSB0ZW1wIHBhcmVudCBlbGVtZW50IHRvIHByZWxvYWQgaW1hZ2UgYW5kIHRvIGdldCByZWFsIG1lc3NhZ2Ugd2lkdGg6XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvYWRpbmdjb250ZW50ID0gJCgnPGRpdi8+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5tZXNzYWdlID8gJCgnPGRpdiBjbGFzcz1cImxvYWRpbmctbWVzc2FnZVwiLz4nKS5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UpIDogbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5zaG93TG9hZGluZ0luZGljYXRvciA/IG9wdGlvbnMubG9hZGluZy5tZXNzYWdlIDogbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ2NvbnRlbnQuY3NzKHsgcG9zaXRpb246ICdhYnNvbHV0ZScsIGxlZnQ6IC05OTk5OSB9KS5hcHBlbmRUbygnYm9keScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB3ID0gbG9hZGluZ2NvbnRlbnQud2lkdGgoKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nY29udGVudC5kZXRhY2goKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBMb2NraW5nOlxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucy5hdXRvZm9jdXMgPSBvcHRpb25zLmF1dG9mb2N1cztcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMud2lkdGggPSB3O1xyXG4gICAgICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4obG9hZGluZ2NvbnRlbnQuaHRtbCgpLCAkdCwgb3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgPyAnY3VzdG9tLWxvYWRpbmcnIDogJ2xvYWRpbmcnLCBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucy5sb2FkaW5nLmRlbGF5KVxyXG4gICAgICAgICAgICAgICAgOiBudWxsO1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlcGFyZSBjb250ZXh0XHJcbiAgICAgICAgICAgIHZhciBjdHggPSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50OiAkdCxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICBsb2FkaW5nVGltZXI6IGxvYWRpbmd0aW1lclxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgICAgICAgICBqcSA9ICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dDogY3R4XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVXJsIGlzIHNldCBpbiB0aGUgcmV0dXJuZWQgYWpheCBvYmplY3QgYmVjYXVzZSBpcyBub3Qgc2V0IGJ5IGFsbCB2ZXJzaW9ucyBvZiBqUXVlcnlcclxuICAgICAgICAgICAganEudXJsID0gdXJsO1xyXG5cclxuICAgICAgICAgICAgLy8gTWFyayBlbGVtZW50IGFzIGlzIGJlaW5nIHJlbG9hZGVkLCB0byBhdm9pZCBtdWx0aXBsZSBhdHRlbXBzIGF0IHNhbWUgdGltZSwgc2F2aW5nXHJcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgYWpheCBvYmplY3QgdG8gYWxsb3cgYmUgY2FuY2VsbGVkXHJcbiAgICAgICAgICAgICR0LmRhdGEoJ2lzUmVsb2FkaW5nJywganEpO1xyXG4gICAgICAgICAgICBqcS5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnaXNSZWxvYWRpbmcnLCBudWxsKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDYWxsYmFja3M6IGZpcnN0IGdsb2JhbHMgYW5kIHRoZW4gZnJvbSBvcHRpb25zIGlmIHRoZXkgYXJlIGRpZmZlcmVudFxyXG4gICAgICAgICAgICAvLyBzdWNjZXNzXHJcbiAgICAgICAgICAgIGpxLmRvbmUocmVsb2FkLmRlZmF1bHRzLnN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zdWNjZXNzICE9IHJlbG9hZC5kZWZhdWx0cy5zdWNjZXNzKVxyXG4gICAgICAgICAgICAgICAganEuZG9uZShvcHRpb25zLnN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICAvLyBlcnJvclxyXG4gICAgICAgICAgICBqcS5mYWlsKHJlbG9hZC5kZWZhdWx0cy5lcnJvcik7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yICE9IHJlbG9hZC5kZWZhdWx0cy5lcnJvcilcclxuICAgICAgICAgICAgICAgIGpxLmZhaWwob3B0aW9ucy5lcnJvcik7XHJcbiAgICAgICAgICAgIC8vIGNvbXBsZXRlXHJcbiAgICAgICAgICAgIGpxLmFsd2F5cyhyZWxvYWQuZGVmYXVsdHMuY29tcGxldGUpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb21wbGV0ZSAhPSByZWxvYWQuZGVmYXVsdHMuY29tcGxldGUpXHJcbiAgICAgICAgICAgICAgICBqcS5kb25lKG9wdGlvbnMuY29tcGxldGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vLyBQdWJsaWMgZGVmYXVsdHNcclxucmVsb2FkLmRlZmF1bHRzID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzKTtcclxuXHJcbi8vIFB1YmxpYyB1dGlsaXRpZXNcclxucmVsb2FkLnVwZGF0ZUVsZW1lbnQgPSB1cGRhdGVFbGVtZW50O1xyXG5yZWxvYWQuc3RvcExvYWRpbmdTcGlubmVyID0gc3RvcExvYWRpbmdTcGlubmVyO1xyXG5cclxuLy8gTW9kdWxlXHJcbm1vZHVsZS5leHBvcnRzID0gcmVsb2FkOyIsIi8qKiBFeHRlbmRlZCB0b2dnbGUtc2hvdy1oaWRlIGZ1bnRpb25zLlxyXG4gICAgSWFnb1NSTEBnbWFpbC5jb21cclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5XHJcbiAqKi9cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgLyoqIEltcGxlbWVudGF0aW9uOiByZXF1aXJlIGpRdWVyeSBhbmQgcmV0dXJucyBvYmplY3Qgd2l0aCB0aGVcclxuICAgICAgICBwdWJsaWMgbWV0aG9kcy5cclxuICAgICAqKi9cclxuICAgIGZ1bmN0aW9uIHh0c2goalF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyICQgPSBqUXVlcnk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEhpZGUgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ2hpZGUnIGFuZCAnZmFkZU91dCcgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuZmFkZU91dChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuc2xpZGVVcChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ2hpZGUnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuaGlkZShvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4aGlkZScsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAqIFNob3cgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ3Nob3cnIGFuZCAnZmFkZUluJyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAvLyBXZSBwZXJmb3JtcyBhIGZpeCBvbiBzdGFuZGFyZCBqUXVlcnkgZWZmZWN0c1xyXG4gICAgICAgICAgICAvLyB0byBhdm9pZCBhbiBlcnJvciB0aGF0IHByZXZlbnRzIGZyb20gcnVubmluZ1xyXG4gICAgICAgICAgICAvLyBlZmZlY3RzIG9uIGVsZW1lbnRzIHRoYXQgYXJlIGFscmVhZHkgdmlzaWJsZSxcclxuICAgICAgICAgICAgLy8gd2hhdCBsZXRzIHRoZSBwb3NzaWJpbGl0eSBvZiBnZXQgYSBtaWRkbGUtYW5pbWF0ZWRcclxuICAgICAgICAgICAgLy8gZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBXZSBqdXN0IGNoYW5nZSBkaXNwbGF5Om5vbmUsIGZvcmNpbmcgdG8gJ2lzLXZpc2libGUnIHRvXHJcbiAgICAgICAgICAgIC8vIGJlIGZhbHNlIGFuZCB0aGVuIHJ1bm5pbmcgdGhlIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gZmxpY2tlcmluZyBlZmZlY3QsIGJlY2F1c2UgalF1ZXJ5IGp1c3QgcmVzZXRzXHJcbiAgICAgICAgICAgIC8vIGRpc3BsYXkgb24gZWZmZWN0IHN0YXJ0LlxyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZhZGVJbihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zbGlkZURvd24ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdzaG93J1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2hvdyhvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4c2hvdycsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogR2VuZXJpYyB1dGlsaXR5IGZvciBoaWdobHkgY29uZmlndXJhYmxlIGpRdWVyeS50b2dnbGUgd2l0aCBzdXBwb3J0XHJcbiAgICAgICAgICAgIHRvIHNwZWNpZnkgdGhlIHRvZ2dsZSB2YWx1ZSBleHBsaWNpdHkgZm9yIGFueSBraW5kIG9mIGVmZmVjdDoganVzdCBwYXNzIHRydWUgYXMgc2Vjb25kIHBhcmFtZXRlciAndG9nZ2xlJyB0byBzaG93XHJcbiAgICAgICAgICAgIGFuZCBmYWxzZSB0byBoaWRlLiBUb2dnbGUgbXVzdCBiZSBzdHJpY3RseSBhIEJvb2xlYW4gdmFsdWUgdG8gYXZvaWQgYXV0by1kZXRlY3Rpb24uXHJcbiAgICAgICAgICAgIFRvZ2dsZSBwYXJhbWV0ZXIgY2FuIGJlIG9taXR0ZWQgdG8gYXV0by1kZXRlY3QgaXQsIGFuZCBzZWNvbmQgcGFyYW1ldGVyIGNhbiBiZSB0aGUgYW5pbWF0aW9uIG9wdGlvbnMuXHJcbiAgICAgICAgICAgIEFsbCB0aGUgb3RoZXJzIGJlaGF2ZSBleGFjdGx5IGFzIGhpZGVFbGVtZW50IGFuZCBzaG93RWxlbWVudC5cclxuICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiB0b2dnbGVFbGVtZW50KGVsZW1lbnQsIHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgbm90IGEgYm9vbGVhblxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlICE9PSB0cnVlICYmIHRvZ2dsZSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBhbiBvYmplY3QsIHRoZW4gaXMgdGhlIG9wdGlvbnMgYXMgc2Vjb25kIHBhcmFtZXRlclxyXG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdCh0b2dnbGUpKVxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB0b2dnbGU7XHJcbiAgICAgICAgICAgICAgICAvLyBBdXRvLWRldGVjdCB0b2dnbGUsIGl0IGNhbiB2YXJ5IG9uIGFueSBlbGVtZW50IGluIHRoZSBjb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgLy8gdGhlbiBkZXRlY3Rpb24gYW5kIGFjdGlvbiBtdXN0IGJlIGRvbmUgcGVyIGVsZW1lbnQ6XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldXNpbmcgZnVuY3Rpb24sIHdpdGggZXhwbGljaXQgdG9nZ2xlIHZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCAhJCh0aGlzKS5pcygnOnZpc2libGUnKSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlKVxyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvKiogRG8galF1ZXJ5IGludGVncmF0aW9uIGFzIHh0b2dnbGUsIHhzaG93LCB4aGlkZVxyXG4gICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiBwbHVnSW4oalF1ZXJ5KSB7XHJcbiAgICAgICAgICAgIC8qKiB0b2dnbGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeHRvZ2dsZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54dG9nZ2xlID0gZnVuY3Rpb24geHRvZ2dsZSh0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgdG9nZ2xlLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIHNob3dFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54c2hvdyA9IGZ1bmN0aW9uIHhzaG93KG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogaGlkZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54aGlkZSA9IGZ1bmN0aW9uIHhoaWRlKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeHBvcnRpbmc6XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdG9nZ2xlRWxlbWVudDogdG9nZ2xlRWxlbWVudCxcclxuICAgICAgICAgICAgc2hvd0VsZW1lbnQ6IHNob3dFbGVtZW50LFxyXG4gICAgICAgICAgICBoaWRlRWxlbWVudDogaGlkZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHBsdWdJbjogcGx1Z0luXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNb2R1bGVcclxuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCB4dHNoKTtcclxuICAgIH0gZWxzZSBpZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgICAgIHZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHh0c2goalF1ZXJ5KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTm9ybWFsIHNjcmlwdCBsb2FkLCBpZiBqUXVlcnkgaXMgZ2xvYmFsIChhdCB3aW5kb3cpLCBpdHMgZXh0ZW5kZWQgYXV0b21hdGljYWxseSAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cualF1ZXJ5ICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgeHRzaCh3aW5kb3cualF1ZXJ5KS5wbHVnSW4od2luZG93LmpRdWVyeSk7XHJcbiAgICB9XHJcblxyXG59KSgpOyIsIu+7vy8qIFNvbWUgdXRpbGl0aWVzIGZvciB1c2Ugd2l0aCBqUXVlcnkgb3IgaXRzIGV4cHJlc3Npb25zXHJcbiAgICB0aGF0IGFyZSBub3QgcGx1Z2lucy5cclxuKi9cclxuZnVuY3Rpb24gZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShzdHIpIHtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFsgIzsmLC4rKn5cXCc6XCIhXiRbXFxdKCk9PnxcXC9dKS9nLCAnXFxcXCQxJyk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU6IGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWVcclxuICAgIH07XHJcbiIsIu+7vy8qIEFzc2V0cyBsb2FkZXIgd2l0aCBsb2FkaW5nIGNvbmZpcm1hdGlvbiAobWFpbmx5IGZvciBzY3JpcHRzKVxyXG4gICAgYmFzZWQgb24gTW9kZXJuaXpyL3llcG5vcGUgbG9hZGVyLlxyXG4qL1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG5leHBvcnRzLmxvYWQgPSBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgb3B0cyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBzY3JpcHRzOiBbXSxcclxuICAgICAgICBjb21wbGV0ZTogbnVsbCxcclxuICAgICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogbnVsbCxcclxuICAgICAgICBsb2FkRGVsYXk6IDAsXHJcbiAgICAgICAgdHJpYWxzSW50ZXJ2YWw6IDUwMFxyXG4gICAgfSwgb3B0cyk7XHJcbiAgICBpZiAoIW9wdHMuc2NyaXB0cy5sZW5ndGgpIHJldHVybjtcclxuICAgIGZ1bmN0aW9uIHBlcmZvcm1Db21wbGV0ZSgpIHtcclxuICAgICAgICBpZiAodHlwZW9mIChvcHRzLmNvbXBsZXRlVmVyaWZpY2F0aW9uKSAhPT0gJ2Z1bmN0aW9uJyB8fCBvcHRzLmNvbXBsZXRlVmVyaWZpY2F0aW9uKCkpXHJcbiAgICAgICAgICAgIG9wdHMuY29tcGxldGUoKTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChwZXJmb3JtQ29tcGxldGUsIG9wdHMudHJpYWxzSW50ZXJ2YWwpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLndhcm4pXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0xDLmxvYWQuY29tcGxldGVWZXJpZmljYXRpb24gZmFpbGVkIGZvciAnICsgb3B0cy5zY3JpcHRzWzBdICsgJyByZXRyeWluZyBpdCBpbiAnICsgb3B0cy50cmlhbHNJbnRlcnZhbCArICdtcycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgICAgICAgTW9kZXJuaXpyLmxvYWQoe1xyXG4gICAgICAgICAgICBsb2FkOiBvcHRzLnNjcmlwdHMsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBvcHRzLmNvbXBsZXRlID8gcGVyZm9ybUNvbXBsZXRlIDogbnVsbFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKG9wdHMubG9hZERlbGF5KVxyXG4gICAgICAgIHNldFRpbWVvdXQobG9hZCwgb3B0cy5sb2FkRGVsYXkpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGxvYWQoKTtcclxufTsiLCLvu78vKi0tLS0tLS0tLS0tLVxyXG5VdGlsaXRpZXMgdG8gbWFuaXB1bGF0ZSBudW1iZXJzLCBhZGRpdGlvbmFsbHlcclxudG8gdGhlIG9uZXMgYXQgTWF0aFxyXG4tLS0tLS0tLS0tLS0qL1xyXG5cclxuLyoqIEVudW1lcmF0aW9uIHRvIGJlIHVzZXMgYnkgZnVuY3Rpb25zIHRoYXQgaW1wbGVtZW50cyAncm91bmRpbmcnIG9wZXJhdGlvbnMgb24gZGlmZmVyZW50XHJcbmRhdGEgdHlwZXMuXHJcbkl0IGhvbGRzIHRoZSBkaWZmZXJlbnQgd2F5cyBhIHJvdW5kaW5nIG9wZXJhdGlvbiBjYW4gYmUgYXBwbHkuXHJcbioqL1xyXG52YXIgcm91bmRpbmdUeXBlRW51bSA9IHtcclxuICAgIERvd246IC0xLFxyXG4gICAgTmVhcmVzdDogMCxcclxuICAgIFVwOiAxXHJcbn07XHJcblxyXG5mdW5jdGlvbiByb3VuZFRvKG51bWJlciwgZGVjaW1hbHMsIHJvdW5kaW5nVHlwZSkge1xyXG4gICAgLy8gY2FzZSBOZWFyZXN0IGlzIHRoZSBkZWZhdWx0OlxyXG4gICAgdmFyIGYgPSBuZWFyZXN0VG87XHJcbiAgICBzd2l0Y2ggKHJvdW5kaW5nVHlwZSkge1xyXG4gICAgICAgIGNhc2Ugcm91bmRpbmdUeXBlRW51bS5Eb3duOlxyXG4gICAgICAgICAgICBmID0gZmxvb3JUbztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSByb3VuZGluZ1R5cGVFbnVtLlVwOlxyXG4gICAgICAgICAgICBmID0gY2VpbFRvO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgIHJldHVybiBmKG51bWJlciwgZGVjaW1hbHMpO1xyXG59XHJcblxyXG4vKiogUm91bmQgYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0IGNhbiBzdWJzdHJhY3QgaW50ZWdlciBkZWNpbWFscyBieSBwcm92aWRpbmcgYSBuZWdhdGl2ZVxyXG5udW1iZXIgb2YgZGVjaW1hbHMuXHJcbioqL1xyXG5mdW5jdGlvbiBuZWFyZXN0VG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vKiogUm91bmQgVXAgYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0cyBzaW1pbGFyIHRvIHJvdW5kVG8sIGJ1dCB0aGUgbnVtYmVyIGlzIGV2ZXIgcm91bmRlZCB1cCxcclxudG8gdGhlIGxvd2VyIGludGVnZXIgZ3JlYXRlciBvciBlcXVhbHMgdG8gdGhlIG51bWJlci5cclxuKiovXHJcbmZ1bmN0aW9uIGNlaWxUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLyoqIFJvdW5kIERvd24gYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0cyBzaW1pbGFyIHRvIHJvdW5kVG8sIGJ1dCB0aGUgbnVtYmVyIGlzIGV2ZXIgcm91bmRlZCBkb3duLFxyXG50byB0aGUgYmlnZ2VyIGludGVnZXIgbG93ZXIgb3IgZXF1YWxzIHRvIHRoZSBudW1iZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBmbG9vclRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIHJvdW5kaW5nVHlwZUVudW06IHJvdW5kaW5nVHlwZUVudW0sXHJcbiAgICAgICAgcm91bmRUbzogcm91bmRUbyxcclxuICAgICAgICBuZWFyZXN0VG86IG5lYXJlc3RUbyxcclxuICAgICAgICBjZWlsVG86IGNlaWxUbyxcclxuICAgICAgICBmbG9vclRvOiBmbG9vclRvXHJcbiAgICB9OyIsIu+7v2Z1bmN0aW9uIG1vdmVGb2N1c1RvKGVsLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIG1hcmdpblRvcDogMzAsXHJcbiAgICAgICAgZHVyYXRpb246IDUwMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6ICQoZWwpLm9mZnNldCgpLnRvcCAtIG9wdGlvbnMubWFyZ2luVG9wIH0sIG9wdGlvbnMuZHVyYXRpb24sIG51bGwpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbW92ZUZvY3VzVG87XHJcbn0iLCLvu78vKiBTb21lIHV0aWxpdGllcyB0byBmb3JtYXQgYW5kIGV4dHJhY3QgbnVtYmVycywgZnJvbSB0ZXh0IG9yIERPTS5cclxuICovXHJcbnZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGkxOG4gPSByZXF1aXJlKCcuL2kxOG4nKSxcclxuICAgIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbmZ1bmN0aW9uIGdldE1vbmV5TnVtYmVyKHYsIGFsdCkge1xyXG4gICAgYWx0ID0gYWx0IHx8IDA7XHJcbiAgICBpZiAodiBpbnN0YW5jZW9mIGpRdWVyeSlcclxuICAgICAgICB2ID0gdi52YWwoKSB8fCB2LnRleHQoKTtcclxuICAgIHYgPSBwYXJzZUZsb2F0KHZcclxuICAgICAgICAucmVwbGFjZSgvWyTigqxdL2csICcnKVxyXG4gICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoTEMubnVtZXJpY01pbGVzU2VwYXJhdG9yW2kxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jdWx0dXJlXSwgJ2cnKSwgJycpXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIGlzTmFOKHYpID8gYWx0IDogdjtcclxufVxyXG5mdW5jdGlvbiBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nKHYpIHtcclxuICAgIHZhciBjdWx0dXJlID0gaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmN1bHR1cmU7XHJcbiAgICAvLyBGaXJzdCwgcm91bmQgdG8gMiBkZWNpbWFsc1xyXG4gICAgdiA9IG11LnJvdW5kVG8odiwgMik7XHJcbiAgICAvLyBHZXQgdGhlIGRlY2ltYWwgcGFydCAocmVzdClcclxuICAgIHZhciByZXN0ID0gTWF0aC5yb3VuZCh2ICogMTAwICUgMTAwKTtcclxuICAgIHJldHVybiAoJycgK1xyXG4gICAgLy8gSW50ZWdlciBwYXJ0IChubyBkZWNpbWFscylcclxuICAgICAgICBNYXRoLmZsb29yKHYpICtcclxuICAgIC8vIERlY2ltYWwgc2VwYXJhdG9yIGRlcGVuZGluZyBvbiBsb2NhbGVcclxuICAgICAgICBpMThuLm51bWVyaWNEZWNpbWFsU2VwYXJhdG9yW2N1bHR1cmVdICtcclxuICAgIC8vIERlY2ltYWxzLCBldmVyIHR3byBkaWdpdHNcclxuICAgICAgICBNYXRoLmZsb29yKHJlc3QgLyAxMCkgKyByZXN0ICUgMTBcclxuICAgICk7XHJcbn1cclxuZnVuY3Rpb24gbnVtYmVyVG9Nb25leVN0cmluZyh2KSB7XHJcbiAgICB2YXIgY291bnRyeSA9IGkxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jb3VudHJ5O1xyXG4gICAgLy8gVHdvIGRpZ2l0cyBpbiBkZWNpbWFscyBmb3Igcm91bmRlZCB2YWx1ZSB3aXRoIG1vbmV5IHN5bWJvbCBhcyBmb3JcclxuICAgIC8vIGN1cnJlbnQgbG9jYWxlXHJcbiAgICByZXR1cm4gKGkxOG4ubW9uZXlTeW1ib2xQcmVmaXhbY291bnRyeV0gKyBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nKHYpICsgaTE4bi5tb25leVN5bWJvbFN1Zml4W2NvdW50cnldKTtcclxufVxyXG5mdW5jdGlvbiBzZXRNb25leU51bWJlcih2LCBlbCkge1xyXG4gICAgLy8gR2V0IHZhbHVlIGluIG1vbmV5IGZvcm1hdDpcclxuICAgIHYgPSBudW1iZXJUb01vbmV5U3RyaW5nKHYpO1xyXG4gICAgLy8gU2V0dGluZyB2YWx1ZTpcclxuICAgIGlmIChlbCBpbnN0YW5jZW9mIGpRdWVyeSlcclxuICAgICAgICBpZiAoZWwuaXMoJzppbnB1dCcpKVxyXG4gICAgICAgICAgICBlbC52YWwodik7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBlbC50ZXh0KHYpO1xyXG4gICAgcmV0dXJuIHY7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGdldE1vbmV5TnVtYmVyOiBnZXRNb25leU51bWJlcixcclxuICAgICAgICBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nOiBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nLFxyXG4gICAgICAgIG51bWJlclRvTW9uZXlTdHJpbmc6IG51bWJlclRvTW9uZXlTdHJpbmcsXHJcbiAgICAgICAgc2V0TW9uZXlOdW1iZXI6IHNldE1vbmV5TnVtYmVyXHJcbiAgICB9OyIsIu+7vy8qKlxyXG4qIFBsYWNlaG9sZGVyIHBvbHlmaWxsLlxyXG4qIEFkZHMgYSBuZXcgalF1ZXJ5IHBsYWNlSG9sZGVyIG1ldGhvZCB0byBzZXR1cCBvciByZWFwcGx5IHBsYWNlSG9sZGVyXHJcbiogb24gZWxlbWVudHMgKHJlY29tbWVudGVkIHRvIGJlIGFwcGx5IG9ubHkgdG8gc2VsZWN0b3IgJ1twbGFjZWhvbGRlcl0nKTtcclxuKiB0aGF0cyBtZXRob2QgaXMgZmFrZSBvbiBicm93c2VycyB0aGF0IGhhcyBuYXRpdmUgc3VwcG9ydCBmb3IgcGxhY2Vob2xkZXJcclxuKiovXHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRQbGFjZUhvbGRlcnMoKSB7XHJcbiAgICBpZiAoTW9kZXJuaXpyLmlucHV0LnBsYWNlaG9sZGVyKVxyXG4gICAgICAgICQuZm4ucGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoKSB7IH07XHJcbiAgICBlbHNlXHJcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZG9QbGFjZWhvbGRlcigpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoISR0LmRhdGEoJ3BsYWNlaG9sZGVyLXN1cHBvcnRlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQub24oJ2ZvY3VzaW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlID09IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICR0Lm9uKCdmb2N1c291dCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkdC5kYXRhKCdwbGFjZWhvbGRlci1zdXBwb3J0ZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQuZm4ucGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGRvUGxhY2Vob2xkZXIpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAkKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICAgICAgJChkb2N1bWVudCkuYWpheENvbXBsZXRlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSgpO1xyXG59OyIsIu+7vy8qIFBvcHVwIGZ1bmN0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxucmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKipcclxuKiBQb3B1cCByZWxhdGVkIFxyXG4qIGZ1bmN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBwb3B1cFNpemUoc2l6ZSkge1xyXG4gICAgdmFyIHMgPSAoc2l6ZSA9PSAnbGFyZ2UnID8gMC44IDogKHNpemUgPT0gJ21lZGl1bScgPyAwLjUgOiAoc2l6ZSA9PSAnc21hbGwnID8gMC4yIDogc2l6ZSB8fCAwLjUpKSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKCQod2luZG93KS53aWR0aCgpICogcyksXHJcbiAgICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKCQod2luZG93KS5oZWlnaHQoKSAqIHMpLFxyXG4gICAgICAgIHNpemVGYWN0b3I6IHNcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gcG9wdXBTdHlsZShzaXplKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGN1cnNvcjogJ2RlZmF1bHQnLFxyXG4gICAgICAgIHdpZHRoOiBzaXplLndpZHRoICsgJ3B4JyxcclxuICAgICAgICBsZWZ0OiBNYXRoLnJvdW5kKCgkKHdpbmRvdykud2lkdGgoKSAtIHNpemUud2lkdGgpIC8gMikgLSAyNSArICdweCcsXHJcbiAgICAgICAgaGVpZ2h0OiBzaXplLmhlaWdodCArICdweCcsXHJcbiAgICAgICAgdG9wOiBNYXRoLnJvdW5kKCgkKHdpbmRvdykuaGVpZ2h0KCkgLSBzaXplLmhlaWdodCkgLyAyKSAtIDMyICsgJ3B4JyxcclxuICAgICAgICBwYWRkaW5nOiAnMzRweCAyNXB4IDMwcHgnLFxyXG4gICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgYm9yZGVyOiAnbm9uZScsXHJcbiAgICAgICAgJy1tb3otYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmcnLFxyXG4gICAgICAgICctd2Via2l0LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nLWJveCcsXHJcbiAgICAgICAgJ2JhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nLWJveCdcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gcG9wdXAodXJsLCBzaXplLCBjb21wbGV0ZSwgbG9hZGluZ1RleHQsIG9wdGlvbnMpIHtcclxuICAgIGlmICh0eXBlb2YgKHVybCkgPT09ICdvYmplY3QnKVxyXG4gICAgICAgIG9wdGlvbnMgPSB1cmw7XHJcblxyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIHVybDogdHlwZW9mICh1cmwpID09PSAnc3RyaW5nJyA/IHVybCA6ICcnLFxyXG4gICAgICAgIHNpemU6IHNpemUgfHwgeyB3aWR0aDogMCwgaGVpZ2h0OiAwIH0sXHJcbiAgICAgICAgY29tcGxldGU6IGNvbXBsZXRlLFxyXG4gICAgICAgIGxvYWRpbmdUZXh0OiBsb2FkaW5nVGV4dCxcclxuICAgICAgICBjbG9zYWJsZToge1xyXG4gICAgICAgICAgICBvbkxvYWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBhZnRlckxvYWQ6IHRydWUsXHJcbiAgICAgICAgICAgIG9uRXJyb3I6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9TaXplOiBmYWxzZSxcclxuICAgICAgICBjb250YWluZXJDbGFzczogJycsXHJcbiAgICAgICAgYXV0b0ZvY3VzOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBQcmVwYXJlIHNpemUgYW5kIGxvYWRpbmdcclxuICAgIG9wdGlvbnMubG9hZGluZ1RleHQgPSBvcHRpb25zLmxvYWRpbmdUZXh0IHx8ICcnO1xyXG4gICAgaWYgKHR5cGVvZiAob3B0aW9ucy5zaXplLndpZHRoKSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgb3B0aW9ucy5zaXplID0gcG9wdXBTaXplKG9wdGlvbnMuc2l6ZSk7XHJcblxyXG4gICAgJC5ibG9ja1VJKHtcclxuICAgICAgICBtZXNzYWdlOiAob3B0aW9ucy5jbG9zYWJsZS5vbkxvYWQgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgK1xyXG4gICAgICAgJzxpbWcgc3JjPVwiJyArIExjVXJsLkFwcFBhdGggKyAnaW1nL3RoZW1lL2xvYWRpbmcuZ2lmXCIvPicgKyBvcHRpb25zLmxvYWRpbmdUZXh0LFxyXG4gICAgICAgIGNlbnRlclk6IGZhbHNlLFxyXG4gICAgICAgIGNzczogcG9wdXBTdHlsZShvcHRpb25zLnNpemUpLFxyXG4gICAgICAgIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfSxcclxuICAgICAgICBmb2N1c0lucHV0OiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMb2FkaW5nIFVybCB3aXRoIEFqYXggYW5kIHBsYWNlIGNvbnRlbnQgaW5zaWRlIHRoZSBibG9ja2VkLWJveFxyXG4gICAgJC5hamF4KHtcclxuICAgICAgICB1cmw6IG9wdGlvbnMudXJsLFxyXG4gICAgICAgIGNvbnRleHQ6IHtcclxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgICAgICAgY29udGFpbmVyOiAkKCcuYmxvY2tNc2cnKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyLmFkZENsYXNzKG9wdGlvbnMuY29udGFpbmVyQ2xhc3MpO1xyXG4gICAgICAgICAgICAvLyBBZGQgY2xvc2UgYnV0dG9uIGlmIHJlcXVpcmVzIGl0IG9yIGVtcHR5IG1lc3NhZ2UgY29udGVudCB0byBhcHBlbmQgdGhlbiBtb3JlXHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5odG1sKG9wdGlvbnMuY2xvc2FibGUuYWZ0ZXJMb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpO1xyXG4gICAgICAgICAgICB2YXIgY29udGVudEhvbGRlciA9IGNvbnRhaW5lci5hcHBlbmQoJzxkaXYgY2xhc3M9XCJjb250ZW50XCIvPicpLmNoaWxkcmVuKCcuY29udGVudCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGF0YSkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5Db2RlICYmIGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCBjb2RlLCBzaG93IHJlc3VsdFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuYXBwZW5kKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFBhZ2UgY29udGVudCBnb3QsIHBhc3RlIGludG8gdGhlIHBvcHVwIGlmIGlzIHBhcnRpYWwgaHRtbCAodXJsIHN0YXJ0cyB3aXRoICQpXHJcbiAgICAgICAgICAgICAgICBpZiAoLygoXlxcJCl8KFxcL1xcJCkpLy50ZXN0KG9wdGlvbnMudXJsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuYXBwZW5kKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9Gb2N1cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEhvbGRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b1NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXZvaWQgbWlzY2FsY3VsYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2V2lkdGggPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnd2lkdGgnLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldkhlaWdodCA9IGNvbnRlbnRIb2xkZXJbMF0uc3R5bGUuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IGRhdGFcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbFdpZHRoID0gY29udGVudEhvbGRlclswXS5zY3JvbGxXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbEhlaWdodCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udFdpZHRoID0gY29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250SGVpZ2h0ID0gY29udGFpbmVyLmhlaWdodCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFXaWR0aCA9IGNvbnRhaW5lci5vdXRlcldpZHRoKHRydWUpIC0gY29udFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFIZWlnaHQgPSBjb250YWluZXIub3V0ZXJIZWlnaHQodHJ1ZSkgLSBjb250SGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggPSAkKHdpbmRvdykud2lkdGgoKSAtIGV4dHJhV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSBleHRyYUhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGFuZCBhcHBseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBhY3R1YWxXaWR0aCA+IG1heFdpZHRoID8gbWF4V2lkdGggOiBhY3R1YWxXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYWN0dWFsSGVpZ2h0ID4gbWF4SGVpZ2h0ID8gbWF4SGVpZ2h0IDogYWN0dWFsSGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hbmltYXRlKHNpemUsIDMwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IG1pc2NhbGN1bGF0aW9ucyBjb3JyZWN0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnd2lkdGgnLCBwcmV2V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnaGVpZ2h0JywgcHJldkhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBFbHNlLCBpZiB1cmwgaXMgYSBmdWxsIGh0bWwgcGFnZSAobm9ybWFsIHBhZ2UpLCBwdXQgY29udGVudCBpbnRvIGFuIGlmcmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoZGF0YSwgdGhpcy5vcHRpb25zLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBibG9ja2luZyBlbGVtZW50IGNvbnRlbnQgKHRoZSBsb2FkaW5nKSB3aXRoIHRoZSBpZnJhbWU6XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCBlcnJvcjogZnVuY3Rpb24gKGosIHQsIGV4KSB7XHJcbiAgICAgICAgICAgICQoJ2Rpdi5ibG9ja01zZycpLmh0bWwoKG9wdGlvbnMuY2xvc2FibGUub25FcnJvciA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKSArICc8ZGl2IGNsYXNzPVwiY29udGVudFwiPlBhZ2Ugbm90IGZvdW5kPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuaW5mbykgY29uc29sZS5pbmZvKFwiUG9wdXAtYWpheCBlcnJvcjogXCIgKyBleCk7XHJcbiAgICAgICAgfSwgY29tcGxldGU6IG9wdGlvbnMuY29tcGxldGVcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciByZXR1cm5lZEJsb2NrID0gJCgnLmJsb2NrVUknKTtcclxuXHJcbiAgICByZXR1cm5lZEJsb2NrLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgIHJldHVybmVkQmxvY2sudHJpZ2dlcigncG9wdXAtY2xvc2VkJyk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm5lZEJsb2NrLmNsb3NlUG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRCbG9ja0VsZW1lbnQgPSBmdW5jdGlvbiBnZXRCbG9ja0VsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbHRlcignLmJsb2NrTXNnJyk7IH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldENvbnRlbnRFbGVtZW50ID0gZnVuY3Rpb24gZ2V0Q29udGVudEVsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbmQoJy5jb250ZW50Jyk7IH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldE92ZXJsYXlFbGVtZW50ID0gZnVuY3Rpb24gZ2V0T3ZlcmxheUVsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbHRlcignLmJsb2NrT3ZlcmxheScpOyB9O1xyXG4gICAgcmV0dXJuIHJldHVybmVkQmxvY2s7XHJcbn1cclxuXHJcbi8qIFNvbWUgcG9wdXAgdXRpbGl0aXRlcy9zaG9ydGhhbmRzICovXHJcbmZ1bmN0aW9uIG1lc3NhZ2VQb3B1cChtZXNzYWdlLCBjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8ICdib2R5Jyk7XHJcbiAgICB2YXIgY29udGVudCA9ICQoJzxkaXYvPicpLnRleHQobWVzc2FnZSk7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGNvbnRhaW5lciwgJ21lc3NhZ2UtcG9wdXAgZnVsbC1ibG9jaycsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSwgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29ubmVjdFBvcHVwQWN0aW9uKGFwcGx5VG9TZWxlY3Rvcikge1xyXG4gICAgYXBwbHlUb1NlbGVjdG9yID0gYXBwbHlUb1NlbGVjdG9yIHx8ICcucG9wdXAtYWN0aW9uJztcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIGFwcGx5VG9TZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjID0gJCgkKHRoaXMpLmF0dHIoJ2hyZWYnKSkuY2xvbmUoKTtcclxuICAgICAgICBpZiAoYy5sZW5ndGggPT0gMSlcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihjLCBkb2N1bWVudCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiB0cnVlIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vLyBUaGUgcG9wdXAgZnVuY3Rpb24gY29udGFpbnMgYWxsIHRoZSBvdGhlcnMgYXMgbWV0aG9kc1xyXG5wb3B1cC5zaXplID0gcG9wdXBTaXplO1xyXG5wb3B1cC5zdHlsZSA9IHBvcHVwU3R5bGU7XHJcbnBvcHVwLmNvbm5lY3RBY3Rpb24gPSBjb25uZWN0UG9wdXBBY3Rpb247XHJcbnBvcHVwLm1lc3NhZ2UgPSBtZXNzYWdlUG9wdXA7XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwb3B1cDsiLCLvu78vKioqKiBQb3N0YWwgQ29kZTogb24gZmx5LCBzZXJ2ZXItc2lkZSB2YWxpZGF0aW9uICoqKioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgYmFzZVVybDogJy8nLFxyXG4gICAgICAgIHNlbGVjdG9yOiAnW2RhdGEtdmFsLXBvc3RhbGNvZGVdJyxcclxuICAgICAgICB1cmw6ICdKU09OL1ZhbGlkYXRlUG9zdGFsQ29kZS8nXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgb3B0aW9ucy5zZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gSWYgY29udGFpbnMgYSB2YWx1ZSAodGhpcyBub3QgdmFsaWRhdGUgaWYgaXMgcmVxdWlyZWQpIGFuZCBcclxuICAgICAgICAvLyBoYXMgdGhlIGVycm9yIGRlc2NyaXB0aXZlIG1lc3NhZ2UsIHZhbGlkYXRlIHRocm91Z2ggYWpheFxyXG4gICAgICAgIHZhciBwYyA9ICR0LnZhbCgpO1xyXG4gICAgICAgIHZhciBtc2cgPSAkdC5kYXRhKCd2YWwtcG9zdGFsY29kZScpO1xyXG4gICAgICAgIGlmIChwYyAmJiBtc2cpIHtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogb3B0aW9ucy5iYXNlVXJsICsgb3B0aW9ucy51cmwsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7IFBvc3RhbENvZGU6IHBjIH0sXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnSlNPTicsXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuUmVzdWx0LklzVmFsaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZGF0aW9uLWVycm9yJykuYWRkQ2xhc3MoJ3ZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5zaWJsaW5ncygnLmZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGV4dCgnJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFuIHN1bW1hcnkgZXJyb3JzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCc+IHVsID4gbGknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQodGhpcykudGV4dCgpID09IG1zZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLnJlbW92ZUNsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPHNwYW4gZm9yPVwiJyArICR0LmF0dHIoJ25hbWUnKSArICdcIiBnZW5lcmF0ZWQ9XCJ0cnVlXCI+JyArIG1zZyArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgc3VtbWFyeSBlcnJvciAoaWYgdGhlcmUgaXMgbm90KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jaGlsZHJlbigndWwnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxsaT4nICsgbXNnICsgJzwvbGk+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07Iiwi77u/LyoqIEFwcGx5IGV2ZXIgYSByZWRpcmVjdCB0byB0aGUgZ2l2ZW4gVVJMLCBpZiB0aGlzIGlzIGFuIGludGVybmFsIFVSTCBvciBzYW1lXHJcbnBhZ2UsIGl0IGZvcmNlcyBhIHBhZ2UgcmVsb2FkIGZvciB0aGUgZ2l2ZW4gVVJMLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVkaXJlY3RUbyh1cmwpIHtcclxuICAgIC8vIEJsb2NrIHRvIGF2b2lkIG1vcmUgdXNlciBpbnRlcmFjdGlvbnM6XHJcbiAgICAkLmJsb2NrVUkoeyBtZXNzYWdlOiAnJyB9KTsgLy9sb2FkaW5nQmxvY2spO1xyXG4gICAgLy8gQ2hlY2tpbmcgaWYgaXMgYmVpbmcgcmVkaXJlY3Rpbmcgb3Igbm90XHJcbiAgICB2YXIgcmVkaXJlY3RlZCA9IGZhbHNlO1xyXG4gICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiBjaGVja1JlZGlyZWN0KCkge1xyXG4gICAgICAgIHJlZGlyZWN0ZWQgPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBOYXZpZ2F0ZSB0byBuZXcgbG9jYXRpb246XHJcbiAgICB3aW5kb3cubG9jYXRpb24gPSB1cmw7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJZiBwYWdlIG5vdCBjaGFuZ2VkIChzYW1lIHVybCBvciBpbnRlcm5hbCBsaW5rKSwgcGFnZSBjb250aW51ZSBleGVjdXRpbmcgdGhlbiByZWZyZXNoOlxyXG4gICAgICAgIGlmICghcmVkaXJlY3RlZClcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSwgNTApO1xyXG59O1xyXG4iLCLvu78vKiogU2FuaXRpemUgdGhlIHdoaXRlc3BhY2VzIGluIGEgdGV4dCBieTpcclxuLSByZXBsYWNpbmcgY29udGlndW91cyB3aGl0ZXNwYWNlcyBjaGFyYWN0ZXJlcyAoYW55IG51bWJlciBvZiByZXBldGl0aW9uIFxyXG5hbmQgYW55IGtpbmQgb2Ygd2hpdGUgY2hhcmFjdGVyKSBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlcGxhY2UgZW5jb2RlZCBub24tYnJlYWtpbmctc3BhY2VzIGJ5IGEgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbi0gcmVtb3ZlIHN0YXJ0aW5nIGFuZCBlbmRpbmcgd2hpdGUtc3BhY2VzXHJcbi0gZXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4qKi9cclxuZnVuY3Rpb24gc2FuaXRpemVXaGl0ZXNwYWNlcyh0ZXh0KSB7XHJcbiAgICAvLyBFdmVyIHJldHVybiBhIHN0cmluZywgZW1wdHkgd2hlbiBudWxsXHJcbiAgICB0ZXh0ID0gKHRleHQgfHwgJycpXHJcbiAgICAvLyBSZXBsYWNlIGFueSBraW5kIG9mIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVycyBieSBhIHNpbmdsZSBub3JtYWwgd2hpdGUtc3BhY2VcclxuICAgIC8vICh0aGF0cyBpbmNsdWRlIHJlcGxhY2UgZW5jb25kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyxcclxuICAgIC8vIGFuZCBkdXBsaWNhdGVkLXJlcGVhdGVkIGFwcGVhcmFuY2VzKVxyXG4gICAgLnJlcGxhY2UoL1xccysvZywgJyAnKTtcclxuICAgIC8vIFJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlc3BhY2VzXHJcbiAgICByZXR1cm4gJC50cmltKHRleHQpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzYW5pdGl6ZVdoaXRlc3BhY2VzOyIsIu+7vy8qKiBDdXN0b20gTG9jb25vbWljcyAnbGlrZSBibG9ja1VJJyBwb3B1cHNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUsXHJcbiAgICBhdXRvRm9jdXMgPSByZXF1aXJlKCcuL2F1dG9Gb2N1cycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcblxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9jayhjb250ZW50Qm94LCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykge1xyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcclxuICAgICAgICBjZW50ZXI6IGZhbHNlLFxyXG4gICAgICAgIC8qIGFzIGEgdmFsaWQgb3B0aW9ucyBwYXJhbWV0ZXIgZm9yIExDLmhpZGVFbGVtZW50IGZ1bmN0aW9uICovXHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiA2MDAsXHJcbiAgICAgICAgICAgIGVmZmVjdDogJ2ZhZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgYXV0b2ZvY3VzT3B0aW9uczogeyBtYXJnaW5Ub3A6IDYwIH0sXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgY29udGVudEJveCA9ICQoY29udGVudEJveCk7XHJcbiAgICB2YXIgZnVsbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJsb2NrZWQgPT0gZG9jdW1lbnQgfHwgYmxvY2tlZCA9PSB3aW5kb3cpIHtcclxuICAgICAgICBibG9ja2VkID0gJCgnYm9keScpO1xyXG4gICAgICAgIGZ1bGwgPSB0cnVlO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgYmxvY2tlZCA9ICQoYmxvY2tlZCk7XHJcblxyXG4gICAgdmFyIGJveEluc2lkZUJsb2NrZWQgPSAhYmxvY2tlZC5pcygnYm9keSx0cix0aGVhZCx0Ym9keSx0Zm9vdCx0YWJsZSx1bCxvbCxkbCcpO1xyXG5cclxuICAgIC8vIEdldHRpbmcgYm94IGVsZW1lbnQgaWYgZXhpc3RzIGFuZCByZWZlcmVuY2luZ1xyXG4gICAgdmFyIGJJRCA9IGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcpO1xyXG4gICAgaWYgKCFiSUQpXHJcbiAgICAgICAgYklEID0gKGNvbnRlbnRCb3guYXR0cignaWQnKSB8fCAnJykgKyAoYmxvY2tlZC5hdHRyKCdpZCcpIHx8ICcnKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgaWYgKGJJRCA9PSAnLXNtb290aEJveEJsb2NrJykge1xyXG4gICAgICAgIGJJRCA9ICdpZC0nICsgZ3VpZEdlbmVyYXRvcigpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICB9XHJcbiAgICBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnLCBiSUQpO1xyXG4gICAgdmFyIGJveCA9ICQoJyMnICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShiSUQpKTtcclxuICAgIC8vIEhpZGluZyBib3g6XHJcbiAgICBpZiAoY29udGVudEJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3gueGhpZGUob3B0aW9ucy5jbG9zZU9wdGlvbnMpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBib3hjO1xyXG4gICAgaWYgKGJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3hjID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stZWxlbWVudFwiLz4nKTtcclxuICAgICAgICBib3ggPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1vdmVybGF5XCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgYm94LmFkZENsYXNzKGFkZGNsYXNzKTtcclxuICAgICAgICBpZiAoZnVsbCkgYm94LmFkZENsYXNzKCdmdWxsLWJsb2NrJyk7XHJcbiAgICAgICAgYm94LmFwcGVuZChib3hjKTtcclxuICAgICAgICBib3guYXR0cignaWQnLCBiSUQpO1xyXG4gICAgICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKVxyXG4gICAgICAgICAgICBibG9ja2VkLmFwcGVuZChib3gpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZChib3gpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBib3hjID0gYm94LmNoaWxkcmVuKCcuc21vb3RoLWJveC1ibG9jay1lbGVtZW50Jyk7XHJcbiAgICB9XHJcbiAgICAvLyBIaWRkZW4gZm9yIHVzZXIsIGJ1dCBhdmFpbGFibGUgdG8gY29tcHV0ZTpcclxuICAgIGNvbnRlbnRCb3guc2hvdygpO1xyXG4gICAgYm94LnNob3coKS5jc3MoJ29wYWNpdHknLCAwKTtcclxuICAgIC8vIFNldHRpbmcgdXAgdGhlIGJveCBhbmQgc3R5bGVzLlxyXG4gICAgYm94Yy5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgaWYgKG9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAgYm94Yy5hcHBlbmQoJCgnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cCBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nKSk7XHJcbiAgICBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnLCBvcHRpb25zKTtcclxuICAgIGlmICghYm94Yy5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJykpXHJcbiAgICAgIGJveGNcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoZSkgeyBlLnByZXZlbnREZWZhdWx0KCk7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIG51bGwsIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycpKTsgfSlcclxuICAgICAgICAuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcsIHRydWUpO1xyXG4gICAgYm94Yy5hcHBlbmQoY29udGVudEJveCk7XHJcbiAgICBib3hjLndpZHRoKG9wdGlvbnMud2lkdGgpO1xyXG4gICAgYm94LmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gaW5zaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQ6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIGJsb2NrZWQuY3NzKCd6LWluZGV4JykgKyAxMCk7XHJcbiAgICAgICAgaWYgKCFibG9ja2VkLmNzcygncG9zaXRpb24nKSB8fCBibG9ja2VkLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJylcclxuICAgICAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJyk7XHJcbiAgICAgICAgLy9vZmZzID0gYmxvY2tlZC5wb3NpdGlvbigpO1xyXG4gICAgICAgIGJveC5jc3MoJ3RvcCcsIDApO1xyXG4gICAgICAgIGJveC5jc3MoJ2xlZnQnLCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gb3V0c2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50LCBhcyBhIGRpcmVjdCBjaGlsZCBvZiBCb2R5OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBNYXRoLmZsb29yKE51bWJlci5NQVhfVkFMVUUpKTtcclxuICAgICAgICBib3guY3NzKGJsb2NrZWQub2Zmc2V0KCkpO1xyXG4gICAgfVxyXG4gICAgLy8gRGltZW5zaW9ucyBtdXN0IGJlIGNhbGN1bGF0ZWQgYWZ0ZXIgYmVpbmcgYXBwZW5kZWQgYW5kIHBvc2l0aW9uIHR5cGUgYmVpbmcgc2V0OlxyXG4gICAgYm94LndpZHRoKGJsb2NrZWQub3V0ZXJXaWR0aCgpKTtcclxuICAgIGJveC5oZWlnaHQoYmxvY2tlZC5vdXRlckhlaWdodCgpKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5jZW50ZXIpIHtcclxuICAgICAgICBib3hjLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgICAgICB2YXIgY2wsIGN0O1xyXG4gICAgICAgIGlmIChmdWxsKSB7XHJcbiAgICAgICAgICAgIGN0ID0gc2NyZWVuLmhlaWdodCAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gc2NyZWVuLndpZHRoIC8gMjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjdCA9IGJveC5vdXRlckhlaWdodCh0cnVlKSAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gYm94Lm91dGVyV2lkdGgodHJ1ZSkgLyAyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBib3hjLmNzcygndG9wJywgY3QgLSBib3hjLm91dGVySGVpZ2h0KHRydWUpIC8gMik7XHJcbiAgICAgICAgYm94Yy5jc3MoJ2xlZnQnLCBjbCAtIGJveGMub3V0ZXJXaWR0aCh0cnVlKSAvIDIpO1xyXG4gICAgfVxyXG4gICAgLy8gTGFzdCBzZXR1cFxyXG4gICAgYXV0b0ZvY3VzKGJveCk7XHJcbiAgICAvLyBTaG93IGJsb2NrXHJcbiAgICBib3guYW5pbWF0ZSh7IG9wYWNpdHk6IDEgfSwgMzAwKTtcclxuICAgIGlmIChvcHRpb25zLmF1dG9mb2N1cylcclxuICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50Qm94LCBvcHRpb25zLmF1dG9mb2N1c09wdGlvbnMpO1xyXG4gICAgcmV0dXJuIGJveDtcclxufVxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsKGNvbnRhaW5lcikge1xyXG4gICAgJChjb250YWluZXIgfHwgZG9jdW1lbnQpLmZpbmQoJy5zbW9vdGgtYm94LWJsb2NrLW92ZXJsYXknKS5oaWRlKCk7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvcGVuOiBzbW9vdGhCb3hCbG9jayxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHsgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpOyB9LFxyXG4gICAgICAgIGNsb3NlQWxsOiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsXHJcbiAgICB9OyIsIu+7vy8qKlxyXG4qKiBNb2R1bGU6OiB0b29sdGlwc1xyXG4qKiBDcmVhdGVzIHNtYXJ0IHRvb2x0aXBzIHdpdGggcG9zc2liaWxpdGllcyBmb3Igb24gaG92ZXIgYW5kIG9uIGNsaWNrLFxyXG4qKiBhZGRpdGlvbmFsIGRlc2NyaXB0aW9uIG9yIGV4dGVybmFsIHRvb2x0aXAgY29udGVudC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzYW5pdGl6ZVdoaXRlc3BhY2VzID0gcmVxdWlyZSgnLi9zYW5pdGl6ZVdoaXRlc3BhY2VzJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lm91dGVySHRtbCcpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5pc0NoaWxkT2YnKTtcclxuXHJcbi8vIE1haW4gaW50ZXJuYWwgcHJvcGVydGllc1xyXG52YXIgcG9zb2Zmc2V0ID0geyB4OiAxNiwgeTogOCB9O1xyXG52YXIgc2VsZWN0b3IgPSAnW3RpdGxlXVtkYXRhLWRlc2NyaXB0aW9uXSwgW3RpdGxlXS5oYXMtdG9vbHRpcCwgW3RpdGxlXS5zZWN1cmUtZGF0YSwgW2RhdGEtdG9vbHRpcC11cmxdLCBbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJztcclxuXHJcbi8qKiBQb3NpdGlvbmF0ZSB0aGUgdG9vbHRpcCBkZXBlbmRpbmcgb24gdGhlXHJcbmV2ZW50IG9yIHRoZSB0YXJnZXQgZWxlbWVudCBwb3NpdGlvbiBhbmQgYW4gb2Zmc2V0XHJcbioqL1xyXG5mdW5jdGlvbiBwb3ModCwgZSwgbCkge1xyXG4gICAgdmFyIHgsIHk7XHJcbiAgICBpZiAoZS5wYWdlWCAmJiBlLnBhZ2VZKSB7XHJcbiAgICAgICAgeCA9IGUucGFnZVg7XHJcbiAgICAgICAgeSA9IGUucGFnZVk7XHJcbiAgICB9IGVsc2UgaWYgKGUudGFyZ2V0KSB7XHJcbiAgICAgICAgdmFyICRldCA9ICQoZS50YXJnZXQpO1xyXG4gICAgICAgIHggPSAkZXQub3V0ZXJXaWR0aCgpICsgJGV0Lm9mZnNldCgpLmxlZnQ7XHJcbiAgICAgICAgeSA9ICRldC5vdXRlckhlaWdodCgpICsgJGV0Lm9mZnNldCgpLnRvcDtcclxuICAgIH1cclxuICAgIHQuY3NzKCdsZWZ0JywgeCArIHBvc29mZnNldC54KTtcclxuICAgIHQuY3NzKCd0b3AnLCB5ICsgcG9zb2Zmc2V0LnkpO1xyXG4gICAgLy8gQWRqdXN0IHdpZHRoIHRvIHZpc2libGUgdmlld3BvcnRcclxuICAgIHZhciB0ZGlmID0gdC5vdXRlcldpZHRoKCkgLSB0LndpZHRoKCk7XHJcbiAgICB0LmNzcygnbWF4LXdpZHRoJywgJCh3aW5kb3cpLndpZHRoKCkgLSB4IC0gcG9zb2Zmc2V0LnggLSB0ZGlmKTtcclxuICAgIC8vdC5oZWlnaHQoJChkb2N1bWVudCkuaGVpZ2h0KCkgLSB5IC0gcG9zb2Zmc2V0LnkpO1xyXG59XHJcbi8qKiBHZXQgb3IgY3JlYXRlLCBhbmQgcmV0dXJucywgdGhlIHRvb2x0aXAgY29udGVudCBmb3IgdGhlIGVsZW1lbnRcclxuKiovXHJcbmZ1bmN0aW9uIGNvbihsKSB7XHJcbiAgICBpZiAobC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGMgPSBsLmRhdGEoJ3Rvb2x0aXAtY29udGVudCcpLFxyXG4gICAgICAgIHBlcnNpc3RlbnQgPSBsLmRhdGEoJ3BlcnNpc3RlbnQtdG9vbHRpcCcpO1xyXG4gICAgaWYgKCFjKSB7XHJcbiAgICAgICAgdmFyIGggPSBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwuYXR0cigndGl0bGUnKSk7XHJcbiAgICAgICAgdmFyIGQgPSBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwuZGF0YSgnZGVzY3JpcHRpb24nKSk7XHJcbiAgICAgICAgaWYgKGQpXHJcbiAgICAgICAgICAgIGMgPSAnPGg0PicgKyBoICsgJzwvaDQ+PHA+JyArIGQgKyAnPC9wPic7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjID0gaDtcclxuICAgICAgICAvLyBBcHBlbmQgZGF0YS10b29sdGlwLXVybCBjb250ZW50IGlmIGV4aXN0c1xyXG4gICAgICAgIHZhciB1cmxjb250ZW50ID0gJChsLmRhdGEoJ3Rvb2x0aXAtdXJsJykpO1xyXG4gICAgICAgIGMgPSAoYyB8fCAnJykgKyB1cmxjb250ZW50Lm91dGVySHRtbCgpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBvcmlnaW5hbCwgaXMgbm8gbW9yZSBuZWVkIGFuZCBhdm9pZCBpZC1jb25mbGljdHNcclxuICAgICAgICB1cmxjb250ZW50LnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIFNhdmUgdG9vbHRpcCBjb250ZW50XHJcbiAgICAgICAgbC5kYXRhKCd0b29sdGlwLWNvbnRlbnQnLCBjKTtcclxuICAgICAgICAvLyBSZW1vdmUgYnJvd3NlciB0b29sdGlwIChib3RoIHdoZW4gd2UgYXJlIHVzaW5nIG91ciBvd24gdG9vbHRpcCBhbmQgd2hlbiBubyB0b29sdGlwXHJcbiAgICAgICAgLy8gaXMgbmVlZClcclxuICAgICAgICBsLmF0dHIoJ3RpdGxlJywgJycpO1xyXG4gICAgfVxyXG4gICAgLy8gUmVtb3ZlIHRvb2x0aXAgY29udGVudCAoYnV0IHByZXNlcnZlIGl0cyBjYWNoZSBpbiB0aGUgZWxlbWVudCBkYXRhKVxyXG4gICAgLy8gaWYgaXMgdGhlIHNhbWUgdGV4dCBhcyB0aGUgZWxlbWVudCBjb250ZW50IGFuZCB0aGUgZWxlbWVudCBjb250ZW50XHJcbiAgICAvLyBpcyBmdWxseSB2aXNpYmxlLiBUaGF0cywgZm9yIGNhc2VzIHdpdGggZGlmZmVyZW50IGNvbnRlbnQsIHdpbGwgYmUgc2hvd2VkLFxyXG4gICAgLy8gYW5kIGZvciBjYXNlcyB3aXRoIHNhbWUgY29udGVudCBidXQgaXMgbm90IHZpc2libGUgYmVjYXVzZSB0aGUgZWxlbWVudFxyXG4gICAgLy8gb3IgY29udGFpbmVyIHdpZHRoLCB0aGVuIHdpbGwgYmUgc2hvd2VkLlxyXG4gICAgLy8gRXhjZXB0IGlmIGlzIHBlcnNpc3RlbnRcclxuICAgIGlmIChwZXJzaXN0ZW50ICE9PSB0cnVlICYmXHJcbiAgICAgICAgc2FuaXRpemVXaGl0ZXNwYWNlcyhsLnRleHQoKSkgPT0gYyAmJlxyXG4gICAgICAgIGwub3V0ZXJXaWR0aCgpID49IGxbMF0uc2Nyb2xsV2lkdGgpIHtcclxuICAgICAgICBjID0gbnVsbDtcclxuICAgIH1cclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIGNvbnRlbnQ6XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICAvLyBVcGRhdGUgdGFyZ2V0IHJlbW92aW5nIHRoZSBjbGFzcyB0byBhdm9pZCBjc3MgbWFya2luZyB0b29sdGlwIHdoZW4gdGhlcmUgaXMgbm90XHJcbiAgICAgICAgbC5yZW1vdmVDbGFzcygnaGFzLXRvb2x0aXAnKS5yZW1vdmVDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIH1cclxuICAgIC8vIFJldHVybiB0aGUgY29udGVudCBhcyBzdHJpbmc6XHJcbiAgICByZXR1cm4gYztcclxufVxyXG4vKiogR2V0IG9yIGNyZWF0ZXMgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBmb3IgYSB0b29sdGlwIG9mIHRoZSBnaXZlbiB0eXBlXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRUb29sdGlwKHR5cGUpIHtcclxuICAgIHR5cGUgPSB0eXBlIHx8ICd0b29sdGlwJztcclxuICAgIHZhciBpZCA9ICdzaW5nbGV0b24tJyArIHR5cGU7XHJcbiAgICB2YXIgdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgIGlmICghdCkge1xyXG4gICAgICAgIHQgPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIiBjbGFzcz1cInRvb2x0aXBcIj48L2Rpdj4nKTtcclxuICAgICAgICB0LmF0dHIoJ2lkJywgaWQpO1xyXG4gICAgICAgIHQuaGlkZSgpO1xyXG4gICAgICAgICQoJ2JvZHknKS5hcHBlbmQodCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJCh0KTtcclxufVxyXG4vKiogU2hvdyB0aGUgdG9vbHRpcCBvbiBhbiBldmVudCB0cmlnZ2VyZWQgYnkgdGhlIGVsZW1lbnQgY29udGFpbmluZ1xyXG5pbmZvcm1hdGlvbiBmb3IgYSB0b29sdGlwXHJcbioqL1xyXG5mdW5jdGlvbiBzaG93VG9vbHRpcChlKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGlzUG9wdXAgPSAkdC5oYXNDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIC8vIEdldCBvciBjcmVhdGUgdG9vbHRpcCBsYXllclxyXG4gICAgdmFyIHQgPSBnZXRUb29sdGlwKGlzUG9wdXAgPyAncG9wdXAtdG9vbHRpcCcgOiAndG9vbHRpcCcpO1xyXG4gICAgLy8gSWYgdGhpcyBpcyBub3QgcG9wdXAgYW5kIHRoZSBldmVudCBpcyBjbGljaywgZGlzY2FyZCB3aXRob3V0IGNhbmNlbCBldmVudFxyXG4gICAgaWYgKCFpc1BvcHVwICYmIGUudHlwZSA9PSAnY2xpY2snKVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIC8vIENyZWF0ZSBjb250ZW50OiBpZiB0aGVyZSBpcyBjb250ZW50LCBjb250aW51ZVxyXG4gICAgdmFyIGNvbnRlbnQgPSBjb24oJHQpO1xyXG4gICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAvLyBJZiBpcyBhIGhhcy1wb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBkb24ndCBzaG93XHJcbiAgICAgICAgaWYgKGlzUG9wdXAgJiYgZS50eXBlICE9ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vIFRoZSB0b29sdGlwIHNldHVwIG11c3QgYmUgcXVldWVkIHRvIGF2b2lkIGNvbnRlbnQgdG8gYmUgc2hvd2VkIGFuZCBwbGFjZWRcclxuICAgICAgICAvLyB3aGVuIHN0aWxsIGhpZGRlbiB0aGUgcHJldmlvdXNcclxuICAgICAgICB0LnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gU2V0IHRvb2x0aXAgY29udGVudFxyXG4gICAgICAgICAgICB0Lmh0bWwoY29udGVudCk7XHJcbiAgICAgICAgICAgIC8vIEZvciBwb3B1cHMsIHNldHVwIGNsYXNzIGFuZCBjbG9zZSBidXR0b25cclxuICAgICAgICAgICAgaWYgKGlzUG9wdXApIHtcclxuICAgICAgICAgICAgICAgIHQuYWRkQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKTtcclxuICAgICAgICAgICAgICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxhIGhyZWY9XCIjY2xvc2UtcG9wdXBcIiBjbGFzcz1cImNsb3NlLWFjdGlvblwiPlg8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0LmFwcGVuZChjbG9zZUJ1dHRvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gUG9zaXRpb25hdGVcclxuICAgICAgICAgICAgcG9zKHQsIGUsICR0KTtcclxuICAgICAgICAgICAgdC5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgIC8vIFNob3cgKGFuaW1hdGlvbnMgYXJlIHN0b3BwZWQgb25seSBvbiBoaWRlIHRvIGF2b2lkIGNvbmZsaWN0cylcclxuICAgICAgICAgICAgdC5mYWRlSW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdG9wIGJ1YmJsaW5nIGFuZCBkZWZhdWx0XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEhpZGUgYWxsIG9wZW5lZCB0b29sdGlwcywgZm9yIGFueSB0eXBlLlxyXG5JdCBoYXMgc29tZSBzcGVjaWFsIGNvbnNpZGVyYXRpb25zIGZvciBwb3B1cC10b29sdGlwcyBkZXBlbmRpbmdcclxub24gdGhlIGV2ZW50IGJlaW5nIHRyaWdnZXJlZC5cclxuKiovXHJcbmZ1bmN0aW9uIGhpZGVUb29sdGlwKGUpIHtcclxuICAgICQoJy50b29sdGlwOnZpc2libGUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBvciB0aGUgaW52ZXJzZSxcclxuICAgICAgICAvLyB0aGlzIGlzIG5vdCBhIHBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgYSBjbGljaywgZG8gbm90aGluZ1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlICE9ICdjbGljaycgfHxcclxuICAgICAgICAgICAgIXQuaGFzQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKSAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIFN0b3AgYW5pbWF0aW9ucyBhbmQgaGlkZVxyXG4gICAgICAgIHQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEluaXRpYWxpemUgdG9vbHRpcHNcclxuKiovXHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyB0byBzaG93L2hpZGUgdG9vbHRpcHNcclxuICAgICQoJ2JvZHknKS5vbignbW91c2Vtb3ZlIGZvY3VzaW4nLCBzZWxlY3Rvciwgc2hvd1Rvb2x0aXApXHJcbiAgICAub24oJ21vdXNlbGVhdmUgZm9jdXNvdXQnLCBzZWxlY3RvciwgaGlkZVRvb2x0aXApXHJcbiAgICAvLyBMaXN0ZW4gZXZlbnQgZm9yIGNsaWNrYWJsZSBwb3B1cC10b29sdGlwc1xyXG4gICAgLm9uKCdjbGljaycsICdbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJywgc2hvd1Rvb2x0aXApXHJcbiAgICAvLyBBbGxvd2luZyBidXR0b25zIGluc2lkZSB0aGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcudG9vbHRpcC1idXR0b24nLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgIC8vIEFkZGluZyBjbG9zZS10b29sdGlwIGhhbmRsZXIgZm9yIHBvcHVwLXRvb2x0aXBzIChjbGljayBvbiBhbnkgZWxlbWVudCBleGNlcHQgdGhlIHRvb2x0aXAgaXRzZWxmKVxyXG4gICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKCcucG9wdXAtdG9vbHRpcDp2aXNpYmxlJykuZ2V0KDApO1xyXG4gICAgICAgIC8vIElmIHRoZSBjbGljayBpcyBOb3Qgb24gdGhlIHRvb2x0aXAgb3IgYW55IGVsZW1lbnQgY29udGFpbmVkXHJcbiAgICAgICAgLy8gaGlkZSB0b29sdGlwXHJcbiAgICAgICAgaWYgKGUudGFyZ2V0ICE9IHQgJiYgISQoZS50YXJnZXQpLmlzQ2hpbGRPZih0KSlcclxuICAgICAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KVxyXG4gICAgLy8gQXZvaWQgY2xvc2UtYWN0aW9uIGNsaWNrIGZyb20gcmVkaXJlY3QgcGFnZSwgYW5kIGhpZGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcucG9wdXAtdG9vbHRpcCAuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KTtcclxuICAgIHVwZGF0ZSgpO1xyXG59XHJcbi8qKiBVcGRhdGUgZWxlbWVudHMgb24gdGhlIHBhZ2UgdG8gcmVmbGVjdCBjaGFuZ2VzIG9yIG5lZWQgZm9yIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoZWxlbWVudF9zZWxlY3Rvcikge1xyXG4gICAgLy8gUmV2aWV3IGV2ZXJ5IHBvcHVwIHRvb2x0aXAgdG8gcHJlcGFyZSBjb250ZW50IGFuZCBtYXJrL3VubWFyayB0aGUgbGluayBvciB0ZXh0OlxyXG4gICAgJChlbGVtZW50X3NlbGVjdG9yIHx8IHNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb24oJCh0aGlzKSk7XHJcbiAgICB9KTtcclxufVxyXG4vKiogQ3JlYXRlIHRvb2x0aXAgb24gZWxlbWVudCBieSBkZW1hbmRcclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZV90b29sdGlwKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCB7XHJcbiAgICAgIHRpdGxlOiAnJ1xyXG4gICAgICAsIGRlc2NyaXB0aW9uOiBudWxsXHJcbiAgICAgICwgdXJsOiBudWxsXHJcbiAgICAgICwgaXNfcG9wdXA6IGZhbHNlXHJcbiAgICAgICwgcGVyc2lzdGVudDogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoZWxlbWVudClcclxuICAgIC5hdHRyKCd0aXRsZScsIHNldHRpbmdzLnRpdGxlKVxyXG4gICAgLmRhdGEoJ2Rlc2NyaXB0aW9uJywgc2V0dGluZ3MuZGVzY3JpcHRpb24pXHJcbiAgICAuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJywgc2V0dGluZ3MucGVyc2lzdGVudClcclxuICAgIC5hZGRDbGFzcyhzZXR0aW5ncy5pc19wb3B1cCA/ICdoYXMtcG9wdXAtdG9vbHRpcCcgOiAnaGFzLXRvb2x0aXAnKTtcclxuICAgIHVwZGF0ZShlbGVtZW50KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdFRvb2x0aXBzOiBpbml0LFxyXG4gICAgICAgIHVwZGF0ZVRvb2x0aXBzOiB1cGRhdGUsXHJcbiAgICAgICAgY3JlYXRlVG9vbHRpcDogY3JlYXRlX3Rvb2x0aXBcclxuICAgIH07XHJcbiIsIu+7vy8qIFNvbWUgdG9vbHMgZm9ybSBVUkwgbWFuYWdlbWVudFxyXG4qL1xyXG5leHBvcnRzLmdldFVSTFBhcmFtZXRlciA9IGZ1bmN0aW9uIGdldFVSTFBhcmFtZXRlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gZGVjb2RlVVJJKFxyXG4gICAgICAgIChSZWdFeHAobmFtZSArICc9JyArICcoLis/KSgmfCQpJywgJ2knKS5leGVjKGxvY2F0aW9uLnNlYXJjaCkgfHwgWywgbnVsbF0pWzFdKTtcclxufTtcclxuZXhwb3J0cy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSBmdW5jdGlvbiBnZXRIYXNoQmFuZ1BhcmFtZXRlcnMoaGFzaGJhbmd2YWx1ZSkge1xyXG4gICAgLy8gSGFzaGJhbmd2YWx1ZSBpcyBzb21ldGhpbmcgbGlrZTogVGhyZWFkLTFfTWVzc2FnZS0yXHJcbiAgICAvLyBXaGVyZSAnMScgaXMgdGhlIFRocmVhZElEIGFuZCAnMicgdGhlIG9wdGlvbmFsIE1lc3NhZ2VJRCwgb3Igb3RoZXIgcGFyYW1ldGVyc1xyXG4gICAgdmFyIHBhcnMgPSBoYXNoYmFuZ3ZhbHVlLnNwbGl0KCdfJyk7XHJcbiAgICB2YXIgdXJsUGFyYW1ldGVycyA9IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHBhcnN2YWx1ZXMgPSBwYXJzW2ldLnNwbGl0KCctJyk7XHJcbiAgICAgICAgaWYgKHBhcnN2YWx1ZXMubGVuZ3RoID09IDIpXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSBwYXJzdmFsdWVzWzFdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXJsUGFyYW1ldGVyc1twYXJzdmFsdWVzWzBdXSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXJsUGFyYW1ldGVycztcclxufTtcclxuIiwi77u/LyoqIFZhbGlkYXRpb24gbG9naWMgd2l0aCBsb2FkIGFuZCBzZXR1cCBvZiB2YWxpZGF0b3JzIGFuZCBcclxuICAgIHZhbGlkYXRpb24gcmVsYXRlZCB1dGlsaXRpZXNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbi8vIFVzaW5nIG9uIHNldHVwIGFzeW5jcm9ub3VzIGxvYWQgaW5zdGVhZCBvZiB0aGlzIHN0YXRpYy1saW5rZWQgbG9hZFxyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qcycpO1xyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qcycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBWYWxpZGF0aW9uKHJlYXBwbHlPbmx5VG8pIHtcclxuICAgIHJlYXBwbHlPbmx5VG8gPSByZWFwcGx5T25seVRvIHx8IGRvY3VtZW50O1xyXG4gICAgaWYgKCF3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkgd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmICghanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkge1xyXG4gICAgICAgIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKFtcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qc1wiIH0sXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanNcIiB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDaGVjayBmaXJzdCBpZiB2YWxpZGF0aW9uIGlzIGVuYWJsZWQgKGNhbiBoYXBwZW4gdGhhdCB0d2ljZSBpbmNsdWRlcyBvZlxyXG4gICAgICAgIC8vIHRoaXMgY29kZSBoYXBwZW4gYXQgc2FtZSBwYWdlLCBiZWluZyBleGVjdXRlZCB0aGlzIGNvZGUgYWZ0ZXIgZmlyc3QgYXBwZWFyYW5jZVxyXG4gICAgICAgIC8vIHdpdGggdGhlIHN3aXRjaCBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkIGNoYW5nZWRcclxuICAgICAgICAvLyBidXQgd2l0aG91dCB2YWxpZGF0aW9uIGJlaW5nIGFscmVhZHkgbG9hZGVkIGFuZCBlbmFibGVkKVxyXG4gICAgICAgIGlmICgkICYmICQudmFsaWRhdG9yICYmICQudmFsaWRhdG9yLnVub2J0cnVzaXZlKSB7XHJcbiAgICAgICAgICAgIC8vIEFwcGx5IHRoZSB2YWxpZGF0aW9uIHJ1bGVzIHRvIHRoZSBuZXcgZWxlbWVudHNcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd2YWxpZGF0b3InKTtcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICAgICAgJC52YWxpZGF0b3IudW5vYnRydXNpdmUucGFyc2UocmVhcHBseU9ubHlUbyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXRpZXMgKi9cclxuXHJcbi8qIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzIG9mIHRoZSB2YWxpZGF0aW9uIHN1bW1hcnlcclxuaW5jbHVkZWQgaW4gJ2NvbnRhaW5lcicgYW5kIHNldCBhcyB2YWxpZCB0aGUgc3VtbWFyeVxyXG4qL1xyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgICAkKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAuZmluZCgnPnVsPmxpJykucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gU2V0IGFsbCBmaWVsZHMgdmFsaWRhdGlvbiBpbnNpZGUgdGhpcyBmb3JtIChhZmZlY3RlZCBieSB0aGUgc3VtbWFyeSB0b28pXHJcbiAgICAvLyBhcyB2YWxpZCB0b29cclxuICAgICQoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAudGV4dCgnJyk7XHJcblxyXG4gICAgLy8gUmUtYXBwbHkgc2V0dXAgdmFsaWRhdGlvbiB0byBlbnN1cmUgaXMgd29ya2luZywgYmVjYXVzZSBqdXN0IGFmdGVyIGEgc3VjY2Vzc2Z1bFxyXG4gICAgLy8gdmFsaWRhdGlvbiwgYXNwLm5ldCB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIHN0b3BzIHdvcmtpbmcgb24gY2xpZW50LXNpZGUuXHJcbiAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGNvbnRhaW5lciwgZXJyb3JzKSB7XHJcbiAgdmFyIHYgPSBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKTtcclxuICB2LmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRFcnJvcnMoY29udGFpbmVyLCBlcnJvcnMpIHtcclxuICAgIC8vdmFyIHZhbGlkYXRvciA9ICQoY29udGFpbmVyKS52YWxpZGF0ZSgpO1xyXG4gICAgLy92YWxpZGF0b3Iuc2hvd0Vycm9ycyhlcnJvcnMpO1xyXG4gICAgdmFyICRzID0gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcikuZmluZCgndWwnKTtcclxuICAgIHZhciB3aXRoRXJyb3JzID0gZmFsc2U7XHJcbiAgICBmb3IodmFyIGZpZWxkIGluIGVycm9ycykge1xyXG4gICAgICAgIGlmIChlcnJvcnMuaGFzT3duUHJvcGVydHkgJiYgIWVycm9ycy5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICQoJzxsaS8+JykudGV4dChlcnJvcnNbZmllbGRdKS5hcHBlbmRUbygkcyk7XHJcbiAgICAgICAgLy8kKGNvbnRhaW5lcikuZmluZCgnW25hbWU9XCInICsgZmllbGQgKyAnXCJdJylcclxuICAgICAgICAvLy5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgLy8ucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQgdmFsaWQnKTtcclxuICAgICAgICB3aXRoRXJyb3JzID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlmICh3aXRoRXJyb3JzKVxyXG4gICAgICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihjb250YWluZXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnb1RvU3VtbWFyeUVycm9ycyhmb3JtKSB7XHJcbiAgICB2YXIgb2ZmID0gZm9ybS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLm9mZnNldCgpO1xyXG4gICAgaWYgKG9mZilcclxuICAgICAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IG9mZi50b3AgfSwgNTAwKTtcclxuICAgIGVsc2VcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdnb1RvU3VtbWFyeUVycm9yczogbm8gc3VtbWFyeSB0byBmb2N1cycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKSB7XHJcbiAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gIHJldHVybiAkKCdbZGF0YS12YWxtc2ctc3VtbWFyeT10cnVlXScsIGNvbnRhaW5lcik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2V0dXA6IHNldHVwVmFsaWRhdGlvbixcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDogc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IsXHJcbiAgICBnb1RvU3VtbWFyeUVycm9yczogZ29Ub1N1bW1hcnlFcnJvcnMsXHJcbiAgICBmaW5kVmFsaWRhdGlvblN1bW1hcnk6IGZpbmRWYWxpZGF0aW9uU3VtbWFyeSxcclxuICAgIHNldEVycm9yczogc2V0RXJyb3JzXHJcbn07Iiwi77u/LyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIEFjY291bnQgcGFnZXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudClcclxuICAgIC5vbignY2xpY2snLCAnYS5sb2dpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArICdBY2NvdW50LyRMb2dpbi8/UmV0dXJuVXJsPScgKyBlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5mb3Jnb3QtcGFzc3dvcmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvRm9yZ290UGFzc3dvcmQnLCAnL0FjY291bnQvJEZvcmdvdFBhc3N3b3JkJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0MDAsIGhlaWdodDogMjQwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EuY2hhbmdlLXBhc3N3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L0NoYW5nZVBhc3N3b3JkJywgJy9BY2NvdW50LyRDaGFuZ2VQYXNzd29yZCcpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDUwLCBoZWlnaHQ6IDM0MCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCLvu78vLyBPVVIgbmFtZXNwYWNlIChhYmJyZXZpYXRlZCBMb2Nvbm9taWNzKVxyXG53aW5kb3cuTEMgPSB3aW5kb3cuTEMgfHwge307XHJcblxyXG4vLyBUT0RPIFJldmlldyBMY1VybCB1c2UgYXJvdW5kIGFsbCB0aGUgbW9kdWxlcywgdXNlIERJIHdoZW5ldmVyIHBvc3NpYmxlIChpbml0L3NldHVwIG1ldGhvZCBvciBpbiB1c2UgY2FzZXMpXHJcbi8vIGJ1dCBvbmx5IGZvciB0aGUgd2FudGVkIGJhc2VVcmwgb24gZWFjaCBjYXNlIGFuZCBub3QgcGFzcyBhbGwgdGhlIExjVXJsIG9iamVjdC5cclxuLy8gTGNVcmwgaXMgc2VydmVyLXNpZGUgZ2VuZXJhdGVkIGFuZCB3cm90ZSBpbiBhIExheW91dCBzY3JpcHQtdGFnLlxyXG5cclxuLy8gR2xvYmFsIHNldHRpbmdzXHJcbndpbmRvdy5nTG9hZGluZ1JldGFyZCA9IDMwMDtcclxuXHJcbi8qKipcclxuICoqIExvYWRpbmcgbW9kdWxlc1xyXG4qKiovXHJcbi8vVE9ETzogQ2xlYW4gZGVwZW5kZW5jaWVzLCByZW1vdmUgYWxsIHRoYXQgbm90IHVzZWQgZGlyZWN0bHkgaW4gdGhpcyBmaWxlLCBhbnkgb3RoZXIgZmlsZVxyXG4vLyBvciBwYWdlIG11c3QgcmVxdWlyZSBpdHMgZGVwZW5kZW5jaWVzLlxyXG5cclxud2luZG93LkxjVXJsID0gcmVxdWlyZSgnLi4vTEMvTGNVcmwnKTtcclxuXHJcbi8qIGpRdWVyeSwgc29tZSB2ZW5kb3IgcGx1Z2lucyAoZnJvbSBidW5kbGUpIGFuZCBvdXIgYWRkaXRpb25zIChzbWFsbCBwbHVnaW5zKSwgdGhleSBhcmUgYXV0b21hdGljYWxseSBwbHVnLWVkIG9uIHJlcXVpcmUgKi9cclxudmFyICQgPSB3aW5kb3cuJCA9IHdpbmRvdy5qUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5Lmhhc1Njcm9sbEJhcicpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmEtaGFzaGNoYW5nZScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkuYXJlJyk7XHJcbi8vIE1hc2tlZCBpbnB1dCwgZm9yIGRhdGVzIC1hdCBteS1hY2NvdW50LS5cclxucmVxdWlyZSgnanF1ZXJ5LmZvcm1hdHRlcicpO1xyXG5cclxuLy8gR2VuZXJhbCBjYWxsYmFja3MgZm9yIEFKQVggZXZlbnRzIHdpdGggY29tbW9uIGxvZ2ljXHJcbnZhciBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnLi4vTEMvYWpheENhbGxiYWNrcycpO1xyXG4vLyBGb3JtLmFqYXggbG9naWMgYW5kIG1vcmUgc3BlY2lmaWMgY2FsbGJhY2tzIGJhc2VkIG9uIGFqYXhDYWxsYmFja3NcclxudmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxud2luZG93LmFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyID0gYWpheEZvcm1zLm9uU3VjY2Vzcztcclxud2luZG93LmFqYXhFcnJvclBvcHVwSGFuZGxlciA9IGFqYXhGb3Jtcy5vbkVycm9yO1xyXG53aW5kb3cuYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyID0gYWpheEZvcm1zLm9uQ29tcGxldGU7XHJcbi8vfVxyXG5cclxuLyogUmVsb2FkICovXHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5yZWxvYWQnKTtcclxuLy8gV3JhcHBlciBmdW5jdGlvbiBhcm91bmQgb25TdWNjZXNzIHRvIG1hcmsgb3BlcmF0aW9uIGFzIHBhcnQgb2YgYSBcclxuLy8gcmVsb2FkIGF2b2lkaW5nIHNvbWUgYnVncyAoYXMgcmVwbGFjZS1jb250ZW50IG9uIGFqYXgtYm94LCBub3Qgd2FudGVkIGZvclxyXG4vLyByZWxvYWQgb3BlcmF0aW9ucylcclxuZnVuY3Rpb24gcmVsb2FkU3VjY2Vzc1dyYXBwZXIoKSB7XHJcbiAgdmFyIGNvbnRleHQgPSAkLmlzUGxhaW5PYmplY3QodGhpcykgPyB0aGlzIDogeyBlbGVtZW50OiB0aGlzIH07XHJcbiAgY29udGV4dC5pc1JlbG9hZCA9IHRydWU7XHJcbiAgYWpheEZvcm1zLm9uU3VjY2Vzcy5hcHBseShjb250ZXh0LCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcclxufVxyXG4kLmZuLnJlbG9hZC5kZWZhdWx0cyA9IHtcclxuICBzdWNjZXNzOiBbcmVsb2FkU3VjY2Vzc1dyYXBwZXJdLFxyXG4gIGVycm9yOiBbYWpheEZvcm1zLm9uRXJyb3JdLFxyXG4gIGRlbGF5OiBnTG9hZGluZ1JldGFyZFxyXG59O1xyXG5cclxuTEMubW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuLi9MQy9tb3ZlRm9jdXNUbycpO1xyXG4vKiBEaXNhYmxlZCBiZWNhdXNlIGNvbmZsaWN0cyB3aXRoIHRoZSBtb3ZlRm9jdXNUbyBvZiBcclxuICBhamF4Rm9ybS5vbnN1Y2Nlc3MsIGl0IGhhcHBlbnMgYSBibG9jay5sb2FkaW5nIGp1c3QgYWZ0ZXJcclxuICB0aGUgc3VjY2VzcyBoYXBwZW5zLlxyXG4kLmJsb2NrVUkuZGVmYXVsdHMub25CbG9jayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFNjcm9sbCB0byBibG9jay1tZXNzYWdlIHRvIGRvbid0IGxvc3QgaW4gbGFyZ2UgcGFnZXM6XHJcbiAgICBMQy5tb3ZlRm9jdXNUbyh0aGlzKTtcclxufTsqL1xyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4uL0xDL2xvYWRlcicpO1xyXG5MQy5sb2FkID0gbG9hZGVyLmxvYWQ7XHJcblxyXG52YXIgYmxvY2tzID0gTEMuYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi4vTEMvYmxvY2tQcmVzZXRzJyk7XHJcbi8ve1RFTVBcclxud2luZG93LmxvYWRpbmdCbG9jayA9IGJsb2Nrcy5sb2FkaW5nO1xyXG53aW5kb3cuaW5mb0Jsb2NrID0gYmxvY2tzLmluZm87XHJcbndpbmRvdy5lcnJvckJsb2NrID0gYmxvY2tzLmVycm9yO1xyXG4vL31cclxuXHJcbkFycmF5LnJlbW92ZSA9IHJlcXVpcmUoJy4uL0xDL0FycmF5LnJlbW92ZScpO1xyXG5yZXF1aXJlKCcuLi9MQy9TdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zJyk7XHJcblxyXG5MQy5nZXRUZXh0ID0gcmVxdWlyZSgnLi4vTEMvZ2V0VGV4dCcpO1xyXG5cclxudmFyIFRpbWVTcGFuID0gTEMudGltZVNwYW4gPSByZXF1aXJlKCcuLi9MQy9UaW1lU3BhbicpO1xyXG52YXIgdGltZVNwYW5FeHRyYSA9IHJlcXVpcmUoJy4uL0xDL1RpbWVTcGFuRXh0cmEnKTtcclxudGltZVNwYW5FeHRyYS5wbHVnSW4oVGltZVNwYW4pO1xyXG4vL3tURU1QICBvbGQgYWxpYXNlc1xyXG5MQy5zbWFydFRpbWUgPSB0aW1lU3BhbkV4dHJhLnNtYXJ0VGltZTtcclxuTEMucm91bmRUaW1lVG9RdWFydGVySG91ciA9IHRpbWVTcGFuRXh0cmEucm91bmRUb1F1YXJ0ZXJIb3VyO1xyXG4vL31cclxuXHJcbkxDLkNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuLi9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbndpbmRvdy5UYWJiZWRVWCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYJyk7XHJcbnZhciBzbGlkZXJUYWJzID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguc2xpZGVyVGFicycpO1xyXG5cclxuLy8gUG9wdXAgQVBJc1xyXG53aW5kb3cuc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuLi9MQy9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi4vTEMvcG9wdXAnKTtcclxuLy97VEVNUFxyXG52YXIgcG9wdXBTdHlsZSA9IHBvcHVwLnN0eWxlLFxyXG4gICAgcG9wdXBTaXplID0gcG9wdXAuc2l6ZTtcclxuTEMubWVzc2FnZVBvcHVwID0gcG9wdXAubWVzc2FnZTtcclxuTEMuY29ubmVjdFBvcHVwQWN0aW9uID0gcG9wdXAuY29ubmVjdEFjdGlvbjtcclxud2luZG93LnBvcHVwID0gcG9wdXA7XHJcbi8vfVxyXG5cclxuTEMuc2FuaXRpemVXaGl0ZXNwYWNlcyA9IHJlcXVpcmUoJy4uL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMnKTtcclxuLy97VEVNUCAgIGFsaWFzIGJlY2F1c2UgbWlzc3BlbGxpbmdcclxuTEMuc2FuaXRpemVXaGl0ZXBhY2VzID0gTEMuc2FuaXRpemVXaGl0ZXNwYWNlcztcclxuLy99XHJcblxyXG5MQy5nZXRYUGF0aCA9IHJlcXVpcmUoJy4uL0xDL2dldFhQYXRoJyk7XHJcblxyXG52YXIgc3RyaW5nRm9ybWF0ID0gcmVxdWlyZSgnLi4vTEMvU3RyaW5nRm9ybWF0Jyk7XHJcblxyXG4vLyBFeHBhbmRpbmcgZXhwb3J0ZWQgdXRpbGl0ZXMgZnJvbSBtb2R1bGVzIGRpcmVjdGx5IGFzIExDIG1lbWJlcnM6XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9QcmljZScpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL21hdGhVdGlscycpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL251bWJlclV0aWxzJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvdG9vbHRpcHMnKSk7XHJcbnZhciBpMThuID0gTEMuaTE4biA9IHJlcXVpcmUoJy4uL0xDL2kxOG4nKTtcclxuLy97VEVNUCBvbGQgYWxpc2VzIG9uIExDIGFuZCBnbG9iYWxcclxuJC5leHRlbmQoTEMsIGkxOG4pO1xyXG4kLmV4dGVuZCh3aW5kb3csIGkxOG4pO1xyXG4vL31cclxuXHJcbi8vIHh0c2g6IHBsdWdlZCBpbnRvIGpxdWVyeSBhbmQgcGFydCBvZiBMQ1xyXG52YXIgeHRzaCA9IHJlcXVpcmUoJy4uL0xDL2pxdWVyeS54dHNoJyk7XHJcbnh0c2gucGx1Z0luKCQpO1xyXG4vL3tURU1QICAgcmVtb3ZlIG9sZCBMQy4qIGFsaWFzXHJcbiQuZXh0ZW5kKExDLCB4dHNoKTtcclxuZGVsZXRlIExDLnBsdWdJbjtcclxuLy99XHJcblxyXG52YXIgYXV0b0NhbGN1bGF0ZSA9IExDLmF1dG9DYWxjdWxhdGUgPSByZXF1aXJlKCcuLi9MQy9hdXRvQ2FsY3VsYXRlJyk7XHJcbi8ve1RFTVAgICByZW1vdmUgb2xkIGFsaWFzIHVzZVxyXG52YXIgbGNTZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMgPSBhdXRvQ2FsY3VsYXRlLm9uVGFibGVJdGVtcztcclxuTEMuc2V0dXBDYWxjdWxhdGVTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnk7XHJcbkxDLnVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLnVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnk7XHJcbkxDLnNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUub25EZXRhaWxlZFByaWNpbmdTdW1tYXJ5O1xyXG4vL31cclxuXHJcbnZhciBDb29raWUgPSBMQy5Db29raWUgPSByZXF1aXJlKCcuLi9MQy9Db29raWUnKTtcclxuLy97VEVNUCAgICBvbGQgYWxpYXNcclxudmFyIGdldENvb2tpZSA9IENvb2tpZS5nZXQsXHJcbiAgICBzZXRDb29raWUgPSBDb29raWUuc2V0O1xyXG4vL31cclxuXHJcbkxDLmRhdGVQaWNrZXIgPSByZXF1aXJlKCcuLi9MQy9kYXRlUGlja2VyJyk7XHJcbi8ve1RFTVAgICBvbGQgYWxpYXNcclxud2luZG93LnNldHVwRGF0ZVBpY2tlciA9IExDLnNldHVwRGF0ZVBpY2tlciA9IExDLmRhdGVQaWNrZXIuaW5pdDtcclxud2luZG93LmFwcGx5RGF0ZVBpY2tlciA9IExDLmFwcGx5RGF0ZVBpY2tlciA9IExDLmRhdGVQaWNrZXIuYXBwbHk7XHJcbi8vfVxyXG5cclxuTEMuYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi4vTEMvYXV0b0ZvY3VzJyk7XHJcblxyXG4vLyBDUlVETDogbG9hZGluZyBtb2R1bGUsIHNldHRpbmcgdXAgY29tbW9uIGRlZmF1bHQgdmFsdWVzIGFuZCBjYWxsYmFja3M6XHJcbnZhciBjcnVkbE1vZHVsZSA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJyk7XHJcbmNydWRsTW9kdWxlLmRlZmF1bHRTZXR0aW5ncy5kYXRhWydmb2N1cy1jbG9zZXN0J11bJ2RlZmF1bHQnXSA9ICcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nO1xyXG5jcnVkbE1vZHVsZS5kZWZhdWx0U2V0dGluZ3MuZGF0YVsnZm9jdXMtbWFyZ2luJ11bJ2RlZmF1bHQnXSA9IDEwO1xyXG52YXIgY3J1ZGwgPSBjcnVkbE1vZHVsZS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vLyBQcmV2aW91cyB1c2VkIGFsaWFzIChkZXByZWNhdGVkKTpcclxuTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcblxyXG4vLyBVSSBTbGlkZXIgTGFiZWxzXHJcbnZhciBzbGlkZXJMYWJlbHMgPSByZXF1aXJlKCcuLi9MQy9VSVNsaWRlckxhYmVscycpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxuTEMuY3JlYXRlTGFiZWxzRm9yVUlTbGlkZXIgPSBzbGlkZXJMYWJlbHMuY3JlYXRlO1xyXG5MQy51cGRhdGVMYWJlbHNGb3JVSVNsaWRlciA9IHNsaWRlckxhYmVscy51cGRhdGU7XHJcbkxDLnVpU2xpZGVyTGFiZWxzTGF5b3V0cyA9IHNsaWRlckxhYmVscy5sYXlvdXRzO1xyXG4vL31cclxuXHJcbnZhciB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi4vTEMvdmFsaWRhdGlvbkhlbHBlcicpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxuTEMuc2V0dXBWYWxpZGF0aW9uID0gdmFsaWRhdGlvbkhlbHBlci5zZXR1cDtcclxuTEMuc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkID0gdmFsaWRhdGlvbkhlbHBlci5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQ7XHJcbkxDLmdvVG9TdW1tYXJ5RXJyb3JzID0gdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycztcclxuLy99XHJcblxyXG5MQy5wbGFjZUhvbGRlciA9IHJlcXVpcmUoJy4uL0xDL3BsYWNlaG9sZGVyLXBvbHlmaWxsJykuaW5pdDtcclxuXHJcbkxDLm1hcFJlYWR5ID0gcmVxdWlyZSgnLi4vTEMvZ29vZ2xlTWFwUmVhZHknKTtcclxuXHJcbndpbmRvdy5pc0VtcHR5U3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvaXNFbXB0eVN0cmluZycpO1xyXG5cclxud2luZG93Lmd1aWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9MQy9ndWlkR2VuZXJhdG9yJyk7XHJcblxyXG52YXIgdXJsVXRpbHMgPSByZXF1aXJlKCcuLi9MQy91cmxVdGlscycpO1xyXG53aW5kb3cuZ2V0VVJMUGFyYW1ldGVyID0gdXJsVXRpbHMuZ2V0VVJMUGFyYW1ldGVyO1xyXG53aW5kb3cuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzID0gdXJsVXRpbHMuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzO1xyXG5cclxudmFyIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZycpO1xyXG4vL3tURU1QXHJcbkxDLmRhdGVUb0ludGVyY2hhbmdsZVN0cmluZyA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZztcclxuLy99XHJcblxyXG4vLyBQYWdlcyBpbiBwb3B1cFxyXG52YXIgd2VsY29tZVBvcHVwID0gcmVxdWlyZSgnLi93ZWxjb21lUG9wdXAnKTtcclxudmFyIGZhcXNQb3B1cHMgPSByZXF1aXJlKCcuL2ZhcXNQb3B1cHMnKTtcclxudmFyIGFjY291bnRQb3B1cHMgPSByZXF1aXJlKCcuL2FjY291bnRQb3B1cHMnKTtcclxudmFyIGxlZ2FsUG9wdXBzID0gcmVxdWlyZSgnLi9sZWdhbFBvcHVwcycpO1xyXG5cclxuLy8gT2xkIGF2YWlsYWJsaXR5IGNhbGVuZGFyXHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldCA9IHJlcXVpcmUoJy4vYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQnKTtcclxuLy8gTmV3IGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXIgPSByZXF1aXJlKCcuLi9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhcicpO1xyXG5cclxudmFyIGF1dG9maWxsU3VibWVudSA9IHJlcXVpcmUoJy4uL0xDL2F1dG9maWxsU3VibWVudScpO1xyXG5cclxudmFyIHRhYmJlZFdpemFyZCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLndpemFyZCcpO1xyXG5cclxudmFyIGhhc0NvbmZpcm1TdXBwb3J0ID0gcmVxdWlyZSgnLi4vTEMvaGFzQ29uZmlybVN1cHBvcnQnKTtcclxuXHJcbnZhciBwb3N0YWxDb2RlVmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4uL0xDL3Bvc3RhbENvZGVTZXJ2ZXJWYWxpZGF0aW9uJyk7XHJcblxyXG52YXIgdGFiYmVkTm90aWZpY2F0aW9ucyA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24nKTtcclxuXHJcbnZhciB0YWJzQXV0b2xvYWQgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5hdXRvbG9hZCcpO1xyXG5cclxudmFyIGhvbWVQYWdlID0gcmVxdWlyZSgnLi9ob21lJyk7XHJcblxyXG4vL3tURU1QIHJlbW92ZSBnbG9iYWwgZGVwZW5kZW5jeSBmb3IgdGhpc1xyXG53aW5kb3cuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4uL0xDL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuLy99XHJcblxyXG52YXIgcHJvdmlkZXJXZWxjb21lID0gcmVxdWlyZSgnLi9wcm92aWRlcldlbGNvbWUnKTtcclxuXHJcbi8qKlxyXG4gKiogSW5pdCBjb2RlXHJcbioqKi9cclxuJCh3aW5kb3cpLmxvYWQoZnVuY3Rpb24gKCkge1xyXG4gIC8vIERpc2FibGUgYnJvd3NlciBiZWhhdmlvciB0byBhdXRvLXNjcm9sbCB0byB1cmwgZnJhZ21lbnQvaGFzaCBlbGVtZW50IHBvc2l0aW9uOlxyXG4gIC8vIEVYQ0VQVCBpbiBEYXNoYm9hcmQ6XHJcbiAgLy8gVE9ETzogUmV2aWV3IGlmIHRoaXMgaXMgcmVxdWlyZWQgb25seSBmb3IgSG93SXRXb3JrcyBvciBzb21ldGhpbmcgbW9yZSAodGFicywgcHJvZmlsZSlcclxuICAvLyBhbmQgcmVtb3ZlIGlmIHBvc3NpYmxlIG9yIG9ubHkgb24gdGhlIGNvbmNyZXRlIGNhc2VzLlxyXG4gIGlmICghL1xcL2Rhc2hib2FyZFxcLy9pLnRlc3QobG9jYXRpb24pKVxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7ICQoJ2h0bWwsYm9keScpLnNjcm9sbFRvcCgwKTsgfSwgMSk7XHJcbn0pO1xyXG4kKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgcHJvdmlkZXJXZWxjb21lLnNob3coKTtcclxuXHJcbiAgLy8gUGxhY2Vob2xkZXIgcG9seWZpbGxcclxuICBMQy5wbGFjZUhvbGRlcigpO1xyXG5cclxuICAvLyBBdXRvZm9jdXMgcG9seWZpbGxcclxuICBMQy5hdXRvRm9jdXMoKTtcclxuXHJcbiAgLy8gR2VuZXJpYyBzY3JpcHQgZm9yIGVuaGFuY2VkIHRvb2x0aXBzIGFuZCBlbGVtZW50IGRlc2NyaXB0aW9uc1xyXG4gIExDLmluaXRUb29sdGlwcygpO1xyXG5cclxuICBhamF4Rm9ybXMuaW5pdCgpO1xyXG5cclxuICB3ZWxjb21lUG9wdXAuaW5pdCgpO1xyXG5cclxuICAvLyBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgZm9yIHNvbWUgbGlua3MgdGhhdCBieSBkZWZhdWx0IG9wZW4gYSBuZXcgdGFiOlxyXG4gIGZhcXNQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuICBhY2NvdW50UG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcbiAgbGVnYWxQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuXHJcbiAgLy8gT2xkIGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG4gIGF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0LmluaXQoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gIC8vIE5ldyBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxuICBhdmFpbGFiaWxpdHlDYWxlbmRhci5XZWVrbHkuZW5hYmxlQWxsKCk7XHJcblxyXG4gIHBvcHVwLmNvbm5lY3RBY3Rpb24oKTtcclxuXHJcbiAgLy8gRGF0ZSBQaWNrZXJcclxuICBMQy5kYXRlUGlja2VyLmluaXQoKTtcclxuXHJcbiAgLyogQXV0byBjYWxjdWxhdGUgdGFibGUgaXRlbXMgdG90YWwgKHF1YW50aXR5KnVuaXRwcmljZT1pdGVtLXRvdGFsKSBzY3JpcHQgKi9cclxuICBhdXRvQ2FsY3VsYXRlLm9uVGFibGVJdGVtcygpO1xyXG4gIGF1dG9DYWxjdWxhdGUub25TdW1tYXJ5KCk7XHJcblxyXG4gIGhhc0NvbmZpcm1TdXBwb3J0Lm9uKCk7XHJcblxyXG4gIHBvc3RhbENvZGVWYWxpZGF0aW9uLmluaXQoeyBiYXNlVXJsOiBMY1VybC5MYW5nUGF0aCB9KTtcclxuXHJcbiAgLy8gVGFiYmVkIGludGVyZmFjZVxyXG4gIHRhYnNBdXRvbG9hZC5pbml0KFRhYmJlZFVYKTtcclxuICBUYWJiZWRVWC5pbml0KCk7XHJcbiAgVGFiYmVkVVguZm9jdXNDdXJyZW50TG9jYXRpb24oKTtcclxuICBUYWJiZWRVWC5jaGVja1ZvbGF0aWxlVGFicygpO1xyXG4gIHNsaWRlclRhYnMuaW5pdChUYWJiZWRVWCk7XHJcblxyXG4gIHRhYmJlZFdpemFyZC5pbml0KFRhYmJlZFVYLCB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IGdMb2FkaW5nUmV0YXJkXHJcbiAgfSk7XHJcblxyXG4gIHRhYmJlZE5vdGlmaWNhdGlvbnMuaW5pdChUYWJiZWRVWCk7XHJcblxyXG4gIGF1dG9maWxsU3VibWVudSgpO1xyXG5cclxuICAvLyBUT0RPOiAnbG9hZEhhc2hCYW5nJyBjdXN0b20gZXZlbnQgaW4gdXNlP1xyXG4gIC8vIElmIHRoZSBoYXNoIHZhbHVlIGZvbGxvdyB0aGUgJ2hhc2ggYmFuZycgY29udmVudGlvbiwgbGV0IG90aGVyXHJcbiAgLy8gc2NyaXB0cyBkbyB0aGVpciB3b3JrIHRocm91Z2h0IGEgJ2xvYWRIYXNoQmFuZycgZXZlbnQgaGFuZGxlclxyXG4gIGlmICgvXiMhLy50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSlcclxuICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2xvYWRIYXNoQmFuZycsIHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKSk7XHJcblxyXG4gIC8vIFJlbG9hZCBidXR0b25zXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5yZWxvYWQtYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gR2VuZXJpYyBhY3Rpb24gdG8gY2FsbCBsYy5qcXVlcnkgJ3JlbG9hZCcgZnVuY3Rpb24gZnJvbSBhbiBlbGVtZW50IGluc2lkZSBpdHNlbGYuXHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgJHQuY2xvc2VzdCgkdC5kYXRhKCdyZWxvYWQtdGFyZ2V0JykpLnJlbG9hZCgpO1xyXG4gIH0pO1xyXG5cclxuICAvKiBFbmFibGUgZm9jdXMgdGFiIG9uIGV2ZXJ5IGhhc2ggY2hhbmdlLCBub3cgdGhlcmUgYXJlIHR3byBzY3JpcHRzIG1vcmUgc3BlY2lmaWMgZm9yIHRoaXM6XHJcbiAgKiBvbmUgd2hlbiBwYWdlIGxvYWQgKHdoZXJlPyksXHJcbiAgKiBhbmQgYW5vdGhlciBvbmx5IGZvciBsaW5rcyB3aXRoICd0YXJnZXQtdGFiJyBjbGFzcy5cclxuICAqIE5lZWQgYmUgc3R1ZHkgaWYgc29tZXRoaW5nIG9mIHRoZXJlIG11c3QgYmUgcmVtb3ZlZCBvciBjaGFuZ2VkLlxyXG4gICogVGhpcyBpcyBuZWVkZWQgZm9yIG90aGVyIGJlaGF2aW9ycyB0byB3b3JrLiAqL1xyXG4gIC8vIE9uIHRhcmdldC10YWIgbGlua3NcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYS50YXJnZXQtdGFiJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIoJCh0aGlzKS5hdHRyKCdocmVmJykpO1xyXG4gICAgaWYgKHRoZXJlSXNUYWIpIHtcclxuICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGhlcmVJc1RhYik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuICAvLyBPbiBoYXNoIGNoYW5nZVxyXG4gIGlmICgkLmZuLmhhc2hjaGFuZ2UpXHJcbiAgICAkKHdpbmRvdykuaGFzaGNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGlmICghL14jIS8udGVzdChsb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgICAgIHZhciB0aGVyZUlzVGFiID0gVGFiYmVkVVguZ2V0VGFiKGxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIGlmICh0aGVyZUlzVGFiKVxyXG4gICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGhlcmVJc1RhYik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAvLyBIT01FIFBBR0UgLyBTRUFSQ0ggU1RVRkZcclxuICBob21lUGFnZS5pbml0KCk7XHJcblxyXG4gIC8vIFZhbGlkYXRpb24gYXV0byBzZXR1cCBmb3IgcGFnZSByZWFkeSBhbmQgYWZ0ZXIgZXZlcnkgYWpheCByZXF1ZXN0XHJcbiAgLy8gaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBmb3JtIGluIHRoZSBwYWdlLlxyXG4gIC8vIFRoaXMgYXZvaWQgdGhlIG5lZWQgZm9yIGV2ZXJ5IHBhZ2Ugd2l0aCBmb3JtIHRvIGRvIHRoZSBzZXR1cCBpdHNlbGZcclxuICAvLyBhbG1vc3QgZm9yIG1vc3Qgb2YgdGhlIGNhc2UuXHJcbiAgZnVuY3Rpb24gYXV0b1NldHVwVmFsaWRhdGlvbigpIHtcclxuICAgIGlmICgkKGRvY3VtZW50KS5oYXMoJ2Zvcm0nKS5sZW5ndGgpXHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuc2V0dXAoJ2Zvcm0nKTtcclxuICB9XHJcbiAgYXV0b1NldHVwVmFsaWRhdGlvbigpO1xyXG4gICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShhdXRvU2V0dXBWYWxpZGF0aW9uKTtcclxuXHJcbiAgLy8gVE9ETzogdXNlZCBzb21lIHRpbWU/IHN0aWxsIHJlcXVpcmVkIHVzaW5nIG1vZHVsZXM/XHJcbiAgLypcclxuICAqIENvbW11bmljYXRlIHRoYXQgc2NyaXB0LmpzIGlzIHJlYWR5IHRvIGJlIHVzZWRcclxuICAqIGFuZCB0aGUgY29tbW9uIExDIGxpYiB0b28uXHJcbiAgKiBCb3RoIGFyZSBlbnN1cmVkIHRvIGJlIHJhaXNlZCBldmVyIGFmdGVyIHBhZ2UgaXMgcmVhZHkgdG9vLlxyXG4gICovXHJcbiAgJChkb2N1bWVudClcclxuICAgIC50cmlnZ2VyKCdsY1NjcmlwdFJlYWR5JylcclxuICAgIC50cmlnZ2VyKCdsY0xpYlJlYWR5Jyk7XHJcbn0pOyIsIu+7vy8qKioqKiBBVkFJTEFCSUxJVFkgQ0FMRU5EQVIgV0lER0VUICoqKioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuLi9MQy9zbW9vdGhCb3hCbG9jaycpLFxyXG4gICAgZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nJyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5yZWxvYWQnKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRBdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmNhbGVuZGFyLWNvbnRyb2xzIC5hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoJHQuaGFzQ2xhc3MoJ3pvb20tYWN0aW9uJykpIHtcclxuICAgICAgICAgICAgLy8gRG8gem9vbVxyXG4gICAgICAgICAgICB2YXIgYyA9ICR0LmNsb3Nlc3QoJy5hdmFpbGFiaWxpdHktY2FsZW5kYXInKS5maW5kKCcuY2FsZW5kYXInKS5jbG9uZSgpO1xyXG4gICAgICAgICAgICBjLmNzcygnZm9udC1zaXplJywgJzJweCcpO1xyXG4gICAgICAgICAgICB2YXIgdGFiID0gJHQuY2xvc2VzdCgnLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgICAgIGMuZGF0YSgncG9wdXAtY29udGFpbmVyJywgdGFiKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihjLCB0YWIsICdhdmFpbGFiaWxpdHktY2FsZW5kYXInLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAvLyBOb3RoaW5nIG1vcmVcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBOYXZpZ2F0ZSBjYWxlbmRhclxyXG4gICAgICAgIHZhciBuZXh0ID0gJHQuaGFzQ2xhc3MoJ25leHQtd2Vlay1hY3Rpb24nKTtcclxuICAgICAgICB2YXIgY29udCA9ICR0LmNsb3Nlc3QoJy5hdmFpbGFiaWxpdHktY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsY29udCA9IGNvbnQuY2hpbGRyZW4oJy5jYWxlbmRhci1jb250YWluZXInKTtcclxuICAgICAgICB2YXIgY2FsID0gY2FsY29udC5jaGlsZHJlbignLmNhbGVuZGFyJyk7XHJcbiAgICAgICAgdmFyIGNhbGluZm8gPSBjb250LmZpbmQoJy5jYWxlbmRhci1pbmZvJyk7XHJcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShjYWwuZGF0YSgnc2hvd2VkLWRhdGUnKSk7XHJcbiAgICAgICAgdmFyIHVzZXJJZCA9IGNhbC5kYXRhKCd1c2VyLWlkJyk7XHJcbiAgICAgICAgaWYgKG5leHQpXHJcbiAgICAgICAgICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpIC0gNyk7XHJcbiAgICAgICAgdmFyIHN0cmRhdGUgPSBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcoZGF0ZSk7XHJcbiAgICAgICAgdmFyIHVybCA9IGJhc2VVcmwgKyBcIlByb2ZpbGUvJEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0L1dlZWsvXCIgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyZGF0ZSkgKyBcIi8/VXNlcklEPVwiICsgdXNlcklkO1xyXG4gICAgICAgIGNhbGNvbnQucmVsb2FkKHVybCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIG5ldyBvYmplY3Q6XHJcbiAgICAgICAgICAgIHZhciBjYWwgPSAkKCcuY2FsZW5kYXInLCB0aGlzLmVsZW1lbnQpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy55ZWFyLXdlZWsnKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtd2VlaycpKTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcuZmlyc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtZmlyc3QtZGF5JykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5sYXN0LXdlZWstZGF5JykudGV4dChjYWwuZGF0YSgnc2hvd2VkLWxhc3QtZGF5JykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIu+7vy8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gRkFRcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG52YXIgZmFxc0Jhc2VVcmwgPSAnSGVscENlbnRlci8kRkFRcyc7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgZmFxc0Jhc2VVcmwgPSAoYmFzZVVybCB8fCAnLycpICsgZmFxc0Jhc2VVcmw7XHJcblxyXG4gIC8vIEVuYWJsZSBGQVFzIGxpbmtzIGluIHBvcHVwXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2FbaHJlZnw9XCIjRkFRc1wiXScsIHBvcHVwRmFxcyk7XHJcblxyXG4gIC8vIEF1dG8gb3BlbiBjdXJyZW50IGRvY3VtZW50IGxvY2F0aW9uIGlmIGhhc2ggaXMgYSBGQVEgbGlua1xyXG4gIGlmICgvXiNGQVFzL2kudGVzdChsb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgcG9wdXBGYXFzKGxvY2F0aW9uLmhhc2gpO1xyXG4gIH1cclxuXHJcbiAgLy8gcmV0dXJuIGFzIHV0aWxpdHlcclxuICByZXR1cm4gcG9wdXBGYXFzO1xyXG59O1xyXG5cclxuLyogUGFzcyBhIEZhcXMgQHVybCBvciB1c2UgYXMgYSBsaW5rIGhhbmRsZXIgdG8gb3BlbiB0aGUgRkFRIGluIGEgcG9wdXBcclxuICovXHJcbmZ1bmN0aW9uIHBvcHVwRmFxcyh1cmwpIHtcclxuICB1cmwgPSB0eXBlb2YgKHVybCkgPT09ICdzdHJpbmcnID8gdXJsIDogJCh0aGlzKS5hdHRyKCdocmVmJyk7XHJcblxyXG4gIHZhciB1cmxwYXJ0cyA9IHVybC5zcGxpdCgnLScpO1xyXG5cclxuICBpZiAodXJscGFydHNbMF0gIT0gJyNGQVFzJykge1xyXG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignVGhlIFVSTCBpcyBub3QgYSBGQVEgdXJsIChkb2VzblxcJ3Qgc3RhcnRzIHdpdGggI0ZBUXMtKScsIHVybCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHZhciB1cmxzZWN0aW9uID0gdXJscGFydHMubGVuZ3RoID4gMSA/IHVybHBhcnRzWzFdIDogJyc7XHJcblxyXG4gIGlmICh1cmxzZWN0aW9uKSB7XHJcbiAgICB2YXIgcHVwID0gcG9wdXAoZmFxc0Jhc2VVcmwgKyB1cmxzZWN0aW9uLCAnbGFyZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBkID0gJCh1cmwpLFxyXG4gICAgICAgIHBlbCA9IHB1cC5nZXRDb250ZW50RWxlbWVudCgpO1xyXG4gICAgICBwZWwuc2Nyb2xsVG9wKHBlbC5zY3JvbGxUb3AoKSArIGQucG9zaXRpb24oKS50b3AgLSA1MCk7XHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGQuZWZmZWN0KFwiaGlnaGxpZ2h0XCIsIHt9LCAyMDAwKTtcclxuICAgICAgfSwgNDAwKTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn0iLCLvu78vKiBJTklUICovXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIExvY2F0aW9uIGpzLWRyb3Bkb3duXHJcbiAgICB2YXIgcyA9ICQoJyNzZWFyY2gtbG9jYXRpb24nKTtcclxuICAgIHMucHJvcCgncmVhZG9ubHknLCB0cnVlKTtcclxuICAgIHMuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IExDLnNlYXJjaExvY2F0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgYXV0b0ZvY3VzOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBtaW5MZW5ndGg6IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIHNlbGVjdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBzLm9uKCdmb2N1cyBjbGljaycsIGZ1bmN0aW9uICgpIHsgcy5hdXRvY29tcGxldGUoJ3NlYXJjaCcsICcnKTsgfSk7XHJcblxyXG4gICAgLyogUG9zaXRpb25zIGF1dG9jb21wbGV0ZSAqL1xyXG4gICAgdmFyIHBvc2l0aW9uc0F1dG9jb21wbGV0ZSA9ICQoJyNzZWFyY2gtc2VydmljZScpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgICAgICBtaW5MZW5ndGg6IDAsXHJcbiAgICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICAgICAgIC8vJCh0aGlzKS52YWwodWkuaXRlbS5sYWJlbCk7XHJcbiAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvY3VzOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgICAgICAgLy8kKHRoaXMpLnZhbCh1aS5pdGVtLmxhYmVsKTtcclxuICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gTG9hZCBhbGwgcG9zaXRpb25zIGluIGJhY2tncm91bmQgdG8gcmVwbGFjZSB0aGUgYXV0b2NvbXBsZXRlIHNvdXJjZSAoYXZvaWRpbmcgbXVsdGlwbGUsIHNsb3cgbG9vay11cHMpXHJcbiAgICAvKiQuZ2V0SlNPTihMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgcG9zaXRpb25zQXV0b2NvbXBsZXRlLmF1dG9jb21wbGV0ZSgnb3B0aW9uJywgJ3NvdXJjZScsIGRhdGEpO1xyXG4gICAgfVxyXG4gICAgKTsqL1xyXG59OyIsIu+7vy8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gc29tZSBMZWdhbCBwYWdlcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KVxyXG4gICAgLm9uKCdjbGljaycsICcudmlldy1wcml2YWN5LXBvbGljeScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBwb3B1cChiYXNlVXJsICsgJ0hlbHBDZW50ZXIvJFByaXZhY3lQb2xpY3kvJywgJ2xhcmdlJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnLnZpZXctdGVybXMtb2YtdXNlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBvcHVwKGJhc2VVcmwgKyAnSGVscENlbnRlci8kVGVybXNPZlVzZS8nLCAnbGFyZ2UnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCLvu78vKipcclxuKiBQcm92aWRlciBXZWxjb21lIHBhZ2VcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIFNpbXBsZVNsaWRlciA9IHJlcXVpcmUoJ0xDL1NpbXBsZVNsaWRlcicpO1xyXG5cclxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24gcHJvdmlkZXJXZWxjb21lKCkge1xyXG4gICQoJy5Qcm92aWRlcldlbGNvbWUgLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24nKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciB0ID0gJCh0aGlzKSxcclxuICAgICAgc2xpZGVyID0gbmV3IFNpbXBsZVNsaWRlcih7XHJcbiAgICAgICAgZWxlbWVudDogdCxcclxuICAgICAgICBzZWxlY3RvcnM6IHtcclxuICAgICAgICAgIHNsaWRlczogJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLXNsaWRlcycsXHJcbiAgICAgICAgICBzbGlkZTogJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLXNsaWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3VycmVudFNsaWRlQ2xhc3M6ICdqcy1pc0N1cnJlbnQnLFxyXG4gICAgICAgIGhyZWZQcmVmaXg6ICdnb1NsaWRlXycsXHJcbiAgICAgICAgLy8gRHVyYXRpb24gb2YgZWFjaCBzbGlkZSBpbiBtaWxsaXNlY29uZHNcclxuICAgICAgICBkdXJhdGlvbjogMTAwMFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAvLyBTbGlkZSBzdGVwcyBhY3Rpb25zIGluaXRpYWxseSBoaWRkZW4sIHZpc2libGUgYWZ0ZXIgJ3N0YXJ0J1xyXG4gICAgdmFyIHNsaWRlc0FjdGlvbnMgPSB0LmZpbmQoJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLWFjdGlvbnMtc2xpZGVzJykuaGlkZSgpO1xyXG4gICAgdC5maW5kKCcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1hY3Rpb25zLXN0YXJ0IC5zdGFydC1hY3Rpb24nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQodGhpcykuaGlkZSgpO1xyXG4gICAgICBzbGlkZXNBY3Rpb25zLmZhZGVJbigxMDAwKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59O1xyXG4iLCLvu78vKipcclxuKiBXZWxjb21lIHBvcHVwXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIGJvb3RzdHJhcCB0b29sdGlwczpcclxucmVxdWlyZSgnYm9vdHN0cmFwJyk7XHJcbi8vVE9ETyBtb3JlIGRlcGVuZGVuY2llcz9cclxuXHJcbnZhciBpbml0aWFsaXplZCA9IGZhbHNlO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFdlbGNvbWVQb3B1cCgpIHtcclxuXHJcbiAgZXhwb3J0cy5hdXRvU2hvdygpO1xyXG5cclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYS5zaWduLXVwLCBhLnJlZ2lzdGVyLCBhLm5lZWQtbG9naW4sIGJ1dHRvbi5uZWVkLWxvZ2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gUmVtb3ZlIGFueSBvcGVuZWQgcG9wdXAgKGl0IG92ZXJsYXlzIHRoZSB3ZWxjb21lcG9wdXApXHJcbiAgICAkLnVuYmxvY2tVSSgpO1xyXG5cclxuICAgIHJldHVybiAhZXhwb3J0cy5zaG93KCk7XHJcbiAgfSk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0cy5hdXRvU2hvdyA9IGZ1bmN0aW9uIGF1dG9TaG93V2VsY29tZVBvcHVwKCkge1xyXG4gIHZhciAkd3AgPSAkKCcjd2VsY29tZXBvcHVwJyk7XHJcbiAgdmFyICR3byA9ICQoJyN3ZWxjb21lLXBvcHVwLW92ZXJsYXknKTtcclxuXHJcbiAgLy8gV2hlbiB0aGUgcG9wdXAgaXMgaW50ZWdyYXRlZCBpbiB0aGUgcGFnZSBpbnN0ZWFkIG9mXHJcbiAgLy8gdGhlIGxheW91dCwgZXhlYyBzaG93IGFuZCBjbG9zZSBvcnBoYW4gb3ZlcmxheS5cclxuICBpZiAoJHdwLmxlbmd0aCAmJlxyXG4gICAgJHdwLmlzKCc6dmlzaWJsZScpICYmXHJcbiAgICAkd3AuY2xvc2VzdCgnI3dlbGNvbWUtcG9wdXAtb3ZlcmxheScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgJHdvLmhpZGUoKTtcclxuICAgIGV4cG9ydHMuc2hvdygpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH0gZWxzZSBpZiAoJHdvLmhhc0NsYXNzKCdhdXRvLXNob3cnKSkge1xyXG4gICAgZXhwb3J0cy5zaG93KCk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24gd2VsY29tZVBvcHVwKCkge1xyXG4gICAgdmFyIGMgPSAkKCcjd2VsY29tZXBvcHVwJyk7XHJcbiAgICBpZiAoYy5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB2YXIgb3ZlcmxheSA9IGMuY2xvc2VzdCgnI3dlbGNvbWUtcG9wdXAtb3ZlcmxheScpO1xyXG4gICAgb3ZlcmxheS5mYWRlSW4oMzAwKTtcclxuXHJcbiAgICBpZiAoaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICAvLyBSZXR1cm4gcG9wdXAgdG8gdGhlIGZpcnN0IHN0ZXAgKGNob29zZSBwcm9maWxlLCAjNDg2KSBhbmQgZXhpdCAtaW5pdCBpcyByZWFkeS1cclxuICAgICAgICAvLyBTaG93IGZpcnN0IHN0ZXBcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSwgaGVhZGVyIC5wcmVzZW50YXRpb24nKS5zaG93KCk7XHJcbiAgICAgICAgLy8gSGlkZSBzZWNvbmQgc3RlcFxyXG4gICAgICAgIGMuZmluZCgnLnRlcm1zLCAucHJvZmlsZS1kYXRhJykuaGlkZSgpO1xyXG4gICAgICAgIC8vIFJlc2V0IGhpZGRlbiBmaWVsZHMgcGVyIHByb2ZpbGUtdHlwZVxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaTpub3QoLnBvc2l0aW9uLWRlc2NyaXB0aW9uKScpLnNob3coKTtcclxuICAgICAgICAvLyBSZXNldCBjaG9vc2VuIHByb2ZpbGUtdHlwZVxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV0nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICAgIC8vIFJlc2V0IFVSTHMgcGVyIHByb2ZpbGUtdHlwZVxyXG4gICAgICAgIGMuZmluZCgnYS50ZXJtcy1vZi11c2UnKS5kYXRhKCd0b29sdGlwLXVybCcsIGZ1bmN0aW9uICgpIHsgcmV0dXJuICQodGhpcykuYXR0cignZGF0YS10b29sdGlwLXVybCcpOyB9KTtcclxuICAgICAgICAvLyBSZXNldCB2YWxpZGF0aW9uIHJ1bGVzXHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpIGlucHV0Om5vdChbdHlwZT1oaWRkZW5dKScpXHJcbiAgICAgICAgLmF0dHIoJ2RhdGEtdmFsJywgbnVsbClcclxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgLy8gY2xvc2UgYnV0dG9uIGxvZ2ljIGFuZCBvbmx5IHdoZW4gYXMgcG9wdXAgKGl0IGhhcyBvdmVybGF5KVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gYy5maW5kKCcuY2xvc2UtcG9wdXAsIFtocmVmPVwiI2Nsb3NlLXBvcHVwXCJdJyk7XHJcbiAgICBpZiAob3ZlcmxheS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgY2xvc2VCdXR0b24uaGlkZSgpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGNsb3NlQnV0dG9uLnNob3coKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIG92ZXJsYXkuZmFkZU91dCgnbm9ybWFsJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB2YXIgc2tpcFN0ZXAxID0gYy5oYXNDbGFzcygnc2VsZWN0LXBvc2l0aW9uJyk7XHJcblxyXG4gICAgLy8gSW5pdFxyXG4gICAgaWYgKCFza2lwU3RlcDEpIHtcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEsIC50ZXJtcywgLnBvc2l0aW9uLWRlc2NyaXB0aW9uJykuaGlkZSgpO1xyXG4gICAgfVxyXG4gICAgYy5maW5kKCdmb3JtJykuZ2V0KDApLnJlc2V0KCk7XHJcblxyXG4gICAgLy8gRGVzY3JpcHRpb24gc2hvdy11cCBvbiBhdXRvY29tcGxldGUgdmFyaWF0aW9uc1xyXG4gICAgdmFyIHNob3dQb3NpdGlvbkRlc2NyaXB0aW9uID0ge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgIFNob3cgZGVzY3JpcHRpb24gaW4gYSB0ZXh0YXJlYSB1bmRlciB0aGUgcG9zaXRpb24gc2luZ3VsYXIsXHJcbiAgICAgICAgaXRzIHNob3dlZCBvbiBkZW1hbmQuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgdGV4dGFyZWE6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgYy5maW5kKCcucG9zaXRpb24tZGVzY3JpcHRpb24nKVxyXG4gICAgICAgICAgICAuc2xpZGVEb3duKCdmYXN0JylcclxuICAgICAgICAgICAgLmZpbmQoJ3RleHRhcmVhJykudmFsKHVpLml0ZW0uZGVzY3JpcHRpb24pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgU2hvdyBkZXNjcmlwdGlvbiBpbiBhIHRvb2x0aXAgdGhhdCBjb21lcyBmcm9tIHRoZSBwb3NpdGlvbiBzaW5ndWxhclxyXG4gICAgICAgIGZpZWxkXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgdG9vbHRpcDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAvLyBJdCBuZWVkcyB0byBiZSBkZXN0cm95ZWQgKG5vIHByb2JsZW0gdGhlIGZpcnN0IHRpbWUpXHJcbiAgICAgICAgICAgIC8vIHRvIGdldCBpdCB1cGRhdGVkIG9uIHN1Y2Nlc2l2ZSBhdHRlbXB0c1xyXG4gICAgICAgICAgICB2YXIgZWwgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICBlbFxyXG4gICAgICAgICAgICAucG9wb3ZlcignZGVzdHJveScpXHJcbiAgICAgICAgICAgIC5wb3BvdmVyKHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnRG9lcyB0aGlzIHNvdW5kIGxpa2UgeW91PycsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiB1aS5pdGVtLmRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgICAgICAgdHJpZ2dlcjogJ2ZvY3VzJyxcclxuICAgICAgICAgICAgICAgIHBsYWNlbWVudDogJ2xlZnQnXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5wb3BvdmVyKCdzaG93JylcclxuICAgICAgICAgICAgLy8gSGlkZSBvbiBwb3NzaWJsZSBwb3NpdGlvbiBuYW1lIGNoYW5nZSB0byBhdm9pZCBjb25mdXNpb25zXHJcbiAgICAgICAgICAgIC8vICh3ZSBjYW4ndCB1c2Ugb24tY2hhbmdlLCBuZWVkIHRvIGJlIGtleXByZXNzOyBpdHMgbmFtZXNwYWNlZFxyXG4gICAgICAgICAgICAvLyB0byBsZXQgb2ZmIGFuZCBvbiBldmVyeSB0aW1lIHRvIGF2b2lkIG11bHRpcGxlIGhhbmRsZXIgcmVnaXN0cmF0aW9ucylcclxuICAgICAgICAgICAgLm9mZigna2V5cHJlc3MuZGVzY3JpcHRpb24tdG9vbHRpcCcpXHJcbiAgICAgICAgICAgIC5vbigna2V5cHJlc3MuZGVzY3JpcHRpb24tdG9vbHRpcCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGVsLnBvcG92ZXIoJ2hpZGUnKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBSZS1lbmFibGUgYXV0b2NvbXBsZXRlOlxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IGMuZmluZCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7IH0sIDUwMCk7XHJcbiAgICBmdW5jdGlvbiBzZXR1cFBvc2l0aW9uQXV0b2NvbXBsZXRlKHNlbGV0Q2FsbGJhY2spIHtcclxuICAgICAgICBjLmZpbmQoJ1tuYW1lPWpvYnRpdGxlXScpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgICAgICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICAgICAgICBtaW5MZW5ndGg6IDAsXHJcbiAgICAgICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAgICAgLy8gTm8gdmFsdWUsIG5vIGFjdGlvbiA6KFxyXG4gICAgICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS52YWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgaWQgKHZhbHVlKSBpbiB0aGUgaGlkZGVuIGVsZW1lbnRcclxuICAgICAgICAgICAgICAgIGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF0nKS52YWwodWkuaXRlbS52YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgc2VsZXRDYWxsYmFjay5jYWxsKHRoaXMsIGV2ZW50LCB1aSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gV2Ugd2FudCB0byBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmb2N1czogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSB3YW50IHRoZSBsYWJlbCBpbiB0ZXh0Ym94LCBub3QgdGhlIHZhbHVlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBzZXR1cFBvc2l0aW9uQXV0b2NvbXBsZXRlKHNob3dQb3NpdGlvbkRlc2NyaXB0aW9uLnRvb2x0aXApO1xyXG4gICAgYy5maW5kKCcjd2VsY29tZXBvcHVwTG9hZGluZycpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIEFjdGlvbnNcclxuICAgIGMub24oJ2NoYW5nZScsICcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGk6bm90KC4nICsgdGhpcy52YWx1ZSArICcpJykuaGlkZSgpO1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlLCBoZWFkZXIgLnByZXNlbnRhdGlvbicpLnNsaWRlVXAoJ2Zhc3QnKTtcclxuICAgICAgICBjLmZpbmQoJy50ZXJtcywgLnByb2ZpbGUtZGF0YScpLnNsaWRlRG93bignZmFzdCcpO1xyXG4gICAgICAgIC8vIFRlcm1zIG9mIHVzZSBkaWZmZXJlbnQgZm9yIHByb2ZpbGUgdHlwZVxyXG4gICAgICAgIGlmICh0aGlzLnZhbHVlID09ICdjdXN0b21lcicpXHJcbiAgICAgICAgICAgIGMuZmluZCgnYS50ZXJtcy1vZi11c2UnKS5kYXRhKCd0b29sdGlwLXVybCcsIG51bGwpO1xyXG4gICAgICAgIC8vIENoYW5nZSBmYWNlYm9vayByZWRpcmVjdCBsaW5rXHJcbiAgICAgICAgdmFyIGZiYyA9IGMuZmluZCgnLmZhY2Vib29rLWNvbm5lY3QnKTtcclxuICAgICAgICB2YXIgYWRkUmVkaXJlY3QgPSAnY3VzdG9tZXJzJztcclxuICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSAncHJvdmlkZXInKVxyXG4gICAgICAgICAgICBhZGRSZWRpcmVjdCA9ICdwcm92aWRlcnMnO1xyXG4gICAgICAgIGZiYy5kYXRhKCdyZWRpcmVjdCcsIGZiYy5kYXRhKCdyZWRpcmVjdCcpICsgYWRkUmVkaXJlY3QpO1xyXG4gICAgICAgIGZiYy5kYXRhKCdwcm9maWxlJywgdGhpcy52YWx1ZSk7XHJcblxyXG4gICAgICAgIC8vIFNldCB2YWxpZGF0aW9uLXJlcXVpcmVkIGZvciBkZXBlbmRpbmcgb2YgcHJvZmlsZS10eXBlIGZvcm0gZWxlbWVudHM6XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpLicgKyB0aGlzLnZhbHVlICsgJyBpbnB1dDpub3QoW2RhdGEtdmFsXSk6bm90KFt0eXBlPWhpZGRlbl0pJylcclxuICAgICAgICAuYXR0cignZGF0YS12YWwtcmVxdWlyZWQnLCAnJylcclxuICAgICAgICAuYXR0cignZGF0YS12YWwnLCB0cnVlKTtcclxuICAgICAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxuICAgIH0pO1xyXG4gICAgYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNldHVwUG9zaXRpb25BdXRvY29tcGxldGUoc2hvd1Bvc2l0aW9uRGVzY3JpcHRpb24udG9vbHRpcCk7XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXTpjaGVja2VkJykuY2hhbmdlKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJZiBwcm9maWxlIHR5cGUgaXMgcHJlZmlsbGVkIGJ5IHJlcXVlc3Q6XHJcbiAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdOmNoZWNrZWQnKS5jaGFuZ2UoKTtcclxuXHJcbiAgICAvLyBBbGwgZmluZVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbn07XHJcbiIsIlxuXG4vL1xuLy8gVGhlIHNoaW1zIGluIHRoaXMgZmlsZSBhcmUgbm90IGZ1bGx5IGltcGxlbWVudGVkIHNoaW1zIGZvciB0aGUgRVM1XG4vLyBmZWF0dXJlcywgYnV0IGRvIHdvcmsgZm9yIHRoZSBwYXJ0aWN1bGFyIHVzZWNhc2VzIHRoZXJlIGlzIGluXG4vLyB0aGUgb3RoZXIgbW9kdWxlcy5cbi8vXG5cbnZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vLyBBcnJheS5pc0FycmF5IGlzIHN1cHBvcnRlZCBpbiBJRTlcbmZ1bmN0aW9uIGlzQXJyYXkoeHMpIHtcbiAgcmV0dXJuIHRvU3RyaW5nLmNhbGwoeHMpID09PSAnW29iamVjdCBBcnJheV0nO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gdHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbicgPyBBcnJheS5pc0FycmF5IDogaXNBcnJheTtcblxuLy8gQXJyYXkucHJvdG90eXBlLmluZGV4T2YgaXMgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0cy5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZih4cywgeCkge1xuICBpZiAoeHMuaW5kZXhPZikgcmV0dXJuIHhzLmluZGV4T2YoeCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoeCA9PT0geHNbaV0pIHJldHVybiBpO1xuICB9XG4gIHJldHVybiAtMTtcbn07XG5cbi8vIEFycmF5LnByb3RvdHlwZS5maWx0ZXIgaXMgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0cy5maWx0ZXIgPSBmdW5jdGlvbiBmaWx0ZXIoeHMsIGZuKSB7XG4gIGlmICh4cy5maWx0ZXIpIHJldHVybiB4cy5maWx0ZXIoZm4pO1xuICB2YXIgcmVzID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgeHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoZm4oeHNbaV0sIGksIHhzKSkgcmVzLnB1c2goeHNbaV0pO1xuICB9XG4gIHJldHVybiByZXM7XG59O1xuXG4vLyBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLmZvckVhY2ggPSBmdW5jdGlvbiBmb3JFYWNoKHhzLCBmbiwgc2VsZikge1xuICBpZiAoeHMuZm9yRWFjaCkgcmV0dXJuIHhzLmZvckVhY2goZm4sIHNlbGYpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgZm4uY2FsbChzZWxmLCB4c1tpXSwgaSwgeHMpO1xuICB9XG59O1xuXG4vLyBBcnJheS5wcm90b3R5cGUubWFwIGlzIHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydHMubWFwID0gZnVuY3Rpb24gbWFwKHhzLCBmbikge1xuICBpZiAoeHMubWFwKSByZXR1cm4geHMubWFwKGZuKTtcbiAgdmFyIG91dCA9IG5ldyBBcnJheSh4cy5sZW5ndGgpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHhzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0W2ldID0gZm4oeHNbaV0sIGksIHhzKTtcbiAgfVxuICByZXR1cm4gb3V0O1xufTtcblxuLy8gQXJyYXkucHJvdG90eXBlLnJlZHVjZSBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLnJlZHVjZSA9IGZ1bmN0aW9uIHJlZHVjZShhcnJheSwgY2FsbGJhY2ssIG9wdF9pbml0aWFsVmFsdWUpIHtcbiAgaWYgKGFycmF5LnJlZHVjZSkgcmV0dXJuIGFycmF5LnJlZHVjZShjYWxsYmFjaywgb3B0X2luaXRpYWxWYWx1ZSk7XG4gIHZhciB2YWx1ZSwgaXNWYWx1ZVNldCA9IGZhbHNlO1xuXG4gIGlmICgyIDwgYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHZhbHVlID0gb3B0X2luaXRpYWxWYWx1ZTtcbiAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgfVxuICBmb3IgKHZhciBpID0gMCwgbCA9IGFycmF5Lmxlbmd0aDsgbCA+IGk7ICsraSkge1xuICAgIGlmIChhcnJheS5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgaWYgKGlzVmFsdWVTZXQpIHtcbiAgICAgICAgdmFsdWUgPSBjYWxsYmFjayh2YWx1ZSwgYXJyYXlbaV0sIGksIGFycmF5KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB2YWx1ZSA9IGFycmF5W2ldO1xuICAgICAgICBpc1ZhbHVlU2V0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59O1xuXG4vLyBTdHJpbmcucHJvdG90eXBlLnN1YnN0ciAtIG5lZ2F0aXZlIGluZGV4IGRvbid0IHdvcmsgaW4gSUU4XG5pZiAoJ2FiJy5zdWJzdHIoLTEpICE9PSAnYicpIHtcbiAgZXhwb3J0cy5zdWJzdHIgPSBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuZ3RoKSB7XG4gICAgLy8gZGlkIHdlIGdldCBhIG5lZ2F0aXZlIHN0YXJ0LCBjYWxjdWxhdGUgaG93IG11Y2ggaXQgaXMgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzdHJpbmdcbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IHN0ci5sZW5ndGggKyBzdGFydDtcblxuICAgIC8vIGNhbGwgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uXG4gICAgcmV0dXJuIHN0ci5zdWJzdHIoc3RhcnQsIGxlbmd0aCk7XG4gIH07XG59IGVsc2Uge1xuICBleHBvcnRzLnN1YnN0ciA9IGZ1bmN0aW9uIChzdHIsIHN0YXJ0LCBsZW5ndGgpIHtcbiAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuZ3RoKTtcbiAgfTtcbn1cblxuLy8gU3RyaW5nLnByb3RvdHlwZS50cmltIGlzIHN1cHBvcnRlZCBpbiBJRTlcbmV4cG9ydHMudHJpbSA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKTtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG59O1xuXG4vLyBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCBpcyBzdXBwb3J0ZWQgaW4gSUU5XG5leHBvcnRzLmJpbmQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgdmFyIGZuID0gYXJncy5zaGlmdCgpO1xuICBpZiAoZm4uYmluZCkgcmV0dXJuIGZuLmJpbmQuYXBwbHkoZm4sIGFyZ3MpO1xuICB2YXIgc2VsZiA9IGFyZ3Muc2hpZnQoKTtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICBmbi5hcHBseShzZWxmLCBhcmdzLmNvbmNhdChbQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKV0pKTtcbiAgfTtcbn07XG5cbi8vIE9iamVjdC5jcmVhdGUgaXMgc3VwcG9ydGVkIGluIElFOVxuZnVuY3Rpb24gY3JlYXRlKHByb3RvdHlwZSwgcHJvcGVydGllcykge1xuICB2YXIgb2JqZWN0O1xuICBpZiAocHJvdG90eXBlID09PSBudWxsKSB7XG4gICAgb2JqZWN0ID0geyAnX19wcm90b19fJyA6IG51bGwgfTtcbiAgfVxuICBlbHNlIHtcbiAgICBpZiAodHlwZW9mIHByb3RvdHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICd0eXBlb2YgcHJvdG90eXBlWycgKyAodHlwZW9mIHByb3RvdHlwZSkgKyAnXSAhPSBcXCdvYmplY3RcXCcnXG4gICAgICApO1xuICAgIH1cbiAgICB2YXIgVHlwZSA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIG9iamVjdCA9IG5ldyBUeXBlKCk7XG4gICAgb2JqZWN0Ll9fcHJvdG9fXyA9IHByb3RvdHlwZTtcbiAgfVxuICBpZiAodHlwZW9mIHByb3BlcnRpZXMgIT09ICd1bmRlZmluZWQnICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMob2JqZWN0LCBwcm9wZXJ0aWVzKTtcbiAgfVxuICByZXR1cm4gb2JqZWN0O1xufVxuZXhwb3J0cy5jcmVhdGUgPSB0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJyA/IE9iamVjdC5jcmVhdGUgOiBjcmVhdGU7XG5cbi8vIE9iamVjdC5rZXlzIGFuZCBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyBpcyBzdXBwb3J0ZWQgaW4gSUU5IGhvd2V2ZXJcbi8vIHRoZXkgZG8gc2hvdyBhIGRlc2NyaXB0aW9uIGFuZCBudW1iZXIgcHJvcGVydHkgb24gRXJyb3Igb2JqZWN0c1xuZnVuY3Rpb24gbm90T2JqZWN0KG9iamVjdCkge1xuICByZXR1cm4gKCh0eXBlb2Ygb2JqZWN0ICE9IFwib2JqZWN0XCIgJiYgdHlwZW9mIG9iamVjdCAhPSBcImZ1bmN0aW9uXCIpIHx8IG9iamVjdCA9PT0gbnVsbCk7XG59XG5cbmZ1bmN0aW9uIGtleXNTaGltKG9iamVjdCkge1xuICBpZiAobm90T2JqZWN0KG9iamVjdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0LmtleXMgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSBbXTtcbiAgZm9yICh2YXIgbmFtZSBpbiBvYmplY3QpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIG5hbWUpKSB7XG4gICAgICByZXN1bHQucHVzaChuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gZ2V0T3duUHJvcGVydHlOYW1lcyBpcyBhbG1vc3QgdGhlIHNhbWUgYXMgT2JqZWN0LmtleXMgb25lIGtleSBmZWF0dXJlXG4vLyAgaXMgdGhhdCBpdCByZXR1cm5zIGhpZGRlbiBwcm9wZXJ0aWVzLCBzaW5jZSB0aGF0IGNhbid0IGJlIGltcGxlbWVudGVkLFxuLy8gIHRoaXMgZmVhdHVyZSBnZXRzIHJlZHVjZWQgc28gaXQganVzdCBzaG93cyB0aGUgbGVuZ3RoIHByb3BlcnR5IG9uIGFycmF5c1xuZnVuY3Rpb24gcHJvcGVydHlTaGltKG9iamVjdCkge1xuICBpZiAobm90T2JqZWN0KG9iamVjdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgY2FsbGVkIG9uIGEgbm9uLW9iamVjdFwiKTtcbiAgfVxuXG4gIHZhciByZXN1bHQgPSBrZXlzU2hpbShvYmplY3QpO1xuICBpZiAoZXhwb3J0cy5pc0FycmF5KG9iamVjdCkgJiYgZXhwb3J0cy5pbmRleE9mKG9iamVjdCwgJ2xlbmd0aCcpID09PSAtMSkge1xuICAgIHJlc3VsdC5wdXNoKCdsZW5ndGgnKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG52YXIga2V5cyA9IHR5cGVvZiBPYmplY3Qua2V5cyA9PT0gJ2Z1bmN0aW9uJyA/IE9iamVjdC5rZXlzIDoga2V5c1NoaW07XG52YXIgZ2V0T3duUHJvcGVydHlOYW1lcyA9IHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyA9PT0gJ2Z1bmN0aW9uJyA/XG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIDogcHJvcGVydHlTaGltO1xuXG5pZiAobmV3IEVycm9yKCkuaGFzT3duUHJvcGVydHkoJ2Rlc2NyaXB0aW9uJykpIHtcbiAgdmFyIEVSUk9SX1BST1BFUlRZX0ZJTFRFUiA9IGZ1bmN0aW9uIChvYmosIGFycmF5KSB7XG4gICAgaWYgKHRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRXJyb3JdJykge1xuICAgICAgYXJyYXkgPSBleHBvcnRzLmZpbHRlcihhcnJheSwgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09ICdkZXNjcmlwdGlvbicgJiYgbmFtZSAhPT0gJ251bWJlcicgJiYgbmFtZSAhPT0gJ21lc3NhZ2UnO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheTtcbiAgfTtcblxuICBleHBvcnRzLmtleXMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIEVSUk9SX1BST1BFUlRZX0ZJTFRFUihvYmplY3QsIGtleXMob2JqZWN0KSk7XG4gIH07XG4gIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlOYW1lcyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gRVJST1JfUFJPUEVSVFlfRklMVEVSKG9iamVjdCwgZ2V0T3duUHJvcGVydHlOYW1lcyhvYmplY3QpKTtcbiAgfTtcbn0gZWxzZSB7XG4gIGV4cG9ydHMua2V5cyA9IGtleXM7XG4gIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlOYW1lcyA9IGdldE93blByb3BlcnR5TmFtZXM7XG59XG5cbi8vIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgLSBzdXBwb3J0ZWQgaW4gSUU4IGJ1dCBvbmx5IG9uIGRvbSBlbGVtZW50c1xuZnVuY3Rpb24gdmFsdWVPYmplY3QodmFsdWUsIGtleSkge1xuICByZXR1cm4geyB2YWx1ZTogdmFsdWVba2V5XSB9O1xufVxuXG5pZiAodHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgdHJ5IHtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHsnYSc6IDF9LCAnYScpO1xuICAgIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElFOCBkb20gZWxlbWVudCBpc3N1ZSAtIHVzZSBhIHRyeSBjYXRjaCBhbmQgZGVmYXVsdCB0byB2YWx1ZU9iamVjdFxuICAgIGV4cG9ydHMuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yID0gZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZXR1cm4gdmFsdWVPYmplY3QodmFsdWUsIGtleSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufSBlbHNlIHtcbiAgZXhwb3J0cy5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IgPSB2YWx1ZU9iamVjdDtcbn1cbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCF1dGlsLmlzTnVtYmVyKG4pIHx8IG4gPCAwKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAodXRpbC5pc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAodXRpbC5pc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodXRpbC5pc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghdXRpbC5pc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgdXRpbC5pc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmICh1dGlsLmlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAodXRpbC5pc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCF1dGlsLmlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIXV0aWwuaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCF1dGlsLmlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICh1dGlsLmlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKHV0aWwuaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmICh1dGlsLmlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAodXRpbC5pc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKHV0aWwuaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTsiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIHNoaW1zID0gcmVxdWlyZSgnX3NoaW1zJyk7XG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgc2hpbXMuZm9yRWFjaChhcnJheSwgZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcyk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IHNoaW1zLmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gc2hpbXMuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cblxuICBzaGltcy5mb3JFYWNoKGtleXMsIGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IHNoaW1zLmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChzaGltcy5pbmRleE9mKGN0eC5zZWVuLCBkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gc2hpbXMucmVkdWNlKG91dHB1dCwgZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIHNoaW1zLmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmIG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmJpbmFyeVNsaWNlID09PSAnZnVuY3Rpb24nXG4gIDtcbn1cbmV4cG9ydHMuaXNCdWZmZXIgPSBpc0J1ZmZlcjtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gZnVuY3Rpb24oY3Rvciwgc3VwZXJDdG9yKSB7XG4gIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yO1xuICBjdG9yLnByb3RvdHlwZSA9IHNoaW1zLmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH1cbiAgfSk7XG59O1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gc2hpbXMua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiXG5cblxuLypcbiogQHZlcnNpb24gIDAuNS4wXG4qIEBhdXRob3IgICBMYXVyaSBSb29kZW4gLSBodHRwczovL2dpdGh1Yi5jb20vbGl0ZWpzL2RhdGUtZm9ybWF0LWxpdGVcbiogQGxpY2Vuc2UgIE1JVCBMaWNlbnNlICAtIGh0dHA6Ly9sYXVyaS5yb29kZW4uZWUvbWl0LWxpY2Vuc2UudHh0XG4qL1xuXG5cblxuIWZ1bmN0aW9uKERhdGUsIHByb3RvKSB7XG5cdHZhciBtYXNrUmUgPSAvKFtcIiddKSgoPzpbXlxcXFxdfFxcXFwuKSo/KVxcMXxZWVlZfChbTURdKVxcM1xcMyhcXDM/KXxTU3woW1lNREhobXNXXSkoXFw1Pyl8W3VVQVpTd29dL2dcblx0LCB5ZWFyRmlyc3RSZSA9IC8oXFxkezR9KVstLlxcL10oXFxkXFxkPylbLS5cXC9dKFxcZFxcZD8pL1xuXHQsIGRhdGVGaXJzdFJlID0gLyhcXGRcXGQ/KVstLlxcL10oXFxkXFxkPylbLS5cXC9dKFxcZHs0fSkvXG5cdCwgdGltZVJlID0gLyhcXGRcXGQ/KTooXFxkXFxkKTo/KFxcZFxcZCk/XFwuPyhcXGR7M30pPyg/OlxccyooPzooYSl8KHApKVxcLj9tXFwuPyk/KFxccyooPzpafEdNVHxVVEMpPyg/OihbLStdXFxkXFxkKTo/KFxcZFxcZCk/KT8pPy9pXG5cdCwgd29yZFJlID0gLy5bYS16XSsvZ1xuXHQsIHVuZXNjYXBlUmUgPSAvXFxcXCguKS9nXG5cdC8vLCBpc29EYXRlUmUgPSAvKFxcZHs0fSlbLS5cXC9dVyhcXGRcXGQ/KVstLlxcL10oXFxkKS9cblx0XG5cblx0Ly8gSVNPIDg2MDEgc3BlY2lmaWVzIG51bWVyaWMgcmVwcmVzZW50YXRpb25zIG9mIGRhdGUgYW5kIHRpbWUuXG5cdC8vXG5cdC8vIFRoZSBpbnRlcm5hdGlvbmFsIHN0YW5kYXJkIGRhdGUgbm90YXRpb24gaXNcblx0Ly8gWVlZWS1NTS1ERFxuXHQvL1xuXHQvLyBUaGUgaW50ZXJuYXRpb25hbCBzdGFuZGFyZCBub3RhdGlvbiBmb3IgdGhlIHRpbWUgb2YgZGF5IGlzXG5cdC8vIGhoOm1tOnNzXG5cdC8vXG5cdC8vIFRpbWUgem9uZVxuXHQvL1xuXHQvLyBUaGUgc3RyaW5ncyAraGg6bW0sICtoaG1tLCBvciAraGggKGFoZWFkIG9mIFVUQylcblx0Ly8gLWhoOm1tLCAtaGhtbSwgb3IgLWhoICh0aW1lIHpvbmVzIHdlc3Qgb2YgdGhlIHplcm8gbWVyaWRpYW4sIHdoaWNoIGFyZSBiZWhpbmQgVVRDKVxuXHQvL1xuXHQvLyAxMjowMFogPSAxMzowMCswMTowMCA9IDA3MDAtMDUwMFxuXHRcblx0RGF0ZVtwcm90b10uZm9ybWF0ID0gZnVuY3Rpb24obWFzaykge1xuXHRcdG1hc2sgPSBEYXRlLm1hc2tzW21hc2tdIHx8IG1hc2sgfHwgRGF0ZS5tYXNrc1tcImRlZmF1bHRcIl1cblxuXHRcdHZhciBzZWxmID0gdGhpc1xuXHRcdCwgZ2V0ID0gXCJnZXRcIiArIChtYXNrLnNsaWNlKDAsNCkgPT0gXCJVVEM6XCIgPyAobWFzaz1tYXNrLnNsaWNlKDQpLCBcIlVUQ1wiKTpcIlwiKVxuXG5cdFx0cmV0dXJuIG1hc2sucmVwbGFjZShtYXNrUmUsIGZ1bmN0aW9uKG1hdGNoLCBxdW90ZSwgdGV4dCwgTUQsIE1ENCwgc2luZ2xlLCBwYWQpIHtcblx0XHRcdHRleHQgPSBzaW5nbGUgPT0gXCJZXCIgICA/IHNlbGZbZ2V0ICsgXCJGdWxsWWVhclwiXSgpICUgMTAwXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiWVlZWVwiID8gc2VsZltnZXQgKyBcIkZ1bGxZZWFyXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwiTVwiICAgPyBzZWxmW2dldCArIFwiTW9udGhcIl0oKSsxXG5cdFx0XHRcdCA6IE1EICAgICA9PSBcIk1cIiA/IERhdGUubW9udGhOYW1lc1sgc2VsZltnZXQgKyBcIk1vbnRoXCJdKCkrKE1ENCA/IDEyIDogMCkgXVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJEXCIgICA/IHNlbGZbZ2V0ICsgXCJEYXRlXCJdKClcblx0XHRcdFx0IDogTUQgICAgID09IFwiRFwiID8gRGF0ZS5kYXlOYW1lc1sgc2VsZltnZXQgKyBcIkRheVwiXSgpICsgKE1ENCA/IDc6MCApIF1cblx0XHRcdFx0IDogc2luZ2xlID09IFwiSFwiICAgPyBzZWxmW2dldCArIFwiSG91cnNcIl0oKSAlIDEyIHx8IDEyXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcImhcIiAgID8gc2VsZltnZXQgKyBcIkhvdXJzXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwibVwiICAgPyBzZWxmW2dldCArIFwiTWludXRlc1wiXSgpXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcInNcIiAgID8gc2VsZltnZXQgKyBcIlNlY29uZHNcIl0oKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlNcIiAgICA/IHNlbGZbZ2V0ICsgXCJNaWxsaXNlY29uZHNcIl0oKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlNTXCIgICA/IChxdW90ZSA9IHNlbGZbZ2V0ICsgXCJNaWxsaXNlY29uZHNcIl0oKSwgcXVvdGUgPiA5OSA/IHF1b3RlIDogKHF1b3RlID4gOSA/IFwiMFwiIDogXCIwMFwiICkgKyBxdW90ZSlcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJ1XCIgICAgPyAoc2VsZi8xMDAwKT4+PjBcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJVXCIgICAgPyArc2VsZlxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIkFcIiAgICA/IERhdGVbc2VsZltnZXQgKyBcIkhvdXJzXCJdKCkgPiAxMSA/IFwicG1cIiA6IFwiYW1cIl1cblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJaXCIgICAgPyBcIkdNVCBcIiArICgtc2VsZi5nZXRUaW1lem9uZU9mZnNldCgpLzYwKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIndcIiAgICA/IHNlbGZbZ2V0ICsgXCJEYXlcIl0oKSB8fCA3XG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcIldcIiAgID8gKHF1b3RlID0gbmV3IERhdGUoK3NlbGYgKyAoKDQgLSAoc2VsZltnZXQgKyBcIkRheVwiXSgpfHw3KSkgKiA4NjQwMDAwMCkpLCBNYXRoLmNlaWwoKChxdW90ZS5nZXRUaW1lKCktcXVvdGVbXCJzXCIgKyBnZXQuc2xpY2UoMSkgKyBcIk1vbnRoXCJdKDAsMSkpIC8gODY0MDAwMDAgKyAxICkgLyA3KSApXG5cdFx0XHRcdCA6IG1hdGNoID09IFwib1wiICAgID8gbmV3IERhdGUoK3NlbGYgKyAoKDQgLSAoc2VsZltnZXQgKyBcIkRheVwiXSgpfHw3KSkgKiA4NjQwMDAwMCkpW2dldCArIFwiRnVsbFllYXJcIl0oKVxuXHRcdFx0XHQgOiBxdW90ZSAgICAgICAgICAgPyB0ZXh0LnJlcGxhY2UodW5lc2NhcGVSZSwgXCIkMVwiKVxuXHRcdFx0XHQgOiBtYXRjaFxuXHRcdFx0cmV0dXJuIHBhZCAmJiB0ZXh0IDwgMTAgPyBcIjBcIit0ZXh0IDogdGV4dFxuXHRcdH0pXG5cdH1cblxuXHREYXRlLmFtID0gXCJBTVwiXG5cdERhdGUucG0gPSBcIlBNXCJcblxuXHREYXRlLm1hc2tzID0ge1wiZGVmYXVsdFwiOlwiREREIE1NTSBERCBZWVlZIGhoOm1tOnNzXCIsXCJpc29VdGNEYXRlVGltZVwiOidVVEM6WVlZWS1NTS1ERFwiVFwiaGg6bW06c3NcIlpcIid9XG5cdERhdGUubW9udGhOYW1lcyA9IFwiSmFuRmViTWFyQXByTWF5SnVuSnVsQXVnU2VwT2N0Tm92RGVjSmFudWFyeUZlYnJ1YXJ5TWFyY2hBcHJpbE1heUp1bmVKdWx5QXVndXN0U2VwdGVtYmVyT2N0b2Jlck5vdmVtYmVyRGVjZW1iZXJcIi5tYXRjaCh3b3JkUmUpXG5cdERhdGUuZGF5TmFtZXMgPSBcIlN1bk1vblR1ZVdlZFRodUZyaVNhdFN1bmRheU1vbmRheVR1ZXNkYXlXZWRuZXNkYXlUaHVyc2RheUZyaWRheVNhdHVyZGF5XCIubWF0Y2god29yZFJlKVxuXG5cdC8vKi9cblxuXG5cdC8qXG5cdCogLy8gSW4gQ2hyb21lIERhdGUucGFyc2UoXCIwMS4wMi4yMDAxXCIpIGlzIEphblxuXHQqIG4gPSArc2VsZiB8fCBEYXRlLnBhcnNlKHNlbGYpIHx8IFwiXCIrc2VsZjtcblx0Ki9cblxuXHRTdHJpbmdbcHJvdG9dLmRhdGUgPSBOdW1iZXJbcHJvdG9dLmRhdGUgPSBmdW5jdGlvbihmb3JtYXQpIHtcblx0XHR2YXIgbSwgdGVtcFxuXHRcdCwgZCA9IG5ldyBEYXRlXG5cdFx0LCBuID0gK3RoaXMgfHwgXCJcIit0aGlzXG5cblx0XHRpZiAoaXNOYU4obikpIHtcblx0XHRcdC8vIEJpZyBlbmRpYW4gZGF0ZSwgc3RhcnRpbmcgd2l0aCB0aGUgeWVhciwgZWcuIDIwMTEtMDEtMzFcblx0XHRcdGlmIChtID0gbi5tYXRjaCh5ZWFyRmlyc3RSZSkpIGQuc2V0RnVsbFllYXIobVsxXSwgbVsyXS0xLCBtWzNdKVxuXG5cdFx0XHRlbHNlIGlmIChtID0gbi5tYXRjaChkYXRlRmlyc3RSZSkpIHtcblx0XHRcdFx0Ly8gTWlkZGxlIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSBtb250aCwgZWcuIDAxLzMxLzIwMTFcblx0XHRcdFx0Ly8gTGl0dGxlIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSBkYXksIGVnLiAzMS4wMS4yMDExXG5cdFx0XHRcdHRlbXAgPSBEYXRlLm1pZGRsZV9lbmRpYW4gPyAxIDogMlxuXHRcdFx0XHRkLnNldEZ1bGxZZWFyKG1bM10sIG1bdGVtcF0tMSwgbVszLXRlbXBdKVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBUaW1lXG5cdFx0XHRtID0gbi5tYXRjaCh0aW1lUmUpIHx8IFswLCAwLCAwXVxuXHRcdFx0ZC5zZXRIb3VycyggbVs2XSAmJiBtWzFdIDwgMTIgPyArbVsxXSsxMiA6IG1bNV0gJiYgbVsxXSA9PSAxMiA/IDAgOiBtWzFdLCBtWzJdLCBtWzNdfDAsIG1bNF18MClcblx0XHRcdC8vIFRpbWV6b25lXG5cdFx0XHRpZiAobVs3XSkge1xuXHRcdFx0XHRkLnNldFRpbWUoZC0oKGQuZ2V0VGltZXpvbmVPZmZzZXQoKSArIChtWzhdfDApKjYwICsgKChtWzhdPDA/LTE6MSkqKG1bOV18MCkpKSo2MDAwMCkpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGQuc2V0VGltZSggbiA8IDQyOTQ5NjcyOTYgPyBuICogMTAwMCA6IG4gKVxuXHRcdHJldHVybiBmb3JtYXQgPyBkLmZvcm1hdChmb3JtYXQpIDogZFxuXHR9XG5cbn0oRGF0ZSwgXCJwcm90b3R5cGVcIilcblxuXG5cblxuIl19
;