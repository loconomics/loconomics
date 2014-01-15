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
},{"./LcUrl":5,"./blockPresets":23,"./loader":43,"./popup":48,"./redirectTo":50}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
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
},{"./mathUtils":44}],7:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
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
},{"./jquery.reload":40}],11:[function(require,module,exports){
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

},{"./changesNotification":24,"./smoothBoxBlock":52}],12:[function(require,module,exports){
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
},{"./jquery.hasScrollBar":37}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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
},{"./ajaxCallbacks":18,"./blockPresets":23,"./changesNotification":24,"./popup":48,"./redirectTo":50,"./validationHelper":55}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
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
function roundTimeToQuarterHour(/* TimeSpan */time, /* LC.roundingTypeEnum */roundTo) {
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

},{"./TimeSpan":15,"./mathUtils":44}],17:[function(require,module,exports){
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

},{"./TimeSpan":15,"./mathUtils":44,"./tooltips":53}],18:[function(require,module,exports){
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

        // For 'reload' support, check too the context.mode
        ctx.boxIsContainer = ctx.boxIsContainer || (ctx.options && ctx.options.mode === 'replace-content');

        // Check if the returned element is the ajax-box, if not, find
        // the element in the newhtml:
        var jb = newhtml;
        if (!ctx.boxIsContainer && !newhtml.is('.ajax-box'))
            jb = newhtml.find('.ajax-box:eq(0)');
        if (!jb || jb.length === 0) {
            // There is no ajax-box, use all element returned:
            jb = newhtml;
        }
        if (ctx.boxIsContainer) {
            // jb is content of the box container:
            ctx.box.html(jb);
        } else {
            // box is content that must be replaced by the new content:
            ctx.box.replaceWith(jb);
            // and refresh the reference to box with the new element
            ctx.box = jb;
        }
        if (ctx.box.is('form'))
            ctx.form = ctx.box;
        else
            ctx.form = ctx.box.find('form:eq(0)');

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
},{"./changesNotification":24,"./createIframe":25,"./moveFocusTo":45,"./popup":48,"./redirectTo":50,"./smoothBoxBlock":52,"./validationHelper":55}],19:[function(require,module,exports){
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
    var data = ctx.form.find(':input').serialize();

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

    // Loading, with retard
    ctx.loadingtimer = setTimeout(function () {
        ctx.box.block(blockPresets.loading);
    }, settings.loadingDelay);
    ctx.autoUnblockLoading = true;

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
},{"./ajaxCallbacks":18,"./blockPresets":23,"./changesNotification":24,"./validationHelper":55}],20:[function(require,module,exports){
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
},{"./numberUtils":46}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
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
},{}],24:[function(require,module,exports){
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
},{"./getXPath":30,"./jqueryUtils":42}],25:[function(require,module,exports){
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


},{}],26:[function(require,module,exports){
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
          dtr.reload({
            url: function (url, defaultUrl) {
              return defaultUrl + '?' + $.param(formpars) + xq;
            },
            success: function() {
              dtr.xshow(instance.settings.effects['show-editor']);
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
          dtr.reload({
            url: function (url, defaultUrl) {
              return defaultUrl + '?' + $.param(formpars) + xq;
            },
            success: function(){
              dtr.xshow(instance.settings.effects['show-editor']);
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
        });

        crudl.data('__crudl_initialized__', true);
      });

      return instance;
    }
  };
};

},{"./changesNotification":24,"./getText":29,"./jquery.xtsh":41,"./smoothBoxBlock":52}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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
},{}],29:[function(require,module,exports){
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
},{"./jqueryUtils":42}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
// It executes the given 'ready' function as parameter when
// map environment is ready (when google maps api and script is
// loaded and ready to use, or inmediately if is already loaded).

var loader = require('./loader');

module.exports = function googleMapReady(ready) {
    var stack = googleMapReady.stack || [];
    stack.push(ready);
    googleMapReady.stack = stack;

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
},{"./loader":43}],32:[function(require,module,exports){
/* GUID Generator
 */
module.exports = function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
},{}],33:[function(require,module,exports){
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
},{}],34:[function(require,module,exports){
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
},{}],35:[function(require,module,exports){
/* Returns true when str is
- null
- empty string
- only white spaces string
*/
module.exports = function isEmptyString(str) {
    return !(/\S/g.test(str || ""));
};
},{}],36:[function(require,module,exports){
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
},{}],37:[function(require,module,exports){
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
},{}],38:[function(require,module,exports){
/** Checks if current element or one of the current set of elements has
a parent that match the element or expression given as first parameter
**/
var $ = jQuery || require('jquery');
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};
},{}],39:[function(require,module,exports){
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
},{}],40:[function(require,module,exports){
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
},{"./smoothBoxBlock":52}],41:[function(require,module,exports){
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
                    LC.toggleElement(this, $(this).is(':visible'), options);
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
},{}],42:[function(require,module,exports){
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

},{}],43:[function(require,module,exports){
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
},{}],44:[function(require,module,exports){
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
},{}],45:[function(require,module,exports){
function moveFocusTo(el, options) {
    options = $.extend({
        marginTop: 30
    }, options);
    $('html,body').stop(true, true).animate({ scrollTop: $(el).offset().top - options.marginTop }, 500, null);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = moveFocusTo;
}
},{}],46:[function(require,module,exports){
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
},{"./i18n":34,"./mathUtils":44}],47:[function(require,module,exports){
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
},{}],48:[function(require,module,exports){
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
},{"./createIframe":25,"./moveFocusTo":45,"./smoothBoxBlock":52}],49:[function(require,module,exports){
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
},{}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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
},{}],52:[function(require,module,exports){
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
},{"./autoFocus":21,"./jquery.xtsh":41,"./jqueryUtils":42,"./moveFocusTo":45}],53:[function(require,module,exports){
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

},{"./jquery.isChildOf":38,"./jquery.outerHtml":39,"./sanitizeWhitespaces":51}],54:[function(require,module,exports){
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

},{}],55:[function(require,module,exports){
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

function goToSummaryErrors(form) {
    var off = form.find('.validation-summary-errors').offset();
    if (off)
        $('html,body').stop(true, true).animate({ scrollTop: off.top }, 500);
    else
        if (console && console.error) console.error('goToSummaryErrors: no summary to focus');
}

module.exports = {
    setup: setupValidation,
    setValidationSummaryAsValid: setValidationSummaryAsValid,
    goToSummaryErrors: goToSummaryErrors
};
},{}],56:[function(require,module,exports){
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
},{}],57:[function(require,module,exports){
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

var availabilityCalendarWidget = require('./availabilityCalendarWidget');

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

  availabilityCalendarWidget.init(LcUrl.LangPath);

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
},{"../LC/Array.remove":1,"../LC/Cookie":2,"../LC/LcUrl":5,"../LC/Price":6,"../LC/String.prototype.contains":7,"../LC/StringFormat":"KqXDvj","../LC/TabbedUX":12,"../LC/TabbedUX.autoload":10,"../LC/TabbedUX.changesNotification":11,"../LC/TabbedUX.sliderTabs":13,"../LC/TabbedUX.wizard":14,"../LC/TimeSpan":15,"../LC/TimeSpanExtra":16,"../LC/UISliderLabels":17,"../LC/ajaxCallbacks":18,"../LC/ajaxForms":19,"../LC/autoCalculate":20,"../LC/autoFocus":21,"../LC/autofillSubmenu":22,"../LC/blockPresets":23,"../LC/changesNotification":24,"../LC/crudl":26,"../LC/datePicker":27,"../LC/dateToInterchangeableString":28,"../LC/getText":29,"../LC/getXPath":30,"../LC/googleMapReady":31,"../LC/guidGenerator":32,"../LC/hasConfirmSupport":33,"../LC/i18n":34,"../LC/isEmptyString":35,"../LC/jquery.are":36,"../LC/jquery.hasScrollBar":37,"../LC/jquery.reload":40,"../LC/jquery.xtsh":41,"../LC/jqueryUtils":42,"../LC/loader":43,"../LC/mathUtils":44,"../LC/moveFocusTo":45,"../LC/numberUtils":46,"../LC/placeholder-polyfill":47,"../LC/popup":48,"../LC/postalCodeServerValidation":49,"../LC/sanitizeWhitespaces":51,"../LC/smoothBoxBlock":52,"../LC/tooltips":53,"../LC/urlUtils":54,"../LC/validationHelper":55,"./accountPopups":56,"./availabilityCalendarWidget":58,"./faqsPopups":59,"./home":60,"./legalPopups":61,"./welcomePopup":62}],58:[function(require,module,exports){
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
},{"../LC/dateToInterchangeableString":28,"../LC/jquery.reload":40,"../LC/smoothBoxBlock":52}],59:[function(require,module,exports){
/**
    Enable the use of popups to show links to FAQs (default links behavior is to open in a new tab)
**/
var $ = require('jquery');

exports.enable = function (baseUrl) {
    $(document).on('click', 'a[href|="#FAQs"]', function () {
        var href = $(this).attr('href');
        var urlparts = href.split('-');
        var urlsection = '';
        if (urlparts.length > 1) {
            urlsection = urlparts[1];
        }
        urlsection += '#' + href;
        var urlprefix = "HelpCenter/$FAQs";
        if (urlsection)
            popup(baseUrl + urlprefix + urlsection, 'large');
        return false;
    });
};
},{}],60:[function(require,module,exports){
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
},{}],61:[function(require,module,exports){
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
},{}],62:[function(require,module,exports){
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

},{}]},{},[57,"cwp+TC"])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0FycmF5LnJlbW92ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9Db29raWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvRmFjZWJvb2tDb25uZWN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0xjVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1ByaWNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nRm9ybWF0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmF1dG9sb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguc2xpZGVyVGFicy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC53aXphcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW5FeHRyYS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9VSVNsaWRlckxhYmVscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Q2FsbGJhY2tzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhGb3Jtcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvQ2FsY3VsYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9Gb2N1cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvZmlsbFN1Ym1lbnUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYmxvY2tQcmVzZXRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvY3JlYXRlSWZyYW1lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFRleHQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ29vZ2xlTWFwUmVhZHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ3VpZEdlbmVyYXRvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9oYXNDb25maXJtU3VwcG9ydC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pMThuLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2lzRW1wdHlTdHJpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmFyZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5pc0NoaWxkT2YuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lm91dGVySHRtbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkucmVsb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS54dHNoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeVV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2xvYWRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tYXRoVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbnVtYmVyVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcGxhY2Vob2xkZXItcG9seWZpbGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Ntb290aEJveEJsb2NrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Rvb2x0aXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3VybFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3ZhbGlkYXRpb25IZWxwZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FjY291bnRQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FwcC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2ZhcXNQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2xlZ2FsUG9wdXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC93ZWxjb21lUG9wdXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQXJyYXkgUmVtb3ZlIC0gQnkgSm9obiBSZXNpZyAoTUlUIExpY2Vuc2VkKVxyXG4vKkFycmF5LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcclxuSWFnb1NSTDogaXQgc2VlbXMgaW5jb21wYXRpYmxlIHdpdGggTW9kZXJuaXpyIGxvYWRlciBmZWF0dXJlIGxvYWRpbmcgWmVuZGVzayBzY3JpcHQsXHJcbm1vdmVkIGZyb20gcHJvdG90eXBlIHRvIGEgY2xhc3Mtc3RhdGljIG1ldGhvZCAqL1xyXG5mdW5jdGlvbiBhcnJheVJlbW92ZShhbkFycmF5LCBmcm9tLCB0bykge1xyXG4gICAgdmFyIHJlc3QgPSBhbkFycmF5LnNsaWNlKCh0byB8fCBmcm9tKSArIDEgfHwgYW5BcnJheS5sZW5ndGgpO1xyXG4gICAgYW5BcnJheS5sZW5ndGggPSBmcm9tIDwgMCA/IGFuQXJyYXkubGVuZ3RoICsgZnJvbSA6IGZyb207XHJcbiAgICByZXR1cm4gYW5BcnJheS5wdXNoLmFwcGx5KGFuQXJyYXksIHJlc3QpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXJyYXlSZW1vdmU7XHJcbn0gZWxzZSB7XHJcbiAgICBBcnJheS5yZW1vdmUgPSBhcnJheVJlbW92ZTtcclxufSIsIi8qKlxyXG4qIENvb2tpZXMgbWFuYWdlbWVudC5cclxuKiBNb3N0IGNvZGUgZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80ODI1Njk1LzE2MjIzNDZcclxuKi9cclxudmFyIENvb2tpZSA9IHt9O1xyXG5cclxuQ29va2llLnNldCA9IGZ1bmN0aW9uIHNldENvb2tpZShuYW1lLCB2YWx1ZSwgZGF5cykge1xyXG4gICAgdmFyIGV4cGlyZXMgPSBcIlwiO1xyXG4gICAgaWYgKGRheXMpIHtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XHJcbiAgICAgICAgZGF0ZS5zZXRUaW1lKGRhdGUuZ2V0VGltZSgpICsgKGRheXMgKiAyNCAqIDYwICogNjAgKiAxMDAwKSk7XHJcbiAgICAgICAgZXhwaXJlcyA9IFwiOyBleHBpcmVzPVwiICsgZGF0ZS50b0dNVFN0cmluZygpO1xyXG4gICAgfVxyXG4gICAgZG9jdW1lbnQuY29va2llID0gbmFtZSArIFwiPVwiICsgdmFsdWUgKyBleHBpcmVzICsgXCI7IHBhdGg9L1wiO1xyXG59O1xyXG5Db29raWUuZ2V0ID0gZnVuY3Rpb24gZ2V0Q29va2llKGNfbmFtZSkge1xyXG4gICAgaWYgKGRvY3VtZW50LmNvb2tpZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY19zdGFydCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKGNfbmFtZSArIFwiPVwiKTtcclxuICAgICAgICBpZiAoY19zdGFydCAhPSAtMSkge1xyXG4gICAgICAgICAgICBjX3N0YXJ0ID0gY19zdGFydCArIGNfbmFtZS5sZW5ndGggKyAxO1xyXG4gICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5pbmRleE9mKFwiO1wiLCBjX3N0YXJ0KTtcclxuICAgICAgICAgICAgaWYgKGNfZW5kID09IC0xKSB7XHJcbiAgICAgICAgICAgICAgICBjX2VuZCA9IGRvY3VtZW50LmNvb2tpZS5sZW5ndGg7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHVuZXNjYXBlKGRvY3VtZW50LmNvb2tpZS5zdWJzdHJpbmcoY19zdGFydCwgY19lbmQpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gXCJcIjtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gQ29va2llOyIsIi8qKiBDb25uZWN0IGFjY291bnQgd2l0aCBGYWNlYm9va1xyXG4qKi9cclxudmFyXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyksXHJcbiAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBwb3B1cCA9IHJlcXVpcmUoJy4vcG9wdXAnKSxcclxuICByZWRpcmVjdFRvID0gcmVxdWlyZSgnLi9yZWRpcmVjdFRvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5mdW5jdGlvbiBGYWNlYm9va0Nvbm5lY3Qob3B0aW9ucykge1xyXG4gICQuZXh0ZW5kKHRoaXMsIG9wdGlvbnMpO1xyXG4gIGlmICghJCgnI2ZiLXJvb3QnKS5sZW5ndGgpXHJcbiAgICAkKCc8ZGl2IGlkPVwiZmItcm9vdFwiIHN0eWxlPVwiZGlzcGxheTogbm9uZVwiPjwvZGl2PicpLmFwcGVuZFRvKCdib2R5Jyk7XHJcbn1cclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUgPSB7XHJcbiAgYXBwSWQ6IG51bGwsXHJcbiAgbGFuZzogJ2VuX1VTJyxcclxuICByZXN1bHRUeXBlOiAnanNvbicsIC8vICdyZWRpcmVjdCdcclxuICBmYlVybEJhc2U6ICcvL2Nvbm5lY3QuZmFjZWJvb2submV0L0AobGFuZykvYWxsLmpzJyxcclxuICBzZXJ2ZXJVcmxCYXNlOiBMY1VybC5MYW5nUGF0aCArICdBY2NvdW50L0ZhY2Vib29rL0AodXJsU2VjdGlvbikvP1JlZGlyZWN0PUAocmVkaXJlY3RVcmwpJnByb2ZpbGU9QChwcm9maWxlVXJsKScsXHJcbiAgcmVkaXJlY3RVcmw6ICcnLFxyXG4gIHByb2ZpbGVVcmw6ICcnLFxyXG4gIHVybFNlY3Rpb246ICcnLFxyXG4gIGxvYWRpbmdUZXh0OiAnVmVyaWZpbmcnLFxyXG4gIHBlcm1pc3Npb25zOiAnJyxcclxuICBsaWJMb2FkZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdExpYkxvYWRlZCcsXHJcbiAgY29ubmVjdGVkRXZlbnQ6ICdGYWNlYm9va0Nvbm5lY3RDb25uZWN0ZWQnXHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldEZiVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuZmJVcmxCYXNlLnJlcGxhY2UoL0BcXChsYW5nXFwpL2csIHRoaXMubGFuZyk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmdldFNlcnZlclVybCA9IGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiB0aGlzLnNlcnZlclVybEJhc2VcclxuICAucmVwbGFjZSgvQFxcKHJlZGlyZWN0VXJsXFwpL2csIHRoaXMucmVkaXJlY3RVcmwpXHJcbiAgLnJlcGxhY2UoL0BcXChwcm9maWxlVXJsXFwpL2csIHRoaXMucHJvZmlsZVVybClcclxuICAucmVwbGFjZSgvQFxcKHVybFNlY3Rpb25cXCkvZywgdGhpcy51cmxTZWN0aW9uKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUubG9hZExpYiA9IGZ1bmN0aW9uICgpIHtcclxuICAvLyBPbmx5IGlmIGlzIG5vdCBsb2FkZWQgc3RpbGxcclxuICAvLyAoRmFjZWJvb2sgc2NyaXB0IGF0dGFjaCBpdHNlbGYgYXMgdGhlIGdsb2JhbCB2YXJpYWJsZSAnRkInKVxyXG4gIGlmICghd2luZG93LkZCICYmICF0aGlzLl9sb2FkaW5nTGliKSB7XHJcbiAgICB0aGlzLl9sb2FkaW5nTGliID0gdHJ1ZTtcclxuICAgIHZhciB0aGF0ID0gdGhpcztcclxuICAgIGxvYWRlci5sb2FkKHtcclxuICAgICAgc2NyaXB0czogW3RoaXMuZ2V0RmJVcmwoKV0sXHJcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgRkIuaW5pdCh7IGFwcElkOiB0aGF0LmFwcElkLCBzdGF0dXM6IHRydWUsIGNvb2tpZTogdHJ1ZSwgeGZibWw6IHRydWUgfSk7XHJcbiAgICAgICAgdGhhdC5sb2FkaW5nTGliID0gZmFsc2U7XHJcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcih0aGF0LmxpYkxvYWRlZEV2ZW50KTtcclxuICAgICAgfSxcclxuICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gISF3aW5kb3cuRkI7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUucHJvY2Vzc1Jlc3BvbnNlID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgaWYgKHJlc3BvbnNlLmF1dGhSZXNwb25zZSkge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBXZWxjb21lIScpO1xyXG4gICAgdmFyIHVybCA9IHRoaXMuZ2V0U2VydmVyVXJsKCk7XHJcbiAgICBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwicmVkaXJlY3RcIikge1xyXG4gICAgICByZWRpcmVjdFRvKHVybCk7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMucmVzdWx0VHlwZSA9PSBcImpzb25cIikge1xyXG4gICAgICBwb3B1cCh1cmwsICdzbWFsbCcsIG51bGwsIHRoaXMubG9hZGluZ1RleHQpO1xyXG4gICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoaXMuY29ubmVjdGVkRXZlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qRkIuYXBpKCcvbWUnLCBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICAgIGNvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IEdvb2QgdG8gc2VlIHlvdSwgJyArIHJlc3BvbnNlLm5hbWUgKyAnLicpO1xyXG4gICAgfSk7Ki9cclxuICB9IGVsc2Uge1xyXG4gICAgLy9jb25zb2xlLmxvZygnRmFjZWJvb2tDb25uZWN0OiBVc2VyIGNhbmNlbGxlZCBsb2dpbiBvciBkaWQgbm90IGZ1bGx5IGF1dGhvcml6ZS4nKTtcclxuICB9XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLm9uTGliUmVhZHkgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICBpZiAod2luZG93LkZCKVxyXG4gICAgY2FsbGJhY2soKTtcclxuICBlbHNlIHtcclxuICAgIHRoaXMubG9hZExpYigpO1xyXG4gICAgJChkb2N1bWVudCkub24odGhpcy5saWJMb2FkZWRFdmVudCwgY2FsbGJhY2spO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdGhpcy5vbkxpYlJlYWR5KGZ1bmN0aW9uICgpIHtcclxuICAgIEZCLmxvZ2luKCQucHJveHkodGhhdC5wcm9jZXNzUmVzcG9uc2UsIHRoYXQpLCB7IHNjb3BlOiB0aGF0LnBlcm1pc3Npb25zIH0pO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5hdXRvQ29ubmVjdE9uID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgalF1ZXJ5KGRvY3VtZW50KS5vbignY2xpY2snLCBzZWxlY3RvciB8fCAnYS5mYWNlYm9vay1jb25uZWN0JywgJC5wcm94eSh0aGlzLmNvbm5lY3QsIHRoaXMpKTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRmFjZWJvb2tDb25uZWN0OyIsIi8qKiBJbXBsZW1lbnRzIGEgc2ltaWxhciBMY1VybCBvYmplY3QgbGlrZSB0aGUgc2VydmVyLXNpZGUgb25lLCBiYXNpbmdcclxuICAgIGluIHRoZSBpbmZvcm1hdGlvbiBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgYXQgJ2h0bWwnIHRhZyBpbiB0aGUgXHJcbiAgICAnZGF0YS1iYXNlLXVybCcgYXR0cmlidXRlICh0aGF0cyB2YWx1ZSBpcyB0aGUgZXF1aXZhbGVudCBmb3IgQXBwUGF0aCksXHJcbiAgICBhbmQgdGhlIGxhbmcgaW5mb3JtYXRpb24gYXQgJ2RhdGEtY3VsdHVyZScuXHJcbiAgICBUaGUgcmVzdCBvZiBVUkxzIGFyZSBidWlsdCBmb2xsb3dpbmcgdGhlIHdpbmRvdy5sb2NhdGlvbiBhbmQgc2FtZSBydWxlc1xyXG4gICAgdGhhbiBpbiB0aGUgc2VydmVyLXNpZGUgb2JqZWN0LlxyXG4qKi9cclxuXHJcbnZhciBiYXNlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1iYXNlLXVybCcpLFxyXG4gICAgbGFuZyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpLFxyXG4gICAgbCA9IHdpbmRvdy5sb2NhdGlvbixcclxuICAgIHVybCA9IGwucHJvdG9jb2wgKyAnLy8nICsgbC5ob3N0O1xyXG4vLyBsb2NhdGlvbi5ob3N0IGluY2x1ZGVzIHBvcnQsIGlmIGlzIG5vdCB0aGUgZGVmYXVsdCwgdnMgbG9jYXRpb24uaG9zdG5hbWVcclxuXHJcbmJhc2UgPSBiYXNlIHx8ICcvJztcclxuXHJcbnZhciBMY1VybCA9IHtcclxuICAgIFNpdGVVcmw6IHVybCxcclxuICAgIEFwcFBhdGg6IGJhc2UsXHJcbiAgICBBcHBVcmw6IHVybCArIGJhc2UsXHJcbiAgICBMYW5nSWQ6IGxhbmcsXHJcbiAgICBMYW5nUGF0aDogYmFzZSArIGxhbmcgKyAnLycsXHJcbiAgICBMYW5nVXJsOiB1cmwgKyBiYXNlICsgbGFuZ1xyXG59O1xyXG5MY1VybC5MYW5nVXJsID0gdXJsICsgTGNVcmwuTGFuZ1BhdGg7XHJcbkxjVXJsLkpzb25QYXRoID0gTGNVcmwuTGFuZ1BhdGggKyAnSlNPTi8nO1xyXG5MY1VybC5Kc29uVXJsID0gdXJsICsgTGNVcmwuSnNvblBhdGg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjVXJsOyIsIi8qIExvY29ub21pY3Mgc3BlY2lmaWMgUHJpY2UsIGZlZXMgYW5kIGhvdXItcHJpY2UgY2FsY3VsYXRpb25cclxuICAgIHVzaW5nIHNvbWUgc3RhdGljIG1ldGhvZHMgYW5kIHRoZSBQcmljZSBjbGFzcy5cclxuKi9cclxudmFyIG11ID0gcmVxdWlyZSgnLi9tYXRoVXRpbHMnKTtcclxuXHJcbi8qIENsYXNzIFByaWNlIHRvIGNhbGN1bGF0ZSBhIHRvdGFsIHByaWNlIGJhc2VkIG9uIGZlZXMgaW5mb3JtYXRpb24gKGZpeGVkIGFuZCByYXRlKVxyXG4gICAgYW5kIGRlc2lyZWQgZGVjaW1hbHMgZm9yIGFwcHJveGltYXRpb25zLlxyXG4qL1xyXG5mdW5jdGlvbiBQcmljZShiYXNlUHJpY2UsIGZlZSwgcm91bmRlZERlY2ltYWxzKSB7XHJcbiAgICAvLyBmZWUgcGFyYW1ldGVyIGNhbiBiZSBhIGZsb2F0IG51bWJlciB3aXRoIHRoZSBmZWVSYXRlIG9yIGFuIG9iamVjdFxyXG4gICAgLy8gdGhhdCBpbmNsdWRlcyBib3RoIGEgZmVlUmF0ZSBhbmQgYSBmaXhlZEZlZUFtb3VudFxyXG4gICAgLy8gRXh0cmFjdGluZyBmZWUgdmFsdWVzIGludG8gbG9jYWwgdmFyczpcclxuICAgIHZhciBmZWVSYXRlID0gMCwgZml4ZWRGZWVBbW91bnQgPSAwO1xyXG4gICAgaWYgKGZlZS5maXhlZEZlZUFtb3VudCB8fCBmZWUuZmVlUmF0ZSkge1xyXG4gICAgICAgIGZpeGVkRmVlQW1vdW50ID0gZmVlLmZpeGVkRmVlQW1vdW50IHx8IDA7XHJcbiAgICAgICAgZmVlUmF0ZSA9IGZlZS5mZWVSYXRlIHx8IDA7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBmZWVSYXRlID0gZmVlO1xyXG5cclxuICAgIC8vIENhbGN1bGF0aW5nOlxyXG4gICAgLy8gVGhlIHJvdW5kVG8gd2l0aCBhIGJpZyBmaXhlZCBkZWNpbWFscyBpcyB0byBhdm9pZCB0aGVcclxuICAgIC8vIGRlY2ltYWwgZXJyb3Igb2YgZmxvYXRpbmcgcG9pbnQgbnVtYmVyc1xyXG4gICAgdmFyIHRvdGFsUHJpY2UgPSBtdS5jZWlsVG8obXUucm91bmRUbyhiYXNlUHJpY2UgKiAoMSArIGZlZVJhdGUpICsgZml4ZWRGZWVBbW91bnQsIDEyKSwgcm91bmRlZERlY2ltYWxzKTtcclxuICAgIC8vIGZpbmFsIGZlZSBwcmljZSBpcyBjYWxjdWxhdGVkIGFzIGEgc3Vic3RyYWN0aW9uLCBidXQgYmVjYXVzZSBqYXZhc2NyaXB0IGhhbmRsZXNcclxuICAgIC8vIGZsb2F0IG51bWJlcnMgb25seSwgYSByb3VuZCBvcGVyYXRpb24gaXMgcmVxdWlyZWQgdG8gYXZvaWQgYW4gaXJyYXRpb25hbCBudW1iZXJcclxuICAgIHZhciBmZWVQcmljZSA9IG11LnJvdW5kVG8odG90YWxQcmljZSAtIGJhc2VQcmljZSwgMik7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgb2JqZWN0IHdpdGggZnVsbCBkZXRhaWxzOlxyXG4gICAgdGhpcy5iYXNlUHJpY2UgPSBiYXNlUHJpY2U7XHJcbiAgICB0aGlzLmZlZVJhdGUgPSBmZWVSYXRlO1xyXG4gICAgdGhpcy5maXhlZEZlZUFtb3VudCA9IGZpeGVkRmVlQW1vdW50O1xyXG4gICAgdGhpcy5yb3VuZGVkRGVjaW1hbHMgPSByb3VuZGVkRGVjaW1hbHM7XHJcbiAgICB0aGlzLnRvdGFsUHJpY2UgPSB0b3RhbFByaWNlO1xyXG4gICAgdGhpcy5mZWVQcmljZSA9IGZlZVByaWNlO1xyXG59XHJcblxyXG4vKiogQ2FsY3VsYXRlIGFuZCByZXR1cm5zIHRoZSBwcmljZSBhbmQgcmVsZXZhbnQgZGF0YSBhcyBhbiBvYmplY3QgZm9yXHJcbnRpbWUsIGhvdXJseVJhdGUgKHdpdGggZmVlcykgYW5kIHRoZSBob3VybHlGZWUuXHJcblRoZSB0aW1lIChAZHVyYXRpb24pIGlzIHVzZWQgJ2FzIGlzJywgd2l0aG91dCB0cmFuc2Zvcm1hdGlvbiwgbWF5YmUgeW91IGNhbiByZXF1aXJlXHJcbnVzZSBMQy5yb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyIGJlZm9yZSBwYXNzIHRoZSBkdXJhdGlvbiB0byB0aGlzIGZ1bmN0aW9uLlxyXG5JdCByZWNlaXZlcyB0aGUgcGFyYW1ldGVycyBAaG91cmx5UHJpY2UgYW5kIEBzdXJjaGFyZ2VQcmljZSBhcyBMQy5QcmljZSBvYmplY3RzLlxyXG5Ac3VyY2hhcmdlUHJpY2UgaXMgb3B0aW9uYWwuXHJcbioqL1xyXG5mdW5jdGlvbiBjYWxjdWxhdGVIb3VybHlQcmljZShkdXJhdGlvbiwgaG91cmx5UHJpY2UsIHN1cmNoYXJnZVByaWNlKSB7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBzdXJjaGFyZ2UsIGdldCB6ZXJvc1xyXG4gICAgc3VyY2hhcmdlUHJpY2UgPSBzdXJjaGFyZ2VQcmljZSB8fCB7IHRvdGFsUHJpY2U6IDAsIGZlZVByaWNlOiAwLCBiYXNlUHJpY2U6IDAgfTtcclxuICAgIC8vIEdldCBob3VycyBmcm9tIHJvdW5kZWQgZHVyYXRpb246XHJcbiAgICB2YXIgaG91cnMgPSBtdS5yb3VuZFRvKGR1cmF0aW9uLnRvdGFsSG91cnMoKSwgMik7XHJcbiAgICAvLyBDYWxjdWxhdGUgZmluYWwgcHJpY2VzXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHRvdGFsUHJpY2U6ICAgICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLnRvdGFsUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLnRvdGFsUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgZmVlUHJpY2U6ICAgICAgIG11LnJvdW5kVG8oaG91cmx5UHJpY2UuZmVlUHJpY2UgKiBob3VycyArIHN1cmNoYXJnZVByaWNlLmZlZVByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIHN1YnRvdGFsUHJpY2U6ICBtdS5yb3VuZFRvKGhvdXJseVByaWNlLmJhc2VQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UuYmFzZVByaWNlICogaG91cnMsIDIpLFxyXG4gICAgICAgIGR1cmF0aW9uSG91cnM6ICBob3Vyc1xyXG4gICAgfTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgUHJpY2U6IFByaWNlLFxyXG4gICAgICAgIGNhbGN1bGF0ZUhvdXJseVByaWNlOiBjYWxjdWxhdGVIb3VybHlQcmljZVxyXG4gICAgfTsiLCIvKiogUG9seWZpbGwgZm9yIHN0cmluZy5jb250YWluc1xyXG4qKi9cclxuaWYgKCEoJ2NvbnRhaW5zJyBpbiBTdHJpbmcucHJvdG90eXBlKSlcclxuICAgIFN0cmluZy5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoc3RyLCBzdGFydEluZGV4KSB7IHJldHVybiAtMSAhPT0gdGhpcy5pbmRleE9mKHN0ciwgc3RhcnRJbmRleCk7IH07IiwiLyoqID09PT09PT09PT09PT09PT09PT09PT1cclxuICogQSBzaW1wbGUgU3RyaW5nIEZvcm1hdFxyXG4gKiBmdW5jdGlvbiBmb3IgamF2YXNjcmlwdFxyXG4gKiBBdXRob3I6IElhZ28gTG9yZW56byBTYWxndWVpcm9cclxuICogTW9kdWxlOiBDb21tb25KU1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzdHJpbmdGb3JtYXQoKSB7XHJcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcblx0dmFyIGZvcm1hdHRlZCA9IGFyZ3NbMF07XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnXFxcXHsnK2krJ1xcXFx9JywgJ2dpJyk7XHJcblx0XHRmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZShyZWdleHAsIGFyZ3NbaSsxXSk7XHJcblx0fVxyXG5cdHJldHVybiBmb3JtYXR0ZWQ7XHJcbn07IiwiLyoqXHJcbiAgICBHZW5lcmFsIGF1dG8tbG9hZCBzdXBwb3J0IGZvciB0YWJzOiBcclxuICAgIElmIHRoZXJlIGlzIG5vIGNvbnRlbnQgd2hlbiBmb2N1c2VkLCB0aGV5IHVzZSB0aGUgJ3JlbG9hZCcganF1ZXJ5IHBsdWdpblxyXG4gICAgdG8gbG9hZCBpdHMgY29udGVudCAtdGFicyBuZWVkIHRvIGJlIGNvbmZpZ3VyZWQgd2l0aCBkYXRhLXNvdXJjZS11cmwgYXR0cmlidXRlXHJcbiAgICBpbiBvcmRlciB0byBrbm93IHdoZXJlIHRvIGZldGNoIHRoZSBjb250ZW50LS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuLy8gRGVwZW5kZW5jeSBUYWJiZWRVWCBmcm9tIERJXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChUYWJiZWRVWCkge1xyXG4gICAgLy8gVGFiYmVkVVguc2V0dXAudGFiQm9keVNlbGVjdG9yIHx8ICcudGFiLWJvZHknXHJcbiAgICAkKCcudGFiLWJvZHknKS5vbigndGFiRm9jdXNlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgJHQucmVsb2FkKCk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxuICAgIFRoaXMgYWRkcyBub3RpZmljYXRpb25zIHRvIHRhYnMgZnJvbSB0aGUgVGFiYmVkVVggc3lzdGVtIHVzaW5nXHJcbiAgICB0aGUgY2hhbmdlc05vdGlmaWNhdGlvbiB1dGlsaXR5IHRoYXQgZGV0ZWN0cyBub3Qgc2F2ZWQgY2hhbmdlcyBvbiBmb3JtcyxcclxuICAgIHNob3dpbmcgd2FybmluZyBtZXNzYWdlcyB0byB0aGVcclxuICAgIHVzZXIgYW5kIG1hcmtpbmcgdGFicyAoYW5kIHN1Yi10YWJzIC8gcGFyZW50LXRhYnMgcHJvcGVybHkpIHRvXHJcbiAgICBkb24ndCBsb3N0IGNoYW5nZXMgbWFkZS5cclxuICAgIEEgYml0IG9mIENTUyBmb3IgdGhlIGFzc2lnbmVkIGNsYXNzZXMgd2lsbCBhbGxvdyBmb3IgdmlzdWFsIG1hcmtzLlxyXG5cclxuICAgIEFLQTogRG9uJ3QgbG9zdCBkYXRhISB3YXJuaW5nIG1lc3NhZ2UgOy0pXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcblxyXG4vLyBUYWJiZWRVWCBkZXBlbmRlbmN5IGFzIERJXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChUYWJiZWRVWCwgdGFyZ2V0U2VsZWN0b3IpIHtcclxuICAgIHZhciB0YXJnZXQgPSAkKHRhcmdldFNlbGVjdG9yIHx8ICcuY2hhbmdlcy1ub3RpZmljYXRpb24tZW5hYmxlZCcpO1xyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbi5pbml0KHsgdGFyZ2V0OiB0YXJnZXQgfSk7XHJcblxyXG4gICAgLy8gQWRkaW5nIGNoYW5nZSBub3RpZmljYXRpb24gdG8gdGFiLWJvZHkgZGl2c1xyXG4gICAgLy8gKG91dHNpZGUgdGhlIExDLkNoYW5nZXNOb3RpZmljYXRpb24gY2xhc3MgdG8gbGVhdmUgaXQgYXMgZ2VuZXJpYyBhbmQgc2ltcGxlIGFzIHBvc3NpYmxlKVxyXG4gICAgJCh0YXJnZXQpLm9uKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgJ2Zvcm0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCh0aGlzKS5wYXJlbnRzKCcudGFiLWJvZHknKS5hZGRDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGRpbmcgY2xhc3MgdG8gdGhlIG1lbnUgaXRlbSAodGFiIHRpdGxlKVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5hZGRDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAgICAgLmF0dHIoJ3RpdGxlJywgJCgnI2xjcmVzLWNoYW5nZXMtbm90LXNhdmVkJykudGV4dCgpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdsY0NoYW5nZXNOb3RpZmljYXRpb25TYXZlUmVnaXN0ZXJlZCcsICdmb3JtJywgZnVuY3Rpb24gKGUsIGYsIGVscywgZnVsbCkge1xyXG4gICAgICAgIGlmIChmdWxsKVxyXG4gICAgICAgICAgICAkKHRoaXMpLnBhcmVudHMoJy50YWItYm9keTpub3QoOmhhcyhmb3JtLmhhcy1jaGFuZ2VzKSknKS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmluZyBjbGFzcyBmcm9tIHRoZSBtZW51IGl0ZW0gKHRhYiB0aXRsZSlcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1jaGFuZ2VzJylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cigndGl0bGUnLCBudWxsKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgLy8gVG8gYXZvaWQgdXNlciBiZSBub3RpZmllZCBvZiBjaGFuZ2VzIGFsbCB0aW1lIHdpdGggdGFiIG1hcmtzLCB3ZSBhZGRlZCBhICdub3RpZnknIGNsYXNzXHJcbiAgICAvLyBvbiB0YWJzIHdoZW4gYSBjaGFuZ2Ugb2YgdGFiIGhhcHBlbnNcclxuICAgIC5maW5kKCcudGFiLWJvZHknKS5vbigndGFiVW5mb2N1c2VkJywgZnVuY3Rpb24gKGV2ZW50LCBmb2N1c2VkQ3R4KSB7XHJcbiAgICAgICAgdmFyIG1pID0gVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbTtcclxuICAgICAgICBpZiAobWkuaXMoJy5oYXMtY2hhbmdlcycpKSB7XHJcbiAgICAgICAgICAgIG1pLmFkZENsYXNzKCdub3RpZnktY2hhbmdlcycpOyAvL2hhcy10b29sdGlwXHJcbiAgICAgICAgICAgIC8vIFNob3cgbm90aWZpY2F0aW9uIHBvcHVwXHJcbiAgICAgICAgICAgIHZhciBkID0gJCgnPGRpdiBjbGFzcz1cIndhcm5pbmdcIj5AMDwvZGl2PjxkaXYgY2xhc3M9XCJhY3Rpb25zXCI+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImFjdGlvbiBjb250aW51ZVwiIHZhbHVlPVwiQDJcIi8+PGlucHV0IHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImFjdGlvbiBzdG9wXCIgdmFsdWU9XCJAMVwiLz48L2Rpdj4nXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDAvZywgTEMuZ2V0VGV4dCgnY2hhbmdlcy1ub3Qtc2F2ZWQnKSlcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMS9nLCBMQy5nZXRUZXh0KCd0YWItaGFzLWNoYW5nZXMtc3RheS1vbicpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AyL2csIExDLmdldFRleHQoJ3RhYi1oYXMtY2hhbmdlcy1jb250aW51ZS13aXRob3V0LWNoYW5nZScpKSk7XHJcbiAgICAgICAgICAgIGQub24oJ2NsaWNrJywgJy5zdG9wJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2Uod2luZG93KTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKCdjbGljaycsICcuY29udGludWUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh3aW5kb3cpO1xyXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlICdoYXMtY2hhbmdlcycgdG8gYXZvaWQgZnV0dXJlIGJsb2NrcyAodW50aWwgbmV3IGNoYW5nZXMgaGFwcGVucyBvZiBjb3Vyc2UgOy0pXHJcbiAgICAgICAgICAgICAgICBtaS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKTtcclxuICAgICAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKGZvY3VzZWRDdHgudGFiLmdldCgwKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGQsIHdpbmRvdywgJ25vdC1zYXZlZC1wb3B1cCcsIHsgY2xvc2FibGU6IGZhbHNlLCBjZW50ZXI6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBFdmVyIHJldHVybiBmYWxzZSB0byBzdG9wIGN1cnJlbnQgdGFiIGZvY3VzXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGhpcykubWVudWl0ZW0ucmVtb3ZlQ2xhc3MoJ25vdGlmeS1jaGFuZ2VzJyk7IC8vaGFzLXRvb2x0aXBcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiogVGFiYmVkVVg6IFRhYmJlZCBpbnRlcmZhY2UgbG9naWM7IHdpdGggbWluaW1hbCBIVE1MIHVzaW5nIGNsYXNzICd0YWJiZWQnIGZvciB0aGVcclxuY29udGFpbmVyLCB0aGUgb2JqZWN0IHByb3ZpZGVzIHRoZSBmdWxsIEFQSSB0byBtYW5pcHVsYXRlIHRhYnMgYW5kIGl0cyBzZXR1cFxyXG5saXN0ZW5lcnMgdG8gcGVyZm9ybSBsb2dpYyBvbiB1c2VyIGludGVyYWN0aW9uLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lmhhc1Njcm9sbEJhcicpO1xyXG5cclxudmFyIFRhYmJlZFVYID0ge1xyXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICQoJ2JvZHknKS5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzID4gbGk6bm90KC50YWJzLXNsaWRlcikgPiBhJywgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgaWYgKFRhYmJlZFVYLmZvY3VzVGFiKCR0LmF0dHIoJ2hyZWYnKSkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBzdCA9ICQoZG9jdW1lbnQpLnNjcm9sbFRvcCgpO1xyXG4gICAgICAgICAgICAgICAgbG9jYXRpb24uaGFzaCA9ICR0LmF0dHIoJ2hyZWYnKTtcclxuICAgICAgICAgICAgICAgICQoJ2h0bWwsYm9keScpLnNjcm9sbFRvcChzdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdtb3VzZWRvd24nLCBUYWJiZWRVWC5zdGFydE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlciA+IGEnLCAnbW91c2V1cCBtb3VzZWxlYXZlJywgVGFiYmVkVVguZW5kTW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLy8gdGhlIGNsaWNrIHJldHVybiBmYWxzZSBpcyB0byBkaXNhYmxlIHN0YW5kYXIgdXJsIGJlaGF2aW9yXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdjbGljaycsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlci1saW1pdCcsICdtb3VzZWVudGVyJywgVGFiYmVkVVguc3RhcnRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXItbGltaXQnLCAnbW91c2VsZWF2ZScsIFRhYmJlZFVYLmVuZE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzID4gbGkucmVtb3ZhYmxlJywgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgLy8gT25seSBvbiBkaXJlY3QgY2xpY2tzIHRvIHRoZSB0YWIsIHRvIGF2b2lkXHJcbiAgICAgICAgICAgIC8vIGNsaWNrcyB0byB0aGUgdGFiLWxpbmsgKHRoYXQgc2VsZWN0L2ZvY3VzIHRoZSB0YWIpOlxyXG4gICAgICAgICAgICBpZiAoZS50YXJnZXQgPT0gZS5jdXJyZW50VGFyZ2V0KVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVgucmVtb3ZlVGFiKG51bGwsIHRoaXMpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBJbml0IHBhZ2UgbG9hZGVkIHRhYmJlZCBjb250YWluZXJzOlxyXG4gICAgICAgICQoJy50YWJiZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgLy8gQ29uc2lzdGVuY2UgY2hlY2s6IHRoaXMgbXVzdCBiZSBhIHZhbGlkIGNvbnRhaW5lciwgdGhpcyBpcywgbXVzdCBoYXZlIC50YWJzXHJcbiAgICAgICAgICAgIGlmICgkdC5jaGlsZHJlbignLnRhYnMnKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIC8vIEluaXQgc2xpZGVyXHJcbiAgICAgICAgICAgIFRhYmJlZFVYLnNldHVwU2xpZGVyKCR0KTtcclxuICAgICAgICAgICAgLy8gQ2xlYW4gd2hpdGUgc3BhY2VzICh0aGV5IGNyZWF0ZSBleGNlc2l2ZSBzZXBhcmF0aW9uIGJldHdlZW4gc29tZSB0YWJzKVxyXG4gICAgICAgICAgICAkKCcudGFicycsIHRoaXMpLmNvbnRlbnRzKCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGlzIGlzIGEgdGV4dCBub2RlLCByZW1vdmUgaXQ6XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ub2RlVHlwZSA9PSAzKVxyXG4gICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIG1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciBkaXIgPSAkdC5oYXNDbGFzcygndGFicy1zbGlkZXItcmlnaHQnKSA/IDEgOiAtMTtcclxuICAgICAgICB2YXIgdGFic1NsaWRlciA9ICR0LnBhcmVudCgpO1xyXG4gICAgICAgIHZhciB0YWJzID0gdGFic1NsaWRlci5zaWJsaW5ncygnLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICB0YWJzWzBdLnNjcm9sbExlZnQgKz0gMjAgKiBkaXI7XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFic1NsaWRlci5wYXJlbnQoKSwgdGFicyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIHN0YXJ0TW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIHRhYnMgPSB0LmNsb3Nlc3QoJy50YWJiZWQnKS5jaGlsZHJlbignLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICAvLyBTdG9wIHByZXZpb3VzIGFuaW1hdGlvbnM6XHJcbiAgICAgICAgdGFicy5zdG9wKHRydWUpO1xyXG4gICAgICAgIHZhciBzcGVlZCA9IDAuMzsgLyogc3BlZWQgdW5pdDogcGl4ZWxzL21pbGlzZWNvbmRzICovXHJcbiAgICAgICAgdmFyIGZ4YSA9IGZ1bmN0aW9uICgpIHsgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFicy5wYXJlbnQoKSwgdGFicyk7IH07XHJcbiAgICAgICAgdmFyIHRpbWU7XHJcbiAgICAgICAgaWYgKHQuaGFzQ2xhc3MoJ3JpZ2h0JykpIHtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRpbWUgYmFzZWQgb24gc3BlZWQgd2Ugd2FudCBhbmQgaG93IG1hbnkgZGlzdGFuY2UgdGhlcmUgaXM6XHJcbiAgICAgICAgICAgIHRpbWUgPSAodGFic1swXS5zY3JvbGxXaWR0aCAtIHRhYnNbMF0uc2Nyb2xsTGVmdCAtIHRhYnMud2lkdGgoKSkgKiAxIC8gc3BlZWQ7XHJcbiAgICAgICAgICAgIHRhYnMuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IHRhYnNbMF0uc2Nyb2xsV2lkdGggLSB0YWJzLndpZHRoKCkgfSxcclxuICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgc3RlcDogZnhhLCBjb21wbGV0ZTogZnhhLCBlYXNpbmc6ICdzd2luZycgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHRpbWUgYmFzZWQgb24gc3BlZWQgd2Ugd2FudCBhbmQgaG93IG1hbnkgZGlzdGFuY2UgdGhlcmUgaXM6XHJcbiAgICAgICAgICAgIHRpbWUgPSB0YWJzWzBdLnNjcm9sbExlZnQgKiAxIC8gc3BlZWQ7XHJcbiAgICAgICAgICAgIHRhYnMuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IDAgfSxcclxuICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgc3RlcDogZnhhLCBjb21wbGV0ZTogZnhhLCBlYXNpbmc6ICdzd2luZycgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBlbmRNb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0YWJDb250YWluZXIgPSAkKHRoaXMpLmNsb3Nlc3QoJy50YWJiZWQnKTtcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJykuc3RvcCh0cnVlKTtcclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJDb250YWluZXIpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBjaGVja1RhYlNsaWRlckxpbWl0czogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgdGFicykge1xyXG4gICAgICAgIHRhYnMgPSB0YWJzIHx8IHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKTtcclxuICAgICAgICAvLyBTZXQgdmlzaWJpbGl0eSBvZiB2aXN1YWwgbGltaXRlcnM6XHJcbiAgICAgICAgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXItbGltaXQtbGVmdCcpLnRvZ2dsZSh0YWJzWzBdLnNjcm9sbExlZnQgPiAwKTtcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlci1saW1pdC1yaWdodCcpLnRvZ2dsZShcclxuICAgICAgICAgICAgKHRhYnNbMF0uc2Nyb2xsTGVmdCArIHRhYnMud2lkdGgoKSkgPCB0YWJzWzBdLnNjcm9sbFdpZHRoKTtcclxuICAgIH0sXHJcbiAgICBzZXR1cFNsaWRlcjogZnVuY3Rpb24gKHRhYkNvbnRhaW5lcikge1xyXG4gICAgICAgIHZhciB0cyA9IHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMnKS5oYXNTY3JvbGxCYXIoeyB4OiAtMiB9KS5ob3Jpem9udGFsKSB7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hZGRDbGFzcygnaGFzLXRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgICAgIGlmICh0cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIHRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICB0cy5jbGFzc05hbWUgPSAndGFicy1zbGlkZXInO1xyXG4gICAgICAgICAgICAgICAgJCh0cylcclxuICAgICAgICAgICAgICAgIC8vIEFycm93czpcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cInRhYnMtc2xpZGVyLWxlZnQgbGVmdFwiIGhyZWY9XCIjXCI+Jmx0OyZsdDs8L2E+JylcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8YSBjbGFzcz1cInRhYnMtc2xpZGVyLXJpZ2h0IHJpZ2h0XCIgaHJlZj1cIiNcIj4mZ3Q7Jmd0OzwvYT4nKTtcclxuICAgICAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hcHBlbmQodHMpO1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyXHJcbiAgICAgICAgICAgICAgICAvLyBEZXNpbmcgZGV0YWlsczpcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8ZGl2IGNsYXNzPVwidGFicy1zbGlkZXItbGltaXQgdGFicy1zbGlkZXItbGltaXQtbGVmdCBsZWZ0XCIgaHJlZj1cIiNcIj48L2Rpdj4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ0YWJzLXNsaWRlci1saW1pdCB0YWJzLXNsaWRlci1saW1pdC1yaWdodCByaWdodFwiIGhyZWY9XCIjXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0cy5zaG93KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIucmVtb3ZlQ2xhc3MoJ2hhcy10YWJzLXNsaWRlcicpO1xyXG4gICAgICAgICAgICB0cy5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYkNvbnRhaW5lcik7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiQ29udGV4dEJ5QXJnczogZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgICAgICBpZiAoYXJncy5sZW5ndGggPT0gMSAmJiB0eXBlb2YgKGFyZ3NbMF0pID09ICdzdHJpbmcnKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRUYWJDb250ZXh0KGFyZ3NbMF0sIG51bGwpO1xyXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIGFyZ3NbMF0udGFiKVxyXG4gICAgICAgICAgICByZXR1cm4gYXJnc1swXTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFRhYkNvbnRleHQoXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDAgPyBhcmdzWzBdIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMSA/IGFyZ3NbMV0gOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAyID8gYXJnc1syXSA6IG51bGxcclxuICAgICAgICAgICAgKTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWJDb250ZXh0OiBmdW5jdGlvbiAodGFiT3JTZWxlY3RvciwgbWVudWl0ZW1PclNlbGVjdG9yKSB7XHJcbiAgICAgICAgdmFyIG1pLCBtYSwgdGFiLCB0YWJDb250YWluZXI7XHJcbiAgICAgICAgaWYgKHRhYk9yU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgdGFiID0gJCh0YWJPclNlbGVjdG9yKTtcclxuICAgICAgICAgICAgaWYgKHRhYi5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyID0gdGFiLnBhcmVudHMoJy50YWJiZWQ6ZXEoMCknKTtcclxuICAgICAgICAgICAgICAgIG1hID0gdGFiQ29udGFpbmVyLmZpbmQoJz4gLnRhYnMgPiBsaSA+IGFbaHJlZj0jJyArIHRhYi5nZXQoMCkuaWQgKyAnXScpO1xyXG4gICAgICAgICAgICAgICAgbWkgPSBtYS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAobWVudWl0ZW1PclNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgIG1hID0gJChtZW51aXRlbU9yU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAobWEuaXMoJ2xpJykpIHtcclxuICAgICAgICAgICAgICAgIG1pID0gbWE7XHJcbiAgICAgICAgICAgICAgICBtYSA9IG1pLmNoaWxkcmVuKCdhOmVxKDApJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgbWkgPSBtYS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyID0gbWkuY2xvc2VzdCgnLnRhYmJlZCcpO1xyXG4gICAgICAgICAgICB0YWIgPSB0YWJDb250YWluZXIuZmluZCgnPi50YWItYm9keUAwLCA+LnRhYi1ib2R5LWxpc3Q+LnRhYi1ib2R5QDAnLnJlcGxhY2UoL0AwL2csIG1hLmF0dHIoJ2hyZWYnKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyB0YWI6IHRhYiwgbWVudWFuY2hvcjogbWEsIG1lbnVpdGVtOiBtaSwgdGFiQ29udGFpbmVyOiB0YWJDb250YWluZXIgfTtcclxuICAgIH0sXHJcbiAgICBjaGVja1RhYkNvbnRleHQ6IGZ1bmN0aW9uIChjdHgsIGZ1bmN0aW9ubmFtZSwgYXJncywgaXNUZXN0KSB7XHJcbiAgICAgICAgaWYgKCFjdHgudGFiIHx8IGN0eC50YWIubGVuZ3RoICE9IDEgfHxcclxuICAgICAgICAgICAgIWN0eC5tZW51aXRlbSB8fCBjdHgubWVudWl0ZW0ubGVuZ3RoICE9IDEgfHxcclxuICAgICAgICAgICAgIWN0eC50YWJDb250YWluZXIgfHwgY3R4LnRhYkNvbnRhaW5lci5sZW5ndGggIT0gMSB8fCBcclxuICAgICAgICAgICAgIWN0eC5tZW51YW5jaG9yIHx8IGN0eC5tZW51YW5jaG9yLmxlbmd0aCAhPSAxKSB7XHJcbiAgICAgICAgICAgIGlmICghaXNUZXN0ICYmIGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1RhYmJlZFVYLicgKyBmdW5jdGlvbm5hbWUgKyAnLCBiYWQgYXJndW1lbnRzOiAnICsgQXJyYXkuam9pbihhcmdzLCAnLCAnKSk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgZ2V0VGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZm9jdXNUYWInLCBhcmd1bWVudHMsIHRydWUpKSByZXR1cm4gbnVsbDtcclxuICAgICAgICByZXR1cm4gY3R4LnRhYi5nZXQoMCk7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdmb2N1c1RhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gR2V0IHByZXZpb3VzIGZvY3VzZWQgdGFiLCB0cmlnZ2VyICd0YWJVbmZvY3VzZWQnIGhhbmRsZXIgdGhhdCBjYW5cclxuICAgICAgICAvLyBzdG9wIHRoaXMgZm9jdXMgKHJldHVybmluZyBleHBsaWNpdHkgJ2ZhbHNlJylcclxuICAgICAgICB2YXIgcHJldlRhYiA9IGN0eC50YWIuc2libGluZ3MoJy5jdXJyZW50Jyk7XHJcbiAgICAgICAgaWYgKHByZXZUYWIudHJpZ2dlckhhbmRsZXIoJ3RhYlVuZm9jdXNlZCcsIFtjdHhdKSA9PT0gZmFsc2UpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgKGZpcnN0ISkgaWYgdGhlcmUgaXMgYSBwYXJlbnQgdGFiIGFuZCBmb2N1cyBpdCB0b28gKHdpbGwgYmUgcmVjdXJzaXZlIGNhbGxpbmcgdGhpcyBzYW1lIGZ1bmN0aW9uKVxyXG4gICAgICAgIHZhciBwYXJUYWIgPSBjdHgudGFiLnBhcmVudHMoJy50YWItYm9keTplcSgwKScpO1xyXG4gICAgICAgIGlmIChwYXJUYWIubGVuZ3RoID09IDEpIHRoaXMuZm9jdXNUYWIocGFyVGFiKTtcclxuXHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5oYXNDbGFzcygnY3VycmVudCcpIHx8XHJcbiAgICAgICAgICAgIGN0eC5tZW51aXRlbS5oYXNDbGFzcygnZGlzYWJsZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBVbnNldCBjdXJyZW50IG1lbnUgZWxlbWVudFxyXG4gICAgICAgIGN0eC5tZW51aXRlbS5zaWJsaW5ncygnLmN1cnJlbnQnKS5yZW1vdmVDbGFzcygnY3VycmVudCcpXHJcbiAgICAgICAgICAgIC5maW5kKCc+YScpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgLy8gU2V0IGN1cnJlbnQgbWVudSBlbGVtZW50XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgY3R4Lm1lbnVhbmNob3IuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuXHJcbiAgICAgICAgLy8gSGlkZSBjdXJyZW50IHRhYi1ib2R5XHJcbiAgICAgICAgcHJldlRhYi5yZW1vdmVDbGFzcygnY3VycmVudCcpO1xyXG4gICAgICAgIC8vIFNob3cgY3VycmVudCB0YWItYm9keSBhbmQgdHJpZ2dlciBldmVudFxyXG4gICAgICAgIGN0eC50YWIuYWRkQ2xhc3MoJ2N1cnJlbnQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkZvY3VzZWQnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9LFxyXG4gICAgZm9jdXNUYWJJbmRleDogZnVuY3Rpb24gKHRhYkNvbnRhaW5lciwgdGFiSW5kZXgpIHtcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyKVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mb2N1c1RhYih0aGlzLmdldFRhYkNvbnRleHQodGFiQ29udGFpbmVyLmZpbmQoJz4udGFiLWJvZHk6ZXEoJyArIHRhYkluZGV4ICsgJyknKSkpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICAvKiBFbmFibGUgYSB0YWIsIGRpc2FibGluZyBhbGwgb3RoZXJzIHRhYnMgLXVzZWZ1bGwgaW4gd2l6YXJkIHN0eWxlIHBhZ2VzLSAqL1xyXG4gICAgZW5hYmxlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnZW5hYmxlVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBydG4gPSBmYWxzZTtcclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmlzKCcuZGlzYWJsZWQnKSkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZGlzYWJsZWQgY2xhc3MgZnJvbSBmb2N1c2VkIHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgICAgIGN0eC50YWIucmVtb3ZlQ2xhc3MoJ2Rpc2FibGVkJylcclxuICAgICAgICAgICAgLnRyaWdnZXJIYW5kbGVyKCd0YWJFbmFibGVkJyk7XHJcbiAgICAgICAgICAgIGN0eC5tZW51aXRlbS5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgcnRuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gRm9jdXMgdGFiOlxyXG4gICAgICAgIHRoaXMuZm9jdXNUYWIoY3R4KTtcclxuICAgICAgICAvLyBEaXNhYmxlZCB0YWJzIGFuZCBtZW51IGl0ZW1zOlxyXG4gICAgICAgIGN0eC50YWIuc2libGluZ3MoJzpub3QoLmRpc2FibGVkKScpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnZGlzYWJsZWQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkRpc2FibGVkJyk7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNpYmxpbmdzKCc6bm90KC5kaXNhYmxlZCknKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XHJcbiAgICAgICAgcmV0dXJuIHJ0bjtcclxuICAgIH0sXHJcbiAgICBzaG93aGlkZUR1cmF0aW9uOiAwLFxyXG4gICAgc2hvd2hpZGVFYXNpbmc6IG51bGwsXHJcbiAgICBzaG93VGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnc2hvd1RhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTaG93IHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgY3R4LnRhYi5zaG93KHRoaXMuc2hvd2hpZGVEdXJhdGlvbik7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNob3codGhpcy5zaG93aGlkZUVhc2luZyk7XHJcbiAgICB9LFxyXG4gICAgaGlkZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2hpZGVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgLy8gU2hvdyB0YWIgYW5kIG1lbnUgaXRlbVxyXG4gICAgICAgIGN0eC50YWIuaGlkZSh0aGlzLnNob3doaWRlRHVyYXRpb24pO1xyXG4gICAgICAgIGN0eC5tZW51aXRlbS5oaWRlKHRoaXMuc2hvd2hpZGVFYXNpbmcpO1xyXG4gICAgfSxcclxuICAgIHRhYkJvZHlDbGFzc0V4Y2VwdGlvbnM6IHsgJ3RhYi1ib2R5JzogMCwgJ3RhYmJlZCc6IDAsICdjdXJyZW50JzogMCwgJ2Rpc2FibGVkJzogMCB9LFxyXG4gICAgY3JlYXRlVGFiOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCBpZE5hbWUsIGxhYmVsKSB7XHJcbiAgICAgICAgdGFiQ29udGFpbmVyID0gJCh0YWJDb250YWluZXIpO1xyXG4gICAgICAgIC8vIHRhYkNvbnRhaW5lciBtdXN0IGJlIG9ubHkgb25lIGFuZCB2YWxpZCBjb250YWluZXJcclxuICAgICAgICAvLyBhbmQgaWROYW1lIG11c3Qgbm90IGV4aXN0c1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIubGVuZ3RoID09IDEgJiYgdGFiQ29udGFpbmVyLmlzKCcudGFiYmVkJykgJiZcclxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWROYW1lKSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgdGFiIGRpdjpcclxuICAgICAgICAgICAgdmFyIHRhYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICB0YWIuaWQgPSBpZE5hbWU7XHJcbiAgICAgICAgICAgIC8vIFJlcXVpcmVkIGNsYXNzZXNcclxuICAgICAgICAgICAgdGFiLmNsYXNzTmFtZSA9IFwidGFiLWJvZHlcIjtcclxuICAgICAgICAgICAgdmFyICR0YWIgPSAkKHRhYik7XHJcbiAgICAgICAgICAgIC8vIEdldCBhbiBleGlzdGluZyBzaWJsaW5nIGFuZCBjb3B5ICh3aXRoIHNvbWUgZXhjZXB0aW9ucykgdGhlaXIgY3NzIGNsYXNzZXNcclxuICAgICAgICAgICAgJC5lYWNoKHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYi1ib2R5OmVxKDApJykuYXR0cignY2xhc3MnKS5zcGxpdCgvXFxzKy8pLCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEodiBpbiBUYWJiZWRVWC50YWJCb2R5Q2xhc3NFeGNlcHRpb25zKSlcclxuICAgICAgICAgICAgICAgICAgICAkdGFiLmFkZENsYXNzKHYpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gQWRkIHRvIGNvbnRhaW5lclxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuYXBwZW5kKHRhYik7XHJcblxyXG4gICAgICAgICAgICAvLyBDcmVhdGUgbWVudSBlbnRyeVxyXG4gICAgICAgICAgICB2YXIgbWVudWl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xyXG4gICAgICAgICAgICAvLyBCZWNhdXNlIGlzIGEgZHluYW1pY2FsbHkgY3JlYXRlZCB0YWIsIGlzIGEgZHluYW1pY2FsbHkgcmVtb3ZhYmxlIHRhYjpcclxuICAgICAgICAgICAgbWVudWl0ZW0uY2xhc3NOYW1lID0gXCJyZW1vdmFibGVcIjtcclxuICAgICAgICAgICAgdmFyIG1lbnVhbmNob3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XHJcbiAgICAgICAgICAgIG1lbnVhbmNob3Iuc2V0QXR0cmlidXRlKCdocmVmJywgJyMnICsgaWROYW1lKTtcclxuICAgICAgICAgICAgLy8gbGFiZWwgY2Fubm90IGJlIG51bGwgb3IgZW1wdHlcclxuICAgICAgICAgICAgJChtZW51YW5jaG9yKS50ZXh0KGlzRW1wdHlTdHJpbmcobGFiZWwpID8gXCJUYWJcIiA6IGxhYmVsKTtcclxuICAgICAgICAgICAgJChtZW51aXRlbSkuYXBwZW5kKG1lbnVhbmNob3IpO1xyXG4gICAgICAgICAgICAvLyBBZGQgdG8gdGFicyBsaXN0IGNvbnRhaW5lclxyXG4gICAgICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzOmVxKDApJykuYXBwZW5kKG1lbnVpdGVtKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQsIG9uIHRhYkNvbnRhaW5lciwgd2l0aCB0aGUgbmV3IHRhYiBhcyBkYXRhXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci50cmlnZ2VySGFuZGxlcigndGFiQ3JlYXRlZCcsIFt0YWJdKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0dXBTbGlkZXIodGFiQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiB0YWI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICByZW1vdmVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdyZW1vdmVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIE9ubHkgcmVtb3ZlIGlmIGlzIGEgJ3JlbW92YWJsZScgdGFiXHJcbiAgICAgICAgaWYgKCFjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ3JlbW92YWJsZScpICYmICFjdHgubWVudWl0ZW0uaGFzQ2xhc3MoJ3ZvbGF0aWxlJykpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAvLyBJZiB0YWIgaXMgY3VycmVudGx5IGZvY3VzZWQgdGFiLCBjaGFuZ2UgdG8gZmlyc3QgdGFiXHJcbiAgICAgICAgaWYgKGN0eC5tZW51aXRlbS5oYXNDbGFzcygnY3VycmVudCcpKVxyXG4gICAgICAgICAgICB0aGlzLmZvY3VzVGFiSW5kZXgoY3R4LnRhYkNvbnRhaW5lciwgMCk7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnJlbW92ZSgpO1xyXG4gICAgICAgIHZhciB0YWJpZCA9IGN0eC50YWIuZ2V0KDApLmlkO1xyXG4gICAgICAgIGN0eC50YWIucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dXBTbGlkZXIoY3R4LnRhYkNvbnRhaW5lcik7XHJcblxyXG4gICAgICAgIC8vIFRyaWdnZXIgZXZlbnQsIG9uIHRhYkNvbnRhaW5lciwgd2l0aCB0aGUgcmVtb3ZlZCB0YWIgaWQgYXMgZGF0YVxyXG4gICAgICAgIGN0eC50YWJDb250YWluZXIudHJpZ2dlckhhbmRsZXIoJ3RhYlJlbW92ZWQnLCBbdGFiaWRdKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBzZXRUYWJUaXRsZTogZnVuY3Rpb24gKHRhYk9yU2VsZWN0b3IsIG5ld1RpdGxlKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IFRhYmJlZFVYLmdldFRhYkNvbnRleHQodGFiT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdzZXRUYWJUaXRsZScsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTZXQgYW4gZW1wdHkgc3RyaW5nIGlzIG5vdCBhbGxvd2VkLCBwcmVzZXJ2ZSBwcmV2aW91c2x5OlxyXG4gICAgICAgIGlmICghaXNFbXB0eVN0cmluZyhuZXdUaXRsZSkpXHJcbiAgICAgICAgICAgIGN0eC5tZW51YW5jaG9yLnRleHQobmV3VGl0bGUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyogTW9yZSBzdGF0aWMgdXRpbGl0aWVzICovXHJcblxyXG4vKiogTG9vayB1cCB0aGUgY3VycmVudCB3aW5kb3cgbG9jYXRpb24gYWRkcmVzcyBhbmQgdHJ5IHRvIGZvY3VzIGEgdGFiIHdpdGggdGhhdFxyXG4gICAgbmFtZSwgaWYgdGhlcmUgaXMgb25lLlxyXG4qKi9cclxuVGFiYmVkVVguZm9jdXNDdXJyZW50TG9jYXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBJZiB0aGUgY3VycmVudCBsb2NhdGlvbiBoYXZlIGEgaGFzaCB2YWx1ZSBidXQgaXMgbm90IGEgSGFzaEJhbmdcclxuICAgIGlmICgvXiNbXiFdLy50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgICAgIC8vIFRyeSBmb2N1cyBhIHRhYiB3aXRoIHRoYXQgbmFtZVxyXG4gICAgICAgIHZhciB0YWIgPSBUYWJiZWRVWC5nZXRUYWIod2luZG93LmxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIGlmICh0YWIpXHJcbiAgICAgICAgICAgIFRhYmJlZFVYLmZvY3VzVGFiKHRhYik7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiogTG9vayBmb3Igdm9sYXRpbGUgdGFicyBvbiB0aGUgcGFnZSwgaWYgdGhleSBhcmVcclxuICAgIGVtcHR5IG9yIHJlcXVlc3RpbmcgYmVpbmcgJ3ZvbGF0aXplZCcsIHJlbW92ZSBpdC5cclxuKiovXHJcblRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJCgnLnRhYmJlZCA+IC50YWJzID4gLnZvbGF0aWxlJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRhYiA9IFRhYmJlZFVYLmdldFRhYihudWxsLCB0aGlzKTtcclxuICAgICAgICBpZiAodGFiICYmICgkKHRhYikuY2hpbGRyZW4oKS5sZW5ndGggPT09IDAgfHwgJCh0YWIpLmZpbmQoJzpub3QoLnRhYmJlZCkgLnZvbGF0aXplLW15LXRhYicpLmxlbmd0aCkpIHtcclxuICAgICAgICAgICAgVGFiYmVkVVgucmVtb3ZlVGFiKHRhYik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUYWJiZWRVWDsiLCIvKiBzbGlkZXItdGFicyBsb2dpYy5cclxuKiBFeGVjdXRlIGluaXQgYWZ0ZXIgVGFiYmVkVVguaW5pdCB0byBhdm9pZCBsYXVuY2ggYW5pbWF0aW9uIG9uIHBhZ2UgbG9hZC5cclxuKiBJdCByZXF1aXJlcyBUYWJiZWRVWCB0aHJvdWdodCBESSBvbiAnaW5pdCcuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRTbGlkZXJUYWJzKFRhYmJlZFVYKSB7XHJcbiAgICAkKCcudGFiYmVkLnNsaWRlci10YWJzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgJHRhYnMgPSAkdC5jaGlsZHJlbignLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgdmFyIGMgPSAkdGFic1xyXG4gICAgICAgICAgICAud3JhcEFsbCgnPGRpdiBjbGFzcz1cInRhYi1ib2R5LWxpc3RcIi8+JylcclxuICAgICAgICAgICAgLmVuZCgpLmNoaWxkcmVuKCcudGFiLWJvZHktbGlzdCcpO1xyXG4gICAgICAgICR0YWJzLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjLnN0b3AodHJ1ZSwgZmFsc2UpLmFuaW1hdGUoeyBzY3JvbGxMZWZ0OiBjLnNjcm9sbExlZnQoKSArICQodGhpcykucG9zaXRpb24oKS5sZWZ0IH0sIDE0MDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIFNldCBob3Jpem9udGFsIHNjcm9sbCB0byB0aGUgcG9zaXRpb24gb2YgY3VycmVudCBzaG93ZWQgdGFiLCB3aXRob3V0IGFuaW1hdGlvbiAoZm9yIHBhZ2UtaW5pdCk6XHJcbiAgICAgICAgdmFyIGN1cnJlbnRUYWIgPSAkKCR0LmZpbmQoJz4udGFicz5saS5jdXJyZW50PmEnKS5hdHRyKCdocmVmJykpO1xyXG4gICAgICAgIGMuc2Nyb2xsTGVmdChjLnNjcm9sbExlZnQoKSArIGN1cnJlbnRUYWIucG9zaXRpb24oKS5sZWZ0KTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgV2l6YXJkIFRhYmJlZCBGb3Jtcy5cclxuICAgIEl0IHVzZSB0YWJzIHRvIG1hbmFnZSB0aGUgZGlmZmVyZW50IGZvcm1zLXN0ZXBzIGluIHRoZSB3aXphcmQsXHJcbiAgICBsb2FkZWQgYnkgQUpBWCBhbmQgZm9sbG93aW5nIHRvIHRoZSBuZXh0IHRhYi9zdGVwIG9uIHN1Y2Nlc3MuXHJcblxyXG4gICAgUmVxdWlyZSBUYWJiZWRVWCB2aWEgREkgb24gJ2luaXQnXHJcbiAqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHZhbGlkYXRpb24gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgYWpheENhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRUYWJiZWRXaXphcmQoVGFiYmVkVVgsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgbG9hZGluZ0RlbGF5OiAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICAkKFwiYm9keVwiKS5kZWxlZ2F0ZShcIi50YWJiZWQud2l6YXJkIC5uZXh0XCIsIFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGZvcm1cclxuICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIGN1cnJlbnQgd2l6YXJkIHN0ZXAtdGFiXHJcbiAgICAgICAgdmFyIGN1cnJlbnRTdGVwID0gZm9ybS5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQgY29udGFpbmVyXHJcbiAgICAgICAgdmFyIHdpemFyZCA9IGZvcm0uY2xvc2VzdCgnLnRhYmJlZC53aXphcmQnKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSB3aXphcmQtbmV4dC1zdGVwXHJcbiAgICAgICAgdmFyIG5leHRTdGVwID0gJCh0aGlzKS5kYXRhKCd3aXphcmQtbmV4dC1zdGVwJyk7XHJcblxyXG4gICAgICAgIHZhciBjdHggPSB7XHJcbiAgICAgICAgICAgIGJveDogY3VycmVudFN0ZXAsXHJcbiAgICAgICAgICAgIGZvcm06IGZvcm1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgICAgICB2YXIgdmFsb2JqZWN0ID0gZm9ybS5kYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLmdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pO1xyXG4gICAgICAgICAgICAvLyBWYWxpZGF0aW9uIGlzIGFjdGl2ZWQsIHdhcyBleGVjdXRlZCBhbmQgdGhlIHJlc3VsdCBpcyAnZmFsc2UnOiBiYWQgZGF0YSwgc3RvcCBQb3N0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgICAgIHZhciBjdXN2YWwgPSBmb3JtLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nKTtcclxuICAgICAgICBpZiAoY3VzdmFsICYmIGN1c3ZhbC52YWxpZGF0ZSAmJiBjdXN2YWwudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5nb1RvU3VtbWFyeUVycm9ycyhmb3JtKTtcclxuICAgICAgICAgICAgLy8gY3VzdG9tIHZhbGlkYXRpb24gbm90IHBhc3NlZCwgb3V0IVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBSYWlzZSBldmVudFxyXG4gICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2JlZ2luU3VibWl0V2l6YXJkU3RlcCcpO1xyXG5cclxuICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIHJldGFyZFxyXG4gICAgICAgIGN0eC5sb2FkaW5ndGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY3VycmVudFN0ZXAuYmxvY2soYmxvY2tQcmVzZXRzLmxvYWRpbmcpO1xyXG4gICAgICAgIH0sIG9wdGlvbnMubG9hZGluZ0RlbGF5KTtcclxuICAgICAgICBcclxuICAgICAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIG9rID0gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIE1hcmsgYXMgc2F2ZWQ6XHJcbiAgICAgICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGZvcm0uZ2V0KDApKTtcclxuXHJcbiAgICAgICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogKGZvcm0uYXR0cignYWN0aW9uJykgfHwgJycpLFxyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICAgICAgZGF0YTogZm9ybS5zZXJpYWxpemUoKSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgc3VjY2VzcywgZ28gbmV4dCBzdGVwLCB1c2luZyBjdXN0b20gSlNPTiBBY3Rpb24gZXZlbnQ6XHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5vbignYWpheFN1Y2Nlc3NQb3N0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5leHQtc3RlcFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChuZXh0U3RlcCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBuZXh0IHN0ZXAgaXMgaW50ZXJuYWwgdXJsIChhIG5leHQgd2l6YXJkIHRhYilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eIy8udGVzdChuZXh0U3RlcCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2JlZ2luTG9hZFdpemFyZFN0ZXAnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUYWJiZWRVWC5lbmFibGVUYWIobmV4dFN0ZXApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9rID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQobmV4dFN0ZXApLnRyaWdnZXIoJ2VuZExvYWRXaXphcmRTdGVwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIG5leHQtc3RlcCBVUkkgdGhhdCBpcyBub3QgaW50ZXJuYWwgbGluaywgd2UgbG9hZCBpdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkaXJlY3RUbyhuZXh0U3RlcCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBEbyBKU09OIGFjdGlvbiBidXQgaWYgaXMgbm90IEpTT04gb3IgdmFsaWQsIG1hbmFnZSBhcyBIVE1MOlxyXG4gICAgICAgICAgICAgICAgaWYgKCFhamF4Q2FsbGJhY2tzLmRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgJ21heWJlJyB3YXMgd3JvbmcsIGh0bWwgd2FzIHJldHVybmVkIHRvIHJlcGxhY2UgY3VycmVudCBcclxuICAgICAgICAgICAgICAgICAgICAvLyBmb3JtIGNvbnRhaW5lcjogdGhlIGFqYXgtYm94LlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld2h0bWwgPSBuZXcgalF1ZXJ5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJzZUhUTUwgc2luY2UganF1ZXJ5LTEuOCBpcyBtb3JlIHNlY3VyZTpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChleCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93aW5nIG5ldyBodG1sOlxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRTdGVwLmh0bWwobmV3aHRtbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0Zvcm0gPSBjdXJyZW50U3RlcDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnJlbnRTdGVwLmlzKCdmb3JtJykpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0gPSBjdXJyZW50U3RlcC5maW5kKCdmb3JtOmVxKDApJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIENoYW5nZXNub3RpZmljYXRpb24gYWZ0ZXIgYXBwZW5kIGVsZW1lbnQgdG8gZG9jdW1lbnQsIGlmIG5vdCB3aWxsIG5vdCB3b3JrOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkIChpZiB3YXMgc2F2ZWQgYnV0IHNlcnZlciBkZWNpZGUgcmV0dXJucyBodG1sIGluc3RlYWQgYSBKU09OIGNvZGUsIHBhZ2Ugc2NyaXB0IG11c3QgZG8gJ3JlZ2lzdGVyU2F2ZScgdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmUpOlxyXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0Zvcm0uZ2V0KDApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcigncmVsb2FkZWRIdG1sV2l6YXJkU3RlcCcpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgICAgICAgICAgY29tcGxldGU6IGFqYXhDYWxsYmFja3MuY29tcGxldGVcclxuICAgICAgICB9KS5jb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGVwLnRyaWdnZXIoJ2VuZFN1Ym1pdFdpemFyZFN0ZXAnLCBvayk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqIHRpbWVTcGFuIGNsYXNzIHRvIG1hbmFnZSB0aW1lcywgcGFyc2UsIGZvcm1hdCwgY29tcHV0ZS5cclxuSXRzIG5vdCBzbyBjb21wbGV0ZSBhcyB0aGUgQyMgb25lcyBidXQgaXMgdXNlZnVsbCBzdGlsbC5cclxuKiovXHJcbnZhciBUaW1lU3BhbiA9IGZ1bmN0aW9uIChkYXlzLCBob3VycywgbWludXRlcywgc2Vjb25kcywgbWlsbGlzZWNvbmRzKSB7XHJcbiAgICB0aGlzLmRheXMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoZGF5cykpIHx8IDA7XHJcbiAgICB0aGlzLmhvdXJzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KGhvdXJzKSkgfHwgMDtcclxuICAgIHRoaXMubWludXRlcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChtaW51dGVzKSkgfHwgMDtcclxuICAgIHRoaXMuc2Vjb25kcyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChzZWNvbmRzKSkgfHwgMDtcclxuICAgIHRoaXMubWlsbGlzZWNvbmRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KG1pbGxpc2Vjb25kcykpIHx8IDA7XHJcblxyXG4gICAgLy8gaW50ZXJuYWwgdXRpbGl0eSBmdW5jdGlvbiAndG8gc3RyaW5nIHdpdGggdHdvIGRpZ2l0cyBhbG1vc3QnXHJcbiAgICBmdW5jdGlvbiB0KG4pIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihuIC8gMTApICsgJycgKyBuICUgMTA7XHJcbiAgICB9XHJcbiAgICAvKiogU2hvdyBvbmx5IGhvdXJzIGFuZCBtaW51dGVzIGFzIGEgc3RyaW5nIHdpdGggdGhlIGZvcm1hdCBISDptbVxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvU2hvcnRTdHJpbmcgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b1Nob3J0U3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKTtcclxuICAgICAgICByZXR1cm4gKGggKyBUaW1lU3Bhbi51bml0c0RlbGltaXRlciArIG0pO1xyXG4gICAgfTtcclxuICAgIC8qKiBTaG93IHRoZSBmdWxsIHRpbWUgYXMgYSBzdHJpbmcsIGRheXMgY2FuIGFwcGVhciBiZWZvcmUgaG91cnMgaWYgdGhlcmUgYXJlIDI0IGhvdXJzIG9yIG1vcmVcclxuICAgICoqL1xyXG4gICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU3RyaW5nKCkge1xyXG4gICAgICAgIHZhciBoID0gdCh0aGlzLmhvdXJzKSxcclxuICAgICAgICAgICAgZCA9ICh0aGlzLmRheXMgPiAwID8gdGhpcy5kYXlzLnRvU3RyaW5nKCkgKyBUaW1lU3Bhbi5kZWNpbWFsc0RlbGltaXRlciA6ICcnKSxcclxuICAgICAgICAgICAgbSA9IHQodGhpcy5taW51dGVzKSxcclxuICAgICAgICAgICAgcyA9IHQodGhpcy5zZWNvbmRzICsgdGhpcy5taWxsaXNlY29uZHMgLyAxMDAwKTtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICBkICtcclxuICAgICAgICAgICAgaCArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgbSArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICtcclxuICAgICAgICAgICAgcyk7XHJcbiAgICB9O1xyXG4gICAgdGhpcy52YWx1ZU9mID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdmFsdWVPZigpIHtcclxuICAgICAgICAvLyBSZXR1cm4gdGhlIHRvdGFsIG1pbGxpc2Vjb25kcyBjb250YWluZWQgYnkgdGhlIHRpbWVcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmRheXMgKiAoMjQgKiAzNjAwMDAwKSArXHJcbiAgICAgICAgICAgIHRoaXMuaG91cnMgKiAzNjAwMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taW51dGVzICogNjAwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLnNlY29uZHMgKiAxMDAwICtcclxuICAgICAgICAgICAgdGhpcy5taWxsaXNlY29uZHNcclxuICAgICAgICApO1xyXG4gICAgfTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBtaWxsaXNlY29uZHNcclxuKiovXHJcblRpbWVTcGFuLmZyb21NaWxsaXNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWlsbGlzZWNvbmRzKG1pbGxpc2Vjb25kcykge1xyXG4gICAgdmFyIG1zID0gbWlsbGlzZWNvbmRzICUgMTAwMCxcclxuICAgICAgICBzID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAxMDAwKSAlIDYwLFxyXG4gICAgICAgIG0gPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDYwMDAwKSAlIDYwLFxyXG4gICAgICAgIGggPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDM2MDAwMDApICUgMjQsXHJcbiAgICAgICAgZCA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gKDM2MDAwMDAgKiAyNCkpO1xyXG4gICAgcmV0dXJuIG5ldyBUaW1lU3BhbihkLCBoLCBtLCBzLCBtcyk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBzZWNvbmRzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tU2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21TZWNvbmRzKHNlY29uZHMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21NaWxsaXNlY29uZHMoc2Vjb25kcyAqIDEwMDApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgbWludXRlc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbU1pbnV0ZXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19mcm9tTWludXRlcyhtaW51dGVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tU2Vjb25kcyhtaW51dGVzICogNjApO1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIGRlY2ltYWwgaG91cnNcclxuKiovXHJcblRpbWVTcGFuLmZyb21Ib3VycyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21Ib3Vycyhob3Vycykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbU1pbnV0ZXMoaG91cnMgKiA2MCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBkYXlzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tRGF5cyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21EYXlzKGRheXMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21Ib3VycyhkYXlzICogMjQpO1xyXG59O1xyXG5cclxuLy8gRm9yIHNwYW5pc2ggYW5kIGVuZ2xpc2ggd29ya3MgZ29vZCAnOicgYXMgdW5pdHNEZWxpbWl0ZXIgYW5kICcuJyBhcyBkZWNpbWFsRGVsaW1pdGVyXHJcbi8vIFRPRE86IHRoaXMgbXVzdCBiZSBzZXQgZnJvbSBhIGdsb2JhbCBMQy5pMThuIHZhciBsb2NhbGl6ZWQgZm9yIGN1cnJlbnQgdXNlclxyXG5UaW1lU3Bhbi51bml0c0RlbGltaXRlciA9ICc6JztcclxuVGltZVNwYW4uZGVjaW1hbHNEZWxpbWl0ZXIgPSAnLic7XHJcblRpbWVTcGFuLnBhcnNlID0gZnVuY3Rpb24gKHN0cnRpbWUpIHtcclxuICAgIHN0cnRpbWUgPSAoc3RydGltZSB8fCAnJykuc3BsaXQodGhpcy51bml0c0RlbGltaXRlcik7XHJcbiAgICAvLyBCYWQgc3RyaW5nLCByZXR1cm5zIG51bGxcclxuICAgIGlmIChzdHJ0aW1lLmxlbmd0aCA8IDIpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgLy8gRGVjb3VwbGVkIHVuaXRzOlxyXG4gICAgdmFyIGQsIGgsIG0sIHMsIG1zO1xyXG4gICAgaCA9IHN0cnRpbWVbMF07XHJcbiAgICBtID0gc3RydGltZVsxXTtcclxuICAgIHMgPSBzdHJ0aW1lLmxlbmd0aCA+IDIgPyBzdHJ0aW1lWzJdIDogMDtcclxuICAgIC8vIFN1YnN0cmFjdGluZyBkYXlzIGZyb20gdGhlIGhvdXJzIHBhcnQgKGZvcm1hdDogJ2RheXMuaG91cnMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIGlmIChoLmNvbnRhaW5zKHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpKSB7XHJcbiAgICAgICAgdmFyIGRoc3BsaXQgPSBoLnNwbGl0KHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIpO1xyXG4gICAgICAgIGQgPSBkaHNwbGl0WzBdO1xyXG4gICAgICAgIGggPSBkaHNwbGl0WzFdO1xyXG4gICAgfVxyXG4gICAgLy8gTWlsbGlzZWNvbmRzIGFyZSBleHRyYWN0ZWQgZnJvbSB0aGUgc2Vjb25kcyAoYXJlIHJlcHJlc2VudGVkIGFzIGRlY2ltYWwgbnVtYmVycyBvbiB0aGUgc2Vjb25kcyBwYXJ0OiAnc2Vjb25kcy5taWxsaXNlY29uZHMnIHdoZXJlICcuJyBpcyBkZWNpbWFsc0RlbGltaXRlcilcclxuICAgIG1zID0gTWF0aC5yb3VuZChwYXJzZUZsb2F0KHMucmVwbGFjZSh0aGlzLmRlY2ltYWxzRGVsaW1pdGVyLCAnLicpKSAqIDEwMDAgJSAxMDAwKTtcclxuICAgIC8vIFJldHVybiB0aGUgbmV3IHRpbWUgaW5zdGFuY2VcclxuICAgIHJldHVybiBuZXcgVGltZVNwYW4oZCwgaCwgbSwgcywgbXMpO1xyXG59O1xyXG5UaW1lU3Bhbi56ZXJvID0gbmV3IFRpbWVTcGFuKDAsIDAsIDAsIDAsIDApO1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9faXNaZXJvKCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgICB0aGlzLmRheXMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLmhvdXJzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taW51dGVzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5zZWNvbmRzID09PSAwICYmXHJcbiAgICAgICAgdGhpcy5taWxsaXNlY29uZHMgPT09IDBcclxuICAgICk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbE1pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWlsbGlzZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWVPZigpO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxTZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxTZWNvbmRzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWlsbGlzZWNvbmRzKCkgLyAxMDAwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsTWludXRlcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsTWludXRlcygpIHtcclxuICAgIHJldHVybiAodGhpcy50b3RhbFNlY29uZHMoKSAvIDYwKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsSG91cnMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbEhvdXJzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsTWludXRlcygpIC8gNjApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxEYXlzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxEYXlzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsSG91cnMoKSAvIDI0KTtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gVGltZVNwYW47IiwiLyogRXh0cmEgdXRpbGl0aWVzIGFuZCBtZXRob2RzIFxyXG4gKi9cclxudmFyIFRpbWVTcGFuID0gcmVxdWlyZSgnLi9UaW1lU3BhbicpO1xyXG52YXIgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuLyoqIFNob3dzIHRpbWUgYXMgYSBsYXJnZSBzdHJpbmcgd2l0aCB1bml0cyBuYW1lcyBmb3IgdmFsdWVzIGRpZmZlcmVudCB0aGFuIHplcm8uXHJcbiAqKi9cclxuZnVuY3Rpb24gc21hcnRUaW1lKHRpbWUpIHtcclxuICAgIHZhciByID0gW107XHJcbiAgICBpZiAodGltZS5kYXlzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5kYXlzICsgJyBkYXlzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmRheXMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgZGF5Jyk7XHJcbiAgICBpZiAodGltZS5ob3VycyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuaG91cnMgKyAnIGhvdXJzJyk7XHJcbiAgICBlbHNlIGlmICh0aW1lLmhvdXJzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIGhvdXInKTtcclxuICAgIGlmICh0aW1lLm1pbnV0ZXMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLm1pbnV0ZXMgKyAnIG1pbnV0ZXMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWludXRlcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBtaW51dGUnKTtcclxuICAgIGlmICh0aW1lLnNlY29uZHMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLnNlY29uZHMgKyAnIHNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuc2Vjb25kcyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBzZWNvbmQnKTtcclxuICAgIGlmICh0aW1lLm1pbGxpc2Vjb25kcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUubWlsbGlzZWNvbmRzICsgJyBtaWxsaXNlY29uZHMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUubWlsbGlzZWNvbmRzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIG1pbGxpc2Vjb25kJyk7XHJcbiAgICByZXR1cm4gci5qb2luKCcsICcpO1xyXG59XHJcblxyXG4vKiogUm91bmRzIGEgdGltZSB0byB0aGUgbmVhcmVzdCAxNSBtaW51dGVzIGZyYWdtZW50LlxyXG5Acm91bmRUbyBzcGVjaWZ5IHRoZSBMQy5yb3VuZGluZ1R5cGVFbnVtIGFib3V0IGhvdyB0byByb3VuZCB0aGUgdGltZSAoZG93biwgbmVhcmVzdCBvciB1cClcclxuKiovXHJcbmZ1bmN0aW9uIHJvdW5kVGltZVRvUXVhcnRlckhvdXIoLyogVGltZVNwYW4gKi90aW1lLCAvKiBMQy5yb3VuZGluZ1R5cGVFbnVtICovcm91bmRUbykge1xyXG4gICAgdmFyIHJlc3RGcm9tUXVhcnRlciA9IHRpbWUudG90YWxIb3VycygpICUgMC4yNTtcclxuICAgIHZhciBob3VycyA9IHRpbWUudG90YWxIb3VycygpO1xyXG4gICAgaWYgKHJlc3RGcm9tUXVhcnRlciA+IDAuMCkge1xyXG4gICAgICAgIHN3aXRjaCAocm91bmRUbykge1xyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgICAgIGhvdXJzIC09IHJlc3RGcm9tUXVhcnRlcjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uTmVhcmVzdDpcclxuICAgICAgICAgICAgICAgIHZhciBsaW1pdCA9IDAuMjUgLyAyO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3RGcm9tUXVhcnRlciA+PSBsaW1pdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzICs9ICgwLjI1IC0gcmVzdEZyb21RdWFydGVyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG91cnMgLT0gcmVzdEZyb21RdWFydGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgICAgIGhvdXJzICs9ICgwLjI1IC0gcmVzdEZyb21RdWFydGVyKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBUaW1lU3Bhbi5mcm9tSG91cnMoaG91cnMpO1xyXG59XHJcblxyXG4vLyBFeHRlbmQgYSBnaXZlbiBUaW1lU3BhbiBvYmplY3Qgd2l0aCB0aGUgRXh0cmEgbWV0aG9kc1xyXG5mdW5jdGlvbiBwbHVnSW4oVGltZVNwYW4pIHtcclxuICAgIFRpbWVTcGFuLnByb3RvdHlwZS50b1NtYXJ0U3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TbWFydFN0cmluZygpIHsgcmV0dXJuIHNtYXJ0VGltZSh0aGlzKTsgfTtcclxuICAgIFRpbWVTcGFuLnByb3RvdHlwZS5yb3VuZFRvUXVhcnRlckhvdXIgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19yb3VuZFRvUXVhcnRlckhvdXIoKSB7IHJldHVybiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyLmNhbGwodGhpcywgcGFyYW1ldGVycyk7IH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIHNtYXJ0VGltZTogc21hcnRUaW1lLFxyXG4gICAgICAgIHJvdW5kVG9RdWFydGVySG91cjogcm91bmRUaW1lVG9RdWFydGVySG91cixcclxuICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgfTtcclxuIiwiLyoqXHJcbiAgIEFQSSBmb3IgYXV0b21hdGljIGNyZWF0aW9uIG9mIGxhYmVscyBmb3IgVUkgU2xpZGVycyAoanF1ZXJ5LXVpKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHRvb2x0aXBzID0gcmVxdWlyZSgnLi90b29sdGlwcycpLFxyXG4gICAgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpLFxyXG4gICAgVGltZVNwYW4gPSByZXF1aXJlKCcuL1RpbWVTcGFuJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuLyoqIENyZWF0ZSBsYWJlbHMgZm9yIGEganF1ZXJ5LXVpLXNsaWRlci5cclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZShzbGlkZXIpIHtcclxuICAgIC8vIHJlbW92ZSBvbGQgb25lczpcclxuICAgIHZhciBvbGQgPSBzbGlkZXIuc2libGluZ3MoJy51aS1zbGlkZXItbGFiZWxzJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCQodGhpcykuZGF0YSgndWktc2xpZGVyJykuZ2V0KDApID09IHNsaWRlci5nZXQoMCkpO1xyXG4gICAgfSkucmVtb3ZlKCk7XHJcbiAgICAvLyBDcmVhdGUgbGFiZWxzIGNvbnRhaW5lclxyXG4gICAgdmFyIGxhYmVscyA9ICQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWxzXCIvPicpO1xyXG4gICAgbGFiZWxzLmRhdGEoJ3VpLXNsaWRlcicsIHNsaWRlcik7XHJcblxyXG4gICAgLy8gU2V0dXAgb2YgdXNlZnVsIHZhcnMgZm9yIGxhYmVsIGNyZWF0aW9uXHJcbiAgICB2YXIgbWF4ID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ21heCcpLFxyXG4gICAgICAgIG1pbiA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdtaW4nKSxcclxuICAgICAgICBzdGVwID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ3N0ZXAnKSxcclxuICAgICAgICBzdGVwcyA9IE1hdGguZmxvb3IoKG1heCAtIG1pbikgLyBzdGVwKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBhbmQgcG9zaXRpb25pbmcgbGFiZWxzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBzdGVwczsgaSsrKSB7XHJcbiAgICAgICAgLy8gQ3JlYXRlIGxhYmVsXHJcbiAgICAgICAgdmFyIGxibCA9ICQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWxcIj48c3BhbiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbC10ZXh0XCIvPjwvZGl2PicpO1xyXG4gICAgICAgIC8vIFNldHVwIGxhYmVsIHdpdGggaXRzIHZhbHVlXHJcbiAgICAgICAgdmFyIGxhYmVsVmFsdWUgPSBtaW4gKyBpICogc3RlcDtcclxuICAgICAgICBsYmwuY2hpbGRyZW4oJy51aS1zbGlkZXItbGFiZWwtdGV4dCcpLnRleHQobGFiZWxWYWx1ZSk7XHJcbiAgICAgICAgbGJsLmRhdGEoJ3VpLXNsaWRlci12YWx1ZScsIGxhYmVsVmFsdWUpO1xyXG4gICAgICAgIC8vIFBvc2l0aW9uYXRlXHJcbiAgICAgICAgcG9zaXRpb25hdGUobGJsLCBpLCBzdGVwcyk7XHJcbiAgICAgICAgLy8gQWRkIHRvIGNvbnRhaW5lclxyXG4gICAgICAgIGxhYmVscy5hcHBlbmQobGJsKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGVyIGZvciBsYWJlbHMgY2xpY2sgdG8gc2VsZWN0IGl0cyBwb3NpdGlvbiB2YWx1ZVxyXG4gICAgbGFiZWxzLm9uKCdjbGljaycsICcudWktc2xpZGVyLWxhYmVsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWwgPSAkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlci12YWx1ZScpLFxyXG4gICAgICAgICAgICBzbGlkZXIgPSAkKHRoaXMpLnBhcmVudCgpLmRhdGEoJ3VpLXNsaWRlcicpO1xyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluc2VydCBsYWJlbHMgYXMgYSBzaWJsaW5nIG9mIHRoZSBzbGlkZXIgKGNhbm5vdCBiZSBpbnNlcnRlZCBpbnNpZGUpXHJcbiAgICBzbGlkZXIuYWZ0ZXIobGFiZWxzKTtcclxufVxyXG5cclxuLyoqIFBvc2l0aW9uYXRlIHRvIHRoZSBjb3JyZWN0IHBvc2l0aW9uIGFuZCB3aWR0aCBhbiBVSSBsYWJlbCBhdCBAbGJsXHJcbmZvciB0aGUgcmVxdWlyZWQgcGVyY2VudGFnZS13aWR0aCBAc3dcclxuKiovXHJcbmZ1bmN0aW9uIHBvc2l0aW9uYXRlKGxibCwgaSwgc3RlcHMpIHtcclxuICAgIHZhciBzdyA9IDEwMCAvIHN0ZXBzO1xyXG4gICAgdmFyIGxlZnQgPSBpICogc3cgLSBzdyAqIDAuNSxcclxuICAgICAgICByaWdodCA9IDEwMCAtIGxlZnQgLSBzdyxcclxuICAgICAgICBhbGlnbiA9ICdjZW50ZXInO1xyXG4gICAgaWYgKGkgPT09IDApIHtcclxuICAgICAgICBhbGlnbiA9ICdsZWZ0JztcclxuICAgICAgICBsZWZ0ID0gMDtcclxuICAgIH0gZWxzZSBpZiAoaSA9PSBzdGVwcykge1xyXG4gICAgICAgIGFsaWduID0gJ3JpZ2h0JztcclxuICAgICAgICByaWdodCA9IDA7XHJcbiAgICB9XHJcbiAgICBsYmwuY3NzKHtcclxuICAgICAgICAndGV4dC1hbGlnbic6IGFsaWduLFxyXG4gICAgICAgIGxlZnQ6IGxlZnQgKyAnJScsXHJcbiAgICAgICAgcmlnaHQ6IHJpZ2h0ICsgJyUnXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIFVwZGF0ZSB0aGUgdmlzaWJpbGl0eSBvZiBsYWJlbHMgb2YgYSBqcXVlcnktdWktc2xpZGVyIGRlcGVuZGluZyBpZiB0aGV5IGZpdCBpbiB0aGUgYXZhaWxhYmxlIHNwYWNlLlxyXG5TbGlkZXIgbmVlZHMgdG8gYmUgdmlzaWJsZS5cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZShzbGlkZXIpIHtcclxuICAgIC8vIEdldCBsYWJlbHMgZm9yIHNsaWRlclxyXG4gICAgdmFyIGxhYmVsc19jID0gc2xpZGVyLnNpYmxpbmdzKCcudWktc2xpZGVyLWxhYmVscycpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlcicpLmdldCgwKSA9PSBzbGlkZXIuZ2V0KDApKTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGxhYmVscyA9IGxhYmVsc19jLmZpbmQoJy51aS1zbGlkZXItbGFiZWwtdGV4dCcpO1xyXG5cclxuICAgIC8vIEFwcGx5IGF1dG9zaXplXHJcbiAgICBpZiAoKHNsaWRlci5kYXRhKCdzbGlkZXItYXV0b3NpemUnKSB8fCBmYWxzZSkudG9TdHJpbmcoKSA9PSAndHJ1ZScpXHJcbiAgICAgICAgYXV0b3NpemUoc2xpZGVyLCBsYWJlbHMpO1xyXG5cclxuICAgIC8vIEdldCBhbmQgYXBwbHkgbGF5b3V0XHJcbiAgICB2YXIgbGF5b3V0X25hbWUgPSBzbGlkZXIuZGF0YSgnc2xpZGVyLWxhYmVscy1sYXlvdXQnKSB8fCAnc3RhbmRhcmQnLFxyXG4gICAgICAgIGxheW91dCA9IGxheW91dF9uYW1lIGluIGxheW91dHMgPyBsYXlvdXRzW2xheW91dF9uYW1lXSA6IGxheW91dHMuc3RhbmRhcmQ7XHJcbiAgICBsYWJlbHNfYy5hZGRDbGFzcygnbGF5b3V0LScgKyBsYXlvdXRfbmFtZSk7XHJcbiAgICBsYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdG9vbHRpcHNcclxuICAgIHRvb2x0aXBzLmNyZWF0ZVRvb2x0aXAobGFiZWxzX2MuY2hpbGRyZW4oKSwge1xyXG4gICAgICAgIHRpdGxlOiBmdW5jdGlvbiAoKSB7IHJldHVybiAkKHRoaXMpLnRleHQoKTsgfVxyXG4gICAgICAgICwgcGVyc2lzdGVudDogdHJ1ZVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGF1dG9zaXplKHNsaWRlciwgbGFiZWxzKSB7XHJcbiAgICB2YXIgdG90YWxfd2lkdGggPSAwO1xyXG4gICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRvdGFsX3dpZHRoICs9ICQodGhpcykub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGMgPSBzbGlkZXIuY2xvc2VzdCgnLnVpLXNsaWRlci1jb250YWluZXInKSxcclxuICAgICAgICBtYXggPSBwYXJzZUZsb2F0KGMuY3NzKCdtYXgtd2lkdGgnKSksXHJcbiAgICAgICAgbWluID0gcGFyc2VGbG9hdChjLmNzcygnbWluLXdpZHRoJykpO1xyXG4gICAgaWYgKG1heCAhPSBOdW1iZXIuTmFOICYmIHRvdGFsX3dpZHRoID4gbWF4KVxyXG4gICAgICAgIHRvdGFsX3dpZHRoID0gbWF4O1xyXG4gICAgaWYgKG1pbiAhPSBOdW1iZXIuTmFOICYmIHRvdGFsX3dpZHRoIDwgbWluKVxyXG4gICAgICAgIHRvdGFsX3dpZHRoID0gbWluO1xyXG4gICAgYy53aWR0aCh0b3RhbF93aWR0aCk7XHJcbn1cclxuXHJcbi8qKiBTZXQgb2YgZGlmZmVyZW50IGxheW91dHMgZm9yIGxhYmVscywgYWxsb3dpbmcgZGlmZmVyZW50IGtpbmRzIG9mIFxyXG5wbGFjZW1lbnQgYW5kIHZpc3VhbGl6YXRpb24gdXNpbmcgdGhlIHNsaWRlciBkYXRhIG9wdGlvbiAnbGFiZWxzLWxheW91dCcuXHJcblVzZWQgYnkgJ3VwZGF0ZScsIGFsbW9zdCB0aGUgJ3N0YW5kYXJkJyBtdXN0IGV4aXN0IGFuZCBjYW4gYmUgaW5jcmVhc2VkXHJcbmV4dGVybmFsbHlcclxuKiovXHJcbnZhciBsYXlvdXRzID0ge307XHJcbi8qKiBTaG93IHRoZSBtYXhpbXVtIG51bWJlciBvZiBsYWJlbHMgaW4gZXF1YWxseSBzaXplZCBnYXBzIGJ1dFxyXG50aGUgbGFzdCBsYWJlbCB0aGF0IGlzIGVuc3VyZWQgdG8gYmUgc2hvd2VkIGV2ZW4gaWYgaXQgY3JlYXRlc1xyXG5hIGhpZ2hlciBnYXAgd2l0aCB0aGUgcHJldmlvdXMgb25lLlxyXG4qKi9cclxubGF5b3V0cy5zdGFuZGFyZCA9IGZ1bmN0aW9uIHN0YW5kYXJkX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoZXJlIGFyZSBtb3JlIGxhYmVscyB0aGFuIGF2YWlsYWJsZSBzcGFjZVxyXG4gICAgLy8gR2V0IG1heGltdW0gbGFiZWwgd2lkdGhcclxuICAgIHZhciBpdGVtX3dpZHRoID0gMDtcclxuICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdHcgPSAkKHRoaXMpLm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICAgICAgaWYgKHR3ID49IGl0ZW1fd2lkdGgpXHJcbiAgICAgICAgICAgIGl0ZW1fd2lkdGggPSB0dztcclxuICAgIH0pO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgd2lkdGgsIGlmIG5vdCwgZWxlbWVudCBpcyBub3QgdmlzaWJsZSBjYW5ub3QgYmUgY29tcHV0ZWRcclxuICAgIGlmIChpdGVtX3dpZHRoID4gMCkge1xyXG4gICAgICAgIC8vIEdldCB0aGUgcmVxdWlyZWQgc3RlcHBpbmcgb2YgbGFiZWxzXHJcbiAgICAgICAgdmFyIGxhYmVsc19zdGVwID0gTWF0aC5jZWlsKGl0ZW1fd2lkdGggLyAoc2xpZGVyLndpZHRoKCkgLyBsYWJlbHMubGVuZ3RoKSksXHJcbiAgICAgICAgbGFiZWxzX3N0ZXBzID0gbGFiZWxzLmxlbmd0aCAvIGxhYmVsc19zdGVwO1xyXG4gICAgICAgIGlmIChsYWJlbHNfc3RlcCA+IDEpIHtcclxuICAgICAgICAgICAgLy8gSGlkZSB0aGUgbGFiZWxzIG9uIHBvc2l0aW9ucyBvdXQgb2YgdGhlIHN0ZXBcclxuICAgICAgICAgICAgdmFyIG5ld2kgPSAwLFxyXG4gICAgICAgICAgICAgICAgbGltaXQgPSBsYWJlbHMubGVuZ3RoIC0gMSAtIGxhYmVsc19zdGVwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhYmVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxibCA9ICQobGFiZWxzW2ldKTtcclxuICAgICAgICAgICAgICAgIGlmICgoaSArIDEpIDwgbGFiZWxzLmxlbmd0aCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgaSAlIGxhYmVsc19zdGVwIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgaSA+IGxpbWl0KSlcclxuICAgICAgICAgICAgICAgICAgICBsYmwuaGlkZSgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxibC5zaG93KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXBvc2l0aW9uYXRlIHBhcmVudFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uYXRlKHBhcmVudCwgbmV3aSwgbGFiZWxzX3N0ZXBzKTtcclxuICAgICAgICAgICAgICAgICAgICBuZXdpKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbi8qKiBTaG93IGxhYmVscyBudW1iZXIgdmFsdWVzIGZvcm1hdHRlZCBhcyBob3Vycywgd2l0aCBvbmx5XHJcbmludGVnZXIgaG91cnMgYmVpbmcgc2hvd2VkLCB0aGUgbWF4aW11bSBudW1iZXIgb2YgaXQuXHJcbioqL1xyXG5sYXlvdXRzLmhvdXJzID0gZnVuY3Rpb24gaG91cnNfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscywgc2hvd19hbGwpIHtcclxuICAgIHZhciBpbnRMYWJlbHMgPSBzbGlkZXIuZmluZCgnLmludGVnZXItaG91cicpO1xyXG4gICAgaWYgKCFpbnRMYWJlbHMubGVuZ3RoKSB7XHJcbiAgICAgICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAoISR0LmRhdGEoJ2hvdXItcHJvY2Vzc2VkJykpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2ID0gcGFyc2VGbG9hdCgkdC50ZXh0KCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHYgIT0gTnVtYmVyLk5hTikge1xyXG4gICAgICAgICAgICAgICAgICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2ICUgMSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2RlY2ltYWwtaG91cicpLmhpZGUoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodiAlIDAuNSA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnBhcmVudCgpLmFkZENsYXNzKCdzdHJvbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQudGV4dChUaW1lU3Bhbi5mcm9tSG91cnModikudG9TaG9ydFN0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnaW50ZWdlci1ob3VyJykuc2hvdygpLnBhcmVudCgpLmFkZENsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGludExhYmVscyA9IGludExhYmVscy5hZGQoJHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ2hvdXItcHJvY2Vzc2VkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChzaG93X2FsbCAhPT0gdHJ1ZSlcclxuICAgICAgICBsYXlvdXRzLnN0YW5kYXJkKHNsaWRlciwgaW50TGFiZWxzLnBhcmVudCgpLCBpbnRMYWJlbHMpO1xyXG59O1xyXG5sYXlvdXRzWydhbGwtdmFsdWVzJ10gPSBmdW5jdGlvbiBhbGxfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscykge1xyXG4gICAgLy8gU2hvd2luZyBhbGwgbGFiZWxzXHJcbiAgICBsYWJlbHNfYy5zaG93KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKS5jaGlsZHJlbigpLnNob3coKTtcclxufTtcclxubGF5b3V0c1snYWxsLWhvdXJzJ10gPSBmdW5jdGlvbiBhbGxfaG91cnNfbGF5b3V0KCkge1xyXG4gICAgLy8gSnVzdCB1c2UgaG91cnMgbGF5b3V0IGJ1dCBzaG93aW5nIGFsbCBpbnRlZ2VyIGhvdXJzXHJcbiAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKGFyZ3VtZW50cywgdHJ1ZSk7XHJcbiAgICBsYXlvdXRzLmhvdXJzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNyZWF0ZTogY3JlYXRlLFxyXG4gICAgdXBkYXRlOiB1cGRhdGUsXHJcbiAgICBsYXlvdXRzOiBsYXlvdXRzXHJcbn07XHJcbiIsIi8qIFNldCBvZiBjb21tb24gTEMgY2FsbGJhY2tzIGZvciBtb3N0IEFqYXggb3BlcmF0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgdmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vLyBBS0E6IGFqYXhFcnJvclBvcHVwSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uRXJyb3IoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAvLyBJZiBpcyBhIGNvbm5lY3Rpb24gYWJvcnRlZCwgbm8gc2hvdyBtZXNzYWdlLlxyXG4gICAgLy8gcmVhZHlTdGF0ZSBkaWZmZXJlbnQgdG8gJ2RvbmU6NCcgbWVhbnMgYWJvcnRlZCB0b28sIFxyXG4gICAgLy8gYmVjYXVzZSB3aW5kb3cgYmVpbmcgY2xvc2VkL2xvY2F0aW9uIGNoYW5nZWRcclxuICAgIGlmIChtZXNzYWdlID09ICdhYm9ydCcgfHwgangucmVhZHlTdGF0ZSAhPSA0KVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICB2YXIgbSA9IG1lc3NhZ2U7XHJcbiAgICB2YXIgaWZyYW1lID0gbnVsbDtcclxuICAgIHNpemUgPSBwb3B1cC5zaXplKCdsYXJnZScpO1xyXG4gICAgc2l6ZS5oZWlnaHQgLT0gMzQ7XHJcbiAgICBpZiAobSA9PSAnZXJyb3InKSB7XHJcbiAgICAgICAgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGp4LnJlc3BvbnNlVGV4dCwgc2l6ZSk7XHJcbiAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICBtID0gbnVsbDtcclxuICAgIH0gIGVsc2VcclxuICAgICAgICBtID0gbSArIFwiOyBcIiArIGV4O1xyXG5cclxuICAgIC8vIEJsb2NrIGFsbCB3aW5kb3csIG5vdCBvbmx5IGN1cnJlbnQgZWxlbWVudFxyXG4gICAgJC5ibG9ja1VJKGVycm9yQmxvY2sobSwgbnVsbCwgcG9wdXAuc3R5bGUoc2l6ZSkpKTtcclxuICAgIGlmIChpZnJhbWUpXHJcbiAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAkKCcuYmxvY2tVSSAuY2xvc2UtcG9wdXAnKS5jbGljayhmdW5jdGlvbiAoKSB7ICQudW5ibG9ja1VJKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25Db21wbGV0ZSgpIHtcclxuICAgIC8vIERpc2FibGUgbG9hZGluZ1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ3RpbWVyIHx8IHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIC8vIFVuYmxvY2tcclxuICAgIGlmICh0aGlzLmF1dG9VbmJsb2NrTG9hZGluZykge1xyXG4gICAgICAgIC8vIERvdWJsZSB1bi1sb2NrLCBiZWNhdXNlIGFueSBvZiB0aGUgdHdvIHN5c3RlbXMgY2FuIGJlaW5nIHVzZWQ6XHJcbiAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5ib3gpO1xyXG4gICAgICAgIHRoaXMuYm94LnVuYmxvY2soKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICAvLyBTdXBwb3J0ZWQgdGhlIGdlbmVyaWMgY3R4LmVsZW1lbnQgZnJvbSBqcXVlcnkucmVsb2FkXHJcbiAgICBpZiAoY3R4LmVsZW1lbnQpIGN0eC5mb3JtID0gY3R4LmVsZW1lbnQ7XHJcbiAgICAvLyBTcGVjaWZpYyBzdHVmZiBvZiBhamF4Rm9ybXNcclxuICAgIGlmICghY3R4LmZvcm0pIGN0eC5mb3JtID0gJCh0aGlzKTtcclxuICAgIGlmICghY3R4LmJveCkgY3R4LmJveCA9IGN0eC5mb3JtO1xyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gRG8gSlNPTiBhY3Rpb24gYnV0IGlmIGlzIG5vdCBKU09OIG9yIHZhbGlkLCBtYW5hZ2UgYXMgSFRNTDpcclxuICAgIGlmICghZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpKSB7XHJcbiAgICAgICAgLy8gUG9zdCAnbWF5YmUnIHdhcyB3cm9uZywgaHRtbCB3YXMgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IFxyXG4gICAgICAgIC8vIGZvcm0gY29udGFpbmVyOiB0aGUgYWpheC1ib3guXHJcblxyXG4gICAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgICAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgICAgICAvLyBBdm9pZCBlbXB0eSBkb2N1bWVudHMgYmVpbmcgcGFyc2VkIChyYWlzZSBlcnJvcilcclxuICAgICAgICBpZiAoJC50cmltKGRhdGEpKSB7XHJcbiAgICAgICAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhIG1hbGZvcm1lZCBkb2N1bWVudCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZvciAncmVsb2FkJyBzdXBwb3J0LCBjaGVjayB0b28gdGhlIGNvbnRleHQubW9kZVxyXG4gICAgICAgIGN0eC5ib3hJc0NvbnRhaW5lciA9IGN0eC5ib3hJc0NvbnRhaW5lciB8fCAoY3R4Lm9wdGlvbnMgJiYgY3R4Lm9wdGlvbnMubW9kZSA9PT0gJ3JlcGxhY2UtY29udGVudCcpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgcmV0dXJuZWQgZWxlbWVudCBpcyB0aGUgYWpheC1ib3gsIGlmIG5vdCwgZmluZFxyXG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGluIHRoZSBuZXdodG1sOlxyXG4gICAgICAgIHZhciBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgaWYgKCFjdHguYm94SXNDb250YWluZXIgJiYgIW5ld2h0bWwuaXMoJy5hamF4LWJveCcpKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWwuZmluZCgnLmFqYXgtYm94OmVxKDApJyk7XHJcbiAgICAgICAgaWYgKCFqYiB8fCBqYi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gYWpheC1ib3gsIHVzZSBhbGwgZWxlbWVudCByZXR1cm5lZDpcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY3R4LmJveElzQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIC8vIGpiIGlzIGNvbnRlbnQgb2YgdGhlIGJveCBjb250YWluZXI6XHJcbiAgICAgICAgICAgIGN0eC5ib3guaHRtbChqYik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gYm94IGlzIGNvbnRlbnQgdGhhdCBtdXN0IGJlIHJlcGxhY2VkIGJ5IHRoZSBuZXcgY29udGVudDpcclxuICAgICAgICAgICAgY3R4LmJveC5yZXBsYWNlV2l0aChqYik7XHJcbiAgICAgICAgICAgIC8vIGFuZCByZWZyZXNoIHRoZSByZWZlcmVuY2UgdG8gYm94IHdpdGggdGhlIG5ldyBlbGVtZW50XHJcbiAgICAgICAgICAgIGN0eC5ib3ggPSBqYjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGN0eC5ib3guaXMoJ2Zvcm0nKSlcclxuICAgICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94O1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2Zvcm06ZXEoMCknKTtcclxuXHJcbiAgICAgICAgLy8gQ2hhbmdlc25vdGlmaWNhdGlvbiBhZnRlciBhcHBlbmQgZWxlbWVudCB0byBkb2N1bWVudCwgaWYgbm90IHdpbGwgbm90IHdvcms6XHJcbiAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQgKGlmIHdhcyBzYXZlZCBidXQgc2VydmVyIGRlY2lkZSByZXR1cm5zIGh0bWwgaW5zdGVhZCBhIEpTT04gY29kZSwgcGFnZSBzY3JpcHQgbXVzdCBkbyAncmVnaXN0ZXJTYXZlJyB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZSk6XHJcbiAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5nZXQoMCksXHJcbiAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIE1vdmUgZm9jdXMgdG8gdGhlIGVycm9ycyBhcHBlYXJlZCBvbiB0aGUgcGFnZSAoaWYgdGhlcmUgYXJlKTpcclxuICAgICAgICB2YXIgdmFsaWRhdGlvblN1bW1hcnkgPSBqYi5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0aW9uU3VtbWFyeS5sZW5ndGgpXHJcbiAgICAgICAgICBtb3ZlRm9jdXNUbyh2YWxpZGF0aW9uU3VtbWFyeSk7XHJcbiAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCBbamIsIGN0eC5mb3JtLCBqeF0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuICovXHJcbmZ1bmN0aW9uIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgbWVzc2FnZSA9IG1lc3NhZ2UgfHwgY3R4LmZvcm0uZGF0YSgnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnKSB8fCAnRG9uZSEnO1xyXG4gICAgY3R4LmJveC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgIGNzczogcG9wdXAuc3R5bGUocG9wdXAuc2l6ZSgnc21hbGwnKSlcclxuICAgIH0pKVxyXG4gICAgLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IFxyXG4gICAgfSk7XHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiovXHJcbmZ1bmN0aW9uIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuXHJcbiAgICB2YXIgY29udGVudCA9ICQoJzxkaXYgY2xhc3M9XCJvay1nby1ib3hcIi8+Jyk7XHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8c3BhbiBjbGFzcz1cInN1Y2Nlc3MtbWVzc2FnZVwiLz4nKS5hcHBlbmQoZGF0YS5TdWNjZXNzTWVzc2FnZSkpO1xyXG4gICAgaWYgKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpXHJcbiAgICAgICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFkZGl0aW9uYWwtbWVzc2FnZVwiLz4nKS5hcHBlbmQoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSkpO1xyXG5cclxuICAgIHZhciBva0J0biA9ICQoJzxhIGNsYXNzPVwiYWN0aW9uIG9rLWFjdGlvbiBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI29rXCIvPicpLmFwcGVuZChkYXRhLk9rTGFiZWwpO1xyXG4gICAgdmFyIGdvQnRuID0gJyc7XHJcbiAgICBpZiAoZGF0YS5Hb1VSTCAmJiBkYXRhLkdvTGFiZWwpIHtcclxuICAgICAgICBnb0J0biA9ICQoJzxhIGNsYXNzPVwiYWN0aW9uIGdvLWFjdGlvblwiLz4nKS5hdHRyKCdocmVmJywgZGF0YS5Hb1VSTCkuYXBwZW5kKGRhdGEuR29MYWJlbCk7XHJcbiAgICAgICAgLy8gRm9yY2luZyB0aGUgJ2Nsb3NlLWFjdGlvbicgaW4gc3VjaCBhIHdheSB0aGF0IGZvciBpbnRlcm5hbCBsaW5rcyB0aGUgcG9wdXAgZ2V0cyBjbG9zZWQgaW4gYSBzYWZlIHdheTpcclxuICAgICAgICBnb0J0bi5jbGljayhmdW5jdGlvbiAoKSB7IG9rQnRuLmNsaWNrKCk7IGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhY3Rpb25zIGNsZWFyZml4XCIvPicpLmFwcGVuZChva0J0bikuYXBwZW5kKGdvQnRuKSk7XHJcblxyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjdHguYm94LCBudWxsLCB7XHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSB7XHJcbiAgICAvLyBJZiBpcyBhIEpTT04gcmVzdWx0OlxyXG4gICAgaWYgKHR5cGVvZiAoZGF0YSkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgaWYgKGN0eC5ib3gpXHJcbiAgICAgICAgICAgIC8vIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzXHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGN0eC5ib3gpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAwOiBnZW5lcmFsIHN1Y2Nlc3MgY29kZSwgc2hvdyBtZXNzYWdlIHNheWluZyB0aGF0ICdhbGwgd2FzIGZpbmUnXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LCBkYXRhKTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAxOiBkbyBhIHJlZGlyZWN0XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMSkge1xyXG4gICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAyOiBzaG93IGxvZ2luIHBvcHVwICh3aXRoIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAzKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAzOiByZWxvYWQgY3VycmVudCBwYWdlIGNvbnRlbnQgdG8gdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgLy8gTm90ZTogdG8gcmVsb2FkIHNhbWUgdXJsIHBhZ2UgY29udGVudCwgaXMgYmV0dGVyIHJldHVybiB0aGUgaHRtbCBkaXJlY3RseSBmcm9tXHJcbiAgICAgICAgICAgIC8vIHRoaXMgYWpheCBzZXJ2ZXIgcmVxdWVzdC5cclxuICAgICAgICAgICAgLy9jb250YWluZXIudW5ibG9jaygpOyBpcyBibG9ja2VkIGFuZCB1bmJsb2NrZWQgYWdhaW4gYnkgdGhlIHJlbG9hZCBtZXRob2Q6XHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgY3R4LmJveC5yZWxvYWQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDQpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyBTdWNjZXNzTWVzc2FnZSwgYXR0YWNoaW5nIGFuZCBldmVudCBoYW5kbGVyIHRvIGdvIHRvIFJlZGlyZWN0VVJMXHJcbiAgICAgICAgICAgIGN0eC5ib3gub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0LlJlZGlyZWN0VVJMKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LlN1Y2Nlc3NNZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA1KSB7XHJcbiAgICAgICAgICAgIC8vIENoYW5nZSBtYWluLWFjdGlvbiBidXR0b24gbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIGJ0biA9IGN0eC5mb3JtLmZpbmQoJy5tYWluLWFjdGlvbicpO1xyXG4gICAgICAgICAgICB2YXIgZG1zZyA9IGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKTtcclxuICAgICAgICAgICAgaWYgKCFkbXNnKVxyXG4gICAgICAgICAgICAgICAgYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcsIGJ0bi50ZXh0KCkpO1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZGF0YS5SZXN1bHQgfHwgYnRuLmRhdGEoJ3N1Y2Nlc3MtcG9zdC10ZXh0JykgfHwgJ0RvbmUhJztcclxuICAgICAgICAgICAgYnRuLnRleHQobXNnKTtcclxuICAgICAgICAgICAgLy8gQWRkaW5nIHN1cHBvcnQgdG8gcmVzZXQgYnV0dG9uIHRleHQgdG8gZGVmYXVsdCBvbmVcclxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgRmlyc3QgbmV4dCBjaGFuZ2VzIGhhcHBlbnMgb24gdGhlIGZvcm06XHJcbiAgICAgICAgICAgICQoY3R4LmZvcm0pLm9uZSgnbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGJ0bi50ZXh0KGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IGZvciBjdXN0b20gaGFuZGxlcnNcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBPay1HbyBhY3Rpb25zIHBvcHVwIHdpdGggJ3N1Y2Nlc3MnIGFuZCAnYWRkaXRpb25hbCcgbWVzc2FnZXMuXHJcbiAgICAgICAgICAgIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDcpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDc6IHNob3cgbWVzc2FnZSBzYXlpbmcgY29udGFpbmVkIGF0IGRhdGEuUmVzdWx0Lk1lc3NhZ2UuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgY29kZSBhbGxvdyBhdHRhY2ggYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpbiBkYXRhLlJlc3VsdCB0byBkaXN0aW5ndWlzaFxyXG4gICAgICAgICAgICAvLyBkaWZmZXJlbnQgcmVzdWx0cyBhbGwgc2hvd2luZyBhIG1lc3NhZ2UgYnV0IG1heWJlIG5vdCBiZWluZyBhIHN1Y2Nlc3MgYXQgYWxsXHJcbiAgICAgICAgICAgIC8vIGFuZCBtYXliZSBkb2luZyBzb21ldGhpbmcgbW9yZSBpbiB0aGUgdHJpZ2dlcmVkIGV2ZW50IHdpdGggdGhlIGRhdGEgb2JqZWN0LlxyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5NZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPiAxMDApIHtcclxuICAgICAgICAgICAgLy8gVXNlciBDb2RlOiB0cmlnZ2VyIGN1c3RvbSBldmVudCB0byBtYW5hZ2UgcmVzdWx0czpcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4LCBjdHhdKTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBkYXRhLkNvZGUgPCAwXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGFuIGVycm9yIGNvZGUuXHJcblxyXG4gICAgICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgICAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKGN0eC5mb3JtLmdldCgwKSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgICAgICAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gXCJFcnJvcjogXCIgKyBkYXRhLkNvZGUgKyBcIjogXCIgKyBKU09OLnN0cmluZ2lmeShkYXRhLlJlc3VsdCA/IChkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgPyBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgOiBkYXRhLlJlc3VsdCkgOiAnJyk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJCgnPGRpdi8+JykuYXBwZW5kKG1lc3NhZ2UpLCBjdHguYm94LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlcnJvcjogbGNPbkVycm9yLFxyXG4gICAgICAgIHN1Y2Nlc3M6IGxjT25TdWNjZXNzLFxyXG4gICAgICAgIGNvbXBsZXRlOiBsY09uQ29tcGxldGUsXHJcbiAgICAgICAgZG9KU09OQWN0aW9uOiBkb0pTT05BY3Rpb25cclxuICAgIH07XHJcbn0iLCIvKiBGb3JtcyBzdWJtaXR0ZWQgdmlhIEFKQVggKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjYWxsYmFja3MgPSByZXF1aXJlKCcuL2FqYXhDYWxsYmFja3MnKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKSxcclxuICAgIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4vYmxvY2tQcmVzZXRzJyksXHJcbiAgICB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi92YWxpZGF0aW9uSGVscGVyJyk7XHJcblxyXG4vLyBHbG9iYWwgc2V0dGluZ3MsIHdpbGwgYmUgdXBkYXRlZCBvbiBpbml0IGJ1dCBpcyBhY2Nlc3NlZFxyXG4vLyB0aHJvdWdoIGNsb3N1cmUgZnJvbSBhbGwgZnVuY3Rpb25zLlxyXG4vLyBOT1RFOiBpcyBzdGF0aWMsIGRvZXNuJ3QgYWxsb3dzIG11bHRpcGxlIGNvbmZpZ3VyYXRpb24sIG9uZSBpbml0IGNhbGwgcmVwbGFjZSBwcmV2aW91c1xyXG4vLyBEZWZhdWx0czpcclxudmFyIHNldHRpbmdzID0ge1xyXG4gICAgbG9hZGluZ0RlbGF5OiAwLFxyXG4gICAgZWxlbWVudDogZG9jdW1lbnRcclxufTtcclxuXHJcbi8vIEFkYXB0ZWQgY2FsbGJhY2tzXHJcbmZ1bmN0aW9uIGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlcigpIHtcclxuICAgIGNhbGxiYWNrcy5jb21wbGV0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhamF4RXJyb3JQb3B1cEhhbmRsZXIoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICB2YXIgY3R4ID0gdGhpcztcclxuICAgIGlmICghY3R4LmZvcm0pIGN0eC5mb3JtID0gJCh0aGlzKTtcclxuICAgIGlmICghY3R4LmJveCkgY3R4LmJveCA9IGN0eC5mb3JtO1xyXG4gICAgLy8gRGF0YSBub3Qgc2F2ZWQ6XHJcbiAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKGN0eC5mb3JtLCBjdHguY2hhbmdlZEVsZW1lbnRzKTtcclxuXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gdHJ1ZTtcclxuXHJcbiAgICAvLyBDb21tb24gbG9naWNcclxuICAgIGNhbGxiYWNrcy5lcnJvci5hcHBseShjdHgsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyKCkge1xyXG4gICAgY2FsbGJhY2tzLnN1Y2Nlc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuKiBBamF4IEZvcm1zIGdlbmVyaWMgZnVuY3Rpb24uXHJcbiogUmVzdWx0IGV4cGVjdGVkIGlzOlxyXG4qIC0gaHRtbCwgZm9yIHZhbGlkYXRpb24gZXJyb3JzIGZyb20gc2VydmVyLCByZXBsYWNpbmcgY3VycmVudCAuYWpheC1ib3ggY29udGVudFxyXG4qIC0ganNvbiwgd2l0aCBzdHJ1Y3R1cmU6IHsgQ29kZTogaW50ZWdlci1udW1iZXIsIFJlc3VsdDogc3RyaW5nLW9yLW9iamVjdCB9XHJcbiogICBDb2RlIG51bWJlcnM6XHJcbiogICAgLSBOZWdhdGl2ZTogZXJyb3JzLCB3aXRoIGEgUmVzdWx0IG9iamVjdCB7IEVycm9yTWVzc2FnZTogc3RyaW5nIH1cclxuKiAgICAtIFplcm86IHN1Y2Nlc3MgcmVzdWx0LCBpdCBzaG93cyBhIG1lc3NhZ2Ugd2l0aCBjb250ZW50OiBSZXN1bHQgc3RyaW5nLCBlbHNlIGZvcm0gZGF0YSBhdHRyaWJ1dGUgJ3N1Y2Nlc3MtcG9zdC1tZXNzYWdlJywgZWxzZSBhIGdlbmVyaWMgbWVzc2FnZVxyXG4qICAgIC0gMTogc3VjY2VzcyByZXN1bHQsIFJlc3VsdCBjb250YWlucyBhIFVSTCwgdGhlIHBhZ2Ugd2lsbCBiZSByZWRpcmVjdGVkIHRvIHRoYXQuXHJcbiogICAgLSBNYWpvciAxOiBzdWNjZXNzIHJlc3VsdCwgd2l0aCBjdXN0b20gaGFuZGxlciB0aHJvdWdodCB0aGUgZm9ybSBldmVudCAnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnLlxyXG4qL1xyXG5mdW5jdGlvbiBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKGV2ZW50KSB7XHJcbiAgICAvLyBDb250ZXh0IHZhciwgdXNlZCBhcyBhamF4IGNvbnRleHQ6XHJcbiAgICB2YXIgY3R4ID0ge307XHJcbiAgICAvLyBEZWZhdWx0IGRhdGEgZm9yIHJlcXVpcmVkIHBhcmFtczpcclxuICAgIGN0eC5mb3JtID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmZvcm0gOiBudWxsKSB8fCAkKHRoaXMpO1xyXG4gICAgY3R4LmJveCA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5ib3ggOiBudWxsKSB8fCBjdHguZm9ybS5jbG9zZXN0KFwiLmFqYXgtYm94XCIpO1xyXG4gICAgdmFyIGFjdGlvbiA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5hY3Rpb24gOiBudWxsKSB8fCBjdHguZm9ybS5hdHRyKCdhY3Rpb24nKSB8fCAnJztcclxuICAgIHZhciBkYXRhID0gY3R4LmZvcm0uZmluZCgnOmlucHV0Jykuc2VyaWFsaXplKCk7XHJcblxyXG4gICAgLy8gVmFsaWRhdGlvbnNcclxuICAgIHZhciB2YWxpZGF0aW9uUGFzc2VkID0gdHJ1ZTtcclxuICAgIC8vIFRvIHN1cHBvcnQgc3ViLWZvcm1zIHRocm91aCBmaWVsZHNldC5hamF4LCB3ZSBtdXN0IGV4ZWN1dGUgdmFsaWRhdGlvbnMgYW5kIHZlcmlmaWNhdGlvblxyXG4gICAgLy8gaW4gdHdvIHN0ZXBzIGFuZCB1c2luZyB0aGUgcmVhbCBmb3JtIHRvIGxldCB2YWxpZGF0aW9uIG1lY2hhbmlzbSB3b3JrXHJcbiAgICB2YXIgaXNTdWJmb3JtID0gY3R4LmZvcm0uaXMoJ2ZpZWxkc2V0LmFqYXgnKTtcclxuICAgIHZhciBhY3R1YWxGb3JtID0gaXNTdWJmb3JtID8gY3R4LmZvcm0uY2xvc2VzdCgnZm9ybScpIDogY3R4LmZvcm0sXHJcbiAgICAgIGRpc2FibGVkU3VtbWFyaWVzID0gbmV3IGpRdWVyeSgpO1xyXG5cclxuICAgIC8vIE9uIHN1YmZvcm0gdmFsaWRhdGlvbiwgd2UgZG9uJ3Qgd2FudCB0aGUgZm9ybSB2YWxpZGF0aW9uLXN1bW1hcnkgY29udHJvbHMgdG8gYmUgYWZmZWN0ZWRcclxuICAgIC8vIGJ5IHRoaXMgdmFsaWRhdGlvbiAodG8gYXZvaWQgdG8gc2hvdyBlcnJvcnMgdGhlcmUgdGhhdCBkb2Vzbid0IGludGVyZXN0IHRvIHRoZSByZXN0IG9mIHRoZSBmb3JtKVxyXG4gICAgLy8gVG8gZnVsbGZpbGwgdGhpcyByZXF1aXNpdCwgd2UgbmVlZCB0byBoaWRlIGl0IGZvciB0aGUgdmFsaWRhdG9yIGZvciBhIHdoaWxlIGFuZCBsZXQgb25seSBhZmZlY3RcclxuICAgIC8vIGFueSBsb2NhbCBzdW1tYXJ5IChpbnNpZGUgdGhlIHN1YmZvcm0pLlxyXG4gICAgaWYgKGlzU3ViZm9ybSkge1xyXG4gICAgICBkaXNhYmxlZFN1bW1hcmllcyA9IGFjdHVhbEZvcm1cclxuICAgICAgLmZpbmQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJylcclxuICAgICAgLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gT25seSB0aG9zZSB0aGF0IGFyZSBvdXRzaWRlIHRoZSBzdWJmb3JtXHJcbiAgICAgICAgcmV0dXJuICEkLmNvbnRhaW5zKGN0eC5mb3JtLmdldCgwKSwgdGhpcyk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC8vIFdlIG11c3QgdXNlICdhdHRyJyBpbnN0ZWFkIG9mICdkYXRhJyBiZWNhdXNlIGlzIHdoYXQgd2UgYW5kIHVub2J0cnVzaXZlVmFsaWRhdGlvbiBjaGVja3NcclxuICAgICAgLy8gKGluIG90aGVyIHdvcmRzLCB1c2luZyAnZGF0YScgd2lsbCBub3Qgd29yaylcclxuICAgICAgLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAnZmFsc2UnKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGaXJzdCBhdCBhbGwsIGlmIHVub2J0cnVzaXZlIHZhbGlkYXRpb24gaXMgZW5hYmxlZCwgdmFsaWRhdGVcclxuICAgIHZhciB2YWxvYmplY3QgPSBhY3R1YWxGb3JtLmRhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gICAgaWYgKHZhbG9iamVjdCAmJiB2YWxvYmplY3QudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycyhjdHguZm9ybSk7XHJcbiAgICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJZiBjdXN0b20gdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgdmFyIGN1c3ZhbCA9IGFjdHVhbEZvcm0uZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicpO1xyXG4gICAgaWYgKGN1c3ZhbCAmJiBjdXN2YWwudmFsaWRhdGUgJiYgY3VzdmFsLnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnMoY3R4LmZvcm0pO1xyXG4gICAgICB2YWxpZGF0aW9uUGFzc2VkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVG8gc3VwcG9ydCBzdWItZm9ybXMsIHdlIG11c3QgY2hlY2sgdGhhdCB2YWxpZGF0aW9ucyBlcnJvcnMgaGFwcGVuZWQgaW5zaWRlIHRoZVxyXG4gICAgLy8gc3ViZm9ybSBhbmQgbm90IGluIG90aGVyIGVsZW1lbnRzLCB0byBkb24ndCBzdG9wIHN1Ym1pdCBvbiBub3QgcmVsYXRlZCBlcnJvcnMuXHJcbiAgICAvLyBKdXN0IGxvb2sgZm9yIG1hcmtlZCBlbGVtZW50czpcclxuICAgIGlmIChpc1N1YmZvcm0gJiYgY3R4LmZvcm0uZmluZCgnLmlucHV0LXZhbGlkYXRpb24tZXJyb3InKS5sZW5ndGgpXHJcbiAgICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBSZS1lbmFibGUgYWdhaW4gdGhhdCBzdW1tYXJpZXMgcHJldmlvdXNseSBkaXNhYmxlZFxyXG4gICAgaWYgKGlzU3ViZm9ybSkge1xyXG4gICAgICAvLyBXZSBtdXN0IHVzZSAnYXR0cicgaW5zdGVhZCBvZiAnZGF0YScgYmVjYXVzZSBpcyB3aGF0IHdlIGFuZCB1bm9idHJ1c2l2ZVZhbGlkYXRpb24gY2hlY2tzXHJcbiAgICAgIC8vIChpbiBvdGhlciB3b3JkcywgdXNpbmcgJ2RhdGEnIHdpbGwgbm90IHdvcmspXHJcbiAgICAgIGRpc2FibGVkU3VtbWFyaWVzLmF0dHIoJ2RhdGEtdmFsbXNnLXN1bW1hcnknLCAndHJ1ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIHZhbGlkYXRpb24gc3RhdHVzXHJcbiAgICBpZiAodmFsaWRhdGlvblBhc3NlZCA9PT0gZmFsc2UpIHsgICAgIFxyXG4gICAgICAvLyBWYWxpZGF0aW9uIGZhaWxlZCwgc3VibWl0IGNhbm5vdCBjb250aW51ZSwgb3V0IVxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGF0YSBzYXZlZDpcclxuICAgIGN0eC5jaGFuZ2VkRWxlbWVudHMgPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuY2hhbmdlZEVsZW1lbnRzIDogbnVsbCkgfHwgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoY3R4LmZvcm0uZ2V0KDApKTtcclxuXHJcbiAgICAvLyBMb2FkaW5nLCB3aXRoIHJldGFyZFxyXG4gICAgY3R4LmxvYWRpbmd0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGN0eC5ib3guYmxvY2soYmxvY2tQcmVzZXRzLmxvYWRpbmcpO1xyXG4gICAgfSwgc2V0dGluZ3MubG9hZGluZ0RlbGF5KTtcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiAoYWN0aW9uKSxcclxuICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICBjb250ZXh0OiBjdHgsXHJcbiAgICAgICAgc3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgZXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlcixcclxuICAgICAgICBjb21wbGV0ZTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTdG9wIG5vcm1hbCBQT1NUOlxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG59XHJcblxyXG4vLyBQdWJsaWMgaW5pdGlhbGl6YXRpb25cclxuZnVuY3Rpb24gaW5pdEFqYXhGb3JtcyhvcHRpb25zKSB7XHJcbiAgICAkLmV4dGVuZCh0cnVlLCBzZXR0aW5ncywgb3B0aW9ucyk7XHJcblxyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgdG8gbWFuYWdlIGFqYXggZm9ybXMgKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ3N1Ym1pdCcsICdmb3JtLmFqYXgnLCBhamF4Rm9ybXNTdWJtaXRIYW5kbGVyKTtcclxuICAgIC8qIEF0dGFjaCBhIGRlbGVnYXRlZCBoYW5kbGVyIGZvciBhIHNwZWNpYWwgYWpheCBmb3JtIGNhc2U6IHN1YmZvcm1zLCB1c2luZyBmaWVsZHNldHMuICovXHJcbiAgICAkKHNldHRpbmdzLmVsZW1lbnQpLm9uKCdjbGljaycsICdmaWVsZHNldC5hamF4IC5hamF4LWZpZWxkc2V0LXN1Ym1pdCcsXHJcbiAgICAgICAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICB2YXIgZm9ybSA9ICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG5cclxuICAgICAgICAgIGV2ZW50LmRhdGEgPSB7XHJcbiAgICAgICAgICAgIGZvcm06IGZvcm0sXHJcbiAgICAgICAgICAgIGJveDogZm9ybS5jbG9zZXN0KCcuYWpheC1ib3gnKSxcclxuICAgICAgICAgICAgYWN0aW9uOiBmb3JtLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgICAgIC8vIERhdGEgc2F2ZWQ6XHJcbiAgICAgICAgICAgIGNoYW5nZWRFbGVtZW50czogY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCksIGZvcm0uZmluZCgnOmlucHV0W25hbWVdJykpXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgICAgcmV0dXJuIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICk7XHJcbn1cclxuLyogVU5VU0VEP1xyXG5mdW5jdGlvbiBhamF4Rm9ybU1lc3NhZ2VPbkh0bWxSZXR1cm5lZFdpdGhvdXRWYWxpZGF0aW9uRXJyb3JzKGZvcm0sIG1lc3NhZ2UpIHtcclxuICAgIHZhciAkdCA9ICQoZm9ybSk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyBmb3JtIGVycm9ycywgc2hvdyBhIHN1Y2Nlc3NmdWwgbWVzc2FnZVxyXG4gICAgaWYgKCR0LmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykubGVuZ3RoID09IDApIHtcclxuICAgICAgICAkdC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgICAgICBjc3M6IHBvcHVwU3R5bGUocG9wdXBTaXplKCdzbWFsbCcpKVxyXG4gICAgICAgIH0pKVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkgeyAkdC51bmJsb2NrKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbiAgICB9XHJcbn1cclxuKi9cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBpbml0OiBpbml0QWpheEZvcm1zLFxyXG4gICAgICAgIG9uU3VjY2VzczogYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIsXHJcbiAgICAgICAgb25FcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGFqYXhGb3Jtc0NvbXBsZXRlSGFuZGxlclxyXG4gICAgfTsiLCIvKiBBdXRvIGNhbGN1bGF0ZSBzdW1tYXJ5IG9uIERPTSB0YWdnaW5nIHdpdGggY2xhc3NlcyB0aGUgZWxlbWVudHMgaW52b2x2ZWQuXHJcbiAqL1xyXG52YXIgbnUgPSByZXF1aXJlKCcuL251bWJlclV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMoKSB7XHJcbiAgICAkKCd0YWJsZS5jYWxjdWxhdGUtaXRlbXMtdG90YWxzJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJykpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVSb3coKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICAgIHZhciB0ciA9ICR0LmNsb3Nlc3QoJ3RyJyk7XHJcbiAgICAgICAgICAgIHZhciBpcCA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1wcmljZScpO1xyXG4gICAgICAgICAgICB2YXIgaXEgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKTtcclxuICAgICAgICAgICAgdmFyIGl0ID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXRvdGFsJyk7XHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKG51LmdldE1vbmV5TnVtYmVyKGlwKSAqIG51LmdldE1vbmV5TnVtYmVyKGlxLCAxKSwgaXQpO1xyXG4gICAgICAgICAgICB0ci50cmlnZ2VyKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCB0cik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICQodGhpcykuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXByaWNlLCAuY2FsY3VsYXRlLWl0ZW0tcXVhbnRpdHknKS5vbignY2hhbmdlJywgY2FsY3VsYXRlUm93KTtcclxuICAgICAgICAkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChjYWxjdWxhdGVSb3cpO1xyXG4gICAgICAgICQodGhpcykuZGF0YSgnY2FsY3VsYXRlLWl0ZW1zLXRvdGFscy1pbml0aWFsaXphdGVkJywgdHJ1ZSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXBDYWxjdWxhdGVTdW1tYXJ5KGZvcmNlKSB7XHJcbiAgICAkKCcuY2FsY3VsYXRlLXN1bW1hcnknKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCFmb3JjZSAmJiBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciBzID0gYy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeScpO1xyXG4gICAgICAgIHZhciBkID0gYy5maW5kKCd0YWJsZS5jYWxjdWxhdGUtc3VtbWFyeS1ncm91cCcpO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGMoKSB7XHJcbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDAsIGZlZSA9IDAsIGR1cmF0aW9uID0gMDtcclxuICAgICAgICAgICAgdmFyIGdyb3VwcyA9IHt9O1xyXG4gICAgICAgICAgICBkLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGdyb3VwVG90YWwgPSAwO1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbENoZWNrZWQgPSAkKHRoaXMpLmlzKCcuY2FsY3VsYXRlLWFsbC1pdGVtcycpO1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5maW5kKCd0cicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWxsQ2hlY2tlZCB8fCBpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuaXMoJzpjaGVja2VkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBUb3RhbCArPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS10b3RhbDplcSgwKScpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHEgPSBudS5nZXRNb25leU51bWJlcihpdGVtLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eTplcSgwKScpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmVlICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWZlZTplcSgwKScpKSAqIHE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWR1cmF0aW9uOmVxKDApJykpICogcTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHRvdGFsICs9IGdyb3VwVG90YWw7XHJcbiAgICAgICAgICAgICAgICBncm91cHNbJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGlvbi1zdW1tYXJ5LWdyb3VwJyldID0gZ3JvdXBUb3RhbDtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGdyb3VwVG90YWwsICQodGhpcykuY2xvc2VzdCgnZmllbGRzZXQnKS5maW5kKCcuZ3JvdXAtdG90YWwtcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihkdXJhdGlvbiwgJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLmZpbmQoJy5ncm91cC10b3RhbC1kdXJhdGlvbicpKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBTZXQgc3VtbWFyeSB0b3RhbCB2YWx1ZVxyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcih0b3RhbCwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS10b3RhbCcpKTtcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZmVlLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LWZlZScpKTtcclxuICAgICAgICAgICAgLy8gQW5kIGV2ZXJ5IGdyb3VwIHRvdGFsIHZhbHVlXHJcbiAgICAgICAgICAgIGZvciAodmFyIGcgaW4gZ3JvdXBzKSB7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihncm91cHNbZ10sIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktZ3JvdXAtJyArIGcpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBkLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1jaGVja2VkJykuY2hhbmdlKGNhbGMpO1xyXG4gICAgICAgIGQub24oJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIGNhbGMpO1xyXG4gICAgICAgIGNhbGMoKTtcclxuICAgICAgICBjLmRhdGEoJ2NhbGN1bGF0ZS1zdW1tYXJ5LWluaXRpYWxpemF0ZWQnLCB0cnVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogVXBkYXRlIHRoZSBkZXRhaWwgb2YgYSBwcmljaW5nIHN1bW1hcnksIG9uZSBkZXRhaWwgbGluZSBwZXIgc2VsZWN0ZWQgaXRlbVxyXG4qKi9cclxuZnVuY3Rpb24gdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkZCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbCcpLFxyXG4gICAgICAgICAgICAkdCA9ICRzLmZpbmQoJ3Rib2R5LmRldGFpbC10cGwnKS5jaGlsZHJlbigndHI6ZXEoMCknKSxcclxuICAgICAgICAgICAgJGMgPSAkcy5jbG9zZXN0KCdmb3JtJyksXHJcbiAgICAgICAgICAgICRpdGVtcyA9ICRjLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbScpO1xyXG5cclxuICAgICAgICAvLyBEbyBpdCFcclxuICAgICAgICAvLyBSZW1vdmUgb2xkIGxpbmVzXHJcbiAgICAgICAgJGQuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgICAgICAvLyBDcmVhdGUgbmV3IG9uZXNcclxuICAgICAgICAkaXRlbXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIEdldCB2YWx1ZXNcclxuICAgICAgICAgICAgdmFyICRpID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgIGNoZWNrZWQgPSAkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLnByb3AoJ2NoZWNrZWQnKTtcclxuICAgICAgICAgICAgaWYgKGNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb25jZXB0ID0gJGkuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtLWNvbmNlcHQnKS50ZXh0KCksXHJcbiAgICAgICAgICAgICAgICAgICAgcHJpY2UgPSBudS5nZXRNb25leU51bWJlcigkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2U6ZXEoMCknKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgcm93IGFuZCBzZXQgdmFsdWVzXHJcbiAgICAgICAgICAgICAgICB2YXIgJHJvdyA9ICR0LmNsb25lKClcclxuICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnZGV0YWlsLXRwbCcpXHJcbiAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ2RldGFpbCcpO1xyXG4gICAgICAgICAgICAgICAgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY29uY2VwdCcpLnRleHQoY29uY2VwdCk7XHJcbiAgICAgICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihwcmljZSwgJHJvdy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tcHJpY2UnKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgdG8gdGhlIHRhYmxlXHJcbiAgICAgICAgICAgICAgICAkZC5hcHBlbmQoJHJvdyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIHNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSgpIHtcclxuICAgIHZhciAkYyA9ICQoJy5wcmljaW5nLXN1bW1hcnkuZGV0YWlsZWQnKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAvLyBJbml0aWFsIGNhbGN1bGF0aW9uXHJcbiAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCk7XHJcbiAgICAvLyBDYWxjdWxhdGUgb24gcmVsZXZhbnQgZm9ybSBjaGFuZ2VzXHJcbiAgICAkYy5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY2hlY2tlZCcpLmNoYW5nZSh1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KTtcclxuICAgIC8vIFN1cHBvcnQgZm9yIGxjU2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzIGV2ZW50XHJcbiAgICAkYy5vbignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgdXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSk7XHJcbn1cclxuXHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBvblRhYmxlSXRlbXM6IHNldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyxcclxuICAgICAgICBvblN1bW1hcnk6IHNldHVwQ2FsY3VsYXRlU3VtbWFyeSxcclxuICAgICAgICB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5OiB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5LFxyXG4gICAgICAgIG9uRGV0YWlsZWRQcmljaW5nU3VtbWFyeTogc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5XHJcbiAgICB9OyIsIi8qIEZvY3VzIHRoZSBmaXJzdCBlbGVtZW50IGluIHRoZSBkb2N1bWVudCAob3IgaW4gQGNvbnRhaW5lcilcclxud2l0aCB0aGUgaHRtbDUgYXR0cmlidXRlICdhdXRvZm9jdXMnIChvciBhbHRlcm5hdGl2ZSBAY3NzU2VsZWN0b3IpLlxyXG5JdCdzIGZpbmUgYXMgYSBwb2x5ZmlsbCBhbmQgZm9yIGFqYXggbG9hZGVkIGNvbnRlbnQgdGhhdCB3aWxsIG5vdFxyXG5nZXQgdGhlIGJyb3dzZXIgc3VwcG9ydCBvZiB0aGUgYXR0cmlidXRlLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gYXV0b0ZvY3VzKGNvbnRhaW5lciwgY3NzU2VsZWN0b3IpIHtcclxuICAgIGNvbnRhaW5lciA9ICQoY29udGFpbmVyIHx8IGRvY3VtZW50KTtcclxuICAgIGNvbnRhaW5lci5maW5kKGNzc1NlbGVjdG9yIHx8ICdbYXV0b2ZvY3VzXScpLmZvY3VzKCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gYXV0b0ZvY3VzOyIsIi8qKiBBdXRvLWZpbGwgbWVudSBzdWItaXRlbXMgdXNpbmcgdGFiYmVkIHBhZ2VzIC1vbmx5IHdvcmtzIGZvciBjdXJyZW50IHBhZ2UgaXRlbXMtICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdXRvZmlsbFN1Ym1lbnUoKSB7XHJcbiAgICAkKCcuYXV0b2ZpbGwtc3VibWVudSAuY3VycmVudCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwYXJlbnRtZW51ID0gJCh0aGlzKTtcclxuICAgICAgICAvLyBnZXR0aW5nIHRoZSBzdWJtZW51IGVsZW1lbnRzIGZyb20gdGFicyBtYXJrZWQgd2l0aCBjbGFzcyAnYXV0b2ZpbGwtc3VibWVudS1pdGVtcydcclxuICAgICAgICB2YXIgaXRlbXMgPSAkKCcuYXV0b2ZpbGwtc3VibWVudS1pdGVtcyBsaTpub3QoLnJlbW92YWJsZSknKTtcclxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBpdGVtcywgY3JlYXRlIHRoZSBzdWJtZW51IGNsb25pbmcgaXQhXHJcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHN1Ym1lbnUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidWxcIik7XHJcbiAgICAgICAgICAgIHBhcmVudG1lbnUuYXBwZW5kKHN1Ym1lbnUpO1xyXG4gICAgICAgICAgICAvLyBDbG9uaW5nIHdpdGhvdXQgZXZlbnRzOlxyXG4gICAgICAgICAgICB2YXIgbmV3aXRlbXMgPSBpdGVtcy5jbG9uZShmYWxzZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICAkKHN1Ym1lbnUpLmFwcGVuZChuZXdpdGVtcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBXZSBuZWVkIGF0dGFjaCBldmVudHMgdG8gbWFpbnRhaW4gdGhlIHRhYmJlZCBpbnRlcmZhY2Ugd29ya2luZ1xyXG4gICAgICAgICAgICAvLyBOZXcgSXRlbXMgKGNsb25lZCkgbXVzdCBjaGFuZ2UgdGFiczpcclxuICAgICAgICAgICAgbmV3aXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCBpbiB0aGUgb3JpZ2luYWwgaXRlbVxyXG4gICAgICAgICAgICAgICAgJChcImFbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIsIGl0ZW1zKS5jbGljaygpO1xyXG4gICAgICAgICAgICAgICAgLy8gQ2hhbmdlIG1lbnU6XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoXCJhXCIpLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgICAgICAvLyBTdG9wIGV2ZW50OlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy8gT3JpZ2luYWwgaXRlbXMgbXVzdCBjaGFuZ2UgbWVudTpcclxuICAgICAgICAgICAgaXRlbXMuZmluZChcImFcIikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbmV3aXRlbXMucGFyZW50KCkuZmluZChcImFcIikucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKS5cclxuICAgICAgICAgICAgICAgIGZpbHRlcihcIipbaHJlZj0nXCIgKyB0aGlzLmdldEF0dHJpYnV0ZShcImhyZWZcIikgKyBcIiddXCIpLmFkZENsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qIEdlbmVyaWMgYmxvY2tVSSBvcHRpb25zIHNldHMgKi9cclxudmFyIGxvYWRpbmdCbG9jayA9IHsgbWVzc2FnZTogJzxpbWcgd2lkdGg9XCI0OHB4XCIgaGVpZ2h0PVwiNDhweFwiIGNsYXNzPVwibG9hZGluZy1pbmRpY2F0b3JcIiBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyB9O1xyXG52YXIgZXJyb3JCbG9jayA9IGZ1bmN0aW9uIChlcnJvciwgcmVsb2FkLCBzdHlsZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjc3M6ICQuZXh0ZW5kKHsgY3Vyc29yOiAnZGVmYXVsdCcgfSwgc3R5bGUgfHwge30pLFxyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj5UaGVyZSB3YXMgYW4gZXJyb3InICtcclxuICAgICAgICAgICAgKGVycm9yID8gJzogJyArIGVycm9yIDogJycpICtcclxuICAgICAgICAgICAgKHJlbG9hZCA/ICcgPGEgaHJlZj1cImphdmFzY3JpcHQ6ICcgKyByZWxvYWQgKyAnO1wiPkNsaWNrIHRvIHJlbG9hZDwvYT4nIDogJycpICtcclxuICAgICAgICAgICAgJzwvZGl2PidcclxuICAgIH07XHJcbn07XHJcbnZhciBpbmZvQmxvY2sgPSBmdW5jdGlvbiAobWVzc2FnZSwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuICQuZXh0ZW5kKHtcclxuICAgICAgICBtZXNzYWdlOiAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPjxkaXYgY2xhc3M9XCJpbmZvXCI+JyArIG1lc3NhZ2UgKyAnPC9kaXY+J1xyXG4gICAgICAgIC8qLGNzczogeyBjdXJzb3I6ICdkZWZhdWx0JyB9Ki9cclxuICAgICAgICAsIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGU6XHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgbG9hZGluZzogbG9hZGluZ0Jsb2NrLFxyXG4gICAgICAgIGVycm9yOiBlcnJvckJsb2NrLFxyXG4gICAgICAgIGluZm86IGluZm9CbG9ja1xyXG4gICAgfTtcclxufSIsIi8qPSBDaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzXHJcbiogdG8gbm90aWZ5IHVzZXIgYWJvdXQgY2hhbmdlcyBpbiBmb3JtcyxcclxuKiB0YWJzLCB0aGF0IHdpbGwgYmUgbG9zdCBpZiBnbyBhd2F5IGZyb21cclxuKiB0aGUgcGFnZS4gSXQga25vd3Mgd2hlbiBhIGZvcm0gaXMgc3VibWl0dGVkXHJcbiogYW5kIHNhdmVkIHRvIGRpc2FibGUgbm90aWZpY2F0aW9uLCBhbmQgZ2l2ZXNcclxuKiBtZXRob2RzIGZvciBvdGhlciBzY3JpcHRzIHRvIG5vdGlmeSBjaGFuZ2VzXHJcbiogb3Igc2F2aW5nLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZ2V0WFBhdGggPSByZXF1aXJlKCcuL2dldFhQYXRoJyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHtcclxuICAgIGNoYW5nZXNMaXN0OiB7fSxcclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBudWxsLFxyXG4gICAgICAgIGdlbmVyaWNDaGFuZ2VTdXBwb3J0OiB0cnVlLFxyXG4gICAgICAgIGdlbmVyaWNTdWJtaXRTdXBwb3J0OiBmYWxzZSxcclxuICAgICAgICBjaGFuZ2VkRm9ybUNsYXNzOiAnaGFzLWNoYW5nZXMnLFxyXG4gICAgICAgIGNoYW5nZWRFbGVtZW50Q2xhc3M6ICdjaGFuZ2VkJyxcclxuICAgICAgICBub3RpZnlDbGFzczogJ25vdGlmeS1jaGFuZ2VzJ1xyXG4gICAgfSxcclxuICAgIGluaXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gVXNlciBub3RpZmljYXRpb24gdG8gcHJldmVudCBsb3N0IGNoYW5nZXMgZG9uZVxyXG4gICAgICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hhbmdlc05vdGlmaWNhdGlvbi5ub3RpZnkoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQodGhpcy5kZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKCFvcHRpb25zLnRhcmdldClcclxuICAgICAgICAgICAgb3B0aW9ucy50YXJnZXQgPSBkb2N1bWVudDtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljQ2hhbmdlU3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ2NoYW5nZScsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpIDppbnB1dFtuYW1lXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoJCh0aGlzKS5jbG9zZXN0KCdmb3JtJykuZ2V0KDApLCB0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY1N1Ym1pdFN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdzdWJtaXQnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBBZGQgbm90aWZpY2F0aW9uIGNsYXNzIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLm5vdGlmeUNsYXNzKTtcclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGNoYW5nZSBpbiB0aGUgcHJvcGVydHkgbGlzdCByZXR1cm5pbmcgdGhlIG1lc3NhZ2U6XHJcbiAgICAgICAgZm9yICh2YXIgYyBpbiB0aGlzLmNoYW5nZXNMaXN0KVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWl0TWVzc2FnZSB8fCAodGhpcy5xdWl0TWVzc2FnZSA9ICQoJyNsY3Jlcy1xdWl0LXdpdGhvdXQtc2F2ZScpLnRleHQoKSkgfHwgJyc7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJDaGFuZ2U6IGZ1bmN0aW9uIChmLCBlKSB7XHJcbiAgICAgICAgaWYgKCFlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgdmFyIGZsID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSB8fCBbXTtcclxuICAgICAgICBpZiAoJC5pc0FycmF5KGUpKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZS5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJDaGFuZ2UoZiwgZVtpXSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG4gPSBlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgKGUpICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBuID0gZS5uYW1lO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiByZWFsbHkgdGhlcmUgd2FzIGEgY2hhbmdlIGNoZWNraW5nIGRlZmF1bHQgZWxlbWVudCB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChlLmRlZmF1bHRWYWx1ZSkgIT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5jaGVja2VkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLnNlbGVjdGVkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgZS52YWx1ZSA9PSBlLmRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlcmUgd2FzIG5vIGNoYW5nZSwgbm8gY29udGludWVcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBtYXliZSBpcyBhIHJlZ3Jlc3Npb24gZnJvbSBhIGNoYW5nZSBhbmQgbm93IHRoZSBvcmlnaW5hbCB2YWx1ZSBhZ2FpblxyXG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIHJlbW92ZSBmcm9tIGNoYW5nZXMgbGlzdCBkb2luZyByZWdpc3RlclNhdmVcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJTYXZlKGYsIFtuXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJChlKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIShuIGluIGZsKSlcclxuICAgICAgICAgICAgZmwucHVzaChuKTtcclxuICAgICAgICAkKGYpXHJcbiAgICAgICAgLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcylcclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnQgbmFtZSBjaGFuZ2VkLCBmb3JtIGVsZW1lbnQgY2hhbmdlZCAodGhpcyBjYW4gYmUgbnVsbClcclxuICAgICAgICAudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIFtmLCBuLCBlXSk7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJTYXZlOiBmdW5jdGlvbiAoZiwgZWxzKSB7XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBwcmV2RWxzID0gJC5leHRlbmQoW10sIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKTtcclxuICAgICAgICB2YXIgciA9IHRydWU7XHJcbiAgICAgICAgaWYgKGVscykge1xyXG4gICAgICAgICAgICB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9ICQuZ3JlcCh0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSwgZnVuY3Rpb24gKGVsKSB7IHJldHVybiAoJC5pbkFycmF5KGVsLCBlbHMpID09IC0xKTsgfSk7XHJcbiAgICAgICAgICAgIC8vIERvbid0IHJlbW92ZSAnZicgbGlzdCBpZiBpcyBub3QgZW1wdHlcclxuICAgICAgICAgICAgciA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLmxlbmd0aCA9PT0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHIpIHtcclxuICAgICAgICAgICAgJChmKS5yZW1vdmVDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRGb3JtQ2xhc3MpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV07XHJcbiAgICAgICAgICAgIC8vIGxpbmsgZWxlbWVudHMgZnJvbSBlbHMgdG8gY2xlYW4tdXAgaXRzIGNsYXNzZXNcclxuICAgICAgICAgICAgZWxzID0gcHJldkVscztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcGFzcyBkYXRhOiBmb3JtLCBlbGVtZW50cyByZWdpc3RlcmVkIGFzIHNhdmUgKHRoaXMgY2FuIGJlIG51bGwpLCBhbmQgJ2Zvcm0gZnVsbHkgc2F2ZWQnIGFzIHRoaXJkIHBhcmFtIChib29sKVxyXG4gICAgICAgICQoZikudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uU2F2ZVJlZ2lzdGVyZWQnLCBbZiwgZWxzLCByXSk7XHJcbiAgICAgICAgdmFyIGxjaG4gPSB0aGlzO1xyXG4gICAgICAgIGlmIChlbHMpICQuZWFjaChlbHMsIGZ1bmN0aW9uICgpIHsgJCgnW25hbWU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSh0aGlzKSArICdcIl0nKS5yZW1vdmVDbGFzcyhsY2huLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpOyB9KTtcclxuICAgICAgICByZXR1cm4gcHJldkVscztcclxuICAgIH1cclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gY2hhbmdlc05vdGlmaWNhdGlvbjtcclxufSIsIi8qIFV0aWxpdHkgdG8gY3JlYXRlIGlmcmFtZSB3aXRoIGluamVjdGVkIGh0bWwvY29udGVudCBpbnN0ZWFkIG9mIFVSTC5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlSWZyYW1lKGNvbnRlbnQsIHNpemUpIHtcclxuICAgIHZhciAkaWZyYW1lID0gJCgnPGlmcmFtZSB3aWR0aD1cIicgKyBzaXplLndpZHRoICsgJ1wiIGhlaWdodD1cIicgKyBzaXplLmhlaWdodCArICdcIiBzdHlsZT1cImJvcmRlcjpub25lO1wiPjwvaWZyYW1lPicpO1xyXG4gICAgdmFyIGlmcmFtZSA9ICRpZnJhbWUuZ2V0KDApO1xyXG4gICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIHJlYWR5XHJcbiAgICB2YXIgaWZyYW1lbG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZnJhbWUub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIFVzaW5nIGlmcmFtZWxvYWRlZCB0byBhdm9pZCBpbmZpbml0ZSBsb29wc1xyXG4gICAgICAgIGlmICghaWZyYW1lbG9hZGVkKSB7XHJcbiAgICAgICAgICAgIGlmcmFtZWxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBjb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuICRpZnJhbWU7XHJcbn07XHJcblxyXG4vKiBQdXRzIGZ1bGwgaHRtbCBpbnNpZGUgdGhlIGlmcmFtZSBlbGVtZW50IHBhc3NlZCBpbiBhIHNlY3VyZSBhbmQgY29tcGxpYW50IG1vZGUgKi9cclxuZnVuY3Rpb24gaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGh0bWwpIHtcclxuICAgIC8vIHB1dCBhamF4IGRhdGEgaW5zaWRlIGlmcmFtZSByZXBsYWNpbmcgYWxsIHRoZWlyIGh0bWwgaW4gc2VjdXJlIFxyXG4gICAgLy8gY29tcGxpYW50IG1vZGUgKCQuaHRtbCBkb24ndCB3b3JrcyB0byBpbmplY3QgPGh0bWw+PGhlYWQ+IGNvbnRlbnQpXHJcblxyXG4gICAgLyogZG9jdW1lbnQgQVBJIHZlcnNpb24gKHByb2JsZW1zIHdpdGggSUUsIGRvbid0IGV4ZWN1dGUgaWZyYW1lLWh0bWwgc2NyaXB0cykgKi9cclxuICAgIC8qdmFyIGlmcmFtZURvYyA9XHJcbiAgICAvLyBXM0MgY29tcGxpYW50OiBucywgZmlyZWZveC1nZWNrbywgY2hyb21lL3NhZmFyaS13ZWJraXQsIG9wZXJhLCBpZTlcclxuICAgIGlmcmFtZS5jb250ZW50RG9jdW1lbnQgfHxcclxuICAgIC8vIG9sZCBJRSAoNS41KylcclxuICAgIChpZnJhbWUuY29udGVudFdpbmRvdyA/IGlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50IDogbnVsbCkgfHxcclxuICAgIC8vIGZhbGxiYWNrICh2ZXJ5IG9sZCBJRT8pXHJcbiAgICBkb2N1bWVudC5mcmFtZXNbaWZyYW1lLmlkXS5kb2N1bWVudDtcclxuICAgIGlmcmFtZURvYy5vcGVuKCk7XHJcbiAgICBpZnJhbWVEb2Mud3JpdGUoaHRtbCk7XHJcbiAgICBpZnJhbWVEb2MuY2xvc2UoKTsqL1xyXG5cclxuICAgIC8qIGphdmFzY3JpcHQgVVJJIHZlcnNpb24gKHdvcmtzIGZpbmUgZXZlcnl3aGVyZSEpICovXHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdy5jb250ZW50cyA9IGh0bWw7XHJcbiAgICBpZnJhbWUuc3JjID0gJ2phdmFzY3JpcHQ6d2luZG93W1wiY29udGVudHNcIl0nO1xyXG5cclxuICAgIC8vIEFib3V0IHRoaXMgdGVjaG5pcXVlLCB0aGlzIGh0dHA6Ly9zcGFyZWN5Y2xlcy53b3JkcHJlc3MuY29tLzIwMTIvMDMvMDgvaW5qZWN0LWNvbnRlbnQtaW50by1hLW5ldy1pZnJhbWUvXHJcbn1cclxuXHJcbiIsIi8qIENSVURMIEhlbHBlciAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcbnZhciBnZXRUZXh0ID0gcmVxdWlyZSgnLi9nZXRUZXh0Jyk7XHJcblxyXG5leHBvcnRzLmRlZmF1bHRTZXR0aW5ncyA9IHtcclxuICBlZmZlY3RzOiB7XHJcbiAgICAnc2hvdy12aWV3ZXInOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSxcclxuICAgICdoaWRlLXZpZXdlcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LFxyXG4gICAgJ3Nob3ctZWRpdG9yJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sIC8vIHRoZSBzYW1lIGFzIGpxdWVyeS11aSB7IGVmZmVjdDogJ3NsaWRlJywgZHVyYXRpb246ICdzbG93JywgZGlyZWN0aW9uOiAnZG93bicgfVxyXG4gICAgJ2hpZGUtZWRpdG9yJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH1cclxuICB9LFxyXG4gIGV2ZW50czoge1xyXG4gICAgJ2VkaXQtZW5kcyc6ICdjcnVkbC1lZGl0LWVuZHMnLFxyXG4gICAgJ2VkaXQtc3RhcnRzJzogJ2NydWRsLWVkaXQtc3RhcnRzJyxcclxuICAgICdjcmVhdGUnOiAnY3J1ZGwtY3JlYXRlJyxcclxuICAgICd1cGRhdGUnOiAnY3J1ZGwtdXBkYXRlJyxcclxuICAgICdkZWxldGUnOiAnY3J1ZGwtZGVsZXRlJ1xyXG4gIH1cclxufTtcclxuXHJcbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiBzZXR1cENydWRsKG9uU3VjY2Vzcywgb25FcnJvciwgb25Db21wbGV0ZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICBvbjogZnVuY3Rpb24gb24oc2VsZWN0b3IsIHNldHRpbmdzKSB7XHJcbiAgICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgJy5jcnVkbCc7XHJcbiAgICAgIHZhciBpbnN0YW5jZSA9IHtcclxuICAgICAgICBzZWxlY3Rvcjogc2VsZWN0b3IsXHJcbiAgICAgICAgZWxlbWVudHM6ICQoc2VsZWN0b3IpXHJcbiAgICAgIH07XHJcbiAgICAgIC8vIEV4dGVuZGluZyBkZWZhdWx0IHNldHRpbmdzIHdpdGggcHJvdmlkZWQgb25lcyxcclxuICAgICAgLy8gYnV0IHNvbWUgY2FuIGJlIHR3ZWFrIG91dHNpZGUgdG9vLlxyXG4gICAgICBpbnN0YW5jZS5zZXR0aW5ncyA9ICQuZXh0ZW5kKHRydWUsIGV4cG9ydHMuZGVmYXVsdFNldHRpbmdzLCBzZXR0aW5ncyk7XHJcblxyXG4gICAgICBpbnN0YW5jZS5lbGVtZW50cy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3J1ZGwgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmIChjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nKSA9PT0gdHJ1ZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBkY3R4ID0gY3J1ZGwuZGF0YSgnY3J1ZGwtY29udGV4dCcpIHx8ICcnO1xyXG4gICAgICAgIHZhciB2d3IgPSBjcnVkbC5maW5kKCcuY3J1ZGwtdmlld2VyJyk7XHJcbiAgICAgICAgdmFyIGR0ciA9IGNydWRsLmZpbmQoJy5jcnVkbC1lZGl0b3InKTtcclxuICAgICAgICB2YXIgaWlkcGFyID0gY3J1ZGwuZGF0YSgnY3J1ZGwtaXRlbS1pZC1wYXJhbWV0ZXInKSB8fCAnSXRlbUlEJztcclxuICAgICAgICB2YXIgZm9ybXBhcnMgPSB7IGFjdGlvbjogJ2NyZWF0ZScgfTtcclxuICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gMDtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0RXh0cmFRdWVyeShlbCkge1xyXG4gICAgICAgICAgLy8gR2V0IGV4dHJhIHF1ZXJ5IG9mIHRoZSBlbGVtZW50LCBpZiBhbnk6XHJcbiAgICAgICAgICB2YXIgeHEgPSBlbC5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpIHx8ICcnO1xyXG4gICAgICAgICAgaWYgKHhxKSB4cSA9ICcmJyArIHhxO1xyXG4gICAgICAgICAgLy8gSXRlcmF0ZSBhbGwgcGFyZW50cyBpbmNsdWRpbmcgdGhlICdjcnVkbCcgZWxlbWVudCAocGFyZW50c1VudGlsIGV4Y2x1ZGVzIHRoZSBmaXJzdCBlbGVtZW50IGdpdmVuLFxyXG4gICAgICAgICAgLy8gYmVjYXVzZSBvZiB0aGF0IHdlIGdldCBpdHMgcGFyZW50KCkpXHJcbiAgICAgICAgICAvLyBGb3IgYW55IG9mIHRoZW0gd2l0aCBhbiBleHRyYS1xdWVyeSwgYXBwZW5kIGl0OlxyXG4gICAgICAgICAgZWwucGFyZW50c1VudGlsKGNydWRsLnBhcmVudCgpLCAnW2RhdGEtY3J1ZGwtZXh0cmEtcXVlcnldJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB4ID0gJCh0aGlzKS5kYXRhKCdjcnVkbC1leHRyYS1xdWVyeScpO1xyXG4gICAgICAgICAgICBpZiAoeCkgeHEgKz0gJyYnICsgeDtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIHhxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY3J1ZGwuZmluZCgnLmNydWRsLWNyZWF0ZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSAwO1xyXG4gICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ2NyZWF0ZSc7XHJcbiAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgZHRyLnJlbG9hZCh7XHJcbiAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKHVybCwgZGVmYXVsdFVybCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VXJsICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgZHRyLnhzaG93KGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctZWRpdG9yJ10pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEhpZGUgdmlld2VyIHdoZW4gaW4gZWRpdG9yOlxyXG4gICAgICAgICAgdndyLnhoaWRlKGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtdmlld2VyJ10pO1xyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSlcclxuICAgICAgICAgIC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50cy5jcmVhdGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdndyXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY3J1ZGwtdXBkYXRlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBpdGVtID0gJHQuY2xvc2VzdCgnLmNydWRsLWl0ZW0nKTtcclxuICAgICAgICAgIHZhciBpdGVtaWQgPSBpdGVtLmRhdGEoJ2NydWRsLWl0ZW0taWQnKTtcclxuICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICBmb3JtcGFycy5hY3Rpb24gPSAndXBkYXRlJztcclxuICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICBkdHIucmVsb2FkKHtcclxuICAgICAgICAgICAgdXJsOiBmdW5jdGlvbiAodXJsLCBkZWZhdWx0VXJsKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRVcmwgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgIGR0ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LWVkaXRvciddKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBIaWRlIHZpZXdlciB3aGVuIGluIGVkaXRvcjpcclxuICAgICAgICAgIHZ3ci54aGlkZShpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLXZpZXdlciddKTtcclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10pXHJcbiAgICAgICAgICAudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHMudXBkYXRlKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC1kZWxldGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGl0ZW0gPSAkdC5jbG9zZXN0KCcuY3J1ZGwtaXRlbScpO1xyXG4gICAgICAgICAgdmFyIGl0ZW1pZCA9IGl0ZW0uZGF0YSgnY3J1ZGwtaXRlbS1pZCcpO1xyXG5cclxuICAgICAgICAgIGlmIChjb25maXJtKGdldFRleHQoJ2NvbmZpcm0tZGVsZXRlLWNydWRsLWl0ZW0tbWVzc2FnZTonICsgZGN0eCkpKSB7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJzxkaXY+JyArIGdldFRleHQoJ2RlbGV0ZS1jcnVkbC1pdGVtLWxvYWRpbmctbWVzc2FnZTonICsgZGN0eCkgKyAnPC9kaXY+JywgaXRlbSk7XHJcbiAgICAgICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSBpdGVtaWQ7XHJcbiAgICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICdkZWxldGUnO1xyXG4gICAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgIHVybDogZHRyLmF0dHIoJ2RhdGEtc291cmNlLXVybCcpICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cSxcclxuICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCc8ZGl2PicgKyBkYXRhLlJlc3VsdCArICc8L2Rpdj4nLCBpdGVtLCBudWxsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2FibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmZhZGVPdXQoJ3Nsb3cnLCBmdW5jdGlvbiAoKSB7IGl0ZW0ucmVtb3ZlKCk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgb25TdWNjZXNzKGRhdGEsIHRleHQsIGp4KTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAgICAgICAgICAgICBvbkVycm9yKGp4LCBtZXNzYWdlLCBleCk7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZShpdGVtKTtcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIGNvbXBsZXRlOiBvbkNvbXBsZXRlXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2RlbGV0ZSddKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGZpbmlzaEVkaXQoKSB7XHJcbiAgICAgICAgICBmdW5jdGlvbiBvbmNvbXBsZXRlKGFub3RoZXJPbkNvbXBsZXRlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgLy8gU2hvdyBhZ2FpbiB0aGUgVmlld2VyXHJcbiAgICAgICAgICAgICAgLy92d3Iuc2xpZGVEb3duKCdzbG93Jyk7XHJcbiAgICAgICAgICAgICAgaWYgKCF2d3IuaXMoJzp2aXNpYmxlJykpXHJcbiAgICAgICAgICAgICAgICB2d3IueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSk7XHJcbiAgICAgICAgICAgICAgLy8gTWFyayB0aGUgZm9ybSBhcyB1bmNoYW5nZWQgdG8gYXZvaWQgcGVyc2lzdGluZyB3YXJuaW5nc1xyXG4gICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKGR0ci5maW5kKCdmb3JtJykuZ2V0KDApKTtcclxuICAgICAgICAgICAgICAvLyBBdm9pZCBjYWNoZWQgY29udGVudCBvbiB0aGUgRWRpdG9yXHJcbiAgICAgICAgICAgICAgZHRyLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIHVzZXIgY2FsbGJhY2s6XHJcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoYW5vdGhlck9uQ29tcGxldGUpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgYW5vdGhlck9uQ29tcGxldGUuYXBwbHkodGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBXZSBuZWVkIGEgY3VzdG9tIGNvbXBsZXRlIGNhbGxiYWNrLCBidXQgdG8gbm90IHJlcGxhY2UgdGhlIHVzZXIgY2FsbGJhY2ssIHdlXHJcbiAgICAgICAgICAvLyBjbG9uZSBmaXJzdCB0aGUgc2V0dGluZ3MgYW5kIHRoZW4gYXBwbHkgb3VyIGNhbGxiYWNrIHRoYXQgaW50ZXJuYWxseSB3aWxsIGNhbGxcclxuICAgICAgICAgIC8vIHRoZSB1c2VyIGNhbGxiYWNrIHByb3Blcmx5IChpZiBhbnkpXHJcbiAgICAgICAgICB2YXIgd2l0aGNhbGxiYWNrID0gJC5leHRlbmQodHJ1ZSwge30sIGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtZWRpdG9yJ10pO1xyXG4gICAgICAgICAgd2l0aGNhbGxiYWNrLmNvbXBsZXRlID0gb25jb21wbGV0ZSh3aXRoY2FsbGJhY2suY29tcGxldGUpO1xyXG4gICAgICAgICAgLy8gSGlkaW5nIGVkaXRvcjpcclxuICAgICAgICAgIGR0ci54aGlkZSh3aXRoY2FsbGJhY2spO1xyXG5cclxuICAgICAgICAgIC8vIE1hcmsgZm9ybSBhcyBzYXZlZCB0byByZW1vdmUgdGhlICdoYXMtY2hhbmdlcycgbWFya1xyXG4gICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZHRyLmZpbmQoJ2Zvcm0nKS5nZXQoMCkpO1xyXG5cclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkdHJcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jcnVkbC1jYW5jZWwnLCBmaW5pc2hFZGl0KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsICcuYWpheC1ib3gnLCBmaW5pc2hFZGl0KVxyXG4gICAgICAgIC5vbignYWpheFN1Y2Nlc3NQb3N0JywgJ2Zvcm0sIGZpZWxkc2V0JywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDAgfHwgZGF0YS5Db2RlID09IDUgfHwgZGF0YS5Db2RlID09IDYpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyB2aWV3ZXIgYW5kIHJlbG9hZCBsaXN0OlxyXG4gICAgICAgICAgICB2d3IueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSlcclxuICAgICAgICAgICAgLmZpbmQoJy5jcnVkbC1saXN0JykucmVsb2FkKHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIEEgc21hbGwgZGVsYXkgdG8gbGV0IHVzZXIgdG8gc2VlIHRoZSBuZXcgbWVzc2FnZSBvbiBidXR0b24gYmVmb3JlXHJcbiAgICAgICAgICAvLyBoaWRlIGl0IChiZWNhdXNlIGlzIGluc2lkZSB0aGUgZWRpdG9yKVxyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PSA1KVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZpbmlzaEVkaXQsIDE1MDApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nLCB0cnVlKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gaW5zdGFuY2U7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuIiwiLyogRGF0ZSBwaWNrZXIgaW5pdGlhbGl6YXRpb24gYW5kIHVzZVxyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG5mdW5jdGlvbiBzZXR1cERhdGVQaWNrZXIoKSB7XHJcbiAgICAvLyBEYXRlIFBpY2tlclxyXG4gICAgJC5kYXRlcGlja2VyLnNldERlZmF1bHRzKCQuZGF0ZXBpY2tlci5yZWdpb25hbFskKCdodG1sJykuYXR0cignbGFuZycpXSk7XHJcbiAgICAkKCcuZGF0ZS1waWNrJywgZG9jdW1lbnQpLmRhdGVwaWNrZXIoe1xyXG4gICAgICAgIHNob3dBbmltOiAnYmxpbmQnXHJcbiAgICB9KTtcclxuICAgIGFwcGx5RGF0ZVBpY2tlcigpO1xyXG59XHJcbmZ1bmN0aW9uIGFwcGx5RGF0ZVBpY2tlcihlbGVtZW50KSB7XHJcbiAgICAkKFwiLmRhdGUtcGlja1wiLCBlbGVtZW50IHx8IGRvY3VtZW50KVxyXG4gICAgLy8udmFsKG5ldyBEYXRlKCkuYXNTdHJpbmcoJC5kYXRlcGlja2VyLl9kZWZhdWx0cy5kYXRlRm9ybWF0KSlcclxuICAgIC5kYXRlcGlja2VyKHtcclxuICAgICAgICBzaG93QW5pbTogXCJibGluZFwiXHJcbiAgICB9KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdDogc2V0dXBEYXRlUGlja2VyLFxyXG4gICAgICAgIGFwcGx5OiBhcHBseURhdGVQaWNrZXJcclxuICAgIH07XHJcbiIsIi8qIEZvcm1hdCBhIGRhdGUgYXMgWVlZWS1NTS1ERCBpbiBVVEMgZm9yIHNhdmUgdXNcclxuICAgIHRvIGludGVyY2hhbmdlIHdpdGggb3RoZXIgbW9kdWxlcyBvciBhcHBzLlxyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKSB7XHJcbiAgICB2YXIgbSA9IChkYXRlLmdldFVUQ01vbnRoKCkgKyAxKS50b1N0cmluZygpLFxyXG4gICAgICAgIGQgPSBkYXRlLmdldFVUQ0RhdGUoKS50b1N0cmluZygpO1xyXG4gICAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICAgICAgbSA9ICcwJyArIG07XHJcbiAgICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgICAgICBkID0gJzAnICsgZDtcclxuICAgIHJldHVybiBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKSArICctJyArIG0gKyAnLScgKyBkO1xyXG59OyIsIi8qKiBBbiBpMThuIHV0aWxpdHksIGdldCBhIHRyYW5zbGF0aW9uIHRleHQgYnkgbG9va2luZyBmb3Igc3BlY2lmaWMgZWxlbWVudHMgaW4gdGhlIGh0bWxcclxud2l0aCB0aGUgbmFtZSBnaXZlbiBhcyBmaXJzdCBwYXJhbWVudGVyIGFuZCBhcHBseWluZyB0aGUgZ2l2ZW4gdmFsdWVzIG9uIHNlY29uZCBhbmQgXHJcbm90aGVyIHBhcmFtZXRlcnMuXHJcbiAgICBUT0RPOiBSRS1JTVBMRU1FTlQgbm90IHVzaW5nIGpRdWVyeSBuZWxzZSBET00gZWxlbWVudHMsIG9yIGFsbW9zdCBub3QgZWxlbWVudHMgaW5zaWRlIGJvZHlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG5mdW5jdGlvbiBnZXRUZXh0KCkge1xyXG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAvLyBHZXQga2V5IGFuZCB0cmFuc2xhdGUgaXRcclxuICAgIHZhciBmb3JtYXR0ZWQgPSBhcmdzWzBdO1xyXG4gICAgdmFyIHRleHQgPSAkKCcjbGNyZXMtJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoZm9ybWF0dGVkKSkudGV4dCgpO1xyXG4gICAgaWYgKHRleHQpXHJcbiAgICAgICAgZm9ybWF0dGVkID0gdGV4dDtcclxuICAgIC8vIEFwcGx5IGZvcm1hdCB0byB0aGUgdGV4dCB3aXRoIGFkZGl0aW9uYWwgcGFyYW1ldGVyc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJ1xcXFx7JyArIGkgKyAnXFxcXH0nLCAnZ2knKTtcclxuICAgICAgICBmb3JtYXR0ZWQgPSBmb3JtYXR0ZWQucmVwbGFjZShyZWdleHAsIGFyZ3NbaSArIDFdKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmb3JtYXR0ZWQ7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0VGV4dDsiLCIvKiogUmV0dXJucyB0aGUgcGF0aCB0byB0aGUgZ2l2ZW4gZWxlbWVudCBpbiBYUGF0aCBjb252ZW50aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gZ2V0WFBhdGgoZWxlbWVudCkge1xyXG4gICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5pZClcclxuICAgICAgICByZXR1cm4gJy8vKltAaWQ9XCInICsgZWxlbWVudC5pZCArICdcIl0nO1xyXG4gICAgdmFyIHhwYXRoID0gJyc7XHJcbiAgICBmb3IgKDsgZWxlbWVudCAmJiBlbGVtZW50Lm5vZGVUeXBlID09IDE7IGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICB2YXIgaWQgPSAkKGVsZW1lbnQucGFyZW50Tm9kZSkuY2hpbGRyZW4oZWxlbWVudC50YWdOYW1lKS5pbmRleChlbGVtZW50KSArIDE7XHJcbiAgICAgICAgaWQgPSAoaWQgPiAxID8gJ1snICsgaWQgKyAnXScgOiAnJyk7XHJcbiAgICAgICAgeHBhdGggPSAnLycgKyBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSArIGlkICsgeHBhdGg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geHBhdGg7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0WFBhdGg7XHJcbiIsIi8vIEl0IGV4ZWN1dGVzIHRoZSBnaXZlbiAncmVhZHknIGZ1bmN0aW9uIGFzIHBhcmFtZXRlciB3aGVuXHJcbi8vIG1hcCBlbnZpcm9ubWVudCBpcyByZWFkeSAod2hlbiBnb29nbGUgbWFwcyBhcGkgYW5kIHNjcmlwdCBpc1xyXG4vLyBsb2FkZWQgYW5kIHJlYWR5IHRvIHVzZSwgb3IgaW5tZWRpYXRlbHkgaWYgaXMgYWxyZWFkeSBsb2FkZWQpLlxyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4vbG9hZGVyJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdvb2dsZU1hcFJlYWR5KHJlYWR5KSB7XHJcbiAgICB2YXIgc3RhY2sgPSBnb29nbGVNYXBSZWFkeS5zdGFjayB8fCBbXTtcclxuICAgIHN0YWNrLnB1c2gocmVhZHkpO1xyXG4gICAgZ29vZ2xlTWFwUmVhZHkuc3RhY2sgPSBzdGFjaztcclxuXHJcbiAgICBpZiAoZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSlcclxuICAgICAgICByZWFkeSgpO1xyXG4gICAgZWxzZSBpZiAoIWdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZykge1xyXG4gICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IHRydWU7XHJcbiAgICAgICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICAgICAgICBzY3JpcHRzOiBbXCJodHRwczovL3d3dy5nb29nbGUuY29tL2pzYXBpXCJdLFxyXG4gICAgICAgICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogZnVuY3Rpb24gKCkgeyByZXR1cm4gISF3aW5kb3cuZ29vZ2xlOyB9LFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgZ29vZ2xlLmxvYWQoXCJtYXBzXCIsIFwiMy4xMFwiLCB7IG90aGVyX3BhcmFtczogXCJzZW5zb3I9ZmFsc2VcIiwgXCJjYWxsYmFja1wiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNSZWFkeSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgZ29vZ2xlTWFwUmVhZHkuaXNMb2FkaW5nID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFja1tpXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07IiwiLyogR1VJRCBHZW5lcmF0b3JcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ3VpZEdlbmVyYXRvcigpIHtcclxuICAgIHZhciBTNCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCgoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMCkgfCAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiAoUzQoKSArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBcIi1cIiArIFM0KCkgKyBTNCgpICsgUzQoKSk7XHJcbn07IiwiLyoqXHJcbiAgICBHZW5lcmljIHNjcmlwdCBmb3IgZmllbGRzZXRzIHdpdGggY2xhc3MgLmhhcy1jb25maXJtLCBhbGxvd2luZyBzaG93XHJcbiAgICB0aGUgY29udGVudCBvbmx5IGlmIHRoZSBtYWluIGNvbmZpcm0gZmllbGRzIGhhdmUgJ3llcycgc2VsZWN0ZWQuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxudmFyIGRlZmF1bHRTZWxlY3RvciA9ICdmaWVsZHNldC5oYXMtY29uZmlybSA+IC5jb25maXJtIGlucHV0JztcclxuXHJcbmZ1bmN0aW9uIG9uY2hhbmdlKCkge1xyXG4gICAgdmFyIHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGZzID0gdC5jbG9zZXN0KCdmaWVsZHNldCcpO1xyXG4gICAgaWYgKHQuaXMoJzpjaGVja2VkJykpXHJcbiAgICAgICAgaWYgKHQudmFsKCkgPT0gJ3llcycgfHwgdC52YWwoKSA9PSAnVHJ1ZScpXHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKCdjb25maXJtZWQtbm8nKS5hZGRDbGFzcygnY29uZmlybWVkLXllcycpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3MoJ2NvbmZpcm1lZC15ZXMnKS5hZGRDbGFzcygnY29uZmlybWVkLW5vJyk7XHJcbn1cclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgZGVmYXVsdFNlbGVjdG9yO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9uKCdjaGFuZ2UnLCBzZWxlY3Rvciwgb25jaGFuZ2UpO1xyXG4gICAgLy8gUGVyZm9ybXMgZmlyc3QgY2hlY2s6XHJcbiAgICAkKHNlbGVjdG9yKS5jaGFuZ2UoKTtcclxufTtcclxuXHJcbmV4cG9ydHMub2ZmID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XHJcbiAgICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8IGRlZmF1bHRTZWxlY3RvcjtcclxuXHJcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2NoYW5nZScsIHNlbGVjdG9yKTtcclxufTsiLCIvKiBJbnRlcm5hemlvbmFsaXphdGlvbiBVdGlsaXRpZXNcclxuICovXHJcbnZhciBpMThuID0ge307XHJcbmkxOG4uZGlzdGFuY2VVbml0cyA9IHtcclxuICAgICdFUyc6ICdrbScsXHJcbiAgICAnVVMnOiAnbWlsZXMnXHJcbn07XHJcbmkxOG4ubnVtZXJpY01pbGVzU2VwYXJhdG9yID0ge1xyXG4gICAgJ2VzLUVTJzogJy4nLFxyXG4gICAgJ2VzLVVTJzogJy4nLFxyXG4gICAgJ2VuLVVTJzogJywnLFxyXG4gICAgJ2VuLUVTJzogJywnXHJcbn07XHJcbmkxOG4ubnVtZXJpY0RlY2ltYWxTZXBhcmF0b3IgPSB7XHJcbiAgICAnZXMtRVMnOiAnLCcsXHJcbiAgICAnZXMtVVMnOiAnLCcsXHJcbiAgICAnZW4tVVMnOiAnLicsXHJcbiAgICAnZW4tRVMnOiAnLidcclxufTtcclxuaTE4bi5tb25leVN5bWJvbFByZWZpeCA9IHtcclxuICAgICdFUyc6ICcnLFxyXG4gICAgJ1VTJzogJyQnXHJcbn07XHJcbmkxOG4ubW9uZXlTeW1ib2xTdWZpeCA9IHtcclxuICAgICdFUyc6ICfigqwnLFxyXG4gICAgJ1VTJzogJydcclxufTtcclxuaTE4bi5nZXRDdXJyZW50Q3VsdHVyZSA9IGZ1bmN0aW9uIGdldEN1cnJlbnRDdWx0dXJlKCkge1xyXG4gICAgdmFyIGMgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKTtcclxuICAgIHZhciBzID0gYy5zcGxpdCgnLScpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdWx0dXJlOiBjLFxyXG4gICAgICAgIGxhbmd1YWdlOiBzWzBdLFxyXG4gICAgICAgIGNvdW50cnk6IHNbMV1cclxuICAgIH07XHJcbn07XHJcbmkxOG4uY29udmVydE1pbGVzS20gPSBmdW5jdGlvbiBjb252ZXJ0TWlsZXNLbShxLCB1bml0KSB7XHJcbiAgICB2YXIgTUlMRVNfVE9fS00gPSAxLjYwOTtcclxuICAgIGlmICh1bml0ID09ICdtaWxlcycpXHJcbiAgICAgICAgcmV0dXJuIE1JTEVTX1RPX0tNICogcTtcclxuICAgIGVsc2UgaWYgKHVuaXQgPT0gJ2ttJylcclxuICAgICAgICByZXR1cm4gcSAvIE1JTEVTX1RPX0tNO1xyXG4gICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5sb2cpIGNvbnNvbGUubG9nKCdjb252ZXJ0TWlsZXNLbTogVW5yZWNvZ25pemVkIHVuaXQgJyArIHVuaXQpO1xyXG4gICAgcmV0dXJuIDA7XHJcbn07XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGkxOG47IiwiLyogUmV0dXJucyB0cnVlIHdoZW4gc3RyIGlzXHJcbi0gbnVsbFxyXG4tIGVtcHR5IHN0cmluZ1xyXG4tIG9ubHkgd2hpdGUgc3BhY2VzIHN0cmluZ1xyXG4qL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzRW1wdHlTdHJpbmcoc3RyKSB7XHJcbiAgICByZXR1cm4gISgvXFxTL2cudGVzdChzdHIgfHwgXCJcIikpO1xyXG59OyIsIi8qKiBBcyB0aGUgJ2lzJyBqUXVlcnkgbWV0aG9kLCBidXQgY2hlY2tpbmcgQHNlbGVjdG9yIGluIGFsbCBlbGVtZW50c1xyXG4qIEBtb2RpZmllciB2YWx1ZXM6XHJcbiogLSAnYWxsJzogYWxsIGVsZW1lbnRzIG11c3QgbWF0Y2ggc2VsZWN0b3IgdG8gcmV0dXJuIHRydWVcclxuKiAtICdhbG1vc3Qtb25lJzogYWxtb3N0IG9uZSBlbGVtZW50IG11c3QgbWF0Y2hcclxuKiAtICdwZXJjZW50YWdlJzogcmV0dXJucyBwZXJjZW50YWdlIG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG1hdGNoIHNlbGVjdG9yICgwLTEwMClcclxuKiAtICdzdW1tYXJ5JzogcmV0dXJucyB0aGUgb2JqZWN0IHsgeWVzOiBudW1iZXIsIG5vOiBudW1iZXIsIHBlcmNlbnRhZ2U6IG51bWJlciwgdG90YWw6IG51bWJlciB9XHJcbiogLSB7anVzdDogYSBudW1iZXJ9OiBleGFjdCBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbiogLSB7YWxtb3N0OiBhIG51bWJlcn06IG1pbmltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qIC0ge3VudGlsOiBhIG51bWJlcn06IG1heGltdW0gbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbXVzdCBtYXRjaCB0byByZXR1cm4gdHJ1ZVxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uYXJlID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBtb2RpZmllcikge1xyXG4gICAgbW9kaWZpZXIgPSBtb2RpZmllciB8fCAnYWxsJztcclxuICAgIHZhciBjb3VudCA9IDA7XHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmlzKHNlbGVjdG9yKSlcclxuICAgICAgICAgICAgY291bnQrKztcclxuICAgIH0pO1xyXG4gICAgc3dpdGNoIChtb2RpZmllcikge1xyXG4gICAgICAgIGNhc2UgJ2FsbCc6XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxlbmd0aCA9PSBjb3VudDtcclxuICAgICAgICBjYXNlICdhbG1vc3Qtb25lJzpcclxuICAgICAgICAgICAgcmV0dXJuIGNvdW50ID4gMDtcclxuICAgICAgICBjYXNlICdwZXJjZW50YWdlJzpcclxuICAgICAgICAgICAgcmV0dXJuIGNvdW50IC8gdGhpcy5sZW5ndGg7XHJcbiAgICAgICAgY2FzZSAnc3VtbWFyeSc6XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB5ZXM6IGNvdW50LFxyXG4gICAgICAgICAgICAgICAgbm86IHRoaXMubGVuZ3RoIC0gY291bnQsXHJcbiAgICAgICAgICAgICAgICBwZXJjZW50YWdlOiBjb3VudCAvIHRoaXMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgdG90YWw6IHRoaXMubGVuZ3RoXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWYgKCdqdXN0JyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuanVzdCAhPSBjb3VudClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ2FsbW9zdCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLmFsbW9zdCA+IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICgndW50aWwnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci51bnRpbCA8IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICB9XHJcbn07IiwiLyoqXHJcbiogSGFzU2Nyb2xsQmFyIHJldHVybnMgYW4gb2JqZWN0IHdpdGggYm9vbCBwcm9wZXJ0aWVzICd2ZXJ0aWNhbCcgYW5kICdob3Jpem9udGFsJ1xyXG4qIHNheWluZyBpZiB0aGUgZWxlbWVudCBoYXMgbmVlZCBvZiBzY3JvbGxiYXJzIGZvciBlYWNoIGRpbWVuc2lvbiBvciBub3QgKGVsZW1lbnRcclxuKiBjYW4gbmVlZCBzY3JvbGxiYXJzIGFuZCBzdGlsbCBub3QgYmVpbmcgc2hvd2VkIGJlY2F1c2UgdGhlIGNzcy1vdmVybGZsb3cgcHJvcGVydHlcclxuKiBiZWluZyBzZXQgYXMgJ2hpZGRlbicsIGJ1dCBzdGlsbCB3ZSBrbm93IHRoYXQgdGhlIGVsZW1lbnQgcmVxdWlyZXMgaXQgYW5kIGl0c1xyXG4qIGNvbnRlbnQgaXMgbm90IGJlaW5nIGZ1bGx5IGRpc3BsYXllZCkuXHJcbiogQGV4dHJhZ2FwLCBkZWZhdWx0cyB0byB7eDowLHk6MH0sIGxldHMgc3BlY2lmeSBhbiBleHRyYSBzaXplIGluIHBpeGVscyBmb3IgZWFjaCBkaW1lbnNpb24gdGhhdCBhbHRlciB0aGUgcmVhbCBjaGVjayxcclxuKiByZXN1bHRpbmcgaW4gYSBmYWtlIHJlc3VsdCB0aGF0IGNhbiBiZSBpbnRlcmVzdGluZyB0byBkaXNjYXJkIHNvbWUgcGl4ZWxzIG9mIGV4Y2Vzc1xyXG4qIHNpemUgKG5lZ2F0aXZlIHZhbHVlcykgb3IgZXhhZ2VyYXRlIHRoZSByZWFsIHVzZWQgc2l6ZSB3aXRoIHRoYXQgZXh0cmEgcGl4ZWxzIChwb3NpdGl2ZSB2YWx1ZXMpLlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uaGFzU2Nyb2xsQmFyID0gZnVuY3Rpb24gKGV4dHJhZ2FwKSB7XHJcbiAgICBleHRyYWdhcCA9ICQuZXh0ZW5kKHtcclxuICAgICAgICB4OiAwLFxyXG4gICAgICAgIHk6IDBcclxuICAgIH0sIGV4dHJhZ2FwKTtcclxuICAgIGlmICghdGhpcyB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHsgdmVydGljYWw6IGZhbHNlLCBob3Jpem9udGFsOiBmYWxzZSB9O1xyXG4gICAgLy9ub3RlOiBjbGllbnRIZWlnaHQ9IGhlaWdodCBvZiBob2xkZXJcclxuICAgIC8vc2Nyb2xsSGVpZ2h0PSB3ZSBoYXZlIGNvbnRlbnQgdGlsbCB0aGlzIGhlaWdodFxyXG4gICAgdmFyIHQgPSB0aGlzLmdldCgwKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdmVydGljYWw6IHRoaXMub3V0ZXJIZWlnaHQoZmFsc2UpIDwgKHQuc2Nyb2xsSGVpZ2h0ICsgZXh0cmFnYXAueSksXHJcbiAgICAgICAgaG9yaXpvbnRhbDogdGhpcy5vdXRlcldpZHRoKGZhbHNlKSA8ICh0LnNjcm9sbFdpZHRoICsgZXh0cmFnYXAueClcclxuICAgIH07XHJcbn07IiwiLyoqIENoZWNrcyBpZiBjdXJyZW50IGVsZW1lbnQgb3Igb25lIG9mIHRoZSBjdXJyZW50IHNldCBvZiBlbGVtZW50cyBoYXNcclxuYSBwYXJlbnQgdGhhdCBtYXRjaCB0aGUgZWxlbWVudCBvciBleHByZXNzaW9uIGdpdmVuIGFzIGZpcnN0IHBhcmFtZXRlclxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiQuZm4uaXNDaGlsZE9mID0gZnVuY3Rpb24galF1ZXJ5X3BsdWdpbl9pc0NoaWxkT2YoZXhwKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnRzKCkuZmlsdGVyKGV4cCkubGVuZ3RoID4gMDtcclxufTsiLCIvKipcclxuICAgIEdldHMgdGhlIGh0bWwgc3RyaW5nIG9mIHRoZSBmaXJzdCBlbGVtZW50IGFuZCBhbGwgaXRzIGNvbnRlbnQuXHJcbiAgICBUaGUgJ2h0bWwnIG1ldGhvZCBvbmx5IHJldHJpZXZlcyB0aGUgaHRtbCBzdHJpbmcgb2YgdGhlIGNvbnRlbnQsIG5vdCB0aGUgZWxlbWVudCBpdHNlbGYuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5vdXRlckh0bWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoIXRoaXMgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAnJztcclxuICAgIHZhciBlbCA9IHRoaXMuZ2V0KDApO1xyXG4gICAgdmFyIGh0bWwgPSAnJztcclxuICAgIGlmIChlbC5vdXRlckhUTUwpXHJcbiAgICAgICAgaHRtbCA9IGVsLm91dGVySFRNTDtcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGh0bWwgPSB0aGlzLndyYXBBbGwoJzxkaXY+PC9kaXY+JykucGFyZW50KCkuaHRtbCgpO1xyXG4gICAgICAgIHRoaXMudW53cmFwKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaHRtbDtcclxufTsiLCIvKipcclxuICAgIFVzaW5nIHRoZSBhdHRyaWJ1dGUgZGF0YS1zb3VyY2UtdXJsIG9uIGFueSBIVE1MIGVsZW1lbnQsXHJcbiAgICB0aGlzIGFsbG93cyByZWxvYWQgaXRzIGNvbnRlbnQgcGVyZm9ybWluZyBhbiBBSkFYIG9wZXJhdGlvblxyXG4gICAgb24gdGhlIGdpdmVuIFVSTCBvciB0aGUgb25lIGluIHRoZSBhdHRyaWJ1dGU7IHRoZSBlbmQtcG9pbnRcclxuICAgIG11c3QgcmV0dXJuIHRleHQvaHRtbCBjb250ZW50LlxyXG4qKi9cclxudmFyICQgPSBqUXVlcnkgfHwgcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8vIERlZmF1bHQgc3VjY2VzcyBjYWxsYmFjayBhbmQgcHVibGljIHV0aWxpdHksIGJhc2ljIGhvdy10byByZXBsYWNlIGVsZW1lbnQgY29udGVudCB3aXRoIGZldGNoZWQgaHRtbFxyXG5mdW5jdGlvbiB1cGRhdGVFbGVtZW50KGh0bWxDb250ZW50LCBjb250ZXh0KSB7XHJcbiAgICBjb250ZXh0ID0gJC5pc1BsYWluT2JqZWN0KGNvbnRleHQpICYmIGNvbnRleHQgPyBjb250ZXh0IDogdGhpcztcclxuXHJcbiAgICAvLyBjcmVhdGUgalF1ZXJ5IG9iamVjdCB3aXRoIHRoZSBIVE1MXHJcbiAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhbiBlbXB0eSBkb2N1bWVudCBvciBtYWxmb3JtZWQgaXMgcmV0dXJuZWQ6XHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgIGlmICh0eXBlb2YgKCQucGFyc2VIVE1MKSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgICAgbmV3aHRtbCA9ICQoJC5wYXJzZUhUTUwoaHRtbENvbnRlbnQpKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIG5ld2h0bWwgPSAkKGh0bWxDb250ZW50KTtcclxuICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcilcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBlbGVtZW50ID0gY29udGV4dC5lbGVtZW50O1xyXG4gICAgaWYgKGNvbnRleHQub3B0aW9ucy5tb2RlID09ICdyZXBsYWNlLW1lJylcclxuICAgICAgICBlbGVtZW50LnJlcGxhY2VXaXRoKG5ld2h0bWwpO1xyXG4gICAgZWxzZSAvLyAncmVwbGFjZS1jb250ZW50J1xyXG4gICAgICAgIGVsZW1lbnQuaHRtbChuZXdodG1sKTtcclxuXHJcbiAgICByZXR1cm4gY29udGV4dDtcclxufVxyXG5cclxuLy8gRGVmYXVsdCBjb21wbGV0ZSBjYWxsYmFjayBhbmQgcHVibGljIHV0aWxpdHlcclxuZnVuY3Rpb24gc3RvcExvYWRpbmdTcGlubmVyKCkge1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHRoaXMuZWxlbWVudCk7XHJcbn1cclxuXHJcbi8vIERlZmF1bHRzXHJcbnZhciBkZWZhdWx0cyA9IHtcclxuICAgIHVybDogbnVsbCxcclxuICAgIHN1Y2Nlc3M6IFt1cGRhdGVFbGVtZW50XSxcclxuICAgIGVycm9yOiBbXSxcclxuICAgIGNvbXBsZXRlOiBbc3RvcExvYWRpbmdTcGlubmVyXSxcclxuICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgIG1vZGU6ICdyZXBsYWNlLWNvbnRlbnQnLFxyXG4gICAgbG9hZGluZzoge1xyXG4gICAgICAgIGxvY2tFbGVtZW50OiB0cnVlLFxyXG4gICAgICAgIGxvY2tPcHRpb25zOiB7fSxcclxuICAgICAgICBtZXNzYWdlOiBudWxsLFxyXG4gICAgICAgIHNob3dMb2FkaW5nSW5kaWNhdG9yOiB0cnVlLFxyXG4gICAgICAgIGRlbGF5OiAwXHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiBSZWxvYWQgbWV0aG9kICovXHJcbnZhciByZWxvYWQgPSAkLmZuLnJlbG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIE9wdGlvbnMgZnJvbSBkZWZhdWx0cyAoaW50ZXJuYWwgYW5kIHB1YmxpYylcclxuICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCByZWxvYWQuZGVmYXVsdHMpO1xyXG4gICAgLy8gSWYgb3B0aW9ucyBvYmplY3QgaXMgcGFzc2VkIGFzIHVuaXF1ZSBwYXJhbWV0ZXJcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEgJiYgJC5pc1BsYWluT2JqZWN0KGFyZ3VtZW50c1swXSkpIHtcclxuICAgICAgICAvLyBNZXJnZSBvcHRpb25zOlxyXG4gICAgICAgICQuZXh0ZW5kKHRydWUsIG9wdGlvbnMsIGFyZ3VtZW50c1swXSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIENvbW1vbiBvdmVybG9hZDogbmV3LXVybCBhbmQgY29tcGxldGUgY2FsbGJhY2ssIGJvdGggb3B0aW9uYWxzXHJcbiAgICAgICAgb3B0aW9ucy51cmwgPSBhcmd1bWVudHMubGVuZ3RoID4gMCA/IGFyZ3VtZW50c1swXSA6IG51bGw7XHJcbiAgICAgICAgb3B0aW9ucy5jb21wbGV0ZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgIGlmIChvcHRpb25zLnVybCkge1xyXG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG9wdGlvbnMudXJsKSlcclxuICAgICAgICAgICAgLy8gRnVuY3Rpb24gcGFyYW1zOiBjdXJyZW50UmVsb2FkVXJsLCBkZWZhdWx0UmVsb2FkVXJsXHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdzb3VyY2UtdXJsJywgJC5wcm94eShvcHRpb25zLnVybCwgdGhpcykoJHQuZGF0YSgnc291cmNlLXVybCcpLCAkdC5hdHRyKCdkYXRhLXNvdXJjZS11cmwnKSkpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdzb3VyY2UtdXJsJywgb3B0aW9ucy51cmwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdXJsID0gJHQuZGF0YSgnc291cmNlLXVybCcpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbHJlYWR5IGJlaW5nIHJlbG9hZGVkLCB0byBjYW5jZWwgcHJldmlvdXMgYXR0ZW1wdFxyXG4gICAgICAgIHZhciBqcSA9ICR0LmRhdGEoJ2lzUmVsb2FkaW5nJyk7XHJcbiAgICAgICAgaWYgKGpxKSB7XHJcbiAgICAgICAgICAgIGlmIChqcS51cmwgPT0gdXJsKVxyXG4gICAgICAgICAgICAgICAgLy8gSXMgdGhlIHNhbWUgdXJsLCBkbyBub3QgYWJvcnQgYmVjYXVzZSBpcyB0aGUgc2FtZSByZXN1bHQgYmVpbmcgcmV0cmlldmVkXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGpxLmFib3J0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBPcHRpb25hbCBkYXRhIHBhcmFtZXRlciAncmVsb2FkLW1vZGUnIGFjY2VwdHMgdmFsdWVzOiBcclxuICAgICAgICAvLyAtICdyZXBsYWNlLW1lJzogVXNlIGh0bWwgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IHJlbG9hZGVkIGVsZW1lbnQgKGFrYTogcmVwbGFjZVdpdGgoKSlcclxuICAgICAgICAvLyAtICdyZXBsYWNlLWNvbnRlbnQnOiAoZGVmYXVsdCkgSHRtbCByZXR1cm5lZCByZXBsYWNlIGN1cnJlbnQgZWxlbWVudCBjb250ZW50IChha2E6IGh0bWwoKSlcclxuICAgICAgICBvcHRpb25zLm1vZGUgPSAkdC5kYXRhKCdyZWxvYWQtbW9kZScpIHx8IG9wdGlvbnMubW9kZTtcclxuXHJcbiAgICAgICAgaWYgKHVybCkge1xyXG5cclxuICAgICAgICAgICAgLy8gTG9hZGluZywgd2l0aCBkZWxheVxyXG4gICAgICAgICAgICB2YXIgbG9hZGluZ3RpbWVyID0gb3B0aW9ucy5sb2FkaW5nLmxvY2tFbGVtZW50ID9cclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENyZWF0aW5nIGNvbnRlbnQgdXNpbmcgYSBmYWtlIHRlbXAgcGFyZW50IGVsZW1lbnQgdG8gcHJlbG9hZCBpbWFnZSBhbmQgdG8gZ2V0IHJlYWwgbWVzc2FnZSB3aWR0aDpcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG9hZGluZ2NvbnRlbnQgPSAkKCc8ZGl2Lz4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgPyAkKCc8ZGl2IGNsYXNzPVwibG9hZGluZy1tZXNzYWdlXCIvPicpLmFwcGVuZChvcHRpb25zLmxvYWRpbmcubWVzc2FnZSkgOiBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQob3B0aW9ucy5sb2FkaW5nLnNob3dMb2FkaW5nSW5kaWNhdG9yID8gb3B0aW9ucy5sb2FkaW5nLm1lc3NhZ2UgOiBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICBsb2FkaW5nY29udGVudC5jc3MoeyBwb3NpdGlvbjogJ2Fic29sdXRlJywgbGVmdDogLTk5OTk5IH0pLmFwcGVuZFRvKCdib2R5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHcgPSBsb2FkaW5nY29udGVudC53aWR0aCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdjb250ZW50LmRldGFjaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIExvY2tpbmc6XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zLmF1dG9mb2N1cyA9IG9wdGlvbnMuYXV0b2ZvY3VzO1xyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucy53aWR0aCA9IHc7XHJcbiAgICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihsb2FkaW5nY29udGVudC5odG1sKCksICR0LCBvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA/ICdjdXN0b20tbG9hZGluZycgOiAnbG9hZGluZycsIG9wdGlvbnMubG9hZGluZy5sb2NrT3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9LCBvcHRpb25zLmxvYWRpbmcuZGVsYXkpXHJcbiAgICAgICAgICAgICAgICA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICAvLyBQcmVwYXJlIGNvbnRleHRcclxuICAgICAgICAgICAgdmFyIGN0eCA9IHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICR0LFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcclxuICAgICAgICAgICAgICAgIGxvYWRpbmdUaW1lcjogbG9hZGluZ3RpbWVyXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICAgICAgICAgIGpxID0gJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgICAgICAgICBjb250ZXh0OiBjdHhcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBVcmwgaXMgc2V0IGluIHRoZSByZXR1cm5lZCBhamF4IG9iamVjdCBiZWNhdXNlIGlzIG5vdCBzZXQgYnkgYWxsIHZlcnNpb25zIG9mIGpRdWVyeVxyXG4gICAgICAgICAgICBqcS51cmwgPSB1cmw7XHJcblxyXG4gICAgICAgICAgICAvLyBNYXJrIGVsZW1lbnQgYXMgaXMgYmVpbmcgcmVsb2FkZWQsIHRvIGF2b2lkIG11bHRpcGxlIGF0dGVtcHMgYXQgc2FtZSB0aW1lLCBzYXZpbmdcclxuICAgICAgICAgICAgLy8gY3VycmVudCBhamF4IG9iamVjdCB0byBhbGxvdyBiZSBjYW5jZWxsZWRcclxuICAgICAgICAgICAgJHQuZGF0YSgnaXNSZWxvYWRpbmcnLCBqcSk7XHJcbiAgICAgICAgICAgIGpxLmFsd2F5cyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkdC5kYXRhKCdpc1JlbG9hZGluZycsIG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIENhbGxiYWNrczogZmlyc3QgZ2xvYmFscyBhbmQgdGhlbiBmcm9tIG9wdGlvbnMgaWYgdGhleSBhcmUgZGlmZmVyZW50XHJcbiAgICAgICAgICAgIC8vIHN1Y2Nlc3NcclxuICAgICAgICAgICAganEuZG9uZShyZWxvYWQuZGVmYXVsdHMuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLnN1Y2Nlc3MgIT0gcmVsb2FkLmRlZmF1bHRzLnN1Y2Nlc3MpXHJcbiAgICAgICAgICAgICAgICBqcS5kb25lKG9wdGlvbnMuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIC8vIGVycm9yXHJcbiAgICAgICAgICAgIGpxLmZhaWwocmVsb2FkLmRlZmF1bHRzLmVycm9yKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZXJyb3IgIT0gcmVsb2FkLmRlZmF1bHRzLmVycm9yKVxyXG4gICAgICAgICAgICAgICAganEuZmFpbChvcHRpb25zLmVycm9yKTtcclxuICAgICAgICAgICAgLy8gY29tcGxldGVcclxuICAgICAgICAgICAganEuYWx3YXlzKHJlbG9hZC5kZWZhdWx0cy5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNvbXBsZXRlICE9IHJlbG9hZC5kZWZhdWx0cy5jb21wbGV0ZSlcclxuICAgICAgICAgICAgICAgIGpxLmRvbmUob3B0aW9ucy5jb21wbGV0ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8vIFB1YmxpYyBkZWZhdWx0c1xyXG5yZWxvYWQuZGVmYXVsdHMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMpO1xyXG5cclxuLy8gUHVibGljIHV0aWxpdGllc1xyXG5yZWxvYWQudXBkYXRlRWxlbWVudCA9IHVwZGF0ZUVsZW1lbnQ7XHJcbnJlbG9hZC5zdG9wTG9hZGluZ1NwaW5uZXIgPSBzdG9wTG9hZGluZ1NwaW5uZXI7XHJcblxyXG4vLyBNb2R1bGVcclxubW9kdWxlLmV4cG9ydHMgPSByZWxvYWQ7IiwiLyoqIEV4dGVuZGVkIHRvZ2dsZS1zaG93LWhpZGUgZnVudGlvbnMuXHJcbiAgICBJYWdvU1JMQGdtYWlsLmNvbVxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICoqL1xyXG4oZnVuY3Rpb24oKXtcclxuXHJcbiAgICAvKiogSW1wbGVtZW50YXRpb246IHJlcXVpcmUgalF1ZXJ5IGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIHRoZVxyXG4gICAgICAgIHB1YmxpYyBtZXRob2RzLlxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24geHRzaChqUXVlcnkpIHtcclxuICAgICAgICB2YXIgJCA9IGpRdWVyeTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGlkZSBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnaGlkZScgYW5kICdmYWRlT3V0JyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5mYWRlT3V0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5zbGlkZVVwKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnaGlkZSdcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAkZS5oaWRlKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hoaWRlJywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICogU2hvdyBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnc2hvdycgYW5kICdmYWRlSW4nIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm1zIGEgZml4IG9uIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzXHJcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGVycm9yIHRoYXQgcHJldmVudHMgZnJvbSBydW5uaW5nXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdHMgb24gZWxlbWVudHMgdGhhdCBhcmUgYWxyZWFkeSB2aXNpYmxlLFxyXG4gICAgICAgICAgICAvLyB3aGF0IGxldHMgdGhlIHBvc3NpYmlsaXR5IG9mIGdldCBhIG1pZGRsZS1hbmltYXRlZFxyXG4gICAgICAgICAgICAvLyBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFdlIGp1c3QgY2hhbmdlIGRpc3BsYXk6bm9uZSwgZm9yY2luZyB0byAnaXMtdmlzaWJsZScgdG9cclxuICAgICAgICAgICAgLy8gYmUgZmFsc2UgYW5kIHRoZW4gcnVubmluZyB0aGUgZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBmbGlja2VyaW5nIGVmZmVjdCwgYmVjYXVzZSBqUXVlcnkganVzdCByZXNldHNcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBvbiBlZmZlY3Qgc3RhcnQuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuZmFkZUluKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ3Nob3cnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hzaG93JywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZW5lcmljIHV0aWxpdHkgZm9yIGhpZ2hseSBjb25maWd1cmFibGUgalF1ZXJ5LnRvZ2dsZSB3aXRoIHN1cHBvcnRcclxuICAgICAgICAgICAgdG8gc3BlY2lmeSB0aGUgdG9nZ2xlIHZhbHVlIGV4cGxpY2l0eSBmb3IgYW55IGtpbmQgb2YgZWZmZWN0OiBqdXN0IHBhc3MgdHJ1ZSBhcyBzZWNvbmQgcGFyYW1ldGVyICd0b2dnbGUnIHRvIHNob3dcclxuICAgICAgICAgICAgYW5kIGZhbHNlIHRvIGhpZGUuIFRvZ2dsZSBtdXN0IGJlIHN0cmljdGx5IGEgQm9vbGVhbiB2YWx1ZSB0byBhdm9pZCBhdXRvLWRldGVjdGlvbi5cclxuICAgICAgICAgICAgVG9nZ2xlIHBhcmFtZXRlciBjYW4gYmUgb21pdHRlZCB0byBhdXRvLWRldGVjdCBpdCwgYW5kIHNlY29uZCBwYXJhbWV0ZXIgY2FuIGJlIHRoZSBhbmltYXRpb24gb3B0aW9ucy5cclxuICAgICAgICAgICAgQWxsIHRoZSBvdGhlcnMgYmVoYXZlIGV4YWN0bHkgYXMgaGlkZUVsZW1lbnQgYW5kIHNob3dFbGVtZW50LlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUVsZW1lbnQoZWxlbWVudCwgdG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBub3QgYSBib29sZWFuXHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUgIT09IHRydWUgJiYgdG9nZ2xlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIGFuIG9iamVjdCwgdGhlbiBpcyB0aGUgb3B0aW9ucyBhcyBzZWNvbmQgcGFyYW1ldGVyXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRvZ2dsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRvZ2dsZTtcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tZGV0ZWN0IHRvZ2dsZSwgaXQgY2FuIHZhcnkgb24gYW55IGVsZW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGRldGVjdGlvbiBhbmQgYWN0aW9uIG11c3QgYmUgZG9uZSBwZXIgZWxlbWVudDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV1c2luZyBmdW5jdGlvbiwgd2l0aCBleHBsaWNpdCB0b2dnbGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICBMQy50b2dnbGVFbGVtZW50KHRoaXMsICQodGhpcykuaXMoJzp2aXNpYmxlJyksIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSlcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqIERvIGpRdWVyeSBpbnRlZ3JhdGlvbiBhcyB4dG9nZ2xlLCB4c2hvdywgeGhpZGVcclxuICAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gcGx1Z0luKGpRdWVyeSkge1xyXG4gICAgICAgICAgICAvKiogdG9nZ2xlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHh0b2dnbGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHRvZ2dsZSA9IGZ1bmN0aW9uIHh0b2dnbGUodG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsIHRvZ2dsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBzaG93RWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHNob3cgPSBmdW5jdGlvbiB4c2hvdyhvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIGhpZGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueGhpZGUgPSBmdW5jdGlvbiB4aGlkZShvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb3J0aW5nOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQ6IHRvZ2dsZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHNob3dFbGVtZW50OiBzaG93RWxlbWVudCxcclxuICAgICAgICAgICAgaGlkZUVsZW1lbnQ6IGhpZGVFbGVtZW50LFxyXG4gICAgICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9kdWxlXHJcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgeHRzaCk7XHJcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgICAgICB2YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB4dHNoKGpRdWVyeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIE5vcm1hbCBzY3JpcHQgbG9hZCwgaWYgalF1ZXJ5IGlzIGdsb2JhbCAoYXQgd2luZG93KSwgaXRzIGV4dGVuZGVkIGF1dG9tYXRpY2FsbHkgICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHh0c2god2luZG93LmpRdWVyeSkucGx1Z0luKHdpbmRvdy5qUXVlcnkpO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvKiBTb21lIHV0aWxpdGllcyBmb3IgdXNlIHdpdGggalF1ZXJ5IG9yIGl0cyBleHByZXNzaW9uc1xyXG4gICAgdGhhdCBhcmUgbm90IHBsdWdpbnMuXHJcbiovXHJcbmZ1bmN0aW9uIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbICM7JiwuKyp+XFwnOlwiIV4kW1xcXSgpPT58XFwvXSkvZywgJ1xcXFwkMScpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlOiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlXHJcbiAgICB9O1xyXG4iLCIvKiBBc3NldHMgbG9hZGVyIHdpdGggbG9hZGluZyBjb25maXJtYXRpb24gKG1haW5seSBmb3Igc2NyaXB0cylcclxuICAgIGJhc2VkIG9uIE1vZGVybml6ci95ZXBub3BlIGxvYWRlci5cclxuKi9cclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpO1xyXG5cclxuZXhwb3J0cy5sb2FkID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgc2NyaXB0czogW10sXHJcbiAgICAgICAgY29tcGxldGU6IG51bGwsXHJcbiAgICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IG51bGwsXHJcbiAgICAgICAgbG9hZERlbGF5OiAwLFxyXG4gICAgICAgIHRyaWFsc0ludGVydmFsOiA1MDBcclxuICAgIH0sIG9wdHMpO1xyXG4gICAgaWYgKCFvcHRzLnNjcmlwdHMubGVuZ3RoKSByZXR1cm47XHJcbiAgICBmdW5jdGlvbiBwZXJmb3JtQ29tcGxldGUoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAob3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbikgIT09ICdmdW5jdGlvbicgfHwgb3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbigpKVxyXG4gICAgICAgICAgICBvcHRzLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQocGVyZm9ybUNvbXBsZXRlLCBvcHRzLnRyaWFsc0ludGVydmFsKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS53YXJuKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdMQy5sb2FkLmNvbXBsZXRlVmVyaWZpY2F0aW9uIGZhaWxlZCBmb3IgJyArIG9wdHMuc2NyaXB0c1swXSArICcgcmV0cnlpbmcgaXQgaW4gJyArIG9wdHMudHJpYWxzSW50ZXJ2YWwgKyAnbXMnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKHtcclxuICAgICAgICAgICAgbG9hZDogb3B0cy5zY3JpcHRzLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogb3B0cy5jb21wbGV0ZSA/IHBlcmZvcm1Db21wbGV0ZSA6IG51bGxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChvcHRzLmxvYWREZWxheSlcclxuICAgICAgICBzZXRUaW1lb3V0KGxvYWQsIG9wdHMubG9hZERlbGF5KTtcclxuICAgIGVsc2VcclxuICAgICAgICBsb2FkKCk7XHJcbn07IiwiLyotLS0tLS0tLS0tLS1cclxuVXRpbGl0aWVzIHRvIG1hbmlwdWxhdGUgbnVtYmVycywgYWRkaXRpb25hbGx5XHJcbnRvIHRoZSBvbmVzIGF0IE1hdGhcclxuLS0tLS0tLS0tLS0tKi9cclxuXHJcbi8qKiBFbnVtZXJhdGlvbiB0byBiZSB1c2VzIGJ5IGZ1bmN0aW9ucyB0aGF0IGltcGxlbWVudHMgJ3JvdW5kaW5nJyBvcGVyYXRpb25zIG9uIGRpZmZlcmVudFxyXG5kYXRhIHR5cGVzLlxyXG5JdCBob2xkcyB0aGUgZGlmZmVyZW50IHdheXMgYSByb3VuZGluZyBvcGVyYXRpb24gY2FuIGJlIGFwcGx5LlxyXG4qKi9cclxudmFyIHJvdW5kaW5nVHlwZUVudW0gPSB7XHJcbiAgICBEb3duOiAtMSxcclxuICAgIE5lYXJlc3Q6IDAsXHJcbiAgICBVcDogMVxyXG59O1xyXG5cclxuZnVuY3Rpb24gcm91bmRUbyhudW1iZXIsIGRlY2ltYWxzLCByb3VuZGluZ1R5cGUpIHtcclxuICAgIC8vIGNhc2UgTmVhcmVzdCBpcyB0aGUgZGVmYXVsdDpcclxuICAgIHZhciBmID0gbmVhcmVzdFRvO1xyXG4gICAgc3dpdGNoIChyb3VuZGluZ1R5cGUpIHtcclxuICAgICAgICBjYXNlIHJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgZiA9IGZsb29yVG87XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2Ugcm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgZiA9IGNlaWxUbztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZihudW1iZXIsIGRlY2ltYWxzKTtcclxufVxyXG5cclxuLyoqIFJvdW5kIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdCBjYW4gc3Vic3RyYWN0IGludGVnZXIgZGVjaW1hbHMgYnkgcHJvdmlkaW5nIGEgbmVnYXRpdmVcclxubnVtYmVyIG9mIGRlY2ltYWxzLlxyXG4qKi9cclxuZnVuY3Rpb24gbmVhcmVzdFRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLyoqIFJvdW5kIFVwIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgdXAsXHJcbnRvIHRoZSBsb3dlciBpbnRlZ2VyIGdyZWF0ZXIgb3IgZXF1YWxzIHRvIHRoZSBudW1iZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjZWlsVG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBEb3duIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgZG93bixcclxudG8gdGhlIGJpZ2dlciBpbnRlZ2VyIGxvd2VyIG9yIGVxdWFscyB0byB0aGUgbnVtYmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gZmxvb3JUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICByb3VuZGluZ1R5cGVFbnVtOiByb3VuZGluZ1R5cGVFbnVtLFxyXG4gICAgICAgIHJvdW5kVG86IHJvdW5kVG8sXHJcbiAgICAgICAgbmVhcmVzdFRvOiBuZWFyZXN0VG8sXHJcbiAgICAgICAgY2VpbFRvOiBjZWlsVG8sXHJcbiAgICAgICAgZmxvb3JUbzogZmxvb3JUb1xyXG4gICAgfTsiLCJmdW5jdGlvbiBtb3ZlRm9jdXNUbyhlbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBtYXJnaW5Ub3A6IDMwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChlbCkub2Zmc2V0KCkudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3AgfSwgNTAwLCBudWxsKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vdmVGb2N1c1RvO1xyXG59IiwiLyogU29tZSB1dGlsaXRpZXMgdG8gZm9ybWF0IGFuZCBleHRyYWN0IG51bWJlcnMsIGZyb20gdGV4dCBvciBET00uXHJcbiAqL1xyXG52YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBpMThuID0gcmVxdWlyZSgnLi9pMThuJyksXHJcbiAgICBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBnZXRNb25leU51bWJlcih2LCBhbHQpIHtcclxuICAgIGFsdCA9IGFsdCB8fCAwO1xyXG4gICAgaWYgKHYgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgdiA9IHYudmFsKCkgfHwgdi50ZXh0KCk7XHJcbiAgICB2ID0gcGFyc2VGbG9hdCh2XHJcbiAgICAgICAgLnJlcGxhY2UoL1sk4oKsXS9nLCAnJylcclxuICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKExDLm51bWVyaWNNaWxlc1NlcGFyYXRvcltpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY3VsdHVyZV0sICdnJyksICcnKVxyXG4gICAgKTtcclxuICAgIHJldHVybiBpc05hTih2KSA/IGFsdCA6IHY7XHJcbn1cclxuZnVuY3Rpb24gbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSB7XHJcbiAgICB2YXIgY3VsdHVyZSA9IGkxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jdWx0dXJlO1xyXG4gICAgLy8gRmlyc3QsIHJvdW5kIHRvIDIgZGVjaW1hbHNcclxuICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgLy8gR2V0IHRoZSBkZWNpbWFsIHBhcnQgKHJlc3QpXHJcbiAgICB2YXIgcmVzdCA9IE1hdGgucm91bmQodiAqIDEwMCAlIDEwMCk7XHJcbiAgICByZXR1cm4gKCcnICtcclxuICAgIC8vIEludGVnZXIgcGFydCAobm8gZGVjaW1hbHMpXHJcbiAgICAgICAgTWF0aC5mbG9vcih2KSArXHJcbiAgICAvLyBEZWNpbWFsIHNlcGFyYXRvciBkZXBlbmRpbmcgb24gbG9jYWxlXHJcbiAgICAgICAgaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvcltjdWx0dXJlXSArXHJcbiAgICAvLyBEZWNpbWFscywgZXZlciB0d28gZGlnaXRzXHJcbiAgICAgICAgTWF0aC5mbG9vcihyZXN0IC8gMTApICsgcmVzdCAlIDEwXHJcbiAgICApO1xyXG59XHJcbmZ1bmN0aW9uIG51bWJlclRvTW9uZXlTdHJpbmcodikge1xyXG4gICAgdmFyIGNvdW50cnkgPSBpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY291bnRyeTtcclxuICAgIC8vIFR3byBkaWdpdHMgaW4gZGVjaW1hbHMgZm9yIHJvdW5kZWQgdmFsdWUgd2l0aCBtb25leSBzeW1ib2wgYXMgZm9yXHJcbiAgICAvLyBjdXJyZW50IGxvY2FsZVxyXG4gICAgcmV0dXJuIChpMThuLm1vbmV5U3ltYm9sUHJlZml4W2NvdW50cnldICsgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSArIGkxOG4ubW9uZXlTeW1ib2xTdWZpeFtjb3VudHJ5XSk7XHJcbn1cclxuZnVuY3Rpb24gc2V0TW9uZXlOdW1iZXIodiwgZWwpIHtcclxuICAgIC8vIEdldCB2YWx1ZSBpbiBtb25leSBmb3JtYXQ6XHJcbiAgICB2ID0gbnVtYmVyVG9Nb25leVN0cmluZyh2KTtcclxuICAgIC8vIFNldHRpbmcgdmFsdWU6XHJcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgaWYgKGVsLmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICAgZWwudmFsKHYpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZWwudGV4dCh2KTtcclxuICAgIHJldHVybiB2O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBnZXRNb25leU51bWJlcjogZ2V0TW9uZXlOdW1iZXIsXHJcbiAgICAgICAgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZzogbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyxcclxuICAgICAgICBudW1iZXJUb01vbmV5U3RyaW5nOiBudW1iZXJUb01vbmV5U3RyaW5nLFxyXG4gICAgICAgIHNldE1vbmV5TnVtYmVyOiBzZXRNb25leU51bWJlclxyXG4gICAgfTsiLCIvKipcclxuKiBQbGFjZWhvbGRlciBwb2x5ZmlsbC5cclxuKiBBZGRzIGEgbmV3IGpRdWVyeSBwbGFjZUhvbGRlciBtZXRob2QgdG8gc2V0dXAgb3IgcmVhcHBseSBwbGFjZUhvbGRlclxyXG4qIG9uIGVsZW1lbnRzIChyZWNvbW1lbnRlZCB0byBiZSBhcHBseSBvbmx5IHRvIHNlbGVjdG9yICdbcGxhY2Vob2xkZXJdJyk7XHJcbiogdGhhdHMgbWV0aG9kIGlzIGZha2Ugb24gYnJvd3NlcnMgdGhhdCBoYXMgbmF0aXZlIHN1cHBvcnQgZm9yIHBsYWNlaG9sZGVyXHJcbioqL1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0UGxhY2VIb2xkZXJzKCkge1xyXG4gICAgaWYgKE1vZGVybml6ci5pbnB1dC5wbGFjZWhvbGRlcilcclxuICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkgeyB9O1xyXG4gICAgZWxzZVxyXG4gICAgICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvUGxhY2Vob2xkZXIoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdwbGFjZWhvbGRlci1zdXBwb3J0ZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0Lm9uKCdmb2N1c2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkdC5vbignZm9jdXNvdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQuZGF0YSgncGxhY2Vob2xkZXItc3VwcG9ydGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChkb1BsYWNlaG9sZGVyKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgJCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkoKTtcclxufTsiLCIvKiBQb3B1cCBmdW5jdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqXHJcbiogUG9wdXAgcmVsYXRlZCBcclxuKiBmdW5jdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gcG9wdXBTaXplKHNpemUpIHtcclxuICAgIHZhciBzID0gKHNpemUgPT0gJ2xhcmdlJyA/IDAuOCA6IChzaXplID09ICdtZWRpdW0nID8gMC41IDogKHNpemUgPT0gJ3NtYWxsJyA/IDAuMiA6IHNpemUgfHwgMC41KSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB3aWR0aDogTWF0aC5yb3VuZCgkKHdpbmRvdykud2lkdGgoKSAqIHMpLFxyXG4gICAgICAgIGhlaWdodDogTWF0aC5yb3VuZCgkKHdpbmRvdykuaGVpZ2h0KCkgKiBzKSxcclxuICAgICAgICBzaXplRmFjdG9yOiBzXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwU3R5bGUoc2l6ZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdXJzb3I6ICdkZWZhdWx0JyxcclxuICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCArICdweCcsXHJcbiAgICAgICAgbGVmdDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLndpZHRoKCkgLSBzaXplLndpZHRoKSAvIDIpIC0gMjUgKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHQgKyAncHgnLFxyXG4gICAgICAgIHRvcDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLmhlaWdodCgpIC0gc2l6ZS5oZWlnaHQpIC8gMikgLSAzMiArICdweCcsXHJcbiAgICAgICAgcGFkZGluZzogJzM0cHggMjVweCAzMHB4JyxcclxuICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICctbW96LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nJyxcclxuICAgICAgICAnLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnLFxyXG4gICAgICAgICdiYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwKHVybCwgc2l6ZSwgY29tcGxldGUsIGxvYWRpbmdUZXh0LCBvcHRpb25zKSB7XHJcbiAgICBpZiAodHlwZW9mICh1cmwpID09PSAnb2JqZWN0JylcclxuICAgICAgICBvcHRpb25zID0gdXJsO1xyXG5cclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICB1cmw6IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAnJyxcclxuICAgICAgICBzaXplOiBzaXplIHx8IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9LFxyXG4gICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcclxuICAgICAgICBsb2FkaW5nVGV4dDogbG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2xvc2FibGU6IHtcclxuICAgICAgICAgICAgb25Mb2FkOiBmYWxzZSxcclxuICAgICAgICAgICAgYWZ0ZXJMb2FkOiB0cnVlLFxyXG4gICAgICAgICAgICBvbkVycm9yOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvU2l6ZTogZmFsc2UsXHJcbiAgICAgICAgY29udGFpbmVyQ2xhc3M6ICcnLFxyXG4gICAgICAgIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLy8gUHJlcGFyZSBzaXplIGFuZCBsb2FkaW5nXHJcbiAgICBvcHRpb25zLmxvYWRpbmdUZXh0ID0gb3B0aW9ucy5sb2FkaW5nVGV4dCB8fCAnJztcclxuICAgIGlmICh0eXBlb2YgKG9wdGlvbnMuc2l6ZS53aWR0aCkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHBvcHVwU2l6ZShvcHRpb25zLnNpemUpO1xyXG5cclxuICAgICQuYmxvY2tVSSh7XHJcbiAgICAgICAgbWVzc2FnZTogKG9wdGlvbnMuY2xvc2FibGUub25Mb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICtcclxuICAgICAgICc8aW1nIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nICsgb3B0aW9ucy5sb2FkaW5nVGV4dCxcclxuICAgICAgICBjZW50ZXJZOiBmYWxzZSxcclxuICAgICAgICBjc3M6IHBvcHVwU3R5bGUob3B0aW9ucy5zaXplKSxcclxuICAgICAgICBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0sXHJcbiAgICAgICAgZm9jdXNJbnB1dDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTG9hZGluZyBVcmwgd2l0aCBBamF4IGFuZCBwbGFjZSBjb250ZW50IGluc2lkZSB0aGUgYmxvY2tlZC1ib3hcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcclxuICAgICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJCgnLmJsb2NrTXNnJylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhvcHRpb25zLmNvbnRhaW5lckNsYXNzKTtcclxuICAgICAgICAgICAgLy8gQWRkIGNsb3NlIGJ1dHRvbiBpZiByZXF1aXJlcyBpdCBvciBlbXB0eSBtZXNzYWdlIGNvbnRlbnQgdG8gYXBwZW5kIHRoZW4gbW9yZVxyXG4gICAgICAgICAgICBjb250YWluZXIuaHRtbChvcHRpb25zLmNsb3NhYmxlLmFmdGVyTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRIb2xkZXIgPSBjb250YWluZXIuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29udGVudFwiLz4nKS5jaGlsZHJlbignLmNvbnRlbnQnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuQ29kZSAmJiBkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgY29kZSwgc2hvdyByZXN1bHRcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQYWdlIGNvbnRlbnQgZ290LCBwYXN0ZSBpbnRvIHRoZSBwb3B1cCBpZiBpcyBwYXJ0aWFsIGh0bWwgKHVybCBzdGFydHMgd2l0aCAkKVxyXG4gICAgICAgICAgICAgICAgaWYgKC8oKF5cXCQpfChcXC9cXCQpKS8udGVzdChvcHRpb25zLnVybCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRIb2xkZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9TaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2b2lkIG1pc2NhbGN1bGF0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldldpZHRoID0gY29udGVudEhvbGRlclswXS5zdHlsZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRXaWR0aCA9IGNvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udEhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhV2lkdGggPSBjb250YWluZXIub3V0ZXJXaWR0aCh0cnVlKSAtIGNvbnRXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSGVpZ2h0ID0gY29udGFpbmVyLm91dGVySGVpZ2h0KHRydWUpIC0gY29udEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkgLSBleHRyYVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gZXh0cmFIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBhbmQgYXBwbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogYWN0dWFsV2lkdGggPiBtYXhXaWR0aCA/IG1heFdpZHRoIDogYWN0dWFsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGFjdHVhbEhlaWdodCA+IG1heEhlaWdodCA/IG1heEhlaWdodCA6IGFjdHVhbEhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuYW5pbWF0ZShzaXplLCAzMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBtaXNjYWxjdWxhdGlvbnMgY29ycmVjdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgcHJldldpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsIHByZXZIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRWxzZSwgaWYgdXJsIGlzIGEgZnVsbCBodG1sIHBhZ2UgKG5vcm1hbCBwYWdlKSwgcHV0IGNvbnRlbnQgaW50byBhbiBpZnJhbWVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGRhdGEsIHRoaXMub3B0aW9ucy5zaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2tpbmcgZWxlbWVudCBjb250ZW50ICh0aGUgbG9hZGluZykgd2l0aCB0aGUgaWZyYW1lOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZXJyb3I6IGZ1bmN0aW9uIChqLCB0LCBleCkge1xyXG4gICAgICAgICAgICAkKCdkaXYuYmxvY2tNc2cnKS5odG1sKChvcHRpb25zLmNsb3NhYmxlLm9uRXJyb3IgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgKyAnPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5QYWdlIG5vdCBmb3VuZDwvZGl2PicpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmluZm8pIGNvbnNvbGUuaW5mbyhcIlBvcHVwLWFqYXggZXJyb3I6IFwiICsgZXgpO1xyXG4gICAgICAgIH0sIGNvbXBsZXRlOiBvcHRpb25zLmNvbXBsZXRlXHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmV0dXJuZWRCbG9jayA9ICQoJy5ibG9ja1VJJyk7XHJcblxyXG4gICAgcmV0dXJuZWRCbG9jay5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICByZXR1cm5lZEJsb2NrLnRyaWdnZXIoJ3BvcHVwLWNsb3NlZCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuZWRCbG9jay5jbG9zZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiByZXR1cm5lZEJsb2NrO1xyXG59XHJcblxyXG4vKiBTb21lIHBvcHVwIHV0aWxpdGl0ZXMvc2hvcnRoYW5kcyAqL1xyXG5mdW5jdGlvbiBtZXNzYWdlUG9wdXAobWVzc2FnZSwgY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCAnYm9keScpO1xyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2Lz4nKS50ZXh0KG1lc3NhZ2UpO1xyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjb250YWluZXIsICdtZXNzYWdlLXBvcHVwIGZ1bGwtYmxvY2snLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbm5lY3RQb3B1cEFjdGlvbihhcHBseVRvU2VsZWN0b3IpIHtcclxuICAgIGFwcGx5VG9TZWxlY3RvciA9IGFwcGx5VG9TZWxlY3RvciB8fCAnLnBvcHVwLWFjdGlvbic7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBhcHBseVRvU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQoJCh0aGlzKS5hdHRyKCdocmVmJykpLmNsb25lKCk7XHJcbiAgICAgICAgaWYgKGMubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgZG9jdW1lbnQsIG51bGwsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy8gVGhlIHBvcHVwIGZ1bmN0aW9uIGNvbnRhaW5zIGFsbCB0aGUgb3RoZXJzIGFzIG1ldGhvZHNcclxucG9wdXAuc2l6ZSA9IHBvcHVwU2l6ZTtcclxucG9wdXAuc3R5bGUgPSBwb3B1cFN0eWxlO1xyXG5wb3B1cC5jb25uZWN0QWN0aW9uID0gY29ubmVjdFBvcHVwQWN0aW9uO1xyXG5wb3B1cC5tZXNzYWdlID0gbWVzc2FnZVBvcHVwO1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcG9wdXA7IiwiLyoqKiogUG9zdGFsIENvZGU6IG9uIGZseSwgc2VydmVyLXNpZGUgdmFsaWRhdGlvbiAqKioqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIGJhc2VVcmw6ICcvJyxcclxuICAgICAgICBzZWxlY3RvcjogJ1tkYXRhLXZhbC1wb3N0YWxjb2RlXScsXHJcbiAgICAgICAgdXJsOiAnSlNPTi9WYWxpZGF0ZVBvc3RhbENvZGUvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIG9wdGlvbnMuc2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGNvbnRhaW5zIGEgdmFsdWUgKHRoaXMgbm90IHZhbGlkYXRlIGlmIGlzIHJlcXVpcmVkKSBhbmQgXHJcbiAgICAgICAgLy8gaGFzIHRoZSBlcnJvciBkZXNjcmlwdGl2ZSBtZXNzYWdlLCB2YWxpZGF0ZSB0aHJvdWdoIGFqYXhcclxuICAgICAgICB2YXIgcGMgPSAkdC52YWwoKTtcclxuICAgICAgICB2YXIgbXNnID0gJHQuZGF0YSgndmFsLXBvc3RhbGNvZGUnKTtcclxuICAgICAgICBpZiAocGMgJiYgbXNnKSB7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMuYmFzZVVybCArIG9wdGlvbnMudXJsLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogeyBQb3N0YWxDb2RlOiBwYyB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ0pTT04nLFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLlJlc3VsdC5Jc1ZhbGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmFkZENsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoJycpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhbiBzdW1tYXJ5IGVycm9yc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgnPiB1bCA+IGxpJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLnRleHQoKSA9PSBtc2cpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKS5yZW1vdmVDbGFzcygndmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnNpYmxpbmdzKCcuZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxzcGFuIGZvcj1cIicgKyAkdC5hdHRyKCduYW1lJykgKyAnXCIgZ2VuZXJhdGVkPVwidHJ1ZVwiPicgKyBtc2cgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHN1bW1hcnkgZXJyb3IgKGlmIHRoZXJlIGlzIG5vdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2hpbGRyZW4oJ3VsJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8bGk+JyArIG1zZyArICc8L2xpPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKiBBcHBseSBldmVyIGEgcmVkaXJlY3QgdG8gdGhlIGdpdmVuIFVSTCwgaWYgdGhpcyBpcyBhbiBpbnRlcm5hbCBVUkwgb3Igc2FtZVxyXG5wYWdlLCBpdCBmb3JjZXMgYSBwYWdlIHJlbG9hZCBmb3IgdGhlIGdpdmVuIFVSTC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlZGlyZWN0VG8odXJsKSB7XHJcbiAgICAvLyBCbG9jayB0byBhdm9pZCBtb3JlIHVzZXIgaW50ZXJhY3Rpb25zOlxyXG4gICAgJC5ibG9ja1VJKHsgbWVzc2FnZTogJycgfSk7IC8vbG9hZGluZ0Jsb2NrKTtcclxuICAgIC8vIENoZWNraW5nIGlmIGlzIGJlaW5nIHJlZGlyZWN0aW5nIG9yIG5vdFxyXG4gICAgdmFyIHJlZGlyZWN0ZWQgPSBmYWxzZTtcclxuICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gY2hlY2tSZWRpcmVjdCgpIHtcclxuICAgICAgICByZWRpcmVjdGVkID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgLy8gTmF2aWdhdGUgdG8gbmV3IGxvY2F0aW9uOlxyXG4gICAgd2luZG93LmxvY2F0aW9uID0gdXJsO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gSWYgcGFnZSBub3QgY2hhbmdlZCAoc2FtZSB1cmwgb3IgaW50ZXJuYWwgbGluayksIHBhZ2UgY29udGludWUgZXhlY3V0aW5nIHRoZW4gcmVmcmVzaDpcclxuICAgICAgICBpZiAoIXJlZGlyZWN0ZWQpXHJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0sIDUwKTtcclxufTtcclxuIiwiLyoqIFNhbml0aXplIHRoZSB3aGl0ZXNwYWNlcyBpbiBhIHRleHQgYnk6XHJcbi0gcmVwbGFjaW5nIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVyZXMgKGFueSBudW1iZXIgb2YgcmVwZXRpdGlvbiBcclxuYW5kIGFueSBraW5kIG9mIHdoaXRlIGNoYXJhY3RlcikgYnkgYSBub3JtYWwgd2hpdGUtc3BhY2VcclxuLSByZXBsYWNlIGVuY29kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlLXNwYWNlc1xyXG4tIGV2ZXIgcmV0dXJuIGEgc3RyaW5nLCBlbXB0eSB3aGVuIG51bGxcclxuKiovXHJcbmZ1bmN0aW9uIHNhbml0aXplV2hpdGVzcGFjZXModGV4dCkge1xyXG4gICAgLy8gRXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4gICAgdGV4dCA9ICh0ZXh0IHx8ICcnKVxyXG4gICAgLy8gUmVwbGFjZSBhbnkga2luZCBvZiBjb250aWd1b3VzIHdoaXRlc3BhY2VzIGNoYXJhY3RlcnMgYnkgYSBzaW5nbGUgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbiAgICAvLyAodGhhdHMgaW5jbHVkZSByZXBsYWNlIGVuY29uZGVkIG5vbi1icmVha2luZy1zcGFjZXMsXHJcbiAgICAvLyBhbmQgZHVwbGljYXRlZC1yZXBlYXRlZCBhcHBlYXJhbmNlcylcclxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJyk7XHJcbiAgICAvLyBSZW1vdmUgc3RhcnRpbmcgYW5kIGVuZGluZyB3aGl0ZXNwYWNlc1xyXG4gICAgcmV0dXJuICQudHJpbSh0ZXh0KTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gc2FuaXRpemVXaGl0ZXNwYWNlczsiLCIvKiogQ3VzdG9tIExvY29ub21pY3MgJ2xpa2UgYmxvY2tVSScgcG9wdXBzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlLFxyXG4gICAgYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi9hdXRvRm9jdXMnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG5cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2soY29udGVudEJveCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHtcclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBjbG9zYWJsZTogZmFsc2UsXHJcbiAgICAgICAgY2VudGVyOiBmYWxzZSxcclxuICAgICAgICAvKiBhcyBhIHZhbGlkIG9wdGlvbnMgcGFyYW1ldGVyIGZvciBMQy5oaWRlRWxlbWVudCBmdW5jdGlvbiAqL1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogNjAwLFxyXG4gICAgICAgICAgICBlZmZlY3Q6ICdmYWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgIGF1dG9mb2N1c09wdGlvbnM6IHsgbWFyZ2luVG9wOiA2MCB9LFxyXG4gICAgICAgIHdpZHRoOiAnYXV0bydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnRlbnRCb3ggPSAkKGNvbnRlbnRCb3gpO1xyXG4gICAgdmFyIGZ1bGwgPSBmYWxzZTtcclxuICAgIGlmIChibG9ja2VkID09IGRvY3VtZW50IHx8IGJsb2NrZWQgPT0gd2luZG93KSB7XHJcbiAgICAgICAgYmxvY2tlZCA9ICQoJ2JvZHknKTtcclxuICAgICAgICBmdWxsID0gdHJ1ZTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGJsb2NrZWQgPSAkKGJsb2NrZWQpO1xyXG5cclxuICAgIHZhciBib3hJbnNpZGVCbG9ja2VkID0gIWJsb2NrZWQuaXMoJ2JvZHksdHIsdGhlYWQsdGJvZHksdGZvb3QsdGFibGUsdWwsb2wsZGwnKTtcclxuXHJcbiAgICAvLyBHZXR0aW5nIGJveCBlbGVtZW50IGlmIGV4aXN0cyBhbmQgcmVmZXJlbmNpbmdcclxuICAgIHZhciBiSUQgPSBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnKTtcclxuICAgIGlmICghYklEKVxyXG4gICAgICAgIGJJRCA9IChjb250ZW50Qm94LmF0dHIoJ2lkJykgfHwgJycpICsgKGJsb2NrZWQuYXR0cignaWQnKSB8fCAnJykgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIGlmIChiSUQgPT0gJy1zbW9vdGhCb3hCbG9jaycpIHtcclxuICAgICAgICBiSUQgPSAnaWQtJyArIGd1aWRHZW5lcmF0b3IoKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgfVxyXG4gICAgYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJywgYklEKTtcclxuICAgIHZhciBib3ggPSAkKCcjJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoYklEKSk7XHJcbiAgICAvLyBIaWRpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94LnhoaWRlKG9wdGlvbnMuY2xvc2VPcHRpb25zKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICAgIGJveGNcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIG51bGwsIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycpKTsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgICAgIC5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJywgdHJ1ZSk7XHJcbiAgICBib3hjLmFwcGVuZChjb250ZW50Qm94KTtcclxuICAgIGJveGMud2lkdGgob3B0aW9ucy53aWR0aCk7XHJcbiAgICBib3guY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgaWYgKGJveEluc2lkZUJsb2NrZWQpIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBpbnNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudDpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgYmxvY2tlZC5jc3MoJ3otaW5kZXgnKSArIDEwKTtcclxuICAgICAgICBpZiAoIWJsb2NrZWQuY3NzKCdwb3NpdGlvbicpIHx8IGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpID09ICdzdGF0aWMnKVxyXG4gICAgICAgICAgICBibG9ja2VkLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJveGMuY3NzKCd0b3AnLCBjdCAtIGJveGMub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyKTtcclxuICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07IiwiLyoqXHJcbioqIE1vZHVsZTo6IHRvb2x0aXBzXHJcbioqIENyZWF0ZXMgc21hcnQgdG9vbHRpcHMgd2l0aCBwb3NzaWJpbGl0aWVzIGZvciBvbiBob3ZlciBhbmQgb24gY2xpY2ssXHJcbioqIGFkZGl0aW9uYWwgZGVzY3JpcHRpb24gb3IgZXh0ZXJuYWwgdG9vbHRpcCBjb250ZW50LlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNhbml0aXplV2hpdGVzcGFjZXMgPSByZXF1aXJlKCcuL3Nhbml0aXplV2hpdGVzcGFjZXMnKTtcclxucmVxdWlyZSgnLi9qcXVlcnkub3V0ZXJIdG1sJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5LmlzQ2hpbGRPZicpO1xyXG5cclxuLy8gTWFpbiBpbnRlcm5hbCBwcm9wZXJ0aWVzXHJcbnZhciBwb3NvZmZzZXQgPSB7IHg6IDE2LCB5OiA4IH07XHJcbnZhciBzZWxlY3RvciA9ICdbdGl0bGVdW2RhdGEtZGVzY3JpcHRpb25dLCBbdGl0bGVdLmhhcy10b29sdGlwLCBbdGl0bGVdLnNlY3VyZS1kYXRhLCBbZGF0YS10b29sdGlwLXVybF0sIFt0aXRsZV0uaGFzLXBvcHVwLXRvb2x0aXAnO1xyXG5cclxuLyoqIFBvc2l0aW9uYXRlIHRoZSB0b29sdGlwIGRlcGVuZGluZyBvbiB0aGVcclxuZXZlbnQgb3IgdGhlIHRhcmdldCBlbGVtZW50IHBvc2l0aW9uIGFuZCBhbiBvZmZzZXRcclxuKiovXHJcbmZ1bmN0aW9uIHBvcyh0LCBlLCBsKSB7XHJcbiAgICB2YXIgeCwgeTtcclxuICAgIGlmIChlLnBhZ2VYICYmIGUucGFnZVkpIHtcclxuICAgICAgICB4ID0gZS5wYWdlWDtcclxuICAgICAgICB5ID0gZS5wYWdlWTtcclxuICAgIH0gZWxzZSBpZiAoZS50YXJnZXQpIHtcclxuICAgICAgICB2YXIgJGV0ID0gJChlLnRhcmdldCk7XHJcbiAgICAgICAgeCA9ICRldC5vdXRlcldpZHRoKCkgKyAkZXQub2Zmc2V0KCkubGVmdDtcclxuICAgICAgICB5ID0gJGV0Lm91dGVySGVpZ2h0KCkgKyAkZXQub2Zmc2V0KCkudG9wO1xyXG4gICAgfVxyXG4gICAgdC5jc3MoJ2xlZnQnLCB4ICsgcG9zb2Zmc2V0LngpO1xyXG4gICAgdC5jc3MoJ3RvcCcsIHkgKyBwb3NvZmZzZXQueSk7XHJcbiAgICAvLyBBZGp1c3Qgd2lkdGggdG8gdmlzaWJsZSB2aWV3cG9ydFxyXG4gICAgdmFyIHRkaWYgPSB0Lm91dGVyV2lkdGgoKSAtIHQud2lkdGgoKTtcclxuICAgIHQuY3NzKCdtYXgtd2lkdGgnLCAkKHdpbmRvdykud2lkdGgoKSAtIHggLSBwb3NvZmZzZXQueCAtIHRkaWYpO1xyXG4gICAgLy90LmhlaWdodCgkKGRvY3VtZW50KS5oZWlnaHQoKSAtIHkgLSBwb3NvZmZzZXQueSk7XHJcbn1cclxuLyoqIEdldCBvciBjcmVhdGUsIGFuZCByZXR1cm5zLCB0aGUgdG9vbHRpcCBjb250ZW50IGZvciB0aGUgZWxlbWVudFxyXG4qKi9cclxuZnVuY3Rpb24gY29uKGwpIHtcclxuICAgIGlmIChsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgYyA9IGwuZGF0YSgndG9vbHRpcC1jb250ZW50JyksXHJcbiAgICAgICAgcGVyc2lzdGVudCA9IGwuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJyk7XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICB2YXIgaCA9IHNhbml0aXplV2hpdGVzcGFjZXMobC5hdHRyKCd0aXRsZScpKTtcclxuICAgICAgICB2YXIgZCA9IHNhbml0aXplV2hpdGVzcGFjZXMobC5kYXRhKCdkZXNjcmlwdGlvbicpKTtcclxuICAgICAgICBpZiAoZClcclxuICAgICAgICAgICAgYyA9ICc8aDQ+JyArIGggKyAnPC9oND48cD4nICsgZCArICc8L3A+JztcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGMgPSBoO1xyXG4gICAgICAgIC8vIEFwcGVuZCBkYXRhLXRvb2x0aXAtdXJsIGNvbnRlbnQgaWYgZXhpc3RzXHJcbiAgICAgICAgdmFyIHVybGNvbnRlbnQgPSAkKGwuZGF0YSgndG9vbHRpcC11cmwnKSk7XHJcbiAgICAgICAgYyA9IChjIHx8ICcnKSArIHVybGNvbnRlbnQub3V0ZXJIdG1sKCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIG9yaWdpbmFsLCBpcyBubyBtb3JlIG5lZWQgYW5kIGF2b2lkIGlkLWNvbmZsaWN0c1xyXG4gICAgICAgIHVybGNvbnRlbnQucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gU2F2ZSB0b29sdGlwIGNvbnRlbnRcclxuICAgICAgICBsLmRhdGEoJ3Rvb2x0aXAtY29udGVudCcsIGMpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBicm93c2VyIHRvb2x0aXAgKGJvdGggd2hlbiB3ZSBhcmUgdXNpbmcgb3VyIG93biB0b29sdGlwIGFuZCB3aGVuIG5vIHRvb2x0aXBcclxuICAgICAgICAvLyBpcyBuZWVkKVxyXG4gICAgICAgIGwuYXR0cigndGl0bGUnLCAnJyk7XHJcbiAgICB9XHJcbiAgICAvLyBSZW1vdmUgdG9vbHRpcCBjb250ZW50IChidXQgcHJlc2VydmUgaXRzIGNhY2hlIGluIHRoZSBlbGVtZW50IGRhdGEpXHJcbiAgICAvLyBpZiBpcyB0aGUgc2FtZSB0ZXh0IGFzIHRoZSBlbGVtZW50IGNvbnRlbnQgYW5kIHRoZSBlbGVtZW50IGNvbnRlbnRcclxuICAgIC8vIGlzIGZ1bGx5IHZpc2libGUuIFRoYXRzLCBmb3IgY2FzZXMgd2l0aCBkaWZmZXJlbnQgY29udGVudCwgd2lsbCBiZSBzaG93ZWQsXHJcbiAgICAvLyBhbmQgZm9yIGNhc2VzIHdpdGggc2FtZSBjb250ZW50IGJ1dCBpcyBub3QgdmlzaWJsZSBiZWNhdXNlIHRoZSBlbGVtZW50XHJcbiAgICAvLyBvciBjb250YWluZXIgd2lkdGgsIHRoZW4gd2lsbCBiZSBzaG93ZWQuXHJcbiAgICAvLyBFeGNlcHQgaWYgaXMgcGVyc2lzdGVudFxyXG4gICAgaWYgKHBlcnNpc3RlbnQgIT09IHRydWUgJiZcclxuICAgICAgICBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwudGV4dCgpKSA9PSBjICYmXHJcbiAgICAgICAgbC5vdXRlcldpZHRoKCkgPj0gbFswXS5zY3JvbGxXaWR0aCkge1xyXG4gICAgICAgIGMgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm90IGNvbnRlbnQ6XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICAvLyBVcGRhdGUgdGFyZ2V0IHJlbW92aW5nIHRoZSBjbGFzcyB0byBhdm9pZCBjc3MgbWFya2luZyB0b29sdGlwIHdoZW4gdGhlcmUgaXMgbm90XHJcbiAgICAgICAgbC5yZW1vdmVDbGFzcygnaGFzLXRvb2x0aXAnKS5yZW1vdmVDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIH1cclxuICAgIC8vIFJldHVybiB0aGUgY29udGVudCBhcyBzdHJpbmc6XHJcbiAgICByZXR1cm4gYztcclxufVxyXG4vKiogR2V0IG9yIGNyZWF0ZXMgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBmb3IgYSB0b29sdGlwIG9mIHRoZSBnaXZlbiB0eXBlXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRUb29sdGlwKHR5cGUpIHtcclxuICAgIHR5cGUgPSB0eXBlIHx8ICd0b29sdGlwJztcclxuICAgIHZhciBpZCA9ICdzaW5nbGV0b24tJyArIHR5cGU7XHJcbiAgICB2YXIgdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgIGlmICghdCkge1xyXG4gICAgICAgIHQgPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIiBjbGFzcz1cInRvb2x0aXBcIj48L2Rpdj4nKTtcclxuICAgICAgICB0LmF0dHIoJ2lkJywgaWQpO1xyXG4gICAgICAgIHQuaGlkZSgpO1xyXG4gICAgICAgICQoJ2JvZHknKS5hcHBlbmQodCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJCh0KTtcclxufVxyXG4vKiogU2hvdyB0aGUgdG9vbHRpcCBvbiBhbiBldmVudCB0cmlnZ2VyZWQgYnkgdGhlIGVsZW1lbnQgY29udGFpbmluZ1xyXG5pbmZvcm1hdGlvbiBmb3IgYSB0b29sdGlwXHJcbioqL1xyXG5mdW5jdGlvbiBzaG93VG9vbHRpcChlKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGlzUG9wdXAgPSAkdC5oYXNDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIC8vIEdldCBvciBjcmVhdGUgdG9vbHRpcCBsYXllclxyXG4gICAgdmFyIHQgPSBnZXRUb29sdGlwKGlzUG9wdXAgPyAncG9wdXAtdG9vbHRpcCcgOiAndG9vbHRpcCcpO1xyXG4gICAgLy8gSWYgdGhpcyBpcyBub3QgcG9wdXAgYW5kIHRoZSBldmVudCBpcyBjbGljaywgZGlzY2FyZCB3aXRob3V0IGNhbmNlbCBldmVudFxyXG4gICAgaWYgKCFpc1BvcHVwICYmIGUudHlwZSA9PSAnY2xpY2snKVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIC8vIENyZWF0ZSBjb250ZW50OiBpZiB0aGVyZSBpcyBjb250ZW50LCBjb250aW51ZVxyXG4gICAgdmFyIGNvbnRlbnQgPSBjb24oJHQpO1xyXG4gICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAvLyBJZiBpcyBhIGhhcy1wb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBkb24ndCBzaG93XHJcbiAgICAgICAgaWYgKGlzUG9wdXAgJiYgZS50eXBlICE9ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vIFRoZSB0b29sdGlwIHNldHVwIG11c3QgYmUgcXVldWVkIHRvIGF2b2lkIGNvbnRlbnQgdG8gYmUgc2hvd2VkIGFuZCBwbGFjZWRcclxuICAgICAgICAvLyB3aGVuIHN0aWxsIGhpZGRlbiB0aGUgcHJldmlvdXNcclxuICAgICAgICB0LnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gU2V0IHRvb2x0aXAgY29udGVudFxyXG4gICAgICAgICAgICB0Lmh0bWwoY29udGVudCk7XHJcbiAgICAgICAgICAgIC8vIEZvciBwb3B1cHMsIHNldHVwIGNsYXNzIGFuZCBjbG9zZSBidXR0b25cclxuICAgICAgICAgICAgaWYgKGlzUG9wdXApIHtcclxuICAgICAgICAgICAgICAgIHQuYWRkQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKTtcclxuICAgICAgICAgICAgICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxhIGhyZWY9XCIjY2xvc2UtcG9wdXBcIiBjbGFzcz1cImNsb3NlLWFjdGlvblwiPlg8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0LmFwcGVuZChjbG9zZUJ1dHRvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gUG9zaXRpb25hdGVcclxuICAgICAgICAgICAgcG9zKHQsIGUsICR0KTtcclxuICAgICAgICAgICAgdC5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgIC8vIFNob3cgKGFuaW1hdGlvbnMgYXJlIHN0b3BwZWQgb25seSBvbiBoaWRlIHRvIGF2b2lkIGNvbmZsaWN0cylcclxuICAgICAgICAgICAgdC5mYWRlSW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdG9wIGJ1YmJsaW5nIGFuZCBkZWZhdWx0XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEhpZGUgYWxsIG9wZW5lZCB0b29sdGlwcywgZm9yIGFueSB0eXBlLlxyXG5JdCBoYXMgc29tZSBzcGVjaWFsIGNvbnNpZGVyYXRpb25zIGZvciBwb3B1cC10b29sdGlwcyBkZXBlbmRpbmdcclxub24gdGhlIGV2ZW50IGJlaW5nIHRyaWdnZXJlZC5cclxuKiovXHJcbmZ1bmN0aW9uIGhpZGVUb29sdGlwKGUpIHtcclxuICAgICQoJy50b29sdGlwOnZpc2libGUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBvciB0aGUgaW52ZXJzZSxcclxuICAgICAgICAvLyB0aGlzIGlzIG5vdCBhIHBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgYSBjbGljaywgZG8gbm90aGluZ1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlICE9ICdjbGljaycgfHxcclxuICAgICAgICAgICAgIXQuaGFzQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKSAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIFN0b3AgYW5pbWF0aW9ucyBhbmQgaGlkZVxyXG4gICAgICAgIHQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEluaXRpYWxpemUgdG9vbHRpcHNcclxuKiovXHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyB0byBzaG93L2hpZGUgdG9vbHRpcHNcclxuICAgICQoJ2JvZHknKS5vbignbW91c2Vtb3ZlIGZvY3VzaW4nLCBzZWxlY3Rvciwgc2hvd1Rvb2x0aXApXHJcbiAgICAub24oJ21vdXNlbGVhdmUgZm9jdXNvdXQnLCBzZWxlY3RvciwgaGlkZVRvb2x0aXApXHJcbiAgICAvLyBMaXN0ZW4gZXZlbnQgZm9yIGNsaWNrYWJsZSBwb3B1cC10b29sdGlwc1xyXG4gICAgLm9uKCdjbGljaycsICdbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJywgc2hvd1Rvb2x0aXApXHJcbiAgICAvLyBBbGxvd2luZyBidXR0b25zIGluc2lkZSB0aGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcudG9vbHRpcC1idXR0b24nLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgIC8vIEFkZGluZyBjbG9zZS10b29sdGlwIGhhbmRsZXIgZm9yIHBvcHVwLXRvb2x0aXBzIChjbGljayBvbiBhbnkgZWxlbWVudCBleGNlcHQgdGhlIHRvb2x0aXAgaXRzZWxmKVxyXG4gICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKCcucG9wdXAtdG9vbHRpcDp2aXNpYmxlJykuZ2V0KDApO1xyXG4gICAgICAgIC8vIElmIHRoZSBjbGljayBpcyBOb3Qgb24gdGhlIHRvb2x0aXAgb3IgYW55IGVsZW1lbnQgY29udGFpbmVkXHJcbiAgICAgICAgLy8gaGlkZSB0b29sdGlwXHJcbiAgICAgICAgaWYgKGUudGFyZ2V0ICE9IHQgJiYgISQoZS50YXJnZXQpLmlzQ2hpbGRPZih0KSlcclxuICAgICAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KVxyXG4gICAgLy8gQXZvaWQgY2xvc2UtYWN0aW9uIGNsaWNrIGZyb20gcmVkaXJlY3QgcGFnZSwgYW5kIGhpZGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcucG9wdXAtdG9vbHRpcCAuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KTtcclxuICAgIHVwZGF0ZSgpO1xyXG59XHJcbi8qKiBVcGRhdGUgZWxlbWVudHMgb24gdGhlIHBhZ2UgdG8gcmVmbGVjdCBjaGFuZ2VzIG9yIG5lZWQgZm9yIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoZWxlbWVudF9zZWxlY3Rvcikge1xyXG4gICAgLy8gUmV2aWV3IGV2ZXJ5IHBvcHVwIHRvb2x0aXAgdG8gcHJlcGFyZSBjb250ZW50IGFuZCBtYXJrL3VubWFyayB0aGUgbGluayBvciB0ZXh0OlxyXG4gICAgJChlbGVtZW50X3NlbGVjdG9yIHx8IHNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb24oJCh0aGlzKSk7XHJcbiAgICB9KTtcclxufVxyXG4vKiogQ3JlYXRlIHRvb2x0aXAgb24gZWxlbWVudCBieSBkZW1hbmRcclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZV90b29sdGlwKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCB7XHJcbiAgICAgICAgdGl0bGU6ICcnXHJcbiAgICAgICAgLCBkZXNjcmlwdGlvbjogbnVsbFxyXG4gICAgICAgICwgdXJsOiBudWxsXHJcbiAgICAgICAgLCBpc19wb3B1cDogZmFsc2VcclxuICAgICAgICAsIHBlcnNpc3RlbnQ6IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoZWxlbWVudClcclxuICAgIC5hdHRyKCd0aXRsZScsIHNldHRpbmdzLnRpdGxlKVxyXG4gICAgLmRhdGEoJ2Rlc2NyaXB0aW9uJywgc2V0dGluZ3MuZGVzY3JpcHRpb24pXHJcbiAgICAuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJywgc2V0dGluZ3MucGVyc2lzdGVudClcclxuICAgIC5hZGRDbGFzcyhzZXR0aW5ncy5pc19wb3B1cCA/ICdoYXMtcG9wdXAtdG9vbHRpcCcgOiAnaGFzLXRvb2x0aXAnKTtcclxuICAgIHVwZGF0ZShlbGVtZW50KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdFRvb2x0aXBzOiBpbml0LFxyXG4gICAgICAgIHVwZGF0ZVRvb2x0aXBzOiB1cGRhdGUsXHJcbiAgICAgICAgY3JlYXRlVG9vbHRpcDogY3JlYXRlX3Rvb2x0aXBcclxuICAgIH07XHJcbiIsIi8qIFNvbWUgdG9vbHMgZm9ybSBVUkwgbWFuYWdlbWVudFxyXG4qL1xyXG5leHBvcnRzLmdldFVSTFBhcmFtZXRlciA9IGZ1bmN0aW9uIGdldFVSTFBhcmFtZXRlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gZGVjb2RlVVJJKFxyXG4gICAgICAgIChSZWdFeHAobmFtZSArICc9JyArICcoLis/KSgmfCQpJywgJ2knKS5leGVjKGxvY2F0aW9uLnNlYXJjaCkgfHwgWywgbnVsbF0pWzFdKTtcclxufTtcclxuZXhwb3J0cy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSBmdW5jdGlvbiBnZXRIYXNoQmFuZ1BhcmFtZXRlcnMoaGFzaGJhbmd2YWx1ZSkge1xyXG4gICAgLy8gSGFzaGJhbmd2YWx1ZSBpcyBzb21ldGhpbmcgbGlrZTogVGhyZWFkLTFfTWVzc2FnZS0yXHJcbiAgICAvLyBXaGVyZSAnMScgaXMgdGhlIFRocmVhZElEIGFuZCAnMicgdGhlIG9wdGlvbmFsIE1lc3NhZ2VJRCwgb3Igb3RoZXIgcGFyYW1ldGVyc1xyXG4gICAgdmFyIHBhcnMgPSBoYXNoYmFuZ3ZhbHVlLnNwbGl0KCdfJyk7XHJcbiAgICB2YXIgdXJsUGFyYW1ldGVycyA9IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHBhcnN2YWx1ZXMgPSBwYXJzW2ldLnNwbGl0KCctJyk7XHJcbiAgICAgICAgaWYgKHBhcnN2YWx1ZXMubGVuZ3RoID09IDIpXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSBwYXJzdmFsdWVzWzFdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXJsUGFyYW1ldGVyc1twYXJzdmFsdWVzWzBdXSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXJsUGFyYW1ldGVycztcclxufTtcclxuIiwiLyoqIFZhbGlkYXRpb24gbG9naWMgd2l0aCBsb2FkIGFuZCBzZXR1cCBvZiB2YWxpZGF0b3JzIGFuZCBcclxuICAgIHZhbGlkYXRpb24gcmVsYXRlZCB1dGlsaXRpZXNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbi8vIFVzaW5nIG9uIHNldHVwIGFzeW5jcm9ub3VzIGxvYWQgaW5zdGVhZCBvZiB0aGlzIHN0YXRpYy1saW5rZWQgbG9hZFxyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qcycpO1xyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qcycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBWYWxpZGF0aW9uKHJlYXBwbHlPbmx5VG8pIHtcclxuICAgIHJlYXBwbHlPbmx5VG8gPSByZWFwcGx5T25seVRvIHx8IGRvY3VtZW50O1xyXG4gICAgaWYgKCF3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkgd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmICghanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkge1xyXG4gICAgICAgIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKFtcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qc1wiIH0sXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanNcIiB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDaGVjayBmaXJzdCBpZiB2YWxpZGF0aW9uIGlzIGVuYWJsZWQgKGNhbiBoYXBwZW4gdGhhdCB0d2ljZSBpbmNsdWRlcyBvZlxyXG4gICAgICAgIC8vIHRoaXMgY29kZSBoYXBwZW4gYXQgc2FtZSBwYWdlLCBiZWluZyBleGVjdXRlZCB0aGlzIGNvZGUgYWZ0ZXIgZmlyc3QgYXBwZWFyYW5jZVxyXG4gICAgICAgIC8vIHdpdGggdGhlIHN3aXRjaCBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkIGNoYW5nZWRcclxuICAgICAgICAvLyBidXQgd2l0aG91dCB2YWxpZGF0aW9uIGJlaW5nIGFscmVhZHkgbG9hZGVkIGFuZCBlbmFibGVkKVxyXG4gICAgICAgIGlmICgkICYmICQudmFsaWRhdG9yICYmICQudmFsaWRhdG9yLnVub2J0cnVzaXZlKSB7XHJcbiAgICAgICAgICAgIC8vIEFwcGx5IHRoZSB2YWxpZGF0aW9uIHJ1bGVzIHRvIHRoZSBuZXcgZWxlbWVudHNcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd2YWxpZGF0b3InKTtcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICAgICAgJC52YWxpZGF0b3IudW5vYnRydXNpdmUucGFyc2UocmVhcHBseU9ubHlUbyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXRpZXMgKi9cclxuXHJcbi8qIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzIG9mIHRoZSB2YWxpZGF0aW9uIHN1bW1hcnlcclxuaW5jbHVkZWQgaW4gJ2NvbnRhaW5lcicgYW5kIHNldCBhcyB2YWxpZCB0aGUgc3VtbWFyeVxyXG4qL1xyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgICAkKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAuZmluZCgnPnVsPmxpJykucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gU2V0IGFsbCBmaWVsZHMgdmFsaWRhdGlvbiBpbnNpZGUgdGhpcyBmb3JtIChhZmZlY3RlZCBieSB0aGUgc3VtbWFyeSB0b28pXHJcbiAgICAvLyBhcyB2YWxpZCB0b29cclxuICAgICQoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAudGV4dCgnJyk7XHJcblxyXG4gICAgLy8gUmUtYXBwbHkgc2V0dXAgdmFsaWRhdGlvbiB0byBlbnN1cmUgaXMgd29ya2luZywgYmVjYXVzZSBqdXN0IGFmdGVyIGEgc3VjY2Vzc2Z1bFxyXG4gICAgLy8gdmFsaWRhdGlvbiwgYXNwLm5ldCB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIHN0b3BzIHdvcmtpbmcgb24gY2xpZW50LXNpZGUuXHJcbiAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSkge1xyXG4gICAgdmFyIG9mZiA9IGZvcm0uZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5vZmZzZXQoKTtcclxuICAgIGlmIChvZmYpXHJcbiAgICAgICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBvZmYudG9wIH0sIDUwMCk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignZ29Ub1N1bW1hcnlFcnJvcnM6IG5vIHN1bW1hcnkgdG8gZm9jdXMnKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZXR1cDogc2V0dXBWYWxpZGF0aW9uLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQsXHJcbiAgICBnb1RvU3VtbWFyeUVycm9yczogZ29Ub1N1bW1hcnlFcnJvcnNcclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIHNvbWUgQWNjb3VudCBwYWdlcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmxvZ2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSBiYXNlVXJsICsgJ0FjY291bnQvJExvZ2luLz9SZXR1cm5Vcmw9JyArIGVuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24pO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICdhLnJlZ2lzdGVyJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L1JlZ2lzdGVyJywgJy9BY2NvdW50LyRSZWdpc3RlcicpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDUwLCBoZWlnaHQ6IDUwMCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICdhLmZvcmdvdC1wYXNzd29yZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9Gb3Jnb3RQYXNzd29yZCcsICcvQWNjb3VudC8kRm9yZ290UGFzc3dvcmQnKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQwMCwgaGVpZ2h0OiAyNDAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5jaGFuZ2UtcGFzc3dvcmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvQ2hhbmdlUGFzc3dvcmQnLCAnL0FjY291bnQvJENoYW5nZVBhc3N3b3JkJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0NTAsIGhlaWdodDogMzQwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8vIE9VUiBuYW1lc3BhY2UgKGFiYnJldmlhdGVkIExvY29ub21pY3MpXHJcbndpbmRvdy5MQyA9IHdpbmRvdy5MQyB8fCB7fTtcclxuXHJcbi8vIFRPRE8gUmV2aWV3IExjVXJsIHVzZSBhcm91bmQgYWxsIHRoZSBtb2R1bGVzLCB1c2UgREkgd2hlbmV2ZXIgcG9zc2libGUgKGluaXQvc2V0dXAgbWV0aG9kIG9yIGluIHVzZSBjYXNlcylcclxuLy8gYnV0IG9ubHkgZm9yIHRoZSB3YW50ZWQgYmFzZVVybCBvbiBlYWNoIGNhc2UgYW5kIG5vdCBwYXNzIGFsbCB0aGUgTGNVcmwgb2JqZWN0LlxyXG4vLyBMY1VybCBpcyBzZXJ2ZXItc2lkZSBnZW5lcmF0ZWQgYW5kIHdyb3RlIGluIGEgTGF5b3V0IHNjcmlwdC10YWcuXHJcblxyXG4vLyBHbG9iYWwgc2V0dGluZ3Ncclxud2luZG93LmdMb2FkaW5nUmV0YXJkID0gMzAwO1xyXG5cclxuLyoqKlxyXG4gKiogTG9hZGluZyBtb2R1bGVzXHJcbioqKi9cclxuLy9UT0RPOiBDbGVhbiBkZXBlbmRlbmNpZXMsIHJlbW92ZSBhbGwgdGhhdCBub3QgdXNlZCBkaXJlY3RseSBpbiB0aGlzIGZpbGUsIGFueSBvdGhlciBmaWxlXHJcbi8vIG9yIHBhZ2UgbXVzdCByZXF1aXJlIGl0cyBkZXBlbmRlbmNpZXMuXHJcblxyXG53aW5kb3cuTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG5cclxuLyogalF1ZXJ5LCBzb21lIHZlbmRvciBwbHVnaW5zIChmcm9tIGJ1bmRsZSkgYW5kIG91ciBhZGRpdGlvbnMgKHNtYWxsIHBsdWdpbnMpLCB0aGV5IGFyZSBhdXRvbWF0aWNhbGx5IHBsdWctZWQgb24gcmVxdWlyZSAqL1xyXG52YXIgJCA9IHdpbmRvdy4kID0gd2luZG93LmpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5iYS1oYXNoY2hhbmdlJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5hcmUnKTtcclxuLy8gTWFza2VkIGlucHV0LCBmb3IgZGF0ZXMgLWF0IG15LWFjY291bnQtLlxyXG5yZXF1aXJlKCdqcXVlcnkuZm9ybWF0dGVyJyk7XHJcblxyXG4vLyBHZW5lcmFsIGNhbGxiYWNrcyBmb3IgQUpBWCBldmVudHMgd2l0aCBjb21tb24gbG9naWNcclxudmFyIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCcuLi9MQy9hamF4Q2FsbGJhY2tzJyk7XHJcbi8vIEZvcm0uYWpheCBsb2dpYyBhbmQgbW9yZSBzcGVjaWZpYyBjYWxsYmFja3MgYmFzZWQgb24gYWpheENhbGxiYWNrc1xyXG52YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc1xyXG53aW5kb3cuYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIgPSBhamF4Rm9ybXMub25TdWNjZXNzO1xyXG53aW5kb3cuYWpheEVycm9yUG9wdXBIYW5kbGVyID0gYWpheEZvcm1zLm9uRXJyb3I7XHJcbndpbmRvdy5hamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXIgPSBhamF4Rm9ybXMub25Db21wbGV0ZTtcclxuLy99XHJcblxyXG4vKiBSZWxvYWQgKi9cclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LnJlbG9hZCcpO1xyXG4kLmZuLnJlbG9hZC5kZWZhdWx0cyA9IHtcclxuICAgIHN1Y2Nlc3M6IFthamF4Rm9ybXMub25TdWNjZXNzXSxcclxuICAgIGVycm9yOiBbYWpheEZvcm1zLm9uRXJyb3JdLFxyXG4gICAgZGVsYXk6IGdMb2FkaW5nUmV0YXJkXHJcbn07XHJcblxyXG5MQy5tb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4uL0xDL21vdmVGb2N1c1RvJyk7XHJcbi8qIERpc2FibGVkIGJlY2F1c2UgY29uZmxpY3RzIHdpdGggdGhlIG1vdmVGb2N1c1RvIG9mIFxyXG4gIGFqYXhGb3JtLm9uc3VjY2VzcywgaXQgaGFwcGVucyBhIGJsb2NrLmxvYWRpbmcganVzdCBhZnRlclxyXG4gIHRoZSBzdWNjZXNzIGhhcHBlbnMuXHJcbiQuYmxvY2tVSS5kZWZhdWx0cy5vbkJsb2NrID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gU2Nyb2xsIHRvIGJsb2NrLW1lc3NhZ2UgdG8gZG9uJ3QgbG9zdCBpbiBsYXJnZSBwYWdlczpcclxuICAgIExDLm1vdmVGb2N1c1RvKHRoaXMpO1xyXG59OyovXHJcblxyXG52YXIgbG9hZGVyID0gcmVxdWlyZSgnLi4vTEMvbG9hZGVyJyk7XHJcbkxDLmxvYWQgPSBsb2FkZXIubG9hZDtcclxuXHJcbnZhciBibG9ja3MgPSBMQy5ibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuLi9MQy9ibG9ja1ByZXNldHMnKTtcclxuLy97VEVNUFxyXG53aW5kb3cubG9hZGluZ0Jsb2NrID0gYmxvY2tzLmxvYWRpbmc7XHJcbndpbmRvdy5pbmZvQmxvY2sgPSBibG9ja3MuaW5mbztcclxud2luZG93LmVycm9yQmxvY2sgPSBibG9ja3MuZXJyb3I7XHJcbi8vfVxyXG5cclxuQXJyYXkucmVtb3ZlID0gcmVxdWlyZSgnLi4vTEMvQXJyYXkucmVtb3ZlJyk7XHJcbnJlcXVpcmUoJy4uL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMnKTtcclxuXHJcbkxDLmdldFRleHQgPSByZXF1aXJlKCcuLi9MQy9nZXRUZXh0Jyk7XHJcblxyXG52YXIgVGltZVNwYW4gPSBMQy50aW1lU3BhbiA9IHJlcXVpcmUoJy4uL0xDL1RpbWVTcGFuJyk7XHJcbnZhciB0aW1lU3BhbkV4dHJhID0gcmVxdWlyZSgnLi4vTEMvVGltZVNwYW5FeHRyYScpO1xyXG50aW1lU3BhbkV4dHJhLnBsdWdJbihUaW1lU3Bhbik7XHJcbi8ve1RFTVAgIG9sZCBhbGlhc2VzXHJcbkxDLnNtYXJ0VGltZSA9IHRpbWVTcGFuRXh0cmEuc21hcnRUaW1lO1xyXG5MQy5yb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyID0gdGltZVNwYW5FeHRyYS5yb3VuZFRvUXVhcnRlckhvdXI7XHJcbi8vfVxyXG5cclxuTEMuQ2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4uL0xDL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxud2luZG93LlRhYmJlZFVYID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVgnKTtcclxudmFyIHNsaWRlclRhYnMgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5zbGlkZXJUYWJzJyk7XHJcblxyXG4vLyBQb3B1cCBBUElzXHJcbndpbmRvdy5zbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4uL0xDL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG52YXIgcG9wdXAgPSByZXF1aXJlKCcuLi9MQy9wb3B1cCcpO1xyXG4vL3tURU1QXHJcbnZhciBwb3B1cFN0eWxlID0gcG9wdXAuc3R5bGUsXHJcbiAgICBwb3B1cFNpemUgPSBwb3B1cC5zaXplO1xyXG5MQy5tZXNzYWdlUG9wdXAgPSBwb3B1cC5tZXNzYWdlO1xyXG5MQy5jb25uZWN0UG9wdXBBY3Rpb24gPSBwb3B1cC5jb25uZWN0QWN0aW9uO1xyXG53aW5kb3cucG9wdXAgPSBwb3B1cDtcclxuLy99XHJcblxyXG5MQy5zYW5pdGl6ZVdoaXRlc3BhY2VzID0gcmVxdWlyZSgnLi4vTEMvc2FuaXRpemVXaGl0ZXNwYWNlcycpO1xyXG4vL3tURU1QICAgYWxpYXMgYmVjYXVzZSBtaXNzcGVsbGluZ1xyXG5MQy5zYW5pdGl6ZVdoaXRlcGFjZXMgPSBMQy5zYW5pdGl6ZVdoaXRlc3BhY2VzO1xyXG4vL31cclxuXHJcbkxDLmdldFhQYXRoID0gcmVxdWlyZSgnLi4vTEMvZ2V0WFBhdGgnKTtcclxuXHJcbnZhciBzdHJpbmdGb3JtYXQgPSByZXF1aXJlKCcuLi9MQy9TdHJpbmdGb3JtYXQnKTtcclxuXHJcbi8vIEV4cGFuZGluZyBleHBvcnRlZCB1dGlsaXRlcyBmcm9tIG1vZHVsZXMgZGlyZWN0bHkgYXMgTEMgbWVtYmVyczpcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL1ByaWNlJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvbWF0aFV0aWxzJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvbnVtYmVyVXRpbHMnKSk7XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy90b29sdGlwcycpKTtcclxudmFyIGkxOG4gPSBMQy5pMThuID0gcmVxdWlyZSgnLi4vTEMvaTE4bicpO1xyXG4vL3tURU1QIG9sZCBhbGlzZXMgb24gTEMgYW5kIGdsb2JhbFxyXG4kLmV4dGVuZChMQywgaTE4bik7XHJcbiQuZXh0ZW5kKHdpbmRvdywgaTE4bik7XHJcbi8vfVxyXG5cclxuLy8geHRzaDogcGx1Z2VkIGludG8ganF1ZXJ5IGFuZCBwYXJ0IG9mIExDXHJcbnZhciB4dHNoID0gcmVxdWlyZSgnLi4vTEMvanF1ZXJ5Lnh0c2gnKTtcclxueHRzaC5wbHVnSW4oJCk7XHJcbi8ve1RFTVAgICByZW1vdmUgb2xkIExDLiogYWxpYXNcclxuJC5leHRlbmQoTEMsIHh0c2gpO1xyXG5kZWxldGUgTEMucGx1Z0luO1xyXG4vL31cclxuXHJcbnZhciBhdXRvQ2FsY3VsYXRlID0gTEMuYXV0b0NhbGN1bGF0ZSA9IHJlcXVpcmUoJy4uL0xDL2F1dG9DYWxjdWxhdGUnKTtcclxuLy97VEVNUCAgIHJlbW92ZSBvbGQgYWxpYXMgdXNlXHJcbnZhciBsY1NldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscyA9IGF1dG9DYWxjdWxhdGUub25UYWJsZUl0ZW1zO1xyXG5MQy5zZXR1cENhbGN1bGF0ZVN1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLm9uU3VtbWFyeTtcclxuTEMudXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUudXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeTtcclxuTEMuc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS5vbkRldGFpbGVkUHJpY2luZ1N1bW1hcnk7XHJcbi8vfVxyXG5cclxudmFyIENvb2tpZSA9IExDLkNvb2tpZSA9IHJlcXVpcmUoJy4uL0xDL0Nvb2tpZScpO1xyXG4vL3tURU1QICAgIG9sZCBhbGlhc1xyXG52YXIgZ2V0Q29va2llID0gQ29va2llLmdldCxcclxuICAgIHNldENvb2tpZSA9IENvb2tpZS5zZXQ7XHJcbi8vfVxyXG5cclxuTEMuZGF0ZVBpY2tlciA9IHJlcXVpcmUoJy4uL0xDL2RhdGVQaWNrZXInKTtcclxuLy97VEVNUCAgIG9sZCBhbGlhc1xyXG53aW5kb3cuc2V0dXBEYXRlUGlja2VyID0gTEMuc2V0dXBEYXRlUGlja2VyID0gTEMuZGF0ZVBpY2tlci5pbml0O1xyXG53aW5kb3cuYXBwbHlEYXRlUGlja2VyID0gTEMuYXBwbHlEYXRlUGlja2VyID0gTEMuZGF0ZVBpY2tlci5hcHBseTtcclxuLy99XHJcblxyXG5MQy5hdXRvRm9jdXMgPSByZXF1aXJlKCcuLi9MQy9hdXRvRm9jdXMnKTtcclxuXHJcbi8vIENSVURMXHJcbnZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcblxyXG4vLyBVSSBTbGlkZXIgTGFiZWxzXHJcbnZhciBzbGlkZXJMYWJlbHMgPSByZXF1aXJlKCcuLi9MQy9VSVNsaWRlckxhYmVscycpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxuTEMuY3JlYXRlTGFiZWxzRm9yVUlTbGlkZXIgPSBzbGlkZXJMYWJlbHMuY3JlYXRlO1xyXG5MQy51cGRhdGVMYWJlbHNGb3JVSVNsaWRlciA9IHNsaWRlckxhYmVscy51cGRhdGU7XHJcbkxDLnVpU2xpZGVyTGFiZWxzTGF5b3V0cyA9IHNsaWRlckxhYmVscy5sYXlvdXRzO1xyXG4vL31cclxuXHJcbnZhciB2YWxpZGF0aW9uSGVscGVyID0gcmVxdWlyZSgnLi4vTEMvdmFsaWRhdGlvbkhlbHBlcicpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxuTEMuc2V0dXBWYWxpZGF0aW9uID0gdmFsaWRhdGlvbkhlbHBlci5zZXR1cDtcclxuTEMuc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkID0gdmFsaWRhdGlvbkhlbHBlci5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQ7XHJcbkxDLmdvVG9TdW1tYXJ5RXJyb3JzID0gdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycztcclxuLy99XHJcblxyXG5MQy5wbGFjZUhvbGRlciA9IHJlcXVpcmUoJy4uL0xDL3BsYWNlaG9sZGVyLXBvbHlmaWxsJykuaW5pdDtcclxuXHJcbkxDLm1hcFJlYWR5ID0gcmVxdWlyZSgnLi4vTEMvZ29vZ2xlTWFwUmVhZHknKTtcclxuXHJcbndpbmRvdy5pc0VtcHR5U3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvaXNFbXB0eVN0cmluZycpO1xyXG5cclxud2luZG93Lmd1aWRHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9MQy9ndWlkR2VuZXJhdG9yJyk7XHJcblxyXG52YXIgdXJsVXRpbHMgPSByZXF1aXJlKCcuLi9MQy91cmxVdGlscycpO1xyXG53aW5kb3cuZ2V0VVJMUGFyYW1ldGVyID0gdXJsVXRpbHMuZ2V0VVJMUGFyYW1ldGVyO1xyXG53aW5kb3cuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzID0gdXJsVXRpbHMuZ2V0SGFzaEJhbmdQYXJhbWV0ZXJzO1xyXG5cclxudmFyIGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2RhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZycpO1xyXG4vL3tURU1QXHJcbkxDLmRhdGVUb0ludGVyY2hhbmdsZVN0cmluZyA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZztcclxuLy99XHJcblxyXG4vLyBQYWdlcyBpbiBwb3B1cFxyXG52YXIgd2VsY29tZVBvcHVwID0gcmVxdWlyZSgnLi93ZWxjb21lUG9wdXAnKTtcclxuLy92YXIgdGFrZUFUb3VyUG9wdXAgPSByZXF1aXJlKCd0YWtlQVRvdXJQb3B1cCcpO1xyXG52YXIgZmFxc1BvcHVwcyA9IHJlcXVpcmUoJy4vZmFxc1BvcHVwcycpO1xyXG52YXIgYWNjb3VudFBvcHVwcyA9IHJlcXVpcmUoJy4vYWNjb3VudFBvcHVwcycpO1xyXG52YXIgbGVnYWxQb3B1cHMgPSByZXF1aXJlKCcuL2xlZ2FsUG9wdXBzJyk7XHJcblxyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQgPSByZXF1aXJlKCcuL2F2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0Jyk7XHJcblxyXG52YXIgYXV0b2ZpbGxTdWJtZW51ID0gcmVxdWlyZSgnLi4vTEMvYXV0b2ZpbGxTdWJtZW51Jyk7XHJcblxyXG52YXIgdGFiYmVkV2l6YXJkID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVgud2l6YXJkJyk7XHJcblxyXG52YXIgaGFzQ29uZmlybVN1cHBvcnQgPSByZXF1aXJlKCcuLi9MQy9oYXNDb25maXJtU3VwcG9ydCcpO1xyXG5cclxudmFyIHBvc3RhbENvZGVWYWxpZGF0aW9uID0gcmVxdWlyZSgnLi4vTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24nKTtcclxuXHJcbnZhciB0YWJiZWROb3RpZmljYXRpb25zID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxudmFyIHRhYnNBdXRvbG9hZCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLmF1dG9sb2FkJyk7XHJcblxyXG52YXIgaG9tZVBhZ2UgPSByZXF1aXJlKCcuL2hvbWUnKTtcclxuXHJcbi8ve1RFTVAgcmVtb3ZlIGdsb2JhbCBkZXBlbmRlbmN5IGZvciB0aGlzXHJcbndpbmRvdy5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi4vTEMvanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG4vL31cclxuXHJcbi8qKlxyXG4gKiogSW5pdCBjb2RlXHJcbioqKi9cclxuJCh3aW5kb3cpLmxvYWQoZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gRGlzYWJsZSBicm93c2VyIGJlaGF2aW9yIHRvIGF1dG8tc2Nyb2xsIHRvIHVybCBmcmFnbWVudC9oYXNoIGVsZW1lbnQgcG9zaXRpb246XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgJCgnaHRtbCxib2R5Jykuc2Nyb2xsVG9wKDApOyB9LCAxKTtcclxufSk7XHJcbiQoZnVuY3Rpb24gKCkge1xyXG4gIC8vIFBsYWNlaG9sZGVyIHBvbHlmaWxsXHJcbiAgTEMucGxhY2VIb2xkZXIoKTtcclxuXHJcbiAgLy8gQXV0b2ZvY3VzIHBvbHlmaWxsXHJcbiAgTEMuYXV0b0ZvY3VzKCk7XHJcblxyXG4gIC8vIEdlbmVyaWMgc2NyaXB0IGZvciBlbmhhbmNlZCB0b29sdGlwcyBhbmQgZWxlbWVudCBkZXNjcmlwdGlvbnNcclxuICBMQy5pbml0VG9vbHRpcHMoKTtcclxuXHJcbiAgYWpheEZvcm1zLmluaXQoKTtcclxuXHJcbiAgLy90YWtlQVRvdXJQb3B1cC5zaG93KCk7XHJcbiAgd2VsY29tZVBvcHVwLnNob3coKTtcclxuICAvLyBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgZm9yIHNvbWUgbGlua3MgdGhhdCBieSBkZWZhdWx0IG9wZW4gYSBuZXcgdGFiOlxyXG4gIGZhcXNQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuICBhY2NvdW50UG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcbiAgbGVnYWxQb3B1cHMuZW5hYmxlKExjVXJsLkxhbmdQYXRoKTtcclxuXHJcbiAgYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuaW5pdChMY1VybC5MYW5nUGF0aCk7XHJcblxyXG4gIHBvcHVwLmNvbm5lY3RBY3Rpb24oKTtcclxuXHJcbiAgLy8gRGF0ZSBQaWNrZXJcclxuICBMQy5kYXRlUGlja2VyLmluaXQoKTtcclxuXHJcbiAgLyogQXV0byBjYWxjdWxhdGUgdGFibGUgaXRlbXMgdG90YWwgKHF1YW50aXR5KnVuaXRwcmljZT1pdGVtLXRvdGFsKSBzY3JpcHQgKi9cclxuICBhdXRvQ2FsY3VsYXRlLm9uVGFibGVJdGVtcygpO1xyXG4gIGF1dG9DYWxjdWxhdGUub25TdW1tYXJ5KCk7XHJcblxyXG4gIGhhc0NvbmZpcm1TdXBwb3J0Lm9uKCk7XHJcblxyXG4gIHBvc3RhbENvZGVWYWxpZGF0aW9uLmluaXQoeyBiYXNlVXJsOiBMY1VybC5MYW5nUGF0aCB9KTtcclxuXHJcbiAgLy8gVGFiYmVkIGludGVyZmFjZVxyXG4gIHRhYnNBdXRvbG9hZC5pbml0KFRhYmJlZFVYKTtcclxuICBUYWJiZWRVWC5pbml0KCk7XHJcbiAgVGFiYmVkVVguZm9jdXNDdXJyZW50TG9jYXRpb24oKTtcclxuICBUYWJiZWRVWC5jaGVja1ZvbGF0aWxlVGFicygpO1xyXG4gIHNsaWRlclRhYnMuaW5pdChUYWJiZWRVWCk7XHJcblxyXG4gIHRhYmJlZFdpemFyZC5pbml0KFRhYmJlZFVYLCB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IGdMb2FkaW5nUmV0YXJkXHJcbiAgfSk7XHJcblxyXG4gIHRhYmJlZE5vdGlmaWNhdGlvbnMuaW5pdChUYWJiZWRVWCk7XHJcblxyXG4gIGF1dG9maWxsU3VibWVudSgpO1xyXG5cclxuICAvLyBUT0RPOiAnbG9hZEhhc2hCYW5nJyBjdXN0b20gZXZlbnQgaW4gdXNlP1xyXG4gIC8vIElmIHRoZSBoYXNoIHZhbHVlIGZvbGxvdyB0aGUgJ2hhc2ggYmFuZycgY29udmVudGlvbiwgbGV0IG90aGVyXHJcbiAgLy8gc2NyaXB0cyBkbyB0aGVpciB3b3JrIHRocm91Z2h0IGEgJ2xvYWRIYXNoQmFuZycgZXZlbnQgaGFuZGxlclxyXG4gIGlmICgvXiMhLy50ZXN0KHdpbmRvdy5sb2NhdGlvbi5oYXNoKSlcclxuICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2xvYWRIYXNoQmFuZycsIHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cmluZygxKSk7XHJcblxyXG4gIC8vIFJlbG9hZCBidXR0b25zXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgJy5yZWxvYWQtYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gR2VuZXJpYyBhY3Rpb24gdG8gY2FsbCBsYy5qcXVlcnkgJ3JlbG9hZCcgZnVuY3Rpb24gZnJvbSBhbiBlbGVtZW50IGluc2lkZSBpdHNlbGYuXHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgJHQuY2xvc2VzdCgkdC5kYXRhKCdyZWxvYWQtdGFyZ2V0JykpLnJlbG9hZCgpO1xyXG4gIH0pO1xyXG5cclxuICAvKiBFbmFibGUgZm9jdXMgdGFiIG9uIGV2ZXJ5IGhhc2ggY2hhbmdlLCBub3cgdGhlcmUgYXJlIHR3byBzY3JpcHRzIG1vcmUgc3BlY2lmaWMgZm9yIHRoaXM6XHJcbiAgKiBvbmUgd2hlbiBwYWdlIGxvYWQgKHdoZXJlPyksXHJcbiAgKiBhbmQgYW5vdGhlciBvbmx5IGZvciBsaW5rcyB3aXRoICd0YXJnZXQtdGFiJyBjbGFzcy5cclxuICAqIE5lZWQgYmUgc3R1ZHkgaWYgc29tZXRoaW5nIG9mIHRoZXJlIG11c3QgYmUgcmVtb3ZlZCBvciBjaGFuZ2VkLlxyXG4gICogVGhpcyBpcyBuZWVkZWQgZm9yIG90aGVyIGJlaGF2aW9ycyB0byB3b3JrLiAqL1xyXG4gIC8vIE9uIHRhcmdldC10YWIgbGlua3NcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYS50YXJnZXQtdGFiJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIoJCh0aGlzKS5hdHRyKCdocmVmJykpO1xyXG4gICAgaWYgKHRoZXJlSXNUYWIpIHtcclxuICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGhlcmVJc1RhYik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuICAvLyBPbiBoYXNoIGNoYW5nZVxyXG4gIGlmICgkLmZuLmhhc2hjaGFuZ2UpXHJcbiAgICAkKHdpbmRvdykuaGFzaGNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGlmICghL14jIS8udGVzdChsb2NhdGlvbi5oYXNoKSkge1xyXG4gICAgICAgIHZhciB0aGVyZUlzVGFiID0gVGFiYmVkVVguZ2V0VGFiKGxvY2F0aW9uLmhhc2gpO1xyXG4gICAgICAgIGlmICh0aGVyZUlzVGFiKVxyXG4gICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGhlcmVJc1RhYik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAvLyBIT01FIFBBR0UgLyBTRUFSQ0ggU1RVRkZcclxuICBob21lUGFnZS5pbml0KCk7XHJcblxyXG4gIC8vIFZhbGlkYXRpb24gYXV0byBzZXR1cCBmb3IgcGFnZSByZWFkeSBhbmQgYWZ0ZXIgZXZlcnkgYWpheCByZXF1ZXN0XHJcbiAgLy8gaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBmb3JtIGluIHRoZSBwYWdlLlxyXG4gIC8vIFRoaXMgYXZvaWQgdGhlIG5lZWQgZm9yIGV2ZXJ5IHBhZ2Ugd2l0aCBmb3JtIHRvIGRvIHRoZSBzZXR1cCBpdHNlbGZcclxuICAvLyBhbG1vc3QgZm9yIG1vc3Qgb2YgdGhlIGNhc2UuXHJcbiAgZnVuY3Rpb24gYXV0b1NldHVwVmFsaWRhdGlvbigpIHtcclxuICAgIGlmICgkKGRvY3VtZW50KS5oYXMoJ2Zvcm0nKS5sZW5ndGgpXHJcbiAgICAgIHZhbGlkYXRpb25IZWxwZXIuc2V0dXAoJ2Zvcm0nKTtcclxuICB9XHJcbiAgYXV0b1NldHVwVmFsaWRhdGlvbigpO1xyXG4gICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShhdXRvU2V0dXBWYWxpZGF0aW9uKTtcclxuXHJcbiAgLy8gVE9ETzogdXNlZCBzb21lIHRpbWU/IHN0aWxsIHJlcXVpcmVkIHVzaW5nIG1vZHVsZXM/XHJcbiAgLypcclxuICAqIENvbW11bmljYXRlIHRoYXQgc2NyaXB0LmpzIGlzIHJlYWR5IHRvIGJlIHVzZWRcclxuICAqIGFuZCB0aGUgY29tbW9uIExDIGxpYiB0b28uXHJcbiAgKiBCb3RoIGFyZSBlbnN1cmVkIHRvIGJlIHJhaXNlZCBldmVyIGFmdGVyIHBhZ2UgaXMgcmVhZHkgdG9vLlxyXG4gICovXHJcbiAgJChkb2N1bWVudClcclxuICAgIC50cmlnZ2VyKCdsY1NjcmlwdFJlYWR5JylcclxuICAgIC50cmlnZ2VyKCdsY0xpYlJlYWR5Jyk7XHJcbn0pOyIsIi8qKioqKiBBVkFJTEFCSUxJVFkgQ0FMRU5EQVIgV0lER0VUICoqKioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuLi9MQy9zbW9vdGhCb3hCbG9jaycpLFxyXG4gICAgZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nID0gcmVxdWlyZSgnLi4vTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nJyk7XHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5yZWxvYWQnKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRBdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLmNhbGVuZGFyLWNvbnRyb2xzIC5hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoJHQuaGFzQ2xhc3MoJ3pvb20tYWN0aW9uJykpIHtcclxuICAgICAgICAgICAgLy8gRG8gem9vbVxyXG4gICAgICAgICAgICB2YXIgYyA9ICR0LmNsb3Nlc3QoJy5hdmFpbGFiaWxpdHktY2FsZW5kYXInKS5maW5kKCcuY2FsZW5kYXInKS5jbG9uZSgpO1xyXG4gICAgICAgICAgICBjLmNzcygnZm9udC1zaXplJywgJzJweCcpO1xyXG4gICAgICAgICAgICB2YXIgdGFiID0gJHQuY2xvc2VzdCgnLnRhYi1ib2R5Jyk7XHJcbiAgICAgICAgICAgIGMuZGF0YSgncG9wdXAtY29udGFpbmVyJywgdGFiKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbihjLCB0YWIsICdhdmFpbGFiaWxpdHktY2FsZW5kYXInLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAvLyBOb3RoaW5nIG1vcmVcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBOYXZpZ2F0ZSBjYWxlbmRhclxyXG4gICAgICAgIHZhciBuZXh0ID0gJHQuaGFzQ2xhc3MoJ25leHQtd2Vlay1hY3Rpb24nKTtcclxuICAgICAgICB2YXIgY29udCA9ICR0LmNsb3Nlc3QoJy5hdmFpbGFiaWxpdHktY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsY29udCA9IGNvbnQuY2hpbGRyZW4oJy5jYWxlbmRhci1jb250YWluZXInKTtcclxuICAgICAgICB2YXIgY2FsID0gY2FsY29udC5jaGlsZHJlbignLmNhbGVuZGFyJyk7XHJcbiAgICAgICAgdmFyIGNhbGluZm8gPSBjb250LmZpbmQoJy5jYWxlbmRhci1pbmZvJyk7XHJcbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShjYWwuZGF0YSgnc2hvd2VkLWRhdGUnKSk7XHJcbiAgICAgICAgdmFyIHVzZXJJZCA9IGNhbC5kYXRhKCd1c2VyLWlkJyk7XHJcbiAgICAgICAgaWYgKG5leHQpXHJcbiAgICAgICAgICAgIGRhdGUuc2V0RGF0ZShkYXRlLmdldERhdGUoKSArIDcpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpIC0gNyk7XHJcbiAgICAgICAgdmFyIHN0cmRhdGUgPSBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcoZGF0ZSk7XHJcbiAgICAgICAgdmFyIHVybCA9IGJhc2VVcmwgKyBcIlByb2ZpbGUvJEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0L1dlZWsvXCIgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyZGF0ZSkgKyBcIi8/VXNlcklEPVwiICsgdXNlcklkO1xyXG4gICAgICAgIGNhbGNvbnQucmVsb2FkKHVybCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBnZXQgdGhlIG5ldyBvYmplY3Q6XHJcbiAgICAgICAgICAgIHZhciBjYWwgPSAkKCcuY2FsZW5kYXInLCB0aGlzLmVsZW1lbnQpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy55ZWFyLXdlZWsnKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtd2VlaycpKTtcclxuICAgICAgICAgICAgY2FsaW5mby5maW5kKCcuZmlyc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtZmlyc3QtZGF5JykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5sYXN0LXdlZWstZGF5JykudGV4dChjYWwuZGF0YSgnc2hvd2VkLWxhc3QtZGF5JykpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIHRvIHNob3cgbGlua3MgdG8gRkFRcyAoZGVmYXVsdCBsaW5rcyBiZWhhdmlvciBpcyB0byBvcGVuIGluIGEgbmV3IHRhYilcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmVuYWJsZSA9IGZ1bmN0aW9uIChiYXNlVXJsKSB7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYVtocmVmfD1cIiNGQVFzXCJdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBocmVmID0gJCh0aGlzKS5hdHRyKCdocmVmJyk7XHJcbiAgICAgICAgdmFyIHVybHBhcnRzID0gaHJlZi5zcGxpdCgnLScpO1xyXG4gICAgICAgIHZhciB1cmxzZWN0aW9uID0gJyc7XHJcbiAgICAgICAgaWYgKHVybHBhcnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgdXJsc2VjdGlvbiA9IHVybHBhcnRzWzFdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB1cmxzZWN0aW9uICs9ICcjJyArIGhyZWY7XHJcbiAgICAgICAgdmFyIHVybHByZWZpeCA9IFwiSGVscENlbnRlci8kRkFRc1wiO1xyXG4gICAgICAgIGlmICh1cmxzZWN0aW9uKVxyXG4gICAgICAgICAgICBwb3B1cChiYXNlVXJsICsgdXJscHJlZml4ICsgdXJsc2VjdGlvbiwgJ2xhcmdlJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyogSU5JVCAqL1xyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBMb2NhdGlvbiBqcy1kcm9wZG93blxyXG4gICAgdmFyIHMgPSAkKCcjc2VhcmNoLWxvY2F0aW9uJyk7XHJcbiAgICBzLnByb3AoJ3JlYWRvbmx5JywgdHJ1ZSk7XHJcbiAgICBzLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgc291cmNlOiBMQy5zZWFyY2hMb2NhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgbWluTGVuZ3RoOiAwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBzZWxlY3Q6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcy5vbignZm9jdXMgY2xpY2snLCBmdW5jdGlvbiAoKSB7IHMuYXV0b2NvbXBsZXRlKCdzZWFyY2gnLCAnJyk7IH0pO1xyXG5cclxuICAgIC8qIFBvc2l0aW9ucyBhdXRvY29tcGxldGUgKi9cclxuICAgIHZhciBwb3NpdGlvbnNBdXRvY29tcGxldGUgPSAkKCcjc2VhcmNoLXNlcnZpY2UnKS5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAvLyBXZSB3YW50IHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAgICAgICAvLyQodGhpcykudmFsKHVpLml0ZW0ubGFiZWwpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBmb2N1czogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICAvLyBXZSB3YW50IHRoZSBsYWJlbCBpbiB0ZXh0Ym94LCBub3QgdGhlIHZhbHVlXHJcbiAgICAgICAgICAgIC8vJCh0aGlzKS52YWwodWkuaXRlbS5sYWJlbCk7XHJcbiAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIExvYWQgYWxsIHBvc2l0aW9ucyBpbiBiYWNrZ3JvdW5kIHRvIHJlcGxhY2UgdGhlIGF1dG9jb21wbGV0ZSBzb3VyY2UgKGF2b2lkaW5nIG11bHRpcGxlLCBzbG93IGxvb2stdXBzKVxyXG4gICAgLyokLmdldEpTT04oTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgIHBvc2l0aW9uc0F1dG9jb21wbGV0ZS5hdXRvY29tcGxldGUoJ29wdGlvbicsICdzb3VyY2UnLCBkYXRhKTtcclxuICAgIH1cclxuICAgICk7Ki9cclxufTsiLCIvKipcclxuICAgIEVuYWJsZSB0aGUgdXNlIG9mIHBvcHVwcyB0byBzaG93IGxpbmtzIHRvIHNvbWUgTGVnYWwgcGFnZXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudClcclxuICAgIC5vbignY2xpY2snLCAnLnZpZXctcHJpdmFjeS1wb2xpY3knLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcG9wdXAoYmFzZVVybCArICdIZWxwQ2VudGVyLyRQcml2YWN5UG9saWN5LycsICdsYXJnZScpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy52aWV3LXRlcm1zLW9mLXVzZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBwb3B1cChiYXNlVXJsICsgJ0hlbHBDZW50ZXIvJFRlcm1zT2ZVc2UvJywgJ2xhcmdlJyk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiogV2VsY29tZSBwb3B1cFxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vL1RPRE8gbW9yZSBkZXBlbmRlbmNpZXM/XHJcblxyXG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbiB3ZWxjb21lUG9wdXAoKSB7XHJcbiAgICB2YXIgYyA9ICQoJyN3ZWxjb21lcG9wdXAnKTtcclxuICAgIGlmIChjLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xyXG4gICAgdmFyIHNraXBTdGVwMSA9IGMuaGFzQ2xhc3MoJ3NlbGVjdC1wb3NpdGlvbicpO1xyXG5cclxuICAgIC8vIEluaXRcclxuICAgIGlmICghc2tpcFN0ZXAxKSB7XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhLCAudGVybXMsIC5wb3NpdGlvbi1kZXNjcmlwdGlvbicpLmhpZGUoKTtcclxuICAgIH1cclxuICAgIGMuZmluZCgnZm9ybScpLmdldCgwKS5yZXNldCgpO1xyXG4gICAgLy8gUmUtZW5hYmxlIGF1dG9jb21wbGV0ZTpcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkgeyBjLmZpbmQoJ1twbGFjZWhvbGRlcl0nKS5wbGFjZWhvbGRlcigpOyB9LCA1MDApO1xyXG4gICAgZnVuY3Rpb24gaW5pdFByb2ZpbGVEYXRhKCkge1xyXG4gICAgICAgIGMuZmluZCgnW25hbWU9am9idGl0bGVdJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgICAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgICAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgICAgICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBObyB2YWx1ZSwgbm8gYWN0aW9uIDooXHJcbiAgICAgICAgICAgICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnZhbHVlKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBpZCAodmFsdWUpIGluIHRoZSBoaWRkZW4gZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgYy5maW5kKCdbbmFtZT1wb3NpdGlvbmlkXScpLnZhbCh1aS5pdGVtLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIC8vIFNob3cgZGVzY3JpcHRpb25cclxuICAgICAgICAgICAgICAgIGMuZmluZCgnLnBvc2l0aW9uLWRlc2NyaXB0aW9uJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bignZmFzdCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maW5kKCd0ZXh0YXJlYScpLnZhbCh1aS5pdGVtLmRlc2NyaXB0aW9uKTtcclxuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmb2N1czogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGluaXRQcm9maWxlRGF0YSgpO1xyXG4gICAgYy5maW5kKCcjd2VsY29tZXBvcHVwTG9hZGluZycpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIEFjdGlvbnNcclxuICAgIGMub24oJ2NoYW5nZScsICcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWRhdGEgbGk6bm90KC4nICsgdGhpcy52YWx1ZSArICcpJykuaGlkZSgpO1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlLCBoZWFkZXIgLnByZXNlbnRhdGlvbicpLnNsaWRlVXAoJ2Zhc3QnKTtcclxuICAgICAgICBjLmZpbmQoJy50ZXJtcywgLnByb2ZpbGUtZGF0YScpLnNsaWRlRG93bignZmFzdCcpO1xyXG4gICAgICAgIC8vIFRlcm1zIG9mIHVzZSBkaWZmZXJlbnQgZm9yIHByb2ZpbGUgdHlwZVxyXG4gICAgICAgIGlmICh0aGlzLnZhbHVlID09ICdjdXN0b21lcicpXHJcbiAgICAgICAgICAgIGMuZmluZCgnYS50ZXJtcy1vZi11c2UnKS5kYXRhKCd0b29sdGlwLXVybCcsIG51bGwpO1xyXG4gICAgICAgIC8vIENoYW5nZSBmYWNlYm9vayByZWRpcmVjdCBsaW5rXHJcbiAgICAgICAgdmFyIGZiYyA9IGMuZmluZCgnLmZhY2Vib29rLWNvbm5lY3QnKTtcclxuICAgICAgICB2YXIgYWRkUmVkaXJlY3QgPSAnY3VzdG9tZXJzJztcclxuICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSAncHJvdmlkZXInKVxyXG4gICAgICAgICAgICBhZGRSZWRpcmVjdCA9ICdwcm92aWRlcnMnO1xyXG4gICAgICAgIGZiYy5kYXRhKCdyZWRpcmVjdCcsIGZiYy5kYXRhKCdyZWRpcmVjdCcpICsgYWRkUmVkaXJlY3QpO1xyXG4gICAgICAgIGZiYy5kYXRhKCdwcm9maWxlJywgdGhpcy52YWx1ZSk7XHJcblxyXG4gICAgICAgIC8vIFNldCB2YWxpZGF0aW9uLXJlcXVpcmVkIGZvciBkZXBlbmRpbmcgb2YgcHJvZmlsZS10eXBlIGZvcm0gZWxlbWVudHM6XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpLicgKyB0aGlzLnZhbHVlICsgJyBpbnB1dDpub3QoW2RhdGEtdmFsXSk6bm90KFt0eXBlPWhpZGRlbl0pJylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cignZGF0YS12YWwtcmVxdWlyZWQnLCAnJylcclxuICAgICAgICAgICAgICAgICAgICAuYXR0cignZGF0YS12YWwnLCB0cnVlKTtcclxuICAgICAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxuICAgIH0pO1xyXG4gICAgYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGluaXRQcm9maWxlRGF0YSgpO1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV06Y2hlY2tlZCcpLmNoYW5nZSgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSWYgcHJvZmlsZSB0eXBlIGlzIHByZWZpbGxlZCBieSByZXF1ZXN0OlxyXG4gICAgYy5maW5kKCcucHJvZmlsZS1jaG9pY2UgW25hbWU9cHJvZmlsZS10eXBlXTpjaGVja2VkJykuY2hhbmdlKCk7XHJcbn07XHJcbiJdfQ==
