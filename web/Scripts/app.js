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
var extend = require('./extend').extend;

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
    that.$el.removeClass(cl || '_')
    // Remove error class too (to fill the case of a previous error)
    .removeClass(that.classes.hasDataError || '_');
  });

  return req;
};
/**
Replacing, but reusing internals, the default onerror callback for the
fetchData function to add notification classes to our component model
**/
componentFetchData.onerror = function bindableComponentFechDataOnerror(x, s, e) {
  DataSource.prototype.fetchError.call(x, s, e);
  // Add error class:
  this.$el
  .addClass(this.classes.hasDataError)
  .removeClass(this.classes.fetching || '_')
  .removeClass(this.classes.prefetching || '_');
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
    }
  },
  // Constructor
  function BindableComponent(element, options) {
    Component.call(this, element, options);

    this.data = this.$el.data('source') || this.data || {};
    if (typeof (this.data) == 'string')
      this.data = JSON.parse(this.data);

    // On html source url configuration:
    this.url = this.$el.data('source-url') || this.url;

    // TODO: 'change' event handlers on forms with data-bind to update its value at this.data
    // TODO: auto 'bindData' on fetchData ends? configurable, bindDataMode{ inmediate, notify }
  }
);

// Public module:
module.exports = BindableComponent;
},{"./Component":3,"./DataSource":4,"./extend":6}],3:[function(require,module,exports){
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
  switch (mode || updateData.defaultUpdateMode) {

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
  switch (mode || fetchData.defaultRequestMode) {

    case reqModes.single:
      if (fetchData.requests.length) return null;
      break;

    case reqModes.replace:
      for (var i = 0; i < this.requests.length; i++) {
        try {
          fetchData.requests[i].abort();
        } catch (ex) { }
        fetchData.requests = [];
      }
      break;

    // Just do nothing for multiple or default     
    //case reqModes.multiple:  
    //default: 
  }

  var that = this;
  var req = fetchData.proxy(
    this.url,
    query,
    function (data) {
      that.updateData(data);
      fetchData.requests.splice(fetchData.requests.indexOf(req), 1);
      //delete fetchData.requests[fetchData.requests.indexOf(req)];
    }
  ).fail(fetchData.onerror);
  fetchData.requests.push(req);

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
  if (console && console.error) console.error('Fetch data error %s %o', e);
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
        this.fetchData.onerror(null, 'error', { name: 'data-format', message: data.ErrorMessage });
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
},{"./LcUrl":10,"./blockPresets":32,"./loader":59,"./popup":65,"./redirectTo":67}],10:[function(require,module,exports){
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
},{"./mathUtils":60}],12:[function(require,module,exports){
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
},{}],15:[function(require,module,exports){
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
},{"./jquery.reload":55}],16:[function(require,module,exports){
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

},{"./changesNotification":"f5kckb","./smoothBoxBlock":"KQGzNM"}],17:[function(require,module,exports){
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
},{"./jquery.hasScrollBar":52}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
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
},{"./ajaxCallbacks":25,"./blockPresets":32,"./changesNotification":"f5kckb","./popup":65,"./redirectTo":67,"./validationHelper":"kqf9lt"}],"rqZkA9":[function(require,module,exports){
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

},{"./TimeSpan":"rqZkA9","./mathUtils":60}],"LC/TimeSpanExtra":[function(require,module,exports){
module.exports=require('5OLBBz');
},{}],24:[function(require,module,exports){
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

},{"./TimeSpan":"rqZkA9","./mathUtils":60,"./tooltips":"UTsC2v"}],25:[function(require,module,exports){
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

        // Check if the returned element is the ajax-box, if not, find
        // the element in the newhtml:
        var jb = newhtml.filter('.ajax-box');
        if (jb.length === 0)
          jb = newhtml;
        if (!ctx.boxIsContainer && !jb.is('.ajax-box'))
            jb = newhtml.find('.ajax-box:eq(0)');
        if (!jb || jb.length === 0) {
            // There is no ajax-box, use all element returned:
            jb = newhtml;
        }

        if (replaceBoxContent) {
          // Replace the box content with the content of the returned box
          // or all if there is no ajax-box in the result.
          ctx.box.empty().append(jb.is('.ajax-box') ? jb.contents() : jb);
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
},{"./changesNotification":"f5kckb","./createIframe":35,"./moveFocusTo":"9RKOGW","./popup":65,"./redirectTo":67,"./smoothBoxBlock":"KQGzNM","./validationHelper":"kqf9lt"}],26:[function(require,module,exports){
/* Forms submitted via AJAX */
var $ = jQuery || require('jquery'),
    callbacks = require('./ajaxCallbacks'),
    changesNotification = require('./changesNotification'),
    blockPresets = require('./blockPresets'),
    validationHelper = require('./validationHelper');

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

    // Validations
    var validationPassed = true;
    // To support sub-forms throuh fieldset.ajax, we must execute validations and verification
    // in two steps and using the real form to let validation mechanism work
    var isSubform = ctx.form.is('fieldset.ajax');
    var actualForm = isSubform ? ctx.form.closest('form') : ctx.form,
      disabledSummaries = new jQuery();

    // On subform validation, we don't want the form validation-summary controls to be affected
    // by this validation (to avoid to show errors there that doesn't interest to the rest of the form)
    // To fullfill this requisit, we need to hide it for the validator for a while and let only affect
    // any local summary (inside the subform).
    if (isSubform) {
      disabledSummaries = actualForm
      .find('[data-valmsg-summary=true]')
      .filter(function () {
        // Only those that are outside the subform
        return !$.contains(ctx.form.get(0), this);
      })
      // We must use 'attr' instead of 'data' because is what we and unobtrusiveValidation checks
      // (in other words, using 'data' will not work)
      .attr('data-valmsg-summary', 'false');
    }

    // First at all, if unobtrusive validation is enabled, validate
    var valobject = actualForm.data('unobtrusiveValidation');
    if (valobject && valobject.validate() === false) {
      validationHelper.goToSummaryErrors(ctx.form);
      validationPassed = false;
    }

    // If custom validation is enabled, validate
    var cusval = actualForm.data('customValidation');
    if (cusval && cusval.validate && cusval.validate() === false) {
      validationHelper.goToSummaryErrors(ctx.form);
      validationPassed = false;
    }

    // To support sub-forms, we must check that validations errors happened inside the
    // subform and not in other elements, to don't stop submit on not related errors.
    // Just look for marked elements:
    if (isSubform && ctx.form.find('.input-validation-error').length)
      validationPassed = false;

    // Re-enable again that summaries previously disabled
    if (isSubform) {
      // We must use 'attr' instead of 'data' because is what we and unobtrusiveValidation checks
      // (in other words, using 'data' will not work)
      disabledSummaries.attr('data-valmsg-summary', 'true');
    }

    // Check validation status
    if (validationPassed === false) {
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
},{"./ajaxCallbacks":25,"./blockPresets":32,"./changesNotification":"f5kckb","./validationHelper":"kqf9lt"}],27:[function(require,module,exports){
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
},{"./numberUtils":63}],28:[function(require,module,exports){
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
},{}],29:[function(require,module,exports){
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
},{}],"LC/availabilityCalendar":[function(require,module,exports){
module.exports=require('XnVhYw');
},{}],"XnVhYw":[function(require,module,exports){
/**
  AvailabilityCalendar Module
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  LcWidget = require('./CX/LcWidget'),
  extend = require('./CX/extend');
require('./jquery.bounds');

/**-----------------------
Common private utilities
-----------------------**/

/*------ CONSTANTS ---------*/
var statusTypes = ['unavailable', 'available'];
// Week days names in english for internal system
// use; NOT for localization/translation.
var systemWeekDays = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
];

/*--------- CONFIG - INSTANCE ----------*/
var weeklyClasses = {
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
  legendUnavailable: 'AvailabilityCalendar-legend-unavailable'
};

var weeklyTexts = {
  abbrWeekDays: [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ],
  today: 'Today',
  // Allowed special values: M:month, D:day
  abbrDateFormat: 'M/D'
};

/*----------- VIEW ----------------*/

function moveBindRangeInDays(weekly, days) {
  var 
    start = addDays(weekly.datesRange.start, days),
    end = addDays(weekly.datesRange.end, days),
    datesRange = datesToRange(start, end);

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

  // Check cache: if there is almost one date in the range
  // without data, we set inCache as false and fetch the data:
  var inCache = true;
  eachDateInRange(start, end, function (date) {
    var datekey = dateISO.dateLocal(date, true);
    if (!weekly.data.slots[datekey]) {
      inCache = false;
      return false;
    }
  });

  if (inCache)
  // Just show the data
    weekly.bindData(datesRange);
  else
  // Fetch (download) the data and show on ready:
    weekly
    .fetchData(datesToQuery(datesRange))
    .done(function () {
      weekly.bindData(datesRange);
    });
}

/** Update the view labels for the week-days (table headers)
**/
function updateLabels(datesRange, calendar, options) {
  var start = datesRange.start,
      end = datesRange.end;

  var days = calendar.find('.' + options.classes.days + ' th');
  var today = dateISO.dateLocal(new Date());
  // First cell is empty ('the cross headers cell'), then offset is 1
  var offset = 1;
  eachDateInRange(start, end, function (date, i) {
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

/**
Mark calendar as current-week and disable prev button,
or remove the mark and enable it if is not.
**/
function checkCurrentWeek(calendar, date, options) {
  var yep = isInCurrentWeek(date);
  calendar.toggleClass(options.classes.currentWeek, yep);
  calendar.find('.' + options.classes.prevAction).prop('disabled', yep);
}

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

/** Pack two dates in a simple but useful
  structure { start, end }
**/
function datesToRange(start, end) {
  return {
    start: start,
    end: end
  };
}

/*----------- DATES (generic functions) ---------------*/

function currentWeek() {
  return {
    start: getFirstWeekDate(new Date()),
    end: getLastWeekDate(new Date())
  };
}
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

function getFirstWeekDate(date) {
  var d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function getLastWeekDate(date) {
  var d = new Date(date);
  d.setDate(d.getDate() + (6 - d.getDay()));
  return d;
}

function isInCurrentWeek(date) {
  return dateISO.dateLocal(getFirstWeekDate(date)) == dateISO.dateLocal(getFirstWeekDate(new Date()));
}

function addDays(date, days) {
  var d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

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

/** Very simple custom-format function to allow 
l10n of texts.
Cover cases:
- M for month
- D for day
**/
function formatDate(date, format) {
  var s = format,
      M = date.getMonth() + 1,
      D = date.getDate();
  s = s.replace(/M/g, M);
  s = s.replace(/D/g, D);
  return s;
}

/**
  Weekly calendar, inherits from LcWidget
**/
var Weekly = LcWidget.extend(
// Prototype
{
classes: weeklyClasses,
texts: weeklyTexts,
url: '/calendar/get-availability/',

// Our 'view' will be a subset of the data,
// delimited by the next property, a dates range:
datesRange: { start: null, end: null },
bindData: function bindDataWeekly(datesRange) {
  this.datesRange = datesRange = datesRange || this.datesRange;
  var 
      slotsContainer = this.$el.find('.' + this.classes.slots),
      slots = slotsContainer.find('td');

  checkCurrentWeek(this.$el, datesRange.start, this);

  updateLabels(datesRange, this.$el, this);

  // Remove any previous status class from all slots
  for (var s = 0; s < statusTypes.length; s++) {
    slots.removeClass(this.classes.slotStatusPrefix + statusTypes[s] || '_');
  }

  // Set all slots with default status
  slots.addClass(this.classes.slotStatusPrefix + this.data.defaultStatus);

  var that = this;

  eachDateInRange(datesRange.start, datesRange.end, function (date, i) {
    var datekey = dateISO.dateLocal(date, true);
    var dateSlots = that.data.slots[datekey];
    if (dateSlots) {
      for (s = 0; s < dateSlots.length; s++) {
        var slot = dateSlots[s];
        var slotCell = findCellBySlot(slotsContainer, i, slot);
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
  var firstDates = currentWeek();
  var request = this.fetchData(datesToQuery(firstDates)).done(function () {
    that.bindData(firstDates);
    // Prefetching 3 weeks in advance
    var threeWeeks = datesToQuery(addDays(firstDates.start, 7), addDays(firstDates.end, 21));
    request = that.fetchData(threeWeeks, null, true);
  });
  checkCurrentWeek(this.$el, firstDates.start, this);

  // Set handlers for prev-next actions:
  this.$el.on('click', '.' + this.classes.prevAction, function prev() {
    moveBindRangeInDays(that, -7);
  });
  this.$el.on('click', '.' + this.classes.nextAction, function next() {
    moveBindRangeInDays(that, 7);
  });

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
    var slot = findSlotByCell(slotsContainer, cell);
    // Get week-day slots array:
    var wkslots = that.data.slots[systemWeekDays[slot.day]] = that.data.slots[systemWeekDays[slot.day]] || [];
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

    toggleCell(firstCell);
    for (var y = y1 + 1; y < y2; y++) {
      var cell = firstCell.closest('tbody').children('tr:eq(' + y + ')').children('td:eq(' + x + ')');
      toggleCell(cell);
    }
    toggleCell(lastCell);
  }

  this.$el.find(slotsContainer).on('click', 'td', function () {
    toggleCell($(this));
    that.bindData();
    return false;
  });

  var dragging = {
    first: null,
    last: null,
    selectionLayer: $('<div class="SelectionLayer" />').appendTo(this.$el)
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

      dragging.first = dragging.last = null;
    }
    dragging.selectionLayer.hide();
  }

  this.$el.find(slotsContainer)
  .on('mousedown', 'td', function () {
    dragging.first = $(this);
    dragging.last = null;
    dragging.selectionLayer.show();

    var s = dragging.first.bounds({ includeBorder: true });
    //console.log('first bounds', s);
    offsetToPosition(dragging.selectionLayer[0], s);

    //console.log('mousedown', dragging);
  })
  .on('mouseenter', 'td', function () {
    if (dragging.first) {
      dragging.last = $(this);

      updateSelection(dragging.last);

      //console.log('mouseenter', dragging);
    }
  })
  .on('mouseup', finishDrag)
  .find('td')
  .attr('draggable', true);
  // This will not work with pointer-events:none, but on other
  // cases (recentIE)
  dragging.selectionLayer.on('mouseup', finishDrag)
  .attr('draggable', true);
}

/**
    Work hours calendar, inherits from LcWidget
**/
var WorkHours = LcWidget.extend(
// Prototype
{
classes: extend({}, weeklyClasses, {
  weeklyCalendar: undefined,
  workHoursCalendar: 'AvailabilityCalendar--workHours'
}),
texts: weeklyTexts,
url: '/calendar/get-availability/',
bindData: function bindDataWorkHours() {
  var 
    slotsContainer = this.$el.find('.' + this.classes.slots),
    slots = slotsContainer.find('td');

  // Remove any previous status class from all slots
  for (var s = 0; s < statusTypes.length; s++) {
    slots.removeClass(this.classes.slotStatusPrefix + statusTypes[s] || '_');
  }

  // Set all slots with default status
  slots.addClass(this.classes.slotStatusPrefix + this.data.defaultStatus);

  var that = this;
  for (var wk = 0; wk < systemWeekDays.length; wk++) {
    var dateSlots = that.data.slots[systemWeekDays[wk]];
    if (dateSlots && dateSlots.length) {
      for (s = 0; s < dateSlots.length; s++) {
        var slot = dateSlots[s];
        var slotCell = findCellBySlot(slotsContainer, wk, slot);
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


/**
   Public API:
**/
exports.Weekly = Weekly;
exports.WorkHours = WorkHours;
},{"./CX/LcWidget":5,"./CX/extend":6,"./jquery.bounds":51,"LC/dateISO8601":"0dIKTs"}],32:[function(require,module,exports){
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
module.exports=require('f5kckb');
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
},{"./getXPath":43,"./jqueryUtils":"7/CV3J"}],35:[function(require,module,exports){
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


},{}],36:[function(require,module,exports){
/* CRUDL Helper */
var $ = require('jquery');
var smoothBoxBlock = require('./smoothBoxBlock');
var changesNotification = require('./changesNotification');
require('./jquery.xtsh').plugIn($);
var getText = require('./getText');

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
  }
};

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

              // user callback:
              if (typeof (anotherOnComplete) === 'function')
                anotherOnComplete.apply(this, Array.prototype.slice.call(arguments, 0));
            };
          }
          // We need a custom complete callback, but to not replace the user callback, we
          // clone first the settings and then apply our callback that internally will call
          // the user callback properly (if any)
          var withcallback = $.extend(true, {}, instance.settings.effects['hide-editor']);
          withcallback.complete = oncomplete(withcallback.complete);
          // Hiding editor:
          dtr.xhide(withcallback);

          // Mark form as saved to remove the 'has-changes' mark
          changesNotification.registerSave(dtr.find('form').get(0));

          // Custom event
          crudl.trigger(instance.settings.events['edit-ends']);

          return false;
        }

        dtr
        .on('click', '.crudl-cancel', finishEdit)
        .on('ajaxSuccessPostMessageClosed', '.ajax-box', finishEdit)
        .on('ajaxSuccessPost', 'form, fieldset', function (e, data) {
          if (data.Code === 0 || data.Code == 5 || data.Code == 6) {
            // Show viewer and reload list:
            vwr.xshow(instance.settings.effects['show-viewer'])
            .find('.crudl-list').reload({ autofocus: false });
          }
          // A small delay to let user to see the new message on button before
          // hide it (because is inside the editor)
          if (data.Code == 5)
            setTimeout(finishEdit, 1500);
        })
        .on('ajaxFormReturnedHtml', 'form, fieldset', function (jb, form, jx) {
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

},{"./changesNotification":"f5kckb","./getText":"qf5Iz3","./jquery.xtsh":56,"./smoothBoxBlock":"KQGzNM"}],"LC/dateISO8601":[function(require,module,exports){
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
  }

  return parsedDate;
};
},{}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
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
},{}],43:[function(require,module,exports){
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

},{"./loader":59}],"LC/googleMapReady":[function(require,module,exports){
module.exports=require('ygr/Yz');
},{}],46:[function(require,module,exports){
/* GUID Generator
 */
module.exports = function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
},{}],47:[function(require,module,exports){
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
},{}],48:[function(require,module,exports){
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
},{}],49:[function(require,module,exports){
/* Returns true when str is
- null
- empty string
- only white spaces string
*/
module.exports = function isEmptyString(str) {
    return !(/\S/g.test(str || ""));
};
},{}],50:[function(require,module,exports){
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
},{}],51:[function(require,module,exports){
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
},{}],52:[function(require,module,exports){
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
},{}],53:[function(require,module,exports){
/** Checks if current element or one of the current set of elements has
a parent that match the element or expression given as first parameter
**/
var $ = jQuery || require('jquery');
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};
},{}],54:[function(require,module,exports){
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
},{}],55:[function(require,module,exports){
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
},{"./smoothBoxBlock":"KQGzNM"}],56:[function(require,module,exports){
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

},{}],59:[function(require,module,exports){
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
},{}],60:[function(require,module,exports){
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
        marginTop: 30
    }, options);
    $('html,body').stop(true, true).animate({ scrollTop: $(el).offset().top - options.marginTop }, 500, null);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = moveFocusTo;
}
},{}],"LC/moveFocusTo":[function(require,module,exports){
module.exports=require('9RKOGW');
},{}],63:[function(require,module,exports){
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
},{"./i18n":48,"./mathUtils":60}],64:[function(require,module,exports){
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
},{}],65:[function(require,module,exports){
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
},{"./createIframe":35,"./moveFocusTo":"9RKOGW","./smoothBoxBlock":"KQGzNM"}],66:[function(require,module,exports){
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
},{}],67:[function(require,module,exports){
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

},{}],68:[function(require,module,exports){
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
},{"./autoFocus":28,"./jquery.xtsh":56,"./jqueryUtils":"7/CV3J","./moveFocusTo":"9RKOGW"}],"LC/tooltips":[function(require,module,exports){
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
    // If there is not content:
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

},{"./jquery.isChildOf":53,"./jquery.outerHtml":54,"./sanitizeWhitespaces":68}],73:[function(require,module,exports){
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
},{}],76:[function(require,module,exports){
/**
    Enable the use of popups to show links to some Account pages (default links behavior is to open in a new tab)
**/
var $ = require('jquery');

exports.enable = function (baseUrl) {
    $(document)
    .on('click', 'a.login', function () {
        var url = baseUrl + 'Account/$Login/?ReturnUrl=' + encodeURIComponent(window.location);
        popup(url, { width: 410, height: 320 });
        return false;
    })
    .on('click', 'a.register', function () {
        var url = this.getAttribute('href').replace('/Account/Register', '/Account/$Register');
        popup(url, { width: 450, height: 500 });
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
},{}],77:[function(require,module,exports){
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
$.fn.reload.defaults = {
    success: [ajaxForms.onSuccess],
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

// CRUDL
var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
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
//var takeATourPopup = require('takeATourPopup');
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

/**
 ** Init code
***/
$(window).load(function () {
    // Disable browser behavior to auto-scroll to url fragment/hash element position:
    setTimeout(function () { $('html,body').scrollTop(0); }, 1);
});
$(function () {
  // Placeholder polyfill
  LC.placeHolder();

  // Autofocus polyfill
  LC.autoFocus();

  // Generic script for enhanced tooltips and element descriptions
  LC.initTooltips();

  ajaxForms.init();

  //takeATourPopup.show();
  welcomePopup.show();
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
},{"../LC/Array.remove":1,"../LC/Cookie":7,"../LC/LcUrl":10,"../LC/Price":11,"../LC/String.prototype.contains":12,"../LC/StringFormat":"KqXDvj","../LC/TabbedUX":17,"../LC/TabbedUX.autoload":15,"../LC/TabbedUX.changesNotification":16,"../LC/TabbedUX.sliderTabs":18,"../LC/TabbedUX.wizard":19,"../LC/TimeSpan":"rqZkA9","../LC/TimeSpanExtra":"5OLBBz","../LC/UISliderLabels":24,"../LC/ajaxCallbacks":25,"../LC/ajaxForms":26,"../LC/autoCalculate":27,"../LC/autoFocus":28,"../LC/autofillSubmenu":29,"../LC/availabilityCalendar":"XnVhYw","../LC/blockPresets":32,"../LC/changesNotification":"f5kckb","../LC/crudl":36,"../LC/datePicker":39,"../LC/dateToInterchangeableString":40,"../LC/getText":"qf5Iz3","../LC/getXPath":43,"../LC/googleMapReady":"ygr/Yz","../LC/guidGenerator":46,"../LC/hasConfirmSupport":47,"../LC/i18n":48,"../LC/isEmptyString":49,"../LC/jquery.are":50,"../LC/jquery.hasScrollBar":52,"../LC/jquery.reload":55,"../LC/jquery.xtsh":56,"../LC/jqueryUtils":"7/CV3J","../LC/loader":59,"../LC/mathUtils":60,"../LC/moveFocusTo":"9RKOGW","../LC/numberUtils":63,"../LC/placeholder-polyfill":64,"../LC/popup":65,"../LC/postalCodeServerValidation":66,"../LC/sanitizeWhitespaces":68,"../LC/smoothBoxBlock":"KQGzNM","../LC/tooltips":"UTsC2v","../LC/urlUtils":73,"../LC/validationHelper":"kqf9lt","./accountPopups":76,"./availabilityCalendarWidget":78,"./faqsPopups":79,"./home":80,"./legalPopups":81,"./welcomePopup":82}],78:[function(require,module,exports){
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
},{"../LC/dateToInterchangeableString":40,"../LC/jquery.reload":55,"../LC/smoothBoxBlock":"KQGzNM"}],79:[function(require,module,exports){
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
},{}],80:[function(require,module,exports){
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
},{}],81:[function(require,module,exports){
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
},{}],82:[function(require,module,exports){
/**
* Welcome popup
*/
var $ = require('jquery');
//TODO more dependencies?

exports.show = function welcomePopup() {
    var c = $('#welcomepopup');
    if (c.length === 0) return;
    var skipStep1 = c.hasClass('select-position');

    // Init
    if (!skipStep1) {
        c.find('.profile-data, .terms, .position-description').hide();
    }
    c.find('form').get(0).reset();
    // Re-enable autocomplete:
    setTimeout(function () { c.find('[placeholder]').placeholder(); }, 500);
    function initProfileData() {
        c.find('[name=jobtitle]').autocomplete({
            source: LcUrl.JsonPath + 'GetPositions/Autocomplete/',
            autoFocus: false,
            minLength: 0,
            select: function (event, ui) {
                // No value, no action :(
                if (!ui || !ui.item || !ui.item.value) return;
                // Save the id (value) in the hidden element
                c.find('[name=positionid]').val(ui.item.value);
                // Show description
                c.find('.position-description')
                        .slideDown('fast')
                        .find('textarea').val(ui.item.description);
                // We want show the label (position name) in the textbox, not the id-value
                $(this).val(ui.item.positionSingular);
                return false;
            },
            focus: function (event, ui) {
                if (!ui || !ui.item || !ui.item.positionSingular);
                // We want the label in textbox, not the value
                $(this).val(ui.item.positionSingular);
                return false;
            }
        });
    }
    initProfileData();
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
        initProfileData();
        c.find('.profile-choice [name=profile-type]:checked').change();
    });

    // If profile type is prefilled by request:
    c.find('.profile-choice [name=profile-type]:checked').change();
};

},{}]},{},[77,"cwp+TC","0dIKTs"])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0FycmF5LnJlbW92ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9CaW5kYWJsZUNvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9Db21wb25lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ1gvRGF0YVNvdXJjZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9MY1dpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9leHRlbmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ29va2llLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0ZhY2Vib29rQ29ubmVjdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9MY1VybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9QcmljZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9TdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZ0Zvcm1hdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC5hdXRvbG9hZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC5jaGFuZ2VzTm90aWZpY2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLnNsaWRlclRhYnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVgud2l6YXJkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RpbWVTcGFuLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RpbWVTcGFuRXh0cmEuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVUlTbGlkZXJMYWJlbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYWpheENhbGxiYWNrcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Rm9ybXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXV0b0NhbGN1bGF0ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXV0b2ZpbGxTdWJtZW51LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2Jsb2NrUHJlc2V0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NyZWF0ZUlmcmFtZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlSVNPODYwMS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9nZXRUZXh0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFhQYXRoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dvb2dsZU1hcFJlYWR5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2d1aWRHZW5lcmF0b3IuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvaGFzQ29uZmlybVN1cHBvcnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvaTE4bi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pc0VtcHR5U3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5hcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmJvdW5kcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5pc0NoaWxkT2YuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lm91dGVySHRtbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkucmVsb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS54dHNoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeVV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2xvYWRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tYXRoVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbnVtYmVyVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcGxhY2Vob2xkZXItcG9seWZpbGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Ntb290aEJveEJsb2NrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Rvb2x0aXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3VybFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3ZhbGlkYXRpb25IZWxwZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FjY291bnRQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FwcC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2ZhcXNQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2xlZ2FsUG9wdXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC93ZWxjb21lUG9wdXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMvTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBcnJheSBSZW1vdmUgLSBCeSBKb2huIFJlc2lnIChNSVQgTGljZW5zZWQpXHJcbi8qQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xyXG5JYWdvU1JMOiBpdCBzZWVtcyBpbmNvbXBhdGlibGUgd2l0aCBNb2Rlcm5penIgbG9hZGVyIGZlYXR1cmUgbG9hZGluZyBaZW5kZXNrIHNjcmlwdCxcclxubW92ZWQgZnJvbSBwcm90b3R5cGUgdG8gYSBjbGFzcy1zdGF0aWMgbWV0aG9kICovXHJcbmZ1bmN0aW9uIGFycmF5UmVtb3ZlKGFuQXJyYXksIGZyb20sIHRvKSB7XHJcbiAgICB2YXIgcmVzdCA9IGFuQXJyYXkuc2xpY2UoKHRvIHx8IGZyb20pICsgMSB8fCBhbkFycmF5Lmxlbmd0aCk7XHJcbiAgICBhbkFycmF5Lmxlbmd0aCA9IGZyb20gPCAwID8gYW5BcnJheS5sZW5ndGggKyBmcm9tIDogZnJvbTtcclxuICAgIHJldHVybiBhbkFycmF5LnB1c2guYXBwbHkoYW5BcnJheSwgcmVzdCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhcnJheVJlbW92ZTtcclxufSBlbHNlIHtcclxuICAgIEFycmF5LnJlbW92ZSA9IGFycmF5UmVtb3ZlO1xyXG59IiwiLyoqXHJcbiAgQmluZGFibGUgVUkgQ29tcG9uZW50LlxyXG4gIEl0IHJlbGllcyBvbiBDb21wb25lbnQgYnV0IGFkZHMgRGF0YVNvdXJjZSBjYXBhYmlsaXRpZXNcclxuKiovXHJcbnZhciBEYXRhU291cmNlID0gcmVxdWlyZSgnLi9EYXRhU291cmNlJyk7XHJcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKCcuL0NvbXBvbmVudCcpO1xyXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKS5leHRlbmQ7XHJcblxyXG4vKipcclxuUmV1c2luZyB0aGUgb3JpZ2luYWwgZmV0Y2hEYXRhIG1ldGhvZCBidXQgYWRkaW5nIGNsYXNzZXMgdG8gb3VyXHJcbmNvbXBvbmVudCBlbGVtZW50IGZvciBhbnkgdmlzdWFsIG5vdGlmaWNhdGlvbiBvZiB0aGUgZGF0YSBsb2FkaW5nLlxyXG5NZXRob2QgZ2V0IGV4dGVuZGVkIHdpdGggaXNQcmVmZXRjaGluZyBtZXRob2QgZm9yIGRpZmZlcmVudFxyXG5jbGFzc2VzL25vdGlmaWNhdGlvbnMgZGVwZW5kYW50IG9uIHRoYXQgZmxhZywgYnkgZGVmYXVsdCBmYWxzZTpcclxuKiovXHJcbnZhciBjb21wb25lbnRGZXRjaERhdGEgPSBmdW5jdGlvbiBiaW5kYWJsZUNvbXBvbmVudEZldGNoRGF0YShxdWVyeURhdGEsIG1vZGUsIGlzUHJlZmV0Y2hpbmcpIHtcclxuICB2YXIgY2wgPSBpc1ByZWZldGNoaW5nID8gdGhpcy5jbGFzc2VzLnByZWZldGNoaW5nIDogdGhpcy5jbGFzc2VzLmZldGNoaW5nO1xyXG4gIHRoaXMuJGVsLmFkZENsYXNzKGNsKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHZhciByZXEgPSBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaERhdGEuY2FsbCh0aGlzLCBxdWVyeURhdGEsIG1vZGUpXHJcbiAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC4kZWwucmVtb3ZlQ2xhc3MoY2wgfHwgJ18nKVxyXG4gICAgLy8gUmVtb3ZlIGVycm9yIGNsYXNzIHRvbyAodG8gZmlsbCB0aGUgY2FzZSBvZiBhIHByZXZpb3VzIGVycm9yKVxyXG4gICAgLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5oYXNEYXRhRXJyb3IgfHwgJ18nKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHJlcTtcclxufTtcclxuLyoqXHJcblJlcGxhY2luZywgYnV0IHJldXNpbmcgaW50ZXJuYWxzLCB0aGUgZGVmYXVsdCBvbmVycm9yIGNhbGxiYWNrIGZvciB0aGVcclxuZmV0Y2hEYXRhIGZ1bmN0aW9uIHRvIGFkZCBub3RpZmljYXRpb24gY2xhc3NlcyB0byBvdXIgY29tcG9uZW50IG1vZGVsXHJcbioqL1xyXG5jb21wb25lbnRGZXRjaERhdGEub25lcnJvciA9IGZ1bmN0aW9uIGJpbmRhYmxlQ29tcG9uZW50RmVjaERhdGFPbmVycm9yKHgsIHMsIGUpIHtcclxuICBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaEVycm9yLmNhbGwoeCwgcywgZSk7XHJcbiAgLy8gQWRkIGVycm9yIGNsYXNzOlxyXG4gIHRoaXMuJGVsXHJcbiAgLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5oYXNEYXRhRXJyb3IpXHJcbiAgLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5mZXRjaGluZyB8fCAnXycpXHJcbiAgLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5wcmVmZXRjaGluZyB8fCAnXycpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgQmluZGFibGVDb21wb25lbnQgY2xhc3NcclxuKiovXHJcbnZhciBCaW5kYWJsZUNvbXBvbmVudCA9IENvbXBvbmVudC5leHRlbmQoXHJcbiAgRGF0YVNvdXJjZS5wcm90b3R5cGUsXHJcbiAgLy8gUHJvdG90eXBlXHJcbiAge1xyXG4gICAgY2xhc3Nlczoge1xyXG4gICAgICBmZXRjaGluZzogJ2lzLWxvYWRpbmcnLFxyXG4gICAgICBwcmVmZXRjaGluZzogJ2lzLXByZWxvYWRpbmcnLFxyXG4gICAgICBoYXNEYXRhRXJyb3I6ICdoYXMtZGF0YUVycm9yJ1xyXG4gICAgfSxcclxuICAgIGZldGNoRGF0YTogY29tcG9uZW50RmV0Y2hEYXRhLFxyXG4gICAgLy8gV2hhdCBhdHRyaWJ1dGUgbmFtZSB1c2UgdG8gbWFyayBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbXBvbmVudFxyXG4gICAgLy8gd2l0aCB0aGUgcHJvcGVydHkgZnJvbSB0aGUgc291cmNlIHRvIGJpbmQuXHJcbiAgICAvLyBUaGUgcHJlZml4ICdkYXRhLScgaW4gY3VzdG9tIGF0dHJpYnV0ZXMgaXMgcmVxdWlyZWQgYnkgaHRtbDUsXHJcbiAgICAvLyBqdXN0IHNwZWNpZnkgdGhlIHNlY29uZCBwYXJ0LCBiZWluZyAnYmluZCcgdGhlIGF0dHJpYnV0ZVxyXG4gICAgLy8gbmFtZSB0byB1c2UgaXMgJ2RhdGEtYmluZCdcclxuICAgIGRhdGFCaW5kQXR0cmlidXRlOiAnYmluZCcsXHJcbiAgICAvLyBEZWZhdWx0IGJpbmREYXRhIGltcGxlbWVudGF0aW9uLCBjYW4gYmUgcmVwbGFjZSBvbiBleHRlbmRlZCBjb21wb25lbnRzXHJcbiAgICAvLyB0byBzb21ldGhpbmcgbW9yZSBjb21wbGV4IChsaXN0L2NvbGxlY3Rpb25zLCBzdWItb2JqZWN0cywgY3VzdG9tIHN0cnVjdHVyZXNcclxuICAgIC8vIGFuZCB2aXN1YWxpemF0aW9uIC0ta2VlcCBhcyBwb3NzaWJsZSB0aGUgdXNlIG9mIGRhdGFCaW5kQXR0cmlidXRlIGZvciByZXVzYWJsZSBjb2RlKS5cclxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gd29ya3MgZmluZSBmb3IgZGF0YSBhcyBwbGFpbiBvYmplY3Qgd2l0aCBcclxuICAgIC8vIHNpbXBsZSB0eXBlcyBhcyBwcm9wZXJ0aWVzIChub3Qgb2JqZWN0cyBvciBhcnJheXMgaW5zaWRlIHRoZW0pLlxyXG4gICAgYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhKCkge1xyXG4gICAgICAvLyBDaGVjayBldmVyeSBlbGVtZW50IGluIHRoZSBjb21wb25lbnQgd2l0aCBhIGJpbmRcclxuICAgICAgLy8gcHJvcGVydHkgYW5kIHVwZGF0ZSBpdCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGF0IHByb3BlcnR5XHJcbiAgICAgIC8vIGZyb20gdGhlIGRhdGEgc291cmNlXHJcbiAgICAgIHZhciBhdHQgPSB0aGlzLmRhdGFCaW5kQXR0cmlidXRlO1xyXG4gICAgICB2YXIgYXR0clNlbGVjdG9yID0gJ1tkYXRhLScgKyBhdHQgKyAnXSc7XHJcbiAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgdGhpcy4kZWwuZmluZChhdHRyU2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyksXHJcbiAgICAgICAgICBwcm9wID0gJHQuZGF0YShhdHQpLFxyXG4gICAgICAgICAgYmluZGVkVmFsdWUgPSB0aGF0LmRhdGFbcHJvcF07XHJcblxyXG4gICAgICAgIGlmICgkdC5pcygnOmlucHV0JykpXHJcbiAgICAgICAgICAkdC52YWwoYmluZGVkVmFsdWUpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICR0LnRleHQoYmluZGVkVmFsdWUpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG4gIC8vIENvbnN0cnVjdG9yXHJcbiAgZnVuY3Rpb24gQmluZGFibGVDb21wb25lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgQ29tcG9uZW50LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5kYXRhID0gdGhpcy4kZWwuZGF0YSgnc291cmNlJykgfHwgdGhpcy5kYXRhIHx8IHt9O1xyXG4gICAgaWYgKHR5cGVvZiAodGhpcy5kYXRhKSA9PSAnc3RyaW5nJylcclxuICAgICAgdGhpcy5kYXRhID0gSlNPTi5wYXJzZSh0aGlzLmRhdGEpO1xyXG5cclxuICAgIC8vIE9uIGh0bWwgc291cmNlIHVybCBjb25maWd1cmF0aW9uOlxyXG4gICAgdGhpcy51cmwgPSB0aGlzLiRlbC5kYXRhKCdzb3VyY2UtdXJsJykgfHwgdGhpcy51cmw7XHJcblxyXG4gICAgLy8gVE9ETzogJ2NoYW5nZScgZXZlbnQgaGFuZGxlcnMgb24gZm9ybXMgd2l0aCBkYXRhLWJpbmQgdG8gdXBkYXRlIGl0cyB2YWx1ZSBhdCB0aGlzLmRhdGFcclxuICAgIC8vIFRPRE86IGF1dG8gJ2JpbmREYXRhJyBvbiBmZXRjaERhdGEgZW5kcz8gY29uZmlndXJhYmxlLCBiaW5kRGF0YU1vZGV7IGlubWVkaWF0ZSwgbm90aWZ5IH1cclxuICB9XHJcbik7XHJcblxyXG4vLyBQdWJsaWMgbW9kdWxlOlxyXG5tb2R1bGUuZXhwb3J0cyA9IEJpbmRhYmxlQ29tcG9uZW50OyIsIi8qKiBDb21wb25lbnQgY2xhc3M6IHdyYXBwZXIgZm9yXHJcbiAgdGhlIGxvZ2ljIGFuZCBiZWhhdmlvciBhcm91bmRcclxuICBhIERPTSBlbGVtZW50XHJcbioqL1xyXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKTtcclxuXHJcbmZ1bmN0aW9uIENvbXBvbmVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgdGhpcy5lbCA9IGVsZW1lbnQ7XHJcbiAgdGhpcy4kZWwgPSAkKGVsZW1lbnQpO1xyXG4gIGV4dGVuZCh0aGlzLCBvcHRpb25zKTtcclxuICAvLyBVc2UgdGhlIGpRdWVyeSAnZGF0YScgc3RvcmFnZSB0byBwcmVzZXJ2ZSBhIHJlZmVyZW5jZVxyXG4gIC8vIHRvIHRoaXMgaW5zdGFuY2UgKHVzZWZ1bCB0byByZXRyaWV2ZSBpdCBmcm9tIGRvY3VtZW50KVxyXG4gIHRoaXMuJGVsLmRhdGEoJ2NvbXBvbmVudCcsIHRoaXMpO1xyXG59XHJcblxyXG5leHRlbmQucGx1Z0luKENvbXBvbmVudCk7XHJcbmV4dGVuZC5wbHVnSW4oQ29tcG9uZW50LnByb3RvdHlwZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDsiLCIvKipcclxuICBEYXRhU291cmNlIGNsYXNzIHRvIHNpbXBsaWZ5IGZldGNoaW5nIGRhdGEgYXMgSlNPTlxyXG4gIHRvIGZpbGwgYSBsb2NhbCBjYWNoZS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBmZXRjaEpTT04gPSAkLmdldEpTT04sXHJcbiAgICBleHRlbmQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAkLmV4dGVuZC5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTsgfTtcclxuXHJcbnZhciByZXFNb2RlcyA9IERhdGFTb3VyY2UucmVxdWVzdE1vZGVzID0ge1xyXG4gIC8vIFBhcmFsbGVsIHJlcXVlc3QsIG5vIG1hdHRlciBvZiBvdGhlcnNcclxuICBtdWx0aXBsZTogMCxcclxuICAvLyBXaWxsIGF2b2lkIGEgcmVxdWVzdCBpZiB0aGVyZSBpcyBvbmUgcnVubmluZ1xyXG4gIHNpbmdsZTogMSxcclxuICAvLyBMYXRlc3QgcmVxdWV0IHdpbGwgcmVwbGFjZSBhbnkgcHJldmlvdXMgb25lIChwcmV2aW91cyB3aWxsIGFib3J0KVxyXG4gIHJlcGxhY2U6IDJcclxufTtcclxuXHJcbnZhciB1cGRNb2RlcyA9IERhdGFTb3VyY2UudXBkYXRlTW9kZXMgPSB7XHJcbiAgLy8gRXZlcnkgbmV3IGRhdGEgdXBkYXRlLCBuZXcgY29udGVudCBpcyBhZGRlZCBpbmNyZW1lbnRhbGx5XHJcbiAgLy8gKG92ZXJ3cml0ZSBjb2luY2lkZW50IGNvbnRlbnQsIGFwcGVuZCBuZXcgY29udGVudCwgb2xkIGNvbnRlbnRcclxuICAvLyBnZXQgaW4gcGxhY2UpXHJcbiAgaW5jcmVtZW50YWw6IDAsXHJcbiAgLy8gT24gbmV3IGRhdGEgdXBkYXRlLCBuZXcgZGF0YSB0b3RhbGx5IHJlcGxhY2UgdGhlIHByZXZpb3VzIG9uZVxyXG4gIHJlcGxhY2VtZW50OiAxXHJcbn07XHJcblxyXG4vKipcclxuVXBkYXRlIHRoZSBkYXRhIHN0b3JlIG9yIGNhY2hlIHdpdGggdGhlIGdpdmVuIG9uZS5cclxuVGhlcmUgYXJlIGRpZmZlcmVudCBtb2RlcywgdGhpcyBtYW5hZ2VzIHRoYXQgbG9naWMgYW5kXHJcbml0cyBvd24gY29uZmlndXJhdGlvbi5cclxuSXMgZGVjb3VwbGVkIGZyb20gdGhlIHByb3RvdHlwZSBidXRcclxuaXQgd29ya3Mgb25seSBhcyBwYXJ0IG9mIGEgRGF0YVNvdXJjZSBpbnN0YW5jZS5cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURhdGEoZGF0YSwgbW9kZSkge1xyXG4gIHN3aXRjaCAobW9kZSB8fCB1cGRhdGVEYXRhLmRlZmF1bHRVcGRhdGVNb2RlKSB7XHJcblxyXG4gICAgY2FzZSB1cGRNb2Rlcy5yZXBsYWNlbWVudDpcclxuICAgICAgdGhpcy5kYXRhID0gZGF0YTtcclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgLy9jYXNlIHVwZE1vZGVzLmluY3JlbWVudGFsOiAgXHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICAvLyBJbiBjYXNlIGluaXRpYWwgZGF0YSBpcyBudWxsLCBhc3NpZ24gdGhlIHJlc3VsdCB0byBpdHNlbGY6XHJcbiAgICAgIHRoaXMuZGF0YSA9IGV4dGVuZCh0aGlzLmRhdGEsIGRhdGEpO1xyXG4gICAgICBicmVhaztcclxuICB9XHJcbn1cclxuXHJcbi8qKiBEZWZhdWx0IHZhbHVlIGZvciB0aGUgY29uZmlndXJhYmxlIHVwZGF0ZSBtb2RlOlxyXG4qKi9cclxudXBkYXRlRGF0YS5kZWZhdWx0VXBkYXRlTW9kZSA9IHVwZE1vZGVzLmluY3JlbWVudGFsO1xyXG5cclxuLyoqXHJcbkZldGNoIHRoZSBkYXRhIGZyb20gdGhlIHNlcnZlci5cclxuSGVyZSBpcyBkZWNvdXBsZWQgZnJvbSB0aGUgcmVzdCBvZiB0aGUgcHJvdG90eXBlIGZvclxyXG5jb21tb2RpdHksIGJ1dCBpdCBjYW4gd29ya3Mgb25seSBhcyBwYXJ0IG9mIGEgRGF0YVNvdXJjZSBpbnN0YW5jZS5cclxuKiovXHJcbmZ1bmN0aW9uIGZldGNoRGF0YShxdWVyeSwgbW9kZSkge1xyXG4gIHF1ZXJ5ID0gZXh0ZW5kKHt9LCB0aGlzLnF1ZXJ5LCBxdWVyeSk7XHJcbiAgc3dpdGNoIChtb2RlIHx8IGZldGNoRGF0YS5kZWZhdWx0UmVxdWVzdE1vZGUpIHtcclxuXHJcbiAgICBjYXNlIHJlcU1vZGVzLnNpbmdsZTpcclxuICAgICAgaWYgKGZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHJldHVybiBudWxsO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIHJlcU1vZGVzLnJlcGxhY2U6XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yZXF1ZXN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBmZXRjaERhdGEucmVxdWVzdHNbaV0uYWJvcnQoKTtcclxuICAgICAgICB9IGNhdGNoIChleCkgeyB9XHJcbiAgICAgICAgZmV0Y2hEYXRhLnJlcXVlc3RzID0gW107XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWs7XHJcblxyXG4gICAgLy8gSnVzdCBkbyBub3RoaW5nIGZvciBtdWx0aXBsZSBvciBkZWZhdWx0ICAgICBcclxuICAgIC8vY2FzZSByZXFNb2Rlcy5tdWx0aXBsZTogIFxyXG4gICAgLy9kZWZhdWx0OiBcclxuICB9XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB2YXIgcmVxID0gZmV0Y2hEYXRhLnByb3h5KFxyXG4gICAgdGhpcy51cmwsXHJcbiAgICBxdWVyeSxcclxuICAgIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgIHRoYXQudXBkYXRlRGF0YShkYXRhKTtcclxuICAgICAgZmV0Y2hEYXRhLnJlcXVlc3RzLnNwbGljZShmZXRjaERhdGEucmVxdWVzdHMuaW5kZXhPZihyZXEpLCAxKTtcclxuICAgICAgLy9kZWxldGUgZmV0Y2hEYXRhLnJlcXVlc3RzW2ZldGNoRGF0YS5yZXF1ZXN0cy5pbmRleE9mKHJlcSldO1xyXG4gICAgfVxyXG4gICkuZmFpbChmZXRjaERhdGEub25lcnJvcik7XHJcbiAgZmV0Y2hEYXRhLnJlcXVlc3RzLnB1c2gocmVxKTtcclxuXHJcbiAgcmV0dXJuIHJlcTtcclxufVxyXG5cclxuLy8gRGVmYXVsdHMgZmV0Y2hEYXRhIHByb3BlcnRpZXMsIHRoZXkgYXJlIGRlY291cGxlZCB0byBhbGxvd1xyXG4vLyByZXBsYWNlbWVudCwgYW5kIGluc2lkZSB0aGUgZmV0Y2hEYXRhIGZ1bmN0aW9uIHRvIGRvbid0XHJcbi8vIGNvbnRhbWluYXRlIHRoZSBvYmplY3QgbmFtZXNwYWNlLlxyXG5cclxuLyogQ29sbGVjdGlvbiBvZiBhY3RpdmUgKGZldGNoaW5nKSByZXF1ZXN0cyB0byB0aGUgc2VydmVyXHJcbiovXHJcbmZldGNoRGF0YS5yZXF1ZXN0cyA9IFtdO1xyXG5cclxuLyogRGVjb3VwbGVkIGZ1bmN0aW9uYWxpdHkgdG8gcGVyZm9ybSB0aGUgQWpheCBvcGVyYXRpb24sXHJcbnRoaXMgYWxsb3dzIG92ZXJ3cml0ZSB0aGlzIGJlaGF2aW9yIHRvIGltcGxlbWVudCBhbm90aGVyXHJcbndheXMsIGxpa2UgYSBub24talF1ZXJ5IGltcGxlbWVudGF0aW9uLCBhIHByb3h5IHRvIGZha2Ugc2VydmVyXHJcbmZvciB0ZXN0aW5nIG9yIHByb3h5IHRvIGxvY2FsIHN0b3JhZ2UgaWYgb25saW5lLCBldGMuXHJcbkl0IG11c3QgcmV0dXJucyB0aGUgdXNlZCByZXF1ZXN0IG9iamVjdC5cclxuKi9cclxuZmV0Y2hEYXRhLnByb3h5ID0gZmV0Y2hKU09OO1xyXG5cclxuLyogQnkgZGVmYXVsdCwgZmV0Y2hEYXRhIGFsbG93cyBtdWx0aXBsZSBzaW11bHRhbmVvcyBjb25uZWN0aW9uLFxyXG5zaW5jZSB0aGUgc3RvcmFnZSBieSBkZWZhdWx0IGFsbG93cyBpbmNyZW1lbnRhbCB1cGRhdGVzIHJhdGhlclxyXG50aGFuIHJlcGxhY2VtZW50cy5cclxuKi9cclxuZmV0Y2hEYXRhLmRlZmF1bHRSZXF1ZXN0TW9kZSA9IHJlcU1vZGVzLm11bHRpcGxlO1xyXG5cclxuLyogRGVmYXVsdCBub3RpZmljYXRpb24gb2YgZXJyb3Igb24gZmV0Y2hpbmcsIGp1c3QgbG9nZ2luZyxcclxuY2FuIGJlIHJlcGxhY2VkLlxyXG5JdCByZWNlaXZlcyB0aGUgcmVxdWVzdCBvYmplY3QsIHN0YXR1cyBhbmQgZXJyb3IuXHJcbiovXHJcbmZldGNoRGF0YS5vbmVycm9yID0gZnVuY3Rpb24gZXJyb3IoeCwgcywgZSkge1xyXG4gIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ0ZldGNoIGRhdGEgZXJyb3IgJXMgJW8nLCBlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gIERhdGFTb3VyY2UgY2xhc3NcclxuKiovXHJcbi8vIENvbnN0cnVjdG9yOiBldmVyeXRoaW5nIGlzIGluIHRoZSBwcm90b3R5cGUuXHJcbmZ1bmN0aW9uIERhdGFTb3VyY2UoKSB7IH1cclxuRGF0YVNvdXJjZS5wcm90b3R5cGUgPSB7XHJcbiAgZGF0YTogbnVsbCxcclxuICB1cmw6ICcvJyxcclxuICAvLyBxdWVyeTogb2JqZWN0IHdpdGggZGVmYXVsdCBleHRyYSBpbmZvcm1hdGlvbiB0byBhcHBlbmQgdG8gdGhlIHVybFxyXG4gIC8vIHdoZW4gZmV0Y2hpbmcgZGF0YSwgZXh0ZW5kZWQgd2l0aCB0aGUgZXhwbGljaXQgcXVlcnkgc3BlY2lmaWVkXHJcbiAgLy8gZXhlY3V0aW5nIGZldGNoRGF0YShxdWVyeSlcclxuICBxdWVyeToge30sXHJcbiAgdXBkYXRlRGF0YTogdXBkYXRlRGF0YSxcclxuICBmZXRjaERhdGE6IGZldGNoRGF0YVxyXG4gIC8vIFRPRE8gIHB1c2hEYXRhOiBmdW5jdGlvbigpeyBwb3N0L3B1dCB0aGlzLmRhdGEgdG8gdXJsICB9XHJcbn07XHJcblxyXG4vLyBDbGFzcyBhcyBwdWJsaWMgbW9kdWxlOlxyXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFTb3VyY2U7IiwiLyoqXHJcbiAgTG9jb25vbWljcyBzcGVjaWZpYyBXaWRnZXQgYmFzZWQgb24gQmluZGFibGVDb21wb25lbnQuXHJcbiAgSnVzdCBkZWNvdXBsaW5nIHNwZWNpZmljIGJlaGF2aW9ycyBmcm9tIHNvbWV0aGluZyBtb3JlIGdlbmVyYWxcclxuICB0byBlYXNpbHkgdHJhY2sgdGhhdCBkZXRhaWxzLCBhbmQgbWF5YmUgZnV0dXJlIG1pZ3JhdGlvbnMgdG9cclxuICBvdGhlciBmcm9udC1lbmQgZnJhbWV3b3Jrcy5cclxuKiovXHJcbnZhciBEYXRhU291cmNlID0gcmVxdWlyZSgnLi9EYXRhU291cmNlJyk7XHJcbnZhciBCaW5kYWJsZUNvbXBvbmVudCA9IHJlcXVpcmUoJy4vQmluZGFibGVDb21wb25lbnQnKTtcclxuXHJcbnZhciBMY1dpZGdldCA9IEJpbmRhYmxlQ29tcG9uZW50LmV4dGVuZChcclxuICAvLyBQcm90b3R5cGVcclxuICB7XHJcbiAgICAvLyBSZXBsYWNpbmcgdXBkYXRlRGF0YSB0byBpbXBsZW1lbnQgdGhlIHBhcnRpY3VsYXJcclxuICAgIC8vIEpTT04gc2NoZW1lIG9mIExvY29ub21pY3MsIGJ1dCByZXVzaW5nIG9yaWdpbmFsXHJcbiAgICAvLyBsb2dpYyBpbmhlcml0IGZyb20gRGF0YVNvdXJjZVxyXG4gICAgdXBkYXRlRGF0YTogZnVuY3Rpb24gKGRhdGEsIG1vZGUpIHtcclxuICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgRGF0YVNvdXJjZS5wcm90b3R5cGUudXBkYXRlRGF0YS5jYWxsKHRoaXMsIGRhdGEuUmVzdWx0LCBtb2RlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmZldGNoRGF0YS5vbmVycm9yKG51bGwsICdlcnJvcicsIHsgbmFtZTogJ2RhdGEtZm9ybWF0JywgbWVzc2FnZTogZGF0YS5FcnJvck1lc3NhZ2UgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIC8vIENvbnN0cnVjdG9yXHJcbiAgZnVuY3Rpb24gTGNXaWRnZXQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgQmluZGFibGVDb21wb25lbnQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICB9XHJcbik7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjV2lkZ2V0OyIsIi8qKlxyXG4gIERlZXAgRXh0ZW5kIG9iamVjdCB1dGlsaXR5LCBpcyByZWN1cnNpdmUgdG8gZ2V0IGFsbCB0aGUgZGVwdGhcclxuICBidXQgb25seSBmb3IgdGhlIHByb3BlcnRpZXMgb3duZWQgYnkgdGhlIG9iamVjdCxcclxuICBpZiB5b3UgbmVlZCB0aGUgbm9uLW93bmVkIHByb3BlcnRpZXMgdG8gaW4gdGhlIG9iamVjdCxcclxuICBjb25zaWRlciBleHRlbmQgZnJvbSB0aGUgc291cmNlIHByb3RvdHlwZSB0b28gKGFuZCBtYXliZSB0b1xyXG4gIHRoZSBkZXN0aW5hdGlvbiBwcm90b3R5cGUgaW5zdGVhZCBvZiB0aGUgaW5zdGFuY2UsIGJ1dCB1cCB0byB0b28pLlxyXG4qKi9cclxuXHJcbi8qIGpxdWVyeSBpbXBsZW1lbnRhdGlvbjpcclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuZXh0ZW5kID0gZnVuY3Rpb24gKCkge1xyXG5yZXR1cm4gJC5leHRlbmQuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7IFxyXG59OyovXHJcblxyXG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kKGRlc3RpbmF0aW9uLCBzb3VyY2UpIHtcclxuICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBzb3VyY2UpIHtcclxuICAgIGlmICghc291cmNlLmhhc093blByb3BlcnR5KHByb3BlcnR5KSlcclxuICAgICAgY29udGludWU7XHJcblxyXG4gICAgLy8gQWxsb3cgcHJvcGVydGllcyByZW1vdmFsLCBpZiBzb3VyY2UgY29udGFpbnMgdmFsdWUgJ3VuZGVmaW5lZCcuXHJcbiAgICAvLyBUaGVyZSBhcmUgbm8gc3BlY2lhbCBjb25zaWRlcmF0aW9ucyBvbiBBcnJheXMsIHRvIGRvbid0IGdldCB1bmRlc2lyZWRcclxuICAgIC8vIHJlc3VsdHMganVzdCB0aGUgd2FudGVkIGlzIHRvIHJlcGxhY2Ugc3BlY2lmaWMgcG9zaXRpb25zLCBub3JtYWxseS5cclxuICAgIGlmIChzb3VyY2VbcHJvcGVydHldID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgZGVsZXRlIGRlc3RpbmF0aW9uW3Byb3BlcnR5XTtcclxuICAgICAgY29udGludWU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKFsnb2JqZWN0JywgJ2Z1bmN0aW9uJ10uaW5kZXhPZih0eXBlb2YgZGVzdGluYXRpb25bcHJvcGVydHldKSAhPSAtMSAmJlxyXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlW3Byb3BlcnR5XSA9PSAnb2JqZWN0JylcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVzdGluYXRpb25bcHJvcGVydHldID09ICdmdW5jdGlvbicgJiZcclxuICAgICAgICAgICAgICAgICB0eXBlb2Ygc291cmNlW3Byb3BlcnR5XSA9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHZhciBvcmlnID0gZGVzdGluYXRpb25bcHJvcGVydHldO1xyXG4gICAgICAvLyBDbG9uZSBmdW5jdGlvblxyXG4gICAgICB2YXIgc291ciA9IGNsb25lRnVuY3Rpb24oc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICAgIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9IHNvdXI7XHJcbiAgICAgIC8vIEFueSBwcmV2aW91cyBhdHRhY2hlZCBwcm9wZXJ0eVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBvcmlnKTtcclxuICAgICAgLy8gQW55IHNvdXJjZSBhdHRhY2hlZCBwcm9wZXJ0eVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBzb3VyY2VbcHJvcGVydHldKTtcclxuICAgIH1cclxuICAgIGVsc2VcclxuICAgICAgZGVzdGluYXRpb25bcHJvcGVydHldID0gc291cmNlW3Byb3BlcnR5XTtcclxuICB9XHJcblxyXG4gIC8vIFNvIG11Y2ggJ3NvdXJjZScgYXJndW1lbnRzIGFzIHdhbnRlZC4gSW4gRVM2IHdpbGwgYmUgJ3NvdXJjZS4uJ1xyXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xyXG4gICAgdmFyIG5leHRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcclxuICAgIG5leHRzLnNwbGljZSgxLCAxKTtcclxuICAgIGV4dGVuZC5hcHBseSh0aGlzLCBuZXh0cyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZGVzdGluYXRpb247XHJcbn07XHJcblxyXG5leHRlbmQucGx1Z0luID0gZnVuY3Rpb24gcGx1Z0luKG9iaikge1xyXG4gIG9iaiA9IG9iaiB8fCBPYmplY3QucHJvdG90eXBlO1xyXG4gIG9iai5leHRlbmRNZSA9IGZ1bmN0aW9uIGV4dGVuZE1lKCkge1xyXG4gICAgZXh0ZW5kLmFwcGx5KHRoaXMsIFt0aGlzXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xyXG4gIH07XHJcbiAgb2JqLmV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZEluc3RhbmNlKCkge1xyXG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxyXG4gICAgICAvLyBJZiB0aGUgb2JqZWN0IHVzZWQgdG8gZXh0ZW5kIGZyb20gaXMgYSBmdW5jdGlvbiwgaXMgY29uc2lkZXJlZFxyXG4gICAgICAvLyBhIGNvbnN0cnVjdG9yLCB0aGVuIHdlIGV4dGVuZCBmcm9tIGl0cyBwcm90b3R5cGUsIG90aGVyd2lzZSBpdHNlbGYuXHJcbiAgICAgIGNvbnN0cnVjdG9yQSA9IHR5cGVvZiB0aGlzID09ICdmdW5jdGlvbicgPyB0aGlzIDogbnVsbCxcclxuICAgICAgYmFzZUEgPSBjb25zdHJ1Y3RvckEgPyB0aGlzLnByb3RvdHlwZSA6IHRoaXMsXHJcbiAgICAgIC8vIElmIGxhc3QgYXJndW1lbnQgaXMgYSBmdW5jdGlvbiwgaXMgY29uc2lkZXJlZCBhIGNvbnN0cnVjdG9yXHJcbiAgICAgIC8vIG9mIHRoZSBuZXcgY2xhc3Mvb2JqZWN0IHRoZW4gd2UgZXh0ZW5kIGl0cyBwcm90b3R5cGUuXHJcbiAgICAgIC8vIFdlIHVzZSBhbiBlbXB0eSBvYmplY3Qgb3RoZXJ3aXNlLlxyXG4gICAgICBjb25zdHJ1Y3RvckIgPSB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdID09ICdmdW5jdGlvbicgP1xyXG4gICAgICAgIGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSlbMF0gOlxyXG4gICAgICAgIG51bGwsXHJcbiAgICAgIGJhc2VCID0gY29uc3RydWN0b3JCID8gY29uc3RydWN0b3JCLnByb3RvdHlwZSA6IHt9O1xyXG5cclxuICAgIHZhciBleHRlbmRlZFJlc3VsdCA9IGV4dGVuZC5hcHBseSh0aGlzLCBbYmFzZUIsIGJhc2VBXS5jb25jYXQoYXJncykpO1xyXG4gICAgLy8gSWYgYm90aCBhcmUgY29uc3RydWN0b3JzLCB3ZSB3YW50IHRoZSBzdGF0aWMgbWV0aG9kcyB0byBiZSBjb3BpZWQgdG9vOlxyXG4gICAgaWYgKGNvbnN0cnVjdG9yQSAmJiBjb25zdHJ1Y3RvckIpXHJcbiAgICAgIGV4dGVuZChjb25zdHJ1Y3RvckIsIGNvbnN0cnVjdG9yQSk7XHJcblxyXG4gICAgLy8gSWYgd2UgYXJlIGV4dGVuZGluZyBhIGNvbnN0cnVjdG9yLCB3ZSByZXR1cm4gdGhhdCwgb3RoZXJ3aXNlIHRoZSByZXN1bHRcclxuICAgIHJldHVybiBjb25zdHJ1Y3RvckIgfHwgZXh0ZW5kZWRSZXN1bHQ7XHJcbiAgfTtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gIG1vZHVsZS5leHBvcnRzID0gZXh0ZW5kO1xyXG59IGVsc2Uge1xyXG4gIC8vIGdsb2JhbCBzY29wZVxyXG4gIGV4dGVuZC5wbHVnSW4oKTtcclxufVxyXG5cclxuLyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgQ2xvbmUgVXRpbHNcclxuKi9cclxuZnVuY3Rpb24gY2xvbmVPYmplY3Qob2JqKSB7XHJcbiAgcmV0dXJuIGV4dGVuZCh7fSwgb2JqKTtcclxufVxyXG5cclxuLy8gVGVzdGluZyBpZiBhIHN0cmluZyBzZWVtcyBhIGZ1bmN0aW9uIHNvdXJjZSBjb2RlOlxyXG4vLyBXZSB0ZXN0IGFnYWlucyBhIHNpbXBsaXNpYyByZWd1bGFyIGV4cHJlc2lvbiB0aGF0IG1hdGNoXHJcbi8vIGEgY29tbW9uIHN0YXJ0IG9mIGZ1bmN0aW9uIGRlY2xhcmF0aW9uLlxyXG4vLyBPdGhlciB3YXlzIHRvIGRvIHRoaXMgaXMgYXQgaW52ZXJzZXIsIGJ5IGNoZWNraW5nXHJcbi8vIHRoYXQgdGhlIGZ1bmN0aW9uIHRvU3RyaW5nIGlzIG5vdCBhIGtub3dlZCB0ZXh0XHJcbi8vIGFzICdbb2JqZWN0IEZ1bmN0aW9uXScgb3IgJ1tuYXRpdmUgY29kZV0nLCBidXRcclxuLy8gc2luY2UgdGhhIGNhbiBjaGFuZ2VzIGJldHdlZW4gYnJvd3NlcnMsIGlzIG1vcmUgY29uc2VydmF0aXZlXHJcbi8vIGNoZWNrIGFnYWluc3QgYSBjb21tb24gY29uc3RydWN0IGFuIGZhbGxiYWNrIG9uIHRoZVxyXG4vLyBjb21tb24gc29sdXRpb24gaWYgbm90IG1hdGNoZXMuXHJcbnZhciB0ZXN0RnVuY3Rpb24gPSAvXlxccypmdW5jdGlvblteXFwoXVxcKC87XHJcblxyXG5mdW5jdGlvbiBjbG9uZUZ1bmN0aW9uKGZuKSB7XHJcbiAgdmFyIHRlbXA7XHJcbiAgdmFyIGNvbnRlbnRzID0gZm4udG9TdHJpbmcoKTtcclxuICAvLyBDb3B5IHRvIGEgbmV3IGluc3RhbmNlIG9mIHRoZSBzYW1lIHByb3RvdHlwZSwgZm9yIHRoZSBub3QgJ293bmVkJyBwcm9wZXJ0aWVzLlxyXG4gIC8vIEFzc2luZ2VkIGF0IHRoZSBlbmRcclxuICB2YXIgdGVtcFByb3RvID0gT2JqZWN0LmNyZWF0ZShmbi5wcm90b3R5cGUpO1xyXG5cclxuICAvLyBESVNBQkxFRCB0aGUgY29udGVudHMtY29weSBwYXJ0IGJlY2F1c2UgaXQgZmFpbHMgd2l0aCBjbG9zdXJlc1xyXG4gIC8vIGdlbmVyYXRlZCBieSB0aGUgb3JpZ2luYWwgZnVuY3Rpb24sIHVzaW5nIHRoZSBzdWItY2FsbCB3YXkgZXZlclxyXG4gIGlmICh0cnVlIHx8ICF0ZXN0RnVuY3Rpb24udGVzdChjb250ZW50cykpIHtcclxuICAgIC8vIENoZWNrIGlmIGlzIGFscmVhZHkgYSBjbG9uZWQgY29weSwgdG9cclxuICAgIC8vIHJldXNlIHRoZSBvcmlnaW5hbCBjb2RlIGFuZCBhdm9pZCBtb3JlIHRoYW5cclxuICAgIC8vIG9uZSBkZXB0aCBpbiBzdGFjayBjYWxscyAoZ3JlYXQhKVxyXG4gICAgaWYgKHR5cGVvZiBmbi5wcm90b3R5cGUuX19fY2xvbmVkX29mID09ICdmdW5jdGlvbicpXHJcbiAgICAgIGZuID0gZm4ucHJvdG90eXBlLl9fX2Nsb25lZF9vZjtcclxuXHJcbiAgICB0ZW1wID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZm4uYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7IH07XHJcblxyXG4gICAgLy8gU2F2ZSBtYXJrIGFzIGNsb25lZC4gRG9uZSBpbiBpdHMgcHJvdG90eXBlXHJcbiAgICAvLyB0byBub3QgYXBwZWFyIGluIHRoZSBsaXN0IG9mICdvd25lZCcgcHJvcGVydGllcy5cclxuICAgIHRlbXBQcm90by5fX19jbG9uZWRfb2YgPSBmbjtcclxuICAgIC8vIFJlcGxhY2UgdG9TdHJpbmcgdG8gcmV0dXJuIHRoZSBvcmlnaW5hbCBzb3VyY2U6XHJcbiAgICB0ZW1wUHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBmbi50b1N0cmluZygpO1xyXG4gICAgfTtcclxuICAgIC8vIFRoZSBuYW1lIGNhbm5vdCBiZSBzZXQsIHdpbGwganVzdCBiZSBhbm9ueW1vdXNcclxuICAgIC8vdGVtcC5uYW1lID0gdGhhdC5uYW1lO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBUaGlzIHdheSBvbiBjYXBhYmxlIGJyb3dzZXJzIHByZXNlcnZlIHRoZSBvcmlnaW5hbCBuYW1lLFxyXG4gICAgLy8gZG8gYSByZWFsIGluZGVwZW5kZW50IGNvcHkgYW5kIGF2b2lkIGZ1bmN0aW9uIHN1YmNhbGxzIHRoYXRcclxuICAgIC8vIGNhbiBkZWdyYXRlIHBlcmZvcm1hbmNlIGFmdGVyIGxvdCBvZiAnY2xvbm5pbmcnLlxyXG4gICAgdmFyIGYgPSBGdW5jdGlvbjtcclxuICAgIHRlbXAgPSAobmV3IGYoJ3JldHVybiAnICsgY29udGVudHMpKSgpO1xyXG4gIH1cclxuXHJcbiAgdGVtcC5wcm90b3R5cGUgPSB0ZW1wUHJvdG87XHJcbiAgLy8gQ29weSBhbnkgcHJvcGVydGllcyBpdCBvd25zXHJcbiAgZXh0ZW5kKHRlbXAsIGZuKTtcclxuXHJcbiAgcmV0dXJuIHRlbXA7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNsb25lUGx1Z0luKCkge1xyXG4gIGlmICh0eXBlb2YgRnVuY3Rpb24ucHJvdG90eXBlLmNsb25lICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBGdW5jdGlvbi5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSgpIHsgcmV0dXJuIGNsb25lRnVuY3Rpb24odGhpcyk7IH07XHJcbiAgfVxyXG4gIGlmICh0eXBlb2YgT2JqZWN0LnByb3RvdHlwZS5jbG9uZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgT2piZWN0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkgeyByZXR1cm4gY2xvbmVPYmplY3QodGhpcyk7IH07XHJcbiAgfVxyXG59XHJcblxyXG5leHRlbmQuY2xvbmVPYmplY3QgPSBjbG9uZU9iamVjdDtcclxuZXh0ZW5kLmNsb25lRnVuY3Rpb24gPSBjbG9uZUZ1bmN0aW9uO1xyXG5leHRlbmQuY2xvbmVQbHVnSW4gPSBjbG9uZVBsdWdJbjtcclxuIiwiLyoqXHJcbiogQ29va2llcyBtYW5hZ2VtZW50LlxyXG4qIE1vc3QgY29kZSBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQ4MjU2OTUvMTYyMjM0NlxyXG4qL1xyXG52YXIgQ29va2llID0ge307XHJcblxyXG5Db29raWUuc2V0ID0gZnVuY3Rpb24gc2V0Q29va2llKG5hbWUsIHZhbHVlLCBkYXlzKSB7XHJcbiAgICB2YXIgZXhwaXJlcyA9IFwiXCI7XHJcbiAgICBpZiAoZGF5cykge1xyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldFRpbWUoZGF0ZS5nZXRUaW1lKCkgKyAoZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApKTtcclxuICAgICAgICBleHBpcmVzID0gXCI7IGV4cGlyZXM9XCIgKyBkYXRlLnRvR01UU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsgXCI9XCIgKyB2YWx1ZSArIGV4cGlyZXMgKyBcIjsgcGF0aD0vXCI7XHJcbn07XHJcbkNvb2tpZS5nZXQgPSBmdW5jdGlvbiBnZXRDb29raWUoY19uYW1lKSB7XHJcbiAgICBpZiAoZG9jdW1lbnQuY29va2llLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjX3N0YXJ0ID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoY19uYW1lICsgXCI9XCIpO1xyXG4gICAgICAgIGlmIChjX3N0YXJ0ICE9IC0xKSB7XHJcbiAgICAgICAgICAgIGNfc3RhcnQgPSBjX3N0YXJ0ICsgY19uYW1lLmxlbmd0aCArIDE7XHJcbiAgICAgICAgICAgIGNfZW5kID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoXCI7XCIsIGNfc3RhcnQpO1xyXG4gICAgICAgICAgICBpZiAoY19lbmQgPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGNfZW5kID0gZG9jdW1lbnQuY29va2llLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdW5lc2NhcGUoZG9jdW1lbnQuY29va2llLnN1YnN0cmluZyhjX3N0YXJ0LCBjX2VuZCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBcIlwiO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDb29raWU7IiwiLyoqIENvbm5lY3QgYWNjb3VudCB3aXRoIEZhY2Vib29rXHJcbioqL1xyXG52YXJcclxuICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKSxcclxuICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpLFxyXG4gIExjVXJsID0gcmVxdWlyZSgnLi9MY1VybCcpLFxyXG4gIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmZ1bmN0aW9uIEZhY2Vib29rQ29ubmVjdChvcHRpb25zKSB7XHJcbiAgJC5leHRlbmQodGhpcywgb3B0aW9ucyk7XHJcbiAgaWYgKCEkKCcjZmItcm9vdCcpLmxlbmd0aClcclxuICAgICQoJzxkaXYgaWQ9XCJmYi1yb290XCIgc3R5bGU9XCJkaXNwbGF5OiBub25lXCI+PC9kaXY+JykuYXBwZW5kVG8oJ2JvZHknKTtcclxufVxyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZSA9IHtcclxuICBhcHBJZDogbnVsbCxcclxuICBsYW5nOiAnZW5fVVMnLFxyXG4gIHJlc3VsdFR5cGU6ICdqc29uJywgLy8gJ3JlZGlyZWN0J1xyXG4gIGZiVXJsQmFzZTogJy8vY29ubmVjdC5mYWNlYm9vay5uZXQvQChsYW5nKS9hbGwuanMnLFxyXG4gIHNlcnZlclVybEJhc2U6IExjVXJsLkxhbmdQYXRoICsgJ0FjY291bnQvRmFjZWJvb2svQCh1cmxTZWN0aW9uKS8/UmVkaXJlY3Q9QChyZWRpcmVjdFVybCkmcHJvZmlsZT1AKHByb2ZpbGVVcmwpJyxcclxuICByZWRpcmVjdFVybDogJycsXHJcbiAgcHJvZmlsZVVybDogJycsXHJcbiAgdXJsU2VjdGlvbjogJycsXHJcbiAgbG9hZGluZ1RleHQ6ICdWZXJpZmluZycsXHJcbiAgcGVybWlzc2lvbnM6ICcnLFxyXG4gIGxpYkxvYWRlZEV2ZW50OiAnRmFjZWJvb2tDb25uZWN0TGliTG9hZGVkJyxcclxuICBjb25uZWN0ZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdENvbm5lY3RlZCdcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuZ2V0RmJVcmwgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5mYlVybEJhc2UucmVwbGFjZSgvQFxcKGxhbmdcXCkvZywgdGhpcy5sYW5nKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuZ2V0U2VydmVyVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuc2VydmVyVXJsQmFzZVxyXG4gIC5yZXBsYWNlKC9AXFwocmVkaXJlY3RVcmxcXCkvZywgdGhpcy5yZWRpcmVjdFVybClcclxuICAucmVwbGFjZSgvQFxcKHByb2ZpbGVVcmxcXCkvZywgdGhpcy5wcm9maWxlVXJsKVxyXG4gIC5yZXBsYWNlKC9AXFwodXJsU2VjdGlvblxcKS9nLCB0aGlzLnVybFNlY3Rpb24pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5sb2FkTGliID0gZnVuY3Rpb24gKCkge1xyXG4gIC8vIE9ubHkgaWYgaXMgbm90IGxvYWRlZCBzdGlsbFxyXG4gIC8vIChGYWNlYm9vayBzY3JpcHQgYXR0YWNoIGl0c2VsZiBhcyB0aGUgZ2xvYmFsIHZhcmlhYmxlICdGQicpXHJcbiAgaWYgKCF3aW5kb3cuRkIgJiYgIXRoaXMuX2xvYWRpbmdMaWIpIHtcclxuICAgIHRoaXMuX2xvYWRpbmdMaWIgPSB0cnVlO1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICBzY3JpcHRzOiBbdGhpcy5nZXRGYlVybCgpXSxcclxuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBGQi5pbml0KHsgYXBwSWQ6IHRoYXQuYXBwSWQsIHN0YXR1czogdHJ1ZSwgY29va2llOiB0cnVlLCB4ZmJtbDogdHJ1ZSB9KTtcclxuICAgICAgICB0aGF0LmxvYWRpbmdMaWIgPSBmYWxzZTtcclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoYXQubGliTG9hZGVkRXZlbnQpO1xyXG4gICAgICB9LFxyXG4gICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5GQjtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5wcm9jZXNzUmVzcG9uc2UgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICBpZiAocmVzcG9uc2UuYXV0aFJlc3BvbnNlKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IFdlbGNvbWUhJyk7XHJcbiAgICB2YXIgdXJsID0gdGhpcy5nZXRTZXJ2ZXJVcmwoKTtcclxuICAgIGlmICh0aGlzLnJlc3VsdFR5cGUgPT0gXCJyZWRpcmVjdFwiKSB7XHJcbiAgICAgIHJlZGlyZWN0VG8odXJsKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwianNvblwiKSB7XHJcbiAgICAgIHBvcHVwKHVybCwgJ3NtYWxsJywgbnVsbCwgdGhpcy5sb2FkaW5nVGV4dCk7XHJcbiAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIodGhpcy5jb25uZWN0ZWRFdmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLypGQi5hcGkoJy9tZScsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogR29vZCB0byBzZWUgeW91LCAnICsgcmVzcG9uc2UubmFtZSArICcuJyk7XHJcbiAgICB9KTsqL1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IFVzZXIgY2FuY2VsbGVkIGxvZ2luIG9yIGRpZCBub3QgZnVsbHkgYXV0aG9yaXplLicpO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUub25MaWJSZWFkeSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gIGlmICh3aW5kb3cuRkIpXHJcbiAgICBjYWxsYmFjaygpO1xyXG4gIGVsc2Uge1xyXG4gICAgdGhpcy5sb2FkTGliKCk7XHJcbiAgICAkKGRvY3VtZW50KS5vbih0aGlzLmxpYkxvYWRlZEV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB0aGlzLm9uTGliUmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgRkIubG9naW4oJC5wcm94eSh0aGF0LnByb2Nlc3NSZXNwb25zZSwgdGhhdCksIHsgc2NvcGU6IHRoYXQucGVybWlzc2lvbnMgfSk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmF1dG9Db25uZWN0T24gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdjbGljaycsIHNlbGVjdG9yIHx8ICdhLmZhY2Vib29rLWNvbm5lY3QnLCAkLnByb3h5KHRoaXMuY29ubmVjdCwgdGhpcykpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGYWNlYm9va0Nvbm5lY3Q7IiwiLyoqIEltcGxlbWVudHMgYSBzaW1pbGFyIExjVXJsIG9iamVjdCBsaWtlIHRoZSBzZXJ2ZXItc2lkZSBvbmUsIGJhc2luZ1xyXG4gICAgaW4gdGhlIGluZm9ybWF0aW9uIGF0dGFjaGVkIHRvIHRoZSBkb2N1bWVudCBhdCAnaHRtbCcgdGFnIGluIHRoZSBcclxuICAgICdkYXRhLWJhc2UtdXJsJyBhdHRyaWJ1dGUgKHRoYXRzIHZhbHVlIGlzIHRoZSBlcXVpdmFsZW50IGZvciBBcHBQYXRoKSxcclxuICAgIGFuZCB0aGUgbGFuZyBpbmZvcm1hdGlvbiBhdCAnZGF0YS1jdWx0dXJlJy5cclxuICAgIFRoZSByZXN0IG9mIFVSTHMgYXJlIGJ1aWx0IGZvbGxvd2luZyB0aGUgd2luZG93LmxvY2F0aW9uIGFuZCBzYW1lIHJ1bGVzXHJcbiAgICB0aGFuIGluIHRoZSBzZXJ2ZXItc2lkZSBvYmplY3QuXHJcbioqL1xyXG5cclxudmFyIGJhc2UgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWJhc2UtdXJsJyksXHJcbiAgICBsYW5nID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1jdWx0dXJlJyksXHJcbiAgICBsID0gd2luZG93LmxvY2F0aW9uLFxyXG4gICAgdXJsID0gbC5wcm90b2NvbCArICcvLycgKyBsLmhvc3Q7XHJcbi8vIGxvY2F0aW9uLmhvc3QgaW5jbHVkZXMgcG9ydCwgaWYgaXMgbm90IHRoZSBkZWZhdWx0LCB2cyBsb2NhdGlvbi5ob3N0bmFtZVxyXG5cclxuYmFzZSA9IGJhc2UgfHwgJy8nO1xyXG5cclxudmFyIExjVXJsID0ge1xyXG4gICAgU2l0ZVVybDogdXJsLFxyXG4gICAgQXBwUGF0aDogYmFzZSxcclxuICAgIEFwcFVybDogdXJsICsgYmFzZSxcclxuICAgIExhbmdJZDogbGFuZyxcclxuICAgIExhbmdQYXRoOiBiYXNlICsgbGFuZyArICcvJyxcclxuICAgIExhbmdVcmw6IHVybCArIGJhc2UgKyBsYW5nXHJcbn07XHJcbkxjVXJsLkxhbmdVcmwgPSB1cmwgKyBMY1VybC5MYW5nUGF0aDtcclxuTGNVcmwuSnNvblBhdGggPSBMY1VybC5MYW5nUGF0aCArICdKU09OLyc7XHJcbkxjVXJsLkpzb25VcmwgPSB1cmwgKyBMY1VybC5Kc29uUGF0aDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGNVcmw7IiwiLyogTG9jb25vbWljcyBzcGVjaWZpYyBQcmljZSwgZmVlcyBhbmQgaG91ci1wcmljZSBjYWxjdWxhdGlvblxyXG4gICAgdXNpbmcgc29tZSBzdGF0aWMgbWV0aG9kcyBhbmQgdGhlIFByaWNlIGNsYXNzLlxyXG4qL1xyXG52YXIgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuLyogQ2xhc3MgUHJpY2UgdG8gY2FsY3VsYXRlIGEgdG90YWwgcHJpY2UgYmFzZWQgb24gZmVlcyBpbmZvcm1hdGlvbiAoZml4ZWQgYW5kIHJhdGUpXHJcbiAgICBhbmQgZGVzaXJlZCBkZWNpbWFscyBmb3IgYXBwcm94aW1hdGlvbnMuXHJcbiovXHJcbmZ1bmN0aW9uIFByaWNlKGJhc2VQcmljZSwgZmVlLCByb3VuZGVkRGVjaW1hbHMpIHtcclxuICAgIC8vIGZlZSBwYXJhbWV0ZXIgY2FuIGJlIGEgZmxvYXQgbnVtYmVyIHdpdGggdGhlIGZlZVJhdGUgb3IgYW4gb2JqZWN0XHJcbiAgICAvLyB0aGF0IGluY2x1ZGVzIGJvdGggYSBmZWVSYXRlIGFuZCBhIGZpeGVkRmVlQW1vdW50XHJcbiAgICAvLyBFeHRyYWN0aW5nIGZlZSB2YWx1ZXMgaW50byBsb2NhbCB2YXJzOlxyXG4gICAgdmFyIGZlZVJhdGUgPSAwLCBmaXhlZEZlZUFtb3VudCA9IDA7XHJcbiAgICBpZiAoZmVlLmZpeGVkRmVlQW1vdW50IHx8IGZlZS5mZWVSYXRlKSB7XHJcbiAgICAgICAgZml4ZWRGZWVBbW91bnQgPSBmZWUuZml4ZWRGZWVBbW91bnQgfHwgMDtcclxuICAgICAgICBmZWVSYXRlID0gZmVlLmZlZVJhdGUgfHwgMDtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGZlZVJhdGUgPSBmZWU7XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRpbmc6XHJcbiAgICAvLyBUaGUgcm91bmRUbyB3aXRoIGEgYmlnIGZpeGVkIGRlY2ltYWxzIGlzIHRvIGF2b2lkIHRoZVxyXG4gICAgLy8gZGVjaW1hbCBlcnJvciBvZiBmbG9hdGluZyBwb2ludCBudW1iZXJzXHJcbiAgICB2YXIgdG90YWxQcmljZSA9IG11LmNlaWxUbyhtdS5yb3VuZFRvKGJhc2VQcmljZSAqICgxICsgZmVlUmF0ZSkgKyBmaXhlZEZlZUFtb3VudCwgMTIpLCByb3VuZGVkRGVjaW1hbHMpO1xyXG4gICAgLy8gZmluYWwgZmVlIHByaWNlIGlzIGNhbGN1bGF0ZWQgYXMgYSBzdWJzdHJhY3Rpb24sIGJ1dCBiZWNhdXNlIGphdmFzY3JpcHQgaGFuZGxlc1xyXG4gICAgLy8gZmxvYXQgbnVtYmVycyBvbmx5LCBhIHJvdW5kIG9wZXJhdGlvbiBpcyByZXF1aXJlZCB0byBhdm9pZCBhbiBpcnJhdGlvbmFsIG51bWJlclxyXG4gICAgdmFyIGZlZVByaWNlID0gbXUucm91bmRUbyh0b3RhbFByaWNlIC0gYmFzZVByaWNlLCAyKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBvYmplY3Qgd2l0aCBmdWxsIGRldGFpbHM6XHJcbiAgICB0aGlzLmJhc2VQcmljZSA9IGJhc2VQcmljZTtcclxuICAgIHRoaXMuZmVlUmF0ZSA9IGZlZVJhdGU7XHJcbiAgICB0aGlzLmZpeGVkRmVlQW1vdW50ID0gZml4ZWRGZWVBbW91bnQ7XHJcbiAgICB0aGlzLnJvdW5kZWREZWNpbWFscyA9IHJvdW5kZWREZWNpbWFscztcclxuICAgIHRoaXMudG90YWxQcmljZSA9IHRvdGFsUHJpY2U7XHJcbiAgICB0aGlzLmZlZVByaWNlID0gZmVlUHJpY2U7XHJcbn1cclxuXHJcbi8qKiBDYWxjdWxhdGUgYW5kIHJldHVybnMgdGhlIHByaWNlIGFuZCByZWxldmFudCBkYXRhIGFzIGFuIG9iamVjdCBmb3JcclxudGltZSwgaG91cmx5UmF0ZSAod2l0aCBmZWVzKSBhbmQgdGhlIGhvdXJseUZlZS5cclxuVGhlIHRpbWUgKEBkdXJhdGlvbikgaXMgdXNlZCAnYXMgaXMnLCB3aXRob3V0IHRyYW5zZm9ybWF0aW9uLCBtYXliZSB5b3UgY2FuIHJlcXVpcmVcclxudXNlIExDLnJvdW5kVGltZVRvUXVhcnRlckhvdXIgYmVmb3JlIHBhc3MgdGhlIGR1cmF0aW9uIHRvIHRoaXMgZnVuY3Rpb24uXHJcbkl0IHJlY2VpdmVzIHRoZSBwYXJhbWV0ZXJzIEBob3VybHlQcmljZSBhbmQgQHN1cmNoYXJnZVByaWNlIGFzIExDLlByaWNlIG9iamVjdHMuXHJcbkBzdXJjaGFyZ2VQcmljZSBpcyBvcHRpb25hbC5cclxuKiovXHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZUhvdXJseVByaWNlKGR1cmF0aW9uLCBob3VybHlQcmljZSwgc3VyY2hhcmdlUHJpY2UpIHtcclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIHN1cmNoYXJnZSwgZ2V0IHplcm9zXHJcbiAgICBzdXJjaGFyZ2VQcmljZSA9IHN1cmNoYXJnZVByaWNlIHx8IHsgdG90YWxQcmljZTogMCwgZmVlUHJpY2U6IDAsIGJhc2VQcmljZTogMCB9O1xyXG4gICAgLy8gR2V0IGhvdXJzIGZyb20gcm91bmRlZCBkdXJhdGlvbjpcclxuICAgIHZhciBob3VycyA9IG11LnJvdW5kVG8oZHVyYXRpb24udG90YWxIb3VycygpLCAyKTtcclxuICAgIC8vIENhbGN1bGF0ZSBmaW5hbCBwcmljZXNcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG90YWxQcmljZTogICAgIG11LnJvdW5kVG8oaG91cmx5UHJpY2UudG90YWxQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UudG90YWxQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBmZWVQcmljZTogICAgICAgbXUucm91bmRUbyhob3VybHlQcmljZS5mZWVQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UuZmVlUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgc3VidG90YWxQcmljZTogIG11LnJvdW5kVG8oaG91cmx5UHJpY2UuYmFzZVByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS5iYXNlUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgZHVyYXRpb25Ib3VyczogIGhvdXJzXHJcbiAgICB9O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBQcmljZTogUHJpY2UsXHJcbiAgICAgICAgY2FsY3VsYXRlSG91cmx5UHJpY2U6IGNhbGN1bGF0ZUhvdXJseVByaWNlXHJcbiAgICB9OyIsIi8qKiBQb2x5ZmlsbCBmb3Igc3RyaW5nLmNvbnRhaW5zXHJcbioqL1xyXG5pZiAoISgnY29udGFpbnMnIGluIFN0cmluZy5wcm90b3R5cGUpKVxyXG4gICAgU3RyaW5nLnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChzdHIsIHN0YXJ0SW5kZXgpIHsgcmV0dXJuIC0xICE9PSB0aGlzLmluZGV4T2Yoc3RyLCBzdGFydEluZGV4KTsgfTsiLCIvKiogPT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBBIHNpbXBsZSBTdHJpbmcgRm9ybWF0XHJcbiAqIGZ1bmN0aW9uIGZvciBqYXZhc2NyaXB0XHJcbiAqIEF1dGhvcjogSWFnbyBMb3JlbnpvIFNhbGd1ZWlyb1xyXG4gKiBNb2R1bGU6IENvbW1vbkpTXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN0cmluZ0Zvcm1hdCgpIHtcclxuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuXHR2YXIgZm9ybWF0dGVkID0gYXJnc1swXTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCdcXFxceycraSsnXFxcXH0nLCAnZ2knKTtcclxuXHRcdGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5yZXBsYWNlKHJlZ2V4cCwgYXJnc1tpKzFdKTtcclxuXHR9XHJcblx0cmV0dXJuIGZvcm1hdHRlZDtcclxufTsiLCIvKipcclxuICAgIEdlbmVyYWwgYXV0by1sb2FkIHN1cHBvcnQgZm9yIHRhYnM6IFxyXG4gICAgSWYgdGhlcmUgaXMgbm8gY29udGVudCB3aGVuIGZvY3VzZWQsIHRoZXkgdXNlIHRoZSAncmVsb2FkJyBqcXVlcnkgcGx1Z2luXHJcbiAgICB0byBsb2FkIGl0cyBjb250ZW50IC10YWJzIG5lZWQgdG8gYmUgY29uZmlndXJlZCB3aXRoIGRhdGEtc291cmNlLXVybCBhdHRyaWJ1dGVcclxuICAgIGluIG9yZGVyIHRvIGtub3cgd2hlcmUgdG8gZmV0Y2ggdGhlIGNvbnRlbnQtLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9qcXVlcnkucmVsb2FkJyk7XHJcblxyXG4vLyBEZXBlbmRlbmN5IFRhYmJlZFVYIGZyb20gRElcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKFRhYmJlZFVYKSB7XHJcbiAgICAvLyBUYWJiZWRVWC5zZXR1cC50YWJCb2R5U2VsZWN0b3IgfHwgJy50YWItYm9keSdcclxuICAgICQoJy50YWItYm9keScpLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCR0LmNoaWxkcmVuKCkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAkdC5yZWxvYWQoKTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgVGhpcyBhZGRzIG5vdGlmaWNhdGlvbnMgdG8gdGFicyBmcm9tIHRoZSBUYWJiZWRVWCBzeXN0ZW0gdXNpbmdcclxuICAgIHRoZSBjaGFuZ2VzTm90aWZpY2F0aW9uIHV0aWxpdHkgdGhhdCBkZXRlY3RzIG5vdCBzYXZlZCBjaGFuZ2VzIG9uIGZvcm1zLFxyXG4gICAgc2hvd2luZyB3YXJuaW5nIG1lc3NhZ2VzIHRvIHRoZVxyXG4gICAgdXNlciBhbmQgbWFya2luZyB0YWJzIChhbmQgc3ViLXRhYnMgLyBwYXJlbnQtdGFicyBwcm9wZXJseSkgdG9cclxuICAgIGRvbid0IGxvc3QgY2hhbmdlcyBtYWRlLlxyXG4gICAgQSBiaXQgb2YgQ1NTIGZvciB0aGUgYXNzaWduZWQgY2xhc3NlcyB3aWxsIGFsbG93IGZvciB2aXN1YWwgbWFya3MuXHJcblxyXG4gICAgQUtBOiBEb24ndCBsb3N0IGRhdGEhIHdhcm5pbmcgbWVzc2FnZSA7LSlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxuXHJcbi8vIFRhYmJlZFVYIGRlcGVuZGVuY3kgYXMgRElcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKFRhYmJlZFVYLCB0YXJnZXRTZWxlY3Rvcikge1xyXG4gICAgdmFyIHRhcmdldCA9ICQodGFyZ2V0U2VsZWN0b3IgfHwgJy5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1lbmFibGVkJyk7XHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLmluaXQoeyB0YXJnZXQ6IHRhcmdldCB9KTtcclxuXHJcbiAgICAvLyBBZGRpbmcgY2hhbmdlIG5vdGlmaWNhdGlvbiB0byB0YWItYm9keSBkaXZzXHJcbiAgICAvLyAob3V0c2lkZSB0aGUgTEMuQ2hhbmdlc05vdGlmaWNhdGlvbiBjbGFzcyB0byBsZWF2ZSBpdCBhcyBnZW5lcmljIGFuZCBzaW1wbGUgYXMgcG9zc2libGUpXHJcbiAgICAkKHRhcmdldCkub24oJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCAnZm9ybScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKHRoaXMpLnBhcmVudHMoJy50YWItYm9keScpLmFkZENsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFkZGluZyBjbGFzcyB0byB0aGUgbWVudSBpdGVtICh0YWIgdGl0bGUpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLmFkZENsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgICAgICAuYXR0cigndGl0bGUnLCAkKCcjbGNyZXMtY2hhbmdlcy1ub3Qtc2F2ZWQnKS50ZXh0KCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAub24oJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgJ2Zvcm0nLCBmdW5jdGlvbiAoZSwgZiwgZWxzLCBmdWxsKSB7XHJcbiAgICAgICAgaWYgKGZ1bGwpXHJcbiAgICAgICAgICAgICQodGhpcykucGFyZW50cygnLnRhYi1ib2R5Om5vdCg6aGFzKGZvcm0uaGFzLWNoYW5nZXMpKScpLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92aW5nIGNsYXNzIGZyb20gdGhlIG1lbnUgaXRlbSAodGFiIHRpdGxlKVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCd0aXRsZScsIG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAvLyBUbyBhdm9pZCB1c2VyIGJlIG5vdGlmaWVkIG9mIGNoYW5nZXMgYWxsIHRpbWUgd2l0aCB0YWIgbWFya3MsIHdlIGFkZGVkIGEgJ25vdGlmeScgY2xhc3NcclxuICAgIC8vIG9uIHRhYnMgd2hlbiBhIGNoYW5nZSBvZiB0YWIgaGFwcGVuc1xyXG4gICAgLmZpbmQoJy50YWItYm9keScpLm9uKCd0YWJVbmZvY3VzZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGZvY3VzZWRDdHgpIHtcclxuICAgICAgICB2YXIgbWkgPSBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtO1xyXG4gICAgICAgIGlmIChtaS5pcygnLmhhcy1jaGFuZ2VzJykpIHtcclxuICAgICAgICAgICAgbWkuYWRkQ2xhc3MoJ25vdGlmeS1jaGFuZ2VzJyk7IC8vaGFzLXRvb2x0aXBcclxuICAgICAgICAgICAgLy8gU2hvdyBub3RpZmljYXRpb24gcG9wdXBcclxuICAgICAgICAgICAgdmFyIGQgPSAkKCc8ZGl2IGNsYXNzPVwid2FybmluZ1wiPkAwPC9kaXY+PGRpdiBjbGFzcz1cImFjdGlvbnNcIj48aW5wdXQgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYWN0aW9uIGNvbnRpbnVlXCIgdmFsdWU9XCJAMlwiLz48aW5wdXQgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYWN0aW9uIHN0b3BcIiB2YWx1ZT1cIkAxXCIvPjwvZGl2PidcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMC9nLCBMQy5nZXRUZXh0KCdjaGFuZ2VzLW5vdC1zYXZlZCcpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AxL2csIExDLmdldFRleHQoJ3RhYi1oYXMtY2hhbmdlcy1zdGF5LW9uJykpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDIvZywgTEMuZ2V0VGV4dCgndGFiLWhhcy1jaGFuZ2VzLWNvbnRpbnVlLXdpdGhvdXQtY2hhbmdlJykpKTtcclxuICAgICAgICAgICAgZC5vbignY2xpY2snLCAnLnN0b3AnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh3aW5kb3cpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgJy5jb250aW51ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHdpbmRvdyk7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgJ2hhcy1jaGFuZ2VzJyB0byBhdm9pZCBmdXR1cmUgYmxvY2tzICh1bnRpbCBuZXcgY2hhbmdlcyBoYXBwZW5zIG9mIGNvdXJzZSA7LSlcclxuICAgICAgICAgICAgICAgIG1pLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpO1xyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIoZm9jdXNlZEN0eC50YWIuZ2V0KDApKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oZCwgd2luZG93LCAnbm90LXNhdmVkLXBvcHVwJywgeyBjbG9zYWJsZTogZmFsc2UsIGNlbnRlcjogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEV2ZXIgcmV0dXJuIGZhbHNlIHRvIHN0b3AgY3VycmVudCB0YWIgZm9jdXNcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5yZW1vdmVDbGFzcygnbm90aWZ5LWNoYW5nZXMnKTsgLy9oYXMtdG9vbHRpcFxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKiBUYWJiZWRVWDogVGFiYmVkIGludGVyZmFjZSBsb2dpYzsgd2l0aCBtaW5pbWFsIEhUTUwgdXNpbmcgY2xhc3MgJ3RhYmJlZCcgZm9yIHRoZVxyXG5jb250YWluZXIsIHRoZSBvYmplY3QgcHJvdmlkZXMgdGhlIGZ1bGwgQVBJIHRvIG1hbmlwdWxhdGUgdGFicyBhbmQgaXRzIHNldHVwXHJcbmxpc3RlbmVycyB0byBwZXJmb3JtIGxvZ2ljIG9uIHVzZXIgaW50ZXJhY3Rpb24uXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9qcXVlcnkuaGFzU2Nyb2xsQmFyJyk7XHJcblxyXG52YXIgVGFiYmVkVVggPSB7XHJcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCgnYm9keScpLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMgPiBsaTpub3QoLnRhYnMtc2xpZGVyKSA+IGEnLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAoVGFiYmVkVVguZm9jdXNUYWIoJHQuYXR0cignaHJlZicpKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0ID0gJChkb2N1bWVudCkuc2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5oYXNoID0gJHQuYXR0cignaHJlZicpO1xyXG4gICAgICAgICAgICAgICAgJCgnaHRtbCxib2R5Jykuc2Nyb2xsVG9wKHN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ21vdXNlZG93bicsIFRhYmJlZFVYLnN0YXJ0TW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdtb3VzZXVwIG1vdXNlbGVhdmUnLCBUYWJiZWRVWC5lbmRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAvLyB0aGUgY2xpY2sgcmV0dXJuIGZhbHNlIGlzIHRvIGRpc2FibGUgc3RhbmRhciB1cmwgYmVoYXZpb3JcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ2NsaWNrJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyLWxpbWl0JywgJ21vdXNlZW50ZXInLCBUYWJiZWRVWC5zdGFydE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlci1saW1pdCcsICdtb3VzZWxlYXZlJywgVGFiYmVkVVguZW5kTW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMgPiBsaS5yZW1vdmFibGUnLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAvLyBPbmx5IG9uIGRpcmVjdCBjbGlja3MgdG8gdGhlIHRhYiwgdG8gYXZvaWRcclxuICAgICAgICAgICAgLy8gY2xpY2tzIHRvIHRoZSB0YWItbGluayAodGhhdCBzZWxlY3QvZm9jdXMgdGhlIHRhYik6XHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldCA9PSBlLmN1cnJlbnRUYXJnZXQpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5yZW1vdmVUYWIobnVsbCwgdGhpcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEluaXQgcGFnZSBsb2FkZWQgdGFiYmVkIGNvbnRhaW5lcnM6XHJcbiAgICAgICAgJCgnLnRhYmJlZCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAvLyBDb25zaXN0ZW5jZSBjaGVjazogdGhpcyBtdXN0IGJlIGEgdmFsaWQgY29udGFpbmVyLCB0aGlzIGlzLCBtdXN0IGhhdmUgLnRhYnNcclxuICAgICAgICAgICAgaWYgKCR0LmNoaWxkcmVuKCcudGFicycpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgLy8gSW5pdCBzbGlkZXJcclxuICAgICAgICAgICAgVGFiYmVkVVguc2V0dXBTbGlkZXIoJHQpO1xyXG4gICAgICAgICAgICAvLyBDbGVhbiB3aGl0ZSBzcGFjZXMgKHRoZXkgY3JlYXRlIGV4Y2VzaXZlIHNlcGFyYXRpb24gYmV0d2VlbiBzb21lIHRhYnMpXHJcbiAgICAgICAgICAgICQoJy50YWJzJywgdGhpcykuY29udGVudHMoKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgYSB0ZXh0IG5vZGUsIHJlbW92ZSBpdDpcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5vZGVUeXBlID09IDMpXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgbW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIGRpciA9ICR0Lmhhc0NsYXNzKCd0YWJzLXNsaWRlci1yaWdodCcpID8gMSA6IC0xO1xyXG4gICAgICAgIHZhciB0YWJzU2xpZGVyID0gJHQucGFyZW50KCk7XHJcbiAgICAgICAgdmFyIHRhYnMgPSB0YWJzU2xpZGVyLnNpYmxpbmdzKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIHRhYnNbMF0uc2Nyb2xsTGVmdCArPSAyMCAqIGRpcjtcclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJzU2xpZGVyLnBhcmVudCgpLCB0YWJzKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgc3RhcnRNb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgdGFicyA9IHQuY2xvc2VzdCgnLnRhYmJlZCcpLmNoaWxkcmVuKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIC8vIFN0b3AgcHJldmlvdXMgYW5pbWF0aW9uczpcclxuICAgICAgICB0YWJzLnN0b3AodHJ1ZSk7XHJcbiAgICAgICAgdmFyIHNwZWVkID0gMC4zOyAvKiBzcGVlZCB1bml0OiBwaXhlbHMvbWlsaXNlY29uZHMgKi9cclxuICAgICAgICB2YXIgZnhhID0gZnVuY3Rpb24gKCkgeyBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJzLnBhcmVudCgpLCB0YWJzKTsgfTtcclxuICAgICAgICB2YXIgdGltZTtcclxuICAgICAgICBpZiAodC5oYXNDbGFzcygncmlnaHQnKSkge1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGltZSBiYXNlZCBvbiBzcGVlZCB3ZSB3YW50IGFuZCBob3cgbWFueSBkaXN0YW5jZSB0aGVyZSBpczpcclxuICAgICAgICAgICAgdGltZSA9ICh0YWJzWzBdLnNjcm9sbFdpZHRoIC0gdGFic1swXS5zY3JvbGxMZWZ0IC0gdGFicy53aWR0aCgpKSAqIDEgLyBzcGVlZDtcclxuICAgICAgICAgICAgdGFicy5hbmltYXRlKHsgc2Nyb2xsTGVmdDogdGFic1swXS5zY3JvbGxXaWR0aCAtIHRhYnMud2lkdGgoKSB9LFxyXG4gICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBzdGVwOiBmeGEsIGNvbXBsZXRlOiBmeGEsIGVhc2luZzogJ3N3aW5nJyB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGltZSBiYXNlZCBvbiBzcGVlZCB3ZSB3YW50IGFuZCBob3cgbWFueSBkaXN0YW5jZSB0aGVyZSBpczpcclxuICAgICAgICAgICAgdGltZSA9IHRhYnNbMF0uc2Nyb2xsTGVmdCAqIDEgLyBzcGVlZDtcclxuICAgICAgICAgICAgdGFicy5hbmltYXRlKHsgc2Nyb2xsTGVmdDogMCB9LFxyXG4gICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBzdGVwOiBmeGEsIGNvbXBsZXRlOiBmeGEsIGVhc2luZzogJ3N3aW5nJyB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGVuZE1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRhYkNvbnRhaW5lciA9ICQodGhpcykuY2xvc2VzdCgnLnRhYmJlZCcpO1xyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKS5zdG9wKHRydWUpO1xyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYkNvbnRhaW5lcik7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGNoZWNrVGFiU2xpZGVyTGltaXRzOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCB0YWJzKSB7XHJcbiAgICAgICAgdGFicyA9IHRhYnMgfHwgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIC8vIFNldCB2aXNpYmlsaXR5IG9mIHZpc3VhbCBsaW1pdGVyczpcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlci1saW1pdC1sZWZ0JykudG9nZ2xlKHRhYnNbMF0uc2Nyb2xsTGVmdCA+IDApO1xyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyLWxpbWl0LXJpZ2h0JykudG9nZ2xlKFxyXG4gICAgICAgICAgICAodGFic1swXS5zY3JvbGxMZWZ0ICsgdGFicy53aWR0aCgpKSA8IHRhYnNbMF0uc2Nyb2xsV2lkdGgpO1xyXG4gICAgfSxcclxuICAgIHNldHVwU2xpZGVyOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyKSB7XHJcbiAgICAgICAgdmFyIHRzID0gdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXInKTtcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicycpLmhhc1Njcm9sbEJhcih7IHg6IC0yIH0pLmhvcml6b250YWwpIHtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFkZENsYXNzKCdoYXMtdGFicy1zbGlkZXInKTtcclxuICAgICAgICAgICAgaWYgKHRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgIHRzLmNsYXNzTmFtZSA9ICd0YWJzLXNsaWRlcic7XHJcbiAgICAgICAgICAgICAgICAkKHRzKVxyXG4gICAgICAgICAgICAgICAgLy8gQXJyb3dzOlxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxhIGNsYXNzPVwidGFicy1zbGlkZXItbGVmdCBsZWZ0XCIgaHJlZj1cIiNcIj4mbHQ7Jmx0OzwvYT4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxhIGNsYXNzPVwidGFicy1zbGlkZXItcmlnaHQgcmlnaHRcIiBocmVmPVwiI1wiPiZndDsmZ3Q7PC9hPicpO1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFwcGVuZCh0cyk7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXJcclxuICAgICAgICAgICAgICAgIC8vIERlc2luZyBkZXRhaWxzOlxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ0YWJzLXNsaWRlci1saW1pdCB0YWJzLXNsaWRlci1saW1pdC1sZWZ0IGxlZnRcIiBocmVmPVwiI1wiPjwvZGl2PicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGRpdiBjbGFzcz1cInRhYnMtc2xpZGVyLWxpbWl0IHRhYnMtc2xpZGVyLWxpbWl0LXJpZ2h0IHJpZ2h0XCIgaHJlZj1cIiNcIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRzLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5yZW1vdmVDbGFzcygnaGFzLXRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgICAgIHRzLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFiQ29udGFpbmVyKTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWJDb250ZXh0QnlBcmdzOiBmdW5jdGlvbiAoYXJncykge1xyXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIHR5cGVvZiAoYXJnc1swXSkgPT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFRhYkNvbnRleHQoYXJnc1swXSwgbnVsbCk7XHJcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgYXJnc1swXS50YWIpXHJcbiAgICAgICAgICAgIHJldHVybiBhcmdzWzBdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFiQ29udGV4dChcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMCA/IGFyZ3NbMF0gOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAxID8gYXJnc1sxXSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDIgPyBhcmdzWzJdIDogbnVsbFxyXG4gICAgICAgICAgICApO1xyXG4gICAgfSxcclxuICAgIGdldFRhYkNvbnRleHQ6IGZ1bmN0aW9uICh0YWJPclNlbGVjdG9yLCBtZW51aXRlbU9yU2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgbWksIG1hLCB0YWIsIHRhYkNvbnRhaW5lcjtcclxuICAgICAgICBpZiAodGFiT3JTZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB0YWIgPSAkKHRhYk9yU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAodGFiLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXIgPSB0YWIucGFyZW50cygnLnRhYmJlZDplcSgwKScpO1xyXG4gICAgICAgICAgICAgICAgbWEgPSB0YWJDb250YWluZXIuZmluZCgnPiAudGFicyA+IGxpID4gYVtocmVmPSMnICsgdGFiLmdldCgwKS5pZCArICddJyk7XHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hLnBhcmVudCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChtZW51aXRlbU9yU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgbWEgPSAkKG1lbnVpdGVtT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmIChtYS5pcygnbGknKSkge1xyXG4gICAgICAgICAgICAgICAgbWkgPSBtYTtcclxuICAgICAgICAgICAgICAgIG1hID0gbWkuY2hpbGRyZW4oJ2E6ZXEoMCknKTtcclxuICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hLnBhcmVudCgpO1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIgPSBtaS5jbG9zZXN0KCcudGFiYmVkJyk7XHJcbiAgICAgICAgICAgIHRhYiA9IHRhYkNvbnRhaW5lci5maW5kKCc+LnRhYi1ib2R5QDAsID4udGFiLWJvZHktbGlzdD4udGFiLWJvZHlAMCcucmVwbGFjZSgvQDAvZywgbWEuYXR0cignaHJlZicpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IHRhYjogdGFiLCBtZW51YW5jaG9yOiBtYSwgbWVudWl0ZW06IG1pLCB0YWJDb250YWluZXI6IHRhYkNvbnRhaW5lciB9O1xyXG4gICAgfSxcclxuICAgIGNoZWNrVGFiQ29udGV4dDogZnVuY3Rpb24gKGN0eCwgZnVuY3Rpb25uYW1lLCBhcmdzLCBpc1Rlc3QpIHtcclxuICAgICAgICBpZiAoIWN0eC50YWIgfHwgY3R4LnRhYi5sZW5ndGggIT0gMSB8fFxyXG4gICAgICAgICAgICAhY3R4Lm1lbnVpdGVtIHx8IGN0eC5tZW51aXRlbS5sZW5ndGggIT0gMSB8fFxyXG4gICAgICAgICAgICAhY3R4LnRhYkNvbnRhaW5lciB8fCBjdHgudGFiQ29udGFpbmVyLmxlbmd0aCAhPSAxIHx8IFxyXG4gICAgICAgICAgICAhY3R4Lm1lbnVhbmNob3IgfHwgY3R4Lm1lbnVhbmNob3IubGVuZ3RoICE9IDEpIHtcclxuICAgICAgICAgICAgaWYgKCFpc1Rlc3QgJiYgY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVGFiYmVkVVguJyArIGZ1bmN0aW9ubmFtZSArICcsIGJhZCBhcmd1bWVudHM6ICcgKyBBcnJheS5qb2luKGFyZ3MsICcsICcpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdmb2N1c1RhYicsIGFyZ3VtZW50cywgdHJ1ZSkpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHJldHVybiBjdHgudGFiLmdldCgwKTtcclxuICAgIH0sXHJcbiAgICBmb2N1c1RhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2ZvY3VzVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBHZXQgcHJldmlvdXMgZm9jdXNlZCB0YWIsIHRyaWdnZXIgJ3RhYlVuZm9jdXNlZCcgaGFuZGxlciB0aGF0IGNhblxyXG4gICAgICAgIC8vIHN0b3AgdGhpcyBmb2N1cyAocmV0dXJuaW5nIGV4cGxpY2l0eSAnZmFsc2UnKVxyXG4gICAgICAgIHZhciBwcmV2VGFiID0gY3R4LnRhYi5zaWJsaW5ncygnLmN1cnJlbnQnKTtcclxuICAgICAgICBpZiAocHJldlRhYi50cmlnZ2VySGFuZGxlcigndGFiVW5mb2N1c2VkJywgW2N0eF0pID09PSBmYWxzZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBDaGVjayAoZmlyc3QhKSBpZiB0aGVyZSBpcyBhIHBhcmVudCB0YWIgYW5kIGZvY3VzIGl0IHRvbyAod2lsbCBiZSByZWN1cnNpdmUgY2FsbGluZyB0aGlzIHNhbWUgZnVuY3Rpb24pXHJcbiAgICAgICAgdmFyIHBhclRhYiA9IGN0eC50YWIucGFyZW50cygnLnRhYi1ib2R5OmVxKDApJyk7XHJcbiAgICAgICAgaWYgKHBhclRhYi5sZW5ndGggPT0gMSkgdGhpcy5mb2N1c1RhYihwYXJUYWIpO1xyXG5cclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdjdXJyZW50JykgfHxcclxuICAgICAgICAgICAgY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdkaXNhYmxlZCcpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIFVuc2V0IGN1cnJlbnQgbWVudSBlbGVtZW50XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNpYmxpbmdzKCcuY3VycmVudCcpLnJlbW92ZUNsYXNzKCdjdXJyZW50JylcclxuICAgICAgICAgICAgLmZpbmQoJz5hJykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAvLyBTZXQgY3VycmVudCBtZW51IGVsZW1lbnRcclxuICAgICAgICBjdHgubWVudWl0ZW0uYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICBjdHgubWVudWFuY2hvci5hZGRDbGFzcygnY3VycmVudCcpO1xyXG5cclxuICAgICAgICAvLyBIaWRlIGN1cnJlbnQgdGFiLWJvZHlcclxuICAgICAgICBwcmV2VGFiLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgLy8gU2hvdyBjdXJyZW50IHRhYi1ib2R5IGFuZCB0cmlnZ2VyIGV2ZW50XHJcbiAgICAgICAgY3R4LnRhYi5hZGRDbGFzcygnY3VycmVudCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRm9jdXNlZCcpO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBmb2N1c1RhYkluZGV4OiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCB0YWJJbmRleCkge1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZvY3VzVGFiKHRoaXMuZ2V0VGFiQ29udGV4dCh0YWJDb250YWluZXIuZmluZCgnPi50YWItYm9keTplcSgnICsgdGFiSW5kZXggKyAnKScpKSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIC8qIEVuYWJsZSBhIHRhYiwgZGlzYWJsaW5nIGFsbCBvdGhlcnMgdGFicyAtdXNlZnVsbCBpbiB3aXphcmQgc3R5bGUgcGFnZXMtICovXHJcbiAgICBlbmFibGVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdlbmFibGVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHJ0biA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaXMoJy5kaXNhYmxlZCcpKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBkaXNhYmxlZCBjbGFzcyBmcm9tIGZvY3VzZWQgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICAgICAgY3R4LnRhYi5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkVuYWJsZWQnKTtcclxuICAgICAgICAgICAgY3R4Lm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICBydG4gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBGb2N1cyB0YWI6XHJcbiAgICAgICAgdGhpcy5mb2N1c1RhYihjdHgpO1xyXG4gICAgICAgIC8vIERpc2FibGVkIHRhYnMgYW5kIG1lbnUgaXRlbXM6XHJcbiAgICAgICAgY3R4LnRhYi5zaWJsaW5ncygnOm5vdCguZGlzYWJsZWQpJylcclxuICAgICAgICAgICAgLmFkZENsYXNzKCdkaXNhYmxlZCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRGlzYWJsZWQnKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2libGluZ3MoJzpub3QoLmRpc2FibGVkKScpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnZGlzYWJsZWQnKTtcclxuICAgICAgICByZXR1cm4gcnRuO1xyXG4gICAgfSxcclxuICAgIHNob3doaWRlRHVyYXRpb246IDAsXHJcbiAgICBzaG93aGlkZUVhc2luZzogbnVsbCxcclxuICAgIHNob3dUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdzaG93VGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNob3cgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICBjdHgudGFiLnNob3codGhpcy5zaG93aGlkZUR1cmF0aW9uKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2hvdyh0aGlzLnNob3doaWRlRWFzaW5nKTtcclxuICAgIH0sXHJcbiAgICBoaWRlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnaGlkZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTaG93IHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgY3R4LnRhYi5oaWRlKHRoaXMuc2hvd2hpZGVEdXJhdGlvbik7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLmhpZGUodGhpcy5zaG93aGlkZUVhc2luZyk7XHJcbiAgICB9LFxyXG4gICAgdGFiQm9keUNsYXNzRXhjZXB0aW9uczogeyAndGFiLWJvZHknOiAwLCAndGFiYmVkJzogMCwgJ2N1cnJlbnQnOiAwLCAnZGlzYWJsZWQnOiAwIH0sXHJcbiAgICBjcmVhdGVUYWI6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIGlkTmFtZSwgbGFiZWwpIHtcclxuICAgICAgICB0YWJDb250YWluZXIgPSAkKHRhYkNvbnRhaW5lcik7XHJcbiAgICAgICAgLy8gdGFiQ29udGFpbmVyIG11c3QgYmUgb25seSBvbmUgYW5kIHZhbGlkIGNvbnRhaW5lclxyXG4gICAgICAgIC8vIGFuZCBpZE5hbWUgbXVzdCBub3QgZXhpc3RzXHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lci5sZW5ndGggPT0gMSAmJiB0YWJDb250YWluZXIuaXMoJy50YWJiZWQnKSAmJlxyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZE5hbWUpID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0YWIgZGl2OlxyXG4gICAgICAgICAgICB2YXIgdGFiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIHRhYi5pZCA9IGlkTmFtZTtcclxuICAgICAgICAgICAgLy8gUmVxdWlyZWQgY2xhc3Nlc1xyXG4gICAgICAgICAgICB0YWIuY2xhc3NOYW1lID0gXCJ0YWItYm9keVwiO1xyXG4gICAgICAgICAgICB2YXIgJHRhYiA9ICQodGFiKTtcclxuICAgICAgICAgICAgLy8gR2V0IGFuIGV4aXN0aW5nIHNpYmxpbmcgYW5kIGNvcHkgKHdpdGggc29tZSBleGNlcHRpb25zKSB0aGVpciBjc3MgY2xhc3Nlc1xyXG4gICAgICAgICAgICAkLmVhY2godGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiLWJvZHk6ZXEoMCknKS5hdHRyKCdjbGFzcycpLnNwbGl0KC9cXHMrLyksIGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISh2IGluIFRhYmJlZFVYLnRhYkJvZHlDbGFzc0V4Y2VwdGlvbnMpKVxyXG4gICAgICAgICAgICAgICAgICAgICR0YWIuYWRkQ2xhc3Modik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBBZGQgdG8gY29udGFpbmVyXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hcHBlbmQodGFiKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtZW51IGVudHJ5XHJcbiAgICAgICAgICAgIHZhciBtZW51aXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICAgICAgICAgIC8vIEJlY2F1c2UgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIHRhYiwgaXMgYSBkeW5hbWljYWxseSByZW1vdmFibGUgdGFiOlxyXG4gICAgICAgICAgICBtZW51aXRlbS5jbGFzc05hbWUgPSBcInJlbW92YWJsZVwiO1xyXG4gICAgICAgICAgICB2YXIgbWVudWFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICAgICAgbWVudWFuY2hvci5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCAnIycgKyBpZE5hbWUpO1xyXG4gICAgICAgICAgICAvLyBsYWJlbCBjYW5ub3QgYmUgbnVsbCBvciBlbXB0eVxyXG4gICAgICAgICAgICAkKG1lbnVhbmNob3IpLnRleHQoaXNFbXB0eVN0cmluZyhsYWJlbCkgPyBcIlRhYlwiIDogbGFiZWwpO1xyXG4gICAgICAgICAgICAkKG1lbnVpdGVtKS5hcHBlbmQobWVudWFuY2hvcik7XHJcbiAgICAgICAgICAgIC8vIEFkZCB0byB0YWJzIGxpc3QgY29udGFpbmVyXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKS5hcHBlbmQobWVudWl0ZW0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCwgb24gdGFiQ29udGFpbmVyLCB3aXRoIHRoZSBuZXcgdGFiIGFzIGRhdGFcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLnRyaWdnZXJIYW5kbGVyKCd0YWJDcmVhdGVkJywgW3RhYl0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZXR1cFNsaWRlcih0YWJDb250YWluZXIpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhYjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIHJlbW92ZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3JlbW92ZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gT25seSByZW1vdmUgaWYgaXMgYSAncmVtb3ZhYmxlJyB0YWJcclxuICAgICAgICBpZiAoIWN0eC5tZW51aXRlbS5oYXNDbGFzcygncmVtb3ZhYmxlJykgJiYgIWN0eC5tZW51aXRlbS5oYXNDbGFzcygndm9sYXRpbGUnKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIC8vIElmIHRhYiBpcyBjdXJyZW50bHkgZm9jdXNlZCB0YWIsIGNoYW5nZSB0byBmaXJzdCB0YWJcclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdjdXJyZW50JykpXHJcbiAgICAgICAgICAgIHRoaXMuZm9jdXNUYWJJbmRleChjdHgudGFiQ29udGFpbmVyLCAwKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0ucmVtb3ZlKCk7XHJcbiAgICAgICAgdmFyIHRhYmlkID0gY3R4LnRhYi5nZXQoMCkuaWQ7XHJcbiAgICAgICAgY3R4LnRhYi5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXR1cFNsaWRlcihjdHgudGFiQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgLy8gVHJpZ2dlciBldmVudCwgb24gdGFiQ29udGFpbmVyLCB3aXRoIHRoZSByZW1vdmVkIHRhYiBpZCBhcyBkYXRhXHJcbiAgICAgICAgY3R4LnRhYkNvbnRhaW5lci50cmlnZ2VySGFuZGxlcigndGFiUmVtb3ZlZCcsIFt0YWJpZF0pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIHNldFRhYlRpdGxlOiBmdW5jdGlvbiAodGFiT3JTZWxlY3RvciwgbmV3VGl0bGUpIHtcclxuICAgICAgICB2YXIgY3R4ID0gVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0YWJPclNlbGVjdG9yKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3NldFRhYlRpdGxlJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNldCBhbiBlbXB0eSBzdHJpbmcgaXMgbm90IGFsbG93ZWQsIHByZXNlcnZlIHByZXZpb3VzbHk6XHJcbiAgICAgICAgaWYgKCFpc0VtcHR5U3RyaW5nKG5ld1RpdGxlKSlcclxuICAgICAgICAgICAgY3R4Lm1lbnVhbmNob3IudGV4dChuZXdUaXRsZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiBNb3JlIHN0YXRpYyB1dGlsaXRpZXMgKi9cclxuXHJcbi8qKiBMb29rIHVwIHRoZSBjdXJyZW50IHdpbmRvdyBsb2NhdGlvbiBhZGRyZXNzIGFuZCB0cnkgdG8gZm9jdXMgYSB0YWIgd2l0aCB0aGF0XHJcbiAgICBuYW1lLCBpZiB0aGVyZSBpcyBvbmUuXHJcbioqL1xyXG5UYWJiZWRVWC5mb2N1c0N1cnJlbnRMb2NhdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIElmIHRoZSBjdXJyZW50IGxvY2F0aW9uIGhhdmUgYSBoYXNoIHZhbHVlIGJ1dCBpcyBub3QgYSBIYXNoQmFuZ1xyXG4gICAgaWYgKC9eI1teIV0vLnRlc3Qod2luZG93LmxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICAgICAgLy8gVHJ5IGZvY3VzIGEgdGFiIHdpdGggdGhhdCBuYW1lXHJcbiAgICAgICAgdmFyIHRhYiA9IFRhYmJlZFVYLmdldFRhYih3aW5kb3cubG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgaWYgKHRhYilcclxuICAgICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGFiKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKiBMb29rIGZvciB2b2xhdGlsZSB0YWJzIG9uIHRoZSBwYWdlLCBpZiB0aGV5IGFyZVxyXG4gICAgZW1wdHkgb3IgcmVxdWVzdGluZyBiZWluZyAndm9sYXRpemVkJywgcmVtb3ZlIGl0LlxyXG4qKi9cclxuVGFiYmVkVVguY2hlY2tWb2xhdGlsZVRhYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKCcudGFiYmVkID4gLnRhYnMgPiAudm9sYXRpbGUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGFiID0gVGFiYmVkVVguZ2V0VGFiKG51bGwsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0YWIgJiYgKCQodGFiKS5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMCB8fCAkKHRhYikuZmluZCgnOm5vdCgudGFiYmVkKSAudm9sYXRpemUtbXktdGFiJykubGVuZ3RoKSkge1xyXG4gICAgICAgICAgICBUYWJiZWRVWC5yZW1vdmVUYWIodGFiKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRhYmJlZFVYOyIsIi8qIHNsaWRlci10YWJzIGxvZ2ljLlxyXG4qIEV4ZWN1dGUgaW5pdCBhZnRlciBUYWJiZWRVWC5pbml0IHRvIGF2b2lkIGxhdW5jaCBhbmltYXRpb24gb24gcGFnZSBsb2FkLlxyXG4qIEl0IHJlcXVpcmVzIFRhYmJlZFVYIHRocm91Z2h0IERJIG9uICdpbml0Jy5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFNsaWRlclRhYnMoVGFiYmVkVVgpIHtcclxuICAgICQoJy50YWJiZWQuc2xpZGVyLXRhYnMnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciAkdGFicyA9ICR0LmNoaWxkcmVuKCcudGFiLWJvZHknKTtcclxuICAgICAgICB2YXIgYyA9ICR0YWJzXHJcbiAgICAgICAgICAgIC53cmFwQWxsKCc8ZGl2IGNsYXNzPVwidGFiLWJvZHktbGlzdFwiLz4nKVxyXG4gICAgICAgICAgICAuZW5kKCkuY2hpbGRyZW4oJy50YWItYm9keS1saXN0Jyk7XHJcbiAgICAgICAgJHRhYnMub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGMuc3RvcCh0cnVlLCBmYWxzZSkuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IGMuc2Nyb2xsTGVmdCgpICsgJCh0aGlzKS5wb3NpdGlvbigpLmxlZnQgfSwgMTQwMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gU2V0IGhvcml6b250YWwgc2Nyb2xsIHRvIHRoZSBwb3NpdGlvbiBvZiBjdXJyZW50IHNob3dlZCB0YWIsIHdpdGhvdXQgYW5pbWF0aW9uIChmb3IgcGFnZS1pbml0KTpcclxuICAgICAgICB2YXIgY3VycmVudFRhYiA9ICQoJHQuZmluZCgnPi50YWJzPmxpLmN1cnJlbnQ+YScpLmF0dHIoJ2hyZWYnKSk7XHJcbiAgICAgICAgYy5zY3JvbGxMZWZ0KGMuc2Nyb2xsTGVmdCgpICsgY3VycmVudFRhYi5wb3NpdGlvbigpLmxlZnQpO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBXaXphcmQgVGFiYmVkIEZvcm1zLlxyXG4gICAgSXQgdXNlIHRhYnMgdG8gbWFuYWdlIHRoZSBkaWZmZXJlbnQgZm9ybXMtc3RlcHMgaW4gdGhlIHdpemFyZCxcclxuICAgIGxvYWRlZCBieSBBSkFYIGFuZCBmb2xsb3dpbmcgdG8gdGhlIG5leHQgdGFiL3N0ZXAgb24gc3VjY2Vzcy5cclxuXHJcbiAgICBSZXF1aXJlIFRhYmJlZFVYIHZpYSBESSBvbiAnaW5pdCdcclxuICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgdmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpLFxyXG4gICAgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgICBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnLi9hamF4Q2FsbGJhY2tzJyksXHJcbiAgICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFRhYmJlZFdpemFyZChUYWJiZWRVWCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBsb2FkaW5nRGVsYXk6IDBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoXCJib2R5XCIpLmRlbGVnYXRlKFwiLnRhYmJlZC53aXphcmQgLm5leHRcIiwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgZm9ybVxyXG4gICAgICAgIHZhciBmb3JtID0gJCh0aGlzKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgY3VycmVudCB3aXphcmQgc3RlcC10YWJcclxuICAgICAgICB2YXIgY3VycmVudFN0ZXAgPSBmb3JtLmNsb3Nlc3QoJy50YWItYm9keScpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIHdpemFyZCBjb250YWluZXJcclxuICAgICAgICB2YXIgd2l6YXJkID0gZm9ybS5jbG9zZXN0KCcudGFiYmVkLndpemFyZCcpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIHdpemFyZC1uZXh0LXN0ZXBcclxuICAgICAgICB2YXIgbmV4dFN0ZXAgPSAkKHRoaXMpLmRhdGEoJ3dpemFyZC1uZXh0LXN0ZXAnKTtcclxuXHJcbiAgICAgICAgdmFyIGN0eCA9IHtcclxuICAgICAgICAgICAgYm94OiBjdXJyZW50U3RlcCxcclxuICAgICAgICAgICAgZm9ybTogZm9ybVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEZpcnN0IGF0IGFsbCwgaWYgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgICAgIHZhciB2YWxvYmplY3QgPSBmb3JtLmRhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gICAgICAgIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSk7XHJcbiAgICAgICAgICAgIC8vIFZhbGlkYXRpb24gaXMgYWN0aXZlZCwgd2FzIGV4ZWN1dGVkIGFuZCB0aGUgcmVzdWx0IGlzICdmYWxzZSc6IGJhZCBkYXRhLCBzdG9wIFBvc3Q6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICAgICAgdmFyIGN1c3ZhbCA9IGZvcm0uZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicpO1xyXG4gICAgICAgIGlmIChjdXN2YWwgJiYgY3VzdmFsLnZhbGlkYXRlICYmIGN1c3ZhbC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLmdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pO1xyXG4gICAgICAgICAgICAvLyBjdXN0b20gdmFsaWRhdGlvbiBub3QgcGFzc2VkLCBvdXQhXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJhaXNlIGV2ZW50XHJcbiAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcignYmVnaW5TdWJtaXRXaXphcmRTdGVwJyk7XHJcblxyXG4gICAgICAgIC8vIExvYWRpbmcsIHdpdGggcmV0YXJkXHJcbiAgICAgICAgY3R4LmxvYWRpbmd0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjdXJyZW50U3RlcC5ibG9jayhibG9ja1ByZXNldHMubG9hZGluZyk7XHJcbiAgICAgICAgfSwgb3B0aW9ucy5sb2FkaW5nRGVsYXkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgb2sgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gTWFyayBhcyBzYXZlZDpcclxuICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzID0gY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgICAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAoZm9ybS5hdHRyKCdhY3Rpb24nKSB8fCAnJyksXHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgY29udGV4dDogY3R4LFxyXG4gICAgICAgICAgICBkYXRhOiBmb3JtLnNlcmlhbGl6ZSgpLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBzdWNjZXNzLCBnbyBuZXh0IHN0ZXAsIHVzaW5nIGN1c3RvbSBKU09OIEFjdGlvbiBldmVudDpcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgbmV4dC1zdGVwXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRTdGVwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIG5leHQgc3RlcCBpcyBpbnRlcm5hbCB1cmwgKGEgbmV4dCB3aXphcmQgdGFiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoL14jLy50ZXN0KG5leHRTdGVwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChuZXh0U3RlcCkudHJpZ2dlcignYmVnaW5Mb2FkV2l6YXJkU3RlcCcpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRhYmJlZFVYLmVuYWJsZVRhYihuZXh0U3RlcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2sgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChuZXh0U3RlcCkudHJpZ2dlcignZW5kTG9hZFdpemFyZFN0ZXAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgbmV4dC1zdGVwIFVSSSB0aGF0IGlzIG5vdCBpbnRlcm5hbCBsaW5rLCB3ZSBsb2FkIGl0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWRpcmVjdFRvKG5leHRTdGVwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIERvIEpTT04gYWN0aW9uIGJ1dCBpZiBpcyBub3QgSlNPTiBvciB2YWxpZCwgbWFuYWdlIGFzIEhUTUw6XHJcbiAgICAgICAgICAgICAgICBpZiAoIWFqYXhDYWxsYmFja3MuZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUG9zdCAnbWF5YmUnIHdhcyB3cm9uZywgaHRtbCB3YXMgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZvcm0gY29udGFpbmVyOiB0aGUgYWpheC1ib3guXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYW4gZW1wdHkgZG9jdW1lbnQgb3IgbWFsZm9ybWVkIGlzIHJldHVybmVkOlxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3dpbmcgbmV3IGh0bWw6XHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFN0ZXAuaHRtbChuZXdodG1sKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Rm9ybSA9IGN1cnJlbnRTdGVwO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghY3VycmVudFN0ZXAuaXMoJ2Zvcm0nKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Rm9ybSA9IGN1cnJlbnRTdGVwLmZpbmQoJ2Zvcm06ZXEoMCknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hhbmdlc25vdGlmaWNhdGlvbiBhZnRlciBhcHBlbmQgZWxlbWVudCB0byBkb2N1bWVudCwgaWYgbm90IHdpbGwgbm90IHdvcms6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQgKGlmIHdhcyBzYXZlZCBidXQgc2VydmVyIGRlY2lkZSByZXR1cm5zIGh0bWwgaW5zdGVhZCBhIEpTT04gY29kZSwgcGFnZSBzY3JpcHQgbXVzdCBkbyAncmVnaXN0ZXJTYXZlJyB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZSk6XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Rm9ybS5nZXQoMCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdyZWxvYWRlZEh0bWxXaXphcmRTdGVwJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBhamF4Q2FsbGJhY2tzLmVycm9yLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogYWpheENhbGxiYWNrcy5jb21wbGV0ZVxyXG4gICAgICAgIH0pLmNvbXBsZXRlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcignZW5kU3VibWl0V2l6YXJkU3RlcCcsIG9rKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvKiogdGltZVNwYW4gY2xhc3MgdG8gbWFuYWdlIHRpbWVzLCBwYXJzZSwgZm9ybWF0LCBjb21wdXRlLlxyXG5JdHMgbm90IHNvIGNvbXBsZXRlIGFzIHRoZSBDIyBvbmVzIGJ1dCBpcyB1c2VmdWxsIHN0aWxsLlxyXG4qKi9cclxudmFyIFRpbWVTcGFuID0gZnVuY3Rpb24gKGRheXMsIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBtaWxsaXNlY29uZHMpIHtcclxuICAgIHRoaXMuZGF5cyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChkYXlzKSkgfHwgMDtcclxuICAgIHRoaXMuaG91cnMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoaG91cnMpKSB8fCAwO1xyXG4gICAgdGhpcy5taW51dGVzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KG1pbnV0ZXMpKSB8fCAwO1xyXG4gICAgdGhpcy5zZWNvbmRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KHNlY29uZHMpKSB8fCAwO1xyXG4gICAgdGhpcy5taWxsaXNlY29uZHMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQobWlsbGlzZWNvbmRzKSkgfHwgMDtcclxuXHJcbiAgICAvLyBpbnRlcm5hbCB1dGlsaXR5IGZ1bmN0aW9uICd0byBzdHJpbmcgd2l0aCB0d28gZGlnaXRzIGFsbW9zdCdcclxuICAgIGZ1bmN0aW9uIHQobikge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKG4gLyAxMCkgKyAnJyArIG4gJSAxMDtcclxuICAgIH1cclxuICAgIC8qKiBTaG93IG9ubHkgaG91cnMgYW5kIG1pbnV0ZXMgYXMgYSBzdHJpbmcgd2l0aCB0aGUgZm9ybWF0IEhIOm1tXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9TaG9ydFN0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU2hvcnRTdHJpbmcoKSB7XHJcbiAgICAgICAgdmFyIGggPSB0KHRoaXMuaG91cnMpLFxyXG4gICAgICAgICAgICBtID0gdCh0aGlzLm1pbnV0ZXMpO1xyXG4gICAgICAgIHJldHVybiAoaCArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICsgbSk7XHJcbiAgICB9O1xyXG4gICAgLyoqIFNob3cgdGhlIGZ1bGwgdGltZSBhcyBhIHN0cmluZywgZGF5cyBjYW4gYXBwZWFyIGJlZm9yZSBob3VycyBpZiB0aGVyZSBhcmUgMjQgaG91cnMgb3IgbW9yZVxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgdmFyIGggPSB0KHRoaXMuaG91cnMpLFxyXG4gICAgICAgICAgICBkID0gKHRoaXMuZGF5cyA+IDAgPyB0aGlzLmRheXMudG9TdHJpbmcoKSArIFRpbWVTcGFuLmRlY2ltYWxzRGVsaW1pdGVyIDogJycpLFxyXG4gICAgICAgICAgICBtID0gdCh0aGlzLm1pbnV0ZXMpLFxyXG4gICAgICAgICAgICBzID0gdCh0aGlzLnNlY29uZHMgKyB0aGlzLm1pbGxpc2Vjb25kcyAvIDEwMDApO1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIGQgK1xyXG4gICAgICAgICAgICBoICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgK1xyXG4gICAgICAgICAgICBtICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgK1xyXG4gICAgICAgICAgICBzKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnZhbHVlT2YgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b192YWx1ZU9mKCkge1xyXG4gICAgICAgIC8vIFJldHVybiB0aGUgdG90YWwgbWlsbGlzZWNvbmRzIGNvbnRhaW5lZCBieSB0aGUgdGltZVxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuZGF5cyAqICgyNCAqIDM2MDAwMDApICtcclxuICAgICAgICAgICAgdGhpcy5ob3VycyAqIDM2MDAwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLm1pbnV0ZXMgKiA2MDAwMCArXHJcbiAgICAgICAgICAgIHRoaXMuc2Vjb25kcyAqIDEwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLm1pbGxpc2Vjb25kc1xyXG4gICAgICAgICk7XHJcbiAgICB9O1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIG1pbGxpc2Vjb25kc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbU1pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21NaWxsaXNlY29uZHMobWlsbGlzZWNvbmRzKSB7XHJcbiAgICB2YXIgbXMgPSBtaWxsaXNlY29uZHMgJSAxMDAwLFxyXG4gICAgICAgIHMgPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDEwMDApICUgNjAsXHJcbiAgICAgICAgbSA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gNjAwMDApICUgNjAsXHJcbiAgICAgICAgaCA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gMzYwMDAwMCkgJSAyNCxcclxuICAgICAgICBkID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAoMzYwMDAwMCAqIDI0KSk7XHJcbiAgICByZXR1cm4gbmV3IFRpbWVTcGFuKGQsIGgsIG0sIHMsIG1zKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIHNlY29uZHNcclxuKiovXHJcblRpbWVTcGFuLmZyb21TZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbVNlY29uZHMoc2Vjb25kcykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbU1pbGxpc2Vjb25kcyhzZWNvbmRzICogMTAwMCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBtaW51dGVzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tTWludXRlcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21NaW51dGVzKG1pbnV0ZXMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21TZWNvbmRzKG1pbnV0ZXMgKiA2MCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBob3Vyc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbUhvdXJzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbUhvdXJzKGhvdXJzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tTWludXRlcyhob3VycyAqIDYwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIGRheXNcclxuKiovXHJcblRpbWVTcGFuLmZyb21EYXlzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbURheXMoZGF5cykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbUhvdXJzKGRheXMgKiAyNCk7XHJcbn07XHJcblxyXG4vLyBGb3Igc3BhbmlzaCBhbmQgZW5nbGlzaCB3b3JrcyBnb29kICc6JyBhcyB1bml0c0RlbGltaXRlciBhbmQgJy4nIGFzIGRlY2ltYWxEZWxpbWl0ZXJcclxuLy8gVE9ETzogdGhpcyBtdXN0IGJlIHNldCBmcm9tIGEgZ2xvYmFsIExDLmkxOG4gdmFyIGxvY2FsaXplZCBmb3IgY3VycmVudCB1c2VyXHJcblRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyID0gJzonO1xyXG5UaW1lU3Bhbi5kZWNpbWFsc0RlbGltaXRlciA9ICcuJztcclxuVGltZVNwYW4ucGFyc2UgPSBmdW5jdGlvbiAoc3RydGltZSkge1xyXG4gICAgc3RydGltZSA9IChzdHJ0aW1lIHx8ICcnKS5zcGxpdCh0aGlzLnVuaXRzRGVsaW1pdGVyKTtcclxuICAgIC8vIEJhZCBzdHJpbmcsIHJldHVybnMgbnVsbFxyXG4gICAgaWYgKHN0cnRpbWUubGVuZ3RoIDwgMilcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAvLyBEZWNvdXBsZWQgdW5pdHM6XHJcbiAgICB2YXIgZCwgaCwgbSwgcywgbXM7XHJcbiAgICBoID0gc3RydGltZVswXTtcclxuICAgIG0gPSBzdHJ0aW1lWzFdO1xyXG4gICAgcyA9IHN0cnRpbWUubGVuZ3RoID4gMiA/IHN0cnRpbWVbMl0gOiAwO1xyXG4gICAgLy8gU3Vic3RyYWN0aW5nIGRheXMgZnJvbSB0aGUgaG91cnMgcGFydCAoZm9ybWF0OiAnZGF5cy5ob3Vycycgd2hlcmUgJy4nIGlzIGRlY2ltYWxzRGVsaW1pdGVyKVxyXG4gICAgaWYgKGguY29udGFpbnModGhpcy5kZWNpbWFsc0RlbGltaXRlcikpIHtcclxuICAgICAgICB2YXIgZGhzcGxpdCA9IGguc3BsaXQodGhpcy5kZWNpbWFsc0RlbGltaXRlcik7XHJcbiAgICAgICAgZCA9IGRoc3BsaXRbMF07XHJcbiAgICAgICAgaCA9IGRoc3BsaXRbMV07XHJcbiAgICB9XHJcbiAgICAvLyBNaWxsaXNlY29uZHMgYXJlIGV4dHJhY3RlZCBmcm9tIHRoZSBzZWNvbmRzIChhcmUgcmVwcmVzZW50ZWQgYXMgZGVjaW1hbCBudW1iZXJzIG9uIHRoZSBzZWNvbmRzIHBhcnQ6ICdzZWNvbmRzLm1pbGxpc2Vjb25kcycgd2hlcmUgJy4nIGlzIGRlY2ltYWxzRGVsaW1pdGVyKVxyXG4gICAgbXMgPSBNYXRoLnJvdW5kKHBhcnNlRmxvYXQocy5yZXBsYWNlKHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIsICcuJykpICogMTAwMCAlIDEwMDApO1xyXG4gICAgLy8gUmV0dXJuIHRoZSBuZXcgdGltZSBpbnN0YW5jZVxyXG4gICAgcmV0dXJuIG5ldyBUaW1lU3BhbihkLCBoLCBtLCBzLCBtcyk7XHJcbn07XHJcblRpbWVTcGFuLnplcm8gPSBuZXcgVGltZVNwYW4oMCwgMCwgMCwgMCwgMCk7XHJcblRpbWVTcGFuLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19pc1plcm8oKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIHRoaXMuZGF5cyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMuaG91cnMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLm1pbnV0ZXMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLnNlY29uZHMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLm1pbGxpc2Vjb25kcyA9PT0gMFxyXG4gICAgKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxNaWxsaXNlY29uZHMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbFNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbFNlY29uZHMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxNaWxsaXNlY29uZHMoKSAvIDEwMDApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxNaW51dGVzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxNaW51dGVzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsU2Vjb25kcygpIC8gNjApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxIb3VycyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsSG91cnMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxNaW51dGVzKCkgLyA2MCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbERheXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbERheXMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxIb3VycygpIC8gMjQpO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUaW1lU3BhbjsiLCIvKiBFeHRyYSB1dGlsaXRpZXMgYW5kIG1ldGhvZHMgXHJcbiAqL1xyXG52YXIgVGltZVNwYW4gPSByZXF1aXJlKCcuL1RpbWVTcGFuJyk7XHJcbnZhciBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG4vKiogU2hvd3MgdGltZSBhcyBhIGxhcmdlIHN0cmluZyB3aXRoIHVuaXRzIG5hbWVzIGZvciB2YWx1ZXMgZGlmZmVyZW50IHRoYW4gemVyby5cclxuICoqL1xyXG5mdW5jdGlvbiBzbWFydFRpbWUodGltZSkge1xyXG4gICAgdmFyIHIgPSBbXTtcclxuICAgIGlmICh0aW1lLmRheXMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLmRheXMgKyAnIGRheXMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuZGF5cyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBkYXknKTtcclxuICAgIGlmICh0aW1lLmhvdXJzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5ob3VycyArICcgaG91cnMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuaG91cnMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgaG91cicpO1xyXG4gICAgaWYgKHRpbWUubWludXRlcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUubWludXRlcyArICcgbWludXRlcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5taW51dGVzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIG1pbnV0ZScpO1xyXG4gICAgaWYgKHRpbWUuc2Vjb25kcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuc2Vjb25kcyArICcgc2Vjb25kcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5zZWNvbmRzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIHNlY29uZCcpO1xyXG4gICAgaWYgKHRpbWUubWlsbGlzZWNvbmRzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5taWxsaXNlY29uZHMgKyAnIG1pbGxpc2Vjb25kcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5taWxsaXNlY29uZHMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgbWlsbGlzZWNvbmQnKTtcclxuICAgIHJldHVybiByLmpvaW4oJywgJyk7XHJcbn1cclxuXHJcbi8qKiBSb3VuZHMgYSB0aW1lIHRvIHRoZSBuZWFyZXN0IDE1IG1pbnV0ZXMgZnJhZ21lbnQuXHJcbkByb3VuZFRvIHNwZWNpZnkgdGhlIExDLnJvdW5kaW5nVHlwZUVudW0gYWJvdXQgaG93IHRvIHJvdW5kIHRoZSB0aW1lIChkb3duLCBuZWFyZXN0IG9yIHVwKVxyXG4qKi9cclxuZnVuY3Rpb24gcm91bmRUaW1lVG9RdWFydGVySG91cigvKiBUaW1lU3BhbiAqL3RpbWUsIC8qIG1hdGhVdGlscy5yb3VuZGluZ1R5cGVFbnVtICovcm91bmRUbykge1xyXG4gICAgdmFyIHJlc3RGcm9tUXVhcnRlciA9IHRpbWUudG90YWxIb3VycygpICUgMC4yNTtcclxuICAgIHZhciBob3VycyA9IHRpbWUudG90YWxIb3VycygpO1xyXG4gICAgaWYgKHJlc3RGcm9tUXVhcnRlciA+IDAuMCkge1xyXG4gICAgICAgIHN3aXRjaCAocm91bmRUbykge1xyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgICAgIGhvdXJzIC09IHJlc3RGcm9tUXVhcnRlcjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uTmVhcmVzdDpcclxuICAgICAgICAgICAgICAgIHZhciBsaW1pdCA9IDAuMjUgLyAyO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3RGcm9tUXVhcnRlciA+PSBsaW1pdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzICs9ICgwLjI1IC0gcmVzdEZyb21RdWFydGVyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG91cnMgLT0gcmVzdEZyb21RdWFydGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgICAgIGhvdXJzICs9ICgwLjI1IC0gcmVzdEZyb21RdWFydGVyKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBUaW1lU3Bhbi5mcm9tSG91cnMoaG91cnMpO1xyXG59XHJcblxyXG4vLyBFeHRlbmQgYSBnaXZlbiBUaW1lU3BhbiBvYmplY3Qgd2l0aCB0aGUgRXh0cmEgbWV0aG9kc1xyXG5mdW5jdGlvbiBwbHVnSW4oVGltZVNwYW4pIHtcclxuICAgIFRpbWVTcGFuLnByb3RvdHlwZS50b1NtYXJ0U3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TbWFydFN0cmluZygpIHsgcmV0dXJuIHNtYXJ0VGltZSh0aGlzKTsgfTtcclxuICAgIFRpbWVTcGFuLnByb3RvdHlwZS5yb3VuZFRvUXVhcnRlckhvdXIgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19yb3VuZFRvUXVhcnRlckhvdXIoKSB7IHJldHVybiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyLmNhbGwodGhpcywgcGFyYW1ldGVycyk7IH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIHNtYXJ0VGltZTogc21hcnRUaW1lLFxyXG4gICAgICAgIHJvdW5kVG9RdWFydGVySG91cjogcm91bmRUaW1lVG9RdWFydGVySG91cixcclxuICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgfTtcclxuIiwiLyoqXHJcbiAgIEFQSSBmb3IgYXV0b21hdGljIGNyZWF0aW9uIG9mIGxhYmVscyBmb3IgVUkgU2xpZGVycyAoanF1ZXJ5LXVpKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHRvb2x0aXBzID0gcmVxdWlyZSgnLi90b29sdGlwcycpLFxyXG4gICAgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpLFxyXG4gICAgVGltZVNwYW4gPSByZXF1aXJlKCcuL1RpbWVTcGFuJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuLyoqIENyZWF0ZSBsYWJlbHMgZm9yIGEganF1ZXJ5LXVpLXNsaWRlci5cclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZShzbGlkZXIpIHtcclxuICAgIC8vIHJlbW92ZSBvbGQgb25lczpcclxuICAgIHZhciBvbGQgPSBzbGlkZXIuc2libGluZ3MoJy51aS1zbGlkZXItbGFiZWxzJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCQodGhpcykuZGF0YSgndWktc2xpZGVyJykuZ2V0KDApID09IHNsaWRlci5nZXQoMCkpO1xyXG4gICAgfSkucmVtb3ZlKCk7XHJcbiAgICAvLyBDcmVhdGUgbGFiZWxzIGNvbnRhaW5lclxyXG4gICAgdmFyIGxhYmVscyA9ICQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWxzXCIvPicpO1xyXG4gICAgbGFiZWxzLmRhdGEoJ3VpLXNsaWRlcicsIHNsaWRlcik7XHJcblxyXG4gICAgLy8gU2V0dXAgb2YgdXNlZnVsIHZhcnMgZm9yIGxhYmVsIGNyZWF0aW9uXHJcbiAgICB2YXIgbWF4ID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ21heCcpLFxyXG4gICAgICAgIG1pbiA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdtaW4nKSxcclxuICAgICAgICBzdGVwID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ3N0ZXAnKSxcclxuICAgICAgICBzdGVwcyA9IE1hdGguZmxvb3IoKG1heCAtIG1pbikgLyBzdGVwKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBhbmQgcG9zaXRpb25pbmcgbGFiZWxzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBzdGVwczsgaSsrKSB7XHJcbiAgICAgICAgLy8gQ3JlYXRlIGxhYmVsXHJcbiAgICAgICAgdmFyIGxibCA9ICQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWxcIj48c3BhbiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbC10ZXh0XCIvPjwvZGl2PicpO1xyXG4gICAgICAgIC8vIFNldHVwIGxhYmVsIHdpdGggaXRzIHZhbHVlXHJcbiAgICAgICAgdmFyIGxhYmVsVmFsdWUgPSBtaW4gKyBpICogc3RlcDtcclxuICAgICAgICBsYmwuY2hpbGRyZW4oJy51aS1zbGlkZXItbGFiZWwtdGV4dCcpLnRleHQobGFiZWxWYWx1ZSk7XHJcbiAgICAgICAgbGJsLmRhdGEoJ3VpLXNsaWRlci12YWx1ZScsIGxhYmVsVmFsdWUpO1xyXG4gICAgICAgIC8vIFBvc2l0aW9uYXRlXHJcbiAgICAgICAgcG9zaXRpb25hdGUobGJsLCBpLCBzdGVwcyk7XHJcbiAgICAgICAgLy8gQWRkIHRvIGNvbnRhaW5lclxyXG4gICAgICAgIGxhYmVscy5hcHBlbmQobGJsKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGVyIGZvciBsYWJlbHMgY2xpY2sgdG8gc2VsZWN0IGl0cyBwb3NpdGlvbiB2YWx1ZVxyXG4gICAgbGFiZWxzLm9uKCdjbGljaycsICcudWktc2xpZGVyLWxhYmVsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWwgPSAkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlci12YWx1ZScpLFxyXG4gICAgICAgICAgICBzbGlkZXIgPSAkKHRoaXMpLnBhcmVudCgpLmRhdGEoJ3VpLXNsaWRlcicpO1xyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluc2VydCBsYWJlbHMgYXMgYSBzaWJsaW5nIG9mIHRoZSBzbGlkZXIgKGNhbm5vdCBiZSBpbnNlcnRlZCBpbnNpZGUpXHJcbiAgICBzbGlkZXIuYWZ0ZXIobGFiZWxzKTtcclxufVxyXG5cclxuLyoqIFBvc2l0aW9uYXRlIHRvIHRoZSBjb3JyZWN0IHBvc2l0aW9uIGFuZCB3aWR0aCBhbiBVSSBsYWJlbCBhdCBAbGJsXHJcbmZvciB0aGUgcmVxdWlyZWQgcGVyY2VudGFnZS13aWR0aCBAc3dcclxuKiovXHJcbmZ1bmN0aW9uIHBvc2l0aW9uYXRlKGxibCwgaSwgc3RlcHMpIHtcclxuICAgIHZhciBzdyA9IDEwMCAvIHN0ZXBzO1xyXG4gICAgdmFyIGxlZnQgPSBpICogc3cgLSBzdyAqIDAuNSxcclxuICAgICAgICByaWdodCA9IDEwMCAtIGxlZnQgLSBzdyxcclxuICAgICAgICBhbGlnbiA9ICdjZW50ZXInO1xyXG4gICAgaWYgKGkgPT09IDApIHtcclxuICAgICAgICBhbGlnbiA9ICdsZWZ0JztcclxuICAgICAgICBsZWZ0ID0gMDtcclxuICAgIH0gZWxzZSBpZiAoaSA9PSBzdGVwcykge1xyXG4gICAgICAgIGFsaWduID0gJ3JpZ2h0JztcclxuICAgICAgICByaWdodCA9IDA7XHJcbiAgICB9XHJcbiAgICBsYmwuY3NzKHtcclxuICAgICAgICAndGV4dC1hbGlnbic6IGFsaWduLFxyXG4gICAgICAgIGxlZnQ6IGxlZnQgKyAnJScsXHJcbiAgICAgICAgcmlnaHQ6IHJpZ2h0ICsgJyUnXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIFVwZGF0ZSB0aGUgdmlzaWJpbGl0eSBvZiBsYWJlbHMgb2YgYSBqcXVlcnktdWktc2xpZGVyIGRlcGVuZGluZyBpZiB0aGV5IGZpdCBpbiB0aGUgYXZhaWxhYmxlIHNwYWNlLlxyXG5TbGlkZXIgbmVlZHMgdG8gYmUgdmlzaWJsZS5cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZShzbGlkZXIpIHtcclxuICAgIC8vIEdldCBsYWJlbHMgZm9yIHNsaWRlclxyXG4gICAgdmFyIGxhYmVsc19jID0gc2xpZGVyLnNpYmxpbmdzKCcudWktc2xpZGVyLWxhYmVscycpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlcicpLmdldCgwKSA9PSBzbGlkZXIuZ2V0KDApKTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGxhYmVscyA9IGxhYmVsc19jLmZpbmQoJy51aS1zbGlkZXItbGFiZWwtdGV4dCcpO1xyXG5cclxuICAgIC8vIEFwcGx5IGF1dG9zaXplXHJcbiAgICBpZiAoKHNsaWRlci5kYXRhKCdzbGlkZXItYXV0b3NpemUnKSB8fCBmYWxzZSkudG9TdHJpbmcoKSA9PSAndHJ1ZScpXHJcbiAgICAgICAgYXV0b3NpemUoc2xpZGVyLCBsYWJlbHMpO1xyXG5cclxuICAgIC8vIEdldCBhbmQgYXBwbHkgbGF5b3V0XHJcbiAgICB2YXIgbGF5b3V0X25hbWUgPSBzbGlkZXIuZGF0YSgnc2xpZGVyLWxhYmVscy1sYXlvdXQnKSB8fCAnc3RhbmRhcmQnLFxyXG4gICAgICAgIGxheW91dCA9IGxheW91dF9uYW1lIGluIGxheW91dHMgPyBsYXlvdXRzW2xheW91dF9uYW1lXSA6IGxheW91dHMuc3RhbmRhcmQ7XHJcbiAgICBsYWJlbHNfYy5hZGRDbGFzcygnbGF5b3V0LScgKyBsYXlvdXRfbmFtZSk7XHJcbiAgICBsYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdG9vbHRpcHNcclxuICAgIHRvb2x0aXBzLmNyZWF0ZVRvb2x0aXAobGFiZWxzX2MuY2hpbGRyZW4oKSwge1xyXG4gICAgICAgIHRpdGxlOiBmdW5jdGlvbiAoKSB7IHJldHVybiAkKHRoaXMpLnRleHQoKTsgfVxyXG4gICAgICAgICwgcGVyc2lzdGVudDogdHJ1ZVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGF1dG9zaXplKHNsaWRlciwgbGFiZWxzKSB7XHJcbiAgICB2YXIgdG90YWxfd2lkdGggPSAwO1xyXG4gICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRvdGFsX3dpZHRoICs9ICQodGhpcykub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGMgPSBzbGlkZXIuY2xvc2VzdCgnLnVpLXNsaWRlci1jb250YWluZXInKSxcclxuICAgICAgICBtYXggPSBwYXJzZUZsb2F0KGMuY3NzKCdtYXgtd2lkdGgnKSksXHJcbiAgICAgICAgbWluID0gcGFyc2VGbG9hdChjLmNzcygnbWluLXdpZHRoJykpO1xyXG4gICAgaWYgKG1heCAhPSBOdW1iZXIuTmFOICYmIHRvdGFsX3dpZHRoID4gbWF4KVxyXG4gICAgICAgIHRvdGFsX3dpZHRoID0gbWF4O1xyXG4gICAgaWYgKG1pbiAhPSBOdW1iZXIuTmFOICYmIHRvdGFsX3dpZHRoIDwgbWluKVxyXG4gICAgICAgIHRvdGFsX3dpZHRoID0gbWluO1xyXG4gICAgYy53aWR0aCh0b3RhbF93aWR0aCk7XHJcbn1cclxuXHJcbi8qKiBTZXQgb2YgZGlmZmVyZW50IGxheW91dHMgZm9yIGxhYmVscywgYWxsb3dpbmcgZGlmZmVyZW50IGtpbmRzIG9mIFxyXG5wbGFjZW1lbnQgYW5kIHZpc3VhbGl6YXRpb24gdXNpbmcgdGhlIHNsaWRlciBkYXRhIG9wdGlvbiAnbGFiZWxzLWxheW91dCcuXHJcblVzZWQgYnkgJ3VwZGF0ZScsIGFsbW9zdCB0aGUgJ3N0YW5kYXJkJyBtdXN0IGV4aXN0IGFuZCBjYW4gYmUgaW5jcmVhc2VkXHJcbmV4dGVybmFsbHlcclxuKiovXHJcbnZhciBsYXlvdXRzID0ge307XHJcbi8qKiBTaG93IHRoZSBtYXhpbXVtIG51bWJlciBvZiBsYWJlbHMgaW4gZXF1YWxseSBzaXplZCBnYXBzIGJ1dFxyXG50aGUgbGFzdCBsYWJlbCB0aGF0IGlzIGVuc3VyZWQgdG8gYmUgc2hvd2VkIGV2ZW4gaWYgaXQgY3JlYXRlc1xyXG5hIGhpZ2hlciBnYXAgd2l0aCB0aGUgcHJldmlvdXMgb25lLlxyXG4qKi9cclxubGF5b3V0cy5zdGFuZGFyZCA9IGZ1bmN0aW9uIHN0YW5kYXJkX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoZXJlIGFyZSBtb3JlIGxhYmVscyB0aGFuIGF2YWlsYWJsZSBzcGFjZVxyXG4gICAgLy8gR2V0IG1heGltdW0gbGFiZWwgd2lkdGhcclxuICAgIHZhciBpdGVtX3dpZHRoID0gMDtcclxuICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdHcgPSAkKHRoaXMpLm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICAgICAgaWYgKHR3ID49IGl0ZW1fd2lkdGgpXHJcbiAgICAgICAgICAgIGl0ZW1fd2lkdGggPSB0dztcclxuICAgIH0pO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgd2lkdGgsIGlmIG5vdCwgZWxlbWVudCBpcyBub3QgdmlzaWJsZSBjYW5ub3QgYmUgY29tcHV0ZWRcclxuICAgIGlmIChpdGVtX3dpZHRoID4gMCkge1xyXG4gICAgICAgIC8vIEdldCB0aGUgcmVxdWlyZWQgc3RlcHBpbmcgb2YgbGFiZWxzXHJcbiAgICAgICAgdmFyIGxhYmVsc19zdGVwID0gTWF0aC5jZWlsKGl0ZW1fd2lkdGggLyAoc2xpZGVyLndpZHRoKCkgLyBsYWJlbHMubGVuZ3RoKSksXHJcbiAgICAgICAgbGFiZWxzX3N0ZXBzID0gbGFiZWxzLmxlbmd0aCAvIGxhYmVsc19zdGVwO1xyXG4gICAgICAgIGlmIChsYWJlbHNfc3RlcCA+IDEpIHtcclxuICAgICAgICAgICAgLy8gSGlkZSB0aGUgbGFiZWxzIG9uIHBvc2l0aW9ucyBvdXQgb2YgdGhlIHN0ZXBcclxuICAgICAgICAgICAgdmFyIG5ld2kgPSAwLFxyXG4gICAgICAgICAgICAgICAgbGltaXQgPSBsYWJlbHMubGVuZ3RoIC0gMSAtIGxhYmVsc19zdGVwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhYmVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxibCA9ICQobGFiZWxzW2ldKTtcclxuICAgICAgICAgICAgICAgIGlmICgoaSArIDEpIDwgbGFiZWxzLmxlbmd0aCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgaSAlIGxhYmVsc19zdGVwIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgaSA+IGxpbWl0KSlcclxuICAgICAgICAgICAgICAgICAgICBsYmwuaGlkZSgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxibC5zaG93KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXBvc2l0aW9uYXRlIHBhcmVudFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uYXRlKHBhcmVudCwgbmV3aSwgbGFiZWxzX3N0ZXBzKTtcclxuICAgICAgICAgICAgICAgICAgICBuZXdpKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbi8qKiBTaG93IGxhYmVscyBudW1iZXIgdmFsdWVzIGZvcm1hdHRlZCBhcyBob3Vycywgd2l0aCBvbmx5XHJcbmludGVnZXIgaG91cnMgYmVpbmcgc2hvd2VkLCB0aGUgbWF4aW11bSBudW1iZXIgb2YgaXQuXHJcbioqL1xyXG5sYXlvdXRzLmhvdXJzID0gZnVuY3Rpb24gaG91cnNfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscywgc2hvd19hbGwpIHtcclxuICAgIHZhciBpbnRMYWJlbHMgPSBzbGlkZXIuZmluZCgnLmludGVnZXItaG91cicpO1xyXG4gICAgaWYgKCFpbnRMYWJlbHMubGVuZ3RoKSB7XHJcbiAgICAgICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAoISR0LmRhdGEoJ2hvdXItcHJvY2Vzc2VkJykpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2ID0gcGFyc2VGbG9hdCgkdC50ZXh0KCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHYgIT0gTnVtYmVyLk5hTikge1xyXG4gICAgICAgICAgICAgICAgICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2ICUgMSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2RlY2ltYWwtaG91cicpLmhpZGUoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodiAlIDAuNSA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnBhcmVudCgpLmFkZENsYXNzKCdzdHJvbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQudGV4dChUaW1lU3Bhbi5mcm9tSG91cnModikudG9TaG9ydFN0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnaW50ZWdlci1ob3VyJykuc2hvdygpLnBhcmVudCgpLmFkZENsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGludExhYmVscyA9IGludExhYmVscy5hZGQoJHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ2hvdXItcHJvY2Vzc2VkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChzaG93X2FsbCAhPT0gdHJ1ZSlcclxuICAgICAgICBsYXlvdXRzLnN0YW5kYXJkKHNsaWRlciwgaW50TGFiZWxzLnBhcmVudCgpLCBpbnRMYWJlbHMpO1xyXG59O1xyXG5sYXlvdXRzWydhbGwtdmFsdWVzJ10gPSBmdW5jdGlvbiBhbGxfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscykge1xyXG4gICAgLy8gU2hvd2luZyBhbGwgbGFiZWxzXHJcbiAgICBsYWJlbHNfYy5zaG93KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKS5jaGlsZHJlbigpLnNob3coKTtcclxufTtcclxubGF5b3V0c1snYWxsLWhvdXJzJ10gPSBmdW5jdGlvbiBhbGxfaG91cnNfbGF5b3V0KCkge1xyXG4gICAgLy8gSnVzdCB1c2UgaG91cnMgbGF5b3V0IGJ1dCBzaG93aW5nIGFsbCBpbnRlZ2VyIGhvdXJzXHJcbiAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKGFyZ3VtZW50cywgdHJ1ZSk7XHJcbiAgICBsYXlvdXRzLmhvdXJzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNyZWF0ZTogY3JlYXRlLFxyXG4gICAgdXBkYXRlOiB1cGRhdGUsXHJcbiAgICBsYXlvdXRzOiBsYXlvdXRzXHJcbn07XHJcbiIsIi8qIFNldCBvZiBjb21tb24gTEMgY2FsbGJhY2tzIGZvciBtb3N0IEFqYXggb3BlcmF0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgdmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vLyBBS0E6IGFqYXhFcnJvclBvcHVwSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uRXJyb3IoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAvLyBJZiBpcyBhIGNvbm5lY3Rpb24gYWJvcnRlZCwgbm8gc2hvdyBtZXNzYWdlLlxyXG4gICAgLy8gcmVhZHlTdGF0ZSBkaWZmZXJlbnQgdG8gJ2RvbmU6NCcgbWVhbnMgYWJvcnRlZCB0b28sIFxyXG4gICAgLy8gYmVjYXVzZSB3aW5kb3cgYmVpbmcgY2xvc2VkL2xvY2F0aW9uIGNoYW5nZWRcclxuICAgIGlmIChtZXNzYWdlID09ICdhYm9ydCcgfHwgangucmVhZHlTdGF0ZSAhPSA0KVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICB2YXIgbSA9IG1lc3NhZ2U7XHJcbiAgICB2YXIgaWZyYW1lID0gbnVsbDtcclxuICAgIHNpemUgPSBwb3B1cC5zaXplKCdsYXJnZScpO1xyXG4gICAgc2l6ZS5oZWlnaHQgLT0gMzQ7XHJcbiAgICBpZiAobSA9PSAnZXJyb3InKSB7XHJcbiAgICAgICAgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGp4LnJlc3BvbnNlVGV4dCwgc2l6ZSk7XHJcbiAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICBtID0gbnVsbDtcclxuICAgIH0gIGVsc2VcclxuICAgICAgICBtID0gbSArIFwiOyBcIiArIGV4O1xyXG5cclxuICAgIC8vIEJsb2NrIGFsbCB3aW5kb3csIG5vdCBvbmx5IGN1cnJlbnQgZWxlbWVudFxyXG4gICAgJC5ibG9ja1VJKGVycm9yQmxvY2sobSwgbnVsbCwgcG9wdXAuc3R5bGUoc2l6ZSkpKTtcclxuICAgIGlmIChpZnJhbWUpXHJcbiAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAkKCcuYmxvY2tVSSAuY2xvc2UtcG9wdXAnKS5jbGljayhmdW5jdGlvbiAoKSB7ICQudW5ibG9ja1VJKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25Db21wbGV0ZSgpIHtcclxuICAgIC8vIERpc2FibGUgbG9hZGluZ1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ3RpbWVyIHx8IHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIC8vIFVuYmxvY2tcclxuICAgIGlmICh0aGlzLmF1dG9VbmJsb2NrTG9hZGluZykge1xyXG4gICAgICAgIC8vIERvdWJsZSB1bi1sb2NrLCBiZWNhdXNlIGFueSBvZiB0aGUgdHdvIHN5c3RlbXMgY2FuIGJlaW5nIHVzZWQ6XHJcbiAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5ib3gpO1xyXG4gICAgICAgIHRoaXMuYm94LnVuYmxvY2soKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICAvLyBTdXBwb3J0ZWQgdGhlIGdlbmVyaWMgY3R4LmVsZW1lbnQgZnJvbSBqcXVlcnkucmVsb2FkXHJcbiAgICBpZiAoY3R4LmVsZW1lbnQpIGN0eC5mb3JtID0gY3R4LmVsZW1lbnQ7XHJcbiAgICAvLyBTcGVjaWZpYyBzdHVmZiBvZiBhamF4Rm9ybXNcclxuICAgIGlmICghY3R4LmZvcm0pIGN0eC5mb3JtID0gJCh0aGlzKTtcclxuICAgIGlmICghY3R4LmJveCkgY3R4LmJveCA9IGN0eC5mb3JtO1xyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gRG8gSlNPTiBhY3Rpb24gYnV0IGlmIGlzIG5vdCBKU09OIG9yIHZhbGlkLCBtYW5hZ2UgYXMgSFRNTDpcclxuICAgIGlmICghZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpKSB7XHJcbiAgICAgICAgLy8gUG9zdCAnbWF5YmUnIHdhcyB3cm9uZywgaHRtbCB3YXMgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IFxyXG4gICAgICAgIC8vIGZvcm0gY29udGFpbmVyOiB0aGUgYWpheC1ib3guXHJcblxyXG4gICAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgICAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgICAgICAvLyBBdm9pZCBlbXB0eSBkb2N1bWVudHMgYmVpbmcgcGFyc2VkIChyYWlzZSBlcnJvcilcclxuICAgICAgICBpZiAoJC50cmltKGRhdGEpKSB7XHJcbiAgICAgICAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhIG1hbGZvcm1lZCBkb2N1bWVudCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZvciAncmVsb2FkJyBzdXBwb3J0LCBjaGVjayB0b28gdGhlIGNvbnRleHQubW9kZSwgYW5kIGJvdGggcmVsb2FkIG9yIGFqYXhGb3JtcyBjaGVjayBkYXRhIGF0dHJpYnV0ZSB0b29cclxuICAgICAgICBjdHguYm94SXNDb250YWluZXIgPSBjdHguYm94SXNDb250YWluZXI7XHJcbiAgICAgICAgdmFyIHJlcGxhY2VCb3hDb250ZW50ID1cclxuICAgICAgICAgIChjdHgub3B0aW9ucyAmJiBjdHgub3B0aW9ucy5tb2RlID09PSAncmVwbGFjZS1jb250ZW50JykgfHxcclxuICAgICAgICAgIGN0eC5ib3guZGF0YSgncmVsb2FkLW1vZGUnKSA9PT0gJ3JlcGxhY2UtY29udGVudCc7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSByZXR1cm5lZCBlbGVtZW50IGlzIHRoZSBhamF4LWJveCwgaWYgbm90LCBmaW5kXHJcbiAgICAgICAgLy8gdGhlIGVsZW1lbnQgaW4gdGhlIG5ld2h0bWw6XHJcbiAgICAgICAgdmFyIGpiID0gbmV3aHRtbC5maWx0ZXIoJy5hamF4LWJveCcpO1xyXG4gICAgICAgIGlmIChqYi5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgaWYgKCFjdHguYm94SXNDb250YWluZXIgJiYgIWpiLmlzKCcuYWpheC1ib3gnKSlcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sLmZpbmQoJy5hamF4LWJveDplcSgwKScpO1xyXG4gICAgICAgIGlmICghamIgfHwgamIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGFqYXgtYm94LCB1c2UgYWxsIGVsZW1lbnQgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZXBsYWNlQm94Q29udGVudCkge1xyXG4gICAgICAgICAgLy8gUmVwbGFjZSB0aGUgYm94IGNvbnRlbnQgd2l0aCB0aGUgY29udGVudCBvZiB0aGUgcmV0dXJuZWQgYm94XHJcbiAgICAgICAgICAvLyBvciBhbGwgaWYgdGhlcmUgaXMgbm8gYWpheC1ib3ggaW4gdGhlIHJlc3VsdC5cclxuICAgICAgICAgIGN0eC5ib3guZW1wdHkoKS5hcHBlbmQoamIuaXMoJy5hamF4LWJveCcpID8gamIuY29udGVudHMoKSA6IGpiKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGN0eC5ib3hJc0NvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAvLyBqYiBpcyBjb250ZW50IG9mIHRoZSBib3ggY29udGFpbmVyOlxyXG4gICAgICAgICAgICBjdHguYm94Lmh0bWwoamIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGJveCBpcyBjb250ZW50IHRoYXQgbXVzdCBiZSByZXBsYWNlZCBieSB0aGUgbmV3IGNvbnRlbnQ6XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVwbGFjZVdpdGgoamIpO1xyXG4gICAgICAgICAgICAvLyBhbmQgcmVmcmVzaCB0aGUgcmVmZXJlbmNlIHRvIGJveCB3aXRoIHRoZSBuZXcgZWxlbWVudFxyXG4gICAgICAgICAgICBjdHguYm94ID0gamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJdCBzdXBwb3J0cyBub3JtYWwgYWpheCBmb3JtcyBhbmQgc3ViZm9ybXMgdGhyb3VnaCBmaWVsZHNldC5hamF4XHJcbiAgICAgICAgaWYgKGN0eC5ib3guaXMoJ2Zvcm0uYWpheCcpIHx8IGN0eC5ib3guaXMoJ2ZpZWxkc2V0LmFqYXgnKSlcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveDtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmb3JtLmFqYXg6ZXEoMCknKTtcclxuICAgICAgICAgIGlmIChjdHguZm9ybS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmaWVsZHNldC5hamF4OmVxKDApJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gTW92ZSBmb2N1cyB0byB0aGUgZXJyb3JzIGFwcGVhcmVkIG9uIHRoZSBwYWdlIChpZiB0aGVyZSBhcmUpOlxyXG4gICAgICAgIHZhciB2YWxpZGF0aW9uU3VtbWFyeSA9IGpiLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRpb25TdW1tYXJ5Lmxlbmd0aClcclxuICAgICAgICAgIG1vdmVGb2N1c1RvKHZhbGlkYXRpb25TdW1tYXJ5KTtcclxuICAgICAgICAvLyBUT0RPOiBJdCBzZWVtcyB0aGF0IGl0IHJldHVybnMgYSBkb2N1bWVudC1mcmFnbWVudCBpbnN0ZWFkIG9mIGEgZWxlbWVudCBhbHJlYWR5IGluIGRvY3VtZW50XHJcbiAgICAgICAgLy8gZm9yIGN0eC5mb3JtIChtYXliZSBqYiB0b28/KSB3aGVuIHVzaW5nICogY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JyAqIFxyXG4gICAgICAgIC8vIChtYXliZSBvbiBvdGhlciBjYXNlcyB0b28/KS5cclxuICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIFtqYiwgY3R4LmZvcm0sIGp4XSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgbWVzc2FnZSwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCBjdHguZm9ybS5kYXRhKCdzdWNjZXNzLXBvc3QtbWVzc2FnZScpIHx8ICdEb25lISc7XHJcbiAgICBjdHguYm94LmJsb2NrKGluZm9CbG9jayhtZXNzYWdlLCB7XHJcbiAgICAgICAgY3NzOiBwb3B1cC5zdHlsZShwb3B1cC5zaXplKCdzbWFsbCcpKVxyXG4gICAgfSkpXHJcbiAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgXHJcbiAgICB9KTtcclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gc2hvd09rR29Qb3B1cChjdHgsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdiBjbGFzcz1cIm9rLWdvLWJveFwiLz4nKTtcclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxzcGFuIGNsYXNzPVwic3VjY2Vzcy1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLlN1Y2Nlc3NNZXNzYWdlKSk7XHJcbiAgICBpZiAoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSlcclxuICAgICAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWRkaXRpb25hbC1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKSk7XHJcblxyXG4gICAgdmFyIG9rQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gb2stYWN0aW9uIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjb2tcIi8+JykuYXBwZW5kKGRhdGEuT2tMYWJlbCk7XHJcbiAgICB2YXIgZ29CdG4gPSAnJztcclxuICAgIGlmIChkYXRhLkdvVVJMICYmIGRhdGEuR29MYWJlbCkge1xyXG4gICAgICAgIGdvQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gZ28tYWN0aW9uXCIvPicpLmF0dHIoJ2hyZWYnLCBkYXRhLkdvVVJMKS5hcHBlbmQoZGF0YS5Hb0xhYmVsKTtcclxuICAgICAgICAvLyBGb3JjaW5nIHRoZSAnY2xvc2UtYWN0aW9uJyBpbiBzdWNoIGEgd2F5IHRoYXQgZm9yIGludGVybmFsIGxpbmtzIHRoZSBwb3B1cCBnZXRzIGNsb3NlZCBpbiBhIHNhZmUgd2F5OlxyXG4gICAgICAgIGdvQnRuLmNsaWNrKGZ1bmN0aW9uICgpIHsgb2tCdG4uY2xpY2soKTsgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFjdGlvbnMgY2xlYXJmaXhcIi8+JykuYXBwZW5kKG9rQnRuKS5hcHBlbmQoZ29CdG4pKTtcclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGN0eC5ib3gsIG51bGwsIHtcclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpIHtcclxuICAgIC8vIElmIGlzIGEgSlNPTiByZXN1bHQ6XHJcbiAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBpZiAoY3R4LmJveClcclxuICAgICAgICAgICAgLy8gQ2xlYW4gcHJldmlvdXMgdmFsaWRhdGlvbiBlcnJvcnNcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY3R4LmJveCk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDA6IGdlbmVyYWwgc3VjY2VzcyBjb2RlLCBzaG93IG1lc3NhZ2Ugc2F5aW5nIHRoYXQgJ2FsbCB3YXMgZmluZSdcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDE6IGRvIGEgcmVkaXJlY3RcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAxKSB7XHJcbiAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDI6IHNob3cgbG9naW4gcG9wdXAgKHdpdGggdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDMpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDM6IHJlbG9hZCBjdXJyZW50IHBhZ2UgY29udGVudCB0byB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICAvLyBOb3RlOiB0byByZWxvYWQgc2FtZSB1cmwgcGFnZSBjb250ZW50LCBpcyBiZXR0ZXIgcmV0dXJuIHRoZSBodG1sIGRpcmVjdGx5IGZyb21cclxuICAgICAgICAgICAgLy8gdGhpcyBhamF4IHNlcnZlciByZXF1ZXN0LlxyXG4gICAgICAgICAgICAvL2NvbnRhaW5lci51bmJsb2NrKCk7IGlzIGJsb2NrZWQgYW5kIHVuYmxvY2tlZCBhZ2FpbiBieSB0aGUgcmVsb2FkIG1ldGhvZDpcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBjdHguYm94LnJlbG9hZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNCkge1xyXG4gICAgICAgICAgICAvLyBTaG93IFN1Y2Nlc3NNZXNzYWdlLCBhdHRhY2hpbmcgYW5kIGV2ZW50IGhhbmRsZXIgdG8gZ28gdG8gUmVkaXJlY3RVUkxcclxuICAgICAgICAgICAgY3R4LmJveC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQuUmVkaXJlY3RVUkwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuU3VjY2Vzc01lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDUpIHtcclxuICAgICAgICAgICAgLy8gQ2hhbmdlIG1haW4tYWN0aW9uIGJ1dHRvbiBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgYnRuID0gY3R4LmZvcm0uZmluZCgnLm1haW4tYWN0aW9uJyk7XHJcbiAgICAgICAgICAgIHZhciBkbXNnID0gYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpO1xyXG4gICAgICAgICAgICBpZiAoIWRtc2cpXHJcbiAgICAgICAgICAgICAgICBidG4uZGF0YSgnZGVmYXVsdC10ZXh0JywgYnRuLnRleHQoKSk7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBkYXRhLlJlc3VsdCB8fCBidG4uZGF0YSgnc3VjY2Vzcy1wb3N0LXRleHQnKSB8fCAnRG9uZSEnO1xyXG4gICAgICAgICAgICBidG4udGV4dChtc2cpO1xyXG4gICAgICAgICAgICAvLyBBZGRpbmcgc3VwcG9ydCB0byByZXNldCBidXR0b24gdGV4dCB0byBkZWZhdWx0IG9uZVxyXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBGaXJzdCBuZXh0IGNoYW5nZXMgaGFwcGVucyBvbiB0aGUgZm9ybTpcclxuICAgICAgICAgICAgJChjdHguZm9ybSkub25lKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgYnRuLnRleHQoYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgZm9yIGN1c3RvbSBoYW5kbGVyc1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA2KSB7XHJcbiAgICAgICAgICAgIC8vIE9rLUdvIGFjdGlvbnMgcG9wdXAgd2l0aCAnc3VjY2VzcycgYW5kICdhZGRpdGlvbmFsJyBtZXNzYWdlcy5cclxuICAgICAgICAgICAgc2hvd09rR29Qb3B1cChjdHgsIGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgNzogc2hvdyBtZXNzYWdlIHNheWluZyBjb250YWluZWQgYXQgZGF0YS5SZXN1bHQuTWVzc2FnZS5cclxuICAgICAgICAgICAgLy8gVGhpcyBjb2RlIGFsbG93IGF0dGFjaCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGluIGRhdGEuUmVzdWx0IHRvIGRpc3Rpbmd1aXNoXHJcbiAgICAgICAgICAgIC8vIGRpZmZlcmVudCByZXN1bHRzIGFsbCBzaG93aW5nIGEgbWVzc2FnZSBidXQgbWF5YmUgbm90IGJlaW5nIGEgc3VjY2VzcyBhdCBhbGxcclxuICAgICAgICAgICAgLy8gYW5kIG1heWJlIGRvaW5nIHNvbWV0aGluZyBtb3JlIGluIHRoZSB0cmlnZ2VyZWQgZXZlbnQgd2l0aCB0aGUgZGF0YSBvYmplY3QuXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0Lk1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA+IDEwMCkge1xyXG4gICAgICAgICAgICAvLyBVc2VyIENvZGU6IHRyaWdnZXIgY3VzdG9tIGV2ZW50IHRvIG1hbmFnZSByZXN1bHRzOlxyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwgangsIGN0eF0pO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIGRhdGEuQ29kZSA8IDBcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYW4gZXJyb3IgY29kZS5cclxuXHJcbiAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0uZ2V0KDApLCBjdHguY2hhbmdlZEVsZW1lbnRzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBcIkVycm9yOiBcIiArIGRhdGEuQ29kZSArIFwiOiBcIiArIEpTT04uc3RyaW5naWZ5KGRhdGEuUmVzdWx0ID8gKGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA6IGRhdGEuUmVzdWx0KSA6ICcnKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbigkKCc8ZGl2Lz4nKS5hcHBlbmQobWVzc2FnZSksIGN0eC5ib3gsIG51bGwsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVycm9yOiBsY09uRXJyb3IsXHJcbiAgICAgICAgc3VjY2VzczogbGNPblN1Y2Nlc3MsXHJcbiAgICAgICAgY29tcGxldGU6IGxjT25Db21wbGV0ZSxcclxuICAgICAgICBkb0pTT05BY3Rpb246IGRvSlNPTkFjdGlvblxyXG4gICAgfTtcclxufSIsIi8qIEZvcm1zIHN1Ym1pdHRlZCB2aWEgQUpBWCAqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICAgIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKTtcclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5ncywgd2lsbCBiZSB1cGRhdGVkIG9uIGluaXQgYnV0IGlzIGFjY2Vzc2VkXHJcbi8vIHRocm91Z2ggY2xvc3VyZSBmcm9tIGFsbCBmdW5jdGlvbnMuXHJcbi8vIE5PVEU6IGlzIHN0YXRpYywgZG9lc24ndCBhbGxvd3MgbXVsdGlwbGUgY29uZmlndXJhdGlvbiwgb25lIGluaXQgY2FsbCByZXBsYWNlIHByZXZpb3VzXHJcbi8vIERlZmF1bHRzOlxyXG52YXIgc2V0dGluZ3MgPSB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IDAsXHJcbiAgICBlbGVtZW50OiBkb2N1bWVudFxyXG59O1xyXG5cclxuLy8gQWRhcHRlZCBjYWxsYmFja3NcclxuZnVuY3Rpb24gYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyKCkge1xyXG4gICAgY2FsbGJhY2tzLmNvbXBsZXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFqYXhFcnJvclBvcHVwSGFuZGxlcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0sIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIENvbW1vbiBsb2dpY1xyXG4gICAgY2FsbGJhY2tzLmVycm9yLmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIoKSB7XHJcbiAgICBjYWxsYmFja3Muc3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4qIEFqYXggRm9ybXMgZ2VuZXJpYyBmdW5jdGlvbi5cclxuKiBSZXN1bHQgZXhwZWN0ZWQgaXM6XHJcbiogLSBodG1sLCBmb3IgdmFsaWRhdGlvbiBlcnJvcnMgZnJvbSBzZXJ2ZXIsIHJlcGxhY2luZyBjdXJyZW50IC5hamF4LWJveCBjb250ZW50XHJcbiogLSBqc29uLCB3aXRoIHN0cnVjdHVyZTogeyBDb2RlOiBpbnRlZ2VyLW51bWJlciwgUmVzdWx0OiBzdHJpbmctb3Itb2JqZWN0IH1cclxuKiAgIENvZGUgbnVtYmVyczpcclxuKiAgICAtIE5lZ2F0aXZlOiBlcnJvcnMsIHdpdGggYSBSZXN1bHQgb2JqZWN0IHsgRXJyb3JNZXNzYWdlOiBzdHJpbmcgfVxyXG4qICAgIC0gWmVybzogc3VjY2VzcyByZXN1bHQsIGl0IHNob3dzIGEgbWVzc2FnZSB3aXRoIGNvbnRlbnQ6IFJlc3VsdCBzdHJpbmcsIGVsc2UgZm9ybSBkYXRhIGF0dHJpYnV0ZSAnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnLCBlbHNlIGEgZ2VuZXJpYyBtZXNzYWdlXHJcbiogICAgLSAxOiBzdWNjZXNzIHJlc3VsdCwgUmVzdWx0IGNvbnRhaW5zIGEgVVJMLCB0aGUgcGFnZSB3aWxsIGJlIHJlZGlyZWN0ZWQgdG8gdGhhdC5cclxuKiAgICAtIE1ham9yIDE6IHN1Y2Nlc3MgcmVzdWx0LCB3aXRoIGN1c3RvbSBoYW5kbGVyIHRocm91Z2h0IHRoZSBmb3JtIGV2ZW50ICdzdWNjZXNzLXBvc3QtbWVzc2FnZScuXHJcbiovXHJcbmZ1bmN0aW9uIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpIHtcclxuICAgIC8vIENvbnRleHQgdmFyLCB1c2VkIGFzIGFqYXggY29udGV4dDpcclxuICAgIHZhciBjdHggPSB7fTtcclxuICAgIC8vIERlZmF1bHQgZGF0YSBmb3IgcmVxdWlyZWQgcGFyYW1zOlxyXG4gICAgY3R4LmZvcm0gPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuZm9ybSA6IG51bGwpIHx8ICQodGhpcyk7XHJcbiAgICBjdHguYm94ID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmJveCA6IG51bGwpIHx8IGN0eC5mb3JtLmNsb3Nlc3QoXCIuYWpheC1ib3hcIik7XHJcbiAgICB2YXIgYWN0aW9uID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmFjdGlvbiA6IG51bGwpIHx8IGN0eC5mb3JtLmF0dHIoJ2FjdGlvbicpIHx8ICcnO1xyXG5cclxuICAgIC8vIFZhbGlkYXRpb25zXHJcbiAgICB2YXIgdmFsaWRhdGlvblBhc3NlZCA9IHRydWU7XHJcbiAgICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3JtcyB0aHJvdWggZmllbGRzZXQuYWpheCwgd2UgbXVzdCBleGVjdXRlIHZhbGlkYXRpb25zIGFuZCB2ZXJpZmljYXRpb25cclxuICAgIC8vIGluIHR3byBzdGVwcyBhbmQgdXNpbmcgdGhlIHJlYWwgZm9ybSB0byBsZXQgdmFsaWRhdGlvbiBtZWNoYW5pc20gd29ya1xyXG4gICAgdmFyIGlzU3ViZm9ybSA9IGN0eC5mb3JtLmlzKCdmaWVsZHNldC5hamF4Jyk7XHJcbiAgICB2YXIgYWN0dWFsRm9ybSA9IGlzU3ViZm9ybSA/IGN0eC5mb3JtLmNsb3Nlc3QoJ2Zvcm0nKSA6IGN0eC5mb3JtLFxyXG4gICAgICBkaXNhYmxlZFN1bW1hcmllcyA9IG5ldyBqUXVlcnkoKTtcclxuXHJcbiAgICAvLyBPbiBzdWJmb3JtIHZhbGlkYXRpb24sIHdlIGRvbid0IHdhbnQgdGhlIGZvcm0gdmFsaWRhdGlvbi1zdW1tYXJ5IGNvbnRyb2xzIHRvIGJlIGFmZmVjdGVkXHJcbiAgICAvLyBieSB0aGlzIHZhbGlkYXRpb24gKHRvIGF2b2lkIHRvIHNob3cgZXJyb3JzIHRoZXJlIHRoYXQgZG9lc24ndCBpbnRlcmVzdCB0byB0aGUgcmVzdCBvZiB0aGUgZm9ybSlcclxuICAgIC8vIFRvIGZ1bGxmaWxsIHRoaXMgcmVxdWlzaXQsIHdlIG5lZWQgdG8gaGlkZSBpdCBmb3IgdGhlIHZhbGlkYXRvciBmb3IgYSB3aGlsZSBhbmQgbGV0IG9ubHkgYWZmZWN0XHJcbiAgICAvLyBhbnkgbG9jYWwgc3VtbWFyeSAoaW5zaWRlIHRoZSBzdWJmb3JtKS5cclxuICAgIGlmIChpc1N1YmZvcm0pIHtcclxuICAgICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBhY3R1YWxGb3JtXHJcbiAgICAgIC5maW5kKCdbZGF0YS12YWxtc2ctc3VtbWFyeT10cnVlXScpXHJcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIE9ubHkgdGhvc2UgdGhhdCBhcmUgb3V0c2lkZSB0aGUgc3ViZm9ybVxyXG4gICAgICAgIHJldHVybiAhJC5jb250YWlucyhjdHguZm9ybS5nZXQoMCksIHRoaXMpO1xyXG4gICAgICB9KVxyXG4gICAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAgIC8vIChpbiBvdGhlciB3b3JkcywgdXNpbmcgJ2RhdGEnIHdpbGwgbm90IHdvcmspXHJcbiAgICAgIC5hdHRyKCdkYXRhLXZhbG1zZy1zdW1tYXJ5JywgJ2ZhbHNlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmlyc3QgYXQgYWxsLCBpZiB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICB2YXIgdmFsb2JqZWN0ID0gYWN0dWFsRm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnMoY3R4LmZvcm0pO1xyXG4gICAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgY3VzdG9tIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgIHZhciBjdXN2YWwgPSBhY3R1YWxGb3JtLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgIGlmIChjdXN2YWwgJiYgY3VzdmFsLnZhbGlkYXRlICYmIGN1c3ZhbC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgICAgdmFsaWRhdGlvblBhc3NlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRvIHN1cHBvcnQgc3ViLWZvcm1zLCB3ZSBtdXN0IGNoZWNrIHRoYXQgdmFsaWRhdGlvbnMgZXJyb3JzIGhhcHBlbmVkIGluc2lkZSB0aGVcclxuICAgIC8vIHN1YmZvcm0gYW5kIG5vdCBpbiBvdGhlciBlbGVtZW50cywgdG8gZG9uJ3Qgc3RvcCBzdWJtaXQgb24gbm90IHJlbGF0ZWQgZXJyb3JzLlxyXG4gICAgLy8gSnVzdCBsb29rIGZvciBtYXJrZWQgZWxlbWVudHM6XHJcbiAgICBpZiAoaXNTdWJmb3JtICYmIGN0eC5mb3JtLmZpbmQoJy5pbnB1dC12YWxpZGF0aW9uLWVycm9yJykubGVuZ3RoKVxyXG4gICAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcblxyXG4gICAgLy8gUmUtZW5hYmxlIGFnYWluIHRoYXQgc3VtbWFyaWVzIHByZXZpb3VzbHkgZGlzYWJsZWRcclxuICAgIGlmIChpc1N1YmZvcm0pIHtcclxuICAgICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgICBkaXNhYmxlZFN1bW1hcmllcy5hdHRyKCdkYXRhLXZhbG1zZy1zdW1tYXJ5JywgJ3RydWUnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayB2YWxpZGF0aW9uIHN0YXR1c1xyXG4gICAgaWYgKHZhbGlkYXRpb25QYXNzZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgIC8vIFZhbGlkYXRpb24gZmFpbGVkLCBzdWJtaXQgY2Fubm90IGNvbnRpbnVlLCBvdXQhXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5jaGFuZ2VkRWxlbWVudHMgOiBudWxsKSB8fCBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBldmVudCB0byBhbGxvdyBzY3JpcHRzIHRvIGhvb2sgYWRkaXRpb25hbCB0YXNrcyBiZWZvcmUgc2VuZCBkYXRhXHJcbiAgICBjdHguZm9ybS50cmlnZ2VyKCdwcmVzdWJtaXQnLCBbY3R4XSk7XHJcblxyXG4gICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgIH0sIHNldHRpbmdzLmxvYWRpbmdEZWxheSk7XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICB2YXIgZGF0YSA9IGN0eC5mb3JtLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpO1xyXG5cclxuICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiAoYWN0aW9uKSxcclxuICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgc3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlcixcclxuICAgICAgICBjb21wbGV0ZTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTdG9wIG5vcm1hbCBQT1NUOlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBQdWJsaWMgaW5pdGlhbGl6YXRpb25cclxuZnVuY3Rpb24gaW5pdEFqYXhGb3JtcyhvcHRpb25zKSB7XHJcbiAgICAkLmV4dGVuZCh0cnVlLCBzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgdG8gbWFuYWdlIGFqYXggZm9ybXMgKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ3N1Ym1pdCcsICdmb3JtLmFqYXgnLCBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKTtcclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIGZvciBhIHNwZWNpYWwgYWpheCBmb3JtIGNhc2U6IHN1YmZvcm1zLCB1c2luZyBmaWVsZHNldHMuICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdjbGljaycsICdmaWVsZHNldC5hamF4IC5hamF4LWZpZWxkc2V0LXN1Ym1pdCcsXHJcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG5cclxuICAgICAgICAgIGV2ZW50LmRhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm06IGZvcm0sXHJcbiAgICAgICAgICAgIGJveDogZm9ybS5jbG9zZXN0KCcuYWpheC1ib3gnKSxcclxuICAgICAgICAgICAgYWN0aW9uOiBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGNoYW5nZWRFbGVtZW50czogY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCksIGZvcm0uZmluZCgnOmlucHV0W25hbWVdJykpXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuLyogVU5VU0VEP1xyXG5mdW5jdGlvbiBhamF4Rm9ybU1lc3NhZ2VPbkh0bWxSZXR1cm5lZFdpdGhvdXRWYWxpZGF0aW9uRXJyb3JzKGZvcm0sIG1lc3NhZ2UpIHtcclxuICAgIHZhciAkdCA9ICQoZm9ybSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb3JtIGVycm9ycywgc2hvdyBhIHN1Y2Nlc3NmdWwgbWVzc2FnZVxyXG4gICAgaWYgKCR0LmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAkdC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgICAgICBjc3M6IHBvcHVwU3R5bGUocG9wdXBTaXplKCdzbWFsbCcpKVxyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkgeyAkdC51bmJsb2NrKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbiAgICB9XHJcbn1cclxuKi9cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBpbml0QWpheEZvcm1zLFxyXG4gICAgICAgIG9uU3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgb25FcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfTsiLCIvKiBBdXRvIGNhbGN1bGF0ZSBzdW1tYXJ5IG9uIERPTSB0YWdnaW5nIHdpdGggY2xhc3NlcyB0aGUgZWxlbWVudHMgaW52b2x2ZWQuXHJcbiAqL1xyXG52YXIgbnUgPSByZXF1aXJlKCcuL251bWJlclV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMoKSB7XHJcbiAgICAkKCd0YWJsZS5jYWxjdWxhdGUtaXRlbXMtdG90YWxzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVSb3coKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciB0ciA9ICR0LmNsb3Nlc3QoJ3RyJyk7XHJcbiAgICAgICAgICAgIHZhciBpcCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZScpO1xyXG4gICAgICAgICAgICB2YXIgaXEgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKTtcclxuICAgICAgICAgICAgdmFyIGl0ID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXRvdGFsJyk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKG51LmdldE1vbmV5TnVtYmVyKGlwKSAqIG51LmdldE1vbmV5TnVtYmVyKGlxLCAxKSwgaXQpO1xyXG4gICAgICAgICAgICB0ci50cmlnZ2VyKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQodGhpcykuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXByaWNlLCAuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKS5vbignY2hhbmdlJywgY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChjYWxjdWxhdGVSb3cpO1xyXG4gICAgICAgICQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVTdW1tYXJ5KGZvcmNlKSB7XHJcbiAgICAkKCcuY2FsY3VsYXRlLXN1bW1hcnknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciBzID0gYy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeScpO1xyXG4gICAgICAgIHZhciBkID0gYy5maW5kKCd0YWJsZS5jYWxjdWxhdGUtc3VtbWFyeS1ncm91cCcpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGMoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAsIGZlZSA9IDAsIGR1cmF0aW9uID0gMDtcclxuICAgICAgICAgICAgdmFyIGdyb3VwcyA9IHt9O1xyXG4gICAgICAgICAgICBkLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwVG90YWwgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbENoZWNrZWQgPSAkKHRoaXMpLmlzKCcuY2FsY3VsYXRlLWFsbC1pdGVtcycpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQ2hlY2tlZCB8fCBpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuaXMoJzpjaGVja2VkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBUb3RhbCArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbDplcSgwKScpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eTplcSgwKScpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmVlICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWZlZTplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWR1cmF0aW9uOmVxKDApJykpICogcTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRvdGFsICs9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBncm91cHNbJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwJyldID0gZ3JvdXBUb3RhbDtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGdyb3VwVG90YWwsICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihkdXJhdGlvbiwgJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLmZpbmQoJy5ncm91cC10b3RhbC1kdXJhdGlvbicpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgc3VtbWFyeSB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcih0b3RhbCwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS10b3RhbCcpKTtcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZmVlLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWZlZScpKTtcclxuICAgICAgICAgICAgLy8gQW5kIGV2ZXJ5IGdyb3VwIHRvdGFsIHZhbHVlXHJcbiAgICAgICAgICAgIGZvciAodmFyIGcgaW4gZ3JvdXBzKSB7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cHNbZ10sIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktZ3JvdXAtJyArIGcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuY2hhbmdlKGNhbGMpO1xyXG4gICAgICAgIGQub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIGNhbGMpO1xyXG4gICAgICAgIGNhbGMoKTtcclxuICAgICAgICBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnLCB0cnVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSBkZXRhaWwgb2YgYSBwcmljaW5nIHN1bW1hcnksIG9uZSBkZXRhaWwgbGluZSBwZXIgc2VsZWN0ZWQgaXRlbVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkZCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbCcpLFxyXG4gICAgICAgICAgICAkdCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbC10cGwnKS5jaGlsZHJlbigndHI6ZXEoMCknKSxcclxuICAgICAgICAgICAgJGMgPSAkcy5jbG9zZXN0KCdmb3JtJyksXHJcbiAgICAgICAgICAgICRpdGVtcyA9ICRjLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbScpO1xyXG5cclxuICAgICAgICAvLyBEbyBpdCFcclxuICAgICAgICAvLyBSZW1vdmUgb2xkIGxpbmVzXHJcbiAgICAgICAgJGQuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyBDcmVhdGUgbmV3IG9uZXNcclxuICAgICAgICAkaXRlbXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyICRpID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25jZXB0ID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgcHJpY2UgPSBudS5nZXRNb25leU51bWJlcigkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2U6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgcm93IGFuZCBzZXQgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICB2YXIgJHJvdyA9ICR0LmNsb25lKClcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZGV0YWlsLXRwbCcpXHJcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2RldGFpbCcpO1xyXG4gICAgICAgICAgICAgICAgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY29uY2VwdCcpLnRleHQoY29uY2VwdCk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihwcmljZSwgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIHRhYmxlXHJcbiAgICAgICAgICAgICAgICAkZC5hcHBlbmQoJHJvdyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgIHZhciAkYyA9ICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAvLyBJbml0aWFsIGNhbGN1bGF0aW9uXHJcbiAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCk7XHJcbiAgICAvLyBDYWxjdWxhdGUgb24gcmVsZXZhbnQgZm9ybSBjaGFuZ2VzXHJcbiAgICAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLmNoYW5nZSh1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzIGV2ZW50XHJcbiAgICAkYy5vbignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbn1cclxuXHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvblRhYmxlSXRlbXM6IHNldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyxcclxuICAgICAgICBvblN1bW1hcnk6IHNldHVwQ2FsY3VsYXRlU3VtbWFyeSxcclxuICAgICAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5OiB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5LFxyXG4gICAgICAgIG9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5XHJcbiAgICB9OyIsIi8qIEZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBkb2N1bWVudCAob3IgaW4gQGNvbnRhaW5lcilcclxud2l0aCB0aGUgaHRtbDUgYXR0cmlidXRlICdhdXRvZm9jdXMnIChvciBhbHRlcm5hdGl2ZSBAY3NzU2VsZWN0b3IpLlxyXG5JdCdzIGZpbmUgYXMgYSBwb2x5ZmlsbCBhbmQgZm9yIGFqYXggbG9hZGVkIGNvbnRlbnQgdGhhdCB3aWxsIG5vdFxyXG5nZXQgdGhlIGJyb3dzZXIgc3VwcG9ydCBvZiB0aGUgYXR0cmlidXRlLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZvY3VzKGNvbnRhaW5lciwgY3NzU2VsZWN0b3IpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8IGRvY3VtZW50KTtcclxuICAgIGNvbnRhaW5lci5maW5kKGNzc1NlbGVjdG9yIHx8ICdbYXV0b2ZvY3VzXScpLmZvY3VzKCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0ZvY3VzOyIsIi8qKiBBdXRvLWZpbGwgbWVudSBzdWItaXRlbXMgdXNpbmcgdGFiYmVkIHBhZ2VzIC1vbmx5IHdvcmtzIGZvciBjdXJyZW50IHBhZ2UgaXRlbXMtICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdXRvZmlsbFN1Ym1lbnUoKSB7XHJcbiAgICAkKCcuYXV0b2ZpbGwtc3VibWVudSAuY3VycmVudCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRtZW51ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBzdWJtZW51IGVsZW1lbnRzIGZyb20gdGFicyBtYXJrZWQgd2l0aCBjbGFzcyAnYXV0b2ZpbGwtc3VibWVudS1pdGVtcydcclxuICAgICAgICB2YXIgaXRlbXMgPSAkKCcuYXV0b2ZpbGwtc3VibWVudS1pdGVtcyBsaTpub3QoLnJlbW92YWJsZSknKTtcclxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBpdGVtcywgY3JlYXRlIHRoZSBzdWJtZW51IGNsb25pbmcgaXQhXHJcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHN1Ym1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHBhcmVudG1lbnUuYXBwZW5kKHN1Ym1lbnUpO1xyXG4gICAgICAgICAgICAvLyBDbG9uaW5nIHdpdGhvdXQgZXZlbnRzOlxyXG4gICAgICAgICAgICB2YXIgbmV3aXRlbXMgPSBpdGVtcy5jbG9uZShmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAkKHN1Ym1lbnUpLmFwcGVuZChuZXdpdGVtcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIGF0dGFjaCBldmVudHMgdG8gbWFpbnRhaW4gdGhlIHRhYmJlZCBpbnRlcmZhY2Ugd29ya2luZ1xyXG4gICAgICAgICAgICAvLyBOZXcgSXRlbXMgKGNsb25lZCkgbXVzdCBjaGFuZ2UgdGFiczpcclxuICAgICAgICAgICAgbmV3aXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBpbiB0aGUgb3JpZ2luYWwgaXRlbVxyXG4gICAgICAgICAgICAgICAgJChcImFbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIsIGl0ZW1zKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTdG9wIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gT3JpZ2luYWwgaXRlbXMgbXVzdCBjaGFuZ2UgbWVudTpcclxuICAgICAgICAgICAgaXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbmV3aXRlbXMucGFyZW50KCkuZmluZChcImFcIikucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKS5cclxuICAgICAgICAgICAgICAgIGZpbHRlcihcIipbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gIEF2YWlsYWJpbGl0eUNhbGVuZGFyIE1vZHVsZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuL0NYL2V4dGVuZCcpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5ib3VuZHMnKTtcclxuXHJcbi8qKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbkNvbW1vbiBwcml2YXRlIHV0aWxpdGllc1xyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSoqL1xyXG5cclxuLyotLS0tLS0gQ09OU1RBTlRTIC0tLS0tLS0tLSovXHJcbnZhciBzdGF0dXNUeXBlcyA9IFsndW5hdmFpbGFibGUnLCAnYXZhaWxhYmxlJ107XHJcbi8vIFdlZWsgZGF5cyBuYW1lcyBpbiBlbmdsaXNoIGZvciBpbnRlcm5hbCBzeXN0ZW1cclxuLy8gdXNlOyBOT1QgZm9yIGxvY2FsaXphdGlvbi90cmFuc2xhdGlvbi5cclxudmFyIHN5c3RlbVdlZWtEYXlzID0gW1xyXG4gICdzdW5kYXknLFxyXG4gICdtb25kYXknLFxyXG4gICd0dWVzZGF5JyxcclxuICAnd2VkbmVzZGF5JyxcclxuICAndGh1cnNkYXknLFxyXG4gICdmcmlkYXknLFxyXG4gICdzYXR1cmRheSdcclxuXTtcclxuXHJcbi8qLS0tLS0tLS0tIENPTkZJRyAtIElOU1RBTkNFIC0tLS0tLS0tLS0qL1xyXG52YXIgd2Vla2x5Q2xhc3NlcyA9IHtcclxuICBjYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyJyxcclxuICB3ZWVrbHlDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS13ZWVrbHknLFxyXG4gIGN1cnJlbnRXZWVrOiAnaXMtY3VycmVudFdlZWsnLFxyXG4gIGFjdGlvbnM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1hY3Rpb25zJyxcclxuICBwcmV2QWN0aW9uOiAnQWN0aW9ucy1wcmV2JyxcclxuICBuZXh0QWN0aW9uOiAnQWN0aW9ucy1uZXh0JyxcclxuICBkYXlzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItZGF5cycsXHJcbiAgc2xvdHM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1zbG90cycsXHJcbiAgc2xvdEhvdXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1ob3VyJyxcclxuICBzbG90U3RhdHVzUHJlZml4OiAnaXMtJyxcclxuICBsZWdlbmQ6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQnLFxyXG4gIGxlZ2VuZEF2YWlsYWJsZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZC1hdmFpbGFibGUnLFxyXG4gIGxlZ2VuZFVuYXZhaWxhYmxlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kLXVuYXZhaWxhYmxlJ1xyXG59O1xyXG5cclxudmFyIHdlZWtseVRleHRzID0ge1xyXG4gIGFiYnJXZWVrRGF5czogW1xyXG4gICAgJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCdcclxuICBdLFxyXG4gIHRvZGF5OiAnVG9kYXknLFxyXG4gIC8vIEFsbG93ZWQgc3BlY2lhbCB2YWx1ZXM6IE06bW9udGgsIEQ6ZGF5XHJcbiAgYWJickRhdGVGb3JtYXQ6ICdNL0QnXHJcbn07XHJcblxyXG4vKi0tLS0tLS0tLS0tIFZJRVcgLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5mdW5jdGlvbiBtb3ZlQmluZFJhbmdlSW5EYXlzKHdlZWtseSwgZGF5cykge1xyXG4gIHZhciBcclxuICAgIHN0YXJ0ID0gYWRkRGF5cyh3ZWVrbHkuZGF0ZXNSYW5nZS5zdGFydCwgZGF5cyksXHJcbiAgICBlbmQgPSBhZGREYXlzKHdlZWtseS5kYXRlc1JhbmdlLmVuZCwgZGF5cyksXHJcbiAgICBkYXRlc1JhbmdlID0gZGF0ZXNUb1JhbmdlKHN0YXJ0LCBlbmQpO1xyXG5cclxuICAvLyBTdXBwb3J0IGZvciBwcmVmZXRjaGluZzpcclxuICAvLyBJdHMgYXZvaWRlZCBpZiB0aGVyZSBhcmUgcmVxdWVzdHMgaW4gY291cnNlLCBzaW5jZVxyXG4gIC8vIHRoYXQgd2lsbCBiZSBhIHByZWZldGNoIGZvciB0aGUgc2FtZSBkYXRhLlxyXG4gIGlmICh3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCkge1xyXG4gICAgLy8gVGhlIGxhc3QgcmVxdWVzdCBpbiB0aGUgcG9vbCAqbXVzdCogYmUgdGhlIGxhc3QgaW4gZmluaXNoXHJcbiAgICAvLyAobXVzdCBiZSBvbmx5IG9uZSBpZiBhbGwgZ29lcyBmaW5lKTpcclxuICAgIHZhciByZXF1ZXN0ID0gd2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0c1t3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgIC8vIFdhaXQgZm9yIHRoZSBmZXRjaCB0byBwZXJmb3JtIGFuZCBzZXRzIGxvYWRpbmcgdG8gbm90aWZ5IHVzZXJcclxuICAgIHdlZWtseS4kZWwuYWRkQ2xhc3Mod2Vla2x5LmNsYXNzZXMuZmV0Y2hpbmcpO1xyXG4gICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgbW92ZUJpbmRSYW5nZUluRGF5cyh3ZWVrbHksIGRheXMpO1xyXG4gICAgICB3ZWVrbHkuJGVsLnJlbW92ZUNsYXNzKHdlZWtseS5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJyk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIC8vIENoZWNrIGNhY2hlOiBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGRhdGUgaW4gdGhlIHJhbmdlXHJcbiAgLy8gd2l0aG91dCBkYXRhLCB3ZSBzZXQgaW5DYWNoZSBhcyBmYWxzZSBhbmQgZmV0Y2ggdGhlIGRhdGE6XHJcbiAgdmFyIGluQ2FjaGUgPSB0cnVlO1xyXG4gIGVhY2hEYXRlSW5SYW5nZShzdGFydCwgZW5kLCBmdW5jdGlvbiAoZGF0ZSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIGlmICghd2Vla2x5LmRhdGEuc2xvdHNbZGF0ZWtleV0pIHtcclxuICAgICAgaW5DYWNoZSA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIGlmIChpbkNhY2hlKVxyXG4gIC8vIEp1c3Qgc2hvdyB0aGUgZGF0YVxyXG4gICAgd2Vla2x5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gIGVsc2VcclxuICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgd2Vla2x5XHJcbiAgICAuZmV0Y2hEYXRhKGRhdGVzVG9RdWVyeShkYXRlc1JhbmdlKSlcclxuICAgIC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgd2Vla2x5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBVcGRhdGUgdGhlIHZpZXcgbGFiZWxzIGZvciB0aGUgd2Vlay1kYXlzICh0YWJsZSBoZWFkZXJzKVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIGNhbGVuZGFyLCBvcHRpb25zKSB7XHJcbiAgdmFyIHN0YXJ0ID0gZGF0ZXNSYW5nZS5zdGFydCxcclxuICAgICAgZW5kID0gZGF0ZXNSYW5nZS5lbmQ7XHJcblxyXG4gIHZhciBkYXlzID0gY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMuZGF5cyArICcgdGgnKTtcclxuICB2YXIgdG9kYXkgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXcgRGF0ZSgpKTtcclxuICAvLyBGaXJzdCBjZWxsIGlzIGVtcHR5ICgndGhlIGNyb3NzIGhlYWRlcnMgY2VsbCcpLCB0aGVuIG9mZnNldCBpcyAxXHJcbiAgdmFyIG9mZnNldCA9IDE7XHJcbiAgZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICB2YXIgY2VsbCA9ICQoZGF5cy5nZXQob2Zmc2V0ICsgaSkpLFxyXG4gICAgICAgIHNkYXRlID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSksXHJcbiAgICAgICAgbGFiZWwgPSBzZGF0ZTtcclxuXHJcbiAgICBpZiAodG9kYXkgPT0gc2RhdGUpXHJcbiAgICAgIGxhYmVsID0gb3B0aW9ucy50ZXh0cy50b2RheTtcclxuICAgIGVsc2VcclxuICAgICAgbGFiZWwgPSBvcHRpb25zLnRleHRzLmFiYnJXZWVrRGF5c1tkYXRlLmdldERheSgpXSArICcgJyArIGZvcm1hdERhdGUoZGF0ZSwgb3B0aW9ucy50ZXh0cy5hYmJyRGF0ZUZvcm1hdCk7XHJcblxyXG4gICAgY2VsbC50ZXh0KGxhYmVsKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIGRheSwgc2xvdCkge1xyXG4gIHNsb3QgPSBkYXRlSVNPLnBhcnNlKHNsb3QpO1xyXG4gIHZhciBcclxuICAgIHggPSBNYXRoLnJvdW5kKHNsb3QuZ2V0SG91cnMoKSksXHJcbiAgLy8gVGltZSBmcmFtZXMgKHNsb3RzKSBhcmUgMTUgbWludXRlcyBkaXZpc2lvbnNcclxuICAgIHkgPSBNYXRoLnJvdW5kKHNsb3QuZ2V0TWludXRlcygpIC8gMTUpLFxyXG4gICAgdHIgPSBzbG90c0NvbnRhaW5lci5jaGlsZHJlbignOmVxKCcgKyBNYXRoLnJvdW5kKHggKiA0ICsgeSkgKyAnKScpO1xyXG5cclxuICAvLyBTbG90IGNlbGwgZm9yIG8nY2xvY2sgaG91cnMgaXMgYXQgMSBwb3NpdGlvbiBvZmZzZXRcclxuICAvLyBiZWNhdXNlIG9mIHRoZSByb3ctaGVhZCBjZWxsXHJcbiAgdmFyIGRheU9mZnNldCA9ICh5ID09PSAwID8gZGF5ICsgMSA6IGRheSk7XHJcbiAgcmV0dXJuIHRyLmNoaWxkcmVuKCc6ZXEoJyArIGRheU9mZnNldCArICcpJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRTbG90QnlDZWxsKHNsb3RzQ29udGFpbmVyLCBjZWxsKSB7XHJcbiAgdmFyIFxyXG4gICAgeCA9IGNlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGNlbGwpLFxyXG4gICAgeSA9IGNlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpLFxyXG4gICAgZnVsbE1pbnV0ZXMgPSB5ICogMTUsXHJcbiAgICBob3VycyA9IE1hdGguZmxvb3IoZnVsbE1pbnV0ZXMgLyA2MCksXHJcbiAgICBtaW51dGVzID0gZnVsbE1pbnV0ZXMgLSAoaG91cnMgKiA2MCksXHJcbiAgICBzbG90ID0gbmV3IERhdGUoKTtcclxuICBzbG90LnNldEhvdXJzKGhvdXJzLCBtaW51dGVzLCAwLCAwKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIGRheTogeCxcclxuICAgIHNsb3Q6IHNsb3RcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LXdlZWsgYW5kIGRpc2FibGUgcHJldiBidXR0b24sXHJcbm9yIHJlbW92ZSB0aGUgbWFyayBhbmQgZW5hYmxlIGl0IGlmIGlzIG5vdC5cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrQ3VycmVudFdlZWsoY2FsZW5kYXIsIGRhdGUsIG9wdGlvbnMpIHtcclxuICB2YXIgeWVwID0gaXNJbkN1cnJlbnRXZWVrKGRhdGUpO1xyXG4gIGNhbGVuZGFyLnRvZ2dsZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy5jdXJyZW50V2VlaywgeWVwKTtcclxuICBjYWxlbmRhci5maW5kKCcuJyArIG9wdGlvbnMuY2xhc3Nlcy5wcmV2QWN0aW9uKS5wcm9wKCdkaXNhYmxlZCcsIHllcCk7XHJcbn1cclxuXHJcbi8qKiBHZXQgcXVlcnkgb2JqZWN0IHdpdGggdGhlIGRhdGUgcmFuZ2Ugc3BlY2lmaWVkOlxyXG4qKi9cclxuZnVuY3Rpb24gZGF0ZXNUb1F1ZXJ5KHN0YXJ0LCBlbmQpIHtcclxuICAvLyBVbmlxdWUgcGFyYW0gd2l0aCBib3RoIHByb3BpZXJ0aWVzOlxyXG4gIGlmIChzdGFydC5lbmQpIHtcclxuICAgIGVuZCA9IHN0YXJ0LmVuZDtcclxuICAgIHN0YXJ0ID0gc3RhcnQuc3RhcnQ7XHJcbiAgfVxyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZGF0ZUlTTy5kYXRlTG9jYWwoc3RhcnQsIHRydWUpLFxyXG4gICAgZW5kOiBkYXRlSVNPLmRhdGVMb2NhbChlbmQsIHRydWUpXHJcbiAgfTtcclxufVxyXG5cclxuLyoqIFBhY2sgdHdvIGRhdGVzIGluIGEgc2ltcGxlIGJ1dCB1c2VmdWxcclxuICBzdHJ1Y3R1cmUgeyBzdGFydCwgZW5kIH1cclxuKiovXHJcbmZ1bmN0aW9uIGRhdGVzVG9SYW5nZShzdGFydCwgZW5kKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBzdGFydCxcclxuICAgIGVuZDogZW5kXHJcbiAgfTtcclxufVxyXG5cclxuLyotLS0tLS0tLS0tLSBEQVRFUyAoZ2VuZXJpYyBmdW5jdGlvbnMpIC0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5mdW5jdGlvbiBjdXJyZW50V2VlaygpIHtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGdldEZpcnN0V2Vla0RhdGUobmV3IERhdGUoKSksXHJcbiAgICBlbmQ6IGdldExhc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKVxyXG4gIH07XHJcbn1cclxuZnVuY3Rpb24gbmV4dFdlZWsoc3RhcnQsIGVuZCkge1xyXG4gIC8vIFVuaXF1ZSBwYXJhbSB3aXRoIGJvdGggcHJvcGllcnRpZXM6XHJcbiAgaWYgKHN0YXJ0LmVuZCkge1xyXG4gICAgZW5kID0gc3RhcnQuZW5kO1xyXG4gICAgc3RhcnQgPSBzdGFydC5zdGFydDtcclxuICB9XHJcbiAgLy8gT3B0aW9uYWwgZW5kOlxyXG4gIGVuZCA9IGVuZCB8fCBhZGREYXlzKHN0YXJ0LCA3KTtcclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGFkZERheXMoc3RhcnQsIDcpLFxyXG4gICAgZW5kOiBhZGREYXlzKGVuZCwgNylcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRGaXJzdFdlZWtEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSAtIGQuZ2V0RGF5KCkpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRMYXN0V2Vla0RhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgKDYgLSBkLmdldERheSgpKSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzSW5DdXJyZW50V2VlayhkYXRlKSB7XHJcbiAgcmV0dXJuIGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0V2Vla0RhdGUoZGF0ZSkpID09IGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0V2Vla0RhdGUobmV3IERhdGUoKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhZGREYXlzKGRhdGUsIGRheXMpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSArIGRheXMpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlYWNoRGF0ZUluUmFuZ2Uoc3RhcnQsIGVuZCwgZm4pIHtcclxuICBpZiAoIWZuLmNhbGwpIHRocm93IG5ldyBFcnJvcignZm4gbXVzdCBiZSBhIGZ1bmN0aW9uIG9yIFwiY2FsbFwiYWJsZSBvYmplY3QnKTtcclxuICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHN0YXJ0KTtcclxuICB2YXIgaSA9IDAsIHJldDtcclxuICB3aGlsZSAoZGF0ZSA8PSBlbmQpIHtcclxuICAgIHJldCA9IGZuLmNhbGwoZm4sIGRhdGUsIGkpO1xyXG4gICAgLy8gQWxsb3cgZm4gdG8gY2FuY2VsIHRoZSBsb29wIHdpdGggc3RyaWN0ICdmYWxzZSdcclxuICAgIGlmIChyZXQgPT09IGZhbHNlKVxyXG4gICAgICBicmVhaztcclxuICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDEpO1xyXG4gICAgaSsrO1xyXG4gIH1cclxufVxyXG5cclxuLyoqIFZlcnkgc2ltcGxlIGN1c3RvbS1mb3JtYXQgZnVuY3Rpb24gdG8gYWxsb3cgXHJcbmwxMG4gb2YgdGV4dHMuXHJcbkNvdmVyIGNhc2VzOlxyXG4tIE0gZm9yIG1vbnRoXHJcbi0gRCBmb3IgZGF5XHJcbioqL1xyXG5mdW5jdGlvbiBmb3JtYXREYXRlKGRhdGUsIGZvcm1hdCkge1xyXG4gIHZhciBzID0gZm9ybWF0LFxyXG4gICAgICBNID0gZGF0ZS5nZXRNb250aCgpICsgMSxcclxuICAgICAgRCA9IGRhdGUuZ2V0RGF0ZSgpO1xyXG4gIHMgPSBzLnJlcGxhY2UoL00vZywgTSk7XHJcbiAgcyA9IHMucmVwbGFjZSgvRC9nLCBEKTtcclxuICByZXR1cm4gcztcclxufVxyXG5cclxuLyoqXHJcbiAgV2Vla2x5IGNhbGVuZGFyLCBpbmhlcml0cyBmcm9tIExjV2lkZ2V0XHJcbioqL1xyXG52YXIgV2Vla2x5ID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiB3ZWVrbHlDbGFzc2VzLFxyXG50ZXh0czogd2Vla2x5VGV4dHMsXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcblxyXG4vLyBPdXIgJ3ZpZXcnIHdpbGwgYmUgYSBzdWJzZXQgb2YgdGhlIGRhdGEsXHJcbi8vIGRlbGltaXRlZCBieSB0aGUgbmV4dCBwcm9wZXJ0eSwgYSBkYXRlcyByYW5nZTpcclxuZGF0ZXNSYW5nZTogeyBzdGFydDogbnVsbCwgZW5kOiBudWxsIH0sXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YVdlZWtseShkYXRlc1JhbmdlKSB7XHJcbiAgdGhpcy5kYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSA9IGRhdGVzUmFuZ2UgfHwgdGhpcy5kYXRlc1JhbmdlO1xyXG4gIHZhciBcclxuICAgICAgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyksXHJcbiAgICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgY2hlY2tDdXJyZW50V2Vlayh0aGlzLiRlbCwgZGF0ZXNSYW5nZS5zdGFydCwgdGhpcyk7XHJcblxyXG4gIHVwZGF0ZUxhYmVscyhkYXRlc1JhbmdlLCB0aGlzLiRlbCwgdGhpcyk7XHJcblxyXG4gIC8vIFJlbW92ZSBhbnkgcHJldmlvdXMgc3RhdHVzIGNsYXNzIGZyb20gYWxsIHNsb3RzXHJcbiAgZm9yICh2YXIgcyA9IDA7IHMgPCBzdGF0dXNUeXBlcy5sZW5ndGg7IHMrKykge1xyXG4gICAgc2xvdHMucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyBzdGF0dXNUeXBlc1tzXSB8fCAnXycpO1xyXG4gIH1cclxuXHJcbiAgLy8gU2V0IGFsbCBzbG90cyB3aXRoIGRlZmF1bHQgc3RhdHVzXHJcbiAgc2xvdHMuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGlzLmRhdGEuZGVmYXVsdFN0YXR1cyk7XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgZWFjaERhdGVJblJhbmdlKGRhdGVzUmFuZ2Uuc3RhcnQsIGRhdGVzUmFuZ2UuZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgdmFyIGRhdGVrZXkgPSBkYXRlSVNPLmRhdGVMb2NhbChkYXRlLCB0cnVlKTtcclxuICAgIHZhciBkYXRlU2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbZGF0ZWtleV07XHJcbiAgICBpZiAoZGF0ZVNsb3RzKSB7XHJcbiAgICAgIGZvciAocyA9IDA7IHMgPCBkYXRlU2xvdHMubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICB2YXIgc2xvdCA9IGRhdGVTbG90c1tzXTtcclxuICAgICAgICB2YXIgc2xvdENlbGwgPSBmaW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgaSwgc2xvdCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGRlZmF1bHQgc3RhdHVzXHJcbiAgICAgICAgc2xvdENlbGwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cyB8fCAnXycpO1xyXG4gICAgICAgIC8vIEFkZGluZyBzdGF0dXMgY2xhc3NcclxuICAgICAgICBzbG90Q2VsbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIFdlZWtseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB0aGlzLnVzZXIgPSB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICd3ZWVrbHknXHJcbiAgfTtcclxuXHJcbiAgLy8gU3RhcnQgZmV0Y2hpbmcgY3VycmVudCB3ZWVrXHJcbiAgdmFyIGZpcnN0RGF0ZXMgPSBjdXJyZW50V2VlaygpO1xyXG4gIHZhciByZXF1ZXN0ID0gdGhpcy5mZXRjaERhdGEoZGF0ZXNUb1F1ZXJ5KGZpcnN0RGF0ZXMpKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoZmlyc3REYXRlcyk7XHJcbiAgICAvLyBQcmVmZXRjaGluZyAzIHdlZWtzIGluIGFkdmFuY2VcclxuICAgIHZhciB0aHJlZVdlZWtzID0gZGF0ZXNUb1F1ZXJ5KGFkZERheXMoZmlyc3REYXRlcy5zdGFydCwgNyksIGFkZERheXMoZmlyc3REYXRlcy5lbmQsIDIxKSk7XHJcbiAgICByZXF1ZXN0ID0gdGhhdC5mZXRjaERhdGEodGhyZWVXZWVrcywgbnVsbCwgdHJ1ZSk7XHJcbiAgfSk7XHJcbiAgY2hlY2tDdXJyZW50V2Vlayh0aGlzLiRlbCwgZmlyc3REYXRlcy5zdGFydCwgdGhpcyk7XHJcblxyXG4gIC8vIFNldCBoYW5kbGVycyBmb3IgcHJldi1uZXh0IGFjdGlvbnM6XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnByZXZBY3Rpb24sIGZ1bmN0aW9uIHByZXYoKSB7XHJcbiAgICBtb3ZlQmluZFJhbmdlSW5EYXlzKHRoYXQsIC03KTtcclxuICB9KTtcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMubmV4dEFjdGlvbiwgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgIG1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgNyk7XHJcbiAgfSk7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldlZWtseS5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdlZWtseS5wcm90b3R5cGUuY2xhc3Nlcy53ZWVrbHlDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdlZWtseSh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG4vKipcclxuICBXb3JrIGhvdXJzIHByaXZhdGUgdXRpbHNcclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwRWRpdFdvcmtIb3VycygpIHtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgLy8gU2V0IGhhbmRsZXJzIHRvIHN3aXRjaCBzdGF0dXMgYW5kIHVwZGF0ZSBiYWNrZW5kIGRhdGFcclxuICAvLyB3aGVuIHRoZSB1c2VyIHNlbGVjdCBjZWxsc1xyXG4gIHZhciBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKTtcclxuICBmdW5jdGlvbiB0b2dnbGVDZWxsKGNlbGwpIHtcclxuICAgIC8vIEZpbmQgZGF5IGFuZCB0aW1lIG9mIHRoZSBjZWxsOlxyXG4gICAgdmFyIHNsb3QgPSBmaW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCk7XHJcbiAgICAvLyBHZXQgd2Vlay1kYXkgc2xvdHMgYXJyYXk6XHJcbiAgICB2YXIgd2tzbG90cyA9IHRoYXQuZGF0YS5zbG90c1tzeXN0ZW1XZWVrRGF5c1tzbG90LmRheV1dID0gdGhhdC5kYXRhLnNsb3RzW3N5c3RlbVdlZWtEYXlzW3Nsb3QuZGF5XV0gfHwgW107XHJcbiAgICAvLyBJZiBpdCBoYXMgYWxyZWFkeSB0aGUgZGF0YS5zdGF0dXMsIHRvZ2dsZSB0byB0aGUgZGVmYXVsdFN0YXR1c1xyXG4gICAgLy8gIHZhciBzdGF0dXNDbGFzcyA9IHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyxcclxuICAgIC8vICAgICAgZGVmYXVsdFN0YXR1c0NsYXNzID0gdGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cztcclxuICAgIC8vaWYgKGNlbGwuaGFzQ2xhc3Moc3RhdHVzQ2xhc3NcclxuICAgIC8vIFRvZ2dsZSBmcm9tIHRoZSBhcnJheVxyXG4gICAgdmFyIHN0cnNsb3QgPSBkYXRlSVNPLnRpbWVMb2NhbChzbG90LnNsb3QsIHRydWUpLFxyXG4gICAgICBpc2xvdCA9IHdrc2xvdHMuaW5kZXhPZihzdHJzbG90KTtcclxuICAgIGlmIChpc2xvdCA9PSAtMSlcclxuICAgICAgd2tzbG90cy5wdXNoKHN0cnNsb3QpO1xyXG4gICAgZWxzZVxyXG4gICAgLy9kZWxldGUgd2tzbG90c1tpc2xvdF07XHJcbiAgICAgIHdrc2xvdHMuc3BsaWNlKGlzbG90LCAxKTtcclxuICB9XHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2VsbFJhbmdlKGZpcnN0Q2VsbCwgbGFzdENlbGwpIHtcclxuICAgIHZhciBcclxuICAgICAgeCA9IGZpcnN0Q2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgoZmlyc3RDZWxsKSxcclxuICAgICAgeTEgPSBmaXJzdENlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpLFxyXG4gICAgLy94MiA9IGxhc3RDZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChsYXN0Q2VsbCksXHJcbiAgICAgIHkyID0gbGFzdENlbGwuY2xvc2VzdCgndHInKS5pbmRleCgpO1xyXG5cclxuICAgIGlmICh5MSA+IHkyKSB7XHJcbiAgICAgIHZhciB5MCA9IHkxO1xyXG4gICAgICB5MSA9IHkyO1xyXG4gICAgICB5MiA9IHkwO1xyXG4gICAgfVxyXG5cclxuICAgIHRvZ2dsZUNlbGwoZmlyc3RDZWxsKTtcclxuICAgIGZvciAodmFyIHkgPSB5MSArIDE7IHkgPCB5MjsgeSsrKSB7XHJcbiAgICAgIHZhciBjZWxsID0gZmlyc3RDZWxsLmNsb3Nlc3QoJ3Rib2R5JykuY2hpbGRyZW4oJ3RyOmVxKCcgKyB5ICsgJyknKS5jaGlsZHJlbigndGQ6ZXEoJyArIHggKyAnKScpO1xyXG4gICAgICB0b2dnbGVDZWxsKGNlbGwpO1xyXG4gICAgfVxyXG4gICAgdG9nZ2xlQ2VsbChsYXN0Q2VsbCk7XHJcbiAgfVxyXG5cclxuICB0aGlzLiRlbC5maW5kKHNsb3RzQ29udGFpbmVyKS5vbignY2xpY2snLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB0b2dnbGVDZWxsKCQodGhpcykpO1xyXG4gICAgdGhhdC5iaW5kRGF0YSgpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICB2YXIgZHJhZ2dpbmcgPSB7XHJcbiAgICBmaXJzdDogbnVsbCxcclxuICAgIGxhc3Q6IG51bGwsXHJcbiAgICBzZWxlY3Rpb25MYXllcjogJCgnPGRpdiBjbGFzcz1cIlNlbGVjdGlvbkxheWVyXCIgLz4nKS5hcHBlbmRUbyh0aGlzLiRlbClcclxuICB9O1xyXG4gIGZ1bmN0aW9uIG9mZnNldFRvUG9zaXRpb24oZWwsIG9mZnNldCkge1xyXG4gICAgdmFyIHBiID0gJChlbC5vZmZzZXRQYXJlbnQpLmJvdW5kcygpLFxyXG4gICAgICBzID0ge307XHJcblxyXG4gICAgcy50b3AgPSBvZmZzZXQudG9wIC0gcGIudG9wO1xyXG4gICAgcy5sZWZ0ID0gb2Zmc2V0LmxlZnQgLSBwYi5sZWZ0O1xyXG5cclxuICAgIC8vcy5ib3R0b20gPSBwYi50b3AgLSBvZmZzZXQuYm90dG9tO1xyXG4gICAgLy9zLnJpZ2h0ID0gb2Zmc2V0LmxlZnQgLSBvZmZzZXQucmlnaHQ7XHJcbiAgICBzLmhlaWdodCA9IG9mZnNldC5ib3R0b20gLSBvZmZzZXQudG9wO1xyXG4gICAgcy53aWR0aCA9IG9mZnNldC5yaWdodCAtIG9mZnNldC5sZWZ0O1xyXG5cclxuICAgICQoZWwpLmNzcyhzKTtcclxuICAgIHJldHVybiBzO1xyXG4gIH1cclxuICBmdW5jdGlvbiB1cGRhdGVTZWxlY3Rpb24oZWwpIHtcclxuICAgIHZhciBhID0gZHJhZ2dpbmcuZmlyc3QuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIHZhciBiID0gZWwuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIHZhciBzID0gZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuXHJcbiAgICBzLnRvcCA9IGEudG9wIDwgYi50b3AgPyBhLnRvcCA6IGIudG9wO1xyXG4gICAgcy5ib3R0b20gPSBhLmJvdHRvbSA+IGIuYm90dG9tID8gYS5ib3R0b20gOiBiLmJvdHRvbTtcclxuXHJcbiAgICBvZmZzZXRUb1Bvc2l0aW9uKGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyWzBdLCBzKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZpbmlzaERyYWcoKSB7XHJcbiAgICBpZiAoZHJhZ2dpbmcuZmlyc3QgJiYgZHJhZ2dpbmcubGFzdCkge1xyXG5cclxuICAgICAgdG9nZ2xlQ2VsbFJhbmdlKGRyYWdnaW5nLmZpcnN0LCBkcmFnZ2luZy5sYXN0KTtcclxuXHJcbiAgICAgIHRoYXQuYmluZERhdGEoKTtcclxuXHJcbiAgICAgIGRyYWdnaW5nLmZpcnN0ID0gZHJhZ2dpbmcubGFzdCA9IG51bGw7XHJcbiAgICB9XHJcbiAgICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5oaWRlKCk7XHJcbiAgfVxyXG5cclxuICB0aGlzLiRlbC5maW5kKHNsb3RzQ29udGFpbmVyKVxyXG4gIC5vbignbW91c2Vkb3duJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgZHJhZ2dpbmcuZmlyc3QgPSAkKHRoaXMpO1xyXG4gICAgZHJhZ2dpbmcubGFzdCA9IG51bGw7XHJcbiAgICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5zaG93KCk7XHJcblxyXG4gICAgdmFyIHMgPSBkcmFnZ2luZy5maXJzdC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgLy9jb25zb2xlLmxvZygnZmlyc3QgYm91bmRzJywgcyk7XHJcbiAgICBvZmZzZXRUb1Bvc2l0aW9uKGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyWzBdLCBzKTtcclxuXHJcbiAgICAvL2NvbnNvbGUubG9nKCdtb3VzZWRvd24nLCBkcmFnZ2luZyk7XHJcbiAgfSlcclxuICAub24oJ21vdXNlZW50ZXInLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoZHJhZ2dpbmcuZmlyc3QpIHtcclxuICAgICAgZHJhZ2dpbmcubGFzdCA9ICQodGhpcyk7XHJcblxyXG4gICAgICB1cGRhdGVTZWxlY3Rpb24oZHJhZ2dpbmcubGFzdCk7XHJcblxyXG4gICAgICAvL2NvbnNvbGUubG9nKCdtb3VzZWVudGVyJywgZHJhZ2dpbmcpO1xyXG4gICAgfVxyXG4gIH0pXHJcbiAgLm9uKCdtb3VzZXVwJywgZmluaXNoRHJhZylcclxuICAuZmluZCgndGQnKVxyXG4gIC5hdHRyKCdkcmFnZ2FibGUnLCB0cnVlKTtcclxuICAvLyBUaGlzIHdpbGwgbm90IHdvcmsgd2l0aCBwb2ludGVyLWV2ZW50czpub25lLCBidXQgb24gb3RoZXJcclxuICAvLyBjYXNlcyAocmVjZW50SUUpXHJcbiAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIub24oJ21vdXNldXAnLCBmaW5pc2hEcmFnKVxyXG4gIC5hdHRyKCdkcmFnZ2FibGUnLCB0cnVlKTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBXb3JrIGhvdXJzIGNhbGVuZGFyLCBpbmhlcml0cyBmcm9tIExjV2lkZ2V0XHJcbioqL1xyXG52YXIgV29ya0hvdXJzID0gTGNXaWRnZXQuZXh0ZW5kKFxyXG4vLyBQcm90b3R5cGVcclxue1xyXG5jbGFzc2VzOiBleHRlbmQoe30sIHdlZWtseUNsYXNzZXMsIHtcclxuICB3ZWVrbHlDYWxlbmRhcjogdW5kZWZpbmVkLFxyXG4gIHdvcmtIb3Vyc0NhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItLXdvcmtIb3VycydcclxufSksXHJcbnRleHRzOiB3ZWVrbHlUZXh0cyxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhV29ya0hvdXJzKCkge1xyXG4gIHZhciBcclxuICAgIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpLFxyXG4gICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgc3RhdHVzVHlwZXNbc10gfHwgJ18nKTtcclxuICB9XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgZm9yICh2YXIgd2sgPSAwOyB3ayA8IHN5c3RlbVdlZWtEYXlzLmxlbmd0aDsgd2srKykge1xyXG4gICAgdmFyIGRhdGVTbG90cyA9IHRoYXQuZGF0YS5zbG90c1tzeXN0ZW1XZWVrRGF5c1t3a11dO1xyXG4gICAgaWYgKGRhdGVTbG90cyAmJiBkYXRlU2xvdHMubGVuZ3RoKSB7XHJcbiAgICAgIGZvciAocyA9IDA7IHMgPCBkYXRlU2xvdHMubGVuZ3RoOyBzKyspIHtcclxuICAgICAgICB2YXIgc2xvdCA9IGRhdGVTbG90c1tzXTtcclxuICAgICAgICB2YXIgc2xvdENlbGwgPSBmaW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgd2ssIHNsb3QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkZWZhdWx0IHN0YXR1c1xyXG4gICAgICAgIHNsb3RDZWxsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ18nKTtcclxuICAgICAgICAvLyBBZGRpbmcgc3RhdHVzIGNsYXNzXHJcbiAgICAgICAgc2xvdENlbGwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gV29ya0hvdXJzKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICBMY1dpZGdldC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdGhpcy51c2VyID0gdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG5cclxuICB0aGlzLnF1ZXJ5ID0ge1xyXG4gICAgdXNlcjogdGhpcy51c2VyLFxyXG4gICAgdHlwZTogJ3dvcmtIb3VycydcclxuICB9O1xyXG5cclxuICAvLyBGZXRjaCB0aGUgZGF0YTogdGhlcmUgaXMgbm90IGEgbW9yZSBzcGVjaWZpYyBxdWVyeSxcclxuICAvLyBpdCBqdXN0IGdldCB0aGUgaG91cnMgZm9yIGVhY2ggd2Vlay1kYXkgKGRhdGFcclxuICAvLyBzbG90cyBhcmUgcGVyIHdlZWstZGF5IGluc3RlYWQgb2YgcGVyIGRhdGUgY29tcGFyZWRcclxuICAvLyB0byAqd2Vla2x5KilcclxuICB0aGlzLmZldGNoRGF0YSgpLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC5iaW5kRGF0YSgpO1xyXG4gIH0pO1xyXG5cclxuICBzZXR1cEVkaXRXb3JrSG91cnMuY2FsbCh0aGlzKTtcclxuXHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXb3JraG91cnMgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuV29ya0hvdXJzLmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgV29ya0hvdXJzLnByb3RvdHlwZS5jbGFzc2VzLndvcmtIb3Vyc0NhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgV29ya0hvdXJzKHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcblxyXG4vKipcclxuICAgUHVibGljIEFQSTpcclxuKiovXHJcbmV4cG9ydHMuV2Vla2x5ID0gV2Vla2x5O1xyXG5leHBvcnRzLldvcmtIb3VycyA9IFdvcmtIb3VyczsiLCIvKiBHZW5lcmljIGJsb2NrVUkgb3B0aW9ucyBzZXRzICovXHJcbnZhciBsb2FkaW5nQmxvY2sgPSB7IG1lc3NhZ2U6ICc8aW1nIHdpZHRoPVwiNDhweFwiIGhlaWdodD1cIjQ4cHhcIiBjbGFzcz1cImxvYWRpbmctaW5kaWNhdG9yXCIgc3JjPVwiJyArIExjVXJsLkFwcFBhdGggKyAnaW1nL3RoZW1lL2xvYWRpbmcuZ2lmXCIvPicgfTtcclxudmFyIGVycm9yQmxvY2sgPSBmdW5jdGlvbiAoZXJyb3IsIHJlbG9hZCwgc3R5bGUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3NzOiAkLmV4dGVuZCh7IGN1cnNvcjogJ2RlZmF1bHQnIH0sIHN0eWxlIHx8IHt9KSxcclxuICAgICAgICBtZXNzYWdlOiAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPjxkaXYgY2xhc3M9XCJpbmZvXCI+VGhlcmUgd2FzIGFuIGVycm9yJyArXHJcbiAgICAgICAgICAgIChlcnJvciA/ICc6ICcgKyBlcnJvciA6ICcnKSArXHJcbiAgICAgICAgICAgIChyZWxvYWQgPyAnIDxhIGhyZWY9XCJqYXZhc2NyaXB0OiAnICsgcmVsb2FkICsgJztcIj5DbGljayB0byByZWxvYWQ8L2E+JyA6ICcnKSArXHJcbiAgICAgICAgICAgICc8L2Rpdj4nXHJcbiAgICB9O1xyXG59O1xyXG52YXIgaW5mb0Jsb2NrID0gZnVuY3Rpb24gKG1lc3NhZ2UsIG9wdGlvbnMpIHtcclxuICAgIHJldHVybiAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWVzc2FnZTogJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT48ZGl2IGNsYXNzPVwiaW5mb1wiPicgKyBtZXNzYWdlICsgJzwvZGl2PidcclxuICAgICAgICAvKixjc3M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfSovXHJcbiAgICAgICAgLCBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH1cclxuICAgIH0sIG9wdGlvbnMpO1xyXG59O1xyXG5cclxuLy8gTW9kdWxlOlxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGxvYWRpbmc6IGxvYWRpbmdCbG9jayxcclxuICAgICAgICBlcnJvcjogZXJyb3JCbG9jayxcclxuICAgICAgICBpbmZvOiBpbmZvQmxvY2tcclxuICAgIH07XHJcbn0iLCIvKj0gQ2hhbmdlc05vdGlmaWNhdGlvbiBjbGFzc1xyXG4qIHRvIG5vdGlmeSB1c2VyIGFib3V0IGNoYW5nZXMgaW4gZm9ybXMsXHJcbiogdGFicywgdGhhdCB3aWxsIGJlIGxvc3QgaWYgZ28gYXdheSBmcm9tXHJcbiogdGhlIHBhZ2UuIEl0IGtub3dzIHdoZW4gYSBmb3JtIGlzIHN1Ym1pdHRlZFxyXG4qIGFuZCBzYXZlZCB0byBkaXNhYmxlIG5vdGlmaWNhdGlvbiwgYW5kIGdpdmVzXHJcbiogbWV0aG9kcyBmb3Igb3RoZXIgc2NyaXB0cyB0byBub3RpZnkgY2hhbmdlc1xyXG4qIG9yIHNhdmluZy5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGdldFhQYXRoID0gcmVxdWlyZSgnLi9nZXRYUGF0aCcpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSB7XHJcbiAgICBjaGFuZ2VzTGlzdDoge30sXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICAgIHRhcmdldDogbnVsbCxcclxuICAgICAgICBnZW5lcmljQ2hhbmdlU3VwcG9ydDogdHJ1ZSxcclxuICAgICAgICBnZW5lcmljU3VibWl0U3VwcG9ydDogZmFsc2UsXHJcbiAgICAgICAgY2hhbmdlZEZvcm1DbGFzczogJ2hhcy1jaGFuZ2VzJyxcclxuICAgICAgICBjaGFuZ2VkRWxlbWVudENsYXNzOiAnY2hhbmdlZCcsXHJcbiAgICAgICAgbm90aWZ5Q2xhc3M6ICdub3RpZnktY2hhbmdlcydcclxuICAgIH0sXHJcbiAgICBpbml0OiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgIC8vIFVzZXIgbm90aWZpY2F0aW9uIHRvIHByZXZlbnQgbG9zdCBjaGFuZ2VzIGRvbmVcclxuICAgICAgICAkKHdpbmRvdykub24oJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNoYW5nZXNOb3RpZmljYXRpb24ubm90aWZ5KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRoaXMuZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG4gICAgICAgIGlmICghb3B0aW9ucy50YXJnZXQpXHJcbiAgICAgICAgICAgIG9wdGlvbnMudGFyZ2V0ID0gZG9jdW1lbnQ7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY0NoYW5nZVN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdjaGFuZ2UnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKSA6aW5wdXRbbmFtZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKCQodGhpcykuY2xvc2VzdCgnZm9ybScpLmdldCgwKSwgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNTdWJtaXRTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignc3VibWl0JywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCknLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZSh0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgbm90aWZ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gQWRkIG5vdGlmaWNhdGlvbiBjbGFzcyB0byB0aGUgZG9jdW1lbnRcclxuICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5ub3RpZnlDbGFzcyk7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBjaGFuZ2UgaW4gdGhlIHByb3BlcnR5IGxpc3QgcmV0dXJuaW5nIHRoZSBtZXNzYWdlOlxyXG4gICAgICAgIGZvciAodmFyIGMgaW4gdGhpcy5jaGFuZ2VzTGlzdClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVpdE1lc3NhZ2UgfHwgKHRoaXMucXVpdE1lc3NhZ2UgPSAkKCcjbGNyZXMtcXVpdC13aXRob3V0LXNhdmUnKS50ZXh0KCkpIHx8ICcnO1xyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyQ2hhbmdlOiBmdW5jdGlvbiAoZiwgZSkge1xyXG4gICAgICAgIGlmICghZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBmbmFtZSA9IGdldFhQYXRoKGYpO1xyXG4gICAgICAgIHZhciBmbCA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gfHwgW107XHJcbiAgICAgICAgaWYgKCQuaXNBcnJheShlKSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGUubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQ2hhbmdlKGYsIGVbaV0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBuID0gZTtcclxuICAgICAgICBpZiAodHlwZW9mIChlKSAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgbiA9IGUubmFtZTtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcmVhbGx5IHRoZXJlIHdhcyBhIGNoYW5nZSBjaGVja2luZyBkZWZhdWx0IGVsZW1lbnQgdmFsdWVcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZS5kZWZhdWx0VmFsdWUpICE9ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuY2hlY2tlZCkgPT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5zZWxlY3RlZCkgPT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIGUudmFsdWUgPT0gZS5kZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZXJlIHdhcyBubyBjaGFuZ2UsIG5vIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAvLyBhbmQgbWF5YmUgaXMgYSByZWdyZXNzaW9uIGZyb20gYSBjaGFuZ2UgYW5kIG5vdyB0aGUgb3JpZ2luYWwgdmFsdWUgYWdhaW5cclxuICAgICAgICAgICAgICAgIC8vIHRyeSB0byByZW1vdmUgZnJvbSBjaGFuZ2VzIGxpc3QgZG9pbmcgcmVnaXN0ZXJTYXZlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyU2F2ZShmLCBbbl0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQoZSkuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRWxlbWVudENsYXNzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCEobiBpbiBmbCkpXHJcbiAgICAgICAgICAgIGZsLnB1c2gobik7XHJcbiAgICAgICAgJChmKVxyXG4gICAgICAgIC5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRGb3JtQ2xhc3MpXHJcbiAgICAgICAgLy8gcGFzcyBkYXRhOiBmb3JtLCBlbGVtZW50IG5hbWUgY2hhbmdlZCwgZm9ybSBlbGVtZW50IGNoYW5nZWQgKHRoaXMgY2FuIGJlIG51bGwpXHJcbiAgICAgICAgLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBbZiwgbiwgZV0pO1xyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyU2F2ZTogZnVuY3Rpb24gKGYsIGVscykge1xyXG4gICAgICAgIHZhciBmbmFtZSA9IGdldFhQYXRoKGYpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pIHJldHVybjtcclxuICAgICAgICB2YXIgcHJldkVscyA9ICQuZXh0ZW5kKFtdLCB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSk7XHJcbiAgICAgICAgdmFyIHIgPSB0cnVlO1xyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSAkLmdyZXAodGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0sIGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gKCQuaW5BcnJheShlbCwgZWxzKSA9PSAtMSk7IH0pO1xyXG4gICAgICAgICAgICAvLyBEb24ndCByZW1vdmUgJ2YnIGxpc3QgaWYgaXMgbm90IGVtcHR5XHJcbiAgICAgICAgICAgIHIgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXS5sZW5ndGggPT09IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyKSB7XHJcbiAgICAgICAgICAgICQoZikucmVtb3ZlQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdO1xyXG4gICAgICAgICAgICAvLyBsaW5rIGVsZW1lbnRzIGZyb20gZWxzIHRvIGNsZWFuLXVwIGl0cyBjbGFzc2VzXHJcbiAgICAgICAgICAgIGVscyA9IHByZXZFbHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudHMgcmVnaXN0ZXJlZCBhcyBzYXZlICh0aGlzIGNhbiBiZSBudWxsKSwgYW5kICdmb3JtIGZ1bGx5IHNhdmVkJyBhcyB0aGlyZCBwYXJhbSAoYm9vbClcclxuICAgICAgICAkKGYpLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgW2YsIGVscywgcl0pO1xyXG4gICAgICAgIHZhciBsY2huID0gdGhpcztcclxuICAgICAgICBpZiAoZWxzKSAkLmVhY2goZWxzLCBmdW5jdGlvbiAoKSB7ICQoJ1tuYW1lPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUodGhpcykgKyAnXCJdJykucmVtb3ZlQ2xhc3MobGNobi5kZWZhdWx0cy5jaGFuZ2VkRWxlbWVudENsYXNzKTsgfSk7XHJcbiAgICAgICAgcmV0dXJuIHByZXZFbHM7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGNoYW5nZXNOb3RpZmljYXRpb247XHJcbn0iLCIvKiBVdGlsaXR5IHRvIGNyZWF0ZSBpZnJhbWUgd2l0aCBpbmplY3RlZCBodG1sL2NvbnRlbnQgaW5zdGVhZCBvZiBVUkwuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUlmcmFtZShjb250ZW50LCBzaXplKSB7XHJcbiAgICB2YXIgJGlmcmFtZSA9ICQoJzxpZnJhbWUgd2lkdGg9XCInICsgc2l6ZS53aWR0aCArICdcIiBoZWlnaHQ9XCInICsgc2l6ZS5oZWlnaHQgKyAnXCIgc3R5bGU9XCJib3JkZXI6bm9uZTtcIj48L2lmcmFtZT4nKTtcclxuICAgIHZhciBpZnJhbWUgPSAkaWZyYW1lLmdldCgwKTtcclxuICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBpcyByZWFkeVxyXG4gICAgdmFyIGlmcmFtZWxvYWRlZCA9IGZhbHNlO1xyXG4gICAgaWZyYW1lLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBVc2luZyBpZnJhbWVsb2FkZWQgdG8gYXZvaWQgaW5maW5pdGUgbG9vcHNcclxuICAgICAgICBpZiAoIWlmcmFtZWxvYWRlZCkge1xyXG4gICAgICAgICAgICBpZnJhbWVsb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgY29udGVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiAkaWZyYW1lO1xyXG59O1xyXG5cclxuLyogUHV0cyBmdWxsIGh0bWwgaW5zaWRlIHRoZSBpZnJhbWUgZWxlbWVudCBwYXNzZWQgaW4gYSBzZWN1cmUgYW5kIGNvbXBsaWFudCBtb2RlICovXHJcbmZ1bmN0aW9uIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBodG1sKSB7XHJcbiAgICAvLyBwdXQgYWpheCBkYXRhIGluc2lkZSBpZnJhbWUgcmVwbGFjaW5nIGFsbCB0aGVpciBodG1sIGluIHNlY3VyZSBcclxuICAgIC8vIGNvbXBsaWFudCBtb2RlICgkLmh0bWwgZG9uJ3Qgd29ya3MgdG8gaW5qZWN0IDxodG1sPjxoZWFkPiBjb250ZW50KVxyXG5cclxuICAgIC8qIGRvY3VtZW50IEFQSSB2ZXJzaW9uIChwcm9ibGVtcyB3aXRoIElFLCBkb24ndCBleGVjdXRlIGlmcmFtZS1odG1sIHNjcmlwdHMpICovXHJcbiAgICAvKnZhciBpZnJhbWVEb2MgPVxyXG4gICAgLy8gVzNDIGNvbXBsaWFudDogbnMsIGZpcmVmb3gtZ2Vja28sIGNocm9tZS9zYWZhcmktd2Via2l0LCBvcGVyYSwgaWU5XHJcbiAgICBpZnJhbWUuY29udGVudERvY3VtZW50IHx8XHJcbiAgICAvLyBvbGQgSUUgKDUuNSspXHJcbiAgICAoaWZyYW1lLmNvbnRlbnRXaW5kb3cgPyBpZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudCA6IG51bGwpIHx8XHJcbiAgICAvLyBmYWxsYmFjayAodmVyeSBvbGQgSUU/KVxyXG4gICAgZG9jdW1lbnQuZnJhbWVzW2lmcmFtZS5pZF0uZG9jdW1lbnQ7XHJcbiAgICBpZnJhbWVEb2Mub3BlbigpO1xyXG4gICAgaWZyYW1lRG9jLndyaXRlKGh0bWwpO1xyXG4gICAgaWZyYW1lRG9jLmNsb3NlKCk7Ki9cclxuXHJcbiAgICAvKiBqYXZhc2NyaXB0IFVSSSB2ZXJzaW9uICh3b3JrcyBmaW5lIGV2ZXJ5d2hlcmUhKSAqL1xyXG4gICAgaWZyYW1lLmNvbnRlbnRXaW5kb3cuY29udGVudHMgPSBodG1sO1xyXG4gICAgaWZyYW1lLnNyYyA9ICdqYXZhc2NyaXB0OndpbmRvd1tcImNvbnRlbnRzXCJdJztcclxuXHJcbiAgICAvLyBBYm91dCB0aGlzIHRlY2huaXF1ZSwgdGhpcyBodHRwOi8vc3BhcmVjeWNsZXMud29yZHByZXNzLmNvbS8yMDEyLzAzLzA4L2luamVjdC1jb250ZW50LWludG8tYS1uZXctaWZyYW1lL1xyXG59XHJcblxyXG4iLCIvKiBDUlVETCBIZWxwZXIgKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG52YXIgZ2V0VGV4dCA9IHJlcXVpcmUoJy4vZ2V0VGV4dCcpO1xyXG5cclxuZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MgPSB7XHJcbiAgZWZmZWN0czoge1xyXG4gICAgJ3Nob3ctdmlld2VyJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sXHJcbiAgICAnaGlkZS12aWV3ZXInOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSxcclxuICAgICdzaG93LWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LCAvLyB0aGUgc2FtZSBhcyBqcXVlcnktdWkgeyBlZmZlY3Q6ICdzbGlkZScsIGR1cmF0aW9uOiAnc2xvdycsIGRpcmVjdGlvbjogJ2Rvd24nIH1cclxuICAgICdoaWRlLWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9XHJcbiAgfSxcclxuICBldmVudHM6IHtcclxuICAgICdlZGl0LWVuZHMnOiAnY3J1ZGwtZWRpdC1lbmRzJyxcclxuICAgICdlZGl0LXN0YXJ0cyc6ICdjcnVkbC1lZGl0LXN0YXJ0cycsXHJcbiAgICAnZWRpdG9yLXJlYWR5JzogJ2NydWRsLWVkaXRvci1yZWFkeScsXHJcbiAgICAnZWRpdG9yLXNob3dlZCc6ICdjcnVkbC1lZGl0b3Itc2hvd2VkJyxcclxuICAgICdjcmVhdGUnOiAnY3J1ZGwtY3JlYXRlJyxcclxuICAgICd1cGRhdGUnOiAnY3J1ZGwtdXBkYXRlJyxcclxuICAgICdkZWxldGUnOiAnY3J1ZGwtZGVsZXRlJ1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiBzZXR1cENydWRsKG9uU3VjY2Vzcywgb25FcnJvciwgb25Db21wbGV0ZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICBvbjogZnVuY3Rpb24gb24oc2VsZWN0b3IsIHNldHRpbmdzKSB7XHJcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgJy5jcnVkbCc7XHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IHtcclxuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXHJcbiAgICAgICAgZWxlbWVudHM6ICQoc2VsZWN0b3IpXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIEV4dGVuZGluZyBkZWZhdWx0IHNldHRpbmdzIHdpdGggcHJvdmlkZWQgb25lcyxcclxuICAgICAgLy8gYnV0IHNvbWUgY2FuIGJlIHR3ZWFrIG91dHNpZGUgdG9vLlxyXG4gICAgICBpbnN0YW5jZS5zZXR0aW5ncyA9ICQuZXh0ZW5kKHRydWUsIGV4cG9ydHMuZGVmYXVsdFNldHRpbmdzLCBzZXR0aW5ncyk7XHJcblxyXG4gICAgICBpbnN0YW5jZS5lbGVtZW50cy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3J1ZGwgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmIChjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nKSA9PT0gdHJ1ZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBkY3R4ID0gY3J1ZGwuZGF0YSgnY3J1ZGwtY29udGV4dCcpIHx8ICcnO1xyXG4gICAgICAgIHZhciB2d3IgPSBjcnVkbC5maW5kKCcuY3J1ZGwtdmlld2VyJyk7XHJcbiAgICAgICAgdmFyIGR0ciA9IGNydWRsLmZpbmQoJy5jcnVkbC1lZGl0b3InKTtcclxuICAgICAgICB2YXIgaWlkcGFyID0gY3J1ZGwuZGF0YSgnY3J1ZGwtaXRlbS1pZC1wYXJhbWV0ZXInKSB8fCAnSXRlbUlEJztcclxuICAgICAgICB2YXIgZm9ybXBhcnMgPSB7IGFjdGlvbjogJ2NyZWF0ZScgfTtcclxuICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gMDtcclxuICAgICAgICB2YXIgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRFeHRyYVF1ZXJ5KGVsKSB7XHJcbiAgICAgICAgICAvLyBHZXQgZXh0cmEgcXVlcnkgb2YgdGhlIGVsZW1lbnQsIGlmIGFueTpcclxuICAgICAgICAgIHZhciB4cSA9IGVsLmRhdGEoJ2NydWRsLWV4dHJhLXF1ZXJ5JykgfHwgJyc7XHJcbiAgICAgICAgICBpZiAoeHEpIHhxID0gJyYnICsgeHE7XHJcbiAgICAgICAgICAvLyBJdGVyYXRlIGFsbCBwYXJlbnRzIGluY2x1ZGluZyB0aGUgJ2NydWRsJyBlbGVtZW50IChwYXJlbnRzVW50aWwgZXhjbHVkZXMgdGhlIGZpcnN0IGVsZW1lbnQgZ2l2ZW4sXHJcbiAgICAgICAgICAvLyBiZWNhdXNlIG9mIHRoYXQgd2UgZ2V0IGl0cyBwYXJlbnQoKSlcclxuICAgICAgICAgIC8vIEZvciBhbnkgb2YgdGhlbSB3aXRoIGFuIGV4dHJhLXF1ZXJ5LCBhcHBlbmQgaXQ6XHJcbiAgICAgICAgICBlbC5wYXJlbnRzVW50aWwoY3J1ZGwucGFyZW50KCksICdbZGF0YS1jcnVkbC1leHRyYS1xdWVyeV0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHggPSAkKHRoaXMpLmRhdGEoJ2NydWRsLWV4dHJhLXF1ZXJ5Jyk7XHJcbiAgICAgICAgICAgIGlmICh4KSB4cSArPSAnJicgKyB4O1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByZXR1cm4geHE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjcnVkbC5maW5kKCcuY3J1ZGwtY3JlYXRlJykuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IDA7XHJcbiAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAnY3JlYXRlJztcclxuICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICBkdHIucmVsb2FkKHtcclxuICAgICAgICAgICAgdXJsOiBmdW5jdGlvbiAodXJsLCBkZWZhdWx0VXJsKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRVcmwgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgZHRyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctZWRpdG9yJ10pXHJcbiAgICAgICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIFtkdHJdKTtcclxuICAgICAgICAgICAgICAgIGR0ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgLy8gSGlkZSB2aWV3ZXIgd2hlbiBpbiBlZGl0b3I6XHJcbiAgICAgICAgICB2d3IueGhpZGUoaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS12aWV3ZXInXSk7XHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddKVxyXG4gICAgICAgICAgLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzLmNyZWF0ZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2d3JcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC11cGRhdGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGl0ZW0gPSAkdC5jbG9zZXN0KCcuY3J1ZGwtaXRlbScpO1xyXG4gICAgICAgICAgdmFyIGl0ZW1pZCA9IGl0ZW0uZGF0YSgnY3J1ZGwtaXRlbS1pZCcpO1xyXG4gICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IGl0ZW1pZDtcclxuICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICd1cGRhdGUnO1xyXG4gICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuICAgICAgICAgIGR0ci5yZWxvYWQoe1xyXG4gICAgICAgICAgICB1cmw6IGZ1bmN0aW9uICh1cmwsIGRlZmF1bHRVcmwpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdFVybCArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBkdHIueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy1lZGl0b3InXSlcclxuICAgICAgICAgICAgICAucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1zaG93ZWQnXSwgW2R0cl0pO1xyXG4gICAgICAgICAgICAgICAgZHRyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBIaWRlIHZpZXdlciB3aGVuIGluIGVkaXRvcjpcclxuICAgICAgICAgIHZ3ci54aGlkZShpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLXZpZXdlciddKTtcclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10pXHJcbiAgICAgICAgICAudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHMudXBkYXRlKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC1kZWxldGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGl0ZW0gPSAkdC5jbG9zZXN0KCcuY3J1ZGwtaXRlbScpO1xyXG4gICAgICAgICAgdmFyIGl0ZW1pZCA9IGl0ZW0uZGF0YSgnY3J1ZGwtaXRlbS1pZCcpO1xyXG5cclxuICAgICAgICAgIGlmIChjb25maXJtKGdldFRleHQoJ2NvbmZpcm0tZGVsZXRlLWNydWRsLWl0ZW0tbWVzc2FnZTonICsgZGN0eCkpKSB7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJzxkaXY+JyArIGdldFRleHQoJ2RlbGV0ZS1jcnVkbC1pdGVtLWxvYWRpbmctbWVzc2FnZTonICsgZGN0eCkgKyAnPC9kaXY+JywgaXRlbSk7XHJcbiAgICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICdkZWxldGUnO1xyXG4gICAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgIHVybDogZHRyLmF0dHIoJ2RhdGEtc291cmNlLXVybCcpICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cSxcclxuICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCc8ZGl2PicgKyBkYXRhLlJlc3VsdCArICc8L2Rpdj4nLCBpdGVtLCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2FibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmZhZGVPdXQoJ3Nsb3cnLCBmdW5jdGlvbiAoKSB7IGl0ZW0ucmVtb3ZlKCk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgb25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAgICAgICAgICAgICBvbkVycm9yKGp4LCBtZXNzYWdlLCBleCk7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZShpdGVtKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGNvbXBsZXRlOiBvbkNvbXBsZXRlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2RlbGV0ZSddKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZpbmlzaEVkaXQoKSB7XHJcbiAgICAgICAgICBmdW5jdGlvbiBvbmNvbXBsZXRlKGFub3RoZXJPbkNvbXBsZXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgLy8gU2hvdyBhZ2FpbiB0aGUgVmlld2VyXHJcbiAgICAgICAgICAgICAgLy92d3Iuc2xpZGVEb3duKCdzbG93Jyk7XHJcbiAgICAgICAgICAgICAgaWYgKCF2d3IuaXMoJzp2aXNpYmxlJykpXHJcbiAgICAgICAgICAgICAgICB2d3IueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSk7XHJcbiAgICAgICAgICAgICAgLy8gTWFyayB0aGUgZm9ybSBhcyB1bmNoYW5nZWQgdG8gYXZvaWQgcGVyc2lzdGluZyB3YXJuaW5nc1xyXG4gICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGR0ci5maW5kKCdmb3JtJykuZ2V0KDApKTtcclxuICAgICAgICAgICAgICAvLyBBdm9pZCBjYWNoZWQgY29udGVudCBvbiB0aGUgRWRpdG9yXHJcbiAgICAgICAgICAgICAgZHRyLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIHVzZXIgY2FsbGJhY2s6XHJcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoYW5vdGhlck9uQ29tcGxldGUpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgYW5vdGhlck9uQ29tcGxldGUuYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBXZSBuZWVkIGEgY3VzdG9tIGNvbXBsZXRlIGNhbGxiYWNrLCBidXQgdG8gbm90IHJlcGxhY2UgdGhlIHVzZXIgY2FsbGJhY2ssIHdlXHJcbiAgICAgICAgICAvLyBjbG9uZSBmaXJzdCB0aGUgc2V0dGluZ3MgYW5kIHRoZW4gYXBwbHkgb3VyIGNhbGxiYWNrIHRoYXQgaW50ZXJuYWxseSB3aWxsIGNhbGxcclxuICAgICAgICAgIC8vIHRoZSB1c2VyIGNhbGxiYWNrIHByb3Blcmx5IChpZiBhbnkpXHJcbiAgICAgICAgICB2YXIgd2l0aGNhbGxiYWNrID0gJC5leHRlbmQodHJ1ZSwge30sIGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtZWRpdG9yJ10pO1xyXG4gICAgICAgICAgd2l0aGNhbGxiYWNrLmNvbXBsZXRlID0gb25jb21wbGV0ZSh3aXRoY2FsbGJhY2suY29tcGxldGUpO1xyXG4gICAgICAgICAgLy8gSGlkaW5nIGVkaXRvcjpcclxuICAgICAgICAgIGR0ci54aGlkZSh3aXRoY2FsbGJhY2spO1xyXG5cclxuICAgICAgICAgIC8vIE1hcmsgZm9ybSBhcyBzYXZlZCB0byByZW1vdmUgdGhlICdoYXMtY2hhbmdlcycgbWFya1xyXG4gICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZHRyLmZpbmQoJ2Zvcm0nKS5nZXQoMCkpO1xyXG5cclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkdHJcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC1jYW5jZWwnLCBmaW5pc2hFZGl0KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsICcuYWpheC1ib3gnLCBmaW5pc2hFZGl0KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0JywgJ2Zvcm0sIGZpZWxkc2V0JywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDAgfHwgZGF0YS5Db2RlID09IDUgfHwgZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyB2aWV3ZXIgYW5kIHJlbG9hZCBsaXN0OlxyXG4gICAgICAgICAgICB2d3IueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSlcclxuICAgICAgICAgICAgLmZpbmQoJy5jcnVkbC1saXN0JykucmVsb2FkKHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEEgc21hbGwgZGVsYXkgdG8gbGV0IHVzZXIgdG8gc2VlIHRoZSBuZXcgbWVzc2FnZSBvbiBidXR0b24gYmVmb3JlXHJcbiAgICAgICAgICAvLyBoaWRlIGl0IChiZWNhdXNlIGlzIGluc2lkZSB0aGUgZWRpdG9yKVxyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PSA1KVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZpbmlzaEVkaXQsIDE1MDApO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLCBmaWVsZHNldCcsIGZ1bmN0aW9uIChqYiwgZm9ybSwgangpIHtcclxuICAgICAgICAgIC8vIEVtaXQgdGhlICdlZGl0b3ItcmVhZHknIGV2ZW50IG9uIGVkaXRvciBIdG1sIGJlaW5nIHJlcGxhY2VkXHJcbiAgICAgICAgICAvLyAoZmlyc3QgbG9hZCBvciBuZXh0IGxvYWRzIGJlY2F1c2Ugb2Ygc2VydmVyLXNpZGUgdmFsaWRhdGlvbiBlcnJvcnMpXHJcbiAgICAgICAgICAvLyB0byBhbGxvdyBsaXN0ZW5lcnMgdG8gZG8gYW55IHdvcmsgb3ZlciBpdHMgKG5ldykgRE9NIGVsZW1lbnRzLlxyXG4gICAgICAgICAgLy8gVGhlIHNlY29uZCBjdXN0b20gcGFyYW1ldGVyIHBhc3NlZCBtZWFucyBpcyBtZWFuIHRvXHJcbiAgICAgICAgICAvLyBkaXN0aW5ndWlzaCB0aGUgZmlyc3QgdGltZSBjb250ZW50IGxvYWQgYW5kIHN1Y2Nlc3NpdmUgdXBkYXRlcyAoZHVlIHRvIHZhbGlkYXRpb24gZXJyb3JzKS5cclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgW2R0ciwgZWRpdG9ySW5pdGlhbExvYWRdKTtcclxuXHJcbiAgICAgICAgICAvLyBOZXh0IHRpbWVzOlxyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY3J1ZGwuZGF0YSgnX19jcnVkbF9pbml0aWFsaXplZF9fJywgdHJ1ZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIGluc3RhbmNlO1xyXG4gICAgfVxyXG4gIH07XHJcbn07XHJcbiIsIi8qKlxyXG4gIFRoaXMgbW9kdWxlIGhhcyB1dGlsaXRpZXMgdG8gY29udmVydCBhIERhdGUgb2JqZWN0IGludG9cclxuICBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBmb2xsb3dpbmcgSVNPLTg2MDEgc3BlY2lmaWNhdGlvbi5cclxuICBcclxuICBJTkNPTVBMRVRFIEJVVCBVU0VGVUwuXHJcbiAgXHJcbiAgU3RhbmRhcmQgcmVmZXJzIHRvIGZvcm1hdCB2YXJpYXRpb25zOlxyXG4gIC0gYmFzaWM6IG1pbmltdW0gc2VwYXJhdG9yc1xyXG4gIC0gZXh0ZW5kZWQ6IGFsbCBzZXBhcmF0b3JzLCBtb3JlIHJlYWRhYmxlXHJcbiAgQnkgZGVmYXVsdCwgYWxsIG1ldGhvZHMgcHJpbnRzIHRoZSBiYXNpYyBmb3JtYXQsXHJcbiAgZXhjZXB0cyB0aGUgcGFyYW1ldGVyICdleHRlbmRlZCcgaXMgc2V0IHRvIHRydWVcclxuXHJcbiAgVE9ETzpcclxuICAtIFRaOiBhbGxvdyBmb3IgVGltZSBab25lIHN1ZmZpeGVzIChwYXJzZSBhbGxvdyBpdCBhbmQgXHJcbiAgICBkZXRlY3QgVVRDIGJ1dCBkbyBub3RoaW5nIHdpdGggYW55IHRpbWUgem9uZSBvZmZzZXQgZGV0ZWN0ZWQpXHJcbiAgLSBGcmFjdGlvbnMgb2Ygc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy5kYXRlVVRDID0gZnVuY3Rpb24gZGF0ZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBtID0gKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgIGQgPSBkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpLFxyXG4gICAgICB5ID0gZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcbiAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICBkID0gJzAnICsgZDtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIHkgKyAnLScgKyBtICsgJy0nICsgZDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4geSArIG0gKyBkO1xyXG59O1xyXG5cclxuZXhwb3J0cy5kYXRlTG9jYWwgPSBmdW5jdGlvbiBkYXRlTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgbSA9IChkYXRlLmdldE1vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICBkID0gZGF0ZS5nZXREYXRlKCkudG9TdHJpbmcoKSxcclxuICAgICAgeSA9IGRhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcbiAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICBkID0gJzAnICsgZDtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIHkgKyAnLScgKyBtICsgJy0nICsgZDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4geSArIG0gKyBkO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMsIG1pbnV0ZXMgYW5kIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMudGltZUxvY2FsID0gZnVuY3Rpb24gdGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIHMgPSBkYXRlLmdldFNlY29uZHMoKS50b1N0cmluZygpLFxyXG4gICAgICBobSA9IGV4cG9ydHMuc2hvcnRUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAocy5sZW5ndGggPT0gMSlcclxuICAgIHMgPSAnMCcgKyBzO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaG0gKyAnOicgKyBzO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBobSArIHM7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycywgbWludXRlcyBhbmQgc2Vjb25kcyBVVENcclxuKiovXHJcbmV4cG9ydHMudGltZVVUQyA9IGZ1bmN0aW9uIHRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgcyA9IGRhdGUuZ2V0VVRDU2Vjb25kcygpLnRvU3RyaW5nKCksXHJcbiAgICAgIGhtID0gZXhwb3J0cy5zaG9ydFRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAocy5sZW5ndGggPT0gMSlcclxuICAgIHMgPSAnMCcgKyBzO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaG0gKyAnOicgKyBzO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBobSArIHM7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycyBhbmQgbWludXRlc1xyXG4qKi9cclxuZXhwb3J0cy5zaG9ydFRpbWVMb2NhbCA9IGZ1bmN0aW9uIHNob3J0VGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIGggPSBkYXRlLmdldEhvdXJzKCkudG9TdHJpbmcoKSxcclxuICAgICAgbSA9IGRhdGUuZ2V0TWludXRlcygpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChoLmxlbmd0aCA9PSAxKVxyXG4gICAgaCA9ICcwJyArIGg7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGggKyAnOicgKyBtO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBoICsgbTtcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzIGFuZCBtaW51dGVzIFVUQ1xyXG4qKi9cclxuZXhwb3J0cy5zaG9ydFRpbWVVVEMgPSBmdW5jdGlvbiBzaG9ydFRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgaCA9IGRhdGUuZ2V0VVRDSG91cnMoKS50b1N0cmluZygpLFxyXG4gICAgICBtID0gZGF0ZS5nZXRVVENNaW51dGVzKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKGgubGVuZ3RoID09IDEpXHJcbiAgICBoID0gJzAnICsgaDtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaCArICc6JyArIG07XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGggKyBtO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgVE9ETzogSG91cnMsIG1pbnV0ZXMsIHNlY29uZHMgYW5kIGZyYWN0aW9ucyBvZiBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLmxvbmdUaW1lTG9jYWwgPSBmdW5jdGlvbiBsb25nVGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgLy9UT0RPXHJcbn07XHJcblxyXG4vKipcclxuICBVVEMgRGF0ZSBhbmQgVGltZSBzZXBhcmF0ZWQgYnkgVC5cclxuICBTdGFuZGFyZCBhbGxvd3Mgb21pdCB0aGUgc2VwYXJhdG9yIGFzIGV4Y2VwdGlvbmFsLCBib3RoIHBhcnRzIGFncmVlbWVudCwgY2FzZXM7XHJcbiAgY2FuIGJlIGRvbmUgcGFzc2luZyB0cnVlIGFzIG9mIG9taXRTZXBhcmF0b3IgcGFyYW1ldGVyLCBieSBkZWZhdWx0IGZhbHNlLlxyXG4qKi9cclxuZXhwb3J0cy5kYXRldGltZUxvY2FsID0gZnVuY3Rpb24gZGF0ZXRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCwgb21pdFNlcGFyYXRvcikge1xyXG4gIHZhciBkID0gZXhwb3J0cy5kYXRlTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpLFxyXG4gICAgICB0ID0gZXhwb3J0cy50aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAob21pdFNlcGFyYXRvcilcclxuICAgIHJldHVybiBkICsgdDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZCArICdUJyArIHQ7XHJcbn07XHJcblxyXG4vKipcclxuICBMb2NhbCBEYXRlIGFuZCBUaW1lIHNlcGFyYXRlZCBieSBULlxyXG4gIFN0YW5kYXJkIGFsbG93cyBvbWl0IHRoZSBzZXBhcmF0b3IgYXMgZXhjZXB0aW9uYWwsIGJvdGggcGFydHMgYWdyZWVtZW50LCBjYXNlcztcclxuICBjYW4gYmUgZG9uZSBwYXNzaW5nIHRydWUgYXMgb2Ygb21pdFNlcGFyYXRvciBwYXJhbWV0ZXIsIGJ5IGRlZmF1bHQgZmFsc2UuXHJcbioqL1xyXG5leHBvcnRzLmRhdGV0aW1lVVRDID0gZnVuY3Rpb24gZGF0ZXRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQsIG9taXRTZXBhcmF0b3IpIHtcclxuICB2YXIgZCA9IGV4cG9ydHMuZGF0ZVVUQyhkYXRlLCBleHRlbmRlZCksXHJcbiAgICAgIHQgPSBleHBvcnRzLnRpbWVVVEMoZGF0ZSwgZXh0ZW5kZWQpO1xyXG5cclxuICBpZiAob21pdFNlcGFyYXRvcilcclxuICAgIHJldHVybiBkICsgdDtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZCArICdUJyArIHQ7XHJcbn07XHJcblxyXG4vKipcclxuICBQYXJzZSBhIHN0cmluZyBpbnRvIGEgRGF0ZSBvYmplY3QgaWYgaXMgYSB2YWxpZCBJU08tODYwMSBmb3JtYXQuXHJcbiAgUGFyc2Ugc2luZ2xlIGRhdGUsIHNpbmdsZSB0aW1lIG9yIGRhdGUtdGltZSBmb3JtYXRzLlxyXG4gIElNUE9SVEFOVDogSXQgZG9lcyBOT1QgY29udmVydCBiZXR3ZWVuIHRoZSBkYXRlc3RyIFRpbWVab25lIGFuZCB0aGVcclxuICBsb2NhbCBUaW1lWm9uZSAoZWl0aGVyIGl0IGFsbG93cyBkYXRlc3RyIHRvIGluY2x1ZGVkIFRpbWVab25lIGluZm9ybWF0aW9uKVxyXG4gIFRPRE86IE9wdGlvbmFsIFQgc2VwYXJhdG9yIGlzIG5vdCBhbGxvd2VkLlxyXG4gIFRPRE86IE1pbGxpc2Vjb25kcy9mcmFjdGlvbnMgb2Ygc2Vjb25kcyBub3Qgc3VwcG9ydGVkXHJcbioqL1xyXG5leHBvcnRzLnBhcnNlID0gZnVuY3Rpb24gcGFyc2UoZGF0ZXN0cikge1xyXG4gIHZhciBkdCA9IGRhdGVzdHIuc3BsaXQoJ1QnKSxcclxuICAgIGRhdGUgPSBkdFswXSxcclxuICAgIHRpbWUgPSBkdC5sZW5ndGggPT0gMiA/IGR0WzFdIDogbnVsbDtcclxuXHJcbiAgaWYgKGR0Lmxlbmd0aCA+IDIpXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgZm9ybWF0XCIpO1xyXG5cclxuICAvLyBDaGVjayBpZiBkYXRlIGNvbnRhaW5zIGEgdGltZTtcclxuICAvLyBiZWNhdXNlIG1heWJlIGRhdGVzdHIgaXMgb25seSB0aGUgdGltZSBwYXJ0XHJcbiAgaWYgKC86fF5cXGR7NCw2fVteXFwtXShcXC5cXGQqKT8oPzpafFsrXFwtXS4qKT8kLy50ZXN0KGRhdGUpKSB7XHJcbiAgICB0aW1lID0gZGF0ZTtcclxuICAgIGRhdGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgdmFyIHksIG0sIGQsIGgsIG1tLCBzLCB0eiwgdXRjO1xyXG5cclxuICBpZiAoZGF0ZSkge1xyXG4gICAgdmFyIGRwYXJ0cyA9IC8oXFxkezR9KVxcLT8oXFxkezJ9KVxcLT8oXFxkezJ9KS8uZXhlYyhkYXRlKTtcclxuICAgIGlmICghZHBhcnRzKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgZGF0ZSBmb3JtYXRcIik7XHJcblxyXG4gICAgeSA9IGRwYXJ0c1sxXTtcclxuICAgIG0gPSBkcGFydHNbMl07XHJcbiAgICBkID0gZHBhcnRzWzNdO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRpbWUpIHtcclxuICAgIHZhciB0cGFydHMgPSAvKFxcZHsyfSk6PyhcXGR7Mn0pKD86Oj8oXFxkezJ9KSk/KFp8WytcXC1dLiopPy8uZXhlYyh0aW1lKTtcclxuICAgIGlmICghdHBhcnRzKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgaW5wdXQgdGltZSBmb3JtYXRcIik7XHJcblxyXG4gICAgaCA9IHRwYXJ0c1sxXTtcclxuICAgIG1tID0gdHBhcnRzWzJdO1xyXG4gICAgcyA9IHRwYXJ0cy5sZW5ndGggPiAzID8gdHBhcnRzWzNdIDogbnVsbDtcclxuICAgIHR6ID0gdHBhcnRzLmxlbmd0aCA+IDQgPyB0cGFydHNbNF0gOiBudWxsO1xyXG4gICAgLy8gRGV0ZWN0cyBpZiBpcyBhIHRpbWUgaW4gVVRDOlxyXG4gICAgdXRjID0gL15aJC9pLnRlc3QodHopO1xyXG4gIH1cclxuXHJcbiAgLy8gVmFyIHRvIGhvbGQgdGhlIHBhcnNlZCB2YWx1ZSwgd2Ugc3RhcnQgd2l0aCB0b2RheSxcclxuICAvLyB0aGF0IHdpbGwgZmlsbCB0aGUgbWlzc2luZyBwYXJ0c1xyXG4gIHZhciBwYXJzZWREYXRlID0gbmV3IERhdGUoKTtcclxuXHJcbiAgaWYgKGRhdGUpIHtcclxuICAgIC8vIFVwZGF0aW5nIHRoZSBkYXRlIG9iamVjdCB3aXRoIGVhY2ggeWVhciwgbW9udGggYW5kIGRhdGUvZGF5IGRldGVjdGVkOlxyXG4gICAgaWYgKHV0YylcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRVVENGdWxsWWVhcih5LCBtLCBkKTtcclxuICAgIGVsc2VcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRGdWxsWWVhcih5LCBtLCBkKTtcclxuICB9XHJcblxyXG4gIGlmICh0aW1lKSB7XHJcbiAgICBpZiAodXRjKVxyXG4gICAgICBwYXJzZWREYXRlLnNldFVUQ0hvdXJzKGgsIG1tLCBzKTtcclxuICAgIGVsc2VcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRIb3VycyhoLCBtbSwgcyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGFyc2VkRGF0ZTtcclxufTsiLCIvKiBEYXRlIHBpY2tlciBpbml0aWFsaXphdGlvbiBhbmQgdXNlXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwRGF0ZVBpY2tlcigpIHtcclxuICAgIC8vIERhdGUgUGlja2VyXHJcbiAgICAkLmRhdGVwaWNrZXIuc2V0RGVmYXVsdHMoJC5kYXRlcGlja2VyLnJlZ2lvbmFsWyQoJ2h0bWwnKS5hdHRyKCdsYW5nJyldKTtcclxuICAgICQoJy5kYXRlLXBpY2snLCBkb2N1bWVudCkuZGF0ZXBpY2tlcih7XHJcbiAgICAgICAgc2hvd0FuaW06ICdibGluZCdcclxuICAgIH0pO1xyXG4gICAgYXBwbHlEYXRlUGlja2VyKCk7XHJcbn1cclxuZnVuY3Rpb24gYXBwbHlEYXRlUGlja2VyKGVsZW1lbnQpIHtcclxuICAgICQoXCIuZGF0ZS1waWNrXCIsIGVsZW1lbnQgfHwgZG9jdW1lbnQpXHJcbiAgICAvLy52YWwobmV3IERhdGUoKS5hc1N0cmluZygkLmRhdGVwaWNrZXIuX2RlZmF1bHRzLmRhdGVGb3JtYXQpKVxyXG4gICAgLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIHNob3dBbmltOiBcImJsaW5kXCJcclxuICAgIH0pO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBzZXR1cERhdGVQaWNrZXIsXHJcbiAgICAgICAgYXBwbHk6IGFwcGx5RGF0ZVBpY2tlclxyXG4gICAgfTtcclxuIiwiLyogRm9ybWF0IGEgZGF0ZSBhcyBZWVlZLU1NLUREIGluIFVUQyBmb3Igc2F2ZSB1c1xyXG4gICAgdG8gaW50ZXJjaGFuZ2Ugd2l0aCBvdGhlciBtb2R1bGVzIG9yIGFwcHMuXHJcbiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nKGRhdGUpIHtcclxuICAgIHZhciBtID0gKGRhdGUuZ2V0VVRDTW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgICAgZCA9IGRhdGUuZ2V0VVRDRGF0ZSgpLnRvU3RyaW5nKCk7XHJcbiAgICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgICAgICBtID0gJzAnICsgbTtcclxuICAgIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgIGQgPSAnMCcgKyBkO1xyXG4gICAgcmV0dXJuIGRhdGUuZ2V0VVRDRnVsbFllYXIoKS50b1N0cmluZygpICsgJy0nICsgbSArICctJyArIGQ7XHJcbn07IiwiLyoqIEFuIGkxOG4gdXRpbGl0eSwgZ2V0IGEgdHJhbnNsYXRpb24gdGV4dCBieSBsb29raW5nIGZvciBzcGVjaWZpYyBlbGVtZW50cyBpbiB0aGUgaHRtbFxyXG53aXRoIHRoZSBuYW1lIGdpdmVuIGFzIGZpcnN0IHBhcmFtZW50ZXIgYW5kIGFwcGx5aW5nIHRoZSBnaXZlbiB2YWx1ZXMgb24gc2Vjb25kIGFuZCBcclxub3RoZXIgcGFyYW1ldGVycy5cclxuICAgIFRPRE86IFJFLUlNUExFTUVOVCBub3QgdXNpbmcgalF1ZXJ5IG5lbHNlIERPTSBlbGVtZW50cywgb3IgYWxtb3N0IG5vdCBlbGVtZW50cyBpbnNpZGUgYm9keVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbmZ1bmN0aW9uIGdldFRleHQoKSB7XHJcbiAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuICAgIC8vIEdldCBrZXkgYW5kIHRyYW5zbGF0ZSBpdFxyXG4gICAgdmFyIGZvcm1hdHRlZCA9IGFyZ3NbMF07XHJcbiAgICB2YXIgdGV4dCA9ICQoJyNsY3Jlcy0nICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShmb3JtYXR0ZWQpKS50ZXh0KCk7XHJcbiAgICBpZiAodGV4dClcclxuICAgICAgICBmb3JtYXR0ZWQgPSB0ZXh0O1xyXG4gICAgLy8gQXBwbHkgZm9ybWF0IHRvIHRoZSB0ZXh0IHdpdGggYWRkaXRpb25hbCBwYXJhbWV0ZXJzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXFxcXHsnICsgaSArICdcXFxcfScsICdnaScpO1xyXG4gICAgICAgIGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5yZXBsYWNlKHJlZ2V4cCwgYXJnc1tpICsgMV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZvcm1hdHRlZDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnZXRUZXh0OyIsIi8qKiBSZXR1cm5zIHRoZSBwYXRoIHRvIHRoZSBnaXZlbiBlbGVtZW50IGluIFhQYXRoIGNvbnZlbnRpb25cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBnZXRYUGF0aChlbGVtZW50KSB7XHJcbiAgICBpZiAoZWxlbWVudCAmJiBlbGVtZW50LmlkKVxyXG4gICAgICAgIHJldHVybiAnLy8qW0BpZD1cIicgKyBlbGVtZW50LmlkICsgJ1wiXSc7XHJcbiAgICB2YXIgeHBhdGggPSAnJztcclxuICAgIGZvciAoOyBlbGVtZW50ICYmIGVsZW1lbnQubm9kZVR5cGUgPT0gMTsgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZSkge1xyXG4gICAgICAgIHZhciBpZCA9ICQoZWxlbWVudC5wYXJlbnROb2RlKS5jaGlsZHJlbihlbGVtZW50LnRhZ05hbWUpLmluZGV4KGVsZW1lbnQpICsgMTtcclxuICAgICAgICBpZCA9IChpZCA+IDEgPyAnWycgKyBpZCArICddJyA6ICcnKTtcclxuICAgICAgICB4cGF0aCA9ICcvJyArIGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpICsgaWQgKyB4cGF0aDtcclxuICAgIH1cclxuICAgIHJldHVybiB4cGF0aDtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBnZXRYUGF0aDtcclxuIiwiLy8gSXQgZXhlY3V0ZXMgdGhlIGdpdmVuICdyZWFkeScgZnVuY3Rpb24gYXMgcGFyYW1ldGVyIHdoZW5cclxuLy8gbWFwIGVudmlyb25tZW50IGlzIHJlYWR5ICh3aGVuIGdvb2dsZSBtYXBzIGFwaSBhbmQgc2NyaXB0IGlzXHJcbi8vIGxvYWRlZCBhbmQgcmVhZHkgdG8gdXNlLCBvciBpbm1lZGlhdGVseSBpZiBpcyBhbHJlYWR5IGxvYWRlZCkuXHJcblxyXG52YXIgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKTtcclxuXHJcbi8vIFByaXZhdGUgc3RhdGljIGNvbGxlY3Rpb24gb2YgY2FsbGJhY2tzIHJlZ2lzdGVyZWRcclxudmFyIHN0YWNrID0gW107XHJcblxyXG52YXIgZ29vZ2xlTWFwUmVhZHkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdvb2dsZU1hcFJlYWR5KHJlYWR5KSB7XHJcbiAgc3RhY2sucHVzaChyZWFkeSk7XHJcblxyXG4gIGlmIChnb29nbGVNYXBSZWFkeS5pc1JlYWR5KVxyXG4gICAgcmVhZHkoKTtcclxuICBlbHNlIGlmICghZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nKSB7XHJcbiAgICBnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcgPSB0cnVlO1xyXG4gICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICBzY3JpcHRzOiBbXCJodHRwczovL3d3dy5nb29nbGUuY29tL2pzYXBpXCJdLFxyXG4gICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogZnVuY3Rpb24gKCkgeyByZXR1cm4gISF3aW5kb3cuZ29vZ2xlOyB9LFxyXG4gICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGdvb2dsZS5sb2FkKFwibWFwc1wiLCBcIjMuMTBcIiwgeyBvdGhlcl9wYXJhbXM6IFwic2Vuc29yPWZhbHNlXCIsIFwiY2FsbGJhY2tcIjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSA9IHRydWU7XHJcbiAgICAgICAgICBnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgIHN0YWNrW2ldKCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLy8gVXRpbGl0eSB0byBmb3JjZSB0aGUgcmVmcmVzaCBvZiBtYXBzIHRoYXQgc29sdmUgdGhlIHByb2JsZW0gd2l0aCBiYWQtc2l6ZWQgbWFwIGFyZWFcclxuZ29vZ2xlTWFwUmVhZHkucmVmcmVzaE1hcCA9IGZ1bmN0aW9uIHJlZnJlc2hNYXBzKG1hcCkge1xyXG4gIGdvb2dsZU1hcFJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIobWFwLCBcInJlc2l6ZVwiKTtcclxuICB9KTtcclxufTtcclxuIiwiLyogR1VJRCBHZW5lcmF0b3JcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ3VpZEdlbmVyYXRvcigpIHtcclxuICAgIHZhciBTNCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCgoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMCkgfCAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiAoUzQoKSArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBTNCgpICsgUzQoKSk7XHJcbn07IiwiLyoqXHJcbiAgICBHZW5lcmljIHNjcmlwdCBmb3IgZmllbGRzZXRzIHdpdGggY2xhc3MgLmhhcy1jb25maXJtLCBhbGxvd2luZyBzaG93XHJcbiAgICB0aGUgY29udGVudCBvbmx5IGlmIHRoZSBtYWluIGNvbmZpcm0gZmllbGRzIGhhdmUgJ3llcycgc2VsZWN0ZWQuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIGRlZmF1bHRTZWxlY3RvciA9ICdmaWVsZHNldC5oYXMtY29uZmlybSA+IC5jb25maXJtIGlucHV0JztcclxuXHJcbmZ1bmN0aW9uIG9uY2hhbmdlKCkge1xyXG4gICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGZzID0gdC5jbG9zZXN0KCdmaWVsZHNldCcpO1xyXG4gICAgaWYgKHQuaXMoJzpjaGVja2VkJykpXHJcbiAgICAgICAgaWYgKHQudmFsKCkgPT0gJ3llcycgfHwgdC52YWwoKSA9PSAnVHJ1ZScpXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKCdjb25maXJtZWQtbm8nKS5hZGRDbGFzcygnY29uZmlybWVkLXllcycpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3MoJ2NvbmZpcm1lZC15ZXMnKS5hZGRDbGFzcygnY29uZmlybWVkLW5vJyk7XHJcbn1cclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgZGVmYXVsdFNlbGVjdG9yO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCBzZWxlY3Rvciwgb25jaGFuZ2UpO1xyXG4gICAgLy8gUGVyZm9ybXMgZmlyc3QgY2hlY2s6XHJcbiAgICAkKHNlbGVjdG9yKS5jaGFuZ2UoKTtcclxufTtcclxuXHJcbmV4cG9ydHMub2ZmID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IGRlZmF1bHRTZWxlY3RvcjtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2NoYW5nZScsIHNlbGVjdG9yKTtcclxufTsiLCIvKiBJbnRlcm5hemlvbmFsaXphdGlvbiBVdGlsaXRpZXNcclxuICovXHJcbnZhciBpMThuID0ge307XHJcbmkxOG4uZGlzdGFuY2VVbml0cyA9IHtcclxuICAgICdFUyc6ICdrbScsXHJcbiAgICAnVVMnOiAnbWlsZXMnXHJcbn07XHJcbmkxOG4ubnVtZXJpY01pbGVzU2VwYXJhdG9yID0ge1xyXG4gICAgJ2VzLUVTJzogJy4nLFxyXG4gICAgJ2VzLVVTJzogJy4nLFxyXG4gICAgJ2VuLVVTJzogJywnLFxyXG4gICAgJ2VuLUVTJzogJywnXHJcbn07XHJcbmkxOG4ubnVtZXJpY0RlY2ltYWxTZXBhcmF0b3IgPSB7XHJcbiAgICAnZXMtRVMnOiAnLCcsXHJcbiAgICAnZXMtVVMnOiAnLCcsXHJcbiAgICAnZW4tVVMnOiAnLicsXHJcbiAgICAnZW4tRVMnOiAnLidcclxufTtcclxuaTE4bi5tb25leVN5bWJvbFByZWZpeCA9IHtcclxuICAgICdFUyc6ICcnLFxyXG4gICAgJ1VTJzogJyQnXHJcbn07XHJcbmkxOG4ubW9uZXlTeW1ib2xTdWZpeCA9IHtcclxuICAgICdFUyc6ICfigqwnLFxyXG4gICAgJ1VTJzogJydcclxufTtcclxuaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSA9IGZ1bmN0aW9uIGdldEN1cnJlbnRDdWx0dXJlKCkge1xyXG4gICAgdmFyIGMgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKTtcclxuICAgIHZhciBzID0gYy5zcGxpdCgnLScpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdWx0dXJlOiBjLFxyXG4gICAgICAgIGxhbmd1YWdlOiBzWzBdLFxyXG4gICAgICAgIGNvdW50cnk6IHNbMV1cclxuICAgIH07XHJcbn07XHJcbmkxOG4uY29udmVydE1pbGVzS20gPSBmdW5jdGlvbiBjb252ZXJ0TWlsZXNLbShxLCB1bml0KSB7XHJcbiAgICB2YXIgTUlMRVNfVE9fS00gPSAxLjYwOTtcclxuICAgIGlmICh1bml0ID09ICdtaWxlcycpXHJcbiAgICAgICAgcmV0dXJuIE1JTEVTX1RPX0tNICogcTtcclxuICAgIGVsc2UgaWYgKHVuaXQgPT0gJ2ttJylcclxuICAgICAgICByZXR1cm4gcSAvIE1JTEVTX1RPX0tNO1xyXG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5sb2cpIGNvbnNvbGUubG9nKCdjb252ZXJ0TWlsZXNLbTogVW5yZWNvZ25pemVkIHVuaXQgJyArIHVuaXQpO1xyXG4gICAgcmV0dXJuIDA7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGkxOG47IiwiLyogUmV0dXJucyB0cnVlIHdoZW4gc3RyIGlzXHJcbi0gbnVsbFxyXG4tIGVtcHR5IHN0cmluZ1xyXG4tIG9ubHkgd2hpdGUgc3BhY2VzIHN0cmluZ1xyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzRW1wdHlTdHJpbmcoc3RyKSB7XHJcbiAgICByZXR1cm4gISgvXFxTL2cudGVzdChzdHIgfHwgXCJcIikpO1xyXG59OyIsIi8qKiBBcyB0aGUgJ2lzJyBqUXVlcnkgbWV0aG9kLCBidXQgY2hlY2tpbmcgQHNlbGVjdG9yIGluIGFsbCBlbGVtZW50c1xyXG4qIEBtb2RpZmllciB2YWx1ZXM6XHJcbiogLSAnYWxsJzogYWxsIGVsZW1lbnRzIG11c3QgbWF0Y2ggc2VsZWN0b3IgdG8gcmV0dXJuIHRydWVcclxuKiAtICdhbG1vc3Qtb25lJzogYWxtb3N0IG9uZSBlbGVtZW50IG11c3QgbWF0Y2hcclxuKiAtICdwZXJjZW50YWdlJzogcmV0dXJucyBwZXJjZW50YWdlIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG1hdGNoIHNlbGVjdG9yICgwLTEwMClcclxuKiAtICdzdW1tYXJ5JzogcmV0dXJucyB0aGUgb2JqZWN0IHsgeWVzOiBudW1iZXIsIG5vOiBudW1iZXIsIHBlcmNlbnRhZ2U6IG51bWJlciwgdG90YWw6IG51bWJlciB9XHJcbiogLSB7anVzdDogYSBudW1iZXJ9OiBleGFjdCBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbiogLSB7YWxtb3N0OiBhIG51bWJlcn06IG1pbmltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qIC0ge3VudGlsOiBhIG51bWJlcn06IG1heGltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uYXJlID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBtb2RpZmllcikge1xyXG4gICAgbW9kaWZpZXIgPSBtb2RpZmllciB8fCAnYWxsJztcclxuICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmlzKHNlbGVjdG9yKSlcclxuICAgICAgICAgICAgY291bnQrKztcclxuICAgIH0pO1xyXG4gICAgc3dpdGNoIChtb2RpZmllcikge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCA9PSBjb3VudDtcclxuICAgICAgICBjYXNlICdhbG1vc3Qtb25lJzpcclxuICAgICAgICAgICAgcmV0dXJuIGNvdW50ID4gMDtcclxuICAgICAgICBjYXNlICdwZXJjZW50YWdlJzpcclxuICAgICAgICAgICAgcmV0dXJuIGNvdW50IC8gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgY2FzZSAnc3VtbWFyeSc6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB5ZXM6IGNvdW50LFxyXG4gICAgICAgICAgICAgICAgbm86IHRoaXMubGVuZ3RoIC0gY291bnQsXHJcbiAgICAgICAgICAgICAgICBwZXJjZW50YWdlOiBjb3VudCAvIHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgdG90YWw6IHRoaXMubGVuZ3RoXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCdqdXN0JyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuanVzdCAhPSBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ2FsbW9zdCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLmFsbW9zdCA+IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICgndW50aWwnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci51bnRpbCA8IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICB9XHJcbn07IiwiLyoqID09PT09PT09PT09PT09PT09PT1cclxuRXh0ZW5zaW9uIGpxdWVyeTogJ2JvdW5kcydcclxuUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aGUgY29tYmluZWQgYm91bmRzIGZvciBhbGwgXHJcbmVsZW1lbnRzIGluIHRoZSBjb2xsZWN0aW9uXHJcbiovXHJcbihmdW5jdGlvbiAoKSB7XHJcbiAgalF1ZXJ5LmZuLmJvdW5kcyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHtcclxuICAgICAgaW5jbHVkZUJvcmRlcjogZmFsc2UsXHJcbiAgICAgIGluY2x1ZGVNYXJnaW46IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgIHZhciBib3VuZHMgPSB7XHJcbiAgICAgIGxlZnQ6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcclxuICAgICAgdG9wOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHJpZ2h0OiBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIGJvdHRvbTogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLFxyXG4gICAgICB3aWR0aDogTnVtYmVyLk5hTixcclxuICAgICAgaGVpZ2h0OiBOdW1iZXIuTmFOXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBmbldpZHRoID0gb3B0aW9ucy5pbmNsdWRlQm9yZGVyIHx8IG9wdGlvbnMuaW5jbHVkZU1hcmdpbiA/IFxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLm91dGVyV2lkdGguY2FsbChlbCwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luKTsgfSA6XHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ud2lkdGguY2FsbChlbCk7IH07XHJcbiAgICB2YXIgZm5IZWlnaHQgPSBvcHRpb25zLmluY2x1ZGVCb3JkZXIgfHwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luID8gXHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4ub3V0ZXJIZWlnaHQuY2FsbChlbCwgb3B0aW9ucy5pbmNsdWRlTWFyZ2luKTsgfSA6XHJcbiAgICAgIGZ1bmN0aW9uKGVsKXsgcmV0dXJuICQuZm4uaGVpZ2h0LmNhbGwoZWwpOyB9O1xyXG5cclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoaSwgZWwpIHtcclxuICAgICAgdmFyIGVsUSA9ICQoZWwpO1xyXG4gICAgICB2YXIgb2ZmID0gZWxRLm9mZnNldCgpO1xyXG4gICAgICBvZmYucmlnaHQgPSBvZmYubGVmdCArIGZuV2lkdGgoJChlbFEpKTtcclxuICAgICAgb2ZmLmJvdHRvbSA9IG9mZi50b3AgKyBmbkhlaWdodCgkKGVsUSkpO1xyXG5cclxuICAgICAgaWYgKG9mZi5sZWZ0IDwgYm91bmRzLmxlZnQpXHJcbiAgICAgICAgYm91bmRzLmxlZnQgPSBvZmYubGVmdDtcclxuXHJcbiAgICAgIGlmIChvZmYudG9wIDwgYm91bmRzLnRvcClcclxuICAgICAgICBib3VuZHMudG9wID0gb2ZmLnRvcDtcclxuXHJcbiAgICAgIGlmIChvZmYucmlnaHQgPiBib3VuZHMucmlnaHQpXHJcbiAgICAgICAgYm91bmRzLnJpZ2h0ID0gb2ZmLnJpZ2h0O1xyXG5cclxuICAgICAgaWYgKG9mZi5ib3R0b20gPiBib3VuZHMuYm90dG9tKVxyXG4gICAgICAgIGJvdW5kcy5ib3R0b20gPSBvZmYuYm90dG9tO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYm91bmRzLndpZHRoID0gYm91bmRzLnJpZ2h0IC0gYm91bmRzLmxlZnQ7XHJcbiAgICBib3VuZHMuaGVpZ2h0ID0gYm91bmRzLmJvdHRvbSAtIGJvdW5kcy50b3A7XHJcbiAgICByZXR1cm4gYm91bmRzO1xyXG4gIH07XHJcbn0pKCk7IiwiLyoqXHJcbiogSGFzU2Nyb2xsQmFyIHJldHVybnMgYW4gb2JqZWN0IHdpdGggYm9vbCBwcm9wZXJ0aWVzICd2ZXJ0aWNhbCcgYW5kICdob3Jpem9udGFsJ1xyXG4qIHNheWluZyBpZiB0aGUgZWxlbWVudCBoYXMgbmVlZCBvZiBzY3JvbGxiYXJzIGZvciBlYWNoIGRpbWVuc2lvbiBvciBub3QgKGVsZW1lbnRcclxuKiBjYW4gbmVlZCBzY3JvbGxiYXJzIGFuZCBzdGlsbCBub3QgYmVpbmcgc2hvd2VkIGJlY2F1c2UgdGhlIGNzcy1vdmVybGZsb3cgcHJvcGVydHlcclxuKiBiZWluZyBzZXQgYXMgJ2hpZGRlbicsIGJ1dCBzdGlsbCB3ZSBrbm93IHRoYXQgdGhlIGVsZW1lbnQgcmVxdWlyZXMgaXQgYW5kIGl0c1xyXG4qIGNvbnRlbnQgaXMgbm90IGJlaW5nIGZ1bGx5IGRpc3BsYXllZCkuXHJcbiogQGV4dHJhZ2FwLCBkZWZhdWx0cyB0byB7eDowLHk6MH0sIGxldHMgc3BlY2lmeSBhbiBleHRyYSBzaXplIGluIHBpeGVscyBmb3IgZWFjaCBkaW1lbnNpb24gdGhhdCBhbHRlciB0aGUgcmVhbCBjaGVjayxcclxuKiByZXN1bHRpbmcgaW4gYSBmYWtlIHJlc3VsdCB0aGF0IGNhbiBiZSBpbnRlcmVzdGluZyB0byBkaXNjYXJkIHNvbWUgcGl4ZWxzIG9mIGV4Y2Vzc1xyXG4qIHNpemUgKG5lZ2F0aXZlIHZhbHVlcykgb3IgZXhhZ2VyYXRlIHRoZSByZWFsIHVzZWQgc2l6ZSB3aXRoIHRoYXQgZXh0cmEgcGl4ZWxzIChwb3NpdGl2ZSB2YWx1ZXMpLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uaGFzU2Nyb2xsQmFyID0gZnVuY3Rpb24gKGV4dHJhZ2FwKSB7XHJcbiAgICBleHRyYWdhcCA9ICQuZXh0ZW5kKHtcclxuICAgICAgICB4OiAwLFxyXG4gICAgICAgIHk6IDBcclxuICAgIH0sIGV4dHJhZ2FwKTtcclxuICAgIGlmICghdGhpcyB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHsgdmVydGljYWw6IGZhbHNlLCBob3Jpem9udGFsOiBmYWxzZSB9O1xyXG4gICAgLy9ub3RlOiBjbGllbnRIZWlnaHQ9IGhlaWdodCBvZiBob2xkZXJcclxuICAgIC8vc2Nyb2xsSGVpZ2h0PSB3ZSBoYXZlIGNvbnRlbnQgdGlsbCB0aGlzIGhlaWdodFxyXG4gICAgdmFyIHQgPSB0aGlzLmdldCgwKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdmVydGljYWw6IHRoaXMub3V0ZXJIZWlnaHQoZmFsc2UpIDwgKHQuc2Nyb2xsSGVpZ2h0ICsgZXh0cmFnYXAueSksXHJcbiAgICAgICAgaG9yaXpvbnRhbDogdGhpcy5vdXRlcldpZHRoKGZhbHNlKSA8ICh0LnNjcm9sbFdpZHRoICsgZXh0cmFnYXAueClcclxuICAgIH07XHJcbn07IiwiLyoqIENoZWNrcyBpZiBjdXJyZW50IGVsZW1lbnQgb3Igb25lIG9mIHRoZSBjdXJyZW50IHNldCBvZiBlbGVtZW50cyBoYXNcclxuYSBwYXJlbnQgdGhhdCBtYXRjaCB0aGUgZWxlbWVudCBvciBleHByZXNzaW9uIGdpdmVuIGFzIGZpcnN0IHBhcmFtZXRlclxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uaXNDaGlsZE9mID0gZnVuY3Rpb24galF1ZXJ5X3BsdWdpbl9pc0NoaWxkT2YoZXhwKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnRzKCkuZmlsdGVyKGV4cCkubGVuZ3RoID4gMDtcclxufTsiLCIvKipcclxuICAgIEdldHMgdGhlIGh0bWwgc3RyaW5nIG9mIHRoZSBmaXJzdCBlbGVtZW50IGFuZCBhbGwgaXRzIGNvbnRlbnQuXHJcbiAgICBUaGUgJ2h0bWwnIG1ldGhvZCBvbmx5IHJldHJpZXZlcyB0aGUgaHRtbCBzdHJpbmcgb2YgdGhlIGNvbnRlbnQsIG5vdCB0aGUgZWxlbWVudCBpdHNlbGYuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5vdXRlckh0bWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRoaXMgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAnJztcclxuICAgIHZhciBlbCA9IHRoaXMuZ2V0KDApO1xyXG4gICAgdmFyIGh0bWwgPSAnJztcclxuICAgIGlmIChlbC5vdXRlckhUTUwpXHJcbiAgICAgICAgaHRtbCA9IGVsLm91dGVySFRNTDtcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGh0bWwgPSB0aGlzLndyYXBBbGwoJzxkaXY+PC9kaXY+JykucGFyZW50KCkuaHRtbCgpO1xyXG4gICAgICAgIHRoaXMudW53cmFwKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaHRtbDtcclxufTsiLCIvKipcclxuICAgIFVzaW5nIHRoZSBhdHRyaWJ1dGUgZGF0YS1zb3VyY2UtdXJsIG9uIGFueSBIVE1MIGVsZW1lbnQsXHJcbiAgICB0aGlzIGFsbG93cyByZWxvYWQgaXRzIGNvbnRlbnQgcGVyZm9ybWluZyBhbiBBSkFYIG9wZXJhdGlvblxyXG4gICAgb24gdGhlIGdpdmVuIFVSTCBvciB0aGUgb25lIGluIHRoZSBhdHRyaWJ1dGU7IHRoZSBlbmQtcG9pbnRcclxuICAgIG11c3QgcmV0dXJuIHRleHQvaHRtbCBjb250ZW50LlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIERlZmF1bHQgc3VjY2VzcyBjYWxsYmFjayBhbmQgcHVibGljIHV0aWxpdHksIGJhc2ljIGhvdy10byByZXBsYWNlIGVsZW1lbnQgY29udGVudCB3aXRoIGZldGNoZWQgaHRtbFxyXG5mdW5jdGlvbiB1cGRhdGVFbGVtZW50KGh0bWxDb250ZW50LCBjb250ZXh0KSB7XHJcbiAgICBjb250ZXh0ID0gJC5pc1BsYWluT2JqZWN0KGNvbnRleHQpICYmIGNvbnRleHQgPyBjb250ZXh0IDogdGhpcztcclxuXHJcbiAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhbiBlbXB0eSBkb2N1bWVudCBvciBtYWxmb3JtZWQgaXMgcmV0dXJuZWQ6XHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoaHRtbENvbnRlbnQpKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIG5ld2h0bWwgPSAkKGh0bWxDb250ZW50KTtcclxuICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBlbGVtZW50ID0gY29udGV4dC5lbGVtZW50O1xyXG4gICAgaWYgKGNvbnRleHQub3B0aW9ucy5tb2RlID09ICdyZXBsYWNlLW1lJylcclxuICAgICAgICBlbGVtZW50LnJlcGxhY2VXaXRoKG5ld2h0bWwpO1xyXG4gICAgZWxzZSAvLyAncmVwbGFjZS1jb250ZW50J1xyXG4gICAgICAgIGVsZW1lbnQuaHRtbChuZXdodG1sKTtcclxuXHJcbiAgICByZXR1cm4gY29udGV4dDtcclxufVxyXG5cclxuLy8gRGVmYXVsdCBjb21wbGV0ZSBjYWxsYmFjayBhbmQgcHVibGljIHV0aWxpdHlcclxuZnVuY3Rpb24gc3RvcExvYWRpbmdTcGlubmVyKCkge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuZWxlbWVudCk7XHJcbn1cclxuXHJcbi8vIERlZmF1bHRzXHJcbnZhciBkZWZhdWx0cyA9IHtcclxuICAgIHVybDogbnVsbCxcclxuICAgIHN1Y2Nlc3M6IFt1cGRhdGVFbGVtZW50XSxcclxuICAgIGVycm9yOiBbXSxcclxuICAgIGNvbXBsZXRlOiBbc3RvcExvYWRpbmdTcGlubmVyXSxcclxuICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgIG1vZGU6ICdyZXBsYWNlLWNvbnRlbnQnLFxyXG4gICAgbG9hZGluZzoge1xyXG4gICAgICAgIGxvY2tFbGVtZW50OiB0cnVlLFxyXG4gICAgICAgIGxvY2tPcHRpb25zOiB7fSxcclxuICAgICAgICBtZXNzYWdlOiBudWxsLFxyXG4gICAgICAgIHNob3dMb2FkaW5nSW5kaWNhdG9yOiB0cnVlLFxyXG4gICAgICAgIGRlbGF5OiAwXHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiBSZWxvYWQgbWV0aG9kICovXHJcbnZhciByZWxvYWQgPSAkLmZuLnJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIE9wdGlvbnMgZnJvbSBkZWZhdWx0cyAoaW50ZXJuYWwgYW5kIHB1YmxpYylcclxuICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCByZWxvYWQuZGVmYXVsdHMpO1xyXG4gICAgLy8gSWYgb3B0aW9ucyBvYmplY3QgaXMgcGFzc2VkIGFzIHVuaXF1ZSBwYXJhbWV0ZXJcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEgJiYgJC5pc1BsYWluT2JqZWN0KGFyZ3VtZW50c1swXSkpIHtcclxuICAgICAgICAvLyBNZXJnZSBvcHRpb25zOlxyXG4gICAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMsIGFyZ3VtZW50c1swXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIENvbW1vbiBvdmVybG9hZDogbmV3LXVybCBhbmQgY29tcGxldGUgY2FsbGJhY2ssIGJvdGggb3B0aW9uYWxzXHJcbiAgICAgICAgb3B0aW9ucy51cmwgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IG51bGw7XHJcbiAgICAgICAgb3B0aW9ucy5jb21wbGV0ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnVybCkge1xyXG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG9wdGlvbnMudXJsKSlcclxuICAgICAgICAgICAgLy8gRnVuY3Rpb24gcGFyYW1zOiBjdXJyZW50UmVsb2FkVXJsLCBkZWZhdWx0UmVsb2FkVXJsXHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdzb3VyY2UtdXJsJywgJC5wcm94eShvcHRpb25zLnVybCwgdGhpcykoJHQuZGF0YSgnc291cmNlLXVybCcpLCAkdC5hdHRyKCdkYXRhLXNvdXJjZS11cmwnKSkpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdzb3VyY2UtdXJsJywgb3B0aW9ucy51cmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdXJsID0gJHQuZGF0YSgnc291cmNlLXVybCcpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbHJlYWR5IGJlaW5nIHJlbG9hZGVkLCB0byBjYW5jZWwgcHJldmlvdXMgYXR0ZW1wdFxyXG4gICAgICAgIHZhciBqcSA9ICR0LmRhdGEoJ2lzUmVsb2FkaW5nJyk7XHJcbiAgICAgICAgaWYgKGpxKSB7XHJcbiAgICAgICAgICAgIGlmIChqcS51cmwgPT0gdXJsKVxyXG4gICAgICAgICAgICAgICAgLy8gSXMgdGhlIHNhbWUgdXJsLCBkbyBub3QgYWJvcnQgYmVjYXVzZSBpcyB0aGUgc2FtZSByZXN1bHQgYmVpbmcgcmV0cmlldmVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGpxLmFib3J0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPcHRpb25hbCBkYXRhIHBhcmFtZXRlciAncmVsb2FkLW1vZGUnIGFjY2VwdHMgdmFsdWVzOiBcclxuICAgICAgICAvLyAtICdyZXBsYWNlLW1lJzogVXNlIGh0bWwgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IHJlbG9hZGVkIGVsZW1lbnQgKGFrYTogcmVwbGFjZVdpdGgoKSlcclxuICAgICAgICAvLyAtICdyZXBsYWNlLWNvbnRlbnQnOiAoZGVmYXVsdCkgSHRtbCByZXR1cm5lZCByZXBsYWNlIGN1cnJlbnQgZWxlbWVudCBjb250ZW50IChha2E6IGh0bWwoKSlcclxuICAgICAgICBvcHRpb25zLm1vZGUgPSAkdC5kYXRhKCdyZWxvYWQtbW9kZScpIHx8IG9wdGlvbnMubW9kZTtcclxuXHJcbiAgICAgICAgaWYgKHVybCkge1xyXG5cclxuICAgICAgICAgICAgLy8gTG9hZGluZywgd2l0aCBkZWxheVxyXG4gICAgICAgICAgICB2YXIgbG9hZGluZ3RpbWVyID0gb3B0aW9ucy5sb2FkaW5nLmxvY2tFbGVtZW50ID9cclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0aW5nIGNvbnRlbnQgdXNpbmcgYSBmYWtlIHRlbXAgcGFyZW50IGVsZW1lbnQgdG8gcHJlbG9hZCBpbWFnZSBhbmQgdG8gZ2V0IHJlYWwgbWVzc2FnZSB3aWR0aDpcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG9hZGluZ2NvbnRlbnQgPSAkKCc8ZGl2Lz4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgPyAkKCc8ZGl2IGNsYXNzPVwibG9hZGluZy1tZXNzYWdlXCIvPicpLmFwcGVuZChvcHRpb25zLmxvYWRpbmcubWVzc2FnZSkgOiBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLnNob3dMb2FkaW5nSW5kaWNhdG9yID8gb3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgOiBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nY29udGVudC5jc3MoeyBwb3NpdGlvbjogJ2Fic29sdXRlJywgbGVmdDogLTk5OTk5IH0pLmFwcGVuZFRvKCdib2R5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHcgPSBsb2FkaW5nY29udGVudC53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdjb250ZW50LmRldGFjaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIExvY2tpbmc6XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zLmF1dG9mb2N1cyA9IG9wdGlvbnMuYXV0b2ZvY3VzO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucy53aWR0aCA9IHc7XHJcbiAgICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihsb2FkaW5nY29udGVudC5odG1sKCksICR0LCBvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA/ICdjdXN0b20tbG9hZGluZycgOiAnbG9hZGluZycsIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9LCBvcHRpb25zLmxvYWRpbmcuZGVsYXkpXHJcbiAgICAgICAgICAgICAgICA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICAvLyBQcmVwYXJlIGNvbnRleHRcclxuICAgICAgICAgICAgdmFyIGN0eCA9IHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICR0LFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGxvYWRpbmdUaW1lcjogbG9hZGluZ3RpbWVyXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICAgICAgICAgIGpxID0gJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0OiBjdHhcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBVcmwgaXMgc2V0IGluIHRoZSByZXR1cm5lZCBhamF4IG9iamVjdCBiZWNhdXNlIGlzIG5vdCBzZXQgYnkgYWxsIHZlcnNpb25zIG9mIGpRdWVyeVxyXG4gICAgICAgICAgICBqcS51cmwgPSB1cmw7XHJcblxyXG4gICAgICAgICAgICAvLyBNYXJrIGVsZW1lbnQgYXMgaXMgYmVpbmcgcmVsb2FkZWQsIHRvIGF2b2lkIG11bHRpcGxlIGF0dGVtcHMgYXQgc2FtZSB0aW1lLCBzYXZpbmdcclxuICAgICAgICAgICAgLy8gY3VycmVudCBhamF4IG9iamVjdCB0byBhbGxvdyBiZSBjYW5jZWxsZWRcclxuICAgICAgICAgICAgJHQuZGF0YSgnaXNSZWxvYWRpbmcnLCBqcSk7XHJcbiAgICAgICAgICAgIGpxLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdpc1JlbG9hZGluZycsIG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENhbGxiYWNrczogZmlyc3QgZ2xvYmFscyBhbmQgdGhlbiBmcm9tIG9wdGlvbnMgaWYgdGhleSBhcmUgZGlmZmVyZW50XHJcbiAgICAgICAgICAgIC8vIHN1Y2Nlc3NcclxuICAgICAgICAgICAganEuZG9uZShyZWxvYWQuZGVmYXVsdHMuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN1Y2Nlc3MgIT0gcmVsb2FkLmRlZmF1bHRzLnN1Y2Nlc3MpXHJcbiAgICAgICAgICAgICAgICBqcS5kb25lKG9wdGlvbnMuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIC8vIGVycm9yXHJcbiAgICAgICAgICAgIGpxLmZhaWwocmVsb2FkLmRlZmF1bHRzLmVycm9yKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZXJyb3IgIT0gcmVsb2FkLmRlZmF1bHRzLmVycm9yKVxyXG4gICAgICAgICAgICAgICAganEuZmFpbChvcHRpb25zLmVycm9yKTtcclxuICAgICAgICAgICAgLy8gY29tcGxldGVcclxuICAgICAgICAgICAganEuYWx3YXlzKHJlbG9hZC5kZWZhdWx0cy5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbXBsZXRlICE9IHJlbG9hZC5kZWZhdWx0cy5jb21wbGV0ZSlcclxuICAgICAgICAgICAgICAgIGpxLmRvbmUob3B0aW9ucy5jb21wbGV0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8vIFB1YmxpYyBkZWZhdWx0c1xyXG5yZWxvYWQuZGVmYXVsdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMpO1xyXG5cclxuLy8gUHVibGljIHV0aWxpdGllc1xyXG5yZWxvYWQudXBkYXRlRWxlbWVudCA9IHVwZGF0ZUVsZW1lbnQ7XHJcbnJlbG9hZC5zdG9wTG9hZGluZ1NwaW5uZXIgPSBzdG9wTG9hZGluZ1NwaW5uZXI7XHJcblxyXG4vLyBNb2R1bGVcclxubW9kdWxlLmV4cG9ydHMgPSByZWxvYWQ7IiwiLyoqIEV4dGVuZGVkIHRvZ2dsZS1zaG93LWhpZGUgZnVudGlvbnMuXHJcbiAgICBJYWdvU1JMQGdtYWlsLmNvbVxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICoqL1xyXG4oZnVuY3Rpb24oKXtcclxuXHJcbiAgICAvKiogSW1wbGVtZW50YXRpb246IHJlcXVpcmUgalF1ZXJ5IGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIHRoZVxyXG4gICAgICAgIHB1YmxpYyBtZXRob2RzLlxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24geHRzaChqUXVlcnkpIHtcclxuICAgICAgICB2YXIgJCA9IGpRdWVyeTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGlkZSBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnaGlkZScgYW5kICdmYWRlT3V0JyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5mYWRlT3V0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5zbGlkZVVwKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnaGlkZSdcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAkZS5oaWRlKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hoaWRlJywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICogU2hvdyBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnc2hvdycgYW5kICdmYWRlSW4nIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm1zIGEgZml4IG9uIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzXHJcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGVycm9yIHRoYXQgcHJldmVudHMgZnJvbSBydW5uaW5nXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdHMgb24gZWxlbWVudHMgdGhhdCBhcmUgYWxyZWFkeSB2aXNpYmxlLFxyXG4gICAgICAgICAgICAvLyB3aGF0IGxldHMgdGhlIHBvc3NpYmlsaXR5IG9mIGdldCBhIG1pZGRsZS1hbmltYXRlZFxyXG4gICAgICAgICAgICAvLyBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFdlIGp1c3QgY2hhbmdlIGRpc3BsYXk6bm9uZSwgZm9yY2luZyB0byAnaXMtdmlzaWJsZScgdG9cclxuICAgICAgICAgICAgLy8gYmUgZmFsc2UgYW5kIHRoZW4gcnVubmluZyB0aGUgZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBmbGlja2VyaW5nIGVmZmVjdCwgYmVjYXVzZSBqUXVlcnkganVzdCByZXNldHNcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBvbiBlZmZlY3Qgc3RhcnQuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuZmFkZUluKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ3Nob3cnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hzaG93JywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZW5lcmljIHV0aWxpdHkgZm9yIGhpZ2hseSBjb25maWd1cmFibGUgalF1ZXJ5LnRvZ2dsZSB3aXRoIHN1cHBvcnRcclxuICAgICAgICAgICAgdG8gc3BlY2lmeSB0aGUgdG9nZ2xlIHZhbHVlIGV4cGxpY2l0eSBmb3IgYW55IGtpbmQgb2YgZWZmZWN0OiBqdXN0IHBhc3MgdHJ1ZSBhcyBzZWNvbmQgcGFyYW1ldGVyICd0b2dnbGUnIHRvIHNob3dcclxuICAgICAgICAgICAgYW5kIGZhbHNlIHRvIGhpZGUuIFRvZ2dsZSBtdXN0IGJlIHN0cmljdGx5IGEgQm9vbGVhbiB2YWx1ZSB0byBhdm9pZCBhdXRvLWRldGVjdGlvbi5cclxuICAgICAgICAgICAgVG9nZ2xlIHBhcmFtZXRlciBjYW4gYmUgb21pdHRlZCB0byBhdXRvLWRldGVjdCBpdCwgYW5kIHNlY29uZCBwYXJhbWV0ZXIgY2FuIGJlIHRoZSBhbmltYXRpb24gb3B0aW9ucy5cclxuICAgICAgICAgICAgQWxsIHRoZSBvdGhlcnMgYmVoYXZlIGV4YWN0bHkgYXMgaGlkZUVsZW1lbnQgYW5kIHNob3dFbGVtZW50LlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUVsZW1lbnQoZWxlbWVudCwgdG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBub3QgYSBib29sZWFuXHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUgIT09IHRydWUgJiYgdG9nZ2xlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIGFuIG9iamVjdCwgdGhlbiBpcyB0aGUgb3B0aW9ucyBhcyBzZWNvbmQgcGFyYW1ldGVyXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRvZ2dsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRvZ2dsZTtcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tZGV0ZWN0IHRvZ2dsZSwgaXQgY2FuIHZhcnkgb24gYW55IGVsZW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGRldGVjdGlvbiBhbmQgYWN0aW9uIG11c3QgYmUgZG9uZSBwZXIgZWxlbWVudDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV1c2luZyBmdW5jdGlvbiwgd2l0aCBleHBsaWNpdCB0b2dnbGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsICEkKHRoaXMpLmlzKCc6dmlzaWJsZScpLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUpXHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBEbyBqUXVlcnkgaW50ZWdyYXRpb24gYXMgeHRvZ2dsZSwgeHNob3csIHhoaWRlXHJcbiAgICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsdWdJbihqUXVlcnkpIHtcclxuICAgICAgICAgICAgLyoqIHRvZ2dsZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4dG9nZ2xlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnh0b2dnbGUgPSBmdW5jdGlvbiB4dG9nZ2xlKHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCB0b2dnbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogc2hvd0VsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhzaG93ID0gZnVuY3Rpb24geHNob3cob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBoaWRlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhoaWRlID0gZnVuY3Rpb24geGhpZGUob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9ydGluZzpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0b2dnbGVFbGVtZW50OiB0b2dnbGVFbGVtZW50LFxyXG4gICAgICAgICAgICBzaG93RWxlbWVudDogc2hvd0VsZW1lbnQsXHJcbiAgICAgICAgICAgIGhpZGVFbGVtZW50OiBoaWRlRWxlbWVudCxcclxuICAgICAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vZHVsZVxyXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIHh0c2gpO1xyXG4gICAgfSBlbHNlIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICAgICAgdmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0geHRzaChqUXVlcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBOb3JtYWwgc2NyaXB0IGxvYWQsIGlmIGpRdWVyeSBpcyBnbG9iYWwgKGF0IHdpbmRvdyksIGl0cyBleHRlbmRlZCBhdXRvbWF0aWNhbGx5ICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5qUXVlcnkgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICB4dHNoKHdpbmRvdy5qUXVlcnkpLnBsdWdJbih3aW5kb3cualF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLyogU29tZSB1dGlsaXRpZXMgZm9yIHVzZSB3aXRoIGpRdWVyeSBvciBpdHMgZXhwcmVzc2lvbnNcclxuICAgIHRoYXQgYXJlIG5vdCBwbHVnaW5zLlxyXG4qL1xyXG5mdW5jdGlvbiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWyAjOyYsLisqflxcJzpcIiFeJFtcXF0oKT0+fFxcL10pL2csICdcXFxcJDEnKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTogZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZVxyXG4gICAgfTtcclxuIiwiLyogQXNzZXRzIGxvYWRlciB3aXRoIGxvYWRpbmcgY29uZmlybWF0aW9uIChtYWlubHkgZm9yIHNjcmlwdHMpXHJcbiAgICBiYXNlZCBvbiBNb2Rlcm5penIveWVwbm9wZSBsb2FkZXIuXHJcbiovXHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbmV4cG9ydHMubG9hZCA9IGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICBvcHRzID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIHNjcmlwdHM6IFtdLFxyXG4gICAgICAgIGNvbXBsZXRlOiBudWxsLFxyXG4gICAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBudWxsLFxyXG4gICAgICAgIGxvYWREZWxheTogMCxcclxuICAgICAgICB0cmlhbHNJbnRlcnZhbDogNTAwXHJcbiAgICB9LCBvcHRzKTtcclxuICAgIGlmICghb3B0cy5zY3JpcHRzLmxlbmd0aCkgcmV0dXJuO1xyXG4gICAgZnVuY3Rpb24gcGVyZm9ybUNvbXBsZXRlKCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgKG9wdHMuY29tcGxldGVWZXJpZmljYXRpb24pICE9PSAnZnVuY3Rpb24nIHx8IG9wdHMuY29tcGxldGVWZXJpZmljYXRpb24oKSlcclxuICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSgpO1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KHBlcmZvcm1Db21wbGV0ZSwgb3B0cy50cmlhbHNJbnRlcnZhbCk7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUud2FybilcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignTEMubG9hZC5jb21wbGV0ZVZlcmlmaWNhdGlvbiBmYWlsZWQgZm9yICcgKyBvcHRzLnNjcmlwdHNbMF0gKyAnIHJldHJ5aW5nIGl0IGluICcgKyBvcHRzLnRyaWFsc0ludGVydmFsICsgJ21zJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gbG9hZCgpIHtcclxuICAgICAgICBNb2Rlcm5penIubG9hZCh7XHJcbiAgICAgICAgICAgIGxvYWQ6IG9wdHMuc2NyaXB0cyxcclxuICAgICAgICAgICAgY29tcGxldGU6IG9wdHMuY29tcGxldGUgPyBwZXJmb3JtQ29tcGxldGUgOiBudWxsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAob3B0cy5sb2FkRGVsYXkpXHJcbiAgICAgICAgc2V0VGltZW91dChsb2FkLCBvcHRzLmxvYWREZWxheSk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgbG9hZCgpO1xyXG59OyIsIi8qLS0tLS0tLS0tLS0tXHJcblV0aWxpdGllcyB0byBtYW5pcHVsYXRlIG51bWJlcnMsIGFkZGl0aW9uYWxseVxyXG50byB0aGUgb25lcyBhdCBNYXRoXHJcbi0tLS0tLS0tLS0tLSovXHJcblxyXG4vKiogRW51bWVyYXRpb24gdG8gYmUgdXNlcyBieSBmdW5jdGlvbnMgdGhhdCBpbXBsZW1lbnRzICdyb3VuZGluZycgb3BlcmF0aW9ucyBvbiBkaWZmZXJlbnRcclxuZGF0YSB0eXBlcy5cclxuSXQgaG9sZHMgdGhlIGRpZmZlcmVudCB3YXlzIGEgcm91bmRpbmcgb3BlcmF0aW9uIGNhbiBiZSBhcHBseS5cclxuKiovXHJcbnZhciByb3VuZGluZ1R5cGVFbnVtID0ge1xyXG4gICAgRG93bjogLTEsXHJcbiAgICBOZWFyZXN0OiAwLFxyXG4gICAgVXA6IDFcclxufTtcclxuXHJcbmZ1bmN0aW9uIHJvdW5kVG8obnVtYmVyLCBkZWNpbWFscywgcm91bmRpbmdUeXBlKSB7XHJcbiAgICAvLyBjYXNlIE5lYXJlc3QgaXMgdGhlIGRlZmF1bHQ6XHJcbiAgICB2YXIgZiA9IG5lYXJlc3RUbztcclxuICAgIHN3aXRjaCAocm91bmRpbmdUeXBlKSB7XHJcbiAgICAgICAgY2FzZSByb3VuZGluZ1R5cGVFbnVtLkRvd246XHJcbiAgICAgICAgICAgIGYgPSBmbG9vclRvO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIHJvdW5kaW5nVHlwZUVudW0uVXA6XHJcbiAgICAgICAgICAgIGYgPSBjZWlsVG87XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGYobnVtYmVyLCBkZWNpbWFscyk7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXQgY2FuIHN1YnN0cmFjdCBpbnRlZ2VyIGRlY2ltYWxzIGJ5IHByb3ZpZGluZyBhIG5lZ2F0aXZlXHJcbm51bWJlciBvZiBkZWNpbWFscy5cclxuKiovXHJcbmZ1bmN0aW9uIG5lYXJlc3RUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5yb3VuZChudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBVcCBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXRzIHNpbWlsYXIgdG8gcm91bmRUbywgYnV0IHRoZSBudW1iZXIgaXMgZXZlciByb3VuZGVkIHVwLFxyXG50byB0aGUgbG93ZXIgaW50ZWdlciBncmVhdGVyIG9yIGVxdWFscyB0byB0aGUgbnVtYmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gY2VpbFRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLmNlaWwobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vKiogUm91bmQgRG93biBhIG51bWJlciB0byB0aGUgc3BlY2lmaWVkIG51bWJlciBvZiBkZWNpbWFscy5cclxuSXRzIHNpbWlsYXIgdG8gcm91bmRUbywgYnV0IHRoZSBudW1iZXIgaXMgZXZlciByb3VuZGVkIGRvd24sXHJcbnRvIHRoZSBiaWdnZXIgaW50ZWdlciBsb3dlciBvciBlcXVhbHMgdG8gdGhlIG51bWJlci5cclxuKiovXHJcbmZ1bmN0aW9uIGZsb29yVG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgcm91bmRpbmdUeXBlRW51bTogcm91bmRpbmdUeXBlRW51bSxcclxuICAgICAgICByb3VuZFRvOiByb3VuZFRvLFxyXG4gICAgICAgIG5lYXJlc3RUbzogbmVhcmVzdFRvLFxyXG4gICAgICAgIGNlaWxUbzogY2VpbFRvLFxyXG4gICAgICAgIGZsb29yVG86IGZsb29yVG9cclxuICAgIH07IiwiZnVuY3Rpb24gbW92ZUZvY3VzVG8oZWwsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWFyZ2luVG9wOiAzMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6ICQoZWwpLm9mZnNldCgpLnRvcCAtIG9wdGlvbnMubWFyZ2luVG9wIH0sIDUwMCwgbnVsbCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb3ZlRm9jdXNUbztcclxufSIsIi8qIFNvbWUgdXRpbGl0aWVzIHRvIGZvcm1hdCBhbmQgZXh0cmFjdCBudW1iZXJzLCBmcm9tIHRleHQgb3IgRE9NLlxyXG4gKi9cclxudmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgaTE4biA9IHJlcXVpcmUoJy4vaTE4bicpLFxyXG4gICAgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuZnVuY3Rpb24gZ2V0TW9uZXlOdW1iZXIodiwgYWx0KSB7XHJcbiAgICBhbHQgPSBhbHQgfHwgMDtcclxuICAgIGlmICh2IGluc3RhbmNlb2YgalF1ZXJ5KVxyXG4gICAgICAgIHYgPSB2LnZhbCgpIHx8IHYudGV4dCgpO1xyXG4gICAgdiA9IHBhcnNlRmxvYXQodlxyXG4gICAgICAgIC5yZXBsYWNlKC9bJOKCrF0vZywgJycpXHJcbiAgICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChMQy5udW1lcmljTWlsZXNTZXBhcmF0b3JbaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmN1bHR1cmVdLCAnZycpLCAnJylcclxuICAgICk7XHJcbiAgICByZXR1cm4gaXNOYU4odikgPyBhbHQgOiB2O1xyXG59XHJcbmZ1bmN0aW9uIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcodikge1xyXG4gICAgdmFyIGN1bHR1cmUgPSBpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY3VsdHVyZTtcclxuICAgIC8vIEZpcnN0LCByb3VuZCB0byAyIGRlY2ltYWxzXHJcbiAgICB2ID0gbXUucm91bmRUbyh2LCAyKTtcclxuICAgIC8vIEdldCB0aGUgZGVjaW1hbCBwYXJ0IChyZXN0KVxyXG4gICAgdmFyIHJlc3QgPSBNYXRoLnJvdW5kKHYgKiAxMDAgJSAxMDApO1xyXG4gICAgcmV0dXJuICgnJyArXHJcbiAgICAvLyBJbnRlZ2VyIHBhcnQgKG5vIGRlY2ltYWxzKVxyXG4gICAgICAgIE1hdGguZmxvb3IodikgK1xyXG4gICAgLy8gRGVjaW1hbCBzZXBhcmF0b3IgZGVwZW5kaW5nIG9uIGxvY2FsZVxyXG4gICAgICAgIGkxOG4ubnVtZXJpY0RlY2ltYWxTZXBhcmF0b3JbY3VsdHVyZV0gK1xyXG4gICAgLy8gRGVjaW1hbHMsIGV2ZXIgdHdvIGRpZ2l0c1xyXG4gICAgICAgIE1hdGguZmxvb3IocmVzdCAvIDEwKSArIHJlc3QgJSAxMFxyXG4gICAgKTtcclxufVxyXG5mdW5jdGlvbiBudW1iZXJUb01vbmV5U3RyaW5nKHYpIHtcclxuICAgIHZhciBjb3VudHJ5ID0gaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmNvdW50cnk7XHJcbiAgICAvLyBUd28gZGlnaXRzIGluIGRlY2ltYWxzIGZvciByb3VuZGVkIHZhbHVlIHdpdGggbW9uZXkgc3ltYm9sIGFzIGZvclxyXG4gICAgLy8gY3VycmVudCBsb2NhbGVcclxuICAgIHJldHVybiAoaTE4bi5tb25leVN5bWJvbFByZWZpeFtjb3VudHJ5XSArIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcodikgKyBpMThuLm1vbmV5U3ltYm9sU3VmaXhbY291bnRyeV0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldE1vbmV5TnVtYmVyKHYsIGVsKSB7XHJcbiAgICAvLyBHZXQgdmFsdWUgaW4gbW9uZXkgZm9ybWF0OlxyXG4gICAgdiA9IG51bWJlclRvTW9uZXlTdHJpbmcodik7XHJcbiAgICAvLyBTZXR0aW5nIHZhbHVlOlxyXG4gICAgaWYgKGVsIGluc3RhbmNlb2YgalF1ZXJ5KVxyXG4gICAgICAgIGlmIChlbC5pcygnOmlucHV0JykpXHJcbiAgICAgICAgICAgIGVsLnZhbCh2KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGVsLnRleHQodik7XHJcbiAgICByZXR1cm4gdjtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZ2V0TW9uZXlOdW1iZXI6IGdldE1vbmV5TnVtYmVyLFxyXG4gICAgICAgIG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmc6IG51bWJlclRvVHdvRGVjaW1hbHNTdHJpbmcsXHJcbiAgICAgICAgbnVtYmVyVG9Nb25leVN0cmluZzogbnVtYmVyVG9Nb25leVN0cmluZyxcclxuICAgICAgICBzZXRNb25leU51bWJlcjogc2V0TW9uZXlOdW1iZXJcclxuICAgIH07IiwiLyoqXHJcbiogUGxhY2Vob2xkZXIgcG9seWZpbGwuXHJcbiogQWRkcyBhIG5ldyBqUXVlcnkgcGxhY2VIb2xkZXIgbWV0aG9kIHRvIHNldHVwIG9yIHJlYXBwbHkgcGxhY2VIb2xkZXJcclxuKiBvbiBlbGVtZW50cyAocmVjb21tZW50ZWQgdG8gYmUgYXBwbHkgb25seSB0byBzZWxlY3RvciAnW3BsYWNlaG9sZGVyXScpO1xyXG4qIHRoYXRzIG1ldGhvZCBpcyBmYWtlIG9uIGJyb3dzZXJzIHRoYXQgaGFzIG5hdGl2ZSBzdXBwb3J0IGZvciBwbGFjZWhvbGRlclxyXG4qKi9cclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpLFxyXG4gICAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFBsYWNlSG9sZGVycygpIHtcclxuICAgIGlmIChNb2Rlcm5penIuaW5wdXQucGxhY2Vob2xkZXIpXHJcbiAgICAgICAgJC5mbi5wbGFjZWhvbGRlciA9IGZ1bmN0aW9uICgpIHsgfTtcclxuICAgIGVsc2VcclxuICAgICAgICAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBkb1BsYWNlaG9sZGVyKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgIGlmICghJHQuZGF0YSgncGxhY2Vob2xkZXItc3VwcG9ydGVkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAkdC5vbignZm9jdXNpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQub24oJ2ZvY3Vzb3V0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICR0LmRhdGEoJ3BsYWNlaG9sZGVyLXN1cHBvcnRlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJC5mbi5wbGFjZWhvbGRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmVhY2goZG9QbGFjZWhvbGRlcik7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpO1xyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5hamF4Q29tcGxldGUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pKCk7XHJcbn07IiwiLyogUG9wdXAgZnVuY3Rpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5yZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKlxyXG4qIFBvcHVwIHJlbGF0ZWQgXHJcbiogZnVuY3Rpb25zXHJcbiovXHJcbmZ1bmN0aW9uIHBvcHVwU2l6ZShzaXplKSB7XHJcbiAgICB2YXIgcyA9IChzaXplID09ICdsYXJnZScgPyAwLjggOiAoc2l6ZSA9PSAnbWVkaXVtJyA/IDAuNSA6IChzaXplID09ICdzbWFsbCcgPyAwLjIgOiBzaXplIHx8IDAuNSkpKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgd2lkdGg6IE1hdGgucm91bmQoJCh3aW5kb3cpLndpZHRoKCkgKiBzKSxcclxuICAgICAgICBoZWlnaHQ6IE1hdGgucm91bmQoJCh3aW5kb3cpLmhlaWdodCgpICogcyksXHJcbiAgICAgICAgc2l6ZUZhY3Rvcjogc1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBwb3B1cFN0eWxlKHNpemUpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3Vyc29yOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgd2lkdGg6IHNpemUud2lkdGggKyAncHgnLFxyXG4gICAgICAgIGxlZnQ6IE1hdGgucm91bmQoKCQod2luZG93KS53aWR0aCgpIC0gc2l6ZS53aWR0aCkgLyAyKSAtIDI1ICsgJ3B4JyxcclxuICAgICAgICBoZWlnaHQ6IHNpemUuaGVpZ2h0ICsgJ3B4JyxcclxuICAgICAgICB0b3A6IE1hdGgucm91bmQoKCQod2luZG93KS5oZWlnaHQoKSAtIHNpemUuaGVpZ2h0KSAvIDIpIC0gMzIgKyAncHgnLFxyXG4gICAgICAgIHBhZGRpbmc6ICczNHB4IDI1cHggMzBweCcsXHJcbiAgICAgICAgb3ZlcmZsb3c6ICdhdXRvJyxcclxuICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAnLW1vei1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZycsXHJcbiAgICAgICAgJy13ZWJraXQtYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmctYm94JyxcclxuICAgICAgICAnYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmctYm94J1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBwb3B1cCh1cmwsIHNpemUsIGNvbXBsZXRlLCBsb2FkaW5nVGV4dCwgb3B0aW9ucykge1xyXG4gICAgaWYgKHR5cGVvZiAodXJsKSA9PT0gJ29iamVjdCcpXHJcbiAgICAgICAgb3B0aW9ucyA9IHVybDtcclxuXHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgdXJsOiB0eXBlb2YgKHVybCkgPT09ICdzdHJpbmcnID8gdXJsIDogJycsXHJcbiAgICAgICAgc2l6ZTogc2l6ZSB8fCB7IHdpZHRoOiAwLCBoZWlnaHQ6IDAgfSxcclxuICAgICAgICBjb21wbGV0ZTogY29tcGxldGUsXHJcbiAgICAgICAgbG9hZGluZ1RleHQ6IGxvYWRpbmdUZXh0LFxyXG4gICAgICAgIGNsb3NhYmxlOiB7XHJcbiAgICAgICAgICAgIG9uTG9hZDogZmFsc2UsXHJcbiAgICAgICAgICAgIGFmdGVyTG9hZDogdHJ1ZSxcclxuICAgICAgICAgICAgb25FcnJvcjogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b1NpemU6IGZhbHNlLFxyXG4gICAgICAgIGNvbnRhaW5lckNsYXNzOiAnJyxcclxuICAgICAgICBhdXRvRm9jdXM6IHRydWVcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIC8vIFByZXBhcmUgc2l6ZSBhbmQgbG9hZGluZ1xyXG4gICAgb3B0aW9ucy5sb2FkaW5nVGV4dCA9IG9wdGlvbnMubG9hZGluZ1RleHQgfHwgJyc7XHJcbiAgICBpZiAodHlwZW9mIChvcHRpb25zLnNpemUud2lkdGgpID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICBvcHRpb25zLnNpemUgPSBwb3B1cFNpemUob3B0aW9ucy5zaXplKTtcclxuXHJcbiAgICAkLmJsb2NrVUkoe1xyXG4gICAgICAgIG1lc3NhZ2U6IChvcHRpb25zLmNsb3NhYmxlLm9uTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKSArXHJcbiAgICAgICAnPGltZyBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyArIG9wdGlvbnMubG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2VudGVyWTogZmFsc2UsXHJcbiAgICAgICAgY3NzOiBwb3B1cFN0eWxlKG9wdGlvbnMuc2l6ZSksXHJcbiAgICAgICAgb3ZlcmxheUNTUzogeyBjdXJzb3I6ICdkZWZhdWx0JyB9LFxyXG4gICAgICAgIGZvY3VzSW5wdXQ6IHRydWVcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIExvYWRpbmcgVXJsIHdpdGggQWpheCBhbmQgcGxhY2UgY29udGVudCBpbnNpZGUgdGhlIGJsb2NrZWQtYm94XHJcbiAgICAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogb3B0aW9ucy51cmwsXHJcbiAgICAgICAgY29udGV4dDoge1xyXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxyXG4gICAgICAgICAgICBjb250YWluZXI6ICQoJy5ibG9ja01zZycpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICB2YXIgY29udGFpbmVyID0gdGhpcy5jb250YWluZXIuYWRkQ2xhc3Mob3B0aW9ucy5jb250YWluZXJDbGFzcyk7XHJcbiAgICAgICAgICAgIC8vIEFkZCBjbG9zZSBidXR0b24gaWYgcmVxdWlyZXMgaXQgb3IgZW1wdHkgbWVzc2FnZSBjb250ZW50IHRvIGFwcGVuZCB0aGVuIG1vcmVcclxuICAgICAgICAgICAgY29udGFpbmVyLmh0bWwob3B0aW9ucy5jbG9zYWJsZS5hZnRlckxvYWQgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJyk7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50SG9sZGVyID0gY29udGFpbmVyLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNvbnRlbnRcIi8+JykuY2hpbGRyZW4oJy5jb250ZW50Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLkNvZGUgJiYgZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgICAgICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBVbmV4cGVjdGVkIGNvZGUsIHNob3cgcmVzdWx0XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5hcHBlbmQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gUGFnZSBjb250ZW50IGdvdCwgcGFzdGUgaW50byB0aGUgcG9wdXAgaWYgaXMgcGFydGlhbCBodG1sICh1cmwgc3RhcnRzIHdpdGggJClcclxuICAgICAgICAgICAgICAgIGlmICgvKCheXFwkKXwoXFwvXFwkKSkvLnRlc3Qob3B0aW9ucy51cmwpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5hcHBlbmQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50SG9sZGVyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvU2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBdm9pZCBtaXNjYWxjdWxhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc3R5bGUud2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCd3aWR0aCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2SGVpZ2h0ID0gY29udGVudEhvbGRlclswXS5zdHlsZS5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHZXQgZGF0YVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWN0dWFsV2lkdGggPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0dWFsSGVpZ2h0ID0gY29udGVudEhvbGRlclswXS5zY3JvbGxIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250V2lkdGggPSBjb250YWluZXIud2lkdGgoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRIZWlnaHQgPSBjb250YWluZXIuaGVpZ2h0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYVdpZHRoID0gY29udGFpbmVyLm91dGVyV2lkdGgodHJ1ZSkgLSBjb250V2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYUhlaWdodCA9IGNvbnRhaW5lci5vdXRlckhlaWdodCh0cnVlKSAtIGNvbnRIZWlnaHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhXaWR0aCA9ICQod2luZG93KS53aWR0aCgpIC0gZXh0cmFXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodCA9ICQod2luZG93KS5oZWlnaHQoKSAtIGV4dHJhSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgYW5kIGFwcGx5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaXplID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGFjdHVhbFdpZHRoID4gbWF4V2lkdGggPyBtYXhXaWR0aCA6IGFjdHVhbFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBhY3R1YWxIZWlnaHQgPiBtYXhIZWlnaHQgPyBtYXhIZWlnaHQgOiBhY3R1YWxIZWlnaHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyLmFuaW1hdGUoc2l6ZSwgMzAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgbWlzY2FsY3VsYXRpb25zIGNvcnJlY3Rpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCd3aWR0aCcsIHByZXZXaWR0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuY3NzKCdoZWlnaHQnLCBwcmV2SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEVsc2UsIGlmIHVybCBpcyBhIGZ1bGwgaHRtbCBwYWdlIChub3JtYWwgcGFnZSksIHB1dCBjb250ZW50IGludG8gYW4gaWZyYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShkYXRhLCB0aGlzLm9wdGlvbnMuc2l6ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXBsYWNlIGJsb2NraW5nIGVsZW1lbnQgY29udGVudCAodGhlIGxvYWRpbmcpIHdpdGggdGhlIGlmcmFtZTpcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9Gb2N1cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oaWZyYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIGVycm9yOiBmdW5jdGlvbiAoaiwgdCwgZXgpIHtcclxuICAgICAgICAgICAgJCgnZGl2LmJsb2NrTXNnJykuaHRtbCgob3B0aW9ucy5jbG9zYWJsZS5vbkVycm9yID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICsgJzxkaXYgY2xhc3M9XCJjb250ZW50XCI+UGFnZSBub3QgZm91bmQ8L2Rpdj4nKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5pbmZvKSBjb25zb2xlLmluZm8oXCJQb3B1cC1hamF4IGVycm9yOiBcIiArIGV4KTtcclxuICAgICAgICB9LCBjb21wbGV0ZTogb3B0aW9ucy5jb21wbGV0ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgdmFyIHJldHVybmVkQmxvY2sgPSAkKCcuYmxvY2tVSScpO1xyXG5cclxuICAgIHJldHVybmVkQmxvY2sub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgcmV0dXJuZWRCbG9jay50cmlnZ2VyKCdwb3B1cC1jbG9zZWQnKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHJldHVybmVkQmxvY2suY2xvc2VQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgIH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldEJsb2NrRWxlbWVudCA9IGZ1bmN0aW9uIGdldEJsb2NrRWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmlsdGVyKCcuYmxvY2tNc2cnKTsgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0Q29udGVudEVsZW1lbnQgPSBmdW5jdGlvbiBnZXRDb250ZW50RWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmluZCgnLmNvbnRlbnQnKTsgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0T3ZlcmxheUVsZW1lbnQgPSBmdW5jdGlvbiBnZXRPdmVybGF5RWxlbWVudCgpIHsgcmV0dXJuIHJldHVybmVkQmxvY2suZmlsdGVyKCcuYmxvY2tPdmVybGF5Jyk7IH07XHJcbiAgICByZXR1cm4gcmV0dXJuZWRCbG9jaztcclxufVxyXG5cclxuLyogU29tZSBwb3B1cCB1dGlsaXRpdGVzL3Nob3J0aGFuZHMgKi9cclxuZnVuY3Rpb24gbWVzc2FnZVBvcHVwKG1lc3NhZ2UsIGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgJ2JvZHknKTtcclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdi8+JykudGV4dChtZXNzYWdlKTtcclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY29udGFpbmVyLCAnbWVzc2FnZS1wb3B1cCBmdWxsLWJsb2NrJywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiB0cnVlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb25uZWN0UG9wdXBBY3Rpb24oYXBwbHlUb1NlbGVjdG9yKSB7XHJcbiAgICBhcHBseVRvU2VsZWN0b3IgPSBhcHBseVRvU2VsZWN0b3IgfHwgJy5wb3B1cC1hY3Rpb24nO1xyXG4gICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgYXBwbHlUb1NlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGMgPSAkKCQodGhpcykuYXR0cignaHJlZicpKS5jbG9uZSgpO1xyXG4gICAgICAgIGlmIChjLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIGRvY3VtZW50LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vIFRoZSBwb3B1cCBmdW5jdGlvbiBjb250YWlucyBhbGwgdGhlIG90aGVycyBhcyBtZXRob2RzXHJcbnBvcHVwLnNpemUgPSBwb3B1cFNpemU7XHJcbnBvcHVwLnN0eWxlID0gcG9wdXBTdHlsZTtcclxucG9wdXAuY29ubmVjdEFjdGlvbiA9IGNvbm5lY3RQb3B1cEFjdGlvbjtcclxucG9wdXAubWVzc2FnZSA9IG1lc3NhZ2VQb3B1cDtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHBvcHVwOyIsIi8qKioqIFBvc3RhbCBDb2RlOiBvbiBmbHksIHNlcnZlci1zaWRlIHZhbGlkYXRpb24gKioqKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBiYXNlVXJsOiAnLycsXHJcbiAgICAgICAgc2VsZWN0b3I6ICdbZGF0YS12YWwtcG9zdGFsY29kZV0nLFxyXG4gICAgICAgIHVybDogJ0pTT04vVmFsaWRhdGVQb3N0YWxDb2RlLydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCBvcHRpb25zLnNlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBJZiBjb250YWlucyBhIHZhbHVlICh0aGlzIG5vdCB2YWxpZGF0ZSBpZiBpcyByZXF1aXJlZCkgYW5kIFxyXG4gICAgICAgIC8vIGhhcyB0aGUgZXJyb3IgZGVzY3JpcHRpdmUgbWVzc2FnZSwgdmFsaWRhdGUgdGhyb3VnaCBhamF4XHJcbiAgICAgICAgdmFyIHBjID0gJHQudmFsKCk7XHJcbiAgICAgICAgdmFyIG1zZyA9ICR0LmRhdGEoJ3ZhbC1wb3N0YWxjb2RlJyk7XHJcbiAgICAgICAgaWYgKHBjICYmIG1zZykge1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiBvcHRpb25zLmJhc2VVcmwgKyBvcHRpb25zLnVybCxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHsgUG9zdGFsQ29kZTogcGMgfSxcclxuICAgICAgICAgICAgICAgIGNhY2hlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdKU09OJyxcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5SZXN1bHQuSXNWYWxpZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQucmVtb3ZlQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKS5hZGRDbGFzcygndmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnNpYmxpbmdzKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50ZXh0KCcnKS5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYW4gc3VtbWFyeSBlcnJvcnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbmQoJz4gdWwgPiBsaScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS50ZXh0KCkgPT0gbXNnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdpbnB1dC12YWxpZGF0aW9uLWVycm9yJykucmVtb3ZlQ2xhc3MoJ3ZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5zaWJsaW5ncygnLmZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8c3BhbiBmb3I9XCInICsgJHQuYXR0cignbmFtZScpICsgJ1wiIGdlbmVyYXRlZD1cInRydWVcIj4nICsgbXNnICsgJzwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBzdW1tYXJ5IGVycm9yIChpZiB0aGVyZSBpcyBub3QpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNoaWxkcmVuKCd1bCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGxpPicgKyBtc2cgKyAnPC9saT4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTsiLCIvKiogQXBwbHkgZXZlciBhIHJlZGlyZWN0IHRvIHRoZSBnaXZlbiBVUkwsIGlmIHRoaXMgaXMgYW4gaW50ZXJuYWwgVVJMIG9yIHNhbWVcclxucGFnZSwgaXQgZm9yY2VzIGEgcGFnZSByZWxvYWQgZm9yIHRoZSBnaXZlbiBVUkwuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByZWRpcmVjdFRvKHVybCkge1xyXG4gICAgLy8gQmxvY2sgdG8gYXZvaWQgbW9yZSB1c2VyIGludGVyYWN0aW9uczpcclxuICAgICQuYmxvY2tVSSh7IG1lc3NhZ2U6ICcnIH0pOyAvL2xvYWRpbmdCbG9jayk7XHJcbiAgICAvLyBDaGVja2luZyBpZiBpcyBiZWluZyByZWRpcmVjdGluZyBvciBub3RcclxuICAgIHZhciByZWRpcmVjdGVkID0gZmFsc2U7XHJcbiAgICAkKHdpbmRvdykub24oJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uIGNoZWNrUmVkaXJlY3QoKSB7XHJcbiAgICAgICAgcmVkaXJlY3RlZCA9IHRydWU7XHJcbiAgICB9KTtcclxuICAgIC8vIE5hdmlnYXRlIHRvIG5ldyBsb2NhdGlvbjpcclxuICAgIHdpbmRvdy5sb2NhdGlvbiA9IHVybDtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIElmIHBhZ2Ugbm90IGNoYW5nZWQgKHNhbWUgdXJsIG9yIGludGVybmFsIGxpbmspLCBwYWdlIGNvbnRpbnVlIGV4ZWN1dGluZyB0aGVuIHJlZnJlc2g6XHJcbiAgICAgICAgaWYgKCFyZWRpcmVjdGVkKVxyXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICB9LCA1MCk7XHJcbn07XHJcbiIsIi8qKiBTYW5pdGl6ZSB0aGUgd2hpdGVzcGFjZXMgaW4gYSB0ZXh0IGJ5OlxyXG4tIHJlcGxhY2luZyBjb250aWd1b3VzIHdoaXRlc3BhY2VzIGNoYXJhY3RlcmVzIChhbnkgbnVtYmVyIG9mIHJlcGV0aXRpb24gXHJcbmFuZCBhbnkga2luZCBvZiB3aGl0ZSBjaGFyYWN0ZXIpIGJ5IGEgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbi0gcmVwbGFjZSBlbmNvZGVkIG5vbi1icmVha2luZy1zcGFjZXMgYnkgYSBub3JtYWwgd2hpdGUtc3BhY2VcclxuLSByZW1vdmUgc3RhcnRpbmcgYW5kIGVuZGluZyB3aGl0ZS1zcGFjZXNcclxuLSBldmVyIHJldHVybiBhIHN0cmluZywgZW1wdHkgd2hlbiBudWxsXHJcbioqL1xyXG5mdW5jdGlvbiBzYW5pdGl6ZVdoaXRlc3BhY2VzKHRleHQpIHtcclxuICAgIC8vIEV2ZXIgcmV0dXJuIGEgc3RyaW5nLCBlbXB0eSB3aGVuIG51bGxcclxuICAgIHRleHQgPSAodGV4dCB8fCAnJylcclxuICAgIC8vIFJlcGxhY2UgYW55IGtpbmQgb2YgY29udGlndW91cyB3aGl0ZXNwYWNlcyBjaGFyYWN0ZXJzIGJ5IGEgc2luZ2xlIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4gICAgLy8gKHRoYXRzIGluY2x1ZGUgcmVwbGFjZSBlbmNvbmRlZCBub24tYnJlYWtpbmctc3BhY2VzLFxyXG4gICAgLy8gYW5kIGR1cGxpY2F0ZWQtcmVwZWF0ZWQgYXBwZWFyYW5jZXMpXHJcbiAgICAucmVwbGFjZSgvXFxzKy9nLCAnICcpO1xyXG4gICAgLy8gUmVtb3ZlIHN0YXJ0aW5nIGFuZCBlbmRpbmcgd2hpdGVzcGFjZXNcclxuICAgIHJldHVybiAkLnRyaW0odGV4dCk7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHNhbml0aXplV2hpdGVzcGFjZXM7IiwiLyoqIEN1c3RvbSBMb2Nvbm9taWNzICdsaWtlIGJsb2NrVUknIHBvcHVwc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSxcclxuICAgIGF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4vYXV0b0ZvY3VzJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxuXHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrKGNvbnRlbnRCb3gsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7XHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgY2xvc2FibGU6IGZhbHNlLFxyXG4gICAgICAgIGNlbnRlcjogZmFsc2UsXHJcbiAgICAgICAgLyogYXMgYSB2YWxpZCBvcHRpb25zIHBhcmFtZXRlciBmb3IgTEMuaGlkZUVsZW1lbnQgZnVuY3Rpb24gKi9cclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZHVyYXRpb246IDYwMCxcclxuICAgICAgICAgICAgZWZmZWN0OiAnZmFkZSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgICAgICBhdXRvZm9jdXNPcHRpb25zOiB7IG1hcmdpblRvcDogNjAgfSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBjb250ZW50Qm94ID0gJChjb250ZW50Qm94KTtcclxuICAgIHZhciBmdWxsID0gZmFsc2U7XHJcbiAgICBpZiAoYmxvY2tlZCA9PSBkb2N1bWVudCB8fCBibG9ja2VkID09IHdpbmRvdykge1xyXG4gICAgICAgIGJsb2NrZWQgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgZnVsbCA9IHRydWU7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBibG9ja2VkID0gJChibG9ja2VkKTtcclxuXHJcbiAgICB2YXIgYm94SW5zaWRlQmxvY2tlZCA9ICFibG9ja2VkLmlzKCdib2R5LHRyLHRoZWFkLHRib2R5LHRmb290LHRhYmxlLHVsLG9sLGRsJyk7XHJcblxyXG4gICAgLy8gR2V0dGluZyBib3ggZWxlbWVudCBpZiBleGlzdHMgYW5kIHJlZmVyZW5jaW5nXHJcbiAgICB2YXIgYklEID0gYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJyk7XHJcbiAgICBpZiAoIWJJRClcclxuICAgICAgICBiSUQgPSAoY29udGVudEJveC5hdHRyKCdpZCcpIHx8ICcnKSArIChibG9ja2VkLmF0dHIoJ2lkJykgfHwgJycpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICBpZiAoYklEID09ICctc21vb3RoQm94QmxvY2snKSB7XHJcbiAgICAgICAgYklEID0gJ2lkLScgKyBndWlkR2VuZXJhdG9yKCkgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIH1cclxuICAgIGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcsIGJJRCk7XHJcbiAgICB2YXIgYm94ID0gJCgnIycgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGJJRCkpO1xyXG4gICAgLy8gSGlkaW5nIGJveDpcclxuICAgIGlmIChjb250ZW50Qm94Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGJveC54aGlkZShvcHRpb25zLmNsb3NlT3B0aW9ucyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIGJveGM7XHJcbiAgICBpZiAoYm94Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIGJveGMgPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1lbGVtZW50XCIvPicpO1xyXG4gICAgICAgIGJveCA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLW92ZXJsYXlcIj48L2Rpdj4nKTtcclxuICAgICAgICBib3guYWRkQ2xhc3MoYWRkY2xhc3MpO1xyXG4gICAgICAgIGlmIChmdWxsKSBib3guYWRkQ2xhc3MoJ2Z1bGwtYmxvY2snKTtcclxuICAgICAgICBib3guYXBwZW5kKGJveGMpO1xyXG4gICAgICAgIGJveC5hdHRyKCdpZCcsIGJJRCk7XHJcbiAgICAgICAgaWYgKGJveEluc2lkZUJsb2NrZWQpXHJcbiAgICAgICAgICAgIGJsb2NrZWQuYXBwZW5kKGJveCk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKGJveCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGJveGMgPSBib3guY2hpbGRyZW4oJy5zbW9vdGgtYm94LWJsb2NrLWVsZW1lbnQnKTtcclxuICAgIH1cclxuICAgIC8vIEhpZGRlbiBmb3IgdXNlciwgYnV0IGF2YWlsYWJsZSB0byBjb21wdXRlOlxyXG4gICAgY29udGVudEJveC5zaG93KCk7XHJcbiAgICBib3guc2hvdygpLmNzcygnb3BhY2l0eScsIDApO1xyXG4gICAgLy8gU2V0dGluZyB1cCB0aGUgYm94IGFuZCBzdHlsZXMuXHJcbiAgICBib3hjLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICBpZiAob3B0aW9ucy5jbG9zYWJsZSlcclxuICAgICAgICBib3hjLmFwcGVuZCgkKCc8YSBjbGFzcz1cImNsb3NlLXBvcHVwIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicpKTtcclxuICAgIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycsIG9wdGlvbnMpO1xyXG4gICAgaWYgKCFib3hjLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnKSlcclxuICAgICAgICBib3hjXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKCkgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBudWxsLCBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnKSk7IHJldHVybiBmYWxzZTsgfSlcclxuICAgICAgICAuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcsIHRydWUpO1xyXG4gICAgYm94Yy5hcHBlbmQoY29udGVudEJveCk7XHJcbiAgICBib3hjLndpZHRoKG9wdGlvbnMud2lkdGgpO1xyXG4gICAgYm94LmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gaW5zaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQ6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIGJsb2NrZWQuY3NzKCd6LWluZGV4JykgKyAxMCk7XHJcbiAgICAgICAgaWYgKCFibG9ja2VkLmNzcygncG9zaXRpb24nKSB8fCBibG9ja2VkLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJylcclxuICAgICAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJyk7XHJcbiAgICAgICAgLy9vZmZzID0gYmxvY2tlZC5wb3NpdGlvbigpO1xyXG4gICAgICAgIGJveC5jc3MoJ3RvcCcsIDApO1xyXG4gICAgICAgIGJveC5jc3MoJ2xlZnQnLCAwKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gb3V0c2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50LCBhcyBhIGRpcmVjdCBjaGlsZCBvZiBCb2R5OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBNYXRoLmZsb29yKE51bWJlci5NQVhfVkFMVUUpKTtcclxuICAgICAgICBib3guY3NzKGJsb2NrZWQub2Zmc2V0KCkpO1xyXG4gICAgfVxyXG4gICAgLy8gRGltZW5zaW9ucyBtdXN0IGJlIGNhbGN1bGF0ZWQgYWZ0ZXIgYmVpbmcgYXBwZW5kZWQgYW5kIHBvc2l0aW9uIHR5cGUgYmVpbmcgc2V0OlxyXG4gICAgYm94LndpZHRoKGJsb2NrZWQub3V0ZXJXaWR0aCgpKTtcclxuICAgIGJveC5oZWlnaHQoYmxvY2tlZC5vdXRlckhlaWdodCgpKTtcclxuXHJcbiAgICBpZiAob3B0aW9ucy5jZW50ZXIpIHtcclxuICAgICAgICBib3hjLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgICAgICB2YXIgY2wsIGN0O1xyXG4gICAgICAgIGlmIChmdWxsKSB7XHJcbiAgICAgICAgICAgIGN0ID0gc2NyZWVuLmhlaWdodCAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gc2NyZWVuLndpZHRoIC8gMjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjdCA9IGJveC5vdXRlckhlaWdodCh0cnVlKSAvIDI7XHJcbiAgICAgICAgICAgIGNsID0gYm94Lm91dGVyV2lkdGgodHJ1ZSkgLyAyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBib3hjLmNzcygndG9wJywgY3QgLSBib3hjLm91dGVySGVpZ2h0KHRydWUpIC8gMik7XHJcbiAgICAgICAgYm94Yy5jc3MoJ2xlZnQnLCBjbCAtIGJveGMub3V0ZXJXaWR0aCh0cnVlKSAvIDIpO1xyXG4gICAgfVxyXG4gICAgLy8gTGFzdCBzZXR1cFxyXG4gICAgYXV0b0ZvY3VzKGJveCk7XHJcbiAgICAvLyBTaG93IGJsb2NrXHJcbiAgICBib3guYW5pbWF0ZSh7IG9wYWNpdHk6IDEgfSwgMzAwKTtcclxuICAgIGlmIChvcHRpb25zLmF1dG9mb2N1cylcclxuICAgICAgICBtb3ZlRm9jdXNUbyhjb250ZW50Qm94LCBvcHRpb25zLmF1dG9mb2N1c09wdGlvbnMpO1xyXG4gICAgcmV0dXJuIGJveDtcclxufVxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsKGNvbnRhaW5lcikge1xyXG4gICAgJChjb250YWluZXIgfHwgZG9jdW1lbnQpLmZpbmQoJy5zbW9vdGgtYm94LWJsb2NrLW92ZXJsYXknKS5oaWRlKCk7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvcGVuOiBzbW9vdGhCb3hCbG9jayxcclxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHsgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpOyB9LFxyXG4gICAgICAgIGNsb3NlQWxsOiBzbW9vdGhCb3hCbG9ja0Nsb3NlQWxsXHJcbiAgICB9OyIsIi8qKlxyXG4qKiBNb2R1bGU6OiB0b29sdGlwc1xyXG4qKiBDcmVhdGVzIHNtYXJ0IHRvb2x0aXBzIHdpdGggcG9zc2liaWxpdGllcyBmb3Igb24gaG92ZXIgYW5kIG9uIGNsaWNrLFxyXG4qKiBhZGRpdGlvbmFsIGRlc2NyaXB0aW9uIG9yIGV4dGVybmFsIHRvb2x0aXAgY29udGVudC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzYW5pdGl6ZVdoaXRlc3BhY2VzID0gcmVxdWlyZSgnLi9zYW5pdGl6ZVdoaXRlc3BhY2VzJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lm91dGVySHRtbCcpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5pc0NoaWxkT2YnKTtcclxuXHJcbi8vIE1haW4gaW50ZXJuYWwgcHJvcGVydGllc1xyXG52YXIgcG9zb2Zmc2V0ID0geyB4OiAxNiwgeTogOCB9O1xyXG52YXIgc2VsZWN0b3IgPSAnW3RpdGxlXVtkYXRhLWRlc2NyaXB0aW9uXSwgW3RpdGxlXS5oYXMtdG9vbHRpcCwgW3RpdGxlXS5zZWN1cmUtZGF0YSwgW2RhdGEtdG9vbHRpcC11cmxdLCBbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJztcclxuXHJcbi8qKiBQb3NpdGlvbmF0ZSB0aGUgdG9vbHRpcCBkZXBlbmRpbmcgb24gdGhlXHJcbmV2ZW50IG9yIHRoZSB0YXJnZXQgZWxlbWVudCBwb3NpdGlvbiBhbmQgYW4gb2Zmc2V0XHJcbioqL1xyXG5mdW5jdGlvbiBwb3ModCwgZSwgbCkge1xyXG4gICAgdmFyIHgsIHk7XHJcbiAgICBpZiAoZS5wYWdlWCAmJiBlLnBhZ2VZKSB7XHJcbiAgICAgICAgeCA9IGUucGFnZVg7XHJcbiAgICAgICAgeSA9IGUucGFnZVk7XHJcbiAgICB9IGVsc2UgaWYgKGUudGFyZ2V0KSB7XHJcbiAgICAgICAgdmFyICRldCA9ICQoZS50YXJnZXQpO1xyXG4gICAgICAgIHggPSAkZXQub3V0ZXJXaWR0aCgpICsgJGV0Lm9mZnNldCgpLmxlZnQ7XHJcbiAgICAgICAgeSA9ICRldC5vdXRlckhlaWdodCgpICsgJGV0Lm9mZnNldCgpLnRvcDtcclxuICAgIH1cclxuICAgIHQuY3NzKCdsZWZ0JywgeCArIHBvc29mZnNldC54KTtcclxuICAgIHQuY3NzKCd0b3AnLCB5ICsgcG9zb2Zmc2V0LnkpO1xyXG4gICAgLy8gQWRqdXN0IHdpZHRoIHRvIHZpc2libGUgdmlld3BvcnRcclxuICAgIHZhciB0ZGlmID0gdC5vdXRlcldpZHRoKCkgLSB0LndpZHRoKCk7XHJcbiAgICB0LmNzcygnbWF4LXdpZHRoJywgJCh3aW5kb3cpLndpZHRoKCkgLSB4IC0gcG9zb2Zmc2V0LnggLSB0ZGlmKTtcclxuICAgIC8vdC5oZWlnaHQoJChkb2N1bWVudCkuaGVpZ2h0KCkgLSB5IC0gcG9zb2Zmc2V0LnkpO1xyXG59XHJcbi8qKiBHZXQgb3IgY3JlYXRlLCBhbmQgcmV0dXJucywgdGhlIHRvb2x0aXAgY29udGVudCBmb3IgdGhlIGVsZW1lbnRcclxuKiovXHJcbmZ1bmN0aW9uIGNvbihsKSB7XHJcbiAgICBpZiAobC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGMgPSBsLmRhdGEoJ3Rvb2x0aXAtY29udGVudCcpLFxyXG4gICAgICAgIHBlcnNpc3RlbnQgPSBsLmRhdGEoJ3BlcnNpc3RlbnQtdG9vbHRpcCcpO1xyXG4gICAgaWYgKCFjKSB7XHJcbiAgICAgICAgdmFyIGggPSBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwuYXR0cigndGl0bGUnKSk7XHJcbiAgICAgICAgdmFyIGQgPSBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwuZGF0YSgnZGVzY3JpcHRpb24nKSk7XHJcbiAgICAgICAgaWYgKGQpXHJcbiAgICAgICAgICAgIGMgPSAnPGg0PicgKyBoICsgJzwvaDQ+PHA+JyArIGQgKyAnPC9wPic7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjID0gaDtcclxuICAgICAgICAvLyBBcHBlbmQgZGF0YS10b29sdGlwLXVybCBjb250ZW50IGlmIGV4aXN0c1xyXG4gICAgICAgIHZhciB1cmxjb250ZW50ID0gJChsLmRhdGEoJ3Rvb2x0aXAtdXJsJykpO1xyXG4gICAgICAgIGMgPSAoYyB8fCAnJykgKyB1cmxjb250ZW50Lm91dGVySHRtbCgpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBvcmlnaW5hbCwgaXMgbm8gbW9yZSBuZWVkIGFuZCBhdm9pZCBpZC1jb25mbGljdHNcclxuICAgICAgICB1cmxjb250ZW50LnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIFNhdmUgdG9vbHRpcCBjb250ZW50XHJcbiAgICAgICAgbC5kYXRhKCd0b29sdGlwLWNvbnRlbnQnLCBjKTtcclxuICAgICAgICAvLyBSZW1vdmUgYnJvd3NlciB0b29sdGlwIChib3RoIHdoZW4gd2UgYXJlIHVzaW5nIG91ciBvd24gdG9vbHRpcCBhbmQgd2hlbiBubyB0b29sdGlwXHJcbiAgICAgICAgLy8gaXMgbmVlZClcclxuICAgICAgICBsLmF0dHIoJ3RpdGxlJywgJycpO1xyXG4gICAgfVxyXG4gICAgLy8gUmVtb3ZlIHRvb2x0aXAgY29udGVudCAoYnV0IHByZXNlcnZlIGl0cyBjYWNoZSBpbiB0aGUgZWxlbWVudCBkYXRhKVxyXG4gICAgLy8gaWYgaXMgdGhlIHNhbWUgdGV4dCBhcyB0aGUgZWxlbWVudCBjb250ZW50IGFuZCB0aGUgZWxlbWVudCBjb250ZW50XHJcbiAgICAvLyBpcyBmdWxseSB2aXNpYmxlLiBUaGF0cywgZm9yIGNhc2VzIHdpdGggZGlmZmVyZW50IGNvbnRlbnQsIHdpbGwgYmUgc2hvd2VkLFxyXG4gICAgLy8gYW5kIGZvciBjYXNlcyB3aXRoIHNhbWUgY29udGVudCBidXQgaXMgbm90IHZpc2libGUgYmVjYXVzZSB0aGUgZWxlbWVudFxyXG4gICAgLy8gb3IgY29udGFpbmVyIHdpZHRoLCB0aGVuIHdpbGwgYmUgc2hvd2VkLlxyXG4gICAgLy8gRXhjZXB0IGlmIGlzIHBlcnNpc3RlbnRcclxuICAgIGlmIChwZXJzaXN0ZW50ICE9PSB0cnVlICYmXHJcbiAgICAgICAgc2FuaXRpemVXaGl0ZXNwYWNlcyhsLnRleHQoKSkgPT0gYyAmJlxyXG4gICAgICAgIGwub3V0ZXJXaWR0aCgpID49IGxbMF0uc2Nyb2xsV2lkdGgpIHtcclxuICAgICAgICBjID0gbnVsbDtcclxuICAgIH1cclxuICAgIC8vIElmIHRoZXJlIGlzIG5vdCBjb250ZW50OlxyXG4gICAgaWYgKCFjKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIHRhcmdldCByZW1vdmluZyB0aGUgY2xhc3MgdG8gYXZvaWQgY3NzIG1hcmtpbmcgdG9vbHRpcCB3aGVuIHRoZXJlIGlzIG5vdFxyXG4gICAgICAgIGwucmVtb3ZlQ2xhc3MoJ2hhcy10b29sdGlwJykucmVtb3ZlQ2xhc3MoJ2hhcy1wb3B1cC10b29sdGlwJyk7XHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm4gdGhlIGNvbnRlbnQgYXMgc3RyaW5nOlxyXG4gICAgcmV0dXJuIGM7XHJcbn1cclxuLyoqIEdldCBvciBjcmVhdGVzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2UgZm9yIGEgdG9vbHRpcCBvZiB0aGUgZ2l2ZW4gdHlwZVxyXG4qKi9cclxuZnVuY3Rpb24gZ2V0VG9vbHRpcCh0eXBlKSB7XHJcbiAgICB0eXBlID0gdHlwZSB8fCAndG9vbHRpcCc7XHJcbiAgICB2YXIgaWQgPSAnc2luZ2xldG9uLScgKyB0eXBlO1xyXG4gICAgdmFyIHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICBpZiAoIXQpIHtcclxuICAgICAgICB0ID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlXCIgY2xhc3M9XCJ0b29sdGlwXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgdC5hdHRyKCdpZCcsIGlkKTtcclxuICAgICAgICB0LmhpZGUoKTtcclxuICAgICAgICAkKCdib2R5JykuYXBwZW5kKHQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICQodCk7XHJcbn1cclxuLyoqIFNob3cgdGhlIHRvb2x0aXAgb24gYW4gZXZlbnQgdHJpZ2dlcmVkIGJ5IHRoZSBlbGVtZW50IGNvbnRhaW5pbmdcclxuaW5mb3JtYXRpb24gZm9yIGEgdG9vbHRpcFxyXG4qKi9cclxuZnVuY3Rpb24gc2hvd1Rvb2x0aXAoZSkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBpc1BvcHVwID0gJHQuaGFzQ2xhc3MoJ2hhcy1wb3B1cC10b29sdGlwJyk7XHJcbiAgICAvLyBHZXQgb3IgY3JlYXRlIHRvb2x0aXAgbGF5ZXJcclxuICAgIHZhciB0ID0gZ2V0VG9vbHRpcChpc1BvcHVwID8gJ3BvcHVwLXRvb2x0aXAnIDogJ3Rvb2x0aXAnKTtcclxuICAgIC8vIElmIHRoaXMgaXMgbm90IHBvcHVwIGFuZCB0aGUgZXZlbnQgaXMgY2xpY2ssIGRpc2NhcmQgd2l0aG91dCBjYW5jZWwgZXZlbnRcclxuICAgIGlmICghaXNQb3B1cCAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAvLyBDcmVhdGUgY29udGVudDogaWYgdGhlcmUgaXMgY29udGVudCwgY29udGludWVcclxuICAgIHZhciBjb250ZW50ID0gY29uKCR0KTtcclxuICAgIGlmIChjb250ZW50KSB7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBoYXMtcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBub3QgYSBjbGljaywgZG9uJ3Qgc2hvd1xyXG4gICAgICAgIGlmIChpc1BvcHVwICYmIGUudHlwZSAhPSAnY2xpY2snKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAvLyBUaGUgdG9vbHRpcCBzZXR1cCBtdXN0IGJlIHF1ZXVlZCB0byBhdm9pZCBjb250ZW50IHRvIGJlIHNob3dlZCBhbmQgcGxhY2VkXHJcbiAgICAgICAgLy8gd2hlbiBzdGlsbCBoaWRkZW4gdGhlIHByZXZpb3VzXHJcbiAgICAgICAgdC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFNldCB0b29sdGlwIGNvbnRlbnRcclxuICAgICAgICAgICAgdC5odG1sKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAvLyBGb3IgcG9wdXBzLCBzZXR1cCBjbGFzcyBhbmQgY2xvc2UgYnV0dG9uXHJcbiAgICAgICAgICAgIGlmIChpc1BvcHVwKSB7XHJcbiAgICAgICAgICAgICAgICB0LmFkZENsYXNzKCdwb3B1cC10b29sdGlwJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YSBocmVmPVwiI2Nsb3NlLXBvcHVwXCIgY2xhc3M9XCJjbG9zZS1hY3Rpb25cIj5YPC9hPicpO1xyXG4gICAgICAgICAgICAgICAgdC5hcHBlbmQoY2xvc2VCdXR0b24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFBvc2l0aW9uYXRlXHJcbiAgICAgICAgICAgIHBvcyh0LCBlLCAkdCk7XHJcbiAgICAgICAgICAgIHQuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAvLyBTaG93IChhbmltYXRpb25zIGFyZSBzdG9wcGVkIG9ubHkgb24gaGlkZSB0byBhdm9pZCBjb25mbGljdHMpXHJcbiAgICAgICAgICAgIHQuZmFkZUluKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RvcCBidWJibGluZyBhbmQgZGVmYXVsdFxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKiBIaWRlIGFsbCBvcGVuZWQgdG9vbHRpcHMsIGZvciBhbnkgdHlwZS5cclxuSXQgaGFzIHNvbWUgc3BlY2lhbCBjb25zaWRlcmF0aW9ucyBmb3IgcG9wdXAtdG9vbHRpcHMgZGVwZW5kaW5nXHJcbm9uIHRoZSBldmVudCBiZWluZyB0cmlnZ2VyZWQuXHJcbioqL1xyXG5mdW5jdGlvbiBoaWRlVG9vbHRpcChlKSB7XHJcbiAgICAkKCcudG9vbHRpcDp2aXNpYmxlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGlzIGEgcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBub3QgYSBjbGljaywgb3IgdGhlIGludmVyc2UsXHJcbiAgICAgICAgLy8gdGhpcyBpcyBub3QgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIGEgY2xpY2ssIGRvIG5vdGhpbmdcclxuICAgICAgICBpZiAodC5oYXNDbGFzcygncG9wdXAtdG9vbHRpcCcpICYmIGUudHlwZSAhPSAnY2xpY2snIHx8XHJcbiAgICAgICAgICAgICF0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlID09ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAvLyBTdG9wIGFuaW1hdGlvbnMgYW5kIGhpZGVcclxuICAgICAgICB0LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKiBJbml0aWFsaXplIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiBpbml0KCkge1xyXG4gICAgLy8gTGlzdGVuIGZvciBldmVudHMgdG8gc2hvdy9oaWRlIHRvb2x0aXBzXHJcbiAgICAkKCdib2R5Jykub24oJ21vdXNlbW92ZSBmb2N1c2luJywgc2VsZWN0b3IsIHNob3dUb29sdGlwKVxyXG4gICAgLm9uKCdtb3VzZWxlYXZlIGZvY3Vzb3V0Jywgc2VsZWN0b3IsIGhpZGVUb29sdGlwKVxyXG4gICAgLy8gTGlzdGVuIGV2ZW50IGZvciBjbGlja2FibGUgcG9wdXAtdG9vbHRpcHNcclxuICAgIC5vbignY2xpY2snLCAnW3RpdGxlXS5oYXMtcG9wdXAtdG9vbHRpcCcsIHNob3dUb29sdGlwKVxyXG4gICAgLy8gQWxsb3dpbmcgYnV0dG9ucyBpbnNpZGUgdGhlIHRvb2x0aXBcclxuICAgIC5vbignY2xpY2snLCAnLnRvb2x0aXAtYnV0dG9uJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAvLyBBZGRpbmcgY2xvc2UtdG9vbHRpcCBoYW5kbGVyIGZvciBwb3B1cC10b29sdGlwcyAoY2xpY2sgb24gYW55IGVsZW1lbnQgZXhjZXB0IHRoZSB0b29sdGlwIGl0c2VsZilcclxuICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHZhciB0ID0gJCgnLnBvcHVwLXRvb2x0aXA6dmlzaWJsZScpLmdldCgwKTtcclxuICAgICAgICAvLyBJZiB0aGUgY2xpY2sgaXMgTm90IG9uIHRoZSB0b29sdGlwIG9yIGFueSBlbGVtZW50IGNvbnRhaW5lZFxyXG4gICAgICAgIC8vIGhpZGUgdG9vbHRpcFxyXG4gICAgICAgIGlmIChlLnRhcmdldCAhPSB0ICYmICEkKGUudGFyZ2V0KS5pc0NoaWxkT2YodCkpXHJcbiAgICAgICAgICAgIGhpZGVUb29sdGlwKGUpO1xyXG4gICAgfSlcclxuICAgIC8vIEF2b2lkIGNsb3NlLWFjdGlvbiBjbGljayBmcm9tIHJlZGlyZWN0IHBhZ2UsIGFuZCBoaWRlIHRvb2x0aXBcclxuICAgIC5vbignY2xpY2snLCAnLnBvcHVwLXRvb2x0aXAgLmNsb3NlLWFjdGlvbicsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGhpZGVUb29sdGlwKGUpO1xyXG4gICAgfSk7XHJcbiAgICB1cGRhdGUoKTtcclxufVxyXG4vKiogVXBkYXRlIGVsZW1lbnRzIG9uIHRoZSBwYWdlIHRvIHJlZmxlY3QgY2hhbmdlcyBvciBuZWVkIGZvciB0b29sdGlwc1xyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlKGVsZW1lbnRfc2VsZWN0b3IpIHtcclxuICAgIC8vIFJldmlldyBldmVyeSBwb3B1cCB0b29sdGlwIHRvIHByZXBhcmUgY29udGVudCBhbmQgbWFyay91bm1hcmsgdGhlIGxpbmsgb3IgdGV4dDpcclxuICAgICQoZWxlbWVudF9zZWxlY3RvciB8fCBzZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uKCQodGhpcykpO1xyXG4gICAgfSk7XHJcbn1cclxuLyoqIENyZWF0ZSB0b29sdGlwIG9uIGVsZW1lbnQgYnkgZGVtYW5kXHJcbioqL1xyXG5mdW5jdGlvbiBjcmVhdGVfdG9vbHRpcChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwge1xyXG4gICAgICAgIHRpdGxlOiAnJ1xyXG4gICAgICAgICwgZGVzY3JpcHRpb246IG51bGxcclxuICAgICAgICAsIHVybDogbnVsbFxyXG4gICAgICAgICwgaXNfcG9wdXA6IGZhbHNlXHJcbiAgICAgICAgLCBwZXJzaXN0ZW50OiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICAkKGVsZW1lbnQpXHJcbiAgICAuYXR0cigndGl0bGUnLCBzZXR0aW5ncy50aXRsZSlcclxuICAgIC5kYXRhKCdkZXNjcmlwdGlvbicsIHNldHRpbmdzLmRlc2NyaXB0aW9uKVxyXG4gICAgLmRhdGEoJ3BlcnNpc3RlbnQtdG9vbHRpcCcsIHNldHRpbmdzLnBlcnNpc3RlbnQpXHJcbiAgICAuYWRkQ2xhc3Moc2V0dGluZ3MuaXNfcG9wdXAgPyAnaGFzLXBvcHVwLXRvb2x0aXAnIDogJ2hhcy10b29sdGlwJyk7XHJcbiAgICB1cGRhdGUoZWxlbWVudCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXRUb29sdGlwczogaW5pdCxcclxuICAgICAgICB1cGRhdGVUb29sdGlwczogdXBkYXRlLFxyXG4gICAgICAgIGNyZWF0ZVRvb2x0aXA6IGNyZWF0ZV90b29sdGlwXHJcbiAgICB9O1xyXG4iLCIvKiBTb21lIHRvb2xzIGZvcm0gVVJMIG1hbmFnZW1lbnRcclxuKi9cclxuZXhwb3J0cy5nZXRVUkxQYXJhbWV0ZXIgPSBmdW5jdGlvbiBnZXRVUkxQYXJhbWV0ZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIGRlY29kZVVSSShcclxuICAgICAgICAoUmVnRXhwKG5hbWUgKyAnPScgKyAnKC4rPykoJnwkKScsICdpJykuZXhlYyhsb2NhdGlvbi5zZWFyY2gpIHx8IFssIG51bGxdKVsxXSk7XHJcbn07XHJcbmV4cG9ydHMuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzID0gZnVuY3Rpb24gZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzKGhhc2hiYW5ndmFsdWUpIHtcclxuICAgIC8vIEhhc2hiYW5ndmFsdWUgaXMgc29tZXRoaW5nIGxpa2U6IFRocmVhZC0xX01lc3NhZ2UtMlxyXG4gICAgLy8gV2hlcmUgJzEnIGlzIHRoZSBUaHJlYWRJRCBhbmQgJzInIHRoZSBvcHRpb25hbCBNZXNzYWdlSUQsIG9yIG90aGVyIHBhcmFtZXRlcnNcclxuICAgIHZhciBwYXJzID0gaGFzaGJhbmd2YWx1ZS5zcGxpdCgnXycpO1xyXG4gICAgdmFyIHVybFBhcmFtZXRlcnMgPSB7fTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBwYXJzdmFsdWVzID0gcGFyc1tpXS5zcGxpdCgnLScpO1xyXG4gICAgICAgIGlmIChwYXJzdmFsdWVzLmxlbmd0aCA9PSAyKVxyXG4gICAgICAgICAgICB1cmxQYXJhbWV0ZXJzW3BhcnN2YWx1ZXNbMF1dID0gcGFyc3ZhbHVlc1sxXTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVybFBhcmFtZXRlcnM7XHJcbn07XHJcbiIsIi8qKiBWYWxpZGF0aW9uIGxvZ2ljIHdpdGggbG9hZCBhbmQgc2V0dXAgb2YgdmFsaWRhdG9ycyBhbmQgXHJcbiAgICB2YWxpZGF0aW9uIHJlbGF0ZWQgdXRpbGl0aWVzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG4vLyBVc2luZyBvbiBzZXR1cCBhc3luY3Jvbm91cyBsb2FkIGluc3RlYWQgb2YgdGhpcyBzdGF0aWMtbGlua2VkIGxvYWRcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanMnKTtcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanMnKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwVmFsaWRhdGlvbihyZWFwcGx5T25seVRvKSB7XHJcbiAgICByZWFwcGx5T25seVRvID0gcmVhcHBseU9ubHlUbyB8fCBkb2N1bWVudDtcclxuICAgIGlmICghd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZiAoIWpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHtcclxuICAgICAgICBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICBNb2Rlcm5penIubG9hZChbXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanNcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzXCIgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgZmlyc3QgaWYgdmFsaWRhdGlvbiBpcyBlbmFibGVkIChjYW4gaGFwcGVuIHRoYXQgdHdpY2UgaW5jbHVkZXMgb2ZcclxuICAgICAgICAvLyB0aGlzIGNvZGUgaGFwcGVuIGF0IHNhbWUgcGFnZSwgYmVpbmcgZXhlY3V0ZWQgdGhpcyBjb2RlIGFmdGVyIGZpcnN0IGFwcGVhcmFuY2VcclxuICAgICAgICAvLyB3aXRoIHRoZSBzd2l0Y2gganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCBjaGFuZ2VkXHJcbiAgICAgICAgLy8gYnV0IHdpdGhvdXQgdmFsaWRhdGlvbiBiZWluZyBhbHJlYWR5IGxvYWRlZCBhbmQgZW5hYmxlZClcclxuICAgICAgICBpZiAoJCAmJiAkLnZhbGlkYXRvciAmJiAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZSkge1xyXG4gICAgICAgICAgICAvLyBBcHBseSB0aGUgdmFsaWRhdGlvbiBydWxlcyB0byB0aGUgbmV3IGVsZW1lbnRzXHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndmFsaWRhdG9yJyk7XHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgICAgICQudmFsaWRhdG9yLnVub2J0cnVzaXZlLnBhcnNlKHJlYXBwbHlPbmx5VG8pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0aWVzICovXHJcblxyXG4vKiBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9ycyBvZiB0aGUgdmFsaWRhdGlvbiBzdW1tYXJ5XHJcbmluY2x1ZGVkIGluICdjb250YWluZXInIGFuZCBzZXQgYXMgdmFsaWQgdGhlIHN1bW1hcnlcclxuKi9cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gICAgJCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgLmZpbmQoJz51bD5saScpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFNldCBhbGwgZmllbGRzIHZhbGlkYXRpb24gaW5zaWRlIHRoaXMgZm9ybSAoYWZmZWN0ZWQgYnkgdGhlIHN1bW1hcnkgdG9vKVxyXG4gICAgLy8gYXMgdmFsaWQgdG9vXHJcbiAgICAkKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgLnRleHQoJycpO1xyXG5cclxuICAgIC8vIFJlLWFwcGx5IHNldHVwIHZhbGlkYXRpb24gdG8gZW5zdXJlIGlzIHdvcmtpbmcsIGJlY2F1c2UganVzdCBhZnRlciBhIHN1Y2Nlc3NmdWxcclxuICAgIC8vIHZhbGlkYXRpb24sIGFzcC5uZXQgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBzdG9wcyB3b3JraW5nIG9uIGNsaWVudC1zaWRlLlxyXG4gICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihjb250YWluZXIpIHtcclxuICB2YXIgdiA9IGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpO1xyXG4gIHYuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pIHtcclxuICAgIHZhciBvZmYgPSBmb3JtLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykub2Zmc2V0KCk7XHJcbiAgICBpZiAob2ZmKVxyXG4gICAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogb2ZmLnRvcCB9LCA1MDApO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ2dvVG9TdW1tYXJ5RXJyb3JzOiBubyBzdW1tYXJ5IHRvIGZvY3VzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpIHtcclxuICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgcmV0dXJuICQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2V0dXA6IHNldHVwVmFsaWRhdGlvbixcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDogc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IsXHJcbiAgICBnb1RvU3VtbWFyeUVycm9yczogZ29Ub1N1bW1hcnlFcnJvcnMsXHJcbiAgICBmaW5kVmFsaWRhdGlvblN1bW1hcnk6IGZpbmRWYWxpZGF0aW9uU3VtbWFyeVxyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gc29tZSBBY2NvdW50IHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJ2EubG9naW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IGJhc2VVcmwgKyAnQWNjb3VudC8kTG9naW4vP1JldHVyblVybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbik7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EucmVnaXN0ZXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvUmVnaXN0ZXInLCAnL0FjY291bnQvJFJlZ2lzdGVyJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0NTAsIGhlaWdodDogNTAwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EuZm9yZ290LXBhc3N3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L0ZvcmdvdFBhc3N3b3JkJywgJy9BY2NvdW50LyRGb3Jnb3RQYXNzd29yZCcpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDAwLCBoZWlnaHQ6IDI0MCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmNoYW5nZS1wYXNzd29yZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9DaGFuZ2VQYXNzd29yZCcsICcvQWNjb3VudC8kQ2hhbmdlUGFzc3dvcmQnKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQ1MCwgaGVpZ2h0OiAzNDAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLy8gT1VSIG5hbWVzcGFjZSAoYWJicmV2aWF0ZWQgTG9jb25vbWljcylcclxud2luZG93LkxDID0gd2luZG93LkxDIHx8IHt9O1xyXG5cclxuLy8gVE9ETyBSZXZpZXcgTGNVcmwgdXNlIGFyb3VuZCBhbGwgdGhlIG1vZHVsZXMsIHVzZSBESSB3aGVuZXZlciBwb3NzaWJsZSAoaW5pdC9zZXR1cCBtZXRob2Qgb3IgaW4gdXNlIGNhc2VzKVxyXG4vLyBidXQgb25seSBmb3IgdGhlIHdhbnRlZCBiYXNlVXJsIG9uIGVhY2ggY2FzZSBhbmQgbm90IHBhc3MgYWxsIHRoZSBMY1VybCBvYmplY3QuXHJcbi8vIExjVXJsIGlzIHNlcnZlci1zaWRlIGdlbmVyYXRlZCBhbmQgd3JvdGUgaW4gYSBMYXlvdXQgc2NyaXB0LXRhZy5cclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5nc1xyXG53aW5kb3cuZ0xvYWRpbmdSZXRhcmQgPSAzMDA7XHJcblxyXG4vKioqXHJcbiAqKiBMb2FkaW5nIG1vZHVsZXNcclxuKioqL1xyXG4vL1RPRE86IENsZWFuIGRlcGVuZGVuY2llcywgcmVtb3ZlIGFsbCB0aGF0IG5vdCB1c2VkIGRpcmVjdGx5IGluIHRoaXMgZmlsZSwgYW55IG90aGVyIGZpbGVcclxuLy8gb3IgcGFnZSBtdXN0IHJlcXVpcmUgaXRzIGRlcGVuZGVuY2llcy5cclxuXHJcbndpbmRvdy5MY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyk7XHJcblxyXG4vKiBqUXVlcnksIHNvbWUgdmVuZG9yIHBsdWdpbnMgKGZyb20gYnVuZGxlKSBhbmQgb3VyIGFkZGl0aW9ucyAoc21hbGwgcGx1Z2lucyksIHRoZXkgYXJlIGF1dG9tYXRpY2FsbHkgcGx1Zy1lZCBvbiByZXF1aXJlICovXHJcbnZhciAkID0gd2luZG93LiQgPSB3aW5kb3cualF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXInKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJhLWhhc2hjaGFuZ2UnKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LmFyZScpO1xyXG4vLyBNYXNrZWQgaW5wdXQsIGZvciBkYXRlcyAtYXQgbXktYWNjb3VudC0uXHJcbnJlcXVpcmUoJ2pxdWVyeS5mb3JtYXR0ZXInKTtcclxuXHJcbi8vIEdlbmVyYWwgY2FsbGJhY2tzIGZvciBBSkFYIGV2ZW50cyB3aXRoIGNvbW1vbiBsb2dpY1xyXG52YXIgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhDYWxsYmFja3MnKTtcclxuLy8gRm9ybS5hamF4IGxvZ2ljIGFuZCBtb3JlIHNwZWNpZmljIGNhbGxiYWNrcyBiYXNlZCBvbiBhamF4Q2FsbGJhY2tzXHJcbnZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbndpbmRvdy5hamF4Rm9ybXNTdWNjZXNzSGFuZGxlciA9IGFqYXhGb3Jtcy5vblN1Y2Nlc3M7XHJcbndpbmRvdy5hamF4RXJyb3JQb3B1cEhhbmRsZXIgPSBhamF4Rm9ybXMub25FcnJvcjtcclxud2luZG93LmFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlciA9IGFqYXhGb3Jtcy5vbkNvbXBsZXRlO1xyXG4vL31cclxuXHJcbi8qIFJlbG9hZCAqL1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkucmVsb2FkJyk7XHJcbiQuZm4ucmVsb2FkLmRlZmF1bHRzID0ge1xyXG4gICAgc3VjY2VzczogW2FqYXhGb3Jtcy5vblN1Y2Nlc3NdLFxyXG4gICAgZXJyb3I6IFthamF4Rm9ybXMub25FcnJvcl0sXHJcbiAgICBkZWxheTogZ0xvYWRpbmdSZXRhcmRcclxufTtcclxuXHJcbkxDLm1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi4vTEMvbW92ZUZvY3VzVG8nKTtcclxuLyogRGlzYWJsZWQgYmVjYXVzZSBjb25mbGljdHMgd2l0aCB0aGUgbW92ZUZvY3VzVG8gb2YgXHJcbiAgYWpheEZvcm0ub25zdWNjZXNzLCBpdCBoYXBwZW5zIGEgYmxvY2subG9hZGluZyBqdXN0IGFmdGVyXHJcbiAgdGhlIHN1Y2Nlc3MgaGFwcGVucy5cclxuJC5ibG9ja1VJLmRlZmF1bHRzLm9uQmxvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBTY3JvbGwgdG8gYmxvY2stbWVzc2FnZSB0byBkb24ndCBsb3N0IGluIGxhcmdlIHBhZ2VzOlxyXG4gICAgTEMubW92ZUZvY3VzVG8odGhpcyk7XHJcbn07Ki9cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuLi9MQy9sb2FkZXInKTtcclxuTEMubG9hZCA9IGxvYWRlci5sb2FkO1xyXG5cclxudmFyIGJsb2NrcyA9IExDLmJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4uL0xDL2Jsb2NrUHJlc2V0cycpO1xyXG4vL3tURU1QXHJcbndpbmRvdy5sb2FkaW5nQmxvY2sgPSBibG9ja3MubG9hZGluZztcclxud2luZG93LmluZm9CbG9jayA9IGJsb2Nrcy5pbmZvO1xyXG53aW5kb3cuZXJyb3JCbG9jayA9IGJsb2Nrcy5lcnJvcjtcclxuLy99XHJcblxyXG5BcnJheS5yZW1vdmUgPSByZXF1aXJlKCcuLi9MQy9BcnJheS5yZW1vdmUnKTtcclxucmVxdWlyZSgnLi4vTEMvU3RyaW5nLnByb3RvdHlwZS5jb250YWlucycpO1xyXG5cclxuTEMuZ2V0VGV4dCA9IHJlcXVpcmUoJy4uL0xDL2dldFRleHQnKTtcclxuXHJcbnZhciBUaW1lU3BhbiA9IExDLnRpbWVTcGFuID0gcmVxdWlyZSgnLi4vTEMvVGltZVNwYW4nKTtcclxudmFyIHRpbWVTcGFuRXh0cmEgPSByZXF1aXJlKCcuLi9MQy9UaW1lU3BhbkV4dHJhJyk7XHJcbnRpbWVTcGFuRXh0cmEucGx1Z0luKFRpbWVTcGFuKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzZXNcclxuTEMuc21hcnRUaW1lID0gdGltZVNwYW5FeHRyYS5zbWFydFRpbWU7XHJcbkxDLnJvdW5kVGltZVRvUXVhcnRlckhvdXIgPSB0aW1lU3BhbkV4dHJhLnJvdW5kVG9RdWFydGVySG91cjtcclxuLy99XHJcblxyXG5MQy5DaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi4vTEMvY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG53aW5kb3cuVGFiYmVkVVggPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWCcpO1xyXG52YXIgc2xpZGVyVGFicyA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLnNsaWRlclRhYnMnKTtcclxuXHJcbi8vIFBvcHVwIEFQSXNcclxud2luZG93LnNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi4vTEMvc21vb3RoQm94QmxvY2snKTtcclxuXHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4uL0xDL3BvcHVwJyk7XHJcbi8ve1RFTVBcclxudmFyIHBvcHVwU3R5bGUgPSBwb3B1cC5zdHlsZSxcclxuICAgIHBvcHVwU2l6ZSA9IHBvcHVwLnNpemU7XHJcbkxDLm1lc3NhZ2VQb3B1cCA9IHBvcHVwLm1lc3NhZ2U7XHJcbkxDLmNvbm5lY3RQb3B1cEFjdGlvbiA9IHBvcHVwLmNvbm5lY3RBY3Rpb247XHJcbndpbmRvdy5wb3B1cCA9IHBvcHVwO1xyXG4vL31cclxuXHJcbkxDLnNhbml0aXplV2hpdGVzcGFjZXMgPSByZXF1aXJlKCcuLi9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzJyk7XHJcbi8ve1RFTVAgICBhbGlhcyBiZWNhdXNlIG1pc3NwZWxsaW5nXHJcbkxDLnNhbml0aXplV2hpdGVwYWNlcyA9IExDLnNhbml0aXplV2hpdGVzcGFjZXM7XHJcbi8vfVxyXG5cclxuTEMuZ2V0WFBhdGggPSByZXF1aXJlKCcuLi9MQy9nZXRYUGF0aCcpO1xyXG5cclxudmFyIHN0cmluZ0Zvcm1hdCA9IHJlcXVpcmUoJy4uL0xDL1N0cmluZ0Zvcm1hdCcpO1xyXG5cclxuLy8gRXhwYW5kaW5nIGV4cG9ydGVkIHV0aWxpdGVzIGZyb20gbW9kdWxlcyBkaXJlY3RseSBhcyBMQyBtZW1iZXJzOlxyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvUHJpY2UnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9tYXRoVXRpbHMnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9udW1iZXJVdGlscycpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL3Rvb2x0aXBzJykpO1xyXG52YXIgaTE4biA9IExDLmkxOG4gPSByZXF1aXJlKCcuLi9MQy9pMThuJyk7XHJcbi8ve1RFTVAgb2xkIGFsaXNlcyBvbiBMQyBhbmQgZ2xvYmFsXHJcbiQuZXh0ZW5kKExDLCBpMThuKTtcclxuJC5leHRlbmQod2luZG93LCBpMThuKTtcclxuLy99XHJcblxyXG4vLyB4dHNoOiBwbHVnZWQgaW50byBqcXVlcnkgYW5kIHBhcnQgb2YgTENcclxudmFyIHh0c2ggPSByZXF1aXJlKCcuLi9MQy9qcXVlcnkueHRzaCcpO1xyXG54dHNoLnBsdWdJbigkKTtcclxuLy97VEVNUCAgIHJlbW92ZSBvbGQgTEMuKiBhbGlhc1xyXG4kLmV4dGVuZChMQywgeHRzaCk7XHJcbmRlbGV0ZSBMQy5wbHVnSW47XHJcbi8vfVxyXG5cclxudmFyIGF1dG9DYWxjdWxhdGUgPSBMQy5hdXRvQ2FsY3VsYXRlID0gcmVxdWlyZSgnLi4vTEMvYXV0b0NhbGN1bGF0ZScpO1xyXG4vL3tURU1QICAgcmVtb3ZlIG9sZCBhbGlhcyB1c2VcclxudmFyIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzID0gYXV0b0NhbGN1bGF0ZS5vblRhYmxlSXRlbXM7XHJcbkxDLnNldHVwQ2FsY3VsYXRlU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUub25TdW1tYXJ5O1xyXG5MQy51cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS51cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5O1xyXG5MQy5zZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLm9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTtcclxuLy99XHJcblxyXG52YXIgQ29va2llID0gTEMuQ29va2llID0gcmVxdWlyZSgnLi4vTEMvQ29va2llJyk7XHJcbi8ve1RFTVAgICAgb2xkIGFsaWFzXHJcbnZhciBnZXRDb29raWUgPSBDb29raWUuZ2V0LFxyXG4gICAgc2V0Q29va2llID0gQ29va2llLnNldDtcclxuLy99XHJcblxyXG5MQy5kYXRlUGlja2VyID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVBpY2tlcicpO1xyXG4vL3tURU1QICAgb2xkIGFsaWFzXHJcbndpbmRvdy5zZXR1cERhdGVQaWNrZXIgPSBMQy5zZXR1cERhdGVQaWNrZXIgPSBMQy5kYXRlUGlja2VyLmluaXQ7XHJcbndpbmRvdy5hcHBseURhdGVQaWNrZXIgPSBMQy5hcHBseURhdGVQaWNrZXIgPSBMQy5kYXRlUGlja2VyLmFwcGx5O1xyXG4vL31cclxuXHJcbkxDLmF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4uL0xDL2F1dG9Gb2N1cycpO1xyXG5cclxuLy8gQ1JVRExcclxudmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG5MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxuXHJcbi8vIFVJIFNsaWRlciBMYWJlbHNcclxudmFyIHNsaWRlckxhYmVscyA9IHJlcXVpcmUoJy4uL0xDL1VJU2xpZGVyTGFiZWxzJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG5MQy5jcmVhdGVMYWJlbHNGb3JVSVNsaWRlciA9IHNsaWRlckxhYmVscy5jcmVhdGU7XHJcbkxDLnVwZGF0ZUxhYmVsc0ZvclVJU2xpZGVyID0gc2xpZGVyTGFiZWxzLnVwZGF0ZTtcclxuTEMudWlTbGlkZXJMYWJlbHNMYXlvdXRzID0gc2xpZGVyTGFiZWxzLmxheW91dHM7XHJcbi8vfVxyXG5cclxudmFyIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuLi9MQy92YWxpZGF0aW9uSGVscGVyJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG5MQy5zZXR1cFZhbGlkYXRpb24gPSB2YWxpZGF0aW9uSGVscGVyLnNldHVwO1xyXG5MQy5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQgPSB2YWxpZGF0aW9uSGVscGVyLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDtcclxuTEMuZ29Ub1N1bW1hcnlFcnJvcnMgPSB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzO1xyXG4vL31cclxuXHJcbkxDLnBsYWNlSG9sZGVyID0gcmVxdWlyZSgnLi4vTEMvcGxhY2Vob2xkZXItcG9seWZpbGwnKS5pbml0O1xyXG5cclxuTEMubWFwUmVhZHkgPSByZXF1aXJlKCcuLi9MQy9nb29nbGVNYXBSZWFkeScpO1xyXG5cclxud2luZG93LmlzRW1wdHlTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9pc0VtcHR5U3RyaW5nJyk7XHJcblxyXG53aW5kb3cuZ3VpZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL0xDL2d1aWRHZW5lcmF0b3InKTtcclxuXHJcbnZhciB1cmxVdGlscyA9IHJlcXVpcmUoJy4uL0xDL3VybFV0aWxzJyk7XHJcbndpbmRvdy5nZXRVUkxQYXJhbWV0ZXIgPSB1cmxVdGlscy5nZXRVUkxQYXJhbWV0ZXI7XHJcbndpbmRvdy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSB1cmxVdGlscy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnM7XHJcblxyXG52YXIgZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nJyk7XHJcbi8ve1RFTVBcclxuTEMuZGF0ZVRvSW50ZXJjaGFuZ2xlU3RyaW5nID0gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nO1xyXG4vL31cclxuXHJcbi8vIFBhZ2VzIGluIHBvcHVwXHJcbnZhciB3ZWxjb21lUG9wdXAgPSByZXF1aXJlKCcuL3dlbGNvbWVQb3B1cCcpO1xyXG4vL3ZhciB0YWtlQVRvdXJQb3B1cCA9IHJlcXVpcmUoJ3Rha2VBVG91clBvcHVwJyk7XHJcbnZhciBmYXFzUG9wdXBzID0gcmVxdWlyZSgnLi9mYXFzUG9wdXBzJyk7XHJcbnZhciBhY2NvdW50UG9wdXBzID0gcmVxdWlyZSgnLi9hY2NvdW50UG9wdXBzJyk7XHJcbnZhciBsZWdhbFBvcHVwcyA9IHJlcXVpcmUoJy4vbGVnYWxQb3B1cHMnKTtcclxuXHJcbi8vIE9sZCBhdmFpbGFibGl0eSBjYWxlbmRhclxyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQgPSByZXF1aXJlKCcuL2F2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0Jyk7XHJcbi8vIE5ldyBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyID0gcmVxdWlyZSgnLi4vTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXInKTtcclxuXHJcbnZhciBhdXRvZmlsbFN1Ym1lbnUgPSByZXF1aXJlKCcuLi9MQy9hdXRvZmlsbFN1Ym1lbnUnKTtcclxuXHJcbnZhciB0YWJiZWRXaXphcmQgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC53aXphcmQnKTtcclxuXHJcbnZhciBoYXNDb25maXJtU3VwcG9ydCA9IHJlcXVpcmUoJy4uL0xDL2hhc0NvbmZpcm1TdXBwb3J0Jyk7XHJcblxyXG52YXIgcG9zdGFsQ29kZVZhbGlkYXRpb24gPSByZXF1aXJlKCcuLi9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbicpO1xyXG5cclxudmFyIHRhYmJlZE5vdGlmaWNhdGlvbnMgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcblxyXG52YXIgdGFic0F1dG9sb2FkID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguYXV0b2xvYWQnKTtcclxuXHJcbnZhciBob21lUGFnZSA9IHJlcXVpcmUoJy4vaG9tZScpO1xyXG5cclxuLy97VEVNUCByZW1vdmUgZ2xvYmFsIGRlcGVuZGVuY3kgZm9yIHRoaXNcclxud2luZG93LmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuLi9MQy9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcbi8vfVxyXG5cclxuLyoqXHJcbiAqKiBJbml0IGNvZGVcclxuKioqL1xyXG4kKHdpbmRvdykubG9hZChmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBEaXNhYmxlIGJyb3dzZXIgYmVoYXZpb3IgdG8gYXV0by1zY3JvbGwgdG8gdXJsIGZyYWdtZW50L2hhc2ggZWxlbWVudCBwb3NpdGlvbjpcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyAkKCdodG1sLGJvZHknKS5zY3JvbGxUb3AoMCk7IH0sIDEpO1xyXG59KTtcclxuJChmdW5jdGlvbiAoKSB7XHJcbiAgLy8gUGxhY2Vob2xkZXIgcG9seWZpbGxcclxuICBMQy5wbGFjZUhvbGRlcigpO1xyXG5cclxuICAvLyBBdXRvZm9jdXMgcG9seWZpbGxcclxuICBMQy5hdXRvRm9jdXMoKTtcclxuXHJcbiAgLy8gR2VuZXJpYyBzY3JpcHQgZm9yIGVuaGFuY2VkIHRvb2x0aXBzIGFuZCBlbGVtZW50IGRlc2NyaXB0aW9uc1xyXG4gIExDLmluaXRUb29sdGlwcygpO1xyXG5cclxuICBhamF4Rm9ybXMuaW5pdCgpO1xyXG5cclxuICAvL3Rha2VBVG91clBvcHVwLnNob3coKTtcclxuICB3ZWxjb21lUG9wdXAuc2hvdygpO1xyXG4gIC8vIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyBmb3Igc29tZSBsaW5rcyB0aGF0IGJ5IGRlZmF1bHQgb3BlbiBhIG5ldyB0YWI6XHJcbiAgZmFxc1BvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gIGFjY291bnRQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuICBsZWdhbFBvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG5cclxuICAvLyBPbGQgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbiAgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuaW5pdChMY1VybC5MYW5nUGF0aCk7XHJcbiAgLy8gTmV3IGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG4gIGF2YWlsYWJpbGl0eUNhbGVuZGFyLldlZWtseS5lbmFibGVBbGwoKTtcclxuXHJcbiAgcG9wdXAuY29ubmVjdEFjdGlvbigpO1xyXG5cclxuICAvLyBEYXRlIFBpY2tlclxyXG4gIExDLmRhdGVQaWNrZXIuaW5pdCgpO1xyXG5cclxuICAvKiBBdXRvIGNhbGN1bGF0ZSB0YWJsZSBpdGVtcyB0b3RhbCAocXVhbnRpdHkqdW5pdHByaWNlPWl0ZW0tdG90YWwpIHNjcmlwdCAqL1xyXG4gIGF1dG9DYWxjdWxhdGUub25UYWJsZUl0ZW1zKCk7XHJcbiAgYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnkoKTtcclxuXHJcbiAgaGFzQ29uZmlybVN1cHBvcnQub24oKTtcclxuXHJcbiAgcG9zdGFsQ29kZVZhbGlkYXRpb24uaW5pdCh7IGJhc2VVcmw6IExjVXJsLkxhbmdQYXRoIH0pO1xyXG5cclxuICAvLyBUYWJiZWQgaW50ZXJmYWNlXHJcbiAgdGFic0F1dG9sb2FkLmluaXQoVGFiYmVkVVgpO1xyXG4gIFRhYmJlZFVYLmluaXQoKTtcclxuICBUYWJiZWRVWC5mb2N1c0N1cnJlbnRMb2NhdGlvbigpO1xyXG4gIFRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzKCk7XHJcbiAgc2xpZGVyVGFicy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgdGFiYmVkV2l6YXJkLmluaXQoVGFiYmVkVVgsIHtcclxuICAgIGxvYWRpbmdEZWxheTogZ0xvYWRpbmdSZXRhcmRcclxuICB9KTtcclxuXHJcbiAgdGFiYmVkTm90aWZpY2F0aW9ucy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgYXV0b2ZpbGxTdWJtZW51KCk7XHJcblxyXG4gIC8vIFRPRE86ICdsb2FkSGFzaEJhbmcnIGN1c3RvbSBldmVudCBpbiB1c2U/XHJcbiAgLy8gSWYgdGhlIGhhc2ggdmFsdWUgZm9sbG93IHRoZSAnaGFzaCBiYW5nJyBjb252ZW50aW9uLCBsZXQgb3RoZXJcclxuICAvLyBzY3JpcHRzIGRvIHRoZWlyIHdvcmsgdGhyb3VnaHQgYSAnbG9hZEhhc2hCYW5nJyBldmVudCBoYW5kbGVyXHJcbiAgaWYgKC9eIyEvLnRlc3Qod2luZG93LmxvY2F0aW9uLmhhc2gpKVxyXG4gICAgJChkb2N1bWVudCkudHJpZ2dlcignbG9hZEhhc2hCYW5nJywgd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpKTtcclxuXHJcbiAgLy8gUmVsb2FkIGJ1dHRvbnNcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnJlbG9hZC1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBHZW5lcmljIGFjdGlvbiB0byBjYWxsIGxjLmpxdWVyeSAncmVsb2FkJyBmdW5jdGlvbiBmcm9tIGFuIGVsZW1lbnQgaW5zaWRlIGl0c2VsZi5cclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAkdC5jbG9zZXN0KCR0LmRhdGEoJ3JlbG9hZC10YXJnZXQnKSkucmVsb2FkKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8qIEVuYWJsZSBmb2N1cyB0YWIgb24gZXZlcnkgaGFzaCBjaGFuZ2UsIG5vdyB0aGVyZSBhcmUgdHdvIHNjcmlwdHMgbW9yZSBzcGVjaWZpYyBmb3IgdGhpczpcclxuICAqIG9uZSB3aGVuIHBhZ2UgbG9hZCAod2hlcmU/KSxcclxuICAqIGFuZCBhbm90aGVyIG9ubHkgZm9yIGxpbmtzIHdpdGggJ3RhcmdldC10YWInIGNsYXNzLlxyXG4gICogTmVlZCBiZSBzdHVkeSBpZiBzb21ldGhpbmcgb2YgdGhlcmUgbXVzdCBiZSByZW1vdmVkIG9yIGNoYW5nZWQuXHJcbiAgKiBUaGlzIGlzIG5lZWRlZCBmb3Igb3RoZXIgYmVoYXZpb3JzIHRvIHdvcmsuICovXHJcbiAgLy8gT24gdGFyZ2V0LXRhYiBsaW5rc1xyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhLnRhcmdldC10YWInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgdGhlcmVJc1RhYiA9IFRhYmJlZFVYLmdldFRhYigkKHRoaXMpLmF0dHIoJ2hyZWYnKSk7XHJcbiAgICBpZiAodGhlcmVJc1RhYikge1xyXG4gICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIC8vIE9uIGhhc2ggY2hhbmdlXHJcbiAgaWYgKCQuZm4uaGFzaGNoYW5nZSlcclxuICAgICQod2luZG93KS5oYXNoY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgaWYgKCEvXiMhLy50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICAgICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgaWYgKHRoZXJlSXNUYWIpXHJcbiAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIC8vIEhPTUUgUEFHRSAvIFNFQVJDSCBTVFVGRlxyXG4gIGhvbWVQYWdlLmluaXQoKTtcclxuXHJcbiAgLy8gVmFsaWRhdGlvbiBhdXRvIHNldHVwIGZvciBwYWdlIHJlYWR5IGFuZCBhZnRlciBldmVyeSBhamF4IHJlcXVlc3RcclxuICAvLyBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGZvcm0gaW4gdGhlIHBhZ2UuXHJcbiAgLy8gVGhpcyBhdm9pZCB0aGUgbmVlZCBmb3IgZXZlcnkgcGFnZSB3aXRoIGZvcm0gdG8gZG8gdGhlIHNldHVwIGl0c2VsZlxyXG4gIC8vIGFsbW9zdCBmb3IgbW9zdCBvZiB0aGUgY2FzZS5cclxuICBmdW5jdGlvbiBhdXRvU2V0dXBWYWxpZGF0aW9uKCkge1xyXG4gICAgaWYgKCQoZG9jdW1lbnQpLmhhcygnZm9ybScpLmxlbmd0aClcclxuICAgICAgdmFsaWRhdGlvbkhlbHBlci5zZXR1cCgnZm9ybScpO1xyXG4gIH1cclxuICBhdXRvU2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgJChkb2N1bWVudCkuYWpheENvbXBsZXRlKGF1dG9TZXR1cFZhbGlkYXRpb24pO1xyXG5cclxuICAvLyBUT0RPOiB1c2VkIHNvbWUgdGltZT8gc3RpbGwgcmVxdWlyZWQgdXNpbmcgbW9kdWxlcz9cclxuICAvKlxyXG4gICogQ29tbXVuaWNhdGUgdGhhdCBzY3JpcHQuanMgaXMgcmVhZHkgdG8gYmUgdXNlZFxyXG4gICogYW5kIHRoZSBjb21tb24gTEMgbGliIHRvby5cclxuICAqIEJvdGggYXJlIGVuc3VyZWQgdG8gYmUgcmFpc2VkIGV2ZXIgYWZ0ZXIgcGFnZSBpcyByZWFkeSB0b28uXHJcbiAgKi9cclxuICAkKGRvY3VtZW50KVxyXG4gICAgLnRyaWdnZXIoJ2xjU2NyaXB0UmVhZHknKVxyXG4gICAgLnRyaWdnZXIoJ2xjTGliUmVhZHknKTtcclxufSk7IiwiLyoqKioqIEFWQUlMQUJJTElUWSBDQUxFTkRBUiBXSURHRVQgKioqKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4uL0xDL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9kYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcnKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0KGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY2FsZW5kYXItY29udHJvbHMgLmFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5oYXNDbGFzcygnem9vbS1hY3Rpb24nKSkge1xyXG4gICAgICAgICAgICAvLyBEbyB6b29tXHJcbiAgICAgICAgICAgIHZhciBjID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpLmZpbmQoJy5jYWxlbmRhcicpLmNsb25lKCk7XHJcbiAgICAgICAgICAgIGMuY3NzKCdmb250LXNpemUnLCAnMnB4Jyk7XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSAkdC5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAgICAgYy5kYXRhKCdwb3B1cC1jb250YWluZXInLCB0YWIpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIHRhYiwgJ2F2YWlsYWJpbGl0eS1jYWxlbmRhcicsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIC8vIE5vdGhpbmcgbW9yZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5hdmlnYXRlIGNhbGVuZGFyXHJcbiAgICAgICAgdmFyIG5leHQgPSAkdC5oYXNDbGFzcygnbmV4dC13ZWVrLWFjdGlvbicpO1xyXG4gICAgICAgIHZhciBjb250ID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpO1xyXG4gICAgICAgIHZhciBjYWxjb250ID0gY29udC5jaGlsZHJlbignLmNhbGVuZGFyLWNvbnRhaW5lcicpO1xyXG4gICAgICAgIHZhciBjYWwgPSBjYWxjb250LmNoaWxkcmVuKCcuY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsaW5mbyA9IGNvbnQuZmluZCgnLmNhbGVuZGFyLWluZm8nKTtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKGNhbC5kYXRhKCdzaG93ZWQtZGF0ZScpKTtcclxuICAgICAgICB2YXIgdXNlcklkID0gY2FsLmRhdGEoJ3VzZXItaWQnKTtcclxuICAgICAgICBpZiAobmV4dClcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgNyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgLSA3KTtcclxuICAgICAgICB2YXIgc3RyZGF0ZSA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKTtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArIFwiUHJvZmlsZS8kQXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQvV2Vlay9cIiArIGVuY29kZVVSSUNvbXBvbmVudChzdHJkYXRlKSArIFwiLz9Vc2VySUQ9XCIgKyB1c2VySWQ7XHJcbiAgICAgICAgY2FsY29udC5yZWxvYWQodXJsLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIGdldCB0aGUgbmV3IG9iamVjdDpcclxuICAgICAgICAgICAgdmFyIGNhbCA9ICQoJy5jYWxlbmRhcicsIHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLnllYXItd2VlaycpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC13ZWVrJykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5maXJzdC13ZWVrLWRheScpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC1maXJzdC1kYXknKSk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLmxhc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtbGFzdC1kYXknKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBGQVFzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBmYXFzQmFzZVVybCA9ICdIZWxwQ2VudGVyLyRGQVFzJztcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICBmYXFzQmFzZVVybCA9IChiYXNlVXJsIHx8ICcvJykgKyBmYXFzQmFzZVVybDtcclxuXHJcbiAgLy8gRW5hYmxlIEZBUXMgbGlua3MgaW4gcG9wdXBcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYVtocmVmfD1cIiNGQVFzXCJdJywgcG9wdXBGYXFzKTtcclxuXHJcbiAgLy8gQXV0byBvcGVuIGN1cnJlbnQgZG9jdW1lbnQgbG9jYXRpb24gaWYgaGFzaCBpcyBhIEZBUSBsaW5rXHJcbiAgaWYgKC9eI0ZBUXMvaS50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICBwb3B1cEZhcXMobG9jYXRpb24uaGFzaCk7XHJcbiAgfVxyXG5cclxuICAvLyByZXR1cm4gYXMgdXRpbGl0eVxyXG4gIHJldHVybiBwb3B1cEZhcXM7XHJcbn07XHJcblxyXG4vKiBQYXNzIGEgRmFxcyBAdXJsIG9yIHVzZSBhcyBhIGxpbmsgaGFuZGxlciB0byBvcGVuIHRoZSBGQVEgaW4gYSBwb3B1cFxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdXBGYXFzKHVybCkge1xyXG4gIHVybCA9IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcclxuXHJcbiAgdmFyIHVybHBhcnRzID0gdXJsLnNwbGl0KCctJyk7XHJcblxyXG4gIGlmICh1cmxwYXJ0c1swXSAhPSAnI0ZBUXMnKSB7XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdUaGUgVVJMIGlzIG5vdCBhIEZBUSB1cmwgKGRvZXNuXFwndCBzdGFydHMgd2l0aCAjRkFRcy0pJywgdXJsKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgdmFyIHVybHNlY3Rpb24gPSB1cmxwYXJ0cy5sZW5ndGggPiAxID8gdXJscGFydHNbMV0gOiAnJztcclxuXHJcbiAgaWYgKHVybHNlY3Rpb24pIHtcclxuICAgIHZhciBwdXAgPSBwb3B1cChmYXFzQmFzZVVybCArIHVybHNlY3Rpb24sICdsYXJnZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGQgPSAkKHVybCksXHJcbiAgICAgICAgcGVsID0gcHVwLmdldENvbnRlbnRFbGVtZW50KCk7XHJcbiAgICAgIHBlbC5zY3JvbGxUb3AocGVsLnNjcm9sbFRvcCgpICsgZC5wb3NpdGlvbigpLnRvcCAtIDUwKTtcclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZC5lZmZlY3QoXCJoaWdobGlnaHRcIiwge30sIDIwMDApO1xyXG4gICAgICB9LCA0MDApO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufSIsIi8qIElOSVQgKi9cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gTG9jYXRpb24ganMtZHJvcGRvd25cclxuICAgIHZhciBzID0gJCgnI3NlYXJjaC1sb2NhdGlvbicpO1xyXG4gICAgcy5wcm9wKCdyZWFkb25seScsIHRydWUpO1xyXG4gICAgcy5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgIHNvdXJjZTogTEMuc2VhcmNoTG9jYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBhdXRvRm9jdXM6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIG1pbkxlbmd0aDogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgc2VsZWN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHMub24oJ2ZvY3VzIGNsaWNrJywgZnVuY3Rpb24gKCkgeyBzLmF1dG9jb21wbGV0ZSgnc2VhcmNoJywgJycpOyB9KTtcclxuXHJcbiAgICAvKiBQb3NpdGlvbnMgYXV0b2NvbXBsZXRlICovXHJcbiAgICB2YXIgcG9zaXRpb25zQXV0b2NvbXBsZXRlID0gJCgnI3NlYXJjaC1zZXJ2aWNlJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgICAgICAgLy8kKHRoaXMpLnZhbCh1aS5pdGVtLmxhYmVsKTtcclxuICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICAgICAvLyQodGhpcykudmFsKHVpLml0ZW0ubGFiZWwpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBMb2FkIGFsbCBwb3NpdGlvbnMgaW4gYmFja2dyb3VuZCB0byByZXBsYWNlIHRoZSBhdXRvY29tcGxldGUgc291cmNlIChhdm9pZGluZyBtdWx0aXBsZSwgc2xvdyBsb29rLXVwcylcclxuICAgIC8qJC5nZXRKU09OKExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdvcHRpb24nLCAnc291cmNlJywgZGF0YSk7XHJcbiAgICB9XHJcbiAgICApOyovXHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIExlZ2FsIHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJy52aWV3LXByaXZhY3ktcG9saWN5JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBvcHVwKGJhc2VVcmwgKyAnSGVscENlbnRlci8kUHJpdmFjeVBvbGljeS8nLCAnbGFyZ2UnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcudmlldy10ZXJtcy1vZi11c2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcG9wdXAoYmFzZVVybCArICdIZWxwQ2VudGVyLyRUZXJtc09mVXNlLycsICdsYXJnZScpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4qIFdlbGNvbWUgcG9wdXBcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy9UT0RPIG1vcmUgZGVwZW5kZW5jaWVzP1xyXG5cclxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24gd2VsY29tZVBvcHVwKCkge1xyXG4gICAgdmFyIGMgPSAkKCcjd2VsY29tZXBvcHVwJyk7XHJcbiAgICBpZiAoYy5sZW5ndGggPT09IDApIHJldHVybjtcclxuICAgIHZhciBza2lwU3RlcDEgPSBjLmhhc0NsYXNzKCdzZWxlY3QtcG9zaXRpb24nKTtcclxuXHJcbiAgICAvLyBJbml0XHJcbiAgICBpZiAoIXNraXBTdGVwMSkge1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSwgLnRlcm1zLCAucG9zaXRpb24tZGVzY3JpcHRpb24nKS5oaWRlKCk7XHJcbiAgICB9XHJcbiAgICBjLmZpbmQoJ2Zvcm0nKS5nZXQoMCkucmVzZXQoKTtcclxuICAgIC8vIFJlLWVuYWJsZSBhdXRvY29tcGxldGU6XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgYy5maW5kKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTsgfSwgNTAwKTtcclxuICAgIGZ1bmN0aW9uIGluaXRQcm9maWxlRGF0YSgpIHtcclxuICAgICAgICBjLmZpbmQoJ1tuYW1lPWpvYnRpdGxlXScpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgICAgICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICAgICAgICBtaW5MZW5ndGg6IDAsXHJcbiAgICAgICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAgICAgLy8gTm8gdmFsdWUsIG5vIGFjdGlvbiA6KFxyXG4gICAgICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS52YWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgaWQgKHZhbHVlKSBpbiB0aGUgaGlkZGVuIGVsZW1lbnRcclxuICAgICAgICAgICAgICAgIGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF0nKS52YWwodWkuaXRlbS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAvLyBTaG93IGRlc2NyaXB0aW9uXHJcbiAgICAgICAgICAgICAgICBjLmZpbmQoJy5wb3NpdGlvbi1kZXNjcmlwdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zbGlkZURvd24oJ2Zhc3QnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgndGV4dGFyZWEnKS52YWwodWkuaXRlbS5kZXNjcmlwdGlvbik7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSB3YW50IHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSB3YW50IHRoZSBsYWJlbCBpbiB0ZXh0Ym94LCBub3QgdGhlIHZhbHVlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpbml0UHJvZmlsZURhdGEoKTtcclxuICAgIGMuZmluZCgnI3dlbGNvbWVwb3B1cExvYWRpbmcnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBBY3Rpb25zXHJcbiAgICBjLm9uKCdjaGFuZ2UnLCAnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpOm5vdCguJyArIHRoaXMudmFsdWUgKyAnKScpLmhpZGUoKTtcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSwgaGVhZGVyIC5wcmVzZW50YXRpb24nKS5zbGlkZVVwKCdmYXN0Jyk7XHJcbiAgICAgICAgYy5maW5kKCcudGVybXMsIC5wcm9maWxlLWRhdGEnKS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuICAgICAgICAvLyBUZXJtcyBvZiB1c2UgZGlmZmVyZW50IGZvciBwcm9maWxlIHR5cGVcclxuICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSAnY3VzdG9tZXInKVxyXG4gICAgICAgICAgICBjLmZpbmQoJ2EudGVybXMtb2YtdXNlJykuZGF0YSgndG9vbHRpcC11cmwnLCBudWxsKTtcclxuICAgICAgICAvLyBDaGFuZ2UgZmFjZWJvb2sgcmVkaXJlY3QgbGlua1xyXG4gICAgICAgIHZhciBmYmMgPSBjLmZpbmQoJy5mYWNlYm9vay1jb25uZWN0Jyk7XHJcbiAgICAgICAgdmFyIGFkZFJlZGlyZWN0ID0gJ2N1c3RvbWVycyc7XHJcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gJ3Byb3ZpZGVyJylcclxuICAgICAgICAgICAgYWRkUmVkaXJlY3QgPSAncHJvdmlkZXJzJztcclxuICAgICAgICBmYmMuZGF0YSgncmVkaXJlY3QnLCBmYmMuZGF0YSgncmVkaXJlY3QnKSArIGFkZFJlZGlyZWN0KTtcclxuICAgICAgICBmYmMuZGF0YSgncHJvZmlsZScsIHRoaXMudmFsdWUpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdmFsaWRhdGlvbi1yZXF1aXJlZCBmb3IgZGVwZW5kaW5nIG9mIHByb2ZpbGUtdHlwZSBmb3JtIGVsZW1lbnRzOlxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaS4nICsgdGhpcy52YWx1ZSArICcgaW5wdXQ6bm90KFtkYXRhLXZhbF0pOm5vdChbdHlwZT1oaWRkZW5dKScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtdmFsLXJlcXVpcmVkJywgJycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtdmFsJywgdHJ1ZSk7XHJcbiAgICAgICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgICB9KTtcclxuICAgIGMub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0uYWpheCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpbml0UHJvZmlsZURhdGEoKTtcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdOmNoZWNrZWQnKS5jaGFuZ2UoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIElmIHByb2ZpbGUgdHlwZSBpcyBwcmVmaWxsZWQgYnkgcmVxdWVzdDpcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV06Y2hlY2tlZCcpLmNoYW5nZSgpO1xyXG59O1xyXG4iXX0=
