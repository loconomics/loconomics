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
},{"./LcUrl":10,"./blockPresets":43,"./loader":70,"./popup":76,"./redirectTo":78}],10:[function(require,module,exports){
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
},{"./mathUtils":71}],12:[function(require,module,exports){
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
},{}],"StringFormat":[function(require,module,exports){
module.exports=require('KqXDvj');
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
},{"./jquery.reload":66}],19:[function(require,module,exports){
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
},{"./jquery.hasScrollBar":63}],21:[function(require,module,exports){
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
},{"./ajaxCallbacks":28,"./blockPresets":43,"./changesNotification":"f5kckb","./popup":76,"./redirectTo":78,"./validationHelper":"kqf9lt"}],"LC/TimeSpan":[function(require,module,exports){
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

},{"./TimeSpan":"rqZkA9","./mathUtils":71}],"LC/TimeSpanExtra":[function(require,module,exports){
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

},{"./TimeSpan":"rqZkA9","./mathUtils":71,"./tooltips":"UTsC2v"}],28:[function(require,module,exports){
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
},{"./changesNotification":"f5kckb","./createIframe":46,"./moveFocusTo":"9RKOGW","./popup":76,"./redirectTo":78,"./smoothBoxBlock":"KQGzNM","./validationHelper":"kqf9lt"}],29:[function(require,module,exports){
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
},{"./ajaxCallbacks":28,"./blockPresets":43,"./changesNotification":"f5kckb","./validationHelper":"kqf9lt"}],30:[function(require,module,exports){
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
},{"./numberUtils":74}],31:[function(require,module,exports){
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
  Monthly calendar class
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601'),
  LcWidget = require('../CX/LcWidget'),
  extend = require('../CX/extend');
var utils = require('./utils');

/**
  Private utils
**/

/**
  Prefetch next month (based on the given dates)
  Note: this code is very similar to utils.weeklyCheckAndPrefetch
**/
function monthlyCheckAndPrefetch(monthly, currentDatesRange) {
  var nextDatesRange = utils.date.nextMonthWeeks(currentDatesRange.start);

  if (!utils.monthlyIsDataInCache(monthly, nextDatesRange)) {
    // Prefetching next week in advance
    var prefetchQuery = datesToQuery(nextDatesRange);
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
  var datesRange = utils.date.nextMonthWeeks(monthly.datesRange.start, months);

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
    .fetchData(datesToQuery(datesRange))
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
**/
function checkCurrentMonth($el, startDate, monthly) {
  var yep = dateUtils.isInCurrentMonth(date);
  $el.toggleClass(monthly.classes.currentWeek, yep);
  $el.find('.' + monthly.classes.prevAction).prop('disabled', yep);
}

/**
  Update the calendar dates cells for 'day of the month' values
  and number of weeks/rows
**/
function updateDatesCells(monthly) {
  // TODO
}

function getCellByDate(monthly, date) {
  // TODO
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
  monthlyCalendar: 'AvailabilityCalendar--monthly'
}),
texts: utils.weeklyTexts,
url: '/calendar/get-availability/',

// Our 'view' will be a subset of the data,
// delimited by the next property, a dates range:
datesRange: { start: null, end: null },
bindData: function bindDataMonthly(datesRange) {
  this.datesRange = datesRange = datesRange || this.datesRange;
  var 
      slotsContainer = this.$el.find('.' + this.classes.slots),
      slots = slotsContainer.find('td');

  checkCurrentMonth(this.$el, datesRange.start, this);

  updateDatesCells(this);

  // Remove any previous status class from all slots
  for (var s = 0; s < utils.statusTypes.length; s++) {
    slots.removeClass(this.classes.slotStatusPrefix + utils.statusTypes[s] || '_');
  }

  var that = this;

  // TODO Re-do for monthly
  utils.date.eachDateInRange(datesRange.start, datesRange.end, function (date, i) {
    var datekey = dateISO.dateLocal(date, true);
    var dateStatus = that.data.slots[datekey];

    var slot = getCellByDate(that, date);

    slot.addClass(that.classes.slotStatusPrefix + dateStatus);
  });
}
},
// Constructor:
function Monthly(element, options) {
  // Reusing base constructor too for initializing:
  LcWidget.call(this, element, options);
  // To use this in closures:
  var that = this;

  this.user = this.$el.data('calendar-user');
  this.query = {
    user: this.user,
    type: 'monthly'
  };

  // Start fetching current month
  var firstDates = utils.date.currentMonthWeeks();
  this.fetchData(utils.datesToQuery(firstDates)).done(function () {
    that.bindData(firstDates);
    // Prefetching next month in advance
    monthlyCheckAndPrefetch(that, firstDates);
  });

  utils.checkCurrentMonth(this.$el, firstDates.start, this);

  // Set handlers for prev-next actions:
  this.$el.on('click', '.' + this.classes.prevAction, function prev() {
    moveBindMonth(that, -1);
  });
  this.$el.on('click', '.' + this.classes.nextAction, function next() {
    moveBindMonth(that, 1);
  });

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

},{"../CX/LcWidget":5,"../CX/extend":6,"./utils":42,"LC/dateISO8601":"0dIKTs"}],34:[function(require,module,exports){
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

},{"../CX/LcWidget":5,"../CX/extend":6,"./utils":42,"LC/dateISO8601":"0dIKTs"}],35:[function(require,module,exports){
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
},{"../CX/LcWidget":5,"../CX/extend":6,"../jquery.bounds":62,"./clearCurrentSelection":36,"./makeUnselectable":41,"./utils":42,"LC/dateISO8601":"0dIKTs"}],36:[function(require,module,exports){
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
},{}],37:[function(require,module,exports){
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
**/
function currentMonthWeeks(baseDate) {
  var r = currentMonth(baseDate);
  return {
    start: getFirstWeekDate(r.start),
    end: getLastWeekDate(r.end)
  };
}
exports.currentMonthWeeks = currentMonthWeeks;

function nextMonthWeeks(fromDate, amountMonths) {
  return currentMonthWeeks(nextMonth(fromDate, amountMonths));
}
exports.nextMonthWeeks = nextMonthWeeks;

function previousMonthWeeks(fromDate, amountMonths) {
  return currentMonthWeeks(previousMonth(fromDate, amountMonths));
}
exports.previousMonthWeeks = previousMonthWeeks;

},{"LC/dateISO8601":"0dIKTs"}],38:[function(require,module,exports){
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
},{"./Monthly":33,"./Weekly":34,"./WorkHours":35}],"LC/availabilityCalendar":[function(require,module,exports){
module.exports=require('xu1BAO');
},{}],41:[function(require,module,exports){
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
},{}],42:[function(require,module,exports){
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
  legendUnavailable: 'AvailabilityCalendar-legend-unavailable'
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

},{"./dateUtils":37,"./formatDate":38,"LC/dateISO8601":"0dIKTs"}],43:[function(require,module,exports){
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
},{"./getXPath":54,"./jqueryUtils":"7/CV3J"}],46:[function(require,module,exports){
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


},{}],47:[function(require,module,exports){
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

},{"./changesNotification":"f5kckb","./getText":"qf5Iz3","./jquery.xtsh":67,"./moveFocusTo":"9RKOGW","./smoothBoxBlock":"KQGzNM"}],"LC/dateISO8601":[function(require,module,exports){
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
},{}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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
},{"./jqueryUtils":"7/CV3J"}],54:[function(require,module,exports){
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

},{"./loader":70}],"LC/googleMapReady":[function(require,module,exports){
module.exports=require('ygr/Yz');
},{}],57:[function(require,module,exports){
/* GUID Generator
 */
module.exports = function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
},{}],58:[function(require,module,exports){
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
},{}],59:[function(require,module,exports){
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
},{}],60:[function(require,module,exports){
/* Returns true when str is
- null
- empty string
- only white spaces string
*/
module.exports = function isEmptyString(str) {
    return !(/\S/g.test(str || ""));
};
},{}],61:[function(require,module,exports){
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
},{}],62:[function(require,module,exports){
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
},{}],63:[function(require,module,exports){
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
},{}],64:[function(require,module,exports){
/** Checks if current element or one of the current set of elements has
a parent that match the element or expression given as first parameter
**/
var $ = jQuery || require('jquery');
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};
},{}],65:[function(require,module,exports){
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
},{}],66:[function(require,module,exports){
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
},{"./smoothBoxBlock":"KQGzNM"}],67:[function(require,module,exports){
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
},{}],70:[function(require,module,exports){
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
},{}],71:[function(require,module,exports){
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
},{}],74:[function(require,module,exports){
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
},{"./i18n":59,"./mathUtils":71}],75:[function(require,module,exports){
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
},{}],76:[function(require,module,exports){
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
},{"./createIframe":46,"./moveFocusTo":"9RKOGW","./smoothBoxBlock":"KQGzNM"}],77:[function(require,module,exports){
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
},{}],78:[function(require,module,exports){
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

},{}],79:[function(require,module,exports){
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
},{"./autoFocus":31,"./jquery.xtsh":67,"./jqueryUtils":"7/CV3J","./moveFocusTo":"9RKOGW"}],"LC/smoothBoxBlock":[function(require,module,exports){
module.exports=require('KQGzNM');
},{}],"LC/tooltips":[function(require,module,exports){
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

},{"./jquery.isChildOf":64,"./jquery.outerHtml":65,"./sanitizeWhitespaces":79}],84:[function(require,module,exports){
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
},{}],87:[function(require,module,exports){
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
},{}],88:[function(require,module,exports){
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
},{"../LC/Array.remove":1,"../LC/Cookie":7,"../LC/LcUrl":10,"../LC/Price":11,"../LC/String.prototype.contains":15,"../LC/StringFormat":"KqXDvj","../LC/TabbedUX":20,"../LC/TabbedUX.autoload":18,"../LC/TabbedUX.changesNotification":19,"../LC/TabbedUX.sliderTabs":21,"../LC/TabbedUX.wizard":22,"../LC/TimeSpan":"rqZkA9","../LC/TimeSpanExtra":"5OLBBz","../LC/UISliderLabels":27,"../LC/ajaxCallbacks":28,"../LC/ajaxForms":29,"../LC/autoCalculate":30,"../LC/autoFocus":31,"../LC/autofillSubmenu":32,"../LC/availabilityCalendar":"xu1BAO","../LC/blockPresets":43,"../LC/changesNotification":"f5kckb","../LC/crudl":47,"../LC/datePicker":50,"../LC/dateToInterchangeableString":51,"../LC/getText":"qf5Iz3","../LC/getXPath":54,"../LC/googleMapReady":"ygr/Yz","../LC/guidGenerator":57,"../LC/hasConfirmSupport":58,"../LC/i18n":59,"../LC/isEmptyString":60,"../LC/jquery.are":61,"../LC/jquery.hasScrollBar":63,"../LC/jquery.reload":66,"../LC/jquery.xtsh":67,"../LC/jqueryUtils":"7/CV3J","../LC/loader":70,"../LC/mathUtils":71,"../LC/moveFocusTo":"9RKOGW","../LC/numberUtils":74,"../LC/placeholder-polyfill":75,"../LC/popup":76,"../LC/postalCodeServerValidation":77,"../LC/sanitizeWhitespaces":79,"../LC/smoothBoxBlock":"KQGzNM","../LC/tooltips":"UTsC2v","../LC/urlUtils":84,"../LC/validationHelper":"kqf9lt","./accountPopups":87,"./availabilityCalendarWidget":89,"./faqsPopups":90,"./home":91,"./legalPopups":92,"./providerWelcome":93,"./welcomePopup":94}],89:[function(require,module,exports){
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
},{"../LC/dateToInterchangeableString":51,"../LC/jquery.reload":66,"../LC/smoothBoxBlock":"KQGzNM"}],90:[function(require,module,exports){
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
},{}],91:[function(require,module,exports){
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
},{}],92:[function(require,module,exports){
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
},{}],93:[function(require,module,exports){
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

},{"LC/SimpleSlider":"aFoCK0"}],94:[function(require,module,exports){
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
      .on('keypress..description-tooltip', function () {
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

},{}]},{},[88,"cwp+TC","0dIKTs","aFoCK0"])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0FycmF5LnJlbW92ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9CaW5kYWJsZUNvbXBvbmVudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9Db21wb25lbnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ1gvRGF0YVNvdXJjZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9MY1dpZGdldC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9DWC9leHRlbmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvQ29va2llLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0ZhY2Vib29rQ29ubmVjdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9MY1VybC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9QcmljZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9SZWdFeHAucXVvdGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU2ltcGxlU2xpZGVyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nRm9ybWF0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmF1dG9sb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguc2xpZGVyVGFicy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC53aXphcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW5FeHRyYS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9VSVNsaWRlckxhYmVscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Q2FsbGJhY2tzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhGb3Jtcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvQ2FsY3VsYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9Gb2N1cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvZmlsbFN1Ym1lbnUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvTW9udGhseS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9XZWVrbHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvV29ya0hvdXJzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL2NsZWFyQ3VycmVudFNlbGVjdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9kYXRlVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIvZm9ybWF0RGF0ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9pbmRleC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhci9tYWtlVW5zZWxlY3RhYmxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyL3V0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2Jsb2NrUHJlc2V0cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NyZWF0ZUlmcmFtZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlSVNPODYwMS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9kYXRlUGlja2VyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9nZXRUZXh0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFhQYXRoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dvb2dsZU1hcFJlYWR5LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2d1aWRHZW5lcmF0b3IuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvaGFzQ29uZmlybVN1cHBvcnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvaTE4bi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pc0VtcHR5U3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5hcmUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmJvdW5kcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5pc0NoaWxkT2YuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lm91dGVySHRtbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkucmVsb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS54dHNoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeVV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2xvYWRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tYXRoVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbnVtYmVyVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcGxhY2Vob2xkZXItcG9seWZpbGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Ntb290aEJveEJsb2NrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Rvb2x0aXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3VybFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3ZhbGlkYXRpb25IZWxwZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FjY291bnRQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FwcC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2ZhcXNQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2xlZ2FsUG9wdXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9wcm92aWRlcldlbGNvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL3dlbGNvbWVQb3B1cC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDelFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBcnJheSBSZW1vdmUgLSBCeSBKb2huIFJlc2lnIChNSVQgTGljZW5zZWQpXHJcbi8qQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xyXG5JYWdvU1JMOiBpdCBzZWVtcyBpbmNvbXBhdGlibGUgd2l0aCBNb2Rlcm5penIgbG9hZGVyIGZlYXR1cmUgbG9hZGluZyBaZW5kZXNrIHNjcmlwdCxcclxubW92ZWQgZnJvbSBwcm90b3R5cGUgdG8gYSBjbGFzcy1zdGF0aWMgbWV0aG9kICovXHJcbmZ1bmN0aW9uIGFycmF5UmVtb3ZlKGFuQXJyYXksIGZyb20sIHRvKSB7XHJcbiAgICB2YXIgcmVzdCA9IGFuQXJyYXkuc2xpY2UoKHRvIHx8IGZyb20pICsgMSB8fCBhbkFycmF5Lmxlbmd0aCk7XHJcbiAgICBhbkFycmF5Lmxlbmd0aCA9IGZyb20gPCAwID8gYW5BcnJheS5sZW5ndGggKyBmcm9tIDogZnJvbTtcclxuICAgIHJldHVybiBhbkFycmF5LnB1c2guYXBwbHkoYW5BcnJheSwgcmVzdCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhcnJheVJlbW92ZTtcclxufSBlbHNlIHtcclxuICAgIEFycmF5LnJlbW92ZSA9IGFycmF5UmVtb3ZlO1xyXG59IiwiLyoqXHJcbiAgQmluZGFibGUgVUkgQ29tcG9uZW50LlxyXG4gIEl0IHJlbGllcyBvbiBDb21wb25lbnQgYnV0IGFkZHMgRGF0YVNvdXJjZSBjYXBhYmlsaXRpZXNcclxuKiovXHJcbnZhciBEYXRhU291cmNlID0gcmVxdWlyZSgnLi9EYXRhU291cmNlJyk7XHJcbnZhciBDb21wb25lbnQgPSByZXF1aXJlKCcuL0NvbXBvbmVudCcpO1xyXG52YXIgZXh0ZW5kID0gcmVxdWlyZSgnLi9leHRlbmQnKS5leHRlbmQ7XHJcblxyXG4vKipcclxuUmV1c2luZyB0aGUgb3JpZ2luYWwgZmV0Y2hEYXRhIG1ldGhvZCBidXQgYWRkaW5nIGNsYXNzZXMgdG8gb3VyXHJcbmNvbXBvbmVudCBlbGVtZW50IGZvciBhbnkgdmlzdWFsIG5vdGlmaWNhdGlvbiBvZiB0aGUgZGF0YSBsb2FkaW5nLlxyXG5NZXRob2QgZ2V0IGV4dGVuZGVkIHdpdGggaXNQcmVmZXRjaGluZyBtZXRob2QgZm9yIGRpZmZlcmVudFxyXG5jbGFzc2VzL25vdGlmaWNhdGlvbnMgZGVwZW5kYW50IG9uIHRoYXQgZmxhZywgYnkgZGVmYXVsdCBmYWxzZTpcclxuKiovXHJcbnZhciBjb21wb25lbnRGZXRjaERhdGEgPSBmdW5jdGlvbiBiaW5kYWJsZUNvbXBvbmVudEZldGNoRGF0YShxdWVyeURhdGEsIG1vZGUsIGlzUHJlZmV0Y2hpbmcpIHtcclxuICB2YXIgY2wgPSBpc1ByZWZldGNoaW5nID8gdGhpcy5jbGFzc2VzLnByZWZldGNoaW5nIDogdGhpcy5jbGFzc2VzLmZldGNoaW5nO1xyXG4gIHRoaXMuJGVsLmFkZENsYXNzKGNsKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcblxyXG4gIHZhciByZXEgPSBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaERhdGEuY2FsbCh0aGlzLCBxdWVyeURhdGEsIG1vZGUpXHJcbiAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC4kZWwucmVtb3ZlQ2xhc3MoY2wgfHwgJ18nKVxyXG4gICAgLy8gUmVtb3ZlIGVycm9yIGNsYXNzIHRvbyAodG8gZmlsbCB0aGUgY2FzZSBvZiBhIHByZXZpb3VzIGVycm9yKVxyXG4gICAgLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5oYXNEYXRhRXJyb3IgfHwgJ18nKTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHJlcTtcclxufTtcclxuLyoqXHJcblJlcGxhY2luZywgYnV0IHJldXNpbmcgaW50ZXJuYWxzLCB0aGUgZGVmYXVsdCBvbmVycm9yIGNhbGxiYWNrIGZvciB0aGVcclxuZmV0Y2hEYXRhIGZ1bmN0aW9uIHRvIGFkZCBub3RpZmljYXRpb24gY2xhc3NlcyB0byBvdXIgY29tcG9uZW50IG1vZGVsXHJcbioqL1xyXG5jb21wb25lbnRGZXRjaERhdGEub25lcnJvciA9IGZ1bmN0aW9uIGJpbmRhYmxlQ29tcG9uZW50RmVjaERhdGFPbmVycm9yKHgsIHMsIGUpIHtcclxuICBEYXRhU291cmNlLnByb3RvdHlwZS5mZXRjaERhdGEub25lcnJvci5jYWxsKHRoaXMsIHgsIHMsIGUpO1xyXG4gIC8vIEFkZCBlcnJvciBjbGFzczpcclxuICB0aGlzLiRlbFxyXG4gIC5hZGRDbGFzcyh0aGlzLmNsYXNzZXMuaGFzRGF0YUVycm9yKVxyXG4gIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKVxyXG4gIC5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMucHJlZmV0Y2hpbmcgfHwgJ18nKTtcclxufTtcclxuXHJcbi8qKlxyXG4gIEJpbmRhYmxlQ29tcG9uZW50IGNsYXNzXHJcbioqL1xyXG52YXIgQmluZGFibGVDb21wb25lbnQgPSBDb21wb25lbnQuZXh0ZW5kKFxyXG4gIERhdGFTb3VyY2UucHJvdG90eXBlLFxyXG4gIC8vIFByb3RvdHlwZVxyXG4gIHtcclxuICAgIGNsYXNzZXM6IHtcclxuICAgICAgZmV0Y2hpbmc6ICdpcy1sb2FkaW5nJyxcclxuICAgICAgcHJlZmV0Y2hpbmc6ICdpcy1wcmVsb2FkaW5nJyxcclxuICAgICAgZGlzYWJsZWQ6ICdpcy1kaXNhYmxlZCcsXHJcbiAgICAgIGhhc0RhdGFFcnJvcjogJ2hhcy1kYXRhRXJyb3InXHJcbiAgICB9LFxyXG4gICAgZmV0Y2hEYXRhOiBjb21wb25lbnRGZXRjaERhdGEsXHJcbiAgICAvLyBXaGF0IGF0dHJpYnV0ZSBuYW1lIHVzZSB0byBtYXJrIGVsZW1lbnRzIGluc2lkZSB0aGUgY29tcG9uZW50XHJcbiAgICAvLyB3aXRoIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBzb3VyY2UgdG8gYmluZC5cclxuICAgIC8vIFRoZSBwcmVmaXggJ2RhdGEtJyBpbiBjdXN0b20gYXR0cmlidXRlcyBpcyByZXF1aXJlZCBieSBodG1sNSxcclxuICAgIC8vIGp1c3Qgc3BlY2lmeSB0aGUgc2Vjb25kIHBhcnQsIGJlaW5nICdiaW5kJyB0aGUgYXR0cmlidXRlXHJcbiAgICAvLyBuYW1lIHRvIHVzZSBpcyAnZGF0YS1iaW5kJ1xyXG4gICAgZGF0YUJpbmRBdHRyaWJ1dGU6ICdiaW5kJyxcclxuICAgIC8vIERlZmF1bHQgYmluZERhdGEgaW1wbGVtZW50YXRpb24sIGNhbiBiZSByZXBsYWNlIG9uIGV4dGVuZGVkIGNvbXBvbmVudHNcclxuICAgIC8vIHRvIHNvbWV0aGluZyBtb3JlIGNvbXBsZXggKGxpc3QvY29sbGVjdGlvbnMsIHN1Yi1vYmplY3RzLCBjdXN0b20gc3RydWN0dXJlc1xyXG4gICAgLy8gYW5kIHZpc3VhbGl6YXRpb24gLS1rZWVwIGFzIHBvc3NpYmxlIHRoZSB1c2Ugb2YgZGF0YUJpbmRBdHRyaWJ1dGUgZm9yIHJldXNhYmxlIGNvZGUpLlxyXG4gICAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiB3b3JrcyBmaW5lIGZvciBkYXRhIGFzIHBsYWluIG9iamVjdCB3aXRoIFxyXG4gICAgLy8gc2ltcGxlIHR5cGVzIGFzIHByb3BlcnRpZXMgKG5vdCBvYmplY3RzIG9yIGFycmF5cyBpbnNpZGUgdGhlbSkuXHJcbiAgICBiaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGEoKSB7XHJcbiAgICAgIGlmICghdGhpcy5kYXRhKSByZXR1cm47XHJcbiAgICAgIC8vIENoZWNrIGV2ZXJ5IGVsZW1lbnQgaW4gdGhlIGNvbXBvbmVudCB3aXRoIGEgYmluZFxyXG4gICAgICAvLyBwcm9wZXJ0eSBhbmQgdXBkYXRlIGl0IHdpdGggdGhlIHZhbHVlIG9mIHRoYXQgcHJvcGVydHlcclxuICAgICAgLy8gZnJvbSB0aGUgZGF0YSBzb3VyY2VcclxuICAgICAgdmFyIGF0dCA9IHRoaXMuZGF0YUJpbmRBdHRyaWJ1dGU7XHJcbiAgICAgIHZhciBhdHRyU2VsZWN0b3IgPSAnW2RhdGEtJyArIGF0dCArICddJztcclxuICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICB0aGlzLiRlbC5maW5kKGF0dHJTZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKSxcclxuICAgICAgICAgIHByb3AgPSAkdC5kYXRhKGF0dCksXHJcbiAgICAgICAgICBiaW5kZWRWYWx1ZSA9IHRoYXQuZGF0YVtwcm9wXTtcclxuXHJcbiAgICAgICAgaWYgKCR0LmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICR0LnZhbChiaW5kZWRWYWx1ZSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgJHQudGV4dChiaW5kZWRWYWx1ZSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgLy8gQ29uc3RydWN0b3JcclxuICBmdW5jdGlvbiBCaW5kYWJsZUNvbXBvbmVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICBDb21wb25lbnQuY2FsbCh0aGlzLCBlbGVtZW50LCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLmRhdGEgPSB0aGlzLiRlbC5kYXRhKCdzb3VyY2UnKSB8fCB0aGlzLmRhdGEgfHwge307XHJcbiAgICBpZiAodHlwZW9mICh0aGlzLmRhdGEpID09ICdzdHJpbmcnKVxyXG4gICAgICB0aGlzLmRhdGEgPSBKU09OLnBhcnNlKHRoaXMuZGF0YSk7XHJcblxyXG4gICAgLy8gT24gaHRtbCBzb3VyY2UgdXJsIGNvbmZpZ3VyYXRpb246XHJcbiAgICB0aGlzLnVybCA9IHRoaXMuJGVsLmRhdGEoJ3NvdXJjZS11cmwnKSB8fCB0aGlzLnVybDtcclxuXHJcbiAgICAvLyBUT0RPOiAnY2hhbmdlJyBldmVudCBoYW5kbGVycyBvbiBmb3JtcyB3aXRoIGRhdGEtYmluZCB0byB1cGRhdGUgaXRzIHZhbHVlIGF0IHRoaXMuZGF0YVxyXG4gICAgLy8gVE9ETzogYXV0byAnYmluZERhdGEnIG9uIGZldGNoRGF0YSBlbmRzPyBjb25maWd1cmFibGUsIGJpbmREYXRhTW9kZXsgaW5tZWRpYXRlLCBub3RpZnkgfVxyXG4gIH1cclxuKTtcclxuXHJcbi8vIFB1YmxpYyBtb2R1bGU6XHJcbm1vZHVsZS5leHBvcnRzID0gQmluZGFibGVDb21wb25lbnQ7IiwiLyoqIENvbXBvbmVudCBjbGFzczogd3JhcHBlciBmb3JcclxuICB0aGUgbG9naWMgYW5kIGJlaGF2aW9yIGFyb3VuZFxyXG4gIGEgRE9NIGVsZW1lbnRcclxuKiovXHJcbnZhciBleHRlbmQgPSByZXF1aXJlKCcuL2V4dGVuZCcpO1xyXG5cclxuZnVuY3Rpb24gQ29tcG9uZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICB0aGlzLmVsID0gZWxlbWVudDtcclxuICB0aGlzLiRlbCA9ICQoZWxlbWVudCk7XHJcbiAgZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIC8vIFVzZSB0aGUgalF1ZXJ5ICdkYXRhJyBzdG9yYWdlIHRvIHByZXNlcnZlIGEgcmVmZXJlbmNlXHJcbiAgLy8gdG8gdGhpcyBpbnN0YW5jZSAodXNlZnVsIHRvIHJldHJpZXZlIGl0IGZyb20gZG9jdW1lbnQpXHJcbiAgdGhpcy4kZWwuZGF0YSgnY29tcG9uZW50JywgdGhpcyk7XHJcbn1cclxuXHJcbmV4dGVuZC5wbHVnSW4oQ29tcG9uZW50KTtcclxuZXh0ZW5kLnBsdWdJbihDb21wb25lbnQucHJvdG90eXBlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29tcG9uZW50OyIsIi8qKlxyXG4gIERhdGFTb3VyY2UgY2xhc3MgdG8gc2ltcGxpZnkgZmV0Y2hpbmcgZGF0YSBhcyBKU09OXHJcbiAgdG8gZmlsbCBhIGxvY2FsIGNhY2hlLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGZldGNoSlNPTiA9ICQuZ2V0SlNPTixcclxuICAgIGV4dGVuZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICQuZXh0ZW5kLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpOyB9O1xyXG5cclxuLy8gVE9ETzogcmVwbGFjZSBlYWNoIHByb3BlcnR5IG9mIGZ1bmN0aW9ucyBieSBpbnN0YW5jZSBwcm9wZXJ0aWVzLCBzaW5jZSB0aGF0IHByb3BlcnRpZXMgYmVjb21lXHJcbi8vIHNoYXJlZCBiZXR3ZWVuIGluc3RhbmNlcyBhbmQgaXMgbm90IHdhbnRlZFxyXG5cclxudmFyIHJlcU1vZGVzID0gRGF0YVNvdXJjZS5yZXF1ZXN0TW9kZXMgPSB7XHJcbiAgLy8gUGFyYWxsZWwgcmVxdWVzdCwgbm8gbWF0dGVyIG9mIG90aGVyc1xyXG4gIG11bHRpcGxlOiAwLFxyXG4gIC8vIFdpbGwgYXZvaWQgYSByZXF1ZXN0IGlmIHRoZXJlIGlzIG9uZSBydW5uaW5nXHJcbiAgc2luZ2xlOiAxLFxyXG4gIC8vIExhdGVzdCByZXF1ZXQgd2lsbCByZXBsYWNlIGFueSBwcmV2aW91cyBvbmUgKHByZXZpb3VzIHdpbGwgYWJvcnQpXHJcbiAgcmVwbGFjZTogMlxyXG59O1xyXG5cclxudmFyIHVwZE1vZGVzID0gRGF0YVNvdXJjZS51cGRhdGVNb2RlcyA9IHtcclxuICAvLyBFdmVyeSBuZXcgZGF0YSB1cGRhdGUsIG5ldyBjb250ZW50IGlzIGFkZGVkIGluY3JlbWVudGFsbHlcclxuICAvLyAob3ZlcndyaXRlIGNvaW5jaWRlbnQgY29udGVudCwgYXBwZW5kIG5ldyBjb250ZW50LCBvbGQgY29udGVudFxyXG4gIC8vIGdldCBpbiBwbGFjZSlcclxuICBpbmNyZW1lbnRhbDogMCxcclxuICAvLyBPbiBuZXcgZGF0YSB1cGRhdGUsIG5ldyBkYXRhIHRvdGFsbHkgcmVwbGFjZSB0aGUgcHJldmlvdXMgb25lXHJcbiAgcmVwbGFjZW1lbnQ6IDFcclxufTtcclxuXHJcbi8qKlxyXG5VcGRhdGUgdGhlIGRhdGEgc3RvcmUgb3IgY2FjaGUgd2l0aCB0aGUgZ2l2ZW4gb25lLlxyXG5UaGVyZSBhcmUgZGlmZmVyZW50IG1vZGVzLCB0aGlzIG1hbmFnZXMgdGhhdCBsb2dpYyBhbmRcclxuaXRzIG93biBjb25maWd1cmF0aW9uLlxyXG5JcyBkZWNvdXBsZWQgZnJvbSB0aGUgcHJvdG90eXBlIGJ1dFxyXG5pdCB3b3JrcyBvbmx5IGFzIHBhcnQgb2YgYSBEYXRhU291cmNlIGluc3RhbmNlLlxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGF0YShkYXRhLCBtb2RlKSB7XHJcbiAgc3dpdGNoIChtb2RlIHx8IHRoaXMudXBkYXRlRGF0YS5kZWZhdWx0VXBkYXRlTW9kZSkge1xyXG5cclxuICAgIGNhc2UgdXBkTW9kZXMucmVwbGFjZW1lbnQ6XHJcbiAgICAgIHRoaXMuZGF0YSA9IGRhdGE7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIC8vY2FzZSB1cGRNb2Rlcy5pbmNyZW1lbnRhbDogIFxyXG4gICAgZGVmYXVsdDpcclxuICAgICAgLy8gSW4gY2FzZSBpbml0aWFsIGRhdGEgaXMgbnVsbCwgYXNzaWduIHRoZSByZXN1bHQgdG8gaXRzZWxmOlxyXG4gICAgICB0aGlzLmRhdGEgPSBleHRlbmQodGhpcy5kYXRhLCBkYXRhKTtcclxuICAgICAgYnJlYWs7XHJcbiAgfVxyXG59XHJcblxyXG4vKiogRGVmYXVsdCB2YWx1ZSBmb3IgdGhlIGNvbmZpZ3VyYWJsZSB1cGRhdGUgbW9kZTpcclxuKiovXHJcbnVwZGF0ZURhdGEuZGVmYXVsdFVwZGF0ZU1vZGUgPSB1cGRNb2Rlcy5pbmNyZW1lbnRhbDtcclxuXHJcbi8qKlxyXG5GZXRjaCB0aGUgZGF0YSBmcm9tIHRoZSBzZXJ2ZXIuXHJcbkhlcmUgaXMgZGVjb3VwbGVkIGZyb20gdGhlIHJlc3Qgb2YgdGhlIHByb3RvdHlwZSBmb3JcclxuY29tbW9kaXR5LCBidXQgaXQgY2FuIHdvcmtzIG9ubHkgYXMgcGFydCBvZiBhIERhdGFTb3VyY2UgaW5zdGFuY2UuXHJcbioqL1xyXG5mdW5jdGlvbiBmZXRjaERhdGEocXVlcnksIG1vZGUpIHtcclxuICBxdWVyeSA9IGV4dGVuZCh7fSwgdGhpcy5xdWVyeSwgcXVlcnkpO1xyXG4gIHN3aXRjaCAobW9kZSB8fCB0aGlzLmZldGNoRGF0YS5kZWZhdWx0UmVxdWVzdE1vZGUpIHtcclxuXHJcbiAgICBjYXNlIHJlcU1vZGVzLnNpbmdsZTpcclxuICAgICAgaWYgKHRoaXMuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCkgcmV0dXJuIG51bGw7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgcmVxTW9kZXMucmVwbGFjZTpcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0c1tpXS5hYm9ydCgpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7IH1cclxuICAgICAgICB0aGlzLmZldGNoRGF0YS5yZXF1ZXN0cyA9IFtdO1xyXG4gICAgICB9XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIC8vIEp1c3QgZG8gbm90aGluZyBmb3IgbXVsdGlwbGUgb3IgZGVmYXVsdCAgICAgXHJcbiAgICAvL2Nhc2UgcmVxTW9kZXMubXVsdGlwbGU6ICBcclxuICAgIC8vZGVmYXVsdDogXHJcbiAgfVxyXG5cclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdmFyIHJlcSA9IHRoaXMuZmV0Y2hEYXRhLnByb3h5KFxyXG4gICAgdGhpcy51cmwsXHJcbiAgICBxdWVyeSxcclxuICAgIGZ1bmN0aW9uIChkYXRhLCB0LCB4aHIpIHtcclxuICAgICAgdmFyIHJldCA9IHRoYXQudXBkYXRlRGF0YShkYXRhKTtcclxuICAgICAgdGhhdC5mZXRjaERhdGEucmVxdWVzdHMuc3BsaWNlKHRoYXQuZmV0Y2hEYXRhLnJlcXVlc3RzLmluZGV4T2YocmVxKSwgMSk7XHJcbiAgICAgIC8vZGVsZXRlIGZldGNoRGF0YS5yZXF1ZXN0c1tmZXRjaERhdGEucmVxdWVzdHMuaW5kZXhPZihyZXEpXTtcclxuXHJcbiAgICAgIGlmIChyZXQgJiYgcmV0Lm5hbWUpIHtcclxuICAgICAgICAvLyBVcGRhdGUgZGF0YSBlbWl0cyBlcnJvciwgdGhlIEFqYXggc3RpbGwgcmVzb2x2ZXMgYXMgJ3N1Y2Nlc3MnIGJlY2F1c2Ugb2YgdGhlIHJlcXVlc3QsIGJ1dFxyXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gZXhlY3V0ZSB0aGUgZXJyb3IsIGJ1dCB3ZSBwaXBlIGl0IHRvIGVuc3VyZSBpcyBkb25lIGFmdGVyIG90aGVyICdkb25lJyBjYWxsYmFja3NcclxuICAgICAgICByZXEuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHRoYXQuZmV0Y2hEYXRhLm9uZXJyb3IuY2FsbCh0aGF0LCBudWxsLCByZXQubmFtZSwgcmV0KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuICApXHJcbiAgLmZhaWwoJC5wcm94eSh0aGlzLmZldGNoRGF0YS5vbmVycm9yLCB0aGlzKSk7XHJcbiAgdGhpcy5mZXRjaERhdGEucmVxdWVzdHMucHVzaChyZXEpO1xyXG5cclxuICByZXR1cm4gcmVxO1xyXG59XHJcblxyXG4vLyBEZWZhdWx0cyBmZXRjaERhdGEgcHJvcGVydGllcywgdGhleSBhcmUgZGVjb3VwbGVkIHRvIGFsbG93XHJcbi8vIHJlcGxhY2VtZW50LCBhbmQgaW5zaWRlIHRoZSBmZXRjaERhdGEgZnVuY3Rpb24gdG8gZG9uJ3RcclxuLy8gY29udGFtaW5hdGUgdGhlIG9iamVjdCBuYW1lc3BhY2UuXHJcblxyXG4vKiBDb2xsZWN0aW9uIG9mIGFjdGl2ZSAoZmV0Y2hpbmcpIHJlcXVlc3RzIHRvIHRoZSBzZXJ2ZXJcclxuKi9cclxuZmV0Y2hEYXRhLnJlcXVlc3RzID0gW107XHJcblxyXG4vKiBEZWNvdXBsZWQgZnVuY3Rpb25hbGl0eSB0byBwZXJmb3JtIHRoZSBBamF4IG9wZXJhdGlvbixcclxudGhpcyBhbGxvd3Mgb3ZlcndyaXRlIHRoaXMgYmVoYXZpb3IgdG8gaW1wbGVtZW50IGFub3RoZXJcclxud2F5cywgbGlrZSBhIG5vbi1qUXVlcnkgaW1wbGVtZW50YXRpb24sIGEgcHJveHkgdG8gZmFrZSBzZXJ2ZXJcclxuZm9yIHRlc3Rpbmcgb3IgcHJveHkgdG8gbG9jYWwgc3RvcmFnZSBpZiBvbmxpbmUsIGV0Yy5cclxuSXQgbXVzdCByZXR1cm5zIHRoZSB1c2VkIHJlcXVlc3Qgb2JqZWN0LlxyXG4qL1xyXG5mZXRjaERhdGEucHJveHkgPSBmZXRjaEpTT047XHJcblxyXG4vKiBCeSBkZWZhdWx0LCBmZXRjaERhdGEgYWxsb3dzIG11bHRpcGxlIHNpbXVsdGFuZW9zIGNvbm5lY3Rpb24sXHJcbnNpbmNlIHRoZSBzdG9yYWdlIGJ5IGRlZmF1bHQgYWxsb3dzIGluY3JlbWVudGFsIHVwZGF0ZXMgcmF0aGVyXHJcbnRoYW4gcmVwbGFjZW1lbnRzLlxyXG4qL1xyXG5mZXRjaERhdGEuZGVmYXVsdFJlcXVlc3RNb2RlID0gcmVxTW9kZXMubXVsdGlwbGU7XHJcblxyXG4vKiBEZWZhdWx0IG5vdGlmaWNhdGlvbiBvZiBlcnJvciBvbiBmZXRjaGluZywganVzdCBsb2dnaW5nLFxyXG5jYW4gYmUgcmVwbGFjZWQuXHJcbkl0IHJlY2VpdmVzIHRoZSByZXF1ZXN0IG9iamVjdCwgc3RhdHVzIGFuZCBlcnJvci5cclxuKi9cclxuZmV0Y2hEYXRhLm9uZXJyb3IgPSBmdW5jdGlvbiBlcnJvcih4LCBzLCBlKSB7XHJcbiAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignRmV0Y2ggZGF0YSBlcnJvciAlbycsIGUpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgRGF0YVNvdXJjZSBjbGFzc1xyXG4qKi9cclxuLy8gQ29uc3RydWN0b3I6IGV2ZXJ5dGhpbmcgaXMgaW4gdGhlIHByb3RvdHlwZS5cclxuZnVuY3Rpb24gRGF0YVNvdXJjZSgpIHsgfVxyXG5EYXRhU291cmNlLnByb3RvdHlwZSA9IHtcclxuICBkYXRhOiBudWxsLFxyXG4gIHVybDogJy8nLFxyXG4gIC8vIHF1ZXJ5OiBvYmplY3Qgd2l0aCBkZWZhdWx0IGV4dHJhIGluZm9ybWF0aW9uIHRvIGFwcGVuZCB0byB0aGUgdXJsXHJcbiAgLy8gd2hlbiBmZXRjaGluZyBkYXRhLCBleHRlbmRlZCB3aXRoIHRoZSBleHBsaWNpdCBxdWVyeSBzcGVjaWZpZWRcclxuICAvLyBleGVjdXRpbmcgZmV0Y2hEYXRhKHF1ZXJ5KVxyXG4gIHF1ZXJ5OiB7fSxcclxuICB1cGRhdGVEYXRhOiB1cGRhdGVEYXRhLFxyXG4gIGZldGNoRGF0YTogZmV0Y2hEYXRhXHJcbiAgLy8gVE9ETyAgcHVzaERhdGE6IGZ1bmN0aW9uKCl7IHBvc3QvcHV0IHRoaXMuZGF0YSB0byB1cmwgIH1cclxufTtcclxuXHJcbi8vIENsYXNzIGFzIHB1YmxpYyBtb2R1bGU6XHJcbm1vZHVsZS5leHBvcnRzID0gRGF0YVNvdXJjZTsiLCIvKipcclxuICBMb2Nvbm9taWNzIHNwZWNpZmljIFdpZGdldCBiYXNlZCBvbiBCaW5kYWJsZUNvbXBvbmVudC5cclxuICBKdXN0IGRlY291cGxpbmcgc3BlY2lmaWMgYmVoYXZpb3JzIGZyb20gc29tZXRoaW5nIG1vcmUgZ2VuZXJhbFxyXG4gIHRvIGVhc2lseSB0cmFjayB0aGF0IGRldGFpbHMsIGFuZCBtYXliZSBmdXR1cmUgbWlncmF0aW9ucyB0b1xyXG4gIG90aGVyIGZyb250LWVuZCBmcmFtZXdvcmtzLlxyXG4qKi9cclxudmFyIERhdGFTb3VyY2UgPSByZXF1aXJlKCcuL0RhdGFTb3VyY2UnKTtcclxudmFyIEJpbmRhYmxlQ29tcG9uZW50ID0gcmVxdWlyZSgnLi9CaW5kYWJsZUNvbXBvbmVudCcpO1xyXG5cclxudmFyIExjV2lkZ2V0ID0gQmluZGFibGVDb21wb25lbnQuZXh0ZW5kKFxyXG4gIC8vIFByb3RvdHlwZVxyXG4gIHtcclxuICAgIC8vIFJlcGxhY2luZyB1cGRhdGVEYXRhIHRvIGltcGxlbWVudCB0aGUgcGFydGljdWxhclxyXG4gICAgLy8gSlNPTiBzY2hlbWUgb2YgTG9jb25vbWljcywgYnV0IHJldXNpbmcgb3JpZ2luYWxcclxuICAgIC8vIGxvZ2ljIGluaGVyaXQgZnJvbSBEYXRhU291cmNlXHJcbiAgICB1cGRhdGVEYXRhOiBmdW5jdGlvbiAoZGF0YSwgbW9kZSkge1xyXG4gICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICBEYXRhU291cmNlLnByb3RvdHlwZS51cGRhdGVEYXRhLmNhbGwodGhpcywgZGF0YS5SZXN1bHQsIG1vZGUpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEVycm9yIG1lc3NhZ2UgaW4gdGhlIEpTT05cclxuICAgICAgICByZXR1cm4geyBuYW1lOiAnZGF0YS1mb3JtYXQnLCBtZXNzYWdlOiBkYXRhLkVycm9yTWVzc2FnZSB9O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuICAvLyBDb25zdHJ1Y3RvclxyXG4gIGZ1bmN0aW9uIExjV2lkZ2V0KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIEJpbmRhYmxlQ29tcG9uZW50LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgfVxyXG4pO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1dpZGdldDsiLCIvKipcclxuICBEZWVwIEV4dGVuZCBvYmplY3QgdXRpbGl0eSwgaXMgcmVjdXJzaXZlIHRvIGdldCBhbGwgdGhlIGRlcHRoXHJcbiAgYnV0IG9ubHkgZm9yIHRoZSBwcm9wZXJ0aWVzIG93bmVkIGJ5IHRoZSBvYmplY3QsXHJcbiAgaWYgeW91IG5lZWQgdGhlIG5vbi1vd25lZCBwcm9wZXJ0aWVzIHRvIGluIHRoZSBvYmplY3QsXHJcbiAgY29uc2lkZXIgZXh0ZW5kIGZyb20gdGhlIHNvdXJjZSBwcm90b3R5cGUgdG9vIChhbmQgbWF5YmUgdG9cclxuICB0aGUgZGVzdGluYXRpb24gcHJvdG90eXBlIGluc3RlYWQgb2YgdGhlIGluc3RhbmNlLCBidXQgdXAgdG8gdG9vKS5cclxuKiovXHJcblxyXG4vKiBqcXVlcnkgaW1wbGVtZW50YXRpb246XHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcclxucmV0dXJuICQuZXh0ZW5kLmFwcGx5KHRoaXMsIFt0cnVlXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSkpOyBcclxufTsqL1xyXG5cclxudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZChkZXN0aW5hdGlvbiwgc291cmNlKSB7XHJcbiAgZm9yICh2YXIgcHJvcGVydHkgaW4gc291cmNlKSB7XHJcbiAgICBpZiAoIXNvdXJjZS5oYXNPd25Qcm9wZXJ0eShwcm9wZXJ0eSkpXHJcbiAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgIC8vIEFsbG93IHByb3BlcnRpZXMgcmVtb3ZhbCwgaWYgc291cmNlIGNvbnRhaW5zIHZhbHVlICd1bmRlZmluZWQnLlxyXG4gICAgLy8gVGhlcmUgYXJlIG5vIHNwZWNpYWwgY29uc2lkZXJhdGlvbnMgb24gQXJyYXlzLCB0byBkb24ndCBnZXQgdW5kZXNpcmVkXHJcbiAgICAvLyByZXN1bHRzIGp1c3QgdGhlIHdhbnRlZCBpcyB0byByZXBsYWNlIHNwZWNpZmljIHBvc2l0aW9ucywgbm9ybWFsbHkuXHJcbiAgICBpZiAoc291cmNlW3Byb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGRlbGV0ZSBkZXN0aW5hdGlvbltwcm9wZXJ0eV07XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChbJ29iamVjdCcsICdmdW5jdGlvbiddLmluZGV4T2YodHlwZW9mIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSkgIT0gLTEgJiZcclxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZVtwcm9wZXJ0eV0gPT0gJ29iamVjdCcpXHJcbiAgICAgIGV4dGVuZChkZXN0aW5hdGlvbltwcm9wZXJ0eV0sIHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgZWxzZSBpZiAodHlwZW9mIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9PSAnZnVuY3Rpb24nICYmXHJcbiAgICAgICAgICAgICAgICAgdHlwZW9mIHNvdXJjZVtwcm9wZXJ0eV0gPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB2YXIgb3JpZyA9IGRlc3RpbmF0aW9uW3Byb3BlcnR5XTtcclxuICAgICAgLy8gQ2xvbmUgZnVuY3Rpb25cclxuICAgICAgdmFyIHNvdXIgPSBjbG9uZUZ1bmN0aW9uKHNvdXJjZVtwcm9wZXJ0eV0pO1xyXG4gICAgICBkZXN0aW5hdGlvbltwcm9wZXJ0eV0gPSBzb3VyO1xyXG4gICAgICAvLyBBbnkgcHJldmlvdXMgYXR0YWNoZWQgcHJvcGVydHlcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgb3JpZyk7XHJcbiAgICAgIC8vIEFueSBzb3VyY2UgYXR0YWNoZWQgcHJvcGVydHlcclxuICAgICAgZXh0ZW5kKGRlc3RpbmF0aW9uW3Byb3BlcnR5XSwgc291cmNlW3Byb3BlcnR5XSk7XHJcbiAgICB9XHJcbiAgICBlbHNlXHJcbiAgICAgIGRlc3RpbmF0aW9uW3Byb3BlcnR5XSA9IHNvdXJjZVtwcm9wZXJ0eV07XHJcbiAgfVxyXG5cclxuICAvLyBTbyBtdWNoICdzb3VyY2UnIGFyZ3VtZW50cyBhcyB3YW50ZWQuIEluIEVTNiB3aWxsIGJlICdzb3VyY2UuLidcclxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcclxuICAgIHZhciBuZXh0cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XHJcbiAgICBuZXh0cy5zcGxpY2UoMSwgMSk7XHJcbiAgICBleHRlbmQuYXBwbHkodGhpcywgbmV4dHMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRlc3RpbmF0aW9uO1xyXG59O1xyXG5cclxuZXh0ZW5kLnBsdWdJbiA9IGZ1bmN0aW9uIHBsdWdJbihvYmopIHtcclxuICBvYmogPSBvYmogfHwgT2JqZWN0LnByb3RvdHlwZTtcclxuICBvYmouZXh0ZW5kTWUgPSBmdW5jdGlvbiBleHRlbmRNZSgpIHtcclxuICAgIGV4dGVuZC5hcHBseSh0aGlzLCBbdGhpc10uY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcclxuICB9O1xyXG4gIG9iai5leHRlbmQgPSBmdW5jdGlvbiBleHRlbmRJbnN0YW5jZSgpIHtcclxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcclxuICAgICAgLy8gSWYgdGhlIG9iamVjdCB1c2VkIHRvIGV4dGVuZCBmcm9tIGlzIGEgZnVuY3Rpb24sIGlzIGNvbnNpZGVyZWRcclxuICAgICAgLy8gYSBjb25zdHJ1Y3RvciwgdGhlbiB3ZSBleHRlbmQgZnJvbSBpdHMgcHJvdG90eXBlLCBvdGhlcndpc2UgaXRzZWxmLlxyXG4gICAgICBjb25zdHJ1Y3RvckEgPSB0eXBlb2YgdGhpcyA9PSAnZnVuY3Rpb24nID8gdGhpcyA6IG51bGwsXHJcbiAgICAgIGJhc2VBID0gY29uc3RydWN0b3JBID8gdGhpcy5wcm90b3R5cGUgOiB0aGlzLFxyXG4gICAgICAvLyBJZiBsYXN0IGFyZ3VtZW50IGlzIGEgZnVuY3Rpb24sIGlzIGNvbnNpZGVyZWQgYSBjb25zdHJ1Y3RvclxyXG4gICAgICAvLyBvZiB0aGUgbmV3IGNsYXNzL29iamVjdCB0aGVuIHdlIGV4dGVuZCBpdHMgcHJvdG90eXBlLlxyXG4gICAgICAvLyBXZSB1c2UgYW4gZW1wdHkgb2JqZWN0IG90aGVyd2lzZS5cclxuICAgICAgY29uc3RydWN0b3JCID0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PSAnZnVuY3Rpb24nID9cclxuICAgICAgICBhcmdzLnNwbGljZShhcmdzLmxlbmd0aCAtIDEpWzBdIDpcclxuICAgICAgICBudWxsLFxyXG4gICAgICBiYXNlQiA9IGNvbnN0cnVjdG9yQiA/IGNvbnN0cnVjdG9yQi5wcm90b3R5cGUgOiB7fTtcclxuXHJcbiAgICB2YXIgZXh0ZW5kZWRSZXN1bHQgPSBleHRlbmQuYXBwbHkodGhpcywgW2Jhc2VCLCBiYXNlQV0uY29uY2F0KGFyZ3MpKTtcclxuICAgIC8vIElmIGJvdGggYXJlIGNvbnN0cnVjdG9ycywgd2Ugd2FudCB0aGUgc3RhdGljIG1ldGhvZHMgdG8gYmUgY29waWVkIHRvbzpcclxuICAgIGlmIChjb25zdHJ1Y3RvckEgJiYgY29uc3RydWN0b3JCKVxyXG4gICAgICBleHRlbmQoY29uc3RydWN0b3JCLCBjb25zdHJ1Y3RvckEpO1xyXG5cclxuICAgIC8vIElmIHdlIGFyZSBleHRlbmRpbmcgYSBjb25zdHJ1Y3Rvciwgd2UgcmV0dXJuIHRoYXQsIG90aGVyd2lzZSB0aGUgcmVzdWx0XHJcbiAgICByZXR1cm4gY29uc3RydWN0b3JCIHx8IGV4dGVuZGVkUmVzdWx0O1xyXG4gIH07XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICBtb2R1bGUuZXhwb3J0cyA9IGV4dGVuZDtcclxufSBlbHNlIHtcclxuICAvLyBnbG9iYWwgc2NvcGVcclxuICBleHRlbmQucGx1Z0luKCk7XHJcbn1cclxuXHJcbi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gIENsb25lIFV0aWxzXHJcbiovXHJcbmZ1bmN0aW9uIGNsb25lT2JqZWN0KG9iaikge1xyXG4gIHJldHVybiBleHRlbmQoe30sIG9iaik7XHJcbn1cclxuXHJcbi8vIFRlc3RpbmcgaWYgYSBzdHJpbmcgc2VlbXMgYSBmdW5jdGlvbiBzb3VyY2UgY29kZTpcclxuLy8gV2UgdGVzdCBhZ2FpbnMgYSBzaW1wbGlzaWMgcmVndWxhciBleHByZXNpb24gdGhhdCBtYXRjaFxyXG4vLyBhIGNvbW1vbiBzdGFydCBvZiBmdW5jdGlvbiBkZWNsYXJhdGlvbi5cclxuLy8gT3RoZXIgd2F5cyB0byBkbyB0aGlzIGlzIGF0IGludmVyc2VyLCBieSBjaGVja2luZ1xyXG4vLyB0aGF0IHRoZSBmdW5jdGlvbiB0b1N0cmluZyBpcyBub3QgYSBrbm93ZWQgdGV4dFxyXG4vLyBhcyAnW29iamVjdCBGdW5jdGlvbl0nIG9yICdbbmF0aXZlIGNvZGVdJywgYnV0XHJcbi8vIHNpbmNlIHRoYSBjYW4gY2hhbmdlcyBiZXR3ZWVuIGJyb3dzZXJzLCBpcyBtb3JlIGNvbnNlcnZhdGl2ZVxyXG4vLyBjaGVjayBhZ2FpbnN0IGEgY29tbW9uIGNvbnN0cnVjdCBhbiBmYWxsYmFjayBvbiB0aGVcclxuLy8gY29tbW9uIHNvbHV0aW9uIGlmIG5vdCBtYXRjaGVzLlxyXG52YXIgdGVzdEZ1bmN0aW9uID0gL15cXHMqZnVuY3Rpb25bXlxcKF1cXCgvO1xyXG5cclxuZnVuY3Rpb24gY2xvbmVGdW5jdGlvbihmbikge1xyXG4gIHZhciB0ZW1wO1xyXG4gIHZhciBjb250ZW50cyA9IGZuLnRvU3RyaW5nKCk7XHJcbiAgLy8gQ29weSB0byBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgc2FtZSBwcm90b3R5cGUsIGZvciB0aGUgbm90ICdvd25lZCcgcHJvcGVydGllcy5cclxuICAvLyBBc3NpbmdlZCBhdCB0aGUgZW5kXHJcbiAgdmFyIHRlbXBQcm90byA9IE9iamVjdC5jcmVhdGUoZm4ucHJvdG90eXBlKTtcclxuXHJcbiAgLy8gRElTQUJMRUQgdGhlIGNvbnRlbnRzLWNvcHkgcGFydCBiZWNhdXNlIGl0IGZhaWxzIHdpdGggY2xvc3VyZXNcclxuICAvLyBnZW5lcmF0ZWQgYnkgdGhlIG9yaWdpbmFsIGZ1bmN0aW9uLCB1c2luZyB0aGUgc3ViLWNhbGwgd2F5IGV2ZXJcclxuICBpZiAodHJ1ZSB8fCAhdGVzdEZ1bmN0aW9uLnRlc3QoY29udGVudHMpKSB7XHJcbiAgICAvLyBDaGVjayBpZiBpcyBhbHJlYWR5IGEgY2xvbmVkIGNvcHksIHRvXHJcbiAgICAvLyByZXVzZSB0aGUgb3JpZ2luYWwgY29kZSBhbmQgYXZvaWQgbW9yZSB0aGFuXHJcbiAgICAvLyBvbmUgZGVwdGggaW4gc3RhY2sgY2FsbHMgKGdyZWF0ISlcclxuICAgIGlmICh0eXBlb2YgZm4ucHJvdG90eXBlLl9fX2Nsb25lZF9vZiA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICBmbiA9IGZuLnByb3RvdHlwZS5fX19jbG9uZWRfb2Y7XHJcblxyXG4gICAgdGVtcCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpOyB9O1xyXG5cclxuICAgIC8vIFNhdmUgbWFyayBhcyBjbG9uZWQuIERvbmUgaW4gaXRzIHByb3RvdHlwZVxyXG4gICAgLy8gdG8gbm90IGFwcGVhciBpbiB0aGUgbGlzdCBvZiAnb3duZWQnIHByb3BlcnRpZXMuXHJcbiAgICB0ZW1wUHJvdG8uX19fY2xvbmVkX29mID0gZm47XHJcbiAgICAvLyBSZXBsYWNlIHRvU3RyaW5nIHRvIHJldHVybiB0aGUgb3JpZ2luYWwgc291cmNlOlxyXG4gICAgdGVtcFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICByZXR1cm4gZm4udG9TdHJpbmcoKTtcclxuICAgIH07XHJcbiAgICAvLyBUaGUgbmFtZSBjYW5ub3QgYmUgc2V0LCB3aWxsIGp1c3QgYmUgYW5vbnltb3VzXHJcbiAgICAvL3RlbXAubmFtZSA9IHRoYXQubmFtZTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gVGhpcyB3YXkgb24gY2FwYWJsZSBicm93c2VycyBwcmVzZXJ2ZSB0aGUgb3JpZ2luYWwgbmFtZSxcclxuICAgIC8vIGRvIGEgcmVhbCBpbmRlcGVuZGVudCBjb3B5IGFuZCBhdm9pZCBmdW5jdGlvbiBzdWJjYWxscyB0aGF0XHJcbiAgICAvLyBjYW4gZGVncmF0ZSBwZXJmb3JtYW5jZSBhZnRlciBsb3Qgb2YgJ2Nsb25uaW5nJy5cclxuICAgIHZhciBmID0gRnVuY3Rpb247XHJcbiAgICB0ZW1wID0gKG5ldyBmKCdyZXR1cm4gJyArIGNvbnRlbnRzKSkoKTtcclxuICB9XHJcblxyXG4gIHRlbXAucHJvdG90eXBlID0gdGVtcFByb3RvO1xyXG4gIC8vIENvcHkgYW55IHByb3BlcnRpZXMgaXQgb3duc1xyXG4gIGV4dGVuZCh0ZW1wLCBmbik7XHJcblxyXG4gIHJldHVybiB0ZW1wO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjbG9uZVBsdWdJbigpIHtcclxuICBpZiAodHlwZW9mIEZ1bmN0aW9uLnByb3RvdHlwZS5jbG9uZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgRnVuY3Rpb24ucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24gY2xvbmUoKSB7IHJldHVybiBjbG9uZUZ1bmN0aW9uKHRoaXMpOyB9O1xyXG4gIH1cclxuICBpZiAodHlwZW9mIE9iamVjdC5wcm90b3R5cGUuY2xvbmUgIT09ICdmdW5jdGlvbicpIHtcclxuICAgIE9qYmVjdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSgpIHsgcmV0dXJuIGNsb25lT2JqZWN0KHRoaXMpOyB9O1xyXG4gIH1cclxufVxyXG5cclxuZXh0ZW5kLmNsb25lT2JqZWN0ID0gY2xvbmVPYmplY3Q7XHJcbmV4dGVuZC5jbG9uZUZ1bmN0aW9uID0gY2xvbmVGdW5jdGlvbjtcclxuZXh0ZW5kLmNsb25lUGx1Z0luID0gY2xvbmVQbHVnSW47XHJcbiIsIi8qKlxyXG4qIENvb2tpZXMgbWFuYWdlbWVudC5cclxuKiBNb3N0IGNvZGUgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80ODI1Njk1LzE2MjIzNDZcclxuKi9cclxudmFyIENvb2tpZSA9IHt9O1xyXG5cclxuQ29va2llLnNldCA9IGZ1bmN0aW9uIHNldENvb2tpZShuYW1lLCB2YWx1ZSwgZGF5cykge1xyXG4gICAgdmFyIGV4cGlyZXMgPSBcIlwiO1xyXG4gICAgaWYgKGRheXMpIHtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgKGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKSk7XHJcbiAgICAgICAgZXhwaXJlcyA9IFwiOyBleHBpcmVzPVwiICsgZGF0ZS50b0dNVFN0cmluZygpO1xyXG4gICAgfVxyXG4gICAgZG9jdW1lbnQuY29va2llID0gbmFtZSArIFwiPVwiICsgdmFsdWUgKyBleHBpcmVzICsgXCI7IHBhdGg9L1wiO1xyXG59O1xyXG5Db29raWUuZ2V0ID0gZnVuY3Rpb24gZ2V0Q29va2llKGNfbmFtZSkge1xyXG4gICAgaWYgKGRvY3VtZW50LmNvb2tpZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY19zdGFydCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKGNfbmFtZSArIFwiPVwiKTtcclxuICAgICAgICBpZiAoY19zdGFydCAhPSAtMSkge1xyXG4gICAgICAgICAgICBjX3N0YXJ0ID0gY19zdGFydCArIGNfbmFtZS5sZW5ndGggKyAxO1xyXG4gICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKFwiO1wiLCBjX3N0YXJ0KTtcclxuICAgICAgICAgICAgaWYgKGNfZW5kID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHVuZXNjYXBlKGRvY3VtZW50LmNvb2tpZS5zdWJzdHJpbmcoY19zdGFydCwgY19lbmQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gXCJcIjtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gQ29va2llOyIsIi8qKiBDb25uZWN0IGFjY291bnQgd2l0aCBGYWNlYm9va1xyXG4qKi9cclxudmFyXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyksXHJcbiAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5mdW5jdGlvbiBGYWNlYm9va0Nvbm5lY3Qob3B0aW9ucykge1xyXG4gICQuZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIGlmICghJCgnI2ZiLXJvb3QnKS5sZW5ndGgpXHJcbiAgICAkKCc8ZGl2IGlkPVwiZmItcm9vdFwiIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiPjwvZGl2PicpLmFwcGVuZFRvKCdib2R5Jyk7XHJcbn1cclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUgPSB7XHJcbiAgYXBwSWQ6IG51bGwsXHJcbiAgbGFuZzogJ2VuX1VTJyxcclxuICByZXN1bHRUeXBlOiAnanNvbicsIC8vICdyZWRpcmVjdCdcclxuICBmYlVybEJhc2U6ICcvL2Nvbm5lY3QuZmFjZWJvb2submV0L0AobGFuZykvYWxsLmpzJyxcclxuICBzZXJ2ZXJVcmxCYXNlOiBMY1VybC5MYW5nUGF0aCArICdBY2NvdW50L0ZhY2Vib29rL0AodXJsU2VjdGlvbikvP1JlZGlyZWN0PUAocmVkaXJlY3RVcmwpJnByb2ZpbGU9QChwcm9maWxlVXJsKScsXHJcbiAgcmVkaXJlY3RVcmw6ICcnLFxyXG4gIHByb2ZpbGVVcmw6ICcnLFxyXG4gIHVybFNlY3Rpb246ICcnLFxyXG4gIGxvYWRpbmdUZXh0OiAnVmVyaWZpbmcnLFxyXG4gIHBlcm1pc3Npb25zOiAnJyxcclxuICBsaWJMb2FkZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdExpYkxvYWRlZCcsXHJcbiAgY29ubmVjdGVkRXZlbnQ6ICdGYWNlYm9va0Nvbm5lY3RDb25uZWN0ZWQnXHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldEZiVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZmJVcmxCYXNlLnJlcGxhY2UoL0BcXChsYW5nXFwpL2csIHRoaXMubGFuZyk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldFNlcnZlclVybCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnNlcnZlclVybEJhc2VcclxuICAucmVwbGFjZSgvQFxcKHJlZGlyZWN0VXJsXFwpL2csIHRoaXMucmVkaXJlY3RVcmwpXHJcbiAgLnJlcGxhY2UoL0BcXChwcm9maWxlVXJsXFwpL2csIHRoaXMucHJvZmlsZVVybClcclxuICAucmVwbGFjZSgvQFxcKHVybFNlY3Rpb25cXCkvZywgdGhpcy51cmxTZWN0aW9uKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUubG9hZExpYiA9IGZ1bmN0aW9uICgpIHtcclxuICAvLyBPbmx5IGlmIGlzIG5vdCBsb2FkZWQgc3RpbGxcclxuICAvLyAoRmFjZWJvb2sgc2NyaXB0IGF0dGFjaCBpdHNlbGYgYXMgdGhlIGdsb2JhbCB2YXJpYWJsZSAnRkInKVxyXG4gIGlmICghd2luZG93LkZCICYmICF0aGlzLl9sb2FkaW5nTGliKSB7XHJcbiAgICB0aGlzLl9sb2FkaW5nTGliID0gdHJ1ZTtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgc2NyaXB0czogW3RoaXMuZ2V0RmJVcmwoKV0sXHJcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgRkIuaW5pdCh7IGFwcElkOiB0aGF0LmFwcElkLCBzdGF0dXM6IHRydWUsIGNvb2tpZTogdHJ1ZSwgeGZibWw6IHRydWUgfSk7XHJcbiAgICAgICAgdGhhdC5sb2FkaW5nTGliID0gZmFsc2U7XHJcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcih0aGF0LmxpYkxvYWRlZEV2ZW50KTtcclxuICAgICAgfSxcclxuICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuRkI7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUucHJvY2Vzc1Jlc3BvbnNlID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgaWYgKHJlc3BvbnNlLmF1dGhSZXNwb25zZSkge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBXZWxjb21lIScpO1xyXG4gICAgdmFyIHVybCA9IHRoaXMuZ2V0U2VydmVyVXJsKCk7XHJcbiAgICBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwicmVkaXJlY3RcIikge1xyXG4gICAgICByZWRpcmVjdFRvKHVybCk7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMucmVzdWx0VHlwZSA9PSBcImpzb25cIikge1xyXG4gICAgICBwb3B1cCh1cmwsICdzbWFsbCcsIG51bGwsIHRoaXMubG9hZGluZ1RleHQpO1xyXG4gICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoaXMuY29ubmVjdGVkRXZlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qRkIuYXBpKCcvbWUnLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgIGNvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IEdvb2QgdG8gc2VlIHlvdSwgJyArIHJlc3BvbnNlLm5hbWUgKyAnLicpO1xyXG4gICAgfSk7Ki9cclxuICB9IGVsc2Uge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBVc2VyIGNhbmNlbGxlZCBsb2dpbiBvciBkaWQgbm90IGZ1bGx5IGF1dGhvcml6ZS4nKTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLm9uTGliUmVhZHkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICBpZiAod2luZG93LkZCKVxyXG4gICAgY2FsbGJhY2soKTtcclxuICBlbHNlIHtcclxuICAgIHRoaXMubG9hZExpYigpO1xyXG4gICAgJChkb2N1bWVudCkub24odGhpcy5saWJMb2FkZWRFdmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5vbkxpYlJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgIEZCLmxvZ2luKCQucHJveHkodGhhdC5wcm9jZXNzUmVzcG9uc2UsIHRoYXQpLCB7IHNjb3BlOiB0aGF0LnBlcm1pc3Npb25zIH0pO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5hdXRvQ29ubmVjdE9uID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgalF1ZXJ5KGRvY3VtZW50KS5vbignY2xpY2snLCBzZWxlY3RvciB8fCAnYS5mYWNlYm9vay1jb25uZWN0JywgJC5wcm94eSh0aGlzLmNvbm5lY3QsIHRoaXMpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmFjZWJvb2tDb25uZWN0OyIsIi8qKiBJbXBsZW1lbnRzIGEgc2ltaWxhciBMY1VybCBvYmplY3QgbGlrZSB0aGUgc2VydmVyLXNpZGUgb25lLCBiYXNpbmdcclxuICAgIGluIHRoZSBpbmZvcm1hdGlvbiBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgYXQgJ2h0bWwnIHRhZyBpbiB0aGUgXHJcbiAgICAnZGF0YS1iYXNlLXVybCcgYXR0cmlidXRlICh0aGF0cyB2YWx1ZSBpcyB0aGUgZXF1aXZhbGVudCBmb3IgQXBwUGF0aCksXHJcbiAgICBhbmQgdGhlIGxhbmcgaW5mb3JtYXRpb24gYXQgJ2RhdGEtY3VsdHVyZScuXHJcbiAgICBUaGUgcmVzdCBvZiBVUkxzIGFyZSBidWlsdCBmb2xsb3dpbmcgdGhlIHdpbmRvdy5sb2NhdGlvbiBhbmQgc2FtZSBydWxlc1xyXG4gICAgdGhhbiBpbiB0aGUgc2VydmVyLXNpZGUgb2JqZWN0LlxyXG4qKi9cclxuXHJcbnZhciBiYXNlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1iYXNlLXVybCcpLFxyXG4gICAgbGFuZyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpLFxyXG4gICAgbCA9IHdpbmRvdy5sb2NhdGlvbixcclxuICAgIHVybCA9IGwucHJvdG9jb2wgKyAnLy8nICsgbC5ob3N0O1xyXG4vLyBsb2NhdGlvbi5ob3N0IGluY2x1ZGVzIHBvcnQsIGlmIGlzIG5vdCB0aGUgZGVmYXVsdCwgdnMgbG9jYXRpb24uaG9zdG5hbWVcclxuXHJcbmJhc2UgPSBiYXNlIHx8ICcvJztcclxuXHJcbnZhciBMY1VybCA9IHtcclxuICAgIFNpdGVVcmw6IHVybCxcclxuICAgIEFwcFBhdGg6IGJhc2UsXHJcbiAgICBBcHBVcmw6IHVybCArIGJhc2UsXHJcbiAgICBMYW5nSWQ6IGxhbmcsXHJcbiAgICBMYW5nUGF0aDogYmFzZSArIGxhbmcgKyAnLycsXHJcbiAgICBMYW5nVXJsOiB1cmwgKyBiYXNlICsgbGFuZ1xyXG59O1xyXG5MY1VybC5MYW5nVXJsID0gdXJsICsgTGNVcmwuTGFuZ1BhdGg7XHJcbkxjVXJsLkpzb25QYXRoID0gTGNVcmwuTGFuZ1BhdGggKyAnSlNPTi8nO1xyXG5MY1VybC5Kc29uVXJsID0gdXJsICsgTGNVcmwuSnNvblBhdGg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjVXJsOyIsIi8qIExvY29ub21pY3Mgc3BlY2lmaWMgUHJpY2UsIGZlZXMgYW5kIGhvdXItcHJpY2UgY2FsY3VsYXRpb25cclxuICAgIHVzaW5nIHNvbWUgc3RhdGljIG1ldGhvZHMgYW5kIHRoZSBQcmljZSBjbGFzcy5cclxuKi9cclxudmFyIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbi8qIENsYXNzIFByaWNlIHRvIGNhbGN1bGF0ZSBhIHRvdGFsIHByaWNlIGJhc2VkIG9uIGZlZXMgaW5mb3JtYXRpb24gKGZpeGVkIGFuZCByYXRlKVxyXG4gICAgYW5kIGRlc2lyZWQgZGVjaW1hbHMgZm9yIGFwcHJveGltYXRpb25zLlxyXG4qL1xyXG5mdW5jdGlvbiBQcmljZShiYXNlUHJpY2UsIGZlZSwgcm91bmRlZERlY2ltYWxzKSB7XHJcbiAgICAvLyBmZWUgcGFyYW1ldGVyIGNhbiBiZSBhIGZsb2F0IG51bWJlciB3aXRoIHRoZSBmZWVSYXRlIG9yIGFuIG9iamVjdFxyXG4gICAgLy8gdGhhdCBpbmNsdWRlcyBib3RoIGEgZmVlUmF0ZSBhbmQgYSBmaXhlZEZlZUFtb3VudFxyXG4gICAgLy8gRXh0cmFjdGluZyBmZWUgdmFsdWVzIGludG8gbG9jYWwgdmFyczpcclxuICAgIHZhciBmZWVSYXRlID0gMCwgZml4ZWRGZWVBbW91bnQgPSAwO1xyXG4gICAgaWYgKGZlZS5maXhlZEZlZUFtb3VudCB8fCBmZWUuZmVlUmF0ZSkge1xyXG4gICAgICAgIGZpeGVkRmVlQW1vdW50ID0gZmVlLmZpeGVkRmVlQW1vdW50IHx8IDA7XHJcbiAgICAgICAgZmVlUmF0ZSA9IGZlZS5mZWVSYXRlIHx8IDA7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBmZWVSYXRlID0gZmVlO1xyXG5cclxuICAgIC8vIENhbGN1bGF0aW5nOlxyXG4gICAgLy8gVGhlIHJvdW5kVG8gd2l0aCBhIGJpZyBmaXhlZCBkZWNpbWFscyBpcyB0byBhdm9pZCB0aGVcclxuICAgIC8vIGRlY2ltYWwgZXJyb3Igb2YgZmxvYXRpbmcgcG9pbnQgbnVtYmVyc1xyXG4gICAgdmFyIHRvdGFsUHJpY2UgPSBtdS5jZWlsVG8obXUucm91bmRUbyhiYXNlUHJpY2UgKiAoMSArIGZlZVJhdGUpICsgZml4ZWRGZWVBbW91bnQsIDEyKSwgcm91bmRlZERlY2ltYWxzKTtcclxuICAgIC8vIGZpbmFsIGZlZSBwcmljZSBpcyBjYWxjdWxhdGVkIGFzIGEgc3Vic3RyYWN0aW9uLCBidXQgYmVjYXVzZSBqYXZhc2NyaXB0IGhhbmRsZXNcclxuICAgIC8vIGZsb2F0IG51bWJlcnMgb25seSwgYSByb3VuZCBvcGVyYXRpb24gaXMgcmVxdWlyZWQgdG8gYXZvaWQgYW4gaXJyYXRpb25hbCBudW1iZXJcclxuICAgIHZhciBmZWVQcmljZSA9IG11LnJvdW5kVG8odG90YWxQcmljZSAtIGJhc2VQcmljZSwgMik7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgb2JqZWN0IHdpdGggZnVsbCBkZXRhaWxzOlxyXG4gICAgdGhpcy5iYXNlUHJpY2UgPSBiYXNlUHJpY2U7XHJcbiAgICB0aGlzLmZlZVJhdGUgPSBmZWVSYXRlO1xyXG4gICAgdGhpcy5maXhlZEZlZUFtb3VudCA9IGZpeGVkRmVlQW1vdW50O1xyXG4gICAgdGhpcy5yb3VuZGVkRGVjaW1hbHMgPSByb3VuZGVkRGVjaW1hbHM7XHJcbiAgICB0aGlzLnRvdGFsUHJpY2UgPSB0b3RhbFByaWNlO1xyXG4gICAgdGhpcy5mZWVQcmljZSA9IGZlZVByaWNlO1xyXG59XHJcblxyXG4vKiogQ2FsY3VsYXRlIGFuZCByZXR1cm5zIHRoZSBwcmljZSBhbmQgcmVsZXZhbnQgZGF0YSBhcyBhbiBvYmplY3QgZm9yXHJcbnRpbWUsIGhvdXJseVJhdGUgKHdpdGggZmVlcykgYW5kIHRoZSBob3VybHlGZWUuXHJcblRoZSB0aW1lIChAZHVyYXRpb24pIGlzIHVzZWQgJ2FzIGlzJywgd2l0aG91dCB0cmFuc2Zvcm1hdGlvbiwgbWF5YmUgeW91IGNhbiByZXF1aXJlXHJcbnVzZSBMQy5yb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyIGJlZm9yZSBwYXNzIHRoZSBkdXJhdGlvbiB0byB0aGlzIGZ1bmN0aW9uLlxyXG5JdCByZWNlaXZlcyB0aGUgcGFyYW1ldGVycyBAaG91cmx5UHJpY2UgYW5kIEBzdXJjaGFyZ2VQcmljZSBhcyBMQy5QcmljZSBvYmplY3RzLlxyXG5Ac3VyY2hhcmdlUHJpY2UgaXMgb3B0aW9uYWwuXHJcbioqL1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVIb3VybHlQcmljZShkdXJhdGlvbiwgaG91cmx5UHJpY2UsIHN1cmNoYXJnZVByaWNlKSB7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBzdXJjaGFyZ2UsIGdldCB6ZXJvc1xyXG4gICAgc3VyY2hhcmdlUHJpY2UgPSBzdXJjaGFyZ2VQcmljZSB8fCB7IHRvdGFsUHJpY2U6IDAsIGZlZVByaWNlOiAwLCBiYXNlUHJpY2U6IDAgfTtcclxuICAgIC8vIEdldCBob3VycyBmcm9tIHJvdW5kZWQgZHVyYXRpb246XHJcbiAgICB2YXIgaG91cnMgPSBtdS5yb3VuZFRvKGR1cmF0aW9uLnRvdGFsSG91cnMoKSwgMik7XHJcbiAgICAvLyBDYWxjdWxhdGUgZmluYWwgcHJpY2VzXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvdGFsUHJpY2U6ICAgICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLnRvdGFsUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLnRvdGFsUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgZmVlUHJpY2U6ICAgICAgIG11LnJvdW5kVG8oaG91cmx5UHJpY2UuZmVlUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLmZlZVByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6ICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLmJhc2VQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UuYmFzZVByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIGR1cmF0aW9uSG91cnM6ICBob3Vyc1xyXG4gICAgfTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgUHJpY2U6IFByaWNlLFxyXG4gICAgICAgIGNhbGN1bGF0ZUhvdXJseVByaWNlOiBjYWxjdWxhdGVIb3VybHlQcmljZVxyXG4gICAgfTsiLCIvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI1OTM2MzcvaG93LXRvLWVzY2FwZS1yZWd1bGFyLWV4cHJlc3Npb24taW4tamF2YXNjcmlwdFxyXG5SZWdFeHAucXVvdGUgPSBmdW5jdGlvbiAoc3RyKSB7XHJcbiAgcmV0dXJuIChzdHIgKyAnJykucmVwbGFjZSgvKFsuPyorXiRbXFxdXFxcXCgpe318LV0pL2csIFwiXFxcXCQxXCIpO1xyXG59O1xyXG4iLCIvKipcclxuICBBIHZlcnkgc2ltcGxlIHNsaWRlciBpbXBsZW1lbnRhdGlvbiBpbml0aWFsbHkgY3JlYXRlZFxyXG4gIGZvciB0aGUgcHJvdmlkZXItd2VsY29tZSBsYW5kaW5nIHBhZ2UgYW5kXHJcbiAgb3RoZXIgc2ltaWxhciB1c2VzLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9SZWdFeHAucXVvdGUnKTtcclxuXHJcbnZhciBTaW1wbGVTbGlkZXIgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFNpbXBsZVNsaWRlcihvcHRzKSB7XHJcbiAgJC5leHRlbmQodHJ1ZSwgdGhpcywgb3B0cyk7XHJcblxyXG4gIHRoaXMuZWxlbWVudCA9ICQodGhpcy5lbGVtZW50KTtcclxuICB0aGlzLmN1cnJlbnRJbmRleCA9IDA7XHJcblxyXG4gIC8qKlxyXG4gIEFjdGlvbnMgaGFuZGxlciB0byBtb3ZlIHNsaWRlc1xyXG4gICoqL1xyXG4gIHZhciBjaGVja0hyZWYgPSBuZXcgUmVnRXhwKCdeIycgKyBSZWdFeHAucXVvdGUodGhpcy5ocmVmUHJlZml4KSArICcoLiopJyksXHJcbiAgICB0aGF0ID0gdGhpcztcclxuICB0aGlzLmVsZW1lbnQub24oJ2NsaWNrJywgJ2EnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgaHJlZiA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJyk7XHJcbiAgICB2YXIgcmVzID0gY2hlY2tIcmVmLmV4ZWMoaHJlZik7XHJcblxyXG4gICAgaWYgKHJlcyAmJiByZXMubGVuZ3RoID4gMSkge1xyXG4gICAgICB2YXIgaW5kZXggPSByZXNbMV07XHJcbiAgICAgIGlmIChpbmRleCA9PSAncHJldmlvdXMnKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHRoYXQuY3VycmVudEluZGV4IC0gMSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoaW5kZXggPT0gJ25leHQnKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHRoYXQuY3VycmVudEluZGV4ICsgMSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoL1xcZCsvLnRlc3QoaW5kZXgpKSB7XHJcbiAgICAgICAgdGhhdC5nb1NsaWRlKHBhcnNlSW50KGluZGV4KSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBEbyBhbGwgdGhlIHNldHVwIG9uIHNsaWRlciBhbmQgc2xpZGVzXHJcbiAgdG8gZW5zdXJlIHRoZSBtb3ZlbWVudCB3aWxsIHdvcmsgZmluZS5cclxuICBJdHMgZG9uZSBhdXRvbWF0aWMgb25cclxuICBpbml0aWFsaXppbmcsIGlzIGp1c3QgYSBwdWJsaWMgbWV0aG9kIGZvciBcclxuICBjb252ZW5pZW5jZSAobWF5YmUgdG8gYmUgY2FsbCBpZiBzbGlkZXMgYXJlXHJcbiAgYWRkZWQvcmVtb3ZlZCBhZnRlciBpbml0KS5cclxuICAqKi9cclxuICB0aGlzLnJlZHJhdyA9IGZ1bmN0aW9uIHNsaWRlc1JlcG9zaXRpb24oKSB7XHJcbiAgICB2YXIgc2xpZGVzID0gdGhpcy5nZXRTbGlkZXMoKSxcclxuICAgICAgYyA9IHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyKCk7XHJcbiAgICAvLyBMb29rIGZvciB0aGUgY29udGFpbmVyIHNpemUsIGZyb20gdGhlIFxyXG4gICAgLy8gYmlnZ2VyIHNsaWRlOlxyXG4gICAgdmFyIFxyXG4gICAgICB3ID0gMCxcclxuICAgICAgaCA9IDA7XHJcbiAgICBzbGlkZXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBcclxuICAgICAgICB0ID0gJCh0aGlzKSxcclxuICAgICAgICB0dyA9IHQub3V0ZXJXaWR0aCgpLFxyXG4gICAgICAgIHRoID0gdC5vdXRlckhlaWdodCgpO1xyXG4gICAgICBpZiAodHcgPiB3KVxyXG4gICAgICAgIHcgPSB0dztcclxuICAgICAgaWYgKHRoID4gaClcclxuICAgICAgICBoID0gdGg7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBDU1Mgc2V0dXAsIFxyXG4gICAgLy8gYWxsIHNsaWRlcyBpbiB0aGUgc2FtZSBsaW5lLFxyXG4gICAgLy8gYWxsIHdpdGggc2FtZSBzaXplIChleHRyYSBzcGFjaW5nIGNhblxyXG4gICAgLy8gYmUgZ2l2ZW4gd2l0aCBDU1MpXHJcbiAgICBjLmNzcyh7XHJcbiAgICAgIHdpZHRoOiB3IC0gKGMub3V0ZXJXaWR0aCgpIC0gYy53aWR0aCgpKSxcclxuICAgICAgLy9oZWlnaHQ6IGggLSAoYy5vdXRlckhlaWdodCgpIC0gYy5oZWlnaHQoKSksXHJcbiAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxyXG4gICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXHJcbiAgICAgIHdoaXRlU3BhY2U6ICdub3dyYXAnXHJcbiAgICB9KTtcclxuXHJcbiAgICBzbGlkZXMuY3NzKHtcclxuICAgICAgd2hpdGVTcGFjZTogJ25vcm1hbCcsXHJcbiAgICAgIGRpc3BsYXk6ICdpbmxpbmUtYmxvY2snXHJcbiAgICB9KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICB0LmNzcyh7XHJcbiAgICAgICAgd2lkdGg6IHcgLSAodC5vdXRlcldpZHRoKCkgLSB0LndpZHRoKCkpXHJcbiAgICAgICAgLy8saGVpZ2h0OiBoIC0gKHQub3V0ZXJIZWlnaHQoKSAtIHQuaGVpZ2h0KCkpXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVwb3NpdGlvbmF0ZSBhdCB0aGUgYmVnZ2luaW5nOlxyXG4gICAgY1swXS5zY3JvbGxMZWZ0ID0gMDtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHbyB0byBhIHNsaWRlIGJ5IGluZGV4XHJcbiAgKiovXHJcbiAgdGhpcy5nb1NsaWRlID0gZnVuY3Rpb24gZ29TbGlkZShpbmRleCkge1xyXG4gICAgdmFyIHByZXYgPSB0aGlzLmN1cnJlbnRJbmRleDtcclxuICAgIGlmIChwcmV2ID09IGluZGV4KVxyXG4gICAgICByZXR1cm47XHJcblxyXG4gICAgLy8gQ2hlY2sgYm91bmRzXHJcbiAgICBpZiAoaW5kZXggPCAxKVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB2YXIgc2xpZGVzID0gdGhpcy5nZXRTbGlkZXMoKTtcclxuICAgIGlmIChpbmRleCA+IHNsaWRlcy5sZW5ndGgpXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAvLyBHb29kIGluZGV4LCBzZXQgYXMgY3VycmVudFxyXG4gICAgdGhpcy5jdXJyZW50SW5kZXggPSBpbmRleDtcclxuICAgIC8vIFNldCBsaW5rcyB0byB0aGlzIGFzIGN1cnJlbnQsIHJlbW92aW5nIGFueSBwcmV2aW91czpcclxuICAgIHRoaXMuZWxlbWVudC5maW5kKCdbaHJlZj0jJyArIHRoaXMuaHJlZlByZWZpeCArIGluZGV4ICsgJ10nKVxyXG4gICAgLmFkZENsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpXHJcbiAgICAucGFyZW50KCdsaScpLmFkZENsYXNzKHRoaXMuY3VycmVudFNsaWRlQ2xhc3MpO1xyXG4gICAgdGhpcy5lbGVtZW50LmZpbmQoJ1tocmVmPSMnICsgdGhpcy5ocmVmUHJlZml4ICsgcHJldiArICddJylcclxuICAgIC5yZW1vdmVDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKVxyXG4gICAgLnBhcmVudCgnbGknKS5yZW1vdmVDbGFzcyh0aGlzLmN1cnJlbnRTbGlkZUNsYXNzKTtcclxuXHJcbiAgICB2YXIgXHJcbiAgICAgIHNsaWRlID0gJChzbGlkZXMuZ2V0KGluZGV4IC0gMSkpLFxyXG4gICAgICBjID0gdGhpcy5nZXRTbGlkZXNDb250YWluZXIoKSxcclxuICAgICAgbGVmdCA9IGMuc2Nyb2xsTGVmdCgpICsgc2xpZGUucG9zaXRpb24oKS5sZWZ0O1xyXG5cclxuICAgIGMuc3RvcCgpLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiBsZWZ0IH0sIHRoaXMuZHVyYXRpb24pO1xyXG5cclxuICB9O1xyXG5cclxuICAvKipcclxuICBNZXRob2Q6IEdldCB0aGUgalF1ZXJ5IGNvbGxlY3Rpb24gb2Ygc2xpZGVzXHJcbiAgKiovXHJcbiAgdGhpcy5nZXRTbGlkZXMgPSBmdW5jdGlvbiBnZXRTbGlkZXMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5lbGVtZW50XHJcbiAgICAuZmluZCh0aGlzLnNlbGVjdG9ycy5zbGlkZXMpXHJcbiAgICAuZmluZCh0aGlzLnNlbGVjdG9ycy5zbGlkZSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgTWV0aG9kOiBHZXQgdGhlIGpRdWVyeSBlbGVtZW50IGZvciB0aGUgY29udGFpbmVyIG9mIHNsaWRlc1xyXG4gICoqL1xyXG4gIHRoaXMuZ2V0U2xpZGVzQ29udGFpbmVyID0gZnVuY3Rpb24gZ2V0U2xpZGVzQ29udGFpbmVyKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFxyXG4gICAgLmZpbmQodGhpcy5zZWxlY3RvcnMuc2xpZGVzKTtcclxuICB9O1xyXG5cclxuICAvKiogTGFzdCBpbml0IHN0ZXBzXHJcbiAgKiovXHJcbiAgdGhpcy5yZWRyYXcoKTtcclxufTtcclxuXHJcblNpbXBsZVNsaWRlci5wcm90b3R5cGUgPSB7XHJcbiAgZWxlbWVudDogbnVsbCxcclxuICBzZWxlY3RvcnM6IHtcclxuICAgIHNsaWRlczogJy5zbGlkZXMnLFxyXG4gICAgc2xpZGU6ICdsaS5zbGlkZSdcclxuICB9LFxyXG4gIGN1cnJlbnRTbGlkZUNsYXNzOiAnanMtaXNDdXJyZW50JyxcclxuICBocmVmUHJlZml4OiAnZ29TbGlkZV8nLFxyXG4gIC8vIER1cmF0aW9uIG9mIGVhY2ggc2xpZGUgaW4gbWlsbGlzZWNvbmRzXHJcbiAgZHVyYXRpb246IDEwMDBcclxufTsiLCIvKiogUG9seWZpbGwgZm9yIHN0cmluZy5jb250YWluc1xyXG4qKi9cclxuaWYgKCEoJ2NvbnRhaW5zJyBpbiBTdHJpbmcucHJvdG90eXBlKSlcclxuICAgIFN0cmluZy5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoc3RyLCBzdGFydEluZGV4KSB7IHJldHVybiAtMSAhPT0gdGhpcy5pbmRleE9mKHN0ciwgc3RhcnRJbmRleCk7IH07IiwiLyoqID09PT09PT09PT09PT09PT09PT09PT1cclxuICogQSBzaW1wbGUgU3RyaW5nIEZvcm1hdFxyXG4gKiBmdW5jdGlvbiBmb3IgamF2YXNjcmlwdFxyXG4gKiBBdXRob3I6IElhZ28gTG9yZW56byBTYWxndWVpcm9cclxuICogTW9kdWxlOiBDb21tb25KU1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzdHJpbmdGb3JtYXQoKSB7XHJcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcblx0dmFyIGZvcm1hdHRlZCA9IGFyZ3NbMF07XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXFxcXHsnK2krJ1xcXFx9JywgJ2dpJyk7XHJcblx0XHRmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZShyZWdleHAsIGFyZ3NbaSsxXSk7XHJcblx0fVxyXG5cdHJldHVybiBmb3JtYXR0ZWQ7XHJcbn07IiwiLyoqXHJcbiAgICBHZW5lcmFsIGF1dG8tbG9hZCBzdXBwb3J0IGZvciB0YWJzOiBcclxuICAgIElmIHRoZXJlIGlzIG5vIGNvbnRlbnQgd2hlbiBmb2N1c2VkLCB0aGV5IHVzZSB0aGUgJ3JlbG9hZCcganF1ZXJ5IHBsdWdpblxyXG4gICAgdG8gbG9hZCBpdHMgY29udGVudCAtdGFicyBuZWVkIHRvIGJlIGNvbmZpZ3VyZWQgd2l0aCBkYXRhLXNvdXJjZS11cmwgYXR0cmlidXRlXHJcbiAgICBpbiBvcmRlciB0byBrbm93IHdoZXJlIHRvIGZldGNoIHRoZSBjb250ZW50LS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuLy8gRGVwZW5kZW5jeSBUYWJiZWRVWCBmcm9tIERJXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChUYWJiZWRVWCkge1xyXG4gICAgLy8gVGFiYmVkVVguc2V0dXAudGFiQm9keVNlbGVjdG9yIHx8ICcudGFiLWJvZHknXHJcbiAgICAkKCcudGFiLWJvZHknKS5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgJHQucmVsb2FkKCk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIFRoaXMgYWRkcyBub3RpZmljYXRpb25zIHRvIHRhYnMgZnJvbSB0aGUgVGFiYmVkVVggc3lzdGVtIHVzaW5nXHJcbiAgICB0aGUgY2hhbmdlc05vdGlmaWNhdGlvbiB1dGlsaXR5IHRoYXQgZGV0ZWN0cyBub3Qgc2F2ZWQgY2hhbmdlcyBvbiBmb3JtcyxcclxuICAgIHNob3dpbmcgd2FybmluZyBtZXNzYWdlcyB0byB0aGVcclxuICAgIHVzZXIgYW5kIG1hcmtpbmcgdGFicyAoYW5kIHN1Yi10YWJzIC8gcGFyZW50LXRhYnMgcHJvcGVybHkpIHRvXHJcbiAgICBkb24ndCBsb3N0IGNoYW5nZXMgbWFkZS5cclxuICAgIEEgYml0IG9mIENTUyBmb3IgdGhlIGFzc2lnbmVkIGNsYXNzZXMgd2lsbCBhbGxvdyBmb3IgdmlzdWFsIG1hcmtzLlxyXG5cclxuICAgIEFLQTogRG9uJ3QgbG9zdCBkYXRhISB3YXJuaW5nIG1lc3NhZ2UgOy0pXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcblxyXG4vLyBUYWJiZWRVWCBkZXBlbmRlbmN5IGFzIERJXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChUYWJiZWRVWCwgdGFyZ2V0U2VsZWN0b3IpIHtcclxuICAgIHZhciB0YXJnZXQgPSAkKHRhcmdldFNlbGVjdG9yIHx8ICcuY2hhbmdlcy1ub3RpZmljYXRpb24tZW5hYmxlZCcpO1xyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbi5pbml0KHsgdGFyZ2V0OiB0YXJnZXQgfSk7XHJcblxyXG4gICAgLy8gQWRkaW5nIGNoYW5nZSBub3RpZmljYXRpb24gdG8gdGFiLWJvZHkgZGl2c1xyXG4gICAgLy8gKG91dHNpZGUgdGhlIExDLkNoYW5nZXNOb3RpZmljYXRpb24gY2xhc3MgdG8gbGVhdmUgaXQgYXMgZ2VuZXJpYyBhbmQgc2ltcGxlIGFzIHBvc3NpYmxlKVxyXG4gICAgJCh0YXJnZXQpLm9uKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgJ2Zvcm0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcudGFiLWJvZHknKS5hZGRDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGRpbmcgY2xhc3MgdG8gdGhlIG1lbnUgaXRlbSAodGFiIHRpdGxlKVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5hZGRDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgJCgnI2xjcmVzLWNoYW5nZXMtbm90LXNhdmVkJykudGV4dCgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsICdmb3JtJywgZnVuY3Rpb24gKGUsIGYsIGVscywgZnVsbCkge1xyXG4gICAgICAgIGlmIChmdWxsKVxyXG4gICAgICAgICAgICAkKHRoaXMpLnBhcmVudHMoJy50YWItYm9keTpub3QoOmhhcyhmb3JtLmhhcy1jaGFuZ2VzKSknKS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmluZyBjbGFzcyBmcm9tIHRoZSBtZW51IGl0ZW0gKHRhYiB0aXRsZSlcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cigndGl0bGUnLCBudWxsKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLy8gVG8gYXZvaWQgdXNlciBiZSBub3RpZmllZCBvZiBjaGFuZ2VzIGFsbCB0aW1lIHdpdGggdGFiIG1hcmtzLCB3ZSBhZGRlZCBhICdub3RpZnknIGNsYXNzXHJcbiAgICAvLyBvbiB0YWJzIHdoZW4gYSBjaGFuZ2Ugb2YgdGFiIGhhcHBlbnNcclxuICAgIC5maW5kKCcudGFiLWJvZHknKS5vbigndGFiVW5mb2N1c2VkJywgZnVuY3Rpb24gKGV2ZW50LCBmb2N1c2VkQ3R4KSB7XHJcbiAgICAgICAgdmFyIG1pID0gVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbTtcclxuICAgICAgICBpZiAobWkuaXMoJy5oYXMtY2hhbmdlcycpKSB7XHJcbiAgICAgICAgICAgIG1pLmFkZENsYXNzKCdub3RpZnktY2hhbmdlcycpOyAvL2hhcy10b29sdGlwXHJcbiAgICAgICAgICAgIC8vIFNob3cgbm90aWZpY2F0aW9uIHBvcHVwXHJcbiAgICAgICAgICAgIHZhciBkID0gJCgnPGRpdiBjbGFzcz1cIndhcm5pbmdcIj5AMDwvZGl2PjxkaXYgY2xhc3M9XCJhY3Rpb25zXCI+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImFjdGlvbiBjb250aW51ZVwiIHZhbHVlPVwiQDJcIi8+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImFjdGlvbiBzdG9wXCIgdmFsdWU9XCJAMVwiLz48L2Rpdj4nXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDAvZywgTEMuZ2V0VGV4dCgnY2hhbmdlcy1ub3Qtc2F2ZWQnKSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMS9nLCBMQy5nZXRUZXh0KCd0YWItaGFzLWNoYW5nZXMtc3RheS1vbicpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AyL2csIExDLmdldFRleHQoJ3RhYi1oYXMtY2hhbmdlcy1jb250aW51ZS13aXRob3V0LWNoYW5nZScpKSk7XHJcbiAgICAgICAgICAgIGQub24oJ2NsaWNrJywgJy5zdG9wJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2Uod2luZG93KTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKCdjbGljaycsICcuY29udGludWUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh3aW5kb3cpO1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlICdoYXMtY2hhbmdlcycgdG8gYXZvaWQgZnV0dXJlIGJsb2NrcyAodW50aWwgbmV3IGNoYW5nZXMgaGFwcGVucyBvZiBjb3Vyc2UgOy0pXHJcbiAgICAgICAgICAgICAgICBtaS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKTtcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKGZvY3VzZWRDdHgudGFiLmdldCgwKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGQsIHdpbmRvdywgJ25vdC1zYXZlZC1wb3B1cCcsIHsgY2xvc2FibGU6IGZhbHNlLCBjZW50ZXI6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBFdmVyIHJldHVybiBmYWxzZSB0byBzdG9wIGN1cnJlbnQgdGFiIGZvY3VzXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ25vdGlmeS1jaGFuZ2VzJyk7IC8vaGFzLXRvb2x0aXBcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogVGFiYmVkVVg6IFRhYmJlZCBpbnRlcmZhY2UgbG9naWM7IHdpdGggbWluaW1hbCBIVE1MIHVzaW5nIGNsYXNzICd0YWJiZWQnIGZvciB0aGVcclxuY29udGFpbmVyLCB0aGUgb2JqZWN0IHByb3ZpZGVzIHRoZSBmdWxsIEFQSSB0byBtYW5pcHVsYXRlIHRhYnMgYW5kIGl0cyBzZXR1cFxyXG5saXN0ZW5lcnMgdG8gcGVyZm9ybSBsb2dpYyBvbiB1c2VyIGludGVyYWN0aW9uLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lmhhc1Njcm9sbEJhcicpO1xyXG5cclxudmFyIFRhYmJlZFVYID0ge1xyXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoJ2JvZHknKS5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzID4gbGk6bm90KC50YWJzLXNsaWRlcikgPiBhJywgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKFRhYmJlZFVYLmZvY3VzVGFiKCR0LmF0dHIoJ2hyZWYnKSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdCA9ICQoZG9jdW1lbnQpLnNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24uaGFzaCA9ICR0LmF0dHIoJ2hyZWYnKTtcclxuICAgICAgICAgICAgICAgICQoJ2h0bWwsYm9keScpLnNjcm9sbFRvcChzdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdtb3VzZWRvd24nLCBUYWJiZWRVWC5zdGFydE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnbW91c2V1cCBtb3VzZWxlYXZlJywgVGFiYmVkVVguZW5kTW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLy8gdGhlIGNsaWNrIHJldHVybiBmYWxzZSBpcyB0byBkaXNhYmxlIHN0YW5kYXIgdXJsIGJlaGF2aW9yXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdjbGljaycsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlci1saW1pdCcsICdtb3VzZWVudGVyJywgVGFiYmVkVVguc3RhcnRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXItbGltaXQnLCAnbW91c2VsZWF2ZScsIFRhYmJlZFVYLmVuZE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzID4gbGkucmVtb3ZhYmxlJywgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgLy8gT25seSBvbiBkaXJlY3QgY2xpY2tzIHRvIHRoZSB0YWIsIHRvIGF2b2lkXHJcbiAgICAgICAgICAgIC8vIGNsaWNrcyB0byB0aGUgdGFiLWxpbmsgKHRoYXQgc2VsZWN0L2ZvY3VzIHRoZSB0YWIpOlxyXG4gICAgICAgICAgICBpZiAoZS50YXJnZXQgPT0gZS5jdXJyZW50VGFyZ2V0KVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVgucmVtb3ZlVGFiKG51bGwsIHRoaXMpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBJbml0IHBhZ2UgbG9hZGVkIHRhYmJlZCBjb250YWluZXJzOlxyXG4gICAgICAgICQoJy50YWJiZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgLy8gQ29uc2lzdGVuY2UgY2hlY2s6IHRoaXMgbXVzdCBiZSBhIHZhbGlkIGNvbnRhaW5lciwgdGhpcyBpcywgbXVzdCBoYXZlIC50YWJzXHJcbiAgICAgICAgICAgIGlmICgkdC5jaGlsZHJlbignLnRhYnMnKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIC8vIEluaXQgc2xpZGVyXHJcbiAgICAgICAgICAgIFRhYmJlZFVYLnNldHVwU2xpZGVyKCR0KTtcclxuICAgICAgICAgICAgLy8gQ2xlYW4gd2hpdGUgc3BhY2VzICh0aGV5IGNyZWF0ZSBleGNlc2l2ZSBzZXBhcmF0aW9uIGJldHdlZW4gc29tZSB0YWJzKVxyXG4gICAgICAgICAgICAkKCcudGFicycsIHRoaXMpLmNvbnRlbnRzKCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGEgdGV4dCBub2RlLCByZW1vdmUgaXQ6XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ub2RlVHlwZSA9PSAzKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciBkaXIgPSAkdC5oYXNDbGFzcygndGFicy1zbGlkZXItcmlnaHQnKSA/IDEgOiAtMTtcclxuICAgICAgICB2YXIgdGFic1NsaWRlciA9ICR0LnBhcmVudCgpO1xyXG4gICAgICAgIHZhciB0YWJzID0gdGFic1NsaWRlci5zaWJsaW5ncygnLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICB0YWJzWzBdLnNjcm9sbExlZnQgKz0gMjAgKiBkaXI7XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFic1NsaWRlci5wYXJlbnQoKSwgdGFicyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIHN0YXJ0TW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIHRhYnMgPSB0LmNsb3Nlc3QoJy50YWJiZWQnKS5jaGlsZHJlbignLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICAvLyBTdG9wIHByZXZpb3VzIGFuaW1hdGlvbnM6XHJcbiAgICAgICAgdGFicy5zdG9wKHRydWUpO1xyXG4gICAgICAgIHZhciBzcGVlZCA9IDAuMzsgLyogc3BlZWQgdW5pdDogcGl4ZWxzL21pbGlzZWNvbmRzICovXHJcbiAgICAgICAgdmFyIGZ4YSA9IGZ1bmN0aW9uICgpIHsgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFicy5wYXJlbnQoKSwgdGFicyk7IH07XHJcbiAgICAgICAgdmFyIHRpbWU7XHJcbiAgICAgICAgaWYgKHQuaGFzQ2xhc3MoJ3JpZ2h0JykpIHtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRpbWUgYmFzZWQgb24gc3BlZWQgd2Ugd2FudCBhbmQgaG93IG1hbnkgZGlzdGFuY2UgdGhlcmUgaXM6XHJcbiAgICAgICAgICAgIHRpbWUgPSAodGFic1swXS5zY3JvbGxXaWR0aCAtIHRhYnNbMF0uc2Nyb2xsTGVmdCAtIHRhYnMud2lkdGgoKSkgKiAxIC8gc3BlZWQ7XHJcbiAgICAgICAgICAgIHRhYnMuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IHRhYnNbMF0uc2Nyb2xsV2lkdGggLSB0YWJzLndpZHRoKCkgfSxcclxuICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgc3RlcDogZnhhLCBjb21wbGV0ZTogZnhhLCBlYXNpbmc6ICdzd2luZycgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRpbWUgYmFzZWQgb24gc3BlZWQgd2Ugd2FudCBhbmQgaG93IG1hbnkgZGlzdGFuY2UgdGhlcmUgaXM6XHJcbiAgICAgICAgICAgIHRpbWUgPSB0YWJzWzBdLnNjcm9sbExlZnQgKiAxIC8gc3BlZWQ7XHJcbiAgICAgICAgICAgIHRhYnMuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IDAgfSxcclxuICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgc3RlcDogZnhhLCBjb21wbGV0ZTogZnhhLCBlYXNpbmc6ICdzd2luZycgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBlbmRNb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0YWJDb250YWluZXIgPSAkKHRoaXMpLmNsb3Nlc3QoJy50YWJiZWQnKTtcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJykuc3RvcCh0cnVlKTtcclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJDb250YWluZXIpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBjaGVja1RhYlNsaWRlckxpbWl0czogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgdGFicykge1xyXG4gICAgICAgIHRhYnMgPSB0YWJzIHx8IHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICAvLyBTZXQgdmlzaWJpbGl0eSBvZiB2aXN1YWwgbGltaXRlcnM6XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXItbGltaXQtbGVmdCcpLnRvZ2dsZSh0YWJzWzBdLnNjcm9sbExlZnQgPiAwKTtcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlci1saW1pdC1yaWdodCcpLnRvZ2dsZShcclxuICAgICAgICAgICAgKHRhYnNbMF0uc2Nyb2xsTGVmdCArIHRhYnMud2lkdGgoKSkgPCB0YWJzWzBdLnNjcm9sbFdpZHRoKTtcclxuICAgIH0sXHJcbiAgICBzZXR1cFNsaWRlcjogZnVuY3Rpb24gKHRhYkNvbnRhaW5lcikge1xyXG4gICAgICAgIHZhciB0cyA9IHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMnKS5oYXNTY3JvbGxCYXIoeyB4OiAtMiB9KS5ob3Jpem9udGFsKSB7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hZGRDbGFzcygnaGFzLXRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgICAgIGlmICh0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICB0cy5jbGFzc05hbWUgPSAndGFicy1zbGlkZXInO1xyXG4gICAgICAgICAgICAgICAgJCh0cylcclxuICAgICAgICAgICAgICAgIC8vIEFycm93czpcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cInRhYnMtc2xpZGVyLWxlZnQgbGVmdFwiIGhyZWY9XCIjXCI+Jmx0OyZsdDs8L2E+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cInRhYnMtc2xpZGVyLXJpZ2h0IHJpZ2h0XCIgaHJlZj1cIiNcIj4mZ3Q7Jmd0OzwvYT4nKTtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hcHBlbmQodHMpO1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyXHJcbiAgICAgICAgICAgICAgICAvLyBEZXNpbmcgZGV0YWlsczpcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGFicy1zbGlkZXItbGltaXQgdGFicy1zbGlkZXItbGltaXQtbGVmdCBsZWZ0XCIgaHJlZj1cIiNcIj48L2Rpdj4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ0YWJzLXNsaWRlci1saW1pdCB0YWJzLXNsaWRlci1saW1pdC1yaWdodCByaWdodFwiIGhyZWY9XCIjXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0cy5zaG93KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIucmVtb3ZlQ2xhc3MoJ2hhcy10YWJzLXNsaWRlcicpO1xyXG4gICAgICAgICAgICB0cy5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYkNvbnRhaW5lcik7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiQ29udGV4dEJ5QXJnczogZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJiB0eXBlb2YgKGFyZ3NbMF0pID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUYWJDb250ZXh0KGFyZ3NbMF0sIG51bGwpO1xyXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIGFyZ3NbMF0udGFiKVxyXG4gICAgICAgICAgICByZXR1cm4gYXJnc1swXTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFRhYkNvbnRleHQoXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDAgPyBhcmdzWzBdIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMSA/IGFyZ3NbMV0gOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAyID8gYXJnc1syXSA6IG51bGxcclxuICAgICAgICAgICAgKTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWJDb250ZXh0OiBmdW5jdGlvbiAodGFiT3JTZWxlY3RvciwgbWVudWl0ZW1PclNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIG1pLCBtYSwgdGFiLCB0YWJDb250YWluZXI7XHJcbiAgICAgICAgaWYgKHRhYk9yU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdGFiID0gJCh0YWJPclNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKHRhYi5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyID0gdGFiLnBhcmVudHMoJy50YWJiZWQ6ZXEoMCknKTtcclxuICAgICAgICAgICAgICAgIG1hID0gdGFiQ29udGFpbmVyLmZpbmQoJz4gLnRhYnMgPiBsaSA+IGFbaHJlZj0jJyArIHRhYi5nZXQoMCkuaWQgKyAnXScpO1xyXG4gICAgICAgICAgICAgICAgbWkgPSBtYS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAobWVudWl0ZW1PclNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIG1hID0gJChtZW51aXRlbU9yU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAobWEuaXMoJ2xpJykpIHtcclxuICAgICAgICAgICAgICAgIG1pID0gbWE7XHJcbiAgICAgICAgICAgICAgICBtYSA9IG1pLmNoaWxkcmVuKCdhOmVxKDApJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgbWkgPSBtYS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyID0gbWkuY2xvc2VzdCgnLnRhYmJlZCcpO1xyXG4gICAgICAgICAgICB0YWIgPSB0YWJDb250YWluZXIuZmluZCgnPi50YWItYm9keUAwLCA+LnRhYi1ib2R5LWxpc3Q+LnRhYi1ib2R5QDAnLnJlcGxhY2UoL0AwL2csIG1hLmF0dHIoJ2hyZWYnKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyB0YWI6IHRhYiwgbWVudWFuY2hvcjogbWEsIG1lbnVpdGVtOiBtaSwgdGFiQ29udGFpbmVyOiB0YWJDb250YWluZXIgfTtcclxuICAgIH0sXHJcbiAgICBjaGVja1RhYkNvbnRleHQ6IGZ1bmN0aW9uIChjdHgsIGZ1bmN0aW9ubmFtZSwgYXJncywgaXNUZXN0KSB7XHJcbiAgICAgICAgaWYgKCFjdHgudGFiIHx8IGN0eC50YWIubGVuZ3RoICE9IDEgfHxcclxuICAgICAgICAgICAgIWN0eC5tZW51aXRlbSB8fCBjdHgubWVudWl0ZW0ubGVuZ3RoICE9IDEgfHxcclxuICAgICAgICAgICAgIWN0eC50YWJDb250YWluZXIgfHwgY3R4LnRhYkNvbnRhaW5lci5sZW5ndGggIT0gMSB8fCBcclxuICAgICAgICAgICAgIWN0eC5tZW51YW5jaG9yIHx8IGN0eC5tZW51YW5jaG9yLmxlbmd0aCAhPSAxKSB7XHJcbiAgICAgICAgICAgIGlmICghaXNUZXN0ICYmIGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RhYmJlZFVYLicgKyBmdW5jdGlvbm5hbWUgKyAnLCBiYWQgYXJndW1lbnRzOiAnICsgQXJyYXkuam9pbihhcmdzLCAnLCAnKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZm9jdXNUYWInLCBhcmd1bWVudHMsIHRydWUpKSByZXR1cm4gbnVsbDtcclxuICAgICAgICByZXR1cm4gY3R4LnRhYi5nZXQoMCk7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdmb2N1c1RhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gR2V0IHByZXZpb3VzIGZvY3VzZWQgdGFiLCB0cmlnZ2VyICd0YWJVbmZvY3VzZWQnIGhhbmRsZXIgdGhhdCBjYW5cclxuICAgICAgICAvLyBzdG9wIHRoaXMgZm9jdXMgKHJldHVybmluZyBleHBsaWNpdHkgJ2ZhbHNlJylcclxuICAgICAgICB2YXIgcHJldlRhYiA9IGN0eC50YWIuc2libGluZ3MoJy5jdXJyZW50Jyk7XHJcbiAgICAgICAgaWYgKHByZXZUYWIudHJpZ2dlckhhbmRsZXIoJ3RhYlVuZm9jdXNlZCcsIFtjdHhdKSA9PT0gZmFsc2UpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgKGZpcnN0ISkgaWYgdGhlcmUgaXMgYSBwYXJlbnQgdGFiIGFuZCBmb2N1cyBpdCB0b28gKHdpbGwgYmUgcmVjdXJzaXZlIGNhbGxpbmcgdGhpcyBzYW1lIGZ1bmN0aW9uKVxyXG4gICAgICAgIHZhciBwYXJUYWIgPSBjdHgudGFiLnBhcmVudHMoJy50YWItYm9keTplcSgwKScpO1xyXG4gICAgICAgIGlmIChwYXJUYWIubGVuZ3RoID09IDEpIHRoaXMuZm9jdXNUYWIocGFyVGFiKTtcclxuXHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5oYXNDbGFzcygnY3VycmVudCcpIHx8XHJcbiAgICAgICAgICAgIGN0eC5tZW51aXRlbS5oYXNDbGFzcygnZGlzYWJsZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBVbnNldCBjdXJyZW50IG1lbnUgZWxlbWVudFxyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaWJsaW5ncygnLmN1cnJlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpXHJcbiAgICAgICAgICAgIC5maW5kKCc+YScpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgLy8gU2V0IGN1cnJlbnQgbWVudSBlbGVtZW50XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgY3R4Lm1lbnVhbmNob3IuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuXHJcbiAgICAgICAgLy8gSGlkZSBjdXJyZW50IHRhYi1ib2R5XHJcbiAgICAgICAgcHJldlRhYi5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIC8vIFNob3cgY3VycmVudCB0YWItYm9keSBhbmQgdHJpZ2dlciBldmVudFxyXG4gICAgICAgIGN0eC50YWIuYWRkQ2xhc3MoJ2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkZvY3VzZWQnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUYWJJbmRleDogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgdGFiSW5kZXgpIHtcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb2N1c1RhYih0aGlzLmdldFRhYkNvbnRleHQodGFiQ29udGFpbmVyLmZpbmQoJz4udGFiLWJvZHk6ZXEoJyArIHRhYkluZGV4ICsgJyknKSkpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICAvKiBFbmFibGUgYSB0YWIsIGRpc2FibGluZyBhbGwgb3RoZXJzIHRhYnMgLXVzZWZ1bGwgaW4gd2l6YXJkIHN0eWxlIHBhZ2VzLSAqL1xyXG4gICAgZW5hYmxlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZW5hYmxlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBydG4gPSBmYWxzZTtcclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmlzKCcuZGlzYWJsZWQnKSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZGlzYWJsZWQgY2xhc3MgZnJvbSBmb2N1c2VkIHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgICAgIGN0eC50YWIucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJFbmFibGVkJyk7XHJcbiAgICAgICAgICAgIGN0eC5tZW51aXRlbS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgcnRuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRm9jdXMgdGFiOlxyXG4gICAgICAgIHRoaXMuZm9jdXNUYWIoY3R4KTtcclxuICAgICAgICAvLyBEaXNhYmxlZCB0YWJzIGFuZCBtZW51IGl0ZW1zOlxyXG4gICAgICAgIGN0eC50YWIuc2libGluZ3MoJzpub3QoLmRpc2FibGVkKScpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnZGlzYWJsZWQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkRpc2FibGVkJyk7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNpYmxpbmdzKCc6bm90KC5kaXNhYmxlZCknKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgcmV0dXJuIHJ0bjtcclxuICAgIH0sXHJcbiAgICBzaG93aGlkZUR1cmF0aW9uOiAwLFxyXG4gICAgc2hvd2hpZGVFYXNpbmc6IG51bGwsXHJcbiAgICBzaG93VGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnc2hvd1RhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTaG93IHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgY3R4LnRhYi5zaG93KHRoaXMuc2hvd2hpZGVEdXJhdGlvbik7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNob3codGhpcy5zaG93aGlkZUVhc2luZyk7XHJcbiAgICB9LFxyXG4gICAgaGlkZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2hpZGVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2hvdyB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgIGN0eC50YWIuaGlkZSh0aGlzLnNob3doaWRlRHVyYXRpb24pO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5oaWRlKHRoaXMuc2hvd2hpZGVFYXNpbmcpO1xyXG4gICAgfSxcclxuICAgIHRhYkJvZHlDbGFzc0V4Y2VwdGlvbnM6IHsgJ3RhYi1ib2R5JzogMCwgJ3RhYmJlZCc6IDAsICdjdXJyZW50JzogMCwgJ2Rpc2FibGVkJzogMCB9LFxyXG4gICAgY3JlYXRlVGFiOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCBpZE5hbWUsIGxhYmVsKSB7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyID0gJCh0YWJDb250YWluZXIpO1xyXG4gICAgICAgIC8vIHRhYkNvbnRhaW5lciBtdXN0IGJlIG9ubHkgb25lIGFuZCB2YWxpZCBjb250YWluZXJcclxuICAgICAgICAvLyBhbmQgaWROYW1lIG11c3Qgbm90IGV4aXN0c1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIubGVuZ3RoID09IDEgJiYgdGFiQ29udGFpbmVyLmlzKCcudGFiYmVkJykgJiZcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWROYW1lKSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGFiIGRpdjpcclxuICAgICAgICAgICAgdmFyIHRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICB0YWIuaWQgPSBpZE5hbWU7XHJcbiAgICAgICAgICAgIC8vIFJlcXVpcmVkIGNsYXNzZXNcclxuICAgICAgICAgICAgdGFiLmNsYXNzTmFtZSA9IFwidGFiLWJvZHlcIjtcclxuICAgICAgICAgICAgdmFyICR0YWIgPSAkKHRhYik7XHJcbiAgICAgICAgICAgIC8vIEdldCBhbiBleGlzdGluZyBzaWJsaW5nIGFuZCBjb3B5ICh3aXRoIHNvbWUgZXhjZXB0aW9ucykgdGhlaXIgY3NzIGNsYXNzZXNcclxuICAgICAgICAgICAgJC5lYWNoKHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYi1ib2R5OmVxKDApJykuYXR0cignY2xhc3MnKS5zcGxpdCgvXFxzKy8pLCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEodiBpbiBUYWJiZWRVWC50YWJCb2R5Q2xhc3NFeGNlcHRpb25zKSlcclxuICAgICAgICAgICAgICAgICAgICAkdGFiLmFkZENsYXNzKHYpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gQWRkIHRvIGNvbnRhaW5lclxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuYXBwZW5kKHRhYik7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgbWVudSBlbnRyeVxyXG4gICAgICAgICAgICB2YXIgbWVudWl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB0YWIsIGlzIGEgZHluYW1pY2FsbHkgcmVtb3ZhYmxlIHRhYjpcclxuICAgICAgICAgICAgbWVudWl0ZW0uY2xhc3NOYW1lID0gXCJyZW1vdmFibGVcIjtcclxuICAgICAgICAgICAgdmFyIG1lbnVhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgICAgIG1lbnVhbmNob3Iuc2V0QXR0cmlidXRlKCdocmVmJywgJyMnICsgaWROYW1lKTtcclxuICAgICAgICAgICAgLy8gbGFiZWwgY2Fubm90IGJlIG51bGwgb3IgZW1wdHlcclxuICAgICAgICAgICAgJChtZW51YW5jaG9yKS50ZXh0KGlzRW1wdHlTdHJpbmcobGFiZWwpID8gXCJUYWJcIiA6IGxhYmVsKTtcclxuICAgICAgICAgICAgJChtZW51aXRlbSkuYXBwZW5kKG1lbnVhbmNob3IpO1xyXG4gICAgICAgICAgICAvLyBBZGQgdG8gdGFicyBsaXN0IGNvbnRhaW5lclxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJykuYXBwZW5kKG1lbnVpdGVtKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQsIG9uIHRhYkNvbnRhaW5lciwgd2l0aCB0aGUgbmV3IHRhYiBhcyBkYXRhXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci50cmlnZ2VySGFuZGxlcigndGFiQ3JlYXRlZCcsIFt0YWJdKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0dXBTbGlkZXIodGFiQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICByZW1vdmVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdyZW1vdmVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIE9ubHkgcmVtb3ZlIGlmIGlzIGEgJ3JlbW92YWJsZScgdGFiXHJcbiAgICAgICAgaWYgKCFjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ3JlbW92YWJsZScpICYmICFjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ3ZvbGF0aWxlJykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAvLyBJZiB0YWIgaXMgY3VycmVudGx5IGZvY3VzZWQgdGFiLCBjaGFuZ2UgdG8gZmlyc3QgdGFiXHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5oYXNDbGFzcygnY3VycmVudCcpKVxyXG4gICAgICAgICAgICB0aGlzLmZvY3VzVGFiSW5kZXgoY3R4LnRhYkNvbnRhaW5lciwgMCk7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnJlbW92ZSgpO1xyXG4gICAgICAgIHZhciB0YWJpZCA9IGN0eC50YWIuZ2V0KDApLmlkO1xyXG4gICAgICAgIGN0eC50YWIucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dXBTbGlkZXIoY3R4LnRhYkNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgIC8vIFRyaWdnZXIgZXZlbnQsIG9uIHRhYkNvbnRhaW5lciwgd2l0aCB0aGUgcmVtb3ZlZCB0YWIgaWQgYXMgZGF0YVxyXG4gICAgICAgIGN0eC50YWJDb250YWluZXIudHJpZ2dlckhhbmRsZXIoJ3RhYlJlbW92ZWQnLCBbdGFiaWRdKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBzZXRUYWJUaXRsZTogZnVuY3Rpb24gKHRhYk9yU2VsZWN0b3IsIG5ld1RpdGxlKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGFiT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdzZXRUYWJUaXRsZScsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTZXQgYW4gZW1wdHkgc3RyaW5nIGlzIG5vdCBhbGxvd2VkLCBwcmVzZXJ2ZSBwcmV2aW91c2x5OlxyXG4gICAgICAgIGlmICghaXNFbXB0eVN0cmluZyhuZXdUaXRsZSkpXHJcbiAgICAgICAgICAgIGN0eC5tZW51YW5jaG9yLnRleHQobmV3VGl0bGUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyogTW9yZSBzdGF0aWMgdXRpbGl0aWVzICovXHJcblxyXG4vKiogTG9vayB1cCB0aGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb24gYWRkcmVzcyBhbmQgdHJ5IHRvIGZvY3VzIGEgdGFiIHdpdGggdGhhdFxyXG4gICAgbmFtZSwgaWYgdGhlcmUgaXMgb25lLlxyXG4qKi9cclxuVGFiYmVkVVguZm9jdXNDdXJyZW50TG9jYXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBJZiB0aGUgY3VycmVudCBsb2NhdGlvbiBoYXZlIGEgaGFzaCB2YWx1ZSBidXQgaXMgbm90IGEgSGFzaEJhbmdcclxuICAgIGlmICgvXiNbXiFdLy50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgICAgIC8vIFRyeSBmb2N1cyBhIHRhYiB3aXRoIHRoYXQgbmFtZVxyXG4gICAgICAgIHZhciB0YWIgPSBUYWJiZWRVWC5nZXRUYWIod2luZG93LmxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIGlmICh0YWIpXHJcbiAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRhYik7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiogTG9vayBmb3Igdm9sYXRpbGUgdGFicyBvbiB0aGUgcGFnZSwgaWYgdGhleSBhcmVcclxuICAgIGVtcHR5IG9yIHJlcXVlc3RpbmcgYmVpbmcgJ3ZvbGF0aXplZCcsIHJlbW92ZSBpdC5cclxuKiovXHJcblRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJCgnLnRhYmJlZCA+IC50YWJzID4gLnZvbGF0aWxlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRhYiA9IFRhYmJlZFVYLmdldFRhYihudWxsLCB0aGlzKTtcclxuICAgICAgICBpZiAodGFiICYmICgkKHRhYikuY2hpbGRyZW4oKS5sZW5ndGggPT09IDAgfHwgJCh0YWIpLmZpbmQoJzpub3QoLnRhYmJlZCkgLnZvbGF0aXplLW15LXRhYicpLmxlbmd0aCkpIHtcclxuICAgICAgICAgICAgVGFiYmVkVVgucmVtb3ZlVGFiKHRhYik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUYWJiZWRVWDsiLCIvKiBzbGlkZXItdGFicyBsb2dpYy5cclxuKiBFeGVjdXRlIGluaXQgYWZ0ZXIgVGFiYmVkVVguaW5pdCB0byBhdm9pZCBsYXVuY2ggYW5pbWF0aW9uIG9uIHBhZ2UgbG9hZC5cclxuKiBJdCByZXF1aXJlcyBUYWJiZWRVWCB0aHJvdWdodCBESSBvbiAnaW5pdCcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRTbGlkZXJUYWJzKFRhYmJlZFVYKSB7XHJcbiAgICAkKCcudGFiYmVkLnNsaWRlci10YWJzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgJHRhYnMgPSAkdC5jaGlsZHJlbignLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgdmFyIGMgPSAkdGFic1xyXG4gICAgICAgICAgICAud3JhcEFsbCgnPGRpdiBjbGFzcz1cInRhYi1ib2R5LWxpc3RcIi8+JylcclxuICAgICAgICAgICAgLmVuZCgpLmNoaWxkcmVuKCcudGFiLWJvZHktbGlzdCcpO1xyXG4gICAgICAgICR0YWJzLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjLnN0b3AodHJ1ZSwgZmFsc2UpLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiBjLnNjcm9sbExlZnQoKSArICQodGhpcykucG9zaXRpb24oKS5sZWZ0IH0sIDE0MDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIFNldCBob3Jpem9udGFsIHNjcm9sbCB0byB0aGUgcG9zaXRpb24gb2YgY3VycmVudCBzaG93ZWQgdGFiLCB3aXRob3V0IGFuaW1hdGlvbiAoZm9yIHBhZ2UtaW5pdCk6XHJcbiAgICAgICAgdmFyIGN1cnJlbnRUYWIgPSAkKCR0LmZpbmQoJz4udGFicz5saS5jdXJyZW50PmEnKS5hdHRyKCdocmVmJykpO1xyXG4gICAgICAgIGMuc2Nyb2xsTGVmdChjLnNjcm9sbExlZnQoKSArIGN1cnJlbnRUYWIucG9zaXRpb24oKS5sZWZ0KTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgV2l6YXJkIFRhYmJlZCBGb3Jtcy5cclxuICAgIEl0IHVzZSB0YWJzIHRvIG1hbmFnZSB0aGUgZGlmZmVyZW50IGZvcm1zLXN0ZXBzIGluIHRoZSB3aXphcmQsXHJcbiAgICBsb2FkZWQgYnkgQUpBWCBhbmQgZm9sbG93aW5nIHRvIHRoZSBuZXh0IHRhYi9zdGVwIG9uIHN1Y2Nlc3MuXHJcblxyXG4gICAgUmVxdWlyZSBUYWJiZWRVWCB2aWEgREkgb24gJ2luaXQnXHJcbiAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRUYWJiZWRXaXphcmQoVGFiYmVkVVgsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgbG9hZGluZ0RlbGF5OiAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKFwiYm9keVwiKS5kZWxlZ2F0ZShcIi50YWJiZWQud2l6YXJkIC5uZXh0XCIsIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGZvcm1cclxuICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGN1cnJlbnQgd2l6YXJkIHN0ZXAtdGFiXHJcbiAgICAgICAgdmFyIGN1cnJlbnRTdGVwID0gZm9ybS5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQgY29udGFpbmVyXHJcbiAgICAgICAgdmFyIHdpemFyZCA9IGZvcm0uY2xvc2VzdCgnLnRhYmJlZC53aXphcmQnKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQtbmV4dC1zdGVwXHJcbiAgICAgICAgdmFyIG5leHRTdGVwID0gJCh0aGlzKS5kYXRhKCd3aXphcmQtbmV4dC1zdGVwJyk7XHJcblxyXG4gICAgICAgIHZhciBjdHggPSB7XHJcbiAgICAgICAgICAgIGJveDogY3VycmVudFN0ZXAsXHJcbiAgICAgICAgICAgIGZvcm06IGZvcm1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgICAgICB2YXIgdmFsb2JqZWN0ID0gZm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLmdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pO1xyXG4gICAgICAgICAgICAvLyBWYWxpZGF0aW9uIGlzIGFjdGl2ZWQsIHdhcyBleGVjdXRlZCBhbmQgdGhlIHJlc3VsdCBpcyAnZmFsc2UnOiBiYWQgZGF0YSwgc3RvcCBQb3N0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgICAgIHZhciBjdXN2YWwgPSBmb3JtLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAoY3VzdmFsICYmIGN1c3ZhbC52YWxpZGF0ZSAmJiBjdXN2YWwudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5nb1RvU3VtbWFyeUVycm9ycyhmb3JtKTtcclxuICAgICAgICAgICAgLy8gY3VzdG9tIHZhbGlkYXRpb24gbm90IHBhc3NlZCwgb3V0IVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSYWlzZSBldmVudFxyXG4gICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2JlZ2luU3VibWl0V2l6YXJkU3RlcCcpO1xyXG5cclxuICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIHJldGFyZFxyXG4gICAgICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY3VycmVudFN0ZXAuYmxvY2soYmxvY2tQcmVzZXRzLmxvYWRpbmcpO1xyXG4gICAgICAgIH0sIG9wdGlvbnMubG9hZGluZ0RlbGF5KTtcclxuICAgICAgICBcclxuICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIG9rID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIE1hcmsgYXMgc2F2ZWQ6XHJcbiAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uZ2V0KDApKTtcclxuXHJcbiAgICAgICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogKGZvcm0uYXR0cignYWN0aW9uJykgfHwgJycpLFxyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICAgICAgZGF0YTogZm9ybS5zZXJpYWxpemUoKSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgc3VjY2VzcywgZ28gbmV4dCBzdGVwLCB1c2luZyBjdXN0b20gSlNPTiBBY3Rpb24gZXZlbnQ6XHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5vbignYWpheFN1Y2Nlc3NQb3N0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5leHQtc3RlcFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0U3RlcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBuZXh0IHN0ZXAgaXMgaW50ZXJuYWwgdXJsIChhIG5leHQgd2l6YXJkIHRhYilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eIy8udGVzdChuZXh0U3RlcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2JlZ2luTG9hZFdpemFyZFN0ZXAnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYWJiZWRVWC5lbmFibGVUYWIobmV4dFN0ZXApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9rID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2VuZExvYWRXaXphcmRTdGVwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG5leHQtc3RlcCBVUkkgdGhhdCBpcyBub3QgaW50ZXJuYWwgbGluaywgd2UgbG9hZCBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhuZXh0U3RlcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgICAgICAgICAgICAgaWYgKCFhamF4Q2FsbGJhY2tzLmRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAgICAgICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93aW5nIG5ldyBodG1sOlxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwLmh0bWwobmV3aHRtbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0Zvcm0gPSBjdXJyZW50U3RlcDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnRTdGVwLmlzKCdmb3JtJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0gPSBjdXJyZW50U3RlcC5maW5kKCdmb3JtOmVxKDApJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcigncmVsb2FkZWRIdG1sV2l6YXJkU3RlcCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgICAgICAgICAgY29tcGxldGU6IGFqYXhDYWxsYmFja3MuY29tcGxldGVcclxuICAgICAgICB9KS5jb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2VuZFN1Ym1pdFdpemFyZFN0ZXAnLCBvayk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqIHRpbWVTcGFuIGNsYXNzIHRvIG1hbmFnZSB0aW1lcywgcGFyc2UsIGZvcm1hdCwgY29tcHV0ZS5cclxuSXRzIG5vdCBzbyBjb21wbGV0ZSBhcyB0aGUgQyMgb25lcyBidXQgaXMgdXNlZnVsbCBzdGlsbC5cclxuKiovXHJcbnZhciBUaW1lU3BhbiA9IGZ1bmN0aW9uIChkYXlzLCBob3VycywgbWludXRlcywgc2Vjb25kcywgbWlsbGlzZWNvbmRzKSB7XHJcbiAgICB0aGlzLmRheXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoZGF5cykpIHx8IDA7XHJcbiAgICB0aGlzLmhvdXJzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGhvdXJzKSkgfHwgMDtcclxuICAgIHRoaXMubWludXRlcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChtaW51dGVzKSkgfHwgMDtcclxuICAgIHRoaXMuc2Vjb25kcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChzZWNvbmRzKSkgfHwgMDtcclxuICAgIHRoaXMubWlsbGlzZWNvbmRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KG1pbGxpc2Vjb25kcykpIHx8IDA7XHJcblxyXG4gICAgLy8gaW50ZXJuYWwgdXRpbGl0eSBmdW5jdGlvbiAndG8gc3RyaW5nIHdpdGggdHdvIGRpZ2l0cyBhbG1vc3QnXHJcbiAgICBmdW5jdGlvbiB0KG4pIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihuIC8gMTApICsgJycgKyBuICUgMTA7XHJcbiAgICB9XHJcbiAgICAvKiogU2hvdyBvbmx5IGhvdXJzIGFuZCBtaW51dGVzIGFzIGEgc3RyaW5nIHdpdGggdGhlIGZvcm1hdCBISDptbVxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvU2hvcnRTdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1Nob3J0U3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKTtcclxuICAgICAgICByZXR1cm4gKGggKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArIG0pO1xyXG4gICAgfTtcclxuICAgIC8qKiBTaG93IHRoZSBmdWxsIHRpbWUgYXMgYSBzdHJpbmcsIGRheXMgY2FuIGFwcGVhciBiZWZvcmUgaG91cnMgaWYgdGhlcmUgYXJlIDI0IGhvdXJzIG9yIG1vcmVcclxuICAgICoqL1xyXG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgZCA9ICh0aGlzLmRheXMgPiAwID8gdGhpcy5kYXlzLnRvU3RyaW5nKCkgKyBUaW1lU3Bhbi5kZWNpbWFsc0RlbGltaXRlciA6ICcnKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKSxcclxuICAgICAgICAgICAgcyA9IHQodGhpcy5zZWNvbmRzICsgdGhpcy5taWxsaXNlY29uZHMgLyAxMDAwKTtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBkICtcclxuICAgICAgICAgICAgaCArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgbSArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgcyk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy52YWx1ZU9mID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdmFsdWVPZigpIHtcclxuICAgICAgICAvLyBSZXR1cm4gdGhlIHRvdGFsIG1pbGxpc2Vjb25kcyBjb250YWluZWQgYnkgdGhlIHRpbWVcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmRheXMgKiAoMjQgKiAzNjAwMDAwKSArXHJcbiAgICAgICAgICAgIHRoaXMuaG91cnMgKiAzNjAwMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taW51dGVzICogNjAwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLnNlY29uZHMgKiAxMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHNcclxuICAgICAgICApO1xyXG4gICAgfTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBtaWxsaXNlY29uZHNcclxuKiovXHJcblRpbWVTcGFuLmZyb21NaWxsaXNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWlsbGlzZWNvbmRzKG1pbGxpc2Vjb25kcykge1xyXG4gICAgdmFyIG1zID0gbWlsbGlzZWNvbmRzICUgMTAwMCxcclxuICAgICAgICBzID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAxMDAwKSAlIDYwLFxyXG4gICAgICAgIG0gPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDYwMDAwKSAlIDYwLFxyXG4gICAgICAgIGggPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDM2MDAwMDApICUgMjQsXHJcbiAgICAgICAgZCA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gKDM2MDAwMDAgKiAyNCkpO1xyXG4gICAgcmV0dXJuIG5ldyBUaW1lU3BhbihkLCBoLCBtLCBzLCBtcyk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBzZWNvbmRzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tU2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21TZWNvbmRzKHNlY29uZHMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21NaWxsaXNlY29uZHMoc2Vjb25kcyAqIDEwMDApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgbWludXRlc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbU1pbnV0ZXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWludXRlcyhtaW51dGVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tU2Vjb25kcyhtaW51dGVzICogNjApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgaG91cnNcclxuKiovXHJcblRpbWVTcGFuLmZyb21Ib3VycyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21Ib3Vycyhob3Vycykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbU1pbnV0ZXMoaG91cnMgKiA2MCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBkYXlzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tRGF5cyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21EYXlzKGRheXMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21Ib3VycyhkYXlzICogMjQpO1xyXG59O1xyXG5cclxuLy8gRm9yIHNwYW5pc2ggYW5kIGVuZ2xpc2ggd29ya3MgZ29vZCAnOicgYXMgdW5pdHNEZWxpbWl0ZXIgYW5kICcuJyBhcyBkZWNpbWFsRGVsaW1pdGVyXHJcbi8vIFRPRE86IHRoaXMgbXVzdCBiZSBzZXQgZnJvbSBhIGdsb2JhbCBMQy5pMThuIHZhciBsb2NhbGl6ZWQgZm9yIGN1cnJlbnQgdXNlclxyXG5UaW1lU3Bhbi51bml0c0RlbGltaXRlciA9ICc6JztcclxuVGltZVNwYW4uZGVjaW1hbHNEZWxpbWl0ZXIgPSAnLic7XHJcblRpbWVTcGFuLnBhcnNlID0gZnVuY3Rpb24gKHN0cnRpbWUpIHtcclxuICAgIHN0cnRpbWUgPSAoc3RydGltZSB8fCAnJykuc3BsaXQodGhpcy51bml0c0RlbGltaXRlcik7XHJcbiAgICAvLyBCYWQgc3RyaW5nLCByZXR1cm5zIG51bGxcclxuICAgIGlmIChzdHJ0aW1lLmxlbmd0aCA8IDIpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgLy8gRGVjb3VwbGVkIHVuaXRzOlxyXG4gICAgdmFyIGQsIGgsIG0sIHMsIG1zO1xyXG4gICAgaCA9IHN0cnRpbWVbMF07XHJcbiAgICBtID0gc3RydGltZVsxXTtcclxuICAgIHMgPSBzdHJ0aW1lLmxlbmd0aCA+IDIgPyBzdHJ0aW1lWzJdIDogMDtcclxuICAgIC8vIFN1YnN0cmFjdGluZyBkYXlzIGZyb20gdGhlIGhvdXJzIHBhcnQgKGZvcm1hdDogJ2RheXMuaG91cnMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIGlmIChoLmNvbnRhaW5zKHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpKSB7XHJcbiAgICAgICAgdmFyIGRoc3BsaXQgPSBoLnNwbGl0KHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpO1xyXG4gICAgICAgIGQgPSBkaHNwbGl0WzBdO1xyXG4gICAgICAgIGggPSBkaHNwbGl0WzFdO1xyXG4gICAgfVxyXG4gICAgLy8gTWlsbGlzZWNvbmRzIGFyZSBleHRyYWN0ZWQgZnJvbSB0aGUgc2Vjb25kcyAoYXJlIHJlcHJlc2VudGVkIGFzIGRlY2ltYWwgbnVtYmVycyBvbiB0aGUgc2Vjb25kcyBwYXJ0OiAnc2Vjb25kcy5taWxsaXNlY29uZHMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIG1zID0gTWF0aC5yb3VuZChwYXJzZUZsb2F0KHMucmVwbGFjZSh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyLCAnLicpKSAqIDEwMDAgJSAxMDAwKTtcclxuICAgIC8vIFJldHVybiB0aGUgbmV3IHRpbWUgaW5zdGFuY2VcclxuICAgIHJldHVybiBuZXcgVGltZVNwYW4oZCwgaCwgbSwgcywgbXMpO1xyXG59O1xyXG5UaW1lU3Bhbi56ZXJvID0gbmV3IFRpbWVTcGFuKDAsIDAsIDAsIDAsIDApO1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9faXNaZXJvKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICB0aGlzLmRheXMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLmhvdXJzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taW51dGVzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5zZWNvbmRzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taWxsaXNlY29uZHMgPT09IDBcclxuICAgICk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbE1pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWlsbGlzZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWVPZigpO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxTZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxTZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsTWludXRlcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWludXRlcygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbFNlY29uZHMoKSAvIDYwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsSG91cnMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbEhvdXJzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWludXRlcygpIC8gNjApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxEYXlzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxEYXlzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsSG91cnMoKSAvIDI0KTtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGltZVNwYW47IiwiLyogRXh0cmEgdXRpbGl0aWVzIGFuZCBtZXRob2RzIFxyXG4gKi9cclxudmFyIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG52YXIgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuLyoqIFNob3dzIHRpbWUgYXMgYSBsYXJnZSBzdHJpbmcgd2l0aCB1bml0cyBuYW1lcyBmb3IgdmFsdWVzIGRpZmZlcmVudCB0aGFuIHplcm8uXHJcbiAqKi9cclxuZnVuY3Rpb24gc21hcnRUaW1lKHRpbWUpIHtcclxuICAgIHZhciByID0gW107XHJcbiAgICBpZiAodGltZS5kYXlzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5kYXlzICsgJyBkYXlzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmRheXMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgZGF5Jyk7XHJcbiAgICBpZiAodGltZS5ob3VycyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuaG91cnMgKyAnIGhvdXJzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmhvdXJzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIGhvdXInKTtcclxuICAgIGlmICh0aW1lLm1pbnV0ZXMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLm1pbnV0ZXMgKyAnIG1pbnV0ZXMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWludXRlcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBtaW51dGUnKTtcclxuICAgIGlmICh0aW1lLnNlY29uZHMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLnNlY29uZHMgKyAnIHNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuc2Vjb25kcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBzZWNvbmQnKTtcclxuICAgIGlmICh0aW1lLm1pbGxpc2Vjb25kcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUubWlsbGlzZWNvbmRzICsgJyBtaWxsaXNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWlsbGlzZWNvbmRzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIG1pbGxpc2Vjb25kJyk7XHJcbiAgICByZXR1cm4gci5qb2luKCcsICcpO1xyXG59XHJcblxyXG4vKiogUm91bmRzIGEgdGltZSB0byB0aGUgbmVhcmVzdCAxNSBtaW51dGVzIGZyYWdtZW50LlxyXG5Acm91bmRUbyBzcGVjaWZ5IHRoZSBMQy5yb3VuZGluZ1R5cGVFbnVtIGFib3V0IGhvdyB0byByb3VuZCB0aGUgdGltZSAoZG93biwgbmVhcmVzdCBvciB1cClcclxuKiovXHJcbmZ1bmN0aW9uIHJvdW5kVGltZVRvUXVhcnRlckhvdXIoLyogVGltZVNwYW4gKi90aW1lLCAvKiBtYXRoVXRpbHMucm91bmRpbmdUeXBlRW51bSAqL3JvdW5kVG8pIHtcclxuICAgIHZhciByZXN0RnJvbVF1YXJ0ZXIgPSB0aW1lLnRvdGFsSG91cnMoKSAlIDAuMjU7XHJcbiAgICB2YXIgaG91cnMgPSB0aW1lLnRvdGFsSG91cnMoKTtcclxuICAgIGlmIChyZXN0RnJvbVF1YXJ0ZXIgPiAwLjApIHtcclxuICAgICAgICBzd2l0Y2ggKHJvdW5kVG8pIHtcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLkRvd246XHJcbiAgICAgICAgICAgICAgICBob3VycyAtPSByZXN0RnJvbVF1YXJ0ZXI7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgY2FzZSBtdS5yb3VuZGluZ1R5cGVFbnVtLk5lYXJlc3Q6XHJcbiAgICAgICAgICAgICAgICB2YXIgbGltaXQgPSAwLjI1IC8gMjtcclxuICAgICAgICAgICAgICAgIGlmIChyZXN0RnJvbVF1YXJ0ZXIgPj0gbGltaXQpIHtcclxuICAgICAgICAgICAgICAgICAgICBob3VycyArPSAoMC4yNSAtIHJlc3RGcm9tUXVhcnRlcik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzIC09IHJlc3RGcm9tUXVhcnRlcjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uVXA6XHJcbiAgICAgICAgICAgICAgICBob3VycyArPSAoMC4yNSAtIHJlc3RGcm9tUXVhcnRlcik7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gVGltZVNwYW4uZnJvbUhvdXJzKGhvdXJzKTtcclxufVxyXG5cclxuLy8gRXh0ZW5kIGEgZ2l2ZW4gVGltZVNwYW4gb2JqZWN0IHdpdGggdGhlIEV4dHJhIG1ldGhvZHNcclxuZnVuY3Rpb24gcGx1Z0luKFRpbWVTcGFuKSB7XHJcbiAgICBUaW1lU3Bhbi5wcm90b3R5cGUudG9TbWFydFN0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU21hcnRTdHJpbmcoKSB7IHJldHVybiBzbWFydFRpbWUodGhpcyk7IH07XHJcbiAgICBUaW1lU3Bhbi5wcm90b3R5cGUucm91bmRUb1F1YXJ0ZXJIb3VyID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fcm91bmRUb1F1YXJ0ZXJIb3VyKCkgeyByZXR1cm4gcm91bmRUaW1lVG9RdWFydGVySG91ci5jYWxsKHRoaXMsIHBhcmFtZXRlcnMpOyB9O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBzbWFydFRpbWU6IHNtYXJ0VGltZSxcclxuICAgICAgICByb3VuZFRvUXVhcnRlckhvdXI6IHJvdW5kVGltZVRvUXVhcnRlckhvdXIsXHJcbiAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgIH07XHJcbiIsIi8qKlxyXG4gICBBUEkgZm9yIGF1dG9tYXRpYyBjcmVhdGlvbiBvZiBsYWJlbHMgZm9yIFVJIFNsaWRlcnMgKGpxdWVyeS11aSlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICB0b29sdGlwcyA9IHJlcXVpcmUoJy4vdG9vbHRpcHMnKSxcclxuICAgIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKSxcclxuICAgIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxuXHJcbi8qKiBDcmVhdGUgbGFiZWxzIGZvciBhIGpxdWVyeS11aS1zbGlkZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjcmVhdGUoc2xpZGVyKSB7XHJcbiAgICAvLyByZW1vdmUgb2xkIG9uZXM6XHJcbiAgICB2YXIgb2xkID0gc2xpZGVyLnNpYmxpbmdzKCcudWktc2xpZGVyLWxhYmVscycpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlcicpLmdldCgwKSA9PSBzbGlkZXIuZ2V0KDApKTtcclxuICAgIH0pLnJlbW92ZSgpO1xyXG4gICAgLy8gQ3JlYXRlIGxhYmVscyBjb250YWluZXJcclxuICAgIHZhciBsYWJlbHMgPSAkKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLWxhYmVsc1wiLz4nKTtcclxuICAgIGxhYmVscy5kYXRhKCd1aS1zbGlkZXInLCBzbGlkZXIpO1xyXG5cclxuICAgIC8vIFNldHVwIG9mIHVzZWZ1bCB2YXJzIGZvciBsYWJlbCBjcmVhdGlvblxyXG4gICAgdmFyIG1heCA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdtYXgnKSxcclxuICAgICAgICBtaW4gPSBzbGlkZXIuc2xpZGVyKCdvcHRpb24nLCAnbWluJyksXHJcbiAgICAgICAgc3RlcCA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdzdGVwJyksXHJcbiAgICAgICAgc3RlcHMgPSBNYXRoLmZsb29yKChtYXggLSBtaW4pIC8gc3RlcCk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgYW5kIHBvc2l0aW9uaW5nIGxhYmVsc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gc3RlcHM7IGkrKykge1xyXG4gICAgICAgIC8vIENyZWF0ZSBsYWJlbFxyXG4gICAgICAgIHZhciBsYmwgPSAkKCc8ZGl2IGNsYXNzPVwidWktc2xpZGVyLWxhYmVsXCI+PHNwYW4gY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWwtdGV4dFwiLz48L2Rpdj4nKTtcclxuICAgICAgICAvLyBTZXR1cCBsYWJlbCB3aXRoIGl0cyB2YWx1ZVxyXG4gICAgICAgIHZhciBsYWJlbFZhbHVlID0gbWluICsgaSAqIHN0ZXA7XHJcbiAgICAgICAgbGJsLmNoaWxkcmVuKCcudWktc2xpZGVyLWxhYmVsLXRleHQnKS50ZXh0KGxhYmVsVmFsdWUpO1xyXG4gICAgICAgIGxibC5kYXRhKCd1aS1zbGlkZXItdmFsdWUnLCBsYWJlbFZhbHVlKTtcclxuICAgICAgICAvLyBQb3NpdGlvbmF0ZVxyXG4gICAgICAgIHBvc2l0aW9uYXRlKGxibCwgaSwgc3RlcHMpO1xyXG4gICAgICAgIC8vIEFkZCB0byBjb250YWluZXJcclxuICAgICAgICBsYWJlbHMuYXBwZW5kKGxibCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSGFuZGxlciBmb3IgbGFiZWxzIGNsaWNrIHRvIHNlbGVjdCBpdHMgcG9zaXRpb24gdmFsdWVcclxuICAgIGxhYmVscy5vbignY2xpY2snLCAnLnVpLXNsaWRlci1sYWJlbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsID0gJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXItdmFsdWUnKSxcclxuICAgICAgICAgICAgc2xpZGVyID0gJCh0aGlzKS5wYXJlbnQoKS5kYXRhKCd1aS1zbGlkZXInKTtcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHZhbCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBJbnNlcnQgbGFiZWxzIGFzIGEgc2libGluZyBvZiB0aGUgc2xpZGVyIChjYW5ub3QgYmUgaW5zZXJ0ZWQgaW5zaWRlKVxyXG4gICAgc2xpZGVyLmFmdGVyKGxhYmVscyk7XHJcbn1cclxuXHJcbi8qKiBQb3NpdGlvbmF0ZSB0byB0aGUgY29ycmVjdCBwb3NpdGlvbiBhbmQgd2lkdGggYW4gVUkgbGFiZWwgYXQgQGxibFxyXG5mb3IgdGhlIHJlcXVpcmVkIHBlcmNlbnRhZ2Utd2lkdGggQHN3XHJcbioqL1xyXG5mdW5jdGlvbiBwb3NpdGlvbmF0ZShsYmwsIGksIHN0ZXBzKSB7XHJcbiAgICB2YXIgc3cgPSAxMDAgLyBzdGVwcztcclxuICAgIHZhciBsZWZ0ID0gaSAqIHN3IC0gc3cgKiAwLjUsXHJcbiAgICAgICAgcmlnaHQgPSAxMDAgLSBsZWZ0IC0gc3csXHJcbiAgICAgICAgYWxpZ24gPSAnY2VudGVyJztcclxuICAgIGlmIChpID09PSAwKSB7XHJcbiAgICAgICAgYWxpZ24gPSAnbGVmdCc7XHJcbiAgICAgICAgbGVmdCA9IDA7XHJcbiAgICB9IGVsc2UgaWYgKGkgPT0gc3RlcHMpIHtcclxuICAgICAgICBhbGlnbiA9ICdyaWdodCc7XHJcbiAgICAgICAgcmlnaHQgPSAwO1xyXG4gICAgfVxyXG4gICAgbGJsLmNzcyh7XHJcbiAgICAgICAgJ3RleHQtYWxpZ24nOiBhbGlnbixcclxuICAgICAgICBsZWZ0OiBsZWZ0ICsgJyUnLFxyXG4gICAgICAgIHJpZ2h0OiByaWdodCArICclJ1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBVcGRhdGUgdGhlIHZpc2liaWxpdHkgb2YgbGFiZWxzIG9mIGEganF1ZXJ5LXVpLXNsaWRlciBkZXBlbmRpbmcgaWYgdGhleSBmaXQgaW4gdGhlIGF2YWlsYWJsZSBzcGFjZS5cclxuU2xpZGVyIG5lZWRzIHRvIGJlIHZpc2libGUuXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoc2xpZGVyKSB7XHJcbiAgICAvLyBHZXQgbGFiZWxzIGZvciBzbGlkZXJcclxuICAgIHZhciBsYWJlbHNfYyA9IHNsaWRlci5zaWJsaW5ncygnLnVpLXNsaWRlci1sYWJlbHMnKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoJCh0aGlzKS5kYXRhKCd1aS1zbGlkZXInKS5nZXQoMCkgPT0gc2xpZGVyLmdldCgwKSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBsYWJlbHMgPSBsYWJlbHNfYy5maW5kKCcudWktc2xpZGVyLWxhYmVsLXRleHQnKTtcclxuXHJcbiAgICAvLyBBcHBseSBhdXRvc2l6ZVxyXG4gICAgaWYgKChzbGlkZXIuZGF0YSgnc2xpZGVyLWF1dG9zaXplJykgfHwgZmFsc2UpLnRvU3RyaW5nKCkgPT0gJ3RydWUnKVxyXG4gICAgICAgIGF1dG9zaXplKHNsaWRlciwgbGFiZWxzKTtcclxuXHJcbiAgICAvLyBHZXQgYW5kIGFwcGx5IGxheW91dFxyXG4gICAgdmFyIGxheW91dF9uYW1lID0gc2xpZGVyLmRhdGEoJ3NsaWRlci1sYWJlbHMtbGF5b3V0JykgfHwgJ3N0YW5kYXJkJyxcclxuICAgICAgICBsYXlvdXQgPSBsYXlvdXRfbmFtZSBpbiBsYXlvdXRzID8gbGF5b3V0c1tsYXlvdXRfbmFtZV0gOiBsYXlvdXRzLnN0YW5kYXJkO1xyXG4gICAgbGFiZWxzX2MuYWRkQ2xhc3MoJ2xheW91dC0nICsgbGF5b3V0X25hbWUpO1xyXG4gICAgbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscyk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRvb2x0aXBzXHJcbiAgICB0b29sdGlwcy5jcmVhdGVUb29sdGlwKGxhYmVsc19jLmNoaWxkcmVuKCksIHtcclxuICAgICAgICB0aXRsZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gJCh0aGlzKS50ZXh0KCk7IH1cclxuICAgICAgICAsIHBlcnNpc3RlbnQ6IHRydWVcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhdXRvc2l6ZShzbGlkZXIsIGxhYmVscykge1xyXG4gICAgdmFyIHRvdGFsX3dpZHRoID0gMDtcclxuICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0b3RhbF93aWR0aCArPSAkKHRoaXMpLm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBjID0gc2xpZGVyLmNsb3Nlc3QoJy51aS1zbGlkZXItY29udGFpbmVyJyksXHJcbiAgICAgICAgbWF4ID0gcGFyc2VGbG9hdChjLmNzcygnbWF4LXdpZHRoJykpLFxyXG4gICAgICAgIG1pbiA9IHBhcnNlRmxvYXQoYy5jc3MoJ21pbi13aWR0aCcpKTtcclxuICAgIGlmIChtYXggIT0gTnVtYmVyLk5hTiAmJiB0b3RhbF93aWR0aCA+IG1heClcclxuICAgICAgICB0b3RhbF93aWR0aCA9IG1heDtcclxuICAgIGlmIChtaW4gIT0gTnVtYmVyLk5hTiAmJiB0b3RhbF93aWR0aCA8IG1pbilcclxuICAgICAgICB0b3RhbF93aWR0aCA9IG1pbjtcclxuICAgIGMud2lkdGgodG90YWxfd2lkdGgpO1xyXG59XHJcblxyXG4vKiogU2V0IG9mIGRpZmZlcmVudCBsYXlvdXRzIGZvciBsYWJlbHMsIGFsbG93aW5nIGRpZmZlcmVudCBraW5kcyBvZiBcclxucGxhY2VtZW50IGFuZCB2aXN1YWxpemF0aW9uIHVzaW5nIHRoZSBzbGlkZXIgZGF0YSBvcHRpb24gJ2xhYmVscy1sYXlvdXQnLlxyXG5Vc2VkIGJ5ICd1cGRhdGUnLCBhbG1vc3QgdGhlICdzdGFuZGFyZCcgbXVzdCBleGlzdCBhbmQgY2FuIGJlIGluY3JlYXNlZFxyXG5leHRlcm5hbGx5XHJcbioqL1xyXG52YXIgbGF5b3V0cyA9IHt9O1xyXG4vKiogU2hvdyB0aGUgbWF4aW11bSBudW1iZXIgb2YgbGFiZWxzIGluIGVxdWFsbHkgc2l6ZWQgZ2FwcyBidXRcclxudGhlIGxhc3QgbGFiZWwgdGhhdCBpcyBlbnN1cmVkIHRvIGJlIHNob3dlZCBldmVuIGlmIGl0IGNyZWF0ZXNcclxuYSBoaWdoZXIgZ2FwIHdpdGggdGhlIHByZXZpb3VzIG9uZS5cclxuKiovXHJcbmxheW91dHMuc3RhbmRhcmQgPSBmdW5jdGlvbiBzdGFuZGFyZF9sYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKSB7XHJcbiAgICAvLyBDaGVjayBpZiB0aGVyZSBhcmUgbW9yZSBsYWJlbHMgdGhhbiBhdmFpbGFibGUgc3BhY2VcclxuICAgIC8vIEdldCBtYXhpbXVtIGxhYmVsIHdpZHRoXHJcbiAgICB2YXIgaXRlbV93aWR0aCA9IDA7XHJcbiAgICBsYWJlbHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHR3ID0gJCh0aGlzKS5vdXRlcldpZHRoKHRydWUpO1xyXG4gICAgICAgIGlmICh0dyA+PSBpdGVtX3dpZHRoKVxyXG4gICAgICAgICAgICBpdGVtX3dpZHRoID0gdHc7XHJcbiAgICB9KTtcclxuICAgIC8vIElmIHRoZXJlIGlzIHdpZHRoLCBpZiBub3QsIGVsZW1lbnQgaXMgbm90IHZpc2libGUgY2Fubm90IGJlIGNvbXB1dGVkXHJcbiAgICBpZiAoaXRlbV93aWR0aCA+IDApIHtcclxuICAgICAgICAvLyBHZXQgdGhlIHJlcXVpcmVkIHN0ZXBwaW5nIG9mIGxhYmVsc1xyXG4gICAgICAgIHZhciBsYWJlbHNfc3RlcCA9IE1hdGguY2VpbChpdGVtX3dpZHRoIC8gKHNsaWRlci53aWR0aCgpIC8gbGFiZWxzLmxlbmd0aCkpLFxyXG4gICAgICAgIGxhYmVsc19zdGVwcyA9IGxhYmVscy5sZW5ndGggLyBsYWJlbHNfc3RlcDtcclxuICAgICAgICBpZiAobGFiZWxzX3N0ZXAgPiAxKSB7XHJcbiAgICAgICAgICAgIC8vIEhpZGUgdGhlIGxhYmVscyBvbiBwb3NpdGlvbnMgb3V0IG9mIHRoZSBzdGVwXHJcbiAgICAgICAgICAgIHZhciBuZXdpID0gMCxcclxuICAgICAgICAgICAgICAgIGxpbWl0ID0gbGFiZWxzLmxlbmd0aCAtIDEgLSBsYWJlbHNfc3RlcDtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYWJlbHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBsYmwgPSAkKGxhYmVsc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoKGkgKyAxKSA8IGxhYmVscy5sZW5ndGggJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgIGkgJSBsYWJlbHNfc3RlcCB8fFxyXG4gICAgICAgICAgICAgICAgICAgIGkgPiBsaW1pdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgbGJsLmhpZGUoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvd1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSBsYmwuc2hvdygpLnBhcmVudCgpLmFkZENsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwb3NpdGlvbmF0ZSBwYXJlbnRcclxuICAgICAgICAgICAgICAgICAgICAvLyBwb3NpdGlvbmF0ZShwYXJlbnQsIG5ld2ksIGxhYmVsc19zdGVwcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aSsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG4vKiogU2hvdyBsYWJlbHMgbnVtYmVyIHZhbHVlcyBmb3JtYXR0ZWQgYXMgaG91cnMsIHdpdGggb25seVxyXG5pbnRlZ2VyIGhvdXJzIGJlaW5nIHNob3dlZCwgdGhlIG1heGltdW0gbnVtYmVyIG9mIGl0LlxyXG4qKi9cclxubGF5b3V0cy5ob3VycyA9IGZ1bmN0aW9uIGhvdXJzX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMsIHNob3dfYWxsKSB7XHJcbiAgICB2YXIgaW50TGFiZWxzID0gc2xpZGVyLmZpbmQoJy5pbnRlZ2VyLWhvdXInKTtcclxuICAgIGlmICghaW50TGFiZWxzLmxlbmd0aCkge1xyXG4gICAgICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdob3VyLXByb2Nlc3NlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHBhcnNlRmxvYXQoJHQudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgIGlmICh2ICE9IE51bWJlci5OYU4pIHtcclxuICAgICAgICAgICAgICAgICAgICB2ID0gbXUucm91bmRUbyh2LCAyKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodiAlIDEgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LmFkZENsYXNzKCdkZWNpbWFsLWhvdXInKS5oaWRlKCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHYgJSAwLjUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5wYXJlbnQoKS5hZGRDbGFzcygnc3Ryb25nJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LnRleHQoVGltZVNwYW4uZnJvbUhvdXJzKHYpLnRvU2hvcnRTdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2ludGVnZXItaG91cicpLnNob3coKS5wYXJlbnQoKS5hZGRDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnRMYWJlbHMgPSBpbnRMYWJlbHMuYWRkKCR0KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdob3VyLXByb2Nlc3NlZCcsIHRydWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAoc2hvd19hbGwgIT09IHRydWUpXHJcbiAgICAgICAgbGF5b3V0cy5zdGFuZGFyZChzbGlkZXIsIGludExhYmVscy5wYXJlbnQoKSwgaW50TGFiZWxzKTtcclxufTtcclxubGF5b3V0c1snYWxsLXZhbHVlcyddID0gZnVuY3Rpb24gYWxsX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpIHtcclxuICAgIC8vIFNob3dpbmcgYWxsIGxhYmVsc1xyXG4gICAgbGFiZWxzX2Muc2hvdygpLmFkZENsYXNzKCd2aXNpYmxlJykuY2hpbGRyZW4oKS5zaG93KCk7XHJcbn07XHJcbmxheW91dHNbJ2FsbC1ob3VycyddID0gZnVuY3Rpb24gYWxsX2hvdXJzX2xheW91dCgpIHtcclxuICAgIC8vIEp1c3QgdXNlIGhvdXJzIGxheW91dCBidXQgc2hvd2luZyBhbGwgaW50ZWdlciBob3Vyc1xyXG4gICAgQXJyYXkucHJvdG90eXBlLnB1c2guY2FsbChhcmd1bWVudHMsIHRydWUpO1xyXG4gICAgbGF5b3V0cy5ob3Vycy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBjcmVhdGU6IGNyZWF0ZSxcclxuICAgIHVwZGF0ZTogdXBkYXRlLFxyXG4gICAgbGF5b3V0czogbGF5b3V0c1xyXG59O1xyXG4iLCIvKiBTZXQgb2YgY29tbW9uIExDIGNhbGxiYWNrcyBmb3IgbW9zdCBBamF4IG9wZXJhdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKSxcclxuICAgIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gQUtBOiBhamF4RXJyb3JQb3B1cEhhbmRsZXJcclxuZnVuY3Rpb24gbGNPbkVycm9yKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgLy8gSWYgaXMgYSBjb25uZWN0aW9uIGFib3J0ZWQsIG5vIHNob3cgbWVzc2FnZS5cclxuICAgIC8vIHJlYWR5U3RhdGUgZGlmZmVyZW50IHRvICdkb25lOjQnIG1lYW5zIGFib3J0ZWQgdG9vLCBcclxuICAgIC8vIGJlY2F1c2Ugd2luZG93IGJlaW5nIGNsb3NlZC9sb2NhdGlvbiBjaGFuZ2VkXHJcbiAgICBpZiAobWVzc2FnZSA9PSAnYWJvcnQnIHx8IGp4LnJlYWR5U3RhdGUgIT0gNClcclxuICAgICAgICByZXR1cm47XHJcblxyXG4gICAgdmFyIG0gPSBtZXNzYWdlO1xyXG4gICAgdmFyIGlmcmFtZSA9IG51bGw7XHJcbiAgICBzaXplID0gcG9wdXAuc2l6ZSgnbGFyZ2UnKTtcclxuICAgIHNpemUuaGVpZ2h0IC09IDM0O1xyXG4gICAgaWYgKG0gPT0gJ2Vycm9yJykge1xyXG4gICAgICAgIGlmcmFtZSA9IGNyZWF0ZUlmcmFtZShqeC5yZXNwb25zZVRleHQsIHNpemUpO1xyXG4gICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgbSA9IG51bGw7XHJcbiAgICB9ICBlbHNlXHJcbiAgICAgICAgbSA9IG0gKyBcIjsgXCIgKyBleDtcclxuXHJcbiAgICAvLyBCbG9jayBhbGwgd2luZG93LCBub3Qgb25seSBjdXJyZW50IGVsZW1lbnRcclxuICAgICQuYmxvY2tVSShlcnJvckJsb2NrKG0sIG51bGwsIHBvcHVwLnN0eWxlKHNpemUpKSk7XHJcbiAgICBpZiAoaWZyYW1lKVxyXG4gICAgICAgICQoJy5ibG9ja01zZycpLmFwcGVuZChpZnJhbWUpO1xyXG4gICAgJCgnLmJsb2NrVUkgLmNsb3NlLXBvcHVwJykuY2xpY2soZnVuY3Rpb24gKCkgeyAkLnVuYmxvY2tVSSgpOyByZXR1cm4gZmFsc2U7IH0pO1xyXG59XHJcblxyXG4vLyBBS0E6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uQ29tcGxldGUoKSB7XHJcbiAgICAvLyBEaXNhYmxlIGxvYWRpbmdcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxvYWRpbmd0aW1lciB8fCB0aGlzLmxvYWRpbmdUaW1lcik7XHJcbiAgICAvLyBVbmJsb2NrXHJcbiAgICBpZiAodGhpcy5hdXRvVW5ibG9ja0xvYWRpbmcpIHtcclxuICAgICAgICAvLyBEb3VibGUgdW4tbG9jaywgYmVjYXVzZSBhbnkgb2YgdGhlIHR3byBzeXN0ZW1zIGNhbiBiZWluZyB1c2VkOlxyXG4gICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuYm94KTtcclxuICAgICAgICB0aGlzLmJveC51bmJsb2NrKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXJcclxuZnVuY3Rpb24gbGNPblN1Y2Nlc3MoZGF0YSwgdGV4dCwgangpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgLy8gU3VwcG9ydGVkIHRoZSBnZW5lcmljIGN0eC5lbGVtZW50IGZyb20ganF1ZXJ5LnJlbG9hZFxyXG4gICAgaWYgKGN0eC5lbGVtZW50KSBjdHguZm9ybSA9IGN0eC5lbGVtZW50O1xyXG4gICAgLy8gU3BlY2lmaWMgc3R1ZmYgb2YgYWpheEZvcm1zXHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIERvIEpTT04gYWN0aW9uIGJ1dCBpZiBpcyBub3QgSlNPTiBvciB2YWxpZCwgbWFuYWdlIGFzIEhUTUw6XHJcbiAgICBpZiAoIWRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgLy8gQXZvaWQgZW1wdHkgZG9jdW1lbnRzIGJlaW5nIHBhcnNlZCAocmFpc2UgZXJyb3IpXHJcbiAgICAgICAgaWYgKCQudHJpbShkYXRhKSkge1xyXG4gICAgICAgICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYSBtYWxmb3JtZWQgZG9jdW1lbnQgaXMgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoZGF0YSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBGb3IgJ3JlbG9hZCcgc3VwcG9ydCwgY2hlY2sgdG9vIHRoZSBjb250ZXh0Lm1vZGUsIGFuZCBib3RoIHJlbG9hZCBvciBhamF4Rm9ybXMgY2hlY2sgZGF0YSBhdHRyaWJ1dGUgdG9vXHJcbiAgICAgICAgY3R4LmJveElzQ29udGFpbmVyID0gY3R4LmJveElzQ29udGFpbmVyO1xyXG4gICAgICAgIHZhciByZXBsYWNlQm94Q29udGVudCA9XHJcbiAgICAgICAgICAoY3R4Lm9wdGlvbnMgJiYgY3R4Lm9wdGlvbnMubW9kZSA9PT0gJ3JlcGxhY2UtY29udGVudCcpIHx8XHJcbiAgICAgICAgICBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnO1xyXG5cclxuICAgICAgICAvLyBTdXBwb3J0IGZvciByZWxvYWQsIGF2b2lkaW5nIGltcG9ydGFudCBidWdzIHdpdGggcmVsb2FkaW5nIGJveGVzIHRoYXQgY29udGFpbnMgZm9ybXM6XHJcbiAgICAgICAgLy8gSWYgb3BlcmF0aW9uIGlzIGEgcmVsb2FkLCBkb24ndCBjaGVjayB0aGUgYWpheC1ib3hcclxuICAgICAgICB2YXIgamIgPSBuZXdodG1sO1xyXG4gICAgICAgIGlmICghY3R4LmlzUmVsb2FkKSB7XHJcbiAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgcmV0dXJuZWQgZWxlbWVudCBpcyB0aGUgYWpheC1ib3gsIGlmIG5vdCwgZmluZFxyXG4gICAgICAgICAgLy8gdGhlIGVsZW1lbnQgaW4gdGhlIG5ld2h0bWw6XHJcbiAgICAgICAgICBqYiA9IG5ld2h0bWwuZmlsdGVyKCcuYWpheC1ib3gnKTtcclxuICAgICAgICAgIGlmIChqYi5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICAgIGlmICghY3R4LmJveElzQ29udGFpbmVyICYmICFqYi5pcygnLmFqYXgtYm94JykpXHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbC5maW5kKCcuYWpheC1ib3g6ZXEoMCknKTtcclxuICAgICAgICAgIGlmICghamIgfHwgamIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGFqYXgtYm94LCB1c2UgYWxsIGVsZW1lbnQgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpXHJcbiAgICAgICAgICAgIC8vIFJlcGxhY2UgdGhlIGJveCBjb250ZW50IHdpdGggdGhlIGNvbnRlbnQgb2YgdGhlIHJldHVybmVkIGJveFxyXG4gICAgICAgICAgICAvLyBvciBhbGwgaWYgdGhlcmUgaXMgbm8gYWpheC1ib3ggaW4gdGhlIHJlc3VsdC5cclxuICAgICAgICAgICAgamIgPSBqYi5pcygnLmFqYXgtYm94JykgPyBqYi5jb250ZW50cygpIDogamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVwbGFjZUJveENvbnRlbnQpIHtcclxuICAgICAgICAgIGN0eC5ib3guZW1wdHkoKS5hcHBlbmQoamIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY3R4LmJveElzQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIC8vIGpiIGlzIGNvbnRlbnQgb2YgdGhlIGJveCBjb250YWluZXI6XHJcbiAgICAgICAgICAgIGN0eC5ib3guaHRtbChqYik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gYm94IGlzIGNvbnRlbnQgdGhhdCBtdXN0IGJlIHJlcGxhY2VkIGJ5IHRoZSBuZXcgY29udGVudDpcclxuICAgICAgICAgICAgY3R4LmJveC5yZXBsYWNlV2l0aChqYik7XHJcbiAgICAgICAgICAgIC8vIGFuZCByZWZyZXNoIHRoZSByZWZlcmVuY2UgdG8gYm94IHdpdGggdGhlIG5ldyBlbGVtZW50XHJcbiAgICAgICAgICAgIGN0eC5ib3ggPSBqYjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEl0IHN1cHBvcnRzIG5vcm1hbCBhamF4IGZvcm1zIGFuZCBzdWJmb3JtcyB0aHJvdWdoIGZpZWxkc2V0LmFqYXhcclxuICAgICAgICBpZiAoY3R4LmJveC5pcygnZm9ybS5hamF4JykgfHwgY3R4LmJveC5pcygnZmllbGRzZXQuYWpheCcpKVxyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94O1xyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2Zvcm0uYWpheDplcSgwKScpO1xyXG4gICAgICAgICAgaWYgKGN0eC5mb3JtLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2ZpZWxkc2V0LmFqYXg6ZXEoMCknKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKFxyXG4gICAgICAgICAgICAgICAgY3R4LmZvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50c1xyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBNb3ZlIGZvY3VzIHRvIHRoZSBlcnJvcnMgYXBwZWFyZWQgb24gdGhlIHBhZ2UgKGlmIHRoZXJlIGFyZSk6XHJcbiAgICAgICAgdmFyIHZhbGlkYXRpb25TdW1tYXJ5ID0gamIuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKTtcclxuICAgICAgICBpZiAodmFsaWRhdGlvblN1bW1hcnkubGVuZ3RoKVxyXG4gICAgICAgICAgbW92ZUZvY3VzVG8odmFsaWRhdGlvblN1bW1hcnkpO1xyXG4gICAgICAgIC8vIFRPRE86IEl0IHNlZW1zIHRoYXQgaXQgcmV0dXJucyBhIGRvY3VtZW50LWZyYWdtZW50IGluc3RlYWQgb2YgYSBlbGVtZW50IGFscmVhZHkgaW4gZG9jdW1lbnRcclxuICAgICAgICAvLyBmb3IgY3R4LmZvcm0gKG1heWJlIGpiIHRvbz8pIHdoZW4gdXNpbmcgKiBjdHguYm94LmRhdGEoJ3JlbG9hZC1tb2RlJykgPT09ICdyZXBsYWNlLWNvbnRlbnQnICogXHJcbiAgICAgICAgLy8gKG1heWJlIG9uIG90aGVyIGNhc2VzIHRvbz8pLlxyXG4gICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgW2piLCBjdHguZm9ybSwganhdKTtcclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBtZXNzYWdlLCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IGN0eC5mb3JtLmRhdGEoJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJykgfHwgJ0RvbmUhJztcclxuICAgIGN0eC5ib3guYmxvY2soaW5mb0Jsb2NrKG1lc3NhZ2UsIHtcclxuICAgICAgICBjc3M6IHBvcHVwLnN0eWxlKHBvcHVwLnNpemUoJ3NtYWxsJykpXHJcbiAgICB9KSlcclxuICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlOyBcclxuICAgIH0pO1xyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcblxyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2IGNsYXNzPVwib2stZ28tYm94XCIvPicpO1xyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPHNwYW4gY2xhc3M9XCJzdWNjZXNzLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuU3VjY2Vzc01lc3NhZ2UpKTtcclxuICAgIGlmIChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKVxyXG4gICAgICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhZGRpdGlvbmFsLW1lc3NhZ2VcIi8+JykuYXBwZW5kKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpKTtcclxuXHJcbiAgICB2YXIgb2tCdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBvay1hY3Rpb24gY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNva1wiLz4nKS5hcHBlbmQoZGF0YS5Pa0xhYmVsKTtcclxuICAgIHZhciBnb0J0biA9ICcnO1xyXG4gICAgaWYgKGRhdGEuR29VUkwgJiYgZGF0YS5Hb0xhYmVsKSB7XHJcbiAgICAgICAgZ29CdG4gPSAkKCc8YSBjbGFzcz1cImFjdGlvbiBnby1hY3Rpb25cIi8+JykuYXR0cignaHJlZicsIGRhdGEuR29VUkwpLmFwcGVuZChkYXRhLkdvTGFiZWwpO1xyXG4gICAgICAgIC8vIEZvcmNpbmcgdGhlICdjbG9zZS1hY3Rpb24nIGluIHN1Y2ggYSB3YXkgdGhhdCBmb3IgaW50ZXJuYWwgbGlua3MgdGhlIHBvcHVwIGdldHMgY2xvc2VkIGluIGEgc2FmZSB3YXk6XHJcbiAgICAgICAgZ29CdG4uY2xpY2soZnVuY3Rpb24gKCkgeyBva0J0bi5jbGljaygpOyBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pOyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWN0aW9ucyBjbGVhcmZpeFwiLz4nKS5hcHBlbmQob2tCdG4pLmFwcGVuZChnb0J0bikpO1xyXG5cclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4oY29udGVudCwgY3R4LmJveCwgbnVsbCwge1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBkb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCkge1xyXG4gICAgLy8gSWYgaXMgYSBKU09OIHJlc3VsdDpcclxuICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgIGlmIChjdHguYm94KVxyXG4gICAgICAgICAgICAvLyBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9yc1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChjdHguYm94KTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMDogZ2VuZXJhbCBzdWNjZXNzIGNvZGUsIHNob3cgbWVzc2FnZSBzYXlpbmcgdGhhdCAnYWxsIHdhcyBmaW5lJ1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdCwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMTogZG8gYSByZWRpcmVjdFxyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDEpIHtcclxuICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMjogc2hvdyBsb2dpbiBwb3B1cCAod2l0aCB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgMzogcmVsb2FkIGN1cnJlbnQgcGFnZSBjb250ZW50IHRvIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIC8vIE5vdGU6IHRvIHJlbG9hZCBzYW1lIHVybCBwYWdlIGNvbnRlbnQsIGlzIGJldHRlciByZXR1cm4gdGhlIGh0bWwgZGlyZWN0bHkgZnJvbVxyXG4gICAgICAgICAgICAvLyB0aGlzIGFqYXggc2VydmVyIHJlcXVlc3QuXHJcbiAgICAgICAgICAgIC8vY29udGFpbmVyLnVuYmxvY2soKTsgaXMgYmxvY2tlZCBhbmQgdW5ibG9ja2VkIGFnYWluIGJ5IHRoZSByZWxvYWQgbWV0aG9kOlxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVsb2FkKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA0KSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgU3VjY2Vzc01lc3NhZ2UsIGF0dGFjaGluZyBhbmQgZXZlbnQgaGFuZGxlciB0byBnbyB0byBSZWRpcmVjdFVSTFxyXG4gICAgICAgICAgICBjdHguYm94Lm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhkYXRhLlJlc3VsdC5SZWRpcmVjdFVSTCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5TdWNjZXNzTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNSkge1xyXG4gICAgICAgICAgICAvLyBDaGFuZ2UgbWFpbi1hY3Rpb24gYnV0dG9uIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBidG4gPSBjdHguZm9ybS5maW5kKCcubWFpbi1hY3Rpb24nKTtcclxuICAgICAgICAgICAgdmFyIGRtc2cgPSBidG4uZGF0YSgnZGVmYXVsdC10ZXh0Jyk7XHJcbiAgICAgICAgICAgIGlmICghZG1zZylcclxuICAgICAgICAgICAgICAgIGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnLCBidG4udGV4dCgpKTtcclxuICAgICAgICAgICAgdmFyIG1zZyA9IGRhdGEuUmVzdWx0IHx8IGJ0bi5kYXRhKCdzdWNjZXNzLXBvc3QtdGV4dCcpIHx8ICdEb25lISc7XHJcbiAgICAgICAgICAgIGJ0bi50ZXh0KG1zZyk7XHJcbiAgICAgICAgICAgIC8vIEFkZGluZyBzdXBwb3J0IHRvIHJlc2V0IGJ1dHRvbiB0ZXh0IHRvIGRlZmF1bHQgb25lXHJcbiAgICAgICAgICAgIC8vIHdoZW4gdGhlIEZpcnN0IG5leHQgY2hhbmdlcyBoYXBwZW5zIG9uIHRoZSBmb3JtOlxyXG4gICAgICAgICAgICAkKGN0eC5mb3JtKS5vbmUoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBidG4udGV4dChidG4uZGF0YSgnZGVmYXVsdC10ZXh0JykpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBmb3IgY3VzdG9tIGhhbmRsZXJzXHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gT2stR28gYWN0aW9ucyBwb3B1cCB3aXRoICdzdWNjZXNzJyBhbmQgJ2FkZGl0aW9uYWwnIG1lc3NhZ2VzLlxyXG4gICAgICAgICAgICBzaG93T2tHb1BvcHVwKGN0eCwgZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA3KSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSA3OiBzaG93IG1lc3NhZ2Ugc2F5aW5nIGNvbnRhaW5lZCBhdCBkYXRhLlJlc3VsdC5NZXNzYWdlLlxyXG4gICAgICAgICAgICAvLyBUaGlzIGNvZGUgYWxsb3cgYXR0YWNoIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gaW4gZGF0YS5SZXN1bHQgdG8gZGlzdGluZ3Vpc2hcclxuICAgICAgICAgICAgLy8gZGlmZmVyZW50IHJlc3VsdHMgYWxsIHNob3dpbmcgYSBtZXNzYWdlIGJ1dCBtYXliZSBub3QgYmVpbmcgYSBzdWNjZXNzIGF0IGFsbFxyXG4gICAgICAgICAgICAvLyBhbmQgbWF5YmUgZG9pbmcgc29tZXRoaW5nIG1vcmUgaW4gdGhlIHRyaWdnZXJlZCBldmVudCB3aXRoIHRoZSBkYXRhIG9iamVjdC5cclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuTWVzc2FnZSwgZGF0YSk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICAgIC8vIFVzZXIgQ29kZTogdHJpZ2dlciBjdXN0b20gZXZlbnQgdG8gbWFuYWdlIHJlc3VsdHM6XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeCwgY3R4XSk7XHJcbiAgICAgICAgfSBlbHNlIHsgLy8gZGF0YS5Db2RlIDwgMFxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhbiBlcnJvciBjb2RlLlxyXG5cclxuICAgICAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybS5nZXQoMCksIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgICAgICAgICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICAgICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IFwiRXJyb3I6IFwiICsgZGF0YS5Db2RlICsgXCI6IFwiICsgSlNPTi5zdHJpbmdpZnkoZGF0YS5SZXN1bHQgPyAoZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlID8gZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlIDogZGF0YS5SZXN1bHQpIDogJycpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCQoJzxkaXYvPicpLmFwcGVuZChtZXNzYWdlKSwgY3R4LmJveCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXJyb3I6IGxjT25FcnJvcixcclxuICAgICAgICBzdWNjZXNzOiBsY09uU3VjY2VzcyxcclxuICAgICAgICBjb21wbGV0ZTogbGNPbkNvbXBsZXRlLFxyXG4gICAgICAgIGRvSlNPTkFjdGlvbjogZG9KU09OQWN0aW9uXHJcbiAgICB9O1xyXG59IiwiLyogRm9ybXMgc3VibWl0dGVkIHZpYSBBSkFYICovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgY2FsbGJhY2tzID0gcmVxdWlyZSgnLi9hamF4Q2FsbGJhY2tzJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyksXHJcbiAgICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpLFxyXG4gICAgdmFsaWRhdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpO1xyXG5cclxuLy8gR2xvYmFsIHNldHRpbmdzLCB3aWxsIGJlIHVwZGF0ZWQgb24gaW5pdCBidXQgaXMgYWNjZXNzZWRcclxuLy8gdGhyb3VnaCBjbG9zdXJlIGZyb20gYWxsIGZ1bmN0aW9ucy5cclxuLy8gTk9URTogaXMgc3RhdGljLCBkb2Vzbid0IGFsbG93cyBtdWx0aXBsZSBjb25maWd1cmF0aW9uLCBvbmUgaW5pdCBjYWxsIHJlcGxhY2UgcHJldmlvdXNcclxuLy8gRGVmYXVsdHM6XHJcbnZhciBzZXR0aW5ncyA9IHtcclxuICAgIGxvYWRpbmdEZWxheTogMCxcclxuICAgIGVsZW1lbnQ6IGRvY3VtZW50XHJcbn07XHJcblxyXG4vLyBBZGFwdGVkIGNhbGxiYWNrc1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXIoKSB7XHJcbiAgICBjYWxsYmFja3MuY29tcGxldGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEVycm9yUG9wdXBIYW5kbGVyKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICBpZiAoIWN0eC5mb3JtKSBjdHguZm9ybSA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWN0eC5ib3gpIGN0eC5ib3ggPSBjdHguZm9ybTtcclxuICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShjdHguZm9ybSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gQ29tbW9uIGxvZ2ljXHJcbiAgICBjYWxsYmFja3MuZXJyb3IuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlcigpIHtcclxuICBjYWxsYmFja3Muc3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG4vKipcclxuICBQZXJmb3JtcyB0aGUgdmFsaWRhdGlvbiBvbiB0aGUgZm9ybSBvciBzdWJmb3JtIGFzIGRldGVybWluZVxyXG4gIHRoZSB2YWx1ZXMgaW4gdGhlIGNvbnRleHQgKEBjdHgpLCByZXR1cm5pbmcgdHJ1ZSBmb3Igc3VjY2Vzc1xyXG4gIGFuZCBmYWxzZSBmb3Igc29tZSBlcnJvciAoZWxlbWVudHMgZ2V0IG1hcmtlZCB3aXRoIHRoZSBlcnJvcixcclxuICBqdXN0IHRoZSBjYWxsZXIgbXVzdCBzdG9wIGFueSB0YXNrIG9uIGZhbHNlKS5cclxuKiovXHJcbmZ1bmN0aW9uIHZhbGlkYXRlRm9ybShjdHgpIHtcclxuICAvLyBWYWxpZGF0aW9uc1xyXG4gIHZhciB2YWxpZGF0aW9uUGFzc2VkID0gdHJ1ZTtcclxuICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3JtcyB0aHJvdWggZmllbGRzZXQuYWpheCwgd2UgbXVzdCBleGVjdXRlIHZhbGlkYXRpb25zIGFuZCB2ZXJpZmljYXRpb25cclxuICAvLyBpbiB0d28gc3RlcHMgYW5kIHVzaW5nIHRoZSByZWFsIGZvcm0gdG8gbGV0IHZhbGlkYXRpb24gbWVjaGFuaXNtIHdvcmtcclxuICB2YXIgaXNTdWJmb3JtID0gY3R4LmZvcm0uaXMoJ2ZpZWxkc2V0LmFqYXgnKTtcclxuICB2YXIgYWN0dWFsRm9ybSA9IGlzU3ViZm9ybSA/IGN0eC5mb3JtLmNsb3Nlc3QoJ2Zvcm0nKSA6IGN0eC5mb3JtLFxyXG4gICAgICBkaXNhYmxlZFN1bW1hcmllcyA9IG5ldyBqUXVlcnkoKSxcclxuICAgICAgZGlzYWJsZWRGaWVsZHMgPSBuZXcgalF1ZXJ5KCk7XHJcblxyXG4gIC8vIE9uIHN1YmZvcm0gdmFsaWRhdGlvbiwgd2UgZG9uJ3Qgd2FudCB0aGUgb3V0c2lkZSBzdWJmb3JtIGVsZW1lbnRzIGFuZCB2YWxpZGF0aW9uLXN1bW1hcnkgY29udHJvbHMgdG8gYmUgYWZmZWN0ZWRcclxuICAvLyBieSB0aGlzIHZhbGlkYXRpb24gKHRvIGF2b2lkIHRvIHNob3cgZXJyb3JzIHRoZXJlIHRoYXQgZG9lc24ndCBpbnRlcmVzdCB0byB0aGUgcmVzdCBvZiB0aGUgZm9ybSlcclxuICAvLyBUbyBmdWxsZmlsbCB0aGlzIHJlcXVpc2l0LCB3ZSBuZWVkIHRvIGhpZGUgaXQgZm9yIHRoZSB2YWxpZGF0b3IgZm9yIGEgd2hpbGUgYW5kIGxldCBvbmx5IGFmZmVjdFxyXG4gIC8vIGFueSBsb2NhbCBzdW1tYXJ5IChpbnNpZGUgdGhlIHN1YmZvcm0pLlxyXG4gIC8vIFRoZSBzYW1lIGZvciBmb3JtIGVsZW1lbnRzIG91dHNpZGUgdGhlIHN1YmZvcm0sIHdlIGRvbid0IHdhbnQgaXRzIGVycm9ycyBmb3Igbm93LlxyXG4gIGlmIChpc1N1YmZvcm0pIHtcclxuICAgIHZhciBvdXRzaWRlRWxlbWVudHMgPSAoZnVuY3Rpb24oZikge1xyXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIE9ubHkgdGhvc2UgdGhhdCBhcmUgb3V0c2lkZSB0aGUgc3ViZm9ybVxyXG4gICAgICAgIHJldHVybiAhJC5jb250YWlucyhmLCB0aGlzKTtcclxuICAgICAgfTtcclxuICAgIH0pKGN0eC5mb3JtLmdldCgwKSk7XHJcblxyXG4gICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBhY3R1YWxGb3JtXHJcbiAgICAuZmluZCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nKVxyXG4gICAgLmZpbHRlcihvdXRzaWRlRWxlbWVudHMpXHJcbiAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAnZmFsc2UnKTtcclxuXHJcbiAgICBkaXNhYmxlZEZpZWxkcyA9IGFjdHVhbEZvcm1cclxuICAgIC5maW5kKCdbZGF0YS12YWw9dHJ1ZV0nKVxyXG4gICAgLmZpbHRlcihvdXRzaWRlRWxlbWVudHMpXHJcbiAgICAuYXR0cignZGF0YS12YWwnLCAnZmFsc2UnKTtcclxuICB9XHJcblxyXG4gIC8vIEZpcnN0IGF0IGFsbCwgaWYgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gIHZhciB2YWxvYmplY3QgPSBhY3R1YWxGb3JtLmRhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlLlxyXG4gIC8vIEN1c3RvbSB2YWxpZGF0aW9uIGNhbiBiZSBhdHRhY2hlZCB0byBmb3JtcyBvciBmaWVsZHNldCwgYnV0XHJcbiAgLy8gdG8gc3VwcG9ydCBzdWJmb3Jtcywgb25seSBleGVjdXRlIGluIHRoZSBjdHguZm9ybSBlbGVtZW50IChjYW4gYmUgXHJcbiAgLy8gYSBmaWVsc2V0IHN1YmZvcm0pIGFuZCBhbnkgY2hpbGRyZW4gZmllbGRzZXQuXHJcbiAgY3R4LmZvcm0uYWRkKGN0eC5mb3JtLmZpbmQoJ2ZpZWxkc2V0JykpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGN1c3ZhbCA9ICQodGhpcykuZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicpO1xyXG4gICAgaWYgKGN1c3ZhbCAmJiBjdXN2YWwudmFsaWRhdGUgJiYgY3VzdmFsLnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnMoY3R4LmZvcm0pO1xyXG4gICAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIFRvIHN1cHBvcnQgc3ViLWZvcm1zLCB3ZSBtdXN0IGNoZWNrIHRoYXQgdmFsaWRhdGlvbnMgZXJyb3JzIGhhcHBlbmVkIGluc2lkZSB0aGVcclxuICAvLyBzdWJmb3JtIGFuZCBub3QgaW4gb3RoZXIgZWxlbWVudHMsIHRvIGRvbid0IHN0b3Agc3VibWl0IG9uIG5vdCByZWxhdGVkIGVycm9ycy5cclxuICAvLyAod2UgYXZvaWQgZXhlY3V0ZSB2YWxpZGF0aW9uIG9uIHRoYXQgZWxlbWVudHMgYnV0IGNvdWxkIGhhcHBlbiBhIHByZXZpb3VzIHZhbGlkYXRpb24pXHJcbiAgLy8gSnVzdCBsb29rIGZvciBtYXJrZWQgZWxlbWVudHM6XHJcbiAgaWYgKGlzU3ViZm9ybSAmJiBjdHguZm9ybS5maW5kKCcuaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmxlbmd0aClcclxuICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuXHJcbiAgLy8gUmUtZW5hYmxlIGFnYWluIHRoYXQgc3VtbWFyaWVzIHByZXZpb3VzbHkgZGlzYWJsZWRcclxuICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgZGlzYWJsZWRTdW1tYXJpZXMuYXR0cignZGF0YS12YWxtc2ctc3VtbWFyeScsICd0cnVlJyk7XHJcbiAgICBkaXNhYmxlZEZpZWxkcy5hdHRyKCdkYXRhLXZhbCcsICd0cnVlJyk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdmFsaWRhdGlvblBhc3NlZDtcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuKiBBamF4IEZvcm1zIGdlbmVyaWMgZnVuY3Rpb24uXHJcbiogUmVzdWx0IGV4cGVjdGVkIGlzOlxyXG4qIC0gaHRtbCwgZm9yIHZhbGlkYXRpb24gZXJyb3JzIGZyb20gc2VydmVyLCByZXBsYWNpbmcgY3VycmVudCAuYWpheC1ib3ggY29udGVudFxyXG4qIC0ganNvbiwgd2l0aCBzdHJ1Y3R1cmU6IHsgQ29kZTogaW50ZWdlci1udW1iZXIsIFJlc3VsdDogc3RyaW5nLW9yLW9iamVjdCB9XHJcbiogICBDb2RlIG51bWJlcnM6XHJcbiogICAgLSBOZWdhdGl2ZTogZXJyb3JzLCB3aXRoIGEgUmVzdWx0IG9iamVjdCB7IEVycm9yTWVzc2FnZTogc3RyaW5nIH1cclxuKiAgICAtIFplcm86IHN1Y2Nlc3MgcmVzdWx0LCBpdCBzaG93cyBhIG1lc3NhZ2Ugd2l0aCBjb250ZW50OiBSZXN1bHQgc3RyaW5nLCBlbHNlIGZvcm0gZGF0YSBhdHRyaWJ1dGUgJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJywgZWxzZSBhIGdlbmVyaWMgbWVzc2FnZVxyXG4qICAgIC0gMTogc3VjY2VzcyByZXN1bHQsIFJlc3VsdCBjb250YWlucyBhIFVSTCwgdGhlIHBhZ2Ugd2lsbCBiZSByZWRpcmVjdGVkIHRvIHRoYXQuXHJcbiogICAgLSBNYWpvciAxOiBzdWNjZXNzIHJlc3VsdCwgd2l0aCBjdXN0b20gaGFuZGxlciB0aHJvdWdodCB0aGUgZm9ybSBldmVudCAnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnLlxyXG4qL1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKGV2ZW50KSB7XHJcbiAgICAvLyBDb250ZXh0IHZhciwgdXNlZCBhcyBhamF4IGNvbnRleHQ6XHJcbiAgICB2YXIgY3R4ID0ge307XHJcbiAgICAvLyBEZWZhdWx0IGRhdGEgZm9yIHJlcXVpcmVkIHBhcmFtczpcclxuICAgIGN0eC5mb3JtID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmZvcm0gOiBudWxsKSB8fCAkKHRoaXMpO1xyXG4gICAgY3R4LmJveCA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5ib3ggOiBudWxsKSB8fCBjdHguZm9ybS5jbG9zZXN0KFwiLmFqYXgtYm94XCIpO1xyXG4gICAgdmFyIGFjdGlvbiA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5hY3Rpb24gOiBudWxsKSB8fCBjdHguZm9ybS5hdHRyKCdhY3Rpb24nKSB8fCAnJztcclxuXHJcbiAgICAvLyBDaGVjayB2YWxpZGF0aW9uXHJcbiAgICBpZiAodmFsaWRhdGVGb3JtKGN0eCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIC8vIFZhbGlkYXRpb24gZmFpbGVkLCBzdWJtaXQgY2Fubm90IGNvbnRpbnVlLCBvdXQhXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5jaGFuZ2VkRWxlbWVudHMgOiBudWxsKSB8fCBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIE5vdGlmaWNhdGlvbiBldmVudCB0byBhbGxvdyBzY3JpcHRzIHRvIGhvb2sgYWRkaXRpb25hbCB0YXNrcyBiZWZvcmUgc2VuZCBkYXRhXHJcbiAgICBjdHguZm9ybS50cmlnZ2VyKCdwcmVzdWJtaXQnLCBbY3R4XSk7XHJcblxyXG4gICAgLy8gTG9hZGluZywgd2l0aCByZXRhcmRcclxuICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LmJsb2NrKGJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgIH0sIHNldHRpbmdzLmxvYWRpbmdEZWxheSk7XHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICB2YXIgZGF0YSA9IGN0eC5mb3JtLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpO1xyXG5cclxuICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiAoYWN0aW9uKSxcclxuICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgc3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlcixcclxuICAgICAgICBjb21wbGV0ZTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTdG9wIG5vcm1hbCBQT1NUOlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBQdWJsaWMgaW5pdGlhbGl6YXRpb25cclxuZnVuY3Rpb24gaW5pdEFqYXhGb3JtcyhvcHRpb25zKSB7XHJcbiAgICAkLmV4dGVuZCh0cnVlLCBzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgdG8gbWFuYWdlIGFqYXggZm9ybXMgKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ3N1Ym1pdCcsICdmb3JtLmFqYXgnLCBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKTtcclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIGZvciBhIHNwZWNpYWwgYWpheCBmb3JtIGNhc2U6IHN1YmZvcm1zLCB1c2luZyBmaWVsZHNldHMuICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdjbGljaycsICdmaWVsZHNldC5hamF4IC5hamF4LWZpZWxkc2V0LXN1Ym1pdCcsXHJcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG5cclxuICAgICAgICAgIGV2ZW50LmRhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm06IGZvcm0sXHJcbiAgICAgICAgICAgIGJveDogZm9ybS5jbG9zZXN0KCcuYWpheC1ib3gnKSxcclxuICAgICAgICAgICAgYWN0aW9uOiBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGNoYW5nZWRFbGVtZW50czogY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCksIGZvcm0uZmluZCgnOmlucHV0W25hbWVdJykpXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuLyogVU5VU0VEP1xyXG5mdW5jdGlvbiBhamF4Rm9ybU1lc3NhZ2VPbkh0bWxSZXR1cm5lZFdpdGhvdXRWYWxpZGF0aW9uRXJyb3JzKGZvcm0sIG1lc3NhZ2UpIHtcclxuICAgIHZhciAkdCA9ICQoZm9ybSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb3JtIGVycm9ycywgc2hvdyBhIHN1Y2Nlc3NmdWwgbWVzc2FnZVxyXG4gICAgaWYgKCR0LmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAkdC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgICAgICBjc3M6IHBvcHVwU3R5bGUocG9wdXBTaXplKCdzbWFsbCcpKVxyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkgeyAkdC51bmJsb2NrKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbiAgICB9XHJcbn1cclxuKi9cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBpbml0QWpheEZvcm1zLFxyXG4gICAgICAgIG9uU3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgb25FcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfTsiLCIvKiBBdXRvIGNhbGN1bGF0ZSBzdW1tYXJ5IG9uIERPTSB0YWdnaW5nIHdpdGggY2xhc3NlcyB0aGUgZWxlbWVudHMgaW52b2x2ZWQuXHJcbiAqL1xyXG52YXIgbnUgPSByZXF1aXJlKCcuL251bWJlclV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMoKSB7XHJcbiAgICAkKCd0YWJsZS5jYWxjdWxhdGUtaXRlbXMtdG90YWxzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVSb3coKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciB0ciA9ICR0LmNsb3Nlc3QoJ3RyJyk7XHJcbiAgICAgICAgICAgIHZhciBpcCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZScpO1xyXG4gICAgICAgICAgICB2YXIgaXEgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKTtcclxuICAgICAgICAgICAgdmFyIGl0ID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXRvdGFsJyk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKG51LmdldE1vbmV5TnVtYmVyKGlwKSAqIG51LmdldE1vbmV5TnVtYmVyKGlxLCAxKSwgaXQpO1xyXG4gICAgICAgICAgICB0ci50cmlnZ2VyKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQodGhpcykuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXByaWNlLCAuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKS5vbignY2hhbmdlJywgY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChjYWxjdWxhdGVSb3cpO1xyXG4gICAgICAgICQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVTdW1tYXJ5KGZvcmNlKSB7XHJcbiAgICAkKCcuY2FsY3VsYXRlLXN1bW1hcnknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciBzID0gYy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeScpO1xyXG4gICAgICAgIHZhciBkID0gYy5maW5kKCd0YWJsZS5jYWxjdWxhdGUtc3VtbWFyeS1ncm91cCcpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGMoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAsIGZlZSA9IDAsIGR1cmF0aW9uID0gMDtcclxuICAgICAgICAgICAgdmFyIGdyb3VwcyA9IHt9O1xyXG4gICAgICAgICAgICBkLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwVG90YWwgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbENoZWNrZWQgPSAkKHRoaXMpLmlzKCcuY2FsY3VsYXRlLWFsbC1pdGVtcycpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQ2hlY2tlZCB8fCBpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuaXMoJzpjaGVja2VkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBUb3RhbCArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbDplcSgwKScpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eTplcSgwKScpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmVlICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWZlZTplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWR1cmF0aW9uOmVxKDApJykpICogcTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRvdGFsICs9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBncm91cHNbJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwJyldID0gZ3JvdXBUb3RhbDtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGdyb3VwVG90YWwsICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihkdXJhdGlvbiwgJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLmZpbmQoJy5ncm91cC10b3RhbC1kdXJhdGlvbicpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgc3VtbWFyeSB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcih0b3RhbCwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS10b3RhbCcpKTtcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZmVlLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWZlZScpKTtcclxuICAgICAgICAgICAgLy8gQW5kIGV2ZXJ5IGdyb3VwIHRvdGFsIHZhbHVlXHJcbiAgICAgICAgICAgIGZvciAodmFyIGcgaW4gZ3JvdXBzKSB7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cHNbZ10sIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktZ3JvdXAtJyArIGcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuY2hhbmdlKGNhbGMpO1xyXG4gICAgICAgIGQub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIGNhbGMpO1xyXG4gICAgICAgIGNhbGMoKTtcclxuICAgICAgICBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnLCB0cnVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSBkZXRhaWwgb2YgYSBwcmljaW5nIHN1bW1hcnksIG9uZSBkZXRhaWwgbGluZSBwZXIgc2VsZWN0ZWQgaXRlbVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkZCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbCcpLFxyXG4gICAgICAgICAgICAkdCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbC10cGwnKS5jaGlsZHJlbigndHI6ZXEoMCknKSxcclxuICAgICAgICAgICAgJGMgPSAkcy5jbG9zZXN0KCdmb3JtJyksXHJcbiAgICAgICAgICAgICRpdGVtcyA9ICRjLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbScpO1xyXG5cclxuICAgICAgICAvLyBEbyBpdCFcclxuICAgICAgICAvLyBSZW1vdmUgb2xkIGxpbmVzXHJcbiAgICAgICAgJGQuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyBDcmVhdGUgbmV3IG9uZXNcclxuICAgICAgICAkaXRlbXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyICRpID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25jZXB0ID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgcHJpY2UgPSBudS5nZXRNb25leU51bWJlcigkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2U6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgcm93IGFuZCBzZXQgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICB2YXIgJHJvdyA9ICR0LmNsb25lKClcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZGV0YWlsLXRwbCcpXHJcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2RldGFpbCcpO1xyXG4gICAgICAgICAgICAgICAgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY29uY2VwdCcpLnRleHQoY29uY2VwdCk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihwcmljZSwgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIHRhYmxlXHJcbiAgICAgICAgICAgICAgICAkZC5hcHBlbmQoJHJvdyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgIHZhciAkYyA9ICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAvLyBJbml0aWFsIGNhbGN1bGF0aW9uXHJcbiAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCk7XHJcbiAgICAvLyBDYWxjdWxhdGUgb24gcmVsZXZhbnQgZm9ybSBjaGFuZ2VzXHJcbiAgICAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLmNoYW5nZSh1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzIGV2ZW50XHJcbiAgICAkYy5vbignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbn1cclxuXHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvblRhYmxlSXRlbXM6IHNldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyxcclxuICAgICAgICBvblN1bW1hcnk6IHNldHVwQ2FsY3VsYXRlU3VtbWFyeSxcclxuICAgICAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5OiB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5LFxyXG4gICAgICAgIG9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5XHJcbiAgICB9OyIsIi8qIEZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBkb2N1bWVudCAob3IgaW4gQGNvbnRhaW5lcilcclxud2l0aCB0aGUgaHRtbDUgYXR0cmlidXRlICdhdXRvZm9jdXMnIChvciBhbHRlcm5hdGl2ZSBAY3NzU2VsZWN0b3IpLlxyXG5JdCdzIGZpbmUgYXMgYSBwb2x5ZmlsbCBhbmQgZm9yIGFqYXggbG9hZGVkIGNvbnRlbnQgdGhhdCB3aWxsIG5vdFxyXG5nZXQgdGhlIGJyb3dzZXIgc3VwcG9ydCBvZiB0aGUgYXR0cmlidXRlLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZvY3VzKGNvbnRhaW5lciwgY3NzU2VsZWN0b3IpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8IGRvY3VtZW50KTtcclxuICAgIGNvbnRhaW5lci5maW5kKGNzc1NlbGVjdG9yIHx8ICdbYXV0b2ZvY3VzXScpLmZvY3VzKCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0ZvY3VzOyIsIi8qKiBBdXRvLWZpbGwgbWVudSBzdWItaXRlbXMgdXNpbmcgdGFiYmVkIHBhZ2VzIC1vbmx5IHdvcmtzIGZvciBjdXJyZW50IHBhZ2UgaXRlbXMtICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdXRvZmlsbFN1Ym1lbnUoKSB7XHJcbiAgICAkKCcuYXV0b2ZpbGwtc3VibWVudSAuY3VycmVudCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRtZW51ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBzdWJtZW51IGVsZW1lbnRzIGZyb20gdGFicyBtYXJrZWQgd2l0aCBjbGFzcyAnYXV0b2ZpbGwtc3VibWVudS1pdGVtcydcclxuICAgICAgICB2YXIgaXRlbXMgPSAkKCcuYXV0b2ZpbGwtc3VibWVudS1pdGVtcyBsaTpub3QoLnJlbW92YWJsZSknKTtcclxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBpdGVtcywgY3JlYXRlIHRoZSBzdWJtZW51IGNsb25pbmcgaXQhXHJcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHN1Ym1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHBhcmVudG1lbnUuYXBwZW5kKHN1Ym1lbnUpO1xyXG4gICAgICAgICAgICAvLyBDbG9uaW5nIHdpdGhvdXQgZXZlbnRzOlxyXG4gICAgICAgICAgICB2YXIgbmV3aXRlbXMgPSBpdGVtcy5jbG9uZShmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAkKHN1Ym1lbnUpLmFwcGVuZChuZXdpdGVtcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIGF0dGFjaCBldmVudHMgdG8gbWFpbnRhaW4gdGhlIHRhYmJlZCBpbnRlcmZhY2Ugd29ya2luZ1xyXG4gICAgICAgICAgICAvLyBOZXcgSXRlbXMgKGNsb25lZCkgbXVzdCBjaGFuZ2UgdGFiczpcclxuICAgICAgICAgICAgbmV3aXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBpbiB0aGUgb3JpZ2luYWwgaXRlbVxyXG4gICAgICAgICAgICAgICAgJChcImFbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIsIGl0ZW1zKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTdG9wIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gT3JpZ2luYWwgaXRlbXMgbXVzdCBjaGFuZ2UgbWVudTpcclxuICAgICAgICAgICAgaXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbmV3aXRlbXMucGFyZW50KCkuZmluZChcImFcIikucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKS5cclxuICAgICAgICAgICAgICAgIGZpbHRlcihcIipbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gIE1vbnRobHkgY2FsZW5kYXIgY2xhc3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgZGF0ZUlTTyA9IHJlcXVpcmUoJ0xDL2RhdGVJU084NjAxJyksXHJcbiAgTGNXaWRnZXQgPSByZXF1aXJlKCcuLi9DWC9MY1dpZGdldCcpLFxyXG4gIGV4dGVuZCA9IHJlcXVpcmUoJy4uL0NYL2V4dGVuZCcpO1xyXG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcblxyXG4vKipcclxuICBQcml2YXRlIHV0aWxzXHJcbioqL1xyXG5cclxuLyoqXHJcbiAgUHJlZmV0Y2ggbmV4dCBtb250aCAoYmFzZWQgb24gdGhlIGdpdmVuIGRhdGVzKVxyXG4gIE5vdGU6IHRoaXMgY29kZSBpcyB2ZXJ5IHNpbWlsYXIgdG8gdXRpbHMud2Vla2x5Q2hlY2tBbmRQcmVmZXRjaFxyXG4qKi9cclxuZnVuY3Rpb24gbW9udGhseUNoZWNrQW5kUHJlZmV0Y2gobW9udGhseSwgY3VycmVudERhdGVzUmFuZ2UpIHtcclxuICB2YXIgbmV4dERhdGVzUmFuZ2UgPSB1dGlscy5kYXRlLm5leHRNb250aFdlZWtzKGN1cnJlbnREYXRlc1JhbmdlLnN0YXJ0KTtcclxuXHJcbiAgaWYgKCF1dGlscy5tb250aGx5SXNEYXRhSW5DYWNoZShtb250aGx5LCBuZXh0RGF0ZXNSYW5nZSkpIHtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgd2VlayBpbiBhZHZhbmNlXHJcbiAgICB2YXIgcHJlZmV0Y2hRdWVyeSA9IGRhdGVzVG9RdWVyeShuZXh0RGF0ZXNSYW5nZSk7XHJcbiAgICBtb250aGx5LmZldGNoRGF0YShwcmVmZXRjaFF1ZXJ5LCBudWxsLCB0cnVlKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG5Nb3ZlIHRoZSBiaW5kZWQgZGF0ZXMgdGhlIGFtb3VudCBvZiBAbW9udGhzIHNwZWNpZmllZC5cclxuTm90ZTogbW9zdCBvZiB0aGlzIGNvZGUgaXMgYWRhcHRlZCBmcm9tIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXMsXHJcbnRoZSBjb21wbGV4aXR5IGNvbWVzIGZyb20gdGhlIHByZWZldGNoIGZlYXR1cmUsIG1heWJlIGNhbiBiZSB0aGF0IGxvZ2ljXHJcbmlzb2xhdGVkIGFuZCBzaGFyZWQ/XHJcbioqL1xyXG5mdW5jdGlvbiBtb3ZlQmluZE1vbnRoKG1vbnRobHksIG1vbnRocykge1xyXG4gIHZhciBkYXRlc1JhbmdlID0gdXRpbHMuZGF0ZS5uZXh0TW9udGhXZWVrcyhtb250aGx5LmRhdGVzUmFuZ2Uuc3RhcnQsIG1vbnRocyk7XHJcblxyXG4gIC8vIENoZWNrIGNhY2hlIGJlZm9yZSB0cnkgdG8gZmV0Y2hcclxuICB2YXIgaW5DYWNoZSA9IHV0aWxzLm1vbnRobHlJc0RhdGFJbkNhY2hlKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG5cclxuICBpZiAoaW5DYWNoZSkge1xyXG4gICAgLy8gSnVzdCBzaG93IHRoZSBkYXRhXHJcbiAgICBtb250aGx5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgLy8gUHJlZmV0Y2ggZXhjZXB0IGlmIHRoZXJlIGlzIG90aGVyIHJlcXVlc3QgaW4gY291cnNlIChjYW4gYmUgdGhlIHNhbWUgcHJlZmV0Y2gsXHJcbiAgICAvLyBidXQgc3RpbGwgZG9uJ3Qgb3ZlcmxvYWQgdGhlIHNlcnZlcilcclxuICAgIGlmIChtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggPT09IDApXHJcbiAgICAgIG1vbnRobHlDaGVja0FuZFByZWZldGNoKG1vbnRobHksIGRhdGVzUmFuZ2UpO1xyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBmb3IgcHJlZmV0Y2hpbmc6XHJcbiAgICAvLyBJdHMgYXZvaWRlZCBpZiB0aGVyZSBhcmUgcmVxdWVzdHMgaW4gY291cnNlLCBzaW5jZVxyXG4gICAgLy8gdGhhdCB3aWxsIGJlIGEgcHJlZmV0Y2ggZm9yIHRoZSBzYW1lIGRhdGEuXHJcbiAgICBpZiAobW9udGhseS5mZXRjaERhdGEucmVxdWVzdHMubGVuZ3RoKSB7XHJcbiAgICAgIC8vIFRoZSBsYXN0IHJlcXVlc3QgaW4gdGhlIHBvb2wgKm11c3QqIGJlIHRoZSBsYXN0IGluIGZpbmlzaFxyXG4gICAgICAvLyAobXVzdCBiZSBvbmx5IG9uZSBpZiBhbGwgZ29lcyBmaW5lKTpcclxuICAgICAgdmFyIHJlcXVlc3QgPSBtb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0c1ttb250aGx5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgIC8vIFdhaXQgZm9yIHRoZSBmZXRjaCB0byBwZXJmb3JtIGFuZCBzZXRzIGxvYWRpbmcgdG8gbm90aWZ5IHVzZXJcclxuICAgICAgbW9udGhseS4kZWwuYWRkQ2xhc3MobW9udGhseS5jbGFzc2VzLmZldGNoaW5nKTtcclxuICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBtb3ZlQmluZE1vbnRoKG1vbnRobHksIG1vbnRocyk7XHJcbiAgICAgICAgbW9udGhseS4kZWwucmVtb3ZlQ2xhc3MobW9udGhseS5jbGFzc2VzLmZldGNoaW5nIHx8ICdfJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmV0Y2ggKGRvd25sb2FkKSB0aGUgZGF0YSBhbmQgc2hvdyBvbiByZWFkeTpcclxuICAgIG1vbnRobHlcclxuICAgIC5mZXRjaERhdGEoZGF0ZXNUb1F1ZXJ5KGRhdGVzUmFuZ2UpKVxyXG4gICAgLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgICBtb250aGx5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgICAvLyBQcmVmZXRjaFxyXG4gICAgICBtb250aGx5Q2hlY2tBbmRQcmVmZXRjaChtb250aGx5LCBkYXRlc1JhbmdlKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbk1hcmsgY2FsZW5kYXIgYXMgY3VycmVudC1tb250aCBhbmQgZGlzYWJsZSBwcmV2IGJ1dHRvbixcclxub3IgcmVtb3ZlIHRoZSBtYXJrIGFuZCBlbmFibGUgaXQgaWYgaXMgbm90LlxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50TW9udGgoJGVsLCBzdGFydERhdGUsIG1vbnRobHkpIHtcclxuICB2YXIgeWVwID0gZGF0ZVV0aWxzLmlzSW5DdXJyZW50TW9udGgoZGF0ZSk7XHJcbiAgJGVsLnRvZ2dsZUNsYXNzKG1vbnRobHkuY2xhc3Nlcy5jdXJyZW50V2VlaywgeWVwKTtcclxuICAkZWwuZmluZCgnLicgKyBtb250aGx5LmNsYXNzZXMucHJldkFjdGlvbikucHJvcCgnZGlzYWJsZWQnLCB5ZXApO1xyXG59XHJcblxyXG4vKipcclxuICBVcGRhdGUgdGhlIGNhbGVuZGFyIGRhdGVzIGNlbGxzIGZvciAnZGF5IG9mIHRoZSBtb250aCcgdmFsdWVzXHJcbiAgYW5kIG51bWJlciBvZiB3ZWVrcy9yb3dzXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVEYXRlc0NlbGxzKG1vbnRobHkpIHtcclxuICAvLyBUT0RPXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldENlbGxCeURhdGUobW9udGhseSwgZGF0ZSkge1xyXG4gIC8vIFRPRE9cclxufVxyXG5cclxuLyoqXHJcbk1vbnRseSBjYWxlbmRhciwgaW5oZXJpdHMgZnJvbSBMY1dpZGdldFxyXG4qKi9cclxudmFyIE1vbnRobHkgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5Q2xhc3Nlcywge1xyXG4gIHdlZWtseUNhbGVuZGFyOiB1bmRlZmluZWQsXHJcbiAgY3VycmVudFdlZWs6IHVuZGVmaW5lZCxcclxuICBjdXJyZW50TW9udGg6ICdpcy1jdXJyZW50TW9udGgnLFxyXG4gIG1vbnRobHlDYWxlbmRhcjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLS1tb250aGx5J1xyXG59KSxcclxudGV4dHM6IHV0aWxzLndlZWtseVRleHRzLFxyXG51cmw6ICcvY2FsZW5kYXIvZ2V0LWF2YWlsYWJpbGl0eS8nLFxyXG5cclxuLy8gT3VyICd2aWV3JyB3aWxsIGJlIGEgc3Vic2V0IG9mIHRoZSBkYXRhLFxyXG4vLyBkZWxpbWl0ZWQgYnkgdGhlIG5leHQgcHJvcGVydHksIGEgZGF0ZXMgcmFuZ2U6XHJcbmRhdGVzUmFuZ2U6IHsgc3RhcnQ6IG51bGwsIGVuZDogbnVsbCB9LFxyXG5iaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGFNb250aGx5KGRhdGVzUmFuZ2UpIHtcclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICBjaGVja0N1cnJlbnRNb250aCh0aGlzLiRlbCwgZGF0ZXNSYW5nZS5zdGFydCwgdGhpcyk7XHJcblxyXG4gIHVwZGF0ZURhdGVzQ2VsbHModGhpcyk7XHJcblxyXG4gIC8vIFJlbW92ZSBhbnkgcHJldmlvdXMgc3RhdHVzIGNsYXNzIGZyb20gYWxsIHNsb3RzXHJcbiAgZm9yICh2YXIgcyA9IDA7IHMgPCB1dGlscy5zdGF0dXNUeXBlcy5sZW5ndGg7IHMrKykge1xyXG4gICAgc2xvdHMucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB1dGlscy5zdGF0dXNUeXBlc1tzXSB8fCAnXycpO1xyXG4gIH1cclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICAvLyBUT0RPIFJlLWRvIGZvciBtb250aGx5XHJcbiAgdXRpbHMuZGF0ZS5lYWNoRGF0ZUluUmFuZ2UoZGF0ZXNSYW5nZS5zdGFydCwgZGF0ZXNSYW5nZS5lbmQsIGZ1bmN0aW9uIChkYXRlLCBpKSB7XHJcbiAgICB2YXIgZGF0ZWtleSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG4gICAgdmFyIGRhdGVTdGF0dXMgPSB0aGF0LmRhdGEuc2xvdHNbZGF0ZWtleV07XHJcblxyXG4gICAgdmFyIHNsb3QgPSBnZXRDZWxsQnlEYXRlKHRoYXQsIGRhdGUpO1xyXG5cclxuICAgIHNsb3QuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyBkYXRlU3RhdHVzKTtcclxuICB9KTtcclxufVxyXG59LFxyXG4vLyBDb25zdHJ1Y3RvcjpcclxuZnVuY3Rpb24gTW9udGhseShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgLy8gUmV1c2luZyBiYXNlIGNvbnN0cnVjdG9yIHRvbyBmb3IgaW5pdGlhbGl6aW5nOlxyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgLy8gVG8gdXNlIHRoaXMgaW4gY2xvc3VyZXM6XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB0aGlzLnVzZXIgPSB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcbiAgdGhpcy5xdWVyeSA9IHtcclxuICAgIHVzZXI6IHRoaXMudXNlcixcclxuICAgIHR5cGU6ICdtb250aGx5J1xyXG4gIH07XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgbW9udGhcclxuICB2YXIgZmlyc3REYXRlcyA9IHV0aWxzLmRhdGUuY3VycmVudE1vbnRoV2Vla3MoKTtcclxuICB0aGlzLmZldGNoRGF0YSh1dGlscy5kYXRlc1RvUXVlcnkoZmlyc3REYXRlcykpLmRvbmUoZnVuY3Rpb24gKCkge1xyXG4gICAgdGhhdC5iaW5kRGF0YShmaXJzdERhdGVzKTtcclxuICAgIC8vIFByZWZldGNoaW5nIG5leHQgbW9udGggaW4gYWR2YW5jZVxyXG4gICAgbW9udGhseUNoZWNrQW5kUHJlZmV0Y2godGhhdCwgZmlyc3REYXRlcyk7XHJcbiAgfSk7XHJcblxyXG4gIHV0aWxzLmNoZWNrQ3VycmVudE1vbnRoKHRoaXMuJGVsLCBmaXJzdERhdGVzLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgLy8gU2V0IGhhbmRsZXJzIGZvciBwcmV2LW5leHQgYWN0aW9uczpcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMucHJldkFjdGlvbiwgZnVuY3Rpb24gcHJldigpIHtcclxuICAgIG1vdmVCaW5kTW9udGgodGhhdCwgLTEpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGVsLm9uKCdjbGljaycsICcuJyArIHRoaXMuY2xhc3Nlcy5uZXh0QWN0aW9uLCBmdW5jdGlvbiBuZXh0KCkge1xyXG4gICAgbW92ZUJpbmRNb250aCh0aGF0LCAxKTtcclxuICB9KTtcclxuXHJcbn0pO1xyXG5cclxuLyoqIFN0YXRpYyB1dGlsaXR5OiBmb3VuZCBhbGwgY29tcG9uZW50cyB3aXRoIHRoZSBXZWVrbHkgY2FsZW5kYXIgY2xhc3NcclxuYW5kIGVuYWJsZSBpdFxyXG4qKi9cclxuTW9udGhseS5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIE1vbnRobHkucHJvdG90eXBlLmNsYXNzZXMubW9udGhseUNhbGVuZGFyKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIGxpc3QucHVzaChuZXcgTW9udGhseSh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vbnRobHk7XHJcbiIsIi8qKlxyXG4gIFdlZWtseSBjYWxlbmRhciBjbGFzc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4uL0NYL0xjV2lkZ2V0JyksXHJcbiAgZXh0ZW5kID0gcmVxdWlyZSgnLi4vQ1gvZXh0ZW5kJyk7XHJcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcclxuXHJcbi8qKlxyXG5XZWVrbHkgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBXZWVrbHkgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IHV0aWxzLndlZWtseUNsYXNzZXMsXHJcbnRleHRzOiB1dGlscy53ZWVrbHlUZXh0cyxcclxudXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxuXHJcbi8vIE91ciAndmlldycgd2lsbCBiZSBhIHN1YnNldCBvZiB0aGUgZGF0YSxcclxuLy8gZGVsaW1pdGVkIGJ5IHRoZSBuZXh0IHByb3BlcnR5LCBhIGRhdGVzIHJhbmdlOlxyXG5kYXRlc1JhbmdlOiB7IHN0YXJ0OiBudWxsLCBlbmQ6IG51bGwgfSxcclxuYmluZERhdGE6IGZ1bmN0aW9uIGJpbmREYXRhV2Vla2x5KGRhdGVzUmFuZ2UpIHtcclxuICB0aGlzLmRhdGVzUmFuZ2UgPSBkYXRlc1JhbmdlID0gZGF0ZXNSYW5nZSB8fCB0aGlzLmRhdGVzUmFuZ2U7XHJcbiAgdmFyIFxyXG4gICAgICBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKSxcclxuICAgICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICB1dGlscy5jaGVja0N1cnJlbnRXZWVrKHRoaXMuJGVsLCBkYXRlc1JhbmdlLnN0YXJ0LCB0aGlzKTtcclxuXHJcbiAgdXRpbHMudXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIHRoaXMuJGVsLCB0aGlzKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGFueSBwcmV2aW91cyBzdGF0dXMgY2xhc3MgZnJvbSBhbGwgc2xvdHNcclxuICBmb3IgKHZhciBzID0gMDsgcyA8IHV0aWxzLnN0YXR1c1R5cGVzLmxlbmd0aDsgcysrKSB7XHJcbiAgICBzbG90cy5yZW1vdmVDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHV0aWxzLnN0YXR1c1R5cGVzW3NdIHx8ICdfJyk7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuZGF0YSB8fCAhdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIC8vIFNldCBhbGwgc2xvdHMgd2l0aCBkZWZhdWx0IHN0YXR1c1xyXG4gIHNsb3RzLmFkZENsYXNzKHRoaXMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhpcy5kYXRhLmRlZmF1bHRTdGF0dXMpO1xyXG5cclxuICBpZiAoIXRoaXMuZGF0YS5zbG90cyB8fCAhdGhpcy5kYXRhLnN0YXR1cylcclxuICAgIHJldHVybjtcclxuXHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB1dGlscy5kYXRlLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUsIGkpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICB2YXIgZGF0ZVNsb3RzID0gdGhhdC5kYXRhLnNsb3RzW2RhdGVrZXldO1xyXG4gICAgaWYgKGRhdGVTbG90cykge1xyXG4gICAgICBmb3IgKHMgPSAwOyBzIDwgZGF0ZVNsb3RzLmxlbmd0aDsgcysrKSB7XHJcbiAgICAgICAgdmFyIHNsb3QgPSBkYXRlU2xvdHNbc107XHJcbiAgICAgICAgdmFyIHNsb3RDZWxsID0gdXRpbHMuZmluZENlbGxCeVNsb3Qoc2xvdHNDb250YWluZXIsIGksIHNsb3QpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBkZWZhdWx0IHN0YXR1c1xyXG4gICAgICAgIHNsb3RDZWxsLnJlbW92ZUNsYXNzKHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXMgfHwgJ18nKTtcclxuICAgICAgICAvLyBBZGRpbmcgc3RhdHVzIGNsYXNzXHJcbiAgICAgICAgc2xvdENlbGwuYWRkQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuc3RhdHVzKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBXZWVrbHkoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIC8vIFJldXNpbmcgYmFzZSBjb25zdHJ1Y3RvciB0b28gZm9yIGluaXRpYWxpemluZzpcclxuICBMY1dpZGdldC5jYWxsKHRoaXMsIGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gIC8vIFRvIHVzZSB0aGlzIGluIGNsb3N1cmVzOlxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuXHJcbiAgdGhpcy51c2VyID0gdGhpcy4kZWwuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG4gIHRoaXMucXVlcnkgPSB7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnd2Vla2x5J1xyXG4gIH07XHJcblxyXG4gIC8vIFN0YXJ0IGZldGNoaW5nIGN1cnJlbnQgd2Vla1xyXG4gIHZhciBmaXJzdERhdGVzID0gdXRpbHMuZGF0ZS5jdXJyZW50V2VlaygpO1xyXG4gIHRoaXMuZmV0Y2hEYXRhKHV0aWxzLmRhdGVzVG9RdWVyeShmaXJzdERhdGVzKSkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKGZpcnN0RGF0ZXMpO1xyXG4gICAgLy8gUHJlZmV0Y2hpbmcgbmV4dCB3ZWVrIGluIGFkdmFuY2VcclxuICAgIHV0aWxzLndlZWtseUNoZWNrQW5kUHJlZmV0Y2godGhhdCwgZmlyc3REYXRlcyk7XHJcbiAgfSk7XHJcbiAgdXRpbHMuY2hlY2tDdXJyZW50V2Vlayh0aGlzLiRlbCwgZmlyc3REYXRlcy5zdGFydCwgdGhpcyk7XHJcblxyXG4gIC8vIFNldCBoYW5kbGVycyBmb3IgcHJldi1uZXh0IGFjdGlvbnM6XHJcbiAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy4nICsgdGhpcy5jbGFzc2VzLnByZXZBY3Rpb24sIGZ1bmN0aW9uIHByZXYoKSB7XHJcbiAgICB1dGlscy5tb3ZlQmluZFJhbmdlSW5EYXlzKHRoYXQsIC03KTtcclxuICB9KTtcclxuICB0aGlzLiRlbC5vbignY2xpY2snLCAnLicgKyB0aGlzLmNsYXNzZXMubmV4dEFjdGlvbiwgZnVuY3Rpb24gbmV4dCgpIHtcclxuICAgIHV0aWxzLm1vdmVCaW5kUmFuZ2VJbkRheXModGhhdCwgNyk7XHJcbiAgfSk7XHJcblxyXG59KTtcclxuXHJcbi8qKiBTdGF0aWMgdXRpbGl0eTogZm91bmQgYWxsIGNvbXBvbmVudHMgd2l0aCB0aGUgV2Vla2x5IGNhbGVuZGFyIGNsYXNzXHJcbmFuZCBlbmFibGUgaXRcclxuKiovXHJcbldlZWtseS5lbmFibGVBbGwgPSBmdW5jdGlvbiBvbihvcHRpb25zKSB7XHJcbiAgdmFyIGxpc3QgPSBbXTtcclxuICAkKCcuJyArIFdlZWtseS5wcm90b3R5cGUuY2xhc3Nlcy53ZWVrbHlDYWxlbmRhcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICBsaXN0LnB1c2gobmV3IFdlZWtseSh0aGlzLCBvcHRpb25zKSk7XHJcbiAgfSk7XHJcbiAgcmV0dXJuIGxpc3Q7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFdlZWtseTtcclxuIiwiLyoqXHJcbiAgV29yayBIb3VycyBjYWxlbmRhciBjbGFzc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBMY1dpZGdldCA9IHJlcXVpcmUoJy4uL0NYL0xjV2lkZ2V0JyksXHJcbiAgZXh0ZW5kID0gcmVxdWlyZSgnLi4vQ1gvZXh0ZW5kJyksXHJcbiAgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyksXHJcbiAgY2xlYXJDdXJyZW50U2VsZWN0aW9uID0gcmVxdWlyZSgnLi9jbGVhckN1cnJlbnRTZWxlY3Rpb24nKSxcclxuICBtYWtlVW5zZWxlY3RhYmxlID0gcmVxdWlyZSgnLi9tYWtlVW5zZWxlY3RhYmxlJyk7XHJcbnJlcXVpcmUoJy4uL2pxdWVyeS5ib3VuZHMnKTtcclxuXHJcbi8qKlxyXG5Xb3JrIGhvdXJzIHByaXZhdGUgdXRpbHNcclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwRWRpdFdvcmtIb3VycygpIHtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgLy8gU2V0IGhhbmRsZXJzIHRvIHN3aXRjaCBzdGF0dXMgYW5kIHVwZGF0ZSBiYWNrZW5kIGRhdGFcclxuICAvLyB3aGVuIHRoZSB1c2VyIHNlbGVjdCBjZWxsc1xyXG4gIHZhciBzbG90c0NvbnRhaW5lciA9IHRoaXMuJGVsLmZpbmQoJy4nICsgdGhpcy5jbGFzc2VzLnNsb3RzKTtcclxuXHJcbiAgZnVuY3Rpb24gdG9nZ2xlQ2VsbChjZWxsKSB7XHJcbiAgICAvLyBGaW5kIGRheSBhbmQgdGltZSBvZiB0aGUgY2VsbDpcclxuICAgIHZhciBzbG90ID0gdXRpbHMuZmluZFNsb3RCeUNlbGwoc2xvdHNDb250YWluZXIsIGNlbGwpO1xyXG4gICAgLy8gR2V0IHdlZWstZGF5IHNsb3RzIGFycmF5OlxyXG4gICAgdmFyIHdrc2xvdHMgPSB0aGF0LmRhdGEuc2xvdHNbdXRpbHMuc3lzdGVtV2Vla0RheXNbc2xvdC5kYXldXSA9IHRoYXQuZGF0YS5zbG90c1t1dGlscy5zeXN0ZW1XZWVrRGF5c1tzbG90LmRheV1dIHx8IFtdO1xyXG4gICAgLy8gSWYgaXQgaGFzIGFscmVhZHkgdGhlIGRhdGEuc3RhdHVzLCB0b2dnbGUgdG8gdGhlIGRlZmF1bHRTdGF0dXNcclxuICAgIC8vICB2YXIgc3RhdHVzQ2xhc3MgPSB0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMsXHJcbiAgICAvLyAgICAgIGRlZmF1bHRTdGF0dXNDbGFzcyA9IHRoYXQuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgdGhhdC5kYXRhLmRlZmF1bHRTdGF0dXM7XHJcbiAgICAvL2lmIChjZWxsLmhhc0NsYXNzKHN0YXR1c0NsYXNzXHJcbiAgICAvLyBUb2dnbGUgZnJvbSB0aGUgYXJyYXlcclxuICAgIHZhciBzdHJzbG90ID0gZGF0ZUlTTy50aW1lTG9jYWwoc2xvdC5zbG90LCB0cnVlKSxcclxuICAgICAgaXNsb3QgPSB3a3Nsb3RzLmluZGV4T2Yoc3Ryc2xvdCk7XHJcbiAgICBpZiAoaXNsb3QgPT0gLTEpXHJcbiAgICAgIHdrc2xvdHMucHVzaChzdHJzbG90KTtcclxuICAgIGVsc2VcclxuICAgIC8vZGVsZXRlIHdrc2xvdHNbaXNsb3RdO1xyXG4gICAgICB3a3Nsb3RzLnNwbGljZShpc2xvdCwgMSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB0b2dnbGVDZWxsUmFuZ2UoZmlyc3RDZWxsLCBsYXN0Q2VsbCkge1xyXG4gICAgdmFyIFxyXG4gICAgICB4ID0gZmlyc3RDZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChmaXJzdENlbGwpLFxyXG4gICAgICB5MSA9IGZpcnN0Q2VsbC5jbG9zZXN0KCd0cicpLmluZGV4KCksXHJcbiAgICAvL3gyID0gbGFzdENlbGwuc2libGluZ3MoJ3RkJykuYW5kU2VsZigpLmluZGV4KGxhc3RDZWxsKSxcclxuICAgICAgeTIgPSBsYXN0Q2VsbC5jbG9zZXN0KCd0cicpLmluZGV4KCk7XHJcblxyXG4gICAgaWYgKHkxID4geTIpIHtcclxuICAgICAgdmFyIHkwID0geTE7XHJcbiAgICAgIHkxID0geTI7XHJcbiAgICAgIHkyID0geTA7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgeSA9IHkxOyB5IDw9IHkyOyB5KyspIHtcclxuICAgICAgdmFyIGNlbGwgPSBmaXJzdENlbGwuY2xvc2VzdCgndGJvZHknKS5jaGlsZHJlbigndHI6ZXEoJyArIHkgKyAnKScpLmNoaWxkcmVuKCd0ZDplcSgnICsgeCArICcpJyk7XHJcbiAgICAgIHRvZ2dsZUNlbGwoY2VsbCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgZHJhZ2dpbmcgPSB7XHJcbiAgICBmaXJzdDogbnVsbCxcclxuICAgIGxhc3Q6IG51bGwsXHJcbiAgICBzZWxlY3Rpb25MYXllcjogJCgnPGRpdiBjbGFzcz1cIlNlbGVjdGlvbkxheWVyXCIgLz4nKS5hcHBlbmRUbyh0aGlzLiRlbCksXHJcbiAgICBkb25lOiBmYWxzZVxyXG4gIH07XHJcbiAgXHJcbiAgZnVuY3Rpb24gb2Zmc2V0VG9Qb3NpdGlvbihlbCwgb2Zmc2V0KSB7XHJcbiAgICB2YXIgcGIgPSAkKGVsLm9mZnNldFBhcmVudCkuYm91bmRzKCksXHJcbiAgICAgIHMgPSB7fTtcclxuXHJcbiAgICBzLnRvcCA9IG9mZnNldC50b3AgLSBwYi50b3A7XHJcbiAgICBzLmxlZnQgPSBvZmZzZXQubGVmdCAtIHBiLmxlZnQ7XHJcblxyXG4gICAgLy9zLmJvdHRvbSA9IHBiLnRvcCAtIG9mZnNldC5ib3R0b207XHJcbiAgICAvL3MucmlnaHQgPSBvZmZzZXQubGVmdCAtIG9mZnNldC5yaWdodDtcclxuICAgIHMuaGVpZ2h0ID0gb2Zmc2V0LmJvdHRvbSAtIG9mZnNldC50b3A7XHJcbiAgICBzLndpZHRoID0gb2Zmc2V0LnJpZ2h0IC0gb2Zmc2V0LmxlZnQ7XHJcblxyXG4gICAgJChlbCkuY3NzKHMpO1xyXG4gICAgcmV0dXJuIHM7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiB1cGRhdGVTZWxlY3Rpb24oZWwpIHtcclxuICAgIHZhciBhID0gZHJhZ2dpbmcuZmlyc3QuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIHZhciBiID0gZWwuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuICAgIHZhciBzID0gZHJhZ2dpbmcuc2VsZWN0aW9uTGF5ZXIuYm91bmRzKHsgaW5jbHVkZUJvcmRlcjogdHJ1ZSB9KTtcclxuXHJcbiAgICBzLnRvcCA9IGEudG9wIDwgYi50b3AgPyBhLnRvcCA6IGIudG9wO1xyXG4gICAgcy5ib3R0b20gPSBhLmJvdHRvbSA+IGIuYm90dG9tID8gYS5ib3R0b20gOiBiLmJvdHRvbTtcclxuXHJcbiAgICBvZmZzZXRUb1Bvc2l0aW9uKGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyWzBdLCBzKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGZpbmlzaERyYWcoKSB7XHJcbiAgICBpZiAoZHJhZ2dpbmcuZmlyc3QgJiYgZHJhZ2dpbmcubGFzdCkge1xyXG4gICAgICB0b2dnbGVDZWxsUmFuZ2UoZHJhZ2dpbmcuZmlyc3QsIGRyYWdnaW5nLmxhc3QpO1xyXG4gICAgICB0aGF0LmJpbmREYXRhKCk7XHJcblxyXG4gICAgICBkcmFnZ2luZy5kb25lID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIGRyYWdnaW5nLmZpcnN0ID0gZHJhZ2dpbmcubGFzdCA9IG51bGw7XHJcbiAgICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5oaWRlKCk7XHJcbiAgICBtYWtlVW5zZWxlY3RhYmxlLm9mZih0aGF0LiRlbCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHRoaXMuJGVsLmZpbmQoc2xvdHNDb250YWluZXIpLm9uKCdjbGljaycsICd0ZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIERvIGV4Y2VwdCBhZnRlciBhIGRyYWdnaW5nIGRvbmUgY29tcGxldGVcclxuICAgIGlmIChkcmFnZ2luZy5kb25lKSByZXR1cm4gZmFsc2U7XHJcbiAgICB0b2dnbGVDZWxsKCQodGhpcykpO1xyXG4gICAgdGhhdC5iaW5kRGF0YSgpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICB0aGlzLiRlbC5maW5kKHNsb3RzQ29udGFpbmVyKVxyXG4gIC5vbignbW91c2Vkb3duJywgJ3RkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgZHJhZ2dpbmcuZG9uZSA9IGZhbHNlO1xyXG4gICAgZHJhZ2dpbmcuZmlyc3QgPSAkKHRoaXMpO1xyXG4gICAgZHJhZ2dpbmcubGFzdCA9IG51bGw7XHJcbiAgICBkcmFnZ2luZy5zZWxlY3Rpb25MYXllci5zaG93KCk7XHJcblxyXG4gICAgbWFrZVVuc2VsZWN0YWJsZSh0aGF0LiRlbCk7XHJcbiAgICBjbGVhckN1cnJlbnRTZWxlY3Rpb24oKTtcclxuXHJcbiAgICB2YXIgcyA9IGRyYWdnaW5nLmZpcnN0LmJvdW5kcyh7IGluY2x1ZGVCb3JkZXI6IHRydWUgfSk7XHJcbiAgICBvZmZzZXRUb1Bvc2l0aW9uKGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyWzBdLCBzKTtcclxuXHJcbiAgfSlcclxuICAub24oJ21vdXNlZW50ZXInLCAndGQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoZHJhZ2dpbmcuZmlyc3QpIHtcclxuICAgICAgZHJhZ2dpbmcubGFzdCA9ICQodGhpcyk7XHJcblxyXG4gICAgICB1cGRhdGVTZWxlY3Rpb24oZHJhZ2dpbmcubGFzdCk7XHJcbiAgICB9XHJcbiAgfSlcclxuICAub24oJ21vdXNldXAnLCBmaW5pc2hEcmFnKVxyXG4gIC5maW5kKCd0ZCcpXHJcbiAgLmF0dHIoJ2RyYWdnYWJsZScsIGZhbHNlKTtcclxuXHJcbiAgLy8gVGhpcyB3aWxsIG5vdCB3b3JrIHdpdGggcG9pbnRlci1ldmVudHM6bm9uZSwgYnV0IG9uIG90aGVyXHJcbiAgLy8gY2FzZXMgKHJlY2VudElFKVxyXG4gIGRyYWdnaW5nLnNlbGVjdGlvbkxheWVyLm9uKCdtb3VzZXVwJywgZmluaXNoRHJhZylcclxuICAuYXR0cignZHJhZ2dhYmxlJywgZmFsc2UpO1xyXG5cclxufVxyXG5cclxuLyoqXHJcbldvcmsgaG91cnMgY2FsZW5kYXIsIGluaGVyaXRzIGZyb20gTGNXaWRnZXRcclxuKiovXHJcbnZhciBXb3JrSG91cnMgPSBMY1dpZGdldC5leHRlbmQoXHJcbi8vIFByb3RvdHlwZVxyXG57XHJcbmNsYXNzZXM6IGV4dGVuZCh7fSwgdXRpbHMud2Vla2x5Q2xhc3Nlcywge1xyXG4gIHdlZWtseUNhbGVuZGFyOiB1bmRlZmluZWQsXHJcbiAgd29ya0hvdXJzQ2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci0td29ya0hvdXJzJ1xyXG59KSxcclxudGV4dHM6IHV0aWxzLndlZWtseVRleHRzLFxyXG51cmw6ICcvY2FsZW5kYXIvZ2V0LWF2YWlsYWJpbGl0eS8nLFxyXG5iaW5kRGF0YTogZnVuY3Rpb24gYmluZERhdGFXb3JrSG91cnMoKSB7XHJcbiAgdmFyIFxyXG4gICAgc2xvdHNDb250YWluZXIgPSB0aGlzLiRlbC5maW5kKCcuJyArIHRoaXMuY2xhc3Nlcy5zbG90cyksXHJcbiAgICBzbG90cyA9IHNsb3RzQ29udGFpbmVyLmZpbmQoJ3RkJyk7XHJcblxyXG4gIC8vIFJlbW92ZSBhbnkgcHJldmlvdXMgc3RhdHVzIGNsYXNzIGZyb20gYWxsIHNsb3RzXHJcbiAgZm9yICh2YXIgcyA9IDA7IHMgPCB1dGlscy5zdGF0dXNUeXBlcy5sZW5ndGg7IHMrKykge1xyXG4gICAgc2xvdHMucmVtb3ZlQ2xhc3ModGhpcy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB1dGlscy5zdGF0dXNUeXBlc1tzXSB8fCAnXycpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCF0aGlzLmRhdGEgfHwgIXRoaXMuZGF0YS5kZWZhdWx0U3RhdHVzKVxyXG4gICAgcmV0dXJuO1xyXG5cclxuICAvLyBTZXQgYWxsIHNsb3RzIHdpdGggZGVmYXVsdCBzdGF0dXNcclxuICBzbG90cy5hZGRDbGFzcyh0aGlzLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoaXMuZGF0YS5kZWZhdWx0U3RhdHVzKTtcclxuXHJcbiAgaWYgKCF0aGlzLmRhdGEuc2xvdHMgfHwgIXRoaXMuZGF0YS5zdGF0dXMpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICBmb3IgKHZhciB3ayA9IDA7IHdrIDwgdXRpbHMuc3lzdGVtV2Vla0RheXMubGVuZ3RoOyB3aysrKSB7XHJcbiAgICB2YXIgZGF0ZVNsb3RzID0gdGhhdC5kYXRhLnNsb3RzW3V0aWxzLnN5c3RlbVdlZWtEYXlzW3drXV07XHJcbiAgICBpZiAoZGF0ZVNsb3RzICYmIGRhdGVTbG90cy5sZW5ndGgpIHtcclxuICAgICAgZm9yIChzID0gMDsgcyA8IGRhdGVTbG90cy5sZW5ndGg7IHMrKykge1xyXG4gICAgICAgIHZhciBzbG90ID0gZGF0ZVNsb3RzW3NdO1xyXG4gICAgICAgIHZhciBzbG90Q2VsbCA9IHV0aWxzLmZpbmRDZWxsQnlTbG90KHNsb3RzQ29udGFpbmVyLCB3aywgc2xvdCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGRlZmF1bHQgc3RhdHVzXHJcbiAgICAgICAgc2xvdENlbGwucmVtb3ZlQ2xhc3ModGhhdC5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyB0aGF0LmRhdGEuZGVmYXVsdFN0YXR1cyB8fCAnXycpO1xyXG4gICAgICAgIC8vIEFkZGluZyBzdGF0dXMgY2xhc3NcclxuICAgICAgICBzbG90Q2VsbC5hZGRDbGFzcyh0aGF0LmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHRoYXQuZGF0YS5zdGF0dXMpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbn0sXHJcbi8vIENvbnN0cnVjdG9yOlxyXG5mdW5jdGlvbiBXb3JrSG91cnMoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIExjV2lkZ2V0LmNhbGwodGhpcywgZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgdmFyIHRoYXQgPSB0aGlzO1xyXG5cclxuICB0aGlzLnVzZXIgPSB0aGlzLiRlbC5kYXRhKCdjYWxlbmRhci11c2VyJyk7XHJcblxyXG4gIHRoaXMucXVlcnkgPSB7XHJcbiAgICB1c2VyOiB0aGlzLnVzZXIsXHJcbiAgICB0eXBlOiAnd29ya0hvdXJzJ1xyXG4gIH07XHJcblxyXG4gIC8vIEZldGNoIHRoZSBkYXRhOiB0aGVyZSBpcyBub3QgYSBtb3JlIHNwZWNpZmljIHF1ZXJ5LFxyXG4gIC8vIGl0IGp1c3QgZ2V0IHRoZSBob3VycyBmb3IgZWFjaCB3ZWVrLWRheSAoZGF0YVxyXG4gIC8vIHNsb3RzIGFyZSBwZXIgd2Vlay1kYXkgaW5zdGVhZCBvZiBwZXIgZGF0ZSBjb21wYXJlZFxyXG4gIC8vIHRvICp3ZWVrbHkqKVxyXG4gIHRoaXMuZmV0Y2hEYXRhKCkuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGF0LmJpbmREYXRhKCk7XHJcbiAgfSk7XHJcblxyXG4gIHNldHVwRWRpdFdvcmtIb3Vycy5jYWxsKHRoaXMpO1xyXG5cclxufSk7XHJcblxyXG4vKiogU3RhdGljIHV0aWxpdHk6IGZvdW5kIGFsbCBjb21wb25lbnRzIHdpdGggdGhlIFdvcmtob3VycyBjYWxlbmRhciBjbGFzc1xyXG5hbmQgZW5hYmxlIGl0XHJcbioqL1xyXG5Xb3JrSG91cnMuZW5hYmxlQWxsID0gZnVuY3Rpb24gb24ob3B0aW9ucykge1xyXG4gIHZhciBsaXN0ID0gW107XHJcbiAgJCgnLicgKyBXb3JrSG91cnMucHJvdG90eXBlLmNsYXNzZXMud29ya0hvdXJzQ2FsZW5kYXIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgbGlzdC5wdXNoKG5ldyBXb3JrSG91cnModGhpcywgb3B0aW9ucykpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBsaXN0O1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBXb3JrSG91cnM7IiwiLyoqXHJcbkNyb3NzIGJyb3dzZXIgd2F5IHRvIHVuc2VsZWN0IGN1cnJlbnQgc2VsZWN0aW9uXHJcbioqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNsZWFyQ3VycmVudFNlbGVjdGlvbigpIHtcclxuICBpZiAodHlwZW9mICh3aW5kb3cuZ2V0U2VsZWN0aW9uKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAvLyBTdGFuZGFyZFxyXG4gICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xyXG4gIGVsc2UgaWYgKGRvY3VtZW50LnNlbGVjdGlvbiAmJiB0eXBlb2YgKGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSkgPT09ICdmdW5jdGlvbicpXHJcbiAgLy8gSUVcclxuICAgIGRvY3VtZW50LnNlbGVjdGlvbi5lbXB0eSgpO1xyXG59OyIsIi8qKlxyXG4gIEEgY29sbGVjdGlvbiBvZiB1c2VmdWwgZ2VuZXJpYyB1dGlscyBtYW5hZ2luZyBEYXRlc1xyXG4qKi9cclxudmFyIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpO1xyXG5cclxuZnVuY3Rpb24gY3VycmVudFdlZWsoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBnZXRGaXJzdFdlZWtEYXRlKG5ldyBEYXRlKCkpLFxyXG4gICAgZW5kOiBnZXRMYXN0V2Vla0RhdGUobmV3IERhdGUoKSlcclxuICB9O1xyXG59XHJcbmV4cG9ydHMuY3VycmVudFdlZWsgPSBjdXJyZW50V2VlaztcclxuXHJcbmZ1bmN0aW9uIG5leHRXZWVrKHN0YXJ0LCBlbmQpIHtcclxuICAvLyBVbmlxdWUgcGFyYW0gd2l0aCBib3RoIHByb3BpZXJ0aWVzOlxyXG4gIGlmIChzdGFydC5lbmQpIHtcclxuICAgIGVuZCA9IHN0YXJ0LmVuZDtcclxuICAgIHN0YXJ0ID0gc3RhcnQuc3RhcnQ7XHJcbiAgfVxyXG4gIC8vIE9wdGlvbmFsIGVuZDpcclxuICBlbmQgPSBlbmQgfHwgYWRkRGF5cyhzdGFydCwgNyk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBhZGREYXlzKHN0YXJ0LCA3KSxcclxuICAgIGVuZDogYWRkRGF5cyhlbmQsIDcpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLm5leHRXZWVrID0gbmV4dFdlZWs7XHJcblxyXG5mdW5jdGlvbiBnZXRGaXJzdFdlZWtEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSAtIGQuZ2V0RGF5KCkpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0Rmlyc3RXZWVrRGF0ZSA9IGdldEZpcnN0V2Vla0RhdGU7XHJcblxyXG5mdW5jdGlvbiBnZXRMYXN0V2Vla0RhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgKDYgLSBkLmdldERheSgpKSk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5nZXRMYXN0V2Vla0RhdGUgPSBnZXRMYXN0V2Vla0RhdGU7XHJcblxyXG5mdW5jdGlvbiBpc0luQ3VycmVudFdlZWsoZGF0ZSkge1xyXG4gIHJldHVybiBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdFdlZWtEYXRlKGRhdGUpKSA9PSBkYXRlSVNPLmRhdGVMb2NhbChnZXRGaXJzdFdlZWtEYXRlKG5ldyBEYXRlKCkpKTtcclxufVxyXG5leHBvcnRzLmlzSW5DdXJyZW50V2VlayA9IGlzSW5DdXJyZW50V2VlaztcclxuXHJcbmZ1bmN0aW9uIGFkZERheXMoZGF0ZSwgZGF5cykge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKGQuZ2V0RGF0ZSgpICsgZGF5cyk7XHJcbiAgcmV0dXJuIGQ7XHJcbn1cclxuZXhwb3J0cy5hZGREYXlzID0gYWRkRGF5cztcclxuXHJcbmZ1bmN0aW9uIGVhY2hEYXRlSW5SYW5nZShzdGFydCwgZW5kLCBmbikge1xyXG4gIGlmICghZm4uY2FsbCkgdGhyb3cgbmV3IEVycm9yKCdmbiBtdXN0IGJlIGEgZnVuY3Rpb24gb3IgXCJjYWxsXCJhYmxlIG9iamVjdCcpO1xyXG4gIHZhciBkYXRlID0gbmV3IERhdGUoc3RhcnQpO1xyXG4gIHZhciBpID0gMCwgcmV0O1xyXG4gIHdoaWxlIChkYXRlIDw9IGVuZCkge1xyXG4gICAgcmV0ID0gZm4uY2FsbChmbiwgZGF0ZSwgaSk7XHJcbiAgICAvLyBBbGxvdyBmbiB0byBjYW5jZWwgdGhlIGxvb3Agd2l0aCBzdHJpY3QgJ2ZhbHNlJ1xyXG4gICAgaWYgKHJldCA9PT0gZmFsc2UpXHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgMSk7XHJcbiAgICBpKys7XHJcbiAgfVxyXG59XHJcbmV4cG9ydHMuZWFjaERhdGVJblJhbmdlID0gZWFjaERhdGVJblJhbmdlO1xyXG5cclxuLyoqIE1vbnRocyAqKi9cclxuXHJcbmZ1bmN0aW9uIGdldEZpcnN0TW9udGhEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0RGF0ZSgxKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5leHBvcnRzLmdldEZpcnN0TW9udGhEYXRlID0gZ2V0Rmlyc3RNb250aERhdGU7XHJcblxyXG5mdW5jdGlvbiBnZXRMYXN0TW9udGhEYXRlKGRhdGUpIHtcclxuICB2YXIgZCA9IG5ldyBEYXRlKGRhdGUpO1xyXG4gIGQuc2V0TW9udGgoZC5nZXRNb250aCgpICsgMSwgMSk7XHJcbiAgZCA9IGFkZERheXMoZCwgLTEpO1xyXG4gIHJldHVybiBkO1xyXG59XHJcbmV4cG9ydHMuZ2V0TGFzdE1vbnRoRGF0ZSA9IGdldExhc3RNb250aERhdGU7XHJcblxyXG5mdW5jdGlvbiBpc0luQ3VycmVudE1vbnRoKGRhdGUpIHtcclxuICByZXR1cm4gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RNb250aERhdGUoZGF0ZSkpID09IGRhdGVJU08uZGF0ZUxvY2FsKGdldEZpcnN0TW9udGhEYXRlKG5ldyBEYXRlKCkpKTtcclxufVxyXG5leHBvcnRzLmlzSW5DdXJyZW50TW9udGggPSBpc0luQ3VycmVudE1vbnRoO1xyXG5cclxuLyoqXHJcbiAgR2V0IGEgZGF0ZXMgcmFuZ2UgZm9yIHRoZSBjdXJyZW50IG1vbnRoXHJcbiAgKG9yIHRoZSBnaXZlbiBkYXRlIGFzIGJhc2UpXHJcbioqL1xyXG5mdW5jdGlvbiBjdXJyZW50TW9udGgoYmFzZURhdGUpIHtcclxuICBiYXNlRGF0ZSA9IGJhc2VEYXRlIHx8IG5ldyBEYXRlKCk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBnZXRGaXJzdE1vbnRoRGF0ZShiYXNlRGF0ZSksXHJcbiAgICBlbmQ6IGdldExhc3RNb250aERhdGUoYmFzZURhdGUpXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmN1cnJlbnRNb250aCA9IGN1cnJlbnRNb250aDtcclxuXHJcbmZ1bmN0aW9uIG5leHRNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKSB7XHJcbiAgYW1vdW50TW9udGhzID0gYW1vdW50TW9udGhzIHx8IDE7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShmcm9tRGF0ZSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBkLnNldE1vbnRoKGQuZ2V0TW9udGgoKSArIGFtb3VudE1vbnRocywgMSksXHJcbiAgICBlbmQ6IGdldExhc3RNb250aERhdGUoZClcclxuICB9O1xyXG59XHJcbmV4cG9ydHMubmV4dE1vbnRoID0gbmV4dE1vbnRoO1xyXG5cclxuZnVuY3Rpb24gcHJldmlvdXNNb250aChmcm9tRGF0ZSwgYW1vdW50TW9udGhzKSB7XHJcbiAgcmV0dXJuIG5leHRNb250aChmcm9tRGF0ZSwgMCAtIGFtb3VudE1vbnRocyk7XHJcbn1cclxuZXhwb3J0cy5wcmV2aW91c01vbnRoID0gcHJldmlvdXNNb250aDtcclxuXHJcbi8qKlxyXG4gIEdldCBhIGRhdGVzIHJhbmdlIGZvciB0aGUgY29tcGxldGUgd2Vla3NcclxuICB0aGF0IGFyZSBwYXJ0IG9mIHRoZSBjdXJyZW50IG1vbnRoXHJcbiAgKG9yIHRoZSBnaXZlbiBkYXRlIGFzIGJhc2UpLlxyXG4gIFRoYXQgbWVhbnMsIHRoYXQgc3RhcnQgZGF0ZSB3aWxsIGJlIHRoZSBmaXJzdFxyXG4gIHdlZWsgZGF0ZSBvZiB0aGUgZmlyc3QgbW9udGggd2VlayAodGhhdCBjYW5cclxuICBiZSB0aGUgZGF5IDEgb2YgdGhlIG1vbnRoIG9yIG9uZSBvZiB0aGUgbGFzdFxyXG4gIGRhdGVzIGZyb20gdGhlIHByZXZpb3VzIG1vbnRocyksXHJcbiAgYW5kIHNpbWlsYXIgZm9yIHRoZSBlbmQgZGF0ZSBiZWluZyB0aGUgXHJcbiAgbGFzdCB3ZWVrIGRhdGUgb2YgdGhlIGxhc3QgbW9udGggd2Vlay5cclxuKiovXHJcbmZ1bmN0aW9uIGN1cnJlbnRNb250aFdlZWtzKGJhc2VEYXRlKSB7XHJcbiAgdmFyIHIgPSBjdXJyZW50TW9udGgoYmFzZURhdGUpO1xyXG4gIHJldHVybiB7XHJcbiAgICBzdGFydDogZ2V0Rmlyc3RXZWVrRGF0ZShyLnN0YXJ0KSxcclxuICAgIGVuZDogZ2V0TGFzdFdlZWtEYXRlKHIuZW5kKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5jdXJyZW50TW9udGhXZWVrcyA9IGN1cnJlbnRNb250aFdlZWtzO1xyXG5cclxuZnVuY3Rpb24gbmV4dE1vbnRoV2Vla3MoZnJvbURhdGUsIGFtb3VudE1vbnRocykge1xyXG4gIHJldHVybiBjdXJyZW50TW9udGhXZWVrcyhuZXh0TW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykpO1xyXG59XHJcbmV4cG9ydHMubmV4dE1vbnRoV2Vla3MgPSBuZXh0TW9udGhXZWVrcztcclxuXHJcbmZ1bmN0aW9uIHByZXZpb3VzTW9udGhXZWVrcyhmcm9tRGF0ZSwgYW1vdW50TW9udGhzKSB7XHJcbiAgcmV0dXJuIGN1cnJlbnRNb250aFdlZWtzKHByZXZpb3VzTW9udGgoZnJvbURhdGUsIGFtb3VudE1vbnRocykpO1xyXG59XHJcbmV4cG9ydHMucHJldmlvdXNNb250aFdlZWtzID0gcHJldmlvdXNNb250aFdlZWtzO1xyXG4iLCIvKiogVmVyeSBzaW1wbGUgY3VzdG9tLWZvcm1hdCBmdW5jdGlvbiB0byBhbGxvdyBcclxubDEwbiBvZiB0ZXh0cy5cclxuQ292ZXIgY2FzZXM6XHJcbi0gTSBmb3IgbW9udGhcclxuLSBEIGZvciBkYXlcclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlLCBmb3JtYXQpIHtcclxuICB2YXIgcyA9IGZvcm1hdCxcclxuICAgICAgTSA9IGRhdGUuZ2V0TW9udGgoKSArIDEsXHJcbiAgICAgIEQgPSBkYXRlLmdldERhdGUoKTtcclxuICBzID0gcy5yZXBsYWNlKC9NL2csIE0pO1xyXG4gIHMgPSBzLnJlcGxhY2UoL0QvZywgRCk7XHJcbiAgcmV0dXJuIHM7XHJcbn07IiwiLyoqXHJcbiAgRXhwb3NpbmcgYWxsIHRoZSBwdWJsaWMgZmVhdHVyZXMgYW5kIGNvbXBvbmVudHMgb2YgYXZhaWxhYmlsaXR5Q2FsZW5kYXJcclxuKiovXHJcbmV4cG9ydHMuV2Vla2x5ID0gcmVxdWlyZSgnLi9XZWVrbHknKTtcclxuZXhwb3J0cy5Xb3JrSG91cnMgPSByZXF1aXJlKCcuL1dvcmtIb3VycycpO1xyXG5leHBvcnRzLk1vbnRobHkgPSByZXF1aXJlKCcuL01vbnRobHknKTsiLCIvKipcclxuICBNYWtlIGFuIGVsZW1lbnQgdW5zZWxlY3RhYmxlLCB1c2VmdWwgdG8gaW1wbGVtZW50IHNvbWUgY3VzdG9tXHJcbiAgc2VsZWN0aW9uIGJlaGF2aW9yIG9yIGRyYWcmZHJvcC5cclxuICBJZiBvZmZlcnMgYW4gJ29mZicgbWV0aG9kIHRvIHJlc3RvcmUgYmFjayB0aGUgZWxlbWVudCBiZWhhdmlvci5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XHJcblxyXG4gIHZhciBmYWxzeWZuID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH07XHJcbiAgdmFyIG5vZHJhZ1N0eWxlID0ge1xyXG4gICAgJy13ZWJraXQtdG91Y2gtY2FsbG91dCc6ICdub25lJyxcclxuICAgICcta2h0bWwtdXNlci1kcmFnJzogJ25vbmUnLFxyXG4gICAgJy13ZWJraXQtdXNlci1kcmFnJzogJ25vbmUnLFxyXG4gICAgJy1raHRtbC11c2VyLXNlbGVjdCc6ICdub25lJyxcclxuICAgICctd2Via2l0LXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJy1tb3otdXNlci1zZWxlY3QnOiAnbm9uZScsXHJcbiAgICAnLW1zLXVzZXItc2VsZWN0JzogJ25vbmUnLFxyXG4gICAgJ3VzZXItc2VsZWN0JzogJ25vbmUnXHJcbiAgfTtcclxuICB2YXIgZHJhZ2RlZmF1bHRTdHlsZSA9IHtcclxuICAgICctd2Via2l0LXRvdWNoLWNhbGxvdXQnOiAnaW5oZXJpdCcsXHJcbiAgICAnLWtodG1sLXVzZXItZHJhZyc6ICdpbmhlcml0JyxcclxuICAgICctd2Via2l0LXVzZXItZHJhZyc6ICdpbmhlcml0JyxcclxuICAgICcta2h0bWwtdXNlci1zZWxlY3QnOiAnaW5oZXJpdCcsXHJcbiAgICAnLXdlYmtpdC11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICctbW96LXVzZXItc2VsZWN0JzogJ2luaGVyaXQnLFxyXG4gICAgJy1tcy11c2VyLXNlbGVjdCc6ICdpbmhlcml0JyxcclxuICAgICd1c2VyLXNlbGVjdCc6ICdpbmhlcml0J1xyXG4gIH07XHJcblxyXG4gIHZhciBvbiA9IGZ1bmN0aW9uIG1ha2VVbnNlbGVjdGFibGUoZWwpIHtcclxuICAgIGVsID0gJChlbCk7XHJcbiAgICBlbC5vbignc2VsZWN0c3RhcnQnLCBmYWxzeWZuKTtcclxuICAgIC8vJChkb2N1bWVudCkub24oJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICBlbC5jc3Mobm9kcmFnU3R5bGUpO1xyXG4gIH07XHJcblxyXG4gIHZhciBvZmYgPSBmdW5jdGlvbiBvZmZNYWtlVW5zZWxlY3RhYmxlKGVsKSB7XHJcbiAgICBlbCA9ICQoZWwpO1xyXG4gICAgZWwub2ZmKCdzZWxlY3RzdGFydCcsIGZhbHN5Zm4pO1xyXG4gICAgLy8kKGRvY3VtZW50KS5vZmYoJ3NlbGVjdHN0YXJ0JywgZmFsc3lmbik7XHJcbiAgICBlbC5jc3MoZHJhZ2RlZmF1bHRTdHlsZSk7XHJcbiAgfTtcclxuXHJcbiAgb24ub2ZmID0gb2ZmO1xyXG4gIHJldHVybiBvbjtcclxuXHJcbn0gKCkpOyIsIi8qKlxyXG4gIEF2YWlsYWJpbGl0eUNhbGVuZGFyIHNoYXJlZCB1dGlsc1xyXG4qKi9cclxudmFyIFxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBkYXRlSVNPID0gcmVxdWlyZSgnTEMvZGF0ZUlTTzg2MDEnKSxcclxuICBkYXRlVXRpbHMgPSByZXF1aXJlKCcuL2RhdGVVdGlscycpLFxyXG4gIGZvcm1hdERhdGUgPSByZXF1aXJlKCcuL2Zvcm1hdERhdGUnKTtcclxuXHJcbi8vIFJlLWV4cG9ydGluZzpcclxuZXhwb3J0cy5mb3JtYXREYXRlID0gZm9ybWF0RGF0ZTtcclxuZXhwb3J0cy5kYXRlID0gZGF0ZVV0aWxzO1xyXG5cclxuLyotLS0tLS0gQ09OU1RBTlRTIC0tLS0tLS0tLSovXHJcbnZhciBzdGF0dXNUeXBlcyA9IGV4cG9ydHMuc3RhdHVzVHlwZXMgPSBbJ3VuYXZhaWxhYmxlJywgJ2F2YWlsYWJsZSddO1xyXG4vLyBXZWVrIGRheXMgbmFtZXMgaW4gZW5nbGlzaCBmb3IgaW50ZXJuYWwgc3lzdGVtXHJcbi8vIHVzZTsgTk9UIGZvciBsb2NhbGl6YXRpb24vdHJhbnNsYXRpb24uXHJcbnZhciBzeXN0ZW1XZWVrRGF5cyA9IGV4cG9ydHMuc3lzdGVtV2Vla0RheXMgPSBbXHJcbiAgJ3N1bmRheScsXHJcbiAgJ21vbmRheScsXHJcbiAgJ3R1ZXNkYXknLFxyXG4gICd3ZWRuZXNkYXknLFxyXG4gICd0aHVyc2RheScsXHJcbiAgJ2ZyaWRheScsXHJcbiAgJ3NhdHVyZGF5J1xyXG5dO1xyXG5cclxuLyotLS0tLS0tLS0gQ09ORklHIC0gSU5TVEFOQ0UgLS0tLS0tLS0tLSovXHJcbnZhciB3ZWVrbHlDbGFzc2VzID0gZXhwb3J0cy53ZWVrbHlDbGFzc2VzID0ge1xyXG4gIGNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXInLFxyXG4gIHdlZWtseUNhbGVuZGFyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItLXdlZWtseScsXHJcbiAgY3VycmVudFdlZWs6ICdpcy1jdXJyZW50V2VlaycsXHJcbiAgYWN0aW9uczogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWFjdGlvbnMnLFxyXG4gIHByZXZBY3Rpb246ICdBY3Rpb25zLXByZXYnLFxyXG4gIG5leHRBY3Rpb246ICdBY3Rpb25zLW5leHQnLFxyXG4gIGRheXM6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1kYXlzJyxcclxuICBzbG90czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLXNsb3RzJyxcclxuICBzbG90SG91cjogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWhvdXInLFxyXG4gIHNsb3RTdGF0dXNQcmVmaXg6ICdpcy0nLFxyXG4gIGxlZ2VuZDogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZCcsXHJcbiAgbGVnZW5kQXZhaWxhYmxlOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kLWF2YWlsYWJsZScsXHJcbiAgbGVnZW5kVW5hdmFpbGFibGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQtdW5hdmFpbGFibGUnXHJcbn07XHJcblxyXG52YXIgd2Vla2x5VGV4dHMgPSBleHBvcnRzLndlZWtseVRleHRzID0ge1xyXG4gIGFiYnJXZWVrRGF5czogW1xyXG4gICAgJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCdcclxuICBdLFxyXG4gIHRvZGF5OiAnVG9kYXknLFxyXG4gIC8vIEFsbG93ZWQgc3BlY2lhbCB2YWx1ZXM6IE06bW9udGgsIEQ6ZGF5XHJcbiAgYWJickRhdGVGb3JtYXQ6ICdNL0QnXHJcbn07XHJcblxyXG4vKi0tLS0tLS0tLS0tIFZJRVcgVVRJTFMgLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5mdW5jdGlvbiBtb3ZlQmluZFJhbmdlSW5EYXlzKHdlZWtseSwgZGF5cykge1xyXG4gIHZhciBcclxuICAgIHN0YXJ0ID0gZGF0ZVV0aWxzLmFkZERheXMod2Vla2x5LmRhdGVzUmFuZ2Uuc3RhcnQsIGRheXMpLFxyXG4gICAgZW5kID0gZGF0ZVV0aWxzLmFkZERheXMod2Vla2x5LmRhdGVzUmFuZ2UuZW5kLCBkYXlzKSxcclxuICAgIGRhdGVzUmFuZ2UgPSBkYXRlc1RvUmFuZ2Uoc3RhcnQsIGVuZCk7XHJcblxyXG4gIC8vIENoZWNrIGNhY2hlIGJlZm9yZSB0cnkgdG8gZmV0Y2hcclxuICB2YXIgaW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBkYXRlc1JhbmdlKTtcclxuXHJcbiAgaWYgKGluQ2FjaGUpIHtcclxuICAgIC8vIEp1c3Qgc2hvdyB0aGUgZGF0YVxyXG4gICAgd2Vla2x5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgLy8gUHJlZmV0Y2ggZXhjZXB0IGlmIHRoZXJlIGlzIG90aGVyIHJlcXVlc3QgaW4gY291cnNlIChjYW4gYmUgdGhlIHNhbWUgcHJlZmV0Y2gsXHJcbiAgICAvLyBidXQgc3RpbGwgZG9uJ3Qgb3ZlcmxvYWQgdGhlIHNlcnZlcilcclxuICAgIGlmICh3ZWVrbHkuZmV0Y2hEYXRhLnJlcXVlc3RzLmxlbmd0aCA9PT0gMClcclxuICAgICAgd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaCh3ZWVrbHksIGRhdGVzUmFuZ2UpO1xyXG4gIH0gZWxzZSB7XHJcblxyXG4gICAgLy8gU3VwcG9ydCBmb3IgcHJlZmV0Y2hpbmc6XHJcbiAgICAvLyBJdHMgYXZvaWRlZCBpZiB0aGVyZSBhcmUgcmVxdWVzdHMgaW4gY291cnNlLCBzaW5jZVxyXG4gICAgLy8gdGhhdCB3aWxsIGJlIGEgcHJlZmV0Y2ggZm9yIHRoZSBzYW1lIGRhdGEuXHJcbiAgICBpZiAod2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGgpIHtcclxuICAgICAgLy8gVGhlIGxhc3QgcmVxdWVzdCBpbiB0aGUgcG9vbCAqbXVzdCogYmUgdGhlIGxhc3QgaW4gZmluaXNoXHJcbiAgICAgIC8vIChtdXN0IGJlIG9ubHkgb25lIGlmIGFsbCBnb2VzIGZpbmUpOlxyXG4gICAgICB2YXIgcmVxdWVzdCA9IHdlZWtseS5mZXRjaERhdGEucmVxdWVzdHNbd2Vla2x5LmZldGNoRGF0YS5yZXF1ZXN0cy5sZW5ndGggLSAxXTtcclxuXHJcbiAgICAgIC8vIFdhaXQgZm9yIHRoZSBmZXRjaCB0byBwZXJmb3JtIGFuZCBzZXRzIGxvYWRpbmcgdG8gbm90aWZ5IHVzZXJcclxuICAgICAgd2Vla2x5LiRlbC5hZGRDbGFzcyh3ZWVrbHkuY2xhc3Nlcy5mZXRjaGluZyk7XHJcbiAgICAgIHJlcXVlc3QuZG9uZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgbW92ZUJpbmRSYW5nZUluRGF5cyh3ZWVrbHksIGRheXMpO1xyXG4gICAgICAgIHdlZWtseS4kZWwucmVtb3ZlQ2xhc3Mod2Vla2x5LmNsYXNzZXMuZmV0Y2hpbmcgfHwgJ18nKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgd2Vla2x5XHJcbiAgICAuZmV0Y2hEYXRhKGRhdGVzVG9RdWVyeShkYXRlc1JhbmdlKSlcclxuICAgIC5kb25lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgd2Vla2x5LmJpbmREYXRhKGRhdGVzUmFuZ2UpO1xyXG4gICAgICAvLyBQcmVmZXRjaFxyXG4gICAgICB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgZGF0ZXNSYW5nZSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuZXhwb3J0cy5tb3ZlQmluZFJhbmdlSW5EYXlzID0gbW92ZUJpbmRSYW5nZUluRGF5cztcclxuXHJcbmZ1bmN0aW9uIHdlZWtseUlzRGF0YUluQ2FjaGUod2Vla2x5LCBkYXRlc1JhbmdlKSB7XHJcbiAgLy8gQ2hlY2sgY2FjaGU6IGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgZGF0ZSBpbiB0aGUgcmFuZ2VcclxuICAvLyB3aXRob3V0IGRhdGEsIHdlIHNldCBpbkNhY2hlIGFzIGZhbHNlIGFuZCBmZXRjaCB0aGUgZGF0YTpcclxuICB2YXIgaW5DYWNoZSA9IHRydWU7XHJcbiAgZGF0ZVV0aWxzLmVhY2hEYXRlSW5SYW5nZShkYXRlc1JhbmdlLnN0YXJ0LCBkYXRlc1JhbmdlLmVuZCwgZnVuY3Rpb24gKGRhdGUpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICBpZiAoIXdlZWtseS5kYXRhLnNsb3RzW2RhdGVrZXldKSB7XHJcbiAgICAgIGluQ2FjaGUgPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiBpbkNhY2hlO1xyXG59XHJcbmV4cG9ydHMud2Vla2x5SXNEYXRhSW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGU7XHJcblxyXG4vKipcclxuICBGb3Igbm93LCBnaXZlbiB0aGUgSlNPTiBzdHJ1Y3R1cmUgdXNlZCwgdGhlIGxvZ2ljXHJcbiAgb2YgbW9udGhseUlzRGF0YUluQ2FjaGUgaXMgdGhlIHNhbWUgYXMgd2Vla2x5SXNEYXRhSW5DYWNoZTpcclxuKiovXHJcbnZhciBtb250aGx5SXNEYXRhSW5DYWNoZSA9IHdlZWtseUlzRGF0YUluQ2FjaGU7XHJcbmV4cG9ydHMubW9udGhseUlzRGF0YUluQ2FjaGUgPSBtb250aGx5SXNEYXRhSW5DYWNoZTtcclxuXHJcblxyXG5mdW5jdGlvbiB3ZWVrbHlDaGVja0FuZFByZWZldGNoKHdlZWtseSwgY3VycmVudERhdGVzUmFuZ2UpIHtcclxuICB2YXIgbmV4dERhdGVzUmFuZ2UgPSBkYXRlc1RvUmFuZ2UoXHJcbiAgICBkYXRlVXRpbHMuYWRkRGF5cyhjdXJyZW50RGF0ZXNSYW5nZS5zdGFydCwgNyksXHJcbiAgICBkYXRlVXRpbHMuYWRkRGF5cyhjdXJyZW50RGF0ZXNSYW5nZS5lbmQsIDcpXHJcbiAgKTtcclxuXHJcbiAgaWYgKCF3ZWVrbHlJc0RhdGFJbkNhY2hlKHdlZWtseSwgbmV4dERhdGVzUmFuZ2UpKSB7XHJcbiAgICAvLyBQcmVmZXRjaGluZyBuZXh0IHdlZWsgaW4gYWR2YW5jZVxyXG4gICAgdmFyIHByZWZldGNoUXVlcnkgPSBkYXRlc1RvUXVlcnkobmV4dERhdGVzUmFuZ2UpO1xyXG4gICAgd2Vla2x5LmZldGNoRGF0YShwcmVmZXRjaFF1ZXJ5LCBudWxsLCB0cnVlKTtcclxuICB9XHJcbn1cclxuZXhwb3J0cy53ZWVrbHlDaGVja0FuZFByZWZldGNoID0gd2Vla2x5Q2hlY2tBbmRQcmVmZXRjaDtcclxuXHJcbi8qKiBVcGRhdGUgdGhlIHZpZXcgbGFiZWxzIGZvciB0aGUgd2Vlay1kYXlzICh0YWJsZSBoZWFkZXJzKVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlTGFiZWxzKGRhdGVzUmFuZ2UsIGNhbGVuZGFyLCBvcHRpb25zKSB7XHJcbiAgdmFyIHN0YXJ0ID0gZGF0ZXNSYW5nZS5zdGFydCxcclxuICAgICAgZW5kID0gZGF0ZXNSYW5nZS5lbmQ7XHJcblxyXG4gIHZhciBkYXlzID0gY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMuZGF5cyArICcgdGgnKTtcclxuICB2YXIgdG9kYXkgPSBkYXRlSVNPLmRhdGVMb2NhbChuZXcgRGF0ZSgpKTtcclxuICAvLyBGaXJzdCBjZWxsIGlzIGVtcHR5ICgndGhlIGNyb3NzIGhlYWRlcnMgY2VsbCcpLCB0aGVuIG9mZnNldCBpcyAxXHJcbiAgdmFyIG9mZnNldCA9IDE7XHJcbiAgZGF0ZVV0aWxzLmVhY2hEYXRlSW5SYW5nZShzdGFydCwgZW5kLCBmdW5jdGlvbiAoZGF0ZSwgaSkge1xyXG4gICAgdmFyIGNlbGwgPSAkKGRheXMuZ2V0KG9mZnNldCArIGkpKSxcclxuICAgICAgICBzZGF0ZSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUpLFxyXG4gICAgICAgIGxhYmVsID0gc2RhdGU7XHJcblxyXG4gICAgaWYgKHRvZGF5ID09IHNkYXRlKVxyXG4gICAgICBsYWJlbCA9IG9wdGlvbnMudGV4dHMudG9kYXk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGxhYmVsID0gb3B0aW9ucy50ZXh0cy5hYmJyV2Vla0RheXNbZGF0ZS5nZXREYXkoKV0gKyAnICcgKyBmb3JtYXREYXRlKGRhdGUsIG9wdGlvbnMudGV4dHMuYWJickRhdGVGb3JtYXQpO1xyXG5cclxuICAgIGNlbGwudGV4dChsYWJlbCk7XHJcbiAgfSk7XHJcbn1cclxuZXhwb3J0cy51cGRhdGVMYWJlbHMgPSB1cGRhdGVMYWJlbHM7XHJcblxyXG5mdW5jdGlvbiBmaW5kQ2VsbEJ5U2xvdChzbG90c0NvbnRhaW5lciwgZGF5LCBzbG90KSB7XHJcbiAgc2xvdCA9IGRhdGVJU08ucGFyc2Uoc2xvdCk7XHJcbiAgdmFyIFxyXG4gICAgeCA9IE1hdGgucm91bmQoc2xvdC5nZXRIb3VycygpKSxcclxuICAvLyBUaW1lIGZyYW1lcyAoc2xvdHMpIGFyZSAxNSBtaW51dGVzIGRpdmlzaW9uc1xyXG4gICAgeSA9IE1hdGgucm91bmQoc2xvdC5nZXRNaW51dGVzKCkgLyAxNSksXHJcbiAgICB0ciA9IHNsb3RzQ29udGFpbmVyLmNoaWxkcmVuKCc6ZXEoJyArIE1hdGgucm91bmQoeCAqIDQgKyB5KSArICcpJyk7XHJcblxyXG4gIC8vIFNsb3QgY2VsbCBmb3IgbydjbG9jayBob3VycyBpcyBhdCAxIHBvc2l0aW9uIG9mZnNldFxyXG4gIC8vIGJlY2F1c2Ugb2YgdGhlIHJvdy1oZWFkIGNlbGxcclxuICB2YXIgZGF5T2Zmc2V0ID0gKHkgPT09IDAgPyBkYXkgKyAxIDogZGF5KTtcclxuICByZXR1cm4gdHIuY2hpbGRyZW4oJzplcSgnICsgZGF5T2Zmc2V0ICsgJyknKTtcclxufVxyXG5leHBvcnRzLmZpbmRDZWxsQnlTbG90ID0gZmluZENlbGxCeVNsb3Q7XHJcblxyXG5mdW5jdGlvbiBmaW5kU2xvdEJ5Q2VsbChzbG90c0NvbnRhaW5lciwgY2VsbCkge1xyXG4gIHZhciBcclxuICAgIHggPSBjZWxsLnNpYmxpbmdzKCd0ZCcpLmFuZFNlbGYoKS5pbmRleChjZWxsKSxcclxuICAgIHkgPSBjZWxsLmNsb3Nlc3QoJ3RyJykuaW5kZXgoKSxcclxuICAgIGZ1bGxNaW51dGVzID0geSAqIDE1LFxyXG4gICAgaG91cnMgPSBNYXRoLmZsb29yKGZ1bGxNaW51dGVzIC8gNjApLFxyXG4gICAgbWludXRlcyA9IGZ1bGxNaW51dGVzIC0gKGhvdXJzICogNjApLFxyXG4gICAgc2xvdCA9IG5ldyBEYXRlKCk7XHJcbiAgc2xvdC5zZXRIb3Vycyhob3VycywgbWludXRlcywgMCwgMCk7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBkYXk6IHgsXHJcbiAgICBzbG90OiBzbG90XHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmZpbmRTbG90QnlDZWxsID0gZmluZFNsb3RCeUNlbGw7XHJcblxyXG4vKipcclxuTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LXdlZWsgYW5kIGRpc2FibGUgcHJldiBidXR0b24sXHJcbm9yIHJlbW92ZSB0aGUgbWFyayBhbmQgZW5hYmxlIGl0IGlmIGlzIG5vdC5cclxuKiovXHJcbmZ1bmN0aW9uIGNoZWNrQ3VycmVudFdlZWsoY2FsZW5kYXIsIGRhdGUsIG9wdGlvbnMpIHtcclxuICB2YXIgeWVwID0gZGF0ZVV0aWxzLmlzSW5DdXJyZW50V2VlayhkYXRlKTtcclxuICBjYWxlbmRhci50b2dnbGVDbGFzcyhvcHRpb25zLmNsYXNzZXMuY3VycmVudFdlZWssIHllcCk7XHJcbiAgY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMucHJldkFjdGlvbikucHJvcCgnZGlzYWJsZWQnLCB5ZXApO1xyXG59XHJcbmV4cG9ydHMuY2hlY2tDdXJyZW50V2VlayA9IGNoZWNrQ3VycmVudFdlZWs7XHJcblxyXG4vKiogR2V0IHF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBkYXRlIHJhbmdlIHNwZWNpZmllZDpcclxuKiovXHJcbmZ1bmN0aW9uIGRhdGVzVG9RdWVyeShzdGFydCwgZW5kKSB7XHJcbiAgLy8gVW5pcXVlIHBhcmFtIHdpdGggYm90aCBwcm9waWVydGllczpcclxuICBpZiAoc3RhcnQuZW5kKSB7XHJcbiAgICBlbmQgPSBzdGFydC5lbmQ7XHJcbiAgICBzdGFydCA9IHN0YXJ0LnN0YXJ0O1xyXG4gIH1cclxuICByZXR1cm4ge1xyXG4gICAgc3RhcnQ6IGRhdGVJU08uZGF0ZUxvY2FsKHN0YXJ0LCB0cnVlKSxcclxuICAgIGVuZDogZGF0ZUlTTy5kYXRlTG9jYWwoZW5kLCB0cnVlKVxyXG4gIH07XHJcbn1cclxuZXhwb3J0cy5kYXRlc1RvUXVlcnkgPSBkYXRlc1RvUXVlcnk7XHJcblxyXG4vKiogUGFjayB0d28gZGF0ZXMgaW4gYSBzaW1wbGUgYnV0IHVzZWZ1bFxyXG5zdHJ1Y3R1cmUgeyBzdGFydCwgZW5kIH1cclxuKiovXHJcbmZ1bmN0aW9uIGRhdGVzVG9SYW5nZShzdGFydCwgZW5kKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHN0YXJ0OiBzdGFydCxcclxuICAgIGVuZDogZW5kXHJcbiAgfTtcclxufVxyXG5leHBvcnRzLmRhdGVzVG9SYW5nZSA9IGRhdGVzVG9SYW5nZTtcclxuIiwiLyogR2VuZXJpYyBibG9ja1VJIG9wdGlvbnMgc2V0cyAqL1xyXG52YXIgbG9hZGluZ0Jsb2NrID0geyBtZXNzYWdlOiAnPGltZyB3aWR0aD1cIjQ4cHhcIiBoZWlnaHQ9XCI0OHB4XCIgY2xhc3M9XCJsb2FkaW5nLWluZGljYXRvclwiIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nIH07XHJcbnZhciBlcnJvckJsb2NrID0gZnVuY3Rpb24gKGVycm9yLCByZWxvYWQsIHN0eWxlKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGNzczogJC5leHRlbmQoeyBjdXJzb3I6ICdkZWZhdWx0JyB9LCBzdHlsZSB8fCB7fSksXHJcbiAgICAgICAgbWVzc2FnZTogJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT48ZGl2IGNsYXNzPVwiaW5mb1wiPlRoZXJlIHdhcyBhbiBlcnJvcicgK1xyXG4gICAgICAgICAgICAoZXJyb3IgPyAnOiAnICsgZXJyb3IgOiAnJykgK1xyXG4gICAgICAgICAgICAocmVsb2FkID8gJyA8YSBocmVmPVwiamF2YXNjcmlwdDogJyArIHJlbG9hZCArICc7XCI+Q2xpY2sgdG8gcmVsb2FkPC9hPicgOiAnJykgK1xyXG4gICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgfTtcclxufTtcclxudmFyIGluZm9CbG9jayA9IGZ1bmN0aW9uIChtZXNzYWdlLCBvcHRpb25zKSB7XHJcbiAgICByZXR1cm4gJC5leHRlbmQoe1xyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj4nICsgbWVzc2FnZSArICc8L2Rpdj4nXHJcbiAgICAgICAgLyosY3NzOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0qL1xyXG4gICAgICAgICwgb3ZlcmxheUNTUzogeyBjdXJzb3I6ICdkZWZhdWx0JyB9XHJcbiAgICB9LCBvcHRpb25zKTtcclxufTtcclxuXHJcbi8vIE1vZHVsZTpcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBsb2FkaW5nOiBsb2FkaW5nQmxvY2ssXHJcbiAgICAgICAgZXJyb3I6IGVycm9yQmxvY2ssXHJcbiAgICAgICAgaW5mbzogaW5mb0Jsb2NrXHJcbiAgICB9O1xyXG59IiwiLyo9IENoYW5nZXNOb3RpZmljYXRpb24gY2xhc3NcclxuKiB0byBub3RpZnkgdXNlciBhYm91dCBjaGFuZ2VzIGluIGZvcm1zLFxyXG4qIHRhYnMsIHRoYXQgd2lsbCBiZSBsb3N0IGlmIGdvIGF3YXkgZnJvbVxyXG4qIHRoZSBwYWdlLiBJdCBrbm93cyB3aGVuIGEgZm9ybSBpcyBzdWJtaXR0ZWRcclxuKiBhbmQgc2F2ZWQgdG8gZGlzYWJsZSBub3RpZmljYXRpb24sIGFuZCBnaXZlc1xyXG4qIG1ldGhvZHMgZm9yIG90aGVyIHNjcmlwdHMgdG8gbm90aWZ5IGNoYW5nZXNcclxuKiBvciBzYXZpbmcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBnZXRYUGF0aCA9IHJlcXVpcmUoJy4vZ2V0WFBhdGgnKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0ge1xyXG4gICAgY2hhbmdlc0xpc3Q6IHt9LFxyXG4gICAgZGVmYXVsdHM6IHtcclxuICAgICAgICB0YXJnZXQ6IG51bGwsXHJcbiAgICAgICAgZ2VuZXJpY0NoYW5nZVN1cHBvcnQ6IHRydWUsXHJcbiAgICAgICAgZ2VuZXJpY1N1Ym1pdFN1cHBvcnQ6IGZhbHNlLFxyXG4gICAgICAgIGNoYW5nZWRGb3JtQ2xhc3M6ICdoYXMtY2hhbmdlcycsXHJcbiAgICAgICAgY2hhbmdlZEVsZW1lbnRDbGFzczogJ2NoYW5nZWQnLFxyXG4gICAgICAgIG5vdGlmeUNsYXNzOiAnbm90aWZ5LWNoYW5nZXMnXHJcbiAgICB9LFxyXG4gICAgaW5pdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgICAgICAvLyBVc2VyIG5vdGlmaWNhdGlvbiB0byBwcmV2ZW50IGxvc3QgY2hhbmdlcyBkb25lXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBjaGFuZ2VzTm90aWZpY2F0aW9uLm5vdGlmeSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0aGlzLmRlZmF1bHRzLCBvcHRpb25zKTtcclxuICAgICAgICBpZiAoIW9wdGlvbnMudGFyZ2V0KVxyXG4gICAgICAgICAgICBvcHRpb25zLnRhcmdldCA9IGRvY3VtZW50O1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNDaGFuZ2VTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignY2hhbmdlJywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCkgOmlucHV0W25hbWVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZSgkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksIHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljU3VibWl0U3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ3N1Ym1pdCcsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUodGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG5vdGlmeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIEFkZCBub3RpZmljYXRpb24gY2xhc3MgdG8gdGhlIGRvY3VtZW50XHJcbiAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMubm90aWZ5Q2xhc3MpO1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgY2hhbmdlIGluIHRoZSBwcm9wZXJ0eSBsaXN0IHJldHVybmluZyB0aGUgbWVzc2FnZTpcclxuICAgICAgICBmb3IgKHZhciBjIGluIHRoaXMuY2hhbmdlc0xpc3QpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1aXRNZXNzYWdlIHx8ICh0aGlzLnF1aXRNZXNzYWdlID0gJCgnI2xjcmVzLXF1aXQtd2l0aG91dC1zYXZlJykudGV4dCgpKSB8fCAnJztcclxuICAgIH0sXHJcbiAgICByZWdpc3RlckNoYW5nZTogZnVuY3Rpb24gKGYsIGUpIHtcclxuICAgICAgICBpZiAoIWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICB2YXIgZmwgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdIHx8IFtdO1xyXG4gICAgICAgIGlmICgkLmlzQXJyYXkoZSkpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlckNoYW5nZShmLCBlW2ldKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbiA9IGU7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAoZSkgIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIG4gPSBlLm5hbWU7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHJlYWxseSB0aGVyZSB3YXMgYSBjaGFuZ2UgY2hlY2tpbmcgZGVmYXVsdCBlbGVtZW50IHZhbHVlXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGUuZGVmYXVsdFZhbHVlKSAhPSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLmNoZWNrZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuc2VsZWN0ZWQpID09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICBlLnZhbHVlID09IGUuZGVmYXVsdFZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGVyZSB3YXMgbm8gY2hhbmdlLCBubyBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgLy8gYW5kIG1heWJlIGlzIGEgcmVncmVzc2lvbiBmcm9tIGEgY2hhbmdlIGFuZCBub3cgdGhlIG9yaWdpbmFsIHZhbHVlIGFnYWluXHJcbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gcmVtb3ZlIGZyb20gY2hhbmdlcyBsaXN0IGRvaW5nIHJlZ2lzdGVyU2F2ZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWdpc3RlclNhdmUoZiwgW25dKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkKGUpLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghKG4gaW4gZmwpKVxyXG4gICAgICAgICAgICBmbC5wdXNoKG4pO1xyXG4gICAgICAgICQoZilcclxuICAgICAgICAuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKVxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudCBuYW1lIGNoYW5nZWQsIGZvcm0gZWxlbWVudCBjaGFuZ2VkICh0aGlzIGNhbiBiZSBudWxsKVxyXG4gICAgICAgIC50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgW2YsIG4sIGVdKTtcclxuICAgIH0sXHJcbiAgICByZWdpc3RlclNhdmU6IGZ1bmN0aW9uIChmLCBlbHMpIHtcclxuICAgICAgICB2YXIgZm5hbWUgPSBnZXRYUGF0aChmKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHByZXZFbHMgPSAkLmV4dGVuZChbXSwgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pO1xyXG4gICAgICAgIHZhciByID0gdHJ1ZTtcclxuICAgICAgICBpZiAoZWxzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gJC5ncmVwKHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLCBmdW5jdGlvbiAoZWwpIHsgcmV0dXJuICgkLmluQXJyYXkoZWwsIGVscykgPT0gLTEpOyB9KTtcclxuICAgICAgICAgICAgLy8gRG9uJ3QgcmVtb3ZlICdmJyBsaXN0IGlmIGlzIG5vdCBlbXB0eVxyXG4gICAgICAgICAgICByID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0ubGVuZ3RoID09PSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAocikge1xyXG4gICAgICAgICAgICAkKGYpLnJlbW92ZUNsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcyk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXTtcclxuICAgICAgICAgICAgLy8gbGluayBlbGVtZW50cyBmcm9tIGVscyB0byBjbGVhbi11cCBpdHMgY2xhc3Nlc1xyXG4gICAgICAgICAgICBlbHMgPSBwcmV2RWxzO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnRzIHJlZ2lzdGVyZWQgYXMgc2F2ZSAodGhpcyBjYW4gYmUgbnVsbCksIGFuZCAnZm9ybSBmdWxseSBzYXZlZCcgYXMgdGhpcmQgcGFyYW0gKGJvb2wpXHJcbiAgICAgICAgJChmKS50cmlnZ2VyKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsIFtmLCBlbHMsIHJdKTtcclxuICAgICAgICB2YXIgbGNobiA9IHRoaXM7XHJcbiAgICAgICAgaWYgKGVscykgJC5lYWNoKGVscywgZnVuY3Rpb24gKCkgeyAkKCdbbmFtZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHRoaXMpICsgJ1wiXScpLnJlbW92ZUNsYXNzKGxjaG4uZGVmYXVsdHMuY2hhbmdlZEVsZW1lbnRDbGFzcyk7IH0pO1xyXG4gICAgICAgIHJldHVybiBwcmV2RWxzO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBjaGFuZ2VzTm90aWZpY2F0aW9uO1xyXG59IiwiLyogVXRpbGl0eSB0byBjcmVhdGUgaWZyYW1lIHdpdGggaW5qZWN0ZWQgaHRtbC9jb250ZW50IGluc3RlYWQgb2YgVVJMLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjcmVhdGVJZnJhbWUoY29udGVudCwgc2l6ZSkge1xyXG4gICAgdmFyICRpZnJhbWUgPSAkKCc8aWZyYW1lIHdpZHRoPVwiJyArIHNpemUud2lkdGggKyAnXCIgaGVpZ2h0PVwiJyArIHNpemUuaGVpZ2h0ICsgJ1wiIHN0eWxlPVwiYm9yZGVyOm5vbmU7XCI+PC9pZnJhbWU+Jyk7XHJcbiAgICB2YXIgaWZyYW1lID0gJGlmcmFtZS5nZXQoMCk7XHJcbiAgICAvLyBXaGVuIHRoZSBpZnJhbWUgaXMgcmVhZHlcclxuICAgIHZhciBpZnJhbWVsb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmcmFtZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gVXNpbmcgaWZyYW1lbG9hZGVkIHRvIGF2b2lkIGluZmluaXRlIGxvb3BzXHJcbiAgICAgICAgaWYgKCFpZnJhbWVsb2FkZWQpIHtcclxuICAgICAgICAgICAgaWZyYW1lbG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGNvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gJGlmcmFtZTtcclxufTtcclxuXHJcbi8qIFB1dHMgZnVsbCBodG1sIGluc2lkZSB0aGUgaWZyYW1lIGVsZW1lbnQgcGFzc2VkIGluIGEgc2VjdXJlIGFuZCBjb21wbGlhbnQgbW9kZSAqL1xyXG5mdW5jdGlvbiBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgaHRtbCkge1xyXG4gICAgLy8gcHV0IGFqYXggZGF0YSBpbnNpZGUgaWZyYW1lIHJlcGxhY2luZyBhbGwgdGhlaXIgaHRtbCBpbiBzZWN1cmUgXHJcbiAgICAvLyBjb21wbGlhbnQgbW9kZSAoJC5odG1sIGRvbid0IHdvcmtzIHRvIGluamVjdCA8aHRtbD48aGVhZD4gY29udGVudClcclxuXHJcbiAgICAvKiBkb2N1bWVudCBBUEkgdmVyc2lvbiAocHJvYmxlbXMgd2l0aCBJRSwgZG9uJ3QgZXhlY3V0ZSBpZnJhbWUtaHRtbCBzY3JpcHRzKSAqL1xyXG4gICAgLyp2YXIgaWZyYW1lRG9jID1cclxuICAgIC8vIFczQyBjb21wbGlhbnQ6IG5zLCBmaXJlZm94LWdlY2tvLCBjaHJvbWUvc2FmYXJpLXdlYmtpdCwgb3BlcmEsIGllOVxyXG4gICAgaWZyYW1lLmNvbnRlbnREb2N1bWVudCB8fFxyXG4gICAgLy8gb2xkIElFICg1LjUrKVxyXG4gICAgKGlmcmFtZS5jb250ZW50V2luZG93ID8gaWZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQgOiBudWxsKSB8fFxyXG4gICAgLy8gZmFsbGJhY2sgKHZlcnkgb2xkIElFPylcclxuICAgIGRvY3VtZW50LmZyYW1lc1tpZnJhbWUuaWRdLmRvY3VtZW50O1xyXG4gICAgaWZyYW1lRG9jLm9wZW4oKTtcclxuICAgIGlmcmFtZURvYy53cml0ZShodG1sKTtcclxuICAgIGlmcmFtZURvYy5jbG9zZSgpOyovXHJcblxyXG4gICAgLyogamF2YXNjcmlwdCBVUkkgdmVyc2lvbiAod29ya3MgZmluZSBldmVyeXdoZXJlISkgKi9cclxuICAgIGlmcmFtZS5jb250ZW50V2luZG93LmNvbnRlbnRzID0gaHRtbDtcclxuICAgIGlmcmFtZS5zcmMgPSAnamF2YXNjcmlwdDp3aW5kb3dbXCJjb250ZW50c1wiXSc7XHJcblxyXG4gICAgLy8gQWJvdXQgdGhpcyB0ZWNobmlxdWUsIHRoaXMgaHR0cDovL3NwYXJlY3ljbGVzLndvcmRwcmVzcy5jb20vMjAxMi8wMy8wOC9pbmplY3QtY29udGVudC1pbnRvLWEtbmV3LWlmcmFtZS9cclxufVxyXG5cclxuIiwiLyogQ1JVREwgSGVscGVyICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxudmFyIGdldFRleHQgPSByZXF1aXJlKCcuL2dldFRleHQnKTtcclxudmFyIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5cclxuZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MgPSB7XHJcbiAgZWZmZWN0czoge1xyXG4gICAgJ3Nob3ctdmlld2VyJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sXHJcbiAgICAnaGlkZS12aWV3ZXInOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSxcclxuICAgICdzaG93LWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LCAvLyB0aGUgc2FtZSBhcyBqcXVlcnktdWkgeyBlZmZlY3Q6ICdzbGlkZScsIGR1cmF0aW9uOiAnc2xvdycsIGRpcmVjdGlvbjogJ2Rvd24nIH1cclxuICAgICdoaWRlLWVkaXRvcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9XHJcbiAgfSxcclxuICBldmVudHM6IHtcclxuICAgICdlZGl0LWVuZHMnOiAnY3J1ZGwtZWRpdC1lbmRzJyxcclxuICAgICdlZGl0LXN0YXJ0cyc6ICdjcnVkbC1lZGl0LXN0YXJ0cycsXHJcbiAgICAnZWRpdG9yLXJlYWR5JzogJ2NydWRsLWVkaXRvci1yZWFkeScsXHJcbiAgICAnZWRpdG9yLXNob3dlZCc6ICdjcnVkbC1lZGl0b3Itc2hvd2VkJyxcclxuICAgICdjcmVhdGUnOiAnY3J1ZGwtY3JlYXRlJyxcclxuICAgICd1cGRhdGUnOiAnY3J1ZGwtdXBkYXRlJyxcclxuICAgICdkZWxldGUnOiAnY3J1ZGwtZGVsZXRlJ1xyXG4gIH0sXHJcbiAgZGF0YToge1xyXG4gICAgJ2ZvY3VzLWNsb3Nlc3QnOiB7XHJcbiAgICAgIG5hbWU6ICdjcnVkbC1mb2N1cy1jbG9zZXN0JyxcclxuICAgICAgJ2RlZmF1bHQnOiAnKidcclxuICAgIH0sXHJcbiAgICAnZm9jdXMtbWFyZ2luJzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtbWFyZ2luJyxcclxuICAgICAgJ2RlZmF1bHQnOiAwXHJcbiAgICB9LFxyXG4gICAgJ2ZvY3VzLWR1cmF0aW9uJzoge1xyXG4gICAgICBuYW1lOiAnY3J1ZGwtZm9jdXMtZHVyYXRpb24nLFxyXG4gICAgICAnZGVmYXVsdCc6IDIwMFxyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gIFV0aWxpdHkgdG8gZ2V0IGEgZGF0YSB2YWx1ZSBvciB0aGUgZGVmYXVsdCBiYXNlZCBvbiB0aGUgaW5zdGFuY2VcclxuICBzZXR0aW5ncyBvbiB0aGUgZ2l2ZW4gZWxlbWVudFxyXG4qKi9cclxuZnVuY3Rpb24gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBlbCwgc2V0dGluZ05hbWUpIHtcclxuICB2YXJcclxuICAgIHNldHRpbmcgPSBpbnN0YW5jZS5zZXR0aW5ncy5kYXRhW3NldHRpbmdOYW1lXSxcclxuICAgIHZhbCA9IGVsLmRhdGEoc2V0dGluZy5uYW1lKSB8fCBzZXR0aW5nWydkZWZhdWx0J107XHJcbiAgcmV0dXJuIHZhbDtcclxufVxyXG5cclxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uIHNldHVwQ3J1ZGwob25TdWNjZXNzLCBvbkVycm9yLCBvbkNvbXBsZXRlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uOiBmdW5jdGlvbiBvbihzZWxlY3Rvciwgc2V0dGluZ3MpIHtcclxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCAnLmNydWRsJztcclxuICAgICAgdmFyIGluc3RhbmNlID0ge1xyXG4gICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcclxuICAgICAgICBlbGVtZW50czogJChzZWxlY3RvcilcclxuICAgICAgfTtcclxuICAgICAgLy8gRXh0ZW5kaW5nIGRlZmF1bHQgc2V0dGluZ3Mgd2l0aCBwcm92aWRlZCBvbmVzLFxyXG4gICAgICAvLyBidXQgc29tZSBjYW4gYmUgdHdlYWsgb3V0c2lkZSB0b28uXHJcbiAgICAgIGluc3RhbmNlLnNldHRpbmdzID0gJC5leHRlbmQodHJ1ZSwgZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MsIHNldHRpbmdzKTtcclxuICAgICAgaW5zdGFuY2UuZWxlbWVudHMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGNydWRsID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoY3J1ZGwuZGF0YSgnX19jcnVkbF9pbml0aWFsaXplZF9fJykgPT09IHRydWUpIHJldHVybjtcclxuICAgICAgICB2YXIgZGN0eCA9IGNydWRsLmRhdGEoJ2NydWRsLWNvbnRleHQnKSB8fCAnJztcclxuICAgICAgICB2YXIgdndyID0gY3J1ZGwuZmluZCgnLmNydWRsLXZpZXdlcicpO1xyXG4gICAgICAgIHZhciBkdHIgPSBjcnVkbC5maW5kKCcuY3J1ZGwtZWRpdG9yJyk7XHJcbiAgICAgICAgdmFyIGlpZHBhciA9IGNydWRsLmRhdGEoJ2NydWRsLWl0ZW0taWQtcGFyYW1ldGVyJykgfHwgJ0l0ZW1JRCc7XHJcbiAgICAgICAgdmFyIGZvcm1wYXJzID0geyBhY3Rpb246ICdjcmVhdGUnIH07XHJcbiAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IDA7XHJcbiAgICAgICAgdmFyIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0RXh0cmFRdWVyeShlbCkge1xyXG4gICAgICAgICAgLy8gR2V0IGV4dHJhIHF1ZXJ5IG9mIHRoZSBlbGVtZW50LCBpZiBhbnk6XHJcbiAgICAgICAgICB2YXIgeHEgPSBlbC5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpIHx8ICcnO1xyXG4gICAgICAgICAgaWYgKHhxKSB4cSA9ICcmJyArIHhxO1xyXG4gICAgICAgICAgLy8gSXRlcmF0ZSBhbGwgcGFyZW50cyBpbmNsdWRpbmcgdGhlICdjcnVkbCcgZWxlbWVudCAocGFyZW50c1VudGlsIGV4Y2x1ZGVzIHRoZSBmaXJzdCBlbGVtZW50IGdpdmVuLFxyXG4gICAgICAgICAgLy8gYmVjYXVzZSBvZiB0aGF0IHdlIGdldCBpdHMgcGFyZW50KCkpXHJcbiAgICAgICAgICAvLyBGb3IgYW55IG9mIHRoZW0gd2l0aCBhbiBleHRyYS1xdWVyeSwgYXBwZW5kIGl0OlxyXG4gICAgICAgICAgZWwucGFyZW50c1VudGlsKGNydWRsLnBhcmVudCgpLCAnW2RhdGEtY3J1ZGwtZXh0cmEtcXVlcnldJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB4ID0gJCh0aGlzKS5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpO1xyXG4gICAgICAgICAgICBpZiAoeCkgeHEgKz0gJyYnICsgeDtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIHhxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3J1ZGwuZmluZCgnLmNydWRsLWNyZWF0ZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSAwO1xyXG4gICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ2NyZWF0ZSc7XHJcbiAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG4gICAgICAgICAgZHRyLnJlbG9hZCh7XHJcbiAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKHVybCwgZGVmYXVsdFVybCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VXJsICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGR0ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LWVkaXRvciddKVxyXG4gICAgICAgICAgICAgIC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgICBkdHIuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEhpZGUgdmlld2VyIHdoZW4gaW4gZWRpdG9yOlxyXG4gICAgICAgICAgdndyLnhoaWRlKGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtdmlld2VyJ10pO1xyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSlcclxuICAgICAgICAgIC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50cy5jcmVhdGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdndyXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtdXBkYXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAndXBkYXRlJztcclxuICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcbiAgICAgICAgICBkdHIucmVsb2FkKHtcclxuICAgICAgICAgICAgdXJsOiBmdW5jdGlvbiAodXJsLCBkZWZhdWx0VXJsKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRVcmwgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgZHRyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctZWRpdG9yJ10pXHJcbiAgICAgICAgICAgICAgLnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIFtkdHJdKTtcclxuICAgICAgICAgICAgICAgIGR0ci5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgLy8gSGlkZSB2aWV3ZXIgd2hlbiBpbiBlZGl0b3I6XHJcbiAgICAgICAgICB2d3IueGhpZGUoaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS12aWV3ZXInXSk7XHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddKVxyXG4gICAgICAgICAgLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzLnVwZGF0ZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtZGVsZXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuXHJcbiAgICAgICAgICBpZiAoY29uZmlybShnZXRUZXh0KCdjb25maXJtLWRlbGV0ZS1jcnVkbC1pdGVtLW1lc3NhZ2U6JyArIGRjdHgpKSkge1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCc8ZGl2PicgKyBnZXRUZXh0KCdkZWxldGUtY3J1ZGwtaXRlbS1sb2FkaW5nLW1lc3NhZ2U6JyArIGRjdHgpICsgJzwvZGl2PicsIGl0ZW0pO1xyXG4gICAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gaXRlbWlkO1xyXG4gICAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAnZGVsZXRlJztcclxuICAgICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICB1cmw6IGR0ci5hdHRyKCdkYXRhLXNvdXJjZS11cmwnKSArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHEsXHJcbiAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbignPGRpdj4nICsgZGF0YS5SZXN1bHQgKyAnPC9kaXY+JywgaXRlbSwgbnVsbCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5mYWRlT3V0KCdzbG93JywgZnVuY3Rpb24gKCkgeyBpdGVtLnJlbW92ZSgpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgIG9uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGp4LCBtZXNzYWdlLCBleCkge1xyXG4gICAgICAgICAgICAgICAgb25FcnJvcihqeCwgbWVzc2FnZSwgZXgpO1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UoaXRlbSk7XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBjb21wbGV0ZTogb25Db21wbGV0ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDdXN0b20gZXZlbnRcclxuICAgICAgICAgIGNydWRsLnRyaWdnZXIoaW5zdGFuY2Uuc2V0dGluZ3MuZXZlbnRzWydkZWxldGUnXSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBmaW5pc2hFZGl0KCkge1xyXG4gICAgICAgICAgZnVuY3Rpb24gb25jb21wbGV0ZShhbm90aGVyT25Db21wbGV0ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIC8vIFNob3cgYWdhaW4gdGhlIFZpZXdlclxyXG4gICAgICAgICAgICAgIC8vdndyLnNsaWRlRG93bignc2xvdycpO1xyXG4gICAgICAgICAgICAgIGlmICghdndyLmlzKCc6dmlzaWJsZScpKVxyXG4gICAgICAgICAgICAgICAgdndyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctdmlld2VyJ10pO1xyXG4gICAgICAgICAgICAgIC8vIE1hcmsgdGhlIGZvcm0gYXMgdW5jaGFuZ2VkIHRvIGF2b2lkIHBlcnNpc3Rpbmcgd2FybmluZ3NcclxuICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcbiAgICAgICAgICAgICAgLy8gQXZvaWQgY2FjaGVkIGNvbnRlbnQgb24gdGhlIEVkaXRvclxyXG4gICAgICAgICAgICAgIGR0ci5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBTY3JvbGwgdG8gcHJlc2VydmUgY29ycmVjdCBmb2N1cyAob24gbGFyZ2UgcGFnZXMgd2l0aCBzaGFyZWQgY29udGVudCB1c2VyIGNhbiBnZXRcclxuICAgICAgICAgICAgICAvLyBsb3N0IGFmdGVyIGFuIGVkaXRpb24pXHJcbiAgICAgICAgICAgICAgLy8gKHdlIHF1ZXVlIGFmdGVyIHZ3ci54c2hvdyBiZWNhdXNlIHdlIG5lZWQgdG8gZG8gaXQgYWZ0ZXIgdGhlIHhzaG93IGZpbmlzaClcclxuICAgICAgICAgICAgICB2d3IucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzQ2xvc2VzdCA9IGdldERhdGFGb3JFbGVtZW50U2V0dGluZyhpbnN0YW5jZSwgY3J1ZGwsICdmb2N1cy1jbG9zZXN0Jyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZm9jdXNFbGVtZW50ID0gY3J1ZGwuY2xvc2VzdChmb2N1c0Nsb3Nlc3QpO1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gY2xvc2VzdCwgZ2V0IHRoZSBjcnVkbFxyXG4gICAgICAgICAgICAgICAgaWYgKGZvY3VzRWxlbWVudC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICAgIGZvY3VzRWxlbWVudCA9IGNydWRsO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzTWFyZ2luID0gZ2V0RGF0YUZvckVsZW1lbnRTZXR0aW5nKGluc3RhbmNlLCBjcnVkbCwgJ2ZvY3VzLW1hcmdpbicpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGZvY3VzRHVyYXRpb24gPSBnZXREYXRhRm9yRWxlbWVudFNldHRpbmcoaW5zdGFuY2UsIGNydWRsLCAnZm9jdXMtZHVyYXRpb24nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhmb2N1c0VsZW1lbnQsIHsgbWFyZ2luVG9wOiBmb2N1c01hcmdpbiwgZHVyYXRpb246IGZvY3VzRHVyYXRpb24gfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdndyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBjYWxsYmFjazpcclxuICAgICAgICAgICAgICBpZiAodHlwZW9mIChhbm90aGVyT25Db21wbGV0ZSkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICBhbm90aGVyT25Db21wbGV0ZS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIFdlIG5lZWQgYSBjdXN0b20gY29tcGxldGUgY2FsbGJhY2ssIGJ1dCB0byBub3QgcmVwbGFjZSB0aGUgdXNlciBjYWxsYmFjaywgd2VcclxuICAgICAgICAgIC8vIGNsb25lIGZpcnN0IHRoZSBzZXR0aW5ncyBhbmQgdGhlbiBhcHBseSBvdXIgY2FsbGJhY2sgdGhhdCBpbnRlcm5hbGx5IHdpbGwgY2FsbFxyXG4gICAgICAgICAgLy8gdGhlIHVzZXIgY2FsbGJhY2sgcHJvcGVybHkgKGlmIGFueSlcclxuICAgICAgICAgIHZhciB3aXRoY2FsbGJhY2sgPSAkLmV4dGVuZCh0cnVlLCB7fSwgaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS1lZGl0b3InXSk7XHJcbiAgICAgICAgICB3aXRoY2FsbGJhY2suY29tcGxldGUgPSBvbmNvbXBsZXRlKHdpdGhjYWxsYmFjay5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAvLyBIaWRpbmcgZWRpdG9yOlxyXG4gICAgICAgICAgZHRyLnhoaWRlKHdpdGhjYWxsYmFjayk7XHJcblxyXG4gICAgICAgICAgLy8gTWFyayBmb3JtIGFzIHNhdmVkIHRvIHJlbW92ZSB0aGUgJ2hhcy1jaGFuZ2VzJyBtYXJrXHJcbiAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcblxyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10pO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGR0clxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLWNhbmNlbCcsIGZpbmlzaEVkaXQpXHJcbiAgICAgICAgLm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgJy5hamF4LWJveCcsIGZpbmlzaEVkaXQpXHJcbiAgICAgICAgLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCAnZm9ybSwgZmllbGRzZXQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCB8fCBkYXRhLkNvZGUgPT0gNSB8fCBkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBTaG93IHZpZXdlciBhbmQgcmVsb2FkIGxpc3Q6XHJcbiAgICAgICAgICAgIHZ3ci5maW5kKCcuY3J1ZGwtbGlzdCcpLnJlbG9hZCh7IGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBBIHNtYWxsIGRlbGF5IHRvIGxldCB1c2VyIHRvIHNlZSB0aGUgbmV3IG1lc3NhZ2Ugb24gYnV0dG9uIGJlZm9yZVxyXG4gICAgICAgICAgLy8gaGlkZSBpdCAoYmVjYXVzZSBpcyBpbnNpZGUgdGhlIGVkaXRvcilcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT0gNSlcclxuICAgICAgICAgICAgc2V0VGltZW91dChmaW5pc2hFZGl0LCAxMDAwKTtcclxuXHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0sZmllbGRzZXQnLCBmdW5jdGlvbiAoamIsIGZvcm0sIGp4KSB7XHJcbiAgICAgICAgICAvLyBFbWl0IHRoZSAnZWRpdG9yLXJlYWR5JyBldmVudCBvbiBlZGl0b3IgSHRtbCBiZWluZyByZXBsYWNlZFxyXG4gICAgICAgICAgLy8gKGZpcnN0IGxvYWQgb3IgbmV4dCBsb2FkcyBiZWNhdXNlIG9mIHNlcnZlci1zaWRlIHZhbGlkYXRpb24gZXJyb3JzKVxyXG4gICAgICAgICAgLy8gdG8gYWxsb3cgbGlzdGVuZXJzIHRvIGRvIGFueSB3b3JrIG92ZXIgaXRzIChuZXcpIERPTSBlbGVtZW50cy5cclxuICAgICAgICAgIC8vIFRoZSBzZWNvbmQgY3VzdG9tIHBhcmFtZXRlciBwYXNzZWQgbWVhbnMgaXMgbWVhbiB0b1xyXG4gICAgICAgICAgLy8gZGlzdGluZ3Vpc2ggdGhlIGZpcnN0IHRpbWUgY29udGVudCBsb2FkIGFuZCBzdWNjZXNzaXZlIHVwZGF0ZXMgKGR1ZSB0byB2YWxpZGF0aW9uIGVycm9ycykuXHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIFtkdHIsIGVkaXRvckluaXRpYWxMb2FkXSk7XHJcblxyXG4gICAgICAgICAgLy8gTmV4dCB0aW1lczpcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNydWRsLmRhdGEoJ19fY3J1ZGxfaW5pdGlhbGl6ZWRfXycsIHRydWUpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBpbnN0YW5jZTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG4iLCIvKipcclxuICBUaGlzIG1vZHVsZSBoYXMgdXRpbGl0aWVzIHRvIGNvbnZlcnQgYSBEYXRlIG9iamVjdCBpbnRvXHJcbiAgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gZm9sbG93aW5nIElTTy04NjAxIHNwZWNpZmljYXRpb24uXHJcbiAgXHJcbiAgSU5DT01QTEVURSBCVVQgVVNFRlVMLlxyXG4gIFxyXG4gIFN0YW5kYXJkIHJlZmVycyB0byBmb3JtYXQgdmFyaWF0aW9uczpcclxuICAtIGJhc2ljOiBtaW5pbXVtIHNlcGFyYXRvcnNcclxuICAtIGV4dGVuZGVkOiBhbGwgc2VwYXJhdG9ycywgbW9yZSByZWFkYWJsZVxyXG4gIEJ5IGRlZmF1bHQsIGFsbCBtZXRob2RzIHByaW50cyB0aGUgYmFzaWMgZm9ybWF0LFxyXG4gIGV4Y2VwdHMgdGhlIHBhcmFtZXRlciAnZXh0ZW5kZWQnIGlzIHNldCB0byB0cnVlXHJcblxyXG4gIFRPRE86XHJcbiAgLSBUWjogYWxsb3cgZm9yIFRpbWUgWm9uZSBzdWZmaXhlcyAocGFyc2UgYWxsb3cgaXQgYW5kIFxyXG4gICAgZGV0ZWN0IFVUQyBidXQgZG8gbm90aGluZyB3aXRoIGFueSB0aW1lIHpvbmUgb2Zmc2V0IGRldGVjdGVkKVxyXG4gIC0gRnJhY3Rpb25zIG9mIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMuZGF0ZVVUQyA9IGZ1bmN0aW9uIGRhdGVVVEMoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgbSA9IChkYXRlLmdldFVUQ01vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICBkID0gZGF0ZS5nZXRVVENEYXRlKCkudG9TdHJpbmcoKSxcclxuICAgICAgeSA9IGRhdGUuZ2V0VVRDRnVsbFllYXIoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG4gIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgZCA9ICcwJyArIGQ7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiB5ICsgJy0nICsgbSArICctJyArIGQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIHkgKyBtICsgZDtcclxufTtcclxuXHJcbmV4cG9ydHMuZGF0ZUxvY2FsID0gZnVuY3Rpb24gZGF0ZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIG0gPSAoZGF0ZS5nZXRNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgZCA9IGRhdGUuZ2V0RGF0ZSgpLnRvU3RyaW5nKCksXHJcbiAgICAgIHkgPSBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG4gIGlmIChkLmxlbmd0aCA9PSAxKVxyXG4gICAgZCA9ICcwJyArIGQ7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiB5ICsgJy0nICsgbSArICctJyArIGQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIHkgKyBtICsgZDtcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzLCBtaW51dGVzIGFuZCBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLnRpbWVMb2NhbCA9IGZ1bmN0aW9uIHRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBzID0gZGF0ZS5nZXRTZWNvbmRzKCkudG9TdHJpbmcoKSxcclxuICAgICAgaG0gPSBleHBvcnRzLnNob3J0VGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKHMubGVuZ3RoID09IDEpXHJcbiAgICBzID0gJzAnICsgcztcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGhtICsgJzonICsgcztcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaG0gKyBzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMsIG1pbnV0ZXMgYW5kIHNlY29uZHMgVVRDXHJcbioqL1xyXG5leHBvcnRzLnRpbWVVVEMgPSBmdW5jdGlvbiB0aW1lVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIHMgPSBkYXRlLmdldFVUQ1NlY29uZHMoKS50b1N0cmluZygpLFxyXG4gICAgICBobSA9IGV4cG9ydHMuc2hvcnRUaW1lVVRDKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKHMubGVuZ3RoID09IDEpXHJcbiAgICBzID0gJzAnICsgcztcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGhtICsgJzonICsgcztcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaG0gKyBzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMgYW5kIG1pbnV0ZXNcclxuKiovXHJcbmV4cG9ydHMuc2hvcnRUaW1lTG9jYWwgPSBmdW5jdGlvbiBzaG9ydFRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBoID0gZGF0ZS5nZXRIb3VycygpLnRvU3RyaW5nKCksXHJcbiAgICAgIG0gPSBkYXRlLmdldE1pbnV0ZXMoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAoaC5sZW5ndGggPT0gMSlcclxuICAgIGggPSAnMCcgKyBoO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBoICsgJzonICsgbTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaCArIG07XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycyBhbmQgbWludXRlcyBVVENcclxuKiovXHJcbmV4cG9ydHMuc2hvcnRUaW1lVVRDID0gZnVuY3Rpb24gc2hvcnRUaW1lVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIGggPSBkYXRlLmdldFVUQ0hvdXJzKCkudG9TdHJpbmcoKSxcclxuICAgICAgbSA9IGRhdGUuZ2V0VVRDTWludXRlcygpLnRvU3RyaW5nKCk7XHJcblxyXG4gIGlmIChoLmxlbmd0aCA9PSAxKVxyXG4gICAgaCA9ICcwJyArIGg7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuXHJcbiAgaWYgKGV4dGVuZGVkKVxyXG4gICAgcmV0dXJuIGggKyAnOicgKyBtO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBoICsgbTtcclxufTtcclxuXHJcbi8qKlxyXG4gIFRPRE86IEhvdXJzLCBtaW51dGVzLCBzZWNvbmRzIGFuZCBmcmFjdGlvbnMgb2Ygc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy5sb25nVGltZUxvY2FsID0gZnVuY3Rpb24gbG9uZ1RpbWVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIC8vVE9ET1xyXG59O1xyXG5cclxuLyoqXHJcbiAgVVRDIERhdGUgYW5kIFRpbWUgc2VwYXJhdGVkIGJ5IFQuXHJcbiAgU3RhbmRhcmQgYWxsb3dzIG9taXQgdGhlIHNlcGFyYXRvciBhcyBleGNlcHRpb25hbCwgYm90aCBwYXJ0cyBhZ3JlZW1lbnQsIGNhc2VzO1xyXG4gIGNhbiBiZSBkb25lIHBhc3NpbmcgdHJ1ZSBhcyBvZiBvbWl0U2VwYXJhdG9yIHBhcmFtZXRlciwgYnkgZGVmYXVsdCBmYWxzZS5cclxuKiovXHJcbmV4cG9ydHMuZGF0ZXRpbWVMb2NhbCA9IGZ1bmN0aW9uIGRhdGV0aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQsIG9taXRTZXBhcmF0b3IpIHtcclxuICB2YXIgZCA9IGV4cG9ydHMuZGF0ZUxvY2FsKGRhdGUsIGV4dGVuZGVkKSxcclxuICAgICAgdCA9IGV4cG9ydHMudGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKG9taXRTZXBhcmF0b3IpXHJcbiAgICByZXR1cm4gZCArIHQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGQgKyAnVCcgKyB0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgTG9jYWwgRGF0ZSBhbmQgVGltZSBzZXBhcmF0ZWQgYnkgVC5cclxuICBTdGFuZGFyZCBhbGxvd3Mgb21pdCB0aGUgc2VwYXJhdG9yIGFzIGV4Y2VwdGlvbmFsLCBib3RoIHBhcnRzIGFncmVlbWVudCwgY2FzZXM7XHJcbiAgY2FuIGJlIGRvbmUgcGFzc2luZyB0cnVlIGFzIG9mIG9taXRTZXBhcmF0b3IgcGFyYW1ldGVyLCBieSBkZWZhdWx0IGZhbHNlLlxyXG4qKi9cclxuZXhwb3J0cy5kYXRldGltZVVUQyA9IGZ1bmN0aW9uIGRhdGV0aW1lVVRDKGRhdGUsIGV4dGVuZGVkLCBvbWl0U2VwYXJhdG9yKSB7XHJcbiAgdmFyIGQgPSBleHBvcnRzLmRhdGVVVEMoZGF0ZSwgZXh0ZW5kZWQpLFxyXG4gICAgICB0ID0gZXhwb3J0cy50aW1lVVRDKGRhdGUsIGV4dGVuZGVkKTtcclxuXHJcbiAgaWYgKG9taXRTZXBhcmF0b3IpXHJcbiAgICByZXR1cm4gZCArIHQ7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGQgKyAnVCcgKyB0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAgUGFyc2UgYSBzdHJpbmcgaW50byBhIERhdGUgb2JqZWN0IGlmIGlzIGEgdmFsaWQgSVNPLTg2MDEgZm9ybWF0LlxyXG4gIFBhcnNlIHNpbmdsZSBkYXRlLCBzaW5nbGUgdGltZSBvciBkYXRlLXRpbWUgZm9ybWF0cy5cclxuICBJTVBPUlRBTlQ6IEl0IGRvZXMgTk9UIGNvbnZlcnQgYmV0d2VlbiB0aGUgZGF0ZXN0ciBUaW1lWm9uZSBhbmQgdGhlXHJcbiAgbG9jYWwgVGltZVpvbmUgKGVpdGhlciBpdCBhbGxvd3MgZGF0ZXN0ciB0byBpbmNsdWRlZCBUaW1lWm9uZSBpbmZvcm1hdGlvbilcclxuICBUT0RPOiBPcHRpb25hbCBUIHNlcGFyYXRvciBpcyBub3QgYWxsb3dlZC5cclxuICBUT0RPOiBNaWxsaXNlY29uZHMvZnJhY3Rpb25zIG9mIHNlY29uZHMgbm90IHN1cHBvcnRlZFxyXG4qKi9cclxuZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uIHBhcnNlKGRhdGVzdHIpIHtcclxuICB2YXIgZHQgPSBkYXRlc3RyLnNwbGl0KCdUJyksXHJcbiAgICBkYXRlID0gZHRbMF0sXHJcbiAgICB0aW1lID0gZHQubGVuZ3RoID09IDIgPyBkdFsxXSA6IG51bGw7XHJcblxyXG4gIGlmIChkdC5sZW5ndGggPiAyKVxyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IGZvcm1hdFwiKTtcclxuXHJcbiAgLy8gQ2hlY2sgaWYgZGF0ZSBjb250YWlucyBhIHRpbWU7XHJcbiAgLy8gYmVjYXVzZSBtYXliZSBkYXRlc3RyIGlzIG9ubHkgdGhlIHRpbWUgcGFydFxyXG4gIGlmICgvOnxeXFxkezQsNn1bXlxcLV0oXFwuXFxkKik/KD86WnxbK1xcLV0uKik/JC8udGVzdChkYXRlKSkge1xyXG4gICAgdGltZSA9IGRhdGU7XHJcbiAgICBkYXRlID0gbnVsbDtcclxuICB9XHJcblxyXG4gIHZhciB5LCBtLCBkLCBoLCBtbSwgcywgdHosIHV0YztcclxuXHJcbiAgaWYgKGRhdGUpIHtcclxuICAgIHZhciBkcGFydHMgPSAvKFxcZHs0fSlcXC0/KFxcZHsyfSlcXC0/KFxcZHsyfSkvLmV4ZWMoZGF0ZSk7XHJcbiAgICBpZiAoIWRwYXJ0cylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IGRhdGUgZm9ybWF0XCIpO1xyXG5cclxuICAgIHkgPSBkcGFydHNbMV07XHJcbiAgICBtID0gZHBhcnRzWzJdO1xyXG4gICAgZCA9IGRwYXJ0c1szXTtcclxuICB9XHJcblxyXG4gIGlmICh0aW1lKSB7XHJcbiAgICB2YXIgdHBhcnRzID0gLyhcXGR7Mn0pOj8oXFxkezJ9KSg/Ojo/KFxcZHsyfSkpPyhafFsrXFwtXS4qKT8vLmV4ZWModGltZSk7XHJcbiAgICBpZiAoIXRwYXJ0cylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIGlucHV0IHRpbWUgZm9ybWF0XCIpO1xyXG5cclxuICAgIGggPSB0cGFydHNbMV07XHJcbiAgICBtbSA9IHRwYXJ0c1syXTtcclxuICAgIHMgPSB0cGFydHMubGVuZ3RoID4gMyA/IHRwYXJ0c1szXSA6IG51bGw7XHJcbiAgICB0eiA9IHRwYXJ0cy5sZW5ndGggPiA0ID8gdHBhcnRzWzRdIDogbnVsbDtcclxuICAgIC8vIERldGVjdHMgaWYgaXMgYSB0aW1lIGluIFVUQzpcclxuICAgIHV0YyA9IC9eWiQvaS50ZXN0KHR6KTtcclxuICB9XHJcblxyXG4gIC8vIFZhciB0byBob2xkIHRoZSBwYXJzZWQgdmFsdWUsIHdlIHN0YXJ0IHdpdGggdG9kYXksXHJcbiAgLy8gdGhhdCB3aWxsIGZpbGwgdGhlIG1pc3NpbmcgcGFydHNcclxuICB2YXIgcGFyc2VkRGF0ZSA9IG5ldyBEYXRlKCk7XHJcblxyXG4gIGlmIChkYXRlKSB7XHJcbiAgICAvLyBVcGRhdGluZyB0aGUgZGF0ZSBvYmplY3Qgd2l0aCBlYWNoIHllYXIsIG1vbnRoIGFuZCBkYXRlL2RheSBkZXRlY3RlZDpcclxuICAgIGlmICh1dGMpXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0VVRDRnVsbFllYXIoeSwgbSwgZCk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0RnVsbFllYXIoeSwgbSwgZCk7XHJcbiAgfVxyXG5cclxuICBpZiAodGltZSkge1xyXG4gICAgaWYgKHV0YylcclxuICAgICAgcGFyc2VkRGF0ZS5zZXRVVENIb3VycyhoLCBtbSwgcyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0SG91cnMoaCwgbW0sIHMpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHBhcnNlZERhdGU7XHJcbn07IiwiLyogRGF0ZSBwaWNrZXIgaW5pdGlhbGl6YXRpb24gYW5kIHVzZVxyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cERhdGVQaWNrZXIoKSB7XHJcbiAgICAvLyBEYXRlIFBpY2tlclxyXG4gICAgJC5kYXRlcGlja2VyLnNldERlZmF1bHRzKCQuZGF0ZXBpY2tlci5yZWdpb25hbFskKCdodG1sJykuYXR0cignbGFuZycpXSk7XHJcbiAgICAkKCcuZGF0ZS1waWNrJywgZG9jdW1lbnQpLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIHNob3dBbmltOiAnYmxpbmQnXHJcbiAgICB9KTtcclxuICAgIGFwcGx5RGF0ZVBpY2tlcigpO1xyXG59XHJcbmZ1bmN0aW9uIGFwcGx5RGF0ZVBpY2tlcihlbGVtZW50KSB7XHJcbiAgICAkKFwiLmRhdGUtcGlja1wiLCBlbGVtZW50IHx8IGRvY3VtZW50KVxyXG4gICAgLy8udmFsKG5ldyBEYXRlKCkuYXNTdHJpbmcoJC5kYXRlcGlja2VyLl9kZWZhdWx0cy5kYXRlRm9ybWF0KSlcclxuICAgIC5kYXRlcGlja2VyKHtcclxuICAgICAgICBzaG93QW5pbTogXCJibGluZFwiXHJcbiAgICB9KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdDogc2V0dXBEYXRlUGlja2VyLFxyXG4gICAgICAgIGFwcGx5OiBhcHBseURhdGVQaWNrZXJcclxuICAgIH07XHJcbiIsIi8qIEZvcm1hdCBhIGRhdGUgYXMgWVlZWS1NTS1ERCBpbiBVVEMgZm9yIHNhdmUgdXNcclxuICAgIHRvIGludGVyY2hhbmdlIHdpdGggb3RoZXIgbW9kdWxlcyBvciBhcHBzLlxyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKSB7XHJcbiAgICB2YXIgbSA9IChkYXRlLmdldFVUQ01vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICAgIGQgPSBkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpO1xyXG4gICAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICAgICAgbSA9ICcwJyArIG07XHJcbiAgICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgICAgICBkID0gJzAnICsgZDtcclxuICAgIHJldHVybiBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKSArICctJyArIG0gKyAnLScgKyBkO1xyXG59OyIsIi8qKiBBbiBpMThuIHV0aWxpdHksIGdldCBhIHRyYW5zbGF0aW9uIHRleHQgYnkgbG9va2luZyBmb3Igc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlIGh0bWxcclxud2l0aCB0aGUgbmFtZSBnaXZlbiBhcyBmaXJzdCBwYXJhbWVudGVyIGFuZCBhcHBseWluZyB0aGUgZ2l2ZW4gdmFsdWVzIG9uIHNlY29uZCBhbmQgXHJcbm90aGVyIHBhcmFtZXRlcnMuXHJcbiAgICBUT0RPOiBSRS1JTVBMRU1FTlQgbm90IHVzaW5nIGpRdWVyeSBuZWxzZSBET00gZWxlbWVudHMsIG9yIGFsbW9zdCBub3QgZWxlbWVudHMgaW5zaWRlIGJvZHlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG5mdW5jdGlvbiBnZXRUZXh0KCkge1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAvLyBHZXQga2V5IGFuZCB0cmFuc2xhdGUgaXRcclxuICAgIHZhciBmb3JtYXR0ZWQgPSBhcmdzWzBdO1xyXG4gICAgdmFyIHRleHQgPSAkKCcjbGNyZXMtJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoZm9ybWF0dGVkKSkudGV4dCgpO1xyXG4gICAgaWYgKHRleHQpXHJcbiAgICAgICAgZm9ybWF0dGVkID0gdGV4dDtcclxuICAgIC8vIEFwcGx5IGZvcm1hdCB0byB0aGUgdGV4dCB3aXRoIGFkZGl0aW9uYWwgcGFyYW1ldGVyc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7JyArIGkgKyAnXFxcXH0nLCAnZ2knKTtcclxuICAgICAgICBmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZShyZWdleHAsIGFyZ3NbaSArIDFdKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmb3JtYXR0ZWQ7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0VGV4dDsiLCIvKiogUmV0dXJucyB0aGUgcGF0aCB0byB0aGUgZ2l2ZW4gZWxlbWVudCBpbiBYUGF0aCBjb252ZW50aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gZ2V0WFBhdGgoZWxlbWVudCkge1xyXG4gICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5pZClcclxuICAgICAgICByZXR1cm4gJy8vKltAaWQ9XCInICsgZWxlbWVudC5pZCArICdcIl0nO1xyXG4gICAgdmFyIHhwYXRoID0gJyc7XHJcbiAgICBmb3IgKDsgZWxlbWVudCAmJiBlbGVtZW50Lm5vZGVUeXBlID09IDE7IGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICB2YXIgaWQgPSAkKGVsZW1lbnQucGFyZW50Tm9kZSkuY2hpbGRyZW4oZWxlbWVudC50YWdOYW1lKS5pbmRleChlbGVtZW50KSArIDE7XHJcbiAgICAgICAgaWQgPSAoaWQgPiAxID8gJ1snICsgaWQgKyAnXScgOiAnJyk7XHJcbiAgICAgICAgeHBhdGggPSAnLycgKyBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSArIGlkICsgeHBhdGg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geHBhdGg7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0WFBhdGg7XHJcbiIsIi8vIEl0IGV4ZWN1dGVzIHRoZSBnaXZlbiAncmVhZHknIGZ1bmN0aW9uIGFzIHBhcmFtZXRlciB3aGVuXHJcbi8vIG1hcCBlbnZpcm9ubWVudCBpcyByZWFkeSAod2hlbiBnb29nbGUgbWFwcyBhcGkgYW5kIHNjcmlwdCBpc1xyXG4vLyBsb2FkZWQgYW5kIHJlYWR5IHRvIHVzZSwgb3IgaW5tZWRpYXRlbHkgaWYgaXMgYWxyZWFkeSBsb2FkZWQpLlxyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XHJcblxyXG4vLyBQcml2YXRlIHN0YXRpYyBjb2xsZWN0aW9uIG9mIGNhbGxiYWNrcyByZWdpc3RlcmVkXHJcbnZhciBzdGFjayA9IFtdO1xyXG5cclxudmFyIGdvb2dsZU1hcFJlYWR5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBnb29nbGVNYXBSZWFkeShyZWFkeSkge1xyXG4gIHN0YWNrLnB1c2gocmVhZHkpO1xyXG5cclxuICBpZiAoZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSlcclxuICAgIHJlYWR5KCk7XHJcbiAgZWxzZSBpZiAoIWdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZykge1xyXG4gICAgZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nID0gdHJ1ZTtcclxuICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgc2NyaXB0czogW1wiaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9qc2FwaVwiXSxcclxuICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHsgcmV0dXJuICEhd2luZG93Lmdvb2dsZTsgfSxcclxuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBnb29nbGUubG9hZChcIm1hcHNcIiwgXCIzLjEwXCIsIHsgb3RoZXJfcGFyYW1zOiBcInNlbnNvcj1mYWxzZVwiLCBcImNhbGxiYWNrXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzUmVhZHkgPSB0cnVlO1xyXG4gICAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICBzdGFja1tpXSgpO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cclxuICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFV0aWxpdHkgdG8gZm9yY2UgdGhlIHJlZnJlc2ggb2YgbWFwcyB0aGF0IHNvbHZlIHRoZSBwcm9ibGVtIHdpdGggYmFkLXNpemVkIG1hcCBhcmVhXHJcbmdvb2dsZU1hcFJlYWR5LnJlZnJlc2hNYXAgPSBmdW5jdGlvbiByZWZyZXNoTWFwcyhtYXApIHtcclxuICBnb29nbGVNYXBSZWFkeShmdW5jdGlvbiAoKSB7XHJcbiAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyKG1hcCwgXCJyZXNpemVcIik7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qIEdVSUQgR2VuZXJhdG9yXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGd1aWRHZW5lcmF0b3IoKSB7XHJcbiAgICB2YXIgUzQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDApIHwgMCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gKFM0KCkgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgXCItXCIgKyBTNCgpICsgUzQoKSArIFM0KCkpO1xyXG59OyIsIi8qKlxyXG4gICAgR2VuZXJpYyBzY3JpcHQgZm9yIGZpZWxkc2V0cyB3aXRoIGNsYXNzIC5oYXMtY29uZmlybSwgYWxsb3dpbmcgc2hvd1xyXG4gICAgdGhlIGNvbnRlbnQgb25seSBpZiB0aGUgbWFpbiBjb25maXJtIGZpZWxkcyBoYXZlICd5ZXMnIHNlbGVjdGVkLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBkZWZhdWx0U2VsZWN0b3IgPSAnZmllbGRzZXQuaGFzLWNvbmZpcm0gPiAuY29uZmlybSBpbnB1dCc7XHJcblxyXG5mdW5jdGlvbiBvbmNoYW5nZSgpIHtcclxuICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgIHZhciBmcyA9IHQuY2xvc2VzdCgnZmllbGRzZXQnKTtcclxuICAgIGlmICh0LmlzKCc6Y2hlY2tlZCcpKVxyXG4gICAgICAgIGlmICh0LnZhbCgpID09ICd5ZXMnIHx8IHQudmFsKCkgPT0gJ1RydWUnKVxyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcygnY29uZmlybWVkLW5vJykuYWRkQ2xhc3MoJ2NvbmZpcm1lZC15ZXMnKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKCdjb25maXJtZWQteWVzJykuYWRkQ2xhc3MoJ2NvbmZpcm1lZC1ubycpO1xyXG59XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IGRlZmF1bHRTZWxlY3RvcjtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgc2VsZWN0b3IsIG9uY2hhbmdlKTtcclxuICAgIC8vIFBlcmZvcm1zIGZpcnN0IGNoZWNrOlxyXG4gICAgJChzZWxlY3RvcikuY2hhbmdlKCk7XHJcbn07XHJcblxyXG5leHBvcnRzLm9mZiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBkZWZhdWx0U2VsZWN0b3I7XHJcblxyXG4gICAgJChkb2N1bWVudCkub2ZmKCdjaGFuZ2UnLCBzZWxlY3Rvcik7XHJcbn07IiwiLyogSW50ZXJuYXppb25hbGl6YXRpb24gVXRpbGl0aWVzXHJcbiAqL1xyXG52YXIgaTE4biA9IHt9O1xyXG5pMThuLmRpc3RhbmNlVW5pdHMgPSB7XHJcbiAgICAnRVMnOiAna20nLFxyXG4gICAgJ1VTJzogJ21pbGVzJ1xyXG59O1xyXG5pMThuLm51bWVyaWNNaWxlc1NlcGFyYXRvciA9IHtcclxuICAgICdlcy1FUyc6ICcuJyxcclxuICAgICdlcy1VUyc6ICcuJyxcclxuICAgICdlbi1VUyc6ICcsJyxcclxuICAgICdlbi1FUyc6ICcsJ1xyXG59O1xyXG5pMThuLm51bWVyaWNEZWNpbWFsU2VwYXJhdG9yID0ge1xyXG4gICAgJ2VzLUVTJzogJywnLFxyXG4gICAgJ2VzLVVTJzogJywnLFxyXG4gICAgJ2VuLVVTJzogJy4nLFxyXG4gICAgJ2VuLUVTJzogJy4nXHJcbn07XHJcbmkxOG4ubW9uZXlTeW1ib2xQcmVmaXggPSB7XHJcbiAgICAnRVMnOiAnJyxcclxuICAgICdVUyc6ICckJ1xyXG59O1xyXG5pMThuLm1vbmV5U3ltYm9sU3VmaXggPSB7XHJcbiAgICAnRVMnOiAn4oKsJyxcclxuICAgICdVUyc6ICcnXHJcbn07XHJcbmkxOG4uZ2V0Q3VycmVudEN1bHR1cmUgPSBmdW5jdGlvbiBnZXRDdXJyZW50Q3VsdHVyZSgpIHtcclxuICAgIHZhciBjID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1jdWx0dXJlJyk7XHJcbiAgICB2YXIgcyA9IGMuc3BsaXQoJy0nKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgY3VsdHVyZTogYyxcclxuICAgICAgICBsYW5ndWFnZTogc1swXSxcclxuICAgICAgICBjb3VudHJ5OiBzWzFdXHJcbiAgICB9O1xyXG59O1xyXG5pMThuLmNvbnZlcnRNaWxlc0ttID0gZnVuY3Rpb24gY29udmVydE1pbGVzS20ocSwgdW5pdCkge1xyXG4gICAgdmFyIE1JTEVTX1RPX0tNID0gMS42MDk7XHJcbiAgICBpZiAodW5pdCA9PSAnbWlsZXMnKVxyXG4gICAgICAgIHJldHVybiBNSUxFU19UT19LTSAqIHE7XHJcbiAgICBlbHNlIGlmICh1bml0ID09ICdrbScpXHJcbiAgICAgICAgcmV0dXJuIHEgLyBNSUxFU19UT19LTTtcclxuICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUubG9nKSBjb25zb2xlLmxvZygnY29udmVydE1pbGVzS206IFVucmVjb2duaXplZCB1bml0ICcgKyB1bml0KTtcclxuICAgIHJldHVybiAwO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBpMThuOyIsIi8qIFJldHVybnMgdHJ1ZSB3aGVuIHN0ciBpc1xyXG4tIG51bGxcclxuLSBlbXB0eSBzdHJpbmdcclxuLSBvbmx5IHdoaXRlIHNwYWNlcyBzdHJpbmdcclxuKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0VtcHR5U3RyaW5nKHN0cikge1xyXG4gICAgcmV0dXJuICEoL1xcUy9nLnRlc3Qoc3RyIHx8IFwiXCIpKTtcclxufTsiLCIvKiogQXMgdGhlICdpcycgalF1ZXJ5IG1ldGhvZCwgYnV0IGNoZWNraW5nIEBzZWxlY3RvciBpbiBhbGwgZWxlbWVudHNcclxuKiBAbW9kaWZpZXIgdmFsdWVzOlxyXG4qIC0gJ2FsbCc6IGFsbCBlbGVtZW50cyBtdXN0IG1hdGNoIHNlbGVjdG9yIHRvIHJldHVybiB0cnVlXHJcbiogLSAnYWxtb3N0LW9uZSc6IGFsbW9zdCBvbmUgZWxlbWVudCBtdXN0IG1hdGNoXHJcbiogLSAncGVyY2VudGFnZSc6IHJldHVybnMgcGVyY2VudGFnZSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtYXRjaCBzZWxlY3RvciAoMC0xMDApXHJcbiogLSAnc3VtbWFyeSc6IHJldHVybnMgdGhlIG9iamVjdCB7IHllczogbnVtYmVyLCBubzogbnVtYmVyLCBwZXJjZW50YWdlOiBudW1iZXIsIHRvdGFsOiBudW1iZXIgfVxyXG4qIC0ge2p1c3Q6IGEgbnVtYmVyfTogZXhhY3QgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qIC0ge2FsbW9zdDogYSBudW1iZXJ9OiBtaW5pbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiAtIHt1bnRpbDogYSBudW1iZXJ9OiBtYXhpbXVtIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmFyZSA9IGZ1bmN0aW9uIChzZWxlY3RvciwgbW9kaWZpZXIpIHtcclxuICAgIG1vZGlmaWVyID0gbW9kaWZpZXIgfHwgJ2FsbCc7XHJcbiAgICB2YXIgY291bnQgPSAwO1xyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5pcyhzZWxlY3RvcikpXHJcbiAgICAgICAgICAgIGNvdW50Kys7XHJcbiAgICB9KTtcclxuICAgIHN3aXRjaCAobW9kaWZpZXIpIHtcclxuICAgICAgICBjYXNlICdhbGwnOlxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sZW5ndGggPT0gY291bnQ7XHJcbiAgICAgICAgY2FzZSAnYWxtb3N0LW9uZSc6XHJcbiAgICAgICAgICAgIHJldHVybiBjb3VudCA+IDA7XHJcbiAgICAgICAgY2FzZSAncGVyY2VudGFnZSc6XHJcbiAgICAgICAgICAgIHJldHVybiBjb3VudCAvIHRoaXMubGVuZ3RoO1xyXG4gICAgICAgIGNhc2UgJ3N1bW1hcnknOlxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgeWVzOiBjb3VudCxcclxuICAgICAgICAgICAgICAgIG5vOiB0aGlzLmxlbmd0aCAtIGNvdW50LFxyXG4gICAgICAgICAgICAgICAgcGVyY2VudGFnZTogY291bnQgLyB0aGlzLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIHRvdGFsOiB0aGlzLmxlbmd0aFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICgnanVzdCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLmp1c3QgIT0gY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCdhbG1vc3QnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci5hbG1vc3QgPiBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ3VudGlsJyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIudW50aWwgPCBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgfVxyXG59OyIsIi8qKiA9PT09PT09PT09PT09PT09PT09XHJcbkV4dGVuc2lvbiBqcXVlcnk6ICdib3VuZHMnXHJcblJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGNvbWJpbmVkIGJvdW5kcyBmb3IgYWxsIFxyXG5lbGVtZW50cyBpbiB0aGUgY29sbGVjdGlvblxyXG4qL1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gIGpRdWVyeS5mbi5ib3VuZHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XHJcbiAgICAgIGluY2x1ZGVCb3JkZXI6IGZhbHNlLFxyXG4gICAgICBpbmNsdWRlTWFyZ2luOiBmYWxzZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICB2YXIgYm91bmRzID0ge1xyXG4gICAgICBsZWZ0OiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXHJcbiAgICAgIHRvcDogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxyXG4gICAgICByaWdodDogTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLFxyXG4gICAgICBib3R0b206IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcclxuICAgICAgd2lkdGg6IE51bWJlci5OYU4sXHJcbiAgICAgIGhlaWdodDogTnVtYmVyLk5hTlxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZm5XaWR0aCA9IG9wdGlvbnMuaW5jbHVkZUJvcmRlciB8fCBvcHRpb25zLmluY2x1ZGVNYXJnaW4gPyBcclxuICAgICAgZnVuY3Rpb24oZWwpeyByZXR1cm4gJC5mbi5vdXRlcldpZHRoLmNhbGwoZWwsIG9wdGlvbnMuaW5jbHVkZU1hcmdpbik7IH0gOlxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLndpZHRoLmNhbGwoZWwpOyB9O1xyXG4gICAgdmFyIGZuSGVpZ2h0ID0gb3B0aW9ucy5pbmNsdWRlQm9yZGVyIHx8IG9wdGlvbnMuaW5jbHVkZU1hcmdpbiA/IFxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLm91dGVySGVpZ2h0LmNhbGwoZWwsIG9wdGlvbnMuaW5jbHVkZU1hcmdpbik7IH0gOlxyXG4gICAgICBmdW5jdGlvbihlbCl7IHJldHVybiAkLmZuLmhlaWdodC5jYWxsKGVsKTsgfTtcclxuXHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKGksIGVsKSB7XHJcbiAgICAgIHZhciBlbFEgPSAkKGVsKTtcclxuICAgICAgdmFyIG9mZiA9IGVsUS5vZmZzZXQoKTtcclxuICAgICAgb2ZmLnJpZ2h0ID0gb2ZmLmxlZnQgKyBmbldpZHRoKCQoZWxRKSk7XHJcbiAgICAgIG9mZi5ib3R0b20gPSBvZmYudG9wICsgZm5IZWlnaHQoJChlbFEpKTtcclxuXHJcbiAgICAgIGlmIChvZmYubGVmdCA8IGJvdW5kcy5sZWZ0KVxyXG4gICAgICAgIGJvdW5kcy5sZWZ0ID0gb2ZmLmxlZnQ7XHJcblxyXG4gICAgICBpZiAob2ZmLnRvcCA8IGJvdW5kcy50b3ApXHJcbiAgICAgICAgYm91bmRzLnRvcCA9IG9mZi50b3A7XHJcblxyXG4gICAgICBpZiAob2ZmLnJpZ2h0ID4gYm91bmRzLnJpZ2h0KVxyXG4gICAgICAgIGJvdW5kcy5yaWdodCA9IG9mZi5yaWdodDtcclxuXHJcbiAgICAgIGlmIChvZmYuYm90dG9tID4gYm91bmRzLmJvdHRvbSlcclxuICAgICAgICBib3VuZHMuYm90dG9tID0gb2ZmLmJvdHRvbTtcclxuICAgIH0pO1xyXG5cclxuICAgIGJvdW5kcy53aWR0aCA9IGJvdW5kcy5yaWdodCAtIGJvdW5kcy5sZWZ0O1xyXG4gICAgYm91bmRzLmhlaWdodCA9IGJvdW5kcy5ib3R0b20gLSBib3VuZHMudG9wO1xyXG4gICAgcmV0dXJuIGJvdW5kcztcclxuICB9O1xyXG59KSgpOyIsIi8qKlxyXG4qIEhhc1Njcm9sbEJhciByZXR1cm5zIGFuIG9iamVjdCB3aXRoIGJvb2wgcHJvcGVydGllcyAndmVydGljYWwnIGFuZCAnaG9yaXpvbnRhbCdcclxuKiBzYXlpbmcgaWYgdGhlIGVsZW1lbnQgaGFzIG5lZWQgb2Ygc2Nyb2xsYmFycyBmb3IgZWFjaCBkaW1lbnNpb24gb3Igbm90IChlbGVtZW50XHJcbiogY2FuIG5lZWQgc2Nyb2xsYmFycyBhbmQgc3RpbGwgbm90IGJlaW5nIHNob3dlZCBiZWNhdXNlIHRoZSBjc3Mtb3ZlcmxmbG93IHByb3BlcnR5XHJcbiogYmVpbmcgc2V0IGFzICdoaWRkZW4nLCBidXQgc3RpbGwgd2Uga25vdyB0aGF0IHRoZSBlbGVtZW50IHJlcXVpcmVzIGl0IGFuZCBpdHNcclxuKiBjb250ZW50IGlzIG5vdCBiZWluZyBmdWxseSBkaXNwbGF5ZWQpLlxyXG4qIEBleHRyYWdhcCwgZGVmYXVsdHMgdG8ge3g6MCx5OjB9LCBsZXRzIHNwZWNpZnkgYW4gZXh0cmEgc2l6ZSBpbiBwaXhlbHMgZm9yIGVhY2ggZGltZW5zaW9uIHRoYXQgYWx0ZXIgdGhlIHJlYWwgY2hlY2ssXHJcbiogcmVzdWx0aW5nIGluIGEgZmFrZSByZXN1bHQgdGhhdCBjYW4gYmUgaW50ZXJlc3RpbmcgdG8gZGlzY2FyZCBzb21lIHBpeGVscyBvZiBleGNlc3NcclxuKiBzaXplIChuZWdhdGl2ZSB2YWx1ZXMpIG9yIGV4YWdlcmF0ZSB0aGUgcmVhbCB1c2VkIHNpemUgd2l0aCB0aGF0IGV4dHJhIHBpeGVscyAocG9zaXRpdmUgdmFsdWVzKS5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmhhc1Njcm9sbEJhciA9IGZ1bmN0aW9uIChleHRyYWdhcCkge1xyXG4gICAgZXh0cmFnYXAgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgeDogMCxcclxuICAgICAgICB5OiAwXHJcbiAgICB9LCBleHRyYWdhcCk7XHJcbiAgICBpZiAoIXRoaXMgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiB7IHZlcnRpY2FsOiBmYWxzZSwgaG9yaXpvbnRhbDogZmFsc2UgfTtcclxuICAgIC8vbm90ZTogY2xpZW50SGVpZ2h0PSBoZWlnaHQgb2YgaG9sZGVyXHJcbiAgICAvL3Njcm9sbEhlaWdodD0gd2UgaGF2ZSBjb250ZW50IHRpbGwgdGhpcyBoZWlnaHRcclxuICAgIHZhciB0ID0gdGhpcy5nZXQoMCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHZlcnRpY2FsOiB0aGlzLm91dGVySGVpZ2h0KGZhbHNlKSA8ICh0LnNjcm9sbEhlaWdodCArIGV4dHJhZ2FwLnkpLFxyXG4gICAgICAgIGhvcml6b250YWw6IHRoaXMub3V0ZXJXaWR0aChmYWxzZSkgPCAodC5zY3JvbGxXaWR0aCArIGV4dHJhZ2FwLngpXHJcbiAgICB9O1xyXG59OyIsIi8qKiBDaGVja3MgaWYgY3VycmVudCBlbGVtZW50IG9yIG9uZSBvZiB0aGUgY3VycmVudCBzZXQgb2YgZWxlbWVudHMgaGFzXHJcbmEgcGFyZW50IHRoYXQgbWF0Y2ggdGhlIGVsZW1lbnQgb3IgZXhwcmVzc2lvbiBnaXZlbiBhcyBmaXJzdCBwYXJhbWV0ZXJcclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLmlzQ2hpbGRPZiA9IGZ1bmN0aW9uIGpRdWVyeV9wbHVnaW5faXNDaGlsZE9mKGV4cCkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50cygpLmZpbHRlcihleHApLmxlbmd0aCA+IDA7XHJcbn07IiwiLyoqXHJcbiAgICBHZXRzIHRoZSBodG1sIHN0cmluZyBvZiB0aGUgZmlyc3QgZWxlbWVudCBhbmQgYWxsIGl0cyBjb250ZW50LlxyXG4gICAgVGhlICdodG1sJyBtZXRob2Qgb25seSByZXRyaWV2ZXMgdGhlIGh0bWwgc3RyaW5nIG9mIHRoZSBjb250ZW50LCBub3QgdGhlIGVsZW1lbnQgaXRzZWxmLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4ub3V0ZXJIdG1sID0gZnVuY3Rpb24gKCkge1xyXG4gICAgaWYgKCF0aGlzIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gJyc7XHJcbiAgICB2YXIgZWwgPSB0aGlzLmdldCgwKTtcclxuICAgIHZhciBodG1sID0gJyc7XHJcbiAgICBpZiAoZWwub3V0ZXJIVE1MKVxyXG4gICAgICAgIGh0bWwgPSBlbC5vdXRlckhUTUw7XHJcbiAgICBlbHNlIHtcclxuICAgICAgICBodG1sID0gdGhpcy53cmFwQWxsKCc8ZGl2PjwvZGl2PicpLnBhcmVudCgpLmh0bWwoKTtcclxuICAgICAgICB0aGlzLnVud3JhcCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGh0bWw7XHJcbn07IiwiLyoqXHJcbiAgICBVc2luZyB0aGUgYXR0cmlidXRlIGRhdGEtc291cmNlLXVybCBvbiBhbnkgSFRNTCBlbGVtZW50LFxyXG4gICAgdGhpcyBhbGxvd3MgcmVsb2FkIGl0cyBjb250ZW50IHBlcmZvcm1pbmcgYW4gQUpBWCBvcGVyYXRpb25cclxuICAgIG9uIHRoZSBnaXZlbiBVUkwgb3IgdGhlIG9uZSBpbiB0aGUgYXR0cmlidXRlOyB0aGUgZW5kLXBvaW50XHJcbiAgICBtdXN0IHJldHVybiB0ZXh0L2h0bWwgY29udGVudC5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vLyBEZWZhdWx0IHN1Y2Nlc3MgY2FsbGJhY2sgYW5kIHB1YmxpYyB1dGlsaXR5LCBiYXNpYyBob3ctdG8gcmVwbGFjZSBlbGVtZW50IGNvbnRlbnQgd2l0aCBmZXRjaGVkIGh0bWxcclxuZnVuY3Rpb24gdXBkYXRlRWxlbWVudChodG1sQ29udGVudCwgY29udGV4dCkge1xyXG4gICAgY29udGV4dCA9ICQuaXNQbGFpbk9iamVjdChjb250ZXh0KSAmJiBjb250ZXh0ID8gY29udGV4dCA6IHRoaXM7XHJcblxyXG4gICAgLy8gY3JlYXRlIGpRdWVyeSBvYmplY3Qgd2l0aCB0aGUgSFRNTFxyXG4gICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAvLyBBdm9pZCBlbXB0eSBkb2N1bWVudHMgYmVpbmcgcGFyc2VkIChyYWlzZSBlcnJvcilcclxuICAgIGh0bWxDb250ZW50ID0gJC50cmltKGh0bWxDb250ZW50KTtcclxuICAgIGlmIChodG1sQ29udGVudCkge1xyXG4gICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYW4gZW1wdHkgZG9jdW1lbnQgb3IgbWFsZm9ybWVkIGlzIHJldHVybmVkOlxyXG4gICAgICB0cnkge1xyXG4gICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGh0bWxDb250ZW50KSk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgbmV3aHRtbCA9ICQoaHRtbENvbnRlbnQpO1xyXG4gICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgZWxlbWVudCA9IGNvbnRleHQuZWxlbWVudDtcclxuICAgIGlmIChjb250ZXh0Lm9wdGlvbnMubW9kZSA9PSAncmVwbGFjZS1tZScpXHJcbiAgICAgICAgZWxlbWVudC5yZXBsYWNlV2l0aChuZXdodG1sKTtcclxuICAgIGVsc2UgLy8gJ3JlcGxhY2UtY29udGVudCdcclxuICAgICAgICBlbGVtZW50Lmh0bWwobmV3aHRtbCk7XHJcblxyXG4gICAgcmV0dXJuIGNvbnRleHQ7XHJcbn1cclxuXHJcbi8vIERlZmF1bHQgY29tcGxldGUgY2FsbGJhY2sgYW5kIHB1YmxpYyB1dGlsaXR5XHJcbmZ1bmN0aW9uIHN0b3BMb2FkaW5nU3Bpbm5lcigpIHtcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLmxvYWRpbmdUaW1lcik7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh0aGlzLmVsZW1lbnQpO1xyXG59XHJcblxyXG4vLyBEZWZhdWx0c1xyXG52YXIgZGVmYXVsdHMgPSB7XHJcbiAgICB1cmw6IG51bGwsXHJcbiAgICBzdWNjZXNzOiBbdXBkYXRlRWxlbWVudF0sXHJcbiAgICBlcnJvcjogW10sXHJcbiAgICBjb21wbGV0ZTogW3N0b3BMb2FkaW5nU3Bpbm5lcl0sXHJcbiAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICBtb2RlOiAncmVwbGFjZS1jb250ZW50JyxcclxuICAgIGxvYWRpbmc6IHtcclxuICAgICAgICBsb2NrRWxlbWVudDogdHJ1ZSxcclxuICAgICAgICBsb2NrT3B0aW9uczoge30sXHJcbiAgICAgICAgbWVzc2FnZTogbnVsbCxcclxuICAgICAgICBzaG93TG9hZGluZ0luZGljYXRvcjogdHJ1ZSxcclxuICAgICAgICBkZWxheTogMFxyXG4gICAgfVxyXG59O1xyXG5cclxuLyogUmVsb2FkIG1ldGhvZCAqL1xyXG52YXIgcmVsb2FkID0gJC5mbi5yZWxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBPcHRpb25zIGZyb20gZGVmYXVsdHMgKGludGVybmFsIGFuZCBwdWJsaWMpXHJcbiAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgcmVsb2FkLmRlZmF1bHRzKTtcclxuICAgIC8vIElmIG9wdGlvbnMgb2JqZWN0IGlzIHBhc3NlZCBhcyB1bmlxdWUgcGFyYW1ldGVyXHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxICYmICQuaXNQbGFpbk9iamVjdChhcmd1bWVudHNbMF0pKSB7XHJcbiAgICAgICAgLy8gTWVyZ2Ugb3B0aW9uczpcclxuICAgICAgICAkLmV4dGVuZCh0cnVlLCBvcHRpb25zLCBhcmd1bWVudHNbMF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDb21tb24gb3ZlcmxvYWQ6IG5ldy11cmwgYW5kIGNvbXBsZXRlIGNhbGxiYWNrLCBib3RoIG9wdGlvbmFsc1xyXG4gICAgICAgIG9wdGlvbnMudXJsID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgPyBhcmd1bWVudHNbMF0gOiBudWxsO1xyXG4gICAgICAgIG9wdGlvbnMuY29tcGxldGUgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IGFyZ3VtZW50c1sxXSA6IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICBpZiAob3B0aW9ucy51cmwpIHtcclxuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihvcHRpb25zLnVybCkpXHJcbiAgICAgICAgICAgIC8vIEZ1bmN0aW9uIHBhcmFtczogY3VycmVudFJlbG9hZFVybCwgZGVmYXVsdFJlbG9hZFVybFxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnc291cmNlLXVybCcsICQucHJveHkob3B0aW9ucy51cmwsIHRoaXMpKCR0LmRhdGEoJ3NvdXJjZS11cmwnKSwgJHQuYXR0cignZGF0YS1zb3VyY2UtdXJsJykpKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnc291cmNlLXVybCcsIG9wdGlvbnMudXJsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHVybCA9ICR0LmRhdGEoJ3NvdXJjZS11cmwnKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYWxyZWFkeSBiZWluZyByZWxvYWRlZCwgdG8gY2FuY2VsIHByZXZpb3VzIGF0dGVtcHRcclxuICAgICAgICB2YXIganEgPSAkdC5kYXRhKCdpc1JlbG9hZGluZycpO1xyXG4gICAgICAgIGlmIChqcSkge1xyXG4gICAgICAgICAgICBpZiAoanEudXJsID09IHVybClcclxuICAgICAgICAgICAgICAgIC8vIElzIHRoZSBzYW1lIHVybCwgZG8gbm90IGFib3J0IGJlY2F1c2UgaXMgdGhlIHNhbWUgcmVzdWx0IGJlaW5nIHJldHJpZXZlZFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBqcS5hYm9ydCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gT3B0aW9uYWwgZGF0YSBwYXJhbWV0ZXIgJ3JlbG9hZC1tb2RlJyBhY2NlcHRzIHZhbHVlczogXHJcbiAgICAgICAgLy8gLSAncmVwbGFjZS1tZSc6IFVzZSBodG1sIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCByZWxvYWRlZCBlbGVtZW50IChha2E6IHJlcGxhY2VXaXRoKCkpXHJcbiAgICAgICAgLy8gLSAncmVwbGFjZS1jb250ZW50JzogKGRlZmF1bHQpIEh0bWwgcmV0dXJuZWQgcmVwbGFjZSBjdXJyZW50IGVsZW1lbnQgY29udGVudCAoYWthOiBodG1sKCkpXHJcbiAgICAgICAgb3B0aW9ucy5tb2RlID0gJHQuZGF0YSgncmVsb2FkLW1vZGUnKSB8fCBvcHRpb25zLm1vZGU7XHJcblxyXG4gICAgICAgIGlmICh1cmwpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIExvYWRpbmcsIHdpdGggZGVsYXlcclxuICAgICAgICAgICAgdmFyIGxvYWRpbmd0aW1lciA9IG9wdGlvbnMubG9hZGluZy5sb2NrRWxlbWVudCA/XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGluZyBjb250ZW50IHVzaW5nIGEgZmFrZSB0ZW1wIHBhcmVudCBlbGVtZW50IHRvIHByZWxvYWQgaW1hZ2UgYW5kIHRvIGdldCByZWFsIG1lc3NhZ2Ugd2lkdGg6XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvYWRpbmdjb250ZW50ID0gJCgnPGRpdi8+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5tZXNzYWdlID8gJCgnPGRpdiBjbGFzcz1cImxvYWRpbmctbWVzc2FnZVwiLz4nKS5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UpIDogbnVsbClcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5zaG93TG9hZGluZ0luZGljYXRvciA/IG9wdGlvbnMubG9hZGluZy5tZXNzYWdlIDogbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ2NvbnRlbnQuY3NzKHsgcG9zaXRpb246ICdhYnNvbHV0ZScsIGxlZnQ6IC05OTk5OSB9KS5hcHBlbmRUbygnYm9keScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB3ID0gbG9hZGluZ2NvbnRlbnQud2lkdGgoKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nY29udGVudC5kZXRhY2goKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBMb2NraW5nOlxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucy5hdXRvZm9jdXMgPSBvcHRpb25zLmF1dG9mb2N1cztcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMud2lkdGggPSB3O1xyXG4gICAgICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4obG9hZGluZ2NvbnRlbnQuaHRtbCgpLCAkdCwgb3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgPyAnY3VzdG9tLWxvYWRpbmcnIDogJ2xvYWRpbmcnLCBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSwgb3B0aW9ucy5sb2FkaW5nLmRlbGF5KVxyXG4gICAgICAgICAgICAgICAgOiBudWxsO1xyXG5cclxuICAgICAgICAgICAgLy8gUHJlcGFyZSBjb250ZXh0XHJcbiAgICAgICAgICAgIHZhciBjdHggPSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50OiAkdCxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgICAgICBsb2FkaW5nVGltZXI6IGxvYWRpbmd0aW1lclxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgICAgICAgICBqcSA9ICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdHRVQnLFxyXG4gICAgICAgICAgICAgICAgY29udGV4dDogY3R4XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVXJsIGlzIHNldCBpbiB0aGUgcmV0dXJuZWQgYWpheCBvYmplY3QgYmVjYXVzZSBpcyBub3Qgc2V0IGJ5IGFsbCB2ZXJzaW9ucyBvZiBqUXVlcnlcclxuICAgICAgICAgICAganEudXJsID0gdXJsO1xyXG5cclxuICAgICAgICAgICAgLy8gTWFyayBlbGVtZW50IGFzIGlzIGJlaW5nIHJlbG9hZGVkLCB0byBhdm9pZCBtdWx0aXBsZSBhdHRlbXBzIGF0IHNhbWUgdGltZSwgc2F2aW5nXHJcbiAgICAgICAgICAgIC8vIGN1cnJlbnQgYWpheCBvYmplY3QgdG8gYWxsb3cgYmUgY2FuY2VsbGVkXHJcbiAgICAgICAgICAgICR0LmRhdGEoJ2lzUmVsb2FkaW5nJywganEpO1xyXG4gICAgICAgICAgICBqcS5hbHdheXMoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJHQuZGF0YSgnaXNSZWxvYWRpbmcnLCBudWxsKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBDYWxsYmFja3M6IGZpcnN0IGdsb2JhbHMgYW5kIHRoZW4gZnJvbSBvcHRpb25zIGlmIHRoZXkgYXJlIGRpZmZlcmVudFxyXG4gICAgICAgICAgICAvLyBzdWNjZXNzXHJcbiAgICAgICAgICAgIGpxLmRvbmUocmVsb2FkLmRlZmF1bHRzLnN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5zdWNjZXNzICE9IHJlbG9hZC5kZWZhdWx0cy5zdWNjZXNzKVxyXG4gICAgICAgICAgICAgICAganEuZG9uZShvcHRpb25zLnN1Y2Nlc3MpO1xyXG4gICAgICAgICAgICAvLyBlcnJvclxyXG4gICAgICAgICAgICBqcS5mYWlsKHJlbG9hZC5kZWZhdWx0cy5lcnJvcik7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yICE9IHJlbG9hZC5kZWZhdWx0cy5lcnJvcilcclxuICAgICAgICAgICAgICAgIGpxLmZhaWwob3B0aW9ucy5lcnJvcik7XHJcbiAgICAgICAgICAgIC8vIGNvbXBsZXRlXHJcbiAgICAgICAgICAgIGpxLmFsd2F5cyhyZWxvYWQuZGVmYXVsdHMuY29tcGxldGUpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jb21wbGV0ZSAhPSByZWxvYWQuZGVmYXVsdHMuY29tcGxldGUpXHJcbiAgICAgICAgICAgICAgICBqcS5kb25lKG9wdGlvbnMuY29tcGxldGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vLyBQdWJsaWMgZGVmYXVsdHNcclxucmVsb2FkLmRlZmF1bHRzID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzKTtcclxuXHJcbi8vIFB1YmxpYyB1dGlsaXRpZXNcclxucmVsb2FkLnVwZGF0ZUVsZW1lbnQgPSB1cGRhdGVFbGVtZW50O1xyXG5yZWxvYWQuc3RvcExvYWRpbmdTcGlubmVyID0gc3RvcExvYWRpbmdTcGlubmVyO1xyXG5cclxuLy8gTW9kdWxlXHJcbm1vZHVsZS5leHBvcnRzID0gcmVsb2FkOyIsIi8qKiBFeHRlbmRlZCB0b2dnbGUtc2hvdy1oaWRlIGZ1bnRpb25zLlxyXG4gICAgSWFnb1NSTEBnbWFpbC5jb21cclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5XHJcbiAqKi9cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgLyoqIEltcGxlbWVudGF0aW9uOiByZXF1aXJlIGpRdWVyeSBhbmQgcmV0dXJucyBvYmplY3Qgd2l0aCB0aGVcclxuICAgICAgICBwdWJsaWMgbWV0aG9kcy5cclxuICAgICAqKi9cclxuICAgIGZ1bmN0aW9uIHh0c2goalF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyICQgPSBqUXVlcnk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEhpZGUgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ2hpZGUnIGFuZCAnZmFkZU91dCcgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuZmFkZU91dChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuc2xpZGVVcChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ2hpZGUnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuaGlkZShvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4aGlkZScsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAqIFNob3cgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ3Nob3cnIGFuZCAnZmFkZUluJyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAvLyBXZSBwZXJmb3JtcyBhIGZpeCBvbiBzdGFuZGFyZCBqUXVlcnkgZWZmZWN0c1xyXG4gICAgICAgICAgICAvLyB0byBhdm9pZCBhbiBlcnJvciB0aGF0IHByZXZlbnRzIGZyb20gcnVubmluZ1xyXG4gICAgICAgICAgICAvLyBlZmZlY3RzIG9uIGVsZW1lbnRzIHRoYXQgYXJlIGFscmVhZHkgdmlzaWJsZSxcclxuICAgICAgICAgICAgLy8gd2hhdCBsZXRzIHRoZSBwb3NzaWJpbGl0eSBvZiBnZXQgYSBtaWRkbGUtYW5pbWF0ZWRcclxuICAgICAgICAgICAgLy8gZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBXZSBqdXN0IGNoYW5nZSBkaXNwbGF5Om5vbmUsIGZvcmNpbmcgdG8gJ2lzLXZpc2libGUnIHRvXHJcbiAgICAgICAgICAgIC8vIGJlIGZhbHNlIGFuZCB0aGVuIHJ1bm5pbmcgdGhlIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gZmxpY2tlcmluZyBlZmZlY3QsIGJlY2F1c2UgalF1ZXJ5IGp1c3QgcmVzZXRzXHJcbiAgICAgICAgICAgIC8vIGRpc3BsYXkgb24gZWZmZWN0IHN0YXJ0LlxyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZhZGVJbihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zbGlkZURvd24ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdzaG93J1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2hvdyhvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4c2hvdycsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogR2VuZXJpYyB1dGlsaXR5IGZvciBoaWdobHkgY29uZmlndXJhYmxlIGpRdWVyeS50b2dnbGUgd2l0aCBzdXBwb3J0XHJcbiAgICAgICAgICAgIHRvIHNwZWNpZnkgdGhlIHRvZ2dsZSB2YWx1ZSBleHBsaWNpdHkgZm9yIGFueSBraW5kIG9mIGVmZmVjdDoganVzdCBwYXNzIHRydWUgYXMgc2Vjb25kIHBhcmFtZXRlciAndG9nZ2xlJyB0byBzaG93XHJcbiAgICAgICAgICAgIGFuZCBmYWxzZSB0byBoaWRlLiBUb2dnbGUgbXVzdCBiZSBzdHJpY3RseSBhIEJvb2xlYW4gdmFsdWUgdG8gYXZvaWQgYXV0by1kZXRlY3Rpb24uXHJcbiAgICAgICAgICAgIFRvZ2dsZSBwYXJhbWV0ZXIgY2FuIGJlIG9taXR0ZWQgdG8gYXV0by1kZXRlY3QgaXQsIGFuZCBzZWNvbmQgcGFyYW1ldGVyIGNhbiBiZSB0aGUgYW5pbWF0aW9uIG9wdGlvbnMuXHJcbiAgICAgICAgICAgIEFsbCB0aGUgb3RoZXJzIGJlaGF2ZSBleGFjdGx5IGFzIGhpZGVFbGVtZW50IGFuZCBzaG93RWxlbWVudC5cclxuICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiB0b2dnbGVFbGVtZW50KGVsZW1lbnQsIHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgbm90IGEgYm9vbGVhblxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlICE9PSB0cnVlICYmIHRvZ2dsZSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBhbiBvYmplY3QsIHRoZW4gaXMgdGhlIG9wdGlvbnMgYXMgc2Vjb25kIHBhcmFtZXRlclxyXG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdCh0b2dnbGUpKVxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB0b2dnbGU7XHJcbiAgICAgICAgICAgICAgICAvLyBBdXRvLWRldGVjdCB0b2dnbGUsIGl0IGNhbiB2YXJ5IG9uIGFueSBlbGVtZW50IGluIHRoZSBjb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgLy8gdGhlbiBkZXRlY3Rpb24gYW5kIGFjdGlvbiBtdXN0IGJlIGRvbmUgcGVyIGVsZW1lbnQ6XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldXNpbmcgZnVuY3Rpb24sIHdpdGggZXhwbGljaXQgdG9nZ2xlIHZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCAhJCh0aGlzKS5pcygnOnZpc2libGUnKSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlKVxyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvKiogRG8galF1ZXJ5IGludGVncmF0aW9uIGFzIHh0b2dnbGUsIHhzaG93LCB4aGlkZVxyXG4gICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiBwbHVnSW4oalF1ZXJ5KSB7XHJcbiAgICAgICAgICAgIC8qKiB0b2dnbGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeHRvZ2dsZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54dG9nZ2xlID0gZnVuY3Rpb24geHRvZ2dsZSh0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgdG9nZ2xlLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIHNob3dFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54c2hvdyA9IGZ1bmN0aW9uIHhzaG93KG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogaGlkZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54aGlkZSA9IGZ1bmN0aW9uIHhoaWRlKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeHBvcnRpbmc6XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdG9nZ2xlRWxlbWVudDogdG9nZ2xlRWxlbWVudCxcclxuICAgICAgICAgICAgc2hvd0VsZW1lbnQ6IHNob3dFbGVtZW50LFxyXG4gICAgICAgICAgICBoaWRlRWxlbWVudDogaGlkZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHBsdWdJbjogcGx1Z0luXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNb2R1bGVcclxuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCB4dHNoKTtcclxuICAgIH0gZWxzZSBpZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgICAgIHZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHh0c2goalF1ZXJ5KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTm9ybWFsIHNjcmlwdCBsb2FkLCBpZiBqUXVlcnkgaXMgZ2xvYmFsIChhdCB3aW5kb3cpLCBpdHMgZXh0ZW5kZWQgYXV0b21hdGljYWxseSAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cualF1ZXJ5ICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgeHRzaCh3aW5kb3cualF1ZXJ5KS5wbHVnSW4od2luZG93LmpRdWVyeSk7XHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8qIFNvbWUgdXRpbGl0aWVzIGZvciB1c2Ugd2l0aCBqUXVlcnkgb3IgaXRzIGV4cHJlc3Npb25zXHJcbiAgICB0aGF0IGFyZSBub3QgcGx1Z2lucy5cclxuKi9cclxuZnVuY3Rpb24gZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShzdHIpIHtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFsgIzsmLC4rKn5cXCc6XCIhXiRbXFxdKCk9PnxcXC9dKS9nLCAnXFxcXCQxJyk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU6IGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWVcclxuICAgIH07XHJcbiIsIi8qIEFzc2V0cyBsb2FkZXIgd2l0aCBsb2FkaW5nIGNvbmZpcm1hdGlvbiAobWFpbmx5IGZvciBzY3JpcHRzKVxyXG4gICAgYmFzZWQgb24gTW9kZXJuaXpyL3llcG5vcGUgbG9hZGVyLlxyXG4qL1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG5leHBvcnRzLmxvYWQgPSBmdW5jdGlvbiAob3B0cykge1xyXG4gICAgb3B0cyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBzY3JpcHRzOiBbXSxcclxuICAgICAgICBjb21wbGV0ZTogbnVsbCxcclxuICAgICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogbnVsbCxcclxuICAgICAgICBsb2FkRGVsYXk6IDAsXHJcbiAgICAgICAgdHJpYWxzSW50ZXJ2YWw6IDUwMFxyXG4gICAgfSwgb3B0cyk7XHJcbiAgICBpZiAoIW9wdHMuc2NyaXB0cy5sZW5ndGgpIHJldHVybjtcclxuICAgIGZ1bmN0aW9uIHBlcmZvcm1Db21wbGV0ZSgpIHtcclxuICAgICAgICBpZiAodHlwZW9mIChvcHRzLmNvbXBsZXRlVmVyaWZpY2F0aW9uKSAhPT0gJ2Z1bmN0aW9uJyB8fCBvcHRzLmNvbXBsZXRlVmVyaWZpY2F0aW9uKCkpXHJcbiAgICAgICAgICAgIG9wdHMuY29tcGxldGUoKTtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChwZXJmb3JtQ29tcGxldGUsIG9wdHMudHJpYWxzSW50ZXJ2YWwpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLndhcm4pXHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0xDLmxvYWQuY29tcGxldGVWZXJpZmljYXRpb24gZmFpbGVkIGZvciAnICsgb3B0cy5zY3JpcHRzWzBdICsgJyByZXRyeWluZyBpdCBpbiAnICsgb3B0cy50cmlhbHNJbnRlcnZhbCArICdtcycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgICAgICAgTW9kZXJuaXpyLmxvYWQoe1xyXG4gICAgICAgICAgICBsb2FkOiBvcHRzLnNjcmlwdHMsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBvcHRzLmNvbXBsZXRlID8gcGVyZm9ybUNvbXBsZXRlIDogbnVsbFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYgKG9wdHMubG9hZERlbGF5KVxyXG4gICAgICAgIHNldFRpbWVvdXQobG9hZCwgb3B0cy5sb2FkRGVsYXkpO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGxvYWQoKTtcclxufTsiLCIvKi0tLS0tLS0tLS0tLVxyXG5VdGlsaXRpZXMgdG8gbWFuaXB1bGF0ZSBudW1iZXJzLCBhZGRpdGlvbmFsbHlcclxudG8gdGhlIG9uZXMgYXQgTWF0aFxyXG4tLS0tLS0tLS0tLS0qL1xyXG5cclxuLyoqIEVudW1lcmF0aW9uIHRvIGJlIHVzZXMgYnkgZnVuY3Rpb25zIHRoYXQgaW1wbGVtZW50cyAncm91bmRpbmcnIG9wZXJhdGlvbnMgb24gZGlmZmVyZW50XHJcbmRhdGEgdHlwZXMuXHJcbkl0IGhvbGRzIHRoZSBkaWZmZXJlbnQgd2F5cyBhIHJvdW5kaW5nIG9wZXJhdGlvbiBjYW4gYmUgYXBwbHkuXHJcbioqL1xyXG52YXIgcm91bmRpbmdUeXBlRW51bSA9IHtcclxuICAgIERvd246IC0xLFxyXG4gICAgTmVhcmVzdDogMCxcclxuICAgIFVwOiAxXHJcbn07XHJcblxyXG5mdW5jdGlvbiByb3VuZFRvKG51bWJlciwgZGVjaW1hbHMsIHJvdW5kaW5nVHlwZSkge1xyXG4gICAgLy8gY2FzZSBOZWFyZXN0IGlzIHRoZSBkZWZhdWx0OlxyXG4gICAgdmFyIGYgPSBuZWFyZXN0VG87XHJcbiAgICBzd2l0Y2ggKHJvdW5kaW5nVHlwZSkge1xyXG4gICAgICAgIGNhc2Ugcm91bmRpbmdUeXBlRW51bS5Eb3duOlxyXG4gICAgICAgICAgICBmID0gZmxvb3JUbztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSByb3VuZGluZ1R5cGVFbnVtLlVwOlxyXG4gICAgICAgICAgICBmID0gY2VpbFRvO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgIHJldHVybiBmKG51bWJlciwgZGVjaW1hbHMpO1xyXG59XHJcblxyXG4vKiogUm91bmQgYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0IGNhbiBzdWJzdHJhY3QgaW50ZWdlciBkZWNpbWFscyBieSBwcm92aWRpbmcgYSBuZWdhdGl2ZVxyXG5udW1iZXIgb2YgZGVjaW1hbHMuXHJcbioqL1xyXG5mdW5jdGlvbiBuZWFyZXN0VG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyICogdGVucykgLyB0ZW5zO1xyXG59XHJcblxyXG4vKiogUm91bmQgVXAgYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0cyBzaW1pbGFyIHRvIHJvdW5kVG8sIGJ1dCB0aGUgbnVtYmVyIGlzIGV2ZXIgcm91bmRlZCB1cCxcclxudG8gdGhlIGxvd2VyIGludGVnZXIgZ3JlYXRlciBvciBlcXVhbHMgdG8gdGhlIG51bWJlci5cclxuKiovXHJcbmZ1bmN0aW9uIGNlaWxUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5jZWlsKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLyoqIFJvdW5kIERvd24gYSBudW1iZXIgdG8gdGhlIHNwZWNpZmllZCBudW1iZXIgb2YgZGVjaW1hbHMuXHJcbkl0cyBzaW1pbGFyIHRvIHJvdW5kVG8sIGJ1dCB0aGUgbnVtYmVyIGlzIGV2ZXIgcm91bmRlZCBkb3duLFxyXG50byB0aGUgYmlnZ2VyIGludGVnZXIgbG93ZXIgb3IgZXF1YWxzIHRvIHRoZSBudW1iZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBmbG9vclRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLmZsb29yKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIHJvdW5kaW5nVHlwZUVudW06IHJvdW5kaW5nVHlwZUVudW0sXHJcbiAgICAgICAgcm91bmRUbzogcm91bmRUbyxcclxuICAgICAgICBuZWFyZXN0VG86IG5lYXJlc3RUbyxcclxuICAgICAgICBjZWlsVG86IGNlaWxUbyxcclxuICAgICAgICBmbG9vclRvOiBmbG9vclRvXHJcbiAgICB9OyIsImZ1bmN0aW9uIG1vdmVGb2N1c1RvKGVsLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIG1hcmdpblRvcDogMzAsXHJcbiAgICAgICAgZHVyYXRpb246IDUwMFxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbiAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6ICQoZWwpLm9mZnNldCgpLnRvcCAtIG9wdGlvbnMubWFyZ2luVG9wIH0sIG9wdGlvbnMuZHVyYXRpb24sIG51bGwpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbW92ZUZvY3VzVG87XHJcbn0iLCIvKiBTb21lIHV0aWxpdGllcyB0byBmb3JtYXQgYW5kIGV4dHJhY3QgbnVtYmVycywgZnJvbSB0ZXh0IG9yIERPTS5cclxuICovXHJcbnZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGkxOG4gPSByZXF1aXJlKCcuL2kxOG4nKSxcclxuICAgIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbmZ1bmN0aW9uIGdldE1vbmV5TnVtYmVyKHYsIGFsdCkge1xyXG4gICAgYWx0ID0gYWx0IHx8IDA7XHJcbiAgICBpZiAodiBpbnN0YW5jZW9mIGpRdWVyeSlcclxuICAgICAgICB2ID0gdi52YWwoKSB8fCB2LnRleHQoKTtcclxuICAgIHYgPSBwYXJzZUZsb2F0KHZcclxuICAgICAgICAucmVwbGFjZSgvWyTigqxdL2csICcnKVxyXG4gICAgICAgIC5yZXBsYWNlKG5ldyBSZWdFeHAoTEMubnVtZXJpY01pbGVzU2VwYXJhdG9yW2kxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jdWx0dXJlXSwgJ2cnKSwgJycpXHJcbiAgICApO1xyXG4gICAgcmV0dXJuIGlzTmFOKHYpID8gYWx0IDogdjtcclxufVxyXG5mdW5jdGlvbiBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nKHYpIHtcclxuICAgIHZhciBjdWx0dXJlID0gaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSgpLmN1bHR1cmU7XHJcbiAgICAvLyBGaXJzdCwgcm91bmQgdG8gMiBkZWNpbWFsc1xyXG4gICAgdiA9IG11LnJvdW5kVG8odiwgMik7XHJcbiAgICAvLyBHZXQgdGhlIGRlY2ltYWwgcGFydCAocmVzdClcclxuICAgIHZhciByZXN0ID0gTWF0aC5yb3VuZCh2ICogMTAwICUgMTAwKTtcclxuICAgIHJldHVybiAoJycgK1xyXG4gICAgLy8gSW50ZWdlciBwYXJ0IChubyBkZWNpbWFscylcclxuICAgICAgICBNYXRoLmZsb29yKHYpICtcclxuICAgIC8vIERlY2ltYWwgc2VwYXJhdG9yIGRlcGVuZGluZyBvbiBsb2NhbGVcclxuICAgICAgICBpMThuLm51bWVyaWNEZWNpbWFsU2VwYXJhdG9yW2N1bHR1cmVdICtcclxuICAgIC8vIERlY2ltYWxzLCBldmVyIHR3byBkaWdpdHNcclxuICAgICAgICBNYXRoLmZsb29yKHJlc3QgLyAxMCkgKyByZXN0ICUgMTBcclxuICAgICk7XHJcbn1cclxuZnVuY3Rpb24gbnVtYmVyVG9Nb25leVN0cmluZyh2KSB7XHJcbiAgICB2YXIgY291bnRyeSA9IGkxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jb3VudHJ5O1xyXG4gICAgLy8gVHdvIGRpZ2l0cyBpbiBkZWNpbWFscyBmb3Igcm91bmRlZCB2YWx1ZSB3aXRoIG1vbmV5IHN5bWJvbCBhcyBmb3JcclxuICAgIC8vIGN1cnJlbnQgbG9jYWxlXHJcbiAgICByZXR1cm4gKGkxOG4ubW9uZXlTeW1ib2xQcmVmaXhbY291bnRyeV0gKyBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nKHYpICsgaTE4bi5tb25leVN5bWJvbFN1Zml4W2NvdW50cnldKTtcclxufVxyXG5mdW5jdGlvbiBzZXRNb25leU51bWJlcih2LCBlbCkge1xyXG4gICAgLy8gR2V0IHZhbHVlIGluIG1vbmV5IGZvcm1hdDpcclxuICAgIHYgPSBudW1iZXJUb01vbmV5U3RyaW5nKHYpO1xyXG4gICAgLy8gU2V0dGluZyB2YWx1ZTpcclxuICAgIGlmIChlbCBpbnN0YW5jZW9mIGpRdWVyeSlcclxuICAgICAgICBpZiAoZWwuaXMoJzppbnB1dCcpKVxyXG4gICAgICAgICAgICBlbC52YWwodik7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBlbC50ZXh0KHYpO1xyXG4gICAgcmV0dXJuIHY7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGdldE1vbmV5TnVtYmVyOiBnZXRNb25leU51bWJlcixcclxuICAgICAgICBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nOiBudW1iZXJUb1R3b0RlY2ltYWxzU3RyaW5nLFxyXG4gICAgICAgIG51bWJlclRvTW9uZXlTdHJpbmc6IG51bWJlclRvTW9uZXlTdHJpbmcsXHJcbiAgICAgICAgc2V0TW9uZXlOdW1iZXI6IHNldE1vbmV5TnVtYmVyXHJcbiAgICB9OyIsIi8qKlxyXG4qIFBsYWNlaG9sZGVyIHBvbHlmaWxsLlxyXG4qIEFkZHMgYSBuZXcgalF1ZXJ5IHBsYWNlSG9sZGVyIG1ldGhvZCB0byBzZXR1cCBvciByZWFwcGx5IHBsYWNlSG9sZGVyXHJcbiogb24gZWxlbWVudHMgKHJlY29tbWVudGVkIHRvIGJlIGFwcGx5IG9ubHkgdG8gc2VsZWN0b3IgJ1twbGFjZWhvbGRlcl0nKTtcclxuKiB0aGF0cyBtZXRob2QgaXMgZmFrZSBvbiBicm93c2VycyB0aGF0IGhhcyBuYXRpdmUgc3VwcG9ydCBmb3IgcGxhY2Vob2xkZXJcclxuKiovXHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKSxcclxuICAgICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRQbGFjZUhvbGRlcnMoKSB7XHJcbiAgICBpZiAoTW9kZXJuaXpyLmlucHV0LnBsYWNlaG9sZGVyKVxyXG4gICAgICAgICQuZm4ucGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoKSB7IH07XHJcbiAgICBlbHNlXHJcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZnVuY3Rpb24gZG9QbGFjZWhvbGRlcigpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoISR0LmRhdGEoJ3BsYWNlaG9sZGVyLXN1cHBvcnRlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQub24oJ2ZvY3VzaW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlID09IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICR0Lm9uKCdmb2N1c291dCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnZhbHVlLmxlbmd0aClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkdC5kYXRhKCdwbGFjZWhvbGRlci1zdXBwb3J0ZWQnLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHRoaXMuZ2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQuZm4ucGxhY2Vob2xkZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGRvUGxhY2Vob2xkZXIpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAkKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICAgICAgJChkb2N1bWVudCkuYWpheENvbXBsZXRlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KSgpO1xyXG59OyIsIi8qIFBvcHVwIGZ1bmN0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNyZWF0ZUlmcmFtZSA9IHJlcXVpcmUoJy4vY3JlYXRlSWZyYW1lJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxucmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLyoqKioqKioqKioqKioqKioqKipcclxuKiBQb3B1cCByZWxhdGVkIFxyXG4qIGZ1bmN0aW9uc1xyXG4qL1xyXG5mdW5jdGlvbiBwb3B1cFNpemUoc2l6ZSkge1xyXG4gICAgdmFyIHMgPSAoc2l6ZSA9PSAnbGFyZ2UnID8gMC44IDogKHNpemUgPT0gJ21lZGl1bScgPyAwLjUgOiAoc2l6ZSA9PSAnc21hbGwnID8gMC4yIDogc2l6ZSB8fCAwLjUpKSk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHdpZHRoOiBNYXRoLnJvdW5kKCQod2luZG93KS53aWR0aCgpICogcyksXHJcbiAgICAgICAgaGVpZ2h0OiBNYXRoLnJvdW5kKCQod2luZG93KS5oZWlnaHQoKSAqIHMpLFxyXG4gICAgICAgIHNpemVGYWN0b3I6IHNcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gcG9wdXBTdHlsZShzaXplKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGN1cnNvcjogJ2RlZmF1bHQnLFxyXG4gICAgICAgIHdpZHRoOiBzaXplLndpZHRoICsgJ3B4JyxcclxuICAgICAgICBsZWZ0OiBNYXRoLnJvdW5kKCgkKHdpbmRvdykud2lkdGgoKSAtIHNpemUud2lkdGgpIC8gMikgLSAyNSArICdweCcsXHJcbiAgICAgICAgaGVpZ2h0OiBzaXplLmhlaWdodCArICdweCcsXHJcbiAgICAgICAgdG9wOiBNYXRoLnJvdW5kKCgkKHdpbmRvdykuaGVpZ2h0KCkgLSBzaXplLmhlaWdodCkgLyAyKSAtIDMyICsgJ3B4JyxcclxuICAgICAgICBwYWRkaW5nOiAnMzRweCAyNXB4IDMwcHgnLFxyXG4gICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgYm9yZGVyOiAnbm9uZScsXHJcbiAgICAgICAgJy1tb3otYmFja2dyb3VuZC1jbGlwJzogJ3BhZGRpbmcnLFxyXG4gICAgICAgICctd2Via2l0LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nLWJveCcsXHJcbiAgICAgICAgJ2JhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nLWJveCdcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gcG9wdXAodXJsLCBzaXplLCBjb21wbGV0ZSwgbG9hZGluZ1RleHQsIG9wdGlvbnMpIHtcclxuICAgIGlmICh0eXBlb2YgKHVybCkgPT09ICdvYmplY3QnKVxyXG4gICAgICAgIG9wdGlvbnMgPSB1cmw7XHJcblxyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIHVybDogdHlwZW9mICh1cmwpID09PSAnc3RyaW5nJyA/IHVybCA6ICcnLFxyXG4gICAgICAgIHNpemU6IHNpemUgfHwgeyB3aWR0aDogMCwgaGVpZ2h0OiAwIH0sXHJcbiAgICAgICAgY29tcGxldGU6IGNvbXBsZXRlLFxyXG4gICAgICAgIGxvYWRpbmdUZXh0OiBsb2FkaW5nVGV4dCxcclxuICAgICAgICBjbG9zYWJsZToge1xyXG4gICAgICAgICAgICBvbkxvYWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBhZnRlckxvYWQ6IHRydWUsXHJcbiAgICAgICAgICAgIG9uRXJyb3I6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9TaXplOiBmYWxzZSxcclxuICAgICAgICBjb250YWluZXJDbGFzczogJycsXHJcbiAgICAgICAgYXV0b0ZvY3VzOiB0cnVlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAvLyBQcmVwYXJlIHNpemUgYW5kIGxvYWRpbmdcclxuICAgIG9wdGlvbnMubG9hZGluZ1RleHQgPSBvcHRpb25zLmxvYWRpbmdUZXh0IHx8ICcnO1xyXG4gICAgaWYgKHR5cGVvZiAob3B0aW9ucy5zaXplLndpZHRoKSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgb3B0aW9ucy5zaXplID0gcG9wdXBTaXplKG9wdGlvbnMuc2l6ZSk7XHJcblxyXG4gICAgJC5ibG9ja1VJKHtcclxuICAgICAgICBtZXNzYWdlOiAob3B0aW9ucy5jbG9zYWJsZS5vbkxvYWQgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgK1xyXG4gICAgICAgJzxpbWcgc3JjPVwiJyArIExjVXJsLkFwcFBhdGggKyAnaW1nL3RoZW1lL2xvYWRpbmcuZ2lmXCIvPicgKyBvcHRpb25zLmxvYWRpbmdUZXh0LFxyXG4gICAgICAgIGNlbnRlclk6IGZhbHNlLFxyXG4gICAgICAgIGNzczogcG9wdXBTdHlsZShvcHRpb25zLnNpemUpLFxyXG4gICAgICAgIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfSxcclxuICAgICAgICBmb2N1c0lucHV0OiB0cnVlXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMb2FkaW5nIFVybCB3aXRoIEFqYXggYW5kIHBsYWNlIGNvbnRlbnQgaW5zaWRlIHRoZSBibG9ja2VkLWJveFxyXG4gICAgJC5hamF4KHtcclxuICAgICAgICB1cmw6IG9wdGlvbnMudXJsLFxyXG4gICAgICAgIGNvbnRleHQ6IHtcclxuICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgICAgICAgY29udGFpbmVyOiAkKCcuYmxvY2tNc2cnKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyLmFkZENsYXNzKG9wdGlvbnMuY29udGFpbmVyQ2xhc3MpO1xyXG4gICAgICAgICAgICAvLyBBZGQgY2xvc2UgYnV0dG9uIGlmIHJlcXVpcmVzIGl0IG9yIGVtcHR5IG1lc3NhZ2UgY29udGVudCB0byBhcHBlbmQgdGhlbiBtb3JlXHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5odG1sKG9wdGlvbnMuY2xvc2FibGUuYWZ0ZXJMb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpO1xyXG4gICAgICAgICAgICB2YXIgY29udGVudEhvbGRlciA9IGNvbnRhaW5lci5hcHBlbmQoJzxkaXYgY2xhc3M9XCJjb250ZW50XCIvPicpLmNoaWxkcmVuKCcuY29udGVudCcpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZGF0YSkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5Db2RlICYmIGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC51bmJsb2NrVUkoKTtcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCBjb2RlLCBzaG93IHJlc3VsdFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuYXBwZW5kKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFBhZ2UgY29udGVudCBnb3QsIHBhc3RlIGludG8gdGhlIHBvcHVwIGlmIGlzIHBhcnRpYWwgaHRtbCAodXJsIHN0YXJ0cyB3aXRoICQpXHJcbiAgICAgICAgICAgICAgICBpZiAoLygoXlxcJCl8KFxcL1xcJCkpLy50ZXN0KG9wdGlvbnMudXJsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIuYXBwZW5kKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9Gb2N1cylcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEhvbGRlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b1NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXZvaWQgbWlzY2FsY3VsYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcmV2V2lkdGggPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnd2lkdGgnLCAnYXV0bycpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldkhlaWdodCA9IGNvbnRlbnRIb2xkZXJbMF0uc3R5bGUuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2V0IGRhdGFcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbFdpZHRoID0gY29udGVudEhvbGRlclswXS5zY3JvbGxXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbEhlaWdodCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsSGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udFdpZHRoID0gY29udGFpbmVyLndpZHRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250SGVpZ2h0ID0gY29udGFpbmVyLmhlaWdodCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFXaWR0aCA9IGNvbnRhaW5lci5vdXRlcldpZHRoKHRydWUpIC0gY29udFdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFIZWlnaHQgPSBjb250YWluZXIub3V0ZXJIZWlnaHQodHJ1ZSkgLSBjb250SGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGggPSAkKHdpbmRvdykud2lkdGgoKSAtIGV4dHJhV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCkgLSBleHRyYUhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGFuZCBhcHBseVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2l6ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBhY3R1YWxXaWR0aCA+IG1heFdpZHRoID8gbWF4V2lkdGggOiBhY3R1YWxXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogYWN0dWFsSGVpZ2h0ID4gbWF4SGVpZ2h0ID8gbWF4SGVpZ2h0IDogYWN0dWFsSGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hbmltYXRlKHNpemUsIDMwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IG1pc2NhbGN1bGF0aW9ucyBjb3JyZWN0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnd2lkdGgnLCBwcmV2V2lkdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmNzcygnaGVpZ2h0JywgcHJldkhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBFbHNlLCBpZiB1cmwgaXMgYSBmdWxsIGh0bWwgcGFnZSAobm9ybWFsIHBhZ2UpLCBwdXQgY29udGVudCBpbnRvIGFuIGlmcmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpZnJhbWUgPSBjcmVhdGVJZnJhbWUoZGF0YSwgdGhpcy5vcHRpb25zLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmcmFtZS5hdHRyKCdpZCcsICdibG9ja1VJSWZyYW1lJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVwbGFjZSBibG9ja2luZyBlbGVtZW50IGNvbnRlbnQgKHRoZSBsb2FkaW5nKSB3aXRoIHRoZSBpZnJhbWU6XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcuYmxvY2tNc2cnKS5hcHBlbmQoaWZyYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCBlcnJvcjogZnVuY3Rpb24gKGosIHQsIGV4KSB7XHJcbiAgICAgICAgICAgICQoJ2Rpdi5ibG9ja01zZycpLmh0bWwoKG9wdGlvbnMuY2xvc2FibGUub25FcnJvciA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKSArICc8ZGl2IGNsYXNzPVwiY29udGVudFwiPlBhZ2Ugbm90IGZvdW5kPC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuaW5mbykgY29uc29sZS5pbmZvKFwiUG9wdXAtYWpheCBlcnJvcjogXCIgKyBleCk7XHJcbiAgICAgICAgfSwgY29tcGxldGU6IG9wdGlvbnMuY29tcGxldGVcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciByZXR1cm5lZEJsb2NrID0gJCgnLmJsb2NrVUknKTtcclxuXHJcbiAgICByZXR1cm5lZEJsb2NrLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgIHJldHVybmVkQmxvY2sudHJpZ2dlcigncG9wdXAtY2xvc2VkJyk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm5lZEJsb2NrLmNsb3NlUG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRCbG9ja0VsZW1lbnQgPSBmdW5jdGlvbiBnZXRCbG9ja0VsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbHRlcignLmJsb2NrTXNnJyk7IH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldENvbnRlbnRFbGVtZW50ID0gZnVuY3Rpb24gZ2V0Q29udGVudEVsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbmQoJy5jb250ZW50Jyk7IH07XHJcbiAgICByZXR1cm5lZEJsb2NrLmdldE92ZXJsYXlFbGVtZW50ID0gZnVuY3Rpb24gZ2V0T3ZlcmxheUVsZW1lbnQoKSB7IHJldHVybiByZXR1cm5lZEJsb2NrLmZpbHRlcignLmJsb2NrT3ZlcmxheScpOyB9O1xyXG4gICAgcmV0dXJuIHJldHVybmVkQmxvY2s7XHJcbn1cclxuXHJcbi8qIFNvbWUgcG9wdXAgdXRpbGl0aXRlcy9zaG9ydGhhbmRzICovXHJcbmZ1bmN0aW9uIG1lc3NhZ2VQb3B1cChtZXNzYWdlLCBjb250YWluZXIpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8ICdib2R5Jyk7XHJcbiAgICB2YXIgY29udGVudCA9ICQoJzxkaXYvPicpLnRleHQobWVzc2FnZSk7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGNvbnRhaW5lciwgJ21lc3NhZ2UtcG9wdXAgZnVsbC1ibG9jaycsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSwgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29ubmVjdFBvcHVwQWN0aW9uKGFwcGx5VG9TZWxlY3Rvcikge1xyXG4gICAgYXBwbHlUb1NlbGVjdG9yID0gYXBwbHlUb1NlbGVjdG9yIHx8ICcucG9wdXAtYWN0aW9uJztcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsIGFwcGx5VG9TZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjID0gJCgkKHRoaXMpLmF0dHIoJ2hyZWYnKSkuY2xvbmUoKTtcclxuICAgICAgICBpZiAoYy5sZW5ndGggPT0gMSlcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihjLCBkb2N1bWVudCwgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiB0cnVlIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vLyBUaGUgcG9wdXAgZnVuY3Rpb24gY29udGFpbnMgYWxsIHRoZSBvdGhlcnMgYXMgbWV0aG9kc1xyXG5wb3B1cC5zaXplID0gcG9wdXBTaXplO1xyXG5wb3B1cC5zdHlsZSA9IHBvcHVwU3R5bGU7XHJcbnBvcHVwLmNvbm5lY3RBY3Rpb24gPSBjb25uZWN0UG9wdXBBY3Rpb247XHJcbnBvcHVwLm1lc3NhZ2UgPSBtZXNzYWdlUG9wdXA7XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBwb3B1cDsiLCIvKioqKiBQb3N0YWwgQ29kZTogb24gZmx5LCBzZXJ2ZXItc2lkZSB2YWxpZGF0aW9uICoqKioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgYmFzZVVybDogJy8nLFxyXG4gICAgICAgIHNlbGVjdG9yOiAnW2RhdGEtdmFsLXBvc3RhbGNvZGVdJyxcclxuICAgICAgICB1cmw6ICdKU09OL1ZhbGlkYXRlUG9zdGFsQ29kZS8nXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2hhbmdlJywgb3B0aW9ucy5zZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gSWYgY29udGFpbnMgYSB2YWx1ZSAodGhpcyBub3QgdmFsaWRhdGUgaWYgaXMgcmVxdWlyZWQpIGFuZCBcclxuICAgICAgICAvLyBoYXMgdGhlIGVycm9yIGRlc2NyaXB0aXZlIG1lc3NhZ2UsIHZhbGlkYXRlIHRocm91Z2ggYWpheFxyXG4gICAgICAgIHZhciBwYyA9ICR0LnZhbCgpO1xyXG4gICAgICAgIHZhciBtc2cgPSAkdC5kYXRhKCd2YWwtcG9zdGFsY29kZScpO1xyXG4gICAgICAgIGlmIChwYyAmJiBtc2cpIHtcclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogb3B0aW9ucy5iYXNlVXJsICsgb3B0aW9ucy51cmwsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiB7IFBvc3RhbENvZGU6IHBjIH0sXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnSlNPTicsXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuUmVzdWx0LklzVmFsaWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnJlbW92ZUNsYXNzKCdpbnB1dC12YWxpZGF0aW9uLWVycm9yJykuYWRkQ2xhc3MoJ3ZhbGlkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5zaWJsaW5ncygnLmZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGV4dCgnJykuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsZWFuIHN1bW1hcnkgZXJyb3JzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5jbG9zZXN0KCdmb3JtJykuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCc+IHVsID4gbGknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQodGhpcykudGV4dCgpID09IG1zZylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLnJlbW92ZUNsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPHNwYW4gZm9yPVwiJyArICR0LmF0dHIoJ25hbWUnKSArICdcIiBnZW5lcmF0ZWQ9XCJ0cnVlXCI+JyArIG1zZyArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgc3VtbWFyeSBlcnJvciAoaWYgdGhlcmUgaXMgbm90KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jaGlsZHJlbigndWwnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxsaT4nICsgbXNnICsgJzwvbGk+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07IiwiLyoqIEFwcGx5IGV2ZXIgYSByZWRpcmVjdCB0byB0aGUgZ2l2ZW4gVVJMLCBpZiB0aGlzIGlzIGFuIGludGVybmFsIFVSTCBvciBzYW1lXHJcbnBhZ2UsIGl0IGZvcmNlcyBhIHBhZ2UgcmVsb2FkIGZvciB0aGUgZ2l2ZW4gVVJMLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVkaXJlY3RUbyh1cmwpIHtcclxuICAgIC8vIEJsb2NrIHRvIGF2b2lkIG1vcmUgdXNlciBpbnRlcmFjdGlvbnM6XHJcbiAgICAkLmJsb2NrVUkoeyBtZXNzYWdlOiAnJyB9KTsgLy9sb2FkaW5nQmxvY2spO1xyXG4gICAgLy8gQ2hlY2tpbmcgaWYgaXMgYmVpbmcgcmVkaXJlY3Rpbmcgb3Igbm90XHJcbiAgICB2YXIgcmVkaXJlY3RlZCA9IGZhbHNlO1xyXG4gICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiBjaGVja1JlZGlyZWN0KCkge1xyXG4gICAgICAgIHJlZGlyZWN0ZWQgPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBOYXZpZ2F0ZSB0byBuZXcgbG9jYXRpb246XHJcbiAgICB3aW5kb3cubG9jYXRpb24gPSB1cmw7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJZiBwYWdlIG5vdCBjaGFuZ2VkIChzYW1lIHVybCBvciBpbnRlcm5hbCBsaW5rKSwgcGFnZSBjb250aW51ZSBleGVjdXRpbmcgdGhlbiByZWZyZXNoOlxyXG4gICAgICAgIGlmICghcmVkaXJlY3RlZClcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSwgNTApO1xyXG59O1xyXG4iLCIvKiogU2FuaXRpemUgdGhlIHdoaXRlc3BhY2VzIGluIGEgdGV4dCBieTpcclxuLSByZXBsYWNpbmcgY29udGlndW91cyB3aGl0ZXNwYWNlcyBjaGFyYWN0ZXJlcyAoYW55IG51bWJlciBvZiByZXBldGl0aW9uIFxyXG5hbmQgYW55IGtpbmQgb2Ygd2hpdGUgY2hhcmFjdGVyKSBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlcGxhY2UgZW5jb2RlZCBub24tYnJlYWtpbmctc3BhY2VzIGJ5IGEgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbi0gcmVtb3ZlIHN0YXJ0aW5nIGFuZCBlbmRpbmcgd2hpdGUtc3BhY2VzXHJcbi0gZXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4qKi9cclxuZnVuY3Rpb24gc2FuaXRpemVXaGl0ZXNwYWNlcyh0ZXh0KSB7XHJcbiAgICAvLyBFdmVyIHJldHVybiBhIHN0cmluZywgZW1wdHkgd2hlbiBudWxsXHJcbiAgICB0ZXh0ID0gKHRleHQgfHwgJycpXHJcbiAgICAvLyBSZXBsYWNlIGFueSBraW5kIG9mIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVycyBieSBhIHNpbmdsZSBub3JtYWwgd2hpdGUtc3BhY2VcclxuICAgIC8vICh0aGF0cyBpbmNsdWRlIHJlcGxhY2UgZW5jb25kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyxcclxuICAgIC8vIGFuZCBkdXBsaWNhdGVkLXJlcGVhdGVkIGFwcGVhcmFuY2VzKVxyXG4gICAgLnJlcGxhY2UoL1xccysvZywgJyAnKTtcclxuICAgIC8vIFJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlc3BhY2VzXHJcbiAgICByZXR1cm4gJC50cmltKHRleHQpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBzYW5pdGl6ZVdoaXRlc3BhY2VzOyIsIi8qKiBDdXN0b20gTG9jb25vbWljcyAnbGlrZSBibG9ja1VJJyBwb3B1cHNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUsXHJcbiAgICBhdXRvRm9jdXMgPSByZXF1aXJlKCcuL2F1dG9Gb2N1cycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcblxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9jayhjb250ZW50Qm94LCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykge1xyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcclxuICAgICAgICBjZW50ZXI6IGZhbHNlLFxyXG4gICAgICAgIC8qIGFzIGEgdmFsaWQgb3B0aW9ucyBwYXJhbWV0ZXIgZm9yIExDLmhpZGVFbGVtZW50IGZ1bmN0aW9uICovXHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiA2MDAsXHJcbiAgICAgICAgICAgIGVmZmVjdDogJ2ZhZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgYXV0b2ZvY3VzT3B0aW9uczogeyBtYXJnaW5Ub3A6IDYwIH0sXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgY29udGVudEJveCA9ICQoY29udGVudEJveCk7XHJcbiAgICB2YXIgZnVsbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJsb2NrZWQgPT0gZG9jdW1lbnQgfHwgYmxvY2tlZCA9PSB3aW5kb3cpIHtcclxuICAgICAgICBibG9ja2VkID0gJCgnYm9keScpO1xyXG4gICAgICAgIGZ1bGwgPSB0cnVlO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgYmxvY2tlZCA9ICQoYmxvY2tlZCk7XHJcblxyXG4gICAgdmFyIGJveEluc2lkZUJsb2NrZWQgPSAhYmxvY2tlZC5pcygnYm9keSx0cix0aGVhZCx0Ym9keSx0Zm9vdCx0YWJsZSx1bCxvbCxkbCcpO1xyXG5cclxuICAgIC8vIEdldHRpbmcgYm94IGVsZW1lbnQgaWYgZXhpc3RzIGFuZCByZWZlcmVuY2luZ1xyXG4gICAgdmFyIGJJRCA9IGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcpO1xyXG4gICAgaWYgKCFiSUQpXHJcbiAgICAgICAgYklEID0gKGNvbnRlbnRCb3guYXR0cignaWQnKSB8fCAnJykgKyAoYmxvY2tlZC5hdHRyKCdpZCcpIHx8ICcnKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgaWYgKGJJRCA9PSAnLXNtb290aEJveEJsb2NrJykge1xyXG4gICAgICAgIGJJRCA9ICdpZC0nICsgZ3VpZEdlbmVyYXRvcigpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICB9XHJcbiAgICBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnLCBiSUQpO1xyXG4gICAgdmFyIGJveCA9ICQoJyMnICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShiSUQpKTtcclxuICAgIC8vIEhpZGluZyBib3g6XHJcbiAgICBpZiAoY29udGVudEJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3gueGhpZGUob3B0aW9ucy5jbG9zZU9wdGlvbnMpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBib3hjO1xyXG4gICAgaWYgKGJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3hjID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stZWxlbWVudFwiLz4nKTtcclxuICAgICAgICBib3ggPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1vdmVybGF5XCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgYm94LmFkZENsYXNzKGFkZGNsYXNzKTtcclxuICAgICAgICBpZiAoZnVsbCkgYm94LmFkZENsYXNzKCdmdWxsLWJsb2NrJyk7XHJcbiAgICAgICAgYm94LmFwcGVuZChib3hjKTtcclxuICAgICAgICBib3guYXR0cignaWQnLCBiSUQpO1xyXG4gICAgICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKVxyXG4gICAgICAgICAgICBibG9ja2VkLmFwcGVuZChib3gpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZChib3gpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBib3hjID0gYm94LmNoaWxkcmVuKCcuc21vb3RoLWJveC1ibG9jay1lbGVtZW50Jyk7XHJcbiAgICB9XHJcbiAgICAvLyBIaWRkZW4gZm9yIHVzZXIsIGJ1dCBhdmFpbGFibGUgdG8gY29tcHV0ZTpcclxuICAgIGNvbnRlbnRCb3guc2hvdygpO1xyXG4gICAgYm94LnNob3coKS5jc3MoJ29wYWNpdHknLCAwKTtcclxuICAgIC8vIFNldHRpbmcgdXAgdGhlIGJveCBhbmQgc3R5bGVzLlxyXG4gICAgYm94Yy5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgaWYgKG9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAgYm94Yy5hcHBlbmQoJCgnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cCBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nKSk7XHJcbiAgICBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnLCBvcHRpb25zKTtcclxuICAgIGlmICghYm94Yy5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJykpXHJcbiAgICAgICAgYm94Y1xyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLWFjdGlvbicsIGZ1bmN0aW9uICgpIHsgc21vb3RoQm94QmxvY2sobnVsbCwgYmxvY2tlZCwgbnVsbCwgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJykpOyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAgICAgLmRhdGEoJ19jbG9zZS1hY3Rpb24tYWRkZWQnLCB0cnVlKTtcclxuICAgIGJveGMuYXBwZW5kKGNvbnRlbnRCb3gpO1xyXG4gICAgYm94Yy53aWR0aChvcHRpb25zLndpZHRoKTtcclxuICAgIGJveC5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICBpZiAoYm94SW5zaWRlQmxvY2tlZCkge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIGluc2lkZSB0aGUgYmxvY2tlZCBlbGVtZW50OlxyXG4gICAgICAgIGJveC5jc3MoJ3otaW5kZXgnLCBibG9ja2VkLmNzcygnei1pbmRleCcpICsgMTApO1xyXG4gICAgICAgIGlmICghYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgfHwgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJykgPT0gJ3N0YXRpYycpXHJcbiAgICAgICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIC8vb2ZmcyA9IGJsb2NrZWQucG9zaXRpb24oKTtcclxuICAgICAgICBib3guY3NzKCd0b3AnLCAwKTtcclxuICAgICAgICBib3guY3NzKCdsZWZ0JywgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIG91dHNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudCwgYXMgYSBkaXJlY3QgY2hpbGQgb2YgQm9keTpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgTWF0aC5mbG9vcihOdW1iZXIuTUFYX1ZBTFVFKSk7XHJcbiAgICAgICAgYm94LmNzcyhibG9ja2VkLm9mZnNldCgpKTtcclxuICAgIH1cclxuICAgIC8vIERpbWVuc2lvbnMgbXVzdCBiZSBjYWxjdWxhdGVkIGFmdGVyIGJlaW5nIGFwcGVuZGVkIGFuZCBwb3NpdGlvbiB0eXBlIGJlaW5nIHNldDpcclxuICAgIGJveC53aWR0aChibG9ja2VkLm91dGVyV2lkdGgoKSk7XHJcbiAgICBib3guaGVpZ2h0KGJsb2NrZWQub3V0ZXJIZWlnaHQoKSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuY2VudGVyKSB7XHJcbiAgICAgICAgYm94Yy5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICAgICAgdmFyIGNsLCBjdDtcclxuICAgICAgICBpZiAoZnVsbCkge1xyXG4gICAgICAgICAgICBjdCA9IHNjcmVlbi5oZWlnaHQgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IHNjcmVlbi53aWR0aCAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3QgPSBib3gub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IGJveC5vdXRlcldpZHRoKHRydWUpIC8gMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgYm94Yy5jc3MoJ3RvcCcsIGN0IC0gYm94Yy5vdXRlckhlaWdodCh0cnVlKSAvIDIpO1xyXG4gICAgICAgIGJveGMuY3NzKCdsZWZ0JywgY2wgLSBib3hjLm91dGVyV2lkdGgodHJ1ZSkgLyAyKTtcclxuICAgIH1cclxuICAgIC8vIExhc3Qgc2V0dXBcclxuICAgIGF1dG9Gb2N1cyhib3gpO1xyXG4gICAgLy8gU2hvdyBibG9ja1xyXG4gICAgYm94LmFuaW1hdGUoeyBvcGFjaXR5OiAxIH0sIDMwMCk7XHJcbiAgICBpZiAob3B0aW9ucy5hdXRvZm9jdXMpXHJcbiAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEJveCwgb3B0aW9ucy5hdXRvZm9jdXNPcHRpb25zKTtcclxuICAgIHJldHVybiBib3g7XHJcbn1cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2tDbG9zZUFsbChjb250YWluZXIpIHtcclxuICAgICQoY29udGFpbmVyIHx8IGRvY3VtZW50KS5maW5kKCcuc21vb3RoLWJveC1ibG9jay1vdmVybGF5JykuaGlkZSgpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb3Blbjogc21vb3RoQm94QmxvY2ssXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKTsgfSxcclxuICAgICAgICBjbG9zZUFsbDogc21vb3RoQm94QmxvY2tDbG9zZUFsbFxyXG4gICAgfTsiLCIvKipcclxuKiogTW9kdWxlOjogdG9vbHRpcHNcclxuKiogQ3JlYXRlcyBzbWFydCB0b29sdGlwcyB3aXRoIHBvc3NpYmlsaXRpZXMgZm9yIG9uIGhvdmVyIGFuZCBvbiBjbGljayxcclxuKiogYWRkaXRpb25hbCBkZXNjcmlwdGlvbiBvciBleHRlcm5hbCB0b29sdGlwIGNvbnRlbnQuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc2FuaXRpemVXaGl0ZXNwYWNlcyA9IHJlcXVpcmUoJy4vc2FuaXRpemVXaGl0ZXNwYWNlcycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS5vdXRlckh0bWwnKTtcclxucmVxdWlyZSgnLi9qcXVlcnkuaXNDaGlsZE9mJyk7XHJcblxyXG4vLyBNYWluIGludGVybmFsIHByb3BlcnRpZXNcclxudmFyIHBvc29mZnNldCA9IHsgeDogMTYsIHk6IDggfTtcclxudmFyIHNlbGVjdG9yID0gJ1t0aXRsZV1bZGF0YS1kZXNjcmlwdGlvbl0sIFt0aXRsZV0uaGFzLXRvb2x0aXAsIFt0aXRsZV0uc2VjdXJlLWRhdGEsIFtkYXRhLXRvb2x0aXAtdXJsXSwgW3RpdGxlXS5oYXMtcG9wdXAtdG9vbHRpcCc7XHJcblxyXG4vKiogUG9zaXRpb25hdGUgdGhlIHRvb2x0aXAgZGVwZW5kaW5nIG9uIHRoZVxyXG5ldmVudCBvciB0aGUgdGFyZ2V0IGVsZW1lbnQgcG9zaXRpb24gYW5kIGFuIG9mZnNldFxyXG4qKi9cclxuZnVuY3Rpb24gcG9zKHQsIGUsIGwpIHtcclxuICAgIHZhciB4LCB5O1xyXG4gICAgaWYgKGUucGFnZVggJiYgZS5wYWdlWSkge1xyXG4gICAgICAgIHggPSBlLnBhZ2VYO1xyXG4gICAgICAgIHkgPSBlLnBhZ2VZO1xyXG4gICAgfSBlbHNlIGlmIChlLnRhcmdldCkge1xyXG4gICAgICAgIHZhciAkZXQgPSAkKGUudGFyZ2V0KTtcclxuICAgICAgICB4ID0gJGV0Lm91dGVyV2lkdGgoKSArICRldC5vZmZzZXQoKS5sZWZ0O1xyXG4gICAgICAgIHkgPSAkZXQub3V0ZXJIZWlnaHQoKSArICRldC5vZmZzZXQoKS50b3A7XHJcbiAgICB9XHJcbiAgICB0LmNzcygnbGVmdCcsIHggKyBwb3NvZmZzZXQueCk7XHJcbiAgICB0LmNzcygndG9wJywgeSArIHBvc29mZnNldC55KTtcclxuICAgIC8vIEFkanVzdCB3aWR0aCB0byB2aXNpYmxlIHZpZXdwb3J0XHJcbiAgICB2YXIgdGRpZiA9IHQub3V0ZXJXaWR0aCgpIC0gdC53aWR0aCgpO1xyXG4gICAgdC5jc3MoJ21heC13aWR0aCcsICQod2luZG93KS53aWR0aCgpIC0geCAtIHBvc29mZnNldC54IC0gdGRpZik7XHJcbiAgICAvL3QuaGVpZ2h0KCQoZG9jdW1lbnQpLmhlaWdodCgpIC0geSAtIHBvc29mZnNldC55KTtcclxufVxyXG4vKiogR2V0IG9yIGNyZWF0ZSwgYW5kIHJldHVybnMsIHRoZSB0b29sdGlwIGNvbnRlbnQgZm9yIHRoZSBlbGVtZW50XHJcbioqL1xyXG5mdW5jdGlvbiBjb24obCkge1xyXG4gICAgaWYgKGwubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciBjID0gbC5kYXRhKCd0b29sdGlwLWNvbnRlbnQnKSxcclxuICAgICAgICBwZXJzaXN0ZW50ID0gbC5kYXRhKCdwZXJzaXN0ZW50LXRvb2x0aXAnKTtcclxuICAgIGlmICghYykge1xyXG4gICAgICAgIHZhciBoID0gc2FuaXRpemVXaGl0ZXNwYWNlcyhsLmF0dHIoJ3RpdGxlJykpO1xyXG4gICAgICAgIHZhciBkID0gc2FuaXRpemVXaGl0ZXNwYWNlcyhsLmRhdGEoJ2Rlc2NyaXB0aW9uJykpO1xyXG4gICAgICAgIGlmIChkKVxyXG4gICAgICAgICAgICBjID0gJzxoND4nICsgaCArICc8L2g0PjxwPicgKyBkICsgJzwvcD4nO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgYyA9IGg7XHJcbiAgICAgICAgLy8gQXBwZW5kIGRhdGEtdG9vbHRpcC11cmwgY29udGVudCBpZiBleGlzdHNcclxuICAgICAgICB2YXIgdXJsY29udGVudCA9ICQobC5kYXRhKCd0b29sdGlwLXVybCcpKTtcclxuICAgICAgICBjID0gKGMgfHwgJycpICsgdXJsY29udGVudC5vdXRlckh0bWwoKTtcclxuICAgICAgICAvLyBSZW1vdmUgb3JpZ2luYWwsIGlzIG5vIG1vcmUgbmVlZCBhbmQgYXZvaWQgaWQtY29uZmxpY3RzXHJcbiAgICAgICAgdXJsY29udGVudC5yZW1vdmUoKTtcclxuICAgICAgICAvLyBTYXZlIHRvb2x0aXAgY29udGVudFxyXG4gICAgICAgIGwuZGF0YSgndG9vbHRpcC1jb250ZW50JywgYyk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGJyb3dzZXIgdG9vbHRpcCAoYm90aCB3aGVuIHdlIGFyZSB1c2luZyBvdXIgb3duIHRvb2x0aXAgYW5kIHdoZW4gbm8gdG9vbHRpcFxyXG4gICAgICAgIC8vIGlzIG5lZWQpXHJcbiAgICAgICAgbC5hdHRyKCd0aXRsZScsICcnKTtcclxuICAgIH1cclxuICAgIC8vIFJlbW92ZSB0b29sdGlwIGNvbnRlbnQgKGJ1dCBwcmVzZXJ2ZSBpdHMgY2FjaGUgaW4gdGhlIGVsZW1lbnQgZGF0YSlcclxuICAgIC8vIGlmIGlzIHRoZSBzYW1lIHRleHQgYXMgdGhlIGVsZW1lbnQgY29udGVudCBhbmQgdGhlIGVsZW1lbnQgY29udGVudFxyXG4gICAgLy8gaXMgZnVsbHkgdmlzaWJsZS4gVGhhdHMsIGZvciBjYXNlcyB3aXRoIGRpZmZlcmVudCBjb250ZW50LCB3aWxsIGJlIHNob3dlZCxcclxuICAgIC8vIGFuZCBmb3IgY2FzZXMgd2l0aCBzYW1lIGNvbnRlbnQgYnV0IGlzIG5vdCB2aXNpYmxlIGJlY2F1c2UgdGhlIGVsZW1lbnRcclxuICAgIC8vIG9yIGNvbnRhaW5lciB3aWR0aCwgdGhlbiB3aWxsIGJlIHNob3dlZC5cclxuICAgIC8vIEV4Y2VwdCBpZiBpcyBwZXJzaXN0ZW50XHJcbiAgICBpZiAocGVyc2lzdGVudCAhPT0gdHJ1ZSAmJlxyXG4gICAgICAgIHNhbml0aXplV2hpdGVzcGFjZXMobC50ZXh0KCkpID09IGMgJiZcclxuICAgICAgICBsLm91dGVyV2lkdGgoKSA+PSBsWzBdLnNjcm9sbFdpZHRoKSB7XHJcbiAgICAgICAgYyA9IG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBjb250ZW50OlxyXG4gICAgaWYgKCFjKSB7XHJcbiAgICAgICAgLy8gVXBkYXRlIHRhcmdldCByZW1vdmluZyB0aGUgY2xhc3MgdG8gYXZvaWQgY3NzIG1hcmtpbmcgdG9vbHRpcCB3aGVuIHRoZXJlIGlzIG5vdFxyXG4gICAgICAgIGwucmVtb3ZlQ2xhc3MoJ2hhcy10b29sdGlwJykucmVtb3ZlQ2xhc3MoJ2hhcy1wb3B1cC10b29sdGlwJyk7XHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm4gdGhlIGNvbnRlbnQgYXMgc3RyaW5nOlxyXG4gICAgcmV0dXJuIGM7XHJcbn1cclxuLyoqIEdldCBvciBjcmVhdGVzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2UgZm9yIGEgdG9vbHRpcCBvZiB0aGUgZ2l2ZW4gdHlwZVxyXG4qKi9cclxuZnVuY3Rpb24gZ2V0VG9vbHRpcCh0eXBlKSB7XHJcbiAgICB0eXBlID0gdHlwZSB8fCAndG9vbHRpcCc7XHJcbiAgICB2YXIgaWQgPSAnc2luZ2xldG9uLScgKyB0eXBlO1xyXG4gICAgdmFyIHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XHJcbiAgICBpZiAoIXQpIHtcclxuICAgICAgICB0ID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlXCIgY2xhc3M9XCJ0b29sdGlwXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgdC5hdHRyKCdpZCcsIGlkKTtcclxuICAgICAgICB0LmhpZGUoKTtcclxuICAgICAgICAkKCdib2R5JykuYXBwZW5kKHQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICQodCk7XHJcbn1cclxuLyoqIFNob3cgdGhlIHRvb2x0aXAgb24gYW4gZXZlbnQgdHJpZ2dlcmVkIGJ5IHRoZSBlbGVtZW50IGNvbnRhaW5pbmdcclxuaW5mb3JtYXRpb24gZm9yIGEgdG9vbHRpcFxyXG4qKi9cclxuZnVuY3Rpb24gc2hvd1Rvb2x0aXAoZSkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBpc1BvcHVwID0gJHQuaGFzQ2xhc3MoJ2hhcy1wb3B1cC10b29sdGlwJyk7XHJcbiAgICAvLyBHZXQgb3IgY3JlYXRlIHRvb2x0aXAgbGF5ZXJcclxuICAgIHZhciB0ID0gZ2V0VG9vbHRpcChpc1BvcHVwID8gJ3BvcHVwLXRvb2x0aXAnIDogJ3Rvb2x0aXAnKTtcclxuICAgIC8vIElmIHRoaXMgaXMgbm90IHBvcHVwIGFuZCB0aGUgZXZlbnQgaXMgY2xpY2ssIGRpc2NhcmQgd2l0aG91dCBjYW5jZWwgZXZlbnRcclxuICAgIGlmICghaXNQb3B1cCAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAvLyBDcmVhdGUgY29udGVudDogaWYgdGhlcmUgaXMgY29udGVudCwgY29udGludWVcclxuICAgIHZhciBjb250ZW50ID0gY29uKCR0KTtcclxuICAgIGlmIChjb250ZW50KSB7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBoYXMtcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBub3QgYSBjbGljaywgZG9uJ3Qgc2hvd1xyXG4gICAgICAgIGlmIChpc1BvcHVwICYmIGUudHlwZSAhPSAnY2xpY2snKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAvLyBUaGUgdG9vbHRpcCBzZXR1cCBtdXN0IGJlIHF1ZXVlZCB0byBhdm9pZCBjb250ZW50IHRvIGJlIHNob3dlZCBhbmQgcGxhY2VkXHJcbiAgICAgICAgLy8gd2hlbiBzdGlsbCBoaWRkZW4gdGhlIHByZXZpb3VzXHJcbiAgICAgICAgdC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFNldCB0b29sdGlwIGNvbnRlbnRcclxuICAgICAgICAgICAgdC5odG1sKGNvbnRlbnQpO1xyXG4gICAgICAgICAgICAvLyBGb3IgcG9wdXBzLCBzZXR1cCBjbGFzcyBhbmQgY2xvc2UgYnV0dG9uXHJcbiAgICAgICAgICAgIGlmIChpc1BvcHVwKSB7XHJcbiAgICAgICAgICAgICAgICB0LmFkZENsYXNzKCdwb3B1cC10b29sdGlwJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YSBocmVmPVwiI2Nsb3NlLXBvcHVwXCIgY2xhc3M9XCJjbG9zZS1hY3Rpb25cIj5YPC9hPicpO1xyXG4gICAgICAgICAgICAgICAgdC5hcHBlbmQoY2xvc2VCdXR0b24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFBvc2l0aW9uYXRlXHJcbiAgICAgICAgICAgIHBvcyh0LCBlLCAkdCk7XHJcbiAgICAgICAgICAgIHQuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAvLyBTaG93IChhbmltYXRpb25zIGFyZSBzdG9wcGVkIG9ubHkgb24gaGlkZSB0byBhdm9pZCBjb25mbGljdHMpXHJcbiAgICAgICAgICAgIHQuZmFkZUluKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RvcCBidWJibGluZyBhbmQgZGVmYXVsdFxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKiBIaWRlIGFsbCBvcGVuZWQgdG9vbHRpcHMsIGZvciBhbnkgdHlwZS5cclxuSXQgaGFzIHNvbWUgc3BlY2lhbCBjb25zaWRlcmF0aW9ucyBmb3IgcG9wdXAtdG9vbHRpcHMgZGVwZW5kaW5nXHJcbm9uIHRoZSBldmVudCBiZWluZyB0cmlnZ2VyZWQuXHJcbioqL1xyXG5mdW5jdGlvbiBoaWRlVG9vbHRpcChlKSB7XHJcbiAgICAkKCcudG9vbHRpcDp2aXNpYmxlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGlzIGEgcG9wdXAtdG9vbHRpcCBhbmQgdGhpcyBpcyBub3QgYSBjbGljaywgb3IgdGhlIGludmVyc2UsXHJcbiAgICAgICAgLy8gdGhpcyBpcyBub3QgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIGEgY2xpY2ssIGRvIG5vdGhpbmdcclxuICAgICAgICBpZiAodC5oYXNDbGFzcygncG9wdXAtdG9vbHRpcCcpICYmIGUudHlwZSAhPSAnY2xpY2snIHx8XHJcbiAgICAgICAgICAgICF0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlID09ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAvLyBTdG9wIGFuaW1hdGlvbnMgYW5kIGhpZGVcclxuICAgICAgICB0LnN0b3AodHJ1ZSwgdHJ1ZSkuZmFkZU91dCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcbi8qKiBJbml0aWFsaXplIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiBpbml0KCkge1xyXG4gICAgLy8gTGlzdGVuIGZvciBldmVudHMgdG8gc2hvdy9oaWRlIHRvb2x0aXBzXHJcbiAgICAkKCdib2R5Jykub24oJ21vdXNlbW92ZSBmb2N1c2luJywgc2VsZWN0b3IsIHNob3dUb29sdGlwKVxyXG4gICAgLm9uKCdtb3VzZWxlYXZlIGZvY3Vzb3V0Jywgc2VsZWN0b3IsIGhpZGVUb29sdGlwKVxyXG4gICAgLy8gTGlzdGVuIGV2ZW50IGZvciBjbGlja2FibGUgcG9wdXAtdG9vbHRpcHNcclxuICAgIC5vbignY2xpY2snLCAnW3RpdGxlXS5oYXMtcG9wdXAtdG9vbHRpcCcsIHNob3dUb29sdGlwKVxyXG4gICAgLy8gQWxsb3dpbmcgYnV0dG9ucyBpbnNpZGUgdGhlIHRvb2x0aXBcclxuICAgIC5vbignY2xpY2snLCAnLnRvb2x0aXAtYnV0dG9uJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAvLyBBZGRpbmcgY2xvc2UtdG9vbHRpcCBoYW5kbGVyIGZvciBwb3B1cC10b29sdGlwcyAoY2xpY2sgb24gYW55IGVsZW1lbnQgZXhjZXB0IHRoZSB0b29sdGlwIGl0c2VsZilcclxuICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIHZhciB0ID0gJCgnLnBvcHVwLXRvb2x0aXA6dmlzaWJsZScpLmdldCgwKTtcclxuICAgICAgICAvLyBJZiB0aGUgY2xpY2sgaXMgTm90IG9uIHRoZSB0b29sdGlwIG9yIGFueSBlbGVtZW50IGNvbnRhaW5lZFxyXG4gICAgICAgIC8vIGhpZGUgdG9vbHRpcFxyXG4gICAgICAgIGlmIChlLnRhcmdldCAhPSB0ICYmICEkKGUudGFyZ2V0KS5pc0NoaWxkT2YodCkpXHJcbiAgICAgICAgICAgIGhpZGVUb29sdGlwKGUpO1xyXG4gICAgfSlcclxuICAgIC8vIEF2b2lkIGNsb3NlLWFjdGlvbiBjbGljayBmcm9tIHJlZGlyZWN0IHBhZ2UsIGFuZCBoaWRlIHRvb2x0aXBcclxuICAgIC5vbignY2xpY2snLCAnLnBvcHVwLXRvb2x0aXAgLmNsb3NlLWFjdGlvbicsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGhpZGVUb29sdGlwKGUpO1xyXG4gICAgfSk7XHJcbiAgICB1cGRhdGUoKTtcclxufVxyXG4vKiogVXBkYXRlIGVsZW1lbnRzIG9uIHRoZSBwYWdlIHRvIHJlZmxlY3QgY2hhbmdlcyBvciBuZWVkIGZvciB0b29sdGlwc1xyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlKGVsZW1lbnRfc2VsZWN0b3IpIHtcclxuICAgIC8vIFJldmlldyBldmVyeSBwb3B1cCB0b29sdGlwIHRvIHByZXBhcmUgY29udGVudCBhbmQgbWFyay91bm1hcmsgdGhlIGxpbmsgb3IgdGV4dDpcclxuICAgICQoZWxlbWVudF9zZWxlY3RvciB8fCBzZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY29uKCQodGhpcykpO1xyXG4gICAgfSk7XHJcbn1cclxuLyoqIENyZWF0ZSB0b29sdGlwIG9uIGVsZW1lbnQgYnkgZGVtYW5kXHJcbioqL1xyXG5mdW5jdGlvbiBjcmVhdGVfdG9vbHRpcChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB2YXIgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwge1xyXG4gICAgICB0aXRsZTogJydcclxuICAgICAgLCBkZXNjcmlwdGlvbjogbnVsbFxyXG4gICAgICAsIHVybDogbnVsbFxyXG4gICAgICAsIGlzX3BvcHVwOiBmYWxzZVxyXG4gICAgICAsIHBlcnNpc3RlbnQ6IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKGVsZW1lbnQpXHJcbiAgICAuYXR0cigndGl0bGUnLCBzZXR0aW5ncy50aXRsZSlcclxuICAgIC5kYXRhKCdkZXNjcmlwdGlvbicsIHNldHRpbmdzLmRlc2NyaXB0aW9uKVxyXG4gICAgLmRhdGEoJ3BlcnNpc3RlbnQtdG9vbHRpcCcsIHNldHRpbmdzLnBlcnNpc3RlbnQpXHJcbiAgICAuYWRkQ2xhc3Moc2V0dGluZ3MuaXNfcG9wdXAgPyAnaGFzLXBvcHVwLXRvb2x0aXAnIDogJ2hhcy10b29sdGlwJyk7XHJcbiAgICB1cGRhdGUoZWxlbWVudCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXRUb29sdGlwczogaW5pdCxcclxuICAgICAgICB1cGRhdGVUb29sdGlwczogdXBkYXRlLFxyXG4gICAgICAgIGNyZWF0ZVRvb2x0aXA6IGNyZWF0ZV90b29sdGlwXHJcbiAgICB9O1xyXG4iLCIvKiBTb21lIHRvb2xzIGZvcm0gVVJMIG1hbmFnZW1lbnRcclxuKi9cclxuZXhwb3J0cy5nZXRVUkxQYXJhbWV0ZXIgPSBmdW5jdGlvbiBnZXRVUkxQYXJhbWV0ZXIobmFtZSkge1xyXG4gICAgcmV0dXJuIGRlY29kZVVSSShcclxuICAgICAgICAoUmVnRXhwKG5hbWUgKyAnPScgKyAnKC4rPykoJnwkKScsICdpJykuZXhlYyhsb2NhdGlvbi5zZWFyY2gpIHx8IFssIG51bGxdKVsxXSk7XHJcbn07XHJcbmV4cG9ydHMuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzID0gZnVuY3Rpb24gZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzKGhhc2hiYW5ndmFsdWUpIHtcclxuICAgIC8vIEhhc2hiYW5ndmFsdWUgaXMgc29tZXRoaW5nIGxpa2U6IFRocmVhZC0xX01lc3NhZ2UtMlxyXG4gICAgLy8gV2hlcmUgJzEnIGlzIHRoZSBUaHJlYWRJRCBhbmQgJzInIHRoZSBvcHRpb25hbCBNZXNzYWdlSUQsIG9yIG90aGVyIHBhcmFtZXRlcnNcclxuICAgIHZhciBwYXJzID0gaGFzaGJhbmd2YWx1ZS5zcGxpdCgnXycpO1xyXG4gICAgdmFyIHVybFBhcmFtZXRlcnMgPSB7fTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGFycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBwYXJzdmFsdWVzID0gcGFyc1tpXS5zcGxpdCgnLScpO1xyXG4gICAgICAgIGlmIChwYXJzdmFsdWVzLmxlbmd0aCA9PSAyKVxyXG4gICAgICAgICAgICB1cmxQYXJhbWV0ZXJzW3BhcnN2YWx1ZXNbMF1dID0gcGFyc3ZhbHVlc1sxXTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVybFBhcmFtZXRlcnM7XHJcbn07XHJcbiIsIi8qKiBWYWxpZGF0aW9uIGxvZ2ljIHdpdGggbG9hZCBhbmQgc2V0dXAgb2YgdmFsaWRhdG9ycyBhbmQgXHJcbiAgICB2YWxpZGF0aW9uIHJlbGF0ZWQgdXRpbGl0aWVzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG4vLyBVc2luZyBvbiBzZXR1cCBhc3luY3Jvbm91cyBsb2FkIGluc3RlYWQgb2YgdGhpcyBzdGF0aWMtbGlua2VkIGxvYWRcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanMnKTtcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanMnKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwVmFsaWRhdGlvbihyZWFwcGx5T25seVRvKSB7XHJcbiAgICByZWFwcGx5T25seVRvID0gcmVhcHBseU9ubHlUbyB8fCBkb2N1bWVudDtcclxuICAgIGlmICghd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZiAoIWpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHtcclxuICAgICAgICBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICBNb2Rlcm5penIubG9hZChbXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanNcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzXCIgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgZmlyc3QgaWYgdmFsaWRhdGlvbiBpcyBlbmFibGVkIChjYW4gaGFwcGVuIHRoYXQgdHdpY2UgaW5jbHVkZXMgb2ZcclxuICAgICAgICAvLyB0aGlzIGNvZGUgaGFwcGVuIGF0IHNhbWUgcGFnZSwgYmVpbmcgZXhlY3V0ZWQgdGhpcyBjb2RlIGFmdGVyIGZpcnN0IGFwcGVhcmFuY2VcclxuICAgICAgICAvLyB3aXRoIHRoZSBzd2l0Y2gganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCBjaGFuZ2VkXHJcbiAgICAgICAgLy8gYnV0IHdpdGhvdXQgdmFsaWRhdGlvbiBiZWluZyBhbHJlYWR5IGxvYWRlZCBhbmQgZW5hYmxlZClcclxuICAgICAgICBpZiAoJCAmJiAkLnZhbGlkYXRvciAmJiAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZSkge1xyXG4gICAgICAgICAgICAvLyBBcHBseSB0aGUgdmFsaWRhdGlvbiBydWxlcyB0byB0aGUgbmV3IGVsZW1lbnRzXHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndmFsaWRhdG9yJyk7XHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgICAgICQudmFsaWRhdG9yLnVub2J0cnVzaXZlLnBhcnNlKHJlYXBwbHlPbmx5VG8pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0aWVzICovXHJcblxyXG4vKiBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9ycyBvZiB0aGUgdmFsaWRhdGlvbiBzdW1tYXJ5XHJcbmluY2x1ZGVkIGluICdjb250YWluZXInIGFuZCBzZXQgYXMgdmFsaWQgdGhlIHN1bW1hcnlcclxuKi9cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gICAgJCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgLmZpbmQoJz51bD5saScpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFNldCBhbGwgZmllbGRzIHZhbGlkYXRpb24gaW5zaWRlIHRoaXMgZm9ybSAoYWZmZWN0ZWQgYnkgdGhlIHN1bW1hcnkgdG9vKVxyXG4gICAgLy8gYXMgdmFsaWQgdG9vXHJcbiAgICAkKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgLnRleHQoJycpO1xyXG5cclxuICAgIC8vIFJlLWFwcGx5IHNldHVwIHZhbGlkYXRpb24gdG8gZW5zdXJlIGlzIHdvcmtpbmcsIGJlY2F1c2UganVzdCBhZnRlciBhIHN1Y2Nlc3NmdWxcclxuICAgIC8vIHZhbGlkYXRpb24sIGFzcC5uZXQgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBzdG9wcyB3b3JraW5nIG9uIGNsaWVudC1zaWRlLlxyXG4gICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihjb250YWluZXIpIHtcclxuICB2YXIgdiA9IGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpO1xyXG4gIHYuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pIHtcclxuICAgIHZhciBvZmYgPSBmb3JtLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykub2Zmc2V0KCk7XHJcbiAgICBpZiAob2ZmKVxyXG4gICAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogb2ZmLnRvcCB9LCA1MDApO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ2dvVG9TdW1tYXJ5RXJyb3JzOiBubyBzdW1tYXJ5IHRvIGZvY3VzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpIHtcclxuICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgcmV0dXJuICQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2V0dXA6IHNldHVwVmFsaWRhdGlvbixcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDogc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IsXHJcbiAgICBnb1RvU3VtbWFyeUVycm9yczogZ29Ub1N1bW1hcnlFcnJvcnMsXHJcbiAgICBmaW5kVmFsaWRhdGlvblN1bW1hcnk6IGZpbmRWYWxpZGF0aW9uU3VtbWFyeVxyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gc29tZSBBY2NvdW50IHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJ2EubG9naW4nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IGJhc2VVcmwgKyAnQWNjb3VudC8kTG9naW4vP1JldHVyblVybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbik7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EucmVnaXN0ZXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvUmVnaXN0ZXInLCAnL0FjY291bnQvJFJlZ2lzdGVyJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0NTAsIGhlaWdodDogNTAwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EuZm9yZ290LXBhc3N3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L0ZvcmdvdFBhc3N3b3JkJywgJy9BY2NvdW50LyRGb3Jnb3RQYXNzd29yZCcpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDAwLCBoZWlnaHQ6IDI0MCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmNoYW5nZS1wYXNzd29yZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9DaGFuZ2VQYXNzd29yZCcsICcvQWNjb3VudC8kQ2hhbmdlUGFzc3dvcmQnKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQ1MCwgaGVpZ2h0OiAzNDAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLy8gT1VSIG5hbWVzcGFjZSAoYWJicmV2aWF0ZWQgTG9jb25vbWljcylcclxud2luZG93LkxDID0gd2luZG93LkxDIHx8IHt9O1xyXG5cclxuLy8gVE9ETyBSZXZpZXcgTGNVcmwgdXNlIGFyb3VuZCBhbGwgdGhlIG1vZHVsZXMsIHVzZSBESSB3aGVuZXZlciBwb3NzaWJsZSAoaW5pdC9zZXR1cCBtZXRob2Qgb3IgaW4gdXNlIGNhc2VzKVxyXG4vLyBidXQgb25seSBmb3IgdGhlIHdhbnRlZCBiYXNlVXJsIG9uIGVhY2ggY2FzZSBhbmQgbm90IHBhc3MgYWxsIHRoZSBMY1VybCBvYmplY3QuXHJcbi8vIExjVXJsIGlzIHNlcnZlci1zaWRlIGdlbmVyYXRlZCBhbmQgd3JvdGUgaW4gYSBMYXlvdXQgc2NyaXB0LXRhZy5cclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5nc1xyXG53aW5kb3cuZ0xvYWRpbmdSZXRhcmQgPSAzMDA7XHJcblxyXG4vKioqXHJcbiAqKiBMb2FkaW5nIG1vZHVsZXNcclxuKioqL1xyXG4vL1RPRE86IENsZWFuIGRlcGVuZGVuY2llcywgcmVtb3ZlIGFsbCB0aGF0IG5vdCB1c2VkIGRpcmVjdGx5IGluIHRoaXMgZmlsZSwgYW55IG90aGVyIGZpbGVcclxuLy8gb3IgcGFnZSBtdXN0IHJlcXVpcmUgaXRzIGRlcGVuZGVuY2llcy5cclxuXHJcbndpbmRvdy5MY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyk7XHJcblxyXG4vKiBqUXVlcnksIHNvbWUgdmVuZG9yIHBsdWdpbnMgKGZyb20gYnVuZGxlKSBhbmQgb3VyIGFkZGl0aW9ucyAoc21hbGwgcGx1Z2lucyksIHRoZXkgYXJlIGF1dG9tYXRpY2FsbHkgcGx1Zy1lZCBvbiByZXF1aXJlICovXHJcbnZhciAkID0gd2luZG93LiQgPSB3aW5kb3cualF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5oYXNTY3JvbGxCYXInKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJhLWhhc2hjaGFuZ2UnKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LmFyZScpO1xyXG4vLyBNYXNrZWQgaW5wdXQsIGZvciBkYXRlcyAtYXQgbXktYWNjb3VudC0uXHJcbnJlcXVpcmUoJ2pxdWVyeS5mb3JtYXR0ZXInKTtcclxuXHJcbi8vIEdlbmVyYWwgY2FsbGJhY2tzIGZvciBBSkFYIGV2ZW50cyB3aXRoIGNvbW1vbiBsb2dpY1xyXG52YXIgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhDYWxsYmFja3MnKTtcclxuLy8gRm9ybS5hamF4IGxvZ2ljIGFuZCBtb3JlIHNwZWNpZmljIGNhbGxiYWNrcyBiYXNlZCBvbiBhamF4Q2FsbGJhY2tzXHJcbnZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbndpbmRvdy5hamF4Rm9ybXNTdWNjZXNzSGFuZGxlciA9IGFqYXhGb3Jtcy5vblN1Y2Nlc3M7XHJcbndpbmRvdy5hamF4RXJyb3JQb3B1cEhhbmRsZXIgPSBhamF4Rm9ybXMub25FcnJvcjtcclxud2luZG93LmFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlciA9IGFqYXhGb3Jtcy5vbkNvbXBsZXRlO1xyXG4vL31cclxuXHJcbi8qIFJlbG9hZCAqL1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkucmVsb2FkJyk7XHJcbi8vIFdyYXBwZXIgZnVuY3Rpb24gYXJvdW5kIG9uU3VjY2VzcyB0byBtYXJrIG9wZXJhdGlvbiBhcyBwYXJ0IG9mIGEgXHJcbi8vIHJlbG9hZCBhdm9pZGluZyBzb21lIGJ1Z3MgKGFzIHJlcGxhY2UtY29udGVudCBvbiBhamF4LWJveCwgbm90IHdhbnRlZCBmb3JcclxuLy8gcmVsb2FkIG9wZXJhdGlvbnMpXHJcbmZ1bmN0aW9uIHJlbG9hZFN1Y2Nlc3NXcmFwcGVyKCkge1xyXG4gIHZhciBjb250ZXh0ID0gJC5pc1BsYWluT2JqZWN0KHRoaXMpID8gdGhpcyA6IHsgZWxlbWVudDogdGhpcyB9O1xyXG4gIGNvbnRleHQuaXNSZWxvYWQgPSB0cnVlO1xyXG4gIGFqYXhGb3Jtcy5vblN1Y2Nlc3MuYXBwbHkoY29udGV4dCwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XHJcbn1cclxuJC5mbi5yZWxvYWQuZGVmYXVsdHMgPSB7XHJcbiAgc3VjY2VzczogW3JlbG9hZFN1Y2Nlc3NXcmFwcGVyXSxcclxuICBlcnJvcjogW2FqYXhGb3Jtcy5vbkVycm9yXSxcclxuICBkZWxheTogZ0xvYWRpbmdSZXRhcmRcclxufTtcclxuXHJcbkxDLm1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi4vTEMvbW92ZUZvY3VzVG8nKTtcclxuLyogRGlzYWJsZWQgYmVjYXVzZSBjb25mbGljdHMgd2l0aCB0aGUgbW92ZUZvY3VzVG8gb2YgXHJcbiAgYWpheEZvcm0ub25zdWNjZXNzLCBpdCBoYXBwZW5zIGEgYmxvY2subG9hZGluZyBqdXN0IGFmdGVyXHJcbiAgdGhlIHN1Y2Nlc3MgaGFwcGVucy5cclxuJC5ibG9ja1VJLmRlZmF1bHRzLm9uQmxvY2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBTY3JvbGwgdG8gYmxvY2stbWVzc2FnZSB0byBkb24ndCBsb3N0IGluIGxhcmdlIHBhZ2VzOlxyXG4gICAgTEMubW92ZUZvY3VzVG8odGhpcyk7XHJcbn07Ki9cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuLi9MQy9sb2FkZXInKTtcclxuTEMubG9hZCA9IGxvYWRlci5sb2FkO1xyXG5cclxudmFyIGJsb2NrcyA9IExDLmJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4uL0xDL2Jsb2NrUHJlc2V0cycpO1xyXG4vL3tURU1QXHJcbndpbmRvdy5sb2FkaW5nQmxvY2sgPSBibG9ja3MubG9hZGluZztcclxud2luZG93LmluZm9CbG9jayA9IGJsb2Nrcy5pbmZvO1xyXG53aW5kb3cuZXJyb3JCbG9jayA9IGJsb2Nrcy5lcnJvcjtcclxuLy99XHJcblxyXG5BcnJheS5yZW1vdmUgPSByZXF1aXJlKCcuLi9MQy9BcnJheS5yZW1vdmUnKTtcclxucmVxdWlyZSgnLi4vTEMvU3RyaW5nLnByb3RvdHlwZS5jb250YWlucycpO1xyXG5cclxuTEMuZ2V0VGV4dCA9IHJlcXVpcmUoJy4uL0xDL2dldFRleHQnKTtcclxuXHJcbnZhciBUaW1lU3BhbiA9IExDLnRpbWVTcGFuID0gcmVxdWlyZSgnLi4vTEMvVGltZVNwYW4nKTtcclxudmFyIHRpbWVTcGFuRXh0cmEgPSByZXF1aXJlKCcuLi9MQy9UaW1lU3BhbkV4dHJhJyk7XHJcbnRpbWVTcGFuRXh0cmEucGx1Z0luKFRpbWVTcGFuKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzZXNcclxuTEMuc21hcnRUaW1lID0gdGltZVNwYW5FeHRyYS5zbWFydFRpbWU7XHJcbkxDLnJvdW5kVGltZVRvUXVhcnRlckhvdXIgPSB0aW1lU3BhbkV4dHJhLnJvdW5kVG9RdWFydGVySG91cjtcclxuLy99XHJcblxyXG5MQy5DaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi4vTEMvY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG53aW5kb3cuVGFiYmVkVVggPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWCcpO1xyXG52YXIgc2xpZGVyVGFicyA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLnNsaWRlclRhYnMnKTtcclxuXHJcbi8vIFBvcHVwIEFQSXNcclxud2luZG93LnNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi4vTEMvc21vb3RoQm94QmxvY2snKTtcclxuXHJcbnZhciBwb3B1cCA9IHJlcXVpcmUoJy4uL0xDL3BvcHVwJyk7XHJcbi8ve1RFTVBcclxudmFyIHBvcHVwU3R5bGUgPSBwb3B1cC5zdHlsZSxcclxuICAgIHBvcHVwU2l6ZSA9IHBvcHVwLnNpemU7XHJcbkxDLm1lc3NhZ2VQb3B1cCA9IHBvcHVwLm1lc3NhZ2U7XHJcbkxDLmNvbm5lY3RQb3B1cEFjdGlvbiA9IHBvcHVwLmNvbm5lY3RBY3Rpb247XHJcbndpbmRvdy5wb3B1cCA9IHBvcHVwO1xyXG4vL31cclxuXHJcbkxDLnNhbml0aXplV2hpdGVzcGFjZXMgPSByZXF1aXJlKCcuLi9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzJyk7XHJcbi8ve1RFTVAgICBhbGlhcyBiZWNhdXNlIG1pc3NwZWxsaW5nXHJcbkxDLnNhbml0aXplV2hpdGVwYWNlcyA9IExDLnNhbml0aXplV2hpdGVzcGFjZXM7XHJcbi8vfVxyXG5cclxuTEMuZ2V0WFBhdGggPSByZXF1aXJlKCcuLi9MQy9nZXRYUGF0aCcpO1xyXG5cclxudmFyIHN0cmluZ0Zvcm1hdCA9IHJlcXVpcmUoJy4uL0xDL1N0cmluZ0Zvcm1hdCcpO1xyXG5cclxuLy8gRXhwYW5kaW5nIGV4cG9ydGVkIHV0aWxpdGVzIGZyb20gbW9kdWxlcyBkaXJlY3RseSBhcyBMQyBtZW1iZXJzOlxyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvUHJpY2UnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9tYXRoVXRpbHMnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9udW1iZXJVdGlscycpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL3Rvb2x0aXBzJykpO1xyXG52YXIgaTE4biA9IExDLmkxOG4gPSByZXF1aXJlKCcuLi9MQy9pMThuJyk7XHJcbi8ve1RFTVAgb2xkIGFsaXNlcyBvbiBMQyBhbmQgZ2xvYmFsXHJcbiQuZXh0ZW5kKExDLCBpMThuKTtcclxuJC5leHRlbmQod2luZG93LCBpMThuKTtcclxuLy99XHJcblxyXG4vLyB4dHNoOiBwbHVnZWQgaW50byBqcXVlcnkgYW5kIHBhcnQgb2YgTENcclxudmFyIHh0c2ggPSByZXF1aXJlKCcuLi9MQy9qcXVlcnkueHRzaCcpO1xyXG54dHNoLnBsdWdJbigkKTtcclxuLy97VEVNUCAgIHJlbW92ZSBvbGQgTEMuKiBhbGlhc1xyXG4kLmV4dGVuZChMQywgeHRzaCk7XHJcbmRlbGV0ZSBMQy5wbHVnSW47XHJcbi8vfVxyXG5cclxudmFyIGF1dG9DYWxjdWxhdGUgPSBMQy5hdXRvQ2FsY3VsYXRlID0gcmVxdWlyZSgnLi4vTEMvYXV0b0NhbGN1bGF0ZScpO1xyXG4vL3tURU1QICAgcmVtb3ZlIG9sZCBhbGlhcyB1c2VcclxudmFyIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzID0gYXV0b0NhbGN1bGF0ZS5vblRhYmxlSXRlbXM7XHJcbkxDLnNldHVwQ2FsY3VsYXRlU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUub25TdW1tYXJ5O1xyXG5MQy51cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS51cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5O1xyXG5MQy5zZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLm9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTtcclxuLy99XHJcblxyXG52YXIgQ29va2llID0gTEMuQ29va2llID0gcmVxdWlyZSgnLi4vTEMvQ29va2llJyk7XHJcbi8ve1RFTVAgICAgb2xkIGFsaWFzXHJcbnZhciBnZXRDb29raWUgPSBDb29raWUuZ2V0LFxyXG4gICAgc2V0Q29va2llID0gQ29va2llLnNldDtcclxuLy99XHJcblxyXG5MQy5kYXRlUGlja2VyID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVBpY2tlcicpO1xyXG4vL3tURU1QICAgb2xkIGFsaWFzXHJcbndpbmRvdy5zZXR1cERhdGVQaWNrZXIgPSBMQy5zZXR1cERhdGVQaWNrZXIgPSBMQy5kYXRlUGlja2VyLmluaXQ7XHJcbndpbmRvdy5hcHBseURhdGVQaWNrZXIgPSBMQy5hcHBseURhdGVQaWNrZXIgPSBMQy5kYXRlUGlja2VyLmFwcGx5O1xyXG4vL31cclxuXHJcbkxDLmF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4uL0xDL2F1dG9Gb2N1cycpO1xyXG5cclxuLy8gQ1JVREw6IGxvYWRpbmcgbW9kdWxlLCBzZXR0aW5nIHVwIGNvbW1vbiBkZWZhdWx0IHZhbHVlcyBhbmQgY2FsbGJhY2tzOlxyXG52YXIgY3J1ZGxNb2R1bGUgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpO1xyXG5jcnVkbE1vZHVsZS5kZWZhdWx0U2V0dGluZ3MuZGF0YVsnZm9jdXMtY2xvc2VzdCddWydkZWZhdWx0J10gPSAnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJztcclxuY3J1ZGxNb2R1bGUuZGVmYXVsdFNldHRpbmdzLmRhdGFbJ2ZvY3VzLW1hcmdpbiddWydkZWZhdWx0J10gPSAxMDtcclxudmFyIGNydWRsID0gY3J1ZGxNb2R1bGUuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy8gUHJldmlvdXMgdXNlZCBhbGlhcyAoZGVwcmVjYXRlZCk6XHJcbkxDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG5cclxuLy8gVUkgU2xpZGVyIExhYmVsc1xyXG52YXIgc2xpZGVyTGFiZWxzID0gcmVxdWlyZSgnLi4vTEMvVUlTbGlkZXJMYWJlbHMnKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbkxDLmNyZWF0ZUxhYmVsc0ZvclVJU2xpZGVyID0gc2xpZGVyTGFiZWxzLmNyZWF0ZTtcclxuTEMudXBkYXRlTGFiZWxzRm9yVUlTbGlkZXIgPSBzbGlkZXJMYWJlbHMudXBkYXRlO1xyXG5MQy51aVNsaWRlckxhYmVsc0xheW91dHMgPSBzbGlkZXJMYWJlbHMubGF5b3V0cztcclxuLy99XHJcblxyXG52YXIgdmFsaWRhdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4uL0xDL3ZhbGlkYXRpb25IZWxwZXInKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbkxDLnNldHVwVmFsaWRhdGlvbiA9IHZhbGlkYXRpb25IZWxwZXIuc2V0dXA7XHJcbkxDLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZCA9IHZhbGlkYXRpb25IZWxwZXIuc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkO1xyXG5MQy5nb1RvU3VtbWFyeUVycm9ycyA9IHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnM7XHJcbi8vfVxyXG5cclxuTEMucGxhY2VIb2xkZXIgPSByZXF1aXJlKCcuLi9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbCcpLmluaXQ7XHJcblxyXG5MQy5tYXBSZWFkeSA9IHJlcXVpcmUoJy4uL0xDL2dvb2dsZU1hcFJlYWR5Jyk7XHJcblxyXG53aW5kb3cuaXNFbXB0eVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2lzRW1wdHlTdHJpbmcnKTtcclxuXHJcbndpbmRvdy5ndWlkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vTEMvZ3VpZEdlbmVyYXRvcicpO1xyXG5cclxudmFyIHVybFV0aWxzID0gcmVxdWlyZSgnLi4vTEMvdXJsVXRpbHMnKTtcclxud2luZG93LmdldFVSTFBhcmFtZXRlciA9IHVybFV0aWxzLmdldFVSTFBhcmFtZXRlcjtcclxud2luZG93LmdldEhhc2hCYW5nUGFyYW1ldGVycyA9IHVybFV0aWxzLmdldEhhc2hCYW5nUGFyYW1ldGVycztcclxuXHJcbnZhciBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9kYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcnKTtcclxuLy97VEVNUFxyXG5MQy5kYXRlVG9JbnRlcmNoYW5nbGVTdHJpbmcgPSBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmc7XHJcbi8vfVxyXG5cclxuLy8gUGFnZXMgaW4gcG9wdXBcclxudmFyIHdlbGNvbWVQb3B1cCA9IHJlcXVpcmUoJy4vd2VsY29tZVBvcHVwJyk7XHJcbi8vdmFyIHRha2VBVG91clBvcHVwID0gcmVxdWlyZSgndGFrZUFUb3VyUG9wdXAnKTtcclxudmFyIGZhcXNQb3B1cHMgPSByZXF1aXJlKCcuL2ZhcXNQb3B1cHMnKTtcclxudmFyIGFjY291bnRQb3B1cHMgPSByZXF1aXJlKCcuL2FjY291bnRQb3B1cHMnKTtcclxudmFyIGxlZ2FsUG9wdXBzID0gcmVxdWlyZSgnLi9sZWdhbFBvcHVwcycpO1xyXG5cclxuLy8gT2xkIGF2YWlsYWJsaXR5IGNhbGVuZGFyXHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldCA9IHJlcXVpcmUoJy4vYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQnKTtcclxuLy8gTmV3IGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXIgPSByZXF1aXJlKCcuLi9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhcicpO1xyXG5cclxudmFyIGF1dG9maWxsU3VibWVudSA9IHJlcXVpcmUoJy4uL0xDL2F1dG9maWxsU3VibWVudScpO1xyXG5cclxudmFyIHRhYmJlZFdpemFyZCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLndpemFyZCcpO1xyXG5cclxudmFyIGhhc0NvbmZpcm1TdXBwb3J0ID0gcmVxdWlyZSgnLi4vTEMvaGFzQ29uZmlybVN1cHBvcnQnKTtcclxuXHJcbnZhciBwb3N0YWxDb2RlVmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4uL0xDL3Bvc3RhbENvZGVTZXJ2ZXJWYWxpZGF0aW9uJyk7XHJcblxyXG52YXIgdGFiYmVkTm90aWZpY2F0aW9ucyA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24nKTtcclxuXHJcbnZhciB0YWJzQXV0b2xvYWQgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5hdXRvbG9hZCcpO1xyXG5cclxudmFyIGhvbWVQYWdlID0gcmVxdWlyZSgnLi9ob21lJyk7XHJcblxyXG4vL3tURU1QIHJlbW92ZSBnbG9iYWwgZGVwZW5kZW5jeSBmb3IgdGhpc1xyXG53aW5kb3cuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4uL0xDL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuLy99XHJcblxyXG52YXIgcHJvdmlkZXJXZWxjb21lID0gcmVxdWlyZSgnLi9wcm92aWRlcldlbGNvbWUnKTtcclxuXHJcbi8qKlxyXG4gKiogSW5pdCBjb2RlXHJcbioqKi9cclxuJCh3aW5kb3cpLmxvYWQoZnVuY3Rpb24gKCkge1xyXG4gIC8vIERpc2FibGUgYnJvd3NlciBiZWhhdmlvciB0byBhdXRvLXNjcm9sbCB0byB1cmwgZnJhZ21lbnQvaGFzaCBlbGVtZW50IHBvc2l0aW9uOlxyXG4gIC8vIEVYQ0VQVCBpbiBEYXNoYm9hcmQ6XHJcbiAgLy8gVE9ETzogUmV2aWV3IGlmIHRoaXMgaXMgcmVxdWlyZWQgb25seSBmb3IgSG93SXRXb3JrcyBvciBzb21ldGhpbmcgbW9yZSAodGFicywgcHJvZmlsZSlcclxuICAvLyBhbmQgcmVtb3ZlIGlmIHBvc3NpYmxlIG9yIG9ubHkgb24gdGhlIGNvbmNyZXRlIGNhc2VzLlxyXG4gIGlmICghL1xcL2Rhc2hib2FyZFxcLy9pLnRlc3QobG9jYXRpb24pKVxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7ICQoJ2h0bWwsYm9keScpLnNjcm9sbFRvcCgwKTsgfSwgMSk7XHJcbn0pO1xyXG4kKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgcHJvdmlkZXJXZWxjb21lLnNob3coKTtcclxuXHJcbiAgLy8gUGxhY2Vob2xkZXIgcG9seWZpbGxcclxuICBMQy5wbGFjZUhvbGRlcigpO1xyXG5cclxuICAvLyBBdXRvZm9jdXMgcG9seWZpbGxcclxuICBMQy5hdXRvRm9jdXMoKTtcclxuXHJcbiAgLy8gR2VuZXJpYyBzY3JpcHQgZm9yIGVuaGFuY2VkIHRvb2x0aXBzIGFuZCBlbGVtZW50IGRlc2NyaXB0aW9uc1xyXG4gIExDLmluaXRUb29sdGlwcygpO1xyXG5cclxuICBhamF4Rm9ybXMuaW5pdCgpO1xyXG5cclxuICAvL3Rha2VBVG91clBvcHVwLnNob3coKTtcclxuICB3ZWxjb21lUG9wdXAuc2hvdygpO1xyXG4gIC8vIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyBmb3Igc29tZSBsaW5rcyB0aGF0IGJ5IGRlZmF1bHQgb3BlbiBhIG5ldyB0YWI6XHJcbiAgZmFxc1BvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gIGFjY291bnRQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuICBsZWdhbFBvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG5cclxuICAvLyBPbGQgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbiAgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuaW5pdChMY1VybC5MYW5nUGF0aCk7XHJcbiAgLy8gTmV3IGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG4gIGF2YWlsYWJpbGl0eUNhbGVuZGFyLldlZWtseS5lbmFibGVBbGwoKTtcclxuXHJcbiAgcG9wdXAuY29ubmVjdEFjdGlvbigpO1xyXG5cclxuICAvLyBEYXRlIFBpY2tlclxyXG4gIExDLmRhdGVQaWNrZXIuaW5pdCgpO1xyXG5cclxuICAvKiBBdXRvIGNhbGN1bGF0ZSB0YWJsZSBpdGVtcyB0b3RhbCAocXVhbnRpdHkqdW5pdHByaWNlPWl0ZW0tdG90YWwpIHNjcmlwdCAqL1xyXG4gIGF1dG9DYWxjdWxhdGUub25UYWJsZUl0ZW1zKCk7XHJcbiAgYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnkoKTtcclxuXHJcbiAgaGFzQ29uZmlybVN1cHBvcnQub24oKTtcclxuXHJcbiAgcG9zdGFsQ29kZVZhbGlkYXRpb24uaW5pdCh7IGJhc2VVcmw6IExjVXJsLkxhbmdQYXRoIH0pO1xyXG5cclxuICAvLyBUYWJiZWQgaW50ZXJmYWNlXHJcbiAgdGFic0F1dG9sb2FkLmluaXQoVGFiYmVkVVgpO1xyXG4gIFRhYmJlZFVYLmluaXQoKTtcclxuICBUYWJiZWRVWC5mb2N1c0N1cnJlbnRMb2NhdGlvbigpO1xyXG4gIFRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzKCk7XHJcbiAgc2xpZGVyVGFicy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgdGFiYmVkV2l6YXJkLmluaXQoVGFiYmVkVVgsIHtcclxuICAgIGxvYWRpbmdEZWxheTogZ0xvYWRpbmdSZXRhcmRcclxuICB9KTtcclxuXHJcbiAgdGFiYmVkTm90aWZpY2F0aW9ucy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgYXV0b2ZpbGxTdWJtZW51KCk7XHJcblxyXG4gIC8vIFRPRE86ICdsb2FkSGFzaEJhbmcnIGN1c3RvbSBldmVudCBpbiB1c2U/XHJcbiAgLy8gSWYgdGhlIGhhc2ggdmFsdWUgZm9sbG93IHRoZSAnaGFzaCBiYW5nJyBjb252ZW50aW9uLCBsZXQgb3RoZXJcclxuICAvLyBzY3JpcHRzIGRvIHRoZWlyIHdvcmsgdGhyb3VnaHQgYSAnbG9hZEhhc2hCYW5nJyBldmVudCBoYW5kbGVyXHJcbiAgaWYgKC9eIyEvLnRlc3Qod2luZG93LmxvY2F0aW9uLmhhc2gpKVxyXG4gICAgJChkb2N1bWVudCkudHJpZ2dlcignbG9hZEhhc2hCYW5nJywgd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpKTtcclxuXHJcbiAgLy8gUmVsb2FkIGJ1dHRvbnNcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnJlbG9hZC1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBHZW5lcmljIGFjdGlvbiB0byBjYWxsIGxjLmpxdWVyeSAncmVsb2FkJyBmdW5jdGlvbiBmcm9tIGFuIGVsZW1lbnQgaW5zaWRlIGl0c2VsZi5cclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAkdC5jbG9zZXN0KCR0LmRhdGEoJ3JlbG9hZC10YXJnZXQnKSkucmVsb2FkKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8qIEVuYWJsZSBmb2N1cyB0YWIgb24gZXZlcnkgaGFzaCBjaGFuZ2UsIG5vdyB0aGVyZSBhcmUgdHdvIHNjcmlwdHMgbW9yZSBzcGVjaWZpYyBmb3IgdGhpczpcclxuICAqIG9uZSB3aGVuIHBhZ2UgbG9hZCAod2hlcmU/KSxcclxuICAqIGFuZCBhbm90aGVyIG9ubHkgZm9yIGxpbmtzIHdpdGggJ3RhcmdldC10YWInIGNsYXNzLlxyXG4gICogTmVlZCBiZSBzdHVkeSBpZiBzb21ldGhpbmcgb2YgdGhlcmUgbXVzdCBiZSByZW1vdmVkIG9yIGNoYW5nZWQuXHJcbiAgKiBUaGlzIGlzIG5lZWRlZCBmb3Igb3RoZXIgYmVoYXZpb3JzIHRvIHdvcmsuICovXHJcbiAgLy8gT24gdGFyZ2V0LXRhYiBsaW5rc1xyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhLnRhcmdldC10YWInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgdGhlcmVJc1RhYiA9IFRhYmJlZFVYLmdldFRhYigkKHRoaXMpLmF0dHIoJ2hyZWYnKSk7XHJcbiAgICBpZiAodGhlcmVJc1RhYikge1xyXG4gICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIC8vIE9uIGhhc2ggY2hhbmdlXHJcbiAgaWYgKCQuZm4uaGFzaGNoYW5nZSlcclxuICAgICQod2luZG93KS5oYXNoY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgaWYgKCEvXiMhLy50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICAgICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgaWYgKHRoZXJlSXNUYWIpXHJcbiAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIC8vIEhPTUUgUEFHRSAvIFNFQVJDSCBTVFVGRlxyXG4gIGhvbWVQYWdlLmluaXQoKTtcclxuXHJcbiAgLy8gVmFsaWRhdGlvbiBhdXRvIHNldHVwIGZvciBwYWdlIHJlYWR5IGFuZCBhZnRlciBldmVyeSBhamF4IHJlcXVlc3RcclxuICAvLyBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGZvcm0gaW4gdGhlIHBhZ2UuXHJcbiAgLy8gVGhpcyBhdm9pZCB0aGUgbmVlZCBmb3IgZXZlcnkgcGFnZSB3aXRoIGZvcm0gdG8gZG8gdGhlIHNldHVwIGl0c2VsZlxyXG4gIC8vIGFsbW9zdCBmb3IgbW9zdCBvZiB0aGUgY2FzZS5cclxuICBmdW5jdGlvbiBhdXRvU2V0dXBWYWxpZGF0aW9uKCkge1xyXG4gICAgaWYgKCQoZG9jdW1lbnQpLmhhcygnZm9ybScpLmxlbmd0aClcclxuICAgICAgdmFsaWRhdGlvbkhlbHBlci5zZXR1cCgnZm9ybScpO1xyXG4gIH1cclxuICBhdXRvU2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgJChkb2N1bWVudCkuYWpheENvbXBsZXRlKGF1dG9TZXR1cFZhbGlkYXRpb24pO1xyXG5cclxuICAvLyBUT0RPOiB1c2VkIHNvbWUgdGltZT8gc3RpbGwgcmVxdWlyZWQgdXNpbmcgbW9kdWxlcz9cclxuICAvKlxyXG4gICogQ29tbXVuaWNhdGUgdGhhdCBzY3JpcHQuanMgaXMgcmVhZHkgdG8gYmUgdXNlZFxyXG4gICogYW5kIHRoZSBjb21tb24gTEMgbGliIHRvby5cclxuICAqIEJvdGggYXJlIGVuc3VyZWQgdG8gYmUgcmFpc2VkIGV2ZXIgYWZ0ZXIgcGFnZSBpcyByZWFkeSB0b28uXHJcbiAgKi9cclxuICAkKGRvY3VtZW50KVxyXG4gICAgLnRyaWdnZXIoJ2xjU2NyaXB0UmVhZHknKVxyXG4gICAgLnRyaWdnZXIoJ2xjTGliUmVhZHknKTtcclxufSk7IiwiLyoqKioqIEFWQUlMQUJJTElUWSBDQUxFTkRBUiBXSURHRVQgKioqKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4uL0xDL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9kYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcnKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0KGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY2FsZW5kYXItY29udHJvbHMgLmFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5oYXNDbGFzcygnem9vbS1hY3Rpb24nKSkge1xyXG4gICAgICAgICAgICAvLyBEbyB6b29tXHJcbiAgICAgICAgICAgIHZhciBjID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpLmZpbmQoJy5jYWxlbmRhcicpLmNsb25lKCk7XHJcbiAgICAgICAgICAgIGMuY3NzKCdmb250LXNpemUnLCAnMnB4Jyk7XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSAkdC5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAgICAgYy5kYXRhKCdwb3B1cC1jb250YWluZXInLCB0YWIpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIHRhYiwgJ2F2YWlsYWJpbGl0eS1jYWxlbmRhcicsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIC8vIE5vdGhpbmcgbW9yZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5hdmlnYXRlIGNhbGVuZGFyXHJcbiAgICAgICAgdmFyIG5leHQgPSAkdC5oYXNDbGFzcygnbmV4dC13ZWVrLWFjdGlvbicpO1xyXG4gICAgICAgIHZhciBjb250ID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpO1xyXG4gICAgICAgIHZhciBjYWxjb250ID0gY29udC5jaGlsZHJlbignLmNhbGVuZGFyLWNvbnRhaW5lcicpO1xyXG4gICAgICAgIHZhciBjYWwgPSBjYWxjb250LmNoaWxkcmVuKCcuY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsaW5mbyA9IGNvbnQuZmluZCgnLmNhbGVuZGFyLWluZm8nKTtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKGNhbC5kYXRhKCdzaG93ZWQtZGF0ZScpKTtcclxuICAgICAgICB2YXIgdXNlcklkID0gY2FsLmRhdGEoJ3VzZXItaWQnKTtcclxuICAgICAgICBpZiAobmV4dClcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgNyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgLSA3KTtcclxuICAgICAgICB2YXIgc3RyZGF0ZSA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKTtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArIFwiUHJvZmlsZS8kQXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQvV2Vlay9cIiArIGVuY29kZVVSSUNvbXBvbmVudChzdHJkYXRlKSArIFwiLz9Vc2VySUQ9XCIgKyB1c2VySWQ7XHJcbiAgICAgICAgY2FsY29udC5yZWxvYWQodXJsLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIGdldCB0aGUgbmV3IG9iamVjdDpcclxuICAgICAgICAgICAgdmFyIGNhbCA9ICQoJy5jYWxlbmRhcicsIHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLnllYXItd2VlaycpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC13ZWVrJykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5maXJzdC13ZWVrLWRheScpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC1maXJzdC1kYXknKSk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLmxhc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtbGFzdC1kYXknKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBGQVFzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBmYXFzQmFzZVVybCA9ICdIZWxwQ2VudGVyLyRGQVFzJztcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICBmYXFzQmFzZVVybCA9IChiYXNlVXJsIHx8ICcvJykgKyBmYXFzQmFzZVVybDtcclxuXHJcbiAgLy8gRW5hYmxlIEZBUXMgbGlua3MgaW4gcG9wdXBcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYVtocmVmfD1cIiNGQVFzXCJdJywgcG9wdXBGYXFzKTtcclxuXHJcbiAgLy8gQXV0byBvcGVuIGN1cnJlbnQgZG9jdW1lbnQgbG9jYXRpb24gaWYgaGFzaCBpcyBhIEZBUSBsaW5rXHJcbiAgaWYgKC9eI0ZBUXMvaS50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICBwb3B1cEZhcXMobG9jYXRpb24uaGFzaCk7XHJcbiAgfVxyXG5cclxuICAvLyByZXR1cm4gYXMgdXRpbGl0eVxyXG4gIHJldHVybiBwb3B1cEZhcXM7XHJcbn07XHJcblxyXG4vKiBQYXNzIGEgRmFxcyBAdXJsIG9yIHVzZSBhcyBhIGxpbmsgaGFuZGxlciB0byBvcGVuIHRoZSBGQVEgaW4gYSBwb3B1cFxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdXBGYXFzKHVybCkge1xyXG4gIHVybCA9IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcclxuXHJcbiAgdmFyIHVybHBhcnRzID0gdXJsLnNwbGl0KCctJyk7XHJcblxyXG4gIGlmICh1cmxwYXJ0c1swXSAhPSAnI0ZBUXMnKSB7XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdUaGUgVVJMIGlzIG5vdCBhIEZBUSB1cmwgKGRvZXNuXFwndCBzdGFydHMgd2l0aCAjRkFRcy0pJywgdXJsKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgdmFyIHVybHNlY3Rpb24gPSB1cmxwYXJ0cy5sZW5ndGggPiAxID8gdXJscGFydHNbMV0gOiAnJztcclxuXHJcbiAgaWYgKHVybHNlY3Rpb24pIHtcclxuICAgIHZhciBwdXAgPSBwb3B1cChmYXFzQmFzZVVybCArIHVybHNlY3Rpb24sICdsYXJnZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGQgPSAkKHVybCksXHJcbiAgICAgICAgcGVsID0gcHVwLmdldENvbnRlbnRFbGVtZW50KCk7XHJcbiAgICAgIHBlbC5zY3JvbGxUb3AocGVsLnNjcm9sbFRvcCgpICsgZC5wb3NpdGlvbigpLnRvcCAtIDUwKTtcclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZC5lZmZlY3QoXCJoaWdobGlnaHRcIiwge30sIDIwMDApO1xyXG4gICAgICB9LCA0MDApO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufSIsIi8qIElOSVQgKi9cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gTG9jYXRpb24ganMtZHJvcGRvd25cclxuICAgIHZhciBzID0gJCgnI3NlYXJjaC1sb2NhdGlvbicpO1xyXG4gICAgcy5wcm9wKCdyZWFkb25seScsIHRydWUpO1xyXG4gICAgcy5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgIHNvdXJjZTogTEMuc2VhcmNoTG9jYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBhdXRvRm9jdXM6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIG1pbkxlbmd0aDogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgc2VsZWN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHMub24oJ2ZvY3VzIGNsaWNrJywgZnVuY3Rpb24gKCkgeyBzLmF1dG9jb21wbGV0ZSgnc2VhcmNoJywgJycpOyB9KTtcclxuXHJcbiAgICAvKiBQb3NpdGlvbnMgYXV0b2NvbXBsZXRlICovXHJcbiAgICB2YXIgcG9zaXRpb25zQXV0b2NvbXBsZXRlID0gJCgnI3NlYXJjaC1zZXJ2aWNlJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgICAgICAgLy8kKHRoaXMpLnZhbCh1aS5pdGVtLmxhYmVsKTtcclxuICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICAgICAvLyQodGhpcykudmFsKHVpLml0ZW0ubGFiZWwpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBMb2FkIGFsbCBwb3NpdGlvbnMgaW4gYmFja2dyb3VuZCB0byByZXBsYWNlIHRoZSBhdXRvY29tcGxldGUgc291cmNlIChhdm9pZGluZyBtdWx0aXBsZSwgc2xvdyBsb29rLXVwcylcclxuICAgIC8qJC5nZXRKU09OKExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdvcHRpb24nLCAnc291cmNlJywgZGF0YSk7XHJcbiAgICB9XHJcbiAgICApOyovXHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIExlZ2FsIHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJy52aWV3LXByaXZhY3ktcG9saWN5JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBvcHVwKGJhc2VVcmwgKyAnSGVscENlbnRlci8kUHJpdmFjeVBvbGljeS8nLCAnbGFyZ2UnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcudmlldy10ZXJtcy1vZi11c2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcG9wdXAoYmFzZVVybCArICdIZWxwQ2VudGVyLyRUZXJtc09mVXNlLycsICdsYXJnZScpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4qIFByb3ZpZGVyIFdlbGNvbWUgcGFnZVxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgU2ltcGxlU2xpZGVyID0gcmVxdWlyZSgnTEMvU2ltcGxlU2xpZGVyJyk7XHJcblxyXG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbiBwcm92aWRlcldlbGNvbWUoKSB7XHJcbiAgJCgnLlByb3ZpZGVyV2VsY29tZSAuUHJvdmlkZXJXZWxjb21lLXByZXNlbnRhdGlvbicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHQgPSAkKHRoaXMpLFxyXG4gICAgICBzbGlkZXIgPSBuZXcgU2ltcGxlU2xpZGVyKHtcclxuICAgICAgICBlbGVtZW50OiB0LFxyXG4gICAgICAgIHNlbGVjdG9yczoge1xyXG4gICAgICAgICAgc2xpZGVzOiAnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tc2xpZGVzJyxcclxuICAgICAgICAgIHNsaWRlOiAnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tc2xpZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjdXJyZW50U2xpZGVDbGFzczogJ2pzLWlzQ3VycmVudCcsXHJcbiAgICAgICAgaHJlZlByZWZpeDogJ2dvU2xpZGVfJyxcclxuICAgICAgICAvLyBEdXJhdGlvbiBvZiBlYWNoIHNsaWRlIGluIG1pbGxpc2Vjb25kc1xyXG4gICAgICAgIGR1cmF0aW9uOiAxMDAwXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIC8vIFNsaWRlIHN0ZXBzIGFjdGlvbnMgaW5pdGlhbGx5IGhpZGRlbiwgdmlzaWJsZSBhZnRlciAnc3RhcnQnXHJcbiAgICB2YXIgc2xpZGVzQWN0aW9ucyA9IHQuZmluZCgnLlByb3ZpZGVyV2VsY29tZS1wcmVzZW50YXRpb24tYWN0aW9ucy1zbGlkZXMnKS5oaWRlKCk7XHJcbiAgICB0LmZpbmQoJy5Qcm92aWRlcldlbGNvbWUtcHJlc2VudGF0aW9uLWFjdGlvbnMtc3RhcnQgLnN0YXJ0LWFjdGlvbicpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgJCh0aGlzKS5oaWRlKCk7XHJcbiAgICAgIHNsaWRlc0FjdGlvbnMuZmFkZUluKDEwMDApO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4qIFdlbGNvbWUgcG9wdXBcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gYm9vdHN0cmFwIHRvb2x0aXBzOlxyXG5yZXF1aXJlKCdib290c3RyYXAnKTtcclxuLy9UT0RPIG1vcmUgZGVwZW5kZW5jaWVzP1xyXG5cclxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24gd2VsY29tZVBvcHVwKCkge1xyXG4gIHZhciBjID0gJCgnI3dlbGNvbWVwb3B1cCcpO1xyXG4gIGlmIChjLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xyXG4gIHZhciBza2lwU3RlcDEgPSBjLmhhc0NsYXNzKCdzZWxlY3QtcG9zaXRpb24nKTtcclxuXHJcbiAgLy8gSW5pdFxyXG4gIGlmICghc2tpcFN0ZXAxKSB7XHJcbiAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEsIC50ZXJtcywgLnBvc2l0aW9uLWRlc2NyaXB0aW9uJykuaGlkZSgpO1xyXG4gIH1cclxuICBjLmZpbmQoJ2Zvcm0nKS5nZXQoMCkucmVzZXQoKTtcclxuXHJcbiAgLy8gRGVzY3JpcHRpb24gc2hvdy11cCBvbiBhdXRvY29tcGxldGUgdmFyaWF0aW9uc1xyXG4gIHZhciBzaG93UG9zaXRpb25EZXNjcmlwdGlvbiA9IHtcclxuICAgIC8qKlxyXG4gICAgU2hvdyBkZXNjcmlwdGlvbiBpbiBhIHRleHRhcmVhIHVuZGVyIHRoZSBwb3NpdGlvbiBzaW5ndWxhcixcclxuICAgIGl0cyBzaG93ZWQgb24gZGVtYW5kLlxyXG4gICAgKiovXHJcbiAgICB0ZXh0YXJlYTogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICBjLmZpbmQoJy5wb3NpdGlvbi1kZXNjcmlwdGlvbicpXHJcbiAgICAgIC5zbGlkZURvd24oJ2Zhc3QnKVxyXG4gICAgICAuZmluZCgndGV4dGFyZWEnKS52YWwodWkuaXRlbS5kZXNjcmlwdGlvbik7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICBTaG93IGRlc2NyaXB0aW9uIGluIGEgdG9vbHRpcCB0aGF0IGNvbWVzIGZyb20gdGhlIHBvc2l0aW9uIHNpbmd1bGFyXHJcbiAgICBmaWVsZFxyXG4gICAgKiovXHJcbiAgICB0b29sdGlwOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgIC8vIEl0IG5lZWRzIHRvIGJlIGRlc3Ryb3llZCAobm8gcHJvYmxlbSB0aGUgZmlyc3QgdGltZSlcclxuICAgICAgLy8gdG8gZ2V0IGl0IHVwZGF0ZWQgb24gc3VjY2VzaXZlIGF0dGVtcHRzXHJcbiAgICAgIHZhciBlbCA9ICQodGhpcyk7XHJcbiAgICAgIGVsXHJcbiAgICAgIC5wb3BvdmVyKCdkZXN0cm95JylcclxuICAgICAgLnBvcG92ZXIoe1xyXG4gICAgICAgIHRpdGxlOiAnRG9lcyB0aGlzIHNvdW5kIGxpa2UgeW91PycsXHJcbiAgICAgICAgY29udGVudDogdWkuaXRlbS5kZXNjcmlwdGlvbixcclxuICAgICAgICB0cmlnZ2VyOiAnZm9jdXMnLFxyXG4gICAgICAgIHBsYWNlbWVudDogJ2xlZnQnXHJcbiAgICAgIH0pXHJcbiAgICAgIC5wb3BvdmVyKCdzaG93JylcclxuICAgICAgLy8gSGlkZSBvbiBwb3NzaWJsZSBwb3NpdGlvbiBuYW1lIGNoYW5nZSB0byBhdm9pZCBjb25mdXNpb25zXHJcbiAgICAgIC8vICh3ZSBjYW4ndCB1c2Ugb24tY2hhbmdlLCBuZWVkIHRvIGJlIGtleXByZXNzOyBpdHMgbmFtZXNwYWNlZFxyXG4gICAgICAvLyB0byBsZXQgb2ZmIGFuZCBvbiBldmVyeSB0aW1lIHRvIGF2b2lkIG11bHRpcGxlIGhhbmRsZXIgcmVnaXN0cmF0aW9ucylcclxuICAgICAgLm9mZigna2V5cHJlc3MuZGVzY3JpcHRpb24tdG9vbHRpcCcpXHJcbiAgICAgIC5vbigna2V5cHJlc3MuLmRlc2NyaXB0aW9uLXRvb2x0aXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZWwucG9wb3ZlcignaGlkZScpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gUmUtZW5hYmxlIGF1dG9jb21wbGV0ZTpcclxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgYy5maW5kKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTsgfSwgNTAwKTtcclxuICBmdW5jdGlvbiBzZXR1cFBvc2l0aW9uQXV0b2NvbXBsZXRlKHNlbGV0Q2FsbGJhY2spIHtcclxuICAgIGMuZmluZCgnW25hbWU9am9idGl0bGVdJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgLy8gTm8gdmFsdWUsIG5vIGFjdGlvbiA6KFxyXG4gICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0udmFsdWUpIHJldHVybjtcclxuICAgICAgICAvLyBTYXZlIHRoZSBpZCAodmFsdWUpIGluIHRoZSBoaWRkZW4gZWxlbWVudFxyXG4gICAgICAgIGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF0nKS52YWwodWkuaXRlbS52YWx1ZSk7XHJcblxyXG4gICAgICAgIHNlbGV0Q2FsbGJhY2suY2FsbCh0aGlzLCBldmVudCwgdWkpO1xyXG5cclxuICAgICAgICAvLyBXZSB3YW50IHRvIHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSxcclxuICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpIHJldHVybiBmYWxzZTtcclxuICAgICAgICAvLyBXZSB3YW50IHRoZSBsYWJlbCBpbiB0ZXh0Ym94LCBub3QgdGhlIHZhbHVlXHJcbiAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuICBzZXR1cFBvc2l0aW9uQXV0b2NvbXBsZXRlKHNob3dQb3NpdGlvbkRlc2NyaXB0aW9uLnRvb2x0aXApO1xyXG4gIGMuZmluZCgnI3dlbGNvbWVwb3B1cExvYWRpbmcnKS5yZW1vdmUoKTtcclxuXHJcbiAgLy8gQWN0aW9uc1xyXG4gIGMub24oJ2NoYW5nZScsICcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXScsIGZ1bmN0aW9uICgpIHtcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaTpub3QoLicgKyB0aGlzLnZhbHVlICsgJyknKS5oaWRlKCk7XHJcbiAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSwgaGVhZGVyIC5wcmVzZW50YXRpb24nKS5zbGlkZVVwKCdmYXN0Jyk7XHJcbiAgICBjLmZpbmQoJy50ZXJtcywgLnByb2ZpbGUtZGF0YScpLnNsaWRlRG93bignZmFzdCcpO1xyXG4gICAgLy8gVGVybXMgb2YgdXNlIGRpZmZlcmVudCBmb3IgcHJvZmlsZSB0eXBlXHJcbiAgICBpZiAodGhpcy52YWx1ZSA9PSAnY3VzdG9tZXInKVxyXG4gICAgICBjLmZpbmQoJ2EudGVybXMtb2YtdXNlJykuZGF0YSgndG9vbHRpcC11cmwnLCBudWxsKTtcclxuICAgIC8vIENoYW5nZSBmYWNlYm9vayByZWRpcmVjdCBsaW5rXHJcbiAgICB2YXIgZmJjID0gYy5maW5kKCcuZmFjZWJvb2stY29ubmVjdCcpO1xyXG4gICAgdmFyIGFkZFJlZGlyZWN0ID0gJ2N1c3RvbWVycyc7XHJcbiAgICBpZiAodGhpcy52YWx1ZSA9PSAncHJvdmlkZXInKVxyXG4gICAgICBhZGRSZWRpcmVjdCA9ICdwcm92aWRlcnMnO1xyXG4gICAgZmJjLmRhdGEoJ3JlZGlyZWN0JywgZmJjLmRhdGEoJ3JlZGlyZWN0JykgKyBhZGRSZWRpcmVjdCk7XHJcbiAgICBmYmMuZGF0YSgncHJvZmlsZScsIHRoaXMudmFsdWUpO1xyXG5cclxuICAgIC8vIFNldCB2YWxpZGF0aW9uLXJlcXVpcmVkIGZvciBkZXBlbmRpbmcgb2YgcHJvZmlsZS10eXBlIGZvcm0gZWxlbWVudHM6XHJcbiAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGkuJyArIHRoaXMudmFsdWUgKyAnIGlucHV0Om5vdChbZGF0YS12YWxdKTpub3QoW3R5cGU9aGlkZGVuXSknKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRhLXZhbC1yZXF1aXJlZCcsICcnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCdkYXRhLXZhbCcsIHRydWUpO1xyXG4gICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgfSk7XHJcbiAgYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZnVuY3Rpb24gKCkge1xyXG4gICAgc2V0dXBQb3NpdGlvbkF1dG9jb21wbGV0ZShzaG93UG9zaXRpb25EZXNjcmlwdGlvbi50b29sdGlwKTtcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV06Y2hlY2tlZCcpLmNoYW5nZSgpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBJZiBwcm9maWxlIHR5cGUgaXMgcHJlZmlsbGVkIGJ5IHJlcXVlc3Q6XHJcbiAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXTpjaGVja2VkJykuY2hhbmdlKCk7XHJcbn07XHJcbiJdfQ==
