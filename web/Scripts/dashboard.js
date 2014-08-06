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
  })
  .on(crudl.settings.events['editor-showed'], function (e, $editor) {
    if (locationMap)
      mapReady.refreshMap(locationMap);
  });
};

function setupCopyLocation($editor) {
  $editor.find('select.copy-location').change(function () {
    var $t = $(this);
    $t.closest('.crudl-form').reload(function () {
      return (
        $(this).data('ajax-fieldset-action').replace(/LocationID=\d+/gi, 'LocationID=' + $t.val()) +
        '&' + $t.data('extra-query')
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
    // Listen when user clicks map or move the marker to move marker or set position in the form
    google.maps.event.addListener(marker, 'dragend', saveCoordinates);
    google.maps.event.addListener(map, 'click', function (event) {
      if (!marker.getDraggable()) return;
      placeMarker(event.latLng);
      positionedByUser = true;
      foundLocations.byUser = event.latLng;
    });
    function placeMarker(latlng, dozoom, autosave) {
      marker.setPosition(latlng);
      // Move map
      map.panTo(latlng);
      saveCoordinates(autosave);
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
        $lat.val(latLng.lat()); //marker.position.Xa
        $lng.val(latLng.lng()); //marker.position.Ya
      }
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
    }

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
          if (form.elements[field].value) ad.push(form.elements[field].value);
        }
        add('addressline1');
        add('addressline2');
        add('city');
        add('postalcode');
        var s = form.elements.state;
        if (s.value) ad.push(s.options[s.selectedIndex].label);
        ad.push('USA');
        // Minimum for valid address: 4 fields filled out
        return ad.length >= 5 ? ad.join(', ') : null;
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
    l.on('click', '.options a', function () {
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
          l.find('.gps-lat, .gps-lng, .advice, .find-address-geocode').hide('fast');
          var edit = l.find('.edit-action');
          edit.text(edit.data('edit-label'));
          break;
        case 'editcoordinates':
          var a = l.find('.gps-lat, .gps-lng, .advice, .find-address-geocode');
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
          a.toggle('fast');
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
require('imagesLoaded');

var sectionSelector = '.DashboardPhotos';
// On init, the default 'no image' image src will be get it on:
var defaultImgSrc = null;

var editor = null;

exports.on = function (containerSelector) {
    var $c = $(containerSelector);

    setupCrudlDelegates($c);

    initElements($c);

    // Any time that the form content html is reloaded,
    // re-initialize elements
    $c.on('ajaxFormReturnedHtml', 'form.ajax', function () {
        initElements($c);
    });

    // Editor setup
    var $ceditor = $('.DashboardPhotos-editPhoto', $c);
    editor = new Editor({
        container: $ceditor,
        positionId: parseInt($c.closest('form').find('[name=positionID]')) || 0,
        sizeLimit: $ceditor.data('size-limit'),
        gallery: new Gallery({ container: $c })
    });

    // DEPRECATED: With refactoring, exposing javascript for the UploadPhoto Iframe on window to make
    // it available for it.
    window.initUploadPhoto = function initUploadPhoto(iframe) {
        // Document html:
        var gallery = new Gallery({ container: $('.DashboardPhotos') });
        // Iframe html:
        var $h = $('html', iframe);
        new Editor({
            container: iframe,
            positionId: $h.data('position-id'),
            sizeLimit: $h.data('size-limit'),
            gallery: gallery
        });
    };
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

    // Use given @selected or look for a selected photo in the list
    selected = selected && selected.length ? selected : $('.positionphotos-gallery > ol > li.selected', form);

    // Mark this as selected
    selected.addClass('selected').siblings().removeClass('selected');

    if (selected && selected.length > 0) {
        var selImg = selected.find('img');
        // Moving selected to be edit panel
        var photoID = selected.attr('id').match(/^UserPhoto-(\d+)$/)[1],
            photoUrl = selImg.attr('src'),
            $img = editPanel.find('img');

        editPanel.find('[name=PhotoID]').val(photoID);
        editPanel.find('[name=photoURI]').val(photoUrl);
        $img.attr('src', photoUrl + "?v=" + (new Date()).getTime()); // '?size=normal');
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
            smoothBoxBlock.open(form.find('.no-photos'), editPanel, '', { autofocus: false });
        } else {
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
    .on('click', '.positionphotos-edit-delete a', function () {

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
    // Prepare sortable script
    $(".positionphotos-gallery > ol", form).sortable({
        placeholder: "ui-state-highlight",
        update: function () {
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
        }
    });

    defaultImgSrc = form.find('img').attr('src');

    // Set primary photo to be edited
    editSelectedPhoto(form);

    // Reset delete option
    form.find('[name=delete-photo]').val('False');
}

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
    };

    this.reloadPhoto = function reloadPhoto(fileURI, photoID) {

        // Find item by ID and load with new URI
        this.$galleryList.find('#UserPhoto-' + photoID)
        .find('img')
        .attr('src', fileURI + '?v=' + (new Date()).getTime());
    };
}

/**
    Editor Class
**/
var qq = require('fileuploader');
require('jcrop');
function Editor(settings) {

    settings = settings || {};

    // f.e.: .DashboardPhotos-editPhoto
    this.$container = $(settings.container || 'html');
    this.gallery = settings.gallery || new Gallery(this.$container);
    
    var $h = $('html');
    this.positionId = settings.positionId || $h.data('position-id');
    this.sizeLimit = settings.sizeLimit || $h.data('size-limit');

    // Initializing:
    this.initUploader();
    this.initCropForm();
    //this.setupCropPhoto();
}

Editor.prototype.initUploader = function initUploader() {

    var thisEditor = this;

    var uploader = new qq.FileUploader({
        element: $('.FileUploader-uploader', this.$container).get(0),
        // path to server-side upload script
        action: LcUrl.LangPath + 'dashboard/YourWork/UploadPhoto/?PositionID=' + (this.positionId),
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
        onComplete: function (id, fileName, responseJSON) {
            if (responseJSON.success) {
                thisEditor.gallery.appendPhoto(responseJSON.fileURI, responseJSON.photoID);
                // Go to crop photo:
                thisEditor.showCropPhoto(responseJSON.fileURI, responseJSON.photoID);
            }
        },
        messages: {
            typeError: "{file} has invalid extension. Only {extensions} are allowed.",
            sizeError: "{file} is too large, maximum file size is {sizeLimit}.",
            minSizeError: "{file} is too small, minimum file size is {minSizeLimit}.",
            emptyError: "{file} is empty, please select files again without it.",
            onLeave: "The files are being uploaded, if you leave now the upload will be cancelled."
        },
        sizeLimit: this.sizeLimit || 'undefined'
    });
};

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

Editor.prototype.showCropPhoto = function showCropPhoto(photoURI, photoID) {

    var thisEditor = this;
    this.$container.find('[name=photoURI]').val(photoURI);
    this.$container.find('[name=photoID]').val(photoID);

    // Set new image
    this.$container.find('.positionphotos-edit-photo > img')
    .attr('style', '')
    .attr('src', photoURI + "?v=" + (new Date()).getTime())
    .on('load', function () {
        thisEditor.setupCropPhoto();
    });
};

Editor.prototype.initCropForm = function initCropForm() {
    
    // Setup cropping "form"
    var thisEditor = this;

    this.$container.on('click', '.DashboardPhotos-editPhoto-save', function (e) {
        e.preventDefault();

        $.ajax({
            url: LcUrl.LangPath + '$dashboard/YourWork/UploadPhoto/',
            type: 'POST',
            data: thisEditor.$container.serialize() + '&crop-photo=True',
            dataType: 'json',
            success: function (data) {
                if (data.updated) {
                    // Photo cropped, resized
                    thisEditor.gallery.reloadPhoto(data.fileURI, data.photoID);
                }
                else {
                    // Photo uploaded
                    thisEditor.appendPhoto(data.fileURI, data.photoID);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvTGNVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvUHJvdmlkZXJQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9nZ2xlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9hZGRQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2FwcG9pbnRtZW50c0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvYmFja2dyb3VuZENoZWNrUmVxdWVzdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NhbGVuZGFyU3luYy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NoYW5nZVByb2ZpbGVQaG90by5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2VkdWNhdGlvbkNydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvZ2VuZXJhdGVCb29rTm93QnV0dG9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbGljZW5zZXNDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2xvY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9tb250aGx5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9wYXltZW50QWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaWNpbmdDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaXZhY3lTZXR0aW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3NlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNBY3Rpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvd2Vla2x5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL25vZGVfbW9kdWxlcy9pbWFnZXNMb2FkZWQvaW1hZ2VzbG9hZGVkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvaW1hZ2VzTG9hZGVkL25vZGVfbW9kdWxlcy9ldmVudGllL2V2ZW50aWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL25vZGVfbW9kdWxlcy9pbWFnZXNMb2FkZWQvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiogSW1wbGVtZW50cyBhIHNpbWlsYXIgTGNVcmwgb2JqZWN0IGxpa2UgdGhlIHNlcnZlci1zaWRlIG9uZSwgYmFzaW5nXHJcbiAgICBpbiB0aGUgaW5mb3JtYXRpb24gYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGF0ICdodG1sJyB0YWcgaW4gdGhlIFxyXG4gICAgJ2RhdGEtYmFzZS11cmwnIGF0dHJpYnV0ZSAodGhhdHMgdmFsdWUgaXMgdGhlIGVxdWl2YWxlbnQgZm9yIEFwcFBhdGgpLFxyXG4gICAgYW5kIHRoZSBsYW5nIGluZm9ybWF0aW9uIGF0ICdkYXRhLWN1bHR1cmUnLlxyXG4gICAgVGhlIHJlc3Qgb2YgVVJMcyBhcmUgYnVpbHQgZm9sbG93aW5nIHRoZSB3aW5kb3cubG9jYXRpb24gYW5kIHNhbWUgcnVsZXNcclxuICAgIHRoYW4gaW4gdGhlIHNlcnZlci1zaWRlIG9iamVjdC5cclxuKiovXHJcblxyXG52YXIgYmFzZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYmFzZS11cmwnKSxcclxuICAgIGxhbmcgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKSxcclxuICAgIGwgPSB3aW5kb3cubG9jYXRpb24sXHJcbiAgICB1cmwgPSBsLnByb3RvY29sICsgJy8vJyArIGwuaG9zdDtcclxuLy8gbG9jYXRpb24uaG9zdCBpbmNsdWRlcyBwb3J0LCBpZiBpcyBub3QgdGhlIGRlZmF1bHQsIHZzIGxvY2F0aW9uLmhvc3RuYW1lXHJcblxyXG5iYXNlID0gYmFzZSB8fCAnLyc7XHJcblxyXG52YXIgTGNVcmwgPSB7XHJcbiAgICBTaXRlVXJsOiB1cmwsXHJcbiAgICBBcHBQYXRoOiBiYXNlLFxyXG4gICAgQXBwVXJsOiB1cmwgKyBiYXNlLFxyXG4gICAgTGFuZ0lkOiBsYW5nLFxyXG4gICAgTGFuZ1BhdGg6IGJhc2UgKyBsYW5nICsgJy8nLFxyXG4gICAgTGFuZ1VybDogdXJsICsgYmFzZSArIGxhbmdcclxufTtcclxuTGNVcmwuTGFuZ1VybCA9IHVybCArIExjVXJsLkxhbmdQYXRoO1xyXG5MY1VybC5Kc29uUGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ0pTT04vJztcclxuTGNVcmwuSnNvblVybCA9IHVybCArIExjVXJsLkpzb25QYXRoO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1VybDsiLCIvKiogUHJvdmlkZXJQb3NpdGlvbiBjbGFzc1xyXG4gIEl0IHByb3ZpZGVzIG1pbmltdW4gbGlrZS1qcXVlcnkgZXZlbnQgbGlzdGVuZXJzXHJcbiAgd2l0aCBtZXRob2RzICdvbicgYW5kICdvZmYnLCBhbmQgaW50ZXJuYWxseSAndGhpcy5ldmVudHMnXHJcbiAgYmVpbmcgYSBqUXVlcnkuQ2FsbGJhY2tzLlxyXG4qKi9cclxudmFyIFxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKSxcclxuICBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnTEMvYWpheENhbGxiYWNrcycpO1xyXG5cclxuLyoqIENvbnN0cnVjdG9yXHJcbioqL1xyXG52YXIgUHJvdmlkZXJQb3NpdGlvbiA9IGZ1bmN0aW9uIChwb3NpdGlvbklkKSB7XHJcbiAgdGhpcy5wb3NpdGlvbklkID0gcG9zaXRpb25JZDtcclxuXHJcbiAgLy8gRXZlbnRzIHN1cHBvcnQgdGhyb3VnaCBqcXVlcnkuQ2FsbGJhY2tcclxuICB0aGlzLmV2ZW50cyA9ICQuQ2FsbGJhY2tzKCk7XHJcbiAgdGhpcy5vbiA9IGZ1bmN0aW9uICgpIHsgdGhpcy5ldmVudHMuYWRkLmFwcGx5KHRoaXMuZXZlbnRzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTsgcmV0dXJuIHRoaXM7IH07XHJcbiAgdGhpcy5vZmYgPSBmdW5jdGlvbiAoKSB7IHRoaXMuZXZlbnRzLnJlbW92ZS5hcHBseSh0aGlzLmV2ZW50cywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7IHJldHVybiB0aGlzOyB9O1xyXG59O1xyXG5cclxuLy8gVXNpbmcgZGVmYXVsdCBjb25maWd1cmF0aW9uIGFzIHByb3RvdHlwZVxyXG5Qcm92aWRlclBvc2l0aW9uLnByb3RvdHlwZSA9IHtcclxuICBkZWNsaW5lZE1lc3NhZ2VDbGFzczogJ2luZm8nLFxyXG4gIGRlY2xpbmVkUG9wdXBDbGFzczogJ3Bvc2l0aW9uLXN0YXRlLWNoYW5nZScsXHJcbiAgc3RhdGVDaGFuZ2VkRXZlbnQ6ICdzdGF0ZS1jaGFuZ2VkJyxcclxuICBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50OiAnc3RhdGUtY2hhbmdlZC1kZWNsaW5lZCcsXHJcbiAgcmVtb3ZlRm9ybVNlbGVjdG9yOiAnLmRlbGV0ZS1tZXNzYWdlLWNvbmZpcm0nLFxyXG4gIHJlbW92ZUZvcm1Db250YWluZXI6ICcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlJyxcclxuICByZW1vdmVNZXNzYWdlQ2xhc3M6ICd3YXJuaW5nJyxcclxuICByZW1vdmVQb3B1cENsYXNzOiAncG9zaXRpb24tc3RhdGUtY2hhbmdlJyxcclxuICByZW1vdmVkRXZlbnQ6ICdyZW1vdmVkJyxcclxuICByZW1vdmVGYWlsZWRFdmVudDogJ3JlbW92ZS1mYWlsZWQnXHJcbn07XHJcblxyXG4vKiogY2hhbmdlU3RhdGUgdG8gdGhlIG9uZSBnaXZlbiwgaXQgd2lsbCByYWlzZSBhIHN0YXRlQ2hhbmdlZEV2ZW50IG9uIHN1Y2Nlc3NcclxuICBvciBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50IG9uIGVycm9yLlxyXG4gIEBzdGF0ZTogJ29uJyBvciAnb2ZmJ1xyXG4qKi9cclxuUHJvdmlkZXJQb3NpdGlvbi5wcm90b3R5cGUuY2hhbmdlU3RhdGUgPSBmdW5jdGlvbiBjaGFuZ2VQb3NpdGlvblN0YXRlKHN0YXRlKSB7XHJcbiAgdmFyIHBhZ2UgPSBzdGF0ZSA9PSAnb24nID8gJyRSZWFjdGl2YXRlJyA6ICckRGVhY3RpdmF0ZSc7XHJcbiAgdmFyICRkID0gJCgnI21haW4nKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdmFyIGN0eCA9IHsgZm9ybTogJGQsIGJveDogJGQgfTtcclxuICAkLmFqYXgoe1xyXG4gICAgdXJsOiBMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvcG9zaXRpb24vJyArIHBhZ2UgKyAnLz9Qb3NpdGlvbklEPScgKyB0aGlzLnBvc2l0aW9uSWQsXHJcbiAgICBjb250ZXh0OiBjdHgsXHJcbiAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgICAkZC5vbmUoJ2FqYXhTdWNjZXNzUG9zdCcsIGZ1bmN0aW9uIChldmVudCwgZGF0YSwgdCwgaiwgY3R4KSB7XHJcbiAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDEwMSkge1xyXG4gICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHN0YXRlKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICQoJzxkaXYvPicpLmFkZENsYXNzKHRoYXQuZGVjbGluZWRNZXNzYWdlQ2xhc3MpLmFwcGVuZChkYXRhLlJlc3VsdC5NZXNzYWdlKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihtc2csICRkLCB0aGF0LmRlY2xpbmVkUG9wdXBDbGFzcywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiBmYWxzZSwgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBQcm9jZXNzIHRoZSByZXN1bHQsIHRoYXQgZXZlbnR1YWxseSB3aWxsIGNhbGwgYWpheFN1Y2Nlc3NQb3N0XHJcbiAgICAgIGFqYXhDYWxsYmFja3MuZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBEZWxldGUgcG9zaXRpb25cclxuKiovXHJcblByb3ZpZGVyUG9zaXRpb24ucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIGRlbGV0ZVBvc2l0aW9uKCkge1xyXG5cclxuICAgIHZhciBjID0gJCh0aGlzLnJlbW92ZUZvcm1Db250YWluZXIpLFxyXG4gICAgICAgIGYgPSBjLmZpbmQodGhpcy5yZW1vdmVGb3JtU2VsZWN0b3IpLmZpcnN0KCksXHJcbiAgICAgICAgcG9wdXBGb3JtID0gZi5jbG9uZSgpLFxyXG4gICAgICAgIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgIHBvcHVwRm9ybS5vbmUoJ2FqYXhTdWNjZXNzUG9zdCcsICcuYWpheC1ib3gnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbm90aWZ5KCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGRhdGEuQ29kZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAxMDE6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5ldmVudHMuZmlyZSh0aGF0LnJlbW92ZWRFdmVudCwgW2RhdGEuUmVzdWx0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDEwMzpcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHRoYXQucmVtb3ZlRmFpbGVkRXZlbnQsIFtkYXRhLlJlc3VsdF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhLlJlc3VsdCAmJiBkYXRhLlJlc3VsdC5NZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gJCgnPGRpdi8+JykuYWRkQ2xhc3ModGhhdC5yZW1vdmVNZXNzYWdlQ2xhc3MpLmFwcGVuZChkYXRhLlJlc3VsdC5NZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIHZhciBib3ggPSBzbW9vdGhCb3hCbG9jay5vcGVuKG1zZywgYywgdGhhdC5yZW1vdmVQb3B1cENsYXNzLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IGZhbHNlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJveC5vbigneGhpZGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm90aWZ5KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vdGlmeSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE9wZW4gY29uZmlybWF0aW9uIGZvcm1cclxuICAgIHZhciBiID0gc21vb3RoQm94QmxvY2sub3Blbihwb3B1cEZvcm0sIGMsIG51bGwsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyUG9zaXRpb247IiwiLyogRm9jdXMgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlIGRvY3VtZW50IChvciBpbiBAY29udGFpbmVyKVxyXG53aXRoIHRoZSBodG1sNSBhdHRyaWJ1dGUgJ2F1dG9mb2N1cycgKG9yIGFsdGVybmF0aXZlIEBjc3NTZWxlY3RvcikuXHJcbkl0J3MgZmluZSBhcyBhIHBvbHlmaWxsIGFuZCBmb3IgYWpheCBsb2FkZWQgY29udGVudCB0aGF0IHdpbGwgbm90XHJcbmdldCB0aGUgYnJvd3NlciBzdXBwb3J0IG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBhdXRvRm9jdXMoY29udGFpbmVyLCBjc3NTZWxlY3Rvcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgZG9jdW1lbnQpO1xyXG4gICAgY29udGFpbmVyLmZpbmQoY3NzU2VsZWN0b3IgfHwgJ1thdXRvZm9jdXNdJykuZm9jdXMoKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhdXRvRm9jdXM7IiwiLyoqIEV4dGVuZGVkIHRvZ2dsZS1zaG93LWhpZGUgZnVudGlvbnMuXHJcbiAgICBJYWdvU1JMQGdtYWlsLmNvbVxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICoqL1xyXG4oZnVuY3Rpb24oKXtcclxuXHJcbiAgICAvKiogSW1wbGVtZW50YXRpb246IHJlcXVpcmUgalF1ZXJ5IGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIHRoZVxyXG4gICAgICAgIHB1YmxpYyBtZXRob2RzLlxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24geHRzaChqUXVlcnkpIHtcclxuICAgICAgICB2YXIgJCA9IGpRdWVyeTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGlkZSBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnaGlkZScgYW5kICdmYWRlT3V0JyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5mYWRlT3V0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5zbGlkZVVwKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnaGlkZSdcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAkZS5oaWRlKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hoaWRlJywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICogU2hvdyBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnc2hvdycgYW5kICdmYWRlSW4nIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm1zIGEgZml4IG9uIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzXHJcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGVycm9yIHRoYXQgcHJldmVudHMgZnJvbSBydW5uaW5nXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdHMgb24gZWxlbWVudHMgdGhhdCBhcmUgYWxyZWFkeSB2aXNpYmxlLFxyXG4gICAgICAgICAgICAvLyB3aGF0IGxldHMgdGhlIHBvc3NpYmlsaXR5IG9mIGdldCBhIG1pZGRsZS1hbmltYXRlZFxyXG4gICAgICAgICAgICAvLyBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFdlIGp1c3QgY2hhbmdlIGRpc3BsYXk6bm9uZSwgZm9yY2luZyB0byAnaXMtdmlzaWJsZScgdG9cclxuICAgICAgICAgICAgLy8gYmUgZmFsc2UgYW5kIHRoZW4gcnVubmluZyB0aGUgZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBmbGlja2VyaW5nIGVmZmVjdCwgYmVjYXVzZSBqUXVlcnkganVzdCByZXNldHNcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBvbiBlZmZlY3Qgc3RhcnQuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuZmFkZUluKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ3Nob3cnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hzaG93JywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZW5lcmljIHV0aWxpdHkgZm9yIGhpZ2hseSBjb25maWd1cmFibGUgalF1ZXJ5LnRvZ2dsZSB3aXRoIHN1cHBvcnRcclxuICAgICAgICAgICAgdG8gc3BlY2lmeSB0aGUgdG9nZ2xlIHZhbHVlIGV4cGxpY2l0eSBmb3IgYW55IGtpbmQgb2YgZWZmZWN0OiBqdXN0IHBhc3MgdHJ1ZSBhcyBzZWNvbmQgcGFyYW1ldGVyICd0b2dnbGUnIHRvIHNob3dcclxuICAgICAgICAgICAgYW5kIGZhbHNlIHRvIGhpZGUuIFRvZ2dsZSBtdXN0IGJlIHN0cmljdGx5IGEgQm9vbGVhbiB2YWx1ZSB0byBhdm9pZCBhdXRvLWRldGVjdGlvbi5cclxuICAgICAgICAgICAgVG9nZ2xlIHBhcmFtZXRlciBjYW4gYmUgb21pdHRlZCB0byBhdXRvLWRldGVjdCBpdCwgYW5kIHNlY29uZCBwYXJhbWV0ZXIgY2FuIGJlIHRoZSBhbmltYXRpb24gb3B0aW9ucy5cclxuICAgICAgICAgICAgQWxsIHRoZSBvdGhlcnMgYmVoYXZlIGV4YWN0bHkgYXMgaGlkZUVsZW1lbnQgYW5kIHNob3dFbGVtZW50LlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUVsZW1lbnQoZWxlbWVudCwgdG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBub3QgYSBib29sZWFuXHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUgIT09IHRydWUgJiYgdG9nZ2xlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIGFuIG9iamVjdCwgdGhlbiBpcyB0aGUgb3B0aW9ucyBhcyBzZWNvbmQgcGFyYW1ldGVyXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRvZ2dsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRvZ2dsZTtcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tZGV0ZWN0IHRvZ2dsZSwgaXQgY2FuIHZhcnkgb24gYW55IGVsZW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGRldGVjdGlvbiBhbmQgYWN0aW9uIG11c3QgYmUgZG9uZSBwZXIgZWxlbWVudDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV1c2luZyBmdW5jdGlvbiwgd2l0aCBleHBsaWNpdCB0b2dnbGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsICEkKHRoaXMpLmlzKCc6dmlzaWJsZScpLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUpXHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBEbyBqUXVlcnkgaW50ZWdyYXRpb24gYXMgeHRvZ2dsZSwgeHNob3csIHhoaWRlXHJcbiAgICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsdWdJbihqUXVlcnkpIHtcclxuICAgICAgICAgICAgLyoqIHRvZ2dsZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4dG9nZ2xlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnh0b2dnbGUgPSBmdW5jdGlvbiB4dG9nZ2xlKHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCB0b2dnbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogc2hvd0VsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhzaG93ID0gZnVuY3Rpb24geHNob3cob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBoaWRlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhoaWRlID0gZnVuY3Rpb24geGhpZGUob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9ydGluZzpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0b2dnbGVFbGVtZW50OiB0b2dnbGVFbGVtZW50LFxyXG4gICAgICAgICAgICBzaG93RWxlbWVudDogc2hvd0VsZW1lbnQsXHJcbiAgICAgICAgICAgIGhpZGVFbGVtZW50OiBoaWRlRWxlbWVudCxcclxuICAgICAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vZHVsZVxyXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIHh0c2gpO1xyXG4gICAgfSBlbHNlIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICAgICAgdmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0geHRzaChqUXVlcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBOb3JtYWwgc2NyaXB0IGxvYWQsIGlmIGpRdWVyeSBpcyBnbG9iYWwgKGF0IHdpbmRvdyksIGl0cyBleHRlbmRlZCBhdXRvbWF0aWNhbGx5ICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5qUXVlcnkgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICB4dHNoKHdpbmRvdy5qUXVlcnkpLnBsdWdJbih3aW5kb3cualF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLyogU29tZSB1dGlsaXRpZXMgZm9yIHVzZSB3aXRoIGpRdWVyeSBvciBpdHMgZXhwcmVzc2lvbnNcclxuICAgIHRoYXQgYXJlIG5vdCBwbHVnaW5zLlxyXG4qL1xyXG5mdW5jdGlvbiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWyAjOyYsLisqflxcJzpcIiFeJFtcXF0oKT0+fFxcL10pL2csICdcXFxcJDEnKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTogZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZVxyXG4gICAgfTtcclxuIiwiZnVuY3Rpb24gbW92ZUZvY3VzVG8oZWwsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWFyZ2luVG9wOiAzMCxcclxuICAgICAgICBkdXJhdGlvbjogNTAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChlbCkub2Zmc2V0KCkudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3AgfSwgb3B0aW9ucy5kdXJhdGlvbiwgbnVsbCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb3ZlRm9jdXNUbztcclxufSIsIi8qKiBDdXN0b20gTG9jb25vbWljcyAnbGlrZSBibG9ja1VJJyBwb3B1cHNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUsXHJcbiAgICBhdXRvRm9jdXMgPSByZXF1aXJlKCcuL2F1dG9Gb2N1cycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcblxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9jayhjb250ZW50Qm94LCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykge1xyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcclxuICAgICAgICBjZW50ZXI6IGZhbHNlLFxyXG4gICAgICAgIC8qIGFzIGEgdmFsaWQgb3B0aW9ucyBwYXJhbWV0ZXIgZm9yIExDLmhpZGVFbGVtZW50IGZ1bmN0aW9uICovXHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiA2MDAsXHJcbiAgICAgICAgICAgIGVmZmVjdDogJ2ZhZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgYXV0b2ZvY3VzT3B0aW9uczogeyBtYXJnaW5Ub3A6IDYwIH0sXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgY29udGVudEJveCA9ICQoY29udGVudEJveCk7XHJcbiAgICB2YXIgZnVsbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJsb2NrZWQgPT0gZG9jdW1lbnQgfHwgYmxvY2tlZCA9PSB3aW5kb3cpIHtcclxuICAgICAgICBibG9ja2VkID0gJCgnYm9keScpO1xyXG4gICAgICAgIGZ1bGwgPSB0cnVlO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgYmxvY2tlZCA9ICQoYmxvY2tlZCk7XHJcblxyXG4gICAgdmFyIGJveEluc2lkZUJsb2NrZWQgPSAhYmxvY2tlZC5pcygnYm9keSx0cix0aGVhZCx0Ym9keSx0Zm9vdCx0YWJsZSx1bCxvbCxkbCcpO1xyXG5cclxuICAgIC8vIEdldHRpbmcgYm94IGVsZW1lbnQgaWYgZXhpc3RzIGFuZCByZWZlcmVuY2luZ1xyXG4gICAgdmFyIGJJRCA9IGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcpO1xyXG4gICAgaWYgKCFiSUQpXHJcbiAgICAgICAgYklEID0gKGNvbnRlbnRCb3guYXR0cignaWQnKSB8fCAnJykgKyAoYmxvY2tlZC5hdHRyKCdpZCcpIHx8ICcnKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgaWYgKGJJRCA9PSAnLXNtb290aEJveEJsb2NrJykge1xyXG4gICAgICAgIGJJRCA9ICdpZC0nICsgZ3VpZEdlbmVyYXRvcigpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICB9XHJcbiAgICBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnLCBiSUQpO1xyXG4gICAgdmFyIGJveCA9ICQoJyMnICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShiSUQpKTtcclxuICAgIFxyXG4gICAgLy8gSGlkaW5nL2Nsb3NpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgIGJveC54aGlkZShvcHRpb25zLmNsb3NlT3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIFJlc3RvcmluZyB0aGUgQ1NTIHBvc2l0aW9uIGF0dHJpYnV0ZSBvZiB0aGUgYmxvY2tlZCBlbGVtZW50XHJcbiAgICAgICAgLy8gdG8gYXZvaWQgc29tZSBwcm9ibGVtcyB3aXRoIGxheW91dCBvbiBzb21lIGVkZ2UgY2FzZXMgYWxtb3N0XHJcbiAgICAgICAgLy8gdGhhdCBtYXkgYmUgbm90IGEgcHJvYmxlbSBkdXJpbmcgYmxvY2tpbmcgYnV0IHdoZW4gdW5ibG9ja2VkLlxyXG4gICAgICAgIHZhciBwcmV2ID0gYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJyk7XHJcbiAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgcHJldiB8fCAnJyk7XHJcbiAgICAgICAgYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJywgbnVsbCk7XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICBib3hjXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBudWxsLCBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcsIHRydWUpO1xyXG4gICAgYm94Yy5hcHBlbmQoY29udGVudEJveCk7XHJcbiAgICBib3hjLndpZHRoKG9wdGlvbnMud2lkdGgpO1xyXG4gICAgYm94LmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gaW5zaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQ6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIGJsb2NrZWQuY3NzKCd6LWluZGV4JykgKyAxMCk7XHJcbiAgICAgICAgaWYgKCFibG9ja2VkLmNzcygncG9zaXRpb24nKSB8fCBibG9ja2VkLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJykge1xyXG4gICAgICAgICAgICBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nLCBibG9ja2VkLmNzcygncG9zaXRpb24nKSk7XHJcbiAgICAgICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmNlbnRlciA9PT0gdHJ1ZSB8fCBvcHRpb25zLmNlbnRlciA9PT0gJ3ZlcnRpY2FsJylcclxuICAgICAgICAgICAgYm94Yy5jc3MoJ3RvcCcsIGN0IC0gYm94Yy5vdXRlckhlaWdodCh0cnVlKSAvIDIpO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmNlbnRlciA9PT0gdHJ1ZSB8fCBvcHRpb25zLmNlbnRlciA9PT0gJ2hvcml6b250YWwnKVxyXG4gICAgICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07IiwiLyoqXHJcbiAgSXQgdG9nZ2xlcyBhIGdpdmVuIHZhbHVlIHdpdGggdGhlIG5leHQgaW4gdGhlIGdpdmVuIGxpc3QsXHJcbiAgb3IgdGhlIGZpcnN0IGlmIGlzIHRoZSBsYXN0IG9yIG5vdCBtYXRjaGVkLlxyXG4gIFRoZSByZXR1cm5lZCBmdW5jdGlvbiBjYW4gYmUgdXNlZCBkaXJlY3RseSBvciBcclxuICBjYW4gYmUgYXR0YWNoZWQgdG8gYW4gYXJyYXkgKG9yIGFycmF5IGxpa2UpIG9iamVjdCBhcyBtZXRob2RcclxuICAob3IgdG8gYSBwcm90b3R5cGUgYXMgQXJyYXkucHJvdG90eXBlKSBhbmQgdXNlIGl0IHBhc3NpbmdcclxuICBvbmx5IHRoZSBmaXJzdCBhcmd1bWVudC5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9nZ2xlKGN1cnJlbnQsIGVsZW1lbnRzKSB7XHJcbiAgaWYgKHR5cGVvZiAoZWxlbWVudHMpID09PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICB0eXBlb2YgKHRoaXMubGVuZ3RoKSA9PT0gJ251bWJlcicpXHJcbiAgICBlbGVtZW50cyA9IHRoaXM7XHJcblxyXG4gIHZhciBpID0gZWxlbWVudHMuaW5kZXhPZihjdXJyZW50KTtcclxuICBpZiAoaSA+IC0xICYmIGkgPCBlbGVtZW50cy5sZW5ndGggLSAxKVxyXG4gICAgcmV0dXJuIGVsZW1lbnRzW2kgKyAxXTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZWxlbWVudHNbMF07XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgVXNlciBwcml2YXRlIGRhc2hib2FyZCBzZWN0aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG52YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnTEMvYWpheEZvcm1zJyk7XHJcblxyXG4vLyBDb2RlIG9uIHBhZ2UgcmVhZHlcclxuJChmdW5jdGlvbiAoKSB7XHJcbiAgICAvKiBTaWRlYmFyICovXHJcbiAgICB2YXIgXHJcbiAgICB0b2dnbGUgPSByZXF1aXJlKCcuLi9MQy90b2dnbGUnKSxcclxuICAgIFByb3ZpZGVyUG9zaXRpb24gPSByZXF1aXJlKCcuLi9MQy9Qcm92aWRlclBvc2l0aW9uJyk7XHJcbiAgICAvLyBBdHRhY2hpbmcgJ2NoYW5nZSBwb3NpdGlvbicgYWN0aW9uIHRvIHRoZSBzaWRlYmFyIGxpbmtzXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnW2hyZWYgPSBcIiN0b2dnbGVQb3NpdGlvblN0YXRlXCJdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBcclxuICAgICAgJHQgPSAkKHRoaXMpLFxyXG4gICAgICB2ID0gJHQudGV4dCgpLFxyXG4gICAgICBuID0gdG9nZ2xlKHYsIFsnb24nLCAnb2ZmJ10pLFxyXG4gICAgICBwb3NpdGlvbklkID0gJHQuY2xvc2VzdCgnW2RhdGEtcG9zaXRpb24taWRdJykuZGF0YSgncG9zaXRpb24taWQnKTtcclxuXHJcbiAgICAgICAgdmFyIHBvcyA9IG5ldyBQcm92aWRlclBvc2l0aW9uKHBvc2l0aW9uSWQpO1xyXG4gICAgICAgIHBvc1xyXG4gICAgLm9uKHBvcy5zdGF0ZUNoYW5nZWRFdmVudCwgZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICAgJHQudGV4dChzdGF0ZSk7XHJcbiAgICB9KVxyXG4gICAgLmNoYW5nZVN0YXRlKG4pO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcuZGVsZXRlLXBvc2l0aW9uIGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uSWQgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLXBvc2l0aW9uLWlkXScpLmRhdGEoJ3Bvc2l0aW9uLWlkJyk7XHJcbiAgICAgICAgdmFyIHBvcyA9IG5ldyBQcm92aWRlclBvc2l0aW9uKHBvc2l0aW9uSWQpO1xyXG5cclxuICAgICAgICBwb3NcclxuICAgIC5vbihwb3MucmVtb3ZlZEV2ZW50LCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICAgICAgLy8gQ3VycmVudCBwb3NpdGlvbiBwYWdlIGRvZXNuJ3QgZXhpc3QgYW55bW9yZSwgb3V0IVxyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC95b3VyLXdvcmsvJztcclxuICAgIH0pXHJcbiAgICAucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8qIFByb21vdGUgKi9cclxuICAgIHZhciBnZW5lcmF0ZUJvb2tOb3dCdXR0b24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9nZW5lcmF0ZUJvb2tOb3dCdXR0b24nKTtcclxuICAgIC8vIExpc3RlbiBvbiBEYXNoYm9hcmRQcm9tb3RlIGluc3RlYWQgb2YgdGhlIG1vcmUgY2xvc2UgY29udGFpbmVyIERhc2hib2FyZEJvb2tOb3dCdXR0b25cclxuICAgIC8vIGFsbG93cyB0byBjb250aW51ZSB3b3JraW5nIHdpdGhvdXQgcmUtYXR0YWNobWVudCBhZnRlciBodG1sLWFqYXgtcmVsb2FkcyBmcm9tIGFqYXhGb3JtLlxyXG4gICAgZ2VuZXJhdGVCb29rTm93QnV0dG9uLm9uKCcuRGFzaGJvYXJkUHJvbW90ZScpOyAvLycuRGFzaGJvYXJkQm9va05vd0J1dHRvbidcclxuXHJcbiAgICAvKiBQcml2YWN5ICovXHJcbiAgICB2YXIgcHJpdmFjeVNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpdmFjeVNldHRpbmdzJyk7XHJcbiAgICBwcml2YWN5U2V0dGluZ3Mub24oJy5EYXNoYm9hcmRQcml2YWN5Jyk7XHJcblxyXG4gICAgLyogUGF5bWVudHMgKi9cclxuICAgIHZhciBwYXltZW50QWNjb3VudCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL3BheW1lbnRBY2NvdW50Jyk7XHJcbiAgICBwYXltZW50QWNjb3VudC5vbignLkRhc2hib2FyZFBheW1lbnRzJyk7XHJcblxyXG4gICAgLyogYWJvdXQteW91ICovXHJcbiAgICAkKCdodG1sJykub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJy5EYXNoYm9hcmRBYm91dFlvdSBmb3JtLmFqYXgnLCBpbml0QWJvdXRZb3UpO1xyXG4gICAgaW5pdEFib3V0WW91KCk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIGluaXQgKi9cclxuICAgICQoJ2h0bWwnKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnLkRhc2hib2FyZFlvdXJXb3JrIGZvcm0uYWpheCcsIGluaXRZb3VyV29ya0RvbSk7XHJcbiAgICBpbml0WW91cldvcmtEb20oKTtcclxuXHJcbiAgICAvKiBBdmFpbGFiaWx0eSAqL1xyXG4gICAgaW5pdEF2YWlsYWJpbGl0eSgpO1xyXG4gICAgJCgnLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIGluaXRBdmFpbGFiaWxpdHkpO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gICAgSW5zdGFudCBzYXZpbmcgYW5kIGNvcnJlY3QgY2hhbmdlcyB0cmFja2luZ1xyXG4qKi9cclxuZnVuY3Rpb24gc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oc2VjdGlvblNlbGVjdG9yKSB7XHJcblxyXG4gICAgdmFyICRzZWN0aW9uID0gJChzZWN0aW9uU2VsZWN0b3IpO1xyXG5cclxuICAgIGlmICgkc2VjdGlvbi5kYXRhKCdpbnN0YW50LXNhdmluZycpKSB7XHJcbiAgICAgICAgJHNlY3Rpb24ub24oJ2NoYW5nZScsICc6aW5wdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGFqYXhGb3Jtcy5kb0luc3RhbnRTYXZpbmcoJHNlY3Rpb24sIFt0aGlzXSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRBYm91dFlvdSgpIHtcclxuICAgIC8qIFByb2ZpbGUgcGhvdG8gKi9cclxuICAgIHZhciBjaGFuZ2VQcm9maWxlUGhvdG8gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9jaGFuZ2VQcm9maWxlUGhvdG8nKTtcclxuICAgIGNoYW5nZVByb2ZpbGVQaG90by5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gICAgLyogQWJvdXQgeW91IC8gZWR1Y2F0aW9uICovXHJcbiAgICB2YXIgZWR1Y2F0aW9uID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvZWR1Y2F0aW9uQ3J1ZGwnKTtcclxuICAgIGVkdWNhdGlvbi5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gICAgLyogQWJvdXQgeW91IC8gdmVyaWZpY2F0aW9ucyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0FjdGlvbnMnKS5vbignLkRhc2hib2FyZFZlcmlmaWNhdGlvbnMnKTtcclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNDcnVkbCcpLm9uKCcuRGFzaGJvYXJkQWJvdXRZb3UnKTtcclxuXHJcbiAgICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gICAgc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRQdWJsaWNCaW8nKTtcclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkUGVyc29uYWxXZWJzaXRlJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRBdmFpbGFiaWxpdHkoZSkge1xyXG4gIC8vIFdlIG5lZWQgdG8gYXZvaWQgdGhpcyBsb2dpYyB3aGVuIGFuIGV2ZW50IGJ1YmJsZVxyXG4gIC8vIGZyb20gdGhlIGFueSBmaWVsZHNldC5hamF4LCBiZWNhdXNlIGl0cyBhIHN1YmZvcm0gZXZlbnRcclxuICAvLyBhbmQgbXVzdCBub3QgcmVzZXQgdGhlIG1haW4gZm9ybSAoIzUwNClcclxuICBpZiAoZSAmJiBlLnRhcmdldCAmJiAvZmllbGRzZXQvaS50ZXN0KGUudGFyZ2V0Lm5vZGVOYW1lKSlcclxuICAgIHJldHVybjtcclxuXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbW9udGhseVNjaGVkdWxlJykub24oKTtcclxuICB2YXIgd2Vla2x5ID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvd2Vla2x5U2NoZWR1bGUnKS5vbigpO1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2NhbGVuZGFyU3luYycpLm9uKCk7XHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvYXBwb2ludG1lbnRzQ3J1ZGwnKS5vbignLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpO1xyXG5cclxuICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkV2Vla2x5U2NoZWR1bGUnKTtcclxuICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZE1vbnRobHlTY2hlZHVsZScpO1xyXG4gIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gIEluaXRpYWxpemUgRG9tIGVsZW1lbnRzIGFuZCBldmVudHMgaGFuZGxlcnMgZm9yIFlvdXItd29yayBsb2dpYy5cclxuXHJcbiAgTk9URTogLkRhc2hib2FyZFlvdXJXb3JrIGlzIGFuIGFqYXgtYm94IHBhcmVudCBvZiB0aGUgZm9ybS5hamF4LCBldmVyeSBzZWN0aW9uXHJcbiAgaXMgaW5zaWRlIHRoZSBmb3JtIGFuZCByZXBsYWNlZCBvbiBodG1sIHJldHVybmVkIGZyb20gc2VydmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gaW5pdFlvdXJXb3JrRG9tKCkge1xyXG4gICAgLyogWW91ciB3b3JrIC8gcHJpY2luZyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpY2luZ0NydWRsJykub24oKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBzZXJ2aWNlcyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvc2VydmljZUF0dHJpYnV0ZXNWYWxpZGF0aW9uJykuc2V0dXAoJCgnLkRhc2hib2FyZFlvdXJXb3JrIGZvcm0nKSk7XHJcbiAgICAvLyBJbnN0YW50IHNhdmluZyBhbmQgY29ycmVjdCBjaGFuZ2VzIHRyYWNraW5nXHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZFNlcnZpY2VzJyk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gY2FuY2VsbGF0aW9uICovXHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZENhbmNlbGxhdGlvblBvbGljeScpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHNjaGVkdWxpbmcgKi9cclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkU2NoZWR1bGluZ09wdGlvbnMnKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBsb2NhdGlvbnMgKi9cclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2xvY2F0aW9uc0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIGxpY2Vuc2VzICovXHJcbiAgICByZXF1aXJlKCcuL2Rhc2hib2FyZC9saWNlbnNlc0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHBob3RvcyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUknKS5vbignLkRhc2hib2FyZFBob3RvcycpO1xyXG4gICAgLy8gUGhvdG9zVUkgaXMgc3BlY2lhbCBhbmQgY2Fubm90IGRvIGluc3RhbnQtc2F2aW5nIG9uIGZvcm0gY2hhbmdlc1xyXG4gICAgLy8gYmVjYXVzZSBvZiB0aGUgcmUtdXNlIG9mIHRoZSBlZGl0aW5nIGZvcm1cclxuICAgIC8vc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRQaG90b3MnKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyByZXZpZXdzICovXHJcbiAgICAkKCcuRGFzaGJvYXJkWW91cldvcmsnKS5vbignYWpheFN1Y2Nlc3NQb3N0JywgJ2Zvcm0nLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcclxuICAgICAgICAvLyBSZXNldGluZyB0aGUgZW1haWwgYWRkcmVzc2VzIG9uIHN1Y2Nlc3MgdG8gYXZvaWQgcmVzZW5kIGFnYWluIG1lc3NhZ2VzIGJlY2F1c2VcclxuICAgICAgICAvLyBtaXN0YWtlIG9mIGEgc2Vjb25kIHN1Ym1pdC5cclxuICAgICAgICB2YXIgdGIgPSAkKCcuRGFzaGJvYXJkUmV2aWV3cyBbbmFtZT1jbGllbnRzZW1haWxzXScpO1xyXG4gICAgICAgIC8vIE9ubHkgaWYgdGhlcmUgd2FzIGEgdmFsdWU6XHJcbiAgICAgICAgaWYgKHRiLnZhbCgpKSB7XHJcbiAgICAgICAgICAgIHRiXHJcbiAgICAgIC52YWwoJycpXHJcbiAgICAgIC5hdHRyKCdwbGFjZWhvbGRlcicsIHRiLmRhdGEoJ3N1Y2Nlc3MtbWVzc2FnZScpKVxyXG4gICAgICAgICAgICAvLyBzdXBwb3J0IGZvciBJRSwgJ25vbi1wbGFjZWhvbGRlci1icm93c2VycydcclxuICAgICAgLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gYWRkLXBvc2l0aW9uICovXHJcbiAgICB2YXIgYWRkUG9zaXRpb24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9hZGRQb3NpdGlvbicpO1xyXG4gICAgYWRkUG9zaXRpb24uaW5pdCgnLkRhc2hib2FyZEFkZFBvc2l0aW9uJyk7XHJcbiAgICAkKCdib2R5Jykub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJy5EYXNoYm9hcmRBZGRQb3NpdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBhZGRQb3NpdGlvbi5pbml0KCk7XHJcbiAgICB9KTtcclxufSIsIi8qKlxyXG4qIEFkZCBQb3NpdGlvbjogbG9naWMgZm9yIHRoZSBhZGQtcG9zaXRpb24gcGFnZSB1bmRlciAvZGFzaGJvYXJkL3lvdXItd29yay8wLyxcclxuICB3aXRoIGF1dG9jb21wbGV0ZSwgcG9zaXRpb24gZGVzY3JpcHRpb24gYW5kICdhZGRlZCBwb3NpdGlvbnMnIGxpc3QuXHJcblxyXG4gIFRPRE86IENoZWNrIGlmIGlzIG1vcmUgY29udmVuaWVudCBhIHJlZmFjdG9yIGFzIHBhcnQgb2YgTEMvUHJvdmlkZXJQb3NpdGlvbi5qc1xyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc2VsZWN0b3JzID0ge1xyXG4gIGxpc3Q6ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24tcG9zaXRpb25zTGlzdCcsXHJcbiAgc2VsZWN0UG9zaXRpb246ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24tc2VsZWN0UG9zaXRpb24nLFxyXG4gIGRlc2M6ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24tc2VsZWN0UG9zaXRpb24tZGVzY3JpcHRpb24nXHJcbn07XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0QWRkUG9zaXRpb24oc2VsZWN0b3IpIHtcclxuICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24nO1xyXG4gIHZhciBjID0gJChzZWxlY3Rvcik7XHJcblxyXG4gIC8vIFRlbXBsYXRlIHBvc2l0aW9uIGl0ZW0gdmFsdWUgbXVzdCBiZSByZXNldCBvbiBpbml0IChiZWNhdXNlIHNvbWUgZm9ybS1yZWNvdmVyaW5nIGJyb3dzZXIgZmVhdHVyZXMgdGhhdCBwdXQgb24gaXQgYmFkIHZhbHVlcylcclxuICBjLmZpbmQoc2VsZWN0b3JzLmxpc3QgKyAnIGxpLmlzLXRlbXBsYXRlIFtuYW1lPXBvc2l0aW9uXScpLnZhbCgnJyk7XHJcblxyXG4gIC8vIEF1dG9jb21wbGV0ZSBwb3NpdGlvbnMgYW5kIGFkZCB0byB0aGUgbGlzdFxyXG4gIHZhciBwb3NpdGlvbnNMaXN0ID0gbnVsbCwgdHBsID0gbnVsbDtcclxuICB2YXIgcG9zaXRpb25zQXV0b2NvbXBsZXRlID0gYy5maW5kKCcuRGFzaGJvYXJkQWRkUG9zaXRpb24tc2VsZWN0UG9zaXRpb24tc2VhcmNoJykuYXV0b2NvbXBsZXRlKHtcclxuICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgIG1pbkxlbmd0aDogMCxcclxuICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG5cclxuICAgICAgcG9zaXRpb25zTGlzdCA9IHBvc2l0aW9uc0xpc3QgfHwgYy5maW5kKHNlbGVjdG9ycy5saXN0ICsgJyA+IHVsJyk7XHJcbiAgICAgIHRwbCA9IHRwbCB8fCBwb3NpdGlvbnNMaXN0LmNoaWxkcmVuKCcuaXMtdGVtcGxhdGU6ZXEoMCknKTtcclxuICAgICAgLy8gTm8gdmFsdWUsIG5vIGFjdGlvbiA6KFxyXG4gICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnZhbHVlKSByZXR1cm47XHJcblxyXG4gICAgICAvLyBBZGQgaWYgbm90IGV4aXN0cyBpbiB0aGUgbGlzdFxyXG4gICAgICBpZiAocG9zaXRpb25zTGlzdC5jaGlsZHJlbigpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICQodGhpcykuZGF0YSgncG9zaXRpb24taWQnKSA9PSB1aS5pdGVtLnZhbHVlO1xyXG4gICAgICB9KS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAvLyBDcmVhdGUgaXRlbSBmcm9tIHRlbXBsYXRlOlxyXG4gICAgICAgIHBvc2l0aW9uc0xpc3QuYXBwZW5kKHRwbC5jbG9uZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdpcy10ZW1wbGF0ZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmRhdGEoJ3Bvc2l0aW9uLWlkJywgdWkuaXRlbS52YWx1ZSlcclxuICAgICAgICAgICAgICAgICAgICAuY2hpbGRyZW4oJy5uYW1lJykudGV4dCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpIC8vIC5sYWJlbFxyXG4gICAgICAgICAgICAgICAgICAgIC5lbmQoKS5jaGlsZHJlbignW25hbWU9cG9zaXRpb25dJykudmFsKHVpLml0ZW0udmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLmVuZCgpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgYy5maW5kKHNlbGVjdG9ycy5kZXNjICsgJyA+IHRleHRhcmVhJykudmFsKHVpLml0ZW0uZGVzY3JpcHRpb24pO1xyXG5cclxuICAgICAgLy8gV2Ugd2FudCBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGZvY3VzOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBMb2FkIGFsbCBwb3NpdGlvbnMgaW4gYmFja2dyb3VuZCB0byByZXBsYWNlIHRoZSBhdXRvY29tcGxldGUgc291cmNlIChhdm9pZGluZyBtdWx0aXBsZSwgc2xvdyBsb29rLXVwcylcclxuICAvKiQuZ2V0SlNPTihMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgZnVuY3Rpb24gKGRhdGEpIHtcclxuICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdvcHRpb24nLCAnc291cmNlJywgZGF0YSk7XHJcbiAgfVxyXG4gICk7Ki9cclxuXHJcbiAgLy8gU2hvdyBhdXRvY29tcGxldGUgb24gJ3BsdXMnIGJ1dHRvblxyXG4gIGMuZmluZChzZWxlY3RvcnMuc2VsZWN0UG9zaXRpb24gKyAnIC5hZGQtYWN0aW9uJykuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgcG9zaXRpb25zQXV0b2NvbXBsZXRlLmF1dG9jb21wbGV0ZSgnc2VhcmNoJywgJycpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICAvLyBSZW1vdmUgcG9zaXRpb25zIGZyb20gdGhlIGxpc3RcclxuICBjLmZpbmQoc2VsZWN0b3JzLmxpc3QgKyAnID4gdWwnKS5vbignY2xpY2snLCAnbGkgPiBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIGlmICgkdC5hdHRyKCdocmVmJykgPT0gJyNyZW1vdmUtcG9zaXRpb24nKSB7XHJcbiAgICAgIC8vIFJlbW92ZSBjb21wbGV0ZSBlbGVtZW50IGZyb20gdGhlIGxpc3QgKGxhYmVsIGFuZCBoaWRkZW4gZm9ybSB2YWx1ZSlcclxuICAgICAgJHQucGFyZW50KCkucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBBdmFpbGFiaWxpdHk6IGNhbGVuZGFyIGFwcG9pbnRtZW50cyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG5cclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGNydWRsU2VsZWN0b3IgPSAnLkRhc2hib2FyZEFwcG9pbnRtZW50cycsXHJcbiAgICAkY3J1ZGxDb250YWluZXIgPSAkYy5maW5kKGNydWRsU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRjcnVkbENvbnRhaW5lci5zaWJsaW5ncygpXHJcbiAgICAgICAgLmFkZCgkY3J1ZGxDb250YWluZXIuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAgIC5hZGQoJGNydWRsQ29udGFpbmVyLmNsb3Nlc3QoJy5EYXNoYm9hcmRBdmFpbGFiaWxpdHknKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGNydWRsU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCBlZGl0b3IpIHtcclxuICAgIC8vIERvbmUgYWZ0ZXIgYSBzbWFsbCBkZWxheSB0byBsZXQgdGhlIGVkaXRvciBiZSB2aXNpYmxlXHJcbiAgICAvLyBhbmQgc2V0dXAgd29yayBhcyBleHBlY3RlZFxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGVkaXRGb3JtU2V0dXAoZWRpdG9yKTtcclxuICAgIH0sIDEwMCk7XHJcbiAgfSk7XHJcblxyXG59O1xyXG5cclxuZnVuY3Rpb24gZWRpdEZvcm1TZXR1cChmKSB7XHJcbiAgdmFyIHJlcGVhdCA9IGYuZmluZCgnW25hbWU9cmVwZWF0XScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYSA9IGYuZmluZCgnLnJlcGVhdC1vcHRpb25zJyk7XHJcbiAgICBpZiAodGhpcy5jaGVja2VkKVxyXG4gICAgICBhLnNsaWRlRG93bignZmFzdCcpO1xyXG4gICAgZWxzZVxyXG4gICAgICBhLnNsaWRlVXAoJ2Zhc3QnKTtcclxuICB9KTtcclxuICB2YXIgYWxsZGF5ID0gZi5maW5kKCdbbmFtZT1hbGxkYXldJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZlxyXG4gICAgLmZpbmQoJ1tuYW1lPXN0YXJ0dGltZV0sW25hbWU9ZW5kdGltZV0nKVxyXG4gICAgLnByb3AoJ2Rpc2FibGVkJywgdGhpcy5jaGVja2VkKTtcclxuICAgIGlmICh0aGlzLmNoZWNrZWQpXHJcbiAgICAgIGEuaGlkZSgnZmFzdCcpO1xyXG4gICAgZWxzZVxyXG4gICAgICBhLnNob3coJ2Zhc3QnKTtcclxuICB9KTtcclxuICB2YXIgcmVwZWF0RnJlcXVlbmN5ID0gZi5maW5kKCdbbmFtZT1yZXBlYXQtZnJlcXVlbmN5XScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgZnJlcSA9ICQodGhpcykuY2hpbGRyZW4oJzpzZWxlY3RlZCcpO1xyXG4gICAgdmFyIHVuaXQgPSBmcmVxLmRhdGEoJ3VuaXQnKTtcclxuICAgIGZcclxuICAgIC5maW5kKCcucmVwZWF0LWZyZXF1ZW5jeS11bml0JylcclxuICAgIC50ZXh0KHVuaXQpO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gdW5pdCwgdGhlcmUgaXMgbm90IGludGVydmFsL3JlcGVhdC1ldmVyeSBmaWVsZDpcclxuICAgIHZhciBpbnRlcnZhbCA9IGYuZmluZCgnLnJlcGVhdC1ldmVyeScpO1xyXG4gICAgaWYgKHVuaXQpXHJcbiAgICAgIGludGVydmFsLnNob3coJ2Zhc3QnKTtcclxuICAgIGVsc2VcclxuICAgICAgaW50ZXJ2YWwuaGlkZSgnZmFzdCcpO1xyXG4gICAgLy8gU2hvdyBmcmVxdWVuY3ktZXh0cmEsIGlmIHRoZXJlIGlzIHNvbWVvbmVcclxuICAgIGYuZmluZCgnLmZyZXF1ZW5jeS1leHRyYS0nICsgZnJlcS52YWwoKSkuc2xpZGVEb3duKCdmYXN0Jyk7XHJcbiAgICAvLyBIaWRlIGFsbCBvdGhlciBmcmVxdWVuY3ktZXh0cmFcclxuICAgIGYuZmluZCgnLmZyZXF1ZW5jeS1leHRyYTpub3QoLmZyZXF1ZW5jeS1leHRyYS0nICsgZnJlcS52YWwoKSArICcpJykuc2xpZGVVcCgnZmFzdCcpO1xyXG4gIH0pO1xyXG4gIC8vIGF1dG8tc2VsZWN0IHNvbWUgb3B0aW9ucyB3aGVuIGl0cyB2YWx1ZSBjaGFuZ2VcclxuICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1vY3VycmVuY2VzXScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1lbmRzXVt2YWx1ZT1vY3VycmVuY2VzXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcclxuICB9KTtcclxuICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1lbmQtZGF0ZV0nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgZi5maW5kKCdbbmFtZT1yZXBlYXQtZW5kc11bdmFsdWU9ZGF0ZV0nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgfSk7XHJcbiAgLy8gc3RhcnQtZGF0ZSB0cmlnZ2VyXHJcbiAgZi5maW5kKCdbbmFtZT1zdGFydGRhdGVdJykub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIGF1dG8gZmlsbCBlbmRkYXRlIHdpdGggc3RhcnRkYXRlIHdoZW4gdGhpcyBsYXN0IGlzIHVwZGF0ZWRcclxuICAgIGYuZmluZCgnW25hbWU9ZW5kZGF0ZV0nKS52YWwodGhpcy52YWx1ZSk7XHJcbiAgICAvLyBpZiBubyB3ZWVrLWRheXMgb3Igb25seSBvbmUsIGF1dG8tc2VsZWN0IHRoZSBkYXkgdGhhdCBtYXRjaHMgc3RhcnQtZGF0ZVxyXG4gICAgdmFyIHdlZWtEYXlzID0gZi5maW5kKCcud2Vla2x5LWV4dHJhIC53ZWVrLWRheXMgaW5wdXQnKTtcclxuICAgIGlmICh3ZWVrRGF5cy5hcmUoJzpjaGVja2VkJywgeyB1bnRpbDogMSB9KSkge1xyXG4gICAgICB2YXIgZGF0ZSA9ICQodGhpcykuZGF0ZXBpY2tlcihcImdldERhdGVcIik7XHJcbiAgICAgIGlmIChkYXRlKSB7XHJcbiAgICAgICAgd2Vla0RheXMucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgICB3ZWVrRGF5cy5maWx0ZXIoJ1t2YWx1ZT0nICsgZGF0ZS5nZXREYXkoKSArICddJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIEluaXQ6XHJcbiAgcmVwZWF0LmNoYW5nZSgpO1xyXG4gIGFsbGRheS5jaGFuZ2UoKTtcclxuICByZXBlYXRGcmVxdWVuY3kuY2hhbmdlKCk7XHJcbiAgLy8gYWRkIGRhdGUgcGlja2Vyc1xyXG4gIGFwcGx5RGF0ZVBpY2tlcigpO1xyXG4gIC8vIGFkZCBwbGFjZWhvbGRlciBzdXBwb3J0IChwb2x5ZmlsbClcclxuICBmLmZpbmQoJzppbnB1dCcpLnBsYWNlaG9sZGVyKCk7XHJcbn0iLCIvKipcclxuICBSZXF1ZXN0aW5nIGEgYmFja2dyb3VuZCBjaGVjayB0aHJvdWdoIHRoZSBiYWNrZ3JvdW5kQ2hlY2tFZGl0IGZvcm0gaW5zaWRlIGFib3V0LXlvdS92ZXJpZmljYXRpb25zLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8qKlxyXG4gIFNldHVwIHRoZSBET00gZWxlbWVudHMgaW4gdGhlIGNvbnRhaW5lciBAJGNcclxuICB3aXRoIHRoZSBiYWNrZ3JvdW5kLWNoZWNrLXJlcXVlc3QgbG9naWMuXHJcbioqL1xyXG5leHBvcnRzLnNldHVwRm9ybSA9IGZ1bmN0aW9uIHNldHVwRm9ybUJhY2tncm91bmRDaGVjaygkYykge1xyXG5cclxuICB2YXIgc2VsZWN0ZWRJdGVtID0gbnVsbDtcclxuXHJcbiAgJGMub24oJ2NsaWNrJywgJy5idXktYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIFxyXG4gICAgdmFyIGYgPSAkYy5maW5kKCcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrLXJlcXVlc3RGb3JtJyk7XHJcbiAgICB2YXIgYmNpZCA9ICQodGhpcykuZGF0YSgnYmFja2dyb3VuZC1jaGVjay1pZCcpO1xyXG4gICAgc2VsZWN0ZWRJdGVtID0gJCh0aGlzKS5jbG9zZXN0KCcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrLWl0ZW0nKTtcclxuICAgIHZhciBwczEgPSAkYy5maW5kKCcucG9wdXAuYnV5LXN0ZXAtMScpO1xyXG5cclxuICAgIGYuZmluZCgnW25hbWU9QmFja2dyb3VuZENoZWNrSURdJykudmFsKGJjaWQpO1xyXG4gICAgZi5maW5kKCcubWFpbi1hY3Rpb24nKS52YWwoJCh0aGlzKS50ZXh0KCkpO1xyXG5cclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4ocHMxLCAkYywgJ2JhY2tncm91bmQtY2hlY2snKTtcclxuICB9KTtcclxuXHJcbiAgJGMub24oJ2FqYXhTdWNjZXNzUG9zdCcsICcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrLXJlcXVlc3RGb3JtJywgZnVuY3Rpb24gKGUsIGRhdGEsIHRleHQsIGp4LCBjdHgpIHtcclxuICAgIGlmIChkYXRhLkNvZGUgPT09IDExMCkge1xyXG4gICAgICB2YXIgcHMyID0gJGMuZmluZCgnLnBvcHVwLmJ1eS1zdGVwLTInKTtcclxuICAgICAgdmFyIGJveCA9IHNtb290aEJveEJsb2NrLm9wZW4ocHMyLCAkYywgJ2JhY2tncm91bmQtY2hlY2snKTtcclxuICAgICAgLy8gUmVtb3ZlIGZyb20gdGhlIGxpc3QgdGhlIHJlcXVlc3RlZCBpdGVtXHJcbiAgICAgIHNlbGVjdGVkSXRlbS5yZW1vdmUoKTtcclxuICAgICAgLy8gRm9yY2Ugdmlld2VyIGxpc3QgcmVsb2FkXHJcbiAgICAgICRjLnRyaWdnZXIoJ3JlbG9hZExpc3QnKTtcclxuICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gbW9yZSBpdGVtcyBpbiB0aGUgbGlzdDpcclxuICAgICAgaWYgKCRjLmZpbmQoJy5EYXNoYm9hcmRCYWNrZ3JvdW5kQ2hlY2staXRlbScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIC8vIHRoZSBjbG9zZSBidXR0b24gb24gdGhlIHBvcHVwIG11c3QgY2xvc2UgdGhlIGVkaXRvciB0b286XHJcbiAgICAgICAgYm94LmZpbmQoJy5jbG9zZS1hY3Rpb24nKS5hZGRDbGFzcygnY3J1ZGwtY2FuY2VsJyk7XHJcbiAgICAgICAgLy8gVGhlIGFjdGlvbiBib3ggbXVzdCBkaXNhcHBlYXJcclxuICAgICAgICAkYy5jbG9zZXN0KCcuY3J1ZGwnKS5maW5kKCcuQmFja2dyb3VuZENoZWNrQWN0aW9uQm94JykucmVtb3ZlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuXHJcbn07IiwiLyoqIEF2YWlsYWJpbGl0eTogQ2FsZW5kYXIgU3luYyBzZWN0aW9uIHNldHVwXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gICAgY29udGFpbmVyU2VsZWN0b3IgPSBjb250YWluZXJTZWxlY3RvciB8fCAnLkRhc2hib2FyZENhbGVuZGFyU3luYyc7XHJcbiAgICB2YXIgY29udGFpbmVyID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICAgICAgZmllbGRTZWxlY3RvciA9ICcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jLXByaXZhdGVVcmxGaWVsZCcsXHJcbiAgICAgICAgYnV0dG9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZENhbGVuZGFyU3luYy1yZXNldC1hY3Rpb24nO1xyXG5cclxuICAgIC8vIFNlbGVjdGluZyBwcml2YXRlLXVybCBmaWVsZCB2YWx1ZSBvbiBmb2N1cyBhbmQgY2xpY2s6XHJcbiAgICBjb250YWluZXIuZmluZChmaWVsZFNlbGVjdG9yKS5vbignZm9jdXMgY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3QoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlc2V0aW5nIHByaXZhdGUtdXJsXHJcbiAgICBjb250YWluZXJcclxuICAub24oJ2NsaWNrJywgYnV0dG9uU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgIHZhciB0ID0gJCh0aGlzKSxcclxuICAgICAgdXJsID0gdC5hdHRyKCdocmVmJyksXHJcbiAgICAgIGZpZWxkID0gY29udGFpbmVyLmZpbmQoZmllbGRTZWxlY3Rvcik7XHJcblxyXG4gICAgICBmaWVsZC52YWwoJycpO1xyXG5cclxuICAgICAgZnVuY3Rpb24gb25lcnJvcigpIHtcclxuICAgICAgICAgIGZpZWxkLnZhbChmaWVsZC5kYXRhKCdlcnJvci1tZXNzYWdlJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAkLmdldEpTT04odXJsLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgZmllbGQudmFsKGRhdGEuUmVzdWx0KS5jaGFuZ2UoKTtcclxuICAgICAgICAgICAgICBmaWVsZFswXS5zZWxlY3QoKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgb25lcnJvcigpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9KS5mYWlsKG9uZXJyb3IpO1xyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG59OyIsIi8qKiBjaGFuZ2VQcm9maWxlUGhvdG8sIGl0IHVzZXMgJ3VwbG9hZGVyJyB1c2luZyBodG1sNSwgYWpheCBhbmQgYSBzcGVjaWZpYyBwYWdlXHJcbiAgdG8gbWFuYWdlIHNlcnZlci1zaWRlIHVwbG9hZCBvZiBhIG5ldyB1c2VyIHByb2ZpbGUgcGhvdG8uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCdMQy9zbW9vdGhCb3hCbG9jaycpO1xyXG4vLyBUT0RPOiByZWltcGxlbWVudCB0aGlzIGFuZCB0aGUgc2VydmVyLXNpZGUgZmlsZSB0byBhdm9pZCBpZnJhbWVzIGFuZCBleHBvc2luZyBnbG9iYWwgZnVuY3Rpb25zLFxyXG4vLyBkaXJlY3QgQVBJIHVzZSB3aXRob3V0IGlmcmFtZS1ub3JtYWwgcG9zdCBzdXBwb3J0IChjdXJyZW50IGJyb3dzZXIgbWF0cml4IGFsbG93IHVzIHRoaXM/KVxyXG4vLyBUT0RPOiBpbXBsZW1lbnQgYXMgcmVhbCBtb2R1bGFyLCBuZXh0IGFyZSB0aGUga25vd2VkIG1vZHVsZXMgaW4gdXNlIGJ1dCBub3QgbG9hZGluZyB0aGF0IGFyZSBleHBlY3RlZFxyXG4vLyB0byBiZSBpbiBzY29wZSByaWdodCBub3cgYnV0IG11c3QgYmUgdXNlZCB3aXRoIHRoZSBuZXh0IGNvZGUgdW5jb21tZW50ZWQuXHJcbi8vIHJlcXVpcmUoJ3VwbG9hZGVyJyk7XHJcbi8vIHJlcXVpcmUoJ0xjVXJsJyk7XHJcbi8vIHZhciBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuLi9MQy9ibG9ja1ByZXNldHMnKVxyXG4vLyB2YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgICAgICB1c2VyUGhvdG9Qb3B1cDtcclxuXHJcbiAgICAkYy5vbignY2xpY2snLCAnW2hyZWY9XCIjY2hhbmdlLXByb2ZpbGUtcGhvdG9cIl0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdXNlclBob3RvUG9wdXAgPSBwb3B1cChMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvQWJvdXRZb3UvQ2hhbmdlUGhvdG8vJywgeyB3aWR0aDogNzAwLCBoZWlnaHQ6IDY3MCB9LCBudWxsLCBudWxsLCB7IGF1dG9Gb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTk9URTogV2UgYXJlIGV4cG9zaW5nIGdsb2JhbCBmdW5jdGlvbnMgZnJvbSBoZXJlIGJlY2F1c2UgdGhlIHNlcnZlciBwYWdlL2lmcmFtZSBleHBlY3RzIHRoaXNcclxuICAgIC8vIHRvIHdvcmsuXHJcbiAgICAvLyBUT0RPOiByZWZhY3RvciB0byBhdm9pZCB0aGlzIHdheS5cclxuICAgIHdpbmRvdy5yZWxvYWRVc2VyUGhvdG8gPSBmdW5jdGlvbiByZWxvYWRVc2VyUGhvdG8oKSB7XHJcbiAgICAgICAgJGMuZmluZCgnLkRhc2hib2FyZFB1YmxpY0Jpby1waG90byAuYXZhdGFyJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBzcmMgPSB0aGlzLmdldEF0dHJpYnV0ZSgnc3JjJyk7XHJcbiAgICAgICAgICAgIC8vIGF2b2lkIGNhY2hlIHRoaXMgdGltZVxyXG4gICAgICAgICAgICBzcmMgPSBzcmMgKyBcIj92PVwiICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHNyYyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHdpbmRvdy5jbG9zZVBvcHVwVXNlclBob3RvID0gZnVuY3Rpb24gY2xvc2VQb3B1cFVzZXJQaG90bygpIHtcclxuICAgICAgICBpZiAodXNlclBob3RvUG9wdXApIHtcclxuICAgICAgICAgICAgdXNlclBob3RvUG9wdXAuZmluZCgnLmNsb3NlLXBvcHVwJykudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHdpbmRvdy5kZWxldGVVc2VyUGhvdG8gPSBmdW5jdGlvbiBkZWxldGVVc2VyUGhvdG8oKSB7XHJcblxyXG4gICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbigkKCc8ZGl2Lz4nKS5odG1sKExDLmJsb2NrUHJlc2V0cy5sb2FkaW5nLm1lc3NhZ2UpLCAkKCdib2R5JyksICcnLCB7IGNlbnRlcjogJ2hvcml6b250YWwnIH0pO1xyXG5cclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IExjVXJsLkxhbmdVcmwgKyBcImRhc2hib2FyZC9BYm91dFlvdS9DaGFuZ2VQaG90by8/ZGVsZXRlPXRydWVcIixcclxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gKGRhdGEuQ29kZSA9PT0gMCA/IGRhdGEuUmVzdWx0IDogZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCQoJzxkaXYvPicpLnRleHQoY29udGVudCksICQoJ2JvZHknKSwgJycsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogJ2hvcml6b250YWwnIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlbG9hZFVzZXJQaG90bygpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxufTtcclxuIiwiLyoqIEVkdWNhdGlvbiBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vcmVxdWlyZSgnTEMvanF1ZXJ5Lnh0c2gnKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgc2VjdGlvblNlbGVjdG9yID0gJy5EYXNoYm9hcmRFZHVjYXRpb24nLFxyXG4gICAgJHNlY3Rpb24gPSAkYy5maW5kKHNlY3Rpb25TZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJHNlY3Rpb24uc2libGluZ3MoKVxyXG4gICAgICAgIC5hZGQoJHNlY3Rpb24uZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAgIC5hZGQoJHNlY3Rpb24uY2xvc2VzdCgnLkRhc2hib2FyZEFib3V0WW91Jykuc2libGluZ3MoKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChzZWN0aW9uU2VsZWN0b3IpO1xyXG4gIC8vY3J1ZGwuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSA9IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9O1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICAvLyBTZXR1cCBhdXRvY29tcGxldGVcclxuICAgICRlZGl0b3IuZmluZCgnW25hbWU9aW5zdGl0dXRpb25dJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRJbnN0aXR1dGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgIGRlbGF5OiAyMDAsXHJcbiAgICAgIG1pbkxlbmd0aDogNVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gIGdlbmVyYXRlQm9va05vd0J1dHRvbjogd2l0aCB0aGUgcHJvcGVyIGh0bWwgYW5kIGZvcm1cclxuICByZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciBjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gIGZ1bmN0aW9uIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCkge1xyXG4gICAgdmFyXHJcbiAgICAgIHNpemUgPSBjLmZpbmQoJ1tuYW1lPXNpemVdOmNoZWNrZWQnKS52YWwoKSxcclxuICAgICAgcG9zaXRpb25pZCA9IGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF06Y2hlY2tlZCcpLnZhbCgpLFxyXG4gICAgICBzb3VyY2VDb250YWluZXIgPSBjLmZpbmQoJ1tuYW1lPWJ1dHRvbi1zb3VyY2UtY29kZV0nKSxcclxuICAgICAgcHJldmlld0NvbnRhaW5lciA9IGMuZmluZCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uU2l6ZXMtcHJldmlldycpLFxyXG4gICAgICBidXR0b25UcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtYnV0dG9uVGVtcGxhdGUnKS50ZXh0KCksXHJcbiAgICAgIGxpbmtUcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtbGlua1RlbXBsYXRlJykudGV4dCgpLFxyXG4gICAgICB0cGwgPSAoc2l6ZSA9PSAnbGluay1vbmx5JyA/IGxpbmtUcGwgOiBidXR0b25UcGwpLFxyXG4gICAgICB0cGxWYXJzID0gJCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uQ29kZScpO1xyXG5cclxuICAgIHByZXZpZXdDb250YWluZXIuaHRtbCh0cGwpO1xyXG4gICAgcHJldmlld0NvbnRhaW5lci5maW5kKCdhJykuYXR0cignaHJlZicsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS11cmwnKSArIChwb3NpdGlvbmlkID8gcG9zaXRpb25pZCArICcvJyA6ICcnKSk7XHJcbiAgICBwcmV2aWV3Q29udGFpbmVyLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS1zcmMnKSArIHNpemUpO1xyXG4gICAgc291cmNlQ29udGFpbmVyLnZhbChwcmV2aWV3Q29udGFpbmVyLmh0bWwoKS50cmltKCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gRmlyc3QgZ2VuZXJhdGlvblxyXG4gIGlmIChjLmxlbmd0aCA+IDApIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCk7XHJcbiAgLy8gYW5kIG9uIGFueSBmb3JtIGNoYW5nZVxyXG4gIGMub24oJ2NoYW5nZScsICdpbnB1dCcsIHJlZ2VuZXJhdGVCdXR0b25Db2RlKTtcclxufTsiLCIvKiogTGljZW5zZXMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGxpY2Vuc2VzU2VsZWN0b3IgPSAnLkRhc2hib2FyZExpY2Vuc2VzJyxcclxuICAgICRsaWNlbnNlcyA9ICRjLmZpbmQobGljZW5zZXNTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGxpY2Vuc2VzLnNpYmxpbmdzKClcclxuICAgICAgLmFkZCgkbGljZW5zZXMuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAuYWRkKCRsaWNlbnNlcy5jbG9zZXN0KCcuRGFzaGJvYXJkWW91cldvcmsnKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGxpY2Vuc2VzU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogTG9jYXRpb25zIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIG1hcFJlYWR5ID0gcmVxdWlyZSgnTEMvZ29vZ2xlTWFwUmVhZHknKTtcclxuLy8gSW5kaXJlY3RseSB1c2VkOiByZXF1aXJlKCdMQy9oYXNDb25maXJtU3VwcG9ydCcpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGxvY2F0aW9uc1NlbGVjdG9yID0gJy5EYXNoYm9hcmRMb2NhdGlvbnMnLFxyXG4gICAgJGxvY2F0aW9ucyA9ICRjLmZpbmQobG9jYXRpb25zU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRsb2NhdGlvbnMuc2libGluZ3MoKVxyXG4gICAgICAuYWRkKCRsb2NhdGlvbnMuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAuYWRkKCRsb2NhdGlvbnMuY2xvc2VzdCgnLkRhc2hib2FyZFlvdXJXb3JrJykuc2libGluZ3MoKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChsb2NhdGlvbnNTZWxlY3Rvcik7XHJcblxyXG4gIHZhciBsb2NhdGlvbk1hcDtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG4gICAgLy9Gb3JjZSBleGVjdXRpb24gb2YgdGhlICdoYXMtY29uZmlybScgc2NyaXB0XHJcbiAgICAkZWRpdG9yLmZpbmQoJ2ZpZWxkc2V0Lmhhcy1jb25maXJtID4gLmNvbmZpcm0gaW5wdXQnKS5jaGFuZ2UoKTtcclxuXHJcbiAgICBzZXR1cENvcHlMb2NhdGlvbigkZWRpdG9yKTtcclxuXHJcbiAgICBsb2NhdGlvbk1hcCA9IHNldHVwR2VvcG9zaXRpb25pbmcoJGVkaXRvcik7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICBpZiAobG9jYXRpb25NYXApXHJcbiAgICAgIG1hcFJlYWR5LnJlZnJlc2hNYXAobG9jYXRpb25NYXApO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gc2V0dXBDb3B5TG9jYXRpb24oJGVkaXRvcikge1xyXG4gICRlZGl0b3IuZmluZCgnc2VsZWN0LmNvcHktbG9jYXRpb24nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICR0LmNsb3Nlc3QoJy5jcnVkbC1mb3JtJykucmVsb2FkKGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICAkKHRoaXMpLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJykucmVwbGFjZSgvTG9jYXRpb25JRD1cXGQrL2dpLCAnTG9jYXRpb25JRD0nICsgJHQudmFsKCkpICtcclxuICAgICAgICAnJicgKyAkdC5kYXRhKCdleHRyYS1xdWVyeScpXHJcbiAgICAgICk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqIExvY2F0ZSB1c2VyIHBvc2l0aW9uIG9yIHRyYW5zbGF0ZSBhZGRyZXNzIHRleHQgaW50byBhIGdlb2NvZGUgdXNpbmdcclxuICBicm93c2VyIGFuZCBHb29nbGUgTWFwcyBzZXJ2aWNlcy5cclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwR2VvcG9zaXRpb25pbmcoJGVkaXRvcikge1xyXG4gIHZhciBtYXA7XHJcbiAgbWFwUmVhZHkoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIC8vIFJlZ2lzdGVyIGlmIHVzZXIgc2VsZWN0cyBvciB3cml0ZXMgYSBwb3NpdGlvbiAodG8gbm90IG92ZXJ3cml0ZSBpdCB3aXRoIGF1dG9tYXRpYyBwb3NpdGlvbmluZylcclxuICAgIHZhciBwb3NpdGlvbmVkQnlVc2VyID0gZmFsc2U7XHJcbiAgICAvLyBTb21lIGNvbmZzXHJcbiAgICB2YXIgZGV0YWlsZWRab29tTGV2ZWwgPSAxNztcclxuICAgIHZhciBnZW5lcmFsWm9vbUxldmVsID0gOTtcclxuICAgIHZhciBmb3VuZExvY2F0aW9ucyA9IHtcclxuICAgICAgYnlVc2VyOiBudWxsLFxyXG4gICAgICBieUdlb2xvY2F0aW9uOiBudWxsLFxyXG4gICAgICBieUdlb2NvZGU6IG51bGwsXHJcbiAgICAgIG9yaWdpbmFsOiBudWxsXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciBsID0gJGVkaXRvci5maW5kKCcubG9jYXRpb24tbWFwJyk7XHJcbiAgICB2YXIgbSA9IGwuZmluZCgnLm1hcC1zZWxlY3RvciA+IC5nb29nbGUtbWFwJykuZ2V0KDApO1xyXG4gICAgdmFyICRsYXQgPSBsLmZpbmQoJ1tuYW1lPWxhdGl0dWRlXScpO1xyXG4gICAgdmFyICRsbmcgPSBsLmZpbmQoJ1tuYW1lPWxvbmdpdHVkZV0nKTtcclxuXHJcbiAgICAvLyBDcmVhdGluZyBwb3NpdGlvbiBjb29yZGluYXRlc1xyXG4gICAgdmFyIG15TGF0bG5nO1xyXG4gICAgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIF9sYXRfdmFsdWUgPSAkbGF0LnZhbCgpLCBfbG5nX3ZhbHVlID0gJGxuZy52YWwoKTtcclxuICAgICAgaWYgKF9sYXRfdmFsdWUgJiYgX2xuZ192YWx1ZSkge1xyXG4gICAgICAgIG15TGF0bG5nID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZygkbGF0LnZhbCgpLCAkbG5nLnZhbCgpKTtcclxuICAgICAgICAvLyBXZSBjb25zaWRlciBhcyAncG9zaXRpb25lZCBieSB1c2VyJyB3aGVuIHRoZXJlIHdhcyBhIHNhdmVkIHZhbHVlIGZvciB0aGUgcG9zaXRpb24gY29vcmRpbmF0ZXMgKHdlIGFyZSBlZGl0aW5nIGEgbG9jYXRpb24pXHJcbiAgICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IChteUxhdGxuZy5sYXQoKSAhPT0gMCAmJiBteUxhdGxuZy5sbmcoKSAhPT0gMCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gRGVmYXVsdCBwb3NpdGlvbiB3aGVuIHRoZXJlIGFyZSBub3Qgb25lIChTYW4gRnJhbmNpc2NvIGp1c3Qgbm93KTpcclxuICAgICAgICBteUxhdGxuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoMzcuNzUzMzQ0MzkyMjYyOTgsIC0xMjIuNDI1NDYwNjAzNTE1Nik7XHJcbiAgICAgIH1cclxuICAgIH0pKCk7XHJcbiAgICAvLyBSZW1lbWJlciBvcmlnaW5hbCBmb3JtIGxvY2F0aW9uXHJcbiAgICBmb3VuZExvY2F0aW9ucy5vcmlnaW5hbCA9IGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCA9IG15TGF0bG5nO1xyXG5cclxuICAgIC8vIENyZWF0ZSBtYXBcclxuICAgIHZhciBtYXBPcHRpb25zID0ge1xyXG4gICAgICB6b29tOiAocG9zaXRpb25lZEJ5VXNlciA/IGRldGFpbGVkWm9vbUxldmVsIDogZ2VuZXJhbFpvb21MZXZlbCksIC8vIEJlc3QgZGV0YWlsIHdoZW4gd2UgYWxyZWFkeSBoYWQgYSBsb2NhdGlvblxyXG4gICAgICBjZW50ZXI6IG15TGF0bG5nLFxyXG4gICAgICBtYXBUeXBlSWQ6IGdvb2dsZS5tYXBzLk1hcFR5cGVJZC5ST0FETUFQXHJcbiAgICB9O1xyXG4gICAgbWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChtLCBtYXBPcHRpb25zKTtcclxuICAgIC8vIENyZWF0ZSB0aGUgcG9zaXRpb24gbWFya2VyXHJcbiAgICB2YXIgbWFya2VyID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcih7XHJcbiAgICAgIHBvc2l0aW9uOiBteUxhdGxuZyxcclxuICAgICAgbWFwOiBtYXAsXHJcbiAgICAgIGRyYWdnYWJsZTogZmFsc2UsXHJcbiAgICAgIGFuaW1hdGlvbjogZ29vZ2xlLm1hcHMuQW5pbWF0aW9uLkRST1BcclxuICAgIH0pO1xyXG4gICAgLy8gTGlzdGVuIHdoZW4gdXNlciBjbGlja3MgbWFwIG9yIG1vdmUgdGhlIG1hcmtlciB0byBtb3ZlIG1hcmtlciBvciBzZXQgcG9zaXRpb24gaW4gdGhlIGZvcm1cclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ2RyYWdlbmQnLCBzYXZlQ29vcmRpbmF0ZXMpO1xyXG4gICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgaWYgKCFtYXJrZXIuZ2V0RHJhZ2dhYmxlKCkpIHJldHVybjtcclxuICAgICAgcGxhY2VNYXJrZXIoZXZlbnQubGF0TG5nKTtcclxuICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IHRydWU7XHJcbiAgICAgIGZvdW5kTG9jYXRpb25zLmJ5VXNlciA9IGV2ZW50LmxhdExuZztcclxuICAgIH0pO1xyXG4gICAgZnVuY3Rpb24gcGxhY2VNYXJrZXIobGF0bG5nLCBkb3pvb20sIGF1dG9zYXZlKSB7XHJcbiAgICAgIG1hcmtlci5zZXRQb3NpdGlvbihsYXRsbmcpO1xyXG4gICAgICAvLyBNb3ZlIG1hcFxyXG4gICAgICBtYXAucGFuVG8obGF0bG5nKTtcclxuICAgICAgc2F2ZUNvb3JkaW5hdGVzKGF1dG9zYXZlKTtcclxuICAgICAgaWYgKGRvem9vbSlcclxuICAgICAgLy8gU2V0IHpvb20gdG8gc29tZXRoaW5nIG1vcmUgZGV0YWlsZWRcclxuICAgICAgICBtYXAuc2V0Wm9vbShkZXRhaWxlZFpvb21MZXZlbCk7XHJcbiAgICAgIHJldHVybiBtYXJrZXI7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBzYXZlQ29vcmRpbmF0ZXMoaW5Gb3JtKSB7XHJcbiAgICAgIHZhciBsYXRMbmcgPSBtYXJrZXIuZ2V0UG9zaXRpb24oKTtcclxuICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IHRydWU7XHJcbiAgICAgIGZvdW5kTG9jYXRpb25zLmJ5VXNlciA9IGxhdExuZztcclxuICAgICAgaWYgKGluRm9ybSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICRsYXQudmFsKGxhdExuZy5sYXQoKSk7IC8vbWFya2VyLnBvc2l0aW9uLlhhXHJcbiAgICAgICAgJGxuZy52YWwobGF0TG5nLmxuZygpKTsgLy9tYXJrZXIucG9zaXRpb24uWWFcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gTGlzdGVuIHdoZW4gdXNlciBjaGFuZ2VzIGZvcm0gY29vcmRpbmF0ZXMgdmFsdWVzIHRvIHVwZGF0ZSB0aGUgbWFwXHJcbiAgICAkbGF0LmNoYW5nZSh1cGRhdGVNYXBNYXJrZXIpO1xyXG4gICAgJGxuZy5jaGFuZ2UodXBkYXRlTWFwTWFya2VyKTtcclxuICAgIGZ1bmN0aW9uIHVwZGF0ZU1hcE1hcmtlcigpIHtcclxuICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IHRydWU7XHJcbiAgICAgIHZhciBuZXdQb3MgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKCRsYXQudmFsKCksICRsbmcudmFsKCkpO1xyXG4gICAgICAvLyBNb3ZlIG1hcmtlclxyXG4gICAgICBtYXJrZXIuc2V0UG9zaXRpb24obmV3UG9zKTtcclxuICAgICAgLy8gTW92ZSBtYXBcclxuICAgICAgbWFwLnBhblRvKG5ld1Bvcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyo9PT09PT09PT09PT09PT09PT09XHJcbiAgICAqIEFVVE8gUE9TSVRJT05JTkdcclxuICAgICovXHJcbiAgICBmdW5jdGlvbiB1c2VHZW9sb2NhdGlvbihmb3JjZSwgYXV0b3NhdmUpIHtcclxuICAgICAgdmFyIG92ZXJyaWRlID0gZm9yY2UgfHwgIXBvc2l0aW9uZWRCeVVzZXI7XHJcbiAgICAgIC8vIFVzZSBicm93c2VyIGdlb2xvY2F0aW9uIHN1cHBvcnQgdG8gZ2V0IGFuIGF1dG9tYXRpYyBsb2NhdGlvbiBpZiB0aGVyZSBpcyBubyBhIGxvY2F0aW9uIHNlbGVjdGVkIGJ5IHVzZXJcclxuICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgYnJvd3NlciBzdXBwb3J0cyBnZW9sb2NhdGlvbi5cclxuICAgICAgaWYgKG92ZXJyaWRlICYmIG5hdmlnYXRvci5nZW9sb2NhdGlvbikge1xyXG5cclxuICAgICAgICAvLyBUaGlzIGlzIHRoZSBsb2NhdGlvbiBtYXJrZXIgdGhhdCB3ZSB3aWxsIGJlIHVzaW5nXHJcbiAgICAgICAgLy8gb24gdGhlIG1hcC4gTGV0J3Mgc3RvcmUgYSByZWZlcmVuY2UgdG8gaXQgaGVyZSBzb1xyXG4gICAgICAgIC8vIHRoYXQgaXQgY2FuIGJlIHVwZGF0ZWQgaW4gc2V2ZXJhbCBwbGFjZXMuXHJcbiAgICAgICAgdmFyIGxvY2F0aW9uTWFya2VyID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gR2V0IHRoZSBsb2NhdGlvbiBvZiB0aGUgdXNlcidzIGJyb3dzZXIgdXNpbmcgdGhlXHJcbiAgICAgICAgLy8gbmF0aXZlIGdlb2xvY2F0aW9uIHNlcnZpY2UuIFdoZW4gd2UgaW52b2tlIHRoaXMgbWV0aG9kXHJcbiAgICAgICAgLy8gb25seSB0aGUgZmlyc3QgY2FsbGJhY2sgaXMgcmVxdWllZC4gVGhlIHNlY29uZFxyXG4gICAgICAgIC8vIGNhbGxiYWNrIC0gdGhlIGVycm9yIGhhbmRsZXIgLSBhbmQgdGhlIHRoaXJkXHJcbiAgICAgICAgLy8gYXJndW1lbnQgLSBvdXIgY29uZmlndXJhdGlvbiBvcHRpb25zIC0gYXJlIG9wdGlvbmFsLlxyXG4gICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5nZXRDdXJyZW50UG9zaXRpb24oXHJcbiAgICAgICAgICBmdW5jdGlvbiAocG9zaXRpb24pIHtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZXJlIGlzIGFscmVhZHkgYSBsb2NhdGlvbi5cclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYSBidWcgaW4gRmlyZUZveCB3aGVyZSB0aGlzIGdldHNcclxuICAgICAgICAgICAgLy8gaW52b2tlZCBtb3JlIHRoYW4gb25jZSB3aXRoIGEgY2FjaGVkIHJlc3VsdC5cclxuICAgICAgICAgICAgaWYgKGxvY2F0aW9uTWFya2VyKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBNb3ZlIG1hcmtlciB0byB0aGUgbWFwIHVzaW5nIHRoZSBwb3NpdGlvbiwgb25seSBpZiB1c2VyIGRvZXNuJ3Qgc2V0IGEgcG9zaXRpb25cclxuICAgICAgICAgICAgaWYgKG92ZXJyaWRlKSB7XHJcbiAgICAgICAgICAgICAgdmFyIGxhdExuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoXHJcbiAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubGF0aXR1ZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubG9uZ2l0dWRlXHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgbG9jYXRpb25NYXJrZXIgPSBwbGFjZU1hcmtlcihsYXRMbmcsIHRydWUsIGF1dG9zYXZlKTtcclxuICAgICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5ieUdlb2xvY2F0aW9uID0gbGF0TG5nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUubG9nKSBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyB3ZW50IHdyb25nOiBcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdGltZW91dDogKDUgKiAxMDAwKSxcclxuICAgICAgICAgICAgbWF4aW11bUFnZTogKDEwMDAgKiA2MCAqIDE1KSxcclxuICAgICAgICAgICAgZW5hYmxlSGlnaEFjY3VyYWN5OiB0cnVlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcblxyXG4gICAgICAgIC8vIE5vdyB0aGF0IHdlIGhhdmUgYXNrZWQgZm9yIHRoZSBwb3NpdGlvbiBvZiB0aGUgdXNlcixcclxuICAgICAgICAvLyBsZXQncyB3YXRjaCB0aGUgcG9zaXRpb24gdG8gc2VlIGlmIGl0IHVwZGF0ZXMuIFRoaXNcclxuICAgICAgICAvLyBjYW4gaGFwcGVuIGlmIHRoZSB1c2VyIHBoeXNpY2FsbHkgbW92ZXMsIG9mIGlmIG1vcmVcclxuICAgICAgICAvLyBhY2N1cmF0ZSBsb2NhdGlvbiBpbmZvcm1hdGlvbiBoYXMgYmVlbiBmb3VuZCAoZXguXHJcbiAgICAgICAgLy8gR1BTIHZzLiBJUCBhZGRyZXNzKS5cclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIE5PVEU6IFRoaXMgYWN0cyBtdWNoIGxpa2UgdGhlIG5hdGl2ZSBzZXRJbnRlcnZhbCgpLFxyXG4gICAgICAgIC8vIGludm9raW5nIHRoZSBnaXZlbiBjYWxsYmFjayBhIG51bWJlciBvZiB0aW1lcyB0b1xyXG4gICAgICAgIC8vIG1vbml0b3IgdGhlIHBvc2l0aW9uLiBBcyBzdWNoLCBpdCByZXR1cm5zIGEgXCJ0aW1lciBJRFwiXHJcbiAgICAgICAgLy8gdGhhdCBjYW4gYmUgdXNlZCB0byBsYXRlciBzdG9wIHRoZSBtb25pdG9yaW5nLlxyXG4gICAgICAgIHZhciBwb3NpdGlvblRpbWVyID0gbmF2aWdhdG9yLmdlb2xvY2F0aW9uLndhdGNoUG9zaXRpb24oXHJcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIE1vdmUgYWdhaW4gdG8gdGhlIG5ldyBvciBhY2N1cmF0ZWQgcG9zaXRpb24sIGlmIHVzZXIgZG9lc24ndCBzZXQgYSBwb3NpdGlvblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvdmVycmlkZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgdmFyIGxhdExuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmNvb3Jkcy5sYXRpdHVkZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbk1hcmtlciA9IHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbiA9IGxhdExuZztcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5jbGVhcldhdGNoKHBvc2l0aW9uVGltZXIpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gSWYgdGhlIHBvc2l0aW9uIGhhc24ndCB1cGRhdGVkIHdpdGhpbiA1IG1pbnV0ZXMsIHN0b3BcclxuICAgICAgICAvLyBtb25pdG9yaW5nIHRoZSBwb3NpdGlvbiBmb3IgY2hhbmdlcy5cclxuICAgICAgICBzZXRUaW1lb3V0KFxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgdGhlIHBvc2l0aW9uIHdhdGNoZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgbmF2aWdhdG9yLmdlb2xvY2F0aW9uLmNsZWFyV2F0Y2gocG9zaXRpb25UaW1lcik7XHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICgxMDAwICogNjAgKiA1KVxyXG4gICAgICAgICAgICAgICk7XHJcbiAgICAgIH0gLy8gRW5kcyBnZW9sb2NhdGlvbiBwb3NpdGlvblxyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gdXNlR21hcHNHZW9jb2RlKGluaXRpYWxMb29rdXAsIGF1dG9zYXZlKSB7XHJcbiAgICAgIHZhciBnZW9jb2RlciA9IG5ldyBnb29nbGUubWFwcy5HZW9jb2RlcigpO1xyXG5cclxuICAgICAgLy8gbG9va3VwIG9uIGFkZHJlc3MgZmllbGRzIGNoYW5nZXMgd2l0aCBjb21wbGV0ZSBpbmZvcm1hdGlvblxyXG4gICAgICB2YXIgJGZvcm0gPSAkZWRpdG9yLmZpbmQoJy5jcnVkbC1mb3JtJyksIGZvcm0gPSAkZm9ybS5nZXQoMCk7XHJcbiAgICAgIGZ1bmN0aW9uIGdldEZvcm1BZGRyZXNzKCkge1xyXG4gICAgICAgIHZhciBhZCA9IFtdO1xyXG4gICAgICAgIGZ1bmN0aW9uIGFkZChmaWVsZCkge1xyXG4gICAgICAgICAgaWYgKGZvcm0uZWxlbWVudHNbZmllbGRdLnZhbHVlKSBhZC5wdXNoKGZvcm0uZWxlbWVudHNbZmllbGRdLnZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYWRkKCdhZGRyZXNzbGluZTEnKTtcclxuICAgICAgICBhZGQoJ2FkZHJlc3NsaW5lMicpO1xyXG4gICAgICAgIGFkZCgnY2l0eScpO1xyXG4gICAgICAgIGFkZCgncG9zdGFsY29kZScpO1xyXG4gICAgICAgIHZhciBzID0gZm9ybS5lbGVtZW50cy5zdGF0ZTtcclxuICAgICAgICBpZiAocy52YWx1ZSkgYWQucHVzaChzLm9wdGlvbnNbcy5zZWxlY3RlZEluZGV4XS5sYWJlbCk7XHJcbiAgICAgICAgYWQucHVzaCgnVVNBJyk7XHJcbiAgICAgICAgLy8gTWluaW11bSBmb3IgdmFsaWQgYWRkcmVzczogNCBmaWVsZHMgZmlsbGVkIG91dFxyXG4gICAgICAgIHJldHVybiBhZC5sZW5ndGggPj0gNSA/IGFkLmpvaW4oJywgJykgOiBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgICRmb3JtLm9uKCdjaGFuZ2UnLCAnW25hbWU9YWRkcmVzc2xpbmUxXSwgW25hbWU9YWRkcmVzc2xpbmUyXSwgW25hbWU9Y2l0eV0sIFtuYW1lPXBvc3RhbGNvZGVdLCBbbmFtZT1zdGF0ZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGFkZHJlc3MgPSBnZXRGb3JtQWRkcmVzcygpO1xyXG4gICAgICAgIGlmIChhZGRyZXNzKVxyXG4gICAgICAgICAgZ2VvY29kZUxvb2t1cChhZGRyZXNzLCBmYWxzZSk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gSW5pdGlhbCBsb29rdXBcclxuICAgICAgaWYgKGluaXRpYWxMb29rdXApIHtcclxuICAgICAgICB2YXIgYWRkcmVzcyA9IGdldEZvcm1BZGRyZXNzKCk7XHJcbiAgICAgICAgaWYgKGFkZHJlc3MpXHJcbiAgICAgICAgICBnZW9jb2RlTG9va3VwKGFkZHJlc3MsIHRydWUpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBmdW5jdGlvbiBnZW9jb2RlTG9va3VwKGFkZHJlc3MsIG92ZXJyaWRlKSB7XHJcbiAgICAgICAgZ2VvY29kZXIuZ2VvY29kZSh7ICdhZGRyZXNzJzogYWRkcmVzcyB9LCBmdW5jdGlvbiAocmVzdWx0cywgc3RhdHVzKSB7XHJcbiAgICAgICAgICBpZiAoc3RhdHVzID09IGdvb2dsZS5tYXBzLkdlb2NvZGVyU3RhdHVzLk9LKSB7XHJcbiAgICAgICAgICAgIHZhciBsYXRMbmcgPSByZXN1bHRzWzBdLmdlb21ldHJ5LmxvY2F0aW9uO1xyXG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbygnR2VvY29kZSByZXRyaWV2ZWQ6ICcgKyBsYXRMbmcgKyAnIGZvciBhZGRyZXNzIFwiJyArIGFkZHJlc3MgKyAnXCInKTtcclxuICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlHZW9jb2RlID0gbGF0TG5nO1xyXG5cclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIobGF0TG5nLCB0cnVlLCBhdXRvc2F2ZSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdHZW9jb2RlIHdhcyBub3Qgc3VjY2Vzc2Z1bCBmb3IgdGhlIGZvbGxvd2luZyByZWFzb246ICcgKyBzdGF0dXMgKyAnIG9uIGFkZHJlc3MgXCInICsgYWRkcmVzcyArICdcIicpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRXhlY3V0aW5nIGF1dG8gcG9zaXRpb25pbmcgKGNoYW5nZWQgdG8gYXV0b3NhdmU6dHJ1ZSB0byBhbGwgdGltZSBzYXZlIHRoZSBsb2NhdGlvbik6XHJcbiAgICAvL3VzZUdlb2xvY2F0aW9uKHRydWUsIGZhbHNlKTtcclxuICAgIHVzZUdtYXBzR2VvY29kZShmYWxzZSwgdHJ1ZSk7XHJcblxyXG4gICAgLy8gTGluayBvcHRpb25zIGxpbmtzOlxyXG4gICAgbC5vbignY2xpY2snLCAnLm9wdGlvbnMgYScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHRhcmdldCA9ICQodGhpcykuYXR0cignaHJlZicpLnN1YnN0cigxKTtcclxuICAgICAgc3dpdGNoICh0YXJnZXQpIHtcclxuICAgICAgICBjYXNlICdnZW9sb2NhdGlvbic6XHJcbiAgICAgICAgICBpZiAoZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbilcclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIoZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbiwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHVzZUdlb2xvY2F0aW9uKHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZ2VvY29kZSc6XHJcbiAgICAgICAgICBpZiAoZm91bmRMb2NhdGlvbnMuYnlHZW9jb2RlKVxyXG4gICAgICAgICAgICBwbGFjZU1hcmtlcihmb3VuZExvY2F0aW9ucy5ieUdlb2NvZGUsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB1c2VHbWFwc0dlb2NvZGUodHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdjb25maXJtJzpcclxuICAgICAgICAgIHNhdmVDb29yZGluYXRlcyh0cnVlKTtcclxuICAgICAgICAgIG1hcmtlci5zZXREcmFnZ2FibGUoZmFsc2UpO1xyXG4gICAgICAgICAgZm91bmRMb2NhdGlvbnMuY29uZmlybWVkID0gbWFya2VyLmdldFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICBsLmZpbmQoJy5ncHMtbGF0LCAuZ3BzLWxuZywgLmFkdmljZSwgLmZpbmQtYWRkcmVzcy1nZW9jb2RlJykuaGlkZSgnZmFzdCcpO1xyXG4gICAgICAgICAgdmFyIGVkaXQgPSBsLmZpbmQoJy5lZGl0LWFjdGlvbicpO1xyXG4gICAgICAgICAgZWRpdC50ZXh0KGVkaXQuZGF0YSgnZWRpdC1sYWJlbCcpKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2VkaXRjb29yZGluYXRlcyc6XHJcbiAgICAgICAgICB2YXIgYSA9IGwuZmluZCgnLmdwcy1sYXQsIC5ncHMtbG5nLCAuYWR2aWNlLCAuZmluZC1hZGRyZXNzLWdlb2NvZGUnKTtcclxuICAgICAgICAgIHZhciBiID0gIWEuaXMoJzp2aXNpYmxlJyk7XHJcbiAgICAgICAgICBtYXJrZXIuc2V0RHJhZ2dhYmxlKGIpO1xyXG4gICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgIGlmIChiKSB7XHJcbiAgICAgICAgICAgICR0LmRhdGEoJ2VkaXQtbGFiZWwnLCAkdC50ZXh0KCkpO1xyXG4gICAgICAgICAgICAkdC50ZXh0KCR0LmRhdGEoJ2NhbmNlbC1sYWJlbCcpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICR0LnRleHQoJHQuZGF0YSgnZWRpdC1sYWJlbCcpKTtcclxuICAgICAgICAgICAgLy8gUmVzdG9yZSBsb2NhdGlvbjpcclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIoZm91bmRMb2NhdGlvbnMuY29uZmlybWVkLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGEudG9nZ2xlKCdmYXN0Jyk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBtYXA7XHJcbn0iLCIvKmdsb2JhbCB3aW5kb3cgKi9cclxuLyoqIFVJIGxvZ2ljIHRvIG1hbmFnZSBwcm92aWRlciBwaG90b3MgKHlvdXItd29yay9waG90b3MpLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJ0xDL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnTEMvY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5yZXF1aXJlKCdpbWFnZXNMb2FkZWQnKTtcclxuXHJcbnZhciBzZWN0aW9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZFBob3Rvcyc7XHJcbi8vIE9uIGluaXQsIHRoZSBkZWZhdWx0ICdubyBpbWFnZScgaW1hZ2Ugc3JjIHdpbGwgYmUgZ2V0IGl0IG9uOlxyXG52YXIgZGVmYXVsdEltZ1NyYyA9IG51bGw7XHJcblxyXG52YXIgZWRpdG9yID0gbnVsbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICAgIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAgIHNldHVwQ3J1ZGxEZWxlZ2F0ZXMoJGMpO1xyXG5cclxuICAgIGluaXRFbGVtZW50cygkYyk7XHJcblxyXG4gICAgLy8gQW55IHRpbWUgdGhhdCB0aGUgZm9ybSBjb250ZW50IGh0bWwgaXMgcmVsb2FkZWQsXHJcbiAgICAvLyByZS1pbml0aWFsaXplIGVsZW1lbnRzXHJcbiAgICAkYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGluaXRFbGVtZW50cygkYyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBFZGl0b3Igc2V0dXBcclxuICAgIHZhciAkY2VkaXRvciA9ICQoJy5EYXNoYm9hcmRQaG90b3MtZWRpdFBob3RvJywgJGMpO1xyXG4gICAgZWRpdG9yID0gbmV3IEVkaXRvcih7XHJcbiAgICAgICAgY29udGFpbmVyOiAkY2VkaXRvcixcclxuICAgICAgICBwb3NpdGlvbklkOiBwYXJzZUludCgkYy5jbG9zZXN0KCdmb3JtJykuZmluZCgnW25hbWU9cG9zaXRpb25JRF0nKSkgfHwgMCxcclxuICAgICAgICBzaXplTGltaXQ6ICRjZWRpdG9yLmRhdGEoJ3NpemUtbGltaXQnKSxcclxuICAgICAgICBnYWxsZXJ5OiBuZXcgR2FsbGVyeSh7IGNvbnRhaW5lcjogJGMgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIERFUFJFQ0FURUQ6IFdpdGggcmVmYWN0b3JpbmcsIGV4cG9zaW5nIGphdmFzY3JpcHQgZm9yIHRoZSBVcGxvYWRQaG90byBJZnJhbWUgb24gd2luZG93IHRvIG1ha2VcclxuICAgIC8vIGl0IGF2YWlsYWJsZSBmb3IgaXQuXHJcbiAgICB3aW5kb3cuaW5pdFVwbG9hZFBob3RvID0gZnVuY3Rpb24gaW5pdFVwbG9hZFBob3RvKGlmcmFtZSkge1xyXG4gICAgICAgIC8vIERvY3VtZW50IGh0bWw6XHJcbiAgICAgICAgdmFyIGdhbGxlcnkgPSBuZXcgR2FsbGVyeSh7IGNvbnRhaW5lcjogJCgnLkRhc2hib2FyZFBob3RvcycpIH0pO1xyXG4gICAgICAgIC8vIElmcmFtZSBodG1sOlxyXG4gICAgICAgIHZhciAkaCA9ICQoJ2h0bWwnLCBpZnJhbWUpO1xyXG4gICAgICAgIG5ldyBFZGl0b3Ioe1xyXG4gICAgICAgICAgICBjb250YWluZXI6IGlmcmFtZSxcclxuICAgICAgICAgICAgcG9zaXRpb25JZDogJGguZGF0YSgncG9zaXRpb24taWQnKSxcclxuICAgICAgICAgICAgc2l6ZUxpbWl0OiAkaC5kYXRhKCdzaXplLWxpbWl0JyksXHJcbiAgICAgICAgICAgIGdhbGxlcnk6IGdhbGxlcnlcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn07XHJcblxyXG5mdW5jdGlvbiBzYXZlKGRhdGEpIHtcclxuICAgIFxyXG4gICAgdmFyIGVkaXRQYW5lbCA9ICQoc2VjdGlvblNlbGVjdG9yKTtcclxuXHJcbiAgICByZXR1cm4gJC5hamF4KHtcclxuICAgICAgICB1cmw6IGVkaXRQYW5lbC5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpLFxyXG4gICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgdHlwZTogJ3Bvc3QnLFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhICYmIGRhdGEuQ29kZSA8IDApIHtcclxuICAgICAgICAgICAgICAgIC8vIG5ldyBlcnJvciBmb3IgUHJvbWlzZS1hdHRhY2hlZCBjYWxsYmFja3NcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihkYXRhLkVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZWdpc3RlciBjaGFuZ2VzXHJcbiAgICAgICAgICAgICAgICB2YXIgJGMgPSAkKHNlY3Rpb25TZWxlY3Rvcik7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZSgkYy5jbG9zZXN0KCdmb3JtJykuZ2V0KDApLCAkYy5maW5kKCc6aW5wdXQnKS50b0FycmF5KCkpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgdGV4dCwgZXJyb3IpIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogYmV0dGVyIGVycm9yIG1hbmFnZW1lbnQsIHNhdmluZ1xyXG4gICAgICAgICAgICBhbGVydCgnU29ycnksIHRoZXJlIHdhcyBhbiBlcnJvci4gJyArIChlcnJvciB8fCAnJykpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzYXZlRWRpdGVkUGhvdG8oJGYpIHtcclxuXHJcbiAgICB2YXIgaWQgPSAkZi5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbCgpLFxyXG4gICAgICAgIGNhcHRpb24gPSAkZi5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbCgpLFxyXG4gICAgICAgIGlzUHJpbWFyeSA9ICRmLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dOmNoZWNrZWQnKS52YWwoKSA9PT0gJ1RydWUnO1xyXG5cclxuICAgIGlmIChpZCAmJiBpZCA+IDApIHtcclxuICAgICAgICAvLyBBamF4IHNhdmVcclxuICAgICAgICBzYXZlKHtcclxuICAgICAgICAgICAgUGhvdG9JRDogaWQsXHJcbiAgICAgICAgICAgICdwaG90by1jYXB0aW9uJzogY2FwdGlvbixcclxuICAgICAgICAgICAgJ2lzLXByaW1hcnktcGhvdG8nOiBpc1ByaW1hcnksXHJcbiAgICAgICAgICAgIHJlc3VsdDogJ2pzb24nXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gVXBkYXRlIGNhY2hlIGF0IGdhbGxlcnkgaXRlbVxyXG4gICAgICAgIHZhciAkaXRlbSA9ICRmLmZpbmQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ICNVc2VyUGhvdG8tJyArIGlkKSxcclxuICAgICAgICAgICAgJGltZyA9ICRpdGVtLmZpbmQoJ2ltZycpO1xyXG5cclxuICAgICAgICBpZiAoJGl0ZW0gJiYgJGl0ZW0ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICRpbWcuYXR0cignYWx0JywgY2FwdGlvbik7XHJcbiAgICAgICAgICAgIGlmIChpc1ByaW1hcnkpXHJcbiAgICAgICAgICAgICAgICAkaXRlbS5hZGRDbGFzcygnaXMtcHJpbWFyeS1waG90bycpO1xyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAkaXRlbS5yZW1vdmVDbGFzcygnaXMtcHJpbWFyeS1waG90bycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZWRpdFNlbGVjdGVkUGhvdG8oZm9ybSwgc2VsZWN0ZWQpIHtcclxuXHJcbiAgICB2YXIgZWRpdFBhbmVsID0gJCgnLnBvc2l0aW9ucGhvdG9zLWVkaXQnLCBmb3JtKTtcclxuXHJcbiAgICAvLyBVc2UgZ2l2ZW4gQHNlbGVjdGVkIG9yIGxvb2sgZm9yIGEgc2VsZWN0ZWQgcGhvdG8gaW4gdGhlIGxpc3RcclxuICAgIHNlbGVjdGVkID0gc2VsZWN0ZWQgJiYgc2VsZWN0ZWQubGVuZ3RoID8gc2VsZWN0ZWQgOiAkKCcucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IG9sID4gbGkuc2VsZWN0ZWQnLCBmb3JtKTtcclxuXHJcbiAgICAvLyBNYXJrIHRoaXMgYXMgc2VsZWN0ZWRcclxuICAgIHNlbGVjdGVkLmFkZENsYXNzKCdzZWxlY3RlZCcpLnNpYmxpbmdzKCkucmVtb3ZlQ2xhc3MoJ3NlbGVjdGVkJyk7XHJcblxyXG4gICAgaWYgKHNlbGVjdGVkICYmIHNlbGVjdGVkLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB2YXIgc2VsSW1nID0gc2VsZWN0ZWQuZmluZCgnaW1nJyk7XHJcbiAgICAgICAgLy8gTW92aW5nIHNlbGVjdGVkIHRvIGJlIGVkaXQgcGFuZWxcclxuICAgICAgICB2YXIgcGhvdG9JRCA9IHNlbGVjdGVkLmF0dHIoJ2lkJykubWF0Y2goL15Vc2VyUGhvdG8tKFxcZCspJC8pWzFdLFxyXG4gICAgICAgICAgICBwaG90b1VybCA9IHNlbEltZy5hdHRyKCdzcmMnKSxcclxuICAgICAgICAgICAgJGltZyA9IGVkaXRQYW5lbC5maW5kKCdpbWcnKTtcclxuXHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPVBob3RvSURdJykudmFsKHBob3RvSUQpO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90b1VSSV0nKS52YWwocGhvdG9VcmwpO1xyXG4gICAgICAgICRpbWcuYXR0cignc3JjJywgcGhvdG9VcmwgKyBcIj92PVwiICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKSk7IC8vICc/c2l6ZT1ub3JtYWwnKTtcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9cGhvdG8tY2FwdGlvbl0nKS52YWwoc2VsSW1nLmF0dHIoJ2FsdCcpKTtcclxuICAgICAgICB2YXIgaXNQcmltYXJ5VmFsdWUgPSBzZWxlY3RlZC5oYXNDbGFzcygnaXMtcHJpbWFyeS1waG90bycpID8gJ1RydWUnIDogJ0ZhbHNlJztcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b10nKS5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXVt2YWx1ZT0nICsgaXNQcmltYXJ5VmFsdWUgKyAnXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcclxuXHJcbiAgICAgICAgLy8gQ3JvcHBpbmdcclxuICAgICAgICAkaW1nLmltYWdlc0xvYWRlZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGVkaXRvci5zZXR1cENyb3BQaG90bygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKGZvcm0uZmluZCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbCA+IGxpJykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oZm9ybS5maW5kKCcubm8tcGhvdG9zJyksIGVkaXRQYW5lbCwgJycsIHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGZvcm0uZmluZCgnLm5vLXByaW1hcnktcGhvdG8nKSwgZWRpdFBhbmVsLCAnJywgeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBObyBpbWFnZTpcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnaW1nJykuYXR0cignc3JjJywgZGVmYXVsdEltZ1NyYyk7XHJcbiAgICAgICAgLy8gUmVzZXQgaGlkZGVuIGZpZWxkcyBtYW51YWxseSB0byBhdm9pZCBicm93c2VyIG1lbW9yeSBicmVha2luZyB0aGluZ3NcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9UGhvdG9JRF0nKS52YWwoJycpO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbCgnJyk7XHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgIH1cclxufVxyXG5cclxuLyogU2V0dXAgdGhlIGNvZGUgdGhhdCB3b3JrcyBvbiB0aGUgZGlmZmVyZW50IENSVURMIGFjdGlvbnMgb24gdGhlIHBob3Rvcy5cclxuICBBbGwgdGhpcyBhcmUgZGVsZWdhdGVzLCBvbmx5IG5lZWQgdG8gYmUgc2V0dXAgb25jZSBvbiB0aGUgcGFnZVxyXG4gIChpZiB0aGUgY29udGFpbmVyICRjIGlzIG5vdCByZXBsYWNlZCwgb25seSB0aGUgY29udGVudHMsIGRvZXNuJ3QgbmVlZCB0byBjYWxsIGFnYWluIHRoaXMpLlxyXG4qL1xyXG5mdW5jdGlvbiBzZXR1cENydWRsRGVsZWdhdGVzKCRjKSB7XHJcbiAgICAkY1xyXG4gICAgLm9uKCdjaGFuZ2UnLCAnLnBvc2l0aW9ucGhvdG9zLWVkaXQgaW5wdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gSW5zdGFudCBzYXZpbmcgb24gdXNlciBjaGFuZ2VzIHRvIHRoZSBlZGl0aW5nIGZvcm1cclxuICAgICAgICB2YXIgJGYgPSAkKHRoaXMpLmNsb3Nlc3QoJy5wb3NpdGlvbnBob3Rvcy1lZGl0Jyk7XHJcbiAgICAgICAgc2F2ZUVkaXRlZFBob3RvKCRmKTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy5wb3NpdGlvbnBob3Rvcy10b29scy11cGxvYWQgPiBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwb3NJRCA9ICQodGhpcykuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ2lucHV0W25hbWU9cG9zaXRpb25JRF0nKS52YWwoKTtcclxuICAgICAgICBwb3B1cChMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvWW91cldvcmsvVXBsb2FkUGhvdG8vP1Bvc2l0aW9uSUQ9JyArIHBvc0lELCB7IHdpZHRoOiA3MDAsIGhlaWdodDogNjcwIH0sIG51bGwsIG51bGwsIHsgYXV0b0ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtZ2FsbGVyeSBsaSBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgdmFyIGZvcm0gPSAkdC5jbG9zZXN0KHNlY3Rpb25TZWxlY3Rvcik7XHJcbiAgICAgICAgLy8gRG9uJ3QgbG9zdCBsYXRlc3QgY2hhbmdlczpcclxuICAgICAgICBzYXZlRWRpdGVkUGhvdG8oZm9ybSk7XHJcblxyXG4gICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlQWxsKGZvcm0pO1xyXG4gICAgICAgIC8vIFNldCB0aGlzIHBob3RvIGFzIHNlbGVjdGVkXHJcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gJHQuY2xvc2VzdCgnbGknKTtcclxuICAgICAgICBlZGl0U2VsZWN0ZWRQaG90byhmb3JtLCBzZWxlY3RlZCk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pXHJcbiAgICAub24oJ2NsaWNrJywgJy5wb3NpdGlvbnBob3Rvcy1lZGl0LWRlbGV0ZSBhJywgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB2YXIgZWRpdFBhbmVsID0gJCh0aGlzKS5jbG9zZXN0KCcucG9zaXRpb25waG90b3MtZWRpdCcpO1xyXG4gICAgICAgIHZhciBmb3JtID0gZWRpdFBhbmVsLmNsb3Nlc3Qoc2VjdGlvblNlbGVjdG9yKTtcclxuXHJcbiAgICAgICAgdmFyIHBob3RvSUQgPSBlZGl0UGFuZWwuZmluZCgnW25hbWU9UGhvdG9JRF0nKS52YWwoKTtcclxuICAgICAgICB2YXIgJHBob3RvSXRlbSA9IGZvcm0uZmluZCgnI1VzZXJQaG90by0nICsgcGhvdG9JRCk7XHJcblxyXG4gICAgICAgIC8vIEluc3RhbnQgc2F2aW5nXHJcbiAgICAgICAgc2F2ZSh7XHJcbiAgICAgICAgICAgIFBob3RvSUQ6IHBob3RvSUQsXHJcbiAgICAgICAgICAgICdkZWxldGUtcGhvdG8nOiAnVHJ1ZScsXHJcbiAgICAgICAgICAgIHJlc3VsdDogJ2pzb24nXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBpdGVtXHJcbiAgICAgICAgICAgICRwaG90b0l0ZW0ucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICBlZGl0U2VsZWN0ZWRQaG90byhmb3JtKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qIEluaXRpYWxpemUgdGhlIHBob3RvcyBlbGVtZW50cyB0byBiZSBzb3J0YWJsZXMsIHNldCB0aGUgcHJpbWFyeSBwaG90b1xyXG4gIGluIHRoZSBoaWdobGlnaHRlZCBhcmUgYW5kIGluaXRpYWxpemUgdGhlICdkZWxldGUgcGhvdG8nIGZsYWcuXHJcbiAgVGhpcyBpcyByZXF1aXJlZCB0byBiZSBleGVjdXRlZCBhbnkgdGltZSB0aGUgZWxlbWVudHMgaHRtbCBpcyByZXBsYWNlZFxyXG4gIGJlY2F1c2UgbmVlZHMgZGlyZWN0IGFjY2VzcyB0byB0aGUgRE9NIGVsZW1lbnRzLlxyXG4qL1xyXG5mdW5jdGlvbiBpbml0RWxlbWVudHMoZm9ybSkge1xyXG4gICAgLy8gUHJlcGFyZSBzb3J0YWJsZSBzY3JpcHRcclxuICAgICQoXCIucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IG9sXCIsIGZvcm0pLnNvcnRhYmxlKHtcclxuICAgICAgICBwbGFjZWhvbGRlcjogXCJ1aS1zdGF0ZS1oaWdobGlnaHRcIixcclxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gR2V0IHBob3RvIG9yZGVyLCBhIGNvbW1hIHNlcGFyYXRlZCB2YWx1ZSBvZiBpdGVtcyBJRHNcclxuICAgICAgICAgICAgdmFyIG9yZGVyID0gJCh0aGlzKS5zb3J0YWJsZShcInRvQXJyYXlcIikudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgLy8gU2V0IG9yZGVyIGluIHRoZSBmb3JtIGVsZW1lbnQsIHRvIGJlIHNlbnQgbGF0ZXIgd2l0aCB0aGUgZm9ybVxyXG4gICAgICAgICAgICAkKHRoaXMpLmNsb3Nlc3Qoc2VjdGlvblNlbGVjdG9yKVxyXG4gICAgICAgICAgICAuZmluZCgnW25hbWU9Z2FsbGVyeS1vcmRlcl0nKVxyXG4gICAgICAgICAgICAudmFsKG9yZGVyKVxyXG4gICAgICAgICAgICAvLyBXaXRoIGluc3RhbnQgc2F2aW5nLCBubyBtb3JlIG5vdGlmeSBjaGFuZ2UgZm9yIENoYW5nZXNOb3RpZmllciwgc28gY29tbWVudGluZzpcclxuICAgICAgICAgICAgLy8uY2hhbmdlKClcclxuICAgICAgICAgICAgO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5zdGFudCBzYXZpbmdcclxuICAgICAgICAgICAgc2F2ZSh7XHJcbiAgICAgICAgICAgICAgICAnZ2FsbGVyeS1vcmRlcic6IG9yZGVyLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnb3JkZXInLFxyXG4gICAgICAgICAgICAgICAgcmVzdWx0OiAnanNvbidcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZGVmYXVsdEltZ1NyYyA9IGZvcm0uZmluZCgnaW1nJykuYXR0cignc3JjJyk7XHJcblxyXG4gICAgLy8gU2V0IHByaW1hcnkgcGhvdG8gdG8gYmUgZWRpdGVkXHJcbiAgICBlZGl0U2VsZWN0ZWRQaG90byhmb3JtKTtcclxuXHJcbiAgICAvLyBSZXNldCBkZWxldGUgb3B0aW9uXHJcbiAgICBmb3JtLmZpbmQoJ1tuYW1lPWRlbGV0ZS1waG90b10nKS52YWwoJ0ZhbHNlJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgR2FsbGVyeSBDbGFzc1xyXG4qKi9cclxuZnVuY3Rpb24gR2FsbGVyeShzZXR0aW5ncykge1xyXG5cclxuICAgIHNldHRpbmdzID0gc2V0dGluZ3MgfHwge307XHJcblxyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJChzZXR0aW5ncy5jb250YWluZXIgfHwgJy5EYXNoYm9hcmRQaG90b3MnKTtcclxuICAgIHRoaXMuJGdhbGxlcnkgPSAkKCcucG9zaXRpb25waG90b3MtZ2FsbGVyeScsIHRoaXMuJGNvbnRhaW5lcik7XHJcbiAgICB0aGlzLiRnYWxsZXJ5TGlzdCA9ICQoJ29sJywgdGhpcy4kZ2FsbGVyeSk7XHJcbiAgICB0aGlzLnRwbEltZyA9ICc8bGkgaWQ9XCJVc2VyUGhvdG8tQEAwXCI+PGEgaHJlZj1cIiNcIj48aW1nIGFsdD1cIlVwbG9hZGVkIHBob3RvXCIgc3JjPVwiQEAxXCIvPjwvYT48YSBjbGFzcz1cImVkaXRcIiBocmVmPVwiI1wiPkVkaXQ8L2E+PC9saT4nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICAgQXBwZW5kIGEgcGhvdG8gZWxlbWVudCB0byB0aGUgZ2FsbGVyeSBjb2xsZWN0aW9uLlxyXG4gICAgKiovXHJcbiAgICB0aGlzLmFwcGVuZFBob3RvID0gZnVuY3Rpb24gYXBwZW5kUGhvdG8oZmlsZU5hbWUsIHBob3RvSUQpIHtcclxuXHJcbiAgICAgICAgdmFyIG5ld0ltZyA9ICQodGhpcy50cGxJbWcucmVwbGFjZSgvQEAwL2csIHBob3RvSUQpLnJlcGxhY2UoL0BAMS9nLCBmaWxlTmFtZSkpO1xyXG4gICAgICAgIC8vIElmIGlzIHRoZXJlIGlzIG5vIHBob3RvcyBzdGlsbCwgdGhlIGZpcnN0IHdpbGwgYmUgdGhlIHByaW1hcnkgYnkgZGVmYXVsdFxyXG4gICAgICAgIGlmICh0aGlzLiRnYWxsZXJ5TGlzdC5jaGlsZHJlbigpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICBuZXdJbWcuYWRkQ2xhc3MoJ2lzLXByaW1hcnktcGhvdG8nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuJGdhbGxlcnlMaXN0XHJcbiAgICAgICAgLmFwcGVuZChuZXdJbWcpXHJcbiAgICAgICAgLy8gc2Nyb2xsIHRoZSBnYWxsZXJ5IHRvIHNlZSB0aGUgbmV3IGVsZW1lbnQ7IHVzaW5nICctMicgdG8gYXZvaWQgc29tZSBicm93c2VycyBhdXRvbWF0aWMgc2Nyb2xsLlxyXG4gICAgICAgIC5hbmltYXRlKHsgc2Nyb2xsVG9wOiB0aGlzLiRnYWxsZXJ5TGlzdFswXS5zY3JvbGxIZWlnaHQgLSB0aGlzLiRnYWxsZXJ5TGlzdC5oZWlnaHQoKSAtIDIgfSwgMTQwMClcclxuICAgICAgICAuZmluZCgnbGk6bGFzdC1jaGlsZCcpXHJcbiAgICAgICAgLmVmZmVjdChcImhpZ2hsaWdodFwiLCB7fSwgMTYwMCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMucmVsb2FkUGhvdG8gPSBmdW5jdGlvbiByZWxvYWRQaG90byhmaWxlVVJJLCBwaG90b0lEKSB7XHJcblxyXG4gICAgICAgIC8vIEZpbmQgaXRlbSBieSBJRCBhbmQgbG9hZCB3aXRoIG5ldyBVUklcclxuICAgICAgICB0aGlzLiRnYWxsZXJ5TGlzdC5maW5kKCcjVXNlclBob3RvLScgKyBwaG90b0lEKVxyXG4gICAgICAgIC5maW5kKCdpbWcnKVxyXG4gICAgICAgIC5hdHRyKCdzcmMnLCBmaWxlVVJJICsgJz92PScgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpKTtcclxuICAgIH07XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgRWRpdG9yIENsYXNzXHJcbioqL1xyXG52YXIgcXEgPSByZXF1aXJlKCdmaWxldXBsb2FkZXInKTtcclxucmVxdWlyZSgnamNyb3AnKTtcclxuZnVuY3Rpb24gRWRpdG9yKHNldHRpbmdzKSB7XHJcblxyXG4gICAgc2V0dGluZ3MgPSBzZXR0aW5ncyB8fCB7fTtcclxuXHJcbiAgICAvLyBmLmUuOiAuRGFzaGJvYXJkUGhvdG9zLWVkaXRQaG90b1xyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJChzZXR0aW5ncy5jb250YWluZXIgfHwgJ2h0bWwnKTtcclxuICAgIHRoaXMuZ2FsbGVyeSA9IHNldHRpbmdzLmdhbGxlcnkgfHwgbmV3IEdhbGxlcnkodGhpcy4kY29udGFpbmVyKTtcclxuICAgIFxyXG4gICAgdmFyICRoID0gJCgnaHRtbCcpO1xyXG4gICAgdGhpcy5wb3NpdGlvbklkID0gc2V0dGluZ3MucG9zaXRpb25JZCB8fCAkaC5kYXRhKCdwb3NpdGlvbi1pZCcpO1xyXG4gICAgdGhpcy5zaXplTGltaXQgPSBzZXR0aW5ncy5zaXplTGltaXQgfHwgJGguZGF0YSgnc2l6ZS1saW1pdCcpO1xyXG5cclxuICAgIC8vIEluaXRpYWxpemluZzpcclxuICAgIHRoaXMuaW5pdFVwbG9hZGVyKCk7XHJcbiAgICB0aGlzLmluaXRDcm9wRm9ybSgpO1xyXG4gICAgLy90aGlzLnNldHVwQ3JvcFBob3RvKCk7XHJcbn1cclxuXHJcbkVkaXRvci5wcm90b3R5cGUuaW5pdFVwbG9hZGVyID0gZnVuY3Rpb24gaW5pdFVwbG9hZGVyKCkge1xyXG5cclxuICAgIHZhciB0aGlzRWRpdG9yID0gdGhpcztcclxuXHJcbiAgICB2YXIgdXBsb2FkZXIgPSBuZXcgcXEuRmlsZVVwbG9hZGVyKHtcclxuICAgICAgICBlbGVtZW50OiAkKCcuRmlsZVVwbG9hZGVyLXVwbG9hZGVyJywgdGhpcy4kY29udGFpbmVyKS5nZXQoMCksXHJcbiAgICAgICAgLy8gcGF0aCB0byBzZXJ2ZXItc2lkZSB1cGxvYWQgc2NyaXB0XHJcbiAgICAgICAgYWN0aW9uOiBMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvWW91cldvcmsvVXBsb2FkUGhvdG8vP1Bvc2l0aW9uSUQ9JyArICh0aGlzLnBvc2l0aW9uSWQpLFxyXG4gICAgICAgIGFsbG93ZWRFeHRlbnNpb25zOiBbJ2pwZycsICdqcGVnJywgJ3BuZycsICdnaWYnXSxcclxuICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbiAoaWQsIGZpbGVOYW1lLCByZXNwb25zZUpTT04pIHtcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlSlNPTi5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzRWRpdG9yLmdhbGxlcnkuYXBwZW5kUGhvdG8ocmVzcG9uc2VKU09OLmZpbGVVUkksIHJlc3BvbnNlSlNPTi5waG90b0lEKTtcclxuICAgICAgICAgICAgICAgIC8vIEdvIHRvIGNyb3AgcGhvdG86XHJcbiAgICAgICAgICAgICAgICB0aGlzRWRpdG9yLnNob3dDcm9wUGhvdG8ocmVzcG9uc2VKU09OLmZpbGVVUkksIHJlc3BvbnNlSlNPTi5waG90b0lEKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbWVzc2FnZXM6IHtcclxuICAgICAgICAgICAgdHlwZUVycm9yOiBcIntmaWxlfSBoYXMgaW52YWxpZCBleHRlbnNpb24uIE9ubHkge2V4dGVuc2lvbnN9IGFyZSBhbGxvd2VkLlwiLFxyXG4gICAgICAgICAgICBzaXplRXJyb3I6IFwie2ZpbGV9IGlzIHRvbyBsYXJnZSwgbWF4aW11bSBmaWxlIHNpemUgaXMge3NpemVMaW1pdH0uXCIsXHJcbiAgICAgICAgICAgIG1pblNpemVFcnJvcjogXCJ7ZmlsZX0gaXMgdG9vIHNtYWxsLCBtaW5pbXVtIGZpbGUgc2l6ZSBpcyB7bWluU2l6ZUxpbWl0fS5cIixcclxuICAgICAgICAgICAgZW1wdHlFcnJvcjogXCJ7ZmlsZX0gaXMgZW1wdHksIHBsZWFzZSBzZWxlY3QgZmlsZXMgYWdhaW4gd2l0aG91dCBpdC5cIixcclxuICAgICAgICAgICAgb25MZWF2ZTogXCJUaGUgZmlsZXMgYXJlIGJlaW5nIHVwbG9hZGVkLCBpZiB5b3UgbGVhdmUgbm93IHRoZSB1cGxvYWQgd2lsbCBiZSBjYW5jZWxsZWQuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHNpemVMaW1pdDogdGhpcy5zaXplTGltaXQgfHwgJ3VuZGVmaW5lZCdcclxuICAgIH0pO1xyXG59O1xyXG5cclxuLy8gU2ltcGxlIGV2ZW50IGhhbmRsZXIsIGNhbGxlZCBmcm9tIG9uQ2hhbmdlIGFuZCBvblNlbGVjdFxyXG4vLyBldmVudCBoYW5kbGVycywgYXMgcGVyIHRoZSBKY3JvcCBpbnZvY2F0aW9uIGFib3ZlXHJcbkVkaXRvci5wcm90b3R5cGUuc2hvd0Nvb3JkcyA9IGZ1bmN0aW9uIHNob3dDb29yZHMoYykge1xyXG4gICAgJCgnW25hbWU9Y3JvcC14MV0nLCB0aGlzLiRjb250YWluZXIpLnZhbChjLngpO1xyXG4gICAgJCgnW25hbWU9Y3JvcC15MV0nLCB0aGlzLiRjb250YWluZXIpLnZhbChjLnkpO1xyXG4gICAgJCgnW25hbWU9Y3JvcC14Ml0nLCB0aGlzLiRjb250YWluZXIpLnZhbChjLngyKTtcclxuICAgICQoJ1tuYW1lPWNyb3AteTJdJywgdGhpcy4kY29udGFpbmVyKS52YWwoYy55Mik7XHJcbiAgICAkKCdbbmFtZT1jcm9wLXddJywgdGhpcy4kY29udGFpbmVyKS52YWwoYy53KTtcclxuICAgICQoJ1tuYW1lPWNyb3AtaF0nLCB0aGlzLiRjb250YWluZXIpLnZhbChjLmgpO1xyXG59O1xyXG5cclxuRWRpdG9yLnByb3RvdHlwZS5jbGVhckNvb3JkcyA9IGZ1bmN0aW9uIGNsZWFyQ29vcmRzKCkge1xyXG4gICAgJCgnaW5wdXRbbmFtZT1eY3JvcC1dJywgdGhpcy4kY29udGFpbmVyKS52YWwoJycpO1xyXG59O1xyXG5cclxuRWRpdG9yLnByb3RvdHlwZS5zaG93Q3JvcFBob3RvID0gZnVuY3Rpb24gc2hvd0Nyb3BQaG90byhwaG90b1VSSSwgcGhvdG9JRCkge1xyXG5cclxuICAgIHZhciB0aGlzRWRpdG9yID0gdGhpcztcclxuICAgIHRoaXMuJGNvbnRhaW5lci5maW5kKCdbbmFtZT1waG90b1VSSV0nKS52YWwocGhvdG9VUkkpO1xyXG4gICAgdGhpcy4kY29udGFpbmVyLmZpbmQoJ1tuYW1lPXBob3RvSURdJykudmFsKHBob3RvSUQpO1xyXG5cclxuICAgIC8vIFNldCBuZXcgaW1hZ2VcclxuICAgIHRoaXMuJGNvbnRhaW5lci5maW5kKCcucG9zaXRpb25waG90b3MtZWRpdC1waG90byA+IGltZycpXHJcbiAgICAuYXR0cignc3R5bGUnLCAnJylcclxuICAgIC5hdHRyKCdzcmMnLCBwaG90b1VSSSArIFwiP3Y9XCIgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpKVxyXG4gICAgLm9uKCdsb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXNFZGl0b3Iuc2V0dXBDcm9wUGhvdG8oKTtcclxuICAgIH0pO1xyXG59O1xyXG5cclxuRWRpdG9yLnByb3RvdHlwZS5pbml0Q3JvcEZvcm0gPSBmdW5jdGlvbiBpbml0Q3JvcEZvcm0oKSB7XHJcbiAgICBcclxuICAgIC8vIFNldHVwIGNyb3BwaW5nIFwiZm9ybVwiXHJcbiAgICB2YXIgdGhpc0VkaXRvciA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy4kY29udGFpbmVyLm9uKCdjbGljaycsICcuRGFzaGJvYXJkUGhvdG9zLWVkaXRQaG90by1zYXZlJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHVybDogTGNVcmwuTGFuZ1BhdGggKyAnJGRhc2hib2FyZC9Zb3VyV29yay9VcGxvYWRQaG90by8nLFxyXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgICAgIGRhdGE6IHRoaXNFZGl0b3IuJGNvbnRhaW5lci5zZXJpYWxpemUoKSArICcmY3JvcC1waG90bz1UcnVlJyxcclxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLnVwZGF0ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBQaG90byBjcm9wcGVkLCByZXNpemVkXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc0VkaXRvci5nYWxsZXJ5LnJlbG9hZFBob3RvKGRhdGEuZmlsZVVSSSwgZGF0YS5waG90b0lEKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBob3RvIHVwbG9hZGVkXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc0VkaXRvci5hcHBlbmRQaG90byhkYXRhLmZpbGVVUkksIGRhdGEucGhvdG9JRCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkKCcjY3JvcC1waG90bycpLnNsaWRlVXAoJ2Zhc3QnKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFRPRE8gQ2xvc2UgcG9wdXAgIzUzNVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgZXIpIHtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KCdTb3JyeSwgdGhlcmUgd2FzIGFuIGVycm9yIHNldHRpbmctdXAgeW91ciBwaG90by4gJyArIChlciB8fCAnJykpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbkVkaXRvci5wcm90b3R5cGUuc2V0dXBDcm9wUGhvdG8gPSBmdW5jdGlvbiBzZXR1cENyb3BQaG90bygpIHtcclxuXHJcbiAgICBpZiAodGhpcy5qY3JvcEFwaSlcclxuICAgICAgICB0aGlzLmpjcm9wQXBpLmRlc3Ryb3koKTtcclxuXHJcbiAgICB2YXIgdGhpc0VkaXRvciA9IHRoaXM7XHJcblxyXG4gICAgLy8gU2V0dXAgaW1nIGNyb3BwaW5nXHJcbiAgICB2YXIgJGltZyA9ICQoJy5wb3NpdGlvbnBob3Rvcy1lZGl0LXBob3RvID4gaW1nJywgdGhpcy4kY29udGFpbmVyKTtcclxuICAgICRpbWcuSmNyb3Aoe1xyXG4gICAgICAgIG9uQ2hhbmdlOiB0aGlzLnNob3dDb29yZHMuYmluZCh0aGlzKSxcclxuICAgICAgICBvblNlbGVjdDogdGhpcy5zaG93Q29vcmRzLmJpbmQodGhpcyksXHJcbiAgICAgICAgb25SZWxlYXNlOiB0aGlzLmNsZWFyQ29vcmRzLmJpbmQodGhpcyksXHJcbiAgICAgICAgYXNwZWN0UmF0aW86ICRpbWcuZGF0YSgndGFyZ2V0LXdpZHRoJykgLyAkaW1nLmRhdGEoJ3RhcmdldC1oZWlnaHQnKVxyXG4gICAgfSwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICB0aGlzRWRpdG9yLmpjcm9wQXBpID0gdGhpcztcclxuICAgICAgICAvLyBJbml0aWFsIHNlbGVjdGlvbiB0byBzaG93IHVzZXIgdGhhdCBjYW4gY2hvb3NlIGFuIGFyZWFcclxuICAgICAgICB0aGlzRWRpdG9yLmpjcm9wQXBpLnNldFNlbGVjdChbMCwgMCwgJGltZy53aWR0aCgpLCAkaW1nLmhlaWdodCgpXSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gJGltZztcclxufTtcclxuIiwiLyoqIEF2YWlsYWJpbGl0eTogV2Vla2x5IFNjaGVkdWxlIHNlY3Rpb24gc2V0dXBcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhciA9IHJlcXVpcmUoJ0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyJyk7XHJcbnZhciBiYXRjaEV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJ0xDL2JhdGNoRXZlbnRIYW5kbGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciBtb250aGx5TGlzdCA9IGF2YWlsYWJpbGl0eUNhbGVuZGFyLk1vbnRobHkuZW5hYmxlQWxsKCk7XHJcblxyXG4gICAgJC5lYWNoKG1vbnRobHlMaXN0LCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgIHZhciBtb250aGx5ID0gdGhpcztcclxuXHJcbiAgICAgICAgLy8gU2V0dXBpbmcgdGhlIGNhbGVuZGFyIGRhdGEgZmllbGRcclxuICAgICAgICB2YXIgZm9ybSA9IG1vbnRobHkuJGVsLmNsb3Nlc3QoJ2Zvcm0uYWpheCxmaWVsZHNldC5hamF4Jyk7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gZm9ybS5maW5kKCdbbmFtZT1tb250aGx5XScpO1xyXG4gICAgICAgIGlmIChmaWVsZC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGZpZWxkID0gJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwibW9udGhseVwiIC8+JykuaW5zZXJ0QWZ0ZXIobW9udGhseS4kZWwpO1xyXG5cclxuICAgICAgICAvLyBTYXZlIHdoZW4gdGhlIGZvcm0gaXMgdG8gYmUgc3VibWl0dGVkXHJcbiAgICAgICAgZm9ybS5vbigncHJlc3VibWl0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmaWVsZC52YWwoSlNPTi5zdHJpbmdpZnkobW9udGhseS5nZXRVcGRhdGVkRGF0YSgpKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFVwZGF0aW5nIGZpZWxkIG9uIGNhbGVuZGFyIGNoYW5nZXMgKHVzaW5nIGJhdGNoIHRvIGF2b2lkIGh1cnQgcGVyZm9ybWFuY2UpXHJcbiAgICAgICAgLy8gYW5kIHJhaXNlIGNoYW5nZSBldmVudCAodGhpcyBmaXhlcyB0aGUgc3VwcG9ydCBmb3IgY2hhbmdlc05vdGlmaWNhdGlvblxyXG4gICAgICAgIC8vIGFuZCBpbnN0YW50LXNhdmluZykuXHJcbiAgICAgICAgbW9udGhseS5ldmVudHMub24oJ2RhdGFDaGFuZ2VkJywgYmF0Y2hFdmVudEhhbmRsZXIoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmaWVsZFxyXG4gICAgICAgICAgICAudmFsKEpTT04uc3RyaW5naWZ5KG1vbnRobHkuZ2V0VXBkYXRlZERhdGEoKSkpXHJcbiAgICAgICAgICAgIC5jaGFuZ2UoKTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9KTtcclxufTsiLCIvKipcclxucGF5bWVudDogd2l0aCB0aGUgcHJvcGVyIGh0bWwgYW5kIGZvcm1cclxucmVnZW5lcmF0ZXMgdGhlIGJ1dHRvbiBzb3VyY2UtY29kZSBhbmQgcHJldmlldyBhdXRvbWF0aWNhbGx5LlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmZvcm1hdHRlcicpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIG9uUGF5bWVudEFjY291bnQoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgdmFyIGZpbml0ID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIC8vIEluaXRpYWxpemUgdGhlIGZvcm1hdHRlcnMgb24gcGFnZS1yZWFkeS4uXHJcbiAgICBpbml0Rm9ybWF0dGVycygkYyk7XHJcblxyXG4gICAgY2hhbmdlUGF5bWVudE1ldGhvZCgkYyk7XHJcblxyXG4gIH07XHJcbiAgJChmaW5pdCk7XHJcbiAgLy8gYW5kIGFueSBhamF4LXBvc3Qgb2YgdGhlIGZvcm0gdGhhdCByZXR1cm5zIG5ldyBodG1sOlxyXG4gICRjLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsICdmb3JtLmFqYXgnLCBmaW5pdCk7XHJcbn07XHJcblxyXG4vKiogSW5pdGlhbGl6ZSB0aGUgZmllbGQgZm9ybWF0dGVycyByZXF1aXJlZCBieSB0aGUgcGF5bWVudC1hY2NvdW50LWZvcm0sIGJhc2VkXHJcbiAgb24gdGhlIGZpZWxkcyBuYW1lcy5cclxuKiovXHJcbmZ1bmN0aW9uIGluaXRGb3JtYXR0ZXJzKCRjb250YWluZXIpIHtcclxuICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwiYmlydGhkYXRlXCJdJykuZm9ybWF0dGVyKHtcclxuICAgICdwYXR0ZXJuJzogJ3t7OTl9fS97ezk5fX0ve3s5OTk5fX0nLFxyXG4gICAgJ3BlcnNpc3RlbnQnOiBmYWxzZVxyXG4gIH0pO1xyXG4gICRjb250YWluZXIuZmluZCgnW25hbWU9XCJzc25cIl0nKS5mb3JtYXR0ZXIoe1xyXG4gICAgJ3BhdHRlcm4nOiAne3s5OTl9fS17ezk5fX0te3s5OTk5fX0nLFxyXG4gICAgJ3BlcnNpc3RlbnQnOiBmYWxzZVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjaGFuZ2VQYXltZW50TWV0aG9kKCRjb250YWluZXIpIHtcclxuXHJcbiAgdmFyICRiYW5rID0gJGNvbnRhaW5lci5maW5kKCcuRGFzaGJvYXJkUGF5bWVudEFjY291bnQtYmFuaycpLFxyXG4gICAgJGVscyA9ICRjb250YWluZXIuZmluZCgnLkRhc2hib2FyZFBheW1lbnRBY2NvdW50LWNoYW5nZU1ldGhvZCcpXHJcbiAgICAuYWRkKCRiYW5rKTtcclxuXHJcbiAgJGNvbnRhaW5lci5maW5kKCcuQWN0aW9ucy0tY2hhbmdlUGF5bWVudE1ldGhvZCcpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICRlbHMudG9nZ2xlQ2xhc3MoJ2lzLXZlbm1vQWNjb3VudCBpcy1iYW5rQWNjb3VudCcpO1xyXG5cclxuICAgIGlmICgkYmFuay5oYXNDbGFzcygnaXMtdmVubW9BY2NvdW50JykpIHtcclxuICAgICAgLy8gUmVtb3ZlIGFuZCBzYXZlIG51bWJlcnNcclxuICAgICAgJGJhbmsuZmluZCgnaW5wdXQnKS52YWwoZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICAkKHRoaXMpLmRhdGEoJ3ByZXYtdmFsJywgdik7XHJcbiAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFJlc3RvcmUgbnVtYmVyc1xyXG4gICAgICAkYmFuay5maW5kKCdpbnB1dCcpLnZhbChmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgIHJldHVybiAkKHRoaXMpLmRhdGEoJ3ByZXYtdmFsJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxufSIsIi8qKiBQcmljaW5nIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIFRpbWVTcGFuID0gcmVxdWlyZSgnTEMvVGltZVNwYW4nKTtcclxucmVxdWlyZSgnTEMvVGltZVNwYW5FeHRyYScpLnBsdWdJbihUaW1lU3Bhbik7XHJcbnZhciB1cGRhdGVUb29sdGlwcyA9IHJlcXVpcmUoJ0xDL3Rvb2x0aXBzJykudXBkYXRlVG9vbHRpcHM7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChwcmljaW5nU2VsZWN0b3IpIHtcclxuICBwcmljaW5nU2VsZWN0b3IgPSBwcmljaW5nU2VsZWN0b3IgfHwgJy5EYXNoYm9hcmRQcmljaW5nJztcclxuICB2YXIgJHByaWNpbmcgPSAkKHByaWNpbmdTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJHByaWNpbmcuc2libGluZ3MoKVxyXG4gICAgICAuYWRkKCRwcmljaW5nLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSlcclxuICAgICAgLmFkZCgkcHJpY2luZy5jbG9zZXN0KCcuRGFzaGJvYXJkWW91cldvcmsnKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKHByaWNpbmdTZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuXHJcbiAgICBzZXR1cE5vUHJpY2VSYXRlVXBkYXRlcygkZWRpdG9yKTtcclxuICAgIHNldHVwUHJvdmlkZXJQYWNrYWdlU2xpZGVycygkZWRpdG9yKTtcclxuICAgIHVwZGF0ZVRvb2x0aXBzKCk7XHJcbiAgICBzZXR1cFNob3dNb3JlQXR0cmlidXRlc0xpbmsoJGVkaXRvcik7XHJcblxyXG4gIH0pO1xyXG59O1xyXG5cclxuLyogSGFuZGxlciBmb3IgY2hhbmdlIGV2ZW50IG9uICdub3QgdG8gc3RhdGUgcHJpY2UgcmF0ZScsIHVwZGF0aW5nIHJlbGF0ZWQgcHJpY2UgcmF0ZSBmaWVsZHMuXHJcbiAgSXRzIHNldHVwZWQgcGVyIGVkaXRvciBpbnN0YW5jZSwgbm90IGFzIGFuIGV2ZW50IGRlbGVnYXRlLlxyXG4qL1xyXG5mdW5jdGlvbiBzZXR1cE5vUHJpY2VSYXRlVXBkYXRlcygkZWRpdG9yKSB7XHJcbiAgdmFyIFxyXG4gICAgcHIgPSAkZWRpdG9yLmZpbmQoJ1tuYW1lPXByaWNlLXJhdGVdLFtuYW1lPXByaWNlLXJhdGUtdW5pdF0nKSxcclxuICAgIG5wciA9ICRlZGl0b3IuZmluZCgnW25hbWU9bm8tcHJpY2UtcmF0ZV0nKTtcclxuICBucHIub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHByLnByb3AoJ2Rpc2FibGVkJywgbnByLnByb3AoJ2NoZWNrZWQnKSk7XHJcbiAgfSk7XHJcbiAgLy8gSW5pdGlhbCBzdGF0ZTpcclxuICBucHIuY2hhbmdlKCk7XHJcbn1cclxuXHJcbi8qKiBTZXR1cCB0aGUgVUkgU2xpZGVycyBvbiB0aGUgZWRpdG9yLlxyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBQcm92aWRlclBhY2thZ2VTbGlkZXJzKCRlZGl0b3IpIHtcclxuXHJcbiAgLyogSG91c2Vla2VlcGVyIHByaWNpbmcgKi9cclxuICBmdW5jdGlvbiB1cGRhdGVBdmVyYWdlKCRjLCBtaW51dGVzKSB7XHJcbiAgICAkYy5maW5kKCdbbmFtZT1wcm92aWRlci1hdmVyYWdlLXRpbWVdJykudmFsKG1pbnV0ZXMpO1xyXG4gICAgbWludXRlcyA9IHBhcnNlSW50KG1pbnV0ZXMpO1xyXG4gICAgJGMuZmluZCgnLnByZXZpZXcgLnRpbWUnKS50ZXh0KFRpbWVTcGFuLmZyb21NaW51dGVzKG1pbnV0ZXMpLnRvU21hcnRTdHJpbmcoKSk7XHJcbiAgfVxyXG5cclxuICAkZWRpdG9yLmZpbmQoXCIucHJvdmlkZXItYXZlcmFnZS10aW1lLXNsaWRlclwiKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkYyA9ICQodGhpcykuY2xvc2VzdCgnW2RhdGEtc2xpZGVyLXZhbHVlXScpO1xyXG4gICAgdmFyIGF2ZXJhZ2UgPSAkYy5kYXRhKCdzbGlkZXItdmFsdWUnKSxcclxuICAgICAgc3RlcCA9ICRjLmRhdGEoJ3NsaWRlci1zdGVwJykgfHwgMTtcclxuICAgIGlmICghYXZlcmFnZSkgcmV0dXJuO1xyXG4gICAgdmFyIHNldHVwID0ge1xyXG4gICAgICByYW5nZTogXCJtaW5cIixcclxuICAgICAgdmFsdWU6IGF2ZXJhZ2UsXHJcbiAgICAgIG1pbjogYXZlcmFnZSAtIDMgKiBzdGVwLFxyXG4gICAgICBtYXg6IGF2ZXJhZ2UgKyAzICogc3RlcCxcclxuICAgICAgc3RlcDogc3RlcCxcclxuICAgICAgc2xpZGU6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgICB1cGRhdGVBdmVyYWdlKCRjLCB1aS52YWx1ZSk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICB2YXIgc2xpZGVyID0gJCh0aGlzKS5zbGlkZXIoc2V0dXApO1xyXG5cclxuICAgICRjLmZpbmQoJy5wcm92aWRlci1hdmVyYWdlLXRpbWUnKS5vbignY2xpY2snLCAnbGFiZWwnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgIGlmICgkdC5oYXNDbGFzcygnYmVsb3ctYXZlcmFnZS1sYWJlbCcpKVxyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgc2V0dXAubWluKTtcclxuICAgICAgZWxzZSBpZiAoJHQuaGFzQ2xhc3MoJ2F2ZXJhZ2UtbGFiZWwnKSlcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHNldHVwLnZhbHVlKTtcclxuICAgICAgZWxzZSBpZiAoJHQuaGFzQ2xhc3MoJ2Fib3ZlLWF2ZXJhZ2UtbGFiZWwnKSlcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHNldHVwLm1heCk7XHJcbiAgICAgIHVwZGF0ZUF2ZXJhZ2UoJGMsIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJykpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2V0dXAgdGhlIGlucHV0IGZpZWxkLCBoaWRkZW4gYW5kIHdpdGggaW5pdGlhbCB2YWx1ZSBzeW5jaHJvbml6ZWQgd2l0aCBzbGlkZXJcclxuICAgIHZhciBmaWVsZCA9ICRjLmZpbmQoJ1tuYW1lPXByb3ZpZGVyLWF2ZXJhZ2UtdGltZV0nKTtcclxuICAgIGZpZWxkLmhpZGUoKTtcclxuICAgIHZhciBjdXJyZW50VmFsdWUgPSBmaWVsZC52YWwoKSB8fCBhdmVyYWdlO1xyXG4gICAgdXBkYXRlQXZlcmFnZSgkYywgY3VycmVudFZhbHVlKTtcclxuICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgY3VycmVudFZhbHVlKTtcclxuICB9KTtcclxufVxyXG5cclxuLyoqIFRoZSBpbi1lZGl0b3IgbGluayAjc2hvdy1tb3JlLWF0dHJpYnV0ZXMgbXVzdCBzaG93L2hpZGUgdGhlIGNvbnRhaW5lciBvZlxyXG4gIGV4dHJhIGF0dHJpYnV0ZXMgZm9yIHRoZSBwYWNrYWdlL3ByaWNpbmctaXRlbS4gVGhpcyBzZXR1cHMgdGhlIHJlcXVpcmVkIGhhbmRsZXIuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cFNob3dNb3JlQXR0cmlidXRlc0xpbmsoJGVkaXRvcikge1xyXG4gIC8vIEhhbmRsZXIgZm9yICdzaG93LW1vcmUtYXR0cmlidXRlcycgYnV0dG9uICh1c2VkIG9ubHkgb24gZWRpdCBhIHBhY2thZ2UpXHJcbiAgJGVkaXRvci5maW5kKCcuc2hvdy1tb3JlLWF0dHJpYnV0ZXMnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgdmFyIGF0dHMgPSAkdC5zaWJsaW5ncygnLnNlcnZpY2VzLW5vdC1jaGVja2VkJyk7XHJcbiAgICBpZiAoYXR0cy5pcygnOnZpc2libGUnKSkge1xyXG4gICAgICAkdC50ZXh0KCR0LmRhdGEoJ3Nob3ctdGV4dCcpKTtcclxuICAgICAgYXR0cy5zdG9wKCkuaGlkZSgnZmFzdCcpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgJHQudGV4dCgkdC5kYXRhKCdoaWRlLXRleHQnKSk7XHJcbiAgICAgIGF0dHMuc3RvcCgpLnNob3coJ2Zhc3QnKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufSIsIi8qKlxyXG4gIHByaXZhY3lTZXR0aW5nczogU2V0dXAgZm9yIHRoZSBzcGVjaWZpYyBwYWdlLWZvcm0gZGFzaGJvYXJkL3ByaXZhY3kvcHJpdmFjeXNldHRpbmdzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vLyBUT0RPIEltcGxlbWVudCBkZXBlbmRlbmNpZXMgY29tbWluZyBmcm9tIGFwcC5qcyBpbnN0ZWFkIG9mIGRpcmVjdCBsaW5rXHJcbi8vdmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnc21vb3RoQm94QmxvY2snKTtcclxuLy8gVE9ETyBSZXBsYWNlIGRvbS1yZXNzb3VyY2VzIGJ5IGkxOG4uZ2V0VGV4dFxyXG5cclxudmFyIHByaXZhY3kgPSB7XHJcbiAgYWNjb3VudExpbmtzU2VsZWN0b3I6ICcuRGFzaGJvYXJkUHJpdmFjeVNldHRpbmdzLW15QWNjb3VudCBhJyxcclxuICByZXNzb3VyY2VzU2VsZWN0b3I6ICcuRGFzaGJvYXJkUHJpdmFjeS1hY2NvdW50UmVzc291cmNlcydcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcHJpdmFjeTtcclxuXHJcbnByaXZhY3kub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgJGMub24oJ2NsaWNrJywgJy5jYW5jZWwtYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgc21vb3RoQm94QmxvY2suY2xvc2UoJGMpO1xyXG4gIH0pO1xyXG5cclxuICAkYy5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsICcuYWpheC1ib3gnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgfSk7XHJcbiAgXHJcbiAgJGMub24oJ2NsaWNrJywgcHJpdmFjeS5hY2NvdW50TGlua3NTZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciBiLFxyXG4gICAgICBscmVzID0gJGMuZmluZChwcml2YWN5LnJlc3NvdXJjZXNTZWxlY3Rvcik7XHJcblxyXG4gICAgc3dpdGNoICgkKHRoaXMpLmF0dHIoJ2hyZWYnKSkge1xyXG4gICAgICBjYXNlICcjZGVsZXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5kZWxldGUtbWVzc2FnZS1jb25maXJtJykuY2xvbmUoKSwgJGMpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICcjZGVhY3RpdmF0ZS1teS1hY2NvdW50JzpcclxuICAgICAgICBiID0gc21vb3RoQm94QmxvY2sub3BlbihscmVzLmNoaWxkcmVuKCcuZGVhY3RpdmF0ZS1tZXNzYWdlLWNvbmZpcm0nKS5jbG9uZSgpLCAkYyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJyNyZWFjdGl2YXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5yZWFjdGl2YXRlLW1lc3NhZ2UtY29uZmlybScpLmNsb25lKCksICRjKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlmIChiKSB7XHJcbiAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogYi5vZmZzZXQoKS50b3AgfSwgNTAwLCBudWxsKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbn07IiwiLyoqIFNlcnZpY2UgQXR0cmlidXRlcyBWYWxpZGF0aW9uOiBpbXBsZW1lbnRzIHZhbGlkYXRpb25zIHRocm91Z2ggdGhlIFxyXG4gICdjdXN0b21WYWxpZGF0aW9uJyBhcHByb2FjaCBmb3IgJ3Bvc2l0aW9uIHNlcnZpY2UgYXR0cmlidXRlcycuXHJcbiAgSXQgdmFsaWRhdGVzIHRoZSByZXF1aXJlZCBhdHRyaWJ1dGUgY2F0ZWdvcnksIGFsbW9zdC1vbmUgb3Igc2VsZWN0LW9uZSBtb2Rlcy5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBnZXRUZXh0ID0gcmVxdWlyZSgnTEMvZ2V0VGV4dCcpO1xyXG52YXIgdmggPSByZXF1aXJlKCdMQy92YWxpZGF0aW9uSGVscGVyJyk7XHJcbnZhciBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnTEMvanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxuLyoqIEVuYWJsZSB2YWxpZGF0aW9uIG9mIHJlcXVpcmVkIHNlcnZpY2UgYXR0cmlidXRlcyBvblxyXG4gIHRoZSBmb3JtKHMpIHNwZWNpZmllZCBieSB0aGUgc2VsZWN0b3Igb3IgcHJvdmlkZWRcclxuKiovXHJcbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiBzZXR1cFNlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbihjb250YWluZXJTZWxlY3Rvciwgb3B0aW9ucykge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG4gIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICByZXF1aXJlZFNlbGVjdG9yOiAnLkRhc2hib2FyZFNlcnZpY2VzLWF0dHJpYnV0ZXMtY2F0ZWdvcnkuaXMtcmVxdWlyZWQnLFxyXG4gICAgc2VsZWN0T25lQ2xhc3M6ICdqcy12YWxpZGF0aW9uU2VsZWN0T25lJyxcclxuICAgIGdyb3VwRXJyb3JDbGFzczogJ2lzLWVycm9yJyxcclxuICAgIHZhbEVycm9yVGV4dEtleTogJ3JlcXVpcmVkLWF0dHJpYnV0ZS1jYXRlZ29yeS1lcnJvcidcclxuICB9LCBvcHRpb25zKTtcclxuXHJcbiAgJGMuZWFjaChmdW5jdGlvbiB2YWxpZGF0ZVNlcnZpY2VBdHRyaWJ1dGVzKCkge1xyXG4gICAgdmFyIGYgPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFmLmlzKCdmb3JtLGZpZWxkc2V0JykpIHtcclxuICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignVGhlIGVsZW1lbnQgdG8gYXBwbHkgdmFsaWRhdGlvbiBtdXN0IGJlIGEgZm9ybSBvciBmaWVsZHNldCcpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZi5kYXRhKCdjdXN0b21WYWxpZGF0aW9uJywge1xyXG4gICAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWxpZCA9IHRydWUsIGxhc3RWYWxpZCA9IHRydWU7XHJcbiAgICAgICAgdmFyIHYgPSB2aC5maW5kVmFsaWRhdGlvblN1bW1hcnkoZik7XHJcblxyXG4gICAgICAgIGYuZmluZChvcHRpb25zLnJlcXVpcmVkU2VsZWN0b3IpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyIGZzID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBjYXQgPSBmcy5jaGlsZHJlbignbGVnZW5kJykudGV4dCgpO1xyXG4gICAgICAgICAgLy8gV2hhdCB0eXBlIG9mIHZhbGlkYXRpb24gYXBwbHk/XHJcbiAgICAgICAgICBpZiAoZnMuaXMoJy4nICsgb3B0aW9ucy5zZWxlY3RPbmVDbGFzcykpXHJcbiAgICAgICAgICAvLyBpZiB0aGUgY2F0IGlzIGEgJ3ZhbGlkYXRpb24tc2VsZWN0LW9uZScsIGEgJ3NlbGVjdCcgZWxlbWVudCB3aXRoIGEgJ3Bvc2l0aXZlJ1xyXG4gICAgICAgICAgLy8gOnNlbGVjdGVkIHZhbHVlIG11c3QgYmUgY2hlY2tlZFxyXG4gICAgICAgICAgICBsYXN0VmFsaWQgPSAhIShmcy5maW5kKCdvcHRpb246c2VsZWN0ZWQnKS52YWwoKSk7XHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAvLyBPdGhlcndpc2UsIGxvb2sgZm9yICdhbG1vc3Qgb25lJyBjaGVja2VkIHZhbHVlczpcclxuICAgICAgICAgICAgbGFzdFZhbGlkID0gKGZzLmZpbmQoJ2lucHV0OmNoZWNrZWQnKS5sZW5ndGggPiAwKTtcclxuXHJcbiAgICAgICAgICBpZiAoIWxhc3RWYWxpZCkge1xyXG4gICAgICAgICAgICB2YWxpZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmcy5hZGRDbGFzcyhvcHRpb25zLmdyb3VwRXJyb3JDbGFzcyk7XHJcbiAgICAgICAgICAgIHZhciBlcnIgPSBnZXRUZXh0KG9wdGlvbnMudmFsRXJyb3JUZXh0S2V5LCBjYXQpO1xyXG4gICAgICAgICAgICBpZiAodi5maW5kKCdsaVt0aXRsZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGNhdCkgKyAnXCJdJykubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgIHYuY2hpbGRyZW4oJ3VsJykuYXBwZW5kKCQoJzxsaS8+JykudGV4dChlcnIpLmF0dHIoJ3RpdGxlJywgY2F0KSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcyhvcHRpb25zLmdyb3VwRXJyb3JDbGFzcyk7XHJcbiAgICAgICAgICAgIHYuZmluZCgnbGlbdGl0bGU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShjYXQpICsgJ1wiXScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodmFsaWQpIHtcclxuICAgICAgICAgIHZoLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChmKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmguc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdmFsaWQ7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICB9KTtcclxufTtcclxuIiwiLyoqIEl0IHByb3ZpZGVzIHRoZSBjb2RlIGZvciB0aGUgYWN0aW9ucyBvZiB0aGUgVmVyaWZpY2F0aW9ucyBzZWN0aW9uLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuLy92YXIgTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG4vL3ZhciBwb3B1cCA9IHJlcXVpcmUoJy4uL0xDL3BvcHVwJyk7XHJcblxyXG52YXIgYWN0aW9ucyA9IGV4cG9ydHMuYWN0aW9ucyA9IHt9O1xyXG5cclxuYWN0aW9ucy5mYWNlYm9vayA9IGZ1bmN0aW9uICgpIHtcclxuICAvKiBGYWNlYm9vayBjb25uZWN0ICovXHJcbiAgdmFyIEZhY2Vib29rQ29ubmVjdCA9IHJlcXVpcmUoJ0xDL0ZhY2Vib29rQ29ubmVjdCcpO1xyXG4gIHZhciBmYiA9IG5ldyBGYWNlYm9va0Nvbm5lY3Qoe1xyXG4gICAgcmVzdWx0VHlwZTogJ2pzb24nLFxyXG4gICAgdXJsU2VjdGlvbjogJ1ZlcmlmeScsXHJcbiAgICBhcHBJZDogJCgnaHRtbCcpLmRhdGEoJ2ZiLWFwcGlkJyksXHJcbiAgICBwZXJtaXNzaW9uczogJ2VtYWlsLHVzZXJfYWJvdXRfbWUnLFxyXG4gICAgbG9hZGluZ1RleHQ6ICdWZXJpZmluZydcclxuICB9KTtcclxuICAkKGRvY3VtZW50KS5vbihmYi5jb25uZWN0ZWRFdmVudCwgZnVuY3Rpb24gKCkge1xyXG4gICAgJChkb2N1bWVudCkub24oJ3BvcHVwLWNsb3NlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuICBmYi5jb25uZWN0KCk7XHJcbn07XHJcblxyXG5hY3Rpb25zLmVtYWlsID0gZnVuY3Rpb24gKCkge1xyXG4gIHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ0FjY291bnQvJFJlc2VuZENvbmZpcm1hdGlvbkVtYWlsL25vdy8nLCBwb3B1cC5zaXplKCdzbWFsbCcpKTtcclxufTtcclxuXHJcbnZhciBsaW5rcyA9IGV4cG9ydHMubGlua3MgPSB7XHJcbiAgJyNjb25uZWN0LXdpdGgtZmFjZWJvb2snOiBhY3Rpb25zLmZhY2Vib29rLFxyXG4gICcjY29uZmlybS1lbWFpbCc6IGFjdGlvbnMuZW1haWxcclxufTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgJGMub24oJ2NsaWNrJywgJ2EnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBHZXQgdGhlIGFjdGlvbiBsaW5rIG9yIGVtcHR5XHJcbiAgICB2YXIgbGluayA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykgfHwgJyc7XHJcblxyXG4gICAgLy8gRXhlY3V0ZSB0aGUgYWN0aW9uIGF0dGFjaGVkIHRvIHRoYXQgbGlua1xyXG4gICAgdmFyIGFjdGlvbiA9IGxpbmtzW2xpbmtdIHx8IG51bGw7XHJcbiAgICBpZiAodHlwZW9mIChhY3Rpb24pID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGFjdGlvbigpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBWZXJpZmljYXRpb25zIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICBzZWN0aW9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZFZlcmlmaWNhdGlvbnMnLFxyXG4gICAgJHNlY3Rpb24gPSAkYy5maW5kKHNlY3Rpb25TZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJHNlY3Rpb24uc2libGluZ3MoKVxyXG4gICAgICAuYWRkKCRzZWN0aW9uLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSlcclxuICAgICAgLmFkZCgkc2VjdGlvbi5jbG9zZXN0KCcuRGFzaGJvYXJkQWJvdXRZb3UnKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKHNlY3Rpb25TZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuICAgIHJlcXVpcmUoJy4vYmFja2dyb3VuZENoZWNrUmVxdWVzdCcpLnNldHVwRm9ybSgkZWRpdG9yLmZpbmQoJy5EYXNoYm9hcmRCYWNrZ3JvdW5kQ2hlY2snKSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBBdmFpbGFiaWxpdHk6IFdlZWtseSBTY2hlZHVsZSBzZWN0aW9uIHNldHVwXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXIgPSByZXF1aXJlKCdMQy9hdmFpbGFiaWxpdHlDYWxlbmRhcicpO1xyXG52YXIgYmF0Y2hFdmVudEhhbmRsZXIgPSByZXF1aXJlKCdMQy9iYXRjaEV2ZW50SGFuZGxlcicpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgd29ya0hvdXJzTGlzdCA9IGF2YWlsYWJpbGl0eUNhbGVuZGFyLldvcmtIb3Vycy5lbmFibGVBbGwoKTtcclxuXHJcbiAgICAkLmVhY2god29ya0hvdXJzTGlzdCwgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICB2YXIgd29ya2hvdXJzID0gdGhpcztcclxuXHJcbiAgICAgICAgLy8gU2V0dXBpbmcgdGhlIFdvcmtIb3VycyBjYWxlbmRhciBkYXRhIGZpZWxkXHJcbiAgICAgICAgdmFyIGZvcm0gPSB3b3JraG91cnMuJGVsLmNsb3Nlc3QoJ2Zvcm0uYWpheCwgZmllbGRzZXQuYWpheCcpO1xyXG4gICAgICAgIHZhciBmaWVsZCA9IGZvcm0uZmluZCgnW25hbWU9d29ya2hvdXJzXScpO1xyXG4gICAgICAgIGlmIChmaWVsZC5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgIGZpZWxkID0gJCgnPGlucHV0IHR5cGU9XCJoaWRkZW5cIiBuYW1lPVwid29ya2hvdXJzXCIgLz4nKS5pbnNlcnRBZnRlcih3b3JraG91cnMuJGVsKTtcclxuXHJcbiAgICAgICAgLy8gU2F2ZSB3aGVuIHRoZSBmb3JtIGlzIHRvIGJlIHN1Ym1pdHRlZFxyXG4gICAgICAgIGZvcm0ub24oJ3ByZXN1Ym1pdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZmllbGQudmFsKEpTT04uc3RyaW5naWZ5KHdvcmtob3Vycy5kYXRhKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFVwZGF0aW5nIGZpZWxkIG9uIGNhbGVuZGFyIGNoYW5nZXMgKHVzaW5nIGJhdGNoIHRvIGF2b2lkIGh1cnQgcGVyZm9ybWFuY2UpXHJcbiAgICAgICAgLy8gYW5kIHJhaXNlIGNoYW5nZSBldmVudCAodGhpcyBmaXhlcyB0aGUgc3VwcG9ydCBmb3IgY2hhbmdlc05vdGlmaWNhdGlvblxyXG4gICAgICAgIC8vIGFuZCBpbnN0YW50LXNhdmluZykuXHJcbiAgICAgICAgd29ya2hvdXJzLmV2ZW50cy5vbignZGF0YUNoYW5nZWQnLCBiYXRjaEV2ZW50SGFuZGxlcihmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICBmaWVsZFxyXG4gICAgICAgICAgICAudmFsKEpTT04uc3RyaW5naWZ5KHdvcmtob3Vycy5kYXRhKSlcclxuICAgICAgICAgICAgLmNoYW5nZSgpO1xyXG4gICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgLy8gRGlzYWJsaW5nIGNhbGVuZGFyIG9uIGZpZWxkIGFsbHRpbWVcclxuICAgICAgICBmb3JtLmZpbmQoJ1tuYW1lPWFsbHRpbWVdJykub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKSxcclxuICAgICAgICBjbCA9IHdvcmtob3Vycy5jbGFzc2VzLmRpc2FibGVkO1xyXG4gICAgICAgICAgICBpZiAoY2wpXHJcbiAgICAgICAgICAgICAgICB3b3JraG91cnMuJGVsLnRvZ2dsZUNsYXNzKGNsLCAkdC5wcm9wKCdjaGVja2VkJykpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH0pO1xyXG59O1xyXG4iLCIvKiFcbiAqIGltYWdlc0xvYWRlZCB2My4xLjhcbiAqIEphdmFTY3JpcHQgaXMgYWxsIGxpa2UgXCJZb3UgaW1hZ2VzIGFyZSBkb25lIHlldCBvciB3aGF0P1wiXG4gKiBNSVQgTGljZW5zZVxuICovXG5cbiggZnVuY3Rpb24oIHdpbmRvdywgZmFjdG9yeSApIHsgJ3VzZSBzdHJpY3QnO1xuICAvLyB1bml2ZXJzYWwgbW9kdWxlIGRlZmluaXRpb25cblxuICAvKmdsb2JhbCBkZWZpbmU6IGZhbHNlLCBtb2R1bGU6IGZhbHNlLCByZXF1aXJlOiBmYWxzZSAqL1xuXG4gIGlmICggdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kICkge1xuICAgIC8vIEFNRFxuICAgIGRlZmluZSggW1xuICAgICAgJ2V2ZW50RW1pdHRlci9FdmVudEVtaXR0ZXInLFxuICAgICAgJ2V2ZW50aWUvZXZlbnRpZSdcbiAgICBdLCBmdW5jdGlvbiggRXZlbnRFbWl0dGVyLCBldmVudGllICkge1xuICAgICAgcmV0dXJuIGZhY3RvcnkoIHdpbmRvdywgRXZlbnRFbWl0dGVyLCBldmVudGllICk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyApIHtcbiAgICAvLyBDb21tb25KU1xuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcbiAgICAgIHdpbmRvdyxcbiAgICAgIHJlcXVpcmUoJ3dvbGZ5ODctZXZlbnRlbWl0dGVyJyksXG4gICAgICByZXF1aXJlKCdldmVudGllJylcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIC8vIGJyb3dzZXIgZ2xvYmFsXG4gICAgd2luZG93LmltYWdlc0xvYWRlZCA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICB3aW5kb3cuRXZlbnRFbWl0dGVyLFxuICAgICAgd2luZG93LmV2ZW50aWVcbiAgICApO1xuICB9XG5cbn0pKCB3aW5kb3csXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICBmYWN0b3J5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbmZ1bmN0aW9uIGZhY3RvcnkoIHdpbmRvdywgRXZlbnRFbWl0dGVyLCBldmVudGllICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciAkID0gd2luZG93LmpRdWVyeTtcbnZhciBjb25zb2xlID0gd2luZG93LmNvbnNvbGU7XG52YXIgaGFzQ29uc29sZSA9IHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaGVscGVycyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4vLyBleHRlbmQgb2JqZWN0c1xuZnVuY3Rpb24gZXh0ZW5kKCBhLCBiICkge1xuICBmb3IgKCB2YXIgcHJvcCBpbiBiICkge1xuICAgIGFbIHByb3AgXSA9IGJbIHByb3AgXTtcbiAgfVxuICByZXR1cm4gYTtcbn1cblxudmFyIG9ialRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmZ1bmN0aW9uIGlzQXJyYXkoIG9iaiApIHtcbiAgcmV0dXJuIG9ialRvU3RyaW5nLmNhbGwoIG9iaiApID09PSAnW29iamVjdCBBcnJheV0nO1xufVxuXG4vLyB0dXJuIGVsZW1lbnQgb3Igbm9kZUxpc3QgaW50byBhbiBhcnJheVxuZnVuY3Rpb24gbWFrZUFycmF5KCBvYmogKSB7XG4gIHZhciBhcnkgPSBbXTtcbiAgaWYgKCBpc0FycmF5KCBvYmogKSApIHtcbiAgICAvLyB1c2Ugb2JqZWN0IGlmIGFscmVhZHkgYW4gYXJyYXlcbiAgICBhcnkgPSBvYmo7XG4gIH0gZWxzZSBpZiAoIHR5cGVvZiBvYmoubGVuZ3RoID09PSAnbnVtYmVyJyApIHtcbiAgICAvLyBjb252ZXJ0IG5vZGVMaXN0IHRvIGFycmF5XG4gICAgZm9yICggdmFyIGk9MCwgbGVuID0gb2JqLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgYXJ5LnB1c2goIG9ialtpXSApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBhcnJheSBvZiBzaW5nbGUgaW5kZXhcbiAgICBhcnkucHVzaCggb2JqICk7XG4gIH1cbiAgcmV0dXJuIGFyeTtcbn1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBpbWFnZXNMb2FkZWQgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvKipcbiAgICogQHBhcmFtIHtBcnJheSwgRWxlbWVudCwgTm9kZUxpc3QsIFN0cmluZ30gZWxlbVxuICAgKiBAcGFyYW0ge09iamVjdCBvciBGdW5jdGlvbn0gb3B0aW9ucyAtIGlmIGZ1bmN0aW9uLCB1c2UgYXMgY2FsbGJhY2tcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gb25BbHdheXMgLSBjYWxsYmFjayBmdW5jdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gSW1hZ2VzTG9hZGVkKCBlbGVtLCBvcHRpb25zLCBvbkFsd2F5cyApIHtcbiAgICAvLyBjb2VyY2UgSW1hZ2VzTG9hZGVkKCkgd2l0aG91dCBuZXcsIHRvIGJlIG5ldyBJbWFnZXNMb2FkZWQoKVxuICAgIGlmICggISggdGhpcyBpbnN0YW5jZW9mIEltYWdlc0xvYWRlZCApICkge1xuICAgICAgcmV0dXJuIG5ldyBJbWFnZXNMb2FkZWQoIGVsZW0sIG9wdGlvbnMgKTtcbiAgICB9XG4gICAgLy8gdXNlIGVsZW0gYXMgc2VsZWN0b3Igc3RyaW5nXG4gICAgaWYgKCB0eXBlb2YgZWxlbSA9PT0gJ3N0cmluZycgKSB7XG4gICAgICBlbGVtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCggZWxlbSApO1xuICAgIH1cblxuICAgIHRoaXMuZWxlbWVudHMgPSBtYWtlQXJyYXkoIGVsZW0gKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBleHRlbmQoIHt9LCB0aGlzLm9wdGlvbnMgKTtcblxuICAgIGlmICggdHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicgKSB7XG4gICAgICBvbkFsd2F5cyA9IG9wdGlvbnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4dGVuZCggdGhpcy5vcHRpb25zLCBvcHRpb25zICk7XG4gICAgfVxuXG4gICAgaWYgKCBvbkFsd2F5cyApIHtcbiAgICAgIHRoaXMub24oICdhbHdheXMnLCBvbkFsd2F5cyApO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0SW1hZ2VzKCk7XG5cbiAgICBpZiAoICQgKSB7XG4gICAgICAvLyBhZGQgalF1ZXJ5IERlZmVycmVkIG9iamVjdFxuICAgICAgdGhpcy5qcURlZmVycmVkID0gbmV3ICQuRGVmZXJyZWQoKTtcbiAgICB9XG5cbiAgICAvLyBIQUNLIGNoZWNrIGFzeW5jIHRvIGFsbG93IHRpbWUgdG8gYmluZCBsaXN0ZW5lcnNcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuY2hlY2soKTtcbiAgICB9KTtcbiAgfVxuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5vcHRpb25zID0ge307XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5nZXRJbWFnZXMgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmltYWdlcyA9IFtdO1xuXG4gICAgLy8gZmlsdGVyICYgZmluZCBpdGVtcyBpZiB3ZSBoYXZlIGFuIGl0ZW0gc2VsZWN0b3JcbiAgICBmb3IgKCB2YXIgaT0wLCBsZW4gPSB0aGlzLmVsZW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuICAgICAgdmFyIGVsZW0gPSB0aGlzLmVsZW1lbnRzW2ldO1xuICAgICAgLy8gZmlsdGVyIHNpYmxpbmdzXG4gICAgICBpZiAoIGVsZW0ubm9kZU5hbWUgPT09ICdJTUcnICkge1xuICAgICAgICB0aGlzLmFkZEltYWdlKCBlbGVtICk7XG4gICAgICB9XG4gICAgICAvLyBmaW5kIGNoaWxkcmVuXG4gICAgICAvLyBubyBub24tZWxlbWVudCBub2RlcywgIzE0M1xuICAgICAgdmFyIG5vZGVUeXBlID0gZWxlbS5ub2RlVHlwZTtcbiAgICAgIGlmICggIW5vZGVUeXBlIHx8ICEoIG5vZGVUeXBlID09PSAxIHx8IG5vZGVUeXBlID09PSA5IHx8IG5vZGVUeXBlID09PSAxMSApICkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHZhciBjaGlsZEVsZW1zID0gZWxlbS5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKTtcbiAgICAgIC8vIGNvbmNhdCBjaGlsZEVsZW1zIHRvIGZpbHRlckZvdW5kIGFycmF5XG4gICAgICBmb3IgKCB2YXIgaj0wLCBqTGVuID0gY2hpbGRFbGVtcy5sZW5ndGg7IGogPCBqTGVuOyBqKysgKSB7XG4gICAgICAgIHZhciBpbWcgPSBjaGlsZEVsZW1zW2pdO1xuICAgICAgICB0aGlzLmFkZEltYWdlKCBpbWcgKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SW1hZ2V9IGltZ1xuICAgKi9cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5hZGRJbWFnZSA9IGZ1bmN0aW9uKCBpbWcgKSB7XG4gICAgdmFyIGxvYWRpbmdJbWFnZSA9IG5ldyBMb2FkaW5nSW1hZ2UoIGltZyApO1xuICAgIHRoaXMuaW1hZ2VzLnB1c2goIGxvYWRpbmdJbWFnZSApO1xuICB9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHZhciBjaGVja2VkQ291bnQgPSAwO1xuICAgIHZhciBsZW5ndGggPSB0aGlzLmltYWdlcy5sZW5ndGg7XG4gICAgdGhpcy5oYXNBbnlCcm9rZW4gPSBmYWxzZTtcbiAgICAvLyBjb21wbGV0ZSBpZiBubyBpbWFnZXNcbiAgICBpZiAoICFsZW5ndGggKSB7XG4gICAgICB0aGlzLmNvbXBsZXRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25Db25maXJtKCBpbWFnZSwgbWVzc2FnZSApIHtcbiAgICAgIGlmICggX3RoaXMub3B0aW9ucy5kZWJ1ZyAmJiBoYXNDb25zb2xlICkge1xuICAgICAgICBjb25zb2xlLmxvZyggJ2NvbmZpcm0nLCBpbWFnZSwgbWVzc2FnZSApO1xuICAgICAgfVxuXG4gICAgICBfdGhpcy5wcm9ncmVzcyggaW1hZ2UgKTtcbiAgICAgIGNoZWNrZWRDb3VudCsrO1xuICAgICAgaWYgKCBjaGVja2VkQ291bnQgPT09IGxlbmd0aCApIHtcbiAgICAgICAgX3RoaXMuY29tcGxldGUoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlOyAvLyBiaW5kIG9uY2VcbiAgICB9XG5cbiAgICBmb3IgKCB2YXIgaT0wOyBpIDwgbGVuZ3RoOyBpKysgKSB7XG4gICAgICB2YXIgbG9hZGluZ0ltYWdlID0gdGhpcy5pbWFnZXNbaV07XG4gICAgICBsb2FkaW5nSW1hZ2Uub24oICdjb25maXJtJywgb25Db25maXJtICk7XG4gICAgICBsb2FkaW5nSW1hZ2UuY2hlY2soKTtcbiAgICB9XG4gIH07XG5cbiAgSW1hZ2VzTG9hZGVkLnByb3RvdHlwZS5wcm9ncmVzcyA9IGZ1bmN0aW9uKCBpbWFnZSApIHtcbiAgICB0aGlzLmhhc0FueUJyb2tlbiA9IHRoaXMuaGFzQW55QnJva2VuIHx8ICFpbWFnZS5pc0xvYWRlZDtcbiAgICAvLyBIQUNLIC0gQ2hyb21lIHRyaWdnZXJzIGV2ZW50IGJlZm9yZSBvYmplY3QgcHJvcGVydGllcyBoYXZlIGNoYW5nZWQuICM4M1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5lbWl0KCAncHJvZ3Jlc3MnLCBfdGhpcywgaW1hZ2UgKTtcbiAgICAgIGlmICggX3RoaXMuanFEZWZlcnJlZCAmJiBfdGhpcy5qcURlZmVycmVkLm5vdGlmeSApIHtcbiAgICAgICAgX3RoaXMuanFEZWZlcnJlZC5ub3RpZnkoIF90aGlzLCBpbWFnZSApO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuY29tcGxldGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZXZlbnROYW1lID0gdGhpcy5oYXNBbnlCcm9rZW4gPyAnZmFpbCcgOiAnZG9uZSc7XG4gICAgdGhpcy5pc0NvbXBsZXRlID0gdHJ1ZTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIC8vIEhBQ0sgLSBhbm90aGVyIHNldFRpbWVvdXQgc28gdGhhdCBjb25maXJtIGhhcHBlbnMgYWZ0ZXIgcHJvZ3Jlc3NcbiAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLmVtaXQoIGV2ZW50TmFtZSwgX3RoaXMgKTtcbiAgICAgIF90aGlzLmVtaXQoICdhbHdheXMnLCBfdGhpcyApO1xuICAgICAgaWYgKCBfdGhpcy5qcURlZmVycmVkICkge1xuICAgICAgICB2YXIganFNZXRob2QgPSBfdGhpcy5oYXNBbnlCcm9rZW4gPyAncmVqZWN0JyA6ICdyZXNvbHZlJztcbiAgICAgICAgX3RoaXMuanFEZWZlcnJlZFsganFNZXRob2QgXSggX3RoaXMgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBqcXVlcnkgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICBpZiAoICQgKSB7XG4gICAgJC5mbi5pbWFnZXNMb2FkZWQgPSBmdW5jdGlvbiggb3B0aW9ucywgY2FsbGJhY2sgKSB7XG4gICAgICB2YXIgaW5zdGFuY2UgPSBuZXcgSW1hZ2VzTG9hZGVkKCB0aGlzLCBvcHRpb25zLCBjYWxsYmFjayApO1xuICAgICAgcmV0dXJuIGluc3RhbmNlLmpxRGVmZXJyZWQucHJvbWlzZSggJCh0aGlzKSApO1xuICAgIH07XG4gIH1cblxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIGZ1bmN0aW9uIExvYWRpbmdJbWFnZSggaW1nICkge1xuICAgIHRoaXMuaW1nID0gaW1nO1xuICB9XG5cbiAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gZmlyc3QgY2hlY2sgY2FjaGVkIGFueSBwcmV2aW91cyBpbWFnZXMgdGhhdCBoYXZlIHNhbWUgc3JjXG4gICAgdmFyIHJlc291cmNlID0gY2FjaGVbIHRoaXMuaW1nLnNyYyBdIHx8IG5ldyBSZXNvdXJjZSggdGhpcy5pbWcuc3JjICk7XG4gICAgaWYgKCByZXNvdXJjZS5pc0NvbmZpcm1lZCApIHtcbiAgICAgIHRoaXMuY29uZmlybSggcmVzb3VyY2UuaXNMb2FkZWQsICdjYWNoZWQgd2FzIGNvbmZpcm1lZCcgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiBjb21wbGV0ZSBpcyB0cnVlIGFuZCBicm93c2VyIHN1cHBvcnRzIG5hdHVyYWwgc2l6ZXMsXG4gICAgLy8gdHJ5IHRvIGNoZWNrIGZvciBpbWFnZSBzdGF0dXMgbWFudWFsbHkuXG4gICAgaWYgKCB0aGlzLmltZy5jb21wbGV0ZSAmJiB0aGlzLmltZy5uYXR1cmFsV2lkdGggIT09IHVuZGVmaW5lZCApIHtcbiAgICAgIC8vIHJlcG9ydCBiYXNlZCBvbiBuYXR1cmFsV2lkdGhcbiAgICAgIHRoaXMuY29uZmlybSggdGhpcy5pbWcubmF0dXJhbFdpZHRoICE9PSAwLCAnbmF0dXJhbFdpZHRoJyApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIG5vbmUgb2YgdGhlIGNoZWNrcyBhYm92ZSBtYXRjaGVkLCBzaW11bGF0ZSBsb2FkaW5nIG9uIGRldGFjaGVkIGVsZW1lbnQuXG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICByZXNvdXJjZS5vbiggJ2NvbmZpcm0nLCBmdW5jdGlvbiggcmVzcmMsIG1lc3NhZ2UgKSB7XG4gICAgICBfdGhpcy5jb25maXJtKCByZXNyYy5pc0xvYWRlZCwgbWVzc2FnZSApO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG5cbiAgICByZXNvdXJjZS5jaGVjaygpO1xuICB9O1xuXG4gIExvYWRpbmdJbWFnZS5wcm90b3R5cGUuY29uZmlybSA9IGZ1bmN0aW9uKCBpc0xvYWRlZCwgbWVzc2FnZSApIHtcbiAgICB0aGlzLmlzTG9hZGVkID0gaXNMb2FkZWQ7XG4gICAgdGhpcy5lbWl0KCAnY29uZmlybScsIHRoaXMsIG1lc3NhZ2UgKTtcbiAgfTtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBSZXNvdXJjZSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG4gIC8vIFJlc291cmNlIGNoZWNrcyBlYWNoIHNyYywgb25seSBvbmNlXG4gIC8vIHNlcGFyYXRlIGNsYXNzIGZyb20gTG9hZGluZ0ltYWdlIHRvIHByZXZlbnQgbWVtb3J5IGxlYWtzLiBTZWUgIzExNVxuXG4gIHZhciBjYWNoZSA9IHt9O1xuXG4gIGZ1bmN0aW9uIFJlc291cmNlKCBzcmMgKSB7XG4gICAgdGhpcy5zcmMgPSBzcmM7XG4gICAgLy8gYWRkIHRvIGNhY2hlXG4gICAgY2FjaGVbIHNyYyBdID0gdGhpcztcbiAgfVxuXG4gIFJlc291cmNlLnByb3RvdHlwZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICBSZXNvdXJjZS5wcm90b3R5cGUuY2hlY2sgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBvbmx5IHRyaWdnZXIgY2hlY2tpbmcgb25jZVxuICAgIGlmICggdGhpcy5pc0NoZWNrZWQgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHNpbXVsYXRlIGxvYWRpbmcgb24gZGV0YWNoZWQgZWxlbWVudFxuICAgIHZhciBwcm94eUltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgZXZlbnRpZS5iaW5kKCBwcm94eUltYWdlLCAnbG9hZCcsIHRoaXMgKTtcbiAgICBldmVudGllLmJpbmQoIHByb3h5SW1hZ2UsICdlcnJvcicsIHRoaXMgKTtcbiAgICBwcm94eUltYWdlLnNyYyA9IHRoaXMuc3JjO1xuICAgIC8vIHNldCBmbGFnXG4gICAgdGhpcy5pc0NoZWNrZWQgPSB0cnVlO1xuICB9O1xuXG4gIC8vIC0tLS0tIGV2ZW50cyAtLS0tLSAvL1xuXG4gIC8vIHRyaWdnZXIgc3BlY2lmaWVkIGhhbmRsZXIgZm9yIGV2ZW50IHR5cGVcbiAgUmVzb3VyY2UucHJvdG90eXBlLmhhbmRsZUV2ZW50ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAgIHZhciBtZXRob2QgPSAnb24nICsgZXZlbnQudHlwZTtcbiAgICBpZiAoIHRoaXNbIG1ldGhvZCBdICkge1xuICAgICAgdGhpc1sgbWV0aG9kIF0oIGV2ZW50ICk7XG4gICAgfVxuICB9O1xuXG4gIFJlc291cmNlLnByb3RvdHlwZS5vbmxvYWQgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgdGhpcy5jb25maXJtKCB0cnVlLCAnb25sb2FkJyApO1xuICAgIHRoaXMudW5iaW5kUHJveHlFdmVudHMoIGV2ZW50ICk7XG4gIH07XG5cbiAgUmVzb3VyY2UucHJvdG90eXBlLm9uZXJyb3IgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgdGhpcy5jb25maXJtKCBmYWxzZSwgJ29uZXJyb3InICk7XG4gICAgdGhpcy51bmJpbmRQcm94eUV2ZW50cyggZXZlbnQgKTtcbiAgfTtcblxuICAvLyAtLS0tLSBjb25maXJtIC0tLS0tIC8vXG5cbiAgUmVzb3VyY2UucHJvdG90eXBlLmNvbmZpcm0gPSBmdW5jdGlvbiggaXNMb2FkZWQsIG1lc3NhZ2UgKSB7XG4gICAgdGhpcy5pc0NvbmZpcm1lZCA9IHRydWU7XG4gICAgdGhpcy5pc0xvYWRlZCA9IGlzTG9hZGVkO1xuICAgIHRoaXMuZW1pdCggJ2NvbmZpcm0nLCB0aGlzLCBtZXNzYWdlICk7XG4gIH07XG5cbiAgUmVzb3VyY2UucHJvdG90eXBlLnVuYmluZFByb3h5RXZlbnRzID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAgIGV2ZW50aWUudW5iaW5kKCBldmVudC50YXJnZXQsICdsb2FkJywgdGhpcyApO1xuICAgIGV2ZW50aWUudW5iaW5kKCBldmVudC50YXJnZXQsICdlcnJvcicsIHRoaXMgKTtcbiAgfTtcblxuICAvLyAtLS0tLSAgLS0tLS0gLy9cblxuICByZXR1cm4gSW1hZ2VzTG9hZGVkO1xuXG59KTtcbiIsIi8qIVxuICogZXZlbnRpZSB2MS4wLjVcbiAqIGV2ZW50IGJpbmRpbmcgaGVscGVyXG4gKiAgIGV2ZW50aWUuYmluZCggZWxlbSwgJ2NsaWNrJywgbXlGbiApXG4gKiAgIGV2ZW50aWUudW5iaW5kKCBlbGVtLCAnY2xpY2snLCBteUZuIClcbiAqIE1JVCBsaWNlbnNlXG4gKi9cblxuLypqc2hpbnQgYnJvd3NlcjogdHJ1ZSwgdW5kZWY6IHRydWUsIHVudXNlZDogdHJ1ZSAqL1xuLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3cgKSB7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGRvY0VsZW0gPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbnZhciBiaW5kID0gZnVuY3Rpb24oKSB7fTtcblxuZnVuY3Rpb24gZ2V0SUVFdmVudCggb2JqICkge1xuICB2YXIgZXZlbnQgPSB3aW5kb3cuZXZlbnQ7XG4gIC8vIGFkZCBldmVudC50YXJnZXRcbiAgZXZlbnQudGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQgfHwgb2JqO1xuICByZXR1cm4gZXZlbnQ7XG59XG5cbmlmICggZG9jRWxlbS5hZGRFdmVudExpc3RlbmVyICkge1xuICBiaW5kID0gZnVuY3Rpb24oIG9iaiwgdHlwZSwgZm4gKSB7XG4gICAgb2JqLmFkZEV2ZW50TGlzdGVuZXIoIHR5cGUsIGZuLCBmYWxzZSApO1xuICB9O1xufSBlbHNlIGlmICggZG9jRWxlbS5hdHRhY2hFdmVudCApIHtcbiAgYmluZCA9IGZ1bmN0aW9uKCBvYmosIHR5cGUsIGZuICkge1xuICAgIG9ialsgdHlwZSArIGZuIF0gPSBmbi5oYW5kbGVFdmVudCA/XG4gICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gZ2V0SUVFdmVudCggb2JqICk7XG4gICAgICAgIGZuLmhhbmRsZUV2ZW50LmNhbGwoIGZuLCBldmVudCApO1xuICAgICAgfSA6XG4gICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gZ2V0SUVFdmVudCggb2JqICk7XG4gICAgICAgIGZuLmNhbGwoIG9iaiwgZXZlbnQgKTtcbiAgICAgIH07XG4gICAgb2JqLmF0dGFjaEV2ZW50KCBcIm9uXCIgKyB0eXBlLCBvYmpbIHR5cGUgKyBmbiBdICk7XG4gIH07XG59XG5cbnZhciB1bmJpbmQgPSBmdW5jdGlvbigpIHt9O1xuXG5pZiAoIGRvY0VsZW0ucmVtb3ZlRXZlbnRMaXN0ZW5lciApIHtcbiAgdW5iaW5kID0gZnVuY3Rpb24oIG9iaiwgdHlwZSwgZm4gKSB7XG4gICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIoIHR5cGUsIGZuLCBmYWxzZSApO1xuICB9O1xufSBlbHNlIGlmICggZG9jRWxlbS5kZXRhY2hFdmVudCApIHtcbiAgdW5iaW5kID0gZnVuY3Rpb24oIG9iaiwgdHlwZSwgZm4gKSB7XG4gICAgb2JqLmRldGFjaEV2ZW50KCBcIm9uXCIgKyB0eXBlLCBvYmpbIHR5cGUgKyBmbiBdICk7XG4gICAgdHJ5IHtcbiAgICAgIGRlbGV0ZSBvYmpbIHR5cGUgKyBmbiBdO1xuICAgIH0gY2F0Y2ggKCBlcnIgKSB7XG4gICAgICAvLyBjYW4ndCBkZWxldGUgd2luZG93IG9iamVjdCBwcm9wZXJ0aWVzXG4gICAgICBvYmpbIHR5cGUgKyBmbiBdID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfTtcbn1cblxudmFyIGV2ZW50aWUgPSB7XG4gIGJpbmQ6IGJpbmQsXG4gIHVuYmluZDogdW5iaW5kXG59O1xuXG4vLyAtLS0tLSBtb2R1bGUgZGVmaW5pdGlvbiAtLS0tLSAvL1xuXG5pZiAoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgLy8gQU1EXG4gIGRlZmluZSggZXZlbnRpZSApO1xufSBlbHNlIGlmICggdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICkge1xuICAvLyBDb21tb25KU1xuICBtb2R1bGUuZXhwb3J0cyA9IGV2ZW50aWU7XG59IGVsc2Uge1xuICAvLyBicm93c2VyIGdsb2JhbFxuICB3aW5kb3cuZXZlbnRpZSA9IGV2ZW50aWU7XG59XG5cbn0pKCB0aGlzICk7XG4iLCIvKiFcbiAqIEV2ZW50RW1pdHRlciB2NC4yLjYgLSBnaXQuaW8vZWVcbiAqIE9saXZlciBDYWxkd2VsbFxuICogTUlUIGxpY2Vuc2VcbiAqIEBwcmVzZXJ2ZVxuICovXG5cbihmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvKipcblx0ICogQ2xhc3MgZm9yIG1hbmFnaW5nIGV2ZW50cy5cblx0ICogQ2FuIGJlIGV4dGVuZGVkIHRvIHByb3ZpZGUgZXZlbnQgZnVuY3Rpb25hbGl0eSBpbiBvdGhlciBjbGFzc2VzLlxuXHQgKlxuXHQgKiBAY2xhc3MgRXZlbnRFbWl0dGVyIE1hbmFnZXMgZXZlbnQgcmVnaXN0ZXJpbmcgYW5kIGVtaXR0aW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gRXZlbnRFbWl0dGVyKCkge31cblxuXHQvLyBTaG9ydGN1dHMgdG8gaW1wcm92ZSBzcGVlZCBhbmQgc2l6ZVxuXHR2YXIgcHJvdG8gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlO1xuXHR2YXIgZXhwb3J0cyA9IHRoaXM7XG5cdHZhciBvcmlnaW5hbEdsb2JhbFZhbHVlID0gZXhwb3J0cy5FdmVudEVtaXR0ZXI7XG5cblx0LyoqXG5cdCAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgbGlzdGVuZXIgZm9yIHRoZSBldmVudCBpbiBpdCdzIHN0b3JhZ2UgYXJyYXkuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gbGlzdGVuZXJzIEFycmF5IG9mIGxpc3RlbmVycyB0byBzZWFyY2ggdGhyb3VnaC5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGxvb2sgZm9yLlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9IEluZGV4IG9mIHRoZSBzcGVjaWZpZWQgbGlzdGVuZXIsIC0xIGlmIG5vdCBmb3VuZFxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnMsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuXHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdGlmIChsaXN0ZW5lcnNbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiAtMTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBbGlhcyBhIG1ldGhvZCB3aGlsZSBrZWVwaW5nIHRoZSBjb250ZXh0IGNvcnJlY3QsIHRvIGFsbG93IGZvciBvdmVyd3JpdGluZyBvZiB0YXJnZXQgbWV0aG9kLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgdGFyZ2V0IG1ldGhvZC5cblx0ICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBhbGlhc2VkIG1ldGhvZFxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdGZ1bmN0aW9uIGFsaWFzKG5hbWUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gYWxpYXNDbG9zdXJlKCkge1xuXHRcdFx0cmV0dXJuIHRoaXNbbmFtZV0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0XHR9O1xuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGxpc3RlbmVyIGFycmF5IGZvciB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBXaWxsIGluaXRpYWxpc2UgdGhlIGV2ZW50IG9iamVjdCBhbmQgbGlzdGVuZXIgYXJyYXlzIGlmIHJlcXVpcmVkLlxuXHQgKiBXaWxsIHJldHVybiBhbiBvYmplY3QgaWYgeW91IHVzZSBhIHJlZ2V4IHNlYXJjaC4gVGhlIG9iamVjdCBjb250YWlucyBrZXlzIGZvciBlYWNoIG1hdGNoZWQgZXZlbnQuIFNvIC9iYVtyel0vIG1pZ2h0IHJldHVybiBhbiBvYmplY3QgY29udGFpbmluZyBiYXIgYW5kIGJhei4gQnV0IG9ubHkgaWYgeW91IGhhdmUgZWl0aGVyIGRlZmluZWQgdGhlbSB3aXRoIGRlZmluZUV2ZW50IG9yIGFkZGVkIHNvbWUgbGlzdGVuZXJzIHRvIHRoZW0uXG5cdCAqIEVhY2ggcHJvcGVydHkgaW4gdGhlIG9iamVjdCByZXNwb25zZSBpcyBhbiBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9uW118T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciB0aGUgZXZlbnQuXG5cdCAqL1xuXHRwcm90by5nZXRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnMoZXZ0KSB7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuXHRcdHZhciByZXNwb25zZTtcblx0XHR2YXIga2V5O1xuXG5cdFx0Ly8gUmV0dXJuIGEgY29uY2F0ZW5hdGVkIGFycmF5IG9mIGFsbCBtYXRjaGluZyBldmVudHMgaWZcblx0XHQvLyB0aGUgc2VsZWN0b3IgaXMgYSByZWd1bGFyIGV4cHJlc3Npb24uXG5cdFx0aWYgKHR5cGVvZiBldnQgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRyZXNwb25zZSA9IHt9O1xuXHRcdFx0Zm9yIChrZXkgaW4gZXZlbnRzKSB7XG5cdFx0XHRcdGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG5cdFx0XHRcdFx0cmVzcG9uc2Vba2V5XSA9IGV2ZW50c1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmVzcG9uc2UgPSBldmVudHNbZXZ0XSB8fCAoZXZlbnRzW2V2dF0gPSBbXSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3BvbnNlO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBUYWtlcyBhIGxpc3Qgb2YgbGlzdGVuZXIgb2JqZWN0cyBhbmQgZmxhdHRlbnMgaXQgaW50byBhIGxpc3Qgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdFtdfSBsaXN0ZW5lcnMgUmF3IGxpc3RlbmVyIG9iamVjdHMuXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9uW119IEp1c3QgdGhlIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICovXG5cdHByb3RvLmZsYXR0ZW5MaXN0ZW5lcnMgPSBmdW5jdGlvbiBmbGF0dGVuTGlzdGVuZXJzKGxpc3RlbmVycykge1xuXHRcdHZhciBmbGF0TGlzdGVuZXJzID0gW107XG5cdFx0dmFyIGk7XG5cblx0XHRmb3IgKGkgPSAwOyBpIDwgbGlzdGVuZXJzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHRmbGF0TGlzdGVuZXJzLnB1c2gobGlzdGVuZXJzW2ldLmxpc3RlbmVyKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmxhdExpc3RlbmVycztcblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgcmVxdWVzdGVkIGxpc3RlbmVycyB2aWEgZ2V0TGlzdGVuZXJzIGJ1dCB3aWxsIGFsd2F5cyByZXR1cm4gdGhlIHJlc3VsdHMgaW5zaWRlIGFuIG9iamVjdC4gVGhpcyBpcyBtYWlubHkgZm9yIGludGVybmFsIHVzZSBidXQgb3RoZXJzIG1heSBmaW5kIGl0IHVzZWZ1bC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmV0dXJuIHRoZSBsaXN0ZW5lcnMgZnJvbS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBBbGwgbGlzdGVuZXIgZnVuY3Rpb25zIGZvciBhbiBldmVudCBpbiBhbiBvYmplY3QuXG5cdCAqL1xuXHRwcm90by5nZXRMaXN0ZW5lcnNBc09iamVjdCA9IGZ1bmN0aW9uIGdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCkge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVycyhldnQpO1xuXHRcdHZhciByZXNwb25zZTtcblxuXHRcdGlmIChsaXN0ZW5lcnMgaW5zdGFuY2VvZiBBcnJheSkge1xuXHRcdFx0cmVzcG9uc2UgPSB7fTtcblx0XHRcdHJlc3BvbnNlW2V2dF0gPSBsaXN0ZW5lcnM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3BvbnNlIHx8IGxpc3RlbmVycztcblx0fTtcblxuXHQvKipcblx0ICogQWRkcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFRoZSBsaXN0ZW5lciB3aWxsIG5vdCBiZSBhZGRlZCBpZiBpdCBpcyBhIGR1cGxpY2F0ZS5cblx0ICogSWYgdGhlIGxpc3RlbmVyIHJldHVybnMgdHJ1ZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBhZnRlciBpdCBpcyBjYWxsZWQuXG5cdCAqIElmIHlvdSBwYXNzIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lIHRoZW4gdGhlIGxpc3RlbmVyIHdpbGwgYmUgYWRkZWQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgY2FsbGluZy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uIGFkZExpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBsaXN0ZW5lcklzV3JhcHBlZCA9IHR5cGVvZiBsaXN0ZW5lciA9PT0gJ29iamVjdCc7XG5cdFx0dmFyIGtleTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpID09PSAtMSkge1xuXHRcdFx0XHRsaXN0ZW5lcnNba2V5XS5wdXNoKGxpc3RlbmVySXNXcmFwcGVkID8gbGlzdGVuZXIgOiB7XG5cdFx0XHRcdFx0bGlzdGVuZXI6IGxpc3RlbmVyLFxuXHRcdFx0XHRcdG9uY2U6IGZhbHNlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBhZGRMaXN0ZW5lclxuXHQgKi9cblx0cHJvdG8ub24gPSBhbGlhcygnYWRkTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogU2VtaS1hbGlhcyBvZiBhZGRMaXN0ZW5lci4gSXQgd2lsbCBhZGQgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmVcblx0ICogYXV0b21hdGljYWxseSByZW1vdmVkIGFmdGVyIGl0J3MgZmlyc3QgZXhlY3V0aW9uLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBhdHRhY2ggdGhlIGxpc3RlbmVyIHRvLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IGlzIGVtaXR0ZWQuIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgY2FsbGluZy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRPbmNlTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRPbmNlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHJldHVybiB0aGlzLmFkZExpc3RlbmVyKGV2dCwge1xuXHRcdFx0bGlzdGVuZXI6IGxpc3RlbmVyLFxuXHRcdFx0b25jZTogdHJ1ZVxuXHRcdH0pO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBhZGRPbmNlTGlzdGVuZXIuXG5cdCAqL1xuXHRwcm90by5vbmNlID0gYWxpYXMoJ2FkZE9uY2VMaXN0ZW5lcicpO1xuXG5cdC8qKlxuXHQgKiBEZWZpbmVzIGFuIGV2ZW50IG5hbWUuIFRoaXMgaXMgcmVxdWlyZWQgaWYgeW91IHdhbnQgdG8gdXNlIGEgcmVnZXggdG8gYWRkIGEgbGlzdGVuZXIgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIElmIHlvdSBkb24ndCBkbyB0aGlzIHRoZW4gaG93IGRvIHlvdSBleHBlY3QgaXQgdG8ga25vdyB3aGF0IGV2ZW50IHRvIGFkZCB0bz8gU2hvdWxkIGl0IGp1c3QgYWRkIHRvIGV2ZXJ5IHBvc3NpYmxlIG1hdGNoIGZvciBhIHJlZ2V4PyBOby4gVGhhdCBpcyBzY2FyeSBhbmQgYmFkLlxuXHQgKiBZb3UgbmVlZCB0byB0ZWxsIGl0IHdoYXQgZXZlbnQgbmFtZXMgc2hvdWxkIGJlIG1hdGNoZWQgYnkgYSByZWdleC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBjcmVhdGUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZGVmaW5lRXZlbnQgPSBmdW5jdGlvbiBkZWZpbmVFdmVudChldnQpIHtcblx0XHR0aGlzLmdldExpc3RlbmVycyhldnQpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBVc2VzIGRlZmluZUV2ZW50IHRvIGRlZmluZSBtdWx0aXBsZSBldmVudHMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nW119IGV2dHMgQW4gYXJyYXkgb2YgZXZlbnQgbmFtZXMgdG8gZGVmaW5lLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmRlZmluZUV2ZW50cyA9IGZ1bmN0aW9uIGRlZmluZUV2ZW50cyhldnRzKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBldnRzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHR0aGlzLmRlZmluZUV2ZW50KGV2dHNbaV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhIGxpc3RlbmVyIGZ1bmN0aW9uIGZyb20gdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogV2hlbiBwYXNzZWQgYSByZWd1bGFyIGV4cHJlc3Npb24gYXMgdGhlIGV2ZW50IG5hbWUsIGl0IHdpbGwgcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lciBmcm9tLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBNZXRob2QgdG8gcmVtb3ZlIGZyb20gdGhlIGV2ZW50LlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIoZXZ0LCBsaXN0ZW5lcikge1xuXHRcdHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldExpc3RlbmVyc0FzT2JqZWN0KGV2dCk7XG5cdFx0dmFyIGluZGV4O1xuXHRcdHZhciBrZXk7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpbmRleCA9IGluZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lcnNba2V5XSwgbGlzdGVuZXIpO1xuXG5cdFx0XHRcdGlmIChpbmRleCAhPT0gLTEpIHtcblx0XHRcdFx0XHRsaXN0ZW5lcnNba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIHJlbW92ZUxpc3RlbmVyXG5cdCAqL1xuXHRwcm90by5vZmYgPSBhbGlhcygncmVtb3ZlTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogQWRkcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gYWRkIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBUaGUgb2JqZWN0IHNob3VsZCBjb250YWluIGtleSB2YWx1ZSBwYWlycyBvZiBldmVudHMgYW5kIGxpc3RlbmVycyBvciBsaXN0ZW5lciBhcnJheXMuIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGFuIGV2ZW50IG5hbWUgYW5kIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0byBiZSBhZGRlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gYWRkIHRoZSBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKiBZZWFoLCB0aGlzIGZ1bmN0aW9uIGRvZXMgcXVpdGUgYSBiaXQuIFRoYXQncyBwcm9iYWJseSBhIGJhZCB0aGluZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fFJlZ0V4cH0gZXZ0IEFuIGV2ZW50IG5hbWUgaWYgeW91IHdpbGwgcGFzcyBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgbmV4dC4gQW4gb2JqZWN0IGlmIHlvdSB3aXNoIHRvIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gYWRkLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmFkZExpc3RlbmVycyA9IGZ1bmN0aW9uIGFkZExpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuXHRcdC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG5cdFx0cmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyhmYWxzZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGxpc3RlbmVycyBpbiBidWxrIHVzaW5nIHRoZSBtYW5pcHVsYXRlTGlzdGVuZXJzIG1ldGhvZC5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgcmVtb3ZlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lcnMgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byByZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbltdfSBbbGlzdGVuZXJzXSBBbiBvcHRpb25hbCBhcnJheSBvZiBsaXN0ZW5lciBmdW5jdGlvbnMgdG8gcmVtb3ZlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLnJlbW92ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycyhldnQsIGxpc3RlbmVycykge1xuXHRcdC8vIFBhc3MgdGhyb3VnaCB0byBtYW5pcHVsYXRlTGlzdGVuZXJzXG5cdFx0cmV0dXJuIHRoaXMubWFuaXB1bGF0ZUxpc3RlbmVycyh0cnVlLCBldnQsIGxpc3RlbmVycyk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEVkaXRzIGxpc3RlbmVycyBpbiBidWxrLiBUaGUgYWRkTGlzdGVuZXJzIGFuZCByZW1vdmVMaXN0ZW5lcnMgbWV0aG9kcyBib3RoIHVzZSB0aGlzIHRvIGRvIHRoZWlyIGpvYi4gWW91IHNob3VsZCByZWFsbHkgdXNlIHRob3NlIGluc3RlYWQsIHRoaXMgaXMgYSBsaXR0bGUgbG93ZXIgbGV2ZWwuXG5cdCAqIFRoZSBmaXJzdCBhcmd1bWVudCB3aWxsIGRldGVybWluZSBpZiB0aGUgbGlzdGVuZXJzIGFyZSByZW1vdmVkICh0cnVlKSBvciBhZGRlZCAoZmFsc2UpLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZC9yZW1vdmUgZnJvbSBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQvcmVtb3ZlZC5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gbWFuaXB1bGF0ZSB0aGUgbGlzdGVuZXJzIG9mIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtCb29sZWFufSByZW1vdmUgVHJ1ZSBpZiB5b3Ugd2FudCB0byByZW1vdmUgbGlzdGVuZXJzLCBmYWxzZSBpZiB5b3Ugd2FudCB0byBhZGQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC9yZW1vdmUuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ubWFuaXB1bGF0ZUxpc3RlbmVycyA9IGZ1bmN0aW9uIG1hbmlwdWxhdGVMaXN0ZW5lcnMocmVtb3ZlLCBldnQsIGxpc3RlbmVycykge1xuXHRcdHZhciBpO1xuXHRcdHZhciB2YWx1ZTtcblx0XHR2YXIgc2luZ2xlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lciA6IHRoaXMuYWRkTGlzdGVuZXI7XG5cdFx0dmFyIG11bHRpcGxlID0gcmVtb3ZlID8gdGhpcy5yZW1vdmVMaXN0ZW5lcnMgOiB0aGlzLmFkZExpc3RlbmVycztcblxuXHRcdC8vIElmIGV2dCBpcyBhbiBvYmplY3QgdGhlbiBwYXNzIGVhY2ggb2YgaXQncyBwcm9wZXJ0aWVzIHRvIHRoaXMgbWV0aG9kXG5cdFx0aWYgKHR5cGVvZiBldnQgPT09ICdvYmplY3QnICYmICEoZXZ0IGluc3RhbmNlb2YgUmVnRXhwKSkge1xuXHRcdFx0Zm9yIChpIGluIGV2dCkge1xuXHRcdFx0XHRpZiAoZXZ0Lmhhc093blByb3BlcnR5KGkpICYmICh2YWx1ZSA9IGV2dFtpXSkpIHtcblx0XHRcdFx0XHQvLyBQYXNzIHRoZSBzaW5nbGUgbGlzdGVuZXIgc3RyYWlnaHQgdGhyb3VnaCB0byB0aGUgc2luZ3VsYXIgbWV0aG9kXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0XHRcdFx0c2luZ2xlLmNhbGwodGhpcywgaSwgdmFsdWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdC8vIE90aGVyd2lzZSBwYXNzIGJhY2sgdG8gdGhlIG11bHRpcGxlIGZ1bmN0aW9uXG5cdFx0XHRcdFx0XHRtdWx0aXBsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQvLyBTbyBldnQgbXVzdCBiZSBhIHN0cmluZ1xuXHRcdFx0Ly8gQW5kIGxpc3RlbmVycyBtdXN0IGJlIGFuIGFycmF5IG9mIGxpc3RlbmVyc1xuXHRcdFx0Ly8gTG9vcCBvdmVyIGl0IGFuZCBwYXNzIGVhY2ggb25lIHRvIHRoZSBtdWx0aXBsZSBtZXRob2Rcblx0XHRcdGkgPSBsaXN0ZW5lcnMubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRzaW5nbGUuY2FsbCh0aGlzLCBldnQsIGxpc3RlbmVyc1tpXSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBmcm9tIGEgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBJZiB5b3UgZG8gbm90IHNwZWNpZnkgYW4gZXZlbnQgdGhlbiBhbGwgbGlzdGVuZXJzIHdpbGwgYmUgcmVtb3ZlZC5cblx0ICogVGhhdCBtZWFucyBldmVyeSBldmVudCB3aWxsIGJlIGVtcHRpZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGEgcmVnZXggdG8gcmVtb3ZlIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBbZXZ0XSBPcHRpb25hbCBuYW1lIG9mIHRoZSBldmVudCB0byByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IuIFdpbGwgcmVtb3ZlIGZyb20gZXZlcnkgZXZlbnQgaWYgbm90IHBhc3NlZC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVFdmVudCA9IGZ1bmN0aW9uIHJlbW92ZUV2ZW50KGV2dCkge1xuXHRcdHZhciB0eXBlID0gdHlwZW9mIGV2dDtcblx0XHR2YXIgZXZlbnRzID0gdGhpcy5fZ2V0RXZlbnRzKCk7XG5cdFx0dmFyIGtleTtcblxuXHRcdC8vIFJlbW92ZSBkaWZmZXJlbnQgdGhpbmdzIGRlcGVuZGluZyBvbiB0aGUgc3RhdGUgb2YgZXZ0XG5cdFx0aWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHQvLyBSZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudFxuXHRcdFx0ZGVsZXRlIGV2ZW50c1tldnRdO1xuXHRcdH1cblx0XHRlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0Jykge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBldmVudHMgbWF0Y2hpbmcgdGhlIHJlZ2V4LlxuXHRcdFx0Zm9yIChrZXkgaW4gZXZlbnRzKSB7XG5cdFx0XHRcdGlmIChldmVudHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBldnQudGVzdChrZXkpKSB7XG5cdFx0XHRcdFx0ZGVsZXRlIGV2ZW50c1trZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgaW4gYWxsIGV2ZW50c1xuXHRcdFx0ZGVsZXRlIHRoaXMuX2V2ZW50cztcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgcmVtb3ZlRXZlbnQuXG5cdCAqXG5cdCAqIEFkZGVkIHRvIG1pcnJvciB0aGUgbm9kZSBBUEkuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBhbGlhcygncmVtb3ZlRXZlbnQnKTtcblxuXHQvKipcblx0ICogRW1pdHMgYW4gZXZlbnQgb2YgeW91ciBjaG9pY2UuXG5cdCAqIFdoZW4gZW1pdHRlZCwgZXZlcnkgbGlzdGVuZXIgYXR0YWNoZWQgdG8gdGhhdCBldmVudCB3aWxsIGJlIGV4ZWN1dGVkLlxuXHQgKiBJZiB5b3UgcGFzcyB0aGUgb3B0aW9uYWwgYXJndW1lbnQgYXJyYXkgdGhlbiB0aG9zZSBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgdG8gZXZlcnkgbGlzdGVuZXIgdXBvbiBleGVjdXRpb24uXG5cdCAqIEJlY2F1c2UgaXQgdXNlcyBgYXBwbHlgLCB5b3VyIGFycmF5IG9mIGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCBhcyBpZiB5b3Ugd3JvdGUgdGhlbSBvdXQgc2VwYXJhdGVseS5cblx0ICogU28gdGhleSB3aWxsIG5vdCBhcnJpdmUgd2l0aGluIHRoZSBhcnJheSBvbiB0aGUgb3RoZXIgc2lkZSwgdGhleSB3aWxsIGJlIHNlcGFyYXRlLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuXHQgKiBAcGFyYW0ge0FycmF5fSBbYXJnc10gT3B0aW9uYWwgYXJyYXkgb2YgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmVtaXRFdmVudCA9IGZ1bmN0aW9uIGVtaXRFdmVudChldnQsIGFyZ3MpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBsaXN0ZW5lcjtcblx0XHR2YXIgaTtcblx0XHR2YXIga2V5O1xuXHRcdHZhciByZXNwb25zZTtcblxuXHRcdGZvciAoa2V5IGluIGxpc3RlbmVycykge1xuXHRcdFx0aWYgKGxpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdGkgPSBsaXN0ZW5lcnNba2V5XS5sZW5ndGg7XG5cblx0XHRcdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0XHRcdC8vIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCBzaGFsbCBiZSByZW1vdmVkIGZyb20gdGhlIGV2ZW50XG5cdFx0XHRcdFx0Ly8gVGhlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkIGVpdGhlciB3aXRoIGEgYmFzaWMgY2FsbCBvciBhbiBhcHBseSBpZiB0aGVyZSBpcyBhbiBhcmdzIGFycmF5XG5cdFx0XHRcdFx0bGlzdGVuZXIgPSBsaXN0ZW5lcnNba2V5XVtpXTtcblxuXHRcdFx0XHRcdGlmIChsaXN0ZW5lci5vbmNlID09PSB0cnVlKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJlc3BvbnNlID0gbGlzdGVuZXIubGlzdGVuZXIuYXBwbHkodGhpcywgYXJncyB8fCBbXSk7XG5cblx0XHRcdFx0XHRpZiAocmVzcG9uc2UgPT09IHRoaXMuX2dldE9uY2VSZXR1cm5WYWx1ZSgpKSB7XG5cdFx0XHRcdFx0XHR0aGlzLnJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIubGlzdGVuZXIpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiBlbWl0RXZlbnRcblx0ICovXG5cdHByb3RvLnRyaWdnZXIgPSBhbGlhcygnZW1pdEV2ZW50Jyk7XG5cblx0LyoqXG5cdCAqIFN1YnRseSBkaWZmZXJlbnQgZnJvbSBlbWl0RXZlbnQgaW4gdGhhdCBpdCB3aWxsIHBhc3MgaXRzIGFyZ3VtZW50cyBvbiB0byB0aGUgbGlzdGVuZXJzLCBhcyBvcHBvc2VkIHRvIHRha2luZyBhIHNpbmdsZSBhcnJheSBvZiBhcmd1bWVudHMgdG8gcGFzcyBvbi5cblx0ICogQXMgd2l0aCBlbWl0RXZlbnQsIHlvdSBjYW4gcGFzcyBhIHJlZ2V4IGluIHBsYWNlIG9mIHRoZSBldmVudCBuYW1lIHRvIGVtaXQgdG8gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byBlbWl0IGFuZCBleGVjdXRlIGxpc3RlbmVycyBmb3IuXG5cdCAqIEBwYXJhbSB7Li4uKn0gT3B0aW9uYWwgYWRkaXRpb25hbCBhcmd1bWVudHMgdG8gYmUgcGFzc2VkIHRvIGVhY2ggbGlzdGVuZXIuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZ0KSB7XG5cdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHRcdHJldHVybiB0aGlzLmVtaXRFdmVudChldnQsIGFyZ3MpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBjdXJyZW50IHZhbHVlIHRvIGNoZWNrIGFnYWluc3Qgd2hlbiBleGVjdXRpbmcgbGlzdGVuZXJzLiBJZiBhXG5cdCAqIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGUgb25lIHNldCBoZXJlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkXG5cdCAqIGFmdGVyIGV4ZWN1dGlvbi4gVGhpcyB2YWx1ZSBkZWZhdWx0cyB0byB0cnVlLlxuXHQgKlxuXHQgKiBAcGFyYW0geyp9IHZhbHVlIFRoZSBuZXcgdmFsdWUgdG8gY2hlY2sgZm9yIHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5zZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBzZXRPbmNlUmV0dXJuVmFsdWUodmFsdWUpIHtcblx0XHR0aGlzLl9vbmNlUmV0dXJuVmFsdWUgPSB2YWx1ZTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogRmV0Y2hlcyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWZcblx0ICogdGhlIGxpc3RlbmVycyByZXR1cm4gdmFsdWUgbWF0Y2hlcyB0aGlzIG9uZSB0aGVuIGl0IHNob3VsZCBiZSByZW1vdmVkXG5cdCAqIGF1dG9tYXRpY2FsbHkuIEl0IHdpbGwgcmV0dXJuIHRydWUgYnkgZGVmYXVsdC5cblx0ICpcblx0ICogQHJldHVybiB7KnxCb29sZWFufSBUaGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBmb3Igb3IgdGhlIGRlZmF1bHQsIHRydWUuXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0cHJvdG8uX2dldE9uY2VSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uIF9nZXRPbmNlUmV0dXJuVmFsdWUoKSB7XG5cdFx0aWYgKHRoaXMuaGFzT3duUHJvcGVydHkoJ19vbmNlUmV0dXJuVmFsdWUnKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX29uY2VSZXR1cm5WYWx1ZTtcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIGV2ZW50cyBvYmplY3QgYW5kIGNyZWF0ZXMgb25lIGlmIHJlcXVpcmVkLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBldmVudHMgc3RvcmFnZSBvYmplY3QuXG5cdCAqIEBhcGkgcHJpdmF0ZVxuXHQgKi9cblx0cHJvdG8uX2dldEV2ZW50cyA9IGZ1bmN0aW9uIF9nZXRFdmVudHMoKSB7XG5cdFx0cmV0dXJuIHRoaXMuX2V2ZW50cyB8fCAodGhpcy5fZXZlbnRzID0ge30pO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZXZlcnRzIHRoZSBnbG9iYWwge0BsaW5rIEV2ZW50RW1pdHRlcn0gdG8gaXRzIHByZXZpb3VzIHZhbHVlIGFuZCByZXR1cm5zIGEgcmVmZXJlbmNlIHRvIHRoaXMgdmVyc2lvbi5cblx0ICpcblx0ICogQHJldHVybiB7RnVuY3Rpb259IE5vbiBjb25mbGljdGluZyBFdmVudEVtaXR0ZXIgY2xhc3MuXG5cdCAqL1xuXHRFdmVudEVtaXR0ZXIubm9Db25mbGljdCA9IGZ1bmN0aW9uIG5vQ29uZmxpY3QoKSB7XG5cdFx0ZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBvcmlnaW5hbEdsb2JhbFZhbHVlO1xuXHRcdHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdH07XG5cblx0Ly8gRXhwb3NlIHRoZSBjbGFzcyBlaXRoZXIgdmlhIEFNRCwgQ29tbW9uSlMgb3IgdGhlIGdsb2JhbCBvYmplY3Rcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHRcdH0pO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKXtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcblx0fVxuXHRlbHNlIHtcblx0XHR0aGlzLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblx0fVxufS5jYWxsKHRoaXMpKTtcbiJdfQ==
