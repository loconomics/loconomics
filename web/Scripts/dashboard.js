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
    $('html').on('ajaxFormReturnedHtml', '.DashboardAboutYou form.ajax', initAboutYou);
    initAboutYou();

    /* Your work init */
    $('html').on('ajaxFormReturnedHtml', '.DashboardYourWork form.ajax', initYourWorkDom);
    initYourWorkDom();

    /* Availabilty */
    initAvailability();
    $('.DashboardAvailability').on('ajaxFormReturnedHtml', initAvailability);
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
},{"../LC/LcUrl":1,"../LC/ProviderPosition":2,"../LC/toggle":8,"./dashboard/addPosition":10,"./dashboard/appointmentsCrudl":11,"./dashboard/calendarSync":13,"./dashboard/changeProfilePhoto":14,"./dashboard/educationCrudl":15,"./dashboard/generateBookNowButton":16,"./dashboard/licensesCrudl":17,"./dashboard/locationsCrudl":18,"./dashboard/managePhotosUI":19,"./dashboard/monthlySchedule":20,"./dashboard/paymentAccount":21,"./dashboard/pricingCrudl":22,"./dashboard/privacySettings":23,"./dashboard/serviceAttributesValidation":24,"./dashboard/verificationsActions":25,"./dashboard/verificationsCrudl":26,"./dashboard/weeklySchedule":27}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
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

},{"imagesLoaded":28}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
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
},{}],24:[function(require,module,exports){
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
          var cat = fs.children('legend').text();
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

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

},{"./backgroundCheckRequest":12}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{"eventie":29,"wolfy87-eventemitter":30}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvTGNVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvUHJvdmlkZXJQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9nZ2xlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9hZGRQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2FwcG9pbnRtZW50c0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvYmFja2dyb3VuZENoZWNrUmVxdWVzdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NhbGVuZGFyU3luYy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NoYW5nZVByb2ZpbGVQaG90by5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2VkdWNhdGlvbkNydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvZ2VuZXJhdGVCb29rTm93QnV0dG9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbGljZW5zZXNDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2xvY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9tb250aGx5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9wYXltZW50QWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaWNpbmdDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaXZhY3lTZXR0aW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3NlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNBY3Rpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvd2Vla2x5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL25vZGVfbW9kdWxlcy9pbWFnZXNMb2FkZWQvaW1hZ2VzbG9hZGVkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvaW1hZ2VzTG9hZGVkL25vZGVfbW9kdWxlcy9ldmVudGllL2V2ZW50aWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL25vZGVfbW9kdWxlcy9pbWFnZXNMb2FkZWQvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMWNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiogSW1wbGVtZW50cyBhIHNpbWlsYXIgTGNVcmwgb2JqZWN0IGxpa2UgdGhlIHNlcnZlci1zaWRlIG9uZSwgYmFzaW5nXHJcbiAgICBpbiB0aGUgaW5mb3JtYXRpb24gYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGF0ICdodG1sJyB0YWcgaW4gdGhlIFxyXG4gICAgJ2RhdGEtYmFzZS11cmwnIGF0dHJpYnV0ZSAodGhhdHMgdmFsdWUgaXMgdGhlIGVxdWl2YWxlbnQgZm9yIEFwcFBhdGgpLFxyXG4gICAgYW5kIHRoZSBsYW5nIGluZm9ybWF0aW9uIGF0ICdkYXRhLWN1bHR1cmUnLlxyXG4gICAgVGhlIHJlc3Qgb2YgVVJMcyBhcmUgYnVpbHQgZm9sbG93aW5nIHRoZSB3aW5kb3cubG9jYXRpb24gYW5kIHNhbWUgcnVsZXNcclxuICAgIHRoYW4gaW4gdGhlIHNlcnZlci1zaWRlIG9iamVjdC5cclxuKiovXHJcblxyXG52YXIgYmFzZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYmFzZS11cmwnKSxcclxuICAgIGxhbmcgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKSxcclxuICAgIGwgPSB3aW5kb3cubG9jYXRpb24sXHJcbiAgICB1cmwgPSBsLnByb3RvY29sICsgJy8vJyArIGwuaG9zdDtcclxuLy8gbG9jYXRpb24uaG9zdCBpbmNsdWRlcyBwb3J0LCBpZiBpcyBub3QgdGhlIGRlZmF1bHQsIHZzIGxvY2F0aW9uLmhvc3RuYW1lXHJcblxyXG5iYXNlID0gYmFzZSB8fCAnLyc7XHJcblxyXG52YXIgTGNVcmwgPSB7XHJcbiAgICBTaXRlVXJsOiB1cmwsXHJcbiAgICBBcHBQYXRoOiBiYXNlLFxyXG4gICAgQXBwVXJsOiB1cmwgKyBiYXNlLFxyXG4gICAgTGFuZ0lkOiBsYW5nLFxyXG4gICAgTGFuZ1BhdGg6IGJhc2UgKyBsYW5nICsgJy8nLFxyXG4gICAgTGFuZ1VybDogdXJsICsgYmFzZSArIGxhbmdcclxufTtcclxuTGNVcmwuTGFuZ1VybCA9IHVybCArIExjVXJsLkxhbmdQYXRoO1xyXG5MY1VybC5Kc29uUGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ0pTT04vJztcclxuTGNVcmwuSnNvblVybCA9IHVybCArIExjVXJsLkpzb25QYXRoO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1VybDsiLCIvKiogUHJvdmlkZXJQb3NpdGlvbiBjbGFzc1xyXG4gIEl0IHByb3ZpZGVzIG1pbmltdW4gbGlrZS1qcXVlcnkgZXZlbnQgbGlzdGVuZXJzXHJcbiAgd2l0aCBtZXRob2RzICdvbicgYW5kICdvZmYnLCBhbmQgaW50ZXJuYWxseSAndGhpcy5ldmVudHMnXHJcbiAgYmVpbmcgYSBqUXVlcnkuQ2FsbGJhY2tzLlxyXG4qKi9cclxudmFyIFxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKSxcclxuICBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnTEMvYWpheENhbGxiYWNrcycpO1xyXG5cclxuLyoqIENvbnN0cnVjdG9yXHJcbioqL1xyXG52YXIgUHJvdmlkZXJQb3NpdGlvbiA9IGZ1bmN0aW9uIChwb3NpdGlvbklkKSB7XHJcbiAgdGhpcy5wb3NpdGlvbklkID0gcG9zaXRpb25JZDtcclxuXHJcbiAgLy8gRXZlbnRzIHN1cHBvcnQgdGhyb3VnaCBqcXVlcnkuQ2FsbGJhY2tcclxuICB0aGlzLmV2ZW50cyA9ICQuQ2FsbGJhY2tzKCk7XHJcbiAgdGhpcy5vbiA9IGZ1bmN0aW9uICgpIHsgdGhpcy5ldmVudHMuYWRkLmFwcGx5KHRoaXMuZXZlbnRzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTsgcmV0dXJuIHRoaXM7IH07XHJcbiAgdGhpcy5vZmYgPSBmdW5jdGlvbiAoKSB7IHRoaXMuZXZlbnRzLnJlbW92ZS5hcHBseSh0aGlzLmV2ZW50cywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7IHJldHVybiB0aGlzOyB9O1xyXG59O1xyXG5cclxuLy8gVXNpbmcgZGVmYXVsdCBjb25maWd1cmF0aW9uIGFzIHByb3RvdHlwZVxyXG5Qcm92aWRlclBvc2l0aW9uLnByb3RvdHlwZSA9IHtcclxuICBkZWNsaW5lZE1lc3NhZ2VDbGFzczogJ2luZm8nLFxyXG4gIGRlY2xpbmVkUG9wdXBDbGFzczogJ3Bvc2l0aW9uLXN0YXRlLWNoYW5nZScsXHJcbiAgc3RhdGVDaGFuZ2VkRXZlbnQ6ICdzdGF0ZS1jaGFuZ2VkJyxcclxuICBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50OiAnc3RhdGUtY2hhbmdlZC1kZWNsaW5lZCcsXHJcbiAgcmVtb3ZlRm9ybVNlbGVjdG9yOiAnLmRlbGV0ZS1tZXNzYWdlLWNvbmZpcm0nLFxyXG4gIHJlbW92ZUZvcm1Db250YWluZXI6ICcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlJyxcclxuICByZW1vdmVNZXNzYWdlQ2xhc3M6ICd3YXJuaW5nJyxcclxuICByZW1vdmVQb3B1cENsYXNzOiAncG9zaXRpb24tc3RhdGUtY2hhbmdlJyxcclxuICByZW1vdmVkRXZlbnQ6ICdyZW1vdmVkJyxcclxuICByZW1vdmVGYWlsZWRFdmVudDogJ3JlbW92ZS1mYWlsZWQnXHJcbn07XHJcblxyXG4vKiogY2hhbmdlU3RhdGUgdG8gdGhlIG9uZSBnaXZlbiwgaXQgd2lsbCByYWlzZSBhIHN0YXRlQ2hhbmdlZEV2ZW50IG9uIHN1Y2Nlc3NcclxuICBvciBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50IG9uIGVycm9yLlxyXG4gIEBzdGF0ZTogJ29uJyBvciAnb2ZmJ1xyXG4qKi9cclxuUHJvdmlkZXJQb3NpdGlvbi5wcm90b3R5cGUuY2hhbmdlU3RhdGUgPSBmdW5jdGlvbiBjaGFuZ2VQb3NpdGlvblN0YXRlKHN0YXRlKSB7XHJcbiAgdmFyIHBhZ2UgPSBzdGF0ZSA9PSAnb24nID8gJyRSZWFjdGl2YXRlJyA6ICckRGVhY3RpdmF0ZSc7XHJcbiAgdmFyICRkID0gJCgnI21haW4nKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdmFyIGN0eCA9IHsgZm9ybTogJGQsIGJveDogJGQgfTtcclxuICAkLmFqYXgoe1xyXG4gICAgdXJsOiBMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvcG9zaXRpb24vJyArIHBhZ2UgKyAnLz9Qb3NpdGlvbklEPScgKyB0aGlzLnBvc2l0aW9uSWQsXHJcbiAgICBjb250ZXh0OiBjdHgsXHJcbiAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgICAkZC5vbmUoJ2FqYXhTdWNjZXNzUG9zdCcsIGZ1bmN0aW9uIChldmVudCwgZGF0YSwgdCwgaiwgY3R4KSB7XHJcbiAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDEwMSkge1xyXG4gICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHN0YXRlKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICQoJzxkaXYvPicpLmFkZENsYXNzKHRoYXQuZGVjbGluZWRNZXNzYWdlQ2xhc3MpLmFwcGVuZChkYXRhLlJlc3VsdC5NZXNzYWdlKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihtc2csICRkLCB0aGF0LmRlY2xpbmVkUG9wdXBDbGFzcywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiBmYWxzZSwgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBQcm9jZXNzIHRoZSByZXN1bHQsIHRoYXQgZXZlbnR1YWxseSB3aWxsIGNhbGwgYWpheFN1Y2Nlc3NQb3N0XHJcbiAgICAgIGFqYXhDYWxsYmFja3MuZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBEZWxldGUgcG9zaXRpb25cclxuKiovXHJcblByb3ZpZGVyUG9zaXRpb24ucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIGRlbGV0ZVBvc2l0aW9uKCkge1xyXG5cclxuICAgIHZhciBjID0gJCh0aGlzLnJlbW92ZUZvcm1Db250YWluZXIpLFxyXG4gICAgICAgIGYgPSBjLmZpbmQodGhpcy5yZW1vdmVGb3JtU2VsZWN0b3IpLmZpcnN0KCksXHJcbiAgICAgICAgcG9wdXBGb3JtID0gZi5jbG9uZSgpLFxyXG4gICAgICAgIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgIHBvcHVwRm9ybS5vbmUoJ2FqYXhTdWNjZXNzUG9zdCcsICcuYWpheC1ib3gnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbm90aWZ5KCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGRhdGEuQ29kZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAxMDE6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5ldmVudHMuZmlyZSh0aGF0LnJlbW92ZWRFdmVudCwgW2RhdGEuUmVzdWx0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDEwMzpcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHRoYXQucmVtb3ZlRmFpbGVkRXZlbnQsIFtkYXRhLlJlc3VsdF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhLlJlc3VsdCAmJiBkYXRhLlJlc3VsdC5NZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gJCgnPGRpdi8+JykuYWRkQ2xhc3ModGhhdC5yZW1vdmVNZXNzYWdlQ2xhc3MpLmFwcGVuZChkYXRhLlJlc3VsdC5NZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIHZhciBib3ggPSBzbW9vdGhCb3hCbG9jay5vcGVuKG1zZywgYywgdGhhdC5yZW1vdmVQb3B1cENsYXNzLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IGZhbHNlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJveC5vbigneGhpZGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm90aWZ5KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vdGlmeSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE9wZW4gY29uZmlybWF0aW9uIGZvcm1cclxuICAgIHZhciBiID0gc21vb3RoQm94QmxvY2sub3Blbihwb3B1cEZvcm0sIGMsIG51bGwsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyUG9zaXRpb247IiwiLyogRm9jdXMgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlIGRvY3VtZW50IChvciBpbiBAY29udGFpbmVyKVxyXG53aXRoIHRoZSBodG1sNSBhdHRyaWJ1dGUgJ2F1dG9mb2N1cycgKG9yIGFsdGVybmF0aXZlIEBjc3NTZWxlY3RvcikuXHJcbkl0J3MgZmluZSBhcyBhIHBvbHlmaWxsIGFuZCBmb3IgYWpheCBsb2FkZWQgY29udGVudCB0aGF0IHdpbGwgbm90XHJcbmdldCB0aGUgYnJvd3NlciBzdXBwb3J0IG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBhdXRvRm9jdXMoY29udGFpbmVyLCBjc3NTZWxlY3Rvcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgZG9jdW1lbnQpO1xyXG4gICAgY29udGFpbmVyLmZpbmQoY3NzU2VsZWN0b3IgfHwgJ1thdXRvZm9jdXNdJykuZm9jdXMoKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhdXRvRm9jdXM7IiwiLyoqIEV4dGVuZGVkIHRvZ2dsZS1zaG93LWhpZGUgZnVudGlvbnMuXHJcbiAgICBJYWdvU1JMQGdtYWlsLmNvbVxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICoqL1xyXG4oZnVuY3Rpb24oKXtcclxuXHJcbiAgICAvKiogSW1wbGVtZW50YXRpb246IHJlcXVpcmUgalF1ZXJ5IGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIHRoZVxyXG4gICAgICAgIHB1YmxpYyBtZXRob2RzLlxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24geHRzaChqUXVlcnkpIHtcclxuICAgICAgICB2YXIgJCA9IGpRdWVyeTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGlkZSBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnaGlkZScgYW5kICdmYWRlT3V0JyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5mYWRlT3V0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5zbGlkZVVwKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnaGlkZSdcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAkZS5oaWRlKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hoaWRlJywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICogU2hvdyBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnc2hvdycgYW5kICdmYWRlSW4nIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm1zIGEgZml4IG9uIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzXHJcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGVycm9yIHRoYXQgcHJldmVudHMgZnJvbSBydW5uaW5nXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdHMgb24gZWxlbWVudHMgdGhhdCBhcmUgYWxyZWFkeSB2aXNpYmxlLFxyXG4gICAgICAgICAgICAvLyB3aGF0IGxldHMgdGhlIHBvc3NpYmlsaXR5IG9mIGdldCBhIG1pZGRsZS1hbmltYXRlZFxyXG4gICAgICAgICAgICAvLyBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFdlIGp1c3QgY2hhbmdlIGRpc3BsYXk6bm9uZSwgZm9yY2luZyB0byAnaXMtdmlzaWJsZScgdG9cclxuICAgICAgICAgICAgLy8gYmUgZmFsc2UgYW5kIHRoZW4gcnVubmluZyB0aGUgZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBmbGlja2VyaW5nIGVmZmVjdCwgYmVjYXVzZSBqUXVlcnkganVzdCByZXNldHNcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBvbiBlZmZlY3Qgc3RhcnQuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuZmFkZUluKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ3Nob3cnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hzaG93JywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZW5lcmljIHV0aWxpdHkgZm9yIGhpZ2hseSBjb25maWd1cmFibGUgalF1ZXJ5LnRvZ2dsZSB3aXRoIHN1cHBvcnRcclxuICAgICAgICAgICAgdG8gc3BlY2lmeSB0aGUgdG9nZ2xlIHZhbHVlIGV4cGxpY2l0eSBmb3IgYW55IGtpbmQgb2YgZWZmZWN0OiBqdXN0IHBhc3MgdHJ1ZSBhcyBzZWNvbmQgcGFyYW1ldGVyICd0b2dnbGUnIHRvIHNob3dcclxuICAgICAgICAgICAgYW5kIGZhbHNlIHRvIGhpZGUuIFRvZ2dsZSBtdXN0IGJlIHN0cmljdGx5IGEgQm9vbGVhbiB2YWx1ZSB0byBhdm9pZCBhdXRvLWRldGVjdGlvbi5cclxuICAgICAgICAgICAgVG9nZ2xlIHBhcmFtZXRlciBjYW4gYmUgb21pdHRlZCB0byBhdXRvLWRldGVjdCBpdCwgYW5kIHNlY29uZCBwYXJhbWV0ZXIgY2FuIGJlIHRoZSBhbmltYXRpb24gb3B0aW9ucy5cclxuICAgICAgICAgICAgQWxsIHRoZSBvdGhlcnMgYmVoYXZlIGV4YWN0bHkgYXMgaGlkZUVsZW1lbnQgYW5kIHNob3dFbGVtZW50LlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUVsZW1lbnQoZWxlbWVudCwgdG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBub3QgYSBib29sZWFuXHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUgIT09IHRydWUgJiYgdG9nZ2xlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIGFuIG9iamVjdCwgdGhlbiBpcyB0aGUgb3B0aW9ucyBhcyBzZWNvbmQgcGFyYW1ldGVyXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRvZ2dsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRvZ2dsZTtcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tZGV0ZWN0IHRvZ2dsZSwgaXQgY2FuIHZhcnkgb24gYW55IGVsZW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGRldGVjdGlvbiBhbmQgYWN0aW9uIG11c3QgYmUgZG9uZSBwZXIgZWxlbWVudDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV1c2luZyBmdW5jdGlvbiwgd2l0aCBleHBsaWNpdCB0b2dnbGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsICEkKHRoaXMpLmlzKCc6dmlzaWJsZScpLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUpXHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBEbyBqUXVlcnkgaW50ZWdyYXRpb24gYXMgeHRvZ2dsZSwgeHNob3csIHhoaWRlXHJcbiAgICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsdWdJbihqUXVlcnkpIHtcclxuICAgICAgICAgICAgLyoqIHRvZ2dsZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4dG9nZ2xlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnh0b2dnbGUgPSBmdW5jdGlvbiB4dG9nZ2xlKHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCB0b2dnbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogc2hvd0VsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhzaG93ID0gZnVuY3Rpb24geHNob3cob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBoaWRlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhoaWRlID0gZnVuY3Rpb24geGhpZGUob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9ydGluZzpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0b2dnbGVFbGVtZW50OiB0b2dnbGVFbGVtZW50LFxyXG4gICAgICAgICAgICBzaG93RWxlbWVudDogc2hvd0VsZW1lbnQsXHJcbiAgICAgICAgICAgIGhpZGVFbGVtZW50OiBoaWRlRWxlbWVudCxcclxuICAgICAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vZHVsZVxyXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIHh0c2gpO1xyXG4gICAgfSBlbHNlIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICAgICAgdmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0geHRzaChqUXVlcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBOb3JtYWwgc2NyaXB0IGxvYWQsIGlmIGpRdWVyeSBpcyBnbG9iYWwgKGF0IHdpbmRvdyksIGl0cyBleHRlbmRlZCBhdXRvbWF0aWNhbGx5ICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5qUXVlcnkgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICB4dHNoKHdpbmRvdy5qUXVlcnkpLnBsdWdJbih3aW5kb3cualF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLyogU29tZSB1dGlsaXRpZXMgZm9yIHVzZSB3aXRoIGpRdWVyeSBvciBpdHMgZXhwcmVzc2lvbnNcclxuICAgIHRoYXQgYXJlIG5vdCBwbHVnaW5zLlxyXG4qL1xyXG5mdW5jdGlvbiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWyAjOyYsLisqflxcJzpcIiFeJFtcXF0oKT0+fFxcL10pL2csICdcXFxcJDEnKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTogZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZVxyXG4gICAgfTtcclxuIiwiZnVuY3Rpb24gbW92ZUZvY3VzVG8oZWwsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWFyZ2luVG9wOiAzMCxcclxuICAgICAgICBkdXJhdGlvbjogNTAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChlbCkub2Zmc2V0KCkudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3AgfSwgb3B0aW9ucy5kdXJhdGlvbiwgbnVsbCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb3ZlRm9jdXNUbztcclxufSIsIi8qKiBDdXN0b20gTG9jb25vbWljcyAnbGlrZSBibG9ja1VJJyBwb3B1cHNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUsXHJcbiAgICBhdXRvRm9jdXMgPSByZXF1aXJlKCcuL2F1dG9Gb2N1cycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcblxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9jayhjb250ZW50Qm94LCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykge1xyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcclxuICAgICAgICBjZW50ZXI6IGZhbHNlLFxyXG4gICAgICAgIC8qIGFzIGEgdmFsaWQgb3B0aW9ucyBwYXJhbWV0ZXIgZm9yIExDLmhpZGVFbGVtZW50IGZ1bmN0aW9uICovXHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiA2MDAsXHJcbiAgICAgICAgICAgIGVmZmVjdDogJ2ZhZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgYXV0b2ZvY3VzT3B0aW9uczogeyBtYXJnaW5Ub3A6IDYwIH0sXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgY29udGVudEJveCA9ICQoY29udGVudEJveCk7XHJcbiAgICB2YXIgZnVsbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJsb2NrZWQgPT0gZG9jdW1lbnQgfHwgYmxvY2tlZCA9PSB3aW5kb3cpIHtcclxuICAgICAgICBibG9ja2VkID0gJCgnYm9keScpO1xyXG4gICAgICAgIGZ1bGwgPSB0cnVlO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgYmxvY2tlZCA9ICQoYmxvY2tlZCk7XHJcblxyXG4gICAgdmFyIGJveEluc2lkZUJsb2NrZWQgPSAhYmxvY2tlZC5pcygnYm9keSx0cix0aGVhZCx0Ym9keSx0Zm9vdCx0YWJsZSx1bCxvbCxkbCcpO1xyXG5cclxuICAgIC8vIEdldHRpbmcgYm94IGVsZW1lbnQgaWYgZXhpc3RzIGFuZCByZWZlcmVuY2luZ1xyXG4gICAgdmFyIGJJRCA9IGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcpO1xyXG4gICAgaWYgKCFiSUQpXHJcbiAgICAgICAgYklEID0gKGNvbnRlbnRCb3guYXR0cignaWQnKSB8fCAnJykgKyAoYmxvY2tlZC5hdHRyKCdpZCcpIHx8ICcnKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgaWYgKGJJRCA9PSAnLXNtb290aEJveEJsb2NrJykge1xyXG4gICAgICAgIGJJRCA9ICdpZC0nICsgZ3VpZEdlbmVyYXRvcigpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICB9XHJcbiAgICBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnLCBiSUQpO1xyXG4gICAgdmFyIGJveCA9ICQoJyMnICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShiSUQpKTtcclxuICAgIFxyXG4gICAgLy8gSGlkaW5nL2Nsb3NpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgIGJveC54aGlkZShvcHRpb25zLmNsb3NlT3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIFJlc3RvcmluZyB0aGUgQ1NTIHBvc2l0aW9uIGF0dHJpYnV0ZSBvZiB0aGUgYmxvY2tlZCBlbGVtZW50XHJcbiAgICAgICAgLy8gdG8gYXZvaWQgc29tZSBwcm9ibGVtcyB3aXRoIGxheW91dCBvbiBzb21lIGVkZ2UgY2FzZXMgYWxtb3N0XHJcbiAgICAgICAgLy8gdGhhdCBtYXkgYmUgbm90IGEgcHJvYmxlbSBkdXJpbmcgYmxvY2tpbmcgYnV0IHdoZW4gdW5ibG9ja2VkLlxyXG4gICAgICAgIHZhciBwcmV2ID0gYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJyk7XHJcbiAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgcHJldiB8fCAnJyk7XHJcbiAgICAgICAgYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJywgbnVsbCk7XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICBib3hjXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBudWxsLCBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcsIHRydWUpO1xyXG4gICAgYm94Yy5hcHBlbmQoY29udGVudEJveCk7XHJcbiAgICBib3hjLndpZHRoKG9wdGlvbnMud2lkdGgpO1xyXG4gICAgYm94LmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gaW5zaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQ6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIGJsb2NrZWQuY3NzKCd6LWluZGV4JykgKyAxMCk7XHJcbiAgICAgICAgaWYgKCFibG9ja2VkLmNzcygncG9zaXRpb24nKSB8fCBibG9ja2VkLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJykge1xyXG4gICAgICAgICAgICBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nLCBibG9ja2VkLmNzcygncG9zaXRpb24nKSk7XHJcbiAgICAgICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmNlbnRlciA9PT0gdHJ1ZSB8fCBvcHRpb25zLmNlbnRlciA9PT0gJ3ZlcnRpY2FsJylcclxuICAgICAgICAgICAgYm94Yy5jc3MoJ3RvcCcsIGN0IC0gYm94Yy5vdXRlckhlaWdodCh0cnVlKSAvIDIpO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmNlbnRlciA9PT0gdHJ1ZSB8fCBvcHRpb25zLmNlbnRlciA9PT0gJ2hvcml6b250YWwnKVxyXG4gICAgICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07IiwiLyoqXHJcbiAgSXQgdG9nZ2xlcyBhIGdpdmVuIHZhbHVlIHdpdGggdGhlIG5leHQgaW4gdGhlIGdpdmVuIGxpc3QsXHJcbiAgb3IgdGhlIGZpcnN0IGlmIGlzIHRoZSBsYXN0IG9yIG5vdCBtYXRjaGVkLlxyXG4gIFRoZSByZXR1cm5lZCBmdW5jdGlvbiBjYW4gYmUgdXNlZCBkaXJlY3RseSBvciBcclxuICBjYW4gYmUgYXR0YWNoZWQgdG8gYW4gYXJyYXkgKG9yIGFycmF5IGxpa2UpIG9iamVjdCBhcyBtZXRob2RcclxuICAob3IgdG8gYSBwcm90b3R5cGUgYXMgQXJyYXkucHJvdG90eXBlKSBhbmQgdXNlIGl0IHBhc3NpbmdcclxuICBvbmx5IHRoZSBmaXJzdCBhcmd1bWVudC5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9nZ2xlKGN1cnJlbnQsIGVsZW1lbnRzKSB7XHJcbiAgaWYgKHR5cGVvZiAoZWxlbWVudHMpID09PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICB0eXBlb2YgKHRoaXMubGVuZ3RoKSA9PT0gJ251bWJlcicpXHJcbiAgICBlbGVtZW50cyA9IHRoaXM7XHJcblxyXG4gIHZhciBpID0gZWxlbWVudHMuaW5kZXhPZihjdXJyZW50KTtcclxuICBpZiAoaSA+IC0xICYmIGkgPCBlbGVtZW50cy5sZW5ndGggLSAxKVxyXG4gICAgcmV0dXJuIGVsZW1lbnRzW2kgKyAxXTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZWxlbWVudHNbMF07XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgVXNlciBwcml2YXRlIGRhc2hib2FyZCBzZWN0aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG52YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnTEMvYWpheEZvcm1zJyk7XHJcblxyXG4vLyBDb2RlIG9uIHBhZ2UgcmVhZHlcclxuJChmdW5jdGlvbiAoKSB7XHJcbiAgICAvKiBTaWRlYmFyICovXHJcbiAgICB2YXIgXHJcbiAgICB0b2dnbGUgPSByZXF1aXJlKCcuLi9MQy90b2dnbGUnKSxcclxuICAgIFByb3ZpZGVyUG9zaXRpb24gPSByZXF1aXJlKCcuLi9MQy9Qcm92aWRlclBvc2l0aW9uJyk7XHJcbiAgICAvLyBBdHRhY2hpbmcgJ2NoYW5nZSBwb3NpdGlvbicgYWN0aW9uIHRvIHRoZSBzaWRlYmFyIGxpbmtzXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnW2hyZWYgPSBcIiN0b2dnbGVQb3NpdGlvblN0YXRlXCJdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBcclxuICAgICAgJHQgPSAkKHRoaXMpLFxyXG4gICAgICB2ID0gJHQudGV4dCgpLFxyXG4gICAgICBuID0gdG9nZ2xlKHYsIFsnb24nLCAnb2ZmJ10pLFxyXG4gICAgICBwb3NpdGlvbklkID0gJHQuY2xvc2VzdCgnW2RhdGEtcG9zaXRpb24taWRdJykuZGF0YSgncG9zaXRpb24taWQnKTtcclxuXHJcbiAgICAgICAgdmFyIHBvcyA9IG5ldyBQcm92aWRlclBvc2l0aW9uKHBvc2l0aW9uSWQpO1xyXG4gICAgICAgIHBvc1xyXG4gICAgLm9uKHBvcy5zdGF0ZUNoYW5nZWRFdmVudCwgZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICAgJHQudGV4dChzdGF0ZSk7XHJcbiAgICB9KVxyXG4gICAgLmNoYW5nZVN0YXRlKG4pO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcuZGVsZXRlLXBvc2l0aW9uIGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uSWQgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLXBvc2l0aW9uLWlkXScpLmRhdGEoJ3Bvc2l0aW9uLWlkJyk7XHJcbiAgICAgICAgdmFyIHBvcyA9IG5ldyBQcm92aWRlclBvc2l0aW9uKHBvc2l0aW9uSWQpO1xyXG5cclxuICAgICAgICBwb3NcclxuICAgIC5vbihwb3MucmVtb3ZlZEV2ZW50LCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICAgICAgLy8gQ3VycmVudCBwb3NpdGlvbiBwYWdlIGRvZXNuJ3QgZXhpc3QgYW55bW9yZSwgb3V0IVxyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC95b3VyLXdvcmsvJztcclxuICAgIH0pXHJcbiAgICAucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8qIFByb21vdGUgKi9cclxuICAgIHZhciBnZW5lcmF0ZUJvb2tOb3dCdXR0b24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9nZW5lcmF0ZUJvb2tOb3dCdXR0b24nKTtcclxuICAgIC8vIExpc3RlbiBvbiBEYXNoYm9hcmRQcm9tb3RlIGluc3RlYWQgb2YgdGhlIG1vcmUgY2xvc2UgY29udGFpbmVyIERhc2hib2FyZEJvb2tOb3dCdXR0b25cclxuICAgIC8vIGFsbG93cyB0byBjb250aW51ZSB3b3JraW5nIHdpdGhvdXQgcmUtYXR0YWNobWVudCBhZnRlciBodG1sLWFqYXgtcmVsb2FkcyBmcm9tIGFqYXhGb3JtLlxyXG4gICAgZ2VuZXJhdGVCb29rTm93QnV0dG9uLm9uKCcuRGFzaGJvYXJkUHJvbW90ZScpOyAvLycuRGFzaGJvYXJkQm9va05vd0J1dHRvbidcclxuXHJcbiAgICAvKiBQcml2YWN5ICovXHJcbiAgICB2YXIgcHJpdmFjeVNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpdmFjeVNldHRpbmdzJyk7XHJcbiAgICBwcml2YWN5U2V0dGluZ3Mub24oJy5EYXNoYm9hcmRQcml2YWN5Jyk7XHJcblxyXG4gICAgLyogUGF5bWVudHMgKi9cclxuICAgIHZhciBwYXltZW50QWNjb3VudCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL3BheW1lbnRBY2NvdW50Jyk7XHJcbiAgICBwYXltZW50QWNjb3VudC5vbignLkRhc2hib2FyZFBheW1lbnRzJyk7XHJcblxyXG4gICAgLyogYWJvdXQteW91ICovXHJcbiAgICAkKCdodG1sJykub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJy5EYXNoYm9hcmRBYm91dFlvdSBmb3JtLmFqYXgnLCBpbml0QWJvdXRZb3UpO1xyXG4gICAgaW5pdEFib3V0WW91KCk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIGluaXQgKi9cclxuICAgICQoJ2h0bWwnKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnLkRhc2hib2FyZFlvdXJXb3JrIGZvcm0uYWpheCcsIGluaXRZb3VyV29ya0RvbSk7XHJcbiAgICBpbml0WW91cldvcmtEb20oKTtcclxuXHJcbiAgICAvKiBBdmFpbGFiaWx0eSAqL1xyXG4gICAgaW5pdEF2YWlsYWJpbGl0eSgpO1xyXG4gICAgJCgnLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIGluaXRBdmFpbGFiaWxpdHkpO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gICAgSW5zdGFudCBzYXZpbmcgYW5kIGNvcnJlY3QgY2hhbmdlcyB0cmFja2luZ1xyXG4qKi9cclxuZnVuY3Rpb24gc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oc2VjdGlvblNlbGVjdG9yKSB7XHJcblxyXG4gICAgdmFyICRzZWN0aW9uID0gJChzZWN0aW9uU2VsZWN0b3IpO1xyXG5cclxuICAgIGlmICgkc2VjdGlvbi5kYXRhKCdpbnN0YW50LXNhdmluZycpKSB7XHJcbiAgICAgICAgJHNlY3Rpb24ub24oJ2NoYW5nZScsICc6aW5wdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGFqYXhGb3Jtcy5kb0luc3RhbnRTYXZpbmcoJHNlY3Rpb24sIFt0aGlzXSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRBYm91dFlvdSgpIHtcclxuICAgIC8qIFByb2ZpbGUgcGhvdG8gKi9cclxuICAgIHZhciBjaGFuZ2VQcm9maWxlUGhvdG8gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9jaGFuZ2VQcm9maWxlUGhvdG8nKTtcclxuICAgIGNoYW5nZVByb2ZpbGVQaG90by5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gICAgLyogQWJvdXQgeW91IC8gZWR1Y2F0aW9uICovXHJcbiAgICB2YXIgZWR1Y2F0aW9uID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvZWR1Y2F0aW9uQ3J1ZGwnKTtcclxuICAgIGVkdWNhdGlvbi5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gICAgLyogQWJvdXQgeW91IC8gdmVyaWZpY2F0aW9ucyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0FjdGlvbnMnKS5vbignLkRhc2hib2FyZFZlcmlmaWNhdGlvbnMnKTtcclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNDcnVkbCcpLm9uKCcuRGFzaGJvYXJkQWJvdXRZb3UnKTtcclxuXHJcbiAgICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gICAgc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRQdWJsaWNCaW8nKTtcclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkUGVyc29uYWxXZWJzaXRlJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRBdmFpbGFiaWxpdHkoZSkge1xyXG4gIC8vIFdlIG5lZWQgdG8gYXZvaWQgdGhpcyBsb2dpYyB3aGVuIGFuIGV2ZW50IGJ1YmJsZVxyXG4gIC8vIGZyb20gdGhlIGFueSBmaWVsZHNldC5hamF4LCBiZWNhdXNlIGl0cyBhIHN1YmZvcm0gZXZlbnRcclxuICAvLyBhbmQgbXVzdCBub3QgcmVzZXQgdGhlIG1haW4gZm9ybSAoIzUwNClcclxuICBpZiAoZSAmJiBlLnRhcmdldCAmJiAvZmllbGRzZXQvaS50ZXN0KGUudGFyZ2V0Lm5vZGVOYW1lKSlcclxuICAgIHJldHVybjtcclxuXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbW9udGhseVNjaGVkdWxlJykub24oKTtcclxuICB2YXIgd2Vla2x5ID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvd2Vla2x5U2NoZWR1bGUnKS5vbigpO1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2NhbGVuZGFyU3luYycpLm9uKCk7XHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvYXBwb2ludG1lbnRzQ3J1ZGwnKS5vbignLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpO1xyXG5cclxuICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkV2Vla2x5U2NoZWR1bGUnKTtcclxuICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZE1vbnRobHlTY2hlZHVsZScpO1xyXG4gIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gIEluaXRpYWxpemUgRG9tIGVsZW1lbnRzIGFuZCBldmVudHMgaGFuZGxlcnMgZm9yIFlvdXItd29yayBsb2dpYy5cclxuXHJcbiAgTk9URTogLkRhc2hib2FyZFlvdXJXb3JrIGlzIGFuIGFqYXgtYm94IHBhcmVudCBvZiB0aGUgZm9ybS5hamF4LCBldmVyeSBzZWN0aW9uXHJcbiAgaXMgaW5zaWRlIHRoZSBmb3JtIGFuZCByZXBsYWNlZCBvbiBodG1sIHJldHVybmVkIGZyb20gc2VydmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gaW5pdFlvdXJXb3JrRG9tKCkge1xyXG4gICAgLyogWW91ciB3b3JrIC8gcHJpY2luZyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpY2luZ0NydWRsJykub24oKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBzZXJ2aWNlcyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvc2VydmljZUF0dHJpYnV0ZXNWYWxpZGF0aW9uJykuc2V0dXAoJCgnLkRhc2hib2FyZFlvdXJXb3JrIGZvcm0nKSk7XHJcbiAgICAvLyBJbnN0YW50IHNhdmluZyBhbmQgY29ycmVjdCBjaGFuZ2VzIHRyYWNraW5nXHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZFNlcnZpY2VzJyk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gY2FuY2VsbGF0aW9uICovXHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZENhbmNlbGxhdGlvblBvbGljeScpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHNjaGVkdWxpbmcgKi9cclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkU2NoZWR1bGluZ09wdGlvbnMnKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBsb2NhdGlvbnMgKi9cclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2xvY2F0aW9uc0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIGxpY2Vuc2VzICovXHJcbiAgICByZXF1aXJlKCcuL2Rhc2hib2FyZC9saWNlbnNlc0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHBob3RvcyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUknKS5vbignLkRhc2hib2FyZFBob3RvcycpO1xyXG4gICAgLy8gUGhvdG9zVUkgaXMgc3BlY2lhbCBhbmQgY2Fubm90IGRvIGluc3RhbnQtc2F2aW5nIG9uIGZvcm0gY2hhbmdlc1xyXG4gICAgLy8gYmVjYXVzZSBvZiB0aGUgcmUtdXNlIG9mIHRoZSBlZGl0aW5nIGZvcm1cclxuICAgIC8vc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRQaG90b3MnKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyByZXZpZXdzICovXHJcbiAgICAkKCcuRGFzaGJvYXJkWW91cldvcmsnKS5vbignYWpheFN1Y2Nlc3NQb3N0JywgJ2Zvcm0nLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcclxuICAgICAgICAvLyBSZXNldGluZyB0aGUgZW1haWwgYWRkcmVzc2VzIG9uIHN1Y2Nlc3MgdG8gYXZvaWQgcmVzZW5kIGFnYWluIG1lc3NhZ2VzIGJlY2F1c2VcclxuICAgICAgICAvLyBtaXN0YWtlIG9mIGEgc2Vjb25kIHN1Ym1pdC5cclxuICAgICAgICB2YXIgdGIgPSAkKCcuRGFzaGJvYXJkUmV2aWV3cyBbbmFtZT1jbGllbnRzZW1haWxzXScpO1xyXG4gICAgICAgIC8vIE9ubHkgaWYgdGhlcmUgd2FzIGEgdmFsdWU6XHJcbiAgICAgICAgaWYgKHRiLnZhbCgpKSB7XHJcbiAgICAgICAgICAgIHRiXHJcbiAgICAgIC52YWwoJycpXHJcbiAgICAgIC5hdHRyKCdwbGFjZWhvbGRlcicsIHRiLmRhdGEoJ3N1Y2Nlc3MtbWVzc2FnZScpKVxyXG4gICAgICAgICAgICAvLyBzdXBwb3J0IGZvciBJRSwgJ25vbi1wbGFjZWhvbGRlci1icm93c2VycydcclxuICAgICAgLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gYWRkLXBvc2l0aW9uICovXHJcbiAgICB2YXIgYWRkUG9zaXRpb24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9hZGRQb3NpdGlvbicpO1xyXG4gICAgYWRkUG9zaXRpb24uaW5pdCgnLkRhc2hib2FyZEFkZFBvc2l0aW9uJyk7XHJcbiAgICAkKCdib2R5Jykub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJy5EYXNoYm9hcmRBZGRQb3NpdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBhZGRQb3NpdGlvbi5pbml0KCk7XHJcbiAgICB9KTtcclxufSIsIi8qKlxyXG4qIEFkZCBQb3NpdGlvbjogbG9naWMgZm9yIHRoZSBhZGQtcG9zaXRpb24gcGFnZSB1bmRlciAvZGFzaGJvYXJkL3lvdXItd29yay8wLyxcclxuICB3aXRoIGF1dG9jb21wbGV0ZSwgcG9zaXRpb24gZGVzY3JpcHRpb24gYW5kICdhZGRlZCBwb3NpdGlvbnMnIGxpc3QuXHJcblxyXG4gIFRPRE86IENoZWNrIGlmIGlzIG1vcmUgY29udmVuaWVudCBhIHJlZmFjdG9yIGFzIHBhcnQgb2YgTEMvUHJvdmlkZXJQb3NpdGlvbi5qc1xyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc2VsZWN0b3JzID0ge1xyXG4gIGxpc3Q6ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24tcG9zaXRpb25zTGlzdCcsXHJcbiAgc2VsZWN0UG9zaXRpb246ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24tc2VsZWN0UG9zaXRpb24nLFxyXG4gIGRlc2M6ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24tc2VsZWN0UG9zaXRpb24tZGVzY3JpcHRpb24nXHJcbn07XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0QWRkUG9zaXRpb24oc2VsZWN0b3IpIHtcclxuICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24nO1xyXG4gIHZhciBjID0gJChzZWxlY3Rvcik7XHJcblxyXG4gIC8vIFRlbXBsYXRlIHBvc2l0aW9uIGl0ZW0gdmFsdWUgbXVzdCBiZSByZXNldCBvbiBpbml0IChiZWNhdXNlIHNvbWUgZm9ybS1yZWNvdmVyaW5nIGJyb3dzZXIgZmVhdHVyZXMgdGhhdCBwdXQgb24gaXQgYmFkIHZhbHVlcylcclxuICBjLmZpbmQoc2VsZWN0b3JzLmxpc3QgKyAnIGxpLmlzLXRlbXBsYXRlIFtuYW1lPXBvc2l0aW9uXScpLnZhbCgnJyk7XHJcblxyXG4gIC8vIEF1dG9jb21wbGV0ZSBwb3NpdGlvbnMgYW5kIGFkZCB0byB0aGUgbGlzdFxyXG4gIHZhciBwb3NpdGlvbnNMaXN0ID0gbnVsbCwgdHBsID0gbnVsbDtcclxuICB2YXIgcG9zaXRpb25zQXV0b2NvbXBsZXRlID0gYy5maW5kKCcuRGFzaGJvYXJkQWRkUG9zaXRpb24tc2VsZWN0UG9zaXRpb24tc2VhcmNoJykuYXV0b2NvbXBsZXRlKHtcclxuICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgIG1pbkxlbmd0aDogMCxcclxuICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG5cclxuICAgICAgcG9zaXRpb25zTGlzdCA9IHBvc2l0aW9uc0xpc3QgfHwgYy5maW5kKHNlbGVjdG9ycy5saXN0ICsgJyA+IHVsJyk7XHJcbiAgICAgIHRwbCA9IHRwbCB8fCBwb3NpdGlvbnNMaXN0LmNoaWxkcmVuKCcuaXMtdGVtcGxhdGU6ZXEoMCknKTtcclxuICAgICAgLy8gTm8gdmFsdWUsIG5vIGFjdGlvbiA6KFxyXG4gICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnZhbHVlKSByZXR1cm47XHJcblxyXG4gICAgICAvLyBBZGQgaWYgbm90IGV4aXN0cyBpbiB0aGUgbGlzdFxyXG4gICAgICBpZiAocG9zaXRpb25zTGlzdC5jaGlsZHJlbigpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICQodGhpcykuZGF0YSgncG9zaXRpb24taWQnKSA9PSB1aS5pdGVtLnZhbHVlO1xyXG4gICAgICB9KS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAvLyBDcmVhdGUgaXRlbSBmcm9tIHRlbXBsYXRlOlxyXG4gICAgICAgIHBvc2l0aW9uc0xpc3QuYXBwZW5kKHRwbC5jbG9uZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdpcy10ZW1wbGF0ZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmRhdGEoJ3Bvc2l0aW9uLWlkJywgdWkuaXRlbS52YWx1ZSlcclxuICAgICAgICAgICAgICAgICAgICAuY2hpbGRyZW4oJy5uYW1lJykudGV4dCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpIC8vIC5sYWJlbFxyXG4gICAgICAgICAgICAgICAgICAgIC5lbmQoKS5jaGlsZHJlbignW25hbWU9cG9zaXRpb25dJykudmFsKHVpLml0ZW0udmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLmVuZCgpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgYy5maW5kKHNlbGVjdG9ycy5kZXNjICsgJyA+IHRleHRhcmVhJykudmFsKHVpLml0ZW0uZGVzY3JpcHRpb24pO1xyXG5cclxuICAgICAgLy8gV2Ugd2FudCBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGZvY3VzOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBMb2FkIGFsbCBwb3NpdGlvbnMgaW4gYmFja2dyb3VuZCB0byByZXBsYWNlIHRoZSBhdXRvY29tcGxldGUgc291cmNlIChhdm9pZGluZyBtdWx0aXBsZSwgc2xvdyBsb29rLXVwcylcclxuICAvKiQuZ2V0SlNPTihMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgZnVuY3Rpb24gKGRhdGEpIHtcclxuICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdvcHRpb24nLCAnc291cmNlJywgZGF0YSk7XHJcbiAgfVxyXG4gICk7Ki9cclxuXHJcbiAgLy8gU2hvdyBhdXRvY29tcGxldGUgb24gJ3BsdXMnIGJ1dHRvblxyXG4gIGMuZmluZChzZWxlY3RvcnMuc2VsZWN0UG9zaXRpb24gKyAnIC5hZGQtYWN0aW9uJykuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgcG9zaXRpb25zQXV0b2NvbXBsZXRlLmF1dG9jb21wbGV0ZSgnc2VhcmNoJywgJycpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICAvLyBSZW1vdmUgcG9zaXRpb25zIGZyb20gdGhlIGxpc3RcclxuICBjLmZpbmQoc2VsZWN0b3JzLmxpc3QgKyAnID4gdWwnKS5vbignY2xpY2snLCAnbGkgPiBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIGlmICgkdC5hdHRyKCdocmVmJykgPT0gJyNyZW1vdmUtcG9zaXRpb24nKSB7XHJcbiAgICAgIC8vIFJlbW92ZSBjb21wbGV0ZSBlbGVtZW50IGZyb20gdGhlIGxpc3QgKGxhYmVsIGFuZCBoaWRkZW4gZm9ybSB2YWx1ZSlcclxuICAgICAgJHQucGFyZW50KCkucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBBdmFpbGFiaWxpdHk6IGNhbGVuZGFyIGFwcG9pbnRtZW50cyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG5cclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGNydWRsU2VsZWN0b3IgPSAnLkRhc2hib2FyZEFwcG9pbnRtZW50cycsXHJcbiAgICAkY3J1ZGxDb250YWluZXIgPSAkYy5maW5kKGNydWRsU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRjcnVkbENvbnRhaW5lci5zaWJsaW5ncygpXHJcbiAgICAgICAgLmFkZCgkY3J1ZGxDb250YWluZXIuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAgIC5hZGQoJGNydWRsQ29udGFpbmVyLmNsb3Nlc3QoJy5EYXNoYm9hcmRBdmFpbGFiaWxpdHknKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGNydWRsU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCBlZGl0b3IpIHtcclxuICAgIC8vIERvbmUgYWZ0ZXIgYSBzbWFsbCBkZWxheSB0byBsZXQgdGhlIGVkaXRvciBiZSB2aXNpYmxlXHJcbiAgICAvLyBhbmQgc2V0dXAgd29yayBhcyBleHBlY3RlZFxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGVkaXRGb3JtU2V0dXAoZWRpdG9yKTtcclxuICAgIH0sIDEwMCk7XHJcbiAgfSk7XHJcblxyXG59O1xyXG5cclxuZnVuY3Rpb24gZWRpdEZvcm1TZXR1cChmKSB7XHJcbiAgdmFyIHJlcGVhdCA9IGYuZmluZCgnW25hbWU9cmVwZWF0XScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYSA9IGYuZmluZCgnLnJlcGVhdC1vcHRpb25zJyk7XHJcbiAgICBpZiAodGhpcy5jaGVja2VkKVxyXG4gICAgICBhLnNsaWRlRG93bignZmFzdCcpO1xyXG4gICAgZWxzZVxyXG4gICAgICBhLnNsaWRlVXAoJ2Zhc3QnKTtcclxuICB9KTtcclxuICB2YXIgYWxsZGF5ID0gZi5maW5kKCdbbmFtZT1hbGxkYXldJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZlxyXG4gICAgLmZpbmQoJ1tuYW1lPXN0YXJ0dGltZV0sW25hbWU9ZW5kdGltZV0nKVxyXG4gICAgLnByb3AoJ2Rpc2FibGVkJywgdGhpcy5jaGVja2VkKTtcclxuICAgIGlmICh0aGlzLmNoZWNrZWQpXHJcbiAgICAgIGEuaGlkZSgnZmFzdCcpO1xyXG4gICAgZWxzZVxyXG4gICAgICBhLnNob3coJ2Zhc3QnKTtcclxuICB9KTtcclxuICB2YXIgcmVwZWF0RnJlcXVlbmN5ID0gZi5maW5kKCdbbmFtZT1yZXBlYXQtZnJlcXVlbmN5XScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgZnJlcSA9ICQodGhpcykuY2hpbGRyZW4oJzpzZWxlY3RlZCcpO1xyXG4gICAgdmFyIHVuaXQgPSBmcmVxLmRhdGEoJ3VuaXQnKTtcclxuICAgIGZcclxuICAgIC5maW5kKCcucmVwZWF0LWZyZXF1ZW5jeS11bml0JylcclxuICAgIC50ZXh0KHVuaXQpO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gdW5pdCwgdGhlcmUgaXMgbm90IGludGVydmFsL3JlcGVhdC1ldmVyeSBmaWVsZDpcclxuICAgIHZhciBpbnRlcnZhbCA9IGYuZmluZCgnLnJlcGVhdC1ldmVyeScpO1xyXG4gICAgaWYgKHVuaXQpXHJcbiAgICAgIGludGVydmFsLnNob3coJ2Zhc3QnKTtcclxuICAgIGVsc2VcclxuICAgICAgaW50ZXJ2YWwuaGlkZSgnZmFzdCcpO1xyXG4gICAgLy8gU2hvdyBmcmVxdWVuY3ktZXh0cmEsIGlmIHRoZXJlIGlzIHNvbWVvbmVcclxuICAgIGYuZmluZCgnLmZyZXF1ZW5jeS1leHRyYS0nICsgZnJlcS52YWwoKSkuc2xpZGVEb3duKCdmYXN0Jyk7XHJcbiAgICAvLyBIaWRlIGFsbCBvdGhlciBmcmVxdWVuY3ktZXh0cmFcclxuICAgIGYuZmluZCgnLmZyZXF1ZW5jeS1leHRyYTpub3QoLmZyZXF1ZW5jeS1leHRyYS0nICsgZnJlcS52YWwoKSArICcpJykuc2xpZGVVcCgnZmFzdCcpO1xyXG4gIH0pO1xyXG4gIC8vIGF1dG8tc2VsZWN0IHNvbWUgb3B0aW9ucyB3aGVuIGl0cyB2YWx1ZSBjaGFuZ2VcclxuICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1vY3VycmVuY2VzXScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1lbmRzXVt2YWx1ZT1vY3VycmVuY2VzXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcclxuICB9KTtcclxuICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1lbmQtZGF0ZV0nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgZi5maW5kKCdbbmFtZT1yZXBlYXQtZW5kc11bdmFsdWU9ZGF0ZV0nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgfSk7XHJcbiAgLy8gc3RhcnQtZGF0ZSB0cmlnZ2VyXHJcbiAgZi5maW5kKCdbbmFtZT1zdGFydGRhdGVdJykub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIGF1dG8gZmlsbCBlbmRkYXRlIHdpdGggc3RhcnRkYXRlIHdoZW4gdGhpcyBsYXN0IGlzIHVwZGF0ZWRcclxuICAgIGYuZmluZCgnW25hbWU9ZW5kZGF0ZV0nKS52YWwodGhpcy52YWx1ZSk7XHJcbiAgICAvLyBpZiBubyB3ZWVrLWRheXMgb3Igb25seSBvbmUsIGF1dG8tc2VsZWN0IHRoZSBkYXkgdGhhdCBtYXRjaHMgc3RhcnQtZGF0ZVxyXG4gICAgdmFyIHdlZWtEYXlzID0gZi5maW5kKCcud2Vla2x5LWV4dHJhIC53ZWVrLWRheXMgaW5wdXQnKTtcclxuICAgIGlmICh3ZWVrRGF5cy5hcmUoJzpjaGVja2VkJywgeyB1bnRpbDogMSB9KSkge1xyXG4gICAgICB2YXIgZGF0ZSA9ICQodGhpcykuZGF0ZXBpY2tlcihcImdldERhdGVcIik7XHJcbiAgICAgIGlmIChkYXRlKSB7XHJcbiAgICAgICAgd2Vla0RheXMucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgICB3ZWVrRGF5cy5maWx0ZXIoJ1t2YWx1ZT0nICsgZGF0ZS5nZXREYXkoKSArICddJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIEluaXQ6XHJcbiAgcmVwZWF0LmNoYW5nZSgpO1xyXG4gIGFsbGRheS5jaGFuZ2UoKTtcclxuICByZXBlYXRGcmVxdWVuY3kuY2hhbmdlKCk7XHJcbiAgLy8gYWRkIGRhdGUgcGlja2Vyc1xyXG4gIGFwcGx5RGF0ZVBpY2tlcigpO1xyXG4gIC8vIGFkZCBwbGFjZWhvbGRlciBzdXBwb3J0IChwb2x5ZmlsbClcclxuICBmLmZpbmQoJzppbnB1dCcpLnBsYWNlaG9sZGVyKCk7XHJcbn0iLCIvKipcclxuICBSZXF1ZXN0aW5nIGEgYmFja2dyb3VuZCBjaGVjayB0aHJvdWdoIHRoZSBiYWNrZ3JvdW5kQ2hlY2tFZGl0IGZvcm0gaW5zaWRlIGFib3V0LXlvdS92ZXJpZmljYXRpb25zLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8qKlxyXG4gIFNldHVwIHRoZSBET00gZWxlbWVudHMgaW4gdGhlIGNvbnRhaW5lciBAJGNcclxuICB3aXRoIHRoZSBiYWNrZ3JvdW5kLWNoZWNrLXJlcXVlc3QgbG9naWMuXHJcbioqL1xyXG5leHBvcnRzLnNldHVwRm9ybSA9IGZ1bmN0aW9uIHNldHVwRm9ybUJhY2tncm91bmRDaGVjaygkYykge1xyXG5cclxuICB2YXIgc2VsZWN0ZWRJdGVtID0gbnVsbDtcclxuXHJcbiAgJGMub24oJ2NsaWNrJywgJy5idXktYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIFxyXG4gICAgdmFyIGYgPSAkYy5maW5kKCcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrLXJlcXVlc3RGb3JtJyk7XHJcbiAgICB2YXIgYmNpZCA9ICQodGhpcykuZGF0YSgnYmFja2dyb3VuZC1jaGVjay1pZCcpO1xyXG4gICAgc2VsZWN0ZWRJdGVtID0gJCh0aGlzKS5jbG9zZXN0KCcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrLWl0ZW0nKTtcclxuICAgIHZhciBwczEgPSAkYy5maW5kKCcucG9wdXAuYnV5LXN0ZXAtMScpO1xyXG5cclxuICAgIGYuZmluZCgnW25hbWU9QmFja2dyb3VuZENoZWNrSURdJykudmFsKGJjaWQpO1xyXG4gICAgZi5maW5kKCcubWFpbi1hY3Rpb24nKS52YWwoJCh0aGlzKS50ZXh0KCkpO1xyXG5cclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4ocHMxLCAkYywgJ2JhY2tncm91bmQtY2hlY2snKTtcclxuICB9KTtcclxuXHJcbiAgJGMub24oJ2FqYXhTdWNjZXNzUG9zdCcsICcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrLXJlcXVlc3RGb3JtJywgZnVuY3Rpb24gKGUsIGRhdGEsIHRleHQsIGp4LCBjdHgpIHtcclxuICAgIGlmIChkYXRhLkNvZGUgPT09IDExMCkge1xyXG4gICAgICB2YXIgcHMyID0gJGMuZmluZCgnLnBvcHVwLmJ1eS1zdGVwLTInKTtcclxuICAgICAgdmFyIGJveCA9IHNtb290aEJveEJsb2NrLm9wZW4ocHMyLCAkYywgJ2JhY2tncm91bmQtY2hlY2snKTtcclxuICAgICAgLy8gUmVtb3ZlIGZyb20gdGhlIGxpc3QgdGhlIHJlcXVlc3RlZCBpdGVtXHJcbiAgICAgIHNlbGVjdGVkSXRlbS5yZW1vdmUoKTtcclxuICAgICAgLy8gRm9yY2Ugdmlld2VyIGxpc3QgcmVsb2FkXHJcbiAgICAgICRjLnRyaWdnZXIoJ3JlbG9hZExpc3QnKTtcclxuICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gbW9yZSBpdGVtcyBpbiB0aGUgbGlzdDpcclxuICAgICAgaWYgKCRjLmZpbmQoJy5EYXNoYm9hcmRCYWNrZ3JvdW5kQ2hlY2staXRlbScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIC8vIHRoZSBjbG9zZSBidXR0b24gb24gdGhlIHBvcHVwIG11c3QgY2xvc2UgdGhlIGVkaXRvciB0b286XHJcbiAgICAgICAgYm94LmZpbmQoJy5jbG9zZS1hY3Rpb24nKS5hZGRDbGFzcygnY3J1ZGwtY2FuY2VsJyk7XHJcbiAgICAgICAgLy8gVGhlIGFjdGlvbiBib3ggbXVzdCBkaXNhcHBlYXJcclxuICAgICAgICAkYy5jbG9zZXN0KCcuY3J1ZGwnKS5maW5kKCcuQmFja2dyb3VuZENoZWNrQWN0aW9uQm94JykucmVtb3ZlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuXHJcbn07IiwiLyoqIEF2YWlsYWJpbGl0eTogQ2FsZW5kYXIgU3luYyBzZWN0aW9uIHNldHVwXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gICAgY29udGFpbmVyU2VsZWN0b3IgPSBjb250YWluZXJTZWxlY3RvciB8fCAnLkRhc2hib2FyZENhbGVuZGFyU3luYyc7XHJcbiAgICB2YXIgY29udGFpbmVyID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICAgICAgZmllbGRTZWxlY3RvciA9ICcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jLXByaXZhdGVVcmxGaWVsZCcsXHJcbiAgICAgICAgYnV0dG9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZENhbGVuZGFyU3luYy1yZXNldC1hY3Rpb24nO1xyXG5cclxuICAgIC8vIFNlbGVjdGluZyBwcml2YXRlLXVybCBmaWVsZCB2YWx1ZSBvbiBmb2N1cyBhbmQgY2xpY2s6XHJcbiAgICBjb250YWluZXIuZmluZChmaWVsZFNlbGVjdG9yKS5vbignZm9jdXMgY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3QoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlc2V0aW5nIHByaXZhdGUtdXJsXHJcbiAgICBjb250YWluZXJcclxuICAub24oJ2NsaWNrJywgYnV0dG9uU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgIHZhciB0ID0gJCh0aGlzKSxcclxuICAgICAgdXJsID0gdC5hdHRyKCdocmVmJyksXHJcbiAgICAgIGZpZWxkID0gY29udGFpbmVyLmZpbmQoZmllbGRTZWxlY3Rvcik7XHJcblxyXG4gICAgICBmaWVsZC52YWwoJycpO1xyXG5cclxuICAgICAgZnVuY3Rpb24gb25lcnJvcigpIHtcclxuICAgICAgICAgIGZpZWxkLnZhbChmaWVsZC5kYXRhKCdlcnJvci1tZXNzYWdlJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAkLmdldEpTT04odXJsLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgZmllbGQudmFsKGRhdGEuUmVzdWx0KS5jaGFuZ2UoKTtcclxuICAgICAgICAgICAgICBmaWVsZFswXS5zZWxlY3QoKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgb25lcnJvcigpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9KS5mYWlsKG9uZXJyb3IpO1xyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG59OyIsIi8qKiBjaGFuZ2VQcm9maWxlUGhvdG8sIGl0IHVzZXMgJ3VwbG9hZGVyJyB1c2luZyBodG1sNSwgYWpheCBhbmQgYSBzcGVjaWZpYyBwYWdlXHJcbiAgdG8gbWFuYWdlIHNlcnZlci1zaWRlIHVwbG9hZCBvZiBhIG5ldyB1c2VyIHByb2ZpbGUgcGhvdG8uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCdMQy9zbW9vdGhCb3hCbG9jaycpO1xyXG4vLyBUT0RPOiByZWltcGxlbWVudCB0aGlzIGFuZCB0aGUgc2VydmVyLXNpZGUgZmlsZSB0byBhdm9pZCBpZnJhbWVzIGFuZCBleHBvc2luZyBnbG9iYWwgZnVuY3Rpb25zLFxyXG4vLyBkaXJlY3QgQVBJIHVzZSB3aXRob3V0IGlmcmFtZS1ub3JtYWwgcG9zdCBzdXBwb3J0IChjdXJyZW50IGJyb3dzZXIgbWF0cml4IGFsbG93IHVzIHRoaXM/KVxyXG4vLyBUT0RPOiBpbXBsZW1lbnQgYXMgcmVhbCBtb2R1bGFyLCBuZXh0IGFyZSB0aGUga25vd2VkIG1vZHVsZXMgaW4gdXNlIGJ1dCBub3QgbG9hZGluZyB0aGF0IGFyZSBleHBlY3RlZFxyXG4vLyB0byBiZSBpbiBzY29wZSByaWdodCBub3cgYnV0IG11c3QgYmUgdXNlZCB3aXRoIHRoZSBuZXh0IGNvZGUgdW5jb21tZW50ZWQuXHJcbi8vIHJlcXVpcmUoJ3VwbG9hZGVyJyk7XHJcbi8vIHJlcXVpcmUoJ0xjVXJsJyk7XHJcbi8vIHZhciBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuLi9MQy9ibG9ja1ByZXNldHMnKVxyXG4vLyB2YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgICAgICB1c2VyUGhvdG9Qb3B1cDtcclxuXHJcbiAgICAkYy5vbignY2xpY2snLCAnW2hyZWY9XCIjY2hhbmdlLXByb2ZpbGUtcGhvdG9cIl0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdXNlclBob3RvUG9wdXAgPSBwb3B1cChMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvQWJvdXRZb3UvQ2hhbmdlUGhvdG8vJywgeyB3aWR0aDogNzAwLCBoZWlnaHQ6IDY3MCB9LCBudWxsLCBudWxsLCB7IGF1dG9Gb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTk9URTogV2UgYXJlIGV4cG9zaW5nIGdsb2JhbCBmdW5jdGlvbnMgZnJvbSBoZXJlIGJlY2F1c2UgdGhlIHNlcnZlciBwYWdlL2lmcmFtZSBleHBlY3RzIHRoaXNcclxuICAgIC8vIHRvIHdvcmsuXHJcbiAgICAvLyBUT0RPOiByZWZhY3RvciB0byBhdm9pZCB0aGlzIHdheS5cclxuICAgIHdpbmRvdy5yZWxvYWRVc2VyUGhvdG8gPSBmdW5jdGlvbiByZWxvYWRVc2VyUGhvdG8oKSB7XHJcbiAgICAgICAgJGMuZmluZCgnLkRhc2hib2FyZFB1YmxpY0Jpby1waG90byAuYXZhdGFyJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBzcmMgPSB0aGlzLmdldEF0dHJpYnV0ZSgnc3JjJyk7XHJcbiAgICAgICAgICAgIC8vIGF2b2lkIGNhY2hlIHRoaXMgdGltZVxyXG4gICAgICAgICAgICBzcmMgPSBzcmMgKyBcIj92PVwiICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHNyYyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHdpbmRvdy5jbG9zZVBvcHVwVXNlclBob3RvID0gZnVuY3Rpb24gY2xvc2VQb3B1cFVzZXJQaG90bygpIHtcclxuICAgICAgICBpZiAodXNlclBob3RvUG9wdXApIHtcclxuICAgICAgICAgICAgdXNlclBob3RvUG9wdXAuZmluZCgnLmNsb3NlLXBvcHVwJykudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHdpbmRvdy5kZWxldGVVc2VyUGhvdG8gPSBmdW5jdGlvbiBkZWxldGVVc2VyUGhvdG8oKSB7XHJcblxyXG4gICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbigkKCc8ZGl2Lz4nKS5odG1sKExDLmJsb2NrUHJlc2V0cy5sb2FkaW5nLm1lc3NhZ2UpLCAkKCdib2R5JyksICcnLCB7IGNlbnRlcjogJ2hvcml6b250YWwnIH0pO1xyXG5cclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IExjVXJsLkxhbmdVcmwgKyBcImRhc2hib2FyZC9BYm91dFlvdS9DaGFuZ2VQaG90by8/ZGVsZXRlPXRydWVcIixcclxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gKGRhdGEuQ29kZSA9PT0gMCA/IGRhdGEuUmVzdWx0IDogZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCQoJzxkaXYvPicpLnRleHQoY29udGVudCksICQoJ2JvZHknKSwgJycsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogJ2hvcml6b250YWwnIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlbG9hZFVzZXJQaG90bygpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxufTtcclxuIiwiLyoqIEVkdWNhdGlvbiBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vcmVxdWlyZSgnTEMvanF1ZXJ5Lnh0c2gnKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgc2VjdGlvblNlbGVjdG9yID0gJy5EYXNoYm9hcmRFZHVjYXRpb24nLFxyXG4gICAgJHNlY3Rpb24gPSAkYy5maW5kKHNlY3Rpb25TZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJHNlY3Rpb24uc2libGluZ3MoKVxyXG4gICAgICAgIC5hZGQoJHNlY3Rpb24uZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAgIC5hZGQoJHNlY3Rpb24uY2xvc2VzdCgnLkRhc2hib2FyZEFib3V0WW91Jykuc2libGluZ3MoKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChzZWN0aW9uU2VsZWN0b3IpO1xyXG4gIC8vY3J1ZGwuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSA9IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9O1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICAvLyBTZXR1cCBhdXRvY29tcGxldGVcclxuICAgICRlZGl0b3IuZmluZCgnW25hbWU9aW5zdGl0dXRpb25dJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRJbnN0aXR1dGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgIGRlbGF5OiAyMDAsXHJcbiAgICAgIG1pbkxlbmd0aDogNVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gIGdlbmVyYXRlQm9va05vd0J1dHRvbjogd2l0aCB0aGUgcHJvcGVyIGh0bWwgYW5kIGZvcm1cclxuICByZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciBjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gIGZ1bmN0aW9uIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCkge1xyXG4gICAgdmFyXHJcbiAgICAgIHNpemUgPSBjLmZpbmQoJ1tuYW1lPXNpemVdOmNoZWNrZWQnKS52YWwoKSxcclxuICAgICAgcG9zaXRpb25pZCA9IGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF06Y2hlY2tlZCcpLnZhbCgpLFxyXG4gICAgICBzb3VyY2VDb250YWluZXIgPSBjLmZpbmQoJ1tuYW1lPWJ1dHRvbi1zb3VyY2UtY29kZV0nKSxcclxuICAgICAgcHJldmlld0NvbnRhaW5lciA9IGMuZmluZCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uU2l6ZXMtcHJldmlldycpLFxyXG4gICAgICBidXR0b25UcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtYnV0dG9uVGVtcGxhdGUnKS50ZXh0KCksXHJcbiAgICAgIGxpbmtUcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtbGlua1RlbXBsYXRlJykudGV4dCgpLFxyXG4gICAgICB0cGwgPSAoc2l6ZSA9PSAnbGluay1vbmx5JyA/IGxpbmtUcGwgOiBidXR0b25UcGwpLFxyXG4gICAgICB0cGxWYXJzID0gJCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uQ29kZScpO1xyXG5cclxuICAgIHByZXZpZXdDb250YWluZXIuaHRtbCh0cGwpO1xyXG4gICAgcHJldmlld0NvbnRhaW5lci5maW5kKCdhJykuYXR0cignaHJlZicsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS11cmwnKSArIChwb3NpdGlvbmlkID8gcG9zaXRpb25pZCArICcvJyA6ICcnKSk7XHJcbiAgICBwcmV2aWV3Q29udGFpbmVyLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS1zcmMnKSArIHNpemUpO1xyXG4gICAgc291cmNlQ29udGFpbmVyLnZhbChwcmV2aWV3Q29udGFpbmVyLmh0bWwoKS50cmltKCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gRmlyc3QgZ2VuZXJhdGlvblxyXG4gIGlmIChjLmxlbmd0aCA+IDApIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCk7XHJcbiAgLy8gYW5kIG9uIGFueSBmb3JtIGNoYW5nZVxyXG4gIGMub24oJ2NoYW5nZScsICdpbnB1dCcsIHJlZ2VuZXJhdGVCdXR0b25Db2RlKTtcclxufTsiLCIvKiogTGljZW5zZXMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGxpY2Vuc2VzU2VsZWN0b3IgPSAnLkRhc2hib2FyZExpY2Vuc2VzJyxcclxuICAgICRsaWNlbnNlcyA9ICRjLmZpbmQobGljZW5zZXNTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGxpY2Vuc2VzLnNpYmxpbmdzKClcclxuICAgICAgLmFkZCgkbGljZW5zZXMuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAuYWRkKCRsaWNlbnNlcy5jbG9zZXN0KCcuRGFzaGJvYXJkWW91cldvcmsnKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGxpY2Vuc2VzU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogTG9jYXRpb25zIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIG1hcFJlYWR5ID0gcmVxdWlyZSgnTEMvZ29vZ2xlTWFwUmVhZHknKTtcclxuLy8gSW5kaXJlY3RseSB1c2VkOiByZXF1aXJlKCdMQy9oYXNDb25maXJtU3VwcG9ydCcpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICAgIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgICAgIGxvY2F0aW9uc1NlbGVjdG9yID0gJy5EYXNoYm9hcmRMb2NhdGlvbnMnLFxyXG4gICAgICAgICRsb2NhdGlvbnMgPSAkYy5maW5kKGxvY2F0aW9uc1NlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICAgICAkb3RoZXJzID0gJGxvY2F0aW9ucy5zaWJsaW5ncygpXHJcbiAgICAgICAgICAgIC5hZGQoJGxvY2F0aW9ucy5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpXHJcbiAgICAgICAgICAgIC5hZGQoJGxvY2F0aW9ucy5jbG9zZXN0KCcuRGFzaGJvYXJkWW91cldvcmsnKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwobG9jYXRpb25zU2VsZWN0b3IpO1xyXG5cclxuICAgIGlmIChjcnVkbC5lbGVtZW50cy5kYXRhKCdfX2xvY2F0aW9uc0NydWRsX2luaXRpYWxpemVkX18nKSA9PT0gdHJ1ZSkgcmV0dXJuO1xyXG4gICAgY3J1ZGwuZWxlbWVudHMuZGF0YSgnX19sb2NhdGlvbnNDcnVkbF9pbml0aWFsaXplZF9fJywgdHJ1ZSk7XHJcblxyXG4gICAgdmFyIGxvY2F0aW9uTWFwO1xyXG5cclxuICAgIGNydWRsLmVsZW1lbnRzXHJcbiAgICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICAgIH0pXHJcbiAgICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuICAgICAgICAvL0ZvcmNlIGV4ZWN1dGlvbiBvZiB0aGUgJ2hhcy1jb25maXJtJyBzY3JpcHRcclxuICAgICAgICAkZWRpdG9yLmZpbmQoJ2ZpZWxkc2V0Lmhhcy1jb25maXJtID4gLmNvbmZpcm0gaW5wdXQnKS5jaGFuZ2UoKTtcclxuXHJcbiAgICAgICAgc2V0dXBDb3B5TG9jYXRpb24oJGVkaXRvcik7XHJcblxyXG4gICAgICAgIGxvY2F0aW9uTWFwID0gc2V0dXBHZW9wb3NpdGlvbmluZygkZWRpdG9yKTtcclxuXHJcbiAgICAgICAgdXBkYXRlU2VjdGlvblRpdGxlKCRlZGl0b3IpO1xyXG4gICAgfSlcclxuICAgIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1zaG93ZWQnXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuXHJcbiAgICAgICAgaWYgKGxvY2F0aW9uTWFwKVxyXG4gICAgICAgICAgICBtYXBSZWFkeS5yZWZyZXNoTWFwKGxvY2F0aW9uTWFwKTtcclxuICAgIH0pXHJcbiAgICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItaGlkZGVuJ10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcblxyXG4gICAgICAgIHVwZGF0ZVNlY3Rpb25UaXRsZSgkZWRpdG9yKTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gdXBkYXRlU2VjdGlvblRpdGxlKCRlZGl0b3IpIHtcclxuXHJcbiAgICB2YXIgaXNSYWRpdXMgPSAkZWRpdG9yLmZpbmQoJy5pcy1taW5pbXVtUmFkaXVzVWknKS5sZW5ndGggPiAwO1xyXG5cclxuICAgIHZhciBzZWN0aW9uVGl0bGUgPSAkZWRpdG9yLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1oZWFkZXInKTtcclxuXHJcbiAgICBpZiAoaXNSYWRpdXMpIHtcclxuICAgICAgICBzZWN0aW9uVGl0bGUudGV4dChzZWN0aW9uVGl0bGUuZGF0YSgncmFkaXVzLXRpdGxlJykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzZWN0aW9uVGl0bGUudGV4dChzZWN0aW9uVGl0bGUuZGF0YSgnZGVmYXVsdC10aXRsZScpKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2V0dXBDb3B5TG9jYXRpb24oJGVkaXRvcikge1xyXG4gICAgJGVkaXRvci5maW5kKCdzZWxlY3QuY29weS1sb2NhdGlvbicpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAkdC5jbG9zZXN0KCcuY3J1ZGwtZm9ybScpLnJlbG9hZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAkKHRoaXMpLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJykucmVwbGFjZShcclxuICAgICAgICAgICAgICAgICAgICAvTG9jYXRpb25JRD1cXGQrL2dpLFxyXG4gICAgICAgICAgICAgICAgICAgICdMb2NhdGlvbklEPScgKyAkdC52YWwoKSkgKyAnJicgKyAkdC5kYXRhKCdleHRyYS1xdWVyeScpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIExvY2F0ZSB1c2VyIHBvc2l0aW9uIG9yIHRyYW5zbGF0ZSBhZGRyZXNzIHRleHQgaW50byBhIGdlb2NvZGUgdXNpbmdcclxuICBicm93c2VyIGFuZCBHb29nbGUgTWFwcyBzZXJ2aWNlcy5cclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwR2VvcG9zaXRpb25pbmcoJGVkaXRvcikge1xyXG4gICAgdmFyIG1hcDtcclxuICAgIG1hcFJlYWR5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgLy8gUmVnaXN0ZXIgaWYgdXNlciBzZWxlY3RzIG9yIHdyaXRlcyBhIHBvc2l0aW9uICh0byBub3Qgb3ZlcndyaXRlIGl0IHdpdGggYXV0b21hdGljIHBvc2l0aW9uaW5nKVxyXG4gICAgICAgIHZhciBwb3NpdGlvbmVkQnlVc2VyID0gZmFsc2U7XHJcbiAgICAgICAgLy8gU29tZSBjb25mc1xyXG4gICAgICAgIHZhciBkZXRhaWxlZFpvb21MZXZlbCA9IDE3O1xyXG4gICAgICAgIHZhciBnZW5lcmFsWm9vbUxldmVsID0gOTtcclxuICAgICAgICB2YXIgZm91bmRMb2NhdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIGJ5VXNlcjogbnVsbCxcclxuICAgICAgICAgICAgYnlHZW9sb2NhdGlvbjogbnVsbCxcclxuICAgICAgICAgICAgYnlHZW9jb2RlOiBudWxsLFxyXG4gICAgICAgICAgICBvcmlnaW5hbDogbnVsbFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBsID0gJGVkaXRvci5maW5kKCcubG9jYXRpb24tbWFwJyk7XHJcbiAgICAgICAgdmFyIG0gPSBsLmZpbmQoJy5tYXAtc2VsZWN0b3IgPiAuZ29vZ2xlLW1hcCcpLmdldCgwKTtcclxuICAgICAgICB2YXIgJGxhdCA9IGwuZmluZCgnW25hbWU9bGF0aXR1ZGVdJyk7XHJcbiAgICAgICAgdmFyICRsbmcgPSBsLmZpbmQoJ1tuYW1lPWxvbmdpdHVkZV0nKTtcclxuICAgICAgICB2YXIgJGlzUmFkaXVzID0gJGVkaXRvci5maW5kKCdbbmFtZT1pdHJhdmVsXScpO1xyXG4gICAgICAgIHZhciAkcmFkaXVzID0gJGVkaXRvci5maW5kKCdbbmFtZT10cmF2ZWwtcmFkaXVzXScpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGluZyBwb3NpdGlvbiBjb29yZGluYXRlc1xyXG4gICAgICAgIHZhciBteUxhdGxuZztcclxuICAgICAgICAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgX2xhdF92YWx1ZSA9ICRsYXQudmFsKCksIF9sbmdfdmFsdWUgPSAkbG5nLnZhbCgpO1xyXG4gICAgICAgICAgICBpZiAoX2xhdF92YWx1ZSAmJiBfbG5nX3ZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBteUxhdGxuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoJGxhdC52YWwoKSwgJGxuZy52YWwoKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBXZSBjb25zaWRlciBhcyAncG9zaXRpb25lZCBieSB1c2VyJyB3aGVuIHRoZXJlIHdhcyBhIHNhdmVkIHZhbHVlIGZvciB0aGUgcG9zaXRpb24gY29vcmRpbmF0ZXMgKHdlIGFyZSBlZGl0aW5nIGEgbG9jYXRpb24pXHJcbiAgICAgICAgICAgICAgICBwb3NpdGlvbmVkQnlVc2VyID0gKG15TGF0bG5nLmxhdCgpICE9PSAwICYmIG15TGF0bG5nLmxuZygpICE9PSAwKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgcG9zaXRpb24gd2hlbiB0aGVyZSBhcmUgbm90IG9uZSAoU2FuIEZyYW5jaXNjbyBqdXN0IG5vdyk6XHJcbiAgICAgICAgICAgICAgICBteUxhdGxuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMzcuNzUzMzQ0MzkyMjYyOTgsIC0xMjIuNDI1NDYwNjAzNTE1Nik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KSgpO1xyXG4gICAgICAgIC8vIFJlbWVtYmVyIG9yaWdpbmFsIGZvcm0gbG9jYXRpb25cclxuICAgICAgICBmb3VuZExvY2F0aW9ucy5vcmlnaW5hbCA9IGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCA9IG15TGF0bG5nO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgbWFwXHJcbiAgICAgICAgdmFyIG1hcE9wdGlvbnMgPSB7XHJcbiAgICAgICAgICAgIHpvb206IChwb3NpdGlvbmVkQnlVc2VyID8gZGV0YWlsZWRab29tTGV2ZWwgOiBnZW5lcmFsWm9vbUxldmVsKSwgLy8gQmVzdCBkZXRhaWwgd2hlbiB3ZSBhbHJlYWR5IGhhZCBhIGxvY2F0aW9uXHJcbiAgICAgICAgICAgIGNlbnRlcjogbXlMYXRsbmcsXHJcbiAgICAgICAgICAgIG1hcFR5cGVJZDogZ29vZ2xlLm1hcHMuTWFwVHlwZUlkLlJPQURNQVBcclxuICAgICAgICB9O1xyXG4gICAgICAgIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAobSwgbWFwT3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgcG9zaXRpb24gbWFya2VyXHJcbiAgICAgICAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogbXlMYXRsbmcsXHJcbiAgICAgICAgICAgIG1hcDogbWFwLFxyXG4gICAgICAgICAgICBkcmFnZ2FibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gUGxhY2Vob2xkZXIgZm9yIHRoZSByYWRpdXNDaXJjbGUsIGNyZWF0ZWQgb24gZGVtYW5kXHJcbiAgICAgICAgdmFyIHJhZGl1c0NpcmNsZTtcclxuICAgICAgICAvLyBJbml0aWFsaXppbmcgcmFkaXVzQ2lyY2xlXHJcbiAgICAgICAgdXBkYXRlUmFkaXVzQ2lyY2xlKCk7XHJcblxyXG4gICAgICAgIC8vIExpc3RlbiB3aGVuIHVzZXIgY2xpY2tzIG1hcCBvciBtb3ZlIHRoZSBtYXJrZXIgdG8gbW92ZSBtYXJrZXIgb3Igc2V0IHBvc2l0aW9uIGluIHRoZSBmb3JtXHJcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCAnZHJhZ2VuZCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBzZXRGb3JtQ29vcmRpbmF0ZXMobWFya2VyLmdldFBvc2l0aW9uKCkpO1xyXG4gICAgICAgICAgICB1cGRhdGVSYWRpdXNDaXJjbGUoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXAsICdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBpZiAoIW1hcmtlci5nZXREcmFnZ2FibGUoKSkgcmV0dXJuO1xyXG4gICAgICAgICAgICBwbGFjZU1hcmtlcihldmVudC5sYXRMbmcpO1xyXG4gICAgICAgICAgICBwb3NpdGlvbmVkQnlVc2VyID0gdHJ1ZTtcclxuICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlVc2VyID0gZXZlbnQubGF0TG5nO1xyXG4gICAgICAgICAgICBzZXRGb3JtQ29vcmRpbmF0ZXMoZXZlbnQubGF0TG5nKTtcclxuICAgICAgICAgICAgdXBkYXRlUmFkaXVzQ2lyY2xlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZnVuY3Rpb24gcGxhY2VNYXJrZXIobGF0bG5nLCBkb3pvb20sIGF1dG9zYXZlKSB7XHJcbiAgICAgICAgICAgIG1hcmtlci5zZXRQb3NpdGlvbihsYXRsbmcpO1xyXG4gICAgICAgICAgICAvLyBNb3ZlIG1hcFxyXG4gICAgICAgICAgICBtYXAucGFuVG8obGF0bG5nKTtcclxuICAgICAgICAgICAgc2F2ZUNvb3JkaW5hdGVzKGF1dG9zYXZlKTtcclxuICAgICAgICAgICAgdXBkYXRlUmFkaXVzQ2lyY2xlKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZG96b29tKVxyXG4gICAgICAgICAgICAvLyBTZXQgem9vbSB0byBzb21ldGhpbmcgbW9yZSBkZXRhaWxlZFxyXG4gICAgICAgICAgICAgICAgbWFwLnNldFpvb20oZGV0YWlsZWRab29tTGV2ZWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gbWFya2VyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBzYXZlQ29vcmRpbmF0ZXMoaW5Gb3JtKSB7XHJcbiAgICAgICAgICAgIHZhciBsYXRMbmcgPSBtYXJrZXIuZ2V0UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IHRydWU7XHJcbiAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5VXNlciA9IGxhdExuZztcclxuICAgICAgICAgICAgaWYgKGluRm9ybSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgc2V0Rm9ybUNvb3JkaW5hdGVzKGxhdExuZyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gc2V0Rm9ybUNvb3JkaW5hdGVzKGxhdExuZykge1xyXG4gICAgICAgICAgICAkbGF0LnZhbChsYXRMbmcubGF0KCkpOyAvL21hcmtlci5wb3NpdGlvbi5YYVxyXG4gICAgICAgICAgICAkbG5nLnZhbChsYXRMbmcubG5nKCkpOyAvL21hcmtlci5wb3NpdGlvbi5ZYVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgSXQgY3JlYXRlcyBhIGNpcmNsZSBvbiB0aGUgbWFwIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJhZGl1c0NpcmNsZShsYXRsbmcsIHJhZGl1cykge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBnb29nbGUubWFwcy5DaXJjbGUoe1xyXG4gICAgICAgICAgICAgICAgY2VudGVyOiBsYXRsbmcsXHJcbiAgICAgICAgICAgICAgICBtYXA6IG1hcCxcclxuICAgICAgICAgICAgICAgIGNsaWNrYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICByYWRpdXM6IGdldExvY2F0aW9uUmFkaXVzKCksXHJcbiAgICAgICAgICAgICAgICBmaWxsQ29sb3I6ICcjMDA5ODlBJyxcclxuICAgICAgICAgICAgICAgIGZpbGxPcGFjaXR5OiAwLjMsXHJcbiAgICAgICAgICAgICAgICBzdHJva2VXZWlnaHQ6IDBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgIFVwZGF0ZXMgdGhlIHBvc2l0aW9uIGFuZCByYWRpdXMgb2YgY3VycmVudCByYWRpdXNDaXJjbGVcclxuICAgICAgICBpbiB0aGUgbWFwIGZvciB0aGUgY3VycmVudCBwb3NpdGlvbiBhbmQgcmFkaXVzXHJcbiAgICAgICAgb3IgdGhlIGdpdmVuIG9uZS5cclxuICAgICAgICBJZiB0aGUgY2lyY2xlIGRvZXNuJ3QgZXhpc3RzLCBpdHMgY3JlYXRlZCxcclxuICAgICAgICBvciBoaWRkZW4gaWYgdGhlcmUgaXMgbm8gcmFkaXVzIGFuZCBleGlzdHMgYWxyZWFkeS5cclxuICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVSYWRpdXNDaXJjbGUobGF0bG5nLCByYWRpdXMpIHtcclxuXHJcbiAgICAgICAgICAgIGxhdGxuZyA9IGxhdGxuZyAmJiBsYXRsbmcuZ2V0TG5nIHx8IG1hcmtlci5nZXRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICByYWRpdXMgPSByYWRpdXMgfHwgZ2V0TG9jYXRpb25SYWRpdXMoKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyYWRpdXMgJiYgbGF0bG5nKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmFkaXVzQ2lyY2xlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzQ2lyY2xlLnNldENlbnRlcihsYXRsbmcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJhZGl1c0NpcmNsZS5zZXRSYWRpdXMocmFkaXVzKTtcclxuICAgICAgICAgICAgICAgICAgICByYWRpdXNDaXJjbGUuc2V0VmlzaWJsZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHJhZGl1c0NpcmNsZSA9IGNyZWF0ZVJhZGl1c0NpcmNsZShsYXRsbmcsIHJhZGl1cyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocmFkaXVzQ2lyY2xlKSB7XHJcbiAgICAgICAgICAgICAgICByYWRpdXNDaXJjbGUuc2V0VmlzaWJsZShmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgR2V0IHRoZSBzZXJ2aWNlIHJhZGl1cyBhcyBhIG51bWJlciBpbiBtZXRlcnMgdXNlZnVsZSBmb3IgR29vZ2xlIE1hcHNcclxuICAgICAgICBmcm9tIHRoZSBmb3JtIHdoZW5ldmVyIGFwcGx5LCBlbHNlIGl0IHJldHVybnMgbnVsbC5cclxuICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiBnZXRMb2NhdGlvblJhZGl1cygpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIFdoZW4gcmFkaXVzL3RyYXZlbCBvcHRpb24gY2hvb3NlblxyXG4gICAgICAgICAgICBpZiAoJGlzUmFkaXVzLmZpbHRlcignOmNoZWNrZWRbdmFsdWU9XCJUcnVlXCJdJykucHJvcCgnY2hlY2tlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgcmFkaXVzIGZyb20gZm9ybSAoaXRzIGluIG1pbGVzIG9yIGttKVxyXG4gICAgICAgICAgICAgICAgdmFyIHJhZGl1cyA9ICRyYWRpdXMudmFsKCk7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmFkaXVzVW5pdCA9IExDLmRpc3RhbmNlVW5pdHNbTEMuZ2V0Q3VycmVudEN1bHR1cmUoKS5jb3VudHJ5XTtcclxuICAgICAgICAgICAgICAgIC8vIHJlc3VsdCBtdXN0IGdvIGluIG1ldGVyc1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChyYWRpdXNVbml0ID09ICdtaWxlcycgPyBjb252ZXJ0TWlsZXNLbShyYWRpdXMsIHJhZGl1c1VuaXQpIDogcmFkaXVzKSAqIDEwMDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTGlzdGVuIHdoZW4gdXNlciBjaGFuZ2VzIGZvcm0gY29vcmRpbmF0ZXMgdmFsdWVzIHRvIHVwZGF0ZSB0aGUgbWFwXHJcbiAgICAgICAgJGxhdC5jaGFuZ2UodXBkYXRlTWFwTWFya2VyKTtcclxuICAgICAgICAkbG5nLmNoYW5nZSh1cGRhdGVNYXBNYXJrZXIpO1xyXG4gICAgICAgIGZ1bmN0aW9uIHVwZGF0ZU1hcE1hcmtlcigpIHtcclxuICAgICAgICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IHRydWU7XHJcbiAgICAgICAgICAgIHZhciBuZXdQb3MgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKCRsYXQudmFsKCksICRsbmcudmFsKCkpO1xyXG4gICAgICAgICAgICAvLyBNb3ZlIG1hcmtlclxyXG4gICAgICAgICAgICBtYXJrZXIuc2V0UG9zaXRpb24obmV3UG9zKTtcclxuICAgICAgICAgICAgLy8gTW92ZSBtYXBcclxuICAgICAgICAgICAgbWFwLnBhblRvKG5ld1Bvcyk7XHJcbiAgICAgICAgICAgIHVwZGF0ZVJhZGl1c0NpcmNsZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBMaXN0ZW4gd2hlbiB1c2VyIGNoYW5nZXMgc2VydmljZSByYWRpdXMgZnJvbSBmb3JtIHRvIHVwZGF0ZSB0aGUgbWFwXHJcbiAgICAgICAgJGlzUmFkaXVzLmNoYW5nZSh1cGRhdGVSYWRpdXNDaXJjbGUpO1xyXG4gICAgICAgICRyYWRpdXMuY2hhbmdlKHVwZGF0ZVJhZGl1c0NpcmNsZSk7XHJcblxyXG4gICAgICAgIC8qPT09PT09PT09PT09PT09PT09PVxyXG4gICAgICAgICogQVVUTyBQT1NJVElPTklOR1xyXG4gICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gdXNlR2VvbG9jYXRpb24oZm9yY2UsIGF1dG9zYXZlKSB7XHJcbiAgICAgICAgICAgIHZhciBvdmVycmlkZSA9IGZvcmNlIHx8ICFwb3NpdGlvbmVkQnlVc2VyO1xyXG4gICAgICAgICAgICAvLyBVc2UgYnJvd3NlciBnZW9sb2NhdGlvbiBzdXBwb3J0IHRvIGdldCBhbiBhdXRvbWF0aWMgbG9jYXRpb24gaWYgdGhlcmUgaXMgbm8gYSBsb2NhdGlvbiBzZWxlY3RlZCBieSB1c2VyXHJcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGJyb3dzZXIgc3VwcG9ydHMgZ2VvbG9jYXRpb24uXHJcbiAgICAgICAgICAgIGlmIChvdmVycmlkZSAmJiBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBsb2NhdGlvbiBtYXJrZXIgdGhhdCB3ZSB3aWxsIGJlIHVzaW5nXHJcbiAgICAgICAgICAgICAgICAvLyBvbiB0aGUgbWFwLiBMZXQncyBzdG9yZSBhIHJlZmVyZW5jZSB0byBpdCBoZXJlIHNvXHJcbiAgICAgICAgICAgICAgICAvLyB0aGF0IGl0IGNhbiBiZSB1cGRhdGVkIGluIHNldmVyYWwgcGxhY2VzLlxyXG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uTWFya2VyID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgdGhlIGxvY2F0aW9uIG9mIHRoZSB1c2VyJ3MgYnJvd3NlciB1c2luZyB0aGVcclxuICAgICAgICAgICAgICAgIC8vIG5hdGl2ZSBnZW9sb2NhdGlvbiBzZXJ2aWNlLiBXaGVuIHdlIGludm9rZSB0aGlzIG1ldGhvZFxyXG4gICAgICAgICAgICAgICAgLy8gb25seSB0aGUgZmlyc3QgY2FsbGJhY2sgaXMgcmVxdWllZC4gVGhlIHNlY29uZFxyXG4gICAgICAgICAgICAgICAgLy8gY2FsbGJhY2sgLSB0aGUgZXJyb3IgaGFuZGxlciAtIGFuZCB0aGUgdGhpcmRcclxuICAgICAgICAgICAgICAgIC8vIGFyZ3VtZW50IC0gb3VyIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyAtIGFyZSBvcHRpb25hbC5cclxuICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGVyZSBpcyBhbHJlYWR5IGEgbG9jYXRpb24uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgYnVnIGluIEZpcmVGb3ggd2hlcmUgdGhpcyBnZXRzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludm9rZWQgbW9yZSB0aGFuIG9uY2Ugd2l0aCBhIGNhY2hlZCByZXN1bHQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2NhdGlvbk1hcmtlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBNb3ZlIG1hcmtlciB0byB0aGUgbWFwIHVzaW5nIHRoZSBwb3NpdGlvbiwgb25seSBpZiB1c2VyIGRvZXNuJ3Qgc2V0IGEgcG9zaXRpb25cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG92ZXJyaWRlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGF0TG5nID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubGF0aXR1ZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uTWFya2VyID0gcGxhY2VNYXJrZXIobGF0TG5nLCB0cnVlLCBhdXRvc2F2ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5ieUdlb2xvY2F0aW9uID0gbGF0TG5nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5sb2cpIGNvbnNvbGUubG9nKFwiU29tZXRoaW5nIHdlbnQgd3Jvbmc6IFwiLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6ICg1ICogMTAwMCksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heGltdW1BZ2U6ICgxMDAwICogNjAgKiAxNSksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgYXNrZWQgZm9yIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlcixcclxuICAgICAgICAgICAgICAgIC8vIGxldCdzIHdhdGNoIHRoZSBwb3NpdGlvbiB0byBzZWUgaWYgaXQgdXBkYXRlcy4gVGhpc1xyXG4gICAgICAgICAgICAgICAgLy8gY2FuIGhhcHBlbiBpZiB0aGUgdXNlciBwaHlzaWNhbGx5IG1vdmVzLCBvZiBpZiBtb3JlXHJcbiAgICAgICAgICAgICAgICAvLyBhY2N1cmF0ZSBsb2NhdGlvbiBpbmZvcm1hdGlvbiBoYXMgYmVlbiBmb3VuZCAoZXguXHJcbiAgICAgICAgICAgICAgICAvLyBHUFMgdnMuIElQIGFkZHJlc3MpLlxyXG4gICAgICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgICAgIC8vIE5PVEU6IFRoaXMgYWN0cyBtdWNoIGxpa2UgdGhlIG5hdGl2ZSBzZXRJbnRlcnZhbCgpLFxyXG4gICAgICAgICAgICAgICAgLy8gaW52b2tpbmcgdGhlIGdpdmVuIGNhbGxiYWNrIGEgbnVtYmVyIG9mIHRpbWVzIHRvXHJcbiAgICAgICAgICAgICAgICAvLyBtb25pdG9yIHRoZSBwb3NpdGlvbi4gQXMgc3VjaCwgaXQgcmV0dXJucyBhIFwidGltZXIgSURcIlxyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBjYW4gYmUgdXNlZCB0byBsYXRlciBzdG9wIHRoZSBtb25pdG9yaW5nLlxyXG4gICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uVGltZXIgPSBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24ud2F0Y2hQb3NpdGlvbihcclxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBNb3ZlIGFnYWluIHRvIHRoZSBuZXcgb3IgYWNjdXJhdGVkIHBvc2l0aW9uLCBpZiB1c2VyIGRvZXNuJ3Qgc2V0IGEgcG9zaXRpb25cclxuICAgICAgICAgICAgICAgICAgICAgIGlmIChvdmVycmlkZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXRMbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubGF0aXR1ZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmNvb3Jkcy5sb25naXR1ZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uTWFya2VyID0gcGxhY2VNYXJrZXIobGF0TG5nLCB0cnVlLCBhdXRvc2F2ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbiA9IGxhdExuZztcclxuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5jbGVhcldhdGNoKHBvc2l0aW9uVGltZXIpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcG9zaXRpb24gaGFzbid0IHVwZGF0ZWQgd2l0aGluIDUgbWludXRlcywgc3RvcFxyXG4gICAgICAgICAgICAgICAgLy8gbW9uaXRvcmluZyB0aGUgcG9zaXRpb24gZm9yIGNoYW5nZXMuXHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBDbGVhciB0aGUgcG9zaXRpb24gd2F0Y2hlci5cclxuICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5jbGVhcldhdGNoKHBvc2l0aW9uVGltZXIpO1xyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAoMTAwMCAqIDYwICogNSlcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9IC8vIEVuZHMgZ2VvbG9jYXRpb24gcG9zaXRpb25cclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gdXNlR21hcHNHZW9jb2RlKGluaXRpYWxMb29rdXAsIGF1dG9zYXZlKSB7XHJcbiAgICAgICAgICAgIHZhciBnZW9jb2RlciA9IG5ldyBnb29nbGUubWFwcy5HZW9jb2RlcigpO1xyXG5cclxuICAgICAgICAgICAgLy8gbG9va3VwIG9uIGFkZHJlc3MgZmllbGRzIGNoYW5nZXMgd2l0aCBjb21wbGV0ZSBpbmZvcm1hdGlvblxyXG4gICAgICAgICAgICB2YXIgJGZvcm0gPSAkZWRpdG9yLmZpbmQoJy5jcnVkbC1mb3JtJyksIGZvcm0gPSAkZm9ybS5nZXQoMCk7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEZvcm1BZGRyZXNzKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFkID0gW107XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBhZGQoZmllbGQpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZm9ybS5lbGVtZW50c1tmaWVsZF0gJiYgZm9ybS5lbGVtZW50c1tmaWVsZF0udmFsdWUpIGFkLnB1c2goZm9ybS5lbGVtZW50c1tmaWVsZF0udmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYWRkKCdhZGRyZXNzbGluZTEnKTtcclxuICAgICAgICAgICAgICAgIGFkZCgnYWRkcmVzc2xpbmUyJyk7XHJcbiAgICAgICAgICAgICAgICBhZGQoJ2NpdHknKTtcclxuICAgICAgICAgICAgICAgIGFkZCgncG9zdGFsY29kZScpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHMgPSBmb3JtLmVsZW1lbnRzLnN0YXRlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHMgJiYgcy52YWx1ZSkgYWQucHVzaChzLm9wdGlvbnNbcy5zZWxlY3RlZEluZGV4XS5sYWJlbCk7XHJcbiAgICAgICAgICAgICAgICBhZC5wdXNoKCdVU0EnKTtcclxuICAgICAgICAgICAgICAgIC8vIE1pbmltdW0gZm9yIHZhbGlkIGFkZHJlc3M6IDIgZmllbGRzIGZpbGxlZCBvdXRcclxuICAgICAgICAgICAgICAgIHJldHVybiBhZC5sZW5ndGggPj0gMiA/IGFkLmpvaW4oJywgJykgOiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRmb3JtLm9uKCdjaGFuZ2UnLCAnW25hbWU9YWRkcmVzc2xpbmUxXSwgW25hbWU9YWRkcmVzc2xpbmUyXSwgW25hbWU9Y2l0eV0sIFtuYW1lPXBvc3RhbGNvZGVdLCBbbmFtZT1zdGF0ZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWRkcmVzcyA9IGdldEZvcm1BZGRyZXNzKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYWRkcmVzcylcclxuICAgICAgICAgICAgICAgICAgICBnZW9jb2RlTG9va3VwKGFkZHJlc3MsIGZhbHNlKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbml0aWFsIGxvb2t1cFxyXG4gICAgICAgICAgICBpZiAoaW5pdGlhbExvb2t1cCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFkZHJlc3MgPSBnZXRGb3JtQWRkcmVzcygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFkZHJlc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgZ2VvY29kZUxvb2t1cChhZGRyZXNzLCB0cnVlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZnVuY3Rpb24gZ2VvY29kZUxvb2t1cChhZGRyZXNzLCBvdmVycmlkZSkge1xyXG4gICAgICAgICAgICAgICAgZ2VvY29kZXIuZ2VvY29kZSh7ICdhZGRyZXNzJzogYWRkcmVzcyB9LCBmdW5jdGlvbiAocmVzdWx0cywgc3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cyA9PSBnb29nbGUubWFwcy5HZW9jb2RlclN0YXR1cy5PSykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGF0TG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oJ0dlb2NvZGUgcmV0cmlldmVkOiAnICsgbGF0TG5nICsgJyBmb3IgYWRkcmVzcyBcIicgKyBhZGRyZXNzICsgJ1wiJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5R2VvY29kZSA9IGxhdExuZztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ0dlb2NvZGUgd2FzIG5vdCBzdWNjZXNzZnVsIGZvciB0aGUgZm9sbG93aW5nIHJlYXNvbjogJyArIHN0YXR1cyArICcgb24gYWRkcmVzcyBcIicgKyBhZGRyZXNzICsgJ1wiJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4ZWN1dGluZyBhdXRvIHBvc2l0aW9uaW5nIChjaGFuZ2VkIHRvIGF1dG9zYXZlOnRydWUgdG8gYWxsIHRpbWUgc2F2ZSB0aGUgbG9jYXRpb24pOlxyXG4gICAgICAgIC8vdXNlR2VvbG9jYXRpb24odHJ1ZSwgZmFsc2UpO1xyXG4gICAgICAgIHVzZUdtYXBzR2VvY29kZShmYWxzZSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIC8vIExpbmsgb3B0aW9ucyBsaW5rczpcclxuICAgICAgICBsLmZpbmQoJy5vcHRpb25zIGEnKS5vZmYoJ2NsaWNrLm1hcCcpLm9uKCdjbGljay5tYXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXQgPSAkKHRoaXMpLmF0dHIoJ2hyZWYnKS5zdWJzdHIoMSk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdnZW9sb2NhdGlvbic6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlTWFya2VyKGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24sIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlR2VvbG9jYXRpb24odHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdnZW9jb2RlJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmRMb2NhdGlvbnMuYnlHZW9jb2RlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZU1hcmtlcihmb3VuZExvY2F0aW9ucy5ieUdlb2NvZGUsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXNlR21hcHNHZW9jb2RlKHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnY29uZmlybSc6XHJcbiAgICAgICAgICAgICAgICAgICAgc2F2ZUNvb3JkaW5hdGVzKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlci5zZXREcmFnZ2FibGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCA9IG1hcmtlci5nZXRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIGwuZmluZCgnLmdwcy1sYXQsIC5ncHMtbG5nLCAuYWR2aWNlLCAuZmluZC1hZGRyZXNzLWdlb2NvZGUsIC5jb25maXJtLWdwcy1hY3Rpb24nKS5oaWRlKCdmYXN0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVkaXQgPSBsLmZpbmQoJy5lZGl0LWFjdGlvbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVkaXQudGV4dChlZGl0LmRhdGEoJ2VkaXQtbGFiZWwnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdlZGl0Y29vcmRpbmF0ZXMnOlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhID0gbC5maW5kKCcuZ3BzLWxhdCwgLmdwcy1sbmcsIC5hZHZpY2UsIC5maW5kLWFkZHJlc3MtZ2VvY29kZSwgLmNvbmZpcm0tZ3BzLWFjdGlvbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBiID0gIWEuaXMoJzp2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyLnNldERyYWdnYWJsZShiKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0LmRhdGEoJ2VkaXQtbGFiZWwnLCAkdC50ZXh0KCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC50ZXh0KCR0LmRhdGEoJ2NhbmNlbC1sYWJlbCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC50ZXh0KCR0LmRhdGEoJ2VkaXQtbGFiZWwnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlc3RvcmUgbG9jYXRpb246XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlTWFya2VyKGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGEudG9nZ2xlKCdmYXN0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsLmZpbmQoJy5jb25maXJtLWdwcy1hY3Rpb246dmlzaWJsZScpLmNzcygnZGlzcGxheScsICdpbmxpbmUtYmxvY2snKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIG1hcDtcclxufSIsIi8qZ2xvYmFsIHdpbmRvdyAqL1xyXG4vKiogVUkgbG9naWMgdG8gbWFuYWdlIHByb3ZpZGVyIHBob3RvcyAoeW91ci13b3JrL3Bob3RvcykuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnktdWknKTtcclxudmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnTEMvc21vb3RoQm94QmxvY2snKTtcclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSByZXF1aXJlKCdMQy9jaGFuZ2VzTm90aWZpY2F0aW9uJyk7XHJcbnZhciBhY2IgPSByZXF1aXJlKCdMQy9hamF4Q2FsbGJhY2tzJyk7XHJcbnJlcXVpcmUoJ2ltYWdlc0xvYWRlZCcpO1xyXG5cclxudmFyIHNlY3Rpb25TZWxlY3RvciA9ICcuRGFzaGJvYXJkUGhvdG9zJztcclxuLy8gT24gaW5pdCwgdGhlIGRlZmF1bHQgJ25vIGltYWdlJyBpbWFnZSBzcmMgd2lsbCBiZSBnZXQgaXQgb246XHJcbnZhciBkZWZhdWx0SW1nU3JjID0gbnVsbDtcclxuXHJcbnZhciBlZGl0b3IgPSBudWxsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gICAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gICAgaWYgKCRjLmxlbmd0aCkge1xyXG5cclxuICAgICAgICBzZXR1cENydWRsRGVsZWdhdGVzKCRjKTtcclxuXHJcbiAgICAgICAgaW5pdEVsZW1lbnRzKCRjKTtcclxuXHJcbiAgICAgICAgLy8gQW55IHRpbWUgdGhhdCB0aGUgZm9ybSBjb250ZW50IGh0bWwgaXMgcmVsb2FkZWQsXHJcbiAgICAgICAgLy8gcmUtaW5pdGlhbGl6ZSBlbGVtZW50c1xyXG4gICAgICAgICRjLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLmFqYXgnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGluaXRFbGVtZW50cygkYyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5mdW5jdGlvbiBzYXZlKGRhdGEpIHtcclxuICAgIFxyXG4gICAgdmFyIGVkaXRQYW5lbCA9ICQoc2VjdGlvblNlbGVjdG9yKTtcclxuXHJcbiAgICByZXR1cm4gJC5hamF4KHtcclxuICAgICAgICB1cmw6IGVkaXRQYW5lbC5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpLFxyXG4gICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgdHlwZTogJ3Bvc3QnLFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA8IDApIHtcclxuICAgICAgICAgICAgICAgIC8vIG5ldyBlcnJvciBmb3IgUHJvbWlzZS1hdHRhY2hlZCBjYWxsYmFja3NcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihkYXRhLkVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZWdpc3RlciBjaGFuZ2VzXHJcbiAgICAgICAgICAgICAgICB2YXIgJGMgPSAkKHNlY3Rpb25TZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZSgkYy5jbG9zZXN0KCdmb3JtJykuZ2V0KDApLCAkYy5maW5kKCc6aW5wdXQnKS50b0FycmF5KCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgdGV4dCwgZXJyb3IpIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogYmV0dGVyIGVycm9yIG1hbmFnZW1lbnQsIHNhdmluZ1xyXG4gICAgICAgICAgICBhbGVydCgnU29ycnksIHRoZXJlIHdhcyBhbiBlcnJvci4gJyArIChlcnJvciB8fCAnJykpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzYXZlRWRpdGVkUGhvdG8oJGYpIHtcclxuXHJcbiAgICB2YXIgaWQgPSAkZi5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbCgpLFxyXG4gICAgICAgIGNhcHRpb24gPSAkZi5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbCgpLFxyXG4gICAgICAgIGlzUHJpbWFyeSA9ICRmLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dOmNoZWNrZWQnKS52YWwoKSA9PT0gJ1RydWUnO1xyXG5cclxuICAgIGlmIChpZCAmJiBpZCA+IDApIHtcclxuICAgICAgICAvLyBBamF4IHNhdmVcclxuICAgICAgICBzYXZlKHtcclxuICAgICAgICAgICAgUGhvdG9JRDogaWQsXHJcbiAgICAgICAgICAgICdwaG90by1jYXB0aW9uJzogY2FwdGlvbixcclxuICAgICAgICAgICAgJ2lzLXByaW1hcnktcGhvdG8nOiBpc1ByaW1hcnksXHJcbiAgICAgICAgICAgIHJlc3VsdDogJ2pzb24nXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gVXBkYXRlIGNhY2hlIGF0IGdhbGxlcnkgaXRlbVxyXG4gICAgICAgIHZhciAkaXRlbSA9ICRmLmZpbmQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ICNVc2VyUGhvdG8tJyArIGlkKSxcclxuICAgICAgICAgICAgJGltZyA9ICRpdGVtLmZpbmQoJ2ltZycpO1xyXG5cclxuICAgICAgICBpZiAoJGl0ZW0gJiYgJGl0ZW0ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICRpbWcuYXR0cignYWx0JywgY2FwdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpc1ByaW1hcnkpXHJcbiAgICAgICAgICAgICAgICAkaXRlbS5hZGRDbGFzcygnaXMtcHJpbWFyeS1waG90bycpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaXMtcHJpbWFyeS1waG90bycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZWRpdFNlbGVjdGVkUGhvdG8oZm9ybSwgc2VsZWN0ZWQpIHtcclxuXHJcbiAgICB2YXIgZWRpdFBhbmVsID0gJCgnLnBvc2l0aW9ucGhvdG9zLWVkaXQnLCBmb3JtKTtcclxuICAgIHZhciBub25VcGxvYWRlckVsZW1lbnRzU2VsZWN0b3IgPSAnLnBvc2l0aW9ucGhvdG9zLWVkaXQsIC5EYXNoYm9hcmRQaG90b3MtZWRpdFBob3RvID4gbGVnZW5kLCAucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IGxlZ2VuZCwgLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbCwgLnBvc2l0aW9ucGhvdG9zLXRvb2xzJztcclxuXHJcbiAgICAvLyBVc2UgZ2l2ZW4gQHNlbGVjdGVkIG9yIGxvb2sgZm9yIGEgc2VsZWN0ZWQgcGhvdG8gaW4gdGhlIGxpc3RcclxuICAgIHNlbGVjdGVkID0gc2VsZWN0ZWQgJiYgc2VsZWN0ZWQubGVuZ3RoID8gc2VsZWN0ZWQgOiAkKCcucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IG9sID4gbGkuc2VsZWN0ZWQnLCBmb3JtKTtcclxuXHJcbiAgICAvLyBNYXJrIHRoaXMgYXMgc2VsZWN0ZWRcclxuICAgIHNlbGVjdGVkLmFkZENsYXNzKCdzZWxlY3RlZCcpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJyk7XHJcblxyXG4gICAgaWYgKHNlbGVjdGVkICYmIHNlbGVjdGVkLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgZm9ybS5maW5kKG5vblVwbG9hZGVyRWxlbWVudHNTZWxlY3Rvcikuc2hvdygpO1xyXG4gICAgICAgIGVkaXRvci51cGxvYWRlci5zZXRBc1NlY29uZGFyeSgpO1xyXG5cclxuICAgICAgICB2YXIgc2VsSW1nID0gc2VsZWN0ZWQuZmluZCgnaW1nJyk7XHJcbiAgICAgICAgLy8gTW92aW5nIHNlbGVjdGVkIHRvIGJlIGVkaXQgcGFuZWxcclxuICAgICAgICB2YXIgcGhvdG9JRCA9IHNlbGVjdGVkLmF0dHIoJ2lkJykubWF0Y2goL15Vc2VyUGhvdG8tKFxcZCspJC8pWzFdLFxyXG4gICAgICAgICAgICBwaG90b1VybCA9IHNlbEltZy5hdHRyKCdzcmMnKSxcclxuICAgICAgICAgICAgJGltZyA9IGVkaXRQYW5lbC5maW5kKCdpbWcnKTtcclxuXHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPVBob3RvSURdJykudmFsKHBob3RvSUQpO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90b1VSSV0nKS52YWwocGhvdG9VcmwpO1xyXG4gICAgICAgICRpbWdcclxuICAgICAgICAuYXR0cignc3JjJywgcGhvdG9VcmwgKyBcIj92PVwiICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKSkgLy8gJz9zaXplPW5vcm1hbCcpXHJcbiAgICAgICAgLmF0dHIoJ3N0eWxlJywgJycpO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbChzZWxJbWcuYXR0cignYWx0JykpO1xyXG4gICAgICAgIHZhciBpc1ByaW1hcnlWYWx1ZSA9IHNlbGVjdGVkLmhhc0NsYXNzKCdpcy1wcmltYXJ5LXBob3RvJykgPyAnVHJ1ZScgOiAnRmFsc2UnO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dW3ZhbHVlPScgKyBpc1ByaW1hcnlWYWx1ZSArICddJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG5cclxuICAgICAgICAvLyBDcm9wcGluZ1xyXG4gICAgICAgICRpbWcuaW1hZ2VzTG9hZGVkKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZWRpdG9yLnNldHVwQ3JvcFBob3RvKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoZm9ybS5maW5kKCcucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IG9sID4gbGknKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgLy8gIzUzNSwgYXZvaWQgdGhlICd0aGVyZSBpcyBubyBwaG90b3MnIGFuZCBqdXN0IGhpZGUgdGhlIHBhbmVsIHRvIGdpdmUgcXVpY2sgYWNjZXNzXHJcbiAgICAgICAgICAgIC8vIHRvIHRoZSAndXBsb2FkIGJ1dHRvbicuIFRoZSBnYWxsZXJ5IG1heSBuZWVkIHRvIGJlIGhpZGRlbiB0b29cclxuICAgICAgICAgICAgLy9zbW9vdGhCb3hCbG9jay5vcGVuKGZvcm0uZmluZCgnLm5vLXBob3RvcycpLCBlZGl0UGFuZWwsICcnLCB7IGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgICAgIGZvcm0uZmluZChub25VcGxvYWRlckVsZW1lbnRzU2VsZWN0b3IpLmhpZGUoKTtcclxuICAgICAgICAgICAgZWRpdG9yLnVwbG9hZGVyLnNldEFzTWFpbigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZvcm0uZmluZChub25VcGxvYWRlckVsZW1lbnRzU2VsZWN0b3IpLnNob3coKTtcclxuICAgICAgICAgICAgZWRpdG9yLnVwbG9hZGVyLnNldEFzU2Vjb25kYXJ5KCk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oZm9ybS5maW5kKCcubm8tcHJpbWFyeS1waG90bycpLCBlZGl0UGFuZWwsICcnLCB7IGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIE5vIGltYWdlOlxyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdpbWcnKS5hdHRyKCdzcmMnLCBkZWZhdWx0SW1nU3JjKTtcclxuICAgICAgICAvLyBSZXNldCBoaWRkZW4gZmllbGRzIG1hbnVhbGx5IHRvIGF2b2lkIGJyb3dzZXIgbWVtb3J5IGJyZWFraW5nIHRoaW5nc1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbCgnJyk7XHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPXBob3RvLWNhcHRpb25dJykudmFsKCcnKTtcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b10nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKiBTZXR1cCB0aGUgY29kZSB0aGF0IHdvcmtzIG9uIHRoZSBkaWZmZXJlbnQgQ1JVREwgYWN0aW9ucyBvbiB0aGUgcGhvdG9zLlxyXG4gIEFsbCB0aGlzIGFyZSBkZWxlZ2F0ZXMsIG9ubHkgbmVlZCB0byBiZSBzZXR1cCBvbmNlIG9uIHRoZSBwYWdlXHJcbiAgKGlmIHRoZSBjb250YWluZXIgJGMgaXMgbm90IHJlcGxhY2VkLCBvbmx5IHRoZSBjb250ZW50cywgZG9lc24ndCBuZWVkIHRvIGNhbGwgYWdhaW4gdGhpcykuXHJcbiovXHJcbmZ1bmN0aW9uIHNldHVwQ3J1ZGxEZWxlZ2F0ZXMoJGMpIHtcclxuICAgICRjXHJcbiAgICAub24oJ2NoYW5nZScsICcucG9zaXRpb25waG90b3MtZWRpdCBpbnB1dCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJbnN0YW50IHNhdmluZyBvbiB1c2VyIGNoYW5nZXMgdG8gdGhlIGVkaXRpbmcgZm9ybVxyXG4gICAgICAgIHZhciAkZiA9ICQodGhpcykuY2xvc2VzdCgnLnBvc2l0aW9ucGhvdG9zLWVkaXQnKTtcclxuICAgICAgICBzYXZlRWRpdGVkUGhvdG8oJGYpO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnLnBvc2l0aW9ucGhvdG9zLXRvb2xzLXVwbG9hZCA+IGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHBvc0lEID0gJCh0aGlzKS5jbG9zZXN0KCdmb3JtJykuZmluZCgnaW5wdXRbbmFtZT1wb3NpdGlvbklEXScpLnZhbCgpO1xyXG4gICAgICAgIHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC9Zb3VyV29yay9VcGxvYWRQaG90by8/UG9zaXRpb25JRD0nICsgcG9zSUQsIHsgd2lkdGg6IDcwMCwgaGVpZ2h0OiA2NzAgfSwgbnVsbCwgbnVsbCwgeyBhdXRvRm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5IGxpIGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICB2YXIgZm9ybSA9ICR0LmNsb3Nlc3Qoc2VjdGlvblNlbGVjdG9yKTtcclxuICAgICAgICAvLyBEb24ndCBsb3N0IGxhdGVzdCBjaGFuZ2VzOlxyXG4gICAgICAgIHNhdmVFZGl0ZWRQaG90byhmb3JtKTtcclxuXHJcbiAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2VBbGwoZm9ybSk7XHJcbiAgICAgICAgLy8gU2V0IHRoaXMgcGhvdG8gYXMgc2VsZWN0ZWRcclxuICAgICAgICB2YXIgc2VsZWN0ZWQgPSAkdC5jbG9zZXN0KCdsaScpO1xyXG4gICAgICAgIGVkaXRTZWxlY3RlZFBob3RvKGZvcm0sIHNlbGVjdGVkKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnLkRhc2hib2FyZFBob3Rvcy1lZGl0UGhvdG8tZGVsZXRlJywgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgZWRpdFBhbmVsID0gJCh0aGlzKS5jbG9zZXN0KCcucG9zaXRpb25waG90b3MtZWRpdCcpO1xyXG4gICAgICAgIHZhciBmb3JtID0gZWRpdFBhbmVsLmNsb3Nlc3Qoc2VjdGlvblNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgdmFyIHBob3RvSUQgPSBlZGl0UGFuZWwuZmluZCgnW25hbWU9UGhvdG9JRF0nKS52YWwoKTtcclxuICAgICAgICB2YXIgJHBob3RvSXRlbSA9IGZvcm0uZmluZCgnI1VzZXJQaG90by0nICsgcGhvdG9JRCk7XHJcblxyXG4gICAgICAgIC8vIEluc3RhbnQgc2F2aW5nXHJcbiAgICAgICAgc2F2ZSh7XHJcbiAgICAgICAgICAgIFBob3RvSUQ6IHBob3RvSUQsXHJcbiAgICAgICAgICAgICdkZWxldGUtcGhvdG8nOiAnVHJ1ZScsXHJcbiAgICAgICAgICAgIHJlc3VsdDogJ2pzb24nXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBpdGVtXHJcbiAgICAgICAgICAgICRwaG90b0l0ZW0ucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICBlZGl0U2VsZWN0ZWRQaG90byhmb3JtKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qIEluaXRpYWxpemUgdGhlIHBob3RvcyBlbGVtZW50cyB0byBiZSBzb3J0YWJsZXMsIHNldCB0aGUgcHJpbWFyeSBwaG90b1xyXG4gIGluIHRoZSBoaWdobGlnaHRlZCBhcmUgYW5kIGluaXRpYWxpemUgdGhlICdkZWxldGUgcGhvdG8nIGZsYWcuXHJcbiAgVGhpcyBpcyByZXF1aXJlZCB0byBiZSBleGVjdXRlZCBhbnkgdGltZSB0aGUgZWxlbWVudHMgaHRtbCBpcyByZXBsYWNlZFxyXG4gIGJlY2F1c2UgbmVlZHMgZGlyZWN0IGFjY2VzcyB0byB0aGUgRE9NIGVsZW1lbnRzLlxyXG4qL1xyXG5mdW5jdGlvbiBpbml0RWxlbWVudHMoZm9ybSkge1xyXG5cclxuICAgIGRlZmF1bHRJbWdTcmMgPSBmb3JtLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycpO1xyXG5cclxuICAgIHZhciBzb3J0YWJsZSA9IG5ldyBTb3J0YWJsZSh7IGNvbnRhaW5lcjogZm9ybSB9KTtcclxuXHJcbiAgICAvLyBFZGl0b3Igc2V0dXBcclxuICAgIHZhciAkY2VkaXRvciA9ICQoJy5EYXNoYm9hcmRQaG90b3MtZWRpdFBob3RvJywgZm9ybSksXHJcbiAgICAgICAgcG9zaXRpb25JZCA9IHBhcnNlSW50KGZvcm0uY2xvc2VzdCgnZm9ybScpLmZpbmQoJ1tuYW1lPXBvc2l0aW9uSURdJykudmFsKCkpIHx8IDA7XHJcbiAgICBlZGl0b3IgPSBuZXcgRWRpdG9yKHtcclxuICAgICAgICBjb250YWluZXI6ICRjZWRpdG9yLFxyXG4gICAgICAgIHBvc2l0aW9uSWQ6IHBvc2l0aW9uSWQsXHJcbiAgICAgICAgc2l6ZUxpbWl0OiAkY2VkaXRvci5kYXRhKCdzaXplLWxpbWl0JyksXHJcbiAgICAgICAgZ2FsbGVyeTogbmV3IEdhbGxlcnkoeyBjb250YWluZXI6IGZvcm0gfSksXHJcbiAgICAgICAgdXBsb2FkZXI6IG5ldyBVcGxvYWRlcih7IGNvbnRhaW5lcjogJCgnLkZpbGVVcGxvYWRlcicsIGZvcm0pLCBwb3NpdGlvbklkOiBwb3NpdGlvbklkIH0pXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZXQgcHJpbWFyeSBwaG90byB0byBiZSBlZGl0ZWRcclxuICAgIGVkaXRTZWxlY3RlZFBob3RvKGZvcm0pO1xyXG59XHJcblxyXG4vKipcclxuICAgIFNvcnRhYmxlIENvbXBvbmVudCBDbGFzc1xyXG4qKi9cclxuZnVuY3Rpb24gU29ydGFibGUoc2V0dGluZ3MpIHtcclxuXHJcbiAgICBzZXR0aW5ncyA9IHNldHRpbmdzIHx8IHt9O1xyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJChzZXR0aW5ncy5jb250YWluZXIgfHwgJ2JvZHknKTtcclxuXHJcbiAgICAvLyBQcmVwYXJlIHNvcnRhYmxlIHNjcmlwdFxyXG4gICAgdGhpcy5zb3J0YWJsZSA9ICQoXCIucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IG9sXCIsIHRoaXMuJGNvbnRhaW5lcikuc29ydGFibGUoe1xyXG4gICAgICAgIHBsYWNlaG9sZGVyOiBcInVpLXN0YXRlLWhpZ2hsaWdodFwiLFxyXG4gICAgICAgIHVwZGF0ZTogdGhpcy5vblVwZGF0ZVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBDb250ZXh0ICd0aGlzJyBpcyB0aGUganF1ZXJ5LnNvcnRhYmxlIG9uIHRoaXMgZXZlbnQgaGFuZGxlclxyXG4qKi9cclxuU29ydGFibGUucHJvdG90eXBlLm9uVXBkYXRlID0gZnVuY3Rpb24gb25VcGRhdGUoKSB7XHJcbiAgICAvLyBHZXQgcGhvdG8gb3JkZXIsIGEgY29tbWEgc2VwYXJhdGVkIHZhbHVlIG9mIGl0ZW1zIElEc1xyXG4gICAgdmFyIG9yZGVyID0gJCh0aGlzKS5zb3J0YWJsZShcInRvQXJyYXlcIikudG9TdHJpbmcoKTtcclxuICAgIC8vIFNldCBvcmRlciBpbiB0aGUgZm9ybSBlbGVtZW50LCB0byBiZSBzZW50IGxhdGVyIHdpdGggdGhlIGZvcm1cclxuICAgICQodGhpcykuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpXHJcbiAgICAgICAgLmZpbmQoJ1tuYW1lPWdhbGxlcnktb3JkZXJdJylcclxuICAgICAgICAudmFsKG9yZGVyKVxyXG4gICAgLy8gV2l0aCBpbnN0YW50IHNhdmluZywgbm8gbW9yZSBub3RpZnkgY2hhbmdlIGZvciBDaGFuZ2VzTm90aWZpZXIsIHNvIGNvbW1lbnRpbmc6XHJcbiAgICAvLy5jaGFuZ2UoKVxyXG4gICAgICAgIDtcclxuXHJcbiAgICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gICAgc2F2ZSh7XHJcbiAgICAgICAgJ2dhbGxlcnktb3JkZXInOiBvcmRlcixcclxuICAgICAgICBhY3Rpb246ICdvcmRlcicsXHJcbiAgICAgICAgcmVzdWx0OiAnanNvbidcclxuICAgIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBHYWxsZXJ5IENsYXNzXHJcbioqL1xyXG5mdW5jdGlvbiBHYWxsZXJ5KHNldHRpbmdzKSB7XHJcblxyXG4gICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCB7fTtcclxuXHJcbiAgICB0aGlzLiRjb250YWluZXIgPSAkKHNldHRpbmdzLmNvbnRhaW5lciB8fCAnLkRhc2hib2FyZFBob3RvcycpO1xyXG4gICAgdGhpcy4kZ2FsbGVyeSA9ICQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5JywgdGhpcy4kY29udGFpbmVyKTtcclxuICAgIHRoaXMuJGdhbGxlcnlMaXN0ID0gJCgnb2wnLCB0aGlzLiRnYWxsZXJ5KTtcclxuICAgIHRoaXMudHBsSW1nID0gJzxsaSBpZD1cIlVzZXJQaG90by1AQDBcIj48YSBocmVmPVwiI1wiPjxpbWcgYWx0PVwiVXBsb2FkZWQgcGhvdG9cIiBzcmM9XCJAQDFcIi8+PC9hPjxhIGNsYXNzPVwiZWRpdFwiIGhyZWY9XCIjXCI+RWRpdDwvYT48L2xpPic7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgICBBcHBlbmQgYSBwaG90byBlbGVtZW50IHRvIHRoZSBnYWxsZXJ5IGNvbGxlY3Rpb24uXHJcbiAgICAqKi9cclxuICAgIHRoaXMuYXBwZW5kUGhvdG8gPSBmdW5jdGlvbiBhcHBlbmRQaG90byhmaWxlTmFtZSwgcGhvdG9JRCkge1xyXG5cclxuICAgICAgICB2YXIgbmV3SW1nID0gJCh0aGlzLnRwbEltZy5yZXBsYWNlKC9AQDAvZywgcGhvdG9JRCkucmVwbGFjZSgvQEAxL2csIGZpbGVOYW1lKSk7XHJcbiAgICAgICAgLy8gSWYgaXMgdGhlcmUgaXMgbm8gcGhvdG9zIHN0aWxsLCB0aGUgZmlyc3Qgd2lsbCBiZSB0aGUgcHJpbWFyeSBieSBkZWZhdWx0XHJcbiAgICAgICAgaWYgKHRoaXMuJGdhbGxlcnlMaXN0LmNoaWxkcmVuKCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIG5ld0ltZy5hZGRDbGFzcygnaXMtcHJpbWFyeS1waG90bycpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy4kZ2FsbGVyeUxpc3RcclxuICAgICAgICAuYXBwZW5kKG5ld0ltZylcclxuICAgICAgICAvLyBzY3JvbGwgdGhlIGdhbGxlcnkgdG8gc2VlIHRoZSBuZXcgZWxlbWVudDsgdXNpbmcgJy0yJyB0byBhdm9pZCBzb21lIGJyb3dzZXJzIGF1dG9tYXRpYyBzY3JvbGwuXHJcbiAgICAgICAgLmFuaW1hdGUoeyBzY3JvbGxUb3A6IHRoaXMuJGdhbGxlcnlMaXN0WzBdLnNjcm9sbEhlaWdodCAtIHRoaXMuJGdhbGxlcnlMaXN0LmhlaWdodCgpIC0gMiB9LCAxNDAwKVxyXG4gICAgICAgIC5maW5kKCdsaTpsYXN0LWNoaWxkJylcclxuICAgICAgICAuZWZmZWN0KFwiaGlnaGxpZ2h0XCIsIHt9LCAxNjAwKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ld0ltZztcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5yZWxvYWRQaG90byA9IGZ1bmN0aW9uIHJlbG9hZFBob3RvKGZpbGVVUkksIHBob3RvSUQpIHtcclxuXHJcbiAgICAgICAgLy8gRmluZCBpdGVtIGJ5IElEIGFuZCBsb2FkIHdpdGggbmV3IFVSSVxyXG4gICAgICAgIHRoaXMuJGdhbGxlcnlMaXN0LmZpbmQoJyNVc2VyUGhvdG8tJyArIHBob3RvSUQpXHJcbiAgICAgICAgLmZpbmQoJ2ltZycpXHJcbiAgICAgICAgLmF0dHIoJ3NyYycsIGZpbGVVUkkgKyAnP3Y9JyArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkpO1xyXG4gICAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAgICBVcGxvYWRlciBDbGFzc1xyXG4qKi9cclxuZnVuY3Rpb24gVXBsb2FkZXIoc2V0dGluZ3MpIHtcclxuXHJcbiAgICBzZXR0aW5ncyA9IHNldHRpbmdzIHx8IHt9O1xyXG5cclxuICAgIC8vIGYuZS46IC5GaWxlVXBsb2FkZXJcclxuICAgIHRoaXMuJGNvbnRhaW5lciA9ICQoc2V0dGluZ3MuY29udGFpbmVyIHx8ICdodG1sJyk7XHJcbiAgICB0aGlzLmdhbGxlcnkgPSBzZXR0aW5ncy5nYWxsZXJ5IHx8IG5ldyBHYWxsZXJ5KHRoaXMuJGNvbnRhaW5lcik7XHJcbiAgICB0aGlzLnBvc2l0aW9uSWQgPSBzZXR0aW5ncy5wb3NpdGlvbklkIHx8IDA7XHJcbiAgICB0aGlzLmNvbXBvbmVudENsYXNzID0gc2V0dGluZ3MuY29tcG9uZW50Q2xhc3MgfHwgJ0ZpbGVVcGxvYWRlcic7XHJcbiAgICB0aGlzLnNlY29uZGFyeUNsYXNzID0gc2V0dGluZ3Muc2Vjb25kYXJ5Q2xhc3MgfHwgJ0ZpbGVVcGxvYWRlci0tYXNTZWNvbmRhcnknO1xyXG5cclxuICAgIHZhciB0aGlzVXBsb2FkZXIgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMucXF1cGxvYWRlciA9IG5ldyBxcS5GaWxlVXBsb2FkZXIoe1xyXG4gICAgICAgIGVsZW1lbnQ6ICQoJy5GaWxlVXBsb2FkZXItdXBsb2FkZXInLCB0aGlzLiRjb250YWluZXIpLmdldCgwKSxcclxuICAgICAgICAvLyBwYXRoIHRvIHNlcnZlci1zaWRlIHVwbG9hZCBzY3JpcHRcclxuICAgICAgICBhY3Rpb246IExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC9Zb3VyV29yay9VcGxvYWRQaG90by8/UG9zaXRpb25JRD0nICsgKHRoaXMucG9zaXRpb25JZCksXHJcbiAgICAgICAgYWxsb3dlZEV4dGVuc2lvbnM6IFsnanBnJywgJ2pwZWcnLCAncG5nJywgJ2dpZiddLFxyXG4gICAgICAgIG9uQ29tcGxldGU6IGZ1bmN0aW9uIChpZCwgZmlsZU5hbWUsIHJlc3BvbnNlSlNPTikge1xyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2VKU09OLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdJbWdJdGVtID0gdGhpc1VwbG9hZGVyLmdhbGxlcnkuYXBwZW5kUGhvdG8ocmVzcG9uc2VKU09OLmZpbGVVUkksIHJlc3BvbnNlSlNPTi5waG90b0lEKTtcclxuICAgICAgICAgICAgICAgIC8vIFNob3cgaW4gZWRpdCBwYW5lbFxyXG4gICAgICAgICAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2VBbGwodGhpc1VwbG9hZGVyLmdhbGxlcnkuJGNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgICAgICBlZGl0U2VsZWN0ZWRQaG90byh0aGlzVXBsb2FkZXIuZ2FsbGVyeS4kY29udGFpbmVyLCBuZXdJbWdJdGVtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbWVzc2FnZXM6IHtcclxuICAgICAgICAgICAgdHlwZUVycm9yOiBcIntmaWxlfSBoYXMgaW52YWxpZCBleHRlbnNpb24uIE9ubHkge2V4dGVuc2lvbnN9IGFyZSBhbGxvd2VkLlwiLFxyXG4gICAgICAgICAgICBzaXplRXJyb3I6IFwie2ZpbGV9IGlzIHRvbyBsYXJnZSwgbWF4aW11bSBmaWxlIHNpemUgaXMge3NpemVMaW1pdH0uXCIsXHJcbiAgICAgICAgICAgIG1pblNpemVFcnJvcjogXCJ7ZmlsZX0gaXMgdG9vIHNtYWxsLCBtaW5pbXVtIGZpbGUgc2l6ZSBpcyB7bWluU2l6ZUxpbWl0fS5cIixcclxuICAgICAgICAgICAgZW1wdHlFcnJvcjogXCJ7ZmlsZX0gaXMgZW1wdHksIHBsZWFzZSBzZWxlY3QgZmlsZXMgYWdhaW4gd2l0aG91dCBpdC5cIixcclxuICAgICAgICAgICAgb25MZWF2ZTogXCJUaGUgZmlsZXMgYXJlIGJlaW5nIHVwbG9hZGVkLCBpZiB5b3UgbGVhdmUgbm93IHRoZSB1cGxvYWQgd2lsbCBiZSBjYW5jZWxsZWQuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNpemVMaW1pdDogdGhpcy5zaXplTGltaXQgfHwgJ3VuZGVmaW5lZCcsXHJcbiAgICAgICAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwicXEtdXBsb2FkZXJcIj4nICtcclxuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicXEtdXBsb2FkLWRyb3AtYXJlYVwiPjxzcGFuPkRyb3AgYSBmaWxlIGhlcmUgdG8gdXBsb2FkPC9zcGFuPjwvZGl2PicgK1xyXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJxcS11cGxvYWQtYnV0dG9uXCI+VXBsb2FkIGEgcGhvdG88L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJxcS11cGxvYWQtbGlzdFwiPjwvdWw+JyArXHJcbiAgICAgICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblVwbG9hZGVyLnByb3RvdHlwZS5zZXRBc01haW4gPSBmdW5jdGlvbiBzZXRBc01haW4oKSB7XHJcbiAgICB0aGlzLiRjb250YWluZXIucmVtb3ZlQ2xhc3ModGhpcy5zZWNvbmRhcnlDbGFzcyk7XHJcbn07XHJcblxyXG5VcGxvYWRlci5wcm90b3R5cGUuc2V0QXNTZWNvbmRhcnkgPSBmdW5jdGlvbiBzZXRBc1NlY29uZGFyeSgpIHtcclxuICAgIHRoaXMuJGNvbnRhaW5lci5hZGRDbGFzcyh0aGlzLnNlY29uZGFyeUNsYXNzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gICAgRWRpdG9yIENsYXNzXHJcbioqL1xyXG52YXIgcXEgPSByZXF1aXJlKCdmaWxldXBsb2FkZXInKTtcclxucmVxdWlyZSgnamNyb3AnKTtcclxuZnVuY3Rpb24gRWRpdG9yKHNldHRpbmdzKSB7XHJcblxyXG4gICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCB7fTtcclxuXHJcbiAgICB2YXIgJGggPSAkKCdodG1sJyk7XHJcbiAgICB0aGlzLnBvc2l0aW9uSWQgPSBzZXR0aW5ncy5wb3NpdGlvbklkIHx8ICRoLmRhdGEoJ3Bvc2l0aW9uLWlkJyk7XHJcbiAgICB0aGlzLnNpemVMaW1pdCA9IHNldHRpbmdzLnNpemVMaW1pdCB8fCAkaC5kYXRhKCdzaXplLWxpbWl0Jyk7XHJcblxyXG4gICAgLy8gZi5lLjogLkRhc2hib2FyZFBob3Rvcy1lZGl0UGhvdG9cclxuICAgIHRoaXMuJGNvbnRhaW5lciA9ICQoc2V0dGluZ3MuY29udGFpbmVyIHx8ICdodG1sJyk7XHJcbiAgICB0aGlzLmdhbGxlcnkgPSBzZXR0aW5ncy5nYWxsZXJ5IHx8IG5ldyBHYWxsZXJ5KHsgY29udGFpbmVyOiB0aGlzLiRjb250YWluZXIgfSk7XHJcbiAgICB0aGlzLnVwbG9hZGVyID0gc2V0dGluZ3MudXBsb2FkZXIgfHwgbmV3IFVwbG9hZGVyKHsgY29udGFpbmU6IHRoaXMuJGNvbnRhaW5lciwgcG9zaXRpb25JZDogdGhpcy5wb3NpdGlvbklkIH0pO1xyXG5cclxuICAgIC8vIEluaXRpYWxpemluZzpcclxuICAgIHRoaXMuaW5pdENyb3BGb3JtKCk7XHJcbn1cclxuXHJcbi8vIFNpbXBsZSBldmVudCBoYW5kbGVyLCBjYWxsZWQgZnJvbSBvbkNoYW5nZSBhbmQgb25TZWxlY3RcclxuLy8gZXZlbnQgaGFuZGxlcnMsIGFzIHBlciB0aGUgSmNyb3AgaW52b2NhdGlvbiBhYm92ZVxyXG5FZGl0b3IucHJvdG90eXBlLnNob3dDb29yZHMgPSBmdW5jdGlvbiBzaG93Q29vcmRzKGMpIHtcclxuICAgICQoJ1tuYW1lPWNyb3AteDFdJywgdGhpcy4kY29udGFpbmVyKS52YWwoYy54KTtcclxuICAgICQoJ1tuYW1lPWNyb3AteTFdJywgdGhpcy4kY29udGFpbmVyKS52YWwoYy55KTtcclxuICAgICQoJ1tuYW1lPWNyb3AteDJdJywgdGhpcy4kY29udGFpbmVyKS52YWwoYy54Mik7XHJcbiAgICAkKCdbbmFtZT1jcm9wLXkyXScsIHRoaXMuJGNvbnRhaW5lcikudmFsKGMueTIpO1xyXG4gICAgJCgnW25hbWU9Y3JvcC13XScsIHRoaXMuJGNvbnRhaW5lcikudmFsKGMudyk7XHJcbiAgICAkKCdbbmFtZT1jcm9wLWhdJywgdGhpcy4kY29udGFpbmVyKS52YWwoYy5oKTtcclxufTtcclxuXHJcbkVkaXRvci5wcm90b3R5cGUuY2xlYXJDb29yZHMgPSBmdW5jdGlvbiBjbGVhckNvb3JkcygpIHtcclxuICAgICQoJ2lucHV0W25hbWU9XmNyb3AtXScsIHRoaXMuJGNvbnRhaW5lcikudmFsKCcnKTtcclxufTtcclxuXHJcbkVkaXRvci5wcm90b3R5cGUuaW5pdENyb3BGb3JtID0gZnVuY3Rpb24gaW5pdENyb3BGb3JtKCkge1xyXG5cclxuICAgIC8vIFNldHVwIGNyb3BwaW5nIFwiZm9ybVwiXHJcbiAgICB2YXIgdGhpc0VkaXRvciA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy4kY29udGFpbmVyLm9uKCdjbGljaycsICcuRGFzaGJvYXJkUGhvdG9zLWVkaXRQaG90by1zYXZlJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogTGNVcmwuTGFuZ1BhdGggKyAnJGRhc2hib2FyZC9Zb3VyV29yay9VcGxvYWRQaG90by8nLFxyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGRhdGE6IHRoaXNFZGl0b3IuJGNvbnRhaW5lci5maW5kKCc6aW5wdXQnKS5zZXJpYWxpemUoKSArICcmY3JvcC1waG90bz1UcnVlJyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5Db2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWNiLmRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkYXRhLnVwZGF0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQaG90byBjcm9wcGVkLCByZXNpemVkXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc0VkaXRvci5nYWxsZXJ5LnJlbG9hZFBob3RvKGRhdGEuZmlsZVVSSSwgZGF0YS5waG90b0lEKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZWZyZXNoIGVkaXQgcGFuZWxcclxuICAgICAgICAgICAgICAgICAgICBlZGl0U2VsZWN0ZWRQaG90byh0aGlzRWRpdG9yLmdhbGxlcnkuJGNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQaG90byB1cGxvYWRlZFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdJbWdJdGVtID0gdGhpc0VkaXRvci5nYWxsZXJ5LmFwcGVuZFBob3RvKGRhdGEuZmlsZVVSSSwgZGF0YS5waG90b0lEKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTaG93IGluIGVkaXQgcGFuZWxcclxuICAgICAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZUFsbCh0aGlzRWRpdG9yLmdhbGxlcnkuJGNvbnRhaW5lcik7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdFNlbGVjdGVkUGhvdG8odGhpc0VkaXRvci5nYWxsZXJ5LiRjb250YWluZXIsIG5ld0ltZ0l0ZW0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgJCgnI2Nyb3AtcGhvdG8nKS5zbGlkZVVwKCdmYXN0Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVE9ETyBDbG9zZSBwb3B1cCAjNTM1XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCBlcikge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoJ1NvcnJ5LCB0aGVyZSB3YXMgYW4gZXJyb3Igc2V0dGluZy11cCB5b3VyIHBob3RvLiAnICsgKGVyIHx8ICcnKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuRWRpdG9yLnByb3RvdHlwZS5zZXR1cENyb3BQaG90byA9IGZ1bmN0aW9uIHNldHVwQ3JvcFBob3RvKCkge1xyXG5cclxuICAgIGlmICh0aGlzLmpjcm9wQXBpKVxyXG4gICAgICAgIHRoaXMuamNyb3BBcGkuZGVzdHJveSgpO1xyXG5cclxuICAgIHZhciB0aGlzRWRpdG9yID0gdGhpcztcclxuXHJcbiAgICAvLyBTZXR1cCBpbWcgY3JvcHBpbmdcclxuICAgIHZhciAkaW1nID0gJCgnLnBvc2l0aW9ucGhvdG9zLWVkaXQtcGhvdG8gPiBpbWcnLCB0aGlzLiRjb250YWluZXIpO1xyXG4gICAgJGltZy5KY3JvcCh7XHJcbiAgICAgICAgb25DaGFuZ2U6IHRoaXMuc2hvd0Nvb3Jkcy5iaW5kKHRoaXMpLFxyXG4gICAgICAgIG9uU2VsZWN0OiB0aGlzLnNob3dDb29yZHMuYmluZCh0aGlzKSxcclxuICAgICAgICBvblJlbGVhc2U6IHRoaXMuY2xlYXJDb29yZHMuYmluZCh0aGlzKSxcclxuICAgICAgICBhc3BlY3RSYXRpbzogJGltZy5kYXRhKCd0YXJnZXQtd2lkdGgnKSAvICRpbWcuZGF0YSgndGFyZ2V0LWhlaWdodCcpXHJcbiAgICB9LCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHRoaXNFZGl0b3IuamNyb3BBcGkgPSB0aGlzO1xyXG4gICAgICAgIC8vIEluaXRpYWwgc2VsZWN0aW9uIHRvIHNob3cgdXNlciB0aGF0IGNhbiBjaG9vc2UgYW4gYXJlYVxyXG4gICAgICAgIHRoaXNFZGl0b3IuamNyb3BBcGkuc2V0U2VsZWN0KFswLCAwLCAkaW1nLndpZHRoKCksICRpbWcuaGVpZ2h0KCldKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiAkaW1nO1xyXG59O1xyXG4iLCIvKiogQXZhaWxhYmlsaXR5OiBXZWVrbHkgU2NoZWR1bGUgc2VjdGlvbiBzZXR1cFxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyID0gcmVxdWlyZSgnTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXInKTtcclxudmFyIGJhdGNoRXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnTEMvYmF0Y2hFdmVudEhhbmRsZXInKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIG1vbnRobHlMaXN0ID0gYXZhaWxhYmlsaXR5Q2FsZW5kYXIuTW9udGhseS5lbmFibGVBbGwoKTtcclxuXHJcbiAgICAkLmVhY2gobW9udGhseUxpc3QsIGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgdmFyIG1vbnRobHkgPSB0aGlzO1xyXG5cclxuICAgICAgICAvLyBTZXR1cGluZyB0aGUgY2FsZW5kYXIgZGF0YSBmaWVsZFxyXG4gICAgICAgIHZhciBmb3JtID0gbW9udGhseS4kZWwuY2xvc2VzdCgnZm9ybS5hamF4LGZpZWxkc2V0LmFqYXgnKTtcclxuICAgICAgICB2YXIgZmllbGQgPSBmb3JtLmZpbmQoJ1tuYW1lPW1vbnRobHldJyk7XHJcbiAgICAgICAgaWYgKGZpZWxkLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgZmllbGQgPSAkKCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJtb250aGx5XCIgLz4nKS5pbnNlcnRBZnRlcihtb250aGx5LiRlbCk7XHJcblxyXG4gICAgICAgIC8vIFNhdmUgd2hlbiB0aGUgZm9ybSBpcyB0byBiZSBzdWJtaXR0ZWRcclxuICAgICAgICBmb3JtLm9uKCdwcmVzdWJtaXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZpZWxkLnZhbChKU09OLnN0cmluZ2lmeShtb250aGx5LmdldFVwZGF0ZWREYXRhKCkpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVXBkYXRpbmcgZmllbGQgb24gY2FsZW5kYXIgY2hhbmdlcyAodXNpbmcgYmF0Y2ggdG8gYXZvaWQgaHVydCBwZXJmb3JtYW5jZSlcclxuICAgICAgICAvLyBhbmQgcmFpc2UgY2hhbmdlIGV2ZW50ICh0aGlzIGZpeGVzIHRoZSBzdXBwb3J0IGZvciBjaGFuZ2VzTm90aWZpY2F0aW9uXHJcbiAgICAgICAgLy8gYW5kIGluc3RhbnQtc2F2aW5nKS5cclxuICAgICAgICBtb250aGx5LmV2ZW50cy5vbignZGF0YUNoYW5nZWQnLCBiYXRjaEV2ZW50SGFuZGxlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZpZWxkXHJcbiAgICAgICAgICAgIC52YWwoSlNPTi5zdHJpbmdpZnkobW9udGhseS5nZXRVcGRhdGVkRGF0YSgpKSlcclxuICAgICAgICAgICAgLmNoYW5nZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH0pO1xyXG59OyIsIi8qKlxyXG5wYXltZW50OiB3aXRoIHRoZSBwcm9wZXIgaHRtbCBhbmQgZm9ybVxyXG5yZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuZm9ybWF0dGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gb25QYXltZW50QWNjb3VudChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICB2YXIgZmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgZm9ybWF0dGVycyBvbiBwYWdlLXJlYWR5Li5cclxuICAgIGluaXRGb3JtYXR0ZXJzKCRjKTtcclxuXHJcbiAgICBjaGFuZ2VQYXltZW50TWV0aG9kKCRjKTtcclxuXHJcbiAgfTtcclxuICAkKGZpbml0KTtcclxuICAvLyBhbmQgYW55IGFqYXgtcG9zdCBvZiB0aGUgZm9ybSB0aGF0IHJldHVybnMgbmV3IGh0bWw6XHJcbiAgJGMub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0uYWpheCcsIGZpbml0KTtcclxufTtcclxuXHJcbi8qKiBJbml0aWFsaXplIHRoZSBmaWVsZCBmb3JtYXR0ZXJzIHJlcXVpcmVkIGJ5IHRoZSBwYXltZW50LWFjY291bnQtZm9ybSwgYmFzZWRcclxuICBvbiB0aGUgZmllbGRzIG5hbWVzLlxyXG4qKi9cclxuZnVuY3Rpb24gaW5pdEZvcm1hdHRlcnMoJGNvbnRhaW5lcikge1xyXG4gICRjb250YWluZXIuZmluZCgnW25hbWU9XCJiaXJ0aGRhdGVcIl0nKS5mb3JtYXR0ZXIoe1xyXG4gICAgJ3BhdHRlcm4nOiAne3s5OX19L3t7OTl9fS97ezk5OTl9fScsXHJcbiAgICAncGVyc2lzdGVudCc6IGZhbHNlXHJcbiAgfSk7XHJcbiAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cInNzblwiXScpLmZvcm1hdHRlcih7XHJcbiAgICAncGF0dGVybic6ICd7ezk5OX19LXt7OTl9fS17ezk5OTl9fScsXHJcbiAgICAncGVyc2lzdGVudCc6IGZhbHNlXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoYW5nZVBheW1lbnRNZXRob2QoJGNvbnRhaW5lcikge1xyXG5cclxuICB2YXIgJGJhbmsgPSAkY29udGFpbmVyLmZpbmQoJy5EYXNoYm9hcmRQYXltZW50QWNjb3VudC1iYW5rJyksXHJcbiAgICAkZWxzID0gJGNvbnRhaW5lci5maW5kKCcuRGFzaGJvYXJkUGF5bWVudEFjY291bnQtY2hhbmdlTWV0aG9kJylcclxuICAgIC5hZGQoJGJhbmspO1xyXG5cclxuICAkY29udGFpbmVyLmZpbmQoJy5BY3Rpb25zLS1jaGFuZ2VQYXltZW50TWV0aG9kJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgJGVscy50b2dnbGVDbGFzcygnaXMtdmVubW9BY2NvdW50IGlzLWJhbmtBY2NvdW50Jyk7XHJcblxyXG4gICAgaWYgKCRiYW5rLmhhc0NsYXNzKCdpcy12ZW5tb0FjY291bnQnKSkge1xyXG4gICAgICAvLyBSZW1vdmUgYW5kIHNhdmUgbnVtYmVyc1xyXG4gICAgICAkYmFuay5maW5kKCdpbnB1dCcpLnZhbChmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgICQodGhpcykuZGF0YSgncHJldi12YWwnLCB2KTtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gUmVzdG9yZSBudW1iZXJzXHJcbiAgICAgICRiYW5rLmZpbmQoJ2lucHV0JykudmFsKGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgcmV0dXJuICQodGhpcykuZGF0YSgncHJldi12YWwnKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG59IiwiLyoqIFByaWNpbmcgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgVGltZVNwYW4gPSByZXF1aXJlKCdMQy9UaW1lU3BhbicpO1xyXG5yZXF1aXJlKCdMQy9UaW1lU3BhbkV4dHJhJykucGx1Z0luKFRpbWVTcGFuKTtcclxudmFyIHVwZGF0ZVRvb2x0aXBzID0gcmVxdWlyZSgnTEMvdG9vbHRpcHMnKS51cGRhdGVUb29sdGlwcztcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKHByaWNpbmdTZWxlY3Rvcikge1xyXG4gIHByaWNpbmdTZWxlY3RvciA9IHByaWNpbmdTZWxlY3RvciB8fCAnLkRhc2hib2FyZFByaWNpbmcnO1xyXG4gIHZhciAkcHJpY2luZyA9ICQocHJpY2luZ1NlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkcHJpY2luZy5zaWJsaW5ncygpXHJcbiAgICAgIC5hZGQoJHByaWNpbmcuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAuYWRkKCRwcmljaW5nLmNsb3Nlc3QoJy5EYXNoYm9hcmRZb3VyV29yaycpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwocHJpY2luZ1NlbGVjdG9yKTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG5cclxuICAgIHNldHVwTm9QcmljZVJhdGVVcGRhdGVzKCRlZGl0b3IpO1xyXG4gICAgc2V0dXBQcm92aWRlclBhY2thZ2VTbGlkZXJzKCRlZGl0b3IpO1xyXG4gICAgdXBkYXRlVG9vbHRpcHMoKTtcclxuICAgIHNldHVwU2hvd01vcmVBdHRyaWJ1dGVzTGluaygkZWRpdG9yKTtcclxuXHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKiBIYW5kbGVyIGZvciBjaGFuZ2UgZXZlbnQgb24gJ25vdCB0byBzdGF0ZSBwcmljZSByYXRlJywgdXBkYXRpbmcgcmVsYXRlZCBwcmljZSByYXRlIGZpZWxkcy5cclxuICBJdHMgc2V0dXBlZCBwZXIgZWRpdG9yIGluc3RhbmNlLCBub3QgYXMgYW4gZXZlbnQgZGVsZWdhdGUuXHJcbiovXHJcbmZ1bmN0aW9uIHNldHVwTm9QcmljZVJhdGVVcGRhdGVzKCRlZGl0b3IpIHtcclxuICB2YXIgXHJcbiAgICBwciA9ICRlZGl0b3IuZmluZCgnW25hbWU9cHJpY2UtcmF0ZV0sW25hbWU9cHJpY2UtcmF0ZS11bml0XScpLFxyXG4gICAgbnByID0gJGVkaXRvci5maW5kKCdbbmFtZT1uby1wcmljZS1yYXRlXScpO1xyXG4gIG5wci5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgcHIucHJvcCgnZGlzYWJsZWQnLCBucHIucHJvcCgnY2hlY2tlZCcpKTtcclxuICB9KTtcclxuICAvLyBJbml0aWFsIHN0YXRlOlxyXG4gIG5wci5jaGFuZ2UoKTtcclxufVxyXG5cclxuLyoqIFNldHVwIHRoZSBVSSBTbGlkZXJzIG9uIHRoZSBlZGl0b3IuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cFByb3ZpZGVyUGFja2FnZVNsaWRlcnMoJGVkaXRvcikge1xyXG5cclxuICAvKiBIb3VzZWVrZWVwZXIgcHJpY2luZyAqL1xyXG4gIGZ1bmN0aW9uIHVwZGF0ZUF2ZXJhZ2UoJGMsIG1pbnV0ZXMpIHtcclxuICAgICRjLmZpbmQoJ1tuYW1lPXByb3ZpZGVyLWF2ZXJhZ2UtdGltZV0nKS52YWwobWludXRlcyk7XHJcbiAgICBtaW51dGVzID0gcGFyc2VJbnQobWludXRlcyk7XHJcbiAgICAkYy5maW5kKCcucHJldmlldyAudGltZScpLnRleHQoVGltZVNwYW4uZnJvbU1pbnV0ZXMobWludXRlcykudG9TbWFydFN0cmluZygpKTtcclxuICB9XHJcblxyXG4gICRlZGl0b3IuZmluZChcIi5wcm92aWRlci1hdmVyYWdlLXRpbWUtc2xpZGVyXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICRjID0gJCh0aGlzKS5jbG9zZXN0KCdbZGF0YS1zbGlkZXItdmFsdWVdJyk7XHJcbiAgICB2YXIgYXZlcmFnZSA9ICRjLmRhdGEoJ3NsaWRlci12YWx1ZScpLFxyXG4gICAgICBzdGVwID0gJGMuZGF0YSgnc2xpZGVyLXN0ZXAnKSB8fCAxO1xyXG4gICAgaWYgKCFhdmVyYWdlKSByZXR1cm47XHJcbiAgICB2YXIgc2V0dXAgPSB7XHJcbiAgICAgIHJhbmdlOiBcIm1pblwiLFxyXG4gICAgICB2YWx1ZTogYXZlcmFnZSxcclxuICAgICAgbWluOiBhdmVyYWdlIC0gMyAqIHN0ZXAsXHJcbiAgICAgIG1heDogYXZlcmFnZSArIDMgKiBzdGVwLFxyXG4gICAgICBzdGVwOiBzdGVwLFxyXG4gICAgICBzbGlkZTogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgIHVwZGF0ZUF2ZXJhZ2UoJGMsIHVpLnZhbHVlKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIHZhciBzbGlkZXIgPSAkKHRoaXMpLnNsaWRlcihzZXR1cCk7XHJcblxyXG4gICAgJGMuZmluZCgnLnByb3ZpZGVyLWF2ZXJhZ2UtdGltZScpLm9uKCdjbGljaycsICdsYWJlbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgaWYgKCR0Lmhhc0NsYXNzKCdiZWxvdy1hdmVyYWdlLWxhYmVsJykpXHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBzZXR1cC5taW4pO1xyXG4gICAgICBlbHNlIGlmICgkdC5oYXNDbGFzcygnYXZlcmFnZS1sYWJlbCcpKVxyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgc2V0dXAudmFsdWUpO1xyXG4gICAgICBlbHNlIGlmICgkdC5oYXNDbGFzcygnYWJvdmUtYXZlcmFnZS1sYWJlbCcpKVxyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgc2V0dXAubWF4KTtcclxuICAgICAgdXBkYXRlQXZlcmFnZSgkYywgc2xpZGVyLnNsaWRlcigndmFsdWUnKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZXR1cCB0aGUgaW5wdXQgZmllbGQsIGhpZGRlbiBhbmQgd2l0aCBpbml0aWFsIHZhbHVlIHN5bmNocm9uaXplZCB3aXRoIHNsaWRlclxyXG4gICAgdmFyIGZpZWxkID0gJGMuZmluZCgnW25hbWU9cHJvdmlkZXItYXZlcmFnZS10aW1lXScpO1xyXG4gICAgZmllbGQuaGlkZSgpO1xyXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGZpZWxkLnZhbCgpIHx8IGF2ZXJhZ2U7XHJcbiAgICB1cGRhdGVBdmVyYWdlKCRjLCBjdXJyZW50VmFsdWUpO1xyXG4gICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBjdXJyZW50VmFsdWUpO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKiogVGhlIGluLWVkaXRvciBsaW5rICNzaG93LW1vcmUtYXR0cmlidXRlcyBtdXN0IHNob3cvaGlkZSB0aGUgY29udGFpbmVyIG9mXHJcbiAgZXh0cmEgYXR0cmlidXRlcyBmb3IgdGhlIHBhY2thZ2UvcHJpY2luZy1pdGVtLiBUaGlzIHNldHVwcyB0aGUgcmVxdWlyZWQgaGFuZGxlci5cclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwU2hvd01vcmVBdHRyaWJ1dGVzTGluaygkZWRpdG9yKSB7XHJcbiAgLy8gSGFuZGxlciBmb3IgJ3Nob3ctbW9yZS1hdHRyaWJ1dGVzJyBidXR0b24gKHVzZWQgb25seSBvbiBlZGl0IGEgcGFja2FnZSlcclxuICAkZWRpdG9yLmZpbmQoJy5zaG93LW1vcmUtYXR0cmlidXRlcycpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgYXR0cyA9ICR0LnNpYmxpbmdzKCcuc2VydmljZXMtbm90LWNoZWNrZWQnKTtcclxuICAgIGlmIChhdHRzLmlzKCc6dmlzaWJsZScpKSB7XHJcbiAgICAgICR0LnRleHQoJHQuZGF0YSgnc2hvdy10ZXh0JykpO1xyXG4gICAgICBhdHRzLnN0b3AoKS5oaWRlKCdmYXN0Jyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAkdC50ZXh0KCR0LmRhdGEoJ2hpZGUtdGV4dCcpKTtcclxuICAgICAgYXR0cy5zdG9wKCkuc2hvdygnZmFzdCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG59IiwiLyoqXHJcbiAgcHJpdmFjeVNldHRpbmdzOiBTZXR1cCBmb3IgdGhlIHNwZWNpZmljIHBhZ2UtZm9ybSBkYXNoYm9hcmQvcHJpdmFjeS9wcml2YWN5c2V0dGluZ3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIFRPRE8gSW1wbGVtZW50IGRlcGVuZGVuY2llcyBjb21taW5nIGZyb20gYXBwLmpzIGluc3RlYWQgb2YgZGlyZWN0IGxpbmtcclxuLy92YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCdzbW9vdGhCb3hCbG9jaycpO1xyXG4vLyBUT0RPIFJlcGxhY2UgZG9tLXJlc3NvdXJjZXMgYnkgaTE4bi5nZXRUZXh0XHJcblxyXG52YXIgcHJpdmFjeSA9IHtcclxuICBhY2NvdW50TGlua3NTZWxlY3RvcjogJy5EYXNoYm9hcmRQcml2YWN5U2V0dGluZ3MtbXlBY2NvdW50IGEnLFxyXG4gIHJlc3NvdXJjZXNTZWxlY3RvcjogJy5EYXNoYm9hcmRQcml2YWN5LWFjY291bnRSZXNzb3VyY2VzJ1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwcml2YWN5O1xyXG5cclxucHJpdmFjeS5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAkYy5vbignY2xpY2snLCAnLmNhbmNlbC1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSgkYyk7XHJcbiAgfSk7XHJcblxyXG4gICRjLm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgJy5hamF4LWJveCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICB9KTtcclxuICBcclxuICAkYy5vbignY2xpY2snLCBwcml2YWN5LmFjY291bnRMaW5rc1NlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIGIsXHJcbiAgICAgIGxyZXMgPSAkYy5maW5kKHByaXZhY3kucmVzc291cmNlc1NlbGVjdG9yKTtcclxuXHJcbiAgICBzd2l0Y2ggKCQodGhpcykuYXR0cignaHJlZicpKSB7XHJcbiAgICAgIGNhc2UgJyNkZWxldGUtbXktYWNjb3VudCc6XHJcbiAgICAgICAgYiA9IHNtb290aEJveEJsb2NrLm9wZW4obHJlcy5jaGlsZHJlbignLmRlbGV0ZS1tZXNzYWdlLWNvbmZpcm0nKS5jbG9uZSgpLCAkYyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJyNkZWFjdGl2YXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5kZWFjdGl2YXRlLW1lc3NhZ2UtY29uZmlybScpLmNsb25lKCksICRjKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnI3JlYWN0aXZhdGUtbXktYWNjb3VudCc6XHJcbiAgICAgICAgYiA9IHNtb290aEJveEJsb2NrLm9wZW4obHJlcy5jaGlsZHJlbignLnJlYWN0aXZhdGUtbWVzc2FnZS1jb25maXJtJykuY2xvbmUoKSwgJGMpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKGIpIHtcclxuICAgICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBiLm9mZnNldCgpLnRvcCB9LCA1MDAsIG51bGwpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxufTsiLCIvKiogU2VydmljZSBBdHRyaWJ1dGVzIFZhbGlkYXRpb246IGltcGxlbWVudHMgdmFsaWRhdGlvbnMgdGhyb3VnaCB0aGUgXHJcbiAgJ2N1c3RvbVZhbGlkYXRpb24nIGFwcHJvYWNoIGZvciAncG9zaXRpb24gc2VydmljZSBhdHRyaWJ1dGVzJy5cclxuICBJdCB2YWxpZGF0ZXMgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBjYXRlZ29yeSwgYWxtb3N0LW9uZSBvciBzZWxlY3Qtb25lIG1vZGVzLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGdldFRleHQgPSByZXF1aXJlKCdMQy9nZXRUZXh0Jyk7XHJcbnZhciB2aCA9IHJlcXVpcmUoJ0xDL3ZhbGlkYXRpb25IZWxwZXInKTtcclxudmFyIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCdMQy9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG4vKiogRW5hYmxlIHZhbGlkYXRpb24gb2YgcmVxdWlyZWQgc2VydmljZSBhdHRyaWJ1dGVzIG9uXHJcbiAgdGhlIGZvcm0ocykgc3BlY2lmaWVkIGJ5IHRoZSBzZWxlY3RvciBvciBwcm92aWRlZFxyXG4qKi9cclxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uIHNldHVwU2VydmljZUF0dHJpYnV0ZXNWYWxpZGF0aW9uKGNvbnRhaW5lclNlbGVjdG9yLCBvcHRpb25zKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcbiAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgIHJlcXVpcmVkU2VsZWN0b3I6ICcuRGFzaGJvYXJkU2VydmljZXMtYXR0cmlidXRlcy1jYXRlZ29yeS5pcy1yZXF1aXJlZCcsXHJcbiAgICBzZWxlY3RPbmVDbGFzczogJ2pzLXZhbGlkYXRpb25TZWxlY3RPbmUnLFxyXG4gICAgZ3JvdXBFcnJvckNsYXNzOiAnaXMtZXJyb3InLFxyXG4gICAgdmFsRXJyb3JUZXh0S2V5OiAncmVxdWlyZWQtYXR0cmlidXRlLWNhdGVnb3J5LWVycm9yJ1xyXG4gIH0sIG9wdGlvbnMpO1xyXG5cclxuICAkYy5lYWNoKGZ1bmN0aW9uIHZhbGlkYXRlU2VydmljZUF0dHJpYnV0ZXMoKSB7XHJcbiAgICB2YXIgZiA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWYuaXMoJ2Zvcm0sZmllbGRzZXQnKSkge1xyXG4gICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdUaGUgZWxlbWVudCB0byBhcHBseSB2YWxpZGF0aW9uIG11c3QgYmUgYSBmb3JtIG9yIGZpZWxkc2V0Jyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nLCB7XHJcbiAgICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHZhbGlkID0gdHJ1ZSwgbGFzdFZhbGlkID0gdHJ1ZTtcclxuICAgICAgICB2YXIgdiA9IHZoLmZpbmRWYWxpZGF0aW9uU3VtbWFyeShmKTtcclxuXHJcbiAgICAgICAgZi5maW5kKG9wdGlvbnMucmVxdWlyZWRTZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgZnMgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGNhdCA9IGZzLmNoaWxkcmVuKCdsZWdlbmQnKS50ZXh0KCk7XHJcbiAgICAgICAgICAvLyBXaGF0IHR5cGUgb2YgdmFsaWRhdGlvbiBhcHBseT9cclxuICAgICAgICAgIGlmIChmcy5pcygnLicgKyBvcHRpb25zLnNlbGVjdE9uZUNsYXNzKSlcclxuICAgICAgICAgIC8vIGlmIHRoZSBjYXQgaXMgYSAndmFsaWRhdGlvbi1zZWxlY3Qtb25lJywgYSAnc2VsZWN0JyBlbGVtZW50IHdpdGggYSAncG9zaXRpdmUnXHJcbiAgICAgICAgICAvLyA6c2VsZWN0ZWQgdmFsdWUgbXVzdCBiZSBjaGVja2VkXHJcbiAgICAgICAgICAgIGxhc3RWYWxpZCA9ICEhKGZzLmZpbmQoJ29wdGlvbjpzZWxlY3RlZCcpLnZhbCgpKTtcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgIC8vIE90aGVyd2lzZSwgbG9vayBmb3IgJ2FsbW9zdCBvbmUnIGNoZWNrZWQgdmFsdWVzOlxyXG4gICAgICAgICAgICBsYXN0VmFsaWQgPSAoZnMuZmluZCgnaW5wdXQ6Y2hlY2tlZCcpLmxlbmd0aCA+IDApO1xyXG5cclxuICAgICAgICAgIGlmICghbGFzdFZhbGlkKSB7XHJcbiAgICAgICAgICAgIHZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGZzLmFkZENsYXNzKG9wdGlvbnMuZ3JvdXBFcnJvckNsYXNzKTtcclxuICAgICAgICAgICAgdmFyIGVyciA9IGdldFRleHQob3B0aW9ucy52YWxFcnJvclRleHRLZXksIGNhdCk7XHJcbiAgICAgICAgICAgIGlmICh2LmZpbmQoJ2xpW3RpdGxlPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoY2F0KSArICdcIl0nKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgdi5jaGlsZHJlbigndWwnKS5hcHBlbmQoJCgnPGxpLz4nKS50ZXh0KGVycikuYXR0cigndGl0bGUnLCBjYXQpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKG9wdGlvbnMuZ3JvdXBFcnJvckNsYXNzKTtcclxuICAgICAgICAgICAgdi5maW5kKCdsaVt0aXRsZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGNhdCkgKyAnXCJdJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh2YWxpZCkge1xyXG4gICAgICAgICAgdmguc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGYpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB2aC5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IoZik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2YWxpZDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogSXQgcHJvdmlkZXMgdGhlIGNvZGUgZm9yIHRoZSBhY3Rpb25zIG9mIHRoZSBWZXJpZmljYXRpb25zIHNlY3Rpb24uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG4vL3ZhciBMY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyk7XHJcbi8vdmFyIHBvcHVwID0gcmVxdWlyZSgnLi4vTEMvcG9wdXAnKTtcclxuXHJcbnZhciBhY3Rpb25zID0gZXhwb3J0cy5hY3Rpb25zID0ge307XHJcblxyXG5hY3Rpb25zLmZhY2Vib29rID0gZnVuY3Rpb24gKCkge1xyXG4gIC8qIEZhY2Vib29rIGNvbm5lY3QgKi9cclxuICB2YXIgRmFjZWJvb2tDb25uZWN0ID0gcmVxdWlyZSgnTEMvRmFjZWJvb2tDb25uZWN0Jyk7XHJcbiAgdmFyIGZiID0gbmV3IEZhY2Vib29rQ29ubmVjdCh7XHJcbiAgICByZXN1bHRUeXBlOiAnanNvbicsXHJcbiAgICB1cmxTZWN0aW9uOiAnVmVyaWZ5JyxcclxuICAgIGFwcElkOiAkKCdodG1sJykuZGF0YSgnZmItYXBwaWQnKSxcclxuICAgIHBlcm1pc3Npb25zOiAnZW1haWwsdXNlcl9hYm91dF9tZScsXHJcbiAgICBsb2FkaW5nVGV4dDogJ1ZlcmlmaW5nJ1xyXG4gIH0pO1xyXG4gICQoZG9jdW1lbnQpLm9uKGZiLmNvbm5lY3RlZEV2ZW50LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKGRvY3VtZW50KS5vbigncG9wdXAtY2xvc2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIGZiLmNvbm5lY3QoKTtcclxufTtcclxuXHJcbmFjdGlvbnMuZW1haWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcG9wdXAoTGNVcmwuTGFuZ1BhdGggKyAnQWNjb3VudC8kUmVzZW5kQ29uZmlybWF0aW9uRW1haWwvbm93LycsIHBvcHVwLnNpemUoJ3NtYWxsJykpO1xyXG59O1xyXG5cclxudmFyIGxpbmtzID0gZXhwb3J0cy5saW5rcyA9IHtcclxuICAnI2Nvbm5lY3Qtd2l0aC1mYWNlYm9vayc6IGFjdGlvbnMuZmFjZWJvb2ssXHJcbiAgJyNjb25maXJtLWVtYWlsJzogYWN0aW9ucy5lbWFpbFxyXG59O1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAkYy5vbignY2xpY2snLCAnYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIEdldCB0aGUgYWN0aW9uIGxpbmsgb3IgZW1wdHlcclxuICAgIHZhciBsaW5rID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSB8fCAnJztcclxuXHJcbiAgICAvLyBFeGVjdXRlIHRoZSBhY3Rpb24gYXR0YWNoZWQgdG8gdGhhdCBsaW5rXHJcbiAgICB2YXIgYWN0aW9uID0gbGlua3NbbGlua10gfHwgbnVsbDtcclxuICAgIGlmICh0eXBlb2YgKGFjdGlvbikgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgYWN0aW9uKCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxufTtcclxuIiwiLyoqIFZlcmlmaWNhdGlvbnMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIHNlY3Rpb25TZWxlY3RvciA9ICcuRGFzaGJvYXJkVmVyaWZpY2F0aW9ucycsXHJcbiAgICAkc2VjdGlvbiA9ICRjLmZpbmQoc2VjdGlvblNlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkc2VjdGlvbi5zaWJsaW5ncygpXHJcbiAgICAgIC5hZGQoJHNlY3Rpb24uZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAuYWRkKCRzZWN0aW9uLmNsb3Nlc3QoJy5EYXNoYm9hcmRBYm91dFlvdScpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwoc2VjdGlvblNlbGVjdG9yKTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG4gICAgcmVxdWlyZSgnLi9iYWNrZ3JvdW5kQ2hlY2tSZXF1ZXN0Jykuc2V0dXBGb3JtKCRlZGl0b3IuZmluZCgnLkRhc2hib2FyZEJhY2tncm91bmRDaGVjaycpKTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqIEF2YWlsYWJpbGl0eTogV2Vla2x5IFNjaGVkdWxlIHNlY3Rpb24gc2V0dXBcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhciA9IHJlcXVpcmUoJ0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyJyk7XHJcbnZhciBiYXRjaEV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJ0xDL2JhdGNoRXZlbnRIYW5kbGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciB3b3JrSG91cnNMaXN0ID0gYXZhaWxhYmlsaXR5Q2FsZW5kYXIuV29ya0hvdXJzLmVuYWJsZUFsbCgpO1xyXG5cclxuICAgICQuZWFjaCh3b3JrSG91cnNMaXN0LCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgIHZhciB3b3JraG91cnMgPSB0aGlzO1xyXG5cclxuICAgICAgICAvLyBTZXR1cGluZyB0aGUgV29ya0hvdXJzIGNhbGVuZGFyIGRhdGEgZmllbGRcclxuICAgICAgICB2YXIgZm9ybSA9IHdvcmtob3Vycy4kZWwuY2xvc2VzdCgnZm9ybS5hamF4LCBmaWVsZHNldC5hamF4Jyk7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gZm9ybS5maW5kKCdbbmFtZT13b3JraG91cnNdJyk7XHJcbiAgICAgICAgaWYgKGZpZWxkLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgZmllbGQgPSAkKCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJ3b3JraG91cnNcIiAvPicpLmluc2VydEFmdGVyKHdvcmtob3Vycy4kZWwpO1xyXG5cclxuICAgICAgICAvLyBTYXZlIHdoZW4gdGhlIGZvcm0gaXMgdG8gYmUgc3VibWl0dGVkXHJcbiAgICAgICAgZm9ybS5vbigncHJlc3VibWl0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmaWVsZC52YWwoSlNPTi5zdHJpbmdpZnkod29ya2hvdXJzLmRhdGEpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVXBkYXRpbmcgZmllbGQgb24gY2FsZW5kYXIgY2hhbmdlcyAodXNpbmcgYmF0Y2ggdG8gYXZvaWQgaHVydCBwZXJmb3JtYW5jZSlcclxuICAgICAgICAvLyBhbmQgcmFpc2UgY2hhbmdlIGV2ZW50ICh0aGlzIGZpeGVzIHRoZSBzdXBwb3J0IGZvciBjaGFuZ2VzTm90aWZpY2F0aW9uXHJcbiAgICAgICAgLy8gYW5kIGluc3RhbnQtc2F2aW5nKS5cclxuICAgICAgICB3b3JraG91cnMuZXZlbnRzLm9uKCdkYXRhQ2hhbmdlZCcsIGJhdGNoRXZlbnRIYW5kbGVyKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGZpZWxkXHJcbiAgICAgICAgICAgIC52YWwoSlNPTi5zdHJpbmdpZnkod29ya2hvdXJzLmRhdGEpKVxyXG4gICAgICAgICAgICAuY2hhbmdlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAvLyBEaXNhYmxpbmcgY2FsZW5kYXIgb24gZmllbGQgYWxsdGltZVxyXG4gICAgICAgIGZvcm0uZmluZCgnW25hbWU9YWxsdGltZV0nKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpLFxyXG4gICAgICAgIGNsID0gd29ya2hvdXJzLmNsYXNzZXMuZGlzYWJsZWQ7XHJcbiAgICAgICAgICAgIGlmIChjbClcclxuICAgICAgICAgICAgICAgIHdvcmtob3Vycy4kZWwudG9nZ2xlQ2xhc3MoY2wsICR0LnByb3AoJ2NoZWNrZWQnKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSk7XHJcbn07XHJcbiIsIi8qIVxuICogaW1hZ2VzTG9hZGVkIHYzLjEuOFxuICogSmF2YVNjcmlwdCBpcyBhbGwgbGlrZSBcIllvdSBpbWFnZXMgYXJlIGRvbmUgeWV0IG9yIHdoYXQ/XCJcbiAqIE1JVCBMaWNlbnNlXG4gKi9cblxuKCBmdW5jdGlvbiggd2luZG93LCBmYWN0b3J5ICkgeyAndXNlIHN0cmljdCc7XG4gIC8vIHVuaXZlcnNhbCBtb2R1bGUgZGVmaW5pdGlvblxuXG4gIC8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UsIHJlcXVpcmU6IGZhbHNlICovXG5cbiAgaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gICAgLy8gQU1EXG4gICAgZGVmaW5lKCBbXG4gICAgICAnZXZlbnRFbWl0dGVyL0V2ZW50RW1pdHRlcicsXG4gICAgICAnZXZlbnRpZS9ldmVudGllJ1xuICAgIF0sIGZ1bmN0aW9uKCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUgKSB7XG4gICAgICByZXR1cm4gZmFjdG9yeSggd2luZG93LCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUgKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuICAgIC8vIENvbW1vbkpTXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgcmVxdWlyZSgnd29sZnk4Ny1ldmVudGVtaXR0ZXInKSxcbiAgICAgIHJlcXVpcmUoJ2V2ZW50aWUnKVxuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgLy8gYnJvd3NlciBnbG9iYWxcbiAgICB3aW5kb3cuaW1hZ2VzTG9hZGVkID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHdpbmRvdy5FdmVudEVtaXR0ZXIsXG4gICAgICB3aW5kb3cuZXZlbnRpZVxuICAgICk7XG4gIH1cblxufSkoIHdpbmRvdyxcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIGZhY3RvcnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuZnVuY3Rpb24gZmFjdG9yeSggd2luZG93LCBFdmVudEVtaXR0ZXIsIGV2ZW50aWUgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyICQgPSB3aW5kb3cualF1ZXJ5O1xudmFyIGNvbnNvbGUgPSB3aW5kb3cuY29uc29sZTtcbnZhciBoYXNDb25zb2xlID0gdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBoZWxwZXJzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8vIGV4dGVuZCBvYmplY3RzXG5mdW5jdGlvbiBleHRlbmQoIGEsIGIgKSB7XG4gIGZvciAoIHZhciBwcm9wIGluIGIgKSB7XG4gICAgYVsgcHJvcCBdID0gYlsgcHJvcCBdO1xuICB9XG4gIHJldHVybiBhO1xufVxuXG52YXIgb2JqVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuZnVuY3Rpb24gaXNBcnJheSggb2JqICkge1xuICByZXR1cm4gb2JqVG9TdHJpbmcuY2FsbCggb2JqICkgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59XG5cbi8vIHR1cm4gZWxlbWVudCBvciBub2RlTGlzdCBpbnRvIGFuIGFycmF5XG5mdW5jdGlvbiBtYWtlQXJyYXkoIG9iaiApIHtcbiAgdmFyIGFyeSA9IFtdO1xuICBpZiAoIGlzQXJyYXkoIG9iaiApICkge1xuICAgIC8vIHVzZSBvYmplY3QgaWYgYWxyZWFkeSBhbiBhcnJheVxuICAgIGFyeSA9IG9iajtcbiAgfSBlbHNlIGlmICggdHlwZW9mIG9iai5sZW5ndGggPT09ICdudW1iZXInICkge1xuICAgIC8vIGNvbnZlcnQgbm9kZUxpc3QgdG8gYXJyYXlcbiAgICBmb3IgKCB2YXIgaT0wLCBsZW4gPSBvYmoubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICBhcnkucHVzaCggb2JqW2ldICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIGFycmF5IG9mIHNpbmdsZSBpbmRleFxuICAgIGFyeS5wdXNoKCBvYmogKTtcbiAgfVxuICByZXR1cm4gYXJ5O1xufVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGltYWdlc0xvYWRlZCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FycmF5LCBFbGVtZW50LCBOb2RlTGlzdCwgU3RyaW5nfSBlbGVtXG4gICAqIEBwYXJhbSB7T2JqZWN0IG9yIEZ1bmN0aW9ufSBvcHRpb25zIC0gaWYgZnVuY3Rpb24sIHVzZSBhcyBjYWxsYmFja1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvbkFsd2F5cyAtIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAqL1xuICBmdW5jdGlvbiBJbWFnZXNMb2FkZWQoIGVsZW0sIG9wdGlvbnMsIG9uQWx3YXlzICkge1xuICAgIC8vIGNvZXJjZSBJbWFnZXNMb2FkZWQoKSB3aXRob3V0IG5ldywgdG8gYmUgbmV3IEltYWdlc0xvYWRlZCgpXG4gICAgaWYgKCAhKCB0aGlzIGluc3RhbmNlb2YgSW1hZ2VzTG9hZGVkICkgKSB7XG4gICAgICByZXR1cm4gbmV3IEltYWdlc0xvYWRlZCggZWxlbSwgb3B0aW9ucyApO1xuICAgIH1cbiAgICAvLyB1c2UgZWxlbSBhcyBzZWxlY3RvciBzdHJpbmdcbiAgICBpZiAoIHR5cGVvZiBlbGVtID09PSAnc3RyaW5nJyApIHtcbiAgICAgIGVsZW0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCBlbGVtICk7XG4gICAgfVxuXG4gICAgdGhpcy5lbGVtZW50cyA9IG1ha2VBcnJheSggZWxlbSApO1xuICAgIHRoaXMub3B0aW9ucyA9IGV4dGVuZCgge30sIHRoaXMub3B0aW9ucyApO1xuXG4gICAgaWYgKCB0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJyApIHtcbiAgICAgIG9uQWx3YXlzID0gb3B0aW9ucztcbiAgICB9IGVsc2Uge1xuICAgICAgZXh0ZW5kKCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMgKTtcbiAgICB9XG5cbiAgICBpZiAoIG9uQWx3YXlzICkge1xuICAgICAgdGhpcy5vbiggJ2Fsd2F5cycsIG9uQWx3YXlzICk7XG4gICAgfVxuXG4gICAgdGhpcy5nZXRJbWFnZXMoKTtcblxuICAgIGlmICggJCApIHtcbiAgICAgIC8vIGFkZCBqUXVlcnkgRGVmZXJyZWQgb2JqZWN0XG4gICAgICB0aGlzLmpxRGVmZXJyZWQgPSBuZXcgJC5EZWZlcnJlZCgpO1xuICAgIH1cblxuICAgIC8vIEhBQ0sgY2hlY2sgYXN5bmMgdG8gYWxsb3cgdGltZSB0byBiaW5kIGxpc3RlbmVyc1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5jaGVjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLm9wdGlvbnMgPSB7fTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLmdldEltYWdlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaW1hZ2VzID0gW107XG5cbiAgICAvLyBmaWx0ZXIgJiBmaW5kIGl0ZW1zIGlmIHdlIGhhdmUgYW4gaXRlbSBzZWxlY3RvclxuICAgIGZvciAoIHZhciBpPTAsIGxlbiA9IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG4gICAgICB2YXIgZWxlbSA9IHRoaXMuZWxlbWVudHNbaV07XG4gICAgICAvLyBmaWx0ZXIgc2libGluZ3NcbiAgICAgIGlmICggZWxlbS5ub2RlTmFtZSA9PT0gJ0lNRycgKSB7XG4gICAgICAgIHRoaXMuYWRkSW1hZ2UoIGVsZW0gKTtcbiAgICAgIH1cbiAgICAgIC8vIGZpbmQgY2hpbGRyZW5cbiAgICAgIC8vIG5vIG5vbi1lbGVtZW50IG5vZGVzLCAjMTQzXG4gICAgICB2YXIgbm9kZVR5cGUgPSBlbGVtLm5vZGVUeXBlO1xuICAgICAgaWYgKCAhbm9kZVR5cGUgfHwgISggbm9kZVR5cGUgPT09IDEgfHwgbm9kZVR5cGUgPT09IDkgfHwgbm9kZVR5cGUgPT09IDExICkgKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgdmFyIGNoaWxkRWxlbXMgPSBlbGVtLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZycpO1xuICAgICAgLy8gY29uY2F0IGNoaWxkRWxlbXMgdG8gZmlsdGVyRm91bmQgYXJyYXlcbiAgICAgIGZvciAoIHZhciBqPTAsIGpMZW4gPSBjaGlsZEVsZW1zLmxlbmd0aDsgaiA8IGpMZW47IGorKyApIHtcbiAgICAgICAgdmFyIGltZyA9IGNoaWxkRWxlbXNbal07XG4gICAgICAgIHRoaXMuYWRkSW1hZ2UoIGltZyApO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQHBhcmFtIHtJbWFnZX0gaW1nXG4gICAqL1xuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLmFkZEltYWdlID0gZnVuY3Rpb24oIGltZyApIHtcbiAgICB2YXIgbG9hZGluZ0ltYWdlID0gbmV3IExvYWRpbmdJbWFnZSggaW1nICk7XG4gICAgdGhpcy5pbWFnZXMucHVzaCggbG9hZGluZ0ltYWdlICk7XG4gIH07XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdmFyIGNoZWNrZWRDb3VudCA9IDA7XG4gICAgdmFyIGxlbmd0aCA9IHRoaXMuaW1hZ2VzLmxlbmd0aDtcbiAgICB0aGlzLmhhc0FueUJyb2tlbiA9IGZhbHNlO1xuICAgIC8vIGNvbXBsZXRlIGlmIG5vIGltYWdlc1xuICAgIGlmICggIWxlbmd0aCApIHtcbiAgICAgIHRoaXMuY29tcGxldGUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbkNvbmZpcm0oIGltYWdlLCBtZXNzYWdlICkge1xuICAgICAgaWYgKCBfdGhpcy5vcHRpb25zLmRlYnVnICYmIGhhc0NvbnNvbGUgKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCAnY29uZmlybScsIGltYWdlLCBtZXNzYWdlICk7XG4gICAgICB9XG5cbiAgICAgIF90aGlzLnByb2dyZXNzKCBpbWFnZSApO1xuICAgICAgY2hlY2tlZENvdW50Kys7XG4gICAgICBpZiAoIGNoZWNrZWRDb3VudCA9PT0gbGVuZ3RoICkge1xuICAgICAgICBfdGhpcy5jb21wbGV0ZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7IC8vIGJpbmQgb25jZVxuICAgIH1cblxuICAgIGZvciAoIHZhciBpPTA7IGkgPCBsZW5ndGg7IGkrKyApIHtcbiAgICAgIHZhciBsb2FkaW5nSW1hZ2UgPSB0aGlzLmltYWdlc1tpXTtcbiAgICAgIGxvYWRpbmdJbWFnZS5vbiggJ2NvbmZpcm0nLCBvbkNvbmZpcm0gKTtcbiAgICAgIGxvYWRpbmdJbWFnZS5jaGVjaygpO1xuICAgIH1cbiAgfTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLnByb2dyZXNzID0gZnVuY3Rpb24oIGltYWdlICkge1xuICAgIHRoaXMuaGFzQW55QnJva2VuID0gdGhpcy5oYXNBbnlCcm9rZW4gfHwgIWltYWdlLmlzTG9hZGVkO1xuICAgIC8vIEhBQ0sgLSBDaHJvbWUgdHJpZ2dlcnMgZXZlbnQgYmVmb3JlIG9iamVjdCBwcm9wZXJ0aWVzIGhhdmUgY2hhbmdlZC4gIzgzXG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLmVtaXQoICdwcm9ncmVzcycsIF90aGlzLCBpbWFnZSApO1xuICAgICAgaWYgKCBfdGhpcy5qcURlZmVycmVkICYmIF90aGlzLmpxRGVmZXJyZWQubm90aWZ5ICkge1xuICAgICAgICBfdGhpcy5qcURlZmVycmVkLm5vdGlmeSggX3RoaXMsIGltYWdlICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBldmVudE5hbWUgPSB0aGlzLmhhc0FueUJyb2tlbiA/ICdmYWlsJyA6ICdkb25lJztcbiAgICB0aGlzLmlzQ29tcGxldGUgPSB0cnVlO1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgLy8gSEFDSyAtIGFub3RoZXIgc2V0VGltZW91dCBzbyB0aGF0IGNvbmZpcm0gaGFwcGVucyBhZnRlciBwcm9ncmVzc1xuICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuZW1pdCggZXZlbnROYW1lLCBfdGhpcyApO1xuICAgICAgX3RoaXMuZW1pdCggJ2Fsd2F5cycsIF90aGlzICk7XG4gICAgICBpZiAoIF90aGlzLmpxRGVmZXJyZWQgKSB7XG4gICAgICAgIHZhciBqcU1ldGhvZCA9IF90aGlzLmhhc0FueUJyb2tlbiA/ICdyZWplY3QnIDogJ3Jlc29sdmUnO1xuICAgICAgICBfdGhpcy5qcURlZmVycmVkWyBqcU1ldGhvZCBdKCBfdGhpcyApO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGpxdWVyeSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIGlmICggJCApIHtcbiAgICAkLmZuLmltYWdlc0xvYWRlZCA9IGZ1bmN0aW9uKCBvcHRpb25zLCBjYWxsYmFjayApIHtcbiAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBJbWFnZXNMb2FkZWQoIHRoaXMsIG9wdGlvbnMsIGNhbGxiYWNrICk7XG4gICAgICByZXR1cm4gaW5zdGFuY2UuanFEZWZlcnJlZC5wcm9taXNlKCAkKHRoaXMpICk7XG4gICAgfTtcbiAgfVxuXG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgZnVuY3Rpb24gTG9hZGluZ0ltYWdlKCBpbWcgKSB7XG4gICAgdGhpcy5pbWcgPSBpbWc7XG4gIH1cblxuICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIExvYWRpbmdJbWFnZS5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBmaXJzdCBjaGVjayBjYWNoZWQgYW55IHByZXZpb3VzIGltYWdlcyB0aGF0IGhhdmUgc2FtZSBzcmNcbiAgICB2YXIgcmVzb3VyY2UgPSBjYWNoZVsgdGhpcy5pbWcuc3JjIF0gfHwgbmV3IFJlc291cmNlKCB0aGlzLmltZy5zcmMgKTtcbiAgICBpZiAoIHJlc291cmNlLmlzQ29uZmlybWVkICkge1xuICAgICAgdGhpcy5jb25maXJtKCByZXNvdXJjZS5pc0xvYWRlZCwgJ2NhY2hlZCB3YXMgY29uZmlybWVkJyApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIGNvbXBsZXRlIGlzIHRydWUgYW5kIGJyb3dzZXIgc3VwcG9ydHMgbmF0dXJhbCBzaXplcyxcbiAgICAvLyB0cnkgdG8gY2hlY2sgZm9yIGltYWdlIHN0YXR1cyBtYW51YWxseS5cbiAgICBpZiAoIHRoaXMuaW1nLmNvbXBsZXRlICYmIHRoaXMuaW1nLm5hdHVyYWxXaWR0aCAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgLy8gcmVwb3J0IGJhc2VkIG9uIG5hdHVyYWxXaWR0aFxuICAgICAgdGhpcy5jb25maXJtKCB0aGlzLmltZy5uYXR1cmFsV2lkdGggIT09IDAsICduYXR1cmFsV2lkdGgnICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgbm9uZSBvZiB0aGUgY2hlY2tzIGFib3ZlIG1hdGNoZWQsIHNpbXVsYXRlIGxvYWRpbmcgb24gZGV0YWNoZWQgZWxlbWVudC5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHJlc291cmNlLm9uKCAnY29uZmlybScsIGZ1bmN0aW9uKCByZXNyYywgbWVzc2FnZSApIHtcbiAgICAgIF90aGlzLmNvbmZpcm0oIHJlc3JjLmlzTG9hZGVkLCBtZXNzYWdlICk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcblxuICAgIHJlc291cmNlLmNoZWNrKCk7XG4gIH07XG5cbiAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5jb25maXJtID0gZnVuY3Rpb24oIGlzTG9hZGVkLCBtZXNzYWdlICkge1xuICAgIHRoaXMuaXNMb2FkZWQgPSBpc0xvYWRlZDtcbiAgICB0aGlzLmVtaXQoICdjb25maXJtJywgdGhpcywgbWVzc2FnZSApO1xuICB9O1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFJlc291cmNlIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgLy8gUmVzb3VyY2UgY2hlY2tzIGVhY2ggc3JjLCBvbmx5IG9uY2VcbiAgLy8gc2VwYXJhdGUgY2xhc3MgZnJvbSBMb2FkaW5nSW1hZ2UgdG8gcHJldmVudCBtZW1vcnkgbGVha3MuIFNlZSAjMTE1XG5cbiAgdmFyIGNhY2hlID0ge307XG5cbiAgZnVuY3Rpb24gUmVzb3VyY2UoIHNyYyApIHtcbiAgICB0aGlzLnNyYyA9IHNyYztcbiAgICAvLyBhZGQgdG8gY2FjaGVcbiAgICBjYWNoZVsgc3JjIF0gPSB0aGlzO1xuICB9XG5cbiAgUmVzb3VyY2UucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIFJlc291cmNlLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIG9ubHkgdHJpZ2dlciBjaGVja2luZyBvbmNlXG4gICAgaWYgKCB0aGlzLmlzQ2hlY2tlZCApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gc2ltdWxhdGUgbG9hZGluZyBvbiBkZXRhY2hlZCBlbGVtZW50XG4gICAgdmFyIHByb3h5SW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICBldmVudGllLmJpbmQoIHByb3h5SW1hZ2UsICdsb2FkJywgdGhpcyApO1xuICAgIGV2ZW50aWUuYmluZCggcHJveHlJbWFnZSwgJ2Vycm9yJywgdGhpcyApO1xuICAgIHByb3h5SW1hZ2Uuc3JjID0gdGhpcy5zcmM7XG4gICAgLy8gc2V0IGZsYWdcbiAgICB0aGlzLmlzQ2hlY2tlZCA9IHRydWU7XG4gIH07XG5cbiAgLy8gLS0tLS0gZXZlbnRzIC0tLS0tIC8vXG5cbiAgLy8gdHJpZ2dlciBzcGVjaWZpZWQgaGFuZGxlciBmb3IgZXZlbnQgdHlwZVxuICBSZXNvdXJjZS5wcm90b3R5cGUuaGFuZGxlRXZlbnQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgdmFyIG1ldGhvZCA9ICdvbicgKyBldmVudC50eXBlO1xuICAgIGlmICggdGhpc1sgbWV0aG9kIF0gKSB7XG4gICAgICB0aGlzWyBtZXRob2QgXSggZXZlbnQgKTtcbiAgICB9XG4gIH07XG5cbiAgUmVzb3VyY2UucHJvdG90eXBlLm9ubG9hZCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgICB0aGlzLmNvbmZpcm0oIHRydWUsICdvbmxvYWQnICk7XG4gICAgdGhpcy51bmJpbmRQcm94eUV2ZW50cyggZXZlbnQgKTtcbiAgfTtcblxuICBSZXNvdXJjZS5wcm90b3R5cGUub25lcnJvciA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgICB0aGlzLmNvbmZpcm0oIGZhbHNlLCAnb25lcnJvcicgKTtcbiAgICB0aGlzLnVuYmluZFByb3h5RXZlbnRzKCBldmVudCApO1xuICB9O1xuXG4gIC8vIC0tLS0tIGNvbmZpcm0gLS0tLS0gLy9cblxuICBSZXNvdXJjZS5wcm90b3R5cGUuY29uZmlybSA9IGZ1bmN0aW9uKCBpc0xvYWRlZCwgbWVzc2FnZSApIHtcbiAgICB0aGlzLmlzQ29uZmlybWVkID0gdHJ1ZTtcbiAgICB0aGlzLmlzTG9hZGVkID0gaXNMb2FkZWQ7XG4gICAgdGhpcy5lbWl0KCAnY29uZmlybScsIHRoaXMsIG1lc3NhZ2UgKTtcbiAgfTtcblxuICBSZXNvdXJjZS5wcm90b3R5cGUudW5iaW5kUHJveHlFdmVudHMgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgZXZlbnRpZS51bmJpbmQoIGV2ZW50LnRhcmdldCwgJ2xvYWQnLCB0aGlzICk7XG4gICAgZXZlbnRpZS51bmJpbmQoIGV2ZW50LnRhcmdldCwgJ2Vycm9yJywgdGhpcyApO1xuICB9O1xuXG4gIC8vIC0tLS0tICAtLS0tLSAvL1xuXG4gIHJldHVybiBJbWFnZXNMb2FkZWQ7XG5cbn0pO1xuIiwiLyohXG4gKiBldmVudGllIHYxLjAuNVxuICogZXZlbnQgYmluZGluZyBoZWxwZXJcbiAqICAgZXZlbnRpZS5iaW5kKCBlbGVtLCAnY2xpY2snLCBteUZuIClcbiAqICAgZXZlbnRpZS51bmJpbmQoIGVsZW0sICdjbGljaycsIG15Rm4gKVxuICogTUlUIGxpY2Vuc2VcbiAqL1xuXG4vKmpzaGludCBicm93c2VyOiB0cnVlLCB1bmRlZjogdHJ1ZSwgdW51c2VkOiB0cnVlICovXG4vKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdyApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgZG9jRWxlbSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxudmFyIGJpbmQgPSBmdW5jdGlvbigpIHt9O1xuXG5mdW5jdGlvbiBnZXRJRUV2ZW50KCBvYmogKSB7XG4gIHZhciBldmVudCA9IHdpbmRvdy5ldmVudDtcbiAgLy8gYWRkIGV2ZW50LnRhcmdldFxuICBldmVudC50YXJnZXQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuc3JjRWxlbWVudCB8fCBvYmo7XG4gIHJldHVybiBldmVudDtcbn1cblxuaWYgKCBkb2NFbGVtLmFkZEV2ZW50TGlzdGVuZXIgKSB7XG4gIGJpbmQgPSBmdW5jdGlvbiggb2JqLCB0eXBlLCBmbiApIHtcbiAgICBvYmouYWRkRXZlbnRMaXN0ZW5lciggdHlwZSwgZm4sIGZhbHNlICk7XG4gIH07XG59IGVsc2UgaWYgKCBkb2NFbGVtLmF0dGFjaEV2ZW50ICkge1xuICBiaW5kID0gZnVuY3Rpb24oIG9iaiwgdHlwZSwgZm4gKSB7XG4gICAgb2JqWyB0eXBlICsgZm4gXSA9IGZuLmhhbmRsZUV2ZW50ID9cbiAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXZlbnQgPSBnZXRJRUV2ZW50KCBvYmogKTtcbiAgICAgICAgZm4uaGFuZGxlRXZlbnQuY2FsbCggZm4sIGV2ZW50ICk7XG4gICAgICB9IDpcbiAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXZlbnQgPSBnZXRJRUV2ZW50KCBvYmogKTtcbiAgICAgICAgZm4uY2FsbCggb2JqLCBldmVudCApO1xuICAgICAgfTtcbiAgICBvYmouYXR0YWNoRXZlbnQoIFwib25cIiArIHR5cGUsIG9ialsgdHlwZSArIGZuIF0gKTtcbiAgfTtcbn1cblxudmFyIHVuYmluZCA9IGZ1bmN0aW9uKCkge307XG5cbmlmICggZG9jRWxlbS5yZW1vdmVFdmVudExpc3RlbmVyICkge1xuICB1bmJpbmQgPSBmdW5jdGlvbiggb2JqLCB0eXBlLCBmbiApIHtcbiAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lciggdHlwZSwgZm4sIGZhbHNlICk7XG4gIH07XG59IGVsc2UgaWYgKCBkb2NFbGVtLmRldGFjaEV2ZW50ICkge1xuICB1bmJpbmQgPSBmdW5jdGlvbiggb2JqLCB0eXBlLCBmbiApIHtcbiAgICBvYmouZGV0YWNoRXZlbnQoIFwib25cIiArIHR5cGUsIG9ialsgdHlwZSArIGZuIF0gKTtcbiAgICB0cnkge1xuICAgICAgZGVsZXRlIG9ialsgdHlwZSArIGZuIF07XG4gICAgfSBjYXRjaCAoIGVyciApIHtcbiAgICAgIC8vIGNhbid0IGRlbGV0ZSB3aW5kb3cgb2JqZWN0IHByb3BlcnRpZXNcbiAgICAgIG9ialsgdHlwZSArIGZuIF0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9O1xufVxuXG52YXIgZXZlbnRpZSA9IHtcbiAgYmluZDogYmluZCxcbiAgdW5iaW5kOiB1bmJpbmRcbn07XG5cbi8vIC0tLS0tIG1vZHVsZSBkZWZpbml0aW9uIC0tLS0tIC8vXG5cbmlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAvLyBBTURcbiAgZGVmaW5lKCBldmVudGllICk7XG59IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgKSB7XG4gIC8vIENvbW1vbkpTXG4gIG1vZHVsZS5leHBvcnRzID0gZXZlbnRpZTtcbn0gZWxzZSB7XG4gIC8vIGJyb3dzZXIgZ2xvYmFsXG4gIHdpbmRvdy5ldmVudGllID0gZXZlbnRpZTtcbn1cblxufSkoIHRoaXMgKTtcbiIsIi8qIVxuICogRXZlbnRFbWl0dGVyIHY0LjIuNiAtIGdpdC5pby9lZVxuICogT2xpdmVyIENhbGR3ZWxsXG4gKiBNSVQgbGljZW5zZVxuICogQHByZXNlcnZlXG4gKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBDbGFzcyBmb3IgbWFuYWdpbmcgZXZlbnRzLlxuXHQgKiBDYW4gYmUgZXh0ZW5kZWQgdG8gcHJvdmlkZSBldmVudCBmdW5jdGlvbmFsaXR5IGluIG90aGVyIGNsYXNzZXMuXG5cdCAqXG5cdCAqIEBjbGFzcyBFdmVudEVtaXR0ZXIgTWFuYWdlcyBldmVudCByZWdpc3RlcmluZyBhbmQgZW1pdHRpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7fVxuXG5cdC8vIFNob3J0Y3V0cyB0byBpbXByb3ZlIHNwZWVkIGFuZCBzaXplXG5cdHZhciBwcm90byA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGU7XG5cdHZhciBleHBvcnRzID0gdGhpcztcblx0dmFyIG9yaWdpbmFsR2xvYmFsVmFsdWUgPSBleHBvcnRzLkV2ZW50RW1pdHRlcjtcblxuXHQvKipcblx0ICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBsaXN0ZW5lciBmb3IgdGhlIGV2ZW50IGluIGl0J3Mgc3RvcmFnZSBhcnJheS5cblx0ICpcblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBsaXN0ZW5lcnMgQXJyYXkgb2YgbGlzdGVuZXJzIHRvIHNlYXJjaCB0aHJvdWdoLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gbG9vayBmb3IuXG5cdCAqIEByZXR1cm4ge051bWJlcn0gSW5kZXggb2YgdGhlIHNwZWNpZmllZCBsaXN0ZW5lciwgLTEgaWYgbm90IGZvdW5kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVycywgbGlzdGVuZXIpIHtcblx0XHR2YXIgaSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0aWYgKGxpc3RlbmVyc1tpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cblx0LyoqXG5cdCAqIEFsaWFzIGEgbWV0aG9kIHdoaWxlIGtlZXBpbmcgdGhlIGNvbnRleHQgY29ycmVjdCwgdG8gYWxsb3cgZm9yIG92ZXJ3cml0aW5nIG9mIHRhcmdldCBtZXRob2QuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSB0YXJnZXQgbWV0aG9kLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGFsaWFzZWQgbWV0aG9kXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWxpYXMobmFtZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiBhbGlhc0Nsb3N1cmUoKSB7XG5cdFx0XHRyZXR1cm4gdGhpc1tuYW1lXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdH07XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgbGlzdGVuZXIgYXJyYXkgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdpbGwgaW5pdGlhbGlzZSB0aGUgZXZlbnQgb2JqZWN0IGFuZCBsaXN0ZW5lciBhcnJheXMgaWYgcmVxdWlyZWQuXG5cdCAqIFdpbGwgcmV0dXJuIGFuIG9iamVjdCBpZiB5b3UgdXNlIGEgcmVnZXggc2VhcmNoLiBUaGUgb2JqZWN0IGNvbnRhaW5zIGtleXMgZm9yIGVhY2ggbWF0Y2hlZCBldmVudC4gU28gL2JhW3J6XS8gbWlnaHQgcmV0dXJuIGFuIG9iamVjdCBjb250YWluaW5nIGJhciBhbmQgYmF6LiBCdXQgb25seSBpZiB5b3UgaGF2ZSBlaXRoZXIgZGVmaW5lZCB0aGVtIHdpdGggZGVmaW5lRXZlbnQgb3IgYWRkZWQgc29tZSBsaXN0ZW5lcnMgdG8gdGhlbS5cblx0ICogRWFjaCBwcm9wZXJ0eSBpbiB0aGUgb2JqZWN0IHJlc3BvbnNlIGlzIGFuIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXXxPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIHRoZSBldmVudC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVycyA9IGZ1bmN0aW9uIGdldExpc3RlbmVycyhldnQpIHtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZXR1cm4gYSBjb25jYXRlbmF0ZWQgYXJyYXkgb2YgYWxsIG1hdGNoaW5nIGV2ZW50cyBpZlxuXHRcdC8vIHRoZSBzZWxlY3RvciBpcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRyZXNwb25zZVtrZXldID0gZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXNwb25zZSA9IGV2ZW50c1tldnRdIHx8IChldmVudHNbZXZ0XSA9IFtdKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdH07XG5cblx0LyoqXG5cdCAqIFRha2VzIGEgbGlzdCBvZiBsaXN0ZW5lciBvYmplY3RzIGFuZCBmbGF0dGVucyBpdCBpbnRvIGEgbGlzdCBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0W119IGxpc3RlbmVycyBSYXcgbGlzdGVuZXIgb2JqZWN0cy5cblx0ICogQHJldHVybiB7RnVuY3Rpb25bXX0gSnVzdCB0aGUgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKi9cblx0cHJvdG8uZmxhdHRlbkxpc3RlbmVycyA9IGZ1bmN0aW9uIGZsYXR0ZW5MaXN0ZW5lcnMobGlzdGVuZXJzKSB7XG5cdFx0dmFyIGZsYXRMaXN0ZW5lcnMgPSBbXTtcblx0XHR2YXIgaTtcblxuXHRcdGZvciAoaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdGZsYXRMaXN0ZW5lcnMucHVzaChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmbGF0TGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSByZXF1ZXN0ZWQgbGlzdGVuZXJzIHZpYSBnZXRMaXN0ZW5lcnMgYnV0IHdpbGwgYWx3YXlzIHJldHVybiB0aGUgcmVzdWx0cyBpbnNpZGUgYW4gb2JqZWN0LiBUaGlzIGlzIG1haW5seSBmb3IgaW50ZXJuYWwgdXNlIGJ1dCBvdGhlcnMgbWF5IGZpbmQgaXQgdXNlZnVsLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEFsbCBsaXN0ZW5lciBmdW5jdGlvbnMgZm9yIGFuIGV2ZW50IGluIGFuIG9iamVjdC5cblx0ICovXG5cdHByb3RvLmdldExpc3RlbmVyc0FzT2JqZWN0ID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0aWYgKGxpc3RlbmVycyBpbnN0YW5jZW9mIEFycmF5KSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0cmVzcG9uc2VbZXZ0XSA9IGxpc3RlbmVycztcblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzcG9uc2UgfHwgbGlzdGVuZXJzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBZGRzIGEgbGlzdGVuZXIgZnVuY3Rpb24gdG8gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogVGhlIGxpc3RlbmVyIHdpbGwgbm90IGJlIGFkZGVkIGlmIGl0IGlzIGEgZHVwbGljYXRlLlxuXHQgKiBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGl0IGlzIGNhbGxlZC5cblx0ICogSWYgeW91IHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUgdGhlbiB0aGUgbGlzdGVuZXIgd2lsbCBiZSBhZGRlZCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVyID0gZnVuY3Rpb24gYWRkTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVySXNXcmFwcGVkID0gdHlwZW9mIGxpc3RlbmVyID09PSAnb2JqZWN0Jztcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkgJiYgaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcikgPT09IC0xKSB7XG5cdFx0XHRcdGxpc3RlbmVyc1trZXldLnB1c2gobGlzdGVuZXJJc1dyYXBwZWQgPyBsaXN0ZW5lciA6IHtcblx0XHRcdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRcdFx0b25jZTogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZExpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vbiA9IGFsaWFzKCdhZGRMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBTZW1pLWFsaWFzIG9mIGFkZExpc3RlbmVyLiBJdCB3aWxsIGFkZCBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZVxuXHQgKiBhdXRvbWF0aWNhbGx5IHJlbW92ZWQgYWZ0ZXIgaXQncyBmaXJzdCBleGVjdXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGF0dGFjaCB0aGUgbGlzdGVuZXIgdG8uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgaXMgZW1pdHRlZC4gSWYgdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBjYWxsaW5nLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZE9uY2VMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZE9uY2VMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoZXZ0LCB7XG5cdFx0XHRsaXN0ZW5lcjogbGlzdGVuZXIsXG5cdFx0XHRvbmNlOiB0cnVlXG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGFkZE9uY2VMaXN0ZW5lci5cblx0ICovXG5cdHByb3RvLm9uY2UgPSBhbGlhcygnYWRkT25jZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIERlZmluZXMgYW4gZXZlbnQgbmFtZS4gVGhpcyBpcyByZXF1aXJlZCBpZiB5b3Ugd2FudCB0byB1c2UgYSByZWdleCB0byBhZGQgYSBsaXN0ZW5lciB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gSWYgeW91IGRvbid0IGRvIHRoaXMgdGhlbiBob3cgZG8geW91IGV4cGVjdCBpdCB0byBrbm93IHdoYXQgZXZlbnQgdG8gYWRkIHRvPyBTaG91bGQgaXQganVzdCBhZGQgdG8gZXZlcnkgcG9zc2libGUgbWF0Y2ggZm9yIGEgcmVnZXg/IE5vLiBUaGF0IGlzIHNjYXJ5IGFuZCBiYWQuXG5cdCAqIFlvdSBuZWVkIHRvIHRlbGwgaXQgd2hhdCBldmVudCBuYW1lcyBzaG91bGQgYmUgbWF0Y2hlZCBieSBhIHJlZ2V4LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGNyZWF0ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudCA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50KGV2dCkge1xuXHRcdHRoaXMuZ2V0TGlzdGVuZXJzKGV2dCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFVzZXMgZGVmaW5lRXZlbnQgdG8gZGVmaW5lIG11bHRpcGxlIGV2ZW50cy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmdbXX0gZXZ0cyBBbiBhcnJheSBvZiBldmVudCBuYW1lcyB0byBkZWZpbmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnRzID0gZnVuY3Rpb24gZGVmaW5lRXZlbnRzKGV2dHMpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGV2dHMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHRoaXMuZGVmaW5lRXZlbnQoZXZ0c1tpXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGEgbGlzdGVuZXIgZnVuY3Rpb24gZnJvbSB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaGVuIHBhc3NlZCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSwgaXQgd2lsbCByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgdGhlIGxpc3RlbmVyIGZyb20uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byByZW1vdmUgZnJvbSB0aGUgZXZlbnQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgaW5kZXg7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGluZGV4ID0gaW5kZXhPZkxpc3RlbmVyKGxpc3RlbmVyc1trZXldLCBsaXN0ZW5lcik7XG5cblx0XHRcdFx0aWYgKGluZGV4ICE9PSAtMSkge1xuXHRcdFx0XHRcdGxpc3RlbmVyc1trZXldLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9mZiA9IGFsaWFzKCdyZW1vdmVMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBBZGRzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy4gWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBhZGQgdGhlIGFycmF5IG9mIGxpc3RlbmVycyB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqIFllYWgsIHRoaXMgZnVuY3Rpb24gZG9lcyBxdWl0ZSBhIGJpdC4gVGhhdCdzIHByb2JhYmx5IGEgYmFkIHRoaW5nLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXJzID0gZnVuY3Rpb24gYWRkTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKGZhbHNlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSByZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVycyBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIHJlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byByZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlTGlzdGVuZXJzID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0Ly8gUGFzcyB0aHJvdWdoIHRvIG1hbmlwdWxhdGVMaXN0ZW5lcnNcblx0XHRyZXR1cm4gdGhpcy5tYW5pcHVsYXRlTGlzdGVuZXJzKHRydWUsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogRWRpdHMgbGlzdGVuZXJzIGluIGJ1bGsuIFRoZSBhZGRMaXN0ZW5lcnMgYW5kIHJlbW92ZUxpc3RlbmVycyBtZXRob2RzIGJvdGggdXNlIHRoaXMgdG8gZG8gdGhlaXIgam9iLiBZb3Ugc2hvdWxkIHJlYWxseSB1c2UgdGhvc2UgaW5zdGVhZCwgdGhpcyBpcyBhIGxpdHRsZSBsb3dlciBsZXZlbC5cblx0ICogVGhlIGZpcnN0IGFyZ3VtZW50IHdpbGwgZGV0ZXJtaW5lIGlmIHRoZSBsaXN0ZW5lcnMgYXJlIHJlbW92ZWQgKHRydWUpIG9yIGFkZGVkIChmYWxzZSkuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC9yZW1vdmVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBtYW5pcHVsYXRlIHRoZSBsaXN0ZW5lcnMgb2YgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHJlbW92ZSBUcnVlIGlmIHlvdSB3YW50IHRvIHJlbW92ZSBsaXN0ZW5lcnMsIGZhbHNlIGlmIHlvdSB3YW50IHRvIGFkZC5cblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkL3JlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5tYW5pcHVsYXRlTGlzdGVuZXJzID0gZnVuY3Rpb24gbWFuaXB1bGF0ZUxpc3RlbmVycyhyZW1vdmUsIGV2dCwgbGlzdGVuZXJzKSB7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIHZhbHVlO1xuXHRcdHZhciBzaW5nbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVyIDogdGhpcy5hZGRMaXN0ZW5lcjtcblx0XHR2YXIgbXVsdGlwbGUgPSByZW1vdmUgPyB0aGlzLnJlbW92ZUxpc3RlbmVycyA6IHRoaXMuYWRkTGlzdGVuZXJzO1xuXG5cdFx0Ly8gSWYgZXZ0IGlzIGFuIG9iamVjdCB0aGVuIHBhc3MgZWFjaCBvZiBpdCdzIHByb3BlcnRpZXMgdG8gdGhpcyBtZXRob2Rcblx0XHRpZiAodHlwZW9mIGV2dCA9PT0gJ29iamVjdCcgJiYgIShldnQgaW5zdGFuY2VvZiBSZWdFeHApKSB7XG5cdFx0XHRmb3IgKGkgaW4gZXZ0KSB7XG5cdFx0XHRcdGlmIChldnQuaGFzT3duUHJvcGVydHkoaSkgJiYgKHZhbHVlID0gZXZ0W2ldKSkge1xuXHRcdFx0XHRcdC8vIFBhc3MgdGhlIHNpbmdsZSBsaXN0ZW5lciBzdHJhaWdodCB0aHJvdWdoIHRvIHRoZSBzaW5ndWxhciBtZXRob2Rcblx0XHRcdFx0XHRpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gT3RoZXJ3aXNlIHBhc3MgYmFjayB0byB0aGUgbXVsdGlwbGUgZnVuY3Rpb25cblx0XHRcdFx0XHRcdG11bHRpcGxlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFNvIGV2dCBtdXN0IGJlIGEgc3RyaW5nXG5cdFx0XHQvLyBBbmQgbGlzdGVuZXJzIG11c3QgYmUgYW4gYXJyYXkgb2YgbGlzdGVuZXJzXG5cdFx0XHQvLyBMb29wIG92ZXIgaXQgYW5kIHBhc3MgZWFjaCBvbmUgdG8gdGhlIG11bHRpcGxlIG1ldGhvZFxuXHRcdFx0aSA9IGxpc3RlbmVycy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGV2dCwgbGlzdGVuZXJzW2ldKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGZyb20gYSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIElmIHlvdSBkbyBub3Qgc3BlY2lmeSBhbiBldmVudCB0aGVuIGFsbCBsaXN0ZW5lcnMgd2lsbCBiZSByZW1vdmVkLlxuXHQgKiBUaGF0IG1lYW5zIGV2ZXJ5IGV2ZW50IHdpbGwgYmUgZW1wdGllZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWdleCB0byByZW1vdmUgYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IFtldnRdIE9wdGlvbmFsIG5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvci4gV2lsbCByZW1vdmUgZnJvbSBldmVyeSBldmVudCBpZiBub3QgcGFzc2VkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUV2ZW50ID0gZnVuY3Rpb24gcmVtb3ZlRXZlbnQoZXZ0KSB7XG5cdFx0dmFyIHR5cGUgPSB0eXBlb2YgZXZ0O1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmVtb3ZlIGRpZmZlcmVudCB0aGluZ3MgZGVwZW5kaW5nIG9uIHRoZSBzdGF0ZSBvZiBldnRcblx0XHRpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50XG5cdFx0XHRkZWxldGUgZXZlbnRzW2V2dF07XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHR5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGV2ZW50cyBtYXRjaGluZyB0aGUgcmVnZXguXG5cdFx0XHRmb3IgKGtleSBpbiBldmVudHMpIHtcblx0XHRcdFx0aWYgKGV2ZW50cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGV2dC50ZXN0KGtleSkpIHtcblx0XHRcdFx0XHRkZWxldGUgZXZlbnRzW2tleV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBpbiBhbGwgZXZlbnRzXG5cdFx0XHRkZWxldGUgdGhpcy5fZXZlbnRzO1xuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVFdmVudC5cblx0ICpcblx0ICogQWRkZWQgdG8gbWlycm9yIHRoZSBub2RlIEFQSS5cblx0ICovXG5cdHByb3RvLnJlbW92ZUFsbExpc3RlbmVycyA9IGFsaWFzKCdyZW1vdmVFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBFbWl0cyBhbiBldmVudCBvZiB5b3VyIGNob2ljZS5cblx0ICogV2hlbiBlbWl0dGVkLCBldmVyeSBsaXN0ZW5lciBhdHRhY2hlZCB0byB0aGF0IGV2ZW50IHdpbGwgYmUgZXhlY3V0ZWQuXG5cdCAqIElmIHlvdSBwYXNzIHRoZSBvcHRpb25hbCBhcmd1bWVudCBhcnJheSB0aGVuIHRob3NlIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCB0byBldmVyeSBsaXN0ZW5lciB1cG9uIGV4ZWN1dGlvbi5cblx0ICogQmVjYXVzZSBpdCB1c2VzIGBhcHBseWAsIHlvdXIgYXJyYXkgb2YgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIGFzIGlmIHlvdSB3cm90ZSB0aGVtIG91dCBzZXBhcmF0ZWx5LlxuXHQgKiBTbyB0aGV5IHdpbGwgbm90IGFycml2ZSB3aXRoaW4gdGhlIGFycmF5IG9uIHRoZSBvdGhlciBzaWRlLCB0aGV5IHdpbGwgYmUgc2VwYXJhdGUuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXSBPcHRpb25hbCBhcnJheSBvZiBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdEV2ZW50ID0gZnVuY3Rpb24gZW1pdEV2ZW50KGV2dCwgYXJncykge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGxpc3RlbmVyO1xuXHRcdHZhciBpO1xuXHRcdHZhciBrZXk7XG5cdFx0dmFyIHJlc3BvbnNlO1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aSA9IGxpc3RlbmVyc1trZXldLmxlbmd0aDtcblxuXHRcdFx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHNoYWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZXZlbnRcblx0XHRcdFx0XHQvLyBUaGUgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZWl0aGVyIHdpdGggYSBiYXNpYyBjYWxsIG9yIGFuIGFwcGx5IGlmIHRoZXJlIGlzIGFuIGFyZ3MgYXJyYXlcblx0XHRcdFx0XHRsaXN0ZW5lciA9IGxpc3RlbmVyc1trZXldW2ldO1xuXG5cdFx0XHRcdFx0aWYgKGxpc3RlbmVyLm9uY2UgPT09IHRydWUpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVzcG9uc2UgPSBsaXN0ZW5lci5saXN0ZW5lci5hcHBseSh0aGlzLCBhcmdzIHx8IFtdKTtcblxuXHRcdFx0XHRcdGlmIChyZXNwb25zZSA9PT0gdGhpcy5fZ2V0T25jZVJldHVyblZhbHVlKCkpIHtcblx0XHRcdFx0XHRcdHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lci5saXN0ZW5lcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIGVtaXRFdmVudFxuXHQgKi9cblx0cHJvdG8udHJpZ2dlciA9IGFsaWFzKCdlbWl0RXZlbnQnKTtcblxuXHQvKipcblx0ICogU3VidGx5IGRpZmZlcmVudCBmcm9tIGVtaXRFdmVudCBpbiB0aGF0IGl0IHdpbGwgcGFzcyBpdHMgYXJndW1lbnRzIG9uIHRvIHRoZSBsaXN0ZW5lcnMsIGFzIG9wcG9zZWQgdG8gdGFraW5nIGEgc2luZ2xlIGFycmF5IG9mIGFyZ3VtZW50cyB0byBwYXNzIG9uLlxuXHQgKiBBcyB3aXRoIGVtaXRFdmVudCwgeW91IGNhbiBwYXNzIGEgcmVnZXggaW4gcGxhY2Ugb2YgdGhlIGV2ZW50IG5hbWUgdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHsuLi4qfSBPcHRpb25hbCBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0ID0gZnVuY3Rpb24gZW1pdChldnQpIHtcblx0XHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0cmV0dXJuIHRoaXMuZW1pdEV2ZW50KGV2dCwgYXJncyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmIGFcblx0ICogbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoZSBvbmUgc2V0IGhlcmUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWRcblx0ICogYWZ0ZXIgZXhlY3V0aW9uLiBUaGlzIHZhbHVlIGRlZmF1bHRzIHRvIHRydWUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIG5ldyB2YWx1ZSB0byBjaGVjayBmb3Igd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnNldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIHNldE9uY2VSZXR1cm5WYWx1ZSh2YWx1ZSkge1xuXHRcdHRoaXMuX29uY2VSZXR1cm5WYWx1ZSA9IHZhbHVlO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZlxuXHQgKiB0aGUgbGlzdGVuZXJzIHJldHVybiB2YWx1ZSBtYXRjaGVzIHRoaXMgb25lIHRoZW4gaXQgc2hvdWxkIGJlIHJlbW92ZWRcblx0ICogYXV0b21hdGljYWxseS4gSXQgd2lsbCByZXR1cm4gdHJ1ZSBieSBkZWZhdWx0LlxuXHQgKlxuXHQgKiBAcmV0dXJuIHsqfEJvb2xlYW59IFRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGZvciBvciB0aGUgZGVmYXVsdCwgdHJ1ZS5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gX2dldE9uY2VSZXR1cm5WYWx1ZSgpIHtcblx0XHRpZiAodGhpcy5oYXNPd25Qcm9wZXJ0eSgnX29uY2VSZXR1cm5WYWx1ZScpKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fb25jZVJldHVyblZhbHVlO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgZXZlbnRzIG9iamVjdCBhbmQgY3JlYXRlcyBvbmUgaWYgcmVxdWlyZWQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0gVGhlIGV2ZW50cyBzdG9yYWdlIG9iamVjdC5cblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRwcm90by5fZ2V0RXZlbnRzID0gZnVuY3Rpb24gX2dldEV2ZW50cygpIHtcblx0XHRyZXR1cm4gdGhpcy5fZXZlbnRzIHx8ICh0aGlzLl9ldmVudHMgPSB7fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJldmVydHMgdGhlIGdsb2JhbCB7QGxpbmsgRXZlbnRFbWl0dGVyfSB0byBpdHMgcHJldmlvdXMgdmFsdWUgYW5kIHJldHVybnMgYSByZWZlcmVuY2UgdG8gdGhpcyB2ZXJzaW9uLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gTm9uIGNvbmZsaWN0aW5nIEV2ZW50RW1pdHRlciBjbGFzcy5cblx0ICovXG5cdEV2ZW50RW1pdHRlci5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gbm9Db25mbGljdCgpIHtcblx0XHRleHBvcnRzLkV2ZW50RW1pdHRlciA9IG9yaWdpbmFsR2xvYmFsVmFsdWU7XG5cdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0fTtcblxuXHQvLyBFeHBvc2UgdGhlIGNsYXNzIGVpdGhlciB2aWEgQU1ELCBDb21tb25KUyBvciB0aGUgZ2xvYmFsIG9iamVjdFxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0ZGVmaW5lKGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdFx0fSk7XG5cdH1cblx0ZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcgJiYgbW9kdWxlLmV4cG9ydHMpe1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXHR9XG5cdGVsc2Uge1xuXHRcdHRoaXMuRXZlbnRFbWl0dGVyID0gRXZlbnRFbWl0dGVyO1xuXHR9XG59LmNhbGwodGhpcykpO1xuIl19
