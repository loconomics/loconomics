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
  DataSource.prototype.fetchData.onerror.call(this, x, s, e);
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
        return { name: 'data-format', message: data.ErrorMessage };
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
},{"./LcUrl":10,"./blockPresets":35,"./loader":62,"./popup":68,"./redirectTo":70}],"LC/FacebookConnect":[function(require,module,exports){
module.exports=require('cwp+TC');
},{}],10:[function(require,module,exports){
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
},{"./mathUtils":63}],12:[function(require,module,exports){
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
},{"./jquery.reload":58}],19:[function(require,module,exports){
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
},{"./jquery.hasScrollBar":55}],21:[function(require,module,exports){
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
},{"./ajaxCallbacks":28,"./blockPresets":35,"./changesNotification":"f5kckb","./popup":68,"./redirectTo":70,"./validationHelper":"kqf9lt"}],"LC/TimeSpan":[function(require,module,exports){
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

},{"./TimeSpan":"rqZkA9","./mathUtils":63}],"LC/TimeSpanExtra":[function(require,module,exports){
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

},{"./TimeSpan":"rqZkA9","./mathUtils":63,"./tooltips":"UTsC2v"}],28:[function(require,module,exports){
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
},{"./changesNotification":"f5kckb","./createIframe":38,"./moveFocusTo":"9RKOGW","./popup":68,"./redirectTo":70,"./smoothBoxBlock":"KQGzNM","./validationHelper":"kqf9lt"}],29:[function(require,module,exports){
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
},{"./ajaxCallbacks":28,"./blockPresets":35,"./changesNotification":"f5kckb","./validationHelper":"kqf9lt"}],30:[function(require,module,exports){
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
},{"./numberUtils":66}],31:[function(require,module,exports){
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

function weeklyIsDataInCache(weekly, datesRange) {
  // Check cache: if there is almost one date in the range
  // without data, we set inCache as false and fetch the data:
  var inCache = true;
  eachDateInRange(datesRange.start, datesRange.end, function (date) {
    var datekey = dateISO.dateLocal(date, true);
    if (!weekly.data.slots[datekey]) {
      inCache = false;
      return false;
    }
  });
  return inCache;
}

function weeklyCheckAndPrefetch(weekly, currentDatesRange) {
  var nextDatesRange = datesToRange(
    addDays(currentDatesRange.start, 7),
    addDays(currentDatesRange.end, 7)
  );

  if (!weeklyIsDataInCache(weekly, nextDatesRange)) {
    // Prefetching next week in advance
    var prefetchQuery = datesToQuery(nextDatesRange);
    weekly.fetchData(prefetchQuery, null, true);
  }
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
  Make unselectable
**/
var makeUnselectable = (function(){ 
  var falsyfn = function(){ return false; };
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

  var on = function(el){
    el = $(el);
    el.on('selectstart', falsyfn);
    //$(document).on('selectstart', falsyfn);
    el.css(nodragStyle);
  };

  var off = function(el){
    el = $(el);
    el.off('selectstart', falsyfn);
    //$(document).off('selectstart', falsyfn);
    el.css(dragdefaultStyle);
  };

  on.off = off;
  return on;
}());

/**
  Cross browser way to unselect current selection
**/
function clearCurrentSelection() {
  if (typeof (window.getSelection) === 'function')
  // Standard
    window.getSelection().removeAllRanges();
  else if (document.selection && typeof (document.selection.empty) === 'function')
  // IE
    document.selection.empty();
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

  if (!this.data || !this.data.defaultStatus)
    return;

  // Set all slots with default status
  slots.addClass(this.classes.slotStatusPrefix + this.data.defaultStatus);

  if (!this.data.slots || !this.data.status)
    return;

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
  this.fetchData(datesToQuery(firstDates)).done(function () {
    that.bindData(firstDates);
    // Prefetching next week in advance
    weeklyCheckAndPrefetch(that, firstDates);
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

  if (!this.data || !this.data.defaultStatus)
    return;

  // Set all slots with default status
  slots.addClass(this.classes.slotStatusPrefix + this.data.defaultStatus);

  if (!this.data.slots || !this.data.status)
    return;

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
},{"./CX/LcWidget":5,"./CX/extend":6,"./jquery.bounds":54,"LC/dateISO8601":"0dIKTs"}],"LC/availabilityCalendar":[function(require,module,exports){
module.exports=require('XnVhYw');
},{}],35:[function(require,module,exports){
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
},{"./getXPath":46,"./jqueryUtils":"7/CV3J"}],38:[function(require,module,exports){
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


},{}],39:[function(require,module,exports){
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
              // Scroll to crudl
              moveFocusTo(crudl, { marginTop: 50, duration: 200 });

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

},{"./changesNotification":"f5kckb","./getText":"qf5Iz3","./jquery.xtsh":59,"./moveFocusTo":"9RKOGW","./smoothBoxBlock":"KQGzNM"}],"LC/dateISO8601":[function(require,module,exports){
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
},{}],42:[function(require,module,exports){
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

},{}],43:[function(require,module,exports){
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
module.exports=require('qf5Iz3');
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
},{"./jqueryUtils":"7/CV3J"}],46:[function(require,module,exports){
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

},{"./loader":62}],49:[function(require,module,exports){
/* GUID Generator
 */
module.exports = function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
},{}],50:[function(require,module,exports){
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
},{}],51:[function(require,module,exports){
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
},{}],52:[function(require,module,exports){
/* Returns true when str is
- null
- empty string
- only white spaces string
*/
module.exports = function isEmptyString(str) {
    return !(/\S/g.test(str || ""));
};
},{}],53:[function(require,module,exports){
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
},{}],54:[function(require,module,exports){
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
},{}],55:[function(require,module,exports){
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
},{}],56:[function(require,module,exports){
/** Checks if current element or one of the current set of elements has
a parent that match the element or expression given as first parameter
**/
var $ = jQuery || require('jquery');
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};
},{}],57:[function(require,module,exports){
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
},{}],58:[function(require,module,exports){
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
},{"./smoothBoxBlock":"KQGzNM"}],59:[function(require,module,exports){
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

},{}],62:[function(require,module,exports){
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
},{}],63:[function(require,module,exports){
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
},{}],66:[function(require,module,exports){
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
},{"./i18n":51,"./mathUtils":63}],67:[function(require,module,exports){
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
},{}],68:[function(require,module,exports){
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
},{"./createIframe":38,"./moveFocusTo":"9RKOGW","./smoothBoxBlock":"KQGzNM"}],69:[function(require,module,exports){
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
},{}],70:[function(require,module,exports){
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

},{}],71:[function(require,module,exports){
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
},{"./autoFocus":31,"./jquery.xtsh":59,"./jqueryUtils":"7/CV3J","./moveFocusTo":"9RKOGW"}],"UTsC2v":[function(require,module,exports){
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

},{"./jquery.isChildOf":56,"./jquery.outerHtml":57,"./sanitizeWhitespaces":71}],"LC/tooltips":[function(require,module,exports){
module.exports=require('UTsC2v');
},{}],76:[function(require,module,exports){
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
},{}],79:[function(require,module,exports){
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
},{}],80:[function(require,module,exports){
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
},{"../LC/Array.remove":1,"../LC/Cookie":7,"../LC/LcUrl":10,"../LC/Price":11,"../LC/String.prototype.contains":15,"../LC/StringFormat":"KqXDvj","../LC/TabbedUX":20,"../LC/TabbedUX.autoload":18,"../LC/TabbedUX.changesNotification":19,"../LC/TabbedUX.sliderTabs":21,"../LC/TabbedUX.wizard":22,"../LC/TimeSpan":"rqZkA9","../LC/TimeSpanExtra":"5OLBBz","../LC/UISliderLabels":27,"../LC/ajaxCallbacks":28,"../LC/ajaxForms":29,"../LC/autoCalculate":30,"../LC/autoFocus":31,"../LC/autofillSubmenu":32,"../LC/availabilityCalendar":"XnVhYw","../LC/blockPresets":35,"../LC/changesNotification":"f5kckb","../LC/crudl":39,"../LC/datePicker":42,"../LC/dateToInterchangeableString":43,"../LC/getText":"qf5Iz3","../LC/getXPath":46,"../LC/googleMapReady":"ygr/Yz","../LC/guidGenerator":49,"../LC/hasConfirmSupport":50,"../LC/i18n":51,"../LC/isEmptyString":52,"../LC/jquery.are":53,"../LC/jquery.hasScrollBar":55,"../LC/jquery.reload":58,"../LC/jquery.xtsh":59,"../LC/jqueryUtils":"7/CV3J","../LC/loader":62,"../LC/mathUtils":63,"../LC/moveFocusTo":"9RKOGW","../LC/numberUtils":66,"../LC/placeholder-polyfill":67,"../LC/popup":68,"../LC/postalCodeServerValidation":69,"../LC/sanitizeWhitespaces":71,"../LC/smoothBoxBlock":"KQGzNM","../LC/tooltips":"UTsC2v","../LC/urlUtils":76,"../LC/validationHelper":"kqf9lt","./accountPopups":79,"./availabilityCalendarWidget":81,"./faqsPopups":82,"./home":83,"./legalPopups":84,"./providerWelcome":85,"./welcomePopup":86}],81:[function(require,module,exports){
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
},{"../LC/dateToInterchangeableString":43,"../LC/jquery.reload":58,"../LC/smoothBoxBlock":"KQGzNM"}],82:[function(require,module,exports){
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
},{}],83:[function(require,module,exports){
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
},{}],84:[function(require,module,exports){
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
},{}],85:[function(require,module,exports){
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

},{"LC/SimpleSlider":"aFoCK0"}],86:[function(require,module,exports){
/**
* Welcome popup
*/
var $ = require('jquery');
// bootstrap tooltips:
require('bootstrap');
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
      $(this).popover({
        title: 'Does this sound like you?',
        content: ui.item.description,
        placement: 'left'
      }).popover('show');
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
        if (!ui || !ui.item || !ui.item.positionSingular);
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

},{}]},{},[80,"cwp+TC","0dIKTs","aFoCK0"])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0FycmF5LnJlbW92ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9CaW5kYWJsZUNvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9Db21wb25lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ1gvRGF0YVNvdXJjZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9MY1dpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9leHRlbmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ29va2llLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0ZhY2Vib29rQ29ubmVjdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9MY1VybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9QcmljZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9SZWdFeHAucXVvdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU2ltcGxlU2xpZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nRm9ybWF0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmF1dG9sb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguc2xpZGVyVGFicy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC53aXphcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW5FeHRyYS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9VSVNsaWRlckxhYmVscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Q2FsbGJhY2tzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhGb3Jtcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvQ2FsY3VsYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9Gb2N1cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvZmlsbFN1Ym1lbnUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYmxvY2tQcmVzZXRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvY3JlYXRlSWZyYW1lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVJU084NjAxLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFRleHQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ29vZ2xlTWFwUmVhZHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ3VpZEdlbmVyYXRvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9oYXNDb25maXJtU3VwcG9ydC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pMThuLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2lzRW1wdHlTdHJpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmFyZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuYm91bmRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmlzQ2hpbGRPZi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkub3V0ZXJIdG1sLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5yZWxvYWQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbG9hZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL21hdGhVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tb3ZlRm9jdXNUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9udW1iZXJVdGlscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3B1cC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9yZWRpcmVjdFRvLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9vbHRpcHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdXJsVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYWNjb3VudFBvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXBwLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9hdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZmFxc1BvcHVwcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvaG9tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvbGVnYWxQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3Byb3ZpZGVyV2VsY29tZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvd2VsY29tZVBvcHVwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3RwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDL01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQXJyYXkgUmVtb3ZlIC0gQnkgSm9obiBSZXNpZyAoTUlUIExpY2Vuc2VkKVxyXG4vKkFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcclxuSWFnb1NSTDogaXQgc2VlbXMgaW5jb21wYXRpYmxlIHdpdGggTW9kZXJuaXpyIGxvYWRlciBmZWF0dXJlIGxvYWRpbmcgWmVuZGVzayBzY3JpcHQsXHJcbm1vdmVkIGZyb20gcHJvdG90eXBlIHRvIGEgY2xhc3Mtc3RhdGljIG1ldGhvZCAqL1xyXG5mdW5jdGlvbiBhcnJheVJlbW92ZShhbkFycmF5LCBmcm9tLCB0bykge1xyXG4gICAgdmFyIHJlc3QgPSBhbkFycmF5LnNsaWNlKCh0byB8fCBmcm9tKSArIDEgfHwgYW5BcnJheS5sZW5ndGgpO1xyXG4gICAgYW5BcnJheS5sZW5ndGggPSBmcm9tIDwgMCA/IGFuQXJyYXkubGVuZ3RoICsgZnJvbSA6IGZyb207XHJcbiAgICByZXR1cm4gYW5BcnJheS5wdXNoLmFwcGx5KGFuQXJyYXksIHJlc3QpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXJyYXlSZW1vdmU7XHJcbn0gZWxzZSB7XHJcbiAgICBBcnJheS5yZW1vdmUgPSBhcnJheVJlbW92ZTtcclxufSIsIi8qKlxyXG4gIEJpbmRhYmxlIFVJIENvbXBvbmVudC5cclxuICBJdCByZWxpZXMgb24gQ29tcG9uZW50IGJ1dCBhZGRzIERhdGFTb3VyY2UgY2FwYWJpbGl0aWVzXHJcbioqL1xyXG52YXIgRGF0YVNvdXJjZSA9IHJlcXVpcmUoJy4vRGF0YVNvdXJjZScpO1xyXG52YXIgQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9Db21wb25lbnQnKTtcclxudmFyIGV4dGVuZCA9IHJlcXVpcmUoJy4vZXh0ZW5kJykuZXh0ZW5kO1xyXG5cclxuLyoqXHJcblJldXNpbmcgdGhlIG9yaWdpbmFsIGZldGNoRGF0YSBtZXRob2QgYnV0IGFkZGluZyBjbGFzc2VzIHRvIG91clxyXG5jb21wb25lbnQgZWxlbWVudCBmb3IgYW55IHZpc3VhbCBub3RpZmljYXRpb24gb2YgdGhlIGRhdGEgbG9hZGluZy5cclxuTWV0aG9kIGdldCBleHRlbmRlZCB3aXRoIGlzUHJlZmV0Y2hpbmcgbWV0aG9kIGZvciBkaWZmZXJlbnRcclxuY2xhc3Nlcy9ub3RpZmljYXRpb25zIGRlcGVuZGFudCBvbiB0aGF0IGZsYWcsIGJ5IGRlZmF1bHQgZmFsc2U6XHJcbioqL1xyXG52YXIgY29tcG9uZW50RmV0Y2hEYXRhID0gZnVuY3Rpb24gYmluZGFibGVDb21wb25lbnRGZXRjaERhdGEocXVlcnlEYXRhLCBtb2RlLCBpc1ByZWZldGNoaW5nKSB7XHJcbiAgdmFyIGNsID0gaXNQcmVmZXRjaGluZyA/IHRoaXMuY2xhc3Nlcy5wcmVmZXRjaGluZyA6IHRoaXMuY2xhc3Nlcy5mZXRjaGluZztcclxuICB0aGlzLiRlbC5hZGRDbGFzcyhjbCk7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB2YXIgcmVxID0gRGF0YVNvdXJjZS5wcm90b3R5cGUuZmV0Y2hEYXRhLmNhbGwodGhpcywgcXVlcnlEYXRhLCBtb2RlKVxyXG4gIC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuJGVsLnJlbW92ZUNsYXNzKGNsIHx8ICdfJylcclxuICAgIC8vIFJlbW92ZSBlcnJvciBjbGFzcyB0b28gKHRvIGZpbGwgdGhlIGNhc2Ugb2YgYSBwcmV2aW91cyBlcnJvcilcclxuICAgIC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuaGFzRGF0YUVycm9yIHx8ICdfJyk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiByZXE7XHJcbn07XHJcbi8qKlxyXG5SZXBsYWNpbmcsIGJ1dCByZXVzaW5nIGludGVybmFscywgdGhlIGRlZmF1bHQgb25lcnJvciBjYWxsYmFjayBmb3IgdGhlXHJcbmZldGNoRGF0YSBmdW5jdGlvbiB0byBhZGQgbm90aWZpY2F0aW9uIGNsYXNzZXMgdG8gb3VyIGNvbXBvbmVudCBtb2RlbFxyXG4qKi9cclxuY29tcG9uZW50RmV0Y2hEYXRhLm9uZXJyb3IgPSBmdW5jdGlvbiBiaW5kYWJsZUNvbXBvbmVudEZlY2hEYXRhT25lcnJvcih4LCBzLCBlKSB7XHJcbiAgRGF0YVNvdXJjZS5wcm90b3R5cGUuZmV0Y2hEYXRhLm9uZXJyb3IuY2FsbCh0aGlzLCB4LCBzLCBlKTtcclxuICAvLyBBZGQgZXJyb3IgY2xhc3M6XHJcbiAgdGhpcy4kZWxcclxuICAuYWRkQ2xhc3ModGhpcy5jbGFzc2VzLmhhc0RhdGFFcnJvcilcclxuICAucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJylcclxuICAucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnByZWZldGNoaW5nIHx8ICdfJyk7XHJcbn07XHJcblxyXG4vKipcclxuICBCaW5kYWJsZUNvbXBvbmVudCBjbGFzc1xyXG4qKi9cclxudmFyIEJpbmRhYmxlQ29tcG9uZW50ID0gQ29tcG9uZW50LmV4dGVuZChcclxuICBEYXRhU291cmNlLnByb3RvdHlwZSxcclxuICAvLyBQcm90b3R5cGVcclxuICB7XHJcbiAgICBjbGFzc2VzOiB7XHJcbiAgICAgIGZldGNoaW5nOiAnaXMtbG9hZGluZycsXHJcbiAgICAgIHByZWZldGNoaW5nOiAnaXMtcHJlbG9hZGluZycsXHJcbiAgICAgIGRpc2FibGVkOiAnaXMtZGlzYWJsZWQnLFxyXG4gICAgICBoYXNEYXRhRXJyb3I6ICdoYXMtZGF0YUVycm9yJ1xyXG4gICAgfSxcclxuICAgIGZldGNoRGF0YTogY29tcG9uZW50RmV0Y2hEYXRhLFxyXG4gICAgLy8gV2hhdCBhdHRyaWJ1dGUgbmFtZSB1c2UgdG8gbWFyayBlbGVtZW50cyBpbnNpZGUgdGhlIGNvbXBvbmVudFxyXG4gICAgLy8gd2l0aCB0aGUgcHJvcGVydHkgZnJvbSB0aGUgc291cmNlIHRvIGJpbmQuXHJcbiAgICAvLyBUaGUgcHJlZml4ICdkYXRhLScgaW4gY3VzdG9tIGF0dHJpYnV0ZXMgaXMgcmVxdWlyZWQgYnkgaHRtbDUsXHJcbiAgICAvLyBqdXN0IHNwZWNpZnkgdGhlIHNlY29uZCBwYXJ0LCBiZWluZyAnYmluZCcgdGhlIGF0dHJpYnV0ZVxyXG4gICAgLy8gbmFtZSB0byB1c2UgaXMgJ2RhdGEtYmluZCdcclxuICAgIGRhdGFCaW5kQXR0cmlidXRlOiAnYmluZCcsXHJcbiAgICAvLyBEZWZhdWx0IGJpbmREYXRhIGltcGxlbWVudGF0aW9uLCBjYW4gYmUgcmVwbGFjZSBvbiBleHRlbmRlZCBjb21wb25lbnRzXHJcbiAgICAvLyB0byBzb21ldGhpbmcgbW9yZSBjb21wbGV4IChsaXN0L2NvbGxlY3Rpb25zLCBzdWItb2JqZWN0cywgY3VzdG9tIHN0cnVjdHVyZXNcclxuICAgIC8vIGFuZCB2aXN1YWxpemF0aW9uIC0ta2VlcCBhcyBwb3NzaWJsZSB0aGUgdXNlIG9mIGRhdGFCaW5kQXR0cmlidXRlIGZvciByZXVzYWJsZSBjb2RlKS5cclxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gd29ya3MgZmluZSBmb3IgZGF0YSBhcyBwbGFpbiBvYmplY3Qgd2l0aCBcclxuICAgIC8vIHNpbXBsZSB0eXBlcyBhcyBwcm9wZXJ0aWVzIChub3Qgb2JqZWN0cyBvciBhcnJheXMgaW5zaWRlIHRoZW0pLlxyXG4gICAgYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhKCkge1xyXG4gICAgICBpZiAoIXRoaXMuZGF0YSkgcmV0dXJuO1xyXG4gICAgICAvLyBDaGVjayBldmVyeSBlbGVtZW50IGluIHRoZSBjb21wb25lbnQgd2l0aCBhIGJpbmRcclxuICAgICAgLy8gcHJvcGVydHkgYW5kIHVwZGF0ZSBpdCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGF0IHByb3BlcnR5XHJcbiAgICAgIC8vIGZyb20gdGhlIGRhdGEgc291cmNlXHJcbiAgICAgIHZhciBhdHQgPSB0aGlzLmRhdGFCaW5kQXR0cmlidXRlO1xyXG4gICAgICB2YXIgYXR0clNlbGVjdG9yID0gJ1tkYXRhLScgKyBhdHQgKyAnXSc7XHJcbiAgICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgICAgdGhpcy4kZWwuZmluZChhdHRyU2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyksXHJcbiAgICAgICAgICBwcm9wID0gJHQuZGF0YShhdHQpLFxyXG4gICAgICAgICAgYmluZGVkVmFsdWUgPSB0aGF0LmRhdGFbcHJvcF07XHJcblxyXG4gICAgICAgIGlmICgkdC5pcygnOmlucHV0JykpXHJcbiAgICAgICAgICAkdC52YWwoYmluZGVkVmFsdWUpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICR0LnRleHQoYmluZGVkVmFsdWUpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9LFxyXG4gIC8vIENvbnN0cnVjdG9yXHJcbiAgZnVuY3Rpb24gQmluZGFibGVDb21wb25lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgQ29tcG9uZW50LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5kYXRhID0gdGhpcy4kZWwuZGF0YSgnc291cmNlJykgfHwgdGhpcy5kYXRhIHx8IHt9O1xyXG4gICAgaWYgKHR5cGVvZiAodGhpcy5kYXRhKSA9PSAnc3RyaW5nJylcclxuICAgICAgdGhpcy5kYXRhID0gSlNPTi5wYXJzZSh0aGlzLmRhdGEpO1xyXG5cclxuICAgIC8vIE9uIGh0bWwgc291cmNlIHVybCBjb25maWd1cmF0aW9uOlxyXG4gICAgdGhpcy51cmwgPSB0aGlzLiRlbC5kYXRhKCdzb3VyY2UtdXJsJykgfHwgdGhpcy51cmw7XHJcblxyXG4gICAgLy8gVE9ETzogJ2NoYW5nZScgZXZlbnQgaGFuZGxlcnMgb24gZm9ybXMgd2l0aCBkYXRhLWJpbmQgdG8gdXBkYXRlIGl0cyB2YWx1ZSBhdCB0aGlzLmRhdGFcclxuICAgIC8vIFRPRE86IGF1dG8gJ2JpbmREYXRhJyBvbiBmZXRjaERhdGEgZW5kcz8gY29uZmlndXJhYmxlLCBiaW5kRGF0YU1vZGV7IGlubWVkaWF0ZSwgbm90aWZ5IH1cclxuICB9XHJcbik7XHJcblxyXG4vLyBQdWJsaWMgbW9kdWxlOlxyXG5tb2R1bGUuZXhwb3J0cyA9IEJpbmRhYmxlQ29tcG9uZW50OyIsIi8qKiBDb21wb25lbnQgY2xhc3M6IHdyYXBwZXIgZm9yXHJcbiAgdGhlIGxvZ2ljIGFuZCBiZWhhdmlvciBhcm91bmRcclxuICBhIERPTSBlbGVtZW50XHJcbioqL1xyXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKTtcclxuXHJcbmZ1bmN0aW9uIENvbXBvbmVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgdGhpcy5lbCA9IGVsZW1lbnQ7XHJcbiAgdGhpcy4kZWwgPSAkKGVsZW1lbnQpO1xyXG4gIGV4dGVuZCh0aGlzLCBvcHRpb25zKTtcclxuICAvLyBVc2UgdGhlIGpRdWVyeSAnZGF0YScgc3RvcmFnZSB0byBwcmVzZXJ2ZSBhIHJlZmVyZW5jZVxyXG4gIC8vIHRvIHRoaXMgaW5zdGFuY2UgKHVzZWZ1bCB0byByZXRyaWV2ZSBpdCBmcm9tIGRvY3VtZW50KVxyXG4gIHRoaXMuJGVsLmRhdGEoJ2NvbXBvbmVudCcsIHRoaXMpO1xyXG59XHJcblxyXG5leHRlbmQucGx1Z0luKENvbXBvbmVudCk7XHJcbmV4dGVuZC5wbHVnSW4oQ29tcG9uZW50LnByb3RvdHlwZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvbmVudDsiLCIvKipcclxuICBEYXRhU291cmNlIGNsYXNzIHRvIHNpbXBsaWZ5IGZldGNoaW5nIGRhdGEgYXMgSlNPTlxyXG4gIHRvIGZpbGwgYSBsb2NhbCBjYWNoZS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBmZXRjaEpTT04gPSAkLmdldEpTT04sXHJcbiAgICBleHRlbmQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAkLmV4dGVuZC5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTsgfTtcclxuXHJcbi8vIFRPRE86IHJlcGxhY2UgZWFjaCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgYnkgaW5zdGFuY2UgcHJvcGVydGllcywgc2luY2UgdGhhdCBwcm9wZXJ0aWVzIGJlY29tZVxyXG4vLyBzaGFyZWQgYmV0d2VlbiBpbnN0YW5jZXMgYW5kIGlzIG5vdCB3YW50ZWRcclxuXHJcbnZhciByZXFNb2RlcyA9IERhdGFTb3VyY2UucmVxdWVzdE1vZGVzID0ge1xyXG4gIC8vIFBhcmFsbGVsIHJlcXVlc3QsIG5vIG1hdHRlciBvZiBvdGhlcnNcclxuICBtdWx0aXBsZTogMCxcclxuICAvLyBXaWxsIGF2b2lkIGEgcmVxdWVzdCBpZiB0aGVyZSBpcyBvbmUgcnVubmluZ1xyXG4gIHNpbmdsZTogMSxcclxuICAvLyBMYXRlc3QgcmVxdWV0IHdpbGwgcmVwbGFjZSBhbnkgcHJldmlvdXMgb25lIChwcmV2aW91cyB3aWxsIGFib3J0KVxyXG4gIHJlcGxhY2U6IDJcclxufTtcclxuXHJcbnZhciB1cGRNb2RlcyA9IERhdGFTb3VyY2UudXBkYXRlTW9kZXMgPSB7XHJcbiAgLy8gRXZlcnkgbmV3IGRhdGEgdXBkYXRlLCBuZXcgY29udGVudCBpcyBhZGRlZCBpbmNyZW1lbnRhbGx5XHJcbiAgLy8gKG92ZXJ3cml0ZSBjb2luY2lkZW50IGNvbnRlbnQsIGFwcGVuZCBuZXcgY29udGVudCwgb2xkIGNvbnRlbnRcclxuICAvLyBnZXQgaW4gcGxhY2UpXHJcbiAgaW5jcmVtZW50YWw6IDAsXHJcbiAgLy8gT24gbmV3IGRhdGEgdXBkYXRlLCBuZXcgZGF0YSB0b3RhbGx5IHJlcGxhY2UgdGhlIHByZXZpb3VzIG9uZVxyXG4gIHJlcGxhY2VtZW50OiAxXHJcbn07XHJcblxyXG4vKipcclxuVXBkYXRlIHRoZSBkYXRhIHN0b3JlIG9yIGNhY2hlIHdpdGggdGhlIGdpdmVuIG9uZS5cclxuVGhlcmUgYXJlIGRpZmZlcmVudCBtb2RlcywgdGhpcyBtYW5hZ2VzIHRoYXQgbG9naWMgYW5kXHJcbml0cyBvd24gY29uZmlndXJhdGlvbi5cclxuSXMgZGVjb3VwbGVkIGZyb20gdGhlIHByb3RvdHlwZSBidXRcclxuaXQgd29ya3Mgb25seSBhcyBwYXJ0IG9mIGEgRGF0YVNvdXJjZSBpbnN0YW5jZS5cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZURhdGEoZGF0YSwgbW9kZSkge1xyXG4gIHN3aXRjaCAobW9kZSB8fCB0aGlzLnVwZGF0ZURhdGEuZGVmYXVsdFVwZGF0ZU1vZGUpIHtcclxuXHJcbiAgICBjYXNlIHVwZE1vZGVzLnJlcGxhY2VtZW50OlxyXG4gICAgICB0aGlzLmRhdGEgPSBkYXRhO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICAvL2Nhc2UgdXBkTW9kZXMuaW5jcmVtZW50YWw6ICBcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgIC8vIEluIGNhc2UgaW5pdGlhbCBkYXRhIGlzIG51bGwsIGFzc2lnbiB0aGUgcmVzdWx0IHRvIGl0c2VsZjpcclxuICAgICAgdGhpcy5kYXRhID0gZXh0ZW5kKHRoaXMuZGF0YSwgZGF0YSk7XHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxufVxyXG5cclxuLyoqIERlZmF1bHQgdmFsdWUgZm9yIHRoZSBjb25maWd1cmFibGUgdXBkYXRlIG1vZGU6XHJcbioqL1xyXG51cGRhdGVEYXRhLmRlZmF1bHRVcGRhdGVNb2RlID0gdXBkTW9kZXMuaW5jcmVtZW50YWw7XHJcblxyXG4vKipcclxuRmV0Y2ggdGhlIGRhdGEgZnJvbSB0aGUgc2VydmVyLlxyXG5IZXJlIGlzIGRlY291cGxlZCBmcm9tIHRoZSByZXN0IG9mIHRoZSBwcm90b3R5cGUgZm9yXHJcbmNvbW1vZGl0eSwgYnV0IGl0IGNhbiB3b3JrcyBvbmx5IGFzIHBhcnQgb2YgYSBEYXRhU291cmNlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gZmV0Y2hEYXRhKHF1ZXJ5LCBtb2RlKSB7XHJcbiAgcXVlcnkgPSBleHRlbmQoe30sIHRoaXMucXVlcnksIHF1ZXJ5KTtcclxuICBzd2l0Y2ggKG1vZGUgfHwgdGhpcy5mZXRjaERhdGEuZGVmYXVsdFJlcXVlc3RNb2RlKSB7XHJcblxyXG4gICAgY2FzZSByZXFNb2Rlcy5zaW5nbGU6XHJcbiAgICAgIGlmICh0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHJldHVybiBudWxsO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIHJlcU1vZGVzLnJlcGxhY2U6XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHNbaV0uYWJvcnQoKTtcclxuICAgICAgICB9IGNhdGNoIChleCkgeyB9XHJcbiAgICAgICAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMgPSBbXTtcclxuICAgICAgfVxyXG4gICAgICBicmVhaztcclxuXHJcbiAgICAvLyBKdXN0IGRvIG5vdGhpbmcgZm9yIG11bHRpcGxlIG9yIGRlZmF1bHQgICAgIFxyXG4gICAgLy9jYXNlIHJlcU1vZGVzLm11bHRpcGxlOiAgXHJcbiAgICAvL2RlZmF1bHQ6IFxyXG4gIH1cclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIHZhciByZXEgPSB0aGlzLmZldGNoRGF0YS5wcm94eShcclxuICAgIHRoaXMudXJsLFxyXG4gICAgcXVlcnksXHJcbiAgICBmdW5jdGlvbiAoZGF0YSwgdCwgeGhyKSB7XHJcbiAgICAgIHZhciByZXQgPSB0aGF0LnVwZGF0ZURhdGEoZGF0YSk7XHJcbiAgICAgIHRoYXQuZmV0Y2hEYXRhLnJlcXVlc3RzLnNwbGljZSh0aGF0LmZldGNoRGF0YS5yZXF1ZXN0cy5pbmRleE9mKHJlcSksIDEpO1xyXG4gICAgICAvL2RlbGV0ZSBmZXRjaERhdGEucmVxdWVzdHNbZmV0Y2hEYXRhLnJlcXVlc3RzLmluZGV4T2YocmVxKV07XHJcblxyXG4gICAgICBpZiAocmV0ICYmIHJldC5uYW1lKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIGRhdGEgZW1pdHMgZXJyb3IsIHRoZSBBamF4IHN0aWxsIHJlc29sdmVzIGFzICdzdWNjZXNzJyBiZWNhdXNlIG9mIHRoZSByZXF1ZXN0LCBidXRcclxuICAgICAgICAvLyB3ZSBuZWVkIHRvIGV4ZWN1dGUgdGhlIGVycm9yLCBidXQgd2UgcGlwZSBpdCB0byBlbnN1cmUgaXMgZG9uZSBhZnRlciBvdGhlciAnZG9uZScgY2FsbGJhY2tzXHJcbiAgICAgICAgcmVxLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB0aGF0LmZldGNoRGF0YS5vbmVycm9yLmNhbGwodGhhdCwgbnVsbCwgcmV0Lm5hbWUsIHJldCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9XHJcbiAgKVxyXG4gIC5mYWlsKCQucHJveHkodGhpcy5mZXRjaERhdGEub25lcnJvciwgdGhpcykpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLnB1c2gocmVxKTtcclxuXHJcbiAgcmV0dXJuIHJlcTtcclxufVxyXG5cclxuLy8gRGVmYXVsdHMgZmV0Y2hEYXRhIHByb3BlcnRpZXMsIHRoZXkgYXJlIGRlY291cGxlZCB0byBhbGxvd1xyXG4vLyByZXBsYWNlbWVudCwgYW5kIGluc2lkZSB0aGUgZmV0Y2hEYXRhIGZ1bmN0aW9uIHRvIGRvbid0XHJcbi8vIGNvbnRhbWluYXRlIHRoZSBvYmplY3QgbmFtZXNwYWNlLlxyXG5cclxuLyogQ29sbGVjdGlvbiBvZiBhY3RpdmUgKGZldGNoaW5nKSByZXF1ZXN0cyB0byB0aGUgc2VydmVyXHJcbiovXHJcbmZldGNoRGF0YS5yZXF1ZXN0cyA9IFtdO1xyXG5cclxuLyogRGVjb3VwbGVkIGZ1bmN0aW9uYWxpdHkgdG8gcGVyZm9ybSB0aGUgQWpheCBvcGVyYXRpb24sXHJcbnRoaXMgYWxsb3dzIG92ZXJ3cml0ZSB0aGlzIGJlaGF2aW9yIHRvIGltcGxlbWVudCBhbm90aGVyXHJcbndheXMsIGxpa2UgYSBub24talF1ZXJ5IGltcGxlbWVudGF0aW9uLCBhIHByb3h5IHRvIGZha2Ugc2VydmVyXHJcbmZvciB0ZXN0aW5nIG9yIHByb3h5IHRvIGxvY2FsIHN0b3JhZ2UgaWYgb25saW5lLCBldGMuXHJcbkl0IG11c3QgcmV0dXJucyB0aGUgdXNlZCByZXF1ZXN0IG9iamVjdC5cclxuKi9cclxuZmV0Y2hEYXRhLnByb3h5ID0gZmV0Y2hKU09OO1xyXG5cclxuLyogQnkgZGVmYXVsdCwgZmV0Y2hEYXRhIGFsbG93cyBtdWx0aXBsZSBzaW11bHRhbmVvcyBjb25uZWN0aW9uLFxyXG5zaW5jZSB0aGUgc3RvcmFnZSBieSBkZWZhdWx0IGFsbG93cyBpbmNyZW1lbnRhbCB1cGRhdGVzIHJhdGhlclxyXG50aGFuIHJlcGxhY2VtZW50cy5cclxuKi9cclxuZmV0Y2hEYXRhLmRlZmF1bHRSZXF1ZXN0TW9kZSA9IHJlcU1vZGVzLm11bHRpcGxlO1xyXG5cclxuLyogRGVmYXVsdCBub3RpZmljYXRpb24gb2YgZXJyb3Igb24gZmV0Y2hpbmcsIGp1c3QgbG9nZ2luZyxcclxuY2FuIGJlIHJlcGxhY2VkLlxyXG5JdCByZWNlaXZlcyB0aGUgcmVxdWVzdCBvYmplY3QsIHN0YXR1cyBhbmQgZXJyb3IuXHJcbiovXHJcbmZldGNoRGF0YS5vbmVycm9yID0gZnVuY3Rpb24gZXJyb3IoeCwgcywgZSkge1xyXG4gIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ0ZldGNoIGRhdGEgZXJyb3IgJW8nLCBlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gIERhdGFTb3VyY2UgY2xhc3NcclxuKiovXHJcbi8vIENvbnN0cnVjdG9yOiBldmVyeXRoaW5nIGlzIGluIHRoZSBwcm90b3R5cGUuXHJcbmZ1bmN0aW9uIERhdGFTb3VyY2UoKSB7IH1cclxuRGF0YVNvdXJjZS5wcm90b3R5cGUgPSB7XHJcbiAgZGF0YTogbnVsbCxcclxuICB1cmw6ICcvJyxcclxuICAvLyBxdWVyeTogb2JqZWN0IHdpdGggZGVmYXVsdCBleHRyYSBpbmZvcm1hdGlvbiB0byBhcHBlbmQgdG8gdGhlIHVybFxyXG4gIC8vIHdoZW4gZmV0Y2hpbmcgZGF0YSwgZXh0ZW5kZWQgd2l0aCB0aGUgZXhwbGljaXQgcXVlcnkgc3BlY2lmaWVkXHJcbiAgLy8gZXhlY3V0aW5nIGZldGNoRGF0YShxdWVyeSlcclxuICBxdWVyeToge30sXHJcbiAgdXBkYXRlRGF0YTogdXBkYXRlRGF0YSxcclxuICBmZXRjaERhdGE6IGZldGNoRGF0YVxyXG4gIC8vIFRPRE8gIHB1c2hEYXRhOiBmdW5jdGlvbigpeyBwb3N0L3B1dCB0aGlzLmRhdGEgdG8gdXJsICB9XHJcbn07XHJcblxyXG4vLyBDbGFzcyBhcyBwdWJsaWMgbW9kdWxlOlxyXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFTb3VyY2U7IiwiLyoqXHJcbiAgTG9jb25vbWljcyBzcGVjaWZpYyBXaWRnZXQgYmFzZWQgb24gQmluZGFibGVDb21wb25lbnQuXHJcbiAgSnVzdCBkZWNvdXBsaW5nIHNwZWNpZmljIGJlaGF2aW9ycyBmcm9tIHNvbWV0aGluZyBtb3JlIGdlbmVyYWxcclxuICB0byBlYXNpbHkgdHJhY2sgdGhhdCBkZXRhaWxzLCBhbmQgbWF5YmUgZnV0dXJlIG1pZ3JhdGlvbnMgdG9cclxuICBvdGhlciBmcm9udC1lbmQgZnJhbWV3b3Jrcy5cclxuKiovXHJcbnZhciBEYXRhU291cmNlID0gcmVxdWlyZSgnLi9EYXRhU291cmNlJyk7XHJcbnZhciBCaW5kYWJsZUNvbXBvbmVudCA9IHJlcXVpcmUoJy4vQmluZGFibGVDb21wb25lbnQnKTtcclxuXHJcbnZhciBMY1dpZGdldCA9IEJpbmRhYmxlQ29tcG9uZW50LmV4dGVuZChcclxuICAvLyBQcm90b3R5cGVcclxuICB7XHJcbiAgICAvLyBSZXBsYWNpbmcgdXBkYXRlRGF0YSB0byBpbXBsZW1lbnQgdGhlIHBhcnRpY3VsYXJcclxuICAgIC8vIEpTT04gc2NoZW1lIG9mIExvY29ub21pY3MsIGJ1dCByZXVzaW5nIG9yaWdpbmFsXHJcbiAgICAvLyBsb2dpYyBpbmhlcml0IGZyb20gRGF0YVNvdXJjZVxyXG4gICAgdXBkYXRlRGF0YTogZnVuY3Rpb24gKGRhdGEsIG1vZGUpIHtcclxuICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgRGF0YVNvdXJjZS5wcm90b3R5cGUudXBkYXRlRGF0YS5jYWxsKHRoaXMsIGRhdGEuUmVzdWx0LCBtb2RlKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBFcnJvciBtZXNzYWdlIGluIHRoZSBKU09OXHJcbiAgICAgICAgcmV0dXJuIHsgbmFtZTogJ2RhdGEtZm9ybWF0JywgbWVzc2FnZTogZGF0YS5FcnJvck1lc3NhZ2UgfTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gQ29uc3RydWN0b3JcclxuICBmdW5jdGlvbiBMY1dpZGdldChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICBCaW5kYWJsZUNvbXBvbmVudC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIH1cclxuKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGNXaWRnZXQ7IiwiLyoqXHJcbiAgRGVlcCBFeHRlbmQgb2JqZWN0IHV0aWxpdHksIGlzIHJlY3Vyc2l2ZSB0byBnZXQgYWxsIHRoZSBkZXB0aFxyXG4gIGJ1dCBvbmx5IGZvciB0aGUgcHJvcGVydGllcyBvd25lZCBieSB0aGUgb2JqZWN0LFxyXG4gIGlmIHlvdSBuZWVkIHRoZSBub24tb3duZWQgcHJvcGVydGllcyB0byBpbiB0aGUgb2JqZWN0LFxyXG4gIGNvbnNpZGVyIGV4dGVuZCBmcm9tIHRoZSBzb3VyY2UgcHJvdG90eXBlIHRvbyAoYW5kIG1heWJlIHRvXHJcbiAgdGhlIGRlc3RpbmF0aW9uIHByb3RvdHlwZSBpbnN0ZWFkIG9mIHRoZSBpbnN0YW5jZSwgYnV0IHVwIHRvIHRvbykuXHJcbioqL1xyXG5cclxuLyoganF1ZXJ5IGltcGxlbWVudGF0aW9uOlxyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5leHRlbmQgPSBmdW5jdGlvbiAoKSB7XHJcbnJldHVybiAkLmV4dGVuZC5hcHBseSh0aGlzLCBbdHJ1ZV0uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpKTsgXHJcbn07Ki9cclxuXHJcbnZhciBleHRlbmQgPSBmdW5jdGlvbiBleHRlbmQoZGVzdGluYXRpb24sIHNvdXJjZSkge1xyXG4gIGZvciAodmFyIHByb3BlcnR5IGluIHNvdXJjZSkge1xyXG4gICAgaWYgKCFzb3VyY2UuaGFzT3duUHJvcGVydHkocHJvcGVydHkpKVxyXG4gICAgICBjb250aW51ZTtcclxuXHJcbiAgICAvLyBBbGxvdyBwcm9wZXJ0aWVzIHJlbW92YWwsIGlmIHNvdXJjZSBjb250YWlucyB2YWx1ZSAndW5kZWZpbmVkJy5cclxuICAgIC8vIFRoZXJlIGFyZSBubyBzcGVjaWFsIGNvbnNpZGVyYXRpb25zIG9uIEFycmF5cywgdG8gZG9uJ3QgZ2V0IHVuZGVzaXJlZFxyXG4gICAgLy8gcmVzdWx0cyBqdXN0IHRoZSB3YW50ZWQgaXMgdG8gcmVwbGFjZSBzcGVjaWZpYyBwb3NpdGlvbnMsIG5vcm1hbGx5LlxyXG4gICAgaWYgKHNvdXJjZVtwcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkZWxldGUgZGVzdGluYXRpb25bcHJvcGVydHldO1xyXG4gICAgICBjb250aW51ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoWydvYmplY3QnLCAnZnVuY3Rpb24nXS5pbmRleE9mKHR5cGVvZiBkZXN0aW5hdGlvbltwcm9wZXJ0eV0pICE9IC0xICYmXHJcbiAgICAgICAgICAgIHR5cGVvZiBzb3VyY2VbcHJvcGVydHldID09ICdvYmplY3QnKVxyXG4gICAgICBleHRlbmQoZGVzdGluYXRpb25bcHJvcGVydHldLCBzb3VyY2VbcHJvcGVydHldKTtcclxuICAgIGVsc2UgaWYgKHR5cGVvZiBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPT0gJ2Z1bmN0aW9uJyAmJlxyXG4gICAgICAgICAgICAgICAgIHR5cGVvZiBzb3VyY2VbcHJvcGVydHldID09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdmFyIG9yaWcgPSBkZXN0aW5hdGlvbltwcm9wZXJ0eV07XHJcbiAgICAgIC8vIENsb25lIGZ1bmN0aW9uXHJcbiAgICAgIHZhciBzb3VyID0gY2xvbmVGdW5jdGlvbihzb3VyY2VbcHJvcGVydHldKTtcclxuICAgICAgZGVzdGluYXRpb25bcHJvcGVydHldID0gc291cjtcclxuICAgICAgLy8gQW55IHByZXZpb3VzIGF0dGFjaGVkIHByb3BlcnR5XHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIG9yaWcpO1xyXG4gICAgICAvLyBBbnkgc291cmNlIGF0dGFjaGVkIHByb3BlcnR5XHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgfVxyXG4gICAgZWxzZVxyXG4gICAgICBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPSBzb3VyY2VbcHJvcGVydHldO1xyXG4gIH1cclxuXHJcbiAgLy8gU28gbXVjaCAnc291cmNlJyBhcmd1bWVudHMgYXMgd2FudGVkLiBJbiBFUzYgd2lsbCBiZSAnc291cmNlLi4nXHJcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XHJcbiAgICB2YXIgbmV4dHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xyXG4gICAgbmV4dHMuc3BsaWNlKDEsIDEpO1xyXG4gICAgZXh0ZW5kLmFwcGx5KHRoaXMsIG5leHRzKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBkZXN0aW5hdGlvbjtcclxufTtcclxuXHJcbmV4dGVuZC5wbHVnSW4gPSBmdW5jdGlvbiBwbHVnSW4ob2JqKSB7XHJcbiAgb2JqID0gb2JqIHx8IE9iamVjdC5wcm90b3R5cGU7XHJcbiAgb2JqLmV4dGVuZE1lID0gZnVuY3Rpb24gZXh0ZW5kTWUoKSB7XHJcbiAgICBleHRlbmQuYXBwbHkodGhpcywgW3RoaXNdLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XHJcbiAgfTtcclxuICBvYmouZXh0ZW5kID0gZnVuY3Rpb24gZXh0ZW5kSW5zdGFuY2UoKSB7XHJcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXHJcbiAgICAgIC8vIElmIHRoZSBvYmplY3QgdXNlZCB0byBleHRlbmQgZnJvbSBpcyBhIGZ1bmN0aW9uLCBpcyBjb25zaWRlcmVkXHJcbiAgICAgIC8vIGEgY29uc3RydWN0b3IsIHRoZW4gd2UgZXh0ZW5kIGZyb20gaXRzIHByb3RvdHlwZSwgb3RoZXJ3aXNlIGl0c2VsZi5cclxuICAgICAgY29uc3RydWN0b3JBID0gdHlwZW9mIHRoaXMgPT0gJ2Z1bmN0aW9uJyA/IHRoaXMgOiBudWxsLFxyXG4gICAgICBiYXNlQSA9IGNvbnN0cnVjdG9yQSA/IHRoaXMucHJvdG90eXBlIDogdGhpcyxcclxuICAgICAgLy8gSWYgbGFzdCBhcmd1bWVudCBpcyBhIGZ1bmN0aW9uLCBpcyBjb25zaWRlcmVkIGEgY29uc3RydWN0b3JcclxuICAgICAgLy8gb2YgdGhlIG5ldyBjbGFzcy9vYmplY3QgdGhlbiB3ZSBleHRlbmQgaXRzIHByb3RvdHlwZS5cclxuICAgICAgLy8gV2UgdXNlIGFuIGVtcHR5IG9iamVjdCBvdGhlcndpc2UuXHJcbiAgICAgIGNvbnN0cnVjdG9yQiA9IHR5cGVvZiBhcmdzW2FyZ3MubGVuZ3RoIC0gMV0gPT0gJ2Z1bmN0aW9uJyA/XHJcbiAgICAgICAgYXJncy5zcGxpY2UoYXJncy5sZW5ndGggLSAxKVswXSA6XHJcbiAgICAgICAgbnVsbCxcclxuICAgICAgYmFzZUIgPSBjb25zdHJ1Y3RvckIgPyBjb25zdHJ1Y3RvckIucHJvdG90eXBlIDoge307XHJcblxyXG4gICAgdmFyIGV4dGVuZGVkUmVzdWx0ID0gZXh0ZW5kLmFwcGx5KHRoaXMsIFtiYXNlQiwgYmFzZUFdLmNvbmNhdChhcmdzKSk7XHJcbiAgICAvLyBJZiBib3RoIGFyZSBjb25zdHJ1Y3RvcnMsIHdlIHdhbnQgdGhlIHN0YXRpYyBtZXRob2RzIHRvIGJlIGNvcGllZCB0b286XHJcbiAgICBpZiAoY29uc3RydWN0b3JBICYmIGNvbnN0cnVjdG9yQilcclxuICAgICAgZXh0ZW5kKGNvbnN0cnVjdG9yQiwgY29uc3RydWN0b3JBKTtcclxuXHJcbiAgICAvLyBJZiB3ZSBhcmUgZXh0ZW5kaW5nIGEgY29uc3RydWN0b3IsIHdlIHJldHVybiB0aGF0LCBvdGhlcndpc2UgdGhlIHJlc3VsdFxyXG4gICAgcmV0dXJuIGNvbnN0cnVjdG9yQiB8fCBleHRlbmRlZFJlc3VsdDtcclxuICB9O1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBleHRlbmQ7XHJcbn0gZWxzZSB7XHJcbiAgLy8gZ2xvYmFsIHNjb3BlXHJcbiAgZXh0ZW5kLnBsdWdJbigpO1xyXG59XHJcblxyXG4vKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICBDbG9uZSBVdGlsc1xyXG4qL1xyXG5mdW5jdGlvbiBjbG9uZU9iamVjdChvYmopIHtcclxuICByZXR1cm4gZXh0ZW5kKHt9LCBvYmopO1xyXG59XHJcblxyXG4vLyBUZXN0aW5nIGlmIGEgc3RyaW5nIHNlZW1zIGEgZnVuY3Rpb24gc291cmNlIGNvZGU6XHJcbi8vIFdlIHRlc3QgYWdhaW5zIGEgc2ltcGxpc2ljIHJlZ3VsYXIgZXhwcmVzaW9uIHRoYXQgbWF0Y2hcclxuLy8gYSBjb21tb24gc3RhcnQgb2YgZnVuY3Rpb24gZGVjbGFyYXRpb24uXHJcbi8vIE90aGVyIHdheXMgdG8gZG8gdGhpcyBpcyBhdCBpbnZlcnNlciwgYnkgY2hlY2tpbmdcclxuLy8gdGhhdCB0aGUgZnVuY3Rpb24gdG9TdHJpbmcgaXMgbm90IGEga25vd2VkIHRleHRcclxuLy8gYXMgJ1tvYmplY3QgRnVuY3Rpb25dJyBvciAnW25hdGl2ZSBjb2RlXScsIGJ1dFxyXG4vLyBzaW5jZSB0aGEgY2FuIGNoYW5nZXMgYmV0d2VlbiBicm93c2VycywgaXMgbW9yZSBjb25zZXJ2YXRpdmVcclxuLy8gY2hlY2sgYWdhaW5zdCBhIGNvbW1vbiBjb25zdHJ1Y3QgYW4gZmFsbGJhY2sgb24gdGhlXHJcbi8vIGNvbW1vbiBzb2x1dGlvbiBpZiBub3QgbWF0Y2hlcy5cclxudmFyIHRlc3RGdW5jdGlvbiA9IC9eXFxzKmZ1bmN0aW9uW15cXChdXFwoLztcclxuXHJcbmZ1bmN0aW9uIGNsb25lRnVuY3Rpb24oZm4pIHtcclxuICB2YXIgdGVtcDtcclxuICB2YXIgY29udGVudHMgPSBmbi50b1N0cmluZygpO1xyXG4gIC8vIENvcHkgdG8gYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIHNhbWUgcHJvdG90eXBlLCBmb3IgdGhlIG5vdCAnb3duZWQnIHByb3BlcnRpZXMuXHJcbiAgLy8gQXNzaW5nZWQgYXQgdGhlIGVuZFxyXG4gIHZhciB0ZW1wUHJvdG8gPSBPYmplY3QuY3JlYXRlKGZuLnByb3RvdHlwZSk7XHJcblxyXG4gIC8vIERJU0FCTEVEIHRoZSBjb250ZW50cy1jb3B5IHBhcnQgYmVjYXVzZSBpdCBmYWlscyB3aXRoIGNsb3N1cmVzXHJcbiAgLy8gZ2VuZXJhdGVkIGJ5IHRoZSBvcmlnaW5hbCBmdW5jdGlvbiwgdXNpbmcgdGhlIHN1Yi1jYWxsIHdheSBldmVyXHJcbiAgaWYgKHRydWUgfHwgIXRlc3RGdW5jdGlvbi50ZXN0KGNvbnRlbnRzKSkge1xyXG4gICAgLy8gQ2hlY2sgaWYgaXMgYWxyZWFkeSBhIGNsb25lZCBjb3B5LCB0b1xyXG4gICAgLy8gcmV1c2UgdGhlIG9yaWdpbmFsIGNvZGUgYW5kIGF2b2lkIG1vcmUgdGhhblxyXG4gICAgLy8gb25lIGRlcHRoIGluIHN0YWNrIGNhbGxzIChncmVhdCEpXHJcbiAgICBpZiAodHlwZW9mIGZuLnByb3RvdHlwZS5fX19jbG9uZWRfb2YgPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgZm4gPSBmbi5wcm90b3R5cGUuX19fY2xvbmVkX29mO1xyXG5cclxuICAgIHRlbXAgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBmbi5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTsgfTtcclxuXHJcbiAgICAvLyBTYXZlIG1hcmsgYXMgY2xvbmVkLiBEb25lIGluIGl0cyBwcm90b3R5cGVcclxuICAgIC8vIHRvIG5vdCBhcHBlYXIgaW4gdGhlIGxpc3Qgb2YgJ293bmVkJyBwcm9wZXJ0aWVzLlxyXG4gICAgdGVtcFByb3RvLl9fX2Nsb25lZF9vZiA9IGZuO1xyXG4gICAgLy8gUmVwbGFjZSB0b1N0cmluZyB0byByZXR1cm4gdGhlIG9yaWdpbmFsIHNvdXJjZTpcclxuICAgIHRlbXBQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIGZuLnRvU3RyaW5nKCk7XHJcbiAgICB9O1xyXG4gICAgLy8gVGhlIG5hbWUgY2Fubm90IGJlIHNldCwgd2lsbCBqdXN0IGJlIGFub255bW91c1xyXG4gICAgLy90ZW1wLm5hbWUgPSB0aGF0Lm5hbWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFRoaXMgd2F5IG9uIGNhcGFibGUgYnJvd3NlcnMgcHJlc2VydmUgdGhlIG9yaWdpbmFsIG5hbWUsXHJcbiAgICAvLyBkbyBhIHJlYWwgaW5kZXBlbmRlbnQgY29weSBhbmQgYXZvaWQgZnVuY3Rpb24gc3ViY2FsbHMgdGhhdFxyXG4gICAgLy8gY2FuIGRlZ3JhdGUgcGVyZm9ybWFuY2UgYWZ0ZXIgbG90IG9mICdjbG9ubmluZycuXHJcbiAgICB2YXIgZiA9IEZ1bmN0aW9uO1xyXG4gICAgdGVtcCA9IChuZXcgZigncmV0dXJuICcgKyBjb250ZW50cykpKCk7XHJcbiAgfVxyXG5cclxuICB0ZW1wLnByb3RvdHlwZSA9IHRlbXBQcm90bztcclxuICAvLyBDb3B5IGFueSBwcm9wZXJ0aWVzIGl0IG93bnNcclxuICBleHRlbmQodGVtcCwgZm4pO1xyXG5cclxuICByZXR1cm4gdGVtcDtcclxufVxyXG5cclxuZnVuY3Rpb24gY2xvbmVQbHVnSW4oKSB7XHJcbiAgaWYgKHR5cGVvZiBGdW5jdGlvbi5wcm90b3R5cGUuY2xvbmUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgIEZ1bmN0aW9uLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKCkgeyByZXR1cm4gY2xvbmVGdW5jdGlvbih0aGlzKTsgfTtcclxuICB9XHJcbiAgaWYgKHR5cGVvZiBPYmplY3QucHJvdG90eXBlLmNsb25lICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBPamJlY3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUoKSB7IHJldHVybiBjbG9uZU9iamVjdCh0aGlzKTsgfTtcclxuICB9XHJcbn1cclxuXHJcbmV4dGVuZC5jbG9uZU9iamVjdCA9IGNsb25lT2JqZWN0O1xyXG5leHRlbmQuY2xvbmVGdW5jdGlvbiA9IGNsb25lRnVuY3Rpb247XHJcbmV4dGVuZC5jbG9uZVBsdWdJbiA9IGNsb25lUGx1Z0luO1xyXG4iLCIvKipcclxuKiBDb29raWVzIG1hbmFnZW1lbnQuXHJcbiogTW9zdCBjb2RlIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNDgyNTY5NS8xNjIyMzQ2XHJcbiovXHJcbnZhciBDb29raWUgPSB7fTtcclxuXHJcbkNvb2tpZS5zZXQgPSBmdW5jdGlvbiBzZXRDb29raWUobmFtZSwgdmFsdWUsIGRheXMpIHtcclxuICAgIHZhciBleHBpcmVzID0gXCJcIjtcclxuICAgIGlmIChkYXlzKSB7XHJcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGRhdGUuc2V0VGltZShkYXRlLmdldFRpbWUoKSArIChkYXlzICogMjQgKiA2MCAqIDYwICogMTAwMCkpO1xyXG4gICAgICAgIGV4cGlyZXMgPSBcIjsgZXhwaXJlcz1cIiArIGRhdGUudG9HTVRTdHJpbmcoKTtcclxuICAgIH1cclxuICAgIGRvY3VtZW50LmNvb2tpZSA9IG5hbWUgKyBcIj1cIiArIHZhbHVlICsgZXhwaXJlcyArIFwiOyBwYXRoPS9cIjtcclxufTtcclxuQ29va2llLmdldCA9IGZ1bmN0aW9uIGdldENvb2tpZShjX25hbWUpIHtcclxuICAgIGlmIChkb2N1bWVudC5jb29raWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGNfc3RhcnQgPSBkb2N1bWVudC5jb29raWUuaW5kZXhPZihjX25hbWUgKyBcIj1cIik7XHJcbiAgICAgICAgaWYgKGNfc3RhcnQgIT0gLTEpIHtcclxuICAgICAgICAgICAgY19zdGFydCA9IGNfc3RhcnQgKyBjX25hbWUubGVuZ3RoICsgMTtcclxuICAgICAgICAgICAgY19lbmQgPSBkb2N1bWVudC5jb29raWUuaW5kZXhPZihcIjtcIiwgY19zdGFydCk7XHJcbiAgICAgICAgICAgIGlmIChjX2VuZCA9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgY19lbmQgPSBkb2N1bWVudC5jb29raWUubGVuZ3RoO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB1bmVzY2FwZShkb2N1bWVudC5jb29raWUuc3Vic3RyaW5nKGNfc3RhcnQsIGNfZW5kKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFwiXCI7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IENvb2tpZTsiLCIvKiogQ29ubmVjdCBhY2NvdW50IHdpdGggRmFjZWJvb2tcclxuKiovXHJcbnZhclxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpLFxyXG4gIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyksXHJcbiAgTGNVcmwgPSByZXF1aXJlKCcuL0xjVXJsJyksXHJcbiAgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxuZnVuY3Rpb24gRmFjZWJvb2tDb25uZWN0KG9wdGlvbnMpIHtcclxuICAkLmV4dGVuZCh0aGlzLCBvcHRpb25zKTtcclxuICBpZiAoISQoJyNmYi1yb290JykubGVuZ3RoKVxyXG4gICAgJCgnPGRpdiBpZD1cImZiLXJvb3RcIiBzdHlsZT1cImRpc3BsYXk6IG5vbmVcIj48L2Rpdj4nKS5hcHBlbmRUbygnYm9keScpO1xyXG59XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlID0ge1xyXG4gIGFwcElkOiBudWxsLFxyXG4gIGxhbmc6ICdlbl9VUycsXHJcbiAgcmVzdWx0VHlwZTogJ2pzb24nLCAvLyAncmVkaXJlY3QnXHJcbiAgZmJVcmxCYXNlOiAnLy9jb25uZWN0LmZhY2Vib29rLm5ldC9AKGxhbmcpL2FsbC5qcycsXHJcbiAgc2VydmVyVXJsQmFzZTogTGNVcmwuTGFuZ1BhdGggKyAnQWNjb3VudC9GYWNlYm9vay9AKHVybFNlY3Rpb24pLz9SZWRpcmVjdD1AKHJlZGlyZWN0VXJsKSZwcm9maWxlPUAocHJvZmlsZVVybCknLFxyXG4gIHJlZGlyZWN0VXJsOiAnJyxcclxuICBwcm9maWxlVXJsOiAnJyxcclxuICB1cmxTZWN0aW9uOiAnJyxcclxuICBsb2FkaW5nVGV4dDogJ1ZlcmlmaW5nJyxcclxuICBwZXJtaXNzaW9uczogJycsXHJcbiAgbGliTG9hZGVkRXZlbnQ6ICdGYWNlYm9va0Nvbm5lY3RMaWJMb2FkZWQnLFxyXG4gIGNvbm5lY3RlZEV2ZW50OiAnRmFjZWJvb2tDb25uZWN0Q29ubmVjdGVkJ1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5nZXRGYlVybCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLmZiVXJsQmFzZS5yZXBsYWNlKC9AXFwobGFuZ1xcKS9nLCB0aGlzLmxhbmcpO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5nZXRTZXJ2ZXJVcmwgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5zZXJ2ZXJVcmxCYXNlXHJcbiAgLnJlcGxhY2UoL0BcXChyZWRpcmVjdFVybFxcKS9nLCB0aGlzLnJlZGlyZWN0VXJsKVxyXG4gIC5yZXBsYWNlKC9AXFwocHJvZmlsZVVybFxcKS9nLCB0aGlzLnByb2ZpbGVVcmwpXHJcbiAgLnJlcGxhY2UoL0BcXCh1cmxTZWN0aW9uXFwpL2csIHRoaXMudXJsU2VjdGlvbik7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmxvYWRMaWIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgLy8gT25seSBpZiBpcyBub3QgbG9hZGVkIHN0aWxsXHJcbiAgLy8gKEZhY2Vib29rIHNjcmlwdCBhdHRhY2ggaXRzZWxmIGFzIHRoZSBnbG9iYWwgdmFyaWFibGUgJ0ZCJylcclxuICBpZiAoIXdpbmRvdy5GQiAmJiAhdGhpcy5fbG9hZGluZ0xpYikge1xyXG4gICAgdGhpcy5fbG9hZGluZ0xpYiA9IHRydWU7XHJcbiAgICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgICBsb2FkZXIubG9hZCh7XHJcbiAgICAgIHNjcmlwdHM6IFt0aGlzLmdldEZiVXJsKCldLFxyXG4gICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIEZCLmluaXQoeyBhcHBJZDogdGhhdC5hcHBJZCwgc3RhdHVzOiB0cnVlLCBjb29raWU6IHRydWUsIHhmYm1sOiB0cnVlIH0pO1xyXG4gICAgICAgIHRoYXQubG9hZGluZ0xpYiA9IGZhbHNlO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIodGhhdC5saWJMb2FkZWRFdmVudCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICEhd2luZG93LkZCO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLnByb2Nlc3NSZXNwb25zZSA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gIGlmIChyZXNwb25zZS5hdXRoUmVzcG9uc2UpIHtcclxuICAgIC8vY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogV2VsY29tZSEnKTtcclxuICAgIHZhciB1cmwgPSB0aGlzLmdldFNlcnZlclVybCgpO1xyXG4gICAgaWYgKHRoaXMucmVzdWx0VHlwZSA9PSBcInJlZGlyZWN0XCIpIHtcclxuICAgICAgcmVkaXJlY3RUbyh1cmwpO1xyXG4gICAgfSBlbHNlIGlmICh0aGlzLnJlc3VsdFR5cGUgPT0gXCJqc29uXCIpIHtcclxuICAgICAgcG9wdXAodXJsLCAnc21hbGwnLCBudWxsLCB0aGlzLmxvYWRpbmdUZXh0KTtcclxuICAgICAgJChkb2N1bWVudCkudHJpZ2dlcih0aGlzLmNvbm5lY3RlZEV2ZW50KTtcclxuICAgIH1cclxuXHJcbiAgICAvKkZCLmFwaSgnL21lJywgZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICBjb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBHb29kIHRvIHNlZSB5b3UsICcgKyByZXNwb25zZS5uYW1lICsgJy4nKTtcclxuICAgIH0pOyovXHJcbiAgfSBlbHNlIHtcclxuICAgIC8vY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogVXNlciBjYW5jZWxsZWQgbG9naW4gb3IgZGlkIG5vdCBmdWxseSBhdXRob3JpemUuJyk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5vbkxpYlJlYWR5ID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgaWYgKHdpbmRvdy5GQilcclxuICAgIGNhbGxiYWNrKCk7XHJcbiAgZWxzZSB7XHJcbiAgICB0aGlzLmxvYWRMaWIoKTtcclxuICAgICQoZG9jdW1lbnQpLm9uKHRoaXMubGliTG9hZGVkRXZlbnQsIGNhbGxiYWNrKTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIHRoaXMub25MaWJSZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICBGQi5sb2dpbigkLnByb3h5KHRoYXQucHJvY2Vzc1Jlc3BvbnNlLCB0aGF0KSwgeyBzY29wZTogdGhhdC5wZXJtaXNzaW9ucyB9KTtcclxuICB9KTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuYXV0b0Nvbm5lY3RPbiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gIGpRdWVyeShkb2N1bWVudCkub24oJ2NsaWNrJywgc2VsZWN0b3IgfHwgJ2EuZmFjZWJvb2stY29ubmVjdCcsICQucHJveHkodGhpcy5jb25uZWN0LCB0aGlzKSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEZhY2Vib29rQ29ubmVjdDsiLCIvKiogSW1wbGVtZW50cyBhIHNpbWlsYXIgTGNVcmwgb2JqZWN0IGxpa2UgdGhlIHNlcnZlci1zaWRlIG9uZSwgYmFzaW5nXHJcbiAgICBpbiB0aGUgaW5mb3JtYXRpb24gYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGF0ICdodG1sJyB0YWcgaW4gdGhlIFxyXG4gICAgJ2RhdGEtYmFzZS11cmwnIGF0dHJpYnV0ZSAodGhhdHMgdmFsdWUgaXMgdGhlIGVxdWl2YWxlbnQgZm9yIEFwcFBhdGgpLFxyXG4gICAgYW5kIHRoZSBsYW5nIGluZm9ybWF0aW9uIGF0ICdkYXRhLWN1bHR1cmUnLlxyXG4gICAgVGhlIHJlc3Qgb2YgVVJMcyBhcmUgYnVpbHQgZm9sbG93aW5nIHRoZSB3aW5kb3cubG9jYXRpb24gYW5kIHNhbWUgcnVsZXNcclxuICAgIHRoYW4gaW4gdGhlIHNlcnZlci1zaWRlIG9iamVjdC5cclxuKiovXHJcblxyXG52YXIgYmFzZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYmFzZS11cmwnKSxcclxuICAgIGxhbmcgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKSxcclxuICAgIGwgPSB3aW5kb3cubG9jYXRpb24sXHJcbiAgICB1cmwgPSBsLnByb3RvY29sICsgJy8vJyArIGwuaG9zdDtcclxuLy8gbG9jYXRpb24uaG9zdCBpbmNsdWRlcyBwb3J0LCBpZiBpcyBub3QgdGhlIGRlZmF1bHQsIHZzIGxvY2F0aW9uLmhvc3RuYW1lXHJcblxyXG5iYXNlID0gYmFzZSB8fCAnLyc7XHJcblxyXG52YXIgTGNVcmwgPSB7XHJcbiAgICBTaXRlVXJsOiB1cmwsXHJcbiAgICBBcHBQYXRoOiBiYXNlLFxyXG4gICAgQXBwVXJsOiB1cmwgKyBiYXNlLFxyXG4gICAgTGFuZ0lkOiBsYW5nLFxyXG4gICAgTGFuZ1BhdGg6IGJhc2UgKyBsYW5nICsgJy8nLFxyXG4gICAgTGFuZ1VybDogdXJsICsgYmFzZSArIGxhbmdcclxufTtcclxuTGNVcmwuTGFuZ1VybCA9IHVybCArIExjVXJsLkxhbmdQYXRoO1xyXG5MY1VybC5Kc29uUGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ0pTT04vJztcclxuTGNVcmwuSnNvblVybCA9IHVybCArIExjVXJsLkpzb25QYXRoO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1VybDsiLCIvKiBMb2Nvbm9taWNzIHNwZWNpZmljIFByaWNlLCBmZWVzIGFuZCBob3VyLXByaWNlIGNhbGN1bGF0aW9uXHJcbiAgICB1c2luZyBzb21lIHN0YXRpYyBtZXRob2RzIGFuZCB0aGUgUHJpY2UgY2xhc3MuXHJcbiovXHJcbnZhciBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG4vKiBDbGFzcyBQcmljZSB0byBjYWxjdWxhdGUgYSB0b3RhbCBwcmljZSBiYXNlZCBvbiBmZWVzIGluZm9ybWF0aW9uIChmaXhlZCBhbmQgcmF0ZSlcclxuICAgIGFuZCBkZXNpcmVkIGRlY2ltYWxzIGZvciBhcHByb3hpbWF0aW9ucy5cclxuKi9cclxuZnVuY3Rpb24gUHJpY2UoYmFzZVByaWNlLCBmZWUsIHJvdW5kZWREZWNpbWFscykge1xyXG4gICAgLy8gZmVlIHBhcmFtZXRlciBjYW4gYmUgYSBmbG9hdCBudW1iZXIgd2l0aCB0aGUgZmVlUmF0ZSBvciBhbiBvYmplY3RcclxuICAgIC8vIHRoYXQgaW5jbHVkZXMgYm90aCBhIGZlZVJhdGUgYW5kIGEgZml4ZWRGZWVBbW91bnRcclxuICAgIC8vIEV4dHJhY3RpbmcgZmVlIHZhbHVlcyBpbnRvIGxvY2FsIHZhcnM6XHJcbiAgICB2YXIgZmVlUmF0ZSA9IDAsIGZpeGVkRmVlQW1vdW50ID0gMDtcclxuICAgIGlmIChmZWUuZml4ZWRGZWVBbW91bnQgfHwgZmVlLmZlZVJhdGUpIHtcclxuICAgICAgICBmaXhlZEZlZUFtb3VudCA9IGZlZS5maXhlZEZlZUFtb3VudCB8fCAwO1xyXG4gICAgICAgIGZlZVJhdGUgPSBmZWUuZmVlUmF0ZSB8fCAwO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgZmVlUmF0ZSA9IGZlZTtcclxuXHJcbiAgICAvLyBDYWxjdWxhdGluZzpcclxuICAgIC8vIFRoZSByb3VuZFRvIHdpdGggYSBiaWcgZml4ZWQgZGVjaW1hbHMgaXMgdG8gYXZvaWQgdGhlXHJcbiAgICAvLyBkZWNpbWFsIGVycm9yIG9mIGZsb2F0aW5nIHBvaW50IG51bWJlcnNcclxuICAgIHZhciB0b3RhbFByaWNlID0gbXUuY2VpbFRvKG11LnJvdW5kVG8oYmFzZVByaWNlICogKDEgKyBmZWVSYXRlKSArIGZpeGVkRmVlQW1vdW50LCAxMiksIHJvdW5kZWREZWNpbWFscyk7XHJcbiAgICAvLyBmaW5hbCBmZWUgcHJpY2UgaXMgY2FsY3VsYXRlZCBhcyBhIHN1YnN0cmFjdGlvbiwgYnV0IGJlY2F1c2UgamF2YXNjcmlwdCBoYW5kbGVzXHJcbiAgICAvLyBmbG9hdCBudW1iZXJzIG9ubHksIGEgcm91bmQgb3BlcmF0aW9uIGlzIHJlcXVpcmVkIHRvIGF2b2lkIGFuIGlycmF0aW9uYWwgbnVtYmVyXHJcbiAgICB2YXIgZmVlUHJpY2UgPSBtdS5yb3VuZFRvKHRvdGFsUHJpY2UgLSBiYXNlUHJpY2UsIDIpO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIG9iamVjdCB3aXRoIGZ1bGwgZGV0YWlsczpcclxuICAgIHRoaXMuYmFzZVByaWNlID0gYmFzZVByaWNlO1xyXG4gICAgdGhpcy5mZWVSYXRlID0gZmVlUmF0ZTtcclxuICAgIHRoaXMuZml4ZWRGZWVBbW91bnQgPSBmaXhlZEZlZUFtb3VudDtcclxuICAgIHRoaXMucm91bmRlZERlY2ltYWxzID0gcm91bmRlZERlY2ltYWxzO1xyXG4gICAgdGhpcy50b3RhbFByaWNlID0gdG90YWxQcmljZTtcclxuICAgIHRoaXMuZmVlUHJpY2UgPSBmZWVQcmljZTtcclxufVxyXG5cclxuLyoqIENhbGN1bGF0ZSBhbmQgcmV0dXJucyB0aGUgcHJpY2UgYW5kIHJlbGV2YW50IGRhdGEgYXMgYW4gb2JqZWN0IGZvclxyXG50aW1lLCBob3VybHlSYXRlICh3aXRoIGZlZXMpIGFuZCB0aGUgaG91cmx5RmVlLlxyXG5UaGUgdGltZSAoQGR1cmF0aW9uKSBpcyB1c2VkICdhcyBpcycsIHdpdGhvdXQgdHJhbnNmb3JtYXRpb24sIG1heWJlIHlvdSBjYW4gcmVxdWlyZVxyXG51c2UgTEMucm91bmRUaW1lVG9RdWFydGVySG91ciBiZWZvcmUgcGFzcyB0aGUgZHVyYXRpb24gdG8gdGhpcyBmdW5jdGlvbi5cclxuSXQgcmVjZWl2ZXMgdGhlIHBhcmFtZXRlcnMgQGhvdXJseVByaWNlIGFuZCBAc3VyY2hhcmdlUHJpY2UgYXMgTEMuUHJpY2Ugb2JqZWN0cy5cclxuQHN1cmNoYXJnZVByaWNlIGlzIG9wdGlvbmFsLlxyXG4qKi9cclxuZnVuY3Rpb24gY2FsY3VsYXRlSG91cmx5UHJpY2UoZHVyYXRpb24sIGhvdXJseVByaWNlLCBzdXJjaGFyZ2VQcmljZSkge1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gc3VyY2hhcmdlLCBnZXQgemVyb3NcclxuICAgIHN1cmNoYXJnZVByaWNlID0gc3VyY2hhcmdlUHJpY2UgfHwgeyB0b3RhbFByaWNlOiAwLCBmZWVQcmljZTogMCwgYmFzZVByaWNlOiAwIH07XHJcbiAgICAvLyBHZXQgaG91cnMgZnJvbSByb3VuZGVkIGR1cmF0aW9uOlxyXG4gICAgdmFyIGhvdXJzID0gbXUucm91bmRUbyhkdXJhdGlvbi50b3RhbEhvdXJzKCksIDIpO1xyXG4gICAgLy8gQ2FsY3VsYXRlIGZpbmFsIHByaWNlc1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0b3RhbFByaWNlOiAgICAgbXUucm91bmRUbyhob3VybHlQcmljZS50b3RhbFByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS50b3RhbFByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIGZlZVByaWNlOiAgICAgICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLmZlZVByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS5mZWVQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBzdWJ0b3RhbFByaWNlOiAgbXUucm91bmRUbyhob3VybHlQcmljZS5iYXNlUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLmJhc2VQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBkdXJhdGlvbkhvdXJzOiAgaG91cnNcclxuICAgIH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIFByaWNlOiBQcmljZSxcclxuICAgICAgICBjYWxjdWxhdGVIb3VybHlQcmljZTogY2FsY3VsYXRlSG91cmx5UHJpY2VcclxuICAgIH07IiwiLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNTkzNjM3L2hvdy10by1lc2NhcGUtcmVndWxhci1leHByZXNzaW9uLWluLWphdmFzY3JpcHRcclxuUmVnRXhwLnF1b3RlID0gZnVuY3Rpb24gKHN0cikge1xyXG4gIHJldHVybiAoc3RyICsgJycpLnJlcGxhY2UoLyhbLj8qK14kW1xcXVxcXFwoKXt9fC1dKS9nLCBcIlxcXFwkMVwiKTtcclxufTtcclxuIiwiLyoqXHJcbiAgQSB2ZXJ5IHNpbXBsZSBzbGlkZXIgaW1wbGVtZW50YXRpb24gaW5pdGlhbGx5IGNyZWF0ZWRcclxuICBmb3IgdGhlIHByb3ZpZGVyLXdlbGNvbWUgbGFuZGluZyBwYWdlIGFuZFxyXG4gIG90aGVyIHNpbWlsYXIgdXNlcy5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vUmVnRXhwLnF1b3RlJyk7XHJcblxyXG52YXIgU2ltcGxlU2xpZGVyID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBTaW1wbGVTbGlkZXIob3B0cykge1xyXG4gICQuZXh0ZW5kKHRydWUsIHRoaXMsIG9wdHMpO1xyXG5cclxuICB0aGlzLmVsZW1lbnQgPSAkKHRoaXMuZWxlbWVudCk7XHJcbiAgdGhpcy5jdXJyZW50SW5kZXggPSAwO1xyXG5cclxuICAvKipcclxuICBBY3Rpb25zIGhhbmRsZXIgdG8gbW92ZSBzbGlkZXNcclxuICAqKi9cclxuICB2YXIgY2hlY2tIcmVmID0gbmV3IFJlZ0V4cCgnXiMnICsgUmVnRXhwLnF1b3RlKHRoaXMuaHJlZlByZWZpeCkgKyAnKC4qKScpLFxyXG4gICAgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5lbGVtZW50Lm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGhyZWYgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG4gICAgdmFyIHJlcyA9IGNoZWNrSHJlZi5leGVjKGhyZWYpO1xyXG5cclxuICAgIGlmIChyZXMgJiYgcmVzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgdmFyIGluZGV4ID0gcmVzWzFdO1xyXG4gICAgICBpZiAoaW5kZXggPT0gJ3ByZXZpb3VzJykge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZSh0aGF0LmN1cnJlbnRJbmRleCAtIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGluZGV4ID09ICduZXh0Jykge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZSh0aGF0LmN1cnJlbnRJbmRleCArIDEpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKC9cXGQrLy50ZXN0KGluZGV4KSkge1xyXG4gICAgICAgIHRoYXQuZ29TbGlkZShwYXJzZUludChpbmRleCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogRG8gYWxsIHRoZSBzZXR1cCBvbiBzbGlkZXIgYW5kIHNsaWRlc1xyXG4gIHRvIGVuc3VyZSB0aGUgbW92ZW1lbnQgd2lsbCB3b3JrIGZpbmUuXHJcbiAgSXRzIGRvbmUgYXV0b21hdGljIG9uXHJcbiAgaW5pdGlhbGl6aW5nLCBpcyBqdXN0IGEgcHVibGljIG1ldGhvZCBmb3IgXHJcbiAgY29udmVuaWVuY2UgKG1heWJlIHRvIGJlIGNhbGwgaWYgc2xpZGVzIGFyZVxyXG4gIGFkZGVkL3JlbW92ZWQgYWZ0ZXIgaW5pdCkuXHJcbiAgKiovXHJcbiAgdGhpcy5yZWRyYXcgPSBmdW5jdGlvbiBzbGlkZXNSZXBvc2l0aW9uKCkge1xyXG4gICAgdmFyIHNsaWRlcyA9IHRoaXMuZ2V0U2xpZGVzKCksXHJcbiAgICAgIGMgPSB0aGlzLmdldFNsaWRlc0NvbnRhaW5lcigpO1xyXG4gICAgLy8gTG9vayBmb3IgdGhlIGNvbnRhaW5lciBzaXplLCBmcm9tIHRoZSBcclxuICAgIC8vIGJpZ2dlciBzbGlkZTpcclxuICAgIHZhciBcclxuICAgICAgdyA9IDAsXHJcbiAgICAgIGggPSAwO1xyXG4gICAgc2xpZGVzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgXHJcbiAgICAgICAgdCA9ICQodGhpcyksXHJcbiAgICAgICAgdHcgPSB0Lm91dGVyV2lkdGgoKSxcclxuICAgICAgICB0aCA9IHQub3V0ZXJIZWlnaHQoKTtcclxuICAgICAgaWYgKHR3ID4gdylcclxuICAgICAgICB3ID0gdHc7XHJcbiAgICAgIGlmICh0aCA+IGgpXHJcbiAgICAgICAgaCA9IHRoO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQ1NTIHNldHVwLCBcclxuICAgIC8vIGFsbCBzbGlkZXMgaW4gdGhlIHNhbWUgbGluZSxcclxuICAgIC8vIGFsbCB3aXRoIHNhbWUgc2l6ZSAoZXh0cmEgc3BhY2luZyBjYW5cclxuICAgIC8vIGJlIGdpdmVuIHdpdGggQ1NTKVxyXG4gICAgYy5jc3Moe1xyXG4gICAgICB3aWR0aDogdyAtIChjLm91dGVyV2lkdGgoKSAtIGMud2lkdGgoKSksXHJcbiAgICAgIC8vaGVpZ2h0OiBoIC0gKGMub3V0ZXJIZWlnaHQoKSAtIGMuaGVpZ2h0KCkpLFxyXG4gICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxyXG4gICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJ1xyXG4gICAgfSk7XHJcblxyXG4gICAgc2xpZGVzLmNzcyh7XHJcbiAgICAgIHdoaXRlU3BhY2U6ICdub3JtYWwnLFxyXG4gICAgICBkaXNwbGF5OiAnaW5saW5lLWJsb2NrJ1xyXG4gICAgfSkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgdC5jc3Moe1xyXG4gICAgICAgIHdpZHRoOiB3IC0gKHQub3V0ZXJXaWR0aCgpIC0gdC53aWR0aCgpKVxyXG4gICAgICAgIC8vLGhlaWdodDogaCAtICh0Lm91dGVySGVpZ2h0KCkgLSB0LmhlaWdodCgpKVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlcG9zaXRpb25hdGUgYXQgdGhlIGJlZ2dpbmluZzpcclxuICAgIGNbMF0uc2Nyb2xsTGVmdCA9IDA7XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR28gdG8gYSBzbGlkZSBieSBpbmRleFxyXG4gICoqL1xyXG4gIHRoaXMuZ29TbGlkZSA9IGZ1bmN0aW9uIGdvU2xpZGUoaW5kZXgpIHtcclxuICAgIHZhciBwcmV2ID0gdGhpcy5jdXJyZW50SW5kZXg7XHJcbiAgICBpZiAocHJldiA9PSBpbmRleClcclxuICAgICAgcmV0dXJuO1xyXG5cclxuICAgIC8vIENoZWNrIGJvdW5kc1xyXG4gICAgaWYgKGluZGV4IDwgMSlcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgdmFyIHNsaWRlcyA9IHRoaXMuZ2V0U2xpZGVzKCk7XHJcbiAgICBpZiAoaW5kZXggPiBzbGlkZXMubGVuZ3RoKVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgLy8gR29vZCBpbmRleCwgc2V0IGFzIGN1cnJlbnRcclxuICAgIHRoaXMuY3VycmVudEluZGV4ID0gaW5kZXg7XHJcbiAgICAvLyBTZXQgbGlua3MgdG8gdGhpcyBhcyBjdXJyZW50LCByZW1vdmluZyBhbnkgcHJldmlvdXM6XHJcbiAgICB0aGlzLmVsZW1lbnQuZmluZCgnW2hyZWY9IycgKyB0aGlzLmhyZWZQcmVmaXggKyBpbmRleCArICddJylcclxuICAgIC5hZGRDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKVxyXG4gICAgLnBhcmVudCgnbGknKS5hZGRDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKTtcclxuICAgIHRoaXMuZWxlbWVudC5maW5kKCdbaHJlZj0jJyArIHRoaXMuaHJlZlByZWZpeCArIHByZXYgKyAnXScpXHJcbiAgICAucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcylcclxuICAgIC5wYXJlbnQoJ2xpJykucmVtb3ZlQ2xhc3ModGhpcy5jdXJyZW50U2xpZGVDbGFzcyk7XHJcblxyXG4gICAgdmFyIFxyXG4gICAgICBzbGlkZSA9ICQoc2xpZGVzLmdldChpbmRleCAtIDEpKSxcclxuICAgICAgYyA9IHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyKCksXHJcbiAgICAgIGxlZnQgPSBjLnNjcm9sbExlZnQoKSArIHNsaWRlLnBvc2l0aW9uKCkubGVmdDtcclxuXHJcbiAgICBjLnN0b3AoKS5hbmltYXRlKHsgc2Nyb2xsTGVmdDogbGVmdCB9LCB0aGlzLmR1cmF0aW9uKTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHZXQgdGhlIGpRdWVyeSBjb2xsZWN0aW9uIG9mIHNsaWRlc1xyXG4gICoqL1xyXG4gIHRoaXMuZ2V0U2xpZGVzID0gZnVuY3Rpb24gZ2V0U2xpZGVzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGVzKVxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGUpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gIE1ldGhvZDogR2V0IHRoZSBqUXVlcnkgZWxlbWVudCBmb3IgdGhlIGNvbnRhaW5lciBvZiBzbGlkZXNcclxuICAqKi9cclxuICB0aGlzLmdldFNsaWRlc0NvbnRhaW5lciA9IGZ1bmN0aW9uIGdldFNsaWRlc0NvbnRhaW5lcigpIHtcclxuICAgIHJldHVybiB0aGlzLmVsZW1lbnRcclxuICAgIC5maW5kKHRoaXMuc2VsZWN0b3JzLnNsaWRlcyk7XHJcbiAgfTtcclxuXHJcbiAgLyoqIExhc3QgaW5pdCBzdGVwc1xyXG4gICoqL1xyXG4gIHRoaXMucmVkcmF3KCk7XHJcbn07XHJcblxyXG5TaW1wbGVTbGlkZXIucHJvdG90eXBlID0ge1xyXG4gIGVsZW1lbnQ6IG51bGwsXHJcbiAgc2VsZWN0b3JzOiB7XHJcbiAgICBzbGlkZXM6ICcuc2xpZGVzJyxcclxuICAgIHNsaWRlOiAnbGkuc2xpZGUnXHJcbiAgfSxcclxuICBjdXJyZW50U2xpZGVDbGFzczogJ2pzLWlzQ3VycmVudCcsXHJcbiAgaHJlZlByZWZpeDogJ2dvU2xpZGVfJyxcclxuICAvLyBEdXJhdGlvbiBvZiBlYWNoIHNsaWRlIGluIG1pbGxpc2Vjb25kc1xyXG4gIGR1cmF0aW9uOiAxMDAwXHJcbn07IiwiLyoqIFBvbHlmaWxsIGZvciBzdHJpbmcuY29udGFpbnNcclxuKiovXHJcbmlmICghKCdjb250YWlucycgaW4gU3RyaW5nLnByb3RvdHlwZSkpXHJcbiAgICBTdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zID0gZnVuY3Rpb24gKHN0ciwgc3RhcnRJbmRleCkgeyByZXR1cm4gLTEgIT09IHRoaXMuaW5kZXhPZihzdHIsIHN0YXJ0SW5kZXgpOyB9OyIsIi8qKiA9PT09PT09PT09PT09PT09PT09PT09XHJcbiAqIEEgc2ltcGxlIFN0cmluZyBGb3JtYXRcclxuICogZnVuY3Rpb24gZm9yIGphdmFzY3JpcHRcclxuICogQXV0aG9yOiBJYWdvIExvcmVuem8gU2FsZ3VlaXJvXHJcbiAqIE1vZHVsZTogQ29tbW9uSlNcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc3RyaW5nRm9ybWF0KCkge1xyXG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG5cdHZhciBmb3JtYXR0ZWQgPSBhcmdzWzBdO1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7JytpKydcXFxcfScsICdnaScpO1xyXG5cdFx0Zm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UocmVnZXhwLCBhcmdzW2krMV0pO1xyXG5cdH1cclxuXHRyZXR1cm4gZm9ybWF0dGVkO1xyXG59OyIsIi8qKlxyXG4gICAgR2VuZXJhbCBhdXRvLWxvYWQgc3VwcG9ydCBmb3IgdGFiczogXHJcbiAgICBJZiB0aGVyZSBpcyBubyBjb250ZW50IHdoZW4gZm9jdXNlZCwgdGhleSB1c2UgdGhlICdyZWxvYWQnIGpxdWVyeSBwbHVnaW5cclxuICAgIHRvIGxvYWQgaXRzIGNvbnRlbnQgLXRhYnMgbmVlZCB0byBiZSBjb25maWd1cmVkIHdpdGggZGF0YS1zb3VyY2UtdXJsIGF0dHJpYnV0ZVxyXG4gICAgaW4gb3JkZXIgdG8ga25vdyB3aGVyZSB0byBmZXRjaCB0aGUgY29udGVudC0uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5yZWxvYWQnKTtcclxuXHJcbi8vIERlcGVuZGVuY3kgVGFiYmVkVVggZnJvbSBESVxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoVGFiYmVkVVgpIHtcclxuICAgIC8vIFRhYmJlZFVYLnNldHVwLnRhYkJvZHlTZWxlY3RvciB8fCAnLnRhYi1ib2R5J1xyXG4gICAgJCgnLnRhYi1ib2R5Jykub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoJHQuY2hpbGRyZW4oKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICR0LnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBUaGlzIGFkZHMgbm90aWZpY2F0aW9ucyB0byB0YWJzIGZyb20gdGhlIFRhYmJlZFVYIHN5c3RlbSB1c2luZ1xyXG4gICAgdGhlIGNoYW5nZXNOb3RpZmljYXRpb24gdXRpbGl0eSB0aGF0IGRldGVjdHMgbm90IHNhdmVkIGNoYW5nZXMgb24gZm9ybXMsXHJcbiAgICBzaG93aW5nIHdhcm5pbmcgbWVzc2FnZXMgdG8gdGhlXHJcbiAgICB1c2VyIGFuZCBtYXJraW5nIHRhYnMgKGFuZCBzdWItdGFicyAvIHBhcmVudC10YWJzIHByb3Blcmx5KSB0b1xyXG4gICAgZG9uJ3QgbG9zdCBjaGFuZ2VzIG1hZGUuXHJcbiAgICBBIGJpdCBvZiBDU1MgZm9yIHRoZSBhc3NpZ25lZCBjbGFzc2VzIHdpbGwgYWxsb3cgZm9yIHZpc3VhbCBtYXJrcy5cclxuXHJcbiAgICBBS0E6IERvbid0IGxvc3QgZGF0YSEgd2FybmluZyBtZXNzYWdlIDstKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxuLy8gVGFiYmVkVVggZGVwZW5kZW5jeSBhcyBESVxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoVGFiYmVkVVgsIHRhcmdldFNlbGVjdG9yKSB7XHJcbiAgICB2YXIgdGFyZ2V0ID0gJCh0YXJnZXRTZWxlY3RvciB8fCAnLmNoYW5nZXMtbm90aWZpY2F0aW9uLWVuYWJsZWQnKTtcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24uaW5pdCh7IHRhcmdldDogdGFyZ2V0IH0pO1xyXG5cclxuICAgIC8vIEFkZGluZyBjaGFuZ2Ugbm90aWZpY2F0aW9uIHRvIHRhYi1ib2R5IGRpdnNcclxuICAgIC8vIChvdXRzaWRlIHRoZSBMQy5DaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzIHRvIGxlYXZlIGl0IGFzIGdlbmVyaWMgYW5kIHNpbXBsZSBhcyBwb3NzaWJsZSlcclxuICAgICQodGFyZ2V0KS5vbignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsICdmb3JtJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQodGhpcykucGFyZW50cygnLnRhYi1ib2R5JykuYWRkQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQWRkaW5nIGNsYXNzIHRvIHRoZSBtZW51IGl0ZW0gKHRhYiB0aXRsZSlcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0uYWRkQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgICAgIC5hdHRyKCd0aXRsZScsICQoJyNsY3Jlcy1jaGFuZ2VzLW5vdC1zYXZlZCcpLnRleHQoKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC5vbignbGNDaGFuZ2VzTm90aWZpY2F0aW9uU2F2ZVJlZ2lzdGVyZWQnLCAnZm9ybScsIGZ1bmN0aW9uIChlLCBmLCBlbHMsIGZ1bGwpIHtcclxuICAgICAgICBpZiAoZnVsbClcclxuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcudGFiLWJvZHk6bm90KDpoYXMoZm9ybS5oYXMtY2hhbmdlcykpJykucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZpbmcgY2xhc3MgZnJvbSB0aGUgbWVudSBpdGVtICh0YWIgdGl0bGUpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgIC8vIFRvIGF2b2lkIHVzZXIgYmUgbm90aWZpZWQgb2YgY2hhbmdlcyBhbGwgdGltZSB3aXRoIHRhYiBtYXJrcywgd2UgYWRkZWQgYSAnbm90aWZ5JyBjbGFzc1xyXG4gICAgLy8gb24gdGFicyB3aGVuIGEgY2hhbmdlIG9mIHRhYiBoYXBwZW5zXHJcbiAgICAuZmluZCgnLnRhYi1ib2R5Jykub24oJ3RhYlVuZm9jdXNlZCcsIGZ1bmN0aW9uIChldmVudCwgZm9jdXNlZEN0eCkge1xyXG4gICAgICAgIHZhciBtaSA9IFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW07XHJcbiAgICAgICAgaWYgKG1pLmlzKCcuaGFzLWNoYW5nZXMnKSkge1xyXG4gICAgICAgICAgICBtaS5hZGRDbGFzcygnbm90aWZ5LWNoYW5nZXMnKTsgLy9oYXMtdG9vbHRpcFxyXG4gICAgICAgICAgICAvLyBTaG93IG5vdGlmaWNhdGlvbiBwb3B1cFxyXG4gICAgICAgICAgICB2YXIgZCA9ICQoJzxkaXYgY2xhc3M9XCJ3YXJuaW5nXCI+QDA8L2Rpdj48ZGl2IGNsYXNzPVwiYWN0aW9uc1wiPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJhY3Rpb24gY29udGludWVcIiB2YWx1ZT1cIkAyXCIvPjxpbnB1dCB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJhY3Rpb24gc3RvcFwiIHZhbHVlPVwiQDFcIi8+PC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AwL2csIExDLmdldFRleHQoJ2NoYW5nZXMtbm90LXNhdmVkJykpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDEvZywgTEMuZ2V0VGV4dCgndGFiLWhhcy1jaGFuZ2VzLXN0YXktb24nKSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMi9nLCBMQy5nZXRUZXh0KCd0YWItaGFzLWNoYW5nZXMtY29udGludWUtd2l0aG91dC1jaGFuZ2UnKSkpO1xyXG4gICAgICAgICAgICBkLm9uKCdjbGljaycsICcuc3RvcCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHdpbmRvdyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5vbignY2xpY2snLCAnLmNvbnRpbnVlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2Uod2luZG93KTtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSAnaGFzLWNoYW5nZXMnIHRvIGF2b2lkIGZ1dHVyZSBibG9ja3MgKHVudGlsIG5ldyBjaGFuZ2VzIGhhcHBlbnMgb2YgY291cnNlIDstKVxyXG4gICAgICAgICAgICAgICAgbWkucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJyk7XHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYihmb2N1c2VkQ3R4LnRhYi5nZXQoMCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihkLCB3aW5kb3csICdub3Qtc2F2ZWQtcG9wdXAnLCB7IGNsb3NhYmxlOiBmYWxzZSwgY2VudGVyOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRXZlciByZXR1cm4gZmFsc2UgdG8gc3RvcCBjdXJyZW50IHRhYiBmb2N1c1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdub3RpZnktY2hhbmdlcycpOyAvL2hhcy10b29sdGlwXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyoqIFRhYmJlZFVYOiBUYWJiZWQgaW50ZXJmYWNlIGxvZ2ljOyB3aXRoIG1pbmltYWwgSFRNTCB1c2luZyBjbGFzcyAndGFiYmVkJyBmb3IgdGhlXHJcbmNvbnRhaW5lciwgdGhlIG9iamVjdCBwcm92aWRlcyB0aGUgZnVsbCBBUEkgdG8gbWFuaXB1bGF0ZSB0YWJzIGFuZCBpdHMgc2V0dXBcclxubGlzdGVuZXJzIHRvIHBlcmZvcm0gbG9naWMgb24gdXNlciBpbnRlcmFjdGlvbi5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5oYXNTY3JvbGxCYXInKTtcclxuXHJcbnZhciBUYWJiZWRVWCA9IHtcclxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKCdib2R5JykuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicyA+IGxpOm5vdCgudGFicy1zbGlkZXIpID4gYScsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGlmIChUYWJiZWRVWC5mb2N1c1RhYigkdC5hdHRyKCdocmVmJykpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3QgPSAkKGRvY3VtZW50KS5zY3JvbGxUb3AoKTtcclxuICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhhc2ggPSAkdC5hdHRyKCdocmVmJyk7XHJcbiAgICAgICAgICAgICAgICAkKCdodG1sLGJvZHknKS5zY3JvbGxUb3Aoc3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnbW91c2Vkb3duJywgVGFiYmVkVVguc3RhcnRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ21vdXNldXAgbW91c2VsZWF2ZScsIFRhYmJlZFVYLmVuZE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC8vIHRoZSBjbGljayByZXR1cm4gZmFsc2UgaXMgdG8gZGlzYWJsZSBzdGFuZGFyIHVybCBiZWhhdmlvclxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnY2xpY2snLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXItbGltaXQnLCAnbW91c2VlbnRlcicsIFRhYmJlZFVYLnN0YXJ0TW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyLWxpbWl0JywgJ21vdXNlbGVhdmUnLCBUYWJiZWRVWC5lbmRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicyA+IGxpLnJlbW92YWJsZScsICdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIC8vIE9ubHkgb24gZGlyZWN0IGNsaWNrcyB0byB0aGUgdGFiLCB0byBhdm9pZFxyXG4gICAgICAgICAgICAvLyBjbGlja3MgdG8gdGhlIHRhYi1saW5rICh0aGF0IHNlbGVjdC9mb2N1cyB0aGUgdGFiKTpcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0ID09IGUuY3VycmVudFRhcmdldClcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLnJlbW92ZVRhYihudWxsLCB0aGlzKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gSW5pdCBwYWdlIGxvYWRlZCB0YWJiZWQgY29udGFpbmVyczpcclxuICAgICAgICAkKCcudGFiYmVkJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIC8vIENvbnNpc3RlbmNlIGNoZWNrOiB0aGlzIG11c3QgYmUgYSB2YWxpZCBjb250YWluZXIsIHRoaXMgaXMsIG11c3QgaGF2ZSAudGFic1xyXG4gICAgICAgICAgICBpZiAoJHQuY2hpbGRyZW4oJy50YWJzJykubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAvLyBJbml0IHNsaWRlclxyXG4gICAgICAgICAgICBUYWJiZWRVWC5zZXR1cFNsaWRlcigkdCk7XHJcbiAgICAgICAgICAgIC8vIENsZWFuIHdoaXRlIHNwYWNlcyAodGhleSBjcmVhdGUgZXhjZXNpdmUgc2VwYXJhdGlvbiBiZXR3ZWVuIHNvbWUgdGFicylcclxuICAgICAgICAgICAgJCgnLnRhYnMnLCB0aGlzKS5jb250ZW50cygpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhpcyBpcyBhIHRleHQgbm9kZSwgcmVtb3ZlIGl0OlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubm9kZVR5cGUgPT0gMylcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBtb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgZGlyID0gJHQuaGFzQ2xhc3MoJ3RhYnMtc2xpZGVyLXJpZ2h0JykgPyAxIDogLTE7XHJcbiAgICAgICAgdmFyIHRhYnNTbGlkZXIgPSAkdC5wYXJlbnQoKTtcclxuICAgICAgICB2YXIgdGFicyA9IHRhYnNTbGlkZXIuc2libGluZ3MoJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgdGFic1swXS5zY3JvbGxMZWZ0ICs9IDIwICogZGlyO1xyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYnNTbGlkZXIucGFyZW50KCksIHRhYnMpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBzdGFydE1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciB0YWJzID0gdC5jbG9zZXN0KCcudGFiYmVkJykuY2hpbGRyZW4oJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgLy8gU3RvcCBwcmV2aW91cyBhbmltYXRpb25zOlxyXG4gICAgICAgIHRhYnMuc3RvcCh0cnVlKTtcclxuICAgICAgICB2YXIgc3BlZWQgPSAwLjM7IC8qIHNwZWVkIHVuaXQ6IHBpeGVscy9taWxpc2Vjb25kcyAqL1xyXG4gICAgICAgIHZhciBmeGEgPSBmdW5jdGlvbiAoKSB7IFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYnMucGFyZW50KCksIHRhYnMpOyB9O1xyXG4gICAgICAgIHZhciB0aW1lO1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdyaWdodCcpKSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIGJhc2VkIG9uIHNwZWVkIHdlIHdhbnQgYW5kIGhvdyBtYW55IGRpc3RhbmNlIHRoZXJlIGlzOlxyXG4gICAgICAgICAgICB0aW1lID0gKHRhYnNbMF0uc2Nyb2xsV2lkdGggLSB0YWJzWzBdLnNjcm9sbExlZnQgLSB0YWJzLndpZHRoKCkpICogMSAvIHNwZWVkO1xyXG4gICAgICAgICAgICB0YWJzLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiB0YWJzWzBdLnNjcm9sbFdpZHRoIC0gdGFicy53aWR0aCgpIH0sXHJcbiAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIHN0ZXA6IGZ4YSwgY29tcGxldGU6IGZ4YSwgZWFzaW5nOiAnc3dpbmcnIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIGJhc2VkIG9uIHNwZWVkIHdlIHdhbnQgYW5kIGhvdyBtYW55IGRpc3RhbmNlIHRoZXJlIGlzOlxyXG4gICAgICAgICAgICB0aW1lID0gdGFic1swXS5zY3JvbGxMZWZ0ICogMSAvIHNwZWVkO1xyXG4gICAgICAgICAgICB0YWJzLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiAwIH0sXHJcbiAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIHN0ZXA6IGZ4YSwgY29tcGxldGU6IGZ4YSwgZWFzaW5nOiAnc3dpbmcnIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgZW5kTW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGFiQ29udGFpbmVyID0gJCh0aGlzKS5jbG9zZXN0KCcudGFiYmVkJyk7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpLnN0b3AodHJ1ZSk7XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFiQ29udGFpbmVyKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgY2hlY2tUYWJTbGlkZXJMaW1pdHM6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIHRhYnMpIHtcclxuICAgICAgICB0YWJzID0gdGFicyB8fCB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJyk7XHJcbiAgICAgICAgLy8gU2V0IHZpc2liaWxpdHkgb2YgdmlzdWFsIGxpbWl0ZXJzOlxyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyLWxpbWl0LWxlZnQnKS50b2dnbGUodGFic1swXS5zY3JvbGxMZWZ0ID4gMCk7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXItbGltaXQtcmlnaHQnKS50b2dnbGUoXHJcbiAgICAgICAgICAgICh0YWJzWzBdLnNjcm9sbExlZnQgKyB0YWJzLndpZHRoKCkpIDwgdGFic1swXS5zY3JvbGxXaWR0aCk7XHJcbiAgICB9LFxyXG4gICAgc2V0dXBTbGlkZXI6IGZ1bmN0aW9uICh0YWJDb250YWluZXIpIHtcclxuICAgICAgICB2YXIgdHMgPSB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlcicpO1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzJykuaGFzU2Nyb2xsQmFyKHsgeDogLTIgfSkuaG9yaXpvbnRhbCkge1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuYWRkQ2xhc3MoJ2hhcy10YWJzLXNsaWRlcicpO1xyXG4gICAgICAgICAgICBpZiAodHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgdHMuY2xhc3NOYW1lID0gJ3RhYnMtc2xpZGVyJztcclxuICAgICAgICAgICAgICAgICQodHMpXHJcbiAgICAgICAgICAgICAgICAvLyBBcnJvd3M6XHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJ0YWJzLXNsaWRlci1sZWZ0IGxlZnRcIiBocmVmPVwiI1wiPiZsdDsmbHQ7PC9hPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGEgY2xhc3M9XCJ0YWJzLXNsaWRlci1yaWdodCByaWdodFwiIGhyZWY9XCIjXCI+Jmd0OyZndDs8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXIuYXBwZW5kKHRzKTtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lclxyXG4gICAgICAgICAgICAgICAgLy8gRGVzaW5nIGRldGFpbHM6XHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGRpdiBjbGFzcz1cInRhYnMtc2xpZGVyLWxpbWl0IHRhYnMtc2xpZGVyLWxpbWl0LWxlZnQgbGVmdFwiIGhyZWY9XCIjXCI+PC9kaXY+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGFicy1zbGlkZXItbGltaXQgdGFicy1zbGlkZXItbGltaXQtcmlnaHQgcmlnaHRcIiBocmVmPVwiI1wiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdHMuc2hvdygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLnJlbW92ZUNsYXNzKCdoYXMtdGFicy1zbGlkZXInKTtcclxuICAgICAgICAgICAgdHMuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJDb250YWluZXIpO1xyXG4gICAgfSxcclxuICAgIGdldFRhYkNvbnRleHRCeUFyZ3M6IGZ1bmN0aW9uIChhcmdzKSB7XHJcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgdHlwZW9mIChhcmdzWzBdKSA9PSAnc3RyaW5nJylcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFiQ29udGV4dChhcmdzWzBdLCBudWxsKTtcclxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJiBhcmdzWzBdLnRhYilcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ3NbMF07XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUYWJDb250ZXh0KFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAwID8gYXJnc1swXSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDEgPyBhcmdzWzFdIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMiA/IGFyZ3NbMl0gOiBudWxsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiQ29udGV4dDogZnVuY3Rpb24gKHRhYk9yU2VsZWN0b3IsIG1lbnVpdGVtT3JTZWxlY3Rvcikge1xyXG4gICAgICAgIHZhciBtaSwgbWEsIHRhYiwgdGFiQ29udGFpbmVyO1xyXG4gICAgICAgIGlmICh0YWJPclNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIHRhYiA9ICQodGFiT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmICh0YWIubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lciA9IHRhYi5wYXJlbnRzKCcudGFiYmVkOmVxKDApJyk7XHJcbiAgICAgICAgICAgICAgICBtYSA9IHRhYkNvbnRhaW5lci5maW5kKCc+IC50YWJzID4gbGkgPiBhW2hyZWY9IycgKyB0YWIuZ2V0KDApLmlkICsgJ10nKTtcclxuICAgICAgICAgICAgICAgIG1pID0gbWEucGFyZW50KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKG1lbnVpdGVtT3JTZWxlY3Rvcikge1xyXG4gICAgICAgICAgICBtYSA9ICQobWVudWl0ZW1PclNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKG1hLmlzKCdsaScpKSB7XHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hO1xyXG4gICAgICAgICAgICAgICAgbWEgPSBtaS5jaGlsZHJlbignYTplcSgwKScpO1xyXG4gICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgIG1pID0gbWEucGFyZW50KCk7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lciA9IG1pLmNsb3Nlc3QoJy50YWJiZWQnKTtcclxuICAgICAgICAgICAgdGFiID0gdGFiQ29udGFpbmVyLmZpbmQoJz4udGFiLWJvZHlAMCwgPi50YWItYm9keS1saXN0Pi50YWItYm9keUAwJy5yZXBsYWNlKC9AMC9nLCBtYS5hdHRyKCdocmVmJykpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHsgdGFiOiB0YWIsIG1lbnVhbmNob3I6IG1hLCBtZW51aXRlbTogbWksIHRhYkNvbnRhaW5lcjogdGFiQ29udGFpbmVyIH07XHJcbiAgICB9LFxyXG4gICAgY2hlY2tUYWJDb250ZXh0OiBmdW5jdGlvbiAoY3R4LCBmdW5jdGlvbm5hbWUsIGFyZ3MsIGlzVGVzdCkge1xyXG4gICAgICAgIGlmICghY3R4LnRhYiB8fCBjdHgudGFiLmxlbmd0aCAhPSAxIHx8XHJcbiAgICAgICAgICAgICFjdHgubWVudWl0ZW0gfHwgY3R4Lm1lbnVpdGVtLmxlbmd0aCAhPSAxIHx8XHJcbiAgICAgICAgICAgICFjdHgudGFiQ29udGFpbmVyIHx8IGN0eC50YWJDb250YWluZXIubGVuZ3RoICE9IDEgfHwgXHJcbiAgICAgICAgICAgICFjdHgubWVudWFuY2hvciB8fCBjdHgubWVudWFuY2hvci5sZW5ndGggIT0gMSkge1xyXG4gICAgICAgICAgICBpZiAoIWlzVGVzdCAmJiBjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdUYWJiZWRVWC4nICsgZnVuY3Rpb25uYW1lICsgJywgYmFkIGFyZ3VtZW50czogJyArIEFycmF5LmpvaW4oYXJncywgJywgJykpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGdldFRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2ZvY3VzVGFiJywgYXJndW1lbnRzLCB0cnVlKSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgcmV0dXJuIGN0eC50YWIuZ2V0KDApO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZm9jdXNUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIEdldCBwcmV2aW91cyBmb2N1c2VkIHRhYiwgdHJpZ2dlciAndGFiVW5mb2N1c2VkJyBoYW5kbGVyIHRoYXQgY2FuXHJcbiAgICAgICAgLy8gc3RvcCB0aGlzIGZvY3VzIChyZXR1cm5pbmcgZXhwbGljaXR5ICdmYWxzZScpXHJcbiAgICAgICAgdmFyIHByZXZUYWIgPSBjdHgudGFiLnNpYmxpbmdzKCcuY3VycmVudCcpO1xyXG4gICAgICAgIGlmIChwcmV2VGFiLnRyaWdnZXJIYW5kbGVyKCd0YWJVbmZvY3VzZWQnLCBbY3R4XSkgPT09IGZhbHNlKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIENoZWNrIChmaXJzdCEpIGlmIHRoZXJlIGlzIGEgcGFyZW50IHRhYiBhbmQgZm9jdXMgaXQgdG9vICh3aWxsIGJlIHJlY3Vyc2l2ZSBjYWxsaW5nIHRoaXMgc2FtZSBmdW5jdGlvbilcclxuICAgICAgICB2YXIgcGFyVGFiID0gY3R4LnRhYi5wYXJlbnRzKCcudGFiLWJvZHk6ZXEoMCknKTtcclxuICAgICAgICBpZiAocGFyVGFiLmxlbmd0aCA9PSAxKSB0aGlzLmZvY3VzVGFiKHBhclRhYik7XHJcblxyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2N1cnJlbnQnKSB8fFxyXG4gICAgICAgICAgICBjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2Rpc2FibGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gVW5zZXQgY3VycmVudCBtZW51IGVsZW1lbnRcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2libGluZ3MoJy5jdXJyZW50JykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAuZmluZCgnPmEnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIC8vIFNldCBjdXJyZW50IG1lbnUgZWxlbWVudFxyXG4gICAgICAgIGN0eC5tZW51aXRlbS5hZGRDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIGN0eC5tZW51YW5jaG9yLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcblxyXG4gICAgICAgIC8vIEhpZGUgY3VycmVudCB0YWItYm9keVxyXG4gICAgICAgIHByZXZUYWIucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAvLyBTaG93IGN1cnJlbnQgdGFiLWJvZHkgYW5kIHRyaWdnZXIgZXZlbnRcclxuICAgICAgICBjdHgudGFiLmFkZENsYXNzKCdjdXJyZW50JylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJGb2N1c2VkJyk7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIGZvY3VzVGFiSW5kZXg6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIHRhYkluZGV4KSB7XHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lcilcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZm9jdXNUYWIodGhpcy5nZXRUYWJDb250ZXh0KHRhYkNvbnRhaW5lci5maW5kKCc+LnRhYi1ib2R5OmVxKCcgKyB0YWJJbmRleCArICcpJykpKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgLyogRW5hYmxlIGEgdGFiLCBkaXNhYmxpbmcgYWxsIG90aGVycyB0YWJzIC11c2VmdWxsIGluIHdpemFyZCBzdHlsZSBwYWdlcy0gKi9cclxuICAgIGVuYWJsZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2VuYWJsZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICB2YXIgcnRuID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5pcygnLmRpc2FibGVkJykpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGRpc2FibGVkIGNsYXNzIGZyb20gZm9jdXNlZCB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgICAgICBjdHgudGFiLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRW5hYmxlZCcpO1xyXG4gICAgICAgICAgICBjdHgubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgICAgIHJ0biA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEZvY3VzIHRhYjpcclxuICAgICAgICB0aGlzLmZvY3VzVGFiKGN0eCk7XHJcbiAgICAgICAgLy8gRGlzYWJsZWQgdGFicyBhbmQgbWVudSBpdGVtczpcclxuICAgICAgICBjdHgudGFiLnNpYmxpbmdzKCc6bm90KC5kaXNhYmxlZCknKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2Rpc2FibGVkJylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJEaXNhYmxlZCcpO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaWJsaW5ncygnOm5vdCguZGlzYWJsZWQpJylcclxuICAgICAgICAgICAgLmFkZENsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgICAgIHJldHVybiBydG47XHJcbiAgICB9LFxyXG4gICAgc2hvd2hpZGVEdXJhdGlvbjogMCxcclxuICAgIHNob3doaWRlRWFzaW5nOiBudWxsLFxyXG4gICAgc2hvd1RhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3Nob3dUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2hvdyB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgIGN0eC50YWIuc2hvdyh0aGlzLnNob3doaWRlRHVyYXRpb24pO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaG93KHRoaXMuc2hvd2hpZGVFYXNpbmcpO1xyXG4gICAgfSxcclxuICAgIGhpZGVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdoaWRlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNob3cgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICBjdHgudGFiLmhpZGUodGhpcy5zaG93aGlkZUR1cmF0aW9uKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uaGlkZSh0aGlzLnNob3doaWRlRWFzaW5nKTtcclxuICAgIH0sXHJcbiAgICB0YWJCb2R5Q2xhc3NFeGNlcHRpb25zOiB7ICd0YWItYm9keSc6IDAsICd0YWJiZWQnOiAwLCAnY3VycmVudCc6IDAsICdkaXNhYmxlZCc6IDAgfSxcclxuICAgIGNyZWF0ZVRhYjogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgaWROYW1lLCBsYWJlbCkge1xyXG4gICAgICAgIHRhYkNvbnRhaW5lciA9ICQodGFiQ29udGFpbmVyKTtcclxuICAgICAgICAvLyB0YWJDb250YWluZXIgbXVzdCBiZSBvbmx5IG9uZSBhbmQgdmFsaWQgY29udGFpbmVyXHJcbiAgICAgICAgLy8gYW5kIGlkTmFtZSBtdXN0IG5vdCBleGlzdHNcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyLmxlbmd0aCA9PSAxICYmIHRhYkNvbnRhaW5lci5pcygnLnRhYmJlZCcpICYmXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkTmFtZSkgPT09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIHRhYiBkaXY6XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgdGFiLmlkID0gaWROYW1lO1xyXG4gICAgICAgICAgICAvLyBSZXF1aXJlZCBjbGFzc2VzXHJcbiAgICAgICAgICAgIHRhYi5jbGFzc05hbWUgPSBcInRhYi1ib2R5XCI7XHJcbiAgICAgICAgICAgIHZhciAkdGFiID0gJCh0YWIpO1xyXG4gICAgICAgICAgICAvLyBHZXQgYW4gZXhpc3Rpbmcgc2libGluZyBhbmQgY29weSAod2l0aCBzb21lIGV4Y2VwdGlvbnMpIHRoZWlyIGNzcyBjbGFzc2VzXHJcbiAgICAgICAgICAgICQuZWFjaCh0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWItYm9keTplcSgwKScpLmF0dHIoJ2NsYXNzJykuc3BsaXQoL1xccysvKSwgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAgICAgICAgIGlmICghKHYgaW4gVGFiYmVkVVgudGFiQm9keUNsYXNzRXhjZXB0aW9ucykpXHJcbiAgICAgICAgICAgICAgICAgICAgJHRhYi5hZGRDbGFzcyh2KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIEFkZCB0byBjb250YWluZXJcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFwcGVuZCh0YWIpO1xyXG5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG1lbnUgZW50cnlcclxuICAgICAgICAgICAgdmFyIG1lbnVpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcclxuICAgICAgICAgICAgLy8gQmVjYXVzZSBpcyBhIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdGFiLCBpcyBhIGR5bmFtaWNhbGx5IHJlbW92YWJsZSB0YWI6XHJcbiAgICAgICAgICAgIG1lbnVpdGVtLmNsYXNzTmFtZSA9IFwicmVtb3ZhYmxlXCI7XHJcbiAgICAgICAgICAgIHZhciBtZW51YW5jaG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgICAgICBtZW51YW5jaG9yLnNldEF0dHJpYnV0ZSgnaHJlZicsICcjJyArIGlkTmFtZSk7XHJcbiAgICAgICAgICAgIC8vIGxhYmVsIGNhbm5vdCBiZSBudWxsIG9yIGVtcHR5XHJcbiAgICAgICAgICAgICQobWVudWFuY2hvcikudGV4dChpc0VtcHR5U3RyaW5nKGxhYmVsKSA/IFwiVGFiXCIgOiBsYWJlbCk7XHJcbiAgICAgICAgICAgICQobWVudWl0ZW0pLmFwcGVuZChtZW51YW5jaG9yKTtcclxuICAgICAgICAgICAgLy8gQWRkIHRvIHRhYnMgbGlzdCBjb250YWluZXJcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpLmFwcGVuZChtZW51aXRlbSk7XHJcblxyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50LCBvbiB0YWJDb250YWluZXIsIHdpdGggdGhlIG5ldyB0YWIgYXMgZGF0YVxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIudHJpZ2dlckhhbmRsZXIoJ3RhYkNyZWF0ZWQnLCBbdGFiXSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldHVwU2xpZGVyKHRhYkNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGFiO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgcmVtb3ZlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAncmVtb3ZlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBPbmx5IHJlbW92ZSBpZiBpcyBhICdyZW1vdmFibGUnIHRhYlxyXG4gICAgICAgIGlmICghY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdyZW1vdmFibGUnKSAmJiAhY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCd2b2xhdGlsZScpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy8gSWYgdGFiIGlzIGN1cnJlbnRseSBmb2N1c2VkIHRhYiwgY2hhbmdlIHRvIGZpcnN0IHRhYlxyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ2N1cnJlbnQnKSlcclxuICAgICAgICAgICAgdGhpcy5mb2N1c1RhYkluZGV4KGN0eC50YWJDb250YWluZXIsIDApO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5yZW1vdmUoKTtcclxuICAgICAgICB2YXIgdGFiaWQgPSBjdHgudGFiLmdldCgwKS5pZDtcclxuICAgICAgICBjdHgudGFiLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnNldHVwU2xpZGVyKGN0eC50YWJDb250YWluZXIpO1xyXG5cclxuICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50LCBvbiB0YWJDb250YWluZXIsIHdpdGggdGhlIHJlbW92ZWQgdGFiIGlkIGFzIGRhdGFcclxuICAgICAgICBjdHgudGFiQ29udGFpbmVyLnRyaWdnZXJIYW5kbGVyKCd0YWJSZW1vdmVkJywgW3RhYmlkXSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgc2V0VGFiVGl0bGU6IGZ1bmN0aW9uICh0YWJPclNlbGVjdG9yLCBuZXdUaXRsZSkge1xyXG4gICAgICAgIHZhciBjdHggPSBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRhYk9yU2VsZWN0b3IpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnc2V0VGFiVGl0bGUnLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2V0IGFuIGVtcHR5IHN0cmluZyBpcyBub3QgYWxsb3dlZCwgcHJlc2VydmUgcHJldmlvdXNseTpcclxuICAgICAgICBpZiAoIWlzRW1wdHlTdHJpbmcobmV3VGl0bGUpKVxyXG4gICAgICAgICAgICBjdHgubWVudWFuY2hvci50ZXh0KG5ld1RpdGxlKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qIE1vcmUgc3RhdGljIHV0aWxpdGllcyAqL1xyXG5cclxuLyoqIExvb2sgdXAgdGhlIGN1cnJlbnQgd2luZG93IGxvY2F0aW9uIGFkZHJlc3MgYW5kIHRyeSB0byBmb2N1cyBhIHRhYiB3aXRoIHRoYXRcclxuICAgIG5hbWUsIGlmIHRoZXJlIGlzIG9uZS5cclxuKiovXHJcblRhYmJlZFVYLmZvY3VzQ3VycmVudExvY2F0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gSWYgdGhlIGN1cnJlbnQgbG9jYXRpb24gaGF2ZSBhIGhhc2ggdmFsdWUgYnV0IGlzIG5vdCBhIEhhc2hCYW5nXHJcbiAgICBpZiAoL14jW14hXS8udGVzdCh3aW5kb3cubG9jYXRpb24uaGFzaCkpIHtcclxuICAgICAgICAvLyBUcnkgZm9jdXMgYSB0YWIgd2l0aCB0aGF0IG5hbWVcclxuICAgICAgICB2YXIgdGFiID0gVGFiYmVkVVguZ2V0VGFiKHdpbmRvdy5sb2NhdGlvbi5oYXNoKTtcclxuICAgICAgICBpZiAodGFiKVxyXG4gICAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0YWIpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqIExvb2sgZm9yIHZvbGF0aWxlIHRhYnMgb24gdGhlIHBhZ2UsIGlmIHRoZXkgYXJlXHJcbiAgICBlbXB0eSBvciByZXF1ZXN0aW5nIGJlaW5nICd2b2xhdGl6ZWQnLCByZW1vdmUgaXQuXHJcbioqL1xyXG5UYWJiZWRVWC5jaGVja1ZvbGF0aWxlVGFicyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoJy50YWJiZWQgPiAudGFicyA+IC52b2xhdGlsZScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0YWIgPSBUYWJiZWRVWC5nZXRUYWIobnVsbCwgdGhpcyk7XHJcbiAgICAgICAgaWYgKHRhYiAmJiAoJCh0YWIpLmNoaWxkcmVuKCkubGVuZ3RoID09PSAwIHx8ICQodGFiKS5maW5kKCc6bm90KC50YWJiZWQpIC52b2xhdGl6ZS1teS10YWInKS5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgIFRhYmJlZFVYLnJlbW92ZVRhYih0YWIpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGFiYmVkVVg7IiwiLyogc2xpZGVyLXRhYnMgbG9naWMuXHJcbiogRXhlY3V0ZSBpbml0IGFmdGVyIFRhYmJlZFVYLmluaXQgdG8gYXZvaWQgbGF1bmNoIGFuaW1hdGlvbiBvbiBwYWdlIGxvYWQuXHJcbiogSXQgcmVxdWlyZXMgVGFiYmVkVVggdGhyb3VnaHQgREkgb24gJ2luaXQnLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0U2xpZGVyVGFicyhUYWJiZWRVWCkge1xyXG4gICAgJCgnLnRhYmJlZC5zbGlkZXItdGFicycpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyICR0YWJzID0gJHQuY2hpbGRyZW4oJy50YWItYm9keScpO1xyXG4gICAgICAgIHZhciBjID0gJHRhYnNcclxuICAgICAgICAgICAgLndyYXBBbGwoJzxkaXYgY2xhc3M9XCJ0YWItYm9keS1saXN0XCIvPicpXHJcbiAgICAgICAgICAgIC5lbmQoKS5jaGlsZHJlbignLnRhYi1ib2R5LWxpc3QnKTtcclxuICAgICAgICAkdGFicy5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYy5zdG9wKHRydWUsIGZhbHNlKS5hbmltYXRlKHsgc2Nyb2xsTGVmdDogYy5zY3JvbGxMZWZ0KCkgKyAkKHRoaXMpLnBvc2l0aW9uKCkubGVmdCB9LCAxNDAwKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBTZXQgaG9yaXpvbnRhbCBzY3JvbGwgdG8gdGhlIHBvc2l0aW9uIG9mIGN1cnJlbnQgc2hvd2VkIHRhYiwgd2l0aG91dCBhbmltYXRpb24gKGZvciBwYWdlLWluaXQpOlxyXG4gICAgICAgIHZhciBjdXJyZW50VGFiID0gJCgkdC5maW5kKCc+LnRhYnM+bGkuY3VycmVudD5hJykuYXR0cignaHJlZicpKTtcclxuICAgICAgICBjLnNjcm9sbExlZnQoYy5zY3JvbGxMZWZ0KCkgKyBjdXJyZW50VGFiLnBvc2l0aW9uKCkubGVmdCk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIFdpemFyZCBUYWJiZWQgRm9ybXMuXHJcbiAgICBJdCB1c2UgdGFicyB0byBtYW5hZ2UgdGhlIGRpZmZlcmVudCBmb3Jtcy1zdGVwcyBpbiB0aGUgd2l6YXJkLFxyXG4gICAgbG9hZGVkIGJ5IEFKQVggYW5kIGZvbGxvd2luZyB0byB0aGUgbmV4dCB0YWIvc3RlcCBvbiBzdWNjZXNzLlxyXG5cclxuICAgIFJlcXVpcmUgVGFiYmVkVVggdmlhIERJIG9uICdpbml0J1xyXG4gKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKSxcclxuICAgIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0VGFiYmVkV2l6YXJkKFRhYmJlZFVYLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGxvYWRpbmdEZWxheTogMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChcImJvZHlcIikuZGVsZWdhdGUoXCIudGFiYmVkLndpemFyZCAubmV4dFwiLCBcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBmb3JtXHJcbiAgICAgICAgdmFyIGZvcm0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBjdXJyZW50IHdpemFyZCBzdGVwLXRhYlxyXG4gICAgICAgIHZhciBjdXJyZW50U3RlcCA9IGZvcm0uY2xvc2VzdCgnLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgd2l6YXJkIGNvbnRhaW5lclxyXG4gICAgICAgIHZhciB3aXphcmQgPSBmb3JtLmNsb3Nlc3QoJy50YWJiZWQud2l6YXJkJyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgd2l6YXJkLW5leHQtc3RlcFxyXG4gICAgICAgIHZhciBuZXh0U3RlcCA9ICQodGhpcykuZGF0YSgnd2l6YXJkLW5leHQtc3RlcCcpO1xyXG5cclxuICAgICAgICB2YXIgY3R4ID0ge1xyXG4gICAgICAgICAgICBib3g6IGN1cnJlbnRTdGVwLFxyXG4gICAgICAgICAgICBmb3JtOiBmb3JtXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy8gRmlyc3QgYXQgYWxsLCBpZiB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICAgICAgdmFyIHZhbG9iamVjdCA9IGZvcm0uZGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKHZhbG9iamVjdCAmJiB2YWxvYmplY3QudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5nb1RvU3VtbWFyeUVycm9ycyhmb3JtKTtcclxuICAgICAgICAgICAgLy8gVmFsaWRhdGlvbiBpcyBhY3RpdmVkLCB3YXMgZXhlY3V0ZWQgYW5kIHRoZSByZXN1bHQgaXMgJ2ZhbHNlJzogYmFkIGRhdGEsIHN0b3AgUG9zdDpcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgY3VzdG9tIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgICAgICB2YXIgY3VzdmFsID0gZm9ybS5kYXRhKCdjdXN0b21WYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgaWYgKGN1c3ZhbCAmJiBjdXN2YWwudmFsaWRhdGUgJiYgY3VzdmFsLnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSk7XHJcbiAgICAgICAgICAgIC8vIGN1c3RvbSB2YWxpZGF0aW9uIG5vdCBwYXNzZWQsIG91dCFcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmFpc2UgZXZlbnRcclxuICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdiZWdpblN1Ym1pdFdpemFyZFN0ZXAnKTtcclxuXHJcbiAgICAgICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgICAgICBjdHgubG9hZGluZ3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwLmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgICAgICB9LCBvcHRpb25zLmxvYWRpbmdEZWxheSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBvayA9IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBNYXJrIGFzIHNhdmVkOlxyXG4gICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmb3JtLmdldCgwKSk7XHJcblxyXG4gICAgICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IChmb3JtLmF0dHIoJ2FjdGlvbicpIHx8ICcnKSxcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgICAgIGRhdGE6IGZvcm0uc2VyaWFsaXplKCksXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIElmIHN1Y2Nlc3MsIGdvIG5leHQgc3RlcCwgdXNpbmcgY3VzdG9tIEpTT04gQWN0aW9uIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0ub24oJ2FqYXhTdWNjZXNzUG9zdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBuZXh0LXN0ZXBcclxuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFN0ZXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbmV4dCBzdGVwIGlzIGludGVybmFsIHVybCAoYSBuZXh0IHdpemFyZCB0YWIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvXiMvLnRlc3QobmV4dFN0ZXApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5leHRTdGVwKS50cmlnZ2VyKCdiZWdpbkxvYWRXaXphcmRTdGVwJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVGFiYmVkVVguZW5hYmxlVGFiKG5leHRTdGVwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKG5leHRTdGVwKS50cmlnZ2VyKCdlbmRMb2FkV2l6YXJkU3RlcCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgYSBuZXh0LXN0ZXAgVVJJIHRoYXQgaXMgbm90IGludGVybmFsIGxpbmssIHdlIGxvYWQgaXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0VG8obmV4dFN0ZXApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRG8gSlNPTiBhY3Rpb24gYnV0IGlmIGlzIG5vdCBKU09OIG9yIHZhbGlkLCBtYW5hZ2UgYXMgSFRNTDpcclxuICAgICAgICAgICAgICAgIGlmICghYWpheENhbGxiYWNrcy5kb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQb3N0ICdtYXliZScgd2FzIHdyb25nLCBodG1sIHdhcyByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9ybSBjb250YWluZXI6IHRoZSBhamF4LWJveC5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhbiBlbXB0eSBkb2N1bWVudCBvciBtYWxmb3JtZWQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvd2luZyBuZXcgaHRtbDpcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50U3RlcC5odG1sKG5ld2h0bWwpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdGb3JtID0gY3VycmVudFN0ZXA7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50U3RlcC5pcygnZm9ybScpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGb3JtID0gY3VycmVudFN0ZXAuZmluZCgnZm9ybTplcSgwKScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAgICAgICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50c1xyXG4gICAgICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ3JlbG9hZGVkSHRtbFdpemFyZFN0ZXAnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGFqYXhDYWxsYmFja3MuZXJyb3IsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBhamF4Q2FsbGJhY2tzLmNvbXBsZXRlXHJcbiAgICAgICAgfSkuY29tcGxldGUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdlbmRTdWJtaXRXaXphcmRTdGVwJywgb2spO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKiB0aW1lU3BhbiBjbGFzcyB0byBtYW5hZ2UgdGltZXMsIHBhcnNlLCBmb3JtYXQsIGNvbXB1dGUuXHJcbkl0cyBub3Qgc28gY29tcGxldGUgYXMgdGhlIEMjIG9uZXMgYnV0IGlzIHVzZWZ1bGwgc3RpbGwuXHJcbioqL1xyXG52YXIgVGltZVNwYW4gPSBmdW5jdGlvbiAoZGF5cywgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcykge1xyXG4gICAgdGhpcy5kYXlzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGRheXMpKSB8fCAwO1xyXG4gICAgdGhpcy5ob3VycyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChob3VycykpIHx8IDA7XHJcbiAgICB0aGlzLm1pbnV0ZXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQobWludXRlcykpIHx8IDA7XHJcbiAgICB0aGlzLnNlY29uZHMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoc2Vjb25kcykpIHx8IDA7XHJcbiAgICB0aGlzLm1pbGxpc2Vjb25kcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChtaWxsaXNlY29uZHMpKSB8fCAwO1xyXG5cclxuICAgIC8vIGludGVybmFsIHV0aWxpdHkgZnVuY3Rpb24gJ3RvIHN0cmluZyB3aXRoIHR3byBkaWdpdHMgYWxtb3N0J1xyXG4gICAgZnVuY3Rpb24gdChuKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IobiAvIDEwKSArICcnICsgbiAlIDEwO1xyXG4gICAgfVxyXG4gICAgLyoqIFNob3cgb25seSBob3VycyBhbmQgbWludXRlcyBhcyBhIHN0cmluZyB3aXRoIHRoZSBmb3JtYXQgSEg6bW1cclxuICAgICoqL1xyXG4gICAgdGhpcy50b1Nob3J0U3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TaG9ydFN0cmluZygpIHtcclxuICAgICAgICB2YXIgaCA9IHQodGhpcy5ob3VycyksXHJcbiAgICAgICAgICAgIG0gPSB0KHRoaXMubWludXRlcyk7XHJcbiAgICAgICAgcmV0dXJuIChoICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgKyBtKTtcclxuICAgIH07XHJcbiAgICAvKiogU2hvdyB0aGUgZnVsbCB0aW1lIGFzIGEgc3RyaW5nLCBkYXlzIGNhbiBhcHBlYXIgYmVmb3JlIGhvdXJzIGlmIHRoZXJlIGFyZSAyNCBob3VycyBvciBtb3JlXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1N0cmluZygpIHtcclxuICAgICAgICB2YXIgaCA9IHQodGhpcy5ob3VycyksXHJcbiAgICAgICAgICAgIGQgPSAodGhpcy5kYXlzID4gMCA/IHRoaXMuZGF5cy50b1N0cmluZygpICsgVGltZVNwYW4uZGVjaW1hbHNEZWxpbWl0ZXIgOiAnJyksXHJcbiAgICAgICAgICAgIG0gPSB0KHRoaXMubWludXRlcyksXHJcbiAgICAgICAgICAgIHMgPSB0KHRoaXMuc2Vjb25kcyArIHRoaXMubWlsbGlzZWNvbmRzIC8gMTAwMCk7XHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgZCArXHJcbiAgICAgICAgICAgIGggKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArXHJcbiAgICAgICAgICAgIG0gKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArXHJcbiAgICAgICAgICAgIHMpO1xyXG4gICAgfTtcclxuICAgIHRoaXMudmFsdWVPZiA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3ZhbHVlT2YoKSB7XHJcbiAgICAgICAgLy8gUmV0dXJuIHRoZSB0b3RhbCBtaWxsaXNlY29uZHMgY29udGFpbmVkIGJ5IHRoZSB0aW1lXHJcbiAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgdGhpcy5kYXlzICogKDI0ICogMzYwMDAwMCkgK1xyXG4gICAgICAgICAgICB0aGlzLmhvdXJzICogMzYwMDAwMCArXHJcbiAgICAgICAgICAgIHRoaXMubWludXRlcyAqIDYwMDAwICtcclxuICAgICAgICAgICAgdGhpcy5zZWNvbmRzICogMTAwMCArXHJcbiAgICAgICAgICAgIHRoaXMubWlsbGlzZWNvbmRzXHJcbiAgICAgICAgKTtcclxuICAgIH07XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgbWlsbGlzZWNvbmRzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbU1pbGxpc2Vjb25kcyhtaWxsaXNlY29uZHMpIHtcclxuICAgIHZhciBtcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDAsXHJcbiAgICAgICAgcyA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gMTAwMCkgJSA2MCxcclxuICAgICAgICBtID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyA2MDAwMCkgJSA2MCxcclxuICAgICAgICBoID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAzNjAwMDAwKSAlIDI0LFxyXG4gICAgICAgIGQgPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvICgzNjAwMDAwICogMjQpKTtcclxuICAgIHJldHVybiBuZXcgVGltZVNwYW4oZCwgaCwgbSwgcywgbXMpO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgc2Vjb25kc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbVNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tU2Vjb25kcyhzZWNvbmRzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tTWlsbGlzZWNvbmRzKHNlY29uZHMgKiAxMDAwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIG1pbnV0ZXNcclxuKiovXHJcblRpbWVTcGFuLmZyb21NaW51dGVzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbU1pbnV0ZXMobWludXRlcykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbVNlY29uZHMobWludXRlcyAqIDYwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIGhvdXJzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tSG91cnMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tSG91cnMoaG91cnMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21NaW51dGVzKGhvdXJzICogNjApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgZGF5c1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbURheXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tRGF5cyhkYXlzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tSG91cnMoZGF5cyAqIDI0KTtcclxufTtcclxuXHJcbi8vIEZvciBzcGFuaXNoIGFuZCBlbmdsaXNoIHdvcmtzIGdvb2QgJzonIGFzIHVuaXRzRGVsaW1pdGVyIGFuZCAnLicgYXMgZGVjaW1hbERlbGltaXRlclxyXG4vLyBUT0RPOiB0aGlzIG11c3QgYmUgc2V0IGZyb20gYSBnbG9iYWwgTEMuaTE4biB2YXIgbG9jYWxpemVkIGZvciBjdXJyZW50IHVzZXJcclxuVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgPSAnOic7XHJcblRpbWVTcGFuLmRlY2ltYWxzRGVsaW1pdGVyID0gJy4nO1xyXG5UaW1lU3Bhbi5wYXJzZSA9IGZ1bmN0aW9uIChzdHJ0aW1lKSB7XHJcbiAgICBzdHJ0aW1lID0gKHN0cnRpbWUgfHwgJycpLnNwbGl0KHRoaXMudW5pdHNEZWxpbWl0ZXIpO1xyXG4gICAgLy8gQmFkIHN0cmluZywgcmV0dXJucyBudWxsXHJcbiAgICBpZiAoc3RydGltZS5sZW5ndGggPCAyKVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIC8vIERlY291cGxlZCB1bml0czpcclxuICAgIHZhciBkLCBoLCBtLCBzLCBtcztcclxuICAgIGggPSBzdHJ0aW1lWzBdO1xyXG4gICAgbSA9IHN0cnRpbWVbMV07XHJcbiAgICBzID0gc3RydGltZS5sZW5ndGggPiAyID8gc3RydGltZVsyXSA6IDA7XHJcbiAgICAvLyBTdWJzdHJhY3RpbmcgZGF5cyBmcm9tIHRoZSBob3VycyBwYXJ0IChmb3JtYXQ6ICdkYXlzLmhvdXJzJyB3aGVyZSAnLicgaXMgZGVjaW1hbHNEZWxpbWl0ZXIpXHJcbiAgICBpZiAoaC5jb250YWlucyh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyKSkge1xyXG4gICAgICAgIHZhciBkaHNwbGl0ID0gaC5zcGxpdCh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyKTtcclxuICAgICAgICBkID0gZGhzcGxpdFswXTtcclxuICAgICAgICBoID0gZGhzcGxpdFsxXTtcclxuICAgIH1cclxuICAgIC8vIE1pbGxpc2Vjb25kcyBhcmUgZXh0cmFjdGVkIGZyb20gdGhlIHNlY29uZHMgKGFyZSByZXByZXNlbnRlZCBhcyBkZWNpbWFsIG51bWJlcnMgb24gdGhlIHNlY29uZHMgcGFydDogJ3NlY29uZHMubWlsbGlzZWNvbmRzJyB3aGVyZSAnLicgaXMgZGVjaW1hbHNEZWxpbWl0ZXIpXHJcbiAgICBtcyA9IE1hdGgucm91bmQocGFyc2VGbG9hdChzLnJlcGxhY2UodGhpcy5kZWNpbWFsc0RlbGltaXRlciwgJy4nKSkgKiAxMDAwICUgMTAwMCk7XHJcbiAgICAvLyBSZXR1cm4gdGhlIG5ldyB0aW1lIGluc3RhbmNlXHJcbiAgICByZXR1cm4gbmV3IFRpbWVTcGFuKGQsIGgsIG0sIHMsIG1zKTtcclxufTtcclxuVGltZVNwYW4uemVybyA9IG5ldyBUaW1lU3BhbigwLCAwLCAwLCAwLCAwKTtcclxuVGltZVNwYW4ucHJvdG90eXBlLmlzWmVybyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2lzWmVybygpIHtcclxuICAgIHJldHVybiAoXHJcbiAgICAgICAgdGhpcy5kYXlzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5ob3VycyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMubWludXRlcyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMuc2Vjb25kcyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMubWlsbGlzZWNvbmRzID09PSAwXHJcbiAgICApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxNaWxsaXNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbE1pbGxpc2Vjb25kcygpIHtcclxuICAgIHJldHVybiB0aGlzLnZhbHVlT2YoKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsU2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsU2Vjb25kcygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbE1pbGxpc2Vjb25kcygpIC8gMTAwMCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbE1pbnV0ZXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbE1pbnV0ZXMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxTZWNvbmRzKCkgLyA2MCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbEhvdXJzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxIb3VycygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbE1pbnV0ZXMoKSAvIDYwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsRGF5cyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsRGF5cygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbEhvdXJzKCkgLyAyNCk7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRpbWVTcGFuOyIsIi8qIEV4dHJhIHV0aWxpdGllcyBhbmQgbWV0aG9kcyBcclxuICovXHJcbnZhciBUaW1lU3BhbiA9IHJlcXVpcmUoJy4vVGltZVNwYW4nKTtcclxudmFyIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbi8qKiBTaG93cyB0aW1lIGFzIGEgbGFyZ2Ugc3RyaW5nIHdpdGggdW5pdHMgbmFtZXMgZm9yIHZhbHVlcyBkaWZmZXJlbnQgdGhhbiB6ZXJvLlxyXG4gKiovXHJcbmZ1bmN0aW9uIHNtYXJ0VGltZSh0aW1lKSB7XHJcbiAgICB2YXIgciA9IFtdO1xyXG4gICAgaWYgKHRpbWUuZGF5cyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuZGF5cyArICcgZGF5cycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5kYXlzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIGRheScpO1xyXG4gICAgaWYgKHRpbWUuaG91cnMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLmhvdXJzICsgJyBob3VycycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5ob3VycyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBob3VyJyk7XHJcbiAgICBpZiAodGltZS5taW51dGVzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5taW51dGVzICsgJyBtaW51dGVzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLm1pbnV0ZXMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgbWludXRlJyk7XHJcbiAgICBpZiAodGltZS5zZWNvbmRzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5zZWNvbmRzICsgJyBzZWNvbmRzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLnNlY29uZHMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgc2Vjb25kJyk7XHJcbiAgICBpZiAodGltZS5taWxsaXNlY29uZHMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLm1pbGxpc2Vjb25kcyArICcgbWlsbGlzZWNvbmRzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLm1pbGxpc2Vjb25kcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBtaWxsaXNlY29uZCcpO1xyXG4gICAgcmV0dXJuIHIuam9pbignLCAnKTtcclxufVxyXG5cclxuLyoqIFJvdW5kcyBhIHRpbWUgdG8gdGhlIG5lYXJlc3QgMTUgbWludXRlcyBmcmFnbWVudC5cclxuQHJvdW5kVG8gc3BlY2lmeSB0aGUgTEMucm91bmRpbmdUeXBlRW51bSBhYm91dCBob3cgdG8gcm91bmQgdGhlIHRpbWUgKGRvd24sIG5lYXJlc3Qgb3IgdXApXHJcbioqL1xyXG5mdW5jdGlvbiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyKC8qIFRpbWVTcGFuICovdGltZSwgLyogbWF0aFV0aWxzLnJvdW5kaW5nVHlwZUVudW0gKi9yb3VuZFRvKSB7XHJcbiAgICB2YXIgcmVzdEZyb21RdWFydGVyID0gdGltZS50b3RhbEhvdXJzKCkgJSAwLjI1O1xyXG4gICAgdmFyIGhvdXJzID0gdGltZS50b3RhbEhvdXJzKCk7XHJcbiAgICBpZiAocmVzdEZyb21RdWFydGVyID4gMC4wKSB7XHJcbiAgICAgICAgc3dpdGNoIChyb3VuZFRvKSB7XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5Eb3duOlxyXG4gICAgICAgICAgICAgICAgaG91cnMgLT0gcmVzdEZyb21RdWFydGVyO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5OZWFyZXN0OlxyXG4gICAgICAgICAgICAgICAgdmFyIGxpbWl0ID0gMC4yNSAvIDI7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdEZyb21RdWFydGVyID49IGxpbWl0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG91cnMgKz0gKDAuMjUgLSByZXN0RnJvbVF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBob3VycyAtPSByZXN0RnJvbVF1YXJ0ZXI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLlVwOlxyXG4gICAgICAgICAgICAgICAgaG91cnMgKz0gKDAuMjUgLSByZXN0RnJvbVF1YXJ0ZXIpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIFRpbWVTcGFuLmZyb21Ib3Vycyhob3Vycyk7XHJcbn1cclxuXHJcbi8vIEV4dGVuZCBhIGdpdmVuIFRpbWVTcGFuIG9iamVjdCB3aXRoIHRoZSBFeHRyYSBtZXRob2RzXHJcbmZ1bmN0aW9uIHBsdWdJbihUaW1lU3Bhbikge1xyXG4gICAgVGltZVNwYW4ucHJvdG90eXBlLnRvU21hcnRTdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1NtYXJ0U3RyaW5nKCkgeyByZXR1cm4gc21hcnRUaW1lKHRoaXMpOyB9O1xyXG4gICAgVGltZVNwYW4ucHJvdG90eXBlLnJvdW5kVG9RdWFydGVySG91ciA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3JvdW5kVG9RdWFydGVySG91cigpIHsgcmV0dXJuIHJvdW5kVGltZVRvUXVhcnRlckhvdXIuY2FsbCh0aGlzLCBwYXJhbWV0ZXJzKTsgfTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgc21hcnRUaW1lOiBzbWFydFRpbWUsXHJcbiAgICAgICAgcm91bmRUb1F1YXJ0ZXJIb3VyOiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyLFxyXG4gICAgICAgIHBsdWdJbjogcGx1Z0luXHJcbiAgICB9O1xyXG4iLCIvKipcclxuICAgQVBJIGZvciBhdXRvbWF0aWMgY3JlYXRpb24gb2YgbGFiZWxzIGZvciBVSSBTbGlkZXJzIChqcXVlcnktdWkpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgdG9vbHRpcHMgPSByZXF1aXJlKCcuL3Rvb2x0aXBzJyksXHJcbiAgICBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyksXHJcbiAgICBUaW1lU3BhbiA9IHJlcXVpcmUoJy4vVGltZVNwYW4nKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG4vKiogQ3JlYXRlIGxhYmVscyBmb3IgYSBqcXVlcnktdWktc2xpZGVyLlxyXG4qKi9cclxuZnVuY3Rpb24gY3JlYXRlKHNsaWRlcikge1xyXG4gICAgLy8gcmVtb3ZlIG9sZCBvbmVzOlxyXG4gICAgdmFyIG9sZCA9IHNsaWRlci5zaWJsaW5ncygnLnVpLXNsaWRlci1sYWJlbHMnKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXInKS5nZXQoMCkgPT0gc2xpZGVyLmdldCgwKSk7XHJcbiAgICB9KS5yZW1vdmUoKTtcclxuICAgIC8vIENyZWF0ZSBsYWJlbHMgY29udGFpbmVyXHJcbiAgICB2YXIgbGFiZWxzID0gJCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbHNcIi8+Jyk7XHJcbiAgICBsYWJlbHMuZGF0YSgndWktc2xpZGVyJywgc2xpZGVyKTtcclxuXHJcbiAgICAvLyBTZXR1cCBvZiB1c2VmdWwgdmFycyBmb3IgbGFiZWwgY3JlYXRpb25cclxuICAgIHZhciBtYXggPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnbWF4JyksXHJcbiAgICAgICAgbWluID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ21pbicpLFxyXG4gICAgICAgIHN0ZXAgPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnc3RlcCcpLFxyXG4gICAgICAgIHN0ZXBzID0gTWF0aC5mbG9vcigobWF4IC0gbWluKSAvIHN0ZXApO1xyXG5cclxuICAgIC8vIENyZWF0aW5nIGFuZCBwb3NpdGlvbmluZyBsYWJlbHNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IHN0ZXBzOyBpKyspIHtcclxuICAgICAgICAvLyBDcmVhdGUgbGFiZWxcclxuICAgICAgICB2YXIgbGJsID0gJCgnPGRpdiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbFwiPjxzcGFuIGNsYXNzPVwidWktc2xpZGVyLWxhYmVsLXRleHRcIi8+PC9kaXY+Jyk7XHJcbiAgICAgICAgLy8gU2V0dXAgbGFiZWwgd2l0aCBpdHMgdmFsdWVcclxuICAgICAgICB2YXIgbGFiZWxWYWx1ZSA9IG1pbiArIGkgKiBzdGVwO1xyXG4gICAgICAgIGxibC5jaGlsZHJlbignLnVpLXNsaWRlci1sYWJlbC10ZXh0JykudGV4dChsYWJlbFZhbHVlKTtcclxuICAgICAgICBsYmwuZGF0YSgndWktc2xpZGVyLXZhbHVlJywgbGFiZWxWYWx1ZSk7XHJcbiAgICAgICAgLy8gUG9zaXRpb25hdGVcclxuICAgICAgICBwb3NpdGlvbmF0ZShsYmwsIGksIHN0ZXBzKTtcclxuICAgICAgICAvLyBBZGQgdG8gY29udGFpbmVyXHJcbiAgICAgICAgbGFiZWxzLmFwcGVuZChsYmwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEhhbmRsZXIgZm9yIGxhYmVscyBjbGljayB0byBzZWxlY3QgaXRzIHBvc2l0aW9uIHZhbHVlXHJcbiAgICBsYWJlbHMub24oJ2NsaWNrJywgJy51aS1zbGlkZXItbGFiZWwnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHZhbCA9ICQodGhpcykuZGF0YSgndWktc2xpZGVyLXZhbHVlJyksXHJcbiAgICAgICAgICAgIHNsaWRlciA9ICQodGhpcykucGFyZW50KCkuZGF0YSgndWktc2xpZGVyJyk7XHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCB2YWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSW5zZXJ0IGxhYmVscyBhcyBhIHNpYmxpbmcgb2YgdGhlIHNsaWRlciAoY2Fubm90IGJlIGluc2VydGVkIGluc2lkZSlcclxuICAgIHNsaWRlci5hZnRlcihsYWJlbHMpO1xyXG59XHJcblxyXG4vKiogUG9zaXRpb25hdGUgdG8gdGhlIGNvcnJlY3QgcG9zaXRpb24gYW5kIHdpZHRoIGFuIFVJIGxhYmVsIGF0IEBsYmxcclxuZm9yIHRoZSByZXF1aXJlZCBwZXJjZW50YWdlLXdpZHRoIEBzd1xyXG4qKi9cclxuZnVuY3Rpb24gcG9zaXRpb25hdGUobGJsLCBpLCBzdGVwcykge1xyXG4gICAgdmFyIHN3ID0gMTAwIC8gc3RlcHM7XHJcbiAgICB2YXIgbGVmdCA9IGkgKiBzdyAtIHN3ICogMC41LFxyXG4gICAgICAgIHJpZ2h0ID0gMTAwIC0gbGVmdCAtIHN3LFxyXG4gICAgICAgIGFsaWduID0gJ2NlbnRlcic7XHJcbiAgICBpZiAoaSA9PT0gMCkge1xyXG4gICAgICAgIGFsaWduID0gJ2xlZnQnO1xyXG4gICAgICAgIGxlZnQgPSAwO1xyXG4gICAgfSBlbHNlIGlmIChpID09IHN0ZXBzKSB7XHJcbiAgICAgICAgYWxpZ24gPSAncmlnaHQnO1xyXG4gICAgICAgIHJpZ2h0ID0gMDtcclxuICAgIH1cclxuICAgIGxibC5jc3Moe1xyXG4gICAgICAgICd0ZXh0LWFsaWduJzogYWxpZ24sXHJcbiAgICAgICAgbGVmdDogbGVmdCArICclJyxcclxuICAgICAgICByaWdodDogcmlnaHQgKyAnJSdcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSB2aXNpYmlsaXR5IG9mIGxhYmVscyBvZiBhIGpxdWVyeS11aS1zbGlkZXIgZGVwZW5kaW5nIGlmIHRoZXkgZml0IGluIHRoZSBhdmFpbGFibGUgc3BhY2UuXHJcblNsaWRlciBuZWVkcyB0byBiZSB2aXNpYmxlLlxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlKHNsaWRlcikge1xyXG4gICAgLy8gR2V0IGxhYmVscyBmb3Igc2xpZGVyXHJcbiAgICB2YXIgbGFiZWxzX2MgPSBzbGlkZXIuc2libGluZ3MoJy51aS1zbGlkZXItbGFiZWxzJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCQodGhpcykuZGF0YSgndWktc2xpZGVyJykuZ2V0KDApID09IHNsaWRlci5nZXQoMCkpO1xyXG4gICAgfSk7XHJcbiAgICB2YXIgbGFiZWxzID0gbGFiZWxzX2MuZmluZCgnLnVpLXNsaWRlci1sYWJlbC10ZXh0Jyk7XHJcblxyXG4gICAgLy8gQXBwbHkgYXV0b3NpemVcclxuICAgIGlmICgoc2xpZGVyLmRhdGEoJ3NsaWRlci1hdXRvc2l6ZScpIHx8IGZhbHNlKS50b1N0cmluZygpID09ICd0cnVlJylcclxuICAgICAgICBhdXRvc2l6ZShzbGlkZXIsIGxhYmVscyk7XHJcblxyXG4gICAgLy8gR2V0IGFuZCBhcHBseSBsYXlvdXRcclxuICAgIHZhciBsYXlvdXRfbmFtZSA9IHNsaWRlci5kYXRhKCdzbGlkZXItbGFiZWxzLWxheW91dCcpIHx8ICdzdGFuZGFyZCcsXHJcbiAgICAgICAgbGF5b3V0ID0gbGF5b3V0X25hbWUgaW4gbGF5b3V0cyA/IGxheW91dHNbbGF5b3V0X25hbWVdIDogbGF5b3V0cy5zdGFuZGFyZDtcclxuICAgIGxhYmVsc19jLmFkZENsYXNzKCdsYXlvdXQtJyArIGxheW91dF9uYW1lKTtcclxuICAgIGxheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpO1xyXG5cclxuICAgIC8vIFVwZGF0ZSB0b29sdGlwc1xyXG4gICAgdG9vbHRpcHMuY3JlYXRlVG9vbHRpcChsYWJlbHNfYy5jaGlsZHJlbigpLCB7XHJcbiAgICAgICAgdGl0bGU6IGZ1bmN0aW9uICgpIHsgcmV0dXJuICQodGhpcykudGV4dCgpOyB9XHJcbiAgICAgICAgLCBwZXJzaXN0ZW50OiB0cnVlXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gYXV0b3NpemUoc2xpZGVyLCBsYWJlbHMpIHtcclxuICAgIHZhciB0b3RhbF93aWR0aCA9IDA7XHJcbiAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdG90YWxfd2lkdGggKz0gJCh0aGlzKS5vdXRlcldpZHRoKHRydWUpO1xyXG4gICAgfSk7XHJcbiAgICB2YXIgYyA9IHNsaWRlci5jbG9zZXN0KCcudWktc2xpZGVyLWNvbnRhaW5lcicpLFxyXG4gICAgICAgIG1heCA9IHBhcnNlRmxvYXQoYy5jc3MoJ21heC13aWR0aCcpKSxcclxuICAgICAgICBtaW4gPSBwYXJzZUZsb2F0KGMuY3NzKCdtaW4td2lkdGgnKSk7XHJcbiAgICBpZiAobWF4ICE9IE51bWJlci5OYU4gJiYgdG90YWxfd2lkdGggPiBtYXgpXHJcbiAgICAgICAgdG90YWxfd2lkdGggPSBtYXg7XHJcbiAgICBpZiAobWluICE9IE51bWJlci5OYU4gJiYgdG90YWxfd2lkdGggPCBtaW4pXHJcbiAgICAgICAgdG90YWxfd2lkdGggPSBtaW47XHJcbiAgICBjLndpZHRoKHRvdGFsX3dpZHRoKTtcclxufVxyXG5cclxuLyoqIFNldCBvZiBkaWZmZXJlbnQgbGF5b3V0cyBmb3IgbGFiZWxzLCBhbGxvd2luZyBkaWZmZXJlbnQga2luZHMgb2YgXHJcbnBsYWNlbWVudCBhbmQgdmlzdWFsaXphdGlvbiB1c2luZyB0aGUgc2xpZGVyIGRhdGEgb3B0aW9uICdsYWJlbHMtbGF5b3V0Jy5cclxuVXNlZCBieSAndXBkYXRlJywgYWxtb3N0IHRoZSAnc3RhbmRhcmQnIG11c3QgZXhpc3QgYW5kIGNhbiBiZSBpbmNyZWFzZWRcclxuZXh0ZXJuYWxseVxyXG4qKi9cclxudmFyIGxheW91dHMgPSB7fTtcclxuLyoqIFNob3cgdGhlIG1heGltdW0gbnVtYmVyIG9mIGxhYmVscyBpbiBlcXVhbGx5IHNpemVkIGdhcHMgYnV0XHJcbnRoZSBsYXN0IGxhYmVsIHRoYXQgaXMgZW5zdXJlZCB0byBiZSBzaG93ZWQgZXZlbiBpZiBpdCBjcmVhdGVzXHJcbmEgaGlnaGVyIGdhcCB3aXRoIHRoZSBwcmV2aW91cyBvbmUuXHJcbioqL1xyXG5sYXlvdXRzLnN0YW5kYXJkID0gZnVuY3Rpb24gc3RhbmRhcmRfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscykge1xyXG4gICAgLy8gQ2hlY2sgaWYgdGhlcmUgYXJlIG1vcmUgbGFiZWxzIHRoYW4gYXZhaWxhYmxlIHNwYWNlXHJcbiAgICAvLyBHZXQgbWF4aW11bSBsYWJlbCB3aWR0aFxyXG4gICAgdmFyIGl0ZW1fd2lkdGggPSAwO1xyXG4gICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0dyA9ICQodGhpcykub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgICAgICBpZiAodHcgPj0gaXRlbV93aWR0aClcclxuICAgICAgICAgICAgaXRlbV93aWR0aCA9IHR3O1xyXG4gICAgfSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyB3aWR0aCwgaWYgbm90LCBlbGVtZW50IGlzIG5vdCB2aXNpYmxlIGNhbm5vdCBiZSBjb21wdXRlZFxyXG4gICAgaWYgKGl0ZW1fd2lkdGggPiAwKSB7XHJcbiAgICAgICAgLy8gR2V0IHRoZSByZXF1aXJlZCBzdGVwcGluZyBvZiBsYWJlbHNcclxuICAgICAgICB2YXIgbGFiZWxzX3N0ZXAgPSBNYXRoLmNlaWwoaXRlbV93aWR0aCAvIChzbGlkZXIud2lkdGgoKSAvIGxhYmVscy5sZW5ndGgpKSxcclxuICAgICAgICBsYWJlbHNfc3RlcHMgPSBsYWJlbHMubGVuZ3RoIC8gbGFiZWxzX3N0ZXA7XHJcbiAgICAgICAgaWYgKGxhYmVsc19zdGVwID4gMSkge1xyXG4gICAgICAgICAgICAvLyBIaWRlIHRoZSBsYWJlbHMgb24gcG9zaXRpb25zIG91dCBvZiB0aGUgc3RlcFxyXG4gICAgICAgICAgICB2YXIgbmV3aSA9IDAsXHJcbiAgICAgICAgICAgICAgICBsaW1pdCA9IGxhYmVscy5sZW5ndGggLSAxIC0gbGFiZWxzX3N0ZXA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFiZWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbGJsID0gJChsYWJlbHNbaV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKChpICsgMSkgPCBsYWJlbHMubGVuZ3RoICYmIChcclxuICAgICAgICAgICAgICAgICAgICBpICUgbGFiZWxzX3N0ZXAgfHxcclxuICAgICAgICAgICAgICAgICAgICBpID4gbGltaXQpKVxyXG4gICAgICAgICAgICAgICAgICAgIGxibC5oaWRlKCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3dcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gbGJsLnNob3coKS5wYXJlbnQoKS5hZGRDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcG9zaXRpb25hdGUgcGFyZW50XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcG9zaXRpb25hdGUocGFyZW50LCBuZXdpLCBsYWJlbHNfc3RlcHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld2krKztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuLyoqIFNob3cgbGFiZWxzIG51bWJlciB2YWx1ZXMgZm9ybWF0dGVkIGFzIGhvdXJzLCB3aXRoIG9ubHlcclxuaW50ZWdlciBob3VycyBiZWluZyBzaG93ZWQsIHRoZSBtYXhpbXVtIG51bWJlciBvZiBpdC5cclxuKiovXHJcbmxheW91dHMuaG91cnMgPSBmdW5jdGlvbiBob3Vyc19sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzLCBzaG93X2FsbCkge1xyXG4gICAgdmFyIGludExhYmVscyA9IHNsaWRlci5maW5kKCcuaW50ZWdlci1ob3VyJyk7XHJcbiAgICBpZiAoIWludExhYmVscy5sZW5ndGgpIHtcclxuICAgICAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIGlmICghJHQuZGF0YSgnaG91ci1wcm9jZXNzZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHYgPSBwYXJzZUZsb2F0KCR0LnRleHQoKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodiAhPSBOdW1iZXIuTmFOKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdiA9IG11LnJvdW5kVG8odiwgMik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHYgJSAxID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnZGVjaW1hbC1ob3VyJykuaGlkZSgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2ICUgMC41ID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQucGFyZW50KCkuYWRkQ2xhc3MoJ3N0cm9uZycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC50ZXh0KFRpbWVTcGFuLmZyb21Ib3Vycyh2KS50b1Nob3J0U3RyaW5nKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdpbnRlZ2VyLWhvdXInKS5zaG93KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW50TGFiZWxzID0gaW50TGFiZWxzLmFkZCgkdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnaG91ci1wcm9jZXNzZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKHNob3dfYWxsICE9PSB0cnVlKVxyXG4gICAgICAgIGxheW91dHMuc3RhbmRhcmQoc2xpZGVyLCBpbnRMYWJlbHMucGFyZW50KCksIGludExhYmVscyk7XHJcbn07XHJcbmxheW91dHNbJ2FsbC12YWx1ZXMnXSA9IGZ1bmN0aW9uIGFsbF9sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKSB7XHJcbiAgICAvLyBTaG93aW5nIGFsbCBsYWJlbHNcclxuICAgIGxhYmVsc19jLnNob3coKS5hZGRDbGFzcygndmlzaWJsZScpLmNoaWxkcmVuKCkuc2hvdygpO1xyXG59O1xyXG5sYXlvdXRzWydhbGwtaG91cnMnXSA9IGZ1bmN0aW9uIGFsbF9ob3Vyc19sYXlvdXQoKSB7XHJcbiAgICAvLyBKdXN0IHVzZSBob3VycyBsYXlvdXQgYnV0IHNob3dpbmcgYWxsIGludGVnZXIgaG91cnNcclxuICAgIEFycmF5LnByb3RvdHlwZS5wdXNoLmNhbGwoYXJndW1lbnRzLCB0cnVlKTtcclxuICAgIGxheW91dHMuaG91cnMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgY3JlYXRlOiBjcmVhdGUsXHJcbiAgICB1cGRhdGU6IHVwZGF0ZSxcclxuICAgIGxheW91dHM6IGxheW91dHNcclxufTtcclxuIiwiLyogU2V0IG9mIGNvbW1vbiBMQyBjYWxsYmFja3MgZm9yIG1vc3QgQWpheCBvcGVyYXRpb25zXHJcbiAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG52YXIgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgICB2YWxpZGF0aW9uID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIEFLQTogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25FcnJvcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIC8vIElmIGlzIGEgY29ubmVjdGlvbiBhYm9ydGVkLCBubyBzaG93IG1lc3NhZ2UuXHJcbiAgICAvLyByZWFkeVN0YXRlIGRpZmZlcmVudCB0byAnZG9uZTo0JyBtZWFucyBhYm9ydGVkIHRvbywgXHJcbiAgICAvLyBiZWNhdXNlIHdpbmRvdyBiZWluZyBjbG9zZWQvbG9jYXRpb24gY2hhbmdlZFxyXG4gICAgaWYgKG1lc3NhZ2UgPT0gJ2Fib3J0JyB8fCBqeC5yZWFkeVN0YXRlICE9IDQpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIHZhciBtID0gbWVzc2FnZTtcclxuICAgIHZhciBpZnJhbWUgPSBudWxsO1xyXG4gICAgc2l6ZSA9IHBvcHVwLnNpemUoJ2xhcmdlJyk7XHJcbiAgICBzaXplLmhlaWdodCAtPSAzNDtcclxuICAgIGlmIChtID09ICdlcnJvcicpIHtcclxuICAgICAgICBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoangucmVzcG9uc2VUZXh0LCBzaXplKTtcclxuICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgIG0gPSBudWxsO1xyXG4gICAgfSAgZWxzZVxyXG4gICAgICAgIG0gPSBtICsgXCI7IFwiICsgZXg7XHJcblxyXG4gICAgLy8gQmxvY2sgYWxsIHdpbmRvdywgbm90IG9ubHkgY3VycmVudCBlbGVtZW50XHJcbiAgICAkLmJsb2NrVUkoZXJyb3JCbG9jayhtLCBudWxsLCBwb3B1cC5zdHlsZShzaXplKSkpO1xyXG4gICAgaWYgKGlmcmFtZSlcclxuICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICQoJy5ibG9ja1VJIC5jbG9zZS1wb3B1cCcpLmNsaWNrKGZ1bmN0aW9uICgpIHsgJC51bmJsb2NrVUkoKTsgcmV0dXJuIGZhbHNlOyB9KTtcclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkNvbXBsZXRlKCkge1xyXG4gICAgLy8gRGlzYWJsZSBsb2FkaW5nXHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5ndGltZXIgfHwgdGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgLy8gVW5ibG9ja1xyXG4gICAgaWYgKHRoaXMuYXV0b1VuYmxvY2tMb2FkaW5nKSB7XHJcbiAgICAgICAgLy8gRG91YmxlIHVuLWxvY2ssIGJlY2F1c2UgYW55IG9mIHRoZSB0d28gc3lzdGVtcyBjYW4gYmVpbmcgdXNlZDpcclxuICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh0aGlzLmJveCk7XHJcbiAgICAgICAgdGhpcy5ib3gudW5ibG9jaygpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICB2YXIgY3R4ID0gdGhpcztcclxuICAgIC8vIFN1cHBvcnRlZCB0aGUgZ2VuZXJpYyBjdHguZWxlbWVudCBmcm9tIGpxdWVyeS5yZWxvYWRcclxuICAgIGlmIChjdHguZWxlbWVudCkgY3R4LmZvcm0gPSBjdHguZWxlbWVudDtcclxuICAgIC8vIFNwZWNpZmljIHN0dWZmIG9mIGFqYXhGb3Jtc1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgaWYgKCFkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkpIHtcclxuICAgICAgICAvLyBQb3N0ICdtYXliZScgd2FzIHdyb25nLCBodG1sIHdhcyByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgXHJcbiAgICAgICAgLy8gZm9ybSBjb250YWluZXI6IHRoZSBhamF4LWJveC5cclxuXHJcbiAgICAgICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgICAgIC8vIEF2b2lkIGVtcHR5IGRvY3VtZW50cyBiZWluZyBwYXJzZWQgKHJhaXNlIGVycm9yKVxyXG4gICAgICAgIGlmICgkLnRyaW0oZGF0YSkpIHtcclxuICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGEgbWFsZm9ybWVkIGRvY3VtZW50IGlzIHJldHVybmVkOlxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKGRhdGEpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRm9yICdyZWxvYWQnIHN1cHBvcnQsIGNoZWNrIHRvbyB0aGUgY29udGV4dC5tb2RlLCBhbmQgYm90aCByZWxvYWQgb3IgYWpheEZvcm1zIGNoZWNrIGRhdGEgYXR0cmlidXRlIHRvb1xyXG4gICAgICAgIGN0eC5ib3hJc0NvbnRhaW5lciA9IGN0eC5ib3hJc0NvbnRhaW5lcjtcclxuICAgICAgICB2YXIgcmVwbGFjZUJveENvbnRlbnQgPVxyXG4gICAgICAgICAgKGN0eC5vcHRpb25zICYmIGN0eC5vcHRpb25zLm1vZGUgPT09ICdyZXBsYWNlLWNvbnRlbnQnKSB8fFxyXG4gICAgICAgICAgY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JztcclxuXHJcbiAgICAgICAgLy8gU3VwcG9ydCBmb3IgcmVsb2FkLCBhdm9pZGluZyBpbXBvcnRhbnQgYnVncyB3aXRoIHJlbG9hZGluZyBib3hlcyB0aGF0IGNvbnRhaW5zIGZvcm1zOlxyXG4gICAgICAgIC8vIElmIG9wZXJhdGlvbiBpcyBhIHJlbG9hZCwgZG9uJ3QgY2hlY2sgdGhlIGFqYXgtYm94XHJcbiAgICAgICAgdmFyIGpiID0gbmV3aHRtbDtcclxuICAgICAgICBpZiAoIWN0eC5pc1JlbG9hZCkge1xyXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHJldHVybmVkIGVsZW1lbnQgaXMgdGhlIGFqYXgtYm94LCBpZiBub3QsIGZpbmRcclxuICAgICAgICAgIC8vIHRoZSBlbGVtZW50IGluIHRoZSBuZXdodG1sOlxyXG4gICAgICAgICAgamIgPSBuZXdodG1sLmZpbHRlcignLmFqYXgtYm94Jyk7XHJcbiAgICAgICAgICBpZiAoamIubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgICBpZiAoIWN0eC5ib3hJc0NvbnRhaW5lciAmJiAhamIuaXMoJy5hamF4LWJveCcpKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWwuZmluZCgnLmFqYXgtYm94OmVxKDApJyk7XHJcbiAgICAgICAgICBpZiAoIWpiIHx8IGpiLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBhamF4LWJveCwgdXNlIGFsbCBlbGVtZW50IHJldHVybmVkOlxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KVxyXG4gICAgICAgICAgICAvLyBSZXBsYWNlIHRoZSBib3ggY29udGVudCB3aXRoIHRoZSBjb250ZW50IG9mIHRoZSByZXR1cm5lZCBib3hcclxuICAgICAgICAgICAgLy8gb3IgYWxsIGlmIHRoZXJlIGlzIG5vIGFqYXgtYm94IGluIHRoZSByZXN1bHQuXHJcbiAgICAgICAgICAgIGpiID0gamIuaXMoJy5hamF4LWJveCcpID8gamIuY29udGVudHMoKSA6IGpiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcGxhY2VCb3hDb250ZW50KSB7XHJcbiAgICAgICAgICBjdHguYm94LmVtcHR5KCkuYXBwZW5kKGpiKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGN0eC5ib3hJc0NvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAvLyBqYiBpcyBjb250ZW50IG9mIHRoZSBib3ggY29udGFpbmVyOlxyXG4gICAgICAgICAgICBjdHguYm94Lmh0bWwoamIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGJveCBpcyBjb250ZW50IHRoYXQgbXVzdCBiZSByZXBsYWNlZCBieSB0aGUgbmV3IGNvbnRlbnQ6XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVwbGFjZVdpdGgoamIpO1xyXG4gICAgICAgICAgICAvLyBhbmQgcmVmcmVzaCB0aGUgcmVmZXJlbmNlIHRvIGJveCB3aXRoIHRoZSBuZXcgZWxlbWVudFxyXG4gICAgICAgICAgICBjdHguYm94ID0gamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJdCBzdXBwb3J0cyBub3JtYWwgYWpheCBmb3JtcyBhbmQgc3ViZm9ybXMgdGhyb3VnaCBmaWVsZHNldC5hamF4XHJcbiAgICAgICAgaWYgKGN0eC5ib3guaXMoJ2Zvcm0uYWpheCcpIHx8IGN0eC5ib3guaXMoJ2ZpZWxkc2V0LmFqYXgnKSlcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveDtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmb3JtLmFqYXg6ZXEoMCknKTtcclxuICAgICAgICAgIGlmIChjdHguZm9ybS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmaWVsZHNldC5hamF4OmVxKDApJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gTW92ZSBmb2N1cyB0byB0aGUgZXJyb3JzIGFwcGVhcmVkIG9uIHRoZSBwYWdlIChpZiB0aGVyZSBhcmUpOlxyXG4gICAgICAgIHZhciB2YWxpZGF0aW9uU3VtbWFyeSA9IGpiLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRpb25TdW1tYXJ5Lmxlbmd0aClcclxuICAgICAgICAgIG1vdmVGb2N1c1RvKHZhbGlkYXRpb25TdW1tYXJ5KTtcclxuICAgICAgICAvLyBUT0RPOiBJdCBzZWVtcyB0aGF0IGl0IHJldHVybnMgYSBkb2N1bWVudC1mcmFnbWVudCBpbnN0ZWFkIG9mIGEgZWxlbWVudCBhbHJlYWR5IGluIGRvY3VtZW50XHJcbiAgICAgICAgLy8gZm9yIGN0eC5mb3JtIChtYXliZSBqYiB0b28/KSB3aGVuIHVzaW5nICogY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JyAqIFxyXG4gICAgICAgIC8vIChtYXliZSBvbiBvdGhlciBjYXNlcyB0b28/KS5cclxuICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIFtqYiwgY3R4LmZvcm0sIGp4XSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgbWVzc2FnZSwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCBjdHguZm9ybS5kYXRhKCdzdWNjZXNzLXBvc3QtbWVzc2FnZScpIHx8ICdEb25lISc7XHJcbiAgICBjdHguYm94LmJsb2NrKGluZm9CbG9jayhtZXNzYWdlLCB7XHJcbiAgICAgICAgY3NzOiBwb3B1cC5zdHlsZShwb3B1cC5zaXplKCdzbWFsbCcpKVxyXG4gICAgfSkpXHJcbiAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgXHJcbiAgICB9KTtcclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gc2hvd09rR29Qb3B1cChjdHgsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdiBjbGFzcz1cIm9rLWdvLWJveFwiLz4nKTtcclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxzcGFuIGNsYXNzPVwic3VjY2Vzcy1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLlN1Y2Nlc3NNZXNzYWdlKSk7XHJcbiAgICBpZiAoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSlcclxuICAgICAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWRkaXRpb25hbC1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKSk7XHJcblxyXG4gICAgdmFyIG9rQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gb2stYWN0aW9uIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjb2tcIi8+JykuYXBwZW5kKGRhdGEuT2tMYWJlbCk7XHJcbiAgICB2YXIgZ29CdG4gPSAnJztcclxuICAgIGlmIChkYXRhLkdvVVJMICYmIGRhdGEuR29MYWJlbCkge1xyXG4gICAgICAgIGdvQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gZ28tYWN0aW9uXCIvPicpLmF0dHIoJ2hyZWYnLCBkYXRhLkdvVVJMKS5hcHBlbmQoZGF0YS5Hb0xhYmVsKTtcclxuICAgICAgICAvLyBGb3JjaW5nIHRoZSAnY2xvc2UtYWN0aW9uJyBpbiBzdWNoIGEgd2F5IHRoYXQgZm9yIGludGVybmFsIGxpbmtzIHRoZSBwb3B1cCBnZXRzIGNsb3NlZCBpbiBhIHNhZmUgd2F5OlxyXG4gICAgICAgIGdvQnRuLmNsaWNrKGZ1bmN0aW9uICgpIHsgb2tCdG4uY2xpY2soKTsgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFjdGlvbnMgY2xlYXJmaXhcIi8+JykuYXBwZW5kKG9rQnRuKS5hcHBlbmQoZ29CdG4pKTtcclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGN0eC5ib3gsIG51bGwsIHtcclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpIHtcclxuICAgIC8vIElmIGlzIGEgSlNPTiByZXN1bHQ6XHJcbiAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBpZiAoY3R4LmJveClcclxuICAgICAgICAgICAgLy8gQ2xlYW4gcHJldmlvdXMgdmFsaWRhdGlvbiBlcnJvcnNcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY3R4LmJveCk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDA6IGdlbmVyYWwgc3VjY2VzcyBjb2RlLCBzaG93IG1lc3NhZ2Ugc2F5aW5nIHRoYXQgJ2FsbCB3YXMgZmluZSdcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDE6IGRvIGEgcmVkaXJlY3RcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAxKSB7XHJcbiAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDI6IHNob3cgbG9naW4gcG9wdXAgKHdpdGggdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDMpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDM6IHJlbG9hZCBjdXJyZW50IHBhZ2UgY29udGVudCB0byB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICAvLyBOb3RlOiB0byByZWxvYWQgc2FtZSB1cmwgcGFnZSBjb250ZW50LCBpcyBiZXR0ZXIgcmV0dXJuIHRoZSBodG1sIGRpcmVjdGx5IGZyb21cclxuICAgICAgICAgICAgLy8gdGhpcyBhamF4IHNlcnZlciByZXF1ZXN0LlxyXG4gICAgICAgICAgICAvL2NvbnRhaW5lci51bmJsb2NrKCk7IGlzIGJsb2NrZWQgYW5kIHVuYmxvY2tlZCBhZ2FpbiBieSB0aGUgcmVsb2FkIG1ldGhvZDpcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBjdHguYm94LnJlbG9hZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNCkge1xyXG4gICAgICAgICAgICAvLyBTaG93IFN1Y2Nlc3NNZXNzYWdlLCBhdHRhY2hpbmcgYW5kIGV2ZW50IGhhbmRsZXIgdG8gZ28gdG8gUmVkaXJlY3RVUkxcclxuICAgICAgICAgICAgY3R4LmJveC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQuUmVkaXJlY3RVUkwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuU3VjY2Vzc01lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDUpIHtcclxuICAgICAgICAgICAgLy8gQ2hhbmdlIG1haW4tYWN0aW9uIGJ1dHRvbiBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgYnRuID0gY3R4LmZvcm0uZmluZCgnLm1haW4tYWN0aW9uJyk7XHJcbiAgICAgICAgICAgIHZhciBkbXNnID0gYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpO1xyXG4gICAgICAgICAgICBpZiAoIWRtc2cpXHJcbiAgICAgICAgICAgICAgICBidG4uZGF0YSgnZGVmYXVsdC10ZXh0JywgYnRuLnRleHQoKSk7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBkYXRhLlJlc3VsdCB8fCBidG4uZGF0YSgnc3VjY2Vzcy1wb3N0LXRleHQnKSB8fCAnRG9uZSEnO1xyXG4gICAgICAgICAgICBidG4udGV4dChtc2cpO1xyXG4gICAgICAgICAgICAvLyBBZGRpbmcgc3VwcG9ydCB0byByZXNldCBidXR0b24gdGV4dCB0byBkZWZhdWx0IG9uZVxyXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBGaXJzdCBuZXh0IGNoYW5nZXMgaGFwcGVucyBvbiB0aGUgZm9ybTpcclxuICAgICAgICAgICAgJChjdHguZm9ybSkub25lKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgYnRuLnRleHQoYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgZm9yIGN1c3RvbSBoYW5kbGVyc1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA2KSB7XHJcbiAgICAgICAgICAgIC8vIE9rLUdvIGFjdGlvbnMgcG9wdXAgd2l0aCAnc3VjY2VzcycgYW5kICdhZGRpdGlvbmFsJyBtZXNzYWdlcy5cclxuICAgICAgICAgICAgc2hvd09rR29Qb3B1cChjdHgsIGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgNzogc2hvdyBtZXNzYWdlIHNheWluZyBjb250YWluZWQgYXQgZGF0YS5SZXN1bHQuTWVzc2FnZS5cclxuICAgICAgICAgICAgLy8gVGhpcyBjb2RlIGFsbG93IGF0dGFjaCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGluIGRhdGEuUmVzdWx0IHRvIGRpc3Rpbmd1aXNoXHJcbiAgICAgICAgICAgIC8vIGRpZmZlcmVudCByZXN1bHRzIGFsbCBzaG93aW5nIGEgbWVzc2FnZSBidXQgbWF5YmUgbm90IGJlaW5nIGEgc3VjY2VzcyBhdCBhbGxcclxuICAgICAgICAgICAgLy8gYW5kIG1heWJlIGRvaW5nIHNvbWV0aGluZyBtb3JlIGluIHRoZSB0cmlnZ2VyZWQgZXZlbnQgd2l0aCB0aGUgZGF0YSBvYmplY3QuXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0Lk1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA+IDEwMCkge1xyXG4gICAgICAgICAgICAvLyBVc2VyIENvZGU6IHRyaWdnZXIgY3VzdG9tIGV2ZW50IHRvIG1hbmFnZSByZXN1bHRzOlxyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwgangsIGN0eF0pO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIGRhdGEuQ29kZSA8IDBcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYW4gZXJyb3IgY29kZS5cclxuXHJcbiAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0uZ2V0KDApLCBjdHguY2hhbmdlZEVsZW1lbnRzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBcIkVycm9yOiBcIiArIGRhdGEuQ29kZSArIFwiOiBcIiArIEpTT04uc3RyaW5naWZ5KGRhdGEuUmVzdWx0ID8gKGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA6IGRhdGEuUmVzdWx0KSA6ICcnKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbigkKCc8ZGl2Lz4nKS5hcHBlbmQobWVzc2FnZSksIGN0eC5ib3gsIG51bGwsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVycm9yOiBsY09uRXJyb3IsXHJcbiAgICAgICAgc3VjY2VzczogbGNPblN1Y2Nlc3MsXHJcbiAgICAgICAgY29tcGxldGU6IGxjT25Db21wbGV0ZSxcclxuICAgICAgICBkb0pTT05BY3Rpb246IGRvSlNPTkFjdGlvblxyXG4gICAgfTtcclxufSIsIi8qIEZvcm1zIHN1Ym1pdHRlZCB2aWEgQUpBWCAqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICAgIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKTtcclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5ncywgd2lsbCBiZSB1cGRhdGVkIG9uIGluaXQgYnV0IGlzIGFjY2Vzc2VkXHJcbi8vIHRocm91Z2ggY2xvc3VyZSBmcm9tIGFsbCBmdW5jdGlvbnMuXHJcbi8vIE5PVEU6IGlzIHN0YXRpYywgZG9lc24ndCBhbGxvd3MgbXVsdGlwbGUgY29uZmlndXJhdGlvbiwgb25lIGluaXQgY2FsbCByZXBsYWNlIHByZXZpb3VzXHJcbi8vIERlZmF1bHRzOlxyXG52YXIgc2V0dGluZ3MgPSB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IDAsXHJcbiAgICBlbGVtZW50OiBkb2N1bWVudFxyXG59O1xyXG5cclxuLy8gQWRhcHRlZCBjYWxsYmFja3NcclxuZnVuY3Rpb24gYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyKCkge1xyXG4gICAgY2FsbGJhY2tzLmNvbXBsZXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFqYXhFcnJvclBvcHVwSGFuZGxlcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0sIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIENvbW1vbiBsb2dpY1xyXG4gICAgY2FsbGJhY2tzLmVycm9yLmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIoKSB7XHJcbiAgICBjYWxsYmFja3Muc3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4qIEFqYXggRm9ybXMgZ2VuZXJpYyBmdW5jdGlvbi5cclxuKiBSZXN1bHQgZXhwZWN0ZWQgaXM6XHJcbiogLSBodG1sLCBmb3IgdmFsaWRhdGlvbiBlcnJvcnMgZnJvbSBzZXJ2ZXIsIHJlcGxhY2luZyBjdXJyZW50IC5hamF4LWJveCBjb250ZW50XHJcbiogLSBqc29uLCB3aXRoIHN0cnVjdHVyZTogeyBDb2RlOiBpbnRlZ2VyLW51bWJlciwgUmVzdWx0OiBzdHJpbmctb3Itb2JqZWN0IH1cclxuKiAgIENvZGUgbnVtYmVyczpcclxuKiAgICAtIE5lZ2F0aXZlOiBlcnJvcnMsIHdpdGggYSBSZXN1bHQgb2JqZWN0IHsgRXJyb3JNZXNzYWdlOiBzdHJpbmcgfVxyXG4qICAgIC0gWmVybzogc3VjY2VzcyByZXN1bHQsIGl0IHNob3dzIGEgbWVzc2FnZSB3aXRoIGNvbnRlbnQ6IFJlc3VsdCBzdHJpbmcsIGVsc2UgZm9ybSBkYXRhIGF0dHJpYnV0ZSAnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnLCBlbHNlIGEgZ2VuZXJpYyBtZXNzYWdlXHJcbiogICAgLSAxOiBzdWNjZXNzIHJlc3VsdCwgUmVzdWx0IGNvbnRhaW5zIGEgVVJMLCB0aGUgcGFnZSB3aWxsIGJlIHJlZGlyZWN0ZWQgdG8gdGhhdC5cclxuKiAgICAtIE1ham9yIDE6IHN1Y2Nlc3MgcmVzdWx0LCB3aXRoIGN1c3RvbSBoYW5kbGVyIHRocm91Z2h0IHRoZSBmb3JtIGV2ZW50ICdzdWNjZXNzLXBvc3QtbWVzc2FnZScuXHJcbiovXHJcbmZ1bmN0aW9uIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpIHtcclxuICAgIC8vIENvbnRleHQgdmFyLCB1c2VkIGFzIGFqYXggY29udGV4dDpcclxuICAgIHZhciBjdHggPSB7fTtcclxuICAgIC8vIERlZmF1bHQgZGF0YSBmb3IgcmVxdWlyZWQgcGFyYW1zOlxyXG4gICAgY3R4LmZvcm0gPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuZm9ybSA6IG51bGwpIHx8ICQodGhpcyk7XHJcbiAgICBjdHguYm94ID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmJveCA6IG51bGwpIHx8IGN0eC5mb3JtLmNsb3Nlc3QoXCIuYWpheC1ib3hcIik7XHJcbiAgICB2YXIgYWN0aW9uID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmFjdGlvbiA6IG51bGwpIHx8IGN0eC5mb3JtLmF0dHIoJ2FjdGlvbicpIHx8ICcnO1xyXG5cclxuICAgIC8vIFZhbGlkYXRpb25zXHJcbiAgICB2YXIgdmFsaWRhdGlvblBhc3NlZCA9IHRydWU7XHJcbiAgICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3JtcyB0aHJvdWggZmllbGRzZXQuYWpheCwgd2UgbXVzdCBleGVjdXRlIHZhbGlkYXRpb25zIGFuZCB2ZXJpZmljYXRpb25cclxuICAgIC8vIGluIHR3byBzdGVwcyBhbmQgdXNpbmcgdGhlIHJlYWwgZm9ybSB0byBsZXQgdmFsaWRhdGlvbiBtZWNoYW5pc20gd29ya1xyXG4gICAgdmFyIGlzU3ViZm9ybSA9IGN0eC5mb3JtLmlzKCdmaWVsZHNldC5hamF4Jyk7XHJcbiAgICB2YXIgYWN0dWFsRm9ybSA9IGlzU3ViZm9ybSA/IGN0eC5mb3JtLmNsb3Nlc3QoJ2Zvcm0nKSA6IGN0eC5mb3JtLFxyXG4gICAgICBkaXNhYmxlZFN1bW1hcmllcyA9IG5ldyBqUXVlcnkoKTtcclxuXHJcbiAgICAvLyBPbiBzdWJmb3JtIHZhbGlkYXRpb24sIHdlIGRvbid0IHdhbnQgdGhlIGZvcm0gdmFsaWRhdGlvbi1zdW1tYXJ5IGNvbnRyb2xzIHRvIGJlIGFmZmVjdGVkXHJcbiAgICAvLyBieSB0aGlzIHZhbGlkYXRpb24gKHRvIGF2b2lkIHRvIHNob3cgZXJyb3JzIHRoZXJlIHRoYXQgZG9lc24ndCBpbnRlcmVzdCB0byB0aGUgcmVzdCBvZiB0aGUgZm9ybSlcclxuICAgIC8vIFRvIGZ1bGxmaWxsIHRoaXMgcmVxdWlzaXQsIHdlIG5lZWQgdG8gaGlkZSBpdCBmb3IgdGhlIHZhbGlkYXRvciBmb3IgYSB3aGlsZSBhbmQgbGV0IG9ubHkgYWZmZWN0XHJcbiAgICAvLyBhbnkgbG9jYWwgc3VtbWFyeSAoaW5zaWRlIHRoZSBzdWJmb3JtKS5cclxuICAgIGlmIChpc1N1YmZvcm0pIHtcclxuICAgICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBhY3R1YWxGb3JtXHJcbiAgICAgIC5maW5kKCdbZGF0YS12YWxtc2ctc3VtbWFyeT10cnVlXScpXHJcbiAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIE9ubHkgdGhvc2UgdGhhdCBhcmUgb3V0c2lkZSB0aGUgc3ViZm9ybVxyXG4gICAgICAgIHJldHVybiAhJC5jb250YWlucyhjdHguZm9ybS5nZXQoMCksIHRoaXMpO1xyXG4gICAgICB9KVxyXG4gICAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAgIC8vIChpbiBvdGhlciB3b3JkcywgdXNpbmcgJ2RhdGEnIHdpbGwgbm90IHdvcmspXHJcbiAgICAgIC5hdHRyKCdkYXRhLXZhbG1zZy1zdW1tYXJ5JywgJ2ZhbHNlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmlyc3QgYXQgYWxsLCBpZiB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICB2YXIgdmFsb2JqZWN0ID0gYWN0dWFsRm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnMoY3R4LmZvcm0pO1xyXG4gICAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSWYgY3VzdG9tIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgIHZhciBjdXN2YWwgPSBhY3R1YWxGb3JtLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgIGlmIChjdXN2YWwgJiYgY3VzdmFsLnZhbGlkYXRlICYmIGN1c3ZhbC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgICAgdmFsaWRhdGlvblBhc3NlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRvIHN1cHBvcnQgc3ViLWZvcm1zLCB3ZSBtdXN0IGNoZWNrIHRoYXQgdmFsaWRhdGlvbnMgZXJyb3JzIGhhcHBlbmVkIGluc2lkZSB0aGVcclxuICAgIC8vIHN1YmZvcm0gYW5kIG5vdCBpbiBvdGhlciBlbGVtZW50cywgdG8gZG9uJ3Qgc3RvcCBzdWJtaXQgb24gbm90IHJlbGF0ZWQgZXJyb3JzLlxyXG4gICAgLy8gSnVzdCBsb29rIGZvciBtYXJrZWQgZWxlbWVudHM6XHJcbiAgICBpZiAoaXNTdWJmb3JtICYmIGN0eC5mb3JtLmZpbmQoJy5pbnB1dC12YWxpZGF0aW9uLWVycm9yJykubGVuZ3RoKVxyXG4gICAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcblxyXG4gICAgLy8gUmUtZW5hYmxlIGFnYWluIHRoYXQgc3VtbWFyaWVzIHByZXZpb3VzbHkgZGlzYWJsZWRcclxuICAgIGlmIChpc1N1YmZvcm0pIHtcclxuICAgICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgICBkaXNhYmxlZFN1bW1hcmllcy5hdHRyKCdkYXRhLXZhbG1zZy1zdW1tYXJ5JywgJ3RydWUnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVjayB2YWxpZGF0aW9uIHN0YXR1c1xyXG4gICAgaWYgKHZhbGlkYXRpb25QYXNzZWQgPT09IGZhbHNlKSB7XHJcbiAgICAgIC8vIFZhbGlkYXRpb24gZmFpbGVkLCBzdWJtaXQgY2Fubm90IGNvbnRpbnVlLCBvdXQhXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5jaGFuZ2VkRWxlbWVudHMgOiBudWxsKSB8fCBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBldmVudCB0byBhbGxvdyBzY3JpcHRzIHRvIGhvb2sgYWRkaXRpb25hbCB0YXNrcyBiZWZvcmUgc2VuZCBkYXRhXHJcbiAgICBjdHguZm9ybS50cmlnZ2VyKCdwcmVzdWJtaXQnLCBbY3R4XSk7XHJcblxyXG4gICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgIH0sIHNldHRpbmdzLmxvYWRpbmdEZWxheSk7XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICB2YXIgZGF0YSA9IGN0eC5mb3JtLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpO1xyXG5cclxuICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiAoYWN0aW9uKSxcclxuICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgc3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlcixcclxuICAgICAgICBjb21wbGV0ZTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTdG9wIG5vcm1hbCBQT1NUOlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBQdWJsaWMgaW5pdGlhbGl6YXRpb25cclxuZnVuY3Rpb24gaW5pdEFqYXhGb3JtcyhvcHRpb25zKSB7XHJcbiAgICAkLmV4dGVuZCh0cnVlLCBzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgdG8gbWFuYWdlIGFqYXggZm9ybXMgKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ3N1Ym1pdCcsICdmb3JtLmFqYXgnLCBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKTtcclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIGZvciBhIHNwZWNpYWwgYWpheCBmb3JtIGNhc2U6IHN1YmZvcm1zLCB1c2luZyBmaWVsZHNldHMuICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdjbGljaycsICdmaWVsZHNldC5hamF4IC5hamF4LWZpZWxkc2V0LXN1Ym1pdCcsXHJcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG5cclxuICAgICAgICAgIGV2ZW50LmRhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm06IGZvcm0sXHJcbiAgICAgICAgICAgIGJveDogZm9ybS5jbG9zZXN0KCcuYWpheC1ib3gnKSxcclxuICAgICAgICAgICAgYWN0aW9uOiBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGNoYW5nZWRFbGVtZW50czogY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCksIGZvcm0uZmluZCgnOmlucHV0W25hbWVdJykpXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuLyogVU5VU0VEP1xyXG5mdW5jdGlvbiBhamF4Rm9ybU1lc3NhZ2VPbkh0bWxSZXR1cm5lZFdpdGhvdXRWYWxpZGF0aW9uRXJyb3JzKGZvcm0sIG1lc3NhZ2UpIHtcclxuICAgIHZhciAkdCA9ICQoZm9ybSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb3JtIGVycm9ycywgc2hvdyBhIHN1Y2Nlc3NmdWwgbWVzc2FnZVxyXG4gICAgaWYgKCR0LmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAkdC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgICAgICBjc3M6IHBvcHVwU3R5bGUocG9wdXBTaXplKCdzbWFsbCcpKVxyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkgeyAkdC51bmJsb2NrKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbiAgICB9XHJcbn1cclxuKi9cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBpbml0QWpheEZvcm1zLFxyXG4gICAgICAgIG9uU3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgb25FcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfTsiLCIvKiBBdXRvIGNhbGN1bGF0ZSBzdW1tYXJ5IG9uIERPTSB0YWdnaW5nIHdpdGggY2xhc3NlcyB0aGUgZWxlbWVudHMgaW52b2x2ZWQuXHJcbiAqL1xyXG52YXIgbnUgPSByZXF1aXJlKCcuL251bWJlclV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMoKSB7XHJcbiAgICAkKCd0YWJsZS5jYWxjdWxhdGUtaXRlbXMtdG90YWxzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVSb3coKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciB0ciA9ICR0LmNsb3Nlc3QoJ3RyJyk7XHJcbiAgICAgICAgICAgIHZhciBpcCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZScpO1xyXG4gICAgICAgICAgICB2YXIgaXEgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKTtcclxuICAgICAgICAgICAgdmFyIGl0ID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXRvdGFsJyk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKG51LmdldE1vbmV5TnVtYmVyKGlwKSAqIG51LmdldE1vbmV5TnVtYmVyKGlxLCAxKSwgaXQpO1xyXG4gICAgICAgICAgICB0ci50cmlnZ2VyKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQodGhpcykuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXByaWNlLCAuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKS5vbignY2hhbmdlJywgY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChjYWxjdWxhdGVSb3cpO1xyXG4gICAgICAgICQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVTdW1tYXJ5KGZvcmNlKSB7XHJcbiAgICAkKCcuY2FsY3VsYXRlLXN1bW1hcnknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciBzID0gYy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeScpO1xyXG4gICAgICAgIHZhciBkID0gYy5maW5kKCd0YWJsZS5jYWxjdWxhdGUtc3VtbWFyeS1ncm91cCcpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGMoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAsIGZlZSA9IDAsIGR1cmF0aW9uID0gMDtcclxuICAgICAgICAgICAgdmFyIGdyb3VwcyA9IHt9O1xyXG4gICAgICAgICAgICBkLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwVG90YWwgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbENoZWNrZWQgPSAkKHRoaXMpLmlzKCcuY2FsY3VsYXRlLWFsbC1pdGVtcycpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQ2hlY2tlZCB8fCBpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuaXMoJzpjaGVja2VkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBUb3RhbCArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbDplcSgwKScpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eTplcSgwKScpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmVlICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWZlZTplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWR1cmF0aW9uOmVxKDApJykpICogcTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRvdGFsICs9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBncm91cHNbJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwJyldID0gZ3JvdXBUb3RhbDtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGdyb3VwVG90YWwsICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihkdXJhdGlvbiwgJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLmZpbmQoJy5ncm91cC10b3RhbC1kdXJhdGlvbicpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgc3VtbWFyeSB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcih0b3RhbCwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS10b3RhbCcpKTtcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZmVlLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWZlZScpKTtcclxuICAgICAgICAgICAgLy8gQW5kIGV2ZXJ5IGdyb3VwIHRvdGFsIHZhbHVlXHJcbiAgICAgICAgICAgIGZvciAodmFyIGcgaW4gZ3JvdXBzKSB7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cHNbZ10sIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktZ3JvdXAtJyArIGcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuY2hhbmdlKGNhbGMpO1xyXG4gICAgICAgIGQub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIGNhbGMpO1xyXG4gICAgICAgIGNhbGMoKTtcclxuICAgICAgICBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnLCB0cnVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSBkZXRhaWwgb2YgYSBwcmljaW5nIHN1bW1hcnksIG9uZSBkZXRhaWwgbGluZSBwZXIgc2VsZWN0ZWQgaXRlbVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkZCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbCcpLFxyXG4gICAgICAgICAgICAkdCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbC10cGwnKS5jaGlsZHJlbigndHI6ZXEoMCknKSxcclxuICAgICAgICAgICAgJGMgPSAkcy5jbG9zZXN0KCdmb3JtJyksXHJcbiAgICAgICAgICAgICRpdGVtcyA9ICRjLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbScpO1xyXG5cclxuICAgICAgICAvLyBEbyBpdCFcclxuICAgICAgICAvLyBSZW1vdmUgb2xkIGxpbmVzXHJcbiAgICAgICAgJGQuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyBDcmVhdGUgbmV3IG9uZXNcclxuICAgICAgICAkaXRlbXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyICRpID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25jZXB0ID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgcHJpY2UgPSBudS5nZXRNb25leU51bWJlcigkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2U6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgcm93IGFuZCBzZXQgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICB2YXIgJHJvdyA9ICR0LmNsb25lKClcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZGV0YWlsLXRwbCcpXHJcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2RldGFpbCcpO1xyXG4gICAgICAgICAgICAgICAgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY29uY2VwdCcpLnRleHQoY29uY2VwdCk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihwcmljZSwgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIHRhYmxlXHJcbiAgICAgICAgICAgICAgICAkZC5hcHBlbmQoJHJvdyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgIHZhciAkYyA9ICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAvLyBJbml0aWFsIGNhbGN1bGF0aW9uXHJcbiAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCk7XHJcbiAgICAvLyBDYWxjdWxhdGUgb24gcmVsZXZhbnQgZm9ybSBjaGFuZ2VzXHJcbiAgICAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLmNoYW5nZSh1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzIGV2ZW50XHJcbiAgICAkYy5vbignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbn1cclxuXHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvblRhYmxlSXRlbXM6IHNldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyxcclxuICAgICAgICBvblN1bW1hcnk6IHNldHVwQ2FsY3VsYXRlU3VtbWFyeSxcclxuICAgICAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5OiB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5LFxyXG4gICAgICAgIG9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5XHJcbiAgICB9OyIsIi8qIEZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBkb2N1bWVudCAob3IgaW4gQGNvbnRhaW5lcilcclxud2l0aCB0aGUgaHRtbDUgYXR0cmlidXRlICdhdXRvZm9jdXMnIChvciBhbHRlcm5hdGl2ZSBAY3NzU2VsZWN0b3IpLlxyXG5JdCdzIGZpbmUgYXMgYSBwb2x5ZmlsbCBhbmQgZm9yIGFqYXggbG9hZGVkIGNvbnRlbnQgdGhhdCB3aWxsIG5vdFxyXG5nZXQgdGhlIGJyb3dzZXIgc3VwcG9ydCBvZiB0aGUgYXR0cmlidXRlLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZvY3VzKGNvbnRhaW5lciwgY3NzU2VsZWN0b3IpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8IGRvY3VtZW50KTtcclxuICAgIGNvbnRhaW5lci5maW5kKGNzc1NlbGVjdG9yIHx8ICdbYXV0b2ZvY3VzXScpLmZvY3VzKCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0ZvY3VzOyIsIi8qKiBBdXRvLWZpbGwgbWVudSBzdWItaXRlbXMgdXNpbmcgdGFiYmVkIHBhZ2VzIC1vbmx5IHdvcmtzIGZvciBjdXJyZW50IHBhZ2UgaXRlbXMtICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdXRvZmlsbFN1Ym1lbnUoKSB7XHJcbiAgICAkKCcuYXV0b2ZpbGwtc3VibWVudSAuY3VycmVudCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRtZW51ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBzdWJtZW51IGVsZW1lbnRzIGZyb20gdGFicyBtYXJrZWQgd2l0aCBjbGFzcyAnYXV0b2ZpbGwtc3VibWVudS1pdGVtcydcclxuICAgICAgICB2YXIgaXRlbXMgPSAkKCcuYXV0b2ZpbGwtc3VibWVudS1pdGVtcyBsaTpub3QoLnJlbW92YWJsZSknKTtcclxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBpdGVtcywgY3JlYXRlIHRoZSBzdWJtZW51IGNsb25pbmcgaXQhXHJcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHN1Ym1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHBhcmVudG1lbnUuYXBwZW5kKHN1Ym1lbnUpO1xyXG4gICAgICAgICAgICAvLyBDbG9uaW5nIHdpdGhvdXQgZXZlbnRzOlxyXG4gICAgICAgICAgICB2YXIgbmV3aXRlbXMgPSBpdGVtcy5jbG9uZShmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAkKHN1Ym1lbnUpLmFwcGVuZChuZXdpdGVtcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIGF0dGFjaCBldmVudHMgdG8gbWFpbnRhaW4gdGhlIHRhYmJlZCBpbnRlcmZhY2Ugd29ya2luZ1xyXG4gICAgICAgICAgICAvLyBOZXcgSXRlbXMgKGNsb25lZCkgbXVzdCBjaGFuZ2UgdGFiczpcclxuICAgICAgICAgICAgbmV3aXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBpbiB0aGUgb3JpZ2luYWwgaXRlbVxyXG4gICAgICAgICAgICAgICAgJChcImFbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIsIGl0ZW1zKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTdG9wIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gT3JpZ2luYWwgaXRlbXMgbXVzdCBjaGFuZ2UgbWVudTpcclxuICAgICAgICAgICAgaXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbmV3aXRlbXMucGFyZW50KCkuZmluZChcImFcIikucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKS5cclxuICAgICAgICAgICAgICAgIGZpbHRlcihcIipbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gIEF2YWlsYWJpbGl0eUNhbGVuZGFyIE1vZHVsZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4vQ1gvTGNXaWRnZXQnKSxcclxuICBleHRlbmQgPSByZXF1aXJlKCcuL0NYL2V4dGVuZCcpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5ib3VuZHMnKTtcclxuXHJcbi8qKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbkNvbW1vbiBwcml2YXRlIHV0aWxpdGllc1xyXG4tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSoqL1xyXG5cclxuLyotLS0tLS0gQ09OU1RBTlRTIC0tLS0tLS0tLSovXHJcbnZhciBzdGF0dXNUeXBlcyA9IFsndW5hdmFpbGFibGUnLCAnYXZhaWxhYmxlJ107XHJcbi8vIFdlZWsgZGF5cyBuYW1lcyBpbiBlbmdsaXNoIGZvciBpbnRlcm5hbCBzeXN0ZW1cclxuLy8gdXNlOyBOT1QgZm9yIGxvY2FsaXphdGlvbi90cmFuc2xhdGlvbi5cclxudmFyIHN5c3RlbVdlZWtEYXlzID0gW1xyXG4gICdzdW5kYXknLFxyXG4gICdtb25kYXknLFxyXG4gICd0dWVzZGF5JyxcclxuICAnd2VkbmVzZGF5JyxcclxuICAndGh1cnNkYXknLFxyXG4gICdmcmlkYXknLFxyXG4gICdzYXR1cmRheSdcclxuXTtcclxuXHJcbi8qLS0tLS0tLS0tIENPTkZJRyAtIElOU1RBTkNFIC0tLS0tLS0tLS0qL1xyXG52YXIgd2Vla2x5Q2xhc3NlcyA9IHtcclxuICBjYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyJyxcclxuICB3ZWVrbHlDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS13ZWVrbHknLFxyXG4gIGN1cnJlbnRXZWVrOiAnaXMtY3VycmVudFdlZWsnLFxyXG4gIGFjdGlvbnM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1hY3Rpb25zJyxcclxuICBwcmV2QWN0aW9uOiAnQWN0aW9ucy1wcmV2JyxcclxuICBuZXh0QWN0aW9uOiAnQWN0aW9ucy1uZXh0JyxcclxuICBkYXlzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItZGF5cycsXHJcbiAgc2xvdHM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1zbG90cycsXHJcbiAgc2xvdEhvdXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1ob3VyJyxcclxuICBzbG90U3RhdHVzUHJlZml4OiAnaXMtJyxcclxuICBsZWdlbmQ6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQnLFxyXG4gIGxlZ2VuZEF2YWlsYWJsZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZC1hdmFpbGFibGUnLFxyXG4gIGxlZ2VuZFVuYXZhaWxhYmxlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kLXVuYXZhaWxhYmxlJ1xyXG59O1xyXG5cclxudmFyIHdlZWtseVRleHRzID0ge1xyXG4gIGFiYnJXZWVrRGF5czogW1xyXG4gICAgJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCdcclxuICBdLFxyXG4gIHRvZGF5OiAnVG9kYXknLFxyXG4gIC8vIEFsbG93ZWQgc3BlY2lhbCB2YWx1ZXM6IE06bW9udGgsIEQ6ZGF5XHJcbiAgYWJickRhdGVGb3JtYXQ6ICdNL0QnXHJcbn07XHJcblxyXG4vKi0tLS0tLS0tLS0tIFZJRVcgLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5mdW5jdGlvbiBtb3ZlQmluZFJhbmdlSW5EYXlzKHdlZWtseSwgZGF5cykge1xyXG4gIHZhciBcclxuICAgIHN0YXJ0ID0gYWRkRGF5cyh3ZWVrbHkuZGF0ZXNSYW5nZS5zdGFydCwgZGF5cyksXHJcbiAgICBlbmQgPSBhZGREYXlzKHdlZWtseS5kYXRlc1JhbmdlLmVuZCwgZGF5cyksXHJcbiAgICBkYXRlc1JhbmdlID0gZGF0ZXNUb1JhbmdlKHN0YXJ0LCBlbmQpO1xyXG5cclxuICAvLyBDaGVjayBjYWNoZSBiZWZvcmUgdHJ5IHRvIGZldGNoXHJcbiAgdmFyIGluQ2FjaGUgPSB3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcblxyXG4gIGlmIChpbkNhY2hlKSB7XHJcbiAgICAvLyBKdXN0IHNob3cgdGhlIGRhdGFcclxuICAgIHdlZWtseS5iaW5kRGF0YShkYXRlc1JhbmdlKTtcclxuICAgIC8vIFByZWZldGNoIGV4Y2VwdCBpZiB0aGVyZSBpcyBvdGhlciByZXF1ZXN0IGluIGNvdXJzZSAoY2FuIGJlIHRoZSBzYW1lIHByZWZldGNoLFxyXG4gICAgLy8gYnV0IHN0aWxsIGRvbid0IG92ZXJsb2FkIHRoZSBzZXJ2ZXIpXHJcbiAgICBpZiAod2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggPT09IDApXHJcbiAgICAgIHdlZWtseUNoZWNrQW5kUHJlZmV0Y2god2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuICB9IGVsc2Uge1xyXG5cclxuICAgIC8vIFN1cHBvcnQgZm9yIHByZWZldGNoaW5nOlxyXG4gICAgLy8gSXRzIGF2b2lkZWQgaWYgdGhlcmUgYXJlIHJlcXVlc3RzIGluIGNvdXJzZSwgc2luY2VcclxuICAgIC8vIHRoYXQgd2lsbCBiZSBhIHByZWZldGNoIGZvciB0aGUgc2FtZSBkYXRhLlxyXG4gICAgaWYgKHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSB7XHJcbiAgICAgIC8vIFRoZSBsYXN0IHJlcXVlc3QgaW4gdGhlIHBvb2wgKm11c3QqIGJlIHRoZSBsYXN0IGluIGZpbmlzaFxyXG4gICAgICAvLyAobXVzdCBiZSBvbmx5IG9uZSBpZiBhbGwgZ29lcyBmaW5lKTpcclxuICAgICAgdmFyIHJlcXVlc3QgPSB3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzW3dlZWtseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoIC0gMV07XHJcblxyXG4gICAgICAvLyBXYWl0IGZvciB0aGUgZmV0Y2ggdG8gcGVyZm9ybSBhbmQgc2V0cyBsb2FkaW5nIHRvIG5vdGlmeSB1c2VyXHJcbiAgICAgIHdlZWtseS4kZWwuYWRkQ2xhc3Mod2Vla2x5LmNsYXNzZXMuZmV0Y2hpbmcpO1xyXG4gICAgICByZXF1ZXN0LmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIG1vdmVCaW5kUmFuZ2VJbkRheXMod2Vla2x5LCBkYXlzKTtcclxuICAgICAgICB3ZWVrbHkuJGVsLnJlbW92ZUNsYXNzKHdlZWtseS5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmV0Y2ggKGRvd25sb2FkKSB0aGUgZGF0YSBhbmQgc2hvdyBvbiByZWFkeTpcclxuICAgIHdlZWtseVxyXG4gICAgLmZldGNoRGF0YShkYXRlc1RvUXVlcnkoZGF0ZXNSYW5nZSkpXHJcbiAgICAuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHdlZWtseS5iaW5kRGF0YShkYXRlc1JhbmdlKTtcclxuICAgICAgLy8gUHJlZmV0Y2hcclxuICAgICAgd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgZGF0ZXNSYW5nZSkge1xyXG4gIC8vIENoZWNrIGNhY2hlOiBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGRhdGUgaW4gdGhlIHJhbmdlXHJcbiAgLy8gd2l0aG91dCBkYXRhLCB3ZSBzZXQgaW5DYWNoZSBhcyBmYWxzZSBhbmQgZmV0Y2ggdGhlIGRhdGE6XHJcbiAgdmFyIGluQ2FjaGUgPSB0cnVlO1xyXG4gIGVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICBpZiAoIXdlZWtseS5kYXRhLnNsb3RzW2RhdGVrZXldKSB7XHJcbiAgICAgIGluQ2FjaGUgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiBpbkNhY2hlO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgY3VycmVudERhdGVzUmFuZ2UpIHtcclxuICB2YXIgbmV4dERhdGVzUmFuZ2UgPSBkYXRlc1RvUmFuZ2UoXHJcbiAgICBhZGREYXlzKGN1cnJlbnREYXRlc1JhbmdlLnN0YXJ0LCA3KSxcclxuICAgIGFkZERheXMoY3VycmVudERhdGVzUmFuZ2UuZW5kLCA3KVxyXG4gICk7XHJcblxyXG4gIGlmICghd2Vla2x5SXNEYXRhSW5DYWNoZSh3ZWVrbHksIG5leHREYXRlc1JhbmdlKSkge1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHZhciBwcmVmZXRjaFF1ZXJ5ID0gZGF0ZXNUb1F1ZXJ5KG5leHREYXRlc1JhbmdlKTtcclxuICAgIHdlZWtseS5mZXRjaERhdGEocHJlZmV0Y2hRdWVyeSwgbnVsbCwgdHJ1ZSk7XHJcbiAgfVxyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSB2aWV3IGxhYmVscyBmb3IgdGhlIHdlZWstZGF5cyAodGFibGUgaGVhZGVycylcclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZUxhYmVscyhkYXRlc1JhbmdlLCBjYWxlbmRhciwgb3B0aW9ucykge1xyXG4gIHZhciBzdGFydCA9IGRhdGVzUmFuZ2Uuc3RhcnQsXHJcbiAgICAgIGVuZCA9IGRhdGVzUmFuZ2UuZW5kO1xyXG5cclxuICB2YXIgZGF5cyA9IGNhbGVuZGFyLmZpbmQoJy4nICsgb3B0aW9ucy5jbGFzc2VzLmRheXMgKyAnIHRoJyk7XHJcbiAgdmFyIHRvZGF5ID0gZGF0ZUlTTy5kYXRlTG9jYWwobmV3IERhdGUoKSk7XHJcbiAgLy8gRmlyc3QgY2VsbCBpcyBlbXB0eSAoJ3RoZSBjcm9zcyBoZWFkZXJzIGNlbGwnKSwgdGhlbiBvZmZzZXQgaXMgMVxyXG4gIHZhciBvZmZzZXQgPSAxO1xyXG4gIGVhY2hEYXRlSW5SYW5nZShzdGFydCwgZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgdmFyIGNlbGwgPSAkKGRheXMuZ2V0KG9mZnNldCArIGkpKSxcclxuICAgICAgICBzZGF0ZSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUpLFxyXG4gICAgICAgIGxhYmVsID0gc2RhdGU7XHJcblxyXG4gICAgaWYgKHRvZGF5ID09IHNkYXRlKVxyXG4gICAgICBsYWJlbCA9IG9wdGlvbnMudGV4dHMudG9kYXk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGxhYmVsID0gb3B0aW9ucy50ZXh0cy5hYmJyV2Vla0RheXNbZGF0ZS5nZXREYXkoKV0gKyAnICcgKyBmb3JtYXREYXRlKGRhdGUsIG9wdGlvbnMudGV4dHMuYWJickRhdGVGb3JtYXQpO1xyXG5cclxuICAgIGNlbGwudGV4dChsYWJlbCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRDZWxsQnlTbG90KHNsb3RzQ29udGFpbmVyLCBkYXksIHNsb3QpIHtcclxuICBzbG90ID0gZGF0ZUlTTy5wYXJzZShzbG90KTtcclxuICB2YXIgXHJcbiAgICB4ID0gTWF0aC5yb3VuZChzbG90LmdldEhvdXJzKCkpLFxyXG4gIC8vIFRpbWUgZnJhbWVzIChzbG90cykgYXJlIDE1IG1pbnV0ZXMgZGl2aXNpb25zXHJcbiAgICB5ID0gTWF0aC5yb3VuZChzbG90LmdldE1pbnV0ZXMoKSAvIDE1KSxcclxuICAgIHRyID0gc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJzplcSgnICsgTWF0aC5yb3VuZCh4ICogNCArIHkpICsgJyknKTtcclxuXHJcbiAgLy8gU2xvdCBjZWxsIGZvciBvJ2Nsb2NrIGhvdXJzIGlzIGF0IDEgcG9zaXRpb24gb2Zmc2V0XHJcbiAgLy8gYmVjYXVzZSBvZiB0aGUgcm93LWhlYWQgY2VsbFxyXG4gIHZhciBkYXlPZmZzZXQgPSAoeSA9PT0gMCA/IGRheSArIDEgOiBkYXkpO1xyXG4gIHJldHVybiB0ci5jaGlsZHJlbignOmVxKCcgKyBkYXlPZmZzZXQgKyAnKScpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCkge1xyXG4gIHZhciBcclxuICAgIHggPSBjZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChjZWxsKSxcclxuICAgIHkgPSBjZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKSxcclxuICAgIGZ1bGxNaW51dGVzID0geSAqIDE1LFxyXG4gICAgaG91cnMgPSBNYXRoLmZsb29yKGZ1bGxNaW51dGVzIC8gNjApLFxyXG4gICAgbWludXRlcyA9IGZ1bGxNaW51dGVzIC0gKGhvdXJzICogNjApLFxyXG4gICAgc2xvdCA9IG5ldyBEYXRlKCk7XHJcbiAgc2xvdC5zZXRIb3Vycyhob3VycywgbWludXRlcywgMCwgMCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBkYXk6IHgsXHJcbiAgICBzbG90OiBzbG90XHJcbiAgfTtcclxufVxyXG5cclxuLyoqXHJcbk1hcmsgY2FsZW5kYXIgYXMgY3VycmVudC13ZWVrIGFuZCBkaXNhYmxlIHByZXYgYnV0dG9uLFxyXG5vciByZW1vdmUgdGhlIG1hcmsgYW5kIGVuYWJsZSBpdCBpZiBpcyBub3QuXHJcbioqL1xyXG5mdW5jdGlvbiBjaGVja0N1cnJlbnRXZWVrKGNhbGVuZGFyLCBkYXRlLCBvcHRpb25zKSB7XHJcbiAgdmFyIHllcCA9IGlzSW5DdXJyZW50V2VlayhkYXRlKTtcclxuICBjYWxlbmRhci50b2dnbGVDbGFzcyhvcHRpb25zLmNsYXNzZXMuY3VycmVudFdlZWssIHllcCk7XHJcbiAgY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMucHJldkFjdGlvbikucHJvcCgnZGlzYWJsZWQnLCB5ZXApO1xyXG59XHJcblxyXG4vKiogR2V0IHF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBkYXRlIHJhbmdlIHNwZWNpZmllZDpcclxuKiovXHJcbmZ1bmN0aW9uIGRhdGVzVG9RdWVyeShzdGFydCwgZW5kKSB7XHJcbiAgLy8gVW5pcXVlIHBhcmFtIHdpdGggYm90aCBwcm9waWVydGllczpcclxuICBpZiAoc3RhcnQuZW5kKSB7XHJcbiAgICBlbmQgPSBzdGFydC5lbmQ7XHJcbiAgICBzdGFydCA9IHN0YXJ0LnN0YXJ0O1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGRhdGVJU08uZGF0ZUxvY2FsKHN0YXJ0LCB0cnVlKSxcclxuICAgIGVuZDogZGF0ZUlTTy5kYXRlTG9jYWwoZW5kLCB0cnVlKVxyXG4gIH07XHJcbn1cclxuXHJcbi8qKiBQYWNrIHR3byBkYXRlcyBpbiBhIHNpbXBsZSBidXQgdXNlZnVsXHJcbiAgc3RydWN0dXJlIHsgc3RhcnQsIGVuZCB9XHJcbioqL1xyXG5mdW5jdGlvbiBkYXRlc1RvUmFuZ2Uoc3RhcnQsIGVuZCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogc3RhcnQsXHJcbiAgICBlbmQ6IGVuZFxyXG4gIH07XHJcbn1cclxuXHJcbi8qLS0tLS0tLS0tLS0gREFURVMgKGdlbmVyaWMgZnVuY3Rpb25zKSAtLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuZnVuY3Rpb24gY3VycmVudFdlZWsoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBnZXRGaXJzdFdlZWtEYXRlKG5ldyBEYXRlKCkpLFxyXG4gICAgZW5kOiBnZXRMYXN0V2Vla0RhdGUobmV3IERhdGUoKSlcclxuICB9O1xyXG59XHJcbmZ1bmN0aW9uIG5leHRXZWVrKHN0YXJ0LCBlbmQpIHtcclxuICAvLyBVbmlxdWUgcGFyYW0gd2l0aCBib3RoIHByb3BpZXJ0aWVzOlxyXG4gIGlmIChzdGFydC5lbmQpIHtcclxuICAgIGVuZCA9IHN0YXJ0LmVuZDtcclxuICAgIHN0YXJ0ID0gc3RhcnQuc3RhcnQ7XHJcbiAgfVxyXG4gIC8vIE9wdGlvbmFsIGVuZDpcclxuICBlbmQgPSBlbmQgfHwgYWRkRGF5cyhzdGFydCwgNyk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBhZGREYXlzKHN0YXJ0LCA3KSxcclxuICAgIGVuZDogYWRkRGF5cyhlbmQsIDcpXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Rmlyc3RXZWVrRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgLSBkLmdldERheSgpKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TGFzdFdlZWtEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSArICg2IC0gZC5nZXREYXkoKSkpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc0luQ3VycmVudFdlZWsoZGF0ZSkge1xyXG4gIHJldHVybiBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdFdlZWtEYXRlKGRhdGUpKSA9PSBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdFdlZWtEYXRlKG5ldyBEYXRlKCkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWRkRGF5cyhkYXRlLCBkYXlzKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoZC5nZXREYXRlKCkgKyBkYXlzKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5cclxuZnVuY3Rpb24gZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZuKSB7XHJcbiAgaWYgKCFmbi5jYWxsKSB0aHJvdyBuZXcgRXJyb3IoJ2ZuIG11c3QgYmUgYSBmdW5jdGlvbiBvciBcImNhbGxcImFibGUgb2JqZWN0Jyk7XHJcbiAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzdGFydCk7XHJcbiAgdmFyIGkgPSAwLCByZXQ7XHJcbiAgd2hpbGUgKGRhdGUgPD0gZW5kKSB7XHJcbiAgICByZXQgPSBmbi5jYWxsKGZuLCBkYXRlLCBpKTtcclxuICAgIC8vIEFsbG93IGZuIHRvIGNhbmNlbCB0aGUgbG9vcCB3aXRoIHN0cmljdCAnZmFsc2UnXHJcbiAgICBpZiAocmV0ID09PSBmYWxzZSlcclxuICAgICAgYnJlYWs7XHJcbiAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyAxKTtcclxuICAgIGkrKztcclxuICB9XHJcbn1cclxuXHJcbi8qKiBWZXJ5IHNpbXBsZSBjdXN0b20tZm9ybWF0IGZ1bmN0aW9uIHRvIGFsbG93IFxyXG5sMTBuIG9mIHRleHRzLlxyXG5Db3ZlciBjYXNlczpcclxuLSBNIGZvciBtb250aFxyXG4tIEQgZm9yIGRheVxyXG4qKi9cclxuZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlLCBmb3JtYXQpIHtcclxuICB2YXIgcyA9IGZvcm1hdCxcclxuICAgICAgTSA9IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgIEQgPSBkYXRlLmdldERhdGUoKTtcclxuICBzID0gcy5yZXBsYWNlKC9NL2csIE0pO1xyXG4gIHMgPSBzLnJlcGxhY2UoL0QvZywgRCk7XHJcbiAgcmV0dXJuIHM7XHJcbn1cclxuXHJcbi8qKlxyXG4gIE1ha2UgdW5zZWxlY3RhYmxlXHJcbioqL1xyXG52YXIgbWFrZVVuc2VsZWN0YWJsZSA9IChmdW5jdGlvbigpeyBcclxuICB2YXIgZmFsc3lmbiA9IGZ1bmN0aW9uKCl7IHJldHVybiBmYWxzZTsgfTtcclxuICB2YXIgbm9kcmFnU3R5bGUgPSB7XHJcbiAgICAnLXdlYmtpdC10b3VjaC1jYWxsb3V0JzogJ25vbmUnLFxyXG4gICAgJy1raHRtbC11c2VyLWRyYWcnOiAnbm9uZScsXHJcbiAgICAnLXdlYmtpdC11c2VyLWRyYWcnOiAnbm9uZScsXHJcbiAgICAnLWtodG1sLXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy13ZWJraXQtdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLW1vei11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctbXMtdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAndXNlci1zZWxlY3QnOiAnbm9uZSdcclxuICB9O1xyXG4gIHZhciBkcmFnZGVmYXVsdFN0eWxlID0ge1xyXG4gICAgJy13ZWJraXQtdG91Y2gtY2FsbG91dCc6ICdpbmhlcml0JyxcclxuICAgICcta2h0bWwtdXNlci1kcmFnJzogJ2luaGVyaXQnLFxyXG4gICAgJy13ZWJraXQtdXNlci1kcmFnJzogJ2luaGVyaXQnLFxyXG4gICAgJy1raHRtbC11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctd2Via2l0LXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJ3VzZXItc2VsZWN0JzogJ2luaGVyaXQnXHJcbiAgfTtcclxuXHJcbiAgdmFyIG9uID0gZnVuY3Rpb24oZWwpe1xyXG4gICAgZWwgPSAkKGVsKTtcclxuICAgIGVsLm9uKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgLy8kKGRvY3VtZW50KS5vbignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIGVsLmNzcyhub2RyYWdTdHlsZSk7XHJcbiAgfTtcclxuXHJcbiAgdmFyIG9mZiA9IGZ1bmN0aW9uKGVsKXtcclxuICAgIGVsID0gJChlbCk7XHJcbiAgICBlbC5vZmYoJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICAvLyQoZG9jdW1lbnQpLm9mZignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIGVsLmNzcyhkcmFnZGVmYXVsdFN0eWxlKTtcclxuICB9O1xyXG5cclxuICBvbi5vZmYgPSBvZmY7XHJcbiAgcmV0dXJuIG9uO1xyXG59KCkpO1xyXG5cclxuLyoqXHJcbiAgQ3Jvc3MgYnJvd3NlciB3YXkgdG8gdW5zZWxlY3QgY3VycmVudCBzZWxlY3Rpb25cclxuKiovXHJcbmZ1bmN0aW9uIGNsZWFyQ3VycmVudFNlbGVjdGlvbigpIHtcclxuICBpZiAodHlwZW9mICh3aW5kb3cuZ2V0U2VsZWN0aW9uKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAvLyBTdGFuZGFyZFxyXG4gICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xyXG4gIGVsc2UgaWYgKGRvY3VtZW50LnNlbGVjdGlvbiAmJiB0eXBlb2YgKGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSkgPT09ICdmdW5jdGlvbicpXHJcbiAgLy8gSUVcclxuICAgIGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSgpO1xyXG59XHJcblxyXG4vKipcclxuICBXZWVrbHkgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBXZWVrbHkgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IHdlZWtseUNsYXNzZXMsXHJcbnRleHRzOiB3ZWVrbHlUZXh0cyxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuXHJcbi8vIE91ciAndmlldycgd2lsbCBiZSBhIHN1YnNldCBvZiB0aGUgZGF0YSxcclxuLy8gZGVsaW1pdGVkIGJ5IHRoZSBuZXh0IHByb3BlcnR5LCBhIGRhdGVzIHJhbmdlOlxyXG5kYXRlc1JhbmdlOiB7IHN0YXJ0OiBudWxsLCBlbmQ6IG51bGwgfSxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhV2Vla2x5KGRhdGVzUmFuZ2UpIHtcclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICBjaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBkYXRlc1JhbmdlLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgdXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIHRoaXMuJGVsLCB0aGlzKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICBlYWNoRGF0ZUluUmFuZ2UoZGF0ZXNSYW5nZS5zdGFydCwgZGF0ZXNSYW5nZS5lbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICB2YXIgZGF0ZWtleSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG4gICAgdmFyIGRhdGVTbG90cyA9IHRoYXQuZGF0YS5zbG90c1tkYXRla2V5XTtcclxuICAgIGlmIChkYXRlU2xvdHMpIHtcclxuICAgICAgZm9yIChzID0gMDsgcyA8IGRhdGVTbG90cy5sZW5ndGg7IHMrKykge1xyXG4gICAgICAgIHZhciBzbG90ID0gZGF0ZVNsb3RzW3NdO1xyXG4gICAgICAgIHZhciBzbG90Q2VsbCA9IGZpbmRDZWxsQnlTbG90KHNsb3RzQ29udGFpbmVyLCBpLCBzbG90KTtcclxuICAgICAgICAvLyBSZW1vdmUgZGVmYXVsdCBzdGF0dXNcclxuICAgICAgICBzbG90Q2VsbC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICdfJyk7XHJcbiAgICAgICAgLy8gQWRkaW5nIHN0YXR1cyBjbGFzc1xyXG4gICAgICAgIHNsb3RDZWxsLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gV2Vla2x5KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAvLyBSZXVzaW5nIGJhc2UgY29uc3RydWN0b3IgdG9vIGZvciBpbml0aWFsaXppbmc6XHJcbiAgTGNXaWRnZXQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICAvLyBUbyB1c2UgdGhpcyBpbiBjbG9zdXJlczpcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHRoaXMudXNlciA9IHRoaXMuJGVsLmRhdGEoJ2NhbGVuZGFyLXVzZXInKTtcclxuICB0aGlzLnF1ZXJ5ID0ge1xyXG4gICAgdXNlcjogdGhpcy51c2VyLFxyXG4gICAgdHlwZTogJ3dlZWtseSdcclxuICB9O1xyXG5cclxuICAvLyBTdGFydCBmZXRjaGluZyBjdXJyZW50IHdlZWtcclxuICB2YXIgZmlyc3REYXRlcyA9IGN1cnJlbnRXZWVrKCk7XHJcbiAgdGhpcy5mZXRjaERhdGEoZGF0ZXNUb1F1ZXJ5KGZpcnN0RGF0ZXMpKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoZmlyc3REYXRlcyk7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IHdlZWsgaW4gYWR2YW5jZVxyXG4gICAgd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh0aGF0LCBmaXJzdERhdGVzKTtcclxuICB9KTtcclxuICBjaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBmaXJzdERhdGVzLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgLy8gU2V0IGhhbmRsZXJzIGZvciBwcmV2LW5leHQgYWN0aW9uczpcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMucHJldkFjdGlvbiwgZnVuY3Rpb24gcHJldigpIHtcclxuICAgIG1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgLTcpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5uZXh0QWN0aW9uLCBmdW5jdGlvbiBuZXh0KCkge1xyXG4gICAgbW92ZUJpbmRSYW5nZUluRGF5cyh0aGF0LCA3KTtcclxuICB9KTtcclxuXHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuV2Vla2x5LmVuYWJsZUFsbCA9IGZ1bmN0aW9uIG9uKG9wdGlvbnMpIHtcclxuICB2YXIgbGlzdCA9IFtdO1xyXG4gICQoJy4nICsgV2Vla2x5LnByb3RvdHlwZS5jbGFzc2VzLndlZWtseUNhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgV2Vla2x5KHRoaXMsIG9wdGlvbnMpKTtcclxuICB9KTtcclxuICByZXR1cm4gbGlzdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIFdvcmsgaG91cnMgcHJpdmF0ZSB1dGlsc1xyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBFZGl0V29ya0hvdXJzKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICAvLyBTZXQgaGFuZGxlcnMgdG8gc3dpdGNoIHN0YXR1cyBhbmQgdXBkYXRlIGJhY2tlbmQgZGF0YVxyXG4gIC8vIHdoZW4gdGhlIHVzZXIgc2VsZWN0IGNlbGxzXHJcbiAgdmFyIHNsb3RzQ29udGFpbmVyID0gdGhpcy4kZWwuZmluZCgnLicgKyB0aGlzLmNsYXNzZXMuc2xvdHMpO1xyXG5cclxuICBmdW5jdGlvbiB0b2dnbGVDZWxsKGNlbGwpIHtcclxuICAgIC8vIEZpbmQgZGF5IGFuZCB0aW1lIG9mIHRoZSBjZWxsOlxyXG4gICAgdmFyIHNsb3QgPSBmaW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCk7XHJcbiAgICAvLyBHZXQgd2Vlay1kYXkgc2xvdHMgYXJyYXk6XHJcbiAgICB2YXIgd2tzbG90cyA9IHRoYXQuZGF0YS5zbG90c1tzeXN0ZW1XZWVrRGF5c1tzbG90LmRheV1dID0gdGhhdC5kYXRhLnNsb3RzW3N5c3RlbVdlZWtEYXlzW3Nsb3QuZGF5XV0gfHwgW107XHJcbiAgICAvLyBJZiBpdCBoYXMgYWxyZWFkeSB0aGUgZGF0YS5zdGF0dXMsIHRvZ2dsZSB0byB0aGUgZGVmYXVsdFN0YXR1c1xyXG4gICAgLy8gIHZhciBzdGF0dXNDbGFzcyA9IHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyxcclxuICAgIC8vICAgICAgZGVmYXVsdFN0YXR1c0NsYXNzID0gdGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cztcclxuICAgIC8vaWYgKGNlbGwuaGFzQ2xhc3Moc3RhdHVzQ2xhc3NcclxuICAgIC8vIFRvZ2dsZSBmcm9tIHRoZSBhcnJheVxyXG4gICAgdmFyIHN0cnNsb3QgPSBkYXRlSVNPLnRpbWVMb2NhbChzbG90LnNsb3QsIHRydWUpLFxyXG4gICAgICBpc2xvdCA9IHdrc2xvdHMuaW5kZXhPZihzdHJzbG90KTtcclxuICAgIGlmIChpc2xvdCA9PSAtMSlcclxuICAgICAgd2tzbG90cy5wdXNoKHN0cnNsb3QpO1xyXG4gICAgZWxzZVxyXG4gICAgLy9kZWxldGUgd2tzbG90c1tpc2xvdF07XHJcbiAgICAgIHdrc2xvdHMuc3BsaWNlKGlzbG90LCAxKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHRvZ2dsZUNlbGxSYW5nZShmaXJzdENlbGwsIGxhc3RDZWxsKSB7XHJcbiAgICB2YXIgXHJcbiAgICAgIHggPSBmaXJzdENlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGZpcnN0Q2VsbCksXHJcbiAgICAgIHkxID0gZmlyc3RDZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKSxcclxuICAgIC8veDIgPSBsYXN0Q2VsbC5zaWJsaW5ncygndGQnKS5hbmRTZWxmKCkuaW5kZXgobGFzdENlbGwpLFxyXG4gICAgICB5MiA9IGxhc3RDZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKTtcclxuXHJcbiAgICBpZiAoeTEgPiB5Mikge1xyXG4gICAgICB2YXIgeTAgPSB5MTtcclxuICAgICAgeTEgPSB5MjtcclxuICAgICAgeTIgPSB5MDtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciB5ID0geTE7IHkgPD0geTI7IHkrKykge1xyXG4gICAgICB2YXIgY2VsbCA9IGZpcnN0Q2VsbC5jbG9zZXN0KCd0Ym9keScpLmNoaWxkcmVuKCd0cjplcSgnICsgeSArICcpJykuY2hpbGRyZW4oJ3RkOmVxKCcgKyB4ICsgJyknKTtcclxuICAgICAgdG9nZ2xlQ2VsbChjZWxsKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHZhciBkcmFnZ2luZyA9IHtcclxuICAgIGZpcnN0OiBudWxsLFxyXG4gICAgbGFzdDogbnVsbCxcclxuICAgIHNlbGVjdGlvbkxheWVyOiAkKCc8ZGl2IGNsYXNzPVwiU2VsZWN0aW9uTGF5ZXJcIiAvPicpLmFwcGVuZFRvKHRoaXMuJGVsKSxcclxuICAgIGRvbmU6IGZhbHNlXHJcbiAgfTtcclxuICBmdW5jdGlvbiBvZmZzZXRUb1Bvc2l0aW9uKGVsLCBvZmZzZXQpIHtcclxuICAgIHZhciBwYiA9ICQoZWwub2Zmc2V0UGFyZW50KS5ib3VuZHMoKSxcclxuICAgICAgcyA9IHt9O1xyXG5cclxuICAgIHMudG9wID0gb2Zmc2V0LnRvcCAtIHBiLnRvcDtcclxuICAgIHMubGVmdCA9IG9mZnNldC5sZWZ0IC0gcGIubGVmdDtcclxuXHJcbiAgICAvL3MuYm90dG9tID0gcGIudG9wIC0gb2Zmc2V0LmJvdHRvbTtcclxuICAgIC8vcy5yaWdodCA9IG9mZnNldC5sZWZ0IC0gb2Zmc2V0LnJpZ2h0O1xyXG4gICAgcy5oZWlnaHQgPSBvZmZzZXQuYm90dG9tIC0gb2Zmc2V0LnRvcDtcclxuICAgIHMud2lkdGggPSBvZmZzZXQucmlnaHQgLSBvZmZzZXQubGVmdDtcclxuXHJcbiAgICAkKGVsKS5jc3Mocyk7XHJcbiAgICByZXR1cm4gcztcclxuICB9XHJcbiAgZnVuY3Rpb24gdXBkYXRlU2VsZWN0aW9uKGVsKSB7XHJcbiAgICB2YXIgYSA9IGRyYWdnaW5nLmZpcnN0LmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICB2YXIgYiA9IGVsLmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICB2YXIgcyA9IGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcblxyXG4gICAgcy50b3AgPSBhLnRvcCA8IGIudG9wID8gYS50b3AgOiBiLnRvcDtcclxuICAgIHMuYm90dG9tID0gYS5ib3R0b20gPiBiLmJvdHRvbSA/IGEuYm90dG9tIDogYi5ib3R0b207XHJcblxyXG4gICAgb2Zmc2V0VG9Qb3NpdGlvbihkcmFnZ2luZy5zZWxlY3Rpb25MYXllclswXSwgcyk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBmaW5pc2hEcmFnKCkge1xyXG4gICAgaWYgKGRyYWdnaW5nLmZpcnN0ICYmIGRyYWdnaW5nLmxhc3QpIHtcclxuICAgICAgdG9nZ2xlQ2VsbFJhbmdlKGRyYWdnaW5nLmZpcnN0LCBkcmFnZ2luZy5sYXN0KTtcclxuICAgICAgdGhhdC5iaW5kRGF0YSgpO1xyXG5cclxuICAgICAgZHJhZ2dpbmcuZG9uZSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBkcmFnZ2luZy5maXJzdCA9IGRyYWdnaW5nLmxhc3QgPSBudWxsO1xyXG4gICAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuaGlkZSgpO1xyXG4gICAgbWFrZVVuc2VsZWN0YWJsZS5vZmYodGhhdC4kZWwpO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICB0aGlzLiRlbC5maW5kKHNsb3RzQ29udGFpbmVyKS5vbignY2xpY2snLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBEbyBleGNlcHQgYWZ0ZXIgYSBkcmFnZ2luZyBkb25lIGNvbXBsZXRlXHJcbiAgICBpZiAoZHJhZ2dpbmcuZG9uZSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgdG9nZ2xlQ2VsbCgkKHRoaXMpKTtcclxuICAgIHRoYXQuYmluZERhdGEoKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbiAgdGhpcy4kZWwuZmluZChzbG90c0NvbnRhaW5lcilcclxuICAub24oJ21vdXNlZG93bicsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIGRyYWdnaW5nLmRvbmUgPSBmYWxzZTtcclxuICAgIGRyYWdnaW5nLmZpcnN0ID0gJCh0aGlzKTtcclxuICAgIGRyYWdnaW5nLmxhc3QgPSBudWxsO1xyXG4gICAgZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuc2hvdygpO1xyXG5cclxuICAgIG1ha2VVbnNlbGVjdGFibGUodGhhdC4kZWwpO1xyXG4gICAgY2xlYXJDdXJyZW50U2VsZWN0aW9uKCk7XHJcblxyXG4gICAgdmFyIHMgPSBkcmFnZ2luZy5maXJzdC5ib3VuZHMoeyBpbmNsdWRlQm9yZGVyOiB0cnVlIH0pO1xyXG4gICAgb2Zmc2V0VG9Qb3NpdGlvbihkcmFnZ2luZy5zZWxlY3Rpb25MYXllclswXSwgcyk7XHJcblxyXG4gIH0pXHJcbiAgLm9uKCdtb3VzZWVudGVyJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKGRyYWdnaW5nLmZpcnN0KSB7XHJcbiAgICAgIGRyYWdnaW5nLmxhc3QgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgdXBkYXRlU2VsZWN0aW9uKGRyYWdnaW5nLmxhc3QpO1xyXG4gICAgfVxyXG4gIH0pXHJcbiAgLm9uKCdtb3VzZXVwJywgZmluaXNoRHJhZylcclxuICAuZmluZCgndGQnKVxyXG4gIC5hdHRyKCdkcmFnZ2FibGUnLCBmYWxzZSk7XHJcblxyXG4gIC8vIFRoaXMgd2lsbCBub3Qgd29yayB3aXRoIHBvaW50ZXItZXZlbnRzOm5vbmUsIGJ1dCBvbiBvdGhlclxyXG4gIC8vIGNhc2VzIChyZWNlbnRJRSlcclxuICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5vbignbW91c2V1cCcsIGZpbmlzaERyYWcpXHJcbiAgLmF0dHIoJ2RyYWdnYWJsZScsIGZhbHNlKTtcclxuXHJcbn1cclxuXHJcbi8qKlxyXG4gICAgV29yayBob3VycyBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIFdvcmtIb3VycyA9IExjV2lkZ2V0LmV4dGVuZChcclxuLy8gUHJvdG90eXBlXHJcbntcclxuY2xhc3NlczogZXh0ZW5kKHt9LCB3ZWVrbHlDbGFzc2VzLCB7XHJcbiAgd2Vla2x5Q2FsZW5kYXI6IHVuZGVmaW5lZCxcclxuICB3b3JrSG91cnNDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS13b3JrSG91cnMnXHJcbn0pLFxyXG50ZXh0czogd2Vla2x5VGV4dHMsXHJcbnVybDogJy9jYWxlbmRhci9nZXQtYXZhaWxhYmlsaXR5LycsXHJcbmJpbmREYXRhOiBmdW5jdGlvbiBiaW5kRGF0YVdvcmtIb3VycygpIHtcclxuICB2YXIgXHJcbiAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgIHNsb3RzID0gc2xvdHNDb250YWluZXIuZmluZCgndGQnKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gIGZvciAodmFyIHdrID0gMDsgd2sgPCBzeXN0ZW1XZWVrRGF5cy5sZW5ndGg7IHdrKyspIHtcclxuICAgIHZhciBkYXRlU2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbc3lzdGVtV2Vla0RheXNbd2tdXTtcclxuICAgIGlmIChkYXRlU2xvdHMgJiYgZGF0ZVNsb3RzLmxlbmd0aCkge1xyXG4gICAgICBmb3IgKHMgPSAwOyBzIDwgZGF0ZVNsb3RzLmxlbmd0aDsgcysrKSB7XHJcbiAgICAgICAgdmFyIHNsb3QgPSBkYXRlU2xvdHNbc107XHJcbiAgICAgICAgdmFyIHNsb3RDZWxsID0gZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIHdrLCBzbG90KTtcclxuICAgICAgICAvLyBSZW1vdmUgZGVmYXVsdCBzdGF0dXNcclxuICAgICAgICBzbG90Q2VsbC5yZW1vdmVDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5kZWZhdWx0U3RhdHVzIHx8ICdfJyk7XHJcbiAgICAgICAgLy8gQWRkaW5nIHN0YXR1cyBjbGFzc1xyXG4gICAgICAgIHNsb3RDZWxsLmFkZENsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLnN0YXR1cyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxufSxcclxuLy8gQ29uc3RydWN0b3I6XHJcbmZ1bmN0aW9uIFdvcmtIb3VycyhlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgTGNXaWRnZXQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHRoaXMudXNlciA9IHRoaXMuJGVsLmRhdGEoJ2NhbGVuZGFyLXVzZXInKTtcclxuXHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICd3b3JrSG91cnMnXHJcbiAgfTtcclxuXHJcbiAgLy8gRmV0Y2ggdGhlIGRhdGE6IHRoZXJlIGlzIG5vdCBhIG1vcmUgc3BlY2lmaWMgcXVlcnksXHJcbiAgLy8gaXQganVzdCBnZXQgdGhlIGhvdXJzIGZvciBlYWNoIHdlZWstZGF5IChkYXRhXHJcbiAgLy8gc2xvdHMgYXJlIHBlciB3ZWVrLWRheSBpbnN0ZWFkIG9mIHBlciBkYXRlIGNvbXBhcmVkXHJcbiAgLy8gdG8gKndlZWtseSopXHJcbiAgdGhpcy5mZXRjaERhdGEoKS5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgIHRoYXQuYmluZERhdGEoKTtcclxuICB9KTtcclxuXHJcbiAgc2V0dXBFZGl0V29ya0hvdXJzLmNhbGwodGhpcyk7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV29ya2hvdXJzIGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldvcmtIb3Vycy5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdvcmtIb3Vycy5wcm90b3R5cGUuY2xhc3Nlcy53b3JrSG91cnNDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdvcmtIb3Vycyh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAgIFB1YmxpYyBBUEk6XHJcbioqL1xyXG5leHBvcnRzLldlZWtseSA9IFdlZWtseTtcclxuZXhwb3J0cy5Xb3JrSG91cnMgPSBXb3JrSG91cnM7IiwiLyogR2VuZXJpYyBibG9ja1VJIG9wdGlvbnMgc2V0cyAqL1xyXG52YXIgbG9hZGluZ0Jsb2NrID0geyBtZXNzYWdlOiAnPGltZyB3aWR0aD1cIjQ4cHhcIiBoZWlnaHQ9XCI0OHB4XCIgY2xhc3M9XCJsb2FkaW5nLWluZGljYXRvclwiIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nIH07XHJcbnZhciBlcnJvckJsb2NrID0gZnVuY3Rpb24gKGVycm9yLCByZWxvYWQsIHN0eWxlKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGNzczogJC5leHRlbmQoeyBjdXJzb3I6ICdkZWZhdWx0JyB9LCBzdHlsZSB8fCB7fSksXHJcbiAgICAgICAgbWVzc2FnZTogJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT48ZGl2IGNsYXNzPVwiaW5mb1wiPlRoZXJlIHdhcyBhbiBlcnJvcicgK1xyXG4gICAgICAgICAgICAoZXJyb3IgPyAnOiAnICsgZXJyb3IgOiAnJykgK1xyXG4gICAgICAgICAgICAocmVsb2FkID8gJyA8YSBocmVmPVwiamF2YXNjcmlwdDogJyArIHJlbG9hZCArICc7XCI+Q2xpY2sgdG8gcmVsb2FkPC9hPicgOiAnJykgK1xyXG4gICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgfTtcclxufTtcclxudmFyIGluZm9CbG9jayA9IGZ1bmN0aW9uIChtZXNzYWdlLCBvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gJC5leHRlbmQoe1xyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj4nICsgbWVzc2FnZSArICc8L2Rpdj4nXHJcbiAgICAgICAgLyosY3NzOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0qL1xyXG4gICAgICAgICwgb3ZlcmxheUNTUzogeyBjdXJzb3I6ICdkZWZhdWx0JyB9XHJcbiAgICB9LCBvcHRpb25zKTtcclxufTtcclxuXHJcbi8vIE1vZHVsZTpcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBsb2FkaW5nOiBsb2FkaW5nQmxvY2ssXHJcbiAgICAgICAgZXJyb3I6IGVycm9yQmxvY2ssXHJcbiAgICAgICAgaW5mbzogaW5mb0Jsb2NrXHJcbiAgICB9O1xyXG59IiwiLyo9IENoYW5nZXNOb3RpZmljYXRpb24gY2xhc3NcclxuKiB0byBub3RpZnkgdXNlciBhYm91dCBjaGFuZ2VzIGluIGZvcm1zLFxyXG4qIHRhYnMsIHRoYXQgd2lsbCBiZSBsb3N0IGlmIGdvIGF3YXkgZnJvbVxyXG4qIHRoZSBwYWdlLiBJdCBrbm93cyB3aGVuIGEgZm9ybSBpcyBzdWJtaXR0ZWRcclxuKiBhbmQgc2F2ZWQgdG8gZGlzYWJsZSBub3RpZmljYXRpb24sIGFuZCBnaXZlc1xyXG4qIG1ldGhvZHMgZm9yIG90aGVyIHNjcmlwdHMgdG8gbm90aWZ5IGNoYW5nZXNcclxuKiBvciBzYXZpbmcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBnZXRYUGF0aCA9IHJlcXVpcmUoJy4vZ2V0WFBhdGgnKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0ge1xyXG4gICAgY2hhbmdlc0xpc3Q6IHt9LFxyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgICB0YXJnZXQ6IG51bGwsXHJcbiAgICAgICAgZ2VuZXJpY0NoYW5nZVN1cHBvcnQ6IHRydWUsXHJcbiAgICAgICAgZ2VuZXJpY1N1Ym1pdFN1cHBvcnQ6IGZhbHNlLFxyXG4gICAgICAgIGNoYW5nZWRGb3JtQ2xhc3M6ICdoYXMtY2hhbmdlcycsXHJcbiAgICAgICAgY2hhbmdlZEVsZW1lbnRDbGFzczogJ2NoYW5nZWQnLFxyXG4gICAgICAgIG5vdGlmeUNsYXNzOiAnbm90aWZ5LWNoYW5nZXMnXHJcbiAgICB9LFxyXG4gICAgaW5pdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICAvLyBVc2VyIG5vdGlmaWNhdGlvbiB0byBwcmV2ZW50IGxvc3QgY2hhbmdlcyBkb25lXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VzTm90aWZpY2F0aW9uLm5vdGlmeSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0aGlzLmRlZmF1bHRzLCBvcHRpb25zKTtcclxuICAgICAgICBpZiAoIW9wdGlvbnMudGFyZ2V0KVxyXG4gICAgICAgICAgICBvcHRpb25zLnRhcmdldCA9IGRvY3VtZW50O1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNDaGFuZ2VTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignY2hhbmdlJywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCkgOmlucHV0W25hbWVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZSgkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksIHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljU3VibWl0U3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ3N1Ym1pdCcsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUodGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG5vdGlmeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIEFkZCBub3RpZmljYXRpb24gY2xhc3MgdG8gdGhlIGRvY3VtZW50XHJcbiAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMubm90aWZ5Q2xhc3MpO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgY2hhbmdlIGluIHRoZSBwcm9wZXJ0eSBsaXN0IHJldHVybmluZyB0aGUgbWVzc2FnZTpcclxuICAgICAgICBmb3IgKHZhciBjIGluIHRoaXMuY2hhbmdlc0xpc3QpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1aXRNZXNzYWdlIHx8ICh0aGlzLnF1aXRNZXNzYWdlID0gJCgnI2xjcmVzLXF1aXQtd2l0aG91dC1zYXZlJykudGV4dCgpKSB8fCAnJztcclxuICAgIH0sXHJcbiAgICByZWdpc3RlckNoYW5nZTogZnVuY3Rpb24gKGYsIGUpIHtcclxuICAgICAgICBpZiAoIWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICB2YXIgZmwgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdIHx8IFtdO1xyXG4gICAgICAgIGlmICgkLmlzQXJyYXkoZSkpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlckNoYW5nZShmLCBlW2ldKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbiA9IGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAoZSkgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIG4gPSBlLm5hbWU7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHJlYWxseSB0aGVyZSB3YXMgYSBjaGFuZ2UgY2hlY2tpbmcgZGVmYXVsdCBlbGVtZW50IHZhbHVlXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGUuZGVmYXVsdFZhbHVlKSAhPSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLmNoZWNrZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuc2VsZWN0ZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICBlLnZhbHVlID09IGUuZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSB3YXMgbm8gY2hhbmdlLCBubyBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgLy8gYW5kIG1heWJlIGlzIGEgcmVncmVzc2lvbiBmcm9tIGEgY2hhbmdlIGFuZCBub3cgdGhlIG9yaWdpbmFsIHZhbHVlIGFnYWluXHJcbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gcmVtb3ZlIGZyb20gY2hhbmdlcyBsaXN0IGRvaW5nIHJlZ2lzdGVyU2F2ZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlclNhdmUoZiwgW25dKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkKGUpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghKG4gaW4gZmwpKVxyXG4gICAgICAgICAgICBmbC5wdXNoKG4pO1xyXG4gICAgICAgICQoZilcclxuICAgICAgICAuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKVxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudCBuYW1lIGNoYW5nZWQsIGZvcm0gZWxlbWVudCBjaGFuZ2VkICh0aGlzIGNhbiBiZSBudWxsKVxyXG4gICAgICAgIC50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgW2YsIG4sIGVdKTtcclxuICAgIH0sXHJcbiAgICByZWdpc3RlclNhdmU6IGZ1bmN0aW9uIChmLCBlbHMpIHtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHByZXZFbHMgPSAkLmV4dGVuZChbXSwgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pO1xyXG4gICAgICAgIHZhciByID0gdHJ1ZTtcclxuICAgICAgICBpZiAoZWxzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gJC5ncmVwKHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLCBmdW5jdGlvbiAoZWwpIHsgcmV0dXJuICgkLmluQXJyYXkoZWwsIGVscykgPT0gLTEpOyB9KTtcclxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVtb3ZlICdmJyBsaXN0IGlmIGlzIG5vdCBlbXB0eVxyXG4gICAgICAgICAgICByID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0ubGVuZ3RoID09PSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgICAkKGYpLnJlbW92ZUNsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcyk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXTtcclxuICAgICAgICAgICAgLy8gbGluayBlbGVtZW50cyBmcm9tIGVscyB0byBjbGVhbi11cCBpdHMgY2xhc3Nlc1xyXG4gICAgICAgICAgICBlbHMgPSBwcmV2RWxzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnRzIHJlZ2lzdGVyZWQgYXMgc2F2ZSAodGhpcyBjYW4gYmUgbnVsbCksIGFuZCAnZm9ybSBmdWxseSBzYXZlZCcgYXMgdGhpcmQgcGFyYW0gKGJvb2wpXHJcbiAgICAgICAgJChmKS50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsIFtmLCBlbHMsIHJdKTtcclxuICAgICAgICB2YXIgbGNobiA9IHRoaXM7XHJcbiAgICAgICAgaWYgKGVscykgJC5lYWNoKGVscywgZnVuY3Rpb24gKCkgeyAkKCdbbmFtZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHRoaXMpICsgJ1wiXScpLnJlbW92ZUNsYXNzKGxjaG4uZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7IH0pO1xyXG4gICAgICAgIHJldHVybiBwcmV2RWxzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uO1xyXG59IiwiLyogVXRpbGl0eSB0byBjcmVhdGUgaWZyYW1lIHdpdGggaW5qZWN0ZWQgaHRtbC9jb250ZW50IGluc3RlYWQgb2YgVVJMLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVJZnJhbWUoY29udGVudCwgc2l6ZSkge1xyXG4gICAgdmFyICRpZnJhbWUgPSAkKCc8aWZyYW1lIHdpZHRoPVwiJyArIHNpemUud2lkdGggKyAnXCIgaGVpZ2h0PVwiJyArIHNpemUuaGVpZ2h0ICsgJ1wiIHN0eWxlPVwiYm9yZGVyOm5vbmU7XCI+PC9pZnJhbWU+Jyk7XHJcbiAgICB2YXIgaWZyYW1lID0gJGlmcmFtZS5nZXQoMCk7XHJcbiAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgcmVhZHlcclxuICAgIHZhciBpZnJhbWVsb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmcmFtZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gVXNpbmcgaWZyYW1lbG9hZGVkIHRvIGF2b2lkIGluZmluaXRlIGxvb3BzXHJcbiAgICAgICAgaWYgKCFpZnJhbWVsb2FkZWQpIHtcclxuICAgICAgICAgICAgaWZyYW1lbG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gJGlmcmFtZTtcclxufTtcclxuXHJcbi8qIFB1dHMgZnVsbCBodG1sIGluc2lkZSB0aGUgaWZyYW1lIGVsZW1lbnQgcGFzc2VkIGluIGEgc2VjdXJlIGFuZCBjb21wbGlhbnQgbW9kZSAqL1xyXG5mdW5jdGlvbiBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgaHRtbCkge1xyXG4gICAgLy8gcHV0IGFqYXggZGF0YSBpbnNpZGUgaWZyYW1lIHJlcGxhY2luZyBhbGwgdGhlaXIgaHRtbCBpbiBzZWN1cmUgXHJcbiAgICAvLyBjb21wbGlhbnQgbW9kZSAoJC5odG1sIGRvbid0IHdvcmtzIHRvIGluamVjdCA8aHRtbD48aGVhZD4gY29udGVudClcclxuXHJcbiAgICAvKiBkb2N1bWVudCBBUEkgdmVyc2lvbiAocHJvYmxlbXMgd2l0aCBJRSwgZG9uJ3QgZXhlY3V0ZSBpZnJhbWUtaHRtbCBzY3JpcHRzKSAqL1xyXG4gICAgLyp2YXIgaWZyYW1lRG9jID1cclxuICAgIC8vIFczQyBjb21wbGlhbnQ6IG5zLCBmaXJlZm94LWdlY2tvLCBjaHJvbWUvc2FmYXJpLXdlYmtpdCwgb3BlcmEsIGllOVxyXG4gICAgaWZyYW1lLmNvbnRlbnREb2N1bWVudCB8fFxyXG4gICAgLy8gb2xkIElFICg1LjUrKVxyXG4gICAgKGlmcmFtZS5jb250ZW50V2luZG93ID8gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgOiBudWxsKSB8fFxyXG4gICAgLy8gZmFsbGJhY2sgKHZlcnkgb2xkIElFPylcclxuICAgIGRvY3VtZW50LmZyYW1lc1tpZnJhbWUuaWRdLmRvY3VtZW50O1xyXG4gICAgaWZyYW1lRG9jLm9wZW4oKTtcclxuICAgIGlmcmFtZURvYy53cml0ZShodG1sKTtcclxuICAgIGlmcmFtZURvYy5jbG9zZSgpOyovXHJcblxyXG4gICAgLyogamF2YXNjcmlwdCBVUkkgdmVyc2lvbiAod29ya3MgZmluZSBldmVyeXdoZXJlISkgKi9cclxuICAgIGlmcmFtZS5jb250ZW50V2luZG93LmNvbnRlbnRzID0gaHRtbDtcclxuICAgIGlmcmFtZS5zcmMgPSAnamF2YXNjcmlwdDp3aW5kb3dbXCJjb250ZW50c1wiXSc7XHJcblxyXG4gICAgLy8gQWJvdXQgdGhpcyB0ZWNobmlxdWUsIHRoaXMgaHR0cDovL3NwYXJlY3ljbGVzLndvcmRwcmVzcy5jb20vMjAxMi8wMy8wOC9pbmplY3QtY29udGVudC1pbnRvLWEtbmV3LWlmcmFtZS9cclxufVxyXG5cclxuIiwiLyogQ1JVREwgSGVscGVyICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxudmFyIGdldFRleHQgPSByZXF1aXJlKCcuL2dldFRleHQnKTtcclxudmFyIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5cclxuZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MgPSB7XHJcbiAgZWZmZWN0czoge1xyXG4gICAgJ3Nob3ctdmlld2VyJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sXHJcbiAgICAnaGlkZS12aWV3ZXInOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSxcclxuICAgICdzaG93LWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LCAvLyB0aGUgc2FtZSBhcyBqcXVlcnktdWkgeyBlZmZlY3Q6ICdzbGlkZScsIGR1cmF0aW9uOiAnc2xvdycsIGRpcmVjdGlvbjogJ2Rvd24nIH1cclxuICAgICdoaWRlLWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9XHJcbiAgfSxcclxuICBldmVudHM6IHtcclxuICAgICdlZGl0LWVuZHMnOiAnY3J1ZGwtZWRpdC1lbmRzJyxcclxuICAgICdlZGl0LXN0YXJ0cyc6ICdjcnVkbC1lZGl0LXN0YXJ0cycsXHJcbiAgICAnZWRpdG9yLXJlYWR5JzogJ2NydWRsLWVkaXRvci1yZWFkeScsXHJcbiAgICAnZWRpdG9yLXNob3dlZCc6ICdjcnVkbC1lZGl0b3Itc2hvd2VkJyxcclxuICAgICdjcmVhdGUnOiAnY3J1ZGwtY3JlYXRlJyxcclxuICAgICd1cGRhdGUnOiAnY3J1ZGwtdXBkYXRlJyxcclxuICAgICdkZWxldGUnOiAnY3J1ZGwtZGVsZXRlJ1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiBzZXR1cENydWRsKG9uU3VjY2Vzcywgb25FcnJvciwgb25Db21wbGV0ZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICBvbjogZnVuY3Rpb24gb24oc2VsZWN0b3IsIHNldHRpbmdzKSB7XHJcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgJy5jcnVkbCc7XHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IHtcclxuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXHJcbiAgICAgICAgZWxlbWVudHM6ICQoc2VsZWN0b3IpXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIEV4dGVuZGluZyBkZWZhdWx0IHNldHRpbmdzIHdpdGggcHJvdmlkZWQgb25lcyxcclxuICAgICAgLy8gYnV0IHNvbWUgY2FuIGJlIHR3ZWFrIG91dHNpZGUgdG9vLlxyXG4gICAgICBpbnN0YW5jZS5zZXR0aW5ncyA9ICQuZXh0ZW5kKHRydWUsIGV4cG9ydHMuZGVmYXVsdFNldHRpbmdzLCBzZXR0aW5ncyk7XHJcblxyXG4gICAgICBpbnN0YW5jZS5lbGVtZW50cy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3J1ZGwgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmIChjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nKSA9PT0gdHJ1ZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBkY3R4ID0gY3J1ZGwuZGF0YSgnY3J1ZGwtY29udGV4dCcpIHx8ICcnO1xyXG4gICAgICAgIHZhciB2d3IgPSBjcnVkbC5maW5kKCcuY3J1ZGwtdmlld2VyJyk7XHJcbiAgICAgICAgdmFyIGR0ciA9IGNydWRsLmZpbmQoJy5jcnVkbC1lZGl0b3InKTtcclxuICAgICAgICB2YXIgaWlkcGFyID0gY3J1ZGwuZGF0YSgnY3J1ZGwtaXRlbS1pZC1wYXJhbWV0ZXInKSB8fCAnSXRlbUlEJztcclxuICAgICAgICB2YXIgZm9ybXBhcnMgPSB7IGFjdGlvbjogJ2NyZWF0ZScgfTtcclxuICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gMDtcclxuICAgICAgICB2YXIgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRFeHRyYVF1ZXJ5KGVsKSB7XHJcbiAgICAgICAgICAvLyBHZXQgZXh0cmEgcXVlcnkgb2YgdGhlIGVsZW1lbnQsIGlmIGFueTpcclxuICAgICAgICAgIHZhciB4cSA9IGVsLmRhdGEoJ2NydWRsLWV4dHJhLXF1ZXJ5JykgfHwgJyc7XHJcbiAgICAgICAgICBpZiAoeHEpIHhxID0gJyYnICsgeHE7XHJcbiAgICAgICAgICAvLyBJdGVyYXRlIGFsbCBwYXJlbnRzIGluY2x1ZGluZyB0aGUgJ2NydWRsJyBlbGVtZW50IChwYXJlbnRzVW50aWwgZXhjbHVkZXMgdGhlIGZpcnN0IGVsZW1lbnQgZ2l2ZW4sXHJcbiAgICAgICAgICAvLyBiZWNhdXNlIG9mIHRoYXQgd2UgZ2V0IGl0cyBwYXJlbnQoKSlcclxuICAgICAgICAgIC8vIEZvciBhbnkgb2YgdGhlbSB3aXRoIGFuIGV4dHJhLXF1ZXJ5LCBhcHBlbmQgaXQ6XHJcbiAgICAgICAgICBlbC5wYXJlbnRzVW50aWwoY3J1ZGwucGFyZW50KCksICdbZGF0YS1jcnVkbC1leHRyYS1xdWVyeV0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHggPSAkKHRoaXMpLmRhdGEoJ2NydWRsLWV4dHJhLXF1ZXJ5Jyk7XHJcbiAgICAgICAgICAgIGlmICh4KSB4cSArPSAnJicgKyB4O1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByZXR1cm4geHE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjcnVkbC5maW5kKCcuY3J1ZGwtY3JlYXRlJykuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IDA7XHJcbiAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAnY3JlYXRlJztcclxuICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICBkdHIucmVsb2FkKHtcclxuICAgICAgICAgICAgdXJsOiBmdW5jdGlvbiAodXJsLCBkZWZhdWx0VXJsKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRVcmwgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgZHRyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctZWRpdG9yJ10pXHJcbiAgICAgICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIFtkdHJdKTtcclxuICAgICAgICAgICAgICAgIGR0ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgLy8gSGlkZSB2aWV3ZXIgd2hlbiBpbiBlZGl0b3I6XHJcbiAgICAgICAgICB2d3IueGhpZGUoaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS12aWV3ZXInXSk7XHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddKVxyXG4gICAgICAgICAgLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzLmNyZWF0ZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB2d3JcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC11cGRhdGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGl0ZW0gPSAkdC5jbG9zZXN0KCcuY3J1ZGwtaXRlbScpO1xyXG4gICAgICAgICAgdmFyIGl0ZW1pZCA9IGl0ZW0uZGF0YSgnY3J1ZGwtaXRlbS1pZCcpO1xyXG4gICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IGl0ZW1pZDtcclxuICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICd1cGRhdGUnO1xyXG4gICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuICAgICAgICAgIGR0ci5yZWxvYWQoe1xyXG4gICAgICAgICAgICB1cmw6IGZ1bmN0aW9uICh1cmwsIGRlZmF1bHRVcmwpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdFVybCArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBkdHIueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy1lZGl0b3InXSlcclxuICAgICAgICAgICAgICAucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1zaG93ZWQnXSwgW2R0cl0pO1xyXG4gICAgICAgICAgICAgICAgZHRyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBIaWRlIHZpZXdlciB3aGVuIGluIGVkaXRvcjpcclxuICAgICAgICAgIHZ3ci54aGlkZShpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLXZpZXdlciddKTtcclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10pXHJcbiAgICAgICAgICAudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHMudXBkYXRlKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC1kZWxldGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGl0ZW0gPSAkdC5jbG9zZXN0KCcuY3J1ZGwtaXRlbScpO1xyXG4gICAgICAgICAgdmFyIGl0ZW1pZCA9IGl0ZW0uZGF0YSgnY3J1ZGwtaXRlbS1pZCcpO1xyXG5cclxuICAgICAgICAgIGlmIChjb25maXJtKGdldFRleHQoJ2NvbmZpcm0tZGVsZXRlLWNydWRsLWl0ZW0tbWVzc2FnZTonICsgZGN0eCkpKSB7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJzxkaXY+JyArIGdldFRleHQoJ2RlbGV0ZS1jcnVkbC1pdGVtLWxvYWRpbmctbWVzc2FnZTonICsgZGN0eCkgKyAnPC9kaXY+JywgaXRlbSk7XHJcbiAgICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICdkZWxldGUnO1xyXG4gICAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgIHVybDogZHRyLmF0dHIoJ2RhdGEtc291cmNlLXVybCcpICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cSxcclxuICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCc8ZGl2PicgKyBkYXRhLlJlc3VsdCArICc8L2Rpdj4nLCBpdGVtLCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2FibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmZhZGVPdXQoJ3Nsb3cnLCBmdW5jdGlvbiAoKSB7IGl0ZW0ucmVtb3ZlKCk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgb25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAgICAgICAgICAgICBvbkVycm9yKGp4LCBtZXNzYWdlLCBleCk7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZShpdGVtKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGNvbXBsZXRlOiBvbkNvbXBsZXRlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2RlbGV0ZSddKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZpbmlzaEVkaXQoKSB7XHJcbiAgICAgICAgICBmdW5jdGlvbiBvbmNvbXBsZXRlKGFub3RoZXJPbkNvbXBsZXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgLy8gU2hvdyBhZ2FpbiB0aGUgVmlld2VyXHJcbiAgICAgICAgICAgICAgLy92d3Iuc2xpZGVEb3duKCdzbG93Jyk7XHJcbiAgICAgICAgICAgICAgaWYgKCF2d3IuaXMoJzp2aXNpYmxlJykpXHJcbiAgICAgICAgICAgICAgICB2d3IueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSk7XHJcbiAgICAgICAgICAgICAgLy8gTWFyayB0aGUgZm9ybSBhcyB1bmNoYW5nZWQgdG8gYXZvaWQgcGVyc2lzdGluZyB3YXJuaW5nc1xyXG4gICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGR0ci5maW5kKCdmb3JtJykuZ2V0KDApKTtcclxuICAgICAgICAgICAgICAvLyBBdm9pZCBjYWNoZWQgY29udGVudCBvbiB0aGUgRWRpdG9yXHJcbiAgICAgICAgICAgICAgZHRyLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgLy8gU2Nyb2xsIHRvIGNydWRsXHJcbiAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oY3J1ZGwsIHsgbWFyZ2luVG9wOiA1MCwgZHVyYXRpb246IDIwMCB9KTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBjYWxsYmFjazpcclxuICAgICAgICAgICAgICBpZiAodHlwZW9mIChhbm90aGVyT25Db21wbGV0ZSkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICBhbm90aGVyT25Db21wbGV0ZS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIFdlIG5lZWQgYSBjdXN0b20gY29tcGxldGUgY2FsbGJhY2ssIGJ1dCB0byBub3QgcmVwbGFjZSB0aGUgdXNlciBjYWxsYmFjaywgd2VcclxuICAgICAgICAgIC8vIGNsb25lIGZpcnN0IHRoZSBzZXR0aW5ncyBhbmQgdGhlbiBhcHBseSBvdXIgY2FsbGJhY2sgdGhhdCBpbnRlcm5hbGx5IHdpbGwgY2FsbFxyXG4gICAgICAgICAgLy8gdGhlIHVzZXIgY2FsbGJhY2sgcHJvcGVybHkgKGlmIGFueSlcclxuICAgICAgICAgIHZhciB3aXRoY2FsbGJhY2sgPSAkLmV4dGVuZCh0cnVlLCB7fSwgaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS1lZGl0b3InXSk7XHJcbiAgICAgICAgICB3aXRoY2FsbGJhY2suY29tcGxldGUgPSBvbmNvbXBsZXRlKHdpdGhjYWxsYmFjay5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAvLyBIaWRpbmcgZWRpdG9yOlxyXG4gICAgICAgICAgZHRyLnhoaWRlKHdpdGhjYWxsYmFjayk7XHJcblxyXG4gICAgICAgICAgLy8gTWFyayBmb3JtIGFzIHNhdmVkIHRvIHJlbW92ZSB0aGUgJ2hhcy1jaGFuZ2VzJyBtYXJrXHJcbiAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcblxyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10pO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGR0clxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLWNhbmNlbCcsIGZpbmlzaEVkaXQpXHJcbiAgICAgICAgLm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgJy5hamF4LWJveCcsIGZpbmlzaEVkaXQpXHJcbiAgICAgICAgLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCAnZm9ybSwgZmllbGRzZXQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCB8fCBkYXRhLkNvZGUgPT0gNSB8fCBkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBTaG93IHZpZXdlciBhbmQgcmVsb2FkIGxpc3Q6XHJcbiAgICAgICAgICAgIHZ3ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LXZpZXdlciddKVxyXG4gICAgICAgICAgICAuZmluZCgnLmNydWRsLWxpc3QnKS5yZWxvYWQoeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gQSBzbWFsbCBkZWxheSB0byBsZXQgdXNlciB0byBzZWUgdGhlIG5ldyBtZXNzYWdlIG9uIGJ1dHRvbiBiZWZvcmVcclxuICAgICAgICAgIC8vIGhpZGUgaXQgKGJlY2F1c2UgaXMgaW5zaWRlIHRoZSBlZGl0b3IpXHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDUpXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmluaXNoRWRpdCwgMTUwMCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0sZmllbGRzZXQnLCBmdW5jdGlvbiAoamIsIGZvcm0sIGp4KSB7XHJcbiAgICAgICAgICAvLyBFbWl0IHRoZSAnZWRpdG9yLXJlYWR5JyBldmVudCBvbiBlZGl0b3IgSHRtbCBiZWluZyByZXBsYWNlZFxyXG4gICAgICAgICAgLy8gKGZpcnN0IGxvYWQgb3IgbmV4dCBsb2FkcyBiZWNhdXNlIG9mIHNlcnZlci1zaWRlIHZhbGlkYXRpb24gZXJyb3JzKVxyXG4gICAgICAgICAgLy8gdG8gYWxsb3cgbGlzdGVuZXJzIHRvIGRvIGFueSB3b3JrIG92ZXIgaXRzIChuZXcpIERPTSBlbGVtZW50cy5cclxuICAgICAgICAgIC8vIFRoZSBzZWNvbmQgY3VzdG9tIHBhcmFtZXRlciBwYXNzZWQgbWVhbnMgaXMgbWVhbiB0b1xyXG4gICAgICAgICAgLy8gZGlzdGluZ3Vpc2ggdGhlIGZpcnN0IHRpbWUgY29udGVudCBsb2FkIGFuZCBzdWNjZXNzaXZlIHVwZGF0ZXMgKGR1ZSB0byB2YWxpZGF0aW9uIGVycm9ycykuXHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIFtkdHIsIGVkaXRvckluaXRpYWxMb2FkXSk7XHJcblxyXG4gICAgICAgICAgLy8gTmV4dCB0aW1lczpcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNydWRsLmRhdGEoJ19fY3J1ZGxfaW5pdGlhbGl6ZWRfXycsIHRydWUpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG4iLCIvKipcclxuICBUaGlzIG1vZHVsZSBoYXMgdXRpbGl0aWVzIHRvIGNvbnZlcnQgYSBEYXRlIG9iamVjdCBpbnRvXHJcbiAgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gZm9sbG93aW5nIElTTy04NjAxIHNwZWNpZmljYXRpb24uXHJcbiAgXHJcbiAgSU5DT01QTEVURSBCVVQgVVNFRlVMLlxyXG4gIFxyXG4gIFN0YW5kYXJkIHJlZmVycyB0byBmb3JtYXQgdmFyaWF0aW9uczpcclxuICAtIGJhc2ljOiBtaW5pbXVtIHNlcGFyYXRvcnNcclxuICAtIGV4dGVuZGVkOiBhbGwgc2VwYXJhdG9ycywgbW9yZSByZWFkYWJsZVxyXG4gIEJ5IGRlZmF1bHQsIGFsbCBtZXRob2RzIHByaW50cyB0aGUgYmFzaWMgZm9ybWF0LFxyXG4gIGV4Y2VwdHMgdGhlIHBhcmFtZXRlciAnZXh0ZW5kZWQnIGlzIHNldCB0byB0cnVlXHJcblxyXG4gIFRPRE86XHJcbiAgLSBUWjogYWxsb3cgZm9yIFRpbWUgWm9uZSBzdWZmaXhlcyAocGFyc2UgYWxsb3cgaXQgYW5kIFxyXG4gICAgZGV0ZWN0IFVUQyBidXQgZG8gbm90aGluZyB3aXRoIGFueSB0aW1lIHpvbmUgb2Zmc2V0IGRldGVjdGVkKVxyXG4gIC0gRnJhY3Rpb25zIG9mIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMuZGF0ZVVUQyA9IGZ1bmN0aW9uIGRhdGVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgbSA9IChkYXRlLmdldFVUQ01vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICBkID0gZGF0ZS5nZXRVVENEYXRlKCkudG9TdHJpbmcoKSxcclxuICAgICAgeSA9IGRhdGUuZ2V0VVRDRnVsbFllYXIoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG4gIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgZCA9ICcwJyArIGQ7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiB5ICsgJy0nICsgbSArICctJyArIGQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIHkgKyBtICsgZDtcclxufTtcclxuXHJcbmV4cG9ydHMuZGF0ZUxvY2FsID0gZnVuY3Rpb24gZGF0ZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIG0gPSAoZGF0ZS5nZXRNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgZCA9IGRhdGUuZ2V0RGF0ZSgpLnRvU3RyaW5nKCksXHJcbiAgICAgIHkgPSBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG4gIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgZCA9ICcwJyArIGQ7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiB5ICsgJy0nICsgbSArICctJyArIGQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIHkgKyBtICsgZDtcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzLCBtaW51dGVzIGFuZCBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLnRpbWVMb2NhbCA9IGZ1bmN0aW9uIHRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBzID0gZGF0ZS5nZXRTZWNvbmRzKCkudG9TdHJpbmcoKSxcclxuICAgICAgaG0gPSBleHBvcnRzLnNob3J0VGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKHMubGVuZ3RoID09IDEpXHJcbiAgICBzID0gJzAnICsgcztcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGhtICsgJzonICsgcztcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaG0gKyBzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMsIG1pbnV0ZXMgYW5kIHNlY29uZHMgVVRDXHJcbioqL1xyXG5leHBvcnRzLnRpbWVVVEMgPSBmdW5jdGlvbiB0aW1lVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIHMgPSBkYXRlLmdldFVUQ1NlY29uZHMoKS50b1N0cmluZygpLFxyXG4gICAgICBobSA9IGV4cG9ydHMuc2hvcnRUaW1lVVRDKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKHMubGVuZ3RoID09IDEpXHJcbiAgICBzID0gJzAnICsgcztcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGhtICsgJzonICsgcztcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaG0gKyBzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMgYW5kIG1pbnV0ZXNcclxuKiovXHJcbmV4cG9ydHMuc2hvcnRUaW1lTG9jYWwgPSBmdW5jdGlvbiBzaG9ydFRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBoID0gZGF0ZS5nZXRIb3VycygpLnRvU3RyaW5nKCksXHJcbiAgICAgIG0gPSBkYXRlLmdldE1pbnV0ZXMoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAoaC5sZW5ndGggPT0gMSlcclxuICAgIGggPSAnMCcgKyBoO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBoICsgJzonICsgbTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaCArIG07XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycyBhbmQgbWludXRlcyBVVENcclxuKiovXHJcbmV4cG9ydHMuc2hvcnRUaW1lVVRDID0gZnVuY3Rpb24gc2hvcnRUaW1lVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIGggPSBkYXRlLmdldFVUQ0hvdXJzKCkudG9TdHJpbmcoKSxcclxuICAgICAgbSA9IGRhdGUuZ2V0VVRDTWludXRlcygpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChoLmxlbmd0aCA9PSAxKVxyXG4gICAgaCA9ICcwJyArIGg7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGggKyAnOicgKyBtO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBoICsgbTtcclxufTtcclxuXHJcbi8qKlxyXG4gIFRPRE86IEhvdXJzLCBtaW51dGVzLCBzZWNvbmRzIGFuZCBmcmFjdGlvbnMgb2Ygc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy5sb25nVGltZUxvY2FsID0gZnVuY3Rpb24gbG9uZ1RpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIC8vVE9ET1xyXG59O1xyXG5cclxuLyoqXHJcbiAgVVRDIERhdGUgYW5kIFRpbWUgc2VwYXJhdGVkIGJ5IFQuXHJcbiAgU3RhbmRhcmQgYWxsb3dzIG9taXQgdGhlIHNlcGFyYXRvciBhcyBleGNlcHRpb25hbCwgYm90aCBwYXJ0cyBhZ3JlZW1lbnQsIGNhc2VzO1xyXG4gIGNhbiBiZSBkb25lIHBhc3NpbmcgdHJ1ZSBhcyBvZiBvbWl0U2VwYXJhdG9yIHBhcmFtZXRlciwgYnkgZGVmYXVsdCBmYWxzZS5cclxuKiovXHJcbmV4cG9ydHMuZGF0ZXRpbWVMb2NhbCA9IGZ1bmN0aW9uIGRhdGV0aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQsIG9taXRTZXBhcmF0b3IpIHtcclxuICB2YXIgZCA9IGV4cG9ydHMuZGF0ZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSxcclxuICAgICAgdCA9IGV4cG9ydHMudGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKG9taXRTZXBhcmF0b3IpXHJcbiAgICByZXR1cm4gZCArIHQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGQgKyAnVCcgKyB0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgTG9jYWwgRGF0ZSBhbmQgVGltZSBzZXBhcmF0ZWQgYnkgVC5cclxuICBTdGFuZGFyZCBhbGxvd3Mgb21pdCB0aGUgc2VwYXJhdG9yIGFzIGV4Y2VwdGlvbmFsLCBib3RoIHBhcnRzIGFncmVlbWVudCwgY2FzZXM7XHJcbiAgY2FuIGJlIGRvbmUgcGFzc2luZyB0cnVlIGFzIG9mIG9taXRTZXBhcmF0b3IgcGFyYW1ldGVyLCBieSBkZWZhdWx0IGZhbHNlLlxyXG4qKi9cclxuZXhwb3J0cy5kYXRldGltZVVUQyA9IGZ1bmN0aW9uIGRhdGV0aW1lVVRDKGRhdGUsIGV4dGVuZGVkLCBvbWl0U2VwYXJhdG9yKSB7XHJcbiAgdmFyIGQgPSBleHBvcnRzLmRhdGVVVEMoZGF0ZSwgZXh0ZW5kZWQpLFxyXG4gICAgICB0ID0gZXhwb3J0cy50aW1lVVRDKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKG9taXRTZXBhcmF0b3IpXHJcbiAgICByZXR1cm4gZCArIHQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGQgKyAnVCcgKyB0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgUGFyc2UgYSBzdHJpbmcgaW50byBhIERhdGUgb2JqZWN0IGlmIGlzIGEgdmFsaWQgSVNPLTg2MDEgZm9ybWF0LlxyXG4gIFBhcnNlIHNpbmdsZSBkYXRlLCBzaW5nbGUgdGltZSBvciBkYXRlLXRpbWUgZm9ybWF0cy5cclxuICBJTVBPUlRBTlQ6IEl0IGRvZXMgTk9UIGNvbnZlcnQgYmV0d2VlbiB0aGUgZGF0ZXN0ciBUaW1lWm9uZSBhbmQgdGhlXHJcbiAgbG9jYWwgVGltZVpvbmUgKGVpdGhlciBpdCBhbGxvd3MgZGF0ZXN0ciB0byBpbmNsdWRlZCBUaW1lWm9uZSBpbmZvcm1hdGlvbilcclxuICBUT0RPOiBPcHRpb25hbCBUIHNlcGFyYXRvciBpcyBub3QgYWxsb3dlZC5cclxuICBUT0RPOiBNaWxsaXNlY29uZHMvZnJhY3Rpb25zIG9mIHNlY29uZHMgbm90IHN1cHBvcnRlZFxyXG4qKi9cclxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIHBhcnNlKGRhdGVzdHIpIHtcclxuICB2YXIgZHQgPSBkYXRlc3RyLnNwbGl0KCdUJyksXHJcbiAgICBkYXRlID0gZHRbMF0sXHJcbiAgICB0aW1lID0gZHQubGVuZ3RoID09IDIgPyBkdFsxXSA6IG51bGw7XHJcblxyXG4gIGlmIChkdC5sZW5ndGggPiAyKVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IGZvcm1hdFwiKTtcclxuXHJcbiAgLy8gQ2hlY2sgaWYgZGF0ZSBjb250YWlucyBhIHRpbWU7XHJcbiAgLy8gYmVjYXVzZSBtYXliZSBkYXRlc3RyIGlzIG9ubHkgdGhlIHRpbWUgcGFydFxyXG4gIGlmICgvOnxeXFxkezQsNn1bXlxcLV0oXFwuXFxkKik/KD86WnxbK1xcLV0uKik/JC8udGVzdChkYXRlKSkge1xyXG4gICAgdGltZSA9IGRhdGU7XHJcbiAgICBkYXRlID0gbnVsbDtcclxuICB9XHJcblxyXG4gIHZhciB5LCBtLCBkLCBoLCBtbSwgcywgdHosIHV0YztcclxuXHJcbiAgaWYgKGRhdGUpIHtcclxuICAgIHZhciBkcGFydHMgPSAvKFxcZHs0fSlcXC0/KFxcZHsyfSlcXC0/KFxcZHsyfSkvLmV4ZWMoZGF0ZSk7XHJcbiAgICBpZiAoIWRwYXJ0cylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IGRhdGUgZm9ybWF0XCIpO1xyXG5cclxuICAgIHkgPSBkcGFydHNbMV07XHJcbiAgICBtID0gZHBhcnRzWzJdO1xyXG4gICAgZCA9IGRwYXJ0c1szXTtcclxuICB9XHJcblxyXG4gIGlmICh0aW1lKSB7XHJcbiAgICB2YXIgdHBhcnRzID0gLyhcXGR7Mn0pOj8oXFxkezJ9KSg/Ojo/KFxcZHsyfSkpPyhafFsrXFwtXS4qKT8vLmV4ZWModGltZSk7XHJcbiAgICBpZiAoIXRwYXJ0cylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IHRpbWUgZm9ybWF0XCIpO1xyXG5cclxuICAgIGggPSB0cGFydHNbMV07XHJcbiAgICBtbSA9IHRwYXJ0c1syXTtcclxuICAgIHMgPSB0cGFydHMubGVuZ3RoID4gMyA/IHRwYXJ0c1szXSA6IG51bGw7XHJcbiAgICB0eiA9IHRwYXJ0cy5sZW5ndGggPiA0ID8gdHBhcnRzWzRdIDogbnVsbDtcclxuICAgIC8vIERldGVjdHMgaWYgaXMgYSB0aW1lIGluIFVUQzpcclxuICAgIHV0YyA9IC9eWiQvaS50ZXN0KHR6KTtcclxuICB9XHJcblxyXG4gIC8vIFZhciB0byBob2xkIHRoZSBwYXJzZWQgdmFsdWUsIHdlIHN0YXJ0IHdpdGggdG9kYXksXHJcbiAgLy8gdGhhdCB3aWxsIGZpbGwgdGhlIG1pc3NpbmcgcGFydHNcclxuICB2YXIgcGFyc2VkRGF0ZSA9IG5ldyBEYXRlKCk7XHJcblxyXG4gIGlmIChkYXRlKSB7XHJcbiAgICAvLyBVcGRhdGluZyB0aGUgZGF0ZSBvYmplY3Qgd2l0aCBlYWNoIHllYXIsIG1vbnRoIGFuZCBkYXRlL2RheSBkZXRlY3RlZDpcclxuICAgIGlmICh1dGMpXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0VVRDRnVsbFllYXIoeSwgbSwgZCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0RnVsbFllYXIoeSwgbSwgZCk7XHJcbiAgfVxyXG5cclxuICBpZiAodGltZSkge1xyXG4gICAgaWYgKHV0YylcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRVVENIb3VycyhoLCBtbSwgcyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0SG91cnMoaCwgbW0sIHMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHBhcnNlZERhdGU7XHJcbn07IiwiLyogRGF0ZSBwaWNrZXIgaW5pdGlhbGl6YXRpb24gYW5kIHVzZVxyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cERhdGVQaWNrZXIoKSB7XHJcbiAgICAvLyBEYXRlIFBpY2tlclxyXG4gICAgJC5kYXRlcGlja2VyLnNldERlZmF1bHRzKCQuZGF0ZXBpY2tlci5yZWdpb25hbFskKCdodG1sJykuYXR0cignbGFuZycpXSk7XHJcbiAgICAkKCcuZGF0ZS1waWNrJywgZG9jdW1lbnQpLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIHNob3dBbmltOiAnYmxpbmQnXHJcbiAgICB9KTtcclxuICAgIGFwcGx5RGF0ZVBpY2tlcigpO1xyXG59XHJcbmZ1bmN0aW9uIGFwcGx5RGF0ZVBpY2tlcihlbGVtZW50KSB7XHJcbiAgICAkKFwiLmRhdGUtcGlja1wiLCBlbGVtZW50IHx8IGRvY3VtZW50KVxyXG4gICAgLy8udmFsKG5ldyBEYXRlKCkuYXNTdHJpbmcoJC5kYXRlcGlja2VyLl9kZWZhdWx0cy5kYXRlRm9ybWF0KSlcclxuICAgIC5kYXRlcGlja2VyKHtcclxuICAgICAgICBzaG93QW5pbTogXCJibGluZFwiXHJcbiAgICB9KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdDogc2V0dXBEYXRlUGlja2VyLFxyXG4gICAgICAgIGFwcGx5OiBhcHBseURhdGVQaWNrZXJcclxuICAgIH07XHJcbiIsIi8qIEZvcm1hdCBhIGRhdGUgYXMgWVlZWS1NTS1ERCBpbiBVVEMgZm9yIHNhdmUgdXNcclxuICAgIHRvIGludGVyY2hhbmdlIHdpdGggb3RoZXIgbW9kdWxlcyBvciBhcHBzLlxyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKSB7XHJcbiAgICB2YXIgbSA9IChkYXRlLmdldFVUQ01vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICAgIGQgPSBkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpO1xyXG4gICAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICAgICAgbSA9ICcwJyArIG07XHJcbiAgICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgICAgICBkID0gJzAnICsgZDtcclxuICAgIHJldHVybiBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKSArICctJyArIG0gKyAnLScgKyBkO1xyXG59OyIsIi8qKiBBbiBpMThuIHV0aWxpdHksIGdldCBhIHRyYW5zbGF0aW9uIHRleHQgYnkgbG9va2luZyBmb3Igc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlIGh0bWxcclxud2l0aCB0aGUgbmFtZSBnaXZlbiBhcyBmaXJzdCBwYXJhbWVudGVyIGFuZCBhcHBseWluZyB0aGUgZ2l2ZW4gdmFsdWVzIG9uIHNlY29uZCBhbmQgXHJcbm90aGVyIHBhcmFtZXRlcnMuXHJcbiAgICBUT0RPOiBSRS1JTVBMRU1FTlQgbm90IHVzaW5nIGpRdWVyeSBuZWxzZSBET00gZWxlbWVudHMsIG9yIGFsbW9zdCBub3QgZWxlbWVudHMgaW5zaWRlIGJvZHlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG5mdW5jdGlvbiBnZXRUZXh0KCkge1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAvLyBHZXQga2V5IGFuZCB0cmFuc2xhdGUgaXRcclxuICAgIHZhciBmb3JtYXR0ZWQgPSBhcmdzWzBdO1xyXG4gICAgdmFyIHRleHQgPSAkKCcjbGNyZXMtJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoZm9ybWF0dGVkKSkudGV4dCgpO1xyXG4gICAgaWYgKHRleHQpXHJcbiAgICAgICAgZm9ybWF0dGVkID0gdGV4dDtcclxuICAgIC8vIEFwcGx5IGZvcm1hdCB0byB0aGUgdGV4dCB3aXRoIGFkZGl0aW9uYWwgcGFyYW1ldGVyc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7JyArIGkgKyAnXFxcXH0nLCAnZ2knKTtcclxuICAgICAgICBmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZShyZWdleHAsIGFyZ3NbaSArIDFdKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmb3JtYXR0ZWQ7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0VGV4dDsiLCIvKiogUmV0dXJucyB0aGUgcGF0aCB0byB0aGUgZ2l2ZW4gZWxlbWVudCBpbiBYUGF0aCBjb252ZW50aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gZ2V0WFBhdGgoZWxlbWVudCkge1xyXG4gICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5pZClcclxuICAgICAgICByZXR1cm4gJy8vKltAaWQ9XCInICsgZWxlbWVudC5pZCArICdcIl0nO1xyXG4gICAgdmFyIHhwYXRoID0gJyc7XHJcbiAgICBmb3IgKDsgZWxlbWVudCAmJiBlbGVtZW50Lm5vZGVUeXBlID09IDE7IGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICB2YXIgaWQgPSAkKGVsZW1lbnQucGFyZW50Tm9kZSkuY2hpbGRyZW4oZWxlbWVudC50YWdOYW1lKS5pbmRleChlbGVtZW50KSArIDE7XHJcbiAgICAgICAgaWQgPSAoaWQgPiAxID8gJ1snICsgaWQgKyAnXScgOiAnJyk7XHJcbiAgICAgICAgeHBhdGggPSAnLycgKyBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSArIGlkICsgeHBhdGg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geHBhdGg7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0WFBhdGg7XHJcbiIsIi8vIEl0IGV4ZWN1dGVzIHRoZSBnaXZlbiAncmVhZHknIGZ1bmN0aW9uIGFzIHBhcmFtZXRlciB3aGVuXHJcbi8vIG1hcCBlbnZpcm9ubWVudCBpcyByZWFkeSAod2hlbiBnb29nbGUgbWFwcyBhcGkgYW5kIHNjcmlwdCBpc1xyXG4vLyBsb2FkZWQgYW5kIHJlYWR5IHRvIHVzZSwgb3IgaW5tZWRpYXRlbHkgaWYgaXMgYWxyZWFkeSBsb2FkZWQpLlxyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XHJcblxyXG4vLyBQcml2YXRlIHN0YXRpYyBjb2xsZWN0aW9uIG9mIGNhbGxiYWNrcyByZWdpc3RlcmVkXHJcbnZhciBzdGFjayA9IFtdO1xyXG5cclxudmFyIGdvb2dsZU1hcFJlYWR5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnb29nbGVNYXBSZWFkeShyZWFkeSkge1xyXG4gIHN0YWNrLnB1c2gocmVhZHkpO1xyXG5cclxuICBpZiAoZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSlcclxuICAgIHJlYWR5KCk7XHJcbiAgZWxzZSBpZiAoIWdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZykge1xyXG4gICAgZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nID0gdHJ1ZTtcclxuICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgc2NyaXB0czogW1wiaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9qc2FwaVwiXSxcclxuICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHsgcmV0dXJuICEhd2luZG93Lmdvb2dsZTsgfSxcclxuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBnb29nbGUubG9hZChcIm1hcHNcIiwgXCIzLjEwXCIsIHsgb3RoZXJfcGFyYW1zOiBcInNlbnNvcj1mYWxzZVwiLCBcImNhbGxiYWNrXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzUmVhZHkgPSB0cnVlO1xyXG4gICAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBzdGFja1tpXSgpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFV0aWxpdHkgdG8gZm9yY2UgdGhlIHJlZnJlc2ggb2YgbWFwcyB0aGF0IHNvbHZlIHRoZSBwcm9ibGVtIHdpdGggYmFkLXNpemVkIG1hcCBhcmVhXHJcbmdvb2dsZU1hcFJlYWR5LnJlZnJlc2hNYXAgPSBmdW5jdGlvbiByZWZyZXNoTWFwcyhtYXApIHtcclxuICBnb29nbGVNYXBSZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyKG1hcCwgXCJyZXNpemVcIik7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qIEdVSUQgR2VuZXJhdG9yXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGd1aWRHZW5lcmF0b3IoKSB7XHJcbiAgICB2YXIgUzQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDApIHwgMCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gKFM0KCkgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgUzQoKSArIFM0KCkpO1xyXG59OyIsIi8qKlxyXG4gICAgR2VuZXJpYyBzY3JpcHQgZm9yIGZpZWxkc2V0cyB3aXRoIGNsYXNzIC5oYXMtY29uZmlybSwgYWxsb3dpbmcgc2hvd1xyXG4gICAgdGhlIGNvbnRlbnQgb25seSBpZiB0aGUgbWFpbiBjb25maXJtIGZpZWxkcyBoYXZlICd5ZXMnIHNlbGVjdGVkLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBkZWZhdWx0U2VsZWN0b3IgPSAnZmllbGRzZXQuaGFzLWNvbmZpcm0gPiAuY29uZmlybSBpbnB1dCc7XHJcblxyXG5mdW5jdGlvbiBvbmNoYW5nZSgpIHtcclxuICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgIHZhciBmcyA9IHQuY2xvc2VzdCgnZmllbGRzZXQnKTtcclxuICAgIGlmICh0LmlzKCc6Y2hlY2tlZCcpKVxyXG4gICAgICAgIGlmICh0LnZhbCgpID09ICd5ZXMnIHx8IHQudmFsKCkgPT0gJ1RydWUnKVxyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcygnY29uZmlybWVkLW5vJykuYWRkQ2xhc3MoJ2NvbmZpcm1lZC15ZXMnKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKCdjb25maXJtZWQteWVzJykuYWRkQ2xhc3MoJ2NvbmZpcm1lZC1ubycpO1xyXG59XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IGRlZmF1bHRTZWxlY3RvcjtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgc2VsZWN0b3IsIG9uY2hhbmdlKTtcclxuICAgIC8vIFBlcmZvcm1zIGZpcnN0IGNoZWNrOlxyXG4gICAgJChzZWxlY3RvcikuY2hhbmdlKCk7XHJcbn07XHJcblxyXG5leHBvcnRzLm9mZiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBkZWZhdWx0U2VsZWN0b3I7XHJcblxyXG4gICAgJChkb2N1bWVudCkub2ZmKCdjaGFuZ2UnLCBzZWxlY3Rvcik7XHJcbn07IiwiLyogSW50ZXJuYXppb25hbGl6YXRpb24gVXRpbGl0aWVzXHJcbiAqL1xyXG52YXIgaTE4biA9IHt9O1xyXG5pMThuLmRpc3RhbmNlVW5pdHMgPSB7XHJcbiAgICAnRVMnOiAna20nLFxyXG4gICAgJ1VTJzogJ21pbGVzJ1xyXG59O1xyXG5pMThuLm51bWVyaWNNaWxlc1NlcGFyYXRvciA9IHtcclxuICAgICdlcy1FUyc6ICcuJyxcclxuICAgICdlcy1VUyc6ICcuJyxcclxuICAgICdlbi1VUyc6ICcsJyxcclxuICAgICdlbi1FUyc6ICcsJ1xyXG59O1xyXG5pMThuLm51bWVyaWNEZWNpbWFsU2VwYXJhdG9yID0ge1xyXG4gICAgJ2VzLUVTJzogJywnLFxyXG4gICAgJ2VzLVVTJzogJywnLFxyXG4gICAgJ2VuLVVTJzogJy4nLFxyXG4gICAgJ2VuLUVTJzogJy4nXHJcbn07XHJcbmkxOG4ubW9uZXlTeW1ib2xQcmVmaXggPSB7XHJcbiAgICAnRVMnOiAnJyxcclxuICAgICdVUyc6ICckJ1xyXG59O1xyXG5pMThuLm1vbmV5U3ltYm9sU3VmaXggPSB7XHJcbiAgICAnRVMnOiAn4oKsJyxcclxuICAgICdVUyc6ICcnXHJcbn07XHJcbmkxOG4uZ2V0Q3VycmVudEN1bHR1cmUgPSBmdW5jdGlvbiBnZXRDdXJyZW50Q3VsdHVyZSgpIHtcclxuICAgIHZhciBjID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1jdWx0dXJlJyk7XHJcbiAgICB2YXIgcyA9IGMuc3BsaXQoJy0nKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3VsdHVyZTogYyxcclxuICAgICAgICBsYW5ndWFnZTogc1swXSxcclxuICAgICAgICBjb3VudHJ5OiBzWzFdXHJcbiAgICB9O1xyXG59O1xyXG5pMThuLmNvbnZlcnRNaWxlc0ttID0gZnVuY3Rpb24gY29udmVydE1pbGVzS20ocSwgdW5pdCkge1xyXG4gICAgdmFyIE1JTEVTX1RPX0tNID0gMS42MDk7XHJcbiAgICBpZiAodW5pdCA9PSAnbWlsZXMnKVxyXG4gICAgICAgIHJldHVybiBNSUxFU19UT19LTSAqIHE7XHJcbiAgICBlbHNlIGlmICh1bml0ID09ICdrbScpXHJcbiAgICAgICAgcmV0dXJuIHEgLyBNSUxFU19UT19LTTtcclxuICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUubG9nKSBjb25zb2xlLmxvZygnY29udmVydE1pbGVzS206IFVucmVjb2duaXplZCB1bml0ICcgKyB1bml0KTtcclxuICAgIHJldHVybiAwO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBpMThuOyIsIi8qIFJldHVybnMgdHJ1ZSB3aGVuIHN0ciBpc1xyXG4tIG51bGxcclxuLSBlbXB0eSBzdHJpbmdcclxuLSBvbmx5IHdoaXRlIHNwYWNlcyBzdHJpbmdcclxuKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0VtcHR5U3RyaW5nKHN0cikge1xyXG4gICAgcmV0dXJuICEoL1xcUy9nLnRlc3Qoc3RyIHx8IFwiXCIpKTtcclxufTsiLCIvKiogQXMgdGhlICdpcycgalF1ZXJ5IG1ldGhvZCwgYnV0IGNoZWNraW5nIEBzZWxlY3RvciBpbiBhbGwgZWxlbWVudHNcclxuKiBAbW9kaWZpZXIgdmFsdWVzOlxyXG4qIC0gJ2FsbCc6IGFsbCBlbGVtZW50cyBtdXN0IG1hdGNoIHNlbGVjdG9yIHRvIHJldHVybiB0cnVlXHJcbiogLSAnYWxtb3N0LW9uZSc6IGFsbW9zdCBvbmUgZWxlbWVudCBtdXN0IG1hdGNoXHJcbiogLSAncGVyY2VudGFnZSc6IHJldHVybnMgcGVyY2VudGFnZSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtYXRjaCBzZWxlY3RvciAoMC0xMDApXHJcbiogLSAnc3VtbWFyeSc6IHJldHVybnMgdGhlIG9iamVjdCB7IHllczogbnVtYmVyLCBubzogbnVtYmVyLCBwZXJjZW50YWdlOiBudW1iZXIsIHRvdGFsOiBudW1iZXIgfVxyXG4qIC0ge2p1c3Q6IGEgbnVtYmVyfTogZXhhY3QgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qIC0ge2FsbW9zdDogYSBudW1iZXJ9OiBtaW5pbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiAtIHt1bnRpbDogYSBudW1iZXJ9OiBtYXhpbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmFyZSA9IGZ1bmN0aW9uIChzZWxlY3RvciwgbW9kaWZpZXIpIHtcclxuICAgIG1vZGlmaWVyID0gbW9kaWZpZXIgfHwgJ2FsbCc7XHJcbiAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5pcyhzZWxlY3RvcikpXHJcbiAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICB9KTtcclxuICAgIHN3aXRjaCAobW9kaWZpZXIpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPT0gY291bnQ7XHJcbiAgICAgICAgY2FzZSAnYWxtb3N0LW9uZSc6XHJcbiAgICAgICAgICAgIHJldHVybiBjb3VudCA+IDA7XHJcbiAgICAgICAgY2FzZSAncGVyY2VudGFnZSc6XHJcbiAgICAgICAgICAgIHJldHVybiBjb3VudCAvIHRoaXMubGVuZ3RoO1xyXG4gICAgICAgIGNhc2UgJ3N1bW1hcnknOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgeWVzOiBjb3VudCxcclxuICAgICAgICAgICAgICAgIG5vOiB0aGlzLmxlbmd0aCAtIGNvdW50LFxyXG4gICAgICAgICAgICAgICAgcGVyY2VudGFnZTogY291bnQgLyB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIHRvdGFsOiB0aGlzLmxlbmd0aFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICgnanVzdCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLmp1c3QgIT0gY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCdhbG1vc3QnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci5hbG1vc3QgPiBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ3VudGlsJyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIudW50aWwgPCBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgfVxyXG59OyIsIi8qKiA9PT09PT09PT09PT09PT09PT09XHJcbkV4dGVuc2lvbiBqcXVlcnk6ICdib3VuZHMnXHJcblJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGNvbWJpbmVkIGJvdW5kcyBmb3IgYWxsIFxyXG5lbGVtZW50cyBpbiB0aGUgY29sbGVjdGlvblxyXG4qL1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gIGpRdWVyeS5mbi5ib3VuZHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XHJcbiAgICAgIGluY2x1ZGVCb3JkZXI6IGZhbHNlLFxyXG4gICAgICBpbmNsdWRlTWFyZ2luOiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICB2YXIgYm91bmRzID0ge1xyXG4gICAgICBsZWZ0OiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHRvcDogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICByaWdodDogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLFxyXG4gICAgICBib3R0b206IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcclxuICAgICAgd2lkdGg6IE51bWJlci5OYU4sXHJcbiAgICAgIGhlaWdodDogTnVtYmVyLk5hTlxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZm5XaWR0aCA9IG9wdGlvbnMuaW5jbHVkZUJvcmRlciB8fCBvcHRpb25zLmluY2x1ZGVNYXJnaW4gPyBcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5vdXRlcldpZHRoLmNhbGwoZWwsIG9wdGlvbnMuaW5jbHVkZU1hcmdpbik7IH0gOlxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLndpZHRoLmNhbGwoZWwpOyB9O1xyXG4gICAgdmFyIGZuSGVpZ2h0ID0gb3B0aW9ucy5pbmNsdWRlQm9yZGVyIHx8IG9wdGlvbnMuaW5jbHVkZU1hcmdpbiA/IFxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLm91dGVySGVpZ2h0LmNhbGwoZWwsIG9wdGlvbnMuaW5jbHVkZU1hcmdpbik7IH0gOlxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLmhlaWdodC5jYWxsKGVsKTsgfTtcclxuXHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKGksIGVsKSB7XHJcbiAgICAgIHZhciBlbFEgPSAkKGVsKTtcclxuICAgICAgdmFyIG9mZiA9IGVsUS5vZmZzZXQoKTtcclxuICAgICAgb2ZmLnJpZ2h0ID0gb2ZmLmxlZnQgKyBmbldpZHRoKCQoZWxRKSk7XHJcbiAgICAgIG9mZi5ib3R0b20gPSBvZmYudG9wICsgZm5IZWlnaHQoJChlbFEpKTtcclxuXHJcbiAgICAgIGlmIChvZmYubGVmdCA8IGJvdW5kcy5sZWZ0KVxyXG4gICAgICAgIGJvdW5kcy5sZWZ0ID0gb2ZmLmxlZnQ7XHJcblxyXG4gICAgICBpZiAob2ZmLnRvcCA8IGJvdW5kcy50b3ApXHJcbiAgICAgICAgYm91bmRzLnRvcCA9IG9mZi50b3A7XHJcblxyXG4gICAgICBpZiAob2ZmLnJpZ2h0ID4gYm91bmRzLnJpZ2h0KVxyXG4gICAgICAgIGJvdW5kcy5yaWdodCA9IG9mZi5yaWdodDtcclxuXHJcbiAgICAgIGlmIChvZmYuYm90dG9tID4gYm91bmRzLmJvdHRvbSlcclxuICAgICAgICBib3VuZHMuYm90dG9tID0gb2ZmLmJvdHRvbTtcclxuICAgIH0pO1xyXG5cclxuICAgIGJvdW5kcy53aWR0aCA9IGJvdW5kcy5yaWdodCAtIGJvdW5kcy5sZWZ0O1xyXG4gICAgYm91bmRzLmhlaWdodCA9IGJvdW5kcy5ib3R0b20gLSBib3VuZHMudG9wO1xyXG4gICAgcmV0dXJuIGJvdW5kcztcclxuICB9O1xyXG59KSgpOyIsIi8qKlxyXG4qIEhhc1Njcm9sbEJhciByZXR1cm5zIGFuIG9iamVjdCB3aXRoIGJvb2wgcHJvcGVydGllcyAndmVydGljYWwnIGFuZCAnaG9yaXpvbnRhbCdcclxuKiBzYXlpbmcgaWYgdGhlIGVsZW1lbnQgaGFzIG5lZWQgb2Ygc2Nyb2xsYmFycyBmb3IgZWFjaCBkaW1lbnNpb24gb3Igbm90IChlbGVtZW50XHJcbiogY2FuIG5lZWQgc2Nyb2xsYmFycyBhbmQgc3RpbGwgbm90IGJlaW5nIHNob3dlZCBiZWNhdXNlIHRoZSBjc3Mtb3ZlcmxmbG93IHByb3BlcnR5XHJcbiogYmVpbmcgc2V0IGFzICdoaWRkZW4nLCBidXQgc3RpbGwgd2Uga25vdyB0aGF0IHRoZSBlbGVtZW50IHJlcXVpcmVzIGl0IGFuZCBpdHNcclxuKiBjb250ZW50IGlzIG5vdCBiZWluZyBmdWxseSBkaXNwbGF5ZWQpLlxyXG4qIEBleHRyYWdhcCwgZGVmYXVsdHMgdG8ge3g6MCx5OjB9LCBsZXRzIHNwZWNpZnkgYW4gZXh0cmEgc2l6ZSBpbiBwaXhlbHMgZm9yIGVhY2ggZGltZW5zaW9uIHRoYXQgYWx0ZXIgdGhlIHJlYWwgY2hlY2ssXHJcbiogcmVzdWx0aW5nIGluIGEgZmFrZSByZXN1bHQgdGhhdCBjYW4gYmUgaW50ZXJlc3RpbmcgdG8gZGlzY2FyZCBzb21lIHBpeGVscyBvZiBleGNlc3NcclxuKiBzaXplIChuZWdhdGl2ZSB2YWx1ZXMpIG9yIGV4YWdlcmF0ZSB0aGUgcmVhbCB1c2VkIHNpemUgd2l0aCB0aGF0IGV4dHJhIHBpeGVscyAocG9zaXRpdmUgdmFsdWVzKS5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmhhc1Njcm9sbEJhciA9IGZ1bmN0aW9uIChleHRyYWdhcCkge1xyXG4gICAgZXh0cmFnYXAgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgeDogMCxcclxuICAgICAgICB5OiAwXHJcbiAgICB9LCBleHRyYWdhcCk7XHJcbiAgICBpZiAoIXRoaXMgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiB7IHZlcnRpY2FsOiBmYWxzZSwgaG9yaXpvbnRhbDogZmFsc2UgfTtcclxuICAgIC8vbm90ZTogY2xpZW50SGVpZ2h0PSBoZWlnaHQgb2YgaG9sZGVyXHJcbiAgICAvL3Njcm9sbEhlaWdodD0gd2UgaGF2ZSBjb250ZW50IHRpbGwgdGhpcyBoZWlnaHRcclxuICAgIHZhciB0ID0gdGhpcy5nZXQoMCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHZlcnRpY2FsOiB0aGlzLm91dGVySGVpZ2h0KGZhbHNlKSA8ICh0LnNjcm9sbEhlaWdodCArIGV4dHJhZ2FwLnkpLFxyXG4gICAgICAgIGhvcml6b250YWw6IHRoaXMub3V0ZXJXaWR0aChmYWxzZSkgPCAodC5zY3JvbGxXaWR0aCArIGV4dHJhZ2FwLngpXHJcbiAgICB9O1xyXG59OyIsIi8qKiBDaGVja3MgaWYgY3VycmVudCBlbGVtZW50IG9yIG9uZSBvZiB0aGUgY3VycmVudCBzZXQgb2YgZWxlbWVudHMgaGFzXHJcbmEgcGFyZW50IHRoYXQgbWF0Y2ggdGhlIGVsZW1lbnQgb3IgZXhwcmVzc2lvbiBnaXZlbiBhcyBmaXJzdCBwYXJhbWV0ZXJcclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmlzQ2hpbGRPZiA9IGZ1bmN0aW9uIGpRdWVyeV9wbHVnaW5faXNDaGlsZE9mKGV4cCkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50cygpLmZpbHRlcihleHApLmxlbmd0aCA+IDA7XHJcbn07IiwiLyoqXHJcbiAgICBHZXRzIHRoZSBodG1sIHN0cmluZyBvZiB0aGUgZmlyc3QgZWxlbWVudCBhbmQgYWxsIGl0cyBjb250ZW50LlxyXG4gICAgVGhlICdodG1sJyBtZXRob2Qgb25seSByZXRyaWV2ZXMgdGhlIGh0bWwgc3RyaW5nIG9mIHRoZSBjb250ZW50LCBub3QgdGhlIGVsZW1lbnQgaXRzZWxmLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4ub3V0ZXJIdG1sID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKCF0aGlzIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gJyc7XHJcbiAgICB2YXIgZWwgPSB0aGlzLmdldCgwKTtcclxuICAgIHZhciBodG1sID0gJyc7XHJcbiAgICBpZiAoZWwub3V0ZXJIVE1MKVxyXG4gICAgICAgIGh0bWwgPSBlbC5vdXRlckhUTUw7XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBodG1sID0gdGhpcy53cmFwQWxsKCc8ZGl2PjwvZGl2PicpLnBhcmVudCgpLmh0bWwoKTtcclxuICAgICAgICB0aGlzLnVud3JhcCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGh0bWw7XHJcbn07IiwiLyoqXHJcbiAgICBVc2luZyB0aGUgYXR0cmlidXRlIGRhdGEtc291cmNlLXVybCBvbiBhbnkgSFRNTCBlbGVtZW50LFxyXG4gICAgdGhpcyBhbGxvd3MgcmVsb2FkIGl0cyBjb250ZW50IHBlcmZvcm1pbmcgYW4gQUpBWCBvcGVyYXRpb25cclxuICAgIG9uIHRoZSBnaXZlbiBVUkwgb3IgdGhlIG9uZSBpbiB0aGUgYXR0cmlidXRlOyB0aGUgZW5kLXBvaW50XHJcbiAgICBtdXN0IHJldHVybiB0ZXh0L2h0bWwgY29udGVudC5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vLyBEZWZhdWx0IHN1Y2Nlc3MgY2FsbGJhY2sgYW5kIHB1YmxpYyB1dGlsaXR5LCBiYXNpYyBob3ctdG8gcmVwbGFjZSBlbGVtZW50IGNvbnRlbnQgd2l0aCBmZXRjaGVkIGh0bWxcclxuZnVuY3Rpb24gdXBkYXRlRWxlbWVudChodG1sQ29udGVudCwgY29udGV4dCkge1xyXG4gICAgY29udGV4dCA9ICQuaXNQbGFpbk9iamVjdChjb250ZXh0KSAmJiBjb250ZXh0ID8gY29udGV4dCA6IHRoaXM7XHJcblxyXG4gICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAvLyBBdm9pZCBlbXB0eSBkb2N1bWVudHMgYmVpbmcgcGFyc2VkIChyYWlzZSBlcnJvcilcclxuICAgIGh0bWxDb250ZW50ID0gJC50cmltKGh0bWxDb250ZW50KTtcclxuICAgIGlmIChodG1sQ29udGVudCkge1xyXG4gICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYW4gZW1wdHkgZG9jdW1lbnQgb3IgbWFsZm9ybWVkIGlzIHJldHVybmVkOlxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGh0bWxDb250ZW50KSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgbmV3aHRtbCA9ICQoaHRtbENvbnRlbnQpO1xyXG4gICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgZWxlbWVudCA9IGNvbnRleHQuZWxlbWVudDtcclxuICAgIGlmIChjb250ZXh0Lm9wdGlvbnMubW9kZSA9PSAncmVwbGFjZS1tZScpXHJcbiAgICAgICAgZWxlbWVudC5yZXBsYWNlV2l0aChuZXdodG1sKTtcclxuICAgIGVsc2UgLy8gJ3JlcGxhY2UtY29udGVudCdcclxuICAgICAgICBlbGVtZW50Lmh0bWwobmV3aHRtbCk7XHJcblxyXG4gICAgcmV0dXJuIGNvbnRleHQ7XHJcbn1cclxuXHJcbi8vIERlZmF1bHQgY29tcGxldGUgY2FsbGJhY2sgYW5kIHB1YmxpYyB1dGlsaXR5XHJcbmZ1bmN0aW9uIHN0b3BMb2FkaW5nU3Bpbm5lcigpIHtcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxvYWRpbmdUaW1lcik7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh0aGlzLmVsZW1lbnQpO1xyXG59XHJcblxyXG4vLyBEZWZhdWx0c1xyXG52YXIgZGVmYXVsdHMgPSB7XHJcbiAgICB1cmw6IG51bGwsXHJcbiAgICBzdWNjZXNzOiBbdXBkYXRlRWxlbWVudF0sXHJcbiAgICBlcnJvcjogW10sXHJcbiAgICBjb21wbGV0ZTogW3N0b3BMb2FkaW5nU3Bpbm5lcl0sXHJcbiAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICBtb2RlOiAncmVwbGFjZS1jb250ZW50JyxcclxuICAgIGxvYWRpbmc6IHtcclxuICAgICAgICBsb2NrRWxlbWVudDogdHJ1ZSxcclxuICAgICAgICBsb2NrT3B0aW9uczoge30sXHJcbiAgICAgICAgbWVzc2FnZTogbnVsbCxcclxuICAgICAgICBzaG93TG9hZGluZ0luZGljYXRvcjogdHJ1ZSxcclxuICAgICAgICBkZWxheTogMFxyXG4gICAgfVxyXG59O1xyXG5cclxuLyogUmVsb2FkIG1ldGhvZCAqL1xyXG52YXIgcmVsb2FkID0gJC5mbi5yZWxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBPcHRpb25zIGZyb20gZGVmYXVsdHMgKGludGVybmFsIGFuZCBwdWJsaWMpXHJcbiAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgcmVsb2FkLmRlZmF1bHRzKTtcclxuICAgIC8vIElmIG9wdGlvbnMgb2JqZWN0IGlzIHBhc3NlZCBhcyB1bmlxdWUgcGFyYW1ldGVyXHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxICYmICQuaXNQbGFpbk9iamVjdChhcmd1bWVudHNbMF0pKSB7XHJcbiAgICAgICAgLy8gTWVyZ2Ugb3B0aW9uczpcclxuICAgICAgICAkLmV4dGVuZCh0cnVlLCBvcHRpb25zLCBhcmd1bWVudHNbMF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDb21tb24gb3ZlcmxvYWQ6IG5ldy11cmwgYW5kIGNvbXBsZXRlIGNhbGxiYWNrLCBib3RoIG9wdGlvbmFsc1xyXG4gICAgICAgIG9wdGlvbnMudXJsID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiBudWxsO1xyXG4gICAgICAgIG9wdGlvbnMuY29tcGxldGUgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucy51cmwpIHtcclxuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihvcHRpb25zLnVybCkpXHJcbiAgICAgICAgICAgIC8vIEZ1bmN0aW9uIHBhcmFtczogY3VycmVudFJlbG9hZFVybCwgZGVmYXVsdFJlbG9hZFVybFxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnc291cmNlLXVybCcsICQucHJveHkob3B0aW9ucy51cmwsIHRoaXMpKCR0LmRhdGEoJ3NvdXJjZS11cmwnKSwgJHQuYXR0cignZGF0YS1zb3VyY2UtdXJsJykpKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnc291cmNlLXVybCcsIG9wdGlvbnMudXJsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHVybCA9ICR0LmRhdGEoJ3NvdXJjZS11cmwnKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYWxyZWFkeSBiZWluZyByZWxvYWRlZCwgdG8gY2FuY2VsIHByZXZpb3VzIGF0dGVtcHRcclxuICAgICAgICB2YXIganEgPSAkdC5kYXRhKCdpc1JlbG9hZGluZycpO1xyXG4gICAgICAgIGlmIChqcSkge1xyXG4gICAgICAgICAgICBpZiAoanEudXJsID09IHVybClcclxuICAgICAgICAgICAgICAgIC8vIElzIHRoZSBzYW1lIHVybCwgZG8gbm90IGFib3J0IGJlY2F1c2UgaXMgdGhlIHNhbWUgcmVzdWx0IGJlaW5nIHJldHJpZXZlZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBqcS5hYm9ydCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT3B0aW9uYWwgZGF0YSBwYXJhbWV0ZXIgJ3JlbG9hZC1tb2RlJyBhY2NlcHRzIHZhbHVlczogXHJcbiAgICAgICAgLy8gLSAncmVwbGFjZS1tZSc6IFVzZSBodG1sIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCByZWxvYWRlZCBlbGVtZW50IChha2E6IHJlcGxhY2VXaXRoKCkpXHJcbiAgICAgICAgLy8gLSAncmVwbGFjZS1jb250ZW50JzogKGRlZmF1bHQpIEh0bWwgcmV0dXJuZWQgcmVwbGFjZSBjdXJyZW50IGVsZW1lbnQgY29udGVudCAoYWthOiBodG1sKCkpXHJcbiAgICAgICAgb3B0aW9ucy5tb2RlID0gJHQuZGF0YSgncmVsb2FkLW1vZGUnKSB8fCBvcHRpb25zLm1vZGU7XHJcblxyXG4gICAgICAgIGlmICh1cmwpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIExvYWRpbmcsIHdpdGggZGVsYXlcclxuICAgICAgICAgICAgdmFyIGxvYWRpbmd0aW1lciA9IG9wdGlvbnMubG9hZGluZy5sb2NrRWxlbWVudCA/XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGluZyBjb250ZW50IHVzaW5nIGEgZmFrZSB0ZW1wIHBhcmVudCBlbGVtZW50IHRvIHByZWxvYWQgaW1hZ2UgYW5kIHRvIGdldCByZWFsIG1lc3NhZ2Ugd2lkdGg6XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvYWRpbmdjb250ZW50ID0gJCgnPGRpdi8+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5tZXNzYWdlID8gJCgnPGRpdiBjbGFzcz1cImxvYWRpbmctbWVzc2FnZVwiLz4nKS5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UpIDogbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5zaG93TG9hZGluZ0luZGljYXRvciA/IG9wdGlvbnMubG9hZGluZy5tZXNzYWdlIDogbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ2NvbnRlbnQuY3NzKHsgcG9zaXRpb246ICdhYnNvbHV0ZScsIGxlZnQ6IC05OTk5OSB9KS5hcHBlbmRUbygnYm9keScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB3ID0gbG9hZGluZ2NvbnRlbnQud2lkdGgoKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nY29udGVudC5kZXRhY2goKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBMb2NraW5nOlxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucy5hdXRvZm9jdXMgPSBvcHRpb25zLmF1dG9mb2N1cztcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMud2lkdGggPSB3O1xyXG4gICAgICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4obG9hZGluZ2NvbnRlbnQuaHRtbCgpLCAkdCwgb3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgPyAnY3VzdG9tLWxvYWRpbmcnIDogJ2xvYWRpbmcnLCBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucy5sb2FkaW5nLmRlbGF5KVxyXG4gICAgICAgICAgICAgICAgOiBudWxsO1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlcGFyZSBjb250ZXh0XHJcbiAgICAgICAgICAgIHZhciBjdHggPSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50OiAkdCxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICBsb2FkaW5nVGltZXI6IGxvYWRpbmd0aW1lclxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgICAgICAgICBqcSA9ICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dDogY3R4XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVXJsIGlzIHNldCBpbiB0aGUgcmV0dXJuZWQgYWpheCBvYmplY3QgYmVjYXVzZSBpcyBub3Qgc2V0IGJ5IGFsbCB2ZXJzaW9ucyBvZiBqUXVlcnlcclxuICAgICAgICAgICAganEudXJsID0gdXJsO1xyXG5cclxuICAgICAgICAgICAgLy8gTWFyayBlbGVtZW50IGFzIGlzIGJlaW5nIHJlbG9hZGVkLCB0byBhdm9pZCBtdWx0aXBsZSBhdHRlbXBzIGF0IHNhbWUgdGltZSwgc2F2aW5nXHJcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgYWpheCBvYmplY3QgdG8gYWxsb3cgYmUgY2FuY2VsbGVkXHJcbiAgICAgICAgICAgICR0LmRhdGEoJ2lzUmVsb2FkaW5nJywganEpO1xyXG4gICAgICAgICAgICBqcS5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnaXNSZWxvYWRpbmcnLCBudWxsKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDYWxsYmFja3M6IGZpcnN0IGdsb2JhbHMgYW5kIHRoZW4gZnJvbSBvcHRpb25zIGlmIHRoZXkgYXJlIGRpZmZlcmVudFxyXG4gICAgICAgICAgICAvLyBzdWNjZXNzXHJcbiAgICAgICAgICAgIGpxLmRvbmUocmVsb2FkLmRlZmF1bHRzLnN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zdWNjZXNzICE9IHJlbG9hZC5kZWZhdWx0cy5zdWNjZXNzKVxyXG4gICAgICAgICAgICAgICAganEuZG9uZShvcHRpb25zLnN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICAvLyBlcnJvclxyXG4gICAgICAgICAgICBqcS5mYWlsKHJlbG9hZC5kZWZhdWx0cy5lcnJvcik7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yICE9IHJlbG9hZC5kZWZhdWx0cy5lcnJvcilcclxuICAgICAgICAgICAgICAgIGpxLmZhaWwob3B0aW9ucy5lcnJvcik7XHJcbiAgICAgICAgICAgIC8vIGNvbXBsZXRlXHJcbiAgICAgICAgICAgIGpxLmFsd2F5cyhyZWxvYWQuZGVmYXVsdHMuY29tcGxldGUpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb21wbGV0ZSAhPSByZWxvYWQuZGVmYXVsdHMuY29tcGxldGUpXHJcbiAgICAgICAgICAgICAgICBqcS5kb25lKG9wdGlvbnMuY29tcGxldGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vLyBQdWJsaWMgZGVmYXVsdHNcclxucmVsb2FkLmRlZmF1bHRzID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzKTtcclxuXHJcbi8vIFB1YmxpYyB1dGlsaXRpZXNcclxucmVsb2FkLnVwZGF0ZUVsZW1lbnQgPSB1cGRhdGVFbGVtZW50O1xyXG5yZWxvYWQuc3RvcExvYWRpbmdTcGlubmVyID0gc3RvcExvYWRpbmdTcGlubmVyO1xyXG5cclxuLy8gTW9kdWxlXHJcbm1vZHVsZS5leHBvcnRzID0gcmVsb2FkOyIsIi8qKiBFeHRlbmRlZCB0b2dnbGUtc2hvdy1oaWRlIGZ1bnRpb25zLlxyXG4gICAgSWFnb1NSTEBnbWFpbC5jb21cclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5XHJcbiAqKi9cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgLyoqIEltcGxlbWVudGF0aW9uOiByZXF1aXJlIGpRdWVyeSBhbmQgcmV0dXJucyBvYmplY3Qgd2l0aCB0aGVcclxuICAgICAgICBwdWJsaWMgbWV0aG9kcy5cclxuICAgICAqKi9cclxuICAgIGZ1bmN0aW9uIHh0c2goalF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyICQgPSBqUXVlcnk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEhpZGUgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ2hpZGUnIGFuZCAnZmFkZU91dCcgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuZmFkZU91dChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuc2xpZGVVcChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ2hpZGUnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuaGlkZShvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4aGlkZScsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAqIFNob3cgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ3Nob3cnIGFuZCAnZmFkZUluJyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAvLyBXZSBwZXJmb3JtcyBhIGZpeCBvbiBzdGFuZGFyZCBqUXVlcnkgZWZmZWN0c1xyXG4gICAgICAgICAgICAvLyB0byBhdm9pZCBhbiBlcnJvciB0aGF0IHByZXZlbnRzIGZyb20gcnVubmluZ1xyXG4gICAgICAgICAgICAvLyBlZmZlY3RzIG9uIGVsZW1lbnRzIHRoYXQgYXJlIGFscmVhZHkgdmlzaWJsZSxcclxuICAgICAgICAgICAgLy8gd2hhdCBsZXRzIHRoZSBwb3NzaWJpbGl0eSBvZiBnZXQgYSBtaWRkbGUtYW5pbWF0ZWRcclxuICAgICAgICAgICAgLy8gZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBXZSBqdXN0IGNoYW5nZSBkaXNwbGF5Om5vbmUsIGZvcmNpbmcgdG8gJ2lzLXZpc2libGUnIHRvXHJcbiAgICAgICAgICAgIC8vIGJlIGZhbHNlIGFuZCB0aGVuIHJ1bm5pbmcgdGhlIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gZmxpY2tlcmluZyBlZmZlY3QsIGJlY2F1c2UgalF1ZXJ5IGp1c3QgcmVzZXRzXHJcbiAgICAgICAgICAgIC8vIGRpc3BsYXkgb24gZWZmZWN0IHN0YXJ0LlxyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZhZGVJbihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zbGlkZURvd24ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdzaG93J1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2hvdyhvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4c2hvdycsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogR2VuZXJpYyB1dGlsaXR5IGZvciBoaWdobHkgY29uZmlndXJhYmxlIGpRdWVyeS50b2dnbGUgd2l0aCBzdXBwb3J0XHJcbiAgICAgICAgICAgIHRvIHNwZWNpZnkgdGhlIHRvZ2dsZSB2YWx1ZSBleHBsaWNpdHkgZm9yIGFueSBraW5kIG9mIGVmZmVjdDoganVzdCBwYXNzIHRydWUgYXMgc2Vjb25kIHBhcmFtZXRlciAndG9nZ2xlJyB0byBzaG93XHJcbiAgICAgICAgICAgIGFuZCBmYWxzZSB0byBoaWRlLiBUb2dnbGUgbXVzdCBiZSBzdHJpY3RseSBhIEJvb2xlYW4gdmFsdWUgdG8gYXZvaWQgYXV0by1kZXRlY3Rpb24uXHJcbiAgICAgICAgICAgIFRvZ2dsZSBwYXJhbWV0ZXIgY2FuIGJlIG9taXR0ZWQgdG8gYXV0by1kZXRlY3QgaXQsIGFuZCBzZWNvbmQgcGFyYW1ldGVyIGNhbiBiZSB0aGUgYW5pbWF0aW9uIG9wdGlvbnMuXHJcbiAgICAgICAgICAgIEFsbCB0aGUgb3RoZXJzIGJlaGF2ZSBleGFjdGx5IGFzIGhpZGVFbGVtZW50IGFuZCBzaG93RWxlbWVudC5cclxuICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiB0b2dnbGVFbGVtZW50KGVsZW1lbnQsIHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgbm90IGEgYm9vbGVhblxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlICE9PSB0cnVlICYmIHRvZ2dsZSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBhbiBvYmplY3QsIHRoZW4gaXMgdGhlIG9wdGlvbnMgYXMgc2Vjb25kIHBhcmFtZXRlclxyXG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdCh0b2dnbGUpKVxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB0b2dnbGU7XHJcbiAgICAgICAgICAgICAgICAvLyBBdXRvLWRldGVjdCB0b2dnbGUsIGl0IGNhbiB2YXJ5IG9uIGFueSBlbGVtZW50IGluIHRoZSBjb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgLy8gdGhlbiBkZXRlY3Rpb24gYW5kIGFjdGlvbiBtdXN0IGJlIGRvbmUgcGVyIGVsZW1lbnQ6XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldXNpbmcgZnVuY3Rpb24sIHdpdGggZXhwbGljaXQgdG9nZ2xlIHZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCAhJCh0aGlzKS5pcygnOnZpc2libGUnKSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlKVxyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvKiogRG8galF1ZXJ5IGludGVncmF0aW9uIGFzIHh0b2dnbGUsIHhzaG93LCB4aGlkZVxyXG4gICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiBwbHVnSW4oalF1ZXJ5KSB7XHJcbiAgICAgICAgICAgIC8qKiB0b2dnbGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeHRvZ2dsZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54dG9nZ2xlID0gZnVuY3Rpb24geHRvZ2dsZSh0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgdG9nZ2xlLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIHNob3dFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54c2hvdyA9IGZ1bmN0aW9uIHhzaG93KG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogaGlkZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54aGlkZSA9IGZ1bmN0aW9uIHhoaWRlKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeHBvcnRpbmc6XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdG9nZ2xlRWxlbWVudDogdG9nZ2xlRWxlbWVudCxcclxuICAgICAgICAgICAgc2hvd0VsZW1lbnQ6IHNob3dFbGVtZW50LFxyXG4gICAgICAgICAgICBoaWRlRWxlbWVudDogaGlkZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHBsdWdJbjogcGx1Z0luXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNb2R1bGVcclxuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCB4dHNoKTtcclxuICAgIH0gZWxzZSBpZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgICAgIHZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHh0c2goalF1ZXJ5KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTm9ybWFsIHNjcmlwdCBsb2FkLCBpZiBqUXVlcnkgaXMgZ2xvYmFsIChhdCB3aW5kb3cpLCBpdHMgZXh0ZW5kZWQgYXV0b21hdGljYWxseSAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cualF1ZXJ5ICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgeHRzaCh3aW5kb3cualF1ZXJ5KS5wbHVnSW4od2luZG93LmpRdWVyeSk7XHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8qIFNvbWUgdXRpbGl0aWVzIGZvciB1c2Ugd2l0aCBqUXVlcnkgb3IgaXRzIGV4cHJlc3Npb25zXHJcbiAgICB0aGF0IGFyZSBub3QgcGx1Z2lucy5cclxuKi9cclxuZnVuY3Rpb24gZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShzdHIpIHtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFsgIzsmLC4rKn5cXCc6XCIhXiRbXFxdKCk9PnxcXC9dKS9nLCAnXFxcXCQxJyk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU6IGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWVcclxuICAgIH07XHJcbiIsIi8qIEFzc2V0cyBsb2FkZXIgd2l0aCBsb2FkaW5nIGNvbmZpcm1hdGlvbiAobWFpbmx5IGZvciBzY3JpcHRzKVxyXG4gICAgYmFzZWQgb24gTW9kZXJuaXpyL3llcG5vcGUgbG9hZGVyLlxyXG4qL1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG5leHBvcnRzLmxvYWQgPSBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgb3B0cyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBzY3JpcHRzOiBbXSxcclxuICAgICAgICBjb21wbGV0ZTogbnVsbCxcclxuICAgICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogbnVsbCxcclxuICAgICAgICBsb2FkRGVsYXk6IDAsXHJcbiAgICAgICAgdHJpYWxzSW50ZXJ2YWw6IDUwMFxyXG4gICAgfSwgb3B0cyk7XHJcbiAgICBpZiAoIW9wdHMuc2NyaXB0cy5sZW5ndGgpIHJldHVybjtcclxuICAgIGZ1bmN0aW9uIHBlcmZvcm1Db21wbGV0ZSgpIHtcclxuICAgICAgICBpZiAodHlwZW9mIChvcHRzLmNvbXBsZXRlVmVyaWZpY2F0aW9uKSAhPT0gJ2Z1bmN0aW9uJyB8fCBvcHRzLmNvbXBsZXRlVmVyaWZpY2F0aW9uKCkpXHJcbiAgICAgICAgICAgIG9wdHMuY29tcGxldGUoKTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChwZXJmb3JtQ29tcGxldGUsIG9wdHMudHJpYWxzSW50ZXJ2YWwpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLndhcm4pXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0xDLmxvYWQuY29tcGxldGVWZXJpZmljYXRpb24gZmFpbGVkIGZvciAnICsgb3B0cy5zY3JpcHRzWzBdICsgJyByZXRyeWluZyBpdCBpbiAnICsgb3B0cy50cmlhbHNJbnRlcnZhbCArICdtcycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgICAgICAgTW9kZXJuaXpyLmxvYWQoe1xyXG4gICAgICAgICAgICBsb2FkOiBvcHRzLnNjcmlwdHMsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBvcHRzLmNvbXBsZXRlID8gcGVyZm9ybUNvbXBsZXRlIDogbnVsbFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKG9wdHMubG9hZERlbGF5KVxyXG4gICAgICAgIHNldFRpbWVvdXQobG9hZCwgb3B0cy5sb2FkRGVsYXkpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGxvYWQoKTtcclxufTsiLCIvKi0tLS0tLS0tLS0tLVxyXG5VdGlsaXRpZXMgdG8gbWFuaXB1bGF0ZSBudW1iZXJzLCBhZGRpdGlvbmFsbHlcclxudG8gdGhlIG9uZXMgYXQgTWF0aFxyXG4tLS0tLS0tLS0tLS0qL1xyXG5cclxuLyoqIEVudW1lcmF0aW9uIHRvIGJlIHVzZXMgYnkgZnVuY3Rpb25zIHRoYXQgaW1wbGVtZW50cyAncm91bmRpbmcnIG9wZXJhdGlvbnMgb24gZGlmZmVyZW50XHJcbmRhdGEgdHlwZXMuXHJcbkl0IGhvbGRzIHRoZSBkaWZmZXJlbnQgd2F5cyBhIHJvdW5kaW5nIG9wZXJhdGlvbiBjYW4gYmUgYXBwbHkuXHJcbioqL1xyXG52YXIgcm91bmRpbmdUeXBlRW51bSA9IHtcclxuICAgIERvd246IC0xLFxyXG4gICAgTmVhcmVzdDogMCxcclxuICAgIFVwOiAxXHJcbn07XHJcblxyXG5mdW5jdGlvbiByb3VuZFRvKG51bWJlciwgZGVjaW1hbHMsIHJvdW5kaW5nVHlwZSkge1xyXG4gICAgLy8gY2FzZSBOZWFyZXN0IGlzIHRoZSBkZWZhdWx0OlxyXG4gICAgdmFyIGYgPSBuZWFyZXN0VG87XHJcbiAgICBzd2l0Y2ggKHJvdW5kaW5nVHlwZSkge1xyXG4gICAgICAgIGNhc2Ugcm91bmRpbmdUeXBlRW51bS5Eb3duOlxyXG4gICAgICAgICAgICBmID0gZmxvb3JUbztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSByb3VuZGluZ1R5cGVFbnVtLlVwOlxyXG4gICAgICAgICAgICBmID0gY2VpbFRvO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgIHJldHVybiBmKG51bWJlciwgZGVjaW1hbHMpO1xyXG59XHJcblxyXG4vKiogUm91bmQgYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0IGNhbiBzdWJzdHJhY3QgaW50ZWdlciBkZWNpbWFscyBieSBwcm92aWRpbmcgYSBuZWdhdGl2ZVxyXG5udW1iZXIgb2YgZGVjaW1hbHMuXHJcbioqL1xyXG5mdW5jdGlvbiBuZWFyZXN0VG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vKiogUm91bmQgVXAgYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0cyBzaW1pbGFyIHRvIHJvdW5kVG8sIGJ1dCB0aGUgbnVtYmVyIGlzIGV2ZXIgcm91bmRlZCB1cCxcclxudG8gdGhlIGxvd2VyIGludGVnZXIgZ3JlYXRlciBvciBlcXVhbHMgdG8gdGhlIG51bWJlci5cclxuKiovXHJcbmZ1bmN0aW9uIGNlaWxUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLyoqIFJvdW5kIERvd24gYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0cyBzaW1pbGFyIHRvIHJvdW5kVG8sIGJ1dCB0aGUgbnVtYmVyIGlzIGV2ZXIgcm91bmRlZCBkb3duLFxyXG50byB0aGUgYmlnZ2VyIGludGVnZXIgbG93ZXIgb3IgZXF1YWxzIHRvIHRoZSBudW1iZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBmbG9vclRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIHJvdW5kaW5nVHlwZUVudW06IHJvdW5kaW5nVHlwZUVudW0sXHJcbiAgICAgICAgcm91bmRUbzogcm91bmRUbyxcclxuICAgICAgICBuZWFyZXN0VG86IG5lYXJlc3RUbyxcclxuICAgICAgICBjZWlsVG86IGNlaWxUbyxcclxuICAgICAgICBmbG9vclRvOiBmbG9vclRvXHJcbiAgICB9OyIsImZ1bmN0aW9uIG1vdmVGb2N1c1RvKGVsLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIG1hcmdpblRvcDogMzAsXHJcbiAgICAgICAgZHVyYXRpb246IDUwMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6ICQoZWwpLm9mZnNldCgpLnRvcCAtIG9wdGlvbnMubWFyZ2luVG9wIH0sIG9wdGlvbnMuZHVyYXRpb24sIG51bGwpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbW92ZUZvY3VzVG87XHJcbn0iLCIvKiBTb21lIHV0aWxpdGllcyB0byBmb3JtYXQgYW5kIGV4dHJhY3QgbnVtYmVycywgZnJvbSB0ZXh0IG9yIERPTS5cclxuICovXHJcbnZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGkxOG4gPSByZXF1aXJlKCcuL2kxOG4nKSxcclxuICAgIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbmZ1bmN0aW9uIGdldE1vbmV5TnVtYmVyKHYsIGFsdCkge1xyXG4gICAgYWx0ID0gYWx0IHx8IDA7XHJcbiAgICBpZiAodiBpbnN0YW5jZW9mIGpRdWVyeSlcclxuICAgICAgICB2ID0gdi52YWwoKSB8fCB2LnRleHQoKTtcclxuICAgIHYgPSBwYXJzZUZsb2F0KHZcclxuICAgICAgICAucmVwbGFjZSgvWyTigqxdL2csICcnKVxyXG4gICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoTEMubnVtZXJpY01pbGVzU2VwYXJhdG9yW2kxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jdWx0dXJlXSwgJ2cnKSwgJycpXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIGlzTmFOKHYpID8gYWx0IDogdjtcclxufVxyXG5mdW5jdGlvbiBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nKHYpIHtcclxuICAgIHZhciBjdWx0dXJlID0gaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmN1bHR1cmU7XHJcbiAgICAvLyBGaXJzdCwgcm91bmQgdG8gMiBkZWNpbWFsc1xyXG4gICAgdiA9IG11LnJvdW5kVG8odiwgMik7XHJcbiAgICAvLyBHZXQgdGhlIGRlY2ltYWwgcGFydCAocmVzdClcclxuICAgIHZhciByZXN0ID0gTWF0aC5yb3VuZCh2ICogMTAwICUgMTAwKTtcclxuICAgIHJldHVybiAoJycgK1xyXG4gICAgLy8gSW50ZWdlciBwYXJ0IChubyBkZWNpbWFscylcclxuICAgICAgICBNYXRoLmZsb29yKHYpICtcclxuICAgIC8vIERlY2ltYWwgc2VwYXJhdG9yIGRlcGVuZGluZyBvbiBsb2NhbGVcclxuICAgICAgICBpMThuLm51bWVyaWNEZWNpbWFsU2VwYXJhdG9yW2N1bHR1cmVdICtcclxuICAgIC8vIERlY2ltYWxzLCBldmVyIHR3byBkaWdpdHNcclxuICAgICAgICBNYXRoLmZsb29yKHJlc3QgLyAxMCkgKyByZXN0ICUgMTBcclxuICAgICk7XHJcbn1cclxuZnVuY3Rpb24gbnVtYmVyVG9Nb25leVN0cmluZyh2KSB7XHJcbiAgICB2YXIgY291bnRyeSA9IGkxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jb3VudHJ5O1xyXG4gICAgLy8gVHdvIGRpZ2l0cyBpbiBkZWNpbWFscyBmb3Igcm91bmRlZCB2YWx1ZSB3aXRoIG1vbmV5IHN5bWJvbCBhcyBmb3JcclxuICAgIC8vIGN1cnJlbnQgbG9jYWxlXHJcbiAgICByZXR1cm4gKGkxOG4ubW9uZXlTeW1ib2xQcmVmaXhbY291bnRyeV0gKyBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nKHYpICsgaTE4bi5tb25leVN5bWJvbFN1Zml4W2NvdW50cnldKTtcclxufVxyXG5mdW5jdGlvbiBzZXRNb25leU51bWJlcih2LCBlbCkge1xyXG4gICAgLy8gR2V0IHZhbHVlIGluIG1vbmV5IGZvcm1hdDpcclxuICAgIHYgPSBudW1iZXJUb01vbmV5U3RyaW5nKHYpO1xyXG4gICAgLy8gU2V0dGluZyB2YWx1ZTpcclxuICAgIGlmIChlbCBpbnN0YW5jZW9mIGpRdWVyeSlcclxuICAgICAgICBpZiAoZWwuaXMoJzppbnB1dCcpKVxyXG4gICAgICAgICAgICBlbC52YWwodik7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBlbC50ZXh0KHYpO1xyXG4gICAgcmV0dXJuIHY7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGdldE1vbmV5TnVtYmVyOiBnZXRNb25leU51bWJlcixcclxuICAgICAgICBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nOiBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nLFxyXG4gICAgICAgIG51bWJlclRvTW9uZXlTdHJpbmc6IG51bWJlclRvTW9uZXlTdHJpbmcsXHJcbiAgICAgICAgc2V0TW9uZXlOdW1iZXI6IHNldE1vbmV5TnVtYmVyXHJcbiAgICB9OyIsIi8qKlxyXG4qIFBsYWNlaG9sZGVyIHBvbHlmaWxsLlxyXG4qIEFkZHMgYSBuZXcgalF1ZXJ5IHBsYWNlSG9sZGVyIG1ldGhvZCB0byBzZXR1cCBvciByZWFwcGx5IHBsYWNlSG9sZGVyXHJcbiogb24gZWxlbWVudHMgKHJlY29tbWVudGVkIHRvIGJlIGFwcGx5IG9ubHkgdG8gc2VsZWN0b3IgJ1twbGFjZWhvbGRlcl0nKTtcclxuKiB0aGF0cyBtZXRob2QgaXMgZmFrZSBvbiBicm93c2VycyB0aGF0IGhhcyBuYXRpdmUgc3VwcG9ydCBmb3IgcGxhY2Vob2xkZXJcclxuKiovXHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRQbGFjZUhvbGRlcnMoKSB7XHJcbiAgICBpZiAoTW9kZXJuaXpyLmlucHV0LnBsYWNlaG9sZGVyKVxyXG4gICAgICAgICQuZm4ucGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoKSB7IH07XHJcbiAgICBlbHNlXHJcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZG9QbGFjZWhvbGRlcigpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoISR0LmRhdGEoJ3BsYWNlaG9sZGVyLXN1cHBvcnRlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQub24oJ2ZvY3VzaW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlID09IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICR0Lm9uKCdmb2N1c291dCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkdC5kYXRhKCdwbGFjZWhvbGRlci1zdXBwb3J0ZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQuZm4ucGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGRvUGxhY2Vob2xkZXIpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAkKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICAgICAgJChkb2N1bWVudCkuYWpheENvbXBsZXRlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSgpO1xyXG59OyIsIi8qIFBvcHVwIGZ1bmN0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxucmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKipcclxuKiBQb3B1cCByZWxhdGVkIFxyXG4qIGZ1bmN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBwb3B1cFNpemUoc2l6ZSkge1xyXG4gICAgdmFyIHMgPSAoc2l6ZSA9PSAnbGFyZ2UnID8gMC44IDogKHNpemUgPT0gJ21lZGl1bScgPyAwLjUgOiAoc2l6ZSA9PSAnc21hbGwnID8gMC4yIDogc2l6ZSB8fCAwLjUpKSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKCQod2luZG93KS53aWR0aCgpICogcyksXHJcbiAgICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKCQod2luZG93KS5oZWlnaHQoKSAqIHMpLFxyXG4gICAgICAgIHNpemVGYWN0b3I6IHNcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gcG9wdXBTdHlsZShzaXplKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGN1cnNvcjogJ2RlZmF1bHQnLFxyXG4gICAgICAgIHdpZHRoOiBzaXplLndpZHRoICsgJ3B4JyxcclxuICAgICAgICBsZWZ0OiBNYXRoLnJvdW5kKCgkKHdpbmRvdykud2lkdGgoKSAtIHNpemUud2lkdGgpIC8gMikgLSAyNSArICdweCcsXHJcbiAgICAgICAgaGVpZ2h0OiBzaXplLmhlaWdodCArICdweCcsXHJcbiAgICAgICAgdG9wOiBNYXRoLnJvdW5kKCgkKHdpbmRvdykuaGVpZ2h0KCkgLSBzaXplLmhlaWdodCkgLyAyKSAtIDMyICsgJ3B4JyxcclxuICAgICAgICBwYWRkaW5nOiAnMzRweCAyNXB4IDMwcHgnLFxyXG4gICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgYm9yZGVyOiAnbm9uZScsXHJcbiAgICAgICAgJy1tb3otYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmcnLFxyXG4gICAgICAgICctd2Via2l0LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nLWJveCcsXHJcbiAgICAgICAgJ2JhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nLWJveCdcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gcG9wdXAodXJsLCBzaXplLCBjb21wbGV0ZSwgbG9hZGluZ1RleHQsIG9wdGlvbnMpIHtcclxuICAgIGlmICh0eXBlb2YgKHVybCkgPT09ICdvYmplY3QnKVxyXG4gICAgICAgIG9wdGlvbnMgPSB1cmw7XHJcblxyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIHVybDogdHlwZW9mICh1cmwpID09PSAnc3RyaW5nJyA/IHVybCA6ICcnLFxyXG4gICAgICAgIHNpemU6IHNpemUgfHwgeyB3aWR0aDogMCwgaGVpZ2h0OiAwIH0sXHJcbiAgICAgICAgY29tcGxldGU6IGNvbXBsZXRlLFxyXG4gICAgICAgIGxvYWRpbmdUZXh0OiBsb2FkaW5nVGV4dCxcclxuICAgICAgICBjbG9zYWJsZToge1xyXG4gICAgICAgICAgICBvbkxvYWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBhZnRlckxvYWQ6IHRydWUsXHJcbiAgICAgICAgICAgIG9uRXJyb3I6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9TaXplOiBmYWxzZSxcclxuICAgICAgICBjb250YWluZXJDbGFzczogJycsXHJcbiAgICAgICAgYXV0b0ZvY3VzOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBQcmVwYXJlIHNpemUgYW5kIGxvYWRpbmdcclxuICAgIG9wdGlvbnMubG9hZGluZ1RleHQgPSBvcHRpb25zLmxvYWRpbmdUZXh0IHx8ICcnO1xyXG4gICAgaWYgKHR5cGVvZiAob3B0aW9ucy5zaXplLndpZHRoKSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgb3B0aW9ucy5zaXplID0gcG9wdXBTaXplKG9wdGlvbnMuc2l6ZSk7XHJcblxyXG4gICAgJC5ibG9ja1VJKHtcclxuICAgICAgICBtZXNzYWdlOiAob3B0aW9ucy5jbG9zYWJsZS5vbkxvYWQgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgK1xyXG4gICAgICAgJzxpbWcgc3JjPVwiJyArIExjVXJsLkFwcFBhdGggKyAnaW1nL3RoZW1lL2xvYWRpbmcuZ2lmXCIvPicgKyBvcHRpb25zLmxvYWRpbmdUZXh0LFxyXG4gICAgICAgIGNlbnRlclk6IGZhbHNlLFxyXG4gICAgICAgIGNzczogcG9wdXBTdHlsZShvcHRpb25zLnNpemUpLFxyXG4gICAgICAgIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfSxcclxuICAgICAgICBmb2N1c0lucHV0OiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMb2FkaW5nIFVybCB3aXRoIEFqYXggYW5kIHBsYWNlIGNvbnRlbnQgaW5zaWRlIHRoZSBibG9ja2VkLWJveFxyXG4gICAgJC5hamF4KHtcclxuICAgICAgICB1cmw6IG9wdGlvbnMudXJsLFxyXG4gICAgICAgIGNvbnRleHQ6IHtcclxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgICAgICAgY29udGFpbmVyOiAkKCcuYmxvY2tNc2cnKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyLmFkZENsYXNzKG9wdGlvbnMuY29udGFpbmVyQ2xhc3MpO1xyXG4gICAgICAgICAgICAvLyBBZGQgY2xvc2UgYnV0dG9uIGlmIHJlcXVpcmVzIGl0IG9yIGVtcHR5IG1lc3NhZ2UgY29udGVudCB0byBhcHBlbmQgdGhlbiBtb3JlXHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5odG1sKG9wdGlvbnMuY2xvc2FibGUuYWZ0ZXJMb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpO1xyXG4gICAgICAgICAgICB2YXIgY29udGVudEhvbGRlciA9IGNvbnRhaW5lci5hcHBlbmQoJzxkaXYgY2xhc3M9XCJjb250ZW50XCIvPicpLmNoaWxkcmVuKCcuY29udGVudCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGF0YSkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5Db2RlICYmIGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCBjb2RlLCBzaG93IHJlc3VsdFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuYXBwZW5kKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFBhZ2UgY29udGVudCBnb3QsIHBhc3RlIGludG8gdGhlIHBvcHVwIGlmIGlzIHBhcnRpYWwgaHRtbCAodXJsIHN0YXJ0cyB3aXRoICQpXHJcbiAgICAgICAgICAgICAgICBpZiAoLygoXlxcJCl8KFxcL1xcJCkpLy50ZXN0KG9wdGlvbnMudXJsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuYXBwZW5kKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9Gb2N1cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEhvbGRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b1NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXZvaWQgbWlzY2FsY3VsYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2V2lkdGggPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnd2lkdGgnLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldkhlaWdodCA9IGNvbnRlbnRIb2xkZXJbMF0uc3R5bGUuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IGRhdGFcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbFdpZHRoID0gY29udGVudEhvbGRlclswXS5zY3JvbGxXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbEhlaWdodCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udFdpZHRoID0gY29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250SGVpZ2h0ID0gY29udGFpbmVyLmhlaWdodCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFXaWR0aCA9IGNvbnRhaW5lci5vdXRlcldpZHRoKHRydWUpIC0gY29udFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFIZWlnaHQgPSBjb250YWluZXIub3V0ZXJIZWlnaHQodHJ1ZSkgLSBjb250SGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggPSAkKHdpbmRvdykud2lkdGgoKSAtIGV4dHJhV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSBleHRyYUhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGFuZCBhcHBseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBhY3R1YWxXaWR0aCA+IG1heFdpZHRoID8gbWF4V2lkdGggOiBhY3R1YWxXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYWN0dWFsSGVpZ2h0ID4gbWF4SGVpZ2h0ID8gbWF4SGVpZ2h0IDogYWN0dWFsSGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hbmltYXRlKHNpemUsIDMwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IG1pc2NhbGN1bGF0aW9ucyBjb3JyZWN0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnd2lkdGgnLCBwcmV2V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnaGVpZ2h0JywgcHJldkhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBFbHNlLCBpZiB1cmwgaXMgYSBmdWxsIGh0bWwgcGFnZSAobm9ybWFsIHBhZ2UpLCBwdXQgY29udGVudCBpbnRvIGFuIGlmcmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoZGF0YSwgdGhpcy5vcHRpb25zLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBibG9ja2luZyBlbGVtZW50IGNvbnRlbnQgKHRoZSBsb2FkaW5nKSB3aXRoIHRoZSBpZnJhbWU6XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCBlcnJvcjogZnVuY3Rpb24gKGosIHQsIGV4KSB7XHJcbiAgICAgICAgICAgICQoJ2Rpdi5ibG9ja01zZycpLmh0bWwoKG9wdGlvbnMuY2xvc2FibGUub25FcnJvciA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKSArICc8ZGl2IGNsYXNzPVwiY29udGVudFwiPlBhZ2Ugbm90IGZvdW5kPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuaW5mbykgY29uc29sZS5pbmZvKFwiUG9wdXAtYWpheCBlcnJvcjogXCIgKyBleCk7XHJcbiAgICAgICAgfSwgY29tcGxldGU6IG9wdGlvbnMuY29tcGxldGVcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciByZXR1cm5lZEJsb2NrID0gJCgnLmJsb2NrVUknKTtcclxuXHJcbiAgICByZXR1cm5lZEJsb2NrLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgIHJldHVybmVkQmxvY2sudHJpZ2dlcigncG9wdXAtY2xvc2VkJyk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm5lZEJsb2NrLmNsb3NlUG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRCbG9ja0VsZW1lbnQgPSBmdW5jdGlvbiBnZXRCbG9ja0VsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbHRlcignLmJsb2NrTXNnJyk7IH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldENvbnRlbnRFbGVtZW50ID0gZnVuY3Rpb24gZ2V0Q29udGVudEVsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbmQoJy5jb250ZW50Jyk7IH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldE92ZXJsYXlFbGVtZW50ID0gZnVuY3Rpb24gZ2V0T3ZlcmxheUVsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbHRlcignLmJsb2NrT3ZlcmxheScpOyB9O1xyXG4gICAgcmV0dXJuIHJldHVybmVkQmxvY2s7XHJcbn1cclxuXHJcbi8qIFNvbWUgcG9wdXAgdXRpbGl0aXRlcy9zaG9ydGhhbmRzICovXHJcbmZ1bmN0aW9uIG1lc3NhZ2VQb3B1cChtZXNzYWdlLCBjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8ICdib2R5Jyk7XHJcbiAgICB2YXIgY29udGVudCA9ICQoJzxkaXYvPicpLnRleHQobWVzc2FnZSk7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGNvbnRhaW5lciwgJ21lc3NhZ2UtcG9wdXAgZnVsbC1ibG9jaycsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSwgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29ubmVjdFBvcHVwQWN0aW9uKGFwcGx5VG9TZWxlY3Rvcikge1xyXG4gICAgYXBwbHlUb1NlbGVjdG9yID0gYXBwbHlUb1NlbGVjdG9yIHx8ICcucG9wdXAtYWN0aW9uJztcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIGFwcGx5VG9TZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjID0gJCgkKHRoaXMpLmF0dHIoJ2hyZWYnKSkuY2xvbmUoKTtcclxuICAgICAgICBpZiAoYy5sZW5ndGggPT0gMSlcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihjLCBkb2N1bWVudCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiB0cnVlIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vLyBUaGUgcG9wdXAgZnVuY3Rpb24gY29udGFpbnMgYWxsIHRoZSBvdGhlcnMgYXMgbWV0aG9kc1xyXG5wb3B1cC5zaXplID0gcG9wdXBTaXplO1xyXG5wb3B1cC5zdHlsZSA9IHBvcHVwU3R5bGU7XHJcbnBvcHVwLmNvbm5lY3RBY3Rpb24gPSBjb25uZWN0UG9wdXBBY3Rpb247XHJcbnBvcHVwLm1lc3NhZ2UgPSBtZXNzYWdlUG9wdXA7XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwb3B1cDsiLCIvKioqKiBQb3N0YWwgQ29kZTogb24gZmx5LCBzZXJ2ZXItc2lkZSB2YWxpZGF0aW9uICoqKioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgYmFzZVVybDogJy8nLFxyXG4gICAgICAgIHNlbGVjdG9yOiAnW2RhdGEtdmFsLXBvc3RhbGNvZGVdJyxcclxuICAgICAgICB1cmw6ICdKU09OL1ZhbGlkYXRlUG9zdGFsQ29kZS8nXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgb3B0aW9ucy5zZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gSWYgY29udGFpbnMgYSB2YWx1ZSAodGhpcyBub3QgdmFsaWRhdGUgaWYgaXMgcmVxdWlyZWQpIGFuZCBcclxuICAgICAgICAvLyBoYXMgdGhlIGVycm9yIGRlc2NyaXB0aXZlIG1lc3NhZ2UsIHZhbGlkYXRlIHRocm91Z2ggYWpheFxyXG4gICAgICAgIHZhciBwYyA9ICR0LnZhbCgpO1xyXG4gICAgICAgIHZhciBtc2cgPSAkdC5kYXRhKCd2YWwtcG9zdGFsY29kZScpO1xyXG4gICAgICAgIGlmIChwYyAmJiBtc2cpIHtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogb3B0aW9ucy5iYXNlVXJsICsgb3B0aW9ucy51cmwsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7IFBvc3RhbENvZGU6IHBjIH0sXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnSlNPTicsXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuUmVzdWx0LklzVmFsaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZGF0aW9uLWVycm9yJykuYWRkQ2xhc3MoJ3ZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5zaWJsaW5ncygnLmZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGV4dCgnJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFuIHN1bW1hcnkgZXJyb3JzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCc+IHVsID4gbGknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQodGhpcykudGV4dCgpID09IG1zZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLnJlbW92ZUNsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPHNwYW4gZm9yPVwiJyArICR0LmF0dHIoJ25hbWUnKSArICdcIiBnZW5lcmF0ZWQ9XCJ0cnVlXCI+JyArIG1zZyArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgc3VtbWFyeSBlcnJvciAoaWYgdGhlcmUgaXMgbm90KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jaGlsZHJlbigndWwnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxsaT4nICsgbXNnICsgJzwvbGk+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07IiwiLyoqIEFwcGx5IGV2ZXIgYSByZWRpcmVjdCB0byB0aGUgZ2l2ZW4gVVJMLCBpZiB0aGlzIGlzIGFuIGludGVybmFsIFVSTCBvciBzYW1lXHJcbnBhZ2UsIGl0IGZvcmNlcyBhIHBhZ2UgcmVsb2FkIGZvciB0aGUgZ2l2ZW4gVVJMLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVkaXJlY3RUbyh1cmwpIHtcclxuICAgIC8vIEJsb2NrIHRvIGF2b2lkIG1vcmUgdXNlciBpbnRlcmFjdGlvbnM6XHJcbiAgICAkLmJsb2NrVUkoeyBtZXNzYWdlOiAnJyB9KTsgLy9sb2FkaW5nQmxvY2spO1xyXG4gICAgLy8gQ2hlY2tpbmcgaWYgaXMgYmVpbmcgcmVkaXJlY3Rpbmcgb3Igbm90XHJcbiAgICB2YXIgcmVkaXJlY3RlZCA9IGZhbHNlO1xyXG4gICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiBjaGVja1JlZGlyZWN0KCkge1xyXG4gICAgICAgIHJlZGlyZWN0ZWQgPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBOYXZpZ2F0ZSB0byBuZXcgbG9jYXRpb246XHJcbiAgICB3aW5kb3cubG9jYXRpb24gPSB1cmw7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJZiBwYWdlIG5vdCBjaGFuZ2VkIChzYW1lIHVybCBvciBpbnRlcm5hbCBsaW5rKSwgcGFnZSBjb250aW51ZSBleGVjdXRpbmcgdGhlbiByZWZyZXNoOlxyXG4gICAgICAgIGlmICghcmVkaXJlY3RlZClcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSwgNTApO1xyXG59O1xyXG4iLCIvKiogU2FuaXRpemUgdGhlIHdoaXRlc3BhY2VzIGluIGEgdGV4dCBieTpcclxuLSByZXBsYWNpbmcgY29udGlndW91cyB3aGl0ZXNwYWNlcyBjaGFyYWN0ZXJlcyAoYW55IG51bWJlciBvZiByZXBldGl0aW9uIFxyXG5hbmQgYW55IGtpbmQgb2Ygd2hpdGUgY2hhcmFjdGVyKSBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlcGxhY2UgZW5jb2RlZCBub24tYnJlYWtpbmctc3BhY2VzIGJ5IGEgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbi0gcmVtb3ZlIHN0YXJ0aW5nIGFuZCBlbmRpbmcgd2hpdGUtc3BhY2VzXHJcbi0gZXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4qKi9cclxuZnVuY3Rpb24gc2FuaXRpemVXaGl0ZXNwYWNlcyh0ZXh0KSB7XHJcbiAgICAvLyBFdmVyIHJldHVybiBhIHN0cmluZywgZW1wdHkgd2hlbiBudWxsXHJcbiAgICB0ZXh0ID0gKHRleHQgfHwgJycpXHJcbiAgICAvLyBSZXBsYWNlIGFueSBraW5kIG9mIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVycyBieSBhIHNpbmdsZSBub3JtYWwgd2hpdGUtc3BhY2VcclxuICAgIC8vICh0aGF0cyBpbmNsdWRlIHJlcGxhY2UgZW5jb25kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyxcclxuICAgIC8vIGFuZCBkdXBsaWNhdGVkLXJlcGVhdGVkIGFwcGVhcmFuY2VzKVxyXG4gICAgLnJlcGxhY2UoL1xccysvZywgJyAnKTtcclxuICAgIC8vIFJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlc3BhY2VzXHJcbiAgICByZXR1cm4gJC50cmltKHRleHQpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzYW5pdGl6ZVdoaXRlc3BhY2VzOyIsIi8qKiBDdXN0b20gTG9jb25vbWljcyAnbGlrZSBibG9ja1VJJyBwb3B1cHNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUsXHJcbiAgICBhdXRvRm9jdXMgPSByZXF1aXJlKCcuL2F1dG9Gb2N1cycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcblxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9jayhjb250ZW50Qm94LCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykge1xyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcclxuICAgICAgICBjZW50ZXI6IGZhbHNlLFxyXG4gICAgICAgIC8qIGFzIGEgdmFsaWQgb3B0aW9ucyBwYXJhbWV0ZXIgZm9yIExDLmhpZGVFbGVtZW50IGZ1bmN0aW9uICovXHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiA2MDAsXHJcbiAgICAgICAgICAgIGVmZmVjdDogJ2ZhZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgYXV0b2ZvY3VzT3B0aW9uczogeyBtYXJnaW5Ub3A6IDYwIH0sXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgY29udGVudEJveCA9ICQoY29udGVudEJveCk7XHJcbiAgICB2YXIgZnVsbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJsb2NrZWQgPT0gZG9jdW1lbnQgfHwgYmxvY2tlZCA9PSB3aW5kb3cpIHtcclxuICAgICAgICBibG9ja2VkID0gJCgnYm9keScpO1xyXG4gICAgICAgIGZ1bGwgPSB0cnVlO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgYmxvY2tlZCA9ICQoYmxvY2tlZCk7XHJcblxyXG4gICAgdmFyIGJveEluc2lkZUJsb2NrZWQgPSAhYmxvY2tlZC5pcygnYm9keSx0cix0aGVhZCx0Ym9keSx0Zm9vdCx0YWJsZSx1bCxvbCxkbCcpO1xyXG5cclxuICAgIC8vIEdldHRpbmcgYm94IGVsZW1lbnQgaWYgZXhpc3RzIGFuZCByZWZlcmVuY2luZ1xyXG4gICAgdmFyIGJJRCA9IGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcpO1xyXG4gICAgaWYgKCFiSUQpXHJcbiAgICAgICAgYklEID0gKGNvbnRlbnRCb3guYXR0cignaWQnKSB8fCAnJykgKyAoYmxvY2tlZC5hdHRyKCdpZCcpIHx8ICcnKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgaWYgKGJJRCA9PSAnLXNtb290aEJveEJsb2NrJykge1xyXG4gICAgICAgIGJJRCA9ICdpZC0nICsgZ3VpZEdlbmVyYXRvcigpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICB9XHJcbiAgICBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnLCBiSUQpO1xyXG4gICAgdmFyIGJveCA9ICQoJyMnICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShiSUQpKTtcclxuICAgIC8vIEhpZGluZyBib3g6XHJcbiAgICBpZiAoY29udGVudEJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3gueGhpZGUob3B0aW9ucy5jbG9zZU9wdGlvbnMpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBib3hjO1xyXG4gICAgaWYgKGJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3hjID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stZWxlbWVudFwiLz4nKTtcclxuICAgICAgICBib3ggPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1vdmVybGF5XCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgYm94LmFkZENsYXNzKGFkZGNsYXNzKTtcclxuICAgICAgICBpZiAoZnVsbCkgYm94LmFkZENsYXNzKCdmdWxsLWJsb2NrJyk7XHJcbiAgICAgICAgYm94LmFwcGVuZChib3hjKTtcclxuICAgICAgICBib3guYXR0cignaWQnLCBiSUQpO1xyXG4gICAgICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKVxyXG4gICAgICAgICAgICBibG9ja2VkLmFwcGVuZChib3gpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZChib3gpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBib3hjID0gYm94LmNoaWxkcmVuKCcuc21vb3RoLWJveC1ibG9jay1lbGVtZW50Jyk7XHJcbiAgICB9XHJcbiAgICAvLyBIaWRkZW4gZm9yIHVzZXIsIGJ1dCBhdmFpbGFibGUgdG8gY29tcHV0ZTpcclxuICAgIGNvbnRlbnRCb3guc2hvdygpO1xyXG4gICAgYm94LnNob3coKS5jc3MoJ29wYWNpdHknLCAwKTtcclxuICAgIC8vIFNldHRpbmcgdXAgdGhlIGJveCBhbmQgc3R5bGVzLlxyXG4gICAgYm94Yy5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgaWYgKG9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAgYm94Yy5hcHBlbmQoJCgnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cCBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nKSk7XHJcbiAgICBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnLCBvcHRpb25zKTtcclxuICAgIGlmICghYm94Yy5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJykpXHJcbiAgICAgICAgYm94Y1xyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLWFjdGlvbicsIGZ1bmN0aW9uICgpIHsgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgbnVsbCwgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJykpOyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAgICAgLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnLCB0cnVlKTtcclxuICAgIGJveGMuYXBwZW5kKGNvbnRlbnRCb3gpO1xyXG4gICAgYm94Yy53aWR0aChvcHRpb25zLndpZHRoKTtcclxuICAgIGJveC5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICBpZiAoYm94SW5zaWRlQmxvY2tlZCkge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIGluc2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBibG9ja2VkLmNzcygnei1pbmRleCcpICsgMTApO1xyXG4gICAgICAgIGlmICghYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgfHwgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgPT0gJ3N0YXRpYycpXHJcbiAgICAgICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIC8vb2ZmcyA9IGJsb2NrZWQucG9zaXRpb24oKTtcclxuICAgICAgICBib3guY3NzKCd0b3AnLCAwKTtcclxuICAgICAgICBib3guY3NzKCdsZWZ0JywgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIG91dHNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudCwgYXMgYSBkaXJlY3QgY2hpbGQgb2YgQm9keTpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgTWF0aC5mbG9vcihOdW1iZXIuTUFYX1ZBTFVFKSk7XHJcbiAgICAgICAgYm94LmNzcyhibG9ja2VkLm9mZnNldCgpKTtcclxuICAgIH1cclxuICAgIC8vIERpbWVuc2lvbnMgbXVzdCBiZSBjYWxjdWxhdGVkIGFmdGVyIGJlaW5nIGFwcGVuZGVkIGFuZCBwb3NpdGlvbiB0eXBlIGJlaW5nIHNldDpcclxuICAgIGJveC53aWR0aChibG9ja2VkLm91dGVyV2lkdGgoKSk7XHJcbiAgICBib3guaGVpZ2h0KGJsb2NrZWQub3V0ZXJIZWlnaHQoKSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuY2VudGVyKSB7XHJcbiAgICAgICAgYm94Yy5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICAgICAgdmFyIGNsLCBjdDtcclxuICAgICAgICBpZiAoZnVsbCkge1xyXG4gICAgICAgICAgICBjdCA9IHNjcmVlbi5oZWlnaHQgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IHNjcmVlbi53aWR0aCAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3QgPSBib3gub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IGJveC5vdXRlcldpZHRoKHRydWUpIC8gMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYm94Yy5jc3MoJ3RvcCcsIGN0IC0gYm94Yy5vdXRlckhlaWdodCh0cnVlKSAvIDIpO1xyXG4gICAgICAgIGJveGMuY3NzKCdsZWZ0JywgY2wgLSBib3hjLm91dGVyV2lkdGgodHJ1ZSkgLyAyKTtcclxuICAgIH1cclxuICAgIC8vIExhc3Qgc2V0dXBcclxuICAgIGF1dG9Gb2N1cyhib3gpO1xyXG4gICAgLy8gU2hvdyBibG9ja1xyXG4gICAgYm94LmFuaW1hdGUoeyBvcGFjaXR5OiAxIH0sIDMwMCk7XHJcbiAgICBpZiAob3B0aW9ucy5hdXRvZm9jdXMpXHJcbiAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEJveCwgb3B0aW9ucy5hdXRvZm9jdXNPcHRpb25zKTtcclxuICAgIHJldHVybiBib3g7XHJcbn1cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2tDbG9zZUFsbChjb250YWluZXIpIHtcclxuICAgICQoY29udGFpbmVyIHx8IGRvY3VtZW50KS5maW5kKCcuc21vb3RoLWJveC1ibG9jay1vdmVybGF5JykuaGlkZSgpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb3Blbjogc21vb3RoQm94QmxvY2ssXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKTsgfSxcclxuICAgICAgICBjbG9zZUFsbDogc21vb3RoQm94QmxvY2tDbG9zZUFsbFxyXG4gICAgfTsiLCIvKipcclxuKiogTW9kdWxlOjogdG9vbHRpcHNcclxuKiogQ3JlYXRlcyBzbWFydCB0b29sdGlwcyB3aXRoIHBvc3NpYmlsaXRpZXMgZm9yIG9uIGhvdmVyIGFuZCBvbiBjbGljayxcclxuKiogYWRkaXRpb25hbCBkZXNjcmlwdGlvbiBvciBleHRlcm5hbCB0b29sdGlwIGNvbnRlbnQuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc2FuaXRpemVXaGl0ZXNwYWNlcyA9IHJlcXVpcmUoJy4vc2FuaXRpemVXaGl0ZXNwYWNlcycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5vdXRlckh0bWwnKTtcclxucmVxdWlyZSgnLi9qcXVlcnkuaXNDaGlsZE9mJyk7XHJcblxyXG4vLyBNYWluIGludGVybmFsIHByb3BlcnRpZXNcclxudmFyIHBvc29mZnNldCA9IHsgeDogMTYsIHk6IDggfTtcclxudmFyIHNlbGVjdG9yID0gJ1t0aXRsZV1bZGF0YS1kZXNjcmlwdGlvbl0sIFt0aXRsZV0uaGFzLXRvb2x0aXAsIFt0aXRsZV0uc2VjdXJlLWRhdGEsIFtkYXRhLXRvb2x0aXAtdXJsXSwgW3RpdGxlXS5oYXMtcG9wdXAtdG9vbHRpcCc7XHJcblxyXG4vKiogUG9zaXRpb25hdGUgdGhlIHRvb2x0aXAgZGVwZW5kaW5nIG9uIHRoZVxyXG5ldmVudCBvciB0aGUgdGFyZ2V0IGVsZW1lbnQgcG9zaXRpb24gYW5kIGFuIG9mZnNldFxyXG4qKi9cclxuZnVuY3Rpb24gcG9zKHQsIGUsIGwpIHtcclxuICAgIHZhciB4LCB5O1xyXG4gICAgaWYgKGUucGFnZVggJiYgZS5wYWdlWSkge1xyXG4gICAgICAgIHggPSBlLnBhZ2VYO1xyXG4gICAgICAgIHkgPSBlLnBhZ2VZO1xyXG4gICAgfSBlbHNlIGlmIChlLnRhcmdldCkge1xyXG4gICAgICAgIHZhciAkZXQgPSAkKGUudGFyZ2V0KTtcclxuICAgICAgICB4ID0gJGV0Lm91dGVyV2lkdGgoKSArICRldC5vZmZzZXQoKS5sZWZ0O1xyXG4gICAgICAgIHkgPSAkZXQub3V0ZXJIZWlnaHQoKSArICRldC5vZmZzZXQoKS50b3A7XHJcbiAgICB9XHJcbiAgICB0LmNzcygnbGVmdCcsIHggKyBwb3NvZmZzZXQueCk7XHJcbiAgICB0LmNzcygndG9wJywgeSArIHBvc29mZnNldC55KTtcclxuICAgIC8vIEFkanVzdCB3aWR0aCB0byB2aXNpYmxlIHZpZXdwb3J0XHJcbiAgICB2YXIgdGRpZiA9IHQub3V0ZXJXaWR0aCgpIC0gdC53aWR0aCgpO1xyXG4gICAgdC5jc3MoJ21heC13aWR0aCcsICQod2luZG93KS53aWR0aCgpIC0geCAtIHBvc29mZnNldC54IC0gdGRpZik7XHJcbiAgICAvL3QuaGVpZ2h0KCQoZG9jdW1lbnQpLmhlaWdodCgpIC0geSAtIHBvc29mZnNldC55KTtcclxufVxyXG4vKiogR2V0IG9yIGNyZWF0ZSwgYW5kIHJldHVybnMsIHRoZSB0b29sdGlwIGNvbnRlbnQgZm9yIHRoZSBlbGVtZW50XHJcbioqL1xyXG5mdW5jdGlvbiBjb24obCkge1xyXG4gICAgaWYgKGwubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciBjID0gbC5kYXRhKCd0b29sdGlwLWNvbnRlbnQnKSxcclxuICAgICAgICBwZXJzaXN0ZW50ID0gbC5kYXRhKCdwZXJzaXN0ZW50LXRvb2x0aXAnKTtcclxuICAgIGlmICghYykge1xyXG4gICAgICAgIHZhciBoID0gc2FuaXRpemVXaGl0ZXNwYWNlcyhsLmF0dHIoJ3RpdGxlJykpO1xyXG4gICAgICAgIHZhciBkID0gc2FuaXRpemVXaGl0ZXNwYWNlcyhsLmRhdGEoJ2Rlc2NyaXB0aW9uJykpO1xyXG4gICAgICAgIGlmIChkKVxyXG4gICAgICAgICAgICBjID0gJzxoND4nICsgaCArICc8L2g0PjxwPicgKyBkICsgJzwvcD4nO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgYyA9IGg7XHJcbiAgICAgICAgLy8gQXBwZW5kIGRhdGEtdG9vbHRpcC11cmwgY29udGVudCBpZiBleGlzdHNcclxuICAgICAgICB2YXIgdXJsY29udGVudCA9ICQobC5kYXRhKCd0b29sdGlwLXVybCcpKTtcclxuICAgICAgICBjID0gKGMgfHwgJycpICsgdXJsY29udGVudC5vdXRlckh0bWwoKTtcclxuICAgICAgICAvLyBSZW1vdmUgb3JpZ2luYWwsIGlzIG5vIG1vcmUgbmVlZCBhbmQgYXZvaWQgaWQtY29uZmxpY3RzXHJcbiAgICAgICAgdXJsY29udGVudC5yZW1vdmUoKTtcclxuICAgICAgICAvLyBTYXZlIHRvb2x0aXAgY29udGVudFxyXG4gICAgICAgIGwuZGF0YSgndG9vbHRpcC1jb250ZW50JywgYyk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGJyb3dzZXIgdG9vbHRpcCAoYm90aCB3aGVuIHdlIGFyZSB1c2luZyBvdXIgb3duIHRvb2x0aXAgYW5kIHdoZW4gbm8gdG9vbHRpcFxyXG4gICAgICAgIC8vIGlzIG5lZWQpXHJcbiAgICAgICAgbC5hdHRyKCd0aXRsZScsICcnKTtcclxuICAgIH1cclxuICAgIC8vIFJlbW92ZSB0b29sdGlwIGNvbnRlbnQgKGJ1dCBwcmVzZXJ2ZSBpdHMgY2FjaGUgaW4gdGhlIGVsZW1lbnQgZGF0YSlcclxuICAgIC8vIGlmIGlzIHRoZSBzYW1lIHRleHQgYXMgdGhlIGVsZW1lbnQgY29udGVudCBhbmQgdGhlIGVsZW1lbnQgY29udGVudFxyXG4gICAgLy8gaXMgZnVsbHkgdmlzaWJsZS4gVGhhdHMsIGZvciBjYXNlcyB3aXRoIGRpZmZlcmVudCBjb250ZW50LCB3aWxsIGJlIHNob3dlZCxcclxuICAgIC8vIGFuZCBmb3IgY2FzZXMgd2l0aCBzYW1lIGNvbnRlbnQgYnV0IGlzIG5vdCB2aXNpYmxlIGJlY2F1c2UgdGhlIGVsZW1lbnRcclxuICAgIC8vIG9yIGNvbnRhaW5lciB3aWR0aCwgdGhlbiB3aWxsIGJlIHNob3dlZC5cclxuICAgIC8vIEV4Y2VwdCBpZiBpcyBwZXJzaXN0ZW50XHJcbiAgICBpZiAocGVyc2lzdGVudCAhPT0gdHJ1ZSAmJlxyXG4gICAgICAgIHNhbml0aXplV2hpdGVzcGFjZXMobC50ZXh0KCkpID09IGMgJiZcclxuICAgICAgICBsLm91dGVyV2lkdGgoKSA+PSBsWzBdLnNjcm9sbFdpZHRoKSB7XHJcbiAgICAgICAgYyA9IG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBjb250ZW50OlxyXG4gICAgaWYgKCFjKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIHRhcmdldCByZW1vdmluZyB0aGUgY2xhc3MgdG8gYXZvaWQgY3NzIG1hcmtpbmcgdG9vbHRpcCB3aGVuIHRoZXJlIGlzIG5vdFxyXG4gICAgICAgIGwucmVtb3ZlQ2xhc3MoJ2hhcy10b29sdGlwJykucmVtb3ZlQ2xhc3MoJ2hhcy1wb3B1cC10b29sdGlwJyk7XHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm4gdGhlIGNvbnRlbnQgYXMgc3RyaW5nOlxyXG4gICAgcmV0dXJuIGM7XHJcbn1cclxuLyoqIEdldCBvciBjcmVhdGVzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2UgZm9yIGEgdG9vbHRpcCBvZiB0aGUgZ2l2ZW4gdHlwZVxyXG4qKi9cclxuZnVuY3Rpb24gZ2V0VG9vbHRpcCh0eXBlKSB7XHJcbiAgICB0eXBlID0gdHlwZSB8fCAndG9vbHRpcCc7XHJcbiAgICB2YXIgaWQgPSAnc2luZ2xldG9uLScgKyB0eXBlO1xyXG4gICAgdmFyIHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICBpZiAoIXQpIHtcclxuICAgICAgICB0ID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlXCIgY2xhc3M9XCJ0b29sdGlwXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgdC5hdHRyKCdpZCcsIGlkKTtcclxuICAgICAgICB0LmhpZGUoKTtcclxuICAgICAgICAkKCdib2R5JykuYXBwZW5kKHQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICQodCk7XHJcbn1cclxuLyoqIFNob3cgdGhlIHRvb2x0aXAgb24gYW4gZXZlbnQgdHJpZ2dlcmVkIGJ5IHRoZSBlbGVtZW50IGNvbnRhaW5pbmdcclxuaW5mb3JtYXRpb24gZm9yIGEgdG9vbHRpcFxyXG4qKi9cclxuZnVuY3Rpb24gc2hvd1Rvb2x0aXAoZSkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBpc1BvcHVwID0gJHQuaGFzQ2xhc3MoJ2hhcy1wb3B1cC10b29sdGlwJyk7XHJcbiAgICAvLyBHZXQgb3IgY3JlYXRlIHRvb2x0aXAgbGF5ZXJcclxuICAgIHZhciB0ID0gZ2V0VG9vbHRpcChpc1BvcHVwID8gJ3BvcHVwLXRvb2x0aXAnIDogJ3Rvb2x0aXAnKTtcclxuICAgIC8vIElmIHRoaXMgaXMgbm90IHBvcHVwIGFuZCB0aGUgZXZlbnQgaXMgY2xpY2ssIGRpc2NhcmQgd2l0aG91dCBjYW5jZWwgZXZlbnRcclxuICAgIGlmICghaXNQb3B1cCAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAvLyBDcmVhdGUgY29udGVudDogaWYgdGhlcmUgaXMgY29udGVudCwgY29udGludWVcclxuICAgIHZhciBjb250ZW50ID0gY29uKCR0KTtcclxuICAgIGlmIChjb250ZW50KSB7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBoYXMtcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBub3QgYSBjbGljaywgZG9uJ3Qgc2hvd1xyXG4gICAgICAgIGlmIChpc1BvcHVwICYmIGUudHlwZSAhPSAnY2xpY2snKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAvLyBUaGUgdG9vbHRpcCBzZXR1cCBtdXN0IGJlIHF1ZXVlZCB0byBhdm9pZCBjb250ZW50IHRvIGJlIHNob3dlZCBhbmQgcGxhY2VkXHJcbiAgICAgICAgLy8gd2hlbiBzdGlsbCBoaWRkZW4gdGhlIHByZXZpb3VzXHJcbiAgICAgICAgdC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFNldCB0b29sdGlwIGNvbnRlbnRcclxuICAgICAgICAgICAgdC5odG1sKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAvLyBGb3IgcG9wdXBzLCBzZXR1cCBjbGFzcyBhbmQgY2xvc2UgYnV0dG9uXHJcbiAgICAgICAgICAgIGlmIChpc1BvcHVwKSB7XHJcbiAgICAgICAgICAgICAgICB0LmFkZENsYXNzKCdwb3B1cC10b29sdGlwJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YSBocmVmPVwiI2Nsb3NlLXBvcHVwXCIgY2xhc3M9XCJjbG9zZS1hY3Rpb25cIj5YPC9hPicpO1xyXG4gICAgICAgICAgICAgICAgdC5hcHBlbmQoY2xvc2VCdXR0b24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFBvc2l0aW9uYXRlXHJcbiAgICAgICAgICAgIHBvcyh0LCBlLCAkdCk7XHJcbiAgICAgICAgICAgIHQuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAvLyBTaG93IChhbmltYXRpb25zIGFyZSBzdG9wcGVkIG9ubHkgb24gaGlkZSB0byBhdm9pZCBjb25mbGljdHMpXHJcbiAgICAgICAgICAgIHQuZmFkZUluKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RvcCBidWJibGluZyBhbmQgZGVmYXVsdFxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKiBIaWRlIGFsbCBvcGVuZWQgdG9vbHRpcHMsIGZvciBhbnkgdHlwZS5cclxuSXQgaGFzIHNvbWUgc3BlY2lhbCBjb25zaWRlcmF0aW9ucyBmb3IgcG9wdXAtdG9vbHRpcHMgZGVwZW5kaW5nXHJcbm9uIHRoZSBldmVudCBiZWluZyB0cmlnZ2VyZWQuXHJcbioqL1xyXG5mdW5jdGlvbiBoaWRlVG9vbHRpcChlKSB7XHJcbiAgICAkKCcudG9vbHRpcDp2aXNpYmxlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGlzIGEgcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBub3QgYSBjbGljaywgb3IgdGhlIGludmVyc2UsXHJcbiAgICAgICAgLy8gdGhpcyBpcyBub3QgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIGEgY2xpY2ssIGRvIG5vdGhpbmdcclxuICAgICAgICBpZiAodC5oYXNDbGFzcygncG9wdXAtdG9vbHRpcCcpICYmIGUudHlwZSAhPSAnY2xpY2snIHx8XHJcbiAgICAgICAgICAgICF0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlID09ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAvLyBTdG9wIGFuaW1hdGlvbnMgYW5kIGhpZGVcclxuICAgICAgICB0LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKiBJbml0aWFsaXplIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiBpbml0KCkge1xyXG4gICAgLy8gTGlzdGVuIGZvciBldmVudHMgdG8gc2hvdy9oaWRlIHRvb2x0aXBzXHJcbiAgICAkKCdib2R5Jykub24oJ21vdXNlbW92ZSBmb2N1c2luJywgc2VsZWN0b3IsIHNob3dUb29sdGlwKVxyXG4gICAgLm9uKCdtb3VzZWxlYXZlIGZvY3Vzb3V0Jywgc2VsZWN0b3IsIGhpZGVUb29sdGlwKVxyXG4gICAgLy8gTGlzdGVuIGV2ZW50IGZvciBjbGlja2FibGUgcG9wdXAtdG9vbHRpcHNcclxuICAgIC5vbignY2xpY2snLCAnW3RpdGxlXS5oYXMtcG9wdXAtdG9vbHRpcCcsIHNob3dUb29sdGlwKVxyXG4gICAgLy8gQWxsb3dpbmcgYnV0dG9ucyBpbnNpZGUgdGhlIHRvb2x0aXBcclxuICAgIC5vbignY2xpY2snLCAnLnRvb2x0aXAtYnV0dG9uJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAvLyBBZGRpbmcgY2xvc2UtdG9vbHRpcCBoYW5kbGVyIGZvciBwb3B1cC10b29sdGlwcyAoY2xpY2sgb24gYW55IGVsZW1lbnQgZXhjZXB0IHRoZSB0b29sdGlwIGl0c2VsZilcclxuICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHZhciB0ID0gJCgnLnBvcHVwLXRvb2x0aXA6dmlzaWJsZScpLmdldCgwKTtcclxuICAgICAgICAvLyBJZiB0aGUgY2xpY2sgaXMgTm90IG9uIHRoZSB0b29sdGlwIG9yIGFueSBlbGVtZW50IGNvbnRhaW5lZFxyXG4gICAgICAgIC8vIGhpZGUgdG9vbHRpcFxyXG4gICAgICAgIGlmIChlLnRhcmdldCAhPSB0ICYmICEkKGUudGFyZ2V0KS5pc0NoaWxkT2YodCkpXHJcbiAgICAgICAgICAgIGhpZGVUb29sdGlwKGUpO1xyXG4gICAgfSlcclxuICAgIC8vIEF2b2lkIGNsb3NlLWFjdGlvbiBjbGljayBmcm9tIHJlZGlyZWN0IHBhZ2UsIGFuZCBoaWRlIHRvb2x0aXBcclxuICAgIC5vbignY2xpY2snLCAnLnBvcHVwLXRvb2x0aXAgLmNsb3NlLWFjdGlvbicsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGhpZGVUb29sdGlwKGUpO1xyXG4gICAgfSk7XHJcbiAgICB1cGRhdGUoKTtcclxufVxyXG4vKiogVXBkYXRlIGVsZW1lbnRzIG9uIHRoZSBwYWdlIHRvIHJlZmxlY3QgY2hhbmdlcyBvciBuZWVkIGZvciB0b29sdGlwc1xyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlKGVsZW1lbnRfc2VsZWN0b3IpIHtcclxuICAgIC8vIFJldmlldyBldmVyeSBwb3B1cCB0b29sdGlwIHRvIHByZXBhcmUgY29udGVudCBhbmQgbWFyay91bm1hcmsgdGhlIGxpbmsgb3IgdGV4dDpcclxuICAgICQoZWxlbWVudF9zZWxlY3RvciB8fCBzZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uKCQodGhpcykpO1xyXG4gICAgfSk7XHJcbn1cclxuLyoqIENyZWF0ZSB0b29sdGlwIG9uIGVsZW1lbnQgYnkgZGVtYW5kXHJcbioqL1xyXG5mdW5jdGlvbiBjcmVhdGVfdG9vbHRpcChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwge1xyXG4gICAgICB0aXRsZTogJydcclxuICAgICAgLCBkZXNjcmlwdGlvbjogbnVsbFxyXG4gICAgICAsIHVybDogbnVsbFxyXG4gICAgICAsIGlzX3BvcHVwOiBmYWxzZVxyXG4gICAgICAsIHBlcnNpc3RlbnQ6IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKGVsZW1lbnQpXHJcbiAgICAuYXR0cigndGl0bGUnLCBzZXR0aW5ncy50aXRsZSlcclxuICAgIC5kYXRhKCdkZXNjcmlwdGlvbicsIHNldHRpbmdzLmRlc2NyaXB0aW9uKVxyXG4gICAgLmRhdGEoJ3BlcnNpc3RlbnQtdG9vbHRpcCcsIHNldHRpbmdzLnBlcnNpc3RlbnQpXHJcbiAgICAuYWRkQ2xhc3Moc2V0dGluZ3MuaXNfcG9wdXAgPyAnaGFzLXBvcHVwLXRvb2x0aXAnIDogJ2hhcy10b29sdGlwJyk7XHJcbiAgICB1cGRhdGUoZWxlbWVudCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXRUb29sdGlwczogaW5pdCxcclxuICAgICAgICB1cGRhdGVUb29sdGlwczogdXBkYXRlLFxyXG4gICAgICAgIGNyZWF0ZVRvb2x0aXA6IGNyZWF0ZV90b29sdGlwXHJcbiAgICB9O1xyXG4iLCIvKiBTb21lIHRvb2xzIGZvcm0gVVJMIG1hbmFnZW1lbnRcclxuKi9cclxuZXhwb3J0cy5nZXRVUkxQYXJhbWV0ZXIgPSBmdW5jdGlvbiBnZXRVUkxQYXJhbWV0ZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIGRlY29kZVVSSShcclxuICAgICAgICAoUmVnRXhwKG5hbWUgKyAnPScgKyAnKC4rPykoJnwkKScsICdpJykuZXhlYyhsb2NhdGlvbi5zZWFyY2gpIHx8IFssIG51bGxdKVsxXSk7XHJcbn07XHJcbmV4cG9ydHMuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzID0gZnVuY3Rpb24gZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzKGhhc2hiYW5ndmFsdWUpIHtcclxuICAgIC8vIEhhc2hiYW5ndmFsdWUgaXMgc29tZXRoaW5nIGxpa2U6IFRocmVhZC0xX01lc3NhZ2UtMlxyXG4gICAgLy8gV2hlcmUgJzEnIGlzIHRoZSBUaHJlYWRJRCBhbmQgJzInIHRoZSBvcHRpb25hbCBNZXNzYWdlSUQsIG9yIG90aGVyIHBhcmFtZXRlcnNcclxuICAgIHZhciBwYXJzID0gaGFzaGJhbmd2YWx1ZS5zcGxpdCgnXycpO1xyXG4gICAgdmFyIHVybFBhcmFtZXRlcnMgPSB7fTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBwYXJzdmFsdWVzID0gcGFyc1tpXS5zcGxpdCgnLScpO1xyXG4gICAgICAgIGlmIChwYXJzdmFsdWVzLmxlbmd0aCA9PSAyKVxyXG4gICAgICAgICAgICB1cmxQYXJhbWV0ZXJzW3BhcnN2YWx1ZXNbMF1dID0gcGFyc3ZhbHVlc1sxXTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVybFBhcmFtZXRlcnM7XHJcbn07XHJcbiIsIi8qKiBWYWxpZGF0aW9uIGxvZ2ljIHdpdGggbG9hZCBhbmQgc2V0dXAgb2YgdmFsaWRhdG9ycyBhbmQgXHJcbiAgICB2YWxpZGF0aW9uIHJlbGF0ZWQgdXRpbGl0aWVzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG4vLyBVc2luZyBvbiBzZXR1cCBhc3luY3Jvbm91cyBsb2FkIGluc3RlYWQgb2YgdGhpcyBzdGF0aWMtbGlua2VkIGxvYWRcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanMnKTtcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanMnKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwVmFsaWRhdGlvbihyZWFwcGx5T25seVRvKSB7XHJcbiAgICByZWFwcGx5T25seVRvID0gcmVhcHBseU9ubHlUbyB8fCBkb2N1bWVudDtcclxuICAgIGlmICghd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZiAoIWpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHtcclxuICAgICAgICBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICBNb2Rlcm5penIubG9hZChbXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanNcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzXCIgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgZmlyc3QgaWYgdmFsaWRhdGlvbiBpcyBlbmFibGVkIChjYW4gaGFwcGVuIHRoYXQgdHdpY2UgaW5jbHVkZXMgb2ZcclxuICAgICAgICAvLyB0aGlzIGNvZGUgaGFwcGVuIGF0IHNhbWUgcGFnZSwgYmVpbmcgZXhlY3V0ZWQgdGhpcyBjb2RlIGFmdGVyIGZpcnN0IGFwcGVhcmFuY2VcclxuICAgICAgICAvLyB3aXRoIHRoZSBzd2l0Y2gganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCBjaGFuZ2VkXHJcbiAgICAgICAgLy8gYnV0IHdpdGhvdXQgdmFsaWRhdGlvbiBiZWluZyBhbHJlYWR5IGxvYWRlZCBhbmQgZW5hYmxlZClcclxuICAgICAgICBpZiAoJCAmJiAkLnZhbGlkYXRvciAmJiAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZSkge1xyXG4gICAgICAgICAgICAvLyBBcHBseSB0aGUgdmFsaWRhdGlvbiBydWxlcyB0byB0aGUgbmV3IGVsZW1lbnRzXHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndmFsaWRhdG9yJyk7XHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgICAgICQudmFsaWRhdG9yLnVub2J0cnVzaXZlLnBhcnNlKHJlYXBwbHlPbmx5VG8pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0aWVzICovXHJcblxyXG4vKiBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9ycyBvZiB0aGUgdmFsaWRhdGlvbiBzdW1tYXJ5XHJcbmluY2x1ZGVkIGluICdjb250YWluZXInIGFuZCBzZXQgYXMgdmFsaWQgdGhlIHN1bW1hcnlcclxuKi9cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gICAgJCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgLmZpbmQoJz51bD5saScpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFNldCBhbGwgZmllbGRzIHZhbGlkYXRpb24gaW5zaWRlIHRoaXMgZm9ybSAoYWZmZWN0ZWQgYnkgdGhlIHN1bW1hcnkgdG9vKVxyXG4gICAgLy8gYXMgdmFsaWQgdG9vXHJcbiAgICAkKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgLnRleHQoJycpO1xyXG5cclxuICAgIC8vIFJlLWFwcGx5IHNldHVwIHZhbGlkYXRpb24gdG8gZW5zdXJlIGlzIHdvcmtpbmcsIGJlY2F1c2UganVzdCBhZnRlciBhIHN1Y2Nlc3NmdWxcclxuICAgIC8vIHZhbGlkYXRpb24sIGFzcC5uZXQgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBzdG9wcyB3b3JraW5nIG9uIGNsaWVudC1zaWRlLlxyXG4gICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihjb250YWluZXIpIHtcclxuICB2YXIgdiA9IGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpO1xyXG4gIHYuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pIHtcclxuICAgIHZhciBvZmYgPSBmb3JtLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykub2Zmc2V0KCk7XHJcbiAgICBpZiAob2ZmKVxyXG4gICAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogb2ZmLnRvcCB9LCA1MDApO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ2dvVG9TdW1tYXJ5RXJyb3JzOiBubyBzdW1tYXJ5IHRvIGZvY3VzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpIHtcclxuICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgcmV0dXJuICQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2V0dXA6IHNldHVwVmFsaWRhdGlvbixcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDogc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IsXHJcbiAgICBnb1RvU3VtbWFyeUVycm9yczogZ29Ub1N1bW1hcnlFcnJvcnMsXHJcbiAgICBmaW5kVmFsaWRhdGlvblN1bW1hcnk6IGZpbmRWYWxpZGF0aW9uU3VtbWFyeVxyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gc29tZSBBY2NvdW50IHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJ2EubG9naW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IGJhc2VVcmwgKyAnQWNjb3VudC8kTG9naW4vP1JldHVyblVybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbik7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EucmVnaXN0ZXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvUmVnaXN0ZXInLCAnL0FjY291bnQvJFJlZ2lzdGVyJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0NTAsIGhlaWdodDogNTAwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EuZm9yZ290LXBhc3N3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L0ZvcmdvdFBhc3N3b3JkJywgJy9BY2NvdW50LyRGb3Jnb3RQYXNzd29yZCcpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDAwLCBoZWlnaHQ6IDI0MCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmNoYW5nZS1wYXNzd29yZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9DaGFuZ2VQYXNzd29yZCcsICcvQWNjb3VudC8kQ2hhbmdlUGFzc3dvcmQnKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQ1MCwgaGVpZ2h0OiAzNDAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLy8gT1VSIG5hbWVzcGFjZSAoYWJicmV2aWF0ZWQgTG9jb25vbWljcylcclxud2luZG93LkxDID0gd2luZG93LkxDIHx8IHt9O1xyXG5cclxuLy8gVE9ETyBSZXZpZXcgTGNVcmwgdXNlIGFyb3VuZCBhbGwgdGhlIG1vZHVsZXMsIHVzZSBESSB3aGVuZXZlciBwb3NzaWJsZSAoaW5pdC9zZXR1cCBtZXRob2Qgb3IgaW4gdXNlIGNhc2VzKVxyXG4vLyBidXQgb25seSBmb3IgdGhlIHdhbnRlZCBiYXNlVXJsIG9uIGVhY2ggY2FzZSBhbmQgbm90IHBhc3MgYWxsIHRoZSBMY1VybCBvYmplY3QuXHJcbi8vIExjVXJsIGlzIHNlcnZlci1zaWRlIGdlbmVyYXRlZCBhbmQgd3JvdGUgaW4gYSBMYXlvdXQgc2NyaXB0LXRhZy5cclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5nc1xyXG53aW5kb3cuZ0xvYWRpbmdSZXRhcmQgPSAzMDA7XHJcblxyXG4vKioqXHJcbiAqKiBMb2FkaW5nIG1vZHVsZXNcclxuKioqL1xyXG4vL1RPRE86IENsZWFuIGRlcGVuZGVuY2llcywgcmVtb3ZlIGFsbCB0aGF0IG5vdCB1c2VkIGRpcmVjdGx5IGluIHRoaXMgZmlsZSwgYW55IG90aGVyIGZpbGVcclxuLy8gb3IgcGFnZSBtdXN0IHJlcXVpcmUgaXRzIGRlcGVuZGVuY2llcy5cclxuXHJcbndpbmRvdy5MY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyk7XHJcblxyXG4vKiBqUXVlcnksIHNvbWUgdmVuZG9yIHBsdWdpbnMgKGZyb20gYnVuZGxlKSBhbmQgb3VyIGFkZGl0aW9ucyAoc21hbGwgcGx1Z2lucyksIHRoZXkgYXJlIGF1dG9tYXRpY2FsbHkgcGx1Zy1lZCBvbiByZXF1aXJlICovXHJcbnZhciAkID0gd2luZG93LiQgPSB3aW5kb3cualF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXInKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJhLWhhc2hjaGFuZ2UnKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LmFyZScpO1xyXG4vLyBNYXNrZWQgaW5wdXQsIGZvciBkYXRlcyAtYXQgbXktYWNjb3VudC0uXHJcbnJlcXVpcmUoJ2pxdWVyeS5mb3JtYXR0ZXInKTtcclxuXHJcbi8vIEdlbmVyYWwgY2FsbGJhY2tzIGZvciBBSkFYIGV2ZW50cyB3aXRoIGNvbW1vbiBsb2dpY1xyXG52YXIgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhDYWxsYmFja3MnKTtcclxuLy8gRm9ybS5hamF4IGxvZ2ljIGFuZCBtb3JlIHNwZWNpZmljIGNhbGxiYWNrcyBiYXNlZCBvbiBhamF4Q2FsbGJhY2tzXHJcbnZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbndpbmRvdy5hamF4Rm9ybXNTdWNjZXNzSGFuZGxlciA9IGFqYXhGb3Jtcy5vblN1Y2Nlc3M7XHJcbndpbmRvdy5hamF4RXJyb3JQb3B1cEhhbmRsZXIgPSBhamF4Rm9ybXMub25FcnJvcjtcclxud2luZG93LmFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlciA9IGFqYXhGb3Jtcy5vbkNvbXBsZXRlO1xyXG4vL31cclxuXHJcbi8qIFJlbG9hZCAqL1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkucmVsb2FkJyk7XHJcbi8vIFdyYXBwZXIgZnVuY3Rpb24gYXJvdW5kIG9uU3VjY2VzcyB0byBtYXJrIG9wZXJhdGlvbiBhcyBwYXJ0IG9mIGEgXHJcbi8vIHJlbG9hZCBhdm9pZGluZyBzb21lIGJ1Z3MgKGFzIHJlcGxhY2UtY29udGVudCBvbiBhamF4LWJveCwgbm90IHdhbnRlZCBmb3JcclxuLy8gcmVsb2FkIG9wZXJhdGlvbnMpXHJcbmZ1bmN0aW9uIHJlbG9hZFN1Y2Nlc3NXcmFwcGVyKCkge1xyXG4gIHZhciBjb250ZXh0ID0gJC5pc1BsYWluT2JqZWN0KHRoaXMpID8gdGhpcyA6IHsgZWxlbWVudDogdGhpcyB9O1xyXG4gIGNvbnRleHQuaXNSZWxvYWQgPSB0cnVlO1xyXG4gIGFqYXhGb3Jtcy5vblN1Y2Nlc3MuYXBwbHkoY29udGV4dCwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XHJcbn1cclxuJC5mbi5yZWxvYWQuZGVmYXVsdHMgPSB7XHJcbiAgc3VjY2VzczogW3JlbG9hZFN1Y2Nlc3NXcmFwcGVyXSxcclxuICBlcnJvcjogW2FqYXhGb3Jtcy5vbkVycm9yXSxcclxuICBkZWxheTogZ0xvYWRpbmdSZXRhcmRcclxufTtcclxuXHJcbkxDLm1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi4vTEMvbW92ZUZvY3VzVG8nKTtcclxuLyogRGlzYWJsZWQgYmVjYXVzZSBjb25mbGljdHMgd2l0aCB0aGUgbW92ZUZvY3VzVG8gb2YgXHJcbiAgYWpheEZvcm0ub25zdWNjZXNzLCBpdCBoYXBwZW5zIGEgYmxvY2subG9hZGluZyBqdXN0IGFmdGVyXHJcbiAgdGhlIHN1Y2Nlc3MgaGFwcGVucy5cclxuJC5ibG9ja1VJLmRlZmF1bHRzLm9uQmxvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBTY3JvbGwgdG8gYmxvY2stbWVzc2FnZSB0byBkb24ndCBsb3N0IGluIGxhcmdlIHBhZ2VzOlxyXG4gICAgTEMubW92ZUZvY3VzVG8odGhpcyk7XHJcbn07Ki9cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuLi9MQy9sb2FkZXInKTtcclxuTEMubG9hZCA9IGxvYWRlci5sb2FkO1xyXG5cclxudmFyIGJsb2NrcyA9IExDLmJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4uL0xDL2Jsb2NrUHJlc2V0cycpO1xyXG4vL3tURU1QXHJcbndpbmRvdy5sb2FkaW5nQmxvY2sgPSBibG9ja3MubG9hZGluZztcclxud2luZG93LmluZm9CbG9jayA9IGJsb2Nrcy5pbmZvO1xyXG53aW5kb3cuZXJyb3JCbG9jayA9IGJsb2Nrcy5lcnJvcjtcclxuLy99XHJcblxyXG5BcnJheS5yZW1vdmUgPSByZXF1aXJlKCcuLi9MQy9BcnJheS5yZW1vdmUnKTtcclxucmVxdWlyZSgnLi4vTEMvU3RyaW5nLnByb3RvdHlwZS5jb250YWlucycpO1xyXG5cclxuTEMuZ2V0VGV4dCA9IHJlcXVpcmUoJy4uL0xDL2dldFRleHQnKTtcclxuXHJcbnZhciBUaW1lU3BhbiA9IExDLnRpbWVTcGFuID0gcmVxdWlyZSgnLi4vTEMvVGltZVNwYW4nKTtcclxudmFyIHRpbWVTcGFuRXh0cmEgPSByZXF1aXJlKCcuLi9MQy9UaW1lU3BhbkV4dHJhJyk7XHJcbnRpbWVTcGFuRXh0cmEucGx1Z0luKFRpbWVTcGFuKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzZXNcclxuTEMuc21hcnRUaW1lID0gdGltZVNwYW5FeHRyYS5zbWFydFRpbWU7XHJcbkxDLnJvdW5kVGltZVRvUXVhcnRlckhvdXIgPSB0aW1lU3BhbkV4dHJhLnJvdW5kVG9RdWFydGVySG91cjtcclxuLy99XHJcblxyXG5MQy5DaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi4vTEMvY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG53aW5kb3cuVGFiYmVkVVggPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWCcpO1xyXG52YXIgc2xpZGVyVGFicyA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLnNsaWRlclRhYnMnKTtcclxuXHJcbi8vIFBvcHVwIEFQSXNcclxud2luZG93LnNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi4vTEMvc21vb3RoQm94QmxvY2snKTtcclxuXHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4uL0xDL3BvcHVwJyk7XHJcbi8ve1RFTVBcclxudmFyIHBvcHVwU3R5bGUgPSBwb3B1cC5zdHlsZSxcclxuICAgIHBvcHVwU2l6ZSA9IHBvcHVwLnNpemU7XHJcbkxDLm1lc3NhZ2VQb3B1cCA9IHBvcHVwLm1lc3NhZ2U7XHJcbkxDLmNvbm5lY3RQb3B1cEFjdGlvbiA9IHBvcHVwLmNvbm5lY3RBY3Rpb247XHJcbndpbmRvdy5wb3B1cCA9IHBvcHVwO1xyXG4vL31cclxuXHJcbkxDLnNhbml0aXplV2hpdGVzcGFjZXMgPSByZXF1aXJlKCcuLi9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzJyk7XHJcbi8ve1RFTVAgICBhbGlhcyBiZWNhdXNlIG1pc3NwZWxsaW5nXHJcbkxDLnNhbml0aXplV2hpdGVwYWNlcyA9IExDLnNhbml0aXplV2hpdGVzcGFjZXM7XHJcbi8vfVxyXG5cclxuTEMuZ2V0WFBhdGggPSByZXF1aXJlKCcuLi9MQy9nZXRYUGF0aCcpO1xyXG5cclxudmFyIHN0cmluZ0Zvcm1hdCA9IHJlcXVpcmUoJy4uL0xDL1N0cmluZ0Zvcm1hdCcpO1xyXG5cclxuLy8gRXhwYW5kaW5nIGV4cG9ydGVkIHV0aWxpdGVzIGZyb20gbW9kdWxlcyBkaXJlY3RseSBhcyBMQyBtZW1iZXJzOlxyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvUHJpY2UnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9tYXRoVXRpbHMnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9udW1iZXJVdGlscycpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL3Rvb2x0aXBzJykpO1xyXG52YXIgaTE4biA9IExDLmkxOG4gPSByZXF1aXJlKCcuLi9MQy9pMThuJyk7XHJcbi8ve1RFTVAgb2xkIGFsaXNlcyBvbiBMQyBhbmQgZ2xvYmFsXHJcbiQuZXh0ZW5kKExDLCBpMThuKTtcclxuJC5leHRlbmQod2luZG93LCBpMThuKTtcclxuLy99XHJcblxyXG4vLyB4dHNoOiBwbHVnZWQgaW50byBqcXVlcnkgYW5kIHBhcnQgb2YgTENcclxudmFyIHh0c2ggPSByZXF1aXJlKCcuLi9MQy9qcXVlcnkueHRzaCcpO1xyXG54dHNoLnBsdWdJbigkKTtcclxuLy97VEVNUCAgIHJlbW92ZSBvbGQgTEMuKiBhbGlhc1xyXG4kLmV4dGVuZChMQywgeHRzaCk7XHJcbmRlbGV0ZSBMQy5wbHVnSW47XHJcbi8vfVxyXG5cclxudmFyIGF1dG9DYWxjdWxhdGUgPSBMQy5hdXRvQ2FsY3VsYXRlID0gcmVxdWlyZSgnLi4vTEMvYXV0b0NhbGN1bGF0ZScpO1xyXG4vL3tURU1QICAgcmVtb3ZlIG9sZCBhbGlhcyB1c2VcclxudmFyIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzID0gYXV0b0NhbGN1bGF0ZS5vblRhYmxlSXRlbXM7XHJcbkxDLnNldHVwQ2FsY3VsYXRlU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUub25TdW1tYXJ5O1xyXG5MQy51cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS51cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5O1xyXG5MQy5zZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLm9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTtcclxuLy99XHJcblxyXG52YXIgQ29va2llID0gTEMuQ29va2llID0gcmVxdWlyZSgnLi4vTEMvQ29va2llJyk7XHJcbi8ve1RFTVAgICAgb2xkIGFsaWFzXHJcbnZhciBnZXRDb29raWUgPSBDb29raWUuZ2V0LFxyXG4gICAgc2V0Q29va2llID0gQ29va2llLnNldDtcclxuLy99XHJcblxyXG5MQy5kYXRlUGlja2VyID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVBpY2tlcicpO1xyXG4vL3tURU1QICAgb2xkIGFsaWFzXHJcbndpbmRvdy5zZXR1cERhdGVQaWNrZXIgPSBMQy5zZXR1cERhdGVQaWNrZXIgPSBMQy5kYXRlUGlja2VyLmluaXQ7XHJcbndpbmRvdy5hcHBseURhdGVQaWNrZXIgPSBMQy5hcHBseURhdGVQaWNrZXIgPSBMQy5kYXRlUGlja2VyLmFwcGx5O1xyXG4vL31cclxuXHJcbkxDLmF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4uL0xDL2F1dG9Gb2N1cycpO1xyXG5cclxuLy8gQ1JVRExcclxudmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG5MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxuXHJcbi8vIFVJIFNsaWRlciBMYWJlbHNcclxudmFyIHNsaWRlckxhYmVscyA9IHJlcXVpcmUoJy4uL0xDL1VJU2xpZGVyTGFiZWxzJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG5MQy5jcmVhdGVMYWJlbHNGb3JVSVNsaWRlciA9IHNsaWRlckxhYmVscy5jcmVhdGU7XHJcbkxDLnVwZGF0ZUxhYmVsc0ZvclVJU2xpZGVyID0gc2xpZGVyTGFiZWxzLnVwZGF0ZTtcclxuTEMudWlTbGlkZXJMYWJlbHNMYXlvdXRzID0gc2xpZGVyTGFiZWxzLmxheW91dHM7XHJcbi8vfVxyXG5cclxudmFyIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuLi9MQy92YWxpZGF0aW9uSGVscGVyJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG5MQy5zZXR1cFZhbGlkYXRpb24gPSB2YWxpZGF0aW9uSGVscGVyLnNldHVwO1xyXG5MQy5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQgPSB2YWxpZGF0aW9uSGVscGVyLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDtcclxuTEMuZ29Ub1N1bW1hcnlFcnJvcnMgPSB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzO1xyXG4vL31cclxuXHJcbkxDLnBsYWNlSG9sZGVyID0gcmVxdWlyZSgnLi4vTEMvcGxhY2Vob2xkZXItcG9seWZpbGwnKS5pbml0O1xyXG5cclxuTEMubWFwUmVhZHkgPSByZXF1aXJlKCcuLi9MQy9nb29nbGVNYXBSZWFkeScpO1xyXG5cclxud2luZG93LmlzRW1wdHlTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9pc0VtcHR5U3RyaW5nJyk7XHJcblxyXG53aW5kb3cuZ3VpZEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL0xDL2d1aWRHZW5lcmF0b3InKTtcclxuXHJcbnZhciB1cmxVdGlscyA9IHJlcXVpcmUoJy4uL0xDL3VybFV0aWxzJyk7XHJcbndpbmRvdy5nZXRVUkxQYXJhbWV0ZXIgPSB1cmxVdGlscy5nZXRVUkxQYXJhbWV0ZXI7XHJcbndpbmRvdy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSB1cmxVdGlscy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnM7XHJcblxyXG52YXIgZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nJyk7XHJcbi8ve1RFTVBcclxuTEMuZGF0ZVRvSW50ZXJjaGFuZ2xlU3RyaW5nID0gZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nO1xyXG4vL31cclxuXHJcbi8vIFBhZ2VzIGluIHBvcHVwXHJcbnZhciB3ZWxjb21lUG9wdXAgPSByZXF1aXJlKCcuL3dlbGNvbWVQb3B1cCcpO1xyXG4vL3ZhciB0YWtlQVRvdXJQb3B1cCA9IHJlcXVpcmUoJ3Rha2VBVG91clBvcHVwJyk7XHJcbnZhciBmYXFzUG9wdXBzID0gcmVxdWlyZSgnLi9mYXFzUG9wdXBzJyk7XHJcbnZhciBhY2NvdW50UG9wdXBzID0gcmVxdWlyZSgnLi9hY2NvdW50UG9wdXBzJyk7XHJcbnZhciBsZWdhbFBvcHVwcyA9IHJlcXVpcmUoJy4vbGVnYWxQb3B1cHMnKTtcclxuXHJcbi8vIE9sZCBhdmFpbGFibGl0eSBjYWxlbmRhclxyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQgPSByZXF1aXJlKCcuL2F2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0Jyk7XHJcbi8vIE5ldyBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyID0gcmVxdWlyZSgnLi4vTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXInKTtcclxuXHJcbnZhciBhdXRvZmlsbFN1Ym1lbnUgPSByZXF1aXJlKCcuLi9MQy9hdXRvZmlsbFN1Ym1lbnUnKTtcclxuXHJcbnZhciB0YWJiZWRXaXphcmQgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC53aXphcmQnKTtcclxuXHJcbnZhciBoYXNDb25maXJtU3VwcG9ydCA9IHJlcXVpcmUoJy4uL0xDL2hhc0NvbmZpcm1TdXBwb3J0Jyk7XHJcblxyXG52YXIgcG9zdGFsQ29kZVZhbGlkYXRpb24gPSByZXF1aXJlKCcuLi9MQy9wb3N0YWxDb2RlU2VydmVyVmFsaWRhdGlvbicpO1xyXG5cclxudmFyIHRhYmJlZE5vdGlmaWNhdGlvbnMgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcblxyXG52YXIgdGFic0F1dG9sb2FkID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguYXV0b2xvYWQnKTtcclxuXHJcbnZhciBob21lUGFnZSA9IHJlcXVpcmUoJy4vaG9tZScpO1xyXG5cclxuLy97VEVNUCByZW1vdmUgZ2xvYmFsIGRlcGVuZGVuY3kgZm9yIHRoaXNcclxud2luZG93LmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuLi9MQy9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcbi8vfVxyXG5cclxudmFyIHByb3ZpZGVyV2VsY29tZSA9IHJlcXVpcmUoJy4vcHJvdmlkZXJXZWxjb21lJyk7XHJcblxyXG4vKipcclxuICoqIEluaXQgY29kZVxyXG4qKiovXHJcbiQod2luZG93KS5sb2FkKGZ1bmN0aW9uICgpIHtcclxuICAvLyBEaXNhYmxlIGJyb3dzZXIgYmVoYXZpb3IgdG8gYXV0by1zY3JvbGwgdG8gdXJsIGZyYWdtZW50L2hhc2ggZWxlbWVudCBwb3NpdGlvbjpcclxuICAvLyBFWENFUFQgaW4gRGFzaGJvYXJkOlxyXG4gIC8vIFRPRE86IFJldmlldyBpZiB0aGlzIGlzIHJlcXVpcmVkIG9ubHkgZm9yIEhvd0l0V29ya3Mgb3Igc29tZXRoaW5nIG1vcmUgKHRhYnMsIHByb2ZpbGUpXHJcbiAgLy8gYW5kIHJlbW92ZSBpZiBwb3NzaWJsZSBvciBvbmx5IG9uIHRoZSBjb25jcmV0ZSBjYXNlcy5cclxuICBpZiAoIS9cXC9kYXNoYm9hcmRcXC8vaS50ZXN0KGxvY2F0aW9uKSlcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyAkKCdodG1sLGJvZHknKS5zY3JvbGxUb3AoMCk7IH0sIDEpO1xyXG59KTtcclxuJChmdW5jdGlvbiAoKSB7XHJcblxyXG4gIHByb3ZpZGVyV2VsY29tZS5zaG93KCk7XHJcblxyXG4gIC8vIFBsYWNlaG9sZGVyIHBvbHlmaWxsXHJcbiAgTEMucGxhY2VIb2xkZXIoKTtcclxuXHJcbiAgLy8gQXV0b2ZvY3VzIHBvbHlmaWxsXHJcbiAgTEMuYXV0b0ZvY3VzKCk7XHJcblxyXG4gIC8vIEdlbmVyaWMgc2NyaXB0IGZvciBlbmhhbmNlZCB0b29sdGlwcyBhbmQgZWxlbWVudCBkZXNjcmlwdGlvbnNcclxuICBMQy5pbml0VG9vbHRpcHMoKTtcclxuXHJcbiAgYWpheEZvcm1zLmluaXQoKTtcclxuXHJcbiAgLy90YWtlQVRvdXJQb3B1cC5zaG93KCk7XHJcbiAgd2VsY29tZVBvcHVwLnNob3coKTtcclxuICAvLyBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgZm9yIHNvbWUgbGlua3MgdGhhdCBieSBkZWZhdWx0IG9wZW4gYSBuZXcgdGFiOlxyXG4gIGZhcXNQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuICBhY2NvdW50UG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcbiAgbGVnYWxQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuXHJcbiAgLy8gT2xkIGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG4gIGF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0LmluaXQoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gIC8vIE5ldyBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxuICBhdmFpbGFiaWxpdHlDYWxlbmRhci5XZWVrbHkuZW5hYmxlQWxsKCk7XHJcblxyXG4gIHBvcHVwLmNvbm5lY3RBY3Rpb24oKTtcclxuXHJcbiAgLy8gRGF0ZSBQaWNrZXJcclxuICBMQy5kYXRlUGlja2VyLmluaXQoKTtcclxuXHJcbiAgLyogQXV0byBjYWxjdWxhdGUgdGFibGUgaXRlbXMgdG90YWwgKHF1YW50aXR5KnVuaXRwcmljZT1pdGVtLXRvdGFsKSBzY3JpcHQgKi9cclxuICBhdXRvQ2FsY3VsYXRlLm9uVGFibGVJdGVtcygpO1xyXG4gIGF1dG9DYWxjdWxhdGUub25TdW1tYXJ5KCk7XHJcblxyXG4gIGhhc0NvbmZpcm1TdXBwb3J0Lm9uKCk7XHJcblxyXG4gIHBvc3RhbENvZGVWYWxpZGF0aW9uLmluaXQoeyBiYXNlVXJsOiBMY1VybC5MYW5nUGF0aCB9KTtcclxuXHJcbiAgLy8gVGFiYmVkIGludGVyZmFjZVxyXG4gIHRhYnNBdXRvbG9hZC5pbml0KFRhYmJlZFVYKTtcclxuICBUYWJiZWRVWC5pbml0KCk7XHJcbiAgVGFiYmVkVVguZm9jdXNDdXJyZW50TG9jYXRpb24oKTtcclxuICBUYWJiZWRVWC5jaGVja1ZvbGF0aWxlVGFicygpO1xyXG4gIHNsaWRlclRhYnMuaW5pdChUYWJiZWRVWCk7XHJcblxyXG4gIHRhYmJlZFdpemFyZC5pbml0KFRhYmJlZFVYLCB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IGdMb2FkaW5nUmV0YXJkXHJcbiAgfSk7XHJcblxyXG4gIHRhYmJlZE5vdGlmaWNhdGlvbnMuaW5pdChUYWJiZWRVWCk7XHJcblxyXG4gIGF1dG9maWxsU3VibWVudSgpO1xyXG5cclxuICAvLyBUT0RPOiAnbG9hZEhhc2hCYW5nJyBjdXN0b20gZXZlbnQgaW4gdXNlP1xyXG4gIC8vIElmIHRoZSBoYXNoIHZhbHVlIGZvbGxvdyB0aGUgJ2hhc2ggYmFuZycgY29udmVudGlvbiwgbGV0IG90aGVyXHJcbiAgLy8gc2NyaXB0cyBkbyB0aGVpciB3b3JrIHRocm91Z2h0IGEgJ2xvYWRIYXNoQmFuZycgZXZlbnQgaGFuZGxlclxyXG4gIGlmICgvXiMhLy50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSlcclxuICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2xvYWRIYXNoQmFuZycsIHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKSk7XHJcblxyXG4gIC8vIFJlbG9hZCBidXR0b25zXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5yZWxvYWQtYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gR2VuZXJpYyBhY3Rpb24gdG8gY2FsbCBsYy5qcXVlcnkgJ3JlbG9hZCcgZnVuY3Rpb24gZnJvbSBhbiBlbGVtZW50IGluc2lkZSBpdHNlbGYuXHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgJHQuY2xvc2VzdCgkdC5kYXRhKCdyZWxvYWQtdGFyZ2V0JykpLnJlbG9hZCgpO1xyXG4gIH0pO1xyXG5cclxuICAvKiBFbmFibGUgZm9jdXMgdGFiIG9uIGV2ZXJ5IGhhc2ggY2hhbmdlLCBub3cgdGhlcmUgYXJlIHR3byBzY3JpcHRzIG1vcmUgc3BlY2lmaWMgZm9yIHRoaXM6XHJcbiAgKiBvbmUgd2hlbiBwYWdlIGxvYWQgKHdoZXJlPyksXHJcbiAgKiBhbmQgYW5vdGhlciBvbmx5IGZvciBsaW5rcyB3aXRoICd0YXJnZXQtdGFiJyBjbGFzcy5cclxuICAqIE5lZWQgYmUgc3R1ZHkgaWYgc29tZXRoaW5nIG9mIHRoZXJlIG11c3QgYmUgcmVtb3ZlZCBvciBjaGFuZ2VkLlxyXG4gICogVGhpcyBpcyBuZWVkZWQgZm9yIG90aGVyIGJlaGF2aW9ycyB0byB3b3JrLiAqL1xyXG4gIC8vIE9uIHRhcmdldC10YWIgbGlua3NcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYS50YXJnZXQtdGFiJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIoJCh0aGlzKS5hdHRyKCdocmVmJykpO1xyXG4gICAgaWYgKHRoZXJlSXNUYWIpIHtcclxuICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGhlcmVJc1RhYik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuICAvLyBPbiBoYXNoIGNoYW5nZVxyXG4gIGlmICgkLmZuLmhhc2hjaGFuZ2UpXHJcbiAgICAkKHdpbmRvdykuaGFzaGNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGlmICghL14jIS8udGVzdChsb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgICAgIHZhciB0aGVyZUlzVGFiID0gVGFiYmVkVVguZ2V0VGFiKGxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIGlmICh0aGVyZUlzVGFiKVxyXG4gICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGhlcmVJc1RhYik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAvLyBIT01FIFBBR0UgLyBTRUFSQ0ggU1RVRkZcclxuICBob21lUGFnZS5pbml0KCk7XHJcblxyXG4gIC8vIFZhbGlkYXRpb24gYXV0byBzZXR1cCBmb3IgcGFnZSByZWFkeSBhbmQgYWZ0ZXIgZXZlcnkgYWpheCByZXF1ZXN0XHJcbiAgLy8gaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBmb3JtIGluIHRoZSBwYWdlLlxyXG4gIC8vIFRoaXMgYXZvaWQgdGhlIG5lZWQgZm9yIGV2ZXJ5IHBhZ2Ugd2l0aCBmb3JtIHRvIGRvIHRoZSBzZXR1cCBpdHNlbGZcclxuICAvLyBhbG1vc3QgZm9yIG1vc3Qgb2YgdGhlIGNhc2UuXHJcbiAgZnVuY3Rpb24gYXV0b1NldHVwVmFsaWRhdGlvbigpIHtcclxuICAgIGlmICgkKGRvY3VtZW50KS5oYXMoJ2Zvcm0nKS5sZW5ndGgpXHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuc2V0dXAoJ2Zvcm0nKTtcclxuICB9XHJcbiAgYXV0b1NldHVwVmFsaWRhdGlvbigpO1xyXG4gICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShhdXRvU2V0dXBWYWxpZGF0aW9uKTtcclxuXHJcbiAgLy8gVE9ETzogdXNlZCBzb21lIHRpbWU/IHN0aWxsIHJlcXVpcmVkIHVzaW5nIG1vZHVsZXM/XHJcbiAgLypcclxuICAqIENvbW11bmljYXRlIHRoYXQgc2NyaXB0LmpzIGlzIHJlYWR5IHRvIGJlIHVzZWRcclxuICAqIGFuZCB0aGUgY29tbW9uIExDIGxpYiB0b28uXHJcbiAgKiBCb3RoIGFyZSBlbnN1cmVkIHRvIGJlIHJhaXNlZCBldmVyIGFmdGVyIHBhZ2UgaXMgcmVhZHkgdG9vLlxyXG4gICovXHJcbiAgJChkb2N1bWVudClcclxuICAgIC50cmlnZ2VyKCdsY1NjcmlwdFJlYWR5JylcclxuICAgIC50cmlnZ2VyKCdsY0xpYlJlYWR5Jyk7XHJcbn0pOyIsIi8qKioqKiBBVkFJTEFCSUxJVFkgQ0FMRU5EQVIgV0lER0VUICoqKioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuLi9MQy9zbW9vdGhCb3hCbG9jaycpLFxyXG4gICAgZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nJyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5yZWxvYWQnKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRBdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmNhbGVuZGFyLWNvbnRyb2xzIC5hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoJHQuaGFzQ2xhc3MoJ3pvb20tYWN0aW9uJykpIHtcclxuICAgICAgICAgICAgLy8gRG8gem9vbVxyXG4gICAgICAgICAgICB2YXIgYyA9ICR0LmNsb3Nlc3QoJy5hdmFpbGFiaWxpdHktY2FsZW5kYXInKS5maW5kKCcuY2FsZW5kYXInKS5jbG9uZSgpO1xyXG4gICAgICAgICAgICBjLmNzcygnZm9udC1zaXplJywgJzJweCcpO1xyXG4gICAgICAgICAgICB2YXIgdGFiID0gJHQuY2xvc2VzdCgnLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgICAgIGMuZGF0YSgncG9wdXAtY29udGFpbmVyJywgdGFiKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihjLCB0YWIsICdhdmFpbGFiaWxpdHktY2FsZW5kYXInLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAvLyBOb3RoaW5nIG1vcmVcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBOYXZpZ2F0ZSBjYWxlbmRhclxyXG4gICAgICAgIHZhciBuZXh0ID0gJHQuaGFzQ2xhc3MoJ25leHQtd2Vlay1hY3Rpb24nKTtcclxuICAgICAgICB2YXIgY29udCA9ICR0LmNsb3Nlc3QoJy5hdmFpbGFiaWxpdHktY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsY29udCA9IGNvbnQuY2hpbGRyZW4oJy5jYWxlbmRhci1jb250YWluZXInKTtcclxuICAgICAgICB2YXIgY2FsID0gY2FsY29udC5jaGlsZHJlbignLmNhbGVuZGFyJyk7XHJcbiAgICAgICAgdmFyIGNhbGluZm8gPSBjb250LmZpbmQoJy5jYWxlbmRhci1pbmZvJyk7XHJcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShjYWwuZGF0YSgnc2hvd2VkLWRhdGUnKSk7XHJcbiAgICAgICAgdmFyIHVzZXJJZCA9IGNhbC5kYXRhKCd1c2VyLWlkJyk7XHJcbiAgICAgICAgaWYgKG5leHQpXHJcbiAgICAgICAgICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpIC0gNyk7XHJcbiAgICAgICAgdmFyIHN0cmRhdGUgPSBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcoZGF0ZSk7XHJcbiAgICAgICAgdmFyIHVybCA9IGJhc2VVcmwgKyBcIlByb2ZpbGUvJEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0L1dlZWsvXCIgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyZGF0ZSkgKyBcIi8/VXNlcklEPVwiICsgdXNlcklkO1xyXG4gICAgICAgIGNhbGNvbnQucmVsb2FkKHVybCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIG5ldyBvYmplY3Q6XHJcbiAgICAgICAgICAgIHZhciBjYWwgPSAkKCcuY2FsZW5kYXInLCB0aGlzLmVsZW1lbnQpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy55ZWFyLXdlZWsnKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtd2VlaycpKTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcuZmlyc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtZmlyc3QtZGF5JykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5sYXN0LXdlZWstZGF5JykudGV4dChjYWwuZGF0YSgnc2hvd2VkLWxhc3QtZGF5JykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gRkFRcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG52YXIgZmFxc0Jhc2VVcmwgPSAnSGVscENlbnRlci8kRkFRcyc7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgZmFxc0Jhc2VVcmwgPSAoYmFzZVVybCB8fCAnLycpICsgZmFxc0Jhc2VVcmw7XHJcblxyXG4gIC8vIEVuYWJsZSBGQVFzIGxpbmtzIGluIHBvcHVwXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJ2FbaHJlZnw9XCIjRkFRc1wiXScsIHBvcHVwRmFxcyk7XHJcblxyXG4gIC8vIEF1dG8gb3BlbiBjdXJyZW50IGRvY3VtZW50IGxvY2F0aW9uIGlmIGhhc2ggaXMgYSBGQVEgbGlua1xyXG4gIGlmICgvXiNGQVFzL2kudGVzdChsb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgcG9wdXBGYXFzKGxvY2F0aW9uLmhhc2gpO1xyXG4gIH1cclxuXHJcbiAgLy8gcmV0dXJuIGFzIHV0aWxpdHlcclxuICByZXR1cm4gcG9wdXBGYXFzO1xyXG59O1xyXG5cclxuLyogUGFzcyBhIEZhcXMgQHVybCBvciB1c2UgYXMgYSBsaW5rIGhhbmRsZXIgdG8gb3BlbiB0aGUgRkFRIGluIGEgcG9wdXBcclxuICovXHJcbmZ1bmN0aW9uIHBvcHVwRmFxcyh1cmwpIHtcclxuICB1cmwgPSB0eXBlb2YgKHVybCkgPT09ICdzdHJpbmcnID8gdXJsIDogJCh0aGlzKS5hdHRyKCdocmVmJyk7XHJcblxyXG4gIHZhciB1cmxwYXJ0cyA9IHVybC5zcGxpdCgnLScpO1xyXG5cclxuICBpZiAodXJscGFydHNbMF0gIT0gJyNGQVFzJykge1xyXG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignVGhlIFVSTCBpcyBub3QgYSBGQVEgdXJsIChkb2VzblxcJ3Qgc3RhcnRzIHdpdGggI0ZBUXMtKScsIHVybCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHZhciB1cmxzZWN0aW9uID0gdXJscGFydHMubGVuZ3RoID4gMSA/IHVybHBhcnRzWzFdIDogJyc7XHJcblxyXG4gIGlmICh1cmxzZWN0aW9uKSB7XHJcbiAgICB2YXIgcHVwID0gcG9wdXAoZmFxc0Jhc2VVcmwgKyB1cmxzZWN0aW9uLCAnbGFyZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBkID0gJCh1cmwpLFxyXG4gICAgICAgIHBlbCA9IHB1cC5nZXRDb250ZW50RWxlbWVudCgpO1xyXG4gICAgICBwZWwuc2Nyb2xsVG9wKHBlbC5zY3JvbGxUb3AoKSArIGQucG9zaXRpb24oKS50b3AgLSA1MCk7XHJcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGQuZWZmZWN0KFwiaGlnaGxpZ2h0XCIsIHt9LCAyMDAwKTtcclxuICAgICAgfSwgNDAwKTtcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gZmFsc2U7XHJcbn0iLCIvKiBJTklUICovXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIExvY2F0aW9uIGpzLWRyb3Bkb3duXHJcbiAgICB2YXIgcyA9ICQoJyNzZWFyY2gtbG9jYXRpb24nKTtcclxuICAgIHMucHJvcCgncmVhZG9ubHknLCB0cnVlKTtcclxuICAgIHMuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IExDLnNlYXJjaExvY2F0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgYXV0b0ZvY3VzOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBtaW5MZW5ndGg6IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIHNlbGVjdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBzLm9uKCdmb2N1cyBjbGljaycsIGZ1bmN0aW9uICgpIHsgcy5hdXRvY29tcGxldGUoJ3NlYXJjaCcsICcnKTsgfSk7XHJcblxyXG4gICAgLyogUG9zaXRpb25zIGF1dG9jb21wbGV0ZSAqL1xyXG4gICAgdmFyIHBvc2l0aW9uc0F1dG9jb21wbGV0ZSA9ICQoJyNzZWFyY2gtc2VydmljZScpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgICAgICBtaW5MZW5ndGg6IDAsXHJcbiAgICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICAgICAgIC8vJCh0aGlzKS52YWwodWkuaXRlbS5sYWJlbCk7XHJcbiAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZvY3VzOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgICAgICAgLy8kKHRoaXMpLnZhbCh1aS5pdGVtLmxhYmVsKTtcclxuICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gTG9hZCBhbGwgcG9zaXRpb25zIGluIGJhY2tncm91bmQgdG8gcmVwbGFjZSB0aGUgYXV0b2NvbXBsZXRlIHNvdXJjZSAoYXZvaWRpbmcgbXVsdGlwbGUsIHNsb3cgbG9vay11cHMpXHJcbiAgICAvKiQuZ2V0SlNPTihMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgcG9zaXRpb25zQXV0b2NvbXBsZXRlLmF1dG9jb21wbGV0ZSgnb3B0aW9uJywgJ3NvdXJjZScsIGRhdGEpO1xyXG4gICAgfVxyXG4gICAgKTsqL1xyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gc29tZSBMZWdhbCBwYWdlcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KVxyXG4gICAgLm9uKCdjbGljaycsICcudmlldy1wcml2YWN5LXBvbGljeScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBwb3B1cChiYXNlVXJsICsgJ0hlbHBDZW50ZXIvJFByaXZhY3lQb2xpY3kvJywgJ2xhcmdlJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnLnZpZXctdGVybXMtb2YtdXNlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBvcHVwKGJhc2VVcmwgKyAnSGVscENlbnRlci8kVGVybXNPZlVzZS8nLCAnbGFyZ2UnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuKiBQcm92aWRlciBXZWxjb21lIHBhZ2VcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIFNpbXBsZVNsaWRlciA9IHJlcXVpcmUoJ0xDL1NpbXBsZVNsaWRlcicpO1xyXG5cclxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24gcHJvdmlkZXJXZWxjb21lKCkge1xyXG4gICQoJy5Qcm92aWRlcldlbGNvbWUgLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24nKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciB0ID0gJCh0aGlzKSxcclxuICAgICAgc2xpZGVyID0gbmV3IFNpbXBsZVNsaWRlcih7XHJcbiAgICAgICAgZWxlbWVudDogdCxcclxuICAgICAgICBzZWxlY3RvcnM6IHtcclxuICAgICAgICAgIHNsaWRlczogJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLXNsaWRlcycsXHJcbiAgICAgICAgICBzbGlkZTogJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLXNsaWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY3VycmVudFNsaWRlQ2xhc3M6ICdqcy1pc0N1cnJlbnQnLFxyXG4gICAgICAgIGhyZWZQcmVmaXg6ICdnb1NsaWRlXycsXHJcbiAgICAgICAgLy8gRHVyYXRpb24gb2YgZWFjaCBzbGlkZSBpbiBtaWxsaXNlY29uZHNcclxuICAgICAgICBkdXJhdGlvbjogMTAwMFxyXG4gICAgICB9KTtcclxuXHJcbiAgICAvLyBTbGlkZSBzdGVwcyBhY3Rpb25zIGluaXRpYWxseSBoaWRkZW4sIHZpc2libGUgYWZ0ZXIgJ3N0YXJ0J1xyXG4gICAgdmFyIHNsaWRlc0FjdGlvbnMgPSB0LmZpbmQoJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLWFjdGlvbnMtc2xpZGVzJykuaGlkZSgpO1xyXG4gICAgdC5maW5kKCcuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbi1hY3Rpb25zLXN0YXJ0IC5zdGFydC1hY3Rpb24nKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQodGhpcykuaGlkZSgpO1xyXG4gICAgICBzbGlkZXNBY3Rpb25zLmZhZGVJbigxMDAwKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKipcclxuKiBXZWxjb21lIHBvcHVwXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIGJvb3RzdHJhcCB0b29sdGlwczpcclxucmVxdWlyZSgnYm9vdHN0cmFwJyk7XHJcbi8vVE9ETyBtb3JlIGRlcGVuZGVuY2llcz9cclxuXHJcbmV4cG9ydHMuc2hvdyA9IGZ1bmN0aW9uIHdlbGNvbWVQb3B1cCgpIHtcclxuICB2YXIgYyA9ICQoJyN3ZWxjb21lcG9wdXAnKTtcclxuICBpZiAoYy5sZW5ndGggPT09IDApIHJldHVybjtcclxuICB2YXIgc2tpcFN0ZXAxID0gYy5oYXNDbGFzcygnc2VsZWN0LXBvc2l0aW9uJyk7XHJcblxyXG4gIC8vIEluaXRcclxuICBpZiAoIXNraXBTdGVwMSkge1xyXG4gICAgYy5maW5kKCcucHJvZmlsZS1kYXRhLCAudGVybXMsIC5wb3NpdGlvbi1kZXNjcmlwdGlvbicpLmhpZGUoKTtcclxuICB9XHJcbiAgYy5maW5kKCdmb3JtJykuZ2V0KDApLnJlc2V0KCk7XHJcblxyXG4gIC8vIERlc2NyaXB0aW9uIHNob3ctdXAgb24gYXV0b2NvbXBsZXRlIHZhcmlhdGlvbnNcclxuICB2YXIgc2hvd1Bvc2l0aW9uRGVzY3JpcHRpb24gPSB7XHJcbiAgICAvKipcclxuICAgIFNob3cgZGVzY3JpcHRpb24gaW4gYSB0ZXh0YXJlYSB1bmRlciB0aGUgcG9zaXRpb24gc2luZ3VsYXIsXHJcbiAgICBpdHMgc2hvd2VkIG9uIGRlbWFuZC5cclxuICAgICoqL1xyXG4gICAgdGV4dGFyZWE6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgYy5maW5kKCcucG9zaXRpb24tZGVzY3JpcHRpb24nKVxyXG4gICAgICAuc2xpZGVEb3duKCdmYXN0JylcclxuICAgICAgLmZpbmQoJ3RleHRhcmVhJykudmFsKHVpLml0ZW0uZGVzY3JpcHRpb24pO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgU2hvdyBkZXNjcmlwdGlvbiBpbiBhIHRvb2x0aXAgdGhhdCBjb21lcyBmcm9tIHRoZSBwb3NpdGlvbiBzaW5ndWxhclxyXG4gICAgZmllbGRcclxuICAgICoqL1xyXG4gICAgdG9vbHRpcDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAkKHRoaXMpLnBvcG92ZXIoe1xyXG4gICAgICAgIHRpdGxlOiAnRG9lcyB0aGlzIHNvdW5kIGxpa2UgeW91PycsXHJcbiAgICAgICAgY29udGVudDogdWkuaXRlbS5kZXNjcmlwdGlvbixcclxuICAgICAgICBwbGFjZW1lbnQ6ICdsZWZ0J1xyXG4gICAgICB9KS5wb3BvdmVyKCdzaG93Jyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gUmUtZW5hYmxlIGF1dG9jb21wbGV0ZTpcclxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgYy5maW5kKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTsgfSwgNTAwKTtcclxuICBmdW5jdGlvbiBzZXR1cFBvc2l0aW9uQXV0b2NvbXBsZXRlKHNlbGV0Q2FsbGJhY2spIHtcclxuICAgIGMuZmluZCgnW25hbWU9am9idGl0bGVdJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgLy8gTm8gdmFsdWUsIG5vIGFjdGlvbiA6KFxyXG4gICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0udmFsdWUpIHJldHVybjtcclxuICAgICAgICAvLyBTYXZlIHRoZSBpZCAodmFsdWUpIGluIHRoZSBoaWRkZW4gZWxlbWVudFxyXG4gICAgICAgIGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF0nKS52YWwodWkuaXRlbS52YWx1ZSk7XHJcblxyXG4gICAgICAgIHNlbGV0Q2FsbGJhY2suY2FsbCh0aGlzLCBldmVudCwgdWkpO1xyXG5cclxuICAgICAgICAvLyBXZSB3YW50IHRvIHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSxcclxuICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHNldHVwUG9zaXRpb25BdXRvY29tcGxldGUoc2hvd1Bvc2l0aW9uRGVzY3JpcHRpb24udG9vbHRpcCk7XHJcbiAgYy5maW5kKCcjd2VsY29tZXBvcHVwTG9hZGluZycpLnJlbW92ZSgpO1xyXG5cclxuICAvLyBBY3Rpb25zXHJcbiAgYy5vbignY2hhbmdlJywgJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpOm5vdCguJyArIHRoaXMudmFsdWUgKyAnKScpLmhpZGUoKTtcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlLCBoZWFkZXIgLnByZXNlbnRhdGlvbicpLnNsaWRlVXAoJ2Zhc3QnKTtcclxuICAgIGMuZmluZCgnLnRlcm1zLCAucHJvZmlsZS1kYXRhJykuc2xpZGVEb3duKCdmYXN0Jyk7XHJcbiAgICAvLyBUZXJtcyBvZiB1c2UgZGlmZmVyZW50IGZvciBwcm9maWxlIHR5cGVcclxuICAgIGlmICh0aGlzLnZhbHVlID09ICdjdXN0b21lcicpXHJcbiAgICAgIGMuZmluZCgnYS50ZXJtcy1vZi11c2UnKS5kYXRhKCd0b29sdGlwLXVybCcsIG51bGwpO1xyXG4gICAgLy8gQ2hhbmdlIGZhY2Vib29rIHJlZGlyZWN0IGxpbmtcclxuICAgIHZhciBmYmMgPSBjLmZpbmQoJy5mYWNlYm9vay1jb25uZWN0Jyk7XHJcbiAgICB2YXIgYWRkUmVkaXJlY3QgPSAnY3VzdG9tZXJzJztcclxuICAgIGlmICh0aGlzLnZhbHVlID09ICdwcm92aWRlcicpXHJcbiAgICAgIGFkZFJlZGlyZWN0ID0gJ3Byb3ZpZGVycyc7XHJcbiAgICBmYmMuZGF0YSgncmVkaXJlY3QnLCBmYmMuZGF0YSgncmVkaXJlY3QnKSArIGFkZFJlZGlyZWN0KTtcclxuICAgIGZiYy5kYXRhKCdwcm9maWxlJywgdGhpcy52YWx1ZSk7XHJcblxyXG4gICAgLy8gU2V0IHZhbGlkYXRpb24tcmVxdWlyZWQgZm9yIGRlcGVuZGluZyBvZiBwcm9maWxlLXR5cGUgZm9ybSBlbGVtZW50czpcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaS4nICsgdGhpcy52YWx1ZSArICcgaW5wdXQ6bm90KFtkYXRhLXZhbF0pOm5vdChbdHlwZT1oaWRkZW5dKScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtdmFsLXJlcXVpcmVkJywgJycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtdmFsJywgdHJ1ZSk7XHJcbiAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxuICB9KTtcclxuICBjLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLmFqYXgnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBzZXR1cFBvc2l0aW9uQXV0b2NvbXBsZXRlKHNob3dQb3NpdGlvbkRlc2NyaXB0aW9uLnRvb2x0aXApO1xyXG4gICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXTpjaGVja2VkJykuY2hhbmdlKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIElmIHByb2ZpbGUgdHlwZSBpcyBwcmVmaWxsZWQgYnkgcmVxdWVzdDpcclxuICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdOmNoZWNrZWQnKS5jaGFuZ2UoKTtcclxufTtcclxuIl19
