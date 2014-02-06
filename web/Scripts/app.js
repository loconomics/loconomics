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
},{"./LcUrl":5,"./blockPresets":26,"./loader":52,"./popup":58,"./redirectTo":60}],5:[function(require,module,exports){
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
},{"./mathUtils":53}],7:[function(require,module,exports){
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
},{"./jquery.reload":48}],11:[function(require,module,exports){
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

},{"./changesNotification":"f5kckb","./smoothBoxBlock":"KQGzNM"}],12:[function(require,module,exports){
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
},{"./jquery.hasScrollBar":45}],13:[function(require,module,exports){
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
},{"./ajaxCallbacks":20,"./blockPresets":26,"./changesNotification":"f5kckb","./popup":58,"./redirectTo":60,"./validationHelper":"kqf9lt"}],"rqZkA9":[function(require,module,exports){
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

},{"./TimeSpan":"rqZkA9","./mathUtils":53}],"LC/TimeSpanExtra":[function(require,module,exports){
module.exports=require('5OLBBz');
},{}],19:[function(require,module,exports){
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

},{"./TimeSpan":"rqZkA9","./mathUtils":53,"./tooltips":"UTsC2v"}],20:[function(require,module,exports){
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
},{"./changesNotification":"f5kckb","./createIframe":29,"./moveFocusTo":"9RKOGW","./popup":58,"./redirectTo":60,"./smoothBoxBlock":"KQGzNM","./validationHelper":"kqf9lt"}],21:[function(require,module,exports){
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
},{"./ajaxCallbacks":20,"./blockPresets":26,"./changesNotification":"f5kckb","./validationHelper":"kqf9lt"}],22:[function(require,module,exports){
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
},{"./numberUtils":56}],23:[function(require,module,exports){
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
},{}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){
/**
  AvailabilityCalendar Module
**/
var $ = require('jquery'),
  dateISO = require('LC/dateISO8601');

var classes = {
  calendar: 'AvailabilityCalendar',
  loading: 'is-loading',
  preloading: 'is-preloading',
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

var statusTypes = ['unavailable', 'available'];

var defaults = {
  classes: classes,
  dataSourceUrl: '/calendar/get-availability/',
};

function on(selector, options) {
  options = $.extend(true, {}, defaults, options);
  selector = selector || '.' + options.classes.calendar;

  $(selector).each(function () {
    var calendar = $(this);
    var user = calendar.data('calendar-user');
    var dataSourceUrl = calendar.data('source-url') || options.dataSourceUrl;
    var dataSource = calendar.data('source') || {};
    if (typeof(dataSource) == 'string')
      dataSource = JSON.parse(dataSource);

    function fetchData(start, end, preloading) {
      var fetchStateClass = preloading ? options.classes.preloading : options.classes.loading;
      calendar.addClass(fetchStateClass);
      return $.getJSON(dataSourceUrl,
        {
          user: user,
          start: dateISO.datetimeLocal(start, true),
          end: dateISO.datetimeLocal(end, true)
        },
        function(data){
          if (data && data.Code === 0) {
            $.extend(true, dataSource, data.Result);
            calendar.removeClass(fetchStateClass);
          } else {
            // TODO Manage error
            if (console && console.error) console.error('AvailabilityCalendar fetch data error %o', data);
          }
        }
      );
    }

    // Fetch current week
    var start = getFirstWeekDate(new Date()),
        end = getLastWeekDate(new Date());

    var request = fetchData(start, end).done(function(){
      bindData(calendar, dataSource, options, start, end);
      // Prefetching 3 weeks in advance
      request = fetchData(addDays(start, 7), addDays(end, 21), true);
    });
    checkCurrentWeek(calendar, start, options);

    function moveBindRangeInDays(days) {
      var
        start = addDays( calendar.data('calendar-start-date'), days ),
        end = addDays( calendar.data('calendar-end-date'), days );

      // Support for prefetching:
      if (request && request.status != 200) {
        // Wait for the fetch to perform and sets loading to notify user
        calendar.addClass(options.classes.loading);
        request.done(function(){
          moveBindRangeInDays(days);
          calendar.removeClass(options.classes.loading);
        });
        return;
      }

      // Check cache: if there is almost one date in the range
      // without data, we set inCache as false and fetch the data:
      var inCache = true;
      eachDateInRange(start, end, function(date) {
        var datekey = dateISO.dateLocal(date, true);
        if (!dataSource.slots[datekey]) {
          inCache = false;
          return false;
        }
      });

      if (inCache)
        // Just show the data
        bindData(calendar, dataSource, options, start, end);
      else
        // Fetch (download) the data and show on ready:
        fetchData(start, end).done(function(){
          bindData(calendar, dataSource, options, start, end);
        });
    }

    calendar.on('click', '.' + options.classes.prevAction, function prev(){
      moveBindRangeInDays(-7);
    });

    calendar.on('click', '.' + options.classes.nextAction, function next(){
      moveBindRangeInDays(7);
    });
  });
}

function bindData(calendar, dataSource, options, start, end) {
  var slotsContainer = calendar.find('.' + options.classes.slots),
    slots = slotsContainer.find('td');

  // Save the date range being showed in the calendar instance
  calendar.data('calendar-start-date', start);
  calendar.data('calendar-end-date', end);

  checkCurrentWeek(calendar, start, options);

  updateLabels(calendar, options);

  // Remove any previous status class from all slots
  for (var s = 0; s < statusTypes.length; s++) {
    slots.removeClass( options.classes.slotStatusPrefix + statusTypes[s] );
  }

  // Set all slots with default status
  slots.addClass( options.classes.slotStatusPrefix + dataSource.defaultStatus );

  eachDateInRange(start, end, function(date, i) {
    var datekey = dateISO.dateLocal(date, true);
    var dateSlots = dataSource.slots[datekey];
    if (dateSlots) {
      for (s = 0; s < dateSlots.length; s++) {
        var slot = dateSlots[s];
        var slotCell = findSlotCell(slotsContainer, i, slot);
        // Remove default status
        slotCell.removeClass( options.classes.slotStatusPrefix + dataSource.defaultStatus );
        // Adding status class
        slotCell.addClass( options.classes.slotStatusPrefix + dataSource.status );
      }
    }
  });
}

function updateLabels(calendar, options) {
  var start = calendar.data('calendar-start-date'),
      end = calendar.data('calendar-end-date');

  // TODO
}

function findSlotCell(slotsContainer, day, slot) {
  slot = dateISO.parse(slot);
  var
    x = Math.round( slot.getHours() ),
    // Time frames (slots) are 15 minutes divisions
    y = Math.round( slot.getMinutes() / 15 ),
    tr = slotsContainer.children(':eq(' + Math.round( x * 4 + y ) + ')' );
  
  // Slot cell for o'clock hours is at 1 position offset
  // because of the row-head cell
  var dayOffset = ( y === 0 ? day + 1 : day );
  return tr.children(':eq(' + dayOffset + ')');
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

function getFirstWeekDate(date) {
  var d = new Date(date);
  d.setDate( d.getDate() - d.getDay() );
  return d;
}

function getLastWeekDate(date) {
  var d = new Date(date);
  d.setDate( d.getDate() + (7 - d.getDay()) );
  return d;
}

function isInCurrentWeek(date) {
  return dateISO.dateLocal(getFirstWeekDate(date)) == dateISO.dateLocal(getFirstWeekDate(new Date()));
}

function addDays(date, days) {
  var d = new Date(date);
  d.setDate( d.getDate() + days );
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

// Public API:
exports.defaults = defaults;
exports.on = on;
},{"LC/dateISO8601":"0dIKTs"}],26:[function(require,module,exports){
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
},{"./getXPath":37,"./jqueryUtils":"7/CV3J"}],"LC/changesNotification":[function(require,module,exports){
module.exports=require('f5kckb');
},{}],29:[function(require,module,exports){
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


},{}],30:[function(require,module,exports){
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

},{"./changesNotification":"f5kckb","./getText":"qf5Iz3","./jquery.xtsh":49,"./smoothBoxBlock":"KQGzNM"}],"LC/dateISO8601":[function(require,module,exports){
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
},{}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
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
},{}],37:[function(require,module,exports){
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

},{"./loader":52}],40:[function(require,module,exports){
/* GUID Generator
 */
module.exports = function guidGenerator() {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
};
},{}],41:[function(require,module,exports){
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
},{}],42:[function(require,module,exports){
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
},{}],43:[function(require,module,exports){
/* Returns true when str is
- null
- empty string
- only white spaces string
*/
module.exports = function isEmptyString(str) {
    return !(/\S/g.test(str || ""));
};
},{}],44:[function(require,module,exports){
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
},{}],45:[function(require,module,exports){
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
},{}],46:[function(require,module,exports){
/** Checks if current element or one of the current set of elements has
a parent that match the element or expression given as first parameter
**/
var $ = jQuery || require('jquery');
$.fn.isChildOf = function jQuery_plugin_isChildOf(exp) {
    return this.parents().filter(exp).length > 0;
};
},{}],47:[function(require,module,exports){
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
},{}],48:[function(require,module,exports){
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
},{"./smoothBoxBlock":"KQGzNM"}],49:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
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
},{}],53:[function(require,module,exports){
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
},{}],56:[function(require,module,exports){
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
},{"./i18n":42,"./mathUtils":53}],57:[function(require,module,exports){
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
},{}],58:[function(require,module,exports){
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
},{"./createIframe":29,"./moveFocusTo":"9RKOGW","./smoothBoxBlock":"KQGzNM"}],59:[function(require,module,exports){
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
},{}],60:[function(require,module,exports){
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

},{}],61:[function(require,module,exports){
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
},{"./autoFocus":23,"./jquery.xtsh":49,"./jqueryUtils":"7/CV3J","./moveFocusTo":"9RKOGW"}],"LC/tooltips":[function(require,module,exports){
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

},{"./jquery.isChildOf":46,"./jquery.outerHtml":47,"./sanitizeWhitespaces":61}],66:[function(require,module,exports){
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
},{}],69:[function(require,module,exports){
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
},{}],70:[function(require,module,exports){
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
  availabilityCalendar.on();

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
},{"../LC/Array.remove":1,"../LC/Cookie":2,"../LC/LcUrl":5,"../LC/Price":6,"../LC/String.prototype.contains":7,"../LC/StringFormat":"KqXDvj","../LC/TabbedUX":12,"../LC/TabbedUX.autoload":10,"../LC/TabbedUX.changesNotification":11,"../LC/TabbedUX.sliderTabs":13,"../LC/TabbedUX.wizard":14,"../LC/TimeSpan":"rqZkA9","../LC/TimeSpanExtra":"5OLBBz","../LC/UISliderLabels":19,"../LC/ajaxCallbacks":20,"../LC/ajaxForms":21,"../LC/autoCalculate":22,"../LC/autoFocus":23,"../LC/autofillSubmenu":24,"../LC/availabilityCalendar":25,"../LC/blockPresets":26,"../LC/changesNotification":"f5kckb","../LC/crudl":30,"../LC/datePicker":33,"../LC/dateToInterchangeableString":34,"../LC/getText":"qf5Iz3","../LC/getXPath":37,"../LC/googleMapReady":"ygr/Yz","../LC/guidGenerator":40,"../LC/hasConfirmSupport":41,"../LC/i18n":42,"../LC/isEmptyString":43,"../LC/jquery.are":44,"../LC/jquery.hasScrollBar":45,"../LC/jquery.reload":48,"../LC/jquery.xtsh":49,"../LC/jqueryUtils":"7/CV3J","../LC/loader":52,"../LC/mathUtils":53,"../LC/moveFocusTo":"9RKOGW","../LC/numberUtils":56,"../LC/placeholder-polyfill":57,"../LC/popup":58,"../LC/postalCodeServerValidation":59,"../LC/sanitizeWhitespaces":61,"../LC/smoothBoxBlock":"KQGzNM","../LC/tooltips":"UTsC2v","../LC/urlUtils":66,"../LC/validationHelper":"kqf9lt","./accountPopups":69,"./availabilityCalendarWidget":71,"./faqsPopups":72,"./home":73,"./legalPopups":74,"./welcomePopup":75}],71:[function(require,module,exports){
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
},{"../LC/dateToInterchangeableString":34,"../LC/jquery.reload":48,"../LC/smoothBoxBlock":"KQGzNM"}],72:[function(require,module,exports){
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
},{}],73:[function(require,module,exports){
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
},{}],74:[function(require,module,exports){
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
},{}],75:[function(require,module,exports){
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

},{}]},{},[70,"cwp+TC","0dIKTs"])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0FycmF5LnJlbW92ZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9Db29raWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvRmFjZWJvb2tDb25uZWN0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0xjVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1ByaWNlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1N0cmluZy5wcm90b3R5cGUuY29udGFpbnMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvU3RyaW5nRm9ybWF0LmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmF1dG9sb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGFiYmVkVVguc2xpZGVyVGFicy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9UYWJiZWRVWC53aXphcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW4uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvVGltZVNwYW5FeHRyYS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9VSVNsaWRlckxhYmVscy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hamF4Q2FsbGJhY2tzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2FqYXhGb3Jtcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvQ2FsY3VsYXRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2F1dG9Gb2N1cy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvZmlsbFN1Ym1lbnUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYmxvY2tQcmVzZXRzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NoYW5nZXNOb3RpZmljYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvY3JlYXRlSWZyYW1lLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVJU084NjAxLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2RhdGVQaWNrZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZGF0ZVRvSW50ZXJjaGFuZ2VhYmxlU3RyaW5nLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2dldFRleHQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ29vZ2xlTWFwUmVhZHkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ3VpZEdlbmVyYXRvci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9oYXNDb25maXJtU3VwcG9ydC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9pMThuLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2lzRW1wdHlTdHJpbmcuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5LmFyZS5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkuaGFzU2Nyb2xsQmFyLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS5pc0NoaWxkT2YuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lm91dGVySHRtbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9qcXVlcnkucmVsb2FkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeS54dHNoLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2pxdWVyeVV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL2xvYWRlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9tYXRoVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbnVtYmVyVXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcGxhY2Vob2xkZXItcG9seWZpbGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9zdGFsQ29kZVNlcnZlclZhbGlkYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zYW5pdGl6ZVdoaXRlc3BhY2VzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Ntb290aEJveEJsb2NrLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3Rvb2x0aXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3VybFV0aWxzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL3ZhbGlkYXRpb25IZWxwZXIuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FjY291bnRQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2FwcC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2ZhcXNQb3B1cHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2hvbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2xlZ2FsUG9wdXBzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC93ZWxjb21lUG9wdXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDaklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBBcnJheSBSZW1vdmUgLSBCeSBKb2huIFJlc2lnIChNSVQgTGljZW5zZWQpXHJcbi8qQXJyYXkucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChmcm9tLCB0bykge1xyXG5JYWdvU1JMOiBpdCBzZWVtcyBpbmNvbXBhdGlibGUgd2l0aCBNb2Rlcm5penIgbG9hZGVyIGZlYXR1cmUgbG9hZGluZyBaZW5kZXNrIHNjcmlwdCxcclxubW92ZWQgZnJvbSBwcm90b3R5cGUgdG8gYSBjbGFzcy1zdGF0aWMgbWV0aG9kICovXHJcbmZ1bmN0aW9uIGFycmF5UmVtb3ZlKGFuQXJyYXksIGZyb20sIHRvKSB7XHJcbiAgICB2YXIgcmVzdCA9IGFuQXJyYXkuc2xpY2UoKHRvIHx8IGZyb20pICsgMSB8fCBhbkFycmF5Lmxlbmd0aCk7XHJcbiAgICBhbkFycmF5Lmxlbmd0aCA9IGZyb20gPCAwID8gYW5BcnJheS5sZW5ndGggKyBmcm9tIDogZnJvbTtcclxuICAgIHJldHVybiBhbkFycmF5LnB1c2guYXBwbHkoYW5BcnJheSwgcmVzdCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhcnJheVJlbW92ZTtcclxufSBlbHNlIHtcclxuICAgIEFycmF5LnJlbW92ZSA9IGFycmF5UmVtb3ZlO1xyXG59IiwiLyoqXHJcbiogQ29va2llcyBtYW5hZ2VtZW50LlxyXG4qIE1vc3QgY29kZSBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQ4MjU2OTUvMTYyMjM0NlxyXG4qL1xyXG52YXIgQ29va2llID0ge307XHJcblxyXG5Db29raWUuc2V0ID0gZnVuY3Rpb24gc2V0Q29va2llKG5hbWUsIHZhbHVlLCBkYXlzKSB7XHJcbiAgICB2YXIgZXhwaXJlcyA9IFwiXCI7XHJcbiAgICBpZiAoZGF5cykge1xyXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcclxuICAgICAgICBkYXRlLnNldFRpbWUoZGF0ZS5nZXRUaW1lKCkgKyAoZGF5cyAqIDI0ICogNjAgKiA2MCAqIDEwMDApKTtcclxuICAgICAgICBleHBpcmVzID0gXCI7IGV4cGlyZXM9XCIgKyBkYXRlLnRvR01UU3RyaW5nKCk7XHJcbiAgICB9XHJcbiAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsgXCI9XCIgKyB2YWx1ZSArIGV4cGlyZXMgKyBcIjsgcGF0aD0vXCI7XHJcbn07XHJcbkNvb2tpZS5nZXQgPSBmdW5jdGlvbiBnZXRDb29raWUoY19uYW1lKSB7XHJcbiAgICBpZiAoZG9jdW1lbnQuY29va2llLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBjX3N0YXJ0ID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoY19uYW1lICsgXCI9XCIpO1xyXG4gICAgICAgIGlmIChjX3N0YXJ0ICE9IC0xKSB7XHJcbiAgICAgICAgICAgIGNfc3RhcnQgPSBjX3N0YXJ0ICsgY19uYW1lLmxlbmd0aCArIDE7XHJcbiAgICAgICAgICAgIGNfZW5kID0gZG9jdW1lbnQuY29va2llLmluZGV4T2YoXCI7XCIsIGNfc3RhcnQpO1xyXG4gICAgICAgICAgICBpZiAoY19lbmQgPT0gLTEpIHtcclxuICAgICAgICAgICAgICAgIGNfZW5kID0gZG9jdW1lbnQuY29va2llLmxlbmd0aDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gdW5lc2NhcGUoZG9jdW1lbnQuY29va2llLnN1YnN0cmluZyhjX3N0YXJ0LCBjX2VuZCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBcIlwiO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBDb29raWU7IiwiLyoqIENvbm5lY3QgYWNjb3VudCB3aXRoIEZhY2Vib29rXHJcbioqL1xyXG52YXJcclxuICAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgbG9hZGVyID0gcmVxdWlyZSgnLi9sb2FkZXInKSxcclxuICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpLFxyXG4gIExjVXJsID0gcmVxdWlyZSgnLi9MY1VybCcpLFxyXG4gIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbmZ1bmN0aW9uIEZhY2Vib29rQ29ubmVjdChvcHRpb25zKSB7XHJcbiAgJC5leHRlbmQodGhpcywgb3B0aW9ucyk7XHJcbiAgaWYgKCEkKCcjZmItcm9vdCcpLmxlbmd0aClcclxuICAgICQoJzxkaXYgaWQ9XCJmYi1yb290XCIgc3R5bGU9XCJkaXNwbGF5OiBub25lXCI+PC9kaXY+JykuYXBwZW5kVG8oJ2JvZHknKTtcclxufVxyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZSA9IHtcclxuICBhcHBJZDogbnVsbCxcclxuICBsYW5nOiAnZW5fVVMnLFxyXG4gIHJlc3VsdFR5cGU6ICdqc29uJywgLy8gJ3JlZGlyZWN0J1xyXG4gIGZiVXJsQmFzZTogJy8vY29ubmVjdC5mYWNlYm9vay5uZXQvQChsYW5nKS9hbGwuanMnLFxyXG4gIHNlcnZlclVybEJhc2U6IExjVXJsLkxhbmdQYXRoICsgJ0FjY291bnQvRmFjZWJvb2svQCh1cmxTZWN0aW9uKS8/UmVkaXJlY3Q9QChyZWRpcmVjdFVybCkmcHJvZmlsZT1AKHByb2ZpbGVVcmwpJyxcclxuICByZWRpcmVjdFVybDogJycsXHJcbiAgcHJvZmlsZVVybDogJycsXHJcbiAgdXJsU2VjdGlvbjogJycsXHJcbiAgbG9hZGluZ1RleHQ6ICdWZXJpZmluZycsXHJcbiAgcGVybWlzc2lvbnM6ICcnLFxyXG4gIGxpYkxvYWRlZEV2ZW50OiAnRmFjZWJvb2tDb25uZWN0TGliTG9hZGVkJyxcclxuICBjb25uZWN0ZWRFdmVudDogJ0ZhY2Vib29rQ29ubmVjdENvbm5lY3RlZCdcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuZ2V0RmJVcmwgPSBmdW5jdGlvbigpIHtcclxuICByZXR1cm4gdGhpcy5mYlVybEJhc2UucmVwbGFjZSgvQFxcKGxhbmdcXCkvZywgdGhpcy5sYW5nKTtcclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUuZ2V0U2VydmVyVXJsID0gZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHRoaXMuc2VydmVyVXJsQmFzZVxyXG4gIC5yZXBsYWNlKC9AXFwocmVkaXJlY3RVcmxcXCkvZywgdGhpcy5yZWRpcmVjdFVybClcclxuICAucmVwbGFjZSgvQFxcKHByb2ZpbGVVcmxcXCkvZywgdGhpcy5wcm9maWxlVXJsKVxyXG4gIC5yZXBsYWNlKC9AXFwodXJsU2VjdGlvblxcKS9nLCB0aGlzLnVybFNlY3Rpb24pO1xyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5sb2FkTGliID0gZnVuY3Rpb24gKCkge1xyXG4gIC8vIE9ubHkgaWYgaXMgbm90IGxvYWRlZCBzdGlsbFxyXG4gIC8vIChGYWNlYm9vayBzY3JpcHQgYXR0YWNoIGl0c2VsZiBhcyB0aGUgZ2xvYmFsIHZhcmlhYmxlICdGQicpXHJcbiAgaWYgKCF3aW5kb3cuRkIgJiYgIXRoaXMuX2xvYWRpbmdMaWIpIHtcclxuICAgIHRoaXMuX2xvYWRpbmdMaWIgPSB0cnVlO1xyXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgbG9hZGVyLmxvYWQoe1xyXG4gICAgICBzY3JpcHRzOiBbdGhpcy5nZXRGYlVybCgpXSxcclxuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBGQi5pbml0KHsgYXBwSWQ6IHRoYXQuYXBwSWQsIHN0YXR1czogdHJ1ZSwgY29va2llOiB0cnVlLCB4ZmJtbDogdHJ1ZSB9KTtcclxuICAgICAgICB0aGF0LmxvYWRpbmdMaWIgPSBmYWxzZTtcclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKHRoYXQubGliTG9hZGVkRXZlbnQpO1xyXG4gICAgICB9LFxyXG4gICAgICBjb21wbGV0ZVZlcmlmaWNhdGlvbjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAhIXdpbmRvdy5GQjtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5wcm9jZXNzUmVzcG9uc2UgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuICBpZiAocmVzcG9uc2UuYXV0aFJlc3BvbnNlKSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IFdlbGNvbWUhJyk7XHJcbiAgICB2YXIgdXJsID0gdGhpcy5nZXRTZXJ2ZXJVcmwoKTtcclxuICAgIGlmICh0aGlzLnJlc3VsdFR5cGUgPT0gXCJyZWRpcmVjdFwiKSB7XHJcbiAgICAgIHJlZGlyZWN0VG8odXJsKTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5yZXN1bHRUeXBlID09IFwianNvblwiKSB7XHJcbiAgICAgIHBvcHVwKHVybCwgJ3NtYWxsJywgbnVsbCwgdGhpcy5sb2FkaW5nVGV4dCk7XHJcbiAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIodGhpcy5jb25uZWN0ZWRFdmVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgLypGQi5hcGkoJy9tZScsIGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgY29uc29sZS5sb2coJ0ZhY2Vib29rQ29ubmVjdDogR29vZCB0byBzZWUgeW91LCAnICsgcmVzcG9uc2UubmFtZSArICcuJyk7XHJcbiAgICB9KTsqL1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvL2NvbnNvbGUubG9nKCdGYWNlYm9va0Nvbm5lY3Q6IFVzZXIgY2FuY2VsbGVkIGxvZ2luIG9yIGRpZCBub3QgZnVsbHkgYXV0aG9yaXplLicpO1xyXG4gIH1cclxufTtcclxuXHJcbkZhY2Vib29rQ29ubmVjdC5wcm90b3R5cGUub25MaWJSZWFkeSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gIGlmICh3aW5kb3cuRkIpXHJcbiAgICBjYWxsYmFjaygpO1xyXG4gIGVsc2Uge1xyXG4gICAgdGhpcy5sb2FkTGliKCk7XHJcbiAgICAkKGRvY3VtZW50KS5vbih0aGlzLmxpYkxvYWRlZEV2ZW50LCBjYWxsYmFjayk7XHJcbiAgfVxyXG59O1xyXG5cclxuRmFjZWJvb2tDb25uZWN0LnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB0aGlzLm9uTGliUmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgRkIubG9naW4oJC5wcm94eSh0aGF0LnByb2Nlc3NSZXNwb25zZSwgdGhhdCksIHsgc2NvcGU6IHRoYXQucGVybWlzc2lvbnMgfSk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5GYWNlYm9va0Nvbm5lY3QucHJvdG90eXBlLmF1dG9Db25uZWN0T24gPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdjbGljaycsIHNlbGVjdG9yIHx8ICdhLmZhY2Vib29rLWNvbm5lY3QnLCAkLnByb3h5KHRoaXMuY29ubmVjdCwgdGhpcykpO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBGYWNlYm9va0Nvbm5lY3Q7IiwiLyoqIEltcGxlbWVudHMgYSBzaW1pbGFyIExjVXJsIG9iamVjdCBsaWtlIHRoZSBzZXJ2ZXItc2lkZSBvbmUsIGJhc2luZ1xyXG4gICAgaW4gdGhlIGluZm9ybWF0aW9uIGF0dGFjaGVkIHRvIHRoZSBkb2N1bWVudCBhdCAnaHRtbCcgdGFnIGluIHRoZSBcclxuICAgICdkYXRhLWJhc2UtdXJsJyBhdHRyaWJ1dGUgKHRoYXRzIHZhbHVlIGlzIHRoZSBlcXVpdmFsZW50IGZvciBBcHBQYXRoKSxcclxuICAgIGFuZCB0aGUgbGFuZyBpbmZvcm1hdGlvbiBhdCAnZGF0YS1jdWx0dXJlJy5cclxuICAgIFRoZSByZXN0IG9mIFVSTHMgYXJlIGJ1aWx0IGZvbGxvd2luZyB0aGUgd2luZG93LmxvY2F0aW9uIGFuZCBzYW1lIHJ1bGVzXHJcbiAgICB0aGFuIGluIHRoZSBzZXJ2ZXItc2lkZSBvYmplY3QuXHJcbioqL1xyXG5cclxudmFyIGJhc2UgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWJhc2UtdXJsJyksXHJcbiAgICBsYW5nID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1jdWx0dXJlJyksXHJcbiAgICBsID0gd2luZG93LmxvY2F0aW9uLFxyXG4gICAgdXJsID0gbC5wcm90b2NvbCArICcvLycgKyBsLmhvc3Q7XHJcbi8vIGxvY2F0aW9uLmhvc3QgaW5jbHVkZXMgcG9ydCwgaWYgaXMgbm90IHRoZSBkZWZhdWx0LCB2cyBsb2NhdGlvbi5ob3N0bmFtZVxyXG5cclxuYmFzZSA9IGJhc2UgfHwgJy8nO1xyXG5cclxudmFyIExjVXJsID0ge1xyXG4gICAgU2l0ZVVybDogdXJsLFxyXG4gICAgQXBwUGF0aDogYmFzZSxcclxuICAgIEFwcFVybDogdXJsICsgYmFzZSxcclxuICAgIExhbmdJZDogbGFuZyxcclxuICAgIExhbmdQYXRoOiBiYXNlICsgbGFuZyArICcvJyxcclxuICAgIExhbmdVcmw6IHVybCArIGJhc2UgKyBsYW5nXHJcbn07XHJcbkxjVXJsLkxhbmdVcmwgPSB1cmwgKyBMY1VybC5MYW5nUGF0aDtcclxuTGNVcmwuSnNvblBhdGggPSBMY1VybC5MYW5nUGF0aCArICdKU09OLyc7XHJcbkxjVXJsLkpzb25VcmwgPSB1cmwgKyBMY1VybC5Kc29uUGF0aDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTGNVcmw7IiwiLyogTG9jb25vbWljcyBzcGVjaWZpYyBQcmljZSwgZmVlcyBhbmQgaG91ci1wcmljZSBjYWxjdWxhdGlvblxyXG4gICAgdXNpbmcgc29tZSBzdGF0aWMgbWV0aG9kcyBhbmQgdGhlIFByaWNlIGNsYXNzLlxyXG4qL1xyXG52YXIgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpO1xyXG5cclxuLyogQ2xhc3MgUHJpY2UgdG8gY2FsY3VsYXRlIGEgdG90YWwgcHJpY2UgYmFzZWQgb24gZmVlcyBpbmZvcm1hdGlvbiAoZml4ZWQgYW5kIHJhdGUpXHJcbiAgICBhbmQgZGVzaXJlZCBkZWNpbWFscyBmb3IgYXBwcm94aW1hdGlvbnMuXHJcbiovXHJcbmZ1bmN0aW9uIFByaWNlKGJhc2VQcmljZSwgZmVlLCByb3VuZGVkRGVjaW1hbHMpIHtcclxuICAgIC8vIGZlZSBwYXJhbWV0ZXIgY2FuIGJlIGEgZmxvYXQgbnVtYmVyIHdpdGggdGhlIGZlZVJhdGUgb3IgYW4gb2JqZWN0XHJcbiAgICAvLyB0aGF0IGluY2x1ZGVzIGJvdGggYSBmZWVSYXRlIGFuZCBhIGZpeGVkRmVlQW1vdW50XHJcbiAgICAvLyBFeHRyYWN0aW5nIGZlZSB2YWx1ZXMgaW50byBsb2NhbCB2YXJzOlxyXG4gICAgdmFyIGZlZVJhdGUgPSAwLCBmaXhlZEZlZUFtb3VudCA9IDA7XHJcbiAgICBpZiAoZmVlLmZpeGVkRmVlQW1vdW50IHx8IGZlZS5mZWVSYXRlKSB7XHJcbiAgICAgICAgZml4ZWRGZWVBbW91bnQgPSBmZWUuZml4ZWRGZWVBbW91bnQgfHwgMDtcclxuICAgICAgICBmZWVSYXRlID0gZmVlLmZlZVJhdGUgfHwgMDtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGZlZVJhdGUgPSBmZWU7XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRpbmc6XHJcbiAgICAvLyBUaGUgcm91bmRUbyB3aXRoIGEgYmlnIGZpeGVkIGRlY2ltYWxzIGlzIHRvIGF2b2lkIHRoZVxyXG4gICAgLy8gZGVjaW1hbCBlcnJvciBvZiBmbG9hdGluZyBwb2ludCBudW1iZXJzXHJcbiAgICB2YXIgdG90YWxQcmljZSA9IG11LmNlaWxUbyhtdS5yb3VuZFRvKGJhc2VQcmljZSAqICgxICsgZmVlUmF0ZSkgKyBmaXhlZEZlZUFtb3VudCwgMTIpLCByb3VuZGVkRGVjaW1hbHMpO1xyXG4gICAgLy8gZmluYWwgZmVlIHByaWNlIGlzIGNhbGN1bGF0ZWQgYXMgYSBzdWJzdHJhY3Rpb24sIGJ1dCBiZWNhdXNlIGphdmFzY3JpcHQgaGFuZGxlc1xyXG4gICAgLy8gZmxvYXQgbnVtYmVycyBvbmx5LCBhIHJvdW5kIG9wZXJhdGlvbiBpcyByZXF1aXJlZCB0byBhdm9pZCBhbiBpcnJhdGlvbmFsIG51bWJlclxyXG4gICAgdmFyIGZlZVByaWNlID0gbXUucm91bmRUbyh0b3RhbFByaWNlIC0gYmFzZVByaWNlLCAyKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBvYmplY3Qgd2l0aCBmdWxsIGRldGFpbHM6XHJcbiAgICB0aGlzLmJhc2VQcmljZSA9IGJhc2VQcmljZTtcclxuICAgIHRoaXMuZmVlUmF0ZSA9IGZlZVJhdGU7XHJcbiAgICB0aGlzLmZpeGVkRmVlQW1vdW50ID0gZml4ZWRGZWVBbW91bnQ7XHJcbiAgICB0aGlzLnJvdW5kZWREZWNpbWFscyA9IHJvdW5kZWREZWNpbWFscztcclxuICAgIHRoaXMudG90YWxQcmljZSA9IHRvdGFsUHJpY2U7XHJcbiAgICB0aGlzLmZlZVByaWNlID0gZmVlUHJpY2U7XHJcbn1cclxuXHJcbi8qKiBDYWxjdWxhdGUgYW5kIHJldHVybnMgdGhlIHByaWNlIGFuZCByZWxldmFudCBkYXRhIGFzIGFuIG9iamVjdCBmb3JcclxudGltZSwgaG91cmx5UmF0ZSAod2l0aCBmZWVzKSBhbmQgdGhlIGhvdXJseUZlZS5cclxuVGhlIHRpbWUgKEBkdXJhdGlvbikgaXMgdXNlZCAnYXMgaXMnLCB3aXRob3V0IHRyYW5zZm9ybWF0aW9uLCBtYXliZSB5b3UgY2FuIHJlcXVpcmVcclxudXNlIExDLnJvdW5kVGltZVRvUXVhcnRlckhvdXIgYmVmb3JlIHBhc3MgdGhlIGR1cmF0aW9uIHRvIHRoaXMgZnVuY3Rpb24uXHJcbkl0IHJlY2VpdmVzIHRoZSBwYXJhbWV0ZXJzIEBob3VybHlQcmljZSBhbmQgQHN1cmNoYXJnZVByaWNlIGFzIExDLlByaWNlIG9iamVjdHMuXHJcbkBzdXJjaGFyZ2VQcmljZSBpcyBvcHRpb25hbC5cclxuKiovXHJcbmZ1bmN0aW9uIGNhbGN1bGF0ZUhvdXJseVByaWNlKGR1cmF0aW9uLCBob3VybHlQcmljZSwgc3VyY2hhcmdlUHJpY2UpIHtcclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIHN1cmNoYXJnZSwgZ2V0IHplcm9zXHJcbiAgICBzdXJjaGFyZ2VQcmljZSA9IHN1cmNoYXJnZVByaWNlIHx8IHsgdG90YWxQcmljZTogMCwgZmVlUHJpY2U6IDAsIGJhc2VQcmljZTogMCB9O1xyXG4gICAgLy8gR2V0IGhvdXJzIGZyb20gcm91bmRlZCBkdXJhdGlvbjpcclxuICAgIHZhciBob3VycyA9IG11LnJvdW5kVG8oZHVyYXRpb24udG90YWxIb3VycygpLCAyKTtcclxuICAgIC8vIENhbGN1bGF0ZSBmaW5hbCBwcmljZXNcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdG90YWxQcmljZTogICAgIG11LnJvdW5kVG8oaG91cmx5UHJpY2UudG90YWxQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UudG90YWxQcmljZSAqIGhvdXJzLCAyKSxcclxuICAgICAgICBmZWVQcmljZTogICAgICAgbXUucm91bmRUbyhob3VybHlQcmljZS5mZWVQcmljZSAqIGhvdXJzICsgc3VyY2hhcmdlUHJpY2UuZmVlUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgc3VidG90YWxQcmljZTogIG11LnJvdW5kVG8oaG91cmx5UHJpY2UuYmFzZVByaWNlICogaG91cnMgKyBzdXJjaGFyZ2VQcmljZS5iYXNlUHJpY2UgKiBob3VycywgMiksXHJcbiAgICAgICAgZHVyYXRpb25Ib3VyczogIGhvdXJzXHJcbiAgICB9O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBQcmljZTogUHJpY2UsXHJcbiAgICAgICAgY2FsY3VsYXRlSG91cmx5UHJpY2U6IGNhbGN1bGF0ZUhvdXJseVByaWNlXHJcbiAgICB9OyIsIi8qKiBQb2x5ZmlsbCBmb3Igc3RyaW5nLmNvbnRhaW5zXHJcbioqL1xyXG5pZiAoISgnY29udGFpbnMnIGluIFN0cmluZy5wcm90b3R5cGUpKVxyXG4gICAgU3RyaW5nLnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChzdHIsIHN0YXJ0SW5kZXgpIHsgcmV0dXJuIC0xICE9PSB0aGlzLmluZGV4T2Yoc3RyLCBzdGFydEluZGV4KTsgfTsiLCIvKiogPT09PT09PT09PT09PT09PT09PT09PVxyXG4gKiBBIHNpbXBsZSBTdHJpbmcgRm9ybWF0XHJcbiAqIGZ1bmN0aW9uIGZvciBqYXZhc2NyaXB0XHJcbiAqIEF1dGhvcjogSWFnbyBMb3JlbnpvIFNhbGd1ZWlyb1xyXG4gKiBNb2R1bGU6IENvbW1vbkpTXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHN0cmluZ0Zvcm1hdCgpIHtcclxuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcclxuXHR2YXIgZm9ybWF0dGVkID0gYXJnc1swXTtcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCdcXFxceycraSsnXFxcXH0nLCAnZ2knKTtcclxuXHRcdGZvcm1hdHRlZCA9IGZvcm1hdHRlZC5yZXBsYWNlKHJlZ2V4cCwgYXJnc1tpKzFdKTtcclxuXHR9XHJcblx0cmV0dXJuIGZvcm1hdHRlZDtcclxufTsiLCIvKipcclxuICAgIEdlbmVyYWwgYXV0by1sb2FkIHN1cHBvcnQgZm9yIHRhYnM6IFxyXG4gICAgSWYgdGhlcmUgaXMgbm8gY29udGVudCB3aGVuIGZvY3VzZWQsIHRoZXkgdXNlIHRoZSAncmVsb2FkJyBqcXVlcnkgcGx1Z2luXHJcbiAgICB0byBsb2FkIGl0cyBjb250ZW50IC10YWJzIG5lZWQgdG8gYmUgY29uZmlndXJlZCB3aXRoIGRhdGEtc291cmNlLXVybCBhdHRyaWJ1dGVcclxuICAgIGluIG9yZGVyIHRvIGtub3cgd2hlcmUgdG8gZmV0Y2ggdGhlIGNvbnRlbnQtLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9qcXVlcnkucmVsb2FkJyk7XHJcblxyXG4vLyBEZXBlbmRlbmN5IFRhYmJlZFVYIGZyb20gRElcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKFRhYmJlZFVYKSB7XHJcbiAgICAvLyBUYWJiZWRVWC5zZXR1cC50YWJCb2R5U2VsZWN0b3IgfHwgJy50YWItYm9keSdcclxuICAgICQoJy50YWItYm9keScpLm9uKCd0YWJGb2N1c2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKCR0LmNoaWxkcmVuKCkubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAkdC5yZWxvYWQoKTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4gICAgVGhpcyBhZGRzIG5vdGlmaWNhdGlvbnMgdG8gdGFicyBmcm9tIHRoZSBUYWJiZWRVWCBzeXN0ZW0gdXNpbmdcclxuICAgIHRoZSBjaGFuZ2VzTm90aWZpY2F0aW9uIHV0aWxpdHkgdGhhdCBkZXRlY3RzIG5vdCBzYXZlZCBjaGFuZ2VzIG9uIGZvcm1zLFxyXG4gICAgc2hvd2luZyB3YXJuaW5nIG1lc3NhZ2VzIHRvIHRoZVxyXG4gICAgdXNlciBhbmQgbWFya2luZyB0YWJzIChhbmQgc3ViLXRhYnMgLyBwYXJlbnQtdGFicyBwcm9wZXJseSkgdG9cclxuICAgIGRvbid0IGxvc3QgY2hhbmdlcyBtYWRlLlxyXG4gICAgQSBiaXQgb2YgQ1NTIGZvciB0aGUgYXNzaWduZWQgY2xhc3NlcyB3aWxsIGFsbG93IGZvciB2aXN1YWwgbWFya3MuXHJcblxyXG4gICAgQUtBOiBEb24ndCBsb3N0IGRhdGEhIHdhcm5pbmcgbWVzc2FnZSA7LSlcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKSxcclxuICAgIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxuXHJcbi8vIFRhYmJlZFVYIGRlcGVuZGVuY3kgYXMgRElcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKFRhYmJlZFVYLCB0YXJnZXRTZWxlY3Rvcikge1xyXG4gICAgdmFyIHRhcmdldCA9ICQodGFyZ2V0U2VsZWN0b3IgfHwgJy5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1lbmFibGVkJyk7XHJcbiAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLmluaXQoeyB0YXJnZXQ6IHRhcmdldCB9KTtcclxuXHJcbiAgICAvLyBBZGRpbmcgY2hhbmdlIG5vdGlmaWNhdGlvbiB0byB0YWItYm9keSBkaXZzXHJcbiAgICAvLyAob3V0c2lkZSB0aGUgTEMuQ2hhbmdlc05vdGlmaWNhdGlvbiBjbGFzcyB0byBsZWF2ZSBpdCBhcyBnZW5lcmljIGFuZCBzaW1wbGUgYXMgcG9zc2libGUpXHJcbiAgICAkKHRhcmdldCkub24oJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCAnZm9ybScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKHRoaXMpLnBhcmVudHMoJy50YWItYm9keScpLmFkZENsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFkZGluZyBjbGFzcyB0byB0aGUgbWVudSBpdGVtICh0YWIgdGl0bGUpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtLmFkZENsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgICAgICAuYXR0cigndGl0bGUnLCAkKCcjbGNyZXMtY2hhbmdlcy1ub3Qtc2F2ZWQnKS50ZXh0KCkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAub24oJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgJ2Zvcm0nLCBmdW5jdGlvbiAoZSwgZiwgZWxzLCBmdWxsKSB7XHJcbiAgICAgICAgaWYgKGZ1bGwpXHJcbiAgICAgICAgICAgICQodGhpcykucGFyZW50cygnLnRhYi1ib2R5Om5vdCg6aGFzKGZvcm0uaGFzLWNoYW5nZXMpKScpLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpXHJcbiAgICAgICAgICAgIC5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlbW92aW5nIGNsYXNzIGZyb20gdGhlIG1lbnUgaXRlbSAodGFiIHRpdGxlKVxyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5yZW1vdmVDbGFzcygnaGFzLWNoYW5nZXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hdHRyKCd0aXRsZScsIG51bGwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAvLyBUbyBhdm9pZCB1c2VyIGJlIG5vdGlmaWVkIG9mIGNoYW5nZXMgYWxsIHRpbWUgd2l0aCB0YWIgbWFya3MsIHdlIGFkZGVkIGEgJ25vdGlmeScgY2xhc3NcclxuICAgIC8vIG9uIHRhYnMgd2hlbiBhIGNoYW5nZSBvZiB0YWIgaGFwcGVuc1xyXG4gICAgLmZpbmQoJy50YWItYm9keScpLm9uKCd0YWJVbmZvY3VzZWQnLCBmdW5jdGlvbiAoZXZlbnQsIGZvY3VzZWRDdHgpIHtcclxuICAgICAgICB2YXIgbWkgPSBUYWJiZWRVWC5nZXRUYWJDb250ZXh0KHRoaXMpLm1lbnVpdGVtO1xyXG4gICAgICAgIGlmIChtaS5pcygnLmhhcy1jaGFuZ2VzJykpIHtcclxuICAgICAgICAgICAgbWkuYWRkQ2xhc3MoJ25vdGlmeS1jaGFuZ2VzJyk7IC8vaGFzLXRvb2x0aXBcclxuICAgICAgICAgICAgLy8gU2hvdyBub3RpZmljYXRpb24gcG9wdXBcclxuICAgICAgICAgICAgdmFyIGQgPSAkKCc8ZGl2IGNsYXNzPVwid2FybmluZ1wiPkAwPC9kaXY+PGRpdiBjbGFzcz1cImFjdGlvbnNcIj48aW5wdXQgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYWN0aW9uIGNvbnRpbnVlXCIgdmFsdWU9XCJAMlwiLz48aW5wdXQgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYWN0aW9uIHN0b3BcIiB2YWx1ZT1cIkAxXCIvPjwvZGl2PidcclxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9AMC9nLCBMQy5nZXRUZXh0KCdjaGFuZ2VzLW5vdC1zYXZlZCcpKVxyXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL0AxL2csIExDLmdldFRleHQoJ3RhYi1oYXMtY2hhbmdlcy1zdGF5LW9uJykpXHJcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgvQDIvZywgTEMuZ2V0VGV4dCgndGFiLWhhcy1jaGFuZ2VzLWNvbnRpbnVlLXdpdGhvdXQtY2hhbmdlJykpKTtcclxuICAgICAgICAgICAgZC5vbignY2xpY2snLCAnLnN0b3AnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSh3aW5kb3cpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oJ2NsaWNrJywgJy5jb250aW51ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKHdpbmRvdyk7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgJ2hhcy1jaGFuZ2VzJyB0byBhdm9pZCBmdXR1cmUgYmxvY2tzICh1bnRpbCBuZXcgY2hhbmdlcyBoYXBwZW5zIG9mIGNvdXJzZSA7LSlcclxuICAgICAgICAgICAgICAgIG1pLnJlbW92ZUNsYXNzKCdoYXMtY2hhbmdlcycpO1xyXG4gICAgICAgICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIoZm9jdXNlZEN0eC50YWIuZ2V0KDApKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oZCwgd2luZG93LCAnbm90LXNhdmVkLXBvcHVwJywgeyBjbG9zYWJsZTogZmFsc2UsIGNlbnRlcjogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIEV2ZXIgcmV0dXJuIGZhbHNlIHRvIHN0b3AgY3VycmVudCB0YWIgZm9jdXNcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0aGlzKS5tZW51aXRlbS5yZW1vdmVDbGFzcygnbm90aWZ5LWNoYW5nZXMnKTsgLy9oYXMtdG9vbHRpcFxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qKiBUYWJiZWRVWDogVGFiYmVkIGludGVyZmFjZSBsb2dpYzsgd2l0aCBtaW5pbWFsIEhUTUwgdXNpbmcgY2xhc3MgJ3RhYmJlZCcgZm9yIHRoZVxyXG5jb250YWluZXIsIHRoZSBvYmplY3QgcHJvdmlkZXMgdGhlIGZ1bGwgQVBJIHRvIG1hbmlwdWxhdGUgdGFicyBhbmQgaXRzIHNldHVwXHJcbmxpc3RlbmVycyB0byBwZXJmb3JtIGxvZ2ljIG9uIHVzZXIgaW50ZXJhY3Rpb24uXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi9qcXVlcnkuaGFzU2Nyb2xsQmFyJyk7XHJcblxyXG52YXIgVGFiYmVkVVggPSB7XHJcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJCgnYm9keScpLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMgPiBsaTpub3QoLnRhYnMtc2xpZGVyKSA+IGEnLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAoVGFiYmVkVVguZm9jdXNUYWIoJHQuYXR0cignaHJlZicpKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0ID0gJChkb2N1bWVudCkuc2Nyb2xsVG9wKCk7XHJcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5oYXNoID0gJHQuYXR0cignaHJlZicpO1xyXG4gICAgICAgICAgICAgICAgJCgnaHRtbCxib2R5Jykuc2Nyb2xsVG9wKHN0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ21vdXNlZG93bicsIFRhYmJlZFVYLnN0YXJ0TW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyID4gYScsICdtb3VzZXVwIG1vdXNlbGVhdmUnLCBUYWJiZWRVWC5lbmRNb3ZlVGFic1NsaWRlcilcclxuICAgICAgICAvLyB0aGUgY2xpY2sgcmV0dXJuIGZhbHNlIGlzIHRvIGRpc2FibGUgc3RhbmRhciB1cmwgYmVoYXZpb3JcclxuICAgICAgICAuZGVsZWdhdGUoJy50YWJiZWQgPiAudGFicy1zbGlkZXIgPiBhJywgJ2NsaWNrJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gZmFsc2U7IH0pXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMtc2xpZGVyLWxpbWl0JywgJ21vdXNlZW50ZXInLCBUYWJiZWRVWC5zdGFydE1vdmVUYWJzU2xpZGVyKVxyXG4gICAgICAgIC5kZWxlZ2F0ZSgnLnRhYmJlZCA+IC50YWJzLXNsaWRlci1saW1pdCcsICdtb3VzZWxlYXZlJywgVGFiYmVkVVguZW5kTW92ZVRhYnNTbGlkZXIpXHJcbiAgICAgICAgLmRlbGVnYXRlKCcudGFiYmVkID4gLnRhYnMgPiBsaS5yZW1vdmFibGUnLCAnY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICAvLyBPbmx5IG9uIGRpcmVjdCBjbGlja3MgdG8gdGhlIHRhYiwgdG8gYXZvaWRcclxuICAgICAgICAgICAgLy8gY2xpY2tzIHRvIHRoZSB0YWItbGluayAodGhhdCBzZWxlY3QvZm9jdXMgdGhlIHRhYik6XHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldCA9PSBlLmN1cnJlbnRUYXJnZXQpXHJcbiAgICAgICAgICAgICAgICBUYWJiZWRVWC5yZW1vdmVUYWIobnVsbCwgdGhpcyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEluaXQgcGFnZSBsb2FkZWQgdGFiYmVkIGNvbnRhaW5lcnM6XHJcbiAgICAgICAgJCgnLnRhYmJlZCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAvLyBDb25zaXN0ZW5jZSBjaGVjazogdGhpcyBtdXN0IGJlIGEgdmFsaWQgY29udGFpbmVyLCB0aGlzIGlzLCBtdXN0IGhhdmUgLnRhYnNcclxuICAgICAgICAgICAgaWYgKCR0LmNoaWxkcmVuKCcudGFicycpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgLy8gSW5pdCBzbGlkZXJcclxuICAgICAgICAgICAgVGFiYmVkVVguc2V0dXBTbGlkZXIoJHQpO1xyXG4gICAgICAgICAgICAvLyBDbGVhbiB3aGl0ZSBzcGFjZXMgKHRoZXkgY3JlYXRlIGV4Y2VzaXZlIHNlcGFyYXRpb24gYmV0d2VlbiBzb21lIHRhYnMpXHJcbiAgICAgICAgICAgICQoJy50YWJzJywgdGhpcykuY29udGVudHMoKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIGlmIHRoaXMgaXMgYSB0ZXh0IG5vZGUsIHJlbW92ZSBpdDpcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5vZGVUeXBlID09IDMpXHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgbW92ZVRhYnNTbGlkZXI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIGRpciA9ICR0Lmhhc0NsYXNzKCd0YWJzLXNsaWRlci1yaWdodCcpID8gMSA6IC0xO1xyXG4gICAgICAgIHZhciB0YWJzU2xpZGVyID0gJHQucGFyZW50KCk7XHJcbiAgICAgICAgdmFyIHRhYnMgPSB0YWJzU2xpZGVyLnNpYmxpbmdzKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIHRhYnNbMF0uc2Nyb2xsTGVmdCArPSAyMCAqIGRpcjtcclxuICAgICAgICBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJzU2xpZGVyLnBhcmVudCgpLCB0YWJzKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgc3RhcnRNb3ZlVGFic1NsaWRlcjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgdGFicyA9IHQuY2xvc2VzdCgnLnRhYmJlZCcpLmNoaWxkcmVuKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIC8vIFN0b3AgcHJldmlvdXMgYW5pbWF0aW9uczpcclxuICAgICAgICB0YWJzLnN0b3AodHJ1ZSk7XHJcbiAgICAgICAgdmFyIHNwZWVkID0gMC4zOyAvKiBzcGVlZCB1bml0OiBwaXhlbHMvbWlsaXNlY29uZHMgKi9cclxuICAgICAgICB2YXIgZnhhID0gZnVuY3Rpb24gKCkgeyBUYWJiZWRVWC5jaGVja1RhYlNsaWRlckxpbWl0cyh0YWJzLnBhcmVudCgpLCB0YWJzKTsgfTtcclxuICAgICAgICB2YXIgdGltZTtcclxuICAgICAgICBpZiAodC5oYXNDbGFzcygncmlnaHQnKSkge1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGltZSBiYXNlZCBvbiBzcGVlZCB3ZSB3YW50IGFuZCBob3cgbWFueSBkaXN0YW5jZSB0aGVyZSBpczpcclxuICAgICAgICAgICAgdGltZSA9ICh0YWJzWzBdLnNjcm9sbFdpZHRoIC0gdGFic1swXS5zY3JvbGxMZWZ0IC0gdGFicy53aWR0aCgpKSAqIDEgLyBzcGVlZDtcclxuICAgICAgICAgICAgdGFicy5hbmltYXRlKHsgc2Nyb2xsTGVmdDogdGFic1swXS5zY3JvbGxXaWR0aCAtIHRhYnMud2lkdGgoKSB9LFxyXG4gICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBzdGVwOiBmeGEsIGNvbXBsZXRlOiBmeGEsIGVhc2luZzogJ3N3aW5nJyB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgdGltZSBiYXNlZCBvbiBzcGVlZCB3ZSB3YW50IGFuZCBob3cgbWFueSBkaXN0YW5jZSB0aGVyZSBpczpcclxuICAgICAgICAgICAgdGltZSA9IHRhYnNbMF0uc2Nyb2xsTGVmdCAqIDEgLyBzcGVlZDtcclxuICAgICAgICAgICAgdGFicy5hbmltYXRlKHsgc2Nyb2xsTGVmdDogMCB9LFxyXG4gICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBzdGVwOiBmeGEsIGNvbXBsZXRlOiBmeGEsIGVhc2luZzogJ3N3aW5nJyB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGVuZE1vdmVUYWJzU2xpZGVyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHRhYkNvbnRhaW5lciA9ICQodGhpcykuY2xvc2VzdCgnLnRhYmJlZCcpO1xyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKS5zdG9wKHRydWUpO1xyXG4gICAgICAgIFRhYmJlZFVYLmNoZWNrVGFiU2xpZGVyTGltaXRzKHRhYkNvbnRhaW5lcik7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGNoZWNrVGFiU2xpZGVyTGltaXRzOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCB0YWJzKSB7XHJcbiAgICAgICAgdGFicyA9IHRhYnMgfHwgdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiczplcSgwKScpO1xyXG4gICAgICAgIC8vIFNldCB2aXNpYmlsaXR5IG9mIHZpc3VhbCBsaW1pdGVyczpcclxuICAgICAgICB0YWJDb250YWluZXIuY2hpbGRyZW4oJy50YWJzLXNsaWRlci1saW1pdC1sZWZ0JykudG9nZ2xlKHRhYnNbMF0uc2Nyb2xsTGVmdCA+IDApO1xyXG4gICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnMtc2xpZGVyLWxpbWl0LXJpZ2h0JykudG9nZ2xlKFxyXG4gICAgICAgICAgICAodGFic1swXS5zY3JvbGxMZWZ0ICsgdGFicy53aWR0aCgpKSA8IHRhYnNbMF0uc2Nyb2xsV2lkdGgpO1xyXG4gICAgfSxcclxuICAgIHNldHVwU2xpZGVyOiBmdW5jdGlvbiAodGFiQ29udGFpbmVyKSB7XHJcbiAgICAgICAgdmFyIHRzID0gdGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicy1zbGlkZXInKTtcclxuICAgICAgICBpZiAodGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFicycpLmhhc1Njcm9sbEJhcih7IHg6IC0yIH0pLmhvcml6b250YWwpIHtcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFkZENsYXNzKCdoYXMtdGFicy1zbGlkZXInKTtcclxuICAgICAgICAgICAgaWYgKHRzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgIHRzLmNsYXNzTmFtZSA9ICd0YWJzLXNsaWRlcic7XHJcbiAgICAgICAgICAgICAgICAkKHRzKVxyXG4gICAgICAgICAgICAgICAgLy8gQXJyb3dzOlxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxhIGNsYXNzPVwidGFicy1zbGlkZXItbGVmdCBsZWZ0XCIgaHJlZj1cIiNcIj4mbHQ7Jmx0OzwvYT4nKVxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxhIGNsYXNzPVwidGFicy1zbGlkZXItcmlnaHQgcmlnaHRcIiBocmVmPVwiI1wiPiZndDsmZ3Q7PC9hPicpO1xyXG4gICAgICAgICAgICAgICAgdGFiQ29udGFpbmVyLmFwcGVuZCh0cyk7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXJcclxuICAgICAgICAgICAgICAgIC8vIERlc2luZyBkZXRhaWxzOlxyXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJ0YWJzLXNsaWRlci1saW1pdCB0YWJzLXNsaWRlci1saW1pdC1sZWZ0IGxlZnRcIiBocmVmPVwiI1wiPjwvZGl2PicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCgnPGRpdiBjbGFzcz1cInRhYnMtc2xpZGVyLWxpbWl0IHRhYnMtc2xpZGVyLWxpbWl0LXJpZ2h0IHJpZ2h0XCIgaHJlZj1cIiNcIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRzLnNob3coKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5yZW1vdmVDbGFzcygnaGFzLXRhYnMtc2xpZGVyJyk7XHJcbiAgICAgICAgICAgIHRzLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgVGFiYmVkVVguY2hlY2tUYWJTbGlkZXJMaW1pdHModGFiQ29udGFpbmVyKTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWJDb250ZXh0QnlBcmdzOiBmdW5jdGlvbiAoYXJncykge1xyXG4gICAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAxICYmIHR5cGVvZiAoYXJnc1swXSkgPT0gJ3N0cmluZycpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFRhYkNvbnRleHQoYXJnc1swXSwgbnVsbCk7XHJcbiAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID09IDEgJiYgYXJnc1swXS50YWIpXHJcbiAgICAgICAgICAgIHJldHVybiBhcmdzWzBdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VGFiQ29udGV4dChcclxuICAgICAgICAgICAgICAgIGFyZ3MubGVuZ3RoID4gMCA/IGFyZ3NbMF0gOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgYXJncy5sZW5ndGggPiAxID8gYXJnc1sxXSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBhcmdzLmxlbmd0aCA+IDIgPyBhcmdzWzJdIDogbnVsbFxyXG4gICAgICAgICAgICApO1xyXG4gICAgfSxcclxuICAgIGdldFRhYkNvbnRleHQ6IGZ1bmN0aW9uICh0YWJPclNlbGVjdG9yLCBtZW51aXRlbU9yU2VsZWN0b3IpIHtcclxuICAgICAgICB2YXIgbWksIG1hLCB0YWIsIHRhYkNvbnRhaW5lcjtcclxuICAgICAgICBpZiAodGFiT3JTZWxlY3Rvcikge1xyXG4gICAgICAgICAgICB0YWIgPSAkKHRhYk9yU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAodGFiLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICB0YWJDb250YWluZXIgPSB0YWIucGFyZW50cygnLnRhYmJlZDplcSgwKScpO1xyXG4gICAgICAgICAgICAgICAgbWEgPSB0YWJDb250YWluZXIuZmluZCgnPiAudGFicyA+IGxpID4gYVtocmVmPSMnICsgdGFiLmdldCgwKS5pZCArICddJyk7XHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hLnBhcmVudCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChtZW51aXRlbU9yU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgbWEgPSAkKG1lbnVpdGVtT3JTZWxlY3Rvcik7XHJcbiAgICAgICAgICAgIGlmIChtYS5pcygnbGknKSkge1xyXG4gICAgICAgICAgICAgICAgbWkgPSBtYTtcclxuICAgICAgICAgICAgICAgIG1hID0gbWkuY2hpbGRyZW4oJ2E6ZXEoMCknKTtcclxuICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICBtaSA9IG1hLnBhcmVudCgpO1xyXG4gICAgICAgICAgICB0YWJDb250YWluZXIgPSBtaS5jbG9zZXN0KCcudGFiYmVkJyk7XHJcbiAgICAgICAgICAgIHRhYiA9IHRhYkNvbnRhaW5lci5maW5kKCc+LnRhYi1ib2R5QDAsID4udGFiLWJvZHktbGlzdD4udGFiLWJvZHlAMCcucmVwbGFjZSgvQDAvZywgbWEuYXR0cignaHJlZicpKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB7IHRhYjogdGFiLCBtZW51YW5jaG9yOiBtYSwgbWVudWl0ZW06IG1pLCB0YWJDb250YWluZXI6IHRhYkNvbnRhaW5lciB9O1xyXG4gICAgfSxcclxuICAgIGNoZWNrVGFiQ29udGV4dDogZnVuY3Rpb24gKGN0eCwgZnVuY3Rpb25uYW1lLCBhcmdzLCBpc1Rlc3QpIHtcclxuICAgICAgICBpZiAoIWN0eC50YWIgfHwgY3R4LnRhYi5sZW5ndGggIT0gMSB8fFxyXG4gICAgICAgICAgICAhY3R4Lm1lbnVpdGVtIHx8IGN0eC5tZW51aXRlbS5sZW5ndGggIT0gMSB8fFxyXG4gICAgICAgICAgICAhY3R4LnRhYkNvbnRhaW5lciB8fCBjdHgudGFiQ29udGFpbmVyLmxlbmd0aCAhPSAxIHx8IFxyXG4gICAgICAgICAgICAhY3R4Lm1lbnVhbmNob3IgfHwgY3R4Lm1lbnVhbmNob3IubGVuZ3RoICE9IDEpIHtcclxuICAgICAgICAgICAgaWYgKCFpc1Rlc3QgJiYgY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignVGFiYmVkVVguJyArIGZ1bmN0aW9ubmFtZSArICcsIGJhZCBhcmd1bWVudHM6ICcgKyBBcnJheS5qb2luKGFyZ3MsICcsICcpKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBnZXRUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdmb2N1c1RhYicsIGFyZ3VtZW50cywgdHJ1ZSkpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHJldHVybiBjdHgudGFiLmdldCgwKTtcclxuICAgIH0sXHJcbiAgICBmb2N1c1RhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ2ZvY3VzVGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBHZXQgcHJldmlvdXMgZm9jdXNlZCB0YWIsIHRyaWdnZXIgJ3RhYlVuZm9jdXNlZCcgaGFuZGxlciB0aGF0IGNhblxyXG4gICAgICAgIC8vIHN0b3AgdGhpcyBmb2N1cyAocmV0dXJuaW5nIGV4cGxpY2l0eSAnZmFsc2UnKVxyXG4gICAgICAgIHZhciBwcmV2VGFiID0gY3R4LnRhYi5zaWJsaW5ncygnLmN1cnJlbnQnKTtcclxuICAgICAgICBpZiAocHJldlRhYi50cmlnZ2VySGFuZGxlcigndGFiVW5mb2N1c2VkJywgW2N0eF0pID09PSBmYWxzZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyBDaGVjayAoZmlyc3QhKSBpZiB0aGVyZSBpcyBhIHBhcmVudCB0YWIgYW5kIGZvY3VzIGl0IHRvbyAod2lsbCBiZSByZWN1cnNpdmUgY2FsbGluZyB0aGlzIHNhbWUgZnVuY3Rpb24pXHJcbiAgICAgICAgdmFyIHBhclRhYiA9IGN0eC50YWIucGFyZW50cygnLnRhYi1ib2R5OmVxKDApJyk7XHJcbiAgICAgICAgaWYgKHBhclRhYi5sZW5ndGggPT0gMSkgdGhpcy5mb2N1c1RhYihwYXJUYWIpO1xyXG5cclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdjdXJyZW50JykgfHxcclxuICAgICAgICAgICAgY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdkaXNhYmxlZCcpKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIFVuc2V0IGN1cnJlbnQgbWVudSBlbGVtZW50XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLnNpYmxpbmdzKCcuY3VycmVudCcpLnJlbW92ZUNsYXNzKCdjdXJyZW50JylcclxuICAgICAgICAgICAgLmZpbmQoJz5hJykucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAvLyBTZXQgY3VycmVudCBtZW51IGVsZW1lbnRcclxuICAgICAgICBjdHgubWVudWl0ZW0uYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICBjdHgubWVudWFuY2hvci5hZGRDbGFzcygnY3VycmVudCcpO1xyXG5cclxuICAgICAgICAvLyBIaWRlIGN1cnJlbnQgdGFiLWJvZHlcclxuICAgICAgICBwcmV2VGFiLnJlbW92ZUNsYXNzKCdjdXJyZW50Jyk7XHJcbiAgICAgICAgLy8gU2hvdyBjdXJyZW50IHRhYi1ib2R5IGFuZCB0cmlnZ2VyIGV2ZW50XHJcbiAgICAgICAgY3R4LnRhYi5hZGRDbGFzcygnY3VycmVudCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRm9jdXNlZCcpO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0sXHJcbiAgICBmb2N1c1RhYkluZGV4OiBmdW5jdGlvbiAodGFiQ29udGFpbmVyLCB0YWJJbmRleCkge1xyXG4gICAgICAgIGlmICh0YWJDb250YWluZXIpXHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZvY3VzVGFiKHRoaXMuZ2V0VGFiQ29udGV4dCh0YWJDb250YWluZXIuZmluZCgnPi50YWItYm9keTplcSgnICsgdGFiSW5kZXggKyAnKScpKSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIC8qIEVuYWJsZSBhIHRhYiwgZGlzYWJsaW5nIGFsbCBvdGhlcnMgdGFicyAtdXNlZnVsbCBpbiB3aXphcmQgc3R5bGUgcGFnZXMtICovXHJcbiAgICBlbmFibGVUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdlbmFibGVUYWInLCBhcmd1bWVudHMpKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHJ0biA9IGZhbHNlO1xyXG4gICAgICAgIGlmIChjdHgubWVudWl0ZW0uaXMoJy5kaXNhYmxlZCcpKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBkaXNhYmxlZCBjbGFzcyBmcm9tIGZvY3VzZWQgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICAgICAgY3R4LnRhYi5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKVxyXG4gICAgICAgICAgICAudHJpZ2dlckhhbmRsZXIoJ3RhYkVuYWJsZWQnKTtcclxuICAgICAgICAgICAgY3R4Lm1lbnVpdGVtLnJlbW92ZUNsYXNzKCdkaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICBydG4gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBGb2N1cyB0YWI6XHJcbiAgICAgICAgdGhpcy5mb2N1c1RhYihjdHgpO1xyXG4gICAgICAgIC8vIERpc2FibGVkIHRhYnMgYW5kIG1lbnUgaXRlbXM6XHJcbiAgICAgICAgY3R4LnRhYi5zaWJsaW5ncygnOm5vdCguZGlzYWJsZWQpJylcclxuICAgICAgICAgICAgLmFkZENsYXNzKCdkaXNhYmxlZCcpXHJcbiAgICAgICAgICAgIC50cmlnZ2VySGFuZGxlcigndGFiRGlzYWJsZWQnKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2libGluZ3MoJzpub3QoLmRpc2FibGVkKScpXHJcbiAgICAgICAgICAgIC5hZGRDbGFzcygnZGlzYWJsZWQnKTtcclxuICAgICAgICByZXR1cm4gcnRuO1xyXG4gICAgfSxcclxuICAgIHNob3doaWRlRHVyYXRpb246IDAsXHJcbiAgICBzaG93aGlkZUVhc2luZzogbnVsbCxcclxuICAgIHNob3dUYWI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgY3R4ID0gdGhpcy5nZXRUYWJDb250ZXh0QnlBcmdzKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrVGFiQ29udGV4dChjdHgsICdzaG93VGFiJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNob3cgdGFiIGFuZCBtZW51IGl0ZW1cclxuICAgICAgICBjdHgudGFiLnNob3codGhpcy5zaG93aGlkZUR1cmF0aW9uKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0uc2hvdyh0aGlzLnNob3doaWRlRWFzaW5nKTtcclxuICAgIH0sXHJcbiAgICBoaWRlVGFiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuZ2V0VGFiQ29udGV4dEJ5QXJncyhhcmd1bWVudHMpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGVja1RhYkNvbnRleHQoY3R4LCAnaGlkZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuICAgICAgICAvLyBTaG93IHRhYiBhbmQgbWVudSBpdGVtXHJcbiAgICAgICAgY3R4LnRhYi5oaWRlKHRoaXMuc2hvd2hpZGVEdXJhdGlvbik7XHJcbiAgICAgICAgY3R4Lm1lbnVpdGVtLmhpZGUodGhpcy5zaG93aGlkZUVhc2luZyk7XHJcbiAgICB9LFxyXG4gICAgdGFiQm9keUNsYXNzRXhjZXB0aW9uczogeyAndGFiLWJvZHknOiAwLCAndGFiYmVkJzogMCwgJ2N1cnJlbnQnOiAwLCAnZGlzYWJsZWQnOiAwIH0sXHJcbiAgICBjcmVhdGVUYWI6IGZ1bmN0aW9uICh0YWJDb250YWluZXIsIGlkTmFtZSwgbGFiZWwpIHtcclxuICAgICAgICB0YWJDb250YWluZXIgPSAkKHRhYkNvbnRhaW5lcik7XHJcbiAgICAgICAgLy8gdGFiQ29udGFpbmVyIG11c3QgYmUgb25seSBvbmUgYW5kIHZhbGlkIGNvbnRhaW5lclxyXG4gICAgICAgIC8vIGFuZCBpZE5hbWUgbXVzdCBub3QgZXhpc3RzXHJcbiAgICAgICAgaWYgKHRhYkNvbnRhaW5lci5sZW5ndGggPT0gMSAmJiB0YWJDb250YWluZXIuaXMoJy50YWJiZWQnKSAmJlxyXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZE5hbWUpID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSB0YWIgZGl2OlxyXG4gICAgICAgICAgICB2YXIgdGFiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIHRhYi5pZCA9IGlkTmFtZTtcclxuICAgICAgICAgICAgLy8gUmVxdWlyZWQgY2xhc3Nlc1xyXG4gICAgICAgICAgICB0YWIuY2xhc3NOYW1lID0gXCJ0YWItYm9keVwiO1xyXG4gICAgICAgICAgICB2YXIgJHRhYiA9ICQodGFiKTtcclxuICAgICAgICAgICAgLy8gR2V0IGFuIGV4aXN0aW5nIHNpYmxpbmcgYW5kIGNvcHkgKHdpdGggc29tZSBleGNlcHRpb25zKSB0aGVpciBjc3MgY2xhc3Nlc1xyXG4gICAgICAgICAgICAkLmVhY2godGFiQ29udGFpbmVyLmNoaWxkcmVuKCcudGFiLWJvZHk6ZXEoMCknKS5hdHRyKCdjbGFzcycpLnNwbGl0KC9cXHMrLyksIGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoISh2IGluIFRhYmJlZFVYLnRhYkJvZHlDbGFzc0V4Y2VwdGlvbnMpKVxyXG4gICAgICAgICAgICAgICAgICAgICR0YWIuYWRkQ2xhc3Modik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBBZGQgdG8gY29udGFpbmVyXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5hcHBlbmQodGFiKTtcclxuXHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBtZW51IGVudHJ5XHJcbiAgICAgICAgICAgIHZhciBtZW51aXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XHJcbiAgICAgICAgICAgIC8vIEJlY2F1c2UgaXMgYSBkeW5hbWljYWxseSBjcmVhdGVkIHRhYiwgaXMgYSBkeW5hbWljYWxseSByZW1vdmFibGUgdGFiOlxyXG4gICAgICAgICAgICBtZW51aXRlbS5jbGFzc05hbWUgPSBcInJlbW92YWJsZVwiO1xyXG4gICAgICAgICAgICB2YXIgbWVudWFuY2hvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgICAgICAgICAgbWVudWFuY2hvci5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCAnIycgKyBpZE5hbWUpO1xyXG4gICAgICAgICAgICAvLyBsYWJlbCBjYW5ub3QgYmUgbnVsbCBvciBlbXB0eVxyXG4gICAgICAgICAgICAkKG1lbnVhbmNob3IpLnRleHQoaXNFbXB0eVN0cmluZyhsYWJlbCkgPyBcIlRhYlwiIDogbGFiZWwpO1xyXG4gICAgICAgICAgICAkKG1lbnVpdGVtKS5hcHBlbmQobWVudWFuY2hvcik7XHJcbiAgICAgICAgICAgIC8vIEFkZCB0byB0YWJzIGxpc3QgY29udGFpbmVyXHJcbiAgICAgICAgICAgIHRhYkNvbnRhaW5lci5jaGlsZHJlbignLnRhYnM6ZXEoMCknKS5hcHBlbmQobWVudWl0ZW0pO1xyXG5cclxuICAgICAgICAgICAgLy8gVHJpZ2dlciBldmVudCwgb24gdGFiQ29udGFpbmVyLCB3aXRoIHRoZSBuZXcgdGFiIGFzIGRhdGFcclxuICAgICAgICAgICAgdGFiQ29udGFpbmVyLnRyaWdnZXJIYW5kbGVyKCd0YWJDcmVhdGVkJywgW3RhYl0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZXR1cFNsaWRlcih0YWJDb250YWluZXIpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRhYjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIHJlbW92ZVRhYjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjdHggPSB0aGlzLmdldFRhYkNvbnRleHRCeUFyZ3MoYXJndW1lbnRzKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3JlbW92ZVRhYicsIGFyZ3VtZW50cykpIHJldHVybjtcclxuXHJcbiAgICAgICAgLy8gT25seSByZW1vdmUgaWYgaXMgYSAncmVtb3ZhYmxlJyB0YWJcclxuICAgICAgICBpZiAoIWN0eC5tZW51aXRlbS5oYXNDbGFzcygncmVtb3ZhYmxlJykgJiYgIWN0eC5tZW51aXRlbS5oYXNDbGFzcygndm9sYXRpbGUnKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIC8vIElmIHRhYiBpcyBjdXJyZW50bHkgZm9jdXNlZCB0YWIsIGNoYW5nZSB0byBmaXJzdCB0YWJcclxuICAgICAgICBpZiAoY3R4Lm1lbnVpdGVtLmhhc0NsYXNzKCdjdXJyZW50JykpXHJcbiAgICAgICAgICAgIHRoaXMuZm9jdXNUYWJJbmRleChjdHgudGFiQ29udGFpbmVyLCAwKTtcclxuICAgICAgICBjdHgubWVudWl0ZW0ucmVtb3ZlKCk7XHJcbiAgICAgICAgdmFyIHRhYmlkID0gY3R4LnRhYi5nZXQoMCkuaWQ7XHJcbiAgICAgICAgY3R4LnRhYi5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXR1cFNsaWRlcihjdHgudGFiQ29udGFpbmVyKTtcclxuXHJcbiAgICAgICAgLy8gVHJpZ2dlciBldmVudCwgb24gdGFiQ29udGFpbmVyLCB3aXRoIHRoZSByZW1vdmVkIHRhYiBpZCBhcyBkYXRhXHJcbiAgICAgICAgY3R4LnRhYkNvbnRhaW5lci50cmlnZ2VySGFuZGxlcigndGFiUmVtb3ZlZCcsIFt0YWJpZF0pO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSxcclxuICAgIHNldFRhYlRpdGxlOiBmdW5jdGlvbiAodGFiT3JTZWxlY3RvciwgbmV3VGl0bGUpIHtcclxuICAgICAgICB2YXIgY3R4ID0gVGFiYmVkVVguZ2V0VGFiQ29udGV4dCh0YWJPclNlbGVjdG9yKTtcclxuICAgICAgICBpZiAoIXRoaXMuY2hlY2tUYWJDb250ZXh0KGN0eCwgJ3NldFRhYlRpdGxlJywgYXJndW1lbnRzKSkgcmV0dXJuO1xyXG4gICAgICAgIC8vIFNldCBhbiBlbXB0eSBzdHJpbmcgaXMgbm90IGFsbG93ZWQsIHByZXNlcnZlIHByZXZpb3VzbHk6XHJcbiAgICAgICAgaWYgKCFpc0VtcHR5U3RyaW5nKG5ld1RpdGxlKSlcclxuICAgICAgICAgICAgY3R4Lm1lbnVhbmNob3IudGV4dChuZXdUaXRsZSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKiBNb3JlIHN0YXRpYyB1dGlsaXRpZXMgKi9cclxuXHJcbi8qKiBMb29rIHVwIHRoZSBjdXJyZW50IHdpbmRvdyBsb2NhdGlvbiBhZGRyZXNzIGFuZCB0cnkgdG8gZm9jdXMgYSB0YWIgd2l0aCB0aGF0XHJcbiAgICBuYW1lLCBpZiB0aGVyZSBpcyBvbmUuXHJcbioqL1xyXG5UYWJiZWRVWC5mb2N1c0N1cnJlbnRMb2NhdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIElmIHRoZSBjdXJyZW50IGxvY2F0aW9uIGhhdmUgYSBoYXNoIHZhbHVlIGJ1dCBpcyBub3QgYSBIYXNoQmFuZ1xyXG4gICAgaWYgKC9eI1teIV0vLnRlc3Qod2luZG93LmxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICAgICAgLy8gVHJ5IGZvY3VzIGEgdGFiIHdpdGggdGhhdCBuYW1lXHJcbiAgICAgICAgdmFyIHRhYiA9IFRhYmJlZFVYLmdldFRhYih3aW5kb3cubG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgaWYgKHRhYilcclxuICAgICAgICAgICAgVGFiYmVkVVguZm9jdXNUYWIodGFiKTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKiBMb29rIGZvciB2b2xhdGlsZSB0YWJzIG9uIHRoZSBwYWdlLCBpZiB0aGV5IGFyZVxyXG4gICAgZW1wdHkgb3IgcmVxdWVzdGluZyBiZWluZyAndm9sYXRpemVkJywgcmVtb3ZlIGl0LlxyXG4qKi9cclxuVGFiYmVkVVguY2hlY2tWb2xhdGlsZVRhYnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKCcudGFiYmVkID4gLnRhYnMgPiAudm9sYXRpbGUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdGFiID0gVGFiYmVkVVguZ2V0VGFiKG51bGwsIHRoaXMpO1xyXG4gICAgICAgIGlmICh0YWIgJiYgKCQodGFiKS5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMCB8fCAkKHRhYikuZmluZCgnOm5vdCgudGFiYmVkKSAudm9sYXRpemUtbXktdGFiJykubGVuZ3RoKSkge1xyXG4gICAgICAgICAgICBUYWJiZWRVWC5yZW1vdmVUYWIodGFiKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRhYmJlZFVYOyIsIi8qIHNsaWRlci10YWJzIGxvZ2ljLlxyXG4qIEV4ZWN1dGUgaW5pdCBhZnRlciBUYWJiZWRVWC5pbml0IHRvIGF2b2lkIGxhdW5jaCBhbmltYXRpb24gb24gcGFnZSBsb2FkLlxyXG4qIEl0IHJlcXVpcmVzIFRhYmJlZFVYIHRocm91Z2h0IERJIG9uICdpbml0Jy5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFNsaWRlclRhYnMoVGFiYmVkVVgpIHtcclxuICAgICQoJy50YWJiZWQuc2xpZGVyLXRhYnMnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciAkdGFicyA9ICR0LmNoaWxkcmVuKCcudGFiLWJvZHknKTtcclxuICAgICAgICB2YXIgYyA9ICR0YWJzXHJcbiAgICAgICAgICAgIC53cmFwQWxsKCc8ZGl2IGNsYXNzPVwidGFiLWJvZHktbGlzdFwiLz4nKVxyXG4gICAgICAgICAgICAuZW5kKCkuY2hpbGRyZW4oJy50YWItYm9keS1saXN0Jyk7XHJcbiAgICAgICAgJHRhYnMub24oJ3RhYkZvY3VzZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGMuc3RvcCh0cnVlLCBmYWxzZSkuYW5pbWF0ZSh7IHNjcm9sbExlZnQ6IGMuc2Nyb2xsTGVmdCgpICsgJCh0aGlzKS5wb3NpdGlvbigpLmxlZnQgfSwgMTQwMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gU2V0IGhvcml6b250YWwgc2Nyb2xsIHRvIHRoZSBwb3NpdGlvbiBvZiBjdXJyZW50IHNob3dlZCB0YWIsIHdpdGhvdXQgYW5pbWF0aW9uIChmb3IgcGFnZS1pbml0KTpcclxuICAgICAgICB2YXIgY3VycmVudFRhYiA9ICQoJHQuZmluZCgnPi50YWJzPmxpLmN1cnJlbnQ+YScpLmF0dHIoJ2hyZWYnKSk7XHJcbiAgICAgICAgYy5zY3JvbGxMZWZ0KGMuc2Nyb2xsTGVmdCgpICsgY3VycmVudFRhYi5wb3NpdGlvbigpLmxlZnQpO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBXaXphcmQgVGFiYmVkIEZvcm1zLlxyXG4gICAgSXQgdXNlIHRhYnMgdG8gbWFuYWdlIHRoZSBkaWZmZXJlbnQgZm9ybXMtc3RlcHMgaW4gdGhlIHdpemFyZCxcclxuICAgIGxvYWRlZCBieSBBSkFYIGFuZCBmb2xsb3dpbmcgdG8gdGhlIG5leHQgdGFiL3N0ZXAgb24gc3VjY2Vzcy5cclxuXHJcbiAgICBSZXF1aXJlIFRhYmJlZFVYIHZpYSBESSBvbiAnaW5pdCdcclxuICoqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgdmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgcmVkaXJlY3RUbyA9IHJlcXVpcmUoJy4vcmVkaXJlY3RUbycpLFxyXG4gICAgcG9wdXAgPSByZXF1aXJlKCcuL3BvcHVwJyksXHJcbiAgICBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnLi9hamF4Q2FsbGJhY2tzJyksXHJcbiAgICBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuL2Jsb2NrUHJlc2V0cycpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdFRhYmJlZFdpemFyZChUYWJiZWRVWCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBsb2FkaW5nRGVsYXk6IDBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgICQoXCJib2R5XCIpLmRlbGVnYXRlKFwiLnRhYmJlZC53aXphcmQgLm5leHRcIiwgXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgZm9ybVxyXG4gICAgICAgIHZhciBmb3JtID0gJCh0aGlzKS5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAgICAgLy8gZ2V0dGluZyB0aGUgY3VycmVudCB3aXphcmQgc3RlcC10YWJcclxuICAgICAgICB2YXIgY3VycmVudFN0ZXAgPSBmb3JtLmNsb3Nlc3QoJy50YWItYm9keScpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIHdpemFyZCBjb250YWluZXJcclxuICAgICAgICB2YXIgd2l6YXJkID0gZm9ybS5jbG9zZXN0KCcudGFiYmVkLndpemFyZCcpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIHdpemFyZC1uZXh0LXN0ZXBcclxuICAgICAgICB2YXIgbmV4dFN0ZXAgPSAkKHRoaXMpLmRhdGEoJ3dpemFyZC1uZXh0LXN0ZXAnKTtcclxuXHJcbiAgICAgICAgdmFyIGN0eCA9IHtcclxuICAgICAgICAgICAgYm94OiBjdXJyZW50U3RlcCxcclxuICAgICAgICAgICAgZm9ybTogZm9ybVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vIEZpcnN0IGF0IGFsbCwgaWYgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgICAgIHZhciB2YWxvYmplY3QgPSBmb3JtLmRhdGEoJ3Vub2J0cnVzaXZlVmFsaWRhdGlvbicpO1xyXG4gICAgICAgIGlmICh2YWxvYmplY3QgJiYgdmFsb2JqZWN0LnZhbGlkYXRlKCkgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSk7XHJcbiAgICAgICAgICAgIC8vIFZhbGlkYXRpb24gaXMgYWN0aXZlZCwgd2FzIGV4ZWN1dGVkIGFuZCB0aGUgcmVzdWx0IGlzICdmYWxzZSc6IGJhZCBkYXRhLCBzdG9wIFBvc3Q6XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICAgICAgdmFyIGN1c3ZhbCA9IGZvcm0uZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicpO1xyXG4gICAgICAgIGlmIChjdXN2YWwgJiYgY3VzdmFsLnZhbGlkYXRlICYmIGN1c3ZhbC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICB2YWxpZGF0aW9uLmdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pO1xyXG4gICAgICAgICAgICAvLyBjdXN0b20gdmFsaWRhdGlvbiBub3QgcGFzc2VkLCBvdXQhXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFJhaXNlIGV2ZW50XHJcbiAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcignYmVnaW5TdWJtaXRXaXphcmRTdGVwJyk7XHJcblxyXG4gICAgICAgIC8vIExvYWRpbmcsIHdpdGggcmV0YXJkXHJcbiAgICAgICAgY3R4LmxvYWRpbmd0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBjdXJyZW50U3RlcC5ibG9jayhibG9ja1ByZXNldHMubG9hZGluZyk7XHJcbiAgICAgICAgfSwgb3B0aW9ucy5sb2FkaW5nRGVsYXkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgb2sgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gTWFyayBhcyBzYXZlZDpcclxuICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzID0gY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgICAgICAvLyBEbyB0aGUgQWpheCBwb3N0XHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiAoZm9ybS5hdHRyKCdhY3Rpb24nKSB8fCAnJyksXHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgY29udGV4dDogY3R4LFxyXG4gICAgICAgICAgICBkYXRhOiBmb3JtLnNlcmlhbGl6ZSgpLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiBzdWNjZXNzLCBnbyBuZXh0IHN0ZXAsIHVzaW5nIGN1c3RvbSBKU09OIEFjdGlvbiBldmVudDpcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgdGhlcmUgaXMgbmV4dC1zdGVwXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5leHRTdGVwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIG5leHQgc3RlcCBpcyBpbnRlcm5hbCB1cmwgKGEgbmV4dCB3aXphcmQgdGFiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoL14jLy50ZXN0KG5leHRTdGVwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChuZXh0U3RlcCkudHJpZ2dlcignYmVnaW5Mb2FkV2l6YXJkU3RlcCcpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRhYmJlZFVYLmVuYWJsZVRhYihuZXh0U3RlcCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2sgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChuZXh0U3RlcCkudHJpZ2dlcignZW5kTG9hZFdpemFyZFN0ZXAnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIGEgbmV4dC1zdGVwIFVSSSB0aGF0IGlzIG5vdCBpbnRlcm5hbCBsaW5rLCB3ZSBsb2FkIGl0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWRpcmVjdFRvKG5leHRTdGVwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIERvIEpTT04gYWN0aW9uIGJ1dCBpZiBpcyBub3QgSlNPTiBvciB2YWxpZCwgbWFuYWdlIGFzIEhUTUw6XHJcbiAgICAgICAgICAgICAgICBpZiAoIWFqYXhDYWxsYmFja3MuZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUG9zdCAnbWF5YmUnIHdhcyB3cm9uZywgaHRtbCB3YXMgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGZvcm0gY29udGFpbmVyOiB0aGUgYWpheC1ib3guXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUcnktY2F0Y2ggdG8gYXZvaWQgZXJyb3JzIHdoZW4gYW4gZW1wdHkgZG9jdW1lbnQgb3IgbWFsZm9ybWVkIGlzIHJldHVybmVkOlxyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mICgkLnBhcnNlSFRNTCkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3dpbmcgbmV3IGh0bWw6XHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudFN0ZXAuaHRtbChuZXdodG1sKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3Rm9ybSA9IGN1cnJlbnRTdGVwO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghY3VycmVudFN0ZXAuaXMoJ2Zvcm0nKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Rm9ybSA9IGN1cnJlbnRTdGVwLmZpbmQoJ2Zvcm06ZXEoMCknKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hhbmdlc25vdGlmaWNhdGlvbiBhZnRlciBhcHBlbmQgZWxlbWVudCB0byBkb2N1bWVudCwgaWYgbm90IHdpbGwgbm90IHdvcms6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQgKGlmIHdhcyBzYXZlZCBidXQgc2VydmVyIGRlY2lkZSByZXR1cm5zIGh0bWwgaW5zdGVhZCBhIEpTT04gY29kZSwgcGFnZSBzY3JpcHQgbXVzdCBkbyAncmVnaXN0ZXJTYXZlJyB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZSk6XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3Rm9ybS5nZXQoMCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50U3RlcC50cmlnZ2VyKCdyZWxvYWRlZEh0bWxXaXphcmRTdGVwJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBhamF4Q2FsbGJhY2tzLmVycm9yLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogYWpheENhbGxiYWNrcy5jb21wbGV0ZVxyXG4gICAgICAgIH0pLmNvbXBsZXRlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgY3VycmVudFN0ZXAudHJpZ2dlcignZW5kU3VibWl0V2l6YXJkU3RlcCcsIG9rKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvKiogdGltZVNwYW4gY2xhc3MgdG8gbWFuYWdlIHRpbWVzLCBwYXJzZSwgZm9ybWF0LCBjb21wdXRlLlxyXG5JdHMgbm90IHNvIGNvbXBsZXRlIGFzIHRoZSBDIyBvbmVzIGJ1dCBpcyB1c2VmdWxsIHN0aWxsLlxyXG4qKi9cclxudmFyIFRpbWVTcGFuID0gZnVuY3Rpb24gKGRheXMsIGhvdXJzLCBtaW51dGVzLCBzZWNvbmRzLCBtaWxsaXNlY29uZHMpIHtcclxuICAgIHRoaXMuZGF5cyA9IE1hdGguZmxvb3IocGFyc2VGbG9hdChkYXlzKSkgfHwgMDtcclxuICAgIHRoaXMuaG91cnMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQoaG91cnMpKSB8fCAwO1xyXG4gICAgdGhpcy5taW51dGVzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KG1pbnV0ZXMpKSB8fCAwO1xyXG4gICAgdGhpcy5zZWNvbmRzID0gTWF0aC5mbG9vcihwYXJzZUZsb2F0KHNlY29uZHMpKSB8fCAwO1xyXG4gICAgdGhpcy5taWxsaXNlY29uZHMgPSBNYXRoLmZsb29yKHBhcnNlRmxvYXQobWlsbGlzZWNvbmRzKSkgfHwgMDtcclxuXHJcbiAgICAvLyBpbnRlcm5hbCB1dGlsaXR5IGZ1bmN0aW9uICd0byBzdHJpbmcgd2l0aCB0d28gZGlnaXRzIGFsbW9zdCdcclxuICAgIGZ1bmN0aW9uIHQobikge1xyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKG4gLyAxMCkgKyAnJyArIG4gJSAxMDtcclxuICAgIH1cclxuICAgIC8qKiBTaG93IG9ubHkgaG91cnMgYW5kIG1pbnV0ZXMgYXMgYSBzdHJpbmcgd2l0aCB0aGUgZm9ybWF0IEhIOm1tXHJcbiAgICAqKi9cclxuICAgIHRoaXMudG9TaG9ydFN0cmluZyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvU2hvcnRTdHJpbmcoKSB7XHJcbiAgICAgICAgdmFyIGggPSB0KHRoaXMuaG91cnMpLFxyXG4gICAgICAgICAgICBtID0gdCh0aGlzLm1pbnV0ZXMpO1xyXG4gICAgICAgIHJldHVybiAoaCArIFRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyICsgbSk7XHJcbiAgICB9O1xyXG4gICAgLyoqIFNob3cgdGhlIGZ1bGwgdGltZSBhcyBhIHN0cmluZywgZGF5cyBjYW4gYXBwZWFyIGJlZm9yZSBob3VycyBpZiB0aGVyZSBhcmUgMjQgaG91cnMgb3IgbW9yZVxyXG4gICAgKiovXHJcbiAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TdHJpbmcoKSB7XHJcbiAgICAgICAgdmFyIGggPSB0KHRoaXMuaG91cnMpLFxyXG4gICAgICAgICAgICBkID0gKHRoaXMuZGF5cyA+IDAgPyB0aGlzLmRheXMudG9TdHJpbmcoKSArIFRpbWVTcGFuLmRlY2ltYWxzRGVsaW1pdGVyIDogJycpLFxyXG4gICAgICAgICAgICBtID0gdCh0aGlzLm1pbnV0ZXMpLFxyXG4gICAgICAgICAgICBzID0gdCh0aGlzLnNlY29uZHMgKyB0aGlzLm1pbGxpc2Vjb25kcyAvIDEwMDApO1xyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIGQgK1xyXG4gICAgICAgICAgICBoICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgK1xyXG4gICAgICAgICAgICBtICsgVGltZVNwYW4udW5pdHNEZWxpbWl0ZXIgK1xyXG4gICAgICAgICAgICBzKTtcclxuICAgIH07XHJcbiAgICB0aGlzLnZhbHVlT2YgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b192YWx1ZU9mKCkge1xyXG4gICAgICAgIC8vIFJldHVybiB0aGUgdG90YWwgbWlsbGlzZWNvbmRzIGNvbnRhaW5lZCBieSB0aGUgdGltZVxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgIHRoaXMuZGF5cyAqICgyNCAqIDM2MDAwMDApICtcclxuICAgICAgICAgICAgdGhpcy5ob3VycyAqIDM2MDAwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLm1pbnV0ZXMgKiA2MDAwMCArXHJcbiAgICAgICAgICAgIHRoaXMuc2Vjb25kcyAqIDEwMDAgK1xyXG4gICAgICAgICAgICB0aGlzLm1pbGxpc2Vjb25kc1xyXG4gICAgICAgICk7XHJcbiAgICB9O1xyXG59O1xyXG4vKiogSXQgY3JlYXRlcyBhIHRpbWVTcGFuIG9iamVjdCBiYXNlZCBvbiBhIG1pbGxpc2Vjb25kc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbU1pbGxpc2Vjb25kcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21NaWxsaXNlY29uZHMobWlsbGlzZWNvbmRzKSB7XHJcbiAgICB2YXIgbXMgPSBtaWxsaXNlY29uZHMgJSAxMDAwLFxyXG4gICAgICAgIHMgPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDEwMDApICUgNjAsXHJcbiAgICAgICAgbSA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gNjAwMDApICUgNjAsXHJcbiAgICAgICAgaCA9IE1hdGguZmxvb3IobWlsbGlzZWNvbmRzIC8gMzYwMDAwMCkgJSAyNCxcclxuICAgICAgICBkID0gTWF0aC5mbG9vcihtaWxsaXNlY29uZHMgLyAoMzYwMDAwMCAqIDI0KSk7XHJcbiAgICByZXR1cm4gbmV3IFRpbWVTcGFuKGQsIGgsIG0sIHMsIG1zKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIHNlY29uZHNcclxuKiovXHJcblRpbWVTcGFuLmZyb21TZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbVNlY29uZHMoc2Vjb25kcykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbU1pbGxpc2Vjb25kcyhzZWNvbmRzICogMTAwMCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBtaW51dGVzXHJcbioqL1xyXG5UaW1lU3Bhbi5mcm9tTWludXRlcyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX2Zyb21NaW51dGVzKG1pbnV0ZXMpIHtcclxuICAgIHJldHVybiB0aGlzLmZyb21TZWNvbmRzKG1pbnV0ZXMgKiA2MCk7XHJcbn07XHJcbi8qKiBJdCBjcmVhdGVzIGEgdGltZVNwYW4gb2JqZWN0IGJhc2VkIG9uIGEgZGVjaW1hbCBob3Vyc1xyXG4qKi9cclxuVGltZVNwYW4uZnJvbUhvdXJzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbUhvdXJzKGhvdXJzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5mcm9tTWludXRlcyhob3VycyAqIDYwKTtcclxufTtcclxuLyoqIEl0IGNyZWF0ZXMgYSB0aW1lU3BhbiBvYmplY3QgYmFzZWQgb24gYSBkZWNpbWFsIGRheXNcclxuKiovXHJcblRpbWVTcGFuLmZyb21EYXlzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fZnJvbURheXMoZGF5cykge1xyXG4gICAgcmV0dXJuIHRoaXMuZnJvbUhvdXJzKGRheXMgKiAyNCk7XHJcbn07XHJcblxyXG4vLyBGb3Igc3BhbmlzaCBhbmQgZW5nbGlzaCB3b3JrcyBnb29kICc6JyBhcyB1bml0c0RlbGltaXRlciBhbmQgJy4nIGFzIGRlY2ltYWxEZWxpbWl0ZXJcclxuLy8gVE9ETzogdGhpcyBtdXN0IGJlIHNldCBmcm9tIGEgZ2xvYmFsIExDLmkxOG4gdmFyIGxvY2FsaXplZCBmb3IgY3VycmVudCB1c2VyXHJcblRpbWVTcGFuLnVuaXRzRGVsaW1pdGVyID0gJzonO1xyXG5UaW1lU3Bhbi5kZWNpbWFsc0RlbGltaXRlciA9ICcuJztcclxuVGltZVNwYW4ucGFyc2UgPSBmdW5jdGlvbiAoc3RydGltZSkge1xyXG4gICAgc3RydGltZSA9IChzdHJ0aW1lIHx8ICcnKS5zcGxpdCh0aGlzLnVuaXRzRGVsaW1pdGVyKTtcclxuICAgIC8vIEJhZCBzdHJpbmcsIHJldHVybnMgbnVsbFxyXG4gICAgaWYgKHN0cnRpbWUubGVuZ3RoIDwgMilcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAvLyBEZWNvdXBsZWQgdW5pdHM6XHJcbiAgICB2YXIgZCwgaCwgbSwgcywgbXM7XHJcbiAgICBoID0gc3RydGltZVswXTtcclxuICAgIG0gPSBzdHJ0aW1lWzFdO1xyXG4gICAgcyA9IHN0cnRpbWUubGVuZ3RoID4gMiA/IHN0cnRpbWVbMl0gOiAwO1xyXG4gICAgLy8gU3Vic3RyYWN0aW5nIGRheXMgZnJvbSB0aGUgaG91cnMgcGFydCAoZm9ybWF0OiAnZGF5cy5ob3Vycycgd2hlcmUgJy4nIGlzIGRlY2ltYWxzRGVsaW1pdGVyKVxyXG4gICAgaWYgKGguY29udGFpbnModGhpcy5kZWNpbWFsc0RlbGltaXRlcikpIHtcclxuICAgICAgICB2YXIgZGhzcGxpdCA9IGguc3BsaXQodGhpcy5kZWNpbWFsc0RlbGltaXRlcik7XHJcbiAgICAgICAgZCA9IGRoc3BsaXRbMF07XHJcbiAgICAgICAgaCA9IGRoc3BsaXRbMV07XHJcbiAgICB9XHJcbiAgICAvLyBNaWxsaXNlY29uZHMgYXJlIGV4dHJhY3RlZCBmcm9tIHRoZSBzZWNvbmRzIChhcmUgcmVwcmVzZW50ZWQgYXMgZGVjaW1hbCBudW1iZXJzIG9uIHRoZSBzZWNvbmRzIHBhcnQ6ICdzZWNvbmRzLm1pbGxpc2Vjb25kcycgd2hlcmUgJy4nIGlzIGRlY2ltYWxzRGVsaW1pdGVyKVxyXG4gICAgbXMgPSBNYXRoLnJvdW5kKHBhcnNlRmxvYXQocy5yZXBsYWNlKHRoaXMuZGVjaW1hbHNEZWxpbWl0ZXIsICcuJykpICogMTAwMCAlIDEwMDApO1xyXG4gICAgLy8gUmV0dXJuIHRoZSBuZXcgdGltZSBpbnN0YW5jZVxyXG4gICAgcmV0dXJuIG5ldyBUaW1lU3BhbihkLCBoLCBtLCBzLCBtcyk7XHJcbn07XHJcblRpbWVTcGFuLnplcm8gPSBuZXcgVGltZVNwYW4oMCwgMCwgMCwgMCwgMCk7XHJcblRpbWVTcGFuLnByb3RvdHlwZS5pc1plcm8gPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19pc1plcm8oKSB7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICAgIHRoaXMuZGF5cyA9PT0gMCAmJlxyXG4gICAgICAgIHRoaXMuaG91cnMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLm1pbnV0ZXMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLnNlY29uZHMgPT09IDAgJiZcclxuICAgICAgICB0aGlzLm1pbGxpc2Vjb25kcyA9PT0gMFxyXG4gICAgKTtcclxufTtcclxuVGltZVNwYW4ucHJvdG90eXBlLnRvdGFsTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxNaWxsaXNlY29uZHMoKSB7XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZU9mKCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbFNlY29uZHMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbFNlY29uZHMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxNaWxsaXNlY29uZHMoKSAvIDEwMDApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxNaW51dGVzID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG90YWxNaW51dGVzKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnRvdGFsU2Vjb25kcygpIC8gNjApO1xyXG59O1xyXG5UaW1lU3Bhbi5wcm90b3R5cGUudG90YWxIb3VycyA9IGZ1bmN0aW9uIHRpbWVTcGFuX3Byb3RvX3RvdGFsSG91cnMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxNaW51dGVzKCkgLyA2MCk7XHJcbn07XHJcblRpbWVTcGFuLnByb3RvdHlwZS50b3RhbERheXMgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b190b3RhbERheXMoKSB7XHJcbiAgICByZXR1cm4gKHRoaXMudG90YWxIb3VycygpIC8gMjQpO1xyXG59O1xyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBUaW1lU3BhbjsiLCIvKiBFeHRyYSB1dGlsaXRpZXMgYW5kIG1ldGhvZHMgXHJcbiAqL1xyXG52YXIgVGltZVNwYW4gPSByZXF1aXJlKCcuL1RpbWVTcGFuJyk7XHJcbnZhciBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG4vKiogU2hvd3MgdGltZSBhcyBhIGxhcmdlIHN0cmluZyB3aXRoIHVuaXRzIG5hbWVzIGZvciB2YWx1ZXMgZGlmZmVyZW50IHRoYW4gemVyby5cclxuICoqL1xyXG5mdW5jdGlvbiBzbWFydFRpbWUodGltZSkge1xyXG4gICAgdmFyIHIgPSBbXTtcclxuICAgIGlmICh0aW1lLmRheXMgPiAxKVxyXG4gICAgICAgIHIucHVzaCh0aW1lLmRheXMgKyAnIGRheXMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuZGF5cyA9PSAxKVxyXG4gICAgICAgIHIucHVzaCgnMSBkYXknKTtcclxuICAgIGlmICh0aW1lLmhvdXJzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5ob3VycyArICcgaG91cnMnKTtcclxuICAgIGVsc2UgaWYgKHRpbWUuaG91cnMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgaG91cicpO1xyXG4gICAgaWYgKHRpbWUubWludXRlcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUubWludXRlcyArICcgbWludXRlcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5taW51dGVzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIG1pbnV0ZScpO1xyXG4gICAgaWYgKHRpbWUuc2Vjb25kcyA+IDEpXHJcbiAgICAgICAgci5wdXNoKHRpbWUuc2Vjb25kcyArICcgc2Vjb25kcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5zZWNvbmRzID09IDEpXHJcbiAgICAgICAgci5wdXNoKCcxIHNlY29uZCcpO1xyXG4gICAgaWYgKHRpbWUubWlsbGlzZWNvbmRzID4gMSlcclxuICAgICAgICByLnB1c2godGltZS5taWxsaXNlY29uZHMgKyAnIG1pbGxpc2Vjb25kcycpO1xyXG4gICAgZWxzZSBpZiAodGltZS5taWxsaXNlY29uZHMgPT0gMSlcclxuICAgICAgICByLnB1c2goJzEgbWlsbGlzZWNvbmQnKTtcclxuICAgIHJldHVybiByLmpvaW4oJywgJyk7XHJcbn1cclxuXHJcbi8qKiBSb3VuZHMgYSB0aW1lIHRvIHRoZSBuZWFyZXN0IDE1IG1pbnV0ZXMgZnJhZ21lbnQuXHJcbkByb3VuZFRvIHNwZWNpZnkgdGhlIExDLnJvdW5kaW5nVHlwZUVudW0gYWJvdXQgaG93IHRvIHJvdW5kIHRoZSB0aW1lIChkb3duLCBuZWFyZXN0IG9yIHVwKVxyXG4qKi9cclxuZnVuY3Rpb24gcm91bmRUaW1lVG9RdWFydGVySG91cigvKiBUaW1lU3BhbiAqL3RpbWUsIC8qIG1hdGhVdGlscy5yb3VuZGluZ1R5cGVFbnVtICovcm91bmRUbykge1xyXG4gICAgdmFyIHJlc3RGcm9tUXVhcnRlciA9IHRpbWUudG90YWxIb3VycygpICUgMC4yNTtcclxuICAgIHZhciBob3VycyA9IHRpbWUudG90YWxIb3VycygpO1xyXG4gICAgaWYgKHJlc3RGcm9tUXVhcnRlciA+IDAuMCkge1xyXG4gICAgICAgIHN3aXRjaCAocm91bmRUbykge1xyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgICAgIGhvdXJzIC09IHJlc3RGcm9tUXVhcnRlcjtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBjYXNlIG11LnJvdW5kaW5nVHlwZUVudW0uTmVhcmVzdDpcclxuICAgICAgICAgICAgICAgIHZhciBsaW1pdCA9IDAuMjUgLyAyO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3RGcm9tUXVhcnRlciA+PSBsaW1pdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGhvdXJzICs9ICgwLjI1IC0gcmVzdEZyb21RdWFydGVyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaG91cnMgLT0gcmVzdEZyb21RdWFydGVyO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgbXUucm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgICAgIGhvdXJzICs9ICgwLjI1IC0gcmVzdEZyb21RdWFydGVyKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBUaW1lU3Bhbi5mcm9tSG91cnMoaG91cnMpO1xyXG59XHJcblxyXG4vLyBFeHRlbmQgYSBnaXZlbiBUaW1lU3BhbiBvYmplY3Qgd2l0aCB0aGUgRXh0cmEgbWV0aG9kc1xyXG5mdW5jdGlvbiBwbHVnSW4oVGltZVNwYW4pIHtcclxuICAgIFRpbWVTcGFuLnByb3RvdHlwZS50b1NtYXJ0U3RyaW5nID0gZnVuY3Rpb24gdGltZVNwYW5fcHJvdG9fdG9TbWFydFN0cmluZygpIHsgcmV0dXJuIHNtYXJ0VGltZSh0aGlzKTsgfTtcclxuICAgIFRpbWVTcGFuLnByb3RvdHlwZS5yb3VuZFRvUXVhcnRlckhvdXIgPSBmdW5jdGlvbiB0aW1lU3Bhbl9wcm90b19yb3VuZFRvUXVhcnRlckhvdXIoKSB7IHJldHVybiByb3VuZFRpbWVUb1F1YXJ0ZXJIb3VyLmNhbGwodGhpcywgcGFyYW1ldGVycyk7IH07XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIHNtYXJ0VGltZTogc21hcnRUaW1lLFxyXG4gICAgICAgIHJvdW5kVG9RdWFydGVySG91cjogcm91bmRUaW1lVG9RdWFydGVySG91cixcclxuICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgfTtcclxuIiwiLyoqXHJcbiAgIEFQSSBmb3IgYXV0b21hdGljIGNyZWF0aW9uIG9mIGxhYmVscyBmb3IgVUkgU2xpZGVycyAoanF1ZXJ5LXVpKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHRvb2x0aXBzID0gcmVxdWlyZSgnLi90b29sdGlwcycpLFxyXG4gICAgbXUgPSByZXF1aXJlKCcuL21hdGhVdGlscycpLFxyXG4gICAgVGltZVNwYW4gPSByZXF1aXJlKCcuL1RpbWVTcGFuJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuLyoqIENyZWF0ZSBsYWJlbHMgZm9yIGEganF1ZXJ5LXVpLXNsaWRlci5cclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZShzbGlkZXIpIHtcclxuICAgIC8vIHJlbW92ZSBvbGQgb25lczpcclxuICAgIHZhciBvbGQgPSBzbGlkZXIuc2libGluZ3MoJy51aS1zbGlkZXItbGFiZWxzJykuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKCQodGhpcykuZGF0YSgndWktc2xpZGVyJykuZ2V0KDApID09IHNsaWRlci5nZXQoMCkpO1xyXG4gICAgfSkucmVtb3ZlKCk7XHJcbiAgICAvLyBDcmVhdGUgbGFiZWxzIGNvbnRhaW5lclxyXG4gICAgdmFyIGxhYmVscyA9ICQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWxzXCIvPicpO1xyXG4gICAgbGFiZWxzLmRhdGEoJ3VpLXNsaWRlcicsIHNsaWRlcik7XHJcblxyXG4gICAgLy8gU2V0dXAgb2YgdXNlZnVsIHZhcnMgZm9yIGxhYmVsIGNyZWF0aW9uXHJcbiAgICB2YXIgbWF4ID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ21heCcpLFxyXG4gICAgICAgIG1pbiA9IHNsaWRlci5zbGlkZXIoJ29wdGlvbicsICdtaW4nKSxcclxuICAgICAgICBzdGVwID0gc2xpZGVyLnNsaWRlcignb3B0aW9uJywgJ3N0ZXAnKSxcclxuICAgICAgICBzdGVwcyA9IE1hdGguZmxvb3IoKG1heCAtIG1pbikgLyBzdGVwKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBhbmQgcG9zaXRpb25pbmcgbGFiZWxzXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBzdGVwczsgaSsrKSB7XHJcbiAgICAgICAgLy8gQ3JlYXRlIGxhYmVsXHJcbiAgICAgICAgdmFyIGxibCA9ICQoJzxkaXYgY2xhc3M9XCJ1aS1zbGlkZXItbGFiZWxcIj48c3BhbiBjbGFzcz1cInVpLXNsaWRlci1sYWJlbC10ZXh0XCIvPjwvZGl2PicpO1xyXG4gICAgICAgIC8vIFNldHVwIGxhYmVsIHdpdGggaXRzIHZhbHVlXHJcbiAgICAgICAgdmFyIGxhYmVsVmFsdWUgPSBtaW4gKyBpICogc3RlcDtcclxuICAgICAgICBsYmwuY2hpbGRyZW4oJy51aS1zbGlkZXItbGFiZWwtdGV4dCcpLnRleHQobGFiZWxWYWx1ZSk7XHJcbiAgICAgICAgbGJsLmRhdGEoJ3VpLXNsaWRlci12YWx1ZScsIGxhYmVsVmFsdWUpO1xyXG4gICAgICAgIC8vIFBvc2l0aW9uYXRlXHJcbiAgICAgICAgcG9zaXRpb25hdGUobGJsLCBpLCBzdGVwcyk7XHJcbiAgICAgICAgLy8gQWRkIHRvIGNvbnRhaW5lclxyXG4gICAgICAgIGxhYmVscy5hcHBlbmQobGJsKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBIYW5kbGVyIGZvciBsYWJlbHMgY2xpY2sgdG8gc2VsZWN0IGl0cyBwb3NpdGlvbiB2YWx1ZVxyXG4gICAgbGFiZWxzLm9uKCdjbGljaycsICcudWktc2xpZGVyLWxhYmVsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWwgPSAkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlci12YWx1ZScpLFxyXG4gICAgICAgICAgICBzbGlkZXIgPSAkKHRoaXMpLnBhcmVudCgpLmRhdGEoJ3VpLXNsaWRlcicpO1xyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgdmFsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluc2VydCBsYWJlbHMgYXMgYSBzaWJsaW5nIG9mIHRoZSBzbGlkZXIgKGNhbm5vdCBiZSBpbnNlcnRlZCBpbnNpZGUpXHJcbiAgICBzbGlkZXIuYWZ0ZXIobGFiZWxzKTtcclxufVxyXG5cclxuLyoqIFBvc2l0aW9uYXRlIHRvIHRoZSBjb3JyZWN0IHBvc2l0aW9uIGFuZCB3aWR0aCBhbiBVSSBsYWJlbCBhdCBAbGJsXHJcbmZvciB0aGUgcmVxdWlyZWQgcGVyY2VudGFnZS13aWR0aCBAc3dcclxuKiovXHJcbmZ1bmN0aW9uIHBvc2l0aW9uYXRlKGxibCwgaSwgc3RlcHMpIHtcclxuICAgIHZhciBzdyA9IDEwMCAvIHN0ZXBzO1xyXG4gICAgdmFyIGxlZnQgPSBpICogc3cgLSBzdyAqIDAuNSxcclxuICAgICAgICByaWdodCA9IDEwMCAtIGxlZnQgLSBzdyxcclxuICAgICAgICBhbGlnbiA9ICdjZW50ZXInO1xyXG4gICAgaWYgKGkgPT09IDApIHtcclxuICAgICAgICBhbGlnbiA9ICdsZWZ0JztcclxuICAgICAgICBsZWZ0ID0gMDtcclxuICAgIH0gZWxzZSBpZiAoaSA9PSBzdGVwcykge1xyXG4gICAgICAgIGFsaWduID0gJ3JpZ2h0JztcclxuICAgICAgICByaWdodCA9IDA7XHJcbiAgICB9XHJcbiAgICBsYmwuY3NzKHtcclxuICAgICAgICAndGV4dC1hbGlnbic6IGFsaWduLFxyXG4gICAgICAgIGxlZnQ6IGxlZnQgKyAnJScsXHJcbiAgICAgICAgcmlnaHQ6IHJpZ2h0ICsgJyUnXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIFVwZGF0ZSB0aGUgdmlzaWJpbGl0eSBvZiBsYWJlbHMgb2YgYSBqcXVlcnktdWktc2xpZGVyIGRlcGVuZGluZyBpZiB0aGV5IGZpdCBpbiB0aGUgYXZhaWxhYmxlIHNwYWNlLlxyXG5TbGlkZXIgbmVlZHMgdG8gYmUgdmlzaWJsZS5cclxuKiovXHJcbmZ1bmN0aW9uIHVwZGF0ZShzbGlkZXIpIHtcclxuICAgIC8vIEdldCBsYWJlbHMgZm9yIHNsaWRlclxyXG4gICAgdmFyIGxhYmVsc19jID0gc2xpZGVyLnNpYmxpbmdzKCcudWktc2xpZGVyLWxhYmVscycpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICgkKHRoaXMpLmRhdGEoJ3VpLXNsaWRlcicpLmdldCgwKSA9PSBzbGlkZXIuZ2V0KDApKTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGxhYmVscyA9IGxhYmVsc19jLmZpbmQoJy51aS1zbGlkZXItbGFiZWwtdGV4dCcpO1xyXG5cclxuICAgIC8vIEFwcGx5IGF1dG9zaXplXHJcbiAgICBpZiAoKHNsaWRlci5kYXRhKCdzbGlkZXItYXV0b3NpemUnKSB8fCBmYWxzZSkudG9TdHJpbmcoKSA9PSAndHJ1ZScpXHJcbiAgICAgICAgYXV0b3NpemUoc2xpZGVyLCBsYWJlbHMpO1xyXG5cclxuICAgIC8vIEdldCBhbmQgYXBwbHkgbGF5b3V0XHJcbiAgICB2YXIgbGF5b3V0X25hbWUgPSBzbGlkZXIuZGF0YSgnc2xpZGVyLWxhYmVscy1sYXlvdXQnKSB8fCAnc3RhbmRhcmQnLFxyXG4gICAgICAgIGxheW91dCA9IGxheW91dF9uYW1lIGluIGxheW91dHMgPyBsYXlvdXRzW2xheW91dF9uYW1lXSA6IGxheW91dHMuc3RhbmRhcmQ7XHJcbiAgICBsYWJlbHNfYy5hZGRDbGFzcygnbGF5b3V0LScgKyBsYXlvdXRfbmFtZSk7XHJcbiAgICBsYXlvdXQoc2xpZGVyLCBsYWJlbHNfYywgbGFiZWxzKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdG9vbHRpcHNcclxuICAgIHRvb2x0aXBzLmNyZWF0ZVRvb2x0aXAobGFiZWxzX2MuY2hpbGRyZW4oKSwge1xyXG4gICAgICAgIHRpdGxlOiBmdW5jdGlvbiAoKSB7IHJldHVybiAkKHRoaXMpLnRleHQoKTsgfVxyXG4gICAgICAgICwgcGVyc2lzdGVudDogdHJ1ZVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGF1dG9zaXplKHNsaWRlciwgbGFiZWxzKSB7XHJcbiAgICB2YXIgdG90YWxfd2lkdGggPSAwO1xyXG4gICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRvdGFsX3dpZHRoICs9ICQodGhpcykub3V0ZXJXaWR0aCh0cnVlKTtcclxuICAgIH0pO1xyXG4gICAgdmFyIGMgPSBzbGlkZXIuY2xvc2VzdCgnLnVpLXNsaWRlci1jb250YWluZXInKSxcclxuICAgICAgICBtYXggPSBwYXJzZUZsb2F0KGMuY3NzKCdtYXgtd2lkdGgnKSksXHJcbiAgICAgICAgbWluID0gcGFyc2VGbG9hdChjLmNzcygnbWluLXdpZHRoJykpO1xyXG4gICAgaWYgKG1heCAhPSBOdW1iZXIuTmFOICYmIHRvdGFsX3dpZHRoID4gbWF4KVxyXG4gICAgICAgIHRvdGFsX3dpZHRoID0gbWF4O1xyXG4gICAgaWYgKG1pbiAhPSBOdW1iZXIuTmFOICYmIHRvdGFsX3dpZHRoIDwgbWluKVxyXG4gICAgICAgIHRvdGFsX3dpZHRoID0gbWluO1xyXG4gICAgYy53aWR0aCh0b3RhbF93aWR0aCk7XHJcbn1cclxuXHJcbi8qKiBTZXQgb2YgZGlmZmVyZW50IGxheW91dHMgZm9yIGxhYmVscywgYWxsb3dpbmcgZGlmZmVyZW50IGtpbmRzIG9mIFxyXG5wbGFjZW1lbnQgYW5kIHZpc3VhbGl6YXRpb24gdXNpbmcgdGhlIHNsaWRlciBkYXRhIG9wdGlvbiAnbGFiZWxzLWxheW91dCcuXHJcblVzZWQgYnkgJ3VwZGF0ZScsIGFsbW9zdCB0aGUgJ3N0YW5kYXJkJyBtdXN0IGV4aXN0IGFuZCBjYW4gYmUgaW5jcmVhc2VkXHJcbmV4dGVybmFsbHlcclxuKiovXHJcbnZhciBsYXlvdXRzID0ge307XHJcbi8qKiBTaG93IHRoZSBtYXhpbXVtIG51bWJlciBvZiBsYWJlbHMgaW4gZXF1YWxseSBzaXplZCBnYXBzIGJ1dFxyXG50aGUgbGFzdCBsYWJlbCB0aGF0IGlzIGVuc3VyZWQgdG8gYmUgc2hvd2VkIGV2ZW4gaWYgaXQgY3JlYXRlc1xyXG5hIGhpZ2hlciBnYXAgd2l0aCB0aGUgcHJldmlvdXMgb25lLlxyXG4qKi9cclxubGF5b3V0cy5zdGFuZGFyZCA9IGZ1bmN0aW9uIHN0YW5kYXJkX2xheW91dChzbGlkZXIsIGxhYmVsc19jLCBsYWJlbHMpIHtcclxuICAgIC8vIENoZWNrIGlmIHRoZXJlIGFyZSBtb3JlIGxhYmVscyB0aGFuIGF2YWlsYWJsZSBzcGFjZVxyXG4gICAgLy8gR2V0IG1heGltdW0gbGFiZWwgd2lkdGhcclxuICAgIHZhciBpdGVtX3dpZHRoID0gMDtcclxuICAgIGxhYmVscy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdHcgPSAkKHRoaXMpLm91dGVyV2lkdGgodHJ1ZSk7XHJcbiAgICAgICAgaWYgKHR3ID49IGl0ZW1fd2lkdGgpXHJcbiAgICAgICAgICAgIGl0ZW1fd2lkdGggPSB0dztcclxuICAgIH0pO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgd2lkdGgsIGlmIG5vdCwgZWxlbWVudCBpcyBub3QgdmlzaWJsZSBjYW5ub3QgYmUgY29tcHV0ZWRcclxuICAgIGlmIChpdGVtX3dpZHRoID4gMCkge1xyXG4gICAgICAgIC8vIEdldCB0aGUgcmVxdWlyZWQgc3RlcHBpbmcgb2YgbGFiZWxzXHJcbiAgICAgICAgdmFyIGxhYmVsc19zdGVwID0gTWF0aC5jZWlsKGl0ZW1fd2lkdGggLyAoc2xpZGVyLndpZHRoKCkgLyBsYWJlbHMubGVuZ3RoKSksXHJcbiAgICAgICAgbGFiZWxzX3N0ZXBzID0gbGFiZWxzLmxlbmd0aCAvIGxhYmVsc19zdGVwO1xyXG4gICAgICAgIGlmIChsYWJlbHNfc3RlcCA+IDEpIHtcclxuICAgICAgICAgICAgLy8gSGlkZSB0aGUgbGFiZWxzIG9uIHBvc2l0aW9ucyBvdXQgb2YgdGhlIHN0ZXBcclxuICAgICAgICAgICAgdmFyIG5ld2kgPSAwLFxyXG4gICAgICAgICAgICAgICAgbGltaXQgPSBsYWJlbHMubGVuZ3RoIC0gMSAtIGxhYmVsc19zdGVwO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhYmVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGxibCA9ICQobGFiZWxzW2ldKTtcclxuICAgICAgICAgICAgICAgIGlmICgoaSArIDEpIDwgbGFiZWxzLmxlbmd0aCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgaSAlIGxhYmVsc19zdGVwIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgaSA+IGxpbWl0KSlcclxuICAgICAgICAgICAgICAgICAgICBsYmwuaGlkZSgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IGxibC5zaG93KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyByZXBvc2l0aW9uYXRlIHBhcmVudFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uYXRlKHBhcmVudCwgbmV3aSwgbGFiZWxzX3N0ZXBzKTtcclxuICAgICAgICAgICAgICAgICAgICBuZXdpKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcbi8qKiBTaG93IGxhYmVscyBudW1iZXIgdmFsdWVzIGZvcm1hdHRlZCBhcyBob3Vycywgd2l0aCBvbmx5XHJcbmludGVnZXIgaG91cnMgYmVpbmcgc2hvd2VkLCB0aGUgbWF4aW11bSBudW1iZXIgb2YgaXQuXHJcbioqL1xyXG5sYXlvdXRzLmhvdXJzID0gZnVuY3Rpb24gaG91cnNfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscywgc2hvd19hbGwpIHtcclxuICAgIHZhciBpbnRMYWJlbHMgPSBzbGlkZXIuZmluZCgnLmludGVnZXItaG91cicpO1xyXG4gICAgaWYgKCFpbnRMYWJlbHMubGVuZ3RoKSB7XHJcbiAgICAgICAgbGFiZWxzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICBpZiAoISR0LmRhdGEoJ2hvdXItcHJvY2Vzc2VkJykpIHtcclxuICAgICAgICAgICAgICAgIHZhciB2ID0gcGFyc2VGbG9hdCgkdC50ZXh0KCkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHYgIT0gTnVtYmVyLk5hTikge1xyXG4gICAgICAgICAgICAgICAgICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2ICUgMSA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2RlY2ltYWwtaG91cicpLmhpZGUoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodiAlIDAuNSA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnBhcmVudCgpLmFkZENsYXNzKCdzdHJvbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQudGV4dChUaW1lU3Bhbi5mcm9tSG91cnModikudG9TaG9ydFN0cmluZygpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5hZGRDbGFzcygnaW50ZWdlci1ob3VyJykuc2hvdygpLnBhcmVudCgpLmFkZENsYXNzKCd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGludExhYmVscyA9IGludExhYmVscy5hZGQoJHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ2hvdXItcHJvY2Vzc2VkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChzaG93X2FsbCAhPT0gdHJ1ZSlcclxuICAgICAgICBsYXlvdXRzLnN0YW5kYXJkKHNsaWRlciwgaW50TGFiZWxzLnBhcmVudCgpLCBpbnRMYWJlbHMpO1xyXG59O1xyXG5sYXlvdXRzWydhbGwtdmFsdWVzJ10gPSBmdW5jdGlvbiBhbGxfbGF5b3V0KHNsaWRlciwgbGFiZWxzX2MsIGxhYmVscykge1xyXG4gICAgLy8gU2hvd2luZyBhbGwgbGFiZWxzXHJcbiAgICBsYWJlbHNfYy5zaG93KCkuYWRkQ2xhc3MoJ3Zpc2libGUnKS5jaGlsZHJlbigpLnNob3coKTtcclxufTtcclxubGF5b3V0c1snYWxsLWhvdXJzJ10gPSBmdW5jdGlvbiBhbGxfaG91cnNfbGF5b3V0KCkge1xyXG4gICAgLy8gSnVzdCB1c2UgaG91cnMgbGF5b3V0IGJ1dCBzaG93aW5nIGFsbCBpbnRlZ2VyIGhvdXJzXHJcbiAgICBBcnJheS5wcm90b3R5cGUucHVzaC5jYWxsKGFyZ3VtZW50cywgdHJ1ZSk7XHJcbiAgICBsYXlvdXRzLmhvdXJzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGNyZWF0ZTogY3JlYXRlLFxyXG4gICAgdXBkYXRlOiB1cGRhdGUsXHJcbiAgICBsYXlvdXRzOiBsYXlvdXRzXHJcbn07XHJcbiIsIi8qIFNldCBvZiBjb21tb24gTEMgY2FsbGJhY2tzIGZvciBtb3N0IEFqYXggb3BlcmF0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgdmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vLyBBS0E6IGFqYXhFcnJvclBvcHVwSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uRXJyb3IoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAvLyBJZiBpcyBhIGNvbm5lY3Rpb24gYWJvcnRlZCwgbm8gc2hvdyBtZXNzYWdlLlxyXG4gICAgLy8gcmVhZHlTdGF0ZSBkaWZmZXJlbnQgdG8gJ2RvbmU6NCcgbWVhbnMgYWJvcnRlZCB0b28sIFxyXG4gICAgLy8gYmVjYXVzZSB3aW5kb3cgYmVpbmcgY2xvc2VkL2xvY2F0aW9uIGNoYW5nZWRcclxuICAgIGlmIChtZXNzYWdlID09ICdhYm9ydCcgfHwgangucmVhZHlTdGF0ZSAhPSA0KVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICB2YXIgbSA9IG1lc3NhZ2U7XHJcbiAgICB2YXIgaWZyYW1lID0gbnVsbDtcclxuICAgIHNpemUgPSBwb3B1cC5zaXplKCdsYXJnZScpO1xyXG4gICAgc2l6ZS5oZWlnaHQgLT0gMzQ7XHJcbiAgICBpZiAobSA9PSAnZXJyb3InKSB7XHJcbiAgICAgICAgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGp4LnJlc3BvbnNlVGV4dCwgc2l6ZSk7XHJcbiAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICBtID0gbnVsbDtcclxuICAgIH0gIGVsc2VcclxuICAgICAgICBtID0gbSArIFwiOyBcIiArIGV4O1xyXG5cclxuICAgIC8vIEJsb2NrIGFsbCB3aW5kb3csIG5vdCBvbmx5IGN1cnJlbnQgZWxlbWVudFxyXG4gICAgJC5ibG9ja1VJKGVycm9yQmxvY2sobSwgbnVsbCwgcG9wdXAuc3R5bGUoc2l6ZSkpKTtcclxuICAgIGlmIChpZnJhbWUpXHJcbiAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAkKCcuYmxvY2tVSSAuY2xvc2UtcG9wdXAnKS5jbGljayhmdW5jdGlvbiAoKSB7ICQudW5ibG9ja1VJKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25Db21wbGV0ZSgpIHtcclxuICAgIC8vIERpc2FibGUgbG9hZGluZ1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ3RpbWVyIHx8IHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIC8vIFVuYmxvY2tcclxuICAgIGlmICh0aGlzLmF1dG9VbmJsb2NrTG9hZGluZykge1xyXG4gICAgICAgIC8vIERvdWJsZSB1bi1sb2NrLCBiZWNhdXNlIGFueSBvZiB0aGUgdHdvIHN5c3RlbXMgY2FuIGJlaW5nIHVzZWQ6XHJcbiAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5ib3gpO1xyXG4gICAgICAgIHRoaXMuYm94LnVuYmxvY2soKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICAvLyBTdXBwb3J0ZWQgdGhlIGdlbmVyaWMgY3R4LmVsZW1lbnQgZnJvbSBqcXVlcnkucmVsb2FkXHJcbiAgICBpZiAoY3R4LmVsZW1lbnQpIGN0eC5mb3JtID0gY3R4LmVsZW1lbnQ7XHJcbiAgICAvLyBTcGVjaWZpYyBzdHVmZiBvZiBhamF4Rm9ybXNcclxuICAgIGlmICghY3R4LmZvcm0pIGN0eC5mb3JtID0gJCh0aGlzKTtcclxuICAgIGlmICghY3R4LmJveCkgY3R4LmJveCA9IGN0eC5mb3JtO1xyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gRG8gSlNPTiBhY3Rpb24gYnV0IGlmIGlzIG5vdCBKU09OIG9yIHZhbGlkLCBtYW5hZ2UgYXMgSFRNTDpcclxuICAgIGlmICghZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpKSB7XHJcbiAgICAgICAgLy8gUG9zdCAnbWF5YmUnIHdhcyB3cm9uZywgaHRtbCB3YXMgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IFxyXG4gICAgICAgIC8vIGZvcm0gY29udGFpbmVyOiB0aGUgYWpheC1ib3guXHJcblxyXG4gICAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgICAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgICAgICAvLyBBdm9pZCBlbXB0eSBkb2N1bWVudHMgYmVpbmcgcGFyc2VkIChyYWlzZSBlcnJvcilcclxuICAgICAgICBpZiAoJC50cmltKGRhdGEpKSB7XHJcbiAgICAgICAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhIG1hbGZvcm1lZCBkb2N1bWVudCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZvciAncmVsb2FkJyBzdXBwb3J0LCBjaGVjayB0b28gdGhlIGNvbnRleHQubW9kZSwgYW5kIGJvdGggcmVsb2FkIG9yIGFqYXhGb3JtcyBjaGVjayBkYXRhIGF0dHJpYnV0ZSB0b29cclxuICAgICAgICBjdHguYm94SXNDb250YWluZXIgPSBjdHguYm94SXNDb250YWluZXI7XHJcbiAgICAgICAgdmFyIHJlcGxhY2VCb3hDb250ZW50ID1cclxuICAgICAgICAgIChjdHgub3B0aW9ucyAmJiBjdHgub3B0aW9ucy5tb2RlID09PSAncmVwbGFjZS1jb250ZW50JykgfHxcclxuICAgICAgICAgIGN0eC5ib3guZGF0YSgncmVsb2FkLW1vZGUnKSA9PT0gJ3JlcGxhY2UtY29udGVudCc7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZSByZXR1cm5lZCBlbGVtZW50IGlzIHRoZSBhamF4LWJveCwgaWYgbm90LCBmaW5kXHJcbiAgICAgICAgLy8gdGhlIGVsZW1lbnQgaW4gdGhlIG5ld2h0bWw6XHJcbiAgICAgICAgdmFyIGpiID0gbmV3aHRtbC5maWx0ZXIoJy5hamF4LWJveCcpO1xyXG4gICAgICAgIGlmIChqYi5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgaWYgKCFjdHguYm94SXNDb250YWluZXIgJiYgIWpiLmlzKCcuYWpheC1ib3gnKSlcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sLmZpbmQoJy5hamF4LWJveDplcSgwKScpO1xyXG4gICAgICAgIGlmICghamIgfHwgamIubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGFqYXgtYm94LCB1c2UgYWxsIGVsZW1lbnQgcmV0dXJuZWQ6XHJcbiAgICAgICAgICAgIGpiID0gbmV3aHRtbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZXBsYWNlQm94Q29udGVudCkge1xyXG4gICAgICAgICAgLy8gUmVwbGFjZSB0aGUgYm94IGNvbnRlbnQgd2l0aCB0aGUgY29udGVudCBvZiB0aGUgcmV0dXJuZWQgYm94XHJcbiAgICAgICAgICAvLyBvciBhbGwgaWYgdGhlcmUgaXMgbm8gYWpheC1ib3ggaW4gdGhlIHJlc3VsdC5cclxuICAgICAgICAgIGN0eC5ib3guZW1wdHkoKS5hcHBlbmQoamIuaXMoJy5hamF4LWJveCcpID8gamIuY29udGVudHMoKSA6IGpiKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGN0eC5ib3hJc0NvbnRhaW5lcikge1xyXG4gICAgICAgICAgICAvLyBqYiBpcyBjb250ZW50IG9mIHRoZSBib3ggY29udGFpbmVyOlxyXG4gICAgICAgICAgICBjdHguYm94Lmh0bWwoamIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGJveCBpcyBjb250ZW50IHRoYXQgbXVzdCBiZSByZXBsYWNlZCBieSB0aGUgbmV3IGNvbnRlbnQ6XHJcbiAgICAgICAgICAgIGN0eC5ib3gucmVwbGFjZVdpdGgoamIpO1xyXG4gICAgICAgICAgICAvLyBhbmQgcmVmcmVzaCB0aGUgcmVmZXJlbmNlIHRvIGJveCB3aXRoIHRoZSBuZXcgZWxlbWVudFxyXG4gICAgICAgICAgICBjdHguYm94ID0gamI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJdCBzdXBwb3J0cyBub3JtYWwgYWpheCBmb3JtcyBhbmQgc3ViZm9ybXMgdGhyb3VnaCBmaWVsZHNldC5hamF4XHJcbiAgICAgICAgaWYgKGN0eC5ib3guaXMoJ2Zvcm0uYWpheCcpIHx8IGN0eC5ib3guaXMoJ2ZpZWxkc2V0LmFqYXgnKSlcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveDtcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmb3JtLmFqYXg6ZXEoMCknKTtcclxuICAgICAgICAgIGlmIChjdHguZm9ybS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGN0eC5mb3JtID0gY3R4LmJveC5maW5kKCdmaWVsZHNldC5hamF4OmVxKDApJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDaGFuZ2Vzbm90aWZpY2F0aW9uIGFmdGVyIGFwcGVuZCBlbGVtZW50IHRvIGRvY3VtZW50LCBpZiBub3Qgd2lsbCBub3Qgd29yazpcclxuICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZCAoaWYgd2FzIHNhdmVkIGJ1dCBzZXJ2ZXIgZGVjaWRlIHJldHVybnMgaHRtbCBpbnN0ZWFkIGEgSlNPTiBjb2RlLCBwYWdlIHNjcmlwdCBtdXN0IGRvICdyZWdpc3RlclNhdmUnIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlKTpcclxuICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlckNoYW5nZShcclxuICAgICAgICAgICAgICAgIGN0eC5mb3JtLmdldCgwKSxcclxuICAgICAgICAgICAgICAgIGN0eC5jaGFuZ2VkRWxlbWVudHNcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gTW92ZSBmb2N1cyB0byB0aGUgZXJyb3JzIGFwcGVhcmVkIG9uIHRoZSBwYWdlIChpZiB0aGVyZSBhcmUpOlxyXG4gICAgICAgIHZhciB2YWxpZGF0aW9uU3VtbWFyeSA9IGpiLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJyk7XHJcbiAgICAgICAgaWYgKHZhbGlkYXRpb25TdW1tYXJ5Lmxlbmd0aClcclxuICAgICAgICAgIG1vdmVGb2N1c1RvKHZhbGlkYXRpb25TdW1tYXJ5KTtcclxuICAgICAgICAvLyBUT0RPOiBJdCBzZWVtcyB0aGF0IGl0IHJldHVybnMgYSBkb2N1bWVudC1mcmFnbWVudCBpbnN0ZWFkIG9mIGEgZWxlbWVudCBhbHJlYWR5IGluIGRvY3VtZW50XHJcbiAgICAgICAgLy8gZm9yIGN0eC5mb3JtIChtYXliZSBqYiB0b28/KSB3aGVuIHVzaW5nICogY3R4LmJveC5kYXRhKCdyZWxvYWQtbW9kZScpID09PSAncmVwbGFjZS1jb250ZW50JyAqIFxyXG4gICAgICAgIC8vIChtYXliZSBvbiBvdGhlciBjYXNlcyB0b28/KS5cclxuICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIFtqYiwgY3R4LmZvcm0sIGp4XSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFV0aWxpdHkgZm9yIEpTT04gYWN0aW9uc1xyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgbWVzc2FnZSwgZGF0YSkge1xyXG4gICAgLy8gVW5ibG9jayBsb2FkaW5nOlxyXG4gICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCBjdHguZm9ybS5kYXRhKCdzdWNjZXNzLXBvc3QtbWVzc2FnZScpIHx8ICdEb25lISc7XHJcbiAgICBjdHguYm94LmJsb2NrKGluZm9CbG9jayhtZXNzYWdlLCB7XHJcbiAgICAgICAgY3NzOiBwb3B1cC5zdHlsZShwb3B1cC5zaXplKCdzbWFsbCcpKVxyXG4gICAgfSkpXHJcbiAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1wb3B1cCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjdHguYm94LnVuYmxvY2soKTtcclxuICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTsgXHJcbiAgICB9KTtcclxuICAgIC8vIERvIG5vdCB1bmJsb2NrIGluIGNvbXBsZXRlIGZ1bmN0aW9uIVxyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gc2hvd09rR29Qb3B1cChjdHgsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG5cclxuICAgIHZhciBjb250ZW50ID0gJCgnPGRpdiBjbGFzcz1cIm9rLWdvLWJveFwiLz4nKTtcclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxzcGFuIGNsYXNzPVwic3VjY2Vzcy1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLlN1Y2Nlc3NNZXNzYWdlKSk7XHJcbiAgICBpZiAoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSlcclxuICAgICAgICBjb250ZW50LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwiYWRkaXRpb25hbC1tZXNzYWdlXCIvPicpLmFwcGVuZChkYXRhLkFkZGl0aW9uYWxNZXNzYWdlKSk7XHJcblxyXG4gICAgdmFyIG9rQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gb2stYWN0aW9uIGNsb3NlLWFjdGlvblwiIGhyZWY9XCIjb2tcIi8+JykuYXBwZW5kKGRhdGEuT2tMYWJlbCk7XHJcbiAgICB2YXIgZ29CdG4gPSAnJztcclxuICAgIGlmIChkYXRhLkdvVVJMICYmIGRhdGEuR29MYWJlbCkge1xyXG4gICAgICAgIGdvQnRuID0gJCgnPGEgY2xhc3M9XCJhY3Rpb24gZ28tYWN0aW9uXCIvPicpLmF0dHIoJ2hyZWYnLCBkYXRhLkdvVVJMKS5hcHBlbmQoZGF0YS5Hb0xhYmVsKTtcclxuICAgICAgICAvLyBGb3JjaW5nIHRoZSAnY2xvc2UtYWN0aW9uJyBpbiBzdWNoIGEgd2F5IHRoYXQgZm9yIGludGVybmFsIGxpbmtzIHRoZSBwb3B1cCBnZXRzIGNsb3NlZCBpbiBhIHNhZmUgd2F5OlxyXG4gICAgICAgIGdvQnRuLmNsaWNrKGZ1bmN0aW9uICgpIHsgb2tCdG4uY2xpY2soKTsgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTsgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFjdGlvbnMgY2xlYXJmaXhcIi8+JykuYXBwZW5kKG9rQnRuKS5hcHBlbmQoZ29CdG4pKTtcclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGNvbnRlbnQsIGN0eC5ib3gsIG51bGwsIHtcclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpIHtcclxuICAgIC8vIElmIGlzIGEgSlNPTiByZXN1bHQ6XHJcbiAgICBpZiAodHlwZW9mIChkYXRhKSA9PT0gJ29iamVjdCcpIHtcclxuICAgICAgICBpZiAoY3R4LmJveClcclxuICAgICAgICAgICAgLy8gQ2xlYW4gcHJldmlvdXMgdmFsaWRhdGlvbiBlcnJvcnNcclxuICAgICAgICAgICAgdmFsaWRhdGlvbi5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY3R4LmJveCk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDA6IGdlbmVyYWwgc3VjY2VzcyBjb2RlLCBzaG93IG1lc3NhZ2Ugc2F5aW5nIHRoYXQgJ2FsbCB3YXMgZmluZSdcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDE6IGRvIGEgcmVkaXJlY3RcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAxKSB7XHJcbiAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDIpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDI6IHNob3cgbG9naW4gcG9wdXAgKHdpdGggdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIHBvcHVwKGRhdGEuUmVzdWx0LCB7IHdpZHRoOiA0MTAsIGhlaWdodDogMzIwIH0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDMpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDM6IHJlbG9hZCBjdXJyZW50IHBhZ2UgY29udGVudCB0byB0aGUgZ2l2ZW4gdXJsIGF0IGRhdGEuUmVzdWx0KVxyXG4gICAgICAgICAgICAvLyBOb3RlOiB0byByZWxvYWQgc2FtZSB1cmwgcGFnZSBjb250ZW50LCBpcyBiZXR0ZXIgcmV0dXJuIHRoZSBodG1sIGRpcmVjdGx5IGZyb21cclxuICAgICAgICAgICAgLy8gdGhpcyBhamF4IHNlcnZlciByZXF1ZXN0LlxyXG4gICAgICAgICAgICAvL2NvbnRhaW5lci51bmJsb2NrKCk7IGlzIGJsb2NrZWQgYW5kIHVuYmxvY2tlZCBhZ2FpbiBieSB0aGUgcmVsb2FkIG1ldGhvZDpcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBjdHguYm94LnJlbG9hZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNCkge1xyXG4gICAgICAgICAgICAvLyBTaG93IFN1Y2Nlc3NNZXNzYWdlLCBhdHRhY2hpbmcgYW5kIGV2ZW50IGhhbmRsZXIgdG8gZ28gdG8gUmVkaXJlY3RVUkxcclxuICAgICAgICAgICAgY3R4LmJveC5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHJlZGlyZWN0VG8oZGF0YS5SZXN1bHQuUmVkaXJlY3RVUkwpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc2hvd1N1Y2Nlc3NNZXNzYWdlKGN0eCwgZGF0YS5SZXN1bHQuU3VjY2Vzc01lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDUpIHtcclxuICAgICAgICAgICAgLy8gQ2hhbmdlIG1haW4tYWN0aW9uIGJ1dHRvbiBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgYnRuID0gY3R4LmZvcm0uZmluZCgnLm1haW4tYWN0aW9uJyk7XHJcbiAgICAgICAgICAgIHZhciBkbXNnID0gYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpO1xyXG4gICAgICAgICAgICBpZiAoIWRtc2cpXHJcbiAgICAgICAgICAgICAgICBidG4uZGF0YSgnZGVmYXVsdC10ZXh0JywgYnRuLnRleHQoKSk7XHJcbiAgICAgICAgICAgIHZhciBtc2cgPSBkYXRhLlJlc3VsdCB8fCBidG4uZGF0YSgnc3VjY2Vzcy1wb3N0LXRleHQnKSB8fCAnRG9uZSEnO1xyXG4gICAgICAgICAgICBidG4udGV4dChtc2cpO1xyXG4gICAgICAgICAgICAvLyBBZGRpbmcgc3VwcG9ydCB0byByZXNldCBidXR0b24gdGV4dCB0byBkZWZhdWx0IG9uZVxyXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBGaXJzdCBuZXh0IGNoYW5nZXMgaGFwcGVucyBvbiB0aGUgZm9ybTpcclxuICAgICAgICAgICAgJChjdHguZm9ybSkub25lKCdsY0NoYW5nZXNOb3RpZmljYXRpb25DaGFuZ2VSZWdpc3RlcmVkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgYnRuLnRleHQoYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcpKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIFRyaWdnZXIgZXZlbnQgZm9yIGN1c3RvbSBoYW5kbGVyc1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA2KSB7XHJcbiAgICAgICAgICAgIC8vIE9rLUdvIGFjdGlvbnMgcG9wdXAgd2l0aCAnc3VjY2VzcycgYW5kICdhZGRpdGlvbmFsJyBtZXNzYWdlcy5cclxuICAgICAgICAgICAgc2hvd09rR29Qb3B1cChjdHgsIGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNykge1xyXG4gICAgICAgICAgICAvLyBTcGVjaWFsIENvZGUgNzogc2hvdyBtZXNzYWdlIHNheWluZyBjb250YWluZWQgYXQgZGF0YS5SZXN1bHQuTWVzc2FnZS5cclxuICAgICAgICAgICAgLy8gVGhpcyBjb2RlIGFsbG93IGF0dGFjaCBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIGluIGRhdGEuUmVzdWx0IHRvIGRpc3Rpbmd1aXNoXHJcbiAgICAgICAgICAgIC8vIGRpZmZlcmVudCByZXN1bHRzIGFsbCBzaG93aW5nIGEgbWVzc2FnZSBidXQgbWF5YmUgbm90IGJlaW5nIGEgc3VjY2VzcyBhdCBhbGxcclxuICAgICAgICAgICAgLy8gYW5kIG1heWJlIGRvaW5nIHNvbWV0aGluZyBtb3JlIGluIHRoZSB0cmlnZ2VyZWQgZXZlbnQgd2l0aCB0aGUgZGF0YSBvYmplY3QuXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0Lk1lc3NhZ2UsIGRhdGEpO1xyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwganhdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA+IDEwMCkge1xyXG4gICAgICAgICAgICAvLyBVc2VyIENvZGU6IHRyaWdnZXIgY3VzdG9tIGV2ZW50IHRvIG1hbmFnZSByZXN1bHRzOlxyXG4gICAgICAgICAgICBjdHguZm9ybS50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3QnLCBbZGF0YSwgdGV4dCwgangsIGN0eF0pO1xyXG4gICAgICAgIH0gZWxzZSB7IC8vIGRhdGEuQ29kZSA8IDBcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYW4gZXJyb3IgY29kZS5cclxuXHJcbiAgICAgICAgICAgIC8vIERhdGEgbm90IHNhdmVkOlxyXG4gICAgICAgICAgICBpZiAoY3R4LmNoYW5nZWRFbGVtZW50cylcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0uZ2V0KDApLCBjdHguY2hhbmdlZEVsZW1lbnRzKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgICAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgICAgIC8vIEJsb2NrIHdpdGggbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBcIkVycm9yOiBcIiArIGRhdGEuQ29kZSArIFwiOiBcIiArIEpTT04uc3RyaW5naWZ5KGRhdGEuUmVzdWx0ID8gKGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA/IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSA6IGRhdGEuUmVzdWx0KSA6ICcnKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbigkKCc8ZGl2Lz4nKS5hcHBlbmQobWVzc2FnZSksIGN0eC5ib3gsIG51bGwsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgICAgICAgICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVycm9yOiBsY09uRXJyb3IsXHJcbiAgICAgICAgc3VjY2VzczogbGNPblN1Y2Nlc3MsXHJcbiAgICAgICAgY29tcGxldGU6IGxjT25Db21wbGV0ZSxcclxuICAgICAgICBkb0pTT05BY3Rpb246IGRvSlNPTkFjdGlvblxyXG4gICAgfTtcclxufSIsIi8qIEZvcm1zIHN1Ym1pdHRlZCB2aWEgQUpBWCAqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGNhbGxiYWNrcyA9IHJlcXVpcmUoJy4vYWpheENhbGxiYWNrcycpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi9ibG9ja1ByZXNldHMnKSxcclxuICAgIHZhbGlkYXRpb25IZWxwZXIgPSByZXF1aXJlKCcuL3ZhbGlkYXRpb25IZWxwZXInKTtcclxuXHJcbi8vIEdsb2JhbCBzZXR0aW5ncywgd2lsbCBiZSB1cGRhdGVkIG9uIGluaXQgYnV0IGlzIGFjY2Vzc2VkXHJcbi8vIHRocm91Z2ggY2xvc3VyZSBmcm9tIGFsbCBmdW5jdGlvbnMuXHJcbi8vIE5PVEU6IGlzIHN0YXRpYywgZG9lc24ndCBhbGxvd3MgbXVsdGlwbGUgY29uZmlndXJhdGlvbiwgb25lIGluaXQgY2FsbCByZXBsYWNlIHByZXZpb3VzXHJcbi8vIERlZmF1bHRzOlxyXG52YXIgc2V0dGluZ3MgPSB7XHJcbiAgICBsb2FkaW5nRGVsYXk6IDAsXHJcbiAgICBlbGVtZW50OiBkb2N1bWVudFxyXG59O1xyXG5cclxuLy8gQWRhcHRlZCBjYWxsYmFja3NcclxuZnVuY3Rpb24gYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyKCkge1xyXG4gICAgY2FsbGJhY2tzLmNvbXBsZXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFqYXhFcnJvclBvcHVwSGFuZGxlcihqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgIHZhciBjdHggPSB0aGlzO1xyXG4gICAgaWYgKCFjdHguZm9ybSkgY3R4LmZvcm0gPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFjdHguYm94KSBjdHguYm94ID0gY3R4LmZvcm07XHJcbiAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgIGlmIChjdHguY2hhbmdlZEVsZW1lbnRzKVxyXG4gICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoY3R4LmZvcm0sIGN0eC5jaGFuZ2VkRWxlbWVudHMpO1xyXG5cclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSB0cnVlO1xyXG5cclxuICAgIC8vIENvbW1vbiBsb2dpY1xyXG4gICAgY2FsbGJhY2tzLmVycm9yLmFwcGx5KGN0eCwgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYWpheEZvcm1zU3VjY2Vzc0hhbmRsZXIoKSB7XHJcbiAgICBjYWxsYmFja3Muc3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4qIEFqYXggRm9ybXMgZ2VuZXJpYyBmdW5jdGlvbi5cclxuKiBSZXN1bHQgZXhwZWN0ZWQgaXM6XHJcbiogLSBodG1sLCBmb3IgdmFsaWRhdGlvbiBlcnJvcnMgZnJvbSBzZXJ2ZXIsIHJlcGxhY2luZyBjdXJyZW50IC5hamF4LWJveCBjb250ZW50XHJcbiogLSBqc29uLCB3aXRoIHN0cnVjdHVyZTogeyBDb2RlOiBpbnRlZ2VyLW51bWJlciwgUmVzdWx0OiBzdHJpbmctb3Itb2JqZWN0IH1cclxuKiAgIENvZGUgbnVtYmVyczpcclxuKiAgICAtIE5lZ2F0aXZlOiBlcnJvcnMsIHdpdGggYSBSZXN1bHQgb2JqZWN0IHsgRXJyb3JNZXNzYWdlOiBzdHJpbmcgfVxyXG4qICAgIC0gWmVybzogc3VjY2VzcyByZXN1bHQsIGl0IHNob3dzIGEgbWVzc2FnZSB3aXRoIGNvbnRlbnQ6IFJlc3VsdCBzdHJpbmcsIGVsc2UgZm9ybSBkYXRhIGF0dHJpYnV0ZSAnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnLCBlbHNlIGEgZ2VuZXJpYyBtZXNzYWdlXHJcbiogICAgLSAxOiBzdWNjZXNzIHJlc3VsdCwgUmVzdWx0IGNvbnRhaW5zIGEgVVJMLCB0aGUgcGFnZSB3aWxsIGJlIHJlZGlyZWN0ZWQgdG8gdGhhdC5cclxuKiAgICAtIE1ham9yIDE6IHN1Y2Nlc3MgcmVzdWx0LCB3aXRoIGN1c3RvbSBoYW5kbGVyIHRocm91Z2h0IHRoZSBmb3JtIGV2ZW50ICdzdWNjZXNzLXBvc3QtbWVzc2FnZScuXHJcbiovXHJcbmZ1bmN0aW9uIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIoZXZlbnQpIHtcclxuICAgIC8vIENvbnRleHQgdmFyLCB1c2VkIGFzIGFqYXggY29udGV4dDpcclxuICAgIHZhciBjdHggPSB7fTtcclxuICAgIC8vIERlZmF1bHQgZGF0YSBmb3IgcmVxdWlyZWQgcGFyYW1zOlxyXG4gICAgY3R4LmZvcm0gPSAoZXZlbnQuZGF0YSA/IGV2ZW50LmRhdGEuZm9ybSA6IG51bGwpIHx8ICQodGhpcyk7XHJcbiAgICBjdHguYm94ID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmJveCA6IG51bGwpIHx8IGN0eC5mb3JtLmNsb3Nlc3QoXCIuYWpheC1ib3hcIik7XHJcbiAgICB2YXIgYWN0aW9uID0gKGV2ZW50LmRhdGEgPyBldmVudC5kYXRhLmFjdGlvbiA6IG51bGwpIHx8IGN0eC5mb3JtLmF0dHIoJ2FjdGlvbicpIHx8ICcnO1xyXG4gICAgdmFyIGRhdGEgPSBjdHguZm9ybS5maW5kKCc6aW5wdXQnKS5zZXJpYWxpemUoKTtcclxuXHJcbiAgICAvLyBWYWxpZGF0aW9uc1xyXG4gICAgdmFyIHZhbGlkYXRpb25QYXNzZWQgPSB0cnVlO1xyXG4gICAgLy8gVG8gc3VwcG9ydCBzdWItZm9ybXMgdGhyb3VoIGZpZWxkc2V0LmFqYXgsIHdlIG11c3QgZXhlY3V0ZSB2YWxpZGF0aW9ucyBhbmQgdmVyaWZpY2F0aW9uXHJcbiAgICAvLyBpbiB0d28gc3RlcHMgYW5kIHVzaW5nIHRoZSByZWFsIGZvcm0gdG8gbGV0IHZhbGlkYXRpb24gbWVjaGFuaXNtIHdvcmtcclxuICAgIHZhciBpc1N1YmZvcm0gPSBjdHguZm9ybS5pcygnZmllbGRzZXQuYWpheCcpO1xyXG4gICAgdmFyIGFjdHVhbEZvcm0gPSBpc1N1YmZvcm0gPyBjdHguZm9ybS5jbG9zZXN0KCdmb3JtJykgOiBjdHguZm9ybSxcclxuICAgICAgZGlzYWJsZWRTdW1tYXJpZXMgPSBuZXcgalF1ZXJ5KCk7XHJcblxyXG4gICAgLy8gT24gc3ViZm9ybSB2YWxpZGF0aW9uLCB3ZSBkb24ndCB3YW50IHRoZSBmb3JtIHZhbGlkYXRpb24tc3VtbWFyeSBjb250cm9scyB0byBiZSBhZmZlY3RlZFxyXG4gICAgLy8gYnkgdGhpcyB2YWxpZGF0aW9uICh0byBhdm9pZCB0byBzaG93IGVycm9ycyB0aGVyZSB0aGF0IGRvZXNuJ3QgaW50ZXJlc3QgdG8gdGhlIHJlc3Qgb2YgdGhlIGZvcm0pXHJcbiAgICAvLyBUbyBmdWxsZmlsbCB0aGlzIHJlcXVpc2l0LCB3ZSBuZWVkIHRvIGhpZGUgaXQgZm9yIHRoZSB2YWxpZGF0b3IgZm9yIGEgd2hpbGUgYW5kIGxldCBvbmx5IGFmZmVjdFxyXG4gICAgLy8gYW55IGxvY2FsIHN1bW1hcnkgKGluc2lkZSB0aGUgc3ViZm9ybSkuXHJcbiAgICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICAgIGRpc2FibGVkU3VtbWFyaWVzID0gYWN0dWFsRm9ybVxyXG4gICAgICAuZmluZCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nKVxyXG4gICAgICAuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBPbmx5IHRob3NlIHRoYXQgYXJlIG91dHNpZGUgdGhlIHN1YmZvcm1cclxuICAgICAgICByZXR1cm4gISQuY29udGFpbnMoY3R4LmZvcm0uZ2V0KDApLCB0aGlzKTtcclxuICAgICAgfSlcclxuICAgICAgLy8gV2UgbXVzdCB1c2UgJ2F0dHInIGluc3RlYWQgb2YgJ2RhdGEnIGJlY2F1c2UgaXMgd2hhdCB3ZSBhbmQgdW5vYnRydXNpdmVWYWxpZGF0aW9uIGNoZWNrc1xyXG4gICAgICAvLyAoaW4gb3RoZXIgd29yZHMsIHVzaW5nICdkYXRhJyB3aWxsIG5vdCB3b3JrKVxyXG4gICAgICAuYXR0cignZGF0YS12YWxtc2ctc3VtbWFyeScsICdmYWxzZScpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpcnN0IGF0IGFsbCwgaWYgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBpcyBlbmFibGVkLCB2YWxpZGF0ZVxyXG4gICAgdmFyIHZhbG9iamVjdCA9IGFjdHVhbEZvcm0uZGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICBpZiAodmFsb2JqZWN0ICYmIHZhbG9iamVjdC52YWxpZGF0ZSgpID09PSBmYWxzZSkge1xyXG4gICAgICB2YWxpZGF0aW9uSGVscGVyLmdvVG9TdW1tYXJ5RXJyb3JzKGN0eC5mb3JtKTtcclxuICAgICAgdmFsaWRhdGlvblBhc3NlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIElmIGN1c3RvbSB2YWxpZGF0aW9uIGlzIGVuYWJsZWQsIHZhbGlkYXRlXHJcbiAgICB2YXIgY3VzdmFsID0gYWN0dWFsRm9ybS5kYXRhKCdjdXN0b21WYWxpZGF0aW9uJyk7XHJcbiAgICBpZiAoY3VzdmFsICYmIGN1c3ZhbC52YWxpZGF0ZSAmJiBjdXN2YWwudmFsaWRhdGUoKSA9PT0gZmFsc2UpIHtcclxuICAgICAgdmFsaWRhdGlvbkhlbHBlci5nb1RvU3VtbWFyeUVycm9ycyhjdHguZm9ybSk7XHJcbiAgICAgIHZhbGlkYXRpb25QYXNzZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUbyBzdXBwb3J0IHN1Yi1mb3Jtcywgd2UgbXVzdCBjaGVjayB0aGF0IHZhbGlkYXRpb25zIGVycm9ycyBoYXBwZW5lZCBpbnNpZGUgdGhlXHJcbiAgICAvLyBzdWJmb3JtIGFuZCBub3QgaW4gb3RoZXIgZWxlbWVudHMsIHRvIGRvbid0IHN0b3Agc3VibWl0IG9uIG5vdCByZWxhdGVkIGVycm9ycy5cclxuICAgIC8vIEp1c3QgbG9vayBmb3IgbWFya2VkIGVsZW1lbnRzOlxyXG4gICAgaWYgKGlzU3ViZm9ybSAmJiBjdHguZm9ybS5maW5kKCcuaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmxlbmd0aClcclxuICAgICAgdmFsaWRhdGlvblBhc3NlZCA9IGZhbHNlO1xyXG5cclxuICAgIC8vIFJlLWVuYWJsZSBhZ2FpbiB0aGF0IHN1bW1hcmllcyBwcmV2aW91c2x5IGRpc2FibGVkXHJcbiAgICBpZiAoaXNTdWJmb3JtKSB7XHJcbiAgICAgIC8vIFdlIG11c3QgdXNlICdhdHRyJyBpbnN0ZWFkIG9mICdkYXRhJyBiZWNhdXNlIGlzIHdoYXQgd2UgYW5kIHVub2J0cnVzaXZlVmFsaWRhdGlvbiBjaGVja3NcclxuICAgICAgLy8gKGluIG90aGVyIHdvcmRzLCB1c2luZyAnZGF0YScgd2lsbCBub3Qgd29yaylcclxuICAgICAgZGlzYWJsZWRTdW1tYXJpZXMuYXR0cignZGF0YS12YWxtc2ctc3VtbWFyeScsICd0cnVlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ2hlY2sgdmFsaWRhdGlvbiBzdGF0dXNcclxuICAgIGlmICh2YWxpZGF0aW9uUGFzc2VkID09PSBmYWxzZSkgeyAgICAgXHJcbiAgICAgIC8vIFZhbGlkYXRpb24gZmFpbGVkLCBzdWJtaXQgY2Fubm90IGNvbnRpbnVlLCBvdXQhXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEYXRhIHNhdmVkOlxyXG4gICAgY3R4LmNoYW5nZWRFbGVtZW50cyA9IChldmVudC5kYXRhID8gZXZlbnQuZGF0YS5jaGFuZ2VkRWxlbWVudHMgOiBudWxsKSB8fCBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShjdHguZm9ybS5nZXQoMCkpO1xyXG5cclxuICAgIC8vIExvYWRpbmcsIHdpdGggcmV0YXJkXHJcbiAgICBjdHgubG9hZGluZ3RpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY3R4LmJveC5ibG9jayhibG9ja1ByZXNldHMubG9hZGluZyk7XHJcbiAgICB9LCBzZXR0aW5ncy5sb2FkaW5nRGVsYXkpO1xyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gRG8gdGhlIEFqYXggcG9zdFxyXG4gICAgJC5hamF4KHtcclxuICAgICAgICB1cmw6IChhY3Rpb24pLFxyXG4gICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgIGNvbnRleHQ6IGN0eCxcclxuICAgICAgICBzdWNjZXNzOiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlcixcclxuICAgICAgICBlcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyLFxyXG4gICAgICAgIGNvbXBsZXRlOiBhamF4Rm9ybXNDb21wbGV0ZUhhbmRsZXJcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFN0b3Agbm9ybWFsIFBPU1Q6XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbi8vIFB1YmxpYyBpbml0aWFsaXphdGlvblxyXG5mdW5jdGlvbiBpbml0QWpheEZvcm1zKG9wdGlvbnMpIHtcclxuICAgICQuZXh0ZW5kKHRydWUsIHNldHRpbmdzLCBvcHRpb25zKTtcclxuXHJcbiAgICAvKiBBdHRhY2ggYSBkZWxlZ2F0ZWQgaGFuZGxlciB0byBtYW5hZ2UgYWpheCBmb3JtcyAqL1xyXG4gICAgJChzZXR0aW5ncy5lbGVtZW50KS5vbignc3VibWl0JywgJ2Zvcm0uYWpheCcsIGFqYXhGb3Jtc1N1Ym1pdEhhbmRsZXIpO1xyXG4gICAgLyogQXR0YWNoIGEgZGVsZWdhdGVkIGhhbmRsZXIgZm9yIGEgc3BlY2lhbCBhamF4IGZvcm0gY2FzZTogc3ViZm9ybXMsIHVzaW5nIGZpZWxkc2V0cy4gKi9cclxuICAgICQoc2V0dGluZ3MuZWxlbWVudCkub24oJ2NsaWNrJywgJ2ZpZWxkc2V0LmFqYXggLmFqYXgtZmllbGRzZXQtc3VibWl0JyxcclxuICAgICAgICBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgIHZhciBmb3JtID0gJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldC5hamF4Jyk7XHJcblxyXG4gICAgICAgICAgZXZlbnQuZGF0YSA9IHtcclxuICAgICAgICAgICAgZm9ybTogZm9ybSxcclxuICAgICAgICAgICAgYm94OiBmb3JtLmNsb3Nlc3QoJy5hamF4LWJveCcpLFxyXG4gICAgICAgICAgICBhY3Rpb246IGZvcm0uZGF0YSgnYWpheC1maWVsZHNldC1hY3Rpb24nKSxcclxuICAgICAgICAgICAgLy8gRGF0YSBzYXZlZDpcclxuICAgICAgICAgICAgY2hhbmdlZEVsZW1lbnRzOiBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmb3JtLmdldCgwKSwgZm9ybS5maW5kKCc6aW5wdXRbbmFtZV0nKSlcclxuICAgICAgICAgIH07XHJcbiAgICAgICAgICByZXR1cm4gYWpheEZvcm1zU3VibWl0SGFuZGxlcihldmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxufVxyXG4vKiBVTlVTRUQ/XHJcbmZ1bmN0aW9uIGFqYXhGb3JtTWVzc2FnZU9uSHRtbFJldHVybmVkV2l0aG91dFZhbGlkYXRpb25FcnJvcnMoZm9ybSwgbWVzc2FnZSkge1xyXG4gICAgdmFyICR0ID0gJChmb3JtKTtcclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIGZvcm0gZXJyb3JzLCBzaG93IGEgc3VjY2Vzc2Z1bCBtZXNzYWdlXHJcbiAgICBpZiAoJHQuZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICR0LmJsb2NrKGluZm9CbG9jayhtZXNzYWdlLCB7XHJcbiAgICAgICAgICAgIGNzczogcG9wdXBTdHlsZShwb3B1cFNpemUoJ3NtYWxsJykpXHJcbiAgICAgICAgfSkpXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7ICR0LnVuYmxvY2soKTsgcmV0dXJuIGZhbHNlOyB9KTtcclxuICAgIH1cclxufVxyXG4qL1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXQ6IGluaXRBamF4Rm9ybXMsXHJcbiAgICAgICAgb25TdWNjZXNzOiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlcixcclxuICAgICAgICBvbkVycm9yOiBhamF4RXJyb3JQb3B1cEhhbmRsZXIsXHJcbiAgICAgICAgb25Db21wbGV0ZTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbiAgICB9OyIsIi8qIEF1dG8gY2FsY3VsYXRlIHN1bW1hcnkgb24gRE9NIHRhZ2dpbmcgd2l0aCBjbGFzc2VzIHRoZSBlbGVtZW50cyBpbnZvbHZlZC5cclxuICovXHJcbnZhciBudSA9IHJlcXVpcmUoJy4vbnVtYmVyVXRpbHMnKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwQ2FsY3VsYXRlVGFibGVJdGVtc1RvdGFscygpIHtcclxuICAgICQoJ3RhYmxlLmNhbGN1bGF0ZS1pdGVtcy10b3RhbHMnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGUtaXRlbXMtdG90YWxzLWluaXRpYWxpemF0ZWQnKSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZVJvdygpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgdmFyIHRyID0gJHQuY2xvc2VzdCgndHInKTtcclxuICAgICAgICAgICAgdmFyIGlwID0gdHIuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXByaWNlJyk7XHJcbiAgICAgICAgICAgIHZhciBpcSA9IHRyLmZpbmQoJy5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eScpO1xyXG4gICAgICAgICAgICB2YXIgaXQgPSB0ci5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tdG90YWwnKTtcclxuICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIobnUuZ2V0TW9uZXlOdW1iZXIoaXApICogbnUuZ2V0TW9uZXlOdW1iZXIoaXEsIDEpLCBpdCk7XHJcbiAgICAgICAgICAgIHRyLnRyaWdnZXIoJ2xjQ2FsY3VsYXRlZEl0ZW1Ub3RhbCcsIHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJCh0aGlzKS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tcHJpY2UsIC5jYWxjdWxhdGUtaXRlbS1xdWFudGl0eScpLm9uKCdjaGFuZ2UnLCBjYWxjdWxhdGVSb3cpO1xyXG4gICAgICAgICQodGhpcykuZmluZCgndHInKS5lYWNoKGNhbGN1bGF0ZVJvdyk7XHJcbiAgICAgICAgJCh0aGlzKS5kYXRhKCdjYWxjdWxhdGUtaXRlbXMtdG90YWxzLWluaXRpYWxpemF0ZWQnLCB0cnVlKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXR1cENhbGN1bGF0ZVN1bW1hcnkoZm9yY2UpIHtcclxuICAgICQoJy5jYWxjdWxhdGUtc3VtbWFyeScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjID0gJCh0aGlzKTtcclxuICAgICAgICBpZiAoIWZvcmNlICYmIGMuZGF0YSgnY2FsY3VsYXRlLXN1bW1hcnktaW5pdGlhbGl6YXRlZCcpKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdmFyIHMgPSBjLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5Jyk7XHJcbiAgICAgICAgdmFyIGQgPSBjLmZpbmQoJ3RhYmxlLmNhbGN1bGF0ZS1zdW1tYXJ5LWdyb3VwJyk7XHJcbiAgICAgICAgZnVuY3Rpb24gY2FsYygpIHtcclxuICAgICAgICAgICAgdmFyIHRvdGFsID0gMCwgZmVlID0gMCwgZHVyYXRpb24gPSAwO1xyXG4gICAgICAgICAgICB2YXIgZ3JvdXBzID0ge307XHJcbiAgICAgICAgICAgIGQuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXBUb3RhbCA9IDA7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWxsQ2hlY2tlZCA9ICQodGhpcykuaXMoJy5jYWxjdWxhdGUtYWxsLWl0ZW1zJyk7XHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmZpbmQoJ3RyJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhbGxDaGVja2VkIHx8IGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWNoZWNrZWQnKS5pcygnOmNoZWNrZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cFRvdGFsICs9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXRvdGFsOmVxKDApJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcSA9IG51LmdldE1vbmV5TnVtYmVyKGl0ZW0uZmluZCgnLmNhbGN1bGF0ZS1pdGVtLXF1YW50aXR5OmVxKDApJyksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmZWUgKz0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tZmVlOmVxKDApJykpICogcTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gKz0gbnUuZ2V0TW9uZXlOdW1iZXIoaXRlbS5maW5kKCcuY2FsY3VsYXRlLWl0ZW0tZHVyYXRpb246ZXEoMCknKSkgKiBxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdG90YWwgKz0gZ3JvdXBUb3RhbDtcclxuICAgICAgICAgICAgICAgIGdyb3Vwc1skKHRoaXMpLmRhdGEoJ2NhbGN1bGF0aW9uLXN1bW1hcnktZ3JvdXAnKV0gPSBncm91cFRvdGFsO1xyXG4gICAgICAgICAgICAgICAgbnUuc2V0TW9uZXlOdW1iZXIoZ3JvdXBUb3RhbCwgJCh0aGlzKS5jbG9zZXN0KCdmaWVsZHNldCcpLmZpbmQoJy5ncm91cC10b3RhbC1wcmljZScpKTtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGR1cmF0aW9uLCAkKHRoaXMpLmNsb3Nlc3QoJ2ZpZWxkc2V0JykuZmluZCgnLmdyb3VwLXRvdGFsLWR1cmF0aW9uJykpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNldCBzdW1tYXJ5IHRvdGFsIHZhbHVlXHJcbiAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKHRvdGFsLCBzLmZpbmQoJy5jYWxjdWxhdGlvbi1zdW1tYXJ5LXRvdGFsJykpO1xyXG4gICAgICAgICAgICBudS5zZXRNb25leU51bWJlcihmZWUsIHMuZmluZCgnLmNhbGN1bGF0aW9uLXN1bW1hcnktZmVlJykpO1xyXG4gICAgICAgICAgICAvLyBBbmQgZXZlcnkgZ3JvdXAgdG90YWwgdmFsdWVcclxuICAgICAgICAgICAgZm9yICh2YXIgZyBpbiBncm91cHMpIHtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKGdyb3Vwc1tnXSwgcy5maW5kKCcuY2FsY3VsYXRpb24tc3VtbWFyeS1ncm91cC0nICsgZykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGQuZmluZCgnLmNhbGN1bGF0ZS1pdGVtLWNoZWNrZWQnKS5jaGFuZ2UoY2FsYyk7XHJcbiAgICAgICAgZC5vbignbGNDYWxjdWxhdGVkSXRlbVRvdGFsJywgY2FsYyk7XHJcbiAgICAgICAgY2FsYygpO1xyXG4gICAgICAgIGMuZGF0YSgnY2FsY3VsYXRlLXN1bW1hcnktaW5pdGlhbGl6YXRlZCcsIHRydWUpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBVcGRhdGUgdGhlIGRldGFpbCBvZiBhIHByaWNpbmcgc3VtbWFyeSwgb25lIGRldGFpbCBsaW5lIHBlciBzZWxlY3RlZCBpdGVtXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCkge1xyXG4gICAgJCgnLnByaWNpbmctc3VtbWFyeS5kZXRhaWxlZCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgICRkID0gJHMuZmluZCgndGJvZHkuZGV0YWlsJyksXHJcbiAgICAgICAgICAgICR0ID0gJHMuZmluZCgndGJvZHkuZGV0YWlsLXRwbCcpLmNoaWxkcmVuKCd0cjplcSgwKScpLFxyXG4gICAgICAgICAgICAkYyA9ICRzLmNsb3Nlc3QoJ2Zvcm0nKSxcclxuICAgICAgICAgICAgJGl0ZW1zID0gJGMuZmluZCgnLnByaWNpbmctc3VtbWFyeS1pdGVtJyk7XHJcblxyXG4gICAgICAgIC8vIERvIGl0IVxyXG4gICAgICAgIC8vIFJlbW92ZSBvbGQgbGluZXNcclxuICAgICAgICAkZC5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgICAgIC8vIENyZWF0ZSBuZXcgb25lc1xyXG4gICAgICAgICRpdGVtcy5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gR2V0IHZhbHVlc1xyXG4gICAgICAgICAgICB2YXIgJGkgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAgICAgY2hlY2tlZCA9ICRpLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1jaGVja2VkJykucHJvcCgnY2hlY2tlZCcpO1xyXG4gICAgICAgICAgICBpZiAoY2hlY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbmNlcHQgPSAkaS5maW5kKCcucHJpY2luZy1zdW1tYXJ5LWl0ZW0tY29uY2VwdCcpLnRleHQoKSxcclxuICAgICAgICAgICAgICAgICAgICBwcmljZSA9IG51LmdldE1vbmV5TnVtYmVyKCRpLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1wcmljZTplcSgwKScpKTtcclxuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSByb3cgYW5kIHNldCB2YWx1ZXNcclxuICAgICAgICAgICAgICAgIHZhciAkcm93ID0gJHQuY2xvbmUoKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdkZXRhaWwtdHBsJylcclxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZGV0YWlsJyk7XHJcbiAgICAgICAgICAgICAgICAkcm93LmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1jb25jZXB0JykudGV4dChjb25jZXB0KTtcclxuICAgICAgICAgICAgICAgIG51LnNldE1vbmV5TnVtYmVyKHByaWNlLCAkcm93LmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1wcmljZScpKTtcclxuICAgICAgICAgICAgICAgIC8vIEFkZCB0byB0aGUgdGFibGVcclxuICAgICAgICAgICAgICAgICRkLmFwcGVuZCgkcm93KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gc2V0dXBVcGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KCkge1xyXG4gICAgdmFyICRjID0gJCgnLnByaWNpbmctc3VtbWFyeS5kZXRhaWxlZCcpLmNsb3Nlc3QoJ2Zvcm0nKTtcclxuICAgIC8vIEluaXRpYWwgY2FsY3VsYXRpb25cclxuICAgIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkoKTtcclxuICAgIC8vIENhbGN1bGF0ZSBvbiByZWxldmFudCBmb3JtIGNoYW5nZXNcclxuICAgICRjLmZpbmQoJy5wcmljaW5nLXN1bW1hcnktaXRlbS1jaGVja2VkJykuY2hhbmdlKHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkpO1xyXG4gICAgLy8gU3VwcG9ydCBmb3IgbGNTZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMgZXZlbnRcclxuICAgICRjLm9uKCdsY0NhbGN1bGF0ZWRJdGVtVG90YWwnLCB1cGRhdGVEZXRhaWxlZFByaWNpbmdTdW1tYXJ5KTtcclxufVxyXG5cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9uVGFibGVJdGVtczogc2V0dXBDYWxjdWxhdGVUYWJsZUl0ZW1zVG90YWxzLFxyXG4gICAgICAgIG9uU3VtbWFyeTogc2V0dXBDYWxjdWxhdGVTdW1tYXJ5LFxyXG4gICAgICAgIHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnk6IHVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnksXHJcbiAgICAgICAgb25EZXRhaWxlZFByaWNpbmdTdW1tYXJ5OiBzZXR1cFVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnlcclxuICAgIH07IiwiLyogRm9jdXMgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlIGRvY3VtZW50IChvciBpbiBAY29udGFpbmVyKVxyXG53aXRoIHRoZSBodG1sNSBhdHRyaWJ1dGUgJ2F1dG9mb2N1cycgKG9yIGFsdGVybmF0aXZlIEBjc3NTZWxlY3RvcikuXHJcbkl0J3MgZmluZSBhcyBhIHBvbHlmaWxsIGFuZCBmb3IgYWpheCBsb2FkZWQgY29udGVudCB0aGF0IHdpbGwgbm90XHJcbmdldCB0aGUgYnJvd3NlciBzdXBwb3J0IG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBhdXRvRm9jdXMoY29udGFpbmVyLCBjc3NTZWxlY3Rvcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgZG9jdW1lbnQpO1xyXG4gICAgY29udGFpbmVyLmZpbmQoY3NzU2VsZWN0b3IgfHwgJ1thdXRvZm9jdXNdJykuZm9jdXMoKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhdXRvRm9jdXM7IiwiLyoqIEF1dG8tZmlsbCBtZW51IHN1Yi1pdGVtcyB1c2luZyB0YWJiZWQgcGFnZXMgLW9ubHkgd29ya3MgZm9yIGN1cnJlbnQgcGFnZSBpdGVtcy0gKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGF1dG9maWxsU3VibWVudSgpIHtcclxuICAgICQoJy5hdXRvZmlsbC1zdWJtZW51IC5jdXJyZW50JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHBhcmVudG1lbnUgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIGdldHRpbmcgdGhlIHN1Ym1lbnUgZWxlbWVudHMgZnJvbSB0YWJzIG1hcmtlZCB3aXRoIGNsYXNzICdhdXRvZmlsbC1zdWJtZW51LWl0ZW1zJ1xyXG4gICAgICAgIHZhciBpdGVtcyA9ICQoJy5hdXRvZmlsbC1zdWJtZW51LWl0ZW1zIGxpOm5vdCgucmVtb3ZhYmxlKScpO1xyXG4gICAgICAgIC8vIGlmIHRoZXJlIGlzIGl0ZW1zLCBjcmVhdGUgdGhlIHN1Ym1lbnUgY2xvbmluZyBpdCFcclxuICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgc3VibWVudSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcclxuICAgICAgICAgICAgcGFyZW50bWVudS5hcHBlbmQoc3VibWVudSk7XHJcbiAgICAgICAgICAgIC8vIENsb25pbmcgd2l0aG91dCBldmVudHM6XHJcbiAgICAgICAgICAgIHZhciBuZXdpdGVtcyA9IGl0ZW1zLmNsb25lKGZhbHNlLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICQoc3VibWVudSkuYXBwZW5kKG5ld2l0ZW1zKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFdlIG5lZWQgYXR0YWNoIGV2ZW50cyB0byBtYWludGFpbiB0aGUgdGFiYmVkIGludGVyZmFjZSB3b3JraW5nXHJcbiAgICAgICAgICAgIC8vIE5ldyBJdGVtcyAoY2xvbmVkKSBtdXN0IGNoYW5nZSB0YWJzOlxyXG4gICAgICAgICAgICBuZXdpdGVtcy5maW5kKFwiYVwiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IGluIHRoZSBvcmlnaW5hbCBpdGVtXHJcbiAgICAgICAgICAgICAgICAkKFwiYVtocmVmPSdcIiArIHRoaXMuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKSArIFwiJ11cIiwgaXRlbXMpLmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBDaGFuZ2UgbWVudTpcclxuICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkucGFyZW50KCkuZmluZChcImFcIikucmVtb3ZlQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAgICAgICAgIC8vIFN0b3AgZXZlbnQ6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBPcmlnaW5hbCBpdGVtcyBtdXN0IGNoYW5nZSBtZW51OlxyXG4gICAgICAgICAgICBpdGVtcy5maW5kKFwiYVwiKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdpdGVtcy5wYXJlbnQoKS5maW5kKFwiYVwiKS5yZW1vdmVDbGFzcygnY3VycmVudCcpLlxyXG4gICAgICAgICAgICAgICAgZmlsdGVyKFwiKltocmVmPSdcIiArIHRoaXMuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKSArIFwiJ11cIikuYWRkQ2xhc3MoJ2N1cnJlbnQnKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgQXZhaWxhYmlsaXR5Q2FsZW5kYXIgTW9kdWxlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIGRhdGVJU08gPSByZXF1aXJlKCdMQy9kYXRlSVNPODYwMScpO1xyXG5cclxudmFyIGNsYXNzZXMgPSB7XHJcbiAgY2FsZW5kYXI6ICdBdmFpbGFiaWxpdHlDYWxlbmRhcicsXHJcbiAgbG9hZGluZzogJ2lzLWxvYWRpbmcnLFxyXG4gIHByZWxvYWRpbmc6ICdpcy1wcmVsb2FkaW5nJyxcclxuICBjdXJyZW50V2VlazogJ2lzLWN1cnJlbnRXZWVrJyxcclxuICBhY3Rpb25zOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItYWN0aW9ucycsXHJcbiAgcHJldkFjdGlvbjogJ0FjdGlvbnMtcHJldicsXHJcbiAgbmV4dEFjdGlvbjogJ0FjdGlvbnMtbmV4dCcsXHJcbiAgZGF5czogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWRheXMnLFxyXG4gIHNsb3RzOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItc2xvdHMnLFxyXG4gIHNsb3RIb3VyOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItaG91cicsXHJcbiAgc2xvdFN0YXR1c1ByZWZpeDogJ2lzLScsXHJcbiAgbGVnZW5kOiAnQXZhaWxhYmlsaXR5Q2FsZW5kYXItbGVnZW5kJyxcclxuICBsZWdlbmRBdmFpbGFibGU6ICdBdmFpbGFiaWxpdHlDYWxlbmRhci1sZWdlbmQtYXZhaWxhYmxlJyxcclxuICBsZWdlbmRVbmF2YWlsYWJsZTogJ0F2YWlsYWJpbGl0eUNhbGVuZGFyLWxlZ2VuZC11bmF2YWlsYWJsZSdcclxufTtcclxuXHJcbnZhciBzdGF0dXNUeXBlcyA9IFsndW5hdmFpbGFibGUnLCAnYXZhaWxhYmxlJ107XHJcblxyXG52YXIgZGVmYXVsdHMgPSB7XHJcbiAgY2xhc3NlczogY2xhc3NlcyxcclxuICBkYXRhU291cmNlVXJsOiAnL2NhbGVuZGFyL2dldC1hdmFpbGFiaWxpdHkvJyxcclxufTtcclxuXHJcbmZ1bmN0aW9uIG9uKHNlbGVjdG9yLCBvcHRpb25zKSB7XHJcbiAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCAnLicgKyBvcHRpb25zLmNsYXNzZXMuY2FsZW5kYXI7XHJcblxyXG4gICQoc2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGNhbGVuZGFyID0gJCh0aGlzKTtcclxuICAgIHZhciB1c2VyID0gY2FsZW5kYXIuZGF0YSgnY2FsZW5kYXItdXNlcicpO1xyXG4gICAgdmFyIGRhdGFTb3VyY2VVcmwgPSBjYWxlbmRhci5kYXRhKCdzb3VyY2UtdXJsJykgfHwgb3B0aW9ucy5kYXRhU291cmNlVXJsO1xyXG4gICAgdmFyIGRhdGFTb3VyY2UgPSBjYWxlbmRhci5kYXRhKCdzb3VyY2UnKSB8fCB7fTtcclxuICAgIGlmICh0eXBlb2YoZGF0YVNvdXJjZSkgPT0gJ3N0cmluZycpXHJcbiAgICAgIGRhdGFTb3VyY2UgPSBKU09OLnBhcnNlKGRhdGFTb3VyY2UpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGZldGNoRGF0YShzdGFydCwgZW5kLCBwcmVsb2FkaW5nKSB7XHJcbiAgICAgIHZhciBmZXRjaFN0YXRlQ2xhc3MgPSBwcmVsb2FkaW5nID8gb3B0aW9ucy5jbGFzc2VzLnByZWxvYWRpbmcgOiBvcHRpb25zLmNsYXNzZXMubG9hZGluZztcclxuICAgICAgY2FsZW5kYXIuYWRkQ2xhc3MoZmV0Y2hTdGF0ZUNsYXNzKTtcclxuICAgICAgcmV0dXJuICQuZ2V0SlNPTihkYXRhU291cmNlVXJsLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHVzZXI6IHVzZXIsXHJcbiAgICAgICAgICBzdGFydDogZGF0ZUlTTy5kYXRldGltZUxvY2FsKHN0YXJ0LCB0cnVlKSxcclxuICAgICAgICAgIGVuZDogZGF0ZUlTTy5kYXRldGltZUxvY2FsKGVuZCwgdHJ1ZSlcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIGRhdGFTb3VyY2UsIGRhdGEuUmVzdWx0KTtcclxuICAgICAgICAgICAgY2FsZW5kYXIucmVtb3ZlQ2xhc3MoZmV0Y2hTdGF0ZUNsYXNzKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE8gTWFuYWdlIGVycm9yXHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ0F2YWlsYWJpbGl0eUNhbGVuZGFyIGZldGNoIGRhdGEgZXJyb3IgJW8nLCBkYXRhKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRmV0Y2ggY3VycmVudCB3ZWVrXHJcbiAgICB2YXIgc3RhcnQgPSBnZXRGaXJzdFdlZWtEYXRlKG5ldyBEYXRlKCkpLFxyXG4gICAgICAgIGVuZCA9IGdldExhc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKTtcclxuXHJcbiAgICB2YXIgcmVxdWVzdCA9IGZldGNoRGF0YShzdGFydCwgZW5kKS5kb25lKGZ1bmN0aW9uKCl7XHJcbiAgICAgIGJpbmREYXRhKGNhbGVuZGFyLCBkYXRhU291cmNlLCBvcHRpb25zLCBzdGFydCwgZW5kKTtcclxuICAgICAgLy8gUHJlZmV0Y2hpbmcgMyB3ZWVrcyBpbiBhZHZhbmNlXHJcbiAgICAgIHJlcXVlc3QgPSBmZXRjaERhdGEoYWRkRGF5cyhzdGFydCwgNyksIGFkZERheXMoZW5kLCAyMSksIHRydWUpO1xyXG4gICAgfSk7XHJcbiAgICBjaGVja0N1cnJlbnRXZWVrKGNhbGVuZGFyLCBzdGFydCwgb3B0aW9ucyk7XHJcblxyXG4gICAgZnVuY3Rpb24gbW92ZUJpbmRSYW5nZUluRGF5cyhkYXlzKSB7XHJcbiAgICAgIHZhclxyXG4gICAgICAgIHN0YXJ0ID0gYWRkRGF5cyggY2FsZW5kYXIuZGF0YSgnY2FsZW5kYXItc3RhcnQtZGF0ZScpLCBkYXlzICksXHJcbiAgICAgICAgZW5kID0gYWRkRGF5cyggY2FsZW5kYXIuZGF0YSgnY2FsZW5kYXItZW5kLWRhdGUnKSwgZGF5cyApO1xyXG5cclxuICAgICAgLy8gU3VwcG9ydCBmb3IgcHJlZmV0Y2hpbmc6XHJcbiAgICAgIGlmIChyZXF1ZXN0ICYmIHJlcXVlc3Quc3RhdHVzICE9IDIwMCkge1xyXG4gICAgICAgIC8vIFdhaXQgZm9yIHRoZSBmZXRjaCB0byBwZXJmb3JtIGFuZCBzZXRzIGxvYWRpbmcgdG8gbm90aWZ5IHVzZXJcclxuICAgICAgICBjYWxlbmRhci5hZGRDbGFzcyhvcHRpb25zLmNsYXNzZXMubG9hZGluZyk7XHJcbiAgICAgICAgcmVxdWVzdC5kb25lKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICBtb3ZlQmluZFJhbmdlSW5EYXlzKGRheXMpO1xyXG4gICAgICAgICAgY2FsZW5kYXIucmVtb3ZlQ2xhc3Mob3B0aW9ucy5jbGFzc2VzLmxvYWRpbmcpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gQ2hlY2sgY2FjaGU6IGlmIHRoZXJlIGlzIGFsbW9zdCBvbmUgZGF0ZSBpbiB0aGUgcmFuZ2VcclxuICAgICAgLy8gd2l0aG91dCBkYXRhLCB3ZSBzZXQgaW5DYWNoZSBhcyBmYWxzZSBhbmQgZmV0Y2ggdGhlIGRhdGE6XHJcbiAgICAgIHZhciBpbkNhY2hlID0gdHJ1ZTtcclxuICAgICAgZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZ1bmN0aW9uKGRhdGUpIHtcclxuICAgICAgICB2YXIgZGF0ZWtleSA9IGRhdGVJU08uZGF0ZUxvY2FsKGRhdGUsIHRydWUpO1xyXG4gICAgICAgIGlmICghZGF0YVNvdXJjZS5zbG90c1tkYXRla2V5XSkge1xyXG4gICAgICAgICAgaW5DYWNoZSA9IGZhbHNlO1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBpZiAoaW5DYWNoZSlcclxuICAgICAgICAvLyBKdXN0IHNob3cgdGhlIGRhdGFcclxuICAgICAgICBiaW5kRGF0YShjYWxlbmRhciwgZGF0YVNvdXJjZSwgb3B0aW9ucywgc3RhcnQsIGVuZCk7XHJcbiAgICAgIGVsc2VcclxuICAgICAgICAvLyBGZXRjaCAoZG93bmxvYWQpIHRoZSBkYXRhIGFuZCBzaG93IG9uIHJlYWR5OlxyXG4gICAgICAgIGZldGNoRGF0YShzdGFydCwgZW5kKS5kb25lKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICBiaW5kRGF0YShjYWxlbmRhciwgZGF0YVNvdXJjZSwgb3B0aW9ucywgc3RhcnQsIGVuZCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2FsZW5kYXIub24oJ2NsaWNrJywgJy4nICsgb3B0aW9ucy5jbGFzc2VzLnByZXZBY3Rpb24sIGZ1bmN0aW9uIHByZXYoKXtcclxuICAgICAgbW92ZUJpbmRSYW5nZUluRGF5cygtNyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjYWxlbmRhci5vbignY2xpY2snLCAnLicgKyBvcHRpb25zLmNsYXNzZXMubmV4dEFjdGlvbiwgZnVuY3Rpb24gbmV4dCgpe1xyXG4gICAgICBtb3ZlQmluZFJhbmdlSW5EYXlzKDcpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJpbmREYXRhKGNhbGVuZGFyLCBkYXRhU291cmNlLCBvcHRpb25zLCBzdGFydCwgZW5kKSB7XHJcbiAgdmFyIHNsb3RzQ29udGFpbmVyID0gY2FsZW5kYXIuZmluZCgnLicgKyBvcHRpb25zLmNsYXNzZXMuc2xvdHMpLFxyXG4gICAgc2xvdHMgPSBzbG90c0NvbnRhaW5lci5maW5kKCd0ZCcpO1xyXG5cclxuICAvLyBTYXZlIHRoZSBkYXRlIHJhbmdlIGJlaW5nIHNob3dlZCBpbiB0aGUgY2FsZW5kYXIgaW5zdGFuY2VcclxuICBjYWxlbmRhci5kYXRhKCdjYWxlbmRhci1zdGFydC1kYXRlJywgc3RhcnQpO1xyXG4gIGNhbGVuZGFyLmRhdGEoJ2NhbGVuZGFyLWVuZC1kYXRlJywgZW5kKTtcclxuXHJcbiAgY2hlY2tDdXJyZW50V2VlayhjYWxlbmRhciwgc3RhcnQsIG9wdGlvbnMpO1xyXG5cclxuICB1cGRhdGVMYWJlbHMoY2FsZW5kYXIsIG9wdGlvbnMpO1xyXG5cclxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzIHN0YXR1cyBjbGFzcyBmcm9tIGFsbCBzbG90c1xyXG4gIGZvciAodmFyIHMgPSAwOyBzIDwgc3RhdHVzVHlwZXMubGVuZ3RoOyBzKyspIHtcclxuICAgIHNsb3RzLnJlbW92ZUNsYXNzKCBvcHRpb25zLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIHN0YXR1c1R5cGVzW3NdICk7XHJcbiAgfVxyXG5cclxuICAvLyBTZXQgYWxsIHNsb3RzIHdpdGggZGVmYXVsdCBzdGF0dXNcclxuICBzbG90cy5hZGRDbGFzcyggb3B0aW9ucy5jbGFzc2VzLnNsb3RTdGF0dXNQcmVmaXggKyBkYXRhU291cmNlLmRlZmF1bHRTdGF0dXMgKTtcclxuXHJcbiAgZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZ1bmN0aW9uKGRhdGUsIGkpIHtcclxuICAgIHZhciBkYXRla2V5ID0gZGF0ZUlTTy5kYXRlTG9jYWwoZGF0ZSwgdHJ1ZSk7XHJcbiAgICB2YXIgZGF0ZVNsb3RzID0gZGF0YVNvdXJjZS5zbG90c1tkYXRla2V5XTtcclxuICAgIGlmIChkYXRlU2xvdHMpIHtcclxuICAgICAgZm9yIChzID0gMDsgcyA8IGRhdGVTbG90cy5sZW5ndGg7IHMrKykge1xyXG4gICAgICAgIHZhciBzbG90ID0gZGF0ZVNsb3RzW3NdO1xyXG4gICAgICAgIHZhciBzbG90Q2VsbCA9IGZpbmRTbG90Q2VsbChzbG90c0NvbnRhaW5lciwgaSwgc2xvdCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIGRlZmF1bHQgc3RhdHVzXHJcbiAgICAgICAgc2xvdENlbGwucmVtb3ZlQ2xhc3MoIG9wdGlvbnMuY2xhc3Nlcy5zbG90U3RhdHVzUHJlZml4ICsgZGF0YVNvdXJjZS5kZWZhdWx0U3RhdHVzICk7XHJcbiAgICAgICAgLy8gQWRkaW5nIHN0YXR1cyBjbGFzc1xyXG4gICAgICAgIHNsb3RDZWxsLmFkZENsYXNzKCBvcHRpb25zLmNsYXNzZXMuc2xvdFN0YXR1c1ByZWZpeCArIGRhdGFTb3VyY2Uuc3RhdHVzICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdXBkYXRlTGFiZWxzKGNhbGVuZGFyLCBvcHRpb25zKSB7XHJcbiAgdmFyIHN0YXJ0ID0gY2FsZW5kYXIuZGF0YSgnY2FsZW5kYXItc3RhcnQtZGF0ZScpLFxyXG4gICAgICBlbmQgPSBjYWxlbmRhci5kYXRhKCdjYWxlbmRhci1lbmQtZGF0ZScpO1xyXG5cclxuICAvLyBUT0RPXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRTbG90Q2VsbChzbG90c0NvbnRhaW5lciwgZGF5LCBzbG90KSB7XHJcbiAgc2xvdCA9IGRhdGVJU08ucGFyc2Uoc2xvdCk7XHJcbiAgdmFyXHJcbiAgICB4ID0gTWF0aC5yb3VuZCggc2xvdC5nZXRIb3VycygpICksXHJcbiAgICAvLyBUaW1lIGZyYW1lcyAoc2xvdHMpIGFyZSAxNSBtaW51dGVzIGRpdmlzaW9uc1xyXG4gICAgeSA9IE1hdGgucm91bmQoIHNsb3QuZ2V0TWludXRlcygpIC8gMTUgKSxcclxuICAgIHRyID0gc2xvdHNDb250YWluZXIuY2hpbGRyZW4oJzplcSgnICsgTWF0aC5yb3VuZCggeCAqIDQgKyB5ICkgKyAnKScgKTtcclxuICBcclxuICAvLyBTbG90IGNlbGwgZm9yIG8nY2xvY2sgaG91cnMgaXMgYXQgMSBwb3NpdGlvbiBvZmZzZXRcclxuICAvLyBiZWNhdXNlIG9mIHRoZSByb3ctaGVhZCBjZWxsXHJcbiAgdmFyIGRheU9mZnNldCA9ICggeSA9PT0gMCA/IGRheSArIDEgOiBkYXkgKTtcclxuICByZXR1cm4gdHIuY2hpbGRyZW4oJzplcSgnICsgZGF5T2Zmc2V0ICsgJyknKTtcclxufVxyXG5cclxuLyoqXHJcbiAgTWFyayBjYWxlbmRhciBhcyBjdXJyZW50LXdlZWsgYW5kIGRpc2FibGUgcHJldiBidXR0b24sXHJcbiAgb3IgcmVtb3ZlIHRoZSBtYXJrIGFuZCBlbmFibGUgaXQgaWYgaXMgbm90LlxyXG4qKi9cclxuZnVuY3Rpb24gY2hlY2tDdXJyZW50V2VlayhjYWxlbmRhciwgZGF0ZSwgb3B0aW9ucykge1xyXG4gICAgdmFyIHllcCA9IGlzSW5DdXJyZW50V2VlayhkYXRlKTtcclxuICAgIGNhbGVuZGFyLnRvZ2dsZUNsYXNzKG9wdGlvbnMuY2xhc3Nlcy5jdXJyZW50V2VlaywgeWVwKTtcclxuICAgIGNhbGVuZGFyLmZpbmQoJy4nICsgb3B0aW9ucy5jbGFzc2VzLnByZXZBY3Rpb24pLnByb3AoJ2Rpc2FibGVkJywgeWVwKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Rmlyc3RXZWVrRGF0ZShkYXRlKSB7XHJcbiAgdmFyIGQgPSBuZXcgRGF0ZShkYXRlKTtcclxuICBkLnNldERhdGUoIGQuZ2V0RGF0ZSgpIC0gZC5nZXREYXkoKSApO1xyXG4gIHJldHVybiBkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRMYXN0V2Vla0RhdGUoZGF0ZSkge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKCBkLmdldERhdGUoKSArICg3IC0gZC5nZXREYXkoKSkgKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNJbkN1cnJlbnRXZWVrKGRhdGUpIHtcclxuICByZXR1cm4gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RXZWVrRGF0ZShkYXRlKSkgPT0gZGF0ZUlTTy5kYXRlTG9jYWwoZ2V0Rmlyc3RXZWVrRGF0ZShuZXcgRGF0ZSgpKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFkZERheXMoZGF0ZSwgZGF5cykge1xyXG4gIHZhciBkID0gbmV3IERhdGUoZGF0ZSk7XHJcbiAgZC5zZXREYXRlKCBkLmdldERhdGUoKSArIGRheXMgKTtcclxuICByZXR1cm4gZDtcclxufVxyXG5cclxuZnVuY3Rpb24gZWFjaERhdGVJblJhbmdlKHN0YXJ0LCBlbmQsIGZuKSB7XHJcbiAgaWYgKCFmbi5jYWxsKSB0aHJvdyBuZXcgRXJyb3IoJ2ZuIG11c3QgYmUgYSBmdW5jdGlvbiBvciBcImNhbGxcImFibGUgb2JqZWN0Jyk7XHJcbiAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzdGFydCk7XHJcbiAgdmFyIGkgPSAwLCByZXQ7XHJcbiAgd2hpbGUgKGRhdGUgPD0gZW5kKSB7XHJcbiAgICByZXQgPSBmbi5jYWxsKGZuLCBkYXRlLCBpKTtcclxuICAgIC8vIEFsbG93IGZuIHRvIGNhbmNlbCB0aGUgbG9vcCB3aXRoIHN0cmljdCAnZmFsc2UnXHJcbiAgICBpZiAocmV0ID09PSBmYWxzZSlcclxuICAgICAgYnJlYWs7XHJcbiAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyAxKTtcclxuICAgIGkrKztcclxuICB9XHJcbn1cclxuXHJcbi8vIFB1YmxpYyBBUEk6XHJcbmV4cG9ydHMuZGVmYXVsdHMgPSBkZWZhdWx0cztcclxuZXhwb3J0cy5vbiA9IG9uOyIsIi8qIEdlbmVyaWMgYmxvY2tVSSBvcHRpb25zIHNldHMgKi9cclxudmFyIGxvYWRpbmdCbG9jayA9IHsgbWVzc2FnZTogJzxpbWcgd2lkdGg9XCI0OHB4XCIgaGVpZ2h0PVwiNDhweFwiIGNsYXNzPVwibG9hZGluZy1pbmRpY2F0b3JcIiBzcmM9XCInICsgTGNVcmwuQXBwUGF0aCArICdpbWcvdGhlbWUvbG9hZGluZy5naWZcIi8+JyB9O1xyXG52YXIgZXJyb3JCbG9jayA9IGZ1bmN0aW9uIChlcnJvciwgcmVsb2FkLCBzdHlsZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjc3M6ICQuZXh0ZW5kKHsgY3Vyc29yOiAnZGVmYXVsdCcgfSwgc3R5bGUgfHwge30pLFxyXG4gICAgICAgIG1lc3NhZ2U6ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+PGRpdiBjbGFzcz1cImluZm9cIj5UaGVyZSB3YXMgYW4gZXJyb3InICtcclxuICAgICAgICAgICAgKGVycm9yID8gJzogJyArIGVycm9yIDogJycpICtcclxuICAgICAgICAgICAgKHJlbG9hZCA/ICcgPGEgaHJlZj1cImphdmFzY3JpcHQ6ICcgKyByZWxvYWQgKyAnO1wiPkNsaWNrIHRvIHJlbG9hZDwvYT4nIDogJycpICtcclxuICAgICAgICAgICAgJzwvZGl2PidcclxuICAgIH07XHJcbn07XHJcbnZhciBpbmZvQmxvY2sgPSBmdW5jdGlvbiAobWVzc2FnZSwgb3B0aW9ucykge1xyXG4gICAgcmV0dXJuICQuZXh0ZW5kKHtcclxuICAgICAgICBtZXNzYWdlOiAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPjxkaXYgY2xhc3M9XCJpbmZvXCI+JyArIG1lc3NhZ2UgKyAnPC9kaXY+J1xyXG4gICAgICAgIC8qLGNzczogeyBjdXJzb3I6ICdkZWZhdWx0JyB9Ki9cclxuICAgICAgICAsIG92ZXJsYXlDU1M6IHsgY3Vyc29yOiAnZGVmYXVsdCcgfVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcbn07XHJcblxyXG4vLyBNb2R1bGU6XHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgbG9hZGluZzogbG9hZGluZ0Jsb2NrLFxyXG4gICAgICAgIGVycm9yOiBlcnJvckJsb2NrLFxyXG4gICAgICAgIGluZm86IGluZm9CbG9ja1xyXG4gICAgfTtcclxufSIsIi8qPSBDaGFuZ2VzTm90aWZpY2F0aW9uIGNsYXNzXHJcbiogdG8gbm90aWZ5IHVzZXIgYWJvdXQgY2hhbmdlcyBpbiBmb3JtcyxcclxuKiB0YWJzLCB0aGF0IHdpbGwgYmUgbG9zdCBpZiBnbyBhd2F5IGZyb21cclxuKiB0aGUgcGFnZS4gSXQga25vd3Mgd2hlbiBhIGZvcm0gaXMgc3VibWl0dGVkXHJcbiogYW5kIHNhdmVkIHRvIGRpc2FibGUgbm90aWZpY2F0aW9uLCBhbmQgZ2l2ZXNcclxuKiBtZXRob2RzIGZvciBvdGhlciBzY3JpcHRzIHRvIG5vdGlmeSBjaGFuZ2VzXHJcbiogb3Igc2F2aW5nLlxyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZ2V0WFBhdGggPSByZXF1aXJlKCcuL2dldFhQYXRoJyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHtcclxuICAgIGNoYW5nZXNMaXN0OiB7fSxcclxuICAgIGRlZmF1bHRzOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBudWxsLFxyXG4gICAgICAgIGdlbmVyaWNDaGFuZ2VTdXBwb3J0OiB0cnVlLFxyXG4gICAgICAgIGdlbmVyaWNTdWJtaXRTdXBwb3J0OiBmYWxzZSxcclxuICAgICAgICBjaGFuZ2VkRm9ybUNsYXNzOiAnaGFzLWNoYW5nZXMnLFxyXG4gICAgICAgIGNoYW5nZWRFbGVtZW50Q2xhc3M6ICdjaGFuZ2VkJyxcclxuICAgICAgICBub3RpZnlDbGFzczogJ25vdGlmeS1jaGFuZ2VzJ1xyXG4gICAgfSxcclxuICAgIGluaXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICAgICAgLy8gVXNlciBub3RpZmljYXRpb24gdG8gcHJldmVudCBsb3N0IGNoYW5nZXMgZG9uZVxyXG4gICAgICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gY2hhbmdlc05vdGlmaWNhdGlvbi5ub3RpZnkoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBvcHRpb25zID0gJC5leHRlbmQodGhpcy5kZWZhdWx0cywgb3B0aW9ucyk7XHJcbiAgICAgICAgaWYgKCFvcHRpb25zLnRhcmdldClcclxuICAgICAgICAgICAgb3B0aW9ucy50YXJnZXQgPSBkb2N1bWVudDtcclxuICAgICAgICBpZiAob3B0aW9ucy5nZW5lcmljQ2hhbmdlU3VwcG9ydClcclxuICAgICAgICAgICAgJChvcHRpb25zLnRhcmdldCkub24oJ2NoYW5nZScsICdmb3JtOm5vdCguY2hhbmdlcy1ub3RpZmljYXRpb24tZGlzYWJsZWQpIDppbnB1dFtuYW1lXScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoJCh0aGlzKS5jbG9zZXN0KCdmb3JtJykuZ2V0KDApLCB0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY1N1Ym1pdFN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdzdWJtaXQnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKHRoaXMpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgIH0sXHJcbiAgICBub3RpZnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBBZGQgbm90aWZpY2F0aW9uIGNsYXNzIHRvIHRoZSBkb2N1bWVudFxyXG4gICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLm5vdGlmeUNsYXNzKTtcclxuICAgICAgICAvLyBDaGVjayBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGNoYW5nZSBpbiB0aGUgcHJvcGVydHkgbGlzdCByZXR1cm5pbmcgdGhlIG1lc3NhZ2U6XHJcbiAgICAgICAgZm9yICh2YXIgYyBpbiB0aGlzLmNoYW5nZXNMaXN0KVxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWl0TWVzc2FnZSB8fCAodGhpcy5xdWl0TWVzc2FnZSA9ICQoJyNsY3Jlcy1xdWl0LXdpdGhvdXQtc2F2ZScpLnRleHQoKSkgfHwgJyc7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJDaGFuZ2U6IGZ1bmN0aW9uIChmLCBlKSB7XHJcbiAgICAgICAgaWYgKCFlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgdmFyIGZsID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSB8fCBbXTtcclxuICAgICAgICBpZiAoJC5pc0FycmF5KGUpKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZS5sZW5ndGg7IGkrKylcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJDaGFuZ2UoZiwgZVtpXSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG4gPSBlO1xyXG4gICAgICAgIGlmICh0eXBlb2YgKGUpICE9PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBuID0gZS5uYW1lO1xyXG4gICAgICAgICAgICAvLyBDaGVjayBpZiByZWFsbHkgdGhlcmUgd2FzIGEgY2hhbmdlIGNoZWNraW5nIGRlZmF1bHQgZWxlbWVudCB2YWx1ZVxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIChlLmRlZmF1bHRWYWx1ZSkgIT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5jaGVja2VkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgdHlwZW9mIChlLnNlbGVjdGVkKSA9PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICAgICAgICAgICAgZS52YWx1ZSA9PSBlLmRlZmF1bHRWYWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlcmUgd2FzIG5vIGNoYW5nZSwgbm8gY29udGludWVcclxuICAgICAgICAgICAgICAgIC8vIGFuZCBtYXliZSBpcyBhIHJlZ3Jlc3Npb24gZnJvbSBhIGNoYW5nZSBhbmQgbm93IHRoZSBvcmlnaW5hbCB2YWx1ZSBhZ2FpblxyXG4gICAgICAgICAgICAgICAgLy8gdHJ5IHRvIHJlbW92ZSBmcm9tIGNoYW5nZXMgbGlzdCBkb2luZyByZWdpc3RlclNhdmVcclxuICAgICAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJTYXZlKGYsIFtuXSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJChlKS5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIShuIGluIGZsKSlcclxuICAgICAgICAgICAgZmwucHVzaChuKTtcclxuICAgICAgICAkKGYpXHJcbiAgICAgICAgLmFkZENsYXNzKHRoaXMuZGVmYXVsdHMuY2hhbmdlZEZvcm1DbGFzcylcclxuICAgICAgICAvLyBwYXNzIGRhdGE6IGZvcm0sIGVsZW1lbnQgbmFtZSBjaGFuZ2VkLCBmb3JtIGVsZW1lbnQgY2hhbmdlZCAodGhpcyBjYW4gYmUgbnVsbClcclxuICAgICAgICAudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIFtmLCBuLCBlXSk7XHJcbiAgICB9LFxyXG4gICAgcmVnaXN0ZXJTYXZlOiBmdW5jdGlvbiAoZiwgZWxzKSB7XHJcbiAgICAgICAgdmFyIGZuYW1lID0gZ2V0WFBhdGgoZik7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBwcmV2RWxzID0gJC5leHRlbmQoW10sIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdKTtcclxuICAgICAgICB2YXIgciA9IHRydWU7XHJcbiAgICAgICAgaWYgKGVscykge1xyXG4gICAgICAgICAgICB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSA9ICQuZ3JlcCh0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSwgZnVuY3Rpb24gKGVsKSB7IHJldHVybiAoJC5pbkFycmF5KGVsLCBlbHMpID09IC0xKTsgfSk7XHJcbiAgICAgICAgICAgIC8vIERvbid0IHJlbW92ZSAnZicgbGlzdCBpZiBpcyBub3QgZW1wdHlcclxuICAgICAgICAgICAgciA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdLmxlbmd0aCA9PT0gMDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHIpIHtcclxuICAgICAgICAgICAgJChmKS5yZW1vdmVDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRGb3JtQ2xhc3MpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV07XHJcbiAgICAgICAgICAgIC8vIGxpbmsgZWxlbWVudHMgZnJvbSBlbHMgdG8gY2xlYW4tdXAgaXRzIGNsYXNzZXNcclxuICAgICAgICAgICAgZWxzID0gcHJldkVscztcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gcGFzcyBkYXRhOiBmb3JtLCBlbGVtZW50cyByZWdpc3RlcmVkIGFzIHNhdmUgKHRoaXMgY2FuIGJlIG51bGwpLCBhbmQgJ2Zvcm0gZnVsbHkgc2F2ZWQnIGFzIHRoaXJkIHBhcmFtIChib29sKVxyXG4gICAgICAgICQoZikudHJpZ2dlcignbGNDaGFuZ2VzTm90aWZpY2F0aW9uU2F2ZVJlZ2lzdGVyZWQnLCBbZiwgZWxzLCByXSk7XHJcbiAgICAgICAgdmFyIGxjaG4gPSB0aGlzO1xyXG4gICAgICAgIGlmIChlbHMpICQuZWFjaChlbHMsIGZ1bmN0aW9uICgpIHsgJCgnW25hbWU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSh0aGlzKSArICdcIl0nKS5yZW1vdmVDbGFzcyhsY2huLmRlZmF1bHRzLmNoYW5nZWRFbGVtZW50Q2xhc3MpOyB9KTtcclxuICAgICAgICByZXR1cm4gcHJldkVscztcclxuICAgIH1cclxufTtcclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gY2hhbmdlc05vdGlmaWNhdGlvbjtcclxufSIsIi8qIFV0aWxpdHkgdG8gY3JlYXRlIGlmcmFtZSB3aXRoIGluamVjdGVkIGh0bWwvY29udGVudCBpbnN0ZWFkIG9mIFVSTC5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlSWZyYW1lKGNvbnRlbnQsIHNpemUpIHtcclxuICAgIHZhciAkaWZyYW1lID0gJCgnPGlmcmFtZSB3aWR0aD1cIicgKyBzaXplLndpZHRoICsgJ1wiIGhlaWdodD1cIicgKyBzaXplLmhlaWdodCArICdcIiBzdHlsZT1cImJvcmRlcjpub25lO1wiPjwvaWZyYW1lPicpO1xyXG4gICAgdmFyIGlmcmFtZSA9ICRpZnJhbWUuZ2V0KDApO1xyXG4gICAgLy8gV2hlbiB0aGUgaWZyYW1lIGlzIHJlYWR5XHJcbiAgICB2YXIgaWZyYW1lbG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZnJhbWUub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIFVzaW5nIGlmcmFtZWxvYWRlZCB0byBhdm9pZCBpbmZpbml0ZSBsb29wc1xyXG4gICAgICAgIGlmICghaWZyYW1lbG9hZGVkKSB7XHJcbiAgICAgICAgICAgIGlmcmFtZWxvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBjb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuICRpZnJhbWU7XHJcbn07XHJcblxyXG4vKiBQdXRzIGZ1bGwgaHRtbCBpbnNpZGUgdGhlIGlmcmFtZSBlbGVtZW50IHBhc3NlZCBpbiBhIHNlY3VyZSBhbmQgY29tcGxpYW50IG1vZGUgKi9cclxuZnVuY3Rpb24gaW5qZWN0SWZyYW1lSHRtbChpZnJhbWUsIGh0bWwpIHtcclxuICAgIC8vIHB1dCBhamF4IGRhdGEgaW5zaWRlIGlmcmFtZSByZXBsYWNpbmcgYWxsIHRoZWlyIGh0bWwgaW4gc2VjdXJlIFxyXG4gICAgLy8gY29tcGxpYW50IG1vZGUgKCQuaHRtbCBkb24ndCB3b3JrcyB0byBpbmplY3QgPGh0bWw+PGhlYWQ+IGNvbnRlbnQpXHJcblxyXG4gICAgLyogZG9jdW1lbnQgQVBJIHZlcnNpb24gKHByb2JsZW1zIHdpdGggSUUsIGRvbid0IGV4ZWN1dGUgaWZyYW1lLWh0bWwgc2NyaXB0cykgKi9cclxuICAgIC8qdmFyIGlmcmFtZURvYyA9XHJcbiAgICAvLyBXM0MgY29tcGxpYW50OiBucywgZmlyZWZveC1nZWNrbywgY2hyb21lL3NhZmFyaS13ZWJraXQsIG9wZXJhLCBpZTlcclxuICAgIGlmcmFtZS5jb250ZW50RG9jdW1lbnQgfHxcclxuICAgIC8vIG9sZCBJRSAoNS41KylcclxuICAgIChpZnJhbWUuY29udGVudFdpbmRvdyA/IGlmcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50IDogbnVsbCkgfHxcclxuICAgIC8vIGZhbGxiYWNrICh2ZXJ5IG9sZCBJRT8pXHJcbiAgICBkb2N1bWVudC5mcmFtZXNbaWZyYW1lLmlkXS5kb2N1bWVudDtcclxuICAgIGlmcmFtZURvYy5vcGVuKCk7XHJcbiAgICBpZnJhbWVEb2Mud3JpdGUoaHRtbCk7XHJcbiAgICBpZnJhbWVEb2MuY2xvc2UoKTsqL1xyXG5cclxuICAgIC8qIGphdmFzY3JpcHQgVVJJIHZlcnNpb24gKHdvcmtzIGZpbmUgZXZlcnl3aGVyZSEpICovXHJcbiAgICBpZnJhbWUuY29udGVudFdpbmRvdy5jb250ZW50cyA9IGh0bWw7XHJcbiAgICBpZnJhbWUuc3JjID0gJ2phdmFzY3JpcHQ6d2luZG93W1wiY29udGVudHNcIl0nO1xyXG5cclxuICAgIC8vIEFib3V0IHRoaXMgdGVjaG5pcXVlLCB0aGlzIGh0dHA6Ly9zcGFyZWN5Y2xlcy53b3JkcHJlc3MuY29tLzIwMTIvMDMvMDgvaW5qZWN0LWNvbnRlbnQtaW50by1hLW5ldy1pZnJhbWUvXHJcbn1cclxuXHJcbiIsIi8qIENSVURMIEhlbHBlciAqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnLi9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcbnZhciBnZXRUZXh0ID0gcmVxdWlyZSgnLi9nZXRUZXh0Jyk7XHJcblxyXG5leHBvcnRzLmRlZmF1bHRTZXR0aW5ncyA9IHtcclxuICBlZmZlY3RzOiB7XHJcbiAgICAnc2hvdy12aWV3ZXInOiB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSxcclxuICAgICdoaWRlLXZpZXdlcic6IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9LFxyXG4gICAgJ3Nob3ctZWRpdG9yJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0sIC8vIHRoZSBzYW1lIGFzIGpxdWVyeS11aSB7IGVmZmVjdDogJ3NsaWRlJywgZHVyYXRpb246ICdzbG93JywgZGlyZWN0aW9uOiAnZG93bicgfVxyXG4gICAgJ2hpZGUtZWRpdG9yJzogeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH1cclxuICB9LFxyXG4gIGV2ZW50czoge1xyXG4gICAgJ2VkaXQtZW5kcyc6ICdjcnVkbC1lZGl0LWVuZHMnLFxyXG4gICAgJ2VkaXQtc3RhcnRzJzogJ2NydWRsLWVkaXQtc3RhcnRzJyxcclxuICAgICdlZGl0b3ItcmVhZHknOiAnY3J1ZGwtZWRpdG9yLXJlYWR5JyxcclxuICAgICdlZGl0b3Itc2hvd2VkJzogJ2NydWRsLWVkaXRvci1zaG93ZWQnLFxyXG4gICAgJ2NyZWF0ZSc6ICdjcnVkbC1jcmVhdGUnLFxyXG4gICAgJ3VwZGF0ZSc6ICdjcnVkbC11cGRhdGUnLFxyXG4gICAgJ2RlbGV0ZSc6ICdjcnVkbC1kZWxldGUnXHJcbiAgfVxyXG59O1xyXG5cclxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uIHNldHVwQ3J1ZGwob25TdWNjZXNzLCBvbkVycm9yLCBvbkNvbXBsZXRlKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uOiBmdW5jdGlvbiBvbihzZWxlY3Rvciwgc2V0dGluZ3MpIHtcclxuICAgICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCAnLmNydWRsJztcclxuICAgICAgdmFyIGluc3RhbmNlID0ge1xyXG4gICAgICAgIHNlbGVjdG9yOiBzZWxlY3RvcixcclxuICAgICAgICBlbGVtZW50czogJChzZWxlY3RvcilcclxuICAgICAgfTtcclxuICAgICAgLy8gRXh0ZW5kaW5nIGRlZmF1bHQgc2V0dGluZ3Mgd2l0aCBwcm92aWRlZCBvbmVzLFxyXG4gICAgICAvLyBidXQgc29tZSBjYW4gYmUgdHdlYWsgb3V0c2lkZSB0b28uXHJcbiAgICAgIGluc3RhbmNlLnNldHRpbmdzID0gJC5leHRlbmQodHJ1ZSwgZXhwb3J0cy5kZWZhdWx0U2V0dGluZ3MsIHNldHRpbmdzKTtcclxuXHJcbiAgICAgIGluc3RhbmNlLmVsZW1lbnRzLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBjcnVkbCA9ICQodGhpcyk7XHJcbiAgICAgICAgaWYgKGNydWRsLmRhdGEoJ19fY3J1ZGxfaW5pdGlhbGl6ZWRfXycpID09PSB0cnVlKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGRjdHggPSBjcnVkbC5kYXRhKCdjcnVkbC1jb250ZXh0JykgfHwgJyc7XHJcbiAgICAgICAgdmFyIHZ3ciA9IGNydWRsLmZpbmQoJy5jcnVkbC12aWV3ZXInKTtcclxuICAgICAgICB2YXIgZHRyID0gY3J1ZGwuZmluZCgnLmNydWRsLWVkaXRvcicpO1xyXG4gICAgICAgIHZhciBpaWRwYXIgPSBjcnVkbC5kYXRhKCdjcnVkbC1pdGVtLWlkLXBhcmFtZXRlcicpIHx8ICdJdGVtSUQnO1xyXG4gICAgICAgIHZhciBmb3JtcGFycyA9IHsgYWN0aW9uOiAnY3JlYXRlJyB9O1xyXG4gICAgICAgIGZvcm1wYXJzW2lpZHBhcl0gPSAwO1xyXG4gICAgICAgIHZhciBlZGl0b3JJbml0aWFsTG9hZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldEV4dHJhUXVlcnkoZWwpIHtcclxuICAgICAgICAgIC8vIEdldCBleHRyYSBxdWVyeSBvZiB0aGUgZWxlbWVudCwgaWYgYW55OlxyXG4gICAgICAgICAgdmFyIHhxID0gZWwuZGF0YSgnY3J1ZGwtZXh0cmEtcXVlcnknKSB8fCAnJztcclxuICAgICAgICAgIGlmICh4cSkgeHEgPSAnJicgKyB4cTtcclxuICAgICAgICAgIC8vIEl0ZXJhdGUgYWxsIHBhcmVudHMgaW5jbHVkaW5nIHRoZSAnY3J1ZGwnIGVsZW1lbnQgKHBhcmVudHNVbnRpbCBleGNsdWRlcyB0aGUgZmlyc3QgZWxlbWVudCBnaXZlbixcclxuICAgICAgICAgIC8vIGJlY2F1c2Ugb2YgdGhhdCB3ZSBnZXQgaXRzIHBhcmVudCgpKVxyXG4gICAgICAgICAgLy8gRm9yIGFueSBvZiB0aGVtIHdpdGggYW4gZXh0cmEtcXVlcnksIGFwcGVuZCBpdDpcclxuICAgICAgICAgIGVsLnBhcmVudHNVbnRpbChjcnVkbC5wYXJlbnQoKSwgJ1tkYXRhLWNydWRsLWV4dHJhLXF1ZXJ5XScpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgeCA9ICQodGhpcykuZGF0YSgnY3J1ZGwtZXh0cmEtcXVlcnknKTtcclxuICAgICAgICAgICAgaWYgKHgpIHhxICs9ICcmJyArIHg7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIHJldHVybiB4cTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNydWRsLmZpbmQoJy5jcnVkbC1jcmVhdGUnKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gMDtcclxuICAgICAgICAgIGZvcm1wYXJzLmFjdGlvbiA9ICdjcmVhdGUnO1xyXG4gICAgICAgICAgdmFyIHhxID0gZ2V0RXh0cmFRdWVyeSgkKHRoaXMpKTtcclxuICAgICAgICAgIGVkaXRvckluaXRpYWxMb2FkID0gdHJ1ZTtcclxuICAgICAgICAgIGR0ci5yZWxvYWQoe1xyXG4gICAgICAgICAgICB1cmw6IGZ1bmN0aW9uICh1cmwsIGRlZmF1bHRVcmwpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gZGVmYXVsdFVybCArICc/JyArICQucGFyYW0oZm9ybXBhcnMpICsgeHE7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICBkdHIueHNob3coaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy1lZGl0b3InXSlcclxuICAgICAgICAgICAgICAucXVldWUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1zaG93ZWQnXSwgW2R0cl0pO1xyXG4gICAgICAgICAgICAgICAgZHRyLmRlcXVldWUoKTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBIaWRlIHZpZXdlciB3aGVuIGluIGVkaXRvcjpcclxuICAgICAgICAgIHZ3ci54aGlkZShpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydoaWRlLXZpZXdlciddKTtcclxuICAgICAgICAgIC8vIEN1c3RvbSBldmVudFxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10pXHJcbiAgICAgICAgICAudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHMuY3JlYXRlKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHZ3clxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLXVwZGF0ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgaXRlbSA9ICR0LmNsb3Nlc3QoJy5jcnVkbC1pdGVtJyk7XHJcbiAgICAgICAgICB2YXIgaXRlbWlkID0gaXRlbS5kYXRhKCdjcnVkbC1pdGVtLWlkJyk7XHJcbiAgICAgICAgICBmb3JtcGFyc1tpaWRwYXJdID0gaXRlbWlkO1xyXG4gICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ3VwZGF0ZSc7XHJcbiAgICAgICAgICB2YXIgeHEgPSBnZXRFeHRyYVF1ZXJ5KCQodGhpcykpO1xyXG4gICAgICAgICAgZWRpdG9ySW5pdGlhbExvYWQgPSB0cnVlO1xyXG4gICAgICAgICAgZHRyLnJlbG9hZCh7XHJcbiAgICAgICAgICAgIHVybDogZnVuY3Rpb24gKHVybCwgZGVmYXVsdFVybCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiBkZWZhdWx0VXJsICsgJz8nICsgJC5wYXJhbShmb3JtcGFycykgKyB4cTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGR0ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LWVkaXRvciddKVxyXG4gICAgICAgICAgICAgIC5xdWV1ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBbZHRyXSk7XHJcbiAgICAgICAgICAgICAgICBkdHIuZGVxdWV1ZSgpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEhpZGUgdmlld2VyIHdoZW4gaW4gZWRpdG9yOlxyXG4gICAgICAgICAgdndyLnhoaWRlKGluc3RhbmNlLnNldHRpbmdzLmVmZmVjdHNbJ2hpZGUtdmlld2VyJ10pO1xyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSlcclxuICAgICAgICAgIC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50cy51cGRhdGUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLWRlbGV0ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgaXRlbSA9ICR0LmNsb3Nlc3QoJy5jcnVkbC1pdGVtJyk7XHJcbiAgICAgICAgICB2YXIgaXRlbWlkID0gaXRlbS5kYXRhKCdjcnVkbC1pdGVtLWlkJyk7XHJcblxyXG4gICAgICAgICAgaWYgKGNvbmZpcm0oZ2V0VGV4dCgnY29uZmlybS1kZWxldGUtY3J1ZGwtaXRlbS1tZXNzYWdlOicgKyBkY3R4KSkpIHtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbignPGRpdj4nICsgZ2V0VGV4dCgnZGVsZXRlLWNydWRsLWl0ZW0tbG9hZGluZy1tZXNzYWdlOicgKyBkY3R4KSArICc8L2Rpdj4nLCBpdGVtKTtcclxuICAgICAgICAgICAgZm9ybXBhcnNbaWlkcGFyXSA9IGl0ZW1pZDtcclxuICAgICAgICAgICAgZm9ybXBhcnMuYWN0aW9uID0gJ2RlbGV0ZSc7XHJcbiAgICAgICAgICAgIHZhciB4cSA9IGdldEV4dHJhUXVlcnkoJCh0aGlzKSk7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgdXJsOiBkdHIuYXR0cignZGF0YS1zb3VyY2UtdXJsJykgKyAnPycgKyAkLnBhcmFtKGZvcm1wYXJzKSArIHhxLFxyXG4gICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJzxkaXY+JyArIGRhdGEuUmVzdWx0ICsgJzwvZGl2PicsIGl0ZW0sIG51bGwsIHtcclxuICAgICAgICAgICAgICAgICAgICBjbG9zYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uZmFkZU91dCgnc2xvdycsIGZ1bmN0aW9uICgpIHsgaXRlbS5yZW1vdmUoKTsgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICBvblN1Y2Nlc3MoZGF0YSwgdGV4dCwgangpO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChqeCwgbWVzc2FnZSwgZXgpIHtcclxuICAgICAgICAgICAgICAgIG9uRXJyb3IoangsIG1lc3NhZ2UsIGV4KTtcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlKGl0ZW0pO1xyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgY29tcGxldGU6IG9uQ29tcGxldGVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZGVsZXRlJ10pO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZmluaXNoRWRpdCgpIHtcclxuICAgICAgICAgIGZ1bmN0aW9uIG9uY29tcGxldGUoYW5vdGhlck9uQ29tcGxldGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAvLyBTaG93IGFnYWluIHRoZSBWaWV3ZXJcclxuICAgICAgICAgICAgICAvL3Z3ci5zbGlkZURvd24oJ3Nsb3cnKTtcclxuICAgICAgICAgICAgICBpZiAoIXZ3ci5pcygnOnZpc2libGUnKSlcclxuICAgICAgICAgICAgICAgIHZ3ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LXZpZXdlciddKTtcclxuICAgICAgICAgICAgICAvLyBNYXJrIHRoZSBmb3JtIGFzIHVuY2hhbmdlZCB0byBhdm9pZCBwZXJzaXN0aW5nIHdhcm5pbmdzXHJcbiAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoZHRyLmZpbmQoJ2Zvcm0nKS5nZXQoMCkpO1xyXG4gICAgICAgICAgICAgIC8vIEF2b2lkIGNhY2hlZCBjb250ZW50IG9uIHRoZSBFZGl0b3JcclxuICAgICAgICAgICAgICBkdHIuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gdXNlciBjYWxsYmFjazpcclxuICAgICAgICAgICAgICBpZiAodHlwZW9mIChhbm90aGVyT25Db21wbGV0ZSkgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICAgICAgICBhbm90aGVyT25Db21wbGV0ZS5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIFdlIG5lZWQgYSBjdXN0b20gY29tcGxldGUgY2FsbGJhY2ssIGJ1dCB0byBub3QgcmVwbGFjZSB0aGUgdXNlciBjYWxsYmFjaywgd2VcclxuICAgICAgICAgIC8vIGNsb25lIGZpcnN0IHRoZSBzZXR0aW5ncyBhbmQgdGhlbiBhcHBseSBvdXIgY2FsbGJhY2sgdGhhdCBpbnRlcm5hbGx5IHdpbGwgY2FsbFxyXG4gICAgICAgICAgLy8gdGhlIHVzZXIgY2FsbGJhY2sgcHJvcGVybHkgKGlmIGFueSlcclxuICAgICAgICAgIHZhciB3aXRoY2FsbGJhY2sgPSAkLmV4dGVuZCh0cnVlLCB7fSwgaW5zdGFuY2Uuc2V0dGluZ3MuZWZmZWN0c1snaGlkZS1lZGl0b3InXSk7XHJcbiAgICAgICAgICB3aXRoY2FsbGJhY2suY29tcGxldGUgPSBvbmNvbXBsZXRlKHdpdGhjYWxsYmFjay5jb21wbGV0ZSk7XHJcbiAgICAgICAgICAvLyBIaWRpbmcgZWRpdG9yOlxyXG4gICAgICAgICAgZHRyLnhoaWRlKHdpdGhjYWxsYmFjayk7XHJcblxyXG4gICAgICAgICAgLy8gTWFyayBmb3JtIGFzIHNhdmVkIHRvIHJlbW92ZSB0aGUgJ2hhcy1jaGFuZ2VzJyBtYXJrXHJcbiAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShkdHIuZmluZCgnZm9ybScpLmdldCgwKSk7XHJcblxyXG4gICAgICAgICAgLy8gQ3VzdG9tIGV2ZW50XHJcbiAgICAgICAgICBjcnVkbC50cmlnZ2VyKGluc3RhbmNlLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10pO1xyXG5cclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGR0clxyXG4gICAgICAgIC5vbignY2xpY2snLCAnLmNydWRsLWNhbmNlbCcsIGZpbmlzaEVkaXQpXHJcbiAgICAgICAgLm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgJy5hamF4LWJveCcsIGZpbmlzaEVkaXQpXHJcbiAgICAgICAgLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCAnZm9ybSwgZmllbGRzZXQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xyXG4gICAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMCB8fCBkYXRhLkNvZGUgPT0gNSB8fCBkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBTaG93IHZpZXdlciBhbmQgcmVsb2FkIGxpc3Q6XHJcbiAgICAgICAgICAgIHZ3ci54c2hvdyhpbnN0YW5jZS5zZXR0aW5ncy5lZmZlY3RzWydzaG93LXZpZXdlciddKVxyXG4gICAgICAgICAgICAuZmluZCgnLmNydWRsLWxpc3QnKS5yZWxvYWQoeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gQSBzbWFsbCBkZWxheSB0byBsZXQgdXNlciB0byBzZWUgdGhlIG5ldyBtZXNzYWdlIG9uIGJ1dHRvbiBiZWZvcmVcclxuICAgICAgICAgIC8vIGhpZGUgaXQgKGJlY2F1c2UgaXMgaW5zaWRlIHRoZSBlZGl0b3IpXHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDUpXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmluaXNoRWRpdCwgMTUwMCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0sIGZpZWxkc2V0JywgZnVuY3Rpb24gKGpiLCBmb3JtLCBqeCkge1xyXG4gICAgICAgICAgLy8gRW1pdCB0aGUgJ2VkaXRvci1yZWFkeScgZXZlbnQgb24gZWRpdG9yIEh0bWwgYmVpbmcgcmVwbGFjZWRcclxuICAgICAgICAgIC8vIChmaXJzdCBsb2FkIG9yIG5leHQgbG9hZHMgYmVjYXVzZSBvZiBzZXJ2ZXItc2lkZSB2YWxpZGF0aW9uIGVycm9ycylcclxuICAgICAgICAgIC8vIHRvIGFsbG93IGxpc3RlbmVycyB0byBkbyBhbnkgd29yayBvdmVyIGl0cyAobmV3KSBET00gZWxlbWVudHMuXHJcbiAgICAgICAgICAvLyBUaGUgc2Vjb25kIGN1c3RvbSBwYXJhbWV0ZXIgcGFzc2VkIG1lYW5zIGlzIG1lYW4gdG9cclxuICAgICAgICAgIC8vIGRpc3Rpbmd1aXNoIHRoZSBmaXJzdCB0aW1lIGNvbnRlbnQgbG9hZCBhbmQgc3VjY2Vzc2l2ZSB1cGRhdGVzIChkdWUgdG8gdmFsaWRhdGlvbiBlcnJvcnMpLlxyXG4gICAgICAgICAgY3J1ZGwudHJpZ2dlcihpbnN0YW5jZS5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBbZHRyLCBlZGl0b3JJbml0aWFsTG9hZF0pO1xyXG5cclxuICAgICAgICAgIC8vIE5leHQgdGltZXM6XHJcbiAgICAgICAgICBlZGl0b3JJbml0aWFsTG9hZCA9IGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBjcnVkbC5kYXRhKCdfX2NydWRsX2luaXRpYWxpemVkX18nLCB0cnVlKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gaW5zdGFuY2U7XHJcbiAgICB9XHJcbiAgfTtcclxufTtcclxuIiwiLyoqXHJcbiAgVGhpcyBtb2R1bGUgaGFzIHV0aWxpdGllcyB0byBjb252ZXJ0IGEgRGF0ZSBvYmplY3QgaW50b1xyXG4gIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIGZvbGxvd2luZyBJU08tODYwMSBzcGVjaWZpY2F0aW9uLlxyXG4gIFxyXG4gIElOQ09NUExFVEUgQlVUIFVTRUZVTC5cclxuICBcclxuICBTdGFuZGFyZCByZWZlcnMgdG8gZm9ybWF0IHZhcmlhdGlvbnM6XHJcbiAgLSBiYXNpYzogbWluaW11bSBzZXBhcmF0b3JzXHJcbiAgLSBleHRlbmRlZDogYWxsIHNlcGFyYXRvcnMsIG1vcmUgcmVhZGFibGVcclxuICBCeSBkZWZhdWx0LCBhbGwgbWV0aG9kcyBwcmludHMgdGhlIGJhc2ljIGZvcm1hdCxcclxuICBleGNlcHRzIHRoZSBwYXJhbWV0ZXIgJ2V4dGVuZGVkJyBpcyBzZXQgdG8gdHJ1ZVxyXG5cclxuICBUT0RPOlxyXG4gIC0gVFo6IGFsbG93IGZvciBUaW1lIFpvbmUgc3VmZml4ZXMgKHBhcnNlIGFsbG93IGl0IGFuZCBcclxuICAgIGRldGVjdCBVVEMgYnV0IGRvIG5vdGhpbmcgd2l0aCBhbnkgdGltZSB6b25lIG9mZnNldCBkZXRlY3RlZClcclxuICAtIEZyYWN0aW9ucyBvZiBzZWNvbmRzXHJcbioqL1xyXG5leHBvcnRzLmRhdGVVVEMgPSBmdW5jdGlvbiBkYXRlVVRDKGRhdGUsIGV4dGVuZGVkKSB7XHJcbiAgdmFyIG0gPSAoZGF0ZS5nZXRVVENNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgZCA9IGRhdGUuZ2V0VVRDRGF0ZSgpLnRvU3RyaW5nKCksXHJcbiAgICAgIHkgPSBkYXRlLmdldFVUQ0Z1bGxZZWFyKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgIGQgPSAnMCcgKyBkO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4geSArICctJyArIG0gKyAnLScgKyBkO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiB5ICsgbSArIGQ7XHJcbn07XHJcblxyXG5leHBvcnRzLmRhdGVMb2NhbCA9IGZ1bmN0aW9uIGRhdGVMb2NhbChkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBtID0gKGRhdGUuZ2V0TW9udGgoKSArIDEpLnRvU3RyaW5nKCksXHJcbiAgICAgIGQgPSBkYXRlLmdldERhdGUoKS50b1N0cmluZygpLFxyXG4gICAgICB5ID0gZGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCk7XHJcbiAgaWYgKG0ubGVuZ3RoID09IDEpXHJcbiAgICBtID0gJzAnICsgbTtcclxuICBpZiAoZC5sZW5ndGggPT0gMSlcclxuICAgIGQgPSAnMCcgKyBkO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4geSArICctJyArIG0gKyAnLScgKyBkO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiB5ICsgbSArIGQ7XHJcbn07XHJcblxyXG4vKipcclxuICBIb3VycywgbWludXRlcyBhbmQgc2Vjb25kc1xyXG4qKi9cclxuZXhwb3J0cy50aW1lTG9jYWwgPSBmdW5jdGlvbiB0aW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgcyA9IGRhdGUuZ2V0U2Vjb25kcygpLnRvU3RyaW5nKCksXHJcbiAgICAgIGhtID0gZXhwb3J0cy5zaG9ydFRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PSAxKVxyXG4gICAgcyA9ICcwJyArIHM7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBobSArICc6JyArIHM7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGhtICsgcztcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzLCBtaW51dGVzIGFuZCBzZWNvbmRzIFVUQ1xyXG4qKi9cclxuZXhwb3J0cy50aW1lVVRDID0gZnVuY3Rpb24gdGltZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBzID0gZGF0ZS5nZXRVVENTZWNvbmRzKCkudG9TdHJpbmcoKSxcclxuICAgICAgaG0gPSBleHBvcnRzLnNob3J0VGltZVVUQyhkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChzLmxlbmd0aCA9PSAxKVxyXG4gICAgcyA9ICcwJyArIHM7XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBobSArICc6JyArIHM7XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGhtICsgcztcclxufTtcclxuXHJcbi8qKlxyXG4gIEhvdXJzIGFuZCBtaW51dGVzXHJcbioqL1xyXG5leHBvcnRzLnNob3J0VGltZUxvY2FsID0gZnVuY3Rpb24gc2hvcnRUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICB2YXIgaCA9IGRhdGUuZ2V0SG91cnMoKS50b1N0cmluZygpLFxyXG4gICAgICBtID0gZGF0ZS5nZXRNaW51dGVzKCkudG9TdHJpbmcoKTtcclxuXHJcbiAgaWYgKGgubGVuZ3RoID09IDEpXHJcbiAgICBoID0gJzAnICsgaDtcclxuICBpZiAobS5sZW5ndGggPT0gMSlcclxuICAgIG0gPSAnMCcgKyBtO1xyXG5cclxuICBpZiAoZXh0ZW5kZWQpXHJcbiAgICByZXR1cm4gaCArICc6JyArIG07XHJcbiAgZWxzZVxyXG4gICAgcmV0dXJuIGggKyBtO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgSG91cnMgYW5kIG1pbnV0ZXMgVVRDXHJcbioqL1xyXG5leHBvcnRzLnNob3J0VGltZVVUQyA9IGZ1bmN0aW9uIHNob3J0VGltZVVUQyhkYXRlLCBleHRlbmRlZCkge1xyXG4gIHZhciBoID0gZGF0ZS5nZXRVVENIb3VycygpLnRvU3RyaW5nKCksXHJcbiAgICAgIG0gPSBkYXRlLmdldFVUQ01pbnV0ZXMoKS50b1N0cmluZygpO1xyXG5cclxuICBpZiAoaC5sZW5ndGggPT0gMSlcclxuICAgIGggPSAnMCcgKyBoO1xyXG4gIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgbSA9ICcwJyArIG07XHJcblxyXG4gIGlmIChleHRlbmRlZClcclxuICAgIHJldHVybiBoICsgJzonICsgbTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gaCArIG07XHJcbn07XHJcblxyXG4vKipcclxuICBUT0RPOiBIb3VycywgbWludXRlcywgc2Vjb25kcyBhbmQgZnJhY3Rpb25zIG9mIHNlY29uZHNcclxuKiovXHJcbmV4cG9ydHMubG9uZ1RpbWVMb2NhbCA9IGZ1bmN0aW9uIGxvbmdUaW1lTG9jYWwoZGF0ZSwgZXh0ZW5kZWQpIHtcclxuICAvL1RPRE9cclxufTtcclxuXHJcbi8qKlxyXG4gIFVUQyBEYXRlIGFuZCBUaW1lIHNlcGFyYXRlZCBieSBULlxyXG4gIFN0YW5kYXJkIGFsbG93cyBvbWl0IHRoZSBzZXBhcmF0b3IgYXMgZXhjZXB0aW9uYWwsIGJvdGggcGFydHMgYWdyZWVtZW50LCBjYXNlcztcclxuICBjYW4gYmUgZG9uZSBwYXNzaW5nIHRydWUgYXMgb2Ygb21pdFNlcGFyYXRvciBwYXJhbWV0ZXIsIGJ5IGRlZmF1bHQgZmFsc2UuXHJcbioqL1xyXG5leHBvcnRzLmRhdGV0aW1lTG9jYWwgPSBmdW5jdGlvbiBkYXRldGltZUxvY2FsKGRhdGUsIGV4dGVuZGVkLCBvbWl0U2VwYXJhdG9yKSB7XHJcbiAgdmFyIGQgPSBleHBvcnRzLmRhdGVMb2NhbChkYXRlLCBleHRlbmRlZCksXHJcbiAgICAgIHQgPSBleHBvcnRzLnRpbWVMb2NhbChkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChvbWl0U2VwYXJhdG9yKVxyXG4gICAgcmV0dXJuIGQgKyB0O1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBkICsgJ1QnICsgdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIExvY2FsIERhdGUgYW5kIFRpbWUgc2VwYXJhdGVkIGJ5IFQuXHJcbiAgU3RhbmRhcmQgYWxsb3dzIG9taXQgdGhlIHNlcGFyYXRvciBhcyBleGNlcHRpb25hbCwgYm90aCBwYXJ0cyBhZ3JlZW1lbnQsIGNhc2VzO1xyXG4gIGNhbiBiZSBkb25lIHBhc3NpbmcgdHJ1ZSBhcyBvZiBvbWl0U2VwYXJhdG9yIHBhcmFtZXRlciwgYnkgZGVmYXVsdCBmYWxzZS5cclxuKiovXHJcbmV4cG9ydHMuZGF0ZXRpbWVVVEMgPSBmdW5jdGlvbiBkYXRldGltZVVUQyhkYXRlLCBleHRlbmRlZCwgb21pdFNlcGFyYXRvcikge1xyXG4gIHZhciBkID0gZXhwb3J0cy5kYXRlVVRDKGRhdGUsIGV4dGVuZGVkKSxcclxuICAgICAgdCA9IGV4cG9ydHMudGltZVVUQyhkYXRlLCBleHRlbmRlZCk7XHJcblxyXG4gIGlmIChvbWl0U2VwYXJhdG9yKVxyXG4gICAgcmV0dXJuIGQgKyB0O1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBkICsgJ1QnICsgdDtcclxufTtcclxuXHJcbi8qKlxyXG4gIFBhcnNlIGEgc3RyaW5nIGludG8gYSBEYXRlIG9iamVjdCBpZiBpcyBhIHZhbGlkIElTTy04NjAxIGZvcm1hdC5cclxuICBQYXJzZSBzaW5nbGUgZGF0ZSwgc2luZ2xlIHRpbWUgb3IgZGF0ZS10aW1lIGZvcm1hdHMuXHJcbiAgSU1QT1JUQU5UOiBJdCBkb2VzIE5PVCBjb252ZXJ0IGJldHdlZW4gdGhlIGRhdGVzdHIgVGltZVpvbmUgYW5kIHRoZVxyXG4gIGxvY2FsIFRpbWVab25lIChlaXRoZXIgaXQgYWxsb3dzIGRhdGVzdHIgdG8gaW5jbHVkZWQgVGltZVpvbmUgaW5mb3JtYXRpb24pXHJcbiAgVE9ETzogT3B0aW9uYWwgVCBzZXBhcmF0b3IgaXMgbm90IGFsbG93ZWQuXHJcbiAgVE9ETzogTWlsbGlzZWNvbmRzL2ZyYWN0aW9ucyBvZiBzZWNvbmRzIG5vdCBzdXBwb3J0ZWRcclxuKiovXHJcbmV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbiBwYXJzZShkYXRlc3RyKSB7XHJcbiAgdmFyIGR0ID0gZGF0ZXN0ci5zcGxpdCgnVCcpLFxyXG4gICAgZGF0ZSA9IGR0WzBdLFxyXG4gICAgdGltZSA9IGR0Lmxlbmd0aCA9PSAyID8gZHRbMV0gOiBudWxsO1xyXG5cclxuICBpZiAoZHQubGVuZ3RoID4gMilcclxuICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCBmb3JtYXRcIik7XHJcblxyXG4gIC8vIENoZWNrIGlmIGRhdGUgY29udGFpbnMgYSB0aW1lO1xyXG4gIC8vIGJlY2F1c2UgbWF5YmUgZGF0ZXN0ciBpcyBvbmx5IHRoZSB0aW1lIHBhcnRcclxuICBpZiAoLzp8XlxcZHs0LDZ9W15cXC1dKFxcLlxcZCopPyg/Olp8WytcXC1dLiopPyQvLnRlc3QoZGF0ZSkpIHtcclxuICAgIHRpbWUgPSBkYXRlO1xyXG4gICAgZGF0ZSA9IG51bGw7XHJcbiAgfVxyXG5cclxuICB2YXIgeSwgbSwgZCwgaCwgbW0sIHMsIHR6LCB1dGM7XHJcblxyXG4gIGlmIChkYXRlKSB7XHJcbiAgICB2YXIgZHBhcnRzID0gLyhcXGR7NH0pXFwtPyhcXGR7Mn0pXFwtPyhcXGR7Mn0pLy5leGVjKGRhdGUpO1xyXG4gICAgaWYgKCFkcGFydHMpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCBkYXRlIGZvcm1hdFwiKTtcclxuXHJcbiAgICB5ID0gZHBhcnRzWzFdO1xyXG4gICAgbSA9IGRwYXJ0c1syXTtcclxuICAgIGQgPSBkcGFydHNbM107XHJcbiAgfVxyXG5cclxuICBpZiAodGltZSkge1xyXG4gICAgdmFyIHRwYXJ0cyA9IC8oXFxkezJ9KTo/KFxcZHsyfSkoPzo6PyhcXGR7Mn0pKT8oWnxbK1xcLV0uKik/Ly5leGVjKHRpbWUpO1xyXG4gICAgaWYgKCF0cGFydHMpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCBpbnB1dCB0aW1lIGZvcm1hdFwiKTtcclxuXHJcbiAgICBoID0gdHBhcnRzWzFdO1xyXG4gICAgbW0gPSB0cGFydHNbMl07XHJcbiAgICBzID0gdHBhcnRzLmxlbmd0aCA+IDMgPyB0cGFydHNbM10gOiBudWxsO1xyXG4gICAgdHogPSB0cGFydHMubGVuZ3RoID4gNCA/IHRwYXJ0c1s0XSA6IG51bGw7XHJcbiAgICAvLyBEZXRlY3RzIGlmIGlzIGEgdGltZSBpbiBVVEM6XHJcbiAgICB1dGMgPSAvXlokL2kudGVzdCh0eik7XHJcbiAgfVxyXG5cclxuICAvLyBWYXIgdG8gaG9sZCB0aGUgcGFyc2VkIHZhbHVlLCB3ZSBzdGFydCB3aXRoIHRvZGF5LFxyXG4gIC8vIHRoYXQgd2lsbCBmaWxsIHRoZSBtaXNzaW5nIHBhcnRzXHJcbiAgdmFyIHBhcnNlZERhdGUgPSBuZXcgRGF0ZSgpO1xyXG5cclxuICBpZiAoZGF0ZSkge1xyXG4gICAgLy8gVXBkYXRpbmcgdGhlIGRhdGUgb2JqZWN0IHdpdGggZWFjaCB5ZWFyLCBtb250aCBhbmQgZGF0ZS9kYXkgZGV0ZWN0ZWQ6XHJcbiAgICBpZiAodXRjKVxyXG4gICAgICBwYXJzZWREYXRlLnNldFVUQ0Z1bGxZZWFyKHksIG0sIGQpO1xyXG4gICAgZWxzZVxyXG4gICAgICBwYXJzZWREYXRlLnNldEZ1bGxZZWFyKHksIG0sIGQpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRpbWUpIHtcclxuICAgIGlmICh1dGMpXHJcbiAgICAgIHBhcnNlZERhdGUuc2V0VVRDSG91cnMoaCwgbW0sIHMpO1xyXG4gICAgZWxzZVxyXG4gICAgICBwYXJzZWREYXRlLnNldEhvdXJzKGgsIG1tLCBzKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBwYXJzZWREYXRlO1xyXG59OyIsIi8qIERhdGUgcGlja2VyIGluaXRpYWxpemF0aW9uIGFuZCB1c2VcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBEYXRlUGlja2VyKCkge1xyXG4gICAgLy8gRGF0ZSBQaWNrZXJcclxuICAgICQuZGF0ZXBpY2tlci5zZXREZWZhdWx0cygkLmRhdGVwaWNrZXIucmVnaW9uYWxbJCgnaHRtbCcpLmF0dHIoJ2xhbmcnKV0pO1xyXG4gICAgJCgnLmRhdGUtcGljaycsIGRvY3VtZW50KS5kYXRlcGlja2VyKHtcclxuICAgICAgICBzaG93QW5pbTogJ2JsaW5kJ1xyXG4gICAgfSk7XHJcbiAgICBhcHBseURhdGVQaWNrZXIoKTtcclxufVxyXG5mdW5jdGlvbiBhcHBseURhdGVQaWNrZXIoZWxlbWVudCkge1xyXG4gICAgJChcIi5kYXRlLXBpY2tcIiwgZWxlbWVudCB8fCBkb2N1bWVudClcclxuICAgIC8vLnZhbChuZXcgRGF0ZSgpLmFzU3RyaW5nKCQuZGF0ZXBpY2tlci5fZGVmYXVsdHMuZGF0ZUZvcm1hdCkpXHJcbiAgICAuZGF0ZXBpY2tlcih7XHJcbiAgICAgICAgc2hvd0FuaW06IFwiYmxpbmRcIlxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGluaXQ6IHNldHVwRGF0ZVBpY2tlcixcclxuICAgICAgICBhcHBseTogYXBwbHlEYXRlUGlja2VyXHJcbiAgICB9O1xyXG4iLCIvKiBGb3JtYXQgYSBkYXRlIGFzIFlZWVktTU0tREQgaW4gVVRDIGZvciBzYXZlIHVzXHJcbiAgICB0byBpbnRlcmNoYW5nZSB3aXRoIG90aGVyIG1vZHVsZXMgb3IgYXBwcy5cclxuKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcoZGF0ZSkge1xyXG4gICAgdmFyIG0gPSAoZGF0ZS5nZXRVVENNb250aCgpICsgMSkudG9TdHJpbmcoKSxcclxuICAgICAgICBkID0gZGF0ZS5nZXRVVENEYXRlKCkudG9TdHJpbmcoKTtcclxuICAgIGlmIChtLmxlbmd0aCA9PSAxKVxyXG4gICAgICAgIG0gPSAnMCcgKyBtO1xyXG4gICAgaWYgKGQubGVuZ3RoID09IDEpXHJcbiAgICAgICAgZCA9ICcwJyArIGQ7XHJcbiAgICByZXR1cm4gZGF0ZS5nZXRVVENGdWxsWWVhcigpLnRvU3RyaW5nKCkgKyAnLScgKyBtICsgJy0nICsgZDtcclxufTsiLCIvKiogQW4gaTE4biB1dGlsaXR5LCBnZXQgYSB0cmFuc2xhdGlvbiB0ZXh0IGJ5IGxvb2tpbmcgZm9yIHNwZWNpZmljIGVsZW1lbnRzIGluIHRoZSBodG1sXHJcbndpdGggdGhlIG5hbWUgZ2l2ZW4gYXMgZmlyc3QgcGFyYW1lbnRlciBhbmQgYXBwbHlpbmcgdGhlIGdpdmVuIHZhbHVlcyBvbiBzZWNvbmQgYW5kIFxyXG5vdGhlciBwYXJhbWV0ZXJzLlxyXG4gICAgVE9ETzogUkUtSU1QTEVNRU5UIG5vdCB1c2luZyBqUXVlcnkgbmVsc2UgRE9NIGVsZW1lbnRzLCBvciBhbG1vc3Qgbm90IGVsZW1lbnRzIGluc2lkZSBib2R5XHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxuZnVuY3Rpb24gZ2V0VGV4dCgpIHtcclxuICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgLy8gR2V0IGtleSBhbmQgdHJhbnNsYXRlIGl0XHJcbiAgICB2YXIgZm9ybWF0dGVkID0gYXJnc1swXTtcclxuICAgIHZhciB0ZXh0ID0gJCgnI2xjcmVzLScgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGZvcm1hdHRlZCkpLnRleHQoKTtcclxuICAgIGlmICh0ZXh0KVxyXG4gICAgICAgIGZvcm1hdHRlZCA9IHRleHQ7XHJcbiAgICAvLyBBcHBseSBmb3JtYXQgdG8gdGhlIHRleHQgd2l0aCBhZGRpdGlvbmFsIHBhcmFtZXRlcnNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCdcXFxceycgKyBpICsgJ1xcXFx9JywgJ2dpJyk7XHJcbiAgICAgICAgZm9ybWF0dGVkID0gZm9ybWF0dGVkLnJlcGxhY2UocmVnZXhwLCBhcmdzW2kgKyAxXSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZm9ybWF0dGVkO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFRleHQ7IiwiLyoqIFJldHVybnMgdGhlIHBhdGggdG8gdGhlIGdpdmVuIGVsZW1lbnQgaW4gWFBhdGggY29udmVudGlvblxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGdldFhQYXRoKGVsZW1lbnQpIHtcclxuICAgIGlmIChlbGVtZW50ICYmIGVsZW1lbnQuaWQpXHJcbiAgICAgICAgcmV0dXJuICcvLypbQGlkPVwiJyArIGVsZW1lbnQuaWQgKyAnXCJdJztcclxuICAgIHZhciB4cGF0aCA9ICcnO1xyXG4gICAgZm9yICg7IGVsZW1lbnQgJiYgZWxlbWVudC5ub2RlVHlwZSA9PSAxOyBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnROb2RlKSB7XHJcbiAgICAgICAgdmFyIGlkID0gJChlbGVtZW50LnBhcmVudE5vZGUpLmNoaWxkcmVuKGVsZW1lbnQudGFnTmFtZSkuaW5kZXgoZWxlbWVudCkgKyAxO1xyXG4gICAgICAgIGlkID0gKGlkID4gMSA/ICdbJyArIGlkICsgJ10nIDogJycpO1xyXG4gICAgICAgIHhwYXRoID0gJy8nICsgZWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgKyBpZCArIHhwYXRoO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHhwYXRoO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGdldFhQYXRoO1xyXG4iLCIvLyBJdCBleGVjdXRlcyB0aGUgZ2l2ZW4gJ3JlYWR5JyBmdW5jdGlvbiBhcyBwYXJhbWV0ZXIgd2hlblxyXG4vLyBtYXAgZW52aXJvbm1lbnQgaXMgcmVhZHkgKHdoZW4gZ29vZ2xlIG1hcHMgYXBpIGFuZCBzY3JpcHQgaXNcclxuLy8gbG9hZGVkIGFuZCByZWFkeSB0byB1c2UsIG9yIGlubWVkaWF0ZWx5IGlmIGlzIGFscmVhZHkgbG9hZGVkKS5cclxuXHJcbnZhciBsb2FkZXIgPSByZXF1aXJlKCcuL2xvYWRlcicpO1xyXG5cclxuLy8gUHJpdmF0ZSBzdGF0aWMgY29sbGVjdGlvbiBvZiBjYWxsYmFja3MgcmVnaXN0ZXJlZFxyXG52YXIgc3RhY2sgPSBbXTtcclxuXHJcbnZhciBnb29nbGVNYXBSZWFkeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ29vZ2xlTWFwUmVhZHkocmVhZHkpIHtcclxuICBzdGFjay5wdXNoKHJlYWR5KTtcclxuXHJcbiAgaWYgKGdvb2dsZU1hcFJlYWR5LmlzUmVhZHkpXHJcbiAgICByZWFkeSgpO1xyXG4gIGVsc2UgaWYgKCFnb29nbGVNYXBSZWFkeS5pc0xvYWRpbmcpIHtcclxuICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IHRydWU7XHJcbiAgICBsb2FkZXIubG9hZCh7XHJcbiAgICAgIHNjcmlwdHM6IFtcImh0dHBzOi8vd3d3Lmdvb2dsZS5jb20vanNhcGlcIl0sXHJcbiAgICAgIGNvbXBsZXRlVmVyaWZpY2F0aW9uOiBmdW5jdGlvbiAoKSB7IHJldHVybiAhIXdpbmRvdy5nb29nbGU7IH0sXHJcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZ29vZ2xlLmxvYWQoXCJtYXBzXCIsIFwiMy4xMFwiLCB7IG90aGVyX3BhcmFtczogXCJzZW5zb3I9ZmFsc2VcIiwgXCJjYWxsYmFja1wiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBnb29nbGVNYXBSZWFkeS5pc1JlYWR5ID0gdHJ1ZTtcclxuICAgICAgICAgIGdvb2dsZU1hcFJlYWR5LmlzTG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhY2subGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgc3RhY2tbaV0oKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBVdGlsaXR5IHRvIGZvcmNlIHRoZSByZWZyZXNoIG9mIG1hcHMgdGhhdCBzb2x2ZSB0aGUgcHJvYmxlbSB3aXRoIGJhZC1zaXplZCBtYXAgYXJlYVxyXG5nb29nbGVNYXBSZWFkeS5yZWZyZXNoTWFwID0gZnVuY3Rpb24gcmVmcmVzaE1hcHMobWFwKSB7XHJcbiAgZ29vZ2xlTWFwUmVhZHkoZnVuY3Rpb24gKCkge1xyXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlcihtYXAsIFwicmVzaXplXCIpO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiBHVUlEIEdlbmVyYXRvclxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBndWlkR2VuZXJhdG9yKCkge1xyXG4gICAgdmFyIFM0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAoKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKSB8IDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIChTNCgpICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFwiLVwiICsgUzQoKSArIFM0KCkgKyBTNCgpKTtcclxufTsiLCIvKipcclxuICAgIEdlbmVyaWMgc2NyaXB0IGZvciBmaWVsZHNldHMgd2l0aCBjbGFzcyAuaGFzLWNvbmZpcm0sIGFsbG93aW5nIHNob3dcclxuICAgIHRoZSBjb250ZW50IG9ubHkgaWYgdGhlIG1haW4gY29uZmlybSBmaWVsZHMgaGF2ZSAneWVzJyBzZWxlY3RlZC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG52YXIgZGVmYXVsdFNlbGVjdG9yID0gJ2ZpZWxkc2V0Lmhhcy1jb25maXJtID4gLmNvbmZpcm0gaW5wdXQnO1xyXG5cclxuZnVuY3Rpb24gb25jaGFuZ2UoKSB7XHJcbiAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgZnMgPSB0LmNsb3Nlc3QoJ2ZpZWxkc2V0Jyk7XHJcbiAgICBpZiAodC5pcygnOmNoZWNrZWQnKSlcclxuICAgICAgICBpZiAodC52YWwoKSA9PSAneWVzJyB8fCB0LnZhbCgpID09ICdUcnVlJylcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3MoJ2NvbmZpcm1lZC1ubycpLmFkZENsYXNzKCdjb25maXJtZWQteWVzJyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcygnY29uZmlybWVkLXllcycpLmFkZENsYXNzKCdjb25maXJtZWQtbm8nKTtcclxufVxyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xyXG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCBkZWZhdWx0U2VsZWN0b3I7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIHNlbGVjdG9yLCBvbmNoYW5nZSk7XHJcbiAgICAvLyBQZXJmb3JtcyBmaXJzdCBjaGVjazpcclxuICAgICQoc2VsZWN0b3IpLmNoYW5nZSgpO1xyXG59O1xyXG5cclxuZXhwb3J0cy5vZmYgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcclxuICAgIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgZGVmYXVsdFNlbGVjdG9yO1xyXG5cclxuICAgICQoZG9jdW1lbnQpLm9mZignY2hhbmdlJywgc2VsZWN0b3IpO1xyXG59OyIsIi8qIEludGVybmF6aW9uYWxpemF0aW9uIFV0aWxpdGllc1xyXG4gKi9cclxudmFyIGkxOG4gPSB7fTtcclxuaTE4bi5kaXN0YW5jZVVuaXRzID0ge1xyXG4gICAgJ0VTJzogJ2ttJyxcclxuICAgICdVUyc6ICdtaWxlcydcclxufTtcclxuaTE4bi5udW1lcmljTWlsZXNTZXBhcmF0b3IgPSB7XHJcbiAgICAnZXMtRVMnOiAnLicsXHJcbiAgICAnZXMtVVMnOiAnLicsXHJcbiAgICAnZW4tVVMnOiAnLCcsXHJcbiAgICAnZW4tRVMnOiAnLCdcclxufTtcclxuaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvciA9IHtcclxuICAgICdlcy1FUyc6ICcsJyxcclxuICAgICdlcy1VUyc6ICcsJyxcclxuICAgICdlbi1VUyc6ICcuJyxcclxuICAgICdlbi1FUyc6ICcuJ1xyXG59O1xyXG5pMThuLm1vbmV5U3ltYm9sUHJlZml4ID0ge1xyXG4gICAgJ0VTJzogJycsXHJcbiAgICAnVVMnOiAnJCdcclxufTtcclxuaTE4bi5tb25leVN5bWJvbFN1Zml4ID0ge1xyXG4gICAgJ0VTJzogJ+KCrCcsXHJcbiAgICAnVVMnOiAnJ1xyXG59O1xyXG5pMThuLmdldEN1cnJlbnRDdWx0dXJlID0gZnVuY3Rpb24gZ2V0Q3VycmVudEN1bHR1cmUoKSB7XHJcbiAgICB2YXIgYyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpO1xyXG4gICAgdmFyIHMgPSBjLnNwbGl0KCctJyk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGN1bHR1cmU6IGMsXHJcbiAgICAgICAgbGFuZ3VhZ2U6IHNbMF0sXHJcbiAgICAgICAgY291bnRyeTogc1sxXVxyXG4gICAgfTtcclxufTtcclxuaTE4bi5jb252ZXJ0TWlsZXNLbSA9IGZ1bmN0aW9uIGNvbnZlcnRNaWxlc0ttKHEsIHVuaXQpIHtcclxuICAgIHZhciBNSUxFU19UT19LTSA9IDEuNjA5O1xyXG4gICAgaWYgKHVuaXQgPT0gJ21pbGVzJylcclxuICAgICAgICByZXR1cm4gTUlMRVNfVE9fS00gKiBxO1xyXG4gICAgZWxzZSBpZiAodW5pdCA9PSAna20nKVxyXG4gICAgICAgIHJldHVybiBxIC8gTUlMRVNfVE9fS007XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykgY29uc29sZS5sb2coJ2NvbnZlcnRNaWxlc0ttOiBVbnJlY29nbml6ZWQgdW5pdCAnICsgdW5pdCk7XHJcbiAgICByZXR1cm4gMDtcclxufTtcclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gaTE4bjsiLCIvKiBSZXR1cm5zIHRydWUgd2hlbiBzdHIgaXNcclxuLSBudWxsXHJcbi0gZW1wdHkgc3RyaW5nXHJcbi0gb25seSB3aGl0ZSBzcGFjZXMgc3RyaW5nXHJcbiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNFbXB0eVN0cmluZyhzdHIpIHtcclxuICAgIHJldHVybiAhKC9cXFMvZy50ZXN0KHN0ciB8fCBcIlwiKSk7XHJcbn07IiwiLyoqIEFzIHRoZSAnaXMnIGpRdWVyeSBtZXRob2QsIGJ1dCBjaGVja2luZyBAc2VsZWN0b3IgaW4gYWxsIGVsZW1lbnRzXHJcbiogQG1vZGlmaWVyIHZhbHVlczpcclxuKiAtICdhbGwnOiBhbGwgZWxlbWVudHMgbXVzdCBtYXRjaCBzZWxlY3RvciB0byByZXR1cm4gdHJ1ZVxyXG4qIC0gJ2FsbW9zdC1vbmUnOiBhbG1vc3Qgb25lIGVsZW1lbnQgbXVzdCBtYXRjaFxyXG4qIC0gJ3BlcmNlbnRhZ2UnOiByZXR1cm5zIHBlcmNlbnRhZ2UgbnVtYmVyIG9mIGVsZW1lbnRzIHRoYXQgbWF0Y2ggc2VsZWN0b3IgKDAtMTAwKVxyXG4qIC0gJ3N1bW1hcnknOiByZXR1cm5zIHRoZSBvYmplY3QgeyB5ZXM6IG51bWJlciwgbm86IG51bWJlciwgcGVyY2VudGFnZTogbnVtYmVyLCB0b3RhbDogbnVtYmVyIH1cclxuKiAtIHtqdXN0OiBhIG51bWJlcn06IGV4YWN0IG51bWJlciBvZiBlbGVtZW50cyB0aGF0IG11c3QgbWF0Y2ggdG8gcmV0dXJuIHRydWVcclxuKiAtIHthbG1vc3Q6IGEgbnVtYmVyfTogbWluaW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbiogLSB7dW50aWw6IGEgbnVtYmVyfTogbWF4aW11bSBudW1iZXIgb2YgZWxlbWVudHMgdGhhdCBtdXN0IG1hdGNoIHRvIHJldHVybiB0cnVlXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5hcmUgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIG1vZGlmaWVyKSB7XHJcbiAgICBtb2RpZmllciA9IG1vZGlmaWVyIHx8ICdhbGwnO1xyXG4gICAgdmFyIGNvdW50ID0gMDtcclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCQodGhpcykuaXMoc2VsZWN0b3IpKVxyXG4gICAgICAgICAgICBjb3VudCsrO1xyXG4gICAgfSk7XHJcbiAgICBzd2l0Y2ggKG1vZGlmaWVyKSB7XHJcbiAgICAgICAgY2FzZSAnYWxsJzpcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID09IGNvdW50O1xyXG4gICAgICAgIGNhc2UgJ2FsbW9zdC1vbmUnOlxyXG4gICAgICAgICAgICByZXR1cm4gY291bnQgPiAwO1xyXG4gICAgICAgIGNhc2UgJ3BlcmNlbnRhZ2UnOlxyXG4gICAgICAgICAgICByZXR1cm4gY291bnQgLyB0aGlzLmxlbmd0aDtcclxuICAgICAgICBjYXNlICdzdW1tYXJ5JzpcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHllczogY291bnQsXHJcbiAgICAgICAgICAgICAgICBubzogdGhpcy5sZW5ndGggLSBjb3VudCxcclxuICAgICAgICAgICAgICAgIHBlcmNlbnRhZ2U6IGNvdW50IC8gdGhpcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICB0b3RhbDogdGhpcy5sZW5ndGhcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZiAoJ2p1c3QnIGluIG1vZGlmaWVyICYmXHJcbiAgICAgICAgICAgICAgICBtb2RpZmllci5qdXN0ICE9IGNvdW50KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmICgnYWxtb3N0JyBpbiBtb2RpZmllciAmJlxyXG4gICAgICAgICAgICAgICAgbW9kaWZpZXIuYWxtb3N0ID4gY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCd1bnRpbCcgaW4gbW9kaWZpZXIgJiZcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVyLnVudGlsIDwgY291bnQpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgIH1cclxufTsiLCIvKipcclxuKiBIYXNTY3JvbGxCYXIgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBib29sIHByb3BlcnRpZXMgJ3ZlcnRpY2FsJyBhbmQgJ2hvcml6b250YWwnXHJcbiogc2F5aW5nIGlmIHRoZSBlbGVtZW50IGhhcyBuZWVkIG9mIHNjcm9sbGJhcnMgZm9yIGVhY2ggZGltZW5zaW9uIG9yIG5vdCAoZWxlbWVudFxyXG4qIGNhbiBuZWVkIHNjcm9sbGJhcnMgYW5kIHN0aWxsIG5vdCBiZWluZyBzaG93ZWQgYmVjYXVzZSB0aGUgY3NzLW92ZXJsZmxvdyBwcm9wZXJ0eVxyXG4qIGJlaW5nIHNldCBhcyAnaGlkZGVuJywgYnV0IHN0aWxsIHdlIGtub3cgdGhhdCB0aGUgZWxlbWVudCByZXF1aXJlcyBpdCBhbmQgaXRzXHJcbiogY29udGVudCBpcyBub3QgYmVpbmcgZnVsbHkgZGlzcGxheWVkKS5cclxuKiBAZXh0cmFnYXAsIGRlZmF1bHRzIHRvIHt4OjAseTowfSwgbGV0cyBzcGVjaWZ5IGFuIGV4dHJhIHNpemUgaW4gcGl4ZWxzIGZvciBlYWNoIGRpbWVuc2lvbiB0aGF0IGFsdGVyIHRoZSByZWFsIGNoZWNrLFxyXG4qIHJlc3VsdGluZyBpbiBhIGZha2UgcmVzdWx0IHRoYXQgY2FuIGJlIGludGVyZXN0aW5nIHRvIGRpc2NhcmQgc29tZSBwaXhlbHMgb2YgZXhjZXNzXHJcbiogc2l6ZSAobmVnYXRpdmUgdmFsdWVzKSBvciBleGFnZXJhdGUgdGhlIHJlYWwgdXNlZCBzaXplIHdpdGggdGhhdCBleHRyYSBwaXhlbHMgKHBvc2l0aXZlIHZhbHVlcykuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5oYXNTY3JvbGxCYXIgPSBmdW5jdGlvbiAoZXh0cmFnYXApIHtcclxuICAgIGV4dHJhZ2FwID0gJC5leHRlbmQoe1xyXG4gICAgICAgIHg6IDAsXHJcbiAgICAgICAgeTogMFxyXG4gICAgfSwgZXh0cmFnYXApO1xyXG4gICAgaWYgKCF0aGlzIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4geyB2ZXJ0aWNhbDogZmFsc2UsIGhvcml6b250YWw6IGZhbHNlIH07XHJcbiAgICAvL25vdGU6IGNsaWVudEhlaWdodD0gaGVpZ2h0IG9mIGhvbGRlclxyXG4gICAgLy9zY3JvbGxIZWlnaHQ9IHdlIGhhdmUgY29udGVudCB0aWxsIHRoaXMgaGVpZ2h0XHJcbiAgICB2YXIgdCA9IHRoaXMuZ2V0KDApO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB2ZXJ0aWNhbDogdGhpcy5vdXRlckhlaWdodChmYWxzZSkgPCAodC5zY3JvbGxIZWlnaHQgKyBleHRyYWdhcC55KSxcclxuICAgICAgICBob3Jpem9udGFsOiB0aGlzLm91dGVyV2lkdGgoZmFsc2UpIDwgKHQuc2Nyb2xsV2lkdGggKyBleHRyYWdhcC54KVxyXG4gICAgfTtcclxufTsiLCIvKiogQ2hlY2tzIGlmIGN1cnJlbnQgZWxlbWVudCBvciBvbmUgb2YgdGhlIGN1cnJlbnQgc2V0IG9mIGVsZW1lbnRzIGhhc1xyXG5hIHBhcmVudCB0aGF0IG1hdGNoIHRoZSBlbGVtZW50IG9yIGV4cHJlc3Npb24gZ2l2ZW4gYXMgZmlyc3QgcGFyYW1ldGVyXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxuJC5mbi5pc0NoaWxkT2YgPSBmdW5jdGlvbiBqUXVlcnlfcGx1Z2luX2lzQ2hpbGRPZihleHApIHtcclxuICAgIHJldHVybiB0aGlzLnBhcmVudHMoKS5maWx0ZXIoZXhwKS5sZW5ndGggPiAwO1xyXG59OyIsIi8qKlxyXG4gICAgR2V0cyB0aGUgaHRtbCBzdHJpbmcgb2YgdGhlIGZpcnN0IGVsZW1lbnQgYW5kIGFsbCBpdHMgY29udGVudC5cclxuICAgIFRoZSAnaHRtbCcgbWV0aG9kIG9ubHkgcmV0cmlldmVzIHRoZSBodG1sIHN0cmluZyBvZiB0aGUgY29udGVudCwgbm90IHRoZSBlbGVtZW50IGl0c2VsZi5cclxuKiovXHJcbnZhciAkID0galF1ZXJ5IHx8IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4kLmZuLm91dGVySHRtbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICghdGhpcyB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnO1xyXG4gICAgdmFyIGVsID0gdGhpcy5nZXQoMCk7XHJcbiAgICB2YXIgaHRtbCA9ICcnO1xyXG4gICAgaWYgKGVsLm91dGVySFRNTClcclxuICAgICAgICBodG1sID0gZWwub3V0ZXJIVE1MO1xyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgaHRtbCA9IHRoaXMud3JhcEFsbCgnPGRpdj48L2Rpdj4nKS5wYXJlbnQoKS5odG1sKCk7XHJcbiAgICAgICAgdGhpcy51bndyYXAoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBodG1sO1xyXG59OyIsIi8qKlxyXG4gICAgVXNpbmcgdGhlIGF0dHJpYnV0ZSBkYXRhLXNvdXJjZS11cmwgb24gYW55IEhUTUwgZWxlbWVudCxcclxuICAgIHRoaXMgYWxsb3dzIHJlbG9hZCBpdHMgY29udGVudCBwZXJmb3JtaW5nIGFuIEFKQVggb3BlcmF0aW9uXHJcbiAgICBvbiB0aGUgZ2l2ZW4gVVJMIG9yIHRoZSBvbmUgaW4gdGhlIGF0dHJpYnV0ZTsgdGhlIGVuZC1wb2ludFxyXG4gICAgbXVzdCByZXR1cm4gdGV4dC9odG1sIGNvbnRlbnQuXHJcbioqL1xyXG52YXIgJCA9IGpRdWVyeSB8fCByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxuLy8gRGVmYXVsdCBzdWNjZXNzIGNhbGxiYWNrIGFuZCBwdWJsaWMgdXRpbGl0eSwgYmFzaWMgaG93LXRvIHJlcGxhY2UgZWxlbWVudCBjb250ZW50IHdpdGggZmV0Y2hlZCBodG1sXHJcbmZ1bmN0aW9uIHVwZGF0ZUVsZW1lbnQoaHRtbENvbnRlbnQsIGNvbnRleHQpIHtcclxuICAgIGNvbnRleHQgPSAkLmlzUGxhaW5PYmplY3QoY29udGV4dCkgJiYgY29udGV4dCA/IGNvbnRleHQgOiB0aGlzO1xyXG5cclxuICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgIHZhciBuZXdodG1sID0gbmV3IGpRdWVyeSgpO1xyXG4gICAgLy8gVHJ5LWNhdGNoIHRvIGF2b2lkIGVycm9ycyB3aGVuIGFuIGVtcHR5IGRvY3VtZW50IG9yIG1hbGZvcm1lZCBpcyByZXR1cm5lZDpcclxuICAgIHRyeSB7XHJcbiAgICAgICAgLy8gcGFyc2VIVE1MIHNpbmNlIGpxdWVyeS0xLjggaXMgbW9yZSBzZWN1cmU6XHJcbiAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICBuZXdodG1sID0gJCgkLnBhcnNlSFRNTChodG1sQ29udGVudCkpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgbmV3aHRtbCA9ICQoaHRtbENvbnRlbnQpO1xyXG4gICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKVxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGV4KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGVsZW1lbnQgPSBjb250ZXh0LmVsZW1lbnQ7XHJcbiAgICBpZiAoY29udGV4dC5vcHRpb25zLm1vZGUgPT0gJ3JlcGxhY2UtbWUnKVxyXG4gICAgICAgIGVsZW1lbnQucmVwbGFjZVdpdGgobmV3aHRtbCk7XHJcbiAgICBlbHNlIC8vICdyZXBsYWNlLWNvbnRlbnQnXHJcbiAgICAgICAgZWxlbWVudC5odG1sKG5ld2h0bWwpO1xyXG5cclxuICAgIHJldHVybiBjb250ZXh0O1xyXG59XHJcblxyXG4vLyBEZWZhdWx0IGNvbXBsZXRlIGNhbGxiYWNrIGFuZCBwdWJsaWMgdXRpbGl0eVxyXG5mdW5jdGlvbiBzdG9wTG9hZGluZ1NwaW5uZXIoKSB7XHJcbiAgICBjbGVhclRpbWVvdXQodGhpcy5sb2FkaW5nVGltZXIpO1xyXG4gICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5lbGVtZW50KTtcclxufVxyXG5cclxuLy8gRGVmYXVsdHNcclxudmFyIGRlZmF1bHRzID0ge1xyXG4gICAgdXJsOiBudWxsLFxyXG4gICAgc3VjY2VzczogW3VwZGF0ZUVsZW1lbnRdLFxyXG4gICAgZXJyb3I6IFtdLFxyXG4gICAgY29tcGxldGU6IFtzdG9wTG9hZGluZ1NwaW5uZXJdLFxyXG4gICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgbW9kZTogJ3JlcGxhY2UtY29udGVudCcsXHJcbiAgICBsb2FkaW5nOiB7XHJcbiAgICAgICAgbG9ja0VsZW1lbnQ6IHRydWUsXHJcbiAgICAgICAgbG9ja09wdGlvbnM6IHt9LFxyXG4gICAgICAgIG1lc3NhZ2U6IG51bGwsXHJcbiAgICAgICAgc2hvd0xvYWRpbmdJbmRpY2F0b3I6IHRydWUsXHJcbiAgICAgICAgZGVsYXk6IDBcclxuICAgIH1cclxufTtcclxuXHJcbi8qIFJlbG9hZCBtZXRob2QgKi9cclxudmFyIHJlbG9hZCA9ICQuZm4ucmVsb2FkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gT3B0aW9ucyBmcm9tIGRlZmF1bHRzIChpbnRlcm5hbCBhbmQgcHVibGljKVxyXG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIHJlbG9hZC5kZWZhdWx0cyk7XHJcbiAgICAvLyBJZiBvcHRpb25zIG9iamVjdCBpcyBwYXNzZWQgYXMgdW5pcXVlIHBhcmFtZXRlclxyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSAmJiAkLmlzUGxhaW5PYmplY3QoYXJndW1lbnRzWzBdKSkge1xyXG4gICAgICAgIC8vIE1lcmdlIG9wdGlvbnM6XHJcbiAgICAgICAgJC5leHRlbmQodHJ1ZSwgb3B0aW9ucywgYXJndW1lbnRzWzBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ29tbW9uIG92ZXJsb2FkOiBuZXctdXJsIGFuZCBjb21wbGV0ZSBjYWxsYmFjaywgYm90aCBvcHRpb25hbHNcclxuICAgICAgICBvcHRpb25zLnVybCA9IGFyZ3VtZW50cy5sZW5ndGggPiAwID8gYXJndW1lbnRzWzBdIDogbnVsbDtcclxuICAgICAgICBvcHRpb25zLmNvbXBsZXRlID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgaWYgKG9wdGlvbnMudXJsKSB7XHJcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3B0aW9ucy51cmwpKVxyXG4gICAgICAgICAgICAvLyBGdW5jdGlvbiBwYXJhbXM6IGN1cnJlbnRSZWxvYWRVcmwsIGRlZmF1bHRSZWxvYWRVcmxcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ3NvdXJjZS11cmwnLCAkLnByb3h5KG9wdGlvbnMudXJsLCB0aGlzKSgkdC5kYXRhKCdzb3VyY2UtdXJsJyksICR0LmF0dHIoJ2RhdGEtc291cmNlLXVybCcpKSk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ3NvdXJjZS11cmwnLCBvcHRpb25zLnVybCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB1cmwgPSAkdC5kYXRhKCdzb3VyY2UtdXJsJyk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIHRoZXJlIGlzIGFscmVhZHkgYmVpbmcgcmVsb2FkZWQsIHRvIGNhbmNlbCBwcmV2aW91cyBhdHRlbXB0XHJcbiAgICAgICAgdmFyIGpxID0gJHQuZGF0YSgnaXNSZWxvYWRpbmcnKTtcclxuICAgICAgICBpZiAoanEpIHtcclxuICAgICAgICAgICAgaWYgKGpxLnVybCA9PSB1cmwpXHJcbiAgICAgICAgICAgICAgICAvLyBJcyB0aGUgc2FtZSB1cmwsIGRvIG5vdCBhYm9ydCBiZWNhdXNlIGlzIHRoZSBzYW1lIHJlc3VsdCBiZWluZyByZXRyaWV2ZWRcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAganEuYWJvcnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9wdGlvbmFsIGRhdGEgcGFyYW1ldGVyICdyZWxvYWQtbW9kZScgYWNjZXB0cyB2YWx1ZXM6IFxyXG4gICAgICAgIC8vIC0gJ3JlcGxhY2UtbWUnOiBVc2UgaHRtbCByZXR1cm5lZCB0byByZXBsYWNlIGN1cnJlbnQgcmVsb2FkZWQgZWxlbWVudCAoYWthOiByZXBsYWNlV2l0aCgpKVxyXG4gICAgICAgIC8vIC0gJ3JlcGxhY2UtY29udGVudCc6IChkZWZhdWx0KSBIdG1sIHJldHVybmVkIHJlcGxhY2UgY3VycmVudCBlbGVtZW50IGNvbnRlbnQgKGFrYTogaHRtbCgpKVxyXG4gICAgICAgIG9wdGlvbnMubW9kZSA9ICR0LmRhdGEoJ3JlbG9hZC1tb2RlJykgfHwgb3B0aW9ucy5tb2RlO1xyXG5cclxuICAgICAgICBpZiAodXJsKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBMb2FkaW5nLCB3aXRoIGRlbGF5XHJcbiAgICAgICAgICAgIHZhciBsb2FkaW5ndGltZXIgPSBvcHRpb25zLmxvYWRpbmcubG9ja0VsZW1lbnQgP1xyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRpbmcgY29udGVudCB1c2luZyBhIGZha2UgdGVtcCBwYXJlbnQgZWxlbWVudCB0byBwcmVsb2FkIGltYWdlIGFuZCB0byBnZXQgcmVhbCBtZXNzYWdlIHdpZHRoOlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb2FkaW5nY29udGVudCA9ICQoJzxkaXYvPicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA/ICQoJzxkaXYgY2xhc3M9XCJsb2FkaW5nLW1lc3NhZ2VcIi8+JykuYXBwZW5kKG9wdGlvbnMubG9hZGluZy5tZXNzYWdlKSA6IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZChvcHRpb25zLmxvYWRpbmcuc2hvd0xvYWRpbmdJbmRpY2F0b3IgPyBvcHRpb25zLmxvYWRpbmcubWVzc2FnZSA6IG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxvYWRpbmdjb250ZW50LmNzcyh7IHBvc2l0aW9uOiAnYWJzb2x1dGUnLCBsZWZ0OiAtOTk5OTkgfSkuYXBwZW5kVG8oJ2JvZHknKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdyA9IGxvYWRpbmdjb250ZW50LndpZHRoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbG9hZGluZ2NvbnRlbnQuZGV0YWNoKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gTG9ja2luZzpcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmxvYWRpbmcubG9ja09wdGlvbnMuYXV0b2ZvY3VzID0gb3B0aW9ucy5hdXRvZm9jdXM7XHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zLndpZHRoID0gdztcclxuICAgICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGxvYWRpbmdjb250ZW50Lmh0bWwoKSwgJHQsIG9wdGlvbnMubG9hZGluZy5tZXNzYWdlID8gJ2N1c3RvbS1sb2FkaW5nJyA6ICdsb2FkaW5nJywgb3B0aW9ucy5sb2FkaW5nLmxvY2tPcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMubG9hZGluZy5kZWxheSlcclxuICAgICAgICAgICAgICAgIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIC8vIFByZXBhcmUgY29udGV4dFxyXG4gICAgICAgICAgICB2YXIgY3R4ID0ge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudDogJHQsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgbG9hZGluZ1RpbWVyOiBsb2FkaW5ndGltZXJcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIERvIHRoZSBBamF4IHBvc3RcclxuICAgICAgICAgICAganEgPSAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnR0VUJyxcclxuICAgICAgICAgICAgICAgIGNvbnRleHQ6IGN0eFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIFVybCBpcyBzZXQgaW4gdGhlIHJldHVybmVkIGFqYXggb2JqZWN0IGJlY2F1c2UgaXMgbm90IHNldCBieSBhbGwgdmVyc2lvbnMgb2YgalF1ZXJ5XHJcbiAgICAgICAgICAgIGpxLnVybCA9IHVybDtcclxuXHJcbiAgICAgICAgICAgIC8vIE1hcmsgZWxlbWVudCBhcyBpcyBiZWluZyByZWxvYWRlZCwgdG8gYXZvaWQgbXVsdGlwbGUgYXR0ZW1wcyBhdCBzYW1lIHRpbWUsIHNhdmluZ1xyXG4gICAgICAgICAgICAvLyBjdXJyZW50IGFqYXggb2JqZWN0IHRvIGFsbG93IGJlIGNhbmNlbGxlZFxyXG4gICAgICAgICAgICAkdC5kYXRhKCdpc1JlbG9hZGluZycsIGpxKTtcclxuICAgICAgICAgICAganEuYWx3YXlzKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICR0LmRhdGEoJ2lzUmVsb2FkaW5nJywgbnVsbCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gQ2FsbGJhY2tzOiBmaXJzdCBnbG9iYWxzIGFuZCB0aGVuIGZyb20gb3B0aW9ucyBpZiB0aGV5IGFyZSBkaWZmZXJlbnRcclxuICAgICAgICAgICAgLy8gc3VjY2Vzc1xyXG4gICAgICAgICAgICBqcS5kb25lKHJlbG9hZC5kZWZhdWx0cy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3VjY2VzcyAhPSByZWxvYWQuZGVmYXVsdHMuc3VjY2VzcylcclxuICAgICAgICAgICAgICAgIGpxLmRvbmUob3B0aW9ucy5zdWNjZXNzKTtcclxuICAgICAgICAgICAgLy8gZXJyb3JcclxuICAgICAgICAgICAganEuZmFpbChyZWxvYWQuZGVmYXVsdHMuZXJyb3IpO1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5lcnJvciAhPSByZWxvYWQuZGVmYXVsdHMuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICBqcS5mYWlsKG9wdGlvbnMuZXJyb3IpO1xyXG4gICAgICAgICAgICAvLyBjb21wbGV0ZVxyXG4gICAgICAgICAgICBqcS5hbHdheXMocmVsb2FkLmRlZmF1bHRzLmNvbXBsZXRlKTtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY29tcGxldGUgIT0gcmVsb2FkLmRlZmF1bHRzLmNvbXBsZXRlKVxyXG4gICAgICAgICAgICAgICAganEuZG9uZShvcHRpb25zLmNvbXBsZXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLy8gUHVibGljIGRlZmF1bHRzXHJcbnJlbG9hZC5kZWZhdWx0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cyk7XHJcblxyXG4vLyBQdWJsaWMgdXRpbGl0aWVzXHJcbnJlbG9hZC51cGRhdGVFbGVtZW50ID0gdXBkYXRlRWxlbWVudDtcclxucmVsb2FkLnN0b3BMb2FkaW5nU3Bpbm5lciA9IHN0b3BMb2FkaW5nU3Bpbm5lcjtcclxuXHJcbi8vIE1vZHVsZVxyXG5tb2R1bGUuZXhwb3J0cyA9IHJlbG9hZDsiLCIvKiogRXh0ZW5kZWQgdG9nZ2xlLXNob3ctaGlkZSBmdW50aW9ucy5cclxuICAgIElhZ29TUkxAZ21haWwuY29tXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gKiovXHJcbihmdW5jdGlvbigpe1xyXG5cclxuICAgIC8qKiBJbXBsZW1lbnRhdGlvbjogcmVxdWlyZSBqUXVlcnkgYW5kIHJldHVybnMgb2JqZWN0IHdpdGggdGhlXHJcbiAgICAgICAgcHVibGljIG1ldGhvZHMuXHJcbiAgICAgKiovXHJcbiAgICBmdW5jdGlvbiB4dHNoKGpRdWVyeSkge1xyXG4gICAgICAgIHZhciAkID0galF1ZXJ5O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBIaWRlIGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdoaWRlJyBhbmQgJ2ZhZGVPdXQnIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmZhZGVPdXQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLnNsaWRlVXAob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdoaWRlJ1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmhpZGUob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneGhpZGUnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgKiBTaG93IGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdzaG93JyBhbmQgJ2ZhZGVJbicgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgLy8gV2UgcGVyZm9ybXMgYSBmaXggb24gc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHNcclxuICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gZXJyb3IgdGhhdCBwcmV2ZW50cyBmcm9tIHJ1bm5pbmdcclxuICAgICAgICAgICAgLy8gZWZmZWN0cyBvbiBlbGVtZW50cyB0aGF0IGFyZSBhbHJlYWR5IHZpc2libGUsXHJcbiAgICAgICAgICAgIC8vIHdoYXQgbGV0cyB0aGUgcG9zc2liaWxpdHkgb2YgZ2V0IGEgbWlkZGxlLWFuaW1hdGVkXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gV2UganVzdCBjaGFuZ2UgZGlzcGxheTpub25lLCBmb3JjaW5nIHRvICdpcy12aXNpYmxlJyB0b1xyXG4gICAgICAgICAgICAvLyBiZSBmYWxzZSBhbmQgdGhlbiBydW5uaW5nIHRoZSBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGZsaWNrZXJpbmcgZWZmZWN0LCBiZWNhdXNlIGpRdWVyeSBqdXN0IHJlc2V0c1xyXG4gICAgICAgICAgICAvLyBkaXNwbGF5IG9uIGVmZmVjdCBzdGFydC5cclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mYWRlSW4ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2xpZGVEb3duKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnc2hvdydcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNob3cob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneHNob3cnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdlbmVyaWMgdXRpbGl0eSBmb3IgaGlnaGx5IGNvbmZpZ3VyYWJsZSBqUXVlcnkudG9nZ2xlIHdpdGggc3VwcG9ydFxyXG4gICAgICAgICAgICB0byBzcGVjaWZ5IHRoZSB0b2dnbGUgdmFsdWUgZXhwbGljaXR5IGZvciBhbnkga2luZCBvZiBlZmZlY3Q6IGp1c3QgcGFzcyB0cnVlIGFzIHNlY29uZCBwYXJhbWV0ZXIgJ3RvZ2dsZScgdG8gc2hvd1xyXG4gICAgICAgICAgICBhbmQgZmFsc2UgdG8gaGlkZS4gVG9nZ2xlIG11c3QgYmUgc3RyaWN0bHkgYSBCb29sZWFuIHZhbHVlIHRvIGF2b2lkIGF1dG8tZGV0ZWN0aW9uLlxyXG4gICAgICAgICAgICBUb2dnbGUgcGFyYW1ldGVyIGNhbiBiZSBvbWl0dGVkIHRvIGF1dG8tZGV0ZWN0IGl0LCBhbmQgc2Vjb25kIHBhcmFtZXRlciBjYW4gYmUgdGhlIGFuaW1hdGlvbiBvcHRpb25zLlxyXG4gICAgICAgICAgICBBbGwgdGhlIG90aGVycyBiZWhhdmUgZXhhY3RseSBhcyBoaWRlRWxlbWVudCBhbmQgc2hvd0VsZW1lbnQuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlRWxlbWVudChlbGVtZW50LCB0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIG5vdCBhIGJvb2xlYW5cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSAhPT0gdHJ1ZSAmJiB0b2dnbGUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgYW4gb2JqZWN0LCB0aGVuIGlzIHRoZSBvcHRpb25zIGFzIHNlY29uZCBwYXJhbWV0ZXJcclxuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QodG9nZ2xlKSlcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gdG9nZ2xlO1xyXG4gICAgICAgICAgICAgICAgLy8gQXV0by1kZXRlY3QgdG9nZ2xlLCBpdCBjYW4gdmFyeSBvbiBhbnkgZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIC8vIHRoZW4gZGV0ZWN0aW9uIGFuZCBhY3Rpb24gbXVzdCBiZSBkb25lIHBlciBlbGVtZW50OlxyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXVzaW5nIGZ1bmN0aW9uLCB3aXRoIGV4cGxpY2l0IHRvZ2dsZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgISQodGhpcykuaXMoJzp2aXNpYmxlJyksIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSlcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqIERvIGpRdWVyeSBpbnRlZ3JhdGlvbiBhcyB4dG9nZ2xlLCB4c2hvdywgeGhpZGVcclxuICAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gcGx1Z0luKGpRdWVyeSkge1xyXG4gICAgICAgICAgICAvKiogdG9nZ2xlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHh0b2dnbGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHRvZ2dsZSA9IGZ1bmN0aW9uIHh0b2dnbGUodG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsIHRvZ2dsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBzaG93RWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHNob3cgPSBmdW5jdGlvbiB4c2hvdyhvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIGhpZGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueGhpZGUgPSBmdW5jdGlvbiB4aGlkZShvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb3J0aW5nOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQ6IHRvZ2dsZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHNob3dFbGVtZW50OiBzaG93RWxlbWVudCxcclxuICAgICAgICAgICAgaGlkZUVsZW1lbnQ6IGhpZGVFbGVtZW50LFxyXG4gICAgICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9kdWxlXHJcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgeHRzaCk7XHJcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgICAgICB2YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB4dHNoKGpRdWVyeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIE5vcm1hbCBzY3JpcHQgbG9hZCwgaWYgalF1ZXJ5IGlzIGdsb2JhbCAoYXQgd2luZG93KSwgaXRzIGV4dGVuZGVkIGF1dG9tYXRpY2FsbHkgICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHh0c2god2luZG93LmpRdWVyeSkucGx1Z0luKHdpbmRvdy5qUXVlcnkpO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvKiBTb21lIHV0aWxpdGllcyBmb3IgdXNlIHdpdGggalF1ZXJ5IG9yIGl0cyBleHByZXNzaW9uc1xyXG4gICAgdGhhdCBhcmUgbm90IHBsdWdpbnMuXHJcbiovXHJcbmZ1bmN0aW9uIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbICM7JiwuKyp+XFwnOlwiIV4kW1xcXSgpPT58XFwvXSkvZywgJ1xcXFwkMScpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlOiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlXHJcbiAgICB9O1xyXG4iLCIvKiBBc3NldHMgbG9hZGVyIHdpdGggbG9hZGluZyBjb25maXJtYXRpb24gKG1haW5seSBmb3Igc2NyaXB0cylcclxuICAgIGJhc2VkIG9uIE1vZGVybml6ci95ZXBub3BlIGxvYWRlci5cclxuKi9cclxudmFyIE1vZGVybml6ciA9IHJlcXVpcmUoJ21vZGVybml6cicpO1xyXG5cclxuZXhwb3J0cy5sb2FkID0gZnVuY3Rpb24gKG9wdHMpIHtcclxuICAgIG9wdHMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgc2NyaXB0czogW10sXHJcbiAgICAgICAgY29tcGxldGU6IG51bGwsXHJcbiAgICAgICAgY29tcGxldGVWZXJpZmljYXRpb246IG51bGwsXHJcbiAgICAgICAgbG9hZERlbGF5OiAwLFxyXG4gICAgICAgIHRyaWFsc0ludGVydmFsOiA1MDBcclxuICAgIH0sIG9wdHMpO1xyXG4gICAgaWYgKCFvcHRzLnNjcmlwdHMubGVuZ3RoKSByZXR1cm47XHJcbiAgICBmdW5jdGlvbiBwZXJmb3JtQ29tcGxldGUoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAob3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbikgIT09ICdmdW5jdGlvbicgfHwgb3B0cy5jb21wbGV0ZVZlcmlmaWNhdGlvbigpKVxyXG4gICAgICAgICAgICBvcHRzLmNvbXBsZXRlKCk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQocGVyZm9ybUNvbXBsZXRlLCBvcHRzLnRyaWFsc0ludGVydmFsKTtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS53YXJuKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdMQy5sb2FkLmNvbXBsZXRlVmVyaWZpY2F0aW9uIGZhaWxlZCBmb3IgJyArIG9wdHMuc2NyaXB0c1swXSArICcgcmV0cnlpbmcgaXQgaW4gJyArIG9wdHMudHJpYWxzSW50ZXJ2YWwgKyAnbXMnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBsb2FkKCkge1xyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKHtcclxuICAgICAgICAgICAgbG9hZDogb3B0cy5zY3JpcHRzLFxyXG4gICAgICAgICAgICBjb21wbGV0ZTogb3B0cy5jb21wbGV0ZSA/IHBlcmZvcm1Db21wbGV0ZSA6IG51bGxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChvcHRzLmxvYWREZWxheSlcclxuICAgICAgICBzZXRUaW1lb3V0KGxvYWQsIG9wdHMubG9hZERlbGF5KTtcclxuICAgIGVsc2VcclxuICAgICAgICBsb2FkKCk7XHJcbn07IiwiLyotLS0tLS0tLS0tLS1cclxuVXRpbGl0aWVzIHRvIG1hbmlwdWxhdGUgbnVtYmVycywgYWRkaXRpb25hbGx5XHJcbnRvIHRoZSBvbmVzIGF0IE1hdGhcclxuLS0tLS0tLS0tLS0tKi9cclxuXHJcbi8qKiBFbnVtZXJhdGlvbiB0byBiZSB1c2VzIGJ5IGZ1bmN0aW9ucyB0aGF0IGltcGxlbWVudHMgJ3JvdW5kaW5nJyBvcGVyYXRpb25zIG9uIGRpZmZlcmVudFxyXG5kYXRhIHR5cGVzLlxyXG5JdCBob2xkcyB0aGUgZGlmZmVyZW50IHdheXMgYSByb3VuZGluZyBvcGVyYXRpb24gY2FuIGJlIGFwcGx5LlxyXG4qKi9cclxudmFyIHJvdW5kaW5nVHlwZUVudW0gPSB7XHJcbiAgICBEb3duOiAtMSxcclxuICAgIE5lYXJlc3Q6IDAsXHJcbiAgICBVcDogMVxyXG59O1xyXG5cclxuZnVuY3Rpb24gcm91bmRUbyhudW1iZXIsIGRlY2ltYWxzLCByb3VuZGluZ1R5cGUpIHtcclxuICAgIC8vIGNhc2UgTmVhcmVzdCBpcyB0aGUgZGVmYXVsdDpcclxuICAgIHZhciBmID0gbmVhcmVzdFRvO1xyXG4gICAgc3dpdGNoIChyb3VuZGluZ1R5cGUpIHtcclxuICAgICAgICBjYXNlIHJvdW5kaW5nVHlwZUVudW0uRG93bjpcclxuICAgICAgICAgICAgZiA9IGZsb29yVG87XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2Ugcm91bmRpbmdUeXBlRW51bS5VcDpcclxuICAgICAgICAgICAgZiA9IGNlaWxUbztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZihudW1iZXIsIGRlY2ltYWxzKTtcclxufVxyXG5cclxuLyoqIFJvdW5kIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdCBjYW4gc3Vic3RyYWN0IGludGVnZXIgZGVjaW1hbHMgYnkgcHJvdmlkaW5nIGEgbmVnYXRpdmVcclxubnVtYmVyIG9mIGRlY2ltYWxzLlxyXG4qKi9cclxuZnVuY3Rpb24gbmVhcmVzdFRvKG51bWJlciwgZGVjaW1hbHMpIHtcclxuICAgIHZhciB0ZW5zID0gTWF0aC5wb3coMTAsIGRlY2ltYWxzKTtcclxuICAgIHJldHVybiBNYXRoLnJvdW5kKG51bWJlciAqIHRlbnMpIC8gdGVucztcclxufVxyXG5cclxuLyoqIFJvdW5kIFVwIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgdXAsXHJcbnRvIHRoZSBsb3dlciBpbnRlZ2VyIGdyZWF0ZXIgb3IgZXF1YWxzIHRvIHRoZSBudW1iZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBjZWlsVG8obnVtYmVyLCBkZWNpbWFscykge1xyXG4gICAgdmFyIHRlbnMgPSBNYXRoLnBvdygxMCwgZGVjaW1hbHMpO1xyXG4gICAgcmV0dXJuIE1hdGguY2VpbChudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8qKiBSb3VuZCBEb3duIGEgbnVtYmVyIHRvIHRoZSBzcGVjaWZpZWQgbnVtYmVyIG9mIGRlY2ltYWxzLlxyXG5JdHMgc2ltaWxhciB0byByb3VuZFRvLCBidXQgdGhlIG51bWJlciBpcyBldmVyIHJvdW5kZWQgZG93bixcclxudG8gdGhlIGJpZ2dlciBpbnRlZ2VyIGxvd2VyIG9yIGVxdWFscyB0byB0aGUgbnVtYmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gZmxvb3JUbyhudW1iZXIsIGRlY2ltYWxzKSB7XHJcbiAgICB2YXIgdGVucyA9IE1hdGgucG93KDEwLCBkZWNpbWFscyk7XHJcbiAgICByZXR1cm4gTWF0aC5mbG9vcihudW1iZXIgKiB0ZW5zKSAvIHRlbnM7XHJcbn1cclxuXHJcbi8vIE1vZHVsZVxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICByb3VuZGluZ1R5cGVFbnVtOiByb3VuZGluZ1R5cGVFbnVtLFxyXG4gICAgICAgIHJvdW5kVG86IHJvdW5kVG8sXHJcbiAgICAgICAgbmVhcmVzdFRvOiBuZWFyZXN0VG8sXHJcbiAgICAgICAgY2VpbFRvOiBjZWlsVG8sXHJcbiAgICAgICAgZmxvb3JUbzogZmxvb3JUb1xyXG4gICAgfTsiLCJmdW5jdGlvbiBtb3ZlRm9jdXNUbyhlbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBtYXJnaW5Ub3A6IDMwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChlbCkub2Zmc2V0KCkudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3AgfSwgNTAwLCBudWxsKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vdmVGb2N1c1RvO1xyXG59IiwiLyogU29tZSB1dGlsaXRpZXMgdG8gZm9ybWF0IGFuZCBleHRyYWN0IG51bWJlcnMsIGZyb20gdGV4dCBvciBET00uXHJcbiAqL1xyXG52YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBpMThuID0gcmVxdWlyZSgnLi9pMThuJyksXHJcbiAgICBtdSA9IHJlcXVpcmUoJy4vbWF0aFV0aWxzJyk7XHJcblxyXG5mdW5jdGlvbiBnZXRNb25leU51bWJlcih2LCBhbHQpIHtcclxuICAgIGFsdCA9IGFsdCB8fCAwO1xyXG4gICAgaWYgKHYgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgdiA9IHYudmFsKCkgfHwgdi50ZXh0KCk7XHJcbiAgICB2ID0gcGFyc2VGbG9hdCh2XHJcbiAgICAgICAgLnJlcGxhY2UoL1sk4oKsXS9nLCAnJylcclxuICAgICAgICAucmVwbGFjZShuZXcgUmVnRXhwKExDLm51bWVyaWNNaWxlc1NlcGFyYXRvcltpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY3VsdHVyZV0sICdnJyksICcnKVxyXG4gICAgKTtcclxuICAgIHJldHVybiBpc05hTih2KSA/IGFsdCA6IHY7XHJcbn1cclxuZnVuY3Rpb24gbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSB7XHJcbiAgICB2YXIgY3VsdHVyZSA9IGkxOG4uZ2V0Q3VycmVudEN1bHR1cmUoKS5jdWx0dXJlO1xyXG4gICAgLy8gRmlyc3QsIHJvdW5kIHRvIDIgZGVjaW1hbHNcclxuICAgIHYgPSBtdS5yb3VuZFRvKHYsIDIpO1xyXG4gICAgLy8gR2V0IHRoZSBkZWNpbWFsIHBhcnQgKHJlc3QpXHJcbiAgICB2YXIgcmVzdCA9IE1hdGgucm91bmQodiAqIDEwMCAlIDEwMCk7XHJcbiAgICByZXR1cm4gKCcnICtcclxuICAgIC8vIEludGVnZXIgcGFydCAobm8gZGVjaW1hbHMpXHJcbiAgICAgICAgTWF0aC5mbG9vcih2KSArXHJcbiAgICAvLyBEZWNpbWFsIHNlcGFyYXRvciBkZXBlbmRpbmcgb24gbG9jYWxlXHJcbiAgICAgICAgaTE4bi5udW1lcmljRGVjaW1hbFNlcGFyYXRvcltjdWx0dXJlXSArXHJcbiAgICAvLyBEZWNpbWFscywgZXZlciB0d28gZGlnaXRzXHJcbiAgICAgICAgTWF0aC5mbG9vcihyZXN0IC8gMTApICsgcmVzdCAlIDEwXHJcbiAgICApO1xyXG59XHJcbmZ1bmN0aW9uIG51bWJlclRvTW9uZXlTdHJpbmcodikge1xyXG4gICAgdmFyIGNvdW50cnkgPSBpMThuLmdldEN1cnJlbnRDdWx0dXJlKCkuY291bnRyeTtcclxuICAgIC8vIFR3byBkaWdpdHMgaW4gZGVjaW1hbHMgZm9yIHJvdW5kZWQgdmFsdWUgd2l0aCBtb25leSBzeW1ib2wgYXMgZm9yXHJcbiAgICAvLyBjdXJyZW50IGxvY2FsZVxyXG4gICAgcmV0dXJuIChpMThuLm1vbmV5U3ltYm9sUHJlZml4W2NvdW50cnldICsgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyh2KSArIGkxOG4ubW9uZXlTeW1ib2xTdWZpeFtjb3VudHJ5XSk7XHJcbn1cclxuZnVuY3Rpb24gc2V0TW9uZXlOdW1iZXIodiwgZWwpIHtcclxuICAgIC8vIEdldCB2YWx1ZSBpbiBtb25leSBmb3JtYXQ6XHJcbiAgICB2ID0gbnVtYmVyVG9Nb25leVN0cmluZyh2KTtcclxuICAgIC8vIFNldHRpbmcgdmFsdWU6XHJcbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBqUXVlcnkpXHJcbiAgICAgICAgaWYgKGVsLmlzKCc6aW5wdXQnKSlcclxuICAgICAgICAgICAgZWwudmFsKHYpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgZWwudGV4dCh2KTtcclxuICAgIHJldHVybiB2O1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBnZXRNb25leU51bWJlcjogZ2V0TW9uZXlOdW1iZXIsXHJcbiAgICAgICAgbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZzogbnVtYmVyVG9Ud29EZWNpbWFsc1N0cmluZyxcclxuICAgICAgICBudW1iZXJUb01vbmV5U3RyaW5nOiBudW1iZXJUb01vbmV5U3RyaW5nLFxyXG4gICAgICAgIHNldE1vbmV5TnVtYmVyOiBzZXRNb25leU51bWJlclxyXG4gICAgfTsiLCIvKipcclxuKiBQbGFjZWhvbGRlciBwb2x5ZmlsbC5cclxuKiBBZGRzIGEgbmV3IGpRdWVyeSBwbGFjZUhvbGRlciBtZXRob2QgdG8gc2V0dXAgb3IgcmVhcHBseSBwbGFjZUhvbGRlclxyXG4qIG9uIGVsZW1lbnRzIChyZWNvbW1lbnRlZCB0byBiZSBhcHBseSBvbmx5IHRvIHNlbGVjdG9yICdbcGxhY2Vob2xkZXJdJyk7XHJcbiogdGhhdHMgbWV0aG9kIGlzIGZha2Ugb24gYnJvd3NlcnMgdGhhdCBoYXMgbmF0aXZlIHN1cHBvcnQgZm9yIHBsYWNlaG9sZGVyXHJcbioqL1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyksXHJcbiAgICAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0UGxhY2VIb2xkZXJzKCkge1xyXG4gICAgaWYgKE1vZGVybml6ci5pbnB1dC5wbGFjZWhvbGRlcilcclxuICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkgeyB9O1xyXG4gICAgZWxzZVxyXG4gICAgICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGRvUGxhY2Vob2xkZXIoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEkdC5kYXRhKCdwbGFjZWhvbGRlci1zdXBwb3J0ZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0Lm9uKCdmb2N1c2luJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAkdC5vbignZm9jdXNvdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy52YWx1ZS5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHQuZGF0YSgncGxhY2Vob2xkZXItc3VwcG9ydGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMudmFsdWUubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB0aGlzLmdldEF0dHJpYnV0ZSgncGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkLmZuLnBsYWNlaG9sZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChkb1BsYWNlaG9sZGVyKTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgJCgnW3BsYWNlaG9sZGVyXScpLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLmFqYXhDb21wbGV0ZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSkoKTtcclxufTsiLCIvKiBQb3B1cCBmdW5jdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqXHJcbiogUG9wdXAgcmVsYXRlZCBcclxuKiBmdW5jdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gcG9wdXBTaXplKHNpemUpIHtcclxuICAgIHZhciBzID0gKHNpemUgPT0gJ2xhcmdlJyA/IDAuOCA6IChzaXplID09ICdtZWRpdW0nID8gMC41IDogKHNpemUgPT0gJ3NtYWxsJyA/IDAuMiA6IHNpemUgfHwgMC41KSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB3aWR0aDogTWF0aC5yb3VuZCgkKHdpbmRvdykud2lkdGgoKSAqIHMpLFxyXG4gICAgICAgIGhlaWdodDogTWF0aC5yb3VuZCgkKHdpbmRvdykuaGVpZ2h0KCkgKiBzKSxcclxuICAgICAgICBzaXplRmFjdG9yOiBzXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwU3R5bGUoc2l6ZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdXJzb3I6ICdkZWZhdWx0JyxcclxuICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCArICdweCcsXHJcbiAgICAgICAgbGVmdDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLndpZHRoKCkgLSBzaXplLndpZHRoKSAvIDIpIC0gMjUgKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHQgKyAncHgnLFxyXG4gICAgICAgIHRvcDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLmhlaWdodCgpIC0gc2l6ZS5oZWlnaHQpIC8gMikgLSAzMiArICdweCcsXHJcbiAgICAgICAgcGFkZGluZzogJzM0cHggMjVweCAzMHB4JyxcclxuICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICctbW96LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nJyxcclxuICAgICAgICAnLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnLFxyXG4gICAgICAgICdiYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwKHVybCwgc2l6ZSwgY29tcGxldGUsIGxvYWRpbmdUZXh0LCBvcHRpb25zKSB7XHJcbiAgICBpZiAodHlwZW9mICh1cmwpID09PSAnb2JqZWN0JylcclxuICAgICAgICBvcHRpb25zID0gdXJsO1xyXG5cclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICB1cmw6IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAnJyxcclxuICAgICAgICBzaXplOiBzaXplIHx8IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9LFxyXG4gICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcclxuICAgICAgICBsb2FkaW5nVGV4dDogbG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2xvc2FibGU6IHtcclxuICAgICAgICAgICAgb25Mb2FkOiBmYWxzZSxcclxuICAgICAgICAgICAgYWZ0ZXJMb2FkOiB0cnVlLFxyXG4gICAgICAgICAgICBvbkVycm9yOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvU2l6ZTogZmFsc2UsXHJcbiAgICAgICAgY29udGFpbmVyQ2xhc3M6ICcnLFxyXG4gICAgICAgIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLy8gUHJlcGFyZSBzaXplIGFuZCBsb2FkaW5nXHJcbiAgICBvcHRpb25zLmxvYWRpbmdUZXh0ID0gb3B0aW9ucy5sb2FkaW5nVGV4dCB8fCAnJztcclxuICAgIGlmICh0eXBlb2YgKG9wdGlvbnMuc2l6ZS53aWR0aCkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHBvcHVwU2l6ZShvcHRpb25zLnNpemUpO1xyXG5cclxuICAgICQuYmxvY2tVSSh7XHJcbiAgICAgICAgbWVzc2FnZTogKG9wdGlvbnMuY2xvc2FibGUub25Mb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICtcclxuICAgICAgICc8aW1nIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nICsgb3B0aW9ucy5sb2FkaW5nVGV4dCxcclxuICAgICAgICBjZW50ZXJZOiBmYWxzZSxcclxuICAgICAgICBjc3M6IHBvcHVwU3R5bGUob3B0aW9ucy5zaXplKSxcclxuICAgICAgICBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0sXHJcbiAgICAgICAgZm9jdXNJbnB1dDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTG9hZGluZyBVcmwgd2l0aCBBamF4IGFuZCBwbGFjZSBjb250ZW50IGluc2lkZSB0aGUgYmxvY2tlZC1ib3hcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcclxuICAgICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJCgnLmJsb2NrTXNnJylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhvcHRpb25zLmNvbnRhaW5lckNsYXNzKTtcclxuICAgICAgICAgICAgLy8gQWRkIGNsb3NlIGJ1dHRvbiBpZiByZXF1aXJlcyBpdCBvciBlbXB0eSBtZXNzYWdlIGNvbnRlbnQgdG8gYXBwZW5kIHRoZW4gbW9yZVxyXG4gICAgICAgICAgICBjb250YWluZXIuaHRtbChvcHRpb25zLmNsb3NhYmxlLmFmdGVyTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRIb2xkZXIgPSBjb250YWluZXIuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29udGVudFwiLz4nKS5jaGlsZHJlbignLmNvbnRlbnQnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuQ29kZSAmJiBkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgY29kZSwgc2hvdyByZXN1bHRcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQYWdlIGNvbnRlbnQgZ290LCBwYXN0ZSBpbnRvIHRoZSBwb3B1cCBpZiBpcyBwYXJ0aWFsIGh0bWwgKHVybCBzdGFydHMgd2l0aCAkKVxyXG4gICAgICAgICAgICAgICAgaWYgKC8oKF5cXCQpfChcXC9cXCQpKS8udGVzdChvcHRpb25zLnVybCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRIb2xkZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9TaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2b2lkIG1pc2NhbGN1bGF0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldldpZHRoID0gY29udGVudEhvbGRlclswXS5zdHlsZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRXaWR0aCA9IGNvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udEhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhV2lkdGggPSBjb250YWluZXIub3V0ZXJXaWR0aCh0cnVlKSAtIGNvbnRXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSGVpZ2h0ID0gY29udGFpbmVyLm91dGVySGVpZ2h0KHRydWUpIC0gY29udEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkgLSBleHRyYVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gZXh0cmFIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBhbmQgYXBwbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogYWN0dWFsV2lkdGggPiBtYXhXaWR0aCA/IG1heFdpZHRoIDogYWN0dWFsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGFjdHVhbEhlaWdodCA+IG1heEhlaWdodCA/IG1heEhlaWdodCA6IGFjdHVhbEhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuYW5pbWF0ZShzaXplLCAzMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBtaXNjYWxjdWxhdGlvbnMgY29ycmVjdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgcHJldldpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsIHByZXZIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRWxzZSwgaWYgdXJsIGlzIGEgZnVsbCBodG1sIHBhZ2UgKG5vcm1hbCBwYWdlKSwgcHV0IGNvbnRlbnQgaW50byBhbiBpZnJhbWVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGRhdGEsIHRoaXMub3B0aW9ucy5zaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2tpbmcgZWxlbWVudCBjb250ZW50ICh0aGUgbG9hZGluZykgd2l0aCB0aGUgaWZyYW1lOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZXJyb3I6IGZ1bmN0aW9uIChqLCB0LCBleCkge1xyXG4gICAgICAgICAgICAkKCdkaXYuYmxvY2tNc2cnKS5odG1sKChvcHRpb25zLmNsb3NhYmxlLm9uRXJyb3IgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgKyAnPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5QYWdlIG5vdCBmb3VuZDwvZGl2PicpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmluZm8pIGNvbnNvbGUuaW5mbyhcIlBvcHVwLWFqYXggZXJyb3I6IFwiICsgZXgpO1xyXG4gICAgICAgIH0sIGNvbXBsZXRlOiBvcHRpb25zLmNvbXBsZXRlXHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmV0dXJuZWRCbG9jayA9ICQoJy5ibG9ja1VJJyk7XHJcblxyXG4gICAgcmV0dXJuZWRCbG9jay5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICByZXR1cm5lZEJsb2NrLnRyaWdnZXIoJ3BvcHVwLWNsb3NlZCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuZWRCbG9jay5jbG9zZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybmVkQmxvY2suZ2V0QmxvY2tFbGVtZW50ID0gZnVuY3Rpb24gZ2V0QmxvY2tFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja01zZycpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRDb250ZW50RWxlbWVudCA9IGZ1bmN0aW9uIGdldENvbnRlbnRFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maW5kKCcuY29udGVudCcpOyB9O1xyXG4gICAgcmV0dXJuZWRCbG9jay5nZXRPdmVybGF5RWxlbWVudCA9IGZ1bmN0aW9uIGdldE92ZXJsYXlFbGVtZW50KCkgeyByZXR1cm4gcmV0dXJuZWRCbG9jay5maWx0ZXIoJy5ibG9ja092ZXJsYXknKTsgfTtcclxuICAgIHJldHVybiByZXR1cm5lZEJsb2NrO1xyXG59XHJcblxyXG4vKiBTb21lIHBvcHVwIHV0aWxpdGl0ZXMvc2hvcnRoYW5kcyAqL1xyXG5mdW5jdGlvbiBtZXNzYWdlUG9wdXAobWVzc2FnZSwgY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCAnYm9keScpO1xyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2Lz4nKS50ZXh0KG1lc3NhZ2UpO1xyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjb250YWluZXIsICdtZXNzYWdlLXBvcHVwIGZ1bGwtYmxvY2snLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbm5lY3RQb3B1cEFjdGlvbihhcHBseVRvU2VsZWN0b3IpIHtcclxuICAgIGFwcGx5VG9TZWxlY3RvciA9IGFwcGx5VG9TZWxlY3RvciB8fCAnLnBvcHVwLWFjdGlvbic7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBhcHBseVRvU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQoJCh0aGlzKS5hdHRyKCdocmVmJykpLmNsb25lKCk7XHJcbiAgICAgICAgaWYgKGMubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgZG9jdW1lbnQsIG51bGwsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy8gVGhlIHBvcHVwIGZ1bmN0aW9uIGNvbnRhaW5zIGFsbCB0aGUgb3RoZXJzIGFzIG1ldGhvZHNcclxucG9wdXAuc2l6ZSA9IHBvcHVwU2l6ZTtcclxucG9wdXAuc3R5bGUgPSBwb3B1cFN0eWxlO1xyXG5wb3B1cC5jb25uZWN0QWN0aW9uID0gY29ubmVjdFBvcHVwQWN0aW9uO1xyXG5wb3B1cC5tZXNzYWdlID0gbWVzc2FnZVBvcHVwO1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcG9wdXA7IiwiLyoqKiogUG9zdGFsIENvZGU6IG9uIGZseSwgc2VydmVyLXNpZGUgdmFsaWRhdGlvbiAqKioqKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIGJhc2VVcmw6ICcvJyxcclxuICAgICAgICBzZWxlY3RvcjogJ1tkYXRhLXZhbC1wb3N0YWxjb2RlXScsXHJcbiAgICAgICAgdXJsOiAnSlNPTi9WYWxpZGF0ZVBvc3RhbENvZGUvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgJChkb2N1bWVudCkub24oJ2NoYW5nZScsIG9wdGlvbnMuc2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIC8vIElmIGNvbnRhaW5zIGEgdmFsdWUgKHRoaXMgbm90IHZhbGlkYXRlIGlmIGlzIHJlcXVpcmVkKSBhbmQgXHJcbiAgICAgICAgLy8gaGFzIHRoZSBlcnJvciBkZXNjcmlwdGl2ZSBtZXNzYWdlLCB2YWxpZGF0ZSB0aHJvdWdoIGFqYXhcclxuICAgICAgICB2YXIgcGMgPSAkdC52YWwoKTtcclxuICAgICAgICB2YXIgbXNnID0gJHQuZGF0YSgndmFsLXBvc3RhbGNvZGUnKTtcclxuICAgICAgICBpZiAocGMgJiYgbXNnKSB7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMuYmFzZVVybCArIG9wdGlvbnMudXJsLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogeyBQb3N0YWxDb2RlOiBwYyB9LFxyXG4gICAgICAgICAgICAgICAgY2FjaGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ0pTT04nLFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLlJlc3VsdC5Jc1ZhbGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdC5yZW1vdmVDbGFzcygnaW5wdXQtdmFsaWRhdGlvbi1lcnJvcicpLmFkZENsYXNzKCd2YWxpZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuc2libGluZ3MoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tZXJyb3InKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRleHQoJycpLmNoaWxkcmVuKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhbiBzdW1tYXJ5IGVycm9yc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuY2xvc2VzdCgnZm9ybScpLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgnPiB1bCA+IGxpJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLnRleHQoKSA9PSBtc2cpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHQuYWRkQ2xhc3MoJ2lucHV0LXZhbGlkYXRpb24tZXJyb3InKS5yZW1vdmVDbGFzcygndmFsaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LnNpYmxpbmdzKCcuZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5hcHBlbmQoJzxzcGFuIGZvcj1cIicgKyAkdC5hdHRyKCduYW1lJykgKyAnXCIgZ2VuZXJhdGVkPVwidHJ1ZVwiPicgKyBtc2cgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIHN1bW1hcnkgZXJyb3IgKGlmIHRoZXJlIGlzIG5vdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0LmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2hpbGRyZW4oJ3VsJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuYXBwZW5kKCc8bGk+JyArIG1zZyArICc8L2xpPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59OyIsIi8qKiBBcHBseSBldmVyIGEgcmVkaXJlY3QgdG8gdGhlIGdpdmVuIFVSTCwgaWYgdGhpcyBpcyBhbiBpbnRlcm5hbCBVUkwgb3Igc2FtZVxyXG5wYWdlLCBpdCBmb3JjZXMgYSBwYWdlIHJlbG9hZCBmb3IgdGhlIGdpdmVuIFVSTC5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlZGlyZWN0VG8odXJsKSB7XHJcbiAgICAvLyBCbG9jayB0byBhdm9pZCBtb3JlIHVzZXIgaW50ZXJhY3Rpb25zOlxyXG4gICAgJC5ibG9ja1VJKHsgbWVzc2FnZTogJycgfSk7IC8vbG9hZGluZ0Jsb2NrKTtcclxuICAgIC8vIENoZWNraW5nIGlmIGlzIGJlaW5nIHJlZGlyZWN0aW5nIG9yIG5vdFxyXG4gICAgdmFyIHJlZGlyZWN0ZWQgPSBmYWxzZTtcclxuICAgICQod2luZG93KS5vbignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gY2hlY2tSZWRpcmVjdCgpIHtcclxuICAgICAgICByZWRpcmVjdGVkID0gdHJ1ZTtcclxuICAgIH0pO1xyXG4gICAgLy8gTmF2aWdhdGUgdG8gbmV3IGxvY2F0aW9uOlxyXG4gICAgd2luZG93LmxvY2F0aW9uID0gdXJsO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gSWYgcGFnZSBub3QgY2hhbmdlZCAoc2FtZSB1cmwgb3IgaW50ZXJuYWwgbGluayksIHBhZ2UgY29udGludWUgZXhlY3V0aW5nIHRoZW4gcmVmcmVzaDpcclxuICAgICAgICBpZiAoIXJlZGlyZWN0ZWQpXHJcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0sIDUwKTtcclxufTtcclxuIiwiLyoqIFNhbml0aXplIHRoZSB3aGl0ZXNwYWNlcyBpbiBhIHRleHQgYnk6XHJcbi0gcmVwbGFjaW5nIGNvbnRpZ3VvdXMgd2hpdGVzcGFjZXMgY2hhcmFjdGVyZXMgKGFueSBudW1iZXIgb2YgcmVwZXRpdGlvbiBcclxuYW5kIGFueSBraW5kIG9mIHdoaXRlIGNoYXJhY3RlcikgYnkgYSBub3JtYWwgd2hpdGUtc3BhY2VcclxuLSByZXBsYWNlIGVuY29kZWQgbm9uLWJyZWFraW5nLXNwYWNlcyBieSBhIG5vcm1hbCB3aGl0ZS1zcGFjZVxyXG4tIHJlbW92ZSBzdGFydGluZyBhbmQgZW5kaW5nIHdoaXRlLXNwYWNlc1xyXG4tIGV2ZXIgcmV0dXJuIGEgc3RyaW5nLCBlbXB0eSB3aGVuIG51bGxcclxuKiovXHJcbmZ1bmN0aW9uIHNhbml0aXplV2hpdGVzcGFjZXModGV4dCkge1xyXG4gICAgLy8gRXZlciByZXR1cm4gYSBzdHJpbmcsIGVtcHR5IHdoZW4gbnVsbFxyXG4gICAgdGV4dCA9ICh0ZXh0IHx8ICcnKVxyXG4gICAgLy8gUmVwbGFjZSBhbnkga2luZCBvZiBjb250aWd1b3VzIHdoaXRlc3BhY2VzIGNoYXJhY3RlcnMgYnkgYSBzaW5nbGUgbm9ybWFsIHdoaXRlLXNwYWNlXHJcbiAgICAvLyAodGhhdHMgaW5jbHVkZSByZXBsYWNlIGVuY29uZGVkIG5vbi1icmVha2luZy1zcGFjZXMsXHJcbiAgICAvLyBhbmQgZHVwbGljYXRlZC1yZXBlYXRlZCBhcHBlYXJhbmNlcylcclxuICAgIC5yZXBsYWNlKC9cXHMrL2csICcgJyk7XHJcbiAgICAvLyBSZW1vdmUgc3RhcnRpbmcgYW5kIGVuZGluZyB3aGl0ZXNwYWNlc1xyXG4gICAgcmV0dXJuICQudHJpbSh0ZXh0KTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gc2FuaXRpemVXaGl0ZXNwYWNlczsiLCIvKiogQ3VzdG9tIExvY29ub21pY3MgJ2xpa2UgYmxvY2tVSScgcG9wdXBzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlLFxyXG4gICAgYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi9hdXRvRm9jdXMnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG5cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2soY29udGVudEJveCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHtcclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBjbG9zYWJsZTogZmFsc2UsXHJcbiAgICAgICAgY2VudGVyOiBmYWxzZSxcclxuICAgICAgICAvKiBhcyBhIHZhbGlkIG9wdGlvbnMgcGFyYW1ldGVyIGZvciBMQy5oaWRlRWxlbWVudCBmdW5jdGlvbiAqL1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogNjAwLFxyXG4gICAgICAgICAgICBlZmZlY3Q6ICdmYWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgIGF1dG9mb2N1c09wdGlvbnM6IHsgbWFyZ2luVG9wOiA2MCB9LFxyXG4gICAgICAgIHdpZHRoOiAnYXV0bydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnRlbnRCb3ggPSAkKGNvbnRlbnRCb3gpO1xyXG4gICAgdmFyIGZ1bGwgPSBmYWxzZTtcclxuICAgIGlmIChibG9ja2VkID09IGRvY3VtZW50IHx8IGJsb2NrZWQgPT0gd2luZG93KSB7XHJcbiAgICAgICAgYmxvY2tlZCA9ICQoJ2JvZHknKTtcclxuICAgICAgICBmdWxsID0gdHJ1ZTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGJsb2NrZWQgPSAkKGJsb2NrZWQpO1xyXG5cclxuICAgIHZhciBib3hJbnNpZGVCbG9ja2VkID0gIWJsb2NrZWQuaXMoJ2JvZHksdHIsdGhlYWQsdGJvZHksdGZvb3QsdGFibGUsdWwsb2wsZGwnKTtcclxuXHJcbiAgICAvLyBHZXR0aW5nIGJveCBlbGVtZW50IGlmIGV4aXN0cyBhbmQgcmVmZXJlbmNpbmdcclxuICAgIHZhciBiSUQgPSBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnKTtcclxuICAgIGlmICghYklEKVxyXG4gICAgICAgIGJJRCA9IChjb250ZW50Qm94LmF0dHIoJ2lkJykgfHwgJycpICsgKGJsb2NrZWQuYXR0cignaWQnKSB8fCAnJykgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIGlmIChiSUQgPT0gJy1zbW9vdGhCb3hCbG9jaycpIHtcclxuICAgICAgICBiSUQgPSAnaWQtJyArIGd1aWRHZW5lcmF0b3IoKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgfVxyXG4gICAgYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJywgYklEKTtcclxuICAgIHZhciBib3ggPSAkKCcjJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoYklEKSk7XHJcbiAgICAvLyBIaWRpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94LnhoaWRlKG9wdGlvbnMuY2xvc2VPcHRpb25zKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICAgIGJveGNcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIG51bGwsIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycpKTsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgICAgIC5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJywgdHJ1ZSk7XHJcbiAgICBib3hjLmFwcGVuZChjb250ZW50Qm94KTtcclxuICAgIGJveGMud2lkdGgob3B0aW9ucy53aWR0aCk7XHJcbiAgICBib3guY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgaWYgKGJveEluc2lkZUJsb2NrZWQpIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBpbnNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudDpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgYmxvY2tlZC5jc3MoJ3otaW5kZXgnKSArIDEwKTtcclxuICAgICAgICBpZiAoIWJsb2NrZWQuY3NzKCdwb3NpdGlvbicpIHx8IGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpID09ICdzdGF0aWMnKVxyXG4gICAgICAgICAgICBibG9ja2VkLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJveGMuY3NzKCd0b3AnLCBjdCAtIGJveGMub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyKTtcclxuICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07IiwiLyoqXHJcbioqIE1vZHVsZTo6IHRvb2x0aXBzXHJcbioqIENyZWF0ZXMgc21hcnQgdG9vbHRpcHMgd2l0aCBwb3NzaWJpbGl0aWVzIGZvciBvbiBob3ZlciBhbmQgb24gY2xpY2ssXHJcbioqIGFkZGl0aW9uYWwgZGVzY3JpcHRpb24gb3IgZXh0ZXJuYWwgdG9vbHRpcCBjb250ZW50LlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIHNhbml0aXplV2hpdGVzcGFjZXMgPSByZXF1aXJlKCcuL3Nhbml0aXplV2hpdGVzcGFjZXMnKTtcclxucmVxdWlyZSgnLi9qcXVlcnkub3V0ZXJIdG1sJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5LmlzQ2hpbGRPZicpO1xyXG5cclxuLy8gTWFpbiBpbnRlcm5hbCBwcm9wZXJ0aWVzXHJcbnZhciBwb3NvZmZzZXQgPSB7IHg6IDE2LCB5OiA4IH07XHJcbnZhciBzZWxlY3RvciA9ICdbdGl0bGVdW2RhdGEtZGVzY3JpcHRpb25dLCBbdGl0bGVdLmhhcy10b29sdGlwLCBbdGl0bGVdLnNlY3VyZS1kYXRhLCBbZGF0YS10b29sdGlwLXVybF0sIFt0aXRsZV0uaGFzLXBvcHVwLXRvb2x0aXAnO1xyXG5cclxuLyoqIFBvc2l0aW9uYXRlIHRoZSB0b29sdGlwIGRlcGVuZGluZyBvbiB0aGVcclxuZXZlbnQgb3IgdGhlIHRhcmdldCBlbGVtZW50IHBvc2l0aW9uIGFuZCBhbiBvZmZzZXRcclxuKiovXHJcbmZ1bmN0aW9uIHBvcyh0LCBlLCBsKSB7XHJcbiAgICB2YXIgeCwgeTtcclxuICAgIGlmIChlLnBhZ2VYICYmIGUucGFnZVkpIHtcclxuICAgICAgICB4ID0gZS5wYWdlWDtcclxuICAgICAgICB5ID0gZS5wYWdlWTtcclxuICAgIH0gZWxzZSBpZiAoZS50YXJnZXQpIHtcclxuICAgICAgICB2YXIgJGV0ID0gJChlLnRhcmdldCk7XHJcbiAgICAgICAgeCA9ICRldC5vdXRlcldpZHRoKCkgKyAkZXQub2Zmc2V0KCkubGVmdDtcclxuICAgICAgICB5ID0gJGV0Lm91dGVySGVpZ2h0KCkgKyAkZXQub2Zmc2V0KCkudG9wO1xyXG4gICAgfVxyXG4gICAgdC5jc3MoJ2xlZnQnLCB4ICsgcG9zb2Zmc2V0LngpO1xyXG4gICAgdC5jc3MoJ3RvcCcsIHkgKyBwb3NvZmZzZXQueSk7XHJcbiAgICAvLyBBZGp1c3Qgd2lkdGggdG8gdmlzaWJsZSB2aWV3cG9ydFxyXG4gICAgdmFyIHRkaWYgPSB0Lm91dGVyV2lkdGgoKSAtIHQud2lkdGgoKTtcclxuICAgIHQuY3NzKCdtYXgtd2lkdGgnLCAkKHdpbmRvdykud2lkdGgoKSAtIHggLSBwb3NvZmZzZXQueCAtIHRkaWYpO1xyXG4gICAgLy90LmhlaWdodCgkKGRvY3VtZW50KS5oZWlnaHQoKSAtIHkgLSBwb3NvZmZzZXQueSk7XHJcbn1cclxuLyoqIEdldCBvciBjcmVhdGUsIGFuZCByZXR1cm5zLCB0aGUgdG9vbHRpcCBjb250ZW50IGZvciB0aGUgZWxlbWVudFxyXG4qKi9cclxuZnVuY3Rpb24gY29uKGwpIHtcclxuICAgIGlmIChsLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgYyA9IGwuZGF0YSgndG9vbHRpcC1jb250ZW50JyksXHJcbiAgICAgICAgcGVyc2lzdGVudCA9IGwuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJyk7XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICB2YXIgaCA9IHNhbml0aXplV2hpdGVzcGFjZXMobC5hdHRyKCd0aXRsZScpKTtcclxuICAgICAgICB2YXIgZCA9IHNhbml0aXplV2hpdGVzcGFjZXMobC5kYXRhKCdkZXNjcmlwdGlvbicpKTtcclxuICAgICAgICBpZiAoZClcclxuICAgICAgICAgICAgYyA9ICc8aDQ+JyArIGggKyAnPC9oND48cD4nICsgZCArICc8L3A+JztcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGMgPSBoO1xyXG4gICAgICAgIC8vIEFwcGVuZCBkYXRhLXRvb2x0aXAtdXJsIGNvbnRlbnQgaWYgZXhpc3RzXHJcbiAgICAgICAgdmFyIHVybGNvbnRlbnQgPSAkKGwuZGF0YSgndG9vbHRpcC11cmwnKSk7XHJcbiAgICAgICAgYyA9IChjIHx8ICcnKSArIHVybGNvbnRlbnQub3V0ZXJIdG1sKCk7XHJcbiAgICAgICAgLy8gUmVtb3ZlIG9yaWdpbmFsLCBpcyBubyBtb3JlIG5lZWQgYW5kIGF2b2lkIGlkLWNvbmZsaWN0c1xyXG4gICAgICAgIHVybGNvbnRlbnQucmVtb3ZlKCk7XHJcbiAgICAgICAgLy8gU2F2ZSB0b29sdGlwIGNvbnRlbnRcclxuICAgICAgICBsLmRhdGEoJ3Rvb2x0aXAtY29udGVudCcsIGMpO1xyXG4gICAgICAgIC8vIFJlbW92ZSBicm93c2VyIHRvb2x0aXAgKGJvdGggd2hlbiB3ZSBhcmUgdXNpbmcgb3VyIG93biB0b29sdGlwIGFuZCB3aGVuIG5vIHRvb2x0aXBcclxuICAgICAgICAvLyBpcyBuZWVkKVxyXG4gICAgICAgIGwuYXR0cigndGl0bGUnLCAnJyk7XHJcbiAgICB9XHJcbiAgICAvLyBSZW1vdmUgdG9vbHRpcCBjb250ZW50IChidXQgcHJlc2VydmUgaXRzIGNhY2hlIGluIHRoZSBlbGVtZW50IGRhdGEpXHJcbiAgICAvLyBpZiBpcyB0aGUgc2FtZSB0ZXh0IGFzIHRoZSBlbGVtZW50IGNvbnRlbnQgYW5kIHRoZSBlbGVtZW50IGNvbnRlbnRcclxuICAgIC8vIGlzIGZ1bGx5IHZpc2libGUuIFRoYXRzLCBmb3IgY2FzZXMgd2l0aCBkaWZmZXJlbnQgY29udGVudCwgd2lsbCBiZSBzaG93ZWQsXHJcbiAgICAvLyBhbmQgZm9yIGNhc2VzIHdpdGggc2FtZSBjb250ZW50IGJ1dCBpcyBub3QgdmlzaWJsZSBiZWNhdXNlIHRoZSBlbGVtZW50XHJcbiAgICAvLyBvciBjb250YWluZXIgd2lkdGgsIHRoZW4gd2lsbCBiZSBzaG93ZWQuXHJcbiAgICAvLyBFeGNlcHQgaWYgaXMgcGVyc2lzdGVudFxyXG4gICAgaWYgKHBlcnNpc3RlbnQgIT09IHRydWUgJiZcclxuICAgICAgICBzYW5pdGl6ZVdoaXRlc3BhY2VzKGwudGV4dCgpKSA9PSBjICYmXHJcbiAgICAgICAgbC5vdXRlcldpZHRoKCkgPj0gbFswXS5zY3JvbGxXaWR0aCkge1xyXG4gICAgICAgIGMgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm90IGNvbnRlbnQ6XHJcbiAgICBpZiAoIWMpIHtcclxuICAgICAgICAvLyBVcGRhdGUgdGFyZ2V0IHJlbW92aW5nIHRoZSBjbGFzcyB0byBhdm9pZCBjc3MgbWFya2luZyB0b29sdGlwIHdoZW4gdGhlcmUgaXMgbm90XHJcbiAgICAgICAgbC5yZW1vdmVDbGFzcygnaGFzLXRvb2x0aXAnKS5yZW1vdmVDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIH1cclxuICAgIC8vIFJldHVybiB0aGUgY29udGVudCBhcyBzdHJpbmc6XHJcbiAgICByZXR1cm4gYztcclxufVxyXG4vKiogR2V0IG9yIGNyZWF0ZXMgdGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBmb3IgYSB0b29sdGlwIG9mIHRoZSBnaXZlbiB0eXBlXHJcbioqL1xyXG5mdW5jdGlvbiBnZXRUb29sdGlwKHR5cGUpIHtcclxuICAgIHR5cGUgPSB0eXBlIHx8ICd0b29sdGlwJztcclxuICAgIHZhciBpZCA9ICdzaW5nbGV0b24tJyArIHR5cGU7XHJcbiAgICB2YXIgdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcclxuICAgIGlmICghdCkge1xyXG4gICAgICAgIHQgPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGVcIiBjbGFzcz1cInRvb2x0aXBcIj48L2Rpdj4nKTtcclxuICAgICAgICB0LmF0dHIoJ2lkJywgaWQpO1xyXG4gICAgICAgIHQuaGlkZSgpO1xyXG4gICAgICAgICQoJ2JvZHknKS5hcHBlbmQodCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gJCh0KTtcclxufVxyXG4vKiogU2hvdyB0aGUgdG9vbHRpcCBvbiBhbiBldmVudCB0cmlnZ2VyZWQgYnkgdGhlIGVsZW1lbnQgY29udGFpbmluZ1xyXG5pbmZvcm1hdGlvbiBmb3IgYSB0b29sdGlwXHJcbioqL1xyXG5mdW5jdGlvbiBzaG93VG9vbHRpcChlKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGlzUG9wdXAgPSAkdC5oYXNDbGFzcygnaGFzLXBvcHVwLXRvb2x0aXAnKTtcclxuICAgIC8vIEdldCBvciBjcmVhdGUgdG9vbHRpcCBsYXllclxyXG4gICAgdmFyIHQgPSBnZXRUb29sdGlwKGlzUG9wdXAgPyAncG9wdXAtdG9vbHRpcCcgOiAndG9vbHRpcCcpO1xyXG4gICAgLy8gSWYgdGhpcyBpcyBub3QgcG9wdXAgYW5kIHRoZSBldmVudCBpcyBjbGljaywgZGlzY2FyZCB3aXRob3V0IGNhbmNlbCBldmVudFxyXG4gICAgaWYgKCFpc1BvcHVwICYmIGUudHlwZSA9PSAnY2xpY2snKVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG5cclxuICAgIC8vIENyZWF0ZSBjb250ZW50OiBpZiB0aGVyZSBpcyBjb250ZW50LCBjb250aW51ZVxyXG4gICAgdmFyIGNvbnRlbnQgPSBjb24oJHQpO1xyXG4gICAgaWYgKGNvbnRlbnQpIHtcclxuICAgICAgICAvLyBJZiBpcyBhIGhhcy1wb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBkb24ndCBzaG93XHJcbiAgICAgICAgaWYgKGlzUG9wdXAgJiYgZS50eXBlICE9ICdjbGljaycpXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIC8vIFRoZSB0b29sdGlwIHNldHVwIG11c3QgYmUgcXVldWVkIHRvIGF2b2lkIGNvbnRlbnQgdG8gYmUgc2hvd2VkIGFuZCBwbGFjZWRcclxuICAgICAgICAvLyB3aGVuIHN0aWxsIGhpZGRlbiB0aGUgcHJldmlvdXNcclxuICAgICAgICB0LnF1ZXVlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gU2V0IHRvb2x0aXAgY29udGVudFxyXG4gICAgICAgICAgICB0Lmh0bWwoY29udGVudCk7XHJcbiAgICAgICAgICAgIC8vIEZvciBwb3B1cHMsIHNldHVwIGNsYXNzIGFuZCBjbG9zZSBidXR0b25cclxuICAgICAgICAgICAgaWYgKGlzUG9wdXApIHtcclxuICAgICAgICAgICAgICAgIHQuYWRkQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKTtcclxuICAgICAgICAgICAgICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxhIGhyZWY9XCIjY2xvc2UtcG9wdXBcIiBjbGFzcz1cImNsb3NlLWFjdGlvblwiPlg8L2E+Jyk7XHJcbiAgICAgICAgICAgICAgICB0LmFwcGVuZChjbG9zZUJ1dHRvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gUG9zaXRpb25hdGVcclxuICAgICAgICAgICAgcG9zKHQsIGUsICR0KTtcclxuICAgICAgICAgICAgdC5kZXF1ZXVlKCk7XHJcbiAgICAgICAgICAgIC8vIFNob3cgKGFuaW1hdGlvbnMgYXJlIHN0b3BwZWQgb25seSBvbiBoaWRlIHRvIGF2b2lkIGNvbmZsaWN0cylcclxuICAgICAgICAgICAgdC5mYWRlSW4oKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBTdG9wIGJ1YmJsaW5nIGFuZCBkZWZhdWx0XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEhpZGUgYWxsIG9wZW5lZCB0b29sdGlwcywgZm9yIGFueSB0eXBlLlxyXG5JdCBoYXMgc29tZSBzcGVjaWFsIGNvbnNpZGVyYXRpb25zIGZvciBwb3B1cC10b29sdGlwcyBkZXBlbmRpbmdcclxub24gdGhlIGV2ZW50IGJlaW5nIHRyaWdnZXJlZC5cclxuKiovXHJcbmZ1bmN0aW9uIGhpZGVUb29sdGlwKGUpIHtcclxuICAgICQoJy50b29sdGlwOnZpc2libGUnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdCA9ICQodGhpcyk7XHJcbiAgICAgICAgLy8gSWYgaXMgYSBwb3B1cC10b29sdGlwIGFuZCB0aGlzIGlzIG5vdCBhIGNsaWNrLCBvciB0aGUgaW52ZXJzZSxcclxuICAgICAgICAvLyB0aGlzIGlzIG5vdCBhIHBvcHVwLXRvb2x0aXAgYW5kIHRoaXMgaXMgYSBjbGljaywgZG8gbm90aGluZ1xyXG4gICAgICAgIGlmICh0Lmhhc0NsYXNzKCdwb3B1cC10b29sdGlwJykgJiYgZS50eXBlICE9ICdjbGljaycgfHxcclxuICAgICAgICAgICAgIXQuaGFzQ2xhc3MoJ3BvcHVwLXRvb2x0aXAnKSAmJiBlLnR5cGUgPT0gJ2NsaWNrJylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIFN0b3AgYW5pbWF0aW9ucyBhbmQgaGlkZVxyXG4gICAgICAgIHQuc3RvcCh0cnVlLCB0cnVlKS5mYWRlT3V0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuLyoqIEluaXRpYWxpemUgdG9vbHRpcHNcclxuKiovXHJcbmZ1bmN0aW9uIGluaXQoKSB7XHJcbiAgICAvLyBMaXN0ZW4gZm9yIGV2ZW50cyB0byBzaG93L2hpZGUgdG9vbHRpcHNcclxuICAgICQoJ2JvZHknKS5vbignbW91c2Vtb3ZlIGZvY3VzaW4nLCBzZWxlY3Rvciwgc2hvd1Rvb2x0aXApXHJcbiAgICAub24oJ21vdXNlbGVhdmUgZm9jdXNvdXQnLCBzZWxlY3RvciwgaGlkZVRvb2x0aXApXHJcbiAgICAvLyBMaXN0ZW4gZXZlbnQgZm9yIGNsaWNrYWJsZSBwb3B1cC10b29sdGlwc1xyXG4gICAgLm9uKCdjbGljaycsICdbdGl0bGVdLmhhcy1wb3B1cC10b29sdGlwJywgc2hvd1Rvb2x0aXApXHJcbiAgICAvLyBBbGxvd2luZyBidXR0b25zIGluc2lkZSB0aGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcudG9vbHRpcC1idXR0b24nLCBmdW5jdGlvbiAoKSB7IHJldHVybiBmYWxzZTsgfSlcclxuICAgIC8vIEFkZGluZyBjbG9zZS10b29sdGlwIGhhbmRsZXIgZm9yIHBvcHVwLXRvb2x0aXBzIChjbGljayBvbiBhbnkgZWxlbWVudCBleGNlcHQgdGhlIHRvb2x0aXAgaXRzZWxmKVxyXG4gICAgLm9uKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdmFyIHQgPSAkKCcucG9wdXAtdG9vbHRpcDp2aXNpYmxlJykuZ2V0KDApO1xyXG4gICAgICAgIC8vIElmIHRoZSBjbGljayBpcyBOb3Qgb24gdGhlIHRvb2x0aXAgb3IgYW55IGVsZW1lbnQgY29udGFpbmVkXHJcbiAgICAgICAgLy8gaGlkZSB0b29sdGlwXHJcbiAgICAgICAgaWYgKGUudGFyZ2V0ICE9IHQgJiYgISQoZS50YXJnZXQpLmlzQ2hpbGRPZih0KSlcclxuICAgICAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KVxyXG4gICAgLy8gQXZvaWQgY2xvc2UtYWN0aW9uIGNsaWNrIGZyb20gcmVkaXJlY3QgcGFnZSwgYW5kIGhpZGUgdG9vbHRpcFxyXG4gICAgLm9uKCdjbGljaycsICcucG9wdXAtdG9vbHRpcCAuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaGlkZVRvb2x0aXAoZSk7XHJcbiAgICB9KTtcclxuICAgIHVwZGF0ZSgpO1xyXG59XHJcbi8qKiBVcGRhdGUgZWxlbWVudHMgb24gdGhlIHBhZ2UgdG8gcmVmbGVjdCBjaGFuZ2VzIG9yIG5lZWQgZm9yIHRvb2x0aXBzXHJcbioqL1xyXG5mdW5jdGlvbiB1cGRhdGUoZWxlbWVudF9zZWxlY3Rvcikge1xyXG4gICAgLy8gUmV2aWV3IGV2ZXJ5IHBvcHVwIHRvb2x0aXAgdG8gcHJlcGFyZSBjb250ZW50IGFuZCBtYXJrL3VubWFyayB0aGUgbGluayBvciB0ZXh0OlxyXG4gICAgJChlbGVtZW50X3NlbGVjdG9yIHx8IHNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb24oJCh0aGlzKSk7XHJcbiAgICB9KTtcclxufVxyXG4vKiogQ3JlYXRlIHRvb2x0aXAgb24gZWxlbWVudCBieSBkZW1hbmRcclxuKiovXHJcbmZ1bmN0aW9uIGNyZWF0ZV90b29sdGlwKGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHZhciBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCB7XHJcbiAgICAgICAgdGl0bGU6ICcnXHJcbiAgICAgICAgLCBkZXNjcmlwdGlvbjogbnVsbFxyXG4gICAgICAgICwgdXJsOiBudWxsXHJcbiAgICAgICAgLCBpc19wb3B1cDogZmFsc2VcclxuICAgICAgICAsIHBlcnNpc3RlbnQ6IGZhbHNlXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoZWxlbWVudClcclxuICAgIC5hdHRyKCd0aXRsZScsIHNldHRpbmdzLnRpdGxlKVxyXG4gICAgLmRhdGEoJ2Rlc2NyaXB0aW9uJywgc2V0dGluZ3MuZGVzY3JpcHRpb24pXHJcbiAgICAuZGF0YSgncGVyc2lzdGVudC10b29sdGlwJywgc2V0dGluZ3MucGVyc2lzdGVudClcclxuICAgIC5hZGRDbGFzcyhzZXR0aW5ncy5pc19wb3B1cCA/ICdoYXMtcG9wdXAtdG9vbHRpcCcgOiAnaGFzLXRvb2x0aXAnKTtcclxuICAgIHVwZGF0ZShlbGVtZW50KTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgaW5pdFRvb2x0aXBzOiBpbml0LFxyXG4gICAgICAgIHVwZGF0ZVRvb2x0aXBzOiB1cGRhdGUsXHJcbiAgICAgICAgY3JlYXRlVG9vbHRpcDogY3JlYXRlX3Rvb2x0aXBcclxuICAgIH07XHJcbiIsIi8qIFNvbWUgdG9vbHMgZm9ybSBVUkwgbWFuYWdlbWVudFxyXG4qL1xyXG5leHBvcnRzLmdldFVSTFBhcmFtZXRlciA9IGZ1bmN0aW9uIGdldFVSTFBhcmFtZXRlcihuYW1lKSB7XHJcbiAgICByZXR1cm4gZGVjb2RlVVJJKFxyXG4gICAgICAgIChSZWdFeHAobmFtZSArICc9JyArICcoLis/KSgmfCQpJywgJ2knKS5leGVjKGxvY2F0aW9uLnNlYXJjaCkgfHwgWywgbnVsbF0pWzFdKTtcclxufTtcclxuZXhwb3J0cy5nZXRIYXNoQmFuZ1BhcmFtZXRlcnMgPSBmdW5jdGlvbiBnZXRIYXNoQmFuZ1BhcmFtZXRlcnMoaGFzaGJhbmd2YWx1ZSkge1xyXG4gICAgLy8gSGFzaGJhbmd2YWx1ZSBpcyBzb21ldGhpbmcgbGlrZTogVGhyZWFkLTFfTWVzc2FnZS0yXHJcbiAgICAvLyBXaGVyZSAnMScgaXMgdGhlIFRocmVhZElEIGFuZCAnMicgdGhlIG9wdGlvbmFsIE1lc3NhZ2VJRCwgb3Igb3RoZXIgcGFyYW1ldGVyc1xyXG4gICAgdmFyIHBhcnMgPSBoYXNoYmFuZ3ZhbHVlLnNwbGl0KCdfJyk7XHJcbiAgICB2YXIgdXJsUGFyYW1ldGVycyA9IHt9O1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIHBhcnN2YWx1ZXMgPSBwYXJzW2ldLnNwbGl0KCctJyk7XHJcbiAgICAgICAgaWYgKHBhcnN2YWx1ZXMubGVuZ3RoID09IDIpXHJcbiAgICAgICAgICAgIHVybFBhcmFtZXRlcnNbcGFyc3ZhbHVlc1swXV0gPSBwYXJzdmFsdWVzWzFdO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXJsUGFyYW1ldGVyc1twYXJzdmFsdWVzWzBdXSA9IHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdXJsUGFyYW1ldGVycztcclxufTtcclxuIiwiLyoqIFZhbGlkYXRpb24gbG9naWMgd2l0aCBsb2FkIGFuZCBzZXR1cCBvZiB2YWxpZGF0b3JzIGFuZCBcclxuICAgIHZhbGlkYXRpb24gcmVsYXRlZCB1dGlsaXRpZXNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCdtb2Rlcm5penInKTtcclxuXHJcbi8vIFVzaW5nIG9uIHNldHVwIGFzeW5jcm9ub3VzIGxvYWQgaW5zdGVhZCBvZiB0aGlzIHN0YXRpYy1saW5rZWQgbG9hZFxyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qcycpO1xyXG4vLyByZXF1aXJlKCdqcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLnVub2J0cnVzaXZlLm1pbi5qcycpO1xyXG5cclxuZnVuY3Rpb24gc2V0dXBWYWxpZGF0aW9uKHJlYXBwbHlPbmx5VG8pIHtcclxuICAgIHJlYXBwbHlPbmx5VG8gPSByZWFwcGx5T25seVRvIHx8IGRvY3VtZW50O1xyXG4gICAgaWYgKCF3aW5kb3cuanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkgd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSBmYWxzZTtcclxuICAgIGlmICghanF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCkge1xyXG4gICAgICAgIGpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIE1vZGVybml6ci5sb2FkKFtcclxuICAgICAgICAgICAgICAgIHsgbG9hZDogTGNVcmwuQXBwUGF0aCArIFwiU2NyaXB0cy9qcXVlcnkvanF1ZXJ5LnZhbGlkYXRlLm1pbi5qc1wiIH0sXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanNcIiB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBDaGVjayBmaXJzdCBpZiB2YWxpZGF0aW9uIGlzIGVuYWJsZWQgKGNhbiBoYXBwZW4gdGhhdCB0d2ljZSBpbmNsdWRlcyBvZlxyXG4gICAgICAgIC8vIHRoaXMgY29kZSBoYXBwZW4gYXQgc2FtZSBwYWdlLCBiZWluZyBleGVjdXRlZCB0aGlzIGNvZGUgYWZ0ZXIgZmlyc3QgYXBwZWFyYW5jZVxyXG4gICAgICAgIC8vIHdpdGggdGhlIHN3aXRjaCBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkIGNoYW5nZWRcclxuICAgICAgICAvLyBidXQgd2l0aG91dCB2YWxpZGF0aW9uIGJlaW5nIGFscmVhZHkgbG9hZGVkIGFuZCBlbmFibGVkKVxyXG4gICAgICAgIGlmICgkICYmICQudmFsaWRhdG9yICYmICQudmFsaWRhdG9yLnVub2J0cnVzaXZlKSB7XHJcbiAgICAgICAgICAgIC8vIEFwcGx5IHRoZSB2YWxpZGF0aW9uIHJ1bGVzIHRvIHRoZSBuZXcgZWxlbWVudHNcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd2YWxpZGF0b3InKTtcclxuICAgICAgICAgICAgJChyZWFwcGx5T25seVRvKS5yZW1vdmVEYXRhKCd1bm9idHJ1c2l2ZVZhbGlkYXRpb24nKTtcclxuICAgICAgICAgICAgJC52YWxpZGF0b3IudW5vYnRydXNpdmUucGFyc2UocmVhcHBseU9ubHlUbyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXRpZXMgKi9cclxuXHJcbi8qIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzIG9mIHRoZSB2YWxpZGF0aW9uIHN1bW1hcnlcclxuaW5jbHVkZWQgaW4gJ2NvbnRhaW5lcicgYW5kIHNldCBhcyB2YWxpZCB0aGUgc3VtbWFyeVxyXG4qL1xyXG5mdW5jdGlvbiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgICAkKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpXHJcbiAgICAuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS12YWxpZCcpXHJcbiAgICAuZmluZCgnPnVsPmxpJykucmVtb3ZlKCk7XHJcblxyXG4gICAgLy8gU2V0IGFsbCBmaWVsZHMgdmFsaWRhdGlvbiBpbnNpZGUgdGhpcyBmb3JtIChhZmZlY3RlZCBieSB0aGUgc3VtbWFyeSB0b28pXHJcbiAgICAvLyBhcyB2YWxpZCB0b29cclxuICAgICQoJy5maWVsZC12YWxpZGF0aW9uLWVycm9yJywgY29udGFpbmVyKVxyXG4gICAgLnJlbW92ZUNsYXNzKCdmaWVsZC12YWxpZGF0aW9uLWVycm9yJylcclxuICAgIC5hZGRDbGFzcygnZmllbGQtdmFsaWRhdGlvbi12YWxpZCcpXHJcbiAgICAudGV4dCgnJyk7XHJcblxyXG4gICAgLy8gUmUtYXBwbHkgc2V0dXAgdmFsaWRhdGlvbiB0byBlbnN1cmUgaXMgd29ya2luZywgYmVjYXVzZSBqdXN0IGFmdGVyIGEgc3VjY2Vzc2Z1bFxyXG4gICAgLy8gdmFsaWRhdGlvbiwgYXNwLm5ldCB1bm9idHJ1c2l2ZSB2YWxpZGF0aW9uIHN0b3BzIHdvcmtpbmcgb24gY2xpZW50LXNpZGUuXHJcbiAgICBMQy5zZXR1cFZhbGlkYXRpb24oKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGNvbnRhaW5lcikge1xyXG4gIHZhciB2ID0gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcik7XHJcbiAgdi5hZGRDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpLnJlbW92ZUNsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ29Ub1N1bW1hcnlFcnJvcnMoZm9ybSkge1xyXG4gICAgdmFyIG9mZiA9IGZvcm0uZmluZCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5vZmZzZXQoKTtcclxuICAgIGlmIChvZmYpXHJcbiAgICAgICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBvZmYudG9wIH0sIDUwMCk7XHJcbiAgICBlbHNlXHJcbiAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignZ29Ub1N1bW1hcnlFcnJvcnM6IG5vIHN1bW1hcnkgdG8gZm9jdXMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZFZhbGlkYXRpb25TdW1tYXJ5KGNvbnRhaW5lcikge1xyXG4gIGNvbnRhaW5lciA9IGNvbnRhaW5lciB8fCBkb2N1bWVudDtcclxuICByZXR1cm4gJCgnW2RhdGEtdmFsbXNnLXN1bW1hcnk9dHJ1ZV0nKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBzZXR1cDogc2V0dXBWYWxpZGF0aW9uLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQsXHJcbiAgICBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3I6IHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcixcclxuICAgIGdvVG9TdW1tYXJ5RXJyb3JzOiBnb1RvU3VtbWFyeUVycm9ycyxcclxuICAgIGZpbmRWYWxpZGF0aW9uU3VtbWFyeTogZmluZFZhbGlkYXRpb25TdW1tYXJ5XHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIEFjY291bnQgcGFnZXMgKGRlZmF1bHQgbGlua3MgYmVoYXZpb3IgaXMgdG8gb3BlbiBpbiBhIG5ldyB0YWIpXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5lbmFibGUgPSBmdW5jdGlvbiAoYmFzZVVybCkge1xyXG4gICAgJChkb2N1bWVudClcclxuICAgIC5vbignY2xpY2snLCAnYS5sb2dpbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArICdBY2NvdW50LyRMb2dpbi8/UmV0dXJuVXJsPScgKyBlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5yZWdpc3RlcicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdXJsID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKS5yZXBsYWNlKCcvQWNjb3VudC9SZWdpc3RlcicsICcvQWNjb3VudC8kUmVnaXN0ZXInKTtcclxuICAgICAgICBwb3B1cCh1cmwsIHsgd2lkdGg6IDQ1MCwgaGVpZ2h0OiA1MDAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnYS5mb3Jnb3QtcGFzc3dvcmQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykucmVwbGFjZSgnL0FjY291bnQvRm9yZ290UGFzc3dvcmQnLCAnL0FjY291bnQvJEZvcmdvdFBhc3N3b3JkJyk7XHJcbiAgICAgICAgcG9wdXAodXJsLCB7IHdpZHRoOiA0MDAsIGhlaWdodDogMjQwIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJ2EuY2hhbmdlLXBhc3N3b3JkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB1cmwgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpLnJlcGxhY2UoJy9BY2NvdW50L0NoYW5nZVBhc3N3b3JkJywgJy9BY2NvdW50LyRDaGFuZ2VQYXNzd29yZCcpO1xyXG4gICAgICAgIHBvcHVwKHVybCwgeyB3aWR0aDogNDUwLCBoZWlnaHQ6IDM0MCB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufTsiLCIvLyBPVVIgbmFtZXNwYWNlIChhYmJyZXZpYXRlZCBMb2Nvbm9taWNzKVxyXG53aW5kb3cuTEMgPSB3aW5kb3cuTEMgfHwge307XHJcblxyXG4vLyBUT0RPIFJldmlldyBMY1VybCB1c2UgYXJvdW5kIGFsbCB0aGUgbW9kdWxlcywgdXNlIERJIHdoZW5ldmVyIHBvc3NpYmxlIChpbml0L3NldHVwIG1ldGhvZCBvciBpbiB1c2UgY2FzZXMpXHJcbi8vIGJ1dCBvbmx5IGZvciB0aGUgd2FudGVkIGJhc2VVcmwgb24gZWFjaCBjYXNlIGFuZCBub3QgcGFzcyBhbGwgdGhlIExjVXJsIG9iamVjdC5cclxuLy8gTGNVcmwgaXMgc2VydmVyLXNpZGUgZ2VuZXJhdGVkIGFuZCB3cm90ZSBpbiBhIExheW91dCBzY3JpcHQtdGFnLlxyXG5cclxuLy8gR2xvYmFsIHNldHRpbmdzXHJcbndpbmRvdy5nTG9hZGluZ1JldGFyZCA9IDMwMDtcclxuXHJcbi8qKipcclxuICoqIExvYWRpbmcgbW9kdWxlc1xyXG4qKiovXHJcbi8vVE9ETzogQ2xlYW4gZGVwZW5kZW5jaWVzLCByZW1vdmUgYWxsIHRoYXQgbm90IHVzZWQgZGlyZWN0bHkgaW4gdGhpcyBmaWxlLCBhbnkgb3RoZXIgZmlsZVxyXG4vLyBvciBwYWdlIG11c3QgcmVxdWlyZSBpdHMgZGVwZW5kZW5jaWVzLlxyXG5cclxud2luZG93LkxjVXJsID0gcmVxdWlyZSgnLi4vTEMvTGNVcmwnKTtcclxuXHJcbi8qIGpRdWVyeSwgc29tZSB2ZW5kb3IgcGx1Z2lucyAoZnJvbSBidW5kbGUpIGFuZCBvdXIgYWRkaXRpb25zIChzbWFsbCBwbHVnaW5zKSwgdGhleSBhcmUgYXV0b21hdGljYWxseSBwbHVnLWVkIG9uIHJlcXVpcmUgKi9cclxudmFyICQgPSB3aW5kb3cuJCA9IHdpbmRvdy5qUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5Lmhhc1Njcm9sbEJhcicpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmEtaGFzaGNoYW5nZScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG5yZXF1aXJlKCcuLi9MQy9qcXVlcnkuYXJlJyk7XHJcbi8vIE1hc2tlZCBpbnB1dCwgZm9yIGRhdGVzIC1hdCBteS1hY2NvdW50LS5cclxucmVxdWlyZSgnanF1ZXJ5LmZvcm1hdHRlcicpO1xyXG5cclxuLy8gR2VuZXJhbCBjYWxsYmFja3MgZm9yIEFKQVggZXZlbnRzIHdpdGggY29tbW9uIGxvZ2ljXHJcbnZhciBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnLi4vTEMvYWpheENhbGxiYWNrcycpO1xyXG4vLyBGb3JtLmFqYXggbG9naWMgYW5kIG1vcmUgc3BlY2lmaWMgY2FsbGJhY2tzIGJhc2VkIG9uIGFqYXhDYWxsYmFja3NcclxudmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3tURU1QICBvbGQgYWxpYXNcclxud2luZG93LmFqYXhGb3Jtc1N1Y2Nlc3NIYW5kbGVyID0gYWpheEZvcm1zLm9uU3VjY2Vzcztcclxud2luZG93LmFqYXhFcnJvclBvcHVwSGFuZGxlciA9IGFqYXhGb3Jtcy5vbkVycm9yO1xyXG53aW5kb3cuYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyID0gYWpheEZvcm1zLm9uQ29tcGxldGU7XHJcbi8vfVxyXG5cclxuLyogUmVsb2FkICovXHJcbnJlcXVpcmUoJy4uL0xDL2pxdWVyeS5yZWxvYWQnKTtcclxuJC5mbi5yZWxvYWQuZGVmYXVsdHMgPSB7XHJcbiAgICBzdWNjZXNzOiBbYWpheEZvcm1zLm9uU3VjY2Vzc10sXHJcbiAgICBlcnJvcjogW2FqYXhGb3Jtcy5vbkVycm9yXSxcclxuICAgIGRlbGF5OiBnTG9hZGluZ1JldGFyZFxyXG59O1xyXG5cclxuTEMubW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuLi9MQy9tb3ZlRm9jdXNUbycpO1xyXG4vKiBEaXNhYmxlZCBiZWNhdXNlIGNvbmZsaWN0cyB3aXRoIHRoZSBtb3ZlRm9jdXNUbyBvZiBcclxuICBhamF4Rm9ybS5vbnN1Y2Nlc3MsIGl0IGhhcHBlbnMgYSBibG9jay5sb2FkaW5nIGp1c3QgYWZ0ZXJcclxuICB0aGUgc3VjY2VzcyBoYXBwZW5zLlxyXG4kLmJsb2NrVUkuZGVmYXVsdHMub25CbG9jayA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFNjcm9sbCB0byBibG9jay1tZXNzYWdlIHRvIGRvbid0IGxvc3QgaW4gbGFyZ2UgcGFnZXM6XHJcbiAgICBMQy5tb3ZlRm9jdXNUbyh0aGlzKTtcclxufTsqL1xyXG5cclxudmFyIGxvYWRlciA9IHJlcXVpcmUoJy4uL0xDL2xvYWRlcicpO1xyXG5MQy5sb2FkID0gbG9hZGVyLmxvYWQ7XHJcblxyXG52YXIgYmxvY2tzID0gTEMuYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi4vTEMvYmxvY2tQcmVzZXRzJyk7XHJcbi8ve1RFTVBcclxud2luZG93LmxvYWRpbmdCbG9jayA9IGJsb2Nrcy5sb2FkaW5nO1xyXG53aW5kb3cuaW5mb0Jsb2NrID0gYmxvY2tzLmluZm87XHJcbndpbmRvdy5lcnJvckJsb2NrID0gYmxvY2tzLmVycm9yO1xyXG4vL31cclxuXHJcbkFycmF5LnJlbW92ZSA9IHJlcXVpcmUoJy4uL0xDL0FycmF5LnJlbW92ZScpO1xyXG5yZXF1aXJlKCcuLi9MQy9TdHJpbmcucHJvdG90eXBlLmNvbnRhaW5zJyk7XHJcblxyXG5MQy5nZXRUZXh0ID0gcmVxdWlyZSgnLi4vTEMvZ2V0VGV4dCcpO1xyXG5cclxudmFyIFRpbWVTcGFuID0gTEMudGltZVNwYW4gPSByZXF1aXJlKCcuLi9MQy9UaW1lU3BhbicpO1xyXG52YXIgdGltZVNwYW5FeHRyYSA9IHJlcXVpcmUoJy4uL0xDL1RpbWVTcGFuRXh0cmEnKTtcclxudGltZVNwYW5FeHRyYS5wbHVnSW4oVGltZVNwYW4pO1xyXG4vL3tURU1QICBvbGQgYWxpYXNlc1xyXG5MQy5zbWFydFRpbWUgPSB0aW1lU3BhbkV4dHJhLnNtYXJ0VGltZTtcclxuTEMucm91bmRUaW1lVG9RdWFydGVySG91ciA9IHRpbWVTcGFuRXh0cmEucm91bmRUb1F1YXJ0ZXJIb3VyO1xyXG4vL31cclxuXHJcbkxDLkNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCcuLi9MQy9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbndpbmRvdy5UYWJiZWRVWCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYJyk7XHJcbnZhciBzbGlkZXJUYWJzID0gcmVxdWlyZSgnLi4vTEMvVGFiYmVkVVguc2xpZGVyVGFicycpO1xyXG5cclxuLy8gUG9wdXAgQVBJc1xyXG53aW5kb3cuc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuLi9MQy9zbW9vdGhCb3hCbG9jaycpO1xyXG5cclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi4vTEMvcG9wdXAnKTtcclxuLy97VEVNUFxyXG52YXIgcG9wdXBTdHlsZSA9IHBvcHVwLnN0eWxlLFxyXG4gICAgcG9wdXBTaXplID0gcG9wdXAuc2l6ZTtcclxuTEMubWVzc2FnZVBvcHVwID0gcG9wdXAubWVzc2FnZTtcclxuTEMuY29ubmVjdFBvcHVwQWN0aW9uID0gcG9wdXAuY29ubmVjdEFjdGlvbjtcclxud2luZG93LnBvcHVwID0gcG9wdXA7XHJcbi8vfVxyXG5cclxuTEMuc2FuaXRpemVXaGl0ZXNwYWNlcyA9IHJlcXVpcmUoJy4uL0xDL3Nhbml0aXplV2hpdGVzcGFjZXMnKTtcclxuLy97VEVNUCAgIGFsaWFzIGJlY2F1c2UgbWlzc3BlbGxpbmdcclxuTEMuc2FuaXRpemVXaGl0ZXBhY2VzID0gTEMuc2FuaXRpemVXaGl0ZXNwYWNlcztcclxuLy99XHJcblxyXG5MQy5nZXRYUGF0aCA9IHJlcXVpcmUoJy4uL0xDL2dldFhQYXRoJyk7XHJcblxyXG52YXIgc3RyaW5nRm9ybWF0ID0gcmVxdWlyZSgnLi4vTEMvU3RyaW5nRm9ybWF0Jyk7XHJcblxyXG4vLyBFeHBhbmRpbmcgZXhwb3J0ZWQgdXRpbGl0ZXMgZnJvbSBtb2R1bGVzIGRpcmVjdGx5IGFzIExDIG1lbWJlcnM6XHJcbiQuZXh0ZW5kKExDLCByZXF1aXJlKCcuLi9MQy9QcmljZScpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL21hdGhVdGlscycpKTtcclxuJC5leHRlbmQoTEMsIHJlcXVpcmUoJy4uL0xDL251bWJlclV0aWxzJykpO1xyXG4kLmV4dGVuZChMQywgcmVxdWlyZSgnLi4vTEMvdG9vbHRpcHMnKSk7XHJcbnZhciBpMThuID0gTEMuaTE4biA9IHJlcXVpcmUoJy4uL0xDL2kxOG4nKTtcclxuLy97VEVNUCBvbGQgYWxpc2VzIG9uIExDIGFuZCBnbG9iYWxcclxuJC5leHRlbmQoTEMsIGkxOG4pO1xyXG4kLmV4dGVuZCh3aW5kb3csIGkxOG4pO1xyXG4vL31cclxuXHJcbi8vIHh0c2g6IHBsdWdlZCBpbnRvIGpxdWVyeSBhbmQgcGFydCBvZiBMQ1xyXG52YXIgeHRzaCA9IHJlcXVpcmUoJy4uL0xDL2pxdWVyeS54dHNoJyk7XHJcbnh0c2gucGx1Z0luKCQpO1xyXG4vL3tURU1QICAgcmVtb3ZlIG9sZCBMQy4qIGFsaWFzXHJcbiQuZXh0ZW5kKExDLCB4dHNoKTtcclxuZGVsZXRlIExDLnBsdWdJbjtcclxuLy99XHJcblxyXG52YXIgYXV0b0NhbGN1bGF0ZSA9IExDLmF1dG9DYWxjdWxhdGUgPSByZXF1aXJlKCcuLi9MQy9hdXRvQ2FsY3VsYXRlJyk7XHJcbi8ve1RFTVAgICByZW1vdmUgb2xkIGFsaWFzIHVzZVxyXG52YXIgbGNTZXR1cENhbGN1bGF0ZVRhYmxlSXRlbXNUb3RhbHMgPSBhdXRvQ2FsY3VsYXRlLm9uVGFibGVJdGVtcztcclxuTEMuc2V0dXBDYWxjdWxhdGVTdW1tYXJ5ID0gYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnk7XHJcbkxDLnVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnkgPSBhdXRvQ2FsY3VsYXRlLnVwZGF0ZURldGFpbGVkUHJpY2luZ1N1bW1hcnk7XHJcbkxDLnNldHVwVXBkYXRlRGV0YWlsZWRQcmljaW5nU3VtbWFyeSA9IGF1dG9DYWxjdWxhdGUub25EZXRhaWxlZFByaWNpbmdTdW1tYXJ5O1xyXG4vL31cclxuXHJcbnZhciBDb29raWUgPSBMQy5Db29raWUgPSByZXF1aXJlKCcuLi9MQy9Db29raWUnKTtcclxuLy97VEVNUCAgICBvbGQgYWxpYXNcclxudmFyIGdldENvb2tpZSA9IENvb2tpZS5nZXQsXHJcbiAgICBzZXRDb29raWUgPSBDb29raWUuc2V0O1xyXG4vL31cclxuXHJcbkxDLmRhdGVQaWNrZXIgPSByZXF1aXJlKCcuLi9MQy9kYXRlUGlja2VyJyk7XHJcbi8ve1RFTVAgICBvbGQgYWxpYXNcclxud2luZG93LnNldHVwRGF0ZVBpY2tlciA9IExDLnNldHVwRGF0ZVBpY2tlciA9IExDLmRhdGVQaWNrZXIuaW5pdDtcclxud2luZG93LmFwcGx5RGF0ZVBpY2tlciA9IExDLmFwcGx5RGF0ZVBpY2tlciA9IExDLmRhdGVQaWNrZXIuYXBwbHk7XHJcbi8vfVxyXG5cclxuTEMuYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi4vTEMvYXV0b0ZvY3VzJyk7XHJcblxyXG4vLyBDUlVETFxyXG52YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbkxDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG5cclxuLy8gVUkgU2xpZGVyIExhYmVsc1xyXG52YXIgc2xpZGVyTGFiZWxzID0gcmVxdWlyZSgnLi4vTEMvVUlTbGlkZXJMYWJlbHMnKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbkxDLmNyZWF0ZUxhYmVsc0ZvclVJU2xpZGVyID0gc2xpZGVyTGFiZWxzLmNyZWF0ZTtcclxuTEMudXBkYXRlTGFiZWxzRm9yVUlTbGlkZXIgPSBzbGlkZXJMYWJlbHMudXBkYXRlO1xyXG5MQy51aVNsaWRlckxhYmVsc0xheW91dHMgPSBzbGlkZXJMYWJlbHMubGF5b3V0cztcclxuLy99XHJcblxyXG52YXIgdmFsaWRhdGlvbkhlbHBlciA9IHJlcXVpcmUoJy4uL0xDL3ZhbGlkYXRpb25IZWxwZXInKTtcclxuLy97VEVNUCAgb2xkIGFsaWFzXHJcbkxDLnNldHVwVmFsaWRhdGlvbiA9IHZhbGlkYXRpb25IZWxwZXIuc2V0dXA7XHJcbkxDLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZCA9IHZhbGlkYXRpb25IZWxwZXIuc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkO1xyXG5MQy5nb1RvU3VtbWFyeUVycm9ycyA9IHZhbGlkYXRpb25IZWxwZXIuZ29Ub1N1bW1hcnlFcnJvcnM7XHJcbi8vfVxyXG5cclxuTEMucGxhY2VIb2xkZXIgPSByZXF1aXJlKCcuLi9MQy9wbGFjZWhvbGRlci1wb2x5ZmlsbCcpLmluaXQ7XHJcblxyXG5MQy5tYXBSZWFkeSA9IHJlcXVpcmUoJy4uL0xDL2dvb2dsZU1hcFJlYWR5Jyk7XHJcblxyXG53aW5kb3cuaXNFbXB0eVN0cmluZyA9IHJlcXVpcmUoJy4uL0xDL2lzRW1wdHlTdHJpbmcnKTtcclxuXHJcbndpbmRvdy5ndWlkR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vTEMvZ3VpZEdlbmVyYXRvcicpO1xyXG5cclxudmFyIHVybFV0aWxzID0gcmVxdWlyZSgnLi4vTEMvdXJsVXRpbHMnKTtcclxud2luZG93LmdldFVSTFBhcmFtZXRlciA9IHVybFV0aWxzLmdldFVSTFBhcmFtZXRlcjtcclxud2luZG93LmdldEhhc2hCYW5nUGFyYW1ldGVycyA9IHVybFV0aWxzLmdldEhhc2hCYW5nUGFyYW1ldGVycztcclxuXHJcbnZhciBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9kYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcnKTtcclxuLy97VEVNUFxyXG5MQy5kYXRlVG9JbnRlcmNoYW5nbGVTdHJpbmcgPSBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmc7XHJcbi8vfVxyXG5cclxuLy8gUGFnZXMgaW4gcG9wdXBcclxudmFyIHdlbGNvbWVQb3B1cCA9IHJlcXVpcmUoJy4vd2VsY29tZVBvcHVwJyk7XHJcbi8vdmFyIHRha2VBVG91clBvcHVwID0gcmVxdWlyZSgndGFrZUFUb3VyUG9wdXAnKTtcclxudmFyIGZhcXNQb3B1cHMgPSByZXF1aXJlKCcuL2ZhcXNQb3B1cHMnKTtcclxudmFyIGFjY291bnRQb3B1cHMgPSByZXF1aXJlKCcuL2FjY291bnRQb3B1cHMnKTtcclxudmFyIGxlZ2FsUG9wdXBzID0gcmVxdWlyZSgnLi9sZWdhbFBvcHVwcycpO1xyXG5cclxuLy8gT2xkIGF2YWlsYWJsaXR5IGNhbGVuZGFyXHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldCA9IHJlcXVpcmUoJy4vYXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQnKTtcclxuLy8gTmV3IGF2YWlsYWJpbGl0eSBjYWxlbmRhclxyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXIgPSByZXF1aXJlKCcuLi9MQy9hdmFpbGFiaWxpdHlDYWxlbmRhcicpO1xyXG5cclxudmFyIGF1dG9maWxsU3VibWVudSA9IHJlcXVpcmUoJy4uL0xDL2F1dG9maWxsU3VibWVudScpO1xyXG5cclxudmFyIHRhYmJlZFdpemFyZCA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLndpemFyZCcpO1xyXG5cclxudmFyIGhhc0NvbmZpcm1TdXBwb3J0ID0gcmVxdWlyZSgnLi4vTEMvaGFzQ29uZmlybVN1cHBvcnQnKTtcclxuXHJcbnZhciBwb3N0YWxDb2RlVmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4uL0xDL3Bvc3RhbENvZGVTZXJ2ZXJWYWxpZGF0aW9uJyk7XHJcblxyXG52YXIgdGFiYmVkTm90aWZpY2F0aW9ucyA9IHJlcXVpcmUoJy4uL0xDL1RhYmJlZFVYLmNoYW5nZXNOb3RpZmljYXRpb24nKTtcclxuXHJcbnZhciB0YWJzQXV0b2xvYWQgPSByZXF1aXJlKCcuLi9MQy9UYWJiZWRVWC5hdXRvbG9hZCcpO1xyXG5cclxudmFyIGhvbWVQYWdlID0gcmVxdWlyZSgnLi9ob21lJyk7XHJcblxyXG4vL3tURU1QIHJlbW92ZSBnbG9iYWwgZGVwZW5kZW5jeSBmb3IgdGhpc1xyXG53aW5kb3cuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4uL0xDL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuLy99XHJcblxyXG4vKipcclxuICoqIEluaXQgY29kZVxyXG4qKiovXHJcbiQod2luZG93KS5sb2FkKGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIERpc2FibGUgYnJvd3NlciBiZWhhdmlvciB0byBhdXRvLXNjcm9sbCB0byB1cmwgZnJhZ21lbnQvaGFzaCBlbGVtZW50IHBvc2l0aW9uOlxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7ICQoJ2h0bWwsYm9keScpLnNjcm9sbFRvcCgwKTsgfSwgMSk7XHJcbn0pO1xyXG4kKGZ1bmN0aW9uICgpIHtcclxuICAvLyBQbGFjZWhvbGRlciBwb2x5ZmlsbFxyXG4gIExDLnBsYWNlSG9sZGVyKCk7XHJcblxyXG4gIC8vIEF1dG9mb2N1cyBwb2x5ZmlsbFxyXG4gIExDLmF1dG9Gb2N1cygpO1xyXG5cclxuICAvLyBHZW5lcmljIHNjcmlwdCBmb3IgZW5oYW5jZWQgdG9vbHRpcHMgYW5kIGVsZW1lbnQgZGVzY3JpcHRpb25zXHJcbiAgTEMuaW5pdFRvb2x0aXBzKCk7XHJcblxyXG4gIGFqYXhGb3Jtcy5pbml0KCk7XHJcblxyXG4gIC8vdGFrZUFUb3VyUG9wdXAuc2hvdygpO1xyXG4gIHdlbGNvbWVQb3B1cC5zaG93KCk7XHJcbiAgLy8gRW5hYmxlIHRoZSB1c2Ugb2YgcG9wdXBzIGZvciBzb21lIGxpbmtzIHRoYXQgYnkgZGVmYXVsdCBvcGVuIGEgbmV3IHRhYjpcclxuICBmYXFzUG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcbiAgYWNjb3VudFBvcHVwcy5lbmFibGUoTGNVcmwuTGFuZ1BhdGgpO1xyXG4gIGxlZ2FsUG9wdXBzLmVuYWJsZShMY1VybC5MYW5nUGF0aCk7XHJcblxyXG4gIC8vIE9sZCBhdmFpbGFiaWxpdHkgY2FsZW5kYXJcclxuICBhdmFpbGFiaWxpdHlDYWxlbmRhcldpZGdldC5pbml0KExjVXJsLkxhbmdQYXRoKTtcclxuICAvLyBOZXcgYXZhaWxhYmlsaXR5IGNhbGVuZGFyXHJcbiAgYXZhaWxhYmlsaXR5Q2FsZW5kYXIub24oKTtcclxuXHJcbiAgcG9wdXAuY29ubmVjdEFjdGlvbigpO1xyXG5cclxuICAvLyBEYXRlIFBpY2tlclxyXG4gIExDLmRhdGVQaWNrZXIuaW5pdCgpO1xyXG5cclxuICAvKiBBdXRvIGNhbGN1bGF0ZSB0YWJsZSBpdGVtcyB0b3RhbCAocXVhbnRpdHkqdW5pdHByaWNlPWl0ZW0tdG90YWwpIHNjcmlwdCAqL1xyXG4gIGF1dG9DYWxjdWxhdGUub25UYWJsZUl0ZW1zKCk7XHJcbiAgYXV0b0NhbGN1bGF0ZS5vblN1bW1hcnkoKTtcclxuXHJcbiAgaGFzQ29uZmlybVN1cHBvcnQub24oKTtcclxuXHJcbiAgcG9zdGFsQ29kZVZhbGlkYXRpb24uaW5pdCh7IGJhc2VVcmw6IExjVXJsLkxhbmdQYXRoIH0pO1xyXG5cclxuICAvLyBUYWJiZWQgaW50ZXJmYWNlXHJcbiAgdGFic0F1dG9sb2FkLmluaXQoVGFiYmVkVVgpO1xyXG4gIFRhYmJlZFVYLmluaXQoKTtcclxuICBUYWJiZWRVWC5mb2N1c0N1cnJlbnRMb2NhdGlvbigpO1xyXG4gIFRhYmJlZFVYLmNoZWNrVm9sYXRpbGVUYWJzKCk7XHJcbiAgc2xpZGVyVGFicy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgdGFiYmVkV2l6YXJkLmluaXQoVGFiYmVkVVgsIHtcclxuICAgIGxvYWRpbmdEZWxheTogZ0xvYWRpbmdSZXRhcmRcclxuICB9KTtcclxuXHJcbiAgdGFiYmVkTm90aWZpY2F0aW9ucy5pbml0KFRhYmJlZFVYKTtcclxuXHJcbiAgYXV0b2ZpbGxTdWJtZW51KCk7XHJcblxyXG4gIC8vIFRPRE86ICdsb2FkSGFzaEJhbmcnIGN1c3RvbSBldmVudCBpbiB1c2U/XHJcbiAgLy8gSWYgdGhlIGhhc2ggdmFsdWUgZm9sbG93IHRoZSAnaGFzaCBiYW5nJyBjb252ZW50aW9uLCBsZXQgb3RoZXJcclxuICAvLyBzY3JpcHRzIGRvIHRoZWlyIHdvcmsgdGhyb3VnaHQgYSAnbG9hZEhhc2hCYW5nJyBldmVudCBoYW5kbGVyXHJcbiAgaWYgKC9eIyEvLnRlc3Qod2luZG93LmxvY2F0aW9uLmhhc2gpKVxyXG4gICAgJChkb2N1bWVudCkudHJpZ2dlcignbG9hZEhhc2hCYW5nJywgd2luZG93LmxvY2F0aW9uLmhhc2guc3Vic3RyaW5nKDEpKTtcclxuXHJcbiAgLy8gUmVsb2FkIGJ1dHRvbnNcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnLnJlbG9hZC1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBHZW5lcmljIGFjdGlvbiB0byBjYWxsIGxjLmpxdWVyeSAncmVsb2FkJyBmdW5jdGlvbiBmcm9tIGFuIGVsZW1lbnQgaW5zaWRlIGl0c2VsZi5cclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAkdC5jbG9zZXN0KCR0LmRhdGEoJ3JlbG9hZC10YXJnZXQnKSkucmVsb2FkKCk7XHJcbiAgfSk7XHJcblxyXG4gIC8qIEVuYWJsZSBmb2N1cyB0YWIgb24gZXZlcnkgaGFzaCBjaGFuZ2UsIG5vdyB0aGVyZSBhcmUgdHdvIHNjcmlwdHMgbW9yZSBzcGVjaWZpYyBmb3IgdGhpczpcclxuICAqIG9uZSB3aGVuIHBhZ2UgbG9hZCAod2hlcmU/KSxcclxuICAqIGFuZCBhbm90aGVyIG9ubHkgZm9yIGxpbmtzIHdpdGggJ3RhcmdldC10YWInIGNsYXNzLlxyXG4gICogTmVlZCBiZSBzdHVkeSBpZiBzb21ldGhpbmcgb2YgdGhlcmUgbXVzdCBiZSByZW1vdmVkIG9yIGNoYW5nZWQuXHJcbiAgKiBUaGlzIGlzIG5lZWRlZCBmb3Igb3RoZXIgYmVoYXZpb3JzIHRvIHdvcmsuICovXHJcbiAgLy8gT24gdGFyZ2V0LXRhYiBsaW5rc1xyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhLnRhcmdldC10YWInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgdGhlcmVJc1RhYiA9IFRhYmJlZFVYLmdldFRhYigkKHRoaXMpLmF0dHIoJ2hyZWYnKSk7XHJcbiAgICBpZiAodGhlcmVJc1RhYikge1xyXG4gICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIC8vIE9uIGhhc2ggY2hhbmdlXHJcbiAgaWYgKCQuZm4uaGFzaGNoYW5nZSlcclxuICAgICQod2luZG93KS5oYXNoY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgaWYgKCEvXiMhLy50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICAgICAgdmFyIHRoZXJlSXNUYWIgPSBUYWJiZWRVWC5nZXRUYWIobG9jYXRpb24uaGFzaCk7XHJcbiAgICAgICAgaWYgKHRoZXJlSXNUYWIpXHJcbiAgICAgICAgICBUYWJiZWRVWC5mb2N1c1RhYih0aGVyZUlzVGFiKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIC8vIEhPTUUgUEFHRSAvIFNFQVJDSCBTVFVGRlxyXG4gIGhvbWVQYWdlLmluaXQoKTtcclxuXHJcbiAgLy8gVmFsaWRhdGlvbiBhdXRvIHNldHVwIGZvciBwYWdlIHJlYWR5IGFuZCBhZnRlciBldmVyeSBhamF4IHJlcXVlc3RcclxuICAvLyBpZiB0aGVyZSBpcyBhbG1vc3Qgb25lIGZvcm0gaW4gdGhlIHBhZ2UuXHJcbiAgLy8gVGhpcyBhdm9pZCB0aGUgbmVlZCBmb3IgZXZlcnkgcGFnZSB3aXRoIGZvcm0gdG8gZG8gdGhlIHNldHVwIGl0c2VsZlxyXG4gIC8vIGFsbW9zdCBmb3IgbW9zdCBvZiB0aGUgY2FzZS5cclxuICBmdW5jdGlvbiBhdXRvU2V0dXBWYWxpZGF0aW9uKCkge1xyXG4gICAgaWYgKCQoZG9jdW1lbnQpLmhhcygnZm9ybScpLmxlbmd0aClcclxuICAgICAgdmFsaWRhdGlvbkhlbHBlci5zZXR1cCgnZm9ybScpO1xyXG4gIH1cclxuICBhdXRvU2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgJChkb2N1bWVudCkuYWpheENvbXBsZXRlKGF1dG9TZXR1cFZhbGlkYXRpb24pO1xyXG5cclxuICAvLyBUT0RPOiB1c2VkIHNvbWUgdGltZT8gc3RpbGwgcmVxdWlyZWQgdXNpbmcgbW9kdWxlcz9cclxuICAvKlxyXG4gICogQ29tbXVuaWNhdGUgdGhhdCBzY3JpcHQuanMgaXMgcmVhZHkgdG8gYmUgdXNlZFxyXG4gICogYW5kIHRoZSBjb21tb24gTEMgbGliIHRvby5cclxuICAqIEJvdGggYXJlIGVuc3VyZWQgdG8gYmUgcmFpc2VkIGV2ZXIgYWZ0ZXIgcGFnZSBpcyByZWFkeSB0b28uXHJcbiAgKi9cclxuICAkKGRvY3VtZW50KVxyXG4gICAgLnRyaWdnZXIoJ2xjU2NyaXB0UmVhZHknKVxyXG4gICAgLnRyaWdnZXIoJ2xjTGliUmVhZHknKTtcclxufSk7IiwiLyoqKioqIEFWQUlMQUJJTElUWSBDQUxFTkRBUiBXSURHRVQgKioqKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4uL0xDL3Ntb290aEJveEJsb2NrJyksXHJcbiAgICBkYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcgPSByZXF1aXJlKCcuLi9MQy9kYXRlVG9JbnRlcmNoYW5nZWFibGVTdHJpbmcnKTtcclxucmVxdWlyZSgnLi4vTEMvanF1ZXJ5LnJlbG9hZCcpO1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEF2YWlsYWJpbGl0eUNhbGVuZGFyV2lkZ2V0KGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICcuY2FsZW5kYXItY29udHJvbHMgLmFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIGlmICgkdC5oYXNDbGFzcygnem9vbS1hY3Rpb24nKSkge1xyXG4gICAgICAgICAgICAvLyBEbyB6b29tXHJcbiAgICAgICAgICAgIHZhciBjID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpLmZpbmQoJy5jYWxlbmRhcicpLmNsb25lKCk7XHJcbiAgICAgICAgICAgIGMuY3NzKCdmb250LXNpemUnLCAnMnB4Jyk7XHJcbiAgICAgICAgICAgIHZhciB0YWIgPSAkdC5jbG9zZXN0KCcudGFiLWJvZHknKTtcclxuICAgICAgICAgICAgYy5kYXRhKCdwb3B1cC1jb250YWluZXInLCB0YWIpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGMsIHRhYiwgJ2F2YWlsYWJpbGl0eS1jYWxlbmRhcicsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIC8vIE5vdGhpbmcgbW9yZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5hdmlnYXRlIGNhbGVuZGFyXHJcbiAgICAgICAgdmFyIG5leHQgPSAkdC5oYXNDbGFzcygnbmV4dC13ZWVrLWFjdGlvbicpO1xyXG4gICAgICAgIHZhciBjb250ID0gJHQuY2xvc2VzdCgnLmF2YWlsYWJpbGl0eS1jYWxlbmRhcicpO1xyXG4gICAgICAgIHZhciBjYWxjb250ID0gY29udC5jaGlsZHJlbignLmNhbGVuZGFyLWNvbnRhaW5lcicpO1xyXG4gICAgICAgIHZhciBjYWwgPSBjYWxjb250LmNoaWxkcmVuKCcuY2FsZW5kYXInKTtcclxuICAgICAgICB2YXIgY2FsaW5mbyA9IGNvbnQuZmluZCgnLmNhbGVuZGFyLWluZm8nKTtcclxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKGNhbC5kYXRhKCdzaG93ZWQtZGF0ZScpKTtcclxuICAgICAgICB2YXIgdXNlcklkID0gY2FsLmRhdGEoJ3VzZXItaWQnKTtcclxuICAgICAgICBpZiAobmV4dClcclxuICAgICAgICAgICAgZGF0ZS5zZXREYXRlKGRhdGUuZ2V0RGF0ZSgpICsgNyk7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgLSA3KTtcclxuICAgICAgICB2YXIgc3RyZGF0ZSA9IGRhdGVUb0ludGVyY2hhbmdlYWJsZVN0cmluZyhkYXRlKTtcclxuICAgICAgICB2YXIgdXJsID0gYmFzZVVybCArIFwiUHJvZmlsZS8kQXZhaWxhYmlsaXR5Q2FsZW5kYXJXaWRnZXQvV2Vlay9cIiArIGVuY29kZVVSSUNvbXBvbmVudChzdHJkYXRlKSArIFwiLz9Vc2VySUQ9XCIgKyB1c2VySWQ7XHJcbiAgICAgICAgY2FsY29udC5yZWxvYWQodXJsLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIGdldCB0aGUgbmV3IG9iamVjdDpcclxuICAgICAgICAgICAgdmFyIGNhbCA9ICQoJy5jYWxlbmRhcicsIHRoaXMuZWxlbWVudCk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLnllYXItd2VlaycpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC13ZWVrJykpO1xyXG4gICAgICAgICAgICBjYWxpbmZvLmZpbmQoJy5maXJzdC13ZWVrLWRheScpLnRleHQoY2FsLmRhdGEoJ3Nob3dlZC1maXJzdC1kYXknKSk7XHJcbiAgICAgICAgICAgIGNhbGluZm8uZmluZCgnLmxhc3Qtd2Vlay1kYXknKS50ZXh0KGNhbC5kYXRhKCdzaG93ZWQtbGFzdC1kYXknKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBGQVFzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbnZhciBmYXFzQmFzZVVybCA9ICdIZWxwQ2VudGVyLyRGQVFzJztcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICBmYXFzQmFzZVVybCA9IChiYXNlVXJsIHx8ICcvJykgKyBmYXFzQmFzZVVybDtcclxuXHJcbiAgLy8gRW5hYmxlIEZBUXMgbGlua3MgaW4gcG9wdXBcclxuICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYVtocmVmfD1cIiNGQVFzXCJdJywgcG9wdXBGYXFzKTtcclxuXHJcbiAgLy8gQXV0byBvcGVuIGN1cnJlbnQgZG9jdW1lbnQgbG9jYXRpb24gaWYgaGFzaCBpcyBhIEZBUSBsaW5rXHJcbiAgaWYgKC9eI0ZBUXMvaS50ZXN0KGxvY2F0aW9uLmhhc2gpKSB7XHJcbiAgICBwb3B1cEZhcXMobG9jYXRpb24uaGFzaCk7XHJcbiAgfVxyXG5cclxuICAvLyByZXR1cm4gYXMgdXRpbGl0eVxyXG4gIHJldHVybiBwb3B1cEZhcXM7XHJcbn07XHJcblxyXG4vKiBQYXNzIGEgRmFxcyBAdXJsIG9yIHVzZSBhcyBhIGxpbmsgaGFuZGxlciB0byBvcGVuIHRoZSBGQVEgaW4gYSBwb3B1cFxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdXBGYXFzKHVybCkge1xyXG4gIHVybCA9IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcclxuXHJcbiAgdmFyIHVybHBhcnRzID0gdXJsLnNwbGl0KCctJyk7XHJcblxyXG4gIGlmICh1cmxwYXJ0c1swXSAhPSAnI0ZBUXMnKSB7XHJcbiAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdUaGUgVVJMIGlzIG5vdCBhIEZBUSB1cmwgKGRvZXNuXFwndCBzdGFydHMgd2l0aCAjRkFRcy0pJywgdXJsKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgdmFyIHVybHNlY3Rpb24gPSB1cmxwYXJ0cy5sZW5ndGggPiAxID8gdXJscGFydHNbMV0gOiAnJztcclxuXHJcbiAgaWYgKHVybHNlY3Rpb24pIHtcclxuICAgIHZhciBwdXAgPSBwb3B1cChmYXFzQmFzZVVybCArIHVybHNlY3Rpb24sICdsYXJnZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGQgPSAkKHVybCksXHJcbiAgICAgICAgcGVsID0gcHVwLmdldENvbnRlbnRFbGVtZW50KCk7XHJcbiAgICAgIHBlbC5zY3JvbGxUb3AocGVsLnNjcm9sbFRvcCgpICsgZC5wb3NpdGlvbigpLnRvcCAtIDUwKTtcclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgZC5lZmZlY3QoXCJoaWdobGlnaHRcIiwge30sIDIwMDApO1xyXG4gICAgICB9LCA0MDApO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufSIsIi8qIElOSVQgKi9cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gTG9jYXRpb24ganMtZHJvcGRvd25cclxuICAgIHZhciBzID0gJCgnI3NlYXJjaC1sb2NhdGlvbicpO1xyXG4gICAgcy5wcm9wKCdyZWFkb25seScsIHRydWUpO1xyXG4gICAgcy5hdXRvY29tcGxldGUoe1xyXG4gICAgICAgIHNvdXJjZTogTEMuc2VhcmNoTG9jYXRpb25zXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCBhdXRvRm9jdXM6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAsIG1pbkxlbmd0aDogMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgc2VsZWN0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHMub24oJ2ZvY3VzIGNsaWNrJywgZnVuY3Rpb24gKCkgeyBzLmF1dG9jb21wbGV0ZSgnc2VhcmNoJywgJycpOyB9KTtcclxuXHJcbiAgICAvKiBQb3NpdGlvbnMgYXV0b2NvbXBsZXRlICovXHJcbiAgICB2YXIgcG9zaXRpb25zQXV0b2NvbXBsZXRlID0gJCgnI3NlYXJjaC1zZXJ2aWNlJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICAgIG1pbkxlbmd0aDogMCxcclxuICAgICAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgICAgICAgLy8kKHRoaXMpLnZhbCh1aS5pdGVtLmxhYmVsKTtcclxuICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAgICAgICAvLyQodGhpcykudmFsKHVpLml0ZW0ubGFiZWwpO1xyXG4gICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICAvLyBMb2FkIGFsbCBwb3NpdGlvbnMgaW4gYmFja2dyb3VuZCB0byByZXBsYWNlIHRoZSBhdXRvY29tcGxldGUgc291cmNlIChhdm9pZGluZyBtdWx0aXBsZSwgc2xvdyBsb29rLXVwcylcclxuICAgIC8qJC5nZXRKU09OKExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdvcHRpb24nLCAnc291cmNlJywgZGF0YSk7XHJcbiAgICB9XHJcbiAgICApOyovXHJcbn07IiwiLyoqXHJcbiAgICBFbmFibGUgdGhlIHVzZSBvZiBwb3B1cHMgdG8gc2hvdyBsaW5rcyB0byBzb21lIExlZ2FsIHBhZ2VzIChkZWZhdWx0IGxpbmtzIGJlaGF2aW9yIGlzIHRvIG9wZW4gaW4gYSBuZXcgdGFiKVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMuZW5hYmxlID0gZnVuY3Rpb24gKGJhc2VVcmwpIHtcclxuICAgICQoZG9jdW1lbnQpXHJcbiAgICAub24oJ2NsaWNrJywgJy52aWV3LXByaXZhY3ktcG9saWN5JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHBvcHVwKGJhc2VVcmwgKyAnSGVscENlbnRlci8kUHJpdmFjeVBvbGljeS8nLCAnbGFyZ2UnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcudmlldy10ZXJtcy1vZi11c2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcG9wdXAoYmFzZVVybCArICdIZWxwQ2VudGVyLyRUZXJtc09mVXNlLycsICdsYXJnZScpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG4qIFdlbGNvbWUgcG9wdXBcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy9UT0RPIG1vcmUgZGVwZW5kZW5jaWVzP1xyXG5cclxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24gd2VsY29tZVBvcHVwKCkge1xyXG4gICAgdmFyIGMgPSAkKCcjd2VsY29tZXBvcHVwJyk7XHJcbiAgICBpZiAoYy5sZW5ndGggPT09IDApIHJldHVybjtcclxuICAgIHZhciBza2lwU3RlcDEgPSBjLmhhc0NsYXNzKCdzZWxlY3QtcG9zaXRpb24nKTtcclxuXHJcbiAgICAvLyBJbml0XHJcbiAgICBpZiAoIXNraXBTdGVwMSkge1xyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSwgLnRlcm1zLCAucG9zaXRpb24tZGVzY3JpcHRpb24nKS5oaWRlKCk7XHJcbiAgICB9XHJcbiAgICBjLmZpbmQoJ2Zvcm0nKS5nZXQoMCkucmVzZXQoKTtcclxuICAgIC8vIFJlLWVuYWJsZSBhdXRvY29tcGxldGU6XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHsgYy5maW5kKCdbcGxhY2Vob2xkZXJdJykucGxhY2Vob2xkZXIoKTsgfSwgNTAwKTtcclxuICAgIGZ1bmN0aW9uIGluaXRQcm9maWxlRGF0YSgpIHtcclxuICAgICAgICBjLmZpbmQoJ1tuYW1lPWpvYnRpdGxlXScpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgICAgICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgICAgICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICAgICAgICBtaW5MZW5ndGg6IDAsXHJcbiAgICAgICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgICAgICAgICAgLy8gTm8gdmFsdWUsIG5vIGFjdGlvbiA6KFxyXG4gICAgICAgICAgICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS52YWx1ZSkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgaWQgKHZhbHVlKSBpbiB0aGUgaGlkZGVuIGVsZW1lbnRcclxuICAgICAgICAgICAgICAgIGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF0nKS52YWwodWkuaXRlbS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAvLyBTaG93IGRlc2NyaXB0aW9uXHJcbiAgICAgICAgICAgICAgICBjLmZpbmQoJy5wb3NpdGlvbi1kZXNjcmlwdGlvbicpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zbGlkZURvd24oJ2Zhc3QnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgndGV4dGFyZWEnKS52YWwodWkuaXRlbS5kZXNjcmlwdGlvbik7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSB3YW50IHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSB3YW50IHRoZSBsYWJlbCBpbiB0ZXh0Ym94LCBub3QgdGhlIHZhbHVlXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpbml0UHJvZmlsZURhdGEoKTtcclxuICAgIGMuZmluZCgnI3dlbGNvbWVwb3B1cExvYWRpbmcnKS5yZW1vdmUoKTtcclxuXHJcbiAgICAvLyBBY3Rpb25zXHJcbiAgICBjLm9uKCdjaGFuZ2UnLCAnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgYy5maW5kKCcucHJvZmlsZS1kYXRhIGxpOm5vdCguJyArIHRoaXMudmFsdWUgKyAnKScpLmhpZGUoKTtcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSwgaGVhZGVyIC5wcmVzZW50YXRpb24nKS5zbGlkZVVwKCdmYXN0Jyk7XHJcbiAgICAgICAgYy5maW5kKCcudGVybXMsIC5wcm9maWxlLWRhdGEnKS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuICAgICAgICAvLyBUZXJtcyBvZiB1c2UgZGlmZmVyZW50IGZvciBwcm9maWxlIHR5cGVcclxuICAgICAgICBpZiAodGhpcy52YWx1ZSA9PSAnY3VzdG9tZXInKVxyXG4gICAgICAgICAgICBjLmZpbmQoJ2EudGVybXMtb2YtdXNlJykuZGF0YSgndG9vbHRpcC11cmwnLCBudWxsKTtcclxuICAgICAgICAvLyBDaGFuZ2UgZmFjZWJvb2sgcmVkaXJlY3QgbGlua1xyXG4gICAgICAgIHZhciBmYmMgPSBjLmZpbmQoJy5mYWNlYm9vay1jb25uZWN0Jyk7XHJcbiAgICAgICAgdmFyIGFkZFJlZGlyZWN0ID0gJ2N1c3RvbWVycyc7XHJcbiAgICAgICAgaWYgKHRoaXMudmFsdWUgPT0gJ3Byb3ZpZGVyJylcclxuICAgICAgICAgICAgYWRkUmVkaXJlY3QgPSAncHJvdmlkZXJzJztcclxuICAgICAgICBmYmMuZGF0YSgncmVkaXJlY3QnLCBmYmMuZGF0YSgncmVkaXJlY3QnKSArIGFkZFJlZGlyZWN0KTtcclxuICAgICAgICBmYmMuZGF0YSgncHJvZmlsZScsIHRoaXMudmFsdWUpO1xyXG5cclxuICAgICAgICAvLyBTZXQgdmFsaWRhdGlvbi1yZXF1aXJlZCBmb3IgZGVwZW5kaW5nIG9mIHByb2ZpbGUtdHlwZSBmb3JtIGVsZW1lbnRzOlxyXG4gICAgICAgIGMuZmluZCgnLnByb2ZpbGUtZGF0YSBsaS4nICsgdGhpcy52YWx1ZSArICcgaW5wdXQ6bm90KFtkYXRhLXZhbF0pOm5vdChbdHlwZT1oaWRkZW5dKScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtdmFsLXJlcXVpcmVkJywgJycpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2RhdGEtdmFsJywgdHJ1ZSk7XHJcbiAgICAgICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbiAgICB9KTtcclxuICAgIGMub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0uYWpheCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpbml0UHJvZmlsZURhdGEoKTtcclxuICAgICAgICBjLmZpbmQoJy5wcm9maWxlLWNob2ljZSBbbmFtZT1wcm9maWxlLXR5cGVdOmNoZWNrZWQnKS5jaGFuZ2UoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIElmIHByb2ZpbGUgdHlwZSBpcyBwcmVmaWxsZWQgYnkgcmVxdWVzdDpcclxuICAgIGMuZmluZCgnLnByb2ZpbGUtY2hvaWNlIFtuYW1lPXByb2ZpbGUtdHlwZV06Y2hlY2tlZCcpLmNoYW5nZSgpO1xyXG59O1xyXG4iXX0=
