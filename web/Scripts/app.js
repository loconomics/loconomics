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
},{"./Component":3,"./DataSource":4,"./extend":6,"events":104}],3:[function(require,module,exports){
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
},{"./LcUrl":11,"./blockPresets":50,"./loader":78,"./popup":84,"./redirectTo":86}],10:[function(require,module,exports){
/*global document*/
/**
    HelpPoint Popover #559
**/
var $ = require('jquery');
require('bootstrap');

function HelpPoint(element) {

    var $el = $(element);

    $el
    .popover({
        container: 'body'
    })
    .filter('a[href="#"]').on('click', function (e) {
        // Avoid navigate to the link, when implemented
        // like an internal link with nothing
        e.preventDefault();
    });

    return $el;
}

exports.HelpPoint = HelpPoint;

HelpPoint.enableAll = function enableAll(inContainer) {

    $(inContainer || document).find('.HelpPoint').toArray().forEach(HelpPoint);
};

},{}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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
},{"./mathUtils":79}],13:[function(require,module,exports){
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
},{"./RegExp.quote":13}],16:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
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
},{"./jquery.reload":74}],20:[function(require,module,exports){
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

},{"./changesNotification":"bQChrF","./smoothBoxBlock":"TinZqq"}],21:[function(require,module,exports){
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
},{"./jquery.hasScrollBar":71}],22:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
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
},{"./ajaxCallbacks":"g22qGq","./blockPresets":50,"./changesNotification":"bQChrF","./popup":84,"./redirectTo":86,"./validationHelper":"UpLaI0"}],"BE/3cj":[function(require,module,exports){
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

},{"./TimeSpan":"BE/3cj","./mathUtils":79}],28:[function(require,module,exports){
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

},{"./TimeSpan":"BE/3cj","./mathUtils":79,"./tooltips":"3mmOyL"}],"g22qGq":[function(require,module,exports){
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
},{"./changesNotification":"bQChrF","./createIframe":53,"./moveFocusTo":"lyuNFv","./popup":84,"./redirectTo":86,"./smoothBoxBlock":"TinZqq","./validationHelper":"UpLaI0"}],"LC/ajaxCallbacks":[function(require,module,exports){
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

},{"./ajaxCallbacks":"g22qGq","./blockPresets":50,"./changesNotification":"bQChrF","./getXPath":62,"./validationHelper":"UpLaI0"}],"LC/ajaxForms":[function(require,module,exports){
module.exports=require('0NFXny');
},{}],33:[function(require,module,exports){
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
},{"./numberUtils":82}],34:[function(require,module,exports){
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
},{}],35:[function(require,module,exports){
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
},{}],36:[function(require,module,exports){
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
},{"./objectUtils":46,"LC/dateISO8601":"rgrJsD","date-format-lite":103}],37:[function(require,module,exports){
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

},{"../CX/LcWidget":5,"../CX/extend":6,"./BookingsNotification":36,"./objectUtils":46,"./utils":47,"LC/dateISO8601":"rgrJsD"}],38:[function(require,module,exports){
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

},{"../CX/LcWidget":5,"../CX/extend":6,"./utils":47,"LC/dateISO8601":"rgrJsD"}],39:[function(require,module,exports){
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
},{"../CX/LcWidget":5,"../CX/extend":6,"../jquery.bounds":70,"./clearCurrentSelection":40,"./makeUnselectable":45,"./utils":47,"LC/dateISO8601":"rgrJsD"}],40:[function(require,module,exports){
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
},{}],41:[function(require,module,exports){
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

},{"LC/dateISO8601":"rgrJsD"}],42:[function(require,module,exports){
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
},{"./Monthly":37,"./Weekly":38,"./WorkHours":39}],"LC/availabilityCalendar":[function(require,module,exports){
module.exports=require('qcqtAx');
},{}],45:[function(require,module,exports){
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
},{}],46:[function(require,module,exports){
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
},{}],47:[function(require,module,exports){
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

},{"./dateUtils":41,"./formatDate":42,"LC/dateISO8601":"rgrJsD"}],"LC/batchEventHandler":[function(require,module,exports){
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
},{}],50:[function(require,module,exports){
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
},{"./getXPath":62,"./jqueryUtils":"iWea/N"}],53:[function(require,module,exports){
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


},{}],54:[function(require,module,exports){
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

},{"./changesNotification":"bQChrF","./getText":"B9HwAX","./jquery.xtsh":75,"./moveFocusTo":"lyuNFv","./smoothBoxBlock":"TinZqq"}],"LC/dateISO8601":[function(require,module,exports){
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
},{}],57:[function(require,module,exports){
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

},{}],58:[function(require,module,exports){
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
},{}],59:[function(require,module,exports){
/*global window*/
/**
    Simplifing some uses of the Facebook API
    and the loading of its API with a 'ready' function.

    Official API: https://developers.facebook.com/docs/facebook-login/login-flow-for-web/v2.1
**/

var loader = require('./loader'),
    $ = require('jquery');

// Facebook API settings gathered from the current page
// on first use:
var settings = {
    language: 'en-US',
    appId: null
};

// Private API loading/ready status
var apiStatus = {
    ready: false,
    loading: false,
    // Private static collection of callbacks registered
    stack: []
};

/**
    Register a callback to be executed when the
    Facebook API is ready.
    The callback receives as unique parameter
    the Facebook API object ('FB')
**/
exports.ready = function facebookReady(readyCallback) {
    
    apiStatus.stack.push(readyCallback);

    if (apiStatus.ready) {
        // Double-check the callback, since 'read'
        // could be loaded just to force the API pre-load
        if (typeof(readyCallback) === 'function')
            readyCallback(window.FB);
    }
    else if (!facebookReady.isLoading) {
        apiStatus.loading = true;

        // Get settings from page attributes
        settings.language = $('[data-facebook-language]').data('facebook-language');
        settings.appId = $('[data-facebook-appid]').data('facebook-appid');

        loader.load({
            scripts: ['//connect.facebook.net/' + settings.language + '/all.js'],
            completeVerification: function () { return !!window.FB; },
            complete: function () {
                // Initialize (Facebook registers itself as global 'FB')
                window.FB.init({ appId: settings.appId, status: true, cookie: true, xfbml: false });

                // Is ready
                apiStatus.ready = true;
                apiStatus.loading = false;

                // Execute callbacks in the stack:
                for (var i = 0; i < apiStatus.stack.length; i++) {
                    try {
                        apiStatus.stack[i](window.FB);
                    } catch (e) { }
                }
            }
        });
    }
};

/**
    Request a Facebook Login, executing the success
    or error callback depending on the response.
    Success gets the 'authResponse' given by Facebook,
    and error the whole response object, and both
    the FB API as second parameter.
**/
exports.login = function facebookLogin(options, success, error) {
    // When the API is ready
    exports.ready(function (FB) {
        // When Facebook gives a response to the following
        // Login Request
        FB.login(function (response) {
            // status==connected if there is an authResponse
            if (response.authResponse &&
                typeof (success) === 'function') {
                success(response.authResponse, FB);
            }
            else if (typeof (error) === 'function') {
                error(response, FB);
            }
        }, options);
    });
};

},{"./loader":78}],"LC/getText":[function(require,module,exports){
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
},{"./jqueryUtils":"iWea/N"}],62:[function(require,module,exports){
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

},{"./loader":78}],65:[function(require,module,exports){
/* GUID Generator
 */
module.exports = function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
},{}],66:[function(require,module,exports){
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
},{}],67:[function(require,module,exports){
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
},{}],68:[function(require,module,exports){
/* Returns true when str is
- null
- empty string
- only white spaces string
*/
module.exports = function isEmptyString(str) {
    return !(/\S/g.test(str || ""));
};
},{}],69:[function(require,module,exports){
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
},{}],70:[function(require,module,exports){
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
},{}],71:[function(require,module,exports){
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
},{}],72:[function(require,module,exports){
/** Checks if current element or one of the current set of elements has
a parent that match the element or expression given as first parameter
**/
var $ = jQuery || require('jquery');
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};
},{}],73:[function(require,module,exports){
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
},{}],74:[function(require,module,exports){
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
},{"./smoothBoxBlock":"TinZqq"}],75:[function(require,module,exports){
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

},{}],78:[function(require,module,exports){
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
},{}],79:[function(require,module,exports){
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
},{}],82:[function(require,module,exports){
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
},{"./i18n":67,"./mathUtils":79}],83:[function(require,module,exports){
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
},{}],84:[function(require,module,exports){
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
},{"./createIframe":53,"./moveFocusTo":"lyuNFv","./smoothBoxBlock":"TinZqq"}],85:[function(require,module,exports){
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
},{}],86:[function(require,module,exports){
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

},{}],87:[function(require,module,exports){
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
},{"./autoFocus":34,"./jquery.xtsh":75,"./jqueryUtils":"iWea/N","./moveFocusTo":"lyuNFv"}],"LC/smoothBoxBlock":[function(require,module,exports){
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

},{"./jquery.isChildOf":72,"./jquery.outerHtml":73,"./sanitizeWhitespaces":87}],"LC/tooltips":[function(require,module,exports){
module.exports=require('3mmOyL');
},{}],92:[function(require,module,exports){
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
},{}],95:[function(require,module,exports){
/**
    Enable the use of popups to show links to some Account pages (default links behavior is to open in a new tab)
**/
var $ = require('jquery');
require('jquery.blockUI');

exports.enable = function (baseUrl) {
    $(document)
    .on('click', 'a.login', function () {
        var url = baseUrl + 'Account/$Login/?ReturnUrl=' + encodeURIComponent(window.location);
        popup(url, { width: 410, height: 320 }, null, null, { autoFocus: false });
        return false;
    })
    .on('click', 'a.forgot-password', function () {
        var url = this.getAttribute('href').replace('/Account/ForgotPassword', '/Account/$ForgotPassword');
        popup(url, { width: 400, height: 240 }, null, null, { autoFocus: false });
        return false;
    })
    .on('click', 'a.change-password', function () {
        var url = this.getAttribute('href').replace('/Account/ChangePassword', '/Account/$ChangePassword');
        popup(url, { width: 450, height: 340 }, null, null, { autoFocus: false });
        return false;
    });
};
},{}],96:[function(require,module,exports){
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

var HelpPoint = require('../LC/HelpPoint').HelpPoint;

// Global access to the Facebook API utils to be used by
// pages and page-components; any javascript module must
// require it instead.
window.facebookUtils = require('../LC/facebookUtils');

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

    HelpPoint.enableAll(document);

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
},{"../LC/Array.remove":1,"../LC/Cookie":7,"../LC/HelpPoint":10,"../LC/LcUrl":11,"../LC/Price":12,"../LC/String.prototype.contains":16,"../LC/StringFormat":"NBNrUh","../LC/TabbedUX":21,"../LC/TabbedUX.autoload":19,"../LC/TabbedUX.changesNotification":20,"../LC/TabbedUX.sliderTabs":22,"../LC/TabbedUX.wizard":23,"../LC/TimeSpan":"BE/3cj","../LC/TimeSpanExtra":"so8zgW","../LC/UISliderLabels":28,"../LC/ajaxCallbacks":"g22qGq","../LC/ajaxForms":"0NFXny","../LC/autoCalculate":33,"../LC/autoFocus":34,"../LC/autofillSubmenu":35,"../LC/availabilityCalendar":"qcqtAx","../LC/blockPresets":50,"../LC/changesNotification":"bQChrF","../LC/crudl":54,"../LC/datePicker":57,"../LC/dateToInterchangeableString":58,"../LC/facebookUtils":59,"../LC/getText":"B9HwAX","../LC/getXPath":62,"../LC/googleMapReady":"TPQyHE","../LC/guidGenerator":65,"../LC/hasConfirmSupport":66,"../LC/i18n":67,"../LC/isEmptyString":68,"../LC/jquery.are":69,"../LC/jquery.hasScrollBar":71,"../LC/jquery.reload":74,"../LC/jquery.xtsh":75,"../LC/jqueryUtils":"iWea/N","../LC/loader":78,"../LC/mathUtils":79,"../LC/moveFocusTo":"lyuNFv","../LC/numberUtils":82,"../LC/placeholder-polyfill":83,"../LC/popup":84,"../LC/postalCodeServerValidation":85,"../LC/sanitizeWhitespaces":87,"../LC/smoothBoxBlock":"TinZqq","../LC/tooltips":"3mmOyL","../LC/urlUtils":92,"../LC/validationHelper":"UpLaI0","./accountPopups":95,"./availabilityCalendarWidget":97,"./faqsPopups":98,"./home":99,"./legalPopups":100,"./providerWelcome":101,"./welcomePopup":102}],97:[function(require,module,exports){
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
},{"../LC/dateToInterchangeableString":58,"../LC/jquery.reload":74,"../LC/smoothBoxBlock":"TinZqq"}],98:[function(require,module,exports){
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
},{}],99:[function(require,module,exports){
/* INIT */
exports.init = function () {
    // Location js-dropdown
    var s = $('#search-location');
    s.prop('readonly', true);
    s.autocomplete({
        source: LC.searchLocations,
        autoFocus: true,
        minLength: 0,
        select: function () {
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
},{}],100:[function(require,module,exports){
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
},{}],101:[function(require,module,exports){
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

},{"LC/SimpleSlider":"BhQbxR"}],102:[function(require,module,exports){
/**
* Welcome popup
*/
var $ = require('jquery');
// bootstrap tooltips:
require('bootstrap');
var Cookie = require('../LC/Cookie');
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
    exports.show(true);
    return;
  } else if ($wo.hasClass('auto-show')) {
    exports.show(true);
  }
};

exports.initPopup = function initPopup() {

    var c = $('#welcomepopup');
    if (c.length === 0) return false;

    var overlay = c.closest('#welcome-popup-overlay');

    if (c.data('is-initialized')) return overlay;

    /**
    Go to the first step on a already initialized popup
    **/
    function startAgain(animate) {
        // Return popup to the first step (choose profile, #486) and exit -init is ready-
        // Show first step
        var step1 = c.find('.profile-choice, header .presentation');
        if (animate)
            step1.slideDown('normal');
        else
            step1.show();
        // Hide second step
        var step2 = c.find('.terms, .profile-data');
        if (animate)
            step2.slideUp('normal');
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
            Cookie.set('WelcomePopupVisible', 'false');
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
    function showStep2(animate) {

        var $profile = c.find('.profile-choice [name=profile-type]:checked');
        var profile = $profile.val();

        // Show back-action button
        c.find('.back-action').show();

        c.find('.profile-data li:not(.' + profile + ')').hide();
        var $presentation = c.find('.profile-choice, header .presentation');
        if (animate)
            $presentation.slideUp('normal');
        else
            $presentation.hide();

        var $profData = c.find('.terms, .profile-data');
        if (animate)
            $profData.slideDown('normal');
        else
            $profData.show();

        // Terms of use different for profile type
        if (profile == 'customer')
            c.find('a.terms-of-use').data('tooltip-url', null);
        // Change facebook redirect link
        var fbc = c.find('.facebook-connect');
        var addRedirect = 'customers';
        if (profile == 'provider')
            addRedirect = 'providers';
        fbc.data('redirect', fbc.data('redirect') + addRedirect);
        fbc.data('profile', profile);

        // Set validation-required for depending of profile-type form elements:
        c.find('.profile-data li.' + profile + ' input:not([data-val]):not([type=hidden])')
        .attr('data-val-required', '')
        .attr('data-val', true);

        // if Facebook Connect is in use, update fields and validations
        facebookUpdateFieldsStatus(c);

        LC.setupValidation();
    }
    c.on('change', '.profile-choice [name=profile-type]', showStep2.bind(null, true));
    c.on('ajaxFormReturnedHtml', 'form.ajax', function () {
        setupPositionAutocomplete(showPositionDescription.tooltip);
        showStep2(false);
    });

    // If profile type is prefilled by request, show step2 already:
    if (c.find('.profile-choice [name=profile-type]:checked').length)
        showStep2(false);

    c.on('click', '.facebook-connect', facebookConnect.bind(null, c));

    c.data('is-initialized', true);
    return overlay;
};

exports.show = function showPopup(fromAutoShow) {

    var overlay = exports.initPopup();

    if (overlay && overlay.length) {
        // Its a cookie was set to remember the popup was closed
        // (because was closable), avoid to show it
        if (!fromAutoShow ||
            Cookie.get('WelcomePopupVisible') !== 'false') {
            overlay.fadeIn(300);
        }

        // All fine
        return true;
    }
    else return false;
};

/**
    Attempt to login with Facebook Connect, 
    and fill the form with the data from Facebook
**/
function facebookConnect($container) {
    var fb = require('../LC/facebookUtils');

    fb.login({ scope: 'email,user_about_me' }, function (auth, FB) {
        // Set FacebookId to link accounts:
        $container.find('[name="facebookid"]').val(auth.userID);
        // Request more user data
        FB.api('/me', function (user) {
            //Fill Data
            $container.find('[name="email"]').val(user.email);
            $container.find('[name="firstname"]').val(user.first_name);
            $container.find('[name="lastname"]').val(user.last_name);
            $container.find('[name="gender"]').val(user.gender);
            $container.find('[name="about"]').val(user.about);

            facebookUpdateFieldsStatus($container);
        });
    });

    return false;
}

/**
    It triggers an update on the status of fields affected
    by a Facebook Connect: some must be hidden, others showed,
    some notes appear and some field becomes optional.
    If there is no an active Facebook Connection/Id, it
    does nothing and return false.
**/
function facebookUpdateFieldsStatus($container) {

    // if Facebook Connect is in use
    if ($container.find('[name="facebookid"]').val()) {
        // remove validation on password
        $container.find('[name="create-password"]')
            .attr('data-val-required', null)
            .attr('data-val', false);

        var femail = $container.find('[name="email"]');
        var ffirst = $container.find('[name="firstname"]');
        var flast = $container.find('[name="lasttname"]');

        // Hide data successfully filled
        if (ffirst.val())
            ffirst.closest('li').hide();
        if (flast.val())
            flast.closest('li').hide();

        // Email is special, requires confirmation #538,
        // showing additional message,
        femail.siblings('.facebook-note').show();

        // Message to notified user is connected with Facebook
        $container.find('.facebook-logged').show();
        // and hidding the button
        $container.find('.facebook-connect').hide();

        // Password is special too, no needed with Facebook
        $container.find('[name="create-password"]').closest('li').hide();

        return true;
    }
    return false;
}
},{"../LC/Cookie":7,"../LC/facebookUtils":59}],103:[function(require,module,exports){



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





},{}],104:[function(require,module,exports){
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

},{}]},{},[96,"4b8n5S","rgrJsD","BhQbxR"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQXJyYXkucmVtb3ZlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0JpbmRhYmxlQ29tcG9uZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0NvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9EYXRhU291cmNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0xjV2lkZ2V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL2V4dGVuZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9Db29raWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvRmFjZWJvb2tDb25uZWN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0hlbHBQb2ludC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9MY1VybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9QcmljZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9SZWdFeHAucXVvdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU2ltcGxlU2xpZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nRm9ybWF0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmF1dG9sb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguc2xpZGVyVGFicy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC53aXphcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW5FeHRyYS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9VSVNsaWRlckxhYmVscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Q2FsbGJhY2tzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhGb3Jtcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvQ2FsY3VsYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9Gb2N1cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvZmlsbFN1Ym1lbnUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvQm9va2luZ3NOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvTW9udGhseS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9XZWVrbHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvV29ya0hvdXJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2NsZWFyQ3VycmVudFNlbGVjdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9kYXRlVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvZm9ybWF0RGF0ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9tYWtlVW5zZWxlY3RhYmxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL29iamVjdFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL3V0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2JhdGNoRXZlbnRIYW5kbGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2Jsb2NrUHJlc2V0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NyZWF0ZUlmcmFtZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlSVNPODYwMS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9mYWNlYm9va1V0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFRleHQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ29vZ2xlTWFwUmVhZHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ3VpZEdlbmVyYXRvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9oYXNDb25maXJtU3VwcG9ydC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pMThuLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2lzRW1wdHlTdHJpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmFyZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuYm91bmRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmlzQ2hpbGRPZi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkub3V0ZXJIdG1sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5yZWxvYWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL21hdGhVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tb3ZlRm9jdXNUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9udW1iZXJVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3B1cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9yZWRpcmVjdFRvLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9vbHRpcHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdXJsVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYWNjb3VudFBvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZmFxc1BvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvaG9tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvbGVnYWxQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3Byb3ZpZGVyV2VsY29tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvd2VsY29tZVBvcHVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvZGF0ZS1mb3JtYXQtbGl0ZS9kYXRlLWZvcm1hdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9VQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBcnJheSBSZW1vdmUgLSBCeSBKb2huIFJlc2lnIChNSVQgTGljZW5zZWQpXHJcbi8qQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xyXG5JYWdvU1JMOiBpdCBzZWVtcyBpbmNvbXBhdGlibGUgd2l0aCBNb2Rlcm5penIgbG9hZGVyIGZlYXR1cmUgbG9hZGluZyBaZW5kZXNrIHNjcmlwdCxcclxubW92ZWQgZnJvbSBwcm90b3R5cGUgdG8gYSBjbGFzcy1zdGF0aWMgbWV0aG9kICovXHJcbmZ1bmN0aW9uIGFycmF5UmVtb3ZlKGFuQXJyYXksIGZyb20sIHRvKSB7XHJcbiAgICB2YXIgcmVzdCA9IGFuQXJyYXkuc2xpY2UoKHRvIHx8IGZyb20pICsgMSB8fCBhbkFycmF5Lmxlbmd0aCk7XHJcbiAgICBhbkFycmF5Lmxlbmd0aCA9IGZyb20gPCAwID8gYW5BcnJheS5sZW5ndGggKyBmcm9tIDogZnJvbTtcclxuICAgIHJldHVybiBhbkFycmF5LnB1c2guYXBwbHkoYW5BcnJheSwgcmVzdCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhcnJheVJlbW92ZTtcclxufSBlbHNlIHtcclxuICAgIEFycmF5LnJlbW92ZSA9IGFycmF5UmVtb3ZlO1xyXG59IiwiLyoqXHJcbiAgQmluZGFibGUgVUkgQ29tcG9uZW50LlxyXG4gIEl0IHJlbGllcyBvbiBDb21wb25lbnQgYnV0IGFkZHMgRGF0YVNvdXJjZSBjYXBhYmlsaXRpZXNcclxuKiovXHJcbnZhciBEYXRhU291cmNlID0gcmVxdWlyZSgnLi9EYXRhU291cmNlJyk7XHJcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKCcuL0NvbXBvbmVudCcpO1xyXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKTtcclxudmFyIG1ldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcclxuXHJcbi8qKlxyXG5SZXVzaW5nIHRoZSBvcmlnaW5hbCBmZXRjaERhdGEgbWV0aG9kIGJ1dCBhZGRpbmcgY2xhc3NlcyB0byBvdXJcclxuY29tcG9uZW50IGVsZW1lbnQgZm9yIGFueSB2aXN1YWwgbm90aWZpY2F0aW9uIG9mIHRoZSBkYXRhIGxvYWRpbmcuXHJcbk1ldGhvZCBnZXQgZXh0ZW5kZWQgd2l0aCBpc1ByZWZldGNoaW5nIG1ldGhvZCBmb3IgZGlmZmVyZW50XHJcbmNsYXNzZXMvbm90aWZpY2F0aW9ucyBkZXBlbmRhbnQgb24gdGhhdCBmbGFnLCBieSBkZWZhdWx0IGZhbHNlOlxyXG4qKi9cclxudmFyIGNvbXBvbmVudEZldGNoRGF0YSA9IGZ1bmN0aW9uIGJpbmRhYmxlQ29tcG9uZW50RmV0Y2hEYXRhKHF1ZXJ5RGF0YSwgbW9kZSwgaXNQcmVmZXRjaGluZykge1xyXG4gIHZhciBjbCA9IGlzUHJlZmV0Y2hpbmcgPyB0aGlzLmNsYXNzZXMucHJlZmV0Y2hpbmcgOiB0aGlzLmNsYXNzZXMuZmV0Y2hpbmc7XHJcbiAgdGhpcy4kZWwuYWRkQ2xhc3MoY2wpO1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdmFyIHJlcSA9IERhdGFTb3VyY2UucHJvdG90eXBlLmZldGNoRGF0YS5jYWxsKHRoaXMsIHF1ZXJ5RGF0YSwgbW9kZSlcclxuICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LiRlbC5yZW1vdmVDbGFzcyhjbCB8fCAnXycpO1xyXG4gICAgLy8gVW5tYXJrIGFueSBwb3NpYmxlIHByZXZpb3VzIGVycm9yIHNpbmNlIHdlIGhhZCBhIHN1Y2NlcyBsb2FkOlxyXG4gICAgdGhhdC5oYXNFcnJvcihmYWxzZSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiByZXE7XHJcbn07XHJcbi8qKlxyXG5SZXBsYWNpbmcsIGJ1dCByZXVzaW5nIGludGVybmFscywgdGhlIGRlZmF1bHQgb25lcnJvciBjYWxsYmFjayBmb3IgdGhlXHJcbmZldGNoRGF0YSBmdW5jdGlvbiB0byBhZGQgbm90aWZpY2F0aW9uIGNsYXNzZXMgdG8gb3VyIGNvbXBvbmVudCBtb2RlbFxyXG4qKi9cclxuY29tcG9uZW50RmV0Y2hEYXRhLm9uZXJyb3IgPSBmdW5jdGlvbiBiaW5kYWJsZUNvbXBvbmVudEZlY2hEYXRhT25lcnJvcih4LCBzLCBlKSB7XHJcbiAgRGF0YVNvdXJjZS5wcm90b3R5cGUuZmV0Y2hEYXRhLm9uZXJyb3IuY2FsbCh0aGlzLCB4LCBzLCBlKTtcclxuICAvLyBSZW1vdmUgZmV0Y2hpbmcgY2xhc3NlczpcclxuICB0aGlzLiRlbFxyXG4gIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKVxyXG4gIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMucHJlZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAvLyBNYXJrIGVycm9yOlxyXG4gIHRoaXMuaGFzRXJyb3IoeyBuYW1lOiAnZmV0Y2hEYXRhRXJyb3InLCByZXF1ZXN0OiB4LCBzdGF0dXM6IHMsIGV4Y2VwdGlvbjogZSB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gIEJpbmRhYmxlQ29tcG9uZW50IGNsYXNzXHJcbioqL1xyXG52YXIgQmluZGFibGVDb21wb25lbnQgPSBDb21wb25lbnQuZXh0ZW5kKFxyXG4gIERhdGFTb3VyY2UucHJvdG90eXBlLFxyXG4gIC8vIFByb3RvdHlwZVxyXG4gIHtcclxuICAgIGNsYXNzZXM6IHtcclxuICAgICAgZmV0Y2hpbmc6ICdpcy1sb2FkaW5nJyxcclxuICAgICAgcHJlZmV0Y2hpbmc6ICdpcy1wcmVsb2FkaW5nJyxcclxuICAgICAgZGlzYWJsZWQ6ICdpcy1kaXNhYmxlZCcsXHJcbiAgICAgIGhhc0RhdGFFcnJvcjogJ2hhcy1kYXRhRXJyb3InXHJcbiAgICB9LFxyXG4gICAgZmV0Y2hEYXRhOiBjb21wb25lbnRGZXRjaERhdGEsXHJcbiAgICAvLyBXaGF0IGF0dHJpYnV0ZSBuYW1lIHVzZSB0byBtYXJrIGVsZW1lbnRzIGluc2lkZSB0aGUgY29tcG9uZW50XHJcbiAgICAvLyB3aXRoIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBzb3VyY2UgdG8gYmluZC5cclxuICAgIC8vIFRoZSBwcmVmaXggJ2RhdGEtJyBpbiBjdXN0b20gYXR0cmlidXRlcyBpcyByZXF1aXJlZCBieSBodG1sNSxcclxuICAgIC8vIGp1c3Qgc3BlY2lmeSB0aGUgc2Vjb25kIHBhcnQsIGJlaW5nICdiaW5kJyB0aGUgYXR0cmlidXRlXHJcbiAgICAvLyBuYW1lIHRvIHVzZSBpcyAnZGF0YS1iaW5kJ1xyXG4gICAgZGF0YUJpbmRBdHRyaWJ1dGU6ICdiaW5kJyxcclxuICAgIC8vIERlZmF1bHQgYmluZERhdGEgaW1wbGVtZW50YXRpb24sIGNhbiBiZSByZXBsYWNlIG9uIGV4dGVuZGVkIGNvbXBvbmVudHNcclxuICAgIC8vIHRvIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggKGxpc3QvY29sbGVjdGlvbnMsIHN1Yi1vYmplY3RzLCBjdXN0b20gc3RydWN0dXJlc1xyXG4gICAgLy8gYW5kIHZpc3VhbGl6YXRpb24gLS1rZWVwIGFzIHBvc3NpYmxlIHRoZSB1c2Ugb2YgZGF0YUJpbmRBdHRyaWJ1dGUgZm9yIHJldXNhYmxlIGNvZGUpLlxyXG4gICAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiB3b3JrcyBmaW5lIGZvciBkYXRhIGFzIHBsYWluIG9iamVjdCB3aXRoIFxyXG4gICAgLy8gc2ltcGxlIHR5cGVzIGFzIHByb3BlcnRpZXMgKG5vdCBvYmplY3RzIG9yIGFycmF5cyBpbnNpZGUgdGhlbSkuXHJcbiAgICBiaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGEoKSB7XHJcbiAgICAgIGlmICghdGhpcy5kYXRhKSByZXR1cm47XHJcbiAgICAgIC8vIENoZWNrIGV2ZXJ5IGVsZW1lbnQgaW4gdGhlIGNvbXBvbmVudCB3aXRoIGEgYmluZFxyXG4gICAgICAvLyBwcm9wZXJ0eSBhbmQgdXBkYXRlIGl0IHdpdGggdGhlIHZhbHVlIG9mIHRoYXQgcHJvcGVydHlcclxuICAgICAgLy8gZnJvbSB0aGUgZGF0YSBzb3VyY2VcclxuICAgICAgdmFyIGF0dCA9IHRoaXMuZGF0YUJpbmRBdHRyaWJ1dGU7XHJcbiAgICAgIHZhciBhdHRyU2VsZWN0b3IgPSAnW2RhdGEtJyArIGF0dCArICddJztcclxuICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICB0aGlzLiRlbC5maW5kKGF0dHJTZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKSxcclxuICAgICAgICAgIHByb3AgPSAkdC5kYXRhKGF0dCksXHJcbiAgICAgICAgICBiaW5kZWRWYWx1ZSA9IHRoYXQuZGF0YVtwcm9wXTtcclxuXHJcbiAgICAgICAgaWYgKCR0LmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICR0LnZhbChiaW5kZWRWYWx1ZSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgJHQudGV4dChiaW5kZWRWYWx1ZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICBJdCBnZXRzIHRoZSBsYXRlc3QgZXJyb3IgaGFwcGVuZWQgaW4gdGhlIGNvbXBvbmVudCAob3IgbnVsbC9mYWxzeSBpZiB0aGVyZSBpcyBubyksXHJcbiAgICAgIG9yIHNldHMgdGhlIGVycm9yIChwYXNzaW5nIGl0IGluIHRoZSBvcHRpb25hbCB2YWx1ZSkgcmV0dXJuaW5nIHRoZSBwcmV2aW91cyByZWdpc3RlcmVkIGVycm9yLlxyXG4gICAgICBJdHMgcmVjb21tZW5kZWQgYW4gb2JqZWN0IGFzIGVycm9yIGluc3RlYWQgb2YgYSBzaW1wbGUgdmFsdWUgb3Igc3RyaW5nICh0aGF0IGNhbiBnZXQgY29uZnVzZWRcclxuICAgICAgd2l0aCBmYWxzeSBpZiBpcyBlbXB0eSBzdHJpbmcgb3IgMCwgYW5kIGFsbG93IGF0dGFjaCBtb3JlIHN0cnVjdHVyZWQgaW5mb3JtYXRpb24pIHdpdGggYW5cclxuICAgICAgaW5mb3JtYXRpb25hbCBwcm9wZXJ0eSAnbmFtZScuXHJcbiAgICAgIFRvIHNldCBvZmYgdGhlIGVycm9yLCBwYXNzIG51bGwgdmFsdWUgb3IgZmFsc2UuXHJcbiAgICAqKi9cclxuICAgIGhhc0Vycm9yOiBmdW5jdGlvbiBoYXNFcnJvcihlcnJvclRvU2V0KSB7XHJcbiAgICAgIGlmICh0eXBlb2YgKGVycm9yVG9TZXQpID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Vycm9yIHx8IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIHByZXYgPSB0aGlzLl9lcnJvciB8fCBudWxsO1xyXG4gICAgICB0aGlzLl9lcnJvciA9IGVycm9yVG9TZXQ7XHJcbiAgICAgIHRoaXMuZXZlbnRzLmVtaXQoJ2hhc0Vycm9yQ2hhbmdlZCcsIGVycm9yVG9TZXQsIHByZXYpO1xyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH1cclxuICB9LFxyXG4gIC8vIENvbnN0cnVjdG9yXHJcbiAgZnVuY3Rpb24gQmluZGFibGVDb21wb25lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgQ29tcG9uZW50LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICBcclxuICAgIC8vIEl0IGhhcyBhbiBldmVudCBlbWl0dGVyOlxyXG4gICAgdGhpcy5ldmVudHMgPSBuZXcgbWV2ZW50cy5FdmVudEVtaXR0ZXIoKTtcclxuICAgIC8vIEV2ZW50cyBvYmplY3QgaGFzIGEgcHJvcGVydHkgdG8gYWNjZXNzIHRoaXMgb2JqZWN0LFxyXG4gICAgLy8gdXNlZnVsbCB0byByZWZlcmVuY2UgYXMgJ3RoaXMuY29tcG9uZW50JyBmcm9tIGluc2lkZVxyXG4gICAgLy8gZXZlbnQgaGFuZGxlcnM6XHJcbiAgICB0aGlzLmV2ZW50cy5jb21wb25lbnQgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuZGF0YSA9IHRoaXMuJGVsLmRhdGEoJ3NvdXJjZScpIHx8IHRoaXMuZGF0YSB8fCB7fTtcclxuICAgIGlmICh0eXBlb2YgKHRoaXMuZGF0YSkgPT0gJ3N0cmluZycpXHJcbiAgICAgIHRoaXMuZGF0YSA9IEpTT04ucGFyc2UodGhpcy5kYXRhKTtcclxuXHJcbiAgICAvLyBPbiBodG1sIHNvdXJjZSB1cmwgY29uZmlndXJhdGlvbjpcclxuICAgIHRoaXMudXJsID0gdGhpcy4kZWwuZGF0YSgnc291cmNlLXVybCcpIHx8IHRoaXMudXJsO1xyXG5cclxuICAgIC8vIENsYXNzZXMgb24gZmV0Y2hEYXRhRXJyb3JcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCBmdW5jdGlvbiAoZXJyLCBwcmV2RXJyKSB7XHJcbiAgICAgIGlmIChlcnIgJiYgZXJyLm5hbWUgPT0gJ2ZldGNoRGF0YUVycm9yJykge1xyXG4gICAgICAgIHRoYXQuJGVsLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5oYXNEYXRhRXJyb3IpO1xyXG4gICAgICB9IGVsc2UgaWYgKHByZXZFcnIgJiYgcHJldkVyci5uYW1lID09ICdmZXRjaERhdGFFcnJvcicpIHtcclxuICAgICAgICB0aGF0LiRlbC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuaGFzRGF0YUVycm9yIHx8ICdfJyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFRPRE86ICdjaGFuZ2UnIGV2ZW50IGhhbmRsZXJzIG9uIGZvcm1zIHdpdGggZGF0YS1iaW5kIHRvIHVwZGF0ZSBpdHMgdmFsdWUgYXQgdGhpcy5kYXRhXHJcbiAgICAvLyBUT0RPOiBhdXRvICdiaW5kRGF0YScgb24gZmV0Y2hEYXRhIGVuZHM/IGNvbmZpZ3VyYWJsZSwgYmluZERhdGFNb2RleyBpbm1lZGlhdGUsIG5vdGlmeSB9XHJcbiAgfVxyXG4pO1xyXG5cclxuLy8gUHVibGljIG1vZHVsZTpcclxubW9kdWxlLmV4cG9ydHMgPSBCaW5kYWJsZUNvbXBvbmVudDsiLCIvKiogQ29tcG9uZW50IGNsYXNzOiB3cmFwcGVyIGZvclxyXG4gIHRoZSBsb2dpYyBhbmQgYmVoYXZpb3IgYXJvdW5kXHJcbiAgYSBET00gZWxlbWVudFxyXG4qKi9cclxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4vZXh0ZW5kJyk7XHJcblxyXG5mdW5jdGlvbiBDb21wb25lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIHRoaXMuZWwgPSBlbGVtZW50O1xyXG4gIHRoaXMuJGVsID0gJChlbGVtZW50KTtcclxuICBleHRlbmQodGhpcywgb3B0aW9ucyk7XHJcbiAgLy8gVXNlIHRoZSBqUXVlcnkgJ2RhdGEnIHN0b3JhZ2UgdG8gcHJlc2VydmUgYSByZWZlcmVuY2VcclxuICAvLyB0byB0aGlzIGluc3RhbmNlICh1c2VmdWwgdG8gcmV0cmlldmUgaXQgZnJvbSBkb2N1bWVudClcclxuICB0aGlzLiRlbC5kYXRhKCdjb21wb25lbnQnLCB0aGlzKTtcclxufVxyXG5cclxuZXh0ZW5kLnBsdWdJbihDb21wb25lbnQpO1xyXG5leHRlbmQucGx1Z0luKENvbXBvbmVudC5wcm90b3R5cGUpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQ7IiwiLyoqXHJcbiAgRGF0YVNvdXJjZSBjbGFzcyB0byBzaW1wbGlmeSBmZXRjaGluZyBkYXRhIGFzIEpTT05cclxuICB0byBmaWxsIGEgbG9jYWwgY2FjaGUuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZmV0Y2hKU09OID0gJC5nZXRKU09OLFxyXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJC5leHRlbmQuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7IH07XHJcblxyXG4vLyBUT0RPOiByZXBsYWNlIGVhY2ggcHJvcGVydHkgb2YgZnVuY3Rpb25zIGJ5IGluc3RhbmNlIHByb3BlcnRpZXMsIHNpbmNlIHRoYXQgcHJvcGVydGllcyBiZWNvbWVcclxuLy8gc2hhcmVkIGJldHdlZW4gaW5zdGFuY2VzIGFuZCBpcyBub3Qgd2FudGVkXHJcblxyXG52YXIgcmVxTW9kZXMgPSBEYXRhU291cmNlLnJlcXVlc3RNb2RlcyA9IHtcclxuICAvLyBQYXJhbGxlbCByZXF1ZXN0LCBubyBtYXR0ZXIgb2Ygb3RoZXJzXHJcbiAgbXVsdGlwbGU6IDAsXHJcbiAgLy8gV2lsbCBhdm9pZCBhIHJlcXVlc3QgaWYgdGhlcmUgaXMgb25lIHJ1bm5pbmdcclxuICBzaW5nbGU6IDEsXHJcbiAgLy8gTGF0ZXN0IHJlcXVldCB3aWxsIHJlcGxhY2UgYW55IHByZXZpb3VzIG9uZSAocHJldmlvdXMgd2lsbCBhYm9ydClcclxuICByZXBsYWNlOiAyXHJcbn07XHJcblxyXG52YXIgdXBkTW9kZXMgPSBEYXRhU291cmNlLnVwZGF0ZU1vZGVzID0ge1xyXG4gIC8vIEV2ZXJ5IG5ldyBkYXRhIHVwZGF0ZSwgbmV3IGNvbnRlbnQgaXMgYWRkZWQgaW5jcmVtZW50YWxseVxyXG4gIC8vIChvdmVyd3JpdGUgY29pbmNpZGVudCBjb250ZW50LCBhcHBlbmQgbmV3IGNvbnRlbnQsIG9sZCBjb250ZW50XHJcbiAgLy8gZ2V0IGluIHBsYWNlKVxyXG4gIGluY3JlbWVudGFsOiAwLFxyXG4gIC8vIE9uIG5ldyBkYXRhIHVwZGF0ZSwgbmV3IGRhdGEgdG90YWxseSByZXBsYWNlIHRoZSBwcmV2aW91cyBvbmVcclxuICByZXBsYWNlbWVudDogMVxyXG59O1xyXG5cclxuLyoqXHJcblVwZGF0ZSB0aGUgZGF0YSBzdG9yZSBvciBjYWNoZSB3aXRoIHRoZSBnaXZlbiBvbmUuXHJcblRoZXJlIGFyZSBkaWZmZXJlbnQgbW9kZXMsIHRoaXMgbWFuYWdlcyB0aGF0IGxvZ2ljIGFuZFxyXG5pdHMgb3duIGNvbmZpZ3VyYXRpb24uXHJcbklzIGRlY291cGxlZCBmcm9tIHRoZSBwcm90b3R5cGUgYnV0XHJcbml0IHdvcmtzIG9ubHkgYXMgcGFydCBvZiBhIERhdGFTb3VyY2UgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVEYXRhKGRhdGEsIG1vZGUpIHtcclxuICBzd2l0Y2ggKG1vZGUgfHwgdGhpcy51cGRhdGVEYXRhLmRlZmF1bHRVcGRhdGVNb2RlKSB7XHJcblxyXG4gICAgY2FzZSB1cGRNb2Rlcy5yZXBsYWNlbWVudDpcclxuICAgICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgLy9jYXNlIHVwZE1vZGVzLmluY3JlbWVudGFsOiAgXHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICAvLyBJbiBjYXNlIGluaXRpYWwgZGF0YSBpcyBudWxsLCBhc3NpZ24gdGhlIHJlc3VsdCB0byBpdHNlbGY6XHJcbiAgICAgIHRoaXMuZGF0YSA9IGV4dGVuZCh0aGlzLmRhdGEsIGRhdGEpO1xyXG4gICAgICBicmVhaztcclxuICB9XHJcbn1cclxuXHJcbi8qKiBEZWZhdWx0IHZhbHVlIGZvciB0aGUgY29uZmlndXJhYmxlIHVwZGF0ZSBtb2RlOlxyXG4qKi9cclxudXBkYXRlRGF0YS5kZWZhdWx0VXBkYXRlTW9kZSA9IHVwZE1vZGVzLmluY3JlbWVudGFsO1xyXG5cclxuLyoqXHJcbkZldGNoIHRoZSBkYXRhIGZyb20gdGhlIHNlcnZlci5cclxuSGVyZSBpcyBkZWNvdXBsZWQgZnJvbSB0aGUgcmVzdCBvZiB0aGUgcHJvdG90eXBlIGZvclxyXG5jb21tb2RpdHksIGJ1dCBpdCBjYW4gd29ya3Mgb25seSBhcyBwYXJ0IG9mIGEgRGF0YVNvdXJjZSBpbnN0YW5jZS5cclxuKiovXHJcbmZ1bmN0aW9uIGZldGNoRGF0YShxdWVyeSwgbW9kZSkge1xyXG4gIHF1ZXJ5ID0gZXh0ZW5kKHt9LCB0aGlzLnF1ZXJ5LCBxdWVyeSk7XHJcbiAgc3dpdGNoIChtb2RlIHx8IHRoaXMuZmV0Y2hEYXRhLmRlZmF1bHRSZXF1ZXN0TW9kZSkge1xyXG5cclxuICAgIGNhc2UgcmVxTW9kZXMuc2luZ2xlOlxyXG4gICAgICBpZiAodGhpcy5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSByZXR1cm4gbnVsbDtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSByZXFNb2Rlcy5yZXBsYWNlOlxyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzW2ldLmFib3J0KCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXgpIHsgfVxyXG4gICAgICAgIHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzID0gW107XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgLy8gSnVzdCBkbyBub3RoaW5nIGZvciBtdWx0aXBsZSBvciBkZWZhdWx0ICAgICBcclxuICAgIC8vY2FzZSByZXFNb2Rlcy5tdWx0aXBsZTogIFxyXG4gICAgLy9kZWZhdWx0OiBcclxuICB9XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB2YXIgcmVxID0gdGhpcy5mZXRjaERhdGEucHJveHkoXHJcbiAgICB0aGlzLnVybCxcclxuICAgIHF1ZXJ5LFxyXG4gICAgZnVuY3Rpb24gKGRhdGEsIHQsIHhocikge1xyXG4gICAgICB2YXIgcmV0ID0gdGhhdC51cGRhdGVEYXRhKGRhdGEpO1xyXG4gICAgICB0aGF0LmZldGNoRGF0YS5yZXF1ZXN0cy5zcGxpY2UodGhhdC5mZXRjaERhdGEucmVxdWVzdHMuaW5kZXhPZihyZXEpLCAxKTtcclxuICAgICAgLy9kZWxldGUgZmV0Y2hEYXRhLnJlcXVlc3RzW2ZldGNoRGF0YS5yZXF1ZXN0cy5pbmRleE9mKHJlcSldO1xyXG5cclxuICAgICAgaWYgKHJldCAmJiByZXQubmFtZSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSBkYXRhIGVtaXRzIGVycm9yLCB0aGUgQWpheCBzdGlsbCByZXNvbHZlcyBhcyAnc3VjY2VzcycgYmVjYXVzZSBvZiB0aGUgcmVxdWVzdCwgYnV0XHJcbiAgICAgICAgLy8gd2UgbmVlZCB0byBleGVjdXRlIHRoZSBlcnJvciwgYnV0IHdlIHBpcGUgaXQgdG8gZW5zdXJlIGlzIGRvbmUgYWZ0ZXIgb3RoZXIgJ2RvbmUnIGNhbGxiYWNrc1xyXG4gICAgICAgIHJlcS5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdGhhdC5mZXRjaERhdGEub25lcnJvci5jYWxsKHRoYXQsIG51bGwsIHJldC5uYW1lLCByZXQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG4gIClcclxuICAuZmFpbCgkLnByb3h5KHRoaXMuZmV0Y2hEYXRhLm9uZXJyb3IsIHRoaXMpKTtcclxuICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5wdXNoKHJlcSk7XHJcblxyXG4gIHJldHVybiByZXE7XHJcbn1cclxuXHJcbi8vIERlZmF1bHRzIGZldGNoRGF0YSBwcm9wZXJ0aWVzLCB0aGV5IGFyZSBkZWNvdXBsZWQgdG8gYWxsb3dcclxuLy8gcmVwbGFjZW1lbnQsIGFuZCBpbnNpZGUgdGhlIGZldGNoRGF0YSBmdW5jdGlvbiB0byBkb24ndFxyXG4vLyBjb250YW1pbmF0ZSB0aGUgb2JqZWN0IG5hbWVzcGFjZS5cclxuXHJcbi8qIENvbGxlY3Rpb24gb2YgYWN0aXZlIChmZXRjaGluZykgcmVxdWVzdHMgdG8gdGhlIHNlcnZlclxyXG4qL1xyXG5mZXRjaERhdGEucmVxdWVzdHMgPSBbXTtcclxuXHJcbi8qIERlY291cGxlZCBmdW5jdGlvbmFsaXR5IHRvIHBlcmZvcm0gdGhlIEFqYXggb3BlcmF0aW9uLFxyXG50aGlzIGFsbG93cyBvdmVyd3JpdGUgdGhpcyBiZWhhdmlvciB0byBpbXBsZW1lbnQgYW5vdGhlclxyXG53YXlzLCBsaWtlIGEgbm9uLWpRdWVyeSBpbXBsZW1lbnRhdGlvbiwgYSBwcm94eSB0byBmYWtlIHNlcnZlclxyXG5mb3IgdGVzdGluZyBvciBwcm94eSB0byBsb2NhbCBzdG9yYWdlIGlmIG9ubGluZSwgZXRjLlxyXG5JdCBtdXN0IHJldHVybnMgdGhlIHVzZWQgcmVxdWVzdCBvYmplY3QuXHJcbiovXHJcbmZldGNoRGF0YS5wcm94eSA9IGZldGNoSlNPTjtcclxuXHJcbi8qIEJ5IGRlZmF1bHQsIGZldGNoRGF0YSBhbGxvd3MgbXVsdGlwbGUgc2ltdWx0YW5lb3MgY29ubmVjdGlvbixcclxuc2luY2UgdGhlIHN0b3JhZ2UgYnkgZGVmYXVsdCBhbGxvd3MgaW5jcmVtZW50YWwgdXBkYXRlcyByYXRoZXJcclxudGhhbiByZXBsYWNlbWVudHMuXHJcbiovXHJcbmZldGNoRGF0YS5kZWZhdWx0UmVxdWVzdE1vZGUgPSByZXFNb2Rlcy5tdWx0aXBsZTtcclxuXHJcbi8qIERlZmF1bHQgbm90aWZpY2F0aW9uIG9mIGVycm9yIG9uIGZldGNoaW5nLCBqdXN0IGxvZ2dpbmcsXHJcbmNhbiBiZSByZXBsYWNlZC5cclxuSXQgcmVjZWl2ZXMgdGhlIHJlcXVlc3Qgb2JqZWN0LCBzdGF0dXMgYW5kIGVycm9yLlxyXG4qL1xyXG5mZXRjaERhdGEub25lcnJvciA9IGZ1bmN0aW9uIGVycm9yKHgsIHMsIGUpIHtcclxuICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdGZXRjaCBkYXRhIGVycm9yICVvJywgZSk7XHJcbn07XHJcblxyXG4vKipcclxuICBEYXRhU291cmNlIGNsYXNzXHJcbioqL1xyXG4vLyBDb25zdHJ1Y3RvcjogZXZlcnl0aGluZyBpcyBpbiB0aGUgcHJvdG90eXBlLlxyXG5mdW5jdGlvbiBEYXRhU291cmNlKCkgeyB9XHJcbkRhdGFTb3VyY2UucHJvdG90eXBlID0ge1xyXG4gIGRhdGE6IG51bGwsXHJcbiAgdXJsOiAnLycsXHJcbiAgLy8gcXVlcnk6IG9iamVjdCB3aXRoIGRlZmF1bHQgZXh0cmEgaW5mb3JtYXRpb24gdG8gYXBwZW5kIHRvIHRoZSB1cmxcclxuICAvLyB3aGVuIGZldGNoaW5nIGRhdGEsIGV4dGVuZGVkIHdpdGggdGhlIGV4cGxpY2l0IHF1ZXJ5IHNwZWNpZmllZFxyXG4gIC8vIGV4ZWN1dGluZyBmZXRjaERhdGEocXVlcnkpXHJcbiAgcXVlcnk6IHt9LFxyXG4gIHVwZGF0ZURhdGE6IHVwZGF0ZURhdGEsXHJcbiAgZmV0Y2hEYXRhOiBmZXRjaERhdGFcclxuICAvLyBUT0RPICBwdXNoRGF0YTogZnVuY3Rpb24oKXsgcG9zdC9wdXQgdGhpcy5kYXRhIHRvIHVybCAgfVxyXG59O1xyXG5cclxuLy8gQ2xhc3MgYXMgcHVibGljIG1vZHVsZTpcclxubW9kdWxlLmV4cG9ydHMgPSBEYXRhU291cmNlOyIsIi8qKlxyXG4gIExvY29ub21pY3Mgc3BlY2lmaWMgV2lkZ2V0IGJhc2VkIG9uIEJpbmRhYmxlQ29tcG9uZW50LlxyXG4gIEp1c3QgZGVjb3VwbGluZyBzcGVjaWZpYyBiZWhhdmlvcnMgZnJvbSBzb21ldGhpbmcgbW9yZSBnZW5lcmFsXHJcbiAgdG8gZWFzaWx5IHRyYWNrIHRoYXQgZGV0YWlscywgYW5kIG1heWJlIGZ1dHVyZSBtaWdyYXRpb25zIHRvXHJcbiAgb3RoZXIgZnJvbnQtZW5kIGZyYW1ld29ya3MuXHJcbioqL1xyXG52YXIgRGF0YVNvdXJjZSA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZScpO1xyXG52YXIgQmluZGFibGVDb21wb25lbnQgPSByZXF1aXJlKCcuL0JpbmRhYmxlQ29tcG9uZW50Jyk7XHJcblxyXG52YXIgTGNXaWRnZXQgPSBCaW5kYWJsZUNvbXBvbmVudC5leHRlbmQoXHJcbiAgLy8gUHJvdG90eXBlXHJcbiAge1xyXG4gICAgLy8gUmVwbGFjaW5nIHVwZGF0ZURhdGEgdG8gaW1wbGVtZW50IHRoZSBwYXJ0aWN1bGFyXHJcbiAgICAvLyBKU09OIHNjaGVtZSBvZiBMb2Nvbm9taWNzLCBidXQgcmV1c2luZyBvcmlnaW5hbFxyXG4gICAgLy8gbG9naWMgaW5oZXJpdCBmcm9tIERhdGFTb3VyY2VcclxuICAgIHVwZGF0ZURhdGE6IGZ1bmN0aW9uIChkYXRhLCBtb2RlKSB7XHJcbiAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgIERhdGFTb3VyY2UucHJvdG90eXBlLnVwZGF0ZURhdGEuY2FsbCh0aGlzLCBkYXRhLlJlc3VsdCwgbW9kZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRXJyb3IgbWVzc2FnZSBpbiB0aGUgSlNPTlxyXG4gICAgICAgIHJldHVybiB7IG5hbWU6ICdkYXRhLWZvcm1hdCcsIG1lc3NhZ2U6IGRhdGEuUmVzdWx0ID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlIDogZGF0YS5SZXN1bHQgOiBcInVua25vd1wiIH07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIC8vIENvbnN0cnVjdG9yXHJcbiAgZnVuY3Rpb24gTGNXaWRnZXQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgQmluZGFibGVDb21wb25lbnQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICB9XHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjV2lkZ2V0OyIsIi8qKlxyXG4gIERlZXAgRXh0ZW5kIG9iamVjdCB1dGlsaXR5LCBpcyByZWN1cnNpdmUgdG8gZ2V0IGFsbCB0aGUgZGVwdGhcclxuICBidXQgb25seSBmb3IgdGhlIHByb3BlcnRpZXMgb3duZWQgYnkgdGhlIG9iamVjdCxcclxuICBpZiB5b3UgbmVlZCB0aGUgbm9uLW93bmVkIHByb3BlcnRpZXMgdG8gaW4gdGhlIG9iamVjdCxcclxuICBjb25zaWRlciBleHRlbmQgZnJvbSB0aGUgc291cmNlIHByb3RvdHlwZSB0b28gKGFuZCBtYXliZSB0b1xyXG4gIHRoZSBkZXN0aW5hdGlvbiBwcm90b3R5cGUgaW5zdGVhZCBvZiB0aGUgaW5zdGFuY2UsIGJ1dCB1cCB0byB0b28pLlxyXG4qKi9cclxuXHJcbi8qIGpxdWVyeSBpbXBsZW1lbnRhdGlvbjpcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuZXh0ZW5kID0gZnVuY3Rpb24gKCkge1xyXG5yZXR1cm4gJC5leHRlbmQuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7IFxyXG59OyovXHJcblxyXG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kKGRlc3RpbmF0aW9uLCBzb3VyY2UpIHtcclxuICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBzb3VyY2UpIHtcclxuICAgIGlmICghc291cmNlLmhhc093blByb3BlcnR5KHByb3BlcnR5KSlcclxuICAgICAgY29udGludWU7XHJcblxyXG4gICAgLy8gQWxsb3cgcHJvcGVydGllcyByZW1vdmFsLCBpZiBzb3VyY2UgY29udGFpbnMgdmFsdWUgJ3VuZGVmaW5lZCcuXHJcbiAgICAvLyBUaGVyZSBhcmUgbm8gc3BlY2lhbCBjb25zaWRlcmF0aW9ucyBvbiBBcnJheXMsIHRvIGRvbid0IGdldCB1bmRlc2lyZWRcclxuICAgIC8vIHJlc3VsdHMganVzdCB0aGUgd2FudGVkIGlzIHRvIHJlcGxhY2Ugc3BlY2lmaWMgcG9zaXRpb25zLCBub3JtYWxseS5cclxuICAgIGlmIChzb3VyY2VbcHJvcGVydHldID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgZGVsZXRlIGRlc3RpbmF0aW9uW3Byb3BlcnR5XTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFsnb2JqZWN0JywgJ2Z1bmN0aW9uJ10uaW5kZXhPZih0eXBlb2YgZGVzdGluYXRpb25bcHJvcGVydHldKSAhPSAtMSAmJlxyXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlW3Byb3BlcnR5XSA9PSAnb2JqZWN0JylcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVzdGluYXRpb25bcHJvcGVydHldID09ICdmdW5jdGlvbicgJiZcclxuICAgICAgICAgICAgICAgICB0eXBlb2Ygc291cmNlW3Byb3BlcnR5XSA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHZhciBvcmlnID0gZGVzdGluYXRpb25bcHJvcGVydHldO1xyXG4gICAgICAvLyBDbG9uZSBmdW5jdGlvblxyXG4gICAgICB2YXIgc291ciA9IGNsb25lRnVuY3Rpb24oc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICAgIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9IHNvdXI7XHJcbiAgICAgIC8vIEFueSBwcmV2aW91cyBhdHRhY2hlZCBwcm9wZXJ0eVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBvcmlnKTtcclxuICAgICAgLy8gQW55IHNvdXJjZSBhdHRhY2hlZCBwcm9wZXJ0eVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBzb3VyY2VbcHJvcGVydHldKTtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgICAgZGVzdGluYXRpb25bcHJvcGVydHldID0gc291cmNlW3Byb3BlcnR5XTtcclxuICB9XHJcblxyXG4gIC8vIFNvIG11Y2ggJ3NvdXJjZScgYXJndW1lbnRzIGFzIHdhbnRlZC4gSW4gRVM2IHdpbGwgYmUgJ3NvdXJjZS4uJ1xyXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xyXG4gICAgdmFyIG5leHRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcclxuICAgIG5leHRzLnNwbGljZSgxLCAxKTtcclxuICAgIGV4dGVuZC5hcHBseSh0aGlzLCBuZXh0cyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGVzdGluYXRpb247XHJcbn07XHJcblxyXG5leHRlbmQucGx1Z0luID0gZnVuY3Rpb24gcGx1Z0luKG9iaikge1xyXG4gIG9iaiA9IG9iaiB8fCBPYmplY3QucHJvdG90eXBlO1xyXG4gIG9iai5leHRlbmRNZSA9IGZ1bmN0aW9uIGV4dGVuZE1lKCkge1xyXG4gICAgZXh0ZW5kLmFwcGx5KHRoaXMsIFt0aGlzXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xyXG4gIH07XHJcbiAgb2JqLmV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZEluc3RhbmNlKCkge1xyXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxyXG4gICAgICAvLyBJZiB0aGUgb2JqZWN0IHVzZWQgdG8gZXh0ZW5kIGZyb20gaXMgYSBmdW5jdGlvbiwgaXMgY29uc2lkZXJlZFxyXG4gICAgICAvLyBhIGNvbnN0cnVjdG9yLCB0aGVuIHdlIGV4dGVuZCBmcm9tIGl0cyBwcm90b3R5cGUsIG90aGVyd2lzZSBpdHNlbGYuXHJcbiAgICAgIGNvbnN0cnVjdG9yQSA9IHR5cGVvZiB0aGlzID09ICdmdW5jdGlvbicgPyB0aGlzIDogbnVsbCxcclxuICAgICAgYmFzZUEgPSBjb25zdHJ1Y3RvckEgPyB0aGlzLnByb3RvdHlwZSA6IHRoaXMsXHJcbiAgICAgIC8vIElmIGxhc3QgYXJndW1lbnQgaXMgYSBmdW5jdGlvbiwgaXMgY29uc2lkZXJlZCBhIGNvbnN0cnVjdG9yXHJcbiAgICAgIC8vIG9mIHRoZSBuZXcgY2xhc3Mvb2JqZWN0IHRoZW4gd2UgZXh0ZW5kIGl0cyBwcm90b3R5cGUuXHJcbiAgICAgIC8vIFdlIHVzZSBhbiBlbXB0eSBvYmplY3Qgb3RoZXJ3aXNlLlxyXG4gICAgICBjb25zdHJ1Y3RvckIgPSB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICdmdW5jdGlvbicgP1xyXG4gICAgICAgIGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSlbMF0gOlxyXG4gICAgICAgIG51bGwsXHJcbiAgICAgIGJhc2VCID0gY29uc3RydWN0b3JCID8gY29uc3RydWN0b3JCLnByb3RvdHlwZSA6IHt9O1xyXG5cclxuICAgIHZhciBleHRlbmRlZFJlc3VsdCA9IGV4dGVuZC5hcHBseSh0aGlzLCBbYmFzZUIsIGJhc2VBXS5jb25jYXQoYXJncykpO1xyXG4gICAgLy8gSWYgYm90aCBhcmUgY29uc3RydWN0b3JzLCB3ZSB3YW50IHRoZSBzdGF0aWMgbWV0aG9kcyB0byBiZSBjb3BpZWQgdG9vOlxyXG4gICAgaWYgKGNvbnN0cnVjdG9yQSAmJiBjb25zdHJ1Y3RvckIpXHJcbiAgICAgIGV4dGVuZChjb25zdHJ1Y3RvckIsIGNvbnN0cnVjdG9yQSk7XHJcblxyXG4gICAgLy8gSWYgd2UgYXJlIGV4dGVuZGluZyBhIGNvbnN0cnVjdG9yLCB3ZSByZXR1cm4gdGhhdCwgb3RoZXJ3aXNlIHRoZSByZXN1bHRcclxuICAgIHJldHVybiBjb25zdHJ1Y3RvckIgfHwgZXh0ZW5kZWRSZXN1bHQ7XHJcbiAgfTtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gIG1vZHVsZS5leHBvcnRzID0gZXh0ZW5kO1xyXG59IGVsc2Uge1xyXG4gIC8vIGdsb2JhbCBzY29wZVxyXG4gIGV4dGVuZC5wbHVnSW4oKTtcclxufVxyXG5cclxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgQ2xvbmUgVXRpbHNcclxuKi9cclxuZnVuY3Rpb24gY2xvbmVPYmplY3Qob2JqKSB7XHJcbiAgcmV0dXJuIGV4dGVuZCh7fSwgb2JqKTtcclxufVxyXG5cclxuLy8gVGVzdGluZyBpZiBhIHN0cmluZyBzZWVtcyBhIGZ1bmN0aW9uIHNvdXJjZSBjb2RlOlxyXG4vLyBXZSB0ZXN0IGFnYWlucyBhIHNpbXBsaXNpYyByZWd1bGFyIGV4cHJlc2lvbiB0aGF0IG1hdGNoXHJcbi8vIGEgY29tbW9uIHN0YXJ0IG9mIGZ1bmN0aW9uIGRlY2xhcmF0aW9uLlxyXG4vLyBPdGhlciB3YXlzIHRvIGRvIHRoaXMgaXMgYXQgaW52ZXJzZXIsIGJ5IGNoZWNraW5nXHJcbi8vIHRoYXQgdGhlIGZ1bmN0aW9uIHRvU3RyaW5nIGlzIG5vdCBhIGtub3dlZCB0ZXh0XHJcbi8vIGFzICdbb2JqZWN0IEZ1bmN0aW9uXScgb3IgJ1tuYXRpdmUgY29kZV0nLCBidXRcclxuLy8gc2luY2UgdGhhIGNhbiBjaGFuZ2VzIGJldHdlZW4gYnJvd3NlcnMsIGlzIG1vcmUgY29uc2VydmF0aXZlXHJcbi8vIGNoZWNrIGFnYWluc3QgYSBjb21tb24gY29uc3RydWN0IGFuIGZhbGxiYWNrIG9uIHRoZVxyXG4vLyBjb21tb24gc29sdXRpb24gaWYgbm90IG1hdGNoZXMuXHJcbnZhciB0ZXN0RnVuY3Rpb24gPSAvXlxccypmdW5jdGlvblteXFwoXVxcKC87XHJcblxyXG5mdW5jdGlvbiBjbG9uZUZ1bmN0aW9uKGZuKSB7XHJcbiAgdmFyIHRlbXA7XHJcbiAgdmFyIGNvbnRlbnRzID0gZm4udG9TdHJpbmcoKTtcclxuICAvLyBDb3B5IHRvIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBzYW1lIHByb3RvdHlwZSwgZm9yIHRoZSBub3QgJ293bmVkJyBwcm9wZXJ0aWVzLlxyXG4gIC8vIEFzc2luZ2VkIGF0IHRoZSBlbmRcclxuICB2YXIgdGVtcFByb3RvID0gT2JqZWN0LmNyZWF0ZShmbi5wcm90b3R5cGUpO1xyXG5cclxuICAvLyBESVNBQkxFRCB0aGUgY29udGVudHMtY29weSBwYXJ0IGJlY2F1c2UgaXQgZmFpbHMgd2l0aCBjbG9zdXJlc1xyXG4gIC8vIGdlbmVyYXRlZCBieSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24sIHVzaW5nIHRoZSBzdWItY2FsbCB3YXkgZXZlclxyXG4gIGlmICh0cnVlIHx8ICF0ZXN0RnVuY3Rpb24udGVzdChjb250ZW50cykpIHtcclxuICAgIC8vIENoZWNrIGlmIGlzIGFscmVhZHkgYSBjbG9uZWQgY29weSwgdG9cclxuICAgIC8vIHJldXNlIHRoZSBvcmlnaW5hbCBjb2RlIGFuZCBhdm9pZCBtb3JlIHRoYW5cclxuICAgIC8vIG9uZSBkZXB0aCBpbiBzdGFjayBjYWxscyAoZ3JlYXQhKVxyXG4gICAgaWYgKHR5cGVvZiBmbi5wcm90b3R5cGUuX19fY2xvbmVkX29mID09ICdmdW5jdGlvbicpXHJcbiAgICAgIGZuID0gZm4ucHJvdG90eXBlLl9fX2Nsb25lZF9vZjtcclxuXHJcbiAgICB0ZW1wID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZm4uYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7IH07XHJcblxyXG4gICAgLy8gU2F2ZSBtYXJrIGFzIGNsb25lZC4gRG9uZSBpbiBpdHMgcHJvdG90eXBlXHJcbiAgICAvLyB0byBub3QgYXBwZWFyIGluIHRoZSBsaXN0IG9mICdvd25lZCcgcHJvcGVydGllcy5cclxuICAgIHRlbXBQcm90by5fX19jbG9uZWRfb2YgPSBmbjtcclxuICAgIC8vIFJlcGxhY2UgdG9TdHJpbmcgdG8gcmV0dXJuIHRoZSBvcmlnaW5hbCBzb3VyY2U6XHJcbiAgICB0ZW1wUHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBmbi50b1N0cmluZygpO1xyXG4gICAgfTtcclxuICAgIC8vIFRoZSBuYW1lIGNhbm5vdCBiZSBzZXQsIHdpbGwganVzdCBiZSBhbm9ueW1vdXNcclxuICAgIC8vdGVtcC5uYW1lID0gdGhhdC5uYW1lO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBUaGlzIHdheSBvbiBjYXBhYmxlIGJyb3dzZXJzIHByZXNlcnZlIHRoZSBvcmlnaW5hbCBuYW1lLFxyXG4gICAgLy8gZG8gYSByZWFsIGluZGVwZW5kZW50IGNvcHkgYW5kIGF2b2lkIGZ1bmN0aW9uIHN1YmNhbGxzIHRoYXRcclxuICAgIC8vIGNhbiBkZWdyYXRlIHBlcmZvcm1hbmNlIGFmdGVyIGxvdCBvZiAnY2xvbm5pbmcnLlxyXG4gICAgdmFyIGYgPSBGdW5jdGlvbjtcclxuICAgIHRlbXAgPSAobmV3IGYoJ3JldHVybiAnICsgY29udGVudHMpKSgpO1xyXG4gIH1cclxuXHJcbiAgdGVtcC5wcm90b3R5cGUgPSB0ZW1wUHJvdG87XHJcbiAgLy8gQ29weSBhbnkgcHJvcGVydGllcyBpdCBvd25zXHJcbiAgZXh0ZW5kKHRlbXAsIGZuKTtcclxuXHJcbiAgcmV0dXJuIHRlbXA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsb25lUGx1Z0luKCkge1xyXG4gIGlmICh0eXBlb2YgRnVuY3Rpb24ucHJvdG90eXBlLmNsb25lICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBGdW5jdGlvbi5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSgpIHsgcmV0dXJuIGNsb25lRnVuY3Rpb24odGhpcyk7IH07XHJcbiAgfVxyXG4gIGlmICh0eXBlb2YgT2JqZWN0LnByb3RvdHlwZS5jbG9uZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgT2piZWN0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkgeyByZXR1cm4gY2xvbmVPYmplY3QodGhpcyk7IH07XHJcbiAgfVxyXG59XHJcblxyXG5leHRlbmQuY2xvbmVPYmplY3QgPSBjbG9uZU9iamVjdDtcclxuZXh0ZW5kLmNsb25lRnVuY3Rpb24gPSBjbG9uZUZ1bmN0aW9uO1xyXG5leHRlbmQuY2xvbmVQbHVnSW4gPSBjbG9uZVBsdWdJbjtcclxuIiwiLyoqXHJcbiogQ29va2llcyBtYW5hZ2VtZW50LlxyXG4qIE1vc3QgY29kZSBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQ4MjU2OTUvMTYyMjM0NlxyXG4qL1xyXG52YXIgQ29va2llID0ge307XHJcblxyXG5Db29raWUuc2V0ID0gZnVuY3Rpb24gc2V0Q29va2llKG5hbWUsIHZhbHVlLCBkYXlzKSB7XHJcbiAgICB2YXIgZXhwaXJlcyA9IFwiXCI7XHJcbiAgICBpZiAoZGF5cykge1xyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldFRpbWUoZGF0ZS5nZXRUaW1lKCkgKyAoZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApKTtcclxuICAgICAgICBleHBpcmVzID0gXCI7IGV4cGlyZXM9XCIgKyBkYXRlLnRvR01UU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsgXCI9XCIgKyB2YWx1ZSArIGV4cGlyZXMgKyBcIjsgcGF0aD0vXCI7XHJcbn07XHJcbkNvb2tpZS5nZXQgPSBmdW5jdGlvbiBnZXRDb29raWUoY19uYW1lKSB7XHJcbiAgICBpZiAoZG9jdW1lbnQuY29va2llLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjX3N0YXJ0ID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoY19uYW1lICsgXCI9XCIpO1xyXG4gICAgICAgIGlmIChjX3N0YXJ0ICE9IC0xKSB7XHJcbiAgICAgICAgICAgIGNfc3RhcnQgPSBjX3N0YXJ0ICsgY19uYW1lLmxlbmd0aCArIDE7XHJcbiAgICAgICAgICAgIGNfZW5kID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoXCI7XCIsIGNfc3RhcnQpO1xyXG4gICAgICAgICAgICBpZiAoY19lbmQgPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGNfZW5kID0gZG9jdW1lbnQuY29va2llLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdW5lc2NhcGUoZG9jdW1lbnQuY29va2llLnN1YnN0cmluZyhjX3N0YXJ0LCBjX2VuZCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBcIlwiO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDb29raWU7IiwiLyoqIENvbm5lY3QgYWNjb3VudCB3aXRoIEZhY2Vib29rXHJcbioqL1xyXG52YXJcclxuICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKSxcclxuICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpLFxyXG4gIExjVXJsID0gcmVxdWlyZSgnLi9MY1VybCcpLFxyXG4gIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmZ1bmN0aW9uIEZhY2Vib29rQ29ubmVjdChvcHRpb25zKSB7XHJcbiAgJC5leHRlbmQodGhpcywgb3B0aW9ucyk7XHJcbiAgaWYgKCEkKCcjZmItcm9vdCcpLmxlbmd0aClcclxuICAgICQoJzxkaXYgaWQ9XCJmYi1yb290XCIgc3R5bGU9XCJkaXNwbGF5OiBub25lXCI+PC9kaXY+JykuYXBwZW5kVG8oJ2JvZHknKTtcclxufVxyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZSA9IHtcclxuICBhcHBJZDogbnVsbCxcclxuICBsYW5nOiAnZW5fVVMnLFxyXG4gIHJlc3VsdFR5cGU6ICdqc29uJywgLy8gJ3JlZGlyZWN0J1xyXG4gIGZiVXJsQmFzZTogJy8vY29ubmVjdC5mYWNlYm9vay5uZXQvQChsYW5nKS9hbGwuanMnLFxyXG4gIHNlcnZlclVybEJhc2U6IExjVXJsLkxhbmdQYXRoICsgJ0FjY291bnQvRmFjZWJvb2svQCh1cmxTZWN0aW9uKS8/UmVkaXJlY3Q9QChyZWRpcmVjdFVybCkmcHJvZmlsZT1AKHByb2ZpbGVVcmwpJyxcclxuICByZWRpcmVjdFVybDogJycsXHJcbiAgcHJvZmlsZVVybDogJycsXHJcbiAgdXJsU2VjdGlvbjogJycsXHJcbiAgbG9hZGluZ1RleHQ6ICdWZXJpZmluZycsXHJcbiAgcGVybWlzc2lvbnM6ICcnLFxyXG4gIGxpYkxvYWRlZEV2ZW50OiAnRmFjZWJvb2tDb25uZWN0TGliTG9hZGVkJyxcclxuICBjb25uZWN0ZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdENvbm5lY3RlZCdcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuZ2V0RmJVcmwgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5mYlVybEJhc2UucmVwbGFjZSgvQFxcKGxhbmdcXCkvZywgdGhpcy5sYW5nKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuZ2V0U2VydmVyVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuc2VydmVyVXJsQmFzZVxyXG4gIC5yZXBsYWNlKC9AXFwocmVkaXJlY3RVcmxcXCkvZywgdGhpcy5yZWRpcmVjdFVybClcclxuICAucmVwbGFjZSgvQFxcKHByb2ZpbGVVcmxcXCkvZywgdGhpcy5wcm9maWxlVXJsKVxyXG4gIC5yZXBsYWNlKC9AXFwodXJsU2VjdGlvblxcKS9nLCB0aGlzLnVybFNlY3Rpb24pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5sb2FkTGliID0gZnVuY3Rpb24gKCkge1xyXG4gIC8vIE9ubHkgaWYgaXMgbm90IGxvYWRlZCBzdGlsbFxyXG4gIC8vIChGYWNlYm9vayBzY3JpcHQgYXR0YWNoIGl0c2VsZiBhcyB0aGUgZ2xvYmFsIHZhcmlhYmxlICdGQicpXHJcbiAgaWYgKCF3aW5kb3cuRkIgJiYgIXRoaXMuX2xvYWRpbmdMaWIpIHtcclxuICAgIHRoaXMuX2xvYWRpbmdMaWIgPSB0cnVlO1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICBzY3JpcHRzOiBbdGhpcy5nZXRGYlVybCgpXSxcclxuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBGQi5pbml0KHsgYXBwSWQ6IHRoYXQuYXBwSWQsIHN0YXR1czogdHJ1ZSwgY29va2llOiB0cnVlLCB4ZmJtbDogdHJ1ZSB9KTtcclxuICAgICAgICB0aGF0LmxvYWRpbmdMaWIgPSBmYWxzZTtcclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoYXQubGliTG9hZGVkRXZlbnQpO1xyXG4gICAgICB9LFxyXG4gICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5GQjtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5wcm9jZXNzUmVzcG9uc2UgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICBpZiAocmVzcG9uc2UuYXV0aFJlc3BvbnNlKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IFdlbGNvbWUhJyk7XHJcbiAgICB2YXIgdXJsID0gdGhpcy5nZXRTZXJ2ZXJVcmwoKTtcclxuICAgIGlmICh0aGlzLnJlc3VsdFR5cGUgPT0gXCJyZWRpcmVjdFwiKSB7XHJcbiAgICAgIHJlZGlyZWN0VG8odXJsKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwianNvblwiKSB7XHJcbiAgICAgIHBvcHVwKHVybCwgJ3NtYWxsJywgbnVsbCwgdGhpcy5sb2FkaW5nVGV4dCk7XHJcbiAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIodGhpcy5jb25uZWN0ZWRFdmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLypGQi5hcGkoJy9tZScsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogR29vZCB0byBzZWUgeW91LCAnICsgcmVzcG9uc2UubmFtZSArICcuJyk7XHJcbiAgICB9KTsqL1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IFVzZXIgY2FuY2VsbGVkIGxvZ2luIG9yIGRpZCBub3QgZnVsbHkgYXV0aG9yaXplLicpO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUub25MaWJSZWFkeSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gIGlmICh3aW5kb3cuRkIpXHJcbiAgICBjYWxsYmFjaygpO1xyXG4gIGVsc2Uge1xyXG4gICAgdGhpcy5sb2FkTGliKCk7XHJcbiAgICAkKGRvY3VtZW50KS5vbih0aGlzLmxpYkxvYWRlZEV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB0aGlzLm9uTGliUmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgRkIubG9naW4oJC5wcm94eSh0aGF0LnByb2Nlc3NSZXNwb25zZSwgdGhhdCksIHsgc2NvcGU6IHRoYXQucGVybWlzc2lvbnMgfSk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmF1dG9Db25uZWN0T24gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdjbGljaycsIHNlbGVjdG9yIHx8ICdhLmZhY2Vib29rLWNvbm5lY3QnLCAkLnByb3h5KHRoaXMuY29ubmVjdCwgdGhpcykpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGYWNlYm9va0Nvbm5lY3Q7IiwiLypnbG9iYWwgZG9jdW1lbnQqL1xyXG4vKipcclxuICAgIEhlbHBQb2ludCBQb3BvdmVyICM1NTlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2Jvb3RzdHJhcCcpO1xyXG5cclxuZnVuY3Rpb24gSGVscFBvaW50KGVsZW1lbnQpIHtcclxuXHJcbiAgICB2YXIgJGVsID0gJChlbGVtZW50KTtcclxuXHJcbiAgICAkZWxcclxuICAgIC5wb3BvdmVyKHtcclxuICAgICAgICBjb250YWluZXI6ICdib2R5J1xyXG4gICAgfSlcclxuICAgIC5maWx0ZXIoJ2FbaHJlZj1cIiNcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIC8vIEF2b2lkIG5hdmlnYXRlIHRvIHRoZSBsaW5rLCB3aGVuIGltcGxlbWVudGVkXHJcbiAgICAgICAgLy8gbGlrZSBhbiBpbnRlcm5hbCBsaW5rIHdpdGggbm90aGluZ1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiAkZWw7XHJcbn1cclxuXHJcbmV4cG9ydHMuSGVscFBvaW50ID0gSGVscFBvaW50O1xyXG5cclxuSGVscFBvaW50LmVuYWJsZUFsbCA9IGZ1bmN0aW9uIGVuYWJsZUFsbChpbkNvbnRhaW5lcikge1xyXG5cclxuICAgICQoaW5Db250YWluZXIgfHwgZG9jdW1lbnQpLmZpbmQoJy5IZWxwUG9pbnQnKS50b0FycmF5KCkuZm9yRWFjaChIZWxwUG9pbnQpO1xyXG59O1xyXG4iLCIvKiogSW1wbGVtZW50cyBhIHNpbWlsYXIgTGNVcmwgb2JqZWN0IGxpa2UgdGhlIHNlcnZlci1zaWRlIG9uZSwgYmFzaW5nXHJcbiAgICBpbiB0aGUgaW5mb3JtYXRpb24gYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGF0ICdodG1sJyB0YWcgaW4gdGhlIFxyXG4gICAgJ2RhdGEtYmFzZS11cmwnIGF0dHJpYnV0ZSAodGhhdHMgdmFsdWUgaXMgdGhlIGVxdWl2YWxlbnQgZm9yIEFwcFBhdGgpLFxyXG4gICAgYW5kIHRoZSBsYW5nIGluZm9ybWF0aW9uIGF0ICdkYXRhLWN1bHR1cmUnLlxyXG4gICAgVGhlIHJlc3Qgb2YgVVJMcyBhcmUgYnVpbHQgZm9sbG93aW5nIHRoZSB3aW5kb3cubG9jYXRpb24gYW5kIHNhbWUgcnVsZXNcclxuICAgIHRoYW4gaW4gdGhlIHNlcnZlci1zaWRlIG9iamVjdC5cclxuKiovXHJcblxyXG52YXIgYmFzZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYmFzZS11cmwnKSxcclxuICAgIGxhbmcgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKSxcclxuICAgIGwgPSB3aW5kb3cubG9jYXRpb24sXHJcbiAgICB1cmwgPSBsLnByb3RvY29sICsgJy8vJyArIGwuaG9zdDtcclxuLy8gbG9jYXRpb24uaG9zdCBpbmNsdWRlcyBwb3J0LCBpZiBpcyBub3QgdGhlIGRlZmF1bHQsIHZzIGxvY2F0aW9uLmhvc3RuYW1lXHJcblxyXG5iYXNlID0gYmFzZSB8fCAnLyc7XHJcblxyXG52YXIgTGNVcmwgPSB7XHJcbiAgICBTaXRlVXJsOiB1cmwsXHJcbiAgICBBcHBQYXRoOiBiYXNlLFxyXG4gICAgQXBwVXJsOiB1cmwgKyBiYXNlLFxyXG4gICAgTGFuZ0lkOiBsYW5nLFxyXG4gICAgTGFuZ1BhdGg6IGJhc2UgKyBsYW5nICsgJy8nLFxyXG4gICAgTGFuZ1VybDogdXJsICsgYmFzZSArIGxhbmdcclxufTtcclxuTGNVcmwuTGFuZ1VybCA9IHVybCArIExjVXJsLkxhbmdQYXRoO1xyXG5MY1VybC5Kc29uUGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ0pTT04vJztcclxuTGNVcmwuSnNvblVybCA9IHVybCArIExjVXJsLkpzb25QYXRoO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1VybDsiLCIvKiBMb2Nvbm9taWNzIHNwZWNpZmljIFByaWNlLCBmZWVzIGFuZCBob3VyLXByaWNlIGNhbGN1bGF0aW9uXHJcbiAgICB1c2luZyBzb21lIHN0YXRpYyBtZXRob2RzIGFuZCB0aGUgUHJpY2UgY2xhc3MuXHJcbiovXHJcbnZhciBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG4vKiBDbGFzcyBQcmljZSB0byBjYWxjdWxhdGUgYSB0b3RhbCBwcmljZSBiYXNlZCBvbiBmZWVzIGluZm9ybWF0aW9uIChmaXhlZCBhbmQgcmF0ZSlcclxuICAgIGFuZCBkZXNpcmVkIGRlY2ltYWxzIGZvciBhcHByb3hpbWF0aW9ucy5cclxuKi9cclxuZnVuY3Rpb24gUHJpY2UoYmFzZVByaWNlLCBmZWUsIHJvdW5kZWREZWNpbWFscykge1xyXG4gICAgLy8gZmVlIHBhcmFtZXRlciBjYW4gYmUgYSBmbG9hdCBudW1iZXIgd2l0aCB0aGUgZmVlUmF0ZSBvciBhbiBvYmplY3RcclxuICAgIC8vIHRoYXQgaW5jbHVkZXMgYm90aCBhIGZlZVJhdGUgYW5kIGEgZml4ZWRGZWVBbW91bnRcclxuICAgIC8vIEV4dHJhY3RpbmcgZmVlIHZhbHVlcyBpbnRvIGxvY2FsIHZhcnM6XHJcbiAgICB2YXIgZmVlUmF0ZSA9IDAsIGZpeGVkRmVlQW1vdW50ID0gMDtcclxuICAgIGlmIChmZWUuZml4ZWRGZWVBbW91bnQgfHwgZmVlLmZlZVJhdGUpIHtcclxuICAgICAgICBmaXhlZEZlZUFtb3VudCA9IGZlZS5maXhlZEZlZUFtb3VudCB8fCAwO1xyXG4gICAgICAgIGZlZVJhdGUgPSBmZWUuZmVlUmF0ZSB8fCAwO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgZmVlUmF0ZSA9IGZlZTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGluZzpcclxuICAgIC8vIFRoZSByb3VuZFRvIHdpdGggYSBiaWcgZml4ZWQgZGVjaW1hbHMgaXMgdG8gYXZvaWQgdGhlXHJcbiAgICAvLyBkZWNpbWFsIGVycm9yIG9mIGZsb2F0aW5nIHBvaW50IG51bWJlcnNcclxuICAgIHZhciB0b3RhbFByaWNlID0gbXUuY2VpbFRvKG11LnJvdW5kVG8oYmFzZVByaWNlICogKDEgKyBmZWVSYXRlKSArIGZpeGVkRmVlQW1vdW50LCAxMiksIHJvdW5kZWREZWNpbWFscyk7XHJcbiAgICAvLyBmaW5hbCBmZWUgcHJpY2UgaXMgY2FsY3VsYXRlZCBhcyBhIHN1YnN0cmFjdGlvbiwgYnV0IGJlY2F1c2UgamF2YXNjcmlwdCBoYW5kbGVzXHJcbiAgICAvLyBmbG9hdCBudW1iZXJzIG9ubHksIGEgcm91bmQgb3BlcmF0aW9uIGlzIHJlcXVpcmVkIHRvIGF2b2lkIGFuIGlycmF0aW9uYWwgbnVtYmVyXHJcbiAgICB2YXIgZmVlUHJpY2UgPSBtdS5yb3VuZFRvKHRvdGFsUHJpY2UgLSBiYXNlUHJpY2UsIDIpO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIG9iamVjdCB3aXRoIGZ1bGwgZGV0YWlsczpcclxuICAgIHRoaXMuYmFzZVByaWNlID0gYmFzZVByaWNlO1xyXG4gICAgdGhpcy5mZWVSYXRlID0gZmVlUmF0ZTtcclxuICAgIHRoaXMuZml4ZWRGZWVBbW91bnQgPSBmaXhlZEZlZUFtb3VudDtcclxuICAgIHRoaXMucm91bmRlZERlY2ltYWxzID0gcm91bmRlZERlY2ltYWxzO1xyXG4gICAgdGhpcy50b3RhbFByaWNlID0gdG90YWxQcmljZTtcclxuICAgIHRoaXMuZmVlUHJpY2UgPSBmZWVQcmljZTtcclxufVxyXG5cclxuLyoqIENhbGN1bGF0ZSBhbmQgcmV0dXJucyB0aGUgcHJpY2UgYW5kIHJlbGV2YW50IGRhdGEgYXMgYW4gb2JqZWN0IGZvclxyXG50aW1lLCBob3VybHlSYXRlICh3aXRoIGZlZXMpIGFuZCB0aGUgaG91cmx5RmVlLlxyXG5UaGUgdGltZSAoQGR1cmF0aW9uKSBpcyB1c2VkICdhcyBpcycsIHdpdGhvdXQgdHJhbnNmb3JtYXRpb24sIG1heWJlIHlvdSBjYW4gcmVxdWlyZVxyXG51c2UgTEMucm91bmRUaW1lVG9RdWFydGVySG91ciBiZWZvcmUgcGFzcyB0aGUgZHVyYXRpb24gdG8gdGhpcyBmdW5jdGlvbi5cclxuSXQgcmVjZWl2ZXMgdGhlIHBhcmFtZXRlcnMgQGhvdXJseVByaWNlIGFuZCBAc3VyY2hhcmdlUHJpY2UgYXMgTEMuUHJpY2Ugb2JqZWN0cy5cclxuQHN1cmNoYXJnZVByaWNlIGlzIG9wdGlvbmFsLlxyXG4qKi9cclxuZnVuY3Rpb24gY2FsY3VsYXRlSG91cmx5UHJpY2UoZHVyYXRpb24sIGhvdXJseVByaWNlLCBzdXJjaGFyZ2VQcmljZSkge1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gc3VyY2hhcmdlLCBnZXQgemVyb3NcclxuICAgIHN1cmNoYXJnZVByaWNlID0gc3VyY2hhcmdlUHJpY2UgfHwgeyB0b3RhbFByaWNlOiAwLCBmZWVQcmljZTogMCwgYmFzZVByaWNlOiAwIH07XHJcbiAgICAvLyBHZXQgaG91cnMgZnJvbSByb3VuZGVkIGR1cmF0aW9uOlxyXG4gICAgdmFyIGhvdXJzID0gbXUucm91bmRUbyhkdXJhdGlvbi50b3RhbEhvdXJzKCksIDIpO1xyXG4gICAgLy8gQ2FsY3VsYXRlIGZpbmFsIHByaWNlc1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3RhbFByaWNlOiAgICAgbXUucm91bmRUbyhob3VybHlQcmljZS50b3RhbFByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS50b3RhbFByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIGZlZVByaWNlOiAgICAgICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLmZlZVByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS5mZWVQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAgbXUucm91bmRUbyhob3VybHlQcmljZS5iYXNlUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLmJhc2VQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBkdXJhdGlvbkhvdXJzOiAgaG91cnNcclxuICAgIH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIFByaWNlOiBQcmljZSxcclxuICAgICAgICBjYWxjdWxhdGVIb3VybHlQcmljZTogY2FsY3VsYXRlSG91cmx5UHJpY2VcclxuICAgIH07IiwiLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNTkzNjM3L2hvdy10by1lc2NhcGUtcmVndWxhci1leHByZXNzaW9uLWluLWphdmFzY3JpcHRcclxuUmVnRXhwLnF1b3RlID0gZnVuY3Rpb24gKHN0cikge1xyXG4gIHJldHVybiAoc3RyICsgJycpLnJlcGxhY2UoLyhbLj8qK14kW1xcXVxcXFwoKXt9fC1dKS9nLCBcIlxcXFwkMVwiKTtcclxufTtcclxuIiwiLyoqXHJcbiAgQSB2ZXJ5IHNpbXBsZSBzbGlkZXIgaW1wbGVtZW50YXRpb24gaW5pdGlhbGx5IGNyZWF0ZWRcclxuICBmb3IgdGhlIHByb3ZpZGVyLXdlbGNvbWUgbGFuZGluZyBwYWdlIGFuZFxyXG4gIG90aGVyIHNpbWlsYXIgdXNlcy5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vUmVnRXhwLnF1b3RlJyk7XHJcblxyXG52YXIgU2ltcGxlU2xpZGVyID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBTaW1wbGVTbGlkZXIob3B0cykge1xyXG4gICQuZXh0ZW5kKHRydWUsIHRoaXMsIG9wdHMpO1xyXG5cclxuICB0aGlzLmVsZW1lbnQgPSAkKHRoaXMuZWxlbWVudCk7XHJcbiAgdGhpcy5jdXJyZW50SW5kZXggPSAwO1xyXG5cclxuICAvKipcclxuICBBY3Rpb25zIGhhbmRsZXIgdG8gbW92ZSBzbGlkZXNcclxuICAqKi9cclxuICB2YXIgY2hlY2tIcmVmID0gbmV3IFJlZ0V4cCgnXiMnICsgUmVnRXhwLnF1b3RlKHRoaXMuaHJlZlByZWZpeCkgKyAnKC4qKScpLFxyXG4gICAgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5lbGVtZW50Lm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGhyZWYgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG4gICAgdmFyIHJlcyA9IGNoZWNrSHJlZi5leGVjKGhyZWYpO1xyXG5cclxuICAgIGlmIChyZXMgJiYgcmVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgdmFyIGluZGV4ID0gcmVzWzFdO1xyXG4gICAgICBpZiAoaW5kZXggPT0gJ3ByZXZpb3VzJykge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZSh0aGF0LmN1cnJlbnRJbmRleCAtIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGluZGV4ID09ICduZXh0Jykge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZSh0aGF0LmN1cnJlbnRJbmRleCArIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKC9cXGQrLy50ZXN0KGluZGV4KSkge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZShwYXJzZUludChpbmRleCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogRG8gYWxsIHRoZSBzZXR1cCBvbiBzbGlkZXIgYW5kIHNsaWRlc1xyXG4gIHRvIGVuc3VyZSB0aGUgbW92ZW1lbnQgd2lsbCB3b3JrIGZpbmUuXHJcbiAgSXRzIGRvbmUgYXV0b21hdGljIG9uXHJcbiAgaW5pdGlhbGl6aW5nLCBpcyBqdXN0IGEgcHVibGljIG1ldGhvZCBmb3IgXHJcbiAgY29udmVuaWVuY2UgKG1heWJlIHRvIGJlIGNhbGwgaWYgc2xpZGVzIGFyZVxyXG4gIGFkZGVkL3JlbW92ZWQgYWZ0ZXIgaW5pdCkuXHJcbiAgKiovXHJcbiAgdGhpcy5yZWRyYXcgPSBmdW5jdGlvbiBzbGlkZXNSZXBvc2l0aW9uKCkge1xyXG4gICAgdmFyIHNsaWRlcyA9IHRoaXMuZ2V0U2xpZGVzKCksXHJcbiAgICAgIGMgPSB0aGlzLmdldFNsaWRlc0NvbnRhaW5lcigpO1xyXG4gICAgLy8gTG9vayBmb3IgdGhlIGNvbnRhaW5lciBzaXplLCBmcm9tIHRoZSBcclxuICAgIC8vIGJpZ2dlciBzbGlkZTpcclxuICAgIHZhciBcclxuICAgICAgdyA9IDAsXHJcbiAgICAgIGggPSAwO1xyXG4gICAgc2xpZGVzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgXHJcbiAgICAgICAgdCA9ICQodGhpcyksXHJcbiAgICAgICAgdHcgPSB0Lm91dGVyV2lkdGgoKSxcclxuICAgICAgICB0aCA9IHQub3V0ZXJIZWlnaHQoKTtcclxuICAgICAgaWYgKHR3ID4gdylcclxuICAgICAgICB3ID0gdHc7XHJcbiAgICAgIGlmICh0aCA+IGgpXHJcbiAgICAgICAgaCA9IHRoO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ1NTIHNldHVwLCBcclxuICAgIC8vIGFsbCBzbGlkZXMgaW4gdGhlIHNhbWUgbGluZSxcclxuICAgIC8vIGFsbCB3aXRoIHNhbWUgc2l6ZSAoZXh0cmEgc3BhY2luZyBjYW5cclxuICAgIC8vIGJlIGdpdmVuIHdpdGggQ1NTKVxyXG4gICAgYy5jc3Moe1xyXG4gICAgICB3aWR0aDogdyAtIChjLm91dGVyV2lkdGgoKSAtIGMud2lkdGgoKSksXHJcbiAgICAgIC8vaGVpZ2h0OiBoIC0gKGMub3V0ZXJIZWlnaHQoKSAtIGMuaGVpZ2h0KCkpLFxyXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxyXG4gICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgc2xpZGVzLmNzcyh7XHJcbiAgICAgIHdoaXRlU3BhY2U6ICdub3JtYWwnLFxyXG4gICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ1xyXG4gICAgfSkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgdC5jc3Moe1xyXG4gICAgICAgIHdpZHRoOiB3IC0gKHQub3V0ZXJXaWR0aCgpIC0gdC53aWR0aCgpKVxyXG4gICAgICAgIC8vLGhlaWdodDogaCAtICh0Lm91dGVySGVpZ2h0KCkgLSB0LmhlaWdodCgpKVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlcG9zaXRpb25hdGUgYXQgdGhlIGJlZ2dpbmluZzpcclxuICAgIGNbMF0uc2Nyb2xsTGVmdCA9IDA7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR28gdG8gYSBzbGlkZSBieSBpbmRleFxyXG4gICoqL1xyXG4gIHRoaXMuZ29TbGlkZSA9IGZ1bmN0aW9uIGdvU2xpZGUoaW5kZXgpIHtcclxuICAgIHZhciBwcmV2ID0gdGhpcy5jdXJyZW50SW5kZXg7XHJcbiAgICBpZiAocHJldiA9PSBpbmRleClcclxuICAgICAgcmV0dXJuO1xyXG5cclxuICAgIC8vIENoZWNrIGJvdW5kc1xyXG4gICAgaWYgKGluZGV4IDwgMSlcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgdmFyIHNsaWRlcyA9IHRoaXMuZ2V0U2xpZGVzKCk7XHJcbiAgICBpZiAoaW5kZXggPiBzbGlkZXMubGVuZ3RoKVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgLy8gR29vZCBpbmRleCwgc2V0IGFzIGN1cnJlbnRcclxuICAgIHRoaXMuY3VycmVudEluZGV4ID0gaW5kZXg7XHJcbiAgICAvLyBTZXQgbGlua3MgdG8gdGhpcyBhcyBjdXJyZW50LCByZW1vdmluZyBhbnkgcHJldmlvdXM6XHJcbiAgICB0aGlzLmVsZW1lbnQuZmluZCgnW2hyZWY9IycgKyB0aGlzLmhyZWZQcmVmaXggKyBpbmRleCArICddJylcclxuICAgIC5hZGRDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKVxyXG4gICAgLnBhcmVudCgnbGknKS5hZGRDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKTtcclxuICAgIHRoaXMuZWxlbWVudC5maW5kKCdbaHJlZj0jJyArIHRoaXMuaHJlZlByZWZpeCArIHByZXYgKyAnXScpXHJcbiAgICAucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcylcclxuICAgIC5wYXJlbnQoJ2xpJykucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcyk7XHJcblxyXG4gICAgdmFyIFxyXG4gICAgICBzbGlkZSA9ICQoc2xpZGVzLmdldChpbmRleCAtIDEpKSxcclxuICAgICAgYyA9IHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyKCksXHJcbiAgICAgIGxlZnQgPSBjLnNjcm9sbExlZnQoKSArIHNsaWRlLnBvc2l0aW9uKCkubGVmdDtcclxuXHJcbiAgICBjLnN0b3AoKS5hbmltYXRlKHsgc2Nyb2xsTGVmdDogbGVmdCB9LCB0aGlzLmR1cmF0aW9uKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHZXQgdGhlIGpRdWVyeSBjb2xsZWN0aW9uIG9mIHNsaWRlc1xyXG4gICoqL1xyXG4gIHRoaXMuZ2V0U2xpZGVzID0gZnVuY3Rpb24gZ2V0U2xpZGVzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGVzKVxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGUpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR2V0IHRoZSBqUXVlcnkgZWxlbWVudCBmb3IgdGhlIGNvbnRhaW5lciBvZiBzbGlkZXNcclxuICAqKi9cclxuICB0aGlzLmdldFNsaWRlc0NvbnRhaW5lciA9IGZ1bmN0aW9uIGdldFNsaWRlc0NvbnRhaW5lcigpIHtcclxuICAgIHJldHVybiB0aGlzLmVsZW1lbnRcclxuICAgIC5maW5kKHRoaXMuc2VsZWN0b3JzLnNsaWRlcyk7XHJcbiAgfTtcclxuXHJcbiAgLyoqIExhc3QgaW5pdCBzdGVwc1xyXG4gICoqL1xyXG4gIHRoaXMucmVkcmF3KCk7XHJcbn07XHJcblxyXG5TaW1wbGVTbGlkZXIucHJvdG90eXBlID0ge1xyXG4gIGVsZW1lbnQ6IG51bGwsXHJcbiAgc2VsZWN0b3JzOiB7XHJcbiAgICBzbGlkZXM6ICcuc2xpZGVzJyxcclxuICAgIHNsaWRlOiAnbGkuc2xpZGUnXHJcbiAgfSxcclxuICBjdXJyZW50U2xpZGVDbGFzczogJ2pzLWlzQ3VycmVudCcsXHJcbiAgaHJlZlByZWZpeDogJ2dvU2xpZGVfJyxcclxuICAvLyBEdXJhdGlvbiBvZiBlYWNoIHNsaWRlIGluIG1pbGxpc2Vjb25kc1xyXG4gIGR1cmF0aW9uOiAxMDAwXHJcbn07IiwiLyoqIFBvbHlmaWxsIGZvciBzdHJpbmcuY29udGFpbnNcclxuKiovXHJcbmlmICghKCdjb250YWlucycgaW4gU3RyaW5nLnByb3RvdHlwZSkpXHJcbiAgICBTdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKHN0ciwgc3RhcnRJbmRleCkgeyByZXR1cm4gLTEgIT09IHRoaXMuaW5kZXhPZihzdHIsIHN0YXJ0SW5kZXgpOyB9OyIsIi8qKiA9PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIEEgc2ltcGxlIFN0cmluZyBGb3JtYXRcclxuICogZnVuY3Rpb24gZm9yIGphdmFzY3JpcHRcclxuICogQXV0aG9yOiBJYWdvIExvcmVuem8gU2FsZ3VlaXJvXHJcbiAqIE1vZHVsZTogQ29tbW9uSlNcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaW5nRm9ybWF0KCkge1xyXG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG5cdHZhciBmb3JtYXR0ZWQgPSBhcmdzWzBdO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7JytpKydcXFxcfScsICdnaScpO1xyXG5cdFx0Zm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UocmVnZXhwLCBhcmdzW2krMV0pO1xyXG5cdH1cclxuXHRyZXR1cm4gZm9ybWF0dGVkO1xyXG59OyIsIi8qKlxyXG4gICAgR2VuZXJhbCBhdXRvLWxvYWQgc3VwcG9ydCBmb3IgdGFiczogXHJcbiAgICBJZiB0aGVyZSBpcyBubyBjb250ZW50IHdoZW4gZm9jdXNlZCwgdGhleSB1c2UgdGhlICdyZWxvYWQnIGpxdWVyeSBwbHVnaW5cclxuICAgIHRvIGxvYWQgaXRzIGNvbnRlbnQgLXRhYnMgbmVlZCB0byBiZSBjb25maWd1cmVkIHdpdGggZGF0YS1zb3VyY2UtdXJsIGF0dHJpYnV0ZVxyXG4gICAgaW4gb3JkZXIgdG8ga25vdyB3aGVyZSB0byBmZXRjaCB0aGUgY29udGVudC0uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5yZWxvYWQnKTtcclxuXHJcbi8vIERlcGVuZGVuY3kgVGFiYmVkVVggZnJvbSBESVxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoVGFiYmVkVVgpIHtcclxuICAgIC8vIFRhYmJlZFVYLnNldHVwLnRhYkJvZHlTZWxlY3RvciB8fCAnLnRhYi1ib2R5J1xyXG4gICAgJCgnLnRhYi1ib2R5Jykub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoJHQuY2hpbGRyZW4oKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICR0LnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBUaGlzIGFkZHMgbm90aWZpY2F0aW9ucyB0byB0YWJzIGZyb20gdGhlIFRhYmJlZFVYIHN5c3RlbSB1c2luZ1xyXG4gICAgdGhlIGNoYW5nZXNOb3RpZmljYXRpb24gdXRpbGl0eSB0aGF0IGRldGVjdHMgbm90IHNhdmVkIGNoYW5nZXMgb24gZm9ybXMsXHJcbiAgICBzaG93aW5nIHdhcm5pbmcgbWVzc2FnZXMgdG8gdGhlXHJcbiAgICB1c2VyIGFuZCBtYXJraW5nIHRhYnMgKGFuZCBzdWItdGFicyAvIHBhcmVudC10YWJzIHByb3Blcmx5KSB0b1xyXG4gICAgZG9uJ3QgbG9zdCBjaGFuZ2VzIG1hZGUuXHJcbiAgICBBIGJpdCBvZiBDU1MgZm9yIHRoZSBhc3NpZ25lZCBjbGFzc2VzIHdpbGwgYWxsb3cgZm9yIHZpc3VhbCBtYXJrcy5cclxuXHJcbiAgICBBS0E6IERvbid0IGxvc3QgZGF0YSEgd2FybmluZyBtZXNzYWdlIDstKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxuLy8gVGFiYmVkVVggZGVwZW5kZW5jeSBhcyBESVxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoVGFiYmVkVVgsIHRhcmdldFNlbGVjdG9yKSB7XHJcbiAgICB2YXIgdGFyZ2V0ID0gJCh0YXJnZXRTZWxlY3RvciB8fCAnLmNoYW5nZXMtbm90aWZpY2F0aW9uLWVuYWJsZWQnKTtcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24uaW5pdCh7IHRhcmdldDogdGFyZ2V0IH0pO1xyXG5cclxuICAgIC8vIEFkZGluZyBjaGFuZ2Ugbm90aWZpY2F0aW9uIHRvIHRhYi1ib2R5IGRpdnNcclxuICAgIC8vIChvdXRzaWRlIHRoZSBMQy5DaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzIHRvIGxlYXZlIGl0IGFzIGdlbmVyaWMgYW5kIHNpbXBsZSBhcyBwb3NzaWJsZSlcclxuICAgICQodGFyZ2V0KS5vbignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsICdmb3JtJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQodGhpcykucGFyZW50cygnLnRhYi1ib2R5JykuYWRkQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkaW5nIGNsYXNzIHRvIHRoZSBtZW51IGl0ZW0gKHRhYiB0aXRsZSlcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0uYWRkQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCd0aXRsZScsICQoJyNsY3Jlcy1jaGFuZ2VzLW5vdC1zYXZlZCcpLnRleHQoKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5vbignbGNDaGFuZ2VzTm90aWZpY2F0aW9uU2F2ZVJlZ2lzdGVyZWQnLCAnZm9ybScsIGZ1bmN0aW9uIChlLCBmLCBlbHMsIGZ1bGwpIHtcclxuICAgICAgICBpZiAoZnVsbClcclxuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcudGFiLWJvZHk6bm90KDpoYXMoZm9ybS5oYXMtY2hhbmdlcykpJykucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZpbmcgY2xhc3MgZnJvbSB0aGUgbWVudSBpdGVtICh0YWIgdGl0bGUpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC8vIFRvIGF2b2lkIHVzZXIgYmUgbm90aWZpZWQgb2YgY2hhbmdlcyBhbGwgdGltZSB3aXRoIHRhYiBtYXJrcywgd2UgYWRkZWQgYSAnbm90aWZ5JyBjbGFzc1xyXG4gICAgLy8gb24gdGFicyB3aGVuIGEgY2hhbmdlIG9mIHRhYiBoYXBwZW5zXHJcbiAgICAuZmluZCgnLnRhYi1ib2R5Jykub24oJ3RhYlVuZm9jdXNlZCcsIGZ1bmN0aW9uIChldmVudCwgZm9jdXNlZEN0eCkge1xyXG4gICAgICAgIHZhciBtaSA9IFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW07XHJcbiAgICAgICAgaWYgKG1pLmlzKCcuaGFzLWNoYW5nZXMnKSkge1xyXG4gICAgICAgICAgICBtaS5hZGRDbGFzcygnbm90aWZ5LWNoYW5nZXMnKTsgLy9oYXMtdG9vbHRpcFxyXG4gICAgICAgICAgICAvLyBTaG93IG5vdGlmaWNhdGlvbiBwb3B1cFxyXG4gICAgICAgICAgICB2YXIgZCA9ICQoJzxkaXYgY2xhc3M9XCJ3YXJuaW5nXCI+QDA8L2Rpdj48ZGl2IGNsYXNzPVwiYWN0aW9uc1wiPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJhY3Rpb24gY29udGludWVcIiB2YWx1ZT1cIkAyXCIvPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJhY3Rpb24gc3RvcFwiIHZhbHVlPVwiQDFcIi8+PC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AwL2csIExDLmdldFRleHQoJ2NoYW5nZXMtbm90LXNhdmVkJykpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDEvZywgTEMuZ2V0VGV4dCgndGFiLWhhcy1jaGFuZ2VzLXN0YXktb24nKSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMi9nLCBMQy5nZXRUZXh0KCd0YWItaGFzLWNoYW5nZXMtY29udGludWUtd2l0aG91dC1jaGFuZ2UnKSkpO1xyXG4gICAgICAgICAgICBkLm9uKCdjbGljaycsICcuc3RvcCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHdpbmRvdyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbignY2xpY2snLCAnLmNvbnRpbnVlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2Uod2luZG93KTtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSAnaGFzLWNoYW5nZXMnIHRvIGF2b2lkIGZ1dHVyZSBibG9ja3MgKHVudGlsIG5ldyBjaGFuZ2VzIGhhcHBlbnMgb2YgY291cnNlIDstKVxyXG4gICAgICAgICAgICAgICAgbWkucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJyk7XHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYihmb2N1c2VkQ3R4LnRhYi5nZXQoMCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihkLCB3aW5kb3csICdub3Qtc2F2ZWQtcG9wdXAnLCB7IGNsb3NhYmxlOiBmYWxzZSwgY2VudGVyOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRXZlciByZXR1cm4gZmFsc2UgdG8gc3RvcCBjdXJyZW50IHRhYiBmb2N1c1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdub3RpZnktY2hhbmdlcycpOyAvL2hhcy10b29sdGlwXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIFRhYmJlZFVYOiBUYWJiZWQgaW50ZXJmYWNlIGxvZ2ljOyB3aXRoIG1pbmltYWwgSFRNTCB1c2luZyBjbGFzcyAndGFiYmVkJyBmb3IgdGhlXHJcbmNvbnRhaW5lciwgdGhlIG9iamVjdCBwcm92aWRlcyB0aGUgZnVsbCBBUEkgdG8gbWFuaXB1bGF0ZSB0YWJzIGFuZCBpdHMgc2V0dXBcclxubGlzdGVuZXJzIHRvIHBlcmZvcm0gbG9naWMgb24gdXNlciBpbnRlcmFjdGlvbi5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5oYXNTY3JvbGxCYXInKTtcclxuXHJcbnZhciBUYWJiZWRVWCA9IHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKCdib2R5JykuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicyA+IGxpOm5vdCgudGFicy1zbGlkZXIpID4gYScsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGlmIChUYWJiZWRVWC5mb2N1c1RhYigkdC5hdHRyKCdocmVmJykpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3QgPSAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhhc2ggPSAkdC5hdHRyKCdocmVmJyk7XHJcbiAgICAgICAgICAgICAgICAkKCdodG1sLGJvZHknKS5zY3JvbGxUb3Aoc3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnbW91c2Vkb3duJywgVGFiYmVkVVguc3RhcnRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ21vdXNldXAgbW91c2VsZWF2ZScsIFRhYmJlZFVYLmVuZE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC8vIHRoZSBjbGljayByZXR1cm4gZmFsc2UgaXMgdG8gZGlzYWJsZSBzdGFuZGFyIHVybCBiZWhhdmlvclxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXItbGltaXQnLCAnbW91c2VlbnRlcicsIFRhYmJlZFVYLnN0YXJ0TW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyLWxpbWl0JywgJ21vdXNlbGVhdmUnLCBUYWJiZWRVWC5lbmRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicyA+IGxpLnJlbW92YWJsZScsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIC8vIE9ubHkgb24gZGlyZWN0IGNsaWNrcyB0byB0aGUgdGFiLCB0byBhdm9pZFxyXG4gICAgICAgICAgICAvLyBjbGlja3MgdG8gdGhlIHRhYi1saW5rICh0aGF0IHNlbGVjdC9mb2N1cyB0aGUgdGFiKTpcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0ID09IGUuY3VycmVudFRhcmdldClcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLnJlbW92ZVRhYihudWxsLCB0aGlzKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gSW5pdCBwYWdlIGxvYWRlZCB0YWJiZWQgY29udGFpbmVyczpcclxuICAgICAgICAkKCcudGFiYmVkJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIC8vIENvbnNpc3RlbmNlIGNoZWNrOiB0aGlzIG11c3QgYmUgYSB2YWxpZCBjb250YWluZXIsIHRoaXMgaXMsIG11c3QgaGF2ZSAudGFic1xyXG4gICAgICAgICAgICBpZiAoJHQuY2hpbGRyZW4oJy50YWJzJykubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAvLyBJbml0IHNsaWRlclxyXG4gICAgICAgICAgICBUYWJiZWRVWC5zZXR1cFNsaWRlcigkdCk7XHJcbiAgICAgICAgICAgIC8vIENsZWFuIHdoaXRlIHNwYWNlcyAodGhleSBjcmVhdGUgZXhjZXNpdmUgc2VwYXJhdGlvbiBiZXR3ZWVuIHNvbWUgdGFicylcclxuICAgICAgICAgICAgJCgnLnRhYnMnLCB0aGlzKS5jb250ZW50cygpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhIHRleHQgbm9kZSwgcmVtb3ZlIGl0OlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9kZVR5cGUgPT0gMylcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBtb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgZGlyID0gJHQuaGFzQ2xhc3MoJ3RhYnMtc2xpZGVyLXJpZ2h0JykgPyAxIDogLTE7XHJcbiAgICAgICAgdmFyIHRhYnNTbGlkZXIgPSAkdC5wYXJlbnQoKTtcclxuICAgICAgICB2YXIgdGFicyA9IHRhYnNTbGlkZXIuc2libGluZ3MoJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgdGFic1swXS5zY3JvbGxMZWZ0ICs9IDIwICogZGlyO1xyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYnNTbGlkZXIucGFyZW50KCksIHRhYnMpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBzdGFydE1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciB0YWJzID0gdC5jbG9zZXN0KCcudGFiYmVkJykuY2hpbGRyZW4oJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgLy8gU3RvcCBwcmV2aW91cyBhbmltYXRpb25zOlxyXG4gICAgICAgIHRhYnMuc3RvcCh0cnVlKTtcclxuICAgICAgICB2YXIgc3BlZWQgPSAwLjM7IC8qIHNwZWVkIHVuaXQ6IHBpeGVscy9taWxpc2Vjb25kcyAqL1xyXG4gICAgICAgIHZhciBmeGEgPSBmdW5jdGlvbiAoKSB7IFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYnMucGFyZW50KCksIHRhYnMpOyB9O1xyXG4gICAgICAgIHZhciB0aW1lO1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdyaWdodCcpKSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIGJhc2VkIG9uIHNwZWVkIHdlIHdhbnQgYW5kIGhvdyBtYW55IGRpc3RhbmNlIHRoZXJlIGlzOlxyXG4gICAgICAgICAgICB0aW1lID0gKHRhYnNbMF0uc2Nyb2xsV2lkdGggLSB0YWJzWzBdLnNjcm9sbExlZnQgLSB0YWJzLndpZHRoKCkpICogMSAvIHNwZWVkO1xyXG4gICAgICAgICAgICB0YWJzLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiB0YWJzWzBdLnNjcm9sbFdpZHRoIC0gdGFicy53aWR0aCgpIH0sXHJcbiAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIHN0ZXA6IGZ4YSwgY29tcGxldGU6IGZ4YSwgZWFzaW5nOiAnc3dpbmcnIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIGJhc2VkIG9uIHNwZWVkIHdlIHdhbnQgYW5kIGhvdyBtYW55IGRpc3RhbmNlIHRoZXJlIGlzOlxyXG4gICAgICAgICAgICB0aW1lID0gdGFic1swXS5zY3JvbGxMZWZ0ICogMSAvIHNwZWVkO1xyXG4gICAgICAgICAgICB0YWJzLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiAwIH0sXHJcbiAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIHN0ZXA6IGZ4YSwgY29tcGxldGU6IGZ4YSwgZWFzaW5nOiAnc3dpbmcnIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgZW5kTW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGFiQ29udGFpbmVyID0gJCh0aGlzKS5jbG9zZXN0KCcudGFiYmVkJyk7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpLnN0b3AodHJ1ZSk7XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFiQ29udGFpbmVyKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgY2hlY2tUYWJTbGlkZXJMaW1pdHM6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIHRhYnMpIHtcclxuICAgICAgICB0YWJzID0gdGFicyB8fCB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgLy8gU2V0IHZpc2liaWxpdHkgb2YgdmlzdWFsIGxpbWl0ZXJzOlxyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyLWxpbWl0LWxlZnQnKS50b2dnbGUodGFic1swXS5zY3JvbGxMZWZ0ID4gMCk7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXItbGltaXQtcmlnaHQnKS50b2dnbGUoXHJcbiAgICAgICAgICAgICh0YWJzWzBdLnNjcm9sbExlZnQgKyB0YWJzLndpZHRoKCkpIDwgdGFic1swXS5zY3JvbGxXaWR0aCk7XHJcbiAgICB9LFxyXG4gICAgc2V0dXBTbGlkZXI6IGZ1bmN0aW9uICh0YWJDb250YWluZXIpIHtcclxuICAgICAgICB2YXIgdHMgPSB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlcicpO1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzJykuaGFzU2Nyb2xsQmFyKHsgeDogLTIgfSkuaG9yaXpvbnRhbCkge1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuYWRkQ2xhc3MoJ2hhcy10YWJzLXNsaWRlcicpO1xyXG4gICAgICAgICAgICBpZiAodHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgdHMuY2xhc3NOYW1lID0gJ3RhYnMtc2xpZGVyJztcclxuICAgICAgICAgICAgICAgICQodHMpXHJcbiAgICAgICAgICAgICAgICAvLyBBcnJvd3M6XHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJ0YWJzLXNsaWRlci1sZWZ0IGxlZnRcIiBocmVmPVwiI1wiPiZsdDsmbHQ7PC9hPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJ0YWJzLXNsaWRlci1yaWdodCByaWdodFwiIGhyZWY9XCIjXCI+Jmd0OyZndDs8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXIuYXBwZW5kKHRzKTtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lclxyXG4gICAgICAgICAgICAgICAgLy8gRGVzaW5nIGRldGFpbHM6XHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGRpdiBjbGFzcz1cInRhYnMtc2xpZGVyLWxpbWl0IHRhYnMtc2xpZGVyLWxpbWl0LWxlZnQgbGVmdFwiIGhyZWY9XCIjXCI+PC9kaXY+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGFicy1zbGlkZXItbGltaXQgdGFicy1zbGlkZXItbGltaXQtcmlnaHQgcmlnaHRcIiBocmVmPVwiI1wiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHMuc2hvdygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLnJlbW92ZUNsYXNzKCdoYXMtdGFicy1zbGlkZXInKTtcclxuICAgICAgICAgICAgdHMuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJDb250YWluZXIpO1xyXG4gICAgfSxcclxuICAgIGdldFRhYkNvbnRleHRCeUFyZ3M6IGZ1bmN0aW9uIChhcmdzKSB7XHJcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgdHlwZW9mIChhcmdzWzBdKSA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFiQ29udGV4dChhcmdzWzBdLCBudWxsKTtcclxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJiBhcmdzWzBdLnRhYilcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMF07XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUYWJDb250ZXh0KFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAwID8gYXJnc1swXSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDEgPyBhcmdzWzFdIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMiA/IGFyZ3NbMl0gOiBudWxsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiQ29udGV4dDogZnVuY3Rpb24gKHRhYk9yU2VsZWN0b3IsIG1lbnVpdGVtT3JTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBtaSwgbWEsIHRhYiwgdGFiQ29udGFpbmVyO1xyXG4gICAgICAgIGlmICh0YWJPclNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRhYiA9ICQodGFiT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmICh0YWIubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lciA9IHRhYi5wYXJlbnRzKCcudGFiYmVkOmVxKDApJyk7XHJcbiAgICAgICAgICAgICAgICBtYSA9IHRhYkNvbnRhaW5lci5maW5kKCc+IC50YWJzID4gbGkgPiBhW2hyZWY9IycgKyB0YWIuZ2V0KDApLmlkICsgJ10nKTtcclxuICAgICAgICAgICAgICAgIG1pID0gbWEucGFyZW50KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKG1lbnVpdGVtT3JTZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBtYSA9ICQobWVudWl0ZW1PclNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKG1hLmlzKCdsaScpKSB7XHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hO1xyXG4gICAgICAgICAgICAgICAgbWEgPSBtaS5jaGlsZHJlbignYTplcSgwKScpO1xyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgIG1pID0gbWEucGFyZW50KCk7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lciA9IG1pLmNsb3Nlc3QoJy50YWJiZWQnKTtcclxuICAgICAgICAgICAgdGFiID0gdGFiQ29udGFpbmVyLmZpbmQoJz4udGFiLWJvZHlAMCwgPi50YWItYm9keS1saXN0Pi50YWItYm9keUAwJy5yZXBsYWNlKC9AMC9nLCBtYS5hdHRyKCdocmVmJykpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgdGFiOiB0YWIsIG1lbnVhbmNob3I6IG1hLCBtZW51aXRlbTogbWksIHRhYkNvbnRhaW5lcjogdGFiQ29udGFpbmVyIH07XHJcbiAgICB9LFxyXG4gICAgY2hlY2tUYWJDb250ZXh0OiBmdW5jdGlvbiAoY3R4LCBmdW5jdGlvbm5hbWUsIGFyZ3MsIGlzVGVzdCkge1xyXG4gICAgICAgIGlmICghY3R4LnRhYiB8fCBjdHgudGFiLmxlbmd0aCAhPSAxIHx8XHJcbiAgICAgICAgICAgICFjdHgubWVudWl0ZW0gfHwgY3R4Lm1lbnVpdGVtLmxlbmd0aCAhPSAxIHx8XHJcbiAgICAgICAgICAgICFjdHgudGFiQ29udGFpbmVyIHx8IGN0eC50YWJDb250YWluZXIubGVuZ3RoICE9IDEgfHwgXHJcbiAgICAgICAgICAgICFjdHgubWVudWFuY2hvciB8fCBjdHgubWVudWFuY2hvci5sZW5ndGggIT0gMSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzVGVzdCAmJiBjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdUYWJiZWRVWC4nICsgZnVuY3Rpb25uYW1lICsgJywgYmFkIGFyZ3VtZW50czogJyArIEFycmF5LmpvaW4oYXJncywgJywgJykpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGdldFRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2ZvY3VzVGFiJywgYXJndW1lbnRzLCB0cnVlKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgcmV0dXJuIGN0eC50YWIuZ2V0KDApO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZm9jdXNUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIEdldCBwcmV2aW91cyBmb2N1c2VkIHRhYiwgdHJpZ2dlciAndGFiVW5mb2N1c2VkJyBoYW5kbGVyIHRoYXQgY2FuXHJcbiAgICAgICAgLy8gc3RvcCB0aGlzIGZvY3VzIChyZXR1cm5pbmcgZXhwbGljaXR5ICdmYWxzZScpXHJcbiAgICAgICAgdmFyIHByZXZUYWIgPSBjdHgudGFiLnNpYmxpbmdzKCcuY3VycmVudCcpO1xyXG4gICAgICAgIGlmIChwcmV2VGFiLnRyaWdnZXJIYW5kbGVyKCd0YWJVbmZvY3VzZWQnLCBbY3R4XSkgPT09IGZhbHNlKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIENoZWNrIChmaXJzdCEpIGlmIHRoZXJlIGlzIGEgcGFyZW50IHRhYiBhbmQgZm9jdXMgaXQgdG9vICh3aWxsIGJlIHJlY3Vyc2l2ZSBjYWxsaW5nIHRoaXMgc2FtZSBmdW5jdGlvbilcclxuICAgICAgICB2YXIgcGFyVGFiID0gY3R4LnRhYi5wYXJlbnRzKCcudGFiLWJvZHk6ZXEoMCknKTtcclxuICAgICAgICBpZiAocGFyVGFiLmxlbmd0aCA9PSAxKSB0aGlzLmZvY3VzVGFiKHBhclRhYik7XHJcblxyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2N1cnJlbnQnKSB8fFxyXG4gICAgICAgICAgICBjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2Rpc2FibGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gVW5zZXQgY3VycmVudCBtZW51IGVsZW1lbnRcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2libGluZ3MoJy5jdXJyZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAuZmluZCgnPmEnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIC8vIFNldCBjdXJyZW50IG1lbnUgZWxlbWVudFxyXG4gICAgICAgIGN0eC5tZW51aXRlbS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIGN0eC5tZW51YW5jaG9yLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcblxyXG4gICAgICAgIC8vIEhpZGUgY3VycmVudCB0YWItYm9keVxyXG4gICAgICAgIHByZXZUYWIucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAvLyBTaG93IGN1cnJlbnQgdGFiLWJvZHkgYW5kIHRyaWdnZXIgZXZlbnRcclxuICAgICAgICBjdHgudGFiLmFkZENsYXNzKCdjdXJyZW50JylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJGb2N1c2VkJyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVGFiSW5kZXg6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIHRhYkluZGV4KSB7XHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lcilcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9jdXNUYWIodGhpcy5nZXRUYWJDb250ZXh0KHRhYkNvbnRhaW5lci5maW5kKCc+LnRhYi1ib2R5OmVxKCcgKyB0YWJJbmRleCArICcpJykpKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgLyogRW5hYmxlIGEgdGFiLCBkaXNhYmxpbmcgYWxsIG90aGVycyB0YWJzIC11c2VmdWxsIGluIHdpemFyZCBzdHlsZSBwYWdlcy0gKi9cclxuICAgIGVuYWJsZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2VuYWJsZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICB2YXIgcnRuID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5pcygnLmRpc2FibGVkJykpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGRpc2FibGVkIGNsYXNzIGZyb20gZm9jdXNlZCB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgICAgICBjdHgudGFiLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRW5hYmxlZCcpO1xyXG4gICAgICAgICAgICBjdHgubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgICAgIHJ0biA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEZvY3VzIHRhYjpcclxuICAgICAgICB0aGlzLmZvY3VzVGFiKGN0eCk7XHJcbiAgICAgICAgLy8gRGlzYWJsZWQgdGFicyBhbmQgbWVudSBpdGVtczpcclxuICAgICAgICBjdHgudGFiLnNpYmxpbmdzKCc6bm90KC5kaXNhYmxlZCknKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2Rpc2FibGVkJylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJEaXNhYmxlZCcpO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaWJsaW5ncygnOm5vdCguZGlzYWJsZWQpJylcclxuICAgICAgICAgICAgLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgICAgIHJldHVybiBydG47XHJcbiAgICB9LFxyXG4gICAgc2hvd2hpZGVEdXJhdGlvbjogMCxcclxuICAgIHNob3doaWRlRWFzaW5nOiBudWxsLFxyXG4gICAgc2hvd1RhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3Nob3dUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2hvdyB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgIGN0eC50YWIuc2hvdyh0aGlzLnNob3doaWRlRHVyYXRpb24pO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaG93KHRoaXMuc2hvd2hpZGVFYXNpbmcpO1xyXG4gICAgfSxcclxuICAgIGhpZGVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdoaWRlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNob3cgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICBjdHgudGFiLmhpZGUodGhpcy5zaG93aGlkZUR1cmF0aW9uKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uaGlkZSh0aGlzLnNob3doaWRlRWFzaW5nKTtcclxuICAgIH0sXHJcbiAgICB0YWJCb2R5Q2xhc3NFeGNlcHRpb25zOiB7ICd0YWItYm9keSc6IDAsICd0YWJiZWQnOiAwLCAnY3VycmVudCc6IDAsICdkaXNhYmxlZCc6IDAgfSxcclxuICAgIGNyZWF0ZVRhYjogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgaWROYW1lLCBsYWJlbCkge1xyXG4gICAgICAgIHRhYkNvbnRhaW5lciA9ICQodGFiQ29udGFpbmVyKTtcclxuICAgICAgICAvLyB0YWJDb250YWluZXIgbXVzdCBiZSBvbmx5IG9uZSBhbmQgdmFsaWQgY29udGFpbmVyXHJcbiAgICAgICAgLy8gYW5kIGlkTmFtZSBtdXN0IG5vdCBleGlzdHNcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyLmxlbmd0aCA9PSAxICYmIHRhYkNvbnRhaW5lci5pcygnLnRhYmJlZCcpICYmXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkTmFtZSkgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIHRhYiBkaXY6XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgdGFiLmlkID0gaWROYW1lO1xyXG4gICAgICAgICAgICAvLyBSZXF1aXJlZCBjbGFzc2VzXHJcbiAgICAgICAgICAgIHRhYi5jbGFzc05hbWUgPSBcInRhYi1ib2R5XCI7XHJcbiAgICAgICAgICAgIHZhciAkdGFiID0gJCh0YWIpO1xyXG4gICAgICAgICAgICAvLyBHZXQgYW4gZXhpc3Rpbmcgc2libGluZyBhbmQgY29weSAod2l0aCBzb21lIGV4Y2VwdGlvbnMpIHRoZWlyIGNzcyBjbGFzc2VzXHJcbiAgICAgICAgICAgICQuZWFjaCh0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWItYm9keTplcSgwKScpLmF0dHIoJ2NsYXNzJykuc3BsaXQoL1xccysvKSwgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAgICAgICAgIGlmICghKHYgaW4gVGFiYmVkVVgudGFiQm9keUNsYXNzRXhjZXB0aW9ucykpXHJcbiAgICAgICAgICAgICAgICAgICAgJHRhYi5hZGRDbGFzcyh2KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIEFkZCB0byBjb250YWluZXJcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFwcGVuZCh0YWIpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1lbnUgZW50cnlcclxuICAgICAgICAgICAgdmFyIG1lbnVpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgICAgICAgICAgLy8gQmVjYXVzZSBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdGFiLCBpcyBhIGR5bmFtaWNhbGx5IHJlbW92YWJsZSB0YWI6XHJcbiAgICAgICAgICAgIG1lbnVpdGVtLmNsYXNzTmFtZSA9IFwicmVtb3ZhYmxlXCI7XHJcbiAgICAgICAgICAgIHZhciBtZW51YW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgICAgICBtZW51YW5jaG9yLnNldEF0dHJpYnV0ZSgnaHJlZicsICcjJyArIGlkTmFtZSk7XHJcbiAgICAgICAgICAgIC8vIGxhYmVsIGNhbm5vdCBiZSBudWxsIG9yIGVtcHR5XHJcbiAgICAgICAgICAgICQobWVudWFuY2hvcikudGV4dChpc0VtcHR5U3RyaW5nKGxhYmVsKSA/IFwiVGFiXCIgOiBsYWJlbCk7XHJcbiAgICAgICAgICAgICQobWVudWl0ZW0pLmFwcGVuZChtZW51YW5jaG9yKTtcclxuICAgICAgICAgICAgLy8gQWRkIHRvIHRhYnMgbGlzdCBjb250YWluZXJcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpLmFwcGVuZChtZW51aXRlbSk7XHJcblxyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50LCBvbiB0YWJDb250YWluZXIsIHdpdGggdGhlIG5ldyB0YWIgYXMgZGF0YVxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIudHJpZ2dlckhhbmRsZXIoJ3RhYkNyZWF0ZWQnLCBbdGFiXSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldHVwU2xpZGVyKHRhYkNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFiO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAncmVtb3ZlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBPbmx5IHJlbW92ZSBpZiBpcyBhICdyZW1vdmFibGUnIHRhYlxyXG4gICAgICAgIGlmICghY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdyZW1vdmFibGUnKSAmJiAhY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCd2b2xhdGlsZScpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy8gSWYgdGFiIGlzIGN1cnJlbnRseSBmb2N1c2VkIHRhYiwgY2hhbmdlIHRvIGZpcnN0IHRhYlxyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2N1cnJlbnQnKSlcclxuICAgICAgICAgICAgdGhpcy5mb2N1c1RhYkluZGV4KGN0eC50YWJDb250YWluZXIsIDApO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5yZW1vdmUoKTtcclxuICAgICAgICB2YXIgdGFiaWQgPSBjdHgudGFiLmdldCgwKS5pZDtcclxuICAgICAgICBjdHgudGFiLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnNldHVwU2xpZGVyKGN0eC50YWJDb250YWluZXIpO1xyXG5cclxuICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50LCBvbiB0YWJDb250YWluZXIsIHdpdGggdGhlIHJlbW92ZWQgdGFiIGlkIGFzIGRhdGFcclxuICAgICAgICBjdHgudGFiQ29udGFpbmVyLnRyaWdnZXJIYW5kbGVyKCd0YWJSZW1vdmVkJywgW3RhYmlkXSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgc2V0VGFiVGl0bGU6IGZ1bmN0aW9uICh0YWJPclNlbGVjdG9yLCBuZXdUaXRsZSkge1xyXG4gICAgICAgIHZhciBjdHggPSBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRhYk9yU2VsZWN0b3IpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnc2V0VGFiVGl0bGUnLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2V0IGFuIGVtcHR5IHN0cmluZyBpcyBub3QgYWxsb3dlZCwgcHJlc2VydmUgcHJldmlvdXNseTpcclxuICAgICAgICBpZiAoIWlzRW1wdHlTdHJpbmcobmV3VGl0bGUpKVxyXG4gICAgICAgICAgICBjdHgubWVudWFuY2hvci50ZXh0KG5ld1RpdGxlKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qIE1vcmUgc3RhdGljIHV0aWxpdGllcyAqL1xyXG5cclxuLyoqIExvb2sgdXAgdGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uIGFkZHJlc3MgYW5kIHRyeSB0byBmb2N1cyBhIHRhYiB3aXRoIHRoYXRcclxuICAgIG5hbWUsIGlmIHRoZXJlIGlzIG9uZS5cclxuKiovXHJcblRhYmJlZFVYLmZvY3VzQ3VycmVudExvY2F0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gSWYgdGhlIGN1cnJlbnQgbG9jYXRpb24gaGF2ZSBhIGhhc2ggdmFsdWUgYnV0IGlzIG5vdCBhIEhhc2hCYW5nXHJcbiAgICBpZiAoL14jW14hXS8udGVzdCh3aW5kb3cubG9jYXRpb24uaGFzaCkpIHtcclxuICAgICAgICAvLyBUcnkgZm9jdXMgYSB0YWIgd2l0aCB0aGF0IG5hbWVcclxuICAgICAgICB2YXIgdGFiID0gVGFiYmVkVVguZ2V0VGFiKHdpbmRvdy5sb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICBpZiAodGFiKVxyXG4gICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0YWIpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqIExvb2sgZm9yIHZvbGF0aWxlIHRhYnMgb24gdGhlIHBhZ2UsIGlmIHRoZXkgYXJlXHJcbiAgICBlbXB0eSBvciByZXF1ZXN0aW5nIGJlaW5nICd2b2xhdGl6ZWQnLCByZW1vdmUgaXQuXHJcbioqL1xyXG5UYWJiZWRVWC5jaGVja1ZvbGF0aWxlVGFicyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoJy50YWJiZWQgPiAudGFicyA+IC52b2xhdGlsZScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0YWIgPSBUYWJiZWRVWC5nZXRUYWIobnVsbCwgdGhpcyk7XHJcbiAgICAgICAgaWYgKHRhYiAmJiAoJCh0YWIpLmNoaWxkcmVuKCkubGVuZ3RoID09PSAwIHx8ICQodGFiKS5maW5kKCc6bm90KC50YWJiZWQpIC52b2xhdGl6ZS1teS10YWInKS5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgIFRhYmJlZFVYLnJlbW92ZVRhYih0YWIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGFiYmVkVVg7IiwiLyogc2xpZGVyLXRhYnMgbG9naWMuXHJcbiogRXhlY3V0ZSBpbml0IGFmdGVyIFRhYmJlZFVYLmluaXQgdG8gYXZvaWQgbGF1bmNoIGFuaW1hdGlvbiBvbiBwYWdlIGxvYWQuXHJcbiogSXQgcmVxdWlyZXMgVGFiYmVkVVggdGhyb3VnaHQgREkgb24gJ2luaXQnLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0U2xpZGVyVGFicyhUYWJiZWRVWCkge1xyXG4gICAgJCgnLnRhYmJlZC5zbGlkZXItdGFicycpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyICR0YWJzID0gJHQuY2hpbGRyZW4oJy50YWItYm9keScpO1xyXG4gICAgICAgIHZhciBjID0gJHRhYnNcclxuICAgICAgICAgICAgLndyYXBBbGwoJzxkaXYgY2xhc3M9XCJ0YWItYm9keS1saXN0XCIvPicpXHJcbiAgICAgICAgICAgIC5lbmQoKS5jaGlsZHJlbignLnRhYi1ib2R5LWxpc3QnKTtcclxuICAgICAgICAkdGFicy5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYy5zdG9wKHRydWUsIGZhbHNlKS5hbmltYXRlKHsgc2Nyb2xsTGVmdDogYy5zY3JvbGxMZWZ0KCkgKyAkKHRoaXMpLnBvc2l0aW9uKCkubGVmdCB9LCAxNDAwKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBTZXQgaG9yaXpvbnRhbCBzY3JvbGwgdG8gdGhlIHBvc2l0aW9uIG9mIGN1cnJlbnQgc2hvd2VkIHRhYiwgd2l0aG91dCBhbmltYXRpb24gKGZvciBwYWdlLWluaXQpOlxyXG4gICAgICAgIHZhciBjdXJyZW50VGFiID0gJCgkdC5maW5kKCc+LnRhYnM+bGkuY3VycmVudD5hJykuYXR0cignaHJlZicpKTtcclxuICAgICAgICBjLnNjcm9sbExlZnQoYy5zY3JvbGxMZWZ0KCkgKyBjdXJyZW50VGFiLnBvc2l0aW9uKCkubGVmdCk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIFdpemFyZCBUYWJiZWQgRm9ybXMuXHJcbiAgICBJdCB1c2UgdGFicyB0byBtYW5hZ2UgdGhlIGRpZmZlcmVudCBmb3Jtcy1zdGVwcyBpbiB0aGUgd2l6YXJkLFxyXG4gICAgbG9hZGVkIGJ5IEFKQVggYW5kIGZvbGxvd2luZyB0byB0aGUgbmV4dCB0YWIvc3RlcCBvbiBzdWNjZXNzLlxyXG5cclxuICAgIFJlcXVpcmUgVGFiYmVkVVggdmlhIERJIG9uICdpbml0J1xyXG4gKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKSxcclxuICAgIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0VGFiYmVkV2l6YXJkKFRhYmJlZFVYLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGxvYWRpbmdEZWxheTogMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChcImJvZHlcIikuZGVsZWdhdGUoXCIudGFiYmVkLndpemFyZCAubmV4dFwiLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBmb3JtXHJcbiAgICAgICAgdmFyIGZvcm0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBjdXJyZW50IHdpemFyZCBzdGVwLXRhYlxyXG4gICAgICAgIHZhciBjdXJyZW50U3RlcCA9IGZvcm0uY2xvc2VzdCgnLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgd2l6YXJkIGNvbnRhaW5lclxyXG4gICAgICAgIHZhciB3aXphcmQgPSBmb3JtLmNsb3Nlc3QoJy50YWJiZWQud2l6YXJkJyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgd2l6YXJkLW5leHQtc3RlcFxyXG4gICAgICAgIHZhciBuZXh0U3RlcCA9ICQodGhpcykuZGF0YSgnd2l6YXJkLW5leHQtc3RlcCcpO1xyXG5cclxuICAgICAgICB2YXIgY3R4ID0ge1xyXG4gICAgICAgICAgICBib3g6IGN1cnJlbnRTdGVwLFxyXG4gICAgICAgICAgICBmb3JtOiBmb3JtXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gRmlyc3QgYXQgYWxsLCBpZiB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICAgICAgdmFyIHZhbG9iamVjdCA9IGZvcm0uZGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKHZhbG9iamVjdCAmJiB2YWxvYmplY3QudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5nb1RvU3VtbWFyeUVycm9ycyhmb3JtKTtcclxuICAgICAgICAgICAgLy8gVmFsaWRhdGlvbiBpcyBhY3RpdmVkLCB3YXMgZXhlY3V0ZWQgYW5kIHRoZSByZXN1bHQgaXMgJ2ZhbHNlJzogYmFkIGRhdGEsIHN0b3AgUG9zdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgY3VzdG9tIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgICAgICB2YXIgY3VzdmFsID0gZm9ybS5kYXRhKCdjdXN0b21WYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKGN1c3ZhbCAmJiBjdXN2YWwudmFsaWRhdGUgJiYgY3VzdmFsLnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSk7XHJcbiAgICAgICAgICAgIC8vIGN1c3RvbSB2YWxpZGF0aW9uIG5vdCBwYXNzZWQsIG91dCFcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmFpc2UgZXZlbnRcclxuICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdiZWdpblN1Ym1pdFdpemFyZFN0ZXAnKTtcclxuXHJcbiAgICAgICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgICAgICBjdHgubG9hZGluZ3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwLmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgICAgICB9LCBvcHRpb25zLmxvYWRpbmdEZWxheSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBvayA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBNYXJrIGFzIHNhdmVkOlxyXG4gICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmb3JtLmdldCgwKSk7XHJcblxyXG4gICAgICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IChmb3JtLmF0dHIoJ2FjdGlvbicpIHx8ICcnKSxcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgICAgIGRhdGE6IGZvcm0uc2VyaWFsaXplKCksXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIHN1Y2Nlc3MsIGdvIG5leHQgc3RlcCwgdXNpbmcgY3VzdG9tIEpTT04gQWN0aW9uIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0ub24oJ2FqYXhTdWNjZXNzUG9zdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBuZXh0LXN0ZXBcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbmV4dCBzdGVwIGlzIGludGVybmFsIHVybCAoYSBuZXh0IHdpemFyZCB0YWIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvXiMvLnRlc3QobmV4dFN0ZXApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5leHRTdGVwKS50cmlnZ2VyKCdiZWdpbkxvYWRXaXphcmRTdGVwJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVGFiYmVkVVguZW5hYmxlVGFiKG5leHRTdGVwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5leHRTdGVwKS50cmlnZ2VyKCdlbmRMb2FkV2l6YXJkU3RlcCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBuZXh0LXN0ZXAgVVJJIHRoYXQgaXMgbm90IGludGVybmFsIGxpbmssIHdlIGxvYWQgaXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0VG8obmV4dFN0ZXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRG8gSlNPTiBhY3Rpb24gYnV0IGlmIGlzIG5vdCBKU09OIG9yIHZhbGlkLCBtYW5hZ2UgYXMgSFRNTDpcclxuICAgICAgICAgICAgICAgIGlmICghYWpheENhbGxiYWNrcy5kb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQb3N0ICdtYXliZScgd2FzIHdyb25nLCBodG1sIHdhcyByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9ybSBjb250YWluZXI6IHRoZSBhamF4LWJveC5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhbiBlbXB0eSBkb2N1bWVudCBvciBtYWxmb3JtZWQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvd2luZyBuZXcgaHRtbDpcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50U3RlcC5odG1sKG5ld2h0bWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdGb3JtID0gY3VycmVudFN0ZXA7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50U3RlcC5pcygnZm9ybScpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGb3JtID0gY3VycmVudFN0ZXAuZmluZCgnZm9ybTplcSgwKScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAgICAgICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50c1xyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ3JlbG9hZGVkSHRtbFdpemFyZFN0ZXAnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGFqYXhDYWxsYmFja3MuZXJyb3IsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBhamF4Q2FsbGJhY2tzLmNvbXBsZXRlXHJcbiAgICAgICAgfSkuY29tcGxldGUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdlbmRTdWJtaXRXaXphcmRTdGVwJywgb2spO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKiB0aW1lU3BhbiBjbGFzcyB0byBtYW5hZ2UgdGltZXMsIHBhcnNlLCBmb3JtYXQsIGNvbXB1dGUuXHJcbkl0cyBub3Qgc28gY29tcGxldGUgYXMgdGhlIEMjIG9uZXMgYnV0IGlzIHVzZWZ1bGwgc3RpbGwuXHJcbioqL1xyXG52YXIgVGltZVNwYW4gPSBmdW5jdGlvbiAoZGF5cywgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcykge1xyXG4gICAgdGhpcy5kYXlzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGRheXMpKSB8fCAwO1xyXG4gICAgdGhpcy5ob3VycyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChob3VycykpIHx8IDA7XHJcbiAgICB0aGlzLm1pbnV0ZXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQobWludXRlcykpIHx8IDA7XHJcbiAgICB0aGlzLnNlY29uZHMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoc2Vjb25kcykpIHx8IDA7XHJcbiAgICB0aGlzLm1pbGxpc2Vjb25kcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChtaWxsaXNlY29uZHMpKSB8fCAwO1xyXG5cclxuICAgIC8vIGludGVybmFsIHV0aWxpdHkgZnVuY3Rpb24gJ3RvIHN0cmluZyB3aXRoIHR3byBkaWdpdHMgYWxtb3N0J1xyXG4gICAgZnVuY3Rpb24gdChuKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobiAvIDEwKSArICcnICsgbiAlIDEwO1xyXG4gICAgfVxyXG4gICAgLyoqIFNob3cgb25seSBob3VycyBhbmQgbWludXRlcyBhcyBhIHN0cmluZyB3aXRoIHRoZSBmb3JtYXQgSEg6bW1cclxuICAgICoqL1xyXG4gICAgdGhpcy50b1Nob3J0U3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TaG9ydFN0cmluZygpIHtcclxuICAgICAgICB2YXIgaCA9IHQodGhpcy5ob3VycyksXHJcbiAgICAgICAgICAgIG0gPSB0KHRoaXMubWludXRlcyk7XHJcbiAgICAgICAgcmV0dXJuIChoICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgKyBtKTtcclxuICAgIH07XHJcbiAgICAvKiogU2hvdyB0aGUgZnVsbCB0aW1lIGFzIGEgc3RyaW5nLCBkYXlzIGNhbiBhcHBlYXIgYmVmb3JlIGhvdXJzIGlmIHRoZXJlIGFyZSAyNCBob3VycyBvciBtb3JlXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1N0cmluZygpIHtcclxuICAgICAgICB2YXIgaCA9IHQodGhpcy5ob3VycyksXHJcbiAgICAgICAgICAgIGQgPSAodGhpcy5kYXlzID4gMCA/IHRoaXMuZGF5cy50b1N0cmluZygpICsgVGltZVNwYW4uZGVjaW1hbHNEZWxpbWl0ZXIgOiAnJyksXHJcbiAgICAgICAgICAgIG0gPSB0KHRoaXMubWludXRlcyksXHJcbiAgICAgICAgICAgIHMgPSB0KHRoaXMuc2Vjb25kcyArIHRoaXMubWlsbGlzZWNvbmRzIC8gMTAwMCk7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgZCArXHJcbiAgICAgICAgICAgIGggKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArXHJcbiAgICAgICAgICAgIG0gKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArXHJcbiAgICAgICAgICAgIHMpO1xyXG4gICAgfTtcclxuICAgIHRoaXMudmFsdWVPZiA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3ZhbHVlT2YoKSB7XHJcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB0b3RhbCBtaWxsaXNlY29uZHMgY29udGFpbmVkIGJ5IHRoZSB0aW1lXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5kYXlzICogKDI0ICogMzYwMDAwMCkgK1xyXG4gICAgICAgICAgICB0aGlzLmhvdXJzICogMzYwMDAwMCArXHJcbiAgICAgICAgICAgIHRoaXMubWludXRlcyAqIDYwMDAwICtcclxuICAgICAgICAgICAgdGhpcy5zZWNvbmRzICogMTAwMCArXHJcbiAgICAgICAgICAgIHRoaXMubWlsbGlzZWNvbmRzXHJcbiAgICAgICAgKTtcclxuICAgIH07XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgbWlsbGlzZWNvbmRzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbU1pbGxpc2Vjb25kcyhtaWxsaXNlY29uZHMpIHtcclxuICAgIHZhciBtcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDAsXHJcbiAgICAgICAgcyA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gMTAwMCkgJSA2MCxcclxuICAgICAgICBtID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyA2MDAwMCkgJSA2MCxcclxuICAgICAgICBoID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAzNjAwMDAwKSAlIDI0LFxyXG4gICAgICAgIGQgPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvICgzNjAwMDAwICogMjQpKTtcclxuICAgIHJldHVybiBuZXcgVGltZVNwYW4oZCwgaCwgbSwgcywgbXMpO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgc2Vjb25kc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbVNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tU2Vjb25kcyhzZWNvbmRzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tTWlsbGlzZWNvbmRzKHNlY29uZHMgKiAxMDAwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIG1pbnV0ZXNcclxuKiovXHJcblRpbWVTcGFuLmZyb21NaW51dGVzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbU1pbnV0ZXMobWludXRlcykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbVNlY29uZHMobWludXRlcyAqIDYwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIGhvdXJzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tSG91cnMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tSG91cnMoaG91cnMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21NaW51dGVzKGhvdXJzICogNjApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgZGF5c1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbURheXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tRGF5cyhkYXlzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tSG91cnMoZGF5cyAqIDI0KTtcclxufTtcclxuXHJcbi8vIEZvciBzcGFuaXNoIGFuZCBlbmdsaXNoIHdvcmtzIGdvb2QgJzonIGFzIHVuaXRzRGVsaW1pdGVyIGFuZCAnLicgYXMgZGVjaW1hbERlbGltaXRlclxyXG4vLyBUT0RPOiB0aGlzIG11c3QgYmUgc2V0IGZyb20gYSBnbG9iYWwgTEMuaTE4biB2YXIgbG9jYWxpemVkIGZvciBjdXJyZW50IHVzZXJcclxuVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgPSAnOic7XHJcblRpbWVTcGFuLmRlY2ltYWxzRGVsaW1pdGVyID0gJy4nO1xyXG5UaW1lU3Bhbi5wYXJzZSA9IGZ1bmN0aW9uIChzdHJ0aW1lKSB7XHJcbiAgICBzdHJ0aW1lID0gKHN0cnRpbWUgfHwgJycpLnNwbGl0KHRoaXMudW5pdHNEZWxpbWl0ZXIpO1xyXG4gICAgLy8gQmFkIHN0cmluZywgcmV0dXJucyBudWxsXHJcbiAgICBpZiAoc3RydGltZS5sZW5ndGggPCAyKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIC8vIERlY291cGxlZCB1bml0czpcclxuICAgIHZhciBkLCBoLCBtLCBzLCBtcztcclxuICAgIGggPSBzdHJ0aW1lWzBdO1xyXG4gICAgbSA9IHN0cnRpbWVbMV07XHJcbiAgICBzID0gc3RydGltZS5sZW5ndGggPiAyID8gc3RydGltZVsyXSA6IDA7XHJcbiAgICAvLyBTdWJzdHJhY3RpbmcgZGF5cyBmcm9tIHRoZSBob3VycyBwYXJ0IChmb3JtYXQ6ICdkYXlzLmhvdXJzJyB3aGVyZSAnLicgaXMgZGVjaW1hbHNEZWxpbWl0ZXIpXHJcbiAgICBpZiAoaC5jb250YWlucyh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyKSkge1xyXG4gICAgICAgIHZhciBkaHNwbGl0ID0gaC5zcGxpdCh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyKTtcclxuICAgICAgICBkID0gZGhzcGxpdFswXTtcclxuICAgICAgICBoID0gZGhzcGxpdFsxXTtcclxuICAgIH1cclxuICAgIC8vIE1pbGxpc2Vjb25kcyBhcmUgZXh0cmFjdGVkIGZyb20gdGhlIHNlY29uZHMgKGFyZSByZXByZXNlbnRlZCBhcyBkZWNpbWFsIG51bWJlcnMgb24gdGhlIHNlY29uZHMgcGFydDogJ3NlY29uZHMubWlsbGlzZWNvbmRzJyB3aGVyZSAnLicgaXMgZGVjaW1hbHNEZWxpbWl0ZXIpXHJcbiAgICBtcyA9IE1hdGgucm91bmQocGFyc2VGbG9hdChzLnJlcGxhY2UodGhpcy5kZWNpbWFsc0RlbGltaXRlciwgJy4nKSkgKiAxMDAwICUgMTAwMCk7XHJcbiAgICAvLyBSZXR1cm4gdGhlIG5ldyB0aW1lIGluc3RhbmNlXHJcbiAgICByZXR1cm4gbmV3IFRpbWVTcGFuKGQsIGgsIG0sIHMsIG1zKTtcclxufTtcclxuVGltZVNwYW4uemVybyA9IG5ldyBUaW1lU3BhbigwLCAwLCAwLCAwLCAwKTtcclxuVGltZVNwYW4ucHJvdG90eXBlLmlzWmVybyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2lzWmVybygpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgdGhpcy5kYXlzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5ob3VycyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMubWludXRlcyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMuc2Vjb25kcyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMubWlsbGlzZWNvbmRzID09PSAwXHJcbiAgICApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxNaWxsaXNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbE1pbGxpc2Vjb25kcygpIHtcclxuICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsU2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsU2Vjb25kcygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbE1pbGxpc2Vjb25kcygpIC8gMTAwMCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbE1pbnV0ZXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbE1pbnV0ZXMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxTZWNvbmRzKCkgLyA2MCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbEhvdXJzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxIb3VycygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbE1pbnV0ZXMoKSAvIDYwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsRGF5cyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsRGF5cygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbEhvdXJzKCkgLyAyNCk7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRpbWVTcGFuOyIsIi8qIEV4dHJhIHV0aWxpdGllcyBhbmQgbWV0aG9kcyBcclxuICovXHJcbnZhciBUaW1lU3BhbiA9IHJlcXVpcmUoJy4vVGltZVNwYW4nKTtcclxudmFyIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbi8qKiBTaG93cyB0aW1lIGFzIGEgbGFyZ2Ugc3RyaW5nIHdpdGggdW5pdHMgbmFtZXMgZm9yIHZhbHVlcyBkaWZmZXJlbnQgdGhhbiB6ZXJvLlxyXG4gKiovXHJcbmZ1bmN0aW9uIHNtYXJ0VGltZSh0aW1lKSB7XHJcbiAgICB2YXIgciA9IFtdO1xyXG4gICAgaWYgKHRpbWUuZGF5cyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuZGF5cyArICcgZGF5cycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5kYXlzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIGRheScpO1xyXG4gICAgaWYgKHRpbWUuaG91cnMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLmhvdXJzICsgJyBob3VycycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5ob3VycyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBob3VyJyk7XHJcbiAgICBpZiAodGltZS5taW51dGVzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5taW51dGVzICsgJyBtaW51dGVzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLm1pbnV0ZXMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgbWludXRlJyk7XHJcbiAgICBpZiAodGltZS5zZWNvbmRzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5zZWNvbmRzICsgJyBzZWNvbmRzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLnNlY29uZHMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgc2Vjb25kJyk7XHJcbiAgICBpZiAodGltZS5taWxsaXNlY29uZHMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLm1pbGxpc2Vjb25kcyArICcgbWlsbGlzZWNvbmRzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLm1pbGxpc2Vjb25kcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBtaWxsaXNlY29uZCcpO1xyXG4gICAgcmV0dXJuIHIuam9pbignLCAnKTtcclxufVxyXG5cclxuLyoqIFJvdW5kcyBhIHRpbWUgdG8gdGhlIG5lYXJlc3QgMTUgbWludXRlcyBmcmFnbWVudC5cclxuQHJvdW5kVG8gc3BlY2lmeSB0aGUgTEMucm91bmRpbmdUeXBlRW51bSBhYm91dCBob3cgdG8gcm91bmQgdGhlIHRpbWUgKGRvd24sIG5lYXJlc3Qgb3IgdXApXHJcbioqL1xyXG5mdW5jdGlvbiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyKC8qIFRpbWVTcGFuICovdGltZSwgLyogbWF0aFV0aWxzLnJvdW5kaW5nVHlwZUVudW0gKi9yb3VuZFRvKSB7XHJcbiAgICB2YXIgcmVzdEZyb21RdWFydGVyID0gdGltZS50b3RhbEhvdXJzKCkgJSAwLjI1O1xyXG4gICAgdmFyIGhvdXJzID0gdGltZS50b3RhbEhvdXJzKCk7XHJcbiAgICBpZiAocmVzdEZyb21RdWFydGVyID4gMC4wKSB7XHJcbiAgICAgICAgc3dpdGNoIChyb3VuZFRvKSB7XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5Eb3duOlxyXG4gICAgICAgICAgICAgICAgaG91cnMgLT0gcmVzdEZyb21RdWFydGVyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5OZWFyZXN0OlxyXG4gICAgICAgICAgICAgICAgdmFyIGxpbWl0ID0gMC4yNSAvIDI7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdEZyb21RdWFydGVyID49IGxpbWl0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG91cnMgKz0gKDAuMjUgLSByZXN0RnJvbVF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBob3VycyAtPSByZXN0RnJvbVF1YXJ0ZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLlVwOlxyXG4gICAgICAgICAgICAgICAgaG91cnMgKz0gKDAuMjUgLSByZXN0RnJvbVF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFRpbWVTcGFuLmZyb21Ib3Vycyhob3Vycyk7XHJcbn1cclxuXHJcbi8vIEV4dGVuZCBhIGdpdmVuIFRpbWVTcGFuIG9iamVjdCB3aXRoIHRoZSBFeHRyYSBtZXRob2RzXHJcbmZ1bmN0aW9uIHBsdWdJbihUaW1lU3Bhbikge1xyXG4gICAgVGltZVNwYW4ucHJvdG90eXBlLnRvU21hcnRTdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1NtYXJ0U3RyaW5nKCkgeyByZXR1cm4gc21hcnRUaW1lKHRoaXMpOyB9O1xyXG4gICAgVGltZVNwYW4ucHJvdG90eXBlLnJvdW5kVG9RdWFydGVySG91ciA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3JvdW5kVG9RdWFydGVySG91cigpIHsgcmV0dXJuIHJvdW5kVGltZVRvUXVhcnRlckhvdXIuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTsgfTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgc21hcnRUaW1lOiBzbWFydFRpbWUsXHJcbiAgICAgICAgcm91bmRUb1F1YXJ0ZXJIb3VyOiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyLFxyXG4gICAgICAgIHBsdWdJbjogcGx1Z0luXHJcbiAgICB9O1xyXG4iLCIvKipcclxuICAgQVBJIGZvciBhdXRvbWF0aWMgY3JlYXRpb24gb2YgbGFiZWxzIGZvciBVSSBTbGlkZXJzIChqcXVlcnktdWkpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgdG9vbHRpcHMgPSByZXF1aXJlKCcuL3Rvb2x0aXBzJyksXHJcbiAgICBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyksXHJcbiAgICBUaW1lU3BhbiA9IHJlcXVpcmUoJy4vVGltZVNwYW4nKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG4vKiogQ3JlYXRlIGxhYmVscyBmb3IgYSBqcXVlcnktdWktc2xpZGVyLlxyXG4qKi9cclxuZnVuY3Rpb24gY3JlYXRlKHNsaWRlcikge1xyXG4gICAgLy8gcmVtb3ZlIG9sZCBvbmVzOlxyXG4gICAgdmFyIG9sZCA9IHNsaWRlci5zaWJsaW5ncygnLnVpLXNsaWRlci1sYWJlbHMnKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXInKS5nZXQoMCkgPT0gc2xpZGVyLmdldCgwKSk7XHJcbiAgICB9KS5yZW1vdmUoKTtcclxuICAgIC8vIENyZWF0ZSBsYWJlbHMgY29udGFpbmVyXHJcbiAgICB2YXIgbGFiZWxzID0gJCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbHNcIi8+Jyk7XHJcbiAgICBsYWJlbHMuZGF0YSgndWktc2xpZGVyJywgc2xpZGVyKTtcclxuXHJcbiAgICAvLyBTZXR1cCBvZiB1c2VmdWwgdmFycyBmb3IgbGFiZWwgY3JlYXRpb25cclxuICAgIHZhciBtYXggPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnbWF4JyksXHJcbiAgICAgICAgbWluID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ21pbicpLFxyXG4gICAgICAgIHN0ZXAgPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnc3RlcCcpLFxyXG4gICAgICAgIHN0ZXBzID0gTWF0aC5mbG9vcigobWF4IC0gbWluKSAvIHN0ZXApO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIGFuZCBwb3NpdGlvbmluZyBsYWJlbHNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0ZXBzOyBpKyspIHtcclxuICAgICAgICAvLyBDcmVhdGUgbGFiZWxcclxuICAgICAgICB2YXIgbGJsID0gJCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbFwiPjxzcGFuIGNsYXNzPVwidWktc2xpZGVyLWxhYmVsLXRleHRcIi8+PC9kaXY+Jyk7XHJcbiAgICAgICAgLy8gU2V0dXAgbGFiZWwgd2l0aCBpdHMgdmFsdWVcclxuICAgICAgICB2YXIgbGFiZWxWYWx1ZSA9IG1pbiArIGkgKiBzdGVwO1xyXG4gICAgICAgIGxibC5jaGlsZHJlbignLnVpLXNsaWRlci1sYWJlbC10ZXh0JykudGV4dChsYWJlbFZhbHVlKTtcclxuICAgICAgICBsYmwuZGF0YSgndWktc2xpZGVyLXZhbHVlJywgbGFiZWxWYWx1ZSk7XHJcbiAgICAgICAgLy8gUG9zaXRpb25hdGVcclxuICAgICAgICBwb3NpdGlvbmF0ZShsYmwsIGksIHN0ZXBzKTtcclxuICAgICAgICAvLyBBZGQgdG8gY29udGFpbmVyXHJcbiAgICAgICAgbGFiZWxzLmFwcGVuZChsYmwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZXIgZm9yIGxhYmVscyBjbGljayB0byBzZWxlY3QgaXRzIHBvc2l0aW9uIHZhbHVlXHJcbiAgICBsYWJlbHMub24oJ2NsaWNrJywgJy51aS1zbGlkZXItbGFiZWwnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHZhbCA9ICQodGhpcykuZGF0YSgndWktc2xpZGVyLXZhbHVlJyksXHJcbiAgICAgICAgICAgIHNsaWRlciA9ICQodGhpcykucGFyZW50KCkuZGF0YSgndWktc2xpZGVyJyk7XHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSW5zZXJ0IGxhYmVscyBhcyBhIHNpYmxpbmcgb2YgdGhlIHNsaWRlciAoY2Fubm90IGJlIGluc2VydGVkIGluc2lkZSlcclxuICAgIHNsaWRlci5hZnRlcihsYWJlbHMpO1xyXG59XHJcblxyXG4vKiogUG9zaXRpb25hdGUgdG8gdGhlIGNvcnJlY3QgcG9zaXRpb24gYW5kIHdpZHRoIGFuIFVJIGxhYmVsIGF0IEBsYmxcclxuZm9yIHRoZSByZXF1aXJlZCBwZXJjZW50YWdlLXdpZHRoIEBzd1xyXG4qKi9cclxuZnVuY3Rpb24gcG9zaXRpb25hdGUobGJsLCBpLCBzdGVwcykge1xyXG4gICAgdmFyIHN3ID0gMTAwIC8gc3RlcHM7XHJcbiAgICB2YXIgbGVmdCA9IGkgKiBzdyAtIHN3ICogMC41LFxyXG4gICAgICAgIHJpZ2h0ID0gMTAwIC0gbGVmdCAtIHN3LFxyXG4gICAgICAgIGFsaWduID0gJ2NlbnRlcic7XHJcbiAgICBpZiAoaSA9PT0gMCkge1xyXG4gICAgICAgIGFsaWduID0gJ2xlZnQnO1xyXG4gICAgICAgIGxlZnQgPSAwO1xyXG4gICAgfSBlbHNlIGlmIChpID09IHN0ZXBzKSB7XHJcbiAgICAgICAgYWxpZ24gPSAncmlnaHQnO1xyXG4gICAgICAgIHJpZ2h0ID0gMDtcclxuICAgIH1cclxuICAgIGxibC5jc3Moe1xyXG4gICAgICAgICd0ZXh0LWFsaWduJzogYWxpZ24sXHJcbiAgICAgICAgbGVmdDogbGVmdCArICclJyxcclxuICAgICAgICByaWdodDogcmlnaHQgKyAnJSdcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSB2aXNpYmlsaXR5IG9mIGxhYmVscyBvZiBhIGpxdWVyeS11aS1zbGlkZXIgZGVwZW5kaW5nIGlmIHRoZXkgZml0IGluIHRoZSBhdmFpbGFibGUgc3BhY2UuXHJcblNsaWRlciBuZWVkcyB0byBiZSB2aXNpYmxlLlxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlKHNsaWRlcikge1xyXG4gICAgLy8gR2V0IGxhYmVscyBmb3Igc2xpZGVyXHJcbiAgICB2YXIgbGFiZWxzX2MgPSBzbGlkZXIuc2libGluZ3MoJy51aS1zbGlkZXItbGFiZWxzJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCQodGhpcykuZGF0YSgndWktc2xpZGVyJykuZ2V0KDApID09IHNsaWRlci5nZXQoMCkpO1xyXG4gICAgfSk7XHJcbiAgICB2YXIgbGFiZWxzID0gbGFiZWxzX2MuZmluZCgnLnVpLXNsaWRlci1sYWJlbC10ZXh0Jyk7XHJcblxyXG4gICAgLy8gQXBwbHkgYXV0b3NpemVcclxuICAgIGlmICgoc2xpZGVyLmRhdGEoJ3NsaWRlci1hdXRvc2l6ZScpIHx8IGZhbHNlKS50b1N0cmluZygpID09ICd0cnVlJylcclxuICAgICAgICBhdXRvc2l6ZShzbGlkZXIsIGxhYmVscyk7XHJcblxyXG4gICAgLy8gR2V0IGFuZCBhcHBseSBsYXlvdXRcclxuICAgIHZhciBsYXlvdXRfbmFtZSA9IHNsaWRlci5kYXRhKCdzbGlkZXItbGFiZWxzLWxheW91dCcpIHx8ICdzdGFuZGFyZCcsXHJcbiAgICAgICAgbGF5b3V0ID0gbGF5b3V0X25hbWUgaW4gbGF5b3V0cyA/IGxheW91dHNbbGF5b3V0X25hbWVdIDogbGF5b3V0cy5zdGFuZGFyZDtcclxuICAgIGxhYmVsc19jLmFkZENsYXNzKCdsYXlvdXQtJyArIGxheW91dF9uYW1lKTtcclxuICAgIGxheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0b29sdGlwc1xyXG4gICAgdG9vbHRpcHMuY3JlYXRlVG9vbHRpcChsYWJlbHNfYy5jaGlsZHJlbigpLCB7XHJcbiAgICAgICAgdGl0bGU6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICQodGhpcykudGV4dCgpOyB9XHJcbiAgICAgICAgLCBwZXJzaXN0ZW50OiB0cnVlXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gYXV0b3NpemUoc2xpZGVyLCBsYWJlbHMpIHtcclxuICAgIHZhciB0b3RhbF93aWR0aCA9IDA7XHJcbiAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdG90YWxfd2lkdGggKz0gJCh0aGlzKS5vdXRlcldpZHRoKHRydWUpO1xyXG4gICAgfSk7XHJcbiAgICB2YXIgYyA9IHNsaWRlci5jbG9zZXN0KCcudWktc2xpZGVyLWNvbnRhaW5lcicpLFxyXG4gICAgICAgIG1heCA9IHBhcnNlRmxvYXQoYy5jc3MoJ21heC13aWR0aCcpKSxcclxuICAgICAgICBtaW4gPSBwYXJzZUZsb2F0KGMuY3NzKCdtaW4td2lkdGgnKSk7XHJcbiAgICBpZiAobWF4ICE9IE51bWJlci5OYU4gJiYgdG90YWxfd2lkdGggPiBtYXgpXHJcbiAgICAgICAgdG90YWxfd2lkdGggPSBtYXg7XHJcbiAgICBpZiAobWluICE9IE51bWJlci5OYU4gJiYgdG90YWxfd2lkdGggPCBtaW4pXHJcbiAgICAgICAgdG90YWxfd2lkdGggPSBtaW47XHJcbiAgICBjLndpZHRoKHRvdGFsX3dpZHRoKTtcclxufVxyXG5cclxuLyoqIFNldCBvZiBkaWZmZXJlbnQgbGF5b3V0cyBmb3IgbGFiZWxzLCBhbGxvd2luZyBkaWZmZXJlbnQga2luZHMgb2YgXHJcbnBsYWNlbWVudCBhbmQgdmlzdWFsaXphdGlvbiB1c2luZyB0aGUgc2xpZGVyIGRhdGEgb3B0aW9uICdsYWJlbHMtbGF5b3V0Jy5cclxuVXNlZCBieSAndXBkYXRlJywgYWxtb3N0IHRoZSAnc3RhbmRhcmQnIG11c3QgZXhpc3QgYW5kIGNhbiBiZSBpbmNyZWFzZWRcclxuZXh0ZXJuYWxseVxyXG4qKi9cclxudmFyIGxheW91dHMgPSB7fTtcclxuLyoqIFNob3cgdGhlIG1heGltdW0gbnVtYmVyIG9mIGxhYmVscyBpbiBlcXVhbGx5IHNpemVkIGdhcHMgYnV0XHJcbnRoZSBsYXN0IGxhYmVsIHRoYXQgaXMgZW5zdXJlZCB0byBiZSBzaG93ZWQgZXZlbiBpZiBpdCBjcmVhdGVzXHJcbmEgaGlnaGVyIGdhcCB3aXRoIHRoZSBwcmV2aW91cyBvbmUuXHJcbioqL1xyXG5sYXlvdXRzLnN0YW5kYXJkID0gZnVuY3Rpb24gc3RhbmRhcmRfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscykge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlcmUgYXJlIG1vcmUgbGFiZWxzIHRoYW4gYXZhaWxhYmxlIHNwYWNlXHJcbiAgICAvLyBHZXQgbWF4aW11bSBsYWJlbCB3aWR0aFxyXG4gICAgdmFyIGl0ZW1fd2lkdGggPSAwO1xyXG4gICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0dyA9ICQodGhpcykub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgICAgICBpZiAodHcgPj0gaXRlbV93aWR0aClcclxuICAgICAgICAgICAgaXRlbV93aWR0aCA9IHR3O1xyXG4gICAgfSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyB3aWR0aCwgaWYgbm90LCBlbGVtZW50IGlzIG5vdCB2aXNpYmxlIGNhbm5vdCBiZSBjb21wdXRlZFxyXG4gICAgaWYgKGl0ZW1fd2lkdGggPiAwKSB7XHJcbiAgICAgICAgLy8gR2V0IHRoZSByZXF1aXJlZCBzdGVwcGluZyBvZiBsYWJlbHNcclxuICAgICAgICB2YXIgbGFiZWxzX3N0ZXAgPSBNYXRoLmNlaWwoaXRlbV93aWR0aCAvIChzbGlkZXIud2lkdGgoKSAvIGxhYmVscy5sZW5ndGgpKSxcclxuICAgICAgICBsYWJlbHNfc3RlcHMgPSBsYWJlbHMubGVuZ3RoIC8gbGFiZWxzX3N0ZXA7XHJcbiAgICAgICAgaWYgKGxhYmVsc19zdGVwID4gMSkge1xyXG4gICAgICAgICAgICAvLyBIaWRlIHRoZSBsYWJlbHMgb24gcG9zaXRpb25zIG91dCBvZiB0aGUgc3RlcFxyXG4gICAgICAgICAgICB2YXIgbmV3aSA9IDAsXHJcbiAgICAgICAgICAgICAgICBsaW1pdCA9IGxhYmVscy5sZW5ndGggLSAxIC0gbGFiZWxzX3N0ZXA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFiZWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGJsID0gJChsYWJlbHNbaV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKChpICsgMSkgPCBsYWJlbHMubGVuZ3RoICYmIChcclxuICAgICAgICAgICAgICAgICAgICBpICUgbGFiZWxzX3N0ZXAgfHxcclxuICAgICAgICAgICAgICAgICAgICBpID4gbGltaXQpKVxyXG4gICAgICAgICAgICAgICAgICAgIGxibC5oaWRlKCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3dcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gbGJsLnNob3coKS5wYXJlbnQoKS5hZGRDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcG9zaXRpb25hdGUgcGFyZW50XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcG9zaXRpb25hdGUocGFyZW50LCBuZXdpLCBsYWJlbHNfc3RlcHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld2krKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuLyoqIFNob3cgbGFiZWxzIG51bWJlciB2YWx1ZXMgZm9ybWF0dGVkIGFzIGhvdXJzLCB3aXRoIG9ubHlcclxuaW50ZWdlciBob3VycyBiZWluZyBzaG93ZWQsIHRoZSBtYXhpbXVtIG51bWJlciBvZiBpdC5cclxuKiovXHJcbmxheW91dHMuaG91cnMgPSBmdW5jdGlvbiBob3Vyc19sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzLCBzaG93X2FsbCkge1xyXG4gICAgdmFyIGludExhYmVscyA9IHNsaWRlci5maW5kKCcuaW50ZWdlci1ob3VyJyk7XHJcbiAgICBpZiAoIWludExhYmVscy5sZW5ndGgpIHtcclxuICAgICAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGlmICghJHQuZGF0YSgnaG91ci1wcm9jZXNzZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHYgPSBwYXJzZUZsb2F0KCR0LnRleHQoKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodiAhPSBOdW1iZXIuTmFOKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdiA9IG11LnJvdW5kVG8odiwgMik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYgJSAxID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnZGVjaW1hbC1ob3VyJykuaGlkZSgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ICUgMC41ID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQucGFyZW50KCkuYWRkQ2xhc3MoJ3N0cm9uZycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC50ZXh0KFRpbWVTcGFuLmZyb21Ib3Vycyh2KS50b1Nob3J0U3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdpbnRlZ2VyLWhvdXInKS5zaG93KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW50TGFiZWxzID0gaW50TGFiZWxzLmFkZCgkdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnaG91ci1wcm9jZXNzZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKHNob3dfYWxsICE9PSB0cnVlKVxyXG4gICAgICAgIGxheW91dHMuc3RhbmRhcmQoc2xpZGVyLCBpbnRMYWJlbHMucGFyZW50KCksIGludExhYmVscyk7XHJcbn07XHJcbmxheW91dHNbJ2FsbC12YWx1ZXMnXSA9IGZ1bmN0aW9uIGFsbF9sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKSB7XHJcbiAgICAvLyBTaG93aW5nIGFsbCBsYWJlbHNcclxuICAgIGxhYmVsc19jLnNob3coKS5hZGRDbGFzcygndmlzaWJsZScpLmNoaWxkcmVuKCkuc2hvdygpO1xyXG59O1xyXG5sYXlvdXRzWydhbGwtaG91cnMnXSA9IGZ1bmN0aW9uIGFsbF9ob3Vyc19sYXlvdXQoKSB7XHJcbiAgICAvLyBKdXN0IHVzZSBob3VycyBsYXlvdXQgYnV0IHNob3dpbmcgYWxsIGludGVnZXIgaG91cnNcclxuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwoYXJndW1lbnRzLCB0cnVlKTtcclxuICAgIGxheW91dHMuaG91cnMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY3JlYXRlOiBjcmVhdGUsXHJcbiAgICB1cGRhdGU6IHVwZGF0ZSxcclxuICAgIGxheW91dHM6IGxheW91dHNcclxufTtcclxuIiwiLyogU2V0IG9mIGNvbW1vbiBMQyBjYWxsYmFja3MgZm9yIG1vc3QgQWpheCBvcGVyYXRpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG52YXIgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIEFLQTogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25FcnJvcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIC8vIElmIGlzIGEgY29ubmVjdGlvbiBhYm9ydGVkLCBubyBzaG93IG1lc3NhZ2UuXHJcbiAgICAvLyByZWFkeVN0YXRlIGRpZmZlcmVudCB0byAnZG9uZTo0JyBtZWFucyBhYm9ydGVkIHRvbywgXHJcbiAgICAvLyBiZWNhdXNlIHdpbmRvdyBiZWluZyBjbG9zZWQvbG9jYXRpb24gY2hhbmdlZFxyXG4gICAgaWYgKG1lc3NhZ2UgPT0gJ2Fib3J0JyB8fCBqeC5yZWFkeVN0YXRlICE9IDQpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIHZhciBtID0gbWVzc2FnZTtcclxuICAgIHZhciBpZnJhbWUgPSBudWxsO1xyXG4gICAgc2l6ZSA9IHBvcHVwLnNpemUoJ2xhcmdlJyk7XHJcbiAgICBzaXplLmhlaWdodCAtPSAzNDtcclxuICAgIGlmIChtID09ICdlcnJvcicpIHtcclxuICAgICAgICBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoangucmVzcG9uc2VUZXh0LCBzaXplKTtcclxuICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgIG0gPSBudWxsO1xyXG4gICAgfSAgZWxzZVxyXG4gICAgICAgIG0gPSBtICsgXCI7IFwiICsgZXg7XHJcblxyXG4gICAgLy8gQmxvY2sgYWxsIHdpbmRvdywgbm90IG9ubHkgY3VycmVudCBlbGVtZW50XHJcbiAgICAkLmJsb2NrVUkoZXJyb3JCbG9jayhtLCBudWxsLCBwb3B1cC5zdHlsZShzaXplKSkpO1xyXG4gICAgaWYgKGlmcmFtZSlcclxuICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICQoJy5ibG9ja1VJIC5jbG9zZS1wb3B1cCcpLmNsaWNrKGZ1bmN0aW9uICgpIHsgJC51bmJsb2NrVUkoKTsgcmV0dXJuIGZhbHNlOyB9KTtcclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkNvbXBsZXRlKCkge1xyXG4gICAgLy8gRGlzYWJsZSBsb2FkaW5nXHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5ndGltZXIgfHwgdGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgLy8gVW5ibG9ja1xyXG4gICAgaWYgKHRoaXMuYXV0b1VuYmxvY2tMb2FkaW5nKSB7XHJcbiAgICAgICAgLy8gRG91YmxlIHVuLWxvY2ssIGJlY2F1c2UgYW55IG9mIHRoZSB0d28gc3lzdGVtcyBjYW4gYmVpbmcgdXNlZDpcclxuICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh0aGlzLmJveCk7XHJcbiAgICAgICAgdGhpcy5ib3gudW5ibG9jaygpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICB2YXIgY3R4ID0gdGhpcztcclxuICAgIC8vIFN1cHBvcnRlZCB0aGUgZ2VuZXJpYyBjdHguZWxlbWVudCBmcm9tIGpxdWVyeS5yZWxvYWRcclxuICAgIGlmIChjdHguZWxlbWVudCkgY3R4LmZvcm0gPSBjdHguZWxlbWVudDtcclxuICAgIC8vIFNwZWNpZmljIHN0dWZmIG9mIGFqYXhGb3Jtc1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgaWYgKCFkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkpIHtcclxuICAgICAgICAvLyBQb3N0ICdtYXliZScgd2FzIHdyb25nLCBodG1sIHdhcyByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgXHJcbiAgICAgICAgLy8gZm9ybSBjb250YWluZXI6IHRoZSBhamF4LWJveC5cclxuXHJcbiAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgICAgIC8vIEF2b2lkIGVtcHR5IGRvY3VtZW50cyBiZWluZyBwYXJzZWQgKHJhaXNlIGVycm9yKVxyXG4gICAgICAgIGlmICgkLnRyaW0oZGF0YSkpIHtcclxuICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGEgbWFsZm9ybWVkIGRvY3VtZW50IGlzIHJldHVybmVkOlxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKGRhdGEpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRm9yICdyZWxvYWQnIHN1cHBvcnQsIGNoZWNrIHRvbyB0aGUgY29udGV4dC5tb2RlLCBhbmQgYm90aCByZWxvYWQgb3IgYWpheEZvcm1zIGNoZWNrIGRhdGEgYXR0cmlidXRlIHRvb1xyXG4gICAgICAgIGN0eC5ib3hJc0NvbnRhaW5lciA9IGN0eC5ib3hJc0NvbnRhaW5lcjtcclxuICAgICAgICB2YXIgcmVwbGFjZUJveENvbnRlbnQgPVxyXG4gICAgICAgICAgKGN0eC5vcHRpb25zICYmIGN0eC5vcHRpb25zLm1vZGUgPT09ICdyZXBsYWNlLWNvbnRlbnQnKSB8fFxyXG4gICAgICAgICAgY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JztcclxuXHJcbiAgICAgICAgLy8gU3VwcG9ydCBmb3IgcmVsb2FkLCBhdm9pZGluZyBpbXBvcnRhbnQgYnVncyB3aXRoIHJlbG9hZGluZyBib3hlcyB0aGF0IGNvbnRhaW5zIGZvcm1zOlxyXG4gICAgICAgIC8vIElmIG9wZXJhdGlvbiBpcyBhIHJlbG9hZCwgZG9uJ3QgY2hlY2sgdGhlIGFqYXgtYm94XHJcbiAgICAgICAgdmFyIGpiID0gbmV3aHRtbDtcclxuICAgICAgICBpZiAoIWN0eC5pc1JlbG9hZCkge1xyXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHJldHVybmVkIGVsZW1lbnQgaXMgdGhlIGFqYXgtYm94LCBpZiBub3QsIGZpbmRcclxuICAgICAgICAgIC8vIHRoZSBlbGVtZW50IGluIHRoZSBuZXdodG1sOlxyXG4gICAgICAgICAgamIgPSBuZXdodG1sLmZpbHRlcignLmFqYXgtYm94Jyk7XHJcbiAgICAgICAgICBpZiAoamIubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgICBpZiAoIWN0eC5ib3hJc0NvbnRhaW5lciAmJiAhamIuaXMoJy5hamF4LWJveCcpKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWwuZmluZCgnLmFqYXgtYm94OmVxKDApJyk7XHJcbiAgICAgICAgICBpZiAoIWpiIHx8IGpiLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBhamF4LWJveCwgdXNlIGFsbCBlbGVtZW50IHJldHVybmVkOlxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KVxyXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBib3ggY29udGVudCB3aXRoIHRoZSBjb250ZW50IG9mIHRoZSByZXR1cm5lZCBib3hcclxuICAgICAgICAgICAgLy8gb3IgYWxsIGlmIHRoZXJlIGlzIG5vIGFqYXgtYm94IGluIHRoZSByZXN1bHQuXHJcbiAgICAgICAgICAgIGpiID0gamIuaXMoJy5hamF4LWJveCcpID8gamIuY29udGVudHMoKSA6IGpiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KSB7XHJcbiAgICAgICAgICBjdHguYm94LmVtcHR5KCkuYXBwZW5kKGpiKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGN0eC5ib3hJc0NvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAvLyBqYiBpcyBjb250ZW50IG9mIHRoZSBib3ggY29udGFpbmVyOlxyXG4gICAgICAgICAgICBjdHguYm94Lmh0bWwoamIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGJveCBpcyBjb250ZW50IHRoYXQgbXVzdCBiZSByZXBsYWNlZCBieSB0aGUgbmV3IGNvbnRlbnQ6XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVwbGFjZVdpdGgoamIpO1xyXG4gICAgICAgICAgICAvLyBhbmQgcmVmcmVzaCB0aGUgcmVmZXJlbmNlIHRvIGJveCB3aXRoIHRoZSBuZXcgZWxlbWVudFxyXG4gICAgICAgICAgICBjdHguYm94ID0gamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJdCBzdXBwb3J0cyBub3JtYWwgYWpheCBmb3JtcyBhbmQgc3ViZm9ybXMgdGhyb3VnaCBmaWVsZHNldC5hamF4XHJcbiAgICAgICAgaWYgKGN0eC5ib3guaXMoJ2Zvcm0uYWpheCcpIHx8IGN0eC5ib3guaXMoJ2ZpZWxkc2V0LmFqYXgnKSlcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveDtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmb3JtLmFqYXg6ZXEoMCknKTtcclxuICAgICAgICAgIGlmIChjdHguZm9ybS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmaWVsZHNldC5hamF4OmVxKDApJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gTW92ZSBmb2N1cyB0byB0aGUgZXJyb3JzIGFwcGVhcmVkIG9uIHRoZSBwYWdlIChpZiB0aGVyZSBhcmUpOlxyXG4gICAgICAgIHZhciB2YWxpZGF0aW9uU3VtbWFyeSA9IGpiLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRpb25TdW1tYXJ5Lmxlbmd0aClcclxuICAgICAgICAgIG1vdmVGb2N1c1RvKHZhbGlkYXRpb25TdW1tYXJ5KTtcclxuICAgICAgICAvLyBUT0RPOiBJdCBzZWVtcyB0aGF0IGl0IHJldHVybnMgYSBkb2N1bWVudC1mcmFnbWVudCBpbnN0ZWFkIG9mIGEgZWxlbWVudCBhbHJlYWR5IGluIGRvY3VtZW50XHJcbiAgICAgICAgLy8gZm9yIGN0eC5mb3JtIChtYXliZSBqYiB0b28/KSB3aGVuIHVzaW5nICogY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JyAqIFxyXG4gICAgICAgIC8vIChtYXliZSBvbiBvdGhlciBjYXNlcyB0b28/KS5cclxuICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIFtqYiwgY3R4LmZvcm0sIGp4XSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgbWVzc2FnZSwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCBjdHguZm9ybS5kYXRhKCdzdWNjZXNzLXBvc3QtbWVzc2FnZScpIHx8ICdEb25lISc7XHJcbiAgICBjdHguYm94LmJsb2NrKGluZm9CbG9jayhtZXNzYWdlLCB7XHJcbiAgICAgICAgY3NzOiBwb3B1cC5zdHlsZShwb3B1cC5zaXplKCdzbWFsbCcpKVxyXG4gICAgfSkpXHJcbiAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgXHJcbiAgICB9KTtcclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gc2hvd09rR29Qb3B1cChjdHgsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdiBjbGFzcz1cIm9rLWdvLWJveFwiLz4nKTtcclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxzcGFuIGNsYXNzPVwic3VjY2Vzcy1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLlN1Y2Nlc3NNZXNzYWdlKSk7XHJcbiAgICBpZiAoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSlcclxuICAgICAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWRkaXRpb25hbC1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKSk7XHJcblxyXG4gICAgdmFyIG9rQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gb2stYWN0aW9uIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjb2tcIi8+JykuYXBwZW5kKGRhdGEuT2tMYWJlbCk7XHJcbiAgICB2YXIgZ29CdG4gPSAnJztcclxuICAgIGlmIChkYXRhLkdvVVJMICYmIGRhdGEuR29MYWJlbCkge1xyXG4gICAgICAgIGdvQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gZ28tYWN0aW9uXCIvPicpLmF0dHIoJ2hyZWYnLCBkYXRhLkdvVVJMKS5hcHBlbmQoZGF0YS5Hb0xhYmVsKTtcclxuICAgICAgICAvLyBGb3JjaW5nIHRoZSAnY2xvc2UtYWN0aW9uJyBpbiBzdWNoIGEgd2F5IHRoYXQgZm9yIGludGVybmFsIGxpbmtzIHRoZSBwb3B1cCBnZXRzIGNsb3NlZCBpbiBhIHNhZmUgd2F5OlxyXG4gICAgICAgIGdvQnRuLmNsaWNrKGZ1bmN0aW9uICgpIHsgb2tCdG4uY2xpY2soKTsgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFjdGlvbnMgY2xlYXJmaXhcIi8+JykuYXBwZW5kKG9rQnRuKS5hcHBlbmQoZ29CdG4pKTtcclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGN0eC5ib3gsIG51bGwsIHtcclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpIHtcclxuICAgIC8vIElmIGlzIGEgSlNPTiByZXN1bHQ6XHJcbiAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBpZiAoY3R4ICYmIGN0eC5ib3gpXHJcbiAgICAgICAgICAgIC8vIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzXHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGN0eC5ib3gpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAwOiBnZW5lcmFsIHN1Y2Nlc3MgY29kZSwgc2hvdyBtZXNzYWdlIHNheWluZyB0aGF0ICdhbGwgd2FzIGZpbmUnXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LCBkYXRhKTtcclxuICAgICAgICAgICAgaWYgKGN0eCAmJiBjdHguZm9ybSAmJiBjdHguZm9ybS50cmlnZ2VyKVxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAxOiBkbyBhIHJlZGlyZWN0XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMSkge1xyXG4gICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAyOiBzaG93IGxvZ2luIHBvcHVwICh3aXRoIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIGlmIChjdHggJiYgY3R4LmJsb2NrICYmIGN0eC5ib3gudW5ibG9jaylcclxuICAgICAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAzKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAzOiByZWxvYWQgY3VycmVudCBwYWdlIGNvbnRlbnQgdG8gdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgLy8gTm90ZTogdG8gcmVsb2FkIHNhbWUgdXJsIHBhZ2UgY29udGVudCwgaXMgYmV0dGVyIHJldHVybiB0aGUgaHRtbCBkaXJlY3RseSBmcm9tXHJcbiAgICAgICAgICAgIC8vIHRoaXMgYWpheCBzZXJ2ZXIgcmVxdWVzdC5cclxuICAgICAgICAgICAgLy9jb250YWluZXIudW5ibG9jaygpOyBpcyBibG9ja2VkIGFuZCB1bmJsb2NrZWQgYWdhaW4gYnkgdGhlIHJlbG9hZCBtZXRob2Q6XHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgaWYgKGN0eCAmJiBjdHguYm94ICYmIGN0eC5ib3gucmVsb2FkKVxyXG4gICAgICAgICAgICAgICAgY3R4LmJveC5yZWxvYWQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDQpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyBTdWNjZXNzTWVzc2FnZSwgYXR0YWNoaW5nIGFuZCBldmVudCBoYW5kbGVyIHRvIGdvIHRvIFJlZGlyZWN0VVJMXHJcbiAgICAgICAgICAgIGN0eC5ib3gub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0LlJlZGlyZWN0VVJMKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LlN1Y2Nlc3NNZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA1KSB7XHJcbiAgICAgICAgICAgIC8vIENoYW5nZSBtYWluLWFjdGlvbiBidXR0b24gbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIGJ0biA9IGN0eC5mb3JtLmZpbmQoJy5tYWluLWFjdGlvbicpO1xyXG4gICAgICAgICAgICB2YXIgZG1zZyA9IGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKTtcclxuICAgICAgICAgICAgaWYgKCFkbXNnKVxyXG4gICAgICAgICAgICAgICAgYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcsIGJ0bi50ZXh0KCkpO1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZGF0YS5SZXN1bHQgfHwgYnRuLmRhdGEoJ3N1Y2Nlc3MtcG9zdC10ZXh0JykgfHwgJ0RvbmUhJztcclxuICAgICAgICAgICAgYnRuLnRleHQobXNnKTtcclxuICAgICAgICAgICAgLy8gQWRkaW5nIHN1cHBvcnQgdG8gcmVzZXQgYnV0dG9uIHRleHQgdG8gZGVmYXVsdCBvbmVcclxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgRmlyc3QgbmV4dCBjaGFuZ2VzIGhhcHBlbnMgb24gdGhlIGZvcm06XHJcbiAgICAgICAgICAgICQoY3R4LmZvcm0pLm9uZSgnbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGJ0bi50ZXh0KGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IGZvciBjdXN0b20gaGFuZGxlcnNcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBPay1HbyBhY3Rpb25zIHBvcHVwIHdpdGggJ3N1Y2Nlc3MnIGFuZCAnYWRkaXRpb25hbCcgbWVzc2FnZXMuXHJcbiAgICAgICAgICAgIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDcpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDc6IHNob3cgbWVzc2FnZSBzYXlpbmcgY29udGFpbmVkIGF0IGRhdGEuUmVzdWx0Lk1lc3NhZ2UuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgY29kZSBhbGxvdyBhdHRhY2ggYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpbiBkYXRhLlJlc3VsdCB0byBkaXN0aW5ndWlzaFxyXG4gICAgICAgICAgICAvLyBkaWZmZXJlbnQgcmVzdWx0cyBhbGwgc2hvd2luZyBhIG1lc3NhZ2UgYnV0IG1heWJlIG5vdCBiZWluZyBhIHN1Y2Nlc3MgYXQgYWxsXHJcbiAgICAgICAgICAgIC8vIGFuZCBtYXliZSBkb2luZyBzb21ldGhpbmcgbW9yZSBpbiB0aGUgdHJpZ2dlcmVkIGV2ZW50IHdpdGggdGhlIGRhdGEgb2JqZWN0LlxyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5NZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gOCkge1xyXG4gICAgICAgICAgICAvLyBTaG93IHZhbGlkYXRpb24gbWVzc2FnZXNcclxuICAgICAgICAgICAgdmFyIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKTtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbkhlbHBlci5zZXRFcnJvcnMoY3R4LmZvcm0sIGRhdGEuUmVzdWx0LkVycm9ycyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPiAxMDApIHtcclxuICAgICAgICAgICAgLy8gVXNlciBDb2RlOiB0cmlnZ2VyIGN1c3RvbSBldmVudCB0byBtYW5hZ2UgcmVzdWx0czpcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4LCBjdHhdKTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBkYXRhLkNvZGUgPCAwXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGFuIGVycm9yIGNvZGUuXHJcblxyXG4gICAgICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgICAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKGN0eC5mb3JtLmdldCgwKSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgICAgICAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gXCJFcnJvcjogXCIgKyBkYXRhLkNvZGUgKyBcIjogXCIgKyBKU09OLnN0cmluZ2lmeShkYXRhLlJlc3VsdCA/IChkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgPyBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgOiBkYXRhLlJlc3VsdCkgOiAnJyk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJCgnPGRpdi8+JykuYXBwZW5kKG1lc3NhZ2UpLCBjdHguYm94LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlcnJvcjogbGNPbkVycm9yLFxyXG4gICAgICAgIHN1Y2Nlc3M6IGxjT25TdWNjZXNzLFxyXG4gICAgICAgIGNvbXBsZXRlOiBsY09uQ29tcGxldGUsXHJcbiAgICAgICAgZG9KU09OQWN0aW9uOiBkb0pTT05BY3Rpb25cclxuICAgIH07XHJcbn0iLCIvKiBGb3JtcyBzdWJtaXR0ZWQgdmlhIEFKQVggKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICAgIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGdldFhQYXRoID0gcmVxdWlyZSgnLi9nZXRYUGF0aCcpO1xyXG5cclxualF1ZXJ5ID0gJDtcclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5ncywgd2lsbCBiZSB1cGRhdGVkIG9uIGluaXQgYnV0IGlzIGFjY2Vzc2VkXHJcbi8vIHRocm91Z2ggY2xvc3VyZSBmcm9tIGFsbCBmdW5jdGlvbnMuXHJcbi8vIE5PVEU6IGlzIHN0YXRpYywgZG9lc24ndCBhbGxvd3MgbXVsdGlwbGUgY29uZmlndXJhdGlvbiwgb25lIGluaXQgY2FsbCByZXBsYWNlIHByZXZpb3VzXHJcbi8vIERlZmF1bHRzOlxyXG52YXIgc2V0dGluZ3MgPSB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IDAsXHJcbiAgICBlbGVtZW50OiBkb2N1bWVudFxyXG59O1xyXG5cclxuLy8gQWRhcHRlZCBjYWxsYmFja3NcclxuZnVuY3Rpb24gYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyKCkge1xyXG4gICAgY2FsbGJhY2tzLmNvbXBsZXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFqYXhFcnJvclBvcHVwSGFuZGxlcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0sIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIENvbW1vbiBsb2dpY1xyXG4gICAgY2FsbGJhY2tzLmVycm9yLmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIoKSB7XHJcbiAgY2FsbGJhY2tzLnN1Y2Nlc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuLyoqXHJcbiAgUGVyZm9ybXMgdGhlIHZhbGlkYXRpb24gb24gdGhlIGZvcm0gb3Igc3ViZm9ybSBhcyBkZXRlcm1pbmVcclxuICB0aGUgdmFsdWVzIGluIHRoZSBjb250ZXh0IChAY3R4KSwgcmV0dXJuaW5nIHRydWUgZm9yIHN1Y2Nlc3NcclxuICBhbmQgZmFsc2UgZm9yIHNvbWUgZXJyb3IgKGVsZW1lbnRzIGdldCBtYXJrZWQgd2l0aCB0aGUgZXJyb3IsXHJcbiAganVzdCB0aGUgY2FsbGVyIG11c3Qgc3RvcCBhbnkgdGFzayBvbiBmYWxzZSkuXHJcbioqL1xyXG5mdW5jdGlvbiB2YWxpZGF0ZUZvcm0oY3R4KSB7XHJcbiAgLy8gVmFsaWRhdGlvbnNcclxuICB2YXIgdmFsaWRhdGlvblBhc3NlZCA9IHRydWU7XHJcbiAgLy8gVG8gc3VwcG9ydCBzdWItZm9ybXMgdGhyb3VoIGZpZWxkc2V0LmFqYXgsIHdlIG11c3QgZXhlY3V0ZSB2YWxpZGF0aW9ucyBhbmQgdmVyaWZpY2F0aW9uXHJcbiAgLy8gaW4gdHdvIHN0ZXBzIGFuZCB1c2luZyB0aGUgcmVhbCBmb3JtIHRvIGxldCB2YWxpZGF0aW9uIG1lY2hhbmlzbSB3b3JrXHJcbiAgdmFyIGlzU3ViZm9ybSA9IGN0eC5mb3JtLmlzKCdmaWVsZHNldC5hamF4Jyk7XHJcbiAgdmFyIGFjdHVhbEZvcm0gPSBpc1N1YmZvcm0gPyBjdHguZm9ybS5jbG9zZXN0KCdmb3JtJykgOiBjdHguZm9ybSxcclxuICAgICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBuZXcgalF1ZXJ5KCksXHJcbiAgICAgIGRpc2FibGVkRmllbGRzID0gbmV3IGpRdWVyeSgpO1xyXG5cclxuICAvLyBPbiBzdWJmb3JtIHZhbGlkYXRpb24sIHdlIGRvbid0IHdhbnQgdGhlIG91dHNpZGUgc3ViZm9ybSBlbGVtZW50cyBhbmQgdmFsaWRhdGlvbi1zdW1tYXJ5IGNvbnRyb2xzIHRvIGJlIGFmZmVjdGVkXHJcbiAgLy8gYnkgdGhpcyB2YWxpZGF0aW9uICh0byBhdm9pZCB0byBzaG93IGVycm9ycyB0aGVyZSB0aGF0IGRvZXNuJ3QgaW50ZXJlc3QgdG8gdGhlIHJlc3Qgb2YgdGhlIGZvcm0pXHJcbiAgLy8gVG8gZnVsbGZpbGwgdGhpcyByZXF1aXNpdCwgd2UgbmVlZCB0byBoaWRlIGl0IGZvciB0aGUgdmFsaWRhdG9yIGZvciBhIHdoaWxlIGFuZCBsZXQgb25seSBhZmZlY3RcclxuICAvLyBhbnkgbG9jYWwgc3VtbWFyeSAoaW5zaWRlIHRoZSBzdWJmb3JtKS5cclxuICAvLyBUaGUgc2FtZSBmb3IgZm9ybSBlbGVtZW50cyBvdXRzaWRlIHRoZSBzdWJmb3JtLCB3ZSBkb24ndCB3YW50IGl0cyBlcnJvcnMgZm9yIG5vdy5cclxuICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICB2YXIgb3V0c2lkZUVsZW1lbnRzID0gKGZ1bmN0aW9uKGYpIHtcclxuICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBPbmx5IHRob3NlIHRoYXQgYXJlIG91dHNpZGUgdGhlIHN1YmZvcm1cclxuICAgICAgICByZXR1cm4gISQuY29udGFpbnMoZiwgdGhpcyk7XHJcbiAgICAgIH07XHJcbiAgICB9KShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIGRpc2FibGVkU3VtbWFyaWVzID0gYWN0dWFsRm9ybVxyXG4gICAgLmZpbmQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJylcclxuICAgIC5maWx0ZXIob3V0c2lkZUVsZW1lbnRzKVxyXG4gICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgLy8gKGluIG90aGVyIHdvcmRzLCB1c2luZyAnZGF0YScgd2lsbCBub3Qgd29yaylcclxuICAgIC5hdHRyKCdkYXRhLXZhbG1zZy1zdW1tYXJ5JywgJ2ZhbHNlJyk7XHJcblxyXG4gICAgZGlzYWJsZWRGaWVsZHMgPSBhY3R1YWxGb3JtXHJcbiAgICAuZmluZCgnW2RhdGEtdmFsPXRydWVdJylcclxuICAgIC5maWx0ZXIob3V0c2lkZUVsZW1lbnRzKVxyXG4gICAgLmF0dHIoJ2RhdGEtdmFsJywgJ2ZhbHNlJyk7XHJcbiAgfVxyXG5cclxuICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICB2YXIgdmFsb2JqZWN0ID0gYWN0dWFsRm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycyhjdHguZm9ybSk7XHJcbiAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZS5cclxuICAvLyBDdXN0b20gdmFsaWRhdGlvbiBjYW4gYmUgYXR0YWNoZWQgdG8gZm9ybXMgb3IgZmllbGRzZXQsIGJ1dFxyXG4gIC8vIHRvIHN1cHBvcnQgc3ViZm9ybXMsIG9ubHkgZXhlY3V0ZSBpbiB0aGUgY3R4LmZvcm0gZWxlbWVudCAoY2FuIGJlIFxyXG4gIC8vIGEgZmllbHNldCBzdWJmb3JtKSBhbmQgYW55IGNoaWxkcmVuIGZpZWxkc2V0LlxyXG4gIGN0eC5mb3JtLmFkZChjdHguZm9ybS5maW5kKCdmaWVsZHNldCcpKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjdXN2YWwgPSAkKHRoaXMpLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgIGlmIChjdXN2YWwgJiYgY3VzdmFsLnZhbGlkYXRlICYmIGN1c3ZhbC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgICAgdmFsaWRhdGlvblBhc3NlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3Jtcywgd2UgbXVzdCBjaGVjayB0aGF0IHZhbGlkYXRpb25zIGVycm9ycyBoYXBwZW5lZCBpbnNpZGUgdGhlXHJcbiAgLy8gc3ViZm9ybSBhbmQgbm90IGluIG90aGVyIGVsZW1lbnRzLCB0byBkb24ndCBzdG9wIHN1Ym1pdCBvbiBub3QgcmVsYXRlZCBlcnJvcnMuXHJcbiAgLy8gKHdlIGF2b2lkIGV4ZWN1dGUgdmFsaWRhdGlvbiBvbiB0aGF0IGVsZW1lbnRzIGJ1dCBjb3VsZCBoYXBwZW4gYSBwcmV2aW91cyB2YWxpZGF0aW9uKVxyXG4gIC8vIEp1c3QgbG9vayBmb3IgbWFya2VkIGVsZW1lbnRzOlxyXG4gIGlmIChpc1N1YmZvcm0gJiYgY3R4LmZvcm0uZmluZCgnLmlucHV0LXZhbGlkYXRpb24tZXJyb3InKS5sZW5ndGgpXHJcbiAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcblxyXG4gIC8vIFJlLWVuYWJsZSBhZ2FpbiB0aGF0IHN1bW1hcmllcyBwcmV2aW91c2x5IGRpc2FibGVkXHJcbiAgaWYgKGlzU3ViZm9ybSkge1xyXG4gICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgLy8gKGluIG90aGVyIHdvcmRzLCB1c2luZyAnZGF0YScgd2lsbCBub3Qgd29yaylcclxuICAgIGRpc2FibGVkU3VtbWFyaWVzLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAndHJ1ZScpO1xyXG4gICAgZGlzYWJsZWRGaWVsZHMuYXR0cignZGF0YS12YWwnLCAndHJ1ZScpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHZhbGlkYXRpb25QYXNzZWQ7XHJcbn1cclxuXHJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiogQWpheCBGb3JtcyBnZW5lcmljIGZ1bmN0aW9uLlxyXG4qIFJlc3VsdCBleHBlY3RlZCBpczpcclxuKiAtIGh0bWwsIGZvciB2YWxpZGF0aW9uIGVycm9ycyBmcm9tIHNlcnZlciwgcmVwbGFjaW5nIGN1cnJlbnQgLmFqYXgtYm94IGNvbnRlbnRcclxuKiAtIGpzb24sIHdpdGggc3RydWN0dXJlOiB7IENvZGU6IGludGVnZXItbnVtYmVyLCBSZXN1bHQ6IHN0cmluZy1vci1vYmplY3QgfVxyXG4qICAgQ29kZSBudW1iZXJzOlxyXG4qICAgIC0gTmVnYXRpdmU6IGVycm9ycywgd2l0aCBhIFJlc3VsdCBvYmplY3QgeyBFcnJvck1lc3NhZ2U6IHN0cmluZyB9XHJcbiogICAgLSBaZXJvOiBzdWNjZXNzIHJlc3VsdCwgaXQgc2hvd3MgYSBtZXNzYWdlIHdpdGggY29udGVudDogUmVzdWx0IHN0cmluZywgZWxzZSBmb3JtIGRhdGEgYXR0cmlidXRlICdzdWNjZXNzLXBvc3QtbWVzc2FnZScsIGVsc2UgYSBnZW5lcmljIG1lc3NhZ2VcclxuKiAgICAtIDE6IHN1Y2Nlc3MgcmVzdWx0LCBSZXN1bHQgY29udGFpbnMgYSBVUkwsIHRoZSBwYWdlIHdpbGwgYmUgcmVkaXJlY3RlZCB0byB0aGF0LlxyXG4qICAgIC0gTWFqb3IgMTogc3VjY2VzcyByZXN1bHQsIHdpdGggY3VzdG9tIGhhbmRsZXIgdGhyb3VnaHQgdGhlIGZvcm0gZXZlbnQgJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJy5cclxuKi9cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VibWl0SGFuZGxlcihldmVudCkge1xyXG4gICAgLy8gQ29udGV4dCB2YXIsIHVzZWQgYXMgYWpheCBjb250ZXh0OlxyXG4gICAgdmFyIGN0eCA9IHt9O1xyXG4gICAgLy8gRGVmYXVsdCBkYXRhIGZvciByZXF1aXJlZCBwYXJhbXM6XHJcbiAgICBjdHguZm9ybSA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5mb3JtIDogbnVsbCkgfHwgJCh0aGlzKTtcclxuICAgIGN0eC5ib3ggPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuYm94IDogbnVsbCkgfHwgY3R4LmZvcm0uY2xvc2VzdChcIi5hamF4LWJveFwiKTtcclxuICAgIHZhciBhY3Rpb24gPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuYWN0aW9uIDogbnVsbCkgfHwgY3R4LmZvcm0uYXR0cignYWN0aW9uJykgfHwgJyc7XHJcblxyXG4gICAgdmFyIHBvc3RWYWxpZGF0aW9uID0gY3R4LmZvcm0uZGF0YSgncG9zdC12YWxpZGF0aW9uJyk7XHJcbiAgICB2YXIgcmVxdWVzdHMgPSBjdHguZm9ybS5kYXRhKCd4aHItcmVxdWVzdHMnKSB8fCBbXTtcclxuICAgIGN0eC5mb3JtLmRhdGEoJ3hoci1yZXF1ZXN0cycsIHJlcXVlc3RzKTtcclxuXHJcbiAgICBpZiAoIXBvc3RWYWxpZGF0aW9uKSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgdmFsaWRhdGlvblxyXG4gICAgICAgIGlmICh2YWxpZGF0ZUZvcm0oY3R4KSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgLy8gVmFsaWRhdGlvbiBmYWlsZWQsIHN1Ym1pdCBjYW5ub3QgY29udGludWUsIG91dCFcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5jaGFuZ2VkRWxlbWVudHMgOiBudWxsKSB8fCBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBldmVudCB0byBhbGxvdyBzY3JpcHRzIHRvIGhvb2sgYWRkaXRpb25hbCB0YXNrcyBiZWZvcmUgc2VuZCBkYXRhXHJcbiAgICBjdHguZm9ybS50cmlnZ2VyKCdwcmVzdWJtaXQnLCBbY3R4XSk7XHJcblxyXG4gICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgIH0sIHNldHRpbmdzLmxvYWRpbmdEZWxheSk7XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICB2YXIgZGF0YSA9IGN0eC5mb3JtLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpO1xyXG5cclxuICAgIC8vIEFib3J0IHByZXZpb3VzIHJlcXVlc3RzXHJcbiAgICAkLmVhY2gocmVxdWVzdHMsIGZ1bmN0aW9uIChyZXEpIHtcclxuICAgICAgICBpZiAocmVxICYmIHJlcS5hYm9ydClcclxuICAgICAgICAgICAgcmVxLmFib3J0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBhY3Rpb24sXHJcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgY29udGV4dDogY3R4LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyLFxyXG4gICAgICAgIGVycm9yOiBhamF4RXJyb3JQb3B1cEhhbmRsZXIsXHJcbiAgICAgICAgY29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVnaXN0ZXIgcmVxdWVzdFxyXG4gICAgcmVxdWVzdHMucHVzaChyZXF1ZXN0KTtcclxuICAgIC8vIFNldCBhdXRvLWRlc3JlZ2lzdHJhdGlvblxyXG4gICAgdmFyIHJlcUluZGV4ID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcclxuICAgIHJlcXVlc3QuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBEZWxldGUsIG5vdCBzcGxpY2UsIHNpbmNlIHdlIG5lZWQgdG8gcHJlc2VydmUgdGhlIG9yZGVyXHJcbiAgICAgICAgZGVsZXRlIHJlcXVlc3RzW3JlcUluZGV4XTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvIHBvc3QgdmFsaWRhdGlvbjpcclxuICAgIGlmIChwb3N0VmFsaWRhdGlvbiAmJiBwb3N0VmFsaWRhdGlvbiAhPT0gJ25ldmVyJykge1xyXG4gICAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRlRm9ybShjdHgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0b3Agbm9ybWFsIFBPU1Q6XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgSXQgcGVyZm9ybXMgYSBwb3N0IHN1Ym1pdCBvbiB0aGUgZ2l2ZW4gZm9ybSBvbiBiYWNrZ3JvdW5kLFxyXG4gICAgd2l0aG91dCBub3RpZmljYXRpb25zIG9mIGFueSBraW5kLCBqdXN0IGZvciB0aGUgaW5zdGFudCBzYXZpbmcgZmVhdHVyZS5cclxuKiovXHJcbmZ1bmN0aW9uIGRvSW5zdGFudFNhdmluZyhmb3JtLCBjaGFuZ2VkRWxlbWVudHMpIHtcclxuICAgIGZvcm0gPSAkKGZvcm0pO1xyXG4gICAgdmFyIGFjdGlvbiA9IGZvcm0uYXR0cignYWN0aW9uJykgfHwgZm9ybS5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpIHx8ICcnO1xyXG4gICAgdmFyIGN0eCA9IHsgZm9ybTogZm9ybSwgYm94OiBmb3JtIH07XHJcblxyXG4gICAgLy8gTm90aWZpY2F0aW9uIGV2ZW50IHRvIGFsbG93IHNjcmlwdHMgdG8gaG9vayBhZGRpdGlvbmFsIHRhc2tzIGJlZm9yZSBzZW5kIGRhdGFcclxuICAgIGZvcm0udHJpZ2dlcigncHJlc3VibWl0JywgW2N0eF0pO1xyXG5cclxuICAgIHZhciBkYXRhID0gY3R4LmZvcm0uZmluZCgnOmlucHV0Jykuc2VyaWFsaXplKCk7XHJcblxyXG4gICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogYWN0aW9uLFxyXG4gICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFRyYWNrZWQgY2hhbmdlZCBlbGVtZW50cyBhcmUgc2F2ZWRcclxuICAgICAgICAgICAgaWYgKGNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uY2xvc2VzdCgnZm9ybScpLmdldCgwKSwgY2hhbmdlZEVsZW1lbnRzKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmVxdWVzdHMgPSBmb3JtLmRhdGEoJ3hoci1yZXF1ZXN0cycpIHx8IFtdO1xyXG4gICAgZm9ybS5kYXRhKCd4aHItcmVxdWVzdHMnLCByZXF1ZXN0cyk7XHJcblxyXG4gICAgLy8gUmVnaXN0ZXIgcmVxdWVzdFxyXG4gICAgcmVxdWVzdHMucHVzaChyZXF1ZXN0KTtcclxuICAgIC8vIFNldCBhdXRvLWRlc3JlZ2lzdHJhdGlvblxyXG4gICAgdmFyIHJlcUluZGV4ID0gcmVxdWVzdHMubGVuZ3RoIC0gMTtcclxuICAgIHJlcXVlc3QuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBEZWxldGUsIG5vdCBzcGxpY2UsIHNpbmNlIHdlIG5lZWQgdG8gcHJlc2VydmUgdGhlIG9yZGVyXHJcbiAgICAgICAgZGVsZXRlIHJlcXVlc3RzW3JlcUluZGV4XTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiByZXF1ZXN0O1xyXG59XHJcblxyXG4vLyBQdWJsaWMgaW5pdGlhbGl6YXRpb25cclxuZnVuY3Rpb24gaW5pdEFqYXhGb3JtcyhvcHRpb25zKSB7XHJcbiAgICAkLmV4dGVuZCh0cnVlLCBzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgdG8gbWFuYWdlIGFqYXggZm9ybXMgKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ3N1Ym1pdCcsICdmb3JtLmFqYXgnLCBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKTtcclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIGZvciBhIHNwZWNpYWwgYWpheCBmb3JtIGNhc2U6IHN1YmZvcm1zLCB1c2luZyBmaWVsZHNldHMuICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdjbGljaycsICdmaWVsZHNldC5hamF4IC5hamF4LWZpZWxkc2V0LXN1Ym1pdCcsXHJcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG5cclxuICAgICAgICAgIGV2ZW50LmRhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm06IGZvcm0sXHJcbiAgICAgICAgICAgIGJveDogZm9ybS5jbG9zZXN0KCcuYWpheC1ib3gnKSxcclxuICAgICAgICAgICAgYWN0aW9uOiBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGNoYW5nZWRFbGVtZW50czogY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCksIGZvcm0uZmluZCgnOmlucHV0W25hbWVdJykpXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuLyogVU5VU0VEP1xyXG5mdW5jdGlvbiBhamF4Rm9ybU1lc3NhZ2VPbkh0bWxSZXR1cm5lZFdpdGhvdXRWYWxpZGF0aW9uRXJyb3JzKGZvcm0sIG1lc3NhZ2UpIHtcclxuICAgIHZhciAkdCA9ICQoZm9ybSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb3JtIGVycm9ycywgc2hvdyBhIHN1Y2Nlc3NmdWwgbWVzc2FnZVxyXG4gICAgaWYgKCR0LmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAkdC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgICAgICBjc3M6IHBvcHVwU3R5bGUocG9wdXBTaXplKCdzbWFsbCcpKVxyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkgeyAkdC51bmJsb2NrKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbiAgICB9XHJcbn1cclxuKi9cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBpbml0QWpheEZvcm1zLFxyXG4gICAgICAgIG9uU3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgb25FcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlcixcclxuICAgICAgICBkb0luc3RhbnRTYXZpbmc6IGRvSW5zdGFudFNhdmluZ1xyXG4gICAgfTtcclxuIiwiLyogQXV0byBjYWxjdWxhdGUgc3VtbWFyeSBvbiBET00gdGFnZ2luZyB3aXRoIGNsYXNzZXMgdGhlIGVsZW1lbnRzIGludm9sdmVkLlxyXG4gKi9cclxudmFyIG51ID0gcmVxdWlyZSgnLi9udW1iZXJVdGlscycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzKCkge1xyXG4gICAgJCgndGFibGUuY2FsY3VsYXRlLWl0ZW1zLXRvdGFscycpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmRhdGEoJ2NhbGN1bGF0ZS1pdGVtcy10b3RhbHMtaW5pdGlhbGl6YXRlZCcpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgZnVuY3Rpb24gY2FsY3VsYXRlUm93KCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICB2YXIgdHIgPSAkdC5jbG9zZXN0KCd0cicpO1xyXG4gICAgICAgICAgICB2YXIgaXAgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcHJpY2UnKTtcclxuICAgICAgICAgICAgdmFyIGlxID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXF1YW50aXR5Jyk7XHJcbiAgICAgICAgICAgIHZhciBpdCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbCcpO1xyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihudS5nZXRNb25leU51bWJlcihpcCkgKiBudS5nZXRNb25leU51bWJlcihpcSwgMSksIGl0KTtcclxuICAgICAgICAgICAgdHIudHJpZ2dlcignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAkKHRoaXMpLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZSwgLmNhbGN1bGF0ZS1pdGVtLXF1YW50aXR5Jykub24oJ2NoYW5nZScsIGNhbGN1bGF0ZVJvdyk7XHJcbiAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmRhdGEoJ2NhbGN1bGF0ZS1pdGVtcy10b3RhbHMtaW5pdGlhbGl6YXRlZCcsIHRydWUpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldHVwQ2FsY3VsYXRlU3VtbWFyeShmb3JjZSkge1xyXG4gICAgJCgnLmNhbGN1bGF0ZS1zdW1tYXJ5JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGMgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICghZm9yY2UgJiYgYy5kYXRhKCdjYWxjdWxhdGUtc3VtbWFyeS1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB2YXIgcyA9IGMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnknKTtcclxuICAgICAgICB2YXIgZCA9IGMuZmluZCgndGFibGUuY2FsY3VsYXRlLXN1bW1hcnktZ3JvdXAnKTtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjKCkge1xyXG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwLCBmZWUgPSAwLCBkdXJhdGlvbiA9IDA7XHJcbiAgICAgICAgICAgIHZhciBncm91cHMgPSB7fTtcclxuICAgICAgICAgICAgZC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBncm91cFRvdGFsID0gMDtcclxuICAgICAgICAgICAgICAgIHZhciBhbGxDaGVja2VkID0gJCh0aGlzKS5pcygnLmNhbGN1bGF0ZS1hbGwtaXRlbXMnKTtcclxuICAgICAgICAgICAgICAgICQodGhpcykuZmluZCgndHInKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaXRlbSA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFsbENoZWNrZWQgfHwgaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tY2hlY2tlZCcpLmlzKCc6Y2hlY2tlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwVG90YWwgKz0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tdG90YWw6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxID0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHk6ZXEoMCknKSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZlZSArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1mZWU6ZXEoMCknKSkgKiBxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1kdXJhdGlvbjplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB0b3RhbCArPSBncm91cFRvdGFsO1xyXG4gICAgICAgICAgICAgICAgZ3JvdXBzWyQodGhpcykuZGF0YSgnY2FsY3VsYXRpb24tc3VtbWFyeS1ncm91cCcpXSA9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cFRvdGFsLCAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0JykuZmluZCgnLmdyb3VwLXRvdGFsLXByaWNlJykpO1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZHVyYXRpb24sICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtZHVyYXRpb24nKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gU2V0IHN1bW1hcnkgdG90YWwgdmFsdWVcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIodG90YWwsIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktdG90YWwnKSk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGZlZSwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS1mZWUnKSk7XHJcbiAgICAgICAgICAgIC8vIEFuZCBldmVyeSBncm91cCB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBmb3IgKHZhciBnIGluIGdyb3Vwcykge1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZ3JvdXBzW2ddLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwLScgKyBnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZC5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tY2hlY2tlZCcpLmNoYW5nZShjYWxjKTtcclxuICAgICAgICBkLm9uKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCBjYWxjKTtcclxuICAgICAgICBjYWxjKCk7XHJcbiAgICAgICAgYy5kYXRhKCdjYWxjdWxhdGUtc3VtbWFyeS1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIFVwZGF0ZSB0aGUgZGV0YWlsIG9mIGEgcHJpY2luZyBzdW1tYXJ5LCBvbmUgZGV0YWlsIGxpbmUgcGVyIHNlbGVjdGVkIGl0ZW1cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkoKSB7XHJcbiAgICAkKCcucHJpY2luZy1zdW1tYXJ5LmRldGFpbGVkJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgJGQgPSAkcy5maW5kKCd0Ym9keS5kZXRhaWwnKSxcclxuICAgICAgICAgICAgJHQgPSAkcy5maW5kKCd0Ym9keS5kZXRhaWwtdHBsJykuY2hpbGRyZW4oJ3RyOmVxKDApJyksXHJcbiAgICAgICAgICAgICRjID0gJHMuY2xvc2VzdCgnZm9ybScpLFxyXG4gICAgICAgICAgICAkaXRlbXMgPSAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0nKTtcclxuXHJcbiAgICAgICAgLy8gRG8gaXQhXHJcbiAgICAgICAgLy8gUmVtb3ZlIG9sZCBsaW5lc1xyXG4gICAgICAgICRkLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gQ3JlYXRlIG5ldyBvbmVzXHJcbiAgICAgICAgJGl0ZW1zLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBHZXQgdmFsdWVzXHJcbiAgICAgICAgICAgIHZhciAkaSA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICAgICBjaGVja2VkID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNoZWNrZWQnKS5wcm9wKCdjaGVja2VkJyk7XHJcbiAgICAgICAgICAgIGlmIChjaGVja2VkKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29uY2VwdCA9ICRpLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1jb25jZXB0JykudGV4dCgpLFxyXG4gICAgICAgICAgICAgICAgICAgIHByaWNlID0gbnUuZ2V0TW9uZXlOdW1iZXIoJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLXByaWNlOmVxKDApJykpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHJvdyBhbmQgc2V0IHZhbHVlc1xyXG4gICAgICAgICAgICAgICAgdmFyICRyb3cgPSAkdC5jbG9uZSgpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2RldGFpbC10cGwnKVxyXG4gICAgICAgICAgICAgICAgLmFkZENsYXNzKCdkZXRhaWwnKTtcclxuICAgICAgICAgICAgICAgICRyb3cuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KGNvbmNlcHQpO1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIocHJpY2UsICRyb3cuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLXByaWNlJykpO1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkIHRvIHRoZSB0YWJsZVxyXG4gICAgICAgICAgICAgICAgJGQuYXBwZW5kKCRyb3cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBzZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkoKSB7XHJcbiAgICB2YXIgJGMgPSAkKCcucHJpY2luZy1zdW1tYXJ5LmRldGFpbGVkJykuY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgLy8gSW5pdGlhbCBjYWxjdWxhdGlvblxyXG4gICAgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpO1xyXG4gICAgLy8gQ2FsY3VsYXRlIG9uIHJlbGV2YW50IGZvcm0gY2hhbmdlc1xyXG4gICAgJGMuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNoZWNrZWQnKS5jaGFuZ2UodXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbiAgICAvLyBTdXBwb3J0IGZvciBsY1NldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyBldmVudFxyXG4gICAgJGMub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkpO1xyXG59XHJcblxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb25UYWJsZUl0ZW1zOiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMsXHJcbiAgICAgICAgb25TdW1tYXJ5OiBzZXR1cENhbGN1bGF0ZVN1bW1hcnksXHJcbiAgICAgICAgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSxcclxuICAgICAgICBvbkRldGFpbGVkUHJpY2luZ1N1bW1hcnk6IHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeVxyXG4gICAgfTsiLCIvKiBGb2N1cyB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgZG9jdW1lbnQgKG9yIGluIEBjb250YWluZXIpXHJcbndpdGggdGhlIGh0bWw1IGF0dHJpYnV0ZSAnYXV0b2ZvY3VzJyAob3IgYWx0ZXJuYXRpdmUgQGNzc1NlbGVjdG9yKS5cclxuSXQncyBmaW5lIGFzIGEgcG9seWZpbGwgYW5kIGZvciBhamF4IGxvYWRlZCBjb250ZW50IHRoYXQgd2lsbCBub3RcclxuZ2V0IHRoZSBicm93c2VyIHN1cHBvcnQgb2YgdGhlIGF0dHJpYnV0ZS5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGF1dG9Gb2N1cyhjb250YWluZXIsIGNzc1NlbGVjdG9yKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCk7XHJcbiAgICBjb250YWluZXIuZmluZChjc3NTZWxlY3RvciB8fCAnW2F1dG9mb2N1c10nKS5mb2N1cygpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGF1dG9Gb2N1czsiLCIvKiogQXV0by1maWxsIG1lbnUgc3ViLWl0ZW1zIHVzaW5nIHRhYmJlZCBwYWdlcyAtb25seSB3b3JrcyBmb3IgY3VycmVudCBwYWdlIGl0ZW1zLSAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYXV0b2ZpbGxTdWJtZW51KCkge1xyXG4gICAgJCgnLmF1dG9maWxsLXN1Ym1lbnUgLmN1cnJlbnQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcGFyZW50bWVudSA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgc3VibWVudSBlbGVtZW50cyBmcm9tIHRhYnMgbWFya2VkIHdpdGggY2xhc3MgJ2F1dG9maWxsLXN1Ym1lbnUtaXRlbXMnXHJcbiAgICAgICAgdmFyIGl0ZW1zID0gJCgnLmF1dG9maWxsLXN1Ym1lbnUtaXRlbXMgbGk6bm90KC5yZW1vdmFibGUpJyk7XHJcbiAgICAgICAgLy8gaWYgdGhlcmUgaXMgaXRlbXMsIGNyZWF0ZSB0aGUgc3VibWVudSBjbG9uaW5nIGl0IVxyXG4gICAgICAgIGlmIChpdGVtcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciBzdWJtZW51ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xyXG4gICAgICAgICAgICBwYXJlbnRtZW51LmFwcGVuZChzdWJtZW51KTtcclxuICAgICAgICAgICAgLy8gQ2xvbmluZyB3aXRob3V0IGV2ZW50czpcclxuICAgICAgICAgICAgdmFyIG5ld2l0ZW1zID0gaXRlbXMuY2xvbmUoZmFsc2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgJChzdWJtZW51KS5hcHBlbmQobmV3aXRlbXMpO1xyXG5cclxuICAgICAgICAgICAgLy8gV2UgbmVlZCBhdHRhY2ggZXZlbnRzIHRvIG1haW50YWluIHRoZSB0YWJiZWQgaW50ZXJmYWNlIHdvcmtpbmdcclxuICAgICAgICAgICAgLy8gTmV3IEl0ZW1zIChjbG9uZWQpIG11c3QgY2hhbmdlIHRhYnM6XHJcbiAgICAgICAgICAgIG5ld2l0ZW1zLmZpbmQoXCJhXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgaW4gdGhlIG9yaWdpbmFsIGl0ZW1cclxuICAgICAgICAgICAgICAgICQoXCJhW2hyZWY9J1wiICsgdGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpICsgXCInXVwiLCBpdGVtcykuY2xpY2soKTtcclxuICAgICAgICAgICAgICAgIC8vIENoYW5nZSBtZW51OlxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKFwiYVwiKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICAgICAgLy8gU3RvcCBldmVudDpcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIE9yaWdpbmFsIGl0ZW1zIG11c3QgY2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgIGl0ZW1zLmZpbmQoXCJhXCIpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIG5ld2l0ZW1zLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50JykuXHJcbiAgICAgICAgICAgICAgICBmaWx0ZXIoXCIqW2hyZWY9J1wiICsgdGhpcy5nZXRBdHRyaWJ1dGUoXCJocmVmXCIpICsgXCInXVwiKS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuTWFuYWdlIGFsbCB0aGF0IGV2ZW50cyBhdHRhY2hlZCB0byBkYXRlcyBtYWRlIHVuYXZhaWxhYmxlIGJ5IHRoZSB1c2VyXHJcbnRvIG5vdGlmeSBhYm91dCB3aGF0IHRoYXQgbWVhbnMuXHJcblxyXG5NYWRlIGZvciB1c2UgaW4gdGhlIE1vbnRobHkgY2FsZW5kYXIsIG1heWJlIHJldXNhYmxlLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBvYmplY3RVdGlscyA9IHJlcXVpcmUoJy4vb2JqZWN0VXRpbHMnKTtcclxucmVxdWlyZShcImRhdGUtZm9ybWF0LWxpdGVcIik7XHJcblxyXG4vKipcclxuVGhlIEBlbGVtZW50IG11c3QgYmUgYSBkb20gZWxlbWVudCBjb250YWluaW5nIHRoYXQgd2lsbCBjb250YWluIHRoZSBpbmZvcm1hdGlvblxyXG5hbmQgd2lsbCB1c2UgYW4gdWwgZWxlbWVudCB0byBsaXN0IG5vdGlmaWNhdGlvbnMuIFRoZSBlbGVtZW50IHdpbGwgYmUgaGlkZGVuXHJcbmluaXRpYWxseSBhbmQgYW55IHRpbWUgdGhhdCwgb24gcmVuZGVyaW5nLCB0aGVyZSBhcmUgbm90IG5vdGlmaWNhdGlvbnMuXHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEJvb2tpbmdzTm90aWZpY2F0aW9uKGVsZW1lbnQpIHtcclxuXHJcbiAgdGhpcy4kZWwgPSAkKGVsZW1lbnQpO1xyXG4gIHRoaXMuJGxpc3QgPSB0aGlzLiRlbC5maW5kKCd1bCcpO1xyXG4gIGlmICghdGhpcy4kbGlzdC5sZW5ndGgpXHJcbiAgICB0aGlzLiRsaXN0ID0gJCgnPHVsLz4nKS5hcHBlbmRUbyh0aGlzLiRlbCk7XHJcblxyXG4gIHRoaXMucmVnaXN0ZXJlZCA9IHt9O1xyXG5cclxuICB0aGlzLnJlZ2lzdGVyID0gZnVuY3Rpb24gcmVnaXN0ZXIodG9nZ2xlLCBkYXRhLCBzdHJEYXRlKSB7XHJcbiAgICB2YXIgbCA9IHRoaXMucmVnaXN0ZXJlZDtcclxuICAgIGlmICh0b2dnbGUpIHtcclxuICAgICAgLy8gcmVnaXN0ZXIgKGlmIHNvbWV0aGluZylcclxuICAgICAgdmFyIGV2cyA9IGRhdGEuc2xvdHNbc3RyRGF0ZV0uZXZlbnRzSWRzO1xyXG4gICAgICBpZiAoZXZzKSB7XHJcbiAgICAgICAgbFtzdHJEYXRlXSA9IG9iamVjdFV0aWxzLmZpbHRlclByb3BlcnRpZXMoZGF0YS5ldmVudHMsIGZ1bmN0aW9uIChrKSB7IHJldHVybiBldnMuaW5kZXhPZihrKSAhPSAtMTsgfSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIHVucmVnaXN0ZXJcclxuICAgICAgZGVsZXRlIGxbc3RyRGF0ZV07XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgdGhpcy5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XHJcbiAgICAvLyBSZW5ldyB0aGUgbGlzdFxyXG4gICAgdGhpcy4kbGlzdC5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG5cclxuICAgIHZhciBoYXNOb3RpZmljYXRpb25zID0gZmFsc2U7XHJcblxyXG4gICAgZm9yICh2YXIgc3RyRGF0ZSBpbiB0aGlzLnJlZ2lzdGVyZWQpIHtcclxuICAgICAgaWYgKCF0aGlzLnJlZ2lzdGVyZWQuaGFzT3duUHJvcGVydHkoc3RyRGF0ZSkpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgdmFyIGV2ZW50cyA9IHRoaXMucmVnaXN0ZXJlZFtzdHJEYXRlXTtcclxuICAgICAgdmFyIGRhdGUgPSBkYXRlSVNPLnBhcnNlKHN0ckRhdGUpLmZvcm1hdCgnRERERCwgTU1NIEQnKTtcclxuICAgICAgdmFyIG1zZyA9ICQoJzxzcGFuLz4nKS50ZXh0KGRhdGUgKyBcIjogXCIpLm91dGVySHRtbCgpO1xyXG5cclxuICAgICAgdmFyIGV2ZW50c0h0bWwgPSBbXTtcclxuICAgICAgZm9yICh2YXIgcCBpbiBldmVudHMpIHtcclxuICAgICAgICBpZiAoIWV2ZW50cy5oYXNPd25Qcm9wZXJ0eShwKSkgY29udGludWU7XHJcbiAgICAgICAgdmFyIGV2ID0gZXZlbnRzW3BdO1xyXG4gICAgICAgIHZhciBpdGVtID0gJCgnPGEgdGFyZ2V0PVwiX2JsYW5rXCIgLz4nKS5hdHRyKCdocmVmJywgZXYudXJsKS50ZXh0KGV2LnN1bW1hcnkgfHwgJ2Jvb2tpbmcnKTtcclxuICAgICAgICBldmVudHNIdG1sLnB1c2goaXRlbS5vdXRlckh0bWwoKSk7XHJcblxyXG4gICAgICAgIGhhc05vdGlmaWNhdGlvbnMgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIG1zZyArPSBldmVudHNIdG1sLmpvaW4oJywgJyk7XHJcblxyXG4gICAgICAkKCc8bGkvPicpXHJcbiAgICAgIC5odG1sKG1zZylcclxuICAgICAgLmFwcGVuZFRvKHRoaXMuJGxpc3QpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChoYXNOb3RpZmljYXRpb25zKVxyXG4gICAgICB0aGlzLiRlbC5zaG93KCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMuJGVsLmhpZGUoKTtcclxuXHJcbiAgfTtcclxufTsiLCIvKipcclxuICBNb250aGx5IGNhbGVuZGFyIGNsYXNzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIExjV2lkZ2V0ID0gcmVxdWlyZSgnLi4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuLi9DWC9leHRlbmQnKSxcclxuICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuICBvYmplY3RVdGlscyA9IHJlcXVpcmUoJy4vb2JqZWN0VXRpbHMnKSxcclxuICBCb29raW5nc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vQm9va2luZ3NOb3RpZmljYXRpb24nKTtcclxuXHJcbnZhciBldmVudHMgPSB7XHJcbiAgICBkYXRhQ2hhbmdlZDogJ2RhdGFDaGFuZ2VkJ1xyXG59O1xyXG5cclxuLyoqXHJcbiAgUHJpdmF0ZSB1dGlsc1xyXG4qKi9cclxuXHJcbi8qKlxyXG4gIFByZWZldGNoIG5leHQgbW9udGggKGJhc2VkIG9uIHRoZSBnaXZlbiBkYXRlcylcclxuICBOb3RlOiB0aGlzIGNvZGUgaXMgdmVyeSBzaW1pbGFyIHRvIHV0aWxzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2hcclxuKiovXHJcbmZ1bmN0aW9uIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGN1cnJlbnREYXRlc1JhbmdlKSB7XHJcbiAgLy8gV2UgZ2V0IHRoZSBuZXh0IG1vbnRoIGRhdGVzLXJhbmdlLCBidXRcclxuICAvLyB1c2luZyBhcyBiYXNlLWRhdGUgYSBkYXRlIGluc2lkZSBjdXJyZW50IGRpc3BsYXllZCBtb250aCwgdGhhdCBtb3N0IHRpbWVzIGlzXHJcbiAgLy8gbm90IHRoZSBtb250aCBvZiB0aGUgc3RhcnQgZGF0ZSBpbiBjdXJyZW50IGRhdGUsIHRoZW4ganVzdCBmb3J3YXJkIDcgZGF5cyB0aGF0XHJcbiAgLy8gdG8gZW5zdXJlIHdlIHBpY2sgdGhlIGNvcnJlY3QgbW9udGg6XHJcbiAgdmFyIG5leHREYXRlc1JhbmdlID0gdXRpbHMuZGF0ZS5uZXh0TW9udGhXZWVrcyh1dGlscy5kYXRlLmFkZERheXMoY3VycmVudERhdGVzUmFuZ2Uuc3RhcnQsIDcpLCAxLCBtb250aGx5LnNob3dTaXhXZWVrcyk7XHJcbiAgLy8gQXMgd2UgbG9hZCBmdWxsIHdlZWtzLCBtb3N0IHRpbWVzIHRoZSBmaXJzdCB3ZWVrIG9mIGEgbW9udGggaXMgYWxyZWFkeSBsb2FkZWQgYmVjYXVzZSBcclxuICAvLyB0aGUgd2VlayBpcyBzaGFyZWQgd2l0aCB0aGUgcHJldmlvdXMgbW9udGgsIHRoZW4ganVzdCBjaGVjayBpZiB0aGUgc3RhcnQgb2YgdGhlIG5ld1xyXG4gIC8vIHJhbmdlIGlzIGFscmVhZHkgaW4gY2FjaGUgYW5kIHNocmluayB0aGUgcmFuZ2UgdG8gYmUgcmVxdWVzdGVkLCBhdm9pZGluZyBjb25mbGljdCBvblxyXG4gIC8vIGxvYWRpbmcgdGhlIHVkcGF0ZWQgZGF0YSAoaWYgdGhhdCB3ZWVrIHdhcyBiZWluZyBlZGl0ZWQpIGFuZCBmYXN0ZXIgcmVxdWVzdCBsb2FkIHNpbmNlXHJcbiAgLy8gdGhlIHNlcnZlciBuZWVkcyB0byBkbyBsZXNzIGNvbXB1dGF0aW9uOlxyXG4gIHZhciBkID0gbmV4dERhdGVzUmFuZ2Uuc3RhcnQsXHJcbiAgICBzdHJlbmQgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXh0RGF0ZXNSYW5nZS5lbmQpLFxyXG4gICAgc3RyZCA9IGRhdGVJU08uZGF0ZUxvY2FsKGQsIHRydWUpO1xyXG4gIGlmIChtb250aGx5LmRhdGEgJiYgbW9udGhseS5kYXRhLnNsb3RzKVxyXG4gIHdoaWxlIChtb250aGx5LmRhdGEuc2xvdHNbc3RyZF0gJiZcclxuICAgIHN0cmQgPD0gc3RyZW5kKSB7XHJcbiAgICBuZXh0RGF0ZXNSYW5nZS5zdGFydCA9IGQgPSB1dGlscy5kYXRlLmFkZERheXMoZCwgMSk7XHJcbiAgICBzdHJkID0gZGF0ZUlTTy5kYXRlTG9jYWwoZCwgdHJ1ZSk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXV0aWxzLm1vbnRobHlJc0RhdGFJbkNhY2hlKG1vbnRobHksIG5leHREYXRlc1JhbmdlKSkge1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHZhciBwcmVmZXRjaFF1ZXJ5ID0gdXRpbHMuZGF0ZXNUb1F1ZXJ5KG5leHREYXRlc1JhbmdlKTtcclxuICAgIG1vbnRobHkuZmV0Y2hEYXRhKHByZWZldGNoUXVlcnksIG51bGwsIHRydWUpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbk1vdmUgdGhlIGJpbmRlZCBkYXRlcyB0aGUgYW1vdW50IG9mIEBtb250aHMgc3BlY2lmaWVkLlxyXG5Ob3RlOiBtb3N0IG9mIHRoaXMgY29kZSBpcyBhZGFwdGVkIGZyb20gdXRpbHMubW92ZUJpbmRSYW5nZUluRGF5cyxcclxudGhlIGNvbXBsZXhpdHkgY29tZXMgZnJvbSB0aGUgcHJlZmV0Y2ggZmVhdHVyZSwgbWF5YmUgY2FuIGJlIHRoYXQgbG9naWNcclxuaXNvbGF0ZWQgYW5kIHNoYXJlZD9cclxuKiovXHJcbmZ1bmN0aW9uIG1vdmVCaW5kTW9udGgobW9udGhseSwgbW9udGhzKSB7XHJcbiAgLy8gV2UgZ2V0IHRoZSBuZXh0ICdtb250aHMnIChuZWdhdGl2ZSBmb3IgcHJldmlvdXMpIGRhdGVzLXJhbmdlLCBidXRcclxuICAvLyB1c2luZyBhcyBiYXNlLWRhdGUgYSBkYXRlIGluc2lkZSBjdXJyZW50IGRpc3BsYXllZCBtb250aCwgdGhhdCBtb3N0IHRpbWVzIGlzXHJcbiAgLy8gbm90IHRoZSBtb250aCBvZiB0aGUgc3RhcnQgZGF0ZSBpbiBjdXJyZW50IGRhdGUsIHRoZW4ganVzdCBmb3J3YXJkIDcgZGF5cyB0aGF0XHJcbiAgLy8gdG8gZW5zdXJlIHdlIHBpY2sgdGhlIGNvcnJlY3QgbW9udGg6XHJcbiAgdmFyIGRhdGVzUmFuZ2UgPSB1dGlscy5kYXRlLm5leHRNb250aFdlZWtzKHV0aWxzLmRhdGUuYWRkRGF5cyhtb250aGx5LmRhdGVzUmFuZ2Uuc3RhcnQsIDcpLCBtb250aHMsIG1vbnRobHkuc2hvd1NpeFdlZWtzKTtcclxuXHJcbiAgLy8gQ2hlY2sgY2FjaGUgYmVmb3JlIHRyeSB0byBmZXRjaFxyXG4gIHZhciBpbkNhY2hlID0gdXRpbHMubW9udGhseUlzRGF0YUluQ2FjaGUobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcblxyXG4gIGlmIChpbkNhY2hlKSB7XHJcbiAgICAvLyBKdXN0IHNob3cgdGhlIGRhdGFcclxuICAgIG1vbnRobHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAvLyBQcmVmZXRjaCBleGNlcHQgaWYgdGhlcmUgaXMgb3RoZXIgcmVxdWVzdCBpbiBjb3Vyc2UgKGNhbiBiZSB0aGUgc2FtZSBwcmVmZXRjaCxcclxuICAgIC8vIGJ1dCBzdGlsbCBkb24ndCBvdmVybG9hZCB0aGUgc2VydmVyKVxyXG4gICAgaWYgKG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgbW9udGhseUNoZWNrQW5kUHJlZmV0Y2gobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcbiAgfSBlbHNlIHtcclxuXHJcbiAgICAvLyBTdXBwb3J0IGZvciBwcmVmZXRjaGluZzpcclxuICAgIC8vIEl0cyBhdm9pZGVkIGlmIHRoZXJlIGFyZSByZXF1ZXN0cyBpbiBjb3Vyc2UsIHNpbmNlXHJcbiAgICAvLyB0aGF0IHdpbGwgYmUgYSBwcmVmZXRjaCBmb3IgdGhlIHNhbWUgZGF0YS5cclxuICAgIGlmIChtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHtcclxuICAgICAgLy8gVGhlIGxhc3QgcmVxdWVzdCBpbiB0aGUgcG9vbCAqbXVzdCogYmUgdGhlIGxhc3QgaW4gZmluaXNoXHJcbiAgICAgIC8vIChtdXN0IGJlIG9ubHkgb25lIGlmIGFsbCBnb2VzIGZpbmUpOlxyXG4gICAgICB2YXIgcmVxdWVzdCA9IG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzW21vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgLy8gV2FpdCBmb3IgdGhlIGZldGNoIHRvIHBlcmZvcm0gYW5kIHNldHMgbG9hZGluZyB0byBub3RpZnkgdXNlclxyXG4gICAgICBtb250aGx5LiRlbC5hZGRDbGFzcyhtb250aGx5LmNsYXNzZXMuZmV0Y2hpbmcpO1xyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIG1vdmVCaW5kTW9udGgobW9udGhseSwgbW9udGhzKTtcclxuICAgICAgICBtb250aGx5LiRlbC5yZW1vdmVDbGFzcyhtb250aGx5LmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgbW9udGhseVxyXG4gICAgLmZldGNoRGF0YSh1dGlscy5kYXRlc1RvUXVlcnkoZGF0ZXNSYW5nZSkpXHJcbiAgICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIG1vbnRobHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAgIC8vIFByZWZldGNoXHJcbiAgICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LW1vbnRoIGFuZCBkaXNhYmxlIHByZXYgYnV0dG9uLFxyXG5vciByZW1vdmUgdGhlIG1hcmsgYW5kIGVuYWJsZSBpdCBpZiBpcyBub3QuXHJcblxyXG5VcGRhdGVzIHRoZSBtb250aCBsYWJlbCB0b28gYW5kIHRvZGF5IGJ1dHRvblxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50TW9udGgoJGVsLCBzdGFydERhdGUsIG1vbnRobHkpIHtcclxuICAvLyBFbnN1cmUgdGhlIGRhdGUgdG8gYmUgZnJvbSBjdXJyZW50IG1vbnRoIGFuZCBub3Qgb25lIG9mIHRoZSBsYXRlc3QgZGF0ZXNcclxuICAvLyBvZiB0aGUgcHJldmlvdXMgb25lICh3aGVyZSB0aGUgcmFuZ2Ugc3RhcnQpIGFkZGluZyA3IGRheXMgZm9yIHRoZSBjaGVjazpcclxuICB2YXIgbW9udGhEYXRlID0gdXRpbHMuZGF0ZS5hZGREYXlzKHN0YXJ0RGF0ZSwgNyk7XHJcbiAgdmFyIHllcCA9IHV0aWxzLmRhdGUuaXNJbkN1cnJlbnRNb250aChtb250aERhdGUpO1xyXG4gICRlbC50b2dnbGVDbGFzcyhtb250aGx5LmNsYXNzZXMuY3VycmVudFdlZWssIHllcCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLnByZXZBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxuXHJcbiAgLy8gTW9udGggLSBZZWFyXHJcbiAgdmFyIG1sYmwgPSBtb250aGx5LnRleHRzLm1vbnRoc1ttb250aERhdGUuZ2V0TW9udGgoKV0gKyAnICcgKyBtb250aERhdGUuZ2V0RnVsbFllYXIoKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMubW9udGhMYWJlbCkudGV4dChtbGJsKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMudG9kYXlBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxufVxyXG5cclxuLyoqXHJcbiAgVXBkYXRlIHRoZSBjYWxlbmRhciBkYXRlcyBjZWxscyBmb3IgJ2RheSBvZiB0aGUgbW9udGgnIHZhbHVlc1xyXG4gIGFuZCBudW1iZXIgb2Ygd2Vla3Mvcm93cy5cclxuICBAZGF0ZXNSYW5nZSB7IHN0YXJ0LCBlbmQgfVxyXG4gIEBzbG90c0NvbnRhaW5lciBqUXVlcnktRE9NIGZvciBkYXRlcy1jZWxscyB0Ym9keVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgb2ZmTW9udGhEYXRlQ2xhc3MsIGN1cnJlbnREYXRlQ2xhc3MsIHNsb3REYXRlTGFiZWwsIHNob3dTaXhXZWVrcykge1xyXG4gIHZhciBsYXN0WSxcclxuICAgIGN1cnJlbnRNb250aCA9IHV0aWxzLmRhdGUuYWRkRGF5cyhkYXRlc1JhbmdlLnN0YXJ0LCA3KS5nZXRNb250aCgpLFxyXG4gICAgdG9kYXkgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXcgRGF0ZSgpKTtcclxuXHJcbiAgaXRlcmF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIGZ1bmN0aW9uIChkYXRlLCB4LCB5KSB7XHJcbiAgICBsYXN0WSA9IHk7XHJcbiAgICB0aGlzLmZpbmQoJy4nICsgc2xvdERhdGVMYWJlbCkudGV4dChkYXRlLmdldERhdGUoKSk7XHJcblxyXG4gICAgLy8gTWFyayBkYXlzIG5vdCBpbiB0aGlzIG1vbnRoXHJcbiAgICB0aGlzLnRvZ2dsZUNsYXNzKG9mZk1vbnRoRGF0ZUNsYXNzLCBkYXRlLmdldE1vbnRoKCkgIT0gY3VycmVudE1vbnRoKTtcclxuXHJcbiAgICAvLyBNYXJrIHRvZGF5XHJcbiAgICB0aGlzLnRvZ2dsZUNsYXNzKGN1cnJlbnREYXRlQ2xhc3MsIGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUpID09IHRvZGF5KTtcclxuICB9KTtcclxuXHJcbiAgaWYgKCFzaG93U2l4V2Vla3MpIHtcclxuICAgIC8vIFNvbWUgbW9udGhzIGFyZSA1IHdlZWtzIHdpZGUgYW5kIG90aGVycyA2OyBvdXIgbGF5b3V0IGhhcyBwZXJtYW5lbnQgNiByb3dzL3dlZWtzXHJcbiAgICAvLyBhbmQgd2UgZG9uJ3QgbG9vayB1cCB0aGUgNnRoIHdlZWsgaWYgaXMgbm90IHBhcnQgb2YgdGhlIG1vbnRoIHRoZW4gdGhhdCA2dGggcm93XHJcbiAgICAvLyBtdXN0IGJlIGhpZGRlbiBpZiB0aGVyZSBhcmUgb25seSA1LlxyXG4gICAgLy8gSWYgdGhlIGxhc3Qgcm93IHdhcyB0aGUgNSAoaW5kZXggNCwgemVyby1iYXNlZCksIHRoZSA2dGggaXMgaGlkZGVuOlxyXG4gICAgc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJ3RyOmVxKDUpJykueHRvZ2dsZShsYXN0WSAhPSA0LCB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAwIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAgSXQgZXhlY3V0ZXMgdGhlIGdpdmVuIGNhbGxiYWNrIChAZWFjaENlbGxDYWxsYmFjaykgZm9yIFxyXG4gIGVhY2ggY2VsbCAodGhpcyBpbnNpZGUgdGhlIGNhbGxiYWNrKSBpdGVyYXRlZCBiZXR3ZWVuIHRoZSBAZGF0ZXNSYW5nZVxyXG4gIGluc2lkZSB0aGUgQHNsb3RzQ29udGFpbmVyIChhIHRib2R5IG9yIHRhYmxlIHdpdGggdHItdGQgZGF0ZSBjZWxscylcclxuKiovXHJcbmZ1bmN0aW9uIGl0ZXJhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBlYWNoQ2VsbENhbGxiYWNrKSB7XHJcbiAgdmFyIHgsIHksIGRhdGVDZWxsO1xyXG4gIC8vIEl0ZXJhdGUgZGF0ZXNcclxuICB1dGlscy5kYXRlLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIC8vIGRhdGVzIGFyZSBzb3J0ZWQgYXMgNyBwZXIgcm93IChlYWNoIHdlZWstZGF5KSxcclxuICAgIC8vIGJ1dCByZW1lbWJlciB0aGF0IGRheS1jZWxsIHBvc2l0aW9uIGlzIG9mZnNldCAxIGJlY2F1c2VcclxuICAgIC8vIGVhY2ggcm93IGlzIDggY2VsbHMgKGZpcnN0IGlzIGhlYWRlciBhbmQgcmVzdCA3IGFyZSB0aGUgZGF0YS1jZWxscyBmb3IgZGF0ZXMpXHJcbiAgICAvLyBqdXN0IGxvb2tpbmcgb25seSAndGQncyB3ZSBjYW4gdXNlIHRoZSBwb3NpdGlvbiB3aXRob3V0IG9mZnNldFxyXG4gICAgeCA9IChpICUgNyk7XHJcbiAgICB5ID0gTWF0aC5mbG9vcihpIC8gNyk7XHJcbiAgICBkYXRlQ2VsbCA9IHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCd0cjplcSgnICsgeSArICcpJykuY2hpbGRyZW4oJ3RkOmVxKCcgKyB4ICsgJyknKTtcclxuXHJcbiAgICBlYWNoQ2VsbENhbGxiYWNrLmFwcGx5KGRhdGVDZWxsLCBbZGF0ZSwgeCwgeSwgaV0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKipcclxuICBUb2dnbGUgYSBzZWxlY3RlZCBkYXRlLWNlbGwgYXZhaWxhYmlsaXR5LFxyXG4gIGZvciB0aGUgJ2VkaXRhYmxlJyBtb2RlXHJcbioqL1xyXG5mdW5jdGlvbiB0b2dnbGVEYXRlQXZhaWxhYmlsaXR5KG1vbnRobHksIGNlbGwpIHtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBkYXRhLCBqdXN0IHJldHVybiAoZGF0YSBub3QgbG9hZGVkKVxyXG4gIGlmICghbW9udGhseS5kYXRhIHx8ICFtb250aGx5LmRhdGEuc2xvdHMpIHJldHVybjtcclxuICBcclxuICAvLyBHZXR0aW5nIHRoZSBwb3NpdGlvbiBvZiB0aGUgY2VsbCBpbiB0aGUgbWF0cml4IGZvciBkYXRlLXNsb3RzOlxyXG4gIHZhciB0ciA9IGNlbGwuY2xvc2VzdCgndHInKSxcclxuICAgIHggPSB0ci5maW5kKCd0ZCcpLmluZGV4KGNlbGwpLFxyXG4gICAgeSA9IHRyLmNsb3Nlc3QoJ3Rib2R5JykuZmluZCgndHInKS5pbmRleCh0ciksXHJcbiAgICBkYXlzT2Zmc2V0ID0geSAqIDcgKyB4O1xyXG5cclxuICAvLyBHZXR0aW5nIHRoZSBkYXRlIGZvciB0aGUgY2VsbCBiYXNlZCBvbiB0aGUgc2hvd2VkIGZpcnN0IGRhdGVcclxuICB2YXIgZGF0ZSA9IG1vbnRobHkuZGF0ZXNSYW5nZS5zdGFydDtcclxuICBkYXRlID0gdXRpbHMuZGF0ZS5hZGREYXlzKGRhdGUsIGRheXNPZmZzZXQpO1xyXG4gIHZhciBzdHJEYXRlID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcblxyXG4gIC8vIEdldCBhbmQgdXBkYXRlIGZyb20gdGhlIHVuZGVybGF5aW5nIGRhdGEsIFxyXG4gIC8vIHRoZSBzdGF0dXMgZm9yIHRoZSBkYXRlLCB0b2dnbGluZyBpdDpcclxuICB2YXIgc2xvdCA9IG1vbnRobHkuZGF0YS5zbG90c1tzdHJEYXRlXTtcclxuICAvLyBJZiB0aGVyZSBpcyBubyBzbG90LCBqdXN0IHJldHVybiAoZGF0YSBub3QgbG9hZGVkKVxyXG4gIGlmICghc2xvdCkgcmV0dXJuO1xyXG4gIHNsb3Quc3RhdHVzID0gc2xvdC5zdGF0dXMgPT0gJ3VuYXZhaWxhYmxlJyA/ICdhdmFpbGFibGUnIDogJ3VuYXZhaWxhYmxlJztcclxuICBzbG90LnNvdXJjZSA9ICd1c2VyJztcclxuICBtb250aGx5LmJvb2tpbmdzTm90aWZpY2F0aW9uLnJlZ2lzdGVyKHNsb3Quc3RhdHVzID09ICd1bmF2YWlsYWJsZScsIG1vbnRobHkuZGF0YSwgc3RyRGF0ZSk7XHJcbiAgbW9udGhseS5ldmVudHMuZW1pdChldmVudHMuZGF0YUNoYW5nZWQsIGNlbGwsIHNsb3QpO1xyXG5cclxuICAvLyBVcGRhdGUgdmlzdWFsaXphdGlvbjpcclxuICBtb250aGx5LmJpbmREYXRhKCk7XHJcbn1cclxuXHJcbi8qKlxyXG5Nb250bHkgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBNb250aGx5ID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseUNsYXNzZXMsIHtcclxuICB3ZWVrbHlDYWxlbmRhcjogdW5kZWZpbmVkLFxyXG4gIGN1cnJlbnRXZWVrOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudE1vbnRoOiAnaXMtY3VycmVudE1vbnRoJyxcclxuICBtb250aGx5Q2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci0tbW9udGhseScsXHJcbiAgdG9kYXlBY3Rpb246ICdBY3Rpb25zLXRvZGF5JyxcclxuICBtb250aExhYmVsOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbW9udGhMYWJlbCcsXHJcbiAgc2xvdERhdGVMYWJlbDogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXNsb3REYXRlTGFiZWwnLFxyXG4gIG9mZk1vbnRoRGF0ZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLW9mZk1vbnRoRGF0ZScsXHJcbiAgY3VycmVudERhdGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1jdXJyZW50RGF0ZScsXHJcbiAgZWRpdGFibGU6ICdpcy1lZGl0YWJsZScsXHJcbiAgYm9va2luZ3NOb3RpZmljYXRpb246ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1ib29raW5nc05vdGlmaWNhdGlvbidcclxufSksXHJcbnRleHRzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseVRleHRzLCB7XHJcbiAgbW9udGhzOiBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXVxyXG59KSxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuc2hvd1NpeFdlZWtzOiB0cnVlLFxyXG5lZGl0YWJsZTogZmFsc2UsXHJcblxyXG4vLyBPdXIgJ3ZpZXcnIHdpbGwgYmUgYSBzdWJzZXQgb2YgdGhlIGRhdGEsXHJcbi8vIGRlbGltaXRlZCBieSB0aGUgbmV4dCBwcm9wZXJ0eSwgYSBkYXRlcyByYW5nZTpcclxuZGF0ZXNSYW5nZTogeyBzdGFydDogbnVsbCwgZW5kOiBudWxsIH0sXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YU1vbnRobHkoZGF0ZXNSYW5nZSkge1xyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuc2xvdHMpIHJldHVybjtcclxuXHJcbiAgdGhpcy5kYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgfHwgdGhpcy5kYXRlc1JhbmdlO1xyXG4gIHZhciBcclxuICAgICAgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyksXHJcbiAgICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgY2hlY2tDdXJyZW50TW9udGgodGhpcy4kZWwsIGRhdGVzUmFuZ2Uuc3RhcnQsIHRoaXMpO1xyXG5cclxuICB1cGRhdGVEYXRlc0NlbGxzKHRoaXMuZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIHRoaXMuY2xhc3Nlcy5vZmZNb250aERhdGUsIHRoaXMuY2xhc3Nlcy5jdXJyZW50RGF0ZSwgdGhpcy5jbGFzc2VzLnNsb3REYXRlTGFiZWwsIHRoaXMuc2hvd1NpeFdlZWtzKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIC8vIFNldCBhdmFpbGFiaWxpdHkgb2YgZWFjaCBkYXRlIHNsb3QvY2VsbDpcclxuICBpdGVyYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgZnVuY3Rpb24gKGRhdGUsIHgsIHksIGkpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICB2YXIgc2xvdCA9IHRoYXQuZGF0YS5zbG90c1tkYXRla2V5XTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIHNpbXBsZSBhbmQgZGV0YWlsZWQgc3RhdHVzIGRlc2NyaXB0aW9uOlxyXG4gICAgdmFyIGRhdGVTdGF0dXMgPSAkLmlzUGxhaW5PYmplY3Qoc2xvdCkgPyBzbG90LnN0YXR1cyA6IHNsb3Q7XHJcbiAgICAvLyBEZWZhdWx0IHZhbHVlIGZyb20gZGF0YTpcclxuICAgIGRhdGVTdGF0dXMgPSBkYXRlU3RhdHVzIHx8IHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICd1bmtub3cnO1xyXG5cclxuICAgIGlmIChkYXRlU3RhdHVzKVxyXG4gICAgICB0aGlzLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgZGF0ZVN0YXR1cyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIE5vdGlmaWNhdGlvbnM6XHJcbiAgdGhpcy5ib29raW5nc05vdGlmaWNhdGlvbi5yZW5kZXIoKTtcclxufSxcclxuZ2V0VXBkYXRlZERhdGE6IGZ1bmN0aW9uIGdldFVwZGF0ZWREYXRhKCkge1xyXG4gIHZhciBkID0ge307XHJcbiAgaWYgKHRoaXMuZWRpdGFibGUpIHtcclxuICAgIC8vIENvcHkgZGF0YSwgd2UgZG9uJ3Qgd2FudCBjaGFuZ2UgdGhlIG9yaWdpbmFsOlxyXG4gICAgZXh0ZW5kKGQsIHRoaXMuZGF0YSk7XHJcblxyXG4gICAgLy8gRmlsdGVyIHNsb3RzIHRvIGdldCBvbmx5IHRoYXQgdXBkYXRlZCBieSBkZSB1c2VyOlxyXG4gICAgZC5zbG90cyA9IG9iamVjdFV0aWxzLmZpbHRlclByb3BlcnRpZXMoZC5zbG90cywgZnVuY3Rpb24gKGssIHYpIHtcclxuICAgICAgcmV0dXJuIHYuc291cmNlID09ICd1c2VyJztcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gZDtcclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gTW9udGhseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAvLyBJbml0aWFsaXppbmcgc29tZSBkYXRhLCBiZWluZyBjYXJlIG9mIGFueSB2YWx1ZVxyXG4gIC8vIHRoYXQgY29tZXMgZnJvbSBtZXJnaW5nIG9wdGlvbnMgaW50byAndGhpcydcclxuICB0aGlzLnVzZXIgPSB0aGlzLnVzZXIgfHwgdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG4gIHRoaXMucXVlcnkgPSBleHRlbmQoe1xyXG4gICAgdXNlcjogdGhpcy51c2VyLFxyXG4gICAgdHlwZTogJ21vbnRobHktc2NoZWR1bGUnXHJcbiAgfSwgdGhpcy5xdWVyeSk7XHJcblxyXG4gIC8vIElmIGlzIG5vdCBzZXQgYnkgY29uc3RydWN0b3Igb3B0aW9ucywgZ2V0IFxyXG4gIC8vICdlZGl0YWJsZScgZnJvbSBkYXRhLCBvciBsZWZ0IGRlZmF1bHQ6XHJcbiAgaWYgKCEob3B0aW9ucyAmJiB0eXBlb2YgKG9wdGlvbnMuZWRpdGFibGUpICE9ICd1bmRlZmluZWQnKSAmJlxyXG4gICAgdHlwZW9mICh0aGlzLiRlbC5kYXRhKCdlZGl0YWJsZScpKSAhPSAndW5kZWZpbmVkJylcclxuICAgIHRoaXMuZWRpdGFibGUgPSAhIXRoaXMuJGVsLmRhdGEoJ2VkaXRhYmxlJyk7XHJcblxyXG5cclxuICAvLyBTZXQgaGFuZGxlcnMgZm9yIHByZXYtbmV4dCBhY3Rpb25zOlxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5wcmV2QWN0aW9uLCBmdW5jdGlvbiBwcmV2KCkge1xyXG4gICAgbW92ZUJpbmRNb250aCh0aGF0LCAtMSk7XHJcbiAgfSk7XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLm5leHRBY3Rpb24sIGZ1bmN0aW9uIG5leHQoKSB7XHJcbiAgICBtb3ZlQmluZE1vbnRoKHRoYXQsIDEpO1xyXG4gIH0pO1xyXG4gIC8vIEhhbmRsZXIgZm9yIHRvZGF5IGFjdGlvblxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy50b2RheUFjdGlvbiwgZnVuY3Rpb24gdG9kYXkoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MobnVsbCwgdGhpcy5zaG93U2l4V2Vla3MpKTtcclxuICB9KTtcclxuXHJcbiAgLy8gRWRpdGFibGUgbW9kZVxyXG4gIGlmICh0aGlzLmVkaXRhYmxlKSB7XHJcbiAgICB0aGlzLnF1ZXJ5LmVkaXRhYmxlID0gdHJ1ZTtcclxuICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyArICcgdGQnLCBmdW5jdGlvbiBjbGlja1RvZ2dsZUF2YWlsYWJpbGl0eSgpIHtcclxuICAgICAgdG9nZ2xlRGF0ZUF2YWlsYWJpbGl0eSh0aGF0LCAkKHRoaXMpKTtcclxuICAgIH0pO1xyXG4gICAgdGhpcy4kZWwuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLmVkaXRhYmxlKTtcclxuICB9XHJcblxyXG4gIC8vIENyZWF0aW5nIHRoZSBib29raW5nc05vdGlmaWNhdGlvbiBlbGVtZW50LCBib3RoIGVkaXRhYmxlIGFuZCByZWFkLW9ubHkgbW9kZXMuXHJcbiAgLy8gUmVhZC1vbmx5IG1vZGUgbmVlZCBoaWRkZW4gdGhlIGVsZW1lbnQgYW5kIHRoYXRzIGRvbmUgb24gY29uc3RydWN0b3IgYW5kIGVkaXRhYmxlXHJcbiAgLy8gd2lsbCByZW5kZXIgaXQgb24gYmluZERhdGFcclxuICB0aGlzLmJvb2tpbmdzTm90aWZpY2F0aW9uID0gbmV3IEJvb2tpbmdzTm90aWZpY2F0aW9uKHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLmJvb2tpbmdzTm90aWZpY2F0aW9uKSk7XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgbW9udGhcclxuICB2YXIgZmlyc3REYXRlcyA9IHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MobnVsbCwgdGhpcy5zaG93U2l4V2Vla3MpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShmaXJzdERhdGVzKSkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKGZpcnN0RGF0ZXMpO1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCBtb250aCBpbiBhZHZhbmNlXHJcbiAgICBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaCh0aGF0LCBmaXJzdERhdGVzKTtcclxuICB9KTtcclxuXHJcbiAgY2hlY2tDdXJyZW50TW9udGgodGhpcy4kZWwsIGZpcnN0RGF0ZXMuc3RhcnQsIHRoaXMpO1xyXG5cclxuICAvLyBTaG93IGVycm9yIG1lc3NhZ2VcclxuICB0aGlzLmV2ZW50cy5vbignaGFzRXJyb3JDaGFuZ2VkJywgdXRpbHMuaGFuZGxlckNhbGVuZGFyRXJyb3IpO1xyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbk1vbnRobHkuZW5hYmxlQWxsID0gZnVuY3Rpb24gb24ob3B0aW9ucykge1xyXG4gIHZhciBsaXN0ID0gW107XHJcbiAgJCgnLicgKyBNb250aGx5LnByb3RvdHlwZS5jbGFzc2VzLm1vbnRobHlDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IE1vbnRobHkodGhpcywgb3B0aW9ucykpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBsaXN0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb250aGx5O1xyXG4iLCIvKipcclxuICBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgTGNXaWRnZXQgPSByZXF1aXJlKCcuLi9DWC9MY1dpZGdldCcpLFxyXG4gIGV4dGVuZCA9IHJlcXVpcmUoJy4uL0NYL2V4dGVuZCcpO1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcblxyXG4vKipcclxuV2Vla2x5IGNhbGVuZGFyLCBpbmhlcml0cyBmcm9tIExjV2lkZ2V0XHJcbioqL1xyXG52YXIgV2Vla2x5ID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiB1dGlscy53ZWVrbHlDbGFzc2VzLFxyXG50ZXh0czogdXRpbHMud2Vla2x5VGV4dHMsXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcblxyXG4vLyBPdXIgJ3ZpZXcnIHdpbGwgYmUgYSBzdWJzZXQgb2YgdGhlIGRhdGEsXHJcbi8vIGRlbGltaXRlZCBieSB0aGUgbmV4dCBwcm9wZXJ0eSwgYSBkYXRlcyByYW5nZTpcclxuZGF0ZXNSYW5nZTogeyBzdGFydDogbnVsbCwgZW5kOiBudWxsIH0sXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YVdlZWtseShkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5zbG90cykgcmV0dXJuO1xyXG5cclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICB1dGlscy5jaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBkYXRlc1JhbmdlLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgdXRpbHMudXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIHRoaXMuJGVsLCB0aGlzKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB1dGlscy5kYXRlLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICB2YXIgZGF0ZVNsb3RzID0gdGhhdC5kYXRhLnNsb3RzW2RhdGVrZXldO1xyXG4gICAgaWYgKGRhdGVTbG90cykge1xyXG4gICAgICBmb3IgKHMgPSAwOyBzIDwgZGF0ZVNsb3RzLmxlbmd0aDsgcysrKSB7XHJcbiAgICAgICAgdmFyIHNsb3QgPSBkYXRlU2xvdHNbc107XHJcbiAgICAgICAgdmFyIHNsb3RDZWxsID0gdXRpbHMuZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIGksIHNsb3QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkZWZhdWx0IHN0YXR1c1xyXG4gICAgICAgIHNsb3RDZWxsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ18nKTtcclxuICAgICAgICAvLyBBZGRpbmcgc3RhdHVzIGNsYXNzXHJcbiAgICAgICAgc2xvdENlbGwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBXZWVrbHkoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIC8vIFJldXNpbmcgYmFzZSBjb25zdHJ1Y3RvciB0b28gZm9yIGluaXRpYWxpemluZzpcclxuICBMY1dpZGdldC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIC8vIFRvIHVzZSB0aGlzIGluIGNsb3N1cmVzOlxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdGhpcy51c2VyID0gdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG4gIHRoaXMucXVlcnkgPSB7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnd2Vla2x5J1xyXG4gIH07XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgd2Vla1xyXG4gIHZhciBmaXJzdERhdGVzID0gdXRpbHMuZGF0ZS5jdXJyZW50V2VlaygpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShmaXJzdERhdGVzKSkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKGZpcnN0RGF0ZXMpO1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHV0aWxzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2godGhhdCwgZmlyc3REYXRlcyk7XHJcbiAgfSk7XHJcbiAgdXRpbHMuY2hlY2tDdXJyZW50V2Vlayh0aGlzLiRlbCwgZmlyc3REYXRlcy5zdGFydCwgdGhpcyk7XHJcblxyXG4gIC8vIFNldCBoYW5kbGVycyBmb3IgcHJldi1uZXh0IGFjdGlvbnM6XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnByZXZBY3Rpb24sIGZ1bmN0aW9uIHByZXYoKSB7XHJcbiAgICB1dGlscy5tb3ZlQmluZFJhbmdlSW5EYXlzKHRoYXQsIC03KTtcclxuICB9KTtcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMubmV4dEFjdGlvbiwgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgNyk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFNob3cgZXJyb3IgbWVzc2FnZVxyXG4gIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCB1dGlscy5oYW5kbGVyQ2FsZW5kYXJFcnJvcik7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldlZWtseS5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdlZWtseS5wcm90b3R5cGUuY2xhc3Nlcy53ZWVrbHlDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdlZWtseSh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdlZWtseTtcclxuIiwiLyoqXHJcbiAgV29yayBIb3VycyBjYWxlbmRhciBjbGFzc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4uL0NYL0xjV2lkZ2V0JyksXHJcbiAgZXh0ZW5kID0gcmVxdWlyZSgnLi4vQ1gvZXh0ZW5kJyksXHJcbiAgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXHJcbiAgY2xlYXJDdXJyZW50U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9jbGVhckN1cnJlbnRTZWxlY3Rpb24nKSxcclxuICBtYWtlVW5zZWxlY3RhYmxlID0gcmVxdWlyZSgnLi9tYWtlVW5zZWxlY3RhYmxlJyk7XHJcbnJlcXVpcmUoJy4uL2pxdWVyeS5ib3VuZHMnKTtcclxudmFyIGV2ZW50cyA9IHtcclxuICAgIGRhdGFDaGFuZ2VkOiAnZGF0YUNoYW5nZWQnXHJcbn07XHJcblxyXG4vKipcclxuV29yayBob3VycyBwcml2YXRlIHV0aWxzXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cEVkaXRXb3JrSG91cnMoKSB7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIC8vIFNldCBoYW5kbGVycyB0byBzd2l0Y2ggc3RhdHVzIGFuZCB1cGRhdGUgYmFja2VuZCBkYXRhXHJcbiAgLy8gd2hlbiB0aGUgdXNlciBzZWxlY3QgY2VsbHNcclxuICB2YXIgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyk7XHJcblxyXG4gIGZ1bmN0aW9uIHRvZ2dsZUNlbGwoY2VsbCkge1xyXG4gICAgLy8gRmluZCBkYXkgYW5kIHRpbWUgb2YgdGhlIGNlbGw6XHJcbiAgICB2YXIgc2xvdCA9IHV0aWxzLmZpbmRTbG90QnlDZWxsKHNsb3RzQ29udGFpbmVyLCBjZWxsKTtcclxuICAgIC8vIEdldCB3ZWVrLWRheSBzbG90cyBhcnJheTpcclxuICAgIHZhciB3a3Nsb3RzID0gdGhhdC5kYXRhLnNsb3RzW3V0aWxzLnN5c3RlbVdlZWtEYXlzW3Nsb3QuZGF5XV0gPSB0aGF0LmRhdGEuc2xvdHNbdXRpbHMuc3lzdGVtV2Vla0RheXNbc2xvdC5kYXldXSB8fCBbXTtcclxuICAgIC8vIElmIGl0IGhhcyBhbHJlYWR5IHRoZSBkYXRhLnN0YXR1cywgdG9nZ2xlIHRvIHRoZSBkZWZhdWx0U3RhdHVzXHJcbiAgICAvLyAgdmFyIHN0YXR1c0NsYXNzID0gdGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzLFxyXG4gICAgLy8gICAgICBkZWZhdWx0U3RhdHVzQ2xhc3MgPSB0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzO1xyXG4gICAgLy9pZiAoY2VsbC5oYXNDbGFzcyhzdGF0dXNDbGFzc1xyXG4gICAgLy8gVG9nZ2xlIGZyb20gdGhlIGFycmF5XHJcbiAgICB2YXIgc3Ryc2xvdCA9IGRhdGVJU08udGltZUxvY2FsKHNsb3Quc2xvdCwgdHJ1ZSksXHJcbiAgICAgIGlzbG90ID0gd2tzbG90cy5pbmRleE9mKHN0cnNsb3QpO1xyXG4gICAgaWYgKGlzbG90ID09IC0xKVxyXG4gICAgICB3a3Nsb3RzLnB1c2goc3Ryc2xvdCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIC8vZGVsZXRlIHdrc2xvdHNbaXNsb3RdO1xyXG4gICAgICB3a3Nsb3RzLnNwbGljZShpc2xvdCwgMSk7XHJcblxyXG4gICAgdGhhdC5ldmVudHMuZW1pdChldmVudHMuZGF0YUNoYW5nZWQsIGNlbGwsIHNsb3QpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2VsbFJhbmdlKGZpcnN0Q2VsbCwgbGFzdENlbGwpIHtcclxuICAgIHZhciBcclxuICAgICAgeCA9IGZpcnN0Q2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgoZmlyc3RDZWxsKSxcclxuICAgICAgeTEgPSBmaXJzdENlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpLFxyXG4gICAgLy94MiA9IGxhc3RDZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChsYXN0Q2VsbCksXHJcbiAgICAgIHkyID0gbGFzdENlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpO1xyXG5cclxuICAgIGlmICh5MSA+IHkyKSB7XHJcbiAgICAgIHZhciB5MCA9IHkxO1xyXG4gICAgICB5MSA9IHkyO1xyXG4gICAgICB5MiA9IHkwO1xyXG4gICAgfVxyXG5cclxuICAgIGZvciAodmFyIHkgPSB5MTsgeSA8PSB5MjsgeSsrKSB7XHJcbiAgICAgIHZhciBjZWxsID0gZmlyc3RDZWxsLmNsb3Nlc3QoJ3Rib2R5JykuY2hpbGRyZW4oJ3RyOmVxKCcgKyB5ICsgJyknKS5jaGlsZHJlbigndGQ6ZXEoJyArIHggKyAnKScpO1xyXG4gICAgICB0b2dnbGVDZWxsKGNlbGwpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdmFyIGRyYWdnaW5nID0ge1xyXG4gICAgZmlyc3Q6IG51bGwsXHJcbiAgICBsYXN0OiBudWxsLFxyXG4gICAgc2VsZWN0aW9uTGF5ZXI6ICQoJzxkaXYgY2xhc3M9XCJTZWxlY3Rpb25MYXllclwiIC8+JykuYXBwZW5kVG8odGhpcy4kZWwpLFxyXG4gICAgZG9uZTogZmFsc2VcclxuICB9O1xyXG4gIFxyXG4gIGZ1bmN0aW9uIG9mZnNldFRvUG9zaXRpb24oZWwsIG9mZnNldCkge1xyXG4gICAgdmFyIHBiID0gJChlbC5vZmZzZXRQYXJlbnQpLmJvdW5kcygpLFxyXG4gICAgICBzID0ge307XHJcblxyXG4gICAgcy50b3AgPSBvZmZzZXQudG9wIC0gcGIudG9wO1xyXG4gICAgcy5sZWZ0ID0gb2Zmc2V0LmxlZnQgLSBwYi5sZWZ0O1xyXG5cclxuICAgIC8vcy5ib3R0b20gPSBwYi50b3AgLSBvZmZzZXQuYm90dG9tO1xyXG4gICAgLy9zLnJpZ2h0ID0gb2Zmc2V0LmxlZnQgLSBvZmZzZXQucmlnaHQ7XHJcbiAgICBzLmhlaWdodCA9IG9mZnNldC5ib3R0b20gLSBvZmZzZXQudG9wO1xyXG4gICAgcy53aWR0aCA9IG9mZnNldC5yaWdodCAtIG9mZnNldC5sZWZ0O1xyXG5cclxuICAgICQoZWwpLmNzcyhzKTtcclxuICAgIHJldHVybiBzO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXBkYXRlU2VsZWN0aW9uKGVsKSB7XHJcbiAgICB2YXIgYSA9IGRyYWdnaW5nLmZpcnN0LmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICB2YXIgYiA9IGVsLmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICB2YXIgcyA9IGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcblxyXG4gICAgcy50b3AgPSBhLnRvcCA8IGIudG9wID8gYS50b3AgOiBiLnRvcDtcclxuICAgIHMuYm90dG9tID0gYS5ib3R0b20gPiBiLmJvdHRvbSA/IGEuYm90dG9tIDogYi5ib3R0b207XHJcblxyXG4gICAgb2Zmc2V0VG9Qb3NpdGlvbihkcmFnZ2luZy5zZWxlY3Rpb25MYXllclswXSwgcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmaW5pc2hEcmFnKCkge1xyXG4gICAgaWYgKGRyYWdnaW5nLmZpcnN0ICYmIGRyYWdnaW5nLmxhc3QpIHtcclxuICAgICAgdG9nZ2xlQ2VsbFJhbmdlKGRyYWdnaW5nLmZpcnN0LCBkcmFnZ2luZy5sYXN0KTtcclxuICAgICAgdGhhdC5iaW5kRGF0YSgpO1xyXG5cclxuICAgICAgZHJhZ2dpbmcuZG9uZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBkcmFnZ2luZy5maXJzdCA9IGRyYWdnaW5nLmxhc3QgPSBudWxsO1xyXG4gICAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuaGlkZSgpO1xyXG4gICAgbWFrZVVuc2VsZWN0YWJsZS5vZmYodGhhdC4kZWwpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICB0aGlzLiRlbC5maW5kKHNsb3RzQ29udGFpbmVyKS5vbignY2xpY2snLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBEbyBleGNlcHQgYWZ0ZXIgYSBkcmFnZ2luZyBkb25lIGNvbXBsZXRlXHJcbiAgICBpZiAoZHJhZ2dpbmcuZG9uZSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgdG9nZ2xlQ2VsbCgkKHRoaXMpKTtcclxuICAgIHRoYXQuYmluZERhdGEoKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbiAgdGhpcy4kZWwuZmluZChzbG90c0NvbnRhaW5lcilcclxuICAub24oJ21vdXNlZG93bicsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGRyYWdnaW5nLmRvbmUgPSBmYWxzZTtcclxuICAgIGRyYWdnaW5nLmZpcnN0ID0gJCh0aGlzKTtcclxuICAgIGRyYWdnaW5nLmxhc3QgPSBudWxsO1xyXG4gICAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuc2hvdygpO1xyXG5cclxuICAgIG1ha2VVbnNlbGVjdGFibGUodGhhdC4kZWwpO1xyXG4gICAgY2xlYXJDdXJyZW50U2VsZWN0aW9uKCk7XHJcblxyXG4gICAgdmFyIHMgPSBkcmFnZ2luZy5maXJzdC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgb2Zmc2V0VG9Qb3NpdGlvbihkcmFnZ2luZy5zZWxlY3Rpb25MYXllclswXSwgcyk7XHJcblxyXG4gIH0pXHJcbiAgLm9uKCdtb3VzZWVudGVyJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKGRyYWdnaW5nLmZpcnN0KSB7XHJcbiAgICAgIGRyYWdnaW5nLmxhc3QgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgdXBkYXRlU2VsZWN0aW9uKGRyYWdnaW5nLmxhc3QpO1xyXG4gICAgfVxyXG4gIH0pXHJcbiAgLm9uKCdtb3VzZXVwJywgZmluaXNoRHJhZylcclxuICAuZmluZCgndGQnKVxyXG4gIC5hdHRyKCdkcmFnZ2FibGUnLCBmYWxzZSk7XHJcblxyXG4gIC8vIFRoaXMgd2lsbCBub3Qgd29yayB3aXRoIHBvaW50ZXItZXZlbnRzOm5vbmUsIGJ1dCBvbiBvdGhlclxyXG4gIC8vIGNhc2VzIChyZWNlbnRJRSlcclxuICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5vbignbW91c2V1cCcsIGZpbmlzaERyYWcpXHJcbiAgLmF0dHIoJ2RyYWdnYWJsZScsIGZhbHNlKTtcclxuXHJcbn1cclxuXHJcbi8qKlxyXG5Xb3JrIGhvdXJzIGNhbGVuZGFyLCBpbmhlcml0cyBmcm9tIExjV2lkZ2V0XHJcbioqL1xyXG52YXIgV29ya0hvdXJzID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiBleHRlbmQoe30sIHV0aWxzLndlZWtseUNsYXNzZXMsIHtcclxuICB3ZWVrbHlDYWxlbmRhcjogdW5kZWZpbmVkLFxyXG4gIHdvcmtIb3Vyc0NhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItLXdvcmtIb3VycydcclxufSksXHJcbnRleHRzOiB1dGlscy53ZWVrbHlUZXh0cyxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhV29ya0hvdXJzKCkge1xyXG4gIHZhciBcclxuICAgIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpLFxyXG4gICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgdXRpbHMuc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdXRpbHMuc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgLy8gU2V0IGFsbCBzbG90cyB3aXRoIGRlZmF1bHQgc3RhdHVzXHJcbiAgc2xvdHMuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cyk7XHJcblxyXG4gIGlmICghdGhpcy5kYXRhLnNsb3RzIHx8ICF0aGlzLmRhdGEuc3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgZm9yICh2YXIgd2sgPSAwOyB3ayA8IHV0aWxzLnN5c3RlbVdlZWtEYXlzLmxlbmd0aDsgd2srKykge1xyXG4gICAgdmFyIGRhdGVTbG90cyA9IHRoYXQuZGF0YS5zbG90c1t1dGlscy5zeXN0ZW1XZWVrRGF5c1t3a11dO1xyXG4gICAgaWYgKGRhdGVTbG90cyAmJiBkYXRlU2xvdHMubGVuZ3RoKSB7XHJcbiAgICAgIGZvciAocyA9IDA7IHMgPCBkYXRlU2xvdHMubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICB2YXIgc2xvdCA9IGRhdGVTbG90c1tzXTtcclxuICAgICAgICB2YXIgc2xvdENlbGwgPSB1dGlscy5maW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgd2ssIHNsb3QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkZWZhdWx0IHN0YXR1c1xyXG4gICAgICAgIHNsb3RDZWxsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ18nKTtcclxuICAgICAgICAvLyBBZGRpbmcgc3RhdHVzIGNsYXNzXHJcbiAgICAgICAgc2xvdENlbGwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gV29ya0hvdXJzKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICBMY1dpZGdldC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdGhpcy51c2VyID0gdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG5cclxuICB0aGlzLnF1ZXJ5ID0ge1xyXG4gICAgdXNlcjogdGhpcy51c2VyLFxyXG4gICAgdHlwZTogJ3dvcmtIb3VycydcclxuICB9O1xyXG5cclxuICAvLyBGZXRjaCB0aGUgZGF0YTogdGhlcmUgaXMgbm90IGEgbW9yZSBzcGVjaWZpYyBxdWVyeSxcclxuICAvLyBpdCBqdXN0IGdldCB0aGUgaG91cnMgZm9yIGVhY2ggd2Vlay1kYXkgKGRhdGFcclxuICAvLyBzbG90cyBhcmUgcGVyIHdlZWstZGF5IGluc3RlYWQgb2YgcGVyIGRhdGUgY29tcGFyZWRcclxuICAvLyB0byAqd2Vla2x5KilcclxuICB0aGlzLmZldGNoRGF0YSgpLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC5iaW5kRGF0YSgpO1xyXG4gIH0pO1xyXG5cclxuICBzZXR1cEVkaXRXb3JrSG91cnMuY2FsbCh0aGlzKTtcclxuXHJcbiAgLy8gU2hvdyBlcnJvciBtZXNzYWdlXHJcbiAgdGhpcy5ldmVudHMub24oJ2hhc0Vycm9yQ2hhbmdlZCcsIHV0aWxzLmhhbmRsZXJDYWxlbmRhckVycm9yKTtcclxuXHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXb3JraG91cnMgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuV29ya0hvdXJzLmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgV29ya0hvdXJzLnByb3RvdHlwZS5jbGFzc2VzLndvcmtIb3Vyc0NhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgV29ya0hvdXJzKHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV29ya0hvdXJzOyIsIi8qKlxyXG5Dcm9zcyBicm93c2VyIHdheSB0byB1bnNlbGVjdCBjdXJyZW50IHNlbGVjdGlvblxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjbGVhckN1cnJlbnRTZWxlY3Rpb24oKSB7XHJcbiAgaWYgKHR5cGVvZiAod2luZG93LmdldFNlbGVjdGlvbikgPT09ICdmdW5jdGlvbicpXHJcbiAgLy8gU3RhbmRhcmRcclxuICAgIHdpbmRvdy5nZXRTZWxlY3Rpb24oKS5yZW1vdmVBbGxSYW5nZXMoKTtcclxuICBlbHNlIGlmIChkb2N1bWVudC5zZWxlY3Rpb24gJiYgdHlwZW9mIChkb2N1bWVudC5zZWxlY3Rpb24uZW1wdHkpID09PSAnZnVuY3Rpb24nKVxyXG4gIC8vIElFXHJcbiAgICBkb2N1bWVudC5zZWxlY3Rpb24uZW1wdHkoKTtcclxufTsiLCIvKipcclxuICBBIGNvbGxlY3Rpb24gb2YgdXNlZnVsIGdlbmVyaWMgdXRpbHMgbWFuYWdpbmcgRGF0ZXNcclxuKiovXHJcbnZhciBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKTtcclxuXHJcbmZ1bmN0aW9uIGN1cnJlbnRXZWVrKCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZ2V0Rmlyc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKSxcclxuICAgIGVuZDogZ2V0TGFzdFdlZWtEYXRlKG5ldyBEYXRlKCkpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmN1cnJlbnRXZWVrID0gY3VycmVudFdlZWs7XHJcblxyXG5mdW5jdGlvbiBuZXh0V2VlayhzdGFydCwgZW5kKSB7XHJcbiAgLy8gVW5pcXVlIHBhcmFtIHdpdGggYm90aCBwcm9waWVydGllczpcclxuICBpZiAoc3RhcnQuZW5kKSB7XHJcbiAgICBlbmQgPSBzdGFydC5lbmQ7XHJcbiAgICBzdGFydCA9IHN0YXJ0LnN0YXJ0O1xyXG4gIH1cclxuICAvLyBPcHRpb25hbCBlbmQ6XHJcbiAgZW5kID0gZW5kIHx8IGFkZERheXMoc3RhcnQsIDcpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogYWRkRGF5cyhzdGFydCwgNyksXHJcbiAgICBlbmQ6IGFkZERheXMoZW5kLCA3KVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5uZXh0V2VlayA9IG5leHRXZWVrO1xyXG5cclxuZnVuY3Rpb24gZ2V0Rmlyc3RXZWVrRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgLSBkLmdldERheSgpKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldEZpcnN0V2Vla0RhdGUgPSBnZXRGaXJzdFdlZWtEYXRlO1xyXG5cclxuZnVuY3Rpb24gZ2V0TGFzdFdlZWtEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSArICg2IC0gZC5nZXREYXkoKSkpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0TGFzdFdlZWtEYXRlID0gZ2V0TGFzdFdlZWtEYXRlO1xyXG5cclxuZnVuY3Rpb24gaXNJbkN1cnJlbnRXZWVrKGRhdGUpIHtcclxuICByZXR1cm4gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RXZWVrRGF0ZShkYXRlKSkgPT0gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKSk7XHJcbn1cclxuZXhwb3J0cy5pc0luQ3VycmVudFdlZWsgPSBpc0luQ3VycmVudFdlZWs7XHJcblxyXG5mdW5jdGlvbiBhZGREYXlzKGRhdGUsIGRheXMpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGRheXMpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuYWRkRGF5cyA9IGFkZERheXM7XHJcblxyXG5mdW5jdGlvbiBlYWNoRGF0ZUluUmFuZ2Uoc3RhcnQsIGVuZCwgZm4pIHtcclxuICBpZiAoIWZuLmNhbGwpIHRocm93IG5ldyBFcnJvcignZm4gbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIFwiY2FsbFwiYWJsZSBvYmplY3QnKTtcclxuICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHN0YXJ0KTtcclxuICB2YXIgaSA9IDAsIHJldDtcclxuICB3aGlsZSAoZGF0ZSA8PSBlbmQpIHtcclxuICAgIHJldCA9IGZuLmNhbGwoZm4sIGRhdGUsIGkpO1xyXG4gICAgLy8gQWxsb3cgZm4gdG8gY2FuY2VsIHRoZSBsb29wIHdpdGggc3RyaWN0ICdmYWxzZSdcclxuICAgIGlmIChyZXQgPT09IGZhbHNlKVxyXG4gICAgICBicmVhaztcclxuICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDEpO1xyXG4gICAgaSsrO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLmVhY2hEYXRlSW5SYW5nZSA9IGVhY2hEYXRlSW5SYW5nZTtcclxuXHJcbi8qKiBNb250aHMgKiovXHJcblxyXG5mdW5jdGlvbiBnZXRGaXJzdE1vbnRoRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoMSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRGaXJzdE1vbnRoRGF0ZSA9IGdldEZpcnN0TW9udGhEYXRlO1xyXG5cclxuZnVuY3Rpb24gZ2V0TGFzdE1vbnRoRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldE1vbnRoKGQuZ2V0TW9udGgoKSArIDEsIDEpO1xyXG4gIGQgPSBhZGREYXlzKGQsIC0xKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldExhc3RNb250aERhdGUgPSBnZXRMYXN0TW9udGhEYXRlO1xyXG5cclxuZnVuY3Rpb24gaXNJbkN1cnJlbnRNb250aChkYXRlKSB7XHJcbiAgcmV0dXJuIGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0TW9udGhEYXRlKGRhdGUpKSA9PSBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdE1vbnRoRGF0ZShuZXcgRGF0ZSgpKSk7XHJcbn1cclxuZXhwb3J0cy5pc0luQ3VycmVudE1vbnRoID0gaXNJbkN1cnJlbnRNb250aDtcclxuXHJcbi8qKlxyXG4gIEdldCBhIGRhdGVzIHJhbmdlIGZvciB0aGUgY3VycmVudCBtb250aFxyXG4gIChvciB0aGUgZ2l2ZW4gZGF0ZSBhcyBiYXNlKVxyXG4qKi9cclxuZnVuY3Rpb24gY3VycmVudE1vbnRoKGJhc2VEYXRlKSB7XHJcbiAgYmFzZURhdGUgPSBiYXNlRGF0ZSB8fCBuZXcgRGF0ZSgpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZ2V0Rmlyc3RNb250aERhdGUoYmFzZURhdGUpLFxyXG4gICAgZW5kOiBnZXRMYXN0TW9udGhEYXRlKGJhc2VEYXRlKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50TW9udGggPSBjdXJyZW50TW9udGg7XHJcblxyXG5mdW5jdGlvbiBuZXh0TW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykge1xyXG4gIGFtb3VudE1vbnRocyA9IGFtb3VudE1vbnRocyB8fCAxO1xyXG4gIHZhciBkID0gbmV3IERhdGUoZnJvbURhdGUpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZC5zZXRNb250aChkLmdldE1vbnRoKCkgKyBhbW91bnRNb250aHMsIDEpLFxyXG4gICAgZW5kOiBnZXRMYXN0TW9udGhEYXRlKGQpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLm5leHRNb250aCA9IG5leHRNb250aDtcclxuXHJcbmZ1bmN0aW9uIHByZXZpb3VzTW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykge1xyXG4gIHJldHVybiBuZXh0TW9udGgoZnJvbURhdGUsIDAgLSBhbW91bnRNb250aHMpO1xyXG59XHJcbmV4cG9ydHMucHJldmlvdXNNb250aCA9IHByZXZpb3VzTW9udGg7XHJcblxyXG4vKipcclxuICBHZXQgYSBkYXRlcyByYW5nZSBmb3IgdGhlIGNvbXBsZXRlIHdlZWtzXHJcbiAgdGhhdCBhcmUgcGFydCBvZiB0aGUgY3VycmVudCBtb250aFxyXG4gIChvciB0aGUgZ2l2ZW4gZGF0ZSBhcyBiYXNlKS5cclxuICBUaGF0IG1lYW5zLCB0aGF0IHN0YXJ0IGRhdGUgd2lsbCBiZSB0aGUgZmlyc3RcclxuICB3ZWVrIGRhdGUgb2YgdGhlIGZpcnN0IG1vbnRoIHdlZWsgKHRoYXQgY2FuXHJcbiAgYmUgdGhlIGRheSAxIG9mIHRoZSBtb250aCBvciBvbmUgb2YgdGhlIGxhc3RcclxuICBkYXRlcyBmcm9tIHRoZSBwcmV2aW91cyBtb250aHMpLFxyXG4gIGFuZCBzaW1pbGFyIGZvciB0aGUgZW5kIGRhdGUgYmVpbmcgdGhlIFxyXG4gIGxhc3Qgd2VlayBkYXRlIG9mIHRoZSBsYXN0IG1vbnRoIHdlZWsuXHJcblxyXG4gIEBpbmNsdWRlU2l4V2Vla3M6IHNvbWV0aW1lcyBpcyB1c2VmdWwgZ2V0IGV2ZXIgYVxyXG4gIHNpeCB3ZWVrcyBkYXRlcyByYW5nZSBzdGFyaW5nIGJ5IHRoZSBmaXJzdCB3ZWVrIG9mXHJcbiAgdGhlIGJhc2VEYXRlIG1vbnRoLiBCeSBkZWZhdWx0IGlzIGZhbHNlLlxyXG4qKi9cclxuZnVuY3Rpb24gY3VycmVudE1vbnRoV2Vla3MoYmFzZURhdGUsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHZhciByID0gY3VycmVudE1vbnRoKGJhc2VEYXRlKSxcclxuICAgIHMgPSBnZXRGaXJzdFdlZWtEYXRlKHIuc3RhcnQpLFxyXG4gICAgZSA9IGluY2x1ZGVTaXhXZWVrcyA/IGFkZERheXMocywgNio3IC0gMSkgOiBnZXRMYXN0V2Vla0RhdGUoci5lbmQpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogcyxcclxuICAgIGVuZDogZVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50TW9udGhXZWVrcyA9IGN1cnJlbnRNb250aFdlZWtzO1xyXG5cclxuZnVuY3Rpb24gbmV4dE1vbnRoV2Vla3MoZnJvbURhdGUsIGFtb3VudE1vbnRocywgaW5jbHVkZVNpeFdlZWtzKSB7XHJcbiAgcmV0dXJuIGN1cnJlbnRNb250aFdlZWtzKG5leHRNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKS5zdGFydCwgaW5jbHVkZVNpeFdlZWtzKTtcclxufVxyXG5leHBvcnRzLm5leHRNb250aFdlZWtzID0gbmV4dE1vbnRoV2Vla3M7XHJcblxyXG5mdW5jdGlvbiBwcmV2aW91c01vbnRoV2Vla3MoZnJvbURhdGUsIGFtb3VudE1vbnRocywgaW5jbHVkZVNpeFdlZWtzKSB7XHJcbiAgcmV0dXJuIGN1cnJlbnRNb250aFdlZWtzKHByZXZpb3VzTW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykuc3RhcnQsIGluY2x1ZGVTaXhXZWVrcyk7XHJcbn1cclxuZXhwb3J0cy5wcmV2aW91c01vbnRoV2Vla3MgPSBwcmV2aW91c01vbnRoV2Vla3M7XHJcbiIsIi8qKiBWZXJ5IHNpbXBsZSBjdXN0b20tZm9ybWF0IGZ1bmN0aW9uIHRvIGFsbG93IFxyXG5sMTBuIG9mIHRleHRzLlxyXG5Db3ZlciBjYXNlczpcclxuLSBNIGZvciBtb250aFxyXG4tIEQgZm9yIGRheVxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBmb3JtYXREYXRlKGRhdGUsIGZvcm1hdCkge1xyXG4gIHZhciBzID0gZm9ybWF0LFxyXG4gICAgICBNID0gZGF0ZS5nZXRNb250aCgpICsgMSxcclxuICAgICAgRCA9IGRhdGUuZ2V0RGF0ZSgpO1xyXG4gIHMgPSBzLnJlcGxhY2UoL00vZywgTSk7XHJcbiAgcyA9IHMucmVwbGFjZSgvRC9nLCBEKTtcclxuICByZXR1cm4gcztcclxufTsiLCIvKipcclxuICBFeHBvc2luZyBhbGwgdGhlIHB1YmxpYyBmZWF0dXJlcyBhbmQgY29tcG9uZW50cyBvZiBhdmFpbGFiaWxpdHlDYWxlbmRhclxyXG4qKi9cclxuZXhwb3J0cy5XZWVrbHkgPSByZXF1aXJlKCcuL1dlZWtseScpO1xyXG5leHBvcnRzLldvcmtIb3VycyA9IHJlcXVpcmUoJy4vV29ya0hvdXJzJyk7XHJcbmV4cG9ydHMuTW9udGhseSA9IHJlcXVpcmUoJy4vTW9udGhseScpOyIsIi8qKlxyXG4gIE1ha2UgYW4gZWxlbWVudCB1bnNlbGVjdGFibGUsIHVzZWZ1bCB0byBpbXBsZW1lbnQgc29tZSBjdXN0b21cclxuICBzZWxlY3Rpb24gYmVoYXZpb3Igb3IgZHJhZyZkcm9wLlxyXG4gIElmIG9mZmVycyBhbiAnb2ZmJyBtZXRob2QgdG8gcmVzdG9yZSBiYWNrIHRoZSBlbGVtZW50IGJlaGF2aW9yLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgdmFyIGZhbHN5Zm4gPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfTtcclxuICB2YXIgbm9kcmFnU3R5bGUgPSB7XHJcbiAgICAnLXdlYmtpdC10b3VjaC1jYWxsb3V0JzogJ25vbmUnLFxyXG4gICAgJy1raHRtbC11c2VyLWRyYWcnOiAnbm9uZScsXHJcbiAgICAnLXdlYmtpdC11c2VyLWRyYWcnOiAnbm9uZScsXHJcbiAgICAnLWtodG1sLXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy13ZWJraXQtdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLW1vei11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctbXMtdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAndXNlci1zZWxlY3QnOiAnbm9uZSdcclxuICB9O1xyXG4gIHZhciBkcmFnZGVmYXVsdFN0eWxlID0ge1xyXG4gICAgJy13ZWJraXQtdG91Y2gtY2FsbG91dCc6ICdpbmhlcml0JyxcclxuICAgICcta2h0bWwtdXNlci1kcmFnJzogJ2luaGVyaXQnLFxyXG4gICAgJy13ZWJraXQtdXNlci1kcmFnJzogJ2luaGVyaXQnLFxyXG4gICAgJy1raHRtbC11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctd2Via2l0LXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJ3VzZXItc2VsZWN0JzogJ2luaGVyaXQnXHJcbiAgfTtcclxuXHJcbiAgdmFyIG9uID0gZnVuY3Rpb24gbWFrZVVuc2VsZWN0YWJsZShlbCkge1xyXG4gICAgZWwgPSAkKGVsKTtcclxuICAgIGVsLm9uKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgLy8kKGRvY3VtZW50KS5vbignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIGVsLmNzcyhub2RyYWdTdHlsZSk7XHJcbiAgfTtcclxuXHJcbiAgdmFyIG9mZiA9IGZ1bmN0aW9uIG9mZk1ha2VVbnNlbGVjdGFibGUoZWwpIHtcclxuICAgIGVsID0gJChlbCk7XHJcbiAgICBlbC5vZmYoJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICAvLyQoZG9jdW1lbnQpLm9mZignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIGVsLmNzcyhkcmFnZGVmYXVsdFN0eWxlKTtcclxuICB9O1xyXG5cclxuICBvbi5vZmYgPSBvZmY7XHJcbiAgcmV0dXJuIG9uO1xyXG5cclxufSAoKSk7IiwiLyoqXHJcbiAgQSBzZXQgb2YgZ2VuZXJpYyB1dGlsaXRpZXMgdG8gbWFuYWdlIGpzIG9iamVjdHNcclxuKiovXHJcbnZhciB1ID0ge307XHJcblxyXG4vKipcclxuICBQZXJmb3JtcyBhIGNhbGxiYWNrIG9uIGVhY2ggcHJvcGVydHkgb3duZWQgYnkgdGhlIG9iamVjdFxyXG4qKi9cclxudS5lYWNoUHJvcGVydHkgPSBmdW5jdGlvbiBlYWNoUHJvcGVydHkob2JqLCBjYikge1xyXG4gIGZvciAodmFyIHAgaW4gb2JqKSB7XHJcbiAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShwKSkgY29udGludWU7XHJcbiAgICBjYi5jYWxsKG9iaiwgcCwgb2JqW3BdKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICBGaWx0ZXIgdGhlIGdpdmVuIG9iamVjdCByZXR1cm5pbmcgYSBuZXcgb25lIHdpdGggb25seSB0aGUgcHJvcGVydGllc1xyXG4gIChhbmQgb3JpZ2luYWwgdmFsdWVzIC1yZWZzIGZvciBvYmplY3QgdmFsdWVzLSkgdGhhdCBwYXNzXHJcbiAgdGhlIHByb3ZpZGVkIEBmaWx0ZXIgY2FsbGJhY2sgKGNhbGxiYWNrIG11c3QgcmV0dXJuIGEgdHJ1ZS90cnV0aHkgdmFsdWVcclxuICBmb3IgZWFjaCB2YWx1ZSBkZXNpcmVkIGluIHRoZSByZXN1bHQpLlxyXG4gIFRoZSBAZmlsdGVyIGNhbGxiYWNrIGl0cyBleGVjdXRlZCB3aXRoIHRoZSBvYmplY3QgYXMgY29udGV4dCBhbmQgcmVjZWl2ZXNcclxuICBhcyBwYXJlbWV0ZXJzIHRoZSBwcm9wZXJ0eSBrZXkgYW5kIGl0cyB2YWx1ZSBcImZpbHRlcihrLCB2KVwiLlxyXG4qKi9cclxudS5maWx0ZXJQcm9wZXJ0aWVzID0gZnVuY3Rpb24gZmlsdGVyUHJvcGVyaWVzKG9iaiwgZmlsdGVyKSB7XHJcbiAgdmFyIHIgPSB7fTtcclxuICB1LmVhY2hQcm9wZXJ0eShvYmosIGZ1bmN0aW9uIChrLCB2KSB7XHJcbiAgICBpZiAoZmlsdGVyLmNhbGwob2JqLCBrLCB2KSlcclxuICAgICAgcltrXSA9IHY7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHI7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHU7IiwiLyoqXHJcbiAgQXZhaWxhYmlsaXR5Q2FsZW5kYXIgc2hhcmVkIHV0aWxzXHJcbioqL1xyXG52YXIgXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIGRhdGVVdGlscyA9IHJlcXVpcmUoJy4vZGF0ZVV0aWxzJyksXHJcbiAgZm9ybWF0RGF0ZSA9IHJlcXVpcmUoJy4vZm9ybWF0RGF0ZScpO1xyXG5cclxuLy8gUmUtZXhwb3J0aW5nOlxyXG5leHBvcnRzLmZvcm1hdERhdGUgPSBmb3JtYXREYXRlO1xyXG5leHBvcnRzLmRhdGUgPSBkYXRlVXRpbHM7XHJcblxyXG4vKi0tLS0tLSBDT05TVEFOVFMgLS0tLS0tLS0tKi9cclxudmFyIHN0YXR1c1R5cGVzID0gZXhwb3J0cy5zdGF0dXNUeXBlcyA9IFsndW5hdmFpbGFibGUnLCAnYXZhaWxhYmxlJ107XHJcbi8vIFdlZWsgZGF5cyBuYW1lcyBpbiBlbmdsaXNoIGZvciBpbnRlcm5hbCBzeXN0ZW1cclxuLy8gdXNlOyBOT1QgZm9yIGxvY2FsaXphdGlvbi90cmFuc2xhdGlvbi5cclxudmFyIHN5c3RlbVdlZWtEYXlzID0gZXhwb3J0cy5zeXN0ZW1XZWVrRGF5cyA9IFtcclxuICAnc3VuZGF5JyxcclxuICAnbW9uZGF5JyxcclxuICAndHVlc2RheScsXHJcbiAgJ3dlZG5lc2RheScsXHJcbiAgJ3RodXJzZGF5JyxcclxuICAnZnJpZGF5JyxcclxuICAnc2F0dXJkYXknXHJcbl07XHJcblxyXG4vKi0tLS0tLS0tLSBDT05GSUcgLSBJTlNUQU5DRSAtLS0tLS0tLS0tKi9cclxudmFyIHdlZWtseUNsYXNzZXMgPSBleHBvcnRzLndlZWtseUNsYXNzZXMgPSB7XHJcbiAgY2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhcicsXHJcbiAgd2Vla2x5Q2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci0td2Vla2x5JyxcclxuICBjdXJyZW50V2VlazogJ2lzLWN1cnJlbnRXZWVrJyxcclxuICBhY3Rpb25zOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItYWN0aW9ucycsXHJcbiAgcHJldkFjdGlvbjogJ0FjdGlvbnMtcHJldicsXHJcbiAgbmV4dEFjdGlvbjogJ0FjdGlvbnMtbmV4dCcsXHJcbiAgZGF5czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWRheXMnLFxyXG4gIHNsb3RzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc2xvdHMnLFxyXG4gIHNsb3RIb3VyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItaG91cicsXHJcbiAgc2xvdFN0YXR1c1ByZWZpeDogJ2lzLScsXHJcbiAgbGVnZW5kOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kJyxcclxuICBsZWdlbmRBdmFpbGFibGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQtYXZhaWxhYmxlJyxcclxuICBsZWdlbmRVbmF2YWlsYWJsZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZC11bmF2YWlsYWJsZScsXHJcbiAgc3RhdHVzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc3RhdHVzJyxcclxuICBlcnJvck1lc3NhZ2U6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1lcnJvck1lc3NhZ2UnXHJcbn07XHJcblxyXG52YXIgd2Vla2x5VGV4dHMgPSBleHBvcnRzLndlZWtseVRleHRzID0ge1xyXG4gIGFiYnJXZWVrRGF5czogW1xyXG4gICAgJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCdcclxuICBdLFxyXG4gIHRvZGF5OiAnVG9kYXknLFxyXG4gIC8vIEFsbG93ZWQgc3BlY2lhbCB2YWx1ZXM6IE06bW9udGgsIEQ6ZGF5XHJcbiAgYWJickRhdGVGb3JtYXQ6ICdNL0QnXHJcbn07XHJcblxyXG4vKi0tLS0tLS0tLS0tIFZJRVcgVVRJTFMgLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5mdW5jdGlvbiBoYW5kbGVyQ2FsZW5kYXJFcnJvcihlcnIpIHtcclxuICB2YXIgbXNnID0gJyc7XHJcbiAgaWYgKGVyciAmJiBlcnIubWVzc2FnZSlcclxuICAgIG1zZyA9IGVyci5tZXNzYWdlO1xyXG4gIGVsc2UgaWYgKGVyciAmJiBlcnIuZXhjZXB0aW9uICYmIGVyci5leGNlcHRpb24ubWVzc2FnZSlcclxuICAgIG1zZyA9IGVyci5leGNlcHRpb24ubWVzc2FnZTtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzLmNvbXBvbmVudDtcclxuICB2YXIgbXNnQ29udGFpbmVyID0gdGhhdC4kZWwuZmluZCgnLicgKyB0aGF0LmNsYXNzZXMuZXJyb3JNZXNzYWdlKTtcclxuXHJcbiAgaWYgKG1zZykgbXNnID0gKG1zZ0NvbnRhaW5lci5kYXRhKCdtZXNzYWdlLXByZWZpeCcpIHx8ICcnKSArIG1zZztcclxuXHJcbiAgbXNnQ29udGFpbmVyLnRleHQobXNnKTtcclxufVxyXG5leHBvcnRzLmhhbmRsZXJDYWxlbmRhckVycm9yID0gaGFuZGxlckNhbGVuZGFyRXJyb3I7XHJcblxyXG5mdW5jdGlvbiBtb3ZlQmluZFJhbmdlSW5EYXlzKHdlZWtseSwgZGF5cykge1xyXG4gIHZhciBcclxuICAgIHN0YXJ0ID0gZGF0ZVV0aWxzLmFkZERheXMod2Vla2x5LmRhdGVzUmFuZ2Uuc3RhcnQsIGRheXMpLFxyXG4gICAgZW5kID0gZGF0ZVV0aWxzLmFkZERheXMod2Vla2x5LmRhdGVzUmFuZ2UuZW5kLCBkYXlzKSxcclxuICAgIGRhdGVzUmFuZ2UgPSBkYXRlc1RvUmFuZ2Uoc3RhcnQsIGVuZCk7XHJcblxyXG4gIC8vIENoZWNrIGNhY2hlIGJlZm9yZSB0cnkgdG8gZmV0Y2hcclxuICB2YXIgaW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuXHJcbiAgaWYgKGluQ2FjaGUpIHtcclxuICAgIC8vIEp1c3Qgc2hvdyB0aGUgZGF0YVxyXG4gICAgd2Vla2x5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgLy8gUHJlZmV0Y2ggZXhjZXB0IGlmIHRoZXJlIGlzIG90aGVyIHJlcXVlc3QgaW4gY291cnNlIChjYW4gYmUgdGhlIHNhbWUgcHJlZmV0Y2gsXHJcbiAgICAvLyBidXQgc3RpbGwgZG9uJ3Qgb3ZlcmxvYWQgdGhlIHNlcnZlcilcclxuICAgIGlmICh3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBmb3IgcHJlZmV0Y2hpbmc6XHJcbiAgICAvLyBJdHMgYXZvaWRlZCBpZiB0aGVyZSBhcmUgcmVxdWVzdHMgaW4gY291cnNlLCBzaW5jZVxyXG4gICAgLy8gdGhhdCB3aWxsIGJlIGEgcHJlZmV0Y2ggZm9yIHRoZSBzYW1lIGRhdGEuXHJcbiAgICBpZiAod2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHtcclxuICAgICAgLy8gVGhlIGxhc3QgcmVxdWVzdCBpbiB0aGUgcG9vbCAqbXVzdCogYmUgdGhlIGxhc3QgaW4gZmluaXNoXHJcbiAgICAgIC8vIChtdXN0IGJlIG9ubHkgb25lIGlmIGFsbCBnb2VzIGZpbmUpOlxyXG4gICAgICB2YXIgcmVxdWVzdCA9IHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHNbd2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgIC8vIFdhaXQgZm9yIHRoZSBmZXRjaCB0byBwZXJmb3JtIGFuZCBzZXRzIGxvYWRpbmcgdG8gbm90aWZ5IHVzZXJcclxuICAgICAgd2Vla2x5LiRlbC5hZGRDbGFzcyh3ZWVrbHkuY2xhc3Nlcy5mZXRjaGluZyk7XHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgbW92ZUJpbmRSYW5nZUluRGF5cyh3ZWVrbHksIGRheXMpO1xyXG4gICAgICAgIHdlZWtseS4kZWwucmVtb3ZlQ2xhc3Mod2Vla2x5LmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgd2Vla2x5XHJcbiAgICAuZmV0Y2hEYXRhKGRhdGVzVG9RdWVyeShkYXRlc1JhbmdlKSlcclxuICAgIC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgd2Vla2x5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgICAvLyBQcmVmZXRjaFxyXG4gICAgICB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuZXhwb3J0cy5tb3ZlQmluZFJhbmdlSW5EYXlzID0gbW92ZUJpbmRSYW5nZUluRGF5cztcclxuXHJcbmZ1bmN0aW9uIHdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF3ZWVrbHkuZGF0YSB8fCAhd2Vla2x5LmRhdGEuc2xvdHMpIHJldHVybiBmYWxzZTtcclxuICAvLyBDaGVjayBjYWNoZTogaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBkYXRlIGluIHRoZSByYW5nZVxyXG4gIC8vIHdpdGhvdXQgZGF0YSwgd2Ugc2V0IGluQ2FjaGUgYXMgZmFsc2UgYW5kIGZldGNoIHRoZSBkYXRhOlxyXG4gIHZhciBpbkNhY2hlID0gdHJ1ZTtcclxuICBkYXRlVXRpbHMuZWFjaERhdGVJblJhbmdlKGRhdGVzUmFuZ2Uuc3RhcnQsIGRhdGVzUmFuZ2UuZW5kLCBmdW5jdGlvbiAoZGF0ZSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIGlmICghd2Vla2x5LmRhdGEuc2xvdHNbZGF0ZWtleV0pIHtcclxuICAgICAgaW5DYWNoZSA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGluQ2FjaGU7XHJcbn1cclxuZXhwb3J0cy53ZWVrbHlJc0RhdGFJbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZTtcclxuXHJcbi8qKlxyXG4gIEZvciBub3csIGdpdmVuIHRoZSBKU09OIHN0cnVjdHVyZSB1c2VkLCB0aGUgbG9naWNcclxuICBvZiBtb250aGx5SXNEYXRhSW5DYWNoZSBpcyB0aGUgc2FtZSBhcyB3ZWVrbHlJc0RhdGFJbkNhY2hlOlxyXG4qKi9cclxudmFyIG1vbnRobHlJc0RhdGFJbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZTtcclxuZXhwb3J0cy5tb250aGx5SXNEYXRhSW5DYWNoZSA9IG1vbnRobHlJc0RhdGFJbkNhY2hlO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBjdXJyZW50RGF0ZXNSYW5nZSkge1xyXG4gIHZhciBuZXh0RGF0ZXNSYW5nZSA9IGRhdGVzVG9SYW5nZShcclxuICAgIGRhdGVVdGlscy5hZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLnN0YXJ0LCA3KSxcclxuICAgIGRhdGVVdGlscy5hZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLmVuZCwgNylcclxuICApO1xyXG5cclxuICBpZiAoIXdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBuZXh0RGF0ZXNSYW5nZSkpIHtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgd2VlayBpbiBhZHZhbmNlXHJcbiAgICB2YXIgcHJlZmV0Y2hRdWVyeSA9IGRhdGVzVG9RdWVyeShuZXh0RGF0ZXNSYW5nZSk7XHJcbiAgICB3ZWVrbHkuZmV0Y2hEYXRhKHByZWZldGNoUXVlcnksIG51bGwsIHRydWUpO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2ggPSB3ZWVrbHlDaGVja0FuZFByZWZldGNoO1xyXG5cclxuLyoqIFVwZGF0ZSB0aGUgdmlldyBsYWJlbHMgZm9yIHRoZSB3ZWVrLWRheXMgKHRhYmxlIGhlYWRlcnMpXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVMYWJlbHMoZGF0ZXNSYW5nZSwgY2FsZW5kYXIsIG9wdGlvbnMpIHtcclxuICB2YXIgc3RhcnQgPSBkYXRlc1JhbmdlLnN0YXJ0LFxyXG4gICAgICBlbmQgPSBkYXRlc1JhbmdlLmVuZDtcclxuXHJcbiAgdmFyIGRheXMgPSBjYWxlbmRhci5maW5kKCcuJyArIG9wdGlvbnMuY2xhc3Nlcy5kYXlzICsgJyB0aCcpO1xyXG4gIHZhciB0b2RheSA9IGRhdGVJU08uZGF0ZUxvY2FsKG5ldyBEYXRlKCkpO1xyXG4gIC8vIEZpcnN0IGNlbGwgaXMgZW1wdHkgKCd0aGUgY3Jvc3MgaGVhZGVycyBjZWxsJyksIHRoZW4gb2Zmc2V0IGlzIDFcclxuICB2YXIgb2Zmc2V0ID0gMTtcclxuICBkYXRlVXRpbHMuZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICB2YXIgY2VsbCA9ICQoZGF5cy5nZXQob2Zmc2V0ICsgaSkpLFxyXG4gICAgICAgIHNkYXRlID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSksXHJcbiAgICAgICAgbGFiZWwgPSBzZGF0ZTtcclxuXHJcbiAgICBpZiAodG9kYXkgPT0gc2RhdGUpXHJcbiAgICAgIGxhYmVsID0gb3B0aW9ucy50ZXh0cy50b2RheTtcclxuICAgIGVsc2VcclxuICAgICAgbGFiZWwgPSBvcHRpb25zLnRleHRzLmFiYnJXZWVrRGF5c1tkYXRlLmdldERheSgpXSArICcgJyArIGZvcm1hdERhdGUoZGF0ZSwgb3B0aW9ucy50ZXh0cy5hYmJyRGF0ZUZvcm1hdCk7XHJcblxyXG4gICAgY2VsbC50ZXh0KGxhYmVsKTtcclxuICB9KTtcclxufVxyXG5leHBvcnRzLnVwZGF0ZUxhYmVscyA9IHVwZGF0ZUxhYmVscztcclxuXHJcbmZ1bmN0aW9uIGZpbmRDZWxsQnlTbG90KHNsb3RzQ29udGFpbmVyLCBkYXksIHNsb3QpIHtcclxuICBzbG90ID0gZGF0ZUlTTy5wYXJzZShzbG90KTtcclxuICB2YXIgXHJcbiAgICB4ID0gTWF0aC5yb3VuZChzbG90LmdldEhvdXJzKCkpLFxyXG4gIC8vIFRpbWUgZnJhbWVzIChzbG90cykgYXJlIDE1IG1pbnV0ZXMgZGl2aXNpb25zXHJcbiAgICB5ID0gTWF0aC5yb3VuZChzbG90LmdldE1pbnV0ZXMoKSAvIDE1KSxcclxuICAgIHRyID0gc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJzplcSgnICsgTWF0aC5yb3VuZCh4ICogNCArIHkpICsgJyknKTtcclxuXHJcbiAgLy8gU2xvdCBjZWxsIGZvciBvJ2Nsb2NrIGhvdXJzIGlzIGF0IDEgcG9zaXRpb24gb2Zmc2V0XHJcbiAgLy8gYmVjYXVzZSBvZiB0aGUgcm93LWhlYWQgY2VsbFxyXG4gIHZhciBkYXlPZmZzZXQgPSAoeSA9PT0gMCA/IGRheSArIDEgOiBkYXkpO1xyXG4gIHJldHVybiB0ci5jaGlsZHJlbignOmVxKCcgKyBkYXlPZmZzZXQgKyAnKScpO1xyXG59XHJcbmV4cG9ydHMuZmluZENlbGxCeVNsb3QgPSBmaW5kQ2VsbEJ5U2xvdDtcclxuXHJcbmZ1bmN0aW9uIGZpbmRTbG90QnlDZWxsKHNsb3RzQ29udGFpbmVyLCBjZWxsKSB7XHJcbiAgdmFyIFxyXG4gICAgeCA9IGNlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGNlbGwpLFxyXG4gICAgeSA9IGNlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpLFxyXG4gICAgZnVsbE1pbnV0ZXMgPSB5ICogMTUsXHJcbiAgICBob3VycyA9IE1hdGguZmxvb3IoZnVsbE1pbnV0ZXMgLyA2MCksXHJcbiAgICBtaW51dGVzID0gZnVsbE1pbnV0ZXMgLSAoaG91cnMgKiA2MCksXHJcbiAgICBzbG90ID0gbmV3IERhdGUoKTtcclxuICBzbG90LnNldEhvdXJzKGhvdXJzLCBtaW51dGVzLCAwLCAwKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGRheTogeCxcclxuICAgIHNsb3Q6IHNsb3RcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuZmluZFNsb3RCeUNlbGwgPSBmaW5kU2xvdEJ5Q2VsbDtcclxuXHJcbi8qKlxyXG5NYXJrIGNhbGVuZGFyIGFzIGN1cnJlbnQtd2VlayBhbmQgZGlzYWJsZSBwcmV2IGJ1dHRvbixcclxub3IgcmVtb3ZlIHRoZSBtYXJrIGFuZCBlbmFibGUgaXQgaWYgaXMgbm90LlxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50V2VlayhjYWxlbmRhciwgZGF0ZSwgb3B0aW9ucykge1xyXG4gIHZhciB5ZXAgPSBkYXRlVXRpbHMuaXNJbkN1cnJlbnRXZWVrKGRhdGUpO1xyXG4gIGNhbGVuZGFyLnRvZ2dsZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy5jdXJyZW50V2VlaywgeWVwKTtcclxuICBjYWxlbmRhci5maW5kKCcuJyArIG9wdGlvbnMuY2xhc3Nlcy5wcmV2QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcbn1cclxuZXhwb3J0cy5jaGVja0N1cnJlbnRXZWVrID0gY2hlY2tDdXJyZW50V2VlaztcclxuXHJcbi8qKiBHZXQgcXVlcnkgb2JqZWN0IHdpdGggdGhlIGRhdGUgcmFuZ2Ugc3BlY2lmaWVkOlxyXG4qKi9cclxuZnVuY3Rpb24gZGF0ZXNUb1F1ZXJ5KHN0YXJ0LCBlbmQpIHtcclxuICAvLyBVbmlxdWUgcGFyYW0gd2l0aCBib3RoIHByb3BpZXJ0aWVzOlxyXG4gIGlmIChzdGFydC5lbmQpIHtcclxuICAgIGVuZCA9IHN0YXJ0LmVuZDtcclxuICAgIHN0YXJ0ID0gc3RhcnQuc3RhcnQ7XHJcbiAgfVxyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZGF0ZUlTTy5kYXRlTG9jYWwoc3RhcnQsIHRydWUpLFxyXG4gICAgZW5kOiBkYXRlSVNPLmRhdGVMb2NhbChlbmQsIHRydWUpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmRhdGVzVG9RdWVyeSA9IGRhdGVzVG9RdWVyeTtcclxuXHJcbi8qKiBQYWNrIHR3byBkYXRlcyBpbiBhIHNpbXBsZSBidXQgdXNlZnVsXHJcbnN0cnVjdHVyZSB7IHN0YXJ0LCBlbmQgfVxyXG4qKi9cclxuZnVuY3Rpb24gZGF0ZXNUb1JhbmdlKHN0YXJ0LCBlbmQpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IHN0YXJ0LFxyXG4gICAgZW5kOiBlbmRcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuZGF0ZXNUb1JhbmdlID0gZGF0ZXNUb1JhbmdlO1xyXG4iLCIvKipcclxuICAgIFNtYWxsIHV0aWxpdHkgdG8gd3JhcCBhIGNhbGxiYWNrL2hhbmRsZXIgZnVuY3Rpb24gaW4gYSB0aW1lclxyXG4gICAgYmVpbmcgZXhlY3V0ZWQgb25seSBvbmNlICh0aGUgbGF0ZXN0IGNhbGwpIGluc2lkZSB0aGUgdGltZWZyYW1lLFxyXG4gICAgZGVmaW5lZCBieSB0aGUgaW50ZXJ2YWwgcGFyYW1ldGVyLCBpdHMganVzdCAxIG1pbGlzZWNvbmQgYnkgZGVmYXVsdC5cclxuICAgIEl0cyB1c2VmdWwgd2hlbiBhbiBldmVudCBnZXRzIGV4ZWN1dGVkXHJcbiAgICBsb3RzIG9mIHRpbWVzIHRvbyBxdWlja2x5IGFuZCBvbmx5IDEgZXhlY3V0aW9uIGlzIHdhbnRlZCB0byBhdm9pZFxyXG4gICAgaHVydCBwZXJmb3JtYW5jZS5cclxuICAgIFRoZSBkZWZhdWx0IGludGVydmFsIG9mIDEgd29ya3MgZmluZSBpZiB0aGUgZXZlbnQgZ2V0cyByYWlzZWRcclxuICAgIGEgbG90IGJ5IGNvbnNlY3V0aXZlIGNvZGUsIGJ1dCBpZiBjYWxscyBhcmUgZGVsYXllZCBhIGdyZWF0ZXJcclxuICAgIGludGVydmFsIHdpbGwgYmUgbmVlZC5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmF0Y2hFdmVudEhhbmRsZXIoY2IsIGludGVydmFsKSB7XHJcbiAgICB2YXIgdGltZXI7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xyXG4gICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGNiLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XHJcbiAgICAgICAgfSwgaW50ZXJ2YWwgfHwgMSk7XHJcbiAgICB9O1xyXG59OyIsIi8qIEdlbmVyaWMgYmxvY2tVSSBvcHRpb25zIHNldHMgKi9cclxudmFyIGxvYWRpbmdCbG9jayA9IHsgbWVzc2FnZTogJzxpbWcgd2lkdGg9XCI0OHB4XCIgaGVpZ2h0PVwiNDhweFwiIGNsYXNzPVwibG9hZGluZy1pbmRpY2F0b3JcIiBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyB9O1xyXG52YXIgZXJyb3JCbG9jayA9IGZ1bmN0aW9uIChlcnJvciwgcmVsb2FkLCBzdHlsZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjc3M6ICQuZXh0ZW5kKHsgY3Vyc29yOiAnZGVmYXVsdCcgfSwgc3R5bGUgfHwge30pLFxyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj5UaGVyZSB3YXMgYW4gZXJyb3InICtcclxuICAgICAgICAgICAgKGVycm9yID8gJzogJyArIGVycm9yIDogJycpICtcclxuICAgICAgICAgICAgKHJlbG9hZCA/ICcgPGEgaHJlZj1cImphdmFzY3JpcHQ6ICcgKyByZWxvYWQgKyAnO1wiPkNsaWNrIHRvIHJlbG9hZDwvYT4nIDogJycpICtcclxuICAgICAgICAgICAgJzwvZGl2PidcclxuICAgIH07XHJcbn07XHJcbnZhciBpbmZvQmxvY2sgPSBmdW5jdGlvbiAobWVzc2FnZSwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuICQuZXh0ZW5kKHtcclxuICAgICAgICBtZXNzYWdlOiAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPjxkaXYgY2xhc3M9XCJpbmZvXCI+JyArIG1lc3NhZ2UgKyAnPC9kaXY+J1xyXG4gICAgICAgIC8qLGNzczogeyBjdXJzb3I6ICdkZWZhdWx0JyB9Ki9cclxuICAgICAgICAsIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGU6XHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgbG9hZGluZzogbG9hZGluZ0Jsb2NrLFxyXG4gICAgICAgIGVycm9yOiBlcnJvckJsb2NrLFxyXG4gICAgICAgIGluZm86IGluZm9CbG9ja1xyXG4gICAgfTtcclxufSIsIi8qPSBDaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzXHJcbiogdG8gbm90aWZ5IHVzZXIgYWJvdXQgY2hhbmdlcyBpbiBmb3JtcyxcclxuKiB0YWJzLCB0aGF0IHdpbGwgYmUgbG9zdCBpZiBnbyBhd2F5IGZyb21cclxuKiB0aGUgcGFnZS4gSXQga25vd3Mgd2hlbiBhIGZvcm0gaXMgc3VibWl0dGVkXHJcbiogYW5kIHNhdmVkIHRvIGRpc2FibGUgbm90aWZpY2F0aW9uLCBhbmQgZ2l2ZXNcclxuKiBtZXRob2RzIGZvciBvdGhlciBzY3JpcHRzIHRvIG5vdGlmeSBjaGFuZ2VzXHJcbiogb3Igc2F2aW5nLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZ2V0WFBhdGggPSByZXF1aXJlKCcuL2dldFhQYXRoJyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHtcclxuICAgIGNoYW5nZXNMaXN0OiB7fSxcclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBudWxsLFxyXG4gICAgICAgIGdlbmVyaWNDaGFuZ2VTdXBwb3J0OiB0cnVlLFxyXG4gICAgICAgIGdlbmVyaWNTdWJtaXRTdXBwb3J0OiBmYWxzZSxcclxuICAgICAgICBjaGFuZ2VkRm9ybUNsYXNzOiAnaGFzLWNoYW5nZXMnLFxyXG4gICAgICAgIGNoYW5nZWRFbGVtZW50Q2xhc3M6ICdjaGFuZ2VkJyxcclxuICAgICAgICBub3RpZnlDbGFzczogJ25vdGlmeS1jaGFuZ2VzJ1xyXG4gICAgfSxcclxuICAgIGluaXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gVXNlciBub3RpZmljYXRpb24gdG8gcHJldmVudCBsb3N0IGNoYW5nZXMgZG9uZVxyXG4gICAgICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hhbmdlc05vdGlmaWNhdGlvbi5ub3RpZnkoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQodGhpcy5kZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKCFvcHRpb25zLnRhcmdldClcclxuICAgICAgICAgICAgb3B0aW9ucy50YXJnZXQgPSBkb2N1bWVudDtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljQ2hhbmdlU3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ2NoYW5nZScsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpIDppbnB1dFtuYW1lXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoJCh0aGlzKS5jbG9zZXN0KCdmb3JtJykuZ2V0KDApLCB0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY1N1Ym1pdFN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdzdWJtaXQnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBBZGQgbm90aWZpY2F0aW9uIGNsYXNzIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLm5vdGlmeUNsYXNzKTtcclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGNoYW5nZSBpbiB0aGUgcHJvcGVydHkgbGlzdCByZXR1cm5pbmcgdGhlIG1lc3NhZ2U6XHJcbiAgICAgICAgZm9yICh2YXIgYyBpbiB0aGlzLmNoYW5nZXNMaXN0KVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWl0TWVzc2FnZSB8fCAodGhpcy5xdWl0TWVzc2FnZSA9ICQoJyNsY3Jlcy1xdWl0LXdpdGhvdXQtc2F2ZScpLnRleHQoKSkgfHwgJyc7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJDaGFuZ2U6IGZ1bmN0aW9uIChmLCBlKSB7XHJcbiAgICAgICAgaWYgKCFlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgdmFyIGZsID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSB8fCBbXTtcclxuICAgICAgICBpZiAoJC5pc0FycmF5KGUpKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZS5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJDaGFuZ2UoZiwgZVtpXSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG4gPSBlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgKGUpICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBuID0gZS5uYW1lO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiByZWFsbHkgdGhlcmUgd2FzIGEgY2hhbmdlIGNoZWNraW5nIGRlZmF1bHQgZWxlbWVudCB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChlLmRlZmF1bHRWYWx1ZSkgIT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5jaGVja2VkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLnNlbGVjdGVkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgZS52YWx1ZSA9PSBlLmRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlcmUgd2FzIG5vIGNoYW5nZSwgbm8gY29udGludWVcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBtYXliZSBpcyBhIHJlZ3Jlc3Npb24gZnJvbSBhIGNoYW5nZSBhbmQgbm93IHRoZSBvcmlnaW5hbCB2YWx1ZSBhZ2FpblxyXG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIHJlbW92ZSBmcm9tIGNoYW5nZXMgbGlzdCBkb2luZyByZWdpc3RlclNhdmVcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJTYXZlKGYsIFtuXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJChlKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIShuIGluIGZsKSlcclxuICAgICAgICAgICAgZmwucHVzaChuKTtcclxuICAgICAgICAkKGYpXHJcbiAgICAgICAgLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcylcclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnQgbmFtZSBjaGFuZ2VkLCBmb3JtIGVsZW1lbnQgY2hhbmdlZCAodGhpcyBjYW4gYmUgbnVsbClcclxuICAgICAgICAudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIFtmLCBuLCBlXSk7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJTYXZlOiBmdW5jdGlvbiAoZiwgZWxzKSB7XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSkgcmV0dXJuO1xyXG5cclxuICAgICAgICB2YXIgcHJldkVscyA9ICQuZXh0ZW5kKFtdLCB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSk7XHJcblxyXG4gICAgICAgIC8vICdlbHMnIChmaWx0ZXJlZCBmb3JtIGVsZW1lbnRzIGxpc3QpIGNhbiBiZSBhbiBhcnJheSBvZiBmaWVsZCAnbmFtZSdzIG9yIGFuIGFycmF5IG9mIERPTSBlbGVtZW50cyAob3IgbWl4ZWQpXHJcbiAgICAgICAgLy8gaXRzIGNvbnZlcnRlZCB0byBhbiBhcnJheSBvZiAnbmFtZSdzIGFueXdheTpcclxuICAgICAgICBpZiAoZWxzKSB7XHJcbiAgICAgICAgICAgIGVscyA9ICQubWFwKGVscywgZnVuY3Rpb24gKGVsKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKHR5cGVvZiAoZWwpID09PSAnc3RyaW5nJyA/IGVsIDogZWwubmFtZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdG8tcmVtb3ZlIGZvcm0gbGlzdCBmbGFnOiBieSBkZWZhdWx0IHRydWUsIHNpbmNlIHdoZW4gbm8gZWxzIGxpc3Qgc2luY2UgaXMgYWxsIHRoZSBmb3JtIHNhdmVkXHJcbiAgICAgICAgdmFyIHIgPSB0cnVlO1xyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSAkLmdyZXAodGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0sIGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gKCQuaW5BcnJheShlbCwgZWxzKSA9PSAtMSk7IH0pO1xyXG4gICAgICAgICAgICAvLyBEb24ndCByZW1vdmUgJ2YnIGxpc3QgaWYgaXMgbm90IGVtcHR5XHJcbiAgICAgICAgICAgIHIgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXS5sZW5ndGggPT09IDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgICAkKGYpLnJlbW92ZUNsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcyk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudHMgcmVnaXN0ZXJlZCBhcyBzYXZlICh0aGlzIGNhbiBiZSBudWxsKSwgYW5kICdmb3JtIGZ1bGx5IHNhdmVkJyBhcyB0aGlyZCBwYXJhbSAoYm9vbClcclxuICAgICAgICAkKGYpLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgW2YsIGVscyB8fCBwcmV2RWxzLCByXSk7XHJcbiAgICAgICAgdmFyIGxjaG4gPSB0aGlzO1xyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgJC5lYWNoKGVscywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCgnW25hbWU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSh0aGlzKSArICdcIl0nKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKGxjaG4uZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcHJldkVscztcclxuICAgIH1cclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gY2hhbmdlc05vdGlmaWNhdGlvbjtcclxufSIsIi8qIFV0aWxpdHkgdG8gY3JlYXRlIGlmcmFtZSB3aXRoIGluamVjdGVkIGh0bWwvY29udGVudCBpbnN0ZWFkIG9mIFVSTC5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlSWZyYW1lKGNvbnRlbnQsIHNpemUpIHtcclxuICAgIHZhciAkaWZyYW1lID0gJCgnPGlmcmFtZSB3aWR0aD1cIicgKyBzaXplLndpZHRoICsgJ1wiIGhlaWdodD1cIicgKyBzaXplLmhlaWdodCArICdcIiBzdHlsZT1cImJvcmRlcjpub25lO1wiPjwvaWZyYW1lPicpO1xyXG4gICAgdmFyIGlmcmFtZSA9ICRpZnJhbWUuZ2V0KDApO1xyXG4gICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIHJlYWR5XHJcbiAgICB2YXIgaWZyYW1lbG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZnJhbWUub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIFVzaW5nIGlmcmFtZWxvYWRlZCB0byBhdm9pZCBpbmZpbml0ZSBsb29wc1xyXG4gICAgICAgIGlmICghaWZyYW1lbG9hZGVkKSB7XHJcbiAgICAgICAgICAgIGlmcmFtZWxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBjb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuICRpZnJhbWU7XHJcbn07XHJcblxyXG4vKiBQdXRzIGZ1bGwgaHRtbCBpbnNpZGUgdGhlIGlmcmFtZSBlbGVtZW50IHBhc3NlZCBpbiBhIHNlY3VyZSBhbmQgY29tcGxpYW50IG1vZGUgKi9cclxuZnVuY3Rpb24gaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGh0bWwpIHtcclxuICAgIC8vIHB1dCBhamF4IGRhdGEgaW5zaWRlIGlmcmFtZSByZXBsYWNpbmcgYWxsIHRoZWlyIGh0bWwgaW4gc2VjdXJlIFxyXG4gICAgLy8gY29tcGxpYW50IG1vZGUgKCQuaHRtbCBkb24ndCB3b3JrcyB0byBpbmplY3QgPGh0bWw+PGhlYWQ+IGNvbnRlbnQpXHJcblxyXG4gICAgLyogZG9jdW1lbnQgQVBJIHZlcnNpb24gKHByb2JsZW1zIHdpdGggSUUsIGRvbid0IGV4ZWN1dGUgaWZyYW1lLWh0bWwgc2NyaXB0cykgKi9cclxuICAgIC8qdmFyIGlmcmFtZURvYyA9XHJcbiAgICAvLyBXM0MgY29tcGxpYW50OiBucywgZmlyZWZveC1nZWNrbywgY2hyb21lL3NhZmFyaS13ZWJraXQsIG9wZXJhLCBpZTlcclxuICAgIGlmcmFtZS5jb250ZW50RG9jdW1lbnQgfHxcclxuICAgIC8vIG9sZCBJRSAoNS41KylcclxuICAgIChpZnJhbWUuY29udGVudFdpbmRvdyA/IGlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50IDogbnVsbCkgfHxcclxuICAgIC8vIGZhbGxiYWNrICh2ZXJ5IG9sZCBJRT8pXHJcbiAgICBkb2N1bWVudC5mcmFtZXNbaWZyYW1lLmlkXS5kb2N1bWVudDtcclxuICAgIGlmcmFtZURvYy5vcGVuKCk7XHJcbiAgICBpZnJhbWVEb2Mud3JpdGUoaHRtbCk7XHJcbiAgICBpZnJhbWVEb2MuY2xvc2UoKTsqL1xyXG5cclxuICAgIC8qIGphdmFzY3JpcHQgVVJJIHZlcnNpb24gKHdvcmtzIGZpbmUgZXZlcnl3aGVyZSEpICovXHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdy5jb250ZW50cyA9IGh0bWw7XHJcbiAgICBpZnJhbWUuc3JjID0gJ2phdmFzY3JpcHQ6d2luZG93W1wiY29udGVudHNcIl0nO1xyXG5cclxuICAgIC8vIEFib3V0IHRoaXMgdGVjaG5pcXVlLCB0aGlzIGh0dHA6Ly9zcGFyZWN5Y2xlcy53b3JkcHJlc3MuY29tLzIwMTIvMDMvMDgvaW5qZWN0LWNvbnRlbnQtaW50by1hLW5ldy1pZnJhbWUvXHJcbn1cclxuXHJcbiIsIi8qIENSVURMIEhlbHBlciAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcbnZhciBnZXRUZXh0ID0gcmVxdWlyZSgnLi9nZXRUZXh0Jyk7XHJcbnZhciBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxuXHJcbmV4cG9ydHMuZGVmYXVsdFNldHRpbmdzID0ge1xyXG4gIGVmZmVjdHM6IHtcclxuICAgICdzaG93LXZpZXdlcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LFxyXG4gICAgJ2hpZGUtdmlld2VyJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sXHJcbiAgICAnc2hvdy1lZGl0b3InOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSwgLy8gdGhlIHNhbWUgYXMganF1ZXJ5LXVpIHsgZWZmZWN0OiAnc2xpZGUnLCBkdXJhdGlvbjogJ3Nsb3cnLCBkaXJlY3Rpb246ICdkb3duJyB9XHJcbiAgICAnaGlkZS1lZGl0b3InOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfVxyXG4gIH0sXHJcbiAgZXZlbnRzOiB7XHJcbiAgICAnZWRpdC1lbmRzJzogJ2NydWRsLWVkaXQtZW5kcycsXHJcbiAgICAnZWRpdC1zdGFydHMnOiAnY3J1ZGwtZWRpdC1zdGFydHMnLFxyXG4gICAgJ2VkaXRvci1yZWFkeSc6ICdjcnVkbC1lZGl0b3ItcmVhZHknLFxyXG4gICAgJ2VkaXRvci1zaG93ZWQnOiAnY3J1ZGwtZWRpdG9yLXNob3dlZCcsXHJcbiAgICAnZWRpdG9yLWhpZGRlbic6ICdjcnVkbC1lZGl0b3ItaGlkZGVuJyxcclxuICAgICdjcmVhdGUnOiAnY3J1ZGwtY3JlYXRlJyxcclxuICAgICd1cGRhdGUnOiAnY3J1ZGwtdXBkYXRlJyxcclxuICAgICdkZWxldGUnOiAnY3J1ZGwtZGVsZXRlJ1xyXG4gIH0sXHJcbiAgZGF0YToge1xyXG4gICAgJ2ZvY3VzLWNsb3Nlc3QnOiB7XHJcbiAgICAgIG5hbWU6ICdjcnVkbC1mb2N1cy1jbG9zZXN0JyxcclxuICAgICAgJ2RlZmF1bHQnOiAnKidcclxuICAgIH0sXHJcbiAgICAnZm9jdXMtbWFyZ2luJzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtbWFyZ2luJyxcclxuICAgICAgJ2RlZmF1bHQnOiAwXHJcbiAgICB9LFxyXG4gICAgJ2ZvY3VzLWR1cmF0aW9uJzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtZHVyYXRpb24nLFxyXG4gICAgICAnZGVmYXVsdCc6IDIwMFxyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gIFV0aWxpdHkgdG8gZ2V0IGEgZGF0YSB2YWx1ZSBvciB0aGUgZGVmYXVsdCBiYXNlZCBvbiB0aGUgaW5zdGFuY2VcclxuICBzZXR0aW5ncyBvbiB0aGUgZ2l2ZW4gZWxlbWVudFxyXG4qKi9cclxuZnVuY3Rpb24gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBlbCwgc2V0dGluZ05hbWUpIHtcclxuICB2YXJcclxuICAgIHNldHRpbmcgPSBpbnN0YW5jZS5zZXR0aW5ncy5kYXRhW3NldHRpbmdOYW1lXSxcclxuICAgIHZhbCA9IGVsLmRhdGEoc2V0dGluZy5uYW1lKSB8fCBzZXR0aW5nWydkZWZhdWx0J107XHJcbiAgcmV0dXJuIHZhbDtcclxufVxyXG5cclxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uIHNldHVwQ3J1ZGwob25TdWNjZXNzLCBvbkVycm9yLCBvbkNvbXBsZXRlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uOiBmdW5jdGlvbiBvbihzZWxlY3Rvciwgc2V0dGluZ3MpIHtcclxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCAnLmNydWRsJztcclxuICAgICAgdmFyIGluc3RhbmNlID0ge1xyXG4gICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcclxuICAgICAgICBlbGVtZW50czogJChzZWxlY3RvcilcclxuICAgICAgfTtcclxuICAgICAgLy8gRXh0ZW5kaW5nIGRlZmF1bHQgc2V0dGluZ3Mgd2l0aCBwcm92aWRlZCBvbmVzLFxyXG4gICAgICAvLyBidXQgc29tZSBjYW4gYmUgdHdlYWsgb3V0c2lkZSB0b28uXHJcbiAgICAgIGluc3RhbmNlLnNldHRpbmdzID0gJC5leHRlbmQodHJ1ZSwgZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MsIHNldHRpbmdzKTtcclxuICAgICAgaW5zdGFuY2UuZWxlbWVudHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGNydWRsID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoY3J1ZGwuZGF0YSgnX19jcnVkbF9pbml0aWFsaXplZF9fJykgPT09IHRydWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZGN0eCA9IGNydWRsLmRhdGEoJ2NydWRsLWNvbnRleHQnKSB8fCAnJztcclxuICAgICAgICB2YXIgdndyID0gY3J1ZGwuZmluZCgnLmNydWRsLXZpZXdlcicpO1xyXG4gICAgICAgIHZhciBkdHIgPSBjcnVkbC5maW5kKCcuY3J1ZGwtZWRpdG9yJyk7XHJcbiAgICAgICAgdmFyIGlpZHBhciA9IGNydWRsLmRhdGEoJ2NydWRsLWl0ZW0taWQtcGFyYW1ldGVyJykgfHwgJ0l0ZW1JRCc7XHJcbiAgICAgICAgdmFyIGZvcm1wYXJzID0geyBhY3Rpb246ICdjcmVhdGUnIH07XHJcbiAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IDA7XHJcbiAgICAgICAgdmFyIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0RXh0cmFRdWVyeShlbCkge1xyXG4gICAgICAgICAgLy8gR2V0IGV4dHJhIHF1ZXJ5IG9mIHRoZSBlbGVtZW50LCBpZiBhbnk6XHJcbiAgICAgICAgICB2YXIgeHEgPSBlbC5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpIHx8ICcnO1xyXG4gICAgICAgICAgaWYgKHhxKSB4cSA9ICcmJyArIHhxO1xyXG4gICAgICAgICAgLy8gSXRlcmF0ZSBhbGwgcGFyZW50cyBpbmNsdWRpbmcgdGhlICdjcnVkbCcgZWxlbWVudCAocGFyZW50c1VudGlsIGV4Y2x1ZGVzIHRoZSBmaXJzdCBlbGVtZW50IGdpdmVuLFxyXG4gICAgICAgICAgLy8gYmVjYXVzZSBvZiB0aGF0IHdlIGdldCBpdHMgcGFyZW50KCkpXHJcbiAgICAgICAgICAvLyBGb3IgYW55IG9mIHRoZW0gd2l0aCBhbiBleHRyYS1xdWVyeSwgYXBwZW5kIGl0OlxyXG4gICAgICAgICAgZWwucGFyZW50c1VudGlsKGNydWRsLnBhcmVudCgpLCAnW2RhdGEtY3J1ZGwtZXh0cmEtcXVlcnldJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB4ID0gJCh0aGlzKS5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpO1xyXG4gICAgICAgICAgICBpZiAoeCkgeHEgKz0gJyYnICsgeDtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIHhxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3J1ZGwuZmluZCgnLmNydWRsLWNyZWF0ZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSAwO1xyXG4gICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ2NyZWF0ZSc7XHJcbiAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG4gICAgICAgICAgZHRyLnJlbG9hZCh7XHJcbiAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKHVybCwgZGVmYXVsdFVybCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VXJsICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGR0ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LWVkaXRvciddKVxyXG4gICAgICAgICAgICAgIC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgICBkdHIuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEhpZGUgdmlld2VyIHdoZW4gaW4gZWRpdG9yOlxyXG4gICAgICAgICAgdndyLnhoaWRlKGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtdmlld2VyJ10pO1xyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSlcclxuICAgICAgICAgIC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50cy5jcmVhdGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdndyXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtdXBkYXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAndXBkYXRlJztcclxuICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICBkdHIucmVsb2FkKHtcclxuICAgICAgICAgICAgdXJsOiBmdW5jdGlvbiAodXJsLCBkZWZhdWx0VXJsKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRVcmwgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgZHRyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctZWRpdG9yJ10pXHJcbiAgICAgICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIFtkdHJdKTtcclxuICAgICAgICAgICAgICAgIGR0ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgLy8gSGlkZSB2aWV3ZXIgd2hlbiBpbiBlZGl0b3I6XHJcbiAgICAgICAgICB2d3IueGhpZGUoaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS12aWV3ZXInXSk7XHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddKVxyXG4gICAgICAgICAgLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzLnVwZGF0ZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtZGVsZXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuXHJcbiAgICAgICAgICBpZiAoY29uZmlybShnZXRUZXh0KCdjb25maXJtLWRlbGV0ZS1jcnVkbC1pdGVtLW1lc3NhZ2U6JyArIGRjdHgpKSkge1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCc8ZGl2PicgKyBnZXRUZXh0KCdkZWxldGUtY3J1ZGwtaXRlbS1sb2FkaW5nLW1lc3NhZ2U6JyArIGRjdHgpICsgJzwvZGl2PicsIGl0ZW0pO1xyXG4gICAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gaXRlbWlkO1xyXG4gICAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAnZGVsZXRlJztcclxuICAgICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICB1cmw6IGR0ci5hdHRyKCdkYXRhLXNvdXJjZS11cmwnKSArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHEsXHJcbiAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbignPGRpdj4nICsgZGF0YS5SZXN1bHQgKyAnPC9kaXY+JywgaXRlbSwgbnVsbCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5mYWRlT3V0KCdzbG93JywgZnVuY3Rpb24gKCkgeyBpdGVtLnJlbW92ZSgpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgICAgICAgICAgICAgb25FcnJvcihqeCwgbWVzc2FnZSwgZXgpO1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UoaXRlbSk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjb21wbGV0ZTogb25Db21wbGV0ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydkZWxldGUnXSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBmaW5pc2hFZGl0KCkge1xyXG4gICAgICAgICAgZnVuY3Rpb24gb25jb21wbGV0ZShhbm90aGVyT25Db21wbGV0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIC8vIFNob3cgYWdhaW4gdGhlIFZpZXdlclxyXG4gICAgICAgICAgICAgIC8vdndyLnNsaWRlRG93bignc2xvdycpO1xyXG4gICAgICAgICAgICAgIGlmICghdndyLmlzKCc6dmlzaWJsZScpKVxyXG4gICAgICAgICAgICAgICAgdndyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctdmlld2VyJ10pO1xyXG4gICAgICAgICAgICAgIC8vIE1hcmsgdGhlIGZvcm0gYXMgdW5jaGFuZ2VkIHRvIGF2b2lkIHBlcnNpc3Rpbmcgd2FybmluZ3NcclxuICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcbiAgICAgICAgICAgICAgLy8gQXZvaWQgY2FjaGVkIGNvbnRlbnQgb24gdGhlIEVkaXRvclxyXG4gICAgICAgICAgICAgIGR0ci5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBTY3JvbGwgdG8gcHJlc2VydmUgY29ycmVjdCBmb2N1cyAob24gbGFyZ2UgcGFnZXMgd2l0aCBzaGFyZWQgY29udGVudCB1c2VyIGNhbiBnZXRcclxuICAgICAgICAgICAgICAvLyBsb3N0IGFmdGVyIGFuIGVkaXRpb24pXHJcbiAgICAgICAgICAgICAgLy8gKHdlIHF1ZXVlIGFmdGVyIHZ3ci54c2hvdyBiZWNhdXNlIHdlIG5lZWQgdG8gZG8gaXQgYWZ0ZXIgdGhlIHhzaG93IGZpbmlzaClcclxuICAgICAgICAgICAgICB2d3IucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzQ2xvc2VzdCA9IGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgY3J1ZGwsICdmb2N1cy1jbG9zZXN0Jyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNFbGVtZW50ID0gY3J1ZGwuY2xvc2VzdChmb2N1c0Nsb3Nlc3QpO1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gY2xvc2VzdCwgZ2V0IHRoZSBjcnVkbFxyXG4gICAgICAgICAgICAgICAgaWYgKGZvY3VzRWxlbWVudC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICAgIGZvY3VzRWxlbWVudCA9IGNydWRsO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzTWFyZ2luID0gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBjcnVkbCwgJ2ZvY3VzLW1hcmdpbicpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzRHVyYXRpb24gPSBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGNydWRsLCAnZm9jdXMtZHVyYXRpb24nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhmb2N1c0VsZW1lbnQsIHsgbWFyZ2luVG9wOiBmb2N1c01hcmdpbiwgZHVyYXRpb246IGZvY3VzRHVyYXRpb24gfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdndyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBjYWxsYmFjazpcclxuICAgICAgICAgICAgICBpZiAodHlwZW9mIChhbm90aGVyT25Db21wbGV0ZSkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICBhbm90aGVyT25Db21wbGV0ZS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBOT1RFOiBGaXJzdCwgd2Ugbm90aWZ5IHRoZSBjaGFuZ2VzLXNhdmVkIGFuZCBldmVudCwgdGhpcyBsYXN0IGFsbG93c1xyXG4gICAgICAgICAgLy8gY2xpZW50IHNjcmlwdHMgdG8gZG8gdGFza3MganVzdCBiZWZvcmUgdGhlIGVkaXRvciBiZWdpbnMgdG8gY2xvc2VcclxuICAgICAgICAgIC8vIChhdm9pZGluZyBwcm9ibGVtcyBsaWtlIHdpdGggdGhlICdtb3ZlRm9jdXNUbycgbm90IGJlaW5nIHByZWNpc2UgaWYgdGhlXHJcbiAgICAgICAgICAvLyBhbmltYXRpb24gZHVyYXRpb24gaXMgdGhlIHNhbWUgb24gY2xpZW50IHNjcmlwdCBhbmQgaGlkZS1lZGl0b3IpLlxyXG4gICAgICAgICAgLy8gVGhlbiwgZWRpdG9yIGdldHMgaGlkZGVuXHJcbiAgICAgICAgICAvLyBUT0RPOiBUaGlzIGNhbiBnZXQgZW5oYW5jZWQgdG8gYWxsb3cgbGFyZ2VyIGR1cmF0aW9ucyBvbiBjbGllbnQtc2NyaXB0c1xyXG4gICAgICAgICAgLy8gd2l0aG91dCBhZmZlY3QgbW92ZUZvY3VzVG8gcGFzc2luZyBpbiB0aGUgdHJpZ2dlciBhbiBvYmplY3QgdGhhdCBob2xkc1xyXG4gICAgICAgICAgLy8gYSBQcm9taXNlL0RlZmVycmVkIHRvIGJlIHNldCBieSBjbGllbnQtc2NyaXB0IGFzICdoaWRlLWVkaXRvciAmXHJcbiAgICAgICAgICAvLyB2aWV3ZXItc2hvdyBtdXN0IHN0YXJ0IHdoZW4gdGhpcyBwcm9taXNlIGdldHMgZnVsbGZpbGxlZCcsIGFsbG93aW5nIHRvXHJcbiAgICAgICAgICAvLyBoYXZlIGEgc2VxdWVuY2UgKGZpcnN0IGNsaWVudC1zY3JpcHRzLCB0aGVuIGhpZGUtZWRpdG9yKS5cclxuXHJcbiAgICAgICAgICAvLyBNYXJrIGZvcm0gYXMgc2F2ZWQgdG8gcmVtb3ZlIHRoZSAnaGFzLWNoYW5nZXMnIG1hcmtcclxuICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGR0ci5maW5kKCdmb3JtJykuZ2V0KDApKTtcclxuXHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSk7XHJcblxyXG4gICAgICAgICAgLy8gV2UgbmVlZCBhIGN1c3RvbSBjb21wbGV0ZSBjYWxsYmFjaywgYnV0IHRvIG5vdCByZXBsYWNlIHRoZSB1c2VyIGNhbGxiYWNrLCB3ZVxyXG4gICAgICAgICAgLy8gY2xvbmUgZmlyc3QgdGhlIHNldHRpbmdzIGFuZCB0aGVuIGFwcGx5IG91ciBjYWxsYmFjayB0aGF0IGludGVybmFsbHkgd2lsbCBjYWxsXHJcbiAgICAgICAgICAvLyB0aGUgdXNlciBjYWxsYmFjayBwcm9wZXJseSAoaWYgYW55KVxyXG4gICAgICAgICAgdmFyIHdpdGhjYWxsYmFjayA9ICQuZXh0ZW5kKHRydWUsIHt9LCBpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLWVkaXRvciddKTtcclxuICAgICAgICAgIHdpdGhjYWxsYmFjay5jb21wbGV0ZSA9IG9uY29tcGxldGUod2l0aGNhbGxiYWNrLmNvbXBsZXRlKTtcclxuICAgICAgICAgIC8vIEhpZGluZyBlZGl0b3I6XHJcbiAgICAgICAgICBkdHIueGhpZGUod2l0aGNhbGxiYWNrKVxyXG4gICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLWhpZGRlbiddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgZHRyLmRlcXVldWUoKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGR0clxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLWNhbmNlbCcsIGZpbmlzaEVkaXQpXHJcbiAgICAgICAgLm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgJy5hamF4LWJveCcsIGZpbmlzaEVkaXQpXHJcbiAgICAgICAgLy8gQW4gZXZlbnRlZCBtZXRob2Q6IHRyaWdnZXIgdGhpcyBldmVudCB0byBleGVjdXRlIGEgdmlld2VyIHJlbG9hZDpcclxuICAgICAgICAub24oJ3JlbG9hZExpc3QnLCAnKicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZ3ci5maW5kKCcuY3J1ZGwtbGlzdCcpLnJlbG9hZCh7IGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2FqYXhTdWNjZXNzUG9zdCcsICdmb3JtLCBmaWVsZHNldCcsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwIHx8IGRhdGEuQ29kZSA9PSA1IHx8IGRhdGEuQ29kZSA9PSA2KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgdmlld2VyIGFuZCByZWxvYWQgbGlzdDpcclxuICAgICAgICAgICAgdndyLmZpbmQoJy5jcnVkbC1saXN0JykucmVsb2FkKHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEEgc21hbGwgZGVsYXkgdG8gbGV0IHVzZXIgdG8gc2VlIHRoZSBuZXcgbWVzc2FnZSBvbiBidXR0b24gYmVmb3JlXHJcbiAgICAgICAgICAvLyBoaWRlIGl0IChiZWNhdXNlIGlzIGluc2lkZSB0aGUgZWRpdG9yKVxyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PSA1KVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZpbmlzaEVkaXQsIDEwMDApO1xyXG5cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybSxmaWVsZHNldCcsIGZ1bmN0aW9uIChqYiwgZm9ybSwgangpIHtcclxuICAgICAgICAgIC8vIEVtaXQgdGhlICdlZGl0b3ItcmVhZHknIGV2ZW50IG9uIGVkaXRvciBIdG1sIGJlaW5nIHJlcGxhY2VkXHJcbiAgICAgICAgICAvLyAoZmlyc3QgbG9hZCBvciBuZXh0IGxvYWRzIGJlY2F1c2Ugb2Ygc2VydmVyLXNpZGUgdmFsaWRhdGlvbiBlcnJvcnMpXHJcbiAgICAgICAgICAvLyB0byBhbGxvdyBsaXN0ZW5lcnMgdG8gZG8gYW55IHdvcmsgb3ZlciBpdHMgKG5ldykgRE9NIGVsZW1lbnRzLlxyXG4gICAgICAgICAgLy8gVGhlIHNlY29uZCBjdXN0b20gcGFyYW1ldGVyIHBhc3NlZCBtZWFucyBpcyBtZWFuIHRvXHJcbiAgICAgICAgICAvLyBkaXN0aW5ndWlzaCB0aGUgZmlyc3QgdGltZSBjb250ZW50IGxvYWQgYW5kIHN1Y2Nlc3NpdmUgdXBkYXRlcyAoZHVlIHRvIHZhbGlkYXRpb24gZXJyb3JzKS5cclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgW2R0ciwgZWRpdG9ySW5pdGlhbExvYWRdKTtcclxuXHJcbiAgICAgICAgICAvLyBOZXh0IHRpbWVzOlxyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY3J1ZGwuZGF0YSgnX19jcnVkbF9pbml0aWFsaXplZF9fJywgdHJ1ZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIGluc3RhbmNlO1xyXG4gICAgfVxyXG4gIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gIFRoaXMgbW9kdWxlIGhhcyB1dGlsaXRpZXMgdG8gY29udmVydCBhIERhdGUgb2JqZWN0IGludG9cclxuICBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBmb2xsb3dpbmcgSVNPLTg2MDEgc3BlY2lmaWNhdGlvbi5cclxuICBcclxuICBJTkNPTVBMRVRFIEJVVCBVU0VGVUwuXHJcbiAgXHJcbiAgU3RhbmRhcmQgcmVmZXJzIHRvIGZvcm1hdCB2YXJpYXRpb25zOlxyXG4gIC0gYmFzaWM6IG1pbmltdW0gc2VwYXJhdG9yc1xyXG4gIC0gZXh0ZW5kZWQ6IGFsbCBzZXBhcmF0b3JzLCBtb3JlIHJlYWRhYmxlXHJcbiAgQnkgZGVmYXVsdCwgYWxsIG1ldGhvZHMgcHJpbnRzIHRoZSBiYXNpYyBmb3JtYXQsXHJcbiAgZXhjZXB0cyB0aGUgcGFyYW1ldGVyICdleHRlbmRlZCcgaXMgc2V0IHRvIHRydWVcclxuXHJcbiAgVE9ETzpcclxuICAtIFRaOiBhbGxvdyBmb3IgVGltZSBab25lIHN1ZmZpeGVzIChwYXJzZSBhbGxvdyBpdCBhbmQgXHJcbiAgICBkZXRlY3QgVVRDIGJ1dCBkbyBub3RoaW5nIHdpdGggYW55IHRpbWUgem9uZSBvZmZzZXQgZGV0ZWN0ZWQpXHJcbiAgLSBGcmFjdGlvbnMgb2Ygc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy5kYXRlVVRDID0gZnVuY3Rpb24gZGF0ZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBtID0gKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgIGQgPSBkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpLFxyXG4gICAgICB5ID0gZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcbiAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICBkID0gJzAnICsgZDtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIHkgKyAnLScgKyBtICsgJy0nICsgZDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4geSArIG0gKyBkO1xyXG59O1xyXG5cclxuZXhwb3J0cy5kYXRlTG9jYWwgPSBmdW5jdGlvbiBkYXRlTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgbSA9IChkYXRlLmdldE1vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICBkID0gZGF0ZS5nZXREYXRlKCkudG9TdHJpbmcoKSxcclxuICAgICAgeSA9IGRhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcbiAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICBkID0gJzAnICsgZDtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIHkgKyAnLScgKyBtICsgJy0nICsgZDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4geSArIG0gKyBkO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMsIG1pbnV0ZXMgYW5kIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMudGltZUxvY2FsID0gZnVuY3Rpb24gdGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIHMgPSBkYXRlLmdldFNlY29uZHMoKS50b1N0cmluZygpLFxyXG4gICAgICBobSA9IGV4cG9ydHMuc2hvcnRUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAocy5sZW5ndGggPT0gMSlcclxuICAgIHMgPSAnMCcgKyBzO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaG0gKyAnOicgKyBzO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBobSArIHM7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycywgbWludXRlcyBhbmQgc2Vjb25kcyBVVENcclxuKiovXHJcbmV4cG9ydHMudGltZVVUQyA9IGZ1bmN0aW9uIHRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgcyA9IGRhdGUuZ2V0VVRDU2Vjb25kcygpLnRvU3RyaW5nKCksXHJcbiAgICAgIGhtID0gZXhwb3J0cy5zaG9ydFRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAocy5sZW5ndGggPT0gMSlcclxuICAgIHMgPSAnMCcgKyBzO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaG0gKyAnOicgKyBzO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBobSArIHM7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycyBhbmQgbWludXRlc1xyXG4qKi9cclxuZXhwb3J0cy5zaG9ydFRpbWVMb2NhbCA9IGZ1bmN0aW9uIHNob3J0VGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIGggPSBkYXRlLmdldEhvdXJzKCkudG9TdHJpbmcoKSxcclxuICAgICAgbSA9IGRhdGUuZ2V0TWludXRlcygpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChoLmxlbmd0aCA9PSAxKVxyXG4gICAgaCA9ICcwJyArIGg7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGggKyAnOicgKyBtO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBoICsgbTtcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzIGFuZCBtaW51dGVzIFVUQ1xyXG4qKi9cclxuZXhwb3J0cy5zaG9ydFRpbWVVVEMgPSBmdW5jdGlvbiBzaG9ydFRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgaCA9IGRhdGUuZ2V0VVRDSG91cnMoKS50b1N0cmluZygpLFxyXG4gICAgICBtID0gZGF0ZS5nZXRVVENNaW51dGVzKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKGgubGVuZ3RoID09IDEpXHJcbiAgICBoID0gJzAnICsgaDtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaCArICc6JyArIG07XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGggKyBtO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgVE9ETzogSG91cnMsIG1pbnV0ZXMsIHNlY29uZHMgYW5kIGZyYWN0aW9ucyBvZiBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLmxvbmdUaW1lTG9jYWwgPSBmdW5jdGlvbiBsb25nVGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgLy9UT0RPXHJcbn07XHJcblxyXG4vKipcclxuICBVVEMgRGF0ZSBhbmQgVGltZSBzZXBhcmF0ZWQgYnkgVC5cclxuICBTdGFuZGFyZCBhbGxvd3Mgb21pdCB0aGUgc2VwYXJhdG9yIGFzIGV4Y2VwdGlvbmFsLCBib3RoIHBhcnRzIGFncmVlbWVudCwgY2FzZXM7XHJcbiAgY2FuIGJlIGRvbmUgcGFzc2luZyB0cnVlIGFzIG9mIG9taXRTZXBhcmF0b3IgcGFyYW1ldGVyLCBieSBkZWZhdWx0IGZhbHNlLlxyXG4qKi9cclxuZXhwb3J0cy5kYXRldGltZUxvY2FsID0gZnVuY3Rpb24gZGF0ZXRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCwgb21pdFNlcGFyYXRvcikge1xyXG4gIHZhciBkID0gZXhwb3J0cy5kYXRlTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpLFxyXG4gICAgICB0ID0gZXhwb3J0cy50aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAob21pdFNlcGFyYXRvcilcclxuICAgIHJldHVybiBkICsgdDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZCArICdUJyArIHQ7XHJcbn07XHJcblxyXG4vKipcclxuICBMb2NhbCBEYXRlIGFuZCBUaW1lIHNlcGFyYXRlZCBieSBULlxyXG4gIFN0YW5kYXJkIGFsbG93cyBvbWl0IHRoZSBzZXBhcmF0b3IgYXMgZXhjZXB0aW9uYWwsIGJvdGggcGFydHMgYWdyZWVtZW50LCBjYXNlcztcclxuICBjYW4gYmUgZG9uZSBwYXNzaW5nIHRydWUgYXMgb2Ygb21pdFNlcGFyYXRvciBwYXJhbWV0ZXIsIGJ5IGRlZmF1bHQgZmFsc2UuXHJcbioqL1xyXG5leHBvcnRzLmRhdGV0aW1lVVRDID0gZnVuY3Rpb24gZGF0ZXRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQsIG9taXRTZXBhcmF0b3IpIHtcclxuICB2YXIgZCA9IGV4cG9ydHMuZGF0ZVVUQyhkYXRlLCBleHRlbmRlZCksXHJcbiAgICAgIHQgPSBleHBvcnRzLnRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAob21pdFNlcGFyYXRvcilcclxuICAgIHJldHVybiBkICsgdDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZCArICdUJyArIHQ7XHJcbn07XHJcblxyXG4vKipcclxuICBQYXJzZSBhIHN0cmluZyBpbnRvIGEgRGF0ZSBvYmplY3QgaWYgaXMgYSB2YWxpZCBJU08tODYwMSBmb3JtYXQuXHJcbiAgUGFyc2Ugc2luZ2xlIGRhdGUsIHNpbmdsZSB0aW1lIG9yIGRhdGUtdGltZSBmb3JtYXRzLlxyXG4gIElNUE9SVEFOVDogSXQgZG9lcyBOT1QgY29udmVydCBiZXR3ZWVuIHRoZSBkYXRlc3RyIFRpbWVab25lIGFuZCB0aGVcclxuICBsb2NhbCBUaW1lWm9uZSAoZWl0aGVyIGl0IGFsbG93cyBkYXRlc3RyIHRvIGluY2x1ZGVkIFRpbWVab25lIGluZm9ybWF0aW9uKVxyXG4gIFRPRE86IE9wdGlvbmFsIFQgc2VwYXJhdG9yIGlzIG5vdCBhbGxvd2VkLlxyXG4gIFRPRE86IE1pbGxpc2Vjb25kcy9mcmFjdGlvbnMgb2Ygc2Vjb25kcyBub3Qgc3VwcG9ydGVkXHJcbioqL1xyXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UoZGF0ZXN0cikge1xyXG4gIHZhciBkdCA9IGRhdGVzdHIuc3BsaXQoJ1QnKSxcclxuICAgIGRhdGUgPSBkdFswXSxcclxuICAgIHRpbWUgPSBkdC5sZW5ndGggPT0gMiA/IGR0WzFdIDogbnVsbDtcclxuXHJcbiAgaWYgKGR0Lmxlbmd0aCA+IDIpXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgZm9ybWF0XCIpO1xyXG5cclxuICAvLyBDaGVjayBpZiBkYXRlIGNvbnRhaW5zIGEgdGltZTtcclxuICAvLyBiZWNhdXNlIG1heWJlIGRhdGVzdHIgaXMgb25seSB0aGUgdGltZSBwYXJ0XHJcbiAgaWYgKC86fF5cXGR7NCw2fVteXFwtXShcXC5cXGQqKT8oPzpafFsrXFwtXS4qKT8kLy50ZXN0KGRhdGUpKSB7XHJcbiAgICB0aW1lID0gZGF0ZTtcclxuICAgIGRhdGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgdmFyIHksIG0sIGQsIGgsIG1tLCBzLCB0eiwgdXRjO1xyXG5cclxuICBpZiAoZGF0ZSkge1xyXG4gICAgdmFyIGRwYXJ0cyA9IC8oXFxkezR9KVxcLT8oXFxkezJ9KVxcLT8oXFxkezJ9KS8uZXhlYyhkYXRlKTtcclxuICAgIGlmICghZHBhcnRzKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgZGF0ZSBmb3JtYXRcIik7XHJcblxyXG4gICAgeSA9IGRwYXJ0c1sxXTtcclxuICAgIG0gPSBkcGFydHNbMl07XHJcbiAgICBkID0gZHBhcnRzWzNdO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRpbWUpIHtcclxuICAgIHZhciB0cGFydHMgPSAvKFxcZHsyfSk6PyhcXGR7Mn0pKD86Oj8oXFxkezJ9KSk/KFp8WytcXC1dLiopPy8uZXhlYyh0aW1lKTtcclxuICAgIGlmICghdHBhcnRzKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgdGltZSBmb3JtYXRcIik7XHJcblxyXG4gICAgaCA9IHRwYXJ0c1sxXTtcclxuICAgIG1tID0gdHBhcnRzWzJdO1xyXG4gICAgcyA9IHRwYXJ0cy5sZW5ndGggPiAzID8gdHBhcnRzWzNdIDogbnVsbDtcclxuICAgIHR6ID0gdHBhcnRzLmxlbmd0aCA+IDQgPyB0cGFydHNbNF0gOiBudWxsO1xyXG4gICAgLy8gRGV0ZWN0cyBpZiBpcyBhIHRpbWUgaW4gVVRDOlxyXG4gICAgdXRjID0gL15aJC9pLnRlc3QodHopO1xyXG4gIH1cclxuXHJcbiAgLy8gVmFyIHRvIGhvbGQgdGhlIHBhcnNlZCB2YWx1ZSwgd2Ugc3RhcnQgd2l0aCB0b2RheSxcclxuICAvLyB0aGF0IHdpbGwgZmlsbCB0aGUgbWlzc2luZyBwYXJ0c1xyXG4gIHZhciBwYXJzZWREYXRlID0gbmV3IERhdGUoKTtcclxuXHJcbiAgaWYgKGRhdGUpIHtcclxuICAgIC8vIFVwZGF0aW5nIHRoZSBkYXRlIG9iamVjdCB3aXRoIGVhY2ggeWVhciwgbW9udGggYW5kIGRhdGUvZGF5IGRldGVjdGVkOlxyXG4gICAgaWYgKHV0YylcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRVVENGdWxsWWVhcih5LCBtLCBkKTtcclxuICAgIGVsc2VcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRGdWxsWWVhcih5LCBtLCBkKTtcclxuICB9XHJcblxyXG4gIGlmICh0aW1lKSB7XHJcbiAgICBpZiAodXRjKVxyXG4gICAgICBwYXJzZWREYXRlLnNldFVUQ0hvdXJzKGgsIG1tLCBzKTtcclxuICAgIGVsc2VcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRIb3VycyhoLCBtbSwgcyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIEEgZGF0ZSB3aXRob3V0IHRpbWUgcGFydCBtdXN0IGJlIGNvbnNpZGVyZWQgYXMgMDA6MDA6MDAgaW5zdGVhZCBvZiBjdXJyZW50IHRpbWVcclxuICAgIHBhcnNlZERhdGUuc2V0SG91cnMoMCwgMCwgMCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGFyc2VkRGF0ZTtcclxufTsiLCIvKiBEYXRlIHBpY2tlciBpbml0aWFsaXphdGlvbiBhbmQgdXNlXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwRGF0ZVBpY2tlcigpIHtcclxuICAgIC8vIERhdGUgUGlja2VyXHJcbiAgICAkLmRhdGVwaWNrZXIuc2V0RGVmYXVsdHMoJC5kYXRlcGlja2VyLnJlZ2lvbmFsWyQoJ2h0bWwnKS5hdHRyKCdsYW5nJyldKTtcclxuICAgICQoJy5kYXRlLXBpY2snLCBkb2N1bWVudCkuZGF0ZXBpY2tlcih7XHJcbiAgICAgICAgc2hvd0FuaW06ICdibGluZCdcclxuICAgIH0pO1xyXG4gICAgYXBwbHlEYXRlUGlja2VyKCk7XHJcbn1cclxuZnVuY3Rpb24gYXBwbHlEYXRlUGlja2VyKGVsZW1lbnQpIHtcclxuICAgICQoXCIuZGF0ZS1waWNrXCIsIGVsZW1lbnQgfHwgZG9jdW1lbnQpXHJcbiAgICAvLy52YWwobmV3IERhdGUoKS5hc1N0cmluZygkLmRhdGVwaWNrZXIuX2RlZmF1bHRzLmRhdGVGb3JtYXQpKVxyXG4gICAgLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIHNob3dBbmltOiBcImJsaW5kXCJcclxuICAgIH0pO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBzZXR1cERhdGVQaWNrZXIsXHJcbiAgICAgICAgYXBwbHk6IGFwcGx5RGF0ZVBpY2tlclxyXG4gICAgfTtcclxuIiwiLyogRm9ybWF0IGEgZGF0ZSBhcyBZWVlZLU1NLUREIGluIFVUQyBmb3Igc2F2ZSB1c1xyXG4gICAgdG8gaW50ZXJjaGFuZ2Ugd2l0aCBvdGhlciBtb2R1bGVzIG9yIGFwcHMuXHJcbiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nKGRhdGUpIHtcclxuICAgIHZhciBtID0gKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgICAgZCA9IGRhdGUuZ2V0VVRDRGF0ZSgpLnRvU3RyaW5nKCk7XHJcbiAgICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgICAgICBtID0gJzAnICsgbTtcclxuICAgIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgIGQgPSAnMCcgKyBkO1xyXG4gICAgcmV0dXJuIGRhdGUuZ2V0VVRDRnVsbFllYXIoKS50b1N0cmluZygpICsgJy0nICsgbSArICctJyArIGQ7XHJcbn07IiwiLypnbG9iYWwgd2luZG93Ki9cclxuLyoqXHJcbiAgICBTaW1wbGlmaW5nIHNvbWUgdXNlcyBvZiB0aGUgRmFjZWJvb2sgQVBJXHJcbiAgICBhbmQgdGhlIGxvYWRpbmcgb2YgaXRzIEFQSSB3aXRoIGEgJ3JlYWR5JyBmdW5jdGlvbi5cclxuXHJcbiAgICBPZmZpY2lhbCBBUEk6IGh0dHBzOi8vZGV2ZWxvcGVycy5mYWNlYm9vay5jb20vZG9jcy9mYWNlYm9vay1sb2dpbi9sb2dpbi1mbG93LWZvci13ZWIvdjIuMVxyXG4qKi9cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gRmFjZWJvb2sgQVBJIHNldHRpbmdzIGdhdGhlcmVkIGZyb20gdGhlIGN1cnJlbnQgcGFnZVxyXG4vLyBvbiBmaXJzdCB1c2U6XHJcbnZhciBzZXR0aW5ncyA9IHtcclxuICAgIGxhbmd1YWdlOiAnZW4tVVMnLFxyXG4gICAgYXBwSWQ6IG51bGxcclxufTtcclxuXHJcbi8vIFByaXZhdGUgQVBJIGxvYWRpbmcvcmVhZHkgc3RhdHVzXHJcbnZhciBhcGlTdGF0dXMgPSB7XHJcbiAgICByZWFkeTogZmFsc2UsXHJcbiAgICBsb2FkaW5nOiBmYWxzZSxcclxuICAgIC8vIFByaXZhdGUgc3RhdGljIGNvbGxlY3Rpb24gb2YgY2FsbGJhY2tzIHJlZ2lzdGVyZWRcclxuICAgIHN0YWNrOiBbXVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBSZWdpc3RlciBhIGNhbGxiYWNrIHRvIGJlIGV4ZWN1dGVkIHdoZW4gdGhlXHJcbiAgICBGYWNlYm9vayBBUEkgaXMgcmVhZHkuXHJcbiAgICBUaGUgY2FsbGJhY2sgcmVjZWl2ZXMgYXMgdW5pcXVlIHBhcmFtZXRlclxyXG4gICAgdGhlIEZhY2Vib29rIEFQSSBvYmplY3QgKCdGQicpXHJcbioqL1xyXG5leHBvcnRzLnJlYWR5ID0gZnVuY3Rpb24gZmFjZWJvb2tSZWFkeShyZWFkeUNhbGxiYWNrKSB7XHJcbiAgICBcclxuICAgIGFwaVN0YXR1cy5zdGFjay5wdXNoKHJlYWR5Q2FsbGJhY2spO1xyXG5cclxuICAgIGlmIChhcGlTdGF0dXMucmVhZHkpIHtcclxuICAgICAgICAvLyBEb3VibGUtY2hlY2sgdGhlIGNhbGxiYWNrLCBzaW5jZSAncmVhZCdcclxuICAgICAgICAvLyBjb3VsZCBiZSBsb2FkZWQganVzdCB0byBmb3JjZSB0aGUgQVBJIHByZS1sb2FkXHJcbiAgICAgICAgaWYgKHR5cGVvZihyZWFkeUNhbGxiYWNrKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgcmVhZHlDYWxsYmFjayh3aW5kb3cuRkIpO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoIWZhY2Vib29rUmVhZHkuaXNMb2FkaW5nKSB7XHJcbiAgICAgICAgYXBpU3RhdHVzLmxvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICAvLyBHZXQgc2V0dGluZ3MgZnJvbSBwYWdlIGF0dHJpYnV0ZXNcclxuICAgICAgICBzZXR0aW5ncy5sYW5ndWFnZSA9ICQoJ1tkYXRhLWZhY2Vib29rLWxhbmd1YWdlXScpLmRhdGEoJ2ZhY2Vib29rLWxhbmd1YWdlJyk7XHJcbiAgICAgICAgc2V0dGluZ3MuYXBwSWQgPSAkKCdbZGF0YS1mYWNlYm9vay1hcHBpZF0nKS5kYXRhKCdmYWNlYm9vay1hcHBpZCcpO1xyXG5cclxuICAgICAgICBsb2FkZXIubG9hZCh7XHJcbiAgICAgICAgICAgIHNjcmlwdHM6IFsnLy9jb25uZWN0LmZhY2Vib29rLm5ldC8nICsgc2V0dGluZ3MubGFuZ3VhZ2UgKyAnL2FsbC5qcyddLFxyXG4gICAgICAgICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogZnVuY3Rpb24gKCkgeyByZXR1cm4gISF3aW5kb3cuRkI7IH0sXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJbml0aWFsaXplIChGYWNlYm9vayByZWdpc3RlcnMgaXRzZWxmIGFzIGdsb2JhbCAnRkInKVxyXG4gICAgICAgICAgICAgICAgd2luZG93LkZCLmluaXQoeyBhcHBJZDogc2V0dGluZ3MuYXBwSWQsIHN0YXR1czogdHJ1ZSwgY29va2llOiB0cnVlLCB4ZmJtbDogZmFsc2UgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSXMgcmVhZHlcclxuICAgICAgICAgICAgICAgIGFwaVN0YXR1cy5yZWFkeSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBhcGlTdGF0dXMubG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIEV4ZWN1dGUgY2FsbGJhY2tzIGluIHRoZSBzdGFjazpcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXBpU3RhdHVzLnN0YWNrLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBpU3RhdHVzLnN0YWNrW2ldKHdpbmRvdy5GQik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gICAgUmVxdWVzdCBhIEZhY2Vib29rIExvZ2luLCBleGVjdXRpbmcgdGhlIHN1Y2Nlc3NcclxuICAgIG9yIGVycm9yIGNhbGxiYWNrIGRlcGVuZGluZyBvbiB0aGUgcmVzcG9uc2UuXHJcbiAgICBTdWNjZXNzIGdldHMgdGhlICdhdXRoUmVzcG9uc2UnIGdpdmVuIGJ5IEZhY2Vib29rLFxyXG4gICAgYW5kIGVycm9yIHRoZSB3aG9sZSByZXNwb25zZSBvYmplY3QsIGFuZCBib3RoXHJcbiAgICB0aGUgRkIgQVBJIGFzIHNlY29uZCBwYXJhbWV0ZXIuXHJcbioqL1xyXG5leHBvcnRzLmxvZ2luID0gZnVuY3Rpb24gZmFjZWJvb2tMb2dpbihvcHRpb25zLCBzdWNjZXNzLCBlcnJvcikge1xyXG4gICAgLy8gV2hlbiB0aGUgQVBJIGlzIHJlYWR5XHJcbiAgICBleHBvcnRzLnJlYWR5KGZ1bmN0aW9uIChGQikge1xyXG4gICAgICAgIC8vIFdoZW4gRmFjZWJvb2sgZ2l2ZXMgYSByZXNwb25zZSB0byB0aGUgZm9sbG93aW5nXHJcbiAgICAgICAgLy8gTG9naW4gUmVxdWVzdFxyXG4gICAgICAgIEZCLmxvZ2luKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICAvLyBzdGF0dXM9PWNvbm5lY3RlZCBpZiB0aGVyZSBpcyBhbiBhdXRoUmVzcG9uc2VcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmF1dGhSZXNwb25zZSAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChzdWNjZXNzKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgc3VjY2VzcyhyZXNwb25zZS5hdXRoUmVzcG9uc2UsIEZCKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgKGVycm9yKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgZXJyb3IocmVzcG9uc2UsIEZCKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKiBBbiBpMThuIHV0aWxpdHksIGdldCBhIHRyYW5zbGF0aW9uIHRleHQgYnkgbG9va2luZyBmb3Igc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlIGh0bWxcclxud2l0aCB0aGUgbmFtZSBnaXZlbiBhcyBmaXJzdCBwYXJhbWVudGVyIGFuZCBhcHBseWluZyB0aGUgZ2l2ZW4gdmFsdWVzIG9uIHNlY29uZCBhbmQgXHJcbm90aGVyIHBhcmFtZXRlcnMuXHJcbiAgICBUT0RPOiBSRS1JTVBMRU1FTlQgbm90IHVzaW5nIGpRdWVyeSBuZWxzZSBET00gZWxlbWVudHMsIG9yIGFsbW9zdCBub3QgZWxlbWVudHMgaW5zaWRlIGJvZHlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG5mdW5jdGlvbiBnZXRUZXh0KCkge1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAvLyBHZXQga2V5IGFuZCB0cmFuc2xhdGUgaXRcclxuICAgIHZhciBmb3JtYXR0ZWQgPSBhcmdzWzBdO1xyXG4gICAgdmFyIHRleHQgPSAkKCcjbGNyZXMtJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoZm9ybWF0dGVkKSkudGV4dCgpO1xyXG4gICAgaWYgKHRleHQpXHJcbiAgICAgICAgZm9ybWF0dGVkID0gdGV4dDtcclxuICAgIC8vIEFwcGx5IGZvcm1hdCB0byB0aGUgdGV4dCB3aXRoIGFkZGl0aW9uYWwgcGFyYW1ldGVyc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7JyArIGkgKyAnXFxcXH0nLCAnZ2knKTtcclxuICAgICAgICBmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZShyZWdleHAsIGFyZ3NbaSArIDFdKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmb3JtYXR0ZWQ7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0VGV4dDsiLCIvKiogUmV0dXJucyB0aGUgcGF0aCB0byB0aGUgZ2l2ZW4gZWxlbWVudCBpbiBYUGF0aCBjb252ZW50aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gZ2V0WFBhdGgoZWxlbWVudCkge1xyXG4gICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5pZClcclxuICAgICAgICByZXR1cm4gJy8vKltAaWQ9XCInICsgZWxlbWVudC5pZCArICdcIl0nO1xyXG4gICAgdmFyIHhwYXRoID0gJyc7XHJcbiAgICBmb3IgKDsgZWxlbWVudCAmJiBlbGVtZW50Lm5vZGVUeXBlID09IDE7IGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICB2YXIgaWQgPSAkKGVsZW1lbnQucGFyZW50Tm9kZSkuY2hpbGRyZW4oZWxlbWVudC50YWdOYW1lKS5pbmRleChlbGVtZW50KSArIDE7XHJcbiAgICAgICAgaWQgPSAoaWQgPiAxID8gJ1snICsgaWQgKyAnXScgOiAnJyk7XHJcbiAgICAgICAgeHBhdGggPSAnLycgKyBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSArIGlkICsgeHBhdGg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geHBhdGg7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0WFBhdGg7XHJcbiIsIi8vIEl0IGV4ZWN1dGVzIHRoZSBnaXZlbiAncmVhZHknIGZ1bmN0aW9uIGFzIHBhcmFtZXRlciB3aGVuXHJcbi8vIG1hcCBlbnZpcm9ubWVudCBpcyByZWFkeSAod2hlbiBnb29nbGUgbWFwcyBhcGkgYW5kIHNjcmlwdCBpc1xyXG4vLyBsb2FkZWQgYW5kIHJlYWR5IHRvIHVzZSwgb3IgaW5tZWRpYXRlbHkgaWYgaXMgYWxyZWFkeSBsb2FkZWQpLlxyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XHJcblxyXG4vLyBQcml2YXRlIHN0YXRpYyBjb2xsZWN0aW9uIG9mIGNhbGxiYWNrcyByZWdpc3RlcmVkXHJcbnZhciBzdGFjayA9IFtdO1xyXG5cclxudmFyIGdvb2dsZU1hcFJlYWR5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnb29nbGVNYXBSZWFkeShyZWFkeSkge1xyXG4gICAgc3RhY2sucHVzaChyZWFkeSk7XHJcblxyXG4gICAgaWYgKGdvb2dsZU1hcFJlYWR5LmlzUmVhZHkpXHJcbiAgICAgICAgcmVhZHkoKTtcclxuICAgIGVsc2UgaWYgKCFnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcpIHtcclxuICAgICAgICBnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcgPSB0cnVlO1xyXG4gICAgICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgICAgICAgc2NyaXB0czogWydodHRwczovL3d3dy5nb29nbGUuY29tL2pzYXBpJ10sXHJcbiAgICAgICAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBmdW5jdGlvbiAoKSB7IHJldHVybiAhIXdpbmRvdy5nb29nbGU7IH0sXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBnb29nbGUubG9hZCgnbWFwcycsICczLjE2JyxcclxuICAgICAgICAgICAgICAgICAgICB7IG90aGVyX3BhcmFtczogJ3NlbnNvcj1mYWxzZScsIGNhbGxiYWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzUmVhZHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrW2ldKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gVXRpbGl0eSB0byBmb3JjZSB0aGUgcmVmcmVzaCBvZiBtYXBzIHRoYXQgc29sdmUgdGhlIHByb2JsZW0gd2l0aCBiYWQtc2l6ZWQgbWFwIGFyZWFcclxuZ29vZ2xlTWFwUmVhZHkucmVmcmVzaE1hcCA9IGZ1bmN0aW9uIHJlZnJlc2hNYXBzKG1hcCkge1xyXG4gICAgZ29vZ2xlTWFwUmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIERvbid0IGZvcmdldCB0aGUgY2VudGVyIVxyXG4gICAgICAgIHZhciBjZW50ZXIgPSBtYXAuZ2V0Q2VudGVyKCk7XHJcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXJPbmNlKG1hcCwgJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gUmVzdG9yZSBjZW50ZXJcclxuICAgICAgICAgICAgaWYgKGNlbnRlcilcclxuICAgICAgICAgICAgICAgIG1hcC5zZXRDZW50ZXIoY2VudGVyKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyKG1hcCwgJ3Jlc2l6ZScpO1xyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qIEdVSUQgR2VuZXJhdG9yXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGd1aWRHZW5lcmF0b3IoKSB7XHJcbiAgICB2YXIgUzQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDApIHwgMCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gKFM0KCkgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgUzQoKSArIFM0KCkpO1xyXG59OyIsIi8qKlxyXG4gICAgR2VuZXJpYyBzY3JpcHQgZm9yIGZpZWxkc2V0cyB3aXRoIGNsYXNzIC5oYXMtY29uZmlybSwgYWxsb3dpbmcgc2hvd1xyXG4gICAgdGhlIGNvbnRlbnQgb25seSBpZiB0aGUgbWFpbiBjb25maXJtIGZpZWxkcyBoYXZlICd5ZXMnIHNlbGVjdGVkLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBkZWZhdWx0U2VsZWN0b3IgPSAnZmllbGRzZXQuaGFzLWNvbmZpcm0gPiAuY29uZmlybSBpbnB1dCc7XHJcblxyXG5mdW5jdGlvbiBvbmNoYW5nZSgpIHtcclxuICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgIHZhciBmcyA9IHQuY2xvc2VzdCgnZmllbGRzZXQnKTtcclxuICAgIGlmICh0LmlzKCc6Y2hlY2tlZCcpKVxyXG4gICAgICAgIGlmICh0LnZhbCgpID09ICd5ZXMnIHx8IHQudmFsKCkgPT0gJ1RydWUnKVxyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcygnY29uZmlybWVkLW5vJykuYWRkQ2xhc3MoJ2NvbmZpcm1lZC15ZXMnKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKCdjb25maXJtZWQteWVzJykuYWRkQ2xhc3MoJ2NvbmZpcm1lZC1ubycpO1xyXG59XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IGRlZmF1bHRTZWxlY3RvcjtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgc2VsZWN0b3IsIG9uY2hhbmdlKTtcclxuICAgIC8vIFBlcmZvcm1zIGZpcnN0IGNoZWNrOlxyXG4gICAgJChzZWxlY3RvcikuY2hhbmdlKCk7XHJcbn07XHJcblxyXG5leHBvcnRzLm9mZiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBkZWZhdWx0U2VsZWN0b3I7XHJcblxyXG4gICAgJChkb2N1bWVudCkub2ZmKCdjaGFuZ2UnLCBzZWxlY3Rvcik7XHJcbn07IiwiLyogSW50ZXJuYXppb25hbGl6YXRpb24gVXRpbGl0aWVzXHJcbiAqL1xyXG52YXIgaTE4biA9IHt9O1xyXG5pMThuLmRpc3RhbmNlVW5pdHMgPSB7XHJcbiAgICAnRVMnOiAna20nLFxyXG4gICAgJ1VTJzogJ21pbGVzJ1xyXG59O1xyXG5pMThuLm51bWVyaWNNaWxlc1NlcGFyYXRvciA9IHtcclxuICAgICdlcy1FUyc6ICcuJyxcclxuICAgICdlcy1VUyc6ICcuJyxcclxuICAgICdlbi1VUyc6ICcsJyxcclxuICAgICdlbi1FUyc6ICcsJ1xyXG59O1xyXG5pMThuLm51bWVyaWNEZWNpbWFsU2VwYXJhdG9yID0ge1xyXG4gICAgJ2VzLUVTJzogJywnLFxyXG4gICAgJ2VzLVVTJzogJywnLFxyXG4gICAgJ2VuLVVTJzogJy4nLFxyXG4gICAgJ2VuLUVTJzogJy4nXHJcbn07XHJcbmkxOG4ubW9uZXlTeW1ib2xQcmVmaXggPSB7XHJcbiAgICAnRVMnOiAnJyxcclxuICAgICdVUyc6ICckJ1xyXG59O1xyXG5pMThuLm1vbmV5U3ltYm9sU3VmaXggPSB7XHJcbiAgICAnRVMnOiAn4oKsJyxcclxuICAgICdVUyc6ICcnXHJcbn07XHJcbmkxOG4uZ2V0Q3VycmVudEN1bHR1cmUgPSBmdW5jdGlvbiBnZXRDdXJyZW50Q3VsdHVyZSgpIHtcclxuICAgIHZhciBjID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1jdWx0dXJlJyk7XHJcbiAgICB2YXIgcyA9IGMuc3BsaXQoJy0nKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3VsdHVyZTogYyxcclxuICAgICAgICBsYW5ndWFnZTogc1swXSxcclxuICAgICAgICBjb3VudHJ5OiBzWzFdXHJcbiAgICB9O1xyXG59O1xyXG5pMThuLmNvbnZlcnRNaWxlc0ttID0gZnVuY3Rpb24gY29udmVydE1pbGVzS20ocSwgdW5pdCkge1xyXG4gICAgdmFyIE1JTEVTX1RPX0tNID0gMS42MDk7XHJcbiAgICBpZiAodW5pdCA9PSAnbWlsZXMnKVxyXG4gICAgICAgIHJldHVybiBNSUxFU19UT19LTSAqIHE7XHJcbiAgICBlbHNlIGlmICh1bml0ID09ICdrbScpXHJcbiAgICAgICAgcmV0dXJuIHEgLyBNSUxFU19UT19LTTtcclxuICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUubG9nKSBjb25zb2xlLmxvZygnY29udmVydE1pbGVzS206IFVucmVjb2duaXplZCB1bml0ICcgKyB1bml0KTtcclxuICAgIHJldHVybiAwO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBpMThuOyIsIi8qIFJldHVybnMgdHJ1ZSB3aGVuIHN0ciBpc1xyXG4tIG51bGxcclxuLSBlbXB0eSBzdHJpbmdcclxuLSBvbmx5IHdoaXRlIHNwYWNlcyBzdHJpbmdcclxuKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0VtcHR5U3RyaW5nKHN0cikge1xyXG4gICAgcmV0dXJuICEoL1xcUy9nLnRlc3Qoc3RyIHx8IFwiXCIpKTtcclxufTsiLCIvKiogQXMgdGhlICdpcycgalF1ZXJ5IG1ldGhvZCwgYnV0IGNoZWNraW5nIEBzZWxlY3RvciBpbiBhbGwgZWxlbWVudHNcclxuKiBAbW9kaWZpZXIgdmFsdWVzOlxyXG4qIC0gJ2FsbCc6IGFsbCBlbGVtZW50cyBtdXN0IG1hdGNoIHNlbGVjdG9yIHRvIHJldHVybiB0cnVlXHJcbiogLSAnYWxtb3N0LW9uZSc6IGFsbW9zdCBvbmUgZWxlbWVudCBtdXN0IG1hdGNoXHJcbiogLSAncGVyY2VudGFnZSc6IHJldHVybnMgcGVyY2VudGFnZSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtYXRjaCBzZWxlY3RvciAoMC0xMDApXHJcbiogLSAnc3VtbWFyeSc6IHJldHVybnMgdGhlIG9iamVjdCB7IHllczogbnVtYmVyLCBubzogbnVtYmVyLCBwZXJjZW50YWdlOiBudW1iZXIsIHRvdGFsOiBudW1iZXIgfVxyXG4qIC0ge2p1c3Q6IGEgbnVtYmVyfTogZXhhY3QgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qIC0ge2FsbW9zdDogYSBudW1iZXJ9OiBtaW5pbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiAtIHt1bnRpbDogYSBudW1iZXJ9OiBtYXhpbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmFyZSA9IGZ1bmN0aW9uIChzZWxlY3RvciwgbW9kaWZpZXIpIHtcclxuICAgIG1vZGlmaWVyID0gbW9kaWZpZXIgfHwgJ2FsbCc7XHJcbiAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5pcyhzZWxlY3RvcikpXHJcbiAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICB9KTtcclxuICAgIHN3aXRjaCAobW9kaWZpZXIpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPT0gY291bnQ7XHJcbiAgICAgICAgY2FzZSAnYWxtb3N0LW9uZSc6XHJcbiAgICAgICAgICAgIHJldHVybiBjb3VudCA+IDA7XHJcbiAgICAgICAgY2FzZSAncGVyY2VudGFnZSc6XHJcbiAgICAgICAgICAgIHJldHVybiBjb3VudCAvIHRoaXMubGVuZ3RoO1xyXG4gICAgICAgIGNhc2UgJ3N1bW1hcnknOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgeWVzOiBjb3VudCxcclxuICAgICAgICAgICAgICAgIG5vOiB0aGlzLmxlbmd0aCAtIGNvdW50LFxyXG4gICAgICAgICAgICAgICAgcGVyY2VudGFnZTogY291bnQgLyB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIHRvdGFsOiB0aGlzLmxlbmd0aFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICgnanVzdCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLmp1c3QgIT0gY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCdhbG1vc3QnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci5hbG1vc3QgPiBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ3VudGlsJyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIudW50aWwgPCBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgfVxyXG59OyIsIi8qKiA9PT09PT09PT09PT09PT09PT09XHJcbkV4dGVuc2lvbiBqcXVlcnk6ICdib3VuZHMnXHJcblJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGNvbWJpbmVkIGJvdW5kcyBmb3IgYWxsIFxyXG5lbGVtZW50cyBpbiB0aGUgY29sbGVjdGlvblxyXG4qL1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gIGpRdWVyeS5mbi5ib3VuZHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XHJcbiAgICAgIGluY2x1ZGVCb3JkZXI6IGZhbHNlLFxyXG4gICAgICBpbmNsdWRlTWFyZ2luOiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICB2YXIgYm91bmRzID0ge1xyXG4gICAgICBsZWZ0OiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHRvcDogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICByaWdodDogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLFxyXG4gICAgICBib3R0b206IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcclxuICAgICAgd2lkdGg6IE51bWJlci5OYU4sXHJcbiAgICAgIGhlaWdodDogTnVtYmVyLk5hTlxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZm5XaWR0aCA9IG9wdGlvbnMuaW5jbHVkZUJvcmRlciB8fCBvcHRpb25zLmluY2x1ZGVNYXJnaW4gPyBcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5vdXRlcldpZHRoLmNhbGwoZWwsIG9wdGlvbnMuaW5jbHVkZU1hcmdpbik7IH0gOlxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLndpZHRoLmNhbGwoZWwpOyB9O1xyXG4gICAgdmFyIGZuSGVpZ2h0ID0gb3B0aW9ucy5pbmNsdWRlQm9yZGVyIHx8IG9wdGlvbnMuaW5jbHVkZU1hcmdpbiA/IFxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLm91dGVySGVpZ2h0LmNhbGwoZWwsIG9wdGlvbnMuaW5jbHVkZU1hcmdpbik7IH0gOlxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLmhlaWdodC5jYWxsKGVsKTsgfTtcclxuXHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKGksIGVsKSB7XHJcbiAgICAgIHZhciBlbFEgPSAkKGVsKTtcclxuICAgICAgdmFyIG9mZiA9IGVsUS5vZmZzZXQoKTtcclxuICAgICAgb2ZmLnJpZ2h0ID0gb2ZmLmxlZnQgKyBmbldpZHRoKCQoZWxRKSk7XHJcbiAgICAgIG9mZi5ib3R0b20gPSBvZmYudG9wICsgZm5IZWlnaHQoJChlbFEpKTtcclxuXHJcbiAgICAgIGlmIChvZmYubGVmdCA8IGJvdW5kcy5sZWZ0KVxyXG4gICAgICAgIGJvdW5kcy5sZWZ0ID0gb2ZmLmxlZnQ7XHJcblxyXG4gICAgICBpZiAob2ZmLnRvcCA8IGJvdW5kcy50b3ApXHJcbiAgICAgICAgYm91bmRzLnRvcCA9IG9mZi50b3A7XHJcblxyXG4gICAgICBpZiAob2ZmLnJpZ2h0ID4gYm91bmRzLnJpZ2h0KVxyXG4gICAgICAgIGJvdW5kcy5yaWdodCA9IG9mZi5yaWdodDtcclxuXHJcbiAgICAgIGlmIChvZmYuYm90dG9tID4gYm91bmRzLmJvdHRvbSlcclxuICAgICAgICBib3VuZHMuYm90dG9tID0gb2ZmLmJvdHRvbTtcclxuICAgIH0pO1xyXG5cclxuICAgIGJvdW5kcy53aWR0aCA9IGJvdW5kcy5yaWdodCAtIGJvdW5kcy5sZWZ0O1xyXG4gICAgYm91bmRzLmhlaWdodCA9IGJvdW5kcy5ib3R0b20gLSBib3VuZHMudG9wO1xyXG4gICAgcmV0dXJuIGJvdW5kcztcclxuICB9O1xyXG59KSgpOyIsIi8qKlxyXG4qIEhhc1Njcm9sbEJhciByZXR1cm5zIGFuIG9iamVjdCB3aXRoIGJvb2wgcHJvcGVydGllcyAndmVydGljYWwnIGFuZCAnaG9yaXpvbnRhbCdcclxuKiBzYXlpbmcgaWYgdGhlIGVsZW1lbnQgaGFzIG5lZWQgb2Ygc2Nyb2xsYmFycyBmb3IgZWFjaCBkaW1lbnNpb24gb3Igbm90IChlbGVtZW50XHJcbiogY2FuIG5lZWQgc2Nyb2xsYmFycyBhbmQgc3RpbGwgbm90IGJlaW5nIHNob3dlZCBiZWNhdXNlIHRoZSBjc3Mtb3ZlcmxmbG93IHByb3BlcnR5XHJcbiogYmVpbmcgc2V0IGFzICdoaWRkZW4nLCBidXQgc3RpbGwgd2Uga25vdyB0aGF0IHRoZSBlbGVtZW50IHJlcXVpcmVzIGl0IGFuZCBpdHNcclxuKiBjb250ZW50IGlzIG5vdCBiZWluZyBmdWxseSBkaXNwbGF5ZWQpLlxyXG4qIEBleHRyYWdhcCwgZGVmYXVsdHMgdG8ge3g6MCx5OjB9LCBsZXRzIHNwZWNpZnkgYW4gZXh0cmEgc2l6ZSBpbiBwaXhlbHMgZm9yIGVhY2ggZGltZW5zaW9uIHRoYXQgYWx0ZXIgdGhlIHJlYWwgY2hlY2ssXHJcbiogcmVzdWx0aW5nIGluIGEgZmFrZSByZXN1bHQgdGhhdCBjYW4gYmUgaW50ZXJlc3RpbmcgdG8gZGlzY2FyZCBzb21lIHBpeGVscyBvZiBleGNlc3NcclxuKiBzaXplIChuZWdhdGl2ZSB2YWx1ZXMpIG9yIGV4YWdlcmF0ZSB0aGUgcmVhbCB1c2VkIHNpemUgd2l0aCB0aGF0IGV4dHJhIHBpeGVscyAocG9zaXRpdmUgdmFsdWVzKS5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmhhc1Njcm9sbEJhciA9IGZ1bmN0aW9uIChleHRyYWdhcCkge1xyXG4gICAgZXh0cmFnYXAgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgeDogMCxcclxuICAgICAgICB5OiAwXHJcbiAgICB9LCBleHRyYWdhcCk7XHJcbiAgICBpZiAoIXRoaXMgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiB7IHZlcnRpY2FsOiBmYWxzZSwgaG9yaXpvbnRhbDogZmFsc2UgfTtcclxuICAgIC8vbm90ZTogY2xpZW50SGVpZ2h0PSBoZWlnaHQgb2YgaG9sZGVyXHJcbiAgICAvL3Njcm9sbEhlaWdodD0gd2UgaGF2ZSBjb250ZW50IHRpbGwgdGhpcyBoZWlnaHRcclxuICAgIHZhciB0ID0gdGhpcy5nZXQoMCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHZlcnRpY2FsOiB0aGlzLm91dGVySGVpZ2h0KGZhbHNlKSA8ICh0LnNjcm9sbEhlaWdodCArIGV4dHJhZ2FwLnkpLFxyXG4gICAgICAgIGhvcml6b250YWw6IHRoaXMub3V0ZXJXaWR0aChmYWxzZSkgPCAodC5zY3JvbGxXaWR0aCArIGV4dHJhZ2FwLngpXHJcbiAgICB9O1xyXG59OyIsIi8qKiBDaGVja3MgaWYgY3VycmVudCBlbGVtZW50IG9yIG9uZSBvZiB0aGUgY3VycmVudCBzZXQgb2YgZWxlbWVudHMgaGFzXHJcbmEgcGFyZW50IHRoYXQgbWF0Y2ggdGhlIGVsZW1lbnQgb3IgZXhwcmVzc2lvbiBnaXZlbiBhcyBmaXJzdCBwYXJhbWV0ZXJcclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmlzQ2hpbGRPZiA9IGZ1bmN0aW9uIGpRdWVyeV9wbHVnaW5faXNDaGlsZE9mKGV4cCkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50cygpLmZpbHRlcihleHApLmxlbmd0aCA+IDA7XHJcbn07IiwiLyoqXHJcbiAgICBHZXRzIHRoZSBodG1sIHN0cmluZyBvZiB0aGUgZmlyc3QgZWxlbWVudCBhbmQgYWxsIGl0cyBjb250ZW50LlxyXG4gICAgVGhlICdodG1sJyBtZXRob2Qgb25seSByZXRyaWV2ZXMgdGhlIGh0bWwgc3RyaW5nIG9mIHRoZSBjb250ZW50LCBub3QgdGhlIGVsZW1lbnQgaXRzZWxmLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4ub3V0ZXJIdG1sID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKCF0aGlzIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gJyc7XHJcbiAgICB2YXIgZWwgPSB0aGlzLmdldCgwKTtcclxuICAgIHZhciBodG1sID0gJyc7XHJcbiAgICBpZiAoZWwub3V0ZXJIVE1MKVxyXG4gICAgICAgIGh0bWwgPSBlbC5vdXRlckhUTUw7XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBodG1sID0gdGhpcy53cmFwQWxsKCc8ZGl2PjwvZGl2PicpLnBhcmVudCgpLmh0bWwoKTtcclxuICAgICAgICB0aGlzLnVud3JhcCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGh0bWw7XHJcbn07IiwiLyoqXHJcbiAgICBVc2luZyB0aGUgYXR0cmlidXRlIGRhdGEtc291cmNlLXVybCBvbiBhbnkgSFRNTCBlbGVtZW50LFxyXG4gICAgdGhpcyBhbGxvd3MgcmVsb2FkIGl0cyBjb250ZW50IHBlcmZvcm1pbmcgYW4gQUpBWCBvcGVyYXRpb25cclxuICAgIG9uIHRoZSBnaXZlbiBVUkwgb3IgdGhlIG9uZSBpbiB0aGUgYXR0cmlidXRlOyB0aGUgZW5kLXBvaW50XHJcbiAgICBtdXN0IHJldHVybiB0ZXh0L2h0bWwgY29udGVudC5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vLyBEZWZhdWx0IHN1Y2Nlc3MgY2FsbGJhY2sgYW5kIHB1YmxpYyB1dGlsaXR5LCBiYXNpYyBob3ctdG8gcmVwbGFjZSBlbGVtZW50IGNvbnRlbnQgd2l0aCBmZXRjaGVkIGh0bWxcclxuZnVuY3Rpb24gdXBkYXRlRWxlbWVudChodG1sQ29udGVudCwgY29udGV4dCkge1xyXG4gICAgY29udGV4dCA9ICQuaXNQbGFpbk9iamVjdChjb250ZXh0KSAmJiBjb250ZXh0ID8gY29udGV4dCA6IHRoaXM7XHJcblxyXG4gICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAvLyBBdm9pZCBlbXB0eSBkb2N1bWVudHMgYmVpbmcgcGFyc2VkIChyYWlzZSBlcnJvcilcclxuICAgIGh0bWxDb250ZW50ID0gJC50cmltKGh0bWxDb250ZW50KTtcclxuICAgIGlmIChodG1sQ29udGVudCkge1xyXG4gICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYW4gZW1wdHkgZG9jdW1lbnQgb3IgbWFsZm9ybWVkIGlzIHJldHVybmVkOlxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGh0bWxDb250ZW50KSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgbmV3aHRtbCA9ICQoaHRtbENvbnRlbnQpO1xyXG4gICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgZWxlbWVudCA9IGNvbnRleHQuZWxlbWVudDtcclxuICAgIGlmIChjb250ZXh0Lm9wdGlvbnMubW9kZSA9PSAncmVwbGFjZS1tZScpXHJcbiAgICAgICAgZWxlbWVudC5yZXBsYWNlV2l0aChuZXdodG1sKTtcclxuICAgIGVsc2UgLy8gJ3JlcGxhY2UtY29udGVudCdcclxuICAgICAgICBlbGVtZW50Lmh0bWwobmV3aHRtbCk7XHJcblxyXG4gICAgcmV0dXJuIGNvbnRleHQ7XHJcbn1cclxuXHJcbi8vIERlZmF1bHQgY29tcGxldGUgY2FsbGJhY2sgYW5kIHB1YmxpYyB1dGlsaXR5XHJcbmZ1bmN0aW9uIHN0b3BMb2FkaW5nU3Bpbm5lcigpIHtcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxvYWRpbmdUaW1lcik7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh0aGlzLmVsZW1lbnQpO1xyXG59XHJcblxyXG4vLyBEZWZhdWx0c1xyXG52YXIgZGVmYXVsdHMgPSB7XHJcbiAgICB1cmw6IG51bGwsXHJcbiAgICBzdWNjZXNzOiBbdXBkYXRlRWxlbWVudF0sXHJcbiAgICBlcnJvcjogW10sXHJcbiAgICBjb21wbGV0ZTogW3N0b3BMb2FkaW5nU3Bpbm5lcl0sXHJcbiAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICBtb2RlOiAncmVwbGFjZS1jb250ZW50JyxcclxuICAgIGxvYWRpbmc6IHtcclxuICAgICAgICBsb2NrRWxlbWVudDogdHJ1ZSxcclxuICAgICAgICBsb2NrT3B0aW9uczoge30sXHJcbiAgICAgICAgbWVzc2FnZTogbnVsbCxcclxuICAgICAgICBzaG93TG9hZGluZ0luZGljYXRvcjogdHJ1ZSxcclxuICAgICAgICBkZWxheTogMFxyXG4gICAgfVxyXG59O1xyXG5cclxuLyogUmVsb2FkIG1ldGhvZCAqL1xyXG52YXIgcmVsb2FkID0gJC5mbi5yZWxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBPcHRpb25zIGZyb20gZGVmYXVsdHMgKGludGVybmFsIGFuZCBwdWJsaWMpXHJcbiAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgcmVsb2FkLmRlZmF1bHRzKTtcclxuICAgIC8vIElmIG9wdGlvbnMgb2JqZWN0IGlzIHBhc3NlZCBhcyB1bmlxdWUgcGFyYW1ldGVyXHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxICYmICQuaXNQbGFpbk9iamVjdChhcmd1bWVudHNbMF0pKSB7XHJcbiAgICAgICAgLy8gTWVyZ2Ugb3B0aW9uczpcclxuICAgICAgICAkLmV4dGVuZCh0cnVlLCBvcHRpb25zLCBhcmd1bWVudHNbMF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDb21tb24gb3ZlcmxvYWQ6IG5ldy11cmwgYW5kIGNvbXBsZXRlIGNhbGxiYWNrLCBib3RoIG9wdGlvbmFsc1xyXG4gICAgICAgIG9wdGlvbnMudXJsID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiBudWxsO1xyXG4gICAgICAgIG9wdGlvbnMuY29tcGxldGUgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucy51cmwpIHtcclxuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihvcHRpb25zLnVybCkpXHJcbiAgICAgICAgICAgIC8vIEZ1bmN0aW9uIHBhcmFtczogY3VycmVudFJlbG9hZFVybCwgZGVmYXVsdFJlbG9hZFVybFxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnc291cmNlLXVybCcsICQucHJveHkob3B0aW9ucy51cmwsIHRoaXMpKCR0LmRhdGEoJ3NvdXJjZS11cmwnKSwgJHQuYXR0cignZGF0YS1zb3VyY2UtdXJsJykpKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnc291cmNlLXVybCcsIG9wdGlvbnMudXJsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHVybCA9ICR0LmRhdGEoJ3NvdXJjZS11cmwnKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYWxyZWFkeSBiZWluZyByZWxvYWRlZCwgdG8gY2FuY2VsIHByZXZpb3VzIGF0dGVtcHRcclxuICAgICAgICB2YXIganEgPSAkdC5kYXRhKCdpc1JlbG9hZGluZycpO1xyXG4gICAgICAgIGlmIChqcSkge1xyXG4gICAgICAgICAgICBpZiAoanEudXJsID09IHVybClcclxuICAgICAgICAgICAgICAgIC8vIElzIHRoZSBzYW1lIHVybCwgZG8gbm90IGFib3J0IGJlY2F1c2UgaXMgdGhlIHNhbWUgcmVzdWx0IGJlaW5nIHJldHJpZXZlZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBqcS5hYm9ydCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT3B0aW9uYWwgZGF0YSBwYXJhbWV0ZXIgJ3JlbG9hZC1tb2RlJyBhY2NlcHRzIHZhbHVlczogXHJcbiAgICAgICAgLy8gLSAncmVwbGFjZS1tZSc6IFVzZSBodG1sIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCByZWxvYWRlZCBlbGVtZW50IChha2E6IHJlcGxhY2VXaXRoKCkpXHJcbiAgICAgICAgLy8gLSAncmVwbGFjZS1jb250ZW50JzogKGRlZmF1bHQpIEh0bWwgcmV0dXJuZWQgcmVwbGFjZSBjdXJyZW50IGVsZW1lbnQgY29udGVudCAoYWthOiBodG1sKCkpXHJcbiAgICAgICAgb3B0aW9ucy5tb2RlID0gJHQuZGF0YSgncmVsb2FkLW1vZGUnKSB8fCBvcHRpb25zLm1vZGU7XHJcblxyXG4gICAgICAgIGlmICh1cmwpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIExvYWRpbmcsIHdpdGggZGVsYXlcclxuICAgICAgICAgICAgdmFyIGxvYWRpbmd0aW1lciA9IG9wdGlvbnMubG9hZGluZy5sb2NrRWxlbWVudCA/XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGluZyBjb250ZW50IHVzaW5nIGEgZmFrZSB0ZW1wIHBhcmVudCBlbGVtZW50IHRvIHByZWxvYWQgaW1hZ2UgYW5kIHRvIGdldCByZWFsIG1lc3NhZ2Ugd2lkdGg6XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvYWRpbmdjb250ZW50ID0gJCgnPGRpdi8+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5tZXNzYWdlID8gJCgnPGRpdiBjbGFzcz1cImxvYWRpbmctbWVzc2FnZVwiLz4nKS5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UpIDogbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5zaG93TG9hZGluZ0luZGljYXRvciA/IG9wdGlvbnMubG9hZGluZy5tZXNzYWdlIDogbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ2NvbnRlbnQuY3NzKHsgcG9zaXRpb246ICdhYnNvbHV0ZScsIGxlZnQ6IC05OTk5OSB9KS5hcHBlbmRUbygnYm9keScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB3ID0gbG9hZGluZ2NvbnRlbnQud2lkdGgoKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nY29udGVudC5kZXRhY2goKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBMb2NraW5nOlxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucy5hdXRvZm9jdXMgPSBvcHRpb25zLmF1dG9mb2N1cztcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMud2lkdGggPSB3O1xyXG4gICAgICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4obG9hZGluZ2NvbnRlbnQuaHRtbCgpLCAkdCwgb3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgPyAnY3VzdG9tLWxvYWRpbmcnIDogJ2xvYWRpbmcnLCBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucy5sb2FkaW5nLmRlbGF5KVxyXG4gICAgICAgICAgICAgICAgOiBudWxsO1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlcGFyZSBjb250ZXh0XHJcbiAgICAgICAgICAgIHZhciBjdHggPSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50OiAkdCxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICBsb2FkaW5nVGltZXI6IGxvYWRpbmd0aW1lclxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgICAgICAgICBqcSA9ICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dDogY3R4XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVXJsIGlzIHNldCBpbiB0aGUgcmV0dXJuZWQgYWpheCBvYmplY3QgYmVjYXVzZSBpcyBub3Qgc2V0IGJ5IGFsbCB2ZXJzaW9ucyBvZiBqUXVlcnlcclxuICAgICAgICAgICAganEudXJsID0gdXJsO1xyXG5cclxuICAgICAgICAgICAgLy8gTWFyayBlbGVtZW50IGFzIGlzIGJlaW5nIHJlbG9hZGVkLCB0byBhdm9pZCBtdWx0aXBsZSBhdHRlbXBzIGF0IHNhbWUgdGltZSwgc2F2aW5nXHJcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgYWpheCBvYmplY3QgdG8gYWxsb3cgYmUgY2FuY2VsbGVkXHJcbiAgICAgICAgICAgICR0LmRhdGEoJ2lzUmVsb2FkaW5nJywganEpO1xyXG4gICAgICAgICAgICBqcS5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnaXNSZWxvYWRpbmcnLCBudWxsKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDYWxsYmFja3M6IGZpcnN0IGdsb2JhbHMgYW5kIHRoZW4gZnJvbSBvcHRpb25zIGlmIHRoZXkgYXJlIGRpZmZlcmVudFxyXG4gICAgICAgICAgICAvLyBzdWNjZXNzXHJcbiAgICAgICAgICAgIGpxLmRvbmUocmVsb2FkLmRlZmF1bHRzLnN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zdWNjZXNzICE9IHJlbG9hZC5kZWZhdWx0cy5zdWNjZXNzKVxyXG4gICAgICAgICAgICAgICAganEuZG9uZShvcHRpb25zLnN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICAvLyBlcnJvclxyXG4gICAgICAgICAgICBqcS5mYWlsKHJlbG9hZC5kZWZhdWx0cy5lcnJvcik7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yICE9IHJlbG9hZC5kZWZhdWx0cy5lcnJvcilcclxuICAgICAgICAgICAgICAgIGpxLmZhaWwob3B0aW9ucy5lcnJvcik7XHJcbiAgICAgICAgICAgIC8vIGNvbXBsZXRlXHJcbiAgICAgICAgICAgIGpxLmFsd2F5cyhyZWxvYWQuZGVmYXVsdHMuY29tcGxldGUpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb21wbGV0ZSAhPSByZWxvYWQuZGVmYXVsdHMuY29tcGxldGUpXHJcbiAgICAgICAgICAgICAgICBqcS5kb25lKG9wdGlvbnMuY29tcGxldGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vLyBQdWJsaWMgZGVmYXVsdHNcclxucmVsb2FkLmRlZmF1bHRzID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzKTtcclxuXHJcbi8vIFB1YmxpYyB1dGlsaXRpZXNcclxucmVsb2FkLnVwZGF0ZUVsZW1lbnQgPSB1cGRhdGVFbGVtZW50O1xyXG5yZWxvYWQuc3RvcExvYWRpbmdTcGlubmVyID0gc3RvcExvYWRpbmdTcGlubmVyO1xyXG5cclxuLy8gTW9kdWxlXHJcbm1vZHVsZS5leHBvcnRzID0gcmVsb2FkOyIsIi8qKiBFeHRlbmRlZCB0b2dnbGUtc2hvdy1oaWRlIGZ1bnRpb25zLlxyXG4gICAgSWFnb1NSTEBnbWFpbC5jb21cclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5XHJcbiAqKi9cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgLyoqIEltcGxlbWVudGF0aW9uOiByZXF1aXJlIGpRdWVyeSBhbmQgcmV0dXJucyBvYmplY3Qgd2l0aCB0aGVcclxuICAgICAgICBwdWJsaWMgbWV0aG9kcy5cclxuICAgICAqKi9cclxuICAgIGZ1bmN0aW9uIHh0c2goalF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyICQgPSBqUXVlcnk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEhpZGUgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ2hpZGUnIGFuZCAnZmFkZU91dCcgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuZmFkZU91dChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuc2xpZGVVcChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ2hpZGUnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuaGlkZShvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4aGlkZScsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAqIFNob3cgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ3Nob3cnIGFuZCAnZmFkZUluJyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAvLyBXZSBwZXJmb3JtcyBhIGZpeCBvbiBzdGFuZGFyZCBqUXVlcnkgZWZmZWN0c1xyXG4gICAgICAgICAgICAvLyB0byBhdm9pZCBhbiBlcnJvciB0aGF0IHByZXZlbnRzIGZyb20gcnVubmluZ1xyXG4gICAgICAgICAgICAvLyBlZmZlY3RzIG9uIGVsZW1lbnRzIHRoYXQgYXJlIGFscmVhZHkgdmlzaWJsZSxcclxuICAgICAgICAgICAgLy8gd2hhdCBsZXRzIHRoZSBwb3NzaWJpbGl0eSBvZiBnZXQgYSBtaWRkbGUtYW5pbWF0ZWRcclxuICAgICAgICAgICAgLy8gZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBXZSBqdXN0IGNoYW5nZSBkaXNwbGF5Om5vbmUsIGZvcmNpbmcgdG8gJ2lzLXZpc2libGUnIHRvXHJcbiAgICAgICAgICAgIC8vIGJlIGZhbHNlIGFuZCB0aGVuIHJ1bm5pbmcgdGhlIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gZmxpY2tlcmluZyBlZmZlY3QsIGJlY2F1c2UgalF1ZXJ5IGp1c3QgcmVzZXRzXHJcbiAgICAgICAgICAgIC8vIGRpc3BsYXkgb24gZWZmZWN0IHN0YXJ0LlxyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZhZGVJbihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zbGlkZURvd24ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdzaG93J1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2hvdyhvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4c2hvdycsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogR2VuZXJpYyB1dGlsaXR5IGZvciBoaWdobHkgY29uZmlndXJhYmxlIGpRdWVyeS50b2dnbGUgd2l0aCBzdXBwb3J0XHJcbiAgICAgICAgICAgIHRvIHNwZWNpZnkgdGhlIHRvZ2dsZSB2YWx1ZSBleHBsaWNpdHkgZm9yIGFueSBraW5kIG9mIGVmZmVjdDoganVzdCBwYXNzIHRydWUgYXMgc2Vjb25kIHBhcmFtZXRlciAndG9nZ2xlJyB0byBzaG93XHJcbiAgICAgICAgICAgIGFuZCBmYWxzZSB0byBoaWRlLiBUb2dnbGUgbXVzdCBiZSBzdHJpY3RseSBhIEJvb2xlYW4gdmFsdWUgdG8gYXZvaWQgYXV0by1kZXRlY3Rpb24uXHJcbiAgICAgICAgICAgIFRvZ2dsZSBwYXJhbWV0ZXIgY2FuIGJlIG9taXR0ZWQgdG8gYXV0by1kZXRlY3QgaXQsIGFuZCBzZWNvbmQgcGFyYW1ldGVyIGNhbiBiZSB0aGUgYW5pbWF0aW9uIG9wdGlvbnMuXHJcbiAgICAgICAgICAgIEFsbCB0aGUgb3RoZXJzIGJlaGF2ZSBleGFjdGx5IGFzIGhpZGVFbGVtZW50IGFuZCBzaG93RWxlbWVudC5cclxuICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiB0b2dnbGVFbGVtZW50KGVsZW1lbnQsIHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgbm90IGEgYm9vbGVhblxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlICE9PSB0cnVlICYmIHRvZ2dsZSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBhbiBvYmplY3QsIHRoZW4gaXMgdGhlIG9wdGlvbnMgYXMgc2Vjb25kIHBhcmFtZXRlclxyXG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdCh0b2dnbGUpKVxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB0b2dnbGU7XHJcbiAgICAgICAgICAgICAgICAvLyBBdXRvLWRldGVjdCB0b2dnbGUsIGl0IGNhbiB2YXJ5IG9uIGFueSBlbGVtZW50IGluIHRoZSBjb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgLy8gdGhlbiBkZXRlY3Rpb24gYW5kIGFjdGlvbiBtdXN0IGJlIGRvbmUgcGVyIGVsZW1lbnQ6XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldXNpbmcgZnVuY3Rpb24sIHdpdGggZXhwbGljaXQgdG9nZ2xlIHZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCAhJCh0aGlzKS5pcygnOnZpc2libGUnKSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlKVxyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvKiogRG8galF1ZXJ5IGludGVncmF0aW9uIGFzIHh0b2dnbGUsIHhzaG93LCB4aGlkZVxyXG4gICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiBwbHVnSW4oalF1ZXJ5KSB7XHJcbiAgICAgICAgICAgIC8qKiB0b2dnbGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeHRvZ2dsZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54dG9nZ2xlID0gZnVuY3Rpb24geHRvZ2dsZSh0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgdG9nZ2xlLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIHNob3dFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54c2hvdyA9IGZ1bmN0aW9uIHhzaG93KG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogaGlkZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54aGlkZSA9IGZ1bmN0aW9uIHhoaWRlKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeHBvcnRpbmc6XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdG9nZ2xlRWxlbWVudDogdG9nZ2xlRWxlbWVudCxcclxuICAgICAgICAgICAgc2hvd0VsZW1lbnQ6IHNob3dFbGVtZW50LFxyXG4gICAgICAgICAgICBoaWRlRWxlbWVudDogaGlkZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHBsdWdJbjogcGx1Z0luXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNb2R1bGVcclxuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCB4dHNoKTtcclxuICAgIH0gZWxzZSBpZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgICAgIHZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHh0c2goalF1ZXJ5KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTm9ybWFsIHNjcmlwdCBsb2FkLCBpZiBqUXVlcnkgaXMgZ2xvYmFsIChhdCB3aW5kb3cpLCBpdHMgZXh0ZW5kZWQgYXV0b21hdGljYWxseSAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cualF1ZXJ5ICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgeHRzaCh3aW5kb3cualF1ZXJ5KS5wbHVnSW4od2luZG93LmpRdWVyeSk7XHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8qIFNvbWUgdXRpbGl0aWVzIGZvciB1c2Ugd2l0aCBqUXVlcnkgb3IgaXRzIGV4cHJlc3Npb25zXHJcbiAgICB0aGF0IGFyZSBub3QgcGx1Z2lucy5cclxuKi9cclxuZnVuY3Rpb24gZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShzdHIpIHtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFsgIzsmLC4rKn5cXCc6XCIhXiRbXFxdKCk9PnxcXC9dKS9nLCAnXFxcXCQxJyk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU6IGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWVcclxuICAgIH07XHJcbiIsIi8qIEFzc2V0cyBsb2FkZXIgd2l0aCBsb2FkaW5nIGNvbmZpcm1hdGlvbiAobWFpbmx5IGZvciBzY3JpcHRzKVxyXG4gICAgYmFzZWQgb24gTW9kZXJuaXpyL3llcG5vcGUgbG9hZGVyLlxyXG4qL1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG5leHBvcnRzLmxvYWQgPSBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgb3B0cyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBzY3JpcHRzOiBbXSxcclxuICAgICAgICBjb21wbGV0ZTogbnVsbCxcclxuICAgICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogbnVsbCxcclxuICAgICAgICBsb2FkRGVsYXk6IDAsXHJcbiAgICAgICAgdHJpYWxzSW50ZXJ2YWw6IDUwMFxyXG4gICAgfSwgb3B0cyk7XHJcbiAgICBpZiAoIW9wdHMuc2NyaXB0cy5sZW5ndGgpIHJldHVybjtcclxuICAgIGZ1bmN0aW9uIHBlcmZvcm1Db21wbGV0ZSgpIHtcclxuICAgICAgICBpZiAodHlwZW9mIChvcHRzLmNvbXBsZXRlVmVyaWZpY2F0aW9uKSAhPT0gJ2Z1bmN0aW9uJyB8fCBvcHRzLmNvbXBsZXRlVmVyaWZpY2F0aW9uKCkpXHJcbiAgICAgICAgICAgIG9wdHMuY29tcGxldGUoKTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChwZXJmb3JtQ29tcGxldGUsIG9wdHMudHJpYWxzSW50ZXJ2YWwpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLndhcm4pXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0xDLmxvYWQuY29tcGxldGVWZXJpZmljYXRpb24gZmFpbGVkIGZvciAnICsgb3B0cy5zY3JpcHRzWzBdICsgJyByZXRyeWluZyBpdCBpbiAnICsgb3B0cy50cmlhbHNJbnRlcnZhbCArICdtcycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgICAgICAgTW9kZXJuaXpyLmxvYWQoe1xyXG4gICAgICAgICAgICBsb2FkOiBvcHRzLnNjcmlwdHMsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBvcHRzLmNvbXBsZXRlID8gcGVyZm9ybUNvbXBsZXRlIDogbnVsbFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKG9wdHMubG9hZERlbGF5KVxyXG4gICAgICAgIHNldFRpbWVvdXQobG9hZCwgb3B0cy5sb2FkRGVsYXkpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGxvYWQoKTtcclxufTsiLCIvKi0tLS0tLS0tLS0tLVxyXG5VdGlsaXRpZXMgdG8gbWFuaXB1bGF0ZSBudW1iZXJzLCBhZGRpdGlvbmFsbHlcclxudG8gdGhlIG9uZXMgYXQgTWF0aFxyXG4tLS0tLS0tLS0tLS0qL1xyXG5cclxuLyoqIEVudW1lcmF0aW9uIHRvIGJlIHVzZXMgYnkgZnVuY3Rpb25zIHRoYXQgaW1wbGVtZW50cyAncm91bmRpbmcnIG9wZXJhdGlvbnMgb24gZGlmZmVyZW50XHJcbmRhdGEgdHlwZXMuXHJcbkl0IGhvbGRzIHRoZSBkaWZmZXJlbnQgd2F5cyBhIHJvdW5kaW5nIG9wZXJhdGlvbiBjYW4gYmUgYXBwbHkuXHJcbioqL1xyXG52YXIgcm91bmRpbmdUeXBlRW51bSA9IHtcclxuICAgIERvd246IC0xLFxyXG4gICAgTmVhcmVzdDogMCxcclxuICAgIFVwOiAxXHJcbn07XHJcblxyXG5mdW5jdGlvbiByb3VuZFRvKG51bWJlciwgZGVjaW1hbHMsIHJvdW5kaW5nVHlwZSkge1xyXG4gICAgLy8gY2FzZSBOZWFyZXN0IGlzIHRoZSBkZWZhdWx0OlxyXG4gICAgdmFyIGYgPSBuZWFyZXN0VG87XHJcbiAgICBzd2l0Y2ggKHJvdW5kaW5nVHlwZSkge1xyXG4gICAgICAgIGNhc2Ugcm91bmRpbmdUeXBlRW51bS5Eb3duOlxyXG4gICAgICAgICAgICBmID0gZmxvb3JUbztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSByb3VuZGluZ1R5cGVFbnVtLlVwOlxyXG4gICAgICAgICAgICBmID0gY2VpbFRvO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgIHJldHVybiBmKG51bWJlciwgZGVjaW1hbHMpO1xyXG59XHJcblxyXG4vKiogUm91bmQgYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0IGNhbiBzdWJzdHJhY3QgaW50ZWdlciBkZWNpbWFscyBieSBwcm92aWRpbmcgYSBuZWdhdGl2ZVxyXG5udW1iZXIgb2YgZGVjaW1hbHMuXHJcbioqL1xyXG5mdW5jdGlvbiBuZWFyZXN0VG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vKiogUm91bmQgVXAgYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0cyBzaW1pbGFyIHRvIHJvdW5kVG8sIGJ1dCB0aGUgbnVtYmVyIGlzIGV2ZXIgcm91bmRlZCB1cCxcclxudG8gdGhlIGxvd2VyIGludGVnZXIgZ3JlYXRlciBvciBlcXVhbHMgdG8gdGhlIG51bWJlci5cclxuKiovXHJcbmZ1bmN0aW9uIGNlaWxUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLyoqIFJvdW5kIERvd24gYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0cyBzaW1pbGFyIHRvIHJvdW5kVG8sIGJ1dCB0aGUgbnVtYmVyIGlzIGV2ZXIgcm91bmRlZCBkb3duLFxyXG50byB0aGUgYmlnZ2VyIGludGVnZXIgbG93ZXIgb3IgZXF1YWxzIHRvIHRoZSBudW1iZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBmbG9vclRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIHJvdW5kaW5nVHlwZUVudW06IHJvdW5kaW5nVHlwZUVudW0sXHJcbiAgICAgICAgcm91bmRUbzogcm91bmRUbyxcclxuICAgICAgICBuZWFyZXN0VG86IG5lYXJlc3RUbyxcclxuICAgICAgICBjZWlsVG86IGNlaWxUbyxcclxuICAgICAgICBmbG9vclRvOiBmbG9vclRvXHJcbiAgICB9OyIsImZ1bmN0aW9uIG1vdmVGb2N1c1RvKGVsLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIG1hcmdpblRvcDogMzAsXHJcbiAgICAgICAgZHVyYXRpb246IDUwMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6ICQoZWwpLm9mZnNldCgpLnRvcCAtIG9wdGlvbnMubWFyZ2luVG9wIH0sIG9wdGlvbnMuZHVyYXRpb24sIG51bGwpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbW92ZUZvY3VzVG87XHJcbn0iLCIvKiBTb21lIHV0aWxpdGllcyB0byBmb3JtYXQgYW5kIGV4dHJhY3QgbnVtYmVycywgZnJvbSB0ZXh0IG9yIERPTS5cclxuICovXHJcbnZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGkxOG4gPSByZXF1aXJlKCcuL2kxOG4nKSxcclxuICAgIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbmZ1bmN0aW9uIGdldE1vbmV5TnVtYmVyKHYsIGFsdCkge1xyXG4gICAgYWx0ID0gYWx0IHx8IDA7XHJcbiAgICBpZiAodiBpbnN0YW5jZW9mIGpRdWVyeSlcclxuICAgICAgICB2ID0gdi52YWwoKSB8fCB2LnRleHQoKTtcclxuICAgIHYgPSBwYXJzZUZsb2F0KHZcclxuICAgICAgICAucmVwbGFjZSgvWyTigqxdL2csICcnKVxyXG4gICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoTEMubnVtZXJpY01pbGVzU2VwYXJhdG9yW2kxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jdWx0dXJlXSwgJ2cnKSwgJycpXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIGlzTmFOKHYpID8gYWx0IDogdjtcclxufVxyXG5mdW5jdGlvbiBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nKHYpIHtcclxuICAgIHZhciBjdWx0dXJlID0gaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmN1bHR1cmU7XHJcbiAgICAvLyBGaXJzdCwgcm91bmQgdG8gMiBkZWNpbWFsc1xyXG4gICAgdiA9IG11LnJvdW5kVG8odiwgMik7XHJcbiAgICAvLyBHZXQgdGhlIGRlY2ltYWwgcGFydCAocmVzdClcclxuICAgIHZhciByZXN0ID0gTWF0aC5yb3VuZCh2ICogMTAwICUgMTAwKTtcclxuICAgIHJldHVybiAoJycgK1xyXG4gICAgLy8gSW50ZWdlciBwYXJ0IChubyBkZWNpbWFscylcclxuICAgICAgICBNYXRoLmZsb29yKHYpICtcclxuICAgIC8vIERlY2ltYWwgc2VwYXJhdG9yIGRlcGVuZGluZyBvbiBsb2NhbGVcclxuICAgICAgICBpMThuLm51bWVyaWNEZWNpbWFsU2VwYXJhdG9yW2N1bHR1cmVdICtcclxuICAgIC8vIERlY2ltYWxzLCBldmVyIHR3byBkaWdpdHNcclxuICAgICAgICBNYXRoLmZsb29yKHJlc3QgLyAxMCkgKyByZXN0ICUgMTBcclxuICAgICk7XHJcbn1cclxuZnVuY3Rpb24gbnVtYmVyVG9Nb25leVN0cmluZyh2KSB7XHJcbiAgICB2YXIgY291bnRyeSA9IGkxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jb3VudHJ5O1xyXG4gICAgLy8gVHdvIGRpZ2l0cyBpbiBkZWNpbWFscyBmb3Igcm91bmRlZCB2YWx1ZSB3aXRoIG1vbmV5IHN5bWJvbCBhcyBmb3JcclxuICAgIC8vIGN1cnJlbnQgbG9jYWxlXHJcbiAgICByZXR1cm4gKGkxOG4ubW9uZXlTeW1ib2xQcmVmaXhbY291bnRyeV0gKyBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nKHYpICsgaTE4bi5tb25leVN5bWJvbFN1Zml4W2NvdW50cnldKTtcclxufVxyXG5mdW5jdGlvbiBzZXRNb25leU51bWJlcih2LCBlbCkge1xyXG4gICAgLy8gR2V0IHZhbHVlIGluIG1vbmV5IGZvcm1hdDpcclxuICAgIHYgPSBudW1iZXJUb01vbmV5U3RyaW5nKHYpO1xyXG4gICAgLy8gU2V0dGluZyB2YWx1ZTpcclxuICAgIGlmIChlbCBpbnN0YW5jZW9mIGpRdWVyeSlcclxuICAgICAgICBpZiAoZWwuaXMoJzppbnB1dCcpKVxyXG4gICAgICAgICAgICBlbC52YWwodik7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBlbC50ZXh0KHYpO1xyXG4gICAgcmV0dXJuIHY7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGdldE1vbmV5TnVtYmVyOiBnZXRNb25leU51bWJlcixcclxuICAgICAgICBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nOiBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nLFxyXG4gICAgICAgIG51bWJlclRvTW9uZXlTdHJpbmc6IG51bWJlclRvTW9uZXlTdHJpbmcsXHJcbiAgICAgICAgc2V0TW9uZXlOdW1iZXI6IHNldE1vbmV5TnVtYmVyXHJcbiAgICB9OyIsIi8qKlxyXG4qIFBsYWNlaG9sZGVyIHBvbHlmaWxsLlxyXG4qIEFkZHMgYSBuZXcgalF1ZXJ5IHBsYWNlSG9sZGVyIG1ldGhvZCB0byBzZXR1cCBvciByZWFwcGx5IHBsYWNlSG9sZGVyXHJcbiogb24gZWxlbWVudHMgKHJlY29tbWVudGVkIHRvIGJlIGFwcGx5IG9ubHkgdG8gc2VsZWN0b3IgJ1twbGFjZWhvbGRlcl0nKTtcclxuKiB0aGF0cyBtZXRob2QgaXMgZmFrZSBvbiBicm93c2VycyB0aGF0IGhhcyBuYXRpdmUgc3VwcG9ydCBmb3IgcGxhY2Vob2xkZXJcclxuKiovXHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRQbGFjZUhvbGRlcnMoKSB7XHJcbiAgICBpZiAoTW9kZXJuaXpyLmlucHV0LnBsYWNlaG9sZGVyKVxyXG4gICAgICAgICQuZm4ucGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoKSB7IH07XHJcbiAgICBlbHNlXHJcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZG9QbGFjZWhvbGRlcigpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoISR0LmRhdGEoJ3BsYWNlaG9sZGVyLXN1cHBvcnRlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQub24oJ2ZvY3VzaW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlID09IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICR0Lm9uKCdmb2N1c291dCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkdC5kYXRhKCdwbGFjZWhvbGRlci1zdXBwb3J0ZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQuZm4ucGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGRvUGxhY2Vob2xkZXIpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAkKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICAgICAgJChkb2N1bWVudCkuYWpheENvbXBsZXRlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSgpO1xyXG59OyIsIi8qIFBvcHVwIGZ1bmN0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxucmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKipcclxuKiBQb3B1cCByZWxhdGVkIFxyXG4qIGZ1bmN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBwb3B1cFNpemUoc2l6ZSkge1xyXG4gICAgdmFyIHMgPSAoc2l6ZSA9PSAnbGFyZ2UnID8gMC44IDogKHNpemUgPT0gJ21lZGl1bScgPyAwLjUgOiAoc2l6ZSA9PSAnc21hbGwnID8gMC4yIDogc2l6ZSB8fCAwLjUpKSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKCQod2luZG93KS53aWR0aCgpICogcyksXHJcbiAgICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKCQod2luZG93KS5oZWlnaHQoKSAqIHMpLFxyXG4gICAgICAgIHNpemVGYWN0b3I6IHNcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gcG9wdXBTdHlsZShzaXplKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGN1cnNvcjogJ2RlZmF1bHQnLFxyXG4gICAgICAgIHdpZHRoOiBzaXplLndpZHRoICsgJ3B4JyxcclxuICAgICAgICBsZWZ0OiBNYXRoLnJvdW5kKCgkKHdpbmRvdykud2lkdGgoKSAtIHNpemUud2lkdGgpIC8gMikgLSAyNSArICdweCcsXHJcbiAgICAgICAgaGVpZ2h0OiBzaXplLmhlaWdodCArICdweCcsXHJcbiAgICAgICAgdG9wOiBNYXRoLnJvdW5kKCgkKHdpbmRvdykuaGVpZ2h0KCkgLSBzaXplLmhlaWdodCkgLyAyKSAtIDMyICsgJ3B4JyxcclxuICAgICAgICBwYWRkaW5nOiAnMzRweCAyNXB4IDMwcHgnLFxyXG4gICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgYm9yZGVyOiAnbm9uZScsXHJcbiAgICAgICAgJy1tb3otYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmcnLFxyXG4gICAgICAgICctd2Via2l0LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nLWJveCcsXHJcbiAgICAgICAgJ2JhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nLWJveCdcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gcG9wdXAodXJsLCBzaXplLCBjb21wbGV0ZSwgbG9hZGluZ1RleHQsIG9wdGlvbnMpIHtcclxuICAgIGlmICh0eXBlb2YgKHVybCkgPT09ICdvYmplY3QnKVxyXG4gICAgICAgIG9wdGlvbnMgPSB1cmw7XHJcblxyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIHVybDogdHlwZW9mICh1cmwpID09PSAnc3RyaW5nJyA/IHVybCA6ICcnLFxyXG4gICAgICAgIHNpemU6IHNpemUgfHwgeyB3aWR0aDogMCwgaGVpZ2h0OiAwIH0sXHJcbiAgICAgICAgY29tcGxldGU6IGNvbXBsZXRlLFxyXG4gICAgICAgIGxvYWRpbmdUZXh0OiBsb2FkaW5nVGV4dCxcclxuICAgICAgICBjbG9zYWJsZToge1xyXG4gICAgICAgICAgICBvbkxvYWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBhZnRlckxvYWQ6IHRydWUsXHJcbiAgICAgICAgICAgIG9uRXJyb3I6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9TaXplOiBmYWxzZSxcclxuICAgICAgICBjb250YWluZXJDbGFzczogJycsXHJcbiAgICAgICAgYXV0b0ZvY3VzOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBQcmVwYXJlIHNpemUgYW5kIGxvYWRpbmdcclxuICAgIG9wdGlvbnMubG9hZGluZ1RleHQgPSBvcHRpb25zLmxvYWRpbmdUZXh0IHx8ICcnO1xyXG4gICAgaWYgKHR5cGVvZiAob3B0aW9ucy5zaXplLndpZHRoKSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgb3B0aW9ucy5zaXplID0gcG9wdXBTaXplKG9wdGlvbnMuc2l6ZSk7XHJcblxyXG4gICAgJC5ibG9ja1VJKHtcclxuICAgICAgICBtZXNzYWdlOiAob3B0aW9ucy5jbG9zYWJsZS5vbkxvYWQgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgK1xyXG4gICAgICAgJzxpbWcgc3JjPVwiJyArIExjVXJsLkFwcFBhdGggKyAnaW1nL3RoZW1lL2xvYWRpbmcuZ2lmXCIvPicgKyBvcHRpb25zLmxvYWRpbmdUZXh0LFxyXG4gICAgICAgIGNlbnRlclk6IGZhbHNlLFxyXG4gICAgICAgIGNzczogcG9wdXBTdHlsZShvcHRpb25zLnNpemUpLFxyXG4gICAgICAgIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfSxcclxuICAgICAgICBmb2N1c0lucHV0OiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMb2FkaW5nIFVybCB3aXRoIEFqYXggYW5kIHBsYWNlIGNvbnRlbnQgaW5zaWRlIHRoZSBibG9ja2VkLWJveFxyXG4gICAgJC5hamF4KHtcclxuICAgICAgICB1cmw6IG9wdGlvbnMudXJsLFxyXG4gICAgICAgIGNvbnRleHQ6IHtcclxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgICAgICAgY29udGFpbmVyOiAkKCcuYmxvY2tNc2cnKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyLmFkZENsYXNzKG9wdGlvbnMuY29udGFpbmVyQ2xhc3MpO1xyXG4gICAgICAgICAgICAvLyBBZGQgY2xvc2UgYnV0dG9uIGlmIHJlcXVpcmVzIGl0IG9yIGVtcHR5IG1lc3NhZ2UgY29udGVudCB0byBhcHBlbmQgdGhlbiBtb3JlXHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5odG1sKG9wdGlvbnMuY2xvc2FibGUuYWZ0ZXJMb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpO1xyXG4gICAgICAgICAgICB2YXIgY29udGVudEhvbGRlciA9IGNvbnRhaW5lci5hcHBlbmQoJzxkaXYgY2xhc3M9XCJjb250ZW50XCIvPicpLmNoaWxkcmVuKCcuY29udGVudCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGF0YSkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5Db2RlICYmIGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCBjb2RlLCBzaG93IHJlc3VsdFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuYXBwZW5kKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFBhZ2UgY29udGVudCBnb3QsIHBhc3RlIGludG8gdGhlIHBvcHVwIGlmIGlzIHBhcnRpYWwgaHRtbCAodXJsIHN0YXJ0cyB3aXRoICQpXHJcbiAgICAgICAgICAgICAgICBpZiAoLygoXlxcJCl8KFxcL1xcJCkpLy50ZXN0KG9wdGlvbnMudXJsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuYXBwZW5kKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9Gb2N1cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEhvbGRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b1NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXZvaWQgbWlzY2FsY3VsYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2V2lkdGggPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnd2lkdGgnLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldkhlaWdodCA9IGNvbnRlbnRIb2xkZXJbMF0uc3R5bGUuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IGRhdGFcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbFdpZHRoID0gY29udGVudEhvbGRlclswXS5zY3JvbGxXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbEhlaWdodCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udFdpZHRoID0gY29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250SGVpZ2h0ID0gY29udGFpbmVyLmhlaWdodCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFXaWR0aCA9IGNvbnRhaW5lci5vdXRlcldpZHRoKHRydWUpIC0gY29udFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFIZWlnaHQgPSBjb250YWluZXIub3V0ZXJIZWlnaHQodHJ1ZSkgLSBjb250SGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggPSAkKHdpbmRvdykud2lkdGgoKSAtIGV4dHJhV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSBleHRyYUhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGFuZCBhcHBseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBhY3R1YWxXaWR0aCA+IG1heFdpZHRoID8gbWF4V2lkdGggOiBhY3R1YWxXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYWN0dWFsSGVpZ2h0ID4gbWF4SGVpZ2h0ID8gbWF4SGVpZ2h0IDogYWN0dWFsSGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hbmltYXRlKHNpemUsIDMwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IG1pc2NhbGN1bGF0aW9ucyBjb3JyZWN0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnd2lkdGgnLCBwcmV2V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnaGVpZ2h0JywgcHJldkhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBFbHNlLCBpZiB1cmwgaXMgYSBmdWxsIGh0bWwgcGFnZSAobm9ybWFsIHBhZ2UpLCBwdXQgY29udGVudCBpbnRvIGFuIGlmcmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoZGF0YSwgdGhpcy5vcHRpb25zLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBibG9ja2luZyBlbGVtZW50IGNvbnRlbnQgKHRoZSBsb2FkaW5nKSB3aXRoIHRoZSBpZnJhbWU6XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCBlcnJvcjogZnVuY3Rpb24gKGosIHQsIGV4KSB7XHJcbiAgICAgICAgICAgICQoJ2Rpdi5ibG9ja01zZycpLmh0bWwoKG9wdGlvbnMuY2xvc2FibGUub25FcnJvciA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKSArICc8ZGl2IGNsYXNzPVwiY29udGVudFwiPlBhZ2Ugbm90IGZvdW5kPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuaW5mbykgY29uc29sZS5pbmZvKFwiUG9wdXAtYWpheCBlcnJvcjogXCIgKyBleCk7XHJcbiAgICAgICAgfSwgY29tcGxldGU6IG9wdGlvbnMuY29tcGxldGVcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciByZXR1cm5lZEJsb2NrID0gJCgnLmJsb2NrVUknKTtcclxuXHJcbiAgICByZXR1cm5lZEJsb2NrLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgIHJldHVybmVkQmxvY2sudHJpZ2dlcigncG9wdXAtY2xvc2VkJyk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm5lZEJsb2NrLmNsb3NlUG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRCbG9ja0VsZW1lbnQgPSBmdW5jdGlvbiBnZXRCbG9ja0VsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbHRlcignLmJsb2NrTXNnJyk7IH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldENvbnRlbnRFbGVtZW50ID0gZnVuY3Rpb24gZ2V0Q29udGVudEVsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbmQoJy5jb250ZW50Jyk7IH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldE92ZXJsYXlFbGVtZW50ID0gZnVuY3Rpb24gZ2V0T3ZlcmxheUVsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbHRlcignLmJsb2NrT3ZlcmxheScpOyB9O1xyXG4gICAgcmV0dXJuIHJldHVybmVkQmxvY2s7XHJcbn1cclxuXHJcbi8qIFNvbWUgcG9wdXAgdXRpbGl0aXRlcy9zaG9ydGhhbmRzICovXHJcbmZ1bmN0aW9uIG1lc3NhZ2VQb3B1cChtZXNzYWdlLCBjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8ICdib2R5Jyk7XHJcbiAgICB2YXIgY29udGVudCA9ICQoJzxkaXYvPicpLnRleHQobWVzc2FnZSk7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGNvbnRhaW5lciwgJ21lc3NhZ2UtcG9wdXAgZnVsbC1ibG9jaycsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSwgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29ubmVjdFBvcHVwQWN0aW9uKGFwcGx5VG9TZWxlY3Rvcikge1xyXG4gICAgYXBwbHlUb1NlbGVjdG9yID0gYXBwbHlUb1NlbGVjdG9yIHx8ICcucG9wdXAtYWN0aW9uJztcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIGFwcGx5VG9TZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjID0gJCgkKHRoaXMpLmF0dHIoJ2hyZWYnKSkuY2xvbmUoKTtcclxuICAgICAgICBpZiAoYy5sZW5ndGggPT0gMSlcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihjLCBkb2N1bWVudCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiB0cnVlIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vLyBUaGUgcG9wdXAgZnVuY3Rpb24gY29udGFpbnMgYWxsIHRoZSBvdGhlcnMgYXMgbWV0aG9kc1xyXG5wb3B1cC5zaXplID0gcG9wdXBTaXplO1xyXG5wb3B1cC5zdHlsZSA9IHBvcHVwU3R5bGU7XHJcbnBvcHVwLmNvbm5lY3RBY3Rpb24gPSBjb25uZWN0UG9wdXBBY3Rpb247XHJcbnBvcHVwLm1lc3NhZ2UgPSBtZXNzYWdlUG9wdXA7XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwb3B1cDsiLCIvKioqKiBQb3N0YWwgQ29kZTogb24gZmx5LCBzZXJ2ZXItc2lkZSB2YWxpZGF0aW9uICoqKioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgYmFzZVVybDogJy8nLFxyXG4gICAgICAgIHNlbGVjdG9yOiAnW2RhdGEtdmFsLXBvc3RhbGNvZGVdJyxcclxuICAgICAgICB1cmw6ICdKU09OL1ZhbGlkYXRlUG9zdGFsQ29kZS8nXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgb3B0aW9ucy5zZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gSWYgY29udGFpbnMgYSB2YWx1ZSAodGhpcyBub3QgdmFsaWRhdGUgaWYgaXMgcmVxdWlyZWQpIGFuZCBcclxuICAgICAgICAvLyBoYXMgdGhlIGVycm9yIGRlc2NyaXB0aXZlIG1lc3NhZ2UsIHZhbGlkYXRlIHRocm91Z2ggYWpheFxyXG4gICAgICAgIHZhciBwYyA9ICR0LnZhbCgpO1xyXG4gICAgICAgIHZhciBtc2cgPSAkdC5kYXRhKCd2YWwtcG9zdGFsY29kZScpO1xyXG4gICAgICAgIGlmIChwYyAmJiBtc2cpIHtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogb3B0aW9ucy5iYXNlVXJsICsgb3B0aW9ucy51cmwsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7IFBvc3RhbENvZGU6IHBjIH0sXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnSlNPTicsXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuUmVzdWx0LklzVmFsaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZGF0aW9uLWVycm9yJykuYWRkQ2xhc3MoJ3ZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5zaWJsaW5ncygnLmZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGV4dCgnJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFuIHN1bW1hcnkgZXJyb3JzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCc+IHVsID4gbGknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQodGhpcykudGV4dCgpID09IG1zZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFcnJvciBsYWJlbCAoaWYgdGhlcmUgaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnW2RhdGEtdmFsbXNnLWZvcj0nICsgJHQuYXR0cignbmFtZScpICsgJ10nKS50ZXh0KCcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdpbnB1dC12YWxpZGF0aW9uLWVycm9yJykucmVtb3ZlQ2xhc3MoJ3ZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5zaWJsaW5ncygnLmZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8c3BhbiBmb3I9XCInICsgJHQuYXR0cignbmFtZScpICsgJ1wiIGdlbmVyYXRlZD1cInRydWVcIj4nICsgbXNnICsgJzwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBzdW1tYXJ5IGVycm9yIChpZiB0aGVyZSBpcyBub3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNoaWxkcmVuKCd1bCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGxpPicgKyBtc2cgKyAnPC9saT4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVycm9yIGxhYmVsIChpZiB0aGVyZSBpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCdbZGF0YS12YWxtc2ctZm9yPScgKyAkdC5hdHRyKCduYW1lJykgKyAnXScpLnRleHQobXNnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGxhYmVsIGlzIG5vdCB2aXNpYmxlLCBqdXN0IHJlbW92ZSB0aGUgYmFkIGNvZGUgdG8gbGV0IHVzZXIgc2VlIHRoZSBwbGFjZWhvbGRlciAjNTE0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgJGxhYmVsID0gJHQuY2xvc2VzdCgnbGFiZWwnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJGxhYmVsLmxlbmd0aCAmJiAkdC5hdHRyKCdpZCcpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRsYWJlbCA9ICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCdsYWJlbFtmb3I9JyArICR0LmF0dHIoJ2lkJykgKyAnXScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkbGFiZWwuaXMoJzp2aXNpYmxlJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQudmFsKCcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTsiLCIvKiogQXBwbHkgZXZlciBhIHJlZGlyZWN0IHRvIHRoZSBnaXZlbiBVUkwsIGlmIHRoaXMgaXMgYW4gaW50ZXJuYWwgVVJMIG9yIHNhbWVcclxucGFnZSwgaXQgZm9yY2VzIGEgcGFnZSByZWxvYWQgZm9yIHRoZSBnaXZlbiBVUkwuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByZWRpcmVjdFRvKHVybCkge1xyXG4gICAgLy8gQmxvY2sgdG8gYXZvaWQgbW9yZSB1c2VyIGludGVyYWN0aW9uczpcclxuICAgICQuYmxvY2tVSSh7IG1lc3NhZ2U6ICcnIH0pOyAvL2xvYWRpbmdCbG9jayk7XHJcbiAgICAvLyBDaGVja2luZyBpZiBpcyBiZWluZyByZWRpcmVjdGluZyBvciBub3RcclxuICAgIHZhciByZWRpcmVjdGVkID0gZmFsc2U7XHJcbiAgICAkKHdpbmRvdykub24oJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uIGNoZWNrUmVkaXJlY3QoKSB7XHJcbiAgICAgICAgcmVkaXJlY3RlZCA9IHRydWU7XHJcbiAgICB9KTtcclxuICAgIC8vIE5hdmlnYXRlIHRvIG5ldyBsb2NhdGlvbjpcclxuICAgIHdpbmRvdy5sb2NhdGlvbiA9IHVybDtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIElmIHBhZ2Ugbm90IGNoYW5nZWQgKHNhbWUgdXJsIG9yIGludGVybmFsIGxpbmspLCBwYWdlIGNvbnRpbnVlIGV4ZWN1dGluZyB0aGVuIHJlZnJlc2g6XHJcbiAgICAgICAgaWYgKCFyZWRpcmVjdGVkKVxyXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICB9LCA1MCk7XHJcbn07XHJcbiIsIi8qKiBTYW5pdGl6ZSB0aGUgd2hpdGVzcGFjZXMgaW4gYSB0ZXh0IGJ5OlxyXG4tIHJlcGxhY2luZyBjb250aWd1b3VzIHdoaXRlc3BhY2VzIGNoYXJhY3RlcmVzIChhbnkgbnVtYmVyIG9mIHJlcGV0aXRpb24gXHJcbmFuZCBhbnkga2luZCBvZiB3aGl0ZSBjaGFyYWN0ZXIpIGJ5IGEgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbi0gcmVwbGFjZSBlbmNvZGVkIG5vbi1icmVha2luZy1zcGFjZXMgYnkgYSBub3JtYWwgd2hpdGUtc3BhY2VcclxuLSByZW1vdmUgc3RhcnRpbmcgYW5kIGVuZGluZyB3aGl0ZS1zcGFjZXNcclxuLSBldmVyIHJldHVybiBhIHN0cmluZywgZW1wdHkgd2hlbiBudWxsXHJcbioqL1xyXG5mdW5jdGlvbiBzYW5pdGl6ZVdoaXRlc3BhY2VzKHRleHQpIHtcclxuICAgIC8vIEV2ZXIgcmV0dXJuIGEgc3RyaW5nLCBlbXB0eSB3aGVuIG51bGxcclxuICAgIHRleHQgPSAodGV4dCB8fCAnJylcclxuICAgIC8vIFJlcGxhY2UgYW55IGtpbmQgb2YgY29udGlndW91cyB3aGl0ZXNwYWNlcyBjaGFyYWN0ZXJzIGJ5IGEgc2luZ2xlIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4gICAgLy8gKHRoYXRzIGluY2x1ZGUgcmVwbGFjZSBlbmNvbmRlZCBub24tYnJlYWtpbmctc3BhY2VzLFxyXG4gICAgLy8gYW5kIGR1cGxpY2F0ZWQtcmVwZWF0ZWQgYXBwZWFyYW5jZXMpXHJcbiAgICAucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xyXG4gICAgLy8gUmVtb3ZlIHN0YXJ0aW5nIGFuZCBlbmRpbmcgd2hpdGVzcGFjZXNcclxuICAgIHJldHVybiAkLnRyaW0odGV4dCk7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHNhbml0aXplV2hpdGVzcGFjZXM7IiwiLyoqIEN1c3RvbSBMb2Nvbm9taWNzICdsaWtlIGJsb2NrVUknIHBvcHVwc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSxcclxuICAgIGF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4vYXV0b0ZvY3VzJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxuXHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrKGNvbnRlbnRCb3gsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7XHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgY2xvc2FibGU6IGZhbHNlLFxyXG4gICAgICAgIGNlbnRlcjogZmFsc2UsXHJcbiAgICAgICAgLyogYXMgYSB2YWxpZCBvcHRpb25zIHBhcmFtZXRlciBmb3IgTEMuaGlkZUVsZW1lbnQgZnVuY3Rpb24gKi9cclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZHVyYXRpb246IDYwMCxcclxuICAgICAgICAgICAgZWZmZWN0OiAnZmFkZSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgICAgICBhdXRvZm9jdXNPcHRpb25zOiB7IG1hcmdpblRvcDogNjAgfSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBjb250ZW50Qm94ID0gJChjb250ZW50Qm94KTtcclxuICAgIHZhciBmdWxsID0gZmFsc2U7XHJcbiAgICBpZiAoYmxvY2tlZCA9PSBkb2N1bWVudCB8fCBibG9ja2VkID09IHdpbmRvdykge1xyXG4gICAgICAgIGJsb2NrZWQgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgZnVsbCA9IHRydWU7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBibG9ja2VkID0gJChibG9ja2VkKTtcclxuXHJcbiAgICB2YXIgYm94SW5zaWRlQmxvY2tlZCA9ICFibG9ja2VkLmlzKCdib2R5LHRyLHRoZWFkLHRib2R5LHRmb290LHRhYmxlLHVsLG9sLGRsJyk7XHJcblxyXG4gICAgLy8gR2V0dGluZyBib3ggZWxlbWVudCBpZiBleGlzdHMgYW5kIHJlZmVyZW5jaW5nXHJcbiAgICB2YXIgYklEID0gYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJyk7XHJcbiAgICBpZiAoIWJJRClcclxuICAgICAgICBiSUQgPSAoY29udGVudEJveC5hdHRyKCdpZCcpIHx8ICcnKSArIChibG9ja2VkLmF0dHIoJ2lkJykgfHwgJycpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICBpZiAoYklEID09ICctc21vb3RoQm94QmxvY2snKSB7XHJcbiAgICAgICAgYklEID0gJ2lkLScgKyBndWlkR2VuZXJhdG9yKCkgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIH1cclxuICAgIGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcsIGJJRCk7XHJcbiAgICB2YXIgYm94ID0gJCgnIycgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGJJRCkpO1xyXG4gICAgXHJcbiAgICAvLyBIaWRpbmcvY2xvc2luZyBib3g6XHJcbiAgICBpZiAoY29udGVudEJveC5sZW5ndGggPT09IDApIHtcclxuXHJcbiAgICAgICAgYm94LnhoaWRlKG9wdGlvbnMuY2xvc2VPcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gUmVzdG9yaW5nIHRoZSBDU1MgcG9zaXRpb24gYXR0cmlidXRlIG9mIHRoZSBibG9ja2VkIGVsZW1lbnRcclxuICAgICAgICAvLyB0byBhdm9pZCBzb21lIHByb2JsZW1zIHdpdGggbGF5b3V0IG9uIHNvbWUgZWRnZSBjYXNlcyBhbG1vc3RcclxuICAgICAgICAvLyB0aGF0IG1heSBiZSBub3QgYSBwcm9ibGVtIGR1cmluZyBibG9ja2luZyBidXQgd2hlbiB1bmJsb2NrZWQuXHJcbiAgICAgICAgdmFyIHByZXYgPSBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nKTtcclxuICAgICAgICBibG9ja2VkLmNzcygncG9zaXRpb24nLCBwcmV2IHx8ICcnKTtcclxuICAgICAgICBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nLCBudWxsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBib3hjO1xyXG4gICAgaWYgKGJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3hjID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stZWxlbWVudFwiLz4nKTtcclxuICAgICAgICBib3ggPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1vdmVybGF5XCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgYm94LmFkZENsYXNzKGFkZGNsYXNzKTtcclxuICAgICAgICBpZiAoZnVsbCkgYm94LmFkZENsYXNzKCdmdWxsLWJsb2NrJyk7XHJcbiAgICAgICAgYm94LmFwcGVuZChib3hjKTtcclxuICAgICAgICBib3guYXR0cignaWQnLCBiSUQpO1xyXG4gICAgICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKVxyXG4gICAgICAgICAgICBibG9ja2VkLmFwcGVuZChib3gpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZChib3gpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBib3hjID0gYm94LmNoaWxkcmVuKCcuc21vb3RoLWJveC1ibG9jay1lbGVtZW50Jyk7XHJcbiAgICB9XHJcbiAgICAvLyBIaWRkZW4gZm9yIHVzZXIsIGJ1dCBhdmFpbGFibGUgdG8gY29tcHV0ZTpcclxuICAgIGNvbnRlbnRCb3guc2hvdygpO1xyXG4gICAgYm94LnNob3coKS5jc3MoJ29wYWNpdHknLCAwKTtcclxuICAgIC8vIFNldHRpbmcgdXAgdGhlIGJveCBhbmQgc3R5bGVzLlxyXG4gICAgYm94Yy5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgaWYgKG9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAgYm94Yy5hcHBlbmQoJCgnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cCBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nKSk7XHJcbiAgICBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnLCBvcHRpb25zKTtcclxuICAgIGlmICghYm94Yy5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJykpXHJcbiAgICAgIGJveGNcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIG51bGwsIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJywgdHJ1ZSk7XHJcbiAgICBib3hjLmFwcGVuZChjb250ZW50Qm94KTtcclxuICAgIGJveGMud2lkdGgob3B0aW9ucy53aWR0aCk7XHJcbiAgICBib3guY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgaWYgKGJveEluc2lkZUJsb2NrZWQpIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBpbnNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudDpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgYmxvY2tlZC5jc3MoJ3otaW5kZXgnKSArIDEwKTtcclxuICAgICAgICBpZiAoIWJsb2NrZWQuY3NzKCdwb3NpdGlvbicpIHx8IGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpID09ICdzdGF0aWMnKSB7XHJcbiAgICAgICAgICAgIGJsb2NrZWQuZGF0YSgnc2JiLXByZXZpb3VzLWNzcy1wb3NpdGlvbicsIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpKTtcclxuICAgICAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vb2ZmcyA9IGJsb2NrZWQucG9zaXRpb24oKTtcclxuICAgICAgICBib3guY3NzKCd0b3AnLCAwKTtcclxuICAgICAgICBib3guY3NzKCdsZWZ0JywgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIG91dHNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudCwgYXMgYSBkaXJlY3QgY2hpbGQgb2YgQm9keTpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgTWF0aC5mbG9vcihOdW1iZXIuTUFYX1ZBTFVFKSk7XHJcbiAgICAgICAgYm94LmNzcyhibG9ja2VkLm9mZnNldCgpKTtcclxuICAgIH1cclxuICAgIC8vIERpbWVuc2lvbnMgbXVzdCBiZSBjYWxjdWxhdGVkIGFmdGVyIGJlaW5nIGFwcGVuZGVkIGFuZCBwb3NpdGlvbiB0eXBlIGJlaW5nIHNldDpcclxuICAgIGJveC53aWR0aChibG9ja2VkLm91dGVyV2lkdGgoKSk7XHJcbiAgICBib3guaGVpZ2h0KGJsb2NrZWQub3V0ZXJIZWlnaHQoKSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuY2VudGVyKSB7XHJcbiAgICAgICAgYm94Yy5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICAgICAgdmFyIGNsLCBjdDtcclxuICAgICAgICBpZiAoZnVsbCkge1xyXG4gICAgICAgICAgICBjdCA9IHNjcmVlbi5oZWlnaHQgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IHNjcmVlbi53aWR0aCAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3QgPSBib3gub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IGJveC5vdXRlcldpZHRoKHRydWUpIC8gMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2VudGVyID09PSB0cnVlIHx8IG9wdGlvbnMuY2VudGVyID09PSAndmVydGljYWwnKVxyXG4gICAgICAgICAgICBib3hjLmNzcygndG9wJywgY3QgLSBib3hjLm91dGVySGVpZ2h0KHRydWUpIC8gMik7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2VudGVyID09PSB0cnVlIHx8IG9wdGlvbnMuY2VudGVyID09PSAnaG9yaXpvbnRhbCcpXHJcbiAgICAgICAgICAgIGJveGMuY3NzKCdsZWZ0JywgY2wgLSBib3hjLm91dGVyV2lkdGgodHJ1ZSkgLyAyKTtcclxuICAgIH1cclxuICAgIC8vIExhc3Qgc2V0dXBcclxuICAgIGF1dG9Gb2N1cyhib3gpO1xyXG4gICAgLy8gU2hvdyBibG9ja1xyXG4gICAgYm94LmFuaW1hdGUoeyBvcGFjaXR5OiAxIH0sIDMwMCk7XHJcbiAgICBpZiAob3B0aW9ucy5hdXRvZm9jdXMpXHJcbiAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEJveCwgb3B0aW9ucy5hdXRvZm9jdXNPcHRpb25zKTtcclxuICAgIHJldHVybiBib3g7XHJcbn1cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2tDbG9zZUFsbChjb250YWluZXIpIHtcclxuICAgICQoY29udGFpbmVyIHx8IGRvY3VtZW50KS5maW5kKCcuc21vb3RoLWJveC1ibG9jay1vdmVybGF5JykuaGlkZSgpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb3Blbjogc21vb3RoQm94QmxvY2ssXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKTsgfSxcclxuICAgICAgICBjbG9zZUFsbDogc21vb3RoQm94QmxvY2tDbG9zZUFsbFxyXG4gICAgfTsiLCIvKipcclxuKiogTW9kdWxlOjogdG9vbHRpcHNcclxuKiogQ3JlYXRlcyBzbWFydCB0b29sdGlwcyB3aXRoIHBvc3NpYmlsaXRpZXMgZm9yIG9uIGhvdmVyIGFuZCBvbiBjbGljayxcclxuKiogYWRkaXRpb25hbCBkZXNjcmlwdGlvbiBvciBleHRlcm5hbCB0b29sdGlwIGNvbnRlbnQuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc2FuaXRpemVXaGl0ZXNwYWNlcyA9IHJlcXVpcmUoJy4vc2FuaXRpemVXaGl0ZXNwYWNlcycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5vdXRlckh0bWwnKTtcclxucmVxdWlyZSgnLi9qcXVlcnkuaXNDaGlsZE9mJyk7XHJcblxyXG4vLyBNYWluIGludGVybmFsIHByb3BlcnRpZXNcclxudmFyIHBvc29mZnNldCA9IHsgeDogMTYsIHk6IDggfTtcclxudmFyIHNlbGVjdG9yID0gJ1t0aXRsZV1bZGF0YS1kZXNjcmlwdGlvbl0sIFt0aXRsZV0uaGFzLXRvb2x0aXAsIFt0aXRsZV0uc2VjdXJlLWRhdGEsIFtkYXRhLXRvb2x0aXAtdXJsXSwgW3RpdGxlXS5oYXMtcG9wdXAtdG9vbHRpcCc7XHJcblxyXG4vKiogUG9zaXRpb25hdGUgdGhlIHRvb2x0aXAgZGVwZW5kaW5nIG9uIHRoZVxyXG5ldmVudCBvciB0aGUgdGFyZ2V0IGVsZW1lbnQgcG9zaXRpb24gYW5kIGFuIG9mZnNldFxyXG4qKi9cclxuZnVuY3Rpb24gcG9zKHQsIGUsIGwpIHtcclxuICAgIHZhciB4LCB5O1xyXG4gICAgaWYgKGUucGFnZVggJiYgZS5wYWdlWSkge1xyXG4gICAgICAgIHggPSBlLnBhZ2VYO1xyXG4gICAgICAgIHkgPSBlLnBhZ2VZO1xyXG4gICAgfSBlbHNlIGlmIChlLnRhcmdldCkge1xyXG4gICAgICAgIHZhciAkZXQgPSAkKGUudGFyZ2V0KTtcclxuICAgICAgICB4ID0gJGV0Lm91dGVyV2lkdGgoKSArICRldC5vZmZzZXQoKS5sZWZ0O1xyXG4gICAgICAgIHkgPSAkZXQub3V0ZXJIZWlnaHQoKSArICRldC5vZmZzZXQoKS50b3A7XHJcbiAgICB9XHJcbiAgICB0LmNzcygnbGVmdCcsIHggKyBwb3NvZmZzZXQueCk7XHJcbiAgICB0LmNzcygndG9wJywgeSArIHBvc29mZnNldC55KTtcclxuICAgIC8vIEFkanVzdCB3aWR0aCB0byB2aXNpYmxlIHZpZXdwb3J0XHJcbiAgICB2YXIgdGRpZiA9IHQub3V0ZXJXaWR0aCgpIC0gdC53aWR0aCgpO1xyXG4gICAgdC5jc3MoJ21heC13aWR0aCcsICQod2luZG93KS53aWR0aCgpIC0geCAtIHBvc29mZnNldC54IC0gdGRpZik7XHJcbiAgICAvL3QuaGVpZ2h0KCQoZG9jdW1lbnQpLmhlaWdodCgpIC0geSAtIHBvc29mZnNldC55KTtcclxufVxyXG4vKiogR2V0IG9yIGNyZWF0ZSwgYW5kIHJldHVybnMsIHRoZSB0b29sdGlwIGNvbnRlbnQgZm9yIHRoZSBlbGVtZW50XHJcbioqL1xyXG5mdW5jdGlvbiBjb24obCkge1xyXG4gICAgaWYgKGwubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciBjID0gbC5kYXRhKCd0b29sdGlwLWNvbnRlbnQnKSxcclxuICAgICAgICBwZXJzaXN0ZW50ID0gbC5kYXRhKCdwZXJzaXN0ZW50LXRvb2x0aXAnKTtcclxuICAgIGlmICghYykge1xyXG4gICAgICAgIHZhciBoID0gc2FuaXRpemVXaGl0ZXNwYWNlcyhsLmF0dHIoJ3RpdGxlJykpO1xyXG4gICAgICAgIHZhciBkID0gc2FuaXRpemVXaGl0ZXNwYWNlcyhsLmRhdGEoJ2Rlc2NyaXB0aW9uJykpO1xyXG4gICAgICAgIGlmIChkKVxyXG4gICAgICAgICAgICBjID0gJzxoND4nICsgaCArICc8L2g0PjxwPicgKyBkICsgJzwvcD4nO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgYyA9IGg7XHJcbiAgICAgICAgLy8gQXBwZW5kIGRhdGEtdG9vbHRpcC11cmwgY29udGVudCBpZiBleGlzdHNcclxuICAgICAgICB2YXIgdXJsY29udGVudCA9ICQobC5kYXRhKCd0b29sdGlwLXVybCcpKTtcclxuICAgICAgICBjID0gKGMgfHwgJycpICsgdXJsY29udGVudC5vdXRlckh0bWwoKTtcclxuICAgICAgICAvLyBSZW1vdmUgb3JpZ2luYWwsIGlzIG5vIG1vcmUgbmVlZCBhbmQgYXZvaWQgaWQtY29uZmxpY3RzXHJcbiAgICAgICAgdXJsY29udGVudC5yZW1vdmUoKTtcclxuICAgICAgICAvLyBTYXZlIHRvb2x0aXAgY29udGVudFxyXG4gICAgICAgIGwuZGF0YSgndG9vbHRpcC1jb250ZW50JywgYyk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGJyb3dzZXIgdG9vbHRpcCAoYm90aCB3aGVuIHdlIGFyZSB1c2luZyBvdXIgb3duIHRvb2x0aXAgYW5kIHdoZW4gbm8gdG9vbHRpcFxyXG4gICAgICAgIC8vIGlzIG5lZWQpXHJcbiAgICAgICAgbC5hdHRyKCd0aXRsZScsICcnKTtcclxuICAgIH1cclxuICAgIC8vIFJlbW92ZSB0b29sdGlwIGNvbnRlbnQgKGJ1dCBwcmVzZXJ2ZSBpdHMgY2FjaGUgaW4gdGhlIGVsZW1lbnQgZGF0YSlcclxuICAgIC8vIGlmIGlzIHRoZSBzYW1lIHRleHQgYXMgdGhlIGVsZW1lbnQgY29udGVudCBhbmQgdGhlIGVsZW1lbnQgY29udGVudFxyXG4gICAgLy8gaXMgZnVsbHkgdmlzaWJsZS4gVGhhdHMsIGZvciBjYXNlcyB3aXRoIGRpZmZlcmVudCBjb250ZW50LCB3aWxsIGJlIHNob3dlZCxcclxuICAgIC8vIGFuZCBmb3IgY2FzZXMgd2l0aCBzYW1lIGNvbnRlbnQgYnV0IGlzIG5vdCB2aXNpYmxlIGJlY2F1c2UgdGhlIGVsZW1lbnRcclxuICAgIC8vIG9yIGNvbnRhaW5lciB3aWR0aCwgdGhlbiB3aWxsIGJlIHNob3dlZC5cclxuICAgIC8vIEV4Y2VwdCBpZiBpcyBwZXJzaXN0ZW50XHJcbiAgICBpZiAocGVyc2lzdGVudCAhPT0gdHJ1ZSAmJlxyXG4gICAgICAgIHNhbml0aXplV2hpdGVzcGFjZXMobC50ZXh0KCkpID09IGMgJiZcclxuICAgICAgICBsLm91dGVyV2lkdGgoKSA+PSBsWzBdLnNjcm9sbFdpZHRoKSB7XHJcbiAgICAgICAgYyA9IG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBjb250ZW50OlxyXG4gICAgaWYgKCFjKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIHRhcmdldCByZW1vdmluZyB0aGUgY2xhc3MgdG8gYXZvaWQgY3NzIG1hcmtpbmcgdG9vbHRpcCB3aGVuIHRoZXJlIGlzIG5vdFxyXG4gICAgICAgIGwucmVtb3ZlQ2xhc3MoJ2hhcy10b29sdGlwJykucmVtb3ZlQ2xhc3MoJ2hhcy1wb3B1cC10b29sdGlwJyk7XHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm4gdGhlIGNvbnRlbnQgYXMgc3RyaW5nOlxyXG4gICAgcmV0dXJuIGM7XHJcbn1cclxuLyoqIEdldCBvciBjcmVhdGVzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2UgZm9yIGEgdG9vbHRpcCBvZiB0aGUgZ2l2ZW4gdHlwZVxyXG4qKi9cclxuZnVuY3Rpb24gZ2V0VG9vbHRpcCh0eXBlKSB7XHJcbiAgICB0eXBlID0gdHlwZSB8fCAndG9vbHRpcCc7XHJcbiAgICB2YXIgaWQgPSAnc2luZ2xldG9uLScgKyB0eXBlO1xyXG4gICAgdmFyIHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICBpZiAoIXQpIHtcclxuICAgICAgICB0ID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlXCIgY2xhc3M9XCJ0b29sdGlwXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgdC5hdHRyKCdpZCcsIGlkKTtcclxuICAgICAgICB0LmhpZGUoKTtcclxuICAgICAgICAkKCdib2R5JykuYXBwZW5kKHQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICQodCk7XHJcbn1cclxuLyoqIFNob3cgdGhlIHRvb2x0aXAgb24gYW4gZXZlbnQgdHJpZ2dlcmVkIGJ5IHRoZSBlbGVtZW50IGNvbnRhaW5pbmdcclxuaW5mb3JtYXRpb24gZm9yIGEgdG9vbHRpcFxyXG4qKi9cclxuZnVuY3Rpb24gc2hvd1Rvb2x0aXAoZSkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBpc1BvcHVwID0gJHQuaGFzQ2xhc3MoJ2hhcy1wb3B1cC10b29sdGlwJyk7XHJcbiAgICAvLyBHZXQgb3IgY3JlYXRlIHRvb2x0aXAgbGF5ZXJcclxuICAgIHZhciB0ID0gZ2V0VG9vbHRpcChpc1BvcHVwID8gJ3BvcHVwLXRvb2x0aXAnIDogJ3Rvb2x0aXAnKTtcclxuICAgIC8vIElmIHRoaXMgaXMgbm90IHBvcHVwIGFuZCB0aGUgZXZlbnQgaXMgY2xpY2ssIGRpc2NhcmQgd2l0aG91dCBjYW5jZWwgZXZlbnRcclxuICAgIGlmICghaXNQb3B1cCAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAvLyBDcmVhdGUgY29udGVudDogaWYgdGhlcmUgaXMgY29udGVudCwgY29udGludWVcclxuICAgIHZhciBjb250ZW50ID0gY29uKCR0KTtcclxuICAgIGlmIChjb250ZW50KSB7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBoYXMtcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBub3QgYSBjbGljaywgZG9uJ3Qgc2hvd1xyXG4gICAgICAgIGlmIChpc1BvcHVwICYmIGUudHlwZSAhPSAnY2xpY2snKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAvLyBUaGUgdG9vbHRpcCBzZXR1cCBtdXN0IGJlIHF1ZXVlZCB0byBhdm9pZCBjb250ZW50IHRvIGJlIHNob3dlZCBhbmQgcGxhY2VkXHJcbiAgICAgICAgLy8gd2hlbiBzdGlsbCBoaWRkZW4gdGhlIHByZXZpb3VzXHJcbiAgICAgICAgdC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFNldCB0b29sdGlwIGNvbnRlbnRcclxuICAgICAgICAgICAgdC5odG1sKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAvLyBGb3IgcG9wdXBzLCBzZXR1cCBjbGFzcyBhbmQgY2xvc2UgYnV0dG9uXHJcbiAgICAgICAgICAgIGlmIChpc1BvcHVwKSB7XHJcbiAgICAgICAgICAgICAgICB0LmFkZENsYXNzKCdwb3B1cC10b29sdGlwJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YSBocmVmPVwiI2Nsb3NlLXBvcHVwXCIgY2xhc3M9XCJjbG9zZS1hY3Rpb25cIj5YPC9hPicpO1xyXG4gICAgICAgICAgICAgICAgdC5hcHBlbmQoY2xvc2VCdXR0b24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFBvc2l0aW9uYXRlXHJcbiAgICAgICAgICAgIHBvcyh0LCBlLCAkdCk7XHJcbiAgICAgICAgICAgIHQuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAvLyBTaG93IChhbmltYXRpb25zIGFyZSBzdG9wcGVkIG9ubHkgb24gaGlkZSB0byBhdm9pZCBjb25mbGljdHMpXHJcbiAgICAgICAgICAgIHQuZmFkZUluKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RvcCBidWJibGluZyBhbmQgZGVmYXVsdFxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKiBIaWRlIGFsbCBvcGVuZWQgdG9vbHRpcHMsIGZvciBhbnkgdHlwZS5cclxuSXQgaGFzIHNvbWUgc3BlY2lhbCBjb25zaWRlcmF0aW9ucyBmb3IgcG9wdXAtdG9vbHRpcHMgZGVwZW5kaW5nXHJcbm9uIHRoZSBldmVudCBiZWluZyB0cmlnZ2VyZWQuXHJcbioqL1xyXG5mdW5jdGlvbiBoaWRlVG9vbHRpcChlKSB7XHJcbiAgICAkKCcudG9vbHRpcDp2aXNpYmxlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGlzIGEgcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBub3QgYSBjbGljaywgb3IgdGhlIGludmVyc2UsXHJcbiAgICAgICAgLy8gdGhpcyBpcyBub3QgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIGEgY2xpY2ssIGRvIG5vdGhpbmdcclxuICAgICAgICBpZiAodC5oYXNDbGFzcygncG9wdXAtdG9vbHRpcCcpICYmIGUudHlwZSAhPSAnY2xpY2snIHx8XHJcbiAgICAgICAgICAgICF0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlID09ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAvLyBTdG9wIGFuaW1hdGlvbnMgYW5kIGhpZGVcclxuICAgICAgICB0LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKiBJbml0aWFsaXplIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiBpbml0KCkge1xyXG4gICAgLy8gTGlzdGVuIGZvciBldmVudHMgdG8gc2hvdy9oaWRlIHRvb2x0aXBzXHJcbiAgICAkKCdib2R5Jykub24oJ21vdXNlbW92ZSBmb2N1c2luJywgc2VsZWN0b3IsIHNob3dUb29sdGlwKVxyXG4gICAgLm9uKCdtb3VzZWxlYXZlIGZvY3Vzb3V0Jywgc2VsZWN0b3IsIGhpZGVUb29sdGlwKVxyXG4gICAgLy8gTGlzdGVuIGV2ZW50IGZvciBjbGlja2FibGUgcG9wdXAtdG9vbHRpcHNcclxuICAgIC5vbignY2xpY2snLCAnW3RpdGxlXS5oYXMtcG9wdXAtdG9vbHRpcCcsIHNob3dUb29sdGlwKVxyXG4gICAgLy8gQWxsb3dpbmcgYnV0dG9ucyBpbnNpZGUgdGhlIHRvb2x0aXBcclxuICAgIC5vbignY2xpY2snLCAnLnRvb2x0aXAtYnV0dG9uJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAvLyBBZGRpbmcgY2xvc2UtdG9vbHRpcCBoYW5kbGVyIGZvciBwb3B1cC10b29sdGlwcyAoY2xpY2sgb24gYW55IGVsZW1lbnQgZXhjZXB0IHRoZSB0b29sdGlwIGl0c2VsZilcclxuICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHZhciB0ID0gJCgnLnBvcHVwLXRvb2x0aXA6dmlzaWJsZScpLmdldCgwKTtcclxuICAgICAgICAvLyBJZiB0aGUgY2xpY2sgaXMgTm90IG9uIHRoZSB0b29sdGlwIG9yIGFueSBlbGVtZW50IGNvbnRhaW5lZFxyXG4gICAgICAgIC8vIGhpZGUgdG9vbHRpcFxyXG4gICAgICAgIGlmIChlLnRhcmdldCAhPSB0ICYmICEkKGUudGFyZ2V0KS5pc0NoaWxkT2YodCkpXHJcbiAgICAgICAgICAgIGhpZGVUb29sdGlwKGUpO1xyXG4gICAgfSlcclxuICAgIC8vIEF2b2lkIGNsb3NlLWFjdGlvbiBjbGljayBmcm9tIHJlZGlyZWN0IHBhZ2UsIGFuZCBoaWRlIHRvb2x0aXBcclxuICAgIC5vbignY2xpY2snLCAnLnBvcHVwLXRvb2x0aXAgLmNsb3NlLWFjdGlvbicsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGhpZGVUb29sdGlwKGUpO1xyXG4gICAgfSk7XHJcbiAgICB1cGRhdGUoKTtcclxufVxyXG4vKiogVXBkYXRlIGVsZW1lbnRzIG9uIHRoZSBwYWdlIHRvIHJlZmxlY3QgY2hhbmdlcyBvciBuZWVkIGZvciB0b29sdGlwc1xyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlKGVsZW1lbnRfc2VsZWN0b3IpIHtcclxuICAgIC8vIFJldmlldyBldmVyeSBwb3B1cCB0b29sdGlwIHRvIHByZXBhcmUgY29udGVudCBhbmQgbWFyay91bm1hcmsgdGhlIGxpbmsgb3IgdGV4dDpcclxuICAgICQoZWxlbWVudF9zZWxlY3RvciB8fCBzZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uKCQodGhpcykpO1xyXG4gICAgfSk7XHJcbn1cclxuLyoqIENyZWF0ZSB0b29sdGlwIG9uIGVsZW1lbnQgYnkgZGVtYW5kXHJcbioqL1xyXG5mdW5jdGlvbiBjcmVhdGVfdG9vbHRpcChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwge1xyXG4gICAgICB0aXRsZTogJydcclxuICAgICAgLCBkZXNjcmlwdGlvbjogbnVsbFxyXG4gICAgICAsIHVybDogbnVsbFxyXG4gICAgICAsIGlzX3BvcHVwOiBmYWxzZVxyXG4gICAgICAsIHBlcnNpc3RlbnQ6IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKGVsZW1lbnQpXHJcbiAgICAuYXR0cigndGl0bGUnLCBzZXR0aW5ncy50aXRsZSlcclxuICAgIC5kYXRhKCdkZXNjcmlwdGlvbicsIHNldHRpbmdzLmRlc2NyaXB0aW9uKVxyXG4gICAgLmRhdGEoJ3BlcnNpc3RlbnQtdG9vbHRpcCcsIHNldHRpbmdzLnBlcnNpc3RlbnQpXHJcbiAgICAuYWRkQ2xhc3Moc2V0dGluZ3MuaXNfcG9wdXAgPyAnaGFzLXBvcHVwLXRvb2x0aXAnIDogJ2hhcy10b29sdGlwJyk7XHJcbiAgICB1cGRhdGUoZWxlbWVudCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXRUb29sdGlwczogaW5pdCxcclxuICAgICAgICB1cGRhdGVUb29sdGlwczogdXBkYXRlLFxyXG4gICAgICAgIGNyZWF0ZVRvb2x0aXA6IGNyZWF0ZV90b29sdGlwXHJcbiAgICB9O1xyXG4iLCIvKiBTb21lIHRvb2xzIGZvcm0gVVJMIG1hbmFnZW1lbnRcclxuKi9cclxuZXhwb3J0cy5nZXRVUkxQYXJhbWV0ZXIgPSBmdW5jdGlvbiBnZXRVUkxQYXJhbWV0ZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIGRlY29kZVVSSShcclxuICAgICAgICAoUmVnRXhwKG5hbWUgKyAnPScgKyAnKC4rPykoJnwkKScsICdpJykuZXhlYyhsb2NhdGlvbi5zZWFyY2gpIHx8IFssIG51bGxdKVsxXSk7XHJcbn07XHJcbmV4cG9ydHMuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzID0gZnVuY3Rpb24gZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzKGhhc2hiYW5ndmFsdWUpIHtcclxuICAgIC8vIEhhc2hiYW5ndmFsdWUgaXMgc29tZXRoaW5nIGxpa2U6IFRocmVhZC0xX01lc3NhZ2UtMlxyXG4gICAgLy8gV2hlcmUgJzEnIGlzIHRoZSBUaHJlYWRJRCBhbmQgJzInIHRoZSBvcHRpb25hbCBNZXNzYWdlSUQsIG9yIG90aGVyIHBhcmFtZXRlcnNcclxuICAgIHZhciBwYXJzID0gaGFzaGJhbmd2YWx1ZS5zcGxpdCgnXycpO1xyXG4gICAgdmFyIHVybFBhcmFtZXRlcnMgPSB7fTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBwYXJzdmFsdWVzID0gcGFyc1tpXS5zcGxpdCgnLScpO1xyXG4gICAgICAgIGlmIChwYXJzdmFsdWVzLmxlbmd0aCA9PSAyKVxyXG4gICAgICAgICAgICB1cmxQYXJhbWV0ZXJzW3BhcnN2YWx1ZXNbMF1dID0gcGFyc3ZhbHVlc1sxXTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVybFBhcmFtZXRlcnM7XHJcbn07XHJcbiIsIi8qKiBWYWxpZGF0aW9uIGxvZ2ljIHdpdGggbG9hZCBhbmQgc2V0dXAgb2YgdmFsaWRhdG9ycyBhbmQgXHJcbiAgICB2YWxpZGF0aW9uIHJlbGF0ZWQgdXRpbGl0aWVzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG4vLyBVc2luZyBvbiBzZXR1cCBhc3luY3Jvbm91cyBsb2FkIGluc3RlYWQgb2YgdGhpcyBzdGF0aWMtbGlua2VkIGxvYWRcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanMnKTtcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanMnKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwVmFsaWRhdGlvbihyZWFwcGx5T25seVRvKSB7XHJcbiAgICByZWFwcGx5T25seVRvID0gcmVhcHBseU9ubHlUbyB8fCBkb2N1bWVudDtcclxuICAgIGlmICghd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZiAoIWpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHtcclxuICAgICAgICBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICBNb2Rlcm5penIubG9hZChbXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanNcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzXCIgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgZmlyc3QgaWYgdmFsaWRhdGlvbiBpcyBlbmFibGVkIChjYW4gaGFwcGVuIHRoYXQgdHdpY2UgaW5jbHVkZXMgb2ZcclxuICAgICAgICAvLyB0aGlzIGNvZGUgaGFwcGVuIGF0IHNhbWUgcGFnZSwgYmVpbmcgZXhlY3V0ZWQgdGhpcyBjb2RlIGFmdGVyIGZpcnN0IGFwcGVhcmFuY2VcclxuICAgICAgICAvLyB3aXRoIHRoZSBzd2l0Y2gganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCBjaGFuZ2VkXHJcbiAgICAgICAgLy8gYnV0IHdpdGhvdXQgdmFsaWRhdGlvbiBiZWluZyBhbHJlYWR5IGxvYWRlZCBhbmQgZW5hYmxlZClcclxuICAgICAgICBpZiAoJCAmJiAkLnZhbGlkYXRvciAmJiAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZSkge1xyXG4gICAgICAgICAgICAvLyBBcHBseSB0aGUgdmFsaWRhdGlvbiBydWxlcyB0byB0aGUgbmV3IGVsZW1lbnRzXHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndmFsaWRhdG9yJyk7XHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgICAgICQudmFsaWRhdG9yLnVub2J0cnVzaXZlLnBhcnNlKHJlYXBwbHlPbmx5VG8pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0aWVzICovXHJcblxyXG4vKiBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9ycyBvZiB0aGUgdmFsaWRhdGlvbiBzdW1tYXJ5XHJcbmluY2x1ZGVkIGluICdjb250YWluZXInIGFuZCBzZXQgYXMgdmFsaWQgdGhlIHN1bW1hcnlcclxuKi9cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gICAgJCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgLmZpbmQoJz51bD5saScpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFNldCBhbGwgZmllbGRzIHZhbGlkYXRpb24gaW5zaWRlIHRoaXMgZm9ybSAoYWZmZWN0ZWQgYnkgdGhlIHN1bW1hcnkgdG9vKVxyXG4gICAgLy8gYXMgdmFsaWQgdG9vXHJcbiAgICAkKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgLnRleHQoJycpO1xyXG5cclxuICAgIC8vIFJlLWFwcGx5IHNldHVwIHZhbGlkYXRpb24gdG8gZW5zdXJlIGlzIHdvcmtpbmcsIGJlY2F1c2UganVzdCBhZnRlciBhIHN1Y2Nlc3NmdWxcclxuICAgIC8vIHZhbGlkYXRpb24sIGFzcC5uZXQgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBzdG9wcyB3b3JraW5nIG9uIGNsaWVudC1zaWRlLlxyXG4gICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihjb250YWluZXIsIGVycm9ycykge1xyXG4gIHZhciB2ID0gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcik7XHJcbiAgdi5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0RXJyb3JzKGNvbnRhaW5lciwgZXJyb3JzKSB7XHJcbiAgICAvL3ZhciB2YWxpZGF0b3IgPSAkKGNvbnRhaW5lcikudmFsaWRhdGUoKTtcclxuICAgIC8vdmFsaWRhdG9yLnNob3dFcnJvcnMoZXJyb3JzKTtcclxuICAgIHZhciAkcyA9IGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpLmZpbmQoJ3VsJyk7XHJcbiAgICB2YXIgd2l0aEVycm9ycyA9IGZhbHNlO1xyXG4gICAgZm9yKHZhciBmaWVsZCBpbiBlcnJvcnMpIHtcclxuICAgICAgICBpZiAoZXJyb3JzLmhhc093blByb3BlcnR5ICYmICFlcnJvcnMuaGFzT3duUHJvcGVydHkoZmllbGQpKVxyXG4gICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAkKCc8bGkvPicpLnRleHQoZXJyb3JzW2ZpZWxkXSkuYXBwZW5kVG8oJHMpO1xyXG4gICAgICAgIC8vJChjb250YWluZXIpLmZpbmQoJ1tuYW1lPVwiJyArIGZpZWxkICsgJ1wiXScpXHJcbiAgICAgICAgLy8uYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgIC8vLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkIHZhbGlkJyk7XHJcbiAgICAgICAgd2l0aEVycm9ycyA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBpZiAod2l0aEVycm9ycylcclxuICAgICAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IoY29udGFpbmVyKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSkge1xyXG4gICAgdmFyIG9mZiA9IGZvcm0uZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5vZmZzZXQoKTtcclxuICAgIGlmIChvZmYpXHJcbiAgICAgICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBvZmYudG9wIH0sIDUwMCk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignZ29Ub1N1bW1hcnlFcnJvcnM6IG5vIHN1bW1hcnkgdG8gZm9jdXMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcikge1xyXG4gIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudDtcclxuICByZXR1cm4gJCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nLCBjb250YWluZXIpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHNldHVwOiBzZXR1cFZhbGlkYXRpb24sXHJcbiAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQ6IHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZCxcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcjogc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yLFxyXG4gICAgZ29Ub1N1bW1hcnlFcnJvcnM6IGdvVG9TdW1tYXJ5RXJyb3JzLFxyXG4gICAgZmluZFZhbGlkYXRpb25TdW1tYXJ5OiBmaW5kVmFsaWRhdGlvblN1bW1hcnksXHJcbiAgICBzZXRFcnJvcnM6IHNldEVycm9yc1xyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gc29tZSBBY2NvdW50IHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJ2EubG9naW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IGJhc2VVcmwgKyAnQWNjb3VudC8kTG9naW4vP1JldHVyblVybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbik7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0sIG51bGwsIG51bGwsIHsgYXV0b0ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmZvcmdvdC1wYXNzd29yZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9Gb3Jnb3RQYXNzd29yZCcsICcvQWNjb3VudC8kRm9yZ290UGFzc3dvcmQnKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQwMCwgaGVpZ2h0OiAyNDAgfSwgbnVsbCwgbnVsbCwgeyBhdXRvRm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EuY2hhbmdlLXBhc3N3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L0NoYW5nZVBhc3N3b3JkJywgJy9BY2NvdW50LyRDaGFuZ2VQYXNzd29yZCcpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDUwLCBoZWlnaHQ6IDM0MCB9LCBudWxsLCBudWxsLCB7IGF1dG9Gb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLy8gT1VSIG5hbWVzcGFjZSAoYWJicmV2aWF0ZWQgTG9jb25vbWljcylcclxud2luZG93LkxDID0gd2luZG93LkxDIHx8IHt9O1xyXG5cclxuLy8gVE9ETyBSZXZpZXcgTGNVcmwgdXNlIGFyb3VuZCBhbGwgdGhlIG1vZHVsZXMsIHVzZSBESSB3aGVuZXZlciBwb3NzaWJsZSAoaW5pdC9zZXR1cCBtZXRob2Qgb3IgaW4gdXNlIGNhc2VzKVxyXG4vLyBidXQgb25seSBmb3IgdGhlIHdhbnRlZCBiYXNlVXJsIG9uIGVhY2ggY2FzZSBhbmQgbm90IHBhc3MgYWxsIHRoZSBMY1VybCBvYmplY3QuXHJcbi8vIExjVXJsIGlzIHNlcnZlci1zaWRlIGdlbmVyYXRlZCBhbmQgd3JvdGUgaW4gYSBMYXlvdXQgc2NyaXB0LXRhZy5cclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5nc1xyXG53aW5kb3cuZ0xvYWRpbmdSZXRhcmQgPSAzMDA7XHJcblxyXG4vKioqXHJcbiAqKiBMb2FkaW5nIG1vZHVsZXNcclxuKioqL1xyXG4vL1RPRE86IENsZWFuIGRlcGVuZGVuY2llcywgcmVtb3ZlIGFsbCB0aGF0IG5vdCB1c2VkIGRpcmVjdGx5IGluIHRoaXMgZmlsZSwgYW55IG90aGVyIGZpbGVcclxuLy8gb3IgcGFnZSBtdXN0IHJlcXVpcmUgaXRzIGRlcGVuZGVuY2llcy5cclxuXHJcbndpbmRvdy5MY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyk7XHJcblxyXG4vKiBqUXVlcnksIHNvbWUgdmVuZG9yIHBsdWdpbnMgKGZyb20gYnVuZGxlKSBhbmQgb3VyIGFkZGl0aW9ucyAoc21hbGwgcGx1Z2lucyksIHRoZXkgYXJlIGF1dG9tYXRpY2FsbHkgcGx1Zy1lZCBvbiByZXF1aXJlICovXHJcbnZhciAkID0gd2luZG93LiQgPSB3aW5kb3cualF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXInKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJhLWhhc2hjaGFuZ2UnKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LmFyZScpO1xyXG4vLyBNYXNrZWQgaW5wdXQsIGZvciBkYXRlcyAtYXQgbXktYWNjb3VudC0uXHJcbnJlcXVpcmUoJ2pxdWVyeS5mb3JtYXR0ZXInKTtcclxuXHJcbi8vIEdlbmVyYWwgY2FsbGJhY2tzIGZvciBBSkFYIGV2ZW50cyB3aXRoIGNvbW1vbiBsb2dpY1xyXG52YXIgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhDYWxsYmFja3MnKTtcclxuLy8gRm9ybS5hamF4IGxvZ2ljIGFuZCBtb3JlIHNwZWNpZmljIGNhbGxiYWNrcyBiYXNlZCBvbiBhamF4Q2FsbGJhY2tzXHJcbnZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbndpbmRvdy5hamF4Rm9ybXNTdWNjZXNzSGFuZGxlciA9IGFqYXhGb3Jtcy5vblN1Y2Nlc3M7XHJcbndpbmRvdy5hamF4RXJyb3JQb3B1cEhhbmRsZXIgPSBhamF4Rm9ybXMub25FcnJvcjtcclxud2luZG93LmFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlciA9IGFqYXhGb3Jtcy5vbkNvbXBsZXRlO1xyXG4vL31cclxuXHJcbi8qIFJlbG9hZCAqL1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkucmVsb2FkJyk7XHJcbi8vIFdyYXBwZXIgZnVuY3Rpb24gYXJvdW5kIG9uU3VjY2VzcyB0byBtYXJrIG9wZXJhdGlvbiBhcyBwYXJ0IG9mIGEgXHJcbi8vIHJlbG9hZCBhdm9pZGluZyBzb21lIGJ1Z3MgKGFzIHJlcGxhY2UtY29udGVudCBvbiBhamF4LWJveCwgbm90IHdhbnRlZCBmb3JcclxuLy8gcmVsb2FkIG9wZXJhdGlvbnMpXHJcbmZ1bmN0aW9uIHJlbG9hZFN1Y2Nlc3NXcmFwcGVyKCkge1xyXG4gIHZhciBjb250ZXh0ID0gJC5pc1BsYWluT2JqZWN0KHRoaXMpID8gdGhpcyA6IHsgZWxlbWVudDogdGhpcyB9O1xyXG4gIGNvbnRleHQuaXNSZWxvYWQgPSB0cnVlO1xyXG4gIGFqYXhGb3Jtcy5vblN1Y2Nlc3MuYXBwbHkoY29udGV4dCwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XHJcbn1cclxuJC5mbi5yZWxvYWQuZGVmYXVsdHMgPSB7XHJcbiAgc3VjY2VzczogW3JlbG9hZFN1Y2Nlc3NXcmFwcGVyXSxcclxuICBlcnJvcjogW2FqYXhGb3Jtcy5vbkVycm9yXSxcclxuICBkZWxheTogZ0xvYWRpbmdSZXRhcmRcclxufTtcclxuXHJcbkxDLm1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi4vTEMvbW92ZUZvY3VzVG8nKTtcclxuLyogRGlzYWJsZWQgYmVjYXVzZSBjb25mbGljdHMgd2l0aCB0aGUgbW92ZUZvY3VzVG8gb2YgXHJcbiAgYWpheEZvcm0ub25zdWNjZXNzLCBpdCBoYXBwZW5zIGEgYmxvY2subG9hZGluZyBqdXN0IGFmdGVyXHJcbiAgdGhlIHN1Y2Nlc3MgaGFwcGVucy5cclxuJC5ibG9ja1VJLmRlZmF1bHRzLm9uQmxvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBTY3JvbGwgdG8gYmxvY2stbWVzc2FnZSB0byBkb24ndCBsb3N0IGluIGxhcmdlIHBhZ2VzOlxyXG4gICAgTEMubW92ZUZvY3VzVG8odGhpcyk7XHJcbn07Ki9cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuLi9MQy9sb2FkZXInKTtcclxuTEMubG9hZCA9IGxvYWRlci5sb2FkO1xyXG5cclxudmFyIGJsb2NrcyA9IExDLmJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4uL0xDL2Jsb2NrUHJlc2V0cycpO1xyXG4vL3tURU1QXHJcbndpbmRvdy5sb2FkaW5nQmxvY2sgPSBibG9ja3MubG9hZGluZztcclxud2luZG93LmluZm9CbG9jayA9IGJsb2Nrcy5pbmZvO1xyXG53aW5kb3cuZXJyb3JCbG9jayA9IGJsb2Nrcy5lcnJvcjtcclxuLy99XHJcblxyXG5BcnJheS5yZW1vdmUgPSByZXF1aXJlKCcuLi9MQy9BcnJheS5yZW1vdmUnKTtcclxucmVxdWlyZSgnLi4vTEMvU3RyaW5nLnByb3RvdHlwZS5jb250YWlucycpO1xyXG5cclxuTEMuZ2V0VGV4dCA9IHJlcXVpcmUoJy4uL0xDL2dldFRleHQnKTtcclxuXHJcbnZhciBUaW1lU3BhbiA9IExDLnRpbWVTcGFuID0gcmVxdWlyZSgnLi4vTEMvVGltZVNwYW4nKTtcclxudmFyIHRpbWVTcGFuRXh0cmEgPSByZXF1aXJlKCcuLi9MQy9UaW1lU3BhbkV4dHJhJyk7XHJcbnRpbWVTcGFuRXh0cmEucGx1Z0luKFRpbWVTcGFuKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzZXNcclxuTEMuc21hcnRUaW1lID0gdGltZVNwYW5FeHRyYS5zbWFydFRpbWU7XHJcbkxDLnJvdW5kVGltZVRvUXVhcnRlckhvdXIgPSB0aW1lU3BhbkV4dHJhLnJvdW5kVG9RdWFydGVySG91cjtcclxuLy99XHJcblxyXG5MQy5DaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi4vTEMvY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG53aW5kb3cuVGFiYmVkVVggPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWCcpO1xyXG52YXIgc2xpZGVyVGFicyA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLnNsaWRlclRhYnMnKTtcclxuXHJcbi8vIFBvcHVwIEFQSXNcclxud2luZG93LnNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi4vTEMvc21vb3RoQm94QmxvY2snKTtcclxuXHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4uL0xDL3BvcHVwJyk7XHJcbi8ve1RFTVBcclxudmFyIHBvcHVwU3R5bGUgPSBwb3B1cC5zdHlsZSxcclxuICAgIHBvcHVwU2l6ZSA9IHBvcHVwLnNpemU7XHJcbkxDLm1lc3NhZ2VQb3B1cCA9IHBvcHVwLm1lc3NhZ2U7XHJcbkxDLmNvbm5lY3RQb3B1cEFjdGlvbiA9IHBvcHVwLmNvbm5lY3RBY3Rpb247XHJcbndpbmRvdy5wb3B1cCA9IHBvcHVwO1xyXG4vL31cclxuXHJcbkxDLnNhbml0aXplV2hpdGVzcGFjZXMgPSByZXF1aXJlKCcuLi9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzJyk7XHJcbi8ve1RFTVAgICBhbGlhcyBiZWNhdXNlIG1pc3NwZWxsaW5nXHJcbkxDLnNhbml0aXplV2hpdGVwYWNlcyA9IExDLnNhbml0aXplV2hpdGVzcGFjZXM7XHJcbi8vfVxyXG5cclxuTEMuZ2V0WFBhdGggPSByZXF1aXJlKCcuLi9MQy9nZXRYUGF0aCcpO1xyXG5cclxudmFyIHN0cmluZ0Zvcm1hdCA9IHJlcXVpcmUoJy4uL0xDL1N0cmluZ0Zvcm1hdCcpO1xyXG5cclxuLy8gRXhwYW5kaW5nIGV4cG9ydGVkIHV0aWxpdGVzIGZyb20gbW9kdWxlcyBkaXJlY3RseSBhcyBMQyBtZW1iZXJzOlxyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvUHJpY2UnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9tYXRoVXRpbHMnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9udW1iZXJVdGlscycpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL3Rvb2x0aXBzJykpO1xyXG52YXIgaTE4biA9IExDLmkxOG4gPSByZXF1aXJlKCcuLi9MQy9pMThuJyk7XHJcbi8ve1RFTVAgb2xkIGFsaXNlcyBvbiBMQyBhbmQgZ2xvYmFsXHJcbiQuZXh0ZW5kKExDLCBpMThuKTtcclxuJC5leHRlbmQod2luZG93LCBpMThuKTtcclxuLy99XHJcblxyXG4vLyB4dHNoOiBwbHVnZWQgaW50byBqcXVlcnkgYW5kIHBhcnQgb2YgTENcclxudmFyIHh0c2ggPSByZXF1aXJlKCcuLi9MQy9qcXVlcnkueHRzaCcpO1xyXG54dHNoLnBsdWdJbigkKTtcclxuLy97VEVNUCAgIHJlbW92ZSBvbGQgTEMuKiBhbGlhc1xyXG4kLmV4dGVuZChMQywgeHRzaCk7XHJcbmRlbGV0ZSBMQy5wbHVnSW47XHJcbi8vfVxyXG5cclxudmFyIGF1dG9DYWxjdWxhdGUgPSBMQy5hdXRvQ2FsY3VsYXRlID0gcmVxdWlyZSgnLi4vTEMvYXV0b0NhbGN1bGF0ZScpO1xyXG4vL3tURU1QICAgcmVtb3ZlIG9sZCBhbGlhcyB1c2VcclxudmFyIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzID0gYXV0b0NhbGN1bGF0ZS5vblRhYmxlSXRlbXM7XHJcbkxDLnNldHVwQ2FsY3VsYXRlU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUub25TdW1tYXJ5O1xyXG5MQy51cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS51cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5O1xyXG5MQy5zZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLm9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTtcclxuLy99XHJcblxyXG52YXIgQ29va2llID0gTEMuQ29va2llID0gcmVxdWlyZSgnLi4vTEMvQ29va2llJyk7XHJcbi8ve1RFTVAgICAgb2xkIGFsaWFzXHJcbnZhciBnZXRDb29raWUgPSBDb29raWUuZ2V0LFxyXG4gICAgc2V0Q29va2llID0gQ29va2llLnNldDtcclxuLy99XHJcblxyXG5MQy5kYXRlUGlja2VyID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVBpY2tlcicpO1xyXG4vL3tURU1QICAgb2xkIGFsaWFzXHJcbndpbmRvdy5zZXR1cERhdGVQaWNrZXIgPSBMQy5zZXR1cERhdGVQaWNrZXIgPSBMQy5kYXRlUGlja2VyLmluaXQ7XHJcbndpbmRvdy5hcHBseURhdGVQaWNrZXIgPSBMQy5hcHBseURhdGVQaWNrZXIgPSBMQy5kYXRlUGlja2VyLmFwcGx5O1xyXG4vL31cclxuXHJcbkxDLmF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4uL0xDL2F1dG9Gb2N1cycpO1xyXG5cclxuLy8gQ1JVREw6IGxvYWRpbmcgbW9kdWxlLCBzZXR0aW5nIHVwIGNvbW1vbiBkZWZhdWx0IHZhbHVlcyBhbmQgY2FsbGJhY2tzOlxyXG52YXIgY3J1ZGxNb2R1bGUgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpO1xyXG5jcnVkbE1vZHVsZS5kZWZhdWx0U2V0dGluZ3MuZGF0YVsnZm9jdXMtY2xvc2VzdCddWydkZWZhdWx0J10gPSAnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJztcclxuY3J1ZGxNb2R1bGUuZGVmYXVsdFNldHRpbmdzLmRhdGFbJ2ZvY3VzLW1hcmdpbiddWydkZWZhdWx0J10gPSAxMDtcclxudmFyIGNydWRsID0gY3J1ZGxNb2R1bGUuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy8gUHJldmlvdXMgdXNlZCBhbGlhcyAoZGVwcmVjYXRlZCk6XHJcbkxDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG5cclxuLy8gVUkgU2xpZGVyIExhYmVsc1xyXG52YXIgc2xpZGVyTGFiZWxzID0gcmVxdWlyZSgnLi4vTEMvVUlTbGlkZXJMYWJlbHMnKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbkxDLmNyZWF0ZUxhYmVsc0ZvclVJU2xpZGVyID0gc2xpZGVyTGFiZWxzLmNyZWF0ZTtcclxuTEMudXBkYXRlTGFiZWxzRm9yVUlTbGlkZXIgPSBzbGlkZXJMYWJlbHMudXBkYXRlO1xyXG5MQy51aVNsaWRlckxhYmVsc0xheW91dHMgPSBzbGlkZXJMYWJlbHMubGF5b3V0cztcclxuLy99XHJcblxyXG52YXIgdmFsaWRhdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4uL0xDL3ZhbGlkYXRpb25IZWxwZXInKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbkxDLnNldHVwVmFsaWRhdGlvbiA9IHZhbGlkYXRpb25IZWxwZXIuc2V0dXA7XHJcbkxDLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZCA9IHZhbGlkYXRpb25IZWxwZXIuc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkO1xyXG5MQy5nb1RvU3VtbWFyeUVycm9ycyA9IHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnM7XHJcbi8vfVxyXG5cclxuTEMucGxhY2VIb2xkZXIgPSByZXF1aXJlKCcuLi9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbCcpLmluaXQ7XHJcblxyXG5MQy5tYXBSZWFkeSA9IHJlcXVpcmUoJy4uL0xDL2dvb2dsZU1hcFJlYWR5Jyk7XHJcblxyXG53aW5kb3cuaXNFbXB0eVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2lzRW1wdHlTdHJpbmcnKTtcclxuXHJcbndpbmRvdy5ndWlkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vTEMvZ3VpZEdlbmVyYXRvcicpO1xyXG5cclxudmFyIHVybFV0aWxzID0gcmVxdWlyZSgnLi4vTEMvdXJsVXRpbHMnKTtcclxud2luZG93LmdldFVSTFBhcmFtZXRlciA9IHVybFV0aWxzLmdldFVSTFBhcmFtZXRlcjtcclxud2luZG93LmdldEhhc2hCYW5nUGFyYW1ldGVycyA9IHVybFV0aWxzLmdldEhhc2hCYW5nUGFyYW1ldGVycztcclxuXHJcbnZhciBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9kYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcnKTtcclxuLy97VEVNUFxyXG5MQy5kYXRlVG9JbnRlcmNoYW5nbGVTdHJpbmcgPSBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmc7XHJcbi8vfVxyXG5cclxuLy8gUGFnZXMgaW4gcG9wdXBcclxudmFyIHdlbGNvbWVQb3B1cCA9IHJlcXVpcmUoJy4vd2VsY29tZVBvcHVwJyk7XHJcbnZhciBmYXFzUG9wdXBzID0gcmVxdWlyZSgnLi9mYXFzUG9wdXBzJyk7XHJcbnZhciBhY2NvdW50UG9wdXBzID0gcmVxdWlyZSgnLi9hY2NvdW50UG9wdXBzJyk7XHJcbnZhciBsZWdhbFBvcHVwcyA9IHJlcXVpcmUoJy4vbGVnYWxQb3B1cHMnKTtcclxuXHJcbi8vIE9sZCBhdmFpbGFibGl0eSBjYWxlbmRhclxyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQgPSByZXF1aXJlKCcuL2F2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0Jyk7XHJcbi8vIE5ldyBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyID0gcmVxdWlyZSgnLi4vTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXInKTtcclxuXHJcbnZhciBhdXRvZmlsbFN1Ym1lbnUgPSByZXF1aXJlKCcuLi9MQy9hdXRvZmlsbFN1Ym1lbnUnKTtcclxuXHJcbnZhciB0YWJiZWRXaXphcmQgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC53aXphcmQnKTtcclxuXHJcbnZhciBoYXNDb25maXJtU3VwcG9ydCA9IHJlcXVpcmUoJy4uL0xDL2hhc0NvbmZpcm1TdXBwb3J0Jyk7XHJcblxyXG52YXIgcG9zdGFsQ29kZVZhbGlkYXRpb24gPSByZXF1aXJlKCcuLi9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbicpO1xyXG5cclxudmFyIHRhYmJlZE5vdGlmaWNhdGlvbnMgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcblxyXG52YXIgdGFic0F1dG9sb2FkID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguYXV0b2xvYWQnKTtcclxuXHJcbnZhciBob21lUGFnZSA9IHJlcXVpcmUoJy4vaG9tZScpO1xyXG5cclxuLy97VEVNUCByZW1vdmUgZ2xvYmFsIGRlcGVuZGVuY3kgZm9yIHRoaXNcclxud2luZG93LmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuLi9MQy9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcbi8vfVxyXG5cclxudmFyIHByb3ZpZGVyV2VsY29tZSA9IHJlcXVpcmUoJy4vcHJvdmlkZXJXZWxjb21lJyk7XHJcblxyXG52YXIgSGVscFBvaW50ID0gcmVxdWlyZSgnLi4vTEMvSGVscFBvaW50JykuSGVscFBvaW50O1xyXG5cclxuLy8gR2xvYmFsIGFjY2VzcyB0byB0aGUgRmFjZWJvb2sgQVBJIHV0aWxzIHRvIGJlIHVzZWQgYnlcclxuLy8gcGFnZXMgYW5kIHBhZ2UtY29tcG9uZW50czsgYW55IGphdmFzY3JpcHQgbW9kdWxlIG11c3RcclxuLy8gcmVxdWlyZSBpdCBpbnN0ZWFkLlxyXG53aW5kb3cuZmFjZWJvb2tVdGlscyA9IHJlcXVpcmUoJy4uL0xDL2ZhY2Vib29rVXRpbHMnKTtcclxuXHJcbi8qKlxyXG4gKiogSW5pdCBjb2RlXHJcbioqKi9cclxuJCh3aW5kb3cpLmxvYWQoZnVuY3Rpb24gKCkge1xyXG4gIC8vIERpc2FibGUgYnJvd3NlciBiZWhhdmlvciB0byBhdXRvLXNjcm9sbCB0byB1cmwgZnJhZ21lbnQvaGFzaCBlbGVtZW50IHBvc2l0aW9uOlxyXG4gIC8vIEVYQ0VQVCBpbiBEYXNoYm9hcmQ6XHJcbiAgLy8gVE9ETzogUmV2aWV3IGlmIHRoaXMgaXMgcmVxdWlyZWQgb25seSBmb3IgSG93SXRXb3JrcyBvciBzb21ldGhpbmcgbW9yZSAodGFicywgcHJvZmlsZSlcclxuICAvLyBhbmQgcmVtb3ZlIGlmIHBvc3NpYmxlIG9yIG9ubHkgb24gdGhlIGNvbmNyZXRlIGNhc2VzLlxyXG4gIGlmICghL1xcL2Rhc2hib2FyZFxcLy9pLnRlc3QobG9jYXRpb24pKVxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7ICQoJ2h0bWwsYm9keScpLnNjcm9sbFRvcCgwKTsgfSwgMSk7XHJcbn0pO1xyXG4kKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBwcm92aWRlcldlbGNvbWUuc2hvdygpO1xyXG5cclxuICAgIC8vIFBsYWNlaG9sZGVyIHBvbHlmaWxsXHJcbiAgICBMQy5wbGFjZUhvbGRlcigpO1xyXG5cclxuICAgIC8vIEF1dG9mb2N1cyBwb2x5ZmlsbFxyXG4gICAgTEMuYXV0b0ZvY3VzKCk7XHJcblxyXG4gICAgLy8gR2VuZXJpYyBzY3JpcHQgZm9yIGVuaGFuY2VkIHRvb2x0aXBzIGFuZCBlbGVtZW50IGRlc2NyaXB0aW9uc1xyXG4gICAgTEMuaW5pdFRvb2x0aXBzKCk7XHJcblxyXG4gICAgYWpheEZvcm1zLmluaXQoKTtcclxuXHJcbiAgICB3ZWxjb21lUG9wdXAuaW5pdCgpO1xyXG5cclxuICAgIC8vIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyBmb3Igc29tZSBsaW5rcyB0aGF0IGJ5IGRlZmF1bHQgb3BlbiBhIG5ldyB0YWI6XHJcbiAgICBmYXFzUG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcbiAgICBhY2NvdW50UG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcbiAgICBsZWdhbFBvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG5cclxuICAgIC8vIE9sZCBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxuICAgIGF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0LmluaXQoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gICAgLy8gTmV3IGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG4gICAgYXZhaWxhYmlsaXR5Q2FsZW5kYXIuV2Vla2x5LmVuYWJsZUFsbCgpO1xyXG5cclxuICAgIHBvcHVwLmNvbm5lY3RBY3Rpb24oKTtcclxuXHJcbiAgICAvLyBEYXRlIFBpY2tlclxyXG4gICAgTEMuZGF0ZVBpY2tlci5pbml0KCk7XHJcblxyXG4gICAgLyogQXV0byBjYWxjdWxhdGUgdGFibGUgaXRlbXMgdG90YWwgKHF1YW50aXR5KnVuaXRwcmljZT1pdGVtLXRvdGFsKSBzY3JpcHQgKi9cclxuICAgIGF1dG9DYWxjdWxhdGUub25UYWJsZUl0ZW1zKCk7XHJcbiAgICBhdXRvQ2FsY3VsYXRlLm9uU3VtbWFyeSgpO1xyXG5cclxuICAgIGhhc0NvbmZpcm1TdXBwb3J0Lm9uKCk7XHJcblxyXG4gICAgcG9zdGFsQ29kZVZhbGlkYXRpb24uaW5pdCh7IGJhc2VVcmw6IExjVXJsLkxhbmdQYXRoIH0pO1xyXG5cclxuICAgIC8vIFRhYmJlZCBpbnRlcmZhY2VcclxuICAgIHRhYnNBdXRvbG9hZC5pbml0KFRhYmJlZFVYKTtcclxuICAgIFRhYmJlZFVYLmluaXQoKTtcclxuICAgIFRhYmJlZFVYLmZvY3VzQ3VycmVudExvY2F0aW9uKCk7XHJcbiAgICBUYWJiZWRVWC5jaGVja1ZvbGF0aWxlVGFicygpO1xyXG4gICAgc2xpZGVyVGFicy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgICB0YWJiZWRXaXphcmQuaW5pdChUYWJiZWRVWCwge1xyXG4gICAgICAgIGxvYWRpbmdEZWxheTogZ0xvYWRpbmdSZXRhcmRcclxuICAgIH0pO1xyXG5cclxuICAgIHRhYmJlZE5vdGlmaWNhdGlvbnMuaW5pdChUYWJiZWRVWCk7XHJcblxyXG4gICAgYXV0b2ZpbGxTdWJtZW51KCk7XHJcblxyXG4gICAgSGVscFBvaW50LmVuYWJsZUFsbChkb2N1bWVudCk7XHJcblxyXG4gICAgLy8gVE9ETzogJ2xvYWRIYXNoQmFuZycgY3VzdG9tIGV2ZW50IGluIHVzZT9cclxuICAgIC8vIElmIHRoZSBoYXNoIHZhbHVlIGZvbGxvdyB0aGUgJ2hhc2ggYmFuZycgY29udmVudGlvbiwgbGV0IG90aGVyXHJcbiAgICAvLyBzY3JpcHRzIGRvIHRoZWlyIHdvcmsgdGhyb3VnaHQgYSAnbG9hZEhhc2hCYW5nJyBldmVudCBoYW5kbGVyXHJcbiAgICBpZiAoL14jIS8udGVzdCh3aW5kb3cubG9jYXRpb24uaGFzaCkpXHJcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcignbG9hZEhhc2hCYW5nJywgd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpKTtcclxuXHJcbiAgICAvLyBSZWxvYWQgYnV0dG9uc1xyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5yZWxvYWQtYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIEdlbmVyaWMgYWN0aW9uIHRvIGNhbGwgbGMuanF1ZXJ5ICdyZWxvYWQnIGZ1bmN0aW9uIGZyb20gYW4gZWxlbWVudCBpbnNpZGUgaXRzZWxmLlxyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgJHQuY2xvc2VzdCgkdC5kYXRhKCdyZWxvYWQtdGFyZ2V0JykpLnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLyogRW5hYmxlIGZvY3VzIHRhYiBvbiBldmVyeSBoYXNoIGNoYW5nZSwgbm93IHRoZXJlIGFyZSB0d28gc2NyaXB0cyBtb3JlIHNwZWNpZmljIGZvciB0aGlzOlxyXG4gICAgKiBvbmUgd2hlbiBwYWdlIGxvYWQgKHdoZXJlPyksXHJcbiAgICAqIGFuZCBhbm90aGVyIG9ubHkgZm9yIGxpbmtzIHdpdGggJ3RhcmdldC10YWInIGNsYXNzLlxyXG4gICAgKiBOZWVkIGJlIHN0dWR5IGlmIHNvbWV0aGluZyBvZiB0aGVyZSBtdXN0IGJlIHJlbW92ZWQgb3IgY2hhbmdlZC5cclxuICAgICogVGhpcyBpcyBuZWVkZWQgZm9yIG90aGVyIGJlaGF2aW9ycyB0byB3b3JrLiAqL1xyXG4gICAgLy8gT24gdGFyZ2V0LXRhYiBsaW5rc1xyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2EudGFyZ2V0LXRhYicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGhlcmVJc1RhYiA9IFRhYmJlZFVYLmdldFRhYigkKHRoaXMpLmF0dHIoJ2hyZWYnKSk7XHJcbiAgICAgICAgaWYgKHRoZXJlSXNUYWIpIHtcclxuICAgICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGhlcmVJc1RhYik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIE9uIGhhc2ggY2hhbmdlXHJcbiAgICBpZiAoJC5mbi5oYXNoY2hhbmdlKVxyXG4gICAgICAgICQod2luZG93KS5oYXNoY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCEvXiMhLy50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGhlcmVJc1RhYiA9IFRhYmJlZFVYLmdldFRhYihsb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGVyZUlzVGFiKVxyXG4gICAgICAgICAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRoZXJlSXNUYWIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gSE9NRSBQQUdFIC8gU0VBUkNIIFNUVUZGXHJcbiAgICBob21lUGFnZS5pbml0KCk7XHJcblxyXG4gICAgLy8gVmFsaWRhdGlvbiBhdXRvIHNldHVwIGZvciBwYWdlIHJlYWR5IGFuZCBhZnRlciBldmVyeSBhamF4IHJlcXVlc3RcclxuICAgIC8vIGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgZm9ybSBpbiB0aGUgcGFnZS5cclxuICAgIC8vIFRoaXMgYXZvaWQgdGhlIG5lZWQgZm9yIGV2ZXJ5IHBhZ2Ugd2l0aCBmb3JtIHRvIGRvIHRoZSBzZXR1cCBpdHNlbGZcclxuICAgIC8vIGFsbW9zdCBmb3IgbW9zdCBvZiB0aGUgY2FzZS5cclxuICAgIGZ1bmN0aW9uIGF1dG9TZXR1cFZhbGlkYXRpb24oKSB7XHJcbiAgICAgICAgaWYgKCQoZG9jdW1lbnQpLmhhcygnZm9ybScpLmxlbmd0aClcclxuICAgICAgICAgICAgdmFsaWRhdGlvbkhlbHBlci5zZXR1cCgnZm9ybScpO1xyXG4gICAgfVxyXG4gICAgYXV0b1NldHVwVmFsaWRhdGlvbigpO1xyXG4gICAgJChkb2N1bWVudCkuYWpheENvbXBsZXRlKGF1dG9TZXR1cFZhbGlkYXRpb24pO1xyXG5cclxuICAgIC8vIFRPRE86IHVzZWQgc29tZSB0aW1lPyBzdGlsbCByZXF1aXJlZCB1c2luZyBtb2R1bGVzP1xyXG4gICAgLypcclxuICAgICogQ29tbXVuaWNhdGUgdGhhdCBzY3JpcHQuanMgaXMgcmVhZHkgdG8gYmUgdXNlZFxyXG4gICAgKiBhbmQgdGhlIGNvbW1vbiBMQyBsaWIgdG9vLlxyXG4gICAgKiBCb3RoIGFyZSBlbnN1cmVkIHRvIGJlIHJhaXNlZCBldmVyIGFmdGVyIHBhZ2UgaXMgcmVhZHkgdG9vLlxyXG4gICAgKi9cclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAudHJpZ2dlcignbGNTY3JpcHRSZWFkeScpXHJcbiAgICAudHJpZ2dlcignbGNMaWJSZWFkeScpO1xyXG59KTsiLCIvKioqKiogQVZBSUxBQklMSVRZIENBTEVOREFSIFdJREdFVCAqKioqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi4vTEMvc21vb3RoQm94QmxvY2snKSxcclxuICAgIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZycpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkucmVsb2FkJyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0QXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5jYWxlbmRhci1jb250cm9scyAuYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCR0Lmhhc0NsYXNzKCd6b29tLWFjdGlvbicpKSB7XHJcbiAgICAgICAgICAgIC8vIERvIHpvb21cclxuICAgICAgICAgICAgdmFyIGMgPSAkdC5jbG9zZXN0KCcuYXZhaWxhYmlsaXR5LWNhbGVuZGFyJykuZmluZCgnLmNhbGVuZGFyJykuY2xvbmUoKTtcclxuICAgICAgICAgICAgYy5jc3MoJ2ZvbnQtc2l6ZScsICcycHgnKTtcclxuICAgICAgICAgICAgdmFyIHRhYiA9ICR0LmNsb3Nlc3QoJy50YWItYm9keScpO1xyXG4gICAgICAgICAgICBjLmRhdGEoJ3BvcHVwLWNvbnRhaW5lcicsIHRhYik7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgdGFiLCAnYXZhaWxhYmlsaXR5LWNhbGVuZGFyJywgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgLy8gTm90aGluZyBtb3JlXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTmF2aWdhdGUgY2FsZW5kYXJcclxuICAgICAgICB2YXIgbmV4dCA9ICR0Lmhhc0NsYXNzKCduZXh0LXdlZWstYWN0aW9uJyk7XHJcbiAgICAgICAgdmFyIGNvbnQgPSAkdC5jbG9zZXN0KCcuYXZhaWxhYmlsaXR5LWNhbGVuZGFyJyk7XHJcbiAgICAgICAgdmFyIGNhbGNvbnQgPSBjb250LmNoaWxkcmVuKCcuY2FsZW5kYXItY29udGFpbmVyJyk7XHJcbiAgICAgICAgdmFyIGNhbCA9IGNhbGNvbnQuY2hpbGRyZW4oJy5jYWxlbmRhcicpO1xyXG4gICAgICAgIHZhciBjYWxpbmZvID0gY29udC5maW5kKCcuY2FsZW5kYXItaW5mbycpO1xyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoY2FsLmRhdGEoJ3Nob3dlZC1kYXRlJykpO1xyXG4gICAgICAgIHZhciB1c2VySWQgPSBjYWwuZGF0YSgndXNlci1pZCcpO1xyXG4gICAgICAgIGlmIChuZXh0KVxyXG4gICAgICAgICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyA3KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSAtIDcpO1xyXG4gICAgICAgIHZhciBzdHJkYXRlID0gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nKGRhdGUpO1xyXG4gICAgICAgIHZhciB1cmwgPSBiYXNlVXJsICsgXCJQcm9maWxlLyRBdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC9XZWVrL1wiICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cmRhdGUpICsgXCIvP1VzZXJJRD1cIiArIHVzZXJJZDtcclxuICAgICAgICBjYWxjb250LnJlbG9hZCh1cmwsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBuZXcgb2JqZWN0OlxyXG4gICAgICAgICAgICB2YXIgY2FsID0gJCgnLmNhbGVuZGFyJywgdGhpcy5lbGVtZW50KTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcueWVhci13ZWVrJykudGV4dChjYWwuZGF0YSgnc2hvd2VkLXdlZWsnKSk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLmZpcnN0LXdlZWstZGF5JykudGV4dChjYWwuZGF0YSgnc2hvd2VkLWZpcnN0LWRheScpKTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcubGFzdC13ZWVrLWRheScpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC1sYXN0LWRheScpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIEZBUXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIGZhcXNCYXNlVXJsID0gJ0hlbHBDZW50ZXIvJEZBUXMnO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gIGZhcXNCYXNlVXJsID0gKGJhc2VVcmwgfHwgJy8nKSArIGZhcXNCYXNlVXJsO1xyXG5cclxuICAvLyBFbmFibGUgRkFRcyBsaW5rcyBpbiBwb3B1cFxyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhW2hyZWZ8PVwiI0ZBUXNcIl0nLCBwb3B1cEZhcXMpO1xyXG5cclxuICAvLyBBdXRvIG9wZW4gY3VycmVudCBkb2N1bWVudCBsb2NhdGlvbiBpZiBoYXNoIGlzIGEgRkFRIGxpbmtcclxuICBpZiAoL14jRkFRcy9pLnRlc3QobG9jYXRpb24uaGFzaCkpIHtcclxuICAgIHBvcHVwRmFxcyhsb2NhdGlvbi5oYXNoKTtcclxuICB9XHJcblxyXG4gIC8vIHJldHVybiBhcyB1dGlsaXR5XHJcbiAgcmV0dXJuIHBvcHVwRmFxcztcclxufTtcclxuXHJcbi8qIFBhc3MgYSBGYXFzIEB1cmwgb3IgdXNlIGFzIGEgbGluayBoYW5kbGVyIHRvIG9wZW4gdGhlIEZBUSBpbiBhIHBvcHVwXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3B1cEZhcXModXJsKSB7XHJcbiAgdXJsID0gdHlwZW9mICh1cmwpID09PSAnc3RyaW5nJyA/IHVybCA6ICQodGhpcykuYXR0cignaHJlZicpO1xyXG5cclxuICB2YXIgdXJscGFydHMgPSB1cmwuc3BsaXQoJy0nKTtcclxuXHJcbiAgaWYgKHVybHBhcnRzWzBdICE9ICcjRkFRcycpIHtcclxuICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ1RoZSBVUkwgaXMgbm90IGEgRkFRIHVybCAoZG9lc25cXCd0IHN0YXJ0cyB3aXRoICNGQVFzLSknLCB1cmwpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICB2YXIgdXJsc2VjdGlvbiA9IHVybHBhcnRzLmxlbmd0aCA+IDEgPyB1cmxwYXJ0c1sxXSA6ICcnO1xyXG5cclxuICBpZiAodXJsc2VjdGlvbikge1xyXG4gICAgdmFyIHB1cCA9IHBvcHVwKGZhcXNCYXNlVXJsICsgdXJsc2VjdGlvbiwgJ2xhcmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgZCA9ICQodXJsKSxcclxuICAgICAgICBwZWwgPSBwdXAuZ2V0Q29udGVudEVsZW1lbnQoKTtcclxuICAgICAgcGVsLnNjcm9sbFRvcChwZWwuc2Nyb2xsVG9wKCkgKyBkLnBvc2l0aW9uKCkudG9wIC0gNTApO1xyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBkLmVmZmVjdChcImhpZ2hsaWdodFwiLCB7fSwgMjAwMCk7XHJcbiAgICAgIH0sIDQwMCk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59IiwiLyogSU5JVCAqL1xyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBMb2NhdGlvbiBqcy1kcm9wZG93blxyXG4gICAgdmFyIHMgPSAkKCcjc2VhcmNoLWxvY2F0aW9uJyk7XHJcbiAgICBzLnByb3AoJ3JlYWRvbmx5JywgdHJ1ZSk7XHJcbiAgICBzLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgc291cmNlOiBMQy5zZWFyY2hMb2NhdGlvbnMsXHJcbiAgICAgICAgYXV0b0ZvY3VzOiB0cnVlLFxyXG4gICAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcy5vbignZm9jdXMgY2xpY2snLCBmdW5jdGlvbiAoKSB7IHMuYXV0b2NvbXBsZXRlKCdzZWFyY2gnLCAnJyk7IH0pO1xyXG5cclxuICAgIC8qIFBvc2l0aW9ucyBhdXRvY29tcGxldGUgKi9cclxuICAgIHZhciBwb3NpdGlvbnNBdXRvY29tcGxldGUgPSAkKCcjc2VhcmNoLXNlcnZpY2UnKS5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAvLyBXZSB3YW50IHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAgICAgICAvLyQodGhpcykudmFsKHVpLml0ZW0ubGFiZWwpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb2N1czogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICAvLyBXZSB3YW50IHRoZSBsYWJlbCBpbiB0ZXh0Ym94LCBub3QgdGhlIHZhbHVlXHJcbiAgICAgICAgICAgIC8vJCh0aGlzKS52YWwodWkuaXRlbS5sYWJlbCk7XHJcbiAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIExvYWQgYWxsIHBvc2l0aW9ucyBpbiBiYWNrZ3JvdW5kIHRvIHJlcGxhY2UgdGhlIGF1dG9jb21wbGV0ZSBzb3VyY2UgKGF2b2lkaW5nIG11bHRpcGxlLCBzbG93IGxvb2stdXBzKVxyXG4gICAgLyokLmdldEpTT04oTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgIHBvc2l0aW9uc0F1dG9jb21wbGV0ZS5hdXRvY29tcGxldGUoJ29wdGlvbicsICdzb3VyY2UnLCBkYXRhKTtcclxuICAgIH1cclxuICAgICk7Ki9cclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIHNvbWUgTGVnYWwgcGFnZXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudClcclxuICAgIC5vbignY2xpY2snLCAnLnZpZXctcHJpdmFjeS1wb2xpY3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcG9wdXAoYmFzZVVybCArICdIZWxwQ2VudGVyLyRQcml2YWN5UG9saWN5LycsICdsYXJnZScpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy52aWV3LXRlcm1zLW9mLXVzZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBwb3B1cChiYXNlVXJsICsgJ0hlbHBDZW50ZXIvJFRlcm1zT2ZVc2UvJywgJ2xhcmdlJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiogUHJvdmlkZXIgV2VsY29tZSBwYWdlXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBTaW1wbGVTbGlkZXIgPSByZXF1aXJlKCdMQy9TaW1wbGVTbGlkZXInKTtcclxuXHJcbmV4cG9ydHMuc2hvdyA9IGZ1bmN0aW9uIHByb3ZpZGVyV2VsY29tZSgpIHtcclxuICAkKCcuUHJvdmlkZXJXZWxjb21lIC5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgdCA9ICQodGhpcyksXHJcbiAgICAgIHNsaWRlciA9IG5ldyBTaW1wbGVTbGlkZXIoe1xyXG4gICAgICAgIGVsZW1lbnQ6IHQsXHJcbiAgICAgICAgc2VsZWN0b3JzOiB7XHJcbiAgICAgICAgICBzbGlkZXM6ICcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1zbGlkZXMnLFxyXG4gICAgICAgICAgc2xpZGU6ICcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1zbGlkZSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGN1cnJlbnRTbGlkZUNsYXNzOiAnanMtaXNDdXJyZW50JyxcclxuICAgICAgICBocmVmUHJlZml4OiAnZ29TbGlkZV8nLFxyXG4gICAgICAgIC8vIER1cmF0aW9uIG9mIGVhY2ggc2xpZGUgaW4gbWlsbGlzZWNvbmRzXHJcbiAgICAgICAgZHVyYXRpb246IDEwMDBcclxuICAgICAgfSk7XHJcblxyXG4gICAgLy8gU2xpZGUgc3RlcHMgYWN0aW9ucyBpbml0aWFsbHkgaGlkZGVuLCB2aXNpYmxlIGFmdGVyICdzdGFydCdcclxuICAgIHZhciBzbGlkZXNBY3Rpb25zID0gdC5maW5kKCcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1hY3Rpb25zLXNsaWRlcycpLmhpZGUoKTtcclxuICAgIHQuZmluZCgnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tYWN0aW9ucy1zdGFydCAuc3RhcnQtYWN0aW9uJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkKHRoaXMpLmhpZGUoKTtcclxuICAgICAgc2xpZGVzQWN0aW9ucy5mYWRlSW4oMTAwMCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiogV2VsY29tZSBwb3B1cFxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vLyBib290c3RyYXAgdG9vbHRpcHM6XHJcbnJlcXVpcmUoJ2Jvb3RzdHJhcCcpO1xyXG52YXIgQ29va2llID0gcmVxdWlyZSgnLi4vTEMvQ29va2llJyk7XHJcbi8vVE9ETyBtb3JlIGRlcGVuZGVuY2llcz9cclxuXHJcbnZhciBpbml0aWFsaXplZCA9IGZhbHNlO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFdlbGNvbWVQb3B1cCgpIHtcclxuXHJcbiAgZXhwb3J0cy5hdXRvU2hvdygpO1xyXG5cclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYS5zaWduLXVwLCBhLnJlZ2lzdGVyLCBhLm5lZWQtbG9naW4sIGJ1dHRvbi5uZWVkLWxvZ2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gUmVtb3ZlIGFueSBvcGVuZWQgcG9wdXAgKGl0IG92ZXJsYXlzIHRoZSB3ZWxjb21lcG9wdXApXHJcbiAgICAkLnVuYmxvY2tVSSgpO1xyXG5cclxuICAgIHJldHVybiAhZXhwb3J0cy5zaG93KCk7XHJcbiAgfSk7XHJcblxyXG59O1xyXG5cclxuZXhwb3J0cy5hdXRvU2hvdyA9IGZ1bmN0aW9uIGF1dG9TaG93V2VsY29tZVBvcHVwKCkge1xyXG4gIHZhciAkd3AgPSAkKCcjd2VsY29tZXBvcHVwJyk7XHJcbiAgdmFyICR3byA9ICQoJyN3ZWxjb21lLXBvcHVwLW92ZXJsYXknKTtcclxuXHJcbiAgLy8gV2hlbiB0aGUgcG9wdXAgaXMgaW50ZWdyYXRlZCBpbiB0aGUgcGFnZSBpbnN0ZWFkIG9mXHJcbiAgLy8gdGhlIGxheW91dCwgZXhlYyBzaG93IGFuZCBjbG9zZSBvcnBoYW4gb3ZlcmxheS5cclxuICBpZiAoJHdwLmxlbmd0aCAmJlxyXG4gICAgJHdwLmlzKCc6dmlzaWJsZScpICYmXHJcbiAgICAkd3AuY2xvc2VzdCgnI3dlbGNvbWUtcG9wdXAtb3ZlcmxheScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgJHdvLmhpZGUoKTtcclxuICAgIGV4cG9ydHMuc2hvdyh0cnVlKTtcclxuICAgIHJldHVybjtcclxuICB9IGVsc2UgaWYgKCR3by5oYXNDbGFzcygnYXV0by1zaG93JykpIHtcclxuICAgIGV4cG9ydHMuc2hvdyh0cnVlKTtcclxuICB9XHJcbn07XHJcblxyXG5leHBvcnRzLmluaXRQb3B1cCA9IGZ1bmN0aW9uIGluaXRQb3B1cCgpIHtcclxuXHJcbiAgICB2YXIgYyA9ICQoJyN3ZWxjb21lcG9wdXAnKTtcclxuICAgIGlmIChjLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIHZhciBvdmVybGF5ID0gYy5jbG9zZXN0KCcjd2VsY29tZS1wb3B1cC1vdmVybGF5Jyk7XHJcblxyXG4gICAgaWYgKGMuZGF0YSgnaXMtaW5pdGlhbGl6ZWQnKSkgcmV0dXJuIG92ZXJsYXk7XHJcblxyXG4gICAgLyoqXHJcbiAgICBHbyB0byB0aGUgZmlyc3Qgc3RlcCBvbiBhIGFscmVhZHkgaW5pdGlhbGl6ZWQgcG9wdXBcclxuICAgICoqL1xyXG4gICAgZnVuY3Rpb24gc3RhcnRBZ2FpbihhbmltYXRlKSB7XHJcbiAgICAgICAgLy8gUmV0dXJuIHBvcHVwIHRvIHRoZSBmaXJzdCBzdGVwIChjaG9vc2UgcHJvZmlsZSwgIzQ4NikgYW5kIGV4aXQgLWluaXQgaXMgcmVhZHktXHJcbiAgICAgICAgLy8gU2hvdyBmaXJzdCBzdGVwXHJcbiAgICAgICAgdmFyIHN0ZXAxID0gYy5maW5kKCcucHJvZmlsZS1jaG9pY2UsIGhlYWRlciAucHJlc2VudGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKGFuaW1hdGUpXHJcbiAgICAgICAgICAgIHN0ZXAxLnNsaWRlRG93bignbm9ybWFsJyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzdGVwMS5zaG93KCk7XHJcbiAgICAgICAgLy8gSGlkZSBzZWNvbmQgc3RlcFxyXG4gICAgICAgIHZhciBzdGVwMiA9IGMuZmluZCgnLnRlcm1zLCAucHJvZmlsZS1kYXRhJyk7XHJcbiAgICAgICAgaWYgKGFuaW1hdGUpXHJcbiAgICAgICAgICAgIHN0ZXAyLnNsaWRlVXAoJ25vcm1hbCcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc3RlcDIuaGlkZSgpO1xyXG5cclxuICAgICAgICAvLyBIaWRlIGJhY2stYWN0aW9uIGJ1dHRvblxyXG4gICAgICAgIGMuZmluZCgnLmJhY2stYWN0aW9uJykuaGlkZSgpO1xyXG4gICAgICAgIC8vIFJlc2V0IGhpZGRlbiBmaWVsZHMgcGVyIHByb2ZpbGUtdHlwZVxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaTpub3QoLnBvc2l0aW9uLWRlc2NyaXB0aW9uKScpLnNob3coKTtcclxuICAgICAgICAvLyBSZXNldCBjaG9vc2VuIHByb2ZpbGUtdHlwZVxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV0nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICAgIC8vIFJlc2V0IFVSTHMgcGVyIHByb2ZpbGUtdHlwZVxyXG4gICAgICAgIGMuZmluZCgnYS50ZXJtcy1vZi11c2UnKS5kYXRhKCd0b29sdGlwLXVybCcsIGZ1bmN0aW9uICgpIHsgcmV0dXJuICQodGhpcykuYXR0cignZGF0YS10b29sdGlwLXVybCcpOyB9KTtcclxuICAgICAgICAvLyBSZXNldCB2YWxpZGF0aW9uIHJ1bGVzXHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpIGlucHV0Om5vdChbdHlwZT1oaWRkZW5dKScpXHJcbiAgICAgICAgLmF0dHIoJ2RhdGEtdmFsJywgbnVsbClcclxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICBzdGFydEFnYWluKCk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpbml0aWFsaXplZCA9IHRydWU7XHJcblxyXG4gICAgLy8gY2xvc2UgYnV0dG9uIGxvZ2ljIGFuZCBvbmx5IHdoZW4gYXMgcG9wdXAgKGl0IGhhcyBvdmVybGF5KVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gYy5maW5kKCcuY2xvc2UtcG9wdXAsIFtocmVmPVwiI2Nsb3NlLXBvcHVwXCJdJyk7XHJcbiAgICBpZiAob3ZlcmxheS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgY2xvc2VCdXR0b24uaGlkZSgpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGNsb3NlQnV0dG9uLnNob3coKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIG92ZXJsYXkuZmFkZU91dCgnbm9ybWFsJyk7XHJcbiAgICAgICAgICAgIENvb2tpZS5zZXQoJ1dlbGNvbWVQb3B1cFZpc2libGUnLCAnZmFsc2UnKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIGdvIGJhY2sgYnV0dG9uXHJcbiAgICBjLmZpbmQoJy5iYWNrLWFjdGlvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgc3RhcnRBZ2Fpbih0cnVlKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBQb3BvdmVycyBmb3IgdG9vbHRpcCByZXBsYWNlbWVudFxyXG4gICAgYy5maW5kKCdbZGF0YS10b2dnbGU9XCJwb3BvdmVyXCJdJylcclxuICAgIC5wb3BvdmVyKClcclxuICAgIC5maWx0ZXIoJ2FbaHJlZj1cIiNcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIC8vIEF2b2lkIG5hdmlnYXRlIHRvIHRoZSBsaW5rXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHNraXBTdGVwMSA9IGMuaGFzQ2xhc3MoJ3NlbGVjdC1wb3NpdGlvbicpO1xyXG5cclxuICAgIC8vIEluaXRcclxuICAgIGlmICghc2tpcFN0ZXAxKSB7XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhLCAudGVybXMsIC5wb3NpdGlvbi1kZXNjcmlwdGlvbicpLmhpZGUoKTtcclxuICAgIH1cclxuICAgIGMuZmluZCgnZm9ybScpLmdldCgwKS5yZXNldCgpO1xyXG5cclxuICAgIC8vIERlc2NyaXB0aW9uIHNob3ctdXAgb24gYXV0b2NvbXBsZXRlIHZhcmlhdGlvbnNcclxuICAgIHZhciBzaG93UG9zaXRpb25EZXNjcmlwdGlvbiA9IHtcclxuICAgICAgICAvKipcclxuICAgICAgICBTaG93IGRlc2NyaXB0aW9uIGluIGEgdGV4dGFyZWEgdW5kZXIgdGhlIHBvc2l0aW9uIHNpbmd1bGFyLFxyXG4gICAgICAgIGl0cyBzaG93ZWQgb24gZGVtYW5kLlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHRleHRhcmVhOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIGMuZmluZCgnLnBvc2l0aW9uLWRlc2NyaXB0aW9uJylcclxuICAgICAgICAgICAgLnNsaWRlRG93bignZmFzdCcpXHJcbiAgICAgICAgICAgIC5maW5kKCd0ZXh0YXJlYScpLnZhbCh1aS5pdGVtLmRlc2NyaXB0aW9uKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgIFNob3cgZGVzY3JpcHRpb24gaW4gYSB0b29sdGlwIHRoYXQgY29tZXMgZnJvbSB0aGUgcG9zaXRpb24gc2luZ3VsYXJcclxuICAgICAgICBmaWVsZFxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHRvb2x0aXA6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgLy8gSXQgbmVlZHMgdG8gYmUgZGVzdHJveWVkIChubyBwcm9ibGVtIHRoZSBmaXJzdCB0aW1lKVxyXG4gICAgICAgICAgICAvLyB0byBnZXQgaXQgdXBkYXRlZCBvbiBzdWNjZXNpdmUgYXR0ZW1wdHNcclxuICAgICAgICAgICAgdmFyIGVsID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgZWxcclxuICAgICAgICAgICAgLnBvcG92ZXIoJ2Rlc3Ryb3knKVxyXG4gICAgICAgICAgICAucG9wb3Zlcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0RvZXMgdGhpcyBzb3VuZCBsaWtlIHlvdT8nLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogdWkuaXRlbS5kZXNjcmlwdGlvbixcclxuICAgICAgICAgICAgICAgIHRyaWdnZXI6ICdmb2N1cycsXHJcbiAgICAgICAgICAgICAgICAvLyBEaWZmZXJlbnQgcGxhY2VtZW50IGZvciBtb2JpbGUgZGVzaWduICh1cCB0byA2NDBweCB3aWRlKSB0byBhdm9pZCBiZWluZyBoaWRkZW5cclxuICAgICAgICAgICAgICAgIHBsYWNlbWVudDogJCgnaHRtbCcpLndpZHRoKCkgPCA2NDAgPyAndG9wJyA6ICdsZWZ0J1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAucG9wb3Zlcignc2hvdycpXHJcbiAgICAgICAgICAgIC8vIEhpZGUgb24gcG9zc2libGUgcG9zaXRpb24gbmFtZSBjaGFuZ2UgdG8gYXZvaWQgY29uZnVzaW9uc1xyXG4gICAgICAgICAgICAvLyAod2UgY2FuJ3QgdXNlIG9uLWNoYW5nZSwgbmVlZCB0byBiZSBrZXlwcmVzczsgaXRzIG5hbWVzcGFjZWRcclxuICAgICAgICAgICAgLy8gdG8gbGV0IG9mZiBhbmQgb24gZXZlcnkgdGltZSB0byBhdm9pZCBtdWx0aXBsZSBoYW5kbGVyIHJlZ2lzdHJhdGlvbnMpXHJcbiAgICAgICAgICAgIC5vZmYoJ2tleXByZXNzLmRlc2NyaXB0aW9uLXRvb2x0aXAnKVxyXG4gICAgICAgICAgICAub24oJ2tleXByZXNzLmRlc2NyaXB0aW9uLXRvb2x0aXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBlbC5wb3BvdmVyKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gUmUtZW5hYmxlIGF1dG9jb21wbGV0ZTpcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBjLmZpbmQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpOyB9LCA1MDApO1xyXG4gICAgZnVuY3Rpb24gc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzZWxldENhbGxiYWNrKSB7XHJcbiAgICAgICAgYy5maW5kKCdbbmFtZT1qb2J0aXRsZV0nKS5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgICAgICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgICAgICAgICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgIC8vIE5vIHZhbHVlLCBubyBhY3Rpb24gOihcclxuICAgICAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0udmFsdWUpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGlkICh2YWx1ZSkgaW4gdGhlIGhpZGRlbiBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICBjLmZpbmQoJ1tuYW1lPXBvc2l0aW9uaWRdJykudmFsKHVpLml0ZW0udmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGV0Q2FsbGJhY2suY2FsbCh0aGlzLCBldmVudCwgdWkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgdG8gc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcikgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzaG93UG9zaXRpb25EZXNjcmlwdGlvbi50b29sdGlwKTtcclxuICAgIGMuZmluZCgnI3dlbGNvbWVwb3B1cExvYWRpbmcnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBBY3Rpb25zXHJcbiAgICBmdW5jdGlvbiBzaG93U3RlcDIoYW5pbWF0ZSkge1xyXG5cclxuICAgICAgICB2YXIgJHByb2ZpbGUgPSBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdOmNoZWNrZWQnKTtcclxuICAgICAgICB2YXIgcHJvZmlsZSA9ICRwcm9maWxlLnZhbCgpO1xyXG5cclxuICAgICAgICAvLyBTaG93IGJhY2stYWN0aW9uIGJ1dHRvblxyXG4gICAgICAgIGMuZmluZCgnLmJhY2stYWN0aW9uJykuc2hvdygpO1xyXG5cclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGk6bm90KC4nICsgcHJvZmlsZSArICcpJykuaGlkZSgpO1xyXG4gICAgICAgIHZhciAkcHJlc2VudGF0aW9uID0gYy5maW5kKCcucHJvZmlsZS1jaG9pY2UsIGhlYWRlciAucHJlc2VudGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKGFuaW1hdGUpXHJcbiAgICAgICAgICAgICRwcmVzZW50YXRpb24uc2xpZGVVcCgnbm9ybWFsJyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAkcHJlc2VudGF0aW9uLmhpZGUoKTtcclxuXHJcbiAgICAgICAgdmFyICRwcm9mRGF0YSA9IGMuZmluZCgnLnRlcm1zLCAucHJvZmlsZS1kYXRhJyk7XHJcbiAgICAgICAgaWYgKGFuaW1hdGUpXHJcbiAgICAgICAgICAgICRwcm9mRGF0YS5zbGlkZURvd24oJ25vcm1hbCcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJHByb2ZEYXRhLnNob3coKTtcclxuXHJcbiAgICAgICAgLy8gVGVybXMgb2YgdXNlIGRpZmZlcmVudCBmb3IgcHJvZmlsZSB0eXBlXHJcbiAgICAgICAgaWYgKHByb2ZpbGUgPT0gJ2N1c3RvbWVyJylcclxuICAgICAgICAgICAgYy5maW5kKCdhLnRlcm1zLW9mLXVzZScpLmRhdGEoJ3Rvb2x0aXAtdXJsJywgbnVsbCk7XHJcbiAgICAgICAgLy8gQ2hhbmdlIGZhY2Vib29rIHJlZGlyZWN0IGxpbmtcclxuICAgICAgICB2YXIgZmJjID0gYy5maW5kKCcuZmFjZWJvb2stY29ubmVjdCcpO1xyXG4gICAgICAgIHZhciBhZGRSZWRpcmVjdCA9ICdjdXN0b21lcnMnO1xyXG4gICAgICAgIGlmIChwcm9maWxlID09ICdwcm92aWRlcicpXHJcbiAgICAgICAgICAgIGFkZFJlZGlyZWN0ID0gJ3Byb3ZpZGVycyc7XHJcbiAgICAgICAgZmJjLmRhdGEoJ3JlZGlyZWN0JywgZmJjLmRhdGEoJ3JlZGlyZWN0JykgKyBhZGRSZWRpcmVjdCk7XHJcbiAgICAgICAgZmJjLmRhdGEoJ3Byb2ZpbGUnLCBwcm9maWxlKTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHZhbGlkYXRpb24tcmVxdWlyZWQgZm9yIGRlcGVuZGluZyBvZiBwcm9maWxlLXR5cGUgZm9ybSBlbGVtZW50czpcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGkuJyArIHByb2ZpbGUgKyAnIGlucHV0Om5vdChbZGF0YS12YWxdKTpub3QoW3R5cGU9aGlkZGVuXSknKVxyXG4gICAgICAgIC5hdHRyKCdkYXRhLXZhbC1yZXF1aXJlZCcsICcnKVxyXG4gICAgICAgIC5hdHRyKCdkYXRhLXZhbCcsIHRydWUpO1xyXG5cclxuICAgICAgICAvLyBpZiBGYWNlYm9vayBDb25uZWN0IGlzIGluIHVzZSwgdXBkYXRlIGZpZWxkcyBhbmQgdmFsaWRhdGlvbnNcclxuICAgICAgICBmYWNlYm9va1VwZGF0ZUZpZWxkc1N0YXR1cyhjKTtcclxuXHJcbiAgICAgICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgICB9XHJcbiAgICBjLm9uKCdjaGFuZ2UnLCAnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV0nLCBzaG93U3RlcDIuYmluZChudWxsLCB0cnVlKSk7XHJcbiAgICBjLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLmFqYXgnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzaG93UG9zaXRpb25EZXNjcmlwdGlvbi50b29sdGlwKTtcclxuICAgICAgICBzaG93U3RlcDIoZmFsc2UpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSWYgcHJvZmlsZSB0eXBlIGlzIHByZWZpbGxlZCBieSByZXF1ZXN0LCBzaG93IHN0ZXAyIGFscmVhZHk6XHJcbiAgICBpZiAoYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXTpjaGVja2VkJykubGVuZ3RoKVxyXG4gICAgICAgIHNob3dTdGVwMihmYWxzZSk7XHJcblxyXG4gICAgYy5vbignY2xpY2snLCAnLmZhY2Vib29rLWNvbm5lY3QnLCBmYWNlYm9va0Nvbm5lY3QuYmluZChudWxsLCBjKSk7XHJcblxyXG4gICAgYy5kYXRhKCdpcy1pbml0aWFsaXplZCcsIHRydWUpO1xyXG4gICAgcmV0dXJuIG92ZXJsYXk7XHJcbn07XHJcblxyXG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbiBzaG93UG9wdXAoZnJvbUF1dG9TaG93KSB7XHJcblxyXG4gICAgdmFyIG92ZXJsYXkgPSBleHBvcnRzLmluaXRQb3B1cCgpO1xyXG5cclxuICAgIGlmIChvdmVybGF5ICYmIG92ZXJsYXkubGVuZ3RoKSB7XHJcbiAgICAgICAgLy8gSXRzIGEgY29va2llIHdhcyBzZXQgdG8gcmVtZW1iZXIgdGhlIHBvcHVwIHdhcyBjbG9zZWRcclxuICAgICAgICAvLyAoYmVjYXVzZSB3YXMgY2xvc2FibGUpLCBhdm9pZCB0byBzaG93IGl0XHJcbiAgICAgICAgaWYgKCFmcm9tQXV0b1Nob3cgfHxcclxuICAgICAgICAgICAgQ29va2llLmdldCgnV2VsY29tZVBvcHVwVmlzaWJsZScpICE9PSAnZmFsc2UnKSB7XHJcbiAgICAgICAgICAgIG92ZXJsYXkuZmFkZUluKDMwMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBBbGwgZmluZVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgZWxzZSByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICAgIEF0dGVtcHQgdG8gbG9naW4gd2l0aCBGYWNlYm9vayBDb25uZWN0LCBcclxuICAgIGFuZCBmaWxsIHRoZSBmb3JtIHdpdGggdGhlIGRhdGEgZnJvbSBGYWNlYm9va1xyXG4qKi9cclxuZnVuY3Rpb24gZmFjZWJvb2tDb25uZWN0KCRjb250YWluZXIpIHtcclxuICAgIHZhciBmYiA9IHJlcXVpcmUoJy4uL0xDL2ZhY2Vib29rVXRpbHMnKTtcclxuXHJcbiAgICBmYi5sb2dpbih7IHNjb3BlOiAnZW1haWwsdXNlcl9hYm91dF9tZScgfSwgZnVuY3Rpb24gKGF1dGgsIEZCKSB7XHJcbiAgICAgICAgLy8gU2V0IEZhY2Vib29rSWQgdG8gbGluayBhY2NvdW50czpcclxuICAgICAgICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiZmFjZWJvb2tpZFwiXScpLnZhbChhdXRoLnVzZXJJRCk7XHJcbiAgICAgICAgLy8gUmVxdWVzdCBtb3JlIHVzZXIgZGF0YVxyXG4gICAgICAgIEZCLmFwaSgnL21lJywgZnVuY3Rpb24gKHVzZXIpIHtcclxuICAgICAgICAgICAgLy9GaWxsIERhdGFcclxuICAgICAgICAgICAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImVtYWlsXCJdJykudmFsKHVzZXIuZW1haWwpO1xyXG4gICAgICAgICAgICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiZmlyc3RuYW1lXCJdJykudmFsKHVzZXIuZmlyc3RfbmFtZSk7XHJcbiAgICAgICAgICAgICRjb250YWluZXIuZmluZCgnW25hbWU9XCJsYXN0bmFtZVwiXScpLnZhbCh1c2VyLmxhc3RfbmFtZSk7XHJcbiAgICAgICAgICAgICRjb250YWluZXIuZmluZCgnW25hbWU9XCJnZW5kZXJcIl0nKS52YWwodXNlci5nZW5kZXIpO1xyXG4gICAgICAgICAgICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiYWJvdXRcIl0nKS52YWwodXNlci5hYm91dCk7XHJcblxyXG4gICAgICAgICAgICBmYWNlYm9va1VwZGF0ZUZpZWxkc1N0YXR1cygkY29udGFpbmVyKTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBJdCB0cmlnZ2VycyBhbiB1cGRhdGUgb24gdGhlIHN0YXR1cyBvZiBmaWVsZHMgYWZmZWN0ZWRcclxuICAgIGJ5IGEgRmFjZWJvb2sgQ29ubmVjdDogc29tZSBtdXN0IGJlIGhpZGRlbiwgb3RoZXJzIHNob3dlZCxcclxuICAgIHNvbWUgbm90ZXMgYXBwZWFyIGFuZCBzb21lIGZpZWxkIGJlY29tZXMgb3B0aW9uYWwuXHJcbiAgICBJZiB0aGVyZSBpcyBubyBhbiBhY3RpdmUgRmFjZWJvb2sgQ29ubmVjdGlvbi9JZCwgaXRcclxuICAgIGRvZXMgbm90aGluZyBhbmQgcmV0dXJuIGZhbHNlLlxyXG4qKi9cclxuZnVuY3Rpb24gZmFjZWJvb2tVcGRhdGVGaWVsZHNTdGF0dXMoJGNvbnRhaW5lcikge1xyXG5cclxuICAgIC8vIGlmIEZhY2Vib29rIENvbm5lY3QgaXMgaW4gdXNlXHJcbiAgICBpZiAoJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImZhY2Vib29raWRcIl0nKS52YWwoKSkge1xyXG4gICAgICAgIC8vIHJlbW92ZSB2YWxpZGF0aW9uIG9uIHBhc3N3b3JkXHJcbiAgICAgICAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImNyZWF0ZS1wYXNzd29yZFwiXScpXHJcbiAgICAgICAgICAgIC5hdHRyKCdkYXRhLXZhbC1yZXF1aXJlZCcsIG51bGwpXHJcbiAgICAgICAgICAgIC5hdHRyKCdkYXRhLXZhbCcsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgdmFyIGZlbWFpbCA9ICRjb250YWluZXIuZmluZCgnW25hbWU9XCJlbWFpbFwiXScpO1xyXG4gICAgICAgIHZhciBmZmlyc3QgPSAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiZmlyc3RuYW1lXCJdJyk7XHJcbiAgICAgICAgdmFyIGZsYXN0ID0gJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImxhc3R0bmFtZVwiXScpO1xyXG5cclxuICAgICAgICAvLyBIaWRlIGRhdGEgc3VjY2Vzc2Z1bGx5IGZpbGxlZFxyXG4gICAgICAgIGlmIChmZmlyc3QudmFsKCkpXHJcbiAgICAgICAgICAgIGZmaXJzdC5jbG9zZXN0KCdsaScpLmhpZGUoKTtcclxuICAgICAgICBpZiAoZmxhc3QudmFsKCkpXHJcbiAgICAgICAgICAgIGZsYXN0LmNsb3Nlc3QoJ2xpJykuaGlkZSgpO1xyXG5cclxuICAgICAgICAvLyBFbWFpbCBpcyBzcGVjaWFsLCByZXF1aXJlcyBjb25maXJtYXRpb24gIzUzOCxcclxuICAgICAgICAvLyBzaG93aW5nIGFkZGl0aW9uYWwgbWVzc2FnZSxcclxuICAgICAgICBmZW1haWwuc2libGluZ3MoJy5mYWNlYm9vay1ub3RlJykuc2hvdygpO1xyXG5cclxuICAgICAgICAvLyBNZXNzYWdlIHRvIG5vdGlmaWVkIHVzZXIgaXMgY29ubmVjdGVkIHdpdGggRmFjZWJvb2tcclxuICAgICAgICAkY29udGFpbmVyLmZpbmQoJy5mYWNlYm9vay1sb2dnZWQnKS5zaG93KCk7XHJcbiAgICAgICAgLy8gYW5kIGhpZGRpbmcgdGhlIGJ1dHRvblxyXG4gICAgICAgICRjb250YWluZXIuZmluZCgnLmZhY2Vib29rLWNvbm5lY3QnKS5oaWRlKCk7XHJcblxyXG4gICAgICAgIC8vIFBhc3N3b3JkIGlzIHNwZWNpYWwgdG9vLCBubyBuZWVkZWQgd2l0aCBGYWNlYm9va1xyXG4gICAgICAgICRjb250YWluZXIuZmluZCgnW25hbWU9XCJjcmVhdGUtcGFzc3dvcmRcIl0nKS5jbG9zZXN0KCdsaScpLmhpZGUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn0iLCJcblxuXG4vKlxuKiBAdmVyc2lvbiAgMC41LjBcbiogQGF1dGhvciAgIExhdXJpIFJvb2RlbiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9saXRlanMvZGF0ZS1mb3JtYXQtbGl0ZVxuKiBAbGljZW5zZSAgTUlUIExpY2Vuc2UgIC0gaHR0cDovL2xhdXJpLnJvb2Rlbi5lZS9taXQtbGljZW5zZS50eHRcbiovXG5cblxuXG4hZnVuY3Rpb24oRGF0ZSwgcHJvdG8pIHtcblx0dmFyIG1hc2tSZSA9IC8oW1wiJ10pKCg/OlteXFxcXF18XFxcXC4pKj8pXFwxfFlZWVl8KFtNRF0pXFwzXFwzKFxcMz8pfFNTfChbWU1ESGhtc1ddKShcXDU/KXxbdVVBWlN3b10vZ1xuXHQsIHllYXJGaXJzdFJlID0gLyhcXGR7NH0pWy0uXFwvXShcXGRcXGQ/KVstLlxcL10oXFxkXFxkPykvXG5cdCwgZGF0ZUZpcnN0UmUgPSAvKFxcZFxcZD8pWy0uXFwvXShcXGRcXGQ/KVstLlxcL10oXFxkezR9KS9cblx0LCB0aW1lUmUgPSAvKFxcZFxcZD8pOihcXGRcXGQpOj8oXFxkXFxkKT9cXC4/KFxcZHszfSk/KD86XFxzKig/OihhKXwocCkpXFwuP21cXC4/KT8oXFxzKig/Olp8R01UfFVUQyk/KD86KFstK11cXGRcXGQpOj8oXFxkXFxkKT8pPyk/L2lcblx0LCB3b3JkUmUgPSAvLlthLXpdKy9nXG5cdCwgdW5lc2NhcGVSZSA9IC9cXFxcKC4pL2dcblx0Ly8sIGlzb0RhdGVSZSA9IC8oXFxkezR9KVstLlxcL11XKFxcZFxcZD8pWy0uXFwvXShcXGQpL1xuXHRcblxuXHQvLyBJU08gODYwMSBzcGVjaWZpZXMgbnVtZXJpYyByZXByZXNlbnRhdGlvbnMgb2YgZGF0ZSBhbmQgdGltZS5cblx0Ly9cblx0Ly8gVGhlIGludGVybmF0aW9uYWwgc3RhbmRhcmQgZGF0ZSBub3RhdGlvbiBpc1xuXHQvLyBZWVlZLU1NLUREXG5cdC8vXG5cdC8vIFRoZSBpbnRlcm5hdGlvbmFsIHN0YW5kYXJkIG5vdGF0aW9uIGZvciB0aGUgdGltZSBvZiBkYXkgaXNcblx0Ly8gaGg6bW06c3Ncblx0Ly9cblx0Ly8gVGltZSB6b25lXG5cdC8vXG5cdC8vIFRoZSBzdHJpbmdzICtoaDptbSwgK2hobW0sIG9yICtoaCAoYWhlYWQgb2YgVVRDKVxuXHQvLyAtaGg6bW0sIC1oaG1tLCBvciAtaGggKHRpbWUgem9uZXMgd2VzdCBvZiB0aGUgemVybyBtZXJpZGlhbiwgd2hpY2ggYXJlIGJlaGluZCBVVEMpXG5cdC8vXG5cdC8vIDEyOjAwWiA9IDEzOjAwKzAxOjAwID0gMDcwMC0wNTAwXG5cdFxuXHREYXRlW3Byb3RvXS5mb3JtYXQgPSBmdW5jdGlvbihtYXNrKSB7XG5cdFx0bWFzayA9IERhdGUubWFza3NbbWFza10gfHwgbWFzayB8fCBEYXRlLm1hc2tzW1wiZGVmYXVsdFwiXVxuXG5cdFx0dmFyIHNlbGYgPSB0aGlzXG5cdFx0LCBnZXQgPSBcImdldFwiICsgKG1hc2suc2xpY2UoMCw0KSA9PSBcIlVUQzpcIiA/IChtYXNrPW1hc2suc2xpY2UoNCksIFwiVVRDXCIpOlwiXCIpXG5cblx0XHRyZXR1cm4gbWFzay5yZXBsYWNlKG1hc2tSZSwgZnVuY3Rpb24obWF0Y2gsIHF1b3RlLCB0ZXh0LCBNRCwgTUQ0LCBzaW5nbGUsIHBhZCkge1xuXHRcdFx0dGV4dCA9IHNpbmdsZSA9PSBcIllcIiAgID8gc2VsZltnZXQgKyBcIkZ1bGxZZWFyXCJdKCkgJSAxMDBcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJZWVlZXCIgPyBzZWxmW2dldCArIFwiRnVsbFllYXJcIl0oKVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJNXCIgICA/IHNlbGZbZ2V0ICsgXCJNb250aFwiXSgpKzFcblx0XHRcdFx0IDogTUQgICAgID09IFwiTVwiID8gRGF0ZS5tb250aE5hbWVzWyBzZWxmW2dldCArIFwiTW9udGhcIl0oKSsoTUQ0ID8gMTIgOiAwKSBdXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcIkRcIiAgID8gc2VsZltnZXQgKyBcIkRhdGVcIl0oKVxuXHRcdFx0XHQgOiBNRCAgICAgPT0gXCJEXCIgPyBEYXRlLmRheU5hbWVzWyBzZWxmW2dldCArIFwiRGF5XCJdKCkgKyAoTUQ0ID8gNzowICkgXVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJIXCIgICA/IHNlbGZbZ2V0ICsgXCJIb3Vyc1wiXSgpICUgMTIgfHwgMTJcblx0XHRcdFx0IDogc2luZ2xlID09IFwiaFwiICAgPyBzZWxmW2dldCArIFwiSG91cnNcIl0oKVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJtXCIgICA/IHNlbGZbZ2V0ICsgXCJNaW51dGVzXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwic1wiICAgPyBzZWxmW2dldCArIFwiU2Vjb25kc1wiXSgpXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiU1wiICAgID8gc2VsZltnZXQgKyBcIk1pbGxpc2Vjb25kc1wiXSgpXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiU1NcIiAgID8gKHF1b3RlID0gc2VsZltnZXQgKyBcIk1pbGxpc2Vjb25kc1wiXSgpLCBxdW90ZSA+IDk5ID8gcXVvdGUgOiAocXVvdGUgPiA5ID8gXCIwXCIgOiBcIjAwXCIgKSArIHF1b3RlKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcInVcIiAgICA/IChzZWxmLzEwMDApPj4+MFxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlVcIiAgICA/ICtzZWxmXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiQVwiICAgID8gRGF0ZVtzZWxmW2dldCArIFwiSG91cnNcIl0oKSA+IDExID8gXCJwbVwiIDogXCJhbVwiXVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlpcIiAgICA/IFwiR01UIFwiICsgKC1zZWxmLmdldFRpbWV6b25lT2Zmc2V0KCkvNjApXG5cdFx0XHRcdCA6IG1hdGNoID09IFwid1wiICAgID8gc2VsZltnZXQgKyBcIkRheVwiXSgpIHx8IDdcblx0XHRcdFx0IDogc2luZ2xlID09IFwiV1wiICAgPyAocXVvdGUgPSBuZXcgRGF0ZSgrc2VsZiArICgoNCAtIChzZWxmW2dldCArIFwiRGF5XCJdKCl8fDcpKSAqIDg2NDAwMDAwKSksIE1hdGguY2VpbCgoKHF1b3RlLmdldFRpbWUoKS1xdW90ZVtcInNcIiArIGdldC5zbGljZSgxKSArIFwiTW9udGhcIl0oMCwxKSkgLyA4NjQwMDAwMCArIDEgKSAvIDcpIClcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJvXCIgICAgPyBuZXcgRGF0ZSgrc2VsZiArICgoNCAtIChzZWxmW2dldCArIFwiRGF5XCJdKCl8fDcpKSAqIDg2NDAwMDAwKSlbZ2V0ICsgXCJGdWxsWWVhclwiXSgpXG5cdFx0XHRcdCA6IHF1b3RlICAgICAgICAgICA/IHRleHQucmVwbGFjZSh1bmVzY2FwZVJlLCBcIiQxXCIpXG5cdFx0XHRcdCA6IG1hdGNoXG5cdFx0XHRyZXR1cm4gcGFkICYmIHRleHQgPCAxMCA/IFwiMFwiK3RleHQgOiB0ZXh0XG5cdFx0fSlcblx0fVxuXG5cdERhdGUuYW0gPSBcIkFNXCJcblx0RGF0ZS5wbSA9IFwiUE1cIlxuXG5cdERhdGUubWFza3MgPSB7XCJkZWZhdWx0XCI6XCJEREQgTU1NIEREIFlZWVkgaGg6bW06c3NcIixcImlzb1V0Y0RhdGVUaW1lXCI6J1VUQzpZWVlZLU1NLUREXCJUXCJoaDptbTpzc1wiWlwiJ31cblx0RGF0ZS5tb250aE5hbWVzID0gXCJKYW5GZWJNYXJBcHJNYXlKdW5KdWxBdWdTZXBPY3ROb3ZEZWNKYW51YXJ5RmVicnVhcnlNYXJjaEFwcmlsTWF5SnVuZUp1bHlBdWd1c3RTZXB0ZW1iZXJPY3RvYmVyTm92ZW1iZXJEZWNlbWJlclwiLm1hdGNoKHdvcmRSZSlcblx0RGF0ZS5kYXlOYW1lcyA9IFwiU3VuTW9uVHVlV2VkVGh1RnJpU2F0U3VuZGF5TW9uZGF5VHVlc2RheVdlZG5lc2RheVRodXJzZGF5RnJpZGF5U2F0dXJkYXlcIi5tYXRjaCh3b3JkUmUpXG5cblx0Ly8qL1xuXG5cblx0Lypcblx0KiAvLyBJbiBDaHJvbWUgRGF0ZS5wYXJzZShcIjAxLjAyLjIwMDFcIikgaXMgSmFuXG5cdCogbiA9ICtzZWxmIHx8IERhdGUucGFyc2Uoc2VsZikgfHwgXCJcIitzZWxmO1xuXHQqL1xuXG5cdFN0cmluZ1twcm90b10uZGF0ZSA9IE51bWJlcltwcm90b10uZGF0ZSA9IGZ1bmN0aW9uKGZvcm1hdCkge1xuXHRcdHZhciBtLCB0ZW1wXG5cdFx0LCBkID0gbmV3IERhdGVcblx0XHQsIG4gPSArdGhpcyB8fCBcIlwiK3RoaXNcblxuXHRcdGlmIChpc05hTihuKSkge1xuXHRcdFx0Ly8gQmlnIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSB5ZWFyLCBlZy4gMjAxMS0wMS0zMVxuXHRcdFx0aWYgKG0gPSBuLm1hdGNoKHllYXJGaXJzdFJlKSkgZC5zZXRGdWxsWWVhcihtWzFdLCBtWzJdLTEsIG1bM10pXG5cblx0XHRcdGVsc2UgaWYgKG0gPSBuLm1hdGNoKGRhdGVGaXJzdFJlKSkge1xuXHRcdFx0XHQvLyBNaWRkbGUgZW5kaWFuIGRhdGUsIHN0YXJ0aW5nIHdpdGggdGhlIG1vbnRoLCBlZy4gMDEvMzEvMjAxMVxuXHRcdFx0XHQvLyBMaXR0bGUgZW5kaWFuIGRhdGUsIHN0YXJ0aW5nIHdpdGggdGhlIGRheSwgZWcuIDMxLjAxLjIwMTFcblx0XHRcdFx0dGVtcCA9IERhdGUubWlkZGxlX2VuZGlhbiA/IDEgOiAyXG5cdFx0XHRcdGQuc2V0RnVsbFllYXIobVszXSwgbVt0ZW1wXS0xLCBtWzMtdGVtcF0pXG5cdFx0XHR9XG5cblx0XHRcdC8vIFRpbWVcblx0XHRcdG0gPSBuLm1hdGNoKHRpbWVSZSkgfHwgWzAsIDAsIDBdXG5cdFx0XHRkLnNldEhvdXJzKCBtWzZdICYmIG1bMV0gPCAxMiA/ICttWzFdKzEyIDogbVs1XSAmJiBtWzFdID09IDEyID8gMCA6IG1bMV0sIG1bMl0sIG1bM118MCwgbVs0XXwwKVxuXHRcdFx0Ly8gVGltZXpvbmVcblx0XHRcdGlmIChtWzddKSB7XG5cdFx0XHRcdGQuc2V0VGltZShkLSgoZC5nZXRUaW1lem9uZU9mZnNldCgpICsgKG1bOF18MCkqNjAgKyAoKG1bOF08MD8tMToxKSoobVs5XXwwKSkpKjYwMDAwKSlcblx0XHRcdH1cblx0XHR9IGVsc2UgZC5zZXRUaW1lKCBuIDwgNDI5NDk2NzI5NiA/IG4gKiAxMDAwIDogbiApXG5cdFx0cmV0dXJuIGZvcm1hdCA/IGQuZm9ybWF0KGZvcm1hdCkgOiBkXG5cdH1cblxufShEYXRlLCBcInByb3RvdHlwZVwiKVxuXG5cblxuXG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
