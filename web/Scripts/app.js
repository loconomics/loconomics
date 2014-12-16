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
LcUrl.RestPath = LcUrl.LangPath + 'REST/';
LcUrl.RestUrl = url + LcUrl.RestPath;

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
        var button = $(this);
        // getting the form
        var form = button.closest('form');
        // getting the current wizard step-tab
        var currentStep = form.closest('.tab-body');
        // getting the wizard container
        var wizard = form.closest('.tabbed.wizard');
        // getting the wizard-next-step
        var nextStep = button.data('wizard-next-step');

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
                            $(nextStep).trigger('beginLoadWizardStep', [button]);

                            TabbedUX.enableTab(nextStep);

                            ok = true;
                            $(nextStep).trigger('endLoadWizardStep', [button]);
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
  } else {
    exports.afterClose();
  }
};

/* Do some things after close the popup */
exports.afterClose = function afterClose() {
    $('body').removeClass('strict-welcome-popup');
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
            exports.afterClose();
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

        // For customers become provider, hide new-account fields
        existingUserHideFields(c);

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
        else {
            exports.afterClose();
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

            if (facebookUpdateFieldsStatus($container)) {
                checkUserForFacebookLogin(auth.userID, $container);
            }
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
        femail.show().closest('li').show();
        // showing additional message,
        femail.siblings('.facebook-note').show();

        // Message to notified user is connected with Facebook
        $container.find('.facebook-logged').show();
        // and hidding the button
        $container.find('.facebook-connect').hide();
        $container.find('.choice-or').hide();

        // Password is special too, no needed with Facebook
        $container.find('[name="create-password"]').closest('li').hide();

        return true;
    }
    return false;
}

function existingUserHideFields($container) {
    var fuid = $container.find('[name="userid"]'),
        femail = $container.find('[name="email"]'),
        fpwd = $container.find('[name="create-password"]');
    // There is an existing user (with userid; just check the email 
    // for a value is buggy, causing #594
    if (fuid.val()) {
        // Hide email and password fields
        femail.closest('li').hide();
        fpwd.closest('li').hide();

        // remove validation on password
        fpwd
            .attr('data-val-required', null)
            .attr('data-val', false);
    }
}

/** Ping our server for any existing user that matches 
    the logged FacebookID and update UI notifying that
**/
var blockPresets = require('../LC/blockPresets'),
    LcUrl = require('../LC/LcUrl'),
    redirectTo = require('../LC/redirectTo');
require('jquery.blockUI');
function checkUserForFacebookLogin(facebookID, $container) {
    // Do a server side query to get data for the existing ID 
    // asociated with the facebookID account, IF ANY.
    $container.block(blockPresets.loading);
    // The call must include the Facebook ID parameter
    // and the Facebook login cookie
    $.getJSON(LcUrl.RestPath + 'facebook-user', {
        facebook_id: facebookID,
        do_login: true
    }).done(function (data) {

        var isCustomer = ($container.find('[name="profile-type"]:checked').val() === 'customer');

        $container.find('[name="email"]')
        .val(data.user.email)
        .prop('readOnly', true)
        .hide()
        .siblings('.facebook-note')
        .hide();

        var fzip = $container.find('[name="zipcode"]')
        .val(data.user.postalCode);
        if (fzip.val()) fzip.hide();

        $container.find('.facebook-logged').hide();
        $container.find('.facebook-logged-is-user')
        .show()
        .find('.provider').toggle(!isCustomer);

        // For customers, go Home or just reload
        if (isCustomer) {
            redirectTo(LcUrl.LangPath);
        }

    }).always(function () {
        $container.unblock();
    });
}

},{"../LC/Cookie":7,"../LC/LcUrl":11,"../LC/blockPresets":50,"../LC/facebookUtils":59,"../LC/redirectTo":86}],103:[function(require,module,exports){



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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQXJyYXkucmVtb3ZlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0JpbmRhYmxlQ29tcG9uZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0NvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9EYXRhU291cmNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0xjV2lkZ2V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL2V4dGVuZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9Db29raWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvRmFjZWJvb2tDb25uZWN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0hlbHBQb2ludC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9MY1VybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9QcmljZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9SZWdFeHAucXVvdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU2ltcGxlU2xpZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nRm9ybWF0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmF1dG9sb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguc2xpZGVyVGFicy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC53aXphcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW5FeHRyYS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9VSVNsaWRlckxhYmVscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Q2FsbGJhY2tzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhGb3Jtcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvQ2FsY3VsYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9Gb2N1cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvZmlsbFN1Ym1lbnUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvQm9va2luZ3NOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvTW9udGhseS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9XZWVrbHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvV29ya0hvdXJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2NsZWFyQ3VycmVudFNlbGVjdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9kYXRlVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvZm9ybWF0RGF0ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9tYWtlVW5zZWxlY3RhYmxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL29iamVjdFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL3V0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2JhdGNoRXZlbnRIYW5kbGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2Jsb2NrUHJlc2V0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NyZWF0ZUlmcmFtZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlSVNPODYwMS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9mYWNlYm9va1V0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFRleHQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ29vZ2xlTWFwUmVhZHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ3VpZEdlbmVyYXRvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9oYXNDb25maXJtU3VwcG9ydC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pMThuLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2lzRW1wdHlTdHJpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmFyZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuYm91bmRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmlzQ2hpbGRPZi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkub3V0ZXJIdG1sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5yZWxvYWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL21hdGhVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tb3ZlRm9jdXNUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9udW1iZXJVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3B1cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9yZWRpcmVjdFRvLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9vbHRpcHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdXJsVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYWNjb3VudFBvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZmFxc1BvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvaG9tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvbGVnYWxQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3Byb3ZpZGVyV2VsY29tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvd2VsY29tZVBvcHVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvZGF0ZS1mb3JtYXQtbGl0ZS9kYXRlLWZvcm1hdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsYUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQXJyYXkgUmVtb3ZlIC0gQnkgSm9obiBSZXNpZyAoTUlUIExpY2Vuc2VkKVxyXG4vKkFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcclxuSWFnb1NSTDogaXQgc2VlbXMgaW5jb21wYXRpYmxlIHdpdGggTW9kZXJuaXpyIGxvYWRlciBmZWF0dXJlIGxvYWRpbmcgWmVuZGVzayBzY3JpcHQsXHJcbm1vdmVkIGZyb20gcHJvdG90eXBlIHRvIGEgY2xhc3Mtc3RhdGljIG1ldGhvZCAqL1xyXG5mdW5jdGlvbiBhcnJheVJlbW92ZShhbkFycmF5LCBmcm9tLCB0bykge1xyXG4gICAgdmFyIHJlc3QgPSBhbkFycmF5LnNsaWNlKCh0byB8fCBmcm9tKSArIDEgfHwgYW5BcnJheS5sZW5ndGgpO1xyXG4gICAgYW5BcnJheS5sZW5ndGggPSBmcm9tIDwgMCA/IGFuQXJyYXkubGVuZ3RoICsgZnJvbSA6IGZyb207XHJcbiAgICByZXR1cm4gYW5BcnJheS5wdXNoLmFwcGx5KGFuQXJyYXksIHJlc3QpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXJyYXlSZW1vdmU7XHJcbn0gZWxzZSB7XHJcbiAgICBBcnJheS5yZW1vdmUgPSBhcnJheVJlbW92ZTtcclxufSIsIi8qKlxyXG4gIEJpbmRhYmxlIFVJIENvbXBvbmVudC5cclxuICBJdCByZWxpZXMgb24gQ29tcG9uZW50IGJ1dCBhZGRzIERhdGFTb3VyY2UgY2FwYWJpbGl0aWVzXHJcbioqL1xyXG52YXIgRGF0YVNvdXJjZSA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZScpO1xyXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9Db21wb25lbnQnKTtcclxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4vZXh0ZW5kJyk7XHJcbnZhciBtZXZlbnRzID0gcmVxdWlyZSgnZXZlbnRzJyk7XHJcblxyXG4vKipcclxuUmV1c2luZyB0aGUgb3JpZ2luYWwgZmV0Y2hEYXRhIG1ldGhvZCBidXQgYWRkaW5nIGNsYXNzZXMgdG8gb3VyXHJcbmNvbXBvbmVudCBlbGVtZW50IGZvciBhbnkgdmlzdWFsIG5vdGlmaWNhdGlvbiBvZiB0aGUgZGF0YSBsb2FkaW5nLlxyXG5NZXRob2QgZ2V0IGV4dGVuZGVkIHdpdGggaXNQcmVmZXRjaGluZyBtZXRob2QgZm9yIGRpZmZlcmVudFxyXG5jbGFzc2VzL25vdGlmaWNhdGlvbnMgZGVwZW5kYW50IG9uIHRoYXQgZmxhZywgYnkgZGVmYXVsdCBmYWxzZTpcclxuKiovXHJcbnZhciBjb21wb25lbnRGZXRjaERhdGEgPSBmdW5jdGlvbiBiaW5kYWJsZUNvbXBvbmVudEZldGNoRGF0YShxdWVyeURhdGEsIG1vZGUsIGlzUHJlZmV0Y2hpbmcpIHtcclxuICB2YXIgY2wgPSBpc1ByZWZldGNoaW5nID8gdGhpcy5jbGFzc2VzLnByZWZldGNoaW5nIDogdGhpcy5jbGFzc2VzLmZldGNoaW5nO1xyXG4gIHRoaXMuJGVsLmFkZENsYXNzKGNsKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHZhciByZXEgPSBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaERhdGEuY2FsbCh0aGlzLCBxdWVyeURhdGEsIG1vZGUpXHJcbiAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC4kZWwucmVtb3ZlQ2xhc3MoY2wgfHwgJ18nKTtcclxuICAgIC8vIFVubWFyayBhbnkgcG9zaWJsZSBwcmV2aW91cyBlcnJvciBzaW5jZSB3ZSBoYWQgYSBzdWNjZXMgbG9hZDpcclxuICAgIHRoYXQuaGFzRXJyb3IoZmFsc2UpO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gcmVxO1xyXG59O1xyXG4vKipcclxuUmVwbGFjaW5nLCBidXQgcmV1c2luZyBpbnRlcm5hbHMsIHRoZSBkZWZhdWx0IG9uZXJyb3IgY2FsbGJhY2sgZm9yIHRoZVxyXG5mZXRjaERhdGEgZnVuY3Rpb24gdG8gYWRkIG5vdGlmaWNhdGlvbiBjbGFzc2VzIHRvIG91ciBjb21wb25lbnQgbW9kZWxcclxuKiovXHJcbmNvbXBvbmVudEZldGNoRGF0YS5vbmVycm9yID0gZnVuY3Rpb24gYmluZGFibGVDb21wb25lbnRGZWNoRGF0YU9uZXJyb3IoeCwgcywgZSkge1xyXG4gIERhdGFTb3VyY2UucHJvdG90eXBlLmZldGNoRGF0YS5vbmVycm9yLmNhbGwodGhpcywgeCwgcywgZSk7XHJcbiAgLy8gUmVtb3ZlIGZldGNoaW5nIGNsYXNzZXM6XHJcbiAgdGhpcy4kZWxcclxuICAucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJylcclxuICAucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnByZWZldGNoaW5nIHx8ICdfJyk7XHJcbiAgLy8gTWFyayBlcnJvcjpcclxuICB0aGlzLmhhc0Vycm9yKHsgbmFtZTogJ2ZldGNoRGF0YUVycm9yJywgcmVxdWVzdDogeCwgc3RhdHVzOiBzLCBleGNlcHRpb246IGUgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICBCaW5kYWJsZUNvbXBvbmVudCBjbGFzc1xyXG4qKi9cclxudmFyIEJpbmRhYmxlQ29tcG9uZW50ID0gQ29tcG9uZW50LmV4dGVuZChcclxuICBEYXRhU291cmNlLnByb3RvdHlwZSxcclxuICAvLyBQcm90b3R5cGVcclxuICB7XHJcbiAgICBjbGFzc2VzOiB7XHJcbiAgICAgIGZldGNoaW5nOiAnaXMtbG9hZGluZycsXHJcbiAgICAgIHByZWZldGNoaW5nOiAnaXMtcHJlbG9hZGluZycsXHJcbiAgICAgIGRpc2FibGVkOiAnaXMtZGlzYWJsZWQnLFxyXG4gICAgICBoYXNEYXRhRXJyb3I6ICdoYXMtZGF0YUVycm9yJ1xyXG4gICAgfSxcclxuICAgIGZldGNoRGF0YTogY29tcG9uZW50RmV0Y2hEYXRhLFxyXG4gICAgLy8gV2hhdCBhdHRyaWJ1dGUgbmFtZSB1c2UgdG8gbWFyayBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbXBvbmVudFxyXG4gICAgLy8gd2l0aCB0aGUgcHJvcGVydHkgZnJvbSB0aGUgc291cmNlIHRvIGJpbmQuXHJcbiAgICAvLyBUaGUgcHJlZml4ICdkYXRhLScgaW4gY3VzdG9tIGF0dHJpYnV0ZXMgaXMgcmVxdWlyZWQgYnkgaHRtbDUsXHJcbiAgICAvLyBqdXN0IHNwZWNpZnkgdGhlIHNlY29uZCBwYXJ0LCBiZWluZyAnYmluZCcgdGhlIGF0dHJpYnV0ZVxyXG4gICAgLy8gbmFtZSB0byB1c2UgaXMgJ2RhdGEtYmluZCdcclxuICAgIGRhdGFCaW5kQXR0cmlidXRlOiAnYmluZCcsXHJcbiAgICAvLyBEZWZhdWx0IGJpbmREYXRhIGltcGxlbWVudGF0aW9uLCBjYW4gYmUgcmVwbGFjZSBvbiBleHRlbmRlZCBjb21wb25lbnRzXHJcbiAgICAvLyB0byBzb21ldGhpbmcgbW9yZSBjb21wbGV4IChsaXN0L2NvbGxlY3Rpb25zLCBzdWItb2JqZWN0cywgY3VzdG9tIHN0cnVjdHVyZXNcclxuICAgIC8vIGFuZCB2aXN1YWxpemF0aW9uIC0ta2VlcCBhcyBwb3NzaWJsZSB0aGUgdXNlIG9mIGRhdGFCaW5kQXR0cmlidXRlIGZvciByZXVzYWJsZSBjb2RlKS5cclxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gd29ya3MgZmluZSBmb3IgZGF0YSBhcyBwbGFpbiBvYmplY3Qgd2l0aCBcclxuICAgIC8vIHNpbXBsZSB0eXBlcyBhcyBwcm9wZXJ0aWVzIChub3Qgb2JqZWN0cyBvciBhcnJheXMgaW5zaWRlIHRoZW0pLlxyXG4gICAgYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhKCkge1xyXG4gICAgICBpZiAoIXRoaXMuZGF0YSkgcmV0dXJuO1xyXG4gICAgICAvLyBDaGVjayBldmVyeSBlbGVtZW50IGluIHRoZSBjb21wb25lbnQgd2l0aCBhIGJpbmRcclxuICAgICAgLy8gcHJvcGVydHkgYW5kIHVwZGF0ZSBpdCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGF0IHByb3BlcnR5XHJcbiAgICAgIC8vIGZyb20gdGhlIGRhdGEgc291cmNlXHJcbiAgICAgIHZhciBhdHQgPSB0aGlzLmRhdGFCaW5kQXR0cmlidXRlO1xyXG4gICAgICB2YXIgYXR0clNlbGVjdG9yID0gJ1tkYXRhLScgKyBhdHQgKyAnXSc7XHJcbiAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgdGhpcy4kZWwuZmluZChhdHRyU2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyksXHJcbiAgICAgICAgICBwcm9wID0gJHQuZGF0YShhdHQpLFxyXG4gICAgICAgICAgYmluZGVkVmFsdWUgPSB0aGF0LmRhdGFbcHJvcF07XHJcblxyXG4gICAgICAgIGlmICgkdC5pcygnOmlucHV0JykpXHJcbiAgICAgICAgICAkdC52YWwoYmluZGVkVmFsdWUpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICR0LnRleHQoYmluZGVkVmFsdWUpO1xyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAgSXQgZ2V0cyB0aGUgbGF0ZXN0IGVycm9yIGhhcHBlbmVkIGluIHRoZSBjb21wb25lbnQgKG9yIG51bGwvZmFsc3kgaWYgdGhlcmUgaXMgbm8pLFxyXG4gICAgICBvciBzZXRzIHRoZSBlcnJvciAocGFzc2luZyBpdCBpbiB0aGUgb3B0aW9uYWwgdmFsdWUpIHJldHVybmluZyB0aGUgcHJldmlvdXMgcmVnaXN0ZXJlZCBlcnJvci5cclxuICAgICAgSXRzIHJlY29tbWVuZGVkIGFuIG9iamVjdCBhcyBlcnJvciBpbnN0ZWFkIG9mIGEgc2ltcGxlIHZhbHVlIG9yIHN0cmluZyAodGhhdCBjYW4gZ2V0IGNvbmZ1c2VkXHJcbiAgICAgIHdpdGggZmFsc3kgaWYgaXMgZW1wdHkgc3RyaW5nIG9yIDAsIGFuZCBhbGxvdyBhdHRhY2ggbW9yZSBzdHJ1Y3R1cmVkIGluZm9ybWF0aW9uKSB3aXRoIGFuXHJcbiAgICAgIGluZm9ybWF0aW9uYWwgcHJvcGVydHkgJ25hbWUnLlxyXG4gICAgICBUbyBzZXQgb2ZmIHRoZSBlcnJvciwgcGFzcyBudWxsIHZhbHVlIG9yIGZhbHNlLlxyXG4gICAgKiovXHJcbiAgICBoYXNFcnJvcjogZnVuY3Rpb24gaGFzRXJyb3IoZXJyb3JUb1NldCkge1xyXG4gICAgICBpZiAodHlwZW9mIChlcnJvclRvU2V0KSA9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9lcnJvciB8fCBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciBwcmV2ID0gdGhpcy5fZXJyb3IgfHwgbnVsbDtcclxuICAgICAgdGhpcy5fZXJyb3IgPSBlcnJvclRvU2V0O1xyXG4gICAgICB0aGlzLmV2ZW50cy5lbWl0KCdoYXNFcnJvckNoYW5nZWQnLCBlcnJvclRvU2V0LCBwcmV2KTtcclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9XHJcbiAgfSxcclxuICAvLyBDb25zdHJ1Y3RvclxyXG4gIGZ1bmN0aW9uIEJpbmRhYmxlQ29tcG9uZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIENvbXBvbmVudC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgXHJcbiAgICAvLyBJdCBoYXMgYW4gZXZlbnQgZW1pdHRlcjpcclxuICAgIHRoaXMuZXZlbnRzID0gbmV3IG1ldmVudHMuRXZlbnRFbWl0dGVyKCk7XHJcbiAgICAvLyBFdmVudHMgb2JqZWN0IGhhcyBhIHByb3BlcnR5IHRvIGFjY2VzcyB0aGlzIG9iamVjdCxcclxuICAgIC8vIHVzZWZ1bGwgdG8gcmVmZXJlbmNlIGFzICd0aGlzLmNvbXBvbmVudCcgZnJvbSBpbnNpZGVcclxuICAgIC8vIGV2ZW50IGhhbmRsZXJzOlxyXG4gICAgdGhpcy5ldmVudHMuY29tcG9uZW50ID0gdGhpcztcclxuXHJcbiAgICB0aGlzLmRhdGEgPSB0aGlzLiRlbC5kYXRhKCdzb3VyY2UnKSB8fCB0aGlzLmRhdGEgfHwge307XHJcbiAgICBpZiAodHlwZW9mICh0aGlzLmRhdGEpID09ICdzdHJpbmcnKVxyXG4gICAgICB0aGlzLmRhdGEgPSBKU09OLnBhcnNlKHRoaXMuZGF0YSk7XHJcblxyXG4gICAgLy8gT24gaHRtbCBzb3VyY2UgdXJsIGNvbmZpZ3VyYXRpb246XHJcbiAgICB0aGlzLnVybCA9IHRoaXMuJGVsLmRhdGEoJ3NvdXJjZS11cmwnKSB8fCB0aGlzLnVybDtcclxuXHJcbiAgICAvLyBDbGFzc2VzIG9uIGZldGNoRGF0YUVycm9yXHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICB0aGlzLmV2ZW50cy5vbignaGFzRXJyb3JDaGFuZ2VkJywgZnVuY3Rpb24gKGVyciwgcHJldkVycikge1xyXG4gICAgICBpZiAoZXJyICYmIGVyci5uYW1lID09ICdmZXRjaERhdGFFcnJvcicpIHtcclxuICAgICAgICB0aGF0LiRlbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuaGFzRGF0YUVycm9yKTtcclxuICAgICAgfSBlbHNlIGlmIChwcmV2RXJyICYmIHByZXZFcnIubmFtZSA9PSAnZmV0Y2hEYXRhRXJyb3InKSB7XHJcbiAgICAgICAgdGhhdC4kZWwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLmhhc0RhdGFFcnJvciB8fCAnXycpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBUT0RPOiAnY2hhbmdlJyBldmVudCBoYW5kbGVycyBvbiBmb3JtcyB3aXRoIGRhdGEtYmluZCB0byB1cGRhdGUgaXRzIHZhbHVlIGF0IHRoaXMuZGF0YVxyXG4gICAgLy8gVE9ETzogYXV0byAnYmluZERhdGEnIG9uIGZldGNoRGF0YSBlbmRzPyBjb25maWd1cmFibGUsIGJpbmREYXRhTW9kZXsgaW5tZWRpYXRlLCBub3RpZnkgfVxyXG4gIH1cclxuKTtcclxuXHJcbi8vIFB1YmxpYyBtb2R1bGU6XHJcbm1vZHVsZS5leHBvcnRzID0gQmluZGFibGVDb21wb25lbnQ7IiwiLyoqIENvbXBvbmVudCBjbGFzczogd3JhcHBlciBmb3JcclxuICB0aGUgbG9naWMgYW5kIGJlaGF2aW9yIGFyb3VuZFxyXG4gIGEgRE9NIGVsZW1lbnRcclxuKiovXHJcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpO1xyXG5cclxuZnVuY3Rpb24gQ29tcG9uZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICB0aGlzLmVsID0gZWxlbWVudDtcclxuICB0aGlzLiRlbCA9ICQoZWxlbWVudCk7XHJcbiAgZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIC8vIFVzZSB0aGUgalF1ZXJ5ICdkYXRhJyBzdG9yYWdlIHRvIHByZXNlcnZlIGEgcmVmZXJlbmNlXHJcbiAgLy8gdG8gdGhpcyBpbnN0YW5jZSAodXNlZnVsIHRvIHJldHJpZXZlIGl0IGZyb20gZG9jdW1lbnQpXHJcbiAgdGhpcy4kZWwuZGF0YSgnY29tcG9uZW50JywgdGhpcyk7XHJcbn1cclxuXHJcbmV4dGVuZC5wbHVnSW4oQ29tcG9uZW50KTtcclxuZXh0ZW5kLnBsdWdJbihDb21wb25lbnQucHJvdG90eXBlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50OyIsIi8qKlxyXG4gIERhdGFTb3VyY2UgY2xhc3MgdG8gc2ltcGxpZnkgZmV0Y2hpbmcgZGF0YSBhcyBKU09OXHJcbiAgdG8gZmlsbCBhIGxvY2FsIGNhY2hlLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGZldGNoSlNPTiA9ICQuZ2V0SlNPTixcclxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICQuZXh0ZW5kLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpOyB9O1xyXG5cclxuLy8gVE9ETzogcmVwbGFjZSBlYWNoIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyBieSBpbnN0YW5jZSBwcm9wZXJ0aWVzLCBzaW5jZSB0aGF0IHByb3BlcnRpZXMgYmVjb21lXHJcbi8vIHNoYXJlZCBiZXR3ZWVuIGluc3RhbmNlcyBhbmQgaXMgbm90IHdhbnRlZFxyXG5cclxudmFyIHJlcU1vZGVzID0gRGF0YVNvdXJjZS5yZXF1ZXN0TW9kZXMgPSB7XHJcbiAgLy8gUGFyYWxsZWwgcmVxdWVzdCwgbm8gbWF0dGVyIG9mIG90aGVyc1xyXG4gIG11bHRpcGxlOiAwLFxyXG4gIC8vIFdpbGwgYXZvaWQgYSByZXF1ZXN0IGlmIHRoZXJlIGlzIG9uZSBydW5uaW5nXHJcbiAgc2luZ2xlOiAxLFxyXG4gIC8vIExhdGVzdCByZXF1ZXQgd2lsbCByZXBsYWNlIGFueSBwcmV2aW91cyBvbmUgKHByZXZpb3VzIHdpbGwgYWJvcnQpXHJcbiAgcmVwbGFjZTogMlxyXG59O1xyXG5cclxudmFyIHVwZE1vZGVzID0gRGF0YVNvdXJjZS51cGRhdGVNb2RlcyA9IHtcclxuICAvLyBFdmVyeSBuZXcgZGF0YSB1cGRhdGUsIG5ldyBjb250ZW50IGlzIGFkZGVkIGluY3JlbWVudGFsbHlcclxuICAvLyAob3ZlcndyaXRlIGNvaW5jaWRlbnQgY29udGVudCwgYXBwZW5kIG5ldyBjb250ZW50LCBvbGQgY29udGVudFxyXG4gIC8vIGdldCBpbiBwbGFjZSlcclxuICBpbmNyZW1lbnRhbDogMCxcclxuICAvLyBPbiBuZXcgZGF0YSB1cGRhdGUsIG5ldyBkYXRhIHRvdGFsbHkgcmVwbGFjZSB0aGUgcHJldmlvdXMgb25lXHJcbiAgcmVwbGFjZW1lbnQ6IDFcclxufTtcclxuXHJcbi8qKlxyXG5VcGRhdGUgdGhlIGRhdGEgc3RvcmUgb3IgY2FjaGUgd2l0aCB0aGUgZ2l2ZW4gb25lLlxyXG5UaGVyZSBhcmUgZGlmZmVyZW50IG1vZGVzLCB0aGlzIG1hbmFnZXMgdGhhdCBsb2dpYyBhbmRcclxuaXRzIG93biBjb25maWd1cmF0aW9uLlxyXG5JcyBkZWNvdXBsZWQgZnJvbSB0aGUgcHJvdG90eXBlIGJ1dFxyXG5pdCB3b3JrcyBvbmx5IGFzIHBhcnQgb2YgYSBEYXRhU291cmNlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGF0YShkYXRhLCBtb2RlKSB7XHJcbiAgc3dpdGNoIChtb2RlIHx8IHRoaXMudXBkYXRlRGF0YS5kZWZhdWx0VXBkYXRlTW9kZSkge1xyXG5cclxuICAgIGNhc2UgdXBkTW9kZXMucmVwbGFjZW1lbnQ6XHJcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIC8vY2FzZSB1cGRNb2Rlcy5pbmNyZW1lbnRhbDogIFxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgLy8gSW4gY2FzZSBpbml0aWFsIGRhdGEgaXMgbnVsbCwgYXNzaWduIHRoZSByZXN1bHQgdG8gaXRzZWxmOlxyXG4gICAgICB0aGlzLmRhdGEgPSBleHRlbmQodGhpcy5kYXRhLCBkYXRhKTtcclxuICAgICAgYnJlYWs7XHJcbiAgfVxyXG59XHJcblxyXG4vKiogRGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGNvbmZpZ3VyYWJsZSB1cGRhdGUgbW9kZTpcclxuKiovXHJcbnVwZGF0ZURhdGEuZGVmYXVsdFVwZGF0ZU1vZGUgPSB1cGRNb2Rlcy5pbmNyZW1lbnRhbDtcclxuXHJcbi8qKlxyXG5GZXRjaCB0aGUgZGF0YSBmcm9tIHRoZSBzZXJ2ZXIuXHJcbkhlcmUgaXMgZGVjb3VwbGVkIGZyb20gdGhlIHJlc3Qgb2YgdGhlIHByb3RvdHlwZSBmb3JcclxuY29tbW9kaXR5LCBidXQgaXQgY2FuIHdvcmtzIG9ubHkgYXMgcGFydCBvZiBhIERhdGFTb3VyY2UgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiBmZXRjaERhdGEocXVlcnksIG1vZGUpIHtcclxuICBxdWVyeSA9IGV4dGVuZCh7fSwgdGhpcy5xdWVyeSwgcXVlcnkpO1xyXG4gIHN3aXRjaCAobW9kZSB8fCB0aGlzLmZldGNoRGF0YS5kZWZhdWx0UmVxdWVzdE1vZGUpIHtcclxuXHJcbiAgICBjYXNlIHJlcU1vZGVzLnNpbmdsZTpcclxuICAgICAgaWYgKHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCkgcmV0dXJuIG51bGw7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgcmVxTW9kZXMucmVwbGFjZTpcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0c1tpXS5hYm9ydCgpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7IH1cclxuICAgICAgICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cyA9IFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIC8vIEp1c3QgZG8gbm90aGluZyBmb3IgbXVsdGlwbGUgb3IgZGVmYXVsdCAgICAgXHJcbiAgICAvL2Nhc2UgcmVxTW9kZXMubXVsdGlwbGU6ICBcclxuICAgIC8vZGVmYXVsdDogXHJcbiAgfVxyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdmFyIHJlcSA9IHRoaXMuZmV0Y2hEYXRhLnByb3h5KFxyXG4gICAgdGhpcy51cmwsXHJcbiAgICBxdWVyeSxcclxuICAgIGZ1bmN0aW9uIChkYXRhLCB0LCB4aHIpIHtcclxuICAgICAgdmFyIHJldCA9IHRoYXQudXBkYXRlRGF0YShkYXRhKTtcclxuICAgICAgdGhhdC5mZXRjaERhdGEucmVxdWVzdHMuc3BsaWNlKHRoYXQuZmV0Y2hEYXRhLnJlcXVlc3RzLmluZGV4T2YocmVxKSwgMSk7XHJcbiAgICAgIC8vZGVsZXRlIGZldGNoRGF0YS5yZXF1ZXN0c1tmZXRjaERhdGEucmVxdWVzdHMuaW5kZXhPZihyZXEpXTtcclxuXHJcbiAgICAgIGlmIChyZXQgJiYgcmV0Lm5hbWUpIHtcclxuICAgICAgICAvLyBVcGRhdGUgZGF0YSBlbWl0cyBlcnJvciwgdGhlIEFqYXggc3RpbGwgcmVzb2x2ZXMgYXMgJ3N1Y2Nlc3MnIGJlY2F1c2Ugb2YgdGhlIHJlcXVlc3QsIGJ1dFxyXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gZXhlY3V0ZSB0aGUgZXJyb3IsIGJ1dCB3ZSBwaXBlIGl0IHRvIGVuc3VyZSBpcyBkb25lIGFmdGVyIG90aGVyICdkb25lJyBjYWxsYmFja3NcclxuICAgICAgICByZXEuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHRoYXQuZmV0Y2hEYXRhLm9uZXJyb3IuY2FsbCh0aGF0LCBudWxsLCByZXQubmFtZSwgcmV0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuICApXHJcbiAgLmZhaWwoJC5wcm94eSh0aGlzLmZldGNoRGF0YS5vbmVycm9yLCB0aGlzKSk7XHJcbiAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMucHVzaChyZXEpO1xyXG5cclxuICByZXR1cm4gcmVxO1xyXG59XHJcblxyXG4vLyBEZWZhdWx0cyBmZXRjaERhdGEgcHJvcGVydGllcywgdGhleSBhcmUgZGVjb3VwbGVkIHRvIGFsbG93XHJcbi8vIHJlcGxhY2VtZW50LCBhbmQgaW5zaWRlIHRoZSBmZXRjaERhdGEgZnVuY3Rpb24gdG8gZG9uJ3RcclxuLy8gY29udGFtaW5hdGUgdGhlIG9iamVjdCBuYW1lc3BhY2UuXHJcblxyXG4vKiBDb2xsZWN0aW9uIG9mIGFjdGl2ZSAoZmV0Y2hpbmcpIHJlcXVlc3RzIHRvIHRoZSBzZXJ2ZXJcclxuKi9cclxuZmV0Y2hEYXRhLnJlcXVlc3RzID0gW107XHJcblxyXG4vKiBEZWNvdXBsZWQgZnVuY3Rpb25hbGl0eSB0byBwZXJmb3JtIHRoZSBBamF4IG9wZXJhdGlvbixcclxudGhpcyBhbGxvd3Mgb3ZlcndyaXRlIHRoaXMgYmVoYXZpb3IgdG8gaW1wbGVtZW50IGFub3RoZXJcclxud2F5cywgbGlrZSBhIG5vbi1qUXVlcnkgaW1wbGVtZW50YXRpb24sIGEgcHJveHkgdG8gZmFrZSBzZXJ2ZXJcclxuZm9yIHRlc3Rpbmcgb3IgcHJveHkgdG8gbG9jYWwgc3RvcmFnZSBpZiBvbmxpbmUsIGV0Yy5cclxuSXQgbXVzdCByZXR1cm5zIHRoZSB1c2VkIHJlcXVlc3Qgb2JqZWN0LlxyXG4qL1xyXG5mZXRjaERhdGEucHJveHkgPSBmZXRjaEpTT047XHJcblxyXG4vKiBCeSBkZWZhdWx0LCBmZXRjaERhdGEgYWxsb3dzIG11bHRpcGxlIHNpbXVsdGFuZW9zIGNvbm5lY3Rpb24sXHJcbnNpbmNlIHRoZSBzdG9yYWdlIGJ5IGRlZmF1bHQgYWxsb3dzIGluY3JlbWVudGFsIHVwZGF0ZXMgcmF0aGVyXHJcbnRoYW4gcmVwbGFjZW1lbnRzLlxyXG4qL1xyXG5mZXRjaERhdGEuZGVmYXVsdFJlcXVlc3RNb2RlID0gcmVxTW9kZXMubXVsdGlwbGU7XHJcblxyXG4vKiBEZWZhdWx0IG5vdGlmaWNhdGlvbiBvZiBlcnJvciBvbiBmZXRjaGluZywganVzdCBsb2dnaW5nLFxyXG5jYW4gYmUgcmVwbGFjZWQuXHJcbkl0IHJlY2VpdmVzIHRoZSByZXF1ZXN0IG9iamVjdCwgc3RhdHVzIGFuZCBlcnJvci5cclxuKi9cclxuZmV0Y2hEYXRhLm9uZXJyb3IgPSBmdW5jdGlvbiBlcnJvcih4LCBzLCBlKSB7XHJcbiAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignRmV0Y2ggZGF0YSBlcnJvciAlbycsIGUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgRGF0YVNvdXJjZSBjbGFzc1xyXG4qKi9cclxuLy8gQ29uc3RydWN0b3I6IGV2ZXJ5dGhpbmcgaXMgaW4gdGhlIHByb3RvdHlwZS5cclxuZnVuY3Rpb24gRGF0YVNvdXJjZSgpIHsgfVxyXG5EYXRhU291cmNlLnByb3RvdHlwZSA9IHtcclxuICBkYXRhOiBudWxsLFxyXG4gIHVybDogJy8nLFxyXG4gIC8vIHF1ZXJ5OiBvYmplY3Qgd2l0aCBkZWZhdWx0IGV4dHJhIGluZm9ybWF0aW9uIHRvIGFwcGVuZCB0byB0aGUgdXJsXHJcbiAgLy8gd2hlbiBmZXRjaGluZyBkYXRhLCBleHRlbmRlZCB3aXRoIHRoZSBleHBsaWNpdCBxdWVyeSBzcGVjaWZpZWRcclxuICAvLyBleGVjdXRpbmcgZmV0Y2hEYXRhKHF1ZXJ5KVxyXG4gIHF1ZXJ5OiB7fSxcclxuICB1cGRhdGVEYXRhOiB1cGRhdGVEYXRhLFxyXG4gIGZldGNoRGF0YTogZmV0Y2hEYXRhXHJcbiAgLy8gVE9ETyAgcHVzaERhdGE6IGZ1bmN0aW9uKCl7IHBvc3QvcHV0IHRoaXMuZGF0YSB0byB1cmwgIH1cclxufTtcclxuXHJcbi8vIENsYXNzIGFzIHB1YmxpYyBtb2R1bGU6XHJcbm1vZHVsZS5leHBvcnRzID0gRGF0YVNvdXJjZTsiLCIvKipcclxuICBMb2Nvbm9taWNzIHNwZWNpZmljIFdpZGdldCBiYXNlZCBvbiBCaW5kYWJsZUNvbXBvbmVudC5cclxuICBKdXN0IGRlY291cGxpbmcgc3BlY2lmaWMgYmVoYXZpb3JzIGZyb20gc29tZXRoaW5nIG1vcmUgZ2VuZXJhbFxyXG4gIHRvIGVhc2lseSB0cmFjayB0aGF0IGRldGFpbHMsIGFuZCBtYXliZSBmdXR1cmUgbWlncmF0aW9ucyB0b1xyXG4gIG90aGVyIGZyb250LWVuZCBmcmFtZXdvcmtzLlxyXG4qKi9cclxudmFyIERhdGFTb3VyY2UgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2UnKTtcclxudmFyIEJpbmRhYmxlQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9CaW5kYWJsZUNvbXBvbmVudCcpO1xyXG5cclxudmFyIExjV2lkZ2V0ID0gQmluZGFibGVDb21wb25lbnQuZXh0ZW5kKFxyXG4gIC8vIFByb3RvdHlwZVxyXG4gIHtcclxuICAgIC8vIFJlcGxhY2luZyB1cGRhdGVEYXRhIHRvIGltcGxlbWVudCB0aGUgcGFydGljdWxhclxyXG4gICAgLy8gSlNPTiBzY2hlbWUgb2YgTG9jb25vbWljcywgYnV0IHJldXNpbmcgb3JpZ2luYWxcclxuICAgIC8vIGxvZ2ljIGluaGVyaXQgZnJvbSBEYXRhU291cmNlXHJcbiAgICB1cGRhdGVEYXRhOiBmdW5jdGlvbiAoZGF0YSwgbW9kZSkge1xyXG4gICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICBEYXRhU291cmNlLnByb3RvdHlwZS51cGRhdGVEYXRhLmNhbGwodGhpcywgZGF0YS5SZXN1bHQsIG1vZGUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEVycm9yIG1lc3NhZ2UgaW4gdGhlIEpTT05cclxuICAgICAgICByZXR1cm4geyBuYW1lOiAnZGF0YS1mb3JtYXQnLCBtZXNzYWdlOiBkYXRhLlJlc3VsdCA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA6IGRhdGEuUmVzdWx0IDogXCJ1bmtub3dcIiB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICAvLyBDb25zdHJ1Y3RvclxyXG4gIGZ1bmN0aW9uIExjV2lkZ2V0KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIEJpbmRhYmxlQ29tcG9uZW50LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgfVxyXG4pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1dpZGdldDsiLCIvKipcclxuICBEZWVwIEV4dGVuZCBvYmplY3QgdXRpbGl0eSwgaXMgcmVjdXJzaXZlIHRvIGdldCBhbGwgdGhlIGRlcHRoXHJcbiAgYnV0IG9ubHkgZm9yIHRoZSBwcm9wZXJ0aWVzIG93bmVkIGJ5IHRoZSBvYmplY3QsXHJcbiAgaWYgeW91IG5lZWQgdGhlIG5vbi1vd25lZCBwcm9wZXJ0aWVzIHRvIGluIHRoZSBvYmplY3QsXHJcbiAgY29uc2lkZXIgZXh0ZW5kIGZyb20gdGhlIHNvdXJjZSBwcm90b3R5cGUgdG9vIChhbmQgbWF5YmUgdG9cclxuICB0aGUgZGVzdGluYXRpb24gcHJvdG90eXBlIGluc3RlYWQgb2YgdGhlIGluc3RhbmNlLCBidXQgdXAgdG8gdG9vKS5cclxuKiovXHJcblxyXG4vKiBqcXVlcnkgaW1wbGVtZW50YXRpb246XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcclxucmV0dXJuICQuZXh0ZW5kLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpOyBcclxufTsqL1xyXG5cclxudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChkZXN0aW5hdGlvbiwgc291cmNlKSB7XHJcbiAgZm9yICh2YXIgcHJvcGVydHkgaW4gc291cmNlKSB7XHJcbiAgICBpZiAoIXNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpXHJcbiAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgIC8vIEFsbG93IHByb3BlcnRpZXMgcmVtb3ZhbCwgaWYgc291cmNlIGNvbnRhaW5zIHZhbHVlICd1bmRlZmluZWQnLlxyXG4gICAgLy8gVGhlcmUgYXJlIG5vIHNwZWNpYWwgY29uc2lkZXJhdGlvbnMgb24gQXJyYXlzLCB0byBkb24ndCBnZXQgdW5kZXNpcmVkXHJcbiAgICAvLyByZXN1bHRzIGp1c3QgdGhlIHdhbnRlZCBpcyB0byByZXBsYWNlIHNwZWNpZmljIHBvc2l0aW9ucywgbm9ybWFsbHkuXHJcbiAgICBpZiAoc291cmNlW3Byb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRlbGV0ZSBkZXN0aW5hdGlvbltwcm9wZXJ0eV07XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChbJ29iamVjdCcsICdmdW5jdGlvbiddLmluZGV4T2YodHlwZW9mIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSkgIT0gLTEgJiZcclxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZVtwcm9wZXJ0eV0gPT0gJ29iamVjdCcpXHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9PSAnZnVuY3Rpb24nICYmXHJcbiAgICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZVtwcm9wZXJ0eV0gPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB2YXIgb3JpZyA9IGRlc3RpbmF0aW9uW3Byb3BlcnR5XTtcclxuICAgICAgLy8gQ2xvbmUgZnVuY3Rpb25cclxuICAgICAgdmFyIHNvdXIgPSBjbG9uZUZ1bmN0aW9uKHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgICBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPSBzb3VyO1xyXG4gICAgICAvLyBBbnkgcHJldmlvdXMgYXR0YWNoZWQgcHJvcGVydHlcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgb3JpZyk7XHJcbiAgICAgIC8vIEFueSBzb3VyY2UgYXR0YWNoZWQgcHJvcGVydHlcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICAgIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV07XHJcbiAgfVxyXG5cclxuICAvLyBTbyBtdWNoICdzb3VyY2UnIGFyZ3VtZW50cyBhcyB3YW50ZWQuIEluIEVTNiB3aWxsIGJlICdzb3VyY2UuLidcclxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcclxuICAgIHZhciBuZXh0cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XHJcbiAgICBuZXh0cy5zcGxpY2UoMSwgMSk7XHJcbiAgICBleHRlbmQuYXBwbHkodGhpcywgbmV4dHMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRlc3RpbmF0aW9uO1xyXG59O1xyXG5cclxuZXh0ZW5kLnBsdWdJbiA9IGZ1bmN0aW9uIHBsdWdJbihvYmopIHtcclxuICBvYmogPSBvYmogfHwgT2JqZWN0LnByb3RvdHlwZTtcclxuICBvYmouZXh0ZW5kTWUgPSBmdW5jdGlvbiBleHRlbmRNZSgpIHtcclxuICAgIGV4dGVuZC5hcHBseSh0aGlzLCBbdGhpc10uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcclxuICB9O1xyXG4gIG9iai5leHRlbmQgPSBmdW5jdGlvbiBleHRlbmRJbnN0YW5jZSgpIHtcclxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcclxuICAgICAgLy8gSWYgdGhlIG9iamVjdCB1c2VkIHRvIGV4dGVuZCBmcm9tIGlzIGEgZnVuY3Rpb24sIGlzIGNvbnNpZGVyZWRcclxuICAgICAgLy8gYSBjb25zdHJ1Y3RvciwgdGhlbiB3ZSBleHRlbmQgZnJvbSBpdHMgcHJvdG90eXBlLCBvdGhlcndpc2UgaXRzZWxmLlxyXG4gICAgICBjb25zdHJ1Y3RvckEgPSB0eXBlb2YgdGhpcyA9PSAnZnVuY3Rpb24nID8gdGhpcyA6IG51bGwsXHJcbiAgICAgIGJhc2VBID0gY29uc3RydWN0b3JBID8gdGhpcy5wcm90b3R5cGUgOiB0aGlzLFxyXG4gICAgICAvLyBJZiBsYXN0IGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24sIGlzIGNvbnNpZGVyZWQgYSBjb25zdHJ1Y3RvclxyXG4gICAgICAvLyBvZiB0aGUgbmV3IGNsYXNzL29iamVjdCB0aGVuIHdlIGV4dGVuZCBpdHMgcHJvdG90eXBlLlxyXG4gICAgICAvLyBXZSB1c2UgYW4gZW1wdHkgb2JqZWN0IG90aGVyd2lzZS5cclxuICAgICAgY29uc3RydWN0b3JCID0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PSAnZnVuY3Rpb24nID9cclxuICAgICAgICBhcmdzLnNwbGljZShhcmdzLmxlbmd0aCAtIDEpWzBdIDpcclxuICAgICAgICBudWxsLFxyXG4gICAgICBiYXNlQiA9IGNvbnN0cnVjdG9yQiA/IGNvbnN0cnVjdG9yQi5wcm90b3R5cGUgOiB7fTtcclxuXHJcbiAgICB2YXIgZXh0ZW5kZWRSZXN1bHQgPSBleHRlbmQuYXBwbHkodGhpcywgW2Jhc2VCLCBiYXNlQV0uY29uY2F0KGFyZ3MpKTtcclxuICAgIC8vIElmIGJvdGggYXJlIGNvbnN0cnVjdG9ycywgd2Ugd2FudCB0aGUgc3RhdGljIG1ldGhvZHMgdG8gYmUgY29waWVkIHRvbzpcclxuICAgIGlmIChjb25zdHJ1Y3RvckEgJiYgY29uc3RydWN0b3JCKVxyXG4gICAgICBleHRlbmQoY29uc3RydWN0b3JCLCBjb25zdHJ1Y3RvckEpO1xyXG5cclxuICAgIC8vIElmIHdlIGFyZSBleHRlbmRpbmcgYSBjb25zdHJ1Y3Rvciwgd2UgcmV0dXJuIHRoYXQsIG90aGVyd2lzZSB0aGUgcmVzdWx0XHJcbiAgICByZXR1cm4gY29uc3RydWN0b3JCIHx8IGV4dGVuZGVkUmVzdWx0O1xyXG4gIH07XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICBtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZDtcclxufSBlbHNlIHtcclxuICAvLyBnbG9iYWwgc2NvcGVcclxuICBleHRlbmQucGx1Z0luKCk7XHJcbn1cclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gIENsb25lIFV0aWxzXHJcbiovXHJcbmZ1bmN0aW9uIGNsb25lT2JqZWN0KG9iaikge1xyXG4gIHJldHVybiBleHRlbmQoe30sIG9iaik7XHJcbn1cclxuXHJcbi8vIFRlc3RpbmcgaWYgYSBzdHJpbmcgc2VlbXMgYSBmdW5jdGlvbiBzb3VyY2UgY29kZTpcclxuLy8gV2UgdGVzdCBhZ2FpbnMgYSBzaW1wbGlzaWMgcmVndWxhciBleHByZXNpb24gdGhhdCBtYXRjaFxyXG4vLyBhIGNvbW1vbiBzdGFydCBvZiBmdW5jdGlvbiBkZWNsYXJhdGlvbi5cclxuLy8gT3RoZXIgd2F5cyB0byBkbyB0aGlzIGlzIGF0IGludmVyc2VyLCBieSBjaGVja2luZ1xyXG4vLyB0aGF0IHRoZSBmdW5jdGlvbiB0b1N0cmluZyBpcyBub3QgYSBrbm93ZWQgdGV4dFxyXG4vLyBhcyAnW29iamVjdCBGdW5jdGlvbl0nIG9yICdbbmF0aXZlIGNvZGVdJywgYnV0XHJcbi8vIHNpbmNlIHRoYSBjYW4gY2hhbmdlcyBiZXR3ZWVuIGJyb3dzZXJzLCBpcyBtb3JlIGNvbnNlcnZhdGl2ZVxyXG4vLyBjaGVjayBhZ2FpbnN0IGEgY29tbW9uIGNvbnN0cnVjdCBhbiBmYWxsYmFjayBvbiB0aGVcclxuLy8gY29tbW9uIHNvbHV0aW9uIGlmIG5vdCBtYXRjaGVzLlxyXG52YXIgdGVzdEZ1bmN0aW9uID0gL15cXHMqZnVuY3Rpb25bXlxcKF1cXCgvO1xyXG5cclxuZnVuY3Rpb24gY2xvbmVGdW5jdGlvbihmbikge1xyXG4gIHZhciB0ZW1wO1xyXG4gIHZhciBjb250ZW50cyA9IGZuLnRvU3RyaW5nKCk7XHJcbiAgLy8gQ29weSB0byBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgc2FtZSBwcm90b3R5cGUsIGZvciB0aGUgbm90ICdvd25lZCcgcHJvcGVydGllcy5cclxuICAvLyBBc3NpbmdlZCBhdCB0aGUgZW5kXHJcbiAgdmFyIHRlbXBQcm90byA9IE9iamVjdC5jcmVhdGUoZm4ucHJvdG90eXBlKTtcclxuXHJcbiAgLy8gRElTQUJMRUQgdGhlIGNvbnRlbnRzLWNvcHkgcGFydCBiZWNhdXNlIGl0IGZhaWxzIHdpdGggY2xvc3VyZXNcclxuICAvLyBnZW5lcmF0ZWQgYnkgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLCB1c2luZyB0aGUgc3ViLWNhbGwgd2F5IGV2ZXJcclxuICBpZiAodHJ1ZSB8fCAhdGVzdEZ1bmN0aW9uLnRlc3QoY29udGVudHMpKSB7XHJcbiAgICAvLyBDaGVjayBpZiBpcyBhbHJlYWR5IGEgY2xvbmVkIGNvcHksIHRvXHJcbiAgICAvLyByZXVzZSB0aGUgb3JpZ2luYWwgY29kZSBhbmQgYXZvaWQgbW9yZSB0aGFuXHJcbiAgICAvLyBvbmUgZGVwdGggaW4gc3RhY2sgY2FsbHMgKGdyZWF0ISlcclxuICAgIGlmICh0eXBlb2YgZm4ucHJvdG90eXBlLl9fX2Nsb25lZF9vZiA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICBmbiA9IGZuLnByb3RvdHlwZS5fX19jbG9uZWRfb2Y7XHJcblxyXG4gICAgdGVtcCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpOyB9O1xyXG5cclxuICAgIC8vIFNhdmUgbWFyayBhcyBjbG9uZWQuIERvbmUgaW4gaXRzIHByb3RvdHlwZVxyXG4gICAgLy8gdG8gbm90IGFwcGVhciBpbiB0aGUgbGlzdCBvZiAnb3duZWQnIHByb3BlcnRpZXMuXHJcbiAgICB0ZW1wUHJvdG8uX19fY2xvbmVkX29mID0gZm47XHJcbiAgICAvLyBSZXBsYWNlIHRvU3RyaW5nIHRvIHJldHVybiB0aGUgb3JpZ2luYWwgc291cmNlOlxyXG4gICAgdGVtcFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gZm4udG9TdHJpbmcoKTtcclxuICAgIH07XHJcbiAgICAvLyBUaGUgbmFtZSBjYW5ub3QgYmUgc2V0LCB3aWxsIGp1c3QgYmUgYW5vbnltb3VzXHJcbiAgICAvL3RlbXAubmFtZSA9IHRoYXQubmFtZTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gVGhpcyB3YXkgb24gY2FwYWJsZSBicm93c2VycyBwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgbmFtZSxcclxuICAgIC8vIGRvIGEgcmVhbCBpbmRlcGVuZGVudCBjb3B5IGFuZCBhdm9pZCBmdW5jdGlvbiBzdWJjYWxscyB0aGF0XHJcbiAgICAvLyBjYW4gZGVncmF0ZSBwZXJmb3JtYW5jZSBhZnRlciBsb3Qgb2YgJ2Nsb25uaW5nJy5cclxuICAgIHZhciBmID0gRnVuY3Rpb247XHJcbiAgICB0ZW1wID0gKG5ldyBmKCdyZXR1cm4gJyArIGNvbnRlbnRzKSkoKTtcclxuICB9XHJcblxyXG4gIHRlbXAucHJvdG90eXBlID0gdGVtcFByb3RvO1xyXG4gIC8vIENvcHkgYW55IHByb3BlcnRpZXMgaXQgb3duc1xyXG4gIGV4dGVuZCh0ZW1wLCBmbik7XHJcblxyXG4gIHJldHVybiB0ZW1wO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbG9uZVBsdWdJbigpIHtcclxuICBpZiAodHlwZW9mIEZ1bmN0aW9uLnByb3RvdHlwZS5jbG9uZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgRnVuY3Rpb24ucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUoKSB7IHJldHVybiBjbG9uZUZ1bmN0aW9uKHRoaXMpOyB9O1xyXG4gIH1cclxuICBpZiAodHlwZW9mIE9iamVjdC5wcm90b3R5cGUuY2xvbmUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgIE9qYmVjdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSgpIHsgcmV0dXJuIGNsb25lT2JqZWN0KHRoaXMpOyB9O1xyXG4gIH1cclxufVxyXG5cclxuZXh0ZW5kLmNsb25lT2JqZWN0ID0gY2xvbmVPYmplY3Q7XHJcbmV4dGVuZC5jbG9uZUZ1bmN0aW9uID0gY2xvbmVGdW5jdGlvbjtcclxuZXh0ZW5kLmNsb25lUGx1Z0luID0gY2xvbmVQbHVnSW47XHJcbiIsIi8qKlxyXG4qIENvb2tpZXMgbWFuYWdlbWVudC5cclxuKiBNb3N0IGNvZGUgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80ODI1Njk1LzE2MjIzNDZcclxuKi9cclxudmFyIENvb2tpZSA9IHt9O1xyXG5cclxuQ29va2llLnNldCA9IGZ1bmN0aW9uIHNldENvb2tpZShuYW1lLCB2YWx1ZSwgZGF5cykge1xyXG4gICAgdmFyIGV4cGlyZXMgPSBcIlwiO1xyXG4gICAgaWYgKGRheXMpIHtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgKGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKSk7XHJcbiAgICAgICAgZXhwaXJlcyA9IFwiOyBleHBpcmVzPVwiICsgZGF0ZS50b0dNVFN0cmluZygpO1xyXG4gICAgfVxyXG4gICAgZG9jdW1lbnQuY29va2llID0gbmFtZSArIFwiPVwiICsgdmFsdWUgKyBleHBpcmVzICsgXCI7IHBhdGg9L1wiO1xyXG59O1xyXG5Db29raWUuZ2V0ID0gZnVuY3Rpb24gZ2V0Q29va2llKGNfbmFtZSkge1xyXG4gICAgaWYgKGRvY3VtZW50LmNvb2tpZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY19zdGFydCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKGNfbmFtZSArIFwiPVwiKTtcclxuICAgICAgICBpZiAoY19zdGFydCAhPSAtMSkge1xyXG4gICAgICAgICAgICBjX3N0YXJ0ID0gY19zdGFydCArIGNfbmFtZS5sZW5ndGggKyAxO1xyXG4gICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKFwiO1wiLCBjX3N0YXJ0KTtcclxuICAgICAgICAgICAgaWYgKGNfZW5kID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHVuZXNjYXBlKGRvY3VtZW50LmNvb2tpZS5zdWJzdHJpbmcoY19zdGFydCwgY19lbmQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gXCJcIjtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gQ29va2llOyIsIi8qKiBDb25uZWN0IGFjY291bnQgd2l0aCBGYWNlYm9va1xyXG4qKi9cclxudmFyXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyksXHJcbiAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5mdW5jdGlvbiBGYWNlYm9va0Nvbm5lY3Qob3B0aW9ucykge1xyXG4gICQuZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIGlmICghJCgnI2ZiLXJvb3QnKS5sZW5ndGgpXHJcbiAgICAkKCc8ZGl2IGlkPVwiZmItcm9vdFwiIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiPjwvZGl2PicpLmFwcGVuZFRvKCdib2R5Jyk7XHJcbn1cclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUgPSB7XHJcbiAgYXBwSWQ6IG51bGwsXHJcbiAgbGFuZzogJ2VuX1VTJyxcclxuICByZXN1bHRUeXBlOiAnanNvbicsIC8vICdyZWRpcmVjdCdcclxuICBmYlVybEJhc2U6ICcvL2Nvbm5lY3QuZmFjZWJvb2submV0L0AobGFuZykvYWxsLmpzJyxcclxuICBzZXJ2ZXJVcmxCYXNlOiBMY1VybC5MYW5nUGF0aCArICdBY2NvdW50L0ZhY2Vib29rL0AodXJsU2VjdGlvbikvP1JlZGlyZWN0PUAocmVkaXJlY3RVcmwpJnByb2ZpbGU9QChwcm9maWxlVXJsKScsXHJcbiAgcmVkaXJlY3RVcmw6ICcnLFxyXG4gIHByb2ZpbGVVcmw6ICcnLFxyXG4gIHVybFNlY3Rpb246ICcnLFxyXG4gIGxvYWRpbmdUZXh0OiAnVmVyaWZpbmcnLFxyXG4gIHBlcm1pc3Npb25zOiAnJyxcclxuICBsaWJMb2FkZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdExpYkxvYWRlZCcsXHJcbiAgY29ubmVjdGVkRXZlbnQ6ICdGYWNlYm9va0Nvbm5lY3RDb25uZWN0ZWQnXHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldEZiVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZmJVcmxCYXNlLnJlcGxhY2UoL0BcXChsYW5nXFwpL2csIHRoaXMubGFuZyk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldFNlcnZlclVybCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnNlcnZlclVybEJhc2VcclxuICAucmVwbGFjZSgvQFxcKHJlZGlyZWN0VXJsXFwpL2csIHRoaXMucmVkaXJlY3RVcmwpXHJcbiAgLnJlcGxhY2UoL0BcXChwcm9maWxlVXJsXFwpL2csIHRoaXMucHJvZmlsZVVybClcclxuICAucmVwbGFjZSgvQFxcKHVybFNlY3Rpb25cXCkvZywgdGhpcy51cmxTZWN0aW9uKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUubG9hZExpYiA9IGZ1bmN0aW9uICgpIHtcclxuICAvLyBPbmx5IGlmIGlzIG5vdCBsb2FkZWQgc3RpbGxcclxuICAvLyAoRmFjZWJvb2sgc2NyaXB0IGF0dGFjaCBpdHNlbGYgYXMgdGhlIGdsb2JhbCB2YXJpYWJsZSAnRkInKVxyXG4gIGlmICghd2luZG93LkZCICYmICF0aGlzLl9sb2FkaW5nTGliKSB7XHJcbiAgICB0aGlzLl9sb2FkaW5nTGliID0gdHJ1ZTtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgc2NyaXB0czogW3RoaXMuZ2V0RmJVcmwoKV0sXHJcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgRkIuaW5pdCh7IGFwcElkOiB0aGF0LmFwcElkLCBzdGF0dXM6IHRydWUsIGNvb2tpZTogdHJ1ZSwgeGZibWw6IHRydWUgfSk7XHJcbiAgICAgICAgdGhhdC5sb2FkaW5nTGliID0gZmFsc2U7XHJcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcih0aGF0LmxpYkxvYWRlZEV2ZW50KTtcclxuICAgICAgfSxcclxuICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuRkI7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUucHJvY2Vzc1Jlc3BvbnNlID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgaWYgKHJlc3BvbnNlLmF1dGhSZXNwb25zZSkge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBXZWxjb21lIScpO1xyXG4gICAgdmFyIHVybCA9IHRoaXMuZ2V0U2VydmVyVXJsKCk7XHJcbiAgICBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwicmVkaXJlY3RcIikge1xyXG4gICAgICByZWRpcmVjdFRvKHVybCk7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMucmVzdWx0VHlwZSA9PSBcImpzb25cIikge1xyXG4gICAgICBwb3B1cCh1cmwsICdzbWFsbCcsIG51bGwsIHRoaXMubG9hZGluZ1RleHQpO1xyXG4gICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoaXMuY29ubmVjdGVkRXZlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qRkIuYXBpKCcvbWUnLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgIGNvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IEdvb2QgdG8gc2VlIHlvdSwgJyArIHJlc3BvbnNlLm5hbWUgKyAnLicpO1xyXG4gICAgfSk7Ki9cclxuICB9IGVsc2Uge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBVc2VyIGNhbmNlbGxlZCBsb2dpbiBvciBkaWQgbm90IGZ1bGx5IGF1dGhvcml6ZS4nKTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLm9uTGliUmVhZHkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICBpZiAod2luZG93LkZCKVxyXG4gICAgY2FsbGJhY2soKTtcclxuICBlbHNlIHtcclxuICAgIHRoaXMubG9hZExpYigpO1xyXG4gICAgJChkb2N1bWVudCkub24odGhpcy5saWJMb2FkZWRFdmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5vbkxpYlJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgIEZCLmxvZ2luKCQucHJveHkodGhhdC5wcm9jZXNzUmVzcG9uc2UsIHRoYXQpLCB7IHNjb3BlOiB0aGF0LnBlcm1pc3Npb25zIH0pO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5hdXRvQ29ubmVjdE9uID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgalF1ZXJ5KGRvY3VtZW50KS5vbignY2xpY2snLCBzZWxlY3RvciB8fCAnYS5mYWNlYm9vay1jb25uZWN0JywgJC5wcm94eSh0aGlzLmNvbm5lY3QsIHRoaXMpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmFjZWJvb2tDb25uZWN0OyIsIi8qZ2xvYmFsIGRvY3VtZW50Ki9cclxuLyoqXHJcbiAgICBIZWxwUG9pbnQgUG9wb3ZlciAjNTU5XHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdib290c3RyYXAnKTtcclxuXHJcbmZ1bmN0aW9uIEhlbHBQb2ludChlbGVtZW50KSB7XHJcblxyXG4gICAgdmFyICRlbCA9ICQoZWxlbWVudCk7XHJcblxyXG4gICAgJGVsXHJcbiAgICAucG9wb3Zlcih7XHJcbiAgICAgICAgY29udGFpbmVyOiAnYm9keSdcclxuICAgIH0pXHJcbiAgICAuZmlsdGVyKCdhW2hyZWY9XCIjXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAvLyBBdm9pZCBuYXZpZ2F0ZSB0byB0aGUgbGluaywgd2hlbiBpbXBsZW1lbnRlZFxyXG4gICAgICAgIC8vIGxpa2UgYW4gaW50ZXJuYWwgbGluayB3aXRoIG5vdGhpbmdcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gJGVsO1xyXG59XHJcblxyXG5leHBvcnRzLkhlbHBQb2ludCA9IEhlbHBQb2ludDtcclxuXHJcbkhlbHBQb2ludC5lbmFibGVBbGwgPSBmdW5jdGlvbiBlbmFibGVBbGwoaW5Db250YWluZXIpIHtcclxuXHJcbiAgICAkKGluQ29udGFpbmVyIHx8IGRvY3VtZW50KS5maW5kKCcuSGVscFBvaW50JykudG9BcnJheSgpLmZvckVhY2goSGVscFBvaW50KTtcclxufTtcclxuIiwiLyoqIEltcGxlbWVudHMgYSBzaW1pbGFyIExjVXJsIG9iamVjdCBsaWtlIHRoZSBzZXJ2ZXItc2lkZSBvbmUsIGJhc2luZ1xyXG4gICAgaW4gdGhlIGluZm9ybWF0aW9uIGF0dGFjaGVkIHRvIHRoZSBkb2N1bWVudCBhdCAnaHRtbCcgdGFnIGluIHRoZSBcclxuICAgICdkYXRhLWJhc2UtdXJsJyBhdHRyaWJ1dGUgKHRoYXRzIHZhbHVlIGlzIHRoZSBlcXVpdmFsZW50IGZvciBBcHBQYXRoKSxcclxuICAgIGFuZCB0aGUgbGFuZyBpbmZvcm1hdGlvbiBhdCAnZGF0YS1jdWx0dXJlJy5cclxuICAgIFRoZSByZXN0IG9mIFVSTHMgYXJlIGJ1aWx0IGZvbGxvd2luZyB0aGUgd2luZG93LmxvY2F0aW9uIGFuZCBzYW1lIHJ1bGVzXHJcbiAgICB0aGFuIGluIHRoZSBzZXJ2ZXItc2lkZSBvYmplY3QuXHJcbioqL1xyXG5cclxudmFyIGJhc2UgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWJhc2UtdXJsJyksXHJcbiAgICBsYW5nID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1jdWx0dXJlJyksXHJcbiAgICBsID0gd2luZG93LmxvY2F0aW9uLFxyXG4gICAgdXJsID0gbC5wcm90b2NvbCArICcvLycgKyBsLmhvc3Q7XHJcbi8vIGxvY2F0aW9uLmhvc3QgaW5jbHVkZXMgcG9ydCwgaWYgaXMgbm90IHRoZSBkZWZhdWx0LCB2cyBsb2NhdGlvbi5ob3N0bmFtZVxyXG5cclxuYmFzZSA9IGJhc2UgfHwgJy8nO1xyXG5cclxudmFyIExjVXJsID0ge1xyXG4gICAgU2l0ZVVybDogdXJsLFxyXG4gICAgQXBwUGF0aDogYmFzZSxcclxuICAgIEFwcFVybDogdXJsICsgYmFzZSxcclxuICAgIExhbmdJZDogbGFuZyxcclxuICAgIExhbmdQYXRoOiBiYXNlICsgbGFuZyArICcvJyxcclxuICAgIExhbmdVcmw6IHVybCArIGJhc2UgKyBsYW5nXHJcbn07XHJcbkxjVXJsLkxhbmdVcmwgPSB1cmwgKyBMY1VybC5MYW5nUGF0aDtcclxuTGNVcmwuSnNvblBhdGggPSBMY1VybC5MYW5nUGF0aCArICdKU09OLyc7XHJcbkxjVXJsLkpzb25VcmwgPSB1cmwgKyBMY1VybC5Kc29uUGF0aDtcclxuTGNVcmwuUmVzdFBhdGggPSBMY1VybC5MYW5nUGF0aCArICdSRVNULyc7XHJcbkxjVXJsLlJlc3RVcmwgPSB1cmwgKyBMY1VybC5SZXN0UGF0aDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGNVcmw7IiwiLyogTG9jb25vbWljcyBzcGVjaWZpYyBQcmljZSwgZmVlcyBhbmQgaG91ci1wcmljZSBjYWxjdWxhdGlvblxyXG4gICAgdXNpbmcgc29tZSBzdGF0aWMgbWV0aG9kcyBhbmQgdGhlIFByaWNlIGNsYXNzLlxyXG4qL1xyXG52YXIgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuLyogQ2xhc3MgUHJpY2UgdG8gY2FsY3VsYXRlIGEgdG90YWwgcHJpY2UgYmFzZWQgb24gZmVlcyBpbmZvcm1hdGlvbiAoZml4ZWQgYW5kIHJhdGUpXHJcbiAgICBhbmQgZGVzaXJlZCBkZWNpbWFscyBmb3IgYXBwcm94aW1hdGlvbnMuXHJcbiovXHJcbmZ1bmN0aW9uIFByaWNlKGJhc2VQcmljZSwgZmVlLCByb3VuZGVkRGVjaW1hbHMpIHtcclxuICAgIC8vIGZlZSBwYXJhbWV0ZXIgY2FuIGJlIGEgZmxvYXQgbnVtYmVyIHdpdGggdGhlIGZlZVJhdGUgb3IgYW4gb2JqZWN0XHJcbiAgICAvLyB0aGF0IGluY2x1ZGVzIGJvdGggYSBmZWVSYXRlIGFuZCBhIGZpeGVkRmVlQW1vdW50XHJcbiAgICAvLyBFeHRyYWN0aW5nIGZlZSB2YWx1ZXMgaW50byBsb2NhbCB2YXJzOlxyXG4gICAgdmFyIGZlZVJhdGUgPSAwLCBmaXhlZEZlZUFtb3VudCA9IDA7XHJcbiAgICBpZiAoZmVlLmZpeGVkRmVlQW1vdW50IHx8IGZlZS5mZWVSYXRlKSB7XHJcbiAgICAgICAgZml4ZWRGZWVBbW91bnQgPSBmZWUuZml4ZWRGZWVBbW91bnQgfHwgMDtcclxuICAgICAgICBmZWVSYXRlID0gZmVlLmZlZVJhdGUgfHwgMDtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGZlZVJhdGUgPSBmZWU7XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRpbmc6XHJcbiAgICAvLyBUaGUgcm91bmRUbyB3aXRoIGEgYmlnIGZpeGVkIGRlY2ltYWxzIGlzIHRvIGF2b2lkIHRoZVxyXG4gICAgLy8gZGVjaW1hbCBlcnJvciBvZiBmbG9hdGluZyBwb2ludCBudW1iZXJzXHJcbiAgICB2YXIgdG90YWxQcmljZSA9IG11LmNlaWxUbyhtdS5yb3VuZFRvKGJhc2VQcmljZSAqICgxICsgZmVlUmF0ZSkgKyBmaXhlZEZlZUFtb3VudCwgMTIpLCByb3VuZGVkRGVjaW1hbHMpO1xyXG4gICAgLy8gZmluYWwgZmVlIHByaWNlIGlzIGNhbGN1bGF0ZWQgYXMgYSBzdWJzdHJhY3Rpb24sIGJ1dCBiZWNhdXNlIGphdmFzY3JpcHQgaGFuZGxlc1xyXG4gICAgLy8gZmxvYXQgbnVtYmVycyBvbmx5LCBhIHJvdW5kIG9wZXJhdGlvbiBpcyByZXF1aXJlZCB0byBhdm9pZCBhbiBpcnJhdGlvbmFsIG51bWJlclxyXG4gICAgdmFyIGZlZVByaWNlID0gbXUucm91bmRUbyh0b3RhbFByaWNlIC0gYmFzZVByaWNlLCAyKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBvYmplY3Qgd2l0aCBmdWxsIGRldGFpbHM6XHJcbiAgICB0aGlzLmJhc2VQcmljZSA9IGJhc2VQcmljZTtcclxuICAgIHRoaXMuZmVlUmF0ZSA9IGZlZVJhdGU7XHJcbiAgICB0aGlzLmZpeGVkRmVlQW1vdW50ID0gZml4ZWRGZWVBbW91bnQ7XHJcbiAgICB0aGlzLnJvdW5kZWREZWNpbWFscyA9IHJvdW5kZWREZWNpbWFscztcclxuICAgIHRoaXMudG90YWxQcmljZSA9IHRvdGFsUHJpY2U7XHJcbiAgICB0aGlzLmZlZVByaWNlID0gZmVlUHJpY2U7XHJcbn1cclxuXHJcbi8qKiBDYWxjdWxhdGUgYW5kIHJldHVybnMgdGhlIHByaWNlIGFuZCByZWxldmFudCBkYXRhIGFzIGFuIG9iamVjdCBmb3JcclxudGltZSwgaG91cmx5UmF0ZSAod2l0aCBmZWVzKSBhbmQgdGhlIGhvdXJseUZlZS5cclxuVGhlIHRpbWUgKEBkdXJhdGlvbikgaXMgdXNlZCAnYXMgaXMnLCB3aXRob3V0IHRyYW5zZm9ybWF0aW9uLCBtYXliZSB5b3UgY2FuIHJlcXVpcmVcclxudXNlIExDLnJvdW5kVGltZVRvUXVhcnRlckhvdXIgYmVmb3JlIHBhc3MgdGhlIGR1cmF0aW9uIHRvIHRoaXMgZnVuY3Rpb24uXHJcbkl0IHJlY2VpdmVzIHRoZSBwYXJhbWV0ZXJzIEBob3VybHlQcmljZSBhbmQgQHN1cmNoYXJnZVByaWNlIGFzIExDLlByaWNlIG9iamVjdHMuXHJcbkBzdXJjaGFyZ2VQcmljZSBpcyBvcHRpb25hbC5cclxuKiovXHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZUhvdXJseVByaWNlKGR1cmF0aW9uLCBob3VybHlQcmljZSwgc3VyY2hhcmdlUHJpY2UpIHtcclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIHN1cmNoYXJnZSwgZ2V0IHplcm9zXHJcbiAgICBzdXJjaGFyZ2VQcmljZSA9IHN1cmNoYXJnZVByaWNlIHx8IHsgdG90YWxQcmljZTogMCwgZmVlUHJpY2U6IDAsIGJhc2VQcmljZTogMCB9O1xyXG4gICAgLy8gR2V0IGhvdXJzIGZyb20gcm91bmRlZCBkdXJhdGlvbjpcclxuICAgIHZhciBob3VycyA9IG11LnJvdW5kVG8oZHVyYXRpb24udG90YWxIb3VycygpLCAyKTtcclxuICAgIC8vIENhbGN1bGF0ZSBmaW5hbCBwcmljZXNcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG90YWxQcmljZTogICAgIG11LnJvdW5kVG8oaG91cmx5UHJpY2UudG90YWxQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UudG90YWxQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBmZWVQcmljZTogICAgICAgbXUucm91bmRUbyhob3VybHlQcmljZS5mZWVQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UuZmVlUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgc3VidG90YWxQcmljZTogIG11LnJvdW5kVG8oaG91cmx5UHJpY2UuYmFzZVByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS5iYXNlUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgZHVyYXRpb25Ib3VyczogIGhvdXJzXHJcbiAgICB9O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBQcmljZTogUHJpY2UsXHJcbiAgICAgICAgY2FsY3VsYXRlSG91cmx5UHJpY2U6IGNhbGN1bGF0ZUhvdXJseVByaWNlXHJcbiAgICB9OyIsIi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjU5MzYzNy9ob3ctdG8tZXNjYXBlLXJlZ3VsYXItZXhwcmVzc2lvbi1pbi1qYXZhc2NyaXB0XHJcblJlZ0V4cC5xdW90ZSA9IGZ1bmN0aW9uIChzdHIpIHtcclxuICByZXR1cm4gKHN0ciArICcnKS5yZXBsYWNlKC8oWy4/KiteJFtcXF1cXFxcKCl7fXwtXSkvZywgXCJcXFxcJDFcIik7XHJcbn07XHJcbiIsIi8qKlxyXG4gIEEgdmVyeSBzaW1wbGUgc2xpZGVyIGltcGxlbWVudGF0aW9uIGluaXRpYWxseSBjcmVhdGVkXHJcbiAgZm9yIHRoZSBwcm92aWRlci13ZWxjb21lIGxhbmRpbmcgcGFnZSBhbmRcclxuICBvdGhlciBzaW1pbGFyIHVzZXMuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL1JlZ0V4cC5xdW90ZScpO1xyXG5cclxudmFyIFNpbXBsZVNsaWRlciA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gU2ltcGxlU2xpZGVyKG9wdHMpIHtcclxuICAkLmV4dGVuZCh0cnVlLCB0aGlzLCBvcHRzKTtcclxuXHJcbiAgdGhpcy5lbGVtZW50ID0gJCh0aGlzLmVsZW1lbnQpO1xyXG4gIHRoaXMuY3VycmVudEluZGV4ID0gMDtcclxuXHJcbiAgLyoqXHJcbiAgQWN0aW9ucyBoYW5kbGVyIHRvIG1vdmUgc2xpZGVzXHJcbiAgKiovXHJcbiAgdmFyIGNoZWNrSHJlZiA9IG5ldyBSZWdFeHAoJ14jJyArIFJlZ0V4cC5xdW90ZSh0aGlzLmhyZWZQcmVmaXgpICsgJyguKiknKSxcclxuICAgIHRoYXQgPSB0aGlzO1xyXG4gIHRoaXMuZWxlbWVudC5vbignY2xpY2snLCAnYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBocmVmID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcclxuICAgIHZhciByZXMgPSBjaGVja0hyZWYuZXhlYyhocmVmKTtcclxuXHJcbiAgICBpZiAocmVzICYmIHJlcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgIHZhciBpbmRleCA9IHJlc1sxXTtcclxuICAgICAgaWYgKGluZGV4ID09ICdwcmV2aW91cycpIHtcclxuICAgICAgICB0aGF0LmdvU2xpZGUodGhhdC5jdXJyZW50SW5kZXggLSAxKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmIChpbmRleCA9PSAnbmV4dCcpIHtcclxuICAgICAgICB0aGF0LmdvU2xpZGUodGhhdC5jdXJyZW50SW5kZXggKyAxKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICgvXFxkKy8udGVzdChpbmRleCkpIHtcclxuICAgICAgICB0aGF0LmdvU2xpZGUocGFyc2VJbnQoaW5kZXgpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvKipcclxuICBNZXRob2Q6IERvIGFsbCB0aGUgc2V0dXAgb24gc2xpZGVyIGFuZCBzbGlkZXNcclxuICB0byBlbnN1cmUgdGhlIG1vdmVtZW50IHdpbGwgd29yayBmaW5lLlxyXG4gIEl0cyBkb25lIGF1dG9tYXRpYyBvblxyXG4gIGluaXRpYWxpemluZywgaXMganVzdCBhIHB1YmxpYyBtZXRob2QgZm9yIFxyXG4gIGNvbnZlbmllbmNlIChtYXliZSB0byBiZSBjYWxsIGlmIHNsaWRlcyBhcmVcclxuICBhZGRlZC9yZW1vdmVkIGFmdGVyIGluaXQpLlxyXG4gICoqL1xyXG4gIHRoaXMucmVkcmF3ID0gZnVuY3Rpb24gc2xpZGVzUmVwb3NpdGlvbigpIHtcclxuICAgIHZhciBzbGlkZXMgPSB0aGlzLmdldFNsaWRlcygpLFxyXG4gICAgICBjID0gdGhpcy5nZXRTbGlkZXNDb250YWluZXIoKTtcclxuICAgIC8vIExvb2sgZm9yIHRoZSBjb250YWluZXIgc2l6ZSwgZnJvbSB0aGUgXHJcbiAgICAvLyBiaWdnZXIgc2xpZGU6XHJcbiAgICB2YXIgXHJcbiAgICAgIHcgPSAwLFxyXG4gICAgICBoID0gMDtcclxuICAgIHNsaWRlcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIFxyXG4gICAgICAgIHQgPSAkKHRoaXMpLFxyXG4gICAgICAgIHR3ID0gdC5vdXRlcldpZHRoKCksXHJcbiAgICAgICAgdGggPSB0Lm91dGVySGVpZ2h0KCk7XHJcbiAgICAgIGlmICh0dyA+IHcpXHJcbiAgICAgICAgdyA9IHR3O1xyXG4gICAgICBpZiAodGggPiBoKVxyXG4gICAgICAgIGggPSB0aDtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIENTUyBzZXR1cCwgXHJcbiAgICAvLyBhbGwgc2xpZGVzIGluIHRoZSBzYW1lIGxpbmUsXHJcbiAgICAvLyBhbGwgd2l0aCBzYW1lIHNpemUgKGV4dHJhIHNwYWNpbmcgY2FuXHJcbiAgICAvLyBiZSBnaXZlbiB3aXRoIENTUylcclxuICAgIGMuY3NzKHtcclxuICAgICAgd2lkdGg6IHcgLSAoYy5vdXRlcldpZHRoKCkgLSBjLndpZHRoKCkpLFxyXG4gICAgICAvL2hlaWdodDogaCAtIChjLm91dGVySGVpZ2h0KCkgLSBjLmhlaWdodCgpKSxcclxuICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXHJcbiAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcclxuICAgICAgd2hpdGVTcGFjZTogJ25vd3JhcCdcclxuICAgIH0pO1xyXG5cclxuICAgIHNsaWRlcy5jc3Moe1xyXG4gICAgICB3aGl0ZVNwYWNlOiAnbm9ybWFsJyxcclxuICAgICAgZGlzcGxheTogJ2lubGluZS1ibG9jaydcclxuICAgIH0pLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgIHQuY3NzKHtcclxuICAgICAgICB3aWR0aDogdyAtICh0Lm91dGVyV2lkdGgoKSAtIHQud2lkdGgoKSlcclxuICAgICAgICAvLyxoZWlnaHQ6IGggLSAodC5vdXRlckhlaWdodCgpIC0gdC5oZWlnaHQoKSlcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZXBvc2l0aW9uYXRlIGF0IHRoZSBiZWdnaW5pbmc6XHJcbiAgICBjWzBdLnNjcm9sbExlZnQgPSAwO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICBNZXRob2Q6IEdvIHRvIGEgc2xpZGUgYnkgaW5kZXhcclxuICAqKi9cclxuICB0aGlzLmdvU2xpZGUgPSBmdW5jdGlvbiBnb1NsaWRlKGluZGV4KSB7XHJcbiAgICB2YXIgcHJldiA9IHRoaXMuY3VycmVudEluZGV4O1xyXG4gICAgaWYgKHByZXYgPT0gaW5kZXgpXHJcbiAgICAgIHJldHVybjtcclxuXHJcbiAgICAvLyBDaGVjayBib3VuZHNcclxuICAgIGlmIChpbmRleCA8IDEpXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIHZhciBzbGlkZXMgPSB0aGlzLmdldFNsaWRlcygpO1xyXG4gICAgaWYgKGluZGV4ID4gc2xpZGVzLmxlbmd0aClcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgIC8vIEdvb2QgaW5kZXgsIHNldCBhcyBjdXJyZW50XHJcbiAgICB0aGlzLmN1cnJlbnRJbmRleCA9IGluZGV4O1xyXG4gICAgLy8gU2V0IGxpbmtzIHRvIHRoaXMgYXMgY3VycmVudCwgcmVtb3ZpbmcgYW55IHByZXZpb3VzOlxyXG4gICAgdGhpcy5lbGVtZW50LmZpbmQoJ1tocmVmPSMnICsgdGhpcy5ocmVmUHJlZml4ICsgaW5kZXggKyAnXScpXHJcbiAgICAuYWRkQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcylcclxuICAgIC5wYXJlbnQoJ2xpJykuYWRkQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcyk7XHJcbiAgICB0aGlzLmVsZW1lbnQuZmluZCgnW2hyZWY9IycgKyB0aGlzLmhyZWZQcmVmaXggKyBwcmV2ICsgJ10nKVxyXG4gICAgLnJlbW92ZUNsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpXHJcbiAgICAucGFyZW50KCdsaScpLnJlbW92ZUNsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpO1xyXG5cclxuICAgIHZhciBcclxuICAgICAgc2xpZGUgPSAkKHNsaWRlcy5nZXQoaW5kZXggLSAxKSksXHJcbiAgICAgIGMgPSB0aGlzLmdldFNsaWRlc0NvbnRhaW5lcigpLFxyXG4gICAgICBsZWZ0ID0gYy5zY3JvbGxMZWZ0KCkgKyBzbGlkZS5wb3NpdGlvbigpLmxlZnQ7XHJcblxyXG4gICAgYy5zdG9wKCkuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IGxlZnQgfSwgdGhpcy5kdXJhdGlvbik7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR2V0IHRoZSBqUXVlcnkgY29sbGVjdGlvbiBvZiBzbGlkZXNcclxuICAqKi9cclxuICB0aGlzLmdldFNsaWRlcyA9IGZ1bmN0aW9uIGdldFNsaWRlcygpIHtcclxuICAgIHJldHVybiB0aGlzLmVsZW1lbnRcclxuICAgIC5maW5kKHRoaXMuc2VsZWN0b3JzLnNsaWRlcylcclxuICAgIC5maW5kKHRoaXMuc2VsZWN0b3JzLnNsaWRlKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICBNZXRob2Q6IEdldCB0aGUgalF1ZXJ5IGVsZW1lbnQgZm9yIHRoZSBjb250YWluZXIgb2Ygc2xpZGVzXHJcbiAgKiovXHJcbiAgdGhpcy5nZXRTbGlkZXNDb250YWluZXIgPSBmdW5jdGlvbiBnZXRTbGlkZXNDb250YWluZXIoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50XHJcbiAgICAuZmluZCh0aGlzLnNlbGVjdG9ycy5zbGlkZXMpO1xyXG4gIH07XHJcblxyXG4gIC8qKiBMYXN0IGluaXQgc3RlcHNcclxuICAqKi9cclxuICB0aGlzLnJlZHJhdygpO1xyXG59O1xyXG5cclxuU2ltcGxlU2xpZGVyLnByb3RvdHlwZSA9IHtcclxuICBlbGVtZW50OiBudWxsLFxyXG4gIHNlbGVjdG9yczoge1xyXG4gICAgc2xpZGVzOiAnLnNsaWRlcycsXHJcbiAgICBzbGlkZTogJ2xpLnNsaWRlJ1xyXG4gIH0sXHJcbiAgY3VycmVudFNsaWRlQ2xhc3M6ICdqcy1pc0N1cnJlbnQnLFxyXG4gIGhyZWZQcmVmaXg6ICdnb1NsaWRlXycsXHJcbiAgLy8gRHVyYXRpb24gb2YgZWFjaCBzbGlkZSBpbiBtaWxsaXNlY29uZHNcclxuICBkdXJhdGlvbjogMTAwMFxyXG59OyIsIi8qKiBQb2x5ZmlsbCBmb3Igc3RyaW5nLmNvbnRhaW5zXHJcbioqL1xyXG5pZiAoISgnY29udGFpbnMnIGluIFN0cmluZy5wcm90b3R5cGUpKVxyXG4gICAgU3RyaW5nLnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChzdHIsIHN0YXJ0SW5kZXgpIHsgcmV0dXJuIC0xICE9PSB0aGlzLmluZGV4T2Yoc3RyLCBzdGFydEluZGV4KTsgfTsiLCIvKiogPT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBBIHNpbXBsZSBTdHJpbmcgRm9ybWF0XHJcbiAqIGZ1bmN0aW9uIGZvciBqYXZhc2NyaXB0XHJcbiAqIEF1dGhvcjogSWFnbyBMb3JlbnpvIFNhbGd1ZWlyb1xyXG4gKiBNb2R1bGU6IENvbW1vbkpTXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN0cmluZ0Zvcm1hdCgpIHtcclxuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuXHR2YXIgZm9ybWF0dGVkID0gYXJnc1swXTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCdcXFxceycraSsnXFxcXH0nLCAnZ2knKTtcclxuXHRcdGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5yZXBsYWNlKHJlZ2V4cCwgYXJnc1tpKzFdKTtcclxuXHR9XHJcblx0cmV0dXJuIGZvcm1hdHRlZDtcclxufTsiLCIvKipcclxuICAgIEdlbmVyYWwgYXV0by1sb2FkIHN1cHBvcnQgZm9yIHRhYnM6IFxyXG4gICAgSWYgdGhlcmUgaXMgbm8gY29udGVudCB3aGVuIGZvY3VzZWQsIHRoZXkgdXNlIHRoZSAncmVsb2FkJyBqcXVlcnkgcGx1Z2luXHJcbiAgICB0byBsb2FkIGl0cyBjb250ZW50IC10YWJzIG5lZWQgdG8gYmUgY29uZmlndXJlZCB3aXRoIGRhdGEtc291cmNlLXVybCBhdHRyaWJ1dGVcclxuICAgIGluIG9yZGVyIHRvIGtub3cgd2hlcmUgdG8gZmV0Y2ggdGhlIGNvbnRlbnQtLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9qcXVlcnkucmVsb2FkJyk7XHJcblxyXG4vLyBEZXBlbmRlbmN5IFRhYmJlZFVYIGZyb20gRElcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKFRhYmJlZFVYKSB7XHJcbiAgICAvLyBUYWJiZWRVWC5zZXR1cC50YWJCb2R5U2VsZWN0b3IgfHwgJy50YWItYm9keSdcclxuICAgICQoJy50YWItYm9keScpLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCR0LmNoaWxkcmVuKCkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAkdC5yZWxvYWQoKTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgVGhpcyBhZGRzIG5vdGlmaWNhdGlvbnMgdG8gdGFicyBmcm9tIHRoZSBUYWJiZWRVWCBzeXN0ZW0gdXNpbmdcclxuICAgIHRoZSBjaGFuZ2VzTm90aWZpY2F0aW9uIHV0aWxpdHkgdGhhdCBkZXRlY3RzIG5vdCBzYXZlZCBjaGFuZ2VzIG9uIGZvcm1zLFxyXG4gICAgc2hvd2luZyB3YXJuaW5nIG1lc3NhZ2VzIHRvIHRoZVxyXG4gICAgdXNlciBhbmQgbWFya2luZyB0YWJzIChhbmQgc3ViLXRhYnMgLyBwYXJlbnQtdGFicyBwcm9wZXJseSkgdG9cclxuICAgIGRvbid0IGxvc3QgY2hhbmdlcyBtYWRlLlxyXG4gICAgQSBiaXQgb2YgQ1NTIGZvciB0aGUgYXNzaWduZWQgY2xhc3NlcyB3aWxsIGFsbG93IGZvciB2aXN1YWwgbWFya3MuXHJcblxyXG4gICAgQUtBOiBEb24ndCBsb3N0IGRhdGEhIHdhcm5pbmcgbWVzc2FnZSA7LSlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxuXHJcbi8vIFRhYmJlZFVYIGRlcGVuZGVuY3kgYXMgRElcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKFRhYmJlZFVYLCB0YXJnZXRTZWxlY3Rvcikge1xyXG4gICAgdmFyIHRhcmdldCA9ICQodGFyZ2V0U2VsZWN0b3IgfHwgJy5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1lbmFibGVkJyk7XHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLmluaXQoeyB0YXJnZXQ6IHRhcmdldCB9KTtcclxuXHJcbiAgICAvLyBBZGRpbmcgY2hhbmdlIG5vdGlmaWNhdGlvbiB0byB0YWItYm9keSBkaXZzXHJcbiAgICAvLyAob3V0c2lkZSB0aGUgTEMuQ2hhbmdlc05vdGlmaWNhdGlvbiBjbGFzcyB0byBsZWF2ZSBpdCBhcyBnZW5lcmljIGFuZCBzaW1wbGUgYXMgcG9zc2libGUpXHJcbiAgICAkKHRhcmdldCkub24oJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCAnZm9ybScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKHRoaXMpLnBhcmVudHMoJy50YWItYm9keScpLmFkZENsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFkZGluZyBjbGFzcyB0byB0aGUgbWVudSBpdGVtICh0YWIgdGl0bGUpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLmFkZENsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgICAgICAuYXR0cigndGl0bGUnLCAkKCcjbGNyZXMtY2hhbmdlcy1ub3Qtc2F2ZWQnKS50ZXh0KCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAub24oJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgJ2Zvcm0nLCBmdW5jdGlvbiAoZSwgZiwgZWxzLCBmdWxsKSB7XHJcbiAgICAgICAgaWYgKGZ1bGwpXHJcbiAgICAgICAgICAgICQodGhpcykucGFyZW50cygnLnRhYi1ib2R5Om5vdCg6aGFzKGZvcm0uaGFzLWNoYW5nZXMpKScpLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92aW5nIGNsYXNzIGZyb20gdGhlIG1lbnUgaXRlbSAodGFiIHRpdGxlKVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCd0aXRsZScsIG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAvLyBUbyBhdm9pZCB1c2VyIGJlIG5vdGlmaWVkIG9mIGNoYW5nZXMgYWxsIHRpbWUgd2l0aCB0YWIgbWFya3MsIHdlIGFkZGVkIGEgJ25vdGlmeScgY2xhc3NcclxuICAgIC8vIG9uIHRhYnMgd2hlbiBhIGNoYW5nZSBvZiB0YWIgaGFwcGVuc1xyXG4gICAgLmZpbmQoJy50YWItYm9keScpLm9uKCd0YWJVbmZvY3VzZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGZvY3VzZWRDdHgpIHtcclxuICAgICAgICB2YXIgbWkgPSBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtO1xyXG4gICAgICAgIGlmIChtaS5pcygnLmhhcy1jaGFuZ2VzJykpIHtcclxuICAgICAgICAgICAgbWkuYWRkQ2xhc3MoJ25vdGlmeS1jaGFuZ2VzJyk7IC8vaGFzLXRvb2x0aXBcclxuICAgICAgICAgICAgLy8gU2hvdyBub3RpZmljYXRpb24gcG9wdXBcclxuICAgICAgICAgICAgdmFyIGQgPSAkKCc8ZGl2IGNsYXNzPVwid2FybmluZ1wiPkAwPC9kaXY+PGRpdiBjbGFzcz1cImFjdGlvbnNcIj48aW5wdXQgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYWN0aW9uIGNvbnRpbnVlXCIgdmFsdWU9XCJAMlwiLz48aW5wdXQgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYWN0aW9uIHN0b3BcIiB2YWx1ZT1cIkAxXCIvPjwvZGl2PidcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMC9nLCBMQy5nZXRUZXh0KCdjaGFuZ2VzLW5vdC1zYXZlZCcpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AxL2csIExDLmdldFRleHQoJ3RhYi1oYXMtY2hhbmdlcy1zdGF5LW9uJykpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDIvZywgTEMuZ2V0VGV4dCgndGFiLWhhcy1jaGFuZ2VzLWNvbnRpbnVlLXdpdGhvdXQtY2hhbmdlJykpKTtcclxuICAgICAgICAgICAgZC5vbignY2xpY2snLCAnLnN0b3AnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh3aW5kb3cpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgJy5jb250aW51ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHdpbmRvdyk7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgJ2hhcy1jaGFuZ2VzJyB0byBhdm9pZCBmdXR1cmUgYmxvY2tzICh1bnRpbCBuZXcgY2hhbmdlcyBoYXBwZW5zIG9mIGNvdXJzZSA7LSlcclxuICAgICAgICAgICAgICAgIG1pLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpO1xyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIoZm9jdXNlZEN0eC50YWIuZ2V0KDApKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oZCwgd2luZG93LCAnbm90LXNhdmVkLXBvcHVwJywgeyBjbG9zYWJsZTogZmFsc2UsIGNlbnRlcjogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEV2ZXIgcmV0dXJuIGZhbHNlIHRvIHN0b3AgY3VycmVudCB0YWIgZm9jdXNcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5yZW1vdmVDbGFzcygnbm90aWZ5LWNoYW5nZXMnKTsgLy9oYXMtdG9vbHRpcFxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKiBUYWJiZWRVWDogVGFiYmVkIGludGVyZmFjZSBsb2dpYzsgd2l0aCBtaW5pbWFsIEhUTUwgdXNpbmcgY2xhc3MgJ3RhYmJlZCcgZm9yIHRoZVxyXG5jb250YWluZXIsIHRoZSBvYmplY3QgcHJvdmlkZXMgdGhlIGZ1bGwgQVBJIHRvIG1hbmlwdWxhdGUgdGFicyBhbmQgaXRzIHNldHVwXHJcbmxpc3RlbmVycyB0byBwZXJmb3JtIGxvZ2ljIG9uIHVzZXIgaW50ZXJhY3Rpb24uXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9qcXVlcnkuaGFzU2Nyb2xsQmFyJyk7XHJcblxyXG52YXIgVGFiYmVkVVggPSB7XHJcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCgnYm9keScpLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMgPiBsaTpub3QoLnRhYnMtc2xpZGVyKSA+IGEnLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAoVGFiYmVkVVguZm9jdXNUYWIoJHQuYXR0cignaHJlZicpKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0ID0gJChkb2N1bWVudCkuc2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5oYXNoID0gJHQuYXR0cignaHJlZicpO1xyXG4gICAgICAgICAgICAgICAgJCgnaHRtbCxib2R5Jykuc2Nyb2xsVG9wKHN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ21vdXNlZG93bicsIFRhYmJlZFVYLnN0YXJ0TW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdtb3VzZXVwIG1vdXNlbGVhdmUnLCBUYWJiZWRVWC5lbmRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAvLyB0aGUgY2xpY2sgcmV0dXJuIGZhbHNlIGlzIHRvIGRpc2FibGUgc3RhbmRhciB1cmwgYmVoYXZpb3JcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ2NsaWNrJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyLWxpbWl0JywgJ21vdXNlZW50ZXInLCBUYWJiZWRVWC5zdGFydE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlci1saW1pdCcsICdtb3VzZWxlYXZlJywgVGFiYmVkVVguZW5kTW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMgPiBsaS5yZW1vdmFibGUnLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAvLyBPbmx5IG9uIGRpcmVjdCBjbGlja3MgdG8gdGhlIHRhYiwgdG8gYXZvaWRcclxuICAgICAgICAgICAgLy8gY2xpY2tzIHRvIHRoZSB0YWItbGluayAodGhhdCBzZWxlY3QvZm9jdXMgdGhlIHRhYik6XHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldCA9PSBlLmN1cnJlbnRUYXJnZXQpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5yZW1vdmVUYWIobnVsbCwgdGhpcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEluaXQgcGFnZSBsb2FkZWQgdGFiYmVkIGNvbnRhaW5lcnM6XHJcbiAgICAgICAgJCgnLnRhYmJlZCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAvLyBDb25zaXN0ZW5jZSBjaGVjazogdGhpcyBtdXN0IGJlIGEgdmFsaWQgY29udGFpbmVyLCB0aGlzIGlzLCBtdXN0IGhhdmUgLnRhYnNcclxuICAgICAgICAgICAgaWYgKCR0LmNoaWxkcmVuKCcudGFicycpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgLy8gSW5pdCBzbGlkZXJcclxuICAgICAgICAgICAgVGFiYmVkVVguc2V0dXBTbGlkZXIoJHQpO1xyXG4gICAgICAgICAgICAvLyBDbGVhbiB3aGl0ZSBzcGFjZXMgKHRoZXkgY3JlYXRlIGV4Y2VzaXZlIHNlcGFyYXRpb24gYmV0d2VlbiBzb21lIHRhYnMpXHJcbiAgICAgICAgICAgICQoJy50YWJzJywgdGhpcykuY29udGVudHMoKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgYSB0ZXh0IG5vZGUsIHJlbW92ZSBpdDpcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5vZGVUeXBlID09IDMpXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgbW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIGRpciA9ICR0Lmhhc0NsYXNzKCd0YWJzLXNsaWRlci1yaWdodCcpID8gMSA6IC0xO1xyXG4gICAgICAgIHZhciB0YWJzU2xpZGVyID0gJHQucGFyZW50KCk7XHJcbiAgICAgICAgdmFyIHRhYnMgPSB0YWJzU2xpZGVyLnNpYmxpbmdzKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIHRhYnNbMF0uc2Nyb2xsTGVmdCArPSAyMCAqIGRpcjtcclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJzU2xpZGVyLnBhcmVudCgpLCB0YWJzKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgc3RhcnRNb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgdGFicyA9IHQuY2xvc2VzdCgnLnRhYmJlZCcpLmNoaWxkcmVuKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIC8vIFN0b3AgcHJldmlvdXMgYW5pbWF0aW9uczpcclxuICAgICAgICB0YWJzLnN0b3AodHJ1ZSk7XHJcbiAgICAgICAgdmFyIHNwZWVkID0gMC4zOyAvKiBzcGVlZCB1bml0OiBwaXhlbHMvbWlsaXNlY29uZHMgKi9cclxuICAgICAgICB2YXIgZnhhID0gZnVuY3Rpb24gKCkgeyBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJzLnBhcmVudCgpLCB0YWJzKTsgfTtcclxuICAgICAgICB2YXIgdGltZTtcclxuICAgICAgICBpZiAodC5oYXNDbGFzcygncmlnaHQnKSkge1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGltZSBiYXNlZCBvbiBzcGVlZCB3ZSB3YW50IGFuZCBob3cgbWFueSBkaXN0YW5jZSB0aGVyZSBpczpcclxuICAgICAgICAgICAgdGltZSA9ICh0YWJzWzBdLnNjcm9sbFdpZHRoIC0gdGFic1swXS5zY3JvbGxMZWZ0IC0gdGFicy53aWR0aCgpKSAqIDEgLyBzcGVlZDtcclxuICAgICAgICAgICAgdGFicy5hbmltYXRlKHsgc2Nyb2xsTGVmdDogdGFic1swXS5zY3JvbGxXaWR0aCAtIHRhYnMud2lkdGgoKSB9LFxyXG4gICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBzdGVwOiBmeGEsIGNvbXBsZXRlOiBmeGEsIGVhc2luZzogJ3N3aW5nJyB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGltZSBiYXNlZCBvbiBzcGVlZCB3ZSB3YW50IGFuZCBob3cgbWFueSBkaXN0YW5jZSB0aGVyZSBpczpcclxuICAgICAgICAgICAgdGltZSA9IHRhYnNbMF0uc2Nyb2xsTGVmdCAqIDEgLyBzcGVlZDtcclxuICAgICAgICAgICAgdGFicy5hbmltYXRlKHsgc2Nyb2xsTGVmdDogMCB9LFxyXG4gICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBzdGVwOiBmeGEsIGNvbXBsZXRlOiBmeGEsIGVhc2luZzogJ3N3aW5nJyB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGVuZE1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRhYkNvbnRhaW5lciA9ICQodGhpcykuY2xvc2VzdCgnLnRhYmJlZCcpO1xyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKS5zdG9wKHRydWUpO1xyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYkNvbnRhaW5lcik7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGNoZWNrVGFiU2xpZGVyTGltaXRzOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCB0YWJzKSB7XHJcbiAgICAgICAgdGFicyA9IHRhYnMgfHwgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIC8vIFNldCB2aXNpYmlsaXR5IG9mIHZpc3VhbCBsaW1pdGVyczpcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlci1saW1pdC1sZWZ0JykudG9nZ2xlKHRhYnNbMF0uc2Nyb2xsTGVmdCA+IDApO1xyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyLWxpbWl0LXJpZ2h0JykudG9nZ2xlKFxyXG4gICAgICAgICAgICAodGFic1swXS5zY3JvbGxMZWZ0ICsgdGFicy53aWR0aCgpKSA8IHRhYnNbMF0uc2Nyb2xsV2lkdGgpO1xyXG4gICAgfSxcclxuICAgIHNldHVwU2xpZGVyOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyKSB7XHJcbiAgICAgICAgdmFyIHRzID0gdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXInKTtcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicycpLmhhc1Njcm9sbEJhcih7IHg6IC0yIH0pLmhvcml6b250YWwpIHtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFkZENsYXNzKCdoYXMtdGFicy1zbGlkZXInKTtcclxuICAgICAgICAgICAgaWYgKHRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgIHRzLmNsYXNzTmFtZSA9ICd0YWJzLXNsaWRlcic7XHJcbiAgICAgICAgICAgICAgICAkKHRzKVxyXG4gICAgICAgICAgICAgICAgLy8gQXJyb3dzOlxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxhIGNsYXNzPVwidGFicy1zbGlkZXItbGVmdCBsZWZ0XCIgaHJlZj1cIiNcIj4mbHQ7Jmx0OzwvYT4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxhIGNsYXNzPVwidGFicy1zbGlkZXItcmlnaHQgcmlnaHRcIiBocmVmPVwiI1wiPiZndDsmZ3Q7PC9hPicpO1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFwcGVuZCh0cyk7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXJcclxuICAgICAgICAgICAgICAgIC8vIERlc2luZyBkZXRhaWxzOlxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ0YWJzLXNsaWRlci1saW1pdCB0YWJzLXNsaWRlci1saW1pdC1sZWZ0IGxlZnRcIiBocmVmPVwiI1wiPjwvZGl2PicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGRpdiBjbGFzcz1cInRhYnMtc2xpZGVyLWxpbWl0IHRhYnMtc2xpZGVyLWxpbWl0LXJpZ2h0IHJpZ2h0XCIgaHJlZj1cIiNcIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRzLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5yZW1vdmVDbGFzcygnaGFzLXRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgICAgIHRzLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFiQ29udGFpbmVyKTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWJDb250ZXh0QnlBcmdzOiBmdW5jdGlvbiAoYXJncykge1xyXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIHR5cGVvZiAoYXJnc1swXSkgPT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFRhYkNvbnRleHQoYXJnc1swXSwgbnVsbCk7XHJcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgYXJnc1swXS50YWIpXHJcbiAgICAgICAgICAgIHJldHVybiBhcmdzWzBdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFiQ29udGV4dChcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMCA/IGFyZ3NbMF0gOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAxID8gYXJnc1sxXSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDIgPyBhcmdzWzJdIDogbnVsbFxyXG4gICAgICAgICAgICApO1xyXG4gICAgfSxcclxuICAgIGdldFRhYkNvbnRleHQ6IGZ1bmN0aW9uICh0YWJPclNlbGVjdG9yLCBtZW51aXRlbU9yU2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgbWksIG1hLCB0YWIsIHRhYkNvbnRhaW5lcjtcclxuICAgICAgICBpZiAodGFiT3JTZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB0YWIgPSAkKHRhYk9yU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAodGFiLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXIgPSB0YWIucGFyZW50cygnLnRhYmJlZDplcSgwKScpO1xyXG4gICAgICAgICAgICAgICAgbWEgPSB0YWJDb250YWluZXIuZmluZCgnPiAudGFicyA+IGxpID4gYVtocmVmPSMnICsgdGFiLmdldCgwKS5pZCArICddJyk7XHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hLnBhcmVudCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChtZW51aXRlbU9yU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgbWEgPSAkKG1lbnVpdGVtT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmIChtYS5pcygnbGknKSkge1xyXG4gICAgICAgICAgICAgICAgbWkgPSBtYTtcclxuICAgICAgICAgICAgICAgIG1hID0gbWkuY2hpbGRyZW4oJ2E6ZXEoMCknKTtcclxuICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hLnBhcmVudCgpO1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIgPSBtaS5jbG9zZXN0KCcudGFiYmVkJyk7XHJcbiAgICAgICAgICAgIHRhYiA9IHRhYkNvbnRhaW5lci5maW5kKCc+LnRhYi1ib2R5QDAsID4udGFiLWJvZHktbGlzdD4udGFiLWJvZHlAMCcucmVwbGFjZSgvQDAvZywgbWEuYXR0cignaHJlZicpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IHRhYjogdGFiLCBtZW51YW5jaG9yOiBtYSwgbWVudWl0ZW06IG1pLCB0YWJDb250YWluZXI6IHRhYkNvbnRhaW5lciB9O1xyXG4gICAgfSxcclxuICAgIGNoZWNrVGFiQ29udGV4dDogZnVuY3Rpb24gKGN0eCwgZnVuY3Rpb25uYW1lLCBhcmdzLCBpc1Rlc3QpIHtcclxuICAgICAgICBpZiAoIWN0eC50YWIgfHwgY3R4LnRhYi5sZW5ndGggIT0gMSB8fFxyXG4gICAgICAgICAgICAhY3R4Lm1lbnVpdGVtIHx8IGN0eC5tZW51aXRlbS5sZW5ndGggIT0gMSB8fFxyXG4gICAgICAgICAgICAhY3R4LnRhYkNvbnRhaW5lciB8fCBjdHgudGFiQ29udGFpbmVyLmxlbmd0aCAhPSAxIHx8IFxyXG4gICAgICAgICAgICAhY3R4Lm1lbnVhbmNob3IgfHwgY3R4Lm1lbnVhbmNob3IubGVuZ3RoICE9IDEpIHtcclxuICAgICAgICAgICAgaWYgKCFpc1Rlc3QgJiYgY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVGFiYmVkVVguJyArIGZ1bmN0aW9ubmFtZSArICcsIGJhZCBhcmd1bWVudHM6ICcgKyBBcnJheS5qb2luKGFyZ3MsICcsICcpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdmb2N1c1RhYicsIGFyZ3VtZW50cywgdHJ1ZSkpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHJldHVybiBjdHgudGFiLmdldCgwKTtcclxuICAgIH0sXHJcbiAgICBmb2N1c1RhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2ZvY3VzVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBHZXQgcHJldmlvdXMgZm9jdXNlZCB0YWIsIHRyaWdnZXIgJ3RhYlVuZm9jdXNlZCcgaGFuZGxlciB0aGF0IGNhblxyXG4gICAgICAgIC8vIHN0b3AgdGhpcyBmb2N1cyAocmV0dXJuaW5nIGV4cGxpY2l0eSAnZmFsc2UnKVxyXG4gICAgICAgIHZhciBwcmV2VGFiID0gY3R4LnRhYi5zaWJsaW5ncygnLmN1cnJlbnQnKTtcclxuICAgICAgICBpZiAocHJldlRhYi50cmlnZ2VySGFuZGxlcigndGFiVW5mb2N1c2VkJywgW2N0eF0pID09PSBmYWxzZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBDaGVjayAoZmlyc3QhKSBpZiB0aGVyZSBpcyBhIHBhcmVudCB0YWIgYW5kIGZvY3VzIGl0IHRvbyAod2lsbCBiZSByZWN1cnNpdmUgY2FsbGluZyB0aGlzIHNhbWUgZnVuY3Rpb24pXHJcbiAgICAgICAgdmFyIHBhclRhYiA9IGN0eC50YWIucGFyZW50cygnLnRhYi1ib2R5OmVxKDApJyk7XHJcbiAgICAgICAgaWYgKHBhclRhYi5sZW5ndGggPT0gMSkgdGhpcy5mb2N1c1RhYihwYXJUYWIpO1xyXG5cclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdjdXJyZW50JykgfHxcclxuICAgICAgICAgICAgY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdkaXNhYmxlZCcpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIFVuc2V0IGN1cnJlbnQgbWVudSBlbGVtZW50XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNpYmxpbmdzKCcuY3VycmVudCcpLnJlbW92ZUNsYXNzKCdjdXJyZW50JylcclxuICAgICAgICAgICAgLmZpbmQoJz5hJykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAvLyBTZXQgY3VycmVudCBtZW51IGVsZW1lbnRcclxuICAgICAgICBjdHgubWVudWl0ZW0uYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICBjdHgubWVudWFuY2hvci5hZGRDbGFzcygnY3VycmVudCcpO1xyXG5cclxuICAgICAgICAvLyBIaWRlIGN1cnJlbnQgdGFiLWJvZHlcclxuICAgICAgICBwcmV2VGFiLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgLy8gU2hvdyBjdXJyZW50IHRhYi1ib2R5IGFuZCB0cmlnZ2VyIGV2ZW50XHJcbiAgICAgICAgY3R4LnRhYi5hZGRDbGFzcygnY3VycmVudCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRm9jdXNlZCcpO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBmb2N1c1RhYkluZGV4OiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCB0YWJJbmRleCkge1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZvY3VzVGFiKHRoaXMuZ2V0VGFiQ29udGV4dCh0YWJDb250YWluZXIuZmluZCgnPi50YWItYm9keTplcSgnICsgdGFiSW5kZXggKyAnKScpKSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIC8qIEVuYWJsZSBhIHRhYiwgZGlzYWJsaW5nIGFsbCBvdGhlcnMgdGFicyAtdXNlZnVsbCBpbiB3aXphcmQgc3R5bGUgcGFnZXMtICovXHJcbiAgICBlbmFibGVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdlbmFibGVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHJ0biA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaXMoJy5kaXNhYmxlZCcpKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBkaXNhYmxlZCBjbGFzcyBmcm9tIGZvY3VzZWQgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICAgICAgY3R4LnRhYi5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkVuYWJsZWQnKTtcclxuICAgICAgICAgICAgY3R4Lm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICBydG4gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBGb2N1cyB0YWI6XHJcbiAgICAgICAgdGhpcy5mb2N1c1RhYihjdHgpO1xyXG4gICAgICAgIC8vIERpc2FibGVkIHRhYnMgYW5kIG1lbnUgaXRlbXM6XHJcbiAgICAgICAgY3R4LnRhYi5zaWJsaW5ncygnOm5vdCguZGlzYWJsZWQpJylcclxuICAgICAgICAgICAgLmFkZENsYXNzKCdkaXNhYmxlZCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRGlzYWJsZWQnKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2libGluZ3MoJzpub3QoLmRpc2FibGVkKScpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnZGlzYWJsZWQnKTtcclxuICAgICAgICByZXR1cm4gcnRuO1xyXG4gICAgfSxcclxuICAgIHNob3doaWRlRHVyYXRpb246IDAsXHJcbiAgICBzaG93aGlkZUVhc2luZzogbnVsbCxcclxuICAgIHNob3dUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdzaG93VGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNob3cgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICBjdHgudGFiLnNob3codGhpcy5zaG93aGlkZUR1cmF0aW9uKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2hvdyh0aGlzLnNob3doaWRlRWFzaW5nKTtcclxuICAgIH0sXHJcbiAgICBoaWRlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnaGlkZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTaG93IHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgY3R4LnRhYi5oaWRlKHRoaXMuc2hvd2hpZGVEdXJhdGlvbik7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLmhpZGUodGhpcy5zaG93aGlkZUVhc2luZyk7XHJcbiAgICB9LFxyXG4gICAgdGFiQm9keUNsYXNzRXhjZXB0aW9uczogeyAndGFiLWJvZHknOiAwLCAndGFiYmVkJzogMCwgJ2N1cnJlbnQnOiAwLCAnZGlzYWJsZWQnOiAwIH0sXHJcbiAgICBjcmVhdGVUYWI6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIGlkTmFtZSwgbGFiZWwpIHtcclxuICAgICAgICB0YWJDb250YWluZXIgPSAkKHRhYkNvbnRhaW5lcik7XHJcbiAgICAgICAgLy8gdGFiQ29udGFpbmVyIG11c3QgYmUgb25seSBvbmUgYW5kIHZhbGlkIGNvbnRhaW5lclxyXG4gICAgICAgIC8vIGFuZCBpZE5hbWUgbXVzdCBub3QgZXhpc3RzXHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lci5sZW5ndGggPT0gMSAmJiB0YWJDb250YWluZXIuaXMoJy50YWJiZWQnKSAmJlxyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZE5hbWUpID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0YWIgZGl2OlxyXG4gICAgICAgICAgICB2YXIgdGFiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIHRhYi5pZCA9IGlkTmFtZTtcclxuICAgICAgICAgICAgLy8gUmVxdWlyZWQgY2xhc3Nlc1xyXG4gICAgICAgICAgICB0YWIuY2xhc3NOYW1lID0gXCJ0YWItYm9keVwiO1xyXG4gICAgICAgICAgICB2YXIgJHRhYiA9ICQodGFiKTtcclxuICAgICAgICAgICAgLy8gR2V0IGFuIGV4aXN0aW5nIHNpYmxpbmcgYW5kIGNvcHkgKHdpdGggc29tZSBleGNlcHRpb25zKSB0aGVpciBjc3MgY2xhc3Nlc1xyXG4gICAgICAgICAgICAkLmVhY2godGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiLWJvZHk6ZXEoMCknKS5hdHRyKCdjbGFzcycpLnNwbGl0KC9cXHMrLyksIGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISh2IGluIFRhYmJlZFVYLnRhYkJvZHlDbGFzc0V4Y2VwdGlvbnMpKVxyXG4gICAgICAgICAgICAgICAgICAgICR0YWIuYWRkQ2xhc3Modik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBBZGQgdG8gY29udGFpbmVyXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hcHBlbmQodGFiKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtZW51IGVudHJ5XHJcbiAgICAgICAgICAgIHZhciBtZW51aXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICAgICAgICAgIC8vIEJlY2F1c2UgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIHRhYiwgaXMgYSBkeW5hbWljYWxseSByZW1vdmFibGUgdGFiOlxyXG4gICAgICAgICAgICBtZW51aXRlbS5jbGFzc05hbWUgPSBcInJlbW92YWJsZVwiO1xyXG4gICAgICAgICAgICB2YXIgbWVudWFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICAgICAgbWVudWFuY2hvci5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCAnIycgKyBpZE5hbWUpO1xyXG4gICAgICAgICAgICAvLyBsYWJlbCBjYW5ub3QgYmUgbnVsbCBvciBlbXB0eVxyXG4gICAgICAgICAgICAkKG1lbnVhbmNob3IpLnRleHQoaXNFbXB0eVN0cmluZyhsYWJlbCkgPyBcIlRhYlwiIDogbGFiZWwpO1xyXG4gICAgICAgICAgICAkKG1lbnVpdGVtKS5hcHBlbmQobWVudWFuY2hvcik7XHJcbiAgICAgICAgICAgIC8vIEFkZCB0byB0YWJzIGxpc3QgY29udGFpbmVyXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKS5hcHBlbmQobWVudWl0ZW0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCwgb24gdGFiQ29udGFpbmVyLCB3aXRoIHRoZSBuZXcgdGFiIGFzIGRhdGFcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLnRyaWdnZXJIYW5kbGVyKCd0YWJDcmVhdGVkJywgW3RhYl0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZXR1cFNsaWRlcih0YWJDb250YWluZXIpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhYjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIHJlbW92ZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3JlbW92ZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gT25seSByZW1vdmUgaWYgaXMgYSAncmVtb3ZhYmxlJyB0YWJcclxuICAgICAgICBpZiAoIWN0eC5tZW51aXRlbS5oYXNDbGFzcygncmVtb3ZhYmxlJykgJiYgIWN0eC5tZW51aXRlbS5oYXNDbGFzcygndm9sYXRpbGUnKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIC8vIElmIHRhYiBpcyBjdXJyZW50bHkgZm9jdXNlZCB0YWIsIGNoYW5nZSB0byBmaXJzdCB0YWJcclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdjdXJyZW50JykpXHJcbiAgICAgICAgICAgIHRoaXMuZm9jdXNUYWJJbmRleChjdHgudGFiQ29udGFpbmVyLCAwKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0ucmVtb3ZlKCk7XHJcbiAgICAgICAgdmFyIHRhYmlkID0gY3R4LnRhYi5nZXQoMCkuaWQ7XHJcbiAgICAgICAgY3R4LnRhYi5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXR1cFNsaWRlcihjdHgudGFiQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgLy8gVHJpZ2dlciBldmVudCwgb24gdGFiQ29udGFpbmVyLCB3aXRoIHRoZSByZW1vdmVkIHRhYiBpZCBhcyBkYXRhXHJcbiAgICAgICAgY3R4LnRhYkNvbnRhaW5lci50cmlnZ2VySGFuZGxlcigndGFiUmVtb3ZlZCcsIFt0YWJpZF0pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIHNldFRhYlRpdGxlOiBmdW5jdGlvbiAodGFiT3JTZWxlY3RvciwgbmV3VGl0bGUpIHtcclxuICAgICAgICB2YXIgY3R4ID0gVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0YWJPclNlbGVjdG9yKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3NldFRhYlRpdGxlJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNldCBhbiBlbXB0eSBzdHJpbmcgaXMgbm90IGFsbG93ZWQsIHByZXNlcnZlIHByZXZpb3VzbHk6XHJcbiAgICAgICAgaWYgKCFpc0VtcHR5U3RyaW5nKG5ld1RpdGxlKSlcclxuICAgICAgICAgICAgY3R4Lm1lbnVhbmNob3IudGV4dChuZXdUaXRsZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiBNb3JlIHN0YXRpYyB1dGlsaXRpZXMgKi9cclxuXHJcbi8qKiBMb29rIHVwIHRoZSBjdXJyZW50IHdpbmRvdyBsb2NhdGlvbiBhZGRyZXNzIGFuZCB0cnkgdG8gZm9jdXMgYSB0YWIgd2l0aCB0aGF0XHJcbiAgICBuYW1lLCBpZiB0aGVyZSBpcyBvbmUuXHJcbioqL1xyXG5UYWJiZWRVWC5mb2N1c0N1cnJlbnRMb2NhdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIElmIHRoZSBjdXJyZW50IGxvY2F0aW9uIGhhdmUgYSBoYXNoIHZhbHVlIGJ1dCBpcyBub3QgYSBIYXNoQmFuZ1xyXG4gICAgaWYgKC9eI1teIV0vLnRlc3Qod2luZG93LmxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICAgICAgLy8gVHJ5IGZvY3VzIGEgdGFiIHdpdGggdGhhdCBuYW1lXHJcbiAgICAgICAgdmFyIHRhYiA9IFRhYmJlZFVYLmdldFRhYih3aW5kb3cubG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgaWYgKHRhYilcclxuICAgICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGFiKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKiBMb29rIGZvciB2b2xhdGlsZSB0YWJzIG9uIHRoZSBwYWdlLCBpZiB0aGV5IGFyZVxyXG4gICAgZW1wdHkgb3IgcmVxdWVzdGluZyBiZWluZyAndm9sYXRpemVkJywgcmVtb3ZlIGl0LlxyXG4qKi9cclxuVGFiYmVkVVguY2hlY2tWb2xhdGlsZVRhYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKCcudGFiYmVkID4gLnRhYnMgPiAudm9sYXRpbGUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGFiID0gVGFiYmVkVVguZ2V0VGFiKG51bGwsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0YWIgJiYgKCQodGFiKS5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMCB8fCAkKHRhYikuZmluZCgnOm5vdCgudGFiYmVkKSAudm9sYXRpemUtbXktdGFiJykubGVuZ3RoKSkge1xyXG4gICAgICAgICAgICBUYWJiZWRVWC5yZW1vdmVUYWIodGFiKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRhYmJlZFVYOyIsIi8qIHNsaWRlci10YWJzIGxvZ2ljLlxyXG4qIEV4ZWN1dGUgaW5pdCBhZnRlciBUYWJiZWRVWC5pbml0IHRvIGF2b2lkIGxhdW5jaCBhbmltYXRpb24gb24gcGFnZSBsb2FkLlxyXG4qIEl0IHJlcXVpcmVzIFRhYmJlZFVYIHRocm91Z2h0IERJIG9uICdpbml0Jy5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFNsaWRlclRhYnMoVGFiYmVkVVgpIHtcclxuICAgICQoJy50YWJiZWQuc2xpZGVyLXRhYnMnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciAkdGFicyA9ICR0LmNoaWxkcmVuKCcudGFiLWJvZHknKTtcclxuICAgICAgICB2YXIgYyA9ICR0YWJzXHJcbiAgICAgICAgICAgIC53cmFwQWxsKCc8ZGl2IGNsYXNzPVwidGFiLWJvZHktbGlzdFwiLz4nKVxyXG4gICAgICAgICAgICAuZW5kKCkuY2hpbGRyZW4oJy50YWItYm9keS1saXN0Jyk7XHJcbiAgICAgICAgJHRhYnMub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGMuc3RvcCh0cnVlLCBmYWxzZSkuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IGMuc2Nyb2xsTGVmdCgpICsgJCh0aGlzKS5wb3NpdGlvbigpLmxlZnQgfSwgMTQwMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gU2V0IGhvcml6b250YWwgc2Nyb2xsIHRvIHRoZSBwb3NpdGlvbiBvZiBjdXJyZW50IHNob3dlZCB0YWIsIHdpdGhvdXQgYW5pbWF0aW9uIChmb3IgcGFnZS1pbml0KTpcclxuICAgICAgICB2YXIgY3VycmVudFRhYiA9ICQoJHQuZmluZCgnPi50YWJzPmxpLmN1cnJlbnQ+YScpLmF0dHIoJ2hyZWYnKSk7XHJcbiAgICAgICAgYy5zY3JvbGxMZWZ0KGMuc2Nyb2xsTGVmdCgpICsgY3VycmVudFRhYi5wb3NpdGlvbigpLmxlZnQpO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBXaXphcmQgVGFiYmVkIEZvcm1zLlxyXG4gICAgSXQgdXNlIHRhYnMgdG8gbWFuYWdlIHRoZSBkaWZmZXJlbnQgZm9ybXMtc3RlcHMgaW4gdGhlIHdpemFyZCxcclxuICAgIGxvYWRlZCBieSBBSkFYIGFuZCBmb2xsb3dpbmcgdG8gdGhlIG5leHQgdGFiL3N0ZXAgb24gc3VjY2Vzcy5cclxuXHJcbiAgICBSZXF1aXJlIFRhYmJlZFVYIHZpYSBESSBvbiAnaW5pdCdcclxuICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgdmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpLFxyXG4gICAgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgICBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnLi9hamF4Q2FsbGJhY2tzJyksXHJcbiAgICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFRhYmJlZFdpemFyZChUYWJiZWRVWCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBsb2FkaW5nRGVsYXk6IDBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoXCJib2R5XCIpLmRlbGVnYXRlKFwiLnRhYmJlZC53aXphcmQgLm5leHRcIiwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGJ1dHRvbiA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgZm9ybVxyXG4gICAgICAgIHZhciBmb3JtID0gYnV0dG9uLmNsb3Nlc3QoJ2Zvcm0nKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBjdXJyZW50IHdpemFyZCBzdGVwLXRhYlxyXG4gICAgICAgIHZhciBjdXJyZW50U3RlcCA9IGZvcm0uY2xvc2VzdCgnLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgd2l6YXJkIGNvbnRhaW5lclxyXG4gICAgICAgIHZhciB3aXphcmQgPSBmb3JtLmNsb3Nlc3QoJy50YWJiZWQud2l6YXJkJyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgd2l6YXJkLW5leHQtc3RlcFxyXG4gICAgICAgIHZhciBuZXh0U3RlcCA9IGJ1dHRvbi5kYXRhKCd3aXphcmQtbmV4dC1zdGVwJyk7XHJcblxyXG4gICAgICAgIHZhciBjdHggPSB7XHJcbiAgICAgICAgICAgIGJveDogY3VycmVudFN0ZXAsXHJcbiAgICAgICAgICAgIGZvcm06IGZvcm1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgICAgICB2YXIgdmFsb2JqZWN0ID0gZm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLmdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pO1xyXG4gICAgICAgICAgICAvLyBWYWxpZGF0aW9uIGlzIGFjdGl2ZWQsIHdhcyBleGVjdXRlZCBhbmQgdGhlIHJlc3VsdCBpcyAnZmFsc2UnOiBiYWQgZGF0YSwgc3RvcCBQb3N0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgICAgIHZhciBjdXN2YWwgPSBmb3JtLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAoY3VzdmFsICYmIGN1c3ZhbC52YWxpZGF0ZSAmJiBjdXN2YWwudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5nb1RvU3VtbWFyeUVycm9ycyhmb3JtKTtcclxuICAgICAgICAgICAgLy8gY3VzdG9tIHZhbGlkYXRpb24gbm90IHBhc3NlZCwgb3V0IVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSYWlzZSBldmVudFxyXG4gICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2JlZ2luU3VibWl0V2l6YXJkU3RlcCcpO1xyXG5cclxuICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIHJldGFyZFxyXG4gICAgICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY3VycmVudFN0ZXAuYmxvY2soYmxvY2tQcmVzZXRzLmxvYWRpbmcpO1xyXG4gICAgICAgIH0sIG9wdGlvbnMubG9hZGluZ0RlbGF5KTtcclxuXHJcbiAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBvayA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBNYXJrIGFzIHNhdmVkOlxyXG4gICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmb3JtLmdldCgwKSk7XHJcblxyXG4gICAgICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IChmb3JtLmF0dHIoJ2FjdGlvbicpIHx8ICcnKSxcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgICAgIGRhdGE6IGZvcm0uc2VyaWFsaXplKCksXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIHN1Y2Nlc3MsIGdvIG5leHQgc3RlcCwgdXNpbmcgY3VzdG9tIEpTT04gQWN0aW9uIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0ub24oJ2FqYXhTdWNjZXNzUG9zdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBuZXh0LXN0ZXBcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbmV4dCBzdGVwIGlzIGludGVybmFsIHVybCAoYSBuZXh0IHdpemFyZCB0YWIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvXiMvLnRlc3QobmV4dFN0ZXApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5leHRTdGVwKS50cmlnZ2VyKCdiZWdpbkxvYWRXaXphcmRTdGVwJywgW2J1dHRvbl0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRhYmJlZFVYLmVuYWJsZVRhYihuZXh0U3RlcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2sgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChuZXh0U3RlcCkudHJpZ2dlcignZW5kTG9hZFdpemFyZFN0ZXAnLCBbYnV0dG9uXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG5leHQtc3RlcCBVUkkgdGhhdCBpcyBub3QgaW50ZXJuYWwgbGluaywgd2UgbG9hZCBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhuZXh0U3RlcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgICAgICAgICAgICAgaWYgKCFhamF4Q2FsbGJhY2tzLmRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAgICAgICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93aW5nIG5ldyBodG1sOlxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwLmh0bWwobmV3aHRtbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0Zvcm0gPSBjdXJyZW50U3RlcDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnRTdGVwLmlzKCdmb3JtJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0gPSBjdXJyZW50U3RlcC5maW5kKCdmb3JtOmVxKDApJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcigncmVsb2FkZWRIdG1sV2l6YXJkU3RlcCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgICAgICAgICAgY29tcGxldGU6IGFqYXhDYWxsYmFja3MuY29tcGxldGVcclxuICAgICAgICB9KS5jb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2VuZFN1Ym1pdFdpemFyZFN0ZXAnLCBvayk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqIHRpbWVTcGFuIGNsYXNzIHRvIG1hbmFnZSB0aW1lcywgcGFyc2UsIGZvcm1hdCwgY29tcHV0ZS5cclxuSXRzIG5vdCBzbyBjb21wbGV0ZSBhcyB0aGUgQyMgb25lcyBidXQgaXMgdXNlZnVsbCBzdGlsbC5cclxuKiovXHJcbnZhciBUaW1lU3BhbiA9IGZ1bmN0aW9uIChkYXlzLCBob3VycywgbWludXRlcywgc2Vjb25kcywgbWlsbGlzZWNvbmRzKSB7XHJcbiAgICB0aGlzLmRheXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoZGF5cykpIHx8IDA7XHJcbiAgICB0aGlzLmhvdXJzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGhvdXJzKSkgfHwgMDtcclxuICAgIHRoaXMubWludXRlcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChtaW51dGVzKSkgfHwgMDtcclxuICAgIHRoaXMuc2Vjb25kcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChzZWNvbmRzKSkgfHwgMDtcclxuICAgIHRoaXMubWlsbGlzZWNvbmRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KG1pbGxpc2Vjb25kcykpIHx8IDA7XHJcblxyXG4gICAgLy8gaW50ZXJuYWwgdXRpbGl0eSBmdW5jdGlvbiAndG8gc3RyaW5nIHdpdGggdHdvIGRpZ2l0cyBhbG1vc3QnXHJcbiAgICBmdW5jdGlvbiB0KG4pIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihuIC8gMTApICsgJycgKyBuICUgMTA7XHJcbiAgICB9XHJcbiAgICAvKiogU2hvdyBvbmx5IGhvdXJzIGFuZCBtaW51dGVzIGFzIGEgc3RyaW5nIHdpdGggdGhlIGZvcm1hdCBISDptbVxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvU2hvcnRTdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1Nob3J0U3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKTtcclxuICAgICAgICByZXR1cm4gKGggKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArIG0pO1xyXG4gICAgfTtcclxuICAgIC8qKiBTaG93IHRoZSBmdWxsIHRpbWUgYXMgYSBzdHJpbmcsIGRheXMgY2FuIGFwcGVhciBiZWZvcmUgaG91cnMgaWYgdGhlcmUgYXJlIDI0IGhvdXJzIG9yIG1vcmVcclxuICAgICoqL1xyXG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgZCA9ICh0aGlzLmRheXMgPiAwID8gdGhpcy5kYXlzLnRvU3RyaW5nKCkgKyBUaW1lU3Bhbi5kZWNpbWFsc0RlbGltaXRlciA6ICcnKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKSxcclxuICAgICAgICAgICAgcyA9IHQodGhpcy5zZWNvbmRzICsgdGhpcy5taWxsaXNlY29uZHMgLyAxMDAwKTtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBkICtcclxuICAgICAgICAgICAgaCArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgbSArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgcyk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy52YWx1ZU9mID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdmFsdWVPZigpIHtcclxuICAgICAgICAvLyBSZXR1cm4gdGhlIHRvdGFsIG1pbGxpc2Vjb25kcyBjb250YWluZWQgYnkgdGhlIHRpbWVcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmRheXMgKiAoMjQgKiAzNjAwMDAwKSArXHJcbiAgICAgICAgICAgIHRoaXMuaG91cnMgKiAzNjAwMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taW51dGVzICogNjAwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLnNlY29uZHMgKiAxMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHNcclxuICAgICAgICApO1xyXG4gICAgfTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBtaWxsaXNlY29uZHNcclxuKiovXHJcblRpbWVTcGFuLmZyb21NaWxsaXNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWlsbGlzZWNvbmRzKG1pbGxpc2Vjb25kcykge1xyXG4gICAgdmFyIG1zID0gbWlsbGlzZWNvbmRzICUgMTAwMCxcclxuICAgICAgICBzID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAxMDAwKSAlIDYwLFxyXG4gICAgICAgIG0gPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDYwMDAwKSAlIDYwLFxyXG4gICAgICAgIGggPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDM2MDAwMDApICUgMjQsXHJcbiAgICAgICAgZCA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gKDM2MDAwMDAgKiAyNCkpO1xyXG4gICAgcmV0dXJuIG5ldyBUaW1lU3BhbihkLCBoLCBtLCBzLCBtcyk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBzZWNvbmRzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tU2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21TZWNvbmRzKHNlY29uZHMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21NaWxsaXNlY29uZHMoc2Vjb25kcyAqIDEwMDApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgbWludXRlc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbU1pbnV0ZXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWludXRlcyhtaW51dGVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tU2Vjb25kcyhtaW51dGVzICogNjApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgaG91cnNcclxuKiovXHJcblRpbWVTcGFuLmZyb21Ib3VycyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21Ib3Vycyhob3Vycykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbU1pbnV0ZXMoaG91cnMgKiA2MCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBkYXlzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tRGF5cyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21EYXlzKGRheXMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21Ib3VycyhkYXlzICogMjQpO1xyXG59O1xyXG5cclxuLy8gRm9yIHNwYW5pc2ggYW5kIGVuZ2xpc2ggd29ya3MgZ29vZCAnOicgYXMgdW5pdHNEZWxpbWl0ZXIgYW5kICcuJyBhcyBkZWNpbWFsRGVsaW1pdGVyXHJcbi8vIFRPRE86IHRoaXMgbXVzdCBiZSBzZXQgZnJvbSBhIGdsb2JhbCBMQy5pMThuIHZhciBsb2NhbGl6ZWQgZm9yIGN1cnJlbnQgdXNlclxyXG5UaW1lU3Bhbi51bml0c0RlbGltaXRlciA9ICc6JztcclxuVGltZVNwYW4uZGVjaW1hbHNEZWxpbWl0ZXIgPSAnLic7XHJcblRpbWVTcGFuLnBhcnNlID0gZnVuY3Rpb24gKHN0cnRpbWUpIHtcclxuICAgIHN0cnRpbWUgPSAoc3RydGltZSB8fCAnJykuc3BsaXQodGhpcy51bml0c0RlbGltaXRlcik7XHJcbiAgICAvLyBCYWQgc3RyaW5nLCByZXR1cm5zIG51bGxcclxuICAgIGlmIChzdHJ0aW1lLmxlbmd0aCA8IDIpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgLy8gRGVjb3VwbGVkIHVuaXRzOlxyXG4gICAgdmFyIGQsIGgsIG0sIHMsIG1zO1xyXG4gICAgaCA9IHN0cnRpbWVbMF07XHJcbiAgICBtID0gc3RydGltZVsxXTtcclxuICAgIHMgPSBzdHJ0aW1lLmxlbmd0aCA+IDIgPyBzdHJ0aW1lWzJdIDogMDtcclxuICAgIC8vIFN1YnN0cmFjdGluZyBkYXlzIGZyb20gdGhlIGhvdXJzIHBhcnQgKGZvcm1hdDogJ2RheXMuaG91cnMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIGlmIChoLmNvbnRhaW5zKHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpKSB7XHJcbiAgICAgICAgdmFyIGRoc3BsaXQgPSBoLnNwbGl0KHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpO1xyXG4gICAgICAgIGQgPSBkaHNwbGl0WzBdO1xyXG4gICAgICAgIGggPSBkaHNwbGl0WzFdO1xyXG4gICAgfVxyXG4gICAgLy8gTWlsbGlzZWNvbmRzIGFyZSBleHRyYWN0ZWQgZnJvbSB0aGUgc2Vjb25kcyAoYXJlIHJlcHJlc2VudGVkIGFzIGRlY2ltYWwgbnVtYmVycyBvbiB0aGUgc2Vjb25kcyBwYXJ0OiAnc2Vjb25kcy5taWxsaXNlY29uZHMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIG1zID0gTWF0aC5yb3VuZChwYXJzZUZsb2F0KHMucmVwbGFjZSh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyLCAnLicpKSAqIDEwMDAgJSAxMDAwKTtcclxuICAgIC8vIFJldHVybiB0aGUgbmV3IHRpbWUgaW5zdGFuY2VcclxuICAgIHJldHVybiBuZXcgVGltZVNwYW4oZCwgaCwgbSwgcywgbXMpO1xyXG59O1xyXG5UaW1lU3Bhbi56ZXJvID0gbmV3IFRpbWVTcGFuKDAsIDAsIDAsIDAsIDApO1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9faXNaZXJvKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICB0aGlzLmRheXMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLmhvdXJzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taW51dGVzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5zZWNvbmRzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taWxsaXNlY29uZHMgPT09IDBcclxuICAgICk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbE1pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWlsbGlzZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWVPZigpO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxTZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxTZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsTWludXRlcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWludXRlcygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbFNlY29uZHMoKSAvIDYwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsSG91cnMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbEhvdXJzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWludXRlcygpIC8gNjApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxEYXlzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxEYXlzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsSG91cnMoKSAvIDI0KTtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGltZVNwYW47IiwiLyogRXh0cmEgdXRpbGl0aWVzIGFuZCBtZXRob2RzIFxyXG4gKi9cclxudmFyIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG52YXIgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuLyoqIFNob3dzIHRpbWUgYXMgYSBsYXJnZSBzdHJpbmcgd2l0aCB1bml0cyBuYW1lcyBmb3IgdmFsdWVzIGRpZmZlcmVudCB0aGFuIHplcm8uXHJcbiAqKi9cclxuZnVuY3Rpb24gc21hcnRUaW1lKHRpbWUpIHtcclxuICAgIHZhciByID0gW107XHJcbiAgICBpZiAodGltZS5kYXlzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5kYXlzICsgJyBkYXlzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmRheXMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgZGF5Jyk7XHJcbiAgICBpZiAodGltZS5ob3VycyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuaG91cnMgKyAnIGhvdXJzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmhvdXJzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIGhvdXInKTtcclxuICAgIGlmICh0aW1lLm1pbnV0ZXMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLm1pbnV0ZXMgKyAnIG1pbnV0ZXMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWludXRlcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBtaW51dGUnKTtcclxuICAgIGlmICh0aW1lLnNlY29uZHMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLnNlY29uZHMgKyAnIHNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuc2Vjb25kcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBzZWNvbmQnKTtcclxuICAgIGlmICh0aW1lLm1pbGxpc2Vjb25kcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUubWlsbGlzZWNvbmRzICsgJyBtaWxsaXNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWlsbGlzZWNvbmRzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIG1pbGxpc2Vjb25kJyk7XHJcbiAgICByZXR1cm4gci5qb2luKCcsICcpO1xyXG59XHJcblxyXG4vKiogUm91bmRzIGEgdGltZSB0byB0aGUgbmVhcmVzdCAxNSBtaW51dGVzIGZyYWdtZW50LlxyXG5Acm91bmRUbyBzcGVjaWZ5IHRoZSBMQy5yb3VuZGluZ1R5cGVFbnVtIGFib3V0IGhvdyB0byByb3VuZCB0aGUgdGltZSAoZG93biwgbmVhcmVzdCBvciB1cClcclxuKiovXHJcbmZ1bmN0aW9uIHJvdW5kVGltZVRvUXVhcnRlckhvdXIoLyogVGltZVNwYW4gKi90aW1lLCAvKiBtYXRoVXRpbHMucm91bmRpbmdUeXBlRW51bSAqL3JvdW5kVG8pIHtcclxuICAgIHZhciByZXN0RnJvbVF1YXJ0ZXIgPSB0aW1lLnRvdGFsSG91cnMoKSAlIDAuMjU7XHJcbiAgICB2YXIgaG91cnMgPSB0aW1lLnRvdGFsSG91cnMoKTtcclxuICAgIGlmIChyZXN0RnJvbVF1YXJ0ZXIgPiAwLjApIHtcclxuICAgICAgICBzd2l0Y2ggKHJvdW5kVG8pIHtcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLkRvd246XHJcbiAgICAgICAgICAgICAgICBob3VycyAtPSByZXN0RnJvbVF1YXJ0ZXI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLk5lYXJlc3Q6XHJcbiAgICAgICAgICAgICAgICB2YXIgbGltaXQgPSAwLjI1IC8gMjtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN0RnJvbVF1YXJ0ZXIgPj0gbGltaXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBob3VycyArPSAoMC4yNSAtIHJlc3RGcm9tUXVhcnRlcik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzIC09IHJlc3RGcm9tUXVhcnRlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uVXA6XHJcbiAgICAgICAgICAgICAgICBob3VycyArPSAoMC4yNSAtIHJlc3RGcm9tUXVhcnRlcik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gVGltZVNwYW4uZnJvbUhvdXJzKGhvdXJzKTtcclxufVxyXG5cclxuLy8gRXh0ZW5kIGEgZ2l2ZW4gVGltZVNwYW4gb2JqZWN0IHdpdGggdGhlIEV4dHJhIG1ldGhvZHNcclxuZnVuY3Rpb24gcGx1Z0luKFRpbWVTcGFuKSB7XHJcbiAgICBUaW1lU3Bhbi5wcm90b3R5cGUudG9TbWFydFN0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU21hcnRTdHJpbmcoKSB7IHJldHVybiBzbWFydFRpbWUodGhpcyk7IH07XHJcbiAgICBUaW1lU3Bhbi5wcm90b3R5cGUucm91bmRUb1F1YXJ0ZXJIb3VyID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fcm91bmRUb1F1YXJ0ZXJIb3VyKCkgeyByZXR1cm4gcm91bmRUaW1lVG9RdWFydGVySG91ci5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpOyB9O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBzbWFydFRpbWU6IHNtYXJ0VGltZSxcclxuICAgICAgICByb3VuZFRvUXVhcnRlckhvdXI6IHJvdW5kVGltZVRvUXVhcnRlckhvdXIsXHJcbiAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgIH07XHJcbiIsIi8qKlxyXG4gICBBUEkgZm9yIGF1dG9tYXRpYyBjcmVhdGlvbiBvZiBsYWJlbHMgZm9yIFVJIFNsaWRlcnMgKGpxdWVyeS11aSlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICB0b29sdGlwcyA9IHJlcXVpcmUoJy4vdG9vbHRpcHMnKSxcclxuICAgIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKSxcclxuICAgIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbi8qKiBDcmVhdGUgbGFiZWxzIGZvciBhIGpxdWVyeS11aS1zbGlkZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjcmVhdGUoc2xpZGVyKSB7XHJcbiAgICAvLyByZW1vdmUgb2xkIG9uZXM6XHJcbiAgICB2YXIgb2xkID0gc2xpZGVyLnNpYmxpbmdzKCcudWktc2xpZGVyLWxhYmVscycpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlcicpLmdldCgwKSA9PSBzbGlkZXIuZ2V0KDApKTtcclxuICAgIH0pLnJlbW92ZSgpO1xyXG4gICAgLy8gQ3JlYXRlIGxhYmVscyBjb250YWluZXJcclxuICAgIHZhciBsYWJlbHMgPSAkKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLWxhYmVsc1wiLz4nKTtcclxuICAgIGxhYmVscy5kYXRhKCd1aS1zbGlkZXInLCBzbGlkZXIpO1xyXG5cclxuICAgIC8vIFNldHVwIG9mIHVzZWZ1bCB2YXJzIGZvciBsYWJlbCBjcmVhdGlvblxyXG4gICAgdmFyIG1heCA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdtYXgnKSxcclxuICAgICAgICBtaW4gPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnbWluJyksXHJcbiAgICAgICAgc3RlcCA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdzdGVwJyksXHJcbiAgICAgICAgc3RlcHMgPSBNYXRoLmZsb29yKChtYXggLSBtaW4pIC8gc3RlcCk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgYW5kIHBvc2l0aW9uaW5nIGxhYmVsc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gc3RlcHM7IGkrKykge1xyXG4gICAgICAgIC8vIENyZWF0ZSBsYWJlbFxyXG4gICAgICAgIHZhciBsYmwgPSAkKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLWxhYmVsXCI+PHNwYW4gY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWwtdGV4dFwiLz48L2Rpdj4nKTtcclxuICAgICAgICAvLyBTZXR1cCBsYWJlbCB3aXRoIGl0cyB2YWx1ZVxyXG4gICAgICAgIHZhciBsYWJlbFZhbHVlID0gbWluICsgaSAqIHN0ZXA7XHJcbiAgICAgICAgbGJsLmNoaWxkcmVuKCcudWktc2xpZGVyLWxhYmVsLXRleHQnKS50ZXh0KGxhYmVsVmFsdWUpO1xyXG4gICAgICAgIGxibC5kYXRhKCd1aS1zbGlkZXItdmFsdWUnLCBsYWJlbFZhbHVlKTtcclxuICAgICAgICAvLyBQb3NpdGlvbmF0ZVxyXG4gICAgICAgIHBvc2l0aW9uYXRlKGxibCwgaSwgc3RlcHMpO1xyXG4gICAgICAgIC8vIEFkZCB0byBjb250YWluZXJcclxuICAgICAgICBsYWJlbHMuYXBwZW5kKGxibCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlciBmb3IgbGFiZWxzIGNsaWNrIHRvIHNlbGVjdCBpdHMgcG9zaXRpb24gdmFsdWVcclxuICAgIGxhYmVscy5vbignY2xpY2snLCAnLnVpLXNsaWRlci1sYWJlbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsID0gJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXItdmFsdWUnKSxcclxuICAgICAgICAgICAgc2xpZGVyID0gJCh0aGlzKS5wYXJlbnQoKS5kYXRhKCd1aS1zbGlkZXInKTtcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHZhbCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbnNlcnQgbGFiZWxzIGFzIGEgc2libGluZyBvZiB0aGUgc2xpZGVyIChjYW5ub3QgYmUgaW5zZXJ0ZWQgaW5zaWRlKVxyXG4gICAgc2xpZGVyLmFmdGVyKGxhYmVscyk7XHJcbn1cclxuXHJcbi8qKiBQb3NpdGlvbmF0ZSB0byB0aGUgY29ycmVjdCBwb3NpdGlvbiBhbmQgd2lkdGggYW4gVUkgbGFiZWwgYXQgQGxibFxyXG5mb3IgdGhlIHJlcXVpcmVkIHBlcmNlbnRhZ2Utd2lkdGggQHN3XHJcbioqL1xyXG5mdW5jdGlvbiBwb3NpdGlvbmF0ZShsYmwsIGksIHN0ZXBzKSB7XHJcbiAgICB2YXIgc3cgPSAxMDAgLyBzdGVwcztcclxuICAgIHZhciBsZWZ0ID0gaSAqIHN3IC0gc3cgKiAwLjUsXHJcbiAgICAgICAgcmlnaHQgPSAxMDAgLSBsZWZ0IC0gc3csXHJcbiAgICAgICAgYWxpZ24gPSAnY2VudGVyJztcclxuICAgIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgYWxpZ24gPSAnbGVmdCc7XHJcbiAgICAgICAgbGVmdCA9IDA7XHJcbiAgICB9IGVsc2UgaWYgKGkgPT0gc3RlcHMpIHtcclxuICAgICAgICBhbGlnbiA9ICdyaWdodCc7XHJcbiAgICAgICAgcmlnaHQgPSAwO1xyXG4gICAgfVxyXG4gICAgbGJsLmNzcyh7XHJcbiAgICAgICAgJ3RleHQtYWxpZ24nOiBhbGlnbixcclxuICAgICAgICBsZWZ0OiBsZWZ0ICsgJyUnLFxyXG4gICAgICAgIHJpZ2h0OiByaWdodCArICclJ1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBVcGRhdGUgdGhlIHZpc2liaWxpdHkgb2YgbGFiZWxzIG9mIGEganF1ZXJ5LXVpLXNsaWRlciBkZXBlbmRpbmcgaWYgdGhleSBmaXQgaW4gdGhlIGF2YWlsYWJsZSBzcGFjZS5cclxuU2xpZGVyIG5lZWRzIHRvIGJlIHZpc2libGUuXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoc2xpZGVyKSB7XHJcbiAgICAvLyBHZXQgbGFiZWxzIGZvciBzbGlkZXJcclxuICAgIHZhciBsYWJlbHNfYyA9IHNsaWRlci5zaWJsaW5ncygnLnVpLXNsaWRlci1sYWJlbHMnKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXInKS5nZXQoMCkgPT0gc2xpZGVyLmdldCgwKSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBsYWJlbHMgPSBsYWJlbHNfYy5maW5kKCcudWktc2xpZGVyLWxhYmVsLXRleHQnKTtcclxuXHJcbiAgICAvLyBBcHBseSBhdXRvc2l6ZVxyXG4gICAgaWYgKChzbGlkZXIuZGF0YSgnc2xpZGVyLWF1dG9zaXplJykgfHwgZmFsc2UpLnRvU3RyaW5nKCkgPT0gJ3RydWUnKVxyXG4gICAgICAgIGF1dG9zaXplKHNsaWRlciwgbGFiZWxzKTtcclxuXHJcbiAgICAvLyBHZXQgYW5kIGFwcGx5IGxheW91dFxyXG4gICAgdmFyIGxheW91dF9uYW1lID0gc2xpZGVyLmRhdGEoJ3NsaWRlci1sYWJlbHMtbGF5b3V0JykgfHwgJ3N0YW5kYXJkJyxcclxuICAgICAgICBsYXlvdXQgPSBsYXlvdXRfbmFtZSBpbiBsYXlvdXRzID8gbGF5b3V0c1tsYXlvdXRfbmFtZV0gOiBsYXlvdXRzLnN0YW5kYXJkO1xyXG4gICAgbGFiZWxzX2MuYWRkQ2xhc3MoJ2xheW91dC0nICsgbGF5b3V0X25hbWUpO1xyXG4gICAgbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscyk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRvb2x0aXBzXHJcbiAgICB0b29sdGlwcy5jcmVhdGVUb29sdGlwKGxhYmVsc19jLmNoaWxkcmVuKCksIHtcclxuICAgICAgICB0aXRsZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJCh0aGlzKS50ZXh0KCk7IH1cclxuICAgICAgICAsIHBlcnNpc3RlbnQ6IHRydWVcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhdXRvc2l6ZShzbGlkZXIsIGxhYmVscykge1xyXG4gICAgdmFyIHRvdGFsX3dpZHRoID0gMDtcclxuICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0b3RhbF93aWR0aCArPSAkKHRoaXMpLm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBjID0gc2xpZGVyLmNsb3Nlc3QoJy51aS1zbGlkZXItY29udGFpbmVyJyksXHJcbiAgICAgICAgbWF4ID0gcGFyc2VGbG9hdChjLmNzcygnbWF4LXdpZHRoJykpLFxyXG4gICAgICAgIG1pbiA9IHBhcnNlRmxvYXQoYy5jc3MoJ21pbi13aWR0aCcpKTtcclxuICAgIGlmIChtYXggIT0gTnVtYmVyLk5hTiAmJiB0b3RhbF93aWR0aCA+IG1heClcclxuICAgICAgICB0b3RhbF93aWR0aCA9IG1heDtcclxuICAgIGlmIChtaW4gIT0gTnVtYmVyLk5hTiAmJiB0b3RhbF93aWR0aCA8IG1pbilcclxuICAgICAgICB0b3RhbF93aWR0aCA9IG1pbjtcclxuICAgIGMud2lkdGgodG90YWxfd2lkdGgpO1xyXG59XHJcblxyXG4vKiogU2V0IG9mIGRpZmZlcmVudCBsYXlvdXRzIGZvciBsYWJlbHMsIGFsbG93aW5nIGRpZmZlcmVudCBraW5kcyBvZiBcclxucGxhY2VtZW50IGFuZCB2aXN1YWxpemF0aW9uIHVzaW5nIHRoZSBzbGlkZXIgZGF0YSBvcHRpb24gJ2xhYmVscy1sYXlvdXQnLlxyXG5Vc2VkIGJ5ICd1cGRhdGUnLCBhbG1vc3QgdGhlICdzdGFuZGFyZCcgbXVzdCBleGlzdCBhbmQgY2FuIGJlIGluY3JlYXNlZFxyXG5leHRlcm5hbGx5XHJcbioqL1xyXG52YXIgbGF5b3V0cyA9IHt9O1xyXG4vKiogU2hvdyB0aGUgbWF4aW11bSBudW1iZXIgb2YgbGFiZWxzIGluIGVxdWFsbHkgc2l6ZWQgZ2FwcyBidXRcclxudGhlIGxhc3QgbGFiZWwgdGhhdCBpcyBlbnN1cmVkIHRvIGJlIHNob3dlZCBldmVuIGlmIGl0IGNyZWF0ZXNcclxuYSBoaWdoZXIgZ2FwIHdpdGggdGhlIHByZXZpb3VzIG9uZS5cclxuKiovXHJcbmxheW91dHMuc3RhbmRhcmQgPSBmdW5jdGlvbiBzdGFuZGFyZF9sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGVyZSBhcmUgbW9yZSBsYWJlbHMgdGhhbiBhdmFpbGFibGUgc3BhY2VcclxuICAgIC8vIEdldCBtYXhpbXVtIGxhYmVsIHdpZHRoXHJcbiAgICB2YXIgaXRlbV93aWR0aCA9IDA7XHJcbiAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHR3ID0gJCh0aGlzKS5vdXRlcldpZHRoKHRydWUpO1xyXG4gICAgICAgIGlmICh0dyA+PSBpdGVtX3dpZHRoKVxyXG4gICAgICAgICAgICBpdGVtX3dpZHRoID0gdHc7XHJcbiAgICB9KTtcclxuICAgIC8vIElmIHRoZXJlIGlzIHdpZHRoLCBpZiBub3QsIGVsZW1lbnQgaXMgbm90IHZpc2libGUgY2Fubm90IGJlIGNvbXB1dGVkXHJcbiAgICBpZiAoaXRlbV93aWR0aCA+IDApIHtcclxuICAgICAgICAvLyBHZXQgdGhlIHJlcXVpcmVkIHN0ZXBwaW5nIG9mIGxhYmVsc1xyXG4gICAgICAgIHZhciBsYWJlbHNfc3RlcCA9IE1hdGguY2VpbChpdGVtX3dpZHRoIC8gKHNsaWRlci53aWR0aCgpIC8gbGFiZWxzLmxlbmd0aCkpLFxyXG4gICAgICAgIGxhYmVsc19zdGVwcyA9IGxhYmVscy5sZW5ndGggLyBsYWJlbHNfc3RlcDtcclxuICAgICAgICBpZiAobGFiZWxzX3N0ZXAgPiAxKSB7XHJcbiAgICAgICAgICAgIC8vIEhpZGUgdGhlIGxhYmVscyBvbiBwb3NpdGlvbnMgb3V0IG9mIHRoZSBzdGVwXHJcbiAgICAgICAgICAgIHZhciBuZXdpID0gMCxcclxuICAgICAgICAgICAgICAgIGxpbWl0ID0gbGFiZWxzLmxlbmd0aCAtIDEgLSBsYWJlbHNfc3RlcDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYWJlbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBsYmwgPSAkKGxhYmVsc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKGkgKyAxKSA8IGxhYmVscy5sZW5ndGggJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgIGkgJSBsYWJlbHNfc3RlcCB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGkgPiBsaW1pdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgbGJsLmhpZGUoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvd1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYmwuc2hvdygpLnBhcmVudCgpLmFkZENsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwb3NpdGlvbmF0ZSBwYXJlbnRcclxuICAgICAgICAgICAgICAgICAgICAvLyBwb3NpdGlvbmF0ZShwYXJlbnQsIG5ld2ksIGxhYmVsc19zdGVwcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aSsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4vKiogU2hvdyBsYWJlbHMgbnVtYmVyIHZhbHVlcyBmb3JtYXR0ZWQgYXMgaG91cnMsIHdpdGggb25seVxyXG5pbnRlZ2VyIGhvdXJzIGJlaW5nIHNob3dlZCwgdGhlIG1heGltdW0gbnVtYmVyIG9mIGl0LlxyXG4qKi9cclxubGF5b3V0cy5ob3VycyA9IGZ1bmN0aW9uIGhvdXJzX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMsIHNob3dfYWxsKSB7XHJcbiAgICB2YXIgaW50TGFiZWxzID0gc2xpZGVyLmZpbmQoJy5pbnRlZ2VyLWhvdXInKTtcclxuICAgIGlmICghaW50TGFiZWxzLmxlbmd0aCkge1xyXG4gICAgICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdob3VyLXByb2Nlc3NlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHBhcnNlRmxvYXQoJHQudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgIGlmICh2ICE9IE51bWJlci5OYU4pIHtcclxuICAgICAgICAgICAgICAgICAgICB2ID0gbXUucm91bmRUbyh2LCAyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodiAlIDEgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdkZWNpbWFsLWhvdXInKS5oaWRlKCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYgJSAwLjUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5wYXJlbnQoKS5hZGRDbGFzcygnc3Ryb25nJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LnRleHQoVGltZVNwYW4uZnJvbUhvdXJzKHYpLnRvU2hvcnRTdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2ludGVnZXItaG91cicpLnNob3coKS5wYXJlbnQoKS5hZGRDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnRMYWJlbHMgPSBpbnRMYWJlbHMuYWRkKCR0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdob3VyLXByb2Nlc3NlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAoc2hvd19hbGwgIT09IHRydWUpXHJcbiAgICAgICAgbGF5b3V0cy5zdGFuZGFyZChzbGlkZXIsIGludExhYmVscy5wYXJlbnQoKSwgaW50TGFiZWxzKTtcclxufTtcclxubGF5b3V0c1snYWxsLXZhbHVlcyddID0gZnVuY3Rpb24gYWxsX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpIHtcclxuICAgIC8vIFNob3dpbmcgYWxsIGxhYmVsc1xyXG4gICAgbGFiZWxzX2Muc2hvdygpLmFkZENsYXNzKCd2aXNpYmxlJykuY2hpbGRyZW4oKS5zaG93KCk7XHJcbn07XHJcbmxheW91dHNbJ2FsbC1ob3VycyddID0gZnVuY3Rpb24gYWxsX2hvdXJzX2xheW91dCgpIHtcclxuICAgIC8vIEp1c3QgdXNlIGhvdXJzIGxheW91dCBidXQgc2hvd2luZyBhbGwgaW50ZWdlciBob3Vyc1xyXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2guY2FsbChhcmd1bWVudHMsIHRydWUpO1xyXG4gICAgbGF5b3V0cy5ob3Vycy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjcmVhdGU6IGNyZWF0ZSxcclxuICAgIHVwZGF0ZTogdXBkYXRlLFxyXG4gICAgbGF5b3V0czogbGF5b3V0c1xyXG59O1xyXG4iLCIvKiBTZXQgb2YgY29tbW9uIExDIGNhbGxiYWNrcyBmb3IgbW9zdCBBamF4IG9wZXJhdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gQUtBOiBhamF4RXJyb3JQb3B1cEhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkVycm9yKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgLy8gSWYgaXMgYSBjb25uZWN0aW9uIGFib3J0ZWQsIG5vIHNob3cgbWVzc2FnZS5cclxuICAgIC8vIHJlYWR5U3RhdGUgZGlmZmVyZW50IHRvICdkb25lOjQnIG1lYW5zIGFib3J0ZWQgdG9vLCBcclxuICAgIC8vIGJlY2F1c2Ugd2luZG93IGJlaW5nIGNsb3NlZC9sb2NhdGlvbiBjaGFuZ2VkXHJcbiAgICBpZiAobWVzc2FnZSA9PSAnYWJvcnQnIHx8IGp4LnJlYWR5U3RhdGUgIT0gNClcclxuICAgICAgICByZXR1cm47XHJcblxyXG4gICAgdmFyIG0gPSBtZXNzYWdlO1xyXG4gICAgdmFyIGlmcmFtZSA9IG51bGw7XHJcbiAgICBzaXplID0gcG9wdXAuc2l6ZSgnbGFyZ2UnKTtcclxuICAgIHNpemUuaGVpZ2h0IC09IDM0O1xyXG4gICAgaWYgKG0gPT0gJ2Vycm9yJykge1xyXG4gICAgICAgIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShqeC5yZXNwb25zZVRleHQsIHNpemUpO1xyXG4gICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgbSA9IG51bGw7XHJcbiAgICB9ICBlbHNlXHJcbiAgICAgICAgbSA9IG0gKyBcIjsgXCIgKyBleDtcclxuXHJcbiAgICAvLyBCbG9jayBhbGwgd2luZG93LCBub3Qgb25seSBjdXJyZW50IGVsZW1lbnRcclxuICAgICQuYmxvY2tVSShlcnJvckJsb2NrKG0sIG51bGwsIHBvcHVwLnN0eWxlKHNpemUpKSk7XHJcbiAgICBpZiAoaWZyYW1lKVxyXG4gICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgJCgnLmJsb2NrVUkgLmNsb3NlLXBvcHVwJykuY2xpY2soZnVuY3Rpb24gKCkgeyAkLnVuYmxvY2tVSSgpOyByZXR1cm4gZmFsc2U7IH0pO1xyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uQ29tcGxldGUoKSB7XHJcbiAgICAvLyBEaXNhYmxlIGxvYWRpbmdcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxvYWRpbmd0aW1lciB8fCB0aGlzLmxvYWRpbmdUaW1lcik7XHJcbiAgICAvLyBVbmJsb2NrXHJcbiAgICBpZiAodGhpcy5hdXRvVW5ibG9ja0xvYWRpbmcpIHtcclxuICAgICAgICAvLyBEb3VibGUgdW4tbG9jaywgYmVjYXVzZSBhbnkgb2YgdGhlIHR3byBzeXN0ZW1zIGNhbiBiZWluZyB1c2VkOlxyXG4gICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuYm94KTtcclxuICAgICAgICB0aGlzLmJveC51bmJsb2NrKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXJcclxuZnVuY3Rpb24gbGNPblN1Y2Nlc3MoZGF0YSwgdGV4dCwgangpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgLy8gU3VwcG9ydGVkIHRoZSBnZW5lcmljIGN0eC5lbGVtZW50IGZyb20ganF1ZXJ5LnJlbG9hZFxyXG4gICAgaWYgKGN0eC5lbGVtZW50KSBjdHguZm9ybSA9IGN0eC5lbGVtZW50O1xyXG4gICAgLy8gU3BlY2lmaWMgc3R1ZmYgb2YgYWpheEZvcm1zXHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIERvIEpTT04gYWN0aW9uIGJ1dCBpZiBpcyBub3QgSlNPTiBvciB2YWxpZCwgbWFuYWdlIGFzIEhUTUw6XHJcbiAgICBpZiAoIWRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgLy8gQXZvaWQgZW1wdHkgZG9jdW1lbnRzIGJlaW5nIHBhcnNlZCAocmFpc2UgZXJyb3IpXHJcbiAgICAgICAgaWYgKCQudHJpbShkYXRhKSkge1xyXG4gICAgICAgICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYSBtYWxmb3JtZWQgZG9jdW1lbnQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGb3IgJ3JlbG9hZCcgc3VwcG9ydCwgY2hlY2sgdG9vIHRoZSBjb250ZXh0Lm1vZGUsIGFuZCBib3RoIHJlbG9hZCBvciBhamF4Rm9ybXMgY2hlY2sgZGF0YSBhdHRyaWJ1dGUgdG9vXHJcbiAgICAgICAgY3R4LmJveElzQ29udGFpbmVyID0gY3R4LmJveElzQ29udGFpbmVyO1xyXG4gICAgICAgIHZhciByZXBsYWNlQm94Q29udGVudCA9XHJcbiAgICAgICAgICAoY3R4Lm9wdGlvbnMgJiYgY3R4Lm9wdGlvbnMubW9kZSA9PT0gJ3JlcGxhY2UtY29udGVudCcpIHx8XHJcbiAgICAgICAgICBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnO1xyXG5cclxuICAgICAgICAvLyBTdXBwb3J0IGZvciByZWxvYWQsIGF2b2lkaW5nIGltcG9ydGFudCBidWdzIHdpdGggcmVsb2FkaW5nIGJveGVzIHRoYXQgY29udGFpbnMgZm9ybXM6XHJcbiAgICAgICAgLy8gSWYgb3BlcmF0aW9uIGlzIGEgcmVsb2FkLCBkb24ndCBjaGVjayB0aGUgYWpheC1ib3hcclxuICAgICAgICB2YXIgamIgPSBuZXdodG1sO1xyXG4gICAgICAgIGlmICghY3R4LmlzUmVsb2FkKSB7XHJcbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgcmV0dXJuZWQgZWxlbWVudCBpcyB0aGUgYWpheC1ib3gsIGlmIG5vdCwgZmluZFxyXG4gICAgICAgICAgLy8gdGhlIGVsZW1lbnQgaW4gdGhlIG5ld2h0bWw6XHJcbiAgICAgICAgICBqYiA9IG5ld2h0bWwuZmlsdGVyKCcuYWpheC1ib3gnKTtcclxuICAgICAgICAgIGlmIChqYi5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICAgIGlmICghY3R4LmJveElzQ29udGFpbmVyICYmICFqYi5pcygnLmFqYXgtYm94JykpXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbC5maW5kKCcuYWpheC1ib3g6ZXEoMCknKTtcclxuICAgICAgICAgIGlmICghamIgfHwgamIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGFqYXgtYm94LCB1c2UgYWxsIGVsZW1lbnQgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpXHJcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIGJveCBjb250ZW50IHdpdGggdGhlIGNvbnRlbnQgb2YgdGhlIHJldHVybmVkIGJveFxyXG4gICAgICAgICAgICAvLyBvciBhbGwgaWYgdGhlcmUgaXMgbm8gYWpheC1ib3ggaW4gdGhlIHJlc3VsdC5cclxuICAgICAgICAgICAgamIgPSBqYi5pcygnLmFqYXgtYm94JykgPyBqYi5jb250ZW50cygpIDogamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpIHtcclxuICAgICAgICAgIGN0eC5ib3guZW1wdHkoKS5hcHBlbmQoamIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY3R4LmJveElzQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIC8vIGpiIGlzIGNvbnRlbnQgb2YgdGhlIGJveCBjb250YWluZXI6XHJcbiAgICAgICAgICAgIGN0eC5ib3guaHRtbChqYik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gYm94IGlzIGNvbnRlbnQgdGhhdCBtdXN0IGJlIHJlcGxhY2VkIGJ5IHRoZSBuZXcgY29udGVudDpcclxuICAgICAgICAgICAgY3R4LmJveC5yZXBsYWNlV2l0aChqYik7XHJcbiAgICAgICAgICAgIC8vIGFuZCByZWZyZXNoIHRoZSByZWZlcmVuY2UgdG8gYm94IHdpdGggdGhlIG5ldyBlbGVtZW50XHJcbiAgICAgICAgICAgIGN0eC5ib3ggPSBqYjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEl0IHN1cHBvcnRzIG5vcm1hbCBhamF4IGZvcm1zIGFuZCBzdWJmb3JtcyB0aHJvdWdoIGZpZWxkc2V0LmFqYXhcclxuICAgICAgICBpZiAoY3R4LmJveC5pcygnZm9ybS5hamF4JykgfHwgY3R4LmJveC5pcygnZmllbGRzZXQuYWpheCcpKVxyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94O1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2Zvcm0uYWpheDplcSgwKScpO1xyXG4gICAgICAgICAgaWYgKGN0eC5mb3JtLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2ZpZWxkc2V0LmFqYXg6ZXEoMCknKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKFxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50c1xyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBNb3ZlIGZvY3VzIHRvIHRoZSBlcnJvcnMgYXBwZWFyZWQgb24gdGhlIHBhZ2UgKGlmIHRoZXJlIGFyZSk6XHJcbiAgICAgICAgdmFyIHZhbGlkYXRpb25TdW1tYXJ5ID0gamIuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKTtcclxuICAgICAgICBpZiAodmFsaWRhdGlvblN1bW1hcnkubGVuZ3RoKVxyXG4gICAgICAgICAgbW92ZUZvY3VzVG8odmFsaWRhdGlvblN1bW1hcnkpO1xyXG4gICAgICAgIC8vIFRPRE86IEl0IHNlZW1zIHRoYXQgaXQgcmV0dXJucyBhIGRvY3VtZW50LWZyYWdtZW50IGluc3RlYWQgb2YgYSBlbGVtZW50IGFscmVhZHkgaW4gZG9jdW1lbnRcclxuICAgICAgICAvLyBmb3IgY3R4LmZvcm0gKG1heWJlIGpiIHRvbz8pIHdoZW4gdXNpbmcgKiBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnICogXHJcbiAgICAgICAgLy8gKG1heWJlIG9uIG90aGVyIGNhc2VzIHRvbz8pLlxyXG4gICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgW2piLCBjdHguZm9ybSwganhdKTtcclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IGN0eC5mb3JtLmRhdGEoJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJykgfHwgJ0RvbmUhJztcclxuICAgIGN0eC5ib3guYmxvY2soaW5mb0Jsb2NrKG1lc3NhZ2UsIHtcclxuICAgICAgICBjc3M6IHBvcHVwLnN0eWxlKHBvcHVwLnNpemUoJ3NtYWxsJykpXHJcbiAgICB9KSlcclxuICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyBcclxuICAgIH0pO1xyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcblxyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2IGNsYXNzPVwib2stZ28tYm94XCIvPicpO1xyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPHNwYW4gY2xhc3M9XCJzdWNjZXNzLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuU3VjY2Vzc01lc3NhZ2UpKTtcclxuICAgIGlmIChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKVxyXG4gICAgICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhZGRpdGlvbmFsLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpKTtcclxuXHJcbiAgICB2YXIgb2tCdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBvay1hY3Rpb24gY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNva1wiLz4nKS5hcHBlbmQoZGF0YS5Pa0xhYmVsKTtcclxuICAgIHZhciBnb0J0biA9ICcnO1xyXG4gICAgaWYgKGRhdGEuR29VUkwgJiYgZGF0YS5Hb0xhYmVsKSB7XHJcbiAgICAgICAgZ29CdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBnby1hY3Rpb25cIi8+JykuYXR0cignaHJlZicsIGRhdGEuR29VUkwpLmFwcGVuZChkYXRhLkdvTGFiZWwpO1xyXG4gICAgICAgIC8vIEZvcmNpbmcgdGhlICdjbG9zZS1hY3Rpb24nIGluIHN1Y2ggYSB3YXkgdGhhdCBmb3IgaW50ZXJuYWwgbGlua3MgdGhlIHBvcHVwIGdldHMgY2xvc2VkIGluIGEgc2FmZSB3YXk6XHJcbiAgICAgICAgZ29CdG4uY2xpY2soZnVuY3Rpb24gKCkgeyBva0J0bi5jbGljaygpOyBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pOyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWN0aW9ucyBjbGVhcmZpeFwiLz4nKS5hcHBlbmQob2tCdG4pLmFwcGVuZChnb0J0bikpO1xyXG5cclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY3R4LmJveCwgbnVsbCwge1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkge1xyXG4gICAgLy8gSWYgaXMgYSBKU09OIHJlc3VsdDpcclxuICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGlmIChjdHggJiYgY3R4LmJveClcclxuICAgICAgICAgICAgLy8gQ2xlYW4gcHJldmlvdXMgdmFsaWRhdGlvbiBlcnJvcnNcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY3R4LmJveCk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDA6IGdlbmVyYWwgc3VjY2VzcyBjb2RlLCBzaG93IG1lc3NhZ2Ugc2F5aW5nIHRoYXQgJ2FsbCB3YXMgZmluZSdcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQsIGRhdGEpO1xyXG4gICAgICAgICAgICBpZiAoY3R4ICYmIGN0eC5mb3JtICYmIGN0eC5mb3JtLnRyaWdnZXIpXHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDE6IGRvIGEgcmVkaXJlY3RcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAxKSB7XHJcbiAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDI6IHNob3cgbG9naW4gcG9wdXAgKHdpdGggdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgaWYgKGN0eCAmJiBjdHguYmxvY2sgJiYgY3R4LmJveC51bmJsb2NrKVxyXG4gICAgICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDMpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDM6IHJlbG9hZCBjdXJyZW50IHBhZ2UgY29udGVudCB0byB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICAvLyBOb3RlOiB0byByZWxvYWQgc2FtZSB1cmwgcGFnZSBjb250ZW50LCBpcyBiZXR0ZXIgcmV0dXJuIHRoZSBodG1sIGRpcmVjdGx5IGZyb21cclxuICAgICAgICAgICAgLy8gdGhpcyBhamF4IHNlcnZlciByZXF1ZXN0LlxyXG4gICAgICAgICAgICAvL2NvbnRhaW5lci51bmJsb2NrKCk7IGlzIGJsb2NrZWQgYW5kIHVuYmxvY2tlZCBhZ2FpbiBieSB0aGUgcmVsb2FkIG1ldGhvZDpcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAoY3R4ICYmIGN0eC5ib3ggJiYgY3R4LmJveC5yZWxvYWQpXHJcbiAgICAgICAgICAgICAgICBjdHguYm94LnJlbG9hZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNCkge1xyXG4gICAgICAgICAgICAvLyBTaG93IFN1Y2Nlc3NNZXNzYWdlLCBhdHRhY2hpbmcgYW5kIGV2ZW50IGhhbmRsZXIgdG8gZ28gdG8gUmVkaXJlY3RVUkxcclxuICAgICAgICAgICAgY3R4LmJveC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQuUmVkaXJlY3RVUkwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuU3VjY2Vzc01lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDUpIHtcclxuICAgICAgICAgICAgLy8gQ2hhbmdlIG1haW4tYWN0aW9uIGJ1dHRvbiBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgYnRuID0gY3R4LmZvcm0uZmluZCgnLm1haW4tYWN0aW9uJyk7XHJcbiAgICAgICAgICAgIHZhciBkbXNnID0gYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpO1xyXG4gICAgICAgICAgICBpZiAoIWRtc2cpXHJcbiAgICAgICAgICAgICAgICBidG4uZGF0YSgnZGVmYXVsdC10ZXh0JywgYnRuLnRleHQoKSk7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBkYXRhLlJlc3VsdCB8fCBidG4uZGF0YSgnc3VjY2Vzcy1wb3N0LXRleHQnKSB8fCAnRG9uZSEnO1xyXG4gICAgICAgICAgICBidG4udGV4dChtc2cpO1xyXG4gICAgICAgICAgICAvLyBBZGRpbmcgc3VwcG9ydCB0byByZXNldCBidXR0b24gdGV4dCB0byBkZWZhdWx0IG9uZVxyXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBGaXJzdCBuZXh0IGNoYW5nZXMgaGFwcGVucyBvbiB0aGUgZm9ybTpcclxuICAgICAgICAgICAgJChjdHguZm9ybSkub25lKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgYnRuLnRleHQoYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgZm9yIGN1c3RvbSBoYW5kbGVyc1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA2KSB7XHJcbiAgICAgICAgICAgIC8vIE9rLUdvIGFjdGlvbnMgcG9wdXAgd2l0aCAnc3VjY2VzcycgYW5kICdhZGRpdGlvbmFsJyBtZXNzYWdlcy5cclxuICAgICAgICAgICAgc2hvd09rR29Qb3B1cChjdHgsIGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgNzogc2hvdyBtZXNzYWdlIHNheWluZyBjb250YWluZWQgYXQgZGF0YS5SZXN1bHQuTWVzc2FnZS5cclxuICAgICAgICAgICAgLy8gVGhpcyBjb2RlIGFsbG93IGF0dGFjaCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGluIGRhdGEuUmVzdWx0IHRvIGRpc3Rpbmd1aXNoXHJcbiAgICAgICAgICAgIC8vIGRpZmZlcmVudCByZXN1bHRzIGFsbCBzaG93aW5nIGEgbWVzc2FnZSBidXQgbWF5YmUgbm90IGJlaW5nIGEgc3VjY2VzcyBhdCBhbGxcclxuICAgICAgICAgICAgLy8gYW5kIG1heWJlIGRvaW5nIHNvbWV0aGluZyBtb3JlIGluIHRoZSB0cmlnZ2VyZWQgZXZlbnQgd2l0aCB0aGUgZGF0YSBvYmplY3QuXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0Lk1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA4KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgdmFsaWRhdGlvbiBtZXNzYWdlc1xyXG4gICAgICAgICAgICB2YXIgdmFsaWRhdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpO1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uSGVscGVyLnNldEVycm9ycyhjdHguZm9ybSwgZGF0YS5SZXN1bHQuRXJyb3JzKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA+IDEwMCkge1xyXG4gICAgICAgICAgICAvLyBVc2VyIENvZGU6IHRyaWdnZXIgY3VzdG9tIGV2ZW50IHRvIG1hbmFnZSByZXN1bHRzOlxyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwgangsIGN0eF0pO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIGRhdGEuQ29kZSA8IDBcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYW4gZXJyb3IgY29kZS5cclxuXHJcbiAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0uZ2V0KDApLCBjdHguY2hhbmdlZEVsZW1lbnRzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBcIkVycm9yOiBcIiArIGRhdGEuQ29kZSArIFwiOiBcIiArIEpTT04uc3RyaW5naWZ5KGRhdGEuUmVzdWx0ID8gKGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA6IGRhdGEuUmVzdWx0KSA6ICcnKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbigkKCc8ZGl2Lz4nKS5hcHBlbmQobWVzc2FnZSksIGN0eC5ib3gsIG51bGwsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVycm9yOiBsY09uRXJyb3IsXHJcbiAgICAgICAgc3VjY2VzczogbGNPblN1Y2Nlc3MsXHJcbiAgICAgICAgY29tcGxldGU6IGxjT25Db21wbGV0ZSxcclxuICAgICAgICBkb0pTT05BY3Rpb246IGRvSlNPTkFjdGlvblxyXG4gICAgfTtcclxufSIsIi8qIEZvcm1zIHN1Ym1pdHRlZCB2aWEgQUpBWCAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgY2FsbGJhY2tzID0gcmVxdWlyZSgnLi9hamF4Q2FsbGJhY2tzJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpLFxyXG4gICAgdmFsaWRhdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgZ2V0WFBhdGggPSByZXF1aXJlKCcuL2dldFhQYXRoJyk7XHJcblxyXG5qUXVlcnkgPSAkO1xyXG5cclxuLy8gR2xvYmFsIHNldHRpbmdzLCB3aWxsIGJlIHVwZGF0ZWQgb24gaW5pdCBidXQgaXMgYWNjZXNzZWRcclxuLy8gdGhyb3VnaCBjbG9zdXJlIGZyb20gYWxsIGZ1bmN0aW9ucy5cclxuLy8gTk9URTogaXMgc3RhdGljLCBkb2Vzbid0IGFsbG93cyBtdWx0aXBsZSBjb25maWd1cmF0aW9uLCBvbmUgaW5pdCBjYWxsIHJlcGxhY2UgcHJldmlvdXNcclxuLy8gRGVmYXVsdHM6XHJcbnZhciBzZXR0aW5ncyA9IHtcclxuICAgIGxvYWRpbmdEZWxheTogMCxcclxuICAgIGVsZW1lbnQ6IGRvY3VtZW50XHJcbn07XHJcblxyXG4vLyBBZGFwdGVkIGNhbGxiYWNrc1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXIoKSB7XHJcbiAgICBjYWxsYmFja3MuY29tcGxldGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEVycm9yUG9wdXBIYW5kbGVyKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gQ29tbW9uIGxvZ2ljXHJcbiAgICBjYWxsYmFja3MuZXJyb3IuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlcigpIHtcclxuICBjYWxsYmFja3Muc3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG4vKipcclxuICBQZXJmb3JtcyB0aGUgdmFsaWRhdGlvbiBvbiB0aGUgZm9ybSBvciBzdWJmb3JtIGFzIGRldGVybWluZVxyXG4gIHRoZSB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgKEBjdHgpLCByZXR1cm5pbmcgdHJ1ZSBmb3Igc3VjY2Vzc1xyXG4gIGFuZCBmYWxzZSBmb3Igc29tZSBlcnJvciAoZWxlbWVudHMgZ2V0IG1hcmtlZCB3aXRoIHRoZSBlcnJvcixcclxuICBqdXN0IHRoZSBjYWxsZXIgbXVzdCBzdG9wIGFueSB0YXNrIG9uIGZhbHNlKS5cclxuKiovXHJcbmZ1bmN0aW9uIHZhbGlkYXRlRm9ybShjdHgpIHtcclxuICAvLyBWYWxpZGF0aW9uc1xyXG4gIHZhciB2YWxpZGF0aW9uUGFzc2VkID0gdHJ1ZTtcclxuICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3JtcyB0aHJvdWggZmllbGRzZXQuYWpheCwgd2UgbXVzdCBleGVjdXRlIHZhbGlkYXRpb25zIGFuZCB2ZXJpZmljYXRpb25cclxuICAvLyBpbiB0d28gc3RlcHMgYW5kIHVzaW5nIHRoZSByZWFsIGZvcm0gdG8gbGV0IHZhbGlkYXRpb24gbWVjaGFuaXNtIHdvcmtcclxuICB2YXIgaXNTdWJmb3JtID0gY3R4LmZvcm0uaXMoJ2ZpZWxkc2V0LmFqYXgnKTtcclxuICB2YXIgYWN0dWFsRm9ybSA9IGlzU3ViZm9ybSA/IGN0eC5mb3JtLmNsb3Nlc3QoJ2Zvcm0nKSA6IGN0eC5mb3JtLFxyXG4gICAgICBkaXNhYmxlZFN1bW1hcmllcyA9IG5ldyBqUXVlcnkoKSxcclxuICAgICAgZGlzYWJsZWRGaWVsZHMgPSBuZXcgalF1ZXJ5KCk7XHJcblxyXG4gIC8vIE9uIHN1YmZvcm0gdmFsaWRhdGlvbiwgd2UgZG9uJ3Qgd2FudCB0aGUgb3V0c2lkZSBzdWJmb3JtIGVsZW1lbnRzIGFuZCB2YWxpZGF0aW9uLXN1bW1hcnkgY29udHJvbHMgdG8gYmUgYWZmZWN0ZWRcclxuICAvLyBieSB0aGlzIHZhbGlkYXRpb24gKHRvIGF2b2lkIHRvIHNob3cgZXJyb3JzIHRoZXJlIHRoYXQgZG9lc24ndCBpbnRlcmVzdCB0byB0aGUgcmVzdCBvZiB0aGUgZm9ybSlcclxuICAvLyBUbyBmdWxsZmlsbCB0aGlzIHJlcXVpc2l0LCB3ZSBuZWVkIHRvIGhpZGUgaXQgZm9yIHRoZSB2YWxpZGF0b3IgZm9yIGEgd2hpbGUgYW5kIGxldCBvbmx5IGFmZmVjdFxyXG4gIC8vIGFueSBsb2NhbCBzdW1tYXJ5IChpbnNpZGUgdGhlIHN1YmZvcm0pLlxyXG4gIC8vIFRoZSBzYW1lIGZvciBmb3JtIGVsZW1lbnRzIG91dHNpZGUgdGhlIHN1YmZvcm0sIHdlIGRvbid0IHdhbnQgaXRzIGVycm9ycyBmb3Igbm93LlxyXG4gIGlmIChpc1N1YmZvcm0pIHtcclxuICAgIHZhciBvdXRzaWRlRWxlbWVudHMgPSAoZnVuY3Rpb24oZikge1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIE9ubHkgdGhvc2UgdGhhdCBhcmUgb3V0c2lkZSB0aGUgc3ViZm9ybVxyXG4gICAgICAgIHJldHVybiAhJC5jb250YWlucyhmLCB0aGlzKTtcclxuICAgICAgfTtcclxuICAgIH0pKGN0eC5mb3JtLmdldCgwKSk7XHJcblxyXG4gICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBhY3R1YWxGb3JtXHJcbiAgICAuZmluZCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nKVxyXG4gICAgLmZpbHRlcihvdXRzaWRlRWxlbWVudHMpXHJcbiAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAnZmFsc2UnKTtcclxuXHJcbiAgICBkaXNhYmxlZEZpZWxkcyA9IGFjdHVhbEZvcm1cclxuICAgIC5maW5kKCdbZGF0YS12YWw9dHJ1ZV0nKVxyXG4gICAgLmZpbHRlcihvdXRzaWRlRWxlbWVudHMpXHJcbiAgICAuYXR0cignZGF0YS12YWwnLCAnZmFsc2UnKTtcclxuICB9XHJcblxyXG4gIC8vIEZpcnN0IGF0IGFsbCwgaWYgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gIHZhciB2YWxvYmplY3QgPSBhY3R1YWxGb3JtLmRhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlLlxyXG4gIC8vIEN1c3RvbSB2YWxpZGF0aW9uIGNhbiBiZSBhdHRhY2hlZCB0byBmb3JtcyBvciBmaWVsZHNldCwgYnV0XHJcbiAgLy8gdG8gc3VwcG9ydCBzdWJmb3Jtcywgb25seSBleGVjdXRlIGluIHRoZSBjdHguZm9ybSBlbGVtZW50IChjYW4gYmUgXHJcbiAgLy8gYSBmaWVsc2V0IHN1YmZvcm0pIGFuZCBhbnkgY2hpbGRyZW4gZmllbGRzZXQuXHJcbiAgY3R4LmZvcm0uYWRkKGN0eC5mb3JtLmZpbmQoJ2ZpZWxkc2V0JykpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGN1c3ZhbCA9ICQodGhpcykuZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicpO1xyXG4gICAgaWYgKGN1c3ZhbCAmJiBjdXN2YWwudmFsaWRhdGUgJiYgY3VzdmFsLnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnMoY3R4LmZvcm0pO1xyXG4gICAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIFRvIHN1cHBvcnQgc3ViLWZvcm1zLCB3ZSBtdXN0IGNoZWNrIHRoYXQgdmFsaWRhdGlvbnMgZXJyb3JzIGhhcHBlbmVkIGluc2lkZSB0aGVcclxuICAvLyBzdWJmb3JtIGFuZCBub3QgaW4gb3RoZXIgZWxlbWVudHMsIHRvIGRvbid0IHN0b3Agc3VibWl0IG9uIG5vdCByZWxhdGVkIGVycm9ycy5cclxuICAvLyAod2UgYXZvaWQgZXhlY3V0ZSB2YWxpZGF0aW9uIG9uIHRoYXQgZWxlbWVudHMgYnV0IGNvdWxkIGhhcHBlbiBhIHByZXZpb3VzIHZhbGlkYXRpb24pXHJcbiAgLy8gSnVzdCBsb29rIGZvciBtYXJrZWQgZWxlbWVudHM6XHJcbiAgaWYgKGlzU3ViZm9ybSAmJiBjdHguZm9ybS5maW5kKCcuaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmxlbmd0aClcclxuICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuXHJcbiAgLy8gUmUtZW5hYmxlIGFnYWluIHRoYXQgc3VtbWFyaWVzIHByZXZpb3VzbHkgZGlzYWJsZWRcclxuICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgZGlzYWJsZWRTdW1tYXJpZXMuYXR0cignZGF0YS12YWxtc2ctc3VtbWFyeScsICd0cnVlJyk7XHJcbiAgICBkaXNhYmxlZEZpZWxkcy5hdHRyKCdkYXRhLXZhbCcsICd0cnVlJyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdmFsaWRhdGlvblBhc3NlZDtcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuKiBBamF4IEZvcm1zIGdlbmVyaWMgZnVuY3Rpb24uXHJcbiogUmVzdWx0IGV4cGVjdGVkIGlzOlxyXG4qIC0gaHRtbCwgZm9yIHZhbGlkYXRpb24gZXJyb3JzIGZyb20gc2VydmVyLCByZXBsYWNpbmcgY3VycmVudCAuYWpheC1ib3ggY29udGVudFxyXG4qIC0ganNvbiwgd2l0aCBzdHJ1Y3R1cmU6IHsgQ29kZTogaW50ZWdlci1udW1iZXIsIFJlc3VsdDogc3RyaW5nLW9yLW9iamVjdCB9XHJcbiogICBDb2RlIG51bWJlcnM6XHJcbiogICAgLSBOZWdhdGl2ZTogZXJyb3JzLCB3aXRoIGEgUmVzdWx0IG9iamVjdCB7IEVycm9yTWVzc2FnZTogc3RyaW5nIH1cclxuKiAgICAtIFplcm86IHN1Y2Nlc3MgcmVzdWx0LCBpdCBzaG93cyBhIG1lc3NhZ2Ugd2l0aCBjb250ZW50OiBSZXN1bHQgc3RyaW5nLCBlbHNlIGZvcm0gZGF0YSBhdHRyaWJ1dGUgJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJywgZWxzZSBhIGdlbmVyaWMgbWVzc2FnZVxyXG4qICAgIC0gMTogc3VjY2VzcyByZXN1bHQsIFJlc3VsdCBjb250YWlucyBhIFVSTCwgdGhlIHBhZ2Ugd2lsbCBiZSByZWRpcmVjdGVkIHRvIHRoYXQuXHJcbiogICAgLSBNYWpvciAxOiBzdWNjZXNzIHJlc3VsdCwgd2l0aCBjdXN0b20gaGFuZGxlciB0aHJvdWdodCB0aGUgZm9ybSBldmVudCAnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnLlxyXG4qL1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKGV2ZW50KSB7XHJcbiAgICAvLyBDb250ZXh0IHZhciwgdXNlZCBhcyBhamF4IGNvbnRleHQ6XHJcbiAgICB2YXIgY3R4ID0ge307XHJcbiAgICAvLyBEZWZhdWx0IGRhdGEgZm9yIHJlcXVpcmVkIHBhcmFtczpcclxuICAgIGN0eC5mb3JtID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmZvcm0gOiBudWxsKSB8fCAkKHRoaXMpO1xyXG4gICAgY3R4LmJveCA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5ib3ggOiBudWxsKSB8fCBjdHguZm9ybS5jbG9zZXN0KFwiLmFqYXgtYm94XCIpO1xyXG4gICAgdmFyIGFjdGlvbiA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5hY3Rpb24gOiBudWxsKSB8fCBjdHguZm9ybS5hdHRyKCdhY3Rpb24nKSB8fCAnJztcclxuXHJcbiAgICB2YXIgcG9zdFZhbGlkYXRpb24gPSBjdHguZm9ybS5kYXRhKCdwb3N0LXZhbGlkYXRpb24nKTtcclxuICAgIHZhciByZXF1ZXN0cyA9IGN0eC5mb3JtLmRhdGEoJ3hoci1yZXF1ZXN0cycpIHx8IFtdO1xyXG4gICAgY3R4LmZvcm0uZGF0YSgneGhyLXJlcXVlc3RzJywgcmVxdWVzdHMpO1xyXG5cclxuICAgIGlmICghcG9zdFZhbGlkYXRpb24pIHtcclxuICAgICAgICAvLyBDaGVjayB2YWxpZGF0aW9uXHJcbiAgICAgICAgaWYgKHZhbGlkYXRlRm9ybShjdHgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAvLyBWYWxpZGF0aW9uIGZhaWxlZCwgc3VibWl0IGNhbm5vdCBjb250aW51ZSwgb3V0IVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICBjdHguY2hhbmdlZEVsZW1lbnRzID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmNoYW5nZWRFbGVtZW50cyA6IG51bGwpIHx8IGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGN0eC5mb3JtLmdldCgwKSk7XHJcblxyXG4gICAgLy8gTm90aWZpY2F0aW9uIGV2ZW50IHRvIGFsbG93IHNjcmlwdHMgdG8gaG9vayBhZGRpdGlvbmFsIHRhc2tzIGJlZm9yZSBzZW5kIGRhdGFcclxuICAgIGN0eC5mb3JtLnRyaWdnZXIoJ3ByZXN1Ym1pdCcsIFtjdHhdKTtcclxuXHJcbiAgICAvLyBMb2FkaW5nLCB3aXRoIHJldGFyZFxyXG4gICAgY3R4LmxvYWRpbmd0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGN0eC5ib3guYmxvY2soYmxvY2tQcmVzZXRzLmxvYWRpbmcpO1xyXG4gICAgfSwgc2V0dGluZ3MubG9hZGluZ0RlbGF5KTtcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIHZhciBkYXRhID0gY3R4LmZvcm0uZmluZCgnOmlucHV0Jykuc2VyaWFsaXplKCk7XHJcblxyXG4gICAgLy8gQWJvcnQgcHJldmlvdXMgcmVxdWVzdHNcclxuICAgICQuZWFjaChyZXF1ZXN0cywgZnVuY3Rpb24gKHJlcSkge1xyXG4gICAgICAgIGlmIChyZXEgJiYgcmVxLmFib3J0KVxyXG4gICAgICAgICAgICByZXEuYWJvcnQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IGFjdGlvbixcclxuICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgc3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlcixcclxuICAgICAgICBjb21wbGV0ZTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZWdpc3RlciByZXF1ZXN0XHJcbiAgICByZXF1ZXN0cy5wdXNoKHJlcXVlc3QpO1xyXG4gICAgLy8gU2V0IGF1dG8tZGVzcmVnaXN0cmF0aW9uXHJcbiAgICB2YXIgcmVxSW5kZXggPSByZXF1ZXN0cy5sZW5ndGggLSAxO1xyXG4gICAgcmVxdWVzdC5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIERlbGV0ZSwgbm90IHNwbGljZSwgc2luY2Ugd2UgbmVlZCB0byBwcmVzZXJ2ZSB0aGUgb3JkZXJcclxuICAgICAgICBkZWxldGUgcmVxdWVzdHNbcmVxSW5kZXhdO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRG8gcG9zdCB2YWxpZGF0aW9uOlxyXG4gICAgaWYgKHBvc3RWYWxpZGF0aW9uICYmIHBvc3RWYWxpZGF0aW9uICE9PSAnbmV2ZXInKSB7XHJcbiAgICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGVGb3JtKGN0eCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RvcCBub3JtYWwgUE9TVDpcclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBJdCBwZXJmb3JtcyBhIHBvc3Qgc3VibWl0IG9uIHRoZSBnaXZlbiBmb3JtIG9uIGJhY2tncm91bmQsXHJcbiAgICB3aXRob3V0IG5vdGlmaWNhdGlvbnMgb2YgYW55IGtpbmQsIGp1c3QgZm9yIHRoZSBpbnN0YW50IHNhdmluZyBmZWF0dXJlLlxyXG4qKi9cclxuZnVuY3Rpb24gZG9JbnN0YW50U2F2aW5nKGZvcm0sIGNoYW5nZWRFbGVtZW50cykge1xyXG4gICAgZm9ybSA9ICQoZm9ybSk7XHJcbiAgICB2YXIgYWN0aW9uID0gZm9ybS5hdHRyKCdhY3Rpb24nKSB8fCBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJykgfHwgJyc7XHJcbiAgICB2YXIgY3R4ID0geyBmb3JtOiBmb3JtLCBib3g6IGZvcm0gfTtcclxuXHJcbiAgICAvLyBOb3RpZmljYXRpb24gZXZlbnQgdG8gYWxsb3cgc2NyaXB0cyB0byBob29rIGFkZGl0aW9uYWwgdGFza3MgYmVmb3JlIHNlbmQgZGF0YVxyXG4gICAgZm9ybS50cmlnZ2VyKCdwcmVzdWJtaXQnLCBbY3R4XSk7XHJcblxyXG4gICAgdmFyIGRhdGEgPSBjdHguZm9ybS5maW5kKCc6aW5wdXQnKS5zZXJpYWxpemUoKTtcclxuXHJcbiAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICB2YXIgcmVxdWVzdCA9ICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBhY3Rpb24sXHJcbiAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgY29udGV4dDogY3R4LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gVHJhY2tlZCBjaGFuZ2VkIGVsZW1lbnRzIGFyZSBzYXZlZFxyXG4gICAgICAgICAgICBpZiAoY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5jbG9zZXN0KCdmb3JtJykuZ2V0KDApLCBjaGFuZ2VkRWxlbWVudHMpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHZhciByZXF1ZXN0cyA9IGZvcm0uZGF0YSgneGhyLXJlcXVlc3RzJykgfHwgW107XHJcbiAgICBmb3JtLmRhdGEoJ3hoci1yZXF1ZXN0cycsIHJlcXVlc3RzKTtcclxuXHJcbiAgICAvLyBSZWdpc3RlciByZXF1ZXN0XHJcbiAgICByZXF1ZXN0cy5wdXNoKHJlcXVlc3QpO1xyXG4gICAgLy8gU2V0IGF1dG8tZGVzcmVnaXN0cmF0aW9uXHJcbiAgICB2YXIgcmVxSW5kZXggPSByZXF1ZXN0cy5sZW5ndGggLSAxO1xyXG4gICAgcmVxdWVzdC5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIERlbGV0ZSwgbm90IHNwbGljZSwgc2luY2Ugd2UgbmVlZCB0byBwcmVzZXJ2ZSB0aGUgb3JkZXJcclxuICAgICAgICBkZWxldGUgcmVxdWVzdHNbcmVxSW5kZXhdO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHJlcXVlc3Q7XHJcbn1cclxuXHJcbi8vIFB1YmxpYyBpbml0aWFsaXphdGlvblxyXG5mdW5jdGlvbiBpbml0QWpheEZvcm1zKG9wdGlvbnMpIHtcclxuICAgICQuZXh0ZW5kKHRydWUsIHNldHRpbmdzLCBvcHRpb25zKTtcclxuXHJcbiAgICAvKiBBdHRhY2ggYSBkZWxlZ2F0ZWQgaGFuZGxlciB0byBtYW5hZ2UgYWpheCBmb3JtcyAqL1xyXG4gICAgJChzZXR0aW5ncy5lbGVtZW50KS5vbignc3VibWl0JywgJ2Zvcm0uYWpheCcsIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIpO1xyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgZm9yIGEgc3BlY2lhbCBhamF4IGZvcm0gY2FzZTogc3ViZm9ybXMsIHVzaW5nIGZpZWxkc2V0cy4gKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ2NsaWNrJywgJ2ZpZWxkc2V0LmFqYXggLmFqYXgtZmllbGRzZXQtc3VibWl0JyxcclxuICAgICAgICBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgIHZhciBmb3JtID0gJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldC5hamF4Jyk7XHJcblxyXG4gICAgICAgICAgZXZlbnQuZGF0YSA9IHtcclxuICAgICAgICAgICAgZm9ybTogZm9ybSxcclxuICAgICAgICAgICAgYm94OiBmb3JtLmNsb3Nlc3QoJy5hamF4LWJveCcpLFxyXG4gICAgICAgICAgICBhY3Rpb246IGZvcm0uZGF0YSgnYWpheC1maWVsZHNldC1hY3Rpb24nKSxcclxuICAgICAgICAgICAgLy8gRGF0YSBzYXZlZDpcclxuICAgICAgICAgICAgY2hhbmdlZEVsZW1lbnRzOiBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmb3JtLmdldCgwKSwgZm9ybS5maW5kKCc6aW5wdXRbbmFtZV0nKSlcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICByZXR1cm4gYWpheEZvcm1zU3VibWl0SGFuZGxlcihldmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxufVxyXG4vKiBVTlVTRUQ/XHJcbmZ1bmN0aW9uIGFqYXhGb3JtTWVzc2FnZU9uSHRtbFJldHVybmVkV2l0aG91dFZhbGlkYXRpb25FcnJvcnMoZm9ybSwgbWVzc2FnZSkge1xyXG4gICAgdmFyICR0ID0gJChmb3JtKTtcclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIGZvcm0gZXJyb3JzLCBzaG93IGEgc3VjY2Vzc2Z1bCBtZXNzYWdlXHJcbiAgICBpZiAoJHQuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICR0LmJsb2NrKGluZm9CbG9jayhtZXNzYWdlLCB7XHJcbiAgICAgICAgICAgIGNzczogcG9wdXBTdHlsZShwb3B1cFNpemUoJ3NtYWxsJykpXHJcbiAgICAgICAgfSkpXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7ICR0LnVuYmxvY2soKTsgcmV0dXJuIGZhbHNlOyB9KTtcclxuICAgIH1cclxufVxyXG4qL1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXQ6IGluaXRBamF4Rm9ybXMsXHJcbiAgICAgICAgb25TdWNjZXNzOiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlcixcclxuICAgICAgICBvbkVycm9yOiBhamF4RXJyb3JQb3B1cEhhbmRsZXIsXHJcbiAgICAgICAgb25Db21wbGV0ZTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyLFxyXG4gICAgICAgIGRvSW5zdGFudFNhdmluZzogZG9JbnN0YW50U2F2aW5nXHJcbiAgICB9O1xyXG4iLCIvKiBBdXRvIGNhbGN1bGF0ZSBzdW1tYXJ5IG9uIERPTSB0YWdnaW5nIHdpdGggY2xhc3NlcyB0aGUgZWxlbWVudHMgaW52b2x2ZWQuXHJcbiAqL1xyXG52YXIgbnUgPSByZXF1aXJlKCcuL251bWJlclV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMoKSB7XHJcbiAgICAkKCd0YWJsZS5jYWxjdWxhdGUtaXRlbXMtdG90YWxzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVSb3coKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciB0ciA9ICR0LmNsb3Nlc3QoJ3RyJyk7XHJcbiAgICAgICAgICAgIHZhciBpcCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZScpO1xyXG4gICAgICAgICAgICB2YXIgaXEgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKTtcclxuICAgICAgICAgICAgdmFyIGl0ID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXRvdGFsJyk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKG51LmdldE1vbmV5TnVtYmVyKGlwKSAqIG51LmdldE1vbmV5TnVtYmVyKGlxLCAxKSwgaXQpO1xyXG4gICAgICAgICAgICB0ci50cmlnZ2VyKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQodGhpcykuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXByaWNlLCAuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKS5vbignY2hhbmdlJywgY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChjYWxjdWxhdGVSb3cpO1xyXG4gICAgICAgICQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVTdW1tYXJ5KGZvcmNlKSB7XHJcbiAgICAkKCcuY2FsY3VsYXRlLXN1bW1hcnknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciBzID0gYy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeScpO1xyXG4gICAgICAgIHZhciBkID0gYy5maW5kKCd0YWJsZS5jYWxjdWxhdGUtc3VtbWFyeS1ncm91cCcpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGMoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAsIGZlZSA9IDAsIGR1cmF0aW9uID0gMDtcclxuICAgICAgICAgICAgdmFyIGdyb3VwcyA9IHt9O1xyXG4gICAgICAgICAgICBkLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwVG90YWwgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbENoZWNrZWQgPSAkKHRoaXMpLmlzKCcuY2FsY3VsYXRlLWFsbC1pdGVtcycpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQ2hlY2tlZCB8fCBpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuaXMoJzpjaGVja2VkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBUb3RhbCArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbDplcSgwKScpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eTplcSgwKScpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmVlICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWZlZTplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWR1cmF0aW9uOmVxKDApJykpICogcTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRvdGFsICs9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBncm91cHNbJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwJyldID0gZ3JvdXBUb3RhbDtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGdyb3VwVG90YWwsICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihkdXJhdGlvbiwgJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLmZpbmQoJy5ncm91cC10b3RhbC1kdXJhdGlvbicpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgc3VtbWFyeSB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcih0b3RhbCwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS10b3RhbCcpKTtcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZmVlLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWZlZScpKTtcclxuICAgICAgICAgICAgLy8gQW5kIGV2ZXJ5IGdyb3VwIHRvdGFsIHZhbHVlXHJcbiAgICAgICAgICAgIGZvciAodmFyIGcgaW4gZ3JvdXBzKSB7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cHNbZ10sIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktZ3JvdXAtJyArIGcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuY2hhbmdlKGNhbGMpO1xyXG4gICAgICAgIGQub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIGNhbGMpO1xyXG4gICAgICAgIGNhbGMoKTtcclxuICAgICAgICBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnLCB0cnVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSBkZXRhaWwgb2YgYSBwcmljaW5nIHN1bW1hcnksIG9uZSBkZXRhaWwgbGluZSBwZXIgc2VsZWN0ZWQgaXRlbVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkZCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbCcpLFxyXG4gICAgICAgICAgICAkdCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbC10cGwnKS5jaGlsZHJlbigndHI6ZXEoMCknKSxcclxuICAgICAgICAgICAgJGMgPSAkcy5jbG9zZXN0KCdmb3JtJyksXHJcbiAgICAgICAgICAgICRpdGVtcyA9ICRjLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbScpO1xyXG5cclxuICAgICAgICAvLyBEbyBpdCFcclxuICAgICAgICAvLyBSZW1vdmUgb2xkIGxpbmVzXHJcbiAgICAgICAgJGQuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyBDcmVhdGUgbmV3IG9uZXNcclxuICAgICAgICAkaXRlbXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyICRpID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25jZXB0ID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgcHJpY2UgPSBudS5nZXRNb25leU51bWJlcigkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2U6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgcm93IGFuZCBzZXQgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICB2YXIgJHJvdyA9ICR0LmNsb25lKClcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZGV0YWlsLXRwbCcpXHJcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2RldGFpbCcpO1xyXG4gICAgICAgICAgICAgICAgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY29uY2VwdCcpLnRleHQoY29uY2VwdCk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihwcmljZSwgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIHRhYmxlXHJcbiAgICAgICAgICAgICAgICAkZC5hcHBlbmQoJHJvdyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgIHZhciAkYyA9ICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAvLyBJbml0aWFsIGNhbGN1bGF0aW9uXHJcbiAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCk7XHJcbiAgICAvLyBDYWxjdWxhdGUgb24gcmVsZXZhbnQgZm9ybSBjaGFuZ2VzXHJcbiAgICAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLmNoYW5nZSh1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzIGV2ZW50XHJcbiAgICAkYy5vbignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbn1cclxuXHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvblRhYmxlSXRlbXM6IHNldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyxcclxuICAgICAgICBvblN1bW1hcnk6IHNldHVwQ2FsY3VsYXRlU3VtbWFyeSxcclxuICAgICAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5OiB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5LFxyXG4gICAgICAgIG9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5XHJcbiAgICB9OyIsIi8qIEZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBkb2N1bWVudCAob3IgaW4gQGNvbnRhaW5lcilcclxud2l0aCB0aGUgaHRtbDUgYXR0cmlidXRlICdhdXRvZm9jdXMnIChvciBhbHRlcm5hdGl2ZSBAY3NzU2VsZWN0b3IpLlxyXG5JdCdzIGZpbmUgYXMgYSBwb2x5ZmlsbCBhbmQgZm9yIGFqYXggbG9hZGVkIGNvbnRlbnQgdGhhdCB3aWxsIG5vdFxyXG5nZXQgdGhlIGJyb3dzZXIgc3VwcG9ydCBvZiB0aGUgYXR0cmlidXRlLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZvY3VzKGNvbnRhaW5lciwgY3NzU2VsZWN0b3IpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8IGRvY3VtZW50KTtcclxuICAgIGNvbnRhaW5lci5maW5kKGNzc1NlbGVjdG9yIHx8ICdbYXV0b2ZvY3VzXScpLmZvY3VzKCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0ZvY3VzOyIsIi8qKiBBdXRvLWZpbGwgbWVudSBzdWItaXRlbXMgdXNpbmcgdGFiYmVkIHBhZ2VzIC1vbmx5IHdvcmtzIGZvciBjdXJyZW50IHBhZ2UgaXRlbXMtICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdXRvZmlsbFN1Ym1lbnUoKSB7XHJcbiAgICAkKCcuYXV0b2ZpbGwtc3VibWVudSAuY3VycmVudCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRtZW51ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBzdWJtZW51IGVsZW1lbnRzIGZyb20gdGFicyBtYXJrZWQgd2l0aCBjbGFzcyAnYXV0b2ZpbGwtc3VibWVudS1pdGVtcydcclxuICAgICAgICB2YXIgaXRlbXMgPSAkKCcuYXV0b2ZpbGwtc3VibWVudS1pdGVtcyBsaTpub3QoLnJlbW92YWJsZSknKTtcclxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBpdGVtcywgY3JlYXRlIHRoZSBzdWJtZW51IGNsb25pbmcgaXQhXHJcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHN1Ym1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHBhcmVudG1lbnUuYXBwZW5kKHN1Ym1lbnUpO1xyXG4gICAgICAgICAgICAvLyBDbG9uaW5nIHdpdGhvdXQgZXZlbnRzOlxyXG4gICAgICAgICAgICB2YXIgbmV3aXRlbXMgPSBpdGVtcy5jbG9uZShmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAkKHN1Ym1lbnUpLmFwcGVuZChuZXdpdGVtcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIGF0dGFjaCBldmVudHMgdG8gbWFpbnRhaW4gdGhlIHRhYmJlZCBpbnRlcmZhY2Ugd29ya2luZ1xyXG4gICAgICAgICAgICAvLyBOZXcgSXRlbXMgKGNsb25lZCkgbXVzdCBjaGFuZ2UgdGFiczpcclxuICAgICAgICAgICAgbmV3aXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBpbiB0aGUgb3JpZ2luYWwgaXRlbVxyXG4gICAgICAgICAgICAgICAgJChcImFbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIsIGl0ZW1zKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTdG9wIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gT3JpZ2luYWwgaXRlbXMgbXVzdCBjaGFuZ2UgbWVudTpcclxuICAgICAgICAgICAgaXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbmV3aXRlbXMucGFyZW50KCkuZmluZChcImFcIikucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKS5cclxuICAgICAgICAgICAgICAgIGZpbHRlcihcIipbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG5NYW5hZ2UgYWxsIHRoYXQgZXZlbnRzIGF0dGFjaGVkIHRvIGRhdGVzIG1hZGUgdW5hdmFpbGFibGUgYnkgdGhlIHVzZXJcclxudG8gbm90aWZ5IGFib3V0IHdoYXQgdGhhdCBtZWFucy5cclxuXHJcbk1hZGUgZm9yIHVzZSBpbiB0aGUgTW9udGhseSBjYWxlbmRhciwgbWF5YmUgcmV1c2FibGUuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIG9iamVjdFV0aWxzID0gcmVxdWlyZSgnLi9vYmplY3RVdGlscycpO1xyXG5yZXF1aXJlKFwiZGF0ZS1mb3JtYXQtbGl0ZVwiKTtcclxuXHJcbi8qKlxyXG5UaGUgQGVsZW1lbnQgbXVzdCBiZSBhIGRvbSBlbGVtZW50IGNvbnRhaW5pbmcgdGhhdCB3aWxsIGNvbnRhaW4gdGhlIGluZm9ybWF0aW9uXHJcbmFuZCB3aWxsIHVzZSBhbiB1bCBlbGVtZW50IHRvIGxpc3Qgbm90aWZpY2F0aW9ucy4gVGhlIGVsZW1lbnQgd2lsbCBiZSBoaWRkZW5cclxuaW5pdGlhbGx5IGFuZCBhbnkgdGltZSB0aGF0LCBvbiByZW5kZXJpbmcsIHRoZXJlIGFyZSBub3Qgbm90aWZpY2F0aW9ucy5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQm9va2luZ3NOb3RpZmljYXRpb24oZWxlbWVudCkge1xyXG5cclxuICB0aGlzLiRlbCA9ICQoZWxlbWVudCk7XHJcbiAgdGhpcy4kbGlzdCA9IHRoaXMuJGVsLmZpbmQoJ3VsJyk7XHJcbiAgaWYgKCF0aGlzLiRsaXN0Lmxlbmd0aClcclxuICAgIHRoaXMuJGxpc3QgPSAkKCc8dWwvPicpLmFwcGVuZFRvKHRoaXMuJGVsKTtcclxuXHJcbiAgdGhpcy5yZWdpc3RlcmVkID0ge307XHJcblxyXG4gIHRoaXMucmVnaXN0ZXIgPSBmdW5jdGlvbiByZWdpc3Rlcih0b2dnbGUsIGRhdGEsIHN0ckRhdGUpIHtcclxuICAgIHZhciBsID0gdGhpcy5yZWdpc3RlcmVkO1xyXG4gICAgaWYgKHRvZ2dsZSkge1xyXG4gICAgICAvLyByZWdpc3RlciAoaWYgc29tZXRoaW5nKVxyXG4gICAgICB2YXIgZXZzID0gZGF0YS5zbG90c1tzdHJEYXRlXS5ldmVudHNJZHM7XHJcbiAgICAgIGlmIChldnMpIHtcclxuICAgICAgICBsW3N0ckRhdGVdID0gb2JqZWN0VXRpbHMuZmlsdGVyUHJvcGVydGllcyhkYXRhLmV2ZW50cywgZnVuY3Rpb24gKGspIHsgcmV0dXJuIGV2cy5pbmRleE9mKGspICE9IC0xOyB9KTtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gdW5yZWdpc3RlclxyXG4gICAgICBkZWxldGUgbFtzdHJEYXRlXTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICB0aGlzLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcclxuICAgIC8vIFJlbmV3IHRoZSBsaXN0XHJcbiAgICB0aGlzLiRsaXN0LmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcblxyXG4gICAgdmFyIGhhc05vdGlmaWNhdGlvbnMgPSBmYWxzZTtcclxuXHJcbiAgICBmb3IgKHZhciBzdHJEYXRlIGluIHRoaXMucmVnaXN0ZXJlZCkge1xyXG4gICAgICBpZiAoIXRoaXMucmVnaXN0ZXJlZC5oYXNPd25Qcm9wZXJ0eShzdHJEYXRlKSkgY29udGludWU7XHJcblxyXG4gICAgICB2YXIgZXZlbnRzID0gdGhpcy5yZWdpc3RlcmVkW3N0ckRhdGVdO1xyXG4gICAgICB2YXIgZGF0ZSA9IGRhdGVJU08ucGFyc2Uoc3RyRGF0ZSkuZm9ybWF0KCdERERELCBNTU0gRCcpO1xyXG4gICAgICB2YXIgbXNnID0gJCgnPHNwYW4vPicpLnRleHQoZGF0ZSArIFwiOiBcIikub3V0ZXJIdG1sKCk7XHJcblxyXG4gICAgICB2YXIgZXZlbnRzSHRtbCA9IFtdO1xyXG4gICAgICBmb3IgKHZhciBwIGluIGV2ZW50cykge1xyXG4gICAgICAgIGlmICghZXZlbnRzLmhhc093blByb3BlcnR5KHApKSBjb250aW51ZTtcclxuICAgICAgICB2YXIgZXYgPSBldmVudHNbcF07XHJcbiAgICAgICAgdmFyIGl0ZW0gPSAkKCc8YSB0YXJnZXQ9XCJfYmxhbmtcIiAvPicpLmF0dHIoJ2hyZWYnLCBldi51cmwpLnRleHQoZXYuc3VtbWFyeSB8fCAnYm9va2luZycpO1xyXG4gICAgICAgIGV2ZW50c0h0bWwucHVzaChpdGVtLm91dGVySHRtbCgpKTtcclxuXHJcbiAgICAgICAgaGFzTm90aWZpY2F0aW9ucyA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgbXNnICs9IGV2ZW50c0h0bWwuam9pbignLCAnKTtcclxuXHJcbiAgICAgICQoJzxsaS8+JylcclxuICAgICAgLmh0bWwobXNnKVxyXG4gICAgICAuYXBwZW5kVG8odGhpcy4kbGlzdCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGhhc05vdGlmaWNhdGlvbnMpXHJcbiAgICAgIHRoaXMuJGVsLnNob3coKTtcclxuICAgIGVsc2VcclxuICAgICAgdGhpcy4kZWwuaGlkZSgpO1xyXG5cclxuICB9O1xyXG59OyIsIi8qKlxyXG4gIE1vbnRobHkgY2FsZW5kYXIgY2xhc3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgTGNXaWRnZXQgPSByZXF1aXJlKCcuLi9DWC9MY1dpZGdldCcpLFxyXG4gIGV4dGVuZCA9IHJlcXVpcmUoJy4uL0NYL2V4dGVuZCcpLFxyXG4gIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpLFxyXG4gIG9iamVjdFV0aWxzID0gcmVxdWlyZSgnLi9vYmplY3RVdGlscycpLFxyXG4gIEJvb2tpbmdzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9Cb29raW5nc05vdGlmaWNhdGlvbicpO1xyXG5cclxudmFyIGV2ZW50cyA9IHtcclxuICAgIGRhdGFDaGFuZ2VkOiAnZGF0YUNoYW5nZWQnXHJcbn07XHJcblxyXG4vKipcclxuICBQcml2YXRlIHV0aWxzXHJcbioqL1xyXG5cclxuLyoqXHJcbiAgUHJlZmV0Y2ggbmV4dCBtb250aCAoYmFzZWQgb24gdGhlIGdpdmVuIGRhdGVzKVxyXG4gIE5vdGU6IHRoaXMgY29kZSBpcyB2ZXJ5IHNpbWlsYXIgdG8gdXRpbHMud2Vla2x5Q2hlY2tBbmRQcmVmZXRjaFxyXG4qKi9cclxuZnVuY3Rpb24gbW9udGhseUNoZWNrQW5kUHJlZmV0Y2gobW9udGhseSwgY3VycmVudERhdGVzUmFuZ2UpIHtcclxuICAvLyBXZSBnZXQgdGhlIG5leHQgbW9udGggZGF0ZXMtcmFuZ2UsIGJ1dFxyXG4gIC8vIHVzaW5nIGFzIGJhc2UtZGF0ZSBhIGRhdGUgaW5zaWRlIGN1cnJlbnQgZGlzcGxheWVkIG1vbnRoLCB0aGF0IG1vc3QgdGltZXMgaXNcclxuICAvLyBub3QgdGhlIG1vbnRoIG9mIHRoZSBzdGFydCBkYXRlIGluIGN1cnJlbnQgZGF0ZSwgdGhlbiBqdXN0IGZvcndhcmQgNyBkYXlzIHRoYXRcclxuICAvLyB0byBlbnN1cmUgd2UgcGljayB0aGUgY29ycmVjdCBtb250aDpcclxuICB2YXIgbmV4dERhdGVzUmFuZ2UgPSB1dGlscy5kYXRlLm5leHRNb250aFdlZWtzKHV0aWxzLmRhdGUuYWRkRGF5cyhjdXJyZW50RGF0ZXNSYW5nZS5zdGFydCwgNyksIDEsIG1vbnRobHkuc2hvd1NpeFdlZWtzKTtcclxuICAvLyBBcyB3ZSBsb2FkIGZ1bGwgd2Vla3MsIG1vc3QgdGltZXMgdGhlIGZpcnN0IHdlZWsgb2YgYSBtb250aCBpcyBhbHJlYWR5IGxvYWRlZCBiZWNhdXNlIFxyXG4gIC8vIHRoZSB3ZWVrIGlzIHNoYXJlZCB3aXRoIHRoZSBwcmV2aW91cyBtb250aCwgdGhlbiBqdXN0IGNoZWNrIGlmIHRoZSBzdGFydCBvZiB0aGUgbmV3XHJcbiAgLy8gcmFuZ2UgaXMgYWxyZWFkeSBpbiBjYWNoZSBhbmQgc2hyaW5rIHRoZSByYW5nZSB0byBiZSByZXF1ZXN0ZWQsIGF2b2lkaW5nIGNvbmZsaWN0IG9uXHJcbiAgLy8gbG9hZGluZyB0aGUgdWRwYXRlZCBkYXRhIChpZiB0aGF0IHdlZWsgd2FzIGJlaW5nIGVkaXRlZCkgYW5kIGZhc3RlciByZXF1ZXN0IGxvYWQgc2luY2VcclxuICAvLyB0aGUgc2VydmVyIG5lZWRzIHRvIGRvIGxlc3MgY29tcHV0YXRpb246XHJcbiAgdmFyIGQgPSBuZXh0RGF0ZXNSYW5nZS5zdGFydCxcclxuICAgIHN0cmVuZCA9IGRhdGVJU08uZGF0ZUxvY2FsKG5leHREYXRlc1JhbmdlLmVuZCksXHJcbiAgICBzdHJkID0gZGF0ZUlTTy5kYXRlTG9jYWwoZCwgdHJ1ZSk7XHJcbiAgaWYgKG1vbnRobHkuZGF0YSAmJiBtb250aGx5LmRhdGEuc2xvdHMpXHJcbiAgd2hpbGUgKG1vbnRobHkuZGF0YS5zbG90c1tzdHJkXSAmJlxyXG4gICAgc3RyZCA8PSBzdHJlbmQpIHtcclxuICAgIG5leHREYXRlc1JhbmdlLnN0YXJ0ID0gZCA9IHV0aWxzLmRhdGUuYWRkRGF5cyhkLCAxKTtcclxuICAgIHN0cmQgPSBkYXRlSVNPLmRhdGVMb2NhbChkLCB0cnVlKTtcclxuICB9XHJcblxyXG4gIGlmICghdXRpbHMubW9udGhseUlzRGF0YUluQ2FjaGUobW9udGhseSwgbmV4dERhdGVzUmFuZ2UpKSB7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IHdlZWsgaW4gYWR2YW5jZVxyXG4gICAgdmFyIHByZWZldGNoUXVlcnkgPSB1dGlscy5kYXRlc1RvUXVlcnkobmV4dERhdGVzUmFuZ2UpO1xyXG4gICAgbW9udGhseS5mZXRjaERhdGEocHJlZmV0Y2hRdWVyeSwgbnVsbCwgdHJ1ZSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuTW92ZSB0aGUgYmluZGVkIGRhdGVzIHRoZSBhbW91bnQgb2YgQG1vbnRocyBzcGVjaWZpZWQuXHJcbk5vdGU6IG1vc3Qgb2YgdGhpcyBjb2RlIGlzIGFkYXB0ZWQgZnJvbSB1dGlscy5tb3ZlQmluZFJhbmdlSW5EYXlzLFxyXG50aGUgY29tcGxleGl0eSBjb21lcyBmcm9tIHRoZSBwcmVmZXRjaCBmZWF0dXJlLCBtYXliZSBjYW4gYmUgdGhhdCBsb2dpY1xyXG5pc29sYXRlZCBhbmQgc2hhcmVkP1xyXG4qKi9cclxuZnVuY3Rpb24gbW92ZUJpbmRNb250aChtb250aGx5LCBtb250aHMpIHtcclxuICAvLyBXZSBnZXQgdGhlIG5leHQgJ21vbnRocycgKG5lZ2F0aXZlIGZvciBwcmV2aW91cykgZGF0ZXMtcmFuZ2UsIGJ1dFxyXG4gIC8vIHVzaW5nIGFzIGJhc2UtZGF0ZSBhIGRhdGUgaW5zaWRlIGN1cnJlbnQgZGlzcGxheWVkIG1vbnRoLCB0aGF0IG1vc3QgdGltZXMgaXNcclxuICAvLyBub3QgdGhlIG1vbnRoIG9mIHRoZSBzdGFydCBkYXRlIGluIGN1cnJlbnQgZGF0ZSwgdGhlbiBqdXN0IGZvcndhcmQgNyBkYXlzIHRoYXRcclxuICAvLyB0byBlbnN1cmUgd2UgcGljayB0aGUgY29ycmVjdCBtb250aDpcclxuICB2YXIgZGF0ZXNSYW5nZSA9IHV0aWxzLmRhdGUubmV4dE1vbnRoV2Vla3ModXRpbHMuZGF0ZS5hZGREYXlzKG1vbnRobHkuZGF0ZXNSYW5nZS5zdGFydCwgNyksIG1vbnRocywgbW9udGhseS5zaG93U2l4V2Vla3MpO1xyXG5cclxuICAvLyBDaGVjayBjYWNoZSBiZWZvcmUgdHJ5IHRvIGZldGNoXHJcbiAgdmFyIGluQ2FjaGUgPSB1dGlscy5tb250aGx5SXNEYXRhSW5DYWNoZShtb250aGx5LCBkYXRlc1JhbmdlKTtcclxuXHJcbiAgaWYgKGluQ2FjaGUpIHtcclxuICAgIC8vIEp1c3Qgc2hvdyB0aGUgZGF0YVxyXG4gICAgbW9udGhseS5iaW5kRGF0YShkYXRlc1JhbmdlKTtcclxuICAgIC8vIFByZWZldGNoIGV4Y2VwdCBpZiB0aGVyZSBpcyBvdGhlciByZXF1ZXN0IGluIGNvdXJzZSAoY2FuIGJlIHRoZSBzYW1lIHByZWZldGNoLFxyXG4gICAgLy8gYnV0IHN0aWxsIGRvbid0IG92ZXJsb2FkIHRoZSBzZXJ2ZXIpXHJcbiAgICBpZiAobW9udGhseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaChtb250aGx5LCBkYXRlc1JhbmdlKTtcclxuICB9IGVsc2Uge1xyXG5cclxuICAgIC8vIFN1cHBvcnQgZm9yIHByZWZldGNoaW5nOlxyXG4gICAgLy8gSXRzIGF2b2lkZWQgaWYgdGhlcmUgYXJlIHJlcXVlc3RzIGluIGNvdXJzZSwgc2luY2VcclxuICAgIC8vIHRoYXQgd2lsbCBiZSBhIHByZWZldGNoIGZvciB0aGUgc2FtZSBkYXRhLlxyXG4gICAgaWYgKG1vbnRobHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCkge1xyXG4gICAgICAvLyBUaGUgbGFzdCByZXF1ZXN0IGluIHRoZSBwb29sICptdXN0KiBiZSB0aGUgbGFzdCBpbiBmaW5pc2hcclxuICAgICAgLy8gKG11c3QgYmUgb25seSBvbmUgaWYgYWxsIGdvZXMgZmluZSk6XHJcbiAgICAgIHZhciByZXF1ZXN0ID0gbW9udGhseS5mZXRjaERhdGEucmVxdWVzdHNbbW9udGhseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAvLyBXYWl0IGZvciB0aGUgZmV0Y2ggdG8gcGVyZm9ybSBhbmQgc2V0cyBsb2FkaW5nIHRvIG5vdGlmeSB1c2VyXHJcbiAgICAgIG1vbnRobHkuJGVsLmFkZENsYXNzKG1vbnRobHkuY2xhc3Nlcy5mZXRjaGluZyk7XHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgbW92ZUJpbmRNb250aChtb250aGx5LCBtb250aHMpO1xyXG4gICAgICAgIG1vbnRobHkuJGVsLnJlbW92ZUNsYXNzKG1vbnRobHkuY2xhc3Nlcy5mZXRjaGluZyB8fCAnXycpO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZldGNoIChkb3dubG9hZCkgdGhlIGRhdGEgYW5kIHNob3cgb24gcmVhZHk6XHJcbiAgICBtb250aGx5XHJcbiAgICAuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShkYXRlc1JhbmdlKSlcclxuICAgIC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgbW9udGhseS5iaW5kRGF0YShkYXRlc1JhbmdlKTtcclxuICAgICAgLy8gUHJlZmV0Y2hcclxuICAgICAgbW9udGhseUNoZWNrQW5kUHJlZmV0Y2gobW9udGhseSwgZGF0ZXNSYW5nZSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG5NYXJrIGNhbGVuZGFyIGFzIGN1cnJlbnQtbW9udGggYW5kIGRpc2FibGUgcHJldiBidXR0b24sXHJcbm9yIHJlbW92ZSB0aGUgbWFyayBhbmQgZW5hYmxlIGl0IGlmIGlzIG5vdC5cclxuXHJcblVwZGF0ZXMgdGhlIG1vbnRoIGxhYmVsIHRvbyBhbmQgdG9kYXkgYnV0dG9uXHJcbioqL1xyXG5mdW5jdGlvbiBjaGVja0N1cnJlbnRNb250aCgkZWwsIHN0YXJ0RGF0ZSwgbW9udGhseSkge1xyXG4gIC8vIEVuc3VyZSB0aGUgZGF0ZSB0byBiZSBmcm9tIGN1cnJlbnQgbW9udGggYW5kIG5vdCBvbmUgb2YgdGhlIGxhdGVzdCBkYXRlc1xyXG4gIC8vIG9mIHRoZSBwcmV2aW91cyBvbmUgKHdoZXJlIHRoZSByYW5nZSBzdGFydCkgYWRkaW5nIDcgZGF5cyBmb3IgdGhlIGNoZWNrOlxyXG4gIHZhciBtb250aERhdGUgPSB1dGlscy5kYXRlLmFkZERheXMoc3RhcnREYXRlLCA3KTtcclxuICB2YXIgeWVwID0gdXRpbHMuZGF0ZS5pc0luQ3VycmVudE1vbnRoKG1vbnRoRGF0ZSk7XHJcbiAgJGVsLnRvZ2dsZUNsYXNzKG1vbnRobHkuY2xhc3Nlcy5jdXJyZW50V2VlaywgeWVwKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMucHJldkFjdGlvbikucHJvcCgnZGlzYWJsZWQnLCB5ZXApO1xyXG5cclxuICAvLyBNb250aCAtIFllYXJcclxuICB2YXIgbWxibCA9IG1vbnRobHkudGV4dHMubW9udGhzW21vbnRoRGF0ZS5nZXRNb250aCgpXSArICcgJyArIG1vbnRoRGF0ZS5nZXRGdWxsWWVhcigpO1xyXG4gICRlbC5maW5kKCcuJyArIG1vbnRobHkuY2xhc3Nlcy5tb250aExhYmVsKS50ZXh0KG1sYmwpO1xyXG4gICRlbC5maW5kKCcuJyArIG1vbnRobHkuY2xhc3Nlcy50b2RheUFjdGlvbikucHJvcCgnZGlzYWJsZWQnLCB5ZXApO1xyXG59XHJcblxyXG4vKipcclxuICBVcGRhdGUgdGhlIGNhbGVuZGFyIGRhdGVzIGNlbGxzIGZvciAnZGF5IG9mIHRoZSBtb250aCcgdmFsdWVzXHJcbiAgYW5kIG51bWJlciBvZiB3ZWVrcy9yb3dzLlxyXG4gIEBkYXRlc1JhbmdlIHsgc3RhcnQsIGVuZCB9XHJcbiAgQHNsb3RzQ29udGFpbmVyIGpRdWVyeS1ET00gZm9yIGRhdGVzLWNlbGxzIHRib2R5XHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBvZmZNb250aERhdGVDbGFzcywgY3VycmVudERhdGVDbGFzcywgc2xvdERhdGVMYWJlbCwgc2hvd1NpeFdlZWtzKSB7XHJcbiAgdmFyIGxhc3RZLFxyXG4gICAgY3VycmVudE1vbnRoID0gdXRpbHMuZGF0ZS5hZGREYXlzKGRhdGVzUmFuZ2Uuc3RhcnQsIDcpLmdldE1vbnRoKCksXHJcbiAgICB0b2RheSA9IGRhdGVJU08uZGF0ZUxvY2FsKG5ldyBEYXRlKCkpO1xyXG5cclxuICBpdGVyYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgZnVuY3Rpb24gKGRhdGUsIHgsIHkpIHtcclxuICAgIGxhc3RZID0geTtcclxuICAgIHRoaXMuZmluZCgnLicgKyBzbG90RGF0ZUxhYmVsKS50ZXh0KGRhdGUuZ2V0RGF0ZSgpKTtcclxuXHJcbiAgICAvLyBNYXJrIGRheXMgbm90IGluIHRoaXMgbW9udGhcclxuICAgIHRoaXMudG9nZ2xlQ2xhc3Mob2ZmTW9udGhEYXRlQ2xhc3MsIGRhdGUuZ2V0TW9udGgoKSAhPSBjdXJyZW50TW9udGgpO1xyXG5cclxuICAgIC8vIE1hcmsgdG9kYXlcclxuICAgIHRoaXMudG9nZ2xlQ2xhc3MoY3VycmVudERhdGVDbGFzcywgZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSkgPT0gdG9kYXkpO1xyXG4gIH0pO1xyXG5cclxuICBpZiAoIXNob3dTaXhXZWVrcykge1xyXG4gICAgLy8gU29tZSBtb250aHMgYXJlIDUgd2Vla3Mgd2lkZSBhbmQgb3RoZXJzIDY7IG91ciBsYXlvdXQgaGFzIHBlcm1hbmVudCA2IHJvd3Mvd2Vla3NcclxuICAgIC8vIGFuZCB3ZSBkb24ndCBsb29rIHVwIHRoZSA2dGggd2VlayBpZiBpcyBub3QgcGFydCBvZiB0aGUgbW9udGggdGhlbiB0aGF0IDZ0aCByb3dcclxuICAgIC8vIG11c3QgYmUgaGlkZGVuIGlmIHRoZXJlIGFyZSBvbmx5IDUuXHJcbiAgICAvLyBJZiB0aGUgbGFzdCByb3cgd2FzIHRoZSA1IChpbmRleCA0LCB6ZXJvLWJhc2VkKSwgdGhlIDZ0aCBpcyBoaWRkZW46XHJcbiAgICBzbG90c0NvbnRhaW5lci5jaGlsZHJlbigndHI6ZXEoNSknKS54dG9nZ2xlKGxhc3RZICE9IDQsIHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246IDAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICBJdCBleGVjdXRlcyB0aGUgZ2l2ZW4gY2FsbGJhY2sgKEBlYWNoQ2VsbENhbGxiYWNrKSBmb3IgXHJcbiAgZWFjaCBjZWxsICh0aGlzIGluc2lkZSB0aGUgY2FsbGJhY2spIGl0ZXJhdGVkIGJldHdlZW4gdGhlIEBkYXRlc1JhbmdlXHJcbiAgaW5zaWRlIHRoZSBAc2xvdHNDb250YWluZXIgKGEgdGJvZHkgb3IgdGFibGUgd2l0aCB0ci10ZCBkYXRlIGNlbGxzKVxyXG4qKi9cclxuZnVuY3Rpb24gaXRlcmF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIGVhY2hDZWxsQ2FsbGJhY2spIHtcclxuICB2YXIgeCwgeSwgZGF0ZUNlbGw7XHJcbiAgLy8gSXRlcmF0ZSBkYXRlc1xyXG4gIHV0aWxzLmRhdGUuZWFjaERhdGVJblJhbmdlKGRhdGVzUmFuZ2Uuc3RhcnQsIGRhdGVzUmFuZ2UuZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgLy8gZGF0ZXMgYXJlIHNvcnRlZCBhcyA3IHBlciByb3cgKGVhY2ggd2Vlay1kYXkpLFxyXG4gICAgLy8gYnV0IHJlbWVtYmVyIHRoYXQgZGF5LWNlbGwgcG9zaXRpb24gaXMgb2Zmc2V0IDEgYmVjYXVzZVxyXG4gICAgLy8gZWFjaCByb3cgaXMgOCBjZWxscyAoZmlyc3QgaXMgaGVhZGVyIGFuZCByZXN0IDcgYXJlIHRoZSBkYXRhLWNlbGxzIGZvciBkYXRlcylcclxuICAgIC8vIGp1c3QgbG9va2luZyBvbmx5ICd0ZCdzIHdlIGNhbiB1c2UgdGhlIHBvc2l0aW9uIHdpdGhvdXQgb2Zmc2V0XHJcbiAgICB4ID0gKGkgJSA3KTtcclxuICAgIHkgPSBNYXRoLmZsb29yKGkgLyA3KTtcclxuICAgIGRhdGVDZWxsID0gc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJ3RyOmVxKCcgKyB5ICsgJyknKS5jaGlsZHJlbigndGQ6ZXEoJyArIHggKyAnKScpO1xyXG5cclxuICAgIGVhY2hDZWxsQ2FsbGJhY2suYXBwbHkoZGF0ZUNlbGwsIFtkYXRlLCB4LCB5LCBpXSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gIFRvZ2dsZSBhIHNlbGVjdGVkIGRhdGUtY2VsbCBhdmFpbGFiaWxpdHksXHJcbiAgZm9yIHRoZSAnZWRpdGFibGUnIG1vZGVcclxuKiovXHJcbmZ1bmN0aW9uIHRvZ2dsZURhdGVBdmFpbGFiaWxpdHkobW9udGhseSwgY2VsbCkge1xyXG4gIC8vIElmIHRoZXJlIGlzIG5vIGRhdGEsIGp1c3QgcmV0dXJuIChkYXRhIG5vdCBsb2FkZWQpXHJcbiAgaWYgKCFtb250aGx5LmRhdGEgfHwgIW1vbnRobHkuZGF0YS5zbG90cykgcmV0dXJuO1xyXG4gIFxyXG4gIC8vIEdldHRpbmcgdGhlIHBvc2l0aW9uIG9mIHRoZSBjZWxsIGluIHRoZSBtYXRyaXggZm9yIGRhdGUtc2xvdHM6XHJcbiAgdmFyIHRyID0gY2VsbC5jbG9zZXN0KCd0cicpLFxyXG4gICAgeCA9IHRyLmZpbmQoJ3RkJykuaW5kZXgoY2VsbCksXHJcbiAgICB5ID0gdHIuY2xvc2VzdCgndGJvZHknKS5maW5kKCd0cicpLmluZGV4KHRyKSxcclxuICAgIGRheXNPZmZzZXQgPSB5ICogNyArIHg7XHJcblxyXG4gIC8vIEdldHRpbmcgdGhlIGRhdGUgZm9yIHRoZSBjZWxsIGJhc2VkIG9uIHRoZSBzaG93ZWQgZmlyc3QgZGF0ZVxyXG4gIHZhciBkYXRlID0gbW9udGhseS5kYXRlc1JhbmdlLnN0YXJ0O1xyXG4gIGRhdGUgPSB1dGlscy5kYXRlLmFkZERheXMoZGF0ZSwgZGF5c09mZnNldCk7XHJcbiAgdmFyIHN0ckRhdGUgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuXHJcbiAgLy8gR2V0IGFuZCB1cGRhdGUgZnJvbSB0aGUgdW5kZXJsYXlpbmcgZGF0YSwgXHJcbiAgLy8gdGhlIHN0YXR1cyBmb3IgdGhlIGRhdGUsIHRvZ2dsaW5nIGl0OlxyXG4gIHZhciBzbG90ID0gbW9udGhseS5kYXRhLnNsb3RzW3N0ckRhdGVdO1xyXG4gIC8vIElmIHRoZXJlIGlzIG5vIHNsb3QsIGp1c3QgcmV0dXJuIChkYXRhIG5vdCBsb2FkZWQpXHJcbiAgaWYgKCFzbG90KSByZXR1cm47XHJcbiAgc2xvdC5zdGF0dXMgPSBzbG90LnN0YXR1cyA9PSAndW5hdmFpbGFibGUnID8gJ2F2YWlsYWJsZScgOiAndW5hdmFpbGFibGUnO1xyXG4gIHNsb3Quc291cmNlID0gJ3VzZXInO1xyXG4gIG1vbnRobHkuYm9va2luZ3NOb3RpZmljYXRpb24ucmVnaXN0ZXIoc2xvdC5zdGF0dXMgPT0gJ3VuYXZhaWxhYmxlJywgbW9udGhseS5kYXRhLCBzdHJEYXRlKTtcclxuICBtb250aGx5LmV2ZW50cy5lbWl0KGV2ZW50cy5kYXRhQ2hhbmdlZCwgY2VsbCwgc2xvdCk7XHJcblxyXG4gIC8vIFVwZGF0ZSB2aXN1YWxpemF0aW9uOlxyXG4gIG1vbnRobHkuYmluZERhdGEoKTtcclxufVxyXG5cclxuLyoqXHJcbk1vbnRseSBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIE1vbnRobHkgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5Q2xhc3Nlcywge1xyXG4gIHdlZWtseUNhbGVuZGFyOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudFdlZWs6IHVuZGVmaW5lZCxcclxuICBjdXJyZW50TW9udGg6ICdpcy1jdXJyZW50TW9udGgnLFxyXG4gIG1vbnRobHlDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS1tb250aGx5JyxcclxuICB0b2RheUFjdGlvbjogJ0FjdGlvbnMtdG9kYXknLFxyXG4gIG1vbnRoTGFiZWw6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1tb250aExhYmVsJyxcclxuICBzbG90RGF0ZUxhYmVsOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc2xvdERhdGVMYWJlbCcsXHJcbiAgb2ZmTW9udGhEYXRlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItb2ZmTW9udGhEYXRlJyxcclxuICBjdXJyZW50RGF0ZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWN1cnJlbnREYXRlJyxcclxuICBlZGl0YWJsZTogJ2lzLWVkaXRhYmxlJyxcclxuICBib29raW5nc05vdGlmaWNhdGlvbjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWJvb2tpbmdzTm90aWZpY2F0aW9uJ1xyXG59KSxcclxudGV4dHM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5VGV4dHMsIHtcclxuICBtb250aHM6IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddXHJcbn0pLFxyXG51cmw6ICcvY2FsZW5kYXIvZ2V0LWF2YWlsYWJpbGl0eS8nLFxyXG5zaG93U2l4V2Vla3M6IHRydWUsXHJcbmVkaXRhYmxlOiBmYWxzZSxcclxuXHJcbi8vIE91ciAndmlldycgd2lsbCBiZSBhIHN1YnNldCBvZiB0aGUgZGF0YSxcclxuLy8gZGVsaW1pdGVkIGJ5IHRoZSBuZXh0IHByb3BlcnR5LCBhIGRhdGVzIHJhbmdlOlxyXG5kYXRlc1JhbmdlOiB7IHN0YXJ0OiBudWxsLCBlbmQ6IG51bGwgfSxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhTW9udGhseShkYXRlc1JhbmdlKSB7XHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5zbG90cykgcmV0dXJuO1xyXG5cclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICBjaGVja0N1cnJlbnRNb250aCh0aGlzLiRlbCwgZGF0ZXNSYW5nZS5zdGFydCwgdGhpcyk7XHJcblxyXG4gIHVwZGF0ZURhdGVzQ2VsbHModGhpcy5kYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgdGhpcy5jbGFzc2VzLm9mZk1vbnRoRGF0ZSwgdGhpcy5jbGFzc2VzLmN1cnJlbnREYXRlLCB0aGlzLmNsYXNzZXMuc2xvdERhdGVMYWJlbCwgdGhpcy5zaG93U2l4V2Vla3MpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgdXRpbHMuc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdXRpbHMuc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgLy8gU2V0IGF2YWlsYWJpbGl0eSBvZiBlYWNoIGRhdGUgc2xvdC9jZWxsOlxyXG4gIGl0ZXJhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBmdW5jdGlvbiAoZGF0ZSwgeCwgeSwgaSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIHZhciBzbG90ID0gdGhhdC5kYXRhLnNsb3RzW2RhdGVrZXldO1xyXG4gICAgLy8gU3VwcG9ydCBmb3Igc2ltcGxlIGFuZCBkZXRhaWxlZCBzdGF0dXMgZGVzY3JpcHRpb246XHJcbiAgICB2YXIgZGF0ZVN0YXR1cyA9ICQuaXNQbGFpbk9iamVjdChzbG90KSA/IHNsb3Quc3RhdHVzIDogc2xvdDtcclxuICAgIC8vIERlZmF1bHQgdmFsdWUgZnJvbSBkYXRhOlxyXG4gICAgZGF0ZVN0YXR1cyA9IGRhdGVTdGF0dXMgfHwgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ3Vua25vdyc7XHJcblxyXG4gICAgaWYgKGRhdGVTdGF0dXMpXHJcbiAgICAgIHRoaXMuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyBkYXRlU3RhdHVzKTtcclxuICB9KTtcclxuXHJcbiAgLy8gTm90aWZpY2F0aW9uczpcclxuICB0aGlzLmJvb2tpbmdzTm90aWZpY2F0aW9uLnJlbmRlcigpO1xyXG59LFxyXG5nZXRVcGRhdGVkRGF0YTogZnVuY3Rpb24gZ2V0VXBkYXRlZERhdGEoKSB7XHJcbiAgdmFyIGQgPSB7fTtcclxuICBpZiAodGhpcy5lZGl0YWJsZSkge1xyXG4gICAgLy8gQ29weSBkYXRhLCB3ZSBkb24ndCB3YW50IGNoYW5nZSB0aGUgb3JpZ2luYWw6XHJcbiAgICBleHRlbmQoZCwgdGhpcy5kYXRhKTtcclxuXHJcbiAgICAvLyBGaWx0ZXIgc2xvdHMgdG8gZ2V0IG9ubHkgdGhhdCB1cGRhdGVkIGJ5IGRlIHVzZXI6XHJcbiAgICBkLnNsb3RzID0gb2JqZWN0VXRpbHMuZmlsdGVyUHJvcGVydGllcyhkLnNsb3RzLCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgICByZXR1cm4gdi5zb3VyY2UgPT0gJ3VzZXInO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBkO1xyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBNb250aGx5KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAvLyBSZXVzaW5nIGJhc2UgY29uc3RydWN0b3IgdG9vIGZvciBpbml0aWFsaXppbmc6XHJcbiAgTGNXaWRnZXQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICAvLyBUbyB1c2UgdGhpcyBpbiBjbG9zdXJlczpcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIC8vIEluaXRpYWxpemluZyBzb21lIGRhdGEsIGJlaW5nIGNhcmUgb2YgYW55IHZhbHVlXHJcbiAgLy8gdGhhdCBjb21lcyBmcm9tIG1lcmdpbmcgb3B0aW9ucyBpbnRvICd0aGlzJ1xyXG4gIHRoaXMudXNlciA9IHRoaXMudXNlciB8fCB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcbiAgdGhpcy5xdWVyeSA9IGV4dGVuZCh7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnbW9udGhseS1zY2hlZHVsZSdcclxuICB9LCB0aGlzLnF1ZXJ5KTtcclxuXHJcbiAgLy8gSWYgaXMgbm90IHNldCBieSBjb25zdHJ1Y3RvciBvcHRpb25zLCBnZXQgXHJcbiAgLy8gJ2VkaXRhYmxlJyBmcm9tIGRhdGEsIG9yIGxlZnQgZGVmYXVsdDpcclxuICBpZiAoIShvcHRpb25zICYmIHR5cGVvZiAob3B0aW9ucy5lZGl0YWJsZSkgIT0gJ3VuZGVmaW5lZCcpICYmXHJcbiAgICB0eXBlb2YgKHRoaXMuJGVsLmRhdGEoJ2VkaXRhYmxlJykpICE9ICd1bmRlZmluZWQnKVxyXG4gICAgdGhpcy5lZGl0YWJsZSA9ICEhdGhpcy4kZWwuZGF0YSgnZWRpdGFibGUnKTtcclxuXHJcblxyXG4gIC8vIFNldCBoYW5kbGVycyBmb3IgcHJldi1uZXh0IGFjdGlvbnM6XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnByZXZBY3Rpb24sIGZ1bmN0aW9uIHByZXYoKSB7XHJcbiAgICBtb3ZlQmluZE1vbnRoKHRoYXQsIC0xKTtcclxuICB9KTtcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMubmV4dEFjdGlvbiwgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgIG1vdmVCaW5kTW9udGgodGhhdCwgMSk7XHJcbiAgfSk7XHJcbiAgLy8gSGFuZGxlciBmb3IgdG9kYXkgYWN0aW9uXHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnRvZGF5QWN0aW9uLCBmdW5jdGlvbiB0b2RheSgpIHtcclxuICAgIHRoYXQuYmluZERhdGEodXRpbHMuZGF0ZS5jdXJyZW50TW9udGhXZWVrcyhudWxsLCB0aGlzLnNob3dTaXhXZWVrcykpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBFZGl0YWJsZSBtb2RlXHJcbiAgaWYgKHRoaXMuZWRpdGFibGUpIHtcclxuICAgIHRoaXMucXVlcnkuZWRpdGFibGUgPSB0cnVlO1xyXG4gICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzICsgJyB0ZCcsIGZ1bmN0aW9uIGNsaWNrVG9nZ2xlQXZhaWxhYmlsaXR5KCkge1xyXG4gICAgICB0b2dnbGVEYXRlQXZhaWxhYmlsaXR5KHRoYXQsICQodGhpcykpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLiRlbC5hZGRDbGFzcyh0aGlzLmNsYXNzZXMuZWRpdGFibGUpO1xyXG4gIH1cclxuXHJcbiAgLy8gQ3JlYXRpbmcgdGhlIGJvb2tpbmdzTm90aWZpY2F0aW9uIGVsZW1lbnQsIGJvdGggZWRpdGFibGUgYW5kIHJlYWQtb25seSBtb2Rlcy5cclxuICAvLyBSZWFkLW9ubHkgbW9kZSBuZWVkIGhpZGRlbiB0aGUgZWxlbWVudCBhbmQgdGhhdHMgZG9uZSBvbiBjb25zdHJ1Y3RvciBhbmQgZWRpdGFibGVcclxuICAvLyB3aWxsIHJlbmRlciBpdCBvbiBiaW5kRGF0YVxyXG4gIHRoaXMuYm9va2luZ3NOb3RpZmljYXRpb24gPSBuZXcgQm9va2luZ3NOb3RpZmljYXRpb24odGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuYm9va2luZ3NOb3RpZmljYXRpb24pKTtcclxuXHJcbiAgLy8gU3RhcnQgZmV0Y2hpbmcgY3VycmVudCBtb250aFxyXG4gIHZhciBmaXJzdERhdGVzID0gdXRpbHMuZGF0ZS5jdXJyZW50TW9udGhXZWVrcyhudWxsLCB0aGlzLnNob3dTaXhXZWVrcyk7XHJcbiAgdGhpcy5mZXRjaERhdGEodXRpbHMuZGF0ZXNUb1F1ZXJ5KGZpcnN0RGF0ZXMpKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoZmlyc3REYXRlcyk7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IG1vbnRoIGluIGFkdmFuY2VcclxuICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKHRoYXQsIGZpcnN0RGF0ZXMpO1xyXG4gIH0pO1xyXG5cclxuICBjaGVja0N1cnJlbnRNb250aCh0aGlzLiRlbCwgZmlyc3REYXRlcy5zdGFydCwgdGhpcyk7XHJcblxyXG4gIC8vIFNob3cgZXJyb3IgbWVzc2FnZVxyXG4gIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCB1dGlscy5oYW5kbGVyQ2FsZW5kYXJFcnJvcik7XHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuTW9udGhseS5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIE1vbnRobHkucHJvdG90eXBlLmNsYXNzZXMubW9udGhseUNhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgTW9udGhseSh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vbnRobHk7XHJcbiIsIi8qKlxyXG4gIFdlZWtseSBjYWxlbmRhciBjbGFzc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4uL0NYL0xjV2lkZ2V0JyksXHJcbiAgZXh0ZW5kID0gcmVxdWlyZSgnLi4vQ1gvZXh0ZW5kJyk7XHJcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcclxuXHJcbi8qKlxyXG5XZWVrbHkgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBXZWVrbHkgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IHV0aWxzLndlZWtseUNsYXNzZXMsXHJcbnRleHRzOiB1dGlscy53ZWVrbHlUZXh0cyxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuXHJcbi8vIE91ciAndmlldycgd2lsbCBiZSBhIHN1YnNldCBvZiB0aGUgZGF0YSxcclxuLy8gZGVsaW1pdGVkIGJ5IHRoZSBuZXh0IHByb3BlcnR5LCBhIGRhdGVzIHJhbmdlOlxyXG5kYXRlc1JhbmdlOiB7IHN0YXJ0OiBudWxsLCBlbmQ6IG51bGwgfSxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhV2Vla2x5KGRhdGVzUmFuZ2UpIHtcclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLnNsb3RzKSByZXR1cm47XHJcblxyXG4gIHRoaXMuZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlIHx8IHRoaXMuZGF0ZXNSYW5nZTtcclxuICB2YXIgXHJcbiAgICAgIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpLFxyXG4gICAgICBzbG90cyA9IHNsb3RzQ29udGFpbmVyLmZpbmQoJ3RkJyk7XHJcblxyXG4gIHV0aWxzLmNoZWNrQ3VycmVudFdlZWsodGhpcy4kZWwsIGRhdGVzUmFuZ2Uuc3RhcnQsIHRoaXMpO1xyXG5cclxuICB1dGlscy51cGRhdGVMYWJlbHMoZGF0ZXNSYW5nZSwgdGhpcy4kZWwsIHRoaXMpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgdXRpbHMuc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdXRpbHMuc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgLy8gU2V0IGFsbCBzbG90cyB3aXRoIGRlZmF1bHQgc3RhdHVzXHJcbiAgc2xvdHMuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cyk7XHJcblxyXG4gIGlmICghdGhpcy5kYXRhLnNsb3RzIHx8ICF0aGlzLmRhdGEuc3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHV0aWxzLmRhdGUuZWFjaERhdGVJblJhbmdlKGRhdGVzUmFuZ2Uuc3RhcnQsIGRhdGVzUmFuZ2UuZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIHZhciBkYXRlU2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbZGF0ZWtleV07XHJcbiAgICBpZiAoZGF0ZVNsb3RzKSB7XHJcbiAgICAgIGZvciAocyA9IDA7IHMgPCBkYXRlU2xvdHMubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICB2YXIgc2xvdCA9IGRhdGVTbG90c1tzXTtcclxuICAgICAgICB2YXIgc2xvdENlbGwgPSB1dGlscy5maW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgaSwgc2xvdCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGRlZmF1bHQgc3RhdHVzXHJcbiAgICAgICAgc2xvdENlbGwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cyB8fCAnXycpO1xyXG4gICAgICAgIC8vIEFkZGluZyBzdGF0dXMgY2xhc3NcclxuICAgICAgICBzbG90Q2VsbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIFdlZWtseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB0aGlzLnVzZXIgPSB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICd3ZWVrbHknXHJcbiAgfTtcclxuXHJcbiAgLy8gU3RhcnQgZmV0Y2hpbmcgY3VycmVudCB3ZWVrXHJcbiAgdmFyIGZpcnN0RGF0ZXMgPSB1dGlscy5kYXRlLmN1cnJlbnRXZWVrKCk7XHJcbiAgdGhpcy5mZXRjaERhdGEodXRpbHMuZGF0ZXNUb1F1ZXJ5KGZpcnN0RGF0ZXMpKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoZmlyc3REYXRlcyk7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IHdlZWsgaW4gYWR2YW5jZVxyXG4gICAgdXRpbHMud2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh0aGF0LCBmaXJzdERhdGVzKTtcclxuICB9KTtcclxuICB1dGlscy5jaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBmaXJzdERhdGVzLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgLy8gU2V0IGhhbmRsZXJzIGZvciBwcmV2LW5leHQgYWN0aW9uczpcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMucHJldkFjdGlvbiwgZnVuY3Rpb24gcHJldigpIHtcclxuICAgIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgLTcpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5uZXh0QWN0aW9uLCBmdW5jdGlvbiBuZXh0KCkge1xyXG4gICAgdXRpbHMubW92ZUJpbmRSYW5nZUluRGF5cyh0aGF0LCA3KTtcclxuICB9KTtcclxuXHJcbiAgLy8gU2hvdyBlcnJvciBtZXNzYWdlXHJcbiAgdGhpcy5ldmVudHMub24oJ2hhc0Vycm9yQ2hhbmdlZCcsIHV0aWxzLmhhbmRsZXJDYWxlbmRhckVycm9yKTtcclxuXHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuV2Vla2x5LmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgV2Vla2x5LnByb3RvdHlwZS5jbGFzc2VzLndlZWtseUNhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgV2Vla2x5KHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2Vla2x5O1xyXG4iLCIvKipcclxuICBXb3JrIEhvdXJzIGNhbGVuZGFyIGNsYXNzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIExjV2lkZ2V0ID0gcmVxdWlyZSgnLi4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuLi9DWC9leHRlbmQnKSxcclxuICB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKSxcclxuICBjbGVhckN1cnJlbnRTZWxlY3Rpb24gPSByZXF1aXJlKCcuL2NsZWFyQ3VycmVudFNlbGVjdGlvbicpLFxyXG4gIG1ha2VVbnNlbGVjdGFibGUgPSByZXF1aXJlKCcuL21ha2VVbnNlbGVjdGFibGUnKTtcclxucmVxdWlyZSgnLi4vanF1ZXJ5LmJvdW5kcycpO1xyXG52YXIgZXZlbnRzID0ge1xyXG4gICAgZGF0YUNoYW5nZWQ6ICdkYXRhQ2hhbmdlZCdcclxufTtcclxuXHJcbi8qKlxyXG5Xb3JrIGhvdXJzIHByaXZhdGUgdXRpbHNcclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwRWRpdFdvcmtIb3VycygpIHtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgLy8gU2V0IGhhbmRsZXJzIHRvIHN3aXRjaCBzdGF0dXMgYW5kIHVwZGF0ZSBiYWNrZW5kIGRhdGFcclxuICAvLyB3aGVuIHRoZSB1c2VyIHNlbGVjdCBjZWxsc1xyXG4gIHZhciBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKTtcclxuXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2VsbChjZWxsKSB7XHJcbiAgICAvLyBGaW5kIGRheSBhbmQgdGltZSBvZiB0aGUgY2VsbDpcclxuICAgIHZhciBzbG90ID0gdXRpbHMuZmluZFNsb3RCeUNlbGwoc2xvdHNDb250YWluZXIsIGNlbGwpO1xyXG4gICAgLy8gR2V0IHdlZWstZGF5IHNsb3RzIGFycmF5OlxyXG4gICAgdmFyIHdrc2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbdXRpbHMuc3lzdGVtV2Vla0RheXNbc2xvdC5kYXldXSA9IHRoYXQuZGF0YS5zbG90c1t1dGlscy5zeXN0ZW1XZWVrRGF5c1tzbG90LmRheV1dIHx8IFtdO1xyXG4gICAgLy8gSWYgaXQgaGFzIGFscmVhZHkgdGhlIGRhdGEuc3RhdHVzLCB0b2dnbGUgdG8gdGhlIGRlZmF1bHRTdGF0dXNcclxuICAgIC8vICB2YXIgc3RhdHVzQ2xhc3MgPSB0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMsXHJcbiAgICAvLyAgICAgIGRlZmF1bHRTdGF0dXNDbGFzcyA9IHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXM7XHJcbiAgICAvL2lmIChjZWxsLmhhc0NsYXNzKHN0YXR1c0NsYXNzXHJcbiAgICAvLyBUb2dnbGUgZnJvbSB0aGUgYXJyYXlcclxuICAgIHZhciBzdHJzbG90ID0gZGF0ZUlTTy50aW1lTG9jYWwoc2xvdC5zbG90LCB0cnVlKSxcclxuICAgICAgaXNsb3QgPSB3a3Nsb3RzLmluZGV4T2Yoc3Ryc2xvdCk7XHJcbiAgICBpZiAoaXNsb3QgPT0gLTEpXHJcbiAgICAgIHdrc2xvdHMucHVzaChzdHJzbG90KTtcclxuICAgIGVsc2VcclxuICAgICAgLy9kZWxldGUgd2tzbG90c1tpc2xvdF07XHJcbiAgICAgIHdrc2xvdHMuc3BsaWNlKGlzbG90LCAxKTtcclxuXHJcbiAgICB0aGF0LmV2ZW50cy5lbWl0KGV2ZW50cy5kYXRhQ2hhbmdlZCwgY2VsbCwgc2xvdCk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB0b2dnbGVDZWxsUmFuZ2UoZmlyc3RDZWxsLCBsYXN0Q2VsbCkge1xyXG4gICAgdmFyIFxyXG4gICAgICB4ID0gZmlyc3RDZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChmaXJzdENlbGwpLFxyXG4gICAgICB5MSA9IGZpcnN0Q2VsbC5jbG9zZXN0KCd0cicpLmluZGV4KCksXHJcbiAgICAvL3gyID0gbGFzdENlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGxhc3RDZWxsKSxcclxuICAgICAgeTIgPSBsYXN0Q2VsbC5jbG9zZXN0KCd0cicpLmluZGV4KCk7XHJcblxyXG4gICAgaWYgKHkxID4geTIpIHtcclxuICAgICAgdmFyIHkwID0geTE7XHJcbiAgICAgIHkxID0geTI7XHJcbiAgICAgIHkyID0geTA7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgeSA9IHkxOyB5IDw9IHkyOyB5KyspIHtcclxuICAgICAgdmFyIGNlbGwgPSBmaXJzdENlbGwuY2xvc2VzdCgndGJvZHknKS5jaGlsZHJlbigndHI6ZXEoJyArIHkgKyAnKScpLmNoaWxkcmVuKCd0ZDplcSgnICsgeCArICcpJyk7XHJcbiAgICAgIHRvZ2dsZUNlbGwoY2VsbCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgZHJhZ2dpbmcgPSB7XHJcbiAgICBmaXJzdDogbnVsbCxcclxuICAgIGxhc3Q6IG51bGwsXHJcbiAgICBzZWxlY3Rpb25MYXllcjogJCgnPGRpdiBjbGFzcz1cIlNlbGVjdGlvbkxheWVyXCIgLz4nKS5hcHBlbmRUbyh0aGlzLiRlbCksXHJcbiAgICBkb25lOiBmYWxzZVxyXG4gIH07XHJcbiAgXHJcbiAgZnVuY3Rpb24gb2Zmc2V0VG9Qb3NpdGlvbihlbCwgb2Zmc2V0KSB7XHJcbiAgICB2YXIgcGIgPSAkKGVsLm9mZnNldFBhcmVudCkuYm91bmRzKCksXHJcbiAgICAgIHMgPSB7fTtcclxuXHJcbiAgICBzLnRvcCA9IG9mZnNldC50b3AgLSBwYi50b3A7XHJcbiAgICBzLmxlZnQgPSBvZmZzZXQubGVmdCAtIHBiLmxlZnQ7XHJcblxyXG4gICAgLy9zLmJvdHRvbSA9IHBiLnRvcCAtIG9mZnNldC5ib3R0b207XHJcbiAgICAvL3MucmlnaHQgPSBvZmZzZXQubGVmdCAtIG9mZnNldC5yaWdodDtcclxuICAgIHMuaGVpZ2h0ID0gb2Zmc2V0LmJvdHRvbSAtIG9mZnNldC50b3A7XHJcbiAgICBzLndpZHRoID0gb2Zmc2V0LnJpZ2h0IC0gb2Zmc2V0LmxlZnQ7XHJcblxyXG4gICAgJChlbCkuY3NzKHMpO1xyXG4gICAgcmV0dXJuIHM7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cGRhdGVTZWxlY3Rpb24oZWwpIHtcclxuICAgIHZhciBhID0gZHJhZ2dpbmcuZmlyc3QuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIHZhciBiID0gZWwuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIHZhciBzID0gZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuXHJcbiAgICBzLnRvcCA9IGEudG9wIDwgYi50b3AgPyBhLnRvcCA6IGIudG9wO1xyXG4gICAgcy5ib3R0b20gPSBhLmJvdHRvbSA+IGIuYm90dG9tID8gYS5ib3R0b20gOiBiLmJvdHRvbTtcclxuXHJcbiAgICBvZmZzZXRUb1Bvc2l0aW9uKGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyWzBdLCBzKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZpbmlzaERyYWcoKSB7XHJcbiAgICBpZiAoZHJhZ2dpbmcuZmlyc3QgJiYgZHJhZ2dpbmcubGFzdCkge1xyXG4gICAgICB0b2dnbGVDZWxsUmFuZ2UoZHJhZ2dpbmcuZmlyc3QsIGRyYWdnaW5nLmxhc3QpO1xyXG4gICAgICB0aGF0LmJpbmREYXRhKCk7XHJcblxyXG4gICAgICBkcmFnZ2luZy5kb25lID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGRyYWdnaW5nLmZpcnN0ID0gZHJhZ2dpbmcubGFzdCA9IG51bGw7XHJcbiAgICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5oaWRlKCk7XHJcbiAgICBtYWtlVW5zZWxlY3RhYmxlLm9mZih0aGF0LiRlbCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHRoaXMuJGVsLmZpbmQoc2xvdHNDb250YWluZXIpLm9uKCdjbGljaycsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIERvIGV4Y2VwdCBhZnRlciBhIGRyYWdnaW5nIGRvbmUgY29tcGxldGVcclxuICAgIGlmIChkcmFnZ2luZy5kb25lKSByZXR1cm4gZmFsc2U7XHJcbiAgICB0b2dnbGVDZWxsKCQodGhpcykpO1xyXG4gICAgdGhhdC5iaW5kRGF0YSgpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICB0aGlzLiRlbC5maW5kKHNsb3RzQ29udGFpbmVyKVxyXG4gIC5vbignbW91c2Vkb3duJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgZHJhZ2dpbmcuZG9uZSA9IGZhbHNlO1xyXG4gICAgZHJhZ2dpbmcuZmlyc3QgPSAkKHRoaXMpO1xyXG4gICAgZHJhZ2dpbmcubGFzdCA9IG51bGw7XHJcbiAgICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5zaG93KCk7XHJcblxyXG4gICAgbWFrZVVuc2VsZWN0YWJsZSh0aGF0LiRlbCk7XHJcbiAgICBjbGVhckN1cnJlbnRTZWxlY3Rpb24oKTtcclxuXHJcbiAgICB2YXIgcyA9IGRyYWdnaW5nLmZpcnN0LmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICBvZmZzZXRUb1Bvc2l0aW9uKGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyWzBdLCBzKTtcclxuXHJcbiAgfSlcclxuICAub24oJ21vdXNlZW50ZXInLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoZHJhZ2dpbmcuZmlyc3QpIHtcclxuICAgICAgZHJhZ2dpbmcubGFzdCA9ICQodGhpcyk7XHJcblxyXG4gICAgICB1cGRhdGVTZWxlY3Rpb24oZHJhZ2dpbmcubGFzdCk7XHJcbiAgICB9XHJcbiAgfSlcclxuICAub24oJ21vdXNldXAnLCBmaW5pc2hEcmFnKVxyXG4gIC5maW5kKCd0ZCcpXHJcbiAgLmF0dHIoJ2RyYWdnYWJsZScsIGZhbHNlKTtcclxuXHJcbiAgLy8gVGhpcyB3aWxsIG5vdCB3b3JrIHdpdGggcG9pbnRlci1ldmVudHM6bm9uZSwgYnV0IG9uIG90aGVyXHJcbiAgLy8gY2FzZXMgKHJlY2VudElFKVxyXG4gIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLm9uKCdtb3VzZXVwJywgZmluaXNoRHJhZylcclxuICAuYXR0cignZHJhZ2dhYmxlJywgZmFsc2UpO1xyXG5cclxufVxyXG5cclxuLyoqXHJcbldvcmsgaG91cnMgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBXb3JrSG91cnMgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5Q2xhc3Nlcywge1xyXG4gIHdlZWtseUNhbGVuZGFyOiB1bmRlZmluZWQsXHJcbiAgd29ya0hvdXJzQ2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci0td29ya0hvdXJzJ1xyXG59KSxcclxudGV4dHM6IHV0aWxzLndlZWtseVRleHRzLFxyXG51cmw6ICcvY2FsZW5kYXIvZ2V0LWF2YWlsYWJpbGl0eS8nLFxyXG5iaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGFXb3JrSG91cnMoKSB7XHJcbiAgdmFyIFxyXG4gICAgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyksXHJcbiAgICBzbG90cyA9IHNsb3RzQ29udGFpbmVyLmZpbmQoJ3RkJyk7XHJcblxyXG4gIC8vIFJlbW92ZSBhbnkgcHJldmlvdXMgc3RhdHVzIGNsYXNzIGZyb20gYWxsIHNsb3RzXHJcbiAgZm9yICh2YXIgcyA9IDA7IHMgPCB1dGlscy5zdGF0dXNUeXBlcy5sZW5ndGg7IHMrKykge1xyXG4gICAgc2xvdHMucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB1dGlscy5zdGF0dXNUeXBlc1tzXSB8fCAnXycpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5kZWZhdWx0U3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICAvLyBTZXQgYWxsIHNsb3RzIHdpdGggZGVmYXVsdCBzdGF0dXNcclxuICBzbG90cy5hZGRDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoaXMuZGF0YS5kZWZhdWx0U3RhdHVzKTtcclxuXHJcbiAgaWYgKCF0aGlzLmRhdGEuc2xvdHMgfHwgIXRoaXMuZGF0YS5zdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICBmb3IgKHZhciB3ayA9IDA7IHdrIDwgdXRpbHMuc3lzdGVtV2Vla0RheXMubGVuZ3RoOyB3aysrKSB7XHJcbiAgICB2YXIgZGF0ZVNsb3RzID0gdGhhdC5kYXRhLnNsb3RzW3V0aWxzLnN5c3RlbVdlZWtEYXlzW3drXV07XHJcbiAgICBpZiAoZGF0ZVNsb3RzICYmIGRhdGVTbG90cy5sZW5ndGgpIHtcclxuICAgICAgZm9yIChzID0gMDsgcyA8IGRhdGVTbG90cy5sZW5ndGg7IHMrKykge1xyXG4gICAgICAgIHZhciBzbG90ID0gZGF0ZVNsb3RzW3NdO1xyXG4gICAgICAgIHZhciBzbG90Q2VsbCA9IHV0aWxzLmZpbmRDZWxsQnlTbG90KHNsb3RzQ29udGFpbmVyLCB3aywgc2xvdCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGRlZmF1bHQgc3RhdHVzXHJcbiAgICAgICAgc2xvdENlbGwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cyB8fCAnXycpO1xyXG4gICAgICAgIC8vIEFkZGluZyBzdGF0dXMgY2xhc3NcclxuICAgICAgICBzbG90Q2VsbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBXb3JrSG91cnMoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB0aGlzLnVzZXIgPSB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcblxyXG4gIHRoaXMucXVlcnkgPSB7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnd29ya0hvdXJzJ1xyXG4gIH07XHJcblxyXG4gIC8vIEZldGNoIHRoZSBkYXRhOiB0aGVyZSBpcyBub3QgYSBtb3JlIHNwZWNpZmljIHF1ZXJ5LFxyXG4gIC8vIGl0IGp1c3QgZ2V0IHRoZSBob3VycyBmb3IgZWFjaCB3ZWVrLWRheSAoZGF0YVxyXG4gIC8vIHNsb3RzIGFyZSBwZXIgd2Vlay1kYXkgaW5zdGVhZCBvZiBwZXIgZGF0ZSBjb21wYXJlZFxyXG4gIC8vIHRvICp3ZWVrbHkqKVxyXG4gIHRoaXMuZmV0Y2hEYXRhKCkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKCk7XHJcbiAgfSk7XHJcblxyXG4gIHNldHVwRWRpdFdvcmtIb3Vycy5jYWxsKHRoaXMpO1xyXG5cclxuICAvLyBTaG93IGVycm9yIG1lc3NhZ2VcclxuICB0aGlzLmV2ZW50cy5vbignaGFzRXJyb3JDaGFuZ2VkJywgdXRpbHMuaGFuZGxlckNhbGVuZGFyRXJyb3IpO1xyXG5cclxufSk7XHJcblxyXG4vKiogU3RhdGljIHV0aWxpdHk6IGZvdW5kIGFsbCBjb21wb25lbnRzIHdpdGggdGhlIFdvcmtob3VycyBjYWxlbmRhciBjbGFzc1xyXG5hbmQgZW5hYmxlIGl0XHJcbioqL1xyXG5Xb3JrSG91cnMuZW5hYmxlQWxsID0gZnVuY3Rpb24gb24ob3B0aW9ucykge1xyXG4gIHZhciBsaXN0ID0gW107XHJcbiAgJCgnLicgKyBXb3JrSG91cnMucHJvdG90eXBlLmNsYXNzZXMud29ya0hvdXJzQ2FsZW5kYXIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgbGlzdC5wdXNoKG5ldyBXb3JrSG91cnModGhpcywgb3B0aW9ucykpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBsaXN0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXb3JrSG91cnM7IiwiLyoqXHJcbkNyb3NzIGJyb3dzZXIgd2F5IHRvIHVuc2VsZWN0IGN1cnJlbnQgc2VsZWN0aW9uXHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNsZWFyQ3VycmVudFNlbGVjdGlvbigpIHtcclxuICBpZiAodHlwZW9mICh3aW5kb3cuZ2V0U2VsZWN0aW9uKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAvLyBTdGFuZGFyZFxyXG4gICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xyXG4gIGVsc2UgaWYgKGRvY3VtZW50LnNlbGVjdGlvbiAmJiB0eXBlb2YgKGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSkgPT09ICdmdW5jdGlvbicpXHJcbiAgLy8gSUVcclxuICAgIGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSgpO1xyXG59OyIsIi8qKlxyXG4gIEEgY29sbGVjdGlvbiBvZiB1c2VmdWwgZ2VuZXJpYyB1dGlscyBtYW5hZ2luZyBEYXRlc1xyXG4qKi9cclxudmFyIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpO1xyXG5cclxuZnVuY3Rpb24gY3VycmVudFdlZWsoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBnZXRGaXJzdFdlZWtEYXRlKG5ldyBEYXRlKCkpLFxyXG4gICAgZW5kOiBnZXRMYXN0V2Vla0RhdGUobmV3IERhdGUoKSlcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudFdlZWsgPSBjdXJyZW50V2VlaztcclxuXHJcbmZ1bmN0aW9uIG5leHRXZWVrKHN0YXJ0LCBlbmQpIHtcclxuICAvLyBVbmlxdWUgcGFyYW0gd2l0aCBib3RoIHByb3BpZXJ0aWVzOlxyXG4gIGlmIChzdGFydC5lbmQpIHtcclxuICAgIGVuZCA9IHN0YXJ0LmVuZDtcclxuICAgIHN0YXJ0ID0gc3RhcnQuc3RhcnQ7XHJcbiAgfVxyXG4gIC8vIE9wdGlvbmFsIGVuZDpcclxuICBlbmQgPSBlbmQgfHwgYWRkRGF5cyhzdGFydCwgNyk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBhZGREYXlzKHN0YXJ0LCA3KSxcclxuICAgIGVuZDogYWRkRGF5cyhlbmQsIDcpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLm5leHRXZWVrID0gbmV4dFdlZWs7XHJcblxyXG5mdW5jdGlvbiBnZXRGaXJzdFdlZWtEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSAtIGQuZ2V0RGF5KCkpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0Rmlyc3RXZWVrRGF0ZSA9IGdldEZpcnN0V2Vla0RhdGU7XHJcblxyXG5mdW5jdGlvbiBnZXRMYXN0V2Vla0RhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgKDYgLSBkLmdldERheSgpKSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRMYXN0V2Vla0RhdGUgPSBnZXRMYXN0V2Vla0RhdGU7XHJcblxyXG5mdW5jdGlvbiBpc0luQ3VycmVudFdlZWsoZGF0ZSkge1xyXG4gIHJldHVybiBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdFdlZWtEYXRlKGRhdGUpKSA9PSBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdFdlZWtEYXRlKG5ldyBEYXRlKCkpKTtcclxufVxyXG5leHBvcnRzLmlzSW5DdXJyZW50V2VlayA9IGlzSW5DdXJyZW50V2VlaztcclxuXHJcbmZ1bmN0aW9uIGFkZERheXMoZGF0ZSwgZGF5cykge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgZGF5cyk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5hZGREYXlzID0gYWRkRGF5cztcclxuXHJcbmZ1bmN0aW9uIGVhY2hEYXRlSW5SYW5nZShzdGFydCwgZW5kLCBmbikge1xyXG4gIGlmICghZm4uY2FsbCkgdGhyb3cgbmV3IEVycm9yKCdmbiBtdXN0IGJlIGEgZnVuY3Rpb24gb3IgXCJjYWxsXCJhYmxlIG9iamVjdCcpO1xyXG4gIHZhciBkYXRlID0gbmV3IERhdGUoc3RhcnQpO1xyXG4gIHZhciBpID0gMCwgcmV0O1xyXG4gIHdoaWxlIChkYXRlIDw9IGVuZCkge1xyXG4gICAgcmV0ID0gZm4uY2FsbChmbiwgZGF0ZSwgaSk7XHJcbiAgICAvLyBBbGxvdyBmbiB0byBjYW5jZWwgdGhlIGxvb3Agd2l0aCBzdHJpY3QgJ2ZhbHNlJ1xyXG4gICAgaWYgKHJldCA9PT0gZmFsc2UpXHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgMSk7XHJcbiAgICBpKys7XHJcbiAgfVxyXG59XHJcbmV4cG9ydHMuZWFjaERhdGVJblJhbmdlID0gZWFjaERhdGVJblJhbmdlO1xyXG5cclxuLyoqIE1vbnRocyAqKi9cclxuXHJcbmZ1bmN0aW9uIGdldEZpcnN0TW9udGhEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZSgxKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldEZpcnN0TW9udGhEYXRlID0gZ2V0Rmlyc3RNb250aERhdGU7XHJcblxyXG5mdW5jdGlvbiBnZXRMYXN0TW9udGhEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0TW9udGgoZC5nZXRNb250aCgpICsgMSwgMSk7XHJcbiAgZCA9IGFkZERheXMoZCwgLTEpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0TGFzdE1vbnRoRGF0ZSA9IGdldExhc3RNb250aERhdGU7XHJcblxyXG5mdW5jdGlvbiBpc0luQ3VycmVudE1vbnRoKGRhdGUpIHtcclxuICByZXR1cm4gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RNb250aERhdGUoZGF0ZSkpID09IGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0TW9udGhEYXRlKG5ldyBEYXRlKCkpKTtcclxufVxyXG5leHBvcnRzLmlzSW5DdXJyZW50TW9udGggPSBpc0luQ3VycmVudE1vbnRoO1xyXG5cclxuLyoqXHJcbiAgR2V0IGEgZGF0ZXMgcmFuZ2UgZm9yIHRoZSBjdXJyZW50IG1vbnRoXHJcbiAgKG9yIHRoZSBnaXZlbiBkYXRlIGFzIGJhc2UpXHJcbioqL1xyXG5mdW5jdGlvbiBjdXJyZW50TW9udGgoYmFzZURhdGUpIHtcclxuICBiYXNlRGF0ZSA9IGJhc2VEYXRlIHx8IG5ldyBEYXRlKCk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBnZXRGaXJzdE1vbnRoRGF0ZShiYXNlRGF0ZSksXHJcbiAgICBlbmQ6IGdldExhc3RNb250aERhdGUoYmFzZURhdGUpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmN1cnJlbnRNb250aCA9IGN1cnJlbnRNb250aDtcclxuXHJcbmZ1bmN0aW9uIG5leHRNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKSB7XHJcbiAgYW1vdW50TW9udGhzID0gYW1vdW50TW9udGhzIHx8IDE7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShmcm9tRGF0ZSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBkLnNldE1vbnRoKGQuZ2V0TW9udGgoKSArIGFtb3VudE1vbnRocywgMSksXHJcbiAgICBlbmQ6IGdldExhc3RNb250aERhdGUoZClcclxuICB9O1xyXG59XHJcbmV4cG9ydHMubmV4dE1vbnRoID0gbmV4dE1vbnRoO1xyXG5cclxuZnVuY3Rpb24gcHJldmlvdXNNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKSB7XHJcbiAgcmV0dXJuIG5leHRNb250aChmcm9tRGF0ZSwgMCAtIGFtb3VudE1vbnRocyk7XHJcbn1cclxuZXhwb3J0cy5wcmV2aW91c01vbnRoID0gcHJldmlvdXNNb250aDtcclxuXHJcbi8qKlxyXG4gIEdldCBhIGRhdGVzIHJhbmdlIGZvciB0aGUgY29tcGxldGUgd2Vla3NcclxuICB0aGF0IGFyZSBwYXJ0IG9mIHRoZSBjdXJyZW50IG1vbnRoXHJcbiAgKG9yIHRoZSBnaXZlbiBkYXRlIGFzIGJhc2UpLlxyXG4gIFRoYXQgbWVhbnMsIHRoYXQgc3RhcnQgZGF0ZSB3aWxsIGJlIHRoZSBmaXJzdFxyXG4gIHdlZWsgZGF0ZSBvZiB0aGUgZmlyc3QgbW9udGggd2VlayAodGhhdCBjYW5cclxuICBiZSB0aGUgZGF5IDEgb2YgdGhlIG1vbnRoIG9yIG9uZSBvZiB0aGUgbGFzdFxyXG4gIGRhdGVzIGZyb20gdGhlIHByZXZpb3VzIG1vbnRocyksXHJcbiAgYW5kIHNpbWlsYXIgZm9yIHRoZSBlbmQgZGF0ZSBiZWluZyB0aGUgXHJcbiAgbGFzdCB3ZWVrIGRhdGUgb2YgdGhlIGxhc3QgbW9udGggd2Vlay5cclxuXHJcbiAgQGluY2x1ZGVTaXhXZWVrczogc29tZXRpbWVzIGlzIHVzZWZ1bCBnZXQgZXZlciBhXHJcbiAgc2l4IHdlZWtzIGRhdGVzIHJhbmdlIHN0YXJpbmcgYnkgdGhlIGZpcnN0IHdlZWsgb2ZcclxuICB0aGUgYmFzZURhdGUgbW9udGguIEJ5IGRlZmF1bHQgaXMgZmFsc2UuXHJcbioqL1xyXG5mdW5jdGlvbiBjdXJyZW50TW9udGhXZWVrcyhiYXNlRGF0ZSwgaW5jbHVkZVNpeFdlZWtzKSB7XHJcbiAgdmFyIHIgPSBjdXJyZW50TW9udGgoYmFzZURhdGUpLFxyXG4gICAgcyA9IGdldEZpcnN0V2Vla0RhdGUoci5zdGFydCksXHJcbiAgICBlID0gaW5jbHVkZVNpeFdlZWtzID8gYWRkRGF5cyhzLCA2KjcgLSAxKSA6IGdldExhc3RXZWVrRGF0ZShyLmVuZCk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBzLFxyXG4gICAgZW5kOiBlXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmN1cnJlbnRNb250aFdlZWtzID0gY3VycmVudE1vbnRoV2Vla3M7XHJcblxyXG5mdW5jdGlvbiBuZXh0TW9udGhXZWVrcyhmcm9tRGF0ZSwgYW1vdW50TW9udGhzLCBpbmNsdWRlU2l4V2Vla3MpIHtcclxuICByZXR1cm4gY3VycmVudE1vbnRoV2Vla3MobmV4dE1vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpLnN0YXJ0LCBpbmNsdWRlU2l4V2Vla3MpO1xyXG59XHJcbmV4cG9ydHMubmV4dE1vbnRoV2Vla3MgPSBuZXh0TW9udGhXZWVrcztcclxuXHJcbmZ1bmN0aW9uIHByZXZpb3VzTW9udGhXZWVrcyhmcm9tRGF0ZSwgYW1vdW50TW9udGhzLCBpbmNsdWRlU2l4V2Vla3MpIHtcclxuICByZXR1cm4gY3VycmVudE1vbnRoV2Vla3MocHJldmlvdXNNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKS5zdGFydCwgaW5jbHVkZVNpeFdlZWtzKTtcclxufVxyXG5leHBvcnRzLnByZXZpb3VzTW9udGhXZWVrcyA9IHByZXZpb3VzTW9udGhXZWVrcztcclxuIiwiLyoqIFZlcnkgc2ltcGxlIGN1c3RvbS1mb3JtYXQgZnVuY3Rpb24gdG8gYWxsb3cgXHJcbmwxMG4gb2YgdGV4dHMuXHJcbkNvdmVyIGNhc2VzOlxyXG4tIE0gZm9yIG1vbnRoXHJcbi0gRCBmb3IgZGF5XHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvcm1hdERhdGUoZGF0ZSwgZm9ybWF0KSB7XHJcbiAgdmFyIHMgPSBmb3JtYXQsXHJcbiAgICAgIE0gPSBkYXRlLmdldE1vbnRoKCkgKyAxLFxyXG4gICAgICBEID0gZGF0ZS5nZXREYXRlKCk7XHJcbiAgcyA9IHMucmVwbGFjZSgvTS9nLCBNKTtcclxuICBzID0gcy5yZXBsYWNlKC9EL2csIEQpO1xyXG4gIHJldHVybiBzO1xyXG59OyIsIi8qKlxyXG4gIEV4cG9zaW5nIGFsbCB0aGUgcHVibGljIGZlYXR1cmVzIGFuZCBjb21wb25lbnRzIG9mIGF2YWlsYWJpbGl0eUNhbGVuZGFyXHJcbioqL1xyXG5leHBvcnRzLldlZWtseSA9IHJlcXVpcmUoJy4vV2Vla2x5Jyk7XHJcbmV4cG9ydHMuV29ya0hvdXJzID0gcmVxdWlyZSgnLi9Xb3JrSG91cnMnKTtcclxuZXhwb3J0cy5Nb250aGx5ID0gcmVxdWlyZSgnLi9Nb250aGx5Jyk7IiwiLyoqXHJcbiAgTWFrZSBhbiBlbGVtZW50IHVuc2VsZWN0YWJsZSwgdXNlZnVsIHRvIGltcGxlbWVudCBzb21lIGN1c3RvbVxyXG4gIHNlbGVjdGlvbiBiZWhhdmlvciBvciBkcmFnJmRyb3AuXHJcbiAgSWYgb2ZmZXJzIGFuICdvZmYnIG1ldGhvZCB0byByZXN0b3JlIGJhY2sgdGhlIGVsZW1lbnQgYmVoYXZpb3IuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xyXG5cclxuICB2YXIgZmFsc3lmbiA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9O1xyXG4gIHZhciBub2RyYWdTdHlsZSA9IHtcclxuICAgICctd2Via2l0LXRvdWNoLWNhbGxvdXQnOiAnbm9uZScsXHJcbiAgICAnLWtodG1sLXVzZXItZHJhZyc6ICdub25lJyxcclxuICAgICctd2Via2l0LXVzZXItZHJhZyc6ICdub25lJyxcclxuICAgICcta2h0bWwtdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLXdlYmtpdC11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctbW96LXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy1tcy11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICd1c2VyLXNlbGVjdCc6ICdub25lJ1xyXG4gIH07XHJcbiAgdmFyIGRyYWdkZWZhdWx0U3R5bGUgPSB7XHJcbiAgICAnLXdlYmtpdC10b3VjaC1jYWxsb3V0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1raHRtbC11c2VyLWRyYWcnOiAnaW5oZXJpdCcsXHJcbiAgICAnLXdlYmtpdC11c2VyLWRyYWcnOiAnaW5oZXJpdCcsXHJcbiAgICAnLWtodG1sLXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy13ZWJraXQtdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLW1vei11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctbXMtdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAndXNlci1zZWxlY3QnOiAnaW5oZXJpdCdcclxuICB9O1xyXG5cclxuICB2YXIgb24gPSBmdW5jdGlvbiBtYWtlVW5zZWxlY3RhYmxlKGVsKSB7XHJcbiAgICBlbCA9ICQoZWwpO1xyXG4gICAgZWwub24oJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICAvLyQoZG9jdW1lbnQpLm9uKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgZWwuY3NzKG5vZHJhZ1N0eWxlKTtcclxuICB9O1xyXG5cclxuICB2YXIgb2ZmID0gZnVuY3Rpb24gb2ZmTWFrZVVuc2VsZWN0YWJsZShlbCkge1xyXG4gICAgZWwgPSAkKGVsKTtcclxuICAgIGVsLm9mZignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIC8vJChkb2N1bWVudCkub2ZmKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgZWwuY3NzKGRyYWdkZWZhdWx0U3R5bGUpO1xyXG4gIH07XHJcblxyXG4gIG9uLm9mZiA9IG9mZjtcclxuICByZXR1cm4gb247XHJcblxyXG59ICgpKTsiLCIvKipcclxuICBBIHNldCBvZiBnZW5lcmljIHV0aWxpdGllcyB0byBtYW5hZ2UganMgb2JqZWN0c1xyXG4qKi9cclxudmFyIHUgPSB7fTtcclxuXHJcbi8qKlxyXG4gIFBlcmZvcm1zIGEgY2FsbGJhY2sgb24gZWFjaCBwcm9wZXJ0eSBvd25lZCBieSB0aGUgb2JqZWN0XHJcbioqL1xyXG51LmVhY2hQcm9wZXJ0eSA9IGZ1bmN0aW9uIGVhY2hQcm9wZXJ0eShvYmosIGNiKSB7XHJcbiAgZm9yICh2YXIgcCBpbiBvYmopIHtcclxuICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KHApKSBjb250aW51ZTtcclxuICAgIGNiLmNhbGwob2JqLCBwLCBvYmpbcF0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gIEZpbHRlciB0aGUgZ2l2ZW4gb2JqZWN0IHJldHVybmluZyBhIG5ldyBvbmUgd2l0aCBvbmx5IHRoZSBwcm9wZXJ0aWVzXHJcbiAgKGFuZCBvcmlnaW5hbCB2YWx1ZXMgLXJlZnMgZm9yIG9iamVjdCB2YWx1ZXMtKSB0aGF0IHBhc3NcclxuICB0aGUgcHJvdmlkZWQgQGZpbHRlciBjYWxsYmFjayAoY2FsbGJhY2sgbXVzdCByZXR1cm4gYSB0cnVlL3RydXRoeSB2YWx1ZVxyXG4gIGZvciBlYWNoIHZhbHVlIGRlc2lyZWQgaW4gdGhlIHJlc3VsdCkuXHJcbiAgVGhlIEBmaWx0ZXIgY2FsbGJhY2sgaXRzIGV4ZWN1dGVkIHdpdGggdGhlIG9iamVjdCBhcyBjb250ZXh0IGFuZCByZWNlaXZlc1xyXG4gIGFzIHBhcmVtZXRlcnMgdGhlIHByb3BlcnR5IGtleSBhbmQgaXRzIHZhbHVlIFwiZmlsdGVyKGssIHYpXCIuXHJcbioqL1xyXG51LmZpbHRlclByb3BlcnRpZXMgPSBmdW5jdGlvbiBmaWx0ZXJQcm9wZXJpZXMob2JqLCBmaWx0ZXIpIHtcclxuICB2YXIgciA9IHt9O1xyXG4gIHUuZWFjaFByb3BlcnR5KG9iaiwgZnVuY3Rpb24gKGssIHYpIHtcclxuICAgIGlmIChmaWx0ZXIuY2FsbChvYmosIGssIHYpKVxyXG4gICAgICByW2tdID0gdjtcclxuICB9KTtcclxuICByZXR1cm4gcjtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdTsiLCIvKipcclxuICBBdmFpbGFiaWxpdHlDYWxlbmRhciBzaGFyZWQgdXRpbHNcclxuKiovXHJcbnZhciBcclxuICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgZGF0ZVV0aWxzID0gcmVxdWlyZSgnLi9kYXRlVXRpbHMnKSxcclxuICBmb3JtYXREYXRlID0gcmVxdWlyZSgnLi9mb3JtYXREYXRlJyk7XHJcblxyXG4vLyBSZS1leHBvcnRpbmc6XHJcbmV4cG9ydHMuZm9ybWF0RGF0ZSA9IGZvcm1hdERhdGU7XHJcbmV4cG9ydHMuZGF0ZSA9IGRhdGVVdGlscztcclxuXHJcbi8qLS0tLS0tIENPTlNUQU5UUyAtLS0tLS0tLS0qL1xyXG52YXIgc3RhdHVzVHlwZXMgPSBleHBvcnRzLnN0YXR1c1R5cGVzID0gWyd1bmF2YWlsYWJsZScsICdhdmFpbGFibGUnXTtcclxuLy8gV2VlayBkYXlzIG5hbWVzIGluIGVuZ2xpc2ggZm9yIGludGVybmFsIHN5c3RlbVxyXG4vLyB1c2U7IE5PVCBmb3IgbG9jYWxpemF0aW9uL3RyYW5zbGF0aW9uLlxyXG52YXIgc3lzdGVtV2Vla0RheXMgPSBleHBvcnRzLnN5c3RlbVdlZWtEYXlzID0gW1xyXG4gICdzdW5kYXknLFxyXG4gICdtb25kYXknLFxyXG4gICd0dWVzZGF5JyxcclxuICAnd2VkbmVzZGF5JyxcclxuICAndGh1cnNkYXknLFxyXG4gICdmcmlkYXknLFxyXG4gICdzYXR1cmRheSdcclxuXTtcclxuXHJcbi8qLS0tLS0tLS0tIENPTkZJRyAtIElOU1RBTkNFIC0tLS0tLS0tLS0qL1xyXG52YXIgd2Vla2x5Q2xhc3NlcyA9IGV4cG9ydHMud2Vla2x5Q2xhc3NlcyA9IHtcclxuICBjYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyJyxcclxuICB3ZWVrbHlDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS13ZWVrbHknLFxyXG4gIGN1cnJlbnRXZWVrOiAnaXMtY3VycmVudFdlZWsnLFxyXG4gIGFjdGlvbnM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1hY3Rpb25zJyxcclxuICBwcmV2QWN0aW9uOiAnQWN0aW9ucy1wcmV2JyxcclxuICBuZXh0QWN0aW9uOiAnQWN0aW9ucy1uZXh0JyxcclxuICBkYXlzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItZGF5cycsXHJcbiAgc2xvdHM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1zbG90cycsXHJcbiAgc2xvdEhvdXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1ob3VyJyxcclxuICBzbG90U3RhdHVzUHJlZml4OiAnaXMtJyxcclxuICBsZWdlbmQ6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQnLFxyXG4gIGxlZ2VuZEF2YWlsYWJsZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZC1hdmFpbGFibGUnLFxyXG4gIGxlZ2VuZFVuYXZhaWxhYmxlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kLXVuYXZhaWxhYmxlJyxcclxuICBzdGF0dXM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1zdGF0dXMnLFxyXG4gIGVycm9yTWVzc2FnZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWVycm9yTWVzc2FnZSdcclxufTtcclxuXHJcbnZhciB3ZWVrbHlUZXh0cyA9IGV4cG9ydHMud2Vla2x5VGV4dHMgPSB7XHJcbiAgYWJicldlZWtEYXlzOiBbXHJcbiAgICAnU3VuJywgJ01vbicsICdUdWUnLCAnV2VkJywgJ1RodScsICdGcmknLCAnU2F0J1xyXG4gIF0sXHJcbiAgdG9kYXk6ICdUb2RheScsXHJcbiAgLy8gQWxsb3dlZCBzcGVjaWFsIHZhbHVlczogTTptb250aCwgRDpkYXlcclxuICBhYmJyRGF0ZUZvcm1hdDogJ00vRCdcclxufTtcclxuXHJcbi8qLS0tLS0tLS0tLS0gVklFVyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tKi9cclxuXHJcbmZ1bmN0aW9uIGhhbmRsZXJDYWxlbmRhckVycm9yKGVycikge1xyXG4gIHZhciBtc2cgPSAnJztcclxuICBpZiAoZXJyICYmIGVyci5tZXNzYWdlKVxyXG4gICAgbXNnID0gZXJyLm1lc3NhZ2U7XHJcbiAgZWxzZSBpZiAoZXJyICYmIGVyci5leGNlcHRpb24gJiYgZXJyLmV4Y2VwdGlvbi5tZXNzYWdlKVxyXG4gICAgbXNnID0gZXJyLmV4Y2VwdGlvbi5tZXNzYWdlO1xyXG5cclxuICB2YXIgdGhhdCA9IHRoaXMuY29tcG9uZW50O1xyXG4gIHZhciBtc2dDb250YWluZXIgPSB0aGF0LiRlbC5maW5kKCcuJyArIHRoYXQuY2xhc3Nlcy5lcnJvck1lc3NhZ2UpO1xyXG5cclxuICBpZiAobXNnKSBtc2cgPSAobXNnQ29udGFpbmVyLmRhdGEoJ21lc3NhZ2UtcHJlZml4JykgfHwgJycpICsgbXNnO1xyXG5cclxuICBtc2dDb250YWluZXIudGV4dChtc2cpO1xyXG59XHJcbmV4cG9ydHMuaGFuZGxlckNhbGVuZGFyRXJyb3IgPSBoYW5kbGVyQ2FsZW5kYXJFcnJvcjtcclxuXHJcbmZ1bmN0aW9uIG1vdmVCaW5kUmFuZ2VJbkRheXMod2Vla2x5LCBkYXlzKSB7XHJcbiAgdmFyIFxyXG4gICAgc3RhcnQgPSBkYXRlVXRpbHMuYWRkRGF5cyh3ZWVrbHkuZGF0ZXNSYW5nZS5zdGFydCwgZGF5cyksXHJcbiAgICBlbmQgPSBkYXRlVXRpbHMuYWRkRGF5cyh3ZWVrbHkuZGF0ZXNSYW5nZS5lbmQsIGRheXMpLFxyXG4gICAgZGF0ZXNSYW5nZSA9IGRhdGVzVG9SYW5nZShzdGFydCwgZW5kKTtcclxuXHJcbiAgLy8gQ2hlY2sgY2FjaGUgYmVmb3JlIHRyeSB0byBmZXRjaFxyXG4gIHZhciBpbkNhY2hlID0gd2Vla2x5SXNEYXRhSW5DYWNoZSh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG5cclxuICBpZiAoaW5DYWNoZSkge1xyXG4gICAgLy8gSnVzdCBzaG93IHRoZSBkYXRhXHJcbiAgICB3ZWVrbHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAvLyBQcmVmZXRjaCBleGNlcHQgaWYgdGhlcmUgaXMgb3RoZXIgcmVxdWVzdCBpbiBjb3Vyc2UgKGNhbiBiZSB0aGUgc2FtZSBwcmVmZXRjaCxcclxuICAgIC8vIGJ1dCBzdGlsbCBkb24ndCBvdmVybG9hZCB0aGUgc2VydmVyKVxyXG4gICAgaWYgKHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcbiAgfSBlbHNlIHtcclxuXHJcbiAgICAvLyBTdXBwb3J0IGZvciBwcmVmZXRjaGluZzpcclxuICAgIC8vIEl0cyBhdm9pZGVkIGlmIHRoZXJlIGFyZSByZXF1ZXN0cyBpbiBjb3Vyc2UsIHNpbmNlXHJcbiAgICAvLyB0aGF0IHdpbGwgYmUgYSBwcmVmZXRjaCBmb3IgdGhlIHNhbWUgZGF0YS5cclxuICAgIGlmICh3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCkge1xyXG4gICAgICAvLyBUaGUgbGFzdCByZXF1ZXN0IGluIHRoZSBwb29sICptdXN0KiBiZSB0aGUgbGFzdCBpbiBmaW5pc2hcclxuICAgICAgLy8gKG11c3QgYmUgb25seSBvbmUgaWYgYWxsIGdvZXMgZmluZSk6XHJcbiAgICAgIHZhciByZXF1ZXN0ID0gd2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0c1t3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgLy8gV2FpdCBmb3IgdGhlIGZldGNoIHRvIHBlcmZvcm0gYW5kIHNldHMgbG9hZGluZyB0byBub3RpZnkgdXNlclxyXG4gICAgICB3ZWVrbHkuJGVsLmFkZENsYXNzKHdlZWtseS5jbGFzc2VzLmZldGNoaW5nKTtcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBtb3ZlQmluZFJhbmdlSW5EYXlzKHdlZWtseSwgZGF5cyk7XHJcbiAgICAgICAgd2Vla2x5LiRlbC5yZW1vdmVDbGFzcyh3ZWVrbHkuY2xhc3Nlcy5mZXRjaGluZyB8fCAnXycpO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZldGNoIChkb3dubG9hZCkgdGhlIGRhdGEgYW5kIHNob3cgb24gcmVhZHk6XHJcbiAgICB3ZWVrbHlcclxuICAgIC5mZXRjaERhdGEoZGF0ZXNUb1F1ZXJ5KGRhdGVzUmFuZ2UpKVxyXG4gICAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICB3ZWVrbHkuYmluZERhdGEoZGF0ZXNSYW5nZSk7XHJcbiAgICAgIC8vIFByZWZldGNoXHJcbiAgICAgIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5leHBvcnRzLm1vdmVCaW5kUmFuZ2VJbkRheXMgPSBtb3ZlQmluZFJhbmdlSW5EYXlzO1xyXG5cclxuZnVuY3Rpb24gd2Vla2x5SXNEYXRhSW5DYWNoZSh3ZWVrbHksIGRhdGVzUmFuZ2UpIHtcclxuICBpZiAoIXdlZWtseS5kYXRhIHx8ICF3ZWVrbHkuZGF0YS5zbG90cykgcmV0dXJuIGZhbHNlO1xyXG4gIC8vIENoZWNrIGNhY2hlOiBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGRhdGUgaW4gdGhlIHJhbmdlXHJcbiAgLy8gd2l0aG91dCBkYXRhLCB3ZSBzZXQgaW5DYWNoZSBhcyBmYWxzZSBhbmQgZmV0Y2ggdGhlIGRhdGE6XHJcbiAgdmFyIGluQ2FjaGUgPSB0cnVlO1xyXG4gIGRhdGVVdGlscy5lYWNoRGF0ZUluUmFuZ2UoZGF0ZXNSYW5nZS5zdGFydCwgZGF0ZXNSYW5nZS5lbmQsIGZ1bmN0aW9uIChkYXRlKSB7XHJcbiAgICB2YXIgZGF0ZWtleSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG4gICAgaWYgKCF3ZWVrbHkuZGF0YS5zbG90c1tkYXRla2V5XSkge1xyXG4gICAgICBpbkNhY2hlID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuICByZXR1cm4gaW5DYWNoZTtcclxufVxyXG5leHBvcnRzLndlZWtseUlzRGF0YUluQ2FjaGUgPSB3ZWVrbHlJc0RhdGFJbkNhY2hlO1xyXG5cclxuLyoqXHJcbiAgRm9yIG5vdywgZ2l2ZW4gdGhlIEpTT04gc3RydWN0dXJlIHVzZWQsIHRoZSBsb2dpY1xyXG4gIG9mIG1vbnRobHlJc0RhdGFJbkNhY2hlIGlzIHRoZSBzYW1lIGFzIHdlZWtseUlzRGF0YUluQ2FjaGU6XHJcbioqL1xyXG52YXIgbW9udGhseUlzRGF0YUluQ2FjaGUgPSB3ZWVrbHlJc0RhdGFJbkNhY2hlO1xyXG5leHBvcnRzLm1vbnRobHlJc0RhdGFJbkNhY2hlID0gbW9udGhseUlzRGF0YUluQ2FjaGU7XHJcblxyXG5cclxuZnVuY3Rpb24gd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh3ZWVrbHksIGN1cnJlbnREYXRlc1JhbmdlKSB7XHJcbiAgdmFyIG5leHREYXRlc1JhbmdlID0gZGF0ZXNUb1JhbmdlKFxyXG4gICAgZGF0ZVV0aWxzLmFkZERheXMoY3VycmVudERhdGVzUmFuZ2Uuc3RhcnQsIDcpLFxyXG4gICAgZGF0ZVV0aWxzLmFkZERheXMoY3VycmVudERhdGVzUmFuZ2UuZW5kLCA3KVxyXG4gICk7XHJcblxyXG4gIGlmICghd2Vla2x5SXNEYXRhSW5DYWNoZSh3ZWVrbHksIG5leHREYXRlc1JhbmdlKSkge1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHZhciBwcmVmZXRjaFF1ZXJ5ID0gZGF0ZXNUb1F1ZXJ5KG5leHREYXRlc1JhbmdlKTtcclxuICAgIHdlZWtseS5mZXRjaERhdGEocHJlZmV0Y2hRdWVyeSwgbnVsbCwgdHJ1ZSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydHMud2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCA9IHdlZWtseUNoZWNrQW5kUHJlZmV0Y2g7XHJcblxyXG4vKiogVXBkYXRlIHRoZSB2aWV3IGxhYmVscyBmb3IgdGhlIHdlZWstZGF5cyAodGFibGUgaGVhZGVycylcclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZUxhYmVscyhkYXRlc1JhbmdlLCBjYWxlbmRhciwgb3B0aW9ucykge1xyXG4gIHZhciBzdGFydCA9IGRhdGVzUmFuZ2Uuc3RhcnQsXHJcbiAgICAgIGVuZCA9IGRhdGVzUmFuZ2UuZW5kO1xyXG5cclxuICB2YXIgZGF5cyA9IGNhbGVuZGFyLmZpbmQoJy4nICsgb3B0aW9ucy5jbGFzc2VzLmRheXMgKyAnIHRoJyk7XHJcbiAgdmFyIHRvZGF5ID0gZGF0ZUlTTy5kYXRlTG9jYWwobmV3IERhdGUoKSk7XHJcbiAgLy8gRmlyc3QgY2VsbCBpcyBlbXB0eSAoJ3RoZSBjcm9zcyBoZWFkZXJzIGNlbGwnKSwgdGhlbiBvZmZzZXQgaXMgMVxyXG4gIHZhciBvZmZzZXQgPSAxO1xyXG4gIGRhdGVVdGlscy5lYWNoRGF0ZUluUmFuZ2Uoc3RhcnQsIGVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIHZhciBjZWxsID0gJChkYXlzLmdldChvZmZzZXQgKyBpKSksXHJcbiAgICAgICAgc2RhdGUgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlKSxcclxuICAgICAgICBsYWJlbCA9IHNkYXRlO1xyXG5cclxuICAgIGlmICh0b2RheSA9PSBzZGF0ZSlcclxuICAgICAgbGFiZWwgPSBvcHRpb25zLnRleHRzLnRvZGF5O1xyXG4gICAgZWxzZVxyXG4gICAgICBsYWJlbCA9IG9wdGlvbnMudGV4dHMuYWJicldlZWtEYXlzW2RhdGUuZ2V0RGF5KCldICsgJyAnICsgZm9ybWF0RGF0ZShkYXRlLCBvcHRpb25zLnRleHRzLmFiYnJEYXRlRm9ybWF0KTtcclxuXHJcbiAgICBjZWxsLnRleHQobGFiZWwpO1xyXG4gIH0pO1xyXG59XHJcbmV4cG9ydHMudXBkYXRlTGFiZWxzID0gdXBkYXRlTGFiZWxzO1xyXG5cclxuZnVuY3Rpb24gZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIGRheSwgc2xvdCkge1xyXG4gIHNsb3QgPSBkYXRlSVNPLnBhcnNlKHNsb3QpO1xyXG4gIHZhciBcclxuICAgIHggPSBNYXRoLnJvdW5kKHNsb3QuZ2V0SG91cnMoKSksXHJcbiAgLy8gVGltZSBmcmFtZXMgKHNsb3RzKSBhcmUgMTUgbWludXRlcyBkaXZpc2lvbnNcclxuICAgIHkgPSBNYXRoLnJvdW5kKHNsb3QuZ2V0TWludXRlcygpIC8gMTUpLFxyXG4gICAgdHIgPSBzbG90c0NvbnRhaW5lci5jaGlsZHJlbignOmVxKCcgKyBNYXRoLnJvdW5kKHggKiA0ICsgeSkgKyAnKScpO1xyXG5cclxuICAvLyBTbG90IGNlbGwgZm9yIG8nY2xvY2sgaG91cnMgaXMgYXQgMSBwb3NpdGlvbiBvZmZzZXRcclxuICAvLyBiZWNhdXNlIG9mIHRoZSByb3ctaGVhZCBjZWxsXHJcbiAgdmFyIGRheU9mZnNldCA9ICh5ID09PSAwID8gZGF5ICsgMSA6IGRheSk7XHJcbiAgcmV0dXJuIHRyLmNoaWxkcmVuKCc6ZXEoJyArIGRheU9mZnNldCArICcpJyk7XHJcbn1cclxuZXhwb3J0cy5maW5kQ2VsbEJ5U2xvdCA9IGZpbmRDZWxsQnlTbG90O1xyXG5cclxuZnVuY3Rpb24gZmluZFNsb3RCeUNlbGwoc2xvdHNDb250YWluZXIsIGNlbGwpIHtcclxuICB2YXIgXHJcbiAgICB4ID0gY2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgoY2VsbCksXHJcbiAgICB5ID0gY2VsbC5jbG9zZXN0KCd0cicpLmluZGV4KCksXHJcbiAgICBmdWxsTWludXRlcyA9IHkgKiAxNSxcclxuICAgIGhvdXJzID0gTWF0aC5mbG9vcihmdWxsTWludXRlcyAvIDYwKSxcclxuICAgIG1pbnV0ZXMgPSBmdWxsTWludXRlcyAtIChob3VycyAqIDYwKSxcclxuICAgIHNsb3QgPSBuZXcgRGF0ZSgpO1xyXG4gIHNsb3Quc2V0SG91cnMoaG91cnMsIG1pbnV0ZXMsIDAsIDApO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgZGF5OiB4LFxyXG4gICAgc2xvdDogc2xvdFxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5maW5kU2xvdEJ5Q2VsbCA9IGZpbmRTbG90QnlDZWxsO1xyXG5cclxuLyoqXHJcbk1hcmsgY2FsZW5kYXIgYXMgY3VycmVudC13ZWVrIGFuZCBkaXNhYmxlIHByZXYgYnV0dG9uLFxyXG5vciByZW1vdmUgdGhlIG1hcmsgYW5kIGVuYWJsZSBpdCBpZiBpcyBub3QuXHJcbioqL1xyXG5mdW5jdGlvbiBjaGVja0N1cnJlbnRXZWVrKGNhbGVuZGFyLCBkYXRlLCBvcHRpb25zKSB7XHJcbiAgdmFyIHllcCA9IGRhdGVVdGlscy5pc0luQ3VycmVudFdlZWsoZGF0ZSk7XHJcbiAgY2FsZW5kYXIudG9nZ2xlQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLmN1cnJlbnRXZWVrLCB5ZXApO1xyXG4gIGNhbGVuZGFyLmZpbmQoJy4nICsgb3B0aW9ucy5jbGFzc2VzLnByZXZBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxufVxyXG5leHBvcnRzLmNoZWNrQ3VycmVudFdlZWsgPSBjaGVja0N1cnJlbnRXZWVrO1xyXG5cclxuLyoqIEdldCBxdWVyeSBvYmplY3Qgd2l0aCB0aGUgZGF0ZSByYW5nZSBzcGVjaWZpZWQ6XHJcbioqL1xyXG5mdW5jdGlvbiBkYXRlc1RvUXVlcnkoc3RhcnQsIGVuZCkge1xyXG4gIC8vIFVuaXF1ZSBwYXJhbSB3aXRoIGJvdGggcHJvcGllcnRpZXM6XHJcbiAgaWYgKHN0YXJ0LmVuZCkge1xyXG4gICAgZW5kID0gc3RhcnQuZW5kO1xyXG4gICAgc3RhcnQgPSBzdGFydC5zdGFydDtcclxuICB9XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBkYXRlSVNPLmRhdGVMb2NhbChzdGFydCwgdHJ1ZSksXHJcbiAgICBlbmQ6IGRhdGVJU08uZGF0ZUxvY2FsKGVuZCwgdHJ1ZSlcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuZGF0ZXNUb1F1ZXJ5ID0gZGF0ZXNUb1F1ZXJ5O1xyXG5cclxuLyoqIFBhY2sgdHdvIGRhdGVzIGluIGEgc2ltcGxlIGJ1dCB1c2VmdWxcclxuc3RydWN0dXJlIHsgc3RhcnQsIGVuZCB9XHJcbioqL1xyXG5mdW5jdGlvbiBkYXRlc1RvUmFuZ2Uoc3RhcnQsIGVuZCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogc3RhcnQsXHJcbiAgICBlbmQ6IGVuZFxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5kYXRlc1RvUmFuZ2UgPSBkYXRlc1RvUmFuZ2U7XHJcbiIsIi8qKlxyXG4gICAgU21hbGwgdXRpbGl0eSB0byB3cmFwIGEgY2FsbGJhY2svaGFuZGxlciBmdW5jdGlvbiBpbiBhIHRpbWVyXHJcbiAgICBiZWluZyBleGVjdXRlZCBvbmx5IG9uY2UgKHRoZSBsYXRlc3QgY2FsbCkgaW5zaWRlIHRoZSB0aW1lZnJhbWUsXHJcbiAgICBkZWZpbmVkIGJ5IHRoZSBpbnRlcnZhbCBwYXJhbWV0ZXIsIGl0cyBqdXN0IDEgbWlsaXNlY29uZCBieSBkZWZhdWx0LlxyXG4gICAgSXRzIHVzZWZ1bCB3aGVuIGFuIGV2ZW50IGdldHMgZXhlY3V0ZWRcclxuICAgIGxvdHMgb2YgdGltZXMgdG9vIHF1aWNrbHkgYW5kIG9ubHkgMSBleGVjdXRpb24gaXMgd2FudGVkIHRvIGF2b2lkXHJcbiAgICBodXJ0IHBlcmZvcm1hbmNlLlxyXG4gICAgVGhlIGRlZmF1bHQgaW50ZXJ2YWwgb2YgMSB3b3JrcyBmaW5lIGlmIHRoZSBldmVudCBnZXRzIHJhaXNlZFxyXG4gICAgYSBsb3QgYnkgY29uc2VjdXRpdmUgY29kZSwgYnV0IGlmIGNhbGxzIGFyZSBkZWxheWVkIGEgZ3JlYXRlclxyXG4gICAgaW50ZXJ2YWwgd2lsbCBiZSBuZWVkLlxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYXRjaEV2ZW50SGFuZGxlcihjYiwgaW50ZXJ2YWwpIHtcclxuICAgIHZhciB0aW1lcjtcclxuXHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY2IuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxuICAgICAgICB9LCBpbnRlcnZhbCB8fCAxKTtcclxuICAgIH07XHJcbn07IiwiLyogR2VuZXJpYyBibG9ja1VJIG9wdGlvbnMgc2V0cyAqL1xyXG52YXIgbG9hZGluZ0Jsb2NrID0geyBtZXNzYWdlOiAnPGltZyB3aWR0aD1cIjQ4cHhcIiBoZWlnaHQ9XCI0OHB4XCIgY2xhc3M9XCJsb2FkaW5nLWluZGljYXRvclwiIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nIH07XHJcbnZhciBlcnJvckJsb2NrID0gZnVuY3Rpb24gKGVycm9yLCByZWxvYWQsIHN0eWxlKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGNzczogJC5leHRlbmQoeyBjdXJzb3I6ICdkZWZhdWx0JyB9LCBzdHlsZSB8fCB7fSksXHJcbiAgICAgICAgbWVzc2FnZTogJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT48ZGl2IGNsYXNzPVwiaW5mb1wiPlRoZXJlIHdhcyBhbiBlcnJvcicgK1xyXG4gICAgICAgICAgICAoZXJyb3IgPyAnOiAnICsgZXJyb3IgOiAnJykgK1xyXG4gICAgICAgICAgICAocmVsb2FkID8gJyA8YSBocmVmPVwiamF2YXNjcmlwdDogJyArIHJlbG9hZCArICc7XCI+Q2xpY2sgdG8gcmVsb2FkPC9hPicgOiAnJykgK1xyXG4gICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgfTtcclxufTtcclxudmFyIGluZm9CbG9jayA9IGZ1bmN0aW9uIChtZXNzYWdlLCBvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gJC5leHRlbmQoe1xyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj4nICsgbWVzc2FnZSArICc8L2Rpdj4nXHJcbiAgICAgICAgLyosY3NzOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0qL1xyXG4gICAgICAgICwgb3ZlcmxheUNTUzogeyBjdXJzb3I6ICdkZWZhdWx0JyB9XHJcbiAgICB9LCBvcHRpb25zKTtcclxufTtcclxuXHJcbi8vIE1vZHVsZTpcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBsb2FkaW5nOiBsb2FkaW5nQmxvY2ssXHJcbiAgICAgICAgZXJyb3I6IGVycm9yQmxvY2ssXHJcbiAgICAgICAgaW5mbzogaW5mb0Jsb2NrXHJcbiAgICB9O1xyXG59IiwiLyo9IENoYW5nZXNOb3RpZmljYXRpb24gY2xhc3NcclxuKiB0byBub3RpZnkgdXNlciBhYm91dCBjaGFuZ2VzIGluIGZvcm1zLFxyXG4qIHRhYnMsIHRoYXQgd2lsbCBiZSBsb3N0IGlmIGdvIGF3YXkgZnJvbVxyXG4qIHRoZSBwYWdlLiBJdCBrbm93cyB3aGVuIGEgZm9ybSBpcyBzdWJtaXR0ZWRcclxuKiBhbmQgc2F2ZWQgdG8gZGlzYWJsZSBub3RpZmljYXRpb24sIGFuZCBnaXZlc1xyXG4qIG1ldGhvZHMgZm9yIG90aGVyIHNjcmlwdHMgdG8gbm90aWZ5IGNoYW5nZXNcclxuKiBvciBzYXZpbmcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBnZXRYUGF0aCA9IHJlcXVpcmUoJy4vZ2V0WFBhdGgnKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0ge1xyXG4gICAgY2hhbmdlc0xpc3Q6IHt9LFxyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgICB0YXJnZXQ6IG51bGwsXHJcbiAgICAgICAgZ2VuZXJpY0NoYW5nZVN1cHBvcnQ6IHRydWUsXHJcbiAgICAgICAgZ2VuZXJpY1N1Ym1pdFN1cHBvcnQ6IGZhbHNlLFxyXG4gICAgICAgIGNoYW5nZWRGb3JtQ2xhc3M6ICdoYXMtY2hhbmdlcycsXHJcbiAgICAgICAgY2hhbmdlZEVsZW1lbnRDbGFzczogJ2NoYW5nZWQnLFxyXG4gICAgICAgIG5vdGlmeUNsYXNzOiAnbm90aWZ5LWNoYW5nZXMnXHJcbiAgICB9LFxyXG4gICAgaW5pdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICAvLyBVc2VyIG5vdGlmaWNhdGlvbiB0byBwcmV2ZW50IGxvc3QgY2hhbmdlcyBkb25lXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VzTm90aWZpY2F0aW9uLm5vdGlmeSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0aGlzLmRlZmF1bHRzLCBvcHRpb25zKTtcclxuICAgICAgICBpZiAoIW9wdGlvbnMudGFyZ2V0KVxyXG4gICAgICAgICAgICBvcHRpb25zLnRhcmdldCA9IGRvY3VtZW50O1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNDaGFuZ2VTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignY2hhbmdlJywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCkgOmlucHV0W25hbWVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZSgkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksIHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljU3VibWl0U3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ3N1Ym1pdCcsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUodGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG5vdGlmeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIEFkZCBub3RpZmljYXRpb24gY2xhc3MgdG8gdGhlIGRvY3VtZW50XHJcbiAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMubm90aWZ5Q2xhc3MpO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgY2hhbmdlIGluIHRoZSBwcm9wZXJ0eSBsaXN0IHJldHVybmluZyB0aGUgbWVzc2FnZTpcclxuICAgICAgICBmb3IgKHZhciBjIGluIHRoaXMuY2hhbmdlc0xpc3QpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1aXRNZXNzYWdlIHx8ICh0aGlzLnF1aXRNZXNzYWdlID0gJCgnI2xjcmVzLXF1aXQtd2l0aG91dC1zYXZlJykudGV4dCgpKSB8fCAnJztcclxuICAgIH0sXHJcbiAgICByZWdpc3RlckNoYW5nZTogZnVuY3Rpb24gKGYsIGUpIHtcclxuICAgICAgICBpZiAoIWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICB2YXIgZmwgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdIHx8IFtdO1xyXG4gICAgICAgIGlmICgkLmlzQXJyYXkoZSkpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlckNoYW5nZShmLCBlW2ldKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbiA9IGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAoZSkgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIG4gPSBlLm5hbWU7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHJlYWxseSB0aGVyZSB3YXMgYSBjaGFuZ2UgY2hlY2tpbmcgZGVmYXVsdCBlbGVtZW50IHZhbHVlXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGUuZGVmYXVsdFZhbHVlKSAhPSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLmNoZWNrZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuc2VsZWN0ZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICBlLnZhbHVlID09IGUuZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSB3YXMgbm8gY2hhbmdlLCBubyBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgLy8gYW5kIG1heWJlIGlzIGEgcmVncmVzc2lvbiBmcm9tIGEgY2hhbmdlIGFuZCBub3cgdGhlIG9yaWdpbmFsIHZhbHVlIGFnYWluXHJcbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gcmVtb3ZlIGZyb20gY2hhbmdlcyBsaXN0IGRvaW5nIHJlZ2lzdGVyU2F2ZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlclNhdmUoZiwgW25dKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkKGUpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghKG4gaW4gZmwpKVxyXG4gICAgICAgICAgICBmbC5wdXNoKG4pO1xyXG4gICAgICAgICQoZilcclxuICAgICAgICAuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKVxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudCBuYW1lIGNoYW5nZWQsIGZvcm0gZWxlbWVudCBjaGFuZ2VkICh0aGlzIGNhbiBiZSBudWxsKVxyXG4gICAgICAgIC50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgW2YsIG4sIGVdKTtcclxuICAgIH0sXHJcbiAgICByZWdpc3RlclNhdmU6IGZ1bmN0aW9uIChmLCBlbHMpIHtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBwcmV2RWxzID0gJC5leHRlbmQoW10sIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKTtcclxuXHJcbiAgICAgICAgLy8gJ2VscycgKGZpbHRlcmVkIGZvcm0gZWxlbWVudHMgbGlzdCkgY2FuIGJlIGFuIGFycmF5IG9mIGZpZWxkICduYW1lJ3Mgb3IgYW4gYXJyYXkgb2YgRE9NIGVsZW1lbnRzIChvciBtaXhlZClcclxuICAgICAgICAvLyBpdHMgY29udmVydGVkIHRvIGFuIGFycmF5IG9mICduYW1lJ3MgYW55d2F5OlxyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgZWxzID0gJC5tYXAoZWxzLCBmdW5jdGlvbiAoZWwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAodHlwZW9mIChlbCkgPT09ICdzdHJpbmcnID8gZWwgOiBlbC5uYW1lKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB0by1yZW1vdmUgZm9ybSBsaXN0IGZsYWc6IGJ5IGRlZmF1bHQgdHJ1ZSwgc2luY2Ugd2hlbiBubyBlbHMgbGlzdCBzaW5jZSBpcyBhbGwgdGhlIGZvcm0gc2F2ZWRcclxuICAgICAgICB2YXIgciA9IHRydWU7XHJcbiAgICAgICAgaWYgKGVscykge1xyXG4gICAgICAgICAgICB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9ICQuZ3JlcCh0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSwgZnVuY3Rpb24gKGVsKSB7IHJldHVybiAoJC5pbkFycmF5KGVsLCBlbHMpID09IC0xKTsgfSk7XHJcbiAgICAgICAgICAgIC8vIERvbid0IHJlbW92ZSAnZicgbGlzdCBpZiBpcyBub3QgZW1wdHlcclxuICAgICAgICAgICAgciA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLmxlbmd0aCA9PT0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyKSB7XHJcbiAgICAgICAgICAgICQoZikucmVtb3ZlQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gcGFzcyBkYXRhOiBmb3JtLCBlbGVtZW50cyByZWdpc3RlcmVkIGFzIHNhdmUgKHRoaXMgY2FuIGJlIG51bGwpLCBhbmQgJ2Zvcm0gZnVsbHkgc2F2ZWQnIGFzIHRoaXJkIHBhcmFtIChib29sKVxyXG4gICAgICAgICQoZikudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uU2F2ZVJlZ2lzdGVyZWQnLCBbZiwgZWxzIHx8IHByZXZFbHMsIHJdKTtcclxuICAgICAgICB2YXIgbGNobiA9IHRoaXM7XHJcbiAgICAgICAgaWYgKGVscykge1xyXG4gICAgICAgICAgICAkLmVhY2goZWxzLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKCdbbmFtZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHRoaXMpICsgJ1wiXScpXHJcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MobGNobi5kZWZhdWx0cy5jaGFuZ2VkRWxlbWVudENsYXNzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwcmV2RWxzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uO1xyXG59IiwiLyogVXRpbGl0eSB0byBjcmVhdGUgaWZyYW1lIHdpdGggaW5qZWN0ZWQgaHRtbC9jb250ZW50IGluc3RlYWQgb2YgVVJMLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVJZnJhbWUoY29udGVudCwgc2l6ZSkge1xyXG4gICAgdmFyICRpZnJhbWUgPSAkKCc8aWZyYW1lIHdpZHRoPVwiJyArIHNpemUud2lkdGggKyAnXCIgaGVpZ2h0PVwiJyArIHNpemUuaGVpZ2h0ICsgJ1wiIHN0eWxlPVwiYm9yZGVyOm5vbmU7XCI+PC9pZnJhbWU+Jyk7XHJcbiAgICB2YXIgaWZyYW1lID0gJGlmcmFtZS5nZXQoMCk7XHJcbiAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgcmVhZHlcclxuICAgIHZhciBpZnJhbWVsb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmcmFtZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gVXNpbmcgaWZyYW1lbG9hZGVkIHRvIGF2b2lkIGluZmluaXRlIGxvb3BzXHJcbiAgICAgICAgaWYgKCFpZnJhbWVsb2FkZWQpIHtcclxuICAgICAgICAgICAgaWZyYW1lbG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gJGlmcmFtZTtcclxufTtcclxuXHJcbi8qIFB1dHMgZnVsbCBodG1sIGluc2lkZSB0aGUgaWZyYW1lIGVsZW1lbnQgcGFzc2VkIGluIGEgc2VjdXJlIGFuZCBjb21wbGlhbnQgbW9kZSAqL1xyXG5mdW5jdGlvbiBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgaHRtbCkge1xyXG4gICAgLy8gcHV0IGFqYXggZGF0YSBpbnNpZGUgaWZyYW1lIHJlcGxhY2luZyBhbGwgdGhlaXIgaHRtbCBpbiBzZWN1cmUgXHJcbiAgICAvLyBjb21wbGlhbnQgbW9kZSAoJC5odG1sIGRvbid0IHdvcmtzIHRvIGluamVjdCA8aHRtbD48aGVhZD4gY29udGVudClcclxuXHJcbiAgICAvKiBkb2N1bWVudCBBUEkgdmVyc2lvbiAocHJvYmxlbXMgd2l0aCBJRSwgZG9uJ3QgZXhlY3V0ZSBpZnJhbWUtaHRtbCBzY3JpcHRzKSAqL1xyXG4gICAgLyp2YXIgaWZyYW1lRG9jID1cclxuICAgIC8vIFczQyBjb21wbGlhbnQ6IG5zLCBmaXJlZm94LWdlY2tvLCBjaHJvbWUvc2FmYXJpLXdlYmtpdCwgb3BlcmEsIGllOVxyXG4gICAgaWZyYW1lLmNvbnRlbnREb2N1bWVudCB8fFxyXG4gICAgLy8gb2xkIElFICg1LjUrKVxyXG4gICAgKGlmcmFtZS5jb250ZW50V2luZG93ID8gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgOiBudWxsKSB8fFxyXG4gICAgLy8gZmFsbGJhY2sgKHZlcnkgb2xkIElFPylcclxuICAgIGRvY3VtZW50LmZyYW1lc1tpZnJhbWUuaWRdLmRvY3VtZW50O1xyXG4gICAgaWZyYW1lRG9jLm9wZW4oKTtcclxuICAgIGlmcmFtZURvYy53cml0ZShodG1sKTtcclxuICAgIGlmcmFtZURvYy5jbG9zZSgpOyovXHJcblxyXG4gICAgLyogamF2YXNjcmlwdCBVUkkgdmVyc2lvbiAod29ya3MgZmluZSBldmVyeXdoZXJlISkgKi9cclxuICAgIGlmcmFtZS5jb250ZW50V2luZG93LmNvbnRlbnRzID0gaHRtbDtcclxuICAgIGlmcmFtZS5zcmMgPSAnamF2YXNjcmlwdDp3aW5kb3dbXCJjb250ZW50c1wiXSc7XHJcblxyXG4gICAgLy8gQWJvdXQgdGhpcyB0ZWNobmlxdWUsIHRoaXMgaHR0cDovL3NwYXJlY3ljbGVzLndvcmRwcmVzcy5jb20vMjAxMi8wMy8wOC9pbmplY3QtY29udGVudC1pbnRvLWEtbmV3LWlmcmFtZS9cclxufVxyXG5cclxuIiwiLyogQ1JVREwgSGVscGVyICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxudmFyIGdldFRleHQgPSByZXF1aXJlKCcuL2dldFRleHQnKTtcclxudmFyIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5cclxuZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MgPSB7XHJcbiAgZWZmZWN0czoge1xyXG4gICAgJ3Nob3ctdmlld2VyJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sXHJcbiAgICAnaGlkZS12aWV3ZXInOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSxcclxuICAgICdzaG93LWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LCAvLyB0aGUgc2FtZSBhcyBqcXVlcnktdWkgeyBlZmZlY3Q6ICdzbGlkZScsIGR1cmF0aW9uOiAnc2xvdycsIGRpcmVjdGlvbjogJ2Rvd24nIH1cclxuICAgICdoaWRlLWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9XHJcbiAgfSxcclxuICBldmVudHM6IHtcclxuICAgICdlZGl0LWVuZHMnOiAnY3J1ZGwtZWRpdC1lbmRzJyxcclxuICAgICdlZGl0LXN0YXJ0cyc6ICdjcnVkbC1lZGl0LXN0YXJ0cycsXHJcbiAgICAnZWRpdG9yLXJlYWR5JzogJ2NydWRsLWVkaXRvci1yZWFkeScsXHJcbiAgICAnZWRpdG9yLXNob3dlZCc6ICdjcnVkbC1lZGl0b3Itc2hvd2VkJyxcclxuICAgICdlZGl0b3ItaGlkZGVuJzogJ2NydWRsLWVkaXRvci1oaWRkZW4nLFxyXG4gICAgJ2NyZWF0ZSc6ICdjcnVkbC1jcmVhdGUnLFxyXG4gICAgJ3VwZGF0ZSc6ICdjcnVkbC11cGRhdGUnLFxyXG4gICAgJ2RlbGV0ZSc6ICdjcnVkbC1kZWxldGUnXHJcbiAgfSxcclxuICBkYXRhOiB7XHJcbiAgICAnZm9jdXMtY2xvc2VzdCc6IHtcclxuICAgICAgbmFtZTogJ2NydWRsLWZvY3VzLWNsb3Nlc3QnLFxyXG4gICAgICAnZGVmYXVsdCc6ICcqJ1xyXG4gICAgfSxcclxuICAgICdmb2N1cy1tYXJnaW4nOiB7XHJcbiAgICAgIG5hbWU6ICdjcnVkbC1mb2N1cy1tYXJnaW4nLFxyXG4gICAgICAnZGVmYXVsdCc6IDBcclxuICAgIH0sXHJcbiAgICAnZm9jdXMtZHVyYXRpb24nOiB7XHJcbiAgICAgIG5hbWU6ICdjcnVkbC1mb2N1cy1kdXJhdGlvbicsXHJcbiAgICAgICdkZWZhdWx0JzogMjAwXHJcbiAgICB9XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgVXRpbGl0eSB0byBnZXQgYSBkYXRhIHZhbHVlIG9yIHRoZSBkZWZhdWx0IGJhc2VkIG9uIHRoZSBpbnN0YW5jZVxyXG4gIHNldHRpbmdzIG9uIHRoZSBnaXZlbiBlbGVtZW50XHJcbioqL1xyXG5mdW5jdGlvbiBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGVsLCBzZXR0aW5nTmFtZSkge1xyXG4gIHZhclxyXG4gICAgc2V0dGluZyA9IGluc3RhbmNlLnNldHRpbmdzLmRhdGFbc2V0dGluZ05hbWVdLFxyXG4gICAgdmFsID0gZWwuZGF0YShzZXR0aW5nLm5hbWUpIHx8IHNldHRpbmdbJ2RlZmF1bHQnXTtcclxuICByZXR1cm4gdmFsO1xyXG59XHJcblxyXG5leHBvcnRzLnNldHVwID0gZnVuY3Rpb24gc2V0dXBDcnVkbChvblN1Y2Nlc3MsIG9uRXJyb3IsIG9uQ29tcGxldGUpIHtcclxuICByZXR1cm4ge1xyXG4gICAgb246IGZ1bmN0aW9uIG9uKHNlbGVjdG9yLCBzZXR0aW5ncykge1xyXG4gICAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8ICcuY3J1ZGwnO1xyXG4gICAgICB2YXIgaW5zdGFuY2UgPSB7XHJcbiAgICAgICAgc2VsZWN0b3I6IHNlbGVjdG9yLFxyXG4gICAgICAgIGVsZW1lbnRzOiAkKHNlbGVjdG9yKVxyXG4gICAgICB9O1xyXG4gICAgICAvLyBFeHRlbmRpbmcgZGVmYXVsdCBzZXR0aW5ncyB3aXRoIHByb3ZpZGVkIG9uZXMsXHJcbiAgICAgIC8vIGJ1dCBzb21lIGNhbiBiZSB0d2VhayBvdXRzaWRlIHRvby5cclxuICAgICAgaW5zdGFuY2Uuc2V0dGluZ3MgPSAkLmV4dGVuZCh0cnVlLCBleHBvcnRzLmRlZmF1bHRTZXR0aW5ncywgc2V0dGluZ3MpO1xyXG4gICAgICBpbnN0YW5jZS5lbGVtZW50cy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3J1ZGwgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmIChjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nKSA9PT0gdHJ1ZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBkY3R4ID0gY3J1ZGwuZGF0YSgnY3J1ZGwtY29udGV4dCcpIHx8ICcnO1xyXG4gICAgICAgIHZhciB2d3IgPSBjcnVkbC5maW5kKCcuY3J1ZGwtdmlld2VyJyk7XHJcbiAgICAgICAgdmFyIGR0ciA9IGNydWRsLmZpbmQoJy5jcnVkbC1lZGl0b3InKTtcclxuICAgICAgICB2YXIgaWlkcGFyID0gY3J1ZGwuZGF0YSgnY3J1ZGwtaXRlbS1pZC1wYXJhbWV0ZXInKSB8fCAnSXRlbUlEJztcclxuICAgICAgICB2YXIgZm9ybXBhcnMgPSB7IGFjdGlvbjogJ2NyZWF0ZScgfTtcclxuICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gMDtcclxuICAgICAgICB2YXIgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRFeHRyYVF1ZXJ5KGVsKSB7XHJcbiAgICAgICAgICAvLyBHZXQgZXh0cmEgcXVlcnkgb2YgdGhlIGVsZW1lbnQsIGlmIGFueTpcclxuICAgICAgICAgIHZhciB4cSA9IGVsLmRhdGEoJ2NydWRsLWV4dHJhLXF1ZXJ5JykgfHwgJyc7XHJcbiAgICAgICAgICBpZiAoeHEpIHhxID0gJyYnICsgeHE7XHJcbiAgICAgICAgICAvLyBJdGVyYXRlIGFsbCBwYXJlbnRzIGluY2x1ZGluZyB0aGUgJ2NydWRsJyBlbGVtZW50IChwYXJlbnRzVW50aWwgZXhjbHVkZXMgdGhlIGZpcnN0IGVsZW1lbnQgZ2l2ZW4sXHJcbiAgICAgICAgICAvLyBiZWNhdXNlIG9mIHRoYXQgd2UgZ2V0IGl0cyBwYXJlbnQoKSlcclxuICAgICAgICAgIC8vIEZvciBhbnkgb2YgdGhlbSB3aXRoIGFuIGV4dHJhLXF1ZXJ5LCBhcHBlbmQgaXQ6XHJcbiAgICAgICAgICBlbC5wYXJlbnRzVW50aWwoY3J1ZGwucGFyZW50KCksICdbZGF0YS1jcnVkbC1leHRyYS1xdWVyeV0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHggPSAkKHRoaXMpLmRhdGEoJ2NydWRsLWV4dHJhLXF1ZXJ5Jyk7XHJcbiAgICAgICAgICAgIGlmICh4KSB4cSArPSAnJicgKyB4O1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByZXR1cm4geHE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjcnVkbC5maW5kKCcuY3J1ZGwtY3JlYXRlJykuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IDA7XHJcbiAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAnY3JlYXRlJztcclxuICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICBkdHIucmVsb2FkKHtcclxuICAgICAgICAgICAgdXJsOiBmdW5jdGlvbiAodXJsLCBkZWZhdWx0VXJsKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRVcmwgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgZHRyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctZWRpdG9yJ10pXHJcbiAgICAgICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIFtkdHJdKTtcclxuICAgICAgICAgICAgICAgIGR0ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgLy8gSGlkZSB2aWV3ZXIgd2hlbiBpbiBlZGl0b3I6XHJcbiAgICAgICAgICB2d3IueGhpZGUoaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS12aWV3ZXInXSk7XHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddKVxyXG4gICAgICAgICAgLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzLmNyZWF0ZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2d3JcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC11cGRhdGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGl0ZW0gPSAkdC5jbG9zZXN0KCcuY3J1ZGwtaXRlbScpO1xyXG4gICAgICAgICAgdmFyIGl0ZW1pZCA9IGl0ZW0uZGF0YSgnY3J1ZGwtaXRlbS1pZCcpO1xyXG4gICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IGl0ZW1pZDtcclxuICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICd1cGRhdGUnO1xyXG4gICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuICAgICAgICAgIGR0ci5yZWxvYWQoe1xyXG4gICAgICAgICAgICB1cmw6IGZ1bmN0aW9uICh1cmwsIGRlZmF1bHRVcmwpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdFVybCArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBkdHIueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy1lZGl0b3InXSlcclxuICAgICAgICAgICAgICAucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1zaG93ZWQnXSwgW2R0cl0pO1xyXG4gICAgICAgICAgICAgICAgZHRyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBIaWRlIHZpZXdlciB3aGVuIGluIGVkaXRvcjpcclxuICAgICAgICAgIHZ3ci54aGlkZShpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLXZpZXdlciddKTtcclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10pXHJcbiAgICAgICAgICAudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHMudXBkYXRlKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC1kZWxldGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGl0ZW0gPSAkdC5jbG9zZXN0KCcuY3J1ZGwtaXRlbScpO1xyXG4gICAgICAgICAgdmFyIGl0ZW1pZCA9IGl0ZW0uZGF0YSgnY3J1ZGwtaXRlbS1pZCcpO1xyXG5cclxuICAgICAgICAgIGlmIChjb25maXJtKGdldFRleHQoJ2NvbmZpcm0tZGVsZXRlLWNydWRsLWl0ZW0tbWVzc2FnZTonICsgZGN0eCkpKSB7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJzxkaXY+JyArIGdldFRleHQoJ2RlbGV0ZS1jcnVkbC1pdGVtLWxvYWRpbmctbWVzc2FnZTonICsgZGN0eCkgKyAnPC9kaXY+JywgaXRlbSk7XHJcbiAgICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICdkZWxldGUnO1xyXG4gICAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgIHVybDogZHRyLmF0dHIoJ2RhdGEtc291cmNlLXVybCcpICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cSxcclxuICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCc8ZGl2PicgKyBkYXRhLlJlc3VsdCArICc8L2Rpdj4nLCBpdGVtLCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2FibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmZhZGVPdXQoJ3Nsb3cnLCBmdW5jdGlvbiAoKSB7IGl0ZW0ucmVtb3ZlKCk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgb25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAgICAgICAgICAgICBvbkVycm9yKGp4LCBtZXNzYWdlLCBleCk7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZShpdGVtKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGNvbXBsZXRlOiBvbkNvbXBsZXRlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2RlbGV0ZSddKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZpbmlzaEVkaXQoKSB7XHJcbiAgICAgICAgICBmdW5jdGlvbiBvbmNvbXBsZXRlKGFub3RoZXJPbkNvbXBsZXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgLy8gU2hvdyBhZ2FpbiB0aGUgVmlld2VyXHJcbiAgICAgICAgICAgICAgLy92d3Iuc2xpZGVEb3duKCdzbG93Jyk7XHJcbiAgICAgICAgICAgICAgaWYgKCF2d3IuaXMoJzp2aXNpYmxlJykpXHJcbiAgICAgICAgICAgICAgICB2d3IueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSk7XHJcbiAgICAgICAgICAgICAgLy8gTWFyayB0aGUgZm9ybSBhcyB1bmNoYW5nZWQgdG8gYXZvaWQgcGVyc2lzdGluZyB3YXJuaW5nc1xyXG4gICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGR0ci5maW5kKCdmb3JtJykuZ2V0KDApKTtcclxuICAgICAgICAgICAgICAvLyBBdm9pZCBjYWNoZWQgY29udGVudCBvbiB0aGUgRWRpdG9yXHJcbiAgICAgICAgICAgICAgZHRyLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFNjcm9sbCB0byBwcmVzZXJ2ZSBjb3JyZWN0IGZvY3VzIChvbiBsYXJnZSBwYWdlcyB3aXRoIHNoYXJlZCBjb250ZW50IHVzZXIgY2FuIGdldFxyXG4gICAgICAgICAgICAgIC8vIGxvc3QgYWZ0ZXIgYW4gZWRpdGlvbilcclxuICAgICAgICAgICAgICAvLyAod2UgcXVldWUgYWZ0ZXIgdndyLnhzaG93IGJlY2F1c2Ugd2UgbmVlZCB0byBkbyBpdCBhZnRlciB0aGUgeHNob3cgZmluaXNoKVxyXG4gICAgICAgICAgICAgIHZ3ci5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNDbG9zZXN0ID0gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBjcnVkbCwgJ2ZvY3VzLWNsb3Nlc3QnKTtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c0VsZW1lbnQgPSBjcnVkbC5jbG9zZXN0KGZvY3VzQ2xvc2VzdCk7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiBubyBjbG9zZXN0LCBnZXQgdGhlIGNydWRsXHJcbiAgICAgICAgICAgICAgICBpZiAoZm9jdXNFbGVtZW50Lmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgZm9jdXNFbGVtZW50ID0gY3J1ZGw7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNNYXJnaW4gPSBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGNydWRsLCAnZm9jdXMtbWFyZ2luJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNEdXJhdGlvbiA9IGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgY3J1ZGwsICdmb2N1cy1kdXJhdGlvbicpO1xyXG5cclxuICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGZvY3VzRWxlbWVudCwgeyBtYXJnaW5Ub3A6IGZvY3VzTWFyZ2luLCBkdXJhdGlvbjogZm9jdXNEdXJhdGlvbiB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB2d3IuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAvLyB1c2VyIGNhbGxiYWNrOlxyXG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgKGFub3RoZXJPbkNvbXBsZXRlKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgIGFub3RoZXJPbkNvbXBsZXRlLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIE5PVEU6IEZpcnN0LCB3ZSBub3RpZnkgdGhlIGNoYW5nZXMtc2F2ZWQgYW5kIGV2ZW50LCB0aGlzIGxhc3QgYWxsb3dzXHJcbiAgICAgICAgICAvLyBjbGllbnQgc2NyaXB0cyB0byBkbyB0YXNrcyBqdXN0IGJlZm9yZSB0aGUgZWRpdG9yIGJlZ2lucyB0byBjbG9zZVxyXG4gICAgICAgICAgLy8gKGF2b2lkaW5nIHByb2JsZW1zIGxpa2Ugd2l0aCB0aGUgJ21vdmVGb2N1c1RvJyBub3QgYmVpbmcgcHJlY2lzZSBpZiB0aGVcclxuICAgICAgICAgIC8vIGFuaW1hdGlvbiBkdXJhdGlvbiBpcyB0aGUgc2FtZSBvbiBjbGllbnQgc2NyaXB0IGFuZCBoaWRlLWVkaXRvcikuXHJcbiAgICAgICAgICAvLyBUaGVuLCBlZGl0b3IgZ2V0cyBoaWRkZW5cclxuICAgICAgICAgIC8vIFRPRE86IFRoaXMgY2FuIGdldCBlbmhhbmNlZCB0byBhbGxvdyBsYXJnZXIgZHVyYXRpb25zIG9uIGNsaWVudC1zY3JpcHRzXHJcbiAgICAgICAgICAvLyB3aXRob3V0IGFmZmVjdCBtb3ZlRm9jdXNUbyBwYXNzaW5nIGluIHRoZSB0cmlnZ2VyIGFuIG9iamVjdCB0aGF0IGhvbGRzXHJcbiAgICAgICAgICAvLyBhIFByb21pc2UvRGVmZXJyZWQgdG8gYmUgc2V0IGJ5IGNsaWVudC1zY3JpcHQgYXMgJ2hpZGUtZWRpdG9yICZcclxuICAgICAgICAgIC8vIHZpZXdlci1zaG93IG11c3Qgc3RhcnQgd2hlbiB0aGlzIHByb21pc2UgZ2V0cyBmdWxsZmlsbGVkJywgYWxsb3dpbmcgdG9cclxuICAgICAgICAgIC8vIGhhdmUgYSBzZXF1ZW5jZSAoZmlyc3QgY2xpZW50LXNjcmlwdHMsIHRoZW4gaGlkZS1lZGl0b3IpLlxyXG5cclxuICAgICAgICAgIC8vIE1hcmsgZm9ybSBhcyBzYXZlZCB0byByZW1vdmUgdGhlICdoYXMtY2hhbmdlcycgbWFya1xyXG4gICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZHRyLmZpbmQoJ2Zvcm0nKS5nZXQoMCkpO1xyXG5cclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddKTtcclxuXHJcbiAgICAgICAgICAvLyBXZSBuZWVkIGEgY3VzdG9tIGNvbXBsZXRlIGNhbGxiYWNrLCBidXQgdG8gbm90IHJlcGxhY2UgdGhlIHVzZXIgY2FsbGJhY2ssIHdlXHJcbiAgICAgICAgICAvLyBjbG9uZSBmaXJzdCB0aGUgc2V0dGluZ3MgYW5kIHRoZW4gYXBwbHkgb3VyIGNhbGxiYWNrIHRoYXQgaW50ZXJuYWxseSB3aWxsIGNhbGxcclxuICAgICAgICAgIC8vIHRoZSB1c2VyIGNhbGxiYWNrIHByb3Blcmx5IChpZiBhbnkpXHJcbiAgICAgICAgICB2YXIgd2l0aGNhbGxiYWNrID0gJC5leHRlbmQodHJ1ZSwge30sIGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtZWRpdG9yJ10pO1xyXG4gICAgICAgICAgd2l0aGNhbGxiYWNrLmNvbXBsZXRlID0gb25jb21wbGV0ZSh3aXRoY2FsbGJhY2suY29tcGxldGUpO1xyXG4gICAgICAgICAgLy8gSGlkaW5nIGVkaXRvcjpcclxuICAgICAgICAgIGR0ci54aGlkZSh3aXRoY2FsbGJhY2spXHJcbiAgICAgICAgICAucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItaGlkZGVuJ10sIFtkdHJdKTtcclxuICAgICAgICAgICAgICBkdHIuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZHRyXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtY2FuY2VsJywgZmluaXNoRWRpdClcclxuICAgICAgICAub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCAnLmFqYXgtYm94JywgZmluaXNoRWRpdClcclxuICAgICAgICAvLyBBbiBldmVudGVkIG1ldGhvZDogdHJpZ2dlciB0aGlzIGV2ZW50IHRvIGV4ZWN1dGUgYSB2aWV3ZXIgcmVsb2FkOlxyXG4gICAgICAgIC5vbigncmVsb2FkTGlzdCcsICcqJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdndyLmZpbmQoJy5jcnVkbC1saXN0JykucmVsb2FkKHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0JywgJ2Zvcm0sIGZpZWxkc2V0JywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDAgfHwgZGF0YS5Db2RlID09IDUgfHwgZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyB2aWV3ZXIgYW5kIHJlbG9hZCBsaXN0OlxyXG4gICAgICAgICAgICB2d3IuZmluZCgnLmNydWRsLWxpc3QnKS5yZWxvYWQoeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gQSBzbWFsbCBkZWxheSB0byBsZXQgdXNlciB0byBzZWUgdGhlIG5ldyBtZXNzYWdlIG9uIGJ1dHRvbiBiZWZvcmVcclxuICAgICAgICAgIC8vIGhpZGUgaXQgKGJlY2F1c2UgaXMgaW5zaWRlIHRoZSBlZGl0b3IpXHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDUpXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmluaXNoRWRpdCwgMTAwMCk7XHJcblxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLGZpZWxkc2V0JywgZnVuY3Rpb24gKGpiLCBmb3JtLCBqeCkge1xyXG4gICAgICAgICAgLy8gRW1pdCB0aGUgJ2VkaXRvci1yZWFkeScgZXZlbnQgb24gZWRpdG9yIEh0bWwgYmVpbmcgcmVwbGFjZWRcclxuICAgICAgICAgIC8vIChmaXJzdCBsb2FkIG9yIG5leHQgbG9hZHMgYmVjYXVzZSBvZiBzZXJ2ZXItc2lkZSB2YWxpZGF0aW9uIGVycm9ycylcclxuICAgICAgICAgIC8vIHRvIGFsbG93IGxpc3RlbmVycyB0byBkbyBhbnkgd29yayBvdmVyIGl0cyAobmV3KSBET00gZWxlbWVudHMuXHJcbiAgICAgICAgICAvLyBUaGUgc2Vjb25kIGN1c3RvbSBwYXJhbWV0ZXIgcGFzc2VkIG1lYW5zIGlzIG1lYW4gdG9cclxuICAgICAgICAgIC8vIGRpc3Rpbmd1aXNoIHRoZSBmaXJzdCB0aW1lIGNvbnRlbnQgbG9hZCBhbmQgc3VjY2Vzc2l2ZSB1cGRhdGVzIChkdWUgdG8gdmFsaWRhdGlvbiBlcnJvcnMpLlxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBbZHRyLCBlZGl0b3JJbml0aWFsTG9hZF0pO1xyXG5cclxuICAgICAgICAgIC8vIE5leHQgdGltZXM6XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nLCB0cnVlKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gaW5zdGFuY2U7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuIiwiLyoqXHJcbiAgVGhpcyBtb2R1bGUgaGFzIHV0aWxpdGllcyB0byBjb252ZXJ0IGEgRGF0ZSBvYmplY3QgaW50b1xyXG4gIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvbGxvd2luZyBJU08tODYwMSBzcGVjaWZpY2F0aW9uLlxyXG4gIFxyXG4gIElOQ09NUExFVEUgQlVUIFVTRUZVTC5cclxuICBcclxuICBTdGFuZGFyZCByZWZlcnMgdG8gZm9ybWF0IHZhcmlhdGlvbnM6XHJcbiAgLSBiYXNpYzogbWluaW11bSBzZXBhcmF0b3JzXHJcbiAgLSBleHRlbmRlZDogYWxsIHNlcGFyYXRvcnMsIG1vcmUgcmVhZGFibGVcclxuICBCeSBkZWZhdWx0LCBhbGwgbWV0aG9kcyBwcmludHMgdGhlIGJhc2ljIGZvcm1hdCxcclxuICBleGNlcHRzIHRoZSBwYXJhbWV0ZXIgJ2V4dGVuZGVkJyBpcyBzZXQgdG8gdHJ1ZVxyXG5cclxuICBUT0RPOlxyXG4gIC0gVFo6IGFsbG93IGZvciBUaW1lIFpvbmUgc3VmZml4ZXMgKHBhcnNlIGFsbG93IGl0IGFuZCBcclxuICAgIGRldGVjdCBVVEMgYnV0IGRvIG5vdGhpbmcgd2l0aCBhbnkgdGltZSB6b25lIG9mZnNldCBkZXRlY3RlZClcclxuICAtIEZyYWN0aW9ucyBvZiBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLmRhdGVVVEMgPSBmdW5jdGlvbiBkYXRlVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIG0gPSAoZGF0ZS5nZXRVVENNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgZCA9IGRhdGUuZ2V0VVRDRGF0ZSgpLnRvU3RyaW5nKCksXHJcbiAgICAgIHkgPSBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgIGQgPSAnMCcgKyBkO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4geSArICctJyArIG0gKyAnLScgKyBkO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiB5ICsgbSArIGQ7XHJcbn07XHJcblxyXG5leHBvcnRzLmRhdGVMb2NhbCA9IGZ1bmN0aW9uIGRhdGVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBtID0gKGRhdGUuZ2V0TW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgIGQgPSBkYXRlLmdldERhdGUoKS50b1N0cmluZygpLFxyXG4gICAgICB5ID0gZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCk7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgIGQgPSAnMCcgKyBkO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4geSArICctJyArIG0gKyAnLScgKyBkO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiB5ICsgbSArIGQ7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycywgbWludXRlcyBhbmQgc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy50aW1lTG9jYWwgPSBmdW5jdGlvbiB0aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgcyA9IGRhdGUuZ2V0U2Vjb25kcygpLnRvU3RyaW5nKCksXHJcbiAgICAgIGhtID0gZXhwb3J0cy5zaG9ydFRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PSAxKVxyXG4gICAgcyA9ICcwJyArIHM7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBobSArICc6JyArIHM7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGhtICsgcztcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzLCBtaW51dGVzIGFuZCBzZWNvbmRzIFVUQ1xyXG4qKi9cclxuZXhwb3J0cy50aW1lVVRDID0gZnVuY3Rpb24gdGltZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBzID0gZGF0ZS5nZXRVVENTZWNvbmRzKCkudG9TdHJpbmcoKSxcclxuICAgICAgaG0gPSBleHBvcnRzLnNob3J0VGltZVVUQyhkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PSAxKVxyXG4gICAgcyA9ICcwJyArIHM7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBobSArICc6JyArIHM7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGhtICsgcztcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzIGFuZCBtaW51dGVzXHJcbioqL1xyXG5leHBvcnRzLnNob3J0VGltZUxvY2FsID0gZnVuY3Rpb24gc2hvcnRUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgaCA9IGRhdGUuZ2V0SG91cnMoKS50b1N0cmluZygpLFxyXG4gICAgICBtID0gZGF0ZS5nZXRNaW51dGVzKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKGgubGVuZ3RoID09IDEpXHJcbiAgICBoID0gJzAnICsgaDtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaCArICc6JyArIG07XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGggKyBtO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMgYW5kIG1pbnV0ZXMgVVRDXHJcbioqL1xyXG5leHBvcnRzLnNob3J0VGltZVVUQyA9IGZ1bmN0aW9uIHNob3J0VGltZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBoID0gZGF0ZS5nZXRVVENIb3VycygpLnRvU3RyaW5nKCksXHJcbiAgICAgIG0gPSBkYXRlLmdldFVUQ01pbnV0ZXMoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAoaC5sZW5ndGggPT0gMSlcclxuICAgIGggPSAnMCcgKyBoO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBoICsgJzonICsgbTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaCArIG07XHJcbn07XHJcblxyXG4vKipcclxuICBUT0RPOiBIb3VycywgbWludXRlcywgc2Vjb25kcyBhbmQgZnJhY3Rpb25zIG9mIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMubG9uZ1RpbWVMb2NhbCA9IGZ1bmN0aW9uIGxvbmdUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICAvL1RPRE9cclxufTtcclxuXHJcbi8qKlxyXG4gIFVUQyBEYXRlIGFuZCBUaW1lIHNlcGFyYXRlZCBieSBULlxyXG4gIFN0YW5kYXJkIGFsbG93cyBvbWl0IHRoZSBzZXBhcmF0b3IgYXMgZXhjZXB0aW9uYWwsIGJvdGggcGFydHMgYWdyZWVtZW50LCBjYXNlcztcclxuICBjYW4gYmUgZG9uZSBwYXNzaW5nIHRydWUgYXMgb2Ygb21pdFNlcGFyYXRvciBwYXJhbWV0ZXIsIGJ5IGRlZmF1bHQgZmFsc2UuXHJcbioqL1xyXG5leHBvcnRzLmRhdGV0aW1lTG9jYWwgPSBmdW5jdGlvbiBkYXRldGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkLCBvbWl0U2VwYXJhdG9yKSB7XHJcbiAgdmFyIGQgPSBleHBvcnRzLmRhdGVMb2NhbChkYXRlLCBleHRlbmRlZCksXHJcbiAgICAgIHQgPSBleHBvcnRzLnRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChvbWl0U2VwYXJhdG9yKVxyXG4gICAgcmV0dXJuIGQgKyB0O1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBkICsgJ1QnICsgdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIExvY2FsIERhdGUgYW5kIFRpbWUgc2VwYXJhdGVkIGJ5IFQuXHJcbiAgU3RhbmRhcmQgYWxsb3dzIG9taXQgdGhlIHNlcGFyYXRvciBhcyBleGNlcHRpb25hbCwgYm90aCBwYXJ0cyBhZ3JlZW1lbnQsIGNhc2VzO1xyXG4gIGNhbiBiZSBkb25lIHBhc3NpbmcgdHJ1ZSBhcyBvZiBvbWl0U2VwYXJhdG9yIHBhcmFtZXRlciwgYnkgZGVmYXVsdCBmYWxzZS5cclxuKiovXHJcbmV4cG9ydHMuZGF0ZXRpbWVVVEMgPSBmdW5jdGlvbiBkYXRldGltZVVUQyhkYXRlLCBleHRlbmRlZCwgb21pdFNlcGFyYXRvcikge1xyXG4gIHZhciBkID0gZXhwb3J0cy5kYXRlVVRDKGRhdGUsIGV4dGVuZGVkKSxcclxuICAgICAgdCA9IGV4cG9ydHMudGltZVVUQyhkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChvbWl0U2VwYXJhdG9yKVxyXG4gICAgcmV0dXJuIGQgKyB0O1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBkICsgJ1QnICsgdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIFBhcnNlIGEgc3RyaW5nIGludG8gYSBEYXRlIG9iamVjdCBpZiBpcyBhIHZhbGlkIElTTy04NjAxIGZvcm1hdC5cclxuICBQYXJzZSBzaW5nbGUgZGF0ZSwgc2luZ2xlIHRpbWUgb3IgZGF0ZS10aW1lIGZvcm1hdHMuXHJcbiAgSU1QT1JUQU5UOiBJdCBkb2VzIE5PVCBjb252ZXJ0IGJldHdlZW4gdGhlIGRhdGVzdHIgVGltZVpvbmUgYW5kIHRoZVxyXG4gIGxvY2FsIFRpbWVab25lIChlaXRoZXIgaXQgYWxsb3dzIGRhdGVzdHIgdG8gaW5jbHVkZWQgVGltZVpvbmUgaW5mb3JtYXRpb24pXHJcbiAgVE9ETzogT3B0aW9uYWwgVCBzZXBhcmF0b3IgaXMgbm90IGFsbG93ZWQuXHJcbiAgVE9ETzogTWlsbGlzZWNvbmRzL2ZyYWN0aW9ucyBvZiBzZWNvbmRzIG5vdCBzdXBwb3J0ZWRcclxuKiovXHJcbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiBwYXJzZShkYXRlc3RyKSB7XHJcbiAgdmFyIGR0ID0gZGF0ZXN0ci5zcGxpdCgnVCcpLFxyXG4gICAgZGF0ZSA9IGR0WzBdLFxyXG4gICAgdGltZSA9IGR0Lmxlbmd0aCA9PSAyID8gZHRbMV0gOiBudWxsO1xyXG5cclxuICBpZiAoZHQubGVuZ3RoID4gMilcclxuICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCBmb3JtYXRcIik7XHJcblxyXG4gIC8vIENoZWNrIGlmIGRhdGUgY29udGFpbnMgYSB0aW1lO1xyXG4gIC8vIGJlY2F1c2UgbWF5YmUgZGF0ZXN0ciBpcyBvbmx5IHRoZSB0aW1lIHBhcnRcclxuICBpZiAoLzp8XlxcZHs0LDZ9W15cXC1dKFxcLlxcZCopPyg/Olp8WytcXC1dLiopPyQvLnRlc3QoZGF0ZSkpIHtcclxuICAgIHRpbWUgPSBkYXRlO1xyXG4gICAgZGF0ZSA9IG51bGw7XHJcbiAgfVxyXG5cclxuICB2YXIgeSwgbSwgZCwgaCwgbW0sIHMsIHR6LCB1dGM7XHJcblxyXG4gIGlmIChkYXRlKSB7XHJcbiAgICB2YXIgZHBhcnRzID0gLyhcXGR7NH0pXFwtPyhcXGR7Mn0pXFwtPyhcXGR7Mn0pLy5leGVjKGRhdGUpO1xyXG4gICAgaWYgKCFkcGFydHMpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCBkYXRlIGZvcm1hdFwiKTtcclxuXHJcbiAgICB5ID0gZHBhcnRzWzFdO1xyXG4gICAgbSA9IGRwYXJ0c1syXTtcclxuICAgIGQgPSBkcGFydHNbM107XHJcbiAgfVxyXG5cclxuICBpZiAodGltZSkge1xyXG4gICAgdmFyIHRwYXJ0cyA9IC8oXFxkezJ9KTo/KFxcZHsyfSkoPzo6PyhcXGR7Mn0pKT8oWnxbK1xcLV0uKik/Ly5leGVjKHRpbWUpO1xyXG4gICAgaWYgKCF0cGFydHMpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCB0aW1lIGZvcm1hdFwiKTtcclxuXHJcbiAgICBoID0gdHBhcnRzWzFdO1xyXG4gICAgbW0gPSB0cGFydHNbMl07XHJcbiAgICBzID0gdHBhcnRzLmxlbmd0aCA+IDMgPyB0cGFydHNbM10gOiBudWxsO1xyXG4gICAgdHogPSB0cGFydHMubGVuZ3RoID4gNCA/IHRwYXJ0c1s0XSA6IG51bGw7XHJcbiAgICAvLyBEZXRlY3RzIGlmIGlzIGEgdGltZSBpbiBVVEM6XHJcbiAgICB1dGMgPSAvXlokL2kudGVzdCh0eik7XHJcbiAgfVxyXG5cclxuICAvLyBWYXIgdG8gaG9sZCB0aGUgcGFyc2VkIHZhbHVlLCB3ZSBzdGFydCB3aXRoIHRvZGF5LFxyXG4gIC8vIHRoYXQgd2lsbCBmaWxsIHRoZSBtaXNzaW5nIHBhcnRzXHJcbiAgdmFyIHBhcnNlZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICBpZiAoZGF0ZSkge1xyXG4gICAgLy8gVXBkYXRpbmcgdGhlIGRhdGUgb2JqZWN0IHdpdGggZWFjaCB5ZWFyLCBtb250aCBhbmQgZGF0ZS9kYXkgZGV0ZWN0ZWQ6XHJcbiAgICBpZiAodXRjKVxyXG4gICAgICBwYXJzZWREYXRlLnNldFVUQ0Z1bGxZZWFyKHksIG0sIGQpO1xyXG4gICAgZWxzZVxyXG4gICAgICBwYXJzZWREYXRlLnNldEZ1bGxZZWFyKHksIG0sIGQpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRpbWUpIHtcclxuICAgIGlmICh1dGMpXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0VVRDSG91cnMoaCwgbW0sIHMpO1xyXG4gICAgZWxzZVxyXG4gICAgICBwYXJzZWREYXRlLnNldEhvdXJzKGgsIG1tLCBzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gQSBkYXRlIHdpdGhvdXQgdGltZSBwYXJ0IG11c3QgYmUgY29uc2lkZXJlZCBhcyAwMDowMDowMCBpbnN0ZWFkIG9mIGN1cnJlbnQgdGltZVxyXG4gICAgcGFyc2VkRGF0ZS5zZXRIb3VycygwLCAwLCAwKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBwYXJzZWREYXRlO1xyXG59OyIsIi8qIERhdGUgcGlja2VyIGluaXRpYWxpemF0aW9uIGFuZCB1c2VcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBEYXRlUGlja2VyKCkge1xyXG4gICAgLy8gRGF0ZSBQaWNrZXJcclxuICAgICQuZGF0ZXBpY2tlci5zZXREZWZhdWx0cygkLmRhdGVwaWNrZXIucmVnaW9uYWxbJCgnaHRtbCcpLmF0dHIoJ2xhbmcnKV0pO1xyXG4gICAgJCgnLmRhdGUtcGljaycsIGRvY3VtZW50KS5kYXRlcGlja2VyKHtcclxuICAgICAgICBzaG93QW5pbTogJ2JsaW5kJ1xyXG4gICAgfSk7XHJcbiAgICBhcHBseURhdGVQaWNrZXIoKTtcclxufVxyXG5mdW5jdGlvbiBhcHBseURhdGVQaWNrZXIoZWxlbWVudCkge1xyXG4gICAgJChcIi5kYXRlLXBpY2tcIiwgZWxlbWVudCB8fCBkb2N1bWVudClcclxuICAgIC8vLnZhbChuZXcgRGF0ZSgpLmFzU3RyaW5nKCQuZGF0ZXBpY2tlci5fZGVmYXVsdHMuZGF0ZUZvcm1hdCkpXHJcbiAgICAuZGF0ZXBpY2tlcih7XHJcbiAgICAgICAgc2hvd0FuaW06IFwiYmxpbmRcIlxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXQ6IHNldHVwRGF0ZVBpY2tlcixcclxuICAgICAgICBhcHBseTogYXBwbHlEYXRlUGlja2VyXHJcbiAgICB9O1xyXG4iLCIvKiBGb3JtYXQgYSBkYXRlIGFzIFlZWVktTU0tREQgaW4gVVRDIGZvciBzYXZlIHVzXHJcbiAgICB0byBpbnRlcmNoYW5nZSB3aXRoIG90aGVyIG1vZHVsZXMgb3IgYXBwcy5cclxuKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcoZGF0ZSkge1xyXG4gICAgdmFyIG0gPSAoZGF0ZS5nZXRVVENNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgICBkID0gZGF0ZS5nZXRVVENEYXRlKCkudG9TdHJpbmcoKTtcclxuICAgIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgIG0gPSAnMCcgKyBtO1xyXG4gICAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICAgICAgZCA9ICcwJyArIGQ7XHJcbiAgICByZXR1cm4gZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCkgKyAnLScgKyBtICsgJy0nICsgZDtcclxufTsiLCIvKmdsb2JhbCB3aW5kb3cqL1xyXG4vKipcclxuICAgIFNpbXBsaWZpbmcgc29tZSB1c2VzIG9mIHRoZSBGYWNlYm9vayBBUElcclxuICAgIGFuZCB0aGUgbG9hZGluZyBvZiBpdHMgQVBJIHdpdGggYSAncmVhZHknIGZ1bmN0aW9uLlxyXG5cclxuICAgIE9mZmljaWFsIEFQSTogaHR0cHM6Ly9kZXZlbG9wZXJzLmZhY2Vib29rLmNvbS9kb2NzL2ZhY2Vib29rLWxvZ2luL2xvZ2luLWZsb3ctZm9yLXdlYi92Mi4xXHJcbioqL1xyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vLyBGYWNlYm9vayBBUEkgc2V0dGluZ3MgZ2F0aGVyZWQgZnJvbSB0aGUgY3VycmVudCBwYWdlXHJcbi8vIG9uIGZpcnN0IHVzZTpcclxudmFyIHNldHRpbmdzID0ge1xyXG4gICAgbGFuZ3VhZ2U6ICdlbi1VUycsXHJcbiAgICBhcHBJZDogbnVsbFxyXG59O1xyXG5cclxuLy8gUHJpdmF0ZSBBUEkgbG9hZGluZy9yZWFkeSBzdGF0dXNcclxudmFyIGFwaVN0YXR1cyA9IHtcclxuICAgIHJlYWR5OiBmYWxzZSxcclxuICAgIGxvYWRpbmc6IGZhbHNlLFxyXG4gICAgLy8gUHJpdmF0ZSBzdGF0aWMgY29sbGVjdGlvbiBvZiBjYWxsYmFja3MgcmVnaXN0ZXJlZFxyXG4gICAgc3RhY2s6IFtdXHJcbn07XHJcblxyXG4vKipcclxuICAgIFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgZXhlY3V0ZWQgd2hlbiB0aGVcclxuICAgIEZhY2Vib29rIEFQSSBpcyByZWFkeS5cclxuICAgIFRoZSBjYWxsYmFjayByZWNlaXZlcyBhcyB1bmlxdWUgcGFyYW1ldGVyXHJcbiAgICB0aGUgRmFjZWJvb2sgQVBJIG9iamVjdCAoJ0ZCJylcclxuKiovXHJcbmV4cG9ydHMucmVhZHkgPSBmdW5jdGlvbiBmYWNlYm9va1JlYWR5KHJlYWR5Q2FsbGJhY2spIHtcclxuICAgIFxyXG4gICAgYXBpU3RhdHVzLnN0YWNrLnB1c2gocmVhZHlDYWxsYmFjayk7XHJcblxyXG4gICAgaWYgKGFwaVN0YXR1cy5yZWFkeSkge1xyXG4gICAgICAgIC8vIERvdWJsZS1jaGVjayB0aGUgY2FsbGJhY2ssIHNpbmNlICdyZWFkJ1xyXG4gICAgICAgIC8vIGNvdWxkIGJlIGxvYWRlZCBqdXN0IHRvIGZvcmNlIHRoZSBBUEkgcHJlLWxvYWRcclxuICAgICAgICBpZiAodHlwZW9mKHJlYWR5Q2FsbGJhY2spID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICByZWFkeUNhbGxiYWNrKHdpbmRvdy5GQik7XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICghZmFjZWJvb2tSZWFkeS5pc0xvYWRpbmcpIHtcclxuICAgICAgICBhcGlTdGF0dXMubG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIEdldCBzZXR0aW5ncyBmcm9tIHBhZ2UgYXR0cmlidXRlc1xyXG4gICAgICAgIHNldHRpbmdzLmxhbmd1YWdlID0gJCgnW2RhdGEtZmFjZWJvb2stbGFuZ3VhZ2VdJykuZGF0YSgnZmFjZWJvb2stbGFuZ3VhZ2UnKTtcclxuICAgICAgICBzZXR0aW5ncy5hcHBJZCA9ICQoJ1tkYXRhLWZhY2Vib29rLWFwcGlkXScpLmRhdGEoJ2ZhY2Vib29rLWFwcGlkJyk7XHJcblxyXG4gICAgICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgICAgICAgc2NyaXB0czogWycvL2Nvbm5lY3QuZmFjZWJvb2submV0LycgKyBzZXR0aW5ncy5sYW5ndWFnZSArICcvYWxsLmpzJ10sXHJcbiAgICAgICAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBmdW5jdGlvbiAoKSB7IHJldHVybiAhIXdpbmRvdy5GQjsgfSxcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIEluaXRpYWxpemUgKEZhY2Vib29rIHJlZ2lzdGVycyBpdHNlbGYgYXMgZ2xvYmFsICdGQicpXHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuRkIuaW5pdCh7IGFwcElkOiBzZXR0aW5ncy5hcHBJZCwgc3RhdHVzOiB0cnVlLCBjb29raWU6IHRydWUsIHhmYm1sOiBmYWxzZSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJcyByZWFkeVxyXG4gICAgICAgICAgICAgICAgYXBpU3RhdHVzLnJlYWR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGFwaVN0YXR1cy5sb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRXhlY3V0ZSBjYWxsYmFja3MgaW4gdGhlIHN0YWNrOlxyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcGlTdGF0dXMuc3RhY2subGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcGlTdGF0dXMuc3RhY2tbaV0od2luZG93LkZCKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgICBSZXF1ZXN0IGEgRmFjZWJvb2sgTG9naW4sIGV4ZWN1dGluZyB0aGUgc3VjY2Vzc1xyXG4gICAgb3IgZXJyb3IgY2FsbGJhY2sgZGVwZW5kaW5nIG9uIHRoZSByZXNwb25zZS5cclxuICAgIFN1Y2Nlc3MgZ2V0cyB0aGUgJ2F1dGhSZXNwb25zZScgZ2l2ZW4gYnkgRmFjZWJvb2ssXHJcbiAgICBhbmQgZXJyb3IgdGhlIHdob2xlIHJlc3BvbnNlIG9iamVjdCwgYW5kIGJvdGhcclxuICAgIHRoZSBGQiBBUEkgYXMgc2Vjb25kIHBhcmFtZXRlci5cclxuKiovXHJcbmV4cG9ydHMubG9naW4gPSBmdW5jdGlvbiBmYWNlYm9va0xvZ2luKG9wdGlvbnMsIHN1Y2Nlc3MsIGVycm9yKSB7XHJcbiAgICAvLyBXaGVuIHRoZSBBUEkgaXMgcmVhZHlcclxuICAgIGV4cG9ydHMucmVhZHkoZnVuY3Rpb24gKEZCKSB7XHJcbiAgICAgICAgLy8gV2hlbiBGYWNlYm9vayBnaXZlcyBhIHJlc3BvbnNlIHRvIHRoZSBmb2xsb3dpbmdcclxuICAgICAgICAvLyBMb2dpbiBSZXF1ZXN0XHJcbiAgICAgICAgRkIubG9naW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgIC8vIHN0YXR1cz09Y29ubmVjdGVkIGlmIHRoZXJlIGlzIGFuIGF1dGhSZXNwb25zZVxyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuYXV0aFJlc3BvbnNlICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKHN1Y2Nlc3MpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzKHJlc3BvbnNlLmF1dGhSZXNwb25zZSwgRkIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiAoZXJyb3IpID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICBlcnJvcihyZXNwb25zZSwgRkIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgb3B0aW9ucyk7XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIEFuIGkxOG4gdXRpbGl0eSwgZ2V0IGEgdHJhbnNsYXRpb24gdGV4dCBieSBsb29raW5nIGZvciBzcGVjaWZpYyBlbGVtZW50cyBpbiB0aGUgaHRtbFxyXG53aXRoIHRoZSBuYW1lIGdpdmVuIGFzIGZpcnN0IHBhcmFtZW50ZXIgYW5kIGFwcGx5aW5nIHRoZSBnaXZlbiB2YWx1ZXMgb24gc2Vjb25kIGFuZCBcclxub3RoZXIgcGFyYW1ldGVycy5cclxuICAgIFRPRE86IFJFLUlNUExFTUVOVCBub3QgdXNpbmcgalF1ZXJ5IG5lbHNlIERPTSBlbGVtZW50cywgb3IgYWxtb3N0IG5vdCBlbGVtZW50cyBpbnNpZGUgYm9keVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbmZ1bmN0aW9uIGdldFRleHQoKSB7XHJcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuICAgIC8vIEdldCBrZXkgYW5kIHRyYW5zbGF0ZSBpdFxyXG4gICAgdmFyIGZvcm1hdHRlZCA9IGFyZ3NbMF07XHJcbiAgICB2YXIgdGV4dCA9ICQoJyNsY3Jlcy0nICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShmb3JtYXR0ZWQpKS50ZXh0KCk7XHJcbiAgICBpZiAodGV4dClcclxuICAgICAgICBmb3JtYXR0ZWQgPSB0ZXh0O1xyXG4gICAgLy8gQXBwbHkgZm9ybWF0IHRvIHRoZSB0ZXh0IHdpdGggYWRkaXRpb25hbCBwYXJhbWV0ZXJzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXFxcXHsnICsgaSArICdcXFxcfScsICdnaScpO1xyXG4gICAgICAgIGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5yZXBsYWNlKHJlZ2V4cCwgYXJnc1tpICsgMV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZvcm1hdHRlZDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnZXRUZXh0OyIsIi8qKiBSZXR1cm5zIHRoZSBwYXRoIHRvIHRoZSBnaXZlbiBlbGVtZW50IGluIFhQYXRoIGNvbnZlbnRpb25cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBnZXRYUGF0aChlbGVtZW50KSB7XHJcbiAgICBpZiAoZWxlbWVudCAmJiBlbGVtZW50LmlkKVxyXG4gICAgICAgIHJldHVybiAnLy8qW0BpZD1cIicgKyBlbGVtZW50LmlkICsgJ1wiXSc7XHJcbiAgICB2YXIgeHBhdGggPSAnJztcclxuICAgIGZvciAoOyBlbGVtZW50ICYmIGVsZW1lbnQubm9kZVR5cGUgPT0gMTsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgIHZhciBpZCA9ICQoZWxlbWVudC5wYXJlbnROb2RlKS5jaGlsZHJlbihlbGVtZW50LnRhZ05hbWUpLmluZGV4KGVsZW1lbnQpICsgMTtcclxuICAgICAgICBpZCA9IChpZCA+IDEgPyAnWycgKyBpZCArICddJyA6ICcnKTtcclxuICAgICAgICB4cGF0aCA9ICcvJyArIGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpICsgaWQgKyB4cGF0aDtcclxuICAgIH1cclxuICAgIHJldHVybiB4cGF0aDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnZXRYUGF0aDtcclxuIiwiLy8gSXQgZXhlY3V0ZXMgdGhlIGdpdmVuICdyZWFkeScgZnVuY3Rpb24gYXMgcGFyYW1ldGVyIHdoZW5cclxuLy8gbWFwIGVudmlyb25tZW50IGlzIHJlYWR5ICh3aGVuIGdvb2dsZSBtYXBzIGFwaSBhbmQgc2NyaXB0IGlzXHJcbi8vIGxvYWRlZCBhbmQgcmVhZHkgdG8gdXNlLCBvciBpbm1lZGlhdGVseSBpZiBpcyBhbHJlYWR5IGxvYWRlZCkuXHJcblxyXG52YXIgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcclxuXHJcbi8vIFByaXZhdGUgc3RhdGljIGNvbGxlY3Rpb24gb2YgY2FsbGJhY2tzIHJlZ2lzdGVyZWRcclxudmFyIHN0YWNrID0gW107XHJcblxyXG52YXIgZ29vZ2xlTWFwUmVhZHkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdvb2dsZU1hcFJlYWR5KHJlYWR5KSB7XHJcbiAgICBzdGFjay5wdXNoKHJlYWR5KTtcclxuXHJcbiAgICBpZiAoZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSlcclxuICAgICAgICByZWFkeSgpO1xyXG4gICAgZWxzZSBpZiAoIWdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZykge1xyXG4gICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IHRydWU7XHJcbiAgICAgICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICAgICAgICBzY3JpcHRzOiBbJ2h0dHBzOi8vd3d3Lmdvb2dsZS5jb20vanNhcGknXSxcclxuICAgICAgICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHsgcmV0dXJuICEhd2luZG93Lmdvb2dsZTsgfSxcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGdvb2dsZS5sb2FkKCdtYXBzJywgJzMuMTYnLFxyXG4gICAgICAgICAgICAgICAgICAgIHsgb3RoZXJfcGFyYW1zOiAnc2Vuc29yPWZhbHNlJywgY2FsbGJhY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tbaV0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyBVdGlsaXR5IHRvIGZvcmNlIHRoZSByZWZyZXNoIG9mIG1hcHMgdGhhdCBzb2x2ZSB0aGUgcHJvYmxlbSB3aXRoIGJhZC1zaXplZCBtYXAgYXJlYVxyXG5nb29nbGVNYXBSZWFkeS5yZWZyZXNoTWFwID0gZnVuY3Rpb24gcmVmcmVzaE1hcHMobWFwKSB7XHJcbiAgICBnb29nbGVNYXBSZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gRG9uJ3QgZm9yZ2V0IHRoZSBjZW50ZXIhXHJcbiAgICAgICAgdmFyIGNlbnRlciA9IG1hcC5nZXRDZW50ZXIoKTtcclxuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lck9uY2UobWFwLCAncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBSZXN0b3JlIGNlbnRlclxyXG4gICAgICAgICAgICBpZiAoY2VudGVyKVxyXG4gICAgICAgICAgICAgICAgbWFwLnNldENlbnRlcihjZW50ZXIpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIobWFwLCAncmVzaXplJyk7XHJcbiAgICB9KTtcclxufTtcclxuIiwiLyogR1VJRCBHZW5lcmF0b3JcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ3VpZEdlbmVyYXRvcigpIHtcclxuICAgIHZhciBTNCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCgoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMCkgfCAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiAoUzQoKSArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBTNCgpICsgUzQoKSk7XHJcbn07IiwiLyoqXHJcbiAgICBHZW5lcmljIHNjcmlwdCBmb3IgZmllbGRzZXRzIHdpdGggY2xhc3MgLmhhcy1jb25maXJtLCBhbGxvd2luZyBzaG93XHJcbiAgICB0aGUgY29udGVudCBvbmx5IGlmIHRoZSBtYWluIGNvbmZpcm0gZmllbGRzIGhhdmUgJ3llcycgc2VsZWN0ZWQuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIGRlZmF1bHRTZWxlY3RvciA9ICdmaWVsZHNldC5oYXMtY29uZmlybSA+IC5jb25maXJtIGlucHV0JztcclxuXHJcbmZ1bmN0aW9uIG9uY2hhbmdlKCkge1xyXG4gICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGZzID0gdC5jbG9zZXN0KCdmaWVsZHNldCcpO1xyXG4gICAgaWYgKHQuaXMoJzpjaGVja2VkJykpXHJcbiAgICAgICAgaWYgKHQudmFsKCkgPT0gJ3llcycgfHwgdC52YWwoKSA9PSAnVHJ1ZScpXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKCdjb25maXJtZWQtbm8nKS5hZGRDbGFzcygnY29uZmlybWVkLXllcycpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3MoJ2NvbmZpcm1lZC15ZXMnKS5hZGRDbGFzcygnY29uZmlybWVkLW5vJyk7XHJcbn1cclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgZGVmYXVsdFNlbGVjdG9yO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCBzZWxlY3Rvciwgb25jaGFuZ2UpO1xyXG4gICAgLy8gUGVyZm9ybXMgZmlyc3QgY2hlY2s6XHJcbiAgICAkKHNlbGVjdG9yKS5jaGFuZ2UoKTtcclxufTtcclxuXHJcbmV4cG9ydHMub2ZmID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IGRlZmF1bHRTZWxlY3RvcjtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2NoYW5nZScsIHNlbGVjdG9yKTtcclxufTsiLCIvKiBJbnRlcm5hemlvbmFsaXphdGlvbiBVdGlsaXRpZXNcclxuICovXHJcbnZhciBpMThuID0ge307XHJcbmkxOG4uZGlzdGFuY2VVbml0cyA9IHtcclxuICAgICdFUyc6ICdrbScsXHJcbiAgICAnVVMnOiAnbWlsZXMnXHJcbn07XHJcbmkxOG4ubnVtZXJpY01pbGVzU2VwYXJhdG9yID0ge1xyXG4gICAgJ2VzLUVTJzogJy4nLFxyXG4gICAgJ2VzLVVTJzogJy4nLFxyXG4gICAgJ2VuLVVTJzogJywnLFxyXG4gICAgJ2VuLUVTJzogJywnXHJcbn07XHJcbmkxOG4ubnVtZXJpY0RlY2ltYWxTZXBhcmF0b3IgPSB7XHJcbiAgICAnZXMtRVMnOiAnLCcsXHJcbiAgICAnZXMtVVMnOiAnLCcsXHJcbiAgICAnZW4tVVMnOiAnLicsXHJcbiAgICAnZW4tRVMnOiAnLidcclxufTtcclxuaTE4bi5tb25leVN5bWJvbFByZWZpeCA9IHtcclxuICAgICdFUyc6ICcnLFxyXG4gICAgJ1VTJzogJyQnXHJcbn07XHJcbmkxOG4ubW9uZXlTeW1ib2xTdWZpeCA9IHtcclxuICAgICdFUyc6ICfigqwnLFxyXG4gICAgJ1VTJzogJydcclxufTtcclxuaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSA9IGZ1bmN0aW9uIGdldEN1cnJlbnRDdWx0dXJlKCkge1xyXG4gICAgdmFyIGMgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKTtcclxuICAgIHZhciBzID0gYy5zcGxpdCgnLScpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdWx0dXJlOiBjLFxyXG4gICAgICAgIGxhbmd1YWdlOiBzWzBdLFxyXG4gICAgICAgIGNvdW50cnk6IHNbMV1cclxuICAgIH07XHJcbn07XHJcbmkxOG4uY29udmVydE1pbGVzS20gPSBmdW5jdGlvbiBjb252ZXJ0TWlsZXNLbShxLCB1bml0KSB7XHJcbiAgICB2YXIgTUlMRVNfVE9fS00gPSAxLjYwOTtcclxuICAgIGlmICh1bml0ID09ICdtaWxlcycpXHJcbiAgICAgICAgcmV0dXJuIE1JTEVTX1RPX0tNICogcTtcclxuICAgIGVsc2UgaWYgKHVuaXQgPT0gJ2ttJylcclxuICAgICAgICByZXR1cm4gcSAvIE1JTEVTX1RPX0tNO1xyXG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5sb2cpIGNvbnNvbGUubG9nKCdjb252ZXJ0TWlsZXNLbTogVW5yZWNvZ25pemVkIHVuaXQgJyArIHVuaXQpO1xyXG4gICAgcmV0dXJuIDA7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGkxOG47IiwiLyogUmV0dXJucyB0cnVlIHdoZW4gc3RyIGlzXHJcbi0gbnVsbFxyXG4tIGVtcHR5IHN0cmluZ1xyXG4tIG9ubHkgd2hpdGUgc3BhY2VzIHN0cmluZ1xyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzRW1wdHlTdHJpbmcoc3RyKSB7XHJcbiAgICByZXR1cm4gISgvXFxTL2cudGVzdChzdHIgfHwgXCJcIikpO1xyXG59OyIsIi8qKiBBcyB0aGUgJ2lzJyBqUXVlcnkgbWV0aG9kLCBidXQgY2hlY2tpbmcgQHNlbGVjdG9yIGluIGFsbCBlbGVtZW50c1xyXG4qIEBtb2RpZmllciB2YWx1ZXM6XHJcbiogLSAnYWxsJzogYWxsIGVsZW1lbnRzIG11c3QgbWF0Y2ggc2VsZWN0b3IgdG8gcmV0dXJuIHRydWVcclxuKiAtICdhbG1vc3Qtb25lJzogYWxtb3N0IG9uZSBlbGVtZW50IG11c3QgbWF0Y2hcclxuKiAtICdwZXJjZW50YWdlJzogcmV0dXJucyBwZXJjZW50YWdlIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG1hdGNoIHNlbGVjdG9yICgwLTEwMClcclxuKiAtICdzdW1tYXJ5JzogcmV0dXJucyB0aGUgb2JqZWN0IHsgeWVzOiBudW1iZXIsIG5vOiBudW1iZXIsIHBlcmNlbnRhZ2U6IG51bWJlciwgdG90YWw6IG51bWJlciB9XHJcbiogLSB7anVzdDogYSBudW1iZXJ9OiBleGFjdCBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbiogLSB7YWxtb3N0OiBhIG51bWJlcn06IG1pbmltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qIC0ge3VudGlsOiBhIG51bWJlcn06IG1heGltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uYXJlID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBtb2RpZmllcikge1xyXG4gICAgbW9kaWZpZXIgPSBtb2RpZmllciB8fCAnYWxsJztcclxuICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmlzKHNlbGVjdG9yKSlcclxuICAgICAgICAgICAgY291bnQrKztcclxuICAgIH0pO1xyXG4gICAgc3dpdGNoIChtb2RpZmllcikge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCA9PSBjb3VudDtcclxuICAgICAgICBjYXNlICdhbG1vc3Qtb25lJzpcclxuICAgICAgICAgICAgcmV0dXJuIGNvdW50ID4gMDtcclxuICAgICAgICBjYXNlICdwZXJjZW50YWdlJzpcclxuICAgICAgICAgICAgcmV0dXJuIGNvdW50IC8gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgY2FzZSAnc3VtbWFyeSc6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB5ZXM6IGNvdW50LFxyXG4gICAgICAgICAgICAgICAgbm86IHRoaXMubGVuZ3RoIC0gY291bnQsXHJcbiAgICAgICAgICAgICAgICBwZXJjZW50YWdlOiBjb3VudCAvIHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgdG90YWw6IHRoaXMubGVuZ3RoXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCdqdXN0JyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuanVzdCAhPSBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ2FsbW9zdCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLmFsbW9zdCA+IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICgndW50aWwnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci51bnRpbCA8IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICB9XHJcbn07IiwiLyoqID09PT09PT09PT09PT09PT09PT1cclxuRXh0ZW5zaW9uIGpxdWVyeTogJ2JvdW5kcydcclxuUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgY29tYmluZWQgYm91bmRzIGZvciBhbGwgXHJcbmVsZW1lbnRzIGluIHRoZSBjb2xsZWN0aW9uXHJcbiovXHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgalF1ZXJ5LmZuLmJvdW5kcyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHtcclxuICAgICAgaW5jbHVkZUJvcmRlcjogZmFsc2UsXHJcbiAgICAgIGluY2x1ZGVNYXJnaW46IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgIHZhciBib3VuZHMgPSB7XHJcbiAgICAgIGxlZnQ6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcclxuICAgICAgdG9wOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHJpZ2h0OiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIGJvdHRvbTogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLFxyXG4gICAgICB3aWR0aDogTnVtYmVyLk5hTixcclxuICAgICAgaGVpZ2h0OiBOdW1iZXIuTmFOXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBmbldpZHRoID0gb3B0aW9ucy5pbmNsdWRlQm9yZGVyIHx8IG9wdGlvbnMuaW5jbHVkZU1hcmdpbiA/IFxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLm91dGVyV2lkdGguY2FsbChlbCwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luKTsgfSA6XHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ud2lkdGguY2FsbChlbCk7IH07XHJcbiAgICB2YXIgZm5IZWlnaHQgPSBvcHRpb25zLmluY2x1ZGVCb3JkZXIgfHwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luID8gXHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ub3V0ZXJIZWlnaHQuY2FsbChlbCwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luKTsgfSA6XHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4uaGVpZ2h0LmNhbGwoZWwpOyB9O1xyXG5cclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoaSwgZWwpIHtcclxuICAgICAgdmFyIGVsUSA9ICQoZWwpO1xyXG4gICAgICB2YXIgb2ZmID0gZWxRLm9mZnNldCgpO1xyXG4gICAgICBvZmYucmlnaHQgPSBvZmYubGVmdCArIGZuV2lkdGgoJChlbFEpKTtcclxuICAgICAgb2ZmLmJvdHRvbSA9IG9mZi50b3AgKyBmbkhlaWdodCgkKGVsUSkpO1xyXG5cclxuICAgICAgaWYgKG9mZi5sZWZ0IDwgYm91bmRzLmxlZnQpXHJcbiAgICAgICAgYm91bmRzLmxlZnQgPSBvZmYubGVmdDtcclxuXHJcbiAgICAgIGlmIChvZmYudG9wIDwgYm91bmRzLnRvcClcclxuICAgICAgICBib3VuZHMudG9wID0gb2ZmLnRvcDtcclxuXHJcbiAgICAgIGlmIChvZmYucmlnaHQgPiBib3VuZHMucmlnaHQpXHJcbiAgICAgICAgYm91bmRzLnJpZ2h0ID0gb2ZmLnJpZ2h0O1xyXG5cclxuICAgICAgaWYgKG9mZi5ib3R0b20gPiBib3VuZHMuYm90dG9tKVxyXG4gICAgICAgIGJvdW5kcy5ib3R0b20gPSBvZmYuYm90dG9tO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYm91bmRzLndpZHRoID0gYm91bmRzLnJpZ2h0IC0gYm91bmRzLmxlZnQ7XHJcbiAgICBib3VuZHMuaGVpZ2h0ID0gYm91bmRzLmJvdHRvbSAtIGJvdW5kcy50b3A7XHJcbiAgICByZXR1cm4gYm91bmRzO1xyXG4gIH07XHJcbn0pKCk7IiwiLyoqXHJcbiogSGFzU2Nyb2xsQmFyIHJldHVybnMgYW4gb2JqZWN0IHdpdGggYm9vbCBwcm9wZXJ0aWVzICd2ZXJ0aWNhbCcgYW5kICdob3Jpem9udGFsJ1xyXG4qIHNheWluZyBpZiB0aGUgZWxlbWVudCBoYXMgbmVlZCBvZiBzY3JvbGxiYXJzIGZvciBlYWNoIGRpbWVuc2lvbiBvciBub3QgKGVsZW1lbnRcclxuKiBjYW4gbmVlZCBzY3JvbGxiYXJzIGFuZCBzdGlsbCBub3QgYmVpbmcgc2hvd2VkIGJlY2F1c2UgdGhlIGNzcy1vdmVybGZsb3cgcHJvcGVydHlcclxuKiBiZWluZyBzZXQgYXMgJ2hpZGRlbicsIGJ1dCBzdGlsbCB3ZSBrbm93IHRoYXQgdGhlIGVsZW1lbnQgcmVxdWlyZXMgaXQgYW5kIGl0c1xyXG4qIGNvbnRlbnQgaXMgbm90IGJlaW5nIGZ1bGx5IGRpc3BsYXllZCkuXHJcbiogQGV4dHJhZ2FwLCBkZWZhdWx0cyB0byB7eDowLHk6MH0sIGxldHMgc3BlY2lmeSBhbiBleHRyYSBzaXplIGluIHBpeGVscyBmb3IgZWFjaCBkaW1lbnNpb24gdGhhdCBhbHRlciB0aGUgcmVhbCBjaGVjayxcclxuKiByZXN1bHRpbmcgaW4gYSBmYWtlIHJlc3VsdCB0aGF0IGNhbiBiZSBpbnRlcmVzdGluZyB0byBkaXNjYXJkIHNvbWUgcGl4ZWxzIG9mIGV4Y2Vzc1xyXG4qIHNpemUgKG5lZ2F0aXZlIHZhbHVlcykgb3IgZXhhZ2VyYXRlIHRoZSByZWFsIHVzZWQgc2l6ZSB3aXRoIHRoYXQgZXh0cmEgcGl4ZWxzIChwb3NpdGl2ZSB2YWx1ZXMpLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uaGFzU2Nyb2xsQmFyID0gZnVuY3Rpb24gKGV4dHJhZ2FwKSB7XHJcbiAgICBleHRyYWdhcCA9ICQuZXh0ZW5kKHtcclxuICAgICAgICB4OiAwLFxyXG4gICAgICAgIHk6IDBcclxuICAgIH0sIGV4dHJhZ2FwKTtcclxuICAgIGlmICghdGhpcyB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHsgdmVydGljYWw6IGZhbHNlLCBob3Jpem9udGFsOiBmYWxzZSB9O1xyXG4gICAgLy9ub3RlOiBjbGllbnRIZWlnaHQ9IGhlaWdodCBvZiBob2xkZXJcclxuICAgIC8vc2Nyb2xsSGVpZ2h0PSB3ZSBoYXZlIGNvbnRlbnQgdGlsbCB0aGlzIGhlaWdodFxyXG4gICAgdmFyIHQgPSB0aGlzLmdldCgwKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdmVydGljYWw6IHRoaXMub3V0ZXJIZWlnaHQoZmFsc2UpIDwgKHQuc2Nyb2xsSGVpZ2h0ICsgZXh0cmFnYXAueSksXHJcbiAgICAgICAgaG9yaXpvbnRhbDogdGhpcy5vdXRlcldpZHRoKGZhbHNlKSA8ICh0LnNjcm9sbFdpZHRoICsgZXh0cmFnYXAueClcclxuICAgIH07XHJcbn07IiwiLyoqIENoZWNrcyBpZiBjdXJyZW50IGVsZW1lbnQgb3Igb25lIG9mIHRoZSBjdXJyZW50IHNldCBvZiBlbGVtZW50cyBoYXNcclxuYSBwYXJlbnQgdGhhdCBtYXRjaCB0aGUgZWxlbWVudCBvciBleHByZXNzaW9uIGdpdmVuIGFzIGZpcnN0IHBhcmFtZXRlclxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uaXNDaGlsZE9mID0gZnVuY3Rpb24galF1ZXJ5X3BsdWdpbl9pc0NoaWxkT2YoZXhwKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnRzKCkuZmlsdGVyKGV4cCkubGVuZ3RoID4gMDtcclxufTsiLCIvKipcclxuICAgIEdldHMgdGhlIGh0bWwgc3RyaW5nIG9mIHRoZSBmaXJzdCBlbGVtZW50IGFuZCBhbGwgaXRzIGNvbnRlbnQuXHJcbiAgICBUaGUgJ2h0bWwnIG1ldGhvZCBvbmx5IHJldHJpZXZlcyB0aGUgaHRtbCBzdHJpbmcgb2YgdGhlIGNvbnRlbnQsIG5vdCB0aGUgZWxlbWVudCBpdHNlbGYuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5vdXRlckh0bWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRoaXMgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAnJztcclxuICAgIHZhciBlbCA9IHRoaXMuZ2V0KDApO1xyXG4gICAgdmFyIGh0bWwgPSAnJztcclxuICAgIGlmIChlbC5vdXRlckhUTUwpXHJcbiAgICAgICAgaHRtbCA9IGVsLm91dGVySFRNTDtcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGh0bWwgPSB0aGlzLndyYXBBbGwoJzxkaXY+PC9kaXY+JykucGFyZW50KCkuaHRtbCgpO1xyXG4gICAgICAgIHRoaXMudW53cmFwKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaHRtbDtcclxufTsiLCIvKipcclxuICAgIFVzaW5nIHRoZSBhdHRyaWJ1dGUgZGF0YS1zb3VyY2UtdXJsIG9uIGFueSBIVE1MIGVsZW1lbnQsXHJcbiAgICB0aGlzIGFsbG93cyByZWxvYWQgaXRzIGNvbnRlbnQgcGVyZm9ybWluZyBhbiBBSkFYIG9wZXJhdGlvblxyXG4gICAgb24gdGhlIGdpdmVuIFVSTCBvciB0aGUgb25lIGluIHRoZSBhdHRyaWJ1dGU7IHRoZSBlbmQtcG9pbnRcclxuICAgIG11c3QgcmV0dXJuIHRleHQvaHRtbCBjb250ZW50LlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIERlZmF1bHQgc3VjY2VzcyBjYWxsYmFjayBhbmQgcHVibGljIHV0aWxpdHksIGJhc2ljIGhvdy10byByZXBsYWNlIGVsZW1lbnQgY29udGVudCB3aXRoIGZldGNoZWQgaHRtbFxyXG5mdW5jdGlvbiB1cGRhdGVFbGVtZW50KGh0bWxDb250ZW50LCBjb250ZXh0KSB7XHJcbiAgICBjb250ZXh0ID0gJC5pc1BsYWluT2JqZWN0KGNvbnRleHQpICYmIGNvbnRleHQgPyBjb250ZXh0IDogdGhpcztcclxuXHJcbiAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgIC8vIEF2b2lkIGVtcHR5IGRvY3VtZW50cyBiZWluZyBwYXJzZWQgKHJhaXNlIGVycm9yKVxyXG4gICAgaHRtbENvbnRlbnQgPSAkLnRyaW0oaHRtbENvbnRlbnQpO1xyXG4gICAgaWYgKGh0bWxDb250ZW50KSB7XHJcbiAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhbiBlbXB0eSBkb2N1bWVudCBvciBtYWxmb3JtZWQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoaHRtbENvbnRlbnQpKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICBuZXdodG1sID0gJChodG1sQ29udGVudCk7XHJcbiAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBlbGVtZW50ID0gY29udGV4dC5lbGVtZW50O1xyXG4gICAgaWYgKGNvbnRleHQub3B0aW9ucy5tb2RlID09ICdyZXBsYWNlLW1lJylcclxuICAgICAgICBlbGVtZW50LnJlcGxhY2VXaXRoKG5ld2h0bWwpO1xyXG4gICAgZWxzZSAvLyAncmVwbGFjZS1jb250ZW50J1xyXG4gICAgICAgIGVsZW1lbnQuaHRtbChuZXdodG1sKTtcclxuXHJcbiAgICByZXR1cm4gY29udGV4dDtcclxufVxyXG5cclxuLy8gRGVmYXVsdCBjb21wbGV0ZSBjYWxsYmFjayBhbmQgcHVibGljIHV0aWxpdHlcclxuZnVuY3Rpb24gc3RvcExvYWRpbmdTcGlubmVyKCkge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuZWxlbWVudCk7XHJcbn1cclxuXHJcbi8vIERlZmF1bHRzXHJcbnZhciBkZWZhdWx0cyA9IHtcclxuICAgIHVybDogbnVsbCxcclxuICAgIHN1Y2Nlc3M6IFt1cGRhdGVFbGVtZW50XSxcclxuICAgIGVycm9yOiBbXSxcclxuICAgIGNvbXBsZXRlOiBbc3RvcExvYWRpbmdTcGlubmVyXSxcclxuICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgIG1vZGU6ICdyZXBsYWNlLWNvbnRlbnQnLFxyXG4gICAgbG9hZGluZzoge1xyXG4gICAgICAgIGxvY2tFbGVtZW50OiB0cnVlLFxyXG4gICAgICAgIGxvY2tPcHRpb25zOiB7fSxcclxuICAgICAgICBtZXNzYWdlOiBudWxsLFxyXG4gICAgICAgIHNob3dMb2FkaW5nSW5kaWNhdG9yOiB0cnVlLFxyXG4gICAgICAgIGRlbGF5OiAwXHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiBSZWxvYWQgbWV0aG9kICovXHJcbnZhciByZWxvYWQgPSAkLmZuLnJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIE9wdGlvbnMgZnJvbSBkZWZhdWx0cyAoaW50ZXJuYWwgYW5kIHB1YmxpYylcclxuICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCByZWxvYWQuZGVmYXVsdHMpO1xyXG4gICAgLy8gSWYgb3B0aW9ucyBvYmplY3QgaXMgcGFzc2VkIGFzIHVuaXF1ZSBwYXJhbWV0ZXJcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEgJiYgJC5pc1BsYWluT2JqZWN0KGFyZ3VtZW50c1swXSkpIHtcclxuICAgICAgICAvLyBNZXJnZSBvcHRpb25zOlxyXG4gICAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMsIGFyZ3VtZW50c1swXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIENvbW1vbiBvdmVybG9hZDogbmV3LXVybCBhbmQgY29tcGxldGUgY2FsbGJhY2ssIGJvdGggb3B0aW9uYWxzXHJcbiAgICAgICAgb3B0aW9ucy51cmwgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IG51bGw7XHJcbiAgICAgICAgb3B0aW9ucy5jb21wbGV0ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnVybCkge1xyXG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG9wdGlvbnMudXJsKSlcclxuICAgICAgICAgICAgLy8gRnVuY3Rpb24gcGFyYW1zOiBjdXJyZW50UmVsb2FkVXJsLCBkZWZhdWx0UmVsb2FkVXJsXHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdzb3VyY2UtdXJsJywgJC5wcm94eShvcHRpb25zLnVybCwgdGhpcykoJHQuZGF0YSgnc291cmNlLXVybCcpLCAkdC5hdHRyKCdkYXRhLXNvdXJjZS11cmwnKSkpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdzb3VyY2UtdXJsJywgb3B0aW9ucy51cmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdXJsID0gJHQuZGF0YSgnc291cmNlLXVybCcpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbHJlYWR5IGJlaW5nIHJlbG9hZGVkLCB0byBjYW5jZWwgcHJldmlvdXMgYXR0ZW1wdFxyXG4gICAgICAgIHZhciBqcSA9ICR0LmRhdGEoJ2lzUmVsb2FkaW5nJyk7XHJcbiAgICAgICAgaWYgKGpxKSB7XHJcbiAgICAgICAgICAgIGlmIChqcS51cmwgPT0gdXJsKVxyXG4gICAgICAgICAgICAgICAgLy8gSXMgdGhlIHNhbWUgdXJsLCBkbyBub3QgYWJvcnQgYmVjYXVzZSBpcyB0aGUgc2FtZSByZXN1bHQgYmVpbmcgcmV0cmlldmVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGpxLmFib3J0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPcHRpb25hbCBkYXRhIHBhcmFtZXRlciAncmVsb2FkLW1vZGUnIGFjY2VwdHMgdmFsdWVzOiBcclxuICAgICAgICAvLyAtICdyZXBsYWNlLW1lJzogVXNlIGh0bWwgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IHJlbG9hZGVkIGVsZW1lbnQgKGFrYTogcmVwbGFjZVdpdGgoKSlcclxuICAgICAgICAvLyAtICdyZXBsYWNlLWNvbnRlbnQnOiAoZGVmYXVsdCkgSHRtbCByZXR1cm5lZCByZXBsYWNlIGN1cnJlbnQgZWxlbWVudCBjb250ZW50IChha2E6IGh0bWwoKSlcclxuICAgICAgICBvcHRpb25zLm1vZGUgPSAkdC5kYXRhKCdyZWxvYWQtbW9kZScpIHx8IG9wdGlvbnMubW9kZTtcclxuXHJcbiAgICAgICAgaWYgKHVybCkge1xyXG5cclxuICAgICAgICAgICAgLy8gTG9hZGluZywgd2l0aCBkZWxheVxyXG4gICAgICAgICAgICB2YXIgbG9hZGluZ3RpbWVyID0gb3B0aW9ucy5sb2FkaW5nLmxvY2tFbGVtZW50ID9cclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0aW5nIGNvbnRlbnQgdXNpbmcgYSBmYWtlIHRlbXAgcGFyZW50IGVsZW1lbnQgdG8gcHJlbG9hZCBpbWFnZSBhbmQgdG8gZ2V0IHJlYWwgbWVzc2FnZSB3aWR0aDpcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG9hZGluZ2NvbnRlbnQgPSAkKCc8ZGl2Lz4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgPyAkKCc8ZGl2IGNsYXNzPVwibG9hZGluZy1tZXNzYWdlXCIvPicpLmFwcGVuZChvcHRpb25zLmxvYWRpbmcubWVzc2FnZSkgOiBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLnNob3dMb2FkaW5nSW5kaWNhdG9yID8gb3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgOiBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nY29udGVudC5jc3MoeyBwb3NpdGlvbjogJ2Fic29sdXRlJywgbGVmdDogLTk5OTk5IH0pLmFwcGVuZFRvKCdib2R5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHcgPSBsb2FkaW5nY29udGVudC53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdjb250ZW50LmRldGFjaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIExvY2tpbmc6XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zLmF1dG9mb2N1cyA9IG9wdGlvbnMuYXV0b2ZvY3VzO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucy53aWR0aCA9IHc7XHJcbiAgICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihsb2FkaW5nY29udGVudC5odG1sKCksICR0LCBvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA/ICdjdXN0b20tbG9hZGluZycgOiAnbG9hZGluZycsIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9LCBvcHRpb25zLmxvYWRpbmcuZGVsYXkpXHJcbiAgICAgICAgICAgICAgICA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICAvLyBQcmVwYXJlIGNvbnRleHRcclxuICAgICAgICAgICAgdmFyIGN0eCA9IHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICR0LFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGxvYWRpbmdUaW1lcjogbG9hZGluZ3RpbWVyXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICAgICAgICAgIGpxID0gJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0OiBjdHhcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBVcmwgaXMgc2V0IGluIHRoZSByZXR1cm5lZCBhamF4IG9iamVjdCBiZWNhdXNlIGlzIG5vdCBzZXQgYnkgYWxsIHZlcnNpb25zIG9mIGpRdWVyeVxyXG4gICAgICAgICAgICBqcS51cmwgPSB1cmw7XHJcblxyXG4gICAgICAgICAgICAvLyBNYXJrIGVsZW1lbnQgYXMgaXMgYmVpbmcgcmVsb2FkZWQsIHRvIGF2b2lkIG11bHRpcGxlIGF0dGVtcHMgYXQgc2FtZSB0aW1lLCBzYXZpbmdcclxuICAgICAgICAgICAgLy8gY3VycmVudCBhamF4IG9iamVjdCB0byBhbGxvdyBiZSBjYW5jZWxsZWRcclxuICAgICAgICAgICAgJHQuZGF0YSgnaXNSZWxvYWRpbmcnLCBqcSk7XHJcbiAgICAgICAgICAgIGpxLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdpc1JlbG9hZGluZycsIG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENhbGxiYWNrczogZmlyc3QgZ2xvYmFscyBhbmQgdGhlbiBmcm9tIG9wdGlvbnMgaWYgdGhleSBhcmUgZGlmZmVyZW50XHJcbiAgICAgICAgICAgIC8vIHN1Y2Nlc3NcclxuICAgICAgICAgICAganEuZG9uZShyZWxvYWQuZGVmYXVsdHMuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN1Y2Nlc3MgIT0gcmVsb2FkLmRlZmF1bHRzLnN1Y2Nlc3MpXHJcbiAgICAgICAgICAgICAgICBqcS5kb25lKG9wdGlvbnMuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIC8vIGVycm9yXHJcbiAgICAgICAgICAgIGpxLmZhaWwocmVsb2FkLmRlZmF1bHRzLmVycm9yKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZXJyb3IgIT0gcmVsb2FkLmRlZmF1bHRzLmVycm9yKVxyXG4gICAgICAgICAgICAgICAganEuZmFpbChvcHRpb25zLmVycm9yKTtcclxuICAgICAgICAgICAgLy8gY29tcGxldGVcclxuICAgICAgICAgICAganEuYWx3YXlzKHJlbG9hZC5kZWZhdWx0cy5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbXBsZXRlICE9IHJlbG9hZC5kZWZhdWx0cy5jb21wbGV0ZSlcclxuICAgICAgICAgICAgICAgIGpxLmRvbmUob3B0aW9ucy5jb21wbGV0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8vIFB1YmxpYyBkZWZhdWx0c1xyXG5yZWxvYWQuZGVmYXVsdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMpO1xyXG5cclxuLy8gUHVibGljIHV0aWxpdGllc1xyXG5yZWxvYWQudXBkYXRlRWxlbWVudCA9IHVwZGF0ZUVsZW1lbnQ7XHJcbnJlbG9hZC5zdG9wTG9hZGluZ1NwaW5uZXIgPSBzdG9wTG9hZGluZ1NwaW5uZXI7XHJcblxyXG4vLyBNb2R1bGVcclxubW9kdWxlLmV4cG9ydHMgPSByZWxvYWQ7IiwiLyoqIEV4dGVuZGVkIHRvZ2dsZS1zaG93LWhpZGUgZnVudGlvbnMuXHJcbiAgICBJYWdvU1JMQGdtYWlsLmNvbVxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICoqL1xyXG4oZnVuY3Rpb24oKXtcclxuXHJcbiAgICAvKiogSW1wbGVtZW50YXRpb246IHJlcXVpcmUgalF1ZXJ5IGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIHRoZVxyXG4gICAgICAgIHB1YmxpYyBtZXRob2RzLlxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24geHRzaChqUXVlcnkpIHtcclxuICAgICAgICB2YXIgJCA9IGpRdWVyeTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGlkZSBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnaGlkZScgYW5kICdmYWRlT3V0JyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5mYWRlT3V0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5zbGlkZVVwKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnaGlkZSdcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAkZS5oaWRlKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hoaWRlJywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICogU2hvdyBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnc2hvdycgYW5kICdmYWRlSW4nIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm1zIGEgZml4IG9uIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzXHJcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGVycm9yIHRoYXQgcHJldmVudHMgZnJvbSBydW5uaW5nXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdHMgb24gZWxlbWVudHMgdGhhdCBhcmUgYWxyZWFkeSB2aXNpYmxlLFxyXG4gICAgICAgICAgICAvLyB3aGF0IGxldHMgdGhlIHBvc3NpYmlsaXR5IG9mIGdldCBhIG1pZGRsZS1hbmltYXRlZFxyXG4gICAgICAgICAgICAvLyBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFdlIGp1c3QgY2hhbmdlIGRpc3BsYXk6bm9uZSwgZm9yY2luZyB0byAnaXMtdmlzaWJsZScgdG9cclxuICAgICAgICAgICAgLy8gYmUgZmFsc2UgYW5kIHRoZW4gcnVubmluZyB0aGUgZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBmbGlja2VyaW5nIGVmZmVjdCwgYmVjYXVzZSBqUXVlcnkganVzdCByZXNldHNcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBvbiBlZmZlY3Qgc3RhcnQuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuZmFkZUluKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ3Nob3cnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hzaG93JywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZW5lcmljIHV0aWxpdHkgZm9yIGhpZ2hseSBjb25maWd1cmFibGUgalF1ZXJ5LnRvZ2dsZSB3aXRoIHN1cHBvcnRcclxuICAgICAgICAgICAgdG8gc3BlY2lmeSB0aGUgdG9nZ2xlIHZhbHVlIGV4cGxpY2l0eSBmb3IgYW55IGtpbmQgb2YgZWZmZWN0OiBqdXN0IHBhc3MgdHJ1ZSBhcyBzZWNvbmQgcGFyYW1ldGVyICd0b2dnbGUnIHRvIHNob3dcclxuICAgICAgICAgICAgYW5kIGZhbHNlIHRvIGhpZGUuIFRvZ2dsZSBtdXN0IGJlIHN0cmljdGx5IGEgQm9vbGVhbiB2YWx1ZSB0byBhdm9pZCBhdXRvLWRldGVjdGlvbi5cclxuICAgICAgICAgICAgVG9nZ2xlIHBhcmFtZXRlciBjYW4gYmUgb21pdHRlZCB0byBhdXRvLWRldGVjdCBpdCwgYW5kIHNlY29uZCBwYXJhbWV0ZXIgY2FuIGJlIHRoZSBhbmltYXRpb24gb3B0aW9ucy5cclxuICAgICAgICAgICAgQWxsIHRoZSBvdGhlcnMgYmVoYXZlIGV4YWN0bHkgYXMgaGlkZUVsZW1lbnQgYW5kIHNob3dFbGVtZW50LlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUVsZW1lbnQoZWxlbWVudCwgdG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBub3QgYSBib29sZWFuXHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUgIT09IHRydWUgJiYgdG9nZ2xlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIGFuIG9iamVjdCwgdGhlbiBpcyB0aGUgb3B0aW9ucyBhcyBzZWNvbmQgcGFyYW1ldGVyXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRvZ2dsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRvZ2dsZTtcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tZGV0ZWN0IHRvZ2dsZSwgaXQgY2FuIHZhcnkgb24gYW55IGVsZW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGRldGVjdGlvbiBhbmQgYWN0aW9uIG11c3QgYmUgZG9uZSBwZXIgZWxlbWVudDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV1c2luZyBmdW5jdGlvbiwgd2l0aCBleHBsaWNpdCB0b2dnbGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsICEkKHRoaXMpLmlzKCc6dmlzaWJsZScpLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUpXHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBEbyBqUXVlcnkgaW50ZWdyYXRpb24gYXMgeHRvZ2dsZSwgeHNob3csIHhoaWRlXHJcbiAgICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsdWdJbihqUXVlcnkpIHtcclxuICAgICAgICAgICAgLyoqIHRvZ2dsZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4dG9nZ2xlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnh0b2dnbGUgPSBmdW5jdGlvbiB4dG9nZ2xlKHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCB0b2dnbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogc2hvd0VsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhzaG93ID0gZnVuY3Rpb24geHNob3cob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBoaWRlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhoaWRlID0gZnVuY3Rpb24geGhpZGUob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9ydGluZzpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0b2dnbGVFbGVtZW50OiB0b2dnbGVFbGVtZW50LFxyXG4gICAgICAgICAgICBzaG93RWxlbWVudDogc2hvd0VsZW1lbnQsXHJcbiAgICAgICAgICAgIGhpZGVFbGVtZW50OiBoaWRlRWxlbWVudCxcclxuICAgICAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vZHVsZVxyXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIHh0c2gpO1xyXG4gICAgfSBlbHNlIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICAgICAgdmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0geHRzaChqUXVlcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBOb3JtYWwgc2NyaXB0IGxvYWQsIGlmIGpRdWVyeSBpcyBnbG9iYWwgKGF0IHdpbmRvdyksIGl0cyBleHRlbmRlZCBhdXRvbWF0aWNhbGx5ICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5qUXVlcnkgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICB4dHNoKHdpbmRvdy5qUXVlcnkpLnBsdWdJbih3aW5kb3cualF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLyogU29tZSB1dGlsaXRpZXMgZm9yIHVzZSB3aXRoIGpRdWVyeSBvciBpdHMgZXhwcmVzc2lvbnNcclxuICAgIHRoYXQgYXJlIG5vdCBwbHVnaW5zLlxyXG4qL1xyXG5mdW5jdGlvbiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWyAjOyYsLisqflxcJzpcIiFeJFtcXF0oKT0+fFxcL10pL2csICdcXFxcJDEnKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTogZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZVxyXG4gICAgfTtcclxuIiwiLyogQXNzZXRzIGxvYWRlciB3aXRoIGxvYWRpbmcgY29uZmlybWF0aW9uIChtYWlubHkgZm9yIHNjcmlwdHMpXHJcbiAgICBiYXNlZCBvbiBNb2Rlcm5penIveWVwbm9wZSBsb2FkZXIuXHJcbiovXHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbmV4cG9ydHMubG9hZCA9IGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICBvcHRzID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIHNjcmlwdHM6IFtdLFxyXG4gICAgICAgIGNvbXBsZXRlOiBudWxsLFxyXG4gICAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBudWxsLFxyXG4gICAgICAgIGxvYWREZWxheTogMCxcclxuICAgICAgICB0cmlhbHNJbnRlcnZhbDogNTAwXHJcbiAgICB9LCBvcHRzKTtcclxuICAgIGlmICghb3B0cy5zY3JpcHRzLmxlbmd0aCkgcmV0dXJuO1xyXG4gICAgZnVuY3Rpb24gcGVyZm9ybUNvbXBsZXRlKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgKG9wdHMuY29tcGxldGVWZXJpZmljYXRpb24pICE9PSAnZnVuY3Rpb24nIHx8IG9wdHMuY29tcGxldGVWZXJpZmljYXRpb24oKSlcclxuICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSgpO1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHBlcmZvcm1Db21wbGV0ZSwgb3B0cy50cmlhbHNJbnRlcnZhbCk7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUud2FybilcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTEMubG9hZC5jb21wbGV0ZVZlcmlmaWNhdGlvbiBmYWlsZWQgZm9yICcgKyBvcHRzLnNjcmlwdHNbMF0gKyAnIHJldHJ5aW5nIGl0IGluICcgKyBvcHRzLnRyaWFsc0ludGVydmFsICsgJ21zJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbG9hZCgpIHtcclxuICAgICAgICBNb2Rlcm5penIubG9hZCh7XHJcbiAgICAgICAgICAgIGxvYWQ6IG9wdHMuc2NyaXB0cyxcclxuICAgICAgICAgICAgY29tcGxldGU6IG9wdHMuY29tcGxldGUgPyBwZXJmb3JtQ29tcGxldGUgOiBudWxsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAob3B0cy5sb2FkRGVsYXkpXHJcbiAgICAgICAgc2V0VGltZW91dChsb2FkLCBvcHRzLmxvYWREZWxheSk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgbG9hZCgpO1xyXG59OyIsIi8qLS0tLS0tLS0tLS0tXHJcblV0aWxpdGllcyB0byBtYW5pcHVsYXRlIG51bWJlcnMsIGFkZGl0aW9uYWxseVxyXG50byB0aGUgb25lcyBhdCBNYXRoXHJcbi0tLS0tLS0tLS0tLSovXHJcblxyXG4vKiogRW51bWVyYXRpb24gdG8gYmUgdXNlcyBieSBmdW5jdGlvbnMgdGhhdCBpbXBsZW1lbnRzICdyb3VuZGluZycgb3BlcmF0aW9ucyBvbiBkaWZmZXJlbnRcclxuZGF0YSB0eXBlcy5cclxuSXQgaG9sZHMgdGhlIGRpZmZlcmVudCB3YXlzIGEgcm91bmRpbmcgb3BlcmF0aW9uIGNhbiBiZSBhcHBseS5cclxuKiovXHJcbnZhciByb3VuZGluZ1R5cGVFbnVtID0ge1xyXG4gICAgRG93bjogLTEsXHJcbiAgICBOZWFyZXN0OiAwLFxyXG4gICAgVXA6IDFcclxufTtcclxuXHJcbmZ1bmN0aW9uIHJvdW5kVG8obnVtYmVyLCBkZWNpbWFscywgcm91bmRpbmdUeXBlKSB7XHJcbiAgICAvLyBjYXNlIE5lYXJlc3QgaXMgdGhlIGRlZmF1bHQ6XHJcbiAgICB2YXIgZiA9IG5lYXJlc3RUbztcclxuICAgIHN3aXRjaCAocm91bmRpbmdUeXBlKSB7XHJcbiAgICAgICAgY2FzZSByb3VuZGluZ1R5cGVFbnVtLkRvd246XHJcbiAgICAgICAgICAgIGYgPSBmbG9vclRvO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIHJvdW5kaW5nVHlwZUVudW0uVXA6XHJcbiAgICAgICAgICAgIGYgPSBjZWlsVG87XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGYobnVtYmVyLCBkZWNpbWFscyk7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXQgY2FuIHN1YnN0cmFjdCBpbnRlZ2VyIGRlY2ltYWxzIGJ5IHByb3ZpZGluZyBhIG5lZ2F0aXZlXHJcbm51bWJlciBvZiBkZWNpbWFscy5cclxuKiovXHJcbmZ1bmN0aW9uIG5lYXJlc3RUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5yb3VuZChudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBVcCBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXRzIHNpbWlsYXIgdG8gcm91bmRUbywgYnV0IHRoZSBudW1iZXIgaXMgZXZlciByb3VuZGVkIHVwLFxyXG50byB0aGUgbG93ZXIgaW50ZWdlciBncmVhdGVyIG9yIGVxdWFscyB0byB0aGUgbnVtYmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gY2VpbFRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vKiogUm91bmQgRG93biBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXRzIHNpbWlsYXIgdG8gcm91bmRUbywgYnV0IHRoZSBudW1iZXIgaXMgZXZlciByb3VuZGVkIGRvd24sXHJcbnRvIHRoZSBiaWdnZXIgaW50ZWdlciBsb3dlciBvciBlcXVhbHMgdG8gdGhlIG51bWJlci5cclxuKiovXHJcbmZ1bmN0aW9uIGZsb29yVG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgcm91bmRpbmdUeXBlRW51bTogcm91bmRpbmdUeXBlRW51bSxcclxuICAgICAgICByb3VuZFRvOiByb3VuZFRvLFxyXG4gICAgICAgIG5lYXJlc3RUbzogbmVhcmVzdFRvLFxyXG4gICAgICAgIGNlaWxUbzogY2VpbFRvLFxyXG4gICAgICAgIGZsb29yVG86IGZsb29yVG9cclxuICAgIH07IiwiZnVuY3Rpb24gbW92ZUZvY3VzVG8oZWwsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWFyZ2luVG9wOiAzMCxcclxuICAgICAgICBkdXJhdGlvbjogNTAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChlbCkub2Zmc2V0KCkudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3AgfSwgb3B0aW9ucy5kdXJhdGlvbiwgbnVsbCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb3ZlRm9jdXNUbztcclxufSIsIi8qIFNvbWUgdXRpbGl0aWVzIHRvIGZvcm1hdCBhbmQgZXh0cmFjdCBudW1iZXJzLCBmcm9tIHRleHQgb3IgRE9NLlxyXG4gKi9cclxudmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgaTE4biA9IHJlcXVpcmUoJy4vaTE4bicpLFxyXG4gICAgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuZnVuY3Rpb24gZ2V0TW9uZXlOdW1iZXIodiwgYWx0KSB7XHJcbiAgICBhbHQgPSBhbHQgfHwgMDtcclxuICAgIGlmICh2IGluc3RhbmNlb2YgalF1ZXJ5KVxyXG4gICAgICAgIHYgPSB2LnZhbCgpIHx8IHYudGV4dCgpO1xyXG4gICAgdiA9IHBhcnNlRmxvYXQodlxyXG4gICAgICAgIC5yZXBsYWNlKC9bJOKCrF0vZywgJycpXHJcbiAgICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChMQy5udW1lcmljTWlsZXNTZXBhcmF0b3JbaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmN1bHR1cmVdLCAnZycpLCAnJylcclxuICAgICk7XHJcbiAgICByZXR1cm4gaXNOYU4odikgPyBhbHQgOiB2O1xyXG59XHJcbmZ1bmN0aW9uIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcodikge1xyXG4gICAgdmFyIGN1bHR1cmUgPSBpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY3VsdHVyZTtcclxuICAgIC8vIEZpcnN0LCByb3VuZCB0byAyIGRlY2ltYWxzXHJcbiAgICB2ID0gbXUucm91bmRUbyh2LCAyKTtcclxuICAgIC8vIEdldCB0aGUgZGVjaW1hbCBwYXJ0IChyZXN0KVxyXG4gICAgdmFyIHJlc3QgPSBNYXRoLnJvdW5kKHYgKiAxMDAgJSAxMDApO1xyXG4gICAgcmV0dXJuICgnJyArXHJcbiAgICAvLyBJbnRlZ2VyIHBhcnQgKG5vIGRlY2ltYWxzKVxyXG4gICAgICAgIE1hdGguZmxvb3IodikgK1xyXG4gICAgLy8gRGVjaW1hbCBzZXBhcmF0b3IgZGVwZW5kaW5nIG9uIGxvY2FsZVxyXG4gICAgICAgIGkxOG4ubnVtZXJpY0RlY2ltYWxTZXBhcmF0b3JbY3VsdHVyZV0gK1xyXG4gICAgLy8gRGVjaW1hbHMsIGV2ZXIgdHdvIGRpZ2l0c1xyXG4gICAgICAgIE1hdGguZmxvb3IocmVzdCAvIDEwKSArIHJlc3QgJSAxMFxyXG4gICAgKTtcclxufVxyXG5mdW5jdGlvbiBudW1iZXJUb01vbmV5U3RyaW5nKHYpIHtcclxuICAgIHZhciBjb3VudHJ5ID0gaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmNvdW50cnk7XHJcbiAgICAvLyBUd28gZGlnaXRzIGluIGRlY2ltYWxzIGZvciByb3VuZGVkIHZhbHVlIHdpdGggbW9uZXkgc3ltYm9sIGFzIGZvclxyXG4gICAgLy8gY3VycmVudCBsb2NhbGVcclxuICAgIHJldHVybiAoaTE4bi5tb25leVN5bWJvbFByZWZpeFtjb3VudHJ5XSArIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcodikgKyBpMThuLm1vbmV5U3ltYm9sU3VmaXhbY291bnRyeV0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldE1vbmV5TnVtYmVyKHYsIGVsKSB7XHJcbiAgICAvLyBHZXQgdmFsdWUgaW4gbW9uZXkgZm9ybWF0OlxyXG4gICAgdiA9IG51bWJlclRvTW9uZXlTdHJpbmcodik7XHJcbiAgICAvLyBTZXR0aW5nIHZhbHVlOlxyXG4gICAgaWYgKGVsIGluc3RhbmNlb2YgalF1ZXJ5KVxyXG4gICAgICAgIGlmIChlbC5pcygnOmlucHV0JykpXHJcbiAgICAgICAgICAgIGVsLnZhbCh2KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGVsLnRleHQodik7XHJcbiAgICByZXR1cm4gdjtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZ2V0TW9uZXlOdW1iZXI6IGdldE1vbmV5TnVtYmVyLFxyXG4gICAgICAgIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmc6IG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcsXHJcbiAgICAgICAgbnVtYmVyVG9Nb25leVN0cmluZzogbnVtYmVyVG9Nb25leVN0cmluZyxcclxuICAgICAgICBzZXRNb25leU51bWJlcjogc2V0TW9uZXlOdW1iZXJcclxuICAgIH07IiwiLyoqXHJcbiogUGxhY2Vob2xkZXIgcG9seWZpbGwuXHJcbiogQWRkcyBhIG5ldyBqUXVlcnkgcGxhY2VIb2xkZXIgbWV0aG9kIHRvIHNldHVwIG9yIHJlYXBwbHkgcGxhY2VIb2xkZXJcclxuKiBvbiBlbGVtZW50cyAocmVjb21tZW50ZWQgdG8gYmUgYXBwbHkgb25seSB0byBzZWxlY3RvciAnW3BsYWNlaG9sZGVyXScpO1xyXG4qIHRoYXRzIG1ldGhvZCBpcyBmYWtlIG9uIGJyb3dzZXJzIHRoYXQgaGFzIG5hdGl2ZSBzdXBwb3J0IGZvciBwbGFjZWhvbGRlclxyXG4qKi9cclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFBsYWNlSG9sZGVycygpIHtcclxuICAgIGlmIChNb2Rlcm5penIuaW5wdXQucGxhY2Vob2xkZXIpXHJcbiAgICAgICAgJC5mbi5wbGFjZWhvbGRlciA9IGZ1bmN0aW9uICgpIHsgfTtcclxuICAgIGVsc2VcclxuICAgICAgICAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBkb1BsYWNlaG9sZGVyKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGlmICghJHQuZGF0YSgncGxhY2Vob2xkZXItc3VwcG9ydGVkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAkdC5vbignZm9jdXNpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQub24oJ2ZvY3Vzb3V0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICR0LmRhdGEoJ3BsYWNlaG9sZGVyLXN1cHBvcnRlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJC5mbi5wbGFjZWhvbGRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZG9QbGFjZWhvbGRlcik7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpO1xyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5hamF4Q29tcGxldGUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKCk7XHJcbn07IiwiLyogUG9wdXAgZnVuY3Rpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5yZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKlxyXG4qIFBvcHVwIHJlbGF0ZWQgXHJcbiogZnVuY3Rpb25zXHJcbiovXHJcbmZ1bmN0aW9uIHBvcHVwU2l6ZShzaXplKSB7XHJcbiAgICB2YXIgcyA9IChzaXplID09ICdsYXJnZScgPyAwLjggOiAoc2l6ZSA9PSAnbWVkaXVtJyA/IDAuNSA6IChzaXplID09ICdzbWFsbCcgPyAwLjIgOiBzaXplIHx8IDAuNSkpKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgd2lkdGg6IE1hdGgucm91bmQoJCh3aW5kb3cpLndpZHRoKCkgKiBzKSxcclxuICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQoJCh3aW5kb3cpLmhlaWdodCgpICogcyksXHJcbiAgICAgICAgc2l6ZUZhY3Rvcjogc1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBwb3B1cFN0eWxlKHNpemUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3Vyc29yOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgd2lkdGg6IHNpemUud2lkdGggKyAncHgnLFxyXG4gICAgICAgIGxlZnQ6IE1hdGgucm91bmQoKCQod2luZG93KS53aWR0aCgpIC0gc2l6ZS53aWR0aCkgLyAyKSAtIDI1ICsgJ3B4JyxcclxuICAgICAgICBoZWlnaHQ6IHNpemUuaGVpZ2h0ICsgJ3B4JyxcclxuICAgICAgICB0b3A6IE1hdGgucm91bmQoKCQod2luZG93KS5oZWlnaHQoKSAtIHNpemUuaGVpZ2h0KSAvIDIpIC0gMzIgKyAncHgnLFxyXG4gICAgICAgIHBhZGRpbmc6ICczNHB4IDI1cHggMzBweCcsXHJcbiAgICAgICAgb3ZlcmZsb3c6ICdhdXRvJyxcclxuICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAnLW1vei1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZycsXHJcbiAgICAgICAgJy13ZWJraXQtYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmctYm94JyxcclxuICAgICAgICAnYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmctYm94J1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBwb3B1cCh1cmwsIHNpemUsIGNvbXBsZXRlLCBsb2FkaW5nVGV4dCwgb3B0aW9ucykge1xyXG4gICAgaWYgKHR5cGVvZiAodXJsKSA9PT0gJ29iamVjdCcpXHJcbiAgICAgICAgb3B0aW9ucyA9IHVybDtcclxuXHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgdXJsOiB0eXBlb2YgKHVybCkgPT09ICdzdHJpbmcnID8gdXJsIDogJycsXHJcbiAgICAgICAgc2l6ZTogc2l6ZSB8fCB7IHdpZHRoOiAwLCBoZWlnaHQ6IDAgfSxcclxuICAgICAgICBjb21wbGV0ZTogY29tcGxldGUsXHJcbiAgICAgICAgbG9hZGluZ1RleHQ6IGxvYWRpbmdUZXh0LFxyXG4gICAgICAgIGNsb3NhYmxlOiB7XHJcbiAgICAgICAgICAgIG9uTG9hZDogZmFsc2UsXHJcbiAgICAgICAgICAgIGFmdGVyTG9hZDogdHJ1ZSxcclxuICAgICAgICAgICAgb25FcnJvcjogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b1NpemU6IGZhbHNlLFxyXG4gICAgICAgIGNvbnRhaW5lckNsYXNzOiAnJyxcclxuICAgICAgICBhdXRvRm9jdXM6IHRydWVcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIC8vIFByZXBhcmUgc2l6ZSBhbmQgbG9hZGluZ1xyXG4gICAgb3B0aW9ucy5sb2FkaW5nVGV4dCA9IG9wdGlvbnMubG9hZGluZ1RleHQgfHwgJyc7XHJcbiAgICBpZiAodHlwZW9mIChvcHRpb25zLnNpemUud2lkdGgpID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICBvcHRpb25zLnNpemUgPSBwb3B1cFNpemUob3B0aW9ucy5zaXplKTtcclxuXHJcbiAgICAkLmJsb2NrVUkoe1xyXG4gICAgICAgIG1lc3NhZ2U6IChvcHRpb25zLmNsb3NhYmxlLm9uTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKSArXHJcbiAgICAgICAnPGltZyBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyArIG9wdGlvbnMubG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2VudGVyWTogZmFsc2UsXHJcbiAgICAgICAgY3NzOiBwb3B1cFN0eWxlKG9wdGlvbnMuc2l6ZSksXHJcbiAgICAgICAgb3ZlcmxheUNTUzogeyBjdXJzb3I6ICdkZWZhdWx0JyB9LFxyXG4gICAgICAgIGZvY3VzSW5wdXQ6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExvYWRpbmcgVXJsIHdpdGggQWpheCBhbmQgcGxhY2UgY29udGVudCBpbnNpZGUgdGhlIGJsb2NrZWQtYm94XHJcbiAgICAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogb3B0aW9ucy51cmwsXHJcbiAgICAgICAgY29udGV4dDoge1xyXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxyXG4gICAgICAgICAgICBjb250YWluZXI6ICQoJy5ibG9ja01zZycpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5jb250YWluZXIuYWRkQ2xhc3Mob3B0aW9ucy5jb250YWluZXJDbGFzcyk7XHJcbiAgICAgICAgICAgIC8vIEFkZCBjbG9zZSBidXR0b24gaWYgcmVxdWlyZXMgaXQgb3IgZW1wdHkgbWVzc2FnZSBjb250ZW50IHRvIGFwcGVuZCB0aGVuIG1vcmVcclxuICAgICAgICAgICAgY29udGFpbmVyLmh0bWwob3B0aW9ucy5jbG9zYWJsZS5hZnRlckxvYWQgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJyk7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50SG9sZGVyID0gY29udGFpbmVyLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbnRlbnRcIi8+JykuY2hpbGRyZW4oJy5jb250ZW50Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLkNvZGUgJiYgZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIGNvZGUsIHNob3cgcmVzdWx0XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5hcHBlbmQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gUGFnZSBjb250ZW50IGdvdCwgcGFzdGUgaW50byB0aGUgcG9wdXAgaWYgaXMgcGFydGlhbCBodG1sICh1cmwgc3RhcnRzIHdpdGggJClcclxuICAgICAgICAgICAgICAgIGlmICgvKCheXFwkKXwoXFwvXFwkKSkvLnRlc3Qob3B0aW9ucy51cmwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5hcHBlbmQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50SG9sZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBdm9pZCBtaXNjYWxjdWxhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc3R5bGUud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCd3aWR0aCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2SGVpZ2h0ID0gY29udGVudEhvbGRlclswXS5zdHlsZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0dWFsV2lkdGggPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsSGVpZ2h0ID0gY29udGVudEhvbGRlclswXS5zY3JvbGxIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250V2lkdGggPSBjb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRIZWlnaHQgPSBjb250YWluZXIuaGVpZ2h0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYVdpZHRoID0gY29udGFpbmVyLm91dGVyV2lkdGgodHJ1ZSkgLSBjb250V2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYUhlaWdodCA9IGNvbnRhaW5lci5vdXRlckhlaWdodCh0cnVlKSAtIGNvbnRIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aCA9ICQod2luZG93KS53aWR0aCgpIC0gZXh0cmFXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKSAtIGV4dHJhSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgYW5kIGFwcGx5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaXplID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGFjdHVhbFdpZHRoID4gbWF4V2lkdGggPyBtYXhXaWR0aCA6IGFjdHVhbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBhY3R1YWxIZWlnaHQgPiBtYXhIZWlnaHQgPyBtYXhIZWlnaHQgOiBhY3R1YWxIZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFuaW1hdGUoc2l6ZSwgMzAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgbWlzY2FsY3VsYXRpb25zIGNvcnJlY3Rpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCd3aWR0aCcsIHByZXZXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCdoZWlnaHQnLCBwcmV2SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEVsc2UsIGlmIHVybCBpcyBhIGZ1bGwgaHRtbCBwYWdlIChub3JtYWwgcGFnZSksIHB1dCBjb250ZW50IGludG8gYW4gaWZyYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShkYXRhLCB0aGlzLm9wdGlvbnMuc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXBsYWNlIGJsb2NraW5nIGVsZW1lbnQgY29udGVudCAodGhlIGxvYWRpbmcpIHdpdGggdGhlIGlmcmFtZTpcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9Gb2N1cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oaWZyYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIGVycm9yOiBmdW5jdGlvbiAoaiwgdCwgZXgpIHtcclxuICAgICAgICAgICAgJCgnZGl2LmJsb2NrTXNnJykuaHRtbCgob3B0aW9ucy5jbG9zYWJsZS5vbkVycm9yID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICsgJzxkaXYgY2xhc3M9XCJjb250ZW50XCI+UGFnZSBub3QgZm91bmQ8L2Rpdj4nKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5pbmZvKSBjb25zb2xlLmluZm8oXCJQb3B1cC1hamF4IGVycm9yOiBcIiArIGV4KTtcclxuICAgICAgICB9LCBjb21wbGV0ZTogb3B0aW9ucy5jb21wbGV0ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHJldHVybmVkQmxvY2sgPSAkKCcuYmxvY2tVSScpO1xyXG5cclxuICAgIHJldHVybmVkQmxvY2sub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgcmV0dXJuZWRCbG9jay50cmlnZ2VyKCdwb3B1cC1jbG9zZWQnKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHJldHVybmVkQmxvY2suY2xvc2VQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldEJsb2NrRWxlbWVudCA9IGZ1bmN0aW9uIGdldEJsb2NrRWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmlsdGVyKCcuYmxvY2tNc2cnKTsgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0Q29udGVudEVsZW1lbnQgPSBmdW5jdGlvbiBnZXRDb250ZW50RWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmluZCgnLmNvbnRlbnQnKTsgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0T3ZlcmxheUVsZW1lbnQgPSBmdW5jdGlvbiBnZXRPdmVybGF5RWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmlsdGVyKCcuYmxvY2tPdmVybGF5Jyk7IH07XHJcbiAgICByZXR1cm4gcmV0dXJuZWRCbG9jaztcclxufVxyXG5cclxuLyogU29tZSBwb3B1cCB1dGlsaXRpdGVzL3Nob3J0aGFuZHMgKi9cclxuZnVuY3Rpb24gbWVzc2FnZVBvcHVwKG1lc3NhZ2UsIGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgJ2JvZHknKTtcclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdi8+JykudGV4dChtZXNzYWdlKTtcclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY29udGFpbmVyLCAnbWVzc2FnZS1wb3B1cCBmdWxsLWJsb2NrJywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiB0cnVlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25uZWN0UG9wdXBBY3Rpb24oYXBwbHlUb1NlbGVjdG9yKSB7XHJcbiAgICBhcHBseVRvU2VsZWN0b3IgPSBhcHBseVRvU2VsZWN0b3IgfHwgJy5wb3B1cC1hY3Rpb24nO1xyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgYXBwbHlUb1NlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGMgPSAkKCQodGhpcykuYXR0cignaHJlZicpKS5jbG9uZSgpO1xyXG4gICAgICAgIGlmIChjLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIGRvY3VtZW50LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vIFRoZSBwb3B1cCBmdW5jdGlvbiBjb250YWlucyBhbGwgdGhlIG90aGVycyBhcyBtZXRob2RzXHJcbnBvcHVwLnNpemUgPSBwb3B1cFNpemU7XHJcbnBvcHVwLnN0eWxlID0gcG9wdXBTdHlsZTtcclxucG9wdXAuY29ubmVjdEFjdGlvbiA9IGNvbm5lY3RQb3B1cEFjdGlvbjtcclxucG9wdXAubWVzc2FnZSA9IG1lc3NhZ2VQb3B1cDtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHBvcHVwOyIsIi8qKioqIFBvc3RhbCBDb2RlOiBvbiBmbHksIHNlcnZlci1zaWRlIHZhbGlkYXRpb24gKioqKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBiYXNlVXJsOiAnLycsXHJcbiAgICAgICAgc2VsZWN0b3I6ICdbZGF0YS12YWwtcG9zdGFsY29kZV0nLFxyXG4gICAgICAgIHVybDogJ0pTT04vVmFsaWRhdGVQb3N0YWxDb2RlLydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCBvcHRpb25zLnNlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBJZiBjb250YWlucyBhIHZhbHVlICh0aGlzIG5vdCB2YWxpZGF0ZSBpZiBpcyByZXF1aXJlZCkgYW5kIFxyXG4gICAgICAgIC8vIGhhcyB0aGUgZXJyb3IgZGVzY3JpcHRpdmUgbWVzc2FnZSwgdmFsaWRhdGUgdGhyb3VnaCBhamF4XHJcbiAgICAgICAgdmFyIHBjID0gJHQudmFsKCk7XHJcbiAgICAgICAgdmFyIG1zZyA9ICR0LmRhdGEoJ3ZhbC1wb3N0YWxjb2RlJyk7XHJcbiAgICAgICAgaWYgKHBjICYmIG1zZykge1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBvcHRpb25zLmJhc2VVcmwgKyBvcHRpb25zLnVybCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHsgUG9zdGFsQ29kZTogcGMgfSxcclxuICAgICAgICAgICAgICAgIGNhY2hlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdKU09OJyxcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5SZXN1bHQuSXNWYWxpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKS5hZGRDbGFzcygndmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnNpYmxpbmdzKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50ZXh0KCcnKS5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYW4gc3VtbWFyeSBlcnJvcnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJz4gdWwgPiBsaScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS50ZXh0KCkgPT0gbXNnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVycm9yIGxhYmVsIChpZiB0aGVyZSBpcylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCdbZGF0YS12YWxtc2ctZm9yPScgKyAkdC5hdHRyKCduYW1lJykgKyAnXScpLnRleHQoJycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKS5yZW1vdmVDbGFzcygndmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnNpYmxpbmdzKCcuZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxzcGFuIGZvcj1cIicgKyAkdC5hdHRyKCduYW1lJykgKyAnXCIgZ2VuZXJhdGVkPVwidHJ1ZVwiPicgKyBtc2cgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHN1bW1hcnkgZXJyb3IgKGlmIHRoZXJlIGlzIG5vdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2hpbGRyZW4oJ3VsJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8bGk+JyArIG1zZyArICc8L2xpPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXJyb3IgbGFiZWwgKGlmIHRoZXJlIGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ1tkYXRhLXZhbG1zZy1mb3I9JyArICR0LmF0dHIoJ25hbWUnKSArICddJykudGV4dChtc2cpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbGFiZWwgaXMgbm90IHZpc2libGUsIGp1c3QgcmVtb3ZlIHRoZSBiYWQgY29kZSB0byBsZXQgdXNlciBzZWUgdGhlIHBsYWNlaG9sZGVyICM1MTRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciAkbGFiZWwgPSAkdC5jbG9zZXN0KCdsYWJlbCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkbGFiZWwubGVuZ3RoICYmICR0LmF0dHIoJ2lkJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJGxhYmVsID0gJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ2xhYmVsW2Zvcj0nICsgJHQuYXR0cignaWQnKSArICddJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRsYWJlbC5pcygnOnZpc2libGUnKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC52YWwoJycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKiBBcHBseSBldmVyIGEgcmVkaXJlY3QgdG8gdGhlIGdpdmVuIFVSTCwgaWYgdGhpcyBpcyBhbiBpbnRlcm5hbCBVUkwgb3Igc2FtZVxyXG5wYWdlLCBpdCBmb3JjZXMgYSBwYWdlIHJlbG9hZCBmb3IgdGhlIGdpdmVuIFVSTC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlZGlyZWN0VG8odXJsKSB7XHJcbiAgICAvLyBCbG9jayB0byBhdm9pZCBtb3JlIHVzZXIgaW50ZXJhY3Rpb25zOlxyXG4gICAgJC5ibG9ja1VJKHsgbWVzc2FnZTogJycgfSk7IC8vbG9hZGluZ0Jsb2NrKTtcclxuICAgIC8vIENoZWNraW5nIGlmIGlzIGJlaW5nIHJlZGlyZWN0aW5nIG9yIG5vdFxyXG4gICAgdmFyIHJlZGlyZWN0ZWQgPSBmYWxzZTtcclxuICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gY2hlY2tSZWRpcmVjdCgpIHtcclxuICAgICAgICByZWRpcmVjdGVkID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgLy8gTmF2aWdhdGUgdG8gbmV3IGxvY2F0aW9uOlxyXG4gICAgd2luZG93LmxvY2F0aW9uID0gdXJsO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gSWYgcGFnZSBub3QgY2hhbmdlZCAoc2FtZSB1cmwgb3IgaW50ZXJuYWwgbGluayksIHBhZ2UgY29udGludWUgZXhlY3V0aW5nIHRoZW4gcmVmcmVzaDpcclxuICAgICAgICBpZiAoIXJlZGlyZWN0ZWQpXHJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0sIDUwKTtcclxufTtcclxuIiwiLyoqIFNhbml0aXplIHRoZSB3aGl0ZXNwYWNlcyBpbiBhIHRleHQgYnk6XHJcbi0gcmVwbGFjaW5nIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVyZXMgKGFueSBudW1iZXIgb2YgcmVwZXRpdGlvbiBcclxuYW5kIGFueSBraW5kIG9mIHdoaXRlIGNoYXJhY3RlcikgYnkgYSBub3JtYWwgd2hpdGUtc3BhY2VcclxuLSByZXBsYWNlIGVuY29kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlLXNwYWNlc1xyXG4tIGV2ZXIgcmV0dXJuIGEgc3RyaW5nLCBlbXB0eSB3aGVuIG51bGxcclxuKiovXHJcbmZ1bmN0aW9uIHNhbml0aXplV2hpdGVzcGFjZXModGV4dCkge1xyXG4gICAgLy8gRXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4gICAgdGV4dCA9ICh0ZXh0IHx8ICcnKVxyXG4gICAgLy8gUmVwbGFjZSBhbnkga2luZCBvZiBjb250aWd1b3VzIHdoaXRlc3BhY2VzIGNoYXJhY3RlcnMgYnkgYSBzaW5nbGUgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbiAgICAvLyAodGhhdHMgaW5jbHVkZSByZXBsYWNlIGVuY29uZGVkIG5vbi1icmVha2luZy1zcGFjZXMsXHJcbiAgICAvLyBhbmQgZHVwbGljYXRlZC1yZXBlYXRlZCBhcHBlYXJhbmNlcylcclxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJyk7XHJcbiAgICAvLyBSZW1vdmUgc3RhcnRpbmcgYW5kIGVuZGluZyB3aGl0ZXNwYWNlc1xyXG4gICAgcmV0dXJuICQudHJpbSh0ZXh0KTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gc2FuaXRpemVXaGl0ZXNwYWNlczsiLCIvKiogQ3VzdG9tIExvY29ub21pY3MgJ2xpa2UgYmxvY2tVSScgcG9wdXBzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlLFxyXG4gICAgYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi9hdXRvRm9jdXMnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG5cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2soY29udGVudEJveCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHtcclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBjbG9zYWJsZTogZmFsc2UsXHJcbiAgICAgICAgY2VudGVyOiBmYWxzZSxcclxuICAgICAgICAvKiBhcyBhIHZhbGlkIG9wdGlvbnMgcGFyYW1ldGVyIGZvciBMQy5oaWRlRWxlbWVudCBmdW5jdGlvbiAqL1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogNjAwLFxyXG4gICAgICAgICAgICBlZmZlY3Q6ICdmYWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgIGF1dG9mb2N1c09wdGlvbnM6IHsgbWFyZ2luVG9wOiA2MCB9LFxyXG4gICAgICAgIHdpZHRoOiAnYXV0bydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnRlbnRCb3ggPSAkKGNvbnRlbnRCb3gpO1xyXG4gICAgdmFyIGZ1bGwgPSBmYWxzZTtcclxuICAgIGlmIChibG9ja2VkID09IGRvY3VtZW50IHx8IGJsb2NrZWQgPT0gd2luZG93KSB7XHJcbiAgICAgICAgYmxvY2tlZCA9ICQoJ2JvZHknKTtcclxuICAgICAgICBmdWxsID0gdHJ1ZTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGJsb2NrZWQgPSAkKGJsb2NrZWQpO1xyXG5cclxuICAgIHZhciBib3hJbnNpZGVCbG9ja2VkID0gIWJsb2NrZWQuaXMoJ2JvZHksdHIsdGhlYWQsdGJvZHksdGZvb3QsdGFibGUsdWwsb2wsZGwnKTtcclxuXHJcbiAgICAvLyBHZXR0aW5nIGJveCBlbGVtZW50IGlmIGV4aXN0cyBhbmQgcmVmZXJlbmNpbmdcclxuICAgIHZhciBiSUQgPSBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnKTtcclxuICAgIGlmICghYklEKVxyXG4gICAgICAgIGJJRCA9IChjb250ZW50Qm94LmF0dHIoJ2lkJykgfHwgJycpICsgKGJsb2NrZWQuYXR0cignaWQnKSB8fCAnJykgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIGlmIChiSUQgPT0gJy1zbW9vdGhCb3hCbG9jaycpIHtcclxuICAgICAgICBiSUQgPSAnaWQtJyArIGd1aWRHZW5lcmF0b3IoKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgfVxyXG4gICAgYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJywgYklEKTtcclxuICAgIHZhciBib3ggPSAkKCcjJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoYklEKSk7XHJcbiAgICBcclxuICAgIC8vIEhpZGluZy9jbG9zaW5nIGJveDpcclxuICAgIGlmIChjb250ZW50Qm94Lmxlbmd0aCA9PT0gMCkge1xyXG5cclxuICAgICAgICBib3gueGhpZGUob3B0aW9ucy5jbG9zZU9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvLyBSZXN0b3JpbmcgdGhlIENTUyBwb3NpdGlvbiBhdHRyaWJ1dGUgb2YgdGhlIGJsb2NrZWQgZWxlbWVudFxyXG4gICAgICAgIC8vIHRvIGF2b2lkIHNvbWUgcHJvYmxlbXMgd2l0aCBsYXlvdXQgb24gc29tZSBlZGdlIGNhc2VzIGFsbW9zdFxyXG4gICAgICAgIC8vIHRoYXQgbWF5IGJlIG5vdCBhIHByb2JsZW0gZHVyaW5nIGJsb2NraW5nIGJ1dCB3aGVuIHVuYmxvY2tlZC5cclxuICAgICAgICB2YXIgcHJldiA9IGJsb2NrZWQuZGF0YSgnc2JiLXByZXZpb3VzLWNzcy1wb3NpdGlvbicpO1xyXG4gICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsIHByZXYgfHwgJycpO1xyXG4gICAgICAgIGJsb2NrZWQuZGF0YSgnc2JiLXByZXZpb3VzLWNzcy1wb3NpdGlvbicsIG51bGwpO1xyXG5cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGJveGM7XHJcbiAgICBpZiAoYm94Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGJveGMgPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1lbGVtZW50XCIvPicpO1xyXG4gICAgICAgIGJveCA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLW92ZXJsYXlcIj48L2Rpdj4nKTtcclxuICAgICAgICBib3guYWRkQ2xhc3MoYWRkY2xhc3MpO1xyXG4gICAgICAgIGlmIChmdWxsKSBib3guYWRkQ2xhc3MoJ2Z1bGwtYmxvY2snKTtcclxuICAgICAgICBib3guYXBwZW5kKGJveGMpO1xyXG4gICAgICAgIGJveC5hdHRyKCdpZCcsIGJJRCk7XHJcbiAgICAgICAgaWYgKGJveEluc2lkZUJsb2NrZWQpXHJcbiAgICAgICAgICAgIGJsb2NrZWQuYXBwZW5kKGJveCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKGJveCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGJveGMgPSBib3guY2hpbGRyZW4oJy5zbW9vdGgtYm94LWJsb2NrLWVsZW1lbnQnKTtcclxuICAgIH1cclxuICAgIC8vIEhpZGRlbiBmb3IgdXNlciwgYnV0IGF2YWlsYWJsZSB0byBjb21wdXRlOlxyXG4gICAgY29udGVudEJveC5zaG93KCk7XHJcbiAgICBib3guc2hvdygpLmNzcygnb3BhY2l0eScsIDApO1xyXG4gICAgLy8gU2V0dGluZyB1cCB0aGUgYm94IGFuZCBzdHlsZXMuXHJcbiAgICBib3hjLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICBpZiAob3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICBib3hjLmFwcGVuZCgkKCc8YSBjbGFzcz1cImNsb3NlLXBvcHVwIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicpKTtcclxuICAgIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycsIG9wdGlvbnMpO1xyXG4gICAgaWYgKCFib3hjLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnKSlcclxuICAgICAgYm94Y1xyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLWFjdGlvbicsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgbnVsbCwgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJykpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnLCB0cnVlKTtcclxuICAgIGJveGMuYXBwZW5kKGNvbnRlbnRCb3gpO1xyXG4gICAgYm94Yy53aWR0aChvcHRpb25zLndpZHRoKTtcclxuICAgIGJveC5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICBpZiAoYm94SW5zaWRlQmxvY2tlZCkge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIGluc2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBibG9ja2VkLmNzcygnei1pbmRleCcpICsgMTApO1xyXG4gICAgICAgIGlmICghYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgfHwgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgPT0gJ3N0YXRpYycpIHtcclxuICAgICAgICAgICAgYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJywgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykpO1xyXG4gICAgICAgICAgICBibG9ja2VkLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9vZmZzID0gYmxvY2tlZC5wb3NpdGlvbigpO1xyXG4gICAgICAgIGJveC5jc3MoJ3RvcCcsIDApO1xyXG4gICAgICAgIGJveC5jc3MoJ2xlZnQnLCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gb3V0c2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50LCBhcyBhIGRpcmVjdCBjaGlsZCBvZiBCb2R5OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBNYXRoLmZsb29yKE51bWJlci5NQVhfVkFMVUUpKTtcclxuICAgICAgICBib3guY3NzKGJsb2NrZWQub2Zmc2V0KCkpO1xyXG4gICAgfVxyXG4gICAgLy8gRGltZW5zaW9ucyBtdXN0IGJlIGNhbGN1bGF0ZWQgYWZ0ZXIgYmVpbmcgYXBwZW5kZWQgYW5kIHBvc2l0aW9uIHR5cGUgYmVpbmcgc2V0OlxyXG4gICAgYm94LndpZHRoKGJsb2NrZWQub3V0ZXJXaWR0aCgpKTtcclxuICAgIGJveC5oZWlnaHQoYmxvY2tlZC5vdXRlckhlaWdodCgpKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5jZW50ZXIpIHtcclxuICAgICAgICBib3hjLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgICAgICB2YXIgY2wsIGN0O1xyXG4gICAgICAgIGlmIChmdWxsKSB7XHJcbiAgICAgICAgICAgIGN0ID0gc2NyZWVuLmhlaWdodCAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gc2NyZWVuLndpZHRoIC8gMjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjdCA9IGJveC5vdXRlckhlaWdodCh0cnVlKSAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gYm94Lm91dGVyV2lkdGgodHJ1ZSkgLyAyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAob3B0aW9ucy5jZW50ZXIgPT09IHRydWUgfHwgb3B0aW9ucy5jZW50ZXIgPT09ICd2ZXJ0aWNhbCcpXHJcbiAgICAgICAgICAgIGJveGMuY3NzKCd0b3AnLCBjdCAtIGJveGMub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyKTtcclxuICAgICAgICBpZiAob3B0aW9ucy5jZW50ZXIgPT09IHRydWUgfHwgb3B0aW9ucy5jZW50ZXIgPT09ICdob3Jpem9udGFsJylcclxuICAgICAgICAgICAgYm94Yy5jc3MoJ2xlZnQnLCBjbCAtIGJveGMub3V0ZXJXaWR0aCh0cnVlKSAvIDIpO1xyXG4gICAgfVxyXG4gICAgLy8gTGFzdCBzZXR1cFxyXG4gICAgYXV0b0ZvY3VzKGJveCk7XHJcbiAgICAvLyBTaG93IGJsb2NrXHJcbiAgICBib3guYW5pbWF0ZSh7IG9wYWNpdHk6IDEgfSwgMzAwKTtcclxuICAgIGlmIChvcHRpb25zLmF1dG9mb2N1cylcclxuICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50Qm94LCBvcHRpb25zLmF1dG9mb2N1c09wdGlvbnMpO1xyXG4gICAgcmV0dXJuIGJveDtcclxufVxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsKGNvbnRhaW5lcikge1xyXG4gICAgJChjb250YWluZXIgfHwgZG9jdW1lbnQpLmZpbmQoJy5zbW9vdGgtYm94LWJsb2NrLW92ZXJsYXknKS5oaWRlKCk7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvcGVuOiBzbW9vdGhCb3hCbG9jayxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHsgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpOyB9LFxyXG4gICAgICAgIGNsb3NlQWxsOiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsXHJcbiAgICB9OyIsIi8qKlxyXG4qKiBNb2R1bGU6OiB0b29sdGlwc1xyXG4qKiBDcmVhdGVzIHNtYXJ0IHRvb2x0aXBzIHdpdGggcG9zc2liaWxpdGllcyBmb3Igb24gaG92ZXIgYW5kIG9uIGNsaWNrLFxyXG4qKiBhZGRpdGlvbmFsIGRlc2NyaXB0aW9uIG9yIGV4dGVybmFsIHRvb2x0aXAgY29udGVudC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzYW5pdGl6ZVdoaXRlc3BhY2VzID0gcmVxdWlyZSgnLi9zYW5pdGl6ZVdoaXRlc3BhY2VzJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lm91dGVySHRtbCcpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5pc0NoaWxkT2YnKTtcclxuXHJcbi8vIE1haW4gaW50ZXJuYWwgcHJvcGVydGllc1xyXG52YXIgcG9zb2Zmc2V0ID0geyB4OiAxNiwgeTogOCB9O1xyXG52YXIgc2VsZWN0b3IgPSAnW3RpdGxlXVtkYXRhLWRlc2NyaXB0aW9uXSwgW3RpdGxlXS5oYXMtdG9vbHRpcCwgW3RpdGxlXS5zZWN1cmUtZGF0YSwgW2RhdGEtdG9vbHRpcC11cmxdLCBbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJztcclxuXHJcbi8qKiBQb3NpdGlvbmF0ZSB0aGUgdG9vbHRpcCBkZXBlbmRpbmcgb24gdGhlXHJcbmV2ZW50IG9yIHRoZSB0YXJnZXQgZWxlbWVudCBwb3NpdGlvbiBhbmQgYW4gb2Zmc2V0XHJcbioqL1xyXG5mdW5jdGlvbiBwb3ModCwgZSwgbCkge1xyXG4gICAgdmFyIHgsIHk7XHJcbiAgICBpZiAoZS5wYWdlWCAmJiBlLnBhZ2VZKSB7XHJcbiAgICAgICAgeCA9IGUucGFnZVg7XHJcbiAgICAgICAgeSA9IGUucGFnZVk7XHJcbiAgICB9IGVsc2UgaWYgKGUudGFyZ2V0KSB7XHJcbiAgICAgICAgdmFyICRldCA9ICQoZS50YXJnZXQpO1xyXG4gICAgICAgIHggPSAkZXQub3V0ZXJXaWR0aCgpICsgJGV0Lm9mZnNldCgpLmxlZnQ7XHJcbiAgICAgICAgeSA9ICRldC5vdXRlckhlaWdodCgpICsgJGV0Lm9mZnNldCgpLnRvcDtcclxuICAgIH1cclxuICAgIHQuY3NzKCdsZWZ0JywgeCArIHBvc29mZnNldC54KTtcclxuICAgIHQuY3NzKCd0b3AnLCB5ICsgcG9zb2Zmc2V0LnkpO1xyXG4gICAgLy8gQWRqdXN0IHdpZHRoIHRvIHZpc2libGUgdmlld3BvcnRcclxuICAgIHZhciB0ZGlmID0gdC5vdXRlcldpZHRoKCkgLSB0LndpZHRoKCk7XHJcbiAgICB0LmNzcygnbWF4LXdpZHRoJywgJCh3aW5kb3cpLndpZHRoKCkgLSB4IC0gcG9zb2Zmc2V0LnggLSB0ZGlmKTtcclxuICAgIC8vdC5oZWlnaHQoJChkb2N1bWVudCkuaGVpZ2h0KCkgLSB5IC0gcG9zb2Zmc2V0LnkpO1xyXG59XHJcbi8qKiBHZXQgb3IgY3JlYXRlLCBhbmQgcmV0dXJucywgdGhlIHRvb2x0aXAgY29udGVudCBmb3IgdGhlIGVsZW1lbnRcclxuKiovXHJcbmZ1bmN0aW9uIGNvbihsKSB7XHJcbiAgICBpZiAobC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGMgPSBsLmRhdGEoJ3Rvb2x0aXAtY29udGVudCcpLFxyXG4gICAgICAgIHBlcnNpc3RlbnQgPSBsLmRhdGEoJ3BlcnNpc3RlbnQtdG9vbHRpcCcpO1xyXG4gICAgaWYgKCFjKSB7XHJcbiAgICAgICAgdmFyIGggPSBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwuYXR0cigndGl0bGUnKSk7XHJcbiAgICAgICAgdmFyIGQgPSBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwuZGF0YSgnZGVzY3JpcHRpb24nKSk7XHJcbiAgICAgICAgaWYgKGQpXHJcbiAgICAgICAgICAgIGMgPSAnPGg0PicgKyBoICsgJzwvaDQ+PHA+JyArIGQgKyAnPC9wPic7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjID0gaDtcclxuICAgICAgICAvLyBBcHBlbmQgZGF0YS10b29sdGlwLXVybCBjb250ZW50IGlmIGV4aXN0c1xyXG4gICAgICAgIHZhciB1cmxjb250ZW50ID0gJChsLmRhdGEoJ3Rvb2x0aXAtdXJsJykpO1xyXG4gICAgICAgIGMgPSAoYyB8fCAnJykgKyB1cmxjb250ZW50Lm91dGVySHRtbCgpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBvcmlnaW5hbCwgaXMgbm8gbW9yZSBuZWVkIGFuZCBhdm9pZCBpZC1jb25mbGljdHNcclxuICAgICAgICB1cmxjb250ZW50LnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIFNhdmUgdG9vbHRpcCBjb250ZW50XHJcbiAgICAgICAgbC5kYXRhKCd0b29sdGlwLWNvbnRlbnQnLCBjKTtcclxuICAgICAgICAvLyBSZW1vdmUgYnJvd3NlciB0b29sdGlwIChib3RoIHdoZW4gd2UgYXJlIHVzaW5nIG91ciBvd24gdG9vbHRpcCBhbmQgd2hlbiBubyB0b29sdGlwXHJcbiAgICAgICAgLy8gaXMgbmVlZClcclxuICAgICAgICBsLmF0dHIoJ3RpdGxlJywgJycpO1xyXG4gICAgfVxyXG4gICAgLy8gUmVtb3ZlIHRvb2x0aXAgY29udGVudCAoYnV0IHByZXNlcnZlIGl0cyBjYWNoZSBpbiB0aGUgZWxlbWVudCBkYXRhKVxyXG4gICAgLy8gaWYgaXMgdGhlIHNhbWUgdGV4dCBhcyB0aGUgZWxlbWVudCBjb250ZW50IGFuZCB0aGUgZWxlbWVudCBjb250ZW50XHJcbiAgICAvLyBpcyBmdWxseSB2aXNpYmxlLiBUaGF0cywgZm9yIGNhc2VzIHdpdGggZGlmZmVyZW50IGNvbnRlbnQsIHdpbGwgYmUgc2hvd2VkLFxyXG4gICAgLy8gYW5kIGZvciBjYXNlcyB3aXRoIHNhbWUgY29udGVudCBidXQgaXMgbm90IHZpc2libGUgYmVjYXVzZSB0aGUgZWxlbWVudFxyXG4gICAgLy8gb3IgY29udGFpbmVyIHdpZHRoLCB0aGVuIHdpbGwgYmUgc2hvd2VkLlxyXG4gICAgLy8gRXhjZXB0IGlmIGlzIHBlcnNpc3RlbnRcclxuICAgIGlmIChwZXJzaXN0ZW50ICE9PSB0cnVlICYmXHJcbiAgICAgICAgc2FuaXRpemVXaGl0ZXNwYWNlcyhsLnRleHQoKSkgPT0gYyAmJlxyXG4gICAgICAgIGwub3V0ZXJXaWR0aCgpID49IGxbMF0uc2Nyb2xsV2lkdGgpIHtcclxuICAgICAgICBjID0gbnVsbDtcclxuICAgIH1cclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIGNvbnRlbnQ6XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICAvLyBVcGRhdGUgdGFyZ2V0IHJlbW92aW5nIHRoZSBjbGFzcyB0byBhdm9pZCBjc3MgbWFya2luZyB0b29sdGlwIHdoZW4gdGhlcmUgaXMgbm90XHJcbiAgICAgICAgbC5yZW1vdmVDbGFzcygnaGFzLXRvb2x0aXAnKS5yZW1vdmVDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIH1cclxuICAgIC8vIFJldHVybiB0aGUgY29udGVudCBhcyBzdHJpbmc6XHJcbiAgICByZXR1cm4gYztcclxufVxyXG4vKiogR2V0IG9yIGNyZWF0ZXMgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBmb3IgYSB0b29sdGlwIG9mIHRoZSBnaXZlbiB0eXBlXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRUb29sdGlwKHR5cGUpIHtcclxuICAgIHR5cGUgPSB0eXBlIHx8ICd0b29sdGlwJztcclxuICAgIHZhciBpZCA9ICdzaW5nbGV0b24tJyArIHR5cGU7XHJcbiAgICB2YXIgdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgIGlmICghdCkge1xyXG4gICAgICAgIHQgPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIiBjbGFzcz1cInRvb2x0aXBcIj48L2Rpdj4nKTtcclxuICAgICAgICB0LmF0dHIoJ2lkJywgaWQpO1xyXG4gICAgICAgIHQuaGlkZSgpO1xyXG4gICAgICAgICQoJ2JvZHknKS5hcHBlbmQodCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJCh0KTtcclxufVxyXG4vKiogU2hvdyB0aGUgdG9vbHRpcCBvbiBhbiBldmVudCB0cmlnZ2VyZWQgYnkgdGhlIGVsZW1lbnQgY29udGFpbmluZ1xyXG5pbmZvcm1hdGlvbiBmb3IgYSB0b29sdGlwXHJcbioqL1xyXG5mdW5jdGlvbiBzaG93VG9vbHRpcChlKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGlzUG9wdXAgPSAkdC5oYXNDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIC8vIEdldCBvciBjcmVhdGUgdG9vbHRpcCBsYXllclxyXG4gICAgdmFyIHQgPSBnZXRUb29sdGlwKGlzUG9wdXAgPyAncG9wdXAtdG9vbHRpcCcgOiAndG9vbHRpcCcpO1xyXG4gICAgLy8gSWYgdGhpcyBpcyBub3QgcG9wdXAgYW5kIHRoZSBldmVudCBpcyBjbGljaywgZGlzY2FyZCB3aXRob3V0IGNhbmNlbCBldmVudFxyXG4gICAgaWYgKCFpc1BvcHVwICYmIGUudHlwZSA9PSAnY2xpY2snKVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIC8vIENyZWF0ZSBjb250ZW50OiBpZiB0aGVyZSBpcyBjb250ZW50LCBjb250aW51ZVxyXG4gICAgdmFyIGNvbnRlbnQgPSBjb24oJHQpO1xyXG4gICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAvLyBJZiBpcyBhIGhhcy1wb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBkb24ndCBzaG93XHJcbiAgICAgICAgaWYgKGlzUG9wdXAgJiYgZS50eXBlICE9ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vIFRoZSB0b29sdGlwIHNldHVwIG11c3QgYmUgcXVldWVkIHRvIGF2b2lkIGNvbnRlbnQgdG8gYmUgc2hvd2VkIGFuZCBwbGFjZWRcclxuICAgICAgICAvLyB3aGVuIHN0aWxsIGhpZGRlbiB0aGUgcHJldmlvdXNcclxuICAgICAgICB0LnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gU2V0IHRvb2x0aXAgY29udGVudFxyXG4gICAgICAgICAgICB0Lmh0bWwoY29udGVudCk7XHJcbiAgICAgICAgICAgIC8vIEZvciBwb3B1cHMsIHNldHVwIGNsYXNzIGFuZCBjbG9zZSBidXR0b25cclxuICAgICAgICAgICAgaWYgKGlzUG9wdXApIHtcclxuICAgICAgICAgICAgICAgIHQuYWRkQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKTtcclxuICAgICAgICAgICAgICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxhIGhyZWY9XCIjY2xvc2UtcG9wdXBcIiBjbGFzcz1cImNsb3NlLWFjdGlvblwiPlg8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0LmFwcGVuZChjbG9zZUJ1dHRvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gUG9zaXRpb25hdGVcclxuICAgICAgICAgICAgcG9zKHQsIGUsICR0KTtcclxuICAgICAgICAgICAgdC5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgIC8vIFNob3cgKGFuaW1hdGlvbnMgYXJlIHN0b3BwZWQgb25seSBvbiBoaWRlIHRvIGF2b2lkIGNvbmZsaWN0cylcclxuICAgICAgICAgICAgdC5mYWRlSW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdG9wIGJ1YmJsaW5nIGFuZCBkZWZhdWx0XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEhpZGUgYWxsIG9wZW5lZCB0b29sdGlwcywgZm9yIGFueSB0eXBlLlxyXG5JdCBoYXMgc29tZSBzcGVjaWFsIGNvbnNpZGVyYXRpb25zIGZvciBwb3B1cC10b29sdGlwcyBkZXBlbmRpbmdcclxub24gdGhlIGV2ZW50IGJlaW5nIHRyaWdnZXJlZC5cclxuKiovXHJcbmZ1bmN0aW9uIGhpZGVUb29sdGlwKGUpIHtcclxuICAgICQoJy50b29sdGlwOnZpc2libGUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBvciB0aGUgaW52ZXJzZSxcclxuICAgICAgICAvLyB0aGlzIGlzIG5vdCBhIHBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgYSBjbGljaywgZG8gbm90aGluZ1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlICE9ICdjbGljaycgfHxcclxuICAgICAgICAgICAgIXQuaGFzQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKSAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIFN0b3AgYW5pbWF0aW9ucyBhbmQgaGlkZVxyXG4gICAgICAgIHQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEluaXRpYWxpemUgdG9vbHRpcHNcclxuKiovXHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyB0byBzaG93L2hpZGUgdG9vbHRpcHNcclxuICAgICQoJ2JvZHknKS5vbignbW91c2Vtb3ZlIGZvY3VzaW4nLCBzZWxlY3Rvciwgc2hvd1Rvb2x0aXApXHJcbiAgICAub24oJ21vdXNlbGVhdmUgZm9jdXNvdXQnLCBzZWxlY3RvciwgaGlkZVRvb2x0aXApXHJcbiAgICAvLyBMaXN0ZW4gZXZlbnQgZm9yIGNsaWNrYWJsZSBwb3B1cC10b29sdGlwc1xyXG4gICAgLm9uKCdjbGljaycsICdbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJywgc2hvd1Rvb2x0aXApXHJcbiAgICAvLyBBbGxvd2luZyBidXR0b25zIGluc2lkZSB0aGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcudG9vbHRpcC1idXR0b24nLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgIC8vIEFkZGluZyBjbG9zZS10b29sdGlwIGhhbmRsZXIgZm9yIHBvcHVwLXRvb2x0aXBzIChjbGljayBvbiBhbnkgZWxlbWVudCBleGNlcHQgdGhlIHRvb2x0aXAgaXRzZWxmKVxyXG4gICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKCcucG9wdXAtdG9vbHRpcDp2aXNpYmxlJykuZ2V0KDApO1xyXG4gICAgICAgIC8vIElmIHRoZSBjbGljayBpcyBOb3Qgb24gdGhlIHRvb2x0aXAgb3IgYW55IGVsZW1lbnQgY29udGFpbmVkXHJcbiAgICAgICAgLy8gaGlkZSB0b29sdGlwXHJcbiAgICAgICAgaWYgKGUudGFyZ2V0ICE9IHQgJiYgISQoZS50YXJnZXQpLmlzQ2hpbGRPZih0KSlcclxuICAgICAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KVxyXG4gICAgLy8gQXZvaWQgY2xvc2UtYWN0aW9uIGNsaWNrIGZyb20gcmVkaXJlY3QgcGFnZSwgYW5kIGhpZGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcucG9wdXAtdG9vbHRpcCAuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KTtcclxuICAgIHVwZGF0ZSgpO1xyXG59XHJcbi8qKiBVcGRhdGUgZWxlbWVudHMgb24gdGhlIHBhZ2UgdG8gcmVmbGVjdCBjaGFuZ2VzIG9yIG5lZWQgZm9yIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoZWxlbWVudF9zZWxlY3Rvcikge1xyXG4gICAgLy8gUmV2aWV3IGV2ZXJ5IHBvcHVwIHRvb2x0aXAgdG8gcHJlcGFyZSBjb250ZW50IGFuZCBtYXJrL3VubWFyayB0aGUgbGluayBvciB0ZXh0OlxyXG4gICAgJChlbGVtZW50X3NlbGVjdG9yIHx8IHNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb24oJCh0aGlzKSk7XHJcbiAgICB9KTtcclxufVxyXG4vKiogQ3JlYXRlIHRvb2x0aXAgb24gZWxlbWVudCBieSBkZW1hbmRcclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZV90b29sdGlwKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCB7XHJcbiAgICAgIHRpdGxlOiAnJ1xyXG4gICAgICAsIGRlc2NyaXB0aW9uOiBudWxsXHJcbiAgICAgICwgdXJsOiBudWxsXHJcbiAgICAgICwgaXNfcG9wdXA6IGZhbHNlXHJcbiAgICAgICwgcGVyc2lzdGVudDogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoZWxlbWVudClcclxuICAgIC5hdHRyKCd0aXRsZScsIHNldHRpbmdzLnRpdGxlKVxyXG4gICAgLmRhdGEoJ2Rlc2NyaXB0aW9uJywgc2V0dGluZ3MuZGVzY3JpcHRpb24pXHJcbiAgICAuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJywgc2V0dGluZ3MucGVyc2lzdGVudClcclxuICAgIC5hZGRDbGFzcyhzZXR0aW5ncy5pc19wb3B1cCA/ICdoYXMtcG9wdXAtdG9vbHRpcCcgOiAnaGFzLXRvb2x0aXAnKTtcclxuICAgIHVwZGF0ZShlbGVtZW50KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdFRvb2x0aXBzOiBpbml0LFxyXG4gICAgICAgIHVwZGF0ZVRvb2x0aXBzOiB1cGRhdGUsXHJcbiAgICAgICAgY3JlYXRlVG9vbHRpcDogY3JlYXRlX3Rvb2x0aXBcclxuICAgIH07XHJcbiIsIi8qIFNvbWUgdG9vbHMgZm9ybSBVUkwgbWFuYWdlbWVudFxyXG4qL1xyXG5leHBvcnRzLmdldFVSTFBhcmFtZXRlciA9IGZ1bmN0aW9uIGdldFVSTFBhcmFtZXRlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gZGVjb2RlVVJJKFxyXG4gICAgICAgIChSZWdFeHAobmFtZSArICc9JyArICcoLis/KSgmfCQpJywgJ2knKS5leGVjKGxvY2F0aW9uLnNlYXJjaCkgfHwgWywgbnVsbF0pWzFdKTtcclxufTtcclxuZXhwb3J0cy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSBmdW5jdGlvbiBnZXRIYXNoQmFuZ1BhcmFtZXRlcnMoaGFzaGJhbmd2YWx1ZSkge1xyXG4gICAgLy8gSGFzaGJhbmd2YWx1ZSBpcyBzb21ldGhpbmcgbGlrZTogVGhyZWFkLTFfTWVzc2FnZS0yXHJcbiAgICAvLyBXaGVyZSAnMScgaXMgdGhlIFRocmVhZElEIGFuZCAnMicgdGhlIG9wdGlvbmFsIE1lc3NhZ2VJRCwgb3Igb3RoZXIgcGFyYW1ldGVyc1xyXG4gICAgdmFyIHBhcnMgPSBoYXNoYmFuZ3ZhbHVlLnNwbGl0KCdfJyk7XHJcbiAgICB2YXIgdXJsUGFyYW1ldGVycyA9IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHBhcnN2YWx1ZXMgPSBwYXJzW2ldLnNwbGl0KCctJyk7XHJcbiAgICAgICAgaWYgKHBhcnN2YWx1ZXMubGVuZ3RoID09IDIpXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSBwYXJzdmFsdWVzWzFdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXJsUGFyYW1ldGVyc1twYXJzdmFsdWVzWzBdXSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXJsUGFyYW1ldGVycztcclxufTtcclxuIiwiLyoqIFZhbGlkYXRpb24gbG9naWMgd2l0aCBsb2FkIGFuZCBzZXR1cCBvZiB2YWxpZGF0b3JzIGFuZCBcclxuICAgIHZhbGlkYXRpb24gcmVsYXRlZCB1dGlsaXRpZXNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbi8vIFVzaW5nIG9uIHNldHVwIGFzeW5jcm9ub3VzIGxvYWQgaW5zdGVhZCBvZiB0aGlzIHN0YXRpYy1saW5rZWQgbG9hZFxyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qcycpO1xyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qcycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBWYWxpZGF0aW9uKHJlYXBwbHlPbmx5VG8pIHtcclxuICAgIHJlYXBwbHlPbmx5VG8gPSByZWFwcGx5T25seVRvIHx8IGRvY3VtZW50O1xyXG4gICAgaWYgKCF3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkgd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmICghanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkge1xyXG4gICAgICAgIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKFtcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qc1wiIH0sXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanNcIiB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDaGVjayBmaXJzdCBpZiB2YWxpZGF0aW9uIGlzIGVuYWJsZWQgKGNhbiBoYXBwZW4gdGhhdCB0d2ljZSBpbmNsdWRlcyBvZlxyXG4gICAgICAgIC8vIHRoaXMgY29kZSBoYXBwZW4gYXQgc2FtZSBwYWdlLCBiZWluZyBleGVjdXRlZCB0aGlzIGNvZGUgYWZ0ZXIgZmlyc3QgYXBwZWFyYW5jZVxyXG4gICAgICAgIC8vIHdpdGggdGhlIHN3aXRjaCBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkIGNoYW5nZWRcclxuICAgICAgICAvLyBidXQgd2l0aG91dCB2YWxpZGF0aW9uIGJlaW5nIGFscmVhZHkgbG9hZGVkIGFuZCBlbmFibGVkKVxyXG4gICAgICAgIGlmICgkICYmICQudmFsaWRhdG9yICYmICQudmFsaWRhdG9yLnVub2J0cnVzaXZlKSB7XHJcbiAgICAgICAgICAgIC8vIEFwcGx5IHRoZSB2YWxpZGF0aW9uIHJ1bGVzIHRvIHRoZSBuZXcgZWxlbWVudHNcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd2YWxpZGF0b3InKTtcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICAgICAgJC52YWxpZGF0b3IudW5vYnRydXNpdmUucGFyc2UocmVhcHBseU9ubHlUbyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXRpZXMgKi9cclxuXHJcbi8qIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzIG9mIHRoZSB2YWxpZGF0aW9uIHN1bW1hcnlcclxuaW5jbHVkZWQgaW4gJ2NvbnRhaW5lcicgYW5kIHNldCBhcyB2YWxpZCB0aGUgc3VtbWFyeVxyXG4qL1xyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgICAkKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAuZmluZCgnPnVsPmxpJykucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gU2V0IGFsbCBmaWVsZHMgdmFsaWRhdGlvbiBpbnNpZGUgdGhpcyBmb3JtIChhZmZlY3RlZCBieSB0aGUgc3VtbWFyeSB0b28pXHJcbiAgICAvLyBhcyB2YWxpZCB0b29cclxuICAgICQoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAudGV4dCgnJyk7XHJcblxyXG4gICAgLy8gUmUtYXBwbHkgc2V0dXAgdmFsaWRhdGlvbiB0byBlbnN1cmUgaXMgd29ya2luZywgYmVjYXVzZSBqdXN0IGFmdGVyIGEgc3VjY2Vzc2Z1bFxyXG4gICAgLy8gdmFsaWRhdGlvbiwgYXNwLm5ldCB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIHN0b3BzIHdvcmtpbmcgb24gY2xpZW50LXNpZGUuXHJcbiAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGNvbnRhaW5lciwgZXJyb3JzKSB7XHJcbiAgdmFyIHYgPSBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKTtcclxuICB2LmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRFcnJvcnMoY29udGFpbmVyLCBlcnJvcnMpIHtcclxuICAgIC8vdmFyIHZhbGlkYXRvciA9ICQoY29udGFpbmVyKS52YWxpZGF0ZSgpO1xyXG4gICAgLy92YWxpZGF0b3Iuc2hvd0Vycm9ycyhlcnJvcnMpO1xyXG4gICAgdmFyICRzID0gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcikuZmluZCgndWwnKTtcclxuICAgIHZhciB3aXRoRXJyb3JzID0gZmFsc2U7XHJcbiAgICBmb3IodmFyIGZpZWxkIGluIGVycm9ycykge1xyXG4gICAgICAgIGlmIChlcnJvcnMuaGFzT3duUHJvcGVydHkgJiYgIWVycm9ycy5oYXNPd25Qcm9wZXJ0eShmaWVsZCkpXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICQoJzxsaS8+JykudGV4dChlcnJvcnNbZmllbGRdKS5hcHBlbmRUbygkcyk7XHJcbiAgICAgICAgLy8kKGNvbnRhaW5lcikuZmluZCgnW25hbWU9XCInICsgZmllbGQgKyAnXCJdJylcclxuICAgICAgICAvLy5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgLy8ucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQgdmFsaWQnKTtcclxuICAgICAgICB3aXRoRXJyb3JzID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlmICh3aXRoRXJyb3JzKVxyXG4gICAgICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihjb250YWluZXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnb1RvU3VtbWFyeUVycm9ycyhmb3JtKSB7XHJcbiAgICB2YXIgb2ZmID0gZm9ybS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLm9mZnNldCgpO1xyXG4gICAgaWYgKG9mZilcclxuICAgICAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IG9mZi50b3AgfSwgNTAwKTtcclxuICAgIGVsc2VcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdnb1RvU3VtbWFyeUVycm9yczogbm8gc3VtbWFyeSB0byBmb2N1cycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKSB7XHJcbiAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gIHJldHVybiAkKCdbZGF0YS12YWxtc2ctc3VtbWFyeT10cnVlXScsIGNvbnRhaW5lcik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2V0dXA6IHNldHVwVmFsaWRhdGlvbixcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDogc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IsXHJcbiAgICBnb1RvU3VtbWFyeUVycm9yczogZ29Ub1N1bW1hcnlFcnJvcnMsXHJcbiAgICBmaW5kVmFsaWRhdGlvblN1bW1hcnk6IGZpbmRWYWxpZGF0aW9uU3VtbWFyeSxcclxuICAgIHNldEVycm9yczogc2V0RXJyb3JzXHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIEFjY291bnQgcGFnZXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudClcclxuICAgIC5vbignY2xpY2snLCAnYS5sb2dpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArICdBY2NvdW50LyRMb2dpbi8/UmV0dXJuVXJsPScgKyBlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSwgbnVsbCwgbnVsbCwgeyBhdXRvRm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EuZm9yZ290LXBhc3N3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L0ZvcmdvdFBhc3N3b3JkJywgJy9BY2NvdW50LyRGb3Jnb3RQYXNzd29yZCcpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDAwLCBoZWlnaHQ6IDI0MCB9LCBudWxsLCBudWxsLCB7IGF1dG9Gb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5jaGFuZ2UtcGFzc3dvcmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvQ2hhbmdlUGFzc3dvcmQnLCAnL0FjY291bnQvJENoYW5nZVBhc3N3b3JkJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0NTAsIGhlaWdodDogMzQwIH0sIG51bGwsIG51bGwsIHsgYXV0b0ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvLyBPVVIgbmFtZXNwYWNlIChhYmJyZXZpYXRlZCBMb2Nvbm9taWNzKVxyXG53aW5kb3cuTEMgPSB3aW5kb3cuTEMgfHwge307XHJcblxyXG4vLyBUT0RPIFJldmlldyBMY1VybCB1c2UgYXJvdW5kIGFsbCB0aGUgbW9kdWxlcywgdXNlIERJIHdoZW5ldmVyIHBvc3NpYmxlIChpbml0L3NldHVwIG1ldGhvZCBvciBpbiB1c2UgY2FzZXMpXHJcbi8vIGJ1dCBvbmx5IGZvciB0aGUgd2FudGVkIGJhc2VVcmwgb24gZWFjaCBjYXNlIGFuZCBub3QgcGFzcyBhbGwgdGhlIExjVXJsIG9iamVjdC5cclxuLy8gTGNVcmwgaXMgc2VydmVyLXNpZGUgZ2VuZXJhdGVkIGFuZCB3cm90ZSBpbiBhIExheW91dCBzY3JpcHQtdGFnLlxyXG5cclxuLy8gR2xvYmFsIHNldHRpbmdzXHJcbndpbmRvdy5nTG9hZGluZ1JldGFyZCA9IDMwMDtcclxuXHJcbi8qKipcclxuICoqIExvYWRpbmcgbW9kdWxlc1xyXG4qKiovXHJcbi8vVE9ETzogQ2xlYW4gZGVwZW5kZW5jaWVzLCByZW1vdmUgYWxsIHRoYXQgbm90IHVzZWQgZGlyZWN0bHkgaW4gdGhpcyBmaWxlLCBhbnkgb3RoZXIgZmlsZVxyXG4vLyBvciBwYWdlIG11c3QgcmVxdWlyZSBpdHMgZGVwZW5kZW5jaWVzLlxyXG5cclxud2luZG93LkxjVXJsID0gcmVxdWlyZSgnLi4vTEMvTGNVcmwnKTtcclxuXHJcbi8qIGpRdWVyeSwgc29tZSB2ZW5kb3IgcGx1Z2lucyAoZnJvbSBidW5kbGUpIGFuZCBvdXIgYWRkaXRpb25zIChzbWFsbCBwbHVnaW5zKSwgdGhleSBhcmUgYXV0b21hdGljYWxseSBwbHVnLWVkIG9uIHJlcXVpcmUgKi9cclxudmFyICQgPSB3aW5kb3cuJCA9IHdpbmRvdy5qUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5Lmhhc1Njcm9sbEJhcicpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmEtaGFzaGNoYW5nZScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkuYXJlJyk7XHJcbi8vIE1hc2tlZCBpbnB1dCwgZm9yIGRhdGVzIC1hdCBteS1hY2NvdW50LS5cclxucmVxdWlyZSgnanF1ZXJ5LmZvcm1hdHRlcicpO1xyXG5cclxuLy8gR2VuZXJhbCBjYWxsYmFja3MgZm9yIEFKQVggZXZlbnRzIHdpdGggY29tbW9uIGxvZ2ljXHJcbnZhciBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnLi4vTEMvYWpheENhbGxiYWNrcycpO1xyXG4vLyBGb3JtLmFqYXggbG9naWMgYW5kIG1vcmUgc3BlY2lmaWMgY2FsbGJhY2tzIGJhc2VkIG9uIGFqYXhDYWxsYmFja3NcclxudmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxud2luZG93LmFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyID0gYWpheEZvcm1zLm9uU3VjY2Vzcztcclxud2luZG93LmFqYXhFcnJvclBvcHVwSGFuZGxlciA9IGFqYXhGb3Jtcy5vbkVycm9yO1xyXG53aW5kb3cuYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyID0gYWpheEZvcm1zLm9uQ29tcGxldGU7XHJcbi8vfVxyXG5cclxuLyogUmVsb2FkICovXHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5yZWxvYWQnKTtcclxuLy8gV3JhcHBlciBmdW5jdGlvbiBhcm91bmQgb25TdWNjZXNzIHRvIG1hcmsgb3BlcmF0aW9uIGFzIHBhcnQgb2YgYSBcclxuLy8gcmVsb2FkIGF2b2lkaW5nIHNvbWUgYnVncyAoYXMgcmVwbGFjZS1jb250ZW50IG9uIGFqYXgtYm94LCBub3Qgd2FudGVkIGZvclxyXG4vLyByZWxvYWQgb3BlcmF0aW9ucylcclxuZnVuY3Rpb24gcmVsb2FkU3VjY2Vzc1dyYXBwZXIoKSB7XHJcbiAgdmFyIGNvbnRleHQgPSAkLmlzUGxhaW5PYmplY3QodGhpcykgPyB0aGlzIDogeyBlbGVtZW50OiB0aGlzIH07XHJcbiAgY29udGV4dC5pc1JlbG9hZCA9IHRydWU7XHJcbiAgYWpheEZvcm1zLm9uU3VjY2Vzcy5hcHBseShjb250ZXh0LCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcclxufVxyXG4kLmZuLnJlbG9hZC5kZWZhdWx0cyA9IHtcclxuICBzdWNjZXNzOiBbcmVsb2FkU3VjY2Vzc1dyYXBwZXJdLFxyXG4gIGVycm9yOiBbYWpheEZvcm1zLm9uRXJyb3JdLFxyXG4gIGRlbGF5OiBnTG9hZGluZ1JldGFyZFxyXG59O1xyXG5cclxuTEMubW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuLi9MQy9tb3ZlRm9jdXNUbycpO1xyXG4vKiBEaXNhYmxlZCBiZWNhdXNlIGNvbmZsaWN0cyB3aXRoIHRoZSBtb3ZlRm9jdXNUbyBvZiBcclxuICBhamF4Rm9ybS5vbnN1Y2Nlc3MsIGl0IGhhcHBlbnMgYSBibG9jay5sb2FkaW5nIGp1c3QgYWZ0ZXJcclxuICB0aGUgc3VjY2VzcyBoYXBwZW5zLlxyXG4kLmJsb2NrVUkuZGVmYXVsdHMub25CbG9jayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFNjcm9sbCB0byBibG9jay1tZXNzYWdlIHRvIGRvbid0IGxvc3QgaW4gbGFyZ2UgcGFnZXM6XHJcbiAgICBMQy5tb3ZlRm9jdXNUbyh0aGlzKTtcclxufTsqL1xyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4uL0xDL2xvYWRlcicpO1xyXG5MQy5sb2FkID0gbG9hZGVyLmxvYWQ7XHJcblxyXG52YXIgYmxvY2tzID0gTEMuYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi4vTEMvYmxvY2tQcmVzZXRzJyk7XHJcbi8ve1RFTVBcclxud2luZG93LmxvYWRpbmdCbG9jayA9IGJsb2Nrcy5sb2FkaW5nO1xyXG53aW5kb3cuaW5mb0Jsb2NrID0gYmxvY2tzLmluZm87XHJcbndpbmRvdy5lcnJvckJsb2NrID0gYmxvY2tzLmVycm9yO1xyXG4vL31cclxuXHJcbkFycmF5LnJlbW92ZSA9IHJlcXVpcmUoJy4uL0xDL0FycmF5LnJlbW92ZScpO1xyXG5yZXF1aXJlKCcuLi9MQy9TdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zJyk7XHJcblxyXG5MQy5nZXRUZXh0ID0gcmVxdWlyZSgnLi4vTEMvZ2V0VGV4dCcpO1xyXG5cclxudmFyIFRpbWVTcGFuID0gTEMudGltZVNwYW4gPSByZXF1aXJlKCcuLi9MQy9UaW1lU3BhbicpO1xyXG52YXIgdGltZVNwYW5FeHRyYSA9IHJlcXVpcmUoJy4uL0xDL1RpbWVTcGFuRXh0cmEnKTtcclxudGltZVNwYW5FeHRyYS5wbHVnSW4oVGltZVNwYW4pO1xyXG4vL3tURU1QICBvbGQgYWxpYXNlc1xyXG5MQy5zbWFydFRpbWUgPSB0aW1lU3BhbkV4dHJhLnNtYXJ0VGltZTtcclxuTEMucm91bmRUaW1lVG9RdWFydGVySG91ciA9IHRpbWVTcGFuRXh0cmEucm91bmRUb1F1YXJ0ZXJIb3VyO1xyXG4vL31cclxuXHJcbkxDLkNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuLi9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbndpbmRvdy5UYWJiZWRVWCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYJyk7XHJcbnZhciBzbGlkZXJUYWJzID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguc2xpZGVyVGFicycpO1xyXG5cclxuLy8gUG9wdXAgQVBJc1xyXG53aW5kb3cuc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuLi9MQy9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi4vTEMvcG9wdXAnKTtcclxuLy97VEVNUFxyXG52YXIgcG9wdXBTdHlsZSA9IHBvcHVwLnN0eWxlLFxyXG4gICAgcG9wdXBTaXplID0gcG9wdXAuc2l6ZTtcclxuTEMubWVzc2FnZVBvcHVwID0gcG9wdXAubWVzc2FnZTtcclxuTEMuY29ubmVjdFBvcHVwQWN0aW9uID0gcG9wdXAuY29ubmVjdEFjdGlvbjtcclxud2luZG93LnBvcHVwID0gcG9wdXA7XHJcbi8vfVxyXG5cclxuTEMuc2FuaXRpemVXaGl0ZXNwYWNlcyA9IHJlcXVpcmUoJy4uL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMnKTtcclxuLy97VEVNUCAgIGFsaWFzIGJlY2F1c2UgbWlzc3BlbGxpbmdcclxuTEMuc2FuaXRpemVXaGl0ZXBhY2VzID0gTEMuc2FuaXRpemVXaGl0ZXNwYWNlcztcclxuLy99XHJcblxyXG5MQy5nZXRYUGF0aCA9IHJlcXVpcmUoJy4uL0xDL2dldFhQYXRoJyk7XHJcblxyXG52YXIgc3RyaW5nRm9ybWF0ID0gcmVxdWlyZSgnLi4vTEMvU3RyaW5nRm9ybWF0Jyk7XHJcblxyXG4vLyBFeHBhbmRpbmcgZXhwb3J0ZWQgdXRpbGl0ZXMgZnJvbSBtb2R1bGVzIGRpcmVjdGx5IGFzIExDIG1lbWJlcnM6XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9QcmljZScpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL21hdGhVdGlscycpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL251bWJlclV0aWxzJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvdG9vbHRpcHMnKSk7XHJcbnZhciBpMThuID0gTEMuaTE4biA9IHJlcXVpcmUoJy4uL0xDL2kxOG4nKTtcclxuLy97VEVNUCBvbGQgYWxpc2VzIG9uIExDIGFuZCBnbG9iYWxcclxuJC5leHRlbmQoTEMsIGkxOG4pO1xyXG4kLmV4dGVuZCh3aW5kb3csIGkxOG4pO1xyXG4vL31cclxuXHJcbi8vIHh0c2g6IHBsdWdlZCBpbnRvIGpxdWVyeSBhbmQgcGFydCBvZiBMQ1xyXG52YXIgeHRzaCA9IHJlcXVpcmUoJy4uL0xDL2pxdWVyeS54dHNoJyk7XHJcbnh0c2gucGx1Z0luKCQpO1xyXG4vL3tURU1QICAgcmVtb3ZlIG9sZCBMQy4qIGFsaWFzXHJcbiQuZXh0ZW5kKExDLCB4dHNoKTtcclxuZGVsZXRlIExDLnBsdWdJbjtcclxuLy99XHJcblxyXG52YXIgYXV0b0NhbGN1bGF0ZSA9IExDLmF1dG9DYWxjdWxhdGUgPSByZXF1aXJlKCcuLi9MQy9hdXRvQ2FsY3VsYXRlJyk7XHJcbi8ve1RFTVAgICByZW1vdmUgb2xkIGFsaWFzIHVzZVxyXG52YXIgbGNTZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMgPSBhdXRvQ2FsY3VsYXRlLm9uVGFibGVJdGVtcztcclxuTEMuc2V0dXBDYWxjdWxhdGVTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnk7XHJcbkxDLnVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLnVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnk7XHJcbkxDLnNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUub25EZXRhaWxlZFByaWNpbmdTdW1tYXJ5O1xyXG4vL31cclxuXHJcbnZhciBDb29raWUgPSBMQy5Db29raWUgPSByZXF1aXJlKCcuLi9MQy9Db29raWUnKTtcclxuLy97VEVNUCAgICBvbGQgYWxpYXNcclxudmFyIGdldENvb2tpZSA9IENvb2tpZS5nZXQsXHJcbiAgICBzZXRDb29raWUgPSBDb29raWUuc2V0O1xyXG4vL31cclxuXHJcbkxDLmRhdGVQaWNrZXIgPSByZXF1aXJlKCcuLi9MQy9kYXRlUGlja2VyJyk7XHJcbi8ve1RFTVAgICBvbGQgYWxpYXNcclxud2luZG93LnNldHVwRGF0ZVBpY2tlciA9IExDLnNldHVwRGF0ZVBpY2tlciA9IExDLmRhdGVQaWNrZXIuaW5pdDtcclxud2luZG93LmFwcGx5RGF0ZVBpY2tlciA9IExDLmFwcGx5RGF0ZVBpY2tlciA9IExDLmRhdGVQaWNrZXIuYXBwbHk7XHJcbi8vfVxyXG5cclxuTEMuYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi4vTEMvYXV0b0ZvY3VzJyk7XHJcblxyXG4vLyBDUlVETDogbG9hZGluZyBtb2R1bGUsIHNldHRpbmcgdXAgY29tbW9uIGRlZmF1bHQgdmFsdWVzIGFuZCBjYWxsYmFja3M6XHJcbnZhciBjcnVkbE1vZHVsZSA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJyk7XHJcbmNydWRsTW9kdWxlLmRlZmF1bHRTZXR0aW5ncy5kYXRhWydmb2N1cy1jbG9zZXN0J11bJ2RlZmF1bHQnXSA9ICcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nO1xyXG5jcnVkbE1vZHVsZS5kZWZhdWx0U2V0dGluZ3MuZGF0YVsnZm9jdXMtbWFyZ2luJ11bJ2RlZmF1bHQnXSA9IDEwO1xyXG52YXIgY3J1ZGwgPSBjcnVkbE1vZHVsZS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vLyBQcmV2aW91cyB1c2VkIGFsaWFzIChkZXByZWNhdGVkKTpcclxuTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcblxyXG4vLyBVSSBTbGlkZXIgTGFiZWxzXHJcbnZhciBzbGlkZXJMYWJlbHMgPSByZXF1aXJlKCcuLi9MQy9VSVNsaWRlckxhYmVscycpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxuTEMuY3JlYXRlTGFiZWxzRm9yVUlTbGlkZXIgPSBzbGlkZXJMYWJlbHMuY3JlYXRlO1xyXG5MQy51cGRhdGVMYWJlbHNGb3JVSVNsaWRlciA9IHNsaWRlckxhYmVscy51cGRhdGU7XHJcbkxDLnVpU2xpZGVyTGFiZWxzTGF5b3V0cyA9IHNsaWRlckxhYmVscy5sYXlvdXRzO1xyXG4vL31cclxuXHJcbnZhciB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi4vTEMvdmFsaWRhdGlvbkhlbHBlcicpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxuTEMuc2V0dXBWYWxpZGF0aW9uID0gdmFsaWRhdGlvbkhlbHBlci5zZXR1cDtcclxuTEMuc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkID0gdmFsaWRhdGlvbkhlbHBlci5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQ7XHJcbkxDLmdvVG9TdW1tYXJ5RXJyb3JzID0gdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycztcclxuLy99XHJcblxyXG5MQy5wbGFjZUhvbGRlciA9IHJlcXVpcmUoJy4uL0xDL3BsYWNlaG9sZGVyLXBvbHlmaWxsJykuaW5pdDtcclxuXHJcbkxDLm1hcFJlYWR5ID0gcmVxdWlyZSgnLi4vTEMvZ29vZ2xlTWFwUmVhZHknKTtcclxuXHJcbndpbmRvdy5pc0VtcHR5U3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvaXNFbXB0eVN0cmluZycpO1xyXG5cclxud2luZG93Lmd1aWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9MQy9ndWlkR2VuZXJhdG9yJyk7XHJcblxyXG52YXIgdXJsVXRpbHMgPSByZXF1aXJlKCcuLi9MQy91cmxVdGlscycpO1xyXG53aW5kb3cuZ2V0VVJMUGFyYW1ldGVyID0gdXJsVXRpbHMuZ2V0VVJMUGFyYW1ldGVyO1xyXG53aW5kb3cuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzID0gdXJsVXRpbHMuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzO1xyXG5cclxudmFyIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZycpO1xyXG4vL3tURU1QXHJcbkxDLmRhdGVUb0ludGVyY2hhbmdsZVN0cmluZyA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZztcclxuLy99XHJcblxyXG4vLyBQYWdlcyBpbiBwb3B1cFxyXG52YXIgd2VsY29tZVBvcHVwID0gcmVxdWlyZSgnLi93ZWxjb21lUG9wdXAnKTtcclxudmFyIGZhcXNQb3B1cHMgPSByZXF1aXJlKCcuL2ZhcXNQb3B1cHMnKTtcclxudmFyIGFjY291bnRQb3B1cHMgPSByZXF1aXJlKCcuL2FjY291bnRQb3B1cHMnKTtcclxudmFyIGxlZ2FsUG9wdXBzID0gcmVxdWlyZSgnLi9sZWdhbFBvcHVwcycpO1xyXG5cclxuLy8gT2xkIGF2YWlsYWJsaXR5IGNhbGVuZGFyXHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldCA9IHJlcXVpcmUoJy4vYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQnKTtcclxuLy8gTmV3IGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXIgPSByZXF1aXJlKCcuLi9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhcicpO1xyXG5cclxudmFyIGF1dG9maWxsU3VibWVudSA9IHJlcXVpcmUoJy4uL0xDL2F1dG9maWxsU3VibWVudScpO1xyXG5cclxudmFyIHRhYmJlZFdpemFyZCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLndpemFyZCcpO1xyXG5cclxudmFyIGhhc0NvbmZpcm1TdXBwb3J0ID0gcmVxdWlyZSgnLi4vTEMvaGFzQ29uZmlybVN1cHBvcnQnKTtcclxuXHJcbnZhciBwb3N0YWxDb2RlVmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4uL0xDL3Bvc3RhbENvZGVTZXJ2ZXJWYWxpZGF0aW9uJyk7XHJcblxyXG52YXIgdGFiYmVkTm90aWZpY2F0aW9ucyA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24nKTtcclxuXHJcbnZhciB0YWJzQXV0b2xvYWQgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5hdXRvbG9hZCcpO1xyXG5cclxudmFyIGhvbWVQYWdlID0gcmVxdWlyZSgnLi9ob21lJyk7XHJcblxyXG4vL3tURU1QIHJlbW92ZSBnbG9iYWwgZGVwZW5kZW5jeSBmb3IgdGhpc1xyXG53aW5kb3cuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4uL0xDL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuLy99XHJcblxyXG52YXIgcHJvdmlkZXJXZWxjb21lID0gcmVxdWlyZSgnLi9wcm92aWRlcldlbGNvbWUnKTtcclxuXHJcbnZhciBIZWxwUG9pbnQgPSByZXF1aXJlKCcuLi9MQy9IZWxwUG9pbnQnKS5IZWxwUG9pbnQ7XHJcblxyXG4vLyBHbG9iYWwgYWNjZXNzIHRvIHRoZSBGYWNlYm9vayBBUEkgdXRpbHMgdG8gYmUgdXNlZCBieVxyXG4vLyBwYWdlcyBhbmQgcGFnZS1jb21wb25lbnRzOyBhbnkgamF2YXNjcmlwdCBtb2R1bGUgbXVzdFxyXG4vLyByZXF1aXJlIGl0IGluc3RlYWQuXHJcbndpbmRvdy5mYWNlYm9va1V0aWxzID0gcmVxdWlyZSgnLi4vTEMvZmFjZWJvb2tVdGlscycpO1xyXG5cclxuLyoqXHJcbiAqKiBJbml0IGNvZGVcclxuKioqL1xyXG4kKHdpbmRvdykubG9hZChmdW5jdGlvbiAoKSB7XHJcbiAgLy8gRGlzYWJsZSBicm93c2VyIGJlaGF2aW9yIHRvIGF1dG8tc2Nyb2xsIHRvIHVybCBmcmFnbWVudC9oYXNoIGVsZW1lbnQgcG9zaXRpb246XHJcbiAgLy8gRVhDRVBUIGluIERhc2hib2FyZDpcclxuICAvLyBUT0RPOiBSZXZpZXcgaWYgdGhpcyBpcyByZXF1aXJlZCBvbmx5IGZvciBIb3dJdFdvcmtzIG9yIHNvbWV0aGluZyBtb3JlICh0YWJzLCBwcm9maWxlKVxyXG4gIC8vIGFuZCByZW1vdmUgaWYgcG9zc2libGUgb3Igb25seSBvbiB0aGUgY29uY3JldGUgY2FzZXMuXHJcbiAgaWYgKCEvXFwvZGFzaGJvYXJkXFwvL2kudGVzdChsb2NhdGlvbikpXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgJCgnaHRtbCxib2R5Jykuc2Nyb2xsVG9wKDApOyB9LCAxKTtcclxufSk7XHJcbiQoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHByb3ZpZGVyV2VsY29tZS5zaG93KCk7XHJcblxyXG4gICAgLy8gUGxhY2Vob2xkZXIgcG9seWZpbGxcclxuICAgIExDLnBsYWNlSG9sZGVyKCk7XHJcblxyXG4gICAgLy8gQXV0b2ZvY3VzIHBvbHlmaWxsXHJcbiAgICBMQy5hdXRvRm9jdXMoKTtcclxuXHJcbiAgICAvLyBHZW5lcmljIHNjcmlwdCBmb3IgZW5oYW5jZWQgdG9vbHRpcHMgYW5kIGVsZW1lbnQgZGVzY3JpcHRpb25zXHJcbiAgICBMQy5pbml0VG9vbHRpcHMoKTtcclxuXHJcbiAgICBhamF4Rm9ybXMuaW5pdCgpO1xyXG5cclxuICAgIHdlbGNvbWVQb3B1cC5pbml0KCk7XHJcblxyXG4gICAgLy8gRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIGZvciBzb21lIGxpbmtzIHRoYXQgYnkgZGVmYXVsdCBvcGVuIGEgbmV3IHRhYjpcclxuICAgIGZhcXNQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuICAgIGFjY291bnRQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuICAgIGxlZ2FsUG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcblxyXG4gICAgLy8gT2xkIGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG4gICAgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuaW5pdChMY1VybC5MYW5nUGF0aCk7XHJcbiAgICAvLyBOZXcgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbiAgICBhdmFpbGFiaWxpdHlDYWxlbmRhci5XZWVrbHkuZW5hYmxlQWxsKCk7XHJcblxyXG4gICAgcG9wdXAuY29ubmVjdEFjdGlvbigpO1xyXG5cclxuICAgIC8vIERhdGUgUGlja2VyXHJcbiAgICBMQy5kYXRlUGlja2VyLmluaXQoKTtcclxuXHJcbiAgICAvKiBBdXRvIGNhbGN1bGF0ZSB0YWJsZSBpdGVtcyB0b3RhbCAocXVhbnRpdHkqdW5pdHByaWNlPWl0ZW0tdG90YWwpIHNjcmlwdCAqL1xyXG4gICAgYXV0b0NhbGN1bGF0ZS5vblRhYmxlSXRlbXMoKTtcclxuICAgIGF1dG9DYWxjdWxhdGUub25TdW1tYXJ5KCk7XHJcblxyXG4gICAgaGFzQ29uZmlybVN1cHBvcnQub24oKTtcclxuXHJcbiAgICBwb3N0YWxDb2RlVmFsaWRhdGlvbi5pbml0KHsgYmFzZVVybDogTGNVcmwuTGFuZ1BhdGggfSk7XHJcblxyXG4gICAgLy8gVGFiYmVkIGludGVyZmFjZVxyXG4gICAgdGFic0F1dG9sb2FkLmluaXQoVGFiYmVkVVgpO1xyXG4gICAgVGFiYmVkVVguaW5pdCgpO1xyXG4gICAgVGFiYmVkVVguZm9jdXNDdXJyZW50TG9jYXRpb24oKTtcclxuICAgIFRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzKCk7XHJcbiAgICBzbGlkZXJUYWJzLmluaXQoVGFiYmVkVVgpO1xyXG5cclxuICAgIHRhYmJlZFdpemFyZC5pbml0KFRhYmJlZFVYLCB7XHJcbiAgICAgICAgbG9hZGluZ0RlbGF5OiBnTG9hZGluZ1JldGFyZFxyXG4gICAgfSk7XHJcblxyXG4gICAgdGFiYmVkTm90aWZpY2F0aW9ucy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgICBhdXRvZmlsbFN1Ym1lbnUoKTtcclxuXHJcbiAgICBIZWxwUG9pbnQuZW5hYmxlQWxsKGRvY3VtZW50KTtcclxuXHJcbiAgICAvLyBUT0RPOiAnbG9hZEhhc2hCYW5nJyBjdXN0b20gZXZlbnQgaW4gdXNlP1xyXG4gICAgLy8gSWYgdGhlIGhhc2ggdmFsdWUgZm9sbG93IHRoZSAnaGFzaCBiYW5nJyBjb252ZW50aW9uLCBsZXQgb3RoZXJcclxuICAgIC8vIHNjcmlwdHMgZG8gdGhlaXIgd29yayB0aHJvdWdodCBhICdsb2FkSGFzaEJhbmcnIGV2ZW50IGhhbmRsZXJcclxuICAgIGlmICgvXiMhLy50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSlcclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdsb2FkSGFzaEJhbmcnLCB3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSkpO1xyXG5cclxuICAgIC8vIFJlbG9hZCBidXR0b25zXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnJlbG9hZC1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gR2VuZXJpYyBhY3Rpb24gdG8gY2FsbCBsYy5qcXVlcnkgJ3JlbG9hZCcgZnVuY3Rpb24gZnJvbSBhbiBlbGVtZW50IGluc2lkZSBpdHNlbGYuXHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAkdC5jbG9zZXN0KCR0LmRhdGEoJ3JlbG9hZC10YXJnZXQnKSkucmVsb2FkKCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKiBFbmFibGUgZm9jdXMgdGFiIG9uIGV2ZXJ5IGhhc2ggY2hhbmdlLCBub3cgdGhlcmUgYXJlIHR3byBzY3JpcHRzIG1vcmUgc3BlY2lmaWMgZm9yIHRoaXM6XHJcbiAgICAqIG9uZSB3aGVuIHBhZ2UgbG9hZCAod2hlcmU/KSxcclxuICAgICogYW5kIGFub3RoZXIgb25seSBmb3IgbGlua3Mgd2l0aCAndGFyZ2V0LXRhYicgY2xhc3MuXHJcbiAgICAqIE5lZWQgYmUgc3R1ZHkgaWYgc29tZXRoaW5nIG9mIHRoZXJlIG11c3QgYmUgcmVtb3ZlZCBvciBjaGFuZ2VkLlxyXG4gICAgKiBUaGlzIGlzIG5lZWRlZCBmb3Igb3RoZXIgYmVoYXZpb3JzIHRvIHdvcmsuICovXHJcbiAgICAvLyBPbiB0YXJnZXQtdGFiIGxpbmtzXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYS50YXJnZXQtdGFiJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0aGVyZUlzVGFiID0gVGFiYmVkVVguZ2V0VGFiKCQodGhpcykuYXR0cignaHJlZicpKTtcclxuICAgICAgICBpZiAodGhlcmVJc1RhYikge1xyXG4gICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gT24gaGFzaCBjaGFuZ2VcclxuICAgIGlmICgkLmZuLmhhc2hjaGFuZ2UpXHJcbiAgICAgICAgJCh3aW5kb3cpLmhhc2hjaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIS9eIyEvLnRlc3QobG9jYXRpb24uaGFzaCkpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0aGVyZUlzVGFiID0gVGFiYmVkVVguZ2V0VGFiKGxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoZXJlSXNUYWIpXHJcbiAgICAgICAgICAgICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGhlcmVJc1RhYik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBIT01FIFBBR0UgLyBTRUFSQ0ggU1RVRkZcclxuICAgIGhvbWVQYWdlLmluaXQoKTtcclxuXHJcbiAgICAvLyBWYWxpZGF0aW9uIGF1dG8gc2V0dXAgZm9yIHBhZ2UgcmVhZHkgYW5kIGFmdGVyIGV2ZXJ5IGFqYXggcmVxdWVzdFxyXG4gICAgLy8gaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBmb3JtIGluIHRoZSBwYWdlLlxyXG4gICAgLy8gVGhpcyBhdm9pZCB0aGUgbmVlZCBmb3IgZXZlcnkgcGFnZSB3aXRoIGZvcm0gdG8gZG8gdGhlIHNldHVwIGl0c2VsZlxyXG4gICAgLy8gYWxtb3N0IGZvciBtb3N0IG9mIHRoZSBjYXNlLlxyXG4gICAgZnVuY3Rpb24gYXV0b1NldHVwVmFsaWRhdGlvbigpIHtcclxuICAgICAgICBpZiAoJChkb2N1bWVudCkuaGFzKCdmb3JtJykubGVuZ3RoKVxyXG4gICAgICAgICAgICB2YWxpZGF0aW9uSGVscGVyLnNldHVwKCdmb3JtJyk7XHJcbiAgICB9XHJcbiAgICBhdXRvU2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgICAkKGRvY3VtZW50KS5hamF4Q29tcGxldGUoYXV0b1NldHVwVmFsaWRhdGlvbik7XHJcblxyXG4gICAgLy8gVE9ETzogdXNlZCBzb21lIHRpbWU/IHN0aWxsIHJlcXVpcmVkIHVzaW5nIG1vZHVsZXM/XHJcbiAgICAvKlxyXG4gICAgKiBDb21tdW5pY2F0ZSB0aGF0IHNjcmlwdC5qcyBpcyByZWFkeSB0byBiZSB1c2VkXHJcbiAgICAqIGFuZCB0aGUgY29tbW9uIExDIGxpYiB0b28uXHJcbiAgICAqIEJvdGggYXJlIGVuc3VyZWQgdG8gYmUgcmFpc2VkIGV2ZXIgYWZ0ZXIgcGFnZSBpcyByZWFkeSB0b28uXHJcbiAgICAqL1xyXG4gICAgJChkb2N1bWVudClcclxuICAgIC50cmlnZ2VyKCdsY1NjcmlwdFJlYWR5JylcclxuICAgIC50cmlnZ2VyKCdsY0xpYlJlYWR5Jyk7XHJcbn0pOyIsIi8qKioqKiBBVkFJTEFCSUxJVFkgQ0FMRU5EQVIgV0lER0VUICoqKioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuLi9MQy9zbW9vdGhCb3hCbG9jaycpLFxyXG4gICAgZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nJyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5yZWxvYWQnKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRBdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmNhbGVuZGFyLWNvbnRyb2xzIC5hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoJHQuaGFzQ2xhc3MoJ3pvb20tYWN0aW9uJykpIHtcclxuICAgICAgICAgICAgLy8gRG8gem9vbVxyXG4gICAgICAgICAgICB2YXIgYyA9ICR0LmNsb3Nlc3QoJy5hdmFpbGFiaWxpdHktY2FsZW5kYXInKS5maW5kKCcuY2FsZW5kYXInKS5jbG9uZSgpO1xyXG4gICAgICAgICAgICBjLmNzcygnZm9udC1zaXplJywgJzJweCcpO1xyXG4gICAgICAgICAgICB2YXIgdGFiID0gJHQuY2xvc2VzdCgnLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgICAgIGMuZGF0YSgncG9wdXAtY29udGFpbmVyJywgdGFiKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihjLCB0YWIsICdhdmFpbGFiaWxpdHktY2FsZW5kYXInLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAvLyBOb3RoaW5nIG1vcmVcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBOYXZpZ2F0ZSBjYWxlbmRhclxyXG4gICAgICAgIHZhciBuZXh0ID0gJHQuaGFzQ2xhc3MoJ25leHQtd2Vlay1hY3Rpb24nKTtcclxuICAgICAgICB2YXIgY29udCA9ICR0LmNsb3Nlc3QoJy5hdmFpbGFiaWxpdHktY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsY29udCA9IGNvbnQuY2hpbGRyZW4oJy5jYWxlbmRhci1jb250YWluZXInKTtcclxuICAgICAgICB2YXIgY2FsID0gY2FsY29udC5jaGlsZHJlbignLmNhbGVuZGFyJyk7XHJcbiAgICAgICAgdmFyIGNhbGluZm8gPSBjb250LmZpbmQoJy5jYWxlbmRhci1pbmZvJyk7XHJcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShjYWwuZGF0YSgnc2hvd2VkLWRhdGUnKSk7XHJcbiAgICAgICAgdmFyIHVzZXJJZCA9IGNhbC5kYXRhKCd1c2VyLWlkJyk7XHJcbiAgICAgICAgaWYgKG5leHQpXHJcbiAgICAgICAgICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpIC0gNyk7XHJcbiAgICAgICAgdmFyIHN0cmRhdGUgPSBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcoZGF0ZSk7XHJcbiAgICAgICAgdmFyIHVybCA9IGJhc2VVcmwgKyBcIlByb2ZpbGUvJEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0L1dlZWsvXCIgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyZGF0ZSkgKyBcIi8/VXNlcklEPVwiICsgdXNlcklkO1xyXG4gICAgICAgIGNhbGNvbnQucmVsb2FkKHVybCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIG5ldyBvYmplY3Q6XHJcbiAgICAgICAgICAgIHZhciBjYWwgPSAkKCcuY2FsZW5kYXInLCB0aGlzLmVsZW1lbnQpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy55ZWFyLXdlZWsnKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtd2VlaycpKTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcuZmlyc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtZmlyc3QtZGF5JykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5sYXN0LXdlZWstZGF5JykudGV4dChjYWwuZGF0YSgnc2hvd2VkLWxhc3QtZGF5JykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gRkFRcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG52YXIgZmFxc0Jhc2VVcmwgPSAnSGVscENlbnRlci8kRkFRcyc7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgZmFxc0Jhc2VVcmwgPSAoYmFzZVVybCB8fCAnLycpICsgZmFxc0Jhc2VVcmw7XHJcblxyXG4gIC8vIEVuYWJsZSBGQVFzIGxpbmtzIGluIHBvcHVwXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2FbaHJlZnw9XCIjRkFRc1wiXScsIHBvcHVwRmFxcyk7XHJcblxyXG4gIC8vIEF1dG8gb3BlbiBjdXJyZW50IGRvY3VtZW50IGxvY2F0aW9uIGlmIGhhc2ggaXMgYSBGQVEgbGlua1xyXG4gIGlmICgvXiNGQVFzL2kudGVzdChsb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgcG9wdXBGYXFzKGxvY2F0aW9uLmhhc2gpO1xyXG4gIH1cclxuXHJcbiAgLy8gcmV0dXJuIGFzIHV0aWxpdHlcclxuICByZXR1cm4gcG9wdXBGYXFzO1xyXG59O1xyXG5cclxuLyogUGFzcyBhIEZhcXMgQHVybCBvciB1c2UgYXMgYSBsaW5rIGhhbmRsZXIgdG8gb3BlbiB0aGUgRkFRIGluIGEgcG9wdXBcclxuICovXHJcbmZ1bmN0aW9uIHBvcHVwRmFxcyh1cmwpIHtcclxuICB1cmwgPSB0eXBlb2YgKHVybCkgPT09ICdzdHJpbmcnID8gdXJsIDogJCh0aGlzKS5hdHRyKCdocmVmJyk7XHJcblxyXG4gIHZhciB1cmxwYXJ0cyA9IHVybC5zcGxpdCgnLScpO1xyXG5cclxuICBpZiAodXJscGFydHNbMF0gIT0gJyNGQVFzJykge1xyXG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignVGhlIFVSTCBpcyBub3QgYSBGQVEgdXJsIChkb2VzblxcJ3Qgc3RhcnRzIHdpdGggI0ZBUXMtKScsIHVybCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHZhciB1cmxzZWN0aW9uID0gdXJscGFydHMubGVuZ3RoID4gMSA/IHVybHBhcnRzWzFdIDogJyc7XHJcblxyXG4gIGlmICh1cmxzZWN0aW9uKSB7XHJcbiAgICB2YXIgcHVwID0gcG9wdXAoZmFxc0Jhc2VVcmwgKyB1cmxzZWN0aW9uLCAnbGFyZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBkID0gJCh1cmwpLFxyXG4gICAgICAgIHBlbCA9IHB1cC5nZXRDb250ZW50RWxlbWVudCgpO1xyXG4gICAgICBwZWwuc2Nyb2xsVG9wKHBlbC5zY3JvbGxUb3AoKSArIGQucG9zaXRpb24oKS50b3AgLSA1MCk7XHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGQuZWZmZWN0KFwiaGlnaGxpZ2h0XCIsIHt9LCAyMDAwKTtcclxuICAgICAgfSwgNDAwKTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn0iLCIvKiBJTklUICovXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIExvY2F0aW9uIGpzLWRyb3Bkb3duXHJcbiAgICB2YXIgcyA9ICQoJyNzZWFyY2gtbG9jYXRpb24nKTtcclxuICAgIHMucHJvcCgncmVhZG9ubHknLCB0cnVlKTtcclxuICAgIHMuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IExDLnNlYXJjaExvY2F0aW9ucyxcclxuICAgICAgICBhdXRvRm9jdXM6IHRydWUsXHJcbiAgICAgICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBzLm9uKCdmb2N1cyBjbGljaycsIGZ1bmN0aW9uICgpIHsgcy5hdXRvY29tcGxldGUoJ3NlYXJjaCcsICcnKTsgfSk7XHJcblxyXG4gICAgLyogUG9zaXRpb25zIGF1dG9jb21wbGV0ZSAqL1xyXG4gICAgdmFyIHBvc2l0aW9uc0F1dG9jb21wbGV0ZSA9ICQoJyNzZWFyY2gtc2VydmljZScpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgICAgICBtaW5MZW5ndGg6IDAsXHJcbiAgICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICAgICAgIC8vJCh0aGlzKS52YWwodWkuaXRlbS5sYWJlbCk7XHJcbiAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvY3VzOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgICAgICAgLy8kKHRoaXMpLnZhbCh1aS5pdGVtLmxhYmVsKTtcclxuICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gTG9hZCBhbGwgcG9zaXRpb25zIGluIGJhY2tncm91bmQgdG8gcmVwbGFjZSB0aGUgYXV0b2NvbXBsZXRlIHNvdXJjZSAoYXZvaWRpbmcgbXVsdGlwbGUsIHNsb3cgbG9vay11cHMpXHJcbiAgICAvKiQuZ2V0SlNPTihMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgcG9zaXRpb25zQXV0b2NvbXBsZXRlLmF1dG9jb21wbGV0ZSgnb3B0aW9uJywgJ3NvdXJjZScsIGRhdGEpO1xyXG4gICAgfVxyXG4gICAgKTsqL1xyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gc29tZSBMZWdhbCBwYWdlcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KVxyXG4gICAgLm9uKCdjbGljaycsICcudmlldy1wcml2YWN5LXBvbGljeScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBwb3B1cChiYXNlVXJsICsgJ0hlbHBDZW50ZXIvJFByaXZhY3lQb2xpY3kvJywgJ2xhcmdlJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnLnZpZXctdGVybXMtb2YtdXNlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBvcHVwKGJhc2VVcmwgKyAnSGVscENlbnRlci8kVGVybXNPZlVzZS8nLCAnbGFyZ2UnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuKiBQcm92aWRlciBXZWxjb21lIHBhZ2VcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIFNpbXBsZVNsaWRlciA9IHJlcXVpcmUoJ0xDL1NpbXBsZVNsaWRlcicpO1xyXG5cclxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24gcHJvdmlkZXJXZWxjb21lKCkge1xyXG4gICQoJy5Qcm92aWRlcldlbGNvbWUgLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24nKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciB0ID0gJCh0aGlzKSxcclxuICAgICAgc2xpZGVyID0gbmV3IFNpbXBsZVNsaWRlcih7XHJcbiAgICAgICAgZWxlbWVudDogdCxcclxuICAgICAgICBzZWxlY3RvcnM6IHtcclxuICAgICAgICAgIHNsaWRlczogJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLXNsaWRlcycsXHJcbiAgICAgICAgICBzbGlkZTogJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLXNsaWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3VycmVudFNsaWRlQ2xhc3M6ICdqcy1pc0N1cnJlbnQnLFxyXG4gICAgICAgIGhyZWZQcmVmaXg6ICdnb1NsaWRlXycsXHJcbiAgICAgICAgLy8gRHVyYXRpb24gb2YgZWFjaCBzbGlkZSBpbiBtaWxsaXNlY29uZHNcclxuICAgICAgICBkdXJhdGlvbjogMTAwMFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAvLyBTbGlkZSBzdGVwcyBhY3Rpb25zIGluaXRpYWxseSBoaWRkZW4sIHZpc2libGUgYWZ0ZXIgJ3N0YXJ0J1xyXG4gICAgdmFyIHNsaWRlc0FjdGlvbnMgPSB0LmZpbmQoJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLWFjdGlvbnMtc2xpZGVzJykuaGlkZSgpO1xyXG4gICAgdC5maW5kKCcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1hY3Rpb25zLXN0YXJ0IC5zdGFydC1hY3Rpb24nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQodGhpcykuaGlkZSgpO1xyXG4gICAgICBzbGlkZXNBY3Rpb25zLmZhZGVJbigxMDAwKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKipcclxuKiBXZWxjb21lIHBvcHVwXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIGJvb3RzdHJhcCB0b29sdGlwczpcclxucmVxdWlyZSgnYm9vdHN0cmFwJyk7XHJcbnZhciBDb29raWUgPSByZXF1aXJlKCcuLi9MQy9Db29raWUnKTtcclxuLy9UT0RPIG1vcmUgZGVwZW5kZW5jaWVzP1xyXG5cclxudmFyIGluaXRpYWxpemVkID0gZmFsc2U7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0V2VsY29tZVBvcHVwKCkge1xyXG5cclxuICBleHBvcnRzLmF1dG9TaG93KCk7XHJcblxyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhLnNpZ24tdXAsIGEucmVnaXN0ZXIsIGEubmVlZC1sb2dpbiwgYnV0dG9uLm5lZWQtbG9naW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBSZW1vdmUgYW55IG9wZW5lZCBwb3B1cCAoaXQgb3ZlcmxheXMgdGhlIHdlbGNvbWVwb3B1cClcclxuICAgICQudW5ibG9ja1VJKCk7XHJcblxyXG4gICAgcmV0dXJuICFleHBvcnRzLnNob3coKTtcclxuICB9KTtcclxuXHJcbn07XHJcblxyXG5leHBvcnRzLmF1dG9TaG93ID0gZnVuY3Rpb24gYXV0b1Nob3dXZWxjb21lUG9wdXAoKSB7XHJcbiAgdmFyICR3cCA9ICQoJyN3ZWxjb21lcG9wdXAnKTtcclxuICB2YXIgJHdvID0gJCgnI3dlbGNvbWUtcG9wdXAtb3ZlcmxheScpO1xyXG5cclxuICAvLyBXaGVuIHRoZSBwb3B1cCBpcyBpbnRlZ3JhdGVkIGluIHRoZSBwYWdlIGluc3RlYWQgb2ZcclxuICAvLyB0aGUgbGF5b3V0LCBleGVjIHNob3cgYW5kIGNsb3NlIG9ycGhhbiBvdmVybGF5LlxyXG4gIGlmICgkd3AubGVuZ3RoICYmXHJcbiAgICAkd3AuaXMoJzp2aXNpYmxlJykgJiZcclxuICAgICR3cC5jbG9zZXN0KCcjd2VsY29tZS1wb3B1cC1vdmVybGF5JykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAkd28uaGlkZSgpO1xyXG4gICAgZXhwb3J0cy5zaG93KHRydWUpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH0gZWxzZSBpZiAoJHdvLmhhc0NsYXNzKCdhdXRvLXNob3cnKSkge1xyXG4gICAgZXhwb3J0cy5zaG93KHRydWUpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBleHBvcnRzLmFmdGVyQ2xvc2UoKTtcclxuICB9XHJcbn07XHJcblxyXG4vKiBEbyBzb21lIHRoaW5ncyBhZnRlciBjbG9zZSB0aGUgcG9wdXAgKi9cclxuZXhwb3J0cy5hZnRlckNsb3NlID0gZnVuY3Rpb24gYWZ0ZXJDbG9zZSgpIHtcclxuICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnc3RyaWN0LXdlbGNvbWUtcG9wdXAnKTtcclxufTtcclxuXHJcbmV4cG9ydHMuaW5pdFBvcHVwID0gZnVuY3Rpb24gaW5pdFBvcHVwKCkge1xyXG5cclxuICAgIHZhciBjID0gJCgnI3dlbGNvbWVwb3B1cCcpO1xyXG4gICAgaWYgKGMubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgdmFyIG92ZXJsYXkgPSBjLmNsb3Nlc3QoJyN3ZWxjb21lLXBvcHVwLW92ZXJsYXknKTtcclxuXHJcbiAgICBpZiAoYy5kYXRhKCdpcy1pbml0aWFsaXplZCcpKSByZXR1cm4gb3ZlcmxheTtcclxuXHJcbiAgICAvKipcclxuICAgIEdvIHRvIHRoZSBmaXJzdCBzdGVwIG9uIGEgYWxyZWFkeSBpbml0aWFsaXplZCBwb3B1cFxyXG4gICAgKiovXHJcbiAgICBmdW5jdGlvbiBzdGFydEFnYWluKGFuaW1hdGUpIHtcclxuICAgICAgICAvLyBSZXR1cm4gcG9wdXAgdG8gdGhlIGZpcnN0IHN0ZXAgKGNob29zZSBwcm9maWxlLCAjNDg2KSBhbmQgZXhpdCAtaW5pdCBpcyByZWFkeS1cclxuICAgICAgICAvLyBTaG93IGZpcnN0IHN0ZXBcclxuICAgICAgICB2YXIgc3RlcDEgPSBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSwgaGVhZGVyIC5wcmVzZW50YXRpb24nKTtcclxuICAgICAgICBpZiAoYW5pbWF0ZSlcclxuICAgICAgICAgICAgc3RlcDEuc2xpZGVEb3duKCdub3JtYWwnKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHN0ZXAxLnNob3coKTtcclxuICAgICAgICAvLyBIaWRlIHNlY29uZCBzdGVwXHJcbiAgICAgICAgdmFyIHN0ZXAyID0gYy5maW5kKCcudGVybXMsIC5wcm9maWxlLWRhdGEnKTtcclxuICAgICAgICBpZiAoYW5pbWF0ZSlcclxuICAgICAgICAgICAgc3RlcDIuc2xpZGVVcCgnbm9ybWFsJyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBzdGVwMi5oaWRlKCk7XHJcblxyXG4gICAgICAgIC8vIEhpZGUgYmFjay1hY3Rpb24gYnV0dG9uXHJcbiAgICAgICAgYy5maW5kKCcuYmFjay1hY3Rpb24nKS5oaWRlKCk7XHJcbiAgICAgICAgLy8gUmVzZXQgaGlkZGVuIGZpZWxkcyBwZXIgcHJvZmlsZS10eXBlXHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpOm5vdCgucG9zaXRpb24tZGVzY3JpcHRpb24pJykuc2hvdygpO1xyXG4gICAgICAgIC8vIFJlc2V0IGNob29zZW4gcHJvZmlsZS10eXBlXHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICAgICAgLy8gUmVzZXQgVVJMcyBwZXIgcHJvZmlsZS10eXBlXHJcbiAgICAgICAgYy5maW5kKCdhLnRlcm1zLW9mLXVzZScpLmRhdGEoJ3Rvb2x0aXAtdXJsJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gJCh0aGlzKS5hdHRyKCdkYXRhLXRvb2x0aXAtdXJsJyk7IH0pO1xyXG4gICAgICAgIC8vIFJlc2V0IHZhbGlkYXRpb24gcnVsZXNcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGkgaW5wdXQ6bm90KFt0eXBlPWhpZGRlbl0pJylcclxuICAgICAgICAuYXR0cignZGF0YS12YWwnLCBudWxsKVxyXG4gICAgICAgIC5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChpbml0aWFsaXplZCkge1xyXG4gICAgICAgIHN0YXJ0QWdhaW4oKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBjbG9zZSBidXR0b24gbG9naWMgYW5kIG9ubHkgd2hlbiBhcyBwb3B1cCAoaXQgaGFzIG92ZXJsYXkpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSBjLmZpbmQoJy5jbG9zZS1wb3B1cCwgW2hyZWY9XCIjY2xvc2UtcG9wdXBcIl0nKTtcclxuICAgIGlmIChvdmVybGF5Lmxlbmd0aCA9PT0gMClcclxuICAgICAgICBjbG9zZUJ1dHRvbi5oaWRlKCk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgY2xvc2VCdXR0b24uc2hvdygpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgb3ZlcmxheS5mYWRlT3V0KCdub3JtYWwnKTtcclxuICAgICAgICAgICAgQ29va2llLnNldCgnV2VsY29tZVBvcHVwVmlzaWJsZScsICdmYWxzZScpO1xyXG4gICAgICAgICAgICBleHBvcnRzLmFmdGVyQ2xvc2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIGdvIGJhY2sgYnV0dG9uXHJcbiAgICBjLmZpbmQoJy5iYWNrLWFjdGlvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgc3RhcnRBZ2Fpbih0cnVlKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBQb3BvdmVycyBmb3IgdG9vbHRpcCByZXBsYWNlbWVudFxyXG4gICAgYy5maW5kKCdbZGF0YS10b2dnbGU9XCJwb3BvdmVyXCJdJylcclxuICAgIC5wb3BvdmVyKClcclxuICAgIC5maWx0ZXIoJ2FbaHJlZj1cIiNcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIC8vIEF2b2lkIG5hdmlnYXRlIHRvIHRoZSBsaW5rXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHNraXBTdGVwMSA9IGMuaGFzQ2xhc3MoJ3NlbGVjdC1wb3NpdGlvbicpO1xyXG5cclxuICAgIC8vIEluaXRcclxuICAgIGlmICghc2tpcFN0ZXAxKSB7XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhLCAudGVybXMsIC5wb3NpdGlvbi1kZXNjcmlwdGlvbicpLmhpZGUoKTtcclxuICAgIH1cclxuICAgIGMuZmluZCgnZm9ybScpLmdldCgwKS5yZXNldCgpO1xyXG5cclxuICAgIC8vIERlc2NyaXB0aW9uIHNob3ctdXAgb24gYXV0b2NvbXBsZXRlIHZhcmlhdGlvbnNcclxuICAgIHZhciBzaG93UG9zaXRpb25EZXNjcmlwdGlvbiA9IHtcclxuICAgICAgICAvKipcclxuICAgICAgICBTaG93IGRlc2NyaXB0aW9uIGluIGEgdGV4dGFyZWEgdW5kZXIgdGhlIHBvc2l0aW9uIHNpbmd1bGFyLFxyXG4gICAgICAgIGl0cyBzaG93ZWQgb24gZGVtYW5kLlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHRleHRhcmVhOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIGMuZmluZCgnLnBvc2l0aW9uLWRlc2NyaXB0aW9uJylcclxuICAgICAgICAgICAgLnNsaWRlRG93bignZmFzdCcpXHJcbiAgICAgICAgICAgIC5maW5kKCd0ZXh0YXJlYScpLnZhbCh1aS5pdGVtLmRlc2NyaXB0aW9uKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgIFNob3cgZGVzY3JpcHRpb24gaW4gYSB0b29sdGlwIHRoYXQgY29tZXMgZnJvbSB0aGUgcG9zaXRpb24gc2luZ3VsYXJcclxuICAgICAgICBmaWVsZFxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIHRvb2x0aXA6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgLy8gSXQgbmVlZHMgdG8gYmUgZGVzdHJveWVkIChubyBwcm9ibGVtIHRoZSBmaXJzdCB0aW1lKVxyXG4gICAgICAgICAgICAvLyB0byBnZXQgaXQgdXBkYXRlZCBvbiBzdWNjZXNpdmUgYXR0ZW1wdHNcclxuICAgICAgICAgICAgdmFyIGVsID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgZWxcclxuICAgICAgICAgICAgLnBvcG92ZXIoJ2Rlc3Ryb3knKVxyXG4gICAgICAgICAgICAucG9wb3Zlcih7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0RvZXMgdGhpcyBzb3VuZCBsaWtlIHlvdT8nLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogdWkuaXRlbS5kZXNjcmlwdGlvbixcclxuICAgICAgICAgICAgICAgIHRyaWdnZXI6ICdmb2N1cycsXHJcbiAgICAgICAgICAgICAgICAvLyBEaWZmZXJlbnQgcGxhY2VtZW50IGZvciBtb2JpbGUgZGVzaWduICh1cCB0byA2NDBweCB3aWRlKSB0byBhdm9pZCBiZWluZyBoaWRkZW5cclxuICAgICAgICAgICAgICAgIHBsYWNlbWVudDogJCgnaHRtbCcpLndpZHRoKCkgPCA2NDAgPyAndG9wJyA6ICdsZWZ0J1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAucG9wb3Zlcignc2hvdycpXHJcbiAgICAgICAgICAgIC8vIEhpZGUgb24gcG9zc2libGUgcG9zaXRpb24gbmFtZSBjaGFuZ2UgdG8gYXZvaWQgY29uZnVzaW9uc1xyXG4gICAgICAgICAgICAvLyAod2UgY2FuJ3QgdXNlIG9uLWNoYW5nZSwgbmVlZCB0byBiZSBrZXlwcmVzczsgaXRzIG5hbWVzcGFjZWRcclxuICAgICAgICAgICAgLy8gdG8gbGV0IG9mZiBhbmQgb24gZXZlcnkgdGltZSB0byBhdm9pZCBtdWx0aXBsZSBoYW5kbGVyIHJlZ2lzdHJhdGlvbnMpXHJcbiAgICAgICAgICAgIC5vZmYoJ2tleXByZXNzLmRlc2NyaXB0aW9uLXRvb2x0aXAnKVxyXG4gICAgICAgICAgICAub24oJ2tleXByZXNzLmRlc2NyaXB0aW9uLXRvb2x0aXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBlbC5wb3BvdmVyKCdoaWRlJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gUmUtZW5hYmxlIGF1dG9jb21wbGV0ZTpcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBjLmZpbmQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpOyB9LCA1MDApO1xyXG4gICAgZnVuY3Rpb24gc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzZWxldENhbGxiYWNrKSB7XHJcbiAgICAgICAgYy5maW5kKCdbbmFtZT1qb2J0aXRsZV0nKS5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgICAgICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgICAgICAgICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgIC8vIE5vIHZhbHVlLCBubyBhY3Rpb24gOihcclxuICAgICAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0udmFsdWUpIHJldHVybjtcclxuICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGlkICh2YWx1ZSkgaW4gdGhlIGhpZGRlbiBlbGVtZW50XHJcbiAgICAgICAgICAgICAgICBjLmZpbmQoJ1tuYW1lPXBvc2l0aW9uaWRdJykudmFsKHVpLml0ZW0udmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHNlbGV0Q2FsbGJhY2suY2FsbCh0aGlzLCBldmVudCwgdWkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgdG8gc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcikgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzaG93UG9zaXRpb25EZXNjcmlwdGlvbi50b29sdGlwKTtcclxuICAgIGMuZmluZCgnI3dlbGNvbWVwb3B1cExvYWRpbmcnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBBY3Rpb25zXHJcbiAgICBmdW5jdGlvbiBzaG93U3RlcDIoYW5pbWF0ZSkge1xyXG5cclxuICAgICAgICB2YXIgJHByb2ZpbGUgPSBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdOmNoZWNrZWQnKTtcclxuICAgICAgICB2YXIgcHJvZmlsZSA9ICRwcm9maWxlLnZhbCgpO1xyXG5cclxuICAgICAgICAvLyBTaG93IGJhY2stYWN0aW9uIGJ1dHRvblxyXG4gICAgICAgIGMuZmluZCgnLmJhY2stYWN0aW9uJykuc2hvdygpO1xyXG5cclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGk6bm90KC4nICsgcHJvZmlsZSArICcpJykuaGlkZSgpO1xyXG4gICAgICAgIHZhciAkcHJlc2VudGF0aW9uID0gYy5maW5kKCcucHJvZmlsZS1jaG9pY2UsIGhlYWRlciAucHJlc2VudGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKGFuaW1hdGUpXHJcbiAgICAgICAgICAgICRwcmVzZW50YXRpb24uc2xpZGVVcCgnbm9ybWFsJyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAkcHJlc2VudGF0aW9uLmhpZGUoKTtcclxuXHJcbiAgICAgICAgdmFyICRwcm9mRGF0YSA9IGMuZmluZCgnLnRlcm1zLCAucHJvZmlsZS1kYXRhJyk7XHJcbiAgICAgICAgaWYgKGFuaW1hdGUpXHJcbiAgICAgICAgICAgICRwcm9mRGF0YS5zbGlkZURvd24oJ25vcm1hbCcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJHByb2ZEYXRhLnNob3coKTtcclxuXHJcbiAgICAgICAgLy8gVGVybXMgb2YgdXNlIGRpZmZlcmVudCBmb3IgcHJvZmlsZSB0eXBlXHJcbiAgICAgICAgaWYgKHByb2ZpbGUgPT0gJ2N1c3RvbWVyJylcclxuICAgICAgICAgICAgYy5maW5kKCdhLnRlcm1zLW9mLXVzZScpLmRhdGEoJ3Rvb2x0aXAtdXJsJywgbnVsbCk7XHJcbiAgICAgICAgLy8gQ2hhbmdlIGZhY2Vib29rIHJlZGlyZWN0IGxpbmtcclxuICAgICAgICB2YXIgZmJjID0gYy5maW5kKCcuZmFjZWJvb2stY29ubmVjdCcpO1xyXG4gICAgICAgIHZhciBhZGRSZWRpcmVjdCA9ICdjdXN0b21lcnMnO1xyXG4gICAgICAgIGlmIChwcm9maWxlID09ICdwcm92aWRlcicpXHJcbiAgICAgICAgICAgIGFkZFJlZGlyZWN0ID0gJ3Byb3ZpZGVycyc7XHJcbiAgICAgICAgZmJjLmRhdGEoJ3JlZGlyZWN0JywgZmJjLmRhdGEoJ3JlZGlyZWN0JykgKyBhZGRSZWRpcmVjdCk7XHJcbiAgICAgICAgZmJjLmRhdGEoJ3Byb2ZpbGUnLCBwcm9maWxlKTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHZhbGlkYXRpb24tcmVxdWlyZWQgZm9yIGRlcGVuZGluZyBvZiBwcm9maWxlLXR5cGUgZm9ybSBlbGVtZW50czpcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGkuJyArIHByb2ZpbGUgKyAnIGlucHV0Om5vdChbZGF0YS12YWxdKTpub3QoW3R5cGU9aGlkZGVuXSknKVxyXG4gICAgICAgIC5hdHRyKCdkYXRhLXZhbC1yZXF1aXJlZCcsICcnKVxyXG4gICAgICAgIC5hdHRyKCdkYXRhLXZhbCcsIHRydWUpO1xyXG5cclxuICAgICAgICAvLyBGb3IgY3VzdG9tZXJzIGJlY29tZSBwcm92aWRlciwgaGlkZSBuZXctYWNjb3VudCBmaWVsZHNcclxuICAgICAgICBleGlzdGluZ1VzZXJIaWRlRmllbGRzKGMpO1xyXG5cclxuICAgICAgICAvLyBpZiBGYWNlYm9vayBDb25uZWN0IGlzIGluIHVzZSwgdXBkYXRlIGZpZWxkcyBhbmQgdmFsaWRhdGlvbnNcclxuICAgICAgICBmYWNlYm9va1VwZGF0ZUZpZWxkc1N0YXR1cyhjKTtcclxuXHJcbiAgICAgICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgICB9XHJcbiAgICBjLm9uKCdjaGFuZ2UnLCAnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV0nLCBzaG93U3RlcDIuYmluZChudWxsLCB0cnVlKSk7XHJcbiAgICBjLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLmFqYXgnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzaG93UG9zaXRpb25EZXNjcmlwdGlvbi50b29sdGlwKTtcclxuICAgICAgICBzaG93U3RlcDIoZmFsc2UpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSWYgcHJvZmlsZSB0eXBlIGlzIHByZWZpbGxlZCBieSByZXF1ZXN0LCBzaG93IHN0ZXAyIGFscmVhZHk6XHJcbiAgICBpZiAoYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXTpjaGVja2VkJykubGVuZ3RoKVxyXG4gICAgICAgIHNob3dTdGVwMihmYWxzZSk7XHJcblxyXG4gICAgYy5vbignY2xpY2snLCAnLmZhY2Vib29rLWNvbm5lY3QnLCBmYWNlYm9va0Nvbm5lY3QuYmluZChudWxsLCBjKSk7XHJcblxyXG4gICAgYy5kYXRhKCdpcy1pbml0aWFsaXplZCcsIHRydWUpO1xyXG4gICAgcmV0dXJuIG92ZXJsYXk7XHJcbn07XHJcblxyXG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbiBzaG93UG9wdXAoZnJvbUF1dG9TaG93KSB7XHJcblxyXG4gICAgdmFyIG92ZXJsYXkgPSBleHBvcnRzLmluaXRQb3B1cCgpO1xyXG5cclxuICAgIGlmIChvdmVybGF5ICYmIG92ZXJsYXkubGVuZ3RoKSB7XHJcbiAgICAgICAgLy8gSXRzIGEgY29va2llIHdhcyBzZXQgdG8gcmVtZW1iZXIgdGhlIHBvcHVwIHdhcyBjbG9zZWRcclxuICAgICAgICAvLyAoYmVjYXVzZSB3YXMgY2xvc2FibGUpLCBhdm9pZCB0byBzaG93IGl0XHJcbiAgICAgICAgaWYgKCFmcm9tQXV0b1Nob3cgfHxcclxuICAgICAgICAgICAgQ29va2llLmdldCgnV2VsY29tZVBvcHVwVmlzaWJsZScpICE9PSAnZmFsc2UnKSB7XHJcbiAgICAgICAgICAgIG92ZXJsYXkuZmFkZUluKDMwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBleHBvcnRzLmFmdGVyQ2xvc2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFsbCBmaW5lXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBlbHNlIHJldHVybiBmYWxzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgQXR0ZW1wdCB0byBsb2dpbiB3aXRoIEZhY2Vib29rIENvbm5lY3QsIFxyXG4gICAgYW5kIGZpbGwgdGhlIGZvcm0gd2l0aCB0aGUgZGF0YSBmcm9tIEZhY2Vib29rXHJcbioqL1xyXG5mdW5jdGlvbiBmYWNlYm9va0Nvbm5lY3QoJGNvbnRhaW5lcikge1xyXG4gICAgdmFyIGZiID0gcmVxdWlyZSgnLi4vTEMvZmFjZWJvb2tVdGlscycpO1xyXG5cclxuICAgIGZiLmxvZ2luKHsgc2NvcGU6ICdlbWFpbCx1c2VyX2Fib3V0X21lJyB9LCBmdW5jdGlvbiAoYXV0aCwgRkIpIHtcclxuICAgICAgICAvLyBTZXQgRmFjZWJvb2tJZCB0byBsaW5rIGFjY291bnRzOlxyXG4gICAgICAgICRjb250YWluZXIuZmluZCgnW25hbWU9XCJmYWNlYm9va2lkXCJdJykudmFsKGF1dGgudXNlcklEKTtcclxuICAgICAgICAvLyBSZXF1ZXN0IG1vcmUgdXNlciBkYXRhXHJcbiAgICAgICAgRkIuYXBpKCcvbWUnLCBmdW5jdGlvbiAodXNlcikge1xyXG4gICAgICAgICAgICAvL0ZpbGwgRGF0YVxyXG4gICAgICAgICAgICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiZW1haWxcIl0nKS52YWwodXNlci5lbWFpbCk7XHJcbiAgICAgICAgICAgICRjb250YWluZXIuZmluZCgnW25hbWU9XCJmaXJzdG5hbWVcIl0nKS52YWwodXNlci5maXJzdF9uYW1lKTtcclxuICAgICAgICAgICAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImxhc3RuYW1lXCJdJykudmFsKHVzZXIubGFzdF9uYW1lKTtcclxuICAgICAgICAgICAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImdlbmRlclwiXScpLnZhbCh1c2VyLmdlbmRlcik7XHJcbiAgICAgICAgICAgICRjb250YWluZXIuZmluZCgnW25hbWU9XCJhYm91dFwiXScpLnZhbCh1c2VyLmFib3V0KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChmYWNlYm9va1VwZGF0ZUZpZWxkc1N0YXR1cygkY29udGFpbmVyKSkge1xyXG4gICAgICAgICAgICAgICAgY2hlY2tVc2VyRm9yRmFjZWJvb2tMb2dpbihhdXRoLnVzZXJJRCwgJGNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBJdCB0cmlnZ2VycyBhbiB1cGRhdGUgb24gdGhlIHN0YXR1cyBvZiBmaWVsZHMgYWZmZWN0ZWRcclxuICAgIGJ5IGEgRmFjZWJvb2sgQ29ubmVjdDogc29tZSBtdXN0IGJlIGhpZGRlbiwgb3RoZXJzIHNob3dlZCxcclxuICAgIHNvbWUgbm90ZXMgYXBwZWFyIGFuZCBzb21lIGZpZWxkIGJlY29tZXMgb3B0aW9uYWwuXHJcbiAgICBJZiB0aGVyZSBpcyBubyBhbiBhY3RpdmUgRmFjZWJvb2sgQ29ubmVjdGlvbi9JZCwgaXRcclxuICAgIGRvZXMgbm90aGluZyBhbmQgcmV0dXJuIGZhbHNlLlxyXG4qKi9cclxuZnVuY3Rpb24gZmFjZWJvb2tVcGRhdGVGaWVsZHNTdGF0dXMoJGNvbnRhaW5lcikge1xyXG5cclxuICAgIC8vIGlmIEZhY2Vib29rIENvbm5lY3QgaXMgaW4gdXNlXHJcbiAgICBpZiAoJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImZhY2Vib29raWRcIl0nKS52YWwoKSkge1xyXG4gICAgICAgIC8vIHJlbW92ZSB2YWxpZGF0aW9uIG9uIHBhc3N3b3JkXHJcbiAgICAgICAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImNyZWF0ZS1wYXNzd29yZFwiXScpXHJcbiAgICAgICAgICAgIC5hdHRyKCdkYXRhLXZhbC1yZXF1aXJlZCcsIG51bGwpXHJcbiAgICAgICAgICAgIC5hdHRyKCdkYXRhLXZhbCcsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgdmFyIGZlbWFpbCA9ICRjb250YWluZXIuZmluZCgnW25hbWU9XCJlbWFpbFwiXScpO1xyXG4gICAgICAgIHZhciBmZmlyc3QgPSAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiZmlyc3RuYW1lXCJdJyk7XHJcbiAgICAgICAgdmFyIGZsYXN0ID0gJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImxhc3R0bmFtZVwiXScpO1xyXG5cclxuICAgICAgICAvLyBIaWRlIGRhdGEgc3VjY2Vzc2Z1bGx5IGZpbGxlZFxyXG4gICAgICAgIGlmIChmZmlyc3QudmFsKCkpXHJcbiAgICAgICAgICAgIGZmaXJzdC5jbG9zZXN0KCdsaScpLmhpZGUoKTtcclxuICAgICAgICBpZiAoZmxhc3QudmFsKCkpXHJcbiAgICAgICAgICAgIGZsYXN0LmNsb3Nlc3QoJ2xpJykuaGlkZSgpO1xyXG5cclxuICAgICAgICAvLyBFbWFpbCBpcyBzcGVjaWFsLCByZXF1aXJlcyBjb25maXJtYXRpb24gIzUzOCxcclxuICAgICAgICBmZW1haWwuc2hvdygpLmNsb3Nlc3QoJ2xpJykuc2hvdygpO1xyXG4gICAgICAgIC8vIHNob3dpbmcgYWRkaXRpb25hbCBtZXNzYWdlLFxyXG4gICAgICAgIGZlbWFpbC5zaWJsaW5ncygnLmZhY2Vib29rLW5vdGUnKS5zaG93KCk7XHJcblxyXG4gICAgICAgIC8vIE1lc3NhZ2UgdG8gbm90aWZpZWQgdXNlciBpcyBjb25uZWN0ZWQgd2l0aCBGYWNlYm9va1xyXG4gICAgICAgICRjb250YWluZXIuZmluZCgnLmZhY2Vib29rLWxvZ2dlZCcpLnNob3coKTtcclxuICAgICAgICAvLyBhbmQgaGlkZGluZyB0aGUgYnV0dG9uXHJcbiAgICAgICAgJGNvbnRhaW5lci5maW5kKCcuZmFjZWJvb2stY29ubmVjdCcpLmhpZGUoKTtcclxuICAgICAgICAkY29udGFpbmVyLmZpbmQoJy5jaG9pY2Utb3InKS5oaWRlKCk7XHJcblxyXG4gICAgICAgIC8vIFBhc3N3b3JkIGlzIHNwZWNpYWwgdG9vLCBubyBuZWVkZWQgd2l0aCBGYWNlYm9va1xyXG4gICAgICAgICRjb250YWluZXIuZmluZCgnW25hbWU9XCJjcmVhdGUtcGFzc3dvcmRcIl0nKS5jbG9zZXN0KCdsaScpLmhpZGUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV4aXN0aW5nVXNlckhpZGVGaWVsZHMoJGNvbnRhaW5lcikge1xyXG4gICAgdmFyIGZ1aWQgPSAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwidXNlcmlkXCJdJyksXHJcbiAgICAgICAgZmVtYWlsID0gJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImVtYWlsXCJdJyksXHJcbiAgICAgICAgZnB3ZCA9ICRjb250YWluZXIuZmluZCgnW25hbWU9XCJjcmVhdGUtcGFzc3dvcmRcIl0nKTtcclxuICAgIC8vIFRoZXJlIGlzIGFuIGV4aXN0aW5nIHVzZXIgKHdpdGggdXNlcmlkOyBqdXN0IGNoZWNrIHRoZSBlbWFpbCBcclxuICAgIC8vIGZvciBhIHZhbHVlIGlzIGJ1Z2d5LCBjYXVzaW5nICM1OTRcclxuICAgIGlmIChmdWlkLnZhbCgpKSB7XHJcbiAgICAgICAgLy8gSGlkZSBlbWFpbCBhbmQgcGFzc3dvcmQgZmllbGRzXHJcbiAgICAgICAgZmVtYWlsLmNsb3Nlc3QoJ2xpJykuaGlkZSgpO1xyXG4gICAgICAgIGZwd2QuY2xvc2VzdCgnbGknKS5oaWRlKCk7XHJcblxyXG4gICAgICAgIC8vIHJlbW92ZSB2YWxpZGF0aW9uIG9uIHBhc3N3b3JkXHJcbiAgICAgICAgZnB3ZFxyXG4gICAgICAgICAgICAuYXR0cignZGF0YS12YWwtcmVxdWlyZWQnLCBudWxsKVxyXG4gICAgICAgICAgICAuYXR0cignZGF0YS12YWwnLCBmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKiBQaW5nIG91ciBzZXJ2ZXIgZm9yIGFueSBleGlzdGluZyB1c2VyIHRoYXQgbWF0Y2hlcyBcclxuICAgIHRoZSBsb2dnZWQgRmFjZWJvb2tJRCBhbmQgdXBkYXRlIFVJIG5vdGlmeWluZyB0aGF0XHJcbioqL1xyXG52YXIgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi4vTEMvYmxvY2tQcmVzZXRzJyksXHJcbiAgICBMY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi4vTEMvcmVkaXJlY3RUbycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5mdW5jdGlvbiBjaGVja1VzZXJGb3JGYWNlYm9va0xvZ2luKGZhY2Vib29rSUQsICRjb250YWluZXIpIHtcclxuICAgIC8vIERvIGEgc2VydmVyIHNpZGUgcXVlcnkgdG8gZ2V0IGRhdGEgZm9yIHRoZSBleGlzdGluZyBJRCBcclxuICAgIC8vIGFzb2NpYXRlZCB3aXRoIHRoZSBmYWNlYm9va0lEIGFjY291bnQsIElGIEFOWS5cclxuICAgICRjb250YWluZXIuYmxvY2soYmxvY2tQcmVzZXRzLmxvYWRpbmcpO1xyXG4gICAgLy8gVGhlIGNhbGwgbXVzdCBpbmNsdWRlIHRoZSBGYWNlYm9vayBJRCBwYXJhbWV0ZXJcclxuICAgIC8vIGFuZCB0aGUgRmFjZWJvb2sgbG9naW4gY29va2llXHJcbiAgICAkLmdldEpTT04oTGNVcmwuUmVzdFBhdGggKyAnZmFjZWJvb2stdXNlcicsIHtcclxuICAgICAgICBmYWNlYm9va19pZDogZmFjZWJvb2tJRCxcclxuICAgICAgICBkb19sb2dpbjogdHJ1ZVxyXG4gICAgfSkuZG9uZShmdW5jdGlvbiAoZGF0YSkge1xyXG5cclxuICAgICAgICB2YXIgaXNDdXN0b21lciA9ICgkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwicHJvZmlsZS10eXBlXCJdOmNoZWNrZWQnKS52YWwoKSA9PT0gJ2N1c3RvbWVyJyk7XHJcblxyXG4gICAgICAgICRjb250YWluZXIuZmluZCgnW25hbWU9XCJlbWFpbFwiXScpXHJcbiAgICAgICAgLnZhbChkYXRhLnVzZXIuZW1haWwpXHJcbiAgICAgICAgLnByb3AoJ3JlYWRPbmx5JywgdHJ1ZSlcclxuICAgICAgICAuaGlkZSgpXHJcbiAgICAgICAgLnNpYmxpbmdzKCcuZmFjZWJvb2stbm90ZScpXHJcbiAgICAgICAgLmhpZGUoKTtcclxuXHJcbiAgICAgICAgdmFyIGZ6aXAgPSAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiemlwY29kZVwiXScpXHJcbiAgICAgICAgLnZhbChkYXRhLnVzZXIucG9zdGFsQ29kZSk7XHJcbiAgICAgICAgaWYgKGZ6aXAudmFsKCkpIGZ6aXAuaGlkZSgpO1xyXG5cclxuICAgICAgICAkY29udGFpbmVyLmZpbmQoJy5mYWNlYm9vay1sb2dnZWQnKS5oaWRlKCk7XHJcbiAgICAgICAgJGNvbnRhaW5lci5maW5kKCcuZmFjZWJvb2stbG9nZ2VkLWlzLXVzZXInKVxyXG4gICAgICAgIC5zaG93KClcclxuICAgICAgICAuZmluZCgnLnByb3ZpZGVyJykudG9nZ2xlKCFpc0N1c3RvbWVyKTtcclxuXHJcbiAgICAgICAgLy8gRm9yIGN1c3RvbWVycywgZ28gSG9tZSBvciBqdXN0IHJlbG9hZFxyXG4gICAgICAgIGlmIChpc0N1c3RvbWVyKSB7XHJcbiAgICAgICAgICAgIHJlZGlyZWN0VG8oTGNVcmwuTGFuZ1BhdGgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9KS5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRjb250YWluZXIudW5ibG9jaygpO1xyXG4gICAgfSk7XHJcbn1cclxuIiwiXG5cblxuLypcbiogQHZlcnNpb24gIDAuNS4wXG4qIEBhdXRob3IgICBMYXVyaSBSb29kZW4gLSBodHRwczovL2dpdGh1Yi5jb20vbGl0ZWpzL2RhdGUtZm9ybWF0LWxpdGVcbiogQGxpY2Vuc2UgIE1JVCBMaWNlbnNlICAtIGh0dHA6Ly9sYXVyaS5yb29kZW4uZWUvbWl0LWxpY2Vuc2UudHh0XG4qL1xuXG5cblxuIWZ1bmN0aW9uKERhdGUsIHByb3RvKSB7XG5cdHZhciBtYXNrUmUgPSAvKFtcIiddKSgoPzpbXlxcXFxdfFxcXFwuKSo/KVxcMXxZWVlZfChbTURdKVxcM1xcMyhcXDM/KXxTU3woW1lNREhobXNXXSkoXFw1Pyl8W3VVQVpTd29dL2dcblx0LCB5ZWFyRmlyc3RSZSA9IC8oXFxkezR9KVstLlxcL10oXFxkXFxkPylbLS5cXC9dKFxcZFxcZD8pL1xuXHQsIGRhdGVGaXJzdFJlID0gLyhcXGRcXGQ/KVstLlxcL10oXFxkXFxkPylbLS5cXC9dKFxcZHs0fSkvXG5cdCwgdGltZVJlID0gLyhcXGRcXGQ/KTooXFxkXFxkKTo/KFxcZFxcZCk/XFwuPyhcXGR7M30pPyg/OlxccyooPzooYSl8KHApKVxcLj9tXFwuPyk/KFxccyooPzpafEdNVHxVVEMpPyg/OihbLStdXFxkXFxkKTo/KFxcZFxcZCk/KT8pPy9pXG5cdCwgd29yZFJlID0gLy5bYS16XSsvZ1xuXHQsIHVuZXNjYXBlUmUgPSAvXFxcXCguKS9nXG5cdC8vLCBpc29EYXRlUmUgPSAvKFxcZHs0fSlbLS5cXC9dVyhcXGRcXGQ/KVstLlxcL10oXFxkKS9cblx0XG5cblx0Ly8gSVNPIDg2MDEgc3BlY2lmaWVzIG51bWVyaWMgcmVwcmVzZW50YXRpb25zIG9mIGRhdGUgYW5kIHRpbWUuXG5cdC8vXG5cdC8vIFRoZSBpbnRlcm5hdGlvbmFsIHN0YW5kYXJkIGRhdGUgbm90YXRpb24gaXNcblx0Ly8gWVlZWS1NTS1ERFxuXHQvL1xuXHQvLyBUaGUgaW50ZXJuYXRpb25hbCBzdGFuZGFyZCBub3RhdGlvbiBmb3IgdGhlIHRpbWUgb2YgZGF5IGlzXG5cdC8vIGhoOm1tOnNzXG5cdC8vXG5cdC8vIFRpbWUgem9uZVxuXHQvL1xuXHQvLyBUaGUgc3RyaW5ncyAraGg6bW0sICtoaG1tLCBvciAraGggKGFoZWFkIG9mIFVUQylcblx0Ly8gLWhoOm1tLCAtaGhtbSwgb3IgLWhoICh0aW1lIHpvbmVzIHdlc3Qgb2YgdGhlIHplcm8gbWVyaWRpYW4sIHdoaWNoIGFyZSBiZWhpbmQgVVRDKVxuXHQvL1xuXHQvLyAxMjowMFogPSAxMzowMCswMTowMCA9IDA3MDAtMDUwMFxuXHRcblx0RGF0ZVtwcm90b10uZm9ybWF0ID0gZnVuY3Rpb24obWFzaykge1xuXHRcdG1hc2sgPSBEYXRlLm1hc2tzW21hc2tdIHx8IG1hc2sgfHwgRGF0ZS5tYXNrc1tcImRlZmF1bHRcIl1cblxuXHRcdHZhciBzZWxmID0gdGhpc1xuXHRcdCwgZ2V0ID0gXCJnZXRcIiArIChtYXNrLnNsaWNlKDAsNCkgPT0gXCJVVEM6XCIgPyAobWFzaz1tYXNrLnNsaWNlKDQpLCBcIlVUQ1wiKTpcIlwiKVxuXG5cdFx0cmV0dXJuIG1hc2sucmVwbGFjZShtYXNrUmUsIGZ1bmN0aW9uKG1hdGNoLCBxdW90ZSwgdGV4dCwgTUQsIE1ENCwgc2luZ2xlLCBwYWQpIHtcblx0XHRcdHRleHQgPSBzaW5nbGUgPT0gXCJZXCIgICA/IHNlbGZbZ2V0ICsgXCJGdWxsWWVhclwiXSgpICUgMTAwXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiWVlZWVwiID8gc2VsZltnZXQgKyBcIkZ1bGxZZWFyXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwiTVwiICAgPyBzZWxmW2dldCArIFwiTW9udGhcIl0oKSsxXG5cdFx0XHRcdCA6IE1EICAgICA9PSBcIk1cIiA/IERhdGUubW9udGhOYW1lc1sgc2VsZltnZXQgKyBcIk1vbnRoXCJdKCkrKE1ENCA/IDEyIDogMCkgXVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJEXCIgICA/IHNlbGZbZ2V0ICsgXCJEYXRlXCJdKClcblx0XHRcdFx0IDogTUQgICAgID09IFwiRFwiID8gRGF0ZS5kYXlOYW1lc1sgc2VsZltnZXQgKyBcIkRheVwiXSgpICsgKE1ENCA/IDc6MCApIF1cblx0XHRcdFx0IDogc2luZ2xlID09IFwiSFwiICAgPyBzZWxmW2dldCArIFwiSG91cnNcIl0oKSAlIDEyIHx8IDEyXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcImhcIiAgID8gc2VsZltnZXQgKyBcIkhvdXJzXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwibVwiICAgPyBzZWxmW2dldCArIFwiTWludXRlc1wiXSgpXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcInNcIiAgID8gc2VsZltnZXQgKyBcIlNlY29uZHNcIl0oKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlNcIiAgICA/IHNlbGZbZ2V0ICsgXCJNaWxsaXNlY29uZHNcIl0oKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlNTXCIgICA/IChxdW90ZSA9IHNlbGZbZ2V0ICsgXCJNaWxsaXNlY29uZHNcIl0oKSwgcXVvdGUgPiA5OSA/IHF1b3RlIDogKHF1b3RlID4gOSA/IFwiMFwiIDogXCIwMFwiICkgKyBxdW90ZSlcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJ1XCIgICAgPyAoc2VsZi8xMDAwKT4+PjBcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJVXCIgICAgPyArc2VsZlxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIkFcIiAgICA/IERhdGVbc2VsZltnZXQgKyBcIkhvdXJzXCJdKCkgPiAxMSA/IFwicG1cIiA6IFwiYW1cIl1cblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJaXCIgICAgPyBcIkdNVCBcIiArICgtc2VsZi5nZXRUaW1lem9uZU9mZnNldCgpLzYwKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIndcIiAgICA/IHNlbGZbZ2V0ICsgXCJEYXlcIl0oKSB8fCA3XG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcIldcIiAgID8gKHF1b3RlID0gbmV3IERhdGUoK3NlbGYgKyAoKDQgLSAoc2VsZltnZXQgKyBcIkRheVwiXSgpfHw3KSkgKiA4NjQwMDAwMCkpLCBNYXRoLmNlaWwoKChxdW90ZS5nZXRUaW1lKCktcXVvdGVbXCJzXCIgKyBnZXQuc2xpY2UoMSkgKyBcIk1vbnRoXCJdKDAsMSkpIC8gODY0MDAwMDAgKyAxICkgLyA3KSApXG5cdFx0XHRcdCA6IG1hdGNoID09IFwib1wiICAgID8gbmV3IERhdGUoK3NlbGYgKyAoKDQgLSAoc2VsZltnZXQgKyBcIkRheVwiXSgpfHw3KSkgKiA4NjQwMDAwMCkpW2dldCArIFwiRnVsbFllYXJcIl0oKVxuXHRcdFx0XHQgOiBxdW90ZSAgICAgICAgICAgPyB0ZXh0LnJlcGxhY2UodW5lc2NhcGVSZSwgXCIkMVwiKVxuXHRcdFx0XHQgOiBtYXRjaFxuXHRcdFx0cmV0dXJuIHBhZCAmJiB0ZXh0IDwgMTAgPyBcIjBcIit0ZXh0IDogdGV4dFxuXHRcdH0pXG5cdH1cblxuXHREYXRlLmFtID0gXCJBTVwiXG5cdERhdGUucG0gPSBcIlBNXCJcblxuXHREYXRlLm1hc2tzID0ge1wiZGVmYXVsdFwiOlwiREREIE1NTSBERCBZWVlZIGhoOm1tOnNzXCIsXCJpc29VdGNEYXRlVGltZVwiOidVVEM6WVlZWS1NTS1ERFwiVFwiaGg6bW06c3NcIlpcIid9XG5cdERhdGUubW9udGhOYW1lcyA9IFwiSmFuRmViTWFyQXByTWF5SnVuSnVsQXVnU2VwT2N0Tm92RGVjSmFudWFyeUZlYnJ1YXJ5TWFyY2hBcHJpbE1heUp1bmVKdWx5QXVndXN0U2VwdGVtYmVyT2N0b2Jlck5vdmVtYmVyRGVjZW1iZXJcIi5tYXRjaCh3b3JkUmUpXG5cdERhdGUuZGF5TmFtZXMgPSBcIlN1bk1vblR1ZVdlZFRodUZyaVNhdFN1bmRheU1vbmRheVR1ZXNkYXlXZWRuZXNkYXlUaHVyc2RheUZyaWRheVNhdHVyZGF5XCIubWF0Y2god29yZFJlKVxuXG5cdC8vKi9cblxuXG5cdC8qXG5cdCogLy8gSW4gQ2hyb21lIERhdGUucGFyc2UoXCIwMS4wMi4yMDAxXCIpIGlzIEphblxuXHQqIG4gPSArc2VsZiB8fCBEYXRlLnBhcnNlKHNlbGYpIHx8IFwiXCIrc2VsZjtcblx0Ki9cblxuXHRTdHJpbmdbcHJvdG9dLmRhdGUgPSBOdW1iZXJbcHJvdG9dLmRhdGUgPSBmdW5jdGlvbihmb3JtYXQpIHtcblx0XHR2YXIgbSwgdGVtcFxuXHRcdCwgZCA9IG5ldyBEYXRlXG5cdFx0LCBuID0gK3RoaXMgfHwgXCJcIit0aGlzXG5cblx0XHRpZiAoaXNOYU4obikpIHtcblx0XHRcdC8vIEJpZyBlbmRpYW4gZGF0ZSwgc3RhcnRpbmcgd2l0aCB0aGUgeWVhciwgZWcuIDIwMTEtMDEtMzFcblx0XHRcdGlmIChtID0gbi5tYXRjaCh5ZWFyRmlyc3RSZSkpIGQuc2V0RnVsbFllYXIobVsxXSwgbVsyXS0xLCBtWzNdKVxuXG5cdFx0XHRlbHNlIGlmIChtID0gbi5tYXRjaChkYXRlRmlyc3RSZSkpIHtcblx0XHRcdFx0Ly8gTWlkZGxlIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSBtb250aCwgZWcuIDAxLzMxLzIwMTFcblx0XHRcdFx0Ly8gTGl0dGxlIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSBkYXksIGVnLiAzMS4wMS4yMDExXG5cdFx0XHRcdHRlbXAgPSBEYXRlLm1pZGRsZV9lbmRpYW4gPyAxIDogMlxuXHRcdFx0XHRkLnNldEZ1bGxZZWFyKG1bM10sIG1bdGVtcF0tMSwgbVszLXRlbXBdKVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBUaW1lXG5cdFx0XHRtID0gbi5tYXRjaCh0aW1lUmUpIHx8IFswLCAwLCAwXVxuXHRcdFx0ZC5zZXRIb3VycyggbVs2XSAmJiBtWzFdIDwgMTIgPyArbVsxXSsxMiA6IG1bNV0gJiYgbVsxXSA9PSAxMiA/IDAgOiBtWzFdLCBtWzJdLCBtWzNdfDAsIG1bNF18MClcblx0XHRcdC8vIFRpbWV6b25lXG5cdFx0XHRpZiAobVs3XSkge1xuXHRcdFx0XHRkLnNldFRpbWUoZC0oKGQuZ2V0VGltZXpvbmVPZmZzZXQoKSArIChtWzhdfDApKjYwICsgKChtWzhdPDA/LTE6MSkqKG1bOV18MCkpKSo2MDAwMCkpXG5cdFx0XHR9XG5cdFx0fSBlbHNlIGQuc2V0VGltZSggbiA8IDQyOTQ5NjcyOTYgPyBuICogMTAwMCA6IG4gKVxuXHRcdHJldHVybiBmb3JtYXQgPyBkLmZvcm1hdChmb3JtYXQpIDogZFxuXHR9XG5cbn0oRGF0ZSwgXCJwcm90b3R5cGVcIilcblxuXG5cblxuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
