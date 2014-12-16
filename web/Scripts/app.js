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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQXJyYXkucmVtb3ZlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0JpbmRhYmxlQ29tcG9uZW50LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0NvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9EYXRhU291cmNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL0xjV2lkZ2V0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0NYL2V4dGVuZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9Db29raWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvRmFjZWJvb2tDb25uZWN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0hlbHBQb2ludC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9MY1VybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9QcmljZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9SZWdFeHAucXVvdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU2ltcGxlU2xpZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nRm9ybWF0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmF1dG9sb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguc2xpZGVyVGFicy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC53aXphcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW5FeHRyYS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9VSVNsaWRlckxhYmVscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Q2FsbGJhY2tzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhGb3Jtcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvQ2FsY3VsYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9Gb2N1cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvZmlsbFN1Ym1lbnUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvQm9va2luZ3NOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvTW9udGhseS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9XZWVrbHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvV29ya0hvdXJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2NsZWFyQ3VycmVudFNlbGVjdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9kYXRlVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvZm9ybWF0RGF0ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9tYWtlVW5zZWxlY3RhYmxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL29iamVjdFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL3V0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2JhdGNoRXZlbnRIYW5kbGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2Jsb2NrUHJlc2V0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NyZWF0ZUlmcmFtZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlSVNPODYwMS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9mYWNlYm9va1V0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFRleHQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ29vZ2xlTWFwUmVhZHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ3VpZEdlbmVyYXRvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9oYXNDb25maXJtU3VwcG9ydC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pMThuLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2lzRW1wdHlTdHJpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmFyZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuYm91bmRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmlzQ2hpbGRPZi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkub3V0ZXJIdG1sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5yZWxvYWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL21hdGhVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tb3ZlRm9jdXNUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9udW1iZXJVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3B1cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9yZWRpcmVjdFRvLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9vbHRpcHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdXJsVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYWNjb3VudFBvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZmFxc1BvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvaG9tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvbGVnYWxQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3Byb3ZpZGVyV2VsY29tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvd2VsY29tZVBvcHVwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvZGF0ZS1mb3JtYXQtbGl0ZS9kYXRlLWZvcm1hdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvbm9kZV9tb2R1bGVzL2dydW50LWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDOVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBcnJheSBSZW1vdmUgLSBCeSBKb2huIFJlc2lnIChNSVQgTGljZW5zZWQpXHJcbi8qQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xyXG5JYWdvU1JMOiBpdCBzZWVtcyBpbmNvbXBhdGlibGUgd2l0aCBNb2Rlcm5penIgbG9hZGVyIGZlYXR1cmUgbG9hZGluZyBaZW5kZXNrIHNjcmlwdCxcclxubW92ZWQgZnJvbSBwcm90b3R5cGUgdG8gYSBjbGFzcy1zdGF0aWMgbWV0aG9kICovXHJcbmZ1bmN0aW9uIGFycmF5UmVtb3ZlKGFuQXJyYXksIGZyb20sIHRvKSB7XHJcbiAgICB2YXIgcmVzdCA9IGFuQXJyYXkuc2xpY2UoKHRvIHx8IGZyb20pICsgMSB8fCBhbkFycmF5Lmxlbmd0aCk7XHJcbiAgICBhbkFycmF5Lmxlbmd0aCA9IGZyb20gPCAwID8gYW5BcnJheS5sZW5ndGggKyBmcm9tIDogZnJvbTtcclxuICAgIHJldHVybiBhbkFycmF5LnB1c2guYXBwbHkoYW5BcnJheSwgcmVzdCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhcnJheVJlbW92ZTtcclxufSBlbHNlIHtcclxuICAgIEFycmF5LnJlbW92ZSA9IGFycmF5UmVtb3ZlO1xyXG59IiwiLyoqXHJcbiAgQmluZGFibGUgVUkgQ29tcG9uZW50LlxyXG4gIEl0IHJlbGllcyBvbiBDb21wb25lbnQgYnV0IGFkZHMgRGF0YVNvdXJjZSBjYXBhYmlsaXRpZXNcclxuKiovXHJcbnZhciBEYXRhU291cmNlID0gcmVxdWlyZSgnLi9EYXRhU291cmNlJyk7XHJcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKCcuL0NvbXBvbmVudCcpO1xyXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKTtcclxudmFyIG1ldmVudHMgPSByZXF1aXJlKCdldmVudHMnKTtcclxuXHJcbi8qKlxyXG5SZXVzaW5nIHRoZSBvcmlnaW5hbCBmZXRjaERhdGEgbWV0aG9kIGJ1dCBhZGRpbmcgY2xhc3NlcyB0byBvdXJcclxuY29tcG9uZW50IGVsZW1lbnQgZm9yIGFueSB2aXN1YWwgbm90aWZpY2F0aW9uIG9mIHRoZSBkYXRhIGxvYWRpbmcuXHJcbk1ldGhvZCBnZXQgZXh0ZW5kZWQgd2l0aCBpc1ByZWZldGNoaW5nIG1ldGhvZCBmb3IgZGlmZmVyZW50XHJcbmNsYXNzZXMvbm90aWZpY2F0aW9ucyBkZXBlbmRhbnQgb24gdGhhdCBmbGFnLCBieSBkZWZhdWx0IGZhbHNlOlxyXG4qKi9cclxudmFyIGNvbXBvbmVudEZldGNoRGF0YSA9IGZ1bmN0aW9uIGJpbmRhYmxlQ29tcG9uZW50RmV0Y2hEYXRhKHF1ZXJ5RGF0YSwgbW9kZSwgaXNQcmVmZXRjaGluZykge1xyXG4gIHZhciBjbCA9IGlzUHJlZmV0Y2hpbmcgPyB0aGlzLmNsYXNzZXMucHJlZmV0Y2hpbmcgOiB0aGlzLmNsYXNzZXMuZmV0Y2hpbmc7XHJcbiAgdGhpcy4kZWwuYWRkQ2xhc3MoY2wpO1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdmFyIHJlcSA9IERhdGFTb3VyY2UucHJvdG90eXBlLmZldGNoRGF0YS5jYWxsKHRoaXMsIHF1ZXJ5RGF0YSwgbW9kZSlcclxuICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LiRlbC5yZW1vdmVDbGFzcyhjbCB8fCAnXycpO1xyXG4gICAgLy8gVW5tYXJrIGFueSBwb3NpYmxlIHByZXZpb3VzIGVycm9yIHNpbmNlIHdlIGhhZCBhIHN1Y2NlcyBsb2FkOlxyXG4gICAgdGhhdC5oYXNFcnJvcihmYWxzZSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiByZXE7XHJcbn07XHJcbi8qKlxyXG5SZXBsYWNpbmcsIGJ1dCByZXVzaW5nIGludGVybmFscywgdGhlIGRlZmF1bHQgb25lcnJvciBjYWxsYmFjayBmb3IgdGhlXHJcbmZldGNoRGF0YSBmdW5jdGlvbiB0byBhZGQgbm90aWZpY2F0aW9uIGNsYXNzZXMgdG8gb3VyIGNvbXBvbmVudCBtb2RlbFxyXG4qKi9cclxuY29tcG9uZW50RmV0Y2hEYXRhLm9uZXJyb3IgPSBmdW5jdGlvbiBiaW5kYWJsZUNvbXBvbmVudEZlY2hEYXRhT25lcnJvcih4LCBzLCBlKSB7XHJcbiAgRGF0YVNvdXJjZS5wcm90b3R5cGUuZmV0Y2hEYXRhLm9uZXJyb3IuY2FsbCh0aGlzLCB4LCBzLCBlKTtcclxuICAvLyBSZW1vdmUgZmV0Y2hpbmcgY2xhc3NlczpcclxuICB0aGlzLiRlbFxyXG4gIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKVxyXG4gIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMucHJlZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAvLyBNYXJrIGVycm9yOlxyXG4gIHRoaXMuaGFzRXJyb3IoeyBuYW1lOiAnZmV0Y2hEYXRhRXJyb3InLCByZXF1ZXN0OiB4LCBzdGF0dXM6IHMsIGV4Y2VwdGlvbjogZSB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gIEJpbmRhYmxlQ29tcG9uZW50IGNsYXNzXHJcbioqL1xyXG52YXIgQmluZGFibGVDb21wb25lbnQgPSBDb21wb25lbnQuZXh0ZW5kKFxyXG4gIERhdGFTb3VyY2UucHJvdG90eXBlLFxyXG4gIC8vIFByb3RvdHlwZVxyXG4gIHtcclxuICAgIGNsYXNzZXM6IHtcclxuICAgICAgZmV0Y2hpbmc6ICdpcy1sb2FkaW5nJyxcclxuICAgICAgcHJlZmV0Y2hpbmc6ICdpcy1wcmVsb2FkaW5nJyxcclxuICAgICAgZGlzYWJsZWQ6ICdpcy1kaXNhYmxlZCcsXHJcbiAgICAgIGhhc0RhdGFFcnJvcjogJ2hhcy1kYXRhRXJyb3InXHJcbiAgICB9LFxyXG4gICAgZmV0Y2hEYXRhOiBjb21wb25lbnRGZXRjaERhdGEsXHJcbiAgICAvLyBXaGF0IGF0dHJpYnV0ZSBuYW1lIHVzZSB0byBtYXJrIGVsZW1lbnRzIGluc2lkZSB0aGUgY29tcG9uZW50XHJcbiAgICAvLyB3aXRoIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBzb3VyY2UgdG8gYmluZC5cclxuICAgIC8vIFRoZSBwcmVmaXggJ2RhdGEtJyBpbiBjdXN0b20gYXR0cmlidXRlcyBpcyByZXF1aXJlZCBieSBodG1sNSxcclxuICAgIC8vIGp1c3Qgc3BlY2lmeSB0aGUgc2Vjb25kIHBhcnQsIGJlaW5nICdiaW5kJyB0aGUgYXR0cmlidXRlXHJcbiAgICAvLyBuYW1lIHRvIHVzZSBpcyAnZGF0YS1iaW5kJ1xyXG4gICAgZGF0YUJpbmRBdHRyaWJ1dGU6ICdiaW5kJyxcclxuICAgIC8vIERlZmF1bHQgYmluZERhdGEgaW1wbGVtZW50YXRpb24sIGNhbiBiZSByZXBsYWNlIG9uIGV4dGVuZGVkIGNvbXBvbmVudHNcclxuICAgIC8vIHRvIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggKGxpc3QvY29sbGVjdGlvbnMsIHN1Yi1vYmplY3RzLCBjdXN0b20gc3RydWN0dXJlc1xyXG4gICAgLy8gYW5kIHZpc3VhbGl6YXRpb24gLS1rZWVwIGFzIHBvc3NpYmxlIHRoZSB1c2Ugb2YgZGF0YUJpbmRBdHRyaWJ1dGUgZm9yIHJldXNhYmxlIGNvZGUpLlxyXG4gICAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiB3b3JrcyBmaW5lIGZvciBkYXRhIGFzIHBsYWluIG9iamVjdCB3aXRoIFxyXG4gICAgLy8gc2ltcGxlIHR5cGVzIGFzIHByb3BlcnRpZXMgKG5vdCBvYmplY3RzIG9yIGFycmF5cyBpbnNpZGUgdGhlbSkuXHJcbiAgICBiaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGEoKSB7XHJcbiAgICAgIGlmICghdGhpcy5kYXRhKSByZXR1cm47XHJcbiAgICAgIC8vIENoZWNrIGV2ZXJ5IGVsZW1lbnQgaW4gdGhlIGNvbXBvbmVudCB3aXRoIGEgYmluZFxyXG4gICAgICAvLyBwcm9wZXJ0eSBhbmQgdXBkYXRlIGl0IHdpdGggdGhlIHZhbHVlIG9mIHRoYXQgcHJvcGVydHlcclxuICAgICAgLy8gZnJvbSB0aGUgZGF0YSBzb3VyY2VcclxuICAgICAgdmFyIGF0dCA9IHRoaXMuZGF0YUJpbmRBdHRyaWJ1dGU7XHJcbiAgICAgIHZhciBhdHRyU2VsZWN0b3IgPSAnW2RhdGEtJyArIGF0dCArICddJztcclxuICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICB0aGlzLiRlbC5maW5kKGF0dHJTZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKSxcclxuICAgICAgICAgIHByb3AgPSAkdC5kYXRhKGF0dCksXHJcbiAgICAgICAgICBiaW5kZWRWYWx1ZSA9IHRoYXQuZGF0YVtwcm9wXTtcclxuXHJcbiAgICAgICAgaWYgKCR0LmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICR0LnZhbChiaW5kZWRWYWx1ZSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgJHQudGV4dChiaW5kZWRWYWx1ZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICBJdCBnZXRzIHRoZSBsYXRlc3QgZXJyb3IgaGFwcGVuZWQgaW4gdGhlIGNvbXBvbmVudCAob3IgbnVsbC9mYWxzeSBpZiB0aGVyZSBpcyBubyksXHJcbiAgICAgIG9yIHNldHMgdGhlIGVycm9yIChwYXNzaW5nIGl0IGluIHRoZSBvcHRpb25hbCB2YWx1ZSkgcmV0dXJuaW5nIHRoZSBwcmV2aW91cyByZWdpc3RlcmVkIGVycm9yLlxyXG4gICAgICBJdHMgcmVjb21tZW5kZWQgYW4gb2JqZWN0IGFzIGVycm9yIGluc3RlYWQgb2YgYSBzaW1wbGUgdmFsdWUgb3Igc3RyaW5nICh0aGF0IGNhbiBnZXQgY29uZnVzZWRcclxuICAgICAgd2l0aCBmYWxzeSBpZiBpcyBlbXB0eSBzdHJpbmcgb3IgMCwgYW5kIGFsbG93IGF0dGFjaCBtb3JlIHN0cnVjdHVyZWQgaW5mb3JtYXRpb24pIHdpdGggYW5cclxuICAgICAgaW5mb3JtYXRpb25hbCBwcm9wZXJ0eSAnbmFtZScuXHJcbiAgICAgIFRvIHNldCBvZmYgdGhlIGVycm9yLCBwYXNzIG51bGwgdmFsdWUgb3IgZmFsc2UuXHJcbiAgICAqKi9cclxuICAgIGhhc0Vycm9yOiBmdW5jdGlvbiBoYXNFcnJvcihlcnJvclRvU2V0KSB7XHJcbiAgICAgIGlmICh0eXBlb2YgKGVycm9yVG9TZXQpID09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Vycm9yIHx8IG51bGw7XHJcbiAgICAgIH1cclxuICAgICAgdmFyIHByZXYgPSB0aGlzLl9lcnJvciB8fCBudWxsO1xyXG4gICAgICB0aGlzLl9lcnJvciA9IGVycm9yVG9TZXQ7XHJcbiAgICAgIHRoaXMuZXZlbnRzLmVtaXQoJ2hhc0Vycm9yQ2hhbmdlZCcsIGVycm9yVG9TZXQsIHByZXYpO1xyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH1cclxuICB9LFxyXG4gIC8vIENvbnN0cnVjdG9yXHJcbiAgZnVuY3Rpb24gQmluZGFibGVDb21wb25lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgQ29tcG9uZW50LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICBcclxuICAgIC8vIEl0IGhhcyBhbiBldmVudCBlbWl0dGVyOlxyXG4gICAgdGhpcy5ldmVudHMgPSBuZXcgbWV2ZW50cy5FdmVudEVtaXR0ZXIoKTtcclxuICAgIC8vIEV2ZW50cyBvYmplY3QgaGFzIGEgcHJvcGVydHkgdG8gYWNjZXNzIHRoaXMgb2JqZWN0LFxyXG4gICAgLy8gdXNlZnVsbCB0byByZWZlcmVuY2UgYXMgJ3RoaXMuY29tcG9uZW50JyBmcm9tIGluc2lkZVxyXG4gICAgLy8gZXZlbnQgaGFuZGxlcnM6XHJcbiAgICB0aGlzLmV2ZW50cy5jb21wb25lbnQgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuZGF0YSA9IHRoaXMuJGVsLmRhdGEoJ3NvdXJjZScpIHx8IHRoaXMuZGF0YSB8fCB7fTtcclxuICAgIGlmICh0eXBlb2YgKHRoaXMuZGF0YSkgPT0gJ3N0cmluZycpXHJcbiAgICAgIHRoaXMuZGF0YSA9IEpTT04ucGFyc2UodGhpcy5kYXRhKTtcclxuXHJcbiAgICAvLyBPbiBodG1sIHNvdXJjZSB1cmwgY29uZmlndXJhdGlvbjpcclxuICAgIHRoaXMudXJsID0gdGhpcy4kZWwuZGF0YSgnc291cmNlLXVybCcpIHx8IHRoaXMudXJsO1xyXG5cclxuICAgIC8vIENsYXNzZXMgb24gZmV0Y2hEYXRhRXJyb3JcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCBmdW5jdGlvbiAoZXJyLCBwcmV2RXJyKSB7XHJcbiAgICAgIGlmIChlcnIgJiYgZXJyLm5hbWUgPT0gJ2ZldGNoRGF0YUVycm9yJykge1xyXG4gICAgICAgIHRoYXQuJGVsLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5oYXNEYXRhRXJyb3IpO1xyXG4gICAgICB9IGVsc2UgaWYgKHByZXZFcnIgJiYgcHJldkVyci5uYW1lID09ICdmZXRjaERhdGFFcnJvcicpIHtcclxuICAgICAgICB0aGF0LiRlbC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuaGFzRGF0YUVycm9yIHx8ICdfJyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFRPRE86ICdjaGFuZ2UnIGV2ZW50IGhhbmRsZXJzIG9uIGZvcm1zIHdpdGggZGF0YS1iaW5kIHRvIHVwZGF0ZSBpdHMgdmFsdWUgYXQgdGhpcy5kYXRhXHJcbiAgICAvLyBUT0RPOiBhdXRvICdiaW5kRGF0YScgb24gZmV0Y2hEYXRhIGVuZHM/IGNvbmZpZ3VyYWJsZSwgYmluZERhdGFNb2RleyBpbm1lZGlhdGUsIG5vdGlmeSB9XHJcbiAgfVxyXG4pO1xyXG5cclxuLy8gUHVibGljIG1vZHVsZTpcclxubW9kdWxlLmV4cG9ydHMgPSBCaW5kYWJsZUNvbXBvbmVudDsiLCIvKiogQ29tcG9uZW50IGNsYXNzOiB3cmFwcGVyIGZvclxyXG4gIHRoZSBsb2dpYyBhbmQgYmVoYXZpb3IgYXJvdW5kXHJcbiAgYSBET00gZWxlbWVudFxyXG4qKi9cclxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4vZXh0ZW5kJyk7XHJcblxyXG5mdW5jdGlvbiBDb21wb25lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIHRoaXMuZWwgPSBlbGVtZW50O1xyXG4gIHRoaXMuJGVsID0gJChlbGVtZW50KTtcclxuICBleHRlbmQodGhpcywgb3B0aW9ucyk7XHJcbiAgLy8gVXNlIHRoZSBqUXVlcnkgJ2RhdGEnIHN0b3JhZ2UgdG8gcHJlc2VydmUgYSByZWZlcmVuY2VcclxuICAvLyB0byB0aGlzIGluc3RhbmNlICh1c2VmdWwgdG8gcmV0cmlldmUgaXQgZnJvbSBkb2N1bWVudClcclxuICB0aGlzLiRlbC5kYXRhKCdjb21wb25lbnQnLCB0aGlzKTtcclxufVxyXG5cclxuZXh0ZW5kLnBsdWdJbihDb21wb25lbnQpO1xyXG5leHRlbmQucGx1Z0luKENvbXBvbmVudC5wcm90b3R5cGUpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb21wb25lbnQ7IiwiLyoqXHJcbiAgRGF0YVNvdXJjZSBjbGFzcyB0byBzaW1wbGlmeSBmZXRjaGluZyBkYXRhIGFzIEpTT05cclxuICB0byBmaWxsIGEgbG9jYWwgY2FjaGUuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZmV0Y2hKU09OID0gJC5nZXRKU09OLFxyXG4gICAgZXh0ZW5kID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJC5leHRlbmQuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7IH07XHJcblxyXG4vLyBUT0RPOiByZXBsYWNlIGVhY2ggcHJvcGVydHkgb2YgZnVuY3Rpb25zIGJ5IGluc3RhbmNlIHByb3BlcnRpZXMsIHNpbmNlIHRoYXQgcHJvcGVydGllcyBiZWNvbWVcclxuLy8gc2hhcmVkIGJldHdlZW4gaW5zdGFuY2VzIGFuZCBpcyBub3Qgd2FudGVkXHJcblxyXG52YXIgcmVxTW9kZXMgPSBEYXRhU291cmNlLnJlcXVlc3RNb2RlcyA9IHtcclxuICAvLyBQYXJhbGxlbCByZXF1ZXN0LCBubyBtYXR0ZXIgb2Ygb3RoZXJzXHJcbiAgbXVsdGlwbGU6IDAsXHJcbiAgLy8gV2lsbCBhdm9pZCBhIHJlcXVlc3QgaWYgdGhlcmUgaXMgb25lIHJ1bm5pbmdcclxuICBzaW5nbGU6IDEsXHJcbiAgLy8gTGF0ZXN0IHJlcXVldCB3aWxsIHJlcGxhY2UgYW55IHByZXZpb3VzIG9uZSAocHJldmlvdXMgd2lsbCBhYm9ydClcclxuICByZXBsYWNlOiAyXHJcbn07XHJcblxyXG52YXIgdXBkTW9kZXMgPSBEYXRhU291cmNlLnVwZGF0ZU1vZGVzID0ge1xyXG4gIC8vIEV2ZXJ5IG5ldyBkYXRhIHVwZGF0ZSwgbmV3IGNvbnRlbnQgaXMgYWRkZWQgaW5jcmVtZW50YWxseVxyXG4gIC8vIChvdmVyd3JpdGUgY29pbmNpZGVudCBjb250ZW50LCBhcHBlbmQgbmV3IGNvbnRlbnQsIG9sZCBjb250ZW50XHJcbiAgLy8gZ2V0IGluIHBsYWNlKVxyXG4gIGluY3JlbWVudGFsOiAwLFxyXG4gIC8vIE9uIG5ldyBkYXRhIHVwZGF0ZSwgbmV3IGRhdGEgdG90YWxseSByZXBsYWNlIHRoZSBwcmV2aW91cyBvbmVcclxuICByZXBsYWNlbWVudDogMVxyXG59O1xyXG5cclxuLyoqXHJcblVwZGF0ZSB0aGUgZGF0YSBzdG9yZSBvciBjYWNoZSB3aXRoIHRoZSBnaXZlbiBvbmUuXHJcblRoZXJlIGFyZSBkaWZmZXJlbnQgbW9kZXMsIHRoaXMgbWFuYWdlcyB0aGF0IGxvZ2ljIGFuZFxyXG5pdHMgb3duIGNvbmZpZ3VyYXRpb24uXHJcbklzIGRlY291cGxlZCBmcm9tIHRoZSBwcm90b3R5cGUgYnV0XHJcbml0IHdvcmtzIG9ubHkgYXMgcGFydCBvZiBhIERhdGFTb3VyY2UgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVEYXRhKGRhdGEsIG1vZGUpIHtcclxuICBzd2l0Y2ggKG1vZGUgfHwgdGhpcy51cGRhdGVEYXRhLmRlZmF1bHRVcGRhdGVNb2RlKSB7XHJcblxyXG4gICAgY2FzZSB1cGRNb2Rlcy5yZXBsYWNlbWVudDpcclxuICAgICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgLy9jYXNlIHVwZE1vZGVzLmluY3JlbWVudGFsOiAgXHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICAvLyBJbiBjYXNlIGluaXRpYWwgZGF0YSBpcyBudWxsLCBhc3NpZ24gdGhlIHJlc3VsdCB0byBpdHNlbGY6XHJcbiAgICAgIHRoaXMuZGF0YSA9IGV4dGVuZCh0aGlzLmRhdGEsIGRhdGEpO1xyXG4gICAgICBicmVhaztcclxuICB9XHJcbn1cclxuXHJcbi8qKiBEZWZhdWx0IHZhbHVlIGZvciB0aGUgY29uZmlndXJhYmxlIHVwZGF0ZSBtb2RlOlxyXG4qKi9cclxudXBkYXRlRGF0YS5kZWZhdWx0VXBkYXRlTW9kZSA9IHVwZE1vZGVzLmluY3JlbWVudGFsO1xyXG5cclxuLyoqXHJcbkZldGNoIHRoZSBkYXRhIGZyb20gdGhlIHNlcnZlci5cclxuSGVyZSBpcyBkZWNvdXBsZWQgZnJvbSB0aGUgcmVzdCBvZiB0aGUgcHJvdG90eXBlIGZvclxyXG5jb21tb2RpdHksIGJ1dCBpdCBjYW4gd29ya3Mgb25seSBhcyBwYXJ0IG9mIGEgRGF0YVNvdXJjZSBpbnN0YW5jZS5cclxuKiovXHJcbmZ1bmN0aW9uIGZldGNoRGF0YShxdWVyeSwgbW9kZSkge1xyXG4gIHF1ZXJ5ID0gZXh0ZW5kKHt9LCB0aGlzLnF1ZXJ5LCBxdWVyeSk7XHJcbiAgc3dpdGNoIChtb2RlIHx8IHRoaXMuZmV0Y2hEYXRhLmRlZmF1bHRSZXF1ZXN0TW9kZSkge1xyXG5cclxuICAgIGNhc2UgcmVxTW9kZXMuc2luZ2xlOlxyXG4gICAgICBpZiAodGhpcy5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSByZXR1cm4gbnVsbDtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgY2FzZSByZXFNb2Rlcy5yZXBsYWNlOlxyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzW2ldLmFib3J0KCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXgpIHsgfVxyXG4gICAgICAgIHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzID0gW107XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgLy8gSnVzdCBkbyBub3RoaW5nIGZvciBtdWx0aXBsZSBvciBkZWZhdWx0ICAgICBcclxuICAgIC8vY2FzZSByZXFNb2Rlcy5tdWx0aXBsZTogIFxyXG4gICAgLy9kZWZhdWx0OiBcclxuICB9XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB2YXIgcmVxID0gdGhpcy5mZXRjaERhdGEucHJveHkoXHJcbiAgICB0aGlzLnVybCxcclxuICAgIHF1ZXJ5LFxyXG4gICAgZnVuY3Rpb24gKGRhdGEsIHQsIHhocikge1xyXG4gICAgICB2YXIgcmV0ID0gdGhhdC51cGRhdGVEYXRhKGRhdGEpO1xyXG4gICAgICB0aGF0LmZldGNoRGF0YS5yZXF1ZXN0cy5zcGxpY2UodGhhdC5mZXRjaERhdGEucmVxdWVzdHMuaW5kZXhPZihyZXEpLCAxKTtcclxuICAgICAgLy9kZWxldGUgZmV0Y2hEYXRhLnJlcXVlc3RzW2ZldGNoRGF0YS5yZXF1ZXN0cy5pbmRleE9mKHJlcSldO1xyXG5cclxuICAgICAgaWYgKHJldCAmJiByZXQubmFtZSkge1xyXG4gICAgICAgIC8vIFVwZGF0ZSBkYXRhIGVtaXRzIGVycm9yLCB0aGUgQWpheCBzdGlsbCByZXNvbHZlcyBhcyAnc3VjY2VzcycgYmVjYXVzZSBvZiB0aGUgcmVxdWVzdCwgYnV0XHJcbiAgICAgICAgLy8gd2UgbmVlZCB0byBleGVjdXRlIHRoZSBlcnJvciwgYnV0IHdlIHBpcGUgaXQgdG8gZW5zdXJlIGlzIGRvbmUgYWZ0ZXIgb3RoZXIgJ2RvbmUnIGNhbGxiYWNrc1xyXG4gICAgICAgIHJlcS5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdGhhdC5mZXRjaERhdGEub25lcnJvci5jYWxsKHRoYXQsIG51bGwsIHJldC5uYW1lLCByZXQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG4gIClcclxuICAuZmFpbCgkLnByb3h5KHRoaXMuZmV0Y2hEYXRhLm9uZXJyb3IsIHRoaXMpKTtcclxuICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5wdXNoKHJlcSk7XHJcblxyXG4gIHJldHVybiByZXE7XHJcbn1cclxuXHJcbi8vIERlZmF1bHRzIGZldGNoRGF0YSBwcm9wZXJ0aWVzLCB0aGV5IGFyZSBkZWNvdXBsZWQgdG8gYWxsb3dcclxuLy8gcmVwbGFjZW1lbnQsIGFuZCBpbnNpZGUgdGhlIGZldGNoRGF0YSBmdW5jdGlvbiB0byBkb24ndFxyXG4vLyBjb250YW1pbmF0ZSB0aGUgb2JqZWN0IG5hbWVzcGFjZS5cclxuXHJcbi8qIENvbGxlY3Rpb24gb2YgYWN0aXZlIChmZXRjaGluZykgcmVxdWVzdHMgdG8gdGhlIHNlcnZlclxyXG4qL1xyXG5mZXRjaERhdGEucmVxdWVzdHMgPSBbXTtcclxuXHJcbi8qIERlY291cGxlZCBmdW5jdGlvbmFsaXR5IHRvIHBlcmZvcm0gdGhlIEFqYXggb3BlcmF0aW9uLFxyXG50aGlzIGFsbG93cyBvdmVyd3JpdGUgdGhpcyBiZWhhdmlvciB0byBpbXBsZW1lbnQgYW5vdGhlclxyXG53YXlzLCBsaWtlIGEgbm9uLWpRdWVyeSBpbXBsZW1lbnRhdGlvbiwgYSBwcm94eSB0byBmYWtlIHNlcnZlclxyXG5mb3IgdGVzdGluZyBvciBwcm94eSB0byBsb2NhbCBzdG9yYWdlIGlmIG9ubGluZSwgZXRjLlxyXG5JdCBtdXN0IHJldHVybnMgdGhlIHVzZWQgcmVxdWVzdCBvYmplY3QuXHJcbiovXHJcbmZldGNoRGF0YS5wcm94eSA9IGZldGNoSlNPTjtcclxuXHJcbi8qIEJ5IGRlZmF1bHQsIGZldGNoRGF0YSBhbGxvd3MgbXVsdGlwbGUgc2ltdWx0YW5lb3MgY29ubmVjdGlvbixcclxuc2luY2UgdGhlIHN0b3JhZ2UgYnkgZGVmYXVsdCBhbGxvd3MgaW5jcmVtZW50YWwgdXBkYXRlcyByYXRoZXJcclxudGhhbiByZXBsYWNlbWVudHMuXHJcbiovXHJcbmZldGNoRGF0YS5kZWZhdWx0UmVxdWVzdE1vZGUgPSByZXFNb2Rlcy5tdWx0aXBsZTtcclxuXHJcbi8qIERlZmF1bHQgbm90aWZpY2F0aW9uIG9mIGVycm9yIG9uIGZldGNoaW5nLCBqdXN0IGxvZ2dpbmcsXHJcbmNhbiBiZSByZXBsYWNlZC5cclxuSXQgcmVjZWl2ZXMgdGhlIHJlcXVlc3Qgb2JqZWN0LCBzdGF0dXMgYW5kIGVycm9yLlxyXG4qL1xyXG5mZXRjaERhdGEub25lcnJvciA9IGZ1bmN0aW9uIGVycm9yKHgsIHMsIGUpIHtcclxuICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdGZXRjaCBkYXRhIGVycm9yICVvJywgZSk7XHJcbn07XHJcblxyXG4vKipcclxuICBEYXRhU291cmNlIGNsYXNzXHJcbioqL1xyXG4vLyBDb25zdHJ1Y3RvcjogZXZlcnl0aGluZyBpcyBpbiB0aGUgcHJvdG90eXBlLlxyXG5mdW5jdGlvbiBEYXRhU291cmNlKCkgeyB9XHJcbkRhdGFTb3VyY2UucHJvdG90eXBlID0ge1xyXG4gIGRhdGE6IG51bGwsXHJcbiAgdXJsOiAnLycsXHJcbiAgLy8gcXVlcnk6IG9iamVjdCB3aXRoIGRlZmF1bHQgZXh0cmEgaW5mb3JtYXRpb24gdG8gYXBwZW5kIHRvIHRoZSB1cmxcclxuICAvLyB3aGVuIGZldGNoaW5nIGRhdGEsIGV4dGVuZGVkIHdpdGggdGhlIGV4cGxpY2l0IHF1ZXJ5IHNwZWNpZmllZFxyXG4gIC8vIGV4ZWN1dGluZyBmZXRjaERhdGEocXVlcnkpXHJcbiAgcXVlcnk6IHt9LFxyXG4gIHVwZGF0ZURhdGE6IHVwZGF0ZURhdGEsXHJcbiAgZmV0Y2hEYXRhOiBmZXRjaERhdGFcclxuICAvLyBUT0RPICBwdXNoRGF0YTogZnVuY3Rpb24oKXsgcG9zdC9wdXQgdGhpcy5kYXRhIHRvIHVybCAgfVxyXG59O1xyXG5cclxuLy8gQ2xhc3MgYXMgcHVibGljIG1vZHVsZTpcclxubW9kdWxlLmV4cG9ydHMgPSBEYXRhU291cmNlOyIsIi8qKlxyXG4gIExvY29ub21pY3Mgc3BlY2lmaWMgV2lkZ2V0IGJhc2VkIG9uIEJpbmRhYmxlQ29tcG9uZW50LlxyXG4gIEp1c3QgZGVjb3VwbGluZyBzcGVjaWZpYyBiZWhhdmlvcnMgZnJvbSBzb21ldGhpbmcgbW9yZSBnZW5lcmFsXHJcbiAgdG8gZWFzaWx5IHRyYWNrIHRoYXQgZGV0YWlscywgYW5kIG1heWJlIGZ1dHVyZSBtaWdyYXRpb25zIHRvXHJcbiAgb3RoZXIgZnJvbnQtZW5kIGZyYW1ld29ya3MuXHJcbioqL1xyXG52YXIgRGF0YVNvdXJjZSA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZScpO1xyXG52YXIgQmluZGFibGVDb21wb25lbnQgPSByZXF1aXJlKCcuL0JpbmRhYmxlQ29tcG9uZW50Jyk7XHJcblxyXG52YXIgTGNXaWRnZXQgPSBCaW5kYWJsZUNvbXBvbmVudC5leHRlbmQoXHJcbiAgLy8gUHJvdG90eXBlXHJcbiAge1xyXG4gICAgLy8gUmVwbGFjaW5nIHVwZGF0ZURhdGEgdG8gaW1wbGVtZW50IHRoZSBwYXJ0aWN1bGFyXHJcbiAgICAvLyBKU09OIHNjaGVtZSBvZiBMb2Nvbm9taWNzLCBidXQgcmV1c2luZyBvcmlnaW5hbFxyXG4gICAgLy8gbG9naWMgaW5oZXJpdCBmcm9tIERhdGFTb3VyY2VcclxuICAgIHVwZGF0ZURhdGE6IGZ1bmN0aW9uIChkYXRhLCBtb2RlKSB7XHJcbiAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgIERhdGFTb3VyY2UucHJvdG90eXBlLnVwZGF0ZURhdGEuY2FsbCh0aGlzLCBkYXRhLlJlc3VsdCwgbW9kZSk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRXJyb3IgbWVzc2FnZSBpbiB0aGUgSlNPTlxyXG4gICAgICAgIHJldHVybiB7IG5hbWU6ICdkYXRhLWZvcm1hdCcsIG1lc3NhZ2U6IGRhdGEuUmVzdWx0ID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlIDogZGF0YS5SZXN1bHQgOiBcInVua25vd1wiIH07XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIC8vIENvbnN0cnVjdG9yXHJcbiAgZnVuY3Rpb24gTGNXaWRnZXQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgQmluZGFibGVDb21wb25lbnQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICB9XHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjV2lkZ2V0OyIsIi8qKlxyXG4gIERlZXAgRXh0ZW5kIG9iamVjdCB1dGlsaXR5LCBpcyByZWN1cnNpdmUgdG8gZ2V0IGFsbCB0aGUgZGVwdGhcclxuICBidXQgb25seSBmb3IgdGhlIHByb3BlcnRpZXMgb3duZWQgYnkgdGhlIG9iamVjdCxcclxuICBpZiB5b3UgbmVlZCB0aGUgbm9uLW93bmVkIHByb3BlcnRpZXMgdG8gaW4gdGhlIG9iamVjdCxcclxuICBjb25zaWRlciBleHRlbmQgZnJvbSB0aGUgc291cmNlIHByb3RvdHlwZSB0b28gKGFuZCBtYXliZSB0b1xyXG4gIHRoZSBkZXN0aW5hdGlvbiBwcm90b3R5cGUgaW5zdGVhZCBvZiB0aGUgaW5zdGFuY2UsIGJ1dCB1cCB0byB0b28pLlxyXG4qKi9cclxuXHJcbi8qIGpxdWVyeSBpbXBsZW1lbnRhdGlvbjpcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuZXh0ZW5kID0gZnVuY3Rpb24gKCkge1xyXG5yZXR1cm4gJC5leHRlbmQuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7IFxyXG59OyovXHJcblxyXG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kKGRlc3RpbmF0aW9uLCBzb3VyY2UpIHtcclxuICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBzb3VyY2UpIHtcclxuICAgIGlmICghc291cmNlLmhhc093blByb3BlcnR5KHByb3BlcnR5KSlcclxuICAgICAgY29udGludWU7XHJcblxyXG4gICAgLy8gQWxsb3cgcHJvcGVydGllcyByZW1vdmFsLCBpZiBzb3VyY2UgY29udGFpbnMgdmFsdWUgJ3VuZGVmaW5lZCcuXHJcbiAgICAvLyBUaGVyZSBhcmUgbm8gc3BlY2lhbCBjb25zaWRlcmF0aW9ucyBvbiBBcnJheXMsIHRvIGRvbid0IGdldCB1bmRlc2lyZWRcclxuICAgIC8vIHJlc3VsdHMganVzdCB0aGUgd2FudGVkIGlzIHRvIHJlcGxhY2Ugc3BlY2lmaWMgcG9zaXRpb25zLCBub3JtYWxseS5cclxuICAgIGlmIChzb3VyY2VbcHJvcGVydHldID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgZGVsZXRlIGRlc3RpbmF0aW9uW3Byb3BlcnR5XTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFsnb2JqZWN0JywgJ2Z1bmN0aW9uJ10uaW5kZXhPZih0eXBlb2YgZGVzdGluYXRpb25bcHJvcGVydHldKSAhPSAtMSAmJlxyXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlW3Byb3BlcnR5XSA9PSAnb2JqZWN0JylcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVzdGluYXRpb25bcHJvcGVydHldID09ICdmdW5jdGlvbicgJiZcclxuICAgICAgICAgICAgICAgICB0eXBlb2Ygc291cmNlW3Byb3BlcnR5XSA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHZhciBvcmlnID0gZGVzdGluYXRpb25bcHJvcGVydHldO1xyXG4gICAgICAvLyBDbG9uZSBmdW5jdGlvblxyXG4gICAgICB2YXIgc291ciA9IGNsb25lRnVuY3Rpb24oc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICAgIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9IHNvdXI7XHJcbiAgICAgIC8vIEFueSBwcmV2aW91cyBhdHRhY2hlZCBwcm9wZXJ0eVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBvcmlnKTtcclxuICAgICAgLy8gQW55IHNvdXJjZSBhdHRhY2hlZCBwcm9wZXJ0eVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBzb3VyY2VbcHJvcGVydHldKTtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgICAgZGVzdGluYXRpb25bcHJvcGVydHldID0gc291cmNlW3Byb3BlcnR5XTtcclxuICB9XHJcblxyXG4gIC8vIFNvIG11Y2ggJ3NvdXJjZScgYXJndW1lbnRzIGFzIHdhbnRlZC4gSW4gRVM2IHdpbGwgYmUgJ3NvdXJjZS4uJ1xyXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xyXG4gICAgdmFyIG5leHRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcclxuICAgIG5leHRzLnNwbGljZSgxLCAxKTtcclxuICAgIGV4dGVuZC5hcHBseSh0aGlzLCBuZXh0cyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGVzdGluYXRpb247XHJcbn07XHJcblxyXG5leHRlbmQucGx1Z0luID0gZnVuY3Rpb24gcGx1Z0luKG9iaikge1xyXG4gIG9iaiA9IG9iaiB8fCBPYmplY3QucHJvdG90eXBlO1xyXG4gIG9iai5leHRlbmRNZSA9IGZ1bmN0aW9uIGV4dGVuZE1lKCkge1xyXG4gICAgZXh0ZW5kLmFwcGx5KHRoaXMsIFt0aGlzXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xyXG4gIH07XHJcbiAgb2JqLmV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZEluc3RhbmNlKCkge1xyXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxyXG4gICAgICAvLyBJZiB0aGUgb2JqZWN0IHVzZWQgdG8gZXh0ZW5kIGZyb20gaXMgYSBmdW5jdGlvbiwgaXMgY29uc2lkZXJlZFxyXG4gICAgICAvLyBhIGNvbnN0cnVjdG9yLCB0aGVuIHdlIGV4dGVuZCBmcm9tIGl0cyBwcm90b3R5cGUsIG90aGVyd2lzZSBpdHNlbGYuXHJcbiAgICAgIGNvbnN0cnVjdG9yQSA9IHR5cGVvZiB0aGlzID09ICdmdW5jdGlvbicgPyB0aGlzIDogbnVsbCxcclxuICAgICAgYmFzZUEgPSBjb25zdHJ1Y3RvckEgPyB0aGlzLnByb3RvdHlwZSA6IHRoaXMsXHJcbiAgICAgIC8vIElmIGxhc3QgYXJndW1lbnQgaXMgYSBmdW5jdGlvbiwgaXMgY29uc2lkZXJlZCBhIGNvbnN0cnVjdG9yXHJcbiAgICAgIC8vIG9mIHRoZSBuZXcgY2xhc3Mvb2JqZWN0IHRoZW4gd2UgZXh0ZW5kIGl0cyBwcm90b3R5cGUuXHJcbiAgICAgIC8vIFdlIHVzZSBhbiBlbXB0eSBvYmplY3Qgb3RoZXJ3aXNlLlxyXG4gICAgICBjb25zdHJ1Y3RvckIgPSB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICdmdW5jdGlvbicgP1xyXG4gICAgICAgIGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSlbMF0gOlxyXG4gICAgICAgIG51bGwsXHJcbiAgICAgIGJhc2VCID0gY29uc3RydWN0b3JCID8gY29uc3RydWN0b3JCLnByb3RvdHlwZSA6IHt9O1xyXG5cclxuICAgIHZhciBleHRlbmRlZFJlc3VsdCA9IGV4dGVuZC5hcHBseSh0aGlzLCBbYmFzZUIsIGJhc2VBXS5jb25jYXQoYXJncykpO1xyXG4gICAgLy8gSWYgYm90aCBhcmUgY29uc3RydWN0b3JzLCB3ZSB3YW50IHRoZSBzdGF0aWMgbWV0aG9kcyB0byBiZSBjb3BpZWQgdG9vOlxyXG4gICAgaWYgKGNvbnN0cnVjdG9yQSAmJiBjb25zdHJ1Y3RvckIpXHJcbiAgICAgIGV4dGVuZChjb25zdHJ1Y3RvckIsIGNvbnN0cnVjdG9yQSk7XHJcblxyXG4gICAgLy8gSWYgd2UgYXJlIGV4dGVuZGluZyBhIGNvbnN0cnVjdG9yLCB3ZSByZXR1cm4gdGhhdCwgb3RoZXJ3aXNlIHRoZSByZXN1bHRcclxuICAgIHJldHVybiBjb25zdHJ1Y3RvckIgfHwgZXh0ZW5kZWRSZXN1bHQ7XHJcbiAgfTtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gIG1vZHVsZS5leHBvcnRzID0gZXh0ZW5kO1xyXG59IGVsc2Uge1xyXG4gIC8vIGdsb2JhbCBzY29wZVxyXG4gIGV4dGVuZC5wbHVnSW4oKTtcclxufVxyXG5cclxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgQ2xvbmUgVXRpbHNcclxuKi9cclxuZnVuY3Rpb24gY2xvbmVPYmplY3Qob2JqKSB7XHJcbiAgcmV0dXJuIGV4dGVuZCh7fSwgb2JqKTtcclxufVxyXG5cclxuLy8gVGVzdGluZyBpZiBhIHN0cmluZyBzZWVtcyBhIGZ1bmN0aW9uIHNvdXJjZSBjb2RlOlxyXG4vLyBXZSB0ZXN0IGFnYWlucyBhIHNpbXBsaXNpYyByZWd1bGFyIGV4cHJlc2lvbiB0aGF0IG1hdGNoXHJcbi8vIGEgY29tbW9uIHN0YXJ0IG9mIGZ1bmN0aW9uIGRlY2xhcmF0aW9uLlxyXG4vLyBPdGhlciB3YXlzIHRvIGRvIHRoaXMgaXMgYXQgaW52ZXJzZXIsIGJ5IGNoZWNraW5nXHJcbi8vIHRoYXQgdGhlIGZ1bmN0aW9uIHRvU3RyaW5nIGlzIG5vdCBhIGtub3dlZCB0ZXh0XHJcbi8vIGFzICdbb2JqZWN0IEZ1bmN0aW9uXScgb3IgJ1tuYXRpdmUgY29kZV0nLCBidXRcclxuLy8gc2luY2UgdGhhIGNhbiBjaGFuZ2VzIGJldHdlZW4gYnJvd3NlcnMsIGlzIG1vcmUgY29uc2VydmF0aXZlXHJcbi8vIGNoZWNrIGFnYWluc3QgYSBjb21tb24gY29uc3RydWN0IGFuIGZhbGxiYWNrIG9uIHRoZVxyXG4vLyBjb21tb24gc29sdXRpb24gaWYgbm90IG1hdGNoZXMuXHJcbnZhciB0ZXN0RnVuY3Rpb24gPSAvXlxccypmdW5jdGlvblteXFwoXVxcKC87XHJcblxyXG5mdW5jdGlvbiBjbG9uZUZ1bmN0aW9uKGZuKSB7XHJcbiAgdmFyIHRlbXA7XHJcbiAgdmFyIGNvbnRlbnRzID0gZm4udG9TdHJpbmcoKTtcclxuICAvLyBDb3B5IHRvIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBzYW1lIHByb3RvdHlwZSwgZm9yIHRoZSBub3QgJ293bmVkJyBwcm9wZXJ0aWVzLlxyXG4gIC8vIEFzc2luZ2VkIGF0IHRoZSBlbmRcclxuICB2YXIgdGVtcFByb3RvID0gT2JqZWN0LmNyZWF0ZShmbi5wcm90b3R5cGUpO1xyXG5cclxuICAvLyBESVNBQkxFRCB0aGUgY29udGVudHMtY29weSBwYXJ0IGJlY2F1c2UgaXQgZmFpbHMgd2l0aCBjbG9zdXJlc1xyXG4gIC8vIGdlbmVyYXRlZCBieSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24sIHVzaW5nIHRoZSBzdWItY2FsbCB3YXkgZXZlclxyXG4gIGlmICh0cnVlIHx8ICF0ZXN0RnVuY3Rpb24udGVzdChjb250ZW50cykpIHtcclxuICAgIC8vIENoZWNrIGlmIGlzIGFscmVhZHkgYSBjbG9uZWQgY29weSwgdG9cclxuICAgIC8vIHJldXNlIHRoZSBvcmlnaW5hbCBjb2RlIGFuZCBhdm9pZCBtb3JlIHRoYW5cclxuICAgIC8vIG9uZSBkZXB0aCBpbiBzdGFjayBjYWxscyAoZ3JlYXQhKVxyXG4gICAgaWYgKHR5cGVvZiBmbi5wcm90b3R5cGUuX19fY2xvbmVkX29mID09ICdmdW5jdGlvbicpXHJcbiAgICAgIGZuID0gZm4ucHJvdG90eXBlLl9fX2Nsb25lZF9vZjtcclxuXHJcbiAgICB0ZW1wID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZm4uYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7IH07XHJcblxyXG4gICAgLy8gU2F2ZSBtYXJrIGFzIGNsb25lZC4gRG9uZSBpbiBpdHMgcHJvdG90eXBlXHJcbiAgICAvLyB0byBub3QgYXBwZWFyIGluIHRoZSBsaXN0IG9mICdvd25lZCcgcHJvcGVydGllcy5cclxuICAgIHRlbXBQcm90by5fX19jbG9uZWRfb2YgPSBmbjtcclxuICAgIC8vIFJlcGxhY2UgdG9TdHJpbmcgdG8gcmV0dXJuIHRoZSBvcmlnaW5hbCBzb3VyY2U6XHJcbiAgICB0ZW1wUHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBmbi50b1N0cmluZygpO1xyXG4gICAgfTtcclxuICAgIC8vIFRoZSBuYW1lIGNhbm5vdCBiZSBzZXQsIHdpbGwganVzdCBiZSBhbm9ueW1vdXNcclxuICAgIC8vdGVtcC5uYW1lID0gdGhhdC5uYW1lO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBUaGlzIHdheSBvbiBjYXBhYmxlIGJyb3dzZXJzIHByZXNlcnZlIHRoZSBvcmlnaW5hbCBuYW1lLFxyXG4gICAgLy8gZG8gYSByZWFsIGluZGVwZW5kZW50IGNvcHkgYW5kIGF2b2lkIGZ1bmN0aW9uIHN1YmNhbGxzIHRoYXRcclxuICAgIC8vIGNhbiBkZWdyYXRlIHBlcmZvcm1hbmNlIGFmdGVyIGxvdCBvZiAnY2xvbm5pbmcnLlxyXG4gICAgdmFyIGYgPSBGdW5jdGlvbjtcclxuICAgIHRlbXAgPSAobmV3IGYoJ3JldHVybiAnICsgY29udGVudHMpKSgpO1xyXG4gIH1cclxuXHJcbiAgdGVtcC5wcm90b3R5cGUgPSB0ZW1wUHJvdG87XHJcbiAgLy8gQ29weSBhbnkgcHJvcGVydGllcyBpdCBvd25zXHJcbiAgZXh0ZW5kKHRlbXAsIGZuKTtcclxuXHJcbiAgcmV0dXJuIHRlbXA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsb25lUGx1Z0luKCkge1xyXG4gIGlmICh0eXBlb2YgRnVuY3Rpb24ucHJvdG90eXBlLmNsb25lICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBGdW5jdGlvbi5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSgpIHsgcmV0dXJuIGNsb25lRnVuY3Rpb24odGhpcyk7IH07XHJcbiAgfVxyXG4gIGlmICh0eXBlb2YgT2JqZWN0LnByb3RvdHlwZS5jbG9uZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgT2piZWN0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkgeyByZXR1cm4gY2xvbmVPYmplY3QodGhpcyk7IH07XHJcbiAgfVxyXG59XHJcblxyXG5leHRlbmQuY2xvbmVPYmplY3QgPSBjbG9uZU9iamVjdDtcclxuZXh0ZW5kLmNsb25lRnVuY3Rpb24gPSBjbG9uZUZ1bmN0aW9uO1xyXG5leHRlbmQuY2xvbmVQbHVnSW4gPSBjbG9uZVBsdWdJbjtcclxuIiwiLyoqXHJcbiogQ29va2llcyBtYW5hZ2VtZW50LlxyXG4qIE1vc3QgY29kZSBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQ4MjU2OTUvMTYyMjM0NlxyXG4qL1xyXG52YXIgQ29va2llID0ge307XHJcblxyXG5Db29raWUuc2V0ID0gZnVuY3Rpb24gc2V0Q29va2llKG5hbWUsIHZhbHVlLCBkYXlzKSB7XHJcbiAgICB2YXIgZXhwaXJlcyA9IFwiXCI7XHJcbiAgICBpZiAoZGF5cykge1xyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldFRpbWUoZGF0ZS5nZXRUaW1lKCkgKyAoZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApKTtcclxuICAgICAgICBleHBpcmVzID0gXCI7IGV4cGlyZXM9XCIgKyBkYXRlLnRvR01UU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsgXCI9XCIgKyB2YWx1ZSArIGV4cGlyZXMgKyBcIjsgcGF0aD0vXCI7XHJcbn07XHJcbkNvb2tpZS5nZXQgPSBmdW5jdGlvbiBnZXRDb29raWUoY19uYW1lKSB7XHJcbiAgICBpZiAoZG9jdW1lbnQuY29va2llLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjX3N0YXJ0ID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoY19uYW1lICsgXCI9XCIpO1xyXG4gICAgICAgIGlmIChjX3N0YXJ0ICE9IC0xKSB7XHJcbiAgICAgICAgICAgIGNfc3RhcnQgPSBjX3N0YXJ0ICsgY19uYW1lLmxlbmd0aCArIDE7XHJcbiAgICAgICAgICAgIGNfZW5kID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoXCI7XCIsIGNfc3RhcnQpO1xyXG4gICAgICAgICAgICBpZiAoY19lbmQgPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGNfZW5kID0gZG9jdW1lbnQuY29va2llLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdW5lc2NhcGUoZG9jdW1lbnQuY29va2llLnN1YnN0cmluZyhjX3N0YXJ0LCBjX2VuZCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBcIlwiO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDb29raWU7IiwiLyoqIENvbm5lY3QgYWNjb3VudCB3aXRoIEZhY2Vib29rXHJcbioqL1xyXG52YXJcclxuICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKSxcclxuICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpLFxyXG4gIExjVXJsID0gcmVxdWlyZSgnLi9MY1VybCcpLFxyXG4gIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmZ1bmN0aW9uIEZhY2Vib29rQ29ubmVjdChvcHRpb25zKSB7XHJcbiAgJC5leHRlbmQodGhpcywgb3B0aW9ucyk7XHJcbiAgaWYgKCEkKCcjZmItcm9vdCcpLmxlbmd0aClcclxuICAgICQoJzxkaXYgaWQ9XCJmYi1yb290XCIgc3R5bGU9XCJkaXNwbGF5OiBub25lXCI+PC9kaXY+JykuYXBwZW5kVG8oJ2JvZHknKTtcclxufVxyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZSA9IHtcclxuICBhcHBJZDogbnVsbCxcclxuICBsYW5nOiAnZW5fVVMnLFxyXG4gIHJlc3VsdFR5cGU6ICdqc29uJywgLy8gJ3JlZGlyZWN0J1xyXG4gIGZiVXJsQmFzZTogJy8vY29ubmVjdC5mYWNlYm9vay5uZXQvQChsYW5nKS9hbGwuanMnLFxyXG4gIHNlcnZlclVybEJhc2U6IExjVXJsLkxhbmdQYXRoICsgJ0FjY291bnQvRmFjZWJvb2svQCh1cmxTZWN0aW9uKS8/UmVkaXJlY3Q9QChyZWRpcmVjdFVybCkmcHJvZmlsZT1AKHByb2ZpbGVVcmwpJyxcclxuICByZWRpcmVjdFVybDogJycsXHJcbiAgcHJvZmlsZVVybDogJycsXHJcbiAgdXJsU2VjdGlvbjogJycsXHJcbiAgbG9hZGluZ1RleHQ6ICdWZXJpZmluZycsXHJcbiAgcGVybWlzc2lvbnM6ICcnLFxyXG4gIGxpYkxvYWRlZEV2ZW50OiAnRmFjZWJvb2tDb25uZWN0TGliTG9hZGVkJyxcclxuICBjb25uZWN0ZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdENvbm5lY3RlZCdcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuZ2V0RmJVcmwgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5mYlVybEJhc2UucmVwbGFjZSgvQFxcKGxhbmdcXCkvZywgdGhpcy5sYW5nKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuZ2V0U2VydmVyVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuc2VydmVyVXJsQmFzZVxyXG4gIC5yZXBsYWNlKC9AXFwocmVkaXJlY3RVcmxcXCkvZywgdGhpcy5yZWRpcmVjdFVybClcclxuICAucmVwbGFjZSgvQFxcKHByb2ZpbGVVcmxcXCkvZywgdGhpcy5wcm9maWxlVXJsKVxyXG4gIC5yZXBsYWNlKC9AXFwodXJsU2VjdGlvblxcKS9nLCB0aGlzLnVybFNlY3Rpb24pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5sb2FkTGliID0gZnVuY3Rpb24gKCkge1xyXG4gIC8vIE9ubHkgaWYgaXMgbm90IGxvYWRlZCBzdGlsbFxyXG4gIC8vIChGYWNlYm9vayBzY3JpcHQgYXR0YWNoIGl0c2VsZiBhcyB0aGUgZ2xvYmFsIHZhcmlhYmxlICdGQicpXHJcbiAgaWYgKCF3aW5kb3cuRkIgJiYgIXRoaXMuX2xvYWRpbmdMaWIpIHtcclxuICAgIHRoaXMuX2xvYWRpbmdMaWIgPSB0cnVlO1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICBzY3JpcHRzOiBbdGhpcy5nZXRGYlVybCgpXSxcclxuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBGQi5pbml0KHsgYXBwSWQ6IHRoYXQuYXBwSWQsIHN0YXR1czogdHJ1ZSwgY29va2llOiB0cnVlLCB4ZmJtbDogdHJ1ZSB9KTtcclxuICAgICAgICB0aGF0LmxvYWRpbmdMaWIgPSBmYWxzZTtcclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoYXQubGliTG9hZGVkRXZlbnQpO1xyXG4gICAgICB9LFxyXG4gICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5GQjtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5wcm9jZXNzUmVzcG9uc2UgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICBpZiAocmVzcG9uc2UuYXV0aFJlc3BvbnNlKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IFdlbGNvbWUhJyk7XHJcbiAgICB2YXIgdXJsID0gdGhpcy5nZXRTZXJ2ZXJVcmwoKTtcclxuICAgIGlmICh0aGlzLnJlc3VsdFR5cGUgPT0gXCJyZWRpcmVjdFwiKSB7XHJcbiAgICAgIHJlZGlyZWN0VG8odXJsKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwianNvblwiKSB7XHJcbiAgICAgIHBvcHVwKHVybCwgJ3NtYWxsJywgbnVsbCwgdGhpcy5sb2FkaW5nVGV4dCk7XHJcbiAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIodGhpcy5jb25uZWN0ZWRFdmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLypGQi5hcGkoJy9tZScsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogR29vZCB0byBzZWUgeW91LCAnICsgcmVzcG9uc2UubmFtZSArICcuJyk7XHJcbiAgICB9KTsqL1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IFVzZXIgY2FuY2VsbGVkIGxvZ2luIG9yIGRpZCBub3QgZnVsbHkgYXV0aG9yaXplLicpO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUub25MaWJSZWFkeSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gIGlmICh3aW5kb3cuRkIpXHJcbiAgICBjYWxsYmFjaygpO1xyXG4gIGVsc2Uge1xyXG4gICAgdGhpcy5sb2FkTGliKCk7XHJcbiAgICAkKGRvY3VtZW50KS5vbih0aGlzLmxpYkxvYWRlZEV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB0aGlzLm9uTGliUmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgRkIubG9naW4oJC5wcm94eSh0aGF0LnByb2Nlc3NSZXNwb25zZSwgdGhhdCksIHsgc2NvcGU6IHRoYXQucGVybWlzc2lvbnMgfSk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmF1dG9Db25uZWN0T24gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdjbGljaycsIHNlbGVjdG9yIHx8ICdhLmZhY2Vib29rLWNvbm5lY3QnLCAkLnByb3h5KHRoaXMuY29ubmVjdCwgdGhpcykpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGYWNlYm9va0Nvbm5lY3Q7IiwiLypnbG9iYWwgZG9jdW1lbnQqL1xyXG4vKipcclxuICAgIEhlbHBQb2ludCBQb3BvdmVyICM1NTlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2Jvb3RzdHJhcCcpO1xyXG5cclxuZnVuY3Rpb24gSGVscFBvaW50KGVsZW1lbnQpIHtcclxuXHJcbiAgICB2YXIgJGVsID0gJChlbGVtZW50KTtcclxuXHJcbiAgICAkZWxcclxuICAgIC5wb3BvdmVyKHtcclxuICAgICAgICBjb250YWluZXI6ICdib2R5J1xyXG4gICAgfSlcclxuICAgIC5maWx0ZXIoJ2FbaHJlZj1cIiNcIl0nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIC8vIEF2b2lkIG5hdmlnYXRlIHRvIHRoZSBsaW5rLCB3aGVuIGltcGxlbWVudGVkXHJcbiAgICAgICAgLy8gbGlrZSBhbiBpbnRlcm5hbCBsaW5rIHdpdGggbm90aGluZ1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiAkZWw7XHJcbn1cclxuXHJcbmV4cG9ydHMuSGVscFBvaW50ID0gSGVscFBvaW50O1xyXG5cclxuSGVscFBvaW50LmVuYWJsZUFsbCA9IGZ1bmN0aW9uIGVuYWJsZUFsbChpbkNvbnRhaW5lcikge1xyXG5cclxuICAgICQoaW5Db250YWluZXIgfHwgZG9jdW1lbnQpLmZpbmQoJy5IZWxwUG9pbnQnKS50b0FycmF5KCkuZm9yRWFjaChIZWxwUG9pbnQpO1xyXG59O1xyXG4iLCIvKiogSW1wbGVtZW50cyBhIHNpbWlsYXIgTGNVcmwgb2JqZWN0IGxpa2UgdGhlIHNlcnZlci1zaWRlIG9uZSwgYmFzaW5nXHJcbiAgICBpbiB0aGUgaW5mb3JtYXRpb24gYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGF0ICdodG1sJyB0YWcgaW4gdGhlIFxyXG4gICAgJ2RhdGEtYmFzZS11cmwnIGF0dHJpYnV0ZSAodGhhdHMgdmFsdWUgaXMgdGhlIGVxdWl2YWxlbnQgZm9yIEFwcFBhdGgpLFxyXG4gICAgYW5kIHRoZSBsYW5nIGluZm9ybWF0aW9uIGF0ICdkYXRhLWN1bHR1cmUnLlxyXG4gICAgVGhlIHJlc3Qgb2YgVVJMcyBhcmUgYnVpbHQgZm9sbG93aW5nIHRoZSB3aW5kb3cubG9jYXRpb24gYW5kIHNhbWUgcnVsZXNcclxuICAgIHRoYW4gaW4gdGhlIHNlcnZlci1zaWRlIG9iamVjdC5cclxuKiovXHJcblxyXG52YXIgYmFzZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYmFzZS11cmwnKSxcclxuICAgIGxhbmcgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKSxcclxuICAgIGwgPSB3aW5kb3cubG9jYXRpb24sXHJcbiAgICB1cmwgPSBsLnByb3RvY29sICsgJy8vJyArIGwuaG9zdDtcclxuLy8gbG9jYXRpb24uaG9zdCBpbmNsdWRlcyBwb3J0LCBpZiBpcyBub3QgdGhlIGRlZmF1bHQsIHZzIGxvY2F0aW9uLmhvc3RuYW1lXHJcblxyXG5iYXNlID0gYmFzZSB8fCAnLyc7XHJcblxyXG52YXIgTGNVcmwgPSB7XHJcbiAgICBTaXRlVXJsOiB1cmwsXHJcbiAgICBBcHBQYXRoOiBiYXNlLFxyXG4gICAgQXBwVXJsOiB1cmwgKyBiYXNlLFxyXG4gICAgTGFuZ0lkOiBsYW5nLFxyXG4gICAgTGFuZ1BhdGg6IGJhc2UgKyBsYW5nICsgJy8nLFxyXG4gICAgTGFuZ1VybDogdXJsICsgYmFzZSArIGxhbmdcclxufTtcclxuTGNVcmwuTGFuZ1VybCA9IHVybCArIExjVXJsLkxhbmdQYXRoO1xyXG5MY1VybC5Kc29uUGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ0pTT04vJztcclxuTGNVcmwuSnNvblVybCA9IHVybCArIExjVXJsLkpzb25QYXRoO1xyXG5MY1VybC5SZXN0UGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ1JFU1QvJztcclxuTGNVcmwuUmVzdFVybCA9IHVybCArIExjVXJsLlJlc3RQYXRoO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1VybDsiLCIvKiBMb2Nvbm9taWNzIHNwZWNpZmljIFByaWNlLCBmZWVzIGFuZCBob3VyLXByaWNlIGNhbGN1bGF0aW9uXHJcbiAgICB1c2luZyBzb21lIHN0YXRpYyBtZXRob2RzIGFuZCB0aGUgUHJpY2UgY2xhc3MuXHJcbiovXHJcbnZhciBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG4vKiBDbGFzcyBQcmljZSB0byBjYWxjdWxhdGUgYSB0b3RhbCBwcmljZSBiYXNlZCBvbiBmZWVzIGluZm9ybWF0aW9uIChmaXhlZCBhbmQgcmF0ZSlcclxuICAgIGFuZCBkZXNpcmVkIGRlY2ltYWxzIGZvciBhcHByb3hpbWF0aW9ucy5cclxuKi9cclxuZnVuY3Rpb24gUHJpY2UoYmFzZVByaWNlLCBmZWUsIHJvdW5kZWREZWNpbWFscykge1xyXG4gICAgLy8gZmVlIHBhcmFtZXRlciBjYW4gYmUgYSBmbG9hdCBudW1iZXIgd2l0aCB0aGUgZmVlUmF0ZSBvciBhbiBvYmplY3RcclxuICAgIC8vIHRoYXQgaW5jbHVkZXMgYm90aCBhIGZlZVJhdGUgYW5kIGEgZml4ZWRGZWVBbW91bnRcclxuICAgIC8vIEV4dHJhY3RpbmcgZmVlIHZhbHVlcyBpbnRvIGxvY2FsIHZhcnM6XHJcbiAgICB2YXIgZmVlUmF0ZSA9IDAsIGZpeGVkRmVlQW1vdW50ID0gMDtcclxuICAgIGlmIChmZWUuZml4ZWRGZWVBbW91bnQgfHwgZmVlLmZlZVJhdGUpIHtcclxuICAgICAgICBmaXhlZEZlZUFtb3VudCA9IGZlZS5maXhlZEZlZUFtb3VudCB8fCAwO1xyXG4gICAgICAgIGZlZVJhdGUgPSBmZWUuZmVlUmF0ZSB8fCAwO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgZmVlUmF0ZSA9IGZlZTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGluZzpcclxuICAgIC8vIFRoZSByb3VuZFRvIHdpdGggYSBiaWcgZml4ZWQgZGVjaW1hbHMgaXMgdG8gYXZvaWQgdGhlXHJcbiAgICAvLyBkZWNpbWFsIGVycm9yIG9mIGZsb2F0aW5nIHBvaW50IG51bWJlcnNcclxuICAgIHZhciB0b3RhbFByaWNlID0gbXUuY2VpbFRvKG11LnJvdW5kVG8oYmFzZVByaWNlICogKDEgKyBmZWVSYXRlKSArIGZpeGVkRmVlQW1vdW50LCAxMiksIHJvdW5kZWREZWNpbWFscyk7XHJcbiAgICAvLyBmaW5hbCBmZWUgcHJpY2UgaXMgY2FsY3VsYXRlZCBhcyBhIHN1YnN0cmFjdGlvbiwgYnV0IGJlY2F1c2UgamF2YXNjcmlwdCBoYW5kbGVzXHJcbiAgICAvLyBmbG9hdCBudW1iZXJzIG9ubHksIGEgcm91bmQgb3BlcmF0aW9uIGlzIHJlcXVpcmVkIHRvIGF2b2lkIGFuIGlycmF0aW9uYWwgbnVtYmVyXHJcbiAgICB2YXIgZmVlUHJpY2UgPSBtdS5yb3VuZFRvKHRvdGFsUHJpY2UgLSBiYXNlUHJpY2UsIDIpO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIG9iamVjdCB3aXRoIGZ1bGwgZGV0YWlsczpcclxuICAgIHRoaXMuYmFzZVByaWNlID0gYmFzZVByaWNlO1xyXG4gICAgdGhpcy5mZWVSYXRlID0gZmVlUmF0ZTtcclxuICAgIHRoaXMuZml4ZWRGZWVBbW91bnQgPSBmaXhlZEZlZUFtb3VudDtcclxuICAgIHRoaXMucm91bmRlZERlY2ltYWxzID0gcm91bmRlZERlY2ltYWxzO1xyXG4gICAgdGhpcy50b3RhbFByaWNlID0gdG90YWxQcmljZTtcclxuICAgIHRoaXMuZmVlUHJpY2UgPSBmZWVQcmljZTtcclxufVxyXG5cclxuLyoqIENhbGN1bGF0ZSBhbmQgcmV0dXJucyB0aGUgcHJpY2UgYW5kIHJlbGV2YW50IGRhdGEgYXMgYW4gb2JqZWN0IGZvclxyXG50aW1lLCBob3VybHlSYXRlICh3aXRoIGZlZXMpIGFuZCB0aGUgaG91cmx5RmVlLlxyXG5UaGUgdGltZSAoQGR1cmF0aW9uKSBpcyB1c2VkICdhcyBpcycsIHdpdGhvdXQgdHJhbnNmb3JtYXRpb24sIG1heWJlIHlvdSBjYW4gcmVxdWlyZVxyXG51c2UgTEMucm91bmRUaW1lVG9RdWFydGVySG91ciBiZWZvcmUgcGFzcyB0aGUgZHVyYXRpb24gdG8gdGhpcyBmdW5jdGlvbi5cclxuSXQgcmVjZWl2ZXMgdGhlIHBhcmFtZXRlcnMgQGhvdXJseVByaWNlIGFuZCBAc3VyY2hhcmdlUHJpY2UgYXMgTEMuUHJpY2Ugb2JqZWN0cy5cclxuQHN1cmNoYXJnZVByaWNlIGlzIG9wdGlvbmFsLlxyXG4qKi9cclxuZnVuY3Rpb24gY2FsY3VsYXRlSG91cmx5UHJpY2UoZHVyYXRpb24sIGhvdXJseVByaWNlLCBzdXJjaGFyZ2VQcmljZSkge1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gc3VyY2hhcmdlLCBnZXQgemVyb3NcclxuICAgIHN1cmNoYXJnZVByaWNlID0gc3VyY2hhcmdlUHJpY2UgfHwgeyB0b3RhbFByaWNlOiAwLCBmZWVQcmljZTogMCwgYmFzZVByaWNlOiAwIH07XHJcbiAgICAvLyBHZXQgaG91cnMgZnJvbSByb3VuZGVkIGR1cmF0aW9uOlxyXG4gICAgdmFyIGhvdXJzID0gbXUucm91bmRUbyhkdXJhdGlvbi50b3RhbEhvdXJzKCksIDIpO1xyXG4gICAgLy8gQ2FsY3VsYXRlIGZpbmFsIHByaWNlc1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3RhbFByaWNlOiAgICAgbXUucm91bmRUbyhob3VybHlQcmljZS50b3RhbFByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS50b3RhbFByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIGZlZVByaWNlOiAgICAgICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLmZlZVByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS5mZWVQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAgbXUucm91bmRUbyhob3VybHlQcmljZS5iYXNlUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLmJhc2VQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBkdXJhdGlvbkhvdXJzOiAgaG91cnNcclxuICAgIH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIFByaWNlOiBQcmljZSxcclxuICAgICAgICBjYWxjdWxhdGVIb3VybHlQcmljZTogY2FsY3VsYXRlSG91cmx5UHJpY2VcclxuICAgIH07IiwiLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNTkzNjM3L2hvdy10by1lc2NhcGUtcmVndWxhci1leHByZXNzaW9uLWluLWphdmFzY3JpcHRcclxuUmVnRXhwLnF1b3RlID0gZnVuY3Rpb24gKHN0cikge1xyXG4gIHJldHVybiAoc3RyICsgJycpLnJlcGxhY2UoLyhbLj8qK14kW1xcXVxcXFwoKXt9fC1dKS9nLCBcIlxcXFwkMVwiKTtcclxufTtcclxuIiwiLyoqXHJcbiAgQSB2ZXJ5IHNpbXBsZSBzbGlkZXIgaW1wbGVtZW50YXRpb24gaW5pdGlhbGx5IGNyZWF0ZWRcclxuICBmb3IgdGhlIHByb3ZpZGVyLXdlbGNvbWUgbGFuZGluZyBwYWdlIGFuZFxyXG4gIG90aGVyIHNpbWlsYXIgdXNlcy5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vUmVnRXhwLnF1b3RlJyk7XHJcblxyXG52YXIgU2ltcGxlU2xpZGVyID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBTaW1wbGVTbGlkZXIob3B0cykge1xyXG4gICQuZXh0ZW5kKHRydWUsIHRoaXMsIG9wdHMpO1xyXG5cclxuICB0aGlzLmVsZW1lbnQgPSAkKHRoaXMuZWxlbWVudCk7XHJcbiAgdGhpcy5jdXJyZW50SW5kZXggPSAwO1xyXG5cclxuICAvKipcclxuICBBY3Rpb25zIGhhbmRsZXIgdG8gbW92ZSBzbGlkZXNcclxuICAqKi9cclxuICB2YXIgY2hlY2tIcmVmID0gbmV3IFJlZ0V4cCgnXiMnICsgUmVnRXhwLnF1b3RlKHRoaXMuaHJlZlByZWZpeCkgKyAnKC4qKScpLFxyXG4gICAgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5lbGVtZW50Lm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGhyZWYgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG4gICAgdmFyIHJlcyA9IGNoZWNrSHJlZi5leGVjKGhyZWYpO1xyXG5cclxuICAgIGlmIChyZXMgJiYgcmVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgdmFyIGluZGV4ID0gcmVzWzFdO1xyXG4gICAgICBpZiAoaW5kZXggPT0gJ3ByZXZpb3VzJykge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZSh0aGF0LmN1cnJlbnRJbmRleCAtIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGluZGV4ID09ICduZXh0Jykge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZSh0aGF0LmN1cnJlbnRJbmRleCArIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKC9cXGQrLy50ZXN0KGluZGV4KSkge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZShwYXJzZUludChpbmRleCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogRG8gYWxsIHRoZSBzZXR1cCBvbiBzbGlkZXIgYW5kIHNsaWRlc1xyXG4gIHRvIGVuc3VyZSB0aGUgbW92ZW1lbnQgd2lsbCB3b3JrIGZpbmUuXHJcbiAgSXRzIGRvbmUgYXV0b21hdGljIG9uXHJcbiAgaW5pdGlhbGl6aW5nLCBpcyBqdXN0IGEgcHVibGljIG1ldGhvZCBmb3IgXHJcbiAgY29udmVuaWVuY2UgKG1heWJlIHRvIGJlIGNhbGwgaWYgc2xpZGVzIGFyZVxyXG4gIGFkZGVkL3JlbW92ZWQgYWZ0ZXIgaW5pdCkuXHJcbiAgKiovXHJcbiAgdGhpcy5yZWRyYXcgPSBmdW5jdGlvbiBzbGlkZXNSZXBvc2l0aW9uKCkge1xyXG4gICAgdmFyIHNsaWRlcyA9IHRoaXMuZ2V0U2xpZGVzKCksXHJcbiAgICAgIGMgPSB0aGlzLmdldFNsaWRlc0NvbnRhaW5lcigpO1xyXG4gICAgLy8gTG9vayBmb3IgdGhlIGNvbnRhaW5lciBzaXplLCBmcm9tIHRoZSBcclxuICAgIC8vIGJpZ2dlciBzbGlkZTpcclxuICAgIHZhciBcclxuICAgICAgdyA9IDAsXHJcbiAgICAgIGggPSAwO1xyXG4gICAgc2xpZGVzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgXHJcbiAgICAgICAgdCA9ICQodGhpcyksXHJcbiAgICAgICAgdHcgPSB0Lm91dGVyV2lkdGgoKSxcclxuICAgICAgICB0aCA9IHQub3V0ZXJIZWlnaHQoKTtcclxuICAgICAgaWYgKHR3ID4gdylcclxuICAgICAgICB3ID0gdHc7XHJcbiAgICAgIGlmICh0aCA+IGgpXHJcbiAgICAgICAgaCA9IHRoO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ1NTIHNldHVwLCBcclxuICAgIC8vIGFsbCBzbGlkZXMgaW4gdGhlIHNhbWUgbGluZSxcclxuICAgIC8vIGFsbCB3aXRoIHNhbWUgc2l6ZSAoZXh0cmEgc3BhY2luZyBjYW5cclxuICAgIC8vIGJlIGdpdmVuIHdpdGggQ1NTKVxyXG4gICAgYy5jc3Moe1xyXG4gICAgICB3aWR0aDogdyAtIChjLm91dGVyV2lkdGgoKSAtIGMud2lkdGgoKSksXHJcbiAgICAgIC8vaGVpZ2h0OiBoIC0gKGMub3V0ZXJIZWlnaHQoKSAtIGMuaGVpZ2h0KCkpLFxyXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxyXG4gICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgc2xpZGVzLmNzcyh7XHJcbiAgICAgIHdoaXRlU3BhY2U6ICdub3JtYWwnLFxyXG4gICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ1xyXG4gICAgfSkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgdC5jc3Moe1xyXG4gICAgICAgIHdpZHRoOiB3IC0gKHQub3V0ZXJXaWR0aCgpIC0gdC53aWR0aCgpKVxyXG4gICAgICAgIC8vLGhlaWdodDogaCAtICh0Lm91dGVySGVpZ2h0KCkgLSB0LmhlaWdodCgpKVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlcG9zaXRpb25hdGUgYXQgdGhlIGJlZ2dpbmluZzpcclxuICAgIGNbMF0uc2Nyb2xsTGVmdCA9IDA7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR28gdG8gYSBzbGlkZSBieSBpbmRleFxyXG4gICoqL1xyXG4gIHRoaXMuZ29TbGlkZSA9IGZ1bmN0aW9uIGdvU2xpZGUoaW5kZXgpIHtcclxuICAgIHZhciBwcmV2ID0gdGhpcy5jdXJyZW50SW5kZXg7XHJcbiAgICBpZiAocHJldiA9PSBpbmRleClcclxuICAgICAgcmV0dXJuO1xyXG5cclxuICAgIC8vIENoZWNrIGJvdW5kc1xyXG4gICAgaWYgKGluZGV4IDwgMSlcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgdmFyIHNsaWRlcyA9IHRoaXMuZ2V0U2xpZGVzKCk7XHJcbiAgICBpZiAoaW5kZXggPiBzbGlkZXMubGVuZ3RoKVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgLy8gR29vZCBpbmRleCwgc2V0IGFzIGN1cnJlbnRcclxuICAgIHRoaXMuY3VycmVudEluZGV4ID0gaW5kZXg7XHJcbiAgICAvLyBTZXQgbGlua3MgdG8gdGhpcyBhcyBjdXJyZW50LCByZW1vdmluZyBhbnkgcHJldmlvdXM6XHJcbiAgICB0aGlzLmVsZW1lbnQuZmluZCgnW2hyZWY9IycgKyB0aGlzLmhyZWZQcmVmaXggKyBpbmRleCArICddJylcclxuICAgIC5hZGRDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKVxyXG4gICAgLnBhcmVudCgnbGknKS5hZGRDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKTtcclxuICAgIHRoaXMuZWxlbWVudC5maW5kKCdbaHJlZj0jJyArIHRoaXMuaHJlZlByZWZpeCArIHByZXYgKyAnXScpXHJcbiAgICAucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcylcclxuICAgIC5wYXJlbnQoJ2xpJykucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcyk7XHJcblxyXG4gICAgdmFyIFxyXG4gICAgICBzbGlkZSA9ICQoc2xpZGVzLmdldChpbmRleCAtIDEpKSxcclxuICAgICAgYyA9IHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyKCksXHJcbiAgICAgIGxlZnQgPSBjLnNjcm9sbExlZnQoKSArIHNsaWRlLnBvc2l0aW9uKCkubGVmdDtcclxuXHJcbiAgICBjLnN0b3AoKS5hbmltYXRlKHsgc2Nyb2xsTGVmdDogbGVmdCB9LCB0aGlzLmR1cmF0aW9uKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHZXQgdGhlIGpRdWVyeSBjb2xsZWN0aW9uIG9mIHNsaWRlc1xyXG4gICoqL1xyXG4gIHRoaXMuZ2V0U2xpZGVzID0gZnVuY3Rpb24gZ2V0U2xpZGVzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGVzKVxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGUpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR2V0IHRoZSBqUXVlcnkgZWxlbWVudCBmb3IgdGhlIGNvbnRhaW5lciBvZiBzbGlkZXNcclxuICAqKi9cclxuICB0aGlzLmdldFNsaWRlc0NvbnRhaW5lciA9IGZ1bmN0aW9uIGdldFNsaWRlc0NvbnRhaW5lcigpIHtcclxuICAgIHJldHVybiB0aGlzLmVsZW1lbnRcclxuICAgIC5maW5kKHRoaXMuc2VsZWN0b3JzLnNsaWRlcyk7XHJcbiAgfTtcclxuXHJcbiAgLyoqIExhc3QgaW5pdCBzdGVwc1xyXG4gICoqL1xyXG4gIHRoaXMucmVkcmF3KCk7XHJcbn07XHJcblxyXG5TaW1wbGVTbGlkZXIucHJvdG90eXBlID0ge1xyXG4gIGVsZW1lbnQ6IG51bGwsXHJcbiAgc2VsZWN0b3JzOiB7XHJcbiAgICBzbGlkZXM6ICcuc2xpZGVzJyxcclxuICAgIHNsaWRlOiAnbGkuc2xpZGUnXHJcbiAgfSxcclxuICBjdXJyZW50U2xpZGVDbGFzczogJ2pzLWlzQ3VycmVudCcsXHJcbiAgaHJlZlByZWZpeDogJ2dvU2xpZGVfJyxcclxuICAvLyBEdXJhdGlvbiBvZiBlYWNoIHNsaWRlIGluIG1pbGxpc2Vjb25kc1xyXG4gIGR1cmF0aW9uOiAxMDAwXHJcbn07IiwiLyoqIFBvbHlmaWxsIGZvciBzdHJpbmcuY29udGFpbnNcclxuKiovXHJcbmlmICghKCdjb250YWlucycgaW4gU3RyaW5nLnByb3RvdHlwZSkpXHJcbiAgICBTdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKHN0ciwgc3RhcnRJbmRleCkgeyByZXR1cm4gLTEgIT09IHRoaXMuaW5kZXhPZihzdHIsIHN0YXJ0SW5kZXgpOyB9OyIsIi8qKiA9PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIEEgc2ltcGxlIFN0cmluZyBGb3JtYXRcclxuICogZnVuY3Rpb24gZm9yIGphdmFzY3JpcHRcclxuICogQXV0aG9yOiBJYWdvIExvcmVuem8gU2FsZ3VlaXJvXHJcbiAqIE1vZHVsZTogQ29tbW9uSlNcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaW5nRm9ybWF0KCkge1xyXG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG5cdHZhciBmb3JtYXR0ZWQgPSBhcmdzWzBdO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7JytpKydcXFxcfScsICdnaScpO1xyXG5cdFx0Zm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UocmVnZXhwLCBhcmdzW2krMV0pO1xyXG5cdH1cclxuXHRyZXR1cm4gZm9ybWF0dGVkO1xyXG59OyIsIi8qKlxyXG4gICAgR2VuZXJhbCBhdXRvLWxvYWQgc3VwcG9ydCBmb3IgdGFiczogXHJcbiAgICBJZiB0aGVyZSBpcyBubyBjb250ZW50IHdoZW4gZm9jdXNlZCwgdGhleSB1c2UgdGhlICdyZWxvYWQnIGpxdWVyeSBwbHVnaW5cclxuICAgIHRvIGxvYWQgaXRzIGNvbnRlbnQgLXRhYnMgbmVlZCB0byBiZSBjb25maWd1cmVkIHdpdGggZGF0YS1zb3VyY2UtdXJsIGF0dHJpYnV0ZVxyXG4gICAgaW4gb3JkZXIgdG8ga25vdyB3aGVyZSB0byBmZXRjaCB0aGUgY29udGVudC0uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5yZWxvYWQnKTtcclxuXHJcbi8vIERlcGVuZGVuY3kgVGFiYmVkVVggZnJvbSBESVxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoVGFiYmVkVVgpIHtcclxuICAgIC8vIFRhYmJlZFVYLnNldHVwLnRhYkJvZHlTZWxlY3RvciB8fCAnLnRhYi1ib2R5J1xyXG4gICAgJCgnLnRhYi1ib2R5Jykub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoJHQuY2hpbGRyZW4oKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICR0LnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBUaGlzIGFkZHMgbm90aWZpY2F0aW9ucyB0byB0YWJzIGZyb20gdGhlIFRhYmJlZFVYIHN5c3RlbSB1c2luZ1xyXG4gICAgdGhlIGNoYW5nZXNOb3RpZmljYXRpb24gdXRpbGl0eSB0aGF0IGRldGVjdHMgbm90IHNhdmVkIGNoYW5nZXMgb24gZm9ybXMsXHJcbiAgICBzaG93aW5nIHdhcm5pbmcgbWVzc2FnZXMgdG8gdGhlXHJcbiAgICB1c2VyIGFuZCBtYXJraW5nIHRhYnMgKGFuZCBzdWItdGFicyAvIHBhcmVudC10YWJzIHByb3Blcmx5KSB0b1xyXG4gICAgZG9uJ3QgbG9zdCBjaGFuZ2VzIG1hZGUuXHJcbiAgICBBIGJpdCBvZiBDU1MgZm9yIHRoZSBhc3NpZ25lZCBjbGFzc2VzIHdpbGwgYWxsb3cgZm9yIHZpc3VhbCBtYXJrcy5cclxuXHJcbiAgICBBS0E6IERvbid0IGxvc3QgZGF0YSEgd2FybmluZyBtZXNzYWdlIDstKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxuLy8gVGFiYmVkVVggZGVwZW5kZW5jeSBhcyBESVxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoVGFiYmVkVVgsIHRhcmdldFNlbGVjdG9yKSB7XHJcbiAgICB2YXIgdGFyZ2V0ID0gJCh0YXJnZXRTZWxlY3RvciB8fCAnLmNoYW5nZXMtbm90aWZpY2F0aW9uLWVuYWJsZWQnKTtcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24uaW5pdCh7IHRhcmdldDogdGFyZ2V0IH0pO1xyXG5cclxuICAgIC8vIEFkZGluZyBjaGFuZ2Ugbm90aWZpY2F0aW9uIHRvIHRhYi1ib2R5IGRpdnNcclxuICAgIC8vIChvdXRzaWRlIHRoZSBMQy5DaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzIHRvIGxlYXZlIGl0IGFzIGdlbmVyaWMgYW5kIHNpbXBsZSBhcyBwb3NzaWJsZSlcclxuICAgICQodGFyZ2V0KS5vbignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsICdmb3JtJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQodGhpcykucGFyZW50cygnLnRhYi1ib2R5JykuYWRkQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkaW5nIGNsYXNzIHRvIHRoZSBtZW51IGl0ZW0gKHRhYiB0aXRsZSlcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0uYWRkQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCd0aXRsZScsICQoJyNsY3Jlcy1jaGFuZ2VzLW5vdC1zYXZlZCcpLnRleHQoKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5vbignbGNDaGFuZ2VzTm90aWZpY2F0aW9uU2F2ZVJlZ2lzdGVyZWQnLCAnZm9ybScsIGZ1bmN0aW9uIChlLCBmLCBlbHMsIGZ1bGwpIHtcclxuICAgICAgICBpZiAoZnVsbClcclxuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcudGFiLWJvZHk6bm90KDpoYXMoZm9ybS5oYXMtY2hhbmdlcykpJykucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZpbmcgY2xhc3MgZnJvbSB0aGUgbWVudSBpdGVtICh0YWIgdGl0bGUpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC8vIFRvIGF2b2lkIHVzZXIgYmUgbm90aWZpZWQgb2YgY2hhbmdlcyBhbGwgdGltZSB3aXRoIHRhYiBtYXJrcywgd2UgYWRkZWQgYSAnbm90aWZ5JyBjbGFzc1xyXG4gICAgLy8gb24gdGFicyB3aGVuIGEgY2hhbmdlIG9mIHRhYiBoYXBwZW5zXHJcbiAgICAuZmluZCgnLnRhYi1ib2R5Jykub24oJ3RhYlVuZm9jdXNlZCcsIGZ1bmN0aW9uIChldmVudCwgZm9jdXNlZEN0eCkge1xyXG4gICAgICAgIHZhciBtaSA9IFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW07XHJcbiAgICAgICAgaWYgKG1pLmlzKCcuaGFzLWNoYW5nZXMnKSkge1xyXG4gICAgICAgICAgICBtaS5hZGRDbGFzcygnbm90aWZ5LWNoYW5nZXMnKTsgLy9oYXMtdG9vbHRpcFxyXG4gICAgICAgICAgICAvLyBTaG93IG5vdGlmaWNhdGlvbiBwb3B1cFxyXG4gICAgICAgICAgICB2YXIgZCA9ICQoJzxkaXYgY2xhc3M9XCJ3YXJuaW5nXCI+QDA8L2Rpdj48ZGl2IGNsYXNzPVwiYWN0aW9uc1wiPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJhY3Rpb24gY29udGludWVcIiB2YWx1ZT1cIkAyXCIvPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJhY3Rpb24gc3RvcFwiIHZhbHVlPVwiQDFcIi8+PC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AwL2csIExDLmdldFRleHQoJ2NoYW5nZXMtbm90LXNhdmVkJykpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDEvZywgTEMuZ2V0VGV4dCgndGFiLWhhcy1jaGFuZ2VzLXN0YXktb24nKSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMi9nLCBMQy5nZXRUZXh0KCd0YWItaGFzLWNoYW5nZXMtY29udGludWUtd2l0aG91dC1jaGFuZ2UnKSkpO1xyXG4gICAgICAgICAgICBkLm9uKCdjbGljaycsICcuc3RvcCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHdpbmRvdyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbignY2xpY2snLCAnLmNvbnRpbnVlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2Uod2luZG93KTtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSAnaGFzLWNoYW5nZXMnIHRvIGF2b2lkIGZ1dHVyZSBibG9ja3MgKHVudGlsIG5ldyBjaGFuZ2VzIGhhcHBlbnMgb2YgY291cnNlIDstKVxyXG4gICAgICAgICAgICAgICAgbWkucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJyk7XHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYihmb2N1c2VkQ3R4LnRhYi5nZXQoMCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihkLCB3aW5kb3csICdub3Qtc2F2ZWQtcG9wdXAnLCB7IGNsb3NhYmxlOiBmYWxzZSwgY2VudGVyOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRXZlciByZXR1cm4gZmFsc2UgdG8gc3RvcCBjdXJyZW50IHRhYiBmb2N1c1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdub3RpZnktY2hhbmdlcycpOyAvL2hhcy10b29sdGlwXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIFRhYmJlZFVYOiBUYWJiZWQgaW50ZXJmYWNlIGxvZ2ljOyB3aXRoIG1pbmltYWwgSFRNTCB1c2luZyBjbGFzcyAndGFiYmVkJyBmb3IgdGhlXHJcbmNvbnRhaW5lciwgdGhlIG9iamVjdCBwcm92aWRlcyB0aGUgZnVsbCBBUEkgdG8gbWFuaXB1bGF0ZSB0YWJzIGFuZCBpdHMgc2V0dXBcclxubGlzdGVuZXJzIHRvIHBlcmZvcm0gbG9naWMgb24gdXNlciBpbnRlcmFjdGlvbi5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5oYXNTY3JvbGxCYXInKTtcclxuXHJcbnZhciBUYWJiZWRVWCA9IHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKCdib2R5JykuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicyA+IGxpOm5vdCgudGFicy1zbGlkZXIpID4gYScsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGlmIChUYWJiZWRVWC5mb2N1c1RhYigkdC5hdHRyKCdocmVmJykpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3QgPSAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhhc2ggPSAkdC5hdHRyKCdocmVmJyk7XHJcbiAgICAgICAgICAgICAgICAkKCdodG1sLGJvZHknKS5zY3JvbGxUb3Aoc3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnbW91c2Vkb3duJywgVGFiYmVkVVguc3RhcnRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ21vdXNldXAgbW91c2VsZWF2ZScsIFRhYmJlZFVYLmVuZE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC8vIHRoZSBjbGljayByZXR1cm4gZmFsc2UgaXMgdG8gZGlzYWJsZSBzdGFuZGFyIHVybCBiZWhhdmlvclxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXItbGltaXQnLCAnbW91c2VlbnRlcicsIFRhYmJlZFVYLnN0YXJ0TW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyLWxpbWl0JywgJ21vdXNlbGVhdmUnLCBUYWJiZWRVWC5lbmRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicyA+IGxpLnJlbW92YWJsZScsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIC8vIE9ubHkgb24gZGlyZWN0IGNsaWNrcyB0byB0aGUgdGFiLCB0byBhdm9pZFxyXG4gICAgICAgICAgICAvLyBjbGlja3MgdG8gdGhlIHRhYi1saW5rICh0aGF0IHNlbGVjdC9mb2N1cyB0aGUgdGFiKTpcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0ID09IGUuY3VycmVudFRhcmdldClcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLnJlbW92ZVRhYihudWxsLCB0aGlzKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gSW5pdCBwYWdlIGxvYWRlZCB0YWJiZWQgY29udGFpbmVyczpcclxuICAgICAgICAkKCcudGFiYmVkJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIC8vIENvbnNpc3RlbmNlIGNoZWNrOiB0aGlzIG11c3QgYmUgYSB2YWxpZCBjb250YWluZXIsIHRoaXMgaXMsIG11c3QgaGF2ZSAudGFic1xyXG4gICAgICAgICAgICBpZiAoJHQuY2hpbGRyZW4oJy50YWJzJykubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAvLyBJbml0IHNsaWRlclxyXG4gICAgICAgICAgICBUYWJiZWRVWC5zZXR1cFNsaWRlcigkdCk7XHJcbiAgICAgICAgICAgIC8vIENsZWFuIHdoaXRlIHNwYWNlcyAodGhleSBjcmVhdGUgZXhjZXNpdmUgc2VwYXJhdGlvbiBiZXR3ZWVuIHNvbWUgdGFicylcclxuICAgICAgICAgICAgJCgnLnRhYnMnLCB0aGlzKS5jb250ZW50cygpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhIHRleHQgbm9kZSwgcmVtb3ZlIGl0OlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9kZVR5cGUgPT0gMylcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBtb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgZGlyID0gJHQuaGFzQ2xhc3MoJ3RhYnMtc2xpZGVyLXJpZ2h0JykgPyAxIDogLTE7XHJcbiAgICAgICAgdmFyIHRhYnNTbGlkZXIgPSAkdC5wYXJlbnQoKTtcclxuICAgICAgICB2YXIgdGFicyA9IHRhYnNTbGlkZXIuc2libGluZ3MoJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgdGFic1swXS5zY3JvbGxMZWZ0ICs9IDIwICogZGlyO1xyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYnNTbGlkZXIucGFyZW50KCksIHRhYnMpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBzdGFydE1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciB0YWJzID0gdC5jbG9zZXN0KCcudGFiYmVkJykuY2hpbGRyZW4oJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgLy8gU3RvcCBwcmV2aW91cyBhbmltYXRpb25zOlxyXG4gICAgICAgIHRhYnMuc3RvcCh0cnVlKTtcclxuICAgICAgICB2YXIgc3BlZWQgPSAwLjM7IC8qIHNwZWVkIHVuaXQ6IHBpeGVscy9taWxpc2Vjb25kcyAqL1xyXG4gICAgICAgIHZhciBmeGEgPSBmdW5jdGlvbiAoKSB7IFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYnMucGFyZW50KCksIHRhYnMpOyB9O1xyXG4gICAgICAgIHZhciB0aW1lO1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdyaWdodCcpKSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIGJhc2VkIG9uIHNwZWVkIHdlIHdhbnQgYW5kIGhvdyBtYW55IGRpc3RhbmNlIHRoZXJlIGlzOlxyXG4gICAgICAgICAgICB0aW1lID0gKHRhYnNbMF0uc2Nyb2xsV2lkdGggLSB0YWJzWzBdLnNjcm9sbExlZnQgLSB0YWJzLndpZHRoKCkpICogMSAvIHNwZWVkO1xyXG4gICAgICAgICAgICB0YWJzLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiB0YWJzWzBdLnNjcm9sbFdpZHRoIC0gdGFicy53aWR0aCgpIH0sXHJcbiAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIHN0ZXA6IGZ4YSwgY29tcGxldGU6IGZ4YSwgZWFzaW5nOiAnc3dpbmcnIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIGJhc2VkIG9uIHNwZWVkIHdlIHdhbnQgYW5kIGhvdyBtYW55IGRpc3RhbmNlIHRoZXJlIGlzOlxyXG4gICAgICAgICAgICB0aW1lID0gdGFic1swXS5zY3JvbGxMZWZ0ICogMSAvIHNwZWVkO1xyXG4gICAgICAgICAgICB0YWJzLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiAwIH0sXHJcbiAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIHN0ZXA6IGZ4YSwgY29tcGxldGU6IGZ4YSwgZWFzaW5nOiAnc3dpbmcnIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgZW5kTW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGFiQ29udGFpbmVyID0gJCh0aGlzKS5jbG9zZXN0KCcudGFiYmVkJyk7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpLnN0b3AodHJ1ZSk7XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFiQ29udGFpbmVyKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgY2hlY2tUYWJTbGlkZXJMaW1pdHM6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIHRhYnMpIHtcclxuICAgICAgICB0YWJzID0gdGFicyB8fCB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgLy8gU2V0IHZpc2liaWxpdHkgb2YgdmlzdWFsIGxpbWl0ZXJzOlxyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyLWxpbWl0LWxlZnQnKS50b2dnbGUodGFic1swXS5zY3JvbGxMZWZ0ID4gMCk7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXItbGltaXQtcmlnaHQnKS50b2dnbGUoXHJcbiAgICAgICAgICAgICh0YWJzWzBdLnNjcm9sbExlZnQgKyB0YWJzLndpZHRoKCkpIDwgdGFic1swXS5zY3JvbGxXaWR0aCk7XHJcbiAgICB9LFxyXG4gICAgc2V0dXBTbGlkZXI6IGZ1bmN0aW9uICh0YWJDb250YWluZXIpIHtcclxuICAgICAgICB2YXIgdHMgPSB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlcicpO1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzJykuaGFzU2Nyb2xsQmFyKHsgeDogLTIgfSkuaG9yaXpvbnRhbCkge1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuYWRkQ2xhc3MoJ2hhcy10YWJzLXNsaWRlcicpO1xyXG4gICAgICAgICAgICBpZiAodHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgdHMuY2xhc3NOYW1lID0gJ3RhYnMtc2xpZGVyJztcclxuICAgICAgICAgICAgICAgICQodHMpXHJcbiAgICAgICAgICAgICAgICAvLyBBcnJvd3M6XHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJ0YWJzLXNsaWRlci1sZWZ0IGxlZnRcIiBocmVmPVwiI1wiPiZsdDsmbHQ7PC9hPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJ0YWJzLXNsaWRlci1yaWdodCByaWdodFwiIGhyZWY9XCIjXCI+Jmd0OyZndDs8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXIuYXBwZW5kKHRzKTtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lclxyXG4gICAgICAgICAgICAgICAgLy8gRGVzaW5nIGRldGFpbHM6XHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGRpdiBjbGFzcz1cInRhYnMtc2xpZGVyLWxpbWl0IHRhYnMtc2xpZGVyLWxpbWl0LWxlZnQgbGVmdFwiIGhyZWY9XCIjXCI+PC9kaXY+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGFicy1zbGlkZXItbGltaXQgdGFicy1zbGlkZXItbGltaXQtcmlnaHQgcmlnaHRcIiBocmVmPVwiI1wiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHMuc2hvdygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLnJlbW92ZUNsYXNzKCdoYXMtdGFicy1zbGlkZXInKTtcclxuICAgICAgICAgICAgdHMuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJDb250YWluZXIpO1xyXG4gICAgfSxcclxuICAgIGdldFRhYkNvbnRleHRCeUFyZ3M6IGZ1bmN0aW9uIChhcmdzKSB7XHJcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgdHlwZW9mIChhcmdzWzBdKSA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFiQ29udGV4dChhcmdzWzBdLCBudWxsKTtcclxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJiBhcmdzWzBdLnRhYilcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMF07XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUYWJDb250ZXh0KFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAwID8gYXJnc1swXSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDEgPyBhcmdzWzFdIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMiA/IGFyZ3NbMl0gOiBudWxsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiQ29udGV4dDogZnVuY3Rpb24gKHRhYk9yU2VsZWN0b3IsIG1lbnVpdGVtT3JTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBtaSwgbWEsIHRhYiwgdGFiQ29udGFpbmVyO1xyXG4gICAgICAgIGlmICh0YWJPclNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRhYiA9ICQodGFiT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmICh0YWIubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lciA9IHRhYi5wYXJlbnRzKCcudGFiYmVkOmVxKDApJyk7XHJcbiAgICAgICAgICAgICAgICBtYSA9IHRhYkNvbnRhaW5lci5maW5kKCc+IC50YWJzID4gbGkgPiBhW2hyZWY9IycgKyB0YWIuZ2V0KDApLmlkICsgJ10nKTtcclxuICAgICAgICAgICAgICAgIG1pID0gbWEucGFyZW50KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKG1lbnVpdGVtT3JTZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBtYSA9ICQobWVudWl0ZW1PclNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKG1hLmlzKCdsaScpKSB7XHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hO1xyXG4gICAgICAgICAgICAgICAgbWEgPSBtaS5jaGlsZHJlbignYTplcSgwKScpO1xyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgIG1pID0gbWEucGFyZW50KCk7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lciA9IG1pLmNsb3Nlc3QoJy50YWJiZWQnKTtcclxuICAgICAgICAgICAgdGFiID0gdGFiQ29udGFpbmVyLmZpbmQoJz4udGFiLWJvZHlAMCwgPi50YWItYm9keS1saXN0Pi50YWItYm9keUAwJy5yZXBsYWNlKC9AMC9nLCBtYS5hdHRyKCdocmVmJykpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgdGFiOiB0YWIsIG1lbnVhbmNob3I6IG1hLCBtZW51aXRlbTogbWksIHRhYkNvbnRhaW5lcjogdGFiQ29udGFpbmVyIH07XHJcbiAgICB9LFxyXG4gICAgY2hlY2tUYWJDb250ZXh0OiBmdW5jdGlvbiAoY3R4LCBmdW5jdGlvbm5hbWUsIGFyZ3MsIGlzVGVzdCkge1xyXG4gICAgICAgIGlmICghY3R4LnRhYiB8fCBjdHgudGFiLmxlbmd0aCAhPSAxIHx8XHJcbiAgICAgICAgICAgICFjdHgubWVudWl0ZW0gfHwgY3R4Lm1lbnVpdGVtLmxlbmd0aCAhPSAxIHx8XHJcbiAgICAgICAgICAgICFjdHgudGFiQ29udGFpbmVyIHx8IGN0eC50YWJDb250YWluZXIubGVuZ3RoICE9IDEgfHwgXHJcbiAgICAgICAgICAgICFjdHgubWVudWFuY2hvciB8fCBjdHgubWVudWFuY2hvci5sZW5ndGggIT0gMSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzVGVzdCAmJiBjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdUYWJiZWRVWC4nICsgZnVuY3Rpb25uYW1lICsgJywgYmFkIGFyZ3VtZW50czogJyArIEFycmF5LmpvaW4oYXJncywgJywgJykpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGdldFRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2ZvY3VzVGFiJywgYXJndW1lbnRzLCB0cnVlKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgcmV0dXJuIGN0eC50YWIuZ2V0KDApO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZm9jdXNUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIEdldCBwcmV2aW91cyBmb2N1c2VkIHRhYiwgdHJpZ2dlciAndGFiVW5mb2N1c2VkJyBoYW5kbGVyIHRoYXQgY2FuXHJcbiAgICAgICAgLy8gc3RvcCB0aGlzIGZvY3VzIChyZXR1cm5pbmcgZXhwbGljaXR5ICdmYWxzZScpXHJcbiAgICAgICAgdmFyIHByZXZUYWIgPSBjdHgudGFiLnNpYmxpbmdzKCcuY3VycmVudCcpO1xyXG4gICAgICAgIGlmIChwcmV2VGFiLnRyaWdnZXJIYW5kbGVyKCd0YWJVbmZvY3VzZWQnLCBbY3R4XSkgPT09IGZhbHNlKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIENoZWNrIChmaXJzdCEpIGlmIHRoZXJlIGlzIGEgcGFyZW50IHRhYiBhbmQgZm9jdXMgaXQgdG9vICh3aWxsIGJlIHJlY3Vyc2l2ZSBjYWxsaW5nIHRoaXMgc2FtZSBmdW5jdGlvbilcclxuICAgICAgICB2YXIgcGFyVGFiID0gY3R4LnRhYi5wYXJlbnRzKCcudGFiLWJvZHk6ZXEoMCknKTtcclxuICAgICAgICBpZiAocGFyVGFiLmxlbmd0aCA9PSAxKSB0aGlzLmZvY3VzVGFiKHBhclRhYik7XHJcblxyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2N1cnJlbnQnKSB8fFxyXG4gICAgICAgICAgICBjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2Rpc2FibGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gVW5zZXQgY3VycmVudCBtZW51IGVsZW1lbnRcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2libGluZ3MoJy5jdXJyZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAuZmluZCgnPmEnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIC8vIFNldCBjdXJyZW50IG1lbnUgZWxlbWVudFxyXG4gICAgICAgIGN0eC5tZW51aXRlbS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIGN0eC5tZW51YW5jaG9yLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcblxyXG4gICAgICAgIC8vIEhpZGUgY3VycmVudCB0YWItYm9keVxyXG4gICAgICAgIHByZXZUYWIucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAvLyBTaG93IGN1cnJlbnQgdGFiLWJvZHkgYW5kIHRyaWdnZXIgZXZlbnRcclxuICAgICAgICBjdHgudGFiLmFkZENsYXNzKCdjdXJyZW50JylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJGb2N1c2VkJyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVGFiSW5kZXg6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIHRhYkluZGV4KSB7XHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lcilcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9jdXNUYWIodGhpcy5nZXRUYWJDb250ZXh0KHRhYkNvbnRhaW5lci5maW5kKCc+LnRhYi1ib2R5OmVxKCcgKyB0YWJJbmRleCArICcpJykpKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgLyogRW5hYmxlIGEgdGFiLCBkaXNhYmxpbmcgYWxsIG90aGVycyB0YWJzIC11c2VmdWxsIGluIHdpemFyZCBzdHlsZSBwYWdlcy0gKi9cclxuICAgIGVuYWJsZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2VuYWJsZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICB2YXIgcnRuID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5pcygnLmRpc2FibGVkJykpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGRpc2FibGVkIGNsYXNzIGZyb20gZm9jdXNlZCB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgICAgICBjdHgudGFiLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRW5hYmxlZCcpO1xyXG4gICAgICAgICAgICBjdHgubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgICAgIHJ0biA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEZvY3VzIHRhYjpcclxuICAgICAgICB0aGlzLmZvY3VzVGFiKGN0eCk7XHJcbiAgICAgICAgLy8gRGlzYWJsZWQgdGFicyBhbmQgbWVudSBpdGVtczpcclxuICAgICAgICBjdHgudGFiLnNpYmxpbmdzKCc6bm90KC5kaXNhYmxlZCknKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2Rpc2FibGVkJylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJEaXNhYmxlZCcpO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaWJsaW5ncygnOm5vdCguZGlzYWJsZWQpJylcclxuICAgICAgICAgICAgLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgICAgIHJldHVybiBydG47XHJcbiAgICB9LFxyXG4gICAgc2hvd2hpZGVEdXJhdGlvbjogMCxcclxuICAgIHNob3doaWRlRWFzaW5nOiBudWxsLFxyXG4gICAgc2hvd1RhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3Nob3dUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2hvdyB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgIGN0eC50YWIuc2hvdyh0aGlzLnNob3doaWRlRHVyYXRpb24pO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaG93KHRoaXMuc2hvd2hpZGVFYXNpbmcpO1xyXG4gICAgfSxcclxuICAgIGhpZGVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdoaWRlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNob3cgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICBjdHgudGFiLmhpZGUodGhpcy5zaG93aGlkZUR1cmF0aW9uKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uaGlkZSh0aGlzLnNob3doaWRlRWFzaW5nKTtcclxuICAgIH0sXHJcbiAgICB0YWJCb2R5Q2xhc3NFeGNlcHRpb25zOiB7ICd0YWItYm9keSc6IDAsICd0YWJiZWQnOiAwLCAnY3VycmVudCc6IDAsICdkaXNhYmxlZCc6IDAgfSxcclxuICAgIGNyZWF0ZVRhYjogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgaWROYW1lLCBsYWJlbCkge1xyXG4gICAgICAgIHRhYkNvbnRhaW5lciA9ICQodGFiQ29udGFpbmVyKTtcclxuICAgICAgICAvLyB0YWJDb250YWluZXIgbXVzdCBiZSBvbmx5IG9uZSBhbmQgdmFsaWQgY29udGFpbmVyXHJcbiAgICAgICAgLy8gYW5kIGlkTmFtZSBtdXN0IG5vdCBleGlzdHNcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyLmxlbmd0aCA9PSAxICYmIHRhYkNvbnRhaW5lci5pcygnLnRhYmJlZCcpICYmXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkTmFtZSkgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIHRhYiBkaXY6XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgdGFiLmlkID0gaWROYW1lO1xyXG4gICAgICAgICAgICAvLyBSZXF1aXJlZCBjbGFzc2VzXHJcbiAgICAgICAgICAgIHRhYi5jbGFzc05hbWUgPSBcInRhYi1ib2R5XCI7XHJcbiAgICAgICAgICAgIHZhciAkdGFiID0gJCh0YWIpO1xyXG4gICAgICAgICAgICAvLyBHZXQgYW4gZXhpc3Rpbmcgc2libGluZyBhbmQgY29weSAod2l0aCBzb21lIGV4Y2VwdGlvbnMpIHRoZWlyIGNzcyBjbGFzc2VzXHJcbiAgICAgICAgICAgICQuZWFjaCh0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWItYm9keTplcSgwKScpLmF0dHIoJ2NsYXNzJykuc3BsaXQoL1xccysvKSwgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAgICAgICAgIGlmICghKHYgaW4gVGFiYmVkVVgudGFiQm9keUNsYXNzRXhjZXB0aW9ucykpXHJcbiAgICAgICAgICAgICAgICAgICAgJHRhYi5hZGRDbGFzcyh2KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIEFkZCB0byBjb250YWluZXJcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFwcGVuZCh0YWIpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1lbnUgZW50cnlcclxuICAgICAgICAgICAgdmFyIG1lbnVpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgICAgICAgICAgLy8gQmVjYXVzZSBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdGFiLCBpcyBhIGR5bmFtaWNhbGx5IHJlbW92YWJsZSB0YWI6XHJcbiAgICAgICAgICAgIG1lbnVpdGVtLmNsYXNzTmFtZSA9IFwicmVtb3ZhYmxlXCI7XHJcbiAgICAgICAgICAgIHZhciBtZW51YW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgICAgICBtZW51YW5jaG9yLnNldEF0dHJpYnV0ZSgnaHJlZicsICcjJyArIGlkTmFtZSk7XHJcbiAgICAgICAgICAgIC8vIGxhYmVsIGNhbm5vdCBiZSBudWxsIG9yIGVtcHR5XHJcbiAgICAgICAgICAgICQobWVudWFuY2hvcikudGV4dChpc0VtcHR5U3RyaW5nKGxhYmVsKSA/IFwiVGFiXCIgOiBsYWJlbCk7XHJcbiAgICAgICAgICAgICQobWVudWl0ZW0pLmFwcGVuZChtZW51YW5jaG9yKTtcclxuICAgICAgICAgICAgLy8gQWRkIHRvIHRhYnMgbGlzdCBjb250YWluZXJcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpLmFwcGVuZChtZW51aXRlbSk7XHJcblxyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50LCBvbiB0YWJDb250YWluZXIsIHdpdGggdGhlIG5ldyB0YWIgYXMgZGF0YVxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIudHJpZ2dlckhhbmRsZXIoJ3RhYkNyZWF0ZWQnLCBbdGFiXSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldHVwU2xpZGVyKHRhYkNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFiO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAncmVtb3ZlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBPbmx5IHJlbW92ZSBpZiBpcyBhICdyZW1vdmFibGUnIHRhYlxyXG4gICAgICAgIGlmICghY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdyZW1vdmFibGUnKSAmJiAhY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCd2b2xhdGlsZScpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy8gSWYgdGFiIGlzIGN1cnJlbnRseSBmb2N1c2VkIHRhYiwgY2hhbmdlIHRvIGZpcnN0IHRhYlxyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2N1cnJlbnQnKSlcclxuICAgICAgICAgICAgdGhpcy5mb2N1c1RhYkluZGV4KGN0eC50YWJDb250YWluZXIsIDApO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5yZW1vdmUoKTtcclxuICAgICAgICB2YXIgdGFiaWQgPSBjdHgudGFiLmdldCgwKS5pZDtcclxuICAgICAgICBjdHgudGFiLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnNldHVwU2xpZGVyKGN0eC50YWJDb250YWluZXIpO1xyXG5cclxuICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50LCBvbiB0YWJDb250YWluZXIsIHdpdGggdGhlIHJlbW92ZWQgdGFiIGlkIGFzIGRhdGFcclxuICAgICAgICBjdHgudGFiQ29udGFpbmVyLnRyaWdnZXJIYW5kbGVyKCd0YWJSZW1vdmVkJywgW3RhYmlkXSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgc2V0VGFiVGl0bGU6IGZ1bmN0aW9uICh0YWJPclNlbGVjdG9yLCBuZXdUaXRsZSkge1xyXG4gICAgICAgIHZhciBjdHggPSBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRhYk9yU2VsZWN0b3IpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnc2V0VGFiVGl0bGUnLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2V0IGFuIGVtcHR5IHN0cmluZyBpcyBub3QgYWxsb3dlZCwgcHJlc2VydmUgcHJldmlvdXNseTpcclxuICAgICAgICBpZiAoIWlzRW1wdHlTdHJpbmcobmV3VGl0bGUpKVxyXG4gICAgICAgICAgICBjdHgubWVudWFuY2hvci50ZXh0KG5ld1RpdGxlKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qIE1vcmUgc3RhdGljIHV0aWxpdGllcyAqL1xyXG5cclxuLyoqIExvb2sgdXAgdGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uIGFkZHJlc3MgYW5kIHRyeSB0byBmb2N1cyBhIHRhYiB3aXRoIHRoYXRcclxuICAgIG5hbWUsIGlmIHRoZXJlIGlzIG9uZS5cclxuKiovXHJcblRhYmJlZFVYLmZvY3VzQ3VycmVudExvY2F0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gSWYgdGhlIGN1cnJlbnQgbG9jYXRpb24gaGF2ZSBhIGhhc2ggdmFsdWUgYnV0IGlzIG5vdCBhIEhhc2hCYW5nXHJcbiAgICBpZiAoL14jW14hXS8udGVzdCh3aW5kb3cubG9jYXRpb24uaGFzaCkpIHtcclxuICAgICAgICAvLyBUcnkgZm9jdXMgYSB0YWIgd2l0aCB0aGF0IG5hbWVcclxuICAgICAgICB2YXIgdGFiID0gVGFiYmVkVVguZ2V0VGFiKHdpbmRvdy5sb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICBpZiAodGFiKVxyXG4gICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0YWIpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqIExvb2sgZm9yIHZvbGF0aWxlIHRhYnMgb24gdGhlIHBhZ2UsIGlmIHRoZXkgYXJlXHJcbiAgICBlbXB0eSBvciByZXF1ZXN0aW5nIGJlaW5nICd2b2xhdGl6ZWQnLCByZW1vdmUgaXQuXHJcbioqL1xyXG5UYWJiZWRVWC5jaGVja1ZvbGF0aWxlVGFicyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoJy50YWJiZWQgPiAudGFicyA+IC52b2xhdGlsZScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0YWIgPSBUYWJiZWRVWC5nZXRUYWIobnVsbCwgdGhpcyk7XHJcbiAgICAgICAgaWYgKHRhYiAmJiAoJCh0YWIpLmNoaWxkcmVuKCkubGVuZ3RoID09PSAwIHx8ICQodGFiKS5maW5kKCc6bm90KC50YWJiZWQpIC52b2xhdGl6ZS1teS10YWInKS5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgIFRhYmJlZFVYLnJlbW92ZVRhYih0YWIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGFiYmVkVVg7IiwiLyogc2xpZGVyLXRhYnMgbG9naWMuXHJcbiogRXhlY3V0ZSBpbml0IGFmdGVyIFRhYmJlZFVYLmluaXQgdG8gYXZvaWQgbGF1bmNoIGFuaW1hdGlvbiBvbiBwYWdlIGxvYWQuXHJcbiogSXQgcmVxdWlyZXMgVGFiYmVkVVggdGhyb3VnaHQgREkgb24gJ2luaXQnLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0U2xpZGVyVGFicyhUYWJiZWRVWCkge1xyXG4gICAgJCgnLnRhYmJlZC5zbGlkZXItdGFicycpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyICR0YWJzID0gJHQuY2hpbGRyZW4oJy50YWItYm9keScpO1xyXG4gICAgICAgIHZhciBjID0gJHRhYnNcclxuICAgICAgICAgICAgLndyYXBBbGwoJzxkaXYgY2xhc3M9XCJ0YWItYm9keS1saXN0XCIvPicpXHJcbiAgICAgICAgICAgIC5lbmQoKS5jaGlsZHJlbignLnRhYi1ib2R5LWxpc3QnKTtcclxuICAgICAgICAkdGFicy5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYy5zdG9wKHRydWUsIGZhbHNlKS5hbmltYXRlKHsgc2Nyb2xsTGVmdDogYy5zY3JvbGxMZWZ0KCkgKyAkKHRoaXMpLnBvc2l0aW9uKCkubGVmdCB9LCAxNDAwKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBTZXQgaG9yaXpvbnRhbCBzY3JvbGwgdG8gdGhlIHBvc2l0aW9uIG9mIGN1cnJlbnQgc2hvd2VkIHRhYiwgd2l0aG91dCBhbmltYXRpb24gKGZvciBwYWdlLWluaXQpOlxyXG4gICAgICAgIHZhciBjdXJyZW50VGFiID0gJCgkdC5maW5kKCc+LnRhYnM+bGkuY3VycmVudD5hJykuYXR0cignaHJlZicpKTtcclxuICAgICAgICBjLnNjcm9sbExlZnQoYy5zY3JvbGxMZWZ0KCkgKyBjdXJyZW50VGFiLnBvc2l0aW9uKCkubGVmdCk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIFdpemFyZCBUYWJiZWQgRm9ybXMuXHJcbiAgICBJdCB1c2UgdGFicyB0byBtYW5hZ2UgdGhlIGRpZmZlcmVudCBmb3Jtcy1zdGVwcyBpbiB0aGUgd2l6YXJkLFxyXG4gICAgbG9hZGVkIGJ5IEFKQVggYW5kIGZvbGxvd2luZyB0byB0aGUgbmV4dCB0YWIvc3RlcCBvbiBzdWNjZXNzLlxyXG5cclxuICAgIFJlcXVpcmUgVGFiYmVkVVggdmlhIERJIG9uICdpbml0J1xyXG4gKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKSxcclxuICAgIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0VGFiYmVkV2l6YXJkKFRhYmJlZFVYLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGxvYWRpbmdEZWxheTogMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChcImJvZHlcIikuZGVsZWdhdGUoXCIudGFiYmVkLndpemFyZCAubmV4dFwiLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYnV0dG9uID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBmb3JtXHJcbiAgICAgICAgdmFyIGZvcm0gPSBidXR0b24uY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGN1cnJlbnQgd2l6YXJkIHN0ZXAtdGFiXHJcbiAgICAgICAgdmFyIGN1cnJlbnRTdGVwID0gZm9ybS5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQgY29udGFpbmVyXHJcbiAgICAgICAgdmFyIHdpemFyZCA9IGZvcm0uY2xvc2VzdCgnLnRhYmJlZC53aXphcmQnKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQtbmV4dC1zdGVwXHJcbiAgICAgICAgdmFyIG5leHRTdGVwID0gYnV0dG9uLmRhdGEoJ3dpemFyZC1uZXh0LXN0ZXAnKTtcclxuXHJcbiAgICAgICAgdmFyIGN0eCA9IHtcclxuICAgICAgICAgICAgYm94OiBjdXJyZW50U3RlcCxcclxuICAgICAgICAgICAgZm9ybTogZm9ybVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEZpcnN0IGF0IGFsbCwgaWYgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgICAgIHZhciB2YWxvYmplY3QgPSBmb3JtLmRhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gICAgICAgIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSk7XHJcbiAgICAgICAgICAgIC8vIFZhbGlkYXRpb24gaXMgYWN0aXZlZCwgd2FzIGV4ZWN1dGVkIGFuZCB0aGUgcmVzdWx0IGlzICdmYWxzZSc6IGJhZCBkYXRhLCBzdG9wIFBvc3Q6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICAgICAgdmFyIGN1c3ZhbCA9IGZvcm0uZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicpO1xyXG4gICAgICAgIGlmIChjdXN2YWwgJiYgY3VzdmFsLnZhbGlkYXRlICYmIGN1c3ZhbC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLmdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pO1xyXG4gICAgICAgICAgICAvLyBjdXN0b20gdmFsaWRhdGlvbiBub3QgcGFzc2VkLCBvdXQhXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJhaXNlIGV2ZW50XHJcbiAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcignYmVnaW5TdWJtaXRXaXphcmRTdGVwJyk7XHJcblxyXG4gICAgICAgIC8vIExvYWRpbmcsIHdpdGggcmV0YXJkXHJcbiAgICAgICAgY3R4LmxvYWRpbmd0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjdXJyZW50U3RlcC5ibG9jayhibG9ja1ByZXNldHMubG9hZGluZyk7XHJcbiAgICAgICAgfSwgb3B0aW9ucy5sb2FkaW5nRGVsYXkpO1xyXG5cclxuICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIG9rID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIE1hcmsgYXMgc2F2ZWQ6XHJcbiAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uZ2V0KDApKTtcclxuXHJcbiAgICAgICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogKGZvcm0uYXR0cignYWN0aW9uJykgfHwgJycpLFxyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICAgICAgZGF0YTogZm9ybS5zZXJpYWxpemUoKSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgc3VjY2VzcywgZ28gbmV4dCBzdGVwLCB1c2luZyBjdXN0b20gSlNPTiBBY3Rpb24gZXZlbnQ6XHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5vbignYWpheFN1Y2Nlc3NQb3N0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5leHQtc3RlcFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0U3RlcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBuZXh0IHN0ZXAgaXMgaW50ZXJuYWwgdXJsIChhIG5leHQgd2l6YXJkIHRhYilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eIy8udGVzdChuZXh0U3RlcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2JlZ2luTG9hZFdpemFyZFN0ZXAnLCBbYnV0dG9uXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVGFiYmVkVVguZW5hYmxlVGFiKG5leHRTdGVwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5leHRTdGVwKS50cmlnZ2VyKCdlbmRMb2FkV2l6YXJkU3RlcCcsIFtidXR0b25dKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgbmV4dC1zdGVwIFVSSSB0aGF0IGlzIG5vdCBpbnRlcm5hbCBsaW5rLCB3ZSBsb2FkIGl0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWRpcmVjdFRvKG5leHRTdGVwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIERvIEpTT04gYWN0aW9uIGJ1dCBpZiBpcyBub3QgSlNPTiBvciB2YWxpZCwgbWFuYWdlIGFzIEhUTUw6XHJcbiAgICAgICAgICAgICAgICBpZiAoIWFqYXhDYWxsYmFja3MuZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUG9zdCAnbWF5YmUnIHdhcyB3cm9uZywgaHRtbCB3YXMgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZvcm0gY29udGFpbmVyOiB0aGUgYWpheC1ib3guXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYW4gZW1wdHkgZG9jdW1lbnQgb3IgbWFsZm9ybWVkIGlzIHJldHVybmVkOlxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3dpbmcgbmV3IGh0bWw6XHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFN0ZXAuaHRtbChuZXdodG1sKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Rm9ybSA9IGN1cnJlbnRTdGVwO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghY3VycmVudFN0ZXAuaXMoJ2Zvcm0nKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Rm9ybSA9IGN1cnJlbnRTdGVwLmZpbmQoJ2Zvcm06ZXEoMCknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hhbmdlc25vdGlmaWNhdGlvbiBhZnRlciBhcHBlbmQgZWxlbWVudCB0byBkb2N1bWVudCwgaWYgbm90IHdpbGwgbm90IHdvcms6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQgKGlmIHdhcyBzYXZlZCBidXQgc2VydmVyIGRlY2lkZSByZXR1cm5zIGh0bWwgaW5zdGVhZCBhIEpTT04gY29kZSwgcGFnZSBzY3JpcHQgbXVzdCBkbyAncmVnaXN0ZXJTYXZlJyB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZSk6XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Rm9ybS5nZXQoMCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdyZWxvYWRlZEh0bWxXaXphcmRTdGVwJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBhamF4Q2FsbGJhY2tzLmVycm9yLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogYWpheENhbGxiYWNrcy5jb21wbGV0ZVxyXG4gICAgICAgIH0pLmNvbXBsZXRlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcignZW5kU3VibWl0V2l6YXJkU3RlcCcsIG9rKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvKiogdGltZVNwYW4gY2xhc3MgdG8gbWFuYWdlIHRpbWVzLCBwYXJzZSwgZm9ybWF0LCBjb21wdXRlLlxyXG5JdHMgbm90IHNvIGNvbXBsZXRlIGFzIHRoZSBDIyBvbmVzIGJ1dCBpcyB1c2VmdWxsIHN0aWxsLlxyXG4qKi9cclxudmFyIFRpbWVTcGFuID0gZnVuY3Rpb24gKGRheXMsIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBtaWxsaXNlY29uZHMpIHtcclxuICAgIHRoaXMuZGF5cyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChkYXlzKSkgfHwgMDtcclxuICAgIHRoaXMuaG91cnMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoaG91cnMpKSB8fCAwO1xyXG4gICAgdGhpcy5taW51dGVzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KG1pbnV0ZXMpKSB8fCAwO1xyXG4gICAgdGhpcy5zZWNvbmRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KHNlY29uZHMpKSB8fCAwO1xyXG4gICAgdGhpcy5taWxsaXNlY29uZHMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQobWlsbGlzZWNvbmRzKSkgfHwgMDtcclxuXHJcbiAgICAvLyBpbnRlcm5hbCB1dGlsaXR5IGZ1bmN0aW9uICd0byBzdHJpbmcgd2l0aCB0d28gZGlnaXRzIGFsbW9zdCdcclxuICAgIGZ1bmN0aW9uIHQobikge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKG4gLyAxMCkgKyAnJyArIG4gJSAxMDtcclxuICAgIH1cclxuICAgIC8qKiBTaG93IG9ubHkgaG91cnMgYW5kIG1pbnV0ZXMgYXMgYSBzdHJpbmcgd2l0aCB0aGUgZm9ybWF0IEhIOm1tXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9TaG9ydFN0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU2hvcnRTdHJpbmcoKSB7XHJcbiAgICAgICAgdmFyIGggPSB0KHRoaXMuaG91cnMpLFxyXG4gICAgICAgICAgICBtID0gdCh0aGlzLm1pbnV0ZXMpO1xyXG4gICAgICAgIHJldHVybiAoaCArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICsgbSk7XHJcbiAgICB9O1xyXG4gICAgLyoqIFNob3cgdGhlIGZ1bGwgdGltZSBhcyBhIHN0cmluZywgZGF5cyBjYW4gYXBwZWFyIGJlZm9yZSBob3VycyBpZiB0aGVyZSBhcmUgMjQgaG91cnMgb3IgbW9yZVxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgdmFyIGggPSB0KHRoaXMuaG91cnMpLFxyXG4gICAgICAgICAgICBkID0gKHRoaXMuZGF5cyA+IDAgPyB0aGlzLmRheXMudG9TdHJpbmcoKSArIFRpbWVTcGFuLmRlY2ltYWxzRGVsaW1pdGVyIDogJycpLFxyXG4gICAgICAgICAgICBtID0gdCh0aGlzLm1pbnV0ZXMpLFxyXG4gICAgICAgICAgICBzID0gdCh0aGlzLnNlY29uZHMgKyB0aGlzLm1pbGxpc2Vjb25kcyAvIDEwMDApO1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIGQgK1xyXG4gICAgICAgICAgICBoICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgK1xyXG4gICAgICAgICAgICBtICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgK1xyXG4gICAgICAgICAgICBzKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnZhbHVlT2YgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b192YWx1ZU9mKCkge1xyXG4gICAgICAgIC8vIFJldHVybiB0aGUgdG90YWwgbWlsbGlzZWNvbmRzIGNvbnRhaW5lZCBieSB0aGUgdGltZVxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuZGF5cyAqICgyNCAqIDM2MDAwMDApICtcclxuICAgICAgICAgICAgdGhpcy5ob3VycyAqIDM2MDAwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLm1pbnV0ZXMgKiA2MDAwMCArXHJcbiAgICAgICAgICAgIHRoaXMuc2Vjb25kcyAqIDEwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLm1pbGxpc2Vjb25kc1xyXG4gICAgICAgICk7XHJcbiAgICB9O1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIG1pbGxpc2Vjb25kc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbU1pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21NaWxsaXNlY29uZHMobWlsbGlzZWNvbmRzKSB7XHJcbiAgICB2YXIgbXMgPSBtaWxsaXNlY29uZHMgJSAxMDAwLFxyXG4gICAgICAgIHMgPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDEwMDApICUgNjAsXHJcbiAgICAgICAgbSA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gNjAwMDApICUgNjAsXHJcbiAgICAgICAgaCA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gMzYwMDAwMCkgJSAyNCxcclxuICAgICAgICBkID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAoMzYwMDAwMCAqIDI0KSk7XHJcbiAgICByZXR1cm4gbmV3IFRpbWVTcGFuKGQsIGgsIG0sIHMsIG1zKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIHNlY29uZHNcclxuKiovXHJcblRpbWVTcGFuLmZyb21TZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbVNlY29uZHMoc2Vjb25kcykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbU1pbGxpc2Vjb25kcyhzZWNvbmRzICogMTAwMCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBtaW51dGVzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tTWludXRlcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21NaW51dGVzKG1pbnV0ZXMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21TZWNvbmRzKG1pbnV0ZXMgKiA2MCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBob3Vyc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbUhvdXJzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbUhvdXJzKGhvdXJzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tTWludXRlcyhob3VycyAqIDYwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIGRheXNcclxuKiovXHJcblRpbWVTcGFuLmZyb21EYXlzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbURheXMoZGF5cykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbUhvdXJzKGRheXMgKiAyNCk7XHJcbn07XHJcblxyXG4vLyBGb3Igc3BhbmlzaCBhbmQgZW5nbGlzaCB3b3JrcyBnb29kICc6JyBhcyB1bml0c0RlbGltaXRlciBhbmQgJy4nIGFzIGRlY2ltYWxEZWxpbWl0ZXJcclxuLy8gVE9ETzogdGhpcyBtdXN0IGJlIHNldCBmcm9tIGEgZ2xvYmFsIExDLmkxOG4gdmFyIGxvY2FsaXplZCBmb3IgY3VycmVudCB1c2VyXHJcblRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyID0gJzonO1xyXG5UaW1lU3Bhbi5kZWNpbWFsc0RlbGltaXRlciA9ICcuJztcclxuVGltZVNwYW4ucGFyc2UgPSBmdW5jdGlvbiAoc3RydGltZSkge1xyXG4gICAgc3RydGltZSA9IChzdHJ0aW1lIHx8ICcnKS5zcGxpdCh0aGlzLnVuaXRzRGVsaW1pdGVyKTtcclxuICAgIC8vIEJhZCBzdHJpbmcsIHJldHVybnMgbnVsbFxyXG4gICAgaWYgKHN0cnRpbWUubGVuZ3RoIDwgMilcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAvLyBEZWNvdXBsZWQgdW5pdHM6XHJcbiAgICB2YXIgZCwgaCwgbSwgcywgbXM7XHJcbiAgICBoID0gc3RydGltZVswXTtcclxuICAgIG0gPSBzdHJ0aW1lWzFdO1xyXG4gICAgcyA9IHN0cnRpbWUubGVuZ3RoID4gMiA/IHN0cnRpbWVbMl0gOiAwO1xyXG4gICAgLy8gU3Vic3RyYWN0aW5nIGRheXMgZnJvbSB0aGUgaG91cnMgcGFydCAoZm9ybWF0OiAnZGF5cy5ob3Vycycgd2hlcmUgJy4nIGlzIGRlY2ltYWxzRGVsaW1pdGVyKVxyXG4gICAgaWYgKGguY29udGFpbnModGhpcy5kZWNpbWFsc0RlbGltaXRlcikpIHtcclxuICAgICAgICB2YXIgZGhzcGxpdCA9IGguc3BsaXQodGhpcy5kZWNpbWFsc0RlbGltaXRlcik7XHJcbiAgICAgICAgZCA9IGRoc3BsaXRbMF07XHJcbiAgICAgICAgaCA9IGRoc3BsaXRbMV07XHJcbiAgICB9XHJcbiAgICAvLyBNaWxsaXNlY29uZHMgYXJlIGV4dHJhY3RlZCBmcm9tIHRoZSBzZWNvbmRzIChhcmUgcmVwcmVzZW50ZWQgYXMgZGVjaW1hbCBudW1iZXJzIG9uIHRoZSBzZWNvbmRzIHBhcnQ6ICdzZWNvbmRzLm1pbGxpc2Vjb25kcycgd2hlcmUgJy4nIGlzIGRlY2ltYWxzRGVsaW1pdGVyKVxyXG4gICAgbXMgPSBNYXRoLnJvdW5kKHBhcnNlRmxvYXQocy5yZXBsYWNlKHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIsICcuJykpICogMTAwMCAlIDEwMDApO1xyXG4gICAgLy8gUmV0dXJuIHRoZSBuZXcgdGltZSBpbnN0YW5jZVxyXG4gICAgcmV0dXJuIG5ldyBUaW1lU3BhbihkLCBoLCBtLCBzLCBtcyk7XHJcbn07XHJcblRpbWVTcGFuLnplcm8gPSBuZXcgVGltZVNwYW4oMCwgMCwgMCwgMCwgMCk7XHJcblRpbWVTcGFuLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19pc1plcm8oKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIHRoaXMuZGF5cyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMuaG91cnMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLm1pbnV0ZXMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLnNlY29uZHMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLm1pbGxpc2Vjb25kcyA9PT0gMFxyXG4gICAgKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxNaWxsaXNlY29uZHMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbFNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbFNlY29uZHMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxNaWxsaXNlY29uZHMoKSAvIDEwMDApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxNaW51dGVzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxNaW51dGVzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsU2Vjb25kcygpIC8gNjApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxIb3VycyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsSG91cnMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxNaW51dGVzKCkgLyA2MCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbERheXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbERheXMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxIb3VycygpIC8gMjQpO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUaW1lU3BhbjsiLCIvKiBFeHRyYSB1dGlsaXRpZXMgYW5kIG1ldGhvZHMgXHJcbiAqL1xyXG52YXIgVGltZVNwYW4gPSByZXF1aXJlKCcuL1RpbWVTcGFuJyk7XHJcbnZhciBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG4vKiogU2hvd3MgdGltZSBhcyBhIGxhcmdlIHN0cmluZyB3aXRoIHVuaXRzIG5hbWVzIGZvciB2YWx1ZXMgZGlmZmVyZW50IHRoYW4gemVyby5cclxuICoqL1xyXG5mdW5jdGlvbiBzbWFydFRpbWUodGltZSkge1xyXG4gICAgdmFyIHIgPSBbXTtcclxuICAgIGlmICh0aW1lLmRheXMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLmRheXMgKyAnIGRheXMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuZGF5cyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBkYXknKTtcclxuICAgIGlmICh0aW1lLmhvdXJzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5ob3VycyArICcgaG91cnMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuaG91cnMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgaG91cicpO1xyXG4gICAgaWYgKHRpbWUubWludXRlcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUubWludXRlcyArICcgbWludXRlcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5taW51dGVzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIG1pbnV0ZScpO1xyXG4gICAgaWYgKHRpbWUuc2Vjb25kcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuc2Vjb25kcyArICcgc2Vjb25kcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5zZWNvbmRzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIHNlY29uZCcpO1xyXG4gICAgaWYgKHRpbWUubWlsbGlzZWNvbmRzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5taWxsaXNlY29uZHMgKyAnIG1pbGxpc2Vjb25kcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5taWxsaXNlY29uZHMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgbWlsbGlzZWNvbmQnKTtcclxuICAgIHJldHVybiByLmpvaW4oJywgJyk7XHJcbn1cclxuXHJcbi8qKiBSb3VuZHMgYSB0aW1lIHRvIHRoZSBuZWFyZXN0IDE1IG1pbnV0ZXMgZnJhZ21lbnQuXHJcbkByb3VuZFRvIHNwZWNpZnkgdGhlIExDLnJvdW5kaW5nVHlwZUVudW0gYWJvdXQgaG93IHRvIHJvdW5kIHRoZSB0aW1lIChkb3duLCBuZWFyZXN0IG9yIHVwKVxyXG4qKi9cclxuZnVuY3Rpb24gcm91bmRUaW1lVG9RdWFydGVySG91cigvKiBUaW1lU3BhbiAqL3RpbWUsIC8qIG1hdGhVdGlscy5yb3VuZGluZ1R5cGVFbnVtICovcm91bmRUbykge1xyXG4gICAgdmFyIHJlc3RGcm9tUXVhcnRlciA9IHRpbWUudG90YWxIb3VycygpICUgMC4yNTtcclxuICAgIHZhciBob3VycyA9IHRpbWUudG90YWxIb3VycygpO1xyXG4gICAgaWYgKHJlc3RGcm9tUXVhcnRlciA+IDAuMCkge1xyXG4gICAgICAgIHN3aXRjaCAocm91bmRUbykge1xyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgICAgIGhvdXJzIC09IHJlc3RGcm9tUXVhcnRlcjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uTmVhcmVzdDpcclxuICAgICAgICAgICAgICAgIHZhciBsaW1pdCA9IDAuMjUgLyAyO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3RGcm9tUXVhcnRlciA+PSBsaW1pdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzICs9ICgwLjI1IC0gcmVzdEZyb21RdWFydGVyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG91cnMgLT0gcmVzdEZyb21RdWFydGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgICAgIGhvdXJzICs9ICgwLjI1IC0gcmVzdEZyb21RdWFydGVyKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBUaW1lU3Bhbi5mcm9tSG91cnMoaG91cnMpO1xyXG59XHJcblxyXG4vLyBFeHRlbmQgYSBnaXZlbiBUaW1lU3BhbiBvYmplY3Qgd2l0aCB0aGUgRXh0cmEgbWV0aG9kc1xyXG5mdW5jdGlvbiBwbHVnSW4oVGltZVNwYW4pIHtcclxuICAgIFRpbWVTcGFuLnByb3RvdHlwZS50b1NtYXJ0U3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TbWFydFN0cmluZygpIHsgcmV0dXJuIHNtYXJ0VGltZSh0aGlzKTsgfTtcclxuICAgIFRpbWVTcGFuLnByb3RvdHlwZS5yb3VuZFRvUXVhcnRlckhvdXIgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19yb3VuZFRvUXVhcnRlckhvdXIoKSB7IHJldHVybiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyLmNhbGwodGhpcywgcGFyYW1ldGVycyk7IH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIHNtYXJ0VGltZTogc21hcnRUaW1lLFxyXG4gICAgICAgIHJvdW5kVG9RdWFydGVySG91cjogcm91bmRUaW1lVG9RdWFydGVySG91cixcclxuICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgfTtcclxuIiwiLyoqXHJcbiAgIEFQSSBmb3IgYXV0b21hdGljIGNyZWF0aW9uIG9mIGxhYmVscyBmb3IgVUkgU2xpZGVycyAoanF1ZXJ5LXVpKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHRvb2x0aXBzID0gcmVxdWlyZSgnLi90b29sdGlwcycpLFxyXG4gICAgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpLFxyXG4gICAgVGltZVNwYW4gPSByZXF1aXJlKCcuL1RpbWVTcGFuJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuLyoqIENyZWF0ZSBsYWJlbHMgZm9yIGEganF1ZXJ5LXVpLXNsaWRlci5cclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZShzbGlkZXIpIHtcclxuICAgIC8vIHJlbW92ZSBvbGQgb25lczpcclxuICAgIHZhciBvbGQgPSBzbGlkZXIuc2libGluZ3MoJy51aS1zbGlkZXItbGFiZWxzJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCQodGhpcykuZGF0YSgndWktc2xpZGVyJykuZ2V0KDApID09IHNsaWRlci5nZXQoMCkpO1xyXG4gICAgfSkucmVtb3ZlKCk7XHJcbiAgICAvLyBDcmVhdGUgbGFiZWxzIGNvbnRhaW5lclxyXG4gICAgdmFyIGxhYmVscyA9ICQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWxzXCIvPicpO1xyXG4gICAgbGFiZWxzLmRhdGEoJ3VpLXNsaWRlcicsIHNsaWRlcik7XHJcblxyXG4gICAgLy8gU2V0dXAgb2YgdXNlZnVsIHZhcnMgZm9yIGxhYmVsIGNyZWF0aW9uXHJcbiAgICB2YXIgbWF4ID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ21heCcpLFxyXG4gICAgICAgIG1pbiA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdtaW4nKSxcclxuICAgICAgICBzdGVwID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ3N0ZXAnKSxcclxuICAgICAgICBzdGVwcyA9IE1hdGguZmxvb3IoKG1heCAtIG1pbikgLyBzdGVwKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBhbmQgcG9zaXRpb25pbmcgbGFiZWxzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBzdGVwczsgaSsrKSB7XHJcbiAgICAgICAgLy8gQ3JlYXRlIGxhYmVsXHJcbiAgICAgICAgdmFyIGxibCA9ICQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWxcIj48c3BhbiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbC10ZXh0XCIvPjwvZGl2PicpO1xyXG4gICAgICAgIC8vIFNldHVwIGxhYmVsIHdpdGggaXRzIHZhbHVlXHJcbiAgICAgICAgdmFyIGxhYmVsVmFsdWUgPSBtaW4gKyBpICogc3RlcDtcclxuICAgICAgICBsYmwuY2hpbGRyZW4oJy51aS1zbGlkZXItbGFiZWwtdGV4dCcpLnRleHQobGFiZWxWYWx1ZSk7XHJcbiAgICAgICAgbGJsLmRhdGEoJ3VpLXNsaWRlci12YWx1ZScsIGxhYmVsVmFsdWUpO1xyXG4gICAgICAgIC8vIFBvc2l0aW9uYXRlXHJcbiAgICAgICAgcG9zaXRpb25hdGUobGJsLCBpLCBzdGVwcyk7XHJcbiAgICAgICAgLy8gQWRkIHRvIGNvbnRhaW5lclxyXG4gICAgICAgIGxhYmVscy5hcHBlbmQobGJsKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGVyIGZvciBsYWJlbHMgY2xpY2sgdG8gc2VsZWN0IGl0cyBwb3NpdGlvbiB2YWx1ZVxyXG4gICAgbGFiZWxzLm9uKCdjbGljaycsICcudWktc2xpZGVyLWxhYmVsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWwgPSAkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlci12YWx1ZScpLFxyXG4gICAgICAgICAgICBzbGlkZXIgPSAkKHRoaXMpLnBhcmVudCgpLmRhdGEoJ3VpLXNsaWRlcicpO1xyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluc2VydCBsYWJlbHMgYXMgYSBzaWJsaW5nIG9mIHRoZSBzbGlkZXIgKGNhbm5vdCBiZSBpbnNlcnRlZCBpbnNpZGUpXHJcbiAgICBzbGlkZXIuYWZ0ZXIobGFiZWxzKTtcclxufVxyXG5cclxuLyoqIFBvc2l0aW9uYXRlIHRvIHRoZSBjb3JyZWN0IHBvc2l0aW9uIGFuZCB3aWR0aCBhbiBVSSBsYWJlbCBhdCBAbGJsXHJcbmZvciB0aGUgcmVxdWlyZWQgcGVyY2VudGFnZS13aWR0aCBAc3dcclxuKiovXHJcbmZ1bmN0aW9uIHBvc2l0aW9uYXRlKGxibCwgaSwgc3RlcHMpIHtcclxuICAgIHZhciBzdyA9IDEwMCAvIHN0ZXBzO1xyXG4gICAgdmFyIGxlZnQgPSBpICogc3cgLSBzdyAqIDAuNSxcclxuICAgICAgICByaWdodCA9IDEwMCAtIGxlZnQgLSBzdyxcclxuICAgICAgICBhbGlnbiA9ICdjZW50ZXInO1xyXG4gICAgaWYgKGkgPT09IDApIHtcclxuICAgICAgICBhbGlnbiA9ICdsZWZ0JztcclxuICAgICAgICBsZWZ0ID0gMDtcclxuICAgIH0gZWxzZSBpZiAoaSA9PSBzdGVwcykge1xyXG4gICAgICAgIGFsaWduID0gJ3JpZ2h0JztcclxuICAgICAgICByaWdodCA9IDA7XHJcbiAgICB9XHJcbiAgICBsYmwuY3NzKHtcclxuICAgICAgICAndGV4dC1hbGlnbic6IGFsaWduLFxyXG4gICAgICAgIGxlZnQ6IGxlZnQgKyAnJScsXHJcbiAgICAgICAgcmlnaHQ6IHJpZ2h0ICsgJyUnXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIFVwZGF0ZSB0aGUgdmlzaWJpbGl0eSBvZiBsYWJlbHMgb2YgYSBqcXVlcnktdWktc2xpZGVyIGRlcGVuZGluZyBpZiB0aGV5IGZpdCBpbiB0aGUgYXZhaWxhYmxlIHNwYWNlLlxyXG5TbGlkZXIgbmVlZHMgdG8gYmUgdmlzaWJsZS5cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZShzbGlkZXIpIHtcclxuICAgIC8vIEdldCBsYWJlbHMgZm9yIHNsaWRlclxyXG4gICAgdmFyIGxhYmVsc19jID0gc2xpZGVyLnNpYmxpbmdzKCcudWktc2xpZGVyLWxhYmVscycpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlcicpLmdldCgwKSA9PSBzbGlkZXIuZ2V0KDApKTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGxhYmVscyA9IGxhYmVsc19jLmZpbmQoJy51aS1zbGlkZXItbGFiZWwtdGV4dCcpO1xyXG5cclxuICAgIC8vIEFwcGx5IGF1dG9zaXplXHJcbiAgICBpZiAoKHNsaWRlci5kYXRhKCdzbGlkZXItYXV0b3NpemUnKSB8fCBmYWxzZSkudG9TdHJpbmcoKSA9PSAndHJ1ZScpXHJcbiAgICAgICAgYXV0b3NpemUoc2xpZGVyLCBsYWJlbHMpO1xyXG5cclxuICAgIC8vIEdldCBhbmQgYXBwbHkgbGF5b3V0XHJcbiAgICB2YXIgbGF5b3V0X25hbWUgPSBzbGlkZXIuZGF0YSgnc2xpZGVyLWxhYmVscy1sYXlvdXQnKSB8fCAnc3RhbmRhcmQnLFxyXG4gICAgICAgIGxheW91dCA9IGxheW91dF9uYW1lIGluIGxheW91dHMgPyBsYXlvdXRzW2xheW91dF9uYW1lXSA6IGxheW91dHMuc3RhbmRhcmQ7XHJcbiAgICBsYWJlbHNfYy5hZGRDbGFzcygnbGF5b3V0LScgKyBsYXlvdXRfbmFtZSk7XHJcbiAgICBsYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdG9vbHRpcHNcclxuICAgIHRvb2x0aXBzLmNyZWF0ZVRvb2x0aXAobGFiZWxzX2MuY2hpbGRyZW4oKSwge1xyXG4gICAgICAgIHRpdGxlOiBmdW5jdGlvbiAoKSB7IHJldHVybiAkKHRoaXMpLnRleHQoKTsgfVxyXG4gICAgICAgICwgcGVyc2lzdGVudDogdHJ1ZVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGF1dG9zaXplKHNsaWRlciwgbGFiZWxzKSB7XHJcbiAgICB2YXIgdG90YWxfd2lkdGggPSAwO1xyXG4gICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRvdGFsX3dpZHRoICs9ICQodGhpcykub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGMgPSBzbGlkZXIuY2xvc2VzdCgnLnVpLXNsaWRlci1jb250YWluZXInKSxcclxuICAgICAgICBtYXggPSBwYXJzZUZsb2F0KGMuY3NzKCdtYXgtd2lkdGgnKSksXHJcbiAgICAgICAgbWluID0gcGFyc2VGbG9hdChjLmNzcygnbWluLXdpZHRoJykpO1xyXG4gICAgaWYgKG1heCAhPSBOdW1iZXIuTmFOICYmIHRvdGFsX3dpZHRoID4gbWF4KVxyXG4gICAgICAgIHRvdGFsX3dpZHRoID0gbWF4O1xyXG4gICAgaWYgKG1pbiAhPSBOdW1iZXIuTmFOICYmIHRvdGFsX3dpZHRoIDwgbWluKVxyXG4gICAgICAgIHRvdGFsX3dpZHRoID0gbWluO1xyXG4gICAgYy53aWR0aCh0b3RhbF93aWR0aCk7XHJcbn1cclxuXHJcbi8qKiBTZXQgb2YgZGlmZmVyZW50IGxheW91dHMgZm9yIGxhYmVscywgYWxsb3dpbmcgZGlmZmVyZW50IGtpbmRzIG9mIFxyXG5wbGFjZW1lbnQgYW5kIHZpc3VhbGl6YXRpb24gdXNpbmcgdGhlIHNsaWRlciBkYXRhIG9wdGlvbiAnbGFiZWxzLWxheW91dCcuXHJcblVzZWQgYnkgJ3VwZGF0ZScsIGFsbW9zdCB0aGUgJ3N0YW5kYXJkJyBtdXN0IGV4aXN0IGFuZCBjYW4gYmUgaW5jcmVhc2VkXHJcbmV4dGVybmFsbHlcclxuKiovXHJcbnZhciBsYXlvdXRzID0ge307XHJcbi8qKiBTaG93IHRoZSBtYXhpbXVtIG51bWJlciBvZiBsYWJlbHMgaW4gZXF1YWxseSBzaXplZCBnYXBzIGJ1dFxyXG50aGUgbGFzdCBsYWJlbCB0aGF0IGlzIGVuc3VyZWQgdG8gYmUgc2hvd2VkIGV2ZW4gaWYgaXQgY3JlYXRlc1xyXG5hIGhpZ2hlciBnYXAgd2l0aCB0aGUgcHJldmlvdXMgb25lLlxyXG4qKi9cclxubGF5b3V0cy5zdGFuZGFyZCA9IGZ1bmN0aW9uIHN0YW5kYXJkX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoZXJlIGFyZSBtb3JlIGxhYmVscyB0aGFuIGF2YWlsYWJsZSBzcGFjZVxyXG4gICAgLy8gR2V0IG1heGltdW0gbGFiZWwgd2lkdGhcclxuICAgIHZhciBpdGVtX3dpZHRoID0gMDtcclxuICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdHcgPSAkKHRoaXMpLm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICAgICAgaWYgKHR3ID49IGl0ZW1fd2lkdGgpXHJcbiAgICAgICAgICAgIGl0ZW1fd2lkdGggPSB0dztcclxuICAgIH0pO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgd2lkdGgsIGlmIG5vdCwgZWxlbWVudCBpcyBub3QgdmlzaWJsZSBjYW5ub3QgYmUgY29tcHV0ZWRcclxuICAgIGlmIChpdGVtX3dpZHRoID4gMCkge1xyXG4gICAgICAgIC8vIEdldCB0aGUgcmVxdWlyZWQgc3RlcHBpbmcgb2YgbGFiZWxzXHJcbiAgICAgICAgdmFyIGxhYmVsc19zdGVwID0gTWF0aC5jZWlsKGl0ZW1fd2lkdGggLyAoc2xpZGVyLndpZHRoKCkgLyBsYWJlbHMubGVuZ3RoKSksXHJcbiAgICAgICAgbGFiZWxzX3N0ZXBzID0gbGFiZWxzLmxlbmd0aCAvIGxhYmVsc19zdGVwO1xyXG4gICAgICAgIGlmIChsYWJlbHNfc3RlcCA+IDEpIHtcclxuICAgICAgICAgICAgLy8gSGlkZSB0aGUgbGFiZWxzIG9uIHBvc2l0aW9ucyBvdXQgb2YgdGhlIHN0ZXBcclxuICAgICAgICAgICAgdmFyIG5ld2kgPSAwLFxyXG4gICAgICAgICAgICAgICAgbGltaXQgPSBsYWJlbHMubGVuZ3RoIC0gMSAtIGxhYmVsc19zdGVwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhYmVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxibCA9ICQobGFiZWxzW2ldKTtcclxuICAgICAgICAgICAgICAgIGlmICgoaSArIDEpIDwgbGFiZWxzLmxlbmd0aCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgaSAlIGxhYmVsc19zdGVwIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgaSA+IGxpbWl0KSlcclxuICAgICAgICAgICAgICAgICAgICBsYmwuaGlkZSgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxibC5zaG93KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXBvc2l0aW9uYXRlIHBhcmVudFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uYXRlKHBhcmVudCwgbmV3aSwgbGFiZWxzX3N0ZXBzKTtcclxuICAgICAgICAgICAgICAgICAgICBuZXdpKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbi8qKiBTaG93IGxhYmVscyBudW1iZXIgdmFsdWVzIGZvcm1hdHRlZCBhcyBob3Vycywgd2l0aCBvbmx5XHJcbmludGVnZXIgaG91cnMgYmVpbmcgc2hvd2VkLCB0aGUgbWF4aW11bSBudW1iZXIgb2YgaXQuXHJcbioqL1xyXG5sYXlvdXRzLmhvdXJzID0gZnVuY3Rpb24gaG91cnNfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscywgc2hvd19hbGwpIHtcclxuICAgIHZhciBpbnRMYWJlbHMgPSBzbGlkZXIuZmluZCgnLmludGVnZXItaG91cicpO1xyXG4gICAgaWYgKCFpbnRMYWJlbHMubGVuZ3RoKSB7XHJcbiAgICAgICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAoISR0LmRhdGEoJ2hvdXItcHJvY2Vzc2VkJykpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2ID0gcGFyc2VGbG9hdCgkdC50ZXh0KCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHYgIT0gTnVtYmVyLk5hTikge1xyXG4gICAgICAgICAgICAgICAgICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2ICUgMSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2RlY2ltYWwtaG91cicpLmhpZGUoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodiAlIDAuNSA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnBhcmVudCgpLmFkZENsYXNzKCdzdHJvbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQudGV4dChUaW1lU3Bhbi5mcm9tSG91cnModikudG9TaG9ydFN0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnaW50ZWdlci1ob3VyJykuc2hvdygpLnBhcmVudCgpLmFkZENsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGludExhYmVscyA9IGludExhYmVscy5hZGQoJHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ2hvdXItcHJvY2Vzc2VkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChzaG93X2FsbCAhPT0gdHJ1ZSlcclxuICAgICAgICBsYXlvdXRzLnN0YW5kYXJkKHNsaWRlciwgaW50TGFiZWxzLnBhcmVudCgpLCBpbnRMYWJlbHMpO1xyXG59O1xyXG5sYXlvdXRzWydhbGwtdmFsdWVzJ10gPSBmdW5jdGlvbiBhbGxfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscykge1xyXG4gICAgLy8gU2hvd2luZyBhbGwgbGFiZWxzXHJcbiAgICBsYWJlbHNfYy5zaG93KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKS5jaGlsZHJlbigpLnNob3coKTtcclxufTtcclxubGF5b3V0c1snYWxsLWhvdXJzJ10gPSBmdW5jdGlvbiBhbGxfaG91cnNfbGF5b3V0KCkge1xyXG4gICAgLy8gSnVzdCB1c2UgaG91cnMgbGF5b3V0IGJ1dCBzaG93aW5nIGFsbCBpbnRlZ2VyIGhvdXJzXHJcbiAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKGFyZ3VtZW50cywgdHJ1ZSk7XHJcbiAgICBsYXlvdXRzLmhvdXJzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNyZWF0ZTogY3JlYXRlLFxyXG4gICAgdXBkYXRlOiB1cGRhdGUsXHJcbiAgICBsYXlvdXRzOiBsYXlvdXRzXHJcbn07XHJcbiIsIi8qIFNldCBvZiBjb21tb24gTEMgY2FsbGJhY2tzIGZvciBtb3N0IEFqYXggb3BlcmF0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgdmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vLyBBS0E6IGFqYXhFcnJvclBvcHVwSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uRXJyb3IoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAvLyBJZiBpcyBhIGNvbm5lY3Rpb24gYWJvcnRlZCwgbm8gc2hvdyBtZXNzYWdlLlxyXG4gICAgLy8gcmVhZHlTdGF0ZSBkaWZmZXJlbnQgdG8gJ2RvbmU6NCcgbWVhbnMgYWJvcnRlZCB0b28sIFxyXG4gICAgLy8gYmVjYXVzZSB3aW5kb3cgYmVpbmcgY2xvc2VkL2xvY2F0aW9uIGNoYW5nZWRcclxuICAgIGlmIChtZXNzYWdlID09ICdhYm9ydCcgfHwgangucmVhZHlTdGF0ZSAhPSA0KVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICB2YXIgbSA9IG1lc3NhZ2U7XHJcbiAgICB2YXIgaWZyYW1lID0gbnVsbDtcclxuICAgIHNpemUgPSBwb3B1cC5zaXplKCdsYXJnZScpO1xyXG4gICAgc2l6ZS5oZWlnaHQgLT0gMzQ7XHJcbiAgICBpZiAobSA9PSAnZXJyb3InKSB7XHJcbiAgICAgICAgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGp4LnJlc3BvbnNlVGV4dCwgc2l6ZSk7XHJcbiAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICBtID0gbnVsbDtcclxuICAgIH0gIGVsc2VcclxuICAgICAgICBtID0gbSArIFwiOyBcIiArIGV4O1xyXG5cclxuICAgIC8vIEJsb2NrIGFsbCB3aW5kb3csIG5vdCBvbmx5IGN1cnJlbnQgZWxlbWVudFxyXG4gICAgJC5ibG9ja1VJKGVycm9yQmxvY2sobSwgbnVsbCwgcG9wdXAuc3R5bGUoc2l6ZSkpKTtcclxuICAgIGlmIChpZnJhbWUpXHJcbiAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAkKCcuYmxvY2tVSSAuY2xvc2UtcG9wdXAnKS5jbGljayhmdW5jdGlvbiAoKSB7ICQudW5ibG9ja1VJKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25Db21wbGV0ZSgpIHtcclxuICAgIC8vIERpc2FibGUgbG9hZGluZ1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ3RpbWVyIHx8IHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIC8vIFVuYmxvY2tcclxuICAgIGlmICh0aGlzLmF1dG9VbmJsb2NrTG9hZGluZykge1xyXG4gICAgICAgIC8vIERvdWJsZSB1bi1sb2NrLCBiZWNhdXNlIGFueSBvZiB0aGUgdHdvIHN5c3RlbXMgY2FuIGJlaW5nIHVzZWQ6XHJcbiAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5ib3gpO1xyXG4gICAgICAgIHRoaXMuYm94LnVuYmxvY2soKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICAvLyBTdXBwb3J0ZWQgdGhlIGdlbmVyaWMgY3R4LmVsZW1lbnQgZnJvbSBqcXVlcnkucmVsb2FkXHJcbiAgICBpZiAoY3R4LmVsZW1lbnQpIGN0eC5mb3JtID0gY3R4LmVsZW1lbnQ7XHJcbiAgICAvLyBTcGVjaWZpYyBzdHVmZiBvZiBhamF4Rm9ybXNcclxuICAgIGlmICghY3R4LmZvcm0pIGN0eC5mb3JtID0gJCh0aGlzKTtcclxuICAgIGlmICghY3R4LmJveCkgY3R4LmJveCA9IGN0eC5mb3JtO1xyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gRG8gSlNPTiBhY3Rpb24gYnV0IGlmIGlzIG5vdCBKU09OIG9yIHZhbGlkLCBtYW5hZ2UgYXMgSFRNTDpcclxuICAgIGlmICghZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpKSB7XHJcbiAgICAgICAgLy8gUG9zdCAnbWF5YmUnIHdhcyB3cm9uZywgaHRtbCB3YXMgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IFxyXG4gICAgICAgIC8vIGZvcm0gY29udGFpbmVyOiB0aGUgYWpheC1ib3guXHJcblxyXG4gICAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgICAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgICAgICAvLyBBdm9pZCBlbXB0eSBkb2N1bWVudHMgYmVpbmcgcGFyc2VkIChyYWlzZSBlcnJvcilcclxuICAgICAgICBpZiAoJC50cmltKGRhdGEpKSB7XHJcbiAgICAgICAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhIG1hbGZvcm1lZCBkb2N1bWVudCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZvciAncmVsb2FkJyBzdXBwb3J0LCBjaGVjayB0b28gdGhlIGNvbnRleHQubW9kZSwgYW5kIGJvdGggcmVsb2FkIG9yIGFqYXhGb3JtcyBjaGVjayBkYXRhIGF0dHJpYnV0ZSB0b29cclxuICAgICAgICBjdHguYm94SXNDb250YWluZXIgPSBjdHguYm94SXNDb250YWluZXI7XHJcbiAgICAgICAgdmFyIHJlcGxhY2VCb3hDb250ZW50ID1cclxuICAgICAgICAgIChjdHgub3B0aW9ucyAmJiBjdHgub3B0aW9ucy5tb2RlID09PSAncmVwbGFjZS1jb250ZW50JykgfHxcclxuICAgICAgICAgIGN0eC5ib3guZGF0YSgncmVsb2FkLW1vZGUnKSA9PT0gJ3JlcGxhY2UtY29udGVudCc7XHJcblxyXG4gICAgICAgIC8vIFN1cHBvcnQgZm9yIHJlbG9hZCwgYXZvaWRpbmcgaW1wb3J0YW50IGJ1Z3Mgd2l0aCByZWxvYWRpbmcgYm94ZXMgdGhhdCBjb250YWlucyBmb3JtczpcclxuICAgICAgICAvLyBJZiBvcGVyYXRpb24gaXMgYSByZWxvYWQsIGRvbid0IGNoZWNrIHRoZSBhamF4LWJveFxyXG4gICAgICAgIHZhciBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgaWYgKCFjdHguaXNSZWxvYWQpIHtcclxuICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSByZXR1cm5lZCBlbGVtZW50IGlzIHRoZSBhamF4LWJveCwgaWYgbm90LCBmaW5kXHJcbiAgICAgICAgICAvLyB0aGUgZWxlbWVudCBpbiB0aGUgbmV3aHRtbDpcclxuICAgICAgICAgIGpiID0gbmV3aHRtbC5maWx0ZXIoJy5hamF4LWJveCcpO1xyXG4gICAgICAgICAgaWYgKGpiLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sO1xyXG4gICAgICAgICAgaWYgKCFjdHguYm94SXNDb250YWluZXIgJiYgIWpiLmlzKCcuYWpheC1ib3gnKSlcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sLmZpbmQoJy5hamF4LWJveDplcSgwKScpO1xyXG4gICAgICAgICAgaWYgKCFqYiB8fCBqYi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gYWpheC1ib3gsIHVzZSBhbGwgZWxlbWVudCByZXR1cm5lZDpcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmIChyZXBsYWNlQm94Q29udGVudClcclxuICAgICAgICAgICAgLy8gUmVwbGFjZSB0aGUgYm94IGNvbnRlbnQgd2l0aCB0aGUgY29udGVudCBvZiB0aGUgcmV0dXJuZWQgYm94XHJcbiAgICAgICAgICAgIC8vIG9yIGFsbCBpZiB0aGVyZSBpcyBubyBhamF4LWJveCBpbiB0aGUgcmVzdWx0LlxyXG4gICAgICAgICAgICBqYiA9IGpiLmlzKCcuYWpheC1ib3gnKSA/IGpiLmNvbnRlbnRzKCkgOiBqYjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZXBsYWNlQm94Q29udGVudCkge1xyXG4gICAgICAgICAgY3R4LmJveC5lbXB0eSgpLmFwcGVuZChqYik7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjdHguYm94SXNDb250YWluZXIpIHtcclxuICAgICAgICAgICAgLy8gamIgaXMgY29udGVudCBvZiB0aGUgYm94IGNvbnRhaW5lcjpcclxuICAgICAgICAgICAgY3R4LmJveC5odG1sKGpiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBib3ggaXMgY29udGVudCB0aGF0IG11c3QgYmUgcmVwbGFjZWQgYnkgdGhlIG5ldyBjb250ZW50OlxyXG4gICAgICAgICAgICBjdHguYm94LnJlcGxhY2VXaXRoKGpiKTtcclxuICAgICAgICAgICAgLy8gYW5kIHJlZnJlc2ggdGhlIHJlZmVyZW5jZSB0byBib3ggd2l0aCB0aGUgbmV3IGVsZW1lbnRcclxuICAgICAgICAgICAgY3R4LmJveCA9IGpiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSXQgc3VwcG9ydHMgbm9ybWFsIGFqYXggZm9ybXMgYW5kIHN1YmZvcm1zIHRocm91Z2ggZmllbGRzZXQuYWpheFxyXG4gICAgICAgIGlmIChjdHguYm94LmlzKCdmb3JtLmFqYXgnKSB8fCBjdHguYm94LmlzKCdmaWVsZHNldC5hamF4JykpXHJcbiAgICAgICAgICBjdHguZm9ybSA9IGN0eC5ib3g7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBjdHguZm9ybSA9IGN0eC5ib3guZmluZCgnZm9ybS5hamF4OmVxKDApJyk7XHJcbiAgICAgICAgICBpZiAoY3R4LmZvcm0ubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBjdHguZm9ybSA9IGN0eC5ib3guZmluZCgnZmllbGRzZXQuYWpheDplcSgwKScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ2hhbmdlc25vdGlmaWNhdGlvbiBhZnRlciBhcHBlbmQgZWxlbWVudCB0byBkb2N1bWVudCwgaWYgbm90IHdpbGwgbm90IHdvcms6XHJcbiAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQgKGlmIHdhcyBzYXZlZCBidXQgc2VydmVyIGRlY2lkZSByZXR1cm5zIGh0bWwgaW5zdGVhZCBhIEpTT04gY29kZSwgcGFnZSBzY3JpcHQgbXVzdCBkbyAncmVnaXN0ZXJTYXZlJyB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZSk6XHJcbiAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5nZXQoMCksXHJcbiAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIE1vdmUgZm9jdXMgdG8gdGhlIGVycm9ycyBhcHBlYXJlZCBvbiB0aGUgcGFnZSAoaWYgdGhlcmUgYXJlKTpcclxuICAgICAgICB2YXIgdmFsaWRhdGlvblN1bW1hcnkgPSBqYi5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0aW9uU3VtbWFyeS5sZW5ndGgpXHJcbiAgICAgICAgICBtb3ZlRm9jdXNUbyh2YWxpZGF0aW9uU3VtbWFyeSk7XHJcbiAgICAgICAgLy8gVE9ETzogSXQgc2VlbXMgdGhhdCBpdCByZXR1cm5zIGEgZG9jdW1lbnQtZnJhZ21lbnQgaW5zdGVhZCBvZiBhIGVsZW1lbnQgYWxyZWFkeSBpbiBkb2N1bWVudFxyXG4gICAgICAgIC8vIGZvciBjdHguZm9ybSAobWF5YmUgamIgdG9vPykgd2hlbiB1c2luZyAqIGN0eC5ib3guZGF0YSgncmVsb2FkLW1vZGUnKSA9PT0gJ3JlcGxhY2UtY29udGVudCcgKiBcclxuICAgICAgICAvLyAobWF5YmUgb24gb3RoZXIgY2FzZXMgdG9vPykuXHJcbiAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCBbamIsIGN0eC5mb3JtLCBqeF0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuICovXHJcbmZ1bmN0aW9uIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgbWVzc2FnZSA9IG1lc3NhZ2UgfHwgY3R4LmZvcm0uZGF0YSgnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnKSB8fCAnRG9uZSEnO1xyXG4gICAgY3R4LmJveC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgIGNzczogcG9wdXAuc3R5bGUocG9wdXAuc2l6ZSgnc21hbGwnKSlcclxuICAgIH0pKVxyXG4gICAgLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IFxyXG4gICAgfSk7XHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiovXHJcbmZ1bmN0aW9uIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuXHJcbiAgICB2YXIgY29udGVudCA9ICQoJzxkaXYgY2xhc3M9XCJvay1nby1ib3hcIi8+Jyk7XHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8c3BhbiBjbGFzcz1cInN1Y2Nlc3MtbWVzc2FnZVwiLz4nKS5hcHBlbmQoZGF0YS5TdWNjZXNzTWVzc2FnZSkpO1xyXG4gICAgaWYgKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpXHJcbiAgICAgICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFkZGl0aW9uYWwtbWVzc2FnZVwiLz4nKS5hcHBlbmQoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSkpO1xyXG5cclxuICAgIHZhciBva0J0biA9ICQoJzxhIGNsYXNzPVwiYWN0aW9uIG9rLWFjdGlvbiBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI29rXCIvPicpLmFwcGVuZChkYXRhLk9rTGFiZWwpO1xyXG4gICAgdmFyIGdvQnRuID0gJyc7XHJcbiAgICBpZiAoZGF0YS5Hb1VSTCAmJiBkYXRhLkdvTGFiZWwpIHtcclxuICAgICAgICBnb0J0biA9ICQoJzxhIGNsYXNzPVwiYWN0aW9uIGdvLWFjdGlvblwiLz4nKS5hdHRyKCdocmVmJywgZGF0YS5Hb1VSTCkuYXBwZW5kKGRhdGEuR29MYWJlbCk7XHJcbiAgICAgICAgLy8gRm9yY2luZyB0aGUgJ2Nsb3NlLWFjdGlvbicgaW4gc3VjaCBhIHdheSB0aGF0IGZvciBpbnRlcm5hbCBsaW5rcyB0aGUgcG9wdXAgZ2V0cyBjbG9zZWQgaW4gYSBzYWZlIHdheTpcclxuICAgICAgICBnb0J0bi5jbGljayhmdW5jdGlvbiAoKSB7IG9rQnRuLmNsaWNrKCk7IGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhY3Rpb25zIGNsZWFyZml4XCIvPicpLmFwcGVuZChva0J0bikuYXBwZW5kKGdvQnRuKSk7XHJcblxyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjdHguYm94LCBudWxsLCB7XHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSB7XHJcbiAgICAvLyBJZiBpcyBhIEpTT04gcmVzdWx0OlxyXG4gICAgaWYgKHR5cGVvZiAoZGF0YSkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgaWYgKGN0eCAmJiBjdHguYm94KVxyXG4gICAgICAgICAgICAvLyBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9yc1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChjdHguYm94KTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMDogZ2VuZXJhbCBzdWNjZXNzIGNvZGUsIHNob3cgbWVzc2FnZSBzYXlpbmcgdGhhdCAnYWxsIHdhcyBmaW5lJ1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdCwgZGF0YSk7XHJcbiAgICAgICAgICAgIGlmIChjdHggJiYgY3R4LmZvcm0gJiYgY3R4LmZvcm0udHJpZ2dlcilcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMTogZG8gYSByZWRpcmVjdFxyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDEpIHtcclxuICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMjogc2hvdyBsb2dpbiBwb3B1cCAod2l0aCB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICBpZiAoY3R4ICYmIGN0eC5ibG9jayAmJiBjdHguYm94LnVuYmxvY2spXHJcbiAgICAgICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMzogcmVsb2FkIGN1cnJlbnQgcGFnZSBjb250ZW50IHRvIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIC8vIE5vdGU6IHRvIHJlbG9hZCBzYW1lIHVybCBwYWdlIGNvbnRlbnQsIGlzIGJldHRlciByZXR1cm4gdGhlIGh0bWwgZGlyZWN0bHkgZnJvbVxyXG4gICAgICAgICAgICAvLyB0aGlzIGFqYXggc2VydmVyIHJlcXVlc3QuXHJcbiAgICAgICAgICAgIC8vY29udGFpbmVyLnVuYmxvY2soKTsgaXMgYmxvY2tlZCBhbmQgdW5ibG9ja2VkIGFnYWluIGJ5IHRoZSByZWxvYWQgbWV0aG9kOlxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmIChjdHggJiYgY3R4LmJveCAmJiBjdHguYm94LnJlbG9hZClcclxuICAgICAgICAgICAgICAgIGN0eC5ib3gucmVsb2FkKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA0KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgU3VjY2Vzc01lc3NhZ2UsIGF0dGFjaGluZyBhbmQgZXZlbnQgaGFuZGxlciB0byBnbyB0byBSZWRpcmVjdFVSTFxyXG4gICAgICAgICAgICBjdHguYm94Lm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdC5SZWRpcmVjdFVSTCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5TdWNjZXNzTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNSkge1xyXG4gICAgICAgICAgICAvLyBDaGFuZ2UgbWFpbi1hY3Rpb24gYnV0dG9uIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBidG4gPSBjdHguZm9ybS5maW5kKCcubWFpbi1hY3Rpb24nKTtcclxuICAgICAgICAgICAgdmFyIGRtc2cgPSBidG4uZGF0YSgnZGVmYXVsdC10ZXh0Jyk7XHJcbiAgICAgICAgICAgIGlmICghZG1zZylcclxuICAgICAgICAgICAgICAgIGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnLCBidG4udGV4dCgpKTtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGRhdGEuUmVzdWx0IHx8IGJ0bi5kYXRhKCdzdWNjZXNzLXBvc3QtdGV4dCcpIHx8ICdEb25lISc7XHJcbiAgICAgICAgICAgIGJ0bi50ZXh0KG1zZyk7XHJcbiAgICAgICAgICAgIC8vIEFkZGluZyBzdXBwb3J0IHRvIHJlc2V0IGJ1dHRvbiB0ZXh0IHRvIGRlZmF1bHQgb25lXHJcbiAgICAgICAgICAgIC8vIHdoZW4gdGhlIEZpcnN0IG5leHQgY2hhbmdlcyBoYXBwZW5zIG9uIHRoZSBmb3JtOlxyXG4gICAgICAgICAgICAkKGN0eC5mb3JtKS5vbmUoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBidG4udGV4dChidG4uZGF0YSgnZGVmYXVsdC10ZXh0JykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBmb3IgY3VzdG9tIGhhbmRsZXJzXHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gT2stR28gYWN0aW9ucyBwb3B1cCB3aXRoICdzdWNjZXNzJyBhbmQgJ2FkZGl0aW9uYWwnIG1lc3NhZ2VzLlxyXG4gICAgICAgICAgICBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA3KSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSA3OiBzaG93IG1lc3NhZ2Ugc2F5aW5nIGNvbnRhaW5lZCBhdCBkYXRhLlJlc3VsdC5NZXNzYWdlLlxyXG4gICAgICAgICAgICAvLyBUaGlzIGNvZGUgYWxsb3cgYXR0YWNoIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gaW4gZGF0YS5SZXN1bHQgdG8gZGlzdGluZ3Vpc2hcclxuICAgICAgICAgICAgLy8gZGlmZmVyZW50IHJlc3VsdHMgYWxsIHNob3dpbmcgYSBtZXNzYWdlIGJ1dCBtYXliZSBub3QgYmVpbmcgYSBzdWNjZXNzIGF0IGFsbFxyXG4gICAgICAgICAgICAvLyBhbmQgbWF5YmUgZG9pbmcgc29tZXRoaW5nIG1vcmUgaW4gdGhlIHRyaWdnZXJlZCBldmVudCB3aXRoIHRoZSBkYXRhIG9iamVjdC5cclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDgpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyB2YWxpZGF0aW9uIG1lc3NhZ2VzXHJcbiAgICAgICAgICAgIHZhciB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyk7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb25IZWxwZXIuc2V0RXJyb3JzKGN0eC5mb3JtLCBkYXRhLlJlc3VsdC5FcnJvcnMpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICAgIC8vIFVzZXIgQ29kZTogdHJpZ2dlciBjdXN0b20gZXZlbnQgdG8gbWFuYWdlIHJlc3VsdHM6XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeCwgY3R4XSk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gZGF0YS5Db2RlIDwgMFxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhbiBlcnJvciBjb2RlLlxyXG5cclxuICAgICAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybS5nZXQoMCksIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgICAgICAgICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IFwiRXJyb3I6IFwiICsgZGF0YS5Db2RlICsgXCI6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YS5SZXN1bHQgPyAoZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlIDogZGF0YS5SZXN1bHQpIDogJycpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCQoJzxkaXYvPicpLmFwcGVuZChtZXNzYWdlKSwgY3R4LmJveCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXJyb3I6IGxjT25FcnJvcixcclxuICAgICAgICBzdWNjZXNzOiBsY09uU3VjY2VzcyxcclxuICAgICAgICBjb21wbGV0ZTogbGNPbkNvbXBsZXRlLFxyXG4gICAgICAgIGRvSlNPTkFjdGlvbjogZG9KU09OQWN0aW9uXHJcbiAgICB9O1xyXG59IiwiLyogRm9ybXMgc3VibWl0dGVkIHZpYSBBSkFYICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyksXHJcbiAgICB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBnZXRYUGF0aCA9IHJlcXVpcmUoJy4vZ2V0WFBhdGgnKTtcclxuXHJcbmpRdWVyeSA9ICQ7XHJcblxyXG4vLyBHbG9iYWwgc2V0dGluZ3MsIHdpbGwgYmUgdXBkYXRlZCBvbiBpbml0IGJ1dCBpcyBhY2Nlc3NlZFxyXG4vLyB0aHJvdWdoIGNsb3N1cmUgZnJvbSBhbGwgZnVuY3Rpb25zLlxyXG4vLyBOT1RFOiBpcyBzdGF0aWMsIGRvZXNuJ3QgYWxsb3dzIG11bHRpcGxlIGNvbmZpZ3VyYXRpb24sIG9uZSBpbml0IGNhbGwgcmVwbGFjZSBwcmV2aW91c1xyXG4vLyBEZWZhdWx0czpcclxudmFyIHNldHRpbmdzID0ge1xyXG4gICAgbG9hZGluZ0RlbGF5OiAwLFxyXG4gICAgZWxlbWVudDogZG9jdW1lbnRcclxufTtcclxuXHJcbi8vIEFkYXB0ZWQgY2FsbGJhY2tzXHJcbmZ1bmN0aW9uIGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlcigpIHtcclxuICAgIGNhbGxiYWNrcy5jb21wbGV0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhamF4RXJyb3JQb3B1cEhhbmRsZXIoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICB2YXIgY3R4ID0gdGhpcztcclxuICAgIGlmICghY3R4LmZvcm0pIGN0eC5mb3JtID0gJCh0aGlzKTtcclxuICAgIGlmICghY3R4LmJveCkgY3R4LmJveCA9IGN0eC5mb3JtO1xyXG4gICAgLy8gRGF0YSBub3Qgc2F2ZWQ6XHJcbiAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKGN0eC5mb3JtLCBjdHguY2hhbmdlZEVsZW1lbnRzKTtcclxuXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBDb21tb24gbG9naWNcclxuICAgIGNhbGxiYWNrcy5lcnJvci5hcHBseShjdHgsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyKCkge1xyXG4gIGNhbGxiYWNrcy5zdWNjZXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gIFBlcmZvcm1zIHRoZSB2YWxpZGF0aW9uIG9uIHRoZSBmb3JtIG9yIHN1YmZvcm0gYXMgZGV0ZXJtaW5lXHJcbiAgdGhlIHZhbHVlcyBpbiB0aGUgY29udGV4dCAoQGN0eCksIHJldHVybmluZyB0cnVlIGZvciBzdWNjZXNzXHJcbiAgYW5kIGZhbHNlIGZvciBzb21lIGVycm9yIChlbGVtZW50cyBnZXQgbWFya2VkIHdpdGggdGhlIGVycm9yLFxyXG4gIGp1c3QgdGhlIGNhbGxlciBtdXN0IHN0b3AgYW55IHRhc2sgb24gZmFsc2UpLlxyXG4qKi9cclxuZnVuY3Rpb24gdmFsaWRhdGVGb3JtKGN0eCkge1xyXG4gIC8vIFZhbGlkYXRpb25zXHJcbiAgdmFyIHZhbGlkYXRpb25QYXNzZWQgPSB0cnVlO1xyXG4gIC8vIFRvIHN1cHBvcnQgc3ViLWZvcm1zIHRocm91aCBmaWVsZHNldC5hamF4LCB3ZSBtdXN0IGV4ZWN1dGUgdmFsaWRhdGlvbnMgYW5kIHZlcmlmaWNhdGlvblxyXG4gIC8vIGluIHR3byBzdGVwcyBhbmQgdXNpbmcgdGhlIHJlYWwgZm9ybSB0byBsZXQgdmFsaWRhdGlvbiBtZWNoYW5pc20gd29ya1xyXG4gIHZhciBpc1N1YmZvcm0gPSBjdHguZm9ybS5pcygnZmllbGRzZXQuYWpheCcpO1xyXG4gIHZhciBhY3R1YWxGb3JtID0gaXNTdWJmb3JtID8gY3R4LmZvcm0uY2xvc2VzdCgnZm9ybScpIDogY3R4LmZvcm0sXHJcbiAgICAgIGRpc2FibGVkU3VtbWFyaWVzID0gbmV3IGpRdWVyeSgpLFxyXG4gICAgICBkaXNhYmxlZEZpZWxkcyA9IG5ldyBqUXVlcnkoKTtcclxuXHJcbiAgLy8gT24gc3ViZm9ybSB2YWxpZGF0aW9uLCB3ZSBkb24ndCB3YW50IHRoZSBvdXRzaWRlIHN1YmZvcm0gZWxlbWVudHMgYW5kIHZhbGlkYXRpb24tc3VtbWFyeSBjb250cm9scyB0byBiZSBhZmZlY3RlZFxyXG4gIC8vIGJ5IHRoaXMgdmFsaWRhdGlvbiAodG8gYXZvaWQgdG8gc2hvdyBlcnJvcnMgdGhlcmUgdGhhdCBkb2Vzbid0IGludGVyZXN0IHRvIHRoZSByZXN0IG9mIHRoZSBmb3JtKVxyXG4gIC8vIFRvIGZ1bGxmaWxsIHRoaXMgcmVxdWlzaXQsIHdlIG5lZWQgdG8gaGlkZSBpdCBmb3IgdGhlIHZhbGlkYXRvciBmb3IgYSB3aGlsZSBhbmQgbGV0IG9ubHkgYWZmZWN0XHJcbiAgLy8gYW55IGxvY2FsIHN1bW1hcnkgKGluc2lkZSB0aGUgc3ViZm9ybSkuXHJcbiAgLy8gVGhlIHNhbWUgZm9yIGZvcm0gZWxlbWVudHMgb3V0c2lkZSB0aGUgc3ViZm9ybSwgd2UgZG9uJ3Qgd2FudCBpdHMgZXJyb3JzIGZvciBub3cuXHJcbiAgaWYgKGlzU3ViZm9ybSkge1xyXG4gICAgdmFyIG91dHNpZGVFbGVtZW50cyA9IChmdW5jdGlvbihmKSB7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gT25seSB0aG9zZSB0aGF0IGFyZSBvdXRzaWRlIHRoZSBzdWJmb3JtXHJcbiAgICAgICAgcmV0dXJuICEkLmNvbnRhaW5zKGYsIHRoaXMpO1xyXG4gICAgICB9O1xyXG4gICAgfSkoY3R4LmZvcm0uZ2V0KDApKTtcclxuXHJcbiAgICBkaXNhYmxlZFN1bW1hcmllcyA9IGFjdHVhbEZvcm1cclxuICAgIC5maW5kKCdbZGF0YS12YWxtc2ctc3VtbWFyeT10cnVlXScpXHJcbiAgICAuZmlsdGVyKG91dHNpZGVFbGVtZW50cylcclxuICAgIC8vIFdlIG11c3QgdXNlICdhdHRyJyBpbnN0ZWFkIG9mICdkYXRhJyBiZWNhdXNlIGlzIHdoYXQgd2UgYW5kIHVub2J0cnVzaXZlVmFsaWRhdGlvbiBjaGVja3NcclxuICAgIC8vIChpbiBvdGhlciB3b3JkcywgdXNpbmcgJ2RhdGEnIHdpbGwgbm90IHdvcmspXHJcbiAgICAuYXR0cignZGF0YS12YWxtc2ctc3VtbWFyeScsICdmYWxzZScpO1xyXG5cclxuICAgIGRpc2FibGVkRmllbGRzID0gYWN0dWFsRm9ybVxyXG4gICAgLmZpbmQoJ1tkYXRhLXZhbD10cnVlXScpXHJcbiAgICAuZmlsdGVyKG91dHNpZGVFbGVtZW50cylcclxuICAgIC5hdHRyKCdkYXRhLXZhbCcsICdmYWxzZScpO1xyXG4gIH1cclxuXHJcbiAgLy8gRmlyc3QgYXQgYWxsLCBpZiB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgdmFyIHZhbG9iamVjdCA9IGFjdHVhbEZvcm0uZGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgaWYgKHZhbG9iamVjdCAmJiB2YWxvYmplY3QudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgIHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnMoY3R4LmZvcm0pO1xyXG4gICAgdmFsaWRhdGlvblBhc3NlZCA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLy8gSWYgY3VzdG9tIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGUuXHJcbiAgLy8gQ3VzdG9tIHZhbGlkYXRpb24gY2FuIGJlIGF0dGFjaGVkIHRvIGZvcm1zIG9yIGZpZWxkc2V0LCBidXRcclxuICAvLyB0byBzdXBwb3J0IHN1YmZvcm1zLCBvbmx5IGV4ZWN1dGUgaW4gdGhlIGN0eC5mb3JtIGVsZW1lbnQgKGNhbiBiZSBcclxuICAvLyBhIGZpZWxzZXQgc3ViZm9ybSkgYW5kIGFueSBjaGlsZHJlbiBmaWVsZHNldC5cclxuICBjdHguZm9ybS5hZGQoY3R4LmZvcm0uZmluZCgnZmllbGRzZXQnKSkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgY3VzdmFsID0gJCh0aGlzKS5kYXRhKCdjdXN0b21WYWxpZGF0aW9uJyk7XHJcbiAgICBpZiAoY3VzdmFsICYmIGN1c3ZhbC52YWxpZGF0ZSAmJiBjdXN2YWwudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycyhjdHguZm9ybSk7XHJcbiAgICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gVG8gc3VwcG9ydCBzdWItZm9ybXMsIHdlIG11c3QgY2hlY2sgdGhhdCB2YWxpZGF0aW9ucyBlcnJvcnMgaGFwcGVuZWQgaW5zaWRlIHRoZVxyXG4gIC8vIHN1YmZvcm0gYW5kIG5vdCBpbiBvdGhlciBlbGVtZW50cywgdG8gZG9uJ3Qgc3RvcCBzdWJtaXQgb24gbm90IHJlbGF0ZWQgZXJyb3JzLlxyXG4gIC8vICh3ZSBhdm9pZCBleGVjdXRlIHZhbGlkYXRpb24gb24gdGhhdCBlbGVtZW50cyBidXQgY291bGQgaGFwcGVuIGEgcHJldmlvdXMgdmFsaWRhdGlvbilcclxuICAvLyBKdXN0IGxvb2sgZm9yIG1hcmtlZCBlbGVtZW50czpcclxuICBpZiAoaXNTdWJmb3JtICYmIGN0eC5mb3JtLmZpbmQoJy5pbnB1dC12YWxpZGF0aW9uLWVycm9yJykubGVuZ3RoKVxyXG4gICAgdmFsaWRhdGlvblBhc3NlZCA9IGZhbHNlO1xyXG5cclxuICAvLyBSZS1lbmFibGUgYWdhaW4gdGhhdCBzdW1tYXJpZXMgcHJldmlvdXNseSBkaXNhYmxlZFxyXG4gIGlmIChpc1N1YmZvcm0pIHtcclxuICAgIC8vIFdlIG11c3QgdXNlICdhdHRyJyBpbnN0ZWFkIG9mICdkYXRhJyBiZWNhdXNlIGlzIHdoYXQgd2UgYW5kIHVub2J0cnVzaXZlVmFsaWRhdGlvbiBjaGVja3NcclxuICAgIC8vIChpbiBvdGhlciB3b3JkcywgdXNpbmcgJ2RhdGEnIHdpbGwgbm90IHdvcmspXHJcbiAgICBkaXNhYmxlZFN1bW1hcmllcy5hdHRyKCdkYXRhLXZhbG1zZy1zdW1tYXJ5JywgJ3RydWUnKTtcclxuICAgIGRpc2FibGVkRmllbGRzLmF0dHIoJ2RhdGEtdmFsJywgJ3RydWUnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB2YWxpZGF0aW9uUGFzc2VkO1xyXG59XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4qIEFqYXggRm9ybXMgZ2VuZXJpYyBmdW5jdGlvbi5cclxuKiBSZXN1bHQgZXhwZWN0ZWQgaXM6XHJcbiogLSBodG1sLCBmb3IgdmFsaWRhdGlvbiBlcnJvcnMgZnJvbSBzZXJ2ZXIsIHJlcGxhY2luZyBjdXJyZW50IC5hamF4LWJveCBjb250ZW50XHJcbiogLSBqc29uLCB3aXRoIHN0cnVjdHVyZTogeyBDb2RlOiBpbnRlZ2VyLW51bWJlciwgUmVzdWx0OiBzdHJpbmctb3Itb2JqZWN0IH1cclxuKiAgIENvZGUgbnVtYmVyczpcclxuKiAgICAtIE5lZ2F0aXZlOiBlcnJvcnMsIHdpdGggYSBSZXN1bHQgb2JqZWN0IHsgRXJyb3JNZXNzYWdlOiBzdHJpbmcgfVxyXG4qICAgIC0gWmVybzogc3VjY2VzcyByZXN1bHQsIGl0IHNob3dzIGEgbWVzc2FnZSB3aXRoIGNvbnRlbnQ6IFJlc3VsdCBzdHJpbmcsIGVsc2UgZm9ybSBkYXRhIGF0dHJpYnV0ZSAnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnLCBlbHNlIGEgZ2VuZXJpYyBtZXNzYWdlXHJcbiogICAgLSAxOiBzdWNjZXNzIHJlc3VsdCwgUmVzdWx0IGNvbnRhaW5zIGEgVVJMLCB0aGUgcGFnZSB3aWxsIGJlIHJlZGlyZWN0ZWQgdG8gdGhhdC5cclxuKiAgICAtIE1ham9yIDE6IHN1Y2Nlc3MgcmVzdWx0LCB3aXRoIGN1c3RvbSBoYW5kbGVyIHRocm91Z2h0IHRoZSBmb3JtIGV2ZW50ICdzdWNjZXNzLXBvc3QtbWVzc2FnZScuXHJcbiovXHJcbmZ1bmN0aW9uIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpIHtcclxuICAgIC8vIENvbnRleHQgdmFyLCB1c2VkIGFzIGFqYXggY29udGV4dDpcclxuICAgIHZhciBjdHggPSB7fTtcclxuICAgIC8vIERlZmF1bHQgZGF0YSBmb3IgcmVxdWlyZWQgcGFyYW1zOlxyXG4gICAgY3R4LmZvcm0gPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuZm9ybSA6IG51bGwpIHx8ICQodGhpcyk7XHJcbiAgICBjdHguYm94ID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmJveCA6IG51bGwpIHx8IGN0eC5mb3JtLmNsb3Nlc3QoXCIuYWpheC1ib3hcIik7XHJcbiAgICB2YXIgYWN0aW9uID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmFjdGlvbiA6IG51bGwpIHx8IGN0eC5mb3JtLmF0dHIoJ2FjdGlvbicpIHx8ICcnO1xyXG5cclxuICAgIHZhciBwb3N0VmFsaWRhdGlvbiA9IGN0eC5mb3JtLmRhdGEoJ3Bvc3QtdmFsaWRhdGlvbicpO1xyXG4gICAgdmFyIHJlcXVlc3RzID0gY3R4LmZvcm0uZGF0YSgneGhyLXJlcXVlc3RzJykgfHwgW107XHJcbiAgICBjdHguZm9ybS5kYXRhKCd4aHItcmVxdWVzdHMnLCByZXF1ZXN0cyk7XHJcblxyXG4gICAgaWYgKCFwb3N0VmFsaWRhdGlvbikge1xyXG4gICAgICAgIC8vIENoZWNrIHZhbGlkYXRpb25cclxuICAgICAgICBpZiAodmFsaWRhdGVGb3JtKGN0eCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIC8vIFZhbGlkYXRpb24gZmFpbGVkLCBzdWJtaXQgY2Fubm90IGNvbnRpbnVlLCBvdXQhXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGF0YSBzYXZlZDpcclxuICAgIGN0eC5jaGFuZ2VkRWxlbWVudHMgPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuY2hhbmdlZEVsZW1lbnRzIDogbnVsbCkgfHwgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoY3R4LmZvcm0uZ2V0KDApKTtcclxuXHJcbiAgICAvLyBOb3RpZmljYXRpb24gZXZlbnQgdG8gYWxsb3cgc2NyaXB0cyB0byBob29rIGFkZGl0aW9uYWwgdGFza3MgYmVmb3JlIHNlbmQgZGF0YVxyXG4gICAgY3R4LmZvcm0udHJpZ2dlcigncHJlc3VibWl0JywgW2N0eF0pO1xyXG5cclxuICAgIC8vIExvYWRpbmcsIHdpdGggcmV0YXJkXHJcbiAgICBjdHgubG9hZGluZ3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY3R4LmJveC5ibG9jayhibG9ja1ByZXNldHMubG9hZGluZyk7XHJcbiAgICB9LCBzZXR0aW5ncy5sb2FkaW5nRGVsYXkpO1xyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgdmFyIGRhdGEgPSBjdHguZm9ybS5maW5kKCc6aW5wdXQnKS5zZXJpYWxpemUoKTtcclxuXHJcbiAgICAvLyBBYm9ydCBwcmV2aW91cyByZXF1ZXN0c1xyXG4gICAgJC5lYWNoKHJlcXVlc3RzLCBmdW5jdGlvbiAocmVxKSB7XHJcbiAgICAgICAgaWYgKHJlcSAmJiByZXEuYWJvcnQpXHJcbiAgICAgICAgICAgIHJlcS5hYm9ydCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgdmFyIHJlcXVlc3QgPSAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogYWN0aW9uLFxyXG4gICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICBzdWNjZXNzOiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlcixcclxuICAgICAgICBlcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIGNvbXBsZXRlOiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXJcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlZ2lzdGVyIHJlcXVlc3RcclxuICAgIHJlcXVlc3RzLnB1c2gocmVxdWVzdCk7XHJcbiAgICAvLyBTZXQgYXV0by1kZXNyZWdpc3RyYXRpb25cclxuICAgIHZhciByZXFJbmRleCA9IHJlcXVlc3RzLmxlbmd0aCAtIDE7XHJcbiAgICByZXF1ZXN0LmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gRGVsZXRlLCBub3Qgc3BsaWNlLCBzaW5jZSB3ZSBuZWVkIHRvIHByZXNlcnZlIHRoZSBvcmRlclxyXG4gICAgICAgIGRlbGV0ZSByZXF1ZXN0c1tyZXFJbmRleF07XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyBwb3N0IHZhbGlkYXRpb246XHJcbiAgICBpZiAocG9zdFZhbGlkYXRpb24gJiYgcG9zdFZhbGlkYXRpb24gIT09ICduZXZlcicpIHtcclxuICAgICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YWxpZGF0ZUZvcm0oY3R4KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdG9wIG5vcm1hbCBQT1NUOlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vKipcclxuICAgIEl0IHBlcmZvcm1zIGEgcG9zdCBzdWJtaXQgb24gdGhlIGdpdmVuIGZvcm0gb24gYmFja2dyb3VuZCxcclxuICAgIHdpdGhvdXQgbm90aWZpY2F0aW9ucyBvZiBhbnkga2luZCwganVzdCBmb3IgdGhlIGluc3RhbnQgc2F2aW5nIGZlYXR1cmUuXHJcbioqL1xyXG5mdW5jdGlvbiBkb0luc3RhbnRTYXZpbmcoZm9ybSwgY2hhbmdlZEVsZW1lbnRzKSB7XHJcbiAgICBmb3JtID0gJChmb3JtKTtcclxuICAgIHZhciBhY3Rpb24gPSBmb3JtLmF0dHIoJ2FjdGlvbicpIHx8IGZvcm0uZGF0YSgnYWpheC1maWVsZHNldC1hY3Rpb24nKSB8fCAnJztcclxuICAgIHZhciBjdHggPSB7IGZvcm06IGZvcm0sIGJveDogZm9ybSB9O1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBldmVudCB0byBhbGxvdyBzY3JpcHRzIHRvIGhvb2sgYWRkaXRpb25hbCB0YXNrcyBiZWZvcmUgc2VuZCBkYXRhXHJcbiAgICBmb3JtLnRyaWdnZXIoJ3ByZXN1Ym1pdCcsIFtjdHhdKTtcclxuXHJcbiAgICB2YXIgZGF0YSA9IGN0eC5mb3JtLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpO1xyXG5cclxuICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgIHZhciByZXF1ZXN0ID0gJC5hamF4KHtcclxuICAgICAgICB1cmw6IGFjdGlvbixcclxuICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBUcmFja2VkIGNoYW5nZWQgZWxlbWVudHMgYXJlIHNhdmVkXHJcbiAgICAgICAgICAgIGlmIChjaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmb3JtLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksIGNoYW5nZWRFbGVtZW50cyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHJlcXVlc3RzID0gZm9ybS5kYXRhKCd4aHItcmVxdWVzdHMnKSB8fCBbXTtcclxuICAgIGZvcm0uZGF0YSgneGhyLXJlcXVlc3RzJywgcmVxdWVzdHMpO1xyXG5cclxuICAgIC8vIFJlZ2lzdGVyIHJlcXVlc3RcclxuICAgIHJlcXVlc3RzLnB1c2gocmVxdWVzdCk7XHJcbiAgICAvLyBTZXQgYXV0by1kZXNyZWdpc3RyYXRpb25cclxuICAgIHZhciByZXFJbmRleCA9IHJlcXVlc3RzLmxlbmd0aCAtIDE7XHJcbiAgICByZXF1ZXN0LmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gRGVsZXRlLCBub3Qgc3BsaWNlLCBzaW5jZSB3ZSBuZWVkIHRvIHByZXNlcnZlIHRoZSBvcmRlclxyXG4gICAgICAgIGRlbGV0ZSByZXF1ZXN0c1tyZXFJbmRleF07XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcmVxdWVzdDtcclxufVxyXG5cclxuLy8gUHVibGljIGluaXRpYWxpemF0aW9uXHJcbmZ1bmN0aW9uIGluaXRBamF4Rm9ybXMob3B0aW9ucykge1xyXG4gICAgJC5leHRlbmQodHJ1ZSwgc2V0dGluZ3MsIG9wdGlvbnMpO1xyXG5cclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIHRvIG1hbmFnZSBhamF4IGZvcm1zICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdzdWJtaXQnLCAnZm9ybS5hamF4JywgYWpheEZvcm1zU3VibWl0SGFuZGxlcik7XHJcbiAgICAvKiBBdHRhY2ggYSBkZWxlZ2F0ZWQgaGFuZGxlciBmb3IgYSBzcGVjaWFsIGFqYXggZm9ybSBjYXNlOiBzdWJmb3JtcywgdXNpbmcgZmllbGRzZXRzLiAqL1xyXG4gICAgJChzZXR0aW5ncy5lbGVtZW50KS5vbignY2xpY2snLCAnZmllbGRzZXQuYWpheCAuYWpheC1maWVsZHNldC1zdWJtaXQnLFxyXG4gICAgICAgIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgdmFyIGZvcm0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0LmFqYXgnKTtcclxuXHJcbiAgICAgICAgICBldmVudC5kYXRhID0ge1xyXG4gICAgICAgICAgICBmb3JtOiBmb3JtLFxyXG4gICAgICAgICAgICBib3g6IGZvcm0uY2xvc2VzdCgnLmFqYXgtYm94JyksXHJcbiAgICAgICAgICAgIGFjdGlvbjogZm9ybS5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpLFxyXG4gICAgICAgICAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgICAgICAgICBjaGFuZ2VkRWxlbWVudHM6IGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uZ2V0KDApLCBmb3JtLmZpbmQoJzppbnB1dFtuYW1lXScpKVxyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHJldHVybiBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKGV2ZW50KTtcclxuICAgICAgICB9XHJcbiAgICApO1xyXG59XHJcbi8qIFVOVVNFRD9cclxuZnVuY3Rpb24gYWpheEZvcm1NZXNzYWdlT25IdG1sUmV0dXJuZWRXaXRob3V0VmFsaWRhdGlvbkVycm9ycyhmb3JtLCBtZXNzYWdlKSB7XHJcbiAgICB2YXIgJHQgPSAkKGZvcm0pO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gZm9ybSBlcnJvcnMsIHNob3cgYSBzdWNjZXNzZnVsIG1lc3NhZ2VcclxuICAgIGlmICgkdC5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgJHQuYmxvY2soaW5mb0Jsb2NrKG1lc3NhZ2UsIHtcclxuICAgICAgICAgICAgY3NzOiBwb3B1cFN0eWxlKHBvcHVwU2l6ZSgnc21hbGwnKSlcclxuICAgICAgICB9KSlcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHsgJHQudW5ibG9jaygpOyByZXR1cm4gZmFsc2U7IH0pO1xyXG4gICAgfVxyXG59XHJcbiovXHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdDogaW5pdEFqYXhGb3JtcyxcclxuICAgICAgICBvblN1Y2Nlc3M6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyLFxyXG4gICAgICAgIG9uRXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlcixcclxuICAgICAgICBvbkNvbXBsZXRlOiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXIsXHJcbiAgICAgICAgZG9JbnN0YW50U2F2aW5nOiBkb0luc3RhbnRTYXZpbmdcclxuICAgIH07XHJcbiIsIi8qIEF1dG8gY2FsY3VsYXRlIHN1bW1hcnkgb24gRE9NIHRhZ2dpbmcgd2l0aCBjbGFzc2VzIHRoZSBlbGVtZW50cyBpbnZvbHZlZC5cclxuICovXHJcbnZhciBudSA9IHJlcXVpcmUoJy4vbnVtYmVyVXRpbHMnKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscygpIHtcclxuICAgICQoJ3RhYmxlLmNhbGN1bGF0ZS1pdGVtcy10b3RhbHMnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGUtaXRlbXMtdG90YWxzLWluaXRpYWxpemF0ZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZVJvdygpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIHRyID0gJHQuY2xvc2VzdCgndHInKTtcclxuICAgICAgICAgICAgdmFyIGlwID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXByaWNlJyk7XHJcbiAgICAgICAgICAgIHZhciBpcSA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eScpO1xyXG4gICAgICAgICAgICB2YXIgaXQgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tdG90YWwnKTtcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIobnUuZ2V0TW9uZXlOdW1iZXIoaXApICogbnUuZ2V0TW9uZXlOdW1iZXIoaXEsIDEpLCBpdCk7XHJcbiAgICAgICAgICAgIHRyLnRyaWdnZXIoJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJCh0aGlzKS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcHJpY2UsIC5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eScpLm9uKCdjaGFuZ2UnLCBjYWxjdWxhdGVSb3cpO1xyXG4gICAgICAgICQodGhpcykuZmluZCgndHInKS5lYWNoKGNhbGN1bGF0ZVJvdyk7XHJcbiAgICAgICAgJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGUtaXRlbXMtdG90YWxzLWluaXRpYWxpemF0ZWQnLCB0cnVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXR1cENhbGN1bGF0ZVN1bW1hcnkoZm9yY2UpIHtcclxuICAgICQoJy5jYWxjdWxhdGUtc3VtbWFyeScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoIWZvcmNlICYmIGMuZGF0YSgnY2FsY3VsYXRlLXN1bW1hcnktaW5pdGlhbGl6YXRlZCcpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdmFyIHMgPSBjLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5Jyk7XHJcbiAgICAgICAgdmFyIGQgPSBjLmZpbmQoJ3RhYmxlLmNhbGN1bGF0ZS1zdW1tYXJ5LWdyb3VwJyk7XHJcbiAgICAgICAgZnVuY3Rpb24gY2FsYygpIHtcclxuICAgICAgICAgICAgdmFyIHRvdGFsID0gMCwgZmVlID0gMCwgZHVyYXRpb24gPSAwO1xyXG4gICAgICAgICAgICB2YXIgZ3JvdXBzID0ge307XHJcbiAgICAgICAgICAgIGQuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXBUb3RhbCA9IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWxsQ2hlY2tlZCA9ICQodGhpcykuaXMoJy5jYWxjdWxhdGUtYWxsLWl0ZW1zJyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbGxDaGVja2VkIHx8IGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWNoZWNrZWQnKS5pcygnOmNoZWNrZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cFRvdGFsICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXRvdGFsOmVxKDApJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcSA9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXF1YW50aXR5OmVxKDApJyksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmZWUgKz0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tZmVlOmVxKDApJykpICogcTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gKz0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tZHVyYXRpb246ZXEoMCknKSkgKiBxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdG90YWwgKz0gZ3JvdXBUb3RhbDtcclxuICAgICAgICAgICAgICAgIGdyb3Vwc1skKHRoaXMpLmRhdGEoJ2NhbGN1bGF0aW9uLXN1bW1hcnktZ3JvdXAnKV0gPSBncm91cFRvdGFsO1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZ3JvdXBUb3RhbCwgJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLmZpbmQoJy5ncm91cC10b3RhbC1wcmljZScpKTtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGR1cmF0aW9uLCAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0JykuZmluZCgnLmdyb3VwLXRvdGFsLWR1cmF0aW9uJykpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNldCBzdW1tYXJ5IHRvdGFsIHZhbHVlXHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKHRvdGFsLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LXRvdGFsJykpO1xyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihmZWUsIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktZmVlJykpO1xyXG4gICAgICAgICAgICAvLyBBbmQgZXZlcnkgZ3JvdXAgdG90YWwgdmFsdWVcclxuICAgICAgICAgICAgZm9yICh2YXIgZyBpbiBncm91cHMpIHtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGdyb3Vwc1tnXSwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS1ncm91cC0nICsgZykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGQuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWNoZWNrZWQnKS5jaGFuZ2UoY2FsYyk7XHJcbiAgICAgICAgZC5vbignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgY2FsYyk7XHJcbiAgICAgICAgY2FsYygpO1xyXG4gICAgICAgIGMuZGF0YSgnY2FsY3VsYXRlLXN1bW1hcnktaW5pdGlhbGl6YXRlZCcsIHRydWUpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBVcGRhdGUgdGhlIGRldGFpbCBvZiBhIHByaWNpbmcgc3VtbWFyeSwgb25lIGRldGFpbCBsaW5lIHBlciBzZWxlY3RlZCBpdGVtXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCkge1xyXG4gICAgJCgnLnByaWNpbmctc3VtbWFyeS5kZXRhaWxlZCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICRkID0gJHMuZmluZCgndGJvZHkuZGV0YWlsJyksXHJcbiAgICAgICAgICAgICR0ID0gJHMuZmluZCgndGJvZHkuZGV0YWlsLXRwbCcpLmNoaWxkcmVuKCd0cjplcSgwKScpLFxyXG4gICAgICAgICAgICAkYyA9ICRzLmNsb3Nlc3QoJ2Zvcm0nKSxcclxuICAgICAgICAgICAgJGl0ZW1zID0gJGMuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtJyk7XHJcblxyXG4gICAgICAgIC8vIERvIGl0IVxyXG4gICAgICAgIC8vIFJlbW92ZSBvbGQgbGluZXNcclxuICAgICAgICAkZC5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIENyZWF0ZSBuZXcgb25lc1xyXG4gICAgICAgICRpdGVtcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gR2V0IHZhbHVlc1xyXG4gICAgICAgICAgICB2YXIgJGkgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA9ICRpLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1jaGVja2VkJykucHJvcCgnY2hlY2tlZCcpO1xyXG4gICAgICAgICAgICBpZiAoY2hlY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbmNlcHQgPSAkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY29uY2VwdCcpLnRleHQoKSxcclxuICAgICAgICAgICAgICAgICAgICBwcmljZSA9IG51LmdldE1vbmV5TnVtYmVyKCRpLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1wcmljZTplcSgwKScpKTtcclxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSByb3cgYW5kIHNldCB2YWx1ZXNcclxuICAgICAgICAgICAgICAgIHZhciAkcm93ID0gJHQuY2xvbmUoKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdkZXRhaWwtdHBsJylcclxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZGV0YWlsJyk7XHJcbiAgICAgICAgICAgICAgICAkcm93LmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1jb25jZXB0JykudGV4dChjb25jZXB0KTtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKHByaWNlLCAkcm93LmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1wcmljZScpKTtcclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0byB0aGUgdGFibGVcclxuICAgICAgICAgICAgICAgICRkLmFwcGVuZCgkcm93KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCkge1xyXG4gICAgdmFyICRjID0gJCgnLnByaWNpbmctc3VtbWFyeS5kZXRhaWxlZCcpLmNsb3Nlc3QoJ2Zvcm0nKTtcclxuICAgIC8vIEluaXRpYWwgY2FsY3VsYXRpb25cclxuICAgIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkoKTtcclxuICAgIC8vIENhbGN1bGF0ZSBvbiByZWxldmFudCBmb3JtIGNoYW5nZXNcclxuICAgICRjLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1jaGVja2VkJykuY2hhbmdlKHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkpO1xyXG4gICAgLy8gU3VwcG9ydCBmb3IgbGNTZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMgZXZlbnRcclxuICAgICRjLm9uKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KTtcclxufVxyXG5cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9uVGFibGVJdGVtczogc2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzLFxyXG4gICAgICAgIG9uU3VtbWFyeTogc2V0dXBDYWxjdWxhdGVTdW1tYXJ5LFxyXG4gICAgICAgIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnk6IHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnksXHJcbiAgICAgICAgb25EZXRhaWxlZFByaWNpbmdTdW1tYXJ5OiBzZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnlcclxuICAgIH07IiwiLyogRm9jdXMgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlIGRvY3VtZW50IChvciBpbiBAY29udGFpbmVyKVxyXG53aXRoIHRoZSBodG1sNSBhdHRyaWJ1dGUgJ2F1dG9mb2N1cycgKG9yIGFsdGVybmF0aXZlIEBjc3NTZWxlY3RvcikuXHJcbkl0J3MgZmluZSBhcyBhIHBvbHlmaWxsIGFuZCBmb3IgYWpheCBsb2FkZWQgY29udGVudCB0aGF0IHdpbGwgbm90XHJcbmdldCB0aGUgYnJvd3NlciBzdXBwb3J0IG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBhdXRvRm9jdXMoY29udGFpbmVyLCBjc3NTZWxlY3Rvcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgZG9jdW1lbnQpO1xyXG4gICAgY29udGFpbmVyLmZpbmQoY3NzU2VsZWN0b3IgfHwgJ1thdXRvZm9jdXNdJykuZm9jdXMoKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhdXRvRm9jdXM7IiwiLyoqIEF1dG8tZmlsbCBtZW51IHN1Yi1pdGVtcyB1c2luZyB0YWJiZWQgcGFnZXMgLW9ubHkgd29ya3MgZm9yIGN1cnJlbnQgcGFnZSBpdGVtcy0gKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGF1dG9maWxsU3VibWVudSgpIHtcclxuICAgICQoJy5hdXRvZmlsbC1zdWJtZW51IC5jdXJyZW50JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudG1lbnUgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIHN1Ym1lbnUgZWxlbWVudHMgZnJvbSB0YWJzIG1hcmtlZCB3aXRoIGNsYXNzICdhdXRvZmlsbC1zdWJtZW51LWl0ZW1zJ1xyXG4gICAgICAgIHZhciBpdGVtcyA9ICQoJy5hdXRvZmlsbC1zdWJtZW51LWl0ZW1zIGxpOm5vdCgucmVtb3ZhYmxlKScpO1xyXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGl0ZW1zLCBjcmVhdGUgdGhlIHN1Ym1lbnUgY2xvbmluZyBpdCFcclxuICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgc3VibWVudSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcclxuICAgICAgICAgICAgcGFyZW50bWVudS5hcHBlbmQoc3VibWVudSk7XHJcbiAgICAgICAgICAgIC8vIENsb25pbmcgd2l0aG91dCBldmVudHM6XHJcbiAgICAgICAgICAgIHZhciBuZXdpdGVtcyA9IGl0ZW1zLmNsb25lKGZhbHNlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICQoc3VibWVudSkuYXBwZW5kKG5ld2l0ZW1zKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFdlIG5lZWQgYXR0YWNoIGV2ZW50cyB0byBtYWludGFpbiB0aGUgdGFiYmVkIGludGVyZmFjZSB3b3JraW5nXHJcbiAgICAgICAgICAgIC8vIE5ldyBJdGVtcyAoY2xvbmVkKSBtdXN0IGNoYW5nZSB0YWJzOlxyXG4gICAgICAgICAgICBuZXdpdGVtcy5maW5kKFwiYVwiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IGluIHRoZSBvcmlnaW5hbCBpdGVtXHJcbiAgICAgICAgICAgICAgICAkKFwiYVtocmVmPSdcIiArIHRoaXMuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKSArIFwiJ11cIiwgaXRlbXMpLmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGFuZ2UgbWVudTpcclxuICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkucGFyZW50KCkuZmluZChcImFcIikucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAgICAgICAgIC8vIFN0b3AgZXZlbnQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBPcmlnaW5hbCBpdGVtcyBtdXN0IGNoYW5nZSBtZW51OlxyXG4gICAgICAgICAgICBpdGVtcy5maW5kKFwiYVwiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdpdGVtcy5wYXJlbnQoKS5maW5kKFwiYVwiKS5yZW1vdmVDbGFzcygnY3VycmVudCcpLlxyXG4gICAgICAgICAgICAgICAgZmlsdGVyKFwiKltocmVmPSdcIiArIHRoaXMuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKSArIFwiJ11cIikuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbk1hbmFnZSBhbGwgdGhhdCBldmVudHMgYXR0YWNoZWQgdG8gZGF0ZXMgbWFkZSB1bmF2YWlsYWJsZSBieSB0aGUgdXNlclxyXG50byBub3RpZnkgYWJvdXQgd2hhdCB0aGF0IG1lYW5zLlxyXG5cclxuTWFkZSBmb3IgdXNlIGluIHRoZSBNb250aGx5IGNhbGVuZGFyLCBtYXliZSByZXVzYWJsZS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgb2JqZWN0VXRpbHMgPSByZXF1aXJlKCcuL29iamVjdFV0aWxzJyk7XHJcbnJlcXVpcmUoXCJkYXRlLWZvcm1hdC1saXRlXCIpO1xyXG5cclxuLyoqXHJcblRoZSBAZWxlbWVudCBtdXN0IGJlIGEgZG9tIGVsZW1lbnQgY29udGFpbmluZyB0aGF0IHdpbGwgY29udGFpbiB0aGUgaW5mb3JtYXRpb25cclxuYW5kIHdpbGwgdXNlIGFuIHVsIGVsZW1lbnQgdG8gbGlzdCBub3RpZmljYXRpb25zLiBUaGUgZWxlbWVudCB3aWxsIGJlIGhpZGRlblxyXG5pbml0aWFsbHkgYW5kIGFueSB0aW1lIHRoYXQsIG9uIHJlbmRlcmluZywgdGhlcmUgYXJlIG5vdCBub3RpZmljYXRpb25zLlxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBCb29raW5nc05vdGlmaWNhdGlvbihlbGVtZW50KSB7XHJcblxyXG4gIHRoaXMuJGVsID0gJChlbGVtZW50KTtcclxuICB0aGlzLiRsaXN0ID0gdGhpcy4kZWwuZmluZCgndWwnKTtcclxuICBpZiAoIXRoaXMuJGxpc3QubGVuZ3RoKVxyXG4gICAgdGhpcy4kbGlzdCA9ICQoJzx1bC8+JykuYXBwZW5kVG8odGhpcy4kZWwpO1xyXG5cclxuICB0aGlzLnJlZ2lzdGVyZWQgPSB7fTtcclxuXHJcbiAgdGhpcy5yZWdpc3RlciA9IGZ1bmN0aW9uIHJlZ2lzdGVyKHRvZ2dsZSwgZGF0YSwgc3RyRGF0ZSkge1xyXG4gICAgdmFyIGwgPSB0aGlzLnJlZ2lzdGVyZWQ7XHJcbiAgICBpZiAodG9nZ2xlKSB7XHJcbiAgICAgIC8vIHJlZ2lzdGVyIChpZiBzb21ldGhpbmcpXHJcbiAgICAgIHZhciBldnMgPSBkYXRhLnNsb3RzW3N0ckRhdGVdLmV2ZW50c0lkcztcclxuICAgICAgaWYgKGV2cykge1xyXG4gICAgICAgIGxbc3RyRGF0ZV0gPSBvYmplY3RVdGlscy5maWx0ZXJQcm9wZXJ0aWVzKGRhdGEuZXZlbnRzLCBmdW5jdGlvbiAoaykgeyByZXR1cm4gZXZzLmluZGV4T2YoaykgIT0gLTE7IH0pO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyB1bnJlZ2lzdGVyXHJcbiAgICAgIGRlbGV0ZSBsW3N0ckRhdGVdO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIHRoaXMucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xyXG4gICAgLy8gUmVuZXcgdGhlIGxpc3RcclxuICAgIHRoaXMuJGxpc3QuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuXHJcbiAgICB2YXIgaGFzTm90aWZpY2F0aW9ucyA9IGZhbHNlO1xyXG5cclxuICAgIGZvciAodmFyIHN0ckRhdGUgaW4gdGhpcy5yZWdpc3RlcmVkKSB7XHJcbiAgICAgIGlmICghdGhpcy5yZWdpc3RlcmVkLmhhc093blByb3BlcnR5KHN0ckRhdGUpKSBjb250aW51ZTtcclxuXHJcbiAgICAgIHZhciBldmVudHMgPSB0aGlzLnJlZ2lzdGVyZWRbc3RyRGF0ZV07XHJcbiAgICAgIHZhciBkYXRlID0gZGF0ZUlTTy5wYXJzZShzdHJEYXRlKS5mb3JtYXQoJ0REREQsIE1NTSBEJyk7XHJcbiAgICAgIHZhciBtc2cgPSAkKCc8c3Bhbi8+JykudGV4dChkYXRlICsgXCI6IFwiKS5vdXRlckh0bWwoKTtcclxuXHJcbiAgICAgIHZhciBldmVudHNIdG1sID0gW107XHJcbiAgICAgIGZvciAodmFyIHAgaW4gZXZlbnRzKSB7XHJcbiAgICAgICAgaWYgKCFldmVudHMuaGFzT3duUHJvcGVydHkocCkpIGNvbnRpbnVlO1xyXG4gICAgICAgIHZhciBldiA9IGV2ZW50c1twXTtcclxuICAgICAgICB2YXIgaXRlbSA9ICQoJzxhIHRhcmdldD1cIl9ibGFua1wiIC8+JykuYXR0cignaHJlZicsIGV2LnVybCkudGV4dChldi5zdW1tYXJ5IHx8ICdib29raW5nJyk7XHJcbiAgICAgICAgZXZlbnRzSHRtbC5wdXNoKGl0ZW0ub3V0ZXJIdG1sKCkpO1xyXG5cclxuICAgICAgICBoYXNOb3RpZmljYXRpb25zID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBtc2cgKz0gZXZlbnRzSHRtbC5qb2luKCcsICcpO1xyXG5cclxuICAgICAgJCgnPGxpLz4nKVxyXG4gICAgICAuaHRtbChtc2cpXHJcbiAgICAgIC5hcHBlbmRUbyh0aGlzLiRsaXN0KTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaGFzTm90aWZpY2F0aW9ucylcclxuICAgICAgdGhpcy4kZWwuc2hvdygpO1xyXG4gICAgZWxzZVxyXG4gICAgICB0aGlzLiRlbC5oaWRlKCk7XHJcblxyXG4gIH07XHJcbn07IiwiLyoqXHJcbiAgTW9udGhseSBjYWxlbmRhciBjbGFzc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4uL0NYL0xjV2lkZ2V0JyksXHJcbiAgZXh0ZW5kID0gcmVxdWlyZSgnLi4vQ1gvZXh0ZW5kJyksXHJcbiAgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXHJcbiAgb2JqZWN0VXRpbHMgPSByZXF1aXJlKCcuL29iamVjdFV0aWxzJyksXHJcbiAgQm9va2luZ3NOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL0Jvb2tpbmdzTm90aWZpY2F0aW9uJyk7XHJcblxyXG52YXIgZXZlbnRzID0ge1xyXG4gICAgZGF0YUNoYW5nZWQ6ICdkYXRhQ2hhbmdlZCdcclxufTtcclxuXHJcbi8qKlxyXG4gIFByaXZhdGUgdXRpbHNcclxuKiovXHJcblxyXG4vKipcclxuICBQcmVmZXRjaCBuZXh0IG1vbnRoIChiYXNlZCBvbiB0aGUgZ2l2ZW4gZGF0ZXMpXHJcbiAgTm90ZTogdGhpcyBjb2RlIGlzIHZlcnkgc2ltaWxhciB0byB1dGlscy53ZWVrbHlDaGVja0FuZFByZWZldGNoXHJcbioqL1xyXG5mdW5jdGlvbiBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaChtb250aGx5LCBjdXJyZW50RGF0ZXNSYW5nZSkge1xyXG4gIC8vIFdlIGdldCB0aGUgbmV4dCBtb250aCBkYXRlcy1yYW5nZSwgYnV0XHJcbiAgLy8gdXNpbmcgYXMgYmFzZS1kYXRlIGEgZGF0ZSBpbnNpZGUgY3VycmVudCBkaXNwbGF5ZWQgbW9udGgsIHRoYXQgbW9zdCB0aW1lcyBpc1xyXG4gIC8vIG5vdCB0aGUgbW9udGggb2YgdGhlIHN0YXJ0IGRhdGUgaW4gY3VycmVudCBkYXRlLCB0aGVuIGp1c3QgZm9yd2FyZCA3IGRheXMgdGhhdFxyXG4gIC8vIHRvIGVuc3VyZSB3ZSBwaWNrIHRoZSBjb3JyZWN0IG1vbnRoOlxyXG4gIHZhciBuZXh0RGF0ZXNSYW5nZSA9IHV0aWxzLmRhdGUubmV4dE1vbnRoV2Vla3ModXRpbHMuZGF0ZS5hZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLnN0YXJ0LCA3KSwgMSwgbW9udGhseS5zaG93U2l4V2Vla3MpO1xyXG4gIC8vIEFzIHdlIGxvYWQgZnVsbCB3ZWVrcywgbW9zdCB0aW1lcyB0aGUgZmlyc3Qgd2VlayBvZiBhIG1vbnRoIGlzIGFscmVhZHkgbG9hZGVkIGJlY2F1c2UgXHJcbiAgLy8gdGhlIHdlZWsgaXMgc2hhcmVkIHdpdGggdGhlIHByZXZpb3VzIG1vbnRoLCB0aGVuIGp1c3QgY2hlY2sgaWYgdGhlIHN0YXJ0IG9mIHRoZSBuZXdcclxuICAvLyByYW5nZSBpcyBhbHJlYWR5IGluIGNhY2hlIGFuZCBzaHJpbmsgdGhlIHJhbmdlIHRvIGJlIHJlcXVlc3RlZCwgYXZvaWRpbmcgY29uZmxpY3Qgb25cclxuICAvLyBsb2FkaW5nIHRoZSB1ZHBhdGVkIGRhdGEgKGlmIHRoYXQgd2VlayB3YXMgYmVpbmcgZWRpdGVkKSBhbmQgZmFzdGVyIHJlcXVlc3QgbG9hZCBzaW5jZVxyXG4gIC8vIHRoZSBzZXJ2ZXIgbmVlZHMgdG8gZG8gbGVzcyBjb21wdXRhdGlvbjpcclxuICB2YXIgZCA9IG5leHREYXRlc1JhbmdlLnN0YXJ0LFxyXG4gICAgc3RyZW5kID0gZGF0ZUlTTy5kYXRlTG9jYWwobmV4dERhdGVzUmFuZ2UuZW5kKSxcclxuICAgIHN0cmQgPSBkYXRlSVNPLmRhdGVMb2NhbChkLCB0cnVlKTtcclxuICBpZiAobW9udGhseS5kYXRhICYmIG1vbnRobHkuZGF0YS5zbG90cylcclxuICB3aGlsZSAobW9udGhseS5kYXRhLnNsb3RzW3N0cmRdICYmXHJcbiAgICBzdHJkIDw9IHN0cmVuZCkge1xyXG4gICAgbmV4dERhdGVzUmFuZ2Uuc3RhcnQgPSBkID0gdXRpbHMuZGF0ZS5hZGREYXlzKGQsIDEpO1xyXG4gICAgc3RyZCA9IGRhdGVJU08uZGF0ZUxvY2FsKGQsIHRydWUpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCF1dGlscy5tb250aGx5SXNEYXRhSW5DYWNoZShtb250aGx5LCBuZXh0RGF0ZXNSYW5nZSkpIHtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgd2VlayBpbiBhZHZhbmNlXHJcbiAgICB2YXIgcHJlZmV0Y2hRdWVyeSA9IHV0aWxzLmRhdGVzVG9RdWVyeShuZXh0RGF0ZXNSYW5nZSk7XHJcbiAgICBtb250aGx5LmZldGNoRGF0YShwcmVmZXRjaFF1ZXJ5LCBudWxsLCB0cnVlKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG5Nb3ZlIHRoZSBiaW5kZWQgZGF0ZXMgdGhlIGFtb3VudCBvZiBAbW9udGhzIHNwZWNpZmllZC5cclxuTm90ZTogbW9zdCBvZiB0aGlzIGNvZGUgaXMgYWRhcHRlZCBmcm9tIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXMsXHJcbnRoZSBjb21wbGV4aXR5IGNvbWVzIGZyb20gdGhlIHByZWZldGNoIGZlYXR1cmUsIG1heWJlIGNhbiBiZSB0aGF0IGxvZ2ljXHJcbmlzb2xhdGVkIGFuZCBzaGFyZWQ/XHJcbioqL1xyXG5mdW5jdGlvbiBtb3ZlQmluZE1vbnRoKG1vbnRobHksIG1vbnRocykge1xyXG4gIC8vIFdlIGdldCB0aGUgbmV4dCAnbW9udGhzJyAobmVnYXRpdmUgZm9yIHByZXZpb3VzKSBkYXRlcy1yYW5nZSwgYnV0XHJcbiAgLy8gdXNpbmcgYXMgYmFzZS1kYXRlIGEgZGF0ZSBpbnNpZGUgY3VycmVudCBkaXNwbGF5ZWQgbW9udGgsIHRoYXQgbW9zdCB0aW1lcyBpc1xyXG4gIC8vIG5vdCB0aGUgbW9udGggb2YgdGhlIHN0YXJ0IGRhdGUgaW4gY3VycmVudCBkYXRlLCB0aGVuIGp1c3QgZm9yd2FyZCA3IGRheXMgdGhhdFxyXG4gIC8vIHRvIGVuc3VyZSB3ZSBwaWNrIHRoZSBjb3JyZWN0IG1vbnRoOlxyXG4gIHZhciBkYXRlc1JhbmdlID0gdXRpbHMuZGF0ZS5uZXh0TW9udGhXZWVrcyh1dGlscy5kYXRlLmFkZERheXMobW9udGhseS5kYXRlc1JhbmdlLnN0YXJ0LCA3KSwgbW9udGhzLCBtb250aGx5LnNob3dTaXhXZWVrcyk7XHJcblxyXG4gIC8vIENoZWNrIGNhY2hlIGJlZm9yZSB0cnkgdG8gZmV0Y2hcclxuICB2YXIgaW5DYWNoZSA9IHV0aWxzLm1vbnRobHlJc0RhdGFJbkNhY2hlKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG5cclxuICBpZiAoaW5DYWNoZSkge1xyXG4gICAgLy8gSnVzdCBzaG93IHRoZSBkYXRhXHJcbiAgICBtb250aGx5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgLy8gUHJlZmV0Y2ggZXhjZXB0IGlmIHRoZXJlIGlzIG90aGVyIHJlcXVlc3QgaW4gY291cnNlIChjYW4gYmUgdGhlIHNhbWUgcHJlZmV0Y2gsXHJcbiAgICAvLyBidXQgc3RpbGwgZG9uJ3Qgb3ZlcmxvYWQgdGhlIHNlcnZlcilcclxuICAgIGlmIChtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggPT09IDApXHJcbiAgICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBmb3IgcHJlZmV0Y2hpbmc6XHJcbiAgICAvLyBJdHMgYXZvaWRlZCBpZiB0aGVyZSBhcmUgcmVxdWVzdHMgaW4gY291cnNlLCBzaW5jZVxyXG4gICAgLy8gdGhhdCB3aWxsIGJlIGEgcHJlZmV0Y2ggZm9yIHRoZSBzYW1lIGRhdGEuXHJcbiAgICBpZiAobW9udGhseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSB7XHJcbiAgICAgIC8vIFRoZSBsYXN0IHJlcXVlc3QgaW4gdGhlIHBvb2wgKm11c3QqIGJlIHRoZSBsYXN0IGluIGZpbmlzaFxyXG4gICAgICAvLyAobXVzdCBiZSBvbmx5IG9uZSBpZiBhbGwgZ29lcyBmaW5lKTpcclxuICAgICAgdmFyIHJlcXVlc3QgPSBtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0c1ttb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgIC8vIFdhaXQgZm9yIHRoZSBmZXRjaCB0byBwZXJmb3JtIGFuZCBzZXRzIGxvYWRpbmcgdG8gbm90aWZ5IHVzZXJcclxuICAgICAgbW9udGhseS4kZWwuYWRkQ2xhc3MobW9udGhseS5jbGFzc2VzLmZldGNoaW5nKTtcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBtb3ZlQmluZE1vbnRoKG1vbnRobHksIG1vbnRocyk7XHJcbiAgICAgICAgbW9udGhseS4kZWwucmVtb3ZlQ2xhc3MobW9udGhseS5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmV0Y2ggKGRvd25sb2FkKSB0aGUgZGF0YSBhbmQgc2hvdyBvbiByZWFkeTpcclxuICAgIG1vbnRobHlcclxuICAgIC5mZXRjaERhdGEodXRpbHMuZGF0ZXNUb1F1ZXJ5KGRhdGVzUmFuZ2UpKVxyXG4gICAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICBtb250aGx5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgICAvLyBQcmVmZXRjaFxyXG4gICAgICBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaChtb250aGx5LCBkYXRlc1JhbmdlKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbk1hcmsgY2FsZW5kYXIgYXMgY3VycmVudC1tb250aCBhbmQgZGlzYWJsZSBwcmV2IGJ1dHRvbixcclxub3IgcmVtb3ZlIHRoZSBtYXJrIGFuZCBlbmFibGUgaXQgaWYgaXMgbm90LlxyXG5cclxuVXBkYXRlcyB0aGUgbW9udGggbGFiZWwgdG9vIGFuZCB0b2RheSBidXR0b25cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrQ3VycmVudE1vbnRoKCRlbCwgc3RhcnREYXRlLCBtb250aGx5KSB7XHJcbiAgLy8gRW5zdXJlIHRoZSBkYXRlIHRvIGJlIGZyb20gY3VycmVudCBtb250aCBhbmQgbm90IG9uZSBvZiB0aGUgbGF0ZXN0IGRhdGVzXHJcbiAgLy8gb2YgdGhlIHByZXZpb3VzIG9uZSAod2hlcmUgdGhlIHJhbmdlIHN0YXJ0KSBhZGRpbmcgNyBkYXlzIGZvciB0aGUgY2hlY2s6XHJcbiAgdmFyIG1vbnRoRGF0ZSA9IHV0aWxzLmRhdGUuYWRkRGF5cyhzdGFydERhdGUsIDcpO1xyXG4gIHZhciB5ZXAgPSB1dGlscy5kYXRlLmlzSW5DdXJyZW50TW9udGgobW9udGhEYXRlKTtcclxuICAkZWwudG9nZ2xlQ2xhc3MobW9udGhseS5jbGFzc2VzLmN1cnJlbnRXZWVrLCB5ZXApO1xyXG4gICRlbC5maW5kKCcuJyArIG1vbnRobHkuY2xhc3Nlcy5wcmV2QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcblxyXG4gIC8vIE1vbnRoIC0gWWVhclxyXG4gIHZhciBtbGJsID0gbW9udGhseS50ZXh0cy5tb250aHNbbW9udGhEYXRlLmdldE1vbnRoKCldICsgJyAnICsgbW9udGhEYXRlLmdldEZ1bGxZZWFyKCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLm1vbnRoTGFiZWwpLnRleHQobWxibCk7XHJcbiAgJGVsLmZpbmQoJy4nICsgbW9udGhseS5jbGFzc2VzLnRvZGF5QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gIFVwZGF0ZSB0aGUgY2FsZW5kYXIgZGF0ZXMgY2VsbHMgZm9yICdkYXkgb2YgdGhlIG1vbnRoJyB2YWx1ZXNcclxuICBhbmQgbnVtYmVyIG9mIHdlZWtzL3Jvd3MuXHJcbiAgQGRhdGVzUmFuZ2UgeyBzdGFydCwgZW5kIH1cclxuICBAc2xvdHNDb250YWluZXIgalF1ZXJ5LURPTSBmb3IgZGF0ZXMtY2VsbHMgdGJvZHlcclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIG9mZk1vbnRoRGF0ZUNsYXNzLCBjdXJyZW50RGF0ZUNsYXNzLCBzbG90RGF0ZUxhYmVsLCBzaG93U2l4V2Vla3MpIHtcclxuICB2YXIgbGFzdFksXHJcbiAgICBjdXJyZW50TW9udGggPSB1dGlscy5kYXRlLmFkZERheXMoZGF0ZXNSYW5nZS5zdGFydCwgNykuZ2V0TW9udGgoKSxcclxuICAgIHRvZGF5ID0gZGF0ZUlTTy5kYXRlTG9jYWwobmV3IERhdGUoKSk7XHJcblxyXG4gIGl0ZXJhdGVEYXRlc0NlbGxzKGRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCBmdW5jdGlvbiAoZGF0ZSwgeCwgeSkge1xyXG4gICAgbGFzdFkgPSB5O1xyXG4gICAgdGhpcy5maW5kKCcuJyArIHNsb3REYXRlTGFiZWwpLnRleHQoZGF0ZS5nZXREYXRlKCkpO1xyXG5cclxuICAgIC8vIE1hcmsgZGF5cyBub3QgaW4gdGhpcyBtb250aFxyXG4gICAgdGhpcy50b2dnbGVDbGFzcyhvZmZNb250aERhdGVDbGFzcywgZGF0ZS5nZXRNb250aCgpICE9IGN1cnJlbnRNb250aCk7XHJcblxyXG4gICAgLy8gTWFyayB0b2RheVxyXG4gICAgdGhpcy50b2dnbGVDbGFzcyhjdXJyZW50RGF0ZUNsYXNzLCBkYXRlSVNPLmRhdGVMb2NhbChkYXRlKSA9PSB0b2RheSk7XHJcbiAgfSk7XHJcblxyXG4gIGlmICghc2hvd1NpeFdlZWtzKSB7XHJcbiAgICAvLyBTb21lIG1vbnRocyBhcmUgNSB3ZWVrcyB3aWRlIGFuZCBvdGhlcnMgNjsgb3VyIGxheW91dCBoYXMgcGVybWFuZW50IDYgcm93cy93ZWVrc1xyXG4gICAgLy8gYW5kIHdlIGRvbid0IGxvb2sgdXAgdGhlIDZ0aCB3ZWVrIGlmIGlzIG5vdCBwYXJ0IG9mIHRoZSBtb250aCB0aGVuIHRoYXQgNnRoIHJvd1xyXG4gICAgLy8gbXVzdCBiZSBoaWRkZW4gaWYgdGhlcmUgYXJlIG9ubHkgNS5cclxuICAgIC8vIElmIHRoZSBsYXN0IHJvdyB3YXMgdGhlIDUgKGluZGV4IDQsIHplcm8tYmFzZWQpLCB0aGUgNnRoIGlzIGhpZGRlbjpcclxuICAgIHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCd0cjplcSg1KScpLnh0b2dnbGUobGFzdFkgIT0gNCwgeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogMCB9KTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gIEl0IGV4ZWN1dGVzIHRoZSBnaXZlbiBjYWxsYmFjayAoQGVhY2hDZWxsQ2FsbGJhY2spIGZvciBcclxuICBlYWNoIGNlbGwgKHRoaXMgaW5zaWRlIHRoZSBjYWxsYmFjaykgaXRlcmF0ZWQgYmV0d2VlbiB0aGUgQGRhdGVzUmFuZ2VcclxuICBpbnNpZGUgdGhlIEBzbG90c0NvbnRhaW5lciAoYSB0Ym9keSBvciB0YWJsZSB3aXRoIHRyLXRkIGRhdGUgY2VsbHMpXHJcbioqL1xyXG5mdW5jdGlvbiBpdGVyYXRlRGF0ZXNDZWxscyhkYXRlc1JhbmdlLCBzbG90c0NvbnRhaW5lciwgZWFjaENlbGxDYWxsYmFjaykge1xyXG4gIHZhciB4LCB5LCBkYXRlQ2VsbDtcclxuICAvLyBJdGVyYXRlIGRhdGVzXHJcbiAgdXRpbHMuZGF0ZS5lYWNoRGF0ZUluUmFuZ2UoZGF0ZXNSYW5nZS5zdGFydCwgZGF0ZXNSYW5nZS5lbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICAvLyBkYXRlcyBhcmUgc29ydGVkIGFzIDcgcGVyIHJvdyAoZWFjaCB3ZWVrLWRheSksXHJcbiAgICAvLyBidXQgcmVtZW1iZXIgdGhhdCBkYXktY2VsbCBwb3NpdGlvbiBpcyBvZmZzZXQgMSBiZWNhdXNlXHJcbiAgICAvLyBlYWNoIHJvdyBpcyA4IGNlbGxzIChmaXJzdCBpcyBoZWFkZXIgYW5kIHJlc3QgNyBhcmUgdGhlIGRhdGEtY2VsbHMgZm9yIGRhdGVzKVxyXG4gICAgLy8ganVzdCBsb29raW5nIG9ubHkgJ3RkJ3Mgd2UgY2FuIHVzZSB0aGUgcG9zaXRpb24gd2l0aG91dCBvZmZzZXRcclxuICAgIHggPSAoaSAlIDcpO1xyXG4gICAgeSA9IE1hdGguZmxvb3IoaSAvIDcpO1xyXG4gICAgZGF0ZUNlbGwgPSBzbG90c0NvbnRhaW5lci5jaGlsZHJlbigndHI6ZXEoJyArIHkgKyAnKScpLmNoaWxkcmVuKCd0ZDplcSgnICsgeCArICcpJyk7XHJcblxyXG4gICAgZWFjaENlbGxDYWxsYmFjay5hcHBseShkYXRlQ2VsbCwgW2RhdGUsIHgsIHksIGldKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAgVG9nZ2xlIGEgc2VsZWN0ZWQgZGF0ZS1jZWxsIGF2YWlsYWJpbGl0eSxcclxuICBmb3IgdGhlICdlZGl0YWJsZScgbW9kZVxyXG4qKi9cclxuZnVuY3Rpb24gdG9nZ2xlRGF0ZUF2YWlsYWJpbGl0eShtb250aGx5LCBjZWxsKSB7XHJcbiAgLy8gSWYgdGhlcmUgaXMgbm8gZGF0YSwganVzdCByZXR1cm4gKGRhdGEgbm90IGxvYWRlZClcclxuICBpZiAoIW1vbnRobHkuZGF0YSB8fCAhbW9udGhseS5kYXRhLnNsb3RzKSByZXR1cm47XHJcbiAgXHJcbiAgLy8gR2V0dGluZyB0aGUgcG9zaXRpb24gb2YgdGhlIGNlbGwgaW4gdGhlIG1hdHJpeCBmb3IgZGF0ZS1zbG90czpcclxuICB2YXIgdHIgPSBjZWxsLmNsb3Nlc3QoJ3RyJyksXHJcbiAgICB4ID0gdHIuZmluZCgndGQnKS5pbmRleChjZWxsKSxcclxuICAgIHkgPSB0ci5jbG9zZXN0KCd0Ym9keScpLmZpbmQoJ3RyJykuaW5kZXgodHIpLFxyXG4gICAgZGF5c09mZnNldCA9IHkgKiA3ICsgeDtcclxuXHJcbiAgLy8gR2V0dGluZyB0aGUgZGF0ZSBmb3IgdGhlIGNlbGwgYmFzZWQgb24gdGhlIHNob3dlZCBmaXJzdCBkYXRlXHJcbiAgdmFyIGRhdGUgPSBtb250aGx5LmRhdGVzUmFuZ2Uuc3RhcnQ7XHJcbiAgZGF0ZSA9IHV0aWxzLmRhdGUuYWRkRGF5cyhkYXRlLCBkYXlzT2Zmc2V0KTtcclxuICB2YXIgc3RyRGF0ZSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG5cclxuICAvLyBHZXQgYW5kIHVwZGF0ZSBmcm9tIHRoZSB1bmRlcmxheWluZyBkYXRhLCBcclxuICAvLyB0aGUgc3RhdHVzIGZvciB0aGUgZGF0ZSwgdG9nZ2xpbmcgaXQ6XHJcbiAgdmFyIHNsb3QgPSBtb250aGx5LmRhdGEuc2xvdHNbc3RyRGF0ZV07XHJcbiAgLy8gSWYgdGhlcmUgaXMgbm8gc2xvdCwganVzdCByZXR1cm4gKGRhdGEgbm90IGxvYWRlZClcclxuICBpZiAoIXNsb3QpIHJldHVybjtcclxuICBzbG90LnN0YXR1cyA9IHNsb3Quc3RhdHVzID09ICd1bmF2YWlsYWJsZScgPyAnYXZhaWxhYmxlJyA6ICd1bmF2YWlsYWJsZSc7XHJcbiAgc2xvdC5zb3VyY2UgPSAndXNlcic7XHJcbiAgbW9udGhseS5ib29raW5nc05vdGlmaWNhdGlvbi5yZWdpc3RlcihzbG90LnN0YXR1cyA9PSAndW5hdmFpbGFibGUnLCBtb250aGx5LmRhdGEsIHN0ckRhdGUpO1xyXG4gIG1vbnRobHkuZXZlbnRzLmVtaXQoZXZlbnRzLmRhdGFDaGFuZ2VkLCBjZWxsLCBzbG90KTtcclxuXHJcbiAgLy8gVXBkYXRlIHZpc3VhbGl6YXRpb246XHJcbiAgbW9udGhseS5iaW5kRGF0YSgpO1xyXG59XHJcblxyXG4vKipcclxuTW9udGx5IGNhbGVuZGFyLCBpbmhlcml0cyBmcm9tIExjV2lkZ2V0XHJcbioqL1xyXG52YXIgTW9udGhseSA9IExjV2lkZ2V0LmV4dGVuZChcclxuLy8gUHJvdG90eXBlXHJcbntcclxuY2xhc3NlczogZXh0ZW5kKHt9LCB1dGlscy53ZWVrbHlDbGFzc2VzLCB7XHJcbiAgd2Vla2x5Q2FsZW5kYXI6IHVuZGVmaW5lZCxcclxuICBjdXJyZW50V2VlazogdW5kZWZpbmVkLFxyXG4gIGN1cnJlbnRNb250aDogJ2lzLWN1cnJlbnRNb250aCcsXHJcbiAgbW9udGhseUNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItLW1vbnRobHknLFxyXG4gIHRvZGF5QWN0aW9uOiAnQWN0aW9ucy10b2RheScsXHJcbiAgbW9udGhMYWJlbDogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLW1vbnRoTGFiZWwnLFxyXG4gIHNsb3REYXRlTGFiZWw6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1zbG90RGF0ZUxhYmVsJyxcclxuICBvZmZNb250aERhdGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1vZmZNb250aERhdGUnLFxyXG4gIGN1cnJlbnREYXRlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItY3VycmVudERhdGUnLFxyXG4gIGVkaXRhYmxlOiAnaXMtZWRpdGFibGUnLFxyXG4gIGJvb2tpbmdzTm90aWZpY2F0aW9uOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItYm9va2luZ3NOb3RpZmljYXRpb24nXHJcbn0pLFxyXG50ZXh0czogZXh0ZW5kKHt9LCB1dGlscy53ZWVrbHlUZXh0cywge1xyXG4gIG1vbnRoczogWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLCAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ11cclxufSksXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcbnNob3dTaXhXZWVrczogdHJ1ZSxcclxuZWRpdGFibGU6IGZhbHNlLFxyXG5cclxuLy8gT3VyICd2aWV3JyB3aWxsIGJlIGEgc3Vic2V0IG9mIHRoZSBkYXRhLFxyXG4vLyBkZWxpbWl0ZWQgYnkgdGhlIG5leHQgcHJvcGVydHksIGEgZGF0ZXMgcmFuZ2U6XHJcbmRhdGVzUmFuZ2U6IHsgc3RhcnQ6IG51bGwsIGVuZDogbnVsbCB9LFxyXG5iaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGFNb250aGx5KGRhdGVzUmFuZ2UpIHtcclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLnNsb3RzKSByZXR1cm47XHJcblxyXG4gIHRoaXMuZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlIHx8IHRoaXMuZGF0ZXNSYW5nZTtcclxuICB2YXIgXHJcbiAgICAgIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpLFxyXG4gICAgICBzbG90cyA9IHNsb3RzQ29udGFpbmVyLmZpbmQoJ3RkJyk7XHJcblxyXG4gIGNoZWNrQ3VycmVudE1vbnRoKHRoaXMuJGVsLCBkYXRlc1JhbmdlLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgdXBkYXRlRGF0ZXNDZWxscyh0aGlzLmRhdGVzUmFuZ2UsIHNsb3RzQ29udGFpbmVyLCB0aGlzLmNsYXNzZXMub2ZmTW9udGhEYXRlLCB0aGlzLmNsYXNzZXMuY3VycmVudERhdGUsIHRoaXMuY2xhc3Nlcy5zbG90RGF0ZUxhYmVsLCB0aGlzLnNob3dTaXhXZWVrcyk7XHJcblxyXG4gIC8vIFJlbW92ZSBhbnkgcHJldmlvdXMgc3RhdHVzIGNsYXNzIGZyb20gYWxsIHNsb3RzXHJcbiAgZm9yICh2YXIgcyA9IDA7IHMgPCB1dGlscy5zdGF0dXNUeXBlcy5sZW5ndGg7IHMrKykge1xyXG4gICAgc2xvdHMucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB1dGlscy5zdGF0dXNUeXBlc1tzXSB8fCAnXycpO1xyXG4gIH1cclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAvLyBTZXQgYXZhaWxhYmlsaXR5IG9mIGVhY2ggZGF0ZSBzbG90L2NlbGw6XHJcbiAgaXRlcmF0ZURhdGVzQ2VsbHMoZGF0ZXNSYW5nZSwgc2xvdHNDb250YWluZXIsIGZ1bmN0aW9uIChkYXRlLCB4LCB5LCBpKSB7XHJcbiAgICB2YXIgZGF0ZWtleSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG4gICAgdmFyIHNsb3QgPSB0aGF0LmRhdGEuc2xvdHNbZGF0ZWtleV07XHJcbiAgICAvLyBTdXBwb3J0IGZvciBzaW1wbGUgYW5kIGRldGFpbGVkIHN0YXR1cyBkZXNjcmlwdGlvbjpcclxuICAgIHZhciBkYXRlU3RhdHVzID0gJC5pc1BsYWluT2JqZWN0KHNsb3QpID8gc2xvdC5zdGF0dXMgOiBzbG90O1xyXG4gICAgLy8gRGVmYXVsdCB2YWx1ZSBmcm9tIGRhdGE6XHJcbiAgICBkYXRlU3RhdHVzID0gZGF0ZVN0YXR1cyB8fCB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cyB8fCAndW5rbm93JztcclxuXHJcbiAgICBpZiAoZGF0ZVN0YXR1cylcclxuICAgICAgdGhpcy5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIGRhdGVTdGF0dXMpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBOb3RpZmljYXRpb25zOlxyXG4gIHRoaXMuYm9va2luZ3NOb3RpZmljYXRpb24ucmVuZGVyKCk7XHJcbn0sXHJcbmdldFVwZGF0ZWREYXRhOiBmdW5jdGlvbiBnZXRVcGRhdGVkRGF0YSgpIHtcclxuICB2YXIgZCA9IHt9O1xyXG4gIGlmICh0aGlzLmVkaXRhYmxlKSB7XHJcbiAgICAvLyBDb3B5IGRhdGEsIHdlIGRvbid0IHdhbnQgY2hhbmdlIHRoZSBvcmlnaW5hbDpcclxuICAgIGV4dGVuZChkLCB0aGlzLmRhdGEpO1xyXG5cclxuICAgIC8vIEZpbHRlciBzbG90cyB0byBnZXQgb25seSB0aGF0IHVwZGF0ZWQgYnkgZGUgdXNlcjpcclxuICAgIGQuc2xvdHMgPSBvYmplY3RVdGlscy5maWx0ZXJQcm9wZXJ0aWVzKGQuc2xvdHMsIGZ1bmN0aW9uIChrLCB2KSB7XHJcbiAgICAgIHJldHVybiB2LnNvdXJjZSA9PSAndXNlcic7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIE1vbnRobHkoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIC8vIFJldXNpbmcgYmFzZSBjb25zdHJ1Y3RvciB0b28gZm9yIGluaXRpYWxpemluZzpcclxuICBMY1dpZGdldC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIC8vIFRvIHVzZSB0aGlzIGluIGNsb3N1cmVzOlxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgLy8gSW5pdGlhbGl6aW5nIHNvbWUgZGF0YSwgYmVpbmcgY2FyZSBvZiBhbnkgdmFsdWVcclxuICAvLyB0aGF0IGNvbWVzIGZyb20gbWVyZ2luZyBvcHRpb25zIGludG8gJ3RoaXMnXHJcbiAgdGhpcy51c2VyID0gdGhpcy51c2VyIHx8IHRoaXMuJGVsLmRhdGEoJ2NhbGVuZGFyLXVzZXInKTtcclxuICB0aGlzLnF1ZXJ5ID0gZXh0ZW5kKHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICdtb250aGx5LXNjaGVkdWxlJ1xyXG4gIH0sIHRoaXMucXVlcnkpO1xyXG5cclxuICAvLyBJZiBpcyBub3Qgc2V0IGJ5IGNvbnN0cnVjdG9yIG9wdGlvbnMsIGdldCBcclxuICAvLyAnZWRpdGFibGUnIGZyb20gZGF0YSwgb3IgbGVmdCBkZWZhdWx0OlxyXG4gIGlmICghKG9wdGlvbnMgJiYgdHlwZW9mIChvcHRpb25zLmVkaXRhYmxlKSAhPSAndW5kZWZpbmVkJykgJiZcclxuICAgIHR5cGVvZiAodGhpcy4kZWwuZGF0YSgnZWRpdGFibGUnKSkgIT0gJ3VuZGVmaW5lZCcpXHJcbiAgICB0aGlzLmVkaXRhYmxlID0gISF0aGlzLiRlbC5kYXRhKCdlZGl0YWJsZScpO1xyXG5cclxuXHJcbiAgLy8gU2V0IGhhbmRsZXJzIGZvciBwcmV2LW5leHQgYWN0aW9uczpcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMucHJldkFjdGlvbiwgZnVuY3Rpb24gcHJldigpIHtcclxuICAgIG1vdmVCaW5kTW9udGgodGhhdCwgLTEpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5uZXh0QWN0aW9uLCBmdW5jdGlvbiBuZXh0KCkge1xyXG4gICAgbW92ZUJpbmRNb250aCh0aGF0LCAxKTtcclxuICB9KTtcclxuICAvLyBIYW5kbGVyIGZvciB0b2RheSBhY3Rpb25cclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMudG9kYXlBY3Rpb24sIGZ1bmN0aW9uIHRvZGF5KCkge1xyXG4gICAgdGhhdC5iaW5kRGF0YSh1dGlscy5kYXRlLmN1cnJlbnRNb250aFdlZWtzKG51bGwsIHRoaXMuc2hvd1NpeFdlZWtzKSk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIEVkaXRhYmxlIG1vZGVcclxuICBpZiAodGhpcy5lZGl0YWJsZSkge1xyXG4gICAgdGhpcy5xdWVyeS5lZGl0YWJsZSA9IHRydWU7XHJcbiAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMgKyAnIHRkJywgZnVuY3Rpb24gY2xpY2tUb2dnbGVBdmFpbGFiaWxpdHkoKSB7XHJcbiAgICAgIHRvZ2dsZURhdGVBdmFpbGFiaWxpdHkodGhhdCwgJCh0aGlzKSk7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuJGVsLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5lZGl0YWJsZSk7XHJcbiAgfVxyXG5cclxuICAvLyBDcmVhdGluZyB0aGUgYm9va2luZ3NOb3RpZmljYXRpb24gZWxlbWVudCwgYm90aCBlZGl0YWJsZSBhbmQgcmVhZC1vbmx5IG1vZGVzLlxyXG4gIC8vIFJlYWQtb25seSBtb2RlIG5lZWQgaGlkZGVuIHRoZSBlbGVtZW50IGFuZCB0aGF0cyBkb25lIG9uIGNvbnN0cnVjdG9yIGFuZCBlZGl0YWJsZVxyXG4gIC8vIHdpbGwgcmVuZGVyIGl0IG9uIGJpbmREYXRhXHJcbiAgdGhpcy5ib29raW5nc05vdGlmaWNhdGlvbiA9IG5ldyBCb29raW5nc05vdGlmaWNhdGlvbih0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5ib29raW5nc05vdGlmaWNhdGlvbikpO1xyXG5cclxuICAvLyBTdGFydCBmZXRjaGluZyBjdXJyZW50IG1vbnRoXHJcbiAgdmFyIGZpcnN0RGF0ZXMgPSB1dGlscy5kYXRlLmN1cnJlbnRNb250aFdlZWtzKG51bGwsIHRoaXMuc2hvd1NpeFdlZWtzKTtcclxuICB0aGlzLmZldGNoRGF0YSh1dGlscy5kYXRlc1RvUXVlcnkoZmlyc3REYXRlcykpLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC5iaW5kRGF0YShmaXJzdERhdGVzKTtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgbW9udGggaW4gYWR2YW5jZVxyXG4gICAgbW9udGhseUNoZWNrQW5kUHJlZmV0Y2godGhhdCwgZmlyc3REYXRlcyk7XHJcbiAgfSk7XHJcblxyXG4gIGNoZWNrQ3VycmVudE1vbnRoKHRoaXMuJGVsLCBmaXJzdERhdGVzLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgLy8gU2hvdyBlcnJvciBtZXNzYWdlXHJcbiAgdGhpcy5ldmVudHMub24oJ2hhc0Vycm9yQ2hhbmdlZCcsIHV0aWxzLmhhbmRsZXJDYWxlbmRhckVycm9yKTtcclxufSk7XHJcblxyXG4vKiogU3RhdGljIHV0aWxpdHk6IGZvdW5kIGFsbCBjb21wb25lbnRzIHdpdGggdGhlIFdlZWtseSBjYWxlbmRhciBjbGFzc1xyXG5hbmQgZW5hYmxlIGl0XHJcbioqL1xyXG5Nb250aGx5LmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgTW9udGhseS5wcm90b3R5cGUuY2xhc3Nlcy5tb250aGx5Q2FsZW5kYXIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgbGlzdC5wdXNoKG5ldyBNb250aGx5KHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9udGhseTtcclxuIiwiLyoqXHJcbiAgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpLFxyXG4gIExjV2lkZ2V0ID0gcmVxdWlyZSgnLi4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuLi9DWC9leHRlbmQnKTtcclxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xyXG5cclxuLyoqXHJcbldlZWtseSBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIFdlZWtseSA9IExjV2lkZ2V0LmV4dGVuZChcclxuLy8gUHJvdG90eXBlXHJcbntcclxuY2xhc3NlczogdXRpbHMud2Vla2x5Q2xhc3NlcyxcclxudGV4dHM6IHV0aWxzLndlZWtseVRleHRzLFxyXG51cmw6ICcvY2FsZW5kYXIvZ2V0LWF2YWlsYWJpbGl0eS8nLFxyXG5cclxuLy8gT3VyICd2aWV3JyB3aWxsIGJlIGEgc3Vic2V0IG9mIHRoZSBkYXRhLFxyXG4vLyBkZWxpbWl0ZWQgYnkgdGhlIG5leHQgcHJvcGVydHksIGEgZGF0ZXMgcmFuZ2U6XHJcbmRhdGVzUmFuZ2U6IHsgc3RhcnQ6IG51bGwsIGVuZDogbnVsbCB9LFxyXG5iaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGFXZWVrbHkoZGF0ZXNSYW5nZSkge1xyXG4gIGlmICghdGhpcy5kYXRhIHx8ICF0aGlzLmRhdGEuc2xvdHMpIHJldHVybjtcclxuXHJcbiAgdGhpcy5kYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgfHwgdGhpcy5kYXRlc1JhbmdlO1xyXG4gIHZhciBcclxuICAgICAgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyksXHJcbiAgICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgdXRpbHMuY2hlY2tDdXJyZW50V2Vlayh0aGlzLiRlbCwgZGF0ZXNSYW5nZS5zdGFydCwgdGhpcyk7XHJcblxyXG4gIHV0aWxzLnVwZGF0ZUxhYmVscyhkYXRlc1JhbmdlLCB0aGlzLiRlbCwgdGhpcyk7XHJcblxyXG4gIC8vIFJlbW92ZSBhbnkgcHJldmlvdXMgc3RhdHVzIGNsYXNzIGZyb20gYWxsIHNsb3RzXHJcbiAgZm9yICh2YXIgcyA9IDA7IHMgPCB1dGlscy5zdGF0dXNUeXBlcy5sZW5ndGg7IHMrKykge1xyXG4gICAgc2xvdHMucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB1dGlscy5zdGF0dXNUeXBlc1tzXSB8fCAnXycpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5kZWZhdWx0U3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICAvLyBTZXQgYWxsIHNsb3RzIHdpdGggZGVmYXVsdCBzdGF0dXNcclxuICBzbG90cy5hZGRDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoaXMuZGF0YS5kZWZhdWx0U3RhdHVzKTtcclxuXHJcbiAgaWYgKCF0aGlzLmRhdGEuc2xvdHMgfHwgIXRoaXMuZGF0YS5zdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdXRpbHMuZGF0ZS5lYWNoRGF0ZUluUmFuZ2UoZGF0ZXNSYW5nZS5zdGFydCwgZGF0ZXNSYW5nZS5lbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICB2YXIgZGF0ZWtleSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG4gICAgdmFyIGRhdGVTbG90cyA9IHRoYXQuZGF0YS5zbG90c1tkYXRla2V5XTtcclxuICAgIGlmIChkYXRlU2xvdHMpIHtcclxuICAgICAgZm9yIChzID0gMDsgcyA8IGRhdGVTbG90cy5sZW5ndGg7IHMrKykge1xyXG4gICAgICAgIHZhciBzbG90ID0gZGF0ZVNsb3RzW3NdO1xyXG4gICAgICAgIHZhciBzbG90Q2VsbCA9IHV0aWxzLmZpbmRDZWxsQnlTbG90KHNsb3RzQ29udGFpbmVyLCBpLCBzbG90KTtcclxuICAgICAgICAvLyBSZW1vdmUgZGVmYXVsdCBzdGF0dXNcclxuICAgICAgICBzbG90Q2VsbC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICdfJyk7XHJcbiAgICAgICAgLy8gQWRkaW5nIHN0YXR1cyBjbGFzc1xyXG4gICAgICAgIHNsb3RDZWxsLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gV2Vla2x5KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAvLyBSZXVzaW5nIGJhc2UgY29uc3RydWN0b3IgdG9vIGZvciBpbml0aWFsaXppbmc6XHJcbiAgTGNXaWRnZXQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICAvLyBUbyB1c2UgdGhpcyBpbiBjbG9zdXJlczpcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHRoaXMudXNlciA9IHRoaXMuJGVsLmRhdGEoJ2NhbGVuZGFyLXVzZXInKTtcclxuICB0aGlzLnF1ZXJ5ID0ge1xyXG4gICAgdXNlcjogdGhpcy51c2VyLFxyXG4gICAgdHlwZTogJ3dlZWtseSdcclxuICB9O1xyXG5cclxuICAvLyBTdGFydCBmZXRjaGluZyBjdXJyZW50IHdlZWtcclxuICB2YXIgZmlyc3REYXRlcyA9IHV0aWxzLmRhdGUuY3VycmVudFdlZWsoKTtcclxuICB0aGlzLmZldGNoRGF0YSh1dGlscy5kYXRlc1RvUXVlcnkoZmlyc3REYXRlcykpLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC5iaW5kRGF0YShmaXJzdERhdGVzKTtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgd2VlayBpbiBhZHZhbmNlXHJcbiAgICB1dGlscy53ZWVrbHlDaGVja0FuZFByZWZldGNoKHRoYXQsIGZpcnN0RGF0ZXMpO1xyXG4gIH0pO1xyXG4gIHV0aWxzLmNoZWNrQ3VycmVudFdlZWsodGhpcy4kZWwsIGZpcnN0RGF0ZXMuc3RhcnQsIHRoaXMpO1xyXG5cclxuICAvLyBTZXQgaGFuZGxlcnMgZm9yIHByZXYtbmV4dCBhY3Rpb25zOlxyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5wcmV2QWN0aW9uLCBmdW5jdGlvbiBwcmV2KCkge1xyXG4gICAgdXRpbHMubW92ZUJpbmRSYW5nZUluRGF5cyh0aGF0LCAtNyk7XHJcbiAgfSk7XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLm5leHRBY3Rpb24sIGZ1bmN0aW9uIG5leHQoKSB7XHJcbiAgICB1dGlscy5tb3ZlQmluZFJhbmdlSW5EYXlzKHRoYXQsIDcpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBTaG93IGVycm9yIG1lc3NhZ2VcclxuICB0aGlzLmV2ZW50cy5vbignaGFzRXJyb3JDaGFuZ2VkJywgdXRpbHMuaGFuZGxlckNhbGVuZGFyRXJyb3IpO1xyXG5cclxufSk7XHJcblxyXG4vKiogU3RhdGljIHV0aWxpdHk6IGZvdW5kIGFsbCBjb21wb25lbnRzIHdpdGggdGhlIFdlZWtseSBjYWxlbmRhciBjbGFzc1xyXG5hbmQgZW5hYmxlIGl0XHJcbioqL1xyXG5XZWVrbHkuZW5hYmxlQWxsID0gZnVuY3Rpb24gb24ob3B0aW9ucykge1xyXG4gIHZhciBsaXN0ID0gW107XHJcbiAgJCgnLicgKyBXZWVrbHkucHJvdG90eXBlLmNsYXNzZXMud2Vla2x5Q2FsZW5kYXIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgbGlzdC5wdXNoKG5ldyBXZWVrbHkodGhpcywgb3B0aW9ucykpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBsaXN0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXZWVrbHk7XHJcbiIsIi8qKlxyXG4gIFdvcmsgSG91cnMgY2FsZW5kYXIgY2xhc3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgTGNXaWRnZXQgPSByZXF1aXJlKCcuLi9DWC9MY1dpZGdldCcpLFxyXG4gIGV4dGVuZCA9IHJlcXVpcmUoJy4uL0NYL2V4dGVuZCcpLFxyXG4gIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpLFxyXG4gIGNsZWFyQ3VycmVudFNlbGVjdGlvbiA9IHJlcXVpcmUoJy4vY2xlYXJDdXJyZW50U2VsZWN0aW9uJyksXHJcbiAgbWFrZVVuc2VsZWN0YWJsZSA9IHJlcXVpcmUoJy4vbWFrZVVuc2VsZWN0YWJsZScpO1xyXG5yZXF1aXJlKCcuLi9qcXVlcnkuYm91bmRzJyk7XHJcbnZhciBldmVudHMgPSB7XHJcbiAgICBkYXRhQ2hhbmdlZDogJ2RhdGFDaGFuZ2VkJ1xyXG59O1xyXG5cclxuLyoqXHJcbldvcmsgaG91cnMgcHJpdmF0ZSB1dGlsc1xyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBFZGl0V29ya0hvdXJzKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICAvLyBTZXQgaGFuZGxlcnMgdG8gc3dpdGNoIHN0YXR1cyBhbmQgdXBkYXRlIGJhY2tlbmQgZGF0YVxyXG4gIC8vIHdoZW4gdGhlIHVzZXIgc2VsZWN0IGNlbGxzXHJcbiAgdmFyIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpO1xyXG5cclxuICBmdW5jdGlvbiB0b2dnbGVDZWxsKGNlbGwpIHtcclxuICAgIC8vIEZpbmQgZGF5IGFuZCB0aW1lIG9mIHRoZSBjZWxsOlxyXG4gICAgdmFyIHNsb3QgPSB1dGlscy5maW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCk7XHJcbiAgICAvLyBHZXQgd2Vlay1kYXkgc2xvdHMgYXJyYXk6XHJcbiAgICB2YXIgd2tzbG90cyA9IHRoYXQuZGF0YS5zbG90c1t1dGlscy5zeXN0ZW1XZWVrRGF5c1tzbG90LmRheV1dID0gdGhhdC5kYXRhLnNsb3RzW3V0aWxzLnN5c3RlbVdlZWtEYXlzW3Nsb3QuZGF5XV0gfHwgW107XHJcbiAgICAvLyBJZiBpdCBoYXMgYWxyZWFkeSB0aGUgZGF0YS5zdGF0dXMsIHRvZ2dsZSB0byB0aGUgZGVmYXVsdFN0YXR1c1xyXG4gICAgLy8gIHZhciBzdGF0dXNDbGFzcyA9IHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyxcclxuICAgIC8vICAgICAgZGVmYXVsdFN0YXR1c0NsYXNzID0gdGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cztcclxuICAgIC8vaWYgKGNlbGwuaGFzQ2xhc3Moc3RhdHVzQ2xhc3NcclxuICAgIC8vIFRvZ2dsZSBmcm9tIHRoZSBhcnJheVxyXG4gICAgdmFyIHN0cnNsb3QgPSBkYXRlSVNPLnRpbWVMb2NhbChzbG90LnNsb3QsIHRydWUpLFxyXG4gICAgICBpc2xvdCA9IHdrc2xvdHMuaW5kZXhPZihzdHJzbG90KTtcclxuICAgIGlmIChpc2xvdCA9PSAtMSlcclxuICAgICAgd2tzbG90cy5wdXNoKHN0cnNsb3QpO1xyXG4gICAgZWxzZVxyXG4gICAgICAvL2RlbGV0ZSB3a3Nsb3RzW2lzbG90XTtcclxuICAgICAgd2tzbG90cy5zcGxpY2UoaXNsb3QsIDEpO1xyXG5cclxuICAgIHRoYXQuZXZlbnRzLmVtaXQoZXZlbnRzLmRhdGFDaGFuZ2VkLCBjZWxsLCBzbG90KTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHRvZ2dsZUNlbGxSYW5nZShmaXJzdENlbGwsIGxhc3RDZWxsKSB7XHJcbiAgICB2YXIgXHJcbiAgICAgIHggPSBmaXJzdENlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGZpcnN0Q2VsbCksXHJcbiAgICAgIHkxID0gZmlyc3RDZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKSxcclxuICAgIC8veDIgPSBsYXN0Q2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgobGFzdENlbGwpLFxyXG4gICAgICB5MiA9IGxhc3RDZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKTtcclxuXHJcbiAgICBpZiAoeTEgPiB5Mikge1xyXG4gICAgICB2YXIgeTAgPSB5MTtcclxuICAgICAgeTEgPSB5MjtcclxuICAgICAgeTIgPSB5MDtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciB5ID0geTE7IHkgPD0geTI7IHkrKykge1xyXG4gICAgICB2YXIgY2VsbCA9IGZpcnN0Q2VsbC5jbG9zZXN0KCd0Ym9keScpLmNoaWxkcmVuKCd0cjplcSgnICsgeSArICcpJykuY2hpbGRyZW4oJ3RkOmVxKCcgKyB4ICsgJyknKTtcclxuICAgICAgdG9nZ2xlQ2VsbChjZWxsKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhciBkcmFnZ2luZyA9IHtcclxuICAgIGZpcnN0OiBudWxsLFxyXG4gICAgbGFzdDogbnVsbCxcclxuICAgIHNlbGVjdGlvbkxheWVyOiAkKCc8ZGl2IGNsYXNzPVwiU2VsZWN0aW9uTGF5ZXJcIiAvPicpLmFwcGVuZFRvKHRoaXMuJGVsKSxcclxuICAgIGRvbmU6IGZhbHNlXHJcbiAgfTtcclxuICBcclxuICBmdW5jdGlvbiBvZmZzZXRUb1Bvc2l0aW9uKGVsLCBvZmZzZXQpIHtcclxuICAgIHZhciBwYiA9ICQoZWwub2Zmc2V0UGFyZW50KS5ib3VuZHMoKSxcclxuICAgICAgcyA9IHt9O1xyXG5cclxuICAgIHMudG9wID0gb2Zmc2V0LnRvcCAtIHBiLnRvcDtcclxuICAgIHMubGVmdCA9IG9mZnNldC5sZWZ0IC0gcGIubGVmdDtcclxuXHJcbiAgICAvL3MuYm90dG9tID0gcGIudG9wIC0gb2Zmc2V0LmJvdHRvbTtcclxuICAgIC8vcy5yaWdodCA9IG9mZnNldC5sZWZ0IC0gb2Zmc2V0LnJpZ2h0O1xyXG4gICAgcy5oZWlnaHQgPSBvZmZzZXQuYm90dG9tIC0gb2Zmc2V0LnRvcDtcclxuICAgIHMud2lkdGggPSBvZmZzZXQucmlnaHQgLSBvZmZzZXQubGVmdDtcclxuXHJcbiAgICAkKGVsKS5jc3Mocyk7XHJcbiAgICByZXR1cm4gcztcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVwZGF0ZVNlbGVjdGlvbihlbCkge1xyXG4gICAgdmFyIGEgPSBkcmFnZ2luZy5maXJzdC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgdmFyIGIgPSBlbC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgdmFyIHMgPSBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG5cclxuICAgIHMudG9wID0gYS50b3AgPCBiLnRvcCA/IGEudG9wIDogYi50b3A7XHJcbiAgICBzLmJvdHRvbSA9IGEuYm90dG9tID4gYi5ib3R0b20gPyBhLmJvdHRvbSA6IGIuYm90dG9tO1xyXG5cclxuICAgIG9mZnNldFRvUG9zaXRpb24oZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXJbMF0sIHMpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZmluaXNoRHJhZygpIHtcclxuICAgIGlmIChkcmFnZ2luZy5maXJzdCAmJiBkcmFnZ2luZy5sYXN0KSB7XHJcbiAgICAgIHRvZ2dsZUNlbGxSYW5nZShkcmFnZ2luZy5maXJzdCwgZHJhZ2dpbmcubGFzdCk7XHJcbiAgICAgIHRoYXQuYmluZERhdGEoKTtcclxuXHJcbiAgICAgIGRyYWdnaW5nLmRvbmUgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgZHJhZ2dpbmcuZmlyc3QgPSBkcmFnZ2luZy5sYXN0ID0gbnVsbDtcclxuICAgIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLmhpZGUoKTtcclxuICAgIG1ha2VVbnNlbGVjdGFibGUub2ZmKHRoYXQuJGVsKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgdGhpcy4kZWwuZmluZChzbG90c0NvbnRhaW5lcikub24oJ2NsaWNrJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gRG8gZXhjZXB0IGFmdGVyIGEgZHJhZ2dpbmcgZG9uZSBjb21wbGV0ZVxyXG4gICAgaWYgKGRyYWdnaW5nLmRvbmUpIHJldHVybiBmYWxzZTtcclxuICAgIHRvZ2dsZUNlbGwoJCh0aGlzKSk7XHJcbiAgICB0aGF0LmJpbmREYXRhKCk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG4gIHRoaXMuJGVsLmZpbmQoc2xvdHNDb250YWluZXIpXHJcbiAgLm9uKCdtb3VzZWRvd24nLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBkcmFnZ2luZy5kb25lID0gZmFsc2U7XHJcbiAgICBkcmFnZ2luZy5maXJzdCA9ICQodGhpcyk7XHJcbiAgICBkcmFnZ2luZy5sYXN0ID0gbnVsbDtcclxuICAgIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLnNob3coKTtcclxuXHJcbiAgICBtYWtlVW5zZWxlY3RhYmxlKHRoYXQuJGVsKTtcclxuICAgIGNsZWFyQ3VycmVudFNlbGVjdGlvbigpO1xyXG5cclxuICAgIHZhciBzID0gZHJhZ2dpbmcuZmlyc3QuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIG9mZnNldFRvUG9zaXRpb24oZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXJbMF0sIHMpO1xyXG5cclxuICB9KVxyXG4gIC5vbignbW91c2VlbnRlcicsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGlmIChkcmFnZ2luZy5maXJzdCkge1xyXG4gICAgICBkcmFnZ2luZy5sYXN0ID0gJCh0aGlzKTtcclxuXHJcbiAgICAgIHVwZGF0ZVNlbGVjdGlvbihkcmFnZ2luZy5sYXN0KTtcclxuICAgIH1cclxuICB9KVxyXG4gIC5vbignbW91c2V1cCcsIGZpbmlzaERyYWcpXHJcbiAgLmZpbmQoJ3RkJylcclxuICAuYXR0cignZHJhZ2dhYmxlJywgZmFsc2UpO1xyXG5cclxuICAvLyBUaGlzIHdpbGwgbm90IHdvcmsgd2l0aCBwb2ludGVyLWV2ZW50czpub25lLCBidXQgb24gb3RoZXJcclxuICAvLyBjYXNlcyAocmVjZW50SUUpXHJcbiAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIub24oJ21vdXNldXAnLCBmaW5pc2hEcmFnKVxyXG4gIC5hdHRyKCdkcmFnZ2FibGUnLCBmYWxzZSk7XHJcblxyXG59XHJcblxyXG4vKipcclxuV29yayBob3VycyBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIFdvcmtIb3VycyA9IExjV2lkZ2V0LmV4dGVuZChcclxuLy8gUHJvdG90eXBlXHJcbntcclxuY2xhc3NlczogZXh0ZW5kKHt9LCB1dGlscy53ZWVrbHlDbGFzc2VzLCB7XHJcbiAgd2Vla2x5Q2FsZW5kYXI6IHVuZGVmaW5lZCxcclxuICB3b3JrSG91cnNDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS13b3JrSG91cnMnXHJcbn0pLFxyXG50ZXh0czogdXRpbHMud2Vla2x5VGV4dHMsXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YVdvcmtIb3VycygpIHtcclxuICB2YXIgXHJcbiAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIGZvciAodmFyIHdrID0gMDsgd2sgPCB1dGlscy5zeXN0ZW1XZWVrRGF5cy5sZW5ndGg7IHdrKyspIHtcclxuICAgIHZhciBkYXRlU2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbdXRpbHMuc3lzdGVtV2Vla0RheXNbd2tdXTtcclxuICAgIGlmIChkYXRlU2xvdHMgJiYgZGF0ZVNsb3RzLmxlbmd0aCkge1xyXG4gICAgICBmb3IgKHMgPSAwOyBzIDwgZGF0ZVNsb3RzLmxlbmd0aDsgcysrKSB7XHJcbiAgICAgICAgdmFyIHNsb3QgPSBkYXRlU2xvdHNbc107XHJcbiAgICAgICAgdmFyIHNsb3RDZWxsID0gdXRpbHMuZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIHdrLCBzbG90KTtcclxuICAgICAgICAvLyBSZW1vdmUgZGVmYXVsdCBzdGF0dXNcclxuICAgICAgICBzbG90Q2VsbC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICdfJyk7XHJcbiAgICAgICAgLy8gQWRkaW5nIHN0YXR1cyBjbGFzc1xyXG4gICAgICAgIHNsb3RDZWxsLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIFdvcmtIb3VycyhlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgTGNXaWRnZXQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHRoaXMudXNlciA9IHRoaXMuJGVsLmRhdGEoJ2NhbGVuZGFyLXVzZXInKTtcclxuXHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICd3b3JrSG91cnMnXHJcbiAgfTtcclxuXHJcbiAgLy8gRmV0Y2ggdGhlIGRhdGE6IHRoZXJlIGlzIG5vdCBhIG1vcmUgc3BlY2lmaWMgcXVlcnksXHJcbiAgLy8gaXQganVzdCBnZXQgdGhlIGhvdXJzIGZvciBlYWNoIHdlZWstZGF5IChkYXRhXHJcbiAgLy8gc2xvdHMgYXJlIHBlciB3ZWVrLWRheSBpbnN0ZWFkIG9mIHBlciBkYXRlIGNvbXBhcmVkXHJcbiAgLy8gdG8gKndlZWtseSopXHJcbiAgdGhpcy5mZXRjaERhdGEoKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoKTtcclxuICB9KTtcclxuXHJcbiAgc2V0dXBFZGl0V29ya0hvdXJzLmNhbGwodGhpcyk7XHJcblxyXG4gIC8vIFNob3cgZXJyb3IgbWVzc2FnZVxyXG4gIHRoaXMuZXZlbnRzLm9uKCdoYXNFcnJvckNoYW5nZWQnLCB1dGlscy5oYW5kbGVyQ2FsZW5kYXJFcnJvcik7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV29ya2hvdXJzIGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldvcmtIb3Vycy5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdvcmtIb3Vycy5wcm90b3R5cGUuY2xhc3Nlcy53b3JrSG91cnNDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdvcmtIb3Vycyh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdvcmtIb3VyczsiLCIvKipcclxuQ3Jvc3MgYnJvd3NlciB3YXkgdG8gdW5zZWxlY3QgY3VycmVudCBzZWxlY3Rpb25cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY2xlYXJDdXJyZW50U2VsZWN0aW9uKCkge1xyXG4gIGlmICh0eXBlb2YgKHdpbmRvdy5nZXRTZWxlY3Rpb24pID09PSAnZnVuY3Rpb24nKVxyXG4gIC8vIFN0YW5kYXJkXHJcbiAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcbiAgZWxzZSBpZiAoZG9jdW1lbnQuc2VsZWN0aW9uICYmIHR5cGVvZiAoZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KSA9PT0gJ2Z1bmN0aW9uJylcclxuICAvLyBJRVxyXG4gICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XHJcbn07IiwiLyoqXHJcbiAgQSBjb2xsZWN0aW9uIG9mIHVzZWZ1bCBnZW5lcmljIHV0aWxzIG1hbmFnaW5nIERhdGVzXHJcbioqL1xyXG52YXIgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyk7XHJcblxyXG5mdW5jdGlvbiBjdXJyZW50V2VlaygpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGdldEZpcnN0V2Vla0RhdGUobmV3IERhdGUoKSksXHJcbiAgICBlbmQ6IGdldExhc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50V2VlayA9IGN1cnJlbnRXZWVrO1xyXG5cclxuZnVuY3Rpb24gbmV4dFdlZWsoc3RhcnQsIGVuZCkge1xyXG4gIC8vIFVuaXF1ZSBwYXJhbSB3aXRoIGJvdGggcHJvcGllcnRpZXM6XHJcbiAgaWYgKHN0YXJ0LmVuZCkge1xyXG4gICAgZW5kID0gc3RhcnQuZW5kO1xyXG4gICAgc3RhcnQgPSBzdGFydC5zdGFydDtcclxuICB9XHJcbiAgLy8gT3B0aW9uYWwgZW5kOlxyXG4gIGVuZCA9IGVuZCB8fCBhZGREYXlzKHN0YXJ0LCA3KTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGFkZERheXMoc3RhcnQsIDcpLFxyXG4gICAgZW5kOiBhZGREYXlzKGVuZCwgNylcclxuICB9O1xyXG59XHJcbmV4cG9ydHMubmV4dFdlZWsgPSBuZXh0V2VlaztcclxuXHJcbmZ1bmN0aW9uIGdldEZpcnN0V2Vla0RhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpIC0gZC5nZXREYXkoKSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRGaXJzdFdlZWtEYXRlID0gZ2V0Rmlyc3RXZWVrRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGdldExhc3RXZWVrRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyAoNiAtIGQuZ2V0RGF5KCkpKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldExhc3RXZWVrRGF0ZSA9IGdldExhc3RXZWVrRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGlzSW5DdXJyZW50V2VlayhkYXRlKSB7XHJcbiAgcmV0dXJuIGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0V2Vla0RhdGUoZGF0ZSkpID09IGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0V2Vla0RhdGUobmV3IERhdGUoKSkpO1xyXG59XHJcbmV4cG9ydHMuaXNJbkN1cnJlbnRXZWVrID0gaXNJbkN1cnJlbnRXZWVrO1xyXG5cclxuZnVuY3Rpb24gYWRkRGF5cyhkYXRlLCBkYXlzKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkYXlzKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmFkZERheXMgPSBhZGREYXlzO1xyXG5cclxuZnVuY3Rpb24gZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZuKSB7XHJcbiAgaWYgKCFmbi5jYWxsKSB0aHJvdyBuZXcgRXJyb3IoJ2ZuIG11c3QgYmUgYSBmdW5jdGlvbiBvciBcImNhbGxcImFibGUgb2JqZWN0Jyk7XHJcbiAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzdGFydCk7XHJcbiAgdmFyIGkgPSAwLCByZXQ7XHJcbiAgd2hpbGUgKGRhdGUgPD0gZW5kKSB7XHJcbiAgICByZXQgPSBmbi5jYWxsKGZuLCBkYXRlLCBpKTtcclxuICAgIC8vIEFsbG93IGZuIHRvIGNhbmNlbCB0aGUgbG9vcCB3aXRoIHN0cmljdCAnZmFsc2UnXHJcbiAgICBpZiAocmV0ID09PSBmYWxzZSlcclxuICAgICAgYnJlYWs7XHJcbiAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyAxKTtcclxuICAgIGkrKztcclxuICB9XHJcbn1cclxuZXhwb3J0cy5lYWNoRGF0ZUluUmFuZ2UgPSBlYWNoRGF0ZUluUmFuZ2U7XHJcblxyXG4vKiogTW9udGhzICoqL1xyXG5cclxuZnVuY3Rpb24gZ2V0Rmlyc3RNb250aERhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKDEpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0Rmlyc3RNb250aERhdGUgPSBnZXRGaXJzdE1vbnRoRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGdldExhc3RNb250aERhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXRNb250aChkLmdldE1vbnRoKCkgKyAxLCAxKTtcclxuICBkID0gYWRkRGF5cyhkLCAtMSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRMYXN0TW9udGhEYXRlID0gZ2V0TGFzdE1vbnRoRGF0ZTtcclxuXHJcbmZ1bmN0aW9uIGlzSW5DdXJyZW50TW9udGgoZGF0ZSkge1xyXG4gIHJldHVybiBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdE1vbnRoRGF0ZShkYXRlKSkgPT0gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RNb250aERhdGUobmV3IERhdGUoKSkpO1xyXG59XHJcbmV4cG9ydHMuaXNJbkN1cnJlbnRNb250aCA9IGlzSW5DdXJyZW50TW9udGg7XHJcblxyXG4vKipcclxuICBHZXQgYSBkYXRlcyByYW5nZSBmb3IgdGhlIGN1cnJlbnQgbW9udGhcclxuICAob3IgdGhlIGdpdmVuIGRhdGUgYXMgYmFzZSlcclxuKiovXHJcbmZ1bmN0aW9uIGN1cnJlbnRNb250aChiYXNlRGF0ZSkge1xyXG4gIGJhc2VEYXRlID0gYmFzZURhdGUgfHwgbmV3IERhdGUoKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGdldEZpcnN0TW9udGhEYXRlKGJhc2VEYXRlKSxcclxuICAgIGVuZDogZ2V0TGFzdE1vbnRoRGF0ZShiYXNlRGF0ZSlcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudE1vbnRoID0gY3VycmVudE1vbnRoO1xyXG5cclxuZnVuY3Rpb24gbmV4dE1vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpIHtcclxuICBhbW91bnRNb250aHMgPSBhbW91bnRNb250aHMgfHwgMTtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGZyb21EYXRlKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGQuc2V0TW9udGgoZC5nZXRNb250aCgpICsgYW1vdW50TW9udGhzLCAxKSxcclxuICAgIGVuZDogZ2V0TGFzdE1vbnRoRGF0ZShkKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5uZXh0TW9udGggPSBuZXh0TW9udGg7XHJcblxyXG5mdW5jdGlvbiBwcmV2aW91c01vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpIHtcclxuICByZXR1cm4gbmV4dE1vbnRoKGZyb21EYXRlLCAwIC0gYW1vdW50TW9udGhzKTtcclxufVxyXG5leHBvcnRzLnByZXZpb3VzTW9udGggPSBwcmV2aW91c01vbnRoO1xyXG5cclxuLyoqXHJcbiAgR2V0IGEgZGF0ZXMgcmFuZ2UgZm9yIHRoZSBjb21wbGV0ZSB3ZWVrc1xyXG4gIHRoYXQgYXJlIHBhcnQgb2YgdGhlIGN1cnJlbnQgbW9udGhcclxuICAob3IgdGhlIGdpdmVuIGRhdGUgYXMgYmFzZSkuXHJcbiAgVGhhdCBtZWFucywgdGhhdCBzdGFydCBkYXRlIHdpbGwgYmUgdGhlIGZpcnN0XHJcbiAgd2VlayBkYXRlIG9mIHRoZSBmaXJzdCBtb250aCB3ZWVrICh0aGF0IGNhblxyXG4gIGJlIHRoZSBkYXkgMSBvZiB0aGUgbW9udGggb3Igb25lIG9mIHRoZSBsYXN0XHJcbiAgZGF0ZXMgZnJvbSB0aGUgcHJldmlvdXMgbW9udGhzKSxcclxuICBhbmQgc2ltaWxhciBmb3IgdGhlIGVuZCBkYXRlIGJlaW5nIHRoZSBcclxuICBsYXN0IHdlZWsgZGF0ZSBvZiB0aGUgbGFzdCBtb250aCB3ZWVrLlxyXG5cclxuICBAaW5jbHVkZVNpeFdlZWtzOiBzb21ldGltZXMgaXMgdXNlZnVsIGdldCBldmVyIGFcclxuICBzaXggd2Vla3MgZGF0ZXMgcmFuZ2Ugc3RhcmluZyBieSB0aGUgZmlyc3Qgd2VlayBvZlxyXG4gIHRoZSBiYXNlRGF0ZSBtb250aC4gQnkgZGVmYXVsdCBpcyBmYWxzZS5cclxuKiovXHJcbmZ1bmN0aW9uIGN1cnJlbnRNb250aFdlZWtzKGJhc2VEYXRlLCBpbmNsdWRlU2l4V2Vla3MpIHtcclxuICB2YXIgciA9IGN1cnJlbnRNb250aChiYXNlRGF0ZSksXHJcbiAgICBzID0gZ2V0Rmlyc3RXZWVrRGF0ZShyLnN0YXJ0KSxcclxuICAgIGUgPSBpbmNsdWRlU2l4V2Vla3MgPyBhZGREYXlzKHMsIDYqNyAtIDEpIDogZ2V0TGFzdFdlZWtEYXRlKHIuZW5kKTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IHMsXHJcbiAgICBlbmQ6IGVcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudE1vbnRoV2Vla3MgPSBjdXJyZW50TW9udGhXZWVrcztcclxuXHJcbmZ1bmN0aW9uIG5leHRNb250aFdlZWtzKGZyb21EYXRlLCBhbW91bnRNb250aHMsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHJldHVybiBjdXJyZW50TW9udGhXZWVrcyhuZXh0TW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykuc3RhcnQsIGluY2x1ZGVTaXhXZWVrcyk7XHJcbn1cclxuZXhwb3J0cy5uZXh0TW9udGhXZWVrcyA9IG5leHRNb250aFdlZWtzO1xyXG5cclxuZnVuY3Rpb24gcHJldmlvdXNNb250aFdlZWtzKGZyb21EYXRlLCBhbW91bnRNb250aHMsIGluY2x1ZGVTaXhXZWVrcykge1xyXG4gIHJldHVybiBjdXJyZW50TW9udGhXZWVrcyhwcmV2aW91c01vbnRoKGZyb21EYXRlLCBhbW91bnRNb250aHMpLnN0YXJ0LCBpbmNsdWRlU2l4V2Vla3MpO1xyXG59XHJcbmV4cG9ydHMucHJldmlvdXNNb250aFdlZWtzID0gcHJldmlvdXNNb250aFdlZWtzO1xyXG4iLCIvKiogVmVyeSBzaW1wbGUgY3VzdG9tLWZvcm1hdCBmdW5jdGlvbiB0byBhbGxvdyBcclxubDEwbiBvZiB0ZXh0cy5cclxuQ292ZXIgY2FzZXM6XHJcbi0gTSBmb3IgbW9udGhcclxuLSBEIGZvciBkYXlcclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlLCBmb3JtYXQpIHtcclxuICB2YXIgcyA9IGZvcm1hdCxcclxuICAgICAgTSA9IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgIEQgPSBkYXRlLmdldERhdGUoKTtcclxuICBzID0gcy5yZXBsYWNlKC9NL2csIE0pO1xyXG4gIHMgPSBzLnJlcGxhY2UoL0QvZywgRCk7XHJcbiAgcmV0dXJuIHM7XHJcbn07IiwiLyoqXHJcbiAgRXhwb3NpbmcgYWxsIHRoZSBwdWJsaWMgZmVhdHVyZXMgYW5kIGNvbXBvbmVudHMgb2YgYXZhaWxhYmlsaXR5Q2FsZW5kYXJcclxuKiovXHJcbmV4cG9ydHMuV2Vla2x5ID0gcmVxdWlyZSgnLi9XZWVrbHknKTtcclxuZXhwb3J0cy5Xb3JrSG91cnMgPSByZXF1aXJlKCcuL1dvcmtIb3VycycpO1xyXG5leHBvcnRzLk1vbnRobHkgPSByZXF1aXJlKCcuL01vbnRobHknKTsiLCIvKipcclxuICBNYWtlIGFuIGVsZW1lbnQgdW5zZWxlY3RhYmxlLCB1c2VmdWwgdG8gaW1wbGVtZW50IHNvbWUgY3VzdG9tXHJcbiAgc2VsZWN0aW9uIGJlaGF2aW9yIG9yIGRyYWcmZHJvcC5cclxuICBJZiBvZmZlcnMgYW4gJ29mZicgbWV0aG9kIHRvIHJlc3RvcmUgYmFjayB0aGUgZWxlbWVudCBiZWhhdmlvci5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gIHZhciBmYWxzeWZuID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07XHJcbiAgdmFyIG5vZHJhZ1N0eWxlID0ge1xyXG4gICAgJy13ZWJraXQtdG91Y2gtY2FsbG91dCc6ICdub25lJyxcclxuICAgICcta2h0bWwtdXNlci1kcmFnJzogJ25vbmUnLFxyXG4gICAgJy13ZWJraXQtdXNlci1kcmFnJzogJ25vbmUnLFxyXG4gICAgJy1raHRtbC11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctd2Via2l0LXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnXHJcbiAgfTtcclxuICB2YXIgZHJhZ2RlZmF1bHRTdHlsZSA9IHtcclxuICAgICctd2Via2l0LXRvdWNoLWNhbGxvdXQnOiAnaW5oZXJpdCcsXHJcbiAgICAnLWtodG1sLXVzZXItZHJhZyc6ICdpbmhlcml0JyxcclxuICAgICctd2Via2l0LXVzZXItZHJhZyc6ICdpbmhlcml0JyxcclxuICAgICcta2h0bWwtdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLXdlYmtpdC11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctbW96LXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1tcy11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICd1c2VyLXNlbGVjdCc6ICdpbmhlcml0J1xyXG4gIH07XHJcblxyXG4gIHZhciBvbiA9IGZ1bmN0aW9uIG1ha2VVbnNlbGVjdGFibGUoZWwpIHtcclxuICAgIGVsID0gJChlbCk7XHJcbiAgICBlbC5vbignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIC8vJChkb2N1bWVudCkub24oJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICBlbC5jc3Mobm9kcmFnU3R5bGUpO1xyXG4gIH07XHJcblxyXG4gIHZhciBvZmYgPSBmdW5jdGlvbiBvZmZNYWtlVW5zZWxlY3RhYmxlKGVsKSB7XHJcbiAgICBlbCA9ICQoZWwpO1xyXG4gICAgZWwub2ZmKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgLy8kKGRvY3VtZW50KS5vZmYoJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICBlbC5jc3MoZHJhZ2RlZmF1bHRTdHlsZSk7XHJcbiAgfTtcclxuXHJcbiAgb24ub2ZmID0gb2ZmO1xyXG4gIHJldHVybiBvbjtcclxuXHJcbn0gKCkpOyIsIi8qKlxyXG4gIEEgc2V0IG9mIGdlbmVyaWMgdXRpbGl0aWVzIHRvIG1hbmFnZSBqcyBvYmplY3RzXHJcbioqL1xyXG52YXIgdSA9IHt9O1xyXG5cclxuLyoqXHJcbiAgUGVyZm9ybXMgYSBjYWxsYmFjayBvbiBlYWNoIHByb3BlcnR5IG93bmVkIGJ5IHRoZSBvYmplY3RcclxuKiovXHJcbnUuZWFjaFByb3BlcnR5ID0gZnVuY3Rpb24gZWFjaFByb3BlcnR5KG9iaiwgY2IpIHtcclxuICBmb3IgKHZhciBwIGluIG9iaikge1xyXG4gICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkocCkpIGNvbnRpbnVlO1xyXG4gICAgY2IuY2FsbChvYmosIHAsIG9ialtwXSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAgRmlsdGVyIHRoZSBnaXZlbiBvYmplY3QgcmV0dXJuaW5nIGEgbmV3IG9uZSB3aXRoIG9ubHkgdGhlIHByb3BlcnRpZXNcclxuICAoYW5kIG9yaWdpbmFsIHZhbHVlcyAtcmVmcyBmb3Igb2JqZWN0IHZhbHVlcy0pIHRoYXQgcGFzc1xyXG4gIHRoZSBwcm92aWRlZCBAZmlsdGVyIGNhbGxiYWNrIChjYWxsYmFjayBtdXN0IHJldHVybiBhIHRydWUvdHJ1dGh5IHZhbHVlXHJcbiAgZm9yIGVhY2ggdmFsdWUgZGVzaXJlZCBpbiB0aGUgcmVzdWx0KS5cclxuICBUaGUgQGZpbHRlciBjYWxsYmFjayBpdHMgZXhlY3V0ZWQgd2l0aCB0aGUgb2JqZWN0IGFzIGNvbnRleHQgYW5kIHJlY2VpdmVzXHJcbiAgYXMgcGFyZW1ldGVycyB0aGUgcHJvcGVydHkga2V5IGFuZCBpdHMgdmFsdWUgXCJmaWx0ZXIoaywgdilcIi5cclxuKiovXHJcbnUuZmlsdGVyUHJvcGVydGllcyA9IGZ1bmN0aW9uIGZpbHRlclByb3BlcmllcyhvYmosIGZpbHRlcikge1xyXG4gIHZhciByID0ge307XHJcbiAgdS5lYWNoUHJvcGVydHkob2JqLCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgaWYgKGZpbHRlci5jYWxsKG9iaiwgaywgdikpXHJcbiAgICAgIHJba10gPSB2O1xyXG4gIH0pO1xyXG4gIHJldHVybiByO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB1OyIsIi8qKlxyXG4gIEF2YWlsYWJpbGl0eUNhbGVuZGFyIHNoYXJlZCB1dGlsc1xyXG4qKi9cclxudmFyIFxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBkYXRlVXRpbHMgPSByZXF1aXJlKCcuL2RhdGVVdGlscycpLFxyXG4gIGZvcm1hdERhdGUgPSByZXF1aXJlKCcuL2Zvcm1hdERhdGUnKTtcclxuXHJcbi8vIFJlLWV4cG9ydGluZzpcclxuZXhwb3J0cy5mb3JtYXREYXRlID0gZm9ybWF0RGF0ZTtcclxuZXhwb3J0cy5kYXRlID0gZGF0ZVV0aWxzO1xyXG5cclxuLyotLS0tLS0gQ09OU1RBTlRTIC0tLS0tLS0tLSovXHJcbnZhciBzdGF0dXNUeXBlcyA9IGV4cG9ydHMuc3RhdHVzVHlwZXMgPSBbJ3VuYXZhaWxhYmxlJywgJ2F2YWlsYWJsZSddO1xyXG4vLyBXZWVrIGRheXMgbmFtZXMgaW4gZW5nbGlzaCBmb3IgaW50ZXJuYWwgc3lzdGVtXHJcbi8vIHVzZTsgTk9UIGZvciBsb2NhbGl6YXRpb24vdHJhbnNsYXRpb24uXHJcbnZhciBzeXN0ZW1XZWVrRGF5cyA9IGV4cG9ydHMuc3lzdGVtV2Vla0RheXMgPSBbXHJcbiAgJ3N1bmRheScsXHJcbiAgJ21vbmRheScsXHJcbiAgJ3R1ZXNkYXknLFxyXG4gICd3ZWRuZXNkYXknLFxyXG4gICd0aHVyc2RheScsXHJcbiAgJ2ZyaWRheScsXHJcbiAgJ3NhdHVyZGF5J1xyXG5dO1xyXG5cclxuLyotLS0tLS0tLS0gQ09ORklHIC0gSU5TVEFOQ0UgLS0tLS0tLS0tLSovXHJcbnZhciB3ZWVrbHlDbGFzc2VzID0gZXhwb3J0cy53ZWVrbHlDbGFzc2VzID0ge1xyXG4gIGNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXInLFxyXG4gIHdlZWtseUNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItLXdlZWtseScsXHJcbiAgY3VycmVudFdlZWs6ICdpcy1jdXJyZW50V2VlaycsXHJcbiAgYWN0aW9uczogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWFjdGlvbnMnLFxyXG4gIHByZXZBY3Rpb246ICdBY3Rpb25zLXByZXYnLFxyXG4gIG5leHRBY3Rpb246ICdBY3Rpb25zLW5leHQnLFxyXG4gIGRheXM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1kYXlzJyxcclxuICBzbG90czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXNsb3RzJyxcclxuICBzbG90SG91cjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWhvdXInLFxyXG4gIHNsb3RTdGF0dXNQcmVmaXg6ICdpcy0nLFxyXG4gIGxlZ2VuZDogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZCcsXHJcbiAgbGVnZW5kQXZhaWxhYmxlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kLWF2YWlsYWJsZScsXHJcbiAgbGVnZW5kVW5hdmFpbGFibGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQtdW5hdmFpbGFibGUnLFxyXG4gIHN0YXR1czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXN0YXR1cycsXHJcbiAgZXJyb3JNZXNzYWdlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItZXJyb3JNZXNzYWdlJ1xyXG59O1xyXG5cclxudmFyIHdlZWtseVRleHRzID0gZXhwb3J0cy53ZWVrbHlUZXh0cyA9IHtcclxuICBhYmJyV2Vla0RheXM6IFtcclxuICAgICdTdW4nLCAnTW9uJywgJ1R1ZScsICdXZWQnLCAnVGh1JywgJ0ZyaScsICdTYXQnXHJcbiAgXSxcclxuICB0b2RheTogJ1RvZGF5JyxcclxuICAvLyBBbGxvd2VkIHNwZWNpYWwgdmFsdWVzOiBNOm1vbnRoLCBEOmRheVxyXG4gIGFiYnJEYXRlRm9ybWF0OiAnTS9EJ1xyXG59O1xyXG5cclxuLyotLS0tLS0tLS0tLSBWSUVXIFVUSUxTIC0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuZnVuY3Rpb24gaGFuZGxlckNhbGVuZGFyRXJyb3IoZXJyKSB7XHJcbiAgdmFyIG1zZyA9ICcnO1xyXG4gIGlmIChlcnIgJiYgZXJyLm1lc3NhZ2UpXHJcbiAgICBtc2cgPSBlcnIubWVzc2FnZTtcclxuICBlbHNlIGlmIChlcnIgJiYgZXJyLmV4Y2VwdGlvbiAmJiBlcnIuZXhjZXB0aW9uLm1lc3NhZ2UpXHJcbiAgICBtc2cgPSBlcnIuZXhjZXB0aW9uLm1lc3NhZ2U7XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcy5jb21wb25lbnQ7XHJcbiAgdmFyIG1zZ0NvbnRhaW5lciA9IHRoYXQuJGVsLmZpbmQoJy4nICsgdGhhdC5jbGFzc2VzLmVycm9yTWVzc2FnZSk7XHJcblxyXG4gIGlmIChtc2cpIG1zZyA9IChtc2dDb250YWluZXIuZGF0YSgnbWVzc2FnZS1wcmVmaXgnKSB8fCAnJykgKyBtc2c7XHJcblxyXG4gIG1zZ0NvbnRhaW5lci50ZXh0KG1zZyk7XHJcbn1cclxuZXhwb3J0cy5oYW5kbGVyQ2FsZW5kYXJFcnJvciA9IGhhbmRsZXJDYWxlbmRhckVycm9yO1xyXG5cclxuZnVuY3Rpb24gbW92ZUJpbmRSYW5nZUluRGF5cyh3ZWVrbHksIGRheXMpIHtcclxuICB2YXIgXHJcbiAgICBzdGFydCA9IGRhdGVVdGlscy5hZGREYXlzKHdlZWtseS5kYXRlc1JhbmdlLnN0YXJ0LCBkYXlzKSxcclxuICAgIGVuZCA9IGRhdGVVdGlscy5hZGREYXlzKHdlZWtseS5kYXRlc1JhbmdlLmVuZCwgZGF5cyksXHJcbiAgICBkYXRlc1JhbmdlID0gZGF0ZXNUb1JhbmdlKHN0YXJ0LCBlbmQpO1xyXG5cclxuICAvLyBDaGVjayBjYWNoZSBiZWZvcmUgdHJ5IHRvIGZldGNoXHJcbiAgdmFyIGluQ2FjaGUgPSB3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcblxyXG4gIGlmIChpbkNhY2hlKSB7XHJcbiAgICAvLyBKdXN0IHNob3cgdGhlIGRhdGFcclxuICAgIHdlZWtseS5iaW5kRGF0YShkYXRlc1JhbmdlKTtcclxuICAgIC8vIFByZWZldGNoIGV4Y2VwdCBpZiB0aGVyZSBpcyBvdGhlciByZXF1ZXN0IGluIGNvdXJzZSAoY2FuIGJlIHRoZSBzYW1lIHByZWZldGNoLFxyXG4gICAgLy8gYnV0IHN0aWxsIGRvbid0IG92ZXJsb2FkIHRoZSBzZXJ2ZXIpXHJcbiAgICBpZiAod2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggPT09IDApXHJcbiAgICAgIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuICB9IGVsc2Uge1xyXG5cclxuICAgIC8vIFN1cHBvcnQgZm9yIHByZWZldGNoaW5nOlxyXG4gICAgLy8gSXRzIGF2b2lkZWQgaWYgdGhlcmUgYXJlIHJlcXVlc3RzIGluIGNvdXJzZSwgc2luY2VcclxuICAgIC8vIHRoYXQgd2lsbCBiZSBhIHByZWZldGNoIGZvciB0aGUgc2FtZSBkYXRhLlxyXG4gICAgaWYgKHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSB7XHJcbiAgICAgIC8vIFRoZSBsYXN0IHJlcXVlc3QgaW4gdGhlIHBvb2wgKm11c3QqIGJlIHRoZSBsYXN0IGluIGZpbmlzaFxyXG4gICAgICAvLyAobXVzdCBiZSBvbmx5IG9uZSBpZiBhbGwgZ29lcyBmaW5lKTpcclxuICAgICAgdmFyIHJlcXVlc3QgPSB3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzW3dlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAvLyBXYWl0IGZvciB0aGUgZmV0Y2ggdG8gcGVyZm9ybSBhbmQgc2V0cyBsb2FkaW5nIHRvIG5vdGlmeSB1c2VyXHJcbiAgICAgIHdlZWtseS4kZWwuYWRkQ2xhc3Mod2Vla2x5LmNsYXNzZXMuZmV0Y2hpbmcpO1xyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIG1vdmVCaW5kUmFuZ2VJbkRheXMod2Vla2x5LCBkYXlzKTtcclxuICAgICAgICB3ZWVrbHkuJGVsLnJlbW92ZUNsYXNzKHdlZWtseS5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmV0Y2ggKGRvd25sb2FkKSB0aGUgZGF0YSBhbmQgc2hvdyBvbiByZWFkeTpcclxuICAgIHdlZWtseVxyXG4gICAgLmZldGNoRGF0YShkYXRlc1RvUXVlcnkoZGF0ZXNSYW5nZSkpXHJcbiAgICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHdlZWtseS5iaW5kRGF0YShkYXRlc1JhbmdlKTtcclxuICAgICAgLy8gUHJlZmV0Y2hcclxuICAgICAgd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydHMubW92ZUJpbmRSYW5nZUluRGF5cyA9IG1vdmVCaW5kUmFuZ2VJbkRheXM7XHJcblxyXG5mdW5jdGlvbiB3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgZGF0ZXNSYW5nZSkge1xyXG4gIGlmICghd2Vla2x5LmRhdGEgfHwgIXdlZWtseS5kYXRhLnNsb3RzKSByZXR1cm4gZmFsc2U7XHJcbiAgLy8gQ2hlY2sgY2FjaGU6IGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgZGF0ZSBpbiB0aGUgcmFuZ2VcclxuICAvLyB3aXRob3V0IGRhdGEsIHdlIHNldCBpbkNhY2hlIGFzIGZhbHNlIGFuZCBmZXRjaCB0aGUgZGF0YTpcclxuICB2YXIgaW5DYWNoZSA9IHRydWU7XHJcbiAgZGF0ZVV0aWxzLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICBpZiAoIXdlZWtseS5kYXRhLnNsb3RzW2RhdGVrZXldKSB7XHJcbiAgICAgIGluQ2FjaGUgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiBpbkNhY2hlO1xyXG59XHJcbmV4cG9ydHMud2Vla2x5SXNEYXRhSW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGU7XHJcblxyXG4vKipcclxuICBGb3Igbm93LCBnaXZlbiB0aGUgSlNPTiBzdHJ1Y3R1cmUgdXNlZCwgdGhlIGxvZ2ljXHJcbiAgb2YgbW9udGhseUlzRGF0YUluQ2FjaGUgaXMgdGhlIHNhbWUgYXMgd2Vla2x5SXNEYXRhSW5DYWNoZTpcclxuKiovXHJcbnZhciBtb250aGx5SXNEYXRhSW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGU7XHJcbmV4cG9ydHMubW9udGhseUlzRGF0YUluQ2FjaGUgPSBtb250aGx5SXNEYXRhSW5DYWNoZTtcclxuXHJcblxyXG5mdW5jdGlvbiB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgY3VycmVudERhdGVzUmFuZ2UpIHtcclxuICB2YXIgbmV4dERhdGVzUmFuZ2UgPSBkYXRlc1RvUmFuZ2UoXHJcbiAgICBkYXRlVXRpbHMuYWRkRGF5cyhjdXJyZW50RGF0ZXNSYW5nZS5zdGFydCwgNyksXHJcbiAgICBkYXRlVXRpbHMuYWRkRGF5cyhjdXJyZW50RGF0ZXNSYW5nZS5lbmQsIDcpXHJcbiAgKTtcclxuXHJcbiAgaWYgKCF3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgbmV4dERhdGVzUmFuZ2UpKSB7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IHdlZWsgaW4gYWR2YW5jZVxyXG4gICAgdmFyIHByZWZldGNoUXVlcnkgPSBkYXRlc1RvUXVlcnkobmV4dERhdGVzUmFuZ2UpO1xyXG4gICAgd2Vla2x5LmZldGNoRGF0YShwcmVmZXRjaFF1ZXJ5LCBudWxsLCB0cnVlKTtcclxuICB9XHJcbn1cclxuZXhwb3J0cy53ZWVrbHlDaGVja0FuZFByZWZldGNoID0gd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaDtcclxuXHJcbi8qKiBVcGRhdGUgdGhlIHZpZXcgbGFiZWxzIGZvciB0aGUgd2Vlay1kYXlzICh0YWJsZSBoZWFkZXJzKVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIGNhbGVuZGFyLCBvcHRpb25zKSB7XHJcbiAgdmFyIHN0YXJ0ID0gZGF0ZXNSYW5nZS5zdGFydCxcclxuICAgICAgZW5kID0gZGF0ZXNSYW5nZS5lbmQ7XHJcblxyXG4gIHZhciBkYXlzID0gY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMuZGF5cyArICcgdGgnKTtcclxuICB2YXIgdG9kYXkgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXcgRGF0ZSgpKTtcclxuICAvLyBGaXJzdCBjZWxsIGlzIGVtcHR5ICgndGhlIGNyb3NzIGhlYWRlcnMgY2VsbCcpLCB0aGVuIG9mZnNldCBpcyAxXHJcbiAgdmFyIG9mZnNldCA9IDE7XHJcbiAgZGF0ZVV0aWxzLmVhY2hEYXRlSW5SYW5nZShzdGFydCwgZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgdmFyIGNlbGwgPSAkKGRheXMuZ2V0KG9mZnNldCArIGkpKSxcclxuICAgICAgICBzZGF0ZSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUpLFxyXG4gICAgICAgIGxhYmVsID0gc2RhdGU7XHJcblxyXG4gICAgaWYgKHRvZGF5ID09IHNkYXRlKVxyXG4gICAgICBsYWJlbCA9IG9wdGlvbnMudGV4dHMudG9kYXk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGxhYmVsID0gb3B0aW9ucy50ZXh0cy5hYmJyV2Vla0RheXNbZGF0ZS5nZXREYXkoKV0gKyAnICcgKyBmb3JtYXREYXRlKGRhdGUsIG9wdGlvbnMudGV4dHMuYWJickRhdGVGb3JtYXQpO1xyXG5cclxuICAgIGNlbGwudGV4dChsYWJlbCk7XHJcbiAgfSk7XHJcbn1cclxuZXhwb3J0cy51cGRhdGVMYWJlbHMgPSB1cGRhdGVMYWJlbHM7XHJcblxyXG5mdW5jdGlvbiBmaW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgZGF5LCBzbG90KSB7XHJcbiAgc2xvdCA9IGRhdGVJU08ucGFyc2Uoc2xvdCk7XHJcbiAgdmFyIFxyXG4gICAgeCA9IE1hdGgucm91bmQoc2xvdC5nZXRIb3VycygpKSxcclxuICAvLyBUaW1lIGZyYW1lcyAoc2xvdHMpIGFyZSAxNSBtaW51dGVzIGRpdmlzaW9uc1xyXG4gICAgeSA9IE1hdGgucm91bmQoc2xvdC5nZXRNaW51dGVzKCkgLyAxNSksXHJcbiAgICB0ciA9IHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCc6ZXEoJyArIE1hdGgucm91bmQoeCAqIDQgKyB5KSArICcpJyk7XHJcblxyXG4gIC8vIFNsb3QgY2VsbCBmb3IgbydjbG9jayBob3VycyBpcyBhdCAxIHBvc2l0aW9uIG9mZnNldFxyXG4gIC8vIGJlY2F1c2Ugb2YgdGhlIHJvdy1oZWFkIGNlbGxcclxuICB2YXIgZGF5T2Zmc2V0ID0gKHkgPT09IDAgPyBkYXkgKyAxIDogZGF5KTtcclxuICByZXR1cm4gdHIuY2hpbGRyZW4oJzplcSgnICsgZGF5T2Zmc2V0ICsgJyknKTtcclxufVxyXG5leHBvcnRzLmZpbmRDZWxsQnlTbG90ID0gZmluZENlbGxCeVNsb3Q7XHJcblxyXG5mdW5jdGlvbiBmaW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCkge1xyXG4gIHZhciBcclxuICAgIHggPSBjZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChjZWxsKSxcclxuICAgIHkgPSBjZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKSxcclxuICAgIGZ1bGxNaW51dGVzID0geSAqIDE1LFxyXG4gICAgaG91cnMgPSBNYXRoLmZsb29yKGZ1bGxNaW51dGVzIC8gNjApLFxyXG4gICAgbWludXRlcyA9IGZ1bGxNaW51dGVzIC0gKGhvdXJzICogNjApLFxyXG4gICAgc2xvdCA9IG5ldyBEYXRlKCk7XHJcbiAgc2xvdC5zZXRIb3Vycyhob3VycywgbWludXRlcywgMCwgMCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBkYXk6IHgsXHJcbiAgICBzbG90OiBzbG90XHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmZpbmRTbG90QnlDZWxsID0gZmluZFNsb3RCeUNlbGw7XHJcblxyXG4vKipcclxuTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LXdlZWsgYW5kIGRpc2FibGUgcHJldiBidXR0b24sXHJcbm9yIHJlbW92ZSB0aGUgbWFyayBhbmQgZW5hYmxlIGl0IGlmIGlzIG5vdC5cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrQ3VycmVudFdlZWsoY2FsZW5kYXIsIGRhdGUsIG9wdGlvbnMpIHtcclxuICB2YXIgeWVwID0gZGF0ZVV0aWxzLmlzSW5DdXJyZW50V2VlayhkYXRlKTtcclxuICBjYWxlbmRhci50b2dnbGVDbGFzcyhvcHRpb25zLmNsYXNzZXMuY3VycmVudFdlZWssIHllcCk7XHJcbiAgY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMucHJldkFjdGlvbikucHJvcCgnZGlzYWJsZWQnLCB5ZXApO1xyXG59XHJcbmV4cG9ydHMuY2hlY2tDdXJyZW50V2VlayA9IGNoZWNrQ3VycmVudFdlZWs7XHJcblxyXG4vKiogR2V0IHF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBkYXRlIHJhbmdlIHNwZWNpZmllZDpcclxuKiovXHJcbmZ1bmN0aW9uIGRhdGVzVG9RdWVyeShzdGFydCwgZW5kKSB7XHJcbiAgLy8gVW5pcXVlIHBhcmFtIHdpdGggYm90aCBwcm9waWVydGllczpcclxuICBpZiAoc3RhcnQuZW5kKSB7XHJcbiAgICBlbmQgPSBzdGFydC5lbmQ7XHJcbiAgICBzdGFydCA9IHN0YXJ0LnN0YXJ0O1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGRhdGVJU08uZGF0ZUxvY2FsKHN0YXJ0LCB0cnVlKSxcclxuICAgIGVuZDogZGF0ZUlTTy5kYXRlTG9jYWwoZW5kLCB0cnVlKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5kYXRlc1RvUXVlcnkgPSBkYXRlc1RvUXVlcnk7XHJcblxyXG4vKiogUGFjayB0d28gZGF0ZXMgaW4gYSBzaW1wbGUgYnV0IHVzZWZ1bFxyXG5zdHJ1Y3R1cmUgeyBzdGFydCwgZW5kIH1cclxuKiovXHJcbmZ1bmN0aW9uIGRhdGVzVG9SYW5nZShzdGFydCwgZW5kKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBzdGFydCxcclxuICAgIGVuZDogZW5kXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmRhdGVzVG9SYW5nZSA9IGRhdGVzVG9SYW5nZTtcclxuIiwiLyoqXHJcbiAgICBTbWFsbCB1dGlsaXR5IHRvIHdyYXAgYSBjYWxsYmFjay9oYW5kbGVyIGZ1bmN0aW9uIGluIGEgdGltZXJcclxuICAgIGJlaW5nIGV4ZWN1dGVkIG9ubHkgb25jZSAodGhlIGxhdGVzdCBjYWxsKSBpbnNpZGUgdGhlIHRpbWVmcmFtZSxcclxuICAgIGRlZmluZWQgYnkgdGhlIGludGVydmFsIHBhcmFtZXRlciwgaXRzIGp1c3QgMSBtaWxpc2Vjb25kIGJ5IGRlZmF1bHQuXHJcbiAgICBJdHMgdXNlZnVsIHdoZW4gYW4gZXZlbnQgZ2V0cyBleGVjdXRlZFxyXG4gICAgbG90cyBvZiB0aW1lcyB0b28gcXVpY2tseSBhbmQgb25seSAxIGV4ZWN1dGlvbiBpcyB3YW50ZWQgdG8gYXZvaWRcclxuICAgIGh1cnQgcGVyZm9ybWFuY2UuXHJcbiAgICBUaGUgZGVmYXVsdCBpbnRlcnZhbCBvZiAxIHdvcmtzIGZpbmUgaWYgdGhlIGV2ZW50IGdldHMgcmFpc2VkXHJcbiAgICBhIGxvdCBieSBjb25zZWN1dGl2ZSBjb2RlLCBidXQgaWYgY2FsbHMgYXJlIGRlbGF5ZWQgYSBncmVhdGVyXHJcbiAgICBpbnRlcnZhbCB3aWxsIGJlIG5lZWQuXHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhdGNoRXZlbnRIYW5kbGVyKGNiLCBpbnRlcnZhbCkge1xyXG4gICAgdmFyIHRpbWVyO1xyXG5cclxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjYi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xyXG4gICAgICAgIH0sIGludGVydmFsIHx8IDEpO1xyXG4gICAgfTtcclxufTsiLCIvKiBHZW5lcmljIGJsb2NrVUkgb3B0aW9ucyBzZXRzICovXHJcbnZhciBsb2FkaW5nQmxvY2sgPSB7IG1lc3NhZ2U6ICc8aW1nIHdpZHRoPVwiNDhweFwiIGhlaWdodD1cIjQ4cHhcIiBjbGFzcz1cImxvYWRpbmctaW5kaWNhdG9yXCIgc3JjPVwiJyArIExjVXJsLkFwcFBhdGggKyAnaW1nL3RoZW1lL2xvYWRpbmcuZ2lmXCIvPicgfTtcclxudmFyIGVycm9yQmxvY2sgPSBmdW5jdGlvbiAoZXJyb3IsIHJlbG9hZCwgc3R5bGUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3NzOiAkLmV4dGVuZCh7IGN1cnNvcjogJ2RlZmF1bHQnIH0sIHN0eWxlIHx8IHt9KSxcclxuICAgICAgICBtZXNzYWdlOiAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPjxkaXYgY2xhc3M9XCJpbmZvXCI+VGhlcmUgd2FzIGFuIGVycm9yJyArXHJcbiAgICAgICAgICAgIChlcnJvciA/ICc6ICcgKyBlcnJvciA6ICcnKSArXHJcbiAgICAgICAgICAgIChyZWxvYWQgPyAnIDxhIGhyZWY9XCJqYXZhc2NyaXB0OiAnICsgcmVsb2FkICsgJztcIj5DbGljayB0byByZWxvYWQ8L2E+JyA6ICcnKSArXHJcbiAgICAgICAgICAgICc8L2Rpdj4nXHJcbiAgICB9O1xyXG59O1xyXG52YXIgaW5mb0Jsb2NrID0gZnVuY3Rpb24gKG1lc3NhZ2UsIG9wdGlvbnMpIHtcclxuICAgIHJldHVybiAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWVzc2FnZTogJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT48ZGl2IGNsYXNzPVwiaW5mb1wiPicgKyBtZXNzYWdlICsgJzwvZGl2PidcclxuICAgICAgICAvKixjc3M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfSovXHJcbiAgICAgICAgLCBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH1cclxuICAgIH0sIG9wdGlvbnMpO1xyXG59O1xyXG5cclxuLy8gTW9kdWxlOlxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGxvYWRpbmc6IGxvYWRpbmdCbG9jayxcclxuICAgICAgICBlcnJvcjogZXJyb3JCbG9jayxcclxuICAgICAgICBpbmZvOiBpbmZvQmxvY2tcclxuICAgIH07XHJcbn0iLCIvKj0gQ2hhbmdlc05vdGlmaWNhdGlvbiBjbGFzc1xyXG4qIHRvIG5vdGlmeSB1c2VyIGFib3V0IGNoYW5nZXMgaW4gZm9ybXMsXHJcbiogdGFicywgdGhhdCB3aWxsIGJlIGxvc3QgaWYgZ28gYXdheSBmcm9tXHJcbiogdGhlIHBhZ2UuIEl0IGtub3dzIHdoZW4gYSBmb3JtIGlzIHN1Ym1pdHRlZFxyXG4qIGFuZCBzYXZlZCB0byBkaXNhYmxlIG5vdGlmaWNhdGlvbiwgYW5kIGdpdmVzXHJcbiogbWV0aG9kcyBmb3Igb3RoZXIgc2NyaXB0cyB0byBub3RpZnkgY2hhbmdlc1xyXG4qIG9yIHNhdmluZy5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGdldFhQYXRoID0gcmVxdWlyZSgnLi9nZXRYUGF0aCcpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSB7XHJcbiAgICBjaGFuZ2VzTGlzdDoge30sXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICAgIHRhcmdldDogbnVsbCxcclxuICAgICAgICBnZW5lcmljQ2hhbmdlU3VwcG9ydDogdHJ1ZSxcclxuICAgICAgICBnZW5lcmljU3VibWl0U3VwcG9ydDogZmFsc2UsXHJcbiAgICAgICAgY2hhbmdlZEZvcm1DbGFzczogJ2hhcy1jaGFuZ2VzJyxcclxuICAgICAgICBjaGFuZ2VkRWxlbWVudENsYXNzOiAnY2hhbmdlZCcsXHJcbiAgICAgICAgbm90aWZ5Q2xhc3M6ICdub3RpZnktY2hhbmdlcydcclxuICAgIH0sXHJcbiAgICBpbml0OiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgIC8vIFVzZXIgbm90aWZpY2F0aW9uIHRvIHByZXZlbnQgbG9zdCBjaGFuZ2VzIGRvbmVcclxuICAgICAgICAkKHdpbmRvdykub24oJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNoYW5nZXNOb3RpZmljYXRpb24ubm90aWZ5KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRoaXMuZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG4gICAgICAgIGlmICghb3B0aW9ucy50YXJnZXQpXHJcbiAgICAgICAgICAgIG9wdGlvbnMudGFyZ2V0ID0gZG9jdW1lbnQ7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY0NoYW5nZVN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdjaGFuZ2UnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKSA6aW5wdXRbbmFtZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKCQodGhpcykuY2xvc2VzdCgnZm9ybScpLmdldCgwKSwgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNTdWJtaXRTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignc3VibWl0JywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCknLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZSh0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgbm90aWZ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gQWRkIG5vdGlmaWNhdGlvbiBjbGFzcyB0byB0aGUgZG9jdW1lbnRcclxuICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5ub3RpZnlDbGFzcyk7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBjaGFuZ2UgaW4gdGhlIHByb3BlcnR5IGxpc3QgcmV0dXJuaW5nIHRoZSBtZXNzYWdlOlxyXG4gICAgICAgIGZvciAodmFyIGMgaW4gdGhpcy5jaGFuZ2VzTGlzdClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVpdE1lc3NhZ2UgfHwgKHRoaXMucXVpdE1lc3NhZ2UgPSAkKCcjbGNyZXMtcXVpdC13aXRob3V0LXNhdmUnKS50ZXh0KCkpIHx8ICcnO1xyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyQ2hhbmdlOiBmdW5jdGlvbiAoZiwgZSkge1xyXG4gICAgICAgIGlmICghZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBmbmFtZSA9IGdldFhQYXRoKGYpO1xyXG4gICAgICAgIHZhciBmbCA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gfHwgW107XHJcbiAgICAgICAgaWYgKCQuaXNBcnJheShlKSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGUubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQ2hhbmdlKGYsIGVbaV0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBuID0gZTtcclxuICAgICAgICBpZiAodHlwZW9mIChlKSAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgbiA9IGUubmFtZTtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcmVhbGx5IHRoZXJlIHdhcyBhIGNoYW5nZSBjaGVja2luZyBkZWZhdWx0IGVsZW1lbnQgdmFsdWVcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZS5kZWZhdWx0VmFsdWUpICE9ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuY2hlY2tlZCkgPT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5zZWxlY3RlZCkgPT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIGUudmFsdWUgPT0gZS5kZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZXJlIHdhcyBubyBjaGFuZ2UsIG5vIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAvLyBhbmQgbWF5YmUgaXMgYSByZWdyZXNzaW9uIGZyb20gYSBjaGFuZ2UgYW5kIG5vdyB0aGUgb3JpZ2luYWwgdmFsdWUgYWdhaW5cclxuICAgICAgICAgICAgICAgIC8vIHRyeSB0byByZW1vdmUgZnJvbSBjaGFuZ2VzIGxpc3QgZG9pbmcgcmVnaXN0ZXJTYXZlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyU2F2ZShmLCBbbl0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQoZSkuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRWxlbWVudENsYXNzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCEobiBpbiBmbCkpXHJcbiAgICAgICAgICAgIGZsLnB1c2gobik7XHJcbiAgICAgICAgJChmKVxyXG4gICAgICAgIC5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRGb3JtQ2xhc3MpXHJcbiAgICAgICAgLy8gcGFzcyBkYXRhOiBmb3JtLCBlbGVtZW50IG5hbWUgY2hhbmdlZCwgZm9ybSBlbGVtZW50IGNoYW5nZWQgKHRoaXMgY2FuIGJlIG51bGwpXHJcbiAgICAgICAgLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBbZiwgbiwgZV0pO1xyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyU2F2ZTogZnVuY3Rpb24gKGYsIGVscykge1xyXG4gICAgICAgIHZhciBmbmFtZSA9IGdldFhQYXRoKGYpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pIHJldHVybjtcclxuXHJcbiAgICAgICAgdmFyIHByZXZFbHMgPSAkLmV4dGVuZChbXSwgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pO1xyXG5cclxuICAgICAgICAvLyAnZWxzJyAoZmlsdGVyZWQgZm9ybSBlbGVtZW50cyBsaXN0KSBjYW4gYmUgYW4gYXJyYXkgb2YgZmllbGQgJ25hbWUncyBvciBhbiBhcnJheSBvZiBET00gZWxlbWVudHMgKG9yIG1peGVkKVxyXG4gICAgICAgIC8vIGl0cyBjb252ZXJ0ZWQgdG8gYW4gYXJyYXkgb2YgJ25hbWUncyBhbnl3YXk6XHJcbiAgICAgICAgaWYgKGVscykge1xyXG4gICAgICAgICAgICBlbHMgPSAkLm1hcChlbHMsIGZ1bmN0aW9uIChlbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2YgKGVsKSA9PT0gJ3N0cmluZycgPyBlbCA6IGVsLm5hbWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHRvLXJlbW92ZSBmb3JtIGxpc3QgZmxhZzogYnkgZGVmYXVsdCB0cnVlLCBzaW5jZSB3aGVuIG5vIGVscyBsaXN0IHNpbmNlIGlzIGFsbCB0aGUgZm9ybSBzYXZlZFxyXG4gICAgICAgIHZhciByID0gdHJ1ZTtcclxuICAgICAgICBpZiAoZWxzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gJC5ncmVwKHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLCBmdW5jdGlvbiAoZWwpIHsgcmV0dXJuICgkLmluQXJyYXkoZWwsIGVscykgPT0gLTEpOyB9KTtcclxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVtb3ZlICdmJyBsaXN0IGlmIGlzIG5vdCBlbXB0eVxyXG4gICAgICAgICAgICByID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0ubGVuZ3RoID09PSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHIpIHtcclxuICAgICAgICAgICAgJChmKS5yZW1vdmVDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRGb3JtQ2xhc3MpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnRzIHJlZ2lzdGVyZWQgYXMgc2F2ZSAodGhpcyBjYW4gYmUgbnVsbCksIGFuZCAnZm9ybSBmdWxseSBzYXZlZCcgYXMgdGhpcmQgcGFyYW0gKGJvb2wpXHJcbiAgICAgICAgJChmKS50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsIFtmLCBlbHMgfHwgcHJldkVscywgcl0pO1xyXG4gICAgICAgIHZhciBsY2huID0gdGhpcztcclxuICAgICAgICBpZiAoZWxzKSB7XHJcbiAgICAgICAgICAgICQuZWFjaChlbHMsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQoJ1tuYW1lPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUodGhpcykgKyAnXCJdJylcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhsY2huLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHByZXZFbHM7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGNoYW5nZXNOb3RpZmljYXRpb247XHJcbn0iLCIvKiBVdGlsaXR5IHRvIGNyZWF0ZSBpZnJhbWUgd2l0aCBpbmplY3RlZCBodG1sL2NvbnRlbnQgaW5zdGVhZCBvZiBVUkwuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUlmcmFtZShjb250ZW50LCBzaXplKSB7XHJcbiAgICB2YXIgJGlmcmFtZSA9ICQoJzxpZnJhbWUgd2lkdGg9XCInICsgc2l6ZS53aWR0aCArICdcIiBoZWlnaHQ9XCInICsgc2l6ZS5oZWlnaHQgKyAnXCIgc3R5bGU9XCJib3JkZXI6bm9uZTtcIj48L2lmcmFtZT4nKTtcclxuICAgIHZhciBpZnJhbWUgPSAkaWZyYW1lLmdldCgwKTtcclxuICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBpcyByZWFkeVxyXG4gICAgdmFyIGlmcmFtZWxvYWRlZCA9IGZhbHNlO1xyXG4gICAgaWZyYW1lLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBVc2luZyBpZnJhbWVsb2FkZWQgdG8gYXZvaWQgaW5maW5pdGUgbG9vcHNcclxuICAgICAgICBpZiAoIWlmcmFtZWxvYWRlZCkge1xyXG4gICAgICAgICAgICBpZnJhbWVsb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgY29udGVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiAkaWZyYW1lO1xyXG59O1xyXG5cclxuLyogUHV0cyBmdWxsIGh0bWwgaW5zaWRlIHRoZSBpZnJhbWUgZWxlbWVudCBwYXNzZWQgaW4gYSBzZWN1cmUgYW5kIGNvbXBsaWFudCBtb2RlICovXHJcbmZ1bmN0aW9uIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBodG1sKSB7XHJcbiAgICAvLyBwdXQgYWpheCBkYXRhIGluc2lkZSBpZnJhbWUgcmVwbGFjaW5nIGFsbCB0aGVpciBodG1sIGluIHNlY3VyZSBcclxuICAgIC8vIGNvbXBsaWFudCBtb2RlICgkLmh0bWwgZG9uJ3Qgd29ya3MgdG8gaW5qZWN0IDxodG1sPjxoZWFkPiBjb250ZW50KVxyXG5cclxuICAgIC8qIGRvY3VtZW50IEFQSSB2ZXJzaW9uIChwcm9ibGVtcyB3aXRoIElFLCBkb24ndCBleGVjdXRlIGlmcmFtZS1odG1sIHNjcmlwdHMpICovXHJcbiAgICAvKnZhciBpZnJhbWVEb2MgPVxyXG4gICAgLy8gVzNDIGNvbXBsaWFudDogbnMsIGZpcmVmb3gtZ2Vja28sIGNocm9tZS9zYWZhcmktd2Via2l0LCBvcGVyYSwgaWU5XHJcbiAgICBpZnJhbWUuY29udGVudERvY3VtZW50IHx8XHJcbiAgICAvLyBvbGQgSUUgKDUuNSspXHJcbiAgICAoaWZyYW1lLmNvbnRlbnRXaW5kb3cgPyBpZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudCA6IG51bGwpIHx8XHJcbiAgICAvLyBmYWxsYmFjayAodmVyeSBvbGQgSUU/KVxyXG4gICAgZG9jdW1lbnQuZnJhbWVzW2lmcmFtZS5pZF0uZG9jdW1lbnQ7XHJcbiAgICBpZnJhbWVEb2Mub3BlbigpO1xyXG4gICAgaWZyYW1lRG9jLndyaXRlKGh0bWwpO1xyXG4gICAgaWZyYW1lRG9jLmNsb3NlKCk7Ki9cclxuXHJcbiAgICAvKiBqYXZhc2NyaXB0IFVSSSB2ZXJzaW9uICh3b3JrcyBmaW5lIGV2ZXJ5d2hlcmUhKSAqL1xyXG4gICAgaWZyYW1lLmNvbnRlbnRXaW5kb3cuY29udGVudHMgPSBodG1sO1xyXG4gICAgaWZyYW1lLnNyYyA9ICdqYXZhc2NyaXB0OndpbmRvd1tcImNvbnRlbnRzXCJdJztcclxuXHJcbiAgICAvLyBBYm91dCB0aGlzIHRlY2huaXF1ZSwgdGhpcyBodHRwOi8vc3BhcmVjeWNsZXMud29yZHByZXNzLmNvbS8yMDEyLzAzLzA4L2luamVjdC1jb250ZW50LWludG8tYS1uZXctaWZyYW1lL1xyXG59XHJcblxyXG4iLCIvKiBDUlVETCBIZWxwZXIgKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG52YXIgZ2V0VGV4dCA9IHJlcXVpcmUoJy4vZ2V0VGV4dCcpO1xyXG52YXIgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcblxyXG5leHBvcnRzLmRlZmF1bHRTZXR0aW5ncyA9IHtcclxuICBlZmZlY3RzOiB7XHJcbiAgICAnc2hvdy12aWV3ZXInOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSxcclxuICAgICdoaWRlLXZpZXdlcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LFxyXG4gICAgJ3Nob3ctZWRpdG9yJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sIC8vIHRoZSBzYW1lIGFzIGpxdWVyeS11aSB7IGVmZmVjdDogJ3NsaWRlJywgZHVyYXRpb246ICdzbG93JywgZGlyZWN0aW9uOiAnZG93bicgfVxyXG4gICAgJ2hpZGUtZWRpdG9yJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH1cclxuICB9LFxyXG4gIGV2ZW50czoge1xyXG4gICAgJ2VkaXQtZW5kcyc6ICdjcnVkbC1lZGl0LWVuZHMnLFxyXG4gICAgJ2VkaXQtc3RhcnRzJzogJ2NydWRsLWVkaXQtc3RhcnRzJyxcclxuICAgICdlZGl0b3ItcmVhZHknOiAnY3J1ZGwtZWRpdG9yLXJlYWR5JyxcclxuICAgICdlZGl0b3Itc2hvd2VkJzogJ2NydWRsLWVkaXRvci1zaG93ZWQnLFxyXG4gICAgJ2VkaXRvci1oaWRkZW4nOiAnY3J1ZGwtZWRpdG9yLWhpZGRlbicsXHJcbiAgICAnY3JlYXRlJzogJ2NydWRsLWNyZWF0ZScsXHJcbiAgICAndXBkYXRlJzogJ2NydWRsLXVwZGF0ZScsXHJcbiAgICAnZGVsZXRlJzogJ2NydWRsLWRlbGV0ZSdcclxuICB9LFxyXG4gIGRhdGE6IHtcclxuICAgICdmb2N1cy1jbG9zZXN0Jzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtY2xvc2VzdCcsXHJcbiAgICAgICdkZWZhdWx0JzogJyonXHJcbiAgICB9LFxyXG4gICAgJ2ZvY3VzLW1hcmdpbic6IHtcclxuICAgICAgbmFtZTogJ2NydWRsLWZvY3VzLW1hcmdpbicsXHJcbiAgICAgICdkZWZhdWx0JzogMFxyXG4gICAgfSxcclxuICAgICdmb2N1cy1kdXJhdGlvbic6IHtcclxuICAgICAgbmFtZTogJ2NydWRsLWZvY3VzLWR1cmF0aW9uJyxcclxuICAgICAgJ2RlZmF1bHQnOiAyMDBcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICBVdGlsaXR5IHRvIGdldCBhIGRhdGEgdmFsdWUgb3IgdGhlIGRlZmF1bHQgYmFzZWQgb24gdGhlIGluc3RhbmNlXHJcbiAgc2V0dGluZ3Mgb24gdGhlIGdpdmVuIGVsZW1lbnRcclxuKiovXHJcbmZ1bmN0aW9uIGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgZWwsIHNldHRpbmdOYW1lKSB7XHJcbiAgdmFyXHJcbiAgICBzZXR0aW5nID0gaW5zdGFuY2Uuc2V0dGluZ3MuZGF0YVtzZXR0aW5nTmFtZV0sXHJcbiAgICB2YWwgPSBlbC5kYXRhKHNldHRpbmcubmFtZSkgfHwgc2V0dGluZ1snZGVmYXVsdCddO1xyXG4gIHJldHVybiB2YWw7XHJcbn1cclxuXHJcbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiBzZXR1cENydWRsKG9uU3VjY2Vzcywgb25FcnJvciwgb25Db21wbGV0ZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICBvbjogZnVuY3Rpb24gb24oc2VsZWN0b3IsIHNldHRpbmdzKSB7XHJcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgJy5jcnVkbCc7XHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IHtcclxuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXHJcbiAgICAgICAgZWxlbWVudHM6ICQoc2VsZWN0b3IpXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIEV4dGVuZGluZyBkZWZhdWx0IHNldHRpbmdzIHdpdGggcHJvdmlkZWQgb25lcyxcclxuICAgICAgLy8gYnV0IHNvbWUgY2FuIGJlIHR3ZWFrIG91dHNpZGUgdG9vLlxyXG4gICAgICBpbnN0YW5jZS5zZXR0aW5ncyA9ICQuZXh0ZW5kKHRydWUsIGV4cG9ydHMuZGVmYXVsdFNldHRpbmdzLCBzZXR0aW5ncyk7XHJcbiAgICAgIGluc3RhbmNlLmVsZW1lbnRzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjcnVkbCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKGNydWRsLmRhdGEoJ19fY3J1ZGxfaW5pdGlhbGl6ZWRfXycpID09PSB0cnVlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGRjdHggPSBjcnVkbC5kYXRhKCdjcnVkbC1jb250ZXh0JykgfHwgJyc7XHJcbiAgICAgICAgdmFyIHZ3ciA9IGNydWRsLmZpbmQoJy5jcnVkbC12aWV3ZXInKTtcclxuICAgICAgICB2YXIgZHRyID0gY3J1ZGwuZmluZCgnLmNydWRsLWVkaXRvcicpO1xyXG4gICAgICAgIHZhciBpaWRwYXIgPSBjcnVkbC5kYXRhKCdjcnVkbC1pdGVtLWlkLXBhcmFtZXRlcicpIHx8ICdJdGVtSUQnO1xyXG4gICAgICAgIHZhciBmb3JtcGFycyA9IHsgYWN0aW9uOiAnY3JlYXRlJyB9O1xyXG4gICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSAwO1xyXG4gICAgICAgIHZhciBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldEV4dHJhUXVlcnkoZWwpIHtcclxuICAgICAgICAgIC8vIEdldCBleHRyYSBxdWVyeSBvZiB0aGUgZWxlbWVudCwgaWYgYW55OlxyXG4gICAgICAgICAgdmFyIHhxID0gZWwuZGF0YSgnY3J1ZGwtZXh0cmEtcXVlcnknKSB8fCAnJztcclxuICAgICAgICAgIGlmICh4cSkgeHEgPSAnJicgKyB4cTtcclxuICAgICAgICAgIC8vIEl0ZXJhdGUgYWxsIHBhcmVudHMgaW5jbHVkaW5nIHRoZSAnY3J1ZGwnIGVsZW1lbnQgKHBhcmVudHNVbnRpbCBleGNsdWRlcyB0aGUgZmlyc3QgZWxlbWVudCBnaXZlbixcclxuICAgICAgICAgIC8vIGJlY2F1c2Ugb2YgdGhhdCB3ZSBnZXQgaXRzIHBhcmVudCgpKVxyXG4gICAgICAgICAgLy8gRm9yIGFueSBvZiB0aGVtIHdpdGggYW4gZXh0cmEtcXVlcnksIGFwcGVuZCBpdDpcclxuICAgICAgICAgIGVsLnBhcmVudHNVbnRpbChjcnVkbC5wYXJlbnQoKSwgJ1tkYXRhLWNydWRsLWV4dHJhLXF1ZXJ5XScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgeCA9ICQodGhpcykuZGF0YSgnY3J1ZGwtZXh0cmEtcXVlcnknKTtcclxuICAgICAgICAgICAgaWYgKHgpIHhxICs9ICcmJyArIHg7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHJldHVybiB4cTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNydWRsLmZpbmQoJy5jcnVkbC1jcmVhdGUnKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gMDtcclxuICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICdjcmVhdGUnO1xyXG4gICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuICAgICAgICAgIGR0ci5yZWxvYWQoe1xyXG4gICAgICAgICAgICB1cmw6IGZ1bmN0aW9uICh1cmwsIGRlZmF1bHRVcmwpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdFVybCArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBkdHIueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy1lZGl0b3InXSlcclxuICAgICAgICAgICAgICAucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1zaG93ZWQnXSwgW2R0cl0pO1xyXG4gICAgICAgICAgICAgICAgZHRyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBIaWRlIHZpZXdlciB3aGVuIGluIGVkaXRvcjpcclxuICAgICAgICAgIHZ3ci54aGlkZShpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLXZpZXdlciddKTtcclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10pXHJcbiAgICAgICAgICAudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHMuY3JlYXRlKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZ3clxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLXVwZGF0ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgaXRlbSA9ICR0LmNsb3Nlc3QoJy5jcnVkbC1pdGVtJyk7XHJcbiAgICAgICAgICB2YXIgaXRlbWlkID0gaXRlbS5kYXRhKCdjcnVkbC1pdGVtLWlkJyk7XHJcbiAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gaXRlbWlkO1xyXG4gICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ3VwZGF0ZSc7XHJcbiAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG4gICAgICAgICAgZHRyLnJlbG9hZCh7XHJcbiAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKHVybCwgZGVmYXVsdFVybCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VXJsICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGR0ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LWVkaXRvciddKVxyXG4gICAgICAgICAgICAgIC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgICBkdHIuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEhpZGUgdmlld2VyIHdoZW4gaW4gZWRpdG9yOlxyXG4gICAgICAgICAgdndyLnhoaWRlKGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtdmlld2VyJ10pO1xyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSlcclxuICAgICAgICAgIC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50cy51cGRhdGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLWRlbGV0ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgaXRlbSA9ICR0LmNsb3Nlc3QoJy5jcnVkbC1pdGVtJyk7XHJcbiAgICAgICAgICB2YXIgaXRlbWlkID0gaXRlbS5kYXRhKCdjcnVkbC1pdGVtLWlkJyk7XHJcblxyXG4gICAgICAgICAgaWYgKGNvbmZpcm0oZ2V0VGV4dCgnY29uZmlybS1kZWxldGUtY3J1ZGwtaXRlbS1tZXNzYWdlOicgKyBkY3R4KSkpIHtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbignPGRpdj4nICsgZ2V0VGV4dCgnZGVsZXRlLWNydWRsLWl0ZW0tbG9hZGluZy1tZXNzYWdlOicgKyBkY3R4KSArICc8L2Rpdj4nLCBpdGVtKTtcclxuICAgICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IGl0ZW1pZDtcclxuICAgICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ2RlbGV0ZSc7XHJcbiAgICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgdXJsOiBkdHIuYXR0cignZGF0YS1zb3VyY2UtdXJsJykgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxLFxyXG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJzxkaXY+JyArIGRhdGEuUmVzdWx0ICsgJzwvZGl2PicsIGl0ZW0sIG51bGwsIHtcclxuICAgICAgICAgICAgICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uZmFkZU91dCgnc2xvdycsIGZ1bmN0aW9uICgpIHsgaXRlbS5yZW1vdmUoKTsgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoZGF0YSwgdGV4dCwgangpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgICAgICAgICAgICAgIG9uRXJyb3IoangsIG1lc3NhZ2UsIGV4KTtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKGl0ZW0pO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgY29tcGxldGU6IG9uQ29tcGxldGVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZGVsZXRlJ10pO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZmluaXNoRWRpdCgpIHtcclxuICAgICAgICAgIGZ1bmN0aW9uIG9uY29tcGxldGUoYW5vdGhlck9uQ29tcGxldGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAvLyBTaG93IGFnYWluIHRoZSBWaWV3ZXJcclxuICAgICAgICAgICAgICAvL3Z3ci5zbGlkZURvd24oJ3Nsb3cnKTtcclxuICAgICAgICAgICAgICBpZiAoIXZ3ci5pcygnOnZpc2libGUnKSlcclxuICAgICAgICAgICAgICAgIHZ3ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LXZpZXdlciddKTtcclxuICAgICAgICAgICAgICAvLyBNYXJrIHRoZSBmb3JtIGFzIHVuY2hhbmdlZCB0byBhdm9pZCBwZXJzaXN0aW5nIHdhcm5pbmdzXHJcbiAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZHRyLmZpbmQoJ2Zvcm0nKS5nZXQoMCkpO1xyXG4gICAgICAgICAgICAgIC8vIEF2b2lkIGNhY2hlZCBjb250ZW50IG9uIHRoZSBFZGl0b3JcclxuICAgICAgICAgICAgICBkdHIuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gU2Nyb2xsIHRvIHByZXNlcnZlIGNvcnJlY3QgZm9jdXMgKG9uIGxhcmdlIHBhZ2VzIHdpdGggc2hhcmVkIGNvbnRlbnQgdXNlciBjYW4gZ2V0XHJcbiAgICAgICAgICAgICAgLy8gbG9zdCBhZnRlciBhbiBlZGl0aW9uKVxyXG4gICAgICAgICAgICAgIC8vICh3ZSBxdWV1ZSBhZnRlciB2d3IueHNob3cgYmVjYXVzZSB3ZSBuZWVkIHRvIGRvIGl0IGFmdGVyIHRoZSB4c2hvdyBmaW5pc2gpXHJcbiAgICAgICAgICAgICAgdndyLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c0Nsb3Nlc3QgPSBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGNydWRsLCAnZm9jdXMtY2xvc2VzdCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzRWxlbWVudCA9IGNydWRsLmNsb3Nlc3QoZm9jdXNDbG9zZXN0KTtcclxuICAgICAgICAgICAgICAgIC8vIElmIG5vIGNsb3Nlc3QsIGdldCB0aGUgY3J1ZGxcclxuICAgICAgICAgICAgICAgIGlmIChmb2N1c0VsZW1lbnQubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICBmb2N1c0VsZW1lbnQgPSBjcnVkbDtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c01hcmdpbiA9IGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgY3J1ZGwsICdmb2N1cy1tYXJnaW4nKTtcclxuICAgICAgICAgICAgICAgIHZhciBmb2N1c0R1cmF0aW9uID0gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBjcnVkbCwgJ2ZvY3VzLWR1cmF0aW9uJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oZm9jdXNFbGVtZW50LCB7IG1hcmdpblRvcDogZm9jdXNNYXJnaW4sIGR1cmF0aW9uOiBmb2N1c0R1cmF0aW9uIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHZ3ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIHVzZXIgY2FsbGJhY2s6XHJcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoYW5vdGhlck9uQ29tcGxldGUpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgYW5vdGhlck9uQ29tcGxldGUuYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gTk9URTogRmlyc3QsIHdlIG5vdGlmeSB0aGUgY2hhbmdlcy1zYXZlZCBhbmQgZXZlbnQsIHRoaXMgbGFzdCBhbGxvd3NcclxuICAgICAgICAgIC8vIGNsaWVudCBzY3JpcHRzIHRvIGRvIHRhc2tzIGp1c3QgYmVmb3JlIHRoZSBlZGl0b3IgYmVnaW5zIHRvIGNsb3NlXHJcbiAgICAgICAgICAvLyAoYXZvaWRpbmcgcHJvYmxlbXMgbGlrZSB3aXRoIHRoZSAnbW92ZUZvY3VzVG8nIG5vdCBiZWluZyBwcmVjaXNlIGlmIHRoZVxyXG4gICAgICAgICAgLy8gYW5pbWF0aW9uIGR1cmF0aW9uIGlzIHRoZSBzYW1lIG9uIGNsaWVudCBzY3JpcHQgYW5kIGhpZGUtZWRpdG9yKS5cclxuICAgICAgICAgIC8vIFRoZW4sIGVkaXRvciBnZXRzIGhpZGRlblxyXG4gICAgICAgICAgLy8gVE9ETzogVGhpcyBjYW4gZ2V0IGVuaGFuY2VkIHRvIGFsbG93IGxhcmdlciBkdXJhdGlvbnMgb24gY2xpZW50LXNjcmlwdHNcclxuICAgICAgICAgIC8vIHdpdGhvdXQgYWZmZWN0IG1vdmVGb2N1c1RvIHBhc3NpbmcgaW4gdGhlIHRyaWdnZXIgYW4gb2JqZWN0IHRoYXQgaG9sZHNcclxuICAgICAgICAgIC8vIGEgUHJvbWlzZS9EZWZlcnJlZCB0byBiZSBzZXQgYnkgY2xpZW50LXNjcmlwdCBhcyAnaGlkZS1lZGl0b3IgJlxyXG4gICAgICAgICAgLy8gdmlld2VyLXNob3cgbXVzdCBzdGFydCB3aGVuIHRoaXMgcHJvbWlzZSBnZXRzIGZ1bGxmaWxsZWQnLCBhbGxvd2luZyB0b1xyXG4gICAgICAgICAgLy8gaGF2ZSBhIHNlcXVlbmNlIChmaXJzdCBjbGllbnQtc2NyaXB0cywgdGhlbiBoaWRlLWVkaXRvcikuXHJcblxyXG4gICAgICAgICAgLy8gTWFyayBmb3JtIGFzIHNhdmVkIHRvIHJlbW92ZSB0aGUgJ2hhcy1jaGFuZ2VzJyBtYXJrXHJcbiAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcblxyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10pO1xyXG5cclxuICAgICAgICAgIC8vIFdlIG5lZWQgYSBjdXN0b20gY29tcGxldGUgY2FsbGJhY2ssIGJ1dCB0byBub3QgcmVwbGFjZSB0aGUgdXNlciBjYWxsYmFjaywgd2VcclxuICAgICAgICAgIC8vIGNsb25lIGZpcnN0IHRoZSBzZXR0aW5ncyBhbmQgdGhlbiBhcHBseSBvdXIgY2FsbGJhY2sgdGhhdCBpbnRlcm5hbGx5IHdpbGwgY2FsbFxyXG4gICAgICAgICAgLy8gdGhlIHVzZXIgY2FsbGJhY2sgcHJvcGVybHkgKGlmIGFueSlcclxuICAgICAgICAgIHZhciB3aXRoY2FsbGJhY2sgPSAkLmV4dGVuZCh0cnVlLCB7fSwgaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS1lZGl0b3InXSk7XHJcbiAgICAgICAgICB3aXRoY2FsbGJhY2suY29tcGxldGUgPSBvbmNvbXBsZXRlKHdpdGhjYWxsYmFjay5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAvLyBIaWRpbmcgZWRpdG9yOlxyXG4gICAgICAgICAgZHRyLnhoaWRlKHdpdGhjYWxsYmFjaylcclxuICAgICAgICAgIC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1oaWRkZW4nXSwgW2R0cl0pO1xyXG4gICAgICAgICAgICAgIGR0ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkdHJcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC1jYW5jZWwnLCBmaW5pc2hFZGl0KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsICcuYWpheC1ib3gnLCBmaW5pc2hFZGl0KVxyXG4gICAgICAgIC8vIEFuIGV2ZW50ZWQgbWV0aG9kOiB0cmlnZ2VyIHRoaXMgZXZlbnQgdG8gZXhlY3V0ZSBhIHZpZXdlciByZWxvYWQ6XHJcbiAgICAgICAgLm9uKCdyZWxvYWRMaXN0JywgJyonLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2d3IuZmluZCgnLmNydWRsLWxpc3QnKS5yZWxvYWQoeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCAnZm9ybSwgZmllbGRzZXQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCB8fCBkYXRhLkNvZGUgPT0gNSB8fCBkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBTaG93IHZpZXdlciBhbmQgcmVsb2FkIGxpc3Q6XHJcbiAgICAgICAgICAgIHZ3ci5maW5kKCcuY3J1ZGwtbGlzdCcpLnJlbG9hZCh7IGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBBIHNtYWxsIGRlbGF5IHRvIGxldCB1c2VyIHRvIHNlZSB0aGUgbmV3IG1lc3NhZ2Ugb24gYnV0dG9uIGJlZm9yZVxyXG4gICAgICAgICAgLy8gaGlkZSBpdCAoYmVjYXVzZSBpcyBpbnNpZGUgdGhlIGVkaXRvcilcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT0gNSlcclxuICAgICAgICAgICAgc2V0VGltZW91dChmaW5pc2hFZGl0LCAxMDAwKTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0sZmllbGRzZXQnLCBmdW5jdGlvbiAoamIsIGZvcm0sIGp4KSB7XHJcbiAgICAgICAgICAvLyBFbWl0IHRoZSAnZWRpdG9yLXJlYWR5JyBldmVudCBvbiBlZGl0b3IgSHRtbCBiZWluZyByZXBsYWNlZFxyXG4gICAgICAgICAgLy8gKGZpcnN0IGxvYWQgb3IgbmV4dCBsb2FkcyBiZWNhdXNlIG9mIHNlcnZlci1zaWRlIHZhbGlkYXRpb24gZXJyb3JzKVxyXG4gICAgICAgICAgLy8gdG8gYWxsb3cgbGlzdGVuZXJzIHRvIGRvIGFueSB3b3JrIG92ZXIgaXRzIChuZXcpIERPTSBlbGVtZW50cy5cclxuICAgICAgICAgIC8vIFRoZSBzZWNvbmQgY3VzdG9tIHBhcmFtZXRlciBwYXNzZWQgbWVhbnMgaXMgbWVhbiB0b1xyXG4gICAgICAgICAgLy8gZGlzdGluZ3Vpc2ggdGhlIGZpcnN0IHRpbWUgY29udGVudCBsb2FkIGFuZCBzdWNjZXNzaXZlIHVwZGF0ZXMgKGR1ZSB0byB2YWxpZGF0aW9uIGVycm9ycykuXHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIFtkdHIsIGVkaXRvckluaXRpYWxMb2FkXSk7XHJcblxyXG4gICAgICAgICAgLy8gTmV4dCB0aW1lczpcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNydWRsLmRhdGEoJ19fY3J1ZGxfaW5pdGlhbGl6ZWRfXycsIHRydWUpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG4iLCIvKipcclxuICBUaGlzIG1vZHVsZSBoYXMgdXRpbGl0aWVzIHRvIGNvbnZlcnQgYSBEYXRlIG9iamVjdCBpbnRvXHJcbiAgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gZm9sbG93aW5nIElTTy04NjAxIHNwZWNpZmljYXRpb24uXHJcbiAgXHJcbiAgSU5DT01QTEVURSBCVVQgVVNFRlVMLlxyXG4gIFxyXG4gIFN0YW5kYXJkIHJlZmVycyB0byBmb3JtYXQgdmFyaWF0aW9uczpcclxuICAtIGJhc2ljOiBtaW5pbXVtIHNlcGFyYXRvcnNcclxuICAtIGV4dGVuZGVkOiBhbGwgc2VwYXJhdG9ycywgbW9yZSByZWFkYWJsZVxyXG4gIEJ5IGRlZmF1bHQsIGFsbCBtZXRob2RzIHByaW50cyB0aGUgYmFzaWMgZm9ybWF0LFxyXG4gIGV4Y2VwdHMgdGhlIHBhcmFtZXRlciAnZXh0ZW5kZWQnIGlzIHNldCB0byB0cnVlXHJcblxyXG4gIFRPRE86XHJcbiAgLSBUWjogYWxsb3cgZm9yIFRpbWUgWm9uZSBzdWZmaXhlcyAocGFyc2UgYWxsb3cgaXQgYW5kIFxyXG4gICAgZGV0ZWN0IFVUQyBidXQgZG8gbm90aGluZyB3aXRoIGFueSB0aW1lIHpvbmUgb2Zmc2V0IGRldGVjdGVkKVxyXG4gIC0gRnJhY3Rpb25zIG9mIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMuZGF0ZVVUQyA9IGZ1bmN0aW9uIGRhdGVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgbSA9IChkYXRlLmdldFVUQ01vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICBkID0gZGF0ZS5nZXRVVENEYXRlKCkudG9TdHJpbmcoKSxcclxuICAgICAgeSA9IGRhdGUuZ2V0VVRDRnVsbFllYXIoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG4gIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgZCA9ICcwJyArIGQ7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiB5ICsgJy0nICsgbSArICctJyArIGQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIHkgKyBtICsgZDtcclxufTtcclxuXHJcbmV4cG9ydHMuZGF0ZUxvY2FsID0gZnVuY3Rpb24gZGF0ZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIG0gPSAoZGF0ZS5nZXRNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgZCA9IGRhdGUuZ2V0RGF0ZSgpLnRvU3RyaW5nKCksXHJcbiAgICAgIHkgPSBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG4gIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgZCA9ICcwJyArIGQ7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiB5ICsgJy0nICsgbSArICctJyArIGQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIHkgKyBtICsgZDtcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzLCBtaW51dGVzIGFuZCBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLnRpbWVMb2NhbCA9IGZ1bmN0aW9uIHRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBzID0gZGF0ZS5nZXRTZWNvbmRzKCkudG9TdHJpbmcoKSxcclxuICAgICAgaG0gPSBleHBvcnRzLnNob3J0VGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKHMubGVuZ3RoID09IDEpXHJcbiAgICBzID0gJzAnICsgcztcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGhtICsgJzonICsgcztcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaG0gKyBzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMsIG1pbnV0ZXMgYW5kIHNlY29uZHMgVVRDXHJcbioqL1xyXG5leHBvcnRzLnRpbWVVVEMgPSBmdW5jdGlvbiB0aW1lVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIHMgPSBkYXRlLmdldFVUQ1NlY29uZHMoKS50b1N0cmluZygpLFxyXG4gICAgICBobSA9IGV4cG9ydHMuc2hvcnRUaW1lVVRDKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKHMubGVuZ3RoID09IDEpXHJcbiAgICBzID0gJzAnICsgcztcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGhtICsgJzonICsgcztcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaG0gKyBzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMgYW5kIG1pbnV0ZXNcclxuKiovXHJcbmV4cG9ydHMuc2hvcnRUaW1lTG9jYWwgPSBmdW5jdGlvbiBzaG9ydFRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBoID0gZGF0ZS5nZXRIb3VycygpLnRvU3RyaW5nKCksXHJcbiAgICAgIG0gPSBkYXRlLmdldE1pbnV0ZXMoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAoaC5sZW5ndGggPT0gMSlcclxuICAgIGggPSAnMCcgKyBoO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBoICsgJzonICsgbTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaCArIG07XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycyBhbmQgbWludXRlcyBVVENcclxuKiovXHJcbmV4cG9ydHMuc2hvcnRUaW1lVVRDID0gZnVuY3Rpb24gc2hvcnRUaW1lVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIGggPSBkYXRlLmdldFVUQ0hvdXJzKCkudG9TdHJpbmcoKSxcclxuICAgICAgbSA9IGRhdGUuZ2V0VVRDTWludXRlcygpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChoLmxlbmd0aCA9PSAxKVxyXG4gICAgaCA9ICcwJyArIGg7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGggKyAnOicgKyBtO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBoICsgbTtcclxufTtcclxuXHJcbi8qKlxyXG4gIFRPRE86IEhvdXJzLCBtaW51dGVzLCBzZWNvbmRzIGFuZCBmcmFjdGlvbnMgb2Ygc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy5sb25nVGltZUxvY2FsID0gZnVuY3Rpb24gbG9uZ1RpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIC8vVE9ET1xyXG59O1xyXG5cclxuLyoqXHJcbiAgVVRDIERhdGUgYW5kIFRpbWUgc2VwYXJhdGVkIGJ5IFQuXHJcbiAgU3RhbmRhcmQgYWxsb3dzIG9taXQgdGhlIHNlcGFyYXRvciBhcyBleGNlcHRpb25hbCwgYm90aCBwYXJ0cyBhZ3JlZW1lbnQsIGNhc2VzO1xyXG4gIGNhbiBiZSBkb25lIHBhc3NpbmcgdHJ1ZSBhcyBvZiBvbWl0U2VwYXJhdG9yIHBhcmFtZXRlciwgYnkgZGVmYXVsdCBmYWxzZS5cclxuKiovXHJcbmV4cG9ydHMuZGF0ZXRpbWVMb2NhbCA9IGZ1bmN0aW9uIGRhdGV0aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQsIG9taXRTZXBhcmF0b3IpIHtcclxuICB2YXIgZCA9IGV4cG9ydHMuZGF0ZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSxcclxuICAgICAgdCA9IGV4cG9ydHMudGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKG9taXRTZXBhcmF0b3IpXHJcbiAgICByZXR1cm4gZCArIHQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGQgKyAnVCcgKyB0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgTG9jYWwgRGF0ZSBhbmQgVGltZSBzZXBhcmF0ZWQgYnkgVC5cclxuICBTdGFuZGFyZCBhbGxvd3Mgb21pdCB0aGUgc2VwYXJhdG9yIGFzIGV4Y2VwdGlvbmFsLCBib3RoIHBhcnRzIGFncmVlbWVudCwgY2FzZXM7XHJcbiAgY2FuIGJlIGRvbmUgcGFzc2luZyB0cnVlIGFzIG9mIG9taXRTZXBhcmF0b3IgcGFyYW1ldGVyLCBieSBkZWZhdWx0IGZhbHNlLlxyXG4qKi9cclxuZXhwb3J0cy5kYXRldGltZVVUQyA9IGZ1bmN0aW9uIGRhdGV0aW1lVVRDKGRhdGUsIGV4dGVuZGVkLCBvbWl0U2VwYXJhdG9yKSB7XHJcbiAgdmFyIGQgPSBleHBvcnRzLmRhdGVVVEMoZGF0ZSwgZXh0ZW5kZWQpLFxyXG4gICAgICB0ID0gZXhwb3J0cy50aW1lVVRDKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKG9taXRTZXBhcmF0b3IpXHJcbiAgICByZXR1cm4gZCArIHQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGQgKyAnVCcgKyB0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgUGFyc2UgYSBzdHJpbmcgaW50byBhIERhdGUgb2JqZWN0IGlmIGlzIGEgdmFsaWQgSVNPLTg2MDEgZm9ybWF0LlxyXG4gIFBhcnNlIHNpbmdsZSBkYXRlLCBzaW5nbGUgdGltZSBvciBkYXRlLXRpbWUgZm9ybWF0cy5cclxuICBJTVBPUlRBTlQ6IEl0IGRvZXMgTk9UIGNvbnZlcnQgYmV0d2VlbiB0aGUgZGF0ZXN0ciBUaW1lWm9uZSBhbmQgdGhlXHJcbiAgbG9jYWwgVGltZVpvbmUgKGVpdGhlciBpdCBhbGxvd3MgZGF0ZXN0ciB0byBpbmNsdWRlZCBUaW1lWm9uZSBpbmZvcm1hdGlvbilcclxuICBUT0RPOiBPcHRpb25hbCBUIHNlcGFyYXRvciBpcyBub3QgYWxsb3dlZC5cclxuICBUT0RPOiBNaWxsaXNlY29uZHMvZnJhY3Rpb25zIG9mIHNlY29uZHMgbm90IHN1cHBvcnRlZFxyXG4qKi9cclxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIHBhcnNlKGRhdGVzdHIpIHtcclxuICB2YXIgZHQgPSBkYXRlc3RyLnNwbGl0KCdUJyksXHJcbiAgICBkYXRlID0gZHRbMF0sXHJcbiAgICB0aW1lID0gZHQubGVuZ3RoID09IDIgPyBkdFsxXSA6IG51bGw7XHJcblxyXG4gIGlmIChkdC5sZW5ndGggPiAyKVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IGZvcm1hdFwiKTtcclxuXHJcbiAgLy8gQ2hlY2sgaWYgZGF0ZSBjb250YWlucyBhIHRpbWU7XHJcbiAgLy8gYmVjYXVzZSBtYXliZSBkYXRlc3RyIGlzIG9ubHkgdGhlIHRpbWUgcGFydFxyXG4gIGlmICgvOnxeXFxkezQsNn1bXlxcLV0oXFwuXFxkKik/KD86WnxbK1xcLV0uKik/JC8udGVzdChkYXRlKSkge1xyXG4gICAgdGltZSA9IGRhdGU7XHJcbiAgICBkYXRlID0gbnVsbDtcclxuICB9XHJcblxyXG4gIHZhciB5LCBtLCBkLCBoLCBtbSwgcywgdHosIHV0YztcclxuXHJcbiAgaWYgKGRhdGUpIHtcclxuICAgIHZhciBkcGFydHMgPSAvKFxcZHs0fSlcXC0/KFxcZHsyfSlcXC0/KFxcZHsyfSkvLmV4ZWMoZGF0ZSk7XHJcbiAgICBpZiAoIWRwYXJ0cylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IGRhdGUgZm9ybWF0XCIpO1xyXG5cclxuICAgIHkgPSBkcGFydHNbMV07XHJcbiAgICBtID0gZHBhcnRzWzJdO1xyXG4gICAgZCA9IGRwYXJ0c1szXTtcclxuICB9XHJcblxyXG4gIGlmICh0aW1lKSB7XHJcbiAgICB2YXIgdHBhcnRzID0gLyhcXGR7Mn0pOj8oXFxkezJ9KSg/Ojo/KFxcZHsyfSkpPyhafFsrXFwtXS4qKT8vLmV4ZWModGltZSk7XHJcbiAgICBpZiAoIXRwYXJ0cylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IHRpbWUgZm9ybWF0XCIpO1xyXG5cclxuICAgIGggPSB0cGFydHNbMV07XHJcbiAgICBtbSA9IHRwYXJ0c1syXTtcclxuICAgIHMgPSB0cGFydHMubGVuZ3RoID4gMyA/IHRwYXJ0c1szXSA6IG51bGw7XHJcbiAgICB0eiA9IHRwYXJ0cy5sZW5ndGggPiA0ID8gdHBhcnRzWzRdIDogbnVsbDtcclxuICAgIC8vIERldGVjdHMgaWYgaXMgYSB0aW1lIGluIFVUQzpcclxuICAgIHV0YyA9IC9eWiQvaS50ZXN0KHR6KTtcclxuICB9XHJcblxyXG4gIC8vIFZhciB0byBob2xkIHRoZSBwYXJzZWQgdmFsdWUsIHdlIHN0YXJ0IHdpdGggdG9kYXksXHJcbiAgLy8gdGhhdCB3aWxsIGZpbGwgdGhlIG1pc3NpbmcgcGFydHNcclxuICB2YXIgcGFyc2VkRGF0ZSA9IG5ldyBEYXRlKCk7XHJcblxyXG4gIGlmIChkYXRlKSB7XHJcbiAgICAvLyBVcGRhdGluZyB0aGUgZGF0ZSBvYmplY3Qgd2l0aCBlYWNoIHllYXIsIG1vbnRoIGFuZCBkYXRlL2RheSBkZXRlY3RlZDpcclxuICAgIGlmICh1dGMpXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0VVRDRnVsbFllYXIoeSwgbSwgZCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0RnVsbFllYXIoeSwgbSwgZCk7XHJcbiAgfVxyXG5cclxuICBpZiAodGltZSkge1xyXG4gICAgaWYgKHV0YylcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRVVENIb3VycyhoLCBtbSwgcyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0SG91cnMoaCwgbW0sIHMpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBBIGRhdGUgd2l0aG91dCB0aW1lIHBhcnQgbXVzdCBiZSBjb25zaWRlcmVkIGFzIDAwOjAwOjAwIGluc3RlYWQgb2YgY3VycmVudCB0aW1lXHJcbiAgICBwYXJzZWREYXRlLnNldEhvdXJzKDAsIDAsIDApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHBhcnNlZERhdGU7XHJcbn07IiwiLyogRGF0ZSBwaWNrZXIgaW5pdGlhbGl6YXRpb24gYW5kIHVzZVxyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cERhdGVQaWNrZXIoKSB7XHJcbiAgICAvLyBEYXRlIFBpY2tlclxyXG4gICAgJC5kYXRlcGlja2VyLnNldERlZmF1bHRzKCQuZGF0ZXBpY2tlci5yZWdpb25hbFskKCdodG1sJykuYXR0cignbGFuZycpXSk7XHJcbiAgICAkKCcuZGF0ZS1waWNrJywgZG9jdW1lbnQpLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIHNob3dBbmltOiAnYmxpbmQnXHJcbiAgICB9KTtcclxuICAgIGFwcGx5RGF0ZVBpY2tlcigpO1xyXG59XHJcbmZ1bmN0aW9uIGFwcGx5RGF0ZVBpY2tlcihlbGVtZW50KSB7XHJcbiAgICAkKFwiLmRhdGUtcGlja1wiLCBlbGVtZW50IHx8IGRvY3VtZW50KVxyXG4gICAgLy8udmFsKG5ldyBEYXRlKCkuYXNTdHJpbmcoJC5kYXRlcGlja2VyLl9kZWZhdWx0cy5kYXRlRm9ybWF0KSlcclxuICAgIC5kYXRlcGlja2VyKHtcclxuICAgICAgICBzaG93QW5pbTogXCJibGluZFwiXHJcbiAgICB9KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdDogc2V0dXBEYXRlUGlja2VyLFxyXG4gICAgICAgIGFwcGx5OiBhcHBseURhdGVQaWNrZXJcclxuICAgIH07XHJcbiIsIi8qIEZvcm1hdCBhIGRhdGUgYXMgWVlZWS1NTS1ERCBpbiBVVEMgZm9yIHNhdmUgdXNcclxuICAgIHRvIGludGVyY2hhbmdlIHdpdGggb3RoZXIgbW9kdWxlcyBvciBhcHBzLlxyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKSB7XHJcbiAgICB2YXIgbSA9IChkYXRlLmdldFVUQ01vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICAgIGQgPSBkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpO1xyXG4gICAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICAgICAgbSA9ICcwJyArIG07XHJcbiAgICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgICAgICBkID0gJzAnICsgZDtcclxuICAgIHJldHVybiBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKSArICctJyArIG0gKyAnLScgKyBkO1xyXG59OyIsIi8qZ2xvYmFsIHdpbmRvdyovXHJcbi8qKlxyXG4gICAgU2ltcGxpZmluZyBzb21lIHVzZXMgb2YgdGhlIEZhY2Vib29rIEFQSVxyXG4gICAgYW5kIHRoZSBsb2FkaW5nIG9mIGl0cyBBUEkgd2l0aCBhICdyZWFkeScgZnVuY3Rpb24uXHJcblxyXG4gICAgT2ZmaWNpYWwgQVBJOiBodHRwczovL2RldmVsb3BlcnMuZmFjZWJvb2suY29tL2RvY3MvZmFjZWJvb2stbG9naW4vbG9naW4tZmxvdy1mb3Itd2ViL3YyLjFcclxuKiovXHJcblxyXG52YXIgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8vIEZhY2Vib29rIEFQSSBzZXR0aW5ncyBnYXRoZXJlZCBmcm9tIHRoZSBjdXJyZW50IHBhZ2VcclxuLy8gb24gZmlyc3QgdXNlOlxyXG52YXIgc2V0dGluZ3MgPSB7XHJcbiAgICBsYW5ndWFnZTogJ2VuLVVTJyxcclxuICAgIGFwcElkOiBudWxsXHJcbn07XHJcblxyXG4vLyBQcml2YXRlIEFQSSBsb2FkaW5nL3JlYWR5IHN0YXR1c1xyXG52YXIgYXBpU3RhdHVzID0ge1xyXG4gICAgcmVhZHk6IGZhbHNlLFxyXG4gICAgbG9hZGluZzogZmFsc2UsXHJcbiAgICAvLyBQcml2YXRlIHN0YXRpYyBjb2xsZWN0aW9uIG9mIGNhbGxiYWNrcyByZWdpc3RlcmVkXHJcbiAgICBzdGFjazogW11cclxufTtcclxuXHJcbi8qKlxyXG4gICAgUmVnaXN0ZXIgYSBjYWxsYmFjayB0byBiZSBleGVjdXRlZCB3aGVuIHRoZVxyXG4gICAgRmFjZWJvb2sgQVBJIGlzIHJlYWR5LlxyXG4gICAgVGhlIGNhbGxiYWNrIHJlY2VpdmVzIGFzIHVuaXF1ZSBwYXJhbWV0ZXJcclxuICAgIHRoZSBGYWNlYm9vayBBUEkgb2JqZWN0ICgnRkInKVxyXG4qKi9cclxuZXhwb3J0cy5yZWFkeSA9IGZ1bmN0aW9uIGZhY2Vib29rUmVhZHkocmVhZHlDYWxsYmFjaykge1xyXG4gICAgXHJcbiAgICBhcGlTdGF0dXMuc3RhY2sucHVzaChyZWFkeUNhbGxiYWNrKTtcclxuXHJcbiAgICBpZiAoYXBpU3RhdHVzLnJlYWR5KSB7XHJcbiAgICAgICAgLy8gRG91YmxlLWNoZWNrIHRoZSBjYWxsYmFjaywgc2luY2UgJ3JlYWQnXHJcbiAgICAgICAgLy8gY291bGQgYmUgbG9hZGVkIGp1c3QgdG8gZm9yY2UgdGhlIEFQSSBwcmUtbG9hZFxyXG4gICAgICAgIGlmICh0eXBlb2YocmVhZHlDYWxsYmFjaykgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgIHJlYWR5Q2FsbGJhY2sod2luZG93LkZCKTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCFmYWNlYm9va1JlYWR5LmlzTG9hZGluZykge1xyXG4gICAgICAgIGFwaVN0YXR1cy5sb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8gR2V0IHNldHRpbmdzIGZyb20gcGFnZSBhdHRyaWJ1dGVzXHJcbiAgICAgICAgc2V0dGluZ3MubGFuZ3VhZ2UgPSAkKCdbZGF0YS1mYWNlYm9vay1sYW5ndWFnZV0nKS5kYXRhKCdmYWNlYm9vay1sYW5ndWFnZScpO1xyXG4gICAgICAgIHNldHRpbmdzLmFwcElkID0gJCgnW2RhdGEtZmFjZWJvb2stYXBwaWRdJykuZGF0YSgnZmFjZWJvb2stYXBwaWQnKTtcclxuXHJcbiAgICAgICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICAgICAgICBzY3JpcHRzOiBbJy8vY29ubmVjdC5mYWNlYm9vay5uZXQvJyArIHNldHRpbmdzLmxhbmd1YWdlICsgJy9hbGwuanMnXSxcclxuICAgICAgICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHsgcmV0dXJuICEhd2luZG93LkZCOyB9LFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gSW5pdGlhbGl6ZSAoRmFjZWJvb2sgcmVnaXN0ZXJzIGl0c2VsZiBhcyBnbG9iYWwgJ0ZCJylcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5GQi5pbml0KHsgYXBwSWQ6IHNldHRpbmdzLmFwcElkLCBzdGF0dXM6IHRydWUsIGNvb2tpZTogdHJ1ZSwgeGZibWw6IGZhbHNlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElzIHJlYWR5XHJcbiAgICAgICAgICAgICAgICBhcGlTdGF0dXMucmVhZHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgYXBpU3RhdHVzLmxvYWRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBFeGVjdXRlIGNhbGxiYWNrcyBpbiB0aGUgc3RhY2s6XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFwaVN0YXR1cy5zdGFjay5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaVN0YXR1cy5zdGFja1tpXSh3aW5kb3cuRkIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICAgIFJlcXVlc3QgYSBGYWNlYm9vayBMb2dpbiwgZXhlY3V0aW5nIHRoZSBzdWNjZXNzXHJcbiAgICBvciBlcnJvciBjYWxsYmFjayBkZXBlbmRpbmcgb24gdGhlIHJlc3BvbnNlLlxyXG4gICAgU3VjY2VzcyBnZXRzIHRoZSAnYXV0aFJlc3BvbnNlJyBnaXZlbiBieSBGYWNlYm9vayxcclxuICAgIGFuZCBlcnJvciB0aGUgd2hvbGUgcmVzcG9uc2Ugb2JqZWN0LCBhbmQgYm90aFxyXG4gICAgdGhlIEZCIEFQSSBhcyBzZWNvbmQgcGFyYW1ldGVyLlxyXG4qKi9cclxuZXhwb3J0cy5sb2dpbiA9IGZ1bmN0aW9uIGZhY2Vib29rTG9naW4ob3B0aW9ucywgc3VjY2VzcywgZXJyb3IpIHtcclxuICAgIC8vIFdoZW4gdGhlIEFQSSBpcyByZWFkeVxyXG4gICAgZXhwb3J0cy5yZWFkeShmdW5jdGlvbiAoRkIpIHtcclxuICAgICAgICAvLyBXaGVuIEZhY2Vib29rIGdpdmVzIGEgcmVzcG9uc2UgdG8gdGhlIGZvbGxvd2luZ1xyXG4gICAgICAgIC8vIExvZ2luIFJlcXVlc3RcclxuICAgICAgICBGQi5sb2dpbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgLy8gc3RhdHVzPT1jb25uZWN0ZWQgaWYgdGhlcmUgaXMgYW4gYXV0aFJlc3BvbnNlXHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5hdXRoUmVzcG9uc2UgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoc3VjY2VzcykgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3MocmVzcG9uc2UuYXV0aFJlc3BvbnNlLCBGQik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIChlcnJvcikgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIGVycm9yKHJlc3BvbnNlLCBGQik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCBvcHRpb25zKTtcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogQW4gaTE4biB1dGlsaXR5LCBnZXQgYSB0cmFuc2xhdGlvbiB0ZXh0IGJ5IGxvb2tpbmcgZm9yIHNwZWNpZmljIGVsZW1lbnRzIGluIHRoZSBodG1sXHJcbndpdGggdGhlIG5hbWUgZ2l2ZW4gYXMgZmlyc3QgcGFyYW1lbnRlciBhbmQgYXBwbHlpbmcgdGhlIGdpdmVuIHZhbHVlcyBvbiBzZWNvbmQgYW5kIFxyXG5vdGhlciBwYXJhbWV0ZXJzLlxyXG4gICAgVE9ETzogUkUtSU1QTEVNRU5UIG5vdCB1c2luZyBqUXVlcnkgbmVsc2UgRE9NIGVsZW1lbnRzLCBvciBhbG1vc3Qgbm90IGVsZW1lbnRzIGluc2lkZSBib2R5XHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxuZnVuY3Rpb24gZ2V0VGV4dCgpIHtcclxuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgLy8gR2V0IGtleSBhbmQgdHJhbnNsYXRlIGl0XHJcbiAgICB2YXIgZm9ybWF0dGVkID0gYXJnc1swXTtcclxuICAgIHZhciB0ZXh0ID0gJCgnI2xjcmVzLScgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGZvcm1hdHRlZCkpLnRleHQoKTtcclxuICAgIGlmICh0ZXh0KVxyXG4gICAgICAgIGZvcm1hdHRlZCA9IHRleHQ7XHJcbiAgICAvLyBBcHBseSBmb3JtYXQgdG8gdGhlIHRleHQgd2l0aCBhZGRpdGlvbmFsIHBhcmFtZXRlcnNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCdcXFxceycgKyBpICsgJ1xcXFx9JywgJ2dpJyk7XHJcbiAgICAgICAgZm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UocmVnZXhwLCBhcmdzW2kgKyAxXSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZm9ybWF0dGVkO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFRleHQ7IiwiLyoqIFJldHVybnMgdGhlIHBhdGggdG8gdGhlIGdpdmVuIGVsZW1lbnQgaW4gWFBhdGggY29udmVudGlvblxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGdldFhQYXRoKGVsZW1lbnQpIHtcclxuICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnQuaWQpXHJcbiAgICAgICAgcmV0dXJuICcvLypbQGlkPVwiJyArIGVsZW1lbnQuaWQgKyAnXCJdJztcclxuICAgIHZhciB4cGF0aCA9ICcnO1xyXG4gICAgZm9yICg7IGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PSAxOyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gJChlbGVtZW50LnBhcmVudE5vZGUpLmNoaWxkcmVuKGVsZW1lbnQudGFnTmFtZSkuaW5kZXgoZWxlbWVudCkgKyAxO1xyXG4gICAgICAgIGlkID0gKGlkID4gMSA/ICdbJyArIGlkICsgJ10nIDogJycpO1xyXG4gICAgICAgIHhwYXRoID0gJy8nICsgZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgKyBpZCArIHhwYXRoO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHhwYXRoO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFhQYXRoO1xyXG4iLCIvLyBJdCBleGVjdXRlcyB0aGUgZ2l2ZW4gJ3JlYWR5JyBmdW5jdGlvbiBhcyBwYXJhbWV0ZXIgd2hlblxyXG4vLyBtYXAgZW52aXJvbm1lbnQgaXMgcmVhZHkgKHdoZW4gZ29vZ2xlIG1hcHMgYXBpIGFuZCBzY3JpcHQgaXNcclxuLy8gbG9hZGVkIGFuZCByZWFkeSB0byB1c2UsIG9yIGlubWVkaWF0ZWx5IGlmIGlzIGFscmVhZHkgbG9hZGVkKS5cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpO1xyXG5cclxuLy8gUHJpdmF0ZSBzdGF0aWMgY29sbGVjdGlvbiBvZiBjYWxsYmFja3MgcmVnaXN0ZXJlZFxyXG52YXIgc3RhY2sgPSBbXTtcclxuXHJcbnZhciBnb29nbGVNYXBSZWFkeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ29vZ2xlTWFwUmVhZHkocmVhZHkpIHtcclxuICAgIHN0YWNrLnB1c2gocmVhZHkpO1xyXG5cclxuICAgIGlmIChnb29nbGVNYXBSZWFkeS5pc1JlYWR5KVxyXG4gICAgICAgIHJlYWR5KCk7XHJcbiAgICBlbHNlIGlmICghZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nKSB7XHJcbiAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nID0gdHJ1ZTtcclxuICAgICAgICBsb2FkZXIubG9hZCh7XHJcbiAgICAgICAgICAgIHNjcmlwdHM6IFsnaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9qc2FwaSddLFxyXG4gICAgICAgICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogZnVuY3Rpb24gKCkgeyByZXR1cm4gISF3aW5kb3cuZ29vZ2xlOyB9LFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZ29vZ2xlLmxvYWQoJ21hcHMnLCAnMy4xNicsXHJcbiAgICAgICAgICAgICAgICAgICAgeyBvdGhlcl9wYXJhbXM6ICdzZW5zb3I9ZmFsc2UnLCBjYWxsYmFjazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnb29nbGVNYXBSZWFkeS5pc1JlYWR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFja1tpXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuXHJcbi8vIFV0aWxpdHkgdG8gZm9yY2UgdGhlIHJlZnJlc2ggb2YgbWFwcyB0aGF0IHNvbHZlIHRoZSBwcm9ibGVtIHdpdGggYmFkLXNpemVkIG1hcCBhcmVhXHJcbmdvb2dsZU1hcFJlYWR5LnJlZnJlc2hNYXAgPSBmdW5jdGlvbiByZWZyZXNoTWFwcyhtYXApIHtcclxuICAgIGdvb2dsZU1hcFJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBEb24ndCBmb3JnZXQgdGhlIGNlbnRlciFcclxuICAgICAgICB2YXIgY2VudGVyID0gbWFwLmdldENlbnRlcigpO1xyXG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyT25jZShtYXAsICdyZXNpemUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFJlc3RvcmUgY2VudGVyXHJcbiAgICAgICAgICAgIGlmIChjZW50ZXIpXHJcbiAgICAgICAgICAgICAgICBtYXAuc2V0Q2VudGVyKGNlbnRlcik7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlcihtYXAsICdyZXNpemUnKTtcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiBHVUlEIEdlbmVyYXRvclxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBndWlkR2VuZXJhdG9yKCkge1xyXG4gICAgdmFyIFM0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKSB8IDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIChTNCgpICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFM0KCkgKyBTNCgpKTtcclxufTsiLCIvKipcclxuICAgIEdlbmVyaWMgc2NyaXB0IGZvciBmaWVsZHNldHMgd2l0aCBjbGFzcyAuaGFzLWNvbmZpcm0sIGFsbG93aW5nIHNob3dcclxuICAgIHRoZSBjb250ZW50IG9ubHkgaWYgdGhlIG1haW4gY29uZmlybSBmaWVsZHMgaGF2ZSAneWVzJyBzZWxlY3RlZC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG52YXIgZGVmYXVsdFNlbGVjdG9yID0gJ2ZpZWxkc2V0Lmhhcy1jb25maXJtID4gLmNvbmZpcm0gaW5wdXQnO1xyXG5cclxuZnVuY3Rpb24gb25jaGFuZ2UoKSB7XHJcbiAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgZnMgPSB0LmNsb3Nlc3QoJ2ZpZWxkc2V0Jyk7XHJcbiAgICBpZiAodC5pcygnOmNoZWNrZWQnKSlcclxuICAgICAgICBpZiAodC52YWwoKSA9PSAneWVzJyB8fCB0LnZhbCgpID09ICdUcnVlJylcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3MoJ2NvbmZpcm1lZC1ubycpLmFkZENsYXNzKCdjb25maXJtZWQteWVzJyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcygnY29uZmlybWVkLXllcycpLmFkZENsYXNzKCdjb25maXJtZWQtbm8nKTtcclxufVxyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBkZWZhdWx0U2VsZWN0b3I7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIHNlbGVjdG9yLCBvbmNoYW5nZSk7XHJcbiAgICAvLyBQZXJmb3JtcyBmaXJzdCBjaGVjazpcclxuICAgICQoc2VsZWN0b3IpLmNoYW5nZSgpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5vZmYgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgZGVmYXVsdFNlbGVjdG9yO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9mZignY2hhbmdlJywgc2VsZWN0b3IpO1xyXG59OyIsIi8qIEludGVybmF6aW9uYWxpemF0aW9uIFV0aWxpdGllc1xyXG4gKi9cclxudmFyIGkxOG4gPSB7fTtcclxuaTE4bi5kaXN0YW5jZVVuaXRzID0ge1xyXG4gICAgJ0VTJzogJ2ttJyxcclxuICAgICdVUyc6ICdtaWxlcydcclxufTtcclxuaTE4bi5udW1lcmljTWlsZXNTZXBhcmF0b3IgPSB7XHJcbiAgICAnZXMtRVMnOiAnLicsXHJcbiAgICAnZXMtVVMnOiAnLicsXHJcbiAgICAnZW4tVVMnOiAnLCcsXHJcbiAgICAnZW4tRVMnOiAnLCdcclxufTtcclxuaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvciA9IHtcclxuICAgICdlcy1FUyc6ICcsJyxcclxuICAgICdlcy1VUyc6ICcsJyxcclxuICAgICdlbi1VUyc6ICcuJyxcclxuICAgICdlbi1FUyc6ICcuJ1xyXG59O1xyXG5pMThuLm1vbmV5U3ltYm9sUHJlZml4ID0ge1xyXG4gICAgJ0VTJzogJycsXHJcbiAgICAnVVMnOiAnJCdcclxufTtcclxuaTE4bi5tb25leVN5bWJvbFN1Zml4ID0ge1xyXG4gICAgJ0VTJzogJ+KCrCcsXHJcbiAgICAnVVMnOiAnJ1xyXG59O1xyXG5pMThuLmdldEN1cnJlbnRDdWx0dXJlID0gZnVuY3Rpb24gZ2V0Q3VycmVudEN1bHR1cmUoKSB7XHJcbiAgICB2YXIgYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpO1xyXG4gICAgdmFyIHMgPSBjLnNwbGl0KCctJyk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGN1bHR1cmU6IGMsXHJcbiAgICAgICAgbGFuZ3VhZ2U6IHNbMF0sXHJcbiAgICAgICAgY291bnRyeTogc1sxXVxyXG4gICAgfTtcclxufTtcclxuaTE4bi5jb252ZXJ0TWlsZXNLbSA9IGZ1bmN0aW9uIGNvbnZlcnRNaWxlc0ttKHEsIHVuaXQpIHtcclxuICAgIHZhciBNSUxFU19UT19LTSA9IDEuNjA5O1xyXG4gICAgaWYgKHVuaXQgPT0gJ21pbGVzJylcclxuICAgICAgICByZXR1cm4gTUlMRVNfVE9fS00gKiBxO1xyXG4gICAgZWxzZSBpZiAodW5pdCA9PSAna20nKVxyXG4gICAgICAgIHJldHVybiBxIC8gTUlMRVNfVE9fS007XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykgY29uc29sZS5sb2coJ2NvbnZlcnRNaWxlc0ttOiBVbnJlY29nbml6ZWQgdW5pdCAnICsgdW5pdCk7XHJcbiAgICByZXR1cm4gMDtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gaTE4bjsiLCIvKiBSZXR1cm5zIHRydWUgd2hlbiBzdHIgaXNcclxuLSBudWxsXHJcbi0gZW1wdHkgc3RyaW5nXHJcbi0gb25seSB3aGl0ZSBzcGFjZXMgc3RyaW5nXHJcbiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNFbXB0eVN0cmluZyhzdHIpIHtcclxuICAgIHJldHVybiAhKC9cXFMvZy50ZXN0KHN0ciB8fCBcIlwiKSk7XHJcbn07IiwiLyoqIEFzIHRoZSAnaXMnIGpRdWVyeSBtZXRob2QsIGJ1dCBjaGVja2luZyBAc2VsZWN0b3IgaW4gYWxsIGVsZW1lbnRzXHJcbiogQG1vZGlmaWVyIHZhbHVlczpcclxuKiAtICdhbGwnOiBhbGwgZWxlbWVudHMgbXVzdCBtYXRjaCBzZWxlY3RvciB0byByZXR1cm4gdHJ1ZVxyXG4qIC0gJ2FsbW9zdC1vbmUnOiBhbG1vc3Qgb25lIGVsZW1lbnQgbXVzdCBtYXRjaFxyXG4qIC0gJ3BlcmNlbnRhZ2UnOiByZXR1cm5zIHBlcmNlbnRhZ2UgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbWF0Y2ggc2VsZWN0b3IgKDAtMTAwKVxyXG4qIC0gJ3N1bW1hcnknOiByZXR1cm5zIHRoZSBvYmplY3QgeyB5ZXM6IG51bWJlciwgbm86IG51bWJlciwgcGVyY2VudGFnZTogbnVtYmVyLCB0b3RhbDogbnVtYmVyIH1cclxuKiAtIHtqdXN0OiBhIG51bWJlcn06IGV4YWN0IG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiAtIHthbG1vc3Q6IGEgbnVtYmVyfTogbWluaW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbiogLSB7dW50aWw6IGEgbnVtYmVyfTogbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5hcmUgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIG1vZGlmaWVyKSB7XHJcbiAgICBtb2RpZmllciA9IG1vZGlmaWVyIHx8ICdhbGwnO1xyXG4gICAgdmFyIGNvdW50ID0gMDtcclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuaXMoc2VsZWN0b3IpKVxyXG4gICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgfSk7XHJcbiAgICBzd2l0Y2ggKG1vZGlmaWVyKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID09IGNvdW50O1xyXG4gICAgICAgIGNhc2UgJ2FsbW9zdC1vbmUnOlxyXG4gICAgICAgICAgICByZXR1cm4gY291bnQgPiAwO1xyXG4gICAgICAgIGNhc2UgJ3BlcmNlbnRhZ2UnOlxyXG4gICAgICAgICAgICByZXR1cm4gY291bnQgLyB0aGlzLmxlbmd0aDtcclxuICAgICAgICBjYXNlICdzdW1tYXJ5JzpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHllczogY291bnQsXHJcbiAgICAgICAgICAgICAgICBubzogdGhpcy5sZW5ndGggLSBjb3VudCxcclxuICAgICAgICAgICAgICAgIHBlcmNlbnRhZ2U6IGNvdW50IC8gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICB0b3RhbDogdGhpcy5sZW5ndGhcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ2p1c3QnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci5qdXN0ICE9IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICgnYWxtb3N0JyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuYWxtb3N0ID4gY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCd1bnRpbCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLnVudGlsIDwgY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgIH1cclxufTsiLCIvKiogPT09PT09PT09PT09PT09PT09PVxyXG5FeHRlbnNpb24ganF1ZXJ5OiAnYm91bmRzJ1xyXG5SZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSBjb21iaW5lZCBib3VuZHMgZm9yIGFsbCBcclxuZWxlbWVudHMgaW4gdGhlIGNvbGxlY3Rpb25cclxuKi9cclxuKGZ1bmN0aW9uICgpIHtcclxuICBqUXVlcnkuZm4uYm91bmRzID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwge1xyXG4gICAgICBpbmNsdWRlQm9yZGVyOiBmYWxzZSxcclxuICAgICAgaW5jbHVkZU1hcmdpbjogZmFsc2VcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgdmFyIGJvdW5kcyA9IHtcclxuICAgICAgbGVmdDogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICB0b3A6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcclxuICAgICAgcmlnaHQ6IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcclxuICAgICAgYm90dG9tOiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHdpZHRoOiBOdW1iZXIuTmFOLFxyXG4gICAgICBoZWlnaHQ6IE51bWJlci5OYU5cclxuICAgIH07XHJcblxyXG4gICAgdmFyIGZuV2lkdGggPSBvcHRpb25zLmluY2x1ZGVCb3JkZXIgfHwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luID8gXHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ub3V0ZXJXaWR0aC5jYWxsKGVsLCBvcHRpb25zLmluY2x1ZGVNYXJnaW4pOyB9IDpcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi53aWR0aC5jYWxsKGVsKTsgfTtcclxuICAgIHZhciBmbkhlaWdodCA9IG9wdGlvbnMuaW5jbHVkZUJvcmRlciB8fCBvcHRpb25zLmluY2x1ZGVNYXJnaW4gPyBcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5vdXRlckhlaWdodC5jYWxsKGVsLCBvcHRpb25zLmluY2x1ZGVNYXJnaW4pOyB9IDpcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5oZWlnaHQuY2FsbChlbCk7IH07XHJcblxyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uIChpLCBlbCkge1xyXG4gICAgICB2YXIgZWxRID0gJChlbCk7XHJcbiAgICAgIHZhciBvZmYgPSBlbFEub2Zmc2V0KCk7XHJcbiAgICAgIG9mZi5yaWdodCA9IG9mZi5sZWZ0ICsgZm5XaWR0aCgkKGVsUSkpO1xyXG4gICAgICBvZmYuYm90dG9tID0gb2ZmLnRvcCArIGZuSGVpZ2h0KCQoZWxRKSk7XHJcblxyXG4gICAgICBpZiAob2ZmLmxlZnQgPCBib3VuZHMubGVmdClcclxuICAgICAgICBib3VuZHMubGVmdCA9IG9mZi5sZWZ0O1xyXG5cclxuICAgICAgaWYgKG9mZi50b3AgPCBib3VuZHMudG9wKVxyXG4gICAgICAgIGJvdW5kcy50b3AgPSBvZmYudG9wO1xyXG5cclxuICAgICAgaWYgKG9mZi5yaWdodCA+IGJvdW5kcy5yaWdodClcclxuICAgICAgICBib3VuZHMucmlnaHQgPSBvZmYucmlnaHQ7XHJcblxyXG4gICAgICBpZiAob2ZmLmJvdHRvbSA+IGJvdW5kcy5ib3R0b20pXHJcbiAgICAgICAgYm91bmRzLmJvdHRvbSA9IG9mZi5ib3R0b207XHJcbiAgICB9KTtcclxuXHJcbiAgICBib3VuZHMud2lkdGggPSBib3VuZHMucmlnaHQgLSBib3VuZHMubGVmdDtcclxuICAgIGJvdW5kcy5oZWlnaHQgPSBib3VuZHMuYm90dG9tIC0gYm91bmRzLnRvcDtcclxuICAgIHJldHVybiBib3VuZHM7XHJcbiAgfTtcclxufSkoKTsiLCIvKipcclxuKiBIYXNTY3JvbGxCYXIgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBib29sIHByb3BlcnRpZXMgJ3ZlcnRpY2FsJyBhbmQgJ2hvcml6b250YWwnXHJcbiogc2F5aW5nIGlmIHRoZSBlbGVtZW50IGhhcyBuZWVkIG9mIHNjcm9sbGJhcnMgZm9yIGVhY2ggZGltZW5zaW9uIG9yIG5vdCAoZWxlbWVudFxyXG4qIGNhbiBuZWVkIHNjcm9sbGJhcnMgYW5kIHN0aWxsIG5vdCBiZWluZyBzaG93ZWQgYmVjYXVzZSB0aGUgY3NzLW92ZXJsZmxvdyBwcm9wZXJ0eVxyXG4qIGJlaW5nIHNldCBhcyAnaGlkZGVuJywgYnV0IHN0aWxsIHdlIGtub3cgdGhhdCB0aGUgZWxlbWVudCByZXF1aXJlcyBpdCBhbmQgaXRzXHJcbiogY29udGVudCBpcyBub3QgYmVpbmcgZnVsbHkgZGlzcGxheWVkKS5cclxuKiBAZXh0cmFnYXAsIGRlZmF1bHRzIHRvIHt4OjAseTowfSwgbGV0cyBzcGVjaWZ5IGFuIGV4dHJhIHNpemUgaW4gcGl4ZWxzIGZvciBlYWNoIGRpbWVuc2lvbiB0aGF0IGFsdGVyIHRoZSByZWFsIGNoZWNrLFxyXG4qIHJlc3VsdGluZyBpbiBhIGZha2UgcmVzdWx0IHRoYXQgY2FuIGJlIGludGVyZXN0aW5nIHRvIGRpc2NhcmQgc29tZSBwaXhlbHMgb2YgZXhjZXNzXHJcbiogc2l6ZSAobmVnYXRpdmUgdmFsdWVzKSBvciBleGFnZXJhdGUgdGhlIHJlYWwgdXNlZCBzaXplIHdpdGggdGhhdCBleHRyYSBwaXhlbHMgKHBvc2l0aXZlIHZhbHVlcykuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5oYXNTY3JvbGxCYXIgPSBmdW5jdGlvbiAoZXh0cmFnYXApIHtcclxuICAgIGV4dHJhZ2FwID0gJC5leHRlbmQoe1xyXG4gICAgICAgIHg6IDAsXHJcbiAgICAgICAgeTogMFxyXG4gICAgfSwgZXh0cmFnYXApO1xyXG4gICAgaWYgKCF0aGlzIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4geyB2ZXJ0aWNhbDogZmFsc2UsIGhvcml6b250YWw6IGZhbHNlIH07XHJcbiAgICAvL25vdGU6IGNsaWVudEhlaWdodD0gaGVpZ2h0IG9mIGhvbGRlclxyXG4gICAgLy9zY3JvbGxIZWlnaHQ9IHdlIGhhdmUgY29udGVudCB0aWxsIHRoaXMgaGVpZ2h0XHJcbiAgICB2YXIgdCA9IHRoaXMuZ2V0KDApO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2ZXJ0aWNhbDogdGhpcy5vdXRlckhlaWdodChmYWxzZSkgPCAodC5zY3JvbGxIZWlnaHQgKyBleHRyYWdhcC55KSxcclxuICAgICAgICBob3Jpem9udGFsOiB0aGlzLm91dGVyV2lkdGgoZmFsc2UpIDwgKHQuc2Nyb2xsV2lkdGggKyBleHRyYWdhcC54KVxyXG4gICAgfTtcclxufTsiLCIvKiogQ2hlY2tzIGlmIGN1cnJlbnQgZWxlbWVudCBvciBvbmUgb2YgdGhlIGN1cnJlbnQgc2V0IG9mIGVsZW1lbnRzIGhhc1xyXG5hIHBhcmVudCB0aGF0IG1hdGNoIHRoZSBlbGVtZW50IG9yIGV4cHJlc3Npb24gZ2l2ZW4gYXMgZmlyc3QgcGFyYW1ldGVyXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5pc0NoaWxkT2YgPSBmdW5jdGlvbiBqUXVlcnlfcGx1Z2luX2lzQ2hpbGRPZihleHApIHtcclxuICAgIHJldHVybiB0aGlzLnBhcmVudHMoKS5maWx0ZXIoZXhwKS5sZW5ndGggPiAwO1xyXG59OyIsIi8qKlxyXG4gICAgR2V0cyB0aGUgaHRtbCBzdHJpbmcgb2YgdGhlIGZpcnN0IGVsZW1lbnQgYW5kIGFsbCBpdHMgY29udGVudC5cclxuICAgIFRoZSAnaHRtbCcgbWV0aG9kIG9ubHkgcmV0cmlldmVzIHRoZSBodG1sIHN0cmluZyBvZiB0aGUgY29udGVudCwgbm90IHRoZSBlbGVtZW50IGl0c2VsZi5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLm91dGVySHRtbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICghdGhpcyB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnO1xyXG4gICAgdmFyIGVsID0gdGhpcy5nZXQoMCk7XHJcbiAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgaWYgKGVsLm91dGVySFRNTClcclxuICAgICAgICBodG1sID0gZWwub3V0ZXJIVE1MO1xyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaHRtbCA9IHRoaXMud3JhcEFsbCgnPGRpdj48L2Rpdj4nKS5wYXJlbnQoKS5odG1sKCk7XHJcbiAgICAgICAgdGhpcy51bndyYXAoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBodG1sO1xyXG59OyIsIi8qKlxyXG4gICAgVXNpbmcgdGhlIGF0dHJpYnV0ZSBkYXRhLXNvdXJjZS11cmwgb24gYW55IEhUTUwgZWxlbWVudCxcclxuICAgIHRoaXMgYWxsb3dzIHJlbG9hZCBpdHMgY29udGVudCBwZXJmb3JtaW5nIGFuIEFKQVggb3BlcmF0aW9uXHJcbiAgICBvbiB0aGUgZ2l2ZW4gVVJMIG9yIHRoZSBvbmUgaW4gdGhlIGF0dHJpYnV0ZTsgdGhlIGVuZC1wb2ludFxyXG4gICAgbXVzdCByZXR1cm4gdGV4dC9odG1sIGNvbnRlbnQuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gRGVmYXVsdCBzdWNjZXNzIGNhbGxiYWNrIGFuZCBwdWJsaWMgdXRpbGl0eSwgYmFzaWMgaG93LXRvIHJlcGxhY2UgZWxlbWVudCBjb250ZW50IHdpdGggZmV0Y2hlZCBodG1sXHJcbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoaHRtbENvbnRlbnQsIGNvbnRleHQpIHtcclxuICAgIGNvbnRleHQgPSAkLmlzUGxhaW5PYmplY3QoY29udGV4dCkgJiYgY29udGV4dCA/IGNvbnRleHQgOiB0aGlzO1xyXG5cclxuICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgLy8gQXZvaWQgZW1wdHkgZG9jdW1lbnRzIGJlaW5nIHBhcnNlZCAocmFpc2UgZXJyb3IpXHJcbiAgICBodG1sQ29udGVudCA9ICQudHJpbShodG1sQ29udGVudCk7XHJcbiAgICBpZiAoaHRtbENvbnRlbnQpIHtcclxuICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgICAgdHJ5IHtcclxuICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChodG1sQ29udGVudCkpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIG5ld2h0bWwgPSAkKGh0bWxDb250ZW50KTtcclxuICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGVsZW1lbnQgPSBjb250ZXh0LmVsZW1lbnQ7XHJcbiAgICBpZiAoY29udGV4dC5vcHRpb25zLm1vZGUgPT0gJ3JlcGxhY2UtbWUnKVxyXG4gICAgICAgIGVsZW1lbnQucmVwbGFjZVdpdGgobmV3aHRtbCk7XHJcbiAgICBlbHNlIC8vICdyZXBsYWNlLWNvbnRlbnQnXHJcbiAgICAgICAgZWxlbWVudC5odG1sKG5ld2h0bWwpO1xyXG5cclxuICAgIHJldHVybiBjb250ZXh0O1xyXG59XHJcblxyXG4vLyBEZWZhdWx0IGNvbXBsZXRlIGNhbGxiYWNrIGFuZCBwdWJsaWMgdXRpbGl0eVxyXG5mdW5jdGlvbiBzdG9wTG9hZGluZ1NwaW5uZXIoKSB7XHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5lbGVtZW50KTtcclxufVxyXG5cclxuLy8gRGVmYXVsdHNcclxudmFyIGRlZmF1bHRzID0ge1xyXG4gICAgdXJsOiBudWxsLFxyXG4gICAgc3VjY2VzczogW3VwZGF0ZUVsZW1lbnRdLFxyXG4gICAgZXJyb3I6IFtdLFxyXG4gICAgY29tcGxldGU6IFtzdG9wTG9hZGluZ1NwaW5uZXJdLFxyXG4gICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgbW9kZTogJ3JlcGxhY2UtY29udGVudCcsXHJcbiAgICBsb2FkaW5nOiB7XHJcbiAgICAgICAgbG9ja0VsZW1lbnQ6IHRydWUsXHJcbiAgICAgICAgbG9ja09wdGlvbnM6IHt9LFxyXG4gICAgICAgIG1lc3NhZ2U6IG51bGwsXHJcbiAgICAgICAgc2hvd0xvYWRpbmdJbmRpY2F0b3I6IHRydWUsXHJcbiAgICAgICAgZGVsYXk6IDBcclxuICAgIH1cclxufTtcclxuXHJcbi8qIFJlbG9hZCBtZXRob2QgKi9cclxudmFyIHJlbG9hZCA9ICQuZm4ucmVsb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gT3B0aW9ucyBmcm9tIGRlZmF1bHRzIChpbnRlcm5hbCBhbmQgcHVibGljKVxyXG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIHJlbG9hZC5kZWZhdWx0cyk7XHJcbiAgICAvLyBJZiBvcHRpb25zIG9iamVjdCBpcyBwYXNzZWQgYXMgdW5pcXVlIHBhcmFtZXRlclxyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSAmJiAkLmlzUGxhaW5PYmplY3QoYXJndW1lbnRzWzBdKSkge1xyXG4gICAgICAgIC8vIE1lcmdlIG9wdGlvbnM6XHJcbiAgICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0aW9ucywgYXJndW1lbnRzWzBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ29tbW9uIG92ZXJsb2FkOiBuZXctdXJsIGFuZCBjb21wbGV0ZSBjYWxsYmFjaywgYm90aCBvcHRpb25hbHNcclxuICAgICAgICBvcHRpb25zLnVybCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogbnVsbDtcclxuICAgICAgICBvcHRpb25zLmNvbXBsZXRlID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMudXJsKSB7XHJcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3B0aW9ucy51cmwpKVxyXG4gICAgICAgICAgICAvLyBGdW5jdGlvbiBwYXJhbXM6IGN1cnJlbnRSZWxvYWRVcmwsIGRlZmF1bHRSZWxvYWRVcmxcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ3NvdXJjZS11cmwnLCAkLnByb3h5KG9wdGlvbnMudXJsLCB0aGlzKSgkdC5kYXRhKCdzb3VyY2UtdXJsJyksICR0LmF0dHIoJ2RhdGEtc291cmNlLXVybCcpKSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ3NvdXJjZS11cmwnLCBvcHRpb25zLnVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB1cmwgPSAkdC5kYXRhKCdzb3VyY2UtdXJsJyk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFscmVhZHkgYmVpbmcgcmVsb2FkZWQsIHRvIGNhbmNlbCBwcmV2aW91cyBhdHRlbXB0XHJcbiAgICAgICAgdmFyIGpxID0gJHQuZGF0YSgnaXNSZWxvYWRpbmcnKTtcclxuICAgICAgICBpZiAoanEpIHtcclxuICAgICAgICAgICAgaWYgKGpxLnVybCA9PSB1cmwpXHJcbiAgICAgICAgICAgICAgICAvLyBJcyB0aGUgc2FtZSB1cmwsIGRvIG5vdCBhYm9ydCBiZWNhdXNlIGlzIHRoZSBzYW1lIHJlc3VsdCBiZWluZyByZXRyaWV2ZWRcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAganEuYWJvcnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9wdGlvbmFsIGRhdGEgcGFyYW1ldGVyICdyZWxvYWQtbW9kZScgYWNjZXB0cyB2YWx1ZXM6IFxyXG4gICAgICAgIC8vIC0gJ3JlcGxhY2UtbWUnOiBVc2UgaHRtbCByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgcmVsb2FkZWQgZWxlbWVudCAoYWthOiByZXBsYWNlV2l0aCgpKVxyXG4gICAgICAgIC8vIC0gJ3JlcGxhY2UtY29udGVudCc6IChkZWZhdWx0KSBIdG1sIHJldHVybmVkIHJlcGxhY2UgY3VycmVudCBlbGVtZW50IGNvbnRlbnQgKGFrYTogaHRtbCgpKVxyXG4gICAgICAgIG9wdGlvbnMubW9kZSA9ICR0LmRhdGEoJ3JlbG9hZC1tb2RlJykgfHwgb3B0aW9ucy5tb2RlO1xyXG5cclxuICAgICAgICBpZiAodXJsKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIGRlbGF5XHJcbiAgICAgICAgICAgIHZhciBsb2FkaW5ndGltZXIgPSBvcHRpb25zLmxvYWRpbmcubG9ja0VsZW1lbnQgP1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRpbmcgY29udGVudCB1c2luZyBhIGZha2UgdGVtcCBwYXJlbnQgZWxlbWVudCB0byBwcmVsb2FkIGltYWdlIGFuZCB0byBnZXQgcmVhbCBtZXNzYWdlIHdpZHRoOlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2FkaW5nY29udGVudCA9ICQoJzxkaXYvPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA/ICQoJzxkaXYgY2xhc3M9XCJsb2FkaW5nLW1lc3NhZ2VcIi8+JykuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5tZXNzYWdlKSA6IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChvcHRpb25zLmxvYWRpbmcuc2hvd0xvYWRpbmdJbmRpY2F0b3IgPyBvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA6IG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdjb250ZW50LmNzcyh7IHBvc2l0aW9uOiAnYWJzb2x1dGUnLCBsZWZ0OiAtOTk5OTkgfSkuYXBwZW5kVG8oJ2JvZHknKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdyA9IGxvYWRpbmdjb250ZW50LndpZHRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ2NvbnRlbnQuZGV0YWNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTG9ja2luZzpcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMuYXV0b2ZvY3VzID0gb3B0aW9ucy5hdXRvZm9jdXM7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zLndpZHRoID0gdztcclxuICAgICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGxvYWRpbmdjb250ZW50Lmh0bWwoKSwgJHQsIG9wdGlvbnMubG9hZGluZy5tZXNzYWdlID8gJ2N1c3RvbS1sb2FkaW5nJyA6ICdsb2FkaW5nJywgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMubG9hZGluZy5kZWxheSlcclxuICAgICAgICAgICAgICAgIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIC8vIFByZXBhcmUgY29udGV4dFxyXG4gICAgICAgICAgICB2YXIgY3R4ID0ge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudDogJHQsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgbG9hZGluZ1RpbWVyOiBsb2FkaW5ndGltZXJcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICAgICAgICAganEgPSAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIGNvbnRleHQ6IGN0eFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVybCBpcyBzZXQgaW4gdGhlIHJldHVybmVkIGFqYXggb2JqZWN0IGJlY2F1c2UgaXMgbm90IHNldCBieSBhbGwgdmVyc2lvbnMgb2YgalF1ZXJ5XHJcbiAgICAgICAgICAgIGpxLnVybCA9IHVybDtcclxuXHJcbiAgICAgICAgICAgIC8vIE1hcmsgZWxlbWVudCBhcyBpcyBiZWluZyByZWxvYWRlZCwgdG8gYXZvaWQgbXVsdGlwbGUgYXR0ZW1wcyBhdCBzYW1lIHRpbWUsIHNhdmluZ1xyXG4gICAgICAgICAgICAvLyBjdXJyZW50IGFqYXggb2JqZWN0IHRvIGFsbG93IGJlIGNhbmNlbGxlZFxyXG4gICAgICAgICAgICAkdC5kYXRhKCdpc1JlbG9hZGluZycsIGpxKTtcclxuICAgICAgICAgICAganEuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ2lzUmVsb2FkaW5nJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2FsbGJhY2tzOiBmaXJzdCBnbG9iYWxzIGFuZCB0aGVuIGZyb20gb3B0aW9ucyBpZiB0aGV5IGFyZSBkaWZmZXJlbnRcclxuICAgICAgICAgICAgLy8gc3VjY2Vzc1xyXG4gICAgICAgICAgICBqcS5kb25lKHJlbG9hZC5kZWZhdWx0cy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3VjY2VzcyAhPSByZWxvYWQuZGVmYXVsdHMuc3VjY2VzcylcclxuICAgICAgICAgICAgICAgIGpxLmRvbmUob3B0aW9ucy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgLy8gZXJyb3JcclxuICAgICAgICAgICAganEuZmFpbChyZWxvYWQuZGVmYXVsdHMuZXJyb3IpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5lcnJvciAhPSByZWxvYWQuZGVmYXVsdHMuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICBqcS5mYWlsKG9wdGlvbnMuZXJyb3IpO1xyXG4gICAgICAgICAgICAvLyBjb21wbGV0ZVxyXG4gICAgICAgICAgICBqcS5hbHdheXMocmVsb2FkLmRlZmF1bHRzLmNvbXBsZXRlKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29tcGxldGUgIT0gcmVsb2FkLmRlZmF1bHRzLmNvbXBsZXRlKVxyXG4gICAgICAgICAgICAgICAganEuZG9uZShvcHRpb25zLmNvbXBsZXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLy8gUHVibGljIGRlZmF1bHRzXHJcbnJlbG9hZC5kZWZhdWx0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cyk7XHJcblxyXG4vLyBQdWJsaWMgdXRpbGl0aWVzXHJcbnJlbG9hZC51cGRhdGVFbGVtZW50ID0gdXBkYXRlRWxlbWVudDtcclxucmVsb2FkLnN0b3BMb2FkaW5nU3Bpbm5lciA9IHN0b3BMb2FkaW5nU3Bpbm5lcjtcclxuXHJcbi8vIE1vZHVsZVxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlbG9hZDsiLCIvKiogRXh0ZW5kZWQgdG9nZ2xlLXNob3ctaGlkZSBmdW50aW9ucy5cclxuICAgIElhZ29TUkxAZ21haWwuY29tXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gKiovXHJcbihmdW5jdGlvbigpe1xyXG5cclxuICAgIC8qKiBJbXBsZW1lbnRhdGlvbjogcmVxdWlyZSBqUXVlcnkgYW5kIHJldHVybnMgb2JqZWN0IHdpdGggdGhlXHJcbiAgICAgICAgcHVibGljIG1ldGhvZHMuXHJcbiAgICAgKiovXHJcbiAgICBmdW5jdGlvbiB4dHNoKGpRdWVyeSkge1xyXG4gICAgICAgIHZhciAkID0galF1ZXJ5O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBIaWRlIGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdoaWRlJyBhbmQgJ2ZhZGVPdXQnIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmZhZGVPdXQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLnNsaWRlVXAob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdoaWRlJ1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmhpZGUob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneGhpZGUnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgKiBTaG93IGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdzaG93JyBhbmQgJ2ZhZGVJbicgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgLy8gV2UgcGVyZm9ybXMgYSBmaXggb24gc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHNcclxuICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gZXJyb3IgdGhhdCBwcmV2ZW50cyBmcm9tIHJ1bm5pbmdcclxuICAgICAgICAgICAgLy8gZWZmZWN0cyBvbiBlbGVtZW50cyB0aGF0IGFyZSBhbHJlYWR5IHZpc2libGUsXHJcbiAgICAgICAgICAgIC8vIHdoYXQgbGV0cyB0aGUgcG9zc2liaWxpdHkgb2YgZ2V0IGEgbWlkZGxlLWFuaW1hdGVkXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gV2UganVzdCBjaGFuZ2UgZGlzcGxheTpub25lLCBmb3JjaW5nIHRvICdpcy12aXNpYmxlJyB0b1xyXG4gICAgICAgICAgICAvLyBiZSBmYWxzZSBhbmQgdGhlbiBydW5uaW5nIHRoZSBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGZsaWNrZXJpbmcgZWZmZWN0LCBiZWNhdXNlIGpRdWVyeSBqdXN0IHJlc2V0c1xyXG4gICAgICAgICAgICAvLyBkaXNwbGF5IG9uIGVmZmVjdCBzdGFydC5cclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mYWRlSW4ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2xpZGVEb3duKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnc2hvdydcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNob3cob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneHNob3cnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdlbmVyaWMgdXRpbGl0eSBmb3IgaGlnaGx5IGNvbmZpZ3VyYWJsZSBqUXVlcnkudG9nZ2xlIHdpdGggc3VwcG9ydFxyXG4gICAgICAgICAgICB0byBzcGVjaWZ5IHRoZSB0b2dnbGUgdmFsdWUgZXhwbGljaXR5IGZvciBhbnkga2luZCBvZiBlZmZlY3Q6IGp1c3QgcGFzcyB0cnVlIGFzIHNlY29uZCBwYXJhbWV0ZXIgJ3RvZ2dsZScgdG8gc2hvd1xyXG4gICAgICAgICAgICBhbmQgZmFsc2UgdG8gaGlkZS4gVG9nZ2xlIG11c3QgYmUgc3RyaWN0bHkgYSBCb29sZWFuIHZhbHVlIHRvIGF2b2lkIGF1dG8tZGV0ZWN0aW9uLlxyXG4gICAgICAgICAgICBUb2dnbGUgcGFyYW1ldGVyIGNhbiBiZSBvbWl0dGVkIHRvIGF1dG8tZGV0ZWN0IGl0LCBhbmQgc2Vjb25kIHBhcmFtZXRlciBjYW4gYmUgdGhlIGFuaW1hdGlvbiBvcHRpb25zLlxyXG4gICAgICAgICAgICBBbGwgdGhlIG90aGVycyBiZWhhdmUgZXhhY3RseSBhcyBoaWRlRWxlbWVudCBhbmQgc2hvd0VsZW1lbnQuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlRWxlbWVudChlbGVtZW50LCB0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIG5vdCBhIGJvb2xlYW5cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSAhPT0gdHJ1ZSAmJiB0b2dnbGUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgYW4gb2JqZWN0LCB0aGVuIGlzIHRoZSBvcHRpb25zIGFzIHNlY29uZCBwYXJhbWV0ZXJcclxuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QodG9nZ2xlKSlcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gdG9nZ2xlO1xyXG4gICAgICAgICAgICAgICAgLy8gQXV0by1kZXRlY3QgdG9nZ2xlLCBpdCBjYW4gdmFyeSBvbiBhbnkgZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIC8vIHRoZW4gZGV0ZWN0aW9uIGFuZCBhY3Rpb24gbXVzdCBiZSBkb25lIHBlciBlbGVtZW50OlxyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXVzaW5nIGZ1bmN0aW9uLCB3aXRoIGV4cGxpY2l0IHRvZ2dsZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgISQodGhpcykuaXMoJzp2aXNpYmxlJyksIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSlcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqIERvIGpRdWVyeSBpbnRlZ3JhdGlvbiBhcyB4dG9nZ2xlLCB4c2hvdywgeGhpZGVcclxuICAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gcGx1Z0luKGpRdWVyeSkge1xyXG4gICAgICAgICAgICAvKiogdG9nZ2xlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHh0b2dnbGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHRvZ2dsZSA9IGZ1bmN0aW9uIHh0b2dnbGUodG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsIHRvZ2dsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBzaG93RWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHNob3cgPSBmdW5jdGlvbiB4c2hvdyhvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIGhpZGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueGhpZGUgPSBmdW5jdGlvbiB4aGlkZShvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb3J0aW5nOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQ6IHRvZ2dsZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHNob3dFbGVtZW50OiBzaG93RWxlbWVudCxcclxuICAgICAgICAgICAgaGlkZUVsZW1lbnQ6IGhpZGVFbGVtZW50LFxyXG4gICAgICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9kdWxlXHJcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgeHRzaCk7XHJcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgICAgICB2YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB4dHNoKGpRdWVyeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIE5vcm1hbCBzY3JpcHQgbG9hZCwgaWYgalF1ZXJ5IGlzIGdsb2JhbCAoYXQgd2luZG93KSwgaXRzIGV4dGVuZGVkIGF1dG9tYXRpY2FsbHkgICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHh0c2god2luZG93LmpRdWVyeSkucGx1Z0luKHdpbmRvdy5qUXVlcnkpO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvKiBTb21lIHV0aWxpdGllcyBmb3IgdXNlIHdpdGggalF1ZXJ5IG9yIGl0cyBleHByZXNzaW9uc1xyXG4gICAgdGhhdCBhcmUgbm90IHBsdWdpbnMuXHJcbiovXHJcbmZ1bmN0aW9uIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbICM7JiwuKyp+XFwnOlwiIV4kW1xcXSgpPT58XFwvXSkvZywgJ1xcXFwkMScpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlOiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlXHJcbiAgICB9O1xyXG4iLCIvKiBBc3NldHMgbG9hZGVyIHdpdGggbG9hZGluZyBjb25maXJtYXRpb24gKG1haW5seSBmb3Igc2NyaXB0cylcclxuICAgIGJhc2VkIG9uIE1vZGVybml6ci95ZXBub3BlIGxvYWRlci5cclxuKi9cclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpO1xyXG5cclxuZXhwb3J0cy5sb2FkID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgc2NyaXB0czogW10sXHJcbiAgICAgICAgY29tcGxldGU6IG51bGwsXHJcbiAgICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IG51bGwsXHJcbiAgICAgICAgbG9hZERlbGF5OiAwLFxyXG4gICAgICAgIHRyaWFsc0ludGVydmFsOiA1MDBcclxuICAgIH0sIG9wdHMpO1xyXG4gICAgaWYgKCFvcHRzLnNjcmlwdHMubGVuZ3RoKSByZXR1cm47XHJcbiAgICBmdW5jdGlvbiBwZXJmb3JtQ29tcGxldGUoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAob3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbikgIT09ICdmdW5jdGlvbicgfHwgb3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbigpKVxyXG4gICAgICAgICAgICBvcHRzLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQocGVyZm9ybUNvbXBsZXRlLCBvcHRzLnRyaWFsc0ludGVydmFsKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS53YXJuKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdMQy5sb2FkLmNvbXBsZXRlVmVyaWZpY2F0aW9uIGZhaWxlZCBmb3IgJyArIG9wdHMuc2NyaXB0c1swXSArICcgcmV0cnlpbmcgaXQgaW4gJyArIG9wdHMudHJpYWxzSW50ZXJ2YWwgKyAnbXMnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKHtcclxuICAgICAgICAgICAgbG9hZDogb3B0cy5zY3JpcHRzLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogb3B0cy5jb21wbGV0ZSA/IHBlcmZvcm1Db21wbGV0ZSA6IG51bGxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChvcHRzLmxvYWREZWxheSlcclxuICAgICAgICBzZXRUaW1lb3V0KGxvYWQsIG9wdHMubG9hZERlbGF5KTtcclxuICAgIGVsc2VcclxuICAgICAgICBsb2FkKCk7XHJcbn07IiwiLyotLS0tLS0tLS0tLS1cclxuVXRpbGl0aWVzIHRvIG1hbmlwdWxhdGUgbnVtYmVycywgYWRkaXRpb25hbGx5XHJcbnRvIHRoZSBvbmVzIGF0IE1hdGhcclxuLS0tLS0tLS0tLS0tKi9cclxuXHJcbi8qKiBFbnVtZXJhdGlvbiB0byBiZSB1c2VzIGJ5IGZ1bmN0aW9ucyB0aGF0IGltcGxlbWVudHMgJ3JvdW5kaW5nJyBvcGVyYXRpb25zIG9uIGRpZmZlcmVudFxyXG5kYXRhIHR5cGVzLlxyXG5JdCBob2xkcyB0aGUgZGlmZmVyZW50IHdheXMgYSByb3VuZGluZyBvcGVyYXRpb24gY2FuIGJlIGFwcGx5LlxyXG4qKi9cclxudmFyIHJvdW5kaW5nVHlwZUVudW0gPSB7XHJcbiAgICBEb3duOiAtMSxcclxuICAgIE5lYXJlc3Q6IDAsXHJcbiAgICBVcDogMVxyXG59O1xyXG5cclxuZnVuY3Rpb24gcm91bmRUbyhudW1iZXIsIGRlY2ltYWxzLCByb3VuZGluZ1R5cGUpIHtcclxuICAgIC8vIGNhc2UgTmVhcmVzdCBpcyB0aGUgZGVmYXVsdDpcclxuICAgIHZhciBmID0gbmVhcmVzdFRvO1xyXG4gICAgc3dpdGNoIChyb3VuZGluZ1R5cGUpIHtcclxuICAgICAgICBjYXNlIHJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgZiA9IGZsb29yVG87XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2Ugcm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgZiA9IGNlaWxUbztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZihudW1iZXIsIGRlY2ltYWxzKTtcclxufVxyXG5cclxuLyoqIFJvdW5kIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdCBjYW4gc3Vic3RyYWN0IGludGVnZXIgZGVjaW1hbHMgYnkgcHJvdmlkaW5nIGEgbmVnYXRpdmVcclxubnVtYmVyIG9mIGRlY2ltYWxzLlxyXG4qKi9cclxuZnVuY3Rpb24gbmVhcmVzdFRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLyoqIFJvdW5kIFVwIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgdXAsXHJcbnRvIHRoZSBsb3dlciBpbnRlZ2VyIGdyZWF0ZXIgb3IgZXF1YWxzIHRvIHRoZSBudW1iZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjZWlsVG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBEb3duIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgZG93bixcclxudG8gdGhlIGJpZ2dlciBpbnRlZ2VyIGxvd2VyIG9yIGVxdWFscyB0byB0aGUgbnVtYmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gZmxvb3JUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICByb3VuZGluZ1R5cGVFbnVtOiByb3VuZGluZ1R5cGVFbnVtLFxyXG4gICAgICAgIHJvdW5kVG86IHJvdW5kVG8sXHJcbiAgICAgICAgbmVhcmVzdFRvOiBuZWFyZXN0VG8sXHJcbiAgICAgICAgY2VpbFRvOiBjZWlsVG8sXHJcbiAgICAgICAgZmxvb3JUbzogZmxvb3JUb1xyXG4gICAgfTsiLCJmdW5jdGlvbiBtb3ZlRm9jdXNUbyhlbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBtYXJnaW5Ub3A6IDMwLFxyXG4gICAgICAgIGR1cmF0aW9uOiA1MDBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiAkKGVsKS5vZmZzZXQoKS50b3AgLSBvcHRpb25zLm1hcmdpblRvcCB9LCBvcHRpb25zLmR1cmF0aW9uLCBudWxsKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vdmVGb2N1c1RvO1xyXG59IiwiLyogU29tZSB1dGlsaXRpZXMgdG8gZm9ybWF0IGFuZCBleHRyYWN0IG51bWJlcnMsIGZyb20gdGV4dCBvciBET00uXHJcbiAqL1xyXG52YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBpMThuID0gcmVxdWlyZSgnLi9pMThuJyksXHJcbiAgICBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBnZXRNb25leU51bWJlcih2LCBhbHQpIHtcclxuICAgIGFsdCA9IGFsdCB8fCAwO1xyXG4gICAgaWYgKHYgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgdiA9IHYudmFsKCkgfHwgdi50ZXh0KCk7XHJcbiAgICB2ID0gcGFyc2VGbG9hdCh2XHJcbiAgICAgICAgLnJlcGxhY2UoL1sk4oKsXS9nLCAnJylcclxuICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKExDLm51bWVyaWNNaWxlc1NlcGFyYXRvcltpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY3VsdHVyZV0sICdnJyksICcnKVxyXG4gICAgKTtcclxuICAgIHJldHVybiBpc05hTih2KSA/IGFsdCA6IHY7XHJcbn1cclxuZnVuY3Rpb24gbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSB7XHJcbiAgICB2YXIgY3VsdHVyZSA9IGkxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jdWx0dXJlO1xyXG4gICAgLy8gRmlyc3QsIHJvdW5kIHRvIDIgZGVjaW1hbHNcclxuICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgLy8gR2V0IHRoZSBkZWNpbWFsIHBhcnQgKHJlc3QpXHJcbiAgICB2YXIgcmVzdCA9IE1hdGgucm91bmQodiAqIDEwMCAlIDEwMCk7XHJcbiAgICByZXR1cm4gKCcnICtcclxuICAgIC8vIEludGVnZXIgcGFydCAobm8gZGVjaW1hbHMpXHJcbiAgICAgICAgTWF0aC5mbG9vcih2KSArXHJcbiAgICAvLyBEZWNpbWFsIHNlcGFyYXRvciBkZXBlbmRpbmcgb24gbG9jYWxlXHJcbiAgICAgICAgaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvcltjdWx0dXJlXSArXHJcbiAgICAvLyBEZWNpbWFscywgZXZlciB0d28gZGlnaXRzXHJcbiAgICAgICAgTWF0aC5mbG9vcihyZXN0IC8gMTApICsgcmVzdCAlIDEwXHJcbiAgICApO1xyXG59XHJcbmZ1bmN0aW9uIG51bWJlclRvTW9uZXlTdHJpbmcodikge1xyXG4gICAgdmFyIGNvdW50cnkgPSBpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY291bnRyeTtcclxuICAgIC8vIFR3byBkaWdpdHMgaW4gZGVjaW1hbHMgZm9yIHJvdW5kZWQgdmFsdWUgd2l0aCBtb25leSBzeW1ib2wgYXMgZm9yXHJcbiAgICAvLyBjdXJyZW50IGxvY2FsZVxyXG4gICAgcmV0dXJuIChpMThuLm1vbmV5U3ltYm9sUHJlZml4W2NvdW50cnldICsgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSArIGkxOG4ubW9uZXlTeW1ib2xTdWZpeFtjb3VudHJ5XSk7XHJcbn1cclxuZnVuY3Rpb24gc2V0TW9uZXlOdW1iZXIodiwgZWwpIHtcclxuICAgIC8vIEdldCB2YWx1ZSBpbiBtb25leSBmb3JtYXQ6XHJcbiAgICB2ID0gbnVtYmVyVG9Nb25leVN0cmluZyh2KTtcclxuICAgIC8vIFNldHRpbmcgdmFsdWU6XHJcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgaWYgKGVsLmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICAgZWwudmFsKHYpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZWwudGV4dCh2KTtcclxuICAgIHJldHVybiB2O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBnZXRNb25leU51bWJlcjogZ2V0TW9uZXlOdW1iZXIsXHJcbiAgICAgICAgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZzogbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyxcclxuICAgICAgICBudW1iZXJUb01vbmV5U3RyaW5nOiBudW1iZXJUb01vbmV5U3RyaW5nLFxyXG4gICAgICAgIHNldE1vbmV5TnVtYmVyOiBzZXRNb25leU51bWJlclxyXG4gICAgfTsiLCIvKipcclxuKiBQbGFjZWhvbGRlciBwb2x5ZmlsbC5cclxuKiBBZGRzIGEgbmV3IGpRdWVyeSBwbGFjZUhvbGRlciBtZXRob2QgdG8gc2V0dXAgb3IgcmVhcHBseSBwbGFjZUhvbGRlclxyXG4qIG9uIGVsZW1lbnRzIChyZWNvbW1lbnRlZCB0byBiZSBhcHBseSBvbmx5IHRvIHNlbGVjdG9yICdbcGxhY2Vob2xkZXJdJyk7XHJcbiogdGhhdHMgbWV0aG9kIGlzIGZha2Ugb24gYnJvd3NlcnMgdGhhdCBoYXMgbmF0aXZlIHN1cHBvcnQgZm9yIHBsYWNlaG9sZGVyXHJcbioqL1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0UGxhY2VIb2xkZXJzKCkge1xyXG4gICAgaWYgKE1vZGVybml6ci5pbnB1dC5wbGFjZWhvbGRlcilcclxuICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkgeyB9O1xyXG4gICAgZWxzZVxyXG4gICAgICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvUGxhY2Vob2xkZXIoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdwbGFjZWhvbGRlci1zdXBwb3J0ZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0Lm9uKCdmb2N1c2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkdC5vbignZm9jdXNvdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQuZGF0YSgncGxhY2Vob2xkZXItc3VwcG9ydGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChkb1BsYWNlaG9sZGVyKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgJCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkoKTtcclxufTsiLCIvKiBQb3B1cCBmdW5jdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqXHJcbiogUG9wdXAgcmVsYXRlZCBcclxuKiBmdW5jdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gcG9wdXBTaXplKHNpemUpIHtcclxuICAgIHZhciBzID0gKHNpemUgPT0gJ2xhcmdlJyA/IDAuOCA6IChzaXplID09ICdtZWRpdW0nID8gMC41IDogKHNpemUgPT0gJ3NtYWxsJyA/IDAuMiA6IHNpemUgfHwgMC41KSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB3aWR0aDogTWF0aC5yb3VuZCgkKHdpbmRvdykud2lkdGgoKSAqIHMpLFxyXG4gICAgICAgIGhlaWdodDogTWF0aC5yb3VuZCgkKHdpbmRvdykuaGVpZ2h0KCkgKiBzKSxcclxuICAgICAgICBzaXplRmFjdG9yOiBzXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwU3R5bGUoc2l6ZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdXJzb3I6ICdkZWZhdWx0JyxcclxuICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCArICdweCcsXHJcbiAgICAgICAgbGVmdDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLndpZHRoKCkgLSBzaXplLndpZHRoKSAvIDIpIC0gMjUgKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHQgKyAncHgnLFxyXG4gICAgICAgIHRvcDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLmhlaWdodCgpIC0gc2l6ZS5oZWlnaHQpIC8gMikgLSAzMiArICdweCcsXHJcbiAgICAgICAgcGFkZGluZzogJzM0cHggMjVweCAzMHB4JyxcclxuICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICctbW96LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nJyxcclxuICAgICAgICAnLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnLFxyXG4gICAgICAgICdiYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwKHVybCwgc2l6ZSwgY29tcGxldGUsIGxvYWRpbmdUZXh0LCBvcHRpb25zKSB7XHJcbiAgICBpZiAodHlwZW9mICh1cmwpID09PSAnb2JqZWN0JylcclxuICAgICAgICBvcHRpb25zID0gdXJsO1xyXG5cclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICB1cmw6IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAnJyxcclxuICAgICAgICBzaXplOiBzaXplIHx8IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9LFxyXG4gICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcclxuICAgICAgICBsb2FkaW5nVGV4dDogbG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2xvc2FibGU6IHtcclxuICAgICAgICAgICAgb25Mb2FkOiBmYWxzZSxcclxuICAgICAgICAgICAgYWZ0ZXJMb2FkOiB0cnVlLFxyXG4gICAgICAgICAgICBvbkVycm9yOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvU2l6ZTogZmFsc2UsXHJcbiAgICAgICAgY29udGFpbmVyQ2xhc3M6ICcnLFxyXG4gICAgICAgIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLy8gUHJlcGFyZSBzaXplIGFuZCBsb2FkaW5nXHJcbiAgICBvcHRpb25zLmxvYWRpbmdUZXh0ID0gb3B0aW9ucy5sb2FkaW5nVGV4dCB8fCAnJztcclxuICAgIGlmICh0eXBlb2YgKG9wdGlvbnMuc2l6ZS53aWR0aCkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHBvcHVwU2l6ZShvcHRpb25zLnNpemUpO1xyXG5cclxuICAgICQuYmxvY2tVSSh7XHJcbiAgICAgICAgbWVzc2FnZTogKG9wdGlvbnMuY2xvc2FibGUub25Mb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICtcclxuICAgICAgICc8aW1nIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nICsgb3B0aW9ucy5sb2FkaW5nVGV4dCxcclxuICAgICAgICBjZW50ZXJZOiBmYWxzZSxcclxuICAgICAgICBjc3M6IHBvcHVwU3R5bGUob3B0aW9ucy5zaXplKSxcclxuICAgICAgICBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0sXHJcbiAgICAgICAgZm9jdXNJbnB1dDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTG9hZGluZyBVcmwgd2l0aCBBamF4IGFuZCBwbGFjZSBjb250ZW50IGluc2lkZSB0aGUgYmxvY2tlZC1ib3hcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcclxuICAgICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJCgnLmJsb2NrTXNnJylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhvcHRpb25zLmNvbnRhaW5lckNsYXNzKTtcclxuICAgICAgICAgICAgLy8gQWRkIGNsb3NlIGJ1dHRvbiBpZiByZXF1aXJlcyBpdCBvciBlbXB0eSBtZXNzYWdlIGNvbnRlbnQgdG8gYXBwZW5kIHRoZW4gbW9yZVxyXG4gICAgICAgICAgICBjb250YWluZXIuaHRtbChvcHRpb25zLmNsb3NhYmxlLmFmdGVyTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRIb2xkZXIgPSBjb250YWluZXIuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29udGVudFwiLz4nKS5jaGlsZHJlbignLmNvbnRlbnQnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuQ29kZSAmJiBkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgY29kZSwgc2hvdyByZXN1bHRcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQYWdlIGNvbnRlbnQgZ290LCBwYXN0ZSBpbnRvIHRoZSBwb3B1cCBpZiBpcyBwYXJ0aWFsIGh0bWwgKHVybCBzdGFydHMgd2l0aCAkKVxyXG4gICAgICAgICAgICAgICAgaWYgKC8oKF5cXCQpfChcXC9cXCQpKS8udGVzdChvcHRpb25zLnVybCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRIb2xkZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9TaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2b2lkIG1pc2NhbGN1bGF0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldldpZHRoID0gY29udGVudEhvbGRlclswXS5zdHlsZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRXaWR0aCA9IGNvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udEhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhV2lkdGggPSBjb250YWluZXIub3V0ZXJXaWR0aCh0cnVlKSAtIGNvbnRXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSGVpZ2h0ID0gY29udGFpbmVyLm91dGVySGVpZ2h0KHRydWUpIC0gY29udEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkgLSBleHRyYVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gZXh0cmFIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBhbmQgYXBwbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogYWN0dWFsV2lkdGggPiBtYXhXaWR0aCA/IG1heFdpZHRoIDogYWN0dWFsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGFjdHVhbEhlaWdodCA+IG1heEhlaWdodCA/IG1heEhlaWdodCA6IGFjdHVhbEhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuYW5pbWF0ZShzaXplLCAzMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBtaXNjYWxjdWxhdGlvbnMgY29ycmVjdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgcHJldldpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsIHByZXZIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRWxzZSwgaWYgdXJsIGlzIGEgZnVsbCBodG1sIHBhZ2UgKG5vcm1hbCBwYWdlKSwgcHV0IGNvbnRlbnQgaW50byBhbiBpZnJhbWVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGRhdGEsIHRoaXMub3B0aW9ucy5zaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2tpbmcgZWxlbWVudCBjb250ZW50ICh0aGUgbG9hZGluZykgd2l0aCB0aGUgaWZyYW1lOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZXJyb3I6IGZ1bmN0aW9uIChqLCB0LCBleCkge1xyXG4gICAgICAgICAgICAkKCdkaXYuYmxvY2tNc2cnKS5odG1sKChvcHRpb25zLmNsb3NhYmxlLm9uRXJyb3IgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgKyAnPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5QYWdlIG5vdCBmb3VuZDwvZGl2PicpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmluZm8pIGNvbnNvbGUuaW5mbyhcIlBvcHVwLWFqYXggZXJyb3I6IFwiICsgZXgpO1xyXG4gICAgICAgIH0sIGNvbXBsZXRlOiBvcHRpb25zLmNvbXBsZXRlXHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmV0dXJuZWRCbG9jayA9ICQoJy5ibG9ja1VJJyk7XHJcblxyXG4gICAgcmV0dXJuZWRCbG9jay5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICByZXR1cm5lZEJsb2NrLnRyaWdnZXIoJ3BvcHVwLWNsb3NlZCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuZWRCbG9jay5jbG9zZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0QmxvY2tFbGVtZW50ID0gZnVuY3Rpb24gZ2V0QmxvY2tFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja01zZycpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRDb250ZW50RWxlbWVudCA9IGZ1bmN0aW9uIGdldENvbnRlbnRFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maW5kKCcuY29udGVudCcpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRPdmVybGF5RWxlbWVudCA9IGZ1bmN0aW9uIGdldE92ZXJsYXlFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja092ZXJsYXknKTsgfTtcclxuICAgIHJldHVybiByZXR1cm5lZEJsb2NrO1xyXG59XHJcblxyXG4vKiBTb21lIHBvcHVwIHV0aWxpdGl0ZXMvc2hvcnRoYW5kcyAqL1xyXG5mdW5jdGlvbiBtZXNzYWdlUG9wdXAobWVzc2FnZSwgY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCAnYm9keScpO1xyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2Lz4nKS50ZXh0KG1lc3NhZ2UpO1xyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjb250YWluZXIsICdtZXNzYWdlLXBvcHVwIGZ1bGwtYmxvY2snLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbm5lY3RQb3B1cEFjdGlvbihhcHBseVRvU2VsZWN0b3IpIHtcclxuICAgIGFwcGx5VG9TZWxlY3RvciA9IGFwcGx5VG9TZWxlY3RvciB8fCAnLnBvcHVwLWFjdGlvbic7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBhcHBseVRvU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQoJCh0aGlzKS5hdHRyKCdocmVmJykpLmNsb25lKCk7XHJcbiAgICAgICAgaWYgKGMubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgZG9jdW1lbnQsIG51bGwsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy8gVGhlIHBvcHVwIGZ1bmN0aW9uIGNvbnRhaW5zIGFsbCB0aGUgb3RoZXJzIGFzIG1ldGhvZHNcclxucG9wdXAuc2l6ZSA9IHBvcHVwU2l6ZTtcclxucG9wdXAuc3R5bGUgPSBwb3B1cFN0eWxlO1xyXG5wb3B1cC5jb25uZWN0QWN0aW9uID0gY29ubmVjdFBvcHVwQWN0aW9uO1xyXG5wb3B1cC5tZXNzYWdlID0gbWVzc2FnZVBvcHVwO1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcG9wdXA7IiwiLyoqKiogUG9zdGFsIENvZGU6IG9uIGZseSwgc2VydmVyLXNpZGUgdmFsaWRhdGlvbiAqKioqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIGJhc2VVcmw6ICcvJyxcclxuICAgICAgICBzZWxlY3RvcjogJ1tkYXRhLXZhbC1wb3N0YWxjb2RlXScsXHJcbiAgICAgICAgdXJsOiAnSlNPTi9WYWxpZGF0ZVBvc3RhbENvZGUvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIG9wdGlvbnMuc2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGNvbnRhaW5zIGEgdmFsdWUgKHRoaXMgbm90IHZhbGlkYXRlIGlmIGlzIHJlcXVpcmVkKSBhbmQgXHJcbiAgICAgICAgLy8gaGFzIHRoZSBlcnJvciBkZXNjcmlwdGl2ZSBtZXNzYWdlLCB2YWxpZGF0ZSB0aHJvdWdoIGFqYXhcclxuICAgICAgICB2YXIgcGMgPSAkdC52YWwoKTtcclxuICAgICAgICB2YXIgbXNnID0gJHQuZGF0YSgndmFsLXBvc3RhbGNvZGUnKTtcclxuICAgICAgICBpZiAocGMgJiYgbXNnKSB7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMuYmFzZVVybCArIG9wdGlvbnMudXJsLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogeyBQb3N0YWxDb2RlOiBwYyB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ0pTT04nLFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLlJlc3VsdC5Jc1ZhbGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmFkZENsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoJycpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhbiBzdW1tYXJ5IGVycm9yc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgnPiB1bCA+IGxpJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLnRleHQoKSA9PSBtc2cpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRXJyb3IgbGFiZWwgKGlmIHRoZXJlIGlzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ1tkYXRhLXZhbG1zZy1mb3I9JyArICR0LmF0dHIoJ25hbWUnKSArICddJykudGV4dCgnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLnJlbW92ZUNsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPHNwYW4gZm9yPVwiJyArICR0LmF0dHIoJ25hbWUnKSArICdcIiBnZW5lcmF0ZWQ9XCJ0cnVlXCI+JyArIG1zZyArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgc3VtbWFyeSBlcnJvciAoaWYgdGhlcmUgaXMgbm90KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jaGlsZHJlbigndWwnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxsaT4nICsgbXNnICsgJzwvbGk+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFcnJvciBsYWJlbCAoaWYgdGhlcmUgaXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnW2RhdGEtdmFsbXNnLWZvcj0nICsgJHQuYXR0cignbmFtZScpICsgJ10nKS50ZXh0KG1zZyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBsYWJlbCBpcyBub3QgdmlzaWJsZSwganVzdCByZW1vdmUgdGhlIGJhZCBjb2RlIHRvIGxldCB1c2VyIHNlZSB0aGUgcGxhY2Vob2xkZXIgIzUxNFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyICRsYWJlbCA9ICR0LmNsb3Nlc3QoJ2xhYmVsJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRsYWJlbC5sZW5ndGggJiYgJHQuYXR0cignaWQnKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkbGFiZWwgPSAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnbGFiZWxbZm9yPScgKyAkdC5hdHRyKCdpZCcpICsgJ10nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJGxhYmVsLmlzKCc6dmlzaWJsZScpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnZhbCgnJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07IiwiLyoqIEFwcGx5IGV2ZXIgYSByZWRpcmVjdCB0byB0aGUgZ2l2ZW4gVVJMLCBpZiB0aGlzIGlzIGFuIGludGVybmFsIFVSTCBvciBzYW1lXHJcbnBhZ2UsIGl0IGZvcmNlcyBhIHBhZ2UgcmVsb2FkIGZvciB0aGUgZ2l2ZW4gVVJMLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVkaXJlY3RUbyh1cmwpIHtcclxuICAgIC8vIEJsb2NrIHRvIGF2b2lkIG1vcmUgdXNlciBpbnRlcmFjdGlvbnM6XHJcbiAgICAkLmJsb2NrVUkoeyBtZXNzYWdlOiAnJyB9KTsgLy9sb2FkaW5nQmxvY2spO1xyXG4gICAgLy8gQ2hlY2tpbmcgaWYgaXMgYmVpbmcgcmVkaXJlY3Rpbmcgb3Igbm90XHJcbiAgICB2YXIgcmVkaXJlY3RlZCA9IGZhbHNlO1xyXG4gICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiBjaGVja1JlZGlyZWN0KCkge1xyXG4gICAgICAgIHJlZGlyZWN0ZWQgPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBOYXZpZ2F0ZSB0byBuZXcgbG9jYXRpb246XHJcbiAgICB3aW5kb3cubG9jYXRpb24gPSB1cmw7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJZiBwYWdlIG5vdCBjaGFuZ2VkIChzYW1lIHVybCBvciBpbnRlcm5hbCBsaW5rKSwgcGFnZSBjb250aW51ZSBleGVjdXRpbmcgdGhlbiByZWZyZXNoOlxyXG4gICAgICAgIGlmICghcmVkaXJlY3RlZClcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSwgNTApO1xyXG59O1xyXG4iLCIvKiogU2FuaXRpemUgdGhlIHdoaXRlc3BhY2VzIGluIGEgdGV4dCBieTpcclxuLSByZXBsYWNpbmcgY29udGlndW91cyB3aGl0ZXNwYWNlcyBjaGFyYWN0ZXJlcyAoYW55IG51bWJlciBvZiByZXBldGl0aW9uIFxyXG5hbmQgYW55IGtpbmQgb2Ygd2hpdGUgY2hhcmFjdGVyKSBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlcGxhY2UgZW5jb2RlZCBub24tYnJlYWtpbmctc3BhY2VzIGJ5IGEgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbi0gcmVtb3ZlIHN0YXJ0aW5nIGFuZCBlbmRpbmcgd2hpdGUtc3BhY2VzXHJcbi0gZXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4qKi9cclxuZnVuY3Rpb24gc2FuaXRpemVXaGl0ZXNwYWNlcyh0ZXh0KSB7XHJcbiAgICAvLyBFdmVyIHJldHVybiBhIHN0cmluZywgZW1wdHkgd2hlbiBudWxsXHJcbiAgICB0ZXh0ID0gKHRleHQgfHwgJycpXHJcbiAgICAvLyBSZXBsYWNlIGFueSBraW5kIG9mIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVycyBieSBhIHNpbmdsZSBub3JtYWwgd2hpdGUtc3BhY2VcclxuICAgIC8vICh0aGF0cyBpbmNsdWRlIHJlcGxhY2UgZW5jb25kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyxcclxuICAgIC8vIGFuZCBkdXBsaWNhdGVkLXJlcGVhdGVkIGFwcGVhcmFuY2VzKVxyXG4gICAgLnJlcGxhY2UoL1xccysvZywgJyAnKTtcclxuICAgIC8vIFJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlc3BhY2VzXHJcbiAgICByZXR1cm4gJC50cmltKHRleHQpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzYW5pdGl6ZVdoaXRlc3BhY2VzOyIsIi8qKiBDdXN0b20gTG9jb25vbWljcyAnbGlrZSBibG9ja1VJJyBwb3B1cHNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUsXHJcbiAgICBhdXRvRm9jdXMgPSByZXF1aXJlKCcuL2F1dG9Gb2N1cycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcblxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9jayhjb250ZW50Qm94LCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykge1xyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcclxuICAgICAgICBjZW50ZXI6IGZhbHNlLFxyXG4gICAgICAgIC8qIGFzIGEgdmFsaWQgb3B0aW9ucyBwYXJhbWV0ZXIgZm9yIExDLmhpZGVFbGVtZW50IGZ1bmN0aW9uICovXHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiA2MDAsXHJcbiAgICAgICAgICAgIGVmZmVjdDogJ2ZhZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgYXV0b2ZvY3VzT3B0aW9uczogeyBtYXJnaW5Ub3A6IDYwIH0sXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgY29udGVudEJveCA9ICQoY29udGVudEJveCk7XHJcbiAgICB2YXIgZnVsbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJsb2NrZWQgPT0gZG9jdW1lbnQgfHwgYmxvY2tlZCA9PSB3aW5kb3cpIHtcclxuICAgICAgICBibG9ja2VkID0gJCgnYm9keScpO1xyXG4gICAgICAgIGZ1bGwgPSB0cnVlO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgYmxvY2tlZCA9ICQoYmxvY2tlZCk7XHJcblxyXG4gICAgdmFyIGJveEluc2lkZUJsb2NrZWQgPSAhYmxvY2tlZC5pcygnYm9keSx0cix0aGVhZCx0Ym9keSx0Zm9vdCx0YWJsZSx1bCxvbCxkbCcpO1xyXG5cclxuICAgIC8vIEdldHRpbmcgYm94IGVsZW1lbnQgaWYgZXhpc3RzIGFuZCByZWZlcmVuY2luZ1xyXG4gICAgdmFyIGJJRCA9IGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcpO1xyXG4gICAgaWYgKCFiSUQpXHJcbiAgICAgICAgYklEID0gKGNvbnRlbnRCb3guYXR0cignaWQnKSB8fCAnJykgKyAoYmxvY2tlZC5hdHRyKCdpZCcpIHx8ICcnKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgaWYgKGJJRCA9PSAnLXNtb290aEJveEJsb2NrJykge1xyXG4gICAgICAgIGJJRCA9ICdpZC0nICsgZ3VpZEdlbmVyYXRvcigpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICB9XHJcbiAgICBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnLCBiSUQpO1xyXG4gICAgdmFyIGJveCA9ICQoJyMnICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShiSUQpKTtcclxuICAgIFxyXG4gICAgLy8gSGlkaW5nL2Nsb3NpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgIGJveC54aGlkZShvcHRpb25zLmNsb3NlT3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIFJlc3RvcmluZyB0aGUgQ1NTIHBvc2l0aW9uIGF0dHJpYnV0ZSBvZiB0aGUgYmxvY2tlZCBlbGVtZW50XHJcbiAgICAgICAgLy8gdG8gYXZvaWQgc29tZSBwcm9ibGVtcyB3aXRoIGxheW91dCBvbiBzb21lIGVkZ2UgY2FzZXMgYWxtb3N0XHJcbiAgICAgICAgLy8gdGhhdCBtYXkgYmUgbm90IGEgcHJvYmxlbSBkdXJpbmcgYmxvY2tpbmcgYnV0IHdoZW4gdW5ibG9ja2VkLlxyXG4gICAgICAgIHZhciBwcmV2ID0gYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJyk7XHJcbiAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgcHJldiB8fCAnJyk7XHJcbiAgICAgICAgYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJywgbnVsbCk7XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICBib3hjXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBudWxsLCBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcsIHRydWUpO1xyXG4gICAgYm94Yy5hcHBlbmQoY29udGVudEJveCk7XHJcbiAgICBib3hjLndpZHRoKG9wdGlvbnMud2lkdGgpO1xyXG4gICAgYm94LmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gaW5zaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQ6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIGJsb2NrZWQuY3NzKCd6LWluZGV4JykgKyAxMCk7XHJcbiAgICAgICAgaWYgKCFibG9ja2VkLmNzcygncG9zaXRpb24nKSB8fCBibG9ja2VkLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJykge1xyXG4gICAgICAgICAgICBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nLCBibG9ja2VkLmNzcygncG9zaXRpb24nKSk7XHJcbiAgICAgICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmNlbnRlciA9PT0gdHJ1ZSB8fCBvcHRpb25zLmNlbnRlciA9PT0gJ3ZlcnRpY2FsJylcclxuICAgICAgICAgICAgYm94Yy5jc3MoJ3RvcCcsIGN0IC0gYm94Yy5vdXRlckhlaWdodCh0cnVlKSAvIDIpO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmNlbnRlciA9PT0gdHJ1ZSB8fCBvcHRpb25zLmNlbnRlciA9PT0gJ2hvcml6b250YWwnKVxyXG4gICAgICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07IiwiLyoqXHJcbioqIE1vZHVsZTo6IHRvb2x0aXBzXHJcbioqIENyZWF0ZXMgc21hcnQgdG9vbHRpcHMgd2l0aCBwb3NzaWJpbGl0aWVzIGZvciBvbiBob3ZlciBhbmQgb24gY2xpY2ssXHJcbioqIGFkZGl0aW9uYWwgZGVzY3JpcHRpb24gb3IgZXh0ZXJuYWwgdG9vbHRpcCBjb250ZW50LlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNhbml0aXplV2hpdGVzcGFjZXMgPSByZXF1aXJlKCcuL3Nhbml0aXplV2hpdGVzcGFjZXMnKTtcclxucmVxdWlyZSgnLi9qcXVlcnkub3V0ZXJIdG1sJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5LmlzQ2hpbGRPZicpO1xyXG5cclxuLy8gTWFpbiBpbnRlcm5hbCBwcm9wZXJ0aWVzXHJcbnZhciBwb3NvZmZzZXQgPSB7IHg6IDE2LCB5OiA4IH07XHJcbnZhciBzZWxlY3RvciA9ICdbdGl0bGVdW2RhdGEtZGVzY3JpcHRpb25dLCBbdGl0bGVdLmhhcy10b29sdGlwLCBbdGl0bGVdLnNlY3VyZS1kYXRhLCBbZGF0YS10b29sdGlwLXVybF0sIFt0aXRsZV0uaGFzLXBvcHVwLXRvb2x0aXAnO1xyXG5cclxuLyoqIFBvc2l0aW9uYXRlIHRoZSB0b29sdGlwIGRlcGVuZGluZyBvbiB0aGVcclxuZXZlbnQgb3IgdGhlIHRhcmdldCBlbGVtZW50IHBvc2l0aW9uIGFuZCBhbiBvZmZzZXRcclxuKiovXHJcbmZ1bmN0aW9uIHBvcyh0LCBlLCBsKSB7XHJcbiAgICB2YXIgeCwgeTtcclxuICAgIGlmIChlLnBhZ2VYICYmIGUucGFnZVkpIHtcclxuICAgICAgICB4ID0gZS5wYWdlWDtcclxuICAgICAgICB5ID0gZS5wYWdlWTtcclxuICAgIH0gZWxzZSBpZiAoZS50YXJnZXQpIHtcclxuICAgICAgICB2YXIgJGV0ID0gJChlLnRhcmdldCk7XHJcbiAgICAgICAgeCA9ICRldC5vdXRlcldpZHRoKCkgKyAkZXQub2Zmc2V0KCkubGVmdDtcclxuICAgICAgICB5ID0gJGV0Lm91dGVySGVpZ2h0KCkgKyAkZXQub2Zmc2V0KCkudG9wO1xyXG4gICAgfVxyXG4gICAgdC5jc3MoJ2xlZnQnLCB4ICsgcG9zb2Zmc2V0LngpO1xyXG4gICAgdC5jc3MoJ3RvcCcsIHkgKyBwb3NvZmZzZXQueSk7XHJcbiAgICAvLyBBZGp1c3Qgd2lkdGggdG8gdmlzaWJsZSB2aWV3cG9ydFxyXG4gICAgdmFyIHRkaWYgPSB0Lm91dGVyV2lkdGgoKSAtIHQud2lkdGgoKTtcclxuICAgIHQuY3NzKCdtYXgtd2lkdGgnLCAkKHdpbmRvdykud2lkdGgoKSAtIHggLSBwb3NvZmZzZXQueCAtIHRkaWYpO1xyXG4gICAgLy90LmhlaWdodCgkKGRvY3VtZW50KS5oZWlnaHQoKSAtIHkgLSBwb3NvZmZzZXQueSk7XHJcbn1cclxuLyoqIEdldCBvciBjcmVhdGUsIGFuZCByZXR1cm5zLCB0aGUgdG9vbHRpcCBjb250ZW50IGZvciB0aGUgZWxlbWVudFxyXG4qKi9cclxuZnVuY3Rpb24gY29uKGwpIHtcclxuICAgIGlmIChsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgYyA9IGwuZGF0YSgndG9vbHRpcC1jb250ZW50JyksXHJcbiAgICAgICAgcGVyc2lzdGVudCA9IGwuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJyk7XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICB2YXIgaCA9IHNhbml0aXplV2hpdGVzcGFjZXMobC5hdHRyKCd0aXRsZScpKTtcclxuICAgICAgICB2YXIgZCA9IHNhbml0aXplV2hpdGVzcGFjZXMobC5kYXRhKCdkZXNjcmlwdGlvbicpKTtcclxuICAgICAgICBpZiAoZClcclxuICAgICAgICAgICAgYyA9ICc8aDQ+JyArIGggKyAnPC9oND48cD4nICsgZCArICc8L3A+JztcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGMgPSBoO1xyXG4gICAgICAgIC8vIEFwcGVuZCBkYXRhLXRvb2x0aXAtdXJsIGNvbnRlbnQgaWYgZXhpc3RzXHJcbiAgICAgICAgdmFyIHVybGNvbnRlbnQgPSAkKGwuZGF0YSgndG9vbHRpcC11cmwnKSk7XHJcbiAgICAgICAgYyA9IChjIHx8ICcnKSArIHVybGNvbnRlbnQub3V0ZXJIdG1sKCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIG9yaWdpbmFsLCBpcyBubyBtb3JlIG5lZWQgYW5kIGF2b2lkIGlkLWNvbmZsaWN0c1xyXG4gICAgICAgIHVybGNvbnRlbnQucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gU2F2ZSB0b29sdGlwIGNvbnRlbnRcclxuICAgICAgICBsLmRhdGEoJ3Rvb2x0aXAtY29udGVudCcsIGMpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBicm93c2VyIHRvb2x0aXAgKGJvdGggd2hlbiB3ZSBhcmUgdXNpbmcgb3VyIG93biB0b29sdGlwIGFuZCB3aGVuIG5vIHRvb2x0aXBcclxuICAgICAgICAvLyBpcyBuZWVkKVxyXG4gICAgICAgIGwuYXR0cigndGl0bGUnLCAnJyk7XHJcbiAgICB9XHJcbiAgICAvLyBSZW1vdmUgdG9vbHRpcCBjb250ZW50IChidXQgcHJlc2VydmUgaXRzIGNhY2hlIGluIHRoZSBlbGVtZW50IGRhdGEpXHJcbiAgICAvLyBpZiBpcyB0aGUgc2FtZSB0ZXh0IGFzIHRoZSBlbGVtZW50IGNvbnRlbnQgYW5kIHRoZSBlbGVtZW50IGNvbnRlbnRcclxuICAgIC8vIGlzIGZ1bGx5IHZpc2libGUuIFRoYXRzLCBmb3IgY2FzZXMgd2l0aCBkaWZmZXJlbnQgY29udGVudCwgd2lsbCBiZSBzaG93ZWQsXHJcbiAgICAvLyBhbmQgZm9yIGNhc2VzIHdpdGggc2FtZSBjb250ZW50IGJ1dCBpcyBub3QgdmlzaWJsZSBiZWNhdXNlIHRoZSBlbGVtZW50XHJcbiAgICAvLyBvciBjb250YWluZXIgd2lkdGgsIHRoZW4gd2lsbCBiZSBzaG93ZWQuXHJcbiAgICAvLyBFeGNlcHQgaWYgaXMgcGVyc2lzdGVudFxyXG4gICAgaWYgKHBlcnNpc3RlbnQgIT09IHRydWUgJiZcclxuICAgICAgICBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwudGV4dCgpKSA9PSBjICYmXHJcbiAgICAgICAgbC5vdXRlcldpZHRoKCkgPj0gbFswXS5zY3JvbGxXaWR0aCkge1xyXG4gICAgICAgIGMgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gY29udGVudDpcclxuICAgIGlmICghYykge1xyXG4gICAgICAgIC8vIFVwZGF0ZSB0YXJnZXQgcmVtb3ZpbmcgdGhlIGNsYXNzIHRvIGF2b2lkIGNzcyBtYXJraW5nIHRvb2x0aXAgd2hlbiB0aGVyZSBpcyBub3RcclxuICAgICAgICBsLnJlbW92ZUNsYXNzKCdoYXMtdG9vbHRpcCcpLnJlbW92ZUNsYXNzKCdoYXMtcG9wdXAtdG9vbHRpcCcpO1xyXG4gICAgfVxyXG4gICAgLy8gUmV0dXJuIHRoZSBjb250ZW50IGFzIHN0cmluZzpcclxuICAgIHJldHVybiBjO1xyXG59XHJcbi8qKiBHZXQgb3IgY3JlYXRlcyB0aGUgc2luZ2xldG9uIGluc3RhbmNlIGZvciBhIHRvb2x0aXAgb2YgdGhlIGdpdmVuIHR5cGVcclxuKiovXHJcbmZ1bmN0aW9uIGdldFRvb2x0aXAodHlwZSkge1xyXG4gICAgdHlwZSA9IHR5cGUgfHwgJ3Rvb2x0aXAnO1xyXG4gICAgdmFyIGlkID0gJ3NpbmdsZXRvbi0nICsgdHlwZTtcclxuICAgIHZhciB0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xyXG4gICAgaWYgKCF0KSB7XHJcbiAgICAgICAgdCA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZVwiIGNsYXNzPVwidG9vbHRpcFwiPjwvZGl2PicpO1xyXG4gICAgICAgIHQuYXR0cignaWQnLCBpZCk7XHJcbiAgICAgICAgdC5oaWRlKCk7XHJcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0KTtcclxuICAgIH1cclxuICAgIHJldHVybiAkKHQpO1xyXG59XHJcbi8qKiBTaG93IHRoZSB0b29sdGlwIG9uIGFuIGV2ZW50IHRyaWdnZXJlZCBieSB0aGUgZWxlbWVudCBjb250YWluaW5nXHJcbmluZm9ybWF0aW9uIGZvciBhIHRvb2x0aXBcclxuKiovXHJcbmZ1bmN0aW9uIHNob3dUb29sdGlwKGUpIHtcclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgaXNQb3B1cCA9ICR0Lmhhc0NsYXNzKCdoYXMtcG9wdXAtdG9vbHRpcCcpO1xyXG4gICAgLy8gR2V0IG9yIGNyZWF0ZSB0b29sdGlwIGxheWVyXHJcbiAgICB2YXIgdCA9IGdldFRvb2x0aXAoaXNQb3B1cCA/ICdwb3B1cC10b29sdGlwJyA6ICd0b29sdGlwJyk7XHJcbiAgICAvLyBJZiB0aGlzIGlzIG5vdCBwb3B1cCBhbmQgdGhlIGV2ZW50IGlzIGNsaWNrLCBkaXNjYXJkIHdpdGhvdXQgY2FuY2VsIGV2ZW50XHJcbiAgICBpZiAoIWlzUG9wdXAgJiYgZS50eXBlID09ICdjbGljaycpXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGNvbnRlbnQ6IGlmIHRoZXJlIGlzIGNvbnRlbnQsIGNvbnRpbnVlXHJcbiAgICB2YXIgY29udGVudCA9IGNvbigkdCk7XHJcbiAgICBpZiAoY29udGVudCkge1xyXG4gICAgICAgIC8vIElmIGlzIGEgaGFzLXBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgbm90IGEgY2xpY2ssIGRvbid0IHNob3dcclxuICAgICAgICBpZiAoaXNQb3B1cCAmJiBlLnR5cGUgIT0gJ2NsaWNrJylcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgLy8gVGhlIHRvb2x0aXAgc2V0dXAgbXVzdCBiZSBxdWV1ZWQgdG8gYXZvaWQgY29udGVudCB0byBiZSBzaG93ZWQgYW5kIHBsYWNlZFxyXG4gICAgICAgIC8vIHdoZW4gc3RpbGwgaGlkZGVuIHRoZSBwcmV2aW91c1xyXG4gICAgICAgIHQucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBTZXQgdG9vbHRpcCBjb250ZW50XHJcbiAgICAgICAgICAgIHQuaHRtbChjb250ZW50KTtcclxuICAgICAgICAgICAgLy8gRm9yIHBvcHVwcywgc2V0dXAgY2xhc3MgYW5kIGNsb3NlIGJ1dHRvblxyXG4gICAgICAgICAgICBpZiAoaXNQb3B1cCkge1xyXG4gICAgICAgICAgICAgICAgdC5hZGRDbGFzcygncG9wdXAtdG9vbHRpcCcpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGEgaHJlZj1cIiNjbG9zZS1wb3B1cFwiIGNsYXNzPVwiY2xvc2UtYWN0aW9uXCI+WDwvYT4nKTtcclxuICAgICAgICAgICAgICAgIHQuYXBwZW5kKGNsb3NlQnV0dG9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBQb3NpdGlvbmF0ZVxyXG4gICAgICAgICAgICBwb3ModCwgZSwgJHQpO1xyXG4gICAgICAgICAgICB0LmRlcXVldWUoKTtcclxuICAgICAgICAgICAgLy8gU2hvdyAoYW5pbWF0aW9ucyBhcmUgc3RvcHBlZCBvbmx5IG9uIGhpZGUgdG8gYXZvaWQgY29uZmxpY3RzKVxyXG4gICAgICAgICAgICB0LmZhZGVJbigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0b3AgYnViYmxpbmcgYW5kIGRlZmF1bHRcclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG4vKiogSGlkZSBhbGwgb3BlbmVkIHRvb2x0aXBzLCBmb3IgYW55IHR5cGUuXHJcbkl0IGhhcyBzb21lIHNwZWNpYWwgY29uc2lkZXJhdGlvbnMgZm9yIHBvcHVwLXRvb2x0aXBzIGRlcGVuZGluZ1xyXG5vbiB0aGUgZXZlbnQgYmVpbmcgdHJpZ2dlcmVkLlxyXG4qKi9cclxuZnVuY3Rpb24gaGlkZVRvb2x0aXAoZSkge1xyXG4gICAgJCgnLnRvb2x0aXA6dmlzaWJsZScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBJZiBpcyBhIHBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgbm90IGEgY2xpY2ssIG9yIHRoZSBpbnZlcnNlLFxyXG4gICAgICAgIC8vIHRoaXMgaXMgbm90IGEgcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBhIGNsaWNrLCBkbyBub3RoaW5nXHJcbiAgICAgICAgaWYgKHQuaGFzQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKSAmJiBlLnR5cGUgIT0gJ2NsaWNrJyB8fFxyXG4gICAgICAgICAgICAhdC5oYXNDbGFzcygncG9wdXAtdG9vbHRpcCcpICYmIGUudHlwZSA9PSAnY2xpY2snKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgLy8gU3RvcCBhbmltYXRpb25zIGFuZCBoaWRlXHJcbiAgICAgICAgdC5zdG9wKHRydWUsIHRydWUpLmZhZGVPdXQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG4vKiogSW5pdGlhbGl6ZSB0b29sdGlwc1xyXG4qKi9cclxuZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIC8vIExpc3RlbiBmb3IgZXZlbnRzIHRvIHNob3cvaGlkZSB0b29sdGlwc1xyXG4gICAgJCgnYm9keScpLm9uKCdtb3VzZW1vdmUgZm9jdXNpbicsIHNlbGVjdG9yLCBzaG93VG9vbHRpcClcclxuICAgIC5vbignbW91c2VsZWF2ZSBmb2N1c291dCcsIHNlbGVjdG9yLCBoaWRlVG9vbHRpcClcclxuICAgIC8vIExpc3RlbiBldmVudCBmb3IgY2xpY2thYmxlIHBvcHVwLXRvb2x0aXBzXHJcbiAgICAub24oJ2NsaWNrJywgJ1t0aXRsZV0uaGFzLXBvcHVwLXRvb2x0aXAnLCBzaG93VG9vbHRpcClcclxuICAgIC8vIEFsbG93aW5nIGJ1dHRvbnMgaW5zaWRlIHRoZSB0b29sdGlwXHJcbiAgICAub24oJ2NsaWNrJywgJy50b29sdGlwLWJ1dHRvbicsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgLy8gQWRkaW5nIGNsb3NlLXRvb2x0aXAgaGFuZGxlciBmb3IgcG9wdXAtdG9vbHRpcHMgKGNsaWNrIG9uIGFueSBlbGVtZW50IGV4Y2VwdCB0aGUgdG9vbHRpcCBpdHNlbGYpXHJcbiAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICB2YXIgdCA9ICQoJy5wb3B1cC10b29sdGlwOnZpc2libGUnKS5nZXQoMCk7XHJcbiAgICAgICAgLy8gSWYgdGhlIGNsaWNrIGlzIE5vdCBvbiB0aGUgdG9vbHRpcCBvciBhbnkgZWxlbWVudCBjb250YWluZWRcclxuICAgICAgICAvLyBoaWRlIHRvb2x0aXBcclxuICAgICAgICBpZiAoZS50YXJnZXQgIT0gdCAmJiAhJChlLnRhcmdldCkuaXNDaGlsZE9mKHQpKVxyXG4gICAgICAgICAgICBoaWRlVG9vbHRpcChlKTtcclxuICAgIH0pXHJcbiAgICAvLyBBdm9pZCBjbG9zZS1hY3Rpb24gY2xpY2sgZnJvbSByZWRpcmVjdCBwYWdlLCBhbmQgaGlkZSB0b29sdGlwXHJcbiAgICAub24oJ2NsaWNrJywgJy5wb3B1cC10b29sdGlwIC5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBoaWRlVG9vbHRpcChlKTtcclxuICAgIH0pO1xyXG4gICAgdXBkYXRlKCk7XHJcbn1cclxuLyoqIFVwZGF0ZSBlbGVtZW50cyBvbiB0aGUgcGFnZSB0byByZWZsZWN0IGNoYW5nZXMgb3IgbmVlZCBmb3IgdG9vbHRpcHNcclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZShlbGVtZW50X3NlbGVjdG9yKSB7XHJcbiAgICAvLyBSZXZpZXcgZXZlcnkgcG9wdXAgdG9vbHRpcCB0byBwcmVwYXJlIGNvbnRlbnQgYW5kIG1hcmsvdW5tYXJrIHRoZSBsaW5rIG9yIHRleHQ6XHJcbiAgICAkKGVsZW1lbnRfc2VsZWN0b3IgfHwgc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbigkKHRoaXMpKTtcclxuICAgIH0pO1xyXG59XHJcbi8qKiBDcmVhdGUgdG9vbHRpcCBvbiBlbGVtZW50IGJ5IGRlbWFuZFxyXG4qKi9cclxuZnVuY3Rpb24gY3JlYXRlX3Rvb2x0aXAoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdmFyIHNldHRpbmdzID0gJC5leHRlbmQoe30sIHtcclxuICAgICAgdGl0bGU6ICcnXHJcbiAgICAgICwgZGVzY3JpcHRpb246IG51bGxcclxuICAgICAgLCB1cmw6IG51bGxcclxuICAgICAgLCBpc19wb3B1cDogZmFsc2VcclxuICAgICAgLCBwZXJzaXN0ZW50OiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChlbGVtZW50KVxyXG4gICAgLmF0dHIoJ3RpdGxlJywgc2V0dGluZ3MudGl0bGUpXHJcbiAgICAuZGF0YSgnZGVzY3JpcHRpb24nLCBzZXR0aW5ncy5kZXNjcmlwdGlvbilcclxuICAgIC5kYXRhKCdwZXJzaXN0ZW50LXRvb2x0aXAnLCBzZXR0aW5ncy5wZXJzaXN0ZW50KVxyXG4gICAgLmFkZENsYXNzKHNldHRpbmdzLmlzX3BvcHVwID8gJ2hhcy1wb3B1cC10b29sdGlwJyA6ICdoYXMtdG9vbHRpcCcpO1xyXG4gICAgdXBkYXRlKGVsZW1lbnQpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0VG9vbHRpcHM6IGluaXQsXHJcbiAgICAgICAgdXBkYXRlVG9vbHRpcHM6IHVwZGF0ZSxcclxuICAgICAgICBjcmVhdGVUb29sdGlwOiBjcmVhdGVfdG9vbHRpcFxyXG4gICAgfTtcclxuIiwiLyogU29tZSB0b29scyBmb3JtIFVSTCBtYW5hZ2VtZW50XHJcbiovXHJcbmV4cG9ydHMuZ2V0VVJMUGFyYW1ldGVyID0gZnVuY3Rpb24gZ2V0VVJMUGFyYW1ldGVyKG5hbWUpIHtcclxuICAgIHJldHVybiBkZWNvZGVVUkkoXHJcbiAgICAgICAgKFJlZ0V4cChuYW1lICsgJz0nICsgJyguKz8pKCZ8JCknLCAnaScpLmV4ZWMobG9jYXRpb24uc2VhcmNoKSB8fCBbLCBudWxsXSlbMV0pO1xyXG59O1xyXG5leHBvcnRzLmdldEhhc2hCYW5nUGFyYW1ldGVycyA9IGZ1bmN0aW9uIGdldEhhc2hCYW5nUGFyYW1ldGVycyhoYXNoYmFuZ3ZhbHVlKSB7XHJcbiAgICAvLyBIYXNoYmFuZ3ZhbHVlIGlzIHNvbWV0aGluZyBsaWtlOiBUaHJlYWQtMV9NZXNzYWdlLTJcclxuICAgIC8vIFdoZXJlICcxJyBpcyB0aGUgVGhyZWFkSUQgYW5kICcyJyB0aGUgb3B0aW9uYWwgTWVzc2FnZUlELCBvciBvdGhlciBwYXJhbWV0ZXJzXHJcbiAgICB2YXIgcGFycyA9IGhhc2hiYW5ndmFsdWUuc3BsaXQoJ18nKTtcclxuICAgIHZhciB1cmxQYXJhbWV0ZXJzID0ge307XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgcGFyc3ZhbHVlcyA9IHBhcnNbaV0uc3BsaXQoJy0nKTtcclxuICAgICAgICBpZiAocGFyc3ZhbHVlcy5sZW5ndGggPT0gMilcclxuICAgICAgICAgICAgdXJsUGFyYW1ldGVyc1twYXJzdmFsdWVzWzBdXSA9IHBhcnN2YWx1ZXNbMV07XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB1cmxQYXJhbWV0ZXJzW3BhcnN2YWx1ZXNbMF1dID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiB1cmxQYXJhbWV0ZXJzO1xyXG59O1xyXG4iLCIvKiogVmFsaWRhdGlvbiBsb2dpYyB3aXRoIGxvYWQgYW5kIHNldHVwIG9mIHZhbGlkYXRvcnMgYW5kIFxyXG4gICAgdmFsaWRhdGlvbiByZWxhdGVkIHV0aWxpdGllc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpO1xyXG5cclxuLy8gVXNpbmcgb24gc2V0dXAgYXN5bmNyb25vdXMgbG9hZCBpbnN0ZWFkIG9mIHRoaXMgc3RhdGljLWxpbmtlZCBsb2FkXHJcbi8vIHJlcXVpcmUoJ2pxdWVyeS9qcXVlcnkudmFsaWRhdGUubWluLmpzJyk7XHJcbi8vIHJlcXVpcmUoJ2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cFZhbGlkYXRpb24ocmVhcHBseU9ubHlUbykge1xyXG4gICAgcmVhcHBseU9ubHlUbyA9IHJlYXBwbHlPbmx5VG8gfHwgZG9jdW1lbnQ7XHJcbiAgICBpZiAoIXdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkKSB3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCA9IGZhbHNlO1xyXG4gICAgaWYgKCFqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkKSB7XHJcbiAgICAgICAganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgTW9kZXJuaXpyLmxvYWQoW1xyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUubWluLmpzXCIgfSxcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qc1wiIH1cclxuICAgICAgICAgICAgXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIENoZWNrIGZpcnN0IGlmIHZhbGlkYXRpb24gaXMgZW5hYmxlZCAoY2FuIGhhcHBlbiB0aGF0IHR3aWNlIGluY2x1ZGVzIG9mXHJcbiAgICAgICAgLy8gdGhpcyBjb2RlIGhhcHBlbiBhdCBzYW1lIHBhZ2UsIGJlaW5nIGV4ZWN1dGVkIHRoaXMgY29kZSBhZnRlciBmaXJzdCBhcHBlYXJhbmNlXHJcbiAgICAgICAgLy8gd2l0aCB0aGUgc3dpdGNoIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgY2hhbmdlZFxyXG4gICAgICAgIC8vIGJ1dCB3aXRob3V0IHZhbGlkYXRpb24gYmVpbmcgYWxyZWFkeSBsb2FkZWQgYW5kIGVuYWJsZWQpXHJcbiAgICAgICAgaWYgKCQgJiYgJC52YWxpZGF0b3IgJiYgJC52YWxpZGF0b3IudW5vYnRydXNpdmUpIHtcclxuICAgICAgICAgICAgLy8gQXBwbHkgdGhlIHZhbGlkYXRpb24gcnVsZXMgdG8gdGhlIG5ldyBlbGVtZW50c1xyXG4gICAgICAgICAgICAkKHJlYXBwbHlPbmx5VG8pLnJlbW92ZURhdGEoJ3ZhbGlkYXRvcicpO1xyXG4gICAgICAgICAgICAkKHJlYXBwbHlPbmx5VG8pLnJlbW92ZURhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gICAgICAgICAgICAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZS5wYXJzZShyZWFwcGx5T25seVRvKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdGllcyAqL1xyXG5cclxuLyogQ2xlYW4gcHJldmlvdXMgdmFsaWRhdGlvbiBlcnJvcnMgb2YgdGhlIHZhbGlkYXRpb24gc3VtbWFyeVxyXG5pbmNsdWRlZCBpbiAnY29udGFpbmVyJyBhbmQgc2V0IGFzIHZhbGlkIHRoZSBzdW1tYXJ5XHJcbiovXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudDtcclxuICAgICQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgIC5maW5kKCc+dWw+bGknKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBTZXQgYWxsIGZpZWxkcyB2YWxpZGF0aW9uIGluc2lkZSB0aGlzIGZvcm0gKGFmZmVjdGVkIGJ5IHRoZSBzdW1tYXJ5IHRvbylcclxuICAgIC8vIGFzIHZhbGlkIHRvb1xyXG4gICAgJCgnLmZpZWxkLXZhbGlkYXRpb24tZXJyb3InLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgIC50ZXh0KCcnKTtcclxuXHJcbiAgICAvLyBSZS1hcHBseSBzZXR1cCB2YWxpZGF0aW9uIHRvIGVuc3VyZSBpcyB3b3JraW5nLCBiZWNhdXNlIGp1c3QgYWZ0ZXIgYSBzdWNjZXNzZnVsXHJcbiAgICAvLyB2YWxpZGF0aW9uLCBhc3AubmV0IHVub2J0cnVzaXZlIHZhbGlkYXRpb24gc3RvcHMgd29ya2luZyBvbiBjbGllbnQtc2lkZS5cclxuICAgIExDLnNldHVwVmFsaWRhdGlvbigpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IoY29udGFpbmVyLCBlcnJvcnMpIHtcclxuICB2YXIgdiA9IGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpO1xyXG4gIHYuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldEVycm9ycyhjb250YWluZXIsIGVycm9ycykge1xyXG4gICAgLy92YXIgdmFsaWRhdG9yID0gJChjb250YWluZXIpLnZhbGlkYXRlKCk7XHJcbiAgICAvL3ZhbGlkYXRvci5zaG93RXJyb3JzKGVycm9ycyk7XHJcbiAgICB2YXIgJHMgPSBmaW5kVmFsaWRhdGlvblN1bW1hcnkoY29udGFpbmVyKS5maW5kKCd1bCcpO1xyXG4gICAgdmFyIHdpdGhFcnJvcnMgPSBmYWxzZTtcclxuICAgIGZvcih2YXIgZmllbGQgaW4gZXJyb3JzKSB7XHJcbiAgICAgICAgaWYgKGVycm9ycy5oYXNPd25Qcm9wZXJ0eSAmJiAhZXJyb3JzLmhhc093blByb3BlcnR5KGZpZWxkKSlcclxuICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgJCgnPGxpLz4nKS50ZXh0KGVycm9yc1tmaWVsZF0pLmFwcGVuZFRvKCRzKTtcclxuICAgICAgICAvLyQoY29udGFpbmVyKS5maW5kKCdbbmFtZT1cIicgKyBmaWVsZCArICdcIl0nKVxyXG4gICAgICAgIC8vLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAvLy5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCB2YWxpZCcpO1xyXG4gICAgICAgIHdpdGhFcnJvcnMgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKHdpdGhFcnJvcnMpXHJcbiAgICAgICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGNvbnRhaW5lcik7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pIHtcclxuICAgIHZhciBvZmYgPSBmb3JtLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykub2Zmc2V0KCk7XHJcbiAgICBpZiAob2ZmKVxyXG4gICAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogb2ZmLnRvcCB9LCA1MDApO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ2dvVG9TdW1tYXJ5RXJyb3JzOiBubyBzdW1tYXJ5IHRvIGZvY3VzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpIHtcclxuICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgcmV0dXJuICQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJywgY29udGFpbmVyKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZXR1cDogc2V0dXBWYWxpZGF0aW9uLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQsXHJcbiAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3I6IHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcixcclxuICAgIGdvVG9TdW1tYXJ5RXJyb3JzOiBnb1RvU3VtbWFyeUVycm9ycyxcclxuICAgIGZpbmRWYWxpZGF0aW9uU3VtbWFyeTogZmluZFZhbGlkYXRpb25TdW1tYXJ5LFxyXG4gICAgc2V0RXJyb3JzOiBzZXRFcnJvcnNcclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIHNvbWUgQWNjb3VudCBwYWdlcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmxvZ2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSBiYXNlVXJsICsgJ0FjY291bnQvJExvZ2luLz9SZXR1cm5Vcmw9JyArIGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24pO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9LCBudWxsLCBudWxsLCB7IGF1dG9Gb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5mb3Jnb3QtcGFzc3dvcmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvRm9yZ290UGFzc3dvcmQnLCAnL0FjY291bnQvJEZvcmdvdFBhc3N3b3JkJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0MDAsIGhlaWdodDogMjQwIH0sIG51bGwsIG51bGwsIHsgYXV0b0ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmNoYW5nZS1wYXNzd29yZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9DaGFuZ2VQYXNzd29yZCcsICcvQWNjb3VudC8kQ2hhbmdlUGFzc3dvcmQnKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQ1MCwgaGVpZ2h0OiAzNDAgfSwgbnVsbCwgbnVsbCwgeyBhdXRvRm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8vIE9VUiBuYW1lc3BhY2UgKGFiYnJldmlhdGVkIExvY29ub21pY3MpXHJcbndpbmRvdy5MQyA9IHdpbmRvdy5MQyB8fCB7fTtcclxuXHJcbi8vIFRPRE8gUmV2aWV3IExjVXJsIHVzZSBhcm91bmQgYWxsIHRoZSBtb2R1bGVzLCB1c2UgREkgd2hlbmV2ZXIgcG9zc2libGUgKGluaXQvc2V0dXAgbWV0aG9kIG9yIGluIHVzZSBjYXNlcylcclxuLy8gYnV0IG9ubHkgZm9yIHRoZSB3YW50ZWQgYmFzZVVybCBvbiBlYWNoIGNhc2UgYW5kIG5vdCBwYXNzIGFsbCB0aGUgTGNVcmwgb2JqZWN0LlxyXG4vLyBMY1VybCBpcyBzZXJ2ZXItc2lkZSBnZW5lcmF0ZWQgYW5kIHdyb3RlIGluIGEgTGF5b3V0IHNjcmlwdC10YWcuXHJcblxyXG4vLyBHbG9iYWwgc2V0dGluZ3Ncclxud2luZG93LmdMb2FkaW5nUmV0YXJkID0gMzAwO1xyXG5cclxuLyoqKlxyXG4gKiogTG9hZGluZyBtb2R1bGVzXHJcbioqKi9cclxuLy9UT0RPOiBDbGVhbiBkZXBlbmRlbmNpZXMsIHJlbW92ZSBhbGwgdGhhdCBub3QgdXNlZCBkaXJlY3RseSBpbiB0aGlzIGZpbGUsIGFueSBvdGhlciBmaWxlXHJcbi8vIG9yIHBhZ2UgbXVzdCByZXF1aXJlIGl0cyBkZXBlbmRlbmNpZXMuXHJcblxyXG53aW5kb3cuTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG5cclxuLyogalF1ZXJ5LCBzb21lIHZlbmRvciBwbHVnaW5zIChmcm9tIGJ1bmRsZSkgYW5kIG91ciBhZGRpdGlvbnMgKHNtYWxsIHBsdWdpbnMpLCB0aGV5IGFyZSBhdXRvbWF0aWNhbGx5IHBsdWctZWQgb24gcmVxdWlyZSAqL1xyXG52YXIgJCA9IHdpbmRvdy4kID0gd2luZG93LmpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5iYS1oYXNoY2hhbmdlJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5hcmUnKTtcclxuLy8gTWFza2VkIGlucHV0LCBmb3IgZGF0ZXMgLWF0IG15LWFjY291bnQtLlxyXG5yZXF1aXJlKCdqcXVlcnkuZm9ybWF0dGVyJyk7XHJcblxyXG4vLyBHZW5lcmFsIGNhbGxiYWNrcyBmb3IgQUpBWCBldmVudHMgd2l0aCBjb21tb24gbG9naWNcclxudmFyIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuLi9MQy9hamF4Q2FsbGJhY2tzJyk7XHJcbi8vIEZvcm0uYWpheCBsb2dpYyBhbmQgbW9yZSBzcGVjaWZpYyBjYWxsYmFja3MgYmFzZWQgb24gYWpheENhbGxiYWNrc1xyXG52YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG53aW5kb3cuYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIgPSBhamF4Rm9ybXMub25TdWNjZXNzO1xyXG53aW5kb3cuYWpheEVycm9yUG9wdXBIYW5kbGVyID0gYWpheEZvcm1zLm9uRXJyb3I7XHJcbndpbmRvdy5hamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXIgPSBhamF4Rm9ybXMub25Db21wbGV0ZTtcclxuLy99XHJcblxyXG4vKiBSZWxvYWQgKi9cclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LnJlbG9hZCcpO1xyXG4vLyBXcmFwcGVyIGZ1bmN0aW9uIGFyb3VuZCBvblN1Y2Nlc3MgdG8gbWFyayBvcGVyYXRpb24gYXMgcGFydCBvZiBhIFxyXG4vLyByZWxvYWQgYXZvaWRpbmcgc29tZSBidWdzIChhcyByZXBsYWNlLWNvbnRlbnQgb24gYWpheC1ib3gsIG5vdCB3YW50ZWQgZm9yXHJcbi8vIHJlbG9hZCBvcGVyYXRpb25zKVxyXG5mdW5jdGlvbiByZWxvYWRTdWNjZXNzV3JhcHBlcigpIHtcclxuICB2YXIgY29udGV4dCA9ICQuaXNQbGFpbk9iamVjdCh0aGlzKSA/IHRoaXMgOiB7IGVsZW1lbnQ6IHRoaXMgfTtcclxuICBjb250ZXh0LmlzUmVsb2FkID0gdHJ1ZTtcclxuICBhamF4Rm9ybXMub25TdWNjZXNzLmFwcGx5KGNvbnRleHQsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xyXG59XHJcbiQuZm4ucmVsb2FkLmRlZmF1bHRzID0ge1xyXG4gIHN1Y2Nlc3M6IFtyZWxvYWRTdWNjZXNzV3JhcHBlcl0sXHJcbiAgZXJyb3I6IFthamF4Rm9ybXMub25FcnJvcl0sXHJcbiAgZGVsYXk6IGdMb2FkaW5nUmV0YXJkXHJcbn07XHJcblxyXG5MQy5tb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4uL0xDL21vdmVGb2N1c1RvJyk7XHJcbi8qIERpc2FibGVkIGJlY2F1c2UgY29uZmxpY3RzIHdpdGggdGhlIG1vdmVGb2N1c1RvIG9mIFxyXG4gIGFqYXhGb3JtLm9uc3VjY2VzcywgaXQgaGFwcGVucyBhIGJsb2NrLmxvYWRpbmcganVzdCBhZnRlclxyXG4gIHRoZSBzdWNjZXNzIGhhcHBlbnMuXHJcbiQuYmxvY2tVSS5kZWZhdWx0cy5vbkJsb2NrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gU2Nyb2xsIHRvIGJsb2NrLW1lc3NhZ2UgdG8gZG9uJ3QgbG9zdCBpbiBsYXJnZSBwYWdlczpcclxuICAgIExDLm1vdmVGb2N1c1RvKHRoaXMpO1xyXG59OyovXHJcblxyXG52YXIgbG9hZGVyID0gcmVxdWlyZSgnLi4vTEMvbG9hZGVyJyk7XHJcbkxDLmxvYWQgPSBsb2FkZXIubG9hZDtcclxuXHJcbnZhciBibG9ja3MgPSBMQy5ibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuLi9MQy9ibG9ja1ByZXNldHMnKTtcclxuLy97VEVNUFxyXG53aW5kb3cubG9hZGluZ0Jsb2NrID0gYmxvY2tzLmxvYWRpbmc7XHJcbndpbmRvdy5pbmZvQmxvY2sgPSBibG9ja3MuaW5mbztcclxud2luZG93LmVycm9yQmxvY2sgPSBibG9ja3MuZXJyb3I7XHJcbi8vfVxyXG5cclxuQXJyYXkucmVtb3ZlID0gcmVxdWlyZSgnLi4vTEMvQXJyYXkucmVtb3ZlJyk7XHJcbnJlcXVpcmUoJy4uL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMnKTtcclxuXHJcbkxDLmdldFRleHQgPSByZXF1aXJlKCcuLi9MQy9nZXRUZXh0Jyk7XHJcblxyXG52YXIgVGltZVNwYW4gPSBMQy50aW1lU3BhbiA9IHJlcXVpcmUoJy4uL0xDL1RpbWVTcGFuJyk7XHJcbnZhciB0aW1lU3BhbkV4dHJhID0gcmVxdWlyZSgnLi4vTEMvVGltZVNwYW5FeHRyYScpO1xyXG50aW1lU3BhbkV4dHJhLnBsdWdJbihUaW1lU3Bhbik7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc2VzXHJcbkxDLnNtYXJ0VGltZSA9IHRpbWVTcGFuRXh0cmEuc21hcnRUaW1lO1xyXG5MQy5yb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyID0gdGltZVNwYW5FeHRyYS5yb3VuZFRvUXVhcnRlckhvdXI7XHJcbi8vfVxyXG5cclxuTEMuQ2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4uL0xDL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxud2luZG93LlRhYmJlZFVYID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVgnKTtcclxudmFyIHNsaWRlclRhYnMgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5zbGlkZXJUYWJzJyk7XHJcblxyXG4vLyBQb3B1cCBBUElzXHJcbndpbmRvdy5zbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4uL0xDL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG52YXIgcG9wdXAgPSByZXF1aXJlKCcuLi9MQy9wb3B1cCcpO1xyXG4vL3tURU1QXHJcbnZhciBwb3B1cFN0eWxlID0gcG9wdXAuc3R5bGUsXHJcbiAgICBwb3B1cFNpemUgPSBwb3B1cC5zaXplO1xyXG5MQy5tZXNzYWdlUG9wdXAgPSBwb3B1cC5tZXNzYWdlO1xyXG5MQy5jb25uZWN0UG9wdXBBY3Rpb24gPSBwb3B1cC5jb25uZWN0QWN0aW9uO1xyXG53aW5kb3cucG9wdXAgPSBwb3B1cDtcclxuLy99XHJcblxyXG5MQy5zYW5pdGl6ZVdoaXRlc3BhY2VzID0gcmVxdWlyZSgnLi4vTEMvc2FuaXRpemVXaGl0ZXNwYWNlcycpO1xyXG4vL3tURU1QICAgYWxpYXMgYmVjYXVzZSBtaXNzcGVsbGluZ1xyXG5MQy5zYW5pdGl6ZVdoaXRlcGFjZXMgPSBMQy5zYW5pdGl6ZVdoaXRlc3BhY2VzO1xyXG4vL31cclxuXHJcbkxDLmdldFhQYXRoID0gcmVxdWlyZSgnLi4vTEMvZ2V0WFBhdGgnKTtcclxuXHJcbnZhciBzdHJpbmdGb3JtYXQgPSByZXF1aXJlKCcuLi9MQy9TdHJpbmdGb3JtYXQnKTtcclxuXHJcbi8vIEV4cGFuZGluZyBleHBvcnRlZCB1dGlsaXRlcyBmcm9tIG1vZHVsZXMgZGlyZWN0bHkgYXMgTEMgbWVtYmVyczpcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL1ByaWNlJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvbWF0aFV0aWxzJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvbnVtYmVyVXRpbHMnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy90b29sdGlwcycpKTtcclxudmFyIGkxOG4gPSBMQy5pMThuID0gcmVxdWlyZSgnLi4vTEMvaTE4bicpO1xyXG4vL3tURU1QIG9sZCBhbGlzZXMgb24gTEMgYW5kIGdsb2JhbFxyXG4kLmV4dGVuZChMQywgaTE4bik7XHJcbiQuZXh0ZW5kKHdpbmRvdywgaTE4bik7XHJcbi8vfVxyXG5cclxuLy8geHRzaDogcGx1Z2VkIGludG8ganF1ZXJ5IGFuZCBwYXJ0IG9mIExDXHJcbnZhciB4dHNoID0gcmVxdWlyZSgnLi4vTEMvanF1ZXJ5Lnh0c2gnKTtcclxueHRzaC5wbHVnSW4oJCk7XHJcbi8ve1RFTVAgICByZW1vdmUgb2xkIExDLiogYWxpYXNcclxuJC5leHRlbmQoTEMsIHh0c2gpO1xyXG5kZWxldGUgTEMucGx1Z0luO1xyXG4vL31cclxuXHJcbnZhciBhdXRvQ2FsY3VsYXRlID0gTEMuYXV0b0NhbGN1bGF0ZSA9IHJlcXVpcmUoJy4uL0xDL2F1dG9DYWxjdWxhdGUnKTtcclxuLy97VEVNUCAgIHJlbW92ZSBvbGQgYWxpYXMgdXNlXHJcbnZhciBsY1NldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyA9IGF1dG9DYWxjdWxhdGUub25UYWJsZUl0ZW1zO1xyXG5MQy5zZXR1cENhbGN1bGF0ZVN1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLm9uU3VtbWFyeTtcclxuTEMudXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUudXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeTtcclxuTEMuc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS5vbkRldGFpbGVkUHJpY2luZ1N1bW1hcnk7XHJcbi8vfVxyXG5cclxudmFyIENvb2tpZSA9IExDLkNvb2tpZSA9IHJlcXVpcmUoJy4uL0xDL0Nvb2tpZScpO1xyXG4vL3tURU1QICAgIG9sZCBhbGlhc1xyXG52YXIgZ2V0Q29va2llID0gQ29va2llLmdldCxcclxuICAgIHNldENvb2tpZSA9IENvb2tpZS5zZXQ7XHJcbi8vfVxyXG5cclxuTEMuZGF0ZVBpY2tlciA9IHJlcXVpcmUoJy4uL0xDL2RhdGVQaWNrZXInKTtcclxuLy97VEVNUCAgIG9sZCBhbGlhc1xyXG53aW5kb3cuc2V0dXBEYXRlUGlja2VyID0gTEMuc2V0dXBEYXRlUGlja2VyID0gTEMuZGF0ZVBpY2tlci5pbml0O1xyXG53aW5kb3cuYXBwbHlEYXRlUGlja2VyID0gTEMuYXBwbHlEYXRlUGlja2VyID0gTEMuZGF0ZVBpY2tlci5hcHBseTtcclxuLy99XHJcblxyXG5MQy5hdXRvRm9jdXMgPSByZXF1aXJlKCcuLi9MQy9hdXRvRm9jdXMnKTtcclxuXHJcbi8vIENSVURMOiBsb2FkaW5nIG1vZHVsZSwgc2V0dGluZyB1cCBjb21tb24gZGVmYXVsdCB2YWx1ZXMgYW5kIGNhbGxiYWNrczpcclxudmFyIGNydWRsTW9kdWxlID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKTtcclxuY3J1ZGxNb2R1bGUuZGVmYXVsdFNldHRpbmdzLmRhdGFbJ2ZvY3VzLWNsb3Nlc3QnXVsnZGVmYXVsdCddID0gJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbic7XHJcbmNydWRsTW9kdWxlLmRlZmF1bHRTZXR0aW5ncy5kYXRhWydmb2N1cy1tYXJnaW4nXVsnZGVmYXVsdCddID0gMTA7XHJcbnZhciBjcnVkbCA9IGNydWRsTW9kdWxlLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vIFByZXZpb3VzIHVzZWQgYWxpYXMgKGRlcHJlY2F0ZWQpOlxyXG5MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxuXHJcbi8vIFVJIFNsaWRlciBMYWJlbHNcclxudmFyIHNsaWRlckxhYmVscyA9IHJlcXVpcmUoJy4uL0xDL1VJU2xpZGVyTGFiZWxzJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG5MQy5jcmVhdGVMYWJlbHNGb3JVSVNsaWRlciA9IHNsaWRlckxhYmVscy5jcmVhdGU7XHJcbkxDLnVwZGF0ZUxhYmVsc0ZvclVJU2xpZGVyID0gc2xpZGVyTGFiZWxzLnVwZGF0ZTtcclxuTEMudWlTbGlkZXJMYWJlbHNMYXlvdXRzID0gc2xpZGVyTGFiZWxzLmxheW91dHM7XHJcbi8vfVxyXG5cclxudmFyIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuLi9MQy92YWxpZGF0aW9uSGVscGVyJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG5MQy5zZXR1cFZhbGlkYXRpb24gPSB2YWxpZGF0aW9uSGVscGVyLnNldHVwO1xyXG5MQy5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQgPSB2YWxpZGF0aW9uSGVscGVyLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDtcclxuTEMuZ29Ub1N1bW1hcnlFcnJvcnMgPSB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzO1xyXG4vL31cclxuXHJcbkxDLnBsYWNlSG9sZGVyID0gcmVxdWlyZSgnLi4vTEMvcGxhY2Vob2xkZXItcG9seWZpbGwnKS5pbml0O1xyXG5cclxuTEMubWFwUmVhZHkgPSByZXF1aXJlKCcuLi9MQy9nb29nbGVNYXBSZWFkeScpO1xyXG5cclxud2luZG93LmlzRW1wdHlTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9pc0VtcHR5U3RyaW5nJyk7XHJcblxyXG53aW5kb3cuZ3VpZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL0xDL2d1aWRHZW5lcmF0b3InKTtcclxuXHJcbnZhciB1cmxVdGlscyA9IHJlcXVpcmUoJy4uL0xDL3VybFV0aWxzJyk7XHJcbndpbmRvdy5nZXRVUkxQYXJhbWV0ZXIgPSB1cmxVdGlscy5nZXRVUkxQYXJhbWV0ZXI7XHJcbndpbmRvdy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSB1cmxVdGlscy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnM7XHJcblxyXG52YXIgZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nJyk7XHJcbi8ve1RFTVBcclxuTEMuZGF0ZVRvSW50ZXJjaGFuZ2xlU3RyaW5nID0gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nO1xyXG4vL31cclxuXHJcbi8vIFBhZ2VzIGluIHBvcHVwXHJcbnZhciB3ZWxjb21lUG9wdXAgPSByZXF1aXJlKCcuL3dlbGNvbWVQb3B1cCcpO1xyXG52YXIgZmFxc1BvcHVwcyA9IHJlcXVpcmUoJy4vZmFxc1BvcHVwcycpO1xyXG52YXIgYWNjb3VudFBvcHVwcyA9IHJlcXVpcmUoJy4vYWNjb3VudFBvcHVwcycpO1xyXG52YXIgbGVnYWxQb3B1cHMgPSByZXF1aXJlKCcuL2xlZ2FsUG9wdXBzJyk7XHJcblxyXG4vLyBPbGQgYXZhaWxhYmxpdHkgY2FsZW5kYXJcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0ID0gcmVxdWlyZSgnLi9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldCcpO1xyXG4vLyBOZXcgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhciA9IHJlcXVpcmUoJy4uL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyJyk7XHJcblxyXG52YXIgYXV0b2ZpbGxTdWJtZW51ID0gcmVxdWlyZSgnLi4vTEMvYXV0b2ZpbGxTdWJtZW51Jyk7XHJcblxyXG52YXIgdGFiYmVkV2l6YXJkID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVgud2l6YXJkJyk7XHJcblxyXG52YXIgaGFzQ29uZmlybVN1cHBvcnQgPSByZXF1aXJlKCcuLi9MQy9oYXNDb25maXJtU3VwcG9ydCcpO1xyXG5cclxudmFyIHBvc3RhbENvZGVWYWxpZGF0aW9uID0gcmVxdWlyZSgnLi4vTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24nKTtcclxuXHJcbnZhciB0YWJiZWROb3RpZmljYXRpb25zID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxudmFyIHRhYnNBdXRvbG9hZCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLmF1dG9sb2FkJyk7XHJcblxyXG52YXIgaG9tZVBhZ2UgPSByZXF1aXJlKCcuL2hvbWUnKTtcclxuXHJcbi8ve1RFTVAgcmVtb3ZlIGdsb2JhbCBkZXBlbmRlbmN5IGZvciB0aGlzXHJcbndpbmRvdy5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi4vTEMvanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG4vL31cclxuXHJcbnZhciBwcm92aWRlcldlbGNvbWUgPSByZXF1aXJlKCcuL3Byb3ZpZGVyV2VsY29tZScpO1xyXG5cclxudmFyIEhlbHBQb2ludCA9IHJlcXVpcmUoJy4uL0xDL0hlbHBQb2ludCcpLkhlbHBQb2ludDtcclxuXHJcbi8vIEdsb2JhbCBhY2Nlc3MgdG8gdGhlIEZhY2Vib29rIEFQSSB1dGlscyB0byBiZSB1c2VkIGJ5XHJcbi8vIHBhZ2VzIGFuZCBwYWdlLWNvbXBvbmVudHM7IGFueSBqYXZhc2NyaXB0IG1vZHVsZSBtdXN0XHJcbi8vIHJlcXVpcmUgaXQgaW5zdGVhZC5cclxud2luZG93LmZhY2Vib29rVXRpbHMgPSByZXF1aXJlKCcuLi9MQy9mYWNlYm9va1V0aWxzJyk7XHJcblxyXG4vKipcclxuICoqIEluaXQgY29kZVxyXG4qKiovXHJcbiQod2luZG93KS5sb2FkKGZ1bmN0aW9uICgpIHtcclxuICAvLyBEaXNhYmxlIGJyb3dzZXIgYmVoYXZpb3IgdG8gYXV0by1zY3JvbGwgdG8gdXJsIGZyYWdtZW50L2hhc2ggZWxlbWVudCBwb3NpdGlvbjpcclxuICAvLyBFWENFUFQgaW4gRGFzaGJvYXJkOlxyXG4gIC8vIFRPRE86IFJldmlldyBpZiB0aGlzIGlzIHJlcXVpcmVkIG9ubHkgZm9yIEhvd0l0V29ya3Mgb3Igc29tZXRoaW5nIG1vcmUgKHRhYnMsIHByb2ZpbGUpXHJcbiAgLy8gYW5kIHJlbW92ZSBpZiBwb3NzaWJsZSBvciBvbmx5IG9uIHRoZSBjb25jcmV0ZSBjYXNlcy5cclxuICBpZiAoIS9cXC9kYXNoYm9hcmRcXC8vaS50ZXN0KGxvY2F0aW9uKSlcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyAkKCdodG1sLGJvZHknKS5zY3JvbGxUb3AoMCk7IH0sIDEpO1xyXG59KTtcclxuJChmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgcHJvdmlkZXJXZWxjb21lLnNob3coKTtcclxuXHJcbiAgICAvLyBQbGFjZWhvbGRlciBwb2x5ZmlsbFxyXG4gICAgTEMucGxhY2VIb2xkZXIoKTtcclxuXHJcbiAgICAvLyBBdXRvZm9jdXMgcG9seWZpbGxcclxuICAgIExDLmF1dG9Gb2N1cygpO1xyXG5cclxuICAgIC8vIEdlbmVyaWMgc2NyaXB0IGZvciBlbmhhbmNlZCB0b29sdGlwcyBhbmQgZWxlbWVudCBkZXNjcmlwdGlvbnNcclxuICAgIExDLmluaXRUb29sdGlwcygpO1xyXG5cclxuICAgIGFqYXhGb3Jtcy5pbml0KCk7XHJcblxyXG4gICAgd2VsY29tZVBvcHVwLmluaXQoKTtcclxuXHJcbiAgICAvLyBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgZm9yIHNvbWUgbGlua3MgdGhhdCBieSBkZWZhdWx0IG9wZW4gYSBuZXcgdGFiOlxyXG4gICAgZmFxc1BvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gICAgYWNjb3VudFBvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gICAgbGVnYWxQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuXHJcbiAgICAvLyBPbGQgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbiAgICBhdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5pbml0KExjVXJsLkxhbmdQYXRoKTtcclxuICAgIC8vIE5ldyBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxuICAgIGF2YWlsYWJpbGl0eUNhbGVuZGFyLldlZWtseS5lbmFibGVBbGwoKTtcclxuXHJcbiAgICBwb3B1cC5jb25uZWN0QWN0aW9uKCk7XHJcblxyXG4gICAgLy8gRGF0ZSBQaWNrZXJcclxuICAgIExDLmRhdGVQaWNrZXIuaW5pdCgpO1xyXG5cclxuICAgIC8qIEF1dG8gY2FsY3VsYXRlIHRhYmxlIGl0ZW1zIHRvdGFsIChxdWFudGl0eSp1bml0cHJpY2U9aXRlbS10b3RhbCkgc2NyaXB0ICovXHJcbiAgICBhdXRvQ2FsY3VsYXRlLm9uVGFibGVJdGVtcygpO1xyXG4gICAgYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnkoKTtcclxuXHJcbiAgICBoYXNDb25maXJtU3VwcG9ydC5vbigpO1xyXG5cclxuICAgIHBvc3RhbENvZGVWYWxpZGF0aW9uLmluaXQoeyBiYXNlVXJsOiBMY1VybC5MYW5nUGF0aCB9KTtcclxuXHJcbiAgICAvLyBUYWJiZWQgaW50ZXJmYWNlXHJcbiAgICB0YWJzQXV0b2xvYWQuaW5pdChUYWJiZWRVWCk7XHJcbiAgICBUYWJiZWRVWC5pbml0KCk7XHJcbiAgICBUYWJiZWRVWC5mb2N1c0N1cnJlbnRMb2NhdGlvbigpO1xyXG4gICAgVGFiYmVkVVguY2hlY2tWb2xhdGlsZVRhYnMoKTtcclxuICAgIHNsaWRlclRhYnMuaW5pdChUYWJiZWRVWCk7XHJcblxyXG4gICAgdGFiYmVkV2l6YXJkLmluaXQoVGFiYmVkVVgsIHtcclxuICAgICAgICBsb2FkaW5nRGVsYXk6IGdMb2FkaW5nUmV0YXJkXHJcbiAgICB9KTtcclxuXHJcbiAgICB0YWJiZWROb3RpZmljYXRpb25zLmluaXQoVGFiYmVkVVgpO1xyXG5cclxuICAgIGF1dG9maWxsU3VibWVudSgpO1xyXG5cclxuICAgIEhlbHBQb2ludC5lbmFibGVBbGwoZG9jdW1lbnQpO1xyXG5cclxuICAgIC8vIFRPRE86ICdsb2FkSGFzaEJhbmcnIGN1c3RvbSBldmVudCBpbiB1c2U/XHJcbiAgICAvLyBJZiB0aGUgaGFzaCB2YWx1ZSBmb2xsb3cgdGhlICdoYXNoIGJhbmcnIGNvbnZlbnRpb24sIGxldCBvdGhlclxyXG4gICAgLy8gc2NyaXB0cyBkbyB0aGVpciB3b3JrIHRocm91Z2h0IGEgJ2xvYWRIYXNoQmFuZycgZXZlbnQgaGFuZGxlclxyXG4gICAgaWYgKC9eIyEvLnRlc3Qod2luZG93LmxvY2F0aW9uLmhhc2gpKVxyXG4gICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2xvYWRIYXNoQmFuZycsIHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKSk7XHJcblxyXG4gICAgLy8gUmVsb2FkIGJ1dHRvbnNcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcucmVsb2FkLWFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBHZW5lcmljIGFjdGlvbiB0byBjYWxsIGxjLmpxdWVyeSAncmVsb2FkJyBmdW5jdGlvbiBmcm9tIGFuIGVsZW1lbnQgaW5zaWRlIGl0c2VsZi5cclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICR0LmNsb3Nlc3QoJHQuZGF0YSgncmVsb2FkLXRhcmdldCcpKS5yZWxvYWQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8qIEVuYWJsZSBmb2N1cyB0YWIgb24gZXZlcnkgaGFzaCBjaGFuZ2UsIG5vdyB0aGVyZSBhcmUgdHdvIHNjcmlwdHMgbW9yZSBzcGVjaWZpYyBmb3IgdGhpczpcclxuICAgICogb25lIHdoZW4gcGFnZSBsb2FkICh3aGVyZT8pLFxyXG4gICAgKiBhbmQgYW5vdGhlciBvbmx5IGZvciBsaW5rcyB3aXRoICd0YXJnZXQtdGFiJyBjbGFzcy5cclxuICAgICogTmVlZCBiZSBzdHVkeSBpZiBzb21ldGhpbmcgb2YgdGhlcmUgbXVzdCBiZSByZW1vdmVkIG9yIGNoYW5nZWQuXHJcbiAgICAqIFRoaXMgaXMgbmVlZGVkIGZvciBvdGhlciBiZWhhdmlvcnMgdG8gd29yay4gKi9cclxuICAgIC8vIE9uIHRhcmdldC10YWIgbGlua3NcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhLnRhcmdldC10YWInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIoJCh0aGlzKS5hdHRyKCdocmVmJykpO1xyXG4gICAgICAgIGlmICh0aGVyZUlzVGFiKSB7XHJcbiAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRoZXJlSXNUYWIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBPbiBoYXNoIGNoYW5nZVxyXG4gICAgaWYgKCQuZm4uaGFzaGNoYW5nZSlcclxuICAgICAgICAkKHdpbmRvdykuaGFzaGNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICghL14jIS8udGVzdChsb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhlcmVJc1RhYilcclxuICAgICAgICAgICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIC8vIEhPTUUgUEFHRSAvIFNFQVJDSCBTVFVGRlxyXG4gICAgaG9tZVBhZ2UuaW5pdCgpO1xyXG5cclxuICAgIC8vIFZhbGlkYXRpb24gYXV0byBzZXR1cCBmb3IgcGFnZSByZWFkeSBhbmQgYWZ0ZXIgZXZlcnkgYWpheCByZXF1ZXN0XHJcbiAgICAvLyBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGZvcm0gaW4gdGhlIHBhZ2UuXHJcbiAgICAvLyBUaGlzIGF2b2lkIHRoZSBuZWVkIGZvciBldmVyeSBwYWdlIHdpdGggZm9ybSB0byBkbyB0aGUgc2V0dXAgaXRzZWxmXHJcbiAgICAvLyBhbG1vc3QgZm9yIG1vc3Qgb2YgdGhlIGNhc2UuXHJcbiAgICBmdW5jdGlvbiBhdXRvU2V0dXBWYWxpZGF0aW9uKCkge1xyXG4gICAgICAgIGlmICgkKGRvY3VtZW50KS5oYXMoJ2Zvcm0nKS5sZW5ndGgpXHJcbiAgICAgICAgICAgIHZhbGlkYXRpb25IZWxwZXIuc2V0dXAoJ2Zvcm0nKTtcclxuICAgIH1cclxuICAgIGF1dG9TZXR1cFZhbGlkYXRpb24oKTtcclxuICAgICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShhdXRvU2V0dXBWYWxpZGF0aW9uKTtcclxuXHJcbiAgICAvLyBUT0RPOiB1c2VkIHNvbWUgdGltZT8gc3RpbGwgcmVxdWlyZWQgdXNpbmcgbW9kdWxlcz9cclxuICAgIC8qXHJcbiAgICAqIENvbW11bmljYXRlIHRoYXQgc2NyaXB0LmpzIGlzIHJlYWR5IHRvIGJlIHVzZWRcclxuICAgICogYW5kIHRoZSBjb21tb24gTEMgbGliIHRvby5cclxuICAgICogQm90aCBhcmUgZW5zdXJlZCB0byBiZSByYWlzZWQgZXZlciBhZnRlciBwYWdlIGlzIHJlYWR5IHRvby5cclxuICAgICovXHJcbiAgICAkKGRvY3VtZW50KVxyXG4gICAgLnRyaWdnZXIoJ2xjU2NyaXB0UmVhZHknKVxyXG4gICAgLnRyaWdnZXIoJ2xjTGliUmVhZHknKTtcclxufSk7IiwiLyoqKioqIEFWQUlMQUJJTElUWSBDQUxFTkRBUiBXSURHRVQgKioqKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4uL0xDL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9kYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcnKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0KGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY2FsZW5kYXItY29udHJvbHMgLmFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5oYXNDbGFzcygnem9vbS1hY3Rpb24nKSkge1xyXG4gICAgICAgICAgICAvLyBEbyB6b29tXHJcbiAgICAgICAgICAgIHZhciBjID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpLmZpbmQoJy5jYWxlbmRhcicpLmNsb25lKCk7XHJcbiAgICAgICAgICAgIGMuY3NzKCdmb250LXNpemUnLCAnMnB4Jyk7XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSAkdC5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAgICAgYy5kYXRhKCdwb3B1cC1jb250YWluZXInLCB0YWIpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIHRhYiwgJ2F2YWlsYWJpbGl0eS1jYWxlbmRhcicsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIC8vIE5vdGhpbmcgbW9yZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5hdmlnYXRlIGNhbGVuZGFyXHJcbiAgICAgICAgdmFyIG5leHQgPSAkdC5oYXNDbGFzcygnbmV4dC13ZWVrLWFjdGlvbicpO1xyXG4gICAgICAgIHZhciBjb250ID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpO1xyXG4gICAgICAgIHZhciBjYWxjb250ID0gY29udC5jaGlsZHJlbignLmNhbGVuZGFyLWNvbnRhaW5lcicpO1xyXG4gICAgICAgIHZhciBjYWwgPSBjYWxjb250LmNoaWxkcmVuKCcuY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsaW5mbyA9IGNvbnQuZmluZCgnLmNhbGVuZGFyLWluZm8nKTtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKGNhbC5kYXRhKCdzaG93ZWQtZGF0ZScpKTtcclxuICAgICAgICB2YXIgdXNlcklkID0gY2FsLmRhdGEoJ3VzZXItaWQnKTtcclxuICAgICAgICBpZiAobmV4dClcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgNyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgLSA3KTtcclxuICAgICAgICB2YXIgc3RyZGF0ZSA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKTtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArIFwiUHJvZmlsZS8kQXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQvV2Vlay9cIiArIGVuY29kZVVSSUNvbXBvbmVudChzdHJkYXRlKSArIFwiLz9Vc2VySUQ9XCIgKyB1c2VySWQ7XHJcbiAgICAgICAgY2FsY29udC5yZWxvYWQodXJsLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIGdldCB0aGUgbmV3IG9iamVjdDpcclxuICAgICAgICAgICAgdmFyIGNhbCA9ICQoJy5jYWxlbmRhcicsIHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLnllYXItd2VlaycpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC13ZWVrJykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5maXJzdC13ZWVrLWRheScpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC1maXJzdC1kYXknKSk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLmxhc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtbGFzdC1kYXknKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBGQVFzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBmYXFzQmFzZVVybCA9ICdIZWxwQ2VudGVyLyRGQVFzJztcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICBmYXFzQmFzZVVybCA9IChiYXNlVXJsIHx8ICcvJykgKyBmYXFzQmFzZVVybDtcclxuXHJcbiAgLy8gRW5hYmxlIEZBUXMgbGlua3MgaW4gcG9wdXBcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYVtocmVmfD1cIiNGQVFzXCJdJywgcG9wdXBGYXFzKTtcclxuXHJcbiAgLy8gQXV0byBvcGVuIGN1cnJlbnQgZG9jdW1lbnQgbG9jYXRpb24gaWYgaGFzaCBpcyBhIEZBUSBsaW5rXHJcbiAgaWYgKC9eI0ZBUXMvaS50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICBwb3B1cEZhcXMobG9jYXRpb24uaGFzaCk7XHJcbiAgfVxyXG5cclxuICAvLyByZXR1cm4gYXMgdXRpbGl0eVxyXG4gIHJldHVybiBwb3B1cEZhcXM7XHJcbn07XHJcblxyXG4vKiBQYXNzIGEgRmFxcyBAdXJsIG9yIHVzZSBhcyBhIGxpbmsgaGFuZGxlciB0byBvcGVuIHRoZSBGQVEgaW4gYSBwb3B1cFxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdXBGYXFzKHVybCkge1xyXG4gIHVybCA9IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcclxuXHJcbiAgdmFyIHVybHBhcnRzID0gdXJsLnNwbGl0KCctJyk7XHJcblxyXG4gIGlmICh1cmxwYXJ0c1swXSAhPSAnI0ZBUXMnKSB7XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdUaGUgVVJMIGlzIG5vdCBhIEZBUSB1cmwgKGRvZXNuXFwndCBzdGFydHMgd2l0aCAjRkFRcy0pJywgdXJsKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgdmFyIHVybHNlY3Rpb24gPSB1cmxwYXJ0cy5sZW5ndGggPiAxID8gdXJscGFydHNbMV0gOiAnJztcclxuXHJcbiAgaWYgKHVybHNlY3Rpb24pIHtcclxuICAgIHZhciBwdXAgPSBwb3B1cChmYXFzQmFzZVVybCArIHVybHNlY3Rpb24sICdsYXJnZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGQgPSAkKHVybCksXHJcbiAgICAgICAgcGVsID0gcHVwLmdldENvbnRlbnRFbGVtZW50KCk7XHJcbiAgICAgIHBlbC5zY3JvbGxUb3AocGVsLnNjcm9sbFRvcCgpICsgZC5wb3NpdGlvbigpLnRvcCAtIDUwKTtcclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZC5lZmZlY3QoXCJoaWdobGlnaHRcIiwge30sIDIwMDApO1xyXG4gICAgICB9LCA0MDApO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufSIsIi8qIElOSVQgKi9cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gTG9jYXRpb24ganMtZHJvcGRvd25cclxuICAgIHZhciBzID0gJCgnI3NlYXJjaC1sb2NhdGlvbicpO1xyXG4gICAgcy5wcm9wKCdyZWFkb25seScsIHRydWUpO1xyXG4gICAgcy5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgIHNvdXJjZTogTEMuc2VhcmNoTG9jYXRpb25zLFxyXG4gICAgICAgIGF1dG9Gb2N1czogdHJ1ZSxcclxuICAgICAgICBtaW5MZW5ndGg6IDAsXHJcbiAgICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHMub24oJ2ZvY3VzIGNsaWNrJywgZnVuY3Rpb24gKCkgeyBzLmF1dG9jb21wbGV0ZSgnc2VhcmNoJywgJycpOyB9KTtcclxuXHJcbiAgICAvKiBQb3NpdGlvbnMgYXV0b2NvbXBsZXRlICovXHJcbiAgICB2YXIgcG9zaXRpb25zQXV0b2NvbXBsZXRlID0gJCgnI3NlYXJjaC1zZXJ2aWNlJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgICAgICAgLy8kKHRoaXMpLnZhbCh1aS5pdGVtLmxhYmVsKTtcclxuICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICAgICAvLyQodGhpcykudmFsKHVpLml0ZW0ubGFiZWwpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBMb2FkIGFsbCBwb3NpdGlvbnMgaW4gYmFja2dyb3VuZCB0byByZXBsYWNlIHRoZSBhdXRvY29tcGxldGUgc291cmNlIChhdm9pZGluZyBtdWx0aXBsZSwgc2xvdyBsb29rLXVwcylcclxuICAgIC8qJC5nZXRKU09OKExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdvcHRpb24nLCAnc291cmNlJywgZGF0YSk7XHJcbiAgICB9XHJcbiAgICApOyovXHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIExlZ2FsIHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJy52aWV3LXByaXZhY3ktcG9saWN5JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBvcHVwKGJhc2VVcmwgKyAnSGVscENlbnRlci8kUHJpdmFjeVBvbGljeS8nLCAnbGFyZ2UnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcudmlldy10ZXJtcy1vZi11c2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcG9wdXAoYmFzZVVybCArICdIZWxwQ2VudGVyLyRUZXJtc09mVXNlLycsICdsYXJnZScpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4qIFByb3ZpZGVyIFdlbGNvbWUgcGFnZVxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgU2ltcGxlU2xpZGVyID0gcmVxdWlyZSgnTEMvU2ltcGxlU2xpZGVyJyk7XHJcblxyXG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbiBwcm92aWRlcldlbGNvbWUoKSB7XHJcbiAgJCgnLlByb3ZpZGVyV2VsY29tZSAuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHQgPSAkKHRoaXMpLFxyXG4gICAgICBzbGlkZXIgPSBuZXcgU2ltcGxlU2xpZGVyKHtcclxuICAgICAgICBlbGVtZW50OiB0LFxyXG4gICAgICAgIHNlbGVjdG9yczoge1xyXG4gICAgICAgICAgc2xpZGVzOiAnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tc2xpZGVzJyxcclxuICAgICAgICAgIHNsaWRlOiAnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tc2xpZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjdXJyZW50U2xpZGVDbGFzczogJ2pzLWlzQ3VycmVudCcsXHJcbiAgICAgICAgaHJlZlByZWZpeDogJ2dvU2xpZGVfJyxcclxuICAgICAgICAvLyBEdXJhdGlvbiBvZiBlYWNoIHNsaWRlIGluIG1pbGxpc2Vjb25kc1xyXG4gICAgICAgIGR1cmF0aW9uOiAxMDAwXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIC8vIFNsaWRlIHN0ZXBzIGFjdGlvbnMgaW5pdGlhbGx5IGhpZGRlbiwgdmlzaWJsZSBhZnRlciAnc3RhcnQnXHJcbiAgICB2YXIgc2xpZGVzQWN0aW9ucyA9IHQuZmluZCgnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tYWN0aW9ucy1zbGlkZXMnKS5oaWRlKCk7XHJcbiAgICB0LmZpbmQoJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLWFjdGlvbnMtc3RhcnQgLnN0YXJ0LWFjdGlvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJCh0aGlzKS5oaWRlKCk7XHJcbiAgICAgIHNsaWRlc0FjdGlvbnMuZmFkZUluKDEwMDApO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4qIFdlbGNvbWUgcG9wdXBcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gYm9vdHN0cmFwIHRvb2x0aXBzOlxyXG5yZXF1aXJlKCdib290c3RyYXAnKTtcclxudmFyIENvb2tpZSA9IHJlcXVpcmUoJy4uL0xDL0Nvb2tpZScpO1xyXG4vL1RPRE8gbW9yZSBkZXBlbmRlbmNpZXM/XHJcblxyXG52YXIgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRXZWxjb21lUG9wdXAoKSB7XHJcblxyXG4gIGV4cG9ydHMuYXV0b1Nob3coKTtcclxuXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2Euc2lnbi11cCwgYS5yZWdpc3RlciwgYS5uZWVkLWxvZ2luLCBidXR0b24ubmVlZC1sb2dpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFJlbW92ZSBhbnkgb3BlbmVkIHBvcHVwIChpdCBvdmVybGF5cyB0aGUgd2VsY29tZXBvcHVwKVxyXG4gICAgJC51bmJsb2NrVUkoKTtcclxuXHJcbiAgICByZXR1cm4gIWV4cG9ydHMuc2hvdygpO1xyXG4gIH0pO1xyXG5cclxufTtcclxuXHJcbmV4cG9ydHMuYXV0b1Nob3cgPSBmdW5jdGlvbiBhdXRvU2hvd1dlbGNvbWVQb3B1cCgpIHtcclxuICB2YXIgJHdwID0gJCgnI3dlbGNvbWVwb3B1cCcpO1xyXG4gIHZhciAkd28gPSAkKCcjd2VsY29tZS1wb3B1cC1vdmVybGF5Jyk7XHJcblxyXG4gIC8vIFdoZW4gdGhlIHBvcHVwIGlzIGludGVncmF0ZWQgaW4gdGhlIHBhZ2UgaW5zdGVhZCBvZlxyXG4gIC8vIHRoZSBsYXlvdXQsIGV4ZWMgc2hvdyBhbmQgY2xvc2Ugb3JwaGFuIG92ZXJsYXkuXHJcbiAgaWYgKCR3cC5sZW5ndGggJiZcclxuICAgICR3cC5pcygnOnZpc2libGUnKSAmJlxyXG4gICAgJHdwLmNsb3Nlc3QoJyN3ZWxjb21lLXBvcHVwLW92ZXJsYXknKS5sZW5ndGggPT09IDApIHtcclxuICAgICR3by5oaWRlKCk7XHJcbiAgICBleHBvcnRzLnNob3codHJ1ZSk7XHJcbiAgICByZXR1cm47XHJcbiAgfSBlbHNlIGlmICgkd28uaGFzQ2xhc3MoJ2F1dG8tc2hvdycpKSB7XHJcbiAgICBleHBvcnRzLnNob3codHJ1ZSk7XHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy5pbml0UG9wdXAgPSBmdW5jdGlvbiBpbml0UG9wdXAoKSB7XHJcblxyXG4gICAgdmFyIGMgPSAkKCcjd2VsY29tZXBvcHVwJyk7XHJcbiAgICBpZiAoYy5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB2YXIgb3ZlcmxheSA9IGMuY2xvc2VzdCgnI3dlbGNvbWUtcG9wdXAtb3ZlcmxheScpO1xyXG5cclxuICAgIGlmIChjLmRhdGEoJ2lzLWluaXRpYWxpemVkJykpIHJldHVybiBvdmVybGF5O1xyXG5cclxuICAgIC8qKlxyXG4gICAgR28gdG8gdGhlIGZpcnN0IHN0ZXAgb24gYSBhbHJlYWR5IGluaXRpYWxpemVkIHBvcHVwXHJcbiAgICAqKi9cclxuICAgIGZ1bmN0aW9uIHN0YXJ0QWdhaW4oYW5pbWF0ZSkge1xyXG4gICAgICAgIC8vIFJldHVybiBwb3B1cCB0byB0aGUgZmlyc3Qgc3RlcCAoY2hvb3NlIHByb2ZpbGUsICM0ODYpIGFuZCBleGl0IC1pbml0IGlzIHJlYWR5LVxyXG4gICAgICAgIC8vIFNob3cgZmlyc3Qgc3RlcFxyXG4gICAgICAgIHZhciBzdGVwMSA9IGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlLCBoZWFkZXIgLnByZXNlbnRhdGlvbicpO1xyXG4gICAgICAgIGlmIChhbmltYXRlKVxyXG4gICAgICAgICAgICBzdGVwMS5zbGlkZURvd24oJ25vcm1hbCcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgc3RlcDEuc2hvdygpO1xyXG4gICAgICAgIC8vIEhpZGUgc2Vjb25kIHN0ZXBcclxuICAgICAgICB2YXIgc3RlcDIgPSBjLmZpbmQoJy50ZXJtcywgLnByb2ZpbGUtZGF0YScpO1xyXG4gICAgICAgIGlmIChhbmltYXRlKVxyXG4gICAgICAgICAgICBzdGVwMi5zbGlkZVVwKCdub3JtYWwnKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHN0ZXAyLmhpZGUoKTtcclxuXHJcbiAgICAgICAgLy8gSGlkZSBiYWNrLWFjdGlvbiBidXR0b25cclxuICAgICAgICBjLmZpbmQoJy5iYWNrLWFjdGlvbicpLmhpZGUoKTtcclxuICAgICAgICAvLyBSZXNldCBoaWRkZW4gZmllbGRzIHBlciBwcm9maWxlLXR5cGVcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGk6bm90KC5wb3NpdGlvbi1kZXNjcmlwdGlvbiknKS5zaG93KCk7XHJcbiAgICAgICAgLy8gUmVzZXQgY2hvb3NlbiBwcm9maWxlLXR5cGVcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgICAvLyBSZXNldCBVUkxzIHBlciBwcm9maWxlLXR5cGVcclxuICAgICAgICBjLmZpbmQoJ2EudGVybXMtb2YtdXNlJykuZGF0YSgndG9vbHRpcC11cmwnLCBmdW5jdGlvbiAoKSB7IHJldHVybiAkKHRoaXMpLmF0dHIoJ2RhdGEtdG9vbHRpcC11cmwnKTsgfSk7XHJcbiAgICAgICAgLy8gUmVzZXQgdmFsaWRhdGlvbiBydWxlc1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaSBpbnB1dDpub3QoW3R5cGU9aGlkZGVuXSknKVxyXG4gICAgICAgIC5hdHRyKCdkYXRhLXZhbCcsIG51bGwpXHJcbiAgICAgICAgLnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZGF0aW9uLWVycm9yJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGluaXRpYWxpemVkKSB7XHJcbiAgICAgICAgc3RhcnRBZ2FpbigpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xyXG5cclxuICAgIC8vIGNsb3NlIGJ1dHRvbiBsb2dpYyBhbmQgb25seSB3aGVuIGFzIHBvcHVwIChpdCBoYXMgb3ZlcmxheSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9IGMuZmluZCgnLmNsb3NlLXBvcHVwLCBbaHJlZj1cIiNjbG9zZS1wb3B1cFwiXScpO1xyXG4gICAgaWYgKG92ZXJsYXkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgIGNsb3NlQnV0dG9uLmhpZGUoKTtcclxuICAgIGVsc2VcclxuICAgICAgICBjbG9zZUJ1dHRvbi5zaG93KCkub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBvdmVybGF5LmZhZGVPdXQoJ25vcm1hbCcpO1xyXG4gICAgICAgICAgICBDb29raWUuc2V0KCdXZWxjb21lUG9wdXBWaXNpYmxlJywgJ2ZhbHNlJyk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAvLyBnbyBiYWNrIGJ1dHRvblxyXG4gICAgYy5maW5kKCcuYmFjay1hY3Rpb24nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHN0YXJ0QWdhaW4odHJ1ZSk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUG9wb3ZlcnMgZm9yIHRvb2x0aXAgcmVwbGFjZW1lbnRcclxuICAgIGMuZmluZCgnW2RhdGEtdG9nZ2xlPVwicG9wb3ZlclwiXScpXHJcbiAgICAucG9wb3ZlcigpXHJcbiAgICAuZmlsdGVyKCdhW2hyZWY9XCIjXCJdJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAvLyBBdm9pZCBuYXZpZ2F0ZSB0byB0aGUgbGlua1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBza2lwU3RlcDEgPSBjLmhhc0NsYXNzKCdzZWxlY3QtcG9zaXRpb24nKTtcclxuXHJcbiAgICAvLyBJbml0XHJcbiAgICBpZiAoIXNraXBTdGVwMSkge1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSwgLnRlcm1zLCAucG9zaXRpb24tZGVzY3JpcHRpb24nKS5oaWRlKCk7XHJcbiAgICB9XHJcbiAgICBjLmZpbmQoJ2Zvcm0nKS5nZXQoMCkucmVzZXQoKTtcclxuXHJcbiAgICAvLyBEZXNjcmlwdGlvbiBzaG93LXVwIG9uIGF1dG9jb21wbGV0ZSB2YXJpYXRpb25zXHJcbiAgICB2YXIgc2hvd1Bvc2l0aW9uRGVzY3JpcHRpb24gPSB7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgU2hvdyBkZXNjcmlwdGlvbiBpbiBhIHRleHRhcmVhIHVuZGVyIHRoZSBwb3NpdGlvbiBzaW5ndWxhcixcclxuICAgICAgICBpdHMgc2hvd2VkIG9uIGRlbWFuZC5cclxuICAgICAgICAqKi9cclxuICAgICAgICB0ZXh0YXJlYTogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICBjLmZpbmQoJy5wb3NpdGlvbi1kZXNjcmlwdGlvbicpXHJcbiAgICAgICAgICAgIC5zbGlkZURvd24oJ2Zhc3QnKVxyXG4gICAgICAgICAgICAuZmluZCgndGV4dGFyZWEnKS52YWwodWkuaXRlbS5kZXNjcmlwdGlvbik7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvKipcclxuICAgICAgICBTaG93IGRlc2NyaXB0aW9uIGluIGEgdG9vbHRpcCB0aGF0IGNvbWVzIGZyb20gdGhlIHBvc2l0aW9uIHNpbmd1bGFyXHJcbiAgICAgICAgZmllbGRcclxuICAgICAgICAqKi9cclxuICAgICAgICB0b29sdGlwOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIC8vIEl0IG5lZWRzIHRvIGJlIGRlc3Ryb3llZCAobm8gcHJvYmxlbSB0aGUgZmlyc3QgdGltZSlcclxuICAgICAgICAgICAgLy8gdG8gZ2V0IGl0IHVwZGF0ZWQgb24gc3VjY2VzaXZlIGF0dGVtcHRzXHJcbiAgICAgICAgICAgIHZhciBlbCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGVsXHJcbiAgICAgICAgICAgIC5wb3BvdmVyKCdkZXN0cm95JylcclxuICAgICAgICAgICAgLnBvcG92ZXIoe1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICdEb2VzIHRoaXMgc291bmQgbGlrZSB5b3U/JyxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHVpLml0ZW0uZGVzY3JpcHRpb24sXHJcbiAgICAgICAgICAgICAgICB0cmlnZ2VyOiAnZm9jdXMnLFxyXG4gICAgICAgICAgICAgICAgLy8gRGlmZmVyZW50IHBsYWNlbWVudCBmb3IgbW9iaWxlIGRlc2lnbiAodXAgdG8gNjQwcHggd2lkZSkgdG8gYXZvaWQgYmVpbmcgaGlkZGVuXHJcbiAgICAgICAgICAgICAgICBwbGFjZW1lbnQ6ICQoJ2h0bWwnKS53aWR0aCgpIDwgNjQwID8gJ3RvcCcgOiAnbGVmdCdcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLnBvcG92ZXIoJ3Nob3cnKVxyXG4gICAgICAgICAgICAvLyBIaWRlIG9uIHBvc3NpYmxlIHBvc2l0aW9uIG5hbWUgY2hhbmdlIHRvIGF2b2lkIGNvbmZ1c2lvbnNcclxuICAgICAgICAgICAgLy8gKHdlIGNhbid0IHVzZSBvbi1jaGFuZ2UsIG5lZWQgdG8gYmUga2V5cHJlc3M7IGl0cyBuYW1lc3BhY2VkXHJcbiAgICAgICAgICAgIC8vIHRvIGxldCBvZmYgYW5kIG9uIGV2ZXJ5IHRpbWUgdG8gYXZvaWQgbXVsdGlwbGUgaGFuZGxlciByZWdpc3RyYXRpb25zKVxyXG4gICAgICAgICAgICAub2ZmKCdrZXlwcmVzcy5kZXNjcmlwdGlvbi10b29sdGlwJylcclxuICAgICAgICAgICAgLm9uKCdrZXlwcmVzcy5kZXNjcmlwdGlvbi10b29sdGlwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZWwucG9wb3ZlcignaGlkZScpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIFJlLWVuYWJsZSBhdXRvY29tcGxldGU6XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgYy5maW5kKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTsgfSwgNTAwKTtcclxuICAgIGZ1bmN0aW9uIHNldHVwUG9zaXRpb25BdXRvY29tcGxldGUoc2VsZXRDYWxsYmFjaykge1xyXG4gICAgICAgIGMuZmluZCgnW25hbWU9am9idGl0bGVdJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgICAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgICAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBObyB2YWx1ZSwgbm8gYWN0aW9uIDooXHJcbiAgICAgICAgICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnZhbHVlKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBpZCAodmFsdWUpIGluIHRoZSBoaWRkZW4gZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgYy5maW5kKCdbbmFtZT1wb3NpdGlvbmlkXScpLnZhbCh1aS5pdGVtLnZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzZWxldENhbGxiYWNrLmNhbGwodGhpcywgZXZlbnQsIHVpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBXZSB3YW50IHRvIHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZvY3VzOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHNldHVwUG9zaXRpb25BdXRvY29tcGxldGUoc2hvd1Bvc2l0aW9uRGVzY3JpcHRpb24udG9vbHRpcCk7XHJcbiAgICBjLmZpbmQoJyN3ZWxjb21lcG9wdXBMb2FkaW5nJykucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gQWN0aW9uc1xyXG4gICAgZnVuY3Rpb24gc2hvd1N0ZXAyKGFuaW1hdGUpIHtcclxuXHJcbiAgICAgICAgdmFyICRwcm9maWxlID0gYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXTpjaGVja2VkJyk7XHJcbiAgICAgICAgdmFyIHByb2ZpbGUgPSAkcHJvZmlsZS52YWwoKTtcclxuXHJcbiAgICAgICAgLy8gU2hvdyBiYWNrLWFjdGlvbiBidXR0b25cclxuICAgICAgICBjLmZpbmQoJy5iYWNrLWFjdGlvbicpLnNob3coKTtcclxuXHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpOm5vdCguJyArIHByb2ZpbGUgKyAnKScpLmhpZGUoKTtcclxuICAgICAgICB2YXIgJHByZXNlbnRhdGlvbiA9IGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlLCBoZWFkZXIgLnByZXNlbnRhdGlvbicpO1xyXG4gICAgICAgIGlmIChhbmltYXRlKVxyXG4gICAgICAgICAgICAkcHJlc2VudGF0aW9uLnNsaWRlVXAoJ25vcm1hbCcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJHByZXNlbnRhdGlvbi5oaWRlKCk7XHJcblxyXG4gICAgICAgIHZhciAkcHJvZkRhdGEgPSBjLmZpbmQoJy50ZXJtcywgLnByb2ZpbGUtZGF0YScpO1xyXG4gICAgICAgIGlmIChhbmltYXRlKVxyXG4gICAgICAgICAgICAkcHJvZkRhdGEuc2xpZGVEb3duKCdub3JtYWwnKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICRwcm9mRGF0YS5zaG93KCk7XHJcblxyXG4gICAgICAgIC8vIFRlcm1zIG9mIHVzZSBkaWZmZXJlbnQgZm9yIHByb2ZpbGUgdHlwZVxyXG4gICAgICAgIGlmIChwcm9maWxlID09ICdjdXN0b21lcicpXHJcbiAgICAgICAgICAgIGMuZmluZCgnYS50ZXJtcy1vZi11c2UnKS5kYXRhKCd0b29sdGlwLXVybCcsIG51bGwpO1xyXG4gICAgICAgIC8vIENoYW5nZSBmYWNlYm9vayByZWRpcmVjdCBsaW5rXHJcbiAgICAgICAgdmFyIGZiYyA9IGMuZmluZCgnLmZhY2Vib29rLWNvbm5lY3QnKTtcclxuICAgICAgICB2YXIgYWRkUmVkaXJlY3QgPSAnY3VzdG9tZXJzJztcclxuICAgICAgICBpZiAocHJvZmlsZSA9PSAncHJvdmlkZXInKVxyXG4gICAgICAgICAgICBhZGRSZWRpcmVjdCA9ICdwcm92aWRlcnMnO1xyXG4gICAgICAgIGZiYy5kYXRhKCdyZWRpcmVjdCcsIGZiYy5kYXRhKCdyZWRpcmVjdCcpICsgYWRkUmVkaXJlY3QpO1xyXG4gICAgICAgIGZiYy5kYXRhKCdwcm9maWxlJywgcHJvZmlsZSk7XHJcblxyXG4gICAgICAgIC8vIFNldCB2YWxpZGF0aW9uLXJlcXVpcmVkIGZvciBkZXBlbmRpbmcgb2YgcHJvZmlsZS10eXBlIGZvcm0gZWxlbWVudHM6XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpLicgKyBwcm9maWxlICsgJyBpbnB1dDpub3QoW2RhdGEtdmFsXSk6bm90KFt0eXBlPWhpZGRlbl0pJylcclxuICAgICAgICAuYXR0cignZGF0YS12YWwtcmVxdWlyZWQnLCAnJylcclxuICAgICAgICAuYXR0cignZGF0YS12YWwnLCB0cnVlKTtcclxuXHJcbiAgICAgICAgLy8gRm9yIGN1c3RvbWVycyBiZWNvbWUgcHJvdmlkZXIsIGhpZGUgbmV3LWFjY291bnQgZmllbGRzXHJcbiAgICAgICAgZXhpc3RpbmdVc2VySGlkZUZpZWxkcyhjKTtcclxuXHJcbiAgICAgICAgLy8gaWYgRmFjZWJvb2sgQ29ubmVjdCBpcyBpbiB1c2UsIHVwZGF0ZSBmaWVsZHMgYW5kIHZhbGlkYXRpb25zXHJcbiAgICAgICAgZmFjZWJvb2tVcGRhdGVGaWVsZHNTdGF0dXMoYyk7XHJcblxyXG4gICAgICAgIExDLnNldHVwVmFsaWRhdGlvbigpO1xyXG4gICAgfVxyXG4gICAgYy5vbignY2hhbmdlJywgJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdJywgc2hvd1N0ZXAyLmJpbmQobnVsbCwgdHJ1ZSkpO1xyXG4gICAgYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNldHVwUG9zaXRpb25BdXRvY29tcGxldGUoc2hvd1Bvc2l0aW9uRGVzY3JpcHRpb24udG9vbHRpcCk7XHJcbiAgICAgICAgc2hvd1N0ZXAyKGZhbHNlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIElmIHByb2ZpbGUgdHlwZSBpcyBwcmVmaWxsZWQgYnkgcmVxdWVzdCwgc2hvdyBzdGVwMiBhbHJlYWR5OlxyXG4gICAgaWYgKGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV06Y2hlY2tlZCcpLmxlbmd0aClcclxuICAgICAgICBzaG93U3RlcDIoZmFsc2UpO1xyXG5cclxuICAgIGMub24oJ2NsaWNrJywgJy5mYWNlYm9vay1jb25uZWN0JywgZmFjZWJvb2tDb25uZWN0LmJpbmQobnVsbCwgYykpO1xyXG5cclxuICAgIGMuZGF0YSgnaXMtaW5pdGlhbGl6ZWQnLCB0cnVlKTtcclxuICAgIHJldHVybiBvdmVybGF5O1xyXG59O1xyXG5cclxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24gc2hvd1BvcHVwKGZyb21BdXRvU2hvdykge1xyXG5cclxuICAgIHZhciBvdmVybGF5ID0gZXhwb3J0cy5pbml0UG9wdXAoKTtcclxuXHJcbiAgICBpZiAob3ZlcmxheSAmJiBvdmVybGF5Lmxlbmd0aCkge1xyXG4gICAgICAgIC8vIEl0cyBhIGNvb2tpZSB3YXMgc2V0IHRvIHJlbWVtYmVyIHRoZSBwb3B1cCB3YXMgY2xvc2VkXHJcbiAgICAgICAgLy8gKGJlY2F1c2Ugd2FzIGNsb3NhYmxlKSwgYXZvaWQgdG8gc2hvdyBpdFxyXG4gICAgICAgIGlmICghZnJvbUF1dG9TaG93IHx8XHJcbiAgICAgICAgICAgIENvb2tpZS5nZXQoJ1dlbGNvbWVQb3B1cFZpc2libGUnKSAhPT0gJ2ZhbHNlJykge1xyXG4gICAgICAgICAgICBvdmVybGF5LmZhZGVJbigzMDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQWxsIGZpbmVcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGVsc2UgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBBdHRlbXB0IHRvIGxvZ2luIHdpdGggRmFjZWJvb2sgQ29ubmVjdCwgXHJcbiAgICBhbmQgZmlsbCB0aGUgZm9ybSB3aXRoIHRoZSBkYXRhIGZyb20gRmFjZWJvb2tcclxuKiovXHJcbmZ1bmN0aW9uIGZhY2Vib29rQ29ubmVjdCgkY29udGFpbmVyKSB7XHJcbiAgICB2YXIgZmIgPSByZXF1aXJlKCcuLi9MQy9mYWNlYm9va1V0aWxzJyk7XHJcblxyXG4gICAgZmIubG9naW4oeyBzY29wZTogJ2VtYWlsLHVzZXJfYWJvdXRfbWUnIH0sIGZ1bmN0aW9uIChhdXRoLCBGQikge1xyXG4gICAgICAgIC8vIFNldCBGYWNlYm9va0lkIHRvIGxpbmsgYWNjb3VudHM6XHJcbiAgICAgICAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImZhY2Vib29raWRcIl0nKS52YWwoYXV0aC51c2VySUQpO1xyXG4gICAgICAgIC8vIFJlcXVlc3QgbW9yZSB1c2VyIGRhdGFcclxuICAgICAgICBGQi5hcGkoJy9tZScsIGZ1bmN0aW9uICh1c2VyKSB7XHJcbiAgICAgICAgICAgIC8vRmlsbCBEYXRhXHJcbiAgICAgICAgICAgICRjb250YWluZXIuZmluZCgnW25hbWU9XCJlbWFpbFwiXScpLnZhbCh1c2VyLmVtYWlsKTtcclxuICAgICAgICAgICAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImZpcnN0bmFtZVwiXScpLnZhbCh1c2VyLmZpcnN0X25hbWUpO1xyXG4gICAgICAgICAgICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwibGFzdG5hbWVcIl0nKS52YWwodXNlci5sYXN0X25hbWUpO1xyXG4gICAgICAgICAgICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiZ2VuZGVyXCJdJykudmFsKHVzZXIuZ2VuZGVyKTtcclxuICAgICAgICAgICAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImFib3V0XCJdJykudmFsKHVzZXIuYWJvdXQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGZhY2Vib29rVXBkYXRlRmllbGRzU3RhdHVzKCRjb250YWluZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVja1VzZXJGb3JGYWNlYm9va0xvZ2luKGF1dGgudXNlcklELCAkY29udGFpbmVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vKipcclxuICAgIEl0IHRyaWdnZXJzIGFuIHVwZGF0ZSBvbiB0aGUgc3RhdHVzIG9mIGZpZWxkcyBhZmZlY3RlZFxyXG4gICAgYnkgYSBGYWNlYm9vayBDb25uZWN0OiBzb21lIG11c3QgYmUgaGlkZGVuLCBvdGhlcnMgc2hvd2VkLFxyXG4gICAgc29tZSBub3RlcyBhcHBlYXIgYW5kIHNvbWUgZmllbGQgYmVjb21lcyBvcHRpb25hbC5cclxuICAgIElmIHRoZXJlIGlzIG5vIGFuIGFjdGl2ZSBGYWNlYm9vayBDb25uZWN0aW9uL0lkLCBpdFxyXG4gICAgZG9lcyBub3RoaW5nIGFuZCByZXR1cm4gZmFsc2UuXHJcbioqL1xyXG5mdW5jdGlvbiBmYWNlYm9va1VwZGF0ZUZpZWxkc1N0YXR1cygkY29udGFpbmVyKSB7XHJcblxyXG4gICAgLy8gaWYgRmFjZWJvb2sgQ29ubmVjdCBpcyBpbiB1c2VcclxuICAgIGlmICgkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiZmFjZWJvb2tpZFwiXScpLnZhbCgpKSB7XHJcbiAgICAgICAgLy8gcmVtb3ZlIHZhbGlkYXRpb24gb24gcGFzc3dvcmRcclxuICAgICAgICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiY3JlYXRlLXBhc3N3b3JkXCJdJylcclxuICAgICAgICAgICAgLmF0dHIoJ2RhdGEtdmFsLXJlcXVpcmVkJywgbnVsbClcclxuICAgICAgICAgICAgLmF0dHIoJ2RhdGEtdmFsJywgZmFsc2UpO1xyXG5cclxuICAgICAgICB2YXIgZmVtYWlsID0gJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImVtYWlsXCJdJyk7XHJcbiAgICAgICAgdmFyIGZmaXJzdCA9ICRjb250YWluZXIuZmluZCgnW25hbWU9XCJmaXJzdG5hbWVcIl0nKTtcclxuICAgICAgICB2YXIgZmxhc3QgPSAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwibGFzdHRuYW1lXCJdJyk7XHJcblxyXG4gICAgICAgIC8vIEhpZGUgZGF0YSBzdWNjZXNzZnVsbHkgZmlsbGVkXHJcbiAgICAgICAgaWYgKGZmaXJzdC52YWwoKSlcclxuICAgICAgICAgICAgZmZpcnN0LmNsb3Nlc3QoJ2xpJykuaGlkZSgpO1xyXG4gICAgICAgIGlmIChmbGFzdC52YWwoKSlcclxuICAgICAgICAgICAgZmxhc3QuY2xvc2VzdCgnbGknKS5oaWRlKCk7XHJcblxyXG4gICAgICAgIC8vIEVtYWlsIGlzIHNwZWNpYWwsIHJlcXVpcmVzIGNvbmZpcm1hdGlvbiAjNTM4LFxyXG4gICAgICAgIGZlbWFpbC5zaG93KCkuY2xvc2VzdCgnbGknKS5zaG93KCk7XHJcbiAgICAgICAgLy8gc2hvd2luZyBhZGRpdGlvbmFsIG1lc3NhZ2UsXHJcbiAgICAgICAgZmVtYWlsLnNpYmxpbmdzKCcuZmFjZWJvb2stbm90ZScpLnNob3coKTtcclxuXHJcbiAgICAgICAgLy8gTWVzc2FnZSB0byBub3RpZmllZCB1c2VyIGlzIGNvbm5lY3RlZCB3aXRoIEZhY2Vib29rXHJcbiAgICAgICAgJGNvbnRhaW5lci5maW5kKCcuZmFjZWJvb2stbG9nZ2VkJykuc2hvdygpO1xyXG4gICAgICAgIC8vIGFuZCBoaWRkaW5nIHRoZSBidXR0b25cclxuICAgICAgICAkY29udGFpbmVyLmZpbmQoJy5mYWNlYm9vay1jb25uZWN0JykuaGlkZSgpO1xyXG4gICAgICAgICRjb250YWluZXIuZmluZCgnLmNob2ljZS1vcicpLmhpZGUoKTtcclxuXHJcbiAgICAgICAgLy8gUGFzc3dvcmQgaXMgc3BlY2lhbCB0b28sIG5vIG5lZWRlZCB3aXRoIEZhY2Vib29rXHJcbiAgICAgICAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImNyZWF0ZS1wYXNzd29yZFwiXScpLmNsb3Nlc3QoJ2xpJykuaGlkZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZXhpc3RpbmdVc2VySGlkZUZpZWxkcygkY29udGFpbmVyKSB7XHJcbiAgICB2YXIgZnVpZCA9ICRjb250YWluZXIuZmluZCgnW25hbWU9XCJ1c2VyaWRcIl0nKSxcclxuICAgICAgICBmZW1haWwgPSAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiZW1haWxcIl0nKSxcclxuICAgICAgICBmcHdkID0gJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImNyZWF0ZS1wYXNzd29yZFwiXScpO1xyXG4gICAgLy8gVGhlcmUgaXMgYW4gZXhpc3RpbmcgdXNlciAod2l0aCB1c2VyaWQ7IGp1c3QgY2hlY2sgdGhlIGVtYWlsIFxyXG4gICAgLy8gZm9yIGEgdmFsdWUgaXMgYnVnZ3ksIGNhdXNpbmcgIzU5NFxyXG4gICAgaWYgKGZ1aWQudmFsKCkpIHtcclxuICAgICAgICAvLyBIaWRlIGVtYWlsIGFuZCBwYXNzd29yZCBmaWVsZHNcclxuICAgICAgICBmZW1haWwuY2xvc2VzdCgnbGknKS5oaWRlKCk7XHJcbiAgICAgICAgZnB3ZC5jbG9zZXN0KCdsaScpLmhpZGUoKTtcclxuXHJcbiAgICAgICAgLy8gcmVtb3ZlIHZhbGlkYXRpb24gb24gcGFzc3dvcmRcclxuICAgICAgICBmcHdkXHJcbiAgICAgICAgICAgIC5hdHRyKCdkYXRhLXZhbC1yZXF1aXJlZCcsIG51bGwpXHJcbiAgICAgICAgICAgIC5hdHRyKCdkYXRhLXZhbCcsIGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqIFBpbmcgb3VyIHNlcnZlciBmb3IgYW55IGV4aXN0aW5nIHVzZXIgdGhhdCBtYXRjaGVzIFxyXG4gICAgdGhlIGxvZ2dlZCBGYWNlYm9va0lEIGFuZCB1cGRhdGUgVUkgbm90aWZ5aW5nIHRoYXRcclxuKiovXHJcbnZhciBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuLi9MQy9ibG9ja1ByZXNldHMnKSxcclxuICAgIExjVXJsID0gcmVxdWlyZSgnLi4vTEMvTGNVcmwnKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuLi9MQy9yZWRpcmVjdFRvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbmZ1bmN0aW9uIGNoZWNrVXNlckZvckZhY2Vib29rTG9naW4oZmFjZWJvb2tJRCwgJGNvbnRhaW5lcikge1xyXG4gICAgLy8gRG8gYSBzZXJ2ZXIgc2lkZSBxdWVyeSB0byBnZXQgZGF0YSBmb3IgdGhlIGV4aXN0aW5nIElEIFxyXG4gICAgLy8gYXNvY2lhdGVkIHdpdGggdGhlIGZhY2Vib29rSUQgYWNjb3VudCwgSUYgQU5ZLlxyXG4gICAgJGNvbnRhaW5lci5ibG9jayhibG9ja1ByZXNldHMubG9hZGluZyk7XHJcbiAgICAvLyBUaGUgY2FsbCBtdXN0IGluY2x1ZGUgdGhlIEZhY2Vib29rIElEIHBhcmFtZXRlclxyXG4gICAgLy8gYW5kIHRoZSBGYWNlYm9vayBsb2dpbiBjb29raWVcclxuICAgICQuZ2V0SlNPTihMY1VybC5SZXN0UGF0aCArICdmYWNlYm9vay11c2VyJywge1xyXG4gICAgICAgIGZhY2Vib29rX2lkOiBmYWNlYm9va0lELFxyXG4gICAgICAgIGRvX2xvZ2luOiB0cnVlXHJcbiAgICB9KS5kb25lKGZ1bmN0aW9uIChkYXRhKSB7XHJcblxyXG4gICAgICAgIHZhciBpc0N1c3RvbWVyID0gKCRjb250YWluZXIuZmluZCgnW25hbWU9XCJwcm9maWxlLXR5cGVcIl06Y2hlY2tlZCcpLnZhbCgpID09PSAnY3VzdG9tZXInKTtcclxuXHJcbiAgICAgICAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImVtYWlsXCJdJylcclxuICAgICAgICAudmFsKGRhdGEudXNlci5lbWFpbClcclxuICAgICAgICAucHJvcCgncmVhZE9ubHknLCB0cnVlKVxyXG4gICAgICAgIC5oaWRlKClcclxuICAgICAgICAuc2libGluZ3MoJy5mYWNlYm9vay1ub3RlJylcclxuICAgICAgICAuaGlkZSgpO1xyXG5cclxuICAgICAgICB2YXIgZnppcCA9ICRjb250YWluZXIuZmluZCgnW25hbWU9XCJ6aXBjb2RlXCJdJylcclxuICAgICAgICAudmFsKGRhdGEudXNlci5wb3N0YWxDb2RlKTtcclxuICAgICAgICBpZiAoZnppcC52YWwoKSkgZnppcC5oaWRlKCk7XHJcblxyXG4gICAgICAgICRjb250YWluZXIuZmluZCgnLmZhY2Vib29rLWxvZ2dlZCcpLmhpZGUoKTtcclxuICAgICAgICAkY29udGFpbmVyLmZpbmQoJy5mYWNlYm9vay1sb2dnZWQtaXMtdXNlcicpXHJcbiAgICAgICAgLnNob3coKVxyXG4gICAgICAgIC5maW5kKCcucHJvdmlkZXInKS50b2dnbGUoIWlzQ3VzdG9tZXIpO1xyXG5cclxuICAgICAgICAvLyBGb3IgY3VzdG9tZXJzLCBnbyBIb21lIG9yIGp1c3QgcmVsb2FkXHJcbiAgICAgICAgaWYgKGlzQ3VzdG9tZXIpIHtcclxuICAgICAgICAgICAgcmVkaXJlY3RUbyhMY1VybC5MYW5nUGF0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJGNvbnRhaW5lci51bmJsb2NrKCk7XHJcbiAgICB9KTtcclxufVxyXG4iLCJcblxuXG4vKlxuKiBAdmVyc2lvbiAgMC41LjBcbiogQGF1dGhvciAgIExhdXJpIFJvb2RlbiAtIGh0dHBzOi8vZ2l0aHViLmNvbS9saXRlanMvZGF0ZS1mb3JtYXQtbGl0ZVxuKiBAbGljZW5zZSAgTUlUIExpY2Vuc2UgIC0gaHR0cDovL2xhdXJpLnJvb2Rlbi5lZS9taXQtbGljZW5zZS50eHRcbiovXG5cblxuXG4hZnVuY3Rpb24oRGF0ZSwgcHJvdG8pIHtcblx0dmFyIG1hc2tSZSA9IC8oW1wiJ10pKCg/OlteXFxcXF18XFxcXC4pKj8pXFwxfFlZWVl8KFtNRF0pXFwzXFwzKFxcMz8pfFNTfChbWU1ESGhtc1ddKShcXDU/KXxbdVVBWlN3b10vZ1xuXHQsIHllYXJGaXJzdFJlID0gLyhcXGR7NH0pWy0uXFwvXShcXGRcXGQ/KVstLlxcL10oXFxkXFxkPykvXG5cdCwgZGF0ZUZpcnN0UmUgPSAvKFxcZFxcZD8pWy0uXFwvXShcXGRcXGQ/KVstLlxcL10oXFxkezR9KS9cblx0LCB0aW1lUmUgPSAvKFxcZFxcZD8pOihcXGRcXGQpOj8oXFxkXFxkKT9cXC4/KFxcZHszfSk/KD86XFxzKig/OihhKXwocCkpXFwuP21cXC4/KT8oXFxzKig/Olp8R01UfFVUQyk/KD86KFstK11cXGRcXGQpOj8oXFxkXFxkKT8pPyk/L2lcblx0LCB3b3JkUmUgPSAvLlthLXpdKy9nXG5cdCwgdW5lc2NhcGVSZSA9IC9cXFxcKC4pL2dcblx0Ly8sIGlzb0RhdGVSZSA9IC8oXFxkezR9KVstLlxcL11XKFxcZFxcZD8pWy0uXFwvXShcXGQpL1xuXHRcblxuXHQvLyBJU08gODYwMSBzcGVjaWZpZXMgbnVtZXJpYyByZXByZXNlbnRhdGlvbnMgb2YgZGF0ZSBhbmQgdGltZS5cblx0Ly9cblx0Ly8gVGhlIGludGVybmF0aW9uYWwgc3RhbmRhcmQgZGF0ZSBub3RhdGlvbiBpc1xuXHQvLyBZWVlZLU1NLUREXG5cdC8vXG5cdC8vIFRoZSBpbnRlcm5hdGlvbmFsIHN0YW5kYXJkIG5vdGF0aW9uIGZvciB0aGUgdGltZSBvZiBkYXkgaXNcblx0Ly8gaGg6bW06c3Ncblx0Ly9cblx0Ly8gVGltZSB6b25lXG5cdC8vXG5cdC8vIFRoZSBzdHJpbmdzICtoaDptbSwgK2hobW0sIG9yICtoaCAoYWhlYWQgb2YgVVRDKVxuXHQvLyAtaGg6bW0sIC1oaG1tLCBvciAtaGggKHRpbWUgem9uZXMgd2VzdCBvZiB0aGUgemVybyBtZXJpZGlhbiwgd2hpY2ggYXJlIGJlaGluZCBVVEMpXG5cdC8vXG5cdC8vIDEyOjAwWiA9IDEzOjAwKzAxOjAwID0gMDcwMC0wNTAwXG5cdFxuXHREYXRlW3Byb3RvXS5mb3JtYXQgPSBmdW5jdGlvbihtYXNrKSB7XG5cdFx0bWFzayA9IERhdGUubWFza3NbbWFza10gfHwgbWFzayB8fCBEYXRlLm1hc2tzW1wiZGVmYXVsdFwiXVxuXG5cdFx0dmFyIHNlbGYgPSB0aGlzXG5cdFx0LCBnZXQgPSBcImdldFwiICsgKG1hc2suc2xpY2UoMCw0KSA9PSBcIlVUQzpcIiA/IChtYXNrPW1hc2suc2xpY2UoNCksIFwiVVRDXCIpOlwiXCIpXG5cblx0XHRyZXR1cm4gbWFzay5yZXBsYWNlKG1hc2tSZSwgZnVuY3Rpb24obWF0Y2gsIHF1b3RlLCB0ZXh0LCBNRCwgTUQ0LCBzaW5nbGUsIHBhZCkge1xuXHRcdFx0dGV4dCA9IHNpbmdsZSA9PSBcIllcIiAgID8gc2VsZltnZXQgKyBcIkZ1bGxZZWFyXCJdKCkgJSAxMDBcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJZWVlZXCIgPyBzZWxmW2dldCArIFwiRnVsbFllYXJcIl0oKVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJNXCIgICA/IHNlbGZbZ2V0ICsgXCJNb250aFwiXSgpKzFcblx0XHRcdFx0IDogTUQgICAgID09IFwiTVwiID8gRGF0ZS5tb250aE5hbWVzWyBzZWxmW2dldCArIFwiTW9udGhcIl0oKSsoTUQ0ID8gMTIgOiAwKSBdXG5cdFx0XHRcdCA6IHNpbmdsZSA9PSBcIkRcIiAgID8gc2VsZltnZXQgKyBcIkRhdGVcIl0oKVxuXHRcdFx0XHQgOiBNRCAgICAgPT0gXCJEXCIgPyBEYXRlLmRheU5hbWVzWyBzZWxmW2dldCArIFwiRGF5XCJdKCkgKyAoTUQ0ID8gNzowICkgXVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJIXCIgICA/IHNlbGZbZ2V0ICsgXCJIb3Vyc1wiXSgpICUgMTIgfHwgMTJcblx0XHRcdFx0IDogc2luZ2xlID09IFwiaFwiICAgPyBzZWxmW2dldCArIFwiSG91cnNcIl0oKVxuXHRcdFx0XHQgOiBzaW5nbGUgPT0gXCJtXCIgICA/IHNlbGZbZ2V0ICsgXCJNaW51dGVzXCJdKClcblx0XHRcdFx0IDogc2luZ2xlID09IFwic1wiICAgPyBzZWxmW2dldCArIFwiU2Vjb25kc1wiXSgpXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiU1wiICAgID8gc2VsZltnZXQgKyBcIk1pbGxpc2Vjb25kc1wiXSgpXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiU1NcIiAgID8gKHF1b3RlID0gc2VsZltnZXQgKyBcIk1pbGxpc2Vjb25kc1wiXSgpLCBxdW90ZSA+IDk5ID8gcXVvdGUgOiAocXVvdGUgPiA5ID8gXCIwXCIgOiBcIjAwXCIgKSArIHF1b3RlKVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcInVcIiAgICA/IChzZWxmLzEwMDApPj4+MFxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlVcIiAgICA/ICtzZWxmXG5cdFx0XHRcdCA6IG1hdGNoID09IFwiQVwiICAgID8gRGF0ZVtzZWxmW2dldCArIFwiSG91cnNcIl0oKSA+IDExID8gXCJwbVwiIDogXCJhbVwiXVxuXHRcdFx0XHQgOiBtYXRjaCA9PSBcIlpcIiAgICA/IFwiR01UIFwiICsgKC1zZWxmLmdldFRpbWV6b25lT2Zmc2V0KCkvNjApXG5cdFx0XHRcdCA6IG1hdGNoID09IFwid1wiICAgID8gc2VsZltnZXQgKyBcIkRheVwiXSgpIHx8IDdcblx0XHRcdFx0IDogc2luZ2xlID09IFwiV1wiICAgPyAocXVvdGUgPSBuZXcgRGF0ZSgrc2VsZiArICgoNCAtIChzZWxmW2dldCArIFwiRGF5XCJdKCl8fDcpKSAqIDg2NDAwMDAwKSksIE1hdGguY2VpbCgoKHF1b3RlLmdldFRpbWUoKS1xdW90ZVtcInNcIiArIGdldC5zbGljZSgxKSArIFwiTW9udGhcIl0oMCwxKSkgLyA4NjQwMDAwMCArIDEgKSAvIDcpIClcblx0XHRcdFx0IDogbWF0Y2ggPT0gXCJvXCIgICAgPyBuZXcgRGF0ZSgrc2VsZiArICgoNCAtIChzZWxmW2dldCArIFwiRGF5XCJdKCl8fDcpKSAqIDg2NDAwMDAwKSlbZ2V0ICsgXCJGdWxsWWVhclwiXSgpXG5cdFx0XHRcdCA6IHF1b3RlICAgICAgICAgICA/IHRleHQucmVwbGFjZSh1bmVzY2FwZVJlLCBcIiQxXCIpXG5cdFx0XHRcdCA6IG1hdGNoXG5cdFx0XHRyZXR1cm4gcGFkICYmIHRleHQgPCAxMCA/IFwiMFwiK3RleHQgOiB0ZXh0XG5cdFx0fSlcblx0fVxuXG5cdERhdGUuYW0gPSBcIkFNXCJcblx0RGF0ZS5wbSA9IFwiUE1cIlxuXG5cdERhdGUubWFza3MgPSB7XCJkZWZhdWx0XCI6XCJEREQgTU1NIEREIFlZWVkgaGg6bW06c3NcIixcImlzb1V0Y0RhdGVUaW1lXCI6J1VUQzpZWVlZLU1NLUREXCJUXCJoaDptbTpzc1wiWlwiJ31cblx0RGF0ZS5tb250aE5hbWVzID0gXCJKYW5GZWJNYXJBcHJNYXlKdW5KdWxBdWdTZXBPY3ROb3ZEZWNKYW51YXJ5RmVicnVhcnlNYXJjaEFwcmlsTWF5SnVuZUp1bHlBdWd1c3RTZXB0ZW1iZXJPY3RvYmVyTm92ZW1iZXJEZWNlbWJlclwiLm1hdGNoKHdvcmRSZSlcblx0RGF0ZS5kYXlOYW1lcyA9IFwiU3VuTW9uVHVlV2VkVGh1RnJpU2F0U3VuZGF5TW9uZGF5VHVlc2RheVdlZG5lc2RheVRodXJzZGF5RnJpZGF5U2F0dXJkYXlcIi5tYXRjaCh3b3JkUmUpXG5cblx0Ly8qL1xuXG5cblx0Lypcblx0KiAvLyBJbiBDaHJvbWUgRGF0ZS5wYXJzZShcIjAxLjAyLjIwMDFcIikgaXMgSmFuXG5cdCogbiA9ICtzZWxmIHx8IERhdGUucGFyc2Uoc2VsZikgfHwgXCJcIitzZWxmO1xuXHQqL1xuXG5cdFN0cmluZ1twcm90b10uZGF0ZSA9IE51bWJlcltwcm90b10uZGF0ZSA9IGZ1bmN0aW9uKGZvcm1hdCkge1xuXHRcdHZhciBtLCB0ZW1wXG5cdFx0LCBkID0gbmV3IERhdGVcblx0XHQsIG4gPSArdGhpcyB8fCBcIlwiK3RoaXNcblxuXHRcdGlmIChpc05hTihuKSkge1xuXHRcdFx0Ly8gQmlnIGVuZGlhbiBkYXRlLCBzdGFydGluZyB3aXRoIHRoZSB5ZWFyLCBlZy4gMjAxMS0wMS0zMVxuXHRcdFx0aWYgKG0gPSBuLm1hdGNoKHllYXJGaXJzdFJlKSkgZC5zZXRGdWxsWWVhcihtWzFdLCBtWzJdLTEsIG1bM10pXG5cblx0XHRcdGVsc2UgaWYgKG0gPSBuLm1hdGNoKGRhdGVGaXJzdFJlKSkge1xuXHRcdFx0XHQvLyBNaWRkbGUgZW5kaWFuIGRhdGUsIHN0YXJ0aW5nIHdpdGggdGhlIG1vbnRoLCBlZy4gMDEvMzEvMjAxMVxuXHRcdFx0XHQvLyBMaXR0bGUgZW5kaWFuIGRhdGUsIHN0YXJ0aW5nIHdpdGggdGhlIGRheSwgZWcuIDMxLjAxLjIwMTFcblx0XHRcdFx0dGVtcCA9IERhdGUubWlkZGxlX2VuZGlhbiA/IDEgOiAyXG5cdFx0XHRcdGQuc2V0RnVsbFllYXIobVszXSwgbVt0ZW1wXS0xLCBtWzMtdGVtcF0pXG5cdFx0XHR9XG5cblx0XHRcdC8vIFRpbWVcblx0XHRcdG0gPSBuLm1hdGNoKHRpbWVSZSkgfHwgWzAsIDAsIDBdXG5cdFx0XHRkLnNldEhvdXJzKCBtWzZdICYmIG1bMV0gPCAxMiA/ICttWzFdKzEyIDogbVs1XSAmJiBtWzFdID09IDEyID8gMCA6IG1bMV0sIG1bMl0sIG1bM118MCwgbVs0XXwwKVxuXHRcdFx0Ly8gVGltZXpvbmVcblx0XHRcdGlmIChtWzddKSB7XG5cdFx0XHRcdGQuc2V0VGltZShkLSgoZC5nZXRUaW1lem9uZU9mZnNldCgpICsgKG1bOF18MCkqNjAgKyAoKG1bOF08MD8tMToxKSoobVs5XXwwKSkpKjYwMDAwKSlcblx0XHRcdH1cblx0XHR9IGVsc2UgZC5zZXRUaW1lKCBuIDwgNDI5NDk2NzI5NiA/IG4gKiAxMDAwIDogbiApXG5cdFx0cmV0dXJuIGZvcm1hdCA/IGQuZm9ybWF0KGZvcm1hdCkgOiBkXG5cdH1cblxufShEYXRlLCBcInByb3RvdHlwZVwiKVxuXG5cblxuXG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge1xuICB0aGlzLl9ldmVudHMgPSB0aGlzLl9ldmVudHMgfHwge307XG4gIHRoaXMuX21heExpc3RlbmVycyA9IHRoaXMuX21heExpc3RlbmVycyB8fCB1bmRlZmluZWQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblxuLy8gQmFja3dhcmRzLWNvbXBhdCB3aXRoIG5vZGUgMC4xMC54XG5FdmVudEVtaXR0ZXIuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9ldmVudHMgPSB1bmRlZmluZWQ7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLl9tYXhMaXN0ZW5lcnMgPSB1bmRlZmluZWQ7XG5cbi8vIEJ5IGRlZmF1bHQgRXZlbnRFbWl0dGVycyB3aWxsIHByaW50IGEgd2FybmluZyBpZiBtb3JlIHRoYW4gMTAgbGlzdGVuZXJzIGFyZVxuLy8gYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaCBoZWxwcyBmaW5kaW5nIG1lbW9yeSBsZWFrcy5cbkV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzID0gMTA7XG5cbi8vIE9idmlvdXNseSBub3QgYWxsIEVtaXR0ZXJzIHNob3VsZCBiZSBsaW1pdGVkIHRvIDEwLiBUaGlzIGZ1bmN0aW9uIGFsbG93c1xuLy8gdGhhdCB0byBiZSBpbmNyZWFzZWQuIFNldCB0byB6ZXJvIGZvciB1bmxpbWl0ZWQuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnNldE1heExpc3RlbmVycyA9IGZ1bmN0aW9uKG4pIHtcbiAgaWYgKCFpc051bWJlcihuKSB8fCBuIDwgMCB8fCBpc05hTihuKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ24gbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSBuO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGVyLCBoYW5kbGVyLCBsZW4sIGFyZ3MsIGksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBJZiB0aGVyZSBpcyBubyAnZXJyb3InIGV2ZW50IGxpc3RlbmVyIHRoZW4gdGhyb3cuXG4gIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHMuZXJyb3IgfHxcbiAgICAgICAgKGlzT2JqZWN0KHRoaXMuX2V2ZW50cy5lcnJvcikgJiYgIXRoaXMuX2V2ZW50cy5lcnJvci5sZW5ndGgpKSB7XG4gICAgICBlciA9IGFyZ3VtZW50c1sxXTtcbiAgICAgIGlmIChlciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHRocm93IGVyOyAvLyBVbmhhbmRsZWQgJ2Vycm9yJyBldmVudFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdVbmNhdWdodCwgdW5zcGVjaWZpZWQgXCJlcnJvclwiIGV2ZW50LicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzVW5kZWZpbmVkKGhhbmRsZXIpKVxuICAgIHJldHVybiBmYWxzZTtcblxuICBpZiAoaXNGdW5jdGlvbihoYW5kbGVyKSkge1xuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgLy8gZmFzdCBjYXNlc1xuICAgICAgY2FzZSAxOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAyOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgLy8gc2xvd2VyXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgICAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBhcmdzID0gbmV3IEFycmF5KGxlbiAtIDEpO1xuICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuXG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgdmFyIG07XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCFlbWl0dGVyLl9ldmVudHMgfHwgIWVtaXR0ZXIuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSAwO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKGVtaXR0ZXIuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gMTtcbiAgZWxzZVxuICAgIHJldCA9IGVtaXR0ZXIuX2V2ZW50c1t0eXBlXS5sZW5ndGg7XG4gIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG4iXX0=
