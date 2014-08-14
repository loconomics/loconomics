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
                    l.find('.gps-lat, .gps-lng, .advice, .find-address-geocode').hide('fast');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcSWFnb1xcUHJveGVjdG9zXFxMb2Nvbm9taWNzLmNvbVxcc291cmNlXFx3ZWJcXG5vZGVfbW9kdWxlc1xcZ3J1bnQtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvTGNVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvUHJvdmlkZXJQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9nZ2xlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9hZGRQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2FwcG9pbnRtZW50c0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvYmFja2dyb3VuZENoZWNrUmVxdWVzdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NhbGVuZGFyU3luYy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NoYW5nZVByb2ZpbGVQaG90by5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2VkdWNhdGlvbkNydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvZ2VuZXJhdGVCb29rTm93QnV0dG9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbGljZW5zZXNDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2xvY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9tb250aGx5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9wYXltZW50QWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaWNpbmdDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaXZhY3lTZXR0aW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3NlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNBY3Rpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvd2Vla2x5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL25vZGVfbW9kdWxlcy9pbWFnZXNMb2FkZWQvaW1hZ2VzbG9hZGVkLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9ub2RlX21vZHVsZXMvaW1hZ2VzTG9hZGVkL25vZGVfbW9kdWxlcy9ldmVudGllL2V2ZW50aWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL25vZGVfbW9kdWxlcy9pbWFnZXNMb2FkZWQvbm9kZV9tb2R1bGVzL3dvbGZ5ODctZXZlbnRlbWl0dGVyL0V2ZW50RW1pdHRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25hQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMWNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiogSW1wbGVtZW50cyBhIHNpbWlsYXIgTGNVcmwgb2JqZWN0IGxpa2UgdGhlIHNlcnZlci1zaWRlIG9uZSwgYmFzaW5nXHJcbiAgICBpbiB0aGUgaW5mb3JtYXRpb24gYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGF0ICdodG1sJyB0YWcgaW4gdGhlIFxyXG4gICAgJ2RhdGEtYmFzZS11cmwnIGF0dHJpYnV0ZSAodGhhdHMgdmFsdWUgaXMgdGhlIGVxdWl2YWxlbnQgZm9yIEFwcFBhdGgpLFxyXG4gICAgYW5kIHRoZSBsYW5nIGluZm9ybWF0aW9uIGF0ICdkYXRhLWN1bHR1cmUnLlxyXG4gICAgVGhlIHJlc3Qgb2YgVVJMcyBhcmUgYnVpbHQgZm9sbG93aW5nIHRoZSB3aW5kb3cubG9jYXRpb24gYW5kIHNhbWUgcnVsZXNcclxuICAgIHRoYW4gaW4gdGhlIHNlcnZlci1zaWRlIG9iamVjdC5cclxuKiovXHJcblxyXG52YXIgYmFzZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYmFzZS11cmwnKSxcclxuICAgIGxhbmcgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKSxcclxuICAgIGwgPSB3aW5kb3cubG9jYXRpb24sXHJcbiAgICB1cmwgPSBsLnByb3RvY29sICsgJy8vJyArIGwuaG9zdDtcclxuLy8gbG9jYXRpb24uaG9zdCBpbmNsdWRlcyBwb3J0LCBpZiBpcyBub3QgdGhlIGRlZmF1bHQsIHZzIGxvY2F0aW9uLmhvc3RuYW1lXHJcblxyXG5iYXNlID0gYmFzZSB8fCAnLyc7XHJcblxyXG52YXIgTGNVcmwgPSB7XHJcbiAgICBTaXRlVXJsOiB1cmwsXHJcbiAgICBBcHBQYXRoOiBiYXNlLFxyXG4gICAgQXBwVXJsOiB1cmwgKyBiYXNlLFxyXG4gICAgTGFuZ0lkOiBsYW5nLFxyXG4gICAgTGFuZ1BhdGg6IGJhc2UgKyBsYW5nICsgJy8nLFxyXG4gICAgTGFuZ1VybDogdXJsICsgYmFzZSArIGxhbmdcclxufTtcclxuTGNVcmwuTGFuZ1VybCA9IHVybCArIExjVXJsLkxhbmdQYXRoO1xyXG5MY1VybC5Kc29uUGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ0pTT04vJztcclxuTGNVcmwuSnNvblVybCA9IHVybCArIExjVXJsLkpzb25QYXRoO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1VybDsiLCIvKiogUHJvdmlkZXJQb3NpdGlvbiBjbGFzc1xyXG4gIEl0IHByb3ZpZGVzIG1pbmltdW4gbGlrZS1qcXVlcnkgZXZlbnQgbGlzdGVuZXJzXHJcbiAgd2l0aCBtZXRob2RzICdvbicgYW5kICdvZmYnLCBhbmQgaW50ZXJuYWxseSAndGhpcy5ldmVudHMnXHJcbiAgYmVpbmcgYSBqUXVlcnkuQ2FsbGJhY2tzLlxyXG4qKi9cclxudmFyIFxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKSxcclxuICBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnTEMvYWpheENhbGxiYWNrcycpO1xyXG5cclxuLyoqIENvbnN0cnVjdG9yXHJcbioqL1xyXG52YXIgUHJvdmlkZXJQb3NpdGlvbiA9IGZ1bmN0aW9uIChwb3NpdGlvbklkKSB7XHJcbiAgdGhpcy5wb3NpdGlvbklkID0gcG9zaXRpb25JZDtcclxuXHJcbiAgLy8gRXZlbnRzIHN1cHBvcnQgdGhyb3VnaCBqcXVlcnkuQ2FsbGJhY2tcclxuICB0aGlzLmV2ZW50cyA9ICQuQ2FsbGJhY2tzKCk7XHJcbiAgdGhpcy5vbiA9IGZ1bmN0aW9uICgpIHsgdGhpcy5ldmVudHMuYWRkLmFwcGx5KHRoaXMuZXZlbnRzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTsgcmV0dXJuIHRoaXM7IH07XHJcbiAgdGhpcy5vZmYgPSBmdW5jdGlvbiAoKSB7IHRoaXMuZXZlbnRzLnJlbW92ZS5hcHBseSh0aGlzLmV2ZW50cywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7IHJldHVybiB0aGlzOyB9O1xyXG59O1xyXG5cclxuLy8gVXNpbmcgZGVmYXVsdCBjb25maWd1cmF0aW9uIGFzIHByb3RvdHlwZVxyXG5Qcm92aWRlclBvc2l0aW9uLnByb3RvdHlwZSA9IHtcclxuICBkZWNsaW5lZE1lc3NhZ2VDbGFzczogJ2luZm8nLFxyXG4gIGRlY2xpbmVkUG9wdXBDbGFzczogJ3Bvc2l0aW9uLXN0YXRlLWNoYW5nZScsXHJcbiAgc3RhdGVDaGFuZ2VkRXZlbnQ6ICdzdGF0ZS1jaGFuZ2VkJyxcclxuICBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50OiAnc3RhdGUtY2hhbmdlZC1kZWNsaW5lZCcsXHJcbiAgcmVtb3ZlRm9ybVNlbGVjdG9yOiAnLmRlbGV0ZS1tZXNzYWdlLWNvbmZpcm0nLFxyXG4gIHJlbW92ZUZvcm1Db250YWluZXI6ICcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlJyxcclxuICByZW1vdmVNZXNzYWdlQ2xhc3M6ICd3YXJuaW5nJyxcclxuICByZW1vdmVQb3B1cENsYXNzOiAncG9zaXRpb24tc3RhdGUtY2hhbmdlJyxcclxuICByZW1vdmVkRXZlbnQ6ICdyZW1vdmVkJyxcclxuICByZW1vdmVGYWlsZWRFdmVudDogJ3JlbW92ZS1mYWlsZWQnXHJcbn07XHJcblxyXG4vKiogY2hhbmdlU3RhdGUgdG8gdGhlIG9uZSBnaXZlbiwgaXQgd2lsbCByYWlzZSBhIHN0YXRlQ2hhbmdlZEV2ZW50IG9uIHN1Y2Nlc3NcclxuICBvciBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50IG9uIGVycm9yLlxyXG4gIEBzdGF0ZTogJ29uJyBvciAnb2ZmJ1xyXG4qKi9cclxuUHJvdmlkZXJQb3NpdGlvbi5wcm90b3R5cGUuY2hhbmdlU3RhdGUgPSBmdW5jdGlvbiBjaGFuZ2VQb3NpdGlvblN0YXRlKHN0YXRlKSB7XHJcbiAgdmFyIHBhZ2UgPSBzdGF0ZSA9PSAnb24nID8gJyRSZWFjdGl2YXRlJyA6ICckRGVhY3RpdmF0ZSc7XHJcbiAgdmFyICRkID0gJCgnI21haW4nKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdmFyIGN0eCA9IHsgZm9ybTogJGQsIGJveDogJGQgfTtcclxuICAkLmFqYXgoe1xyXG4gICAgdXJsOiBMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvcG9zaXRpb24vJyArIHBhZ2UgKyAnLz9Qb3NpdGlvbklEPScgKyB0aGlzLnBvc2l0aW9uSWQsXHJcbiAgICBjb250ZXh0OiBjdHgsXHJcbiAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgICAkZC5vbmUoJ2FqYXhTdWNjZXNzUG9zdCcsIGZ1bmN0aW9uIChldmVudCwgZGF0YSwgdCwgaiwgY3R4KSB7XHJcbiAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDEwMSkge1xyXG4gICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHN0YXRlKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICQoJzxkaXYvPicpLmFkZENsYXNzKHRoYXQuZGVjbGluZWRNZXNzYWdlQ2xhc3MpLmFwcGVuZChkYXRhLlJlc3VsdC5NZXNzYWdlKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihtc2csICRkLCB0aGF0LmRlY2xpbmVkUG9wdXBDbGFzcywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiBmYWxzZSwgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBQcm9jZXNzIHRoZSByZXN1bHQsIHRoYXQgZXZlbnR1YWxseSB3aWxsIGNhbGwgYWpheFN1Y2Nlc3NQb3N0XHJcbiAgICAgIGFqYXhDYWxsYmFja3MuZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBEZWxldGUgcG9zaXRpb25cclxuKiovXHJcblByb3ZpZGVyUG9zaXRpb24ucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIGRlbGV0ZVBvc2l0aW9uKCkge1xyXG5cclxuICAgIHZhciBjID0gJCh0aGlzLnJlbW92ZUZvcm1Db250YWluZXIpLFxyXG4gICAgICAgIGYgPSBjLmZpbmQodGhpcy5yZW1vdmVGb3JtU2VsZWN0b3IpLmZpcnN0KCksXHJcbiAgICAgICAgcG9wdXBGb3JtID0gZi5jbG9uZSgpLFxyXG4gICAgICAgIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgIHBvcHVwRm9ybS5vbmUoJ2FqYXhTdWNjZXNzUG9zdCcsICcuYWpheC1ib3gnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbm90aWZ5KCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGRhdGEuQ29kZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAxMDE6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5ldmVudHMuZmlyZSh0aGF0LnJlbW92ZWRFdmVudCwgW2RhdGEuUmVzdWx0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDEwMzpcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHRoYXQucmVtb3ZlRmFpbGVkRXZlbnQsIFtkYXRhLlJlc3VsdF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhLlJlc3VsdCAmJiBkYXRhLlJlc3VsdC5NZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gJCgnPGRpdi8+JykuYWRkQ2xhc3ModGhhdC5yZW1vdmVNZXNzYWdlQ2xhc3MpLmFwcGVuZChkYXRhLlJlc3VsdC5NZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIHZhciBib3ggPSBzbW9vdGhCb3hCbG9jay5vcGVuKG1zZywgYywgdGhhdC5yZW1vdmVQb3B1cENsYXNzLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IGZhbHNlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJveC5vbigneGhpZGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm90aWZ5KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vdGlmeSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE9wZW4gY29uZmlybWF0aW9uIGZvcm1cclxuICAgIHZhciBiID0gc21vb3RoQm94QmxvY2sub3Blbihwb3B1cEZvcm0sIGMsIG51bGwsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyUG9zaXRpb247IiwiLyogRm9jdXMgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlIGRvY3VtZW50IChvciBpbiBAY29udGFpbmVyKVxyXG53aXRoIHRoZSBodG1sNSBhdHRyaWJ1dGUgJ2F1dG9mb2N1cycgKG9yIGFsdGVybmF0aXZlIEBjc3NTZWxlY3RvcikuXHJcbkl0J3MgZmluZSBhcyBhIHBvbHlmaWxsIGFuZCBmb3IgYWpheCBsb2FkZWQgY29udGVudCB0aGF0IHdpbGwgbm90XHJcbmdldCB0aGUgYnJvd3NlciBzdXBwb3J0IG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBhdXRvRm9jdXMoY29udGFpbmVyLCBjc3NTZWxlY3Rvcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgZG9jdW1lbnQpO1xyXG4gICAgY29udGFpbmVyLmZpbmQoY3NzU2VsZWN0b3IgfHwgJ1thdXRvZm9jdXNdJykuZm9jdXMoKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhdXRvRm9jdXM7IiwiLyoqIEV4dGVuZGVkIHRvZ2dsZS1zaG93LWhpZGUgZnVudGlvbnMuXHJcbiAgICBJYWdvU1JMQGdtYWlsLmNvbVxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICoqL1xyXG4oZnVuY3Rpb24oKXtcclxuXHJcbiAgICAvKiogSW1wbGVtZW50YXRpb246IHJlcXVpcmUgalF1ZXJ5IGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIHRoZVxyXG4gICAgICAgIHB1YmxpYyBtZXRob2RzLlxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24geHRzaChqUXVlcnkpIHtcclxuICAgICAgICB2YXIgJCA9IGpRdWVyeTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGlkZSBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnaGlkZScgYW5kICdmYWRlT3V0JyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5mYWRlT3V0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5zbGlkZVVwKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnaGlkZSdcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAkZS5oaWRlKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hoaWRlJywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICogU2hvdyBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnc2hvdycgYW5kICdmYWRlSW4nIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm1zIGEgZml4IG9uIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzXHJcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGVycm9yIHRoYXQgcHJldmVudHMgZnJvbSBydW5uaW5nXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdHMgb24gZWxlbWVudHMgdGhhdCBhcmUgYWxyZWFkeSB2aXNpYmxlLFxyXG4gICAgICAgICAgICAvLyB3aGF0IGxldHMgdGhlIHBvc3NpYmlsaXR5IG9mIGdldCBhIG1pZGRsZS1hbmltYXRlZFxyXG4gICAgICAgICAgICAvLyBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFdlIGp1c3QgY2hhbmdlIGRpc3BsYXk6bm9uZSwgZm9yY2luZyB0byAnaXMtdmlzaWJsZScgdG9cclxuICAgICAgICAgICAgLy8gYmUgZmFsc2UgYW5kIHRoZW4gcnVubmluZyB0aGUgZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBmbGlja2VyaW5nIGVmZmVjdCwgYmVjYXVzZSBqUXVlcnkganVzdCByZXNldHNcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBvbiBlZmZlY3Qgc3RhcnQuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuZmFkZUluKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ3Nob3cnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hzaG93JywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZW5lcmljIHV0aWxpdHkgZm9yIGhpZ2hseSBjb25maWd1cmFibGUgalF1ZXJ5LnRvZ2dsZSB3aXRoIHN1cHBvcnRcclxuICAgICAgICAgICAgdG8gc3BlY2lmeSB0aGUgdG9nZ2xlIHZhbHVlIGV4cGxpY2l0eSBmb3IgYW55IGtpbmQgb2YgZWZmZWN0OiBqdXN0IHBhc3MgdHJ1ZSBhcyBzZWNvbmQgcGFyYW1ldGVyICd0b2dnbGUnIHRvIHNob3dcclxuICAgICAgICAgICAgYW5kIGZhbHNlIHRvIGhpZGUuIFRvZ2dsZSBtdXN0IGJlIHN0cmljdGx5IGEgQm9vbGVhbiB2YWx1ZSB0byBhdm9pZCBhdXRvLWRldGVjdGlvbi5cclxuICAgICAgICAgICAgVG9nZ2xlIHBhcmFtZXRlciBjYW4gYmUgb21pdHRlZCB0byBhdXRvLWRldGVjdCBpdCwgYW5kIHNlY29uZCBwYXJhbWV0ZXIgY2FuIGJlIHRoZSBhbmltYXRpb24gb3B0aW9ucy5cclxuICAgICAgICAgICAgQWxsIHRoZSBvdGhlcnMgYmVoYXZlIGV4YWN0bHkgYXMgaGlkZUVsZW1lbnQgYW5kIHNob3dFbGVtZW50LlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUVsZW1lbnQoZWxlbWVudCwgdG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBub3QgYSBib29sZWFuXHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUgIT09IHRydWUgJiYgdG9nZ2xlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIGFuIG9iamVjdCwgdGhlbiBpcyB0aGUgb3B0aW9ucyBhcyBzZWNvbmQgcGFyYW1ldGVyXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRvZ2dsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRvZ2dsZTtcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tZGV0ZWN0IHRvZ2dsZSwgaXQgY2FuIHZhcnkgb24gYW55IGVsZW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGRldGVjdGlvbiBhbmQgYWN0aW9uIG11c3QgYmUgZG9uZSBwZXIgZWxlbWVudDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV1c2luZyBmdW5jdGlvbiwgd2l0aCBleHBsaWNpdCB0b2dnbGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsICEkKHRoaXMpLmlzKCc6dmlzaWJsZScpLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUpXHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBEbyBqUXVlcnkgaW50ZWdyYXRpb24gYXMgeHRvZ2dsZSwgeHNob3csIHhoaWRlXHJcbiAgICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsdWdJbihqUXVlcnkpIHtcclxuICAgICAgICAgICAgLyoqIHRvZ2dsZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4dG9nZ2xlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnh0b2dnbGUgPSBmdW5jdGlvbiB4dG9nZ2xlKHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCB0b2dnbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogc2hvd0VsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhzaG93ID0gZnVuY3Rpb24geHNob3cob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBoaWRlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhoaWRlID0gZnVuY3Rpb24geGhpZGUob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9ydGluZzpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0b2dnbGVFbGVtZW50OiB0b2dnbGVFbGVtZW50LFxyXG4gICAgICAgICAgICBzaG93RWxlbWVudDogc2hvd0VsZW1lbnQsXHJcbiAgICAgICAgICAgIGhpZGVFbGVtZW50OiBoaWRlRWxlbWVudCxcclxuICAgICAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vZHVsZVxyXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIHh0c2gpO1xyXG4gICAgfSBlbHNlIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICAgICAgdmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0geHRzaChqUXVlcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBOb3JtYWwgc2NyaXB0IGxvYWQsIGlmIGpRdWVyeSBpcyBnbG9iYWwgKGF0IHdpbmRvdyksIGl0cyBleHRlbmRlZCBhdXRvbWF0aWNhbGx5ICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5qUXVlcnkgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICB4dHNoKHdpbmRvdy5qUXVlcnkpLnBsdWdJbih3aW5kb3cualF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbn0pKCk7IiwiLyogU29tZSB1dGlsaXRpZXMgZm9yIHVzZSB3aXRoIGpRdWVyeSBvciBpdHMgZXhwcmVzc2lvbnNcclxuICAgIHRoYXQgYXJlIG5vdCBwbHVnaW5zLlxyXG4qL1xyXG5mdW5jdGlvbiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWyAjOyYsLisqflxcJzpcIiFeJFtcXF0oKT0+fFxcL10pL2csICdcXFxcJDEnKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTogZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZVxyXG4gICAgfTtcclxuIiwiZnVuY3Rpb24gbW92ZUZvY3VzVG8oZWwsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWFyZ2luVG9wOiAzMCxcclxuICAgICAgICBkdXJhdGlvbjogNTAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChlbCkub2Zmc2V0KCkudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3AgfSwgb3B0aW9ucy5kdXJhdGlvbiwgbnVsbCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb3ZlRm9jdXNUbztcclxufSIsIi8qKiBDdXN0b20gTG9jb25vbWljcyAnbGlrZSBibG9ja1VJJyBwb3B1cHNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUsXHJcbiAgICBhdXRvRm9jdXMgPSByZXF1aXJlKCcuL2F1dG9Gb2N1cycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcblxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9jayhjb250ZW50Qm94LCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykge1xyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcclxuICAgICAgICBjZW50ZXI6IGZhbHNlLFxyXG4gICAgICAgIC8qIGFzIGEgdmFsaWQgb3B0aW9ucyBwYXJhbWV0ZXIgZm9yIExDLmhpZGVFbGVtZW50IGZ1bmN0aW9uICovXHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiA2MDAsXHJcbiAgICAgICAgICAgIGVmZmVjdDogJ2ZhZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgYXV0b2ZvY3VzT3B0aW9uczogeyBtYXJnaW5Ub3A6IDYwIH0sXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgY29udGVudEJveCA9ICQoY29udGVudEJveCk7XHJcbiAgICB2YXIgZnVsbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJsb2NrZWQgPT0gZG9jdW1lbnQgfHwgYmxvY2tlZCA9PSB3aW5kb3cpIHtcclxuICAgICAgICBibG9ja2VkID0gJCgnYm9keScpO1xyXG4gICAgICAgIGZ1bGwgPSB0cnVlO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgYmxvY2tlZCA9ICQoYmxvY2tlZCk7XHJcblxyXG4gICAgdmFyIGJveEluc2lkZUJsb2NrZWQgPSAhYmxvY2tlZC5pcygnYm9keSx0cix0aGVhZCx0Ym9keSx0Zm9vdCx0YWJsZSx1bCxvbCxkbCcpO1xyXG5cclxuICAgIC8vIEdldHRpbmcgYm94IGVsZW1lbnQgaWYgZXhpc3RzIGFuZCByZWZlcmVuY2luZ1xyXG4gICAgdmFyIGJJRCA9IGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcpO1xyXG4gICAgaWYgKCFiSUQpXHJcbiAgICAgICAgYklEID0gKGNvbnRlbnRCb3guYXR0cignaWQnKSB8fCAnJykgKyAoYmxvY2tlZC5hdHRyKCdpZCcpIHx8ICcnKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgaWYgKGJJRCA9PSAnLXNtb290aEJveEJsb2NrJykge1xyXG4gICAgICAgIGJJRCA9ICdpZC0nICsgZ3VpZEdlbmVyYXRvcigpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICB9XHJcbiAgICBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnLCBiSUQpO1xyXG4gICAgdmFyIGJveCA9ICQoJyMnICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShiSUQpKTtcclxuICAgIFxyXG4gICAgLy8gSGlkaW5nL2Nsb3NpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgIGJveC54aGlkZShvcHRpb25zLmNsb3NlT3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIFJlc3RvcmluZyB0aGUgQ1NTIHBvc2l0aW9uIGF0dHJpYnV0ZSBvZiB0aGUgYmxvY2tlZCBlbGVtZW50XHJcbiAgICAgICAgLy8gdG8gYXZvaWQgc29tZSBwcm9ibGVtcyB3aXRoIGxheW91dCBvbiBzb21lIGVkZ2UgY2FzZXMgYWxtb3N0XHJcbiAgICAgICAgLy8gdGhhdCBtYXkgYmUgbm90IGEgcHJvYmxlbSBkdXJpbmcgYmxvY2tpbmcgYnV0IHdoZW4gdW5ibG9ja2VkLlxyXG4gICAgICAgIHZhciBwcmV2ID0gYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJyk7XHJcbiAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgcHJldiB8fCAnJyk7XHJcbiAgICAgICAgYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJywgbnVsbCk7XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICBib3hjXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBudWxsLCBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcsIHRydWUpO1xyXG4gICAgYm94Yy5hcHBlbmQoY29udGVudEJveCk7XHJcbiAgICBib3hjLndpZHRoKG9wdGlvbnMud2lkdGgpO1xyXG4gICAgYm94LmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gaW5zaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQ6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIGJsb2NrZWQuY3NzKCd6LWluZGV4JykgKyAxMCk7XHJcbiAgICAgICAgaWYgKCFibG9ja2VkLmNzcygncG9zaXRpb24nKSB8fCBibG9ja2VkLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJykge1xyXG4gICAgICAgICAgICBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nLCBibG9ja2VkLmNzcygncG9zaXRpb24nKSk7XHJcbiAgICAgICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChvcHRpb25zLmNlbnRlciA9PT0gdHJ1ZSB8fCBvcHRpb25zLmNlbnRlciA9PT0gJ3ZlcnRpY2FsJylcclxuICAgICAgICAgICAgYm94Yy5jc3MoJ3RvcCcsIGN0IC0gYm94Yy5vdXRlckhlaWdodCh0cnVlKSAvIDIpO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmNlbnRlciA9PT0gdHJ1ZSB8fCBvcHRpb25zLmNlbnRlciA9PT0gJ2hvcml6b250YWwnKVxyXG4gICAgICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07IiwiLyoqXHJcbiAgSXQgdG9nZ2xlcyBhIGdpdmVuIHZhbHVlIHdpdGggdGhlIG5leHQgaW4gdGhlIGdpdmVuIGxpc3QsXHJcbiAgb3IgdGhlIGZpcnN0IGlmIGlzIHRoZSBsYXN0IG9yIG5vdCBtYXRjaGVkLlxyXG4gIFRoZSByZXR1cm5lZCBmdW5jdGlvbiBjYW4gYmUgdXNlZCBkaXJlY3RseSBvciBcclxuICBjYW4gYmUgYXR0YWNoZWQgdG8gYW4gYXJyYXkgKG9yIGFycmF5IGxpa2UpIG9iamVjdCBhcyBtZXRob2RcclxuICAob3IgdG8gYSBwcm90b3R5cGUgYXMgQXJyYXkucHJvdG90eXBlKSBhbmQgdXNlIGl0IHBhc3NpbmdcclxuICBvbmx5IHRoZSBmaXJzdCBhcmd1bWVudC5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9nZ2xlKGN1cnJlbnQsIGVsZW1lbnRzKSB7XHJcbiAgaWYgKHR5cGVvZiAoZWxlbWVudHMpID09PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICB0eXBlb2YgKHRoaXMubGVuZ3RoKSA9PT0gJ251bWJlcicpXHJcbiAgICBlbGVtZW50cyA9IHRoaXM7XHJcblxyXG4gIHZhciBpID0gZWxlbWVudHMuaW5kZXhPZihjdXJyZW50KTtcclxuICBpZiAoaSA+IC0xICYmIGkgPCBlbGVtZW50cy5sZW5ndGggLSAxKVxyXG4gICAgcmV0dXJuIGVsZW1lbnRzW2kgKyAxXTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZWxlbWVudHNbMF07XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgVXNlciBwcml2YXRlIGRhc2hib2FyZCBzZWN0aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG52YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnTEMvYWpheEZvcm1zJyk7XHJcblxyXG4vLyBDb2RlIG9uIHBhZ2UgcmVhZHlcclxuJChmdW5jdGlvbiAoKSB7XHJcbiAgICAvKiBTaWRlYmFyICovXHJcbiAgICB2YXIgXHJcbiAgICB0b2dnbGUgPSByZXF1aXJlKCcuLi9MQy90b2dnbGUnKSxcclxuICAgIFByb3ZpZGVyUG9zaXRpb24gPSByZXF1aXJlKCcuLi9MQy9Qcm92aWRlclBvc2l0aW9uJyk7XHJcbiAgICAvLyBBdHRhY2hpbmcgJ2NoYW5nZSBwb3NpdGlvbicgYWN0aW9uIHRvIHRoZSBzaWRlYmFyIGxpbmtzXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnW2hyZWYgPSBcIiN0b2dnbGVQb3NpdGlvblN0YXRlXCJdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBcclxuICAgICAgJHQgPSAkKHRoaXMpLFxyXG4gICAgICB2ID0gJHQudGV4dCgpLFxyXG4gICAgICBuID0gdG9nZ2xlKHYsIFsnb24nLCAnb2ZmJ10pLFxyXG4gICAgICBwb3NpdGlvbklkID0gJHQuY2xvc2VzdCgnW2RhdGEtcG9zaXRpb24taWRdJykuZGF0YSgncG9zaXRpb24taWQnKTtcclxuXHJcbiAgICAgICAgdmFyIHBvcyA9IG5ldyBQcm92aWRlclBvc2l0aW9uKHBvc2l0aW9uSWQpO1xyXG4gICAgICAgIHBvc1xyXG4gICAgLm9uKHBvcy5zdGF0ZUNoYW5nZWRFdmVudCwgZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICAgJHQudGV4dChzdGF0ZSk7XHJcbiAgICB9KVxyXG4gICAgLmNoYW5nZVN0YXRlKG4pO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcuZGVsZXRlLXBvc2l0aW9uIGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uSWQgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLXBvc2l0aW9uLWlkXScpLmRhdGEoJ3Bvc2l0aW9uLWlkJyk7XHJcbiAgICAgICAgdmFyIHBvcyA9IG5ldyBQcm92aWRlclBvc2l0aW9uKHBvc2l0aW9uSWQpO1xyXG5cclxuICAgICAgICBwb3NcclxuICAgIC5vbihwb3MucmVtb3ZlZEV2ZW50LCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICAgICAgLy8gQ3VycmVudCBwb3NpdGlvbiBwYWdlIGRvZXNuJ3QgZXhpc3QgYW55bW9yZSwgb3V0IVxyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC95b3VyLXdvcmsvJztcclxuICAgIH0pXHJcbiAgICAucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8qIFByb21vdGUgKi9cclxuICAgIHZhciBnZW5lcmF0ZUJvb2tOb3dCdXR0b24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9nZW5lcmF0ZUJvb2tOb3dCdXR0b24nKTtcclxuICAgIC8vIExpc3RlbiBvbiBEYXNoYm9hcmRQcm9tb3RlIGluc3RlYWQgb2YgdGhlIG1vcmUgY2xvc2UgY29udGFpbmVyIERhc2hib2FyZEJvb2tOb3dCdXR0b25cclxuICAgIC8vIGFsbG93cyB0byBjb250aW51ZSB3b3JraW5nIHdpdGhvdXQgcmUtYXR0YWNobWVudCBhZnRlciBodG1sLWFqYXgtcmVsb2FkcyBmcm9tIGFqYXhGb3JtLlxyXG4gICAgZ2VuZXJhdGVCb29rTm93QnV0dG9uLm9uKCcuRGFzaGJvYXJkUHJvbW90ZScpOyAvLycuRGFzaGJvYXJkQm9va05vd0J1dHRvbidcclxuXHJcbiAgICAvKiBQcml2YWN5ICovXHJcbiAgICB2YXIgcHJpdmFjeVNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpdmFjeVNldHRpbmdzJyk7XHJcbiAgICBwcml2YWN5U2V0dGluZ3Mub24oJy5EYXNoYm9hcmRQcml2YWN5Jyk7XHJcblxyXG4gICAgLyogUGF5bWVudHMgKi9cclxuICAgIHZhciBwYXltZW50QWNjb3VudCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL3BheW1lbnRBY2NvdW50Jyk7XHJcbiAgICBwYXltZW50QWNjb3VudC5vbignLkRhc2hib2FyZFBheW1lbnRzJyk7XHJcblxyXG4gICAgLyogYWJvdXQteW91ICovXHJcbiAgICAkKCdodG1sJykub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJy5EYXNoYm9hcmRBYm91dFlvdSBmb3JtLmFqYXgnLCBpbml0QWJvdXRZb3UpO1xyXG4gICAgaW5pdEFib3V0WW91KCk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIGluaXQgKi9cclxuICAgICQoJ2h0bWwnKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnLkRhc2hib2FyZFlvdXJXb3JrIGZvcm0uYWpheCcsIGluaXRZb3VyV29ya0RvbSk7XHJcbiAgICBpbml0WW91cldvcmtEb20oKTtcclxuXHJcbiAgICAvKiBBdmFpbGFiaWx0eSAqL1xyXG4gICAgaW5pdEF2YWlsYWJpbGl0eSgpO1xyXG4gICAgJCgnLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIGluaXRBdmFpbGFiaWxpdHkpO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gICAgSW5zdGFudCBzYXZpbmcgYW5kIGNvcnJlY3QgY2hhbmdlcyB0cmFja2luZ1xyXG4qKi9cclxuZnVuY3Rpb24gc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oc2VjdGlvblNlbGVjdG9yKSB7XHJcblxyXG4gICAgdmFyICRzZWN0aW9uID0gJChzZWN0aW9uU2VsZWN0b3IpO1xyXG5cclxuICAgIGlmICgkc2VjdGlvbi5kYXRhKCdpbnN0YW50LXNhdmluZycpKSB7XHJcbiAgICAgICAgJHNlY3Rpb24ub24oJ2NoYW5nZScsICc6aW5wdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGFqYXhGb3Jtcy5kb0luc3RhbnRTYXZpbmcoJHNlY3Rpb24sIFt0aGlzXSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRBYm91dFlvdSgpIHtcclxuICAgIC8qIFByb2ZpbGUgcGhvdG8gKi9cclxuICAgIHZhciBjaGFuZ2VQcm9maWxlUGhvdG8gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9jaGFuZ2VQcm9maWxlUGhvdG8nKTtcclxuICAgIGNoYW5nZVByb2ZpbGVQaG90by5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gICAgLyogQWJvdXQgeW91IC8gZWR1Y2F0aW9uICovXHJcbiAgICB2YXIgZWR1Y2F0aW9uID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvZWR1Y2F0aW9uQ3J1ZGwnKTtcclxuICAgIGVkdWNhdGlvbi5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gICAgLyogQWJvdXQgeW91IC8gdmVyaWZpY2F0aW9ucyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0FjdGlvbnMnKS5vbignLkRhc2hib2FyZFZlcmlmaWNhdGlvbnMnKTtcclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNDcnVkbCcpLm9uKCcuRGFzaGJvYXJkQWJvdXRZb3UnKTtcclxuXHJcbiAgICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gICAgc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRQdWJsaWNCaW8nKTtcclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkUGVyc29uYWxXZWJzaXRlJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRBdmFpbGFiaWxpdHkoZSkge1xyXG4gIC8vIFdlIG5lZWQgdG8gYXZvaWQgdGhpcyBsb2dpYyB3aGVuIGFuIGV2ZW50IGJ1YmJsZVxyXG4gIC8vIGZyb20gdGhlIGFueSBmaWVsZHNldC5hamF4LCBiZWNhdXNlIGl0cyBhIHN1YmZvcm0gZXZlbnRcclxuICAvLyBhbmQgbXVzdCBub3QgcmVzZXQgdGhlIG1haW4gZm9ybSAoIzUwNClcclxuICBpZiAoZSAmJiBlLnRhcmdldCAmJiAvZmllbGRzZXQvaS50ZXN0KGUudGFyZ2V0Lm5vZGVOYW1lKSlcclxuICAgIHJldHVybjtcclxuXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbW9udGhseVNjaGVkdWxlJykub24oKTtcclxuICB2YXIgd2Vla2x5ID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvd2Vla2x5U2NoZWR1bGUnKS5vbigpO1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2NhbGVuZGFyU3luYycpLm9uKCk7XHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvYXBwb2ludG1lbnRzQ3J1ZGwnKS5vbignLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpO1xyXG5cclxuICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkV2Vla2x5U2NoZWR1bGUnKTtcclxuICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZE1vbnRobHlTY2hlZHVsZScpO1xyXG4gIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gIEluaXRpYWxpemUgRG9tIGVsZW1lbnRzIGFuZCBldmVudHMgaGFuZGxlcnMgZm9yIFlvdXItd29yayBsb2dpYy5cclxuXHJcbiAgTk9URTogLkRhc2hib2FyZFlvdXJXb3JrIGlzIGFuIGFqYXgtYm94IHBhcmVudCBvZiB0aGUgZm9ybS5hamF4LCBldmVyeSBzZWN0aW9uXHJcbiAgaXMgaW5zaWRlIHRoZSBmb3JtIGFuZCByZXBsYWNlZCBvbiBodG1sIHJldHVybmVkIGZyb20gc2VydmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gaW5pdFlvdXJXb3JrRG9tKCkge1xyXG4gICAgLyogWW91ciB3b3JrIC8gcHJpY2luZyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpY2luZ0NydWRsJykub24oKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBzZXJ2aWNlcyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvc2VydmljZUF0dHJpYnV0ZXNWYWxpZGF0aW9uJykuc2V0dXAoJCgnLkRhc2hib2FyZFlvdXJXb3JrIGZvcm0nKSk7XHJcbiAgICAvLyBJbnN0YW50IHNhdmluZyBhbmQgY29ycmVjdCBjaGFuZ2VzIHRyYWNraW5nXHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZFNlcnZpY2VzJyk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gY2FuY2VsbGF0aW9uICovXHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZENhbmNlbGxhdGlvblBvbGljeScpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHNjaGVkdWxpbmcgKi9cclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkU2NoZWR1bGluZ09wdGlvbnMnKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBsb2NhdGlvbnMgKi9cclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2xvY2F0aW9uc0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIGxpY2Vuc2VzICovXHJcbiAgICByZXF1aXJlKCcuL2Rhc2hib2FyZC9saWNlbnNlc0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHBob3RvcyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUknKS5vbignLkRhc2hib2FyZFBob3RvcycpO1xyXG4gICAgLy8gUGhvdG9zVUkgaXMgc3BlY2lhbCBhbmQgY2Fubm90IGRvIGluc3RhbnQtc2F2aW5nIG9uIGZvcm0gY2hhbmdlc1xyXG4gICAgLy8gYmVjYXVzZSBvZiB0aGUgcmUtdXNlIG9mIHRoZSBlZGl0aW5nIGZvcm1cclxuICAgIC8vc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRQaG90b3MnKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyByZXZpZXdzICovXHJcbiAgICAkKCcuRGFzaGJvYXJkWW91cldvcmsnKS5vbignYWpheFN1Y2Nlc3NQb3N0JywgJ2Zvcm0nLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcclxuICAgICAgICAvLyBSZXNldGluZyB0aGUgZW1haWwgYWRkcmVzc2VzIG9uIHN1Y2Nlc3MgdG8gYXZvaWQgcmVzZW5kIGFnYWluIG1lc3NhZ2VzIGJlY2F1c2VcclxuICAgICAgICAvLyBtaXN0YWtlIG9mIGEgc2Vjb25kIHN1Ym1pdC5cclxuICAgICAgICB2YXIgdGIgPSAkKCcuRGFzaGJvYXJkUmV2aWV3cyBbbmFtZT1jbGllbnRzZW1haWxzXScpO1xyXG4gICAgICAgIC8vIE9ubHkgaWYgdGhlcmUgd2FzIGEgdmFsdWU6XHJcbiAgICAgICAgaWYgKHRiLnZhbCgpKSB7XHJcbiAgICAgICAgICAgIHRiXHJcbiAgICAgIC52YWwoJycpXHJcbiAgICAgIC5hdHRyKCdwbGFjZWhvbGRlcicsIHRiLmRhdGEoJ3N1Y2Nlc3MtbWVzc2FnZScpKVxyXG4gICAgICAgICAgICAvLyBzdXBwb3J0IGZvciBJRSwgJ25vbi1wbGFjZWhvbGRlci1icm93c2VycydcclxuICAgICAgLnBsYWNlaG9sZGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gYWRkLXBvc2l0aW9uICovXHJcbiAgICB2YXIgYWRkUG9zaXRpb24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9hZGRQb3NpdGlvbicpO1xyXG4gICAgYWRkUG9zaXRpb24uaW5pdCgnLkRhc2hib2FyZEFkZFBvc2l0aW9uJyk7XHJcbiAgICAkKCdib2R5Jykub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJy5EYXNoYm9hcmRBZGRQb3NpdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBhZGRQb3NpdGlvbi5pbml0KCk7XHJcbiAgICB9KTtcclxufSIsIi8qKlxyXG4qIEFkZCBQb3NpdGlvbjogbG9naWMgZm9yIHRoZSBhZGQtcG9zaXRpb24gcGFnZSB1bmRlciAvZGFzaGJvYXJkL3lvdXItd29yay8wLyxcclxuICB3aXRoIGF1dG9jb21wbGV0ZSwgcG9zaXRpb24gZGVzY3JpcHRpb24gYW5kICdhZGRlZCBwb3NpdGlvbnMnIGxpc3QuXHJcblxyXG4gIFRPRE86IENoZWNrIGlmIGlzIG1vcmUgY29udmVuaWVudCBhIHJlZmFjdG9yIGFzIHBhcnQgb2YgTEMvUHJvdmlkZXJQb3NpdGlvbi5qc1xyXG4qL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgc2VsZWN0b3JzID0ge1xyXG4gIGxpc3Q6ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24tcG9zaXRpb25zTGlzdCcsXHJcbiAgc2VsZWN0UG9zaXRpb246ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24tc2VsZWN0UG9zaXRpb24nLFxyXG4gIGRlc2M6ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24tc2VsZWN0UG9zaXRpb24tZGVzY3JpcHRpb24nXHJcbn07XHJcblxyXG5leHBvcnRzLmluaXQgPSBmdW5jdGlvbiBpbml0QWRkUG9zaXRpb24oc2VsZWN0b3IpIHtcclxuICBzZWxlY3RvciA9IHNlbGVjdG9yIHx8ICcuRGFzaGJvYXJkQWRkUG9zaXRpb24nO1xyXG4gIHZhciBjID0gJChzZWxlY3Rvcik7XHJcblxyXG4gIC8vIFRlbXBsYXRlIHBvc2l0aW9uIGl0ZW0gdmFsdWUgbXVzdCBiZSByZXNldCBvbiBpbml0IChiZWNhdXNlIHNvbWUgZm9ybS1yZWNvdmVyaW5nIGJyb3dzZXIgZmVhdHVyZXMgdGhhdCBwdXQgb24gaXQgYmFkIHZhbHVlcylcclxuICBjLmZpbmQoc2VsZWN0b3JzLmxpc3QgKyAnIGxpLmlzLXRlbXBsYXRlIFtuYW1lPXBvc2l0aW9uXScpLnZhbCgnJyk7XHJcblxyXG4gIC8vIEF1dG9jb21wbGV0ZSBwb3NpdGlvbnMgYW5kIGFkZCB0byB0aGUgbGlzdFxyXG4gIHZhciBwb3NpdGlvbnNMaXN0ID0gbnVsbCwgdHBsID0gbnVsbDtcclxuICB2YXIgcG9zaXRpb25zQXV0b2NvbXBsZXRlID0gYy5maW5kKCcuRGFzaGJvYXJkQWRkUG9zaXRpb24tc2VsZWN0UG9zaXRpb24tc2VhcmNoJykuYXV0b2NvbXBsZXRlKHtcclxuICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0UG9zaXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgYXV0b0ZvY3VzOiBmYWxzZSxcclxuICAgIG1pbkxlbmd0aDogMCxcclxuICAgIHNlbGVjdDogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG5cclxuICAgICAgcG9zaXRpb25zTGlzdCA9IHBvc2l0aW9uc0xpc3QgfHwgYy5maW5kKHNlbGVjdG9ycy5saXN0ICsgJyA+IHVsJyk7XHJcbiAgICAgIHRwbCA9IHRwbCB8fCBwb3NpdGlvbnNMaXN0LmNoaWxkcmVuKCcuaXMtdGVtcGxhdGU6ZXEoMCknKTtcclxuICAgICAgLy8gTm8gdmFsdWUsIG5vIGFjdGlvbiA6KFxyXG4gICAgICBpZiAoIXVpIHx8ICF1aS5pdGVtIHx8ICF1aS5pdGVtLnZhbHVlKSByZXR1cm47XHJcblxyXG4gICAgICAvLyBBZGQgaWYgbm90IGV4aXN0cyBpbiB0aGUgbGlzdFxyXG4gICAgICBpZiAocG9zaXRpb25zTGlzdC5jaGlsZHJlbigpLmZpbHRlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuICQodGhpcykuZGF0YSgncG9zaXRpb24taWQnKSA9PSB1aS5pdGVtLnZhbHVlO1xyXG4gICAgICB9KS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAvLyBDcmVhdGUgaXRlbSBmcm9tIHRlbXBsYXRlOlxyXG4gICAgICAgIHBvc2l0aW9uc0xpc3QuYXBwZW5kKHRwbC5jbG9uZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdpcy10ZW1wbGF0ZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmRhdGEoJ3Bvc2l0aW9uLWlkJywgdWkuaXRlbS52YWx1ZSlcclxuICAgICAgICAgICAgICAgICAgICAuY2hpbGRyZW4oJy5uYW1lJykudGV4dCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpIC8vIC5sYWJlbFxyXG4gICAgICAgICAgICAgICAgICAgIC5lbmQoKS5jaGlsZHJlbignW25hbWU9cG9zaXRpb25dJykudmFsKHVpLml0ZW0udmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLmVuZCgpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgYy5maW5kKHNlbGVjdG9ycy5kZXNjICsgJyA+IHRleHRhcmVhJykudmFsKHVpLml0ZW0uZGVzY3JpcHRpb24pO1xyXG5cclxuICAgICAgLy8gV2Ugd2FudCBzaG93IHRoZSBsYWJlbCAocG9zaXRpb24gbmFtZSkgaW4gdGhlIHRleHRib3gsIG5vdCB0aGUgaWQtdmFsdWVcclxuICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSxcclxuICAgIGZvY3VzOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcik7XHJcbiAgICAgIC8vIFdlIHdhbnQgdGhlIGxhYmVsIGluIHRleHRib3gsIG5vdCB0aGUgdmFsdWVcclxuICAgICAgJCh0aGlzKS52YWwodWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBMb2FkIGFsbCBwb3NpdGlvbnMgaW4gYmFja2dyb3VuZCB0byByZXBsYWNlIHRoZSBhdXRvY29tcGxldGUgc291cmNlIChhdm9pZGluZyBtdWx0aXBsZSwgc2xvdyBsb29rLXVwcylcclxuICAvKiQuZ2V0SlNPTihMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgZnVuY3Rpb24gKGRhdGEpIHtcclxuICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdvcHRpb24nLCAnc291cmNlJywgZGF0YSk7XHJcbiAgfVxyXG4gICk7Ki9cclxuXHJcbiAgLy8gU2hvdyBhdXRvY29tcGxldGUgb24gJ3BsdXMnIGJ1dHRvblxyXG4gIGMuZmluZChzZWxlY3RvcnMuc2VsZWN0UG9zaXRpb24gKyAnIC5hZGQtYWN0aW9uJykuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgcG9zaXRpb25zQXV0b2NvbXBsZXRlLmF1dG9jb21wbGV0ZSgnc2VhcmNoJywgJycpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxuICAvLyBSZW1vdmUgcG9zaXRpb25zIGZyb20gdGhlIGxpc3RcclxuICBjLmZpbmQoc2VsZWN0b3JzLmxpc3QgKyAnID4gdWwnKS5vbignY2xpY2snLCAnbGkgPiBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIGlmICgkdC5hdHRyKCdocmVmJykgPT0gJyNyZW1vdmUtcG9zaXRpb24nKSB7XHJcbiAgICAgIC8vIFJlbW92ZSBjb21wbGV0ZSBlbGVtZW50IGZyb20gdGhlIGxpc3QgKGxhYmVsIGFuZCBoaWRkZW4gZm9ybSB2YWx1ZSlcclxuICAgICAgJHQucGFyZW50KCkucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBBdmFpbGFiaWxpdHk6IGNhbGVuZGFyIGFwcG9pbnRtZW50cyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG5cclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGNydWRsU2VsZWN0b3IgPSAnLkRhc2hib2FyZEFwcG9pbnRtZW50cycsXHJcbiAgICAkY3J1ZGxDb250YWluZXIgPSAkYy5maW5kKGNydWRsU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRjcnVkbENvbnRhaW5lci5zaWJsaW5ncygpXHJcbiAgICAgICAgLmFkZCgkY3J1ZGxDb250YWluZXIuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAgIC5hZGQoJGNydWRsQ29udGFpbmVyLmNsb3Nlc3QoJy5EYXNoYm9hcmRBdmFpbGFiaWxpdHknKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGNydWRsU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCBlZGl0b3IpIHtcclxuICAgIC8vIERvbmUgYWZ0ZXIgYSBzbWFsbCBkZWxheSB0byBsZXQgdGhlIGVkaXRvciBiZSB2aXNpYmxlXHJcbiAgICAvLyBhbmQgc2V0dXAgd29yayBhcyBleHBlY3RlZFxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGVkaXRGb3JtU2V0dXAoZWRpdG9yKTtcclxuICAgIH0sIDEwMCk7XHJcbiAgfSk7XHJcblxyXG59O1xyXG5cclxuZnVuY3Rpb24gZWRpdEZvcm1TZXR1cChmKSB7XHJcbiAgdmFyIHJlcGVhdCA9IGYuZmluZCgnW25hbWU9cmVwZWF0XScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYSA9IGYuZmluZCgnLnJlcGVhdC1vcHRpb25zJyk7XHJcbiAgICBpZiAodGhpcy5jaGVja2VkKVxyXG4gICAgICBhLnNsaWRlRG93bignZmFzdCcpO1xyXG4gICAgZWxzZVxyXG4gICAgICBhLnNsaWRlVXAoJ2Zhc3QnKTtcclxuICB9KTtcclxuICB2YXIgYWxsZGF5ID0gZi5maW5kKCdbbmFtZT1hbGxkYXldJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZlxyXG4gICAgLmZpbmQoJ1tuYW1lPXN0YXJ0dGltZV0sW25hbWU9ZW5kdGltZV0nKVxyXG4gICAgLnByb3AoJ2Rpc2FibGVkJywgdGhpcy5jaGVja2VkKTtcclxuICAgIGlmICh0aGlzLmNoZWNrZWQpXHJcbiAgICAgIGEuaGlkZSgnZmFzdCcpO1xyXG4gICAgZWxzZVxyXG4gICAgICBhLnNob3coJ2Zhc3QnKTtcclxuICB9KTtcclxuICB2YXIgcmVwZWF0RnJlcXVlbmN5ID0gZi5maW5kKCdbbmFtZT1yZXBlYXQtZnJlcXVlbmN5XScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgZnJlcSA9ICQodGhpcykuY2hpbGRyZW4oJzpzZWxlY3RlZCcpO1xyXG4gICAgdmFyIHVuaXQgPSBmcmVxLmRhdGEoJ3VuaXQnKTtcclxuICAgIGZcclxuICAgIC5maW5kKCcucmVwZWF0LWZyZXF1ZW5jeS11bml0JylcclxuICAgIC50ZXh0KHVuaXQpO1xyXG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gdW5pdCwgdGhlcmUgaXMgbm90IGludGVydmFsL3JlcGVhdC1ldmVyeSBmaWVsZDpcclxuICAgIHZhciBpbnRlcnZhbCA9IGYuZmluZCgnLnJlcGVhdC1ldmVyeScpO1xyXG4gICAgaWYgKHVuaXQpXHJcbiAgICAgIGludGVydmFsLnNob3coJ2Zhc3QnKTtcclxuICAgIGVsc2VcclxuICAgICAgaW50ZXJ2YWwuaGlkZSgnZmFzdCcpO1xyXG4gICAgLy8gU2hvdyBmcmVxdWVuY3ktZXh0cmEsIGlmIHRoZXJlIGlzIHNvbWVvbmVcclxuICAgIGYuZmluZCgnLmZyZXF1ZW5jeS1leHRyYS0nICsgZnJlcS52YWwoKSkuc2xpZGVEb3duKCdmYXN0Jyk7XHJcbiAgICAvLyBIaWRlIGFsbCBvdGhlciBmcmVxdWVuY3ktZXh0cmFcclxuICAgIGYuZmluZCgnLmZyZXF1ZW5jeS1leHRyYTpub3QoLmZyZXF1ZW5jeS1leHRyYS0nICsgZnJlcS52YWwoKSArICcpJykuc2xpZGVVcCgnZmFzdCcpO1xyXG4gIH0pO1xyXG4gIC8vIGF1dG8tc2VsZWN0IHNvbWUgb3B0aW9ucyB3aGVuIGl0cyB2YWx1ZSBjaGFuZ2VcclxuICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1vY3VycmVuY2VzXScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1lbmRzXVt2YWx1ZT1vY3VycmVuY2VzXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcclxuICB9KTtcclxuICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1lbmQtZGF0ZV0nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgZi5maW5kKCdbbmFtZT1yZXBlYXQtZW5kc11bdmFsdWU9ZGF0ZV0nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgfSk7XHJcbiAgLy8gc3RhcnQtZGF0ZSB0cmlnZ2VyXHJcbiAgZi5maW5kKCdbbmFtZT1zdGFydGRhdGVdJykub24oJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIGF1dG8gZmlsbCBlbmRkYXRlIHdpdGggc3RhcnRkYXRlIHdoZW4gdGhpcyBsYXN0IGlzIHVwZGF0ZWRcclxuICAgIGYuZmluZCgnW25hbWU9ZW5kZGF0ZV0nKS52YWwodGhpcy52YWx1ZSk7XHJcbiAgICAvLyBpZiBubyB3ZWVrLWRheXMgb3Igb25seSBvbmUsIGF1dG8tc2VsZWN0IHRoZSBkYXkgdGhhdCBtYXRjaHMgc3RhcnQtZGF0ZVxyXG4gICAgdmFyIHdlZWtEYXlzID0gZi5maW5kKCcud2Vla2x5LWV4dHJhIC53ZWVrLWRheXMgaW5wdXQnKTtcclxuICAgIGlmICh3ZWVrRGF5cy5hcmUoJzpjaGVja2VkJywgeyB1bnRpbDogMSB9KSkge1xyXG4gICAgICB2YXIgZGF0ZSA9ICQodGhpcykuZGF0ZXBpY2tlcihcImdldERhdGVcIik7XHJcbiAgICAgIGlmIChkYXRlKSB7XHJcbiAgICAgICAgd2Vla0RheXMucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgICB3ZWVrRGF5cy5maWx0ZXIoJ1t2YWx1ZT0nICsgZGF0ZS5nZXREYXkoKSArICddJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIEluaXQ6XHJcbiAgcmVwZWF0LmNoYW5nZSgpO1xyXG4gIGFsbGRheS5jaGFuZ2UoKTtcclxuICByZXBlYXRGcmVxdWVuY3kuY2hhbmdlKCk7XHJcbiAgLy8gYWRkIGRhdGUgcGlja2Vyc1xyXG4gIGFwcGx5RGF0ZVBpY2tlcigpO1xyXG4gIC8vIGFkZCBwbGFjZWhvbGRlciBzdXBwb3J0IChwb2x5ZmlsbClcclxuICBmLmZpbmQoJzppbnB1dCcpLnBsYWNlaG9sZGVyKCk7XHJcbn0iLCIvKipcclxuICBSZXF1ZXN0aW5nIGEgYmFja2dyb3VuZCBjaGVjayB0aHJvdWdoIHRoZSBiYWNrZ3JvdW5kQ2hlY2tFZGl0IGZvcm0gaW5zaWRlIGFib3V0LXlvdS92ZXJpZmljYXRpb25zLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8qKlxyXG4gIFNldHVwIHRoZSBET00gZWxlbWVudHMgaW4gdGhlIGNvbnRhaW5lciBAJGNcclxuICB3aXRoIHRoZSBiYWNrZ3JvdW5kLWNoZWNrLXJlcXVlc3QgbG9naWMuXHJcbioqL1xyXG5leHBvcnRzLnNldHVwRm9ybSA9IGZ1bmN0aW9uIHNldHVwRm9ybUJhY2tncm91bmRDaGVjaygkYykge1xyXG5cclxuICB2YXIgc2VsZWN0ZWRJdGVtID0gbnVsbDtcclxuXHJcbiAgJGMub24oJ2NsaWNrJywgJy5idXktYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgIFxyXG4gICAgdmFyIGYgPSAkYy5maW5kKCcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrLXJlcXVlc3RGb3JtJyk7XHJcbiAgICB2YXIgYmNpZCA9ICQodGhpcykuZGF0YSgnYmFja2dyb3VuZC1jaGVjay1pZCcpO1xyXG4gICAgc2VsZWN0ZWRJdGVtID0gJCh0aGlzKS5jbG9zZXN0KCcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrLWl0ZW0nKTtcclxuICAgIHZhciBwczEgPSAkYy5maW5kKCcucG9wdXAuYnV5LXN0ZXAtMScpO1xyXG5cclxuICAgIGYuZmluZCgnW25hbWU9QmFja2dyb3VuZENoZWNrSURdJykudmFsKGJjaWQpO1xyXG4gICAgZi5maW5kKCcubWFpbi1hY3Rpb24nKS52YWwoJCh0aGlzKS50ZXh0KCkpO1xyXG5cclxuICAgIHNtb290aEJveEJsb2NrLm9wZW4ocHMxLCAkYywgJ2JhY2tncm91bmQtY2hlY2snKTtcclxuICB9KTtcclxuXHJcbiAgJGMub24oJ2FqYXhTdWNjZXNzUG9zdCcsICcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrLXJlcXVlc3RGb3JtJywgZnVuY3Rpb24gKGUsIGRhdGEsIHRleHQsIGp4LCBjdHgpIHtcclxuICAgIGlmIChkYXRhLkNvZGUgPT09IDExMCkge1xyXG4gICAgICB2YXIgcHMyID0gJGMuZmluZCgnLnBvcHVwLmJ1eS1zdGVwLTInKTtcclxuICAgICAgdmFyIGJveCA9IHNtb290aEJveEJsb2NrLm9wZW4ocHMyLCAkYywgJ2JhY2tncm91bmQtY2hlY2snKTtcclxuICAgICAgLy8gUmVtb3ZlIGZyb20gdGhlIGxpc3QgdGhlIHJlcXVlc3RlZCBpdGVtXHJcbiAgICAgIHNlbGVjdGVkSXRlbS5yZW1vdmUoKTtcclxuICAgICAgLy8gRm9yY2Ugdmlld2VyIGxpc3QgcmVsb2FkXHJcbiAgICAgICRjLnRyaWdnZXIoJ3JlbG9hZExpc3QnKTtcclxuICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gbW9yZSBpdGVtcyBpbiB0aGUgbGlzdDpcclxuICAgICAgaWYgKCRjLmZpbmQoJy5EYXNoYm9hcmRCYWNrZ3JvdW5kQ2hlY2staXRlbScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIC8vIHRoZSBjbG9zZSBidXR0b24gb24gdGhlIHBvcHVwIG11c3QgY2xvc2UgdGhlIGVkaXRvciB0b286XHJcbiAgICAgICAgYm94LmZpbmQoJy5jbG9zZS1hY3Rpb24nKS5hZGRDbGFzcygnY3J1ZGwtY2FuY2VsJyk7XHJcbiAgICAgICAgLy8gVGhlIGFjdGlvbiBib3ggbXVzdCBkaXNhcHBlYXJcclxuICAgICAgICAkYy5jbG9zZXN0KCcuY3J1ZGwnKS5maW5kKCcuQmFja2dyb3VuZENoZWNrQWN0aW9uQm94JykucmVtb3ZlKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuXHJcbn07IiwiLyoqIEF2YWlsYWJpbGl0eTogQ2FsZW5kYXIgU3luYyBzZWN0aW9uIHNldHVwXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gICAgY29udGFpbmVyU2VsZWN0b3IgPSBjb250YWluZXJTZWxlY3RvciB8fCAnLkRhc2hib2FyZENhbGVuZGFyU3luYyc7XHJcbiAgICB2YXIgY29udGFpbmVyID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICAgICAgZmllbGRTZWxlY3RvciA9ICcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jLXByaXZhdGVVcmxGaWVsZCcsXHJcbiAgICAgICAgYnV0dG9uU2VsZWN0b3IgPSAnLkRhc2hib2FyZENhbGVuZGFyU3luYy1yZXNldC1hY3Rpb24nO1xyXG5cclxuICAgIC8vIFNlbGVjdGluZyBwcml2YXRlLXVybCBmaWVsZCB2YWx1ZSBvbiBmb2N1cyBhbmQgY2xpY2s6XHJcbiAgICBjb250YWluZXIuZmluZChmaWVsZFNlbGVjdG9yKS5vbignZm9jdXMgY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5zZWxlY3QoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFJlc2V0aW5nIHByaXZhdGUtdXJsXHJcbiAgICBjb250YWluZXJcclxuICAub24oJ2NsaWNrJywgYnV0dG9uU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgIHZhciB0ID0gJCh0aGlzKSxcclxuICAgICAgdXJsID0gdC5hdHRyKCdocmVmJyksXHJcbiAgICAgIGZpZWxkID0gY29udGFpbmVyLmZpbmQoZmllbGRTZWxlY3Rvcik7XHJcblxyXG4gICAgICBmaWVsZC52YWwoJycpO1xyXG5cclxuICAgICAgZnVuY3Rpb24gb25lcnJvcigpIHtcclxuICAgICAgICAgIGZpZWxkLnZhbChmaWVsZC5kYXRhKCdlcnJvci1tZXNzYWdlJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAkLmdldEpTT04odXJsLCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgZmllbGQudmFsKGRhdGEuUmVzdWx0KS5jaGFuZ2UoKTtcclxuICAgICAgICAgICAgICBmaWVsZFswXS5zZWxlY3QoKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgb25lcnJvcigpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9KS5mYWlsKG9uZXJyb3IpO1xyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG59OyIsIi8qKiBjaGFuZ2VQcm9maWxlUGhvdG8sIGl0IHVzZXMgJ3VwbG9hZGVyJyB1c2luZyBodG1sNSwgYWpheCBhbmQgYSBzcGVjaWZpYyBwYWdlXHJcbiAgdG8gbWFuYWdlIHNlcnZlci1zaWRlIHVwbG9hZCBvZiBhIG5ldyB1c2VyIHByb2ZpbGUgcGhvdG8uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCdMQy9zbW9vdGhCb3hCbG9jaycpO1xyXG4vLyBUT0RPOiByZWltcGxlbWVudCB0aGlzIGFuZCB0aGUgc2VydmVyLXNpZGUgZmlsZSB0byBhdm9pZCBpZnJhbWVzIGFuZCBleHBvc2luZyBnbG9iYWwgZnVuY3Rpb25zLFxyXG4vLyBkaXJlY3QgQVBJIHVzZSB3aXRob3V0IGlmcmFtZS1ub3JtYWwgcG9zdCBzdXBwb3J0IChjdXJyZW50IGJyb3dzZXIgbWF0cml4IGFsbG93IHVzIHRoaXM/KVxyXG4vLyBUT0RPOiBpbXBsZW1lbnQgYXMgcmVhbCBtb2R1bGFyLCBuZXh0IGFyZSB0aGUga25vd2VkIG1vZHVsZXMgaW4gdXNlIGJ1dCBub3QgbG9hZGluZyB0aGF0IGFyZSBleHBlY3RlZFxyXG4vLyB0byBiZSBpbiBzY29wZSByaWdodCBub3cgYnV0IG11c3QgYmUgdXNlZCB3aXRoIHRoZSBuZXh0IGNvZGUgdW5jb21tZW50ZWQuXHJcbi8vIHJlcXVpcmUoJ3VwbG9hZGVyJyk7XHJcbi8vIHJlcXVpcmUoJ0xjVXJsJyk7XHJcbi8vIHZhciBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuLi9MQy9ibG9ja1ByZXNldHMnKVxyXG4vLyB2YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgICAgICB1c2VyUGhvdG9Qb3B1cDtcclxuXHJcbiAgICAkYy5vbignY2xpY2snLCAnW2hyZWY9XCIjY2hhbmdlLXByb2ZpbGUtcGhvdG9cIl0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdXNlclBob3RvUG9wdXAgPSBwb3B1cChMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvQWJvdXRZb3UvQ2hhbmdlUGhvdG8vJywgeyB3aWR0aDogNzAwLCBoZWlnaHQ6IDY3MCB9LCBudWxsLCBudWxsLCB7IGF1dG9Gb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTk9URTogV2UgYXJlIGV4cG9zaW5nIGdsb2JhbCBmdW5jdGlvbnMgZnJvbSBoZXJlIGJlY2F1c2UgdGhlIHNlcnZlciBwYWdlL2lmcmFtZSBleHBlY3RzIHRoaXNcclxuICAgIC8vIHRvIHdvcmsuXHJcbiAgICAvLyBUT0RPOiByZWZhY3RvciB0byBhdm9pZCB0aGlzIHdheS5cclxuICAgIHdpbmRvdy5yZWxvYWRVc2VyUGhvdG8gPSBmdW5jdGlvbiByZWxvYWRVc2VyUGhvdG8oKSB7XHJcbiAgICAgICAgJGMuZmluZCgnLkRhc2hib2FyZFB1YmxpY0Jpby1waG90byAuYXZhdGFyJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBzcmMgPSB0aGlzLmdldEF0dHJpYnV0ZSgnc3JjJyk7XHJcbiAgICAgICAgICAgIC8vIGF2b2lkIGNhY2hlIHRoaXMgdGltZVxyXG4gICAgICAgICAgICBzcmMgPSBzcmMgKyBcIj92PVwiICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHNyYyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHdpbmRvdy5jbG9zZVBvcHVwVXNlclBob3RvID0gZnVuY3Rpb24gY2xvc2VQb3B1cFVzZXJQaG90bygpIHtcclxuICAgICAgICBpZiAodXNlclBob3RvUG9wdXApIHtcclxuICAgICAgICAgICAgdXNlclBob3RvUG9wdXAuZmluZCgnLmNsb3NlLXBvcHVwJykudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHdpbmRvdy5kZWxldGVVc2VyUGhvdG8gPSBmdW5jdGlvbiBkZWxldGVVc2VyUGhvdG8oKSB7XHJcblxyXG4gICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgc21vb3RoQm94QmxvY2sub3BlbigkKCc8ZGl2Lz4nKS5odG1sKExDLmJsb2NrUHJlc2V0cy5sb2FkaW5nLm1lc3NhZ2UpLCAkKCdib2R5JyksICcnLCB7IGNlbnRlcjogJ2hvcml6b250YWwnIH0pO1xyXG5cclxuICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICB1cmw6IExjVXJsLkxhbmdVcmwgKyBcImRhc2hib2FyZC9BYm91dFlvdS9DaGFuZ2VQaG90by8/ZGVsZXRlPXRydWVcIixcclxuICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGRhdGFUeXBlOiBcImpzb25cIixcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50ID0gKGRhdGEuQ29kZSA9PT0gMCA/IGRhdGEuUmVzdWx0IDogZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKCQoJzxkaXYvPicpLnRleHQoY29udGVudCksICQoJ2JvZHknKSwgJycsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogJ2hvcml6b250YWwnIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJlbG9hZFVzZXJQaG90bygpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogYWpheEVycm9yUG9wdXBIYW5kbGVyXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxufTtcclxuIiwiLyoqIEVkdWNhdGlvbiBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vcmVxdWlyZSgnTEMvanF1ZXJ5Lnh0c2gnKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgc2VjdGlvblNlbGVjdG9yID0gJy5EYXNoYm9hcmRFZHVjYXRpb24nLFxyXG4gICAgJHNlY3Rpb24gPSAkYy5maW5kKHNlY3Rpb25TZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJHNlY3Rpb24uc2libGluZ3MoKVxyXG4gICAgICAgIC5hZGQoJHNlY3Rpb24uZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAgIC5hZGQoJHNlY3Rpb24uY2xvc2VzdCgnLkRhc2hib2FyZEFib3V0WW91Jykuc2libGluZ3MoKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChzZWN0aW9uU2VsZWN0b3IpO1xyXG4gIC8vY3J1ZGwuc2V0dGluZ3MuZWZmZWN0c1snc2hvdy12aWV3ZXInXSA9IHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9O1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICAvLyBTZXR1cCBhdXRvY29tcGxldGVcclxuICAgICRlZGl0b3IuZmluZCgnW25hbWU9aW5zdGl0dXRpb25dJykuYXV0b2NvbXBsZXRlKHtcclxuICAgICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRJbnN0aXR1dGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAgIGRlbGF5OiAyMDAsXHJcbiAgICAgIG1pbkxlbmd0aDogNVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gIGdlbmVyYXRlQm9va05vd0J1dHRvbjogd2l0aCB0aGUgcHJvcGVyIGh0bWwgYW5kIGZvcm1cclxuICByZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciBjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gIGZ1bmN0aW9uIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCkge1xyXG4gICAgdmFyXHJcbiAgICAgIHNpemUgPSBjLmZpbmQoJ1tuYW1lPXNpemVdOmNoZWNrZWQnKS52YWwoKSxcclxuICAgICAgcG9zaXRpb25pZCA9IGMuZmluZCgnW25hbWU9cG9zaXRpb25pZF06Y2hlY2tlZCcpLnZhbCgpLFxyXG4gICAgICBzb3VyY2VDb250YWluZXIgPSBjLmZpbmQoJ1tuYW1lPWJ1dHRvbi1zb3VyY2UtY29kZV0nKSxcclxuICAgICAgcHJldmlld0NvbnRhaW5lciA9IGMuZmluZCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uU2l6ZXMtcHJldmlldycpLFxyXG4gICAgICBidXR0b25UcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtYnV0dG9uVGVtcGxhdGUnKS50ZXh0KCksXHJcbiAgICAgIGxpbmtUcGwgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUtbGlua1RlbXBsYXRlJykudGV4dCgpLFxyXG4gICAgICB0cGwgPSAoc2l6ZSA9PSAnbGluay1vbmx5JyA/IGxpbmtUcGwgOiBidXR0b25UcGwpLFxyXG4gICAgICB0cGxWYXJzID0gJCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uQ29kZScpO1xyXG5cclxuICAgIHByZXZpZXdDb250YWluZXIuaHRtbCh0cGwpO1xyXG4gICAgcHJldmlld0NvbnRhaW5lci5maW5kKCdhJykuYXR0cignaHJlZicsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS11cmwnKSArIChwb3NpdGlvbmlkID8gcG9zaXRpb25pZCArICcvJyA6ICcnKSk7XHJcbiAgICBwcmV2aWV3Q29udGFpbmVyLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsXHJcbiAgICAgIHRwbFZhcnMuZGF0YSgnYmFzZS1zcmMnKSArIHNpemUpO1xyXG4gICAgc291cmNlQ29udGFpbmVyLnZhbChwcmV2aWV3Q29udGFpbmVyLmh0bWwoKS50cmltKCkpO1xyXG4gIH1cclxuXHJcbiAgLy8gRmlyc3QgZ2VuZXJhdGlvblxyXG4gIGlmIChjLmxlbmd0aCA+IDApIHJlZ2VuZXJhdGVCdXR0b25Db2RlKCk7XHJcbiAgLy8gYW5kIG9uIGFueSBmb3JtIGNoYW5nZVxyXG4gIGMub24oJ2NoYW5nZScsICdpbnB1dCcsIHJlZ2VuZXJhdGVCdXR0b25Db2RlKTtcclxufTsiLCIvKiogTGljZW5zZXMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGxpY2Vuc2VzU2VsZWN0b3IgPSAnLkRhc2hib2FyZExpY2Vuc2VzJyxcclxuICAgICRsaWNlbnNlcyA9ICRjLmZpbmQobGljZW5zZXNTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGxpY2Vuc2VzLnNpYmxpbmdzKClcclxuICAgICAgLmFkZCgkbGljZW5zZXMuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAuYWRkKCRsaWNlbnNlcy5jbG9zZXN0KCcuRGFzaGJvYXJkWW91cldvcmsnKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgdmFyIGNydWRsID0gaW5pdENydWRsKGxpY2Vuc2VzU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogTG9jYXRpb25zIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIG1hcFJlYWR5ID0gcmVxdWlyZSgnTEMvZ29vZ2xlTWFwUmVhZHknKTtcclxuLy8gSW5kaXJlY3RseSB1c2VkOiByZXF1aXJlKCdMQy9oYXNDb25maXJtU3VwcG9ydCcpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICAgIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgICAgIGxvY2F0aW9uc1NlbGVjdG9yID0gJy5EYXNoYm9hcmRMb2NhdGlvbnMnLFxyXG4gICAgICAgICRsb2NhdGlvbnMgPSAkYy5maW5kKGxvY2F0aW9uc1NlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICAgICAkb3RoZXJzID0gJGxvY2F0aW9ucy5zaWJsaW5ncygpXHJcbiAgICAgICAgICAgIC5hZGQoJGxvY2F0aW9ucy5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpXHJcbiAgICAgICAgICAgIC5hZGQoJGxvY2F0aW9ucy5jbG9zZXN0KCcuRGFzaGJvYXJkWW91cldvcmsnKS5zaWJsaW5ncygpKTtcclxuXHJcbiAgICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwobG9jYXRpb25zU2VsZWN0b3IpO1xyXG5cclxuICAgIGlmIChjcnVkbC5lbGVtZW50cy5kYXRhKCdfX2xvY2F0aW9uc0NydWRsX2luaXRpYWxpemVkX18nKSA9PT0gdHJ1ZSkgcmV0dXJuO1xyXG4gICAgY3J1ZGwuZWxlbWVudHMuZGF0YSgnX19sb2NhdGlvbnNDcnVkbF9pbml0aWFsaXplZF9fJywgdHJ1ZSk7XHJcblxyXG4gICAgdmFyIGxvY2F0aW9uTWFwO1xyXG5cclxuICAgIGNydWRsLmVsZW1lbnRzXHJcbiAgICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgICB9KVxyXG4gICAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICAgIH0pXHJcbiAgICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuICAgICAgICAvL0ZvcmNlIGV4ZWN1dGlvbiBvZiB0aGUgJ2hhcy1jb25maXJtJyBzY3JpcHRcclxuICAgICAgICAkZWRpdG9yLmZpbmQoJ2ZpZWxkc2V0Lmhhcy1jb25maXJtID4gLmNvbmZpcm0gaW5wdXQnKS5jaGFuZ2UoKTtcclxuXHJcbiAgICAgICAgc2V0dXBDb3B5TG9jYXRpb24oJGVkaXRvcik7XHJcblxyXG4gICAgICAgIGxvY2F0aW9uTWFwID0gc2V0dXBHZW9wb3NpdGlvbmluZygkZWRpdG9yKTtcclxuICAgIH0pXHJcbiAgICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3Itc2hvd2VkJ10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcblxyXG4gICAgICAgIGlmIChsb2NhdGlvbk1hcClcclxuICAgICAgICAgICAgbWFwUmVhZHkucmVmcmVzaE1hcChsb2NhdGlvbk1hcCk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwQ29weUxvY2F0aW9uKCRlZGl0b3IpIHtcclxuICAgICRlZGl0b3IuZmluZCgnc2VsZWN0LmNvcHktbG9jYXRpb24nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgJHQuY2xvc2VzdCgnLmNydWRsLWZvcm0nKS5yZWxvYWQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpLnJlcGxhY2UoXHJcbiAgICAgICAgICAgICAgICAgICAgL0xvY2F0aW9uSUQ9XFxkKy9naSxcclxuICAgICAgICAgICAgICAgICAgICAnTG9jYXRpb25JRD0nICsgJHQudmFsKCkpICsgJyYnICsgJHQuZGF0YSgnZXh0cmEtcXVlcnknKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKiBMb2NhdGUgdXNlciBwb3NpdGlvbiBvciB0cmFuc2xhdGUgYWRkcmVzcyB0ZXh0IGludG8gYSBnZW9jb2RlIHVzaW5nXHJcbiAgYnJvd3NlciBhbmQgR29vZ2xlIE1hcHMgc2VydmljZXMuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cEdlb3Bvc2l0aW9uaW5nKCRlZGl0b3IpIHtcclxuICAgIHZhciBtYXA7XHJcbiAgICBtYXBSZWFkeShmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIC8vIFJlZ2lzdGVyIGlmIHVzZXIgc2VsZWN0cyBvciB3cml0ZXMgYSBwb3NpdGlvbiAodG8gbm90IG92ZXJ3cml0ZSBpdCB3aXRoIGF1dG9tYXRpYyBwb3NpdGlvbmluZylcclxuICAgICAgICB2YXIgcG9zaXRpb25lZEJ5VXNlciA9IGZhbHNlO1xyXG4gICAgICAgIC8vIFNvbWUgY29uZnNcclxuICAgICAgICB2YXIgZGV0YWlsZWRab29tTGV2ZWwgPSAxNztcclxuICAgICAgICB2YXIgZ2VuZXJhbFpvb21MZXZlbCA9IDk7XHJcbiAgICAgICAgdmFyIGZvdW5kTG9jYXRpb25zID0ge1xyXG4gICAgICAgICAgICBieVVzZXI6IG51bGwsXHJcbiAgICAgICAgICAgIGJ5R2VvbG9jYXRpb246IG51bGwsXHJcbiAgICAgICAgICAgIGJ5R2VvY29kZTogbnVsbCxcclxuICAgICAgICAgICAgb3JpZ2luYWw6IG51bGxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgbCA9ICRlZGl0b3IuZmluZCgnLmxvY2F0aW9uLW1hcCcpO1xyXG4gICAgICAgIHZhciBtID0gbC5maW5kKCcubWFwLXNlbGVjdG9yID4gLmdvb2dsZS1tYXAnKS5nZXQoMCk7XHJcbiAgICAgICAgdmFyICRsYXQgPSBsLmZpbmQoJ1tuYW1lPWxhdGl0dWRlXScpO1xyXG4gICAgICAgIHZhciAkbG5nID0gbC5maW5kKCdbbmFtZT1sb25naXR1ZGVdJyk7XHJcbiAgICAgICAgdmFyICRpc1JhZGl1cyA9ICRlZGl0b3IuZmluZCgnW25hbWU9aXRyYXZlbF0nKTtcclxuICAgICAgICB2YXIgJHJhZGl1cyA9ICRlZGl0b3IuZmluZCgnW25hbWU9dHJhdmVsLXJhZGl1c10nKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRpbmcgcG9zaXRpb24gY29vcmRpbmF0ZXNcclxuICAgICAgICB2YXIgbXlMYXRsbmc7XHJcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIF9sYXRfdmFsdWUgPSAkbGF0LnZhbCgpLCBfbG5nX3ZhbHVlID0gJGxuZy52YWwoKTtcclxuICAgICAgICAgICAgaWYgKF9sYXRfdmFsdWUgJiYgX2xuZ192YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgbXlMYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKCRsYXQudmFsKCksICRsbmcudmFsKCkpO1xyXG4gICAgICAgICAgICAgICAgLy8gV2UgY29uc2lkZXIgYXMgJ3Bvc2l0aW9uZWQgYnkgdXNlcicgd2hlbiB0aGVyZSB3YXMgYSBzYXZlZCB2YWx1ZSBmb3IgdGhlIHBvc2l0aW9uIGNvb3JkaW5hdGVzICh3ZSBhcmUgZWRpdGluZyBhIGxvY2F0aW9uKVxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IChteUxhdGxuZy5sYXQoKSAhPT0gMCAmJiBteUxhdGxuZy5sbmcoKSAhPT0gMCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IHBvc2l0aW9uIHdoZW4gdGhlcmUgYXJlIG5vdCBvbmUgKFNhbiBGcmFuY2lzY28ganVzdCBub3cpOlxyXG4gICAgICAgICAgICAgICAgbXlMYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM3Ljc1MzM0NDM5MjI2Mjk4LCAtMTIyLjQyNTQ2MDYwMzUxNTYpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSkoKTtcclxuICAgICAgICAvLyBSZW1lbWJlciBvcmlnaW5hbCBmb3JtIGxvY2F0aW9uXHJcbiAgICAgICAgZm91bmRMb2NhdGlvbnMub3JpZ2luYWwgPSBmb3VuZExvY2F0aW9ucy5jb25maXJtZWQgPSBteUxhdGxuZztcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIG1hcFxyXG4gICAgICAgIHZhciBtYXBPcHRpb25zID0ge1xyXG4gICAgICAgICAgICB6b29tOiAocG9zaXRpb25lZEJ5VXNlciA/IGRldGFpbGVkWm9vbUxldmVsIDogZ2VuZXJhbFpvb21MZXZlbCksIC8vIEJlc3QgZGV0YWlsIHdoZW4gd2UgYWxyZWFkeSBoYWQgYSBsb2NhdGlvblxyXG4gICAgICAgICAgICBjZW50ZXI6IG15TGF0bG5nLFxyXG4gICAgICAgICAgICBtYXBUeXBlSWQ6IGdvb2dsZS5tYXBzLk1hcFR5cGVJZC5ST0FETUFQXHJcbiAgICAgICAgfTtcclxuICAgICAgICBtYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKG0sIG1hcE9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdGhlIHBvc2l0aW9uIG1hcmtlclxyXG4gICAgICAgIHZhciBtYXJrZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKHtcclxuICAgICAgICAgICAgcG9zaXRpb246IG15TGF0bG5nLFxyXG4gICAgICAgICAgICBtYXA6IG1hcCxcclxuICAgICAgICAgICAgZHJhZ2dhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIFBsYWNlaG9sZGVyIGZvciB0aGUgcmFkaXVzQ2lyY2xlLCBjcmVhdGVkIG9uIGRlbWFuZFxyXG4gICAgICAgIHZhciByYWRpdXNDaXJjbGU7XHJcbiAgICAgICAgLy8gSW5pdGlhbGl6aW5nIHJhZGl1c0NpcmNsZVxyXG4gICAgICAgIHVwZGF0ZVJhZGl1c0NpcmNsZSgpO1xyXG5cclxuICAgICAgICAvLyBMaXN0ZW4gd2hlbiB1c2VyIGNsaWNrcyBtYXAgb3IgbW92ZSB0aGUgbWFya2VyIHRvIG1vdmUgbWFya2VyIG9yIHNldCBwb3NpdGlvbiBpbiB0aGUgZm9ybVxyXG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgJ2RyYWdlbmQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgc2V0Rm9ybUNvb3JkaW5hdGVzKG1hcmtlci5nZXRQb3NpdGlvbigpKTtcclxuICAgICAgICAgICAgdXBkYXRlUmFkaXVzQ2lyY2xlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFwLCAnY2xpY2snLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgaWYgKCFtYXJrZXIuZ2V0RHJhZ2dhYmxlKCkpIHJldHVybjtcclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIoZXZlbnQubGF0TG5nKTtcclxuICAgICAgICAgICAgcG9zaXRpb25lZEJ5VXNlciA9IHRydWU7XHJcbiAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5VXNlciA9IGV2ZW50LmxhdExuZztcclxuICAgICAgICAgICAgc2V0Rm9ybUNvb3JkaW5hdGVzKGV2ZW50LmxhdExuZyk7XHJcbiAgICAgICAgICAgIHVwZGF0ZVJhZGl1c0NpcmNsZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsYWNlTWFya2VyKGxhdGxuZywgZG96b29tLCBhdXRvc2F2ZSkge1xyXG4gICAgICAgICAgICBtYXJrZXIuc2V0UG9zaXRpb24obGF0bG5nKTtcclxuICAgICAgICAgICAgLy8gTW92ZSBtYXBcclxuICAgICAgICAgICAgbWFwLnBhblRvKGxhdGxuZyk7XHJcbiAgICAgICAgICAgIHNhdmVDb29yZGluYXRlcyhhdXRvc2F2ZSk7XHJcbiAgICAgICAgICAgIHVwZGF0ZVJhZGl1c0NpcmNsZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRvem9vbSlcclxuICAgICAgICAgICAgLy8gU2V0IHpvb20gdG8gc29tZXRoaW5nIG1vcmUgZGV0YWlsZWRcclxuICAgICAgICAgICAgICAgIG1hcC5zZXRab29tKGRldGFpbGVkWm9vbUxldmVsKTtcclxuICAgICAgICAgICAgcmV0dXJuIG1hcmtlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gc2F2ZUNvb3JkaW5hdGVzKGluRm9ybSkge1xyXG4gICAgICAgICAgICB2YXIgbGF0TG5nID0gbWFya2VyLmdldFBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5ieVVzZXIgPSBsYXRMbmc7XHJcbiAgICAgICAgICAgIGlmIChpbkZvcm0gPT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHNldEZvcm1Db29yZGluYXRlcyhsYXRMbmcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHNldEZvcm1Db29yZGluYXRlcyhsYXRMbmcpIHtcclxuICAgICAgICAgICAgJGxhdC52YWwobGF0TG5nLmxhdCgpKTsgLy9tYXJrZXIucG9zaXRpb24uWGFcclxuICAgICAgICAgICAgJGxuZy52YWwobGF0TG5nLmxuZygpKTsgLy9tYXJrZXIucG9zaXRpb24uWWFcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgIEl0IGNyZWF0ZXMgYSBjaXJjbGUgb24gdGhlIG1hcCB3aXRoIHRoZSBnaXZlbiB2YWx1ZXNcclxuICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiBjcmVhdGVSYWRpdXNDaXJjbGUobGF0bG5nLCByYWRpdXMpIHtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgZ29vZ2xlLm1hcHMuQ2lyY2xlKHtcclxuICAgICAgICAgICAgICAgIGNlbnRlcjogbGF0bG5nLFxyXG4gICAgICAgICAgICAgICAgbWFwOiBtYXAsXHJcbiAgICAgICAgICAgICAgICBjbGlja2FibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcmFkaXVzOiBnZXRMb2NhdGlvblJhZGl1cygpLFxyXG4gICAgICAgICAgICAgICAgZmlsbENvbG9yOiAnIzAwOTg5QScsXHJcbiAgICAgICAgICAgICAgICBmaWxsT3BhY2l0eTogMC4zLFxyXG4gICAgICAgICAgICAgICAgc3Ryb2tlV2VpZ2h0OiAwXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvKipcclxuICAgICAgICBVcGRhdGVzIHRoZSBwb3NpdGlvbiBhbmQgcmFkaXVzIG9mIGN1cnJlbnQgcmFkaXVzQ2lyY2xlXHJcbiAgICAgICAgaW4gdGhlIG1hcCBmb3IgdGhlIGN1cnJlbnQgcG9zaXRpb24gYW5kIHJhZGl1c1xyXG4gICAgICAgIG9yIHRoZSBnaXZlbiBvbmUuXHJcbiAgICAgICAgSWYgdGhlIGNpcmNsZSBkb2Vzbid0IGV4aXN0cywgaXRzIGNyZWF0ZWQsXHJcbiAgICAgICAgb3IgaGlkZGVuIGlmIHRoZXJlIGlzIG5vIHJhZGl1cyBhbmQgZXhpc3RzIGFscmVhZHkuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gdXBkYXRlUmFkaXVzQ2lyY2xlKGxhdGxuZywgcmFkaXVzKSB7XHJcblxyXG4gICAgICAgICAgICBsYXRsbmcgPSBsYXRsbmcgJiYgbGF0bG5nLmdldExuZyB8fCBtYXJrZXIuZ2V0UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgcmFkaXVzID0gcmFkaXVzIHx8IGdldExvY2F0aW9uUmFkaXVzKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAocmFkaXVzICYmIGxhdGxuZykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJhZGl1c0NpcmNsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJhZGl1c0NpcmNsZS5zZXRDZW50ZXIobGF0bG5nKTtcclxuICAgICAgICAgICAgICAgICAgICByYWRpdXNDaXJjbGUuc2V0UmFkaXVzKHJhZGl1cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmFkaXVzQ2lyY2xlLnNldFZpc2libGUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByYWRpdXNDaXJjbGUgPSBjcmVhdGVSYWRpdXNDaXJjbGUobGF0bG5nLCByYWRpdXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJhZGl1c0NpcmNsZSkge1xyXG4gICAgICAgICAgICAgICAgcmFkaXVzQ2lyY2xlLnNldFZpc2libGUoZmFsc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgIEdldCB0aGUgc2VydmljZSByYWRpdXMgYXMgYSBudW1iZXIgaW4gbWV0ZXJzIHVzZWZ1bGUgZm9yIEdvb2dsZSBNYXBzXHJcbiAgICAgICAgZnJvbSB0aGUgZm9ybSB3aGVuZXZlciBhcHBseSwgZWxzZSBpdCByZXR1cm5zIG51bGwuXHJcbiAgICAgICAgKiovXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0TG9jYXRpb25SYWRpdXMoKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBXaGVuIHJhZGl1cy90cmF2ZWwgb3B0aW9uIGNob29zZW5cclxuICAgICAgICAgICAgaWYgKCRpc1JhZGl1cy5maWx0ZXIoJzpjaGVja2VkW3ZhbHVlPVwiVHJ1ZVwiXScpLnByb3AoJ2NoZWNrZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gR2V0IHJhZGl1cyBmcm9tIGZvcm0gKGl0cyBpbiBtaWxlcyBvciBrbSlcclxuICAgICAgICAgICAgICAgIHZhciByYWRpdXMgPSAkcmFkaXVzLnZhbCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIHJhZGl1c1VuaXQgPSBMQy5kaXN0YW5jZVVuaXRzW0xDLmdldEN1cnJlbnRDdWx0dXJlKCkuY291bnRyeV07XHJcbiAgICAgICAgICAgICAgICAvLyByZXN1bHQgbXVzdCBnbyBpbiBtZXRlcnNcclxuICAgICAgICAgICAgICAgIHJldHVybiAocmFkaXVzVW5pdCA9PSAnbWlsZXMnID8gY29udmVydE1pbGVzS20ocmFkaXVzLCByYWRpdXNVbml0KSA6IHJhZGl1cykgKiAxMDAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIExpc3RlbiB3aGVuIHVzZXIgY2hhbmdlcyBmb3JtIGNvb3JkaW5hdGVzIHZhbHVlcyB0byB1cGRhdGUgdGhlIG1hcFxyXG4gICAgICAgICRsYXQuY2hhbmdlKHVwZGF0ZU1hcE1hcmtlcik7XHJcbiAgICAgICAgJGxuZy5jaGFuZ2UodXBkYXRlTWFwTWFya2VyKTtcclxuICAgICAgICBmdW5jdGlvbiB1cGRhdGVNYXBNYXJrZXIoKSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICAgICAgICB2YXIgbmV3UG9zID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZygkbGF0LnZhbCgpLCAkbG5nLnZhbCgpKTtcclxuICAgICAgICAgICAgLy8gTW92ZSBtYXJrZXJcclxuICAgICAgICAgICAgbWFya2VyLnNldFBvc2l0aW9uKG5ld1Bvcyk7XHJcbiAgICAgICAgICAgIC8vIE1vdmUgbWFwXHJcbiAgICAgICAgICAgIG1hcC5wYW5UbyhuZXdQb3MpO1xyXG4gICAgICAgICAgICB1cGRhdGVSYWRpdXNDaXJjbGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTGlzdGVuIHdoZW4gdXNlciBjaGFuZ2VzIHNlcnZpY2UgcmFkaXVzIGZyb20gZm9ybSB0byB1cGRhdGUgdGhlIG1hcFxyXG4gICAgICAgICRpc1JhZGl1cy5jaGFuZ2UodXBkYXRlUmFkaXVzQ2lyY2xlKTtcclxuICAgICAgICAkcmFkaXVzLmNoYW5nZSh1cGRhdGVSYWRpdXNDaXJjbGUpO1xyXG5cclxuICAgICAgICAvKj09PT09PT09PT09PT09PT09PT1cclxuICAgICAgICAqIEFVVE8gUE9TSVRJT05JTkdcclxuICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHVzZUdlb2xvY2F0aW9uKGZvcmNlLCBhdXRvc2F2ZSkge1xyXG4gICAgICAgICAgICB2YXIgb3ZlcnJpZGUgPSBmb3JjZSB8fCAhcG9zaXRpb25lZEJ5VXNlcjtcclxuICAgICAgICAgICAgLy8gVXNlIGJyb3dzZXIgZ2VvbG9jYXRpb24gc3VwcG9ydCB0byBnZXQgYW4gYXV0b21hdGljIGxvY2F0aW9uIGlmIHRoZXJlIGlzIG5vIGEgbG9jYXRpb24gc2VsZWN0ZWQgYnkgdXNlclxyXG4gICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBicm93c2VyIHN1cHBvcnRzIGdlb2xvY2F0aW9uLlxyXG4gICAgICAgICAgICBpZiAob3ZlcnJpZGUgJiYgbmF2aWdhdG9yLmdlb2xvY2F0aW9uKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgbG9jYXRpb24gbWFya2VyIHRoYXQgd2Ugd2lsbCBiZSB1c2luZ1xyXG4gICAgICAgICAgICAgICAgLy8gb24gdGhlIG1hcC4gTGV0J3Mgc3RvcmUgYSByZWZlcmVuY2UgdG8gaXQgaGVyZSBzb1xyXG4gICAgICAgICAgICAgICAgLy8gdGhhdCBpdCBjYW4gYmUgdXBkYXRlZCBpbiBzZXZlcmFsIHBsYWNlcy5cclxuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbk1hcmtlciA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gR2V0IHRoZSBsb2NhdGlvbiBvZiB0aGUgdXNlcidzIGJyb3dzZXIgdXNpbmcgdGhlXHJcbiAgICAgICAgICAgICAgICAvLyBuYXRpdmUgZ2VvbG9jYXRpb24gc2VydmljZS4gV2hlbiB3ZSBpbnZva2UgdGhpcyBtZXRob2RcclxuICAgICAgICAgICAgICAgIC8vIG9ubHkgdGhlIGZpcnN0IGNhbGxiYWNrIGlzIHJlcXVpZWQuIFRoZSBzZWNvbmRcclxuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIC0gdGhlIGVycm9yIGhhbmRsZXIgLSBhbmQgdGhlIHRoaXJkXHJcbiAgICAgICAgICAgICAgICAvLyBhcmd1bWVudCAtIG91ciBjb25maWd1cmF0aW9uIG9wdGlvbnMgLSBhcmUgb3B0aW9uYWwuXHJcbiAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKFxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlcmUgaXMgYWxyZWFkeSBhIGxvY2F0aW9uLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyBhIGJ1ZyBpbiBGaXJlRm94IHdoZXJlIHRoaXMgZ2V0c1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpbnZva2VkIG1vcmUgdGhhbiBvbmNlIHdpdGggYSBjYWNoZWQgcmVzdWx0LlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9jYXRpb25NYXJrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gTW92ZSBtYXJrZXIgdG8gdGhlIG1hcCB1c2luZyB0aGUgcG9zaXRpb24sIG9ubHkgaWYgdXNlciBkb2Vzbid0IHNldCBhIHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvdmVycmlkZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhdExuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmNvb3Jkcy5sb25naXR1ZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbk1hcmtlciA9IHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbiA9IGxhdExuZztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUubG9nKSBjb25zb2xlLmxvZyhcIlNvbWV0aGluZyB3ZW50IHdyb25nOiBcIiwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aW1lb3V0OiAoNSAqIDEwMDApLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhpbXVtQWdlOiAoMTAwMCAqIDYwICogMTUpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVIaWdoQWNjdXJhY3k6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIGFza2VkIGZvciB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIsXHJcbiAgICAgICAgICAgICAgICAvLyBsZXQncyB3YXRjaCB0aGUgcG9zaXRpb24gdG8gc2VlIGlmIGl0IHVwZGF0ZXMuIFRoaXNcclxuICAgICAgICAgICAgICAgIC8vIGNhbiBoYXBwZW4gaWYgdGhlIHVzZXIgcGh5c2ljYWxseSBtb3Zlcywgb2YgaWYgbW9yZVxyXG4gICAgICAgICAgICAgICAgLy8gYWNjdXJhdGUgbG9jYXRpb24gaW5mb3JtYXRpb24gaGFzIGJlZW4gZm91bmQgKGV4LlxyXG4gICAgICAgICAgICAgICAgLy8gR1BTIHZzLiBJUCBhZGRyZXNzKS5cclxuICAgICAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgICAgICAvLyBOT1RFOiBUaGlzIGFjdHMgbXVjaCBsaWtlIHRoZSBuYXRpdmUgc2V0SW50ZXJ2YWwoKSxcclxuICAgICAgICAgICAgICAgIC8vIGludm9raW5nIHRoZSBnaXZlbiBjYWxsYmFjayBhIG51bWJlciBvZiB0aW1lcyB0b1xyXG4gICAgICAgICAgICAgICAgLy8gbW9uaXRvciB0aGUgcG9zaXRpb24uIEFzIHN1Y2gsIGl0IHJldHVybnMgYSBcInRpbWVyIElEXCJcclxuICAgICAgICAgICAgICAgIC8vIHRoYXQgY2FuIGJlIHVzZWQgdG8gbGF0ZXIgc3RvcCB0aGUgbW9uaXRvcmluZy5cclxuICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvblRpbWVyID0gbmF2aWdhdG9yLmdlb2xvY2F0aW9uLndhdGNoUG9zaXRpb24oXHJcbiAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gTW92ZSBhZ2FpbiB0byB0aGUgbmV3IG9yIGFjY3VyYXRlZCBwb3NpdGlvbiwgaWYgdXNlciBkb2Vzbid0IHNldCBhIHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAob3ZlcnJpZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGF0TG5nID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubG9uZ2l0dWRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbk1hcmtlciA9IHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24gPSBsYXRMbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChwb3NpdGlvblRpbWVyKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIHBvc2l0aW9uIGhhc24ndCB1cGRhdGVkIHdpdGhpbiA1IG1pbnV0ZXMsIHN0b3BcclxuICAgICAgICAgICAgICAgIC8vIG1vbml0b3JpbmcgdGhlIHBvc2l0aW9uIGZvciBjaGFuZ2VzLlxyXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gQ2xlYXIgdGhlIHBvc2l0aW9uIHdhdGNoZXIuXHJcbiAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChwb3NpdGlvblRpbWVyKTtcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgKDEwMDAgKiA2MCAqIDUpXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSAvLyBFbmRzIGdlb2xvY2F0aW9uIHBvc2l0aW9uXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIHVzZUdtYXBzR2VvY29kZShpbml0aWFsTG9va3VwLCBhdXRvc2F2ZSkge1xyXG4gICAgICAgICAgICB2YXIgZ2VvY29kZXIgPSBuZXcgZ29vZ2xlLm1hcHMuR2VvY29kZXIoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGxvb2t1cCBvbiBhZGRyZXNzIGZpZWxkcyBjaGFuZ2VzIHdpdGggY29tcGxldGUgaW5mb3JtYXRpb25cclxuICAgICAgICAgICAgdmFyICRmb3JtID0gJGVkaXRvci5maW5kKCcuY3J1ZGwtZm9ybScpLCBmb3JtID0gJGZvcm0uZ2V0KDApO1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRGb3JtQWRkcmVzcygpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhZCA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gYWRkKGZpZWxkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZvcm0uZWxlbWVudHNbZmllbGRdICYmIGZvcm0uZWxlbWVudHNbZmllbGRdLnZhbHVlKSBhZC5wdXNoKGZvcm0uZWxlbWVudHNbZmllbGRdLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGFkZCgnYWRkcmVzc2xpbmUxJyk7XHJcbiAgICAgICAgICAgICAgICBhZGQoJ2FkZHJlc3NsaW5lMicpO1xyXG4gICAgICAgICAgICAgICAgYWRkKCdjaXR5Jyk7XHJcbiAgICAgICAgICAgICAgICBhZGQoJ3Bvc3RhbGNvZGUnKTtcclxuICAgICAgICAgICAgICAgIHZhciBzID0gZm9ybS5lbGVtZW50cy5zdGF0ZTtcclxuICAgICAgICAgICAgICAgIGlmIChzICYmIHMudmFsdWUpIGFkLnB1c2gocy5vcHRpb25zW3Muc2VsZWN0ZWRJbmRleF0ubGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgYWQucHVzaCgnVVNBJyk7XHJcbiAgICAgICAgICAgICAgICAvLyBNaW5pbXVtIGZvciB2YWxpZCBhZGRyZXNzOiAyIGZpZWxkcyBmaWxsZWQgb3V0XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWQubGVuZ3RoID49IDIgPyBhZC5qb2luKCcsICcpIDogbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZm9ybS5vbignY2hhbmdlJywgJ1tuYW1lPWFkZHJlc3NsaW5lMV0sIFtuYW1lPWFkZHJlc3NsaW5lMl0sIFtuYW1lPWNpdHldLCBbbmFtZT1wb3N0YWxjb2RlXSwgW25hbWU9c3RhdGVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGFkZHJlc3MgPSBnZXRGb3JtQWRkcmVzcygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFkZHJlc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgZ2VvY29kZUxvb2t1cChhZGRyZXNzLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gSW5pdGlhbCBsb29rdXBcclxuICAgICAgICAgICAgaWYgKGluaXRpYWxMb29rdXApIHtcclxuICAgICAgICAgICAgICAgIHZhciBhZGRyZXNzID0gZ2V0Rm9ybUFkZHJlc3MoKTtcclxuICAgICAgICAgICAgICAgIGlmIChhZGRyZXNzKVxyXG4gICAgICAgICAgICAgICAgICAgIGdlb2NvZGVMb29rdXAoYWRkcmVzcywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdlb2NvZGVMb29rdXAoYWRkcmVzcywgb3ZlcnJpZGUpIHtcclxuICAgICAgICAgICAgICAgIGdlb2NvZGVyLmdlb2NvZGUoeyAnYWRkcmVzcyc6IGFkZHJlc3MgfSwgZnVuY3Rpb24gKHJlc3VsdHMsIHN0YXR1cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMgPT0gZ29vZ2xlLm1hcHMuR2VvY29kZXJTdGF0dXMuT0spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhdExuZyA9IHJlc3VsdHNbMF0uZ2VvbWV0cnkubG9jYXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKCdHZW9jb2RlIHJldHJpZXZlZDogJyArIGxhdExuZyArICcgZm9yIGFkZHJlc3MgXCInICsgYWRkcmVzcyArICdcIicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5ieUdlb2NvZGUgPSBsYXRMbmc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZU1hcmtlcihsYXRMbmcsIHRydWUsIGF1dG9zYXZlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdHZW9jb2RlIHdhcyBub3Qgc3VjY2Vzc2Z1bCBmb3IgdGhlIGZvbGxvd2luZyByZWFzb246ICcgKyBzdGF0dXMgKyAnIG9uIGFkZHJlc3MgXCInICsgYWRkcmVzcyArICdcIicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeGVjdXRpbmcgYXV0byBwb3NpdGlvbmluZyAoY2hhbmdlZCB0byBhdXRvc2F2ZTp0cnVlIHRvIGFsbCB0aW1lIHNhdmUgdGhlIGxvY2F0aW9uKTpcclxuICAgICAgICAvL3VzZUdlb2xvY2F0aW9uKHRydWUsIGZhbHNlKTtcclxuICAgICAgICB1c2VHbWFwc0dlb2NvZGUoZmFsc2UsIHRydWUpO1xyXG5cclxuICAgICAgICAvLyBMaW5rIG9wdGlvbnMgbGlua3M6XHJcbiAgICAgICAgbC5maW5kKCcub3B0aW9ucyBhJykub2ZmKCdjbGljay5tYXAnKS5vbignY2xpY2subWFwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gJCh0aGlzKS5hdHRyKCdocmVmJykuc3Vic3RyKDEpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ2VvbG9jYXRpb24nOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmb3VuZExvY2F0aW9ucy5ieUdlb2xvY2F0aW9uKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZU1hcmtlcihmb3VuZExvY2F0aW9ucy5ieUdlb2xvY2F0aW9uLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZUdlb2xvY2F0aW9uKHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZ2VvY29kZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZvdW5kTG9jYXRpb25zLmJ5R2VvY29kZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2VNYXJrZXIoZm91bmRMb2NhdGlvbnMuYnlHZW9jb2RlLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZUdtYXBzR2VvY29kZSh0cnVlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2NvbmZpcm0nOlxyXG4gICAgICAgICAgICAgICAgICAgIHNhdmVDb29yZGluYXRlcyh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICBtYXJrZXIuc2V0RHJhZ2dhYmxlKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3VuZExvY2F0aW9ucy5jb25maXJtZWQgPSBtYXJrZXIuZ2V0UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICBsLmZpbmQoJy5ncHMtbGF0LCAuZ3BzLWxuZywgLmFkdmljZSwgLmZpbmQtYWRkcmVzcy1nZW9jb2RlJykuaGlkZSgnZmFzdCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBlZGl0ID0gbC5maW5kKCcuZWRpdC1hY3Rpb24nKTtcclxuICAgICAgICAgICAgICAgICAgICBlZGl0LnRleHQoZWRpdC5kYXRhKCdlZGl0LWxhYmVsJykpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZWRpdGNvb3JkaW5hdGVzJzpcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IGwuZmluZCgnLmdwcy1sYXQsIC5ncHMtbG5nLCAuYWR2aWNlLCAuZmluZC1hZGRyZXNzLWdlb2NvZGUsIC5jb25maXJtLWdwcy1hY3Rpb24nKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYiA9ICFhLmlzKCc6dmlzaWJsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1hcmtlci5zZXREcmFnZ2FibGUoYik7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdC5kYXRhKCdlZGl0LWxhYmVsJywgJHQudGV4dCgpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQudGV4dCgkdC5kYXRhKCdjYW5jZWwtbGFiZWwnKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHQudGV4dCgkdC5kYXRhKCdlZGl0LWxhYmVsJykpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXN0b3JlIGxvY2F0aW9uOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZU1hcmtlcihmb3VuZExvY2F0aW9ucy5jb25maXJtZWQsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBhLnRvZ2dsZSgnZmFzdCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gbWFwO1xyXG59IiwiLypnbG9iYWwgd2luZG93ICovXHJcbi8qKiBVSSBsb2dpYyB0byBtYW5hZ2UgcHJvdmlkZXIgcGhvdG9zICh5b3VyLXdvcmsvcGhvdG9zKS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG52YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCdMQy9zbW9vdGhCb3hCbG9jaycpO1xyXG52YXIgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJ0xDL2NoYW5nZXNOb3RpZmljYXRpb24nKTtcclxudmFyIGFjYiA9IHJlcXVpcmUoJ0xDL2FqYXhDYWxsYmFja3MnKTtcclxucmVxdWlyZSgnaW1hZ2VzTG9hZGVkJyk7XHJcblxyXG52YXIgc2VjdGlvblNlbGVjdG9yID0gJy5EYXNoYm9hcmRQaG90b3MnO1xyXG4vLyBPbiBpbml0LCB0aGUgZGVmYXVsdCAnbm8gaW1hZ2UnIGltYWdlIHNyYyB3aWxsIGJlIGdldCBpdCBvbjpcclxudmFyIGRlZmF1bHRJbWdTcmMgPSBudWxsO1xyXG5cclxudmFyIGVkaXRvciA9IG51bGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgICBpZiAoJGMubGVuZ3RoKSB7XHJcblxyXG4gICAgICAgIHNldHVwQ3J1ZGxEZWxlZ2F0ZXMoJGMpO1xyXG5cclxuICAgICAgICBpbml0RWxlbWVudHMoJGMpO1xyXG5cclxuICAgICAgICAvLyBBbnkgdGltZSB0aGF0IHRoZSBmb3JtIGNvbnRlbnQgaHRtbCBpcyByZWxvYWRlZCxcclxuICAgICAgICAvLyByZS1pbml0aWFsaXplIGVsZW1lbnRzXHJcbiAgICAgICAgJGMub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0uYWpheCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaW5pdEVsZW1lbnRzKCRjKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufTtcclxuXHJcbmZ1bmN0aW9uIHNhdmUoZGF0YSkge1xyXG4gICAgXHJcbiAgICB2YXIgZWRpdFBhbmVsID0gJChzZWN0aW9uU2VsZWN0b3IpO1xyXG5cclxuICAgIHJldHVybiAkLmFqYXgoe1xyXG4gICAgICAgIHVybDogZWRpdFBhbmVsLmRhdGEoJ2FqYXgtZmllbGRzZXQtYWN0aW9uJyksXHJcbiAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICB0eXBlOiAncG9zdCcsXHJcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgLy8gbmV3IGVycm9yIGZvciBQcm9taXNlLWF0dGFjaGVkIGNhbGxiYWNrc1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGRhdGEuRXJyb3JNZXNzYWdlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFJlZ2lzdGVyIGNoYW5nZXNcclxuICAgICAgICAgICAgICAgIHZhciAkYyA9ICQoc2VjdGlvblNlbGVjdG9yKTtcclxuICAgICAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJTYXZlKCRjLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksICRjLmZpbmQoJzppbnB1dCcpLnRvQXJyYXkoKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCB0ZXh0LCBlcnJvcikge1xyXG4gICAgICAgICAgICAvLyBUT0RPOiBiZXR0ZXIgZXJyb3IgbWFuYWdlbWVudCwgc2F2aW5nXHJcbiAgICAgICAgICAgIGFsZXJ0KCdTb3JyeSwgdGhlcmUgd2FzIGFuIGVycm9yLiAnICsgKGVycm9yIHx8ICcnKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhdmVFZGl0ZWRQaG90bygkZikge1xyXG5cclxuICAgIHZhciBpZCA9ICRmLmZpbmQoJ1tuYW1lPVBob3RvSURdJykudmFsKCksXHJcbiAgICAgICAgY2FwdGlvbiA9ICRmLmZpbmQoJ1tuYW1lPXBob3RvLWNhcHRpb25dJykudmFsKCksXHJcbiAgICAgICAgaXNQcmltYXJ5ID0gJGYuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b106Y2hlY2tlZCcpLnZhbCgpID09PSAnVHJ1ZSc7XHJcblxyXG4gICAgaWYgKGlkICYmIGlkID4gMCkge1xyXG4gICAgICAgIC8vIEFqYXggc2F2ZVxyXG4gICAgICAgIHNhdmUoe1xyXG4gICAgICAgICAgICBQaG90b0lEOiBpZCxcclxuICAgICAgICAgICAgJ3Bob3RvLWNhcHRpb24nOiBjYXB0aW9uLFxyXG4gICAgICAgICAgICAnaXMtcHJpbWFyeS1waG90byc6IGlzUHJpbWFyeSxcclxuICAgICAgICAgICAgcmVzdWx0OiAnanNvbidcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBVcGRhdGUgY2FjaGUgYXQgZ2FsbGVyeSBpdGVtXHJcbiAgICAgICAgdmFyICRpdGVtID0gJGYuZmluZCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgI1VzZXJQaG90by0nICsgaWQpLFxyXG4gICAgICAgICAgICAkaW1nID0gJGl0ZW0uZmluZCgnaW1nJyk7XHJcblxyXG4gICAgICAgIGlmICgkaXRlbSAmJiAkaXRlbS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgJGltZy5hdHRyKCdhbHQnLCBjYXB0aW9uKTtcclxuICAgICAgICAgICAgaWYgKGlzUHJpbWFyeSlcclxuICAgICAgICAgICAgICAgICRpdGVtLmFkZENsYXNzKCdpcy1wcmltYXJ5LXBob3RvJyk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICRpdGVtLnJlbW92ZUNsYXNzKCdpcy1wcmltYXJ5LXBob3RvJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBlZGl0U2VsZWN0ZWRQaG90byhmb3JtLCBzZWxlY3RlZCkge1xyXG5cclxuICAgIHZhciBlZGl0UGFuZWwgPSAkKCcucG9zaXRpb25waG90b3MtZWRpdCcsIGZvcm0pO1xyXG4gICAgdmFyIG5vblVwbG9hZGVyRWxlbWVudHNTZWxlY3RvciA9ICcucG9zaXRpb25waG90b3MtZWRpdCwgLkRhc2hib2FyZFBob3Rvcy1lZGl0UGhvdG8gPiBsZWdlbmQsIC5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gbGVnZW5kLCAucG9zaXRpb25waG90b3MtZ2FsbGVyeSA+IG9sLCAucG9zaXRpb25waG90b3MtdG9vbHMnO1xyXG5cclxuICAgIC8vIFVzZSBnaXZlbiBAc2VsZWN0ZWQgb3IgbG9vayBmb3IgYSBzZWxlY3RlZCBwaG90byBpbiB0aGUgbGlzdFxyXG4gICAgc2VsZWN0ZWQgPSBzZWxlY3RlZCAmJiBzZWxlY3RlZC5sZW5ndGggPyBzZWxlY3RlZCA6ICQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2wgPiBsaS5zZWxlY3RlZCcsIGZvcm0pO1xyXG5cclxuICAgIC8vIE1hcmsgdGhpcyBhcyBzZWxlY3RlZFxyXG4gICAgc2VsZWN0ZWQuYWRkQ2xhc3MoJ3NlbGVjdGVkJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKTtcclxuXHJcbiAgICBpZiAoc2VsZWN0ZWQgJiYgc2VsZWN0ZWQubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICBmb3JtLmZpbmQobm9uVXBsb2FkZXJFbGVtZW50c1NlbGVjdG9yKS5zaG93KCk7XHJcbiAgICAgICAgZWRpdG9yLnVwbG9hZGVyLnNldEFzU2Vjb25kYXJ5KCk7XHJcblxyXG4gICAgICAgIHZhciBzZWxJbWcgPSBzZWxlY3RlZC5maW5kKCdpbWcnKTtcclxuICAgICAgICAvLyBNb3Zpbmcgc2VsZWN0ZWQgdG8gYmUgZWRpdCBwYW5lbFxyXG4gICAgICAgIHZhciBwaG90b0lEID0gc2VsZWN0ZWQuYXR0cignaWQnKS5tYXRjaCgvXlVzZXJQaG90by0oXFxkKykkLylbMV0sXHJcbiAgICAgICAgICAgIHBob3RvVXJsID0gc2VsSW1nLmF0dHIoJ3NyYycpLFxyXG4gICAgICAgICAgICAkaW1nID0gZWRpdFBhbmVsLmZpbmQoJ2ltZycpO1xyXG5cclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9UGhvdG9JRF0nKS52YWwocGhvdG9JRCk7XHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPXBob3RvVVJJXScpLnZhbChwaG90b1VybCk7XHJcbiAgICAgICAgJGltZ1xyXG4gICAgICAgIC5hdHRyKCdzcmMnLCBwaG90b1VybCArIFwiP3Y9XCIgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpKSAvLyAnP3NpemU9bm9ybWFsJylcclxuICAgICAgICAuYXR0cignc3R5bGUnLCAnJyk7XHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPXBob3RvLWNhcHRpb25dJykudmFsKHNlbEltZy5hdHRyKCdhbHQnKSk7XHJcbiAgICAgICAgdmFyIGlzUHJpbWFyeVZhbHVlID0gc2VsZWN0ZWQuaGFzQ2xhc3MoJ2lzLXByaW1hcnktcGhvdG8nKSA/ICdUcnVlJyA6ICdGYWxzZSc7XHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b11bdmFsdWU9JyArIGlzUHJpbWFyeVZhbHVlICsgJ10nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcblxyXG4gICAgICAgIC8vIENyb3BwaW5nXHJcbiAgICAgICAgJGltZy5pbWFnZXNMb2FkZWQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBlZGl0b3Iuc2V0dXBDcm9wUGhvdG8oKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChmb3JtLmZpbmQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2wgPiBsaScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAvLyAjNTM1LCBhdm9pZCB0aGUgJ3RoZXJlIGlzIG5vIHBob3RvcycgYW5kIGp1c3QgaGlkZSB0aGUgcGFuZWwgdG8gZ2l2ZSBxdWljayBhY2Nlc3NcclxuICAgICAgICAgICAgLy8gdG8gdGhlICd1cGxvYWQgYnV0dG9uJy4gVGhlIGdhbGxlcnkgbWF5IG5lZWQgdG8gYmUgaGlkZGVuIHRvb1xyXG4gICAgICAgICAgICAvL3Ntb290aEJveEJsb2NrLm9wZW4oZm9ybS5maW5kKCcubm8tcGhvdG9zJyksIGVkaXRQYW5lbCwgJycsIHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgZm9ybS5maW5kKG5vblVwbG9hZGVyRWxlbWVudHNTZWxlY3RvcikuaGlkZSgpO1xyXG4gICAgICAgICAgICBlZGl0b3IudXBsb2FkZXIuc2V0QXNNYWluKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9ybS5maW5kKG5vblVwbG9hZGVyRWxlbWVudHNTZWxlY3Rvcikuc2hvdygpO1xyXG4gICAgICAgICAgICBlZGl0b3IudXBsb2FkZXIuc2V0QXNTZWNvbmRhcnkoKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihmb3JtLmZpbmQoJy5uby1wcmltYXJ5LXBob3RvJyksIGVkaXRQYW5lbCwgJycsIHsgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gTm8gaW1hZ2U6XHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsIGRlZmF1bHRJbWdTcmMpO1xyXG4gICAgICAgIC8vIFJlc2V0IGhpZGRlbiBmaWVsZHMgbWFudWFsbHkgdG8gYXZvaWQgYnJvd3NlciBtZW1vcnkgYnJlYWtpbmcgdGhpbmdzXHJcbiAgICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPVBob3RvSURdJykudmFsKCcnKTtcclxuICAgICAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9cGhvdG8tY2FwdGlvbl0nKS52YWwoJycpO1xyXG4gICAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qIFNldHVwIHRoZSBjb2RlIHRoYXQgd29ya3Mgb24gdGhlIGRpZmZlcmVudCBDUlVETCBhY3Rpb25zIG9uIHRoZSBwaG90b3MuXHJcbiAgQWxsIHRoaXMgYXJlIGRlbGVnYXRlcywgb25seSBuZWVkIHRvIGJlIHNldHVwIG9uY2Ugb24gdGhlIHBhZ2VcclxuICAoaWYgdGhlIGNvbnRhaW5lciAkYyBpcyBub3QgcmVwbGFjZWQsIG9ubHkgdGhlIGNvbnRlbnRzLCBkb2Vzbid0IG5lZWQgdG8gY2FsbCBhZ2FpbiB0aGlzKS5cclxuKi9cclxuZnVuY3Rpb24gc2V0dXBDcnVkbERlbGVnYXRlcygkYykge1xyXG4gICAgJGNcclxuICAgIC5vbignY2hhbmdlJywgJy5wb3NpdGlvbnBob3Rvcy1lZGl0IGlucHV0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIEluc3RhbnQgc2F2aW5nIG9uIHVzZXIgY2hhbmdlcyB0byB0aGUgZWRpdGluZyBmb3JtXHJcbiAgICAgICAgdmFyICRmID0gJCh0aGlzKS5jbG9zZXN0KCcucG9zaXRpb25waG90b3MtZWRpdCcpO1xyXG4gICAgICAgIHNhdmVFZGl0ZWRQaG90bygkZik7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtdG9vbHMtdXBsb2FkID4gYScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcG9zSUQgPSAkKHRoaXMpLmNsb3Nlc3QoJ2Zvcm0nKS5maW5kKCdpbnB1dFtuYW1lPXBvc2l0aW9uSURdJykudmFsKCk7XHJcbiAgICAgICAgcG9wdXAoTGNVcmwuTGFuZ1BhdGggKyAnZGFzaGJvYXJkL1lvdXJXb3JrL1VwbG9hZFBob3RvLz9Qb3NpdGlvbklEPScgKyBwb3NJRCwgeyB3aWR0aDogNzAwLCBoZWlnaHQ6IDY3MCB9LCBudWxsLCBudWxsLCB7IGF1dG9Gb2N1czogZmFsc2UgfSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSlcclxuICAgIC5vbignY2xpY2snLCAnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgbGkgYScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICAgIHZhciBmb3JtID0gJHQuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpO1xyXG4gICAgICAgIC8vIERvbid0IGxvc3QgbGF0ZXN0IGNoYW5nZXM6XHJcbiAgICAgICAgc2F2ZUVkaXRlZFBob3RvKGZvcm0pO1xyXG5cclxuICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZUFsbChmb3JtKTtcclxuICAgICAgICAvLyBTZXQgdGhpcyBwaG90byBhcyBzZWxlY3RlZFxyXG4gICAgICAgIHZhciBzZWxlY3RlZCA9ICR0LmNsb3Nlc3QoJ2xpJyk7XHJcbiAgICAgICAgZWRpdFNlbGVjdGVkUGhvdG8oZm9ybSwgc2VsZWN0ZWQpO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcuRGFzaGJvYXJkUGhvdG9zLWVkaXRQaG90by1kZWxldGUnLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciBlZGl0UGFuZWwgPSAkKHRoaXMpLmNsb3Nlc3QoJy5wb3NpdGlvbnBob3Rvcy1lZGl0Jyk7XHJcbiAgICAgICAgdmFyIGZvcm0gPSBlZGl0UGFuZWwuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpO1xyXG5cclxuICAgICAgICB2YXIgcGhvdG9JRCA9IGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbCgpO1xyXG4gICAgICAgIHZhciAkcGhvdG9JdGVtID0gZm9ybS5maW5kKCcjVXNlclBob3RvLScgKyBwaG90b0lEKTtcclxuXHJcbiAgICAgICAgLy8gSW5zdGFudCBzYXZpbmdcclxuICAgICAgICBzYXZlKHtcclxuICAgICAgICAgICAgUGhvdG9JRDogcGhvdG9JRCxcclxuICAgICAgICAgICAgJ2RlbGV0ZS1waG90byc6ICdUcnVlJyxcclxuICAgICAgICAgICAgcmVzdWx0OiAnanNvbidcclxuICAgICAgICB9KVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgLy8gUmVtb3ZlIGl0ZW1cclxuICAgICAgICAgICAgJHBob3RvSXRlbS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIGVkaXRTZWxlY3RlZFBob3RvKGZvcm0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyogSW5pdGlhbGl6ZSB0aGUgcGhvdG9zIGVsZW1lbnRzIHRvIGJlIHNvcnRhYmxlcywgc2V0IHRoZSBwcmltYXJ5IHBob3RvXHJcbiAgaW4gdGhlIGhpZ2hsaWdodGVkIGFyZSBhbmQgaW5pdGlhbGl6ZSB0aGUgJ2RlbGV0ZSBwaG90bycgZmxhZy5cclxuICBUaGlzIGlzIHJlcXVpcmVkIHRvIGJlIGV4ZWN1dGVkIGFueSB0aW1lIHRoZSBlbGVtZW50cyBodG1sIGlzIHJlcGxhY2VkXHJcbiAgYmVjYXVzZSBuZWVkcyBkaXJlY3QgYWNjZXNzIHRvIHRoZSBET00gZWxlbWVudHMuXHJcbiovXHJcbmZ1bmN0aW9uIGluaXRFbGVtZW50cyhmb3JtKSB7XHJcblxyXG4gICAgZGVmYXVsdEltZ1NyYyA9IGZvcm0uZmluZCgnaW1nJykuYXR0cignc3JjJyk7XHJcblxyXG4gICAgdmFyIHNvcnRhYmxlID0gbmV3IFNvcnRhYmxlKHsgY29udGFpbmVyOiBmb3JtIH0pO1xyXG5cclxuICAgIC8vIEVkaXRvciBzZXR1cFxyXG4gICAgdmFyICRjZWRpdG9yID0gJCgnLkRhc2hib2FyZFBob3Rvcy1lZGl0UGhvdG8nLCBmb3JtKSxcclxuICAgICAgICBwb3NpdGlvbklkID0gcGFyc2VJbnQoZm9ybS5jbG9zZXN0KCdmb3JtJykuZmluZCgnW25hbWU9cG9zaXRpb25JRF0nKS52YWwoKSkgfHwgMDtcclxuICAgIGVkaXRvciA9IG5ldyBFZGl0b3Ioe1xyXG4gICAgICAgIGNvbnRhaW5lcjogJGNlZGl0b3IsXHJcbiAgICAgICAgcG9zaXRpb25JZDogcG9zaXRpb25JZCxcclxuICAgICAgICBzaXplTGltaXQ6ICRjZWRpdG9yLmRhdGEoJ3NpemUtbGltaXQnKSxcclxuICAgICAgICBnYWxsZXJ5OiBuZXcgR2FsbGVyeSh7IGNvbnRhaW5lcjogZm9ybSB9KSxcclxuICAgICAgICB1cGxvYWRlcjogbmV3IFVwbG9hZGVyKHsgY29udGFpbmVyOiAkKCcuRmlsZVVwbG9hZGVyJywgZm9ybSksIHBvc2l0aW9uSWQ6IHBvc2l0aW9uSWQgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNldCBwcmltYXJ5IHBob3RvIHRvIGJlIGVkaXRlZFxyXG4gICAgZWRpdFNlbGVjdGVkUGhvdG8oZm9ybSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gICAgU29ydGFibGUgQ29tcG9uZW50IENsYXNzXHJcbioqL1xyXG5mdW5jdGlvbiBTb3J0YWJsZShzZXR0aW5ncykge1xyXG5cclxuICAgIHNldHRpbmdzID0gc2V0dGluZ3MgfHwge307XHJcbiAgICB0aGlzLiRjb250YWluZXIgPSAkKHNldHRpbmdzLmNvbnRhaW5lciB8fCAnYm9keScpO1xyXG5cclxuICAgIC8vIFByZXBhcmUgc29ydGFibGUgc2NyaXB0XHJcbiAgICB0aGlzLnNvcnRhYmxlID0gJChcIi5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2xcIiwgdGhpcy4kY29udGFpbmVyKS5zb3J0YWJsZSh7XHJcbiAgICAgICAgcGxhY2Vob2xkZXI6IFwidWktc3RhdGUtaGlnaGxpZ2h0XCIsXHJcbiAgICAgICAgdXBkYXRlOiB0aGlzLm9uVXBkYXRlXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqIENvbnRleHQgJ3RoaXMnIGlzIHRoZSBqcXVlcnkuc29ydGFibGUgb24gdGhpcyBldmVudCBoYW5kbGVyXHJcbioqL1xyXG5Tb3J0YWJsZS5wcm90b3R5cGUub25VcGRhdGUgPSBmdW5jdGlvbiBvblVwZGF0ZSgpIHtcclxuICAgIC8vIEdldCBwaG90byBvcmRlciwgYSBjb21tYSBzZXBhcmF0ZWQgdmFsdWUgb2YgaXRlbXMgSURzXHJcbiAgICB2YXIgb3JkZXIgPSAkKHRoaXMpLnNvcnRhYmxlKFwidG9BcnJheVwiKS50b1N0cmluZygpO1xyXG4gICAgLy8gU2V0IG9yZGVyIGluIHRoZSBmb3JtIGVsZW1lbnQsIHRvIGJlIHNlbnQgbGF0ZXIgd2l0aCB0aGUgZm9ybVxyXG4gICAgJCh0aGlzKS5jbG9zZXN0KHNlY3Rpb25TZWxlY3RvcilcclxuICAgICAgICAuZmluZCgnW25hbWU9Z2FsbGVyeS1vcmRlcl0nKVxyXG4gICAgICAgIC52YWwob3JkZXIpXHJcbiAgICAvLyBXaXRoIGluc3RhbnQgc2F2aW5nLCBubyBtb3JlIG5vdGlmeSBjaGFuZ2UgZm9yIENoYW5nZXNOb3RpZmllciwgc28gY29tbWVudGluZzpcclxuICAgIC8vLmNoYW5nZSgpXHJcbiAgICAgICAgO1xyXG5cclxuICAgIC8vIEluc3RhbnQgc2F2aW5nXHJcbiAgICBzYXZlKHtcclxuICAgICAgICAnZ2FsbGVyeS1vcmRlcic6IG9yZGVyLFxyXG4gICAgICAgIGFjdGlvbjogJ29yZGVyJyxcclxuICAgICAgICByZXN1bHQ6ICdqc29uJ1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICAgIEdhbGxlcnkgQ2xhc3NcclxuKiovXHJcbmZ1bmN0aW9uIEdhbGxlcnkoc2V0dGluZ3MpIHtcclxuXHJcbiAgICBzZXR0aW5ncyA9IHNldHRpbmdzIHx8IHt9O1xyXG5cclxuICAgIHRoaXMuJGNvbnRhaW5lciA9ICQoc2V0dGluZ3MuY29udGFpbmVyIHx8ICcuRGFzaGJvYXJkUGhvdG9zJyk7XHJcbiAgICB0aGlzLiRnYWxsZXJ5ID0gJCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnknLCB0aGlzLiRjb250YWluZXIpO1xyXG4gICAgdGhpcy4kZ2FsbGVyeUxpc3QgPSAkKCdvbCcsIHRoaXMuJGdhbGxlcnkpO1xyXG4gICAgdGhpcy50cGxJbWcgPSAnPGxpIGlkPVwiVXNlclBob3RvLUBAMFwiPjxhIGhyZWY9XCIjXCI+PGltZyBhbHQ9XCJVcGxvYWRlZCBwaG90b1wiIHNyYz1cIkBAMVwiLz48L2E+PGEgY2xhc3M9XCJlZGl0XCIgaHJlZj1cIiNcIj5FZGl0PC9hPjwvbGk+JztcclxuXHJcbiAgICAvKipcclxuICAgICAgIEFwcGVuZCBhIHBob3RvIGVsZW1lbnQgdG8gdGhlIGdhbGxlcnkgY29sbGVjdGlvbi5cclxuICAgICoqL1xyXG4gICAgdGhpcy5hcHBlbmRQaG90byA9IGZ1bmN0aW9uIGFwcGVuZFBob3RvKGZpbGVOYW1lLCBwaG90b0lEKSB7XHJcblxyXG4gICAgICAgIHZhciBuZXdJbWcgPSAkKHRoaXMudHBsSW1nLnJlcGxhY2UoL0BAMC9nLCBwaG90b0lEKS5yZXBsYWNlKC9AQDEvZywgZmlsZU5hbWUpKTtcclxuICAgICAgICAvLyBJZiBpcyB0aGVyZSBpcyBubyBwaG90b3Mgc3RpbGwsIHRoZSBmaXJzdCB3aWxsIGJlIHRoZSBwcmltYXJ5IGJ5IGRlZmF1bHRcclxuICAgICAgICBpZiAodGhpcy4kZ2FsbGVyeUxpc3QuY2hpbGRyZW4oKS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgbmV3SW1nLmFkZENsYXNzKCdpcy1wcmltYXJ5LXBob3RvJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLiRnYWxsZXJ5TGlzdFxyXG4gICAgICAgIC5hcHBlbmQobmV3SW1nKVxyXG4gICAgICAgIC8vIHNjcm9sbCB0aGUgZ2FsbGVyeSB0byBzZWUgdGhlIG5ldyBlbGVtZW50OyB1c2luZyAnLTInIHRvIGF2b2lkIHNvbWUgYnJvd3NlcnMgYXV0b21hdGljIHNjcm9sbC5cclxuICAgICAgICAuYW5pbWF0ZSh7IHNjcm9sbFRvcDogdGhpcy4kZ2FsbGVyeUxpc3RbMF0uc2Nyb2xsSGVpZ2h0IC0gdGhpcy4kZ2FsbGVyeUxpc3QuaGVpZ2h0KCkgLSAyIH0sIDE0MDApXHJcbiAgICAgICAgLmZpbmQoJ2xpOmxhc3QtY2hpbGQnKVxyXG4gICAgICAgIC5lZmZlY3QoXCJoaWdobGlnaHRcIiwge30sIDE2MDApO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3SW1nO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnJlbG9hZFBob3RvID0gZnVuY3Rpb24gcmVsb2FkUGhvdG8oZmlsZVVSSSwgcGhvdG9JRCkge1xyXG5cclxuICAgICAgICAvLyBGaW5kIGl0ZW0gYnkgSUQgYW5kIGxvYWQgd2l0aCBuZXcgVVJJXHJcbiAgICAgICAgdGhpcy4kZ2FsbGVyeUxpc3QuZmluZCgnI1VzZXJQaG90by0nICsgcGhvdG9JRClcclxuICAgICAgICAuZmluZCgnaW1nJylcclxuICAgICAgICAuYXR0cignc3JjJywgZmlsZVVSSSArICc/dj0nICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKSk7XHJcbiAgICB9O1xyXG59XHJcblxyXG4vKipcclxuICAgIFVwbG9hZGVyIENsYXNzXHJcbioqL1xyXG5mdW5jdGlvbiBVcGxvYWRlcihzZXR0aW5ncykge1xyXG5cclxuICAgIHNldHRpbmdzID0gc2V0dGluZ3MgfHwge307XHJcblxyXG4gICAgLy8gZi5lLjogLkZpbGVVcGxvYWRlclxyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJChzZXR0aW5ncy5jb250YWluZXIgfHwgJ2h0bWwnKTtcclxuICAgIHRoaXMuZ2FsbGVyeSA9IHNldHRpbmdzLmdhbGxlcnkgfHwgbmV3IEdhbGxlcnkodGhpcy4kY29udGFpbmVyKTtcclxuICAgIHRoaXMucG9zaXRpb25JZCA9IHNldHRpbmdzLnBvc2l0aW9uSWQgfHwgMDtcclxuICAgIHRoaXMuY29tcG9uZW50Q2xhc3MgPSBzZXR0aW5ncy5jb21wb25lbnRDbGFzcyB8fCAnRmlsZVVwbG9hZGVyJztcclxuICAgIHRoaXMuc2Vjb25kYXJ5Q2xhc3MgPSBzZXR0aW5ncy5zZWNvbmRhcnlDbGFzcyB8fCAnRmlsZVVwbG9hZGVyLS1hc1NlY29uZGFyeSc7XHJcblxyXG4gICAgdmFyIHRoaXNVcGxvYWRlciA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy5xcXVwbG9hZGVyID0gbmV3IHFxLkZpbGVVcGxvYWRlcih7XHJcbiAgICAgICAgZWxlbWVudDogJCgnLkZpbGVVcGxvYWRlci11cGxvYWRlcicsIHRoaXMuJGNvbnRhaW5lcikuZ2V0KDApLFxyXG4gICAgICAgIC8vIHBhdGggdG8gc2VydmVyLXNpZGUgdXBsb2FkIHNjcmlwdFxyXG4gICAgICAgIGFjdGlvbjogTGNVcmwuTGFuZ1BhdGggKyAnZGFzaGJvYXJkL1lvdXJXb3JrL1VwbG9hZFBob3RvLz9Qb3NpdGlvbklEPScgKyAodGhpcy5wb3NpdGlvbklkKSxcclxuICAgICAgICBhbGxvd2VkRXh0ZW5zaW9uczogWydqcGcnLCAnanBlZycsICdwbmcnLCAnZ2lmJ10sXHJcbiAgICAgICAgb25Db21wbGV0ZTogZnVuY3Rpb24gKGlkLCBmaWxlTmFtZSwgcmVzcG9uc2VKU09OKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZUpTT04uc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld0ltZ0l0ZW0gPSB0aGlzVXBsb2FkZXIuZ2FsbGVyeS5hcHBlbmRQaG90byhyZXNwb25zZUpTT04uZmlsZVVSSSwgcmVzcG9uc2VKU09OLnBob3RvSUQpO1xyXG4gICAgICAgICAgICAgICAgLy8gU2hvdyBpbiBlZGl0IHBhbmVsXHJcbiAgICAgICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5jbG9zZUFsbCh0aGlzVXBsb2FkZXIuZ2FsbGVyeS4kY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgIGVkaXRTZWxlY3RlZFBob3RvKHRoaXNVcGxvYWRlci5nYWxsZXJ5LiRjb250YWluZXIsIG5ld0ltZ0l0ZW0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBtZXNzYWdlczoge1xyXG4gICAgICAgICAgICB0eXBlRXJyb3I6IFwie2ZpbGV9IGhhcyBpbnZhbGlkIGV4dGVuc2lvbi4gT25seSB7ZXh0ZW5zaW9uc30gYXJlIGFsbG93ZWQuXCIsXHJcbiAgICAgICAgICAgIHNpemVFcnJvcjogXCJ7ZmlsZX0gaXMgdG9vIGxhcmdlLCBtYXhpbXVtIGZpbGUgc2l6ZSBpcyB7c2l6ZUxpbWl0fS5cIixcclxuICAgICAgICAgICAgbWluU2l6ZUVycm9yOiBcIntmaWxlfSBpcyB0b28gc21hbGwsIG1pbmltdW0gZmlsZSBzaXplIGlzIHttaW5TaXplTGltaXR9LlwiLFxyXG4gICAgICAgICAgICBlbXB0eUVycm9yOiBcIntmaWxlfSBpcyBlbXB0eSwgcGxlYXNlIHNlbGVjdCBmaWxlcyBhZ2FpbiB3aXRob3V0IGl0LlwiLFxyXG4gICAgICAgICAgICBvbkxlYXZlOiBcIlRoZSBmaWxlcyBhcmUgYmVpbmcgdXBsb2FkZWQsIGlmIHlvdSBsZWF2ZSBub3cgdGhlIHVwbG9hZCB3aWxsIGJlIGNhbmNlbGxlZC5cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2l6ZUxpbWl0OiB0aGlzLnNpemVMaW1pdCB8fCAndW5kZWZpbmVkJyxcclxuICAgICAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJxcS11cGxvYWRlclwiPicgK1xyXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJxcS11cGxvYWQtZHJvcC1hcmVhXCI+PHNwYW4+RHJvcCBhIGZpbGUgaGVyZSB0byB1cGxvYWQ8L3NwYW4+PC9kaXY+JyArXHJcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInFxLXVwbG9hZC1idXR0b25cIj5VcGxvYWQgYSBwaG90bzwvZGl2PicgK1xyXG4gICAgICAgICAgICAgICAgJzx1bCBjbGFzcz1cInFxLXVwbG9hZC1saXN0XCI+PC91bD4nICtcclxuICAgICAgICAgICAgICAgICc8L2Rpdj4nXHJcbiAgICB9KTtcclxufVxyXG5cclxuVXBsb2FkZXIucHJvdG90eXBlLnNldEFzTWFpbiA9IGZ1bmN0aW9uIHNldEFzTWFpbigpIHtcclxuICAgIHRoaXMuJGNvbnRhaW5lci5yZW1vdmVDbGFzcyh0aGlzLnNlY29uZGFyeUNsYXNzKTtcclxufTtcclxuXHJcblVwbG9hZGVyLnByb3RvdHlwZS5zZXRBc1NlY29uZGFyeSA9IGZ1bmN0aW9uIHNldEFzU2Vjb25kYXJ5KCkge1xyXG4gICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKHRoaXMuc2Vjb25kYXJ5Q2xhc3MpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBFZGl0b3IgQ2xhc3NcclxuKiovXHJcbnZhciBxcSA9IHJlcXVpcmUoJ2ZpbGV1cGxvYWRlcicpO1xyXG5yZXF1aXJlKCdqY3JvcCcpO1xyXG5mdW5jdGlvbiBFZGl0b3Ioc2V0dGluZ3MpIHtcclxuXHJcbiAgICBzZXR0aW5ncyA9IHNldHRpbmdzIHx8IHt9O1xyXG5cclxuICAgIHZhciAkaCA9ICQoJ2h0bWwnKTtcclxuICAgIHRoaXMucG9zaXRpb25JZCA9IHNldHRpbmdzLnBvc2l0aW9uSWQgfHwgJGguZGF0YSgncG9zaXRpb24taWQnKTtcclxuICAgIHRoaXMuc2l6ZUxpbWl0ID0gc2V0dGluZ3Muc2l6ZUxpbWl0IHx8ICRoLmRhdGEoJ3NpemUtbGltaXQnKTtcclxuXHJcbiAgICAvLyBmLmUuOiAuRGFzaGJvYXJkUGhvdG9zLWVkaXRQaG90b1xyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJChzZXR0aW5ncy5jb250YWluZXIgfHwgJ2h0bWwnKTtcclxuICAgIHRoaXMuZ2FsbGVyeSA9IHNldHRpbmdzLmdhbGxlcnkgfHwgbmV3IEdhbGxlcnkoeyBjb250YWluZXI6IHRoaXMuJGNvbnRhaW5lciB9KTtcclxuICAgIHRoaXMudXBsb2FkZXIgPSBzZXR0aW5ncy51cGxvYWRlciB8fCBuZXcgVXBsb2FkZXIoeyBjb250YWluZTogdGhpcy4kY29udGFpbmVyLCBwb3NpdGlvbklkOiB0aGlzLnBvc2l0aW9uSWQgfSk7XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6aW5nOlxyXG4gICAgdGhpcy5pbml0Q3JvcEZvcm0oKTtcclxufVxyXG5cclxuLy8gU2ltcGxlIGV2ZW50IGhhbmRsZXIsIGNhbGxlZCBmcm9tIG9uQ2hhbmdlIGFuZCBvblNlbGVjdFxyXG4vLyBldmVudCBoYW5kbGVycywgYXMgcGVyIHRoZSBKY3JvcCBpbnZvY2F0aW9uIGFib3ZlXHJcbkVkaXRvci5wcm90b3R5cGUuc2hvd0Nvb3JkcyA9IGZ1bmN0aW9uIHNob3dDb29yZHMoYykge1xyXG4gICAgJCgnW25hbWU9Y3JvcC14MV0nLCB0aGlzLiRjb250YWluZXIpLnZhbChjLngpO1xyXG4gICAgJCgnW25hbWU9Y3JvcC15MV0nLCB0aGlzLiRjb250YWluZXIpLnZhbChjLnkpO1xyXG4gICAgJCgnW25hbWU9Y3JvcC14Ml0nLCB0aGlzLiRjb250YWluZXIpLnZhbChjLngyKTtcclxuICAgICQoJ1tuYW1lPWNyb3AteTJdJywgdGhpcy4kY29udGFpbmVyKS52YWwoYy55Mik7XHJcbiAgICAkKCdbbmFtZT1jcm9wLXddJywgdGhpcy4kY29udGFpbmVyKS52YWwoYy53KTtcclxuICAgICQoJ1tuYW1lPWNyb3AtaF0nLCB0aGlzLiRjb250YWluZXIpLnZhbChjLmgpO1xyXG59O1xyXG5cclxuRWRpdG9yLnByb3RvdHlwZS5jbGVhckNvb3JkcyA9IGZ1bmN0aW9uIGNsZWFyQ29vcmRzKCkge1xyXG4gICAgJCgnaW5wdXRbbmFtZT1eY3JvcC1dJywgdGhpcy4kY29udGFpbmVyKS52YWwoJycpO1xyXG59O1xyXG5cclxuRWRpdG9yLnByb3RvdHlwZS5pbml0Q3JvcEZvcm0gPSBmdW5jdGlvbiBpbml0Q3JvcEZvcm0oKSB7XHJcblxyXG4gICAgLy8gU2V0dXAgY3JvcHBpbmcgXCJmb3JtXCJcclxuICAgIHZhciB0aGlzRWRpdG9yID0gdGhpcztcclxuXHJcbiAgICB0aGlzLiRjb250YWluZXIub24oJ2NsaWNrJywgJy5EYXNoYm9hcmRQaG90b3MtZWRpdFBob3RvLXNhdmUnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgdXJsOiBMY1VybC5MYW5nUGF0aCArICckZGFzaGJvYXJkL1lvdXJXb3JrL1VwbG9hZFBob3RvLycsXHJcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICAgICAgZGF0YTogdGhpc0VkaXRvci4kY29udGFpbmVyLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZSgpICsgJyZjcm9wLXBob3RvPVRydWUnLFxyXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSwgdGV4dCwgangpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLkNvZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY2IuZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRhdGEudXBkYXRlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBob3RvIGNyb3BwZWQsIHJlc2l6ZWRcclxuICAgICAgICAgICAgICAgICAgICB0aGlzRWRpdG9yLmdhbGxlcnkucmVsb2FkUGhvdG8oZGF0YS5maWxlVVJJLCBkYXRhLnBob3RvSUQpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlZnJlc2ggZWRpdCBwYW5lbFxyXG4gICAgICAgICAgICAgICAgICAgIGVkaXRTZWxlY3RlZFBob3RvKHRoaXNFZGl0b3IuZ2FsbGVyeS4kY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFBob3RvIHVwbG9hZGVkXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0ltZ0l0ZW0gPSB0aGlzRWRpdG9yLmdhbGxlcnkuYXBwZW5kUGhvdG8oZGF0YS5maWxlVVJJLCBkYXRhLnBob3RvSUQpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3cgaW4gZWRpdCBwYW5lbFxyXG4gICAgICAgICAgICAgICAgICAgIHNtb290aEJveEJsb2NrLmNsb3NlQWxsKHRoaXNFZGl0b3IuZ2FsbGVyeS4kY29udGFpbmVyKTtcclxuICAgICAgICAgICAgICAgICAgICBlZGl0U2VsZWN0ZWRQaG90byh0aGlzRWRpdG9yLmdhbGxlcnkuJGNvbnRhaW5lciwgbmV3SW1nSXRlbSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkKCcjY3JvcC1waG90bycpLnNsaWRlVXAoJ2Zhc3QnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPIENsb3NlIHBvcHVwICM1MzVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIGVyKSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydCgnU29ycnksIHRoZXJlIHdhcyBhbiBlcnJvciBzZXR0aW5nLXVwIHlvdXIgcGhvdG8uICcgKyAoZXIgfHwgJycpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5FZGl0b3IucHJvdG90eXBlLnNldHVwQ3JvcFBob3RvID0gZnVuY3Rpb24gc2V0dXBDcm9wUGhvdG8oKSB7XHJcblxyXG4gICAgaWYgKHRoaXMuamNyb3BBcGkpXHJcbiAgICAgICAgdGhpcy5qY3JvcEFwaS5kZXN0cm95KCk7XHJcblxyXG4gICAgdmFyIHRoaXNFZGl0b3IgPSB0aGlzO1xyXG5cclxuICAgIC8vIFNldHVwIGltZyBjcm9wcGluZ1xyXG4gICAgdmFyICRpbWcgPSAkKCcucG9zaXRpb25waG90b3MtZWRpdC1waG90byA+IGltZycsIHRoaXMuJGNvbnRhaW5lcik7XHJcbiAgICAkaW1nLkpjcm9wKHtcclxuICAgICAgICBvbkNoYW5nZTogdGhpcy5zaG93Q29vcmRzLmJpbmQodGhpcyksXHJcbiAgICAgICAgb25TZWxlY3Q6IHRoaXMuc2hvd0Nvb3Jkcy5iaW5kKHRoaXMpLFxyXG4gICAgICAgIG9uUmVsZWFzZTogdGhpcy5jbGVhckNvb3Jkcy5iaW5kKHRoaXMpLFxyXG4gICAgICAgIGFzcGVjdFJhdGlvOiAkaW1nLmRhdGEoJ3RhcmdldC13aWR0aCcpIC8gJGltZy5kYXRhKCd0YXJnZXQtaGVpZ2h0JylcclxuICAgIH0sIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdGhpc0VkaXRvci5qY3JvcEFwaSA9IHRoaXM7XHJcbiAgICAgICAgLy8gSW5pdGlhbCBzZWxlY3Rpb24gdG8gc2hvdyB1c2VyIHRoYXQgY2FuIGNob29zZSBhbiBhcmVhXHJcbiAgICAgICAgdGhpc0VkaXRvci5qY3JvcEFwaS5zZXRTZWxlY3QoWzAsIDAsICRpbWcud2lkdGgoKSwgJGltZy5oZWlnaHQoKV0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuICRpbWc7XHJcbn07XHJcbiIsIi8qKiBBdmFpbGFiaWxpdHk6IFdlZWtseSBTY2hlZHVsZSBzZWN0aW9uIHNldHVwXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgYXZhaWxhYmlsaXR5Q2FsZW5kYXIgPSByZXF1aXJlKCdMQy9hdmFpbGFiaWxpdHlDYWxlbmRhcicpO1xyXG52YXIgYmF0Y2hFdmVudEhhbmRsZXIgPSByZXF1aXJlKCdMQy9iYXRjaEV2ZW50SGFuZGxlcicpO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgbW9udGhseUxpc3QgPSBhdmFpbGFiaWxpdHlDYWxlbmRhci5Nb250aGx5LmVuYWJsZUFsbCgpO1xyXG5cclxuICAgICQuZWFjaChtb250aGx5TGlzdCwgZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICB2YXIgbW9udGhseSA9IHRoaXM7XHJcblxyXG4gICAgICAgIC8vIFNldHVwaW5nIHRoZSBjYWxlbmRhciBkYXRhIGZpZWxkXHJcbiAgICAgICAgdmFyIGZvcm0gPSBtb250aGx5LiRlbC5jbG9zZXN0KCdmb3JtLmFqYXgsZmllbGRzZXQuYWpheCcpO1xyXG4gICAgICAgIHZhciBmaWVsZCA9IGZvcm0uZmluZCgnW25hbWU9bW9udGhseV0nKTtcclxuICAgICAgICBpZiAoZmllbGQubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBmaWVsZCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIm1vbnRobHlcIiAvPicpLmluc2VydEFmdGVyKG1vbnRobHkuJGVsKTtcclxuXHJcbiAgICAgICAgLy8gU2F2ZSB3aGVuIHRoZSBmb3JtIGlzIHRvIGJlIHN1Ym1pdHRlZFxyXG4gICAgICAgIGZvcm0ub24oJ3ByZXN1Ym1pdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZmllbGQudmFsKEpTT04uc3RyaW5naWZ5KG1vbnRobHkuZ2V0VXBkYXRlZERhdGEoKSkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBVcGRhdGluZyBmaWVsZCBvbiBjYWxlbmRhciBjaGFuZ2VzICh1c2luZyBiYXRjaCB0byBhdm9pZCBodXJ0IHBlcmZvcm1hbmNlKVxyXG4gICAgICAgIC8vIGFuZCByYWlzZSBjaGFuZ2UgZXZlbnQgKHRoaXMgZml4ZXMgdGhlIHN1cHBvcnQgZm9yIGNoYW5nZXNOb3RpZmljYXRpb25cclxuICAgICAgICAvLyBhbmQgaW5zdGFudC1zYXZpbmcpLlxyXG4gICAgICAgIG1vbnRobHkuZXZlbnRzLm9uKCdkYXRhQ2hhbmdlZCcsIGJhdGNoRXZlbnRIYW5kbGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgZmllbGRcclxuICAgICAgICAgICAgLnZhbChKU09OLnN0cmluZ2lmeShtb250aGx5LmdldFVwZGF0ZWREYXRhKCkpKVxyXG4gICAgICAgICAgICAuY2hhbmdlKCk7XHJcbiAgICAgICAgfSkpO1xyXG4gICAgfSk7XHJcbn07IiwiLyoqXHJcbnBheW1lbnQ6IHdpdGggdGhlIHByb3BlciBodG1sIGFuZCBmb3JtXHJcbnJlZ2VuZXJhdGVzIHRoZSBidXR0b24gc291cmNlLWNvZGUgYW5kIHByZXZpZXcgYXV0b21hdGljYWxseS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5mb3JtYXR0ZXInKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiBvblBheW1lbnRBY2NvdW50KGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gIHZhciBmaW5pdCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAvLyBJbml0aWFsaXplIHRoZSBmb3JtYXR0ZXJzIG9uIHBhZ2UtcmVhZHkuLlxyXG4gICAgaW5pdEZvcm1hdHRlcnMoJGMpO1xyXG5cclxuICAgIGNoYW5nZVBheW1lbnRNZXRob2QoJGMpO1xyXG5cclxuICB9O1xyXG4gICQoZmluaXQpO1xyXG4gIC8vIGFuZCBhbnkgYWpheC1wb3N0IG9mIHRoZSBmb3JtIHRoYXQgcmV0dXJucyBuZXcgaHRtbDpcclxuICAkYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZmluaXQpO1xyXG59O1xyXG5cclxuLyoqIEluaXRpYWxpemUgdGhlIGZpZWxkIGZvcm1hdHRlcnMgcmVxdWlyZWQgYnkgdGhlIHBheW1lbnQtYWNjb3VudC1mb3JtLCBiYXNlZFxyXG4gIG9uIHRoZSBmaWVsZHMgbmFtZXMuXHJcbioqL1xyXG5mdW5jdGlvbiBpbml0Rm9ybWF0dGVycygkY29udGFpbmVyKSB7XHJcbiAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImJpcnRoZGF0ZVwiXScpLmZvcm1hdHRlcih7XHJcbiAgICAncGF0dGVybic6ICd7ezk5fX0ve3s5OX19L3t7OTk5OX19JyxcclxuICAgICdwZXJzaXN0ZW50JzogZmFsc2VcclxuICB9KTtcclxuICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwic3NuXCJdJykuZm9ybWF0dGVyKHtcclxuICAgICdwYXR0ZXJuJzogJ3t7OTk5fX0te3s5OX19LXt7OTk5OX19JyxcclxuICAgICdwZXJzaXN0ZW50JzogZmFsc2VcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY2hhbmdlUGF5bWVudE1ldGhvZCgkY29udGFpbmVyKSB7XHJcblxyXG4gIHZhciAkYmFuayA9ICRjb250YWluZXIuZmluZCgnLkRhc2hib2FyZFBheW1lbnRBY2NvdW50LWJhbmsnKSxcclxuICAgICRlbHMgPSAkY29udGFpbmVyLmZpbmQoJy5EYXNoYm9hcmRQYXltZW50QWNjb3VudC1jaGFuZ2VNZXRob2QnKVxyXG4gICAgLmFkZCgkYmFuayk7XHJcblxyXG4gICRjb250YWluZXIuZmluZCgnLkFjdGlvbnMtLWNoYW5nZVBheW1lbnRNZXRob2QnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkZWxzLnRvZ2dsZUNsYXNzKCdpcy12ZW5tb0FjY291bnQgaXMtYmFua0FjY291bnQnKTtcclxuXHJcbiAgICBpZiAoJGJhbmsuaGFzQ2xhc3MoJ2lzLXZlbm1vQWNjb3VudCcpKSB7XHJcbiAgICAgIC8vIFJlbW92ZSBhbmQgc2F2ZSBudW1iZXJzXHJcbiAgICAgICRiYW5rLmZpbmQoJ2lucHV0JykudmFsKGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgJCh0aGlzKS5kYXRhKCdwcmV2LXZhbCcsIHYpO1xyXG4gICAgICAgIHJldHVybiAnJztcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBSZXN0b3JlIG51bWJlcnNcclxuICAgICAgJGJhbmsuZmluZCgnaW5wdXQnKS52YWwoZnVuY3Rpb24gKGksIHYpIHtcclxuICAgICAgICByZXR1cm4gJCh0aGlzKS5kYXRhKCdwcmV2LXZhbCcpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbn0iLCIvKiogUHJpY2luZyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBUaW1lU3BhbiA9IHJlcXVpcmUoJ0xDL1RpbWVTcGFuJyk7XHJcbnJlcXVpcmUoJ0xDL1RpbWVTcGFuRXh0cmEnKS5wbHVnSW4oVGltZVNwYW4pO1xyXG52YXIgdXBkYXRlVG9vbHRpcHMgPSByZXF1aXJlKCdMQy90b29sdGlwcycpLnVwZGF0ZVRvb2x0aXBzO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAocHJpY2luZ1NlbGVjdG9yKSB7XHJcbiAgcHJpY2luZ1NlbGVjdG9yID0gcHJpY2luZ1NlbGVjdG9yIHx8ICcuRGFzaGJvYXJkUHJpY2luZyc7XHJcbiAgdmFyICRwcmljaW5nID0gJChwcmljaW5nU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRwcmljaW5nLnNpYmxpbmdzKClcclxuICAgICAgLmFkZCgkcHJpY2luZy5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpXHJcbiAgICAgIC5hZGQoJHByaWNpbmcuY2xvc2VzdCgnLkRhc2hib2FyZFlvdXJXb3JrJykuc2libGluZ3MoKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChwcmljaW5nU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcblxyXG4gICAgc2V0dXBOb1ByaWNlUmF0ZVVwZGF0ZXMoJGVkaXRvcik7XHJcbiAgICBzZXR1cFByb3ZpZGVyUGFja2FnZVNsaWRlcnMoJGVkaXRvcik7XHJcbiAgICB1cGRhdGVUb29sdGlwcygpO1xyXG4gICAgc2V0dXBTaG93TW9yZUF0dHJpYnV0ZXNMaW5rKCRlZGl0b3IpO1xyXG5cclxuICB9KTtcclxufTtcclxuXHJcbi8qIEhhbmRsZXIgZm9yIGNoYW5nZSBldmVudCBvbiAnbm90IHRvIHN0YXRlIHByaWNlIHJhdGUnLCB1cGRhdGluZyByZWxhdGVkIHByaWNlIHJhdGUgZmllbGRzLlxyXG4gIEl0cyBzZXR1cGVkIHBlciBlZGl0b3IgaW5zdGFuY2UsIG5vdCBhcyBhbiBldmVudCBkZWxlZ2F0ZS5cclxuKi9cclxuZnVuY3Rpb24gc2V0dXBOb1ByaWNlUmF0ZVVwZGF0ZXMoJGVkaXRvcikge1xyXG4gIHZhciBcclxuICAgIHByID0gJGVkaXRvci5maW5kKCdbbmFtZT1wcmljZS1yYXRlXSxbbmFtZT1wcmljZS1yYXRlLXVuaXRdJyksXHJcbiAgICBucHIgPSAkZWRpdG9yLmZpbmQoJ1tuYW1lPW5vLXByaWNlLXJhdGVdJyk7XHJcbiAgbnByLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBwci5wcm9wKCdkaXNhYmxlZCcsIG5wci5wcm9wKCdjaGVja2VkJykpO1xyXG4gIH0pO1xyXG4gIC8vIEluaXRpYWwgc3RhdGU6XHJcbiAgbnByLmNoYW5nZSgpO1xyXG59XHJcblxyXG4vKiogU2V0dXAgdGhlIFVJIFNsaWRlcnMgb24gdGhlIGVkaXRvci5cclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwUHJvdmlkZXJQYWNrYWdlU2xpZGVycygkZWRpdG9yKSB7XHJcblxyXG4gIC8qIEhvdXNlZWtlZXBlciBwcmljaW5nICovXHJcbiAgZnVuY3Rpb24gdXBkYXRlQXZlcmFnZSgkYywgbWludXRlcykge1xyXG4gICAgJGMuZmluZCgnW25hbWU9cHJvdmlkZXItYXZlcmFnZS10aW1lXScpLnZhbChtaW51dGVzKTtcclxuICAgIG1pbnV0ZXMgPSBwYXJzZUludChtaW51dGVzKTtcclxuICAgICRjLmZpbmQoJy5wcmV2aWV3IC50aW1lJykudGV4dChUaW1lU3Bhbi5mcm9tTWludXRlcyhtaW51dGVzKS50b1NtYXJ0U3RyaW5nKCkpO1xyXG4gIH1cclxuXHJcbiAgJGVkaXRvci5maW5kKFwiLnByb3ZpZGVyLWF2ZXJhZ2UtdGltZS1zbGlkZXJcIikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJGMgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLXNsaWRlci12YWx1ZV0nKTtcclxuICAgIHZhciBhdmVyYWdlID0gJGMuZGF0YSgnc2xpZGVyLXZhbHVlJyksXHJcbiAgICAgIHN0ZXAgPSAkYy5kYXRhKCdzbGlkZXItc3RlcCcpIHx8IDE7XHJcbiAgICBpZiAoIWF2ZXJhZ2UpIHJldHVybjtcclxuICAgIHZhciBzZXR1cCA9IHtcclxuICAgICAgcmFuZ2U6IFwibWluXCIsXHJcbiAgICAgIHZhbHVlOiBhdmVyYWdlLFxyXG4gICAgICBtaW46IGF2ZXJhZ2UgLSAzICogc3RlcCxcclxuICAgICAgbWF4OiBhdmVyYWdlICsgMyAqIHN0ZXAsXHJcbiAgICAgIHN0ZXA6IHN0ZXAsXHJcbiAgICAgIHNsaWRlOiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcbiAgICAgICAgdXBkYXRlQXZlcmFnZSgkYywgdWkudmFsdWUpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgdmFyIHNsaWRlciA9ICQodGhpcykuc2xpZGVyKHNldHVwKTtcclxuXHJcbiAgICAkYy5maW5kKCcucHJvdmlkZXItYXZlcmFnZS10aW1lJykub24oJ2NsaWNrJywgJ2xhYmVsJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgICBpZiAoJHQuaGFzQ2xhc3MoJ2JlbG93LWF2ZXJhZ2UtbGFiZWwnKSlcclxuICAgICAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIHNldHVwLm1pbik7XHJcbiAgICAgIGVsc2UgaWYgKCR0Lmhhc0NsYXNzKCdhdmVyYWdlLWxhYmVsJykpXHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBzZXR1cC52YWx1ZSk7XHJcbiAgICAgIGVsc2UgaWYgKCR0Lmhhc0NsYXNzKCdhYm92ZS1hdmVyYWdlLWxhYmVsJykpXHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBzZXR1cC5tYXgpO1xyXG4gICAgICB1cGRhdGVBdmVyYWdlKCRjLCBzbGlkZXIuc2xpZGVyKCd2YWx1ZScpKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNldHVwIHRoZSBpbnB1dCBmaWVsZCwgaGlkZGVuIGFuZCB3aXRoIGluaXRpYWwgdmFsdWUgc3luY2hyb25pemVkIHdpdGggc2xpZGVyXHJcbiAgICB2YXIgZmllbGQgPSAkYy5maW5kKCdbbmFtZT1wcm92aWRlci1hdmVyYWdlLXRpbWVdJyk7XHJcbiAgICBmaWVsZC5oaWRlKCk7XHJcbiAgICB2YXIgY3VycmVudFZhbHVlID0gZmllbGQudmFsKCkgfHwgYXZlcmFnZTtcclxuICAgIHVwZGF0ZUF2ZXJhZ2UoJGMsIGN1cnJlbnRWYWx1ZSk7XHJcbiAgICBzbGlkZXIuc2xpZGVyKCd2YWx1ZScsIGN1cnJlbnRWYWx1ZSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKiBUaGUgaW4tZWRpdG9yIGxpbmsgI3Nob3ctbW9yZS1hdHRyaWJ1dGVzIG11c3Qgc2hvdy9oaWRlIHRoZSBjb250YWluZXIgb2ZcclxuICBleHRyYSBhdHRyaWJ1dGVzIGZvciB0aGUgcGFja2FnZS9wcmljaW5nLWl0ZW0uIFRoaXMgc2V0dXBzIHRoZSByZXF1aXJlZCBoYW5kbGVyLlxyXG4qKi9cclxuZnVuY3Rpb24gc2V0dXBTaG93TW9yZUF0dHJpYnV0ZXNMaW5rKCRlZGl0b3IpIHtcclxuICAvLyBIYW5kbGVyIGZvciAnc2hvdy1tb3JlLWF0dHJpYnV0ZXMnIGJ1dHRvbiAodXNlZCBvbmx5IG9uIGVkaXQgYSBwYWNrYWdlKVxyXG4gICRlZGl0b3IuZmluZCgnLnNob3ctbW9yZS1hdHRyaWJ1dGVzJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBhdHRzID0gJHQuc2libGluZ3MoJy5zZXJ2aWNlcy1ub3QtY2hlY2tlZCcpO1xyXG4gICAgaWYgKGF0dHMuaXMoJzp2aXNpYmxlJykpIHtcclxuICAgICAgJHQudGV4dCgkdC5kYXRhKCdzaG93LXRleHQnKSk7XHJcbiAgICAgIGF0dHMuc3RvcCgpLmhpZGUoJ2Zhc3QnKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICR0LnRleHQoJHQuZGF0YSgnaGlkZS10ZXh0JykpO1xyXG4gICAgICBhdHRzLnN0b3AoKS5zaG93KCdmYXN0Jyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbn0iLCIvKipcclxuICBwcml2YWN5U2V0dGluZ3M6IFNldHVwIGZvciB0aGUgc3BlY2lmaWMgcGFnZS1mb3JtIGRhc2hib2FyZC9wcml2YWN5L3ByaXZhY3lzZXR0aW5nc1xyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuLy8gVE9ETyBJbXBsZW1lbnQgZGVwZW5kZW5jaWVzIGNvbW1pbmcgZnJvbSBhcHAuanMgaW5zdGVhZCBvZiBkaXJlY3QgbGlua1xyXG4vL3ZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJ3Ntb290aEJveEJsb2NrJyk7XHJcbi8vIFRPRE8gUmVwbGFjZSBkb20tcmVzc291cmNlcyBieSBpMThuLmdldFRleHRcclxuXHJcbnZhciBwcml2YWN5ID0ge1xyXG4gIGFjY291bnRMaW5rc1NlbGVjdG9yOiAnLkRhc2hib2FyZFByaXZhY3lTZXR0aW5ncy1teUFjY291bnQgYScsXHJcbiAgcmVzc291cmNlc1NlbGVjdG9yOiAnLkRhc2hib2FyZFByaXZhY3ktYWNjb3VudFJlc3NvdXJjZXMnXHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHByaXZhY3k7XHJcblxyXG5wcml2YWN5Lm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gICRjLm9uKCdjbGljaycsICcuY2FuY2VsLWFjdGlvbicsIGZ1bmN0aW9uICgpIHtcclxuICAgIHNtb290aEJveEJsb2NrLmNsb3NlKCRjKTtcclxuICB9KTtcclxuXHJcbiAgJGMub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCAnLmFqYXgtYm94JywgZnVuY3Rpb24gKCkge1xyXG4gICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gIH0pO1xyXG4gIFxyXG4gICRjLm9uKCdjbGljaycsIHByaXZhY3kuYWNjb3VudExpbmtzU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICB2YXIgYixcclxuICAgICAgbHJlcyA9ICRjLmZpbmQocHJpdmFjeS5yZXNzb3VyY2VzU2VsZWN0b3IpO1xyXG5cclxuICAgIHN3aXRjaCAoJCh0aGlzKS5hdHRyKCdocmVmJykpIHtcclxuICAgICAgY2FzZSAnI2RlbGV0ZS1teS1hY2NvdW50JzpcclxuICAgICAgICBiID0gc21vb3RoQm94QmxvY2sub3BlbihscmVzLmNoaWxkcmVuKCcuZGVsZXRlLW1lc3NhZ2UtY29uZmlybScpLmNsb25lKCksICRjKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnI2RlYWN0aXZhdGUtbXktYWNjb3VudCc6XHJcbiAgICAgICAgYiA9IHNtb290aEJveEJsb2NrLm9wZW4obHJlcy5jaGlsZHJlbignLmRlYWN0aXZhdGUtbWVzc2FnZS1jb25maXJtJykuY2xvbmUoKSwgJGMpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICcjcmVhY3RpdmF0ZS1teS1hY2NvdW50JzpcclxuICAgICAgICBiID0gc21vb3RoQm94QmxvY2sub3BlbihscmVzLmNoaWxkcmVuKCcucmVhY3RpdmF0ZS1tZXNzYWdlLWNvbmZpcm0nKS5jbG9uZSgpLCAkYyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBpZiAoYikge1xyXG4gICAgICAkKCdodG1sLGJvZHknKS5zdG9wKHRydWUsIHRydWUpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IGIub2Zmc2V0KCkudG9wIH0sIDUwMCwgbnVsbCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG59OyIsIi8qKiBTZXJ2aWNlIEF0dHJpYnV0ZXMgVmFsaWRhdGlvbjogaW1wbGVtZW50cyB2YWxpZGF0aW9ucyB0aHJvdWdoIHRoZSBcclxuICAnY3VzdG9tVmFsaWRhdGlvbicgYXBwcm9hY2ggZm9yICdwb3NpdGlvbiBzZXJ2aWNlIGF0dHJpYnV0ZXMnLlxyXG4gIEl0IHZhbGlkYXRlcyB0aGUgcmVxdWlyZWQgYXR0cmlidXRlIGNhdGVnb3J5LCBhbG1vc3Qtb25lIG9yIHNlbGVjdC1vbmUgbW9kZXMuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgZ2V0VGV4dCA9IHJlcXVpcmUoJ0xDL2dldFRleHQnKTtcclxudmFyIHZoID0gcmVxdWlyZSgnTEMvdmFsaWRhdGlvbkhlbHBlcicpO1xyXG52YXIgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJ0xDL2pxdWVyeVV0aWxzJykuZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTtcclxuXHJcbi8qKiBFbmFibGUgdmFsaWRhdGlvbiBvZiByZXF1aXJlZCBzZXJ2aWNlIGF0dHJpYnV0ZXMgb25cclxuICB0aGUgZm9ybShzKSBzcGVjaWZpZWQgYnkgdGhlIHNlbGVjdG9yIG9yIHByb3ZpZGVkXHJcbioqL1xyXG5leHBvcnRzLnNldHVwID0gZnVuY3Rpb24gc2V0dXBTZXJ2aWNlQXR0cmlidXRlc1ZhbGlkYXRpb24oY29udGFpbmVyU2VsZWN0b3IsIG9wdGlvbnMpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgcmVxdWlyZWRTZWxlY3RvcjogJy5EYXNoYm9hcmRTZXJ2aWNlcy1hdHRyaWJ1dGVzLWNhdGVnb3J5LmlzLXJlcXVpcmVkJyxcclxuICAgIHNlbGVjdE9uZUNsYXNzOiAnanMtdmFsaWRhdGlvblNlbGVjdE9uZScsXHJcbiAgICBncm91cEVycm9yQ2xhc3M6ICdpcy1lcnJvcicsXHJcbiAgICB2YWxFcnJvclRleHRLZXk6ICdyZXF1aXJlZC1hdHRyaWJ1dGUtY2F0ZWdvcnktZXJyb3InXHJcbiAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICRjLmVhY2goZnVuY3Rpb24gdmFsaWRhdGVTZXJ2aWNlQXR0cmlidXRlcygpIHtcclxuICAgIHZhciBmID0gJCh0aGlzKTtcclxuICAgIGlmICghZi5pcygnZm9ybSxmaWVsZHNldCcpKSB7XHJcbiAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ1RoZSBlbGVtZW50IHRvIGFwcGx5IHZhbGlkYXRpb24gbXVzdCBiZSBhIGZvcm0gb3IgZmllbGRzZXQnKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGYuZGF0YSgnY3VzdG9tVmFsaWRhdGlvbicsIHtcclxuICAgICAgdmFsaWRhdGU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgdmFsaWQgPSB0cnVlLCBsYXN0VmFsaWQgPSB0cnVlO1xyXG4gICAgICAgIHZhciB2ID0gdmguZmluZFZhbGlkYXRpb25TdW1tYXJ5KGYpO1xyXG5cclxuICAgICAgICBmLmZpbmQob3B0aW9ucy5yZXF1aXJlZFNlbGVjdG9yKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHZhciBmcyA9ICQodGhpcyk7XHJcbiAgICAgICAgICB2YXIgY2F0ID0gZnMuY2hpbGRyZW4oJ2xlZ2VuZCcpLnRleHQoKTtcclxuICAgICAgICAgIC8vIFdoYXQgdHlwZSBvZiB2YWxpZGF0aW9uIGFwcGx5P1xyXG4gICAgICAgICAgaWYgKGZzLmlzKCcuJyArIG9wdGlvbnMuc2VsZWN0T25lQ2xhc3MpKVxyXG4gICAgICAgICAgLy8gaWYgdGhlIGNhdCBpcyBhICd2YWxpZGF0aW9uLXNlbGVjdC1vbmUnLCBhICdzZWxlY3QnIGVsZW1lbnQgd2l0aCBhICdwb3NpdGl2ZSdcclxuICAgICAgICAgIC8vIDpzZWxlY3RlZCB2YWx1ZSBtdXN0IGJlIGNoZWNrZWRcclxuICAgICAgICAgICAgbGFzdFZhbGlkID0gISEoZnMuZmluZCgnb3B0aW9uOnNlbGVjdGVkJykudmFsKCkpO1xyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgLy8gT3RoZXJ3aXNlLCBsb29rIGZvciAnYWxtb3N0IG9uZScgY2hlY2tlZCB2YWx1ZXM6XHJcbiAgICAgICAgICAgIGxhc3RWYWxpZCA9IChmcy5maW5kKCdpbnB1dDpjaGVja2VkJykubGVuZ3RoID4gMCk7XHJcblxyXG4gICAgICAgICAgaWYgKCFsYXN0VmFsaWQpIHtcclxuICAgICAgICAgICAgdmFsaWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgZnMuYWRkQ2xhc3Mob3B0aW9ucy5ncm91cEVycm9yQ2xhc3MpO1xyXG4gICAgICAgICAgICB2YXIgZXJyID0gZ2V0VGV4dChvcHRpb25zLnZhbEVycm9yVGV4dEtleSwgY2F0KTtcclxuICAgICAgICAgICAgaWYgKHYuZmluZCgnbGlbdGl0bGU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShjYXQpICsgJ1wiXScpLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgICB2LmNoaWxkcmVuKCd1bCcpLmFwcGVuZCgkKCc8bGkvPicpLnRleHQoZXJyKS5hdHRyKCd0aXRsZScsIGNhdCkpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZnMucmVtb3ZlQ2xhc3Mob3B0aW9ucy5ncm91cEVycm9yQ2xhc3MpO1xyXG4gICAgICAgICAgICB2LmZpbmQoJ2xpW3RpdGxlPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoY2F0KSArICdcIl0nKS5yZW1vdmUoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHZhbGlkKSB7XHJcbiAgICAgICAgICB2aC5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzVmFsaWQoZik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZoLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihmKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbGlkO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKiBJdCBwcm92aWRlcyB0aGUgY29kZSBmb3IgdGhlIGFjdGlvbnMgb2YgdGhlIFZlcmlmaWNhdGlvbnMgc2VjdGlvbi5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbi8vdmFyIExjVXJsID0gcmVxdWlyZSgnLi4vTEMvTGNVcmwnKTtcclxuLy92YXIgcG9wdXAgPSByZXF1aXJlKCcuLi9MQy9wb3B1cCcpO1xyXG5cclxudmFyIGFjdGlvbnMgPSBleHBvcnRzLmFjdGlvbnMgPSB7fTtcclxuXHJcbmFjdGlvbnMuZmFjZWJvb2sgPSBmdW5jdGlvbiAoKSB7XHJcbiAgLyogRmFjZWJvb2sgY29ubmVjdCAqL1xyXG4gIHZhciBGYWNlYm9va0Nvbm5lY3QgPSByZXF1aXJlKCdMQy9GYWNlYm9va0Nvbm5lY3QnKTtcclxuICB2YXIgZmIgPSBuZXcgRmFjZWJvb2tDb25uZWN0KHtcclxuICAgIHJlc3VsdFR5cGU6ICdqc29uJyxcclxuICAgIHVybFNlY3Rpb246ICdWZXJpZnknLFxyXG4gICAgYXBwSWQ6ICQoJ2h0bWwnKS5kYXRhKCdmYi1hcHBpZCcpLFxyXG4gICAgcGVybWlzc2lvbnM6ICdlbWFpbCx1c2VyX2Fib3V0X21lJyxcclxuICAgIGxvYWRpbmdUZXh0OiAnVmVyaWZpbmcnXHJcbiAgfSk7XHJcbiAgJChkb2N1bWVudCkub24oZmIuY29ubmVjdGVkRXZlbnQsIGZ1bmN0aW9uICgpIHtcclxuICAgICQoZG9jdW1lbnQpLm9uKCdwb3B1cC1jbG9zZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbiAgZmIuY29ubmVjdCgpO1xyXG59O1xyXG5cclxuYWN0aW9ucy5lbWFpbCA9IGZ1bmN0aW9uICgpIHtcclxuICBwb3B1cChMY1VybC5MYW5nUGF0aCArICdBY2NvdW50LyRSZXNlbmRDb25maXJtYXRpb25FbWFpbC9ub3cvJywgcG9wdXAuc2l6ZSgnc21hbGwnKSk7XHJcbn07XHJcblxyXG52YXIgbGlua3MgPSBleHBvcnRzLmxpbmtzID0ge1xyXG4gICcjY29ubmVjdC13aXRoLWZhY2Vib29rJzogYWN0aW9ucy5mYWNlYm9vayxcclxuICAnI2NvbmZpcm0tZW1haWwnOiBhY3Rpb25zLmVtYWlsXHJcbn07XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcblxyXG4gICRjLm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gR2V0IHRoZSBhY3Rpb24gbGluayBvciBlbXB0eVxyXG4gICAgdmFyIGxpbmsgPSB0aGlzLmdldEF0dHJpYnV0ZSgnaHJlZicpIHx8ICcnO1xyXG5cclxuICAgIC8vIEV4ZWN1dGUgdGhlIGFjdGlvbiBhdHRhY2hlZCB0byB0aGF0IGxpbmtcclxuICAgIHZhciBhY3Rpb24gPSBsaW5rc1tsaW5rXSB8fCBudWxsO1xyXG4gICAgaWYgKHR5cGVvZiAoYWN0aW9uKSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICBhY3Rpb24oKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogVmVyaWZpY2F0aW9ucyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG4vLyBUT0RPOiBSZXBsYWNlIGJ5IHJlYWwgcmVxdWlyZSBhbmQgbm90IGdsb2JhbCBMQzpcclxuLy92YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcbi8vdmFyIGNydWRsID0gcmVxdWlyZSgnLi4vTEMvY3J1ZGwnKS5zZXR1cChhamF4Rm9ybXMub25TdWNjZXNzLCBhamF4Rm9ybXMub25FcnJvciwgYWpheEZvcm1zLm9uQ29tcGxldGUpO1xyXG4vL0xDLmluaXRDcnVkbCA9IGNydWRsLm9uO1xyXG52YXIgaW5pdENydWRsID0gTEMuaW5pdENydWRsO1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgc2VjdGlvblNlbGVjdG9yID0gJy5EYXNoYm9hcmRWZXJpZmljYXRpb25zJyxcclxuICAgICRzZWN0aW9uID0gJGMuZmluZChzZWN0aW9uU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRzZWN0aW9uLnNpYmxpbmdzKClcclxuICAgICAgLmFkZCgkc2VjdGlvbi5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpXHJcbiAgICAgIC5hZGQoJHNlY3Rpb24uY2xvc2VzdCgnLkRhc2hib2FyZEFib3V0WW91Jykuc2libGluZ3MoKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChzZWN0aW9uU2VsZWN0b3IpO1xyXG5cclxuICBjcnVkbC5lbGVtZW50c1xyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtc3RhcnRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueGhpZGUoeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXJlYWR5J10sIGZ1bmN0aW9uIChlLCAkZWRpdG9yKSB7XHJcbiAgICByZXF1aXJlKCcuL2JhY2tncm91bmRDaGVja1JlcXVlc3QnKS5zZXR1cEZvcm0oJGVkaXRvci5maW5kKCcuRGFzaGJvYXJkQmFja2dyb3VuZENoZWNrJykpO1xyXG4gIH0pO1xyXG59O1xyXG4iLCIvKiogQXZhaWxhYmlsaXR5OiBXZWVrbHkgU2NoZWR1bGUgc2VjdGlvbiBzZXR1cFxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyID0gcmVxdWlyZSgnTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXInKTtcclxudmFyIGJhdGNoRXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnTEMvYmF0Y2hFdmVudEhhbmRsZXInKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIHdvcmtIb3Vyc0xpc3QgPSBhdmFpbGFiaWxpdHlDYWxlbmRhci5Xb3JrSG91cnMuZW5hYmxlQWxsKCk7XHJcblxyXG4gICAgJC5lYWNoKHdvcmtIb3Vyc0xpc3QsIGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgdmFyIHdvcmtob3VycyA9IHRoaXM7XHJcblxyXG4gICAgICAgIC8vIFNldHVwaW5nIHRoZSBXb3JrSG91cnMgY2FsZW5kYXIgZGF0YSBmaWVsZFxyXG4gICAgICAgIHZhciBmb3JtID0gd29ya2hvdXJzLiRlbC5jbG9zZXN0KCdmb3JtLmFqYXgsIGZpZWxkc2V0LmFqYXgnKTtcclxuICAgICAgICB2YXIgZmllbGQgPSBmb3JtLmZpbmQoJ1tuYW1lPXdvcmtob3Vyc10nKTtcclxuICAgICAgICBpZiAoZmllbGQubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICBmaWVsZCA9ICQoJzxpbnB1dCB0eXBlPVwiaGlkZGVuXCIgbmFtZT1cIndvcmtob3Vyc1wiIC8+JykuaW5zZXJ0QWZ0ZXIod29ya2hvdXJzLiRlbCk7XHJcblxyXG4gICAgICAgIC8vIFNhdmUgd2hlbiB0aGUgZm9ybSBpcyB0byBiZSBzdWJtaXR0ZWRcclxuICAgICAgICBmb3JtLm9uKCdwcmVzdWJtaXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZpZWxkLnZhbChKU09OLnN0cmluZ2lmeSh3b3JraG91cnMuZGF0YSkpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBVcGRhdGluZyBmaWVsZCBvbiBjYWxlbmRhciBjaGFuZ2VzICh1c2luZyBiYXRjaCB0byBhdm9pZCBodXJ0IHBlcmZvcm1hbmNlKVxyXG4gICAgICAgIC8vIGFuZCByYWlzZSBjaGFuZ2UgZXZlbnQgKHRoaXMgZml4ZXMgdGhlIHN1cHBvcnQgZm9yIGNoYW5nZXNOb3RpZmljYXRpb25cclxuICAgICAgICAvLyBhbmQgaW5zdGFudC1zYXZpbmcpLlxyXG4gICAgICAgIHdvcmtob3Vycy5ldmVudHMub24oJ2RhdGFDaGFuZ2VkJywgYmF0Y2hFdmVudEhhbmRsZXIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICAgICAgZmllbGRcclxuICAgICAgICAgICAgLnZhbChKU09OLnN0cmluZ2lmeSh3b3JraG91cnMuZGF0YSkpXHJcbiAgICAgICAgICAgIC5jaGFuZ2UoKTtcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIC8vIERpc2FibGluZyBjYWxlbmRhciBvbiBmaWVsZCBhbGx0aW1lXHJcbiAgICAgICAgZm9ybS5maW5kKCdbbmFtZT1hbGx0aW1lXScpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdCA9ICQodGhpcyksXHJcbiAgICAgICAgY2wgPSB3b3JraG91cnMuY2xhc3Nlcy5kaXNhYmxlZDtcclxuICAgICAgICAgICAgaWYgKGNsKVxyXG4gICAgICAgICAgICAgICAgd29ya2hvdXJzLiRlbC50b2dnbGVDbGFzcyhjbCwgJHQucHJvcCgnY2hlY2tlZCcpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9KTtcclxufTtcclxuIiwiLyohXG4gKiBpbWFnZXNMb2FkZWQgdjMuMS44XG4gKiBKYXZhU2NyaXB0IGlzIGFsbCBsaWtlIFwiWW91IGltYWdlcyBhcmUgZG9uZSB5ZXQgb3Igd2hhdD9cIlxuICogTUlUIExpY2Vuc2VcbiAqL1xuXG4oIGZ1bmN0aW9uKCB3aW5kb3csIGZhY3RvcnkgKSB7ICd1c2Ugc3RyaWN0JztcbiAgLy8gdW5pdmVyc2FsIG1vZHVsZSBkZWZpbml0aW9uXG5cbiAgLypnbG9iYWwgZGVmaW5lOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSwgcmVxdWlyZTogZmFsc2UgKi9cblxuICBpZiAoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcbiAgICAvLyBBTURcbiAgICBkZWZpbmUoIFtcbiAgICAgICdldmVudEVtaXR0ZXIvRXZlbnRFbWl0dGVyJyxcbiAgICAgICdldmVudGllL2V2ZW50aWUnXG4gICAgXSwgZnVuY3Rpb24oIEV2ZW50RW1pdHRlciwgZXZlbnRpZSApIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KCB3aW5kb3csIEV2ZW50RW1pdHRlciwgZXZlbnRpZSApO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKCB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgKSB7XG4gICAgLy8gQ29tbW9uSlNcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoXG4gICAgICB3aW5kb3csXG4gICAgICByZXF1aXJlKCd3b2xmeTg3LWV2ZW50ZW1pdHRlcicpLFxuICAgICAgcmVxdWlyZSgnZXZlbnRpZScpXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBicm93c2VyIGdsb2JhbFxuICAgIHdpbmRvdy5pbWFnZXNMb2FkZWQgPSBmYWN0b3J5KFxuICAgICAgd2luZG93LFxuICAgICAgd2luZG93LkV2ZW50RW1pdHRlcixcbiAgICAgIHdpbmRvdy5ldmVudGllXG4gICAgKTtcbiAgfVxuXG59KSggd2luZG93LFxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAgZmFjdG9yeSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAvL1xuXG5mdW5jdGlvbiBmYWN0b3J5KCB3aW5kb3csIEV2ZW50RW1pdHRlciwgZXZlbnRpZSApIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgJCA9IHdpbmRvdy5qUXVlcnk7XG52YXIgY29uc29sZSA9IHdpbmRvdy5jb25zb2xlO1xudmFyIGhhc0NvbnNvbGUgPSB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIGhlbHBlcnMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuLy8gZXh0ZW5kIG9iamVjdHNcbmZ1bmN0aW9uIGV4dGVuZCggYSwgYiApIHtcbiAgZm9yICggdmFyIHByb3AgaW4gYiApIHtcbiAgICBhWyBwcm9wIF0gPSBiWyBwcm9wIF07XG4gIH1cbiAgcmV0dXJuIGE7XG59XG5cbnZhciBvYmpUb1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5mdW5jdGlvbiBpc0FycmF5KCBvYmogKSB7XG4gIHJldHVybiBvYmpUb1N0cmluZy5jYWxsKCBvYmogKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn1cblxuLy8gdHVybiBlbGVtZW50IG9yIG5vZGVMaXN0IGludG8gYW4gYXJyYXlcbmZ1bmN0aW9uIG1ha2VBcnJheSggb2JqICkge1xuICB2YXIgYXJ5ID0gW107XG4gIGlmICggaXNBcnJheSggb2JqICkgKSB7XG4gICAgLy8gdXNlIG9iamVjdCBpZiBhbHJlYWR5IGFuIGFycmF5XG4gICAgYXJ5ID0gb2JqO1xuICB9IGVsc2UgaWYgKCB0eXBlb2Ygb2JqLmxlbmd0aCA9PT0gJ251bWJlcicgKSB7XG4gICAgLy8gY29udmVydCBub2RlTGlzdCB0byBhcnJheVxuICAgIGZvciAoIHZhciBpPTAsIGxlbiA9IG9iai5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgIGFyeS5wdXNoKCBvYmpbaV0gKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gYXJyYXkgb2Ygc2luZ2xlIGluZGV4XG4gICAgYXJ5LnB1c2goIG9iaiApO1xuICB9XG4gIHJldHVybiBhcnk7XG59XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gaW1hZ2VzTG9hZGVkIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXksIEVsZW1lbnQsIE5vZGVMaXN0LCBTdHJpbmd9IGVsZW1cbiAgICogQHBhcmFtIHtPYmplY3Qgb3IgRnVuY3Rpb259IG9wdGlvbnMgLSBpZiBmdW5jdGlvbiwgdXNlIGFzIGNhbGxiYWNrXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IG9uQWx3YXlzIC0gY2FsbGJhY2sgZnVuY3Rpb25cbiAgICovXG4gIGZ1bmN0aW9uIEltYWdlc0xvYWRlZCggZWxlbSwgb3B0aW9ucywgb25BbHdheXMgKSB7XG4gICAgLy8gY29lcmNlIEltYWdlc0xvYWRlZCgpIHdpdGhvdXQgbmV3LCB0byBiZSBuZXcgSW1hZ2VzTG9hZGVkKClcbiAgICBpZiAoICEoIHRoaXMgaW5zdGFuY2VvZiBJbWFnZXNMb2FkZWQgKSApIHtcbiAgICAgIHJldHVybiBuZXcgSW1hZ2VzTG9hZGVkKCBlbGVtLCBvcHRpb25zICk7XG4gICAgfVxuICAgIC8vIHVzZSBlbGVtIGFzIHNlbGVjdG9yIHN0cmluZ1xuICAgIGlmICggdHlwZW9mIGVsZW0gPT09ICdzdHJpbmcnICkge1xuICAgICAgZWxlbSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIGVsZW0gKTtcbiAgICB9XG5cbiAgICB0aGlzLmVsZW1lbnRzID0gbWFrZUFycmF5KCBlbGVtICk7XG4gICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKCB7fSwgdGhpcy5vcHRpb25zICk7XG5cbiAgICBpZiAoIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nICkge1xuICAgICAgb25BbHdheXMgPSBvcHRpb25zO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHRlbmQoIHRoaXMub3B0aW9ucywgb3B0aW9ucyApO1xuICAgIH1cblxuICAgIGlmICggb25BbHdheXMgKSB7XG4gICAgICB0aGlzLm9uKCAnYWx3YXlzJywgb25BbHdheXMgKTtcbiAgICB9XG5cbiAgICB0aGlzLmdldEltYWdlcygpO1xuXG4gICAgaWYgKCAkICkge1xuICAgICAgLy8gYWRkIGpRdWVyeSBEZWZlcnJlZCBvYmplY3RcbiAgICAgIHRoaXMuanFEZWZlcnJlZCA9IG5ldyAkLkRlZmVycmVkKCk7XG4gICAgfVxuXG4gICAgLy8gSEFDSyBjaGVjayBhc3luYyB0byBhbGxvdyB0aW1lIHRvIGJpbmQgbGlzdGVuZXJzXG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICBzZXRUaW1lb3V0KCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLmNoZWNrKCk7XG4gICAgfSk7XG4gIH1cblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUub3B0aW9ucyA9IHt9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuZ2V0SW1hZ2VzID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pbWFnZXMgPSBbXTtcblxuICAgIC8vIGZpbHRlciAmIGZpbmQgaXRlbXMgaWYgd2UgaGF2ZSBhbiBpdGVtIHNlbGVjdG9yXG4gICAgZm9yICggdmFyIGk9MCwgbGVuID0gdGhpcy5lbGVtZW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcbiAgICAgIHZhciBlbGVtID0gdGhpcy5lbGVtZW50c1tpXTtcbiAgICAgIC8vIGZpbHRlciBzaWJsaW5nc1xuICAgICAgaWYgKCBlbGVtLm5vZGVOYW1lID09PSAnSU1HJyApIHtcbiAgICAgICAgdGhpcy5hZGRJbWFnZSggZWxlbSApO1xuICAgICAgfVxuICAgICAgLy8gZmluZCBjaGlsZHJlblxuICAgICAgLy8gbm8gbm9uLWVsZW1lbnQgbm9kZXMsICMxNDNcbiAgICAgIHZhciBub2RlVHlwZSA9IGVsZW0ubm9kZVR5cGU7XG4gICAgICBpZiAoICFub2RlVHlwZSB8fCAhKCBub2RlVHlwZSA9PT0gMSB8fCBub2RlVHlwZSA9PT0gOSB8fCBub2RlVHlwZSA9PT0gMTEgKSApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB2YXIgY2hpbGRFbGVtcyA9IGVsZW0ucXVlcnlTZWxlY3RvckFsbCgnaW1nJyk7XG4gICAgICAvLyBjb25jYXQgY2hpbGRFbGVtcyB0byBmaWx0ZXJGb3VuZCBhcnJheVxuICAgICAgZm9yICggdmFyIGo9MCwgakxlbiA9IGNoaWxkRWxlbXMubGVuZ3RoOyBqIDwgakxlbjsgaisrICkge1xuICAgICAgICB2YXIgaW1nID0gY2hpbGRFbGVtc1tqXTtcbiAgICAgICAgdGhpcy5hZGRJbWFnZSggaW1nICk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0ltYWdlfSBpbWdcbiAgICovXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUuYWRkSW1hZ2UgPSBmdW5jdGlvbiggaW1nICkge1xuICAgIHZhciBsb2FkaW5nSW1hZ2UgPSBuZXcgTG9hZGluZ0ltYWdlKCBpbWcgKTtcbiAgICB0aGlzLmltYWdlcy5wdXNoKCBsb2FkaW5nSW1hZ2UgKTtcbiAgfTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgY2hlY2tlZENvdW50ID0gMDtcbiAgICB2YXIgbGVuZ3RoID0gdGhpcy5pbWFnZXMubGVuZ3RoO1xuICAgIHRoaXMuaGFzQW55QnJva2VuID0gZmFsc2U7XG4gICAgLy8gY29tcGxldGUgaWYgbm8gaW1hZ2VzXG4gICAgaWYgKCAhbGVuZ3RoICkge1xuICAgICAgdGhpcy5jb21wbGV0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uQ29uZmlybSggaW1hZ2UsIG1lc3NhZ2UgKSB7XG4gICAgICBpZiAoIF90aGlzLm9wdGlvbnMuZGVidWcgJiYgaGFzQ29uc29sZSApIHtcbiAgICAgICAgY29uc29sZS5sb2coICdjb25maXJtJywgaW1hZ2UsIG1lc3NhZ2UgKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMucHJvZ3Jlc3MoIGltYWdlICk7XG4gICAgICBjaGVja2VkQ291bnQrKztcbiAgICAgIGlmICggY2hlY2tlZENvdW50ID09PSBsZW5ndGggKSB7XG4gICAgICAgIF90aGlzLmNvbXBsZXRlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTsgLy8gYmluZCBvbmNlXG4gICAgfVxuXG4gICAgZm9yICggdmFyIGk9MDsgaSA8IGxlbmd0aDsgaSsrICkge1xuICAgICAgdmFyIGxvYWRpbmdJbWFnZSA9IHRoaXMuaW1hZ2VzW2ldO1xuICAgICAgbG9hZGluZ0ltYWdlLm9uKCAnY29uZmlybScsIG9uQ29uZmlybSApO1xuICAgICAgbG9hZGluZ0ltYWdlLmNoZWNrKCk7XG4gICAgfVxuICB9O1xuXG4gIEltYWdlc0xvYWRlZC5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiggaW1hZ2UgKSB7XG4gICAgdGhpcy5oYXNBbnlCcm9rZW4gPSB0aGlzLmhhc0FueUJyb2tlbiB8fCAhaW1hZ2UuaXNMb2FkZWQ7XG4gICAgLy8gSEFDSyAtIENocm9tZSB0cmlnZ2VycyBldmVudCBiZWZvcmUgb2JqZWN0IHByb3BlcnRpZXMgaGF2ZSBjaGFuZ2VkLiAjODNcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuZW1pdCggJ3Byb2dyZXNzJywgX3RoaXMsIGltYWdlICk7XG4gICAgICBpZiAoIF90aGlzLmpxRGVmZXJyZWQgJiYgX3RoaXMuanFEZWZlcnJlZC5ub3RpZnkgKSB7XG4gICAgICAgIF90aGlzLmpxRGVmZXJyZWQubm90aWZ5KCBfdGhpcywgaW1hZ2UgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICBJbWFnZXNMb2FkZWQucHJvdG90eXBlLmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGV2ZW50TmFtZSA9IHRoaXMuaGFzQW55QnJva2VuID8gJ2ZhaWwnIDogJ2RvbmUnO1xuICAgIHRoaXMuaXNDb21wbGV0ZSA9IHRydWU7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAvLyBIQUNLIC0gYW5vdGhlciBzZXRUaW1lb3V0IHNvIHRoYXQgY29uZmlybSBoYXBwZW5zIGFmdGVyIHByb2dyZXNzXG4gICAgc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICBfdGhpcy5lbWl0KCBldmVudE5hbWUsIF90aGlzICk7XG4gICAgICBfdGhpcy5lbWl0KCAnYWx3YXlzJywgX3RoaXMgKTtcbiAgICAgIGlmICggX3RoaXMuanFEZWZlcnJlZCApIHtcbiAgICAgICAgdmFyIGpxTWV0aG9kID0gX3RoaXMuaGFzQW55QnJva2VuID8gJ3JlamVjdCcgOiAncmVzb2x2ZSc7XG4gICAgICAgIF90aGlzLmpxRGVmZXJyZWRbIGpxTWV0aG9kIF0oIF90aGlzICk7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0ganF1ZXJ5IC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgaWYgKCAkICkge1xuICAgICQuZm4uaW1hZ2VzTG9hZGVkID0gZnVuY3Rpb24oIG9wdGlvbnMsIGNhbGxiYWNrICkge1xuICAgICAgdmFyIGluc3RhbmNlID0gbmV3IEltYWdlc0xvYWRlZCggdGhpcywgb3B0aW9ucywgY2FsbGJhY2sgKTtcbiAgICAgIHJldHVybiBpbnN0YW5jZS5qcURlZmVycmVkLnByb21pc2UoICQodGhpcykgKTtcbiAgICB9O1xuICB9XG5cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICBmdW5jdGlvbiBMb2FkaW5nSW1hZ2UoIGltZyApIHtcbiAgICB0aGlzLmltZyA9IGltZztcbiAgfVxuXG4gIExvYWRpbmdJbWFnZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgTG9hZGluZ0ltYWdlLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGZpcnN0IGNoZWNrIGNhY2hlZCBhbnkgcHJldmlvdXMgaW1hZ2VzIHRoYXQgaGF2ZSBzYW1lIHNyY1xuICAgIHZhciByZXNvdXJjZSA9IGNhY2hlWyB0aGlzLmltZy5zcmMgXSB8fCBuZXcgUmVzb3VyY2UoIHRoaXMuaW1nLnNyYyApO1xuICAgIGlmICggcmVzb3VyY2UuaXNDb25maXJtZWQgKSB7XG4gICAgICB0aGlzLmNvbmZpcm0oIHJlc291cmNlLmlzTG9hZGVkLCAnY2FjaGVkIHdhcyBjb25maXJtZWQnICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSWYgY29tcGxldGUgaXMgdHJ1ZSBhbmQgYnJvd3NlciBzdXBwb3J0cyBuYXR1cmFsIHNpemVzLFxuICAgIC8vIHRyeSB0byBjaGVjayBmb3IgaW1hZ2Ugc3RhdHVzIG1hbnVhbGx5LlxuICAgIGlmICggdGhpcy5pbWcuY29tcGxldGUgJiYgdGhpcy5pbWcubmF0dXJhbFdpZHRoICE9PSB1bmRlZmluZWQgKSB7XG4gICAgICAvLyByZXBvcnQgYmFzZWQgb24gbmF0dXJhbFdpZHRoXG4gICAgICB0aGlzLmNvbmZpcm0oIHRoaXMuaW1nLm5hdHVyYWxXaWR0aCAhPT0gMCwgJ25hdHVyYWxXaWR0aCcgKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJZiBub25lIG9mIHRoZSBjaGVja3MgYWJvdmUgbWF0Y2hlZCwgc2ltdWxhdGUgbG9hZGluZyBvbiBkZXRhY2hlZCBlbGVtZW50LlxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgcmVzb3VyY2Uub24oICdjb25maXJtJywgZnVuY3Rpb24oIHJlc3JjLCBtZXNzYWdlICkge1xuICAgICAgX3RoaXMuY29uZmlybSggcmVzcmMuaXNMb2FkZWQsIG1lc3NhZ2UgKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgcmVzb3VyY2UuY2hlY2soKTtcbiAgfTtcblxuICBMb2FkaW5nSW1hZ2UucHJvdG90eXBlLmNvbmZpcm0gPSBmdW5jdGlvbiggaXNMb2FkZWQsIG1lc3NhZ2UgKSB7XG4gICAgdGhpcy5pc0xvYWRlZCA9IGlzTG9hZGVkO1xuICAgIHRoaXMuZW1pdCggJ2NvbmZpcm0nLCB0aGlzLCBtZXNzYWdlICk7XG4gIH07XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUmVzb3VyY2UgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gLy9cblxuICAvLyBSZXNvdXJjZSBjaGVja3MgZWFjaCBzcmMsIG9ubHkgb25jZVxuICAvLyBzZXBhcmF0ZSBjbGFzcyBmcm9tIExvYWRpbmdJbWFnZSB0byBwcmV2ZW50IG1lbW9yeSBsZWFrcy4gU2VlICMxMTVcblxuICB2YXIgY2FjaGUgPSB7fTtcblxuICBmdW5jdGlvbiBSZXNvdXJjZSggc3JjICkge1xuICAgIHRoaXMuc3JjID0gc3JjO1xuICAgIC8vIGFkZCB0byBjYWNoZVxuICAgIGNhY2hlWyBzcmMgXSA9IHRoaXM7XG4gIH1cblxuICBSZXNvdXJjZS5wcm90b3R5cGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG5cbiAgUmVzb3VyY2UucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gb25seSB0cmlnZ2VyIGNoZWNraW5nIG9uY2VcbiAgICBpZiAoIHRoaXMuaXNDaGVja2VkICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBzaW11bGF0ZSBsb2FkaW5nIG9uIGRldGFjaGVkIGVsZW1lbnRcbiAgICB2YXIgcHJveHlJbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIGV2ZW50aWUuYmluZCggcHJveHlJbWFnZSwgJ2xvYWQnLCB0aGlzICk7XG4gICAgZXZlbnRpZS5iaW5kKCBwcm94eUltYWdlLCAnZXJyb3InLCB0aGlzICk7XG4gICAgcHJveHlJbWFnZS5zcmMgPSB0aGlzLnNyYztcbiAgICAvLyBzZXQgZmxhZ1xuICAgIHRoaXMuaXNDaGVja2VkID0gdHJ1ZTtcbiAgfTtcblxuICAvLyAtLS0tLSBldmVudHMgLS0tLS0gLy9cblxuICAvLyB0cmlnZ2VyIHNwZWNpZmllZCBoYW5kbGVyIGZvciBldmVudCB0eXBlXG4gIFJlc291cmNlLnByb3RvdHlwZS5oYW5kbGVFdmVudCA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgICB2YXIgbWV0aG9kID0gJ29uJyArIGV2ZW50LnR5cGU7XG4gICAgaWYgKCB0aGlzWyBtZXRob2QgXSApIHtcbiAgICAgIHRoaXNbIG1ldGhvZCBdKCBldmVudCApO1xuICAgIH1cbiAgfTtcblxuICBSZXNvdXJjZS5wcm90b3R5cGUub25sb2FkID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAgIHRoaXMuY29uZmlybSggdHJ1ZSwgJ29ubG9hZCcgKTtcbiAgICB0aGlzLnVuYmluZFByb3h5RXZlbnRzKCBldmVudCApO1xuICB9O1xuXG4gIFJlc291cmNlLnByb3RvdHlwZS5vbmVycm9yID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuICAgIHRoaXMuY29uZmlybSggZmFsc2UsICdvbmVycm9yJyApO1xuICAgIHRoaXMudW5iaW5kUHJveHlFdmVudHMoIGV2ZW50ICk7XG4gIH07XG5cbiAgLy8gLS0tLS0gY29uZmlybSAtLS0tLSAvL1xuXG4gIFJlc291cmNlLnByb3RvdHlwZS5jb25maXJtID0gZnVuY3Rpb24oIGlzTG9hZGVkLCBtZXNzYWdlICkge1xuICAgIHRoaXMuaXNDb25maXJtZWQgPSB0cnVlO1xuICAgIHRoaXMuaXNMb2FkZWQgPSBpc0xvYWRlZDtcbiAgICB0aGlzLmVtaXQoICdjb25maXJtJywgdGhpcywgbWVzc2FnZSApO1xuICB9O1xuXG4gIFJlc291cmNlLnByb3RvdHlwZS51bmJpbmRQcm94eUV2ZW50cyA9IGZ1bmN0aW9uKCBldmVudCApIHtcbiAgICBldmVudGllLnVuYmluZCggZXZlbnQudGFyZ2V0LCAnbG9hZCcsIHRoaXMgKTtcbiAgICBldmVudGllLnVuYmluZCggZXZlbnQudGFyZ2V0LCAnZXJyb3InLCB0aGlzICk7XG4gIH07XG5cbiAgLy8gLS0tLS0gIC0tLS0tIC8vXG5cbiAgcmV0dXJuIEltYWdlc0xvYWRlZDtcblxufSk7XG4iLCIvKiFcbiAqIGV2ZW50aWUgdjEuMC41XG4gKiBldmVudCBiaW5kaW5nIGhlbHBlclxuICogICBldmVudGllLmJpbmQoIGVsZW0sICdjbGljaycsIG15Rm4gKVxuICogICBldmVudGllLnVuYmluZCggZWxlbSwgJ2NsaWNrJywgbXlGbiApXG4gKiBNSVQgbGljZW5zZVxuICovXG5cbi8qanNoaW50IGJyb3dzZXI6IHRydWUsIHVuZGVmOiB0cnVlLCB1bnVzZWQ6IHRydWUgKi9cbi8qZ2xvYmFsIGRlZmluZTogZmFsc2UsIG1vZHVsZTogZmFsc2UgKi9cblxuKCBmdW5jdGlvbiggd2luZG93ICkge1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBkb2NFbGVtID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXG52YXIgYmluZCA9IGZ1bmN0aW9uKCkge307XG5cbmZ1bmN0aW9uIGdldElFRXZlbnQoIG9iaiApIHtcbiAgdmFyIGV2ZW50ID0gd2luZG93LmV2ZW50O1xuICAvLyBhZGQgZXZlbnQudGFyZ2V0XG4gIGV2ZW50LnRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5zcmNFbGVtZW50IHx8IG9iajtcbiAgcmV0dXJuIGV2ZW50O1xufVxuXG5pZiAoIGRvY0VsZW0uYWRkRXZlbnRMaXN0ZW5lciApIHtcbiAgYmluZCA9IGZ1bmN0aW9uKCBvYmosIHR5cGUsIGZuICkge1xuICAgIG9iai5hZGRFdmVudExpc3RlbmVyKCB0eXBlLCBmbiwgZmFsc2UgKTtcbiAgfTtcbn0gZWxzZSBpZiAoIGRvY0VsZW0uYXR0YWNoRXZlbnQgKSB7XG4gIGJpbmQgPSBmdW5jdGlvbiggb2JqLCB0eXBlLCBmbiApIHtcbiAgICBvYmpbIHR5cGUgKyBmbiBdID0gZm4uaGFuZGxlRXZlbnQgP1xuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBldmVudCA9IGdldElFRXZlbnQoIG9iaiApO1xuICAgICAgICBmbi5oYW5kbGVFdmVudC5jYWxsKCBmbiwgZXZlbnQgKTtcbiAgICAgIH0gOlxuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBldmVudCA9IGdldElFRXZlbnQoIG9iaiApO1xuICAgICAgICBmbi5jYWxsKCBvYmosIGV2ZW50ICk7XG4gICAgICB9O1xuICAgIG9iai5hdHRhY2hFdmVudCggXCJvblwiICsgdHlwZSwgb2JqWyB0eXBlICsgZm4gXSApO1xuICB9O1xufVxuXG52YXIgdW5iaW5kID0gZnVuY3Rpb24oKSB7fTtcblxuaWYgKCBkb2NFbGVtLnJlbW92ZUV2ZW50TGlzdGVuZXIgKSB7XG4gIHVuYmluZCA9IGZ1bmN0aW9uKCBvYmosIHR5cGUsIGZuICkge1xuICAgIG9iai5yZW1vdmVFdmVudExpc3RlbmVyKCB0eXBlLCBmbiwgZmFsc2UgKTtcbiAgfTtcbn0gZWxzZSBpZiAoIGRvY0VsZW0uZGV0YWNoRXZlbnQgKSB7XG4gIHVuYmluZCA9IGZ1bmN0aW9uKCBvYmosIHR5cGUsIGZuICkge1xuICAgIG9iai5kZXRhY2hFdmVudCggXCJvblwiICsgdHlwZSwgb2JqWyB0eXBlICsgZm4gXSApO1xuICAgIHRyeSB7XG4gICAgICBkZWxldGUgb2JqWyB0eXBlICsgZm4gXTtcbiAgICB9IGNhdGNoICggZXJyICkge1xuICAgICAgLy8gY2FuJ3QgZGVsZXRlIHdpbmRvdyBvYmplY3QgcHJvcGVydGllc1xuICAgICAgb2JqWyB0eXBlICsgZm4gXSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH07XG59XG5cbnZhciBldmVudGllID0ge1xuICBiaW5kOiBiaW5kLFxuICB1bmJpbmQ6IHVuYmluZFxufTtcblxuLy8gLS0tLS0gbW9kdWxlIGRlZmluaXRpb24gLS0tLS0gLy9cblxuaWYgKCB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgKSB7XG4gIC8vIEFNRFxuICBkZWZpbmUoIGV2ZW50aWUgKTtcbn0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyApIHtcbiAgLy8gQ29tbW9uSlNcbiAgbW9kdWxlLmV4cG9ydHMgPSBldmVudGllO1xufSBlbHNlIHtcbiAgLy8gYnJvd3NlciBnbG9iYWxcbiAgd2luZG93LmV2ZW50aWUgPSBldmVudGllO1xufVxuXG59KSggdGhpcyApO1xuIiwiLyohXG4gKiBFdmVudEVtaXR0ZXIgdjQuMi42IC0gZ2l0LmlvL2VlXG4gKiBPbGl2ZXIgQ2FsZHdlbGxcbiAqIE1JVCBsaWNlbnNlXG4gKiBAcHJlc2VydmVcbiAqL1xuXG4oZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0LyoqXG5cdCAqIENsYXNzIGZvciBtYW5hZ2luZyBldmVudHMuXG5cdCAqIENhbiBiZSBleHRlbmRlZCB0byBwcm92aWRlIGV2ZW50IGZ1bmN0aW9uYWxpdHkgaW4gb3RoZXIgY2xhc3Nlcy5cblx0ICpcblx0ICogQGNsYXNzIEV2ZW50RW1pdHRlciBNYW5hZ2VzIGV2ZW50IHJlZ2lzdGVyaW5nIGFuZCBlbWl0dGluZy5cblx0ICovXG5cdGZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHt9XG5cblx0Ly8gU2hvcnRjdXRzIHRvIGltcHJvdmUgc3BlZWQgYW5kIHNpemVcblx0dmFyIHByb3RvID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZTtcblx0dmFyIGV4cG9ydHMgPSB0aGlzO1xuXHR2YXIgb3JpZ2luYWxHbG9iYWxWYWx1ZSA9IGV4cG9ydHMuRXZlbnRFbWl0dGVyO1xuXG5cdC8qKlxuXHQgKiBGaW5kcyB0aGUgaW5kZXggb2YgdGhlIGxpc3RlbmVyIGZvciB0aGUgZXZlbnQgaW4gaXQncyBzdG9yYWdlIGFycmF5LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IGxpc3RlbmVycyBBcnJheSBvZiBsaXN0ZW5lcnMgdG8gc2VhcmNoIHRocm91Z2guXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIE1ldGhvZCB0byBsb29rIGZvci5cblx0ICogQHJldHVybiB7TnVtYmVyfSBJbmRleCBvZiB0aGUgc3BlY2lmaWVkIGxpc3RlbmVyLCAtMSBpZiBub3QgZm91bmRcblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzLCBsaXN0ZW5lcikge1xuXHRcdHZhciBpID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzW2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gLTE7XG5cdH1cblxuXHQvKipcblx0ICogQWxpYXMgYSBtZXRob2Qgd2hpbGUga2VlcGluZyB0aGUgY29udGV4dCBjb3JyZWN0LCB0byBhbGxvdyBmb3Igb3ZlcndyaXRpbmcgb2YgdGFyZ2V0IG1ldGhvZC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHRhcmdldCBtZXRob2QuXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgYWxpYXNlZCBtZXRob2Rcblx0ICogQGFwaSBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhbGlhcyhuYW1lKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIGFsaWFzQ2xvc3VyZSgpIHtcblx0XHRcdHJldHVybiB0aGlzW25hbWVdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cdFx0fTtcblx0fVxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBsaXN0ZW5lciBhcnJheSBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cblx0ICogV2lsbCBpbml0aWFsaXNlIHRoZSBldmVudCBvYmplY3QgYW5kIGxpc3RlbmVyIGFycmF5cyBpZiByZXF1aXJlZC5cblx0ICogV2lsbCByZXR1cm4gYW4gb2JqZWN0IGlmIHlvdSB1c2UgYSByZWdleCBzZWFyY2guIFRoZSBvYmplY3QgY29udGFpbnMga2V5cyBmb3IgZWFjaCBtYXRjaGVkIGV2ZW50LiBTbyAvYmFbcnpdLyBtaWdodCByZXR1cm4gYW4gb2JqZWN0IGNvbnRhaW5pbmcgYmFyIGFuZCBiYXouIEJ1dCBvbmx5IGlmIHlvdSBoYXZlIGVpdGhlciBkZWZpbmVkIHRoZW0gd2l0aCBkZWZpbmVFdmVudCBvciBhZGRlZCBzb21lIGxpc3RlbmVycyB0byB0aGVtLlxuXHQgKiBFYWNoIHByb3BlcnR5IGluIHRoZSBvYmplY3QgcmVzcG9uc2UgaXMgYW4gYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xSZWdFeHB9IGV2dCBOYW1lIG9mIHRoZSBldmVudCB0byByZXR1cm4gdGhlIGxpc3RlbmVycyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbltdfE9iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgdGhlIGV2ZW50LlxuXHQgKi9cblx0cHJvdG8uZ2V0TGlzdGVuZXJzID0gZnVuY3Rpb24gZ2V0TGlzdGVuZXJzKGV2dCkge1xuXHRcdHZhciBldmVudHMgPSB0aGlzLl9nZXRFdmVudHMoKTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cdFx0dmFyIGtleTtcblxuXHRcdC8vIFJldHVybiBhIGNvbmNhdGVuYXRlZCBhcnJheSBvZiBhbGwgbWF0Y2hpbmcgZXZlbnRzIGlmXG5cdFx0Ly8gdGhlIHNlbGVjdG9yIGlzIGEgcmVndWxhciBleHByZXNzaW9uLlxuXHRcdGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0Jykge1xuXHRcdFx0cmVzcG9uc2UgPSB7fTtcblx0XHRcdGZvciAoa2V5IGluIGV2ZW50cykge1xuXHRcdFx0XHRpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuXHRcdFx0XHRcdHJlc3BvbnNlW2tleV0gPSBldmVudHNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdHJlc3BvbnNlID0gZXZlbnRzW2V2dF0gfHwgKGV2ZW50c1tldnRdID0gW10pO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZTtcblx0fTtcblxuXHQvKipcblx0ICogVGFrZXMgYSBsaXN0IG9mIGxpc3RlbmVyIG9iamVjdHMgYW5kIGZsYXR0ZW5zIGl0IGludG8gYSBsaXN0IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucy5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3RbXX0gbGlzdGVuZXJzIFJhdyBsaXN0ZW5lciBvYmplY3RzLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbltdfSBKdXN0IHRoZSBsaXN0ZW5lciBmdW5jdGlvbnMuXG5cdCAqL1xuXHRwcm90by5mbGF0dGVuTGlzdGVuZXJzID0gZnVuY3Rpb24gZmxhdHRlbkxpc3RlbmVycyhsaXN0ZW5lcnMpIHtcblx0XHR2YXIgZmxhdExpc3RlbmVycyA9IFtdO1xuXHRcdHZhciBpO1xuXG5cdFx0Zm9yIChpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0ZmxhdExpc3RlbmVycy5wdXNoKGxpc3RlbmVyc1tpXS5saXN0ZW5lcik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZsYXRMaXN0ZW5lcnM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIHJlcXVlc3RlZCBsaXN0ZW5lcnMgdmlhIGdldExpc3RlbmVycyBidXQgd2lsbCBhbHdheXMgcmV0dXJuIHRoZSByZXN1bHRzIGluc2lkZSBhbiBvYmplY3QuIFRoaXMgaXMgbWFpbmx5IGZvciBpbnRlcm5hbCB1c2UgYnV0IG90aGVycyBtYXkgZmluZCBpdCB1c2VmdWwuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJldHVybiB0aGUgbGlzdGVuZXJzIGZyb20uXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQWxsIGxpc3RlbmVyIGZ1bmN0aW9ucyBmb3IgYW4gZXZlbnQgaW4gYW4gb2JqZWN0LlxuXHQgKi9cblx0cHJvdG8uZ2V0TGlzdGVuZXJzQXNPYmplY3QgPSBmdW5jdGlvbiBnZXRMaXN0ZW5lcnNBc09iamVjdChldnQpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cblx0XHRpZiAobGlzdGVuZXJzIGluc3RhbmNlb2YgQXJyYXkpIHtcblx0XHRcdHJlc3BvbnNlID0ge307XG5cdFx0XHRyZXNwb25zZVtldnRdID0gbGlzdGVuZXJzO1xuXHRcdH1cblxuXHRcdHJldHVybiByZXNwb25zZSB8fCBsaXN0ZW5lcnM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFkZHMgYSBsaXN0ZW5lciBmdW5jdGlvbiB0byB0aGUgc3BlY2lmaWVkIGV2ZW50LlxuXHQgKiBUaGUgbGlzdGVuZXIgd2lsbCBub3QgYmUgYWRkZWQgaWYgaXQgaXMgYSBkdXBsaWNhdGUuXG5cdCAqIElmIHRoZSBsaXN0ZW5lciByZXR1cm5zIHRydWUgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgYWZ0ZXIgaXQgaXMgY2FsbGVkLlxuXHQgKiBJZiB5b3UgcGFzcyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBhcyB0aGUgZXZlbnQgbmFtZSB0aGVuIHRoZSBsaXN0ZW5lciB3aWxsIGJlIGFkZGVkIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkTGlzdGVuZXIgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcihldnQsIGxpc3RlbmVyKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgbGlzdGVuZXJJc1dyYXBwZWQgPSB0eXBlb2YgbGlzdGVuZXIgPT09ICdvYmplY3QnO1xuXHRcdHZhciBrZXk7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKSA9PT0gLTEpIHtcblx0XHRcdFx0bGlzdGVuZXJzW2tleV0ucHVzaChsaXN0ZW5lcklzV3JhcHBlZCA/IGxpc3RlbmVyIDoge1xuXHRcdFx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRcdFx0XHRvbmNlOiBmYWxzZVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgYWRkTGlzdGVuZXJcblx0ICovXG5cdHByb3RvLm9uID0gYWxpYXMoJ2FkZExpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIFNlbWktYWxpYXMgb2YgYWRkTGlzdGVuZXIuIEl0IHdpbGwgYWRkIGEgbGlzdGVuZXIgdGhhdCB3aWxsIGJlXG5cdCAqIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGZpcnN0IGV4ZWN1dGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gYXR0YWNoIHRoZSBsaXN0ZW5lciB0by5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBpcyBlbWl0dGVkLiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyB0cnVlIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGFmdGVyIGNhbGxpbmcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uYWRkT25jZUxpc3RlbmVyID0gZnVuY3Rpb24gYWRkT25jZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHRyZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcihldnQsIHtcblx0XHRcdGxpc3RlbmVyOiBsaXN0ZW5lcixcblx0XHRcdG9uY2U6IHRydWVcblx0XHR9KTtcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgYWRkT25jZUxpc3RlbmVyLlxuXHQgKi9cblx0cHJvdG8ub25jZSA9IGFsaWFzKCdhZGRPbmNlTGlzdGVuZXInKTtcblxuXHQvKipcblx0ICogRGVmaW5lcyBhbiBldmVudCBuYW1lLiBUaGlzIGlzIHJlcXVpcmVkIGlmIHlvdSB3YW50IHRvIHVzZSBhIHJlZ2V4IHRvIGFkZCBhIGxpc3RlbmVyIHRvIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLiBJZiB5b3UgZG9uJ3QgZG8gdGhpcyB0aGVuIGhvdyBkbyB5b3UgZXhwZWN0IGl0IHRvIGtub3cgd2hhdCBldmVudCB0byBhZGQgdG8/IFNob3VsZCBpdCBqdXN0IGFkZCB0byBldmVyeSBwb3NzaWJsZSBtYXRjaCBmb3IgYSByZWdleD8gTm8uIFRoYXQgaXMgc2NhcnkgYW5kIGJhZC5cblx0ICogWW91IG5lZWQgdG8gdGVsbCBpdCB3aGF0IGV2ZW50IG5hbWVzIHNob3VsZCBiZSBtYXRjaGVkIGJ5IGEgcmVnZXguXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gY3JlYXRlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmRlZmluZUV2ZW50ID0gZnVuY3Rpb24gZGVmaW5lRXZlbnQoZXZ0KSB7XG5cdFx0dGhpcy5nZXRMaXN0ZW5lcnMoZXZ0KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogVXNlcyBkZWZpbmVFdmVudCB0byBkZWZpbmUgbXVsdGlwbGUgZXZlbnRzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ1tdfSBldnRzIEFuIGFycmF5IG9mIGV2ZW50IG5hbWVzIHRvIGRlZmluZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5kZWZpbmVFdmVudHMgPSBmdW5jdGlvbiBkZWZpbmVFdmVudHMoZXZ0cykge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZXZ0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dGhpcy5kZWZpbmVFdmVudChldnRzW2ldKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYSBsaXN0ZW5lciBmdW5jdGlvbiBmcm9tIHRoZSBzcGVjaWZpZWQgZXZlbnQuXG5cdCAqIFdoZW4gcGFzc2VkIGEgcmVndWxhciBleHByZXNzaW9uIGFzIHRoZSBldmVudCBuYW1lLCBpdCB3aWxsIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIgZnJvbS5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgTWV0aG9kIHRvIHJlbW92ZSBmcm9tIHRoZSBldmVudC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2dCwgbGlzdGVuZXIpIHtcblx0XHR2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRMaXN0ZW5lcnNBc09iamVjdChldnQpO1xuXHRcdHZhciBpbmRleDtcblx0XHR2YXIga2V5O1xuXG5cdFx0Zm9yIChrZXkgaW4gbGlzdGVuZXJzKSB7XG5cdFx0XHRpZiAobGlzdGVuZXJzLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0XHRcdFx0aW5kZXggPSBpbmRleE9mTGlzdGVuZXIobGlzdGVuZXJzW2tleV0sIGxpc3RlbmVyKTtcblxuXHRcdFx0XHRpZiAoaW5kZXggIT09IC0xKSB7XG5cdFx0XHRcdFx0bGlzdGVuZXJzW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBBbGlhcyBvZiByZW1vdmVMaXN0ZW5lclxuXHQgKi9cblx0cHJvdG8ub2ZmID0gYWxpYXMoJ3JlbW92ZUxpc3RlbmVyJyk7XG5cblx0LyoqXG5cdCAqIEFkZHMgbGlzdGVuZXJzIGluIGJ1bGsgdXNpbmcgdGhlIG1hbmlwdWxhdGVMaXN0ZW5lcnMgbWV0aG9kLlxuXHQgKiBJZiB5b3UgcGFzcyBhbiBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudCB5b3UgY2FuIGFkZCB0byBtdWx0aXBsZSBldmVudHMgYXQgb25jZS4gVGhlIG9iamVjdCBzaG91bGQgY29udGFpbiBrZXkgdmFsdWUgcGFpcnMgb2YgZXZlbnRzIGFuZCBsaXN0ZW5lcnMgb3IgbGlzdGVuZXIgYXJyYXlzLiBZb3UgY2FuIGFsc28gcGFzcyBpdCBhbiBldmVudCBuYW1lIGFuZCBhbiBhcnJheSBvZiBsaXN0ZW5lcnMgdG8gYmUgYWRkZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIGFkZCB0aGUgYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICogWWVhaCwgdGhpcyBmdW5jdGlvbiBkb2VzIHF1aXRlIGEgYml0LiBUaGF0J3MgcHJvYmFibHkgYSBiYWQgdGhpbmcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdHxSZWdFeHB9IGV2dCBBbiBldmVudCBuYW1lIGlmIHlvdSB3aWxsIHBhc3MgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIG5leHQuIEFuIG9iamVjdCBpZiB5b3Ugd2lzaCB0byBhZGQgdG8gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIGFkZC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5hZGRMaXN0ZW5lcnMgPSBmdW5jdGlvbiBhZGRMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHQvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuXHRcdHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnMoZmFsc2UsIGV2dCwgbGlzdGVuZXJzKTtcblx0fTtcblxuXHQvKipcblx0ICogUmVtb3ZlcyBsaXN0ZW5lcnMgaW4gYnVsayB1c2luZyB0aGUgbWFuaXB1bGF0ZUxpc3RlbmVycyBtZXRob2QuXG5cdCAqIElmIHlvdSBwYXNzIGFuIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50IHlvdSBjYW4gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIHJlbW92ZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXJzIGZyb20gYWxsIGV2ZW50cyB0aGF0IG1hdGNoIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb25bXX0gW2xpc3RlbmVyc10gQW4gb3B0aW9uYWwgYXJyYXkgb2YgbGlzdGVuZXIgZnVuY3Rpb25zIHRvIHJlbW92ZS5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5yZW1vdmVMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHQvLyBQYXNzIHRocm91Z2ggdG8gbWFuaXB1bGF0ZUxpc3RlbmVyc1xuXHRcdHJldHVybiB0aGlzLm1hbmlwdWxhdGVMaXN0ZW5lcnModHJ1ZSwgZXZ0LCBsaXN0ZW5lcnMpO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBFZGl0cyBsaXN0ZW5lcnMgaW4gYnVsay4gVGhlIGFkZExpc3RlbmVycyBhbmQgcmVtb3ZlTGlzdGVuZXJzIG1ldGhvZHMgYm90aCB1c2UgdGhpcyB0byBkbyB0aGVpciBqb2IuIFlvdSBzaG91bGQgcmVhbGx5IHVzZSB0aG9zZSBpbnN0ZWFkLCB0aGlzIGlzIGEgbGl0dGxlIGxvd2VyIGxldmVsLlxuXHQgKiBUaGUgZmlyc3QgYXJndW1lbnQgd2lsbCBkZXRlcm1pbmUgaWYgdGhlIGxpc3RlbmVycyBhcmUgcmVtb3ZlZCAodHJ1ZSkgb3IgYWRkZWQgKGZhbHNlKS5cblx0ICogSWYgeW91IHBhc3MgYW4gb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQgeW91IGNhbiBhZGQvcmVtb3ZlIGZyb20gbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2UuIFRoZSBvYmplY3Qgc2hvdWxkIGNvbnRhaW4ga2V5IHZhbHVlIHBhaXJzIG9mIGV2ZW50cyBhbmQgbGlzdGVuZXJzIG9yIGxpc3RlbmVyIGFycmF5cy5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgaXQgYW4gZXZlbnQgbmFtZSBhbmQgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRvIGJlIGFkZGVkL3JlbW92ZWQuXG5cdCAqIFlvdSBjYW4gYWxzbyBwYXNzIGl0IGEgcmVndWxhciBleHByZXNzaW9uIHRvIG1hbmlwdWxhdGUgdGhlIGxpc3RlbmVycyBvZiBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gcmVtb3ZlIFRydWUgaWYgeW91IHdhbnQgdG8gcmVtb3ZlIGxpc3RlbmVycywgZmFsc2UgaWYgeW91IHdhbnQgdG8gYWRkLlxuXHQgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R8UmVnRXhwfSBldnQgQW4gZXZlbnQgbmFtZSBpZiB5b3Ugd2lsbCBwYXNzIGFuIGFycmF5IG9mIGxpc3RlbmVycyBuZXh0LiBBbiBvYmplY3QgaWYgeW91IHdpc2ggdG8gYWRkL3JlbW92ZSBmcm9tIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9uW119IFtsaXN0ZW5lcnNdIEFuIG9wdGlvbmFsIGFycmF5IG9mIGxpc3RlbmVyIGZ1bmN0aW9ucyB0byBhZGQvcmVtb3ZlLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLm1hbmlwdWxhdGVMaXN0ZW5lcnMgPSBmdW5jdGlvbiBtYW5pcHVsYXRlTGlzdGVuZXJzKHJlbW92ZSwgZXZ0LCBsaXN0ZW5lcnMpIHtcblx0XHR2YXIgaTtcblx0XHR2YXIgdmFsdWU7XG5cdFx0dmFyIHNpbmdsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXIgOiB0aGlzLmFkZExpc3RlbmVyO1xuXHRcdHZhciBtdWx0aXBsZSA9IHJlbW92ZSA/IHRoaXMucmVtb3ZlTGlzdGVuZXJzIDogdGhpcy5hZGRMaXN0ZW5lcnM7XG5cblx0XHQvLyBJZiBldnQgaXMgYW4gb2JqZWN0IHRoZW4gcGFzcyBlYWNoIG9mIGl0J3MgcHJvcGVydGllcyB0byB0aGlzIG1ldGhvZFxuXHRcdGlmICh0eXBlb2YgZXZ0ID09PSAnb2JqZWN0JyAmJiAhKGV2dCBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcblx0XHRcdGZvciAoaSBpbiBldnQpIHtcblx0XHRcdFx0aWYgKGV2dC5oYXNPd25Qcm9wZXJ0eShpKSAmJiAodmFsdWUgPSBldnRbaV0pKSB7XG5cdFx0XHRcdFx0Ly8gUGFzcyB0aGUgc2luZ2xlIGxpc3RlbmVyIHN0cmFpZ2h0IHRocm91Z2ggdG8gdGhlIHNpbmd1bGFyIG1ldGhvZFxuXHRcdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0XHRcdHNpbmdsZS5jYWxsKHRoaXMsIGksIHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyBPdGhlcndpc2UgcGFzcyBiYWNrIHRvIHRoZSBtdWx0aXBsZSBmdW5jdGlvblxuXHRcdFx0XHRcdFx0bXVsdGlwbGUuY2FsbCh0aGlzLCBpLCB2YWx1ZSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0Ly8gU28gZXZ0IG11c3QgYmUgYSBzdHJpbmdcblx0XHRcdC8vIEFuZCBsaXN0ZW5lcnMgbXVzdCBiZSBhbiBhcnJheSBvZiBsaXN0ZW5lcnNcblx0XHRcdC8vIExvb3Agb3ZlciBpdCBhbmQgcGFzcyBlYWNoIG9uZSB0byB0aGUgbXVsdGlwbGUgbWV0aG9kXG5cdFx0XHRpID0gbGlzdGVuZXJzLmxlbmd0aDtcblx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0c2luZ2xlLmNhbGwodGhpcywgZXZ0LCBsaXN0ZW5lcnNbaV0pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgZnJvbSBhIHNwZWNpZmllZCBldmVudC5cblx0ICogSWYgeW91IGRvIG5vdCBzcGVjaWZ5IGFuIGV2ZW50IHRoZW4gYWxsIGxpc3RlbmVycyB3aWxsIGJlIHJlbW92ZWQuXG5cdCAqIFRoYXQgbWVhbnMgZXZlcnkgZXZlbnQgd2lsbCBiZSBlbXB0aWVkLlxuXHQgKiBZb3UgY2FuIGFsc28gcGFzcyBhIHJlZ2V4IHRvIHJlbW92ZSBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gW2V2dF0gT3B0aW9uYWwgbmFtZSBvZiB0aGUgZXZlbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLiBXaWxsIHJlbW92ZSBmcm9tIGV2ZXJ5IGV2ZW50IGlmIG5vdCBwYXNzZWQuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbiByZW1vdmVFdmVudChldnQpIHtcblx0XHR2YXIgdHlwZSA9IHR5cGVvZiBldnQ7XG5cdFx0dmFyIGV2ZW50cyA9IHRoaXMuX2dldEV2ZW50cygpO1xuXHRcdHZhciBrZXk7XG5cblx0XHQvLyBSZW1vdmUgZGlmZmVyZW50IHRoaW5ncyBkZXBlbmRpbmcgb24gdGhlIHN0YXRlIG9mIGV2dFxuXHRcdGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuXHRcdFx0Ly8gUmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnRcblx0XHRcdGRlbGV0ZSBldmVudHNbZXZ0XTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgZXZlbnRzIG1hdGNoaW5nIHRoZSByZWdleC5cblx0XHRcdGZvciAoa2V5IGluIGV2ZW50cykge1xuXHRcdFx0XHRpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGtleSkgJiYgZXZ0LnRlc3Qoa2V5KSkge1xuXHRcdFx0XHRcdGRlbGV0ZSBldmVudHNba2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIGluIGFsbCBldmVudHNcblx0XHRcdGRlbGV0ZSB0aGlzLl9ldmVudHM7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEFsaWFzIG9mIHJlbW92ZUV2ZW50LlxuXHQgKlxuXHQgKiBBZGRlZCB0byBtaXJyb3IgdGhlIG5vZGUgQVBJLlxuXHQgKi9cblx0cHJvdG8ucmVtb3ZlQWxsTGlzdGVuZXJzID0gYWxpYXMoJ3JlbW92ZUV2ZW50Jyk7XG5cblx0LyoqXG5cdCAqIEVtaXRzIGFuIGV2ZW50IG9mIHlvdXIgY2hvaWNlLlxuXHQgKiBXaGVuIGVtaXR0ZWQsIGV2ZXJ5IGxpc3RlbmVyIGF0dGFjaGVkIHRvIHRoYXQgZXZlbnQgd2lsbCBiZSBleGVjdXRlZC5cblx0ICogSWYgeW91IHBhc3MgdGhlIG9wdGlvbmFsIGFyZ3VtZW50IGFycmF5IHRoZW4gdGhvc2UgYXJndW1lbnRzIHdpbGwgYmUgcGFzc2VkIHRvIGV2ZXJ5IGxpc3RlbmVyIHVwb24gZXhlY3V0aW9uLlxuXHQgKiBCZWNhdXNlIGl0IHVzZXMgYGFwcGx5YCwgeW91ciBhcnJheSBvZiBhcmd1bWVudHMgd2lsbCBiZSBwYXNzZWQgYXMgaWYgeW91IHdyb3RlIHRoZW0gb3V0IHNlcGFyYXRlbHkuXG5cdCAqIFNvIHRoZXkgd2lsbCBub3QgYXJyaXZlIHdpdGhpbiB0aGUgYXJyYXkgb24gdGhlIG90aGVyIHNpZGUsIHRoZXkgd2lsbCBiZSBzZXBhcmF0ZS5cblx0ICogWW91IGNhbiBhbHNvIHBhc3MgYSByZWd1bGFyIGV4cHJlc3Npb24gdG8gZW1pdCB0byBhbGwgZXZlbnRzIHRoYXQgbWF0Y2ggaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfFJlZ0V4cH0gZXZ0IE5hbWUgb2YgdGhlIGV2ZW50IHRvIGVtaXQgYW5kIGV4ZWN1dGUgbGlzdGVuZXJzIGZvci5cblx0ICogQHBhcmFtIHtBcnJheX0gW2FyZ3NdIE9wdGlvbmFsIGFycmF5IG9mIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgdG8gZWFjaCBsaXN0ZW5lci5cblx0ICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IGluc3RhbmNlIG9mIEV2ZW50RW1pdHRlciBmb3IgY2hhaW5pbmcuXG5cdCAqL1xuXHRwcm90by5lbWl0RXZlbnQgPSBmdW5jdGlvbiBlbWl0RXZlbnQoZXZ0LCBhcmdzKSB7XG5cdFx0dmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0TGlzdGVuZXJzQXNPYmplY3QoZXZ0KTtcblx0XHR2YXIgbGlzdGVuZXI7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIGtleTtcblx0XHR2YXIgcmVzcG9uc2U7XG5cblx0XHRmb3IgKGtleSBpbiBsaXN0ZW5lcnMpIHtcblx0XHRcdGlmIChsaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHRcdFx0XHRpID0gbGlzdGVuZXJzW2tleV0ubGVuZ3RoO1xuXG5cdFx0XHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdFx0XHQvLyBJZiB0aGUgbGlzdGVuZXIgcmV0dXJucyB0cnVlIHRoZW4gaXQgc2hhbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBldmVudFxuXHRcdFx0XHRcdC8vIFRoZSBmdW5jdGlvbiBpcyBleGVjdXRlZCBlaXRoZXIgd2l0aCBhIGJhc2ljIGNhbGwgb3IgYW4gYXBwbHkgaWYgdGhlcmUgaXMgYW4gYXJncyBhcnJheVxuXHRcdFx0XHRcdGxpc3RlbmVyID0gbGlzdGVuZXJzW2tleV1baV07XG5cblx0XHRcdFx0XHRpZiAobGlzdGVuZXIub25jZSA9PT0gdHJ1ZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXNwb25zZSA9IGxpc3RlbmVyLmxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MgfHwgW10pO1xuXG5cdFx0XHRcdFx0aWYgKHJlc3BvbnNlID09PSB0aGlzLl9nZXRPbmNlUmV0dXJuVmFsdWUoKSkge1xuXHRcdFx0XHRcdFx0dGhpcy5yZW1vdmVMaXN0ZW5lcihldnQsIGxpc3RlbmVyLmxpc3RlbmVyKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHQvKipcblx0ICogQWxpYXMgb2YgZW1pdEV2ZW50XG5cdCAqL1xuXHRwcm90by50cmlnZ2VyID0gYWxpYXMoJ2VtaXRFdmVudCcpO1xuXG5cdC8qKlxuXHQgKiBTdWJ0bHkgZGlmZmVyZW50IGZyb20gZW1pdEV2ZW50IGluIHRoYXQgaXQgd2lsbCBwYXNzIGl0cyBhcmd1bWVudHMgb24gdG8gdGhlIGxpc3RlbmVycywgYXMgb3Bwb3NlZCB0byB0YWtpbmcgYSBzaW5nbGUgYXJyYXkgb2YgYXJndW1lbnRzIHRvIHBhc3Mgb24uXG5cdCAqIEFzIHdpdGggZW1pdEV2ZW50LCB5b3UgY2FuIHBhc3MgYSByZWdleCBpbiBwbGFjZSBvZiB0aGUgZXZlbnQgbmFtZSB0byBlbWl0IHRvIGFsbCBldmVudHMgdGhhdCBtYXRjaCBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd8UmVnRXhwfSBldnQgTmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdCBhbmQgZXhlY3V0ZSBsaXN0ZW5lcnMgZm9yLlxuXHQgKiBAcGFyYW0gey4uLip9IE9wdGlvbmFsIGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB0byBlYWNoIGxpc3RlbmVyLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEN1cnJlbnQgaW5zdGFuY2Ugb2YgRXZlbnRFbWl0dGVyIGZvciBjaGFpbmluZy5cblx0ICovXG5cdHByb3RvLmVtaXQgPSBmdW5jdGlvbiBlbWl0KGV2dCkge1xuXHRcdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0XHRyZXR1cm4gdGhpcy5lbWl0RXZlbnQoZXZ0LCBhcmdzKTtcblx0fTtcblxuXHQvKipcblx0ICogU2V0cyB0aGUgY3VycmVudCB2YWx1ZSB0byBjaGVjayBhZ2FpbnN0IHdoZW4gZXhlY3V0aW5nIGxpc3RlbmVycy4gSWYgYVxuXHQgKiBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhlIG9uZSBzZXQgaGVyZSB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZFxuXHQgKiBhZnRlciBleGVjdXRpb24uIFRoaXMgdmFsdWUgZGVmYXVsdHMgdG8gdHJ1ZS5cblx0ICpcblx0ICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgbmV3IHZhbHVlIHRvIGNoZWNrIGZvciB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCBpbnN0YW5jZSBvZiBFdmVudEVtaXR0ZXIgZm9yIGNoYWluaW5nLlxuXHQgKi9cblx0cHJvdG8uc2V0T25jZVJldHVyblZhbHVlID0gZnVuY3Rpb24gc2V0T25jZVJldHVyblZhbHVlKHZhbHVlKSB7XG5cdFx0dGhpcy5fb25jZVJldHVyblZhbHVlID0gdmFsdWU7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0LyoqXG5cdCAqIEZldGNoZXMgdGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgYWdhaW5zdCB3aGVuIGV4ZWN1dGluZyBsaXN0ZW5lcnMuIElmXG5cdCAqIHRoZSBsaXN0ZW5lcnMgcmV0dXJuIHZhbHVlIG1hdGNoZXMgdGhpcyBvbmUgdGhlbiBpdCBzaG91bGQgYmUgcmVtb3ZlZFxuXHQgKiBhdXRvbWF0aWNhbGx5LiBJdCB3aWxsIHJldHVybiB0cnVlIGJ5IGRlZmF1bHQuXG5cdCAqXG5cdCAqIEByZXR1cm4geyp8Qm9vbGVhbn0gVGhlIGN1cnJlbnQgdmFsdWUgdG8gY2hlY2sgZm9yIG9yIHRoZSBkZWZhdWx0LCB0cnVlLlxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdHByb3RvLl9nZXRPbmNlUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiBfZ2V0T25jZVJldHVyblZhbHVlKCkge1xuXHRcdGlmICh0aGlzLmhhc093blByb3BlcnR5KCdfb25jZVJldHVyblZhbHVlJykpIHtcblx0XHRcdHJldHVybiB0aGlzLl9vbmNlUmV0dXJuVmFsdWU7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBGZXRjaGVzIHRoZSBldmVudHMgb2JqZWN0IGFuZCBjcmVhdGVzIG9uZSBpZiByZXF1aXJlZC5cblx0ICpcblx0ICogQHJldHVybiB7T2JqZWN0fSBUaGUgZXZlbnRzIHN0b3JhZ2Ugb2JqZWN0LlxuXHQgKiBAYXBpIHByaXZhdGVcblx0ICovXG5cdHByb3RvLl9nZXRFdmVudHMgPSBmdW5jdGlvbiBfZ2V0RXZlbnRzKCkge1xuXHRcdHJldHVybiB0aGlzLl9ldmVudHMgfHwgKHRoaXMuX2V2ZW50cyA9IHt9KTtcblx0fTtcblxuXHQvKipcblx0ICogUmV2ZXJ0cyB0aGUgZ2xvYmFsIHtAbGluayBFdmVudEVtaXR0ZXJ9IHRvIGl0cyBwcmV2aW91cyB2YWx1ZSBhbmQgcmV0dXJucyBhIHJlZmVyZW5jZSB0byB0aGlzIHZlcnNpb24uXG5cdCAqXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBOb24gY29uZmxpY3RpbmcgRXZlbnRFbWl0dGVyIGNsYXNzLlxuXHQgKi9cblx0RXZlbnRFbWl0dGVyLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiBub0NvbmZsaWN0KCkge1xuXHRcdGV4cG9ydHMuRXZlbnRFbWl0dGVyID0gb3JpZ2luYWxHbG9iYWxWYWx1ZTtcblx0XHRyZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHR9O1xuXG5cdC8vIEV4cG9zZSB0aGUgY2xhc3MgZWl0aGVyIHZpYSBBTUQsIENvbW1vbkpTIG9yIHRoZSBnbG9iYWwgb2JqZWN0XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIEV2ZW50RW1pdHRlcjtcblx0XHR9KTtcblx0fVxuXHRlbHNlIGlmICh0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0JyAmJiBtb2R1bGUuZXhwb3J0cyl7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cdH1cblx0ZWxzZSB7XG5cdFx0dGhpcy5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cdH1cbn0uY2FsbCh0aGlzKSk7XG4iXX0=
