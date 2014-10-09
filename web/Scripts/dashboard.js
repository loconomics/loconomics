(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{}],2:[function(require,module,exports){
/** ProviderPosition class
  It provides minimun like-jquery event listeners
  with methods 'on' and 'off', and internally 'this.events'
  being a jQuery.Callbacks.
**/
var 
  $ = require('jquery'),
  LcUrl = require('./LcUrl'),
  smoothBoxBlock = require('./smoothBoxBlock'),
  ajaxCallbacks = require('LC/ajaxCallbacks');

/** Constructor
**/
var ProviderPosition = function (positionId) {
  this.positionId = positionId;

  // Events support through jquery.Callback
  this.events = $.Callbacks();
  this.on = function () { this.events.add.apply(this.events, Array.prototype.slice.call(arguments, 0)); return this; };
  this.off = function () { this.events.remove.apply(this.events, Array.prototype.slice.call(arguments, 0)); return this; };
};

// Using default configuration as prototype
ProviderPosition.prototype = {
  declinedMessageClass: 'info',
  declinedPopupClass: 'position-state-change',
  stateChangedEvent: 'state-changed',
  stateChangedDeclinedEvent: 'state-changed-declined',
  removeFormSelector: '.delete-message-confirm',
  removeFormContainer: '.DashboardSection-page',
  removeMessageClass: 'warning',
  removePopupClass: 'position-state-change',
  removedEvent: 'removed',
  removeFailedEvent: 'remove-failed'
};

/** changeState to the one given, it will raise a stateChangedEvent on success
  or stateChangedDeclinedEvent on error.
  @state: 'on' or 'off'
**/
ProviderPosition.prototype.changeState = function changePositionState(state) {
  var page = state == 'on' ? '$Reactivate' : '$Deactivate';
  var $d = $('#main');
  var that = this;
  var ctx = { form: $d, box: $d };
  $.ajax({
    url: LcUrl.LangPath + 'dashboard/position/' + page + '/?PositionID=' + this.positionId,
    context: ctx,
    error: ajaxCallbacks.error,
    success: function (data, text, jx) {
      $d.one('ajaxSuccessPost', function (event, data, t, j, ctx) {
        if (data && data.Code > 100) {
          if (data.Code == 101) {
            that.events.fire(state);
          } else {
            // Show message:
            var msg = $('<div/>').addClass(that.declinedMessageClass).append(data.Result.Message);
            smoothBoxBlock.open(msg, $d, that.declinedPopupClass, { closable: true, center: false, autofocus: false });
          }
        }
      });
      // Process the result, that eventually will call ajaxSuccessPost
      ajaxCallbacks.doJSONAction(data, text, jx, ctx);
    }
  });
  return this;
};

/**
    Delete position
**/
ProviderPosition.prototype.remove = function deletePosition() {

    var c = $(this.removeFormContainer),
        f = c.find(this.removeFormSelector).first(),
        popupForm = f.clone(),
        that = this;

    popupForm.one('ajaxSuccessPost', '.ajax-box', function (event, data) {

        function notify() {
            switch (data.Code) {
                case 101:
                    that.events.fire(that.removedEvent, [data.Result]);
                    break;
                case 103:
                    that.events.fire(that.removeFailedEvent, [data.Result]);
                    break;
            }
        }

        if (data && data.Code) {

            if (data.Result && data.Result.Message) {
                var msg = $('<div/>').addClass(that.removeMessageClass).append(data.Result.Message);
                var box = smoothBoxBlock.open(msg, c, that.removePopupClass, { closable: true, center: false, autofocus: false });

                box.on('xhide', function () {
                    notify();
                });
            }
            else {
                notify();
            }
        }

    });

    // Open confirmation form
    var b = smoothBoxBlock.open(popupForm, c, null, { closable: true });
};

module.exports = ProviderPosition;
},{"./LcUrl":1,"./smoothBoxBlock":7}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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
},{"./autoFocus":3,"./jquery.xtsh":4,"./jqueryUtils":5,"./moveFocusTo":6}],8:[function(require,module,exports){
/**
  It toggles a given value with the next in the given list,
  or the first if is the last or not matched.
  The returned function can be used directly or 
  can be attached to an array (or array like) object as method
  (or to a prototype as Array.prototype) and use it passing
  only the first argument.
**/
module.exports = function toggle(current, elements) {
  if (typeof (elements) === 'undefined' &&
      typeof (this.length) === 'number')
    elements = this;

  var i = elements.indexOf(current);
  if (i > -1 && i < elements.length - 1)
    return elements[i + 1];
  else
    return elements[0];
};

},{}],9:[function(require,module,exports){
/**
    User private dashboard section
**/
var $ = require('jquery');
var LcUrl = require('../LC/LcUrl');
var ajaxForms = require('LC/ajaxForms');

// Code on page ready
$(function () {
    /* Sidebar */
    var 
    toggle = require('../LC/toggle'),
    ProviderPosition = require('../LC/ProviderPosition');
    // Attaching 'change position' action to the sidebar links
    $(document).on('click', '[href = "#togglePositionState"]', function () {
        var 
      $t = $(this),
      v = $t.text(),
      n = toggle(v, ['on', 'off']),
      positionId = $t.closest('[data-position-id]').data('position-id');

        var pos = new ProviderPosition(positionId);
        pos
    .on(pos.stateChangedEvent, function (state) {
        $t.text(state);
    })
    .changeState(n);

        return false;
    })
    .on('click', '.delete-position a', function () {
        var positionId = $(this).closest('[data-position-id]').data('position-id');
        var pos = new ProviderPosition(positionId);

        pos
    .on(pos.removedEvent, function (msg) {
        // Current position page doesn't exist anymore, out!
        window.location = LcUrl.LangPath + 'dashboard/your-work/';
    })
    .remove();

        return false;
    });

    /* Promote */
    var generateBookNowButton = require('./dashboard/generateBookNowButton');
    // Listen on DashboardPromote instead of the more close container DashboardBookNowButton
    // allows to continue working without re-attachment after html-ajax-reloads from ajaxForm.
    generateBookNowButton.on('.DashboardPromote'); //'.DashboardBookNowButton'

    /* Privacy */
    var privacySettings = require('./dashboard/privacySettings');
    privacySettings.on('.DashboardPrivacy');

    /* Payments */
    var paymentAccount = require('./dashboard/paymentAccount');
    paymentAccount.on('.DashboardPayments');

    /* about-you */
    $('html').on('ajaxFormReturnedHtml', '.DashboardAboutYou form.ajax', function (e, $container) {
        if ($container.is('.DashboardAboutYou') || $container.find('.DashboardAboutYou').length)
            initAboutYou.apply(null, arguments);
    });
    initAboutYou();

    /* Your work init */
    $('html').on('ajaxFormReturnedHtml', '.DashboardYourWork form.ajax', function (e, $container) {
        if ($container.is('.DashboardYourWork') || $container.find('.DashboardYourWork').length)
            initYourWorkDom.apply(null, arguments);
    });
    initYourWorkDom();

    /* Availabilty */
    initAvailability();
    $('.DashboardAvailability').on('ajaxFormReturnedHtml', function (e, $container) {
        if ($container.is('.DashboardAvailability') || $container.find('.DashboardAvailability').length)
            initAvailability.apply(null, arguments);
    });
});

/**
    Instant saving and correct changes tracking
**/
function setInstantSavingSection(sectionSelector) {

    var $section = $(sectionSelector);

    if ($section.data('instant-saving')) {
        $section.on('change', ':input', function () {
            ajaxForms.doInstantSaving($section, [this]);
        });
    }
}

function initAboutYou() {
    /* Profile photo */
    var changeProfilePhoto = require('./dashboard/changeProfilePhoto');
    changeProfilePhoto.on('.DashboardAboutYou');

    /* About you / education */
    var education = require('./dashboard/educationCrudl');
    education.on('.DashboardAboutYou');

    /* About you / verifications */
    require('./dashboard/verificationsActions').on('.DashboardVerifications');
    require('./dashboard/verificationsCrudl').on('.DashboardAboutYou');

    // Instant saving
    setInstantSavingSection('.DashboardPublicBio');
    setInstantSavingSection('.DashboardPersonalWebsite');
}

function initAvailability(e) {
  // We need to avoid this logic when an event bubble
  // from the any fieldset.ajax, because its a subform event
  // and must not reset the main form (#504)
  if (e && e.target && /fieldset/i.test(e.target.nodeName))
    return;

  require('./dashboard/monthlySchedule').on();
  var weekly = require('./dashboard/weeklySchedule').on();
  require('./dashboard/calendarSync').on();
  require('./dashboard/appointmentsCrudl').on('.DashboardAvailability');

  // Instant saving
  setInstantSavingSection('.DashboardWeeklySchedule');
  setInstantSavingSection('.DashboardMonthlySchedule');
  setInstantSavingSection('.DashboardCalendarSync');
}

/**
  Initialize Dom elements and events handlers for Your-work logic.

  NOTE: .DashboardYourWork is an ajax-box parent of the form.ajax, every section
  is inside the form and replaced on html returned from server.
**/
function initYourWorkDom() {
    /* Your work / pricing */
    require('./dashboard/pricingCrudl').on();

    /* Your work / services */
    require('./dashboard/serviceAttributesValidation').setup($('.DashboardYourWork form'));

    // If we are in ajax-load, re-execute page scripts to update inline global variables
    if (arguments && arguments[3]) {
        var scripts = $(arguments[3].responseText).filter('script').map(function () { return (this.text || this.textContent || this.innerHTML || ''); });
        // 'each' functional style is not valid, for some reason evaling from there doesn't works,
        // (something like a fake window instance) so we do it with a simple loop:
        for (var i = 0; i < scripts.length; i++) {
            $.globalEval(scripts[i]);
        }
    }

    // Initialize SelectAttributes components for all categories
    // of service attributes on the page.
    var SelectAttributes = require('./dashboard/SelectAttributes');
    var attsLists = window.serviceAttributesLists || {};
    $(".SelectAttributes-autocompleteInput").each(function () {

        var $el = $(this),
            catId = $el.data('autocomplete-id'),
            selectedAtts = new SelectAttributes($el.closest('.SelectAttributes'), catId);

        // NOTE: The data is pulled from a global object,
        // thats added by the page on the body with a inline script.
        // Could be replaced by an AJAX call to JSON data, adding
        // a loading spinner hover SelectAttributes elements
        // while loading the 'attsLists' data.
        var list = attsLists[catId] || [];

        selectedAtts.setupAutocomplete(list);
        selectedAtts.fillWithCheckedAttributes(list);
    });

    // Instant saving and correct changes tracking
    setInstantSavingSection('.DashboardServices');

    /* Your work / cancellation */
    setInstantSavingSection('.DashboardCancellationPolicy');

    /* Your work / scheduling */
    setInstantSavingSection('.DashboardSchedulingOptions');

    /* Your work / locations */
    require('./dashboard/locationsCrudl').on('.DashboardYourWork');

    /* Your work / licenses */
    require('./dashboard/licensesCrudl').on('.DashboardYourWork');

    /* Your work / photos */
    require('./dashboard/managePhotosUI').on('.DashboardPhotos');
    // PhotosUI is special and cannot do instant-saving on form changes
    // because of the re-use of the editing form
    //setInstantSavingSection('.DashboardPhotos');

    /* Your work / reviews */
    $('.DashboardYourWork').on('ajaxSuccessPost', 'form', function (event, data) {
        // Reseting the email addresses on success to avoid resend again messages because
        // mistake of a second submit.
        var tb = $('.DashboardReviews [name=clientsemails]');
        // Only if there was a value:
        if (tb.val()) {
            tb
      .val('')
      .attr('placeholder', tb.data('success-message'))
            // support for IE, 'non-placeholder-browsers'
      .placeholder();
        }
    });

    /* Your work / add-position */
    var addPosition = require('./dashboard/addPosition');
    addPosition.init('.DashboardAddPosition');
    $('body').on('ajaxFormReturnedHtml', '.DashboardAddPosition', function () {
        addPosition.init();
    });
}
},{"../LC/LcUrl":1,"../LC/ProviderPosition":2,"../LC/toggle":8,"./dashboard/SelectAttributes":10,"./dashboard/addPosition":11,"./dashboard/appointmentsCrudl":12,"./dashboard/calendarSync":14,"./dashboard/changeProfilePhoto":15,"./dashboard/educationCrudl":16,"./dashboard/generateBookNowButton":17,"./dashboard/licensesCrudl":18,"./dashboard/locationsCrudl":19,"./dashboard/managePhotosUI":20,"./dashboard/monthlySchedule":21,"./dashboard/paymentAccount":22,"./dashboard/pricingCrudl":23,"./dashboard/privacySettings":24,"./dashboard/serviceAttributesValidation":25,"./dashboard/verificationsActions":26,"./dashboard/verificationsCrudl":27,"./dashboard/weeklySchedule":28}],10:[function(require,module,exports){
/**
    Class to manage the selection of attributes, mainly from an 
    autocomplete to a list of attributes with removal button
    and tooltip/popover for extended description.
    
    Created to enhance and simplife the service-attributes interface
    on dashboard.
**/
function SelectAttributes($c, categoryId) {

    this.$c = $c.addClass('SelectAttributes');
    this.$sel = $c.find('.SelectAttributes-selection');
    this.categoryId = categoryId;
    // Cache list of selected IDs
    this.selected = [];
    // Cache object of new attributes selected
    // (using an object without prototype because of 
    // the better performance look-up, and we maintain
    // a reference to the whole object too)
    this.news = {};
    this.news.prototype = null;

    this.hasId = function hasId(attId) {
        return this.selected.indexOf(attId) !== -1;
    };

    this.addId = function addId(attId) {
        this.selected.push(attId);
    };

    this.removeId = function removeId(attId) {

        // Remove from selected ones
        var i = this.selected.indexOf(parseInt(attId, 10));
        if (i > -1) {
            delete this.selected[i];
        }
    };

    this.removeNew = function removeNew(attName) {
        // Remove from news
        delete this.news[attName];
    };

    /**
        Check if the given item exists in the 
        selection, either an ID or a new
        attribute name
    **/
    this.has = function has(item) {
        return (
            this.hasId(item.ServiceAttributeID) ||
            (item.ServiceAttribute in this.news)
        );
    };

    this.remove = function remove(el, silentChange) {

        var $el = $(el),
            check = $el.siblings('[type=checkbox]'),
            parent = $el.closest('li'),
            val = check.val();

        if (!silentChange)
            // notify form change
            check.change();

        // Is an ID (integer) or new name?
        if (/^\d+$/.test(val)) {
            // Remove from Id
            this.removeId(val);
        } else {
            // Remove from New
            this.removeNew(val);
        }

        parent.remove();
    };

    this.add = function add(item, silentChange) {

        // Check if is not in the list already
        if (this.has(item))
            return false;

        // Add to selected cache
        if (item.ServiceAttributeID)
            this.addId(item.ServiceAttributeID);

        var li = $('<li class="SelectAttributes-item"/>').appendTo(this.$sel);
        var link = $('<span class="SelectAttributes-item-name"/>')
        .text(item.ServiceAttribute)
        .appendTo(li)
        .popover({
            content: item.ServiceAttributeDescription,
            trigger: 'hover',
            container: 'body'
        });

        var $check = $('<input type="checkbox" style="display:none" checked="checked" />')
        .attr('name', 'positionservices-category[' + item.ServiceAttributeCategoryID + ']-attribute[' + item.ServiceAttributeID + ']')
        .attr('value', item.ServiceAttributeID || item.ServiceAttribute)
        .appendTo(li);

        if (!silentChange)
            // notify form change:
            $check.change();

        $('<a href="#" class="SelectAttributes-item-remove">X</a>')
        .appendTo(li);

        return true;
    };

    this.addNew = function addNew(newAttribute) {

        if (typeof (newAttribute) === 'string') {
            // Avoid empty or whitespace names
            if (!newAttribute || /^\s+$/.test(newAttribute))
                return false;

            var createFromName = true;

            // Search if exists on the source list:
            if (typeof (this.autocompleteSearch) === 'function') {
                // Use autocompleteSearch to look for an exact match in
                // the source list, avoiding attempts to add new attributes
                // that already exists in the source and has an ID
                var foundItems = this.autocompleteSearch(newAttribute);
                if (foundItems && foundItems.length) {
                    // Get the first found (ideally it must be the only one)
                    newAttribute = foundItems[0];
                    // Use this rather than create one
                    createFromName = false;
                }
            }

            if (createFromName) {
                newAttribute = {
                    ServiceAttribute: newAttribute,
                    ServiceAttributeID: 0,
                    ServiceAttributeDescription: null,
                    ServiceAttributeCategoryID: this.categoryId,
                    UserChecked: true
                };
            }
        }

        // Add UI element
        var wasAdded = this.add(newAttribute);

        // If it was added and is a new attribute (ID=0)
        if (wasAdded && newAttribute.ServiceAttributeID === 0) {
            // Add to cache:
            this.news[newAttribute.ServiceAttribute] = newAttribute;
        }

        return wasAdded;
    };

    // Handlers
    var selectAtts = this;

    $c.on('click', '.SelectAttributes-item-remove', function () {
        selectAtts.remove(this);
        return false;
    });
}

module.exports = SelectAttributes;

SelectAttributes.prototype.fillWithCheckedAttributes = function fillWithCheckedAttributes(attributes) {
    var self = this;
    attributes.filter(function (att) {
        return att && att.UserChecked;
    }).forEach(function (item) {
        self.add(item, true);
    });
};

SelectAttributes.prototype.setupAutocomplete = function setupAutocomplete(list) {

    this.$autocomplete = this.$c.find('.SelectAttributes-autocomplete');
    this.$acButton = this.$autocomplete.find('.SelectAttributes-autocompleteButton');
    this.$acInput = this.$autocomplete.find('.SelectAttributes-autocompleteInput');
    this.autocompleteSource = list;

    // Reference to 'this' for the following closures
    var selectAtts = this;

    /**
    Performs a search by name on the autocomplete source list
    using the given exact, case insensitive, name or a regular expression.
    **/
    this.autocompleteSearch = function (nameOrMatcher) {

        var matcher = nameOrMatcher;
        if (typeof (nameOrMatcher) === 'string') {
            matcher = new RegExp('^' + $.ui.autocomplete.escapeRegex(nameOrMatcher) + '$', 'i');
        }

        return $.grep(this.autocompleteSource, function (value) {
            // Only those not selected still
            if (selectAtts.has(value)) {
                return false;
            }
            // Search by name:
            // (replaced non-breaking space by a normal one)
            value.value = value.ServiceAttribute.replace(/\u00a0/g, ' ');
            var found = matcher.test(value.value);
            // Result
            return found;
        });
    };

    // Autocomplete set-up
    this.$acInput.autocomplete({
        source: function (request, response) {
            // Partial string search
            var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), 'i');
            response(selectAtts.autocompleteSearch(matcher));
        },
        select: function (event, ui) {

            selectAtts.add(ui.item);

            selectAtts.$acInput
            // Clean-up value
            .val('');
            // Force show list again,
            // the 'inmediate delay' is because
            // this handler is followed by
            // a 'close autocomplete' action,
            // we need open it after that
            setTimeout(function () {
                selectAtts.$acInput.trigger('selectattributesshowlist');
            }, 1);

            return false;
        },
        // To allow show all elements:
        minLength: 0
    });

    function _performAddNew() {
        selectAtts.addNew(selectAtts.$acInput.val());

        selectAtts.$acInput
        // Clean-up value
        .val('')
        // Force show list again
        .trigger('selectattributesshowlist');
    }

    // Press Enter on autocomplete textbox:
    // - to avoid unwanted form-submit
    // - to trigger the addnew action
    this.$acInput.on('keypress', function (e) {
        if (e.keyCode == 13) {
            // addnew
            _performAddNew();
            // Cancel form-submit:
            return false;
        }
    });

    // Button handler
    selectAtts.$c.on('click', '.SelectAttributes-autocompleteButton', function () {
        _performAddNew();
    });

    // Show full list on focus/hovering
    this.$acInput.on('focus selectattributesshowlist', function () {
        if (!selectAtts.$acInput.autocomplete('widget').is(':visible'))
            selectAtts.$acInput.autocomplete('search', '');
    });
};

},{}],11:[function(require,module,exports){
/**
* Add Position: logic for the add-position page under /dashboard/your-work/0/,
  with autocomplete, position description and 'added positions' list.

  TODO: Check if is more convenient a refactor as part of LC/ProviderPosition.js
*/
var $ = require('jquery');
var selectors = {
  list: '.DashboardAddPosition-positionsList',
  selectPosition: '.DashboardAddPosition-selectPosition',
  desc: '.DashboardAddPosition-selectPosition-description'
};

exports.init = function initAddPosition(selector) {
  selector = selector || '.DashboardAddPosition';
  var c = $(selector);

  // Template position item value must be reset on init (because some form-recovering browser features that put on it bad values)
  c.find(selectors.list + ' li.is-template [name=position]').val('');

  // Autocomplete positions and add to the list
  var positionsList = null, tpl = null;
  var positionsAutocomplete = c.find('.DashboardAddPosition-selectPosition-search').autocomplete({
    source: LcUrl.JsonPath + 'GetPositions/Autocomplete/',
    autoFocus: false,
    minLength: 0,
    select: function (event, ui) {

      positionsList = positionsList || c.find(selectors.list + ' > ul');
      tpl = tpl || positionsList.children('.is-template:eq(0)');
      // No value, no action :(
      if (!ui || !ui.item || !ui.item.value) return;

      // Add if not exists in the list
      if (positionsList.children().filter(function () {
        return $(this).data('position-id') == ui.item.value;
      }).length === 0) {
        // Create item from template:
        positionsList.append(tpl.clone()
                    .removeClass('is-template')
                    .data('position-id', ui.item.value)
                    .children('.name').text(ui.item.positionSingular) // .label
                    .end().children('[name=position]').val(ui.item.value)
                    .end());
      }

      c.find(selectors.desc + ' > textarea').val(ui.item.description);

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

  // Load all positions in background to replace the autocomplete source (avoiding multiple, slow look-ups)
  /*$.getJSON(LcUrl.JsonPath + 'GetPositions/Autocomplete/',
  function (data) {
  positionsAutocomplete.autocomplete('option', 'source', data);
  }
  );*/

  // Show autocomplete on 'plus' button
  c.find(selectors.selectPosition + ' .add-action').click(function () {
    positionsAutocomplete.autocomplete('search', '');
    return false;
  });

  // Remove positions from the list
  c.find(selectors.list + ' > ul').on('click', 'li > a', function () {
    var $t = $(this);
    if ($t.attr('href') == '#remove-position') {
      // Remove complete element from the list (label and hidden form value)
      $t.parent().remove();
    }
    return false;
  });
};

},{}],12:[function(require,module,exports){
/** Availability: calendar appointments page setup for CRUDL use
**/
var $ = require('jquery');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {

  var $c = $(containerSelector),
    crudlSelector = '.DashboardAppointments',
    $crudlContainer = $c.find(crudlSelector).closest('.DashboardSection-page-section'),
    $others = $crudlContainer.siblings()
        .add($crudlContainer.find('.DashboardSection-page-section-introduction'))
        .add($crudlContainer.closest('.DashboardAvailability').siblings());

  var crudl = initCrudl(crudlSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['editor-ready'], function (e, editor) {
    // Done after a small delay to let the editor be visible
    // and setup work as expected
    setTimeout(function () {
      editFormSetup(editor);
    }, 100);
  });

};

function editFormSetup(f) {
  var repeat = f.find('[name=repeat]').change(function () {
    var a = f.find('.repeat-options');
    if (this.checked)
      a.slideDown('fast');
    else
      a.slideUp('fast');
  });
  var allday = f.find('[name=allday]').change(function () {
    var a = f
    .find('[name=starttime],[name=endtime]')
    .prop('disabled', this.checked);
    if (this.checked)
      a.hide('fast');
    else
      a.show('fast');
  });
  var repeatFrequency = f.find('[name=repeat-frequency]').change(function () {
    var freq = $(this).children(':selected');
    var unit = freq.data('unit');
    f
    .find('.repeat-frequency-unit')
    .text(unit);
    // If there is no unit, there is not interval/repeat-every field:
    var interval = f.find('.repeat-every');
    if (unit)
      interval.show('fast');
    else
      interval.hide('fast');
    // Show frequency-extra, if there is someone
    f.find('.frequency-extra-' + freq.val()).slideDown('fast');
    // Hide all other frequency-extra
    f.find('.frequency-extra:not(.frequency-extra-' + freq.val() + ')').slideUp('fast');
  });
  // auto-select some options when its value change
  f.find('[name=repeat-ocurrences]').change(function () {
    f.find('[name=repeat-ends][value=ocurrences]').prop('checked', true);
  });
  f.find('[name=repeat-end-date]').change(function () {
    f.find('[name=repeat-ends][value=date]').prop('checked', true);
  });
  // start-date trigger
  f.find('[name=startdate]').on('change', function () {
    // auto fill enddate with startdate when this last is updated
    f.find('[name=enddate]').val(this.value);
    // if no week-days or only one, auto-select the day that matchs start-date
    var weekDays = f.find('.weekly-extra .week-days input');
    if (weekDays.are(':checked', { until: 1 })) {
      var date = $(this).datepicker("getDate");
      if (date) {
        weekDays.prop('checked', false);
        weekDays.filter('[value=' + date.getDay() + ']').prop('checked', true);
      }
    }
  });

  // Init:
  repeat.change();
  allday.change();
  repeatFrequency.change();
  // add date pickers
  applyDatePicker();
  // add placeholder support (polyfill)
  f.find(':input').placeholder();
}
},{}],13:[function(require,module,exports){
/**
  Requesting a background check through the backgroundCheckEdit form inside about-you/verifications.
**/
var $ = require('jquery');

/**
  Setup the DOM elements in the container @$c
  with the background-check-request logic.
**/
exports.setupForm = function setupFormBackgroundCheck($c) {

  var selectedItem = null;

  $c.on('click', '.buy-action', function (e) {
    e.preventDefault();
    
    var f = $c.find('.DashboardBackgroundCheck-requestForm');
    var bcid = $(this).data('background-check-id');
    selectedItem = $(this).closest('.DashboardBackgroundCheck-item');
    var ps1 = $c.find('.popup.buy-step-1');

    f.find('[name=BackgroundCheckID]').val(bcid);
    f.find('.main-action').val($(this).text());

    smoothBoxBlock.open(ps1, $c, 'background-check');
  });

  $c.on('ajaxSuccessPost', '.DashboardBackgroundCheck-requestForm', function (e, data, text, jx, ctx) {
    if (data.Code === 110) {
      var ps2 = $c.find('.popup.buy-step-2');
      var box = smoothBoxBlock.open(ps2, $c, 'background-check');
      // Remove from the list the requested item
      selectedItem.remove();
      // Force viewer list reload
      $c.trigger('reloadList');
      // If there is no more items in the list:
      if ($c.find('.DashboardBackgroundCheck-item').length === 0) {
        // the close button on the popup must close the editor too:
        box.find('.close-action').addClass('crudl-cancel');
        // The action box must disappear
        $c.closest('.crudl').find('.BackgroundCheckActionBox').remove();
      }
    }
  });

};
},{}],14:[function(require,module,exports){
/** Availability: Calendar Sync section setup
**/
var $ = require('jquery');

exports.on = function (containerSelector) {
    containerSelector = containerSelector || '.DashboardCalendarSync';
    var container = $(containerSelector),
        fieldSelector = '.DashboardCalendarSync-privateUrlField',
        buttonSelector = '.DashboardCalendarSync-reset-action';

    // Selecting private-url field value on focus and click:
    container.find(fieldSelector).on('focus click', function () {
        this.select();
    });

    // Reseting private-url
    container
  .on('click', buttonSelector, function () {

      var t = $(this),
      url = t.attr('href'),
      field = container.find(fieldSelector);

      field.val('');

      function onerror() {
          field.val(field.data('error-message'));
      }

      $.getJSON(url, function (data) {
          if (data && data.Code === 0) {
              field.val(data.Result).change();
              field[0].select();
          } else {
              onerror();
          }
      }).fail(onerror);

      return false;
  });
};
},{}],15:[function(require,module,exports){
/** changeProfilePhoto, it uses 'uploader' using html5, ajax and a specific page
  to manage server-side upload of a new user profile photo.
**/
var $ = require('jquery');
require('jquery.blockUI');
var smoothBoxBlock = require('LC/smoothBoxBlock');
// TODO: reimplement this and the server-side file to avoid iframes and exposing global functions,
// direct API use without iframe-normal post support (current browser matrix allow us this?)
// TODO: implement as real modular, next are the knowed modules in use but not loading that are expected
// to be in scope right now but must be used with the next code uncommented.
// require('uploader');
// require('LcUrl');
// var blockPresets = require('../LC/blockPresets')
// var ajaxForms = require('../LC/ajaxForms');

exports.on = function (containerSelector) {
    var $c = $(containerSelector),
        userPhotoPopup;

    $c.on('click', '[href="#change-profile-photo"]', function () {
        userPhotoPopup = popup(LcUrl.LangPath + 'dashboard/AboutYou/ChangePhoto/', { width: 700, height: 670 }, null, null, { autoFocus: false });
        return false;
    });

    // NOTE: We are exposing global functions from here because the server page/iframe expects this
    // to work.
    // TODO: refactor to avoid this way.
    window.reloadUserPhoto = function reloadUserPhoto() {
        $c.find('.DashboardPublicBio-photo .avatar').each(function () {
            var src = this.getAttribute('src');
            // avoid cache this time
            src = src + "?v=" + (new Date()).getTime();
            this.setAttribute('src', src);
        });
    };

    window.closePopupUserPhoto = function closePopupUserPhoto() {
        if (userPhotoPopup) {
            userPhotoPopup.find('.close-popup').trigger('click');
        }
    };

    window.deleteUserPhoto = function deleteUserPhoto() {

        $.unblockUI();
        smoothBoxBlock.open($('<div/>').html(LC.blockPresets.loading.message), $('body'), '', { center: 'horizontal' });

        $.ajax({
            url: LcUrl.LangUrl + "dashboard/AboutYou/ChangePhoto/?delete=true",
            method: "GET",
            cache: false,
            dataType: "json",
            success: function (data) {
                var content = (data.Code === 0 ? data.Result : data.Result.ErrorMessage);

                smoothBoxBlock.open($('<div/>').text(content), $('body'), '', { closable: true, center: 'horizontal' });

                reloadUserPhoto();
            },
            error: ajaxErrorPopupHandler
        });
    };

};

},{}],16:[function(require,module,exports){
/** Education page setup for CRUDL use
**/
var $ = require('jquery');
//require('LC/jquery.xtsh');
require('jquery-ui');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {
  var $c = $(containerSelector),
    sectionSelector = '.DashboardEducation',
    $section = $c.find(sectionSelector).closest('.DashboardSection-page-section'),
    $others = $section.siblings()
        .add($section.find('.DashboardSection-page-section-introduction'))
        .add($section.closest('.DashboardAboutYou').siblings());

  var crudl = initCrudl(sectionSelector);
  //crudl.settings.effects['show-viewer'] = { effect: 'height', duration: 'slow' };

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['editor-ready'], function (e, $editor) {
    // Setup autocomplete
    $editor.find('[name=institution]').autocomplete({
      source: LcUrl.JsonPath + 'GetInstitutions/Autocomplete/',
      autoFocus: false,
      delay: 200,
      minLength: 5
    });
  });
};

},{}],17:[function(require,module,exports){
/**
  generateBookNowButton: with the proper html and form
  regenerates the button source-code and preview automatically.
**/
var $ = require('jquery');

exports.on = function (containerSelector) {
  var c = $(containerSelector);

  function regenerateButtonCode() {
    var
      size = c.find('[name=size]:checked').val(),
      positionid = c.find('[name=positionid]:checked').val(),
      sourceContainer = c.find('[name=button-source-code]'),
      previewContainer = c.find('.DashboardBookNowButton-buttonSizes-preview'),
      buttonTpl = c.find('.DashboardBookNowButton-buttonCode-buttonTemplate').text(),
      linkTpl = c.find('.DashboardBookNowButton-buttonCode-linkTemplate').text(),
      tpl = (size == 'link-only' ? linkTpl : buttonTpl),
      tplVars = $('.DashboardBookNowButton-buttonCode');

    previewContainer.html(tpl);
    previewContainer.find('a').attr('href',
      tplVars.data('base-url') + (positionid ? positionid + '/' : ''));
    previewContainer.find('img').attr('src',
      tplVars.data('base-src') + size);
    sourceContainer.val(previewContainer.html().trim());
  }

  // First generation
  if (c.length > 0) regenerateButtonCode();
  // and on any form change
  c.on('change', 'input', regenerateButtonCode);
};
},{}],18:[function(require,module,exports){
/** Licenses page setup for CRUDL use
**/
var $ = require('jquery');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {
  var $c = $(containerSelector),
    licensesSelector = '.DashboardLicenses',
    $licenses = $c.find(licensesSelector).closest('.DashboardSection-page-section'),
    $others = $licenses.siblings()
      .add($licenses.find('.DashboardSection-page-section-introduction'))
      .add($licenses.closest('.DashboardYourWork').siblings());

  var crudl = initCrudl(licensesSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  });
};

},{}],19:[function(require,module,exports){
/** Locations page setup for CRUDL use
**/
var $ = require('jquery');
var mapReady = require('LC/googleMapReady');
// Indirectly used: require('LC/hasConfirmSupport');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {
    var $c = $(containerSelector),
        locationsSelector = '.DashboardLocations',
        $locations = $c.find(locationsSelector).closest('.DashboardSection-page-section'),
        $others = $locations.siblings()
            .add($locations.find('.DashboardSection-page-section-introduction'))
            .add($locations.closest('.DashboardYourWork').siblings());

    var crudl = initCrudl(locationsSelector);

    if (crudl.elements.data('__locationsCrudl_initialized__') === true) return;
    crudl.elements.data('__locationsCrudl_initialized__', true);

    var locationMap;

    crudl.elements
    .on(crudl.settings.events['edit-starts'], function () {
        $others.xhide({ effect: 'height', duration: 'slow' });
    })
    .on(crudl.settings.events['edit-ends'], function () {
        $others.xshow({ effect: 'height', duration: 'slow' });
    })
    .on(crudl.settings.events['editor-ready'], function (e, $editor) {
        //Force execution of the 'has-confirm' script
        $editor.find('fieldset.has-confirm > .confirm input').change();

        setupCopyLocation($editor);

        locationMap = setupGeopositioning($editor);

        updateSectionTitle($editor);
    })
    .on(crudl.settings.events['editor-showed'], function (e, $editor) {

        if (locationMap)
            mapReady.refreshMap(locationMap);
    })
    .on(crudl.settings.events['editor-hidden'], function (e, $editor) {

        updateSectionTitle($editor);
    });
};

function updateSectionTitle($editor) {

    var isRadius = $editor.find('.is-minimumRadiusUi').length > 0;

    var sectionTitle = $editor.closest('.DashboardSection-page-section').find('.DashboardSection-page-section-header');

    if (isRadius) {
        sectionTitle.text(sectionTitle.data('radius-title'));
    } else {
        sectionTitle.text(sectionTitle.data('default-title'));
    }
}

function setupCopyLocation($editor) {
    $editor.find('select.copy-location').change(function () {
        var $t = $(this);
        $t.closest('.crudl-form').reload(function () {
            return (
                $(this).data('ajax-fieldset-action').replace(
                    /LocationID=\d+/gi,
                    'LocationID=' + $t.val()) + '&' + $t.data('extra-query')
            );
        });
    });
}

/** Locate user position or translate address text into a geocode using
  browser and Google Maps services.
**/
function setupGeopositioning($editor) {
    var map;
    mapReady(function () {

        // Register if user selects or writes a position (to not overwrite it with automatic positioning)
        var positionedByUser = false;
        // Some confs
        var detailedZoomLevel = 17;
        var generalZoomLevel = 9;
        var foundLocations = {
            byUser: null,
            byGeolocation: null,
            byGeocode: null,
            original: null
        };

        var l = $editor.find('.location-map');
        var m = l.find('.map-selector > .google-map').get(0);
        var $lat = l.find('[name=latitude]');
        var $lng = l.find('[name=longitude]');
        var $isRadius = $editor.find('[name=itravel]');
        var $radius = $editor.find('[name=travel-radius]');

        // Creating position coordinates
        var myLatlng;
        (function () {
            var _lat_value = $lat.val(), _lng_value = $lng.val();
            if (_lat_value && _lng_value) {
                myLatlng = new google.maps.LatLng($lat.val(), $lng.val());
                // We consider as 'positioned by user' when there was a saved value for the position coordinates (we are editing a location)
                positionedByUser = (myLatlng.lat() !== 0 && myLatlng.lng() !== 0);
            } else {
                // Default position when there are not one (San Francisco just now):
                myLatlng = new google.maps.LatLng(37.75334439226298, -122.4254606035156);
            }
        })();
        // Remember original form location
        foundLocations.original = foundLocations.confirmed = myLatlng;

        // Create map
        var mapOptions = {
            zoom: (positionedByUser ? detailedZoomLevel : generalZoomLevel), // Best detail when we already had a location
            center: myLatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        map = new google.maps.Map(m, mapOptions);

        // Create the position marker
        var marker = new google.maps.Marker({
            position: myLatlng,
            map: map,
            draggable: false,
            animation: google.maps.Animation.DROP
        });
        // Placeholder for the radiusCircle, created on demand
        var radiusCircle;
        // Initializing radiusCircle
        updateRadiusCircle();

        // Listen when user clicks map or move the marker to move marker or set position in the form
        google.maps.event.addListener(marker, 'dragend', function (event) {
            setFormCoordinates(marker.getPosition());
            updateRadiusCircle();
        });
        google.maps.event.addListener(map, 'click', function (event) {
            if (!marker.getDraggable()) return;
            placeMarker(event.latLng);
            positionedByUser = true;
            foundLocations.byUser = event.latLng;
            setFormCoordinates(event.latLng);
            updateRadiusCircle();
        });
        function placeMarker(latlng, dozoom, autosave) {
            marker.setPosition(latlng);
            // Move map
            map.panTo(latlng);
            saveCoordinates(autosave);
            updateRadiusCircle();

            if (dozoom)
            // Set zoom to something more detailed
                map.setZoom(detailedZoomLevel);
            return marker;
        }
        function saveCoordinates(inForm) {
            var latLng = marker.getPosition();
            positionedByUser = true;
            foundLocations.byUser = latLng;
            if (inForm === true) {
                setFormCoordinates(latLng);
            }
        }
        function setFormCoordinates(latLng) {
            $lat.val(latLng.lat()); //marker.position.Xa
            $lng.val(latLng.lng()); //marker.position.Ya
        }

        /**
        It creates a circle on the map with the given values
        **/
        function createRadiusCircle(latlng, radius) {

            return new google.maps.Circle({
                center: latlng,
                map: map,
                clickable: false,
                radius: getLocationRadius(),
                fillColor: '#00989A',
                fillOpacity: 0.3,
                strokeWeight: 0
            });
        }
        /**
        Updates the position and radius of current radiusCircle
        in the map for the current position and radius
        or the given one.
        If the circle doesn't exists, its created,
        or hidden if there is no radius and exists already.
        **/
        function updateRadiusCircle(latlng, radius) {

            latlng = latlng && latlng.getLng || marker.getPosition();
            radius = radius || getLocationRadius();

            if (radius && latlng) {
                if (radiusCircle) {
                    radiusCircle.setCenter(latlng);
                    radiusCircle.setRadius(radius);
                    radiusCircle.setVisible(true);
                }
                else {
                    radiusCircle = createRadiusCircle(latlng, radius);
                }
            } else if (radiusCircle) {
                radiusCircle.setVisible(false);
            }
        }
        /**
        Get the service radius as a number in meters usefule for Google Maps
        from the form whenever apply, else it returns null.
        **/
        function getLocationRadius() {

            // When radius/travel option choosen
            if ($isRadius.filter(':checked[value="True"]').prop('checked')) {
                // Get radius from form (its in miles or km)
                var radius = $radius.val();
                var radiusUnit = LC.distanceUnits[LC.getCurrentCulture().country];
                // result must go in meters
                return (radiusUnit == 'miles' ? convertMilesKm(radius, radiusUnit) : radius) * 1000;
            }

            return null;
        }

        // Listen when user changes form coordinates values to update the map
        $lat.change(updateMapMarker);
        $lng.change(updateMapMarker);
        function updateMapMarker() {
            positionedByUser = true;
            var newPos = new google.maps.LatLng($lat.val(), $lng.val());
            // Move marker
            marker.setPosition(newPos);
            // Move map
            map.panTo(newPos);
            updateRadiusCircle();
        }
        // Listen when user changes service radius from form to update the map
        $isRadius.change(updateRadiusCircle);
        $radius.change(updateRadiusCircle);

        /*===================
        * AUTO POSITIONING
        */
        function useGeolocation(force, autosave) {
            var override = force || !positionedByUser;
            // Use browser geolocation support to get an automatic location if there is no a location selected by user
            // Check to see if this browser supports geolocation.
            if (override && navigator.geolocation) {

                // This is the location marker that we will be using
                // on the map. Let's store a reference to it here so
                // that it can be updated in several places.
                var locationMarker = null;

                // Get the location of the user's browser using the
                // native geolocation service. When we invoke this method
                // only the first callback is requied. The second
                // callback - the error handler - and the third
                // argument - our configuration options - are optional.
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        // Check to see if there is already a location.
                        // There is a bug in FireFox where this gets
                        // invoked more than once with a cached result.
                        if (locationMarker) {
                            return;
                        }

                        // Move marker to the map using the position, only if user doesn't set a position
                        if (override) {
                            var latLng = new google.maps.LatLng(
                                position.coords.latitude,
                                position.coords.longitude
                            );
                            locationMarker = placeMarker(latLng, true, autosave);
                            foundLocations.byGeolocation = latLng;
                        }
                    },
                    function (error) {
                        if (console && console.log) console.log("Something went wrong: ", error);
                    },
                    {
                        timeout: (5 * 1000),
                        maximumAge: (1000 * 60 * 15),
                        enableHighAccuracy: true
                    }
                );


                // Now that we have asked for the position of the user,
                // let's watch the position to see if it updates. This
                // can happen if the user physically moves, of if more
                // accurate location information has been found (ex.
                // GPS vs. IP address).
                //
                // NOTE: This acts much like the native setInterval(),
                // invoking the given callback a number of times to
                // monitor the position. As such, it returns a "timer ID"
                // that can be used to later stop the monitoring.
                var positionTimer = navigator.geolocation.watchPosition(
                  function (position) {
                      // Move again to the new or accurated position, if user doesn't set a position
                      if (override) {
                          var latLng = new google.maps.LatLng(
                              position.coords.latitude,
                              position.coords.longitude
                          );
                          locationMarker = placeMarker(latLng, true, autosave);
                          foundLocations.byGeolocation = latLng;
                      } else
                          navigator.geolocation.clearWatch(positionTimer);
                  }
              );

                // If the position hasn't updated within 5 minutes, stop
                // monitoring the position for changes.
                setTimeout(
                  function () {
                      // Clear the position watcher.
                      navigator.geolocation.clearWatch(positionTimer);
                  },
                  (1000 * 60 * 5)
              );
            } // Ends geolocation position
        }
        function useGmapsGeocode(initialLookup, autosave) {
            var geocoder = new google.maps.Geocoder();

            // lookup on address fields changes with complete information
            var $form = $editor.find('.crudl-form'), form = $form.get(0);
            function getFormAddress() {
                var ad = [];
                function add(field) {
                    if (form.elements[field] && form.elements[field].value) ad.push(form.elements[field].value);
                }
                add('addressline1');
                add('addressline2');
                add('city');
                add('postalcode');
                var s = form.elements.state;
                if (s && s.value) ad.push(s.options[s.selectedIndex].label);
                ad.push('USA');
                // Minimum for valid address: 2 fields filled out
                return ad.length >= 2 ? ad.join(', ') : null;
            }
            $form.on('change', '[name=addressline1], [name=addressline2], [name=city], [name=postalcode], [name=state]', function () {
                var address = getFormAddress();
                if (address)
                    geocodeLookup(address, false);
            });

            // Initial lookup
            if (initialLookup) {
                var address = getFormAddress();
                if (address)
                    geocodeLookup(address, true);
            }

            function geocodeLookup(address, override) {
                geocoder.geocode({ 'address': address }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        var latLng = results[0].geometry.location;
                        //console.info('Geocode retrieved: ' + latLng + ' for address "' + address + '"');
                        foundLocations.byGeocode = latLng;

                        placeMarker(latLng, true, autosave);
                    } else {
                        if (console && console.error) console.error('Geocode was not successful for the following reason: ' + status + ' on address "' + address + '"');
                    }
                });
            }
        }

        // Executing auto positioning (changed to autosave:true to all time save the location):
        //useGeolocation(true, false);
        useGmapsGeocode(false, true);

        // Link options links:
        l.find('.options a').off('click.map').on('click.map', function () {
            var target = $(this).attr('href').substr(1);
            switch (target) {
                case 'geolocation':
                    if (foundLocations.byGeolocation)
                        placeMarker(foundLocations.byGeolocation, true, true);
                    else
                        useGeolocation(true, true);
                    break;
                case 'geocode':
                    if (foundLocations.byGeocode)
                        placeMarker(foundLocations.byGeocode, true, true);
                    else
                        useGmapsGeocode(true, true);
                    break;
                case 'confirm':
                    saveCoordinates(true);
                    marker.setDraggable(false);
                    foundLocations.confirmed = marker.getPosition();
                    l.find('.gps-lat, .gps-lng, .advice, .find-address-geocode, .confirm-gps-action').hide('fast');
                    var edit = l.find('.edit-action');
                    edit.text(edit.data('edit-label'));
                    break;
                case 'editcoordinates':
                    var a = l.find('.gps-lat, .gps-lng, .advice, .find-address-geocode, .confirm-gps-action');
                    var b = !a.is(':visible');
                    marker.setDraggable(b);
                    var $t = $(this);
                    if (b) {
                        $t.data('edit-label', $t.text());
                        $t.text($t.data('cancel-label'));
                    } else {
                        $t.text($t.data('edit-label'));
                        // Restore location:
                        placeMarker(foundLocations.confirmed, true, true);
                    }
                    a.toggle('fast', function () {
                        l.find('.confirm-gps-action:visible').css('display', 'inline-block');
                    });
                    break;
            }

            return false;
        });
    });

    return map;
}
},{}],20:[function(require,module,exports){
/*global window */
/** UI logic to manage provider photos (your-work/photos).
**/
var $ = require('jquery');
require('jquery-ui');
var smoothBoxBlock = require('LC/smoothBoxBlock');
var changesNotification = require('LC/changesNotification');
var acb = require('LC/ajaxCallbacks');
require('imagesLoaded');

var sectionSelector = '.DashboardPhotos';
// On init, the default 'no image' image src will be get it on:
var defaultImgSrc = null;

var editor = null;

exports.on = function (containerSelector) {
    var $c = $(containerSelector);

    if ($c.length) {

        setupCrudlDelegates($c);

        initElements($c);

        // Any time that the form content html is reloaded,
        // re-initialize elements
        $c.on('ajaxFormReturnedHtml', 'form.ajax', function () {
            initElements($c);
        });
    }
};

function save(data) {
    
    var editPanel = $(sectionSelector);

    return $.ajax({
        url: editPanel.data('ajax-fieldset-action'),
        data: data,
        type: 'post',
        success: function (data) {
            if (data && data.Code < 0) {
                // new error for Promise-attached callbacks
                throw new Error(data.ErrorMessage);
            } else {
                // Register changes
                var $c = $(sectionSelector);
                changesNotification.registerSave($c.closest('form').get(0), $c.find(':input').toArray());

                return data;
            }
        },
        error: function (xhr, text, error) {
            // TODO: better error management, saving
            alert('Sorry, there was an error. ' + (error || ''));
        }
    });
}

function saveEditedPhoto($f) {

    var id = $f.find('[name=PhotoID]').val(),
        caption = $f.find('[name=photo-caption]').val(),
        isPrimary = $f.find('[name=is-primary-photo]:checked').val() === 'True';

    if (id && id > 0) {
        // Ajax save
        save({
            PhotoID: id,
            'photo-caption': caption,
            'is-primary-photo': isPrimary,
            result: 'json'
        });
        // Update cache at gallery item
        var $item = $f.find('.positionphotos-gallery #UserPhoto-' + id),
            $img = $item.find('img');

        if ($item && $item.length) {
            $img.attr('alt', caption);
            if (isPrimary)
                $item.addClass('is-primary-photo');
            else
                $item.removeClass('is-primary-photo');
        }
    }
}

function editSelectedPhoto(form, selected) {

    var editPanel = $('.positionphotos-edit', form);
    var nonUploaderElementsSelector = '.positionphotos-edit, .DashboardPhotos-editPhoto > legend, .positionphotos-gallery > legend, .positionphotos-gallery > ol, .positionphotos-tools';

    // Use given @selected or look for a selected photo in the list
    selected = selected && selected.length ? selected : $('.positionphotos-gallery > ol > li.selected', form);

    // Mark this as selected
    selected.addClass('selected').siblings().removeClass('selected');

    if (selected && selected.length > 0) {

        form.find(nonUploaderElementsSelector).show();
        editor.uploader.setAsSecondary();

        var selImg = selected.find('img');
        // Moving selected to be edit panel
        var photoID = selected.attr('id').match(/^UserPhoto-(\d+)$/)[1],
            photoUrl = selImg.attr('src'),
            $img = editPanel.find('img');

        editPanel.find('[name=PhotoID]').val(photoID);
        editPanel.find('[name=photoURI]').val(photoUrl);
        $img
        .attr('src', photoUrl + "?v=" + (new Date()).getTime()) // '?size=normal')
        .attr('style', '');
        editPanel.find('[name=photo-caption]').val(selImg.attr('alt'));
        var isPrimaryValue = selected.hasClass('is-primary-photo') ? 'True' : 'False';
        editPanel.find('[name=is-primary-photo]').prop('checked', false);
        editPanel.find('[name=is-primary-photo][value=' + isPrimaryValue + ']').prop('checked', true);

        // Cropping
        $img.imagesLoaded(function () {
            editor.setupCropPhoto();
        });

    } else {
        if (form.find('.positionphotos-gallery > ol > li').length === 0) {
            // #535, avoid the 'there is no photos' and just hide the panel to give quick access
            // to the 'upload button'. The gallery may need to be hidden too
            //smoothBoxBlock.open(form.find('.no-photos'), editPanel, '', { autofocus: false });
            form.find(nonUploaderElementsSelector).hide();
            editor.uploader.setAsMain();
        } else {
            form.find(nonUploaderElementsSelector).show();
            editor.uploader.setAsSecondary();
            smoothBoxBlock.open(form.find('.no-primary-photo'), editPanel, '', { autofocus: false });
        }
        // No image:
        editPanel.find('img').attr('src', defaultImgSrc);
        // Reset hidden fields manually to avoid browser memory breaking things
        editPanel.find('[name=PhotoID]').val('');
        editPanel.find('[name=photo-caption]').val('');
        editPanel.find('[name=is-primary-photo]').prop('checked', false);
    }
}

/* Setup the code that works on the different CRUDL actions on the photos.
  All this are delegates, only need to be setup once on the page
  (if the container $c is not replaced, only the contents, doesn't need to call again this).
*/
function setupCrudlDelegates($c) {
    $c
    .on('change', '.positionphotos-edit input', function () {
        // Instant saving on user changes to the editing form
        var $f = $(this).closest('.positionphotos-edit');
        saveEditedPhoto($f);
    })
    .on('click', '.positionphotos-tools-upload > a', function () {
        var posID = $(this).closest('form').find('input[name=positionID]').val();
        popup(LcUrl.LangPath + 'dashboard/YourWork/UploadPhoto/?PositionID=' + posID, { width: 700, height: 670 }, null, null, { autoFocus: false });
        return false;
    })
    .on('click', '.positionphotos-gallery li a', function () {
        var $t = $(this);
        var form = $t.closest(sectionSelector);
        // Don't lost latest changes:
        saveEditedPhoto(form);

        smoothBoxBlock.closeAll(form);
        // Set this photo as selected
        var selected = $t.closest('li');
        editSelectedPhoto(form, selected);

        return false;
    })
    .on('click', '.DashboardPhotos-editPhoto-delete', function () {

        var editPanel = $(this).closest('.positionphotos-edit');
        var form = editPanel.closest(sectionSelector);

        var photoID = editPanel.find('[name=PhotoID]').val();
        var $photoItem = form.find('#UserPhoto-' + photoID);

        // Instant saving
        save({
            PhotoID: photoID,
            'delete-photo': 'True',
            result: 'json'
        })
        .then(function () {
            // Remove item
            $photoItem.remove();

            editSelectedPhoto(form);
        });

        return false;
    });
}

/* Initialize the photos elements to be sortables, set the primary photo
  in the highlighted are and initialize the 'delete photo' flag.
  This is required to be executed any time the elements html is replaced
  because needs direct access to the DOM elements.
*/
function initElements(form) {

    defaultImgSrc = form.find('img').attr('src');

    var sortable = new Sortable({ container: form });

    // Editor setup
    var $ceditor = $('.DashboardPhotos-editPhoto', form),
        positionId = parseInt(form.closest('form').find('[name=positionID]').val()) || 0;
    editor = new Editor({
        container: $ceditor,
        positionId: positionId,
        sizeLimit: $ceditor.data('size-limit'),
        gallery: new Gallery({ container: form }),
        uploader: new Uploader({ container: $('.FileUploader', form), positionId: positionId })
    });

    // Set primary photo to be edited
    editSelectedPhoto(form);
}

/**
    Sortable Component Class
**/
function Sortable(settings) {

    settings = settings || {};
    this.$container = $(settings.container || 'body');

    // Prepare sortable script
    this.sortable = $(".positionphotos-gallery > ol", this.$container).sortable({
        placeholder: "ui-state-highlight",
        update: this.onUpdate
    });
}

/** Context 'this' is the jquery.sortable on this event handler
**/
Sortable.prototype.onUpdate = function onUpdate() {
    // Get photo order, a comma separated value of items IDs
    var order = $(this).sortable("toArray").toString();
    // Set order in the form element, to be sent later with the form
    $(this).closest(sectionSelector)
        .find('[name=gallery-order]')
        .val(order)
    // With instant saving, no more notify change for ChangesNotifier, so commenting:
    //.change()
        ;

    // Instant saving
    save({
        'gallery-order': order,
        action: 'order',
        result: 'json'
    });
};

/**
    Gallery Class
**/
function Gallery(settings) {

    settings = settings || {};

    this.$container = $(settings.container || '.DashboardPhotos');
    this.$gallery = $('.positionphotos-gallery', this.$container);
    this.$galleryList = $('ol', this.$gallery);
    this.tplImg = '<li id="UserPhoto-@@0"><a href="#"><img alt="Uploaded photo" src="@@1"/></a><a class="edit" href="#">Edit</a></li>';

    /**
       Append a photo element to the gallery collection.
    **/
    this.appendPhoto = function appendPhoto(fileName, photoID) {

        var newImg = $(this.tplImg.replace(/@@0/g, photoID).replace(/@@1/g, fileName));
        // If is there is no photos still, the first will be the primary by default
        if (this.$galleryList.children().length === 0) {
            newImg.addClass('is-primary-photo');
        }

        this.$galleryList
        .append(newImg)
        // scroll the gallery to see the new element; using '-2' to avoid some browsers automatic scroll.
        .animate({ scrollTop: this.$galleryList[0].scrollHeight - this.$galleryList.height() - 2 }, 1400)
        .find('li:last-child')
        .effect("highlight", {}, 1600);

        return newImg;
    };

    this.reloadPhoto = function reloadPhoto(fileURI, photoID) {

        // Find item by ID and load with new URI
        this.$galleryList.find('#UserPhoto-' + photoID)
        .find('img')
        .attr('src', fileURI + '?v=' + (new Date()).getTime());
    };
}

/**
    Uploader Class
**/
function Uploader(settings) {

    settings = settings || {};

    // f.e.: .FileUploader
    this.$container = $(settings.container || 'html');
    this.gallery = settings.gallery || new Gallery(this.$container);
    this.positionId = settings.positionId || 0;
    this.componentClass = settings.componentClass || 'FileUploader';
    this.secondaryClass = settings.secondaryClass || 'FileUploader--asSecondary';

    var thisUploader = this;

    this.qquploader = new qq.FileUploader({
        element: $('.FileUploader-uploader', this.$container).get(0),
        // path to server-side upload script
        action: LcUrl.LangPath + 'dashboard/YourWork/UploadPhoto/?PositionID=' + (this.positionId),
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
        onComplete: function (id, fileName, responseJSON) {
            if (responseJSON.success) {
                var newImgItem = thisUploader.gallery.appendPhoto(responseJSON.fileURI, responseJSON.photoID);
                // Show in edit panel
                smoothBoxBlock.closeAll(thisUploader.gallery.$container);
                editSelectedPhoto(thisUploader.gallery.$container, newImgItem);
            }
        },
        messages: {
            typeError: "{file} has invalid extension. Only {extensions} are allowed.",
            sizeError: "{file} is too large, maximum file size is {sizeLimit}.",
            minSizeError: "{file} is too small, minimum file size is {minSizeLimit}.",
            emptyError: "{file} is empty, please select files again without it.",
            onLeave: "The files are being uploaded, if you leave now the upload will be cancelled."
        },
        sizeLimit: this.sizeLimit || 'undefined',
        template: '<div class="qq-uploader">' +
                '<div class="qq-upload-drop-area"><span>Drop a file here to upload</span></div>' +
                '<div class="qq-upload-button">Upload a photo</div>' +
                '<ul class="qq-upload-list"></ul>' +
                '</div>'
    });
}

Uploader.prototype.setAsMain = function setAsMain() {
    this.$container.removeClass(this.secondaryClass);
};

Uploader.prototype.setAsSecondary = function setAsSecondary() {
    this.$container.addClass(this.secondaryClass);
};

/**
    Editor Class
**/
var qq = require('fileuploader');
require('jcrop');
function Editor(settings) {

    settings = settings || {};

    var $h = $('html');
    this.positionId = settings.positionId || $h.data('position-id');
    this.sizeLimit = settings.sizeLimit || $h.data('size-limit');

    // f.e.: .DashboardPhotos-editPhoto
    this.$container = $(settings.container || 'html');
    this.gallery = settings.gallery || new Gallery({ container: this.$container });
    this.uploader = settings.uploader || new Uploader({ containe: this.$container, positionId: this.positionId });

    // Initializing:
    this.initCropForm();
}

// Simple event handler, called from onChange and onSelect
// event handlers, as per the Jcrop invocation above
Editor.prototype.showCoords = function showCoords(c) {
    $('[name=crop-x1]', this.$container).val(c.x);
    $('[name=crop-y1]', this.$container).val(c.y);
    $('[name=crop-x2]', this.$container).val(c.x2);
    $('[name=crop-y2]', this.$container).val(c.y2);
    $('[name=crop-w]', this.$container).val(c.w);
    $('[name=crop-h]', this.$container).val(c.h);
};

Editor.prototype.clearCoords = function clearCoords() {
    $('input[name=^crop-]', this.$container).val('');
};

Editor.prototype.initCropForm = function initCropForm() {

    // Setup cropping "form"
    var thisEditor = this;

    this.$container.on('click', '.DashboardPhotos-editPhoto-save', function (e) {
        e.preventDefault();

        $.ajax({
            url: LcUrl.LangPath + '$dashboard/YourWork/UploadPhoto/',
            type: 'POST',
            data: thisEditor.$container.find(':input').serialize() + '&crop-photo=True',
            dataType: 'json',
            success: function (data, text, jx) {
                if (data.Code) {
                    acb.doJSONAction(data, text, jx);
                }
                else if (data.updated) {
                    // Photo cropped, resized
                    thisEditor.gallery.reloadPhoto(data.fileURI, data.photoID);
                    // Refresh edit panel
                    editSelectedPhoto(thisEditor.gallery.$container);
                }
                else {
                    // Photo uploaded
                    var newImgItem = thisEditor.gallery.appendPhoto(data.fileURI, data.photoID);
                    // Show in edit panel
                    smoothBoxBlock.closeAll(thisEditor.gallery.$container);
                    editSelectedPhoto(thisEditor.gallery.$container, newImgItem);
                }
                $('#crop-photo').slideUp('fast');

                // TODO Close popup #535
            },
            error: function (xhr, er) {
                alert('Sorry, there was an error setting-up your photo. ' + (er || ''));
            }
        });
    });
};

Editor.prototype.setupCropPhoto = function setupCropPhoto() {

    if (this.jcropApi)
        this.jcropApi.destroy();

    var thisEditor = this;

    // Setup img cropping
    var $img = $('.positionphotos-edit-photo > img', this.$container);
    $img.Jcrop({
        onChange: this.showCoords.bind(this),
        onSelect: this.showCoords.bind(this),
        onRelease: this.clearCoords.bind(this),
        aspectRatio: $img.data('target-width') / $img.data('target-height')
    }, function () {

        thisEditor.jcropApi = this;
        // Initial selection to show user that can choose an area
        thisEditor.jcropApi.setSelect([0, 0, $img.width(), $img.height()]);
    });

    return $img;
};

},{"imagesLoaded":29}],21:[function(require,module,exports){
/** Availability: Weekly Schedule section setup
**/
var $ = require('jquery');
var availabilityCalendar = require('LC/availabilityCalendar');
var batchEventHandler = require('LC/batchEventHandler');

exports.on = function () {

    var monthlyList = availabilityCalendar.Monthly.enableAll();

    $.each(monthlyList, function (i, v) {
        var monthly = this;

        // Setuping the calendar data field
        var form = monthly.$el.closest('form.ajax,fieldset.ajax');
        var field = form.find('[name=monthly]');
        if (field.length === 0)
            field = $('<input type="hidden" name="monthly" />').insertAfter(monthly.$el);

        // Save when the form is to be submitted
        form.on('presubmit', function () {
            field.val(JSON.stringify(monthly.getUpdatedData()));
        });

        // Updating field on calendar changes (using batch to avoid hurt performance)
        // and raise change event (this fixes the support for changesNotification
        // and instant-saving).
        monthly.events.on('dataChanged', batchEventHandler(function () {
            field
            .val(JSON.stringify(monthly.getUpdatedData()))
            .change();
        }));
    });
};
},{}],22:[function(require,module,exports){
/**
payment: with the proper html and form
regenerates the button source-code and preview automatically.
**/
var $ = require('jquery');
require('jquery.formatter');

exports.on = function onPaymentAccount(containerSelector) {
  var $c = $(containerSelector);

  var finit = function () {

    // Initialize the formatters on page-ready..
    initFormatters($c);

    changePaymentMethod($c);

  };
  $(finit);
  // and any ajax-post of the form that returns new html:
  $c.on('ajaxFormReturnedHtml', 'form.ajax', finit);
};

/** Initialize the field formatters required by the payment-account-form, based
  on the fields names.
**/
function initFormatters($container) {
  $container.find('[name="birthdate"]').formatter({
    'pattern': '{{99}}/{{99}}/{{9999}}',
    'persistent': false
  });
  $container.find('[name="ssn"]').formatter({
    'pattern': '{{999}}-{{99}}-{{9999}}',
    'persistent': false
  });
}

function changePaymentMethod($container) {

  var $bank = $container.find('.DashboardPaymentAccount-bank'),
    $els = $container.find('.DashboardPaymentAccount-changeMethod')
    .add($bank);

  $container.find('.Actions--changePaymentMethod').on('click', function () {
    $els.toggleClass('is-venmoAccount is-bankAccount');

    if ($bank.hasClass('is-venmoAccount')) {
      // Remove and save numbers
      $bank.find('input').val(function (i, v) {
        $(this).data('prev-val', v);
        return '';
      });
    } else {
      // Restore numbers
      $bank.find('input').val(function (i, v) {
        return $(this).data('prev-val');
      });
    }
  });

}
},{}],23:[function(require,module,exports){
/** Pricing page setup for CRUDL use
**/
var $ = require('jquery');
var TimeSpan = require('LC/TimeSpan');
require('LC/TimeSpanExtra').plugIn(TimeSpan);
var updateTooltips = require('LC/tooltips').updateTooltips;

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (pricingSelector) {
  pricingSelector = pricingSelector || '.DashboardPricing';
  var $pricing = $(pricingSelector).closest('.DashboardSection-page-section'),
    $others = $pricing.siblings()
      .add($pricing.find('.DashboardSection-page-section-introduction'))
      .add($pricing.closest('.DashboardYourWork').siblings());

  var crudl = initCrudl(pricingSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['editor-ready'], function (e, $editor) {

    setupNoPriceRateUpdates($editor);
    setupProviderPackageSliders($editor);
    updateTooltips();
    setupShowMoreAttributesLink($editor);

  });
};

/* Handler for change event on 'not to state price rate', updating related price rate fields.
  Its setuped per editor instance, not as an event delegate.
*/
function setupNoPriceRateUpdates($editor) {
  var 
    pr = $editor.find('[name=price-rate],[name=price-rate-unit]'),
    npr = $editor.find('[name=no-price-rate]');
  npr.on('change', function () {
    pr.prop('disabled', npr.prop('checked'));
  });
  // Initial state:
  npr.change();
}

/** Setup the UI Sliders on the editor.
**/
function setupProviderPackageSliders($editor) {

  /* Houseekeeper pricing */
  function updateAverage($c, minutes) {
    $c.find('[name=provider-average-time]').val(minutes);
    minutes = parseInt(minutes);
    $c.find('.preview .time').text(TimeSpan.fromMinutes(minutes).toSmartString());
  }

  $editor.find(".provider-average-time-slider").each(function () {
    var $c = $(this).closest('[data-slider-value]');
    var average = $c.data('slider-value'),
      step = $c.data('slider-step') || 1;
    if (!average) return;
    var setup = {
      range: "min",
      value: average,
      min: average - 3 * step,
      max: average + 3 * step,
      step: step,
      slide: function (event, ui) {
        updateAverage($c, ui.value);
      }
    };
    var slider = $(this).slider(setup);

    $c.find('.provider-average-time').on('click', 'label', function () {
      var $t = $(this);
      if ($t.hasClass('below-average-label'))
        slider.slider('value', setup.min);
      else if ($t.hasClass('average-label'))
        slider.slider('value', setup.value);
      else if ($t.hasClass('above-average-label'))
        slider.slider('value', setup.max);
      updateAverage($c, slider.slider('value'));
    });

    // Setup the input field, hidden and with initial value synchronized with slider
    var field = $c.find('[name=provider-average-time]');
    field.hide();
    var currentValue = field.val() || average;
    updateAverage($c, currentValue);
    slider.slider('value', currentValue);
  });
}

/** The in-editor link #show-more-attributes must show/hide the container of
  extra attributes for the package/pricing-item. This setups the required handler.
**/
function setupShowMoreAttributesLink($editor) {
  // Handler for 'show-more-attributes' button (used only on edit a package)
  $editor.find('.show-more-attributes').on('click', function () {
    var $t = $(this);
    var atts = $t.siblings('.services-not-checked');
    if (atts.is(':visible')) {
      $t.text($t.data('show-text'));
      atts.stop().hide('fast');
    } else {
      $t.text($t.data('hide-text'));
      atts.stop().show('fast');
    }
    return false;
  });
}
},{}],24:[function(require,module,exports){
/**
  privacySettings: Setup for the specific page-form dashboard/privacy/privacysettings
**/
var $ = require('jquery');
// TODO Implement dependencies comming from app.js instead of direct link
//var smoothBoxBlock = require('smoothBoxBlock');
// TODO Replace dom-ressources by i18n.getText

var privacy = {
  accountLinksSelector: '.DashboardPrivacySettings-myAccount a',
  ressourcesSelector: '.DashboardPrivacy-accountRessources'
};

module.exports = privacy;

privacy.on = function (containerSelector) {
  var $c = $(containerSelector);

  $c.on('click', '.cancel-action', function () {
    smoothBoxBlock.close($c);
  });

  $c.on('ajaxSuccessPostMessageClosed', '.ajax-box', function () {
    window.location.reload();
  });
  
  $c.on('click', privacy.accountLinksSelector, function () {

    var b,
      lres = $c.find(privacy.ressourcesSelector);

    switch ($(this).attr('href')) {
      case '#delete-my-account':
        b = smoothBoxBlock.open(lres.children('.delete-message-confirm').clone(), $c);
        break;
      case '#deactivate-my-account':
        b = smoothBoxBlock.open(lres.children('.deactivate-message-confirm').clone(), $c);
        break;
      case '#reactivate-my-account':
        b = smoothBoxBlock.open(lres.children('.reactivate-message-confirm').clone(), $c);
        break;
      default:
        return true;
    }
    if (b) {
      $('html,body').stop(true, true).animate({ scrollTop: b.offset().top }, 500, null);
    }
    return false;
  });

};
},{}],25:[function(require,module,exports){
/** Service Attributes Validation: implements validations through the 
  'customValidation' approach for 'position service attributes'.
  It validates the required attribute category, almost-one or select-one modes.
**/
var $ = require('jquery');
var getText = require('LC/getText');
var vh = require('LC/validationHelper');
var escapeJQuerySelectorValue = require('LC/jqueryUtils').escapeJQuerySelectorValue;

/** Enable validation of required service attributes on
  the form(s) specified by the selector or provided
**/
exports.setup = function setupServiceAttributesValidation(containerSelector, options) {
  var $c = $(containerSelector);
  options = $.extend({
    requiredSelector: '.DashboardServices-attributes-category.is-required',
    selectOneClass: 'js-validationSelectOne',
    groupErrorClass: 'is-error',
    valErrorTextKey: 'required-attribute-category-error'
  }, options);

  $c.each(function validateServiceAttributes() {
    var f = $(this);
    if (!f.is('form,fieldset')) {
      if (console && console.error) console.error('The element to apply validation must be a form or fieldset');
      return;
    }

    f.data('customValidation', {
      validate: function () {
        var valid = true, lastValid = true;
        var v = vh.findValidationSummary(f);

        f.find(options.requiredSelector).each(function () {
          var fs = $(this);
          var cat = fs.children('.DashboardServices-categoryName').text();
          // What type of validation apply?
          if (fs.is('.' + options.selectOneClass))
          // if the cat is a 'validation-select-one', a 'select' element with a 'positive'
          // :selected value must be checked
            lastValid = !!(fs.find('option:selected').val());
          else
          // Otherwise, look for 'almost one' checked values:
            lastValid = (fs.find('input:checked').length > 0);

          if (!lastValid) {
            valid = false;
            fs.addClass(options.groupErrorClass);
            var err = getText(options.valErrorTextKey, cat);
            if (v.find('li[title="' + escapeJQuerySelectorValue(cat) + '"]').length === 0)
              v.children('ul').append($('<li/>').text(err).attr('title', cat));
          } else {
            fs.removeClass(options.groupErrorClass);
            v.find('li[title="' + escapeJQuerySelectorValue(cat) + '"]').remove();
          }
        });

        if (valid) {
          vh.setValidationSummaryAsValid(f);
        } else {
          vh.setValidationSummaryAsError(f);
        }
        return valid;
      }
    });

  });
};

},{}],26:[function(require,module,exports){
/** It provides the code for the actions of the Verifications section.
**/
var $ = require('jquery');
require('jquery.blockUI');
//var LcUrl = require('../LC/LcUrl');
//var popup = require('../LC/popup');

var actions = exports.actions = {};

actions.facebook = function () {
  /* Facebook connect */
  var FacebookConnect = require('LC/FacebookConnect');
  var fb = new FacebookConnect({
    resultType: 'json',
    urlSection: 'Verify',
    appId: $('html').data('fb-appid'),
    permissions: 'email,user_about_me',
    loadingText: 'Verifing'
  });
  $(document).on(fb.connectedEvent, function () {
    $(document).on('popup-closed', function () {
      location.reload();
    });
  });
  fb.connect();
};

actions.email = function () {
  popup(LcUrl.LangPath + 'Account/$ResendConfirmationEmail/now/', popup.size('small'));
};

var links = exports.links = {
  '#connect-with-facebook': actions.facebook,
  '#confirm-email': actions.email
};

exports.on = function (containerSelector) {
  var $c = $(containerSelector);

  $c.on('click', 'a', function () {
    // Get the action link or empty
    var link = this.getAttribute('href') || '';

    // Execute the action attached to that link
    var action = links[link] || null;
    if (typeof (action) === 'function') {
      action();
      return false;
    }
  });
};

},{}],27:[function(require,module,exports){
/** Verifications page setup for CRUDL use
**/
var $ = require('jquery');

// TODO: Replace by real require and not global LC:
//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;
var initCrudl = LC.initCrudl;

exports.on = function (containerSelector) {
  var $c = $(containerSelector),
    sectionSelector = '.DashboardVerifications',
    $section = $c.find(sectionSelector).closest('.DashboardSection-page-section'),
    $others = $section.siblings()
      .add($section.find('.DashboardSection-page-section-introduction'))
      .add($section.closest('.DashboardAboutYou').siblings());

  var crudl = initCrudl(sectionSelector);

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duration: 'slow' });
  })
  .on(crudl.settings.events['editor-ready'], function (e, $editor) {
    require('./backgroundCheckRequest').setupForm($editor.find('.DashboardBackgroundCheck'));
  });
};

},{"./backgroundCheckRequest":13}],28:[function(require,module,exports){
/** Availability: Weekly Schedule section setup
**/
var $ = require('jquery');
var availabilityCalendar = require('LC/availabilityCalendar');
var batchEventHandler = require('LC/batchEventHandler');

exports.on = function () {

    var workHoursList = availabilityCalendar.WorkHours.enableAll();

    $.each(workHoursList, function (i, v) {
        var workhours = this;

        // Setuping the WorkHours calendar data field
        var form = workhours.$el.closest('form.ajax, fieldset.ajax');
        var field = form.find('[name=workhours]');
        if (field.length === 0)
            field = $('<input type="hidden" name="workhours" />').insertAfter(workhours.$el);

        // Save when the form is to be submitted
        form.on('presubmit', function () {
            field.val(JSON.stringify(workhours.data));
        });

        // Updating field on calendar changes (using batch to avoid hurt performance)
        // and raise change event (this fixes the support for changesNotification
        // and instant-saving).
        workhours.events.on('dataChanged', batchEventHandler(function () {

            field
            .val(JSON.stringify(workhours.data))
            .change();
        }));

        // Disabling calendar on field alltime
        form.find('[name=alltime]').on('change', function () {
            var $t = $(this),
        cl = workhours.classes.disabled;
            if (cl)
                workhours.$el.toggleClass(cl, $t.prop('checked'));
        });

    });
};

},{}],29:[function(require,module,exports){
/*!
 * imagesLoaded v3.1.8
 * JavaScript is all like "You images are done yet or what?"
 * MIT License
 */

( function( window, factory ) { 'use strict';
  // universal module definition

  /*global define: false, module: false, require: false */

  if ( typeof define === 'function' && define.amd ) {
    // AMD
    define( [
      'eventEmitter/EventEmitter',
      'eventie/eventie'
    ], function( EventEmitter, eventie ) {
      return factory( window, EventEmitter, eventie );
    });
  } else if ( typeof exports === 'object' ) {
    // CommonJS
    module.exports = factory(
      window,
      require('wolfy87-eventemitter'),
      require('eventie')
    );
  } else {
    // browser global
    window.imagesLoaded = factory(
      window,
      window.EventEmitter,
      window.eventie
    );
  }

})( window,

// --------------------------  factory -------------------------- //

function factory( window, EventEmitter, eventie ) {

'use strict';

var $ = window.jQuery;
var console = window.console;
var hasConsole = typeof console !== 'undefined';

// -------------------------- helpers -------------------------- //

// extend objects
function extend( a, b ) {
  for ( var prop in b ) {
    a[ prop ] = b[ prop ];
  }
  return a;
}

var objToString = Object.prototype.toString;
function isArray( obj ) {
  return objToString.call( obj ) === '[object Array]';
}

// turn element or nodeList into an array
function makeArray( obj ) {
  var ary = [];
  if ( isArray( obj ) ) {
    // use object if already an array
    ary = obj;
  } else if ( typeof obj.length === 'number' ) {
    // convert nodeList to array
    for ( var i=0, len = obj.length; i < len; i++ ) {
      ary.push( obj[i] );
    }
  } else {
    // array of single index
    ary.push( obj );
  }
  return ary;
}

  // -------------------------- imagesLoaded -------------------------- //

  /**
   * @param {Array, Element, NodeList, String} elem
   * @param {Object or Function} options - if function, use as callback
   * @param {Function} onAlways - callback function
   */
  function ImagesLoaded( elem, options, onAlways ) {
    // coerce ImagesLoaded() without new, to be new ImagesLoaded()
    if ( !( this instanceof ImagesLoaded ) ) {
      return new ImagesLoaded( elem, options );
    }
    // use elem as selector string
    if ( typeof elem === 'string' ) {
      elem = document.querySelectorAll( elem );
    }

    this.elements = makeArray( elem );
    this.options = extend( {}, this.options );

    if ( typeof options === 'function' ) {
      onAlways = options;
    } else {
      extend( this.options, options );
    }

    if ( onAlways ) {
      this.on( 'always', onAlways );
    }

    this.getImages();

    if ( $ ) {
      // add jQuery Deferred object
      this.jqDeferred = new $.Deferred();
    }

    // HACK check async to allow time to bind listeners
    var _this = this;
    setTimeout( function() {
      _this.check();
    });
  }

  ImagesLoaded.prototype = new EventEmitter();

  ImagesLoaded.prototype.options = {};

  ImagesLoaded.prototype.getImages = function() {
    this.images = [];

    // filter & find items if we have an item selector
    for ( var i=0, len = this.elements.length; i < len; i++ ) {
      var elem = this.elements[i];
      // filter siblings
      if ( elem.nodeName === 'IMG' ) {
        this.addImage( elem );
      }
      // find children
      // no non-element nodes, #143
      var nodeType = elem.nodeType;
      if ( !nodeType || !( nodeType === 1 || nodeType === 9 || nodeType === 11 ) ) {
        continue;
      }
      var childElems = elem.querySelectorAll('img');
      // concat childElems to filterFound array
      for ( var j=0, jLen = childElems.length; j < jLen; j++ ) {
        var img = childElems[j];
        this.addImage( img );
      }
    }
  };

  /**
   * @param {Image} img
   */
  ImagesLoaded.prototype.addImage = function( img ) {
    var loadingImage = new LoadingImage( img );
    this.images.push( loadingImage );
  };

  ImagesLoaded.prototype.check = function() {
    var _this = this;
    var checkedCount = 0;
    var length = this.images.length;
    this.hasAnyBroken = false;
    // complete if no images
    if ( !length ) {
      this.complete();
      return;
    }

    function onConfirm( image, message ) {
      if ( _this.options.debug && hasConsole ) {
        console.log( 'confirm', image, message );
      }

      _this.progress( image );
      checkedCount++;
      if ( checkedCount === length ) {
        _this.complete();
      }
      return true; // bind once
    }

    for ( var i=0; i < length; i++ ) {
      var loadingImage = this.images[i];
      loadingImage.on( 'confirm', onConfirm );
      loadingImage.check();
    }
  };

  ImagesLoaded.prototype.progress = function( image ) {
    this.hasAnyBroken = this.hasAnyBroken || !image.isLoaded;
    // HACK - Chrome triggers event before object properties have changed. #83
    var _this = this;
    setTimeout( function() {
      _this.emit( 'progress', _this, image );
      if ( _this.jqDeferred && _this.jqDeferred.notify ) {
        _this.jqDeferred.notify( _this, image );
      }
    });
  };

  ImagesLoaded.prototype.complete = function() {
    var eventName = this.hasAnyBroken ? 'fail' : 'done';
    this.isComplete = true;
    var _this = this;
    // HACK - another setTimeout so that confirm happens after progress
    setTimeout( function() {
      _this.emit( eventName, _this );
      _this.emit( 'always', _this );
      if ( _this.jqDeferred ) {
        var jqMethod = _this.hasAnyBroken ? 'reject' : 'resolve';
        _this.jqDeferred[ jqMethod ]( _this );
      }
    });
  };

  // -------------------------- jquery -------------------------- //

  if ( $ ) {
    $.fn.imagesLoaded = function( options, callback ) {
      var instance = new ImagesLoaded( this, options, callback );
      return instance.jqDeferred.promise( $(this) );
    };
  }


  // --------------------------  -------------------------- //

  function LoadingImage( img ) {
    this.img = img;
  }

  LoadingImage.prototype = new EventEmitter();

  LoadingImage.prototype.check = function() {
    // first check cached any previous images that have same src
    var resource = cache[ this.img.src ] || new Resource( this.img.src );
    if ( resource.isConfirmed ) {
      this.confirm( resource.isLoaded, 'cached was confirmed' );
      return;
    }

    // If complete is true and browser supports natural sizes,
    // try to check for image status manually.
    if ( this.img.complete && this.img.naturalWidth !== undefined ) {
      // report based on naturalWidth
      this.confirm( this.img.naturalWidth !== 0, 'naturalWidth' );
      return;
    }

    // If none of the checks above matched, simulate loading on detached element.
    var _this = this;
    resource.on( 'confirm', function( resrc, message ) {
      _this.confirm( resrc.isLoaded, message );
      return true;
    });

    resource.check();
  };

  LoadingImage.prototype.confirm = function( isLoaded, message ) {
    this.isLoaded = isLoaded;
    this.emit( 'confirm', this, message );
  };

  // -------------------------- Resource -------------------------- //

  // Resource checks each src, only once
  // separate class from LoadingImage to prevent memory leaks. See #115

  var cache = {};

  function Resource( src ) {
    this.src = src;
    // add to cache
    cache[ src ] = this;
  }

  Resource.prototype = new EventEmitter();

  Resource.prototype.check = function() {
    // only trigger checking once
    if ( this.isChecked ) {
      return;
    }
    // simulate loading on detached element
    var proxyImage = new Image();
    eventie.bind( proxyImage, 'load', this );
    eventie.bind( proxyImage, 'error', this );
    proxyImage.src = this.src;
    // set flag
    this.isChecked = true;
  };

  // ----- events ----- //

  // trigger specified handler for event type
  Resource.prototype.handleEvent = function( event ) {
    var method = 'on' + event.type;
    if ( this[ method ] ) {
      this[ method ]( event );
    }
  };

  Resource.prototype.onload = function( event ) {
    this.confirm( true, 'onload' );
    this.unbindProxyEvents( event );
  };

  Resource.prototype.onerror = function( event ) {
    this.confirm( false, 'onerror' );
    this.unbindProxyEvents( event );
  };

  // ----- confirm ----- //

  Resource.prototype.confirm = function( isLoaded, message ) {
    this.isConfirmed = true;
    this.isLoaded = isLoaded;
    this.emit( 'confirm', this, message );
  };

  Resource.prototype.unbindProxyEvents = function( event ) {
    eventie.unbind( event.target, 'load', this );
    eventie.unbind( event.target, 'error', this );
  };

  // -----  ----- //

  return ImagesLoaded;

});

},{"eventie":30,"wolfy87-eventemitter":31}],30:[function(require,module,exports){
/*!
 * eventie v1.0.5
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 * MIT license
 */

/*jshint browser: true, undef: true, unused: true */
/*global define: false, module: false */

( function( window ) {

'use strict';

var docElem = document.documentElement;

var bind = function() {};

function getIEEvent( obj ) {
  var event = window.event;
  // add event.target
  event.target = event.target || event.srcElement || obj;
  return event;
}

if ( docElem.addEventListener ) {
  bind = function( obj, type, fn ) {
    obj.addEventListener( type, fn, false );
  };
} else if ( docElem.attachEvent ) {
  bind = function( obj, type, fn ) {
    obj[ type + fn ] = fn.handleEvent ?
      function() {
        var event = getIEEvent( obj );
        fn.handleEvent.call( fn, event );
      } :
      function() {
        var event = getIEEvent( obj );
        fn.call( obj, event );
      };
    obj.attachEvent( "on" + type, obj[ type + fn ] );
  };
}

var unbind = function() {};

if ( docElem.removeEventListener ) {
  unbind = function( obj, type, fn ) {
    obj.removeEventListener( type, fn, false );
  };
} else if ( docElem.detachEvent ) {
  unbind = function( obj, type, fn ) {
    obj.detachEvent( "on" + type, obj[ type + fn ] );
    try {
      delete obj[ type + fn ];
    } catch ( err ) {
      // can't delete window object properties
      obj[ type + fn ] = undefined;
    }
  };
}

var eventie = {
  bind: bind,
  unbind: unbind
};

// ----- module definition ----- //

if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( eventie );
} else if ( typeof exports === 'object' ) {
  // CommonJS
  module.exports = eventie;
} else {
  // browser global
  window.eventie = eventie;
}

})( this );

},{}],31:[function(require,module,exports){
/*!
 * EventEmitter v4.2.6 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */

(function () {
	'use strict';

	/**
	 * Class for managing events.
	 * Can be extended to provide event functionality in other classes.
	 *
	 * @class EventEmitter Manages event registering and emitting.
	 */
	function EventEmitter() {}

	// Shortcuts to improve speed and size
	var proto = EventEmitter.prototype;
	var exports = this;
	var originalGlobalValue = exports.EventEmitter;

	/**
	 * Finds the index of the listener for the event in it's storage array.
	 *
	 * @param {Function[]} listeners Array of listeners to search through.
	 * @param {Function} listener Method to look for.
	 * @return {Number} Index of the specified listener, -1 if not found
	 * @api private
	 */
	function indexOfListener(listeners, listener) {
		var i = listeners.length;
		while (i--) {
			if (listeners[i].listener === listener) {
				return i;
			}
		}

		return -1;
	}

	/**
	 * Alias a method while keeping the context correct, to allow for overwriting of target method.
	 *
	 * @param {String} name The name of the target method.
	 * @return {Function} The aliased method
	 * @api private
	 */
	function alias(name) {
		return function aliasClosure() {
			return this[name].apply(this, arguments);
		};
	}

	/**
	 * Returns the listener array for the specified event.
	 * Will initialise the event object and listener arrays if required.
	 * Will return an object if you use a regex search. The object contains keys for each matched event. So /ba[rz]/ might return an object containing bar and baz. But only if you have either defined them with defineEvent or added some listeners to them.
	 * Each property in the object response is an array of listener functions.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Function[]|Object} All listener functions for the event.
	 */
	proto.getListeners = function getListeners(evt) {
		var events = this._getEvents();
		var response;
		var key;

		// Return a concatenated array of all matching events if
		// the selector is a regular expression.
		if (typeof evt === 'object') {
			response = {};
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					response[key] = events[key];
				}
			}
		}
		else {
			response = events[evt] || (events[evt] = []);
		}

		return response;
	};

	/**
	 * Takes a list of listener objects and flattens it into a list of listener functions.
	 *
	 * @param {Object[]} listeners Raw listener objects.
	 * @return {Function[]} Just the listener functions.
	 */
	proto.flattenListeners = function flattenListeners(listeners) {
		var flatListeners = [];
		var i;

		for (i = 0; i < listeners.length; i += 1) {
			flatListeners.push(listeners[i].listener);
		}

		return flatListeners;
	};

	/**
	 * Fetches the requested listeners via getListeners but will always return the results inside an object. This is mainly for internal use but others may find it useful.
	 *
	 * @param {String|RegExp} evt Name of the event to return the listeners from.
	 * @return {Object} All listener functions for an event in an object.
	 */
	proto.getListenersAsObject = function getListenersAsObject(evt) {
		var listeners = this.getListeners(evt);
		var response;

		if (listeners instanceof Array) {
			response = {};
			response[evt] = listeners;
		}

		return response || listeners;
	};

	/**
	 * Adds a listener function to the specified event.
	 * The listener will not be added if it is a duplicate.
	 * If the listener returns true then it will be removed after it is called.
	 * If you pass a regular expression as the event name then the listener will be added to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListener = function addListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var listenerIsWrapped = typeof listener === 'object';
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key) && indexOfListener(listeners[key], listener) === -1) {
				listeners[key].push(listenerIsWrapped ? listener : {
					listener: listener,
					once: false
				});
			}
		}

		return this;
	};

	/**
	 * Alias of addListener
	 */
	proto.on = alias('addListener');

	/**
	 * Semi-alias of addListener. It will add a listener that will be
	 * automatically removed after it's first execution.
	 *
	 * @param {String|RegExp} evt Name of the event to attach the listener to.
	 * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addOnceListener = function addOnceListener(evt, listener) {
		return this.addListener(evt, {
			listener: listener,
			once: true
		});
	};

	/**
	 * Alias of addOnceListener.
	 */
	proto.once = alias('addOnceListener');

	/**
	 * Defines an event name. This is required if you want to use a regex to add a listener to multiple events at once. If you don't do this then how do you expect it to know what event to add to? Should it just add to every possible match for a regex? No. That is scary and bad.
	 * You need to tell it what event names should be matched by a regex.
	 *
	 * @param {String} evt Name of the event to create.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvent = function defineEvent(evt) {
		this.getListeners(evt);
		return this;
	};

	/**
	 * Uses defineEvent to define multiple events.
	 *
	 * @param {String[]} evts An array of event names to define.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.defineEvents = function defineEvents(evts) {
		for (var i = 0; i < evts.length; i += 1) {
			this.defineEvent(evts[i]);
		}
		return this;
	};

	/**
	 * Removes a listener function from the specified event.
	 * When passed a regular expression as the event name, it will remove the listener from all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to remove the listener from.
	 * @param {Function} listener Method to remove from the event.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListener = function removeListener(evt, listener) {
		var listeners = this.getListenersAsObject(evt);
		var index;
		var key;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				index = indexOfListener(listeners[key], listener);

				if (index !== -1) {
					listeners[key].splice(index, 1);
				}
			}
		}

		return this;
	};

	/**
	 * Alias of removeListener
	 */
	proto.off = alias('removeListener');

	/**
	 * Adds listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
	 * You can also pass it a regular expression to add the array of listeners to all events that match it.
	 * Yeah, this function does quite a bit. That's probably a bad thing.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.addListeners = function addListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(false, evt, listeners);
	};

	/**
	 * Removes listeners in bulk using the manipulateListeners method.
	 * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be removed.
	 * You can also pass it a regular expression to remove the listeners from all events that match it.
	 *
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeListeners = function removeListeners(evt, listeners) {
		// Pass through to manipulateListeners
		return this.manipulateListeners(true, evt, listeners);
	};

	/**
	 * Edits listeners in bulk. The addListeners and removeListeners methods both use this to do their job. You should really use those instead, this is a little lower level.
	 * The first argument will determine if the listeners are removed (true) or added (false).
	 * If you pass an object as the second argument you can add/remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
	 * You can also pass it an event name and an array of listeners to be added/removed.
	 * You can also pass it a regular expression to manipulate the listeners of all events that match it.
	 *
	 * @param {Boolean} remove True if you want to remove listeners, false if you want to add.
	 * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add/remove from multiple events at once.
	 * @param {Function[]} [listeners] An optional array of listener functions to add/remove.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.manipulateListeners = function manipulateListeners(remove, evt, listeners) {
		var i;
		var value;
		var single = remove ? this.removeListener : this.addListener;
		var multiple = remove ? this.removeListeners : this.addListeners;

		// If evt is an object then pass each of it's properties to this method
		if (typeof evt === 'object' && !(evt instanceof RegExp)) {
			for (i in evt) {
				if (evt.hasOwnProperty(i) && (value = evt[i])) {
					// Pass the single listener straight through to the singular method
					if (typeof value === 'function') {
						single.call(this, i, value);
					}
					else {
						// Otherwise pass back to the multiple function
						multiple.call(this, i, value);
					}
				}
			}
		}
		else {
			// So evt must be a string
			// And listeners must be an array of listeners
			// Loop over it and pass each one to the multiple method
			i = listeners.length;
			while (i--) {
				single.call(this, evt, listeners[i]);
			}
		}

		return this;
	};

	/**
	 * Removes all listeners from a specified event.
	 * If you do not specify an event then all listeners will be removed.
	 * That means every event will be emptied.
	 * You can also pass a regex to remove all events that match it.
	 *
	 * @param {String|RegExp} [evt] Optional name of the event to remove all listeners for. Will remove from every event if not passed.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.removeEvent = function removeEvent(evt) {
		var type = typeof evt;
		var events = this._getEvents();
		var key;

		// Remove different things depending on the state of evt
		if (type === 'string') {
			// Remove all listeners for the specified event
			delete events[evt];
		}
		else if (type === 'object') {
			// Remove all events matching the regex.
			for (key in events) {
				if (events.hasOwnProperty(key) && evt.test(key)) {
					delete events[key];
				}
			}
		}
		else {
			// Remove all listeners in all events
			delete this._events;
		}

		return this;
	};

	/**
	 * Alias of removeEvent.
	 *
	 * Added to mirror the node API.
	 */
	proto.removeAllListeners = alias('removeEvent');

	/**
	 * Emits an event of your choice.
	 * When emitted, every listener attached to that event will be executed.
	 * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
	 * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
	 * So they will not arrive within the array on the other side, they will be separate.
	 * You can also pass a regular expression to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {Array} [args] Optional array of arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emitEvent = function emitEvent(evt, args) {
		var listeners = this.getListenersAsObject(evt);
		var listener;
		var i;
		var key;
		var response;

		for (key in listeners) {
			if (listeners.hasOwnProperty(key)) {
				i = listeners[key].length;

				while (i--) {
					// If the listener returns true then it shall be removed from the event
					// The function is executed either with a basic call or an apply if there is an args array
					listener = listeners[key][i];

					if (listener.once === true) {
						this.removeListener(evt, listener.listener);
					}

					response = listener.listener.apply(this, args || []);

					if (response === this._getOnceReturnValue()) {
						this.removeListener(evt, listener.listener);
					}
				}
			}
		}

		return this;
	};

	/**
	 * Alias of emitEvent
	 */
	proto.trigger = alias('emitEvent');

	/**
	 * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
	 * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
	 *
	 * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
	 * @param {...*} Optional additional arguments to be passed to each listener.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.emit = function emit(evt) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.emitEvent(evt, args);
	};

	/**
	 * Sets the current value to check against when executing listeners. If a
	 * listeners return value matches the one set here then it will be removed
	 * after execution. This value defaults to true.
	 *
	 * @param {*} value The new value to check for when executing listeners.
	 * @return {Object} Current instance of EventEmitter for chaining.
	 */
	proto.setOnceReturnValue = function setOnceReturnValue(value) {
		this._onceReturnValue = value;
		return this;
	};

	/**
	 * Fetches the current value to check against when executing listeners. If
	 * the listeners return value matches this one then it should be removed
	 * automatically. It will return true by default.
	 *
	 * @return {*|Boolean} The current value to check for or the default, true.
	 * @api private
	 */
	proto._getOnceReturnValue = function _getOnceReturnValue() {
		if (this.hasOwnProperty('_onceReturnValue')) {
			return this._onceReturnValue;
		}
		else {
			return true;
		}
	};

	/**
	 * Fetches the events object and creates one if required.
	 *
	 * @return {Object} The events storage object.
	 * @api private
	 */
	proto._getEvents = function _getEvents() {
		return this._events || (this._events = {});
	};

	/**
	 * Reverts the global {@link EventEmitter} to its previous value and returns a reference to this version.
	 *
	 * @return {Function} Non conflicting EventEmitter class.
	 */
	EventEmitter.noConflict = function noConflict() {
		exports.EventEmitter = originalGlobalValue;
		return EventEmitter;
	};

	// Expose the class either via AMD, CommonJS or the global object
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return EventEmitter;
		});
	}
	else if (typeof module === 'object' && module.exports){
		module.exports = EventEmitter;
	}
	else {
		this.EventEmitter = EventEmitter;
	}
}.call(this));

},{}]},{},[9])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvTGNVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvUHJvdmlkZXJQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9nZ2xlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9TZWxlY3RBdHRyaWJ1dGVzLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvYWRkUG9zaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9hcHBvaW50bWVudHNDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2JhY2tncm91bmRDaGVja1JlcXVlc3QuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9jYWxlbmRhclN5bmMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9jaGFuZ2VQcm9maWxlUGhvdG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9lZHVjYXRpb25DcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2dlbmVyYXRlQm9va05vd0J1dHRvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2xpY2Vuc2VzQ3J1ZGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9sb2NhdGlvbnNDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL21hbmFnZVBob3Rvc1VJLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbW9udGhseVNjaGVkdWxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvcGF5bWVudEFjY291bnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9wcmljaW5nQ3J1ZGwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9wcml2YWN5U2V0dGluZ3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9zZXJ2aWNlQXR0cmlidXRlc1ZhbGlkYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC92ZXJpZmljYXRpb25zQWN0aW9ucy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3dlZWtseVNjaGVkdWxlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvaW1hZ2VzTG9hZGVkL2ltYWdlc2xvYWRlZC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvbm9kZV9tb2R1bGVzL2ltYWdlc0xvYWRlZC9ub2RlX21vZHVsZXMvZXZlbnRpZS9ldmVudGllLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvaW1hZ2VzTG9hZGVkL25vZGVfbW9kdWxlcy93b2xmeTg3LWV2ZW50ZW1pdHRlci9FdmVudEVtaXR0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxY0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9VQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKiBJbXBsZW1lbnRzIGEgc2ltaWxhciBMY1VybCBvYmplY3QgbGlrZSB0aGUgc2VydmVyLXNpZGUgb25lLCBiYXNpbmdcclxuICAgIGluIHRoZSBpbmZvcm1hdGlvbiBhdHRhY2hlZCB0byB0aGUgZG9jdW1lbnQgYXQgJ2h0bWwnIHRhZyBpbiB0aGUgXHJcbiAgICAnZGF0YS1iYXNlLXVybCcgYXR0cmlidXRlICh0aGF0cyB2YWx1ZSBpcyB0aGUgZXF1aXZhbGVudCBmb3IgQXBwUGF0aCksXHJcbiAgICBhbmQgdGhlIGxhbmcgaW5mb3JtYXRpb24gYXQgJ2RhdGEtY3VsdHVyZScuXHJcbiAgICBUaGUgcmVzdCBvZiBVUkxzIGFyZSBidWlsdCBmb2xsb3dpbmcgdGhlIHdpbmRvdy5sb2NhdGlvbiBhbmQgc2FtZSBydWxlc1xyXG4gICAgdGhhbiBpbiB0aGUgc2VydmVyLXNpZGUgb2JqZWN0LlxyXG4qKi9cclxuXHJcbnZhciBiYXNlID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1iYXNlLXVybCcpLFxyXG4gICAgbGFuZyA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY3VsdHVyZScpLFxyXG4gICAgbCA9IHdpbmRvdy5sb2NhdGlvbixcclxuICAgIHVybCA9IGwucHJvdG9jb2wgKyAnLy8nICsgbC5ob3N0O1xyXG4vLyBsb2NhdGlvbi5ob3N0IGluY2x1ZGVzIHBvcnQsIGlmIGlzIG5vdCB0aGUgZGVmYXVsdCwgdnMgbG9jYXRpb24uaG9zdG5hbWVcclxuXHJcbmJhc2UgPSBiYXNlIHx8ICcvJztcclxuXHJcbnZhciBMY1VybCA9IHtcclxuICAgIFNpdGVVcmw6IHVybCxcclxuICAgIEFwcFBhdGg6IGJhc2UsXHJcbiAgICBBcHBVcmw6IHVybCArIGJhc2UsXHJcbiAgICBMYW5nSWQ6IGxhbmcsXHJcbiAgICBMYW5nUGF0aDogYmFzZSArIGxhbmcgKyAnLycsXHJcbiAgICBMYW5nVXJsOiB1cmwgKyBiYXNlICsgbGFuZ1xyXG59O1xyXG5MY1VybC5MYW5nVXJsID0gdXJsICsgTGNVcmwuTGFuZ1BhdGg7XHJcbkxjVXJsLkpzb25QYXRoID0gTGNVcmwuTGFuZ1BhdGggKyAnSlNPTi8nO1xyXG5MY1VybC5Kc29uVXJsID0gdXJsICsgTGNVcmwuSnNvblBhdGg7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExjVXJsOyIsIi8qKiBQcm92aWRlclBvc2l0aW9uIGNsYXNzXHJcbiAgSXQgcHJvdmlkZXMgbWluaW11biBsaWtlLWpxdWVyeSBldmVudCBsaXN0ZW5lcnNcclxuICB3aXRoIG1ldGhvZHMgJ29uJyBhbmQgJ29mZicsIGFuZCBpbnRlcm5hbGx5ICd0aGlzLmV2ZW50cydcclxuICBiZWluZyBhIGpRdWVyeS5DYWxsYmFja3MuXHJcbioqL1xyXG52YXIgXHJcbiAgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gIExjVXJsID0gcmVxdWlyZSgnLi9MY1VybCcpLFxyXG4gIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnLi9zbW9vdGhCb3hCbG9jaycpLFxyXG4gIGFqYXhDYWxsYmFja3MgPSByZXF1aXJlKCdMQy9hamF4Q2FsbGJhY2tzJyk7XHJcblxyXG4vKiogQ29uc3RydWN0b3JcclxuKiovXHJcbnZhciBQcm92aWRlclBvc2l0aW9uID0gZnVuY3Rpb24gKHBvc2l0aW9uSWQpIHtcclxuICB0aGlzLnBvc2l0aW9uSWQgPSBwb3NpdGlvbklkO1xyXG5cclxuICAvLyBFdmVudHMgc3VwcG9ydCB0aHJvdWdoIGpxdWVyeS5DYWxsYmFja1xyXG4gIHRoaXMuZXZlbnRzID0gJC5DYWxsYmFja3MoKTtcclxuICB0aGlzLm9uID0gZnVuY3Rpb24gKCkgeyB0aGlzLmV2ZW50cy5hZGQuYXBwbHkodGhpcy5ldmVudHMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpOyByZXR1cm4gdGhpczsgfTtcclxuICB0aGlzLm9mZiA9IGZ1bmN0aW9uICgpIHsgdGhpcy5ldmVudHMucmVtb3ZlLmFwcGx5KHRoaXMuZXZlbnRzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTsgcmV0dXJuIHRoaXM7IH07XHJcbn07XHJcblxyXG4vLyBVc2luZyBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gYXMgcHJvdG90eXBlXHJcblByb3ZpZGVyUG9zaXRpb24ucHJvdG90eXBlID0ge1xyXG4gIGRlY2xpbmVkTWVzc2FnZUNsYXNzOiAnaW5mbycsXHJcbiAgZGVjbGluZWRQb3B1cENsYXNzOiAncG9zaXRpb24tc3RhdGUtY2hhbmdlJyxcclxuICBzdGF0ZUNoYW5nZWRFdmVudDogJ3N0YXRlLWNoYW5nZWQnLFxyXG4gIHN0YXRlQ2hhbmdlZERlY2xpbmVkRXZlbnQ6ICdzdGF0ZS1jaGFuZ2VkLWRlY2xpbmVkJyxcclxuICByZW1vdmVGb3JtU2VsZWN0b3I6ICcuZGVsZXRlLW1lc3NhZ2UtY29uZmlybScsXHJcbiAgcmVtb3ZlRm9ybUNvbnRhaW5lcjogJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2UnLFxyXG4gIHJlbW92ZU1lc3NhZ2VDbGFzczogJ3dhcm5pbmcnLFxyXG4gIHJlbW92ZVBvcHVwQ2xhc3M6ICdwb3NpdGlvbi1zdGF0ZS1jaGFuZ2UnLFxyXG4gIHJlbW92ZWRFdmVudDogJ3JlbW92ZWQnLFxyXG4gIHJlbW92ZUZhaWxlZEV2ZW50OiAncmVtb3ZlLWZhaWxlZCdcclxufTtcclxuXHJcbi8qKiBjaGFuZ2VTdGF0ZSB0byB0aGUgb25lIGdpdmVuLCBpdCB3aWxsIHJhaXNlIGEgc3RhdGVDaGFuZ2VkRXZlbnQgb24gc3VjY2Vzc1xyXG4gIG9yIHN0YXRlQ2hhbmdlZERlY2xpbmVkRXZlbnQgb24gZXJyb3IuXHJcbiAgQHN0YXRlOiAnb24nIG9yICdvZmYnXHJcbioqL1xyXG5Qcm92aWRlclBvc2l0aW9uLnByb3RvdHlwZS5jaGFuZ2VTdGF0ZSA9IGZ1bmN0aW9uIGNoYW5nZVBvc2l0aW9uU3RhdGUoc3RhdGUpIHtcclxuICB2YXIgcGFnZSA9IHN0YXRlID09ICdvbicgPyAnJFJlYWN0aXZhdGUnIDogJyREZWFjdGl2YXRlJztcclxuICB2YXIgJGQgPSAkKCcjbWFpbicpO1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB2YXIgY3R4ID0geyBmb3JtOiAkZCwgYm94OiAkZCB9O1xyXG4gICQuYWpheCh7XHJcbiAgICB1cmw6IExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC9wb3NpdGlvbi8nICsgcGFnZSArICcvP1Bvc2l0aW9uSUQ9JyArIHRoaXMucG9zaXRpb25JZCxcclxuICAgIGNvbnRleHQ6IGN0eCxcclxuICAgIGVycm9yOiBhamF4Q2FsbGJhY2tzLmVycm9yLFxyXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICAgICRkLm9uZSgnYWpheFN1Y2Nlc3NQb3N0JywgZnVuY3Rpb24gKGV2ZW50LCBkYXRhLCB0LCBqLCBjdHgpIHtcclxuICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPiAxMDApIHtcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT0gMTAxKSB7XHJcbiAgICAgICAgICAgIHRoYXQuZXZlbnRzLmZpcmUoc3RhdGUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gU2hvdyBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgbXNnID0gJCgnPGRpdi8+JykuYWRkQ2xhc3ModGhhdC5kZWNsaW5lZE1lc3NhZ2VDbGFzcykuYXBwZW5kKGRhdGEuUmVzdWx0Lk1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKG1zZywgJGQsIHRoYXQuZGVjbGluZWRQb3B1cENsYXNzLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IGZhbHNlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIC8vIFByb2Nlc3MgdGhlIHJlc3VsdCwgdGhhdCBldmVudHVhbGx5IHdpbGwgY2FsbCBhamF4U3VjY2Vzc1Bvc3RcclxuICAgICAgYWpheENhbGxiYWNrcy5kb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangsIGN0eCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICAgIERlbGV0ZSBwb3NpdGlvblxyXG4qKi9cclxuUHJvdmlkZXJQb3NpdGlvbi5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gZGVsZXRlUG9zaXRpb24oKSB7XHJcblxyXG4gICAgdmFyIGMgPSAkKHRoaXMucmVtb3ZlRm9ybUNvbnRhaW5lciksXHJcbiAgICAgICAgZiA9IGMuZmluZCh0aGlzLnJlbW92ZUZvcm1TZWxlY3RvcikuZmlyc3QoKSxcclxuICAgICAgICBwb3B1cEZvcm0gPSBmLmNsb25lKCksXHJcbiAgICAgICAgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgcG9wdXBGb3JtLm9uZSgnYWpheFN1Y2Nlc3NQb3N0JywgJy5hamF4LWJveCcsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xyXG5cclxuICAgICAgICBmdW5jdGlvbiBub3RpZnkoKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoZGF0YS5Db2RlKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDEwMTpcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHRoYXQucmVtb3ZlZEV2ZW50LCBbZGF0YS5SZXN1bHRdKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgMTAzOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZXZlbnRzLmZpcmUodGhhdC5yZW1vdmVGYWlsZWRFdmVudCwgW2RhdGEuUmVzdWx0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSkge1xyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGEuUmVzdWx0ICYmIGRhdGEuUmVzdWx0Lk1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgICAgIHZhciBtc2cgPSAkKCc8ZGl2Lz4nKS5hZGRDbGFzcyh0aGF0LnJlbW92ZU1lc3NhZ2VDbGFzcykuYXBwZW5kKGRhdGEuUmVzdWx0Lk1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGJveCA9IHNtb290aEJveEJsb2NrLm9wZW4obXNnLCBjLCB0aGF0LnJlbW92ZVBvcHVwQ2xhc3MsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogZmFsc2UsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYm94Lm9uKCd4aGlkZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBub3RpZnkoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbm90aWZ5KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gT3BlbiBjb25maXJtYXRpb24gZm9ybVxyXG4gICAgdmFyIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKHBvcHVwRm9ybSwgYywgbnVsbCwgeyBjbG9zYWJsZTogdHJ1ZSB9KTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUHJvdmlkZXJQb3NpdGlvbjsiLCIvKiBGb2N1cyB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgZG9jdW1lbnQgKG9yIGluIEBjb250YWluZXIpXHJcbndpdGggdGhlIGh0bWw1IGF0dHJpYnV0ZSAnYXV0b2ZvY3VzJyAob3IgYWx0ZXJuYXRpdmUgQGNzc1NlbGVjdG9yKS5cclxuSXQncyBmaW5lIGFzIGEgcG9seWZpbGwgYW5kIGZvciBhamF4IGxvYWRlZCBjb250ZW50IHRoYXQgd2lsbCBub3RcclxuZ2V0IHRoZSBicm93c2VyIHN1cHBvcnQgb2YgdGhlIGF0dHJpYnV0ZS5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGF1dG9Gb2N1cyhjb250YWluZXIsIGNzc1NlbGVjdG9yKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCk7XHJcbiAgICBjb250YWluZXIuZmluZChjc3NTZWxlY3RvciB8fCAnW2F1dG9mb2N1c10nKS5mb2N1cygpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGF1dG9Gb2N1czsiLCIvKiogRXh0ZW5kZWQgdG9nZ2xlLXNob3ctaGlkZSBmdW50aW9ucy5cclxuICAgIElhZ29TUkxAZ21haWwuY29tXHJcbiAgICBEZXBlbmRlbmNpZXM6IGpxdWVyeVxyXG4gKiovXHJcbihmdW5jdGlvbigpe1xyXG5cclxuICAgIC8qKiBJbXBsZW1lbnRhdGlvbjogcmVxdWlyZSBqUXVlcnkgYW5kIHJldHVybnMgb2JqZWN0IHdpdGggdGhlXHJcbiAgICAgICAgcHVibGljIG1ldGhvZHMuXHJcbiAgICAgKiovXHJcbiAgICBmdW5jdGlvbiB4dHNoKGpRdWVyeSkge1xyXG4gICAgICAgIHZhciAkID0galF1ZXJ5O1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBIaWRlIGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdoaWRlJyBhbmQgJ2ZhZGVPdXQnIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmZhZGVPdXQob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLnNsaWRlVXAob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdoaWRlJ1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmhpZGUob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneGhpZGUnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgKiBTaG93IGFuIGVsZW1lbnQgdXNpbmcgalF1ZXJ5LCBhbGxvd2luZyB1c2Ugc3RhbmRhcmQgICdzaG93JyBhbmQgJ2ZhZGVJbicgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICogRGVwZW5kaW5nIG9uIG9wdGlvbnMuZWZmZWN0OlxyXG4gICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdmYWRlJzogalF1ZXJ5LmZhZGVPdXRcclxuICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgLy8gV2UgcGVyZm9ybXMgYSBmaXggb24gc3RhbmRhcmQgalF1ZXJ5IGVmZmVjdHNcclxuICAgICAgICAgICAgLy8gdG8gYXZvaWQgYW4gZXJyb3IgdGhhdCBwcmV2ZW50cyBmcm9tIHJ1bm5pbmdcclxuICAgICAgICAgICAgLy8gZWZmZWN0cyBvbiBlbGVtZW50cyB0aGF0IGFyZSBhbHJlYWR5IHZpc2libGUsXHJcbiAgICAgICAgICAgIC8vIHdoYXQgbGV0cyB0aGUgcG9zc2liaWxpdHkgb2YgZ2V0IGEgbWlkZGxlLWFuaW1hdGVkXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gV2UganVzdCBjaGFuZ2UgZGlzcGxheTpub25lLCBmb3JjaW5nIHRvICdpcy12aXNpYmxlJyB0b1xyXG4gICAgICAgICAgICAvLyBiZSBmYWxzZSBhbmQgdGhlbiBydW5uaW5nIHRoZSBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIG5vIGZsaWNrZXJpbmcgZWZmZWN0LCBiZWNhdXNlIGpRdWVyeSBqdXN0IHJlc2V0c1xyXG4gICAgICAgICAgICAvLyBkaXNwbGF5IG9uIGVmZmVjdCBzdGFydC5cclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mYWRlSW4ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2xpZGVEb3duKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnc2hvdydcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNob3cob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgJGUudHJpZ2dlcigneHNob3cnLCBbb3B0aW9uc10pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqIEdlbmVyaWMgdXRpbGl0eSBmb3IgaGlnaGx5IGNvbmZpZ3VyYWJsZSBqUXVlcnkudG9nZ2xlIHdpdGggc3VwcG9ydFxyXG4gICAgICAgICAgICB0byBzcGVjaWZ5IHRoZSB0b2dnbGUgdmFsdWUgZXhwbGljaXR5IGZvciBhbnkga2luZCBvZiBlZmZlY3Q6IGp1c3QgcGFzcyB0cnVlIGFzIHNlY29uZCBwYXJhbWV0ZXIgJ3RvZ2dsZScgdG8gc2hvd1xyXG4gICAgICAgICAgICBhbmQgZmFsc2UgdG8gaGlkZS4gVG9nZ2xlIG11c3QgYmUgc3RyaWN0bHkgYSBCb29sZWFuIHZhbHVlIHRvIGF2b2lkIGF1dG8tZGV0ZWN0aW9uLlxyXG4gICAgICAgICAgICBUb2dnbGUgcGFyYW1ldGVyIGNhbiBiZSBvbWl0dGVkIHRvIGF1dG8tZGV0ZWN0IGl0LCBhbmQgc2Vjb25kIHBhcmFtZXRlciBjYW4gYmUgdGhlIGFuaW1hdGlvbiBvcHRpb25zLlxyXG4gICAgICAgICAgICBBbGwgdGhlIG90aGVycyBiZWhhdmUgZXhhY3RseSBhcyBoaWRlRWxlbWVudCBhbmQgc2hvd0VsZW1lbnQuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gdG9nZ2xlRWxlbWVudChlbGVtZW50LCB0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIG5vdCBhIGJvb2xlYW5cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSAhPT0gdHJ1ZSAmJiB0b2dnbGUgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgYW4gb2JqZWN0LCB0aGVuIGlzIHRoZSBvcHRpb25zIGFzIHNlY29uZCBwYXJhbWV0ZXJcclxuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QodG9nZ2xlKSlcclxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zID0gdG9nZ2xlO1xyXG4gICAgICAgICAgICAgICAgLy8gQXV0by1kZXRlY3QgdG9nZ2xlLCBpdCBjYW4gdmFyeSBvbiBhbnkgZWxlbWVudCBpbiB0aGUgY29sbGVjdGlvbixcclxuICAgICAgICAgICAgICAgIC8vIHRoZW4gZGV0ZWN0aW9uIGFuZCBhY3Rpb24gbXVzdCBiZSBkb25lIHBlciBlbGVtZW50OlxyXG4gICAgICAgICAgICAgICAgJChlbGVtZW50KS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXVzaW5nIGZ1bmN0aW9uLCB3aXRoIGV4cGxpY2l0IHRvZ2dsZSB2YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgISQodGhpcykuaXMoJzp2aXNpYmxlJyksIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRvZ2dsZSlcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLyoqIERvIGpRdWVyeSBpbnRlZ3JhdGlvbiBhcyB4dG9nZ2xlLCB4c2hvdywgeGhpZGVcclxuICAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gcGx1Z0luKGpRdWVyeSkge1xyXG4gICAgICAgICAgICAvKiogdG9nZ2xlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHh0b2dnbGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHRvZ2dsZSA9IGZ1bmN0aW9uIHh0b2dnbGUodG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsIHRvZ2dsZSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBzaG93RWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueHNob3cgPSBmdW5jdGlvbiB4c2hvdyhvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIGhpZGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgICoqL1xyXG4gICAgICAgICAgICBqUXVlcnkuZm4ueGhpZGUgPSBmdW5jdGlvbiB4aGlkZShvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgICBoaWRlRWxlbWVudCh0aGlzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRXhwb3J0aW5nOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQ6IHRvZ2dsZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHNob3dFbGVtZW50OiBzaG93RWxlbWVudCxcclxuICAgICAgICAgICAgaGlkZUVsZW1lbnQ6IGhpZGVFbGVtZW50LFxyXG4gICAgICAgICAgICBwbHVnSW46IHBsdWdJblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTW9kdWxlXHJcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgeHRzaCk7XHJcbiAgICB9IGVsc2UgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgICAgICB2YXIgalF1ZXJ5ID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSB4dHNoKGpRdWVyeSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIE5vcm1hbCBzY3JpcHQgbG9hZCwgaWYgalF1ZXJ5IGlzIGdsb2JhbCAoYXQgd2luZG93KSwgaXRzIGV4dGVuZGVkIGF1dG9tYXRpY2FsbHkgICAgICAgIFxyXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHh0c2god2luZG93LmpRdWVyeSkucGx1Z0luKHdpbmRvdy5qUXVlcnkpO1xyXG4gICAgfVxyXG5cclxufSkoKTsiLCIvKiBTb21lIHV0aWxpdGllcyBmb3IgdXNlIHdpdGggalF1ZXJ5IG9yIGl0cyBleHByZXNzaW9uc1xyXG4gICAgdGhhdCBhcmUgbm90IHBsdWdpbnMuXHJcbiovXHJcbmZ1bmN0aW9uIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoc3RyKSB7XHJcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbICM7JiwuKyp+XFwnOlwiIV4kW1xcXSgpPT58XFwvXSkvZywgJ1xcXFwkMScpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlOiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlXHJcbiAgICB9O1xyXG4iLCJmdW5jdGlvbiBtb3ZlRm9jdXNUbyhlbCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICBtYXJnaW5Ub3A6IDMwLFxyXG4gICAgICAgIGR1cmF0aW9uOiA1MDBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiAkKGVsKS5vZmZzZXQoKS50b3AgLSBvcHRpb25zLm1hcmdpblRvcCB9LCBvcHRpb25zLmR1cmF0aW9uLCBudWxsKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IG1vdmVGb2N1c1RvO1xyXG59IiwiLyoqIEN1c3RvbSBMb2Nvbm9taWNzICdsaWtlIGJsb2NrVUknIHBvcHVwc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCcuL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSxcclxuICAgIGF1dG9Gb2N1cyA9IHJlcXVpcmUoJy4vYXV0b0ZvY3VzJyksXHJcbiAgICBtb3ZlRm9jdXNUbyA9IHJlcXVpcmUoJy4vbW92ZUZvY3VzVG8nKTtcclxucmVxdWlyZSgnLi9qcXVlcnkueHRzaCcpLnBsdWdJbigkKTtcclxuXHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrKGNvbnRlbnRCb3gsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7XHJcbiAgICAvLyBMb2FkIG9wdGlvbnMgb3ZlcndyaXRpbmcgZGVmYXVsdHNcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7XHJcbiAgICAgICAgY2xvc2FibGU6IGZhbHNlLFxyXG4gICAgICAgIGNlbnRlcjogZmFsc2UsXHJcbiAgICAgICAgLyogYXMgYSB2YWxpZCBvcHRpb25zIHBhcmFtZXRlciBmb3IgTEMuaGlkZUVsZW1lbnQgZnVuY3Rpb24gKi9cclxuICAgICAgICBjbG9zZU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgZHVyYXRpb246IDYwMCxcclxuICAgICAgICAgICAgZWZmZWN0OiAnZmFkZSdcclxuICAgICAgICB9LFxyXG4gICAgICAgIGF1dG9mb2N1czogdHJ1ZSxcclxuICAgICAgICBhdXRvZm9jdXNPcHRpb25zOiB7IG1hcmdpblRvcDogNjAgfSxcclxuICAgICAgICB3aWR0aDogJ2F1dG8nXHJcbiAgICB9LCBvcHRpb25zKTtcclxuXHJcbiAgICBjb250ZW50Qm94ID0gJChjb250ZW50Qm94KTtcclxuICAgIHZhciBmdWxsID0gZmFsc2U7XHJcbiAgICBpZiAoYmxvY2tlZCA9PSBkb2N1bWVudCB8fCBibG9ja2VkID09IHdpbmRvdykge1xyXG4gICAgICAgIGJsb2NrZWQgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgZnVsbCA9IHRydWU7XHJcbiAgICB9IGVsc2VcclxuICAgICAgICBibG9ja2VkID0gJChibG9ja2VkKTtcclxuXHJcbiAgICB2YXIgYm94SW5zaWRlQmxvY2tlZCA9ICFibG9ja2VkLmlzKCdib2R5LHRyLHRoZWFkLHRib2R5LHRmb290LHRhYmxlLHVsLG9sLGRsJyk7XHJcblxyXG4gICAgLy8gR2V0dGluZyBib3ggZWxlbWVudCBpZiBleGlzdHMgYW5kIHJlZmVyZW5jaW5nXHJcbiAgICB2YXIgYklEID0gYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJyk7XHJcbiAgICBpZiAoIWJJRClcclxuICAgICAgICBiSUQgPSAoY29udGVudEJveC5hdHRyKCdpZCcpIHx8ICcnKSArIChibG9ja2VkLmF0dHIoJ2lkJykgfHwgJycpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICBpZiAoYklEID09ICctc21vb3RoQm94QmxvY2snKSB7XHJcbiAgICAgICAgYklEID0gJ2lkLScgKyBndWlkR2VuZXJhdG9yKCkgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIH1cclxuICAgIGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcsIGJJRCk7XHJcbiAgICB2YXIgYm94ID0gJCgnIycgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGJJRCkpO1xyXG4gICAgXHJcbiAgICAvLyBIaWRpbmcvY2xvc2luZyBib3g6XHJcbiAgICBpZiAoY29udGVudEJveC5sZW5ndGggPT09IDApIHtcclxuXHJcbiAgICAgICAgYm94LnhoaWRlKG9wdGlvbnMuY2xvc2VPcHRpb25zKTtcclxuXHJcbiAgICAgICAgLy8gUmVzdG9yaW5nIHRoZSBDU1MgcG9zaXRpb24gYXR0cmlidXRlIG9mIHRoZSBibG9ja2VkIGVsZW1lbnRcclxuICAgICAgICAvLyB0byBhdm9pZCBzb21lIHByb2JsZW1zIHdpdGggbGF5b3V0IG9uIHNvbWUgZWRnZSBjYXNlcyBhbG1vc3RcclxuICAgICAgICAvLyB0aGF0IG1heSBiZSBub3QgYSBwcm9ibGVtIGR1cmluZyBibG9ja2luZyBidXQgd2hlbiB1bmJsb2NrZWQuXHJcbiAgICAgICAgdmFyIHByZXYgPSBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nKTtcclxuICAgICAgICBibG9ja2VkLmNzcygncG9zaXRpb24nLCBwcmV2IHx8ICcnKTtcclxuICAgICAgICBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nLCBudWxsKTtcclxuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBib3hjO1xyXG4gICAgaWYgKGJveC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBib3hjID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stZWxlbWVudFwiLz4nKTtcclxuICAgICAgICBib3ggPSAkKCc8ZGl2IGNsYXNzPVwic21vb3RoLWJveC1ibG9jay1vdmVybGF5XCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgYm94LmFkZENsYXNzKGFkZGNsYXNzKTtcclxuICAgICAgICBpZiAoZnVsbCkgYm94LmFkZENsYXNzKCdmdWxsLWJsb2NrJyk7XHJcbiAgICAgICAgYm94LmFwcGVuZChib3hjKTtcclxuICAgICAgICBib3guYXR0cignaWQnLCBiSUQpO1xyXG4gICAgICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKVxyXG4gICAgICAgICAgICBibG9ja2VkLmFwcGVuZChib3gpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZChib3gpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBib3hjID0gYm94LmNoaWxkcmVuKCcuc21vb3RoLWJveC1ibG9jay1lbGVtZW50Jyk7XHJcbiAgICB9XHJcbiAgICAvLyBIaWRkZW4gZm9yIHVzZXIsIGJ1dCBhdmFpbGFibGUgdG8gY29tcHV0ZTpcclxuICAgIGNvbnRlbnRCb3guc2hvdygpO1xyXG4gICAgYm94LnNob3coKS5jc3MoJ29wYWNpdHknLCAwKTtcclxuICAgIC8vIFNldHRpbmcgdXAgdGhlIGJveCBhbmQgc3R5bGVzLlxyXG4gICAgYm94Yy5jaGlsZHJlbigpLnJlbW92ZSgpO1xyXG4gICAgaWYgKG9wdGlvbnMuY2xvc2FibGUpXHJcbiAgICAgICAgYm94Yy5hcHBlbmQoJCgnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cCBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nKSk7XHJcbiAgICBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnLCBvcHRpb25zKTtcclxuICAgIGlmICghYm94Yy5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJykpXHJcbiAgICAgIGJveGNcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIG51bGwsIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJywgdHJ1ZSk7XHJcbiAgICBib3hjLmFwcGVuZChjb250ZW50Qm94KTtcclxuICAgIGJveGMud2lkdGgob3B0aW9ucy53aWR0aCk7XHJcbiAgICBib3guY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgaWYgKGJveEluc2lkZUJsb2NrZWQpIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBpbnNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudDpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgYmxvY2tlZC5jc3MoJ3otaW5kZXgnKSArIDEwKTtcclxuICAgICAgICBpZiAoIWJsb2NrZWQuY3NzKCdwb3NpdGlvbicpIHx8IGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpID09ICdzdGF0aWMnKSB7XHJcbiAgICAgICAgICAgIGJsb2NrZWQuZGF0YSgnc2JiLXByZXZpb3VzLWNzcy1wb3NpdGlvbicsIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpKTtcclxuICAgICAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vb2ZmcyA9IGJsb2NrZWQucG9zaXRpb24oKTtcclxuICAgICAgICBib3guY3NzKCd0b3AnLCAwKTtcclxuICAgICAgICBib3guY3NzKCdsZWZ0JywgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIEJveCBwb3NpdGlvbmluZyBzZXR1cCB3aGVuIG91dHNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudCwgYXMgYSBkaXJlY3QgY2hpbGQgb2YgQm9keTpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgTWF0aC5mbG9vcihOdW1iZXIuTUFYX1ZBTFVFKSk7XHJcbiAgICAgICAgYm94LmNzcyhibG9ja2VkLm9mZnNldCgpKTtcclxuICAgIH1cclxuICAgIC8vIERpbWVuc2lvbnMgbXVzdCBiZSBjYWxjdWxhdGVkIGFmdGVyIGJlaW5nIGFwcGVuZGVkIGFuZCBwb3NpdGlvbiB0eXBlIGJlaW5nIHNldDpcclxuICAgIGJveC53aWR0aChibG9ja2VkLm91dGVyV2lkdGgoKSk7XHJcbiAgICBib3guaGVpZ2h0KGJsb2NrZWQub3V0ZXJIZWlnaHQoKSk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuY2VudGVyKSB7XHJcbiAgICAgICAgYm94Yy5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcbiAgICAgICAgdmFyIGNsLCBjdDtcclxuICAgICAgICBpZiAoZnVsbCkge1xyXG4gICAgICAgICAgICBjdCA9IHNjcmVlbi5oZWlnaHQgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IHNjcmVlbi53aWR0aCAvIDI7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY3QgPSBib3gub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyO1xyXG4gICAgICAgICAgICBjbCA9IGJveC5vdXRlcldpZHRoKHRydWUpIC8gMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2VudGVyID09PSB0cnVlIHx8IG9wdGlvbnMuY2VudGVyID09PSAndmVydGljYWwnKVxyXG4gICAgICAgICAgICBib3hjLmNzcygndG9wJywgY3QgLSBib3hjLm91dGVySGVpZ2h0KHRydWUpIC8gMik7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuY2VudGVyID09PSB0cnVlIHx8IG9wdGlvbnMuY2VudGVyID09PSAnaG9yaXpvbnRhbCcpXHJcbiAgICAgICAgICAgIGJveGMuY3NzKCdsZWZ0JywgY2wgLSBib3hjLm91dGVyV2lkdGgodHJ1ZSkgLyAyKTtcclxuICAgIH1cclxuICAgIC8vIExhc3Qgc2V0dXBcclxuICAgIGF1dG9Gb2N1cyhib3gpO1xyXG4gICAgLy8gU2hvdyBibG9ja1xyXG4gICAgYm94LmFuaW1hdGUoeyBvcGFjaXR5OiAxIH0sIDMwMCk7XHJcbiAgICBpZiAob3B0aW9ucy5hdXRvZm9jdXMpXHJcbiAgICAgICAgbW92ZUZvY3VzVG8oY29udGVudEJveCwgb3B0aW9ucy5hdXRvZm9jdXNPcHRpb25zKTtcclxuICAgIHJldHVybiBib3g7XHJcbn1cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2tDbG9zZUFsbChjb250YWluZXIpIHtcclxuICAgICQoY29udGFpbmVyIHx8IGRvY3VtZW50KS5maW5kKCcuc21vb3RoLWJveC1ibG9jay1vdmVybGF5JykuaGlkZSgpO1xyXG59XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgb3Blbjogc21vb3RoQm94QmxvY2ssXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIGFkZGNsYXNzLCBvcHRpb25zKTsgfSxcclxuICAgICAgICBjbG9zZUFsbDogc21vb3RoQm94QmxvY2tDbG9zZUFsbFxyXG4gICAgfTsiLCIvKipcclxuICBJdCB0b2dnbGVzIGEgZ2l2ZW4gdmFsdWUgd2l0aCB0aGUgbmV4dCBpbiB0aGUgZ2l2ZW4gbGlzdCxcclxuICBvciB0aGUgZmlyc3QgaWYgaXMgdGhlIGxhc3Qgb3Igbm90IG1hdGNoZWQuXHJcbiAgVGhlIHJldHVybmVkIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGRpcmVjdGx5IG9yIFxyXG4gIGNhbiBiZSBhdHRhY2hlZCB0byBhbiBhcnJheSAob3IgYXJyYXkgbGlrZSkgb2JqZWN0IGFzIG1ldGhvZFxyXG4gIChvciB0byBhIHByb3RvdHlwZSBhcyBBcnJheS5wcm90b3R5cGUpIGFuZCB1c2UgaXQgcGFzc2luZ1xyXG4gIG9ubHkgdGhlIGZpcnN0IGFyZ3VtZW50LlxyXG4qKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0b2dnbGUoY3VycmVudCwgZWxlbWVudHMpIHtcclxuICBpZiAodHlwZW9mIChlbGVtZW50cykgPT09ICd1bmRlZmluZWQnICYmXHJcbiAgICAgIHR5cGVvZiAodGhpcy5sZW5ndGgpID09PSAnbnVtYmVyJylcclxuICAgIGVsZW1lbnRzID0gdGhpcztcclxuXHJcbiAgdmFyIGkgPSBlbGVtZW50cy5pbmRleE9mKGN1cnJlbnQpO1xyXG4gIGlmIChpID4gLTEgJiYgaSA8IGVsZW1lbnRzLmxlbmd0aCAtIDEpXHJcbiAgICByZXR1cm4gZWxlbWVudHNbaSArIDFdO1xyXG4gIGVsc2VcclxuICAgIHJldHVybiBlbGVtZW50c1swXTtcclxufTtcclxuIiwiLyoqXHJcbiAgICBVc2VyIHByaXZhdGUgZGFzaGJvYXJkIHNlY3Rpb25cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBMY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyk7XHJcbnZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCdMQy9hamF4Rm9ybXMnKTtcclxuXHJcbi8vIENvZGUgb24gcGFnZSByZWFkeVxyXG4kKGZ1bmN0aW9uICgpIHtcclxuICAgIC8qIFNpZGViYXIgKi9cclxuICAgIHZhciBcclxuICAgIHRvZ2dsZSA9IHJlcXVpcmUoJy4uL0xDL3RvZ2dsZScpLFxyXG4gICAgUHJvdmlkZXJQb3NpdGlvbiA9IHJlcXVpcmUoJy4uL0xDL1Byb3ZpZGVyUG9zaXRpb24nKTtcclxuICAgIC8vIEF0dGFjaGluZyAnY2hhbmdlIHBvc2l0aW9uJyBhY3Rpb24gdG8gdGhlIHNpZGViYXIgbGlua3NcclxuICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdbaHJlZiA9IFwiI3RvZ2dsZVBvc2l0aW9uU3RhdGVcIl0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIFxyXG4gICAgICAkdCA9ICQodGhpcyksXHJcbiAgICAgIHYgPSAkdC50ZXh0KCksXHJcbiAgICAgIG4gPSB0b2dnbGUodiwgWydvbicsICdvZmYnXSksXHJcbiAgICAgIHBvc2l0aW9uSWQgPSAkdC5jbG9zZXN0KCdbZGF0YS1wb3NpdGlvbi1pZF0nKS5kYXRhKCdwb3NpdGlvbi1pZCcpO1xyXG5cclxuICAgICAgICB2YXIgcG9zID0gbmV3IFByb3ZpZGVyUG9zaXRpb24ocG9zaXRpb25JZCk7XHJcbiAgICAgICAgcG9zXHJcbiAgICAub24ocG9zLnN0YXRlQ2hhbmdlZEV2ZW50LCBmdW5jdGlvbiAoc3RhdGUpIHtcclxuICAgICAgICAkdC50ZXh0KHN0YXRlKTtcclxuICAgIH0pXHJcbiAgICAuY2hhbmdlU3RhdGUobik7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy5kZWxldGUtcG9zaXRpb24gYScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcG9zaXRpb25JZCA9ICQodGhpcykuY2xvc2VzdCgnW2RhdGEtcG9zaXRpb24taWRdJykuZGF0YSgncG9zaXRpb24taWQnKTtcclxuICAgICAgICB2YXIgcG9zID0gbmV3IFByb3ZpZGVyUG9zaXRpb24ocG9zaXRpb25JZCk7XHJcblxyXG4gICAgICAgIHBvc1xyXG4gICAgLm9uKHBvcy5yZW1vdmVkRXZlbnQsIGZ1bmN0aW9uIChtc2cpIHtcclxuICAgICAgICAvLyBDdXJyZW50IHBvc2l0aW9uIHBhZ2UgZG9lc24ndCBleGlzdCBhbnltb3JlLCBvdXQhXHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gTGNVcmwuTGFuZ1BhdGggKyAnZGFzaGJvYXJkL3lvdXItd29yay8nO1xyXG4gICAgfSlcclxuICAgIC5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLyogUHJvbW90ZSAqL1xyXG4gICAgdmFyIGdlbmVyYXRlQm9va05vd0J1dHRvbiA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2dlbmVyYXRlQm9va05vd0J1dHRvbicpO1xyXG4gICAgLy8gTGlzdGVuIG9uIERhc2hib2FyZFByb21vdGUgaW5zdGVhZCBvZiB0aGUgbW9yZSBjbG9zZSBjb250YWluZXIgRGFzaGJvYXJkQm9va05vd0J1dHRvblxyXG4gICAgLy8gYWxsb3dzIHRvIGNvbnRpbnVlIHdvcmtpbmcgd2l0aG91dCByZS1hdHRhY2htZW50IGFmdGVyIGh0bWwtYWpheC1yZWxvYWRzIGZyb20gYWpheEZvcm0uXHJcbiAgICBnZW5lcmF0ZUJvb2tOb3dCdXR0b24ub24oJy5EYXNoYm9hcmRQcm9tb3RlJyk7IC8vJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uJ1xyXG5cclxuICAgIC8qIFByaXZhY3kgKi9cclxuICAgIHZhciBwcml2YWN5U2V0dGluZ3MgPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9wcml2YWN5U2V0dGluZ3MnKTtcclxuICAgIHByaXZhY3lTZXR0aW5ncy5vbignLkRhc2hib2FyZFByaXZhY3knKTtcclxuXHJcbiAgICAvKiBQYXltZW50cyAqL1xyXG4gICAgdmFyIHBheW1lbnRBY2NvdW50ID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvcGF5bWVudEFjY291bnQnKTtcclxuICAgIHBheW1lbnRBY2NvdW50Lm9uKCcuRGFzaGJvYXJkUGF5bWVudHMnKTtcclxuXHJcbiAgICAvKiBhYm91dC15b3UgKi9cclxuICAgICQoJ2h0bWwnKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnLkRhc2hib2FyZEFib3V0WW91IGZvcm0uYWpheCcsIGZ1bmN0aW9uIChlLCAkY29udGFpbmVyKSB7XHJcbiAgICAgICAgaWYgKCRjb250YWluZXIuaXMoJy5EYXNoYm9hcmRBYm91dFlvdScpIHx8ICRjb250YWluZXIuZmluZCgnLkRhc2hib2FyZEFib3V0WW91JykubGVuZ3RoKVxyXG4gICAgICAgICAgICBpbml0QWJvdXRZb3UuYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxuICAgIH0pO1xyXG4gICAgaW5pdEFib3V0WW91KCk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIGluaXQgKi9cclxuICAgICQoJ2h0bWwnKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnLkRhc2hib2FyZFlvdXJXb3JrIGZvcm0uYWpheCcsIGZ1bmN0aW9uIChlLCAkY29udGFpbmVyKSB7XHJcbiAgICAgICAgaWYgKCRjb250YWluZXIuaXMoJy5EYXNoYm9hcmRZb3VyV29yaycpIHx8ICRjb250YWluZXIuZmluZCgnLkRhc2hib2FyZFlvdXJXb3JrJykubGVuZ3RoKVxyXG4gICAgICAgICAgICBpbml0WW91cldvcmtEb20uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcclxuICAgIH0pO1xyXG4gICAgaW5pdFlvdXJXb3JrRG9tKCk7XHJcblxyXG4gICAgLyogQXZhaWxhYmlsdHkgKi9cclxuICAgIGluaXRBdmFpbGFiaWxpdHkoKTtcclxuICAgICQoJy5EYXNoYm9hcmRBdmFpbGFiaWxpdHknKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCBmdW5jdGlvbiAoZSwgJGNvbnRhaW5lcikge1xyXG4gICAgICAgIGlmICgkY29udGFpbmVyLmlzKCcuRGFzaGJvYXJkQXZhaWxhYmlsaXR5JykgfHwgJGNvbnRhaW5lci5maW5kKCcuRGFzaGJvYXJkQXZhaWxhYmlsaXR5JykubGVuZ3RoKVxyXG4gICAgICAgICAgICBpbml0QXZhaWxhYmlsaXR5LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vKipcclxuICAgIEluc3RhbnQgc2F2aW5nIGFuZCBjb3JyZWN0IGNoYW5nZXMgdHJhY2tpbmdcclxuKiovXHJcbmZ1bmN0aW9uIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKHNlY3Rpb25TZWxlY3Rvcikge1xyXG5cclxuICAgIHZhciAkc2VjdGlvbiA9ICQoc2VjdGlvblNlbGVjdG9yKTtcclxuXHJcbiAgICBpZiAoJHNlY3Rpb24uZGF0YSgnaW5zdGFudC1zYXZpbmcnKSkge1xyXG4gICAgICAgICRzZWN0aW9uLm9uKCdjaGFuZ2UnLCAnOmlucHV0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBhamF4Rm9ybXMuZG9JbnN0YW50U2F2aW5nKCRzZWN0aW9uLCBbdGhpc10pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0QWJvdXRZb3UoKSB7XHJcbiAgICAvKiBQcm9maWxlIHBob3RvICovXHJcbiAgICB2YXIgY2hhbmdlUHJvZmlsZVBob3RvID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvY2hhbmdlUHJvZmlsZVBob3RvJyk7XHJcbiAgICBjaGFuZ2VQcm9maWxlUGhvdG8ub24oJy5EYXNoYm9hcmRBYm91dFlvdScpO1xyXG5cclxuICAgIC8qIEFib3V0IHlvdSAvIGVkdWNhdGlvbiAqL1xyXG4gICAgdmFyIGVkdWNhdGlvbiA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2VkdWNhdGlvbkNydWRsJyk7XHJcbiAgICBlZHVjYXRpb24ub24oJy5EYXNoYm9hcmRBYm91dFlvdScpO1xyXG5cclxuICAgIC8qIEFib3V0IHlvdSAvIHZlcmlmaWNhdGlvbnMgKi9cclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNBY3Rpb25zJykub24oJy5EYXNoYm9hcmRWZXJpZmljYXRpb25zJyk7XHJcbiAgICByZXF1aXJlKCcuL2Rhc2hib2FyZC92ZXJpZmljYXRpb25zQ3J1ZGwnKS5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gICAgLy8gSW5zdGFudCBzYXZpbmdcclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkUHVibGljQmlvJyk7XHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZFBlcnNvbmFsV2Vic2l0ZScpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0QXZhaWxhYmlsaXR5KGUpIHtcclxuICAvLyBXZSBuZWVkIHRvIGF2b2lkIHRoaXMgbG9naWMgd2hlbiBhbiBldmVudCBidWJibGVcclxuICAvLyBmcm9tIHRoZSBhbnkgZmllbGRzZXQuYWpheCwgYmVjYXVzZSBpdHMgYSBzdWJmb3JtIGV2ZW50XHJcbiAgLy8gYW5kIG11c3Qgbm90IHJlc2V0IHRoZSBtYWluIGZvcm0gKCM1MDQpXHJcbiAgaWYgKGUgJiYgZS50YXJnZXQgJiYgL2ZpZWxkc2V0L2kudGVzdChlLnRhcmdldC5ub2RlTmFtZSkpXHJcbiAgICByZXR1cm47XHJcblxyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL21vbnRobHlTY2hlZHVsZScpLm9uKCk7XHJcbiAgdmFyIHdlZWtseSA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL3dlZWtseVNjaGVkdWxlJykub24oKTtcclxuICByZXF1aXJlKCcuL2Rhc2hib2FyZC9jYWxlbmRhclN5bmMnKS5vbigpO1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2FwcG9pbnRtZW50c0NydWRsJykub24oJy5EYXNoYm9hcmRBdmFpbGFiaWxpdHknKTtcclxuXHJcbiAgLy8gSW5zdGFudCBzYXZpbmdcclxuICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZFdlZWtseVNjaGVkdWxlJyk7XHJcbiAgc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRNb250aGx5U2NoZWR1bGUnKTtcclxuICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZENhbGVuZGFyU3luYycpO1xyXG59XHJcblxyXG4vKipcclxuICBJbml0aWFsaXplIERvbSBlbGVtZW50cyBhbmQgZXZlbnRzIGhhbmRsZXJzIGZvciBZb3VyLXdvcmsgbG9naWMuXHJcblxyXG4gIE5PVEU6IC5EYXNoYm9hcmRZb3VyV29yayBpcyBhbiBhamF4LWJveCBwYXJlbnQgb2YgdGhlIGZvcm0uYWpheCwgZXZlcnkgc2VjdGlvblxyXG4gIGlzIGluc2lkZSB0aGUgZm9ybSBhbmQgcmVwbGFjZWQgb24gaHRtbCByZXR1cm5lZCBmcm9tIHNlcnZlci5cclxuKiovXHJcbmZ1bmN0aW9uIGluaXRZb3VyV29ya0RvbSgpIHtcclxuICAgIC8qIFlvdXIgd29yayAvIHByaWNpbmcgKi9cclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3ByaWNpbmdDcnVkbCcpLm9uKCk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gc2VydmljZXMgKi9cclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3NlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbicpLnNldHVwKCQoJy5EYXNoYm9hcmRZb3VyV29yayBmb3JtJykpO1xyXG5cclxuICAgIC8vIElmIHdlIGFyZSBpbiBhamF4LWxvYWQsIHJlLWV4ZWN1dGUgcGFnZSBzY3JpcHRzIHRvIHVwZGF0ZSBpbmxpbmUgZ2xvYmFsIHZhcmlhYmxlc1xyXG4gICAgaWYgKGFyZ3VtZW50cyAmJiBhcmd1bWVudHNbM10pIHtcclxuICAgICAgICB2YXIgc2NyaXB0cyA9ICQoYXJndW1lbnRzWzNdLnJlc3BvbnNlVGV4dCkuZmlsdGVyKCdzY3JpcHQnKS5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gKHRoaXMudGV4dCB8fCB0aGlzLnRleHRDb250ZW50IHx8IHRoaXMuaW5uZXJIVE1MIHx8ICcnKTsgfSk7XHJcbiAgICAgICAgLy8gJ2VhY2gnIGZ1bmN0aW9uYWwgc3R5bGUgaXMgbm90IHZhbGlkLCBmb3Igc29tZSByZWFzb24gZXZhbGluZyBmcm9tIHRoZXJlIGRvZXNuJ3Qgd29ya3MsXHJcbiAgICAgICAgLy8gKHNvbWV0aGluZyBsaWtlIGEgZmFrZSB3aW5kb3cgaW5zdGFuY2UpIHNvIHdlIGRvIGl0IHdpdGggYSBzaW1wbGUgbG9vcDpcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcmlwdHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgJC5nbG9iYWxFdmFsKHNjcmlwdHNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBJbml0aWFsaXplIFNlbGVjdEF0dHJpYnV0ZXMgY29tcG9uZW50cyBmb3IgYWxsIGNhdGVnb3JpZXNcclxuICAgIC8vIG9mIHNlcnZpY2UgYXR0cmlidXRlcyBvbiB0aGUgcGFnZS5cclxuICAgIHZhciBTZWxlY3RBdHRyaWJ1dGVzID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvU2VsZWN0QXR0cmlidXRlcycpO1xyXG4gICAgdmFyIGF0dHNMaXN0cyA9IHdpbmRvdy5zZXJ2aWNlQXR0cmlidXRlc0xpc3RzIHx8IHt9O1xyXG4gICAgJChcIi5TZWxlY3RBdHRyaWJ1dGVzLWF1dG9jb21wbGV0ZUlucHV0XCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgJGVsID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgY2F0SWQgPSAkZWwuZGF0YSgnYXV0b2NvbXBsZXRlLWlkJyksXHJcbiAgICAgICAgICAgIHNlbGVjdGVkQXR0cyA9IG5ldyBTZWxlY3RBdHRyaWJ1dGVzKCRlbC5jbG9zZXN0KCcuU2VsZWN0QXR0cmlidXRlcycpLCBjYXRJZCk7XHJcblxyXG4gICAgICAgIC8vIE5PVEU6IFRoZSBkYXRhIGlzIHB1bGxlZCBmcm9tIGEgZ2xvYmFsIG9iamVjdCxcclxuICAgICAgICAvLyB0aGF0cyBhZGRlZCBieSB0aGUgcGFnZSBvbiB0aGUgYm9keSB3aXRoIGEgaW5saW5lIHNjcmlwdC5cclxuICAgICAgICAvLyBDb3VsZCBiZSByZXBsYWNlZCBieSBhbiBBSkFYIGNhbGwgdG8gSlNPTiBkYXRhLCBhZGRpbmdcclxuICAgICAgICAvLyBhIGxvYWRpbmcgc3Bpbm5lciBob3ZlciBTZWxlY3RBdHRyaWJ1dGVzIGVsZW1lbnRzXHJcbiAgICAgICAgLy8gd2hpbGUgbG9hZGluZyB0aGUgJ2F0dHNMaXN0cycgZGF0YS5cclxuICAgICAgICB2YXIgbGlzdCA9IGF0dHNMaXN0c1tjYXRJZF0gfHwgW107XHJcblxyXG4gICAgICAgIHNlbGVjdGVkQXR0cy5zZXR1cEF1dG9jb21wbGV0ZShsaXN0KTtcclxuICAgICAgICBzZWxlY3RlZEF0dHMuZmlsbFdpdGhDaGVja2VkQXR0cmlidXRlcyhsaXN0KTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluc3RhbnQgc2F2aW5nIGFuZCBjb3JyZWN0IGNoYW5nZXMgdHJhY2tpbmdcclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkU2VydmljZXMnKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBjYW5jZWxsYXRpb24gKi9cclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkQ2FuY2VsbGF0aW9uUG9saWN5Jyk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gc2NoZWR1bGluZyAqL1xyXG4gICAgc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRTY2hlZHVsaW5nT3B0aW9ucycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIGxvY2F0aW9ucyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbG9jYXRpb25zQ3J1ZGwnKS5vbignLkRhc2hib2FyZFlvdXJXb3JrJyk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gbGljZW5zZXMgKi9cclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2xpY2Vuc2VzQ3J1ZGwnKS5vbignLkRhc2hib2FyZFlvdXJXb3JrJyk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gcGhvdG9zICovXHJcbiAgICByZXF1aXJlKCcuL2Rhc2hib2FyZC9tYW5hZ2VQaG90b3NVSScpLm9uKCcuRGFzaGJvYXJkUGhvdG9zJyk7XHJcbiAgICAvLyBQaG90b3NVSSBpcyBzcGVjaWFsIGFuZCBjYW5ub3QgZG8gaW5zdGFudC1zYXZpbmcgb24gZm9ybSBjaGFuZ2VzXHJcbiAgICAvLyBiZWNhdXNlIG9mIHRoZSByZS11c2Ugb2YgdGhlIGVkaXRpbmcgZm9ybVxyXG4gICAgLy9zZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZFBob3RvcycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHJldmlld3MgKi9cclxuICAgICQoJy5EYXNoYm9hcmRZb3VyV29yaycpLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCAnZm9ybScsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xyXG4gICAgICAgIC8vIFJlc2V0aW5nIHRoZSBlbWFpbCBhZGRyZXNzZXMgb24gc3VjY2VzcyB0byBhdm9pZCByZXNlbmQgYWdhaW4gbWVzc2FnZXMgYmVjYXVzZVxyXG4gICAgICAgIC8vIG1pc3Rha2Ugb2YgYSBzZWNvbmQgc3VibWl0LlxyXG4gICAgICAgIHZhciB0YiA9ICQoJy5EYXNoYm9hcmRSZXZpZXdzIFtuYW1lPWNsaWVudHNlbWFpbHNdJyk7XHJcbiAgICAgICAgLy8gT25seSBpZiB0aGVyZSB3YXMgYSB2YWx1ZTpcclxuICAgICAgICBpZiAodGIudmFsKCkpIHtcclxuICAgICAgICAgICAgdGJcclxuICAgICAgLnZhbCgnJylcclxuICAgICAgLmF0dHIoJ3BsYWNlaG9sZGVyJywgdGIuZGF0YSgnc3VjY2Vzcy1tZXNzYWdlJykpXHJcbiAgICAgICAgICAgIC8vIHN1cHBvcnQgZm9yIElFLCAnbm9uLXBsYWNlaG9sZGVyLWJyb3dzZXJzJ1xyXG4gICAgICAucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBhZGQtcG9zaXRpb24gKi9cclxuICAgIHZhciBhZGRQb3NpdGlvbiA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2FkZFBvc2l0aW9uJyk7XHJcbiAgICBhZGRQb3NpdGlvbi5pbml0KCcuRGFzaGJvYXJkQWRkUG9zaXRpb24nKTtcclxuICAgICQoJ2JvZHknKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnLkRhc2hib2FyZEFkZFBvc2l0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFkZFBvc2l0aW9uLmluaXQoKTtcclxuICAgIH0pO1xyXG59IiwiLyoqXHJcbiAgICBDbGFzcyB0byBtYW5hZ2UgdGhlIHNlbGVjdGlvbiBvZiBhdHRyaWJ1dGVzLCBtYWlubHkgZnJvbSBhbiBcclxuICAgIGF1dG9jb21wbGV0ZSB0byBhIGxpc3Qgb2YgYXR0cmlidXRlcyB3aXRoIHJlbW92YWwgYnV0dG9uXHJcbiAgICBhbmQgdG9vbHRpcC9wb3BvdmVyIGZvciBleHRlbmRlZCBkZXNjcmlwdGlvbi5cclxuICAgIFxyXG4gICAgQ3JlYXRlZCB0byBlbmhhbmNlIGFuZCBzaW1wbGlmZSB0aGUgc2VydmljZS1hdHRyaWJ1dGVzIGludGVyZmFjZVxyXG4gICAgb24gZGFzaGJvYXJkLlxyXG4qKi9cclxuZnVuY3Rpb24gU2VsZWN0QXR0cmlidXRlcygkYywgY2F0ZWdvcnlJZCkge1xyXG5cclxuICAgIHRoaXMuJGMgPSAkYy5hZGRDbGFzcygnU2VsZWN0QXR0cmlidXRlcycpO1xyXG4gICAgdGhpcy4kc2VsID0gJGMuZmluZCgnLlNlbGVjdEF0dHJpYnV0ZXMtc2VsZWN0aW9uJyk7XHJcbiAgICB0aGlzLmNhdGVnb3J5SWQgPSBjYXRlZ29yeUlkO1xyXG4gICAgLy8gQ2FjaGUgbGlzdCBvZiBzZWxlY3RlZCBJRHNcclxuICAgIHRoaXMuc2VsZWN0ZWQgPSBbXTtcclxuICAgIC8vIENhY2hlIG9iamVjdCBvZiBuZXcgYXR0cmlidXRlcyBzZWxlY3RlZFxyXG4gICAgLy8gKHVzaW5nIGFuIG9iamVjdCB3aXRob3V0IHByb3RvdHlwZSBiZWNhdXNlIG9mIFxyXG4gICAgLy8gdGhlIGJldHRlciBwZXJmb3JtYW5jZSBsb29rLXVwLCBhbmQgd2UgbWFpbnRhaW5cclxuICAgIC8vIGEgcmVmZXJlbmNlIHRvIHRoZSB3aG9sZSBvYmplY3QgdG9vKVxyXG4gICAgdGhpcy5uZXdzID0ge307XHJcbiAgICB0aGlzLm5ld3MucHJvdG90eXBlID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLmhhc0lkID0gZnVuY3Rpb24gaGFzSWQoYXR0SWQpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RlZC5pbmRleE9mKGF0dElkKSAhPT0gLTE7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuYWRkSWQgPSBmdW5jdGlvbiBhZGRJZChhdHRJZCkge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWQucHVzaChhdHRJZCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVtb3ZlSWQgPSBmdW5jdGlvbiByZW1vdmVJZChhdHRJZCkge1xyXG5cclxuICAgICAgICAvLyBSZW1vdmUgZnJvbSBzZWxlY3RlZCBvbmVzXHJcbiAgICAgICAgdmFyIGkgPSB0aGlzLnNlbGVjdGVkLmluZGV4T2YocGFyc2VJbnQoYXR0SWQsIDEwKSk7XHJcbiAgICAgICAgaWYgKGkgPiAtMSkge1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zZWxlY3RlZFtpXTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVtb3ZlTmV3ID0gZnVuY3Rpb24gcmVtb3ZlTmV3KGF0dE5hbWUpIHtcclxuICAgICAgICAvLyBSZW1vdmUgZnJvbSBuZXdzXHJcbiAgICAgICAgZGVsZXRlIHRoaXMubmV3c1thdHROYW1lXTtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICAgQ2hlY2sgaWYgdGhlIGdpdmVuIGl0ZW0gZXhpc3RzIGluIHRoZSBcclxuICAgICAgICBzZWxlY3Rpb24sIGVpdGhlciBhbiBJRCBvciBhIG5ld1xyXG4gICAgICAgIGF0dHJpYnV0ZSBuYW1lXHJcbiAgICAqKi9cclxuICAgIHRoaXMuaGFzID0gZnVuY3Rpb24gaGFzKGl0ZW0pIHtcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICB0aGlzLmhhc0lkKGl0ZW0uU2VydmljZUF0dHJpYnV0ZUlEKSB8fFxyXG4gICAgICAgICAgICAoaXRlbS5TZXJ2aWNlQXR0cmlidXRlIGluIHRoaXMubmV3cylcclxuICAgICAgICApO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZShlbCwgc2lsZW50Q2hhbmdlKSB7XHJcblxyXG4gICAgICAgIHZhciAkZWwgPSAkKGVsKSxcclxuICAgICAgICAgICAgY2hlY2sgPSAkZWwuc2libGluZ3MoJ1t0eXBlPWNoZWNrYm94XScpLFxyXG4gICAgICAgICAgICBwYXJlbnQgPSAkZWwuY2xvc2VzdCgnbGknKSxcclxuICAgICAgICAgICAgdmFsID0gY2hlY2sudmFsKCk7XHJcblxyXG4gICAgICAgIGlmICghc2lsZW50Q2hhbmdlKVxyXG4gICAgICAgICAgICAvLyBub3RpZnkgZm9ybSBjaGFuZ2VcclxuICAgICAgICAgICAgY2hlY2suY2hhbmdlKCk7XHJcblxyXG4gICAgICAgIC8vIElzIGFuIElEIChpbnRlZ2VyKSBvciBuZXcgbmFtZT9cclxuICAgICAgICBpZiAoL15cXGQrJC8udGVzdCh2YWwpKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIElkXHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlSWQodmFsKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgZnJvbSBOZXdcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVOZXcodmFsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHBhcmVudC5yZW1vdmUoKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5hZGQgPSBmdW5jdGlvbiBhZGQoaXRlbSwgc2lsZW50Q2hhbmdlKSB7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGlmIGlzIG5vdCBpbiB0aGUgbGlzdCBhbHJlYWR5XHJcbiAgICAgICAgaWYgKHRoaXMuaGFzKGl0ZW0pKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIEFkZCB0byBzZWxlY3RlZCBjYWNoZVxyXG4gICAgICAgIGlmIChpdGVtLlNlcnZpY2VBdHRyaWJ1dGVJRClcclxuICAgICAgICAgICAgdGhpcy5hZGRJZChpdGVtLlNlcnZpY2VBdHRyaWJ1dGVJRCk7XHJcblxyXG4gICAgICAgIHZhciBsaSA9ICQoJzxsaSBjbGFzcz1cIlNlbGVjdEF0dHJpYnV0ZXMtaXRlbVwiLz4nKS5hcHBlbmRUbyh0aGlzLiRzZWwpO1xyXG4gICAgICAgIHZhciBsaW5rID0gJCgnPHNwYW4gY2xhc3M9XCJTZWxlY3RBdHRyaWJ1dGVzLWl0ZW0tbmFtZVwiLz4nKVxyXG4gICAgICAgIC50ZXh0KGl0ZW0uU2VydmljZUF0dHJpYnV0ZSlcclxuICAgICAgICAuYXBwZW5kVG8obGkpXHJcbiAgICAgICAgLnBvcG92ZXIoe1xyXG4gICAgICAgICAgICBjb250ZW50OiBpdGVtLlNlcnZpY2VBdHRyaWJ1dGVEZXNjcmlwdGlvbixcclxuICAgICAgICAgICAgdHJpZ2dlcjogJ2hvdmVyJyxcclxuICAgICAgICAgICAgY29udGFpbmVyOiAnYm9keSdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdmFyICRjaGVjayA9ICQoJzxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgLz4nKVxyXG4gICAgICAgIC5hdHRyKCduYW1lJywgJ3Bvc2l0aW9uc2VydmljZXMtY2F0ZWdvcnlbJyArIGl0ZW0uU2VydmljZUF0dHJpYnV0ZUNhdGVnb3J5SUQgKyAnXS1hdHRyaWJ1dGVbJyArIGl0ZW0uU2VydmljZUF0dHJpYnV0ZUlEICsgJ10nKVxyXG4gICAgICAgIC5hdHRyKCd2YWx1ZScsIGl0ZW0uU2VydmljZUF0dHJpYnV0ZUlEIHx8IGl0ZW0uU2VydmljZUF0dHJpYnV0ZSlcclxuICAgICAgICAuYXBwZW5kVG8obGkpO1xyXG5cclxuICAgICAgICBpZiAoIXNpbGVudENoYW5nZSlcclxuICAgICAgICAgICAgLy8gbm90aWZ5IGZvcm0gY2hhbmdlOlxyXG4gICAgICAgICAgICAkY2hlY2suY2hhbmdlKCk7XHJcblxyXG4gICAgICAgICQoJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJTZWxlY3RBdHRyaWJ1dGVzLWl0ZW0tcmVtb3ZlXCI+WDwvYT4nKVxyXG4gICAgICAgIC5hcHBlbmRUbyhsaSk7XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmFkZE5ldyA9IGZ1bmN0aW9uIGFkZE5ldyhuZXdBdHRyaWJ1dGUpIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiAobmV3QXR0cmlidXRlKSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgLy8gQXZvaWQgZW1wdHkgb3Igd2hpdGVzcGFjZSBuYW1lc1xyXG4gICAgICAgICAgICBpZiAoIW5ld0F0dHJpYnV0ZSB8fCAvXlxccyskLy50ZXN0KG5ld0F0dHJpYnV0ZSkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB2YXIgY3JlYXRlRnJvbU5hbWUgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgLy8gU2VhcmNoIGlmIGV4aXN0cyBvbiB0aGUgc291cmNlIGxpc3Q6XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKHRoaXMuYXV0b2NvbXBsZXRlU2VhcmNoKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgLy8gVXNlIGF1dG9jb21wbGV0ZVNlYXJjaCB0byBsb29rIGZvciBhbiBleGFjdCBtYXRjaCBpblxyXG4gICAgICAgICAgICAgICAgLy8gdGhlIHNvdXJjZSBsaXN0LCBhdm9pZGluZyBhdHRlbXB0cyB0byBhZGQgbmV3IGF0dHJpYnV0ZXNcclxuICAgICAgICAgICAgICAgIC8vIHRoYXQgYWxyZWFkeSBleGlzdHMgaW4gdGhlIHNvdXJjZSBhbmQgaGFzIGFuIElEXHJcbiAgICAgICAgICAgICAgICB2YXIgZm91bmRJdGVtcyA9IHRoaXMuYXV0b2NvbXBsZXRlU2VhcmNoKG5ld0F0dHJpYnV0ZSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZm91bmRJdGVtcyAmJiBmb3VuZEl0ZW1zLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgZmlyc3QgZm91bmQgKGlkZWFsbHkgaXQgbXVzdCBiZSB0aGUgb25seSBvbmUpXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3QXR0cmlidXRlID0gZm91bmRJdGVtc1swXTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBVc2UgdGhpcyByYXRoZXIgdGhhbiBjcmVhdGUgb25lXHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlRnJvbU5hbWUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGNyZWF0ZUZyb21OYW1lKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdBdHRyaWJ1dGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgU2VydmljZUF0dHJpYnV0ZTogbmV3QXR0cmlidXRlLFxyXG4gICAgICAgICAgICAgICAgICAgIFNlcnZpY2VBdHRyaWJ1dGVJRDogMCxcclxuICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlQXR0cmlidXRlRGVzY3JpcHRpb246IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgU2VydmljZUF0dHJpYnV0ZUNhdGVnb3J5SUQ6IHRoaXMuY2F0ZWdvcnlJZCxcclxuICAgICAgICAgICAgICAgICAgICBVc2VyQ2hlY2tlZDogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQWRkIFVJIGVsZW1lbnRcclxuICAgICAgICB2YXIgd2FzQWRkZWQgPSB0aGlzLmFkZChuZXdBdHRyaWJ1dGUpO1xyXG5cclxuICAgICAgICAvLyBJZiBpdCB3YXMgYWRkZWQgYW5kIGlzIGEgbmV3IGF0dHJpYnV0ZSAoSUQ9MClcclxuICAgICAgICBpZiAod2FzQWRkZWQgJiYgbmV3QXR0cmlidXRlLlNlcnZpY2VBdHRyaWJ1dGVJRCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyBBZGQgdG8gY2FjaGU6XHJcbiAgICAgICAgICAgIHRoaXMubmV3c1tuZXdBdHRyaWJ1dGUuU2VydmljZUF0dHJpYnV0ZV0gPSBuZXdBdHRyaWJ1dGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gd2FzQWRkZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEhhbmRsZXJzXHJcbiAgICB2YXIgc2VsZWN0QXR0cyA9IHRoaXM7XHJcblxyXG4gICAgJGMub24oJ2NsaWNrJywgJy5TZWxlY3RBdHRyaWJ1dGVzLWl0ZW0tcmVtb3ZlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNlbGVjdEF0dHMucmVtb3ZlKHRoaXMpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNlbGVjdEF0dHJpYnV0ZXM7XHJcblxyXG5TZWxlY3RBdHRyaWJ1dGVzLnByb3RvdHlwZS5maWxsV2l0aENoZWNrZWRBdHRyaWJ1dGVzID0gZnVuY3Rpb24gZmlsbFdpdGhDaGVja2VkQXR0cmlidXRlcyhhdHRyaWJ1dGVzKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBhdHRyaWJ1dGVzLmZpbHRlcihmdW5jdGlvbiAoYXR0KSB7XHJcbiAgICAgICAgcmV0dXJuIGF0dCAmJiBhdHQuVXNlckNoZWNrZWQ7XHJcbiAgICB9KS5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XHJcbiAgICAgICAgc2VsZi5hZGQoaXRlbSwgdHJ1ZSk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcblNlbGVjdEF0dHJpYnV0ZXMucHJvdG90eXBlLnNldHVwQXV0b2NvbXBsZXRlID0gZnVuY3Rpb24gc2V0dXBBdXRvY29tcGxldGUobGlzdCkge1xyXG5cclxuICAgIHRoaXMuJGF1dG9jb21wbGV0ZSA9IHRoaXMuJGMuZmluZCgnLlNlbGVjdEF0dHJpYnV0ZXMtYXV0b2NvbXBsZXRlJyk7XHJcbiAgICB0aGlzLiRhY0J1dHRvbiA9IHRoaXMuJGF1dG9jb21wbGV0ZS5maW5kKCcuU2VsZWN0QXR0cmlidXRlcy1hdXRvY29tcGxldGVCdXR0b24nKTtcclxuICAgIHRoaXMuJGFjSW5wdXQgPSB0aGlzLiRhdXRvY29tcGxldGUuZmluZCgnLlNlbGVjdEF0dHJpYnV0ZXMtYXV0b2NvbXBsZXRlSW5wdXQnKTtcclxuICAgIHRoaXMuYXV0b2NvbXBsZXRlU291cmNlID0gbGlzdDtcclxuXHJcbiAgICAvLyBSZWZlcmVuY2UgdG8gJ3RoaXMnIGZvciB0aGUgZm9sbG93aW5nIGNsb3N1cmVzXHJcbiAgICB2YXIgc2VsZWN0QXR0cyA9IHRoaXM7XHJcblxyXG4gICAgLyoqXHJcbiAgICBQZXJmb3JtcyBhIHNlYXJjaCBieSBuYW1lIG9uIHRoZSBhdXRvY29tcGxldGUgc291cmNlIGxpc3RcclxuICAgIHVzaW5nIHRoZSBnaXZlbiBleGFjdCwgY2FzZSBpbnNlbnNpdGl2ZSwgbmFtZSBvciBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cclxuICAgICoqL1xyXG4gICAgdGhpcy5hdXRvY29tcGxldGVTZWFyY2ggPSBmdW5jdGlvbiAobmFtZU9yTWF0Y2hlcikge1xyXG5cclxuICAgICAgICB2YXIgbWF0Y2hlciA9IG5hbWVPck1hdGNoZXI7XHJcbiAgICAgICAgaWYgKHR5cGVvZiAobmFtZU9yTWF0Y2hlcikgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIG1hdGNoZXIgPSBuZXcgUmVnRXhwKCdeJyArICQudWkuYXV0b2NvbXBsZXRlLmVzY2FwZVJlZ2V4KG5hbWVPck1hdGNoZXIpICsgJyQnLCAnaScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuICQuZ3JlcCh0aGlzLmF1dG9jb21wbGV0ZVNvdXJjZSwgZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgICAgIC8vIE9ubHkgdGhvc2Ugbm90IHNlbGVjdGVkIHN0aWxsXHJcbiAgICAgICAgICAgIGlmIChzZWxlY3RBdHRzLmhhcyh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBTZWFyY2ggYnkgbmFtZTpcclxuICAgICAgICAgICAgLy8gKHJlcGxhY2VkIG5vbi1icmVha2luZyBzcGFjZSBieSBhIG5vcm1hbCBvbmUpXHJcbiAgICAgICAgICAgIHZhbHVlLnZhbHVlID0gdmFsdWUuU2VydmljZUF0dHJpYnV0ZS5yZXBsYWNlKC9cXHUwMGEwL2csICcgJyk7XHJcbiAgICAgICAgICAgIHZhciBmb3VuZCA9IG1hdGNoZXIudGVzdCh2YWx1ZS52YWx1ZSk7XHJcbiAgICAgICAgICAgIC8vIFJlc3VsdFxyXG4gICAgICAgICAgICByZXR1cm4gZm91bmQ7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vIEF1dG9jb21wbGV0ZSBzZXQtdXBcclxuICAgIHRoaXMuJGFjSW5wdXQuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgICBzb3VyY2U6IGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xyXG4gICAgICAgICAgICAvLyBQYXJ0aWFsIHN0cmluZyBzZWFyY2hcclxuICAgICAgICAgICAgdmFyIG1hdGNoZXIgPSBuZXcgUmVnRXhwKCQudWkuYXV0b2NvbXBsZXRlLmVzY2FwZVJlZ2V4KHJlcXVlc3QudGVybSksICdpJyk7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlKHNlbGVjdEF0dHMuYXV0b2NvbXBsZXRlU2VhcmNoKG1hdGNoZXIpKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG5cclxuICAgICAgICAgICAgc2VsZWN0QXR0cy5hZGQodWkuaXRlbSk7XHJcblxyXG4gICAgICAgICAgICBzZWxlY3RBdHRzLiRhY0lucHV0XHJcbiAgICAgICAgICAgIC8vIENsZWFuLXVwIHZhbHVlXHJcbiAgICAgICAgICAgIC52YWwoJycpO1xyXG4gICAgICAgICAgICAvLyBGb3JjZSBzaG93IGxpc3QgYWdhaW4sXHJcbiAgICAgICAgICAgIC8vIHRoZSAnaW5tZWRpYXRlIGRlbGF5JyBpcyBiZWNhdXNlXHJcbiAgICAgICAgICAgIC8vIHRoaXMgaGFuZGxlciBpcyBmb2xsb3dlZCBieVxyXG4gICAgICAgICAgICAvLyBhICdjbG9zZSBhdXRvY29tcGxldGUnIGFjdGlvbixcclxuICAgICAgICAgICAgLy8gd2UgbmVlZCBvcGVuIGl0IGFmdGVyIHRoYXRcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RBdHRzLiRhY0lucHV0LnRyaWdnZXIoJ3NlbGVjdGF0dHJpYnV0ZXNzaG93bGlzdCcpO1xyXG4gICAgICAgICAgICB9LCAxKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIC8vIFRvIGFsbG93IHNob3cgYWxsIGVsZW1lbnRzOlxyXG4gICAgICAgIG1pbkxlbmd0aDogMFxyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gX3BlcmZvcm1BZGROZXcoKSB7XHJcbiAgICAgICAgc2VsZWN0QXR0cy5hZGROZXcoc2VsZWN0QXR0cy4kYWNJbnB1dC52YWwoKSk7XHJcblxyXG4gICAgICAgIHNlbGVjdEF0dHMuJGFjSW5wdXRcclxuICAgICAgICAvLyBDbGVhbi11cCB2YWx1ZVxyXG4gICAgICAgIC52YWwoJycpXHJcbiAgICAgICAgLy8gRm9yY2Ugc2hvdyBsaXN0IGFnYWluXHJcbiAgICAgICAgLnRyaWdnZXIoJ3NlbGVjdGF0dHJpYnV0ZXNzaG93bGlzdCcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFByZXNzIEVudGVyIG9uIGF1dG9jb21wbGV0ZSB0ZXh0Ym94OlxyXG4gICAgLy8gLSB0byBhdm9pZCB1bndhbnRlZCBmb3JtLXN1Ym1pdFxyXG4gICAgLy8gLSB0byB0cmlnZ2VyIHRoZSBhZGRuZXcgYWN0aW9uXHJcbiAgICB0aGlzLiRhY0lucHV0Lm9uKCdrZXlwcmVzcycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PSAxMykge1xyXG4gICAgICAgICAgICAvLyBhZGRuZXdcclxuICAgICAgICAgICAgX3BlcmZvcm1BZGROZXcoKTtcclxuICAgICAgICAgICAgLy8gQ2FuY2VsIGZvcm0tc3VibWl0OlxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQnV0dG9uIGhhbmRsZXJcclxuICAgIHNlbGVjdEF0dHMuJGMub24oJ2NsaWNrJywgJy5TZWxlY3RBdHRyaWJ1dGVzLWF1dG9jb21wbGV0ZUJ1dHRvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBfcGVyZm9ybUFkZE5ldygpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2hvdyBmdWxsIGxpc3Qgb24gZm9jdXMvaG92ZXJpbmdcclxuICAgIHRoaXMuJGFjSW5wdXQub24oJ2ZvY3VzIHNlbGVjdGF0dHJpYnV0ZXNzaG93bGlzdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIXNlbGVjdEF0dHMuJGFjSW5wdXQuYXV0b2NvbXBsZXRlKCd3aWRnZXQnKS5pcygnOnZpc2libGUnKSlcclxuICAgICAgICAgICAgc2VsZWN0QXR0cy4kYWNJbnB1dC5hdXRvY29tcGxldGUoJ3NlYXJjaCcsICcnKTtcclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKipcclxuKiBBZGQgUG9zaXRpb246IGxvZ2ljIGZvciB0aGUgYWRkLXBvc2l0aW9uIHBhZ2UgdW5kZXIgL2Rhc2hib2FyZC95b3VyLXdvcmsvMC8sXHJcbiAgd2l0aCBhdXRvY29tcGxldGUsIHBvc2l0aW9uIGRlc2NyaXB0aW9uIGFuZCAnYWRkZWQgcG9zaXRpb25zJyBsaXN0LlxyXG5cclxuICBUT0RPOiBDaGVjayBpZiBpcyBtb3JlIGNvbnZlbmllbnQgYSByZWZhY3RvciBhcyBwYXJ0IG9mIExDL1Byb3ZpZGVyUG9zaXRpb24uanNcclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIHNlbGVjdG9ycyA9IHtcclxuICBsaXN0OiAnLkRhc2hib2FyZEFkZFBvc2l0aW9uLXBvc2l0aW9uc0xpc3QnLFxyXG4gIHNlbGVjdFBvc2l0aW9uOiAnLkRhc2hib2FyZEFkZFBvc2l0aW9uLXNlbGVjdFBvc2l0aW9uJyxcclxuICBkZXNjOiAnLkRhc2hib2FyZEFkZFBvc2l0aW9uLXNlbGVjdFBvc2l0aW9uLWRlc2NyaXB0aW9uJ1xyXG59O1xyXG5cclxuZXhwb3J0cy5pbml0ID0gZnVuY3Rpb24gaW5pdEFkZFBvc2l0aW9uKHNlbGVjdG9yKSB7XHJcbiAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCAnLkRhc2hib2FyZEFkZFBvc2l0aW9uJztcclxuICB2YXIgYyA9ICQoc2VsZWN0b3IpO1xyXG5cclxuICAvLyBUZW1wbGF0ZSBwb3NpdGlvbiBpdGVtIHZhbHVlIG11c3QgYmUgcmVzZXQgb24gaW5pdCAoYmVjYXVzZSBzb21lIGZvcm0tcmVjb3ZlcmluZyBicm93c2VyIGZlYXR1cmVzIHRoYXQgcHV0IG9uIGl0IGJhZCB2YWx1ZXMpXHJcbiAgYy5maW5kKHNlbGVjdG9ycy5saXN0ICsgJyBsaS5pcy10ZW1wbGF0ZSBbbmFtZT1wb3NpdGlvbl0nKS52YWwoJycpO1xyXG5cclxuICAvLyBBdXRvY29tcGxldGUgcG9zaXRpb25zIGFuZCBhZGQgdG8gdGhlIGxpc3RcclxuICB2YXIgcG9zaXRpb25zTGlzdCA9IG51bGwsIHRwbCA9IG51bGw7XHJcbiAgdmFyIHBvc2l0aW9uc0F1dG9jb21wbGV0ZSA9IGMuZmluZCgnLkRhc2hib2FyZEFkZFBvc2l0aW9uLXNlbGVjdFBvc2l0aW9uLXNlYXJjaCcpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICBzb3VyY2U6IExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICBtaW5MZW5ndGg6IDAsXHJcbiAgICBzZWxlY3Q6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuXHJcbiAgICAgIHBvc2l0aW9uc0xpc3QgPSBwb3NpdGlvbnNMaXN0IHx8IGMuZmluZChzZWxlY3RvcnMubGlzdCArICcgPiB1bCcpO1xyXG4gICAgICB0cGwgPSB0cGwgfHwgcG9zaXRpb25zTGlzdC5jaGlsZHJlbignLmlzLXRlbXBsYXRlOmVxKDApJyk7XHJcbiAgICAgIC8vIE5vIHZhbHVlLCBubyBhY3Rpb24gOihcclxuICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS52YWx1ZSkgcmV0dXJuO1xyXG5cclxuICAgICAgLy8gQWRkIGlmIG5vdCBleGlzdHMgaW4gdGhlIGxpc3RcclxuICAgICAgaWYgKHBvc2l0aW9uc0xpc3QuY2hpbGRyZW4oKS5maWx0ZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAkKHRoaXMpLmRhdGEoJ3Bvc2l0aW9uLWlkJykgPT0gdWkuaXRlbS52YWx1ZTtcclxuICAgICAgfSkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgLy8gQ3JlYXRlIGl0ZW0gZnJvbSB0ZW1wbGF0ZTpcclxuICAgICAgICBwb3NpdGlvbnNMaXN0LmFwcGVuZCh0cGwuY2xvbmUoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5yZW1vdmVDbGFzcygnaXMtdGVtcGxhdGUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5kYXRhKCdwb3NpdGlvbi1pZCcsIHVpLml0ZW0udmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLmNoaWxkcmVuKCcubmFtZScpLnRleHQodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKSAvLyAubGFiZWxcclxuICAgICAgICAgICAgICAgICAgICAuZW5kKCkuY2hpbGRyZW4oJ1tuYW1lPXBvc2l0aW9uXScpLnZhbCh1aS5pdGVtLnZhbHVlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5lbmQoKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGMuZmluZChzZWxlY3RvcnMuZGVzYyArICcgPiB0ZXh0YXJlYScpLnZhbCh1aS5pdGVtLmRlc2NyaXB0aW9uKTtcclxuXHJcbiAgICAgIC8vIFdlIHdhbnQgc2hvdyB0aGUgbGFiZWwgKHBvc2l0aW9uIG5hbWUpIGluIHRoZSB0ZXh0Ym94LCBub3QgdGhlIGlkLXZhbHVlXHJcbiAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcbiAgICBmb2N1czogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICAvLyBXZSB3YW50IHRoZSBsYWJlbCBpbiB0ZXh0Ym94LCBub3QgdGhlIHZhbHVlXHJcbiAgICAgICQodGhpcykudmFsKHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gTG9hZCBhbGwgcG9zaXRpb25zIGluIGJhY2tncm91bmQgdG8gcmVwbGFjZSB0aGUgYXV0b2NvbXBsZXRlIHNvdXJjZSAoYXZvaWRpbmcgbXVsdGlwbGUsIHNsb3cgbG9vay11cHMpXHJcbiAgLyokLmdldEpTT04oTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgcG9zaXRpb25zQXV0b2NvbXBsZXRlLmF1dG9jb21wbGV0ZSgnb3B0aW9uJywgJ3NvdXJjZScsIGRhdGEpO1xyXG4gIH1cclxuICApOyovXHJcblxyXG4gIC8vIFNob3cgYXV0b2NvbXBsZXRlIG9uICdwbHVzJyBidXR0b25cclxuICBjLmZpbmQoc2VsZWN0b3JzLnNlbGVjdFBvc2l0aW9uICsgJyAuYWRkLWFjdGlvbicpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgIHBvc2l0aW9uc0F1dG9jb21wbGV0ZS5hdXRvY29tcGxldGUoJ3NlYXJjaCcsICcnKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbiAgLy8gUmVtb3ZlIHBvc2l0aW9ucyBmcm9tIHRoZSBsaXN0XHJcbiAgYy5maW5kKHNlbGVjdG9ycy5saXN0ICsgJyA+IHVsJykub24oJ2NsaWNrJywgJ2xpID4gYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICBpZiAoJHQuYXR0cignaHJlZicpID09ICcjcmVtb3ZlLXBvc2l0aW9uJykge1xyXG4gICAgICAvLyBSZW1vdmUgY29tcGxldGUgZWxlbWVudCBmcm9tIHRoZSBsaXN0IChsYWJlbCBhbmQgaGlkZGVuIGZvcm0gdmFsdWUpXHJcbiAgICAgICR0LnBhcmVudCgpLnJlbW92ZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogQXZhaWxhYmlsaXR5OiBjYWxlbmRhciBhcHBvaW50bWVudHMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuXHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICBjcnVkbFNlbGVjdG9yID0gJy5EYXNoYm9hcmRBcHBvaW50bWVudHMnLFxyXG4gICAgJGNydWRsQ29udGFpbmVyID0gJGMuZmluZChjcnVkbFNlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkY3J1ZGxDb250YWluZXIuc2libGluZ3MoKVxyXG4gICAgICAgIC5hZGQoJGNydWRsQ29udGFpbmVyLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSlcclxuICAgICAgICAuYWRkKCRjcnVkbENvbnRhaW5lci5jbG9zZXN0KCcuRGFzaGJvYXJkQXZhaWxhYmlsaXR5Jykuc2libGluZ3MoKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChjcnVkbFNlbGVjdG9yKTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgZWRpdG9yKSB7XHJcbiAgICAvLyBEb25lIGFmdGVyIGEgc21hbGwgZGVsYXkgdG8gbGV0IHRoZSBlZGl0b3IgYmUgdmlzaWJsZVxyXG4gICAgLy8gYW5kIHNldHVwIHdvcmsgYXMgZXhwZWN0ZWRcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICBlZGl0Rm9ybVNldHVwKGVkaXRvcik7XHJcbiAgICB9LCAxMDApO1xyXG4gIH0pO1xyXG5cclxufTtcclxuXHJcbmZ1bmN0aW9uIGVkaXRGb3JtU2V0dXAoZikge1xyXG4gIHZhciByZXBlYXQgPSBmLmZpbmQoJ1tuYW1lPXJlcGVhdF0nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGEgPSBmLmZpbmQoJy5yZXBlYXQtb3B0aW9ucycpO1xyXG4gICAgaWYgKHRoaXMuY2hlY2tlZClcclxuICAgICAgYS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuICAgIGVsc2VcclxuICAgICAgYS5zbGlkZVVwKCdmYXN0Jyk7XHJcbiAgfSk7XHJcbiAgdmFyIGFsbGRheSA9IGYuZmluZCgnW25hbWU9YWxsZGF5XScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYSA9IGZcclxuICAgIC5maW5kKCdbbmFtZT1zdGFydHRpbWVdLFtuYW1lPWVuZHRpbWVdJylcclxuICAgIC5wcm9wKCdkaXNhYmxlZCcsIHRoaXMuY2hlY2tlZCk7XHJcbiAgICBpZiAodGhpcy5jaGVja2VkKVxyXG4gICAgICBhLmhpZGUoJ2Zhc3QnKTtcclxuICAgIGVsc2VcclxuICAgICAgYS5zaG93KCdmYXN0Jyk7XHJcbiAgfSk7XHJcbiAgdmFyIHJlcGVhdEZyZXF1ZW5jeSA9IGYuZmluZCgnW25hbWU9cmVwZWF0LWZyZXF1ZW5jeV0nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGZyZXEgPSAkKHRoaXMpLmNoaWxkcmVuKCc6c2VsZWN0ZWQnKTtcclxuICAgIHZhciB1bml0ID0gZnJlcS5kYXRhKCd1bml0Jyk7XHJcbiAgICBmXHJcbiAgICAuZmluZCgnLnJlcGVhdC1mcmVxdWVuY3ktdW5pdCcpXHJcbiAgICAudGV4dCh1bml0KTtcclxuICAgIC8vIElmIHRoZXJlIGlzIG5vIHVuaXQsIHRoZXJlIGlzIG5vdCBpbnRlcnZhbC9yZXBlYXQtZXZlcnkgZmllbGQ6XHJcbiAgICB2YXIgaW50ZXJ2YWwgPSBmLmZpbmQoJy5yZXBlYXQtZXZlcnknKTtcclxuICAgIGlmICh1bml0KVxyXG4gICAgICBpbnRlcnZhbC5zaG93KCdmYXN0Jyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGludGVydmFsLmhpZGUoJ2Zhc3QnKTtcclxuICAgIC8vIFNob3cgZnJlcXVlbmN5LWV4dHJhLCBpZiB0aGVyZSBpcyBzb21lb25lXHJcbiAgICBmLmZpbmQoJy5mcmVxdWVuY3ktZXh0cmEtJyArIGZyZXEudmFsKCkpLnNsaWRlRG93bignZmFzdCcpO1xyXG4gICAgLy8gSGlkZSBhbGwgb3RoZXIgZnJlcXVlbmN5LWV4dHJhXHJcbiAgICBmLmZpbmQoJy5mcmVxdWVuY3ktZXh0cmE6bm90KC5mcmVxdWVuY3ktZXh0cmEtJyArIGZyZXEudmFsKCkgKyAnKScpLnNsaWRlVXAoJ2Zhc3QnKTtcclxuICB9KTtcclxuICAvLyBhdXRvLXNlbGVjdCBzb21lIG9wdGlvbnMgd2hlbiBpdHMgdmFsdWUgY2hhbmdlXHJcbiAgZi5maW5kKCdbbmFtZT1yZXBlYXQtb2N1cnJlbmNlc10nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgZi5maW5kKCdbbmFtZT1yZXBlYXQtZW5kc11bdmFsdWU9b2N1cnJlbmNlc10nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgfSk7XHJcbiAgZi5maW5kKCdbbmFtZT1yZXBlYXQtZW5kLWRhdGVdJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIGYuZmluZCgnW25hbWU9cmVwZWF0LWVuZHNdW3ZhbHVlPWRhdGVdJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gIH0pO1xyXG4gIC8vIHN0YXJ0LWRhdGUgdHJpZ2dlclxyXG4gIGYuZmluZCgnW25hbWU9c3RhcnRkYXRlXScpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBhdXRvIGZpbGwgZW5kZGF0ZSB3aXRoIHN0YXJ0ZGF0ZSB3aGVuIHRoaXMgbGFzdCBpcyB1cGRhdGVkXHJcbiAgICBmLmZpbmQoJ1tuYW1lPWVuZGRhdGVdJykudmFsKHRoaXMudmFsdWUpO1xyXG4gICAgLy8gaWYgbm8gd2Vlay1kYXlzIG9yIG9ubHkgb25lLCBhdXRvLXNlbGVjdCB0aGUgZGF5IHRoYXQgbWF0Y2hzIHN0YXJ0LWRhdGVcclxuICAgIHZhciB3ZWVrRGF5cyA9IGYuZmluZCgnLndlZWtseS1leHRyYSAud2Vlay1kYXlzIGlucHV0Jyk7XHJcbiAgICBpZiAod2Vla0RheXMuYXJlKCc6Y2hlY2tlZCcsIHsgdW50aWw6IDEgfSkpIHtcclxuICAgICAgdmFyIGRhdGUgPSAkKHRoaXMpLmRhdGVwaWNrZXIoXCJnZXREYXRlXCIpO1xyXG4gICAgICBpZiAoZGF0ZSkge1xyXG4gICAgICAgIHdlZWtEYXlzLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICAgICAgd2Vla0RheXMuZmlsdGVyKCdbdmFsdWU9JyArIGRhdGUuZ2V0RGF5KCkgKyAnXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBJbml0OlxyXG4gIHJlcGVhdC5jaGFuZ2UoKTtcclxuICBhbGxkYXkuY2hhbmdlKCk7XHJcbiAgcmVwZWF0RnJlcXVlbmN5LmNoYW5nZSgpO1xyXG4gIC8vIGFkZCBkYXRlIHBpY2tlcnNcclxuICBhcHBseURhdGVQaWNrZXIoKTtcclxuICAvLyBhZGQgcGxhY2Vob2xkZXIgc3VwcG9ydCAocG9seWZpbGwpXHJcbiAgZi5maW5kKCc6aW5wdXQnKS5wbGFjZWhvbGRlcigpO1xyXG59IiwiLyoqXHJcbiAgUmVxdWVzdGluZyBhIGJhY2tncm91bmQgY2hlY2sgdGhyb3VnaCB0aGUgYmFja2dyb3VuZENoZWNrRWRpdCBmb3JtIGluc2lkZSBhYm91dC15b3UvdmVyaWZpY2F0aW9ucy5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vKipcclxuICBTZXR1cCB0aGUgRE9NIGVsZW1lbnRzIGluIHRoZSBjb250YWluZXIgQCRjXHJcbiAgd2l0aCB0aGUgYmFja2dyb3VuZC1jaGVjay1yZXF1ZXN0IGxvZ2ljLlxyXG4qKi9cclxuZXhwb3J0cy5zZXR1cEZvcm0gPSBmdW5jdGlvbiBzZXR1cEZvcm1CYWNrZ3JvdW5kQ2hlY2soJGMpIHtcclxuXHJcbiAgdmFyIHNlbGVjdGVkSXRlbSA9IG51bGw7XHJcblxyXG4gICRjLm9uKCdjbGljaycsICcuYnV5LWFjdGlvbicsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBcclxuICAgIHZhciBmID0gJGMuZmluZCgnLkRhc2hib2FyZEJhY2tncm91bmRDaGVjay1yZXF1ZXN0Rm9ybScpO1xyXG4gICAgdmFyIGJjaWQgPSAkKHRoaXMpLmRhdGEoJ2JhY2tncm91bmQtY2hlY2staWQnKTtcclxuICAgIHNlbGVjdGVkSXRlbSA9ICQodGhpcykuY2xvc2VzdCgnLkRhc2hib2FyZEJhY2tncm91bmRDaGVjay1pdGVtJyk7XHJcbiAgICB2YXIgcHMxID0gJGMuZmluZCgnLnBvcHVwLmJ1eS1zdGVwLTEnKTtcclxuXHJcbiAgICBmLmZpbmQoJ1tuYW1lPUJhY2tncm91bmRDaGVja0lEXScpLnZhbChiY2lkKTtcclxuICAgIGYuZmluZCgnLm1haW4tYWN0aW9uJykudmFsKCQodGhpcykudGV4dCgpKTtcclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5vcGVuKHBzMSwgJGMsICdiYWNrZ3JvdW5kLWNoZWNrJyk7XHJcbiAgfSk7XHJcblxyXG4gICRjLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCAnLkRhc2hib2FyZEJhY2tncm91bmRDaGVjay1yZXF1ZXN0Rm9ybScsIGZ1bmN0aW9uIChlLCBkYXRhLCB0ZXh0LCBqeCwgY3R4KSB7XHJcbiAgICBpZiAoZGF0YS5Db2RlID09PSAxMTApIHtcclxuICAgICAgdmFyIHBzMiA9ICRjLmZpbmQoJy5wb3B1cC5idXktc3RlcC0yJyk7XHJcbiAgICAgIHZhciBib3ggPSBzbW9vdGhCb3hCbG9jay5vcGVuKHBzMiwgJGMsICdiYWNrZ3JvdW5kLWNoZWNrJyk7XHJcbiAgICAgIC8vIFJlbW92ZSBmcm9tIHRoZSBsaXN0IHRoZSByZXF1ZXN0ZWQgaXRlbVxyXG4gICAgICBzZWxlY3RlZEl0ZW0ucmVtb3ZlKCk7XHJcbiAgICAgIC8vIEZvcmNlIHZpZXdlciBsaXN0IHJlbG9hZFxyXG4gICAgICAkYy50cmlnZ2VyKCdyZWxvYWRMaXN0Jyk7XHJcbiAgICAgIC8vIElmIHRoZXJlIGlzIG5vIG1vcmUgaXRlbXMgaW4gdGhlIGxpc3Q6XHJcbiAgICAgIGlmICgkYy5maW5kKCcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrLWl0ZW0nKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAvLyB0aGUgY2xvc2UgYnV0dG9uIG9uIHRoZSBwb3B1cCBtdXN0IGNsb3NlIHRoZSBlZGl0b3IgdG9vOlxyXG4gICAgICAgIGJveC5maW5kKCcuY2xvc2UtYWN0aW9uJykuYWRkQ2xhc3MoJ2NydWRsLWNhbmNlbCcpO1xyXG4gICAgICAgIC8vIFRoZSBhY3Rpb24gYm94IG11c3QgZGlzYXBwZWFyXHJcbiAgICAgICAgJGMuY2xvc2VzdCgnLmNydWRsJykuZmluZCgnLkJhY2tncm91bmRDaGVja0FjdGlvbkJveCcpLnJlbW92ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG59OyIsIi8qKiBBdmFpbGFiaWxpdHk6IENhbGVuZGFyIFN5bmMgc2VjdGlvbiBzZXR1cFxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICAgIGNvbnRhaW5lclNlbGVjdG9yID0gY29udGFpbmVyU2VsZWN0b3IgfHwgJy5EYXNoYm9hcmRDYWxlbmRhclN5bmMnO1xyXG4gICAgdmFyIGNvbnRhaW5lciA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgICAgIGZpZWxkU2VsZWN0b3IgPSAnLkRhc2hib2FyZENhbGVuZGFyU3luYy1wcml2YXRlVXJsRmllbGQnLFxyXG4gICAgICAgIGJ1dHRvblNlbGVjdG9yID0gJy5EYXNoYm9hcmRDYWxlbmRhclN5bmMtcmVzZXQtYWN0aW9uJztcclxuXHJcbiAgICAvLyBTZWxlY3RpbmcgcHJpdmF0ZS11cmwgZmllbGQgdmFsdWUgb24gZm9jdXMgYW5kIGNsaWNrOlxyXG4gICAgY29udGFpbmVyLmZpbmQoZmllbGRTZWxlY3Rvcikub24oJ2ZvY3VzIGNsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuc2VsZWN0KCk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBSZXNldGluZyBwcml2YXRlLXVybFxyXG4gICAgY29udGFpbmVyXHJcbiAgLm9uKCdjbGljaycsIGJ1dHRvblNlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICB2YXIgdCA9ICQodGhpcyksXHJcbiAgICAgIHVybCA9IHQuYXR0cignaHJlZicpLFxyXG4gICAgICBmaWVsZCA9IGNvbnRhaW5lci5maW5kKGZpZWxkU2VsZWN0b3IpO1xyXG5cclxuICAgICAgZmllbGQudmFsKCcnKTtcclxuXHJcbiAgICAgIGZ1bmN0aW9uIG9uZXJyb3IoKSB7XHJcbiAgICAgICAgICBmaWVsZC52YWwoZmllbGQuZGF0YSgnZXJyb3ItbWVzc2FnZScpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgJC5nZXRKU09OKHVybCwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGZpZWxkLnZhbChkYXRhLlJlc3VsdCkuY2hhbmdlKCk7XHJcbiAgICAgICAgICAgICAgZmllbGRbMF0uc2VsZWN0KCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIG9uZXJyb3IoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfSkuZmFpbChvbmVycm9yKTtcclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufTsiLCIvKiogY2hhbmdlUHJvZmlsZVBob3RvLCBpdCB1c2VzICd1cGxvYWRlcicgdXNpbmcgaHRtbDUsIGFqYXggYW5kIGEgc3BlY2lmaWMgcGFnZVxyXG4gIHRvIG1hbmFnZSBzZXJ2ZXItc2lkZSB1cGxvYWQgb2YgYSBuZXcgdXNlciBwcm9maWxlIHBob3RvLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnTEMvc21vb3RoQm94QmxvY2snKTtcclxuLy8gVE9ETzogcmVpbXBsZW1lbnQgdGhpcyBhbmQgdGhlIHNlcnZlci1zaWRlIGZpbGUgdG8gYXZvaWQgaWZyYW1lcyBhbmQgZXhwb3NpbmcgZ2xvYmFsIGZ1bmN0aW9ucyxcclxuLy8gZGlyZWN0IEFQSSB1c2Ugd2l0aG91dCBpZnJhbWUtbm9ybWFsIHBvc3Qgc3VwcG9ydCAoY3VycmVudCBicm93c2VyIG1hdHJpeCBhbGxvdyB1cyB0aGlzPylcclxuLy8gVE9ETzogaW1wbGVtZW50IGFzIHJlYWwgbW9kdWxhciwgbmV4dCBhcmUgdGhlIGtub3dlZCBtb2R1bGVzIGluIHVzZSBidXQgbm90IGxvYWRpbmcgdGhhdCBhcmUgZXhwZWN0ZWRcclxuLy8gdG8gYmUgaW4gc2NvcGUgcmlnaHQgbm93IGJ1dCBtdXN0IGJlIHVzZWQgd2l0aCB0aGUgbmV4dCBjb2RlIHVuY29tbWVudGVkLlxyXG4vLyByZXF1aXJlKCd1cGxvYWRlcicpO1xyXG4vLyByZXF1aXJlKCdMY1VybCcpO1xyXG4vLyB2YXIgYmxvY2tQcmVzZXRzID0gcmVxdWlyZSgnLi4vTEMvYmxvY2tQcmVzZXRzJylcclxuLy8gdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gICAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICAgICAgdXNlclBob3RvUG9wdXA7XHJcblxyXG4gICAgJGMub24oJ2NsaWNrJywgJ1tocmVmPVwiI2NoYW5nZS1wcm9maWxlLXBob3RvXCJdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHVzZXJQaG90b1BvcHVwID0gcG9wdXAoTGNVcmwuTGFuZ1BhdGggKyAnZGFzaGJvYXJkL0Fib3V0WW91L0NoYW5nZVBob3RvLycsIHsgd2lkdGg6IDcwMCwgaGVpZ2h0OiA2NzAgfSwgbnVsbCwgbnVsbCwgeyBhdXRvRm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE5PVEU6IFdlIGFyZSBleHBvc2luZyBnbG9iYWwgZnVuY3Rpb25zIGZyb20gaGVyZSBiZWNhdXNlIHRoZSBzZXJ2ZXIgcGFnZS9pZnJhbWUgZXhwZWN0cyB0aGlzXHJcbiAgICAvLyB0byB3b3JrLlxyXG4gICAgLy8gVE9ETzogcmVmYWN0b3IgdG8gYXZvaWQgdGhpcyB3YXkuXHJcbiAgICB3aW5kb3cucmVsb2FkVXNlclBob3RvID0gZnVuY3Rpb24gcmVsb2FkVXNlclBob3RvKCkge1xyXG4gICAgICAgICRjLmZpbmQoJy5EYXNoYm9hcmRQdWJsaWNCaW8tcGhvdG8gLmF2YXRhcicpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgc3JjID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xyXG4gICAgICAgICAgICAvLyBhdm9pZCBjYWNoZSB0aGlzIHRpbWVcclxuICAgICAgICAgICAgc3JjID0gc3JjICsgXCI/dj1cIiArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdzcmMnLCBzcmMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB3aW5kb3cuY2xvc2VQb3B1cFVzZXJQaG90byA9IGZ1bmN0aW9uIGNsb3NlUG9wdXBVc2VyUGhvdG8oKSB7XHJcbiAgICAgICAgaWYgKHVzZXJQaG90b1BvcHVwKSB7XHJcbiAgICAgICAgICAgIHVzZXJQaG90b1BvcHVwLmZpbmQoJy5jbG9zZS1wb3B1cCcpLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB3aW5kb3cuZGVsZXRlVXNlclBob3RvID0gZnVuY3Rpb24gZGVsZXRlVXNlclBob3RvKCkge1xyXG5cclxuICAgICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJCgnPGRpdi8+JykuaHRtbChMQy5ibG9ja1ByZXNldHMubG9hZGluZy5tZXNzYWdlKSwgJCgnYm9keScpLCAnJywgeyBjZW50ZXI6ICdob3Jpem9udGFsJyB9KTtcclxuXHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBMY1VybC5MYW5nVXJsICsgXCJkYXNoYm9hcmQvQWJvdXRZb3UvQ2hhbmdlUGhvdG8vP2RlbGV0ZT10cnVlXCIsXHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcclxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogXCJqc29uXCIsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudCA9IChkYXRhLkNvZGUgPT09IDAgPyBkYXRhLlJlc3VsdCA6IGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbigkKCc8ZGl2Lz4nKS50ZXh0KGNvbnRlbnQpLCAkKCdib2R5JyksICcnLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6ICdob3Jpem9udGFsJyB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICByZWxvYWRVc2VyUGhvdG8oKTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlclxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbn07XHJcbiIsIi8qKiBFZHVjYXRpb24gcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vL3JlcXVpcmUoJ0xDL2pxdWVyeS54dHNoJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIHNlY3Rpb25TZWxlY3RvciA9ICcuRGFzaGJvYXJkRWR1Y2F0aW9uJyxcclxuICAgICRzZWN0aW9uID0gJGMuZmluZChzZWN0aW9uU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRzZWN0aW9uLnNpYmxpbmdzKClcclxuICAgICAgICAuYWRkKCRzZWN0aW9uLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSlcclxuICAgICAgICAuYWRkKCRzZWN0aW9uLmNsb3Nlc3QoJy5EYXNoYm9hcmRBYm91dFlvdScpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwoc2VjdGlvblNlbGVjdG9yKTtcclxuICAvL2NydWRsLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctdmlld2VyJ10gPSB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG4gICAgLy8gU2V0dXAgYXV0b2NvbXBsZXRlXHJcbiAgICAkZWRpdG9yLmZpbmQoJ1tuYW1lPWluc3RpdHV0aW9uXScpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0SW5zdGl0dXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICBkZWxheTogMjAwLFxyXG4gICAgICBtaW5MZW5ndGg6IDVcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKipcclxuICBnZW5lcmF0ZUJvb2tOb3dCdXR0b246IHdpdGggdGhlIHByb3BlciBodG1sIGFuZCBmb3JtXHJcbiAgcmVnZW5lcmF0ZXMgdGhlIGJ1dHRvbiBzb3VyY2UtY29kZSBhbmQgcHJldmlldyBhdXRvbWF0aWNhbGx5LlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICBmdW5jdGlvbiByZWdlbmVyYXRlQnV0dG9uQ29kZSgpIHtcclxuICAgIHZhclxyXG4gICAgICBzaXplID0gYy5maW5kKCdbbmFtZT1zaXplXTpjaGVja2VkJykudmFsKCksXHJcbiAgICAgIHBvc2l0aW9uaWQgPSBjLmZpbmQoJ1tuYW1lPXBvc2l0aW9uaWRdOmNoZWNrZWQnKS52YWwoKSxcclxuICAgICAgc291cmNlQ29udGFpbmVyID0gYy5maW5kKCdbbmFtZT1idXR0b24tc291cmNlLWNvZGVdJyksXHJcbiAgICAgIHByZXZpZXdDb250YWluZXIgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvblNpemVzLXByZXZpZXcnKSxcclxuICAgICAgYnV0dG9uVHBsID0gYy5maW5kKCcuRGFzaGJvYXJkQm9va05vd0J1dHRvbi1idXR0b25Db2RlLWJ1dHRvblRlbXBsYXRlJykudGV4dCgpLFxyXG4gICAgICBsaW5rVHBsID0gYy5maW5kKCcuRGFzaGJvYXJkQm9va05vd0J1dHRvbi1idXR0b25Db2RlLWxpbmtUZW1wbGF0ZScpLnRleHQoKSxcclxuICAgICAgdHBsID0gKHNpemUgPT0gJ2xpbmstb25seScgPyBsaW5rVHBsIDogYnV0dG9uVHBsKSxcclxuICAgICAgdHBsVmFycyA9ICQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUnKTtcclxuXHJcbiAgICBwcmV2aWV3Q29udGFpbmVyLmh0bWwodHBsKTtcclxuICAgIHByZXZpZXdDb250YWluZXIuZmluZCgnYScpLmF0dHIoJ2hyZWYnLFxyXG4gICAgICB0cGxWYXJzLmRhdGEoJ2Jhc2UtdXJsJykgKyAocG9zaXRpb25pZCA/IHBvc2l0aW9uaWQgKyAnLycgOiAnJykpO1xyXG4gICAgcHJldmlld0NvbnRhaW5lci5maW5kKCdpbWcnKS5hdHRyKCdzcmMnLFxyXG4gICAgICB0cGxWYXJzLmRhdGEoJ2Jhc2Utc3JjJykgKyBzaXplKTtcclxuICAgIHNvdXJjZUNvbnRhaW5lci52YWwocHJldmlld0NvbnRhaW5lci5odG1sKCkudHJpbSgpKTtcclxuICB9XHJcblxyXG4gIC8vIEZpcnN0IGdlbmVyYXRpb25cclxuICBpZiAoYy5sZW5ndGggPiAwKSByZWdlbmVyYXRlQnV0dG9uQ29kZSgpO1xyXG4gIC8vIGFuZCBvbiBhbnkgZm9ybSBjaGFuZ2VcclxuICBjLm9uKCdjaGFuZ2UnLCAnaW5wdXQnLCByZWdlbmVyYXRlQnV0dG9uQ29kZSk7XHJcbn07IiwiLyoqIExpY2Vuc2VzIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICBsaWNlbnNlc1NlbGVjdG9yID0gJy5EYXNoYm9hcmRMaWNlbnNlcycsXHJcbiAgICAkbGljZW5zZXMgPSAkYy5maW5kKGxpY2Vuc2VzU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRsaWNlbnNlcy5zaWJsaW5ncygpXHJcbiAgICAgIC5hZGQoJGxpY2Vuc2VzLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSlcclxuICAgICAgLmFkZCgkbGljZW5zZXMuY2xvc2VzdCgnLkRhc2hib2FyZFlvdXJXb3JrJykuc2libGluZ3MoKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChsaWNlbnNlc1NlbGVjdG9yKTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqIExvY2F0aW9ucyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBtYXBSZWFkeSA9IHJlcXVpcmUoJ0xDL2dvb2dsZU1hcFJlYWR5Jyk7XHJcbi8vIEluZGlyZWN0bHkgdXNlZDogcmVxdWlyZSgnTEMvaGFzQ29uZmlybVN1cHBvcnQnKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgICAgICBsb2NhdGlvbnNTZWxlY3RvciA9ICcuRGFzaGJvYXJkTG9jYXRpb25zJyxcclxuICAgICAgICAkbG9jYXRpb25zID0gJGMuZmluZChsb2NhdGlvbnNTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAgICAgJG90aGVycyA9ICRsb2NhdGlvbnMuc2libGluZ3MoKVxyXG4gICAgICAgICAgICAuYWRkKCRsb2NhdGlvbnMuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAgICAgICAuYWRkKCRsb2NhdGlvbnMuY2xvc2VzdCgnLkRhc2hib2FyZFlvdXJXb3JrJykuc2libGluZ3MoKSk7XHJcblxyXG4gICAgdmFyIGNydWRsID0gaW5pdENydWRsKGxvY2F0aW9uc1NlbGVjdG9yKTtcclxuXHJcbiAgICBpZiAoY3J1ZGwuZWxlbWVudHMuZGF0YSgnX19sb2NhdGlvbnNDcnVkbF9pbml0aWFsaXplZF9fJykgPT09IHRydWUpIHJldHVybjtcclxuICAgIGNydWRsLmVsZW1lbnRzLmRhdGEoJ19fbG9jYXRpb25zQ3J1ZGxfaW5pdGlhbGl6ZWRfXycsIHRydWUpO1xyXG5cclxuICAgIHZhciBsb2NhdGlvbk1hcDtcclxuXHJcbiAgICBjcnVkbC5lbGVtZW50c1xyXG4gICAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gICAgfSlcclxuICAgIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICAgICAgLy9Gb3JjZSBleGVjdXRpb24gb2YgdGhlICdoYXMtY29uZmlybScgc2NyaXB0XHJcbiAgICAgICAgJGVkaXRvci5maW5kKCdmaWVsZHNldC5oYXMtY29uZmlybSA+IC5jb25maXJtIGlucHV0JykuY2hhbmdlKCk7XHJcblxyXG4gICAgICAgIHNldHVwQ29weUxvY2F0aW9uKCRlZGl0b3IpO1xyXG5cclxuICAgICAgICBsb2NhdGlvbk1hcCA9IHNldHVwR2VvcG9zaXRpb25pbmcoJGVkaXRvcik7XHJcblxyXG4gICAgICAgIHVwZGF0ZVNlY3Rpb25UaXRsZSgkZWRpdG9yKTtcclxuICAgIH0pXHJcbiAgICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcblxyXG4gICAgICAgIGlmIChsb2NhdGlvbk1hcClcclxuICAgICAgICAgICAgbWFwUmVhZHkucmVmcmVzaE1hcChsb2NhdGlvbk1hcCk7XHJcbiAgICB9KVxyXG4gICAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLWhpZGRlbiddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG5cclxuICAgICAgICB1cGRhdGVTZWN0aW9uVGl0bGUoJGVkaXRvcik7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZVNlY3Rpb25UaXRsZSgkZWRpdG9yKSB7XHJcblxyXG4gICAgdmFyIGlzUmFkaXVzID0gJGVkaXRvci5maW5kKCcuaXMtbWluaW11bVJhZGl1c1VpJykubGVuZ3RoID4gMDtcclxuXHJcbiAgICB2YXIgc2VjdGlvblRpdGxlID0gJGVkaXRvci5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKS5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taGVhZGVyJyk7XHJcblxyXG4gICAgaWYgKGlzUmFkaXVzKSB7XHJcbiAgICAgICAgc2VjdGlvblRpdGxlLnRleHQoc2VjdGlvblRpdGxlLmRhdGEoJ3JhZGl1cy10aXRsZScpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2VjdGlvblRpdGxlLnRleHQoc2VjdGlvblRpdGxlLmRhdGEoJ2RlZmF1bHQtdGl0bGUnKSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldHVwQ29weUxvY2F0aW9uKCRlZGl0b3IpIHtcclxuICAgICRlZGl0b3IuZmluZCgnc2VsZWN0LmNvcHktbG9jYXRpb24nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgJHQuY2xvc2VzdCgnLmNydWRsLWZvcm0nKS5yZWxvYWQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpLnJlcGxhY2UoXHJcbiAgICAgICAgICAgICAgICAgICAgL0xvY2F0aW9uSUQ9XFxkKy9naSxcclxuICAgICAgICAgICAgICAgICAgICAnTG9jYXRpb25JRD0nICsgJHQudmFsKCkpICsgJyYnICsgJHQuZGF0YSgnZXh0cmEtcXVlcnknKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBMb2NhdGUgdXNlciBwb3NpdGlvbiBvciB0cmFuc2xhdGUgYWRkcmVzcyB0ZXh0IGludG8gYSBnZW9jb2RlIHVzaW5nXHJcbiAgYnJvd3NlciBhbmQgR29vZ2xlIE1hcHMgc2VydmljZXMuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cEdlb3Bvc2l0aW9uaW5nKCRlZGl0b3IpIHtcclxuICAgIHZhciBtYXA7XHJcbiAgICBtYXBSZWFkeShmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIC8vIFJlZ2lzdGVyIGlmIHVzZXIgc2VsZWN0cyBvciB3cml0ZXMgYSBwb3NpdGlvbiAodG8gbm90IG92ZXJ3cml0ZSBpdCB3aXRoIGF1dG9tYXRpYyBwb3NpdGlvbmluZylcclxuICAgICAgICB2YXIgcG9zaXRpb25lZEJ5VXNlciA9IGZhbHNlO1xyXG4gICAgICAgIC8vIFNvbWUgY29uZnNcclxuICAgICAgICB2YXIgZGV0YWlsZWRab29tTGV2ZWwgPSAxNztcclxuICAgICAgICB2YXIgZ2VuZXJhbFpvb21MZXZlbCA9IDk7XHJcbiAgICAgICAgdmFyIGZvdW5kTG9jYXRpb25zID0ge1xyXG4gICAgICAgICAgICBieVVzZXI6IG51bGwsXHJcbiAgICAgICAgICAgIGJ5R2VvbG9jYXRpb246IG51bGwsXHJcbiAgICAgICAgICAgIGJ5R2VvY29kZTogbnVsbCxcclxuICAgICAgICAgICAgb3JpZ2luYWw6IG51bGxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgbCA9ICRlZGl0b3IuZmluZCgnLmxvY2F0aW9uLW1hcCcpO1xyXG4gICAgICAgIHZhciBtID0gbC5maW5kKCcubWFwLXNlbGVjdG9yID4gLmdvb2dsZS1tYXAnKS5nZXQoMCk7XHJcbiAgICAgICAgdmFyICRsYXQgPSBsLmZpbmQoJ1tuYW1lPWxhdGl0dWRlXScpO1xyXG4gICAgICAgIHZhciAkbG5nID0gbC5maW5kKCdbbmFtZT1sb25naXR1ZGVdJyk7XHJcbiAgICAgICAgdmFyICRpc1JhZGl1cyA9ICRlZGl0b3IuZmluZCgnW25hbWU9aXRyYXZlbF0nKTtcclxuICAgICAgICB2YXIgJHJhZGl1cyA9ICRlZGl0b3IuZmluZCgnW25hbWU9dHJhdmVsLXJhZGl1c10nKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRpbmcgcG9zaXRpb24gY29vcmRpbmF0ZXNcclxuICAgICAgICB2YXIgbXlMYXRsbmc7XHJcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIF9sYXRfdmFsdWUgPSAkbGF0LnZhbCgpLCBfbG5nX3ZhbHVlID0gJGxuZy52YWwoKTtcclxuICAgICAgICAgICAgaWYgKF9sYXRfdmFsdWUgJiYgX2xuZ192YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgbXlMYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKCRsYXQudmFsKCksICRsbmcudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgLy8gV2UgY29uc2lkZXIgYXMgJ3Bvc2l0aW9uZWQgYnkgdXNlcicgd2hlbiB0aGVyZSB3YXMgYSBzYXZlZCB2YWx1ZSBmb3IgdGhlIHBvc2l0aW9uIGNvb3JkaW5hdGVzICh3ZSBhcmUgZWRpdGluZyBhIGxvY2F0aW9uKVxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IChteUxhdGxuZy5sYXQoKSAhPT0gMCAmJiBteUxhdGxuZy5sbmcoKSAhPT0gMCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IHBvc2l0aW9uIHdoZW4gdGhlcmUgYXJlIG5vdCBvbmUgKFNhbiBGcmFuY2lzY28ganVzdCBub3cpOlxyXG4gICAgICAgICAgICAgICAgbXlMYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM3Ljc1MzM0NDM5MjI2Mjk4LCAtMTIyLjQyNTQ2MDYwMzUxNTYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkoKTtcclxuICAgICAgICAvLyBSZW1lbWJlciBvcmlnaW5hbCBmb3JtIGxvY2F0aW9uXHJcbiAgICAgICAgZm91bmRMb2NhdGlvbnMub3JpZ2luYWwgPSBmb3VuZExvY2F0aW9ucy5jb25maXJtZWQgPSBteUxhdGxuZztcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIG1hcFxyXG4gICAgICAgIHZhciBtYXBPcHRpb25zID0ge1xyXG4gICAgICAgICAgICB6b29tOiAocG9zaXRpb25lZEJ5VXNlciA/IGRldGFpbGVkWm9vbUxldmVsIDogZ2VuZXJhbFpvb21MZXZlbCksIC8vIEJlc3QgZGV0YWlsIHdoZW4gd2UgYWxyZWFkeSBoYWQgYSBsb2NhdGlvblxyXG4gICAgICAgICAgICBjZW50ZXI6IG15TGF0bG5nLFxyXG4gICAgICAgICAgICBtYXBUeXBlSWQ6IGdvb2dsZS5tYXBzLk1hcFR5cGVJZC5ST0FETUFQXHJcbiAgICAgICAgfTtcclxuICAgICAgICBtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKG0sIG1hcE9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdGhlIHBvc2l0aW9uIG1hcmtlclxyXG4gICAgICAgIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcclxuICAgICAgICAgICAgcG9zaXRpb246IG15TGF0bG5nLFxyXG4gICAgICAgICAgICBtYXA6IG1hcCxcclxuICAgICAgICAgICAgZHJhZ2dhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIFBsYWNlaG9sZGVyIGZvciB0aGUgcmFkaXVzQ2lyY2xlLCBjcmVhdGVkIG9uIGRlbWFuZFxyXG4gICAgICAgIHZhciByYWRpdXNDaXJjbGU7XHJcbiAgICAgICAgLy8gSW5pdGlhbGl6aW5nIHJhZGl1c0NpcmNsZVxyXG4gICAgICAgIHVwZGF0ZVJhZGl1c0NpcmNsZSgpO1xyXG5cclxuICAgICAgICAvLyBMaXN0ZW4gd2hlbiB1c2VyIGNsaWNrcyBtYXAgb3IgbW92ZSB0aGUgbWFya2VyIHRvIG1vdmUgbWFya2VyIG9yIHNldCBwb3NpdGlvbiBpbiB0aGUgZm9ybVxyXG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ2RyYWdlbmQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgc2V0Rm9ybUNvb3JkaW5hdGVzKG1hcmtlci5nZXRQb3NpdGlvbigpKTtcclxuICAgICAgICAgICAgdXBkYXRlUmFkaXVzQ2lyY2xlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKCFtYXJrZXIuZ2V0RHJhZ2dhYmxlKCkpIHJldHVybjtcclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIoZXZlbnQubGF0TG5nKTtcclxuICAgICAgICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IHRydWU7XHJcbiAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5VXNlciA9IGV2ZW50LmxhdExuZztcclxuICAgICAgICAgICAgc2V0Rm9ybUNvb3JkaW5hdGVzKGV2ZW50LmxhdExuZyk7XHJcbiAgICAgICAgICAgIHVwZGF0ZVJhZGl1c0NpcmNsZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsYWNlTWFya2VyKGxhdGxuZywgZG96b29tLCBhdXRvc2F2ZSkge1xyXG4gICAgICAgICAgICBtYXJrZXIuc2V0UG9zaXRpb24obGF0bG5nKTtcclxuICAgICAgICAgICAgLy8gTW92ZSBtYXBcclxuICAgICAgICAgICAgbWFwLnBhblRvKGxhdGxuZyk7XHJcbiAgICAgICAgICAgIHNhdmVDb29yZGluYXRlcyhhdXRvc2F2ZSk7XHJcbiAgICAgICAgICAgIHVwZGF0ZVJhZGl1c0NpcmNsZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRvem9vbSlcclxuICAgICAgICAgICAgLy8gU2V0IHpvb20gdG8gc29tZXRoaW5nIG1vcmUgZGV0YWlsZWRcclxuICAgICAgICAgICAgICAgIG1hcC5zZXRab29tKGRldGFpbGVkWm9vbUxldmVsKTtcclxuICAgICAgICAgICAgcmV0dXJuIG1hcmtlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gc2F2ZUNvb3JkaW5hdGVzKGluRm9ybSkge1xyXG4gICAgICAgICAgICB2YXIgbGF0TG5nID0gbWFya2VyLmdldFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5ieVVzZXIgPSBsYXRMbmc7XHJcbiAgICAgICAgICAgIGlmIChpbkZvcm0gPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHNldEZvcm1Db29yZGluYXRlcyhsYXRMbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHNldEZvcm1Db29yZGluYXRlcyhsYXRMbmcpIHtcclxuICAgICAgICAgICAgJGxhdC52YWwobGF0TG5nLmxhdCgpKTsgLy9tYXJrZXIucG9zaXRpb24uWGFcclxuICAgICAgICAgICAgJGxuZy52YWwobGF0TG5nLmxuZygpKTsgLy9tYXJrZXIucG9zaXRpb24uWWFcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgIEl0IGNyZWF0ZXMgYSBjaXJjbGUgb24gdGhlIG1hcCB3aXRoIHRoZSBnaXZlbiB2YWx1ZXNcclxuICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSYWRpdXNDaXJjbGUobGF0bG5nLCByYWRpdXMpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgZ29vZ2xlLm1hcHMuQ2lyY2xlKHtcclxuICAgICAgICAgICAgICAgIGNlbnRlcjogbGF0bG5nLFxyXG4gICAgICAgICAgICAgICAgbWFwOiBtYXAsXHJcbiAgICAgICAgICAgICAgICBjbGlja2FibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcmFkaXVzOiBnZXRMb2NhdGlvblJhZGl1cygpLFxyXG4gICAgICAgICAgICAgICAgZmlsbENvbG9yOiAnIzAwOTg5QScsXHJcbiAgICAgICAgICAgICAgICBmaWxsT3BhY2l0eTogMC4zLFxyXG4gICAgICAgICAgICAgICAgc3Ryb2tlV2VpZ2h0OiAwXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvKipcclxuICAgICAgICBVcGRhdGVzIHRoZSBwb3NpdGlvbiBhbmQgcmFkaXVzIG9mIGN1cnJlbnQgcmFkaXVzQ2lyY2xlXHJcbiAgICAgICAgaW4gdGhlIG1hcCBmb3IgdGhlIGN1cnJlbnQgcG9zaXRpb24gYW5kIHJhZGl1c1xyXG4gICAgICAgIG9yIHRoZSBnaXZlbiBvbmUuXHJcbiAgICAgICAgSWYgdGhlIGNpcmNsZSBkb2Vzbid0IGV4aXN0cywgaXRzIGNyZWF0ZWQsXHJcbiAgICAgICAgb3IgaGlkZGVuIGlmIHRoZXJlIGlzIG5vIHJhZGl1cyBhbmQgZXhpc3RzIGFscmVhZHkuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlUmFkaXVzQ2lyY2xlKGxhdGxuZywgcmFkaXVzKSB7XHJcblxyXG4gICAgICAgICAgICBsYXRsbmcgPSBsYXRsbmcgJiYgbGF0bG5nLmdldExuZyB8fCBtYXJrZXIuZ2V0UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgcmFkaXVzID0gcmFkaXVzIHx8IGdldExvY2F0aW9uUmFkaXVzKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAocmFkaXVzICYmIGxhdGxuZykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJhZGl1c0NpcmNsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJhZGl1c0NpcmNsZS5zZXRDZW50ZXIobGF0bG5nKTtcclxuICAgICAgICAgICAgICAgICAgICByYWRpdXNDaXJjbGUuc2V0UmFkaXVzKHJhZGl1cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzQ2lyY2xlLnNldFZpc2libGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByYWRpdXNDaXJjbGUgPSBjcmVhdGVSYWRpdXNDaXJjbGUobGF0bG5nLCByYWRpdXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJhZGl1c0NpcmNsZSkge1xyXG4gICAgICAgICAgICAgICAgcmFkaXVzQ2lyY2xlLnNldFZpc2libGUoZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgIEdldCB0aGUgc2VydmljZSByYWRpdXMgYXMgYSBudW1iZXIgaW4gbWV0ZXJzIHVzZWZ1bGUgZm9yIEdvb2dsZSBNYXBzXHJcbiAgICAgICAgZnJvbSB0aGUgZm9ybSB3aGVuZXZlciBhcHBseSwgZWxzZSBpdCByZXR1cm5zIG51bGwuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0TG9jYXRpb25SYWRpdXMoKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBXaGVuIHJhZGl1cy90cmF2ZWwgb3B0aW9uIGNob29zZW5cclxuICAgICAgICAgICAgaWYgKCRpc1JhZGl1cy5maWx0ZXIoJzpjaGVja2VkW3ZhbHVlPVwiVHJ1ZVwiXScpLnByb3AoJ2NoZWNrZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IHJhZGl1cyBmcm9tIGZvcm0gKGl0cyBpbiBtaWxlcyBvciBrbSlcclxuICAgICAgICAgICAgICAgIHZhciByYWRpdXMgPSAkcmFkaXVzLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJhZGl1c1VuaXQgPSBMQy5kaXN0YW5jZVVuaXRzW0xDLmdldEN1cnJlbnRDdWx0dXJlKCkuY291bnRyeV07XHJcbiAgICAgICAgICAgICAgICAvLyByZXN1bHQgbXVzdCBnbyBpbiBtZXRlcnNcclxuICAgICAgICAgICAgICAgIHJldHVybiAocmFkaXVzVW5pdCA9PSAnbWlsZXMnID8gY29udmVydE1pbGVzS20ocmFkaXVzLCByYWRpdXNVbml0KSA6IHJhZGl1cykgKiAxMDAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIExpc3RlbiB3aGVuIHVzZXIgY2hhbmdlcyBmb3JtIGNvb3JkaW5hdGVzIHZhbHVlcyB0byB1cGRhdGUgdGhlIG1hcFxyXG4gICAgICAgICRsYXQuY2hhbmdlKHVwZGF0ZU1hcE1hcmtlcik7XHJcbiAgICAgICAgJGxuZy5jaGFuZ2UodXBkYXRlTWFwTWFya2VyKTtcclxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVNYXBNYXJrZXIoKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICB2YXIgbmV3UG9zID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZygkbGF0LnZhbCgpLCAkbG5nLnZhbCgpKTtcclxuICAgICAgICAgICAgLy8gTW92ZSBtYXJrZXJcclxuICAgICAgICAgICAgbWFya2VyLnNldFBvc2l0aW9uKG5ld1Bvcyk7XHJcbiAgICAgICAgICAgIC8vIE1vdmUgbWFwXHJcbiAgICAgICAgICAgIG1hcC5wYW5UbyhuZXdQb3MpO1xyXG4gICAgICAgICAgICB1cGRhdGVSYWRpdXNDaXJjbGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTGlzdGVuIHdoZW4gdXNlciBjaGFuZ2VzIHNlcnZpY2UgcmFkaXVzIGZyb20gZm9ybSB0byB1cGRhdGUgdGhlIG1hcFxyXG4gICAgICAgICRpc1JhZGl1cy5jaGFuZ2UodXBkYXRlUmFkaXVzQ2lyY2xlKTtcclxuICAgICAgICAkcmFkaXVzLmNoYW5nZSh1cGRhdGVSYWRpdXNDaXJjbGUpO1xyXG5cclxuICAgICAgICAvKj09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAqIEFVVE8gUE9TSVRJT05JTkdcclxuICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHVzZUdlb2xvY2F0aW9uKGZvcmNlLCBhdXRvc2F2ZSkge1xyXG4gICAgICAgICAgICB2YXIgb3ZlcnJpZGUgPSBmb3JjZSB8fCAhcG9zaXRpb25lZEJ5VXNlcjtcclxuICAgICAgICAgICAgLy8gVXNlIGJyb3dzZXIgZ2VvbG9jYXRpb24gc3VwcG9ydCB0byBnZXQgYW4gYXV0b21hdGljIGxvY2F0aW9uIGlmIHRoZXJlIGlzIG5vIGEgbG9jYXRpb24gc2VsZWN0ZWQgYnkgdXNlclxyXG4gICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBicm93c2VyIHN1cHBvcnRzIGdlb2xvY2F0aW9uLlxyXG4gICAgICAgICAgICBpZiAob3ZlcnJpZGUgJiYgbmF2aWdhdG9yLmdlb2xvY2F0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgbG9jYXRpb24gbWFya2VyIHRoYXQgd2Ugd2lsbCBiZSB1c2luZ1xyXG4gICAgICAgICAgICAgICAgLy8gb24gdGhlIG1hcC4gTGV0J3Mgc3RvcmUgYSByZWZlcmVuY2UgdG8gaXQgaGVyZSBzb1xyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBpdCBjYW4gYmUgdXBkYXRlZCBpbiBzZXZlcmFsIHBsYWNlcy5cclxuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbk1hcmtlciA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBsb2NhdGlvbiBvZiB0aGUgdXNlcidzIGJyb3dzZXIgdXNpbmcgdGhlXHJcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmUgZ2VvbG9jYXRpb24gc2VydmljZS4gV2hlbiB3ZSBpbnZva2UgdGhpcyBtZXRob2RcclxuICAgICAgICAgICAgICAgIC8vIG9ubHkgdGhlIGZpcnN0IGNhbGxiYWNrIGlzIHJlcXVpZWQuIFRoZSBzZWNvbmRcclxuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIC0gdGhlIGVycm9yIGhhbmRsZXIgLSBhbmQgdGhlIHRoaXJkXHJcbiAgICAgICAgICAgICAgICAvLyBhcmd1bWVudCAtIG91ciBjb25maWd1cmF0aW9uIG9wdGlvbnMgLSBhcmUgb3B0aW9uYWwuXHJcbiAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlcmUgaXMgYWxyZWFkeSBhIGxvY2F0aW9uLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBhIGJ1ZyBpbiBGaXJlRm94IHdoZXJlIHRoaXMgZ2V0c1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIHdpdGggYSBjYWNoZWQgcmVzdWx0LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9jYXRpb25NYXJrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW92ZSBtYXJrZXIgdG8gdGhlIG1hcCB1c2luZyB0aGUgcG9zaXRpb24sIG9ubHkgaWYgdXNlciBkb2Vzbid0IHNldCBhIHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdmVycmlkZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhdExuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmNvb3Jkcy5sb25naXR1ZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbk1hcmtlciA9IHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbiA9IGxhdExuZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUubG9nKSBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyB3ZW50IHdyb25nOiBcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiAoNSAqIDEwMDApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhpbXVtQWdlOiAoMTAwMCAqIDYwICogMTUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3k6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIGFza2VkIGZvciB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIsXHJcbiAgICAgICAgICAgICAgICAvLyBsZXQncyB3YXRjaCB0aGUgcG9zaXRpb24gdG8gc2VlIGlmIGl0IHVwZGF0ZXMuIFRoaXNcclxuICAgICAgICAgICAgICAgIC8vIGNhbiBoYXBwZW4gaWYgdGhlIHVzZXIgcGh5c2ljYWxseSBtb3Zlcywgb2YgaWYgbW9yZVxyXG4gICAgICAgICAgICAgICAgLy8gYWNjdXJhdGUgbG9jYXRpb24gaW5mb3JtYXRpb24gaGFzIGJlZW4gZm91bmQgKGV4LlxyXG4gICAgICAgICAgICAgICAgLy8gR1BTIHZzLiBJUCBhZGRyZXNzKS5cclxuICAgICAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgICAgICAvLyBOT1RFOiBUaGlzIGFjdHMgbXVjaCBsaWtlIHRoZSBuYXRpdmUgc2V0SW50ZXJ2YWwoKSxcclxuICAgICAgICAgICAgICAgIC8vIGludm9raW5nIHRoZSBnaXZlbiBjYWxsYmFjayBhIG51bWJlciBvZiB0aW1lcyB0b1xyXG4gICAgICAgICAgICAgICAgLy8gbW9uaXRvciB0aGUgcG9zaXRpb24uIEFzIHN1Y2gsIGl0IHJldHVybnMgYSBcInRpbWVyIElEXCJcclxuICAgICAgICAgICAgICAgIC8vIHRoYXQgY2FuIGJlIHVzZWQgdG8gbGF0ZXIgc3RvcCB0aGUgbW9uaXRvcmluZy5cclxuICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvblRpbWVyID0gbmF2aWdhdG9yLmdlb2xvY2F0aW9uLndhdGNoUG9zaXRpb24oXHJcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gTW92ZSBhZ2FpbiB0byB0aGUgbmV3IG9yIGFjY3VyYXRlZCBwb3NpdGlvbiwgaWYgdXNlciBkb2Vzbid0IHNldCBhIHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAob3ZlcnJpZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGF0TG5nID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubG9uZ2l0dWRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbk1hcmtlciA9IHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24gPSBsYXRMbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChwb3NpdGlvblRpbWVyKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHBvc2l0aW9uIGhhc24ndCB1cGRhdGVkIHdpdGhpbiA1IG1pbnV0ZXMsIHN0b3BcclxuICAgICAgICAgICAgICAgIC8vIG1vbml0b3JpbmcgdGhlIHBvc2l0aW9uIGZvciBjaGFuZ2VzLlxyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgdGhlIHBvc2l0aW9uIHdhdGNoZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChwb3NpdGlvblRpbWVyKTtcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgKDEwMDAgKiA2MCAqIDUpXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSAvLyBFbmRzIGdlb2xvY2F0aW9uIHBvc2l0aW9uXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHVzZUdtYXBzR2VvY29kZShpbml0aWFsTG9va3VwLCBhdXRvc2F2ZSkge1xyXG4gICAgICAgICAgICB2YXIgZ2VvY29kZXIgPSBuZXcgZ29vZ2xlLm1hcHMuR2VvY29kZXIoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGxvb2t1cCBvbiBhZGRyZXNzIGZpZWxkcyBjaGFuZ2VzIHdpdGggY29tcGxldGUgaW5mb3JtYXRpb25cclxuICAgICAgICAgICAgdmFyICRmb3JtID0gJGVkaXRvci5maW5kKCcuY3J1ZGwtZm9ybScpLCBmb3JtID0gJGZvcm0uZ2V0KDApO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRGb3JtQWRkcmVzcygpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhZCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gYWRkKGZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZvcm0uZWxlbWVudHNbZmllbGRdICYmIGZvcm0uZWxlbWVudHNbZmllbGRdLnZhbHVlKSBhZC5wdXNoKGZvcm0uZWxlbWVudHNbZmllbGRdLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGFkZCgnYWRkcmVzc2xpbmUxJyk7XHJcbiAgICAgICAgICAgICAgICBhZGQoJ2FkZHJlc3NsaW5lMicpO1xyXG4gICAgICAgICAgICAgICAgYWRkKCdjaXR5Jyk7XHJcbiAgICAgICAgICAgICAgICBhZGQoJ3Bvc3RhbGNvZGUnKTtcclxuICAgICAgICAgICAgICAgIHZhciBzID0gZm9ybS5lbGVtZW50cy5zdGF0ZTtcclxuICAgICAgICAgICAgICAgIGlmIChzICYmIHMudmFsdWUpIGFkLnB1c2gocy5vcHRpb25zW3Muc2VsZWN0ZWRJbmRleF0ubGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgYWQucHVzaCgnVVNBJyk7XHJcbiAgICAgICAgICAgICAgICAvLyBNaW5pbXVtIGZvciB2YWxpZCBhZGRyZXNzOiAyIGZpZWxkcyBmaWxsZWQgb3V0XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWQubGVuZ3RoID49IDIgPyBhZC5qb2luKCcsICcpIDogbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZm9ybS5vbignY2hhbmdlJywgJ1tuYW1lPWFkZHJlc3NsaW5lMV0sIFtuYW1lPWFkZHJlc3NsaW5lMl0sIFtuYW1lPWNpdHldLCBbbmFtZT1wb3N0YWxjb2RlXSwgW25hbWU9c3RhdGVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFkZHJlc3MgPSBnZXRGb3JtQWRkcmVzcygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFkZHJlc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgZ2VvY29kZUxvb2t1cChhZGRyZXNzLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbCBsb29rdXBcclxuICAgICAgICAgICAgaWYgKGluaXRpYWxMb29rdXApIHtcclxuICAgICAgICAgICAgICAgIHZhciBhZGRyZXNzID0gZ2V0Rm9ybUFkZHJlc3MoKTtcclxuICAgICAgICAgICAgICAgIGlmIChhZGRyZXNzKVxyXG4gICAgICAgICAgICAgICAgICAgIGdlb2NvZGVMb29rdXAoYWRkcmVzcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdlb2NvZGVMb29rdXAoYWRkcmVzcywgb3ZlcnJpZGUpIHtcclxuICAgICAgICAgICAgICAgIGdlb2NvZGVyLmdlb2NvZGUoeyAnYWRkcmVzcyc6IGFkZHJlc3MgfSwgZnVuY3Rpb24gKHJlc3VsdHMsIHN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT0gZ29vZ2xlLm1hcHMuR2VvY29kZXJTdGF0dXMuT0spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhdExuZyA9IHJlc3VsdHNbMF0uZ2VvbWV0cnkubG9jYXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKCdHZW9jb2RlIHJldHJpZXZlZDogJyArIGxhdExuZyArICcgZm9yIGFkZHJlc3MgXCInICsgYWRkcmVzcyArICdcIicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5ieUdlb2NvZGUgPSBsYXRMbmc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZU1hcmtlcihsYXRMbmcsIHRydWUsIGF1dG9zYXZlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdHZW9jb2RlIHdhcyBub3Qgc3VjY2Vzc2Z1bCBmb3IgdGhlIGZvbGxvd2luZyByZWFzb246ICcgKyBzdGF0dXMgKyAnIG9uIGFkZHJlc3MgXCInICsgYWRkcmVzcyArICdcIicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeGVjdXRpbmcgYXV0byBwb3NpdGlvbmluZyAoY2hhbmdlZCB0byBhdXRvc2F2ZTp0cnVlIHRvIGFsbCB0aW1lIHNhdmUgdGhlIGxvY2F0aW9uKTpcclxuICAgICAgICAvL3VzZUdlb2xvY2F0aW9uKHRydWUsIGZhbHNlKTtcclxuICAgICAgICB1c2VHbWFwc0dlb2NvZGUoZmFsc2UsIHRydWUpO1xyXG5cclxuICAgICAgICAvLyBMaW5rIG9wdGlvbnMgbGlua3M6XHJcbiAgICAgICAgbC5maW5kKCcub3B0aW9ucyBhJykub2ZmKCdjbGljay5tYXAnKS5vbignY2xpY2subWFwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJCh0aGlzKS5hdHRyKCdocmVmJykuc3Vic3RyKDEpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ2VvbG9jYXRpb24nOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZExvY2F0aW9ucy5ieUdlb2xvY2F0aW9uKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZU1hcmtlcihmb3VuZExvY2F0aW9ucy5ieUdlb2xvY2F0aW9uLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZUdlb2xvY2F0aW9uKHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ2VvY29kZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kTG9jYXRpb25zLmJ5R2VvY29kZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2VNYXJrZXIoZm91bmRMb2NhdGlvbnMuYnlHZW9jb2RlLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZUdtYXBzR2VvY29kZSh0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2NvbmZpcm0nOlxyXG4gICAgICAgICAgICAgICAgICAgIHNhdmVDb29yZGluYXRlcyh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0RHJhZ2dhYmxlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5jb25maXJtZWQgPSBtYXJrZXIuZ2V0UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICBsLmZpbmQoJy5ncHMtbGF0LCAuZ3BzLWxuZywgLmFkdmljZSwgLmZpbmQtYWRkcmVzcy1nZW9jb2RlLCAuY29uZmlybS1ncHMtYWN0aW9uJykuaGlkZSgnZmFzdCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBlZGl0ID0gbC5maW5kKCcuZWRpdC1hY3Rpb24nKTtcclxuICAgICAgICAgICAgICAgICAgICBlZGl0LnRleHQoZWRpdC5kYXRhKCdlZGl0LWxhYmVsJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZWRpdGNvb3JkaW5hdGVzJzpcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IGwuZmluZCgnLmdwcy1sYXQsIC5ncHMtbG5nLCAuYWR2aWNlLCAuZmluZC1hZGRyZXNzLWdlb2NvZGUsIC5jb25maXJtLWdwcy1hY3Rpb24nKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYiA9ICFhLmlzKCc6dmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlci5zZXREcmFnZ2FibGUoYik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5kYXRhKCdlZGl0LWxhYmVsJywgJHQudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQudGV4dCgkdC5kYXRhKCdjYW5jZWwtbGFiZWwnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQudGV4dCgkdC5kYXRhKCdlZGl0LWxhYmVsJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXN0b3JlIGxvY2F0aW9uOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZU1hcmtlcihmb3VuZExvY2F0aW9ucy5jb25maXJtZWQsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBhLnRvZ2dsZSgnZmFzdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbC5maW5kKCcuY29uZmlybS1ncHMtYWN0aW9uOnZpc2libGUnKS5jc3MoJ2Rpc3BsYXknLCAnaW5saW5lLWJsb2NrJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBtYXA7XHJcbn0iLCIvKmdsb2JhbCB3aW5kb3cgKi9cclxuLyoqIFVJIGxvZ2ljIHRvIG1hbmFnZSBwcm92aWRlciBwaG90b3MgKHlvdXItd29yay9waG90b3MpLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJ0xDL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnTEMvY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG52YXIgYWNiID0gcmVxdWlyZSgnTEMvYWpheENhbGxiYWNrcycpO1xyXG5yZXF1aXJlKCdpbWFnZXNMb2FkZWQnKTtcclxuXHJcbnZhciBzZWN0aW9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZFBob3Rvcyc7XHJcbi8vIE9uIGluaXQsIHRoZSBkZWZhdWx0ICdubyBpbWFnZScgaW1hZ2Ugc3JjIHdpbGwgYmUgZ2V0IGl0IG9uOlxyXG52YXIgZGVmYXVsdEltZ1NyYyA9IG51bGw7XHJcblxyXG52YXIgZWRpdG9yID0gbnVsbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICAgIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAgIGlmICgkYy5sZW5ndGgpIHtcclxuXHJcbiAgICAgICAgc2V0dXBDcnVkbERlbGVnYXRlcygkYyk7XHJcblxyXG4gICAgICAgIGluaXRFbGVtZW50cygkYyk7XHJcblxyXG4gICAgICAgIC8vIEFueSB0aW1lIHRoYXQgdGhlIGZvcm0gY29udGVudCBodG1sIGlzIHJlbG9hZGVkLFxyXG4gICAgICAgIC8vIHJlLWluaXRpYWxpemUgZWxlbWVudHNcclxuICAgICAgICAkYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpbml0RWxlbWVudHMoJGMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59O1xyXG5cclxuZnVuY3Rpb24gc2F2ZShkYXRhKSB7XHJcbiAgICBcclxuICAgIHZhciBlZGl0UGFuZWwgPSAkKHNlY3Rpb25TZWxlY3Rvcik7XHJcblxyXG4gICAgcmV0dXJuICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBlZGl0UGFuZWwuZGF0YSgnYWpheC1maWVsZHNldC1hY3Rpb24nKSxcclxuICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgIHR5cGU6ICdwb3N0JyxcclxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBuZXcgZXJyb3IgZm9yIFByb21pc2UtYXR0YWNoZWQgY2FsbGJhY2tzXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZGF0YS5FcnJvck1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gUmVnaXN0ZXIgY2hhbmdlc1xyXG4gICAgICAgICAgICAgICAgdmFyICRjID0gJChzZWN0aW9uU2VsZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlc05vdGlmaWNhdGlvbi5yZWdpc3RlclNhdmUoJGMuY2xvc2VzdCgnZm9ybScpLmdldCgwKSwgJGMuZmluZCgnOmlucHV0JykudG9BcnJheSgpKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIHRleHQsIGVycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IGJldHRlciBlcnJvciBtYW5hZ2VtZW50LCBzYXZpbmdcclxuICAgICAgICAgICAgYWxlcnQoJ1NvcnJ5LCB0aGVyZSB3YXMgYW4gZXJyb3IuICcgKyAoZXJyb3IgfHwgJycpKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2F2ZUVkaXRlZFBob3RvKCRmKSB7XHJcblxyXG4gICAgdmFyIGlkID0gJGYuZmluZCgnW25hbWU9UGhvdG9JRF0nKS52YWwoKSxcclxuICAgICAgICBjYXB0aW9uID0gJGYuZmluZCgnW25hbWU9cGhvdG8tY2FwdGlvbl0nKS52YWwoKSxcclxuICAgICAgICBpc1ByaW1hcnkgPSAkZi5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXTpjaGVja2VkJykudmFsKCkgPT09ICdUcnVlJztcclxuXHJcbiAgICBpZiAoaWQgJiYgaWQgPiAwKSB7XHJcbiAgICAgICAgLy8gQWpheCBzYXZlXHJcbiAgICAgICAgc2F2ZSh7XHJcbiAgICAgICAgICAgIFBob3RvSUQ6IGlkLFxyXG4gICAgICAgICAgICAncGhvdG8tY2FwdGlvbic6IGNhcHRpb24sXHJcbiAgICAgICAgICAgICdpcy1wcmltYXJ5LXBob3RvJzogaXNQcmltYXJ5LFxyXG4gICAgICAgICAgICByZXN1bHQ6ICdqc29uJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIFVwZGF0ZSBjYWNoZSBhdCBnYWxsZXJ5IGl0ZW1cclxuICAgICAgICB2YXIgJGl0ZW0gPSAkZi5maW5kKCcucG9zaXRpb25waG90b3MtZ2FsbGVyeSAjVXNlclBob3RvLScgKyBpZCksXHJcbiAgICAgICAgICAgICRpbWcgPSAkaXRlbS5maW5kKCdpbWcnKTtcclxuXHJcbiAgICAgICAgaWYgKCRpdGVtICYmICRpdGVtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAkaW1nLmF0dHIoJ2FsdCcsIGNhcHRpb24pO1xyXG4gICAgICAgICAgICBpZiAoaXNQcmltYXJ5KVxyXG4gICAgICAgICAgICAgICAgJGl0ZW0uYWRkQ2xhc3MoJ2lzLXByaW1hcnktcGhvdG8nKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLXByaW1hcnktcGhvdG8nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVkaXRTZWxlY3RlZFBob3RvKGZvcm0sIHNlbGVjdGVkKSB7XHJcblxyXG4gICAgdmFyIGVkaXRQYW5lbCA9ICQoJy5wb3NpdGlvbnBob3Rvcy1lZGl0JywgZm9ybSk7XHJcbiAgICB2YXIgbm9uVXBsb2FkZXJFbGVtZW50c1NlbGVjdG9yID0gJy5wb3NpdGlvbnBob3Rvcy1lZGl0LCAuRGFzaGJvYXJkUGhvdG9zLWVkaXRQaG90byA+IGxlZ2VuZCwgLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBsZWdlbmQsIC5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2wsIC5wb3NpdGlvbnBob3Rvcy10b29scyc7XHJcblxyXG4gICAgLy8gVXNlIGdpdmVuIEBzZWxlY3RlZCBvciBsb29rIGZvciBhIHNlbGVjdGVkIHBob3RvIGluIHRoZSBsaXN0XHJcbiAgICBzZWxlY3RlZCA9IHNlbGVjdGVkICYmIHNlbGVjdGVkLmxlbmd0aCA/IHNlbGVjdGVkIDogJCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbCA+IGxpLnNlbGVjdGVkJywgZm9ybSk7XHJcblxyXG4gICAgLy8gTWFyayB0aGlzIGFzIHNlbGVjdGVkXHJcbiAgICBzZWxlY3RlZC5hZGRDbGFzcygnc2VsZWN0ZWQnKS5zaWJsaW5ncygpLnJlbW92ZUNsYXNzKCdzZWxlY3RlZCcpO1xyXG5cclxuICAgIGlmIChzZWxlY3RlZCAmJiBzZWxlY3RlZC5sZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICAgIGZvcm0uZmluZChub25VcGxvYWRlckVsZW1lbnRzU2VsZWN0b3IpLnNob3coKTtcclxuICAgICAgICBlZGl0b3IudXBsb2FkZXIuc2V0QXNTZWNvbmRhcnkoKTtcclxuXHJcbiAgICAgICAgdmFyIHNlbEltZyA9IHNlbGVjdGVkLmZpbmQoJ2ltZycpO1xyXG4gICAgICAgIC8vIE1vdmluZyBzZWxlY3RlZCB0byBiZSBlZGl0IHBhbmVsXHJcbiAgICAgICAgdmFyIHBob3RvSUQgPSBzZWxlY3RlZC5hdHRyKCdpZCcpLm1hdGNoKC9eVXNlclBob3RvLShcXGQrKSQvKVsxXSxcclxuICAgICAgICAgICAgcGhvdG9VcmwgPSBzZWxJbWcuYXR0cignc3JjJyksXHJcbiAgICAgICAgICAgICRpbWcgPSBlZGl0UGFuZWwuZmluZCgnaW1nJyk7XHJcblxyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbChwaG90b0lEKTtcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9cGhvdG9VUkldJykudmFsKHBob3RvVXJsKTtcclxuICAgICAgICAkaW1nXHJcbiAgICAgICAgLmF0dHIoJ3NyYycsIHBob3RvVXJsICsgXCI/dj1cIiArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkpIC8vICc/c2l6ZT1ub3JtYWwnKVxyXG4gICAgICAgIC5hdHRyKCdzdHlsZScsICcnKTtcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9cGhvdG8tY2FwdGlvbl0nKS52YWwoc2VsSW1nLmF0dHIoJ2FsdCcpKTtcclxuICAgICAgICB2YXIgaXNQcmltYXJ5VmFsdWUgPSBzZWxlY3RlZC5oYXNDbGFzcygnaXMtcHJpbWFyeS1waG90bycpID8gJ1RydWUnIDogJ0ZhbHNlJztcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b10nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXVt2YWx1ZT0nICsgaXNQcmltYXJ5VmFsdWUgKyAnXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcclxuXHJcbiAgICAgICAgLy8gQ3JvcHBpbmdcclxuICAgICAgICAkaW1nLmltYWdlc0xvYWRlZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGVkaXRvci5zZXR1cENyb3BQaG90bygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKGZvcm0uZmluZCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbCA+IGxpJykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vICM1MzUsIGF2b2lkIHRoZSAndGhlcmUgaXMgbm8gcGhvdG9zJyBhbmQganVzdCBoaWRlIHRoZSBwYW5lbCB0byBnaXZlIHF1aWNrIGFjY2Vzc1xyXG4gICAgICAgICAgICAvLyB0byB0aGUgJ3VwbG9hZCBidXR0b24nLiBUaGUgZ2FsbGVyeSBtYXkgbmVlZCB0byBiZSBoaWRkZW4gdG9vXHJcbiAgICAgICAgICAgIC8vc21vb3RoQm94QmxvY2sub3Blbihmb3JtLmZpbmQoJy5uby1waG90b3MnKSwgZWRpdFBhbmVsLCAnJywgeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICBmb3JtLmZpbmQobm9uVXBsb2FkZXJFbGVtZW50c1NlbGVjdG9yKS5oaWRlKCk7XHJcbiAgICAgICAgICAgIGVkaXRvci51cGxvYWRlci5zZXRBc01haW4oKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmb3JtLmZpbmQobm9uVXBsb2FkZXJFbGVtZW50c1NlbGVjdG9yKS5zaG93KCk7XHJcbiAgICAgICAgICAgIGVkaXRvci51cGxvYWRlci5zZXRBc1NlY29uZGFyeSgpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGZvcm0uZmluZCgnLm5vLXByaW1hcnktcGhvdG8nKSwgZWRpdFBhbmVsLCAnJywgeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBObyBpbWFnZTpcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnaW1nJykuYXR0cignc3JjJywgZGVmYXVsdEltZ1NyYyk7XHJcbiAgICAgICAgLy8gUmVzZXQgaGlkZGVuIGZpZWxkcyBtYW51YWxseSB0byBhdm9pZCBicm93c2VyIG1lbW9yeSBicmVha2luZyB0aGluZ3NcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9UGhvdG9JRF0nKS52YWwoJycpO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbCgnJyk7XHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuLyogU2V0dXAgdGhlIGNvZGUgdGhhdCB3b3JrcyBvbiB0aGUgZGlmZmVyZW50IENSVURMIGFjdGlvbnMgb24gdGhlIHBob3Rvcy5cclxuICBBbGwgdGhpcyBhcmUgZGVsZWdhdGVzLCBvbmx5IG5lZWQgdG8gYmUgc2V0dXAgb25jZSBvbiB0aGUgcGFnZVxyXG4gIChpZiB0aGUgY29udGFpbmVyICRjIGlzIG5vdCByZXBsYWNlZCwgb25seSB0aGUgY29udGVudHMsIGRvZXNuJ3QgbmVlZCB0byBjYWxsIGFnYWluIHRoaXMpLlxyXG4qL1xyXG5mdW5jdGlvbiBzZXR1cENydWRsRGVsZWdhdGVzKCRjKSB7XHJcbiAgICAkY1xyXG4gICAgLm9uKCdjaGFuZ2UnLCAnLnBvc2l0aW9ucGhvdG9zLWVkaXQgaW5wdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gSW5zdGFudCBzYXZpbmcgb24gdXNlciBjaGFuZ2VzIHRvIHRoZSBlZGl0aW5nIGZvcm1cclxuICAgICAgICB2YXIgJGYgPSAkKHRoaXMpLmNsb3Nlc3QoJy5wb3NpdGlvbnBob3Rvcy1lZGl0Jyk7XHJcbiAgICAgICAgc2F2ZUVkaXRlZFBob3RvKCRmKTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy5wb3NpdGlvbnBob3Rvcy10b29scy11cGxvYWQgPiBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwb3NJRCA9ICQodGhpcykuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ2lucHV0W25hbWU9cG9zaXRpb25JRF0nKS52YWwoKTtcclxuICAgICAgICBwb3B1cChMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvWW91cldvcmsvVXBsb2FkUGhvdG8vP1Bvc2l0aW9uSUQ9JyArIHBvc0lELCB7IHdpZHRoOiA3MDAsIGhlaWdodDogNjcwIH0sIG51bGwsIG51bGwsIHsgYXV0b0ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtZ2FsbGVyeSBsaSBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIGZvcm0gPSAkdC5jbG9zZXN0KHNlY3Rpb25TZWxlY3Rvcik7XHJcbiAgICAgICAgLy8gRG9uJ3QgbG9zdCBsYXRlc3QgY2hhbmdlczpcclxuICAgICAgICBzYXZlRWRpdGVkUGhvdG8oZm9ybSk7XHJcblxyXG4gICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlQWxsKGZvcm0pO1xyXG4gICAgICAgIC8vIFNldCB0aGlzIHBob3RvIGFzIHNlbGVjdGVkXHJcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gJHQuY2xvc2VzdCgnbGknKTtcclxuICAgICAgICBlZGl0U2VsZWN0ZWRQaG90byhmb3JtLCBzZWxlY3RlZCk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy5EYXNoYm9hcmRQaG90b3MtZWRpdFBob3RvLWRlbGV0ZScsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyIGVkaXRQYW5lbCA9ICQodGhpcykuY2xvc2VzdCgnLnBvc2l0aW9ucGhvdG9zLWVkaXQnKTtcclxuICAgICAgICB2YXIgZm9ybSA9IGVkaXRQYW5lbC5jbG9zZXN0KHNlY3Rpb25TZWxlY3Rvcik7XHJcblxyXG4gICAgICAgIHZhciBwaG90b0lEID0gZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPVBob3RvSURdJykudmFsKCk7XHJcbiAgICAgICAgdmFyICRwaG90b0l0ZW0gPSBmb3JtLmZpbmQoJyNVc2VyUGhvdG8tJyArIHBob3RvSUQpO1xyXG5cclxuICAgICAgICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gICAgICAgIHNhdmUoe1xyXG4gICAgICAgICAgICBQaG90b0lEOiBwaG90b0lELFxyXG4gICAgICAgICAgICAnZGVsZXRlLXBob3RvJzogJ1RydWUnLFxyXG4gICAgICAgICAgICByZXN1bHQ6ICdqc29uJ1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgaXRlbVxyXG4gICAgICAgICAgICAkcGhvdG9JdGVtLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgZWRpdFNlbGVjdGVkUGhvdG8oZm9ybSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiBJbml0aWFsaXplIHRoZSBwaG90b3MgZWxlbWVudHMgdG8gYmUgc29ydGFibGVzLCBzZXQgdGhlIHByaW1hcnkgcGhvdG9cclxuICBpbiB0aGUgaGlnaGxpZ2h0ZWQgYXJlIGFuZCBpbml0aWFsaXplIHRoZSAnZGVsZXRlIHBob3RvJyBmbGFnLlxyXG4gIFRoaXMgaXMgcmVxdWlyZWQgdG8gYmUgZXhlY3V0ZWQgYW55IHRpbWUgdGhlIGVsZW1lbnRzIGh0bWwgaXMgcmVwbGFjZWRcclxuICBiZWNhdXNlIG5lZWRzIGRpcmVjdCBhY2Nlc3MgdG8gdGhlIERPTSBlbGVtZW50cy5cclxuKi9cclxuZnVuY3Rpb24gaW5pdEVsZW1lbnRzKGZvcm0pIHtcclxuXHJcbiAgICBkZWZhdWx0SW1nU3JjID0gZm9ybS5maW5kKCdpbWcnKS5hdHRyKCdzcmMnKTtcclxuXHJcbiAgICB2YXIgc29ydGFibGUgPSBuZXcgU29ydGFibGUoeyBjb250YWluZXI6IGZvcm0gfSk7XHJcblxyXG4gICAgLy8gRWRpdG9yIHNldHVwXHJcbiAgICB2YXIgJGNlZGl0b3IgPSAkKCcuRGFzaGJvYXJkUGhvdG9zLWVkaXRQaG90bycsIGZvcm0pLFxyXG4gICAgICAgIHBvc2l0aW9uSWQgPSBwYXJzZUludChmb3JtLmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCdbbmFtZT1wb3NpdGlvbklEXScpLnZhbCgpKSB8fCAwO1xyXG4gICAgZWRpdG9yID0gbmV3IEVkaXRvcih7XHJcbiAgICAgICAgY29udGFpbmVyOiAkY2VkaXRvcixcclxuICAgICAgICBwb3NpdGlvbklkOiBwb3NpdGlvbklkLFxyXG4gICAgICAgIHNpemVMaW1pdDogJGNlZGl0b3IuZGF0YSgnc2l6ZS1saW1pdCcpLFxyXG4gICAgICAgIGdhbGxlcnk6IG5ldyBHYWxsZXJ5KHsgY29udGFpbmVyOiBmb3JtIH0pLFxyXG4gICAgICAgIHVwbG9hZGVyOiBuZXcgVXBsb2FkZXIoeyBjb250YWluZXI6ICQoJy5GaWxlVXBsb2FkZXInLCBmb3JtKSwgcG9zaXRpb25JZDogcG9zaXRpb25JZCB9KVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2V0IHByaW1hcnkgcGhvdG8gdG8gYmUgZWRpdGVkXHJcbiAgICBlZGl0U2VsZWN0ZWRQaG90byhmb3JtKTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBTb3J0YWJsZSBDb21wb25lbnQgQ2xhc3NcclxuKiovXHJcbmZ1bmN0aW9uIFNvcnRhYmxlKHNldHRpbmdzKSB7XHJcblxyXG4gICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCB7fTtcclxuICAgIHRoaXMuJGNvbnRhaW5lciA9ICQoc2V0dGluZ3MuY29udGFpbmVyIHx8ICdib2R5Jyk7XHJcblxyXG4gICAgLy8gUHJlcGFyZSBzb3J0YWJsZSBzY3JpcHRcclxuICAgIHRoaXMuc29ydGFibGUgPSAkKFwiLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbFwiLCB0aGlzLiRjb250YWluZXIpLnNvcnRhYmxlKHtcclxuICAgICAgICBwbGFjZWhvbGRlcjogXCJ1aS1zdGF0ZS1oaWdobGlnaHRcIixcclxuICAgICAgICB1cGRhdGU6IHRoaXMub25VcGRhdGVcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKiogQ29udGV4dCAndGhpcycgaXMgdGhlIGpxdWVyeS5zb3J0YWJsZSBvbiB0aGlzIGV2ZW50IGhhbmRsZXJcclxuKiovXHJcblNvcnRhYmxlLnByb3RvdHlwZS5vblVwZGF0ZSA9IGZ1bmN0aW9uIG9uVXBkYXRlKCkge1xyXG4gICAgLy8gR2V0IHBob3RvIG9yZGVyLCBhIGNvbW1hIHNlcGFyYXRlZCB2YWx1ZSBvZiBpdGVtcyBJRHNcclxuICAgIHZhciBvcmRlciA9ICQodGhpcykuc29ydGFibGUoXCJ0b0FycmF5XCIpLnRvU3RyaW5nKCk7XHJcbiAgICAvLyBTZXQgb3JkZXIgaW4gdGhlIGZvcm0gZWxlbWVudCwgdG8gYmUgc2VudCBsYXRlciB3aXRoIHRoZSBmb3JtXHJcbiAgICAkKHRoaXMpLmNsb3Nlc3Qoc2VjdGlvblNlbGVjdG9yKVxyXG4gICAgICAgIC5maW5kKCdbbmFtZT1nYWxsZXJ5LW9yZGVyXScpXHJcbiAgICAgICAgLnZhbChvcmRlcilcclxuICAgIC8vIFdpdGggaW5zdGFudCBzYXZpbmcsIG5vIG1vcmUgbm90aWZ5IGNoYW5nZSBmb3IgQ2hhbmdlc05vdGlmaWVyLCBzbyBjb21tZW50aW5nOlxyXG4gICAgLy8uY2hhbmdlKClcclxuICAgICAgICA7XHJcblxyXG4gICAgLy8gSW5zdGFudCBzYXZpbmdcclxuICAgIHNhdmUoe1xyXG4gICAgICAgICdnYWxsZXJ5LW9yZGVyJzogb3JkZXIsXHJcbiAgICAgICAgYWN0aW9uOiAnb3JkZXInLFxyXG4gICAgICAgIHJlc3VsdDogJ2pzb24nXHJcbiAgICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgR2FsbGVyeSBDbGFzc1xyXG4qKi9cclxuZnVuY3Rpb24gR2FsbGVyeShzZXR0aW5ncykge1xyXG5cclxuICAgIHNldHRpbmdzID0gc2V0dGluZ3MgfHwge307XHJcblxyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJChzZXR0aW5ncy5jb250YWluZXIgfHwgJy5EYXNoYm9hcmRQaG90b3MnKTtcclxuICAgIHRoaXMuJGdhbGxlcnkgPSAkKCcucG9zaXRpb25waG90b3MtZ2FsbGVyeScsIHRoaXMuJGNvbnRhaW5lcik7XHJcbiAgICB0aGlzLiRnYWxsZXJ5TGlzdCA9ICQoJ29sJywgdGhpcy4kZ2FsbGVyeSk7XHJcbiAgICB0aGlzLnRwbEltZyA9ICc8bGkgaWQ9XCJVc2VyUGhvdG8tQEAwXCI+PGEgaHJlZj1cIiNcIj48aW1nIGFsdD1cIlVwbG9hZGVkIHBob3RvXCIgc3JjPVwiQEAxXCIvPjwvYT48YSBjbGFzcz1cImVkaXRcIiBocmVmPVwiI1wiPkVkaXQ8L2E+PC9saT4nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgQXBwZW5kIGEgcGhvdG8gZWxlbWVudCB0byB0aGUgZ2FsbGVyeSBjb2xsZWN0aW9uLlxyXG4gICAgKiovXHJcbiAgICB0aGlzLmFwcGVuZFBob3RvID0gZnVuY3Rpb24gYXBwZW5kUGhvdG8oZmlsZU5hbWUsIHBob3RvSUQpIHtcclxuXHJcbiAgICAgICAgdmFyIG5ld0ltZyA9ICQodGhpcy50cGxJbWcucmVwbGFjZSgvQEAwL2csIHBob3RvSUQpLnJlcGxhY2UoL0BAMS9nLCBmaWxlTmFtZSkpO1xyXG4gICAgICAgIC8vIElmIGlzIHRoZXJlIGlzIG5vIHBob3RvcyBzdGlsbCwgdGhlIGZpcnN0IHdpbGwgYmUgdGhlIHByaW1hcnkgYnkgZGVmYXVsdFxyXG4gICAgICAgIGlmICh0aGlzLiRnYWxsZXJ5TGlzdC5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICBuZXdJbWcuYWRkQ2xhc3MoJ2lzLXByaW1hcnktcGhvdG8nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuJGdhbGxlcnlMaXN0XHJcbiAgICAgICAgLmFwcGVuZChuZXdJbWcpXHJcbiAgICAgICAgLy8gc2Nyb2xsIHRoZSBnYWxsZXJ5IHRvIHNlZSB0aGUgbmV3IGVsZW1lbnQ7IHVzaW5nICctMicgdG8gYXZvaWQgc29tZSBicm93c2VycyBhdXRvbWF0aWMgc2Nyb2xsLlxyXG4gICAgICAgIC5hbmltYXRlKHsgc2Nyb2xsVG9wOiB0aGlzLiRnYWxsZXJ5TGlzdFswXS5zY3JvbGxIZWlnaHQgLSB0aGlzLiRnYWxsZXJ5TGlzdC5oZWlnaHQoKSAtIDIgfSwgMTQwMClcclxuICAgICAgICAuZmluZCgnbGk6bGFzdC1jaGlsZCcpXHJcbiAgICAgICAgLmVmZmVjdChcImhpZ2hsaWdodFwiLCB7fSwgMTYwMCk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXdJbWc7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVsb2FkUGhvdG8gPSBmdW5jdGlvbiByZWxvYWRQaG90byhmaWxlVVJJLCBwaG90b0lEKSB7XHJcblxyXG4gICAgICAgIC8vIEZpbmQgaXRlbSBieSBJRCBhbmQgbG9hZCB3aXRoIG5ldyBVUklcclxuICAgICAgICB0aGlzLiRnYWxsZXJ5TGlzdC5maW5kKCcjVXNlclBob3RvLScgKyBwaG90b0lEKVxyXG4gICAgICAgIC5maW5kKCdpbWcnKVxyXG4gICAgICAgIC5hdHRyKCdzcmMnLCBmaWxlVVJJICsgJz92PScgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpKTtcclxuICAgIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgVXBsb2FkZXIgQ2xhc3NcclxuKiovXHJcbmZ1bmN0aW9uIFVwbG9hZGVyKHNldHRpbmdzKSB7XHJcblxyXG4gICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCB7fTtcclxuXHJcbiAgICAvLyBmLmUuOiAuRmlsZVVwbG9hZGVyXHJcbiAgICB0aGlzLiRjb250YWluZXIgPSAkKHNldHRpbmdzLmNvbnRhaW5lciB8fCAnaHRtbCcpO1xyXG4gICAgdGhpcy5nYWxsZXJ5ID0gc2V0dGluZ3MuZ2FsbGVyeSB8fCBuZXcgR2FsbGVyeSh0aGlzLiRjb250YWluZXIpO1xyXG4gICAgdGhpcy5wb3NpdGlvbklkID0gc2V0dGluZ3MucG9zaXRpb25JZCB8fCAwO1xyXG4gICAgdGhpcy5jb21wb25lbnRDbGFzcyA9IHNldHRpbmdzLmNvbXBvbmVudENsYXNzIHx8ICdGaWxlVXBsb2FkZXInO1xyXG4gICAgdGhpcy5zZWNvbmRhcnlDbGFzcyA9IHNldHRpbmdzLnNlY29uZGFyeUNsYXNzIHx8ICdGaWxlVXBsb2FkZXItLWFzU2Vjb25kYXJ5JztcclxuXHJcbiAgICB2YXIgdGhpc1VwbG9hZGVyID0gdGhpcztcclxuXHJcbiAgICB0aGlzLnFxdXBsb2FkZXIgPSBuZXcgcXEuRmlsZVVwbG9hZGVyKHtcclxuICAgICAgICBlbGVtZW50OiAkKCcuRmlsZVVwbG9hZGVyLXVwbG9hZGVyJywgdGhpcy4kY29udGFpbmVyKS5nZXQoMCksXHJcbiAgICAgICAgLy8gcGF0aCB0byBzZXJ2ZXItc2lkZSB1cGxvYWQgc2NyaXB0XHJcbiAgICAgICAgYWN0aW9uOiBMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvWW91cldvcmsvVXBsb2FkUGhvdG8vP1Bvc2l0aW9uSUQ9JyArICh0aGlzLnBvc2l0aW9uSWQpLFxyXG4gICAgICAgIGFsbG93ZWRFeHRlbnNpb25zOiBbJ2pwZycsICdqcGVnJywgJ3BuZycsICdnaWYnXSxcclxuICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAoaWQsIGZpbGVOYW1lLCByZXNwb25zZUpTT04pIHtcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlSlNPTi5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3SW1nSXRlbSA9IHRoaXNVcGxvYWRlci5nYWxsZXJ5LmFwcGVuZFBob3RvKHJlc3BvbnNlSlNPTi5maWxlVVJJLCByZXNwb25zZUpTT04ucGhvdG9JRCk7XHJcbiAgICAgICAgICAgICAgICAvLyBTaG93IGluIGVkaXQgcGFuZWxcclxuICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlQWxsKHRoaXNVcGxvYWRlci5nYWxsZXJ5LiRjb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgZWRpdFNlbGVjdGVkUGhvdG8odGhpc1VwbG9hZGVyLmdhbGxlcnkuJGNvbnRhaW5lciwgbmV3SW1nSXRlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG1lc3NhZ2VzOiB7XHJcbiAgICAgICAgICAgIHR5cGVFcnJvcjogXCJ7ZmlsZX0gaGFzIGludmFsaWQgZXh0ZW5zaW9uLiBPbmx5IHtleHRlbnNpb25zfSBhcmUgYWxsb3dlZC5cIixcclxuICAgICAgICAgICAgc2l6ZUVycm9yOiBcIntmaWxlfSBpcyB0b28gbGFyZ2UsIG1heGltdW0gZmlsZSBzaXplIGlzIHtzaXplTGltaXR9LlwiLFxyXG4gICAgICAgICAgICBtaW5TaXplRXJyb3I6IFwie2ZpbGV9IGlzIHRvbyBzbWFsbCwgbWluaW11bSBmaWxlIHNpemUgaXMge21pblNpemVMaW1pdH0uXCIsXHJcbiAgICAgICAgICAgIGVtcHR5RXJyb3I6IFwie2ZpbGV9IGlzIGVtcHR5LCBwbGVhc2Ugc2VsZWN0IGZpbGVzIGFnYWluIHdpdGhvdXQgaXQuXCIsXHJcbiAgICAgICAgICAgIG9uTGVhdmU6IFwiVGhlIGZpbGVzIGFyZSBiZWluZyB1cGxvYWRlZCwgaWYgeW91IGxlYXZlIG5vdyB0aGUgdXBsb2FkIHdpbGwgYmUgY2FuY2VsbGVkLlwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzaXplTGltaXQ6IHRoaXMuc2l6ZUxpbWl0IHx8ICd1bmRlZmluZWQnLFxyXG4gICAgICAgIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInFxLXVwbG9hZGVyXCI+JyArXHJcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInFxLXVwbG9hZC1kcm9wLWFyZWFcIj48c3Bhbj5Ecm9wIGEgZmlsZSBoZXJlIHRvIHVwbG9hZDwvc3Bhbj48L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicXEtdXBsb2FkLWJ1dHRvblwiPlVwbG9hZCBhIHBob3RvPC9kaXY+JyArXHJcbiAgICAgICAgICAgICAgICAnPHVsIGNsYXNzPVwicXEtdXBsb2FkLWxpc3RcIj48L3VsPicgK1xyXG4gICAgICAgICAgICAgICAgJzwvZGl2PidcclxuICAgIH0pO1xyXG59XHJcblxyXG5VcGxvYWRlci5wcm90b3R5cGUuc2V0QXNNYWluID0gZnVuY3Rpb24gc2V0QXNNYWluKCkge1xyXG4gICAgdGhpcy4kY29udGFpbmVyLnJlbW92ZUNsYXNzKHRoaXMuc2Vjb25kYXJ5Q2xhc3MpO1xyXG59O1xyXG5cclxuVXBsb2FkZXIucHJvdG90eXBlLnNldEFzU2Vjb25kYXJ5ID0gZnVuY3Rpb24gc2V0QXNTZWNvbmRhcnkoKSB7XHJcbiAgICB0aGlzLiRjb250YWluZXIuYWRkQ2xhc3ModGhpcy5zZWNvbmRhcnlDbGFzcyk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIEVkaXRvciBDbGFzc1xyXG4qKi9cclxudmFyIHFxID0gcmVxdWlyZSgnZmlsZXVwbG9hZGVyJyk7XHJcbnJlcXVpcmUoJ2pjcm9wJyk7XHJcbmZ1bmN0aW9uIEVkaXRvcihzZXR0aW5ncykge1xyXG5cclxuICAgIHNldHRpbmdzID0gc2V0dGluZ3MgfHwge307XHJcblxyXG4gICAgdmFyICRoID0gJCgnaHRtbCcpO1xyXG4gICAgdGhpcy5wb3NpdGlvbklkID0gc2V0dGluZ3MucG9zaXRpb25JZCB8fCAkaC5kYXRhKCdwb3NpdGlvbi1pZCcpO1xyXG4gICAgdGhpcy5zaXplTGltaXQgPSBzZXR0aW5ncy5zaXplTGltaXQgfHwgJGguZGF0YSgnc2l6ZS1saW1pdCcpO1xyXG5cclxuICAgIC8vIGYuZS46IC5EYXNoYm9hcmRQaG90b3MtZWRpdFBob3RvXHJcbiAgICB0aGlzLiRjb250YWluZXIgPSAkKHNldHRpbmdzLmNvbnRhaW5lciB8fCAnaHRtbCcpO1xyXG4gICAgdGhpcy5nYWxsZXJ5ID0gc2V0dGluZ3MuZ2FsbGVyeSB8fCBuZXcgR2FsbGVyeSh7IGNvbnRhaW5lcjogdGhpcy4kY29udGFpbmVyIH0pO1xyXG4gICAgdGhpcy51cGxvYWRlciA9IHNldHRpbmdzLnVwbG9hZGVyIHx8IG5ldyBVcGxvYWRlcih7IGNvbnRhaW5lOiB0aGlzLiRjb250YWluZXIsIHBvc2l0aW9uSWQ6IHRoaXMucG9zaXRpb25JZCB9KTtcclxuXHJcbiAgICAvLyBJbml0aWFsaXppbmc6XHJcbiAgICB0aGlzLmluaXRDcm9wRm9ybSgpO1xyXG59XHJcblxyXG4vLyBTaW1wbGUgZXZlbnQgaGFuZGxlciwgY2FsbGVkIGZyb20gb25DaGFuZ2UgYW5kIG9uU2VsZWN0XHJcbi8vIGV2ZW50IGhhbmRsZXJzLCBhcyBwZXIgdGhlIEpjcm9wIGludm9jYXRpb24gYWJvdmVcclxuRWRpdG9yLnByb3RvdHlwZS5zaG93Q29vcmRzID0gZnVuY3Rpb24gc2hvd0Nvb3JkcyhjKSB7XHJcbiAgICAkKCdbbmFtZT1jcm9wLXgxXScsIHRoaXMuJGNvbnRhaW5lcikudmFsKGMueCk7XHJcbiAgICAkKCdbbmFtZT1jcm9wLXkxXScsIHRoaXMuJGNvbnRhaW5lcikudmFsKGMueSk7XHJcbiAgICAkKCdbbmFtZT1jcm9wLXgyXScsIHRoaXMuJGNvbnRhaW5lcikudmFsKGMueDIpO1xyXG4gICAgJCgnW25hbWU9Y3JvcC15Ml0nLCB0aGlzLiRjb250YWluZXIpLnZhbChjLnkyKTtcclxuICAgICQoJ1tuYW1lPWNyb3Atd10nLCB0aGlzLiRjb250YWluZXIpLnZhbChjLncpO1xyXG4gICAgJCgnW25hbWU9Y3JvcC1oXScsIHRoaXMuJGNvbnRhaW5lcikudmFsKGMuaCk7XHJcbn07XHJcblxyXG5FZGl0b3IucHJvdG90eXBlLmNsZWFyQ29vcmRzID0gZnVuY3Rpb24gY2xlYXJDb29yZHMoKSB7XHJcbiAgICAkKCdpbnB1dFtuYW1lPV5jcm9wLV0nLCB0aGlzLiRjb250YWluZXIpLnZhbCgnJyk7XHJcbn07XHJcblxyXG5FZGl0b3IucHJvdG90eXBlLmluaXRDcm9wRm9ybSA9IGZ1bmN0aW9uIGluaXRDcm9wRm9ybSgpIHtcclxuXHJcbiAgICAvLyBTZXR1cCBjcm9wcGluZyBcImZvcm1cIlxyXG4gICAgdmFyIHRoaXNFZGl0b3IgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuJGNvbnRhaW5lci5vbignY2xpY2snLCAnLkRhc2hib2FyZFBob3Rvcy1lZGl0UGhvdG8tc2F2ZScsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IExjVXJsLkxhbmdQYXRoICsgJyRkYXNoYm9hcmQvWW91cldvcmsvVXBsb2FkUGhvdG8vJyxcclxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxyXG4gICAgICAgICAgICBkYXRhOiB0aGlzRWRpdG9yLiRjb250YWluZXIuZmluZCgnOmlucHV0Jykuc2VyaWFsaXplKCkgKyAnJmNyb3AtcGhvdG89VHJ1ZScsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuQ29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjYi5kb0pTT05BY3Rpb24oZGF0YSwgdGV4dCwgangpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoZGF0YS51cGRhdGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGhvdG8gY3JvcHBlZCwgcmVzaXplZFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNFZGl0b3IuZ2FsbGVyeS5yZWxvYWRQaG90byhkYXRhLmZpbGVVUkksIGRhdGEucGhvdG9JRCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVmcmVzaCBlZGl0IHBhbmVsXHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdFNlbGVjdGVkUGhvdG8odGhpc0VkaXRvci5nYWxsZXJ5LiRjb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUGhvdG8gdXBsb2FkZWRcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3SW1nSXRlbSA9IHRoaXNFZGl0b3IuZ2FsbGVyeS5hcHBlbmRQaG90byhkYXRhLmZpbGVVUkksIGRhdGEucGhvdG9JRCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gU2hvdyBpbiBlZGl0IHBhbmVsXHJcbiAgICAgICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2VBbGwodGhpc0VkaXRvci5nYWxsZXJ5LiRjb250YWluZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVkaXRTZWxlY3RlZFBob3RvKHRoaXNFZGl0b3IuZ2FsbGVyeS4kY29udGFpbmVyLCBuZXdJbWdJdGVtKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICQoJyNjcm9wLXBob3RvJykuc2xpZGVVcCgnZmFzdCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gQ2xvc2UgcG9wdXAgIzUzNVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgZXIpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KCdTb3JyeSwgdGhlcmUgd2FzIGFuIGVycm9yIHNldHRpbmctdXAgeW91ciBwaG90by4gJyArIChlciB8fCAnJykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbkVkaXRvci5wcm90b3R5cGUuc2V0dXBDcm9wUGhvdG8gPSBmdW5jdGlvbiBzZXR1cENyb3BQaG90bygpIHtcclxuXHJcbiAgICBpZiAodGhpcy5qY3JvcEFwaSlcclxuICAgICAgICB0aGlzLmpjcm9wQXBpLmRlc3Ryb3koKTtcclxuXHJcbiAgICB2YXIgdGhpc0VkaXRvciA9IHRoaXM7XHJcblxyXG4gICAgLy8gU2V0dXAgaW1nIGNyb3BwaW5nXHJcbiAgICB2YXIgJGltZyA9ICQoJy5wb3NpdGlvbnBob3Rvcy1lZGl0LXBob3RvID4gaW1nJywgdGhpcy4kY29udGFpbmVyKTtcclxuICAgICRpbWcuSmNyb3Aoe1xyXG4gICAgICAgIG9uQ2hhbmdlOiB0aGlzLnNob3dDb29yZHMuYmluZCh0aGlzKSxcclxuICAgICAgICBvblNlbGVjdDogdGhpcy5zaG93Q29vcmRzLmJpbmQodGhpcyksXHJcbiAgICAgICAgb25SZWxlYXNlOiB0aGlzLmNsZWFyQ29vcmRzLmJpbmQodGhpcyksXHJcbiAgICAgICAgYXNwZWN0UmF0aW86ICRpbWcuZGF0YSgndGFyZ2V0LXdpZHRoJykgLyAkaW1nLmRhdGEoJ3RhcmdldC1oZWlnaHQnKVxyXG4gICAgfSwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzRWRpdG9yLmpjcm9wQXBpID0gdGhpcztcclxuICAgICAgICAvLyBJbml0aWFsIHNlbGVjdGlvbiB0byBzaG93IHVzZXIgdGhhdCBjYW4gY2hvb3NlIGFuIGFyZWFcclxuICAgICAgICB0aGlzRWRpdG9yLmpjcm9wQXBpLnNldFNlbGVjdChbMCwgMCwgJGltZy53aWR0aCgpLCAkaW1nLmhlaWdodCgpXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gJGltZztcclxufTtcclxuIiwiLyoqIEF2YWlsYWJpbGl0eTogV2Vla2x5IFNjaGVkdWxlIHNlY3Rpb24gc2V0dXBcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhciA9IHJlcXVpcmUoJ0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyJyk7XHJcbnZhciBiYXRjaEV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJ0xDL2JhdGNoRXZlbnRIYW5kbGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciBtb250aGx5TGlzdCA9IGF2YWlsYWJpbGl0eUNhbGVuZGFyLk1vbnRobHkuZW5hYmxlQWxsKCk7XHJcblxyXG4gICAgJC5lYWNoKG1vbnRobHlMaXN0LCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgIHZhciBtb250aGx5ID0gdGhpcztcclxuXHJcbiAgICAgICAgLy8gU2V0dXBpbmcgdGhlIGNhbGVuZGFyIGRhdGEgZmllbGRcclxuICAgICAgICB2YXIgZm9ybSA9IG1vbnRobHkuJGVsLmNsb3Nlc3QoJ2Zvcm0uYWpheCxmaWVsZHNldC5hamF4Jyk7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gZm9ybS5maW5kKCdbbmFtZT1tb250aGx5XScpO1xyXG4gICAgICAgIGlmIChmaWVsZC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGZpZWxkID0gJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwibW9udGhseVwiIC8+JykuaW5zZXJ0QWZ0ZXIobW9udGhseS4kZWwpO1xyXG5cclxuICAgICAgICAvLyBTYXZlIHdoZW4gdGhlIGZvcm0gaXMgdG8gYmUgc3VibWl0dGVkXHJcbiAgICAgICAgZm9ybS5vbigncHJlc3VibWl0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmaWVsZC52YWwoSlNPTi5zdHJpbmdpZnkobW9udGhseS5nZXRVcGRhdGVkRGF0YSgpKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFVwZGF0aW5nIGZpZWxkIG9uIGNhbGVuZGFyIGNoYW5nZXMgKHVzaW5nIGJhdGNoIHRvIGF2b2lkIGh1cnQgcGVyZm9ybWFuY2UpXHJcbiAgICAgICAgLy8gYW5kIHJhaXNlIGNoYW5nZSBldmVudCAodGhpcyBmaXhlcyB0aGUgc3VwcG9ydCBmb3IgY2hhbmdlc05vdGlmaWNhdGlvblxyXG4gICAgICAgIC8vIGFuZCBpbnN0YW50LXNhdmluZykuXHJcbiAgICAgICAgbW9udGhseS5ldmVudHMub24oJ2RhdGFDaGFuZ2VkJywgYmF0Y2hFdmVudEhhbmRsZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmaWVsZFxyXG4gICAgICAgICAgICAudmFsKEpTT04uc3RyaW5naWZ5KG1vbnRobHkuZ2V0VXBkYXRlZERhdGEoKSkpXHJcbiAgICAgICAgICAgIC5jaGFuZ2UoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxucGF5bWVudDogd2l0aCB0aGUgcHJvcGVyIGh0bWwgYW5kIGZvcm1cclxucmVnZW5lcmF0ZXMgdGhlIGJ1dHRvbiBzb3VyY2UtY29kZSBhbmQgcHJldmlldyBhdXRvbWF0aWNhbGx5LlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmZvcm1hdHRlcicpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIG9uUGF5bWVudEFjY291bnQoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgdmFyIGZpbml0ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIC8vIEluaXRpYWxpemUgdGhlIGZvcm1hdHRlcnMgb24gcGFnZS1yZWFkeS4uXHJcbiAgICBpbml0Rm9ybWF0dGVycygkYyk7XHJcblxyXG4gICAgY2hhbmdlUGF5bWVudE1ldGhvZCgkYyk7XHJcblxyXG4gIH07XHJcbiAgJChmaW5pdCk7XHJcbiAgLy8gYW5kIGFueSBhamF4LXBvc3Qgb2YgdGhlIGZvcm0gdGhhdCByZXR1cm5zIG5ldyBodG1sOlxyXG4gICRjLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLmFqYXgnLCBmaW5pdCk7XHJcbn07XHJcblxyXG4vKiogSW5pdGlhbGl6ZSB0aGUgZmllbGQgZm9ybWF0dGVycyByZXF1aXJlZCBieSB0aGUgcGF5bWVudC1hY2NvdW50LWZvcm0sIGJhc2VkXHJcbiAgb24gdGhlIGZpZWxkcyBuYW1lcy5cclxuKiovXHJcbmZ1bmN0aW9uIGluaXRGb3JtYXR0ZXJzKCRjb250YWluZXIpIHtcclxuICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiYmlydGhkYXRlXCJdJykuZm9ybWF0dGVyKHtcclxuICAgICdwYXR0ZXJuJzogJ3t7OTl9fS97ezk5fX0ve3s5OTk5fX0nLFxyXG4gICAgJ3BlcnNpc3RlbnQnOiBmYWxzZVxyXG4gIH0pO1xyXG4gICRjb250YWluZXIuZmluZCgnW25hbWU9XCJzc25cIl0nKS5mb3JtYXR0ZXIoe1xyXG4gICAgJ3BhdHRlcm4nOiAne3s5OTl9fS17ezk5fX0te3s5OTk5fX0nLFxyXG4gICAgJ3BlcnNpc3RlbnQnOiBmYWxzZVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGFuZ2VQYXltZW50TWV0aG9kKCRjb250YWluZXIpIHtcclxuXHJcbiAgdmFyICRiYW5rID0gJGNvbnRhaW5lci5maW5kKCcuRGFzaGJvYXJkUGF5bWVudEFjY291bnQtYmFuaycpLFxyXG4gICAgJGVscyA9ICRjb250YWluZXIuZmluZCgnLkRhc2hib2FyZFBheW1lbnRBY2NvdW50LWNoYW5nZU1ldGhvZCcpXHJcbiAgICAuYWRkKCRiYW5rKTtcclxuXHJcbiAgJGNvbnRhaW5lci5maW5kKCcuQWN0aW9ucy0tY2hhbmdlUGF5bWVudE1ldGhvZCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICRlbHMudG9nZ2xlQ2xhc3MoJ2lzLXZlbm1vQWNjb3VudCBpcy1iYW5rQWNjb3VudCcpO1xyXG5cclxuICAgIGlmICgkYmFuay5oYXNDbGFzcygnaXMtdmVubW9BY2NvdW50JykpIHtcclxuICAgICAgLy8gUmVtb3ZlIGFuZCBzYXZlIG51bWJlcnNcclxuICAgICAgJGJhbmsuZmluZCgnaW5wdXQnKS52YWwoZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAkKHRoaXMpLmRhdGEoJ3ByZXYtdmFsJywgdik7XHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFJlc3RvcmUgbnVtYmVyc1xyXG4gICAgICAkYmFuay5maW5kKCdpbnB1dCcpLnZhbChmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgIHJldHVybiAkKHRoaXMpLmRhdGEoJ3ByZXYtdmFsJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxufSIsIi8qKiBQcmljaW5nIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIFRpbWVTcGFuID0gcmVxdWlyZSgnTEMvVGltZVNwYW4nKTtcclxucmVxdWlyZSgnTEMvVGltZVNwYW5FeHRyYScpLnBsdWdJbihUaW1lU3Bhbik7XHJcbnZhciB1cGRhdGVUb29sdGlwcyA9IHJlcXVpcmUoJ0xDL3Rvb2x0aXBzJykudXBkYXRlVG9vbHRpcHM7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChwcmljaW5nU2VsZWN0b3IpIHtcclxuICBwcmljaW5nU2VsZWN0b3IgPSBwcmljaW5nU2VsZWN0b3IgfHwgJy5EYXNoYm9hcmRQcmljaW5nJztcclxuICB2YXIgJHByaWNpbmcgPSAkKHByaWNpbmdTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJHByaWNpbmcuc2libGluZ3MoKVxyXG4gICAgICAuYWRkKCRwcmljaW5nLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSlcclxuICAgICAgLmFkZCgkcHJpY2luZy5jbG9zZXN0KCcuRGFzaGJvYXJkWW91cldvcmsnKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKHByaWNpbmdTZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuXHJcbiAgICBzZXR1cE5vUHJpY2VSYXRlVXBkYXRlcygkZWRpdG9yKTtcclxuICAgIHNldHVwUHJvdmlkZXJQYWNrYWdlU2xpZGVycygkZWRpdG9yKTtcclxuICAgIHVwZGF0ZVRvb2x0aXBzKCk7XHJcbiAgICBzZXR1cFNob3dNb3JlQXR0cmlidXRlc0xpbmsoJGVkaXRvcik7XHJcblxyXG4gIH0pO1xyXG59O1xyXG5cclxuLyogSGFuZGxlciBmb3IgY2hhbmdlIGV2ZW50IG9uICdub3QgdG8gc3RhdGUgcHJpY2UgcmF0ZScsIHVwZGF0aW5nIHJlbGF0ZWQgcHJpY2UgcmF0ZSBmaWVsZHMuXHJcbiAgSXRzIHNldHVwZWQgcGVyIGVkaXRvciBpbnN0YW5jZSwgbm90IGFzIGFuIGV2ZW50IGRlbGVnYXRlLlxyXG4qL1xyXG5mdW5jdGlvbiBzZXR1cE5vUHJpY2VSYXRlVXBkYXRlcygkZWRpdG9yKSB7XHJcbiAgdmFyIFxyXG4gICAgcHIgPSAkZWRpdG9yLmZpbmQoJ1tuYW1lPXByaWNlLXJhdGVdLFtuYW1lPXByaWNlLXJhdGUtdW5pdF0nKSxcclxuICAgIG5wciA9ICRlZGl0b3IuZmluZCgnW25hbWU9bm8tcHJpY2UtcmF0ZV0nKTtcclxuICBucHIub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHByLnByb3AoJ2Rpc2FibGVkJywgbnByLnByb3AoJ2NoZWNrZWQnKSk7XHJcbiAgfSk7XHJcbiAgLy8gSW5pdGlhbCBzdGF0ZTpcclxuICBucHIuY2hhbmdlKCk7XHJcbn1cclxuXHJcbi8qKiBTZXR1cCB0aGUgVUkgU2xpZGVycyBvbiB0aGUgZWRpdG9yLlxyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBQcm92aWRlclBhY2thZ2VTbGlkZXJzKCRlZGl0b3IpIHtcclxuXHJcbiAgLyogSG91c2Vla2VlcGVyIHByaWNpbmcgKi9cclxuICBmdW5jdGlvbiB1cGRhdGVBdmVyYWdlKCRjLCBtaW51dGVzKSB7XHJcbiAgICAkYy5maW5kKCdbbmFtZT1wcm92aWRlci1hdmVyYWdlLXRpbWVdJykudmFsKG1pbnV0ZXMpO1xyXG4gICAgbWludXRlcyA9IHBhcnNlSW50KG1pbnV0ZXMpO1xyXG4gICAgJGMuZmluZCgnLnByZXZpZXcgLnRpbWUnKS50ZXh0KFRpbWVTcGFuLmZyb21NaW51dGVzKG1pbnV0ZXMpLnRvU21hcnRTdHJpbmcoKSk7XHJcbiAgfVxyXG5cclxuICAkZWRpdG9yLmZpbmQoXCIucHJvdmlkZXItYXZlcmFnZS10aW1lLXNsaWRlclwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkYyA9ICQodGhpcykuY2xvc2VzdCgnW2RhdGEtc2xpZGVyLXZhbHVlXScpO1xyXG4gICAgdmFyIGF2ZXJhZ2UgPSAkYy5kYXRhKCdzbGlkZXItdmFsdWUnKSxcclxuICAgICAgc3RlcCA9ICRjLmRhdGEoJ3NsaWRlci1zdGVwJykgfHwgMTtcclxuICAgIGlmICghYXZlcmFnZSkgcmV0dXJuO1xyXG4gICAgdmFyIHNldHVwID0ge1xyXG4gICAgICByYW5nZTogXCJtaW5cIixcclxuICAgICAgdmFsdWU6IGF2ZXJhZ2UsXHJcbiAgICAgIG1pbjogYXZlcmFnZSAtIDMgKiBzdGVwLFxyXG4gICAgICBtYXg6IGF2ZXJhZ2UgKyAzICogc3RlcCxcclxuICAgICAgc3RlcDogc3RlcCxcclxuICAgICAgc2xpZGU6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICB1cGRhdGVBdmVyYWdlKCRjLCB1aS52YWx1ZSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICB2YXIgc2xpZGVyID0gJCh0aGlzKS5zbGlkZXIoc2V0dXApO1xyXG5cclxuICAgICRjLmZpbmQoJy5wcm92aWRlci1hdmVyYWdlLXRpbWUnKS5vbignY2xpY2snLCAnbGFiZWwnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgIGlmICgkdC5oYXNDbGFzcygnYmVsb3ctYXZlcmFnZS1sYWJlbCcpKVxyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgc2V0dXAubWluKTtcclxuICAgICAgZWxzZSBpZiAoJHQuaGFzQ2xhc3MoJ2F2ZXJhZ2UtbGFiZWwnKSlcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHNldHVwLnZhbHVlKTtcclxuICAgICAgZWxzZSBpZiAoJHQuaGFzQ2xhc3MoJ2Fib3ZlLWF2ZXJhZ2UtbGFiZWwnKSlcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHNldHVwLm1heCk7XHJcbiAgICAgIHVwZGF0ZUF2ZXJhZ2UoJGMsIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJykpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2V0dXAgdGhlIGlucHV0IGZpZWxkLCBoaWRkZW4gYW5kIHdpdGggaW5pdGlhbCB2YWx1ZSBzeW5jaHJvbml6ZWQgd2l0aCBzbGlkZXJcclxuICAgIHZhciBmaWVsZCA9ICRjLmZpbmQoJ1tuYW1lPXByb3ZpZGVyLWF2ZXJhZ2UtdGltZV0nKTtcclxuICAgIGZpZWxkLmhpZGUoKTtcclxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBmaWVsZC52YWwoKSB8fCBhdmVyYWdlO1xyXG4gICAgdXBkYXRlQXZlcmFnZSgkYywgY3VycmVudFZhbHVlKTtcclxuICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgY3VycmVudFZhbHVlKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqIFRoZSBpbi1lZGl0b3IgbGluayAjc2hvdy1tb3JlLWF0dHJpYnV0ZXMgbXVzdCBzaG93L2hpZGUgdGhlIGNvbnRhaW5lciBvZlxyXG4gIGV4dHJhIGF0dHJpYnV0ZXMgZm9yIHRoZSBwYWNrYWdlL3ByaWNpbmctaXRlbS4gVGhpcyBzZXR1cHMgdGhlIHJlcXVpcmVkIGhhbmRsZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cFNob3dNb3JlQXR0cmlidXRlc0xpbmsoJGVkaXRvcikge1xyXG4gIC8vIEhhbmRsZXIgZm9yICdzaG93LW1vcmUtYXR0cmlidXRlcycgYnV0dG9uICh1c2VkIG9ubHkgb24gZWRpdCBhIHBhY2thZ2UpXHJcbiAgJGVkaXRvci5maW5kKCcuc2hvdy1tb3JlLWF0dHJpYnV0ZXMnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGF0dHMgPSAkdC5zaWJsaW5ncygnLnNlcnZpY2VzLW5vdC1jaGVja2VkJyk7XHJcbiAgICBpZiAoYXR0cy5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICAkdC50ZXh0KCR0LmRhdGEoJ3Nob3ctdGV4dCcpKTtcclxuICAgICAgYXR0cy5zdG9wKCkuaGlkZSgnZmFzdCcpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgJHQudGV4dCgkdC5kYXRhKCdoaWRlLXRleHQnKSk7XHJcbiAgICAgIGF0dHMuc3RvcCgpLnNob3coJ2Zhc3QnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufSIsIi8qKlxyXG4gIHByaXZhY3lTZXR0aW5nczogU2V0dXAgZm9yIHRoZSBzcGVjaWZpYyBwYWdlLWZvcm0gZGFzaGJvYXJkL3ByaXZhY3kvcHJpdmFjeXNldHRpbmdzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vLyBUT0RPIEltcGxlbWVudCBkZXBlbmRlbmNpZXMgY29tbWluZyBmcm9tIGFwcC5qcyBpbnN0ZWFkIG9mIGRpcmVjdCBsaW5rXHJcbi8vdmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnc21vb3RoQm94QmxvY2snKTtcclxuLy8gVE9ETyBSZXBsYWNlIGRvbS1yZXNzb3VyY2VzIGJ5IGkxOG4uZ2V0VGV4dFxyXG5cclxudmFyIHByaXZhY3kgPSB7XHJcbiAgYWNjb3VudExpbmtzU2VsZWN0b3I6ICcuRGFzaGJvYXJkUHJpdmFjeVNldHRpbmdzLW15QWNjb3VudCBhJyxcclxuICByZXNzb3VyY2VzU2VsZWN0b3I6ICcuRGFzaGJvYXJkUHJpdmFjeS1hY2NvdW50UmVzc291cmNlcydcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcHJpdmFjeTtcclxuXHJcbnByaXZhY3kub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgJGMub24oJ2NsaWNrJywgJy5jYW5jZWwtYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgc21vb3RoQm94QmxvY2suY2xvc2UoJGMpO1xyXG4gIH0pO1xyXG5cclxuICAkYy5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsICcuYWpheC1ib3gnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgfSk7XHJcbiAgXHJcbiAgJGMub24oJ2NsaWNrJywgcHJpdmFjeS5hY2NvdW50TGlua3NTZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciBiLFxyXG4gICAgICBscmVzID0gJGMuZmluZChwcml2YWN5LnJlc3NvdXJjZXNTZWxlY3Rvcik7XHJcblxyXG4gICAgc3dpdGNoICgkKHRoaXMpLmF0dHIoJ2hyZWYnKSkge1xyXG4gICAgICBjYXNlICcjZGVsZXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5kZWxldGUtbWVzc2FnZS1jb25maXJtJykuY2xvbmUoKSwgJGMpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICcjZGVhY3RpdmF0ZS1teS1hY2NvdW50JzpcclxuICAgICAgICBiID0gc21vb3RoQm94QmxvY2sub3BlbihscmVzLmNoaWxkcmVuKCcuZGVhY3RpdmF0ZS1tZXNzYWdlLWNvbmZpcm0nKS5jbG9uZSgpLCAkYyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJyNyZWFjdGl2YXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5yZWFjdGl2YXRlLW1lc3NhZ2UtY29uZmlybScpLmNsb25lKCksICRjKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlmIChiKSB7XHJcbiAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogYi5vZmZzZXQoKS50b3AgfSwgNTAwLCBudWxsKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbn07IiwiLyoqIFNlcnZpY2UgQXR0cmlidXRlcyBWYWxpZGF0aW9uOiBpbXBsZW1lbnRzIHZhbGlkYXRpb25zIHRocm91Z2ggdGhlIFxyXG4gICdjdXN0b21WYWxpZGF0aW9uJyBhcHByb2FjaCBmb3IgJ3Bvc2l0aW9uIHNlcnZpY2UgYXR0cmlidXRlcycuXHJcbiAgSXQgdmFsaWRhdGVzIHRoZSByZXF1aXJlZCBhdHRyaWJ1dGUgY2F0ZWdvcnksIGFsbW9zdC1vbmUgb3Igc2VsZWN0LW9uZSBtb2Rlcy5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBnZXRUZXh0ID0gcmVxdWlyZSgnTEMvZ2V0VGV4dCcpO1xyXG52YXIgdmggPSByZXF1aXJlKCdMQy92YWxpZGF0aW9uSGVscGVyJyk7XHJcbnZhciBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnTEMvanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxuLyoqIEVuYWJsZSB2YWxpZGF0aW9uIG9mIHJlcXVpcmVkIHNlcnZpY2UgYXR0cmlidXRlcyBvblxyXG4gIHRoZSBmb3JtKHMpIHNwZWNpZmllZCBieSB0aGUgc2VsZWN0b3Igb3IgcHJvdmlkZWRcclxuKiovXHJcbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiBzZXR1cFNlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbihjb250YWluZXJTZWxlY3Rvciwgb3B0aW9ucykge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG4gIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICByZXF1aXJlZFNlbGVjdG9yOiAnLkRhc2hib2FyZFNlcnZpY2VzLWF0dHJpYnV0ZXMtY2F0ZWdvcnkuaXMtcmVxdWlyZWQnLFxyXG4gICAgc2VsZWN0T25lQ2xhc3M6ICdqcy12YWxpZGF0aW9uU2VsZWN0T25lJyxcclxuICAgIGdyb3VwRXJyb3JDbGFzczogJ2lzLWVycm9yJyxcclxuICAgIHZhbEVycm9yVGV4dEtleTogJ3JlcXVpcmVkLWF0dHJpYnV0ZS1jYXRlZ29yeS1lcnJvcidcclxuICB9LCBvcHRpb25zKTtcclxuXHJcbiAgJGMuZWFjaChmdW5jdGlvbiB2YWxpZGF0ZVNlcnZpY2VBdHRyaWJ1dGVzKCkge1xyXG4gICAgdmFyIGYgPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFmLmlzKCdmb3JtLGZpZWxkc2V0JykpIHtcclxuICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignVGhlIGVsZW1lbnQgdG8gYXBwbHkgdmFsaWRhdGlvbiBtdXN0IGJlIGEgZm9ybSBvciBmaWVsZHNldCcpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZi5kYXRhKCdjdXN0b21WYWxpZGF0aW9uJywge1xyXG4gICAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWxpZCA9IHRydWUsIGxhc3RWYWxpZCA9IHRydWU7XHJcbiAgICAgICAgdmFyIHYgPSB2aC5maW5kVmFsaWRhdGlvblN1bW1hcnkoZik7XHJcblxyXG4gICAgICAgIGYuZmluZChvcHRpb25zLnJlcXVpcmVkU2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyIGZzID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBjYXQgPSBmcy5jaGlsZHJlbignLkRhc2hib2FyZFNlcnZpY2VzLWNhdGVnb3J5TmFtZScpLnRleHQoKTtcclxuICAgICAgICAgIC8vIFdoYXQgdHlwZSBvZiB2YWxpZGF0aW9uIGFwcGx5P1xyXG4gICAgICAgICAgaWYgKGZzLmlzKCcuJyArIG9wdGlvbnMuc2VsZWN0T25lQ2xhc3MpKVxyXG4gICAgICAgICAgLy8gaWYgdGhlIGNhdCBpcyBhICd2YWxpZGF0aW9uLXNlbGVjdC1vbmUnLCBhICdzZWxlY3QnIGVsZW1lbnQgd2l0aCBhICdwb3NpdGl2ZSdcclxuICAgICAgICAgIC8vIDpzZWxlY3RlZCB2YWx1ZSBtdXN0IGJlIGNoZWNrZWRcclxuICAgICAgICAgICAgbGFzdFZhbGlkID0gISEoZnMuZmluZCgnb3B0aW9uOnNlbGVjdGVkJykudmFsKCkpO1xyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgLy8gT3RoZXJ3aXNlLCBsb29rIGZvciAnYWxtb3N0IG9uZScgY2hlY2tlZCB2YWx1ZXM6XHJcbiAgICAgICAgICAgIGxhc3RWYWxpZCA9IChmcy5maW5kKCdpbnB1dDpjaGVja2VkJykubGVuZ3RoID4gMCk7XHJcblxyXG4gICAgICAgICAgaWYgKCFsYXN0VmFsaWQpIHtcclxuICAgICAgICAgICAgdmFsaWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgZnMuYWRkQ2xhc3Mob3B0aW9ucy5ncm91cEVycm9yQ2xhc3MpO1xyXG4gICAgICAgICAgICB2YXIgZXJyID0gZ2V0VGV4dChvcHRpb25zLnZhbEVycm9yVGV4dEtleSwgY2F0KTtcclxuICAgICAgICAgICAgaWYgKHYuZmluZCgnbGlbdGl0bGU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShjYXQpICsgJ1wiXScpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICB2LmNoaWxkcmVuKCd1bCcpLmFwcGVuZCgkKCc8bGkvPicpLnRleHQoZXJyKS5hdHRyKCd0aXRsZScsIGNhdCkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3Mob3B0aW9ucy5ncm91cEVycm9yQ2xhc3MpO1xyXG4gICAgICAgICAgICB2LmZpbmQoJ2xpW3RpdGxlPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoY2F0KSArICdcIl0nKS5yZW1vdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHZhbGlkKSB7XHJcbiAgICAgICAgICB2aC5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoZik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZoLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihmKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbGlkO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBJdCBwcm92aWRlcyB0aGUgY29kZSBmb3IgdGhlIGFjdGlvbnMgb2YgdGhlIFZlcmlmaWNhdGlvbnMgc2VjdGlvbi5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbi8vdmFyIExjVXJsID0gcmVxdWlyZSgnLi4vTEMvTGNVcmwnKTtcclxuLy92YXIgcG9wdXAgPSByZXF1aXJlKCcuLi9MQy9wb3B1cCcpO1xyXG5cclxudmFyIGFjdGlvbnMgPSBleHBvcnRzLmFjdGlvbnMgPSB7fTtcclxuXHJcbmFjdGlvbnMuZmFjZWJvb2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgLyogRmFjZWJvb2sgY29ubmVjdCAqL1xyXG4gIHZhciBGYWNlYm9va0Nvbm5lY3QgPSByZXF1aXJlKCdMQy9GYWNlYm9va0Nvbm5lY3QnKTtcclxuICB2YXIgZmIgPSBuZXcgRmFjZWJvb2tDb25uZWN0KHtcclxuICAgIHJlc3VsdFR5cGU6ICdqc29uJyxcclxuICAgIHVybFNlY3Rpb246ICdWZXJpZnknLFxyXG4gICAgYXBwSWQ6ICQoJ2h0bWwnKS5kYXRhKCdmYi1hcHBpZCcpLFxyXG4gICAgcGVybWlzc2lvbnM6ICdlbWFpbCx1c2VyX2Fib3V0X21lJyxcclxuICAgIGxvYWRpbmdUZXh0OiAnVmVyaWZpbmcnXHJcbiAgfSk7XHJcbiAgJChkb2N1bWVudCkub24oZmIuY29ubmVjdGVkRXZlbnQsIGZ1bmN0aW9uICgpIHtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdwb3B1cC1jbG9zZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgZmIuY29ubmVjdCgpO1xyXG59O1xyXG5cclxuYWN0aW9ucy5lbWFpbCA9IGZ1bmN0aW9uICgpIHtcclxuICBwb3B1cChMY1VybC5MYW5nUGF0aCArICdBY2NvdW50LyRSZXNlbmRDb25maXJtYXRpb25FbWFpbC9ub3cvJywgcG9wdXAuc2l6ZSgnc21hbGwnKSk7XHJcbn07XHJcblxyXG52YXIgbGlua3MgPSBleHBvcnRzLmxpbmtzID0ge1xyXG4gICcjY29ubmVjdC13aXRoLWZhY2Vib29rJzogYWN0aW9ucy5mYWNlYm9vayxcclxuICAnI2NvbmZpcm0tZW1haWwnOiBhY3Rpb25zLmVtYWlsXHJcbn07XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gICRjLm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gR2V0IHRoZSBhY3Rpb24gbGluayBvciBlbXB0eVxyXG4gICAgdmFyIGxpbmsgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8ICcnO1xyXG5cclxuICAgIC8vIEV4ZWN1dGUgdGhlIGFjdGlvbiBhdHRhY2hlZCB0byB0aGF0IGxpbmtcclxuICAgIHZhciBhY3Rpb24gPSBsaW5rc1tsaW5rXSB8fCBudWxsO1xyXG4gICAgaWYgKHR5cGVvZiAoYWN0aW9uKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBhY3Rpb24oKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogVmVyaWZpY2F0aW9ucyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgc2VjdGlvblNlbGVjdG9yID0gJy5EYXNoYm9hcmRWZXJpZmljYXRpb25zJyxcclxuICAgICRzZWN0aW9uID0gJGMuZmluZChzZWN0aW9uU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRzZWN0aW9uLnNpYmxpbmdzKClcclxuICAgICAgLmFkZCgkc2VjdGlvbi5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpXHJcbiAgICAgIC5hZGQoJHNlY3Rpb24uY2xvc2VzdCgnLkRhc2hib2FyZEFib3V0WW91Jykuc2libGluZ3MoKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChzZWN0aW9uU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICByZXF1aXJlKCcuL2JhY2tncm91bmRDaGVja1JlcXVlc3QnKS5zZXR1cEZvcm0oJGVkaXRvci5maW5kKCcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrJykpO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogQXZhaWxhYmlsaXR5OiBXZWVrbHkgU2NoZWR1bGUgc2VjdGlvbiBzZXR1cFxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyID0gcmVxdWlyZSgnTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXInKTtcclxudmFyIGJhdGNoRXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnTEMvYmF0Y2hFdmVudEhhbmRsZXInKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIHdvcmtIb3Vyc0xpc3QgPSBhdmFpbGFiaWxpdHlDYWxlbmRhci5Xb3JrSG91cnMuZW5hYmxlQWxsKCk7XHJcblxyXG4gICAgJC5lYWNoKHdvcmtIb3Vyc0xpc3QsIGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgdmFyIHdvcmtob3VycyA9IHRoaXM7XHJcblxyXG4gICAgICAgIC8vIFNldHVwaW5nIHRoZSBXb3JrSG91cnMgY2FsZW5kYXIgZGF0YSBmaWVsZFxyXG4gICAgICAgIHZhciBmb3JtID0gd29ya2hvdXJzLiRlbC5jbG9zZXN0KCdmb3JtLmFqYXgsIGZpZWxkc2V0LmFqYXgnKTtcclxuICAgICAgICB2YXIgZmllbGQgPSBmb3JtLmZpbmQoJ1tuYW1lPXdvcmtob3Vyc10nKTtcclxuICAgICAgICBpZiAoZmllbGQubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBmaWVsZCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIndvcmtob3Vyc1wiIC8+JykuaW5zZXJ0QWZ0ZXIod29ya2hvdXJzLiRlbCk7XHJcblxyXG4gICAgICAgIC8vIFNhdmUgd2hlbiB0aGUgZm9ybSBpcyB0byBiZSBzdWJtaXR0ZWRcclxuICAgICAgICBmb3JtLm9uKCdwcmVzdWJtaXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZpZWxkLnZhbChKU09OLnN0cmluZ2lmeSh3b3JraG91cnMuZGF0YSkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBVcGRhdGluZyBmaWVsZCBvbiBjYWxlbmRhciBjaGFuZ2VzICh1c2luZyBiYXRjaCB0byBhdm9pZCBodXJ0IHBlcmZvcm1hbmNlKVxyXG4gICAgICAgIC8vIGFuZCByYWlzZSBjaGFuZ2UgZXZlbnQgKHRoaXMgZml4ZXMgdGhlIHN1cHBvcnQgZm9yIGNoYW5nZXNOb3RpZmljYXRpb25cclxuICAgICAgICAvLyBhbmQgaW5zdGFudC1zYXZpbmcpLlxyXG4gICAgICAgIHdvcmtob3Vycy5ldmVudHMub24oJ2RhdGFDaGFuZ2VkJywgYmF0Y2hFdmVudEhhbmRsZXIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgZmllbGRcclxuICAgICAgICAgICAgLnZhbChKU09OLnN0cmluZ2lmeSh3b3JraG91cnMuZGF0YSkpXHJcbiAgICAgICAgICAgIC5jaGFuZ2UoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIC8vIERpc2FibGluZyBjYWxlbmRhciBvbiBmaWVsZCBhbGx0aW1lXHJcbiAgICAgICAgZm9ybS5maW5kKCdbbmFtZT1hbGx0aW1lXScpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyksXHJcbiAgICAgICAgY2wgPSB3b3JraG91cnMuY2xhc3Nlcy5kaXNhYmxlZDtcclxuICAgICAgICAgICAgaWYgKGNsKVxyXG4gICAgICAgICAgICAgICAgd29ya2hvdXJzLiRlbC50b2dnbGVDbGFzcyhjbCwgJHQucHJvcCgnY2hlY2tlZCcpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyohXG4gKiBpbWFnZXNMb2FkZWQgdjMuMS44XG4gKiBKYXZhU2NyaXB0IGlzIGFsbCBsaWtlIFwiWW91IGltYWdlcyBhcmUgZG9uZSB5ZXQgb3Igd2hhdD9cIlxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7ICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSwgcmVxdWlyZTogZmFsc2UgKi9cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdldmVudEVtaXR0ZXIvRXZlbnRFbWl0dGVyJyxcbiAgICAgICdldmVudGllL2V2ZW50aWUnXG4gICAgXSwgZnVuY3Rpb24oIEV2ZW50RW1pdHRlciwgZXZlbnRpZSApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIEV2ZW50RW1pdHRlciwgZXZlbnRpZSApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCd3b2xmeTg3LWV2ZW50ZW1pdHRlcicpLFxuICAgICAgcmVxdWlyZSgnZXZlbnRpZScpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5pbWFnZXNMb2FkZWQgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgd2luZG93LkV2ZW50RW1pdHRlcixcbiAgICAgIHdpbmRvdy5ldmVudGllXG4gICAgKTtcbiAgfVxuXG59KSggd2luZG93LFxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAgZmFjdG9yeSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5mdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIEV2ZW50RW1pdHRlciwgZXZlbnRpZSApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHdpbmRvdy5qUXVlcnk7XG52YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlO1xudmFyIGhhc0NvbnNvbGUgPSB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLy8gZXh0ZW5kIG9iamVjdHNcbmZ1bmN0aW9uIGV4dGVuZCggYSwgYiApIHtcbiAgZm9yICggdmFyIHByb3AgaW4gYiApIHtcbiAgICBhWyBwcm9wIF0gPSBiWyBwcm9wIF07XG4gIH1cbiAgcmV0dXJuIGE7XG59XG5cbnZhciBvYmpUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5mdW5jdGlvbiBpc0FycmF5KCBvYmogKSB7XG4gIHJldHVybiBvYmpUb1N0cmluZy5jYWxsKCBvYmogKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn1cblxuLy8gdHVybiBlbGVtZW50IG9yIG5vZGVMaXN0IGludG8gYW4gYXJyYXlcbmZ1bmN0aW9uIG1ha2VBcnJheSggb2JqICkge1xuICB2YXIgYXJ5ID0gW107XG4gIGlmICggaXNBcnJheSggb2JqICkgKSB7XG4gICAgLy8gdXNlIG9iamVjdCBpZiBhbHJlYWR5IGFuIGFycmF5XG4gICAgYXJ5ID0gb2JqO1xuICB9IGVsc2UgaWYgKCB0eXBlb2Ygb2JqLmxlbmd0aCA9PT0gJ251bWJlcicgKSB7XG4gICAgLy8gY29udmVydCBub2RlTGlzdCB0byBhcnJheVxuICAgIGZvciAoIHZhciBpPTAsIGxlbiA9IG9iai5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgIGFyeS5wdXNoKCBvYmpbaV0gKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gYXJyYXkgb2Ygc2luZ2xlIGluZGV4XG4gICAgYXJ5LnB1c2goIG9iaiApO1xuICB9XG4gIHJldHVybiBhcnk7XG59XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaW1hZ2VzTG9hZGVkIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXksIEVsZW1lbnQsIE5vZGVMaXN0LCBTdHJpbmd9IGVsZW1cbiAgICogQHBhcmFtIHtPYmplY3Qgb3IgRnVuY3Rpb259IG9wdGlvbnMgLSBpZiBmdW5jdGlvbiwgdXNlIGFzIGNhbGxiYWNrXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uQWx3YXlzIC0gY2FsbGJhY2sgZnVuY3Rpb25cbiAgICovXG4gIGZ1bmN0aW9uIEltYWdlc0xvYWRlZCggZWxlbSwgb3B0aW9ucywgb25BbHdheXMgKSB7XG4gICAgLy8gY29lcmNlIEltYWdlc0xvYWRlZCgpIHdpdGhvdXQgbmV3LCB0byBiZSBuZXcgSW1hZ2VzTG9hZGVkKClcbiAgICBpZiAoICEoIHRoaXMgaW5zdGFuY2VvZiBJbWFnZXNMb2FkZWQgKSApIHtcbiAgICAgIHJldHVybiBuZXcgSW1hZ2VzTG9hZGVkKCBlbGVtLCBvcHRpb25zICk7XG4gICAgfVxuICAgIC8vIHVzZSBlbGVtIGFzIHNlbGVjdG9yIHN0cmluZ1xuICAgIGlmICggdHlwZW9mIGVsZW0gPT09ICdzdHJpbmcnICkge1xuICAgICAgZWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIGVsZW0gKTtcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnRzID0gbWFrZUFycmF5KCBlbGVtICk7XG4gICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKCB7fSwgdGhpcy5vcHRpb25zICk7XG5cbiAgICBpZiAoIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgb25BbHdheXMgPSBvcHRpb25zO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHRlbmQoIHRoaXMub3B0aW9ucywgb3B0aW9ucyApO1xuICAgIH1cblxuICAgIGlmICggb25BbHdheXMgKSB7XG4gICAgICB0aGlzLm9uKCAnYWx3YXlzJywgb25BbHdheXMgKTtcbiAgICB9XG5cbiAgICB0aGlzLmdldEltYWdlcygpO1xuXG4gICAgaWYgKCAkICkge1xuICAgICAgLy8gYWRkIGpRdWVyeSBEZWZlcnJlZCBvYmplY3RcbiAgICAgIHRoaXMuanFEZWZlcnJlZCA9IG5ldyAkLkRlZmVycmVkKCk7XG4gICAgfVxuXG4gICAgLy8gSEFDSyBjaGVjayBhc3luYyB0byBhbGxvdyB0aW1lIHRvIGJpbmQgbGlzdGVuZXJzXG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLmNoZWNrKCk7XG4gICAgfSk7XG4gIH1cblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUub3B0aW9ucyA9IHt9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuZ2V0SW1hZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pbWFnZXMgPSBbXTtcblxuICAgIC8vIGZpbHRlciAmIGZpbmQgaXRlbXMgaWYgd2UgaGF2ZSBhbiBpdGVtIHNlbGVjdG9yXG4gICAgZm9yICggdmFyIGk9MCwgbGVuID0gdGhpcy5lbGVtZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgIHZhciBlbGVtID0gdGhpcy5lbGVtZW50c1tpXTtcbiAgICAgIC8vIGZpbHRlciBzaWJsaW5nc1xuICAgICAgaWYgKCBlbGVtLm5vZGVOYW1lID09PSAnSU1HJyApIHtcbiAgICAgICAgdGhpcy5hZGRJbWFnZSggZWxlbSApO1xuICAgICAgfVxuICAgICAgLy8gZmluZCBjaGlsZHJlblxuICAgICAgLy8gbm8gbm9uLWVsZW1lbnQgbm9kZXMsICMxNDNcbiAgICAgIHZhciBub2RlVHlwZSA9IGVsZW0ubm9kZVR5cGU7XG4gICAgICBpZiAoICFub2RlVHlwZSB8fCAhKCBub2RlVHlwZSA9PT0gMSB8fCBub2RlVHlwZSA9PT0gOSB8fCBub2RlVHlwZSA9PT0gMTEgKSApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB2YXIgY2hpbGRFbGVtcyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnaW1nJyk7XG4gICAgICAvLyBjb25jYXQgY2hpbGRFbGVtcyB0byBmaWx0ZXJGb3VuZCBhcnJheVxuICAgICAgZm9yICggdmFyIGo9MCwgakxlbiA9IGNoaWxkRWxlbXMubGVuZ3RoOyBqIDwgakxlbjsgaisrICkge1xuICAgICAgICB2YXIgaW1nID0gY2hpbGRFbGVtc1tqXTtcbiAgICAgICAgdGhpcy5hZGRJbWFnZSggaW1nICk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0ltYWdlfSBpbWdcbiAgICovXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuYWRkSW1hZ2UgPSBmdW5jdGlvbiggaW1nICkge1xuICAgIHZhciBsb2FkaW5nSW1hZ2UgPSBuZXcgTG9hZGluZ0ltYWdlKCBpbWcgKTtcbiAgICB0aGlzLmltYWdlcy5wdXNoKCBsb2FkaW5nSW1hZ2UgKTtcbiAgfTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgY2hlY2tlZENvdW50ID0gMDtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5pbWFnZXMubGVuZ3RoO1xuICAgIHRoaXMuaGFzQW55QnJva2VuID0gZmFsc2U7XG4gICAgLy8gY29tcGxldGUgaWYgbm8gaW1hZ2VzXG4gICAgaWYgKCAhbGVuZ3RoICkge1xuICAgICAgdGhpcy5jb21wbGV0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uQ29uZmlybSggaW1hZ2UsIG1lc3NhZ2UgKSB7XG4gICAgICBpZiAoIF90aGlzLm9wdGlvbnMuZGVidWcgJiYgaGFzQ29uc29sZSApIHtcbiAgICAgICAgY29uc29sZS5sb2coICdjb25maXJtJywgaW1hZ2UsIG1lc3NhZ2UgKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMucHJvZ3Jlc3MoIGltYWdlICk7XG4gICAgICBjaGVja2VkQ291bnQrKztcbiAgICAgIGlmICggY2hlY2tlZENvdW50ID09PSBsZW5ndGggKSB7XG4gICAgICAgIF90aGlzLmNvbXBsZXRlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTsgLy8gYmluZCBvbmNlXG4gICAgfVxuXG4gICAgZm9yICggdmFyIGk9MDsgaSA8IGxlbmd0aDsgaSsrICkge1xuICAgICAgdmFyIGxvYWRpbmdJbWFnZSA9IHRoaXMuaW1hZ2VzW2ldO1xuICAgICAgbG9hZGluZ0ltYWdlLm9uKCAnY29uZmlybScsIG9uQ29uZmlybSApO1xuICAgICAgbG9hZGluZ0ltYWdlLmNoZWNrKCk7XG4gICAgfVxuICB9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiggaW1hZ2UgKSB7XG4gICAgdGhpcy5oYXNBbnlCcm9rZW4gPSB0aGlzLmhhc0FueUJyb2tlbiB8fCAhaW1hZ2UuaXNMb2FkZWQ7XG4gICAgLy8gSEFDSyAtIENocm9tZSB0cmlnZ2VycyBldmVudCBiZWZvcmUgb2JqZWN0IHByb3BlcnRpZXMgaGF2ZSBjaGFuZ2VkLiAjODNcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuZW1pdCggJ3Byb2dyZXNzJywgX3RoaXMsIGltYWdlICk7XG4gICAgICBpZiAoIF90aGlzLmpxRGVmZXJyZWQgJiYgX3RoaXMuanFEZWZlcnJlZC5ub3RpZnkgKSB7XG4gICAgICAgIF90aGlzLmpxRGVmZXJyZWQubm90aWZ5KCBfdGhpcywgaW1hZ2UgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGV2ZW50TmFtZSA9IHRoaXMuaGFzQW55QnJva2VuID8gJ2ZhaWwnIDogJ2RvbmUnO1xuICAgIHRoaXMuaXNDb21wbGV0ZSA9IHRydWU7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAvLyBIQUNLIC0gYW5vdGhlciBzZXRUaW1lb3V0IHNvIHRoYXQgY29uZmlybSBoYXBwZW5zIGFmdGVyIHByb2dyZXNzXG4gICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5lbWl0KCBldmVudE5hbWUsIF90aGlzICk7XG4gICAgICBfdGhpcy5lbWl0KCAnYWx3YXlzJywgX3RoaXMgKTtcbiAgICAgIGlmICggX3RoaXMuanFEZWZlcnJlZCApIHtcbiAgICAgICAgdmFyIGpxTWV0aG9kID0gX3RoaXMuaGFzQW55QnJva2VuID8gJ3JlamVjdCcgOiAncmVzb2x2ZSc7XG4gICAgICAgIF90aGlzLmpxRGVmZXJyZWRbIGpxTWV0aG9kIF0oIF90aGlzICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0ganF1ZXJ5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgaWYgKCAkICkge1xuICAgICQuZm4uaW1hZ2VzTG9hZGVkID0gZnVuY3Rpb24oIG9wdGlvbnMsIGNhbGxiYWNrICkge1xuICAgICAgdmFyIGluc3RhbmNlID0gbmV3IEltYWdlc0xvYWRlZCggdGhpcywgb3B0aW9ucywgY2FsbGJhY2sgKTtcbiAgICAgIHJldHVybiBpbnN0YW5jZS5qcURlZmVycmVkLnByb21pc2UoICQodGhpcykgKTtcbiAgICB9O1xuICB9XG5cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICBmdW5jdGlvbiBMb2FkaW5nSW1hZ2UoIGltZyApIHtcbiAgICB0aGlzLmltZyA9IGltZztcbiAgfVxuXG4gIExvYWRpbmdJbWFnZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGZpcnN0IGNoZWNrIGNhY2hlZCBhbnkgcHJldmlvdXMgaW1hZ2VzIHRoYXQgaGF2ZSBzYW1lIHNyY1xuICAgIHZhciByZXNvdXJjZSA9IGNhY2hlWyB0aGlzLmltZy5zcmMgXSB8fCBuZXcgUmVzb3VyY2UoIHRoaXMuaW1nLnNyYyApO1xuICAgIGlmICggcmVzb3VyY2UuaXNDb25maXJtZWQgKSB7XG4gICAgICB0aGlzLmNvbmZpcm0oIHJlc291cmNlLmlzTG9hZGVkLCAnY2FjaGVkIHdhcyBjb25maXJtZWQnICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgY29tcGxldGUgaXMgdHJ1ZSBhbmQgYnJvd3NlciBzdXBwb3J0cyBuYXR1cmFsIHNpemVzLFxuICAgIC8vIHRyeSB0byBjaGVjayBmb3IgaW1hZ2Ugc3RhdHVzIG1hbnVhbGx5LlxuICAgIGlmICggdGhpcy5pbWcuY29tcGxldGUgJiYgdGhpcy5pbWcubmF0dXJhbFdpZHRoICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAvLyByZXBvcnQgYmFzZWQgb24gbmF0dXJhbFdpZHRoXG4gICAgICB0aGlzLmNvbmZpcm0oIHRoaXMuaW1nLm5hdHVyYWxXaWR0aCAhPT0gMCwgJ25hdHVyYWxXaWR0aCcgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiBub25lIG9mIHRoZSBjaGVja3MgYWJvdmUgbWF0Y2hlZCwgc2ltdWxhdGUgbG9hZGluZyBvbiBkZXRhY2hlZCBlbGVtZW50LlxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgcmVzb3VyY2Uub24oICdjb25maXJtJywgZnVuY3Rpb24oIHJlc3JjLCBtZXNzYWdlICkge1xuICAgICAgX3RoaXMuY29uZmlybSggcmVzcmMuaXNMb2FkZWQsIG1lc3NhZ2UgKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgcmVzb3VyY2UuY2hlY2soKTtcbiAgfTtcblxuICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlLmNvbmZpcm0gPSBmdW5jdGlvbiggaXNMb2FkZWQsIG1lc3NhZ2UgKSB7XG4gICAgdGhpcy5pc0xvYWRlZCA9IGlzTG9hZGVkO1xuICAgIHRoaXMuZW1pdCggJ2NvbmZpcm0nLCB0aGlzLCBtZXNzYWdlICk7XG4gIH07XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUmVzb3VyY2UgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvLyBSZXNvdXJjZSBjaGVja3MgZWFjaCBzcmMsIG9ubHkgb25jZVxuICAvLyBzZXBhcmF0ZSBjbGFzcyBmcm9tIExvYWRpbmdJbWFnZSB0byBwcmV2ZW50IG1lbW9yeSBsZWFrcy4gU2VlICMxMTVcblxuICB2YXIgY2FjaGUgPSB7fTtcblxuICBmdW5jdGlvbiBSZXNvdXJjZSggc3JjICkge1xuICAgIHRoaXMuc3JjID0gc3JjO1xuICAgIC8vIGFkZCB0byBjYWNoZVxuICAgIGNhY2hlWyBzcmMgXSA9IHRoaXM7XG4gIH1cblxuICBSZXNvdXJjZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgUmVzb3VyY2UucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gb25seSB0cmlnZ2VyIGNoZWNraW5nIG9uY2VcbiAgICBpZiAoIHRoaXMuaXNDaGVja2VkICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBzaW11bGF0ZSBsb2FkaW5nIG9uIGRldGFjaGVkIGVsZW1lbnRcbiAgICB2YXIgcHJveHlJbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIGV2ZW50aWUuYmluZCggcHJveHlJbWFnZSwgJ2xvYWQnLCB0aGlzICk7XG4gICAgZXZlbnRpZS5iaW5kKCBwcm94eUltYWdlLCAnZXJyb3InLCB0aGlzICk7XG4gICAgcHJveHlJbWFnZS5zcmMgPSB0aGlzLnNyYztcbiAgICAvLyBzZXQgZmxhZ1xuICAgIHRoaXMuaXNDaGVja2VkID0gdHJ1ZTtcbiAgfTtcblxuICAvLyAtLS0tLSBldmVudHMgLS0tLS0gLy9cblxuICAvLyB0cmlnZ2VyIHNwZWNpZmllZCBoYW5kbGVyIGZvciBldmVudCB0eXBlXG4gIFJlc291cmNlLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgICB2YXIgbWV0aG9kID0gJ29uJyArIGV2ZW50LnR5cGU7XG4gICAgaWYgKCB0aGlzWyBtZXRob2QgXSApIHtcbiAgICAgIHRoaXNbIG1ldGhvZCBdKCBldmVudCApO1xuICAgIH1cbiAgfTtcblxuICBSZXNvdXJjZS5wcm90b3R5cGUub25sb2FkID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAgIHRoaXMuY29uZmlybSggdHJ1ZSwgJ29ubG9hZCcgKTtcbiAgICB0aGlzLnVuYmluZFByb3h5RXZlbnRzKCBldmVudCApO1xuICB9O1xuXG4gIFJlc291cmNlLnByb3RvdHlwZS5vbmVycm9yID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAgIHRoaXMuY29uZmlybSggZmFsc2UsICdvbmVycm9yJyApO1xuICAgIHRoaXMudW5iaW5kUHJveHlFdmVudHMoIGV2ZW50ICk7XG4gIH07XG5cbiAgLy8gLS0tLS0gY29uZmlybSAtLS0tLSAvL1xuXG4gIFJlc291cmNlLnByb3RvdHlwZS5jb25maXJtID0gZnVuY3Rpb24oIGlzTG9hZGVkLCBtZXNzYWdlICkge1xuICAgIHRoaXMuaXNDb25maXJtZWQgPSB0cnVlO1xuICAgIHRoaXMuaXNMb2FkZWQgPSBpc0xvYWRlZDtcbiAgICB0aGlzLmVtaXQoICdjb25maXJtJywgdGhpcywgbWVzc2FnZSApO1xuICB9O1xuXG4gIFJlc291cmNlLnByb3RvdHlwZS51bmJpbmRQcm94eUV2ZW50cyA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgICBldmVudGllLnVuYmluZCggZXZlbnQudGFyZ2V0LCAnbG9hZCcsIHRoaXMgKTtcbiAgICBldmVudGllLnVuYmluZCggZXZlbnQudGFyZ2V0LCAnZXJyb3InLCB0aGlzICk7XG4gIH07XG5cbiAgLy8gLS0tLS0gIC0tLS0tIC8vXG5cbiAgcmV0dXJuIEltYWdlc0xvYWRlZDtcblxufSk7XG4iLCIvKiFcbiAqIGV2ZW50aWUgdjEuMC41XG4gKiBldmVudCBiaW5kaW5nIGhlbHBlclxuICogICBldmVudGllLmJpbmQoIGVsZW0sICdjbGljaycsIG15Rm4gKVxuICogICBldmVudGllLnVuYmluZCggZWxlbSwgJ2NsaWNrJywgbXlGbiApXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUgKi9cbi8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UgKi9cblxuKCBmdW5jdGlvbiggd2luZG93ICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXG52YXIgYmluZCA9IGZ1bmN0aW9uKCkge307XG5cbmZ1bmN0aW9uIGdldElFRXZlbnQoIG9iaiApIHtcbiAgdmFyIGV2ZW50ID0gd2luZG93LmV2ZW50O1xuICAvLyBhZGQgZXZlbnQudGFyZ2V0XG4gIGV2ZW50LnRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5zcmNFbGVtZW50IHx8IG9iajtcbiAgcmV0dXJuIGV2ZW50O1xufVxuXG5pZiAoIGRvY0VsZW0uYWRkRXZlbnRMaXN0ZW5lciApIHtcbiAgYmluZCA9IGZ1bmN0aW9uKCBvYmosIHR5cGUsIGZuICkge1xuICAgIG9iai5hZGRFdmVudExpc3RlbmVyKCB0eXBlLCBmbiwgZmFsc2UgKTtcbiAgfTtcbn0gZWxzZSBpZiAoIGRvY0VsZW0uYXR0YWNoRXZlbnQgKSB7XG4gIGJpbmQgPSBmdW5jdGlvbiggb2JqLCB0eXBlLCBmbiApIHtcbiAgICBvYmpbIHR5cGUgKyBmbiBdID0gZm4uaGFuZGxlRXZlbnQgP1xuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBldmVudCA9IGdldElFRXZlbnQoIG9iaiApO1xuICAgICAgICBmbi5oYW5kbGVFdmVudC5jYWxsKCBmbiwgZXZlbnQgKTtcbiAgICAgIH0gOlxuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBldmVudCA9IGdldElFRXZlbnQoIG9iaiApO1xuICAgICAgICBmbi5jYWxsKCBvYmosIGV2ZW50ICk7XG4gICAgICB9O1xuICAgIG9iai5hdHRhY2hFdmVudCggXCJvblwiICsgdHlwZSwgb2JqWyB0eXBlICsgZm4gXSApO1xuICB9O1xufVxuXG52YXIgdW5iaW5kID0gZnVuY3Rpb24oKSB7fTtcblxuaWYgKCBkb2NFbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIgKSB7XG4gIHVuYmluZCA9IGZ1bmN0aW9uKCBvYmosIHR5cGUsIGZuICkge1xuICAgIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKCB0eXBlLCBmbiwgZmFsc2UgKTtcbiAgfTtcbn0gZWxzZSBpZiAoIGRvY0VsZW0uZGV0YWNoRXZlbnQgKSB7XG4gIHVuYmluZCA9IGZ1bmN0aW9uKCBvYmosIHR5cGUsIGZuICkge1xuICAgIG9iai5kZXRhY2hFdmVudCggXCJvblwiICsgdHlwZSwgb2JqWyB0eXBlICsgZm4gXSApO1xuICAgIHRyeSB7XG4gICAgICBkZWxldGUgb2JqWyB0eXBlICsgZm4gXTtcbiAgICB9IGNhdGNoICggZXJyICkge1xuICAgICAgLy8gY2FuJ3QgZGVsZXRlIHdpbmRvdyBvYmplY3QgcHJvcGVydGllc1xuICAgICAgb2JqWyB0eXBlICsgZm4gXSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH07XG59XG5cbnZhciBldmVudGllID0ge1xuICBiaW5kOiBiaW5kLFxuICB1bmJpbmQ6IHVuYmluZFxufTtcblxuLy8gLS0tLS0gbW9kdWxlIGRlZmluaXRpb24gLS0tLS0gLy9cblxuaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gIC8vIEFNRFxuICBkZWZpbmUoIGV2ZW50aWUgKTtcbn0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyApIHtcbiAgLy8gQ29tbW9uSlNcbiAgbW9kdWxlLmV4cG9ydHMgPSBldmVudGllO1xufSBlbHNlIHtcbiAgLy8gYnJvd3NlciBnbG9iYWxcbiAgd2luZG93LmV2ZW50aWUgPSBldmVudGllO1xufVxuXG59KSggdGhpcyApO1xuIiwiLyohXG4gKiBFdmVudEVtaXR0ZXIgdjQuMi42IC0gZ2l0LmlvL2VlXG4gKiBPbGl2ZXIgQ2FsZHdlbGxcbiAqIE1JVCBsaWNlbnNlXG4gKiBAcHJlc2VydmVcbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0LyoqXG5cdCAqIENsYXNzIGZvciBtYW5hZ2luZyBldmVudHMuXG5cdCAqIENhbiBiZSBleHRlbmRlZCB0byBwcm92aWRlIGV2ZW50IGZ1bmN0aW9uYWxpdHkgaW4gb3RoZXIgY2xhc3Nlcy5cblx0ICpcblx0ICogQGNsYXNzIEV2ZW50RW1pdHRlciBNYW5hZ2VzIGV2ZW50IHJlZ2lzdGVyaW5nIGFuZCBlbWl0dGluZy5cblx0ICovXG5cdGZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHt9XG5cblx0Ly8gU2hvcnRjdXRzIHRvIGltcHJvdmUgc3BlZWQgYW5kIHNpemVcblx0dmFyIHByb3RvID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZTtcblx0dmFyIGV4cG9ydHMgPSB0aGlzO1xuXHR2YXIgb3JpZ2luYWxHbG9iYWxWYWx1ZSA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyO1xuXG5cdC8qKlxuXHQgKiBGaW5kcyB0aGUgaW5kZXggb2YgdGhlIGxpc3RlbmVyIGZvciB0aGUgZXZlbnQgaW4gaXQncyBzdG9yYWdlIGFycmF5LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IGxpc3RlbmVycyBBcnJheSBvZiBsaXN0ZW5lcnMgdG8gc2VhcmNoIHRocm91Z2guXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBsb29rIGZvci5cblx0ICogQHJldHVybiB7TnVtYmVyfSBJbmRleCBvZiB0aGUgc3BlY2lmaWVkIGxpc3RlbmVyLCAtMSBpZiBub3QgZm91bmRcblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzLCBsaXN0ZW5lcikge1xuXHRcdHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gLTE7XG5cdH1cblxuXHQvKipcblx0ICogQWxpYXMgYSBtZXRob2Qgd2hpbGUga2VlcGluZyB0aGUgY29udGV4dCBjb3JyZWN0LCB0byBhbGxvdyBmb3Igb3ZlcndyaXRpbmcgb2YgdGFyZ2V0IG1ldGhvZC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHRhcmdldCBtZXRob2QuXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgYWxpYXNlZCBtZXRob2Rcblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhbGlhcyhuYW1lKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIGFsaWFzQ2xvc3VyZSgpIHtcblx0XHRcdHJldHVybiB0aGlzW25hbWVdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBsaXN0ZW5lciBhcnJheSBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogV2lsbCBpbml0aWFsaXNlIHRoZSBldmVudCBvYmplY3QgYW5kIGxpc3RlbmVyIGFycmF5cyBpZiByZXF1aXJlZC5cblx0ICogV2lsbCByZXR1cm4gYW4gb2JqZWN0IGlmIHlvdSB1c2UgYSByZWdleCBzZWFyY2guIFRoZSBvYmplY3QgY29udGFpbnMga2V5cyBmb3IgZWFjaCBtYXRjaGVkIGV2ZW50LiBTbyAvYmFbcnpdLyBtaWdodCByZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgYmFyIGFuZCBiYXouIEJ1dCBvbmx5IGlmIHlvdSBoYXZlIGVpdGhlciBkZWZpbmVkIHRoZW0gd2l0aCBkZWZpbmVFdmVudCBvciBhZGRlZCBzb21lIGxpc3RlbmVycyB0byB0aGVtLlxuXHQgKiBFYWNoIHByb3BlcnR5IGluIHRoZSBvYmplY3QgcmVzcG9uc2UgaXMgYW4gYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbltdfE9iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgdGhlIGV2ZW50LlxuXHQgKi9cblx0cHJvdG8uZ2V0TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzKGV2dCkge1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cdFx0dmFyIGtleTtcblxuXHRcdC8vIFJldHVybiBhIGNvbmNhdGVuYXRlZCBhcnJheSBvZiBhbGwgbWF0Y2hpbmcgZXZlbnRzIGlmXG5cdFx0Ly8gdGhlIHNlbGVjdG9yIGlzIGEgcmVndWxhciBleHByZXNzaW9uLlxuXHRcdGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0cmVzcG9uc2UgPSB7fTtcblx0XHRcdGZvciAoa2V5IGluIGV2ZW50cykge1xuXHRcdFx0XHRpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuXHRcdFx0XHRcdHJlc3BvbnNlW2tleV0gPSBldmVudHNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJlc3BvbnNlID0gZXZlbnRzW2V2dF0gfHwgKGV2ZW50c1tldnRdID0gW10pO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZTtcblx0fTtcblxuXHQvKipcblx0ICogVGFrZXMgYSBsaXN0IG9mIGxpc3RlbmVyIG9iamVjdHMgYW5kIGZsYXR0ZW5zIGl0IGludG8gYSBsaXN0IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3RbXX0gbGlzdGVuZXJzIFJhdyBsaXN0ZW5lciBvYmplY3RzLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbltdfSBKdXN0IHRoZSBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqL1xuXHRwcm90by5mbGF0dGVuTGlzdGVuZXJzID0gZnVuY3Rpb24gZmxhdHRlbkxpc3RlbmVycyhsaXN0ZW5lcnMpIHtcblx0XHR2YXIgZmxhdExpc3RlbmVycyA9IFtdO1xuXHRcdHZhciBpO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0ZmxhdExpc3RlbmVycy5wdXNoKGxpc3RlbmVyc1tpXS5saXN0ZW5lcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZsYXRMaXN0ZW5lcnM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIHJlcXVlc3RlZCBsaXN0ZW5lcnMgdmlhIGdldExpc3RlbmVycyBidXQgd2lsbCBhbHdheXMgcmV0dXJuIHRoZSByZXN1bHRzIGluc2lkZSBhbiBvYmplY3QuIFRoaXMgaXMgbWFpbmx5IGZvciBpbnRlcm5hbCB1c2UgYnV0IG90aGVycyBtYXkgZmluZCBpdCB1c2VmdWwuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgYW4gZXZlbnQgaW4gYW4gb2JqZWN0LlxuXHQgKi9cblx0cHJvdG8uZ2V0TGlzdGVuZXJzQXNPYmplY3QgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnNBc09iamVjdChldnQpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cblx0XHRpZiAobGlzdGVuZXJzIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRyZXNwb25zZVtldnRdID0gbGlzdGVuZXJzO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZSB8fCBsaXN0ZW5lcnM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFkZHMgYSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBUaGUgbGlzdGVuZXIgd2lsbCBub3QgYmUgYWRkZWQgaWYgaXQgaXMgYSBkdXBsaWNhdGUuXG5cdCAqIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgaXQgaXMgY2FsbGVkLlxuXHQgKiBJZiB5b3UgcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSB0aGVuIHRoZSBsaXN0ZW5lciB3aWxsIGJlIGFkZGVkIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgbGlzdGVuZXJJc1dyYXBwZWQgPSB0eXBlb2YgbGlzdGVuZXIgPT09ICdvYmplY3QnO1xuXHRcdHZhciBrZXk7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKSA9PT0gLTEpIHtcblx0XHRcdFx0bGlzdGVuZXJzW2tleV0ucHVzaChsaXN0ZW5lcklzV3JhcHBlZCA/IGxpc3RlbmVyIDoge1xuXHRcdFx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRcdFx0XHRvbmNlOiBmYWxzZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgYWRkTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9uID0gYWxpYXMoJ2FkZExpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIFNlbWktYWxpYXMgb2YgYWRkTGlzdGVuZXIuIEl0IHdpbGwgYWRkIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlXG5cdCAqIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGZpcnN0IGV4ZWN1dGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkT25jZUxpc3RlbmVyID0gZnVuY3Rpb24gYWRkT25jZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldnQsIHtcblx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRcdG9uY2U6IHRydWVcblx0XHR9KTtcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgYWRkT25jZUxpc3RlbmVyLlxuXHQgKi9cblx0cHJvdG8ub25jZSA9IGFsaWFzKCdhZGRPbmNlTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogRGVmaW5lcyBhbiBldmVudCBuYW1lLiBUaGlzIGlzIHJlcXVpcmVkIGlmIHlvdSB3YW50IHRvIHVzZSBhIHJlZ2V4IHRvIGFkZCBhIGxpc3RlbmVyIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBJZiB5b3UgZG9uJ3QgZG8gdGhpcyB0aGVuIGhvdyBkbyB5b3UgZXhwZWN0IGl0IHRvIGtub3cgd2hhdCBldmVudCB0byBhZGQgdG8/IFNob3VsZCBpdCBqdXN0IGFkZCB0byBldmVyeSBwb3NzaWJsZSBtYXRjaCBmb3IgYSByZWdleD8gTm8uIFRoYXQgaXMgc2NhcnkgYW5kIGJhZC5cblx0ICogWW91IG5lZWQgdG8gdGVsbCBpdCB3aGF0IGV2ZW50IG5hbWVzIHNob3VsZCBiZSBtYXRjaGVkIGJ5IGEgcmVnZXguXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gY3JlYXRlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmRlZmluZUV2ZW50ID0gZnVuY3Rpb24gZGVmaW5lRXZlbnQoZXZ0KSB7XG5cdFx0dGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogVXNlcyBkZWZpbmVFdmVudCB0byBkZWZpbmUgbXVsdGlwbGUgZXZlbnRzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ1tdfSBldnRzIEFuIGFycmF5IG9mIGV2ZW50IG5hbWVzIHRvIGRlZmluZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudHMgPSBmdW5jdGlvbiBkZWZpbmVFdmVudHMoZXZ0cykge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZXZ0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dGhpcy5kZWZpbmVFdmVudChldnRzW2ldKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYSBsaXN0ZW5lciBmdW5jdGlvbiBmcm9tIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdoZW4gcGFzc2VkIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lLCBpdCB3aWxsIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBpbmRleDtcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aW5kZXggPSBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKTtcblxuXHRcdFx0XHRpZiAoaW5kZXggIT09IC0xKSB7XG5cdFx0XHRcdFx0bGlzdGVuZXJzW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVMaXN0ZW5lclxuXHQgKi9cblx0cHJvdG8ub2ZmID0gYWxpYXMoJ3JlbW92ZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIEFkZHMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIGFkZCB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICogWWVhaCwgdGhpcyBmdW5jdGlvbiBkb2VzIHF1aXRlIGEgYml0LiBUaGF0J3MgcHJvYmFibHkgYSBiYWQgdGhpbmcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHQvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuXHRcdHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnMoZmFsc2UsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIHJlbW92ZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXJzIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIHJlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHQvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuXHRcdHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnModHJ1ZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBFZGl0cyBsaXN0ZW5lcnMgaW4gYnVsay4gVGhlIGFkZExpc3RlbmVycyBhbmQgcmVtb3ZlTGlzdGVuZXJzIG1ldGhvZHMgYm90aCB1c2UgdGhpcyB0byBkbyB0aGVpciBqb2IuIFlvdSBzaG91bGQgcmVhbGx5IHVzZSB0aG9zZSBpbnN0ZWFkLCB0aGlzIGlzIGEgbGl0dGxlIGxvd2VyIGxldmVsLlxuXHQgKiBUaGUgZmlyc3QgYXJndW1lbnQgd2lsbCBkZXRlcm1pbmUgaWYgdGhlIGxpc3RlbmVycyBhcmUgcmVtb3ZlZCAodHJ1ZSkgb3IgYWRkZWQgKGZhbHNlKS5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkL3JlbW92ZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIG1hbmlwdWxhdGUgdGhlIGxpc3RlbmVycyBvZiBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVtb3ZlIFRydWUgaWYgeW91IHdhbnQgdG8gcmVtb3ZlIGxpc3RlbmVycywgZmFsc2UgaWYgeW91IHdhbnQgdG8gYWRkLlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLm1hbmlwdWxhdGVMaXN0ZW5lcnMgPSBmdW5jdGlvbiBtYW5pcHVsYXRlTGlzdGVuZXJzKHJlbW92ZSwgZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHR2YXIgaTtcblx0XHR2YXIgdmFsdWU7XG5cdFx0dmFyIHNpbmdsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXIgOiB0aGlzLmFkZExpc3RlbmVyO1xuXHRcdHZhciBtdWx0aXBsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXJzIDogdGhpcy5hZGRMaXN0ZW5lcnM7XG5cblx0XHQvLyBJZiBldnQgaXMgYW4gb2JqZWN0IHRoZW4gcGFzcyBlYWNoIG9mIGl0J3MgcHJvcGVydGllcyB0byB0aGlzIG1ldGhvZFxuXHRcdGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0JyAmJiAhKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcblx0XHRcdGZvciAoaSBpbiBldnQpIHtcblx0XHRcdFx0aWYgKGV2dC5oYXNPd25Qcm9wZXJ0eShpKSAmJiAodmFsdWUgPSBldnRbaV0pKSB7XG5cdFx0XHRcdFx0Ly8gUGFzcyB0aGUgc2luZ2xlIGxpc3RlbmVyIHN0cmFpZ2h0IHRocm91Z2ggdG8gdGhlIHNpbmd1bGFyIG1ldGhvZFxuXHRcdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyBPdGhlcndpc2UgcGFzcyBiYWNrIHRvIHRoZSBtdWx0aXBsZSBmdW5jdGlvblxuXHRcdFx0XHRcdFx0bXVsdGlwbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gU28gZXZ0IG11c3QgYmUgYSBzdHJpbmdcblx0XHRcdC8vIEFuZCBsaXN0ZW5lcnMgbXVzdCBiZSBhbiBhcnJheSBvZiBsaXN0ZW5lcnNcblx0XHRcdC8vIExvb3Agb3ZlciBpdCBhbmQgcGFzcyBlYWNoIG9uZSB0byB0aGUgbXVsdGlwbGUgbWV0aG9kXG5cdFx0XHRpID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0c2luZ2xlLmNhbGwodGhpcywgZXZ0LCBsaXN0ZW5lcnNbaV0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgZnJvbSBhIHNwZWNpZmllZCBldmVudC5cblx0ICogSWYgeW91IGRvIG5vdCBzcGVjaWZ5IGFuIGV2ZW50IHRoZW4gYWxsIGxpc3RlbmVycyB3aWxsIGJlIHJlbW92ZWQuXG5cdCAqIFRoYXQgbWVhbnMgZXZlcnkgZXZlbnQgd2lsbCBiZSBlbXB0aWVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ2V4IHRvIHJlbW92ZSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gW2V2dF0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLiBXaWxsIHJlbW92ZSBmcm9tIGV2ZXJ5IGV2ZW50IGlmIG5vdCBwYXNzZWQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbiByZW1vdmVFdmVudChldnQpIHtcblx0XHR2YXIgdHlwZSA9IHR5cGVvZiBldnQ7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZW1vdmUgZGlmZmVyZW50IHRoaW5ncyBkZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIGV2dFxuXHRcdGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnRcblx0XHRcdGRlbGV0ZSBldmVudHNbZXZ0XTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgZXZlbnRzIG1hdGNoaW5nIHRoZSByZWdleC5cblx0XHRcdGZvciAoa2V5IGluIGV2ZW50cykge1xuXHRcdFx0XHRpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuXHRcdFx0XHRcdGRlbGV0ZSBldmVudHNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGluIGFsbCBldmVudHNcblx0XHRcdGRlbGV0ZSB0aGlzLl9ldmVudHM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIHJlbW92ZUV2ZW50LlxuXHQgKlxuXHQgKiBBZGRlZCB0byBtaXJyb3IgdGhlIG5vZGUgQVBJLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlQWxsTGlzdGVuZXJzID0gYWxpYXMoJ3JlbW92ZUV2ZW50Jyk7XG5cblx0LyoqXG5cdCAqIEVtaXRzIGFuIGV2ZW50IG9mIHlvdXIgY2hvaWNlLlxuXHQgKiBXaGVuIGVtaXR0ZWQsIGV2ZXJ5IGxpc3RlbmVyIGF0dGFjaGVkIHRvIHRoYXQgZXZlbnQgd2lsbCBiZSBleGVjdXRlZC5cblx0ICogSWYgeW91IHBhc3MgdGhlIG9wdGlvbmFsIGFyZ3VtZW50IGFycmF5IHRoZW4gdGhvc2UgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIHRvIGV2ZXJ5IGxpc3RlbmVyIHVwb24gZXhlY3V0aW9uLlxuXHQgKiBCZWNhdXNlIGl0IHVzZXMgYGFwcGx5YCwgeW91ciBhcnJheSBvZiBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgYXMgaWYgeW91IHdyb3RlIHRoZW0gb3V0IHNlcGFyYXRlbHkuXG5cdCAqIFNvIHRoZXkgd2lsbCBub3QgYXJyaXZlIHdpdGhpbiB0aGUgYXJyYXkgb24gdGhlIG90aGVyIHNpZGUsIHRoZXkgd2lsbCBiZSBzZXBhcmF0ZS5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdIE9wdGlvbmFsIGFycmF5IG9mIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0RXZlbnQgPSBmdW5jdGlvbiBlbWl0RXZlbnQoZXZ0LCBhcmdzKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgbGlzdGVuZXI7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIGtleTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpID0gbGlzdGVuZXJzW2tleV0ubGVuZ3RoO1xuXG5cdFx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0XHQvLyBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgc2hhbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBldmVudFxuXHRcdFx0XHRcdC8vIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBlaXRoZXIgd2l0aCBhIGJhc2ljIGNhbGwgb3IgYW4gYXBwbHkgaWYgdGhlcmUgaXMgYW4gYXJncyBhcnJheVxuXHRcdFx0XHRcdGxpc3RlbmVyID0gbGlzdGVuZXJzW2tleV1baV07XG5cblx0XHRcdFx0XHRpZiAobGlzdGVuZXIub25jZSA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXNwb25zZSA9IGxpc3RlbmVyLmxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MgfHwgW10pO1xuXG5cdFx0XHRcdFx0aWYgKHJlc3BvbnNlID09PSB0aGlzLl9nZXRPbmNlUmV0dXJuVmFsdWUoKSkge1xuXHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgZW1pdEV2ZW50XG5cdCAqL1xuXHRwcm90by50cmlnZ2VyID0gYWxpYXMoJ2VtaXRFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBTdWJ0bHkgZGlmZmVyZW50IGZyb20gZW1pdEV2ZW50IGluIHRoYXQgaXQgd2lsbCBwYXNzIGl0cyBhcmd1bWVudHMgb24gdG8gdGhlIGxpc3RlbmVycywgYXMgb3Bwb3NlZCB0byB0YWtpbmcgYSBzaW5nbGUgYXJyYXkgb2YgYXJndW1lbnRzIHRvIHBhc3Mgb24uXG5cdCAqIEFzIHdpdGggZW1pdEV2ZW50LCB5b3UgY2FuIHBhc3MgYSByZWdleCBpbiBwbGFjZSBvZiB0aGUgZXZlbnQgbmFtZSB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuXHQgKiBAcGFyYW0gey4uLip9IE9wdGlvbmFsIGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2dCkge1xuXHRcdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0XHRyZXR1cm4gdGhpcy5lbWl0RXZlbnQoZXZ0LCBhcmdzKTtcblx0fTtcblxuXHQvKipcblx0ICogU2V0cyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWYgYVxuXHQgKiBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhlIG9uZSBzZXQgaGVyZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZFxuXHQgKiBhZnRlciBleGVjdXRpb24uIFRoaXMgdmFsdWUgZGVmYXVsdHMgdG8gdHJ1ZS5cblx0ICpcblx0ICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIHRvIGNoZWNrIGZvciB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uc2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gc2V0T25jZVJldHVyblZhbHVlKHZhbHVlKSB7XG5cdFx0dGhpcy5fb25jZVJldHVyblZhbHVlID0gdmFsdWU7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmXG5cdCAqIHRoZSBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhpcyBvbmUgdGhlbiBpdCBzaG91bGQgYmUgcmVtb3ZlZFxuXHQgKiBhdXRvbWF0aWNhbGx5LiBJdCB3aWxsIHJldHVybiB0cnVlIGJ5IGRlZmF1bHQuXG5cdCAqXG5cdCAqIEByZXR1cm4geyp8Qm9vbGVhbn0gVGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgZm9yIG9yIHRoZSBkZWZhdWx0LCB0cnVlLlxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdHByb3RvLl9nZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBfZ2V0T25jZVJldHVyblZhbHVlKCkge1xuXHRcdGlmICh0aGlzLmhhc093blByb3BlcnR5KCdfb25jZVJldHVyblZhbHVlJykpIHtcblx0XHRcdHJldHVybiB0aGlzLl9vbmNlUmV0dXJuVmFsdWU7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBldmVudHMgb2JqZWN0IGFuZCBjcmVhdGVzIG9uZSBpZiByZXF1aXJlZC5cblx0ICpcblx0ICogQHJldHVybiB7T2JqZWN0fSBUaGUgZXZlbnRzIHN0b3JhZ2Ugb2JqZWN0LlxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdHByb3RvLl9nZXRFdmVudHMgPSBmdW5jdGlvbiBfZ2V0RXZlbnRzKCkge1xuXHRcdHJldHVybiB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcblx0fTtcblxuXHQvKipcblx0ICogUmV2ZXJ0cyB0aGUgZ2xvYmFsIHtAbGluayBFdmVudEVtaXR0ZXJ9IHRvIGl0cyBwcmV2aW91cyB2YWx1ZSBhbmQgcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGlzIHZlcnNpb24uXG5cdCAqXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBOb24gY29uZmxpY3RpbmcgRXZlbnRFbWl0dGVyIGNsYXNzLlxuXHQgKi9cblx0RXZlbnRFbWl0dGVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuXHRcdGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gb3JpZ2luYWxHbG9iYWxWYWx1ZTtcblx0XHRyZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHR9O1xuXG5cdC8vIEV4cG9zZSB0aGUgY2xhc3MgZWl0aGVyIHZpYSBBTUQsIENvbW1vbkpTIG9yIHRoZSBnbG9iYWwgb2JqZWN0XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0XHR9KTtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyl7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cdH1cblx0ZWxzZSB7XG5cdFx0dGhpcy5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cdH1cbn0uY2FsbCh0aGlzKSk7XG4iXX0=
