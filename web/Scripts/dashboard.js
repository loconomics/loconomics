;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
﻿/** Implements a similar LcUrl object like the server-side one, basing
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
﻿/** ProviderPosition class
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
﻿/* Focus the first element in the document (or in @container)
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
﻿/* Some utilities for use with jQuery or its expressions
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
﻿function moveFocusTo(el, options) {
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
﻿/** Custom Loconomics 'like blockUI' popups
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
},{"./autoFocus":3,"./jquery.xtsh":4,"./jqueryUtils":5,"./moveFocusTo":6}],8:[function(require,module,exports){
﻿/**
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
﻿/**
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
    require('./dashboard/managePhotosUI').on('.DashboardYourWork');
    setInstantSavingSection('.DashboardPhotos');

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
﻿/**
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
﻿/** Availability: calendar appointments page setup for CRUDL use
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
﻿/**
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
﻿/** Availability: Calendar Sync section setup
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
﻿/** changeProfilePhoto, it uses 'uploader' using html5, ajax and a specific page
  to manage server-side upload of a new user profile photo.
**/
var $ = require('jquery');
require('jquery.blockUI');
// TODO: reimplement this and the server-side file to avoid iframes and exposing global functions,
// direct API use without iframe-normal post support (current browser matrix allow us this?)
// TODO: implement as real modular, next are the knowed modules in use but not loading that are expected
// to be in scope right now but must be used with the next code uncommented.
// require('uploader');
// require('LcUrl');
// var blockPresets = require('../LC/blockPresets')
// var ajaxForms = require('../LC/ajaxForms');

exports.on = function (containerSelector) {
  var $c = $(containerSelector);
  $c.on('click', '[href="#change-profile-photo"]', function () {
    popup(LcUrl.LangPath + 'dashboard/AboutYou/ChangePhoto/', { width: 240, height: 240 });
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

  window.deleteUserPhoto = function deleteUserPhoto() {
    $.blockUI(LC.blockPresets.loading);
    $.ajax({
      url: LcUrl.LangUrl + "dashboard/AboutYou/ChangePhoto/?delete=true",
      method: "GET",
      cache: false,
      dataType: "json",
      success: function (data) {
        if (data.Code === 0)
          $.blockUI(LC.blockPresets.info(data.Result));
        else
          $.blockUI(LC.blockPresets.error(data.Result.ErrorMessage));
        $('.blockUI .close-popup').click(function () { $.unblockUI(); });
        reloadUserPhoto();
      },
      error: ajaxErrorPopupHandler
    });
  };

};

},{}],15:[function(require,module,exports){
﻿/** Education page setup for CRUDL use
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
﻿/**
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
﻿/** Licenses page setup for CRUDL use
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
﻿/** Locations page setup for CRUDL use
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
﻿/** UI logic to manage provider photos (your-work/photos).
**/
var $ = require('jquery');
require('jquery-ui');
var smoothBoxBlock = require('LC/smoothBoxBlock');
var changesNotification = require('LC/changesNotification');

var sectionSelector = '.DashboardPhotos';

exports.on = function (containerSelector) {
  var $c = $(containerSelector);

  setupCrudlDelegates($c);

  initElements($c);

  // Any time that the form content html is reloaded,
  // re-initialize elements
  $c.on('ajaxFormReturnedHtml', 'form.ajax', function () {
    initElements($c);
  });
};

/* Setup the code that works on the different CRUDL actions on the photos.
  All this are delegates, only need to be setup once on the page
  (if the container $c is not replaced, only the contents, doesn't need to call again this).
*/
function setupCrudlDelegates($c) {
  $c
  .on('click', '.positionphotos-tools-upload > a', function () {
    var posID = $(this).closest('form').find('input[name=positionID]').val();
    popup(LcUrl.LangPath + 'dashboard/YourWork/UploadPhoto/?PositionID=' + posID, 'small');
    return false;
  })
  .on('click', '.positionphotos-gallery li a', function () {
    var $t = $(this);
    var form = $t.closest(sectionSelector);
    var editPanel = $('.positionphotos-edit', form);

    // If the form had changes, submit it to save it:
    // Remove the focus of current focused element to avoid 
    // changed elements not notify the change status
    $(':focus').blur();
    var f = editPanel.closest('fieldset.ajax');
    var changedEls = f.find('.changed:input').map(function(){ return this.name; }).get();
    if (changedEls.length > 0) {
      // Mark changes are saved
      f.one('ajaxFormReturnedHtml', function () {
        changesNotification.registerSave(f.closest('form').get(0), changedEls);
      });

      // Force a fieldset.ajax submit:
      f.find('.ajax-fieldset-submit').click();
    }

    smoothBoxBlock.closeAll(form);
    // Set this photo as selected
    var selected = $t.closest('li');
    selected.addClass('selected').siblings().removeClass('selected');
    //var selected = $('.positionphotos-gallery > ol > li.selected', form);
    if (selected !== null && selected.length > 0) {
      var selImg = selected.find('img');
      // Moving selected to be edit panel
      var photoID = selected.attr('id').match(/^UserPhoto-(\d+)$/)[1];
      editPanel.find('[name=PhotoID]').val(photoID);
      editPanel.find('img').attr('src', selImg.attr('src'));
      editPanel.find('[name=photo-caption]').val(selImg.attr('alt'));
      var isPrimaryValue = selected.hasClass('is-primary-photo') ? 'True' : 'False';
      editPanel.find('[name=is-primary-photo]').prop('checked', false);
      editPanel.find('[name=is-primary-photo][value=' + isPrimaryValue + ']').prop('checked', true);
    }
    return false;
  })
  .on('click', '.positionphotos-edit-delete a', function () {
    var editPanel = $(this).closest('.positionphotos-edit');
    // Change the field delete-photo to True and send form for an ajax request with
    // server delete task and content reload
    editPanel.find('[name=delete-photo]').val('True');
    // Force a fieldset.ajax submit:
    editPanel.closest('fieldset.ajax').find('.ajax-fieldset-submit').click();
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
      $(this).closest(sectionSelector).find('[name=gallery-order]').val(order).change();
    }
  });

  // Set primary photo to be edited
  var editPanel = $('.positionphotos-edit', form);
  // Look for a selected photo in the list
  var selected = $('.positionphotos-gallery > ol > li.selected', form);
  if (selected !== null && selected.length > 0) {
    var selImg = selected.find('img');
    // Moving selected to be edit panel
    var photoID = selected.attr('id').match(/^UserPhoto-(\d+)$/)[1];
    editPanel.find('[name=PhotoID]').val(photoID);
    editPanel.find('img').attr('src', selImg.attr('src'));
    editPanel.find('[name=photo-caption]').val(selImg.attr('alt'));
    var isPrimaryValue = selected.hasClass('is-primary-photo') ? 'True' : 'False';
    editPanel.find('[name=is-primary-photo]').prop('checked', false);
    editPanel.find('[name=is-primary-photo][value=' + isPrimaryValue + ']').prop('checked', true);
  } else {
    if (form.find('.positionphotos-gallery > ol > li').length === 0) {
      smoothBoxBlock.open(form.find('.no-photos'), editPanel, '', { autofocus: false });
    } else {
      smoothBoxBlock.open(form.find('.no-primary-photo'), editPanel, '', { autofocus: false });
    }
    // Reset hidden fields manually to avoid browser memory breaking things
    editPanel.find('[name=PhotoID]').val('');
    editPanel.find('[name=photo-caption]').val('');
    editPanel.find('[name=is-primary-photo]').prop('checked', false);
  }
  // Reset delete option
  editPanel.find('[name=delete-photo]').val('False');

}

},{}],20:[function(require,module,exports){
﻿/** Availability: Weekly Schedule section setup
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
﻿/**
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
﻿/** Pricing page setup for CRUDL use
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
﻿/**
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
﻿/** Service Attributes Validation: implements validations through the 
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
﻿/** It provides the code for the actions of the Verifications section.
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
﻿/** Verifications page setup for CRUDL use
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
﻿/** Availability: Weekly Schedule section setup
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

},{}]},{},[9])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvTGNVcmwuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvUHJvdmlkZXJQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvc21vb3RoQm94QmxvY2suanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdG9nZ2xlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9hZGRQb3NpdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2FwcG9pbnRtZW50c0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvYmFja2dyb3VuZENoZWNrUmVxdWVzdC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NhbGVuZGFyU3luYy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NoYW5nZVByb2ZpbGVQaG90by5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2VkdWNhdGlvbkNydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvZ2VuZXJhdGVCb29rTm93QnV0dG9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbGljZW5zZXNDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2xvY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUkuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9tb250aGx5U2NoZWR1bGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9wYXltZW50QWNjb3VudC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaWNpbmdDcnVkbC5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ByaXZhY3lTZXR0aW5ncy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3NlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNBY3Rpb25zLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0NydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvd2Vla2x5U2NoZWR1bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyLvu78vKiogSW1wbGVtZW50cyBhIHNpbWlsYXIgTGNVcmwgb2JqZWN0IGxpa2UgdGhlIHNlcnZlci1zaWRlIG9uZSwgYmFzaW5nXHJcbiAgICBpbiB0aGUgaW5mb3JtYXRpb24gYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGF0ICdodG1sJyB0YWcgaW4gdGhlIFxyXG4gICAgJ2RhdGEtYmFzZS11cmwnIGF0dHJpYnV0ZSAodGhhdHMgdmFsdWUgaXMgdGhlIGVxdWl2YWxlbnQgZm9yIEFwcFBhdGgpLFxyXG4gICAgYW5kIHRoZSBsYW5nIGluZm9ybWF0aW9uIGF0ICdkYXRhLWN1bHR1cmUnLlxyXG4gICAgVGhlIHJlc3Qgb2YgVVJMcyBhcmUgYnVpbHQgZm9sbG93aW5nIHRoZSB3aW5kb3cubG9jYXRpb24gYW5kIHNhbWUgcnVsZXNcclxuICAgIHRoYW4gaW4gdGhlIHNlcnZlci1zaWRlIG9iamVjdC5cclxuKiovXHJcblxyXG52YXIgYmFzZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYmFzZS11cmwnKSxcclxuICAgIGxhbmcgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKSxcclxuICAgIGwgPSB3aW5kb3cubG9jYXRpb24sXHJcbiAgICB1cmwgPSBsLnByb3RvY29sICsgJy8vJyArIGwuaG9zdDtcclxuLy8gbG9jYXRpb24uaG9zdCBpbmNsdWRlcyBwb3J0LCBpZiBpcyBub3QgdGhlIGRlZmF1bHQsIHZzIGxvY2F0aW9uLmhvc3RuYW1lXHJcblxyXG5iYXNlID0gYmFzZSB8fCAnLyc7XHJcblxyXG52YXIgTGNVcmwgPSB7XHJcbiAgICBTaXRlVXJsOiB1cmwsXHJcbiAgICBBcHBQYXRoOiBiYXNlLFxyXG4gICAgQXBwVXJsOiB1cmwgKyBiYXNlLFxyXG4gICAgTGFuZ0lkOiBsYW5nLFxyXG4gICAgTGFuZ1BhdGg6IGJhc2UgKyBsYW5nICsgJy8nLFxyXG4gICAgTGFuZ1VybDogdXJsICsgYmFzZSArIGxhbmdcclxufTtcclxuTGNVcmwuTGFuZ1VybCA9IHVybCArIExjVXJsLkxhbmdQYXRoO1xyXG5MY1VybC5Kc29uUGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ0pTT04vJztcclxuTGNVcmwuSnNvblVybCA9IHVybCArIExjVXJsLkpzb25QYXRoO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1VybDsiLCLvu78vKiogUHJvdmlkZXJQb3NpdGlvbiBjbGFzc1xyXG4gIEl0IHByb3ZpZGVzIG1pbmltdW4gbGlrZS1qcXVlcnkgZXZlbnQgbGlzdGVuZXJzXHJcbiAgd2l0aCBtZXRob2RzICdvbicgYW5kICdvZmYnLCBhbmQgaW50ZXJuYWxseSAndGhpcy5ldmVudHMnXHJcbiAgYmVpbmcgYSBqUXVlcnkuQ2FsbGJhY2tzLlxyXG4qKi9cclxudmFyIFxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKSxcclxuICBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnTEMvYWpheENhbGxiYWNrcycpO1xyXG5cclxuLyoqIENvbnN0cnVjdG9yXHJcbioqL1xyXG52YXIgUHJvdmlkZXJQb3NpdGlvbiA9IGZ1bmN0aW9uIChwb3NpdGlvbklkKSB7XHJcbiAgdGhpcy5wb3NpdGlvbklkID0gcG9zaXRpb25JZDtcclxuXHJcbiAgLy8gRXZlbnRzIHN1cHBvcnQgdGhyb3VnaCBqcXVlcnkuQ2FsbGJhY2tcclxuICB0aGlzLmV2ZW50cyA9ICQuQ2FsbGJhY2tzKCk7XHJcbiAgdGhpcy5vbiA9IGZ1bmN0aW9uICgpIHsgdGhpcy5ldmVudHMuYWRkLmFwcGx5KHRoaXMuZXZlbnRzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTsgcmV0dXJuIHRoaXM7IH07XHJcbiAgdGhpcy5vZmYgPSBmdW5jdGlvbiAoKSB7IHRoaXMuZXZlbnRzLnJlbW92ZS5hcHBseSh0aGlzLmV2ZW50cywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7IHJldHVybiB0aGlzOyB9O1xyXG59O1xyXG5cclxuLy8gVXNpbmcgZGVmYXVsdCBjb25maWd1cmF0aW9uIGFzIHByb3RvdHlwZVxyXG5Qcm92aWRlclBvc2l0aW9uLnByb3RvdHlwZSA9IHtcclxuICBkZWNsaW5lZE1lc3NhZ2VDbGFzczogJ2luZm8nLFxyXG4gIGRlY2xpbmVkUG9wdXBDbGFzczogJ3Bvc2l0aW9uLXN0YXRlLWNoYW5nZScsXHJcbiAgc3RhdGVDaGFuZ2VkRXZlbnQ6ICdzdGF0ZS1jaGFuZ2VkJyxcclxuICBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50OiAnc3RhdGUtY2hhbmdlZC1kZWNsaW5lZCcsXHJcbiAgcmVtb3ZlRm9ybVNlbGVjdG9yOiAnLmRlbGV0ZS1tZXNzYWdlLWNvbmZpcm0nLFxyXG4gIHJlbW92ZUZvcm1Db250YWluZXI6ICcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlJyxcclxuICByZW1vdmVNZXNzYWdlQ2xhc3M6ICd3YXJuaW5nJyxcclxuICByZW1vdmVQb3B1cENsYXNzOiAncG9zaXRpb24tc3RhdGUtY2hhbmdlJyxcclxuICByZW1vdmVkRXZlbnQ6ICdyZW1vdmVkJyxcclxuICByZW1vdmVGYWlsZWRFdmVudDogJ3JlbW92ZS1mYWlsZWQnXHJcbn07XHJcblxyXG4vKiogY2hhbmdlU3RhdGUgdG8gdGhlIG9uZSBnaXZlbiwgaXQgd2lsbCByYWlzZSBhIHN0YXRlQ2hhbmdlZEV2ZW50IG9uIHN1Y2Nlc3NcclxuICBvciBzdGF0ZUNoYW5nZWREZWNsaW5lZEV2ZW50IG9uIGVycm9yLlxyXG4gIEBzdGF0ZTogJ29uJyBvciAnb2ZmJ1xyXG4qKi9cclxuUHJvdmlkZXJQb3NpdGlvbi5wcm90b3R5cGUuY2hhbmdlU3RhdGUgPSBmdW5jdGlvbiBjaGFuZ2VQb3NpdGlvblN0YXRlKHN0YXRlKSB7XHJcbiAgdmFyIHBhZ2UgPSBzdGF0ZSA9PSAnb24nID8gJyRSZWFjdGl2YXRlJyA6ICckRGVhY3RpdmF0ZSc7XHJcbiAgdmFyICRkID0gJCgnI21haW4nKTtcclxuICB2YXIgdGhhdCA9IHRoaXM7XHJcbiAgdmFyIGN0eCA9IHsgZm9ybTogJGQsIGJveDogJGQgfTtcclxuICAkLmFqYXgoe1xyXG4gICAgdXJsOiBMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvcG9zaXRpb24vJyArIHBhZ2UgKyAnLz9Qb3NpdGlvbklEPScgKyB0aGlzLnBvc2l0aW9uSWQsXHJcbiAgICBjb250ZXh0OiBjdHgsXHJcbiAgICBlcnJvcjogYWpheENhbGxiYWNrcy5lcnJvcixcclxuICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgICAkZC5vbmUoJ2FqYXhTdWNjZXNzUG9zdCcsIGZ1bmN0aW9uIChldmVudCwgZGF0YSwgdCwgaiwgY3R4KSB7XHJcbiAgICAgICAgaWYgKGRhdGEgJiYgZGF0YS5Db2RlID4gMTAwKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YS5Db2RlID09IDEwMSkge1xyXG4gICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHN0YXRlKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFNob3cgbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIG1zZyA9ICQoJzxkaXYvPicpLmFkZENsYXNzKHRoYXQuZGVjbGluZWRNZXNzYWdlQ2xhc3MpLmFwcGVuZChkYXRhLlJlc3VsdC5NZXNzYWdlKTtcclxuICAgICAgICAgICAgc21vb3RoQm94QmxvY2sub3Blbihtc2csICRkLCB0aGF0LmRlY2xpbmVkUG9wdXBDbGFzcywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiBmYWxzZSwgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBQcm9jZXNzIHRoZSByZXN1bHQsIHRoYXQgZXZlbnR1YWxseSB3aWxsIGNhbGwgYWpheFN1Y2Nlc3NQb3N0XHJcbiAgICAgIGFqYXhDYWxsYmFja3MuZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAgICBEZWxldGUgcG9zaXRpb25cclxuKiovXHJcblByb3ZpZGVyUG9zaXRpb24ucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIGRlbGV0ZVBvc2l0aW9uKCkge1xyXG5cclxuICAgIHZhciBjID0gJCh0aGlzLnJlbW92ZUZvcm1Db250YWluZXIpLFxyXG4gICAgICAgIGYgPSBjLmZpbmQodGhpcy5yZW1vdmVGb3JtU2VsZWN0b3IpLmZpcnN0KCksXHJcbiAgICAgICAgcG9wdXBGb3JtID0gZi5jbG9uZSgpLFxyXG4gICAgICAgIHRoYXQgPSB0aGlzO1xyXG5cclxuICAgIHBvcHVwRm9ybS5vbmUoJ2FqYXhTdWNjZXNzUG9zdCcsICcuYWpheC1ib3gnLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gbm90aWZ5KCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGRhdGEuQ29kZSkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAxMDE6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5ldmVudHMuZmlyZSh0aGF0LnJlbW92ZWRFdmVudCwgW2RhdGEuUmVzdWx0XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDEwMzpcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmV2ZW50cy5maXJlKHRoYXQucmVtb3ZlRmFpbGVkRXZlbnQsIFtkYXRhLlJlc3VsdF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhLlJlc3VsdCAmJiBkYXRhLlJlc3VsdC5NZXNzYWdlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gJCgnPGRpdi8+JykuYWRkQ2xhc3ModGhhdC5yZW1vdmVNZXNzYWdlQ2xhc3MpLmFwcGVuZChkYXRhLlJlc3VsdC5NZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgIHZhciBib3ggPSBzbW9vdGhCb3hCbG9jay5vcGVuKG1zZywgYywgdGhhdC5yZW1vdmVQb3B1cENsYXNzLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IGZhbHNlLCBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJveC5vbigneGhpZGUnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbm90aWZ5KCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vdGlmeSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIE9wZW4gY29uZmlybWF0aW9uIGZvcm1cclxuICAgIHZhciBiID0gc21vb3RoQm94QmxvY2sub3Blbihwb3B1cEZvcm0sIGMsIG51bGwsIHsgY2xvc2FibGU6IHRydWUgfSk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb3ZpZGVyUG9zaXRpb247Iiwi77u/LyogRm9jdXMgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlIGRvY3VtZW50IChvciBpbiBAY29udGFpbmVyKVxyXG53aXRoIHRoZSBodG1sNSBhdHRyaWJ1dGUgJ2F1dG9mb2N1cycgKG9yIGFsdGVybmF0aXZlIEBjc3NTZWxlY3RvcikuXHJcbkl0J3MgZmluZSBhcyBhIHBvbHlmaWxsIGFuZCBmb3IgYWpheCBsb2FkZWQgY29udGVudCB0aGF0IHdpbGwgbm90XHJcbmdldCB0aGUgYnJvd3NlciBzdXBwb3J0IG9mIHRoZSBhdHRyaWJ1dGUuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5mdW5jdGlvbiBhdXRvRm9jdXMoY29udGFpbmVyLCBjc3NTZWxlY3Rvcikge1xyXG4gICAgY29udGFpbmVyID0gJChjb250YWluZXIgfHwgZG9jdW1lbnQpO1xyXG4gICAgY29udGFpbmVyLmZpbmQoY3NzU2VsZWN0b3IgfHwgJ1thdXRvZm9jdXNdJykuZm9jdXMoKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBhdXRvRm9jdXM7IiwiLyoqIEV4dGVuZGVkIHRvZ2dsZS1zaG93LWhpZGUgZnVudGlvbnMuXHJcbiAgICBJYWdvU1JMQGdtYWlsLmNvbVxyXG4gICAgRGVwZW5kZW5jaWVzOiBqcXVlcnlcclxuICoqL1xyXG4oZnVuY3Rpb24oKXtcclxuXHJcbiAgICAvKiogSW1wbGVtZW50YXRpb246IHJlcXVpcmUgalF1ZXJ5IGFuZCByZXR1cm5zIG9iamVjdCB3aXRoIHRoZVxyXG4gICAgICAgIHB1YmxpYyBtZXRob2RzLlxyXG4gICAgICoqL1xyXG4gICAgZnVuY3Rpb24geHRzaChqUXVlcnkpIHtcclxuICAgICAgICB2YXIgJCA9IGpRdWVyeTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogSGlkZSBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnaGlkZScgYW5kICdmYWRlT3V0JyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICAqIGpxdWVyeS11aSBlZmZlY3RzIChpcyBsb2FkZWQpIG9yIGN1c3RvbSBhbmltYXRpb24gdGhyb3VnaCBqcXVlcnkgJ2FuaW1hdGUnLlxyXG4gICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2FuaW1hdGUnOiBqUXVlcnkuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpXHJcbiAgICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5mYWRlT3V0KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5zbGlkZVVwKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgLy8gJ3NpemUnIHZhbHVlIGFuZCBqcXVlcnktdWkgZWZmZWN0cyBnbyB0byBzdGFuZGFyZCAnaGlkZSdcclxuICAgICAgICAgICAgICAgIC8vIGNhc2UgJ3NpemUnOlxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAkZS5oaWRlKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hoaWRlJywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICogU2hvdyBhbiBlbGVtZW50IHVzaW5nIGpRdWVyeSwgYWxsb3dpbmcgdXNlIHN0YW5kYXJkICAnc2hvdycgYW5kICdmYWRlSW4nIGVmZmVjdHMsIGV4dGVuZGVkXHJcbiAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAqIERlcGVuZGluZyBvbiBvcHRpb25zLmVmZmVjdDpcclxuICAgICAgICAqIC0gaWYgbm90IHByZXNlbnQsIGpRdWVyeS5oaWRlKG9wdGlvbnMpXHJcbiAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICogLSAnZmFkZSc6IGpRdWVyeS5mYWRlT3V0XHJcbiAgICAgICAgKi9cclxuICAgICAgICBmdW5jdGlvbiBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIHZhciAkZSA9ICQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgIC8vIFdlIHBlcmZvcm1zIGEgZml4IG9uIHN0YW5kYXJkIGpRdWVyeSBlZmZlY3RzXHJcbiAgICAgICAgICAgIC8vIHRvIGF2b2lkIGFuIGVycm9yIHRoYXQgcHJldmVudHMgZnJvbSBydW5uaW5nXHJcbiAgICAgICAgICAgIC8vIGVmZmVjdHMgb24gZWxlbWVudHMgdGhhdCBhcmUgYWxyZWFkeSB2aXNpYmxlLFxyXG4gICAgICAgICAgICAvLyB3aGF0IGxldHMgdGhlIHBvc3NpYmlsaXR5IG9mIGdldCBhIG1pZGRsZS1hbmltYXRlZFxyXG4gICAgICAgICAgICAvLyBlZmZlY3QuXHJcbiAgICAgICAgICAgIC8vIFdlIGp1c3QgY2hhbmdlIGRpc3BsYXk6bm9uZSwgZm9yY2luZyB0byAnaXMtdmlzaWJsZScgdG9cclxuICAgICAgICAgICAgLy8gYmUgZmFsc2UgYW5kIHRoZW4gcnVubmluZyB0aGUgZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBubyBmbGlja2VyaW5nIGVmZmVjdCwgYmVjYXVzZSBqUXVlcnkganVzdCByZXNldHNcclxuICAgICAgICAgICAgLy8gZGlzcGxheSBvbiBlZmZlY3Qgc3RhcnQuXHJcbiAgICAgICAgICAgIHN3aXRjaCAob3B0aW9ucy5lZmZlY3QpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2FuaW1hdGUnOlxyXG4gICAgICAgICAgICAgICAgICAgICRlLmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuZmFkZUluKG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVpZ2h0JzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNsaWRlRG93bihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ3Nob3cnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zaG93KG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICRlLnRyaWdnZXIoJ3hzaG93JywgW29wdGlvbnNdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKiBHZW5lcmljIHV0aWxpdHkgZm9yIGhpZ2hseSBjb25maWd1cmFibGUgalF1ZXJ5LnRvZ2dsZSB3aXRoIHN1cHBvcnRcclxuICAgICAgICAgICAgdG8gc3BlY2lmeSB0aGUgdG9nZ2xlIHZhbHVlIGV4cGxpY2l0eSBmb3IgYW55IGtpbmQgb2YgZWZmZWN0OiBqdXN0IHBhc3MgdHJ1ZSBhcyBzZWNvbmQgcGFyYW1ldGVyICd0b2dnbGUnIHRvIHNob3dcclxuICAgICAgICAgICAgYW5kIGZhbHNlIHRvIGhpZGUuIFRvZ2dsZSBtdXN0IGJlIHN0cmljdGx5IGEgQm9vbGVhbiB2YWx1ZSB0byBhdm9pZCBhdXRvLWRldGVjdGlvbi5cclxuICAgICAgICAgICAgVG9nZ2xlIHBhcmFtZXRlciBjYW4gYmUgb21pdHRlZCB0byBhdXRvLWRldGVjdCBpdCwgYW5kIHNlY29uZCBwYXJhbWV0ZXIgY2FuIGJlIHRoZSBhbmltYXRpb24gb3B0aW9ucy5cclxuICAgICAgICAgICAgQWxsIHRoZSBvdGhlcnMgYmVoYXZlIGV4YWN0bHkgYXMgaGlkZUVsZW1lbnQgYW5kIHNob3dFbGVtZW50LlxyXG4gICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHRvZ2dsZUVsZW1lbnQoZWxlbWVudCwgdG9nZ2xlLCBvcHRpb25zKSB7XHJcbiAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBub3QgYSBib29sZWFuXHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUgIT09IHRydWUgJiYgdG9nZ2xlICE9PSBmYWxzZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSWYgdG9nZ2xlIGlzIGFuIG9iamVjdCwgdGhlbiBpcyB0aGUgb3B0aW9ucyBhcyBzZWNvbmQgcGFyYW1ldGVyXHJcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHRvZ2dsZSkpXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyA9IHRvZ2dsZTtcclxuICAgICAgICAgICAgICAgIC8vIEF1dG8tZGV0ZWN0IHRvZ2dsZSwgaXQgY2FuIHZhcnkgb24gYW55IGVsZW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAvLyB0aGVuIGRldGVjdGlvbiBhbmQgYWN0aW9uIG11c3QgYmUgZG9uZSBwZXIgZWxlbWVudDpcclxuICAgICAgICAgICAgICAgICQoZWxlbWVudCkuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gUmV1c2luZyBmdW5jdGlvbiwgd2l0aCBleHBsaWNpdCB0b2dnbGUgdmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB0b2dnbGVFbGVtZW50KHRoaXMsICEkKHRoaXMpLmlzKCc6dmlzaWJsZScpLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0b2dnbGUpXHJcbiAgICAgICAgICAgICAgICBzaG93RWxlbWVudChlbGVtZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8qKiBEbyBqUXVlcnkgaW50ZWdyYXRpb24gYXMgeHRvZ2dsZSwgeHNob3csIHhoaWRlXHJcbiAgICAgICAgICoqL1xyXG4gICAgICAgIGZ1bmN0aW9uIHBsdWdJbihqUXVlcnkpIHtcclxuICAgICAgICAgICAgLyoqIHRvZ2dsZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4dG9nZ2xlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnh0b2dnbGUgPSBmdW5jdGlvbiB4dG9nZ2xlKHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCB0b2dnbGUsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogc2hvd0VsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhzaG93ID0gZnVuY3Rpb24geHNob3cob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8qKiBoaWRlRWxlbWVudCBhcyBhIGpRdWVyeSBtZXRob2Q6IHhoaWRlXHJcbiAgICAgICAgICAgICAqKi9cclxuICAgICAgICAgICAgalF1ZXJ5LmZuLnhoaWRlID0gZnVuY3Rpb24geGhpZGUob3B0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgaGlkZUVsZW1lbnQodGhpcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEV4cG9ydGluZzpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0b2dnbGVFbGVtZW50OiB0b2dnbGVFbGVtZW50LFxyXG4gICAgICAgICAgICBzaG93RWxlbWVudDogc2hvd0VsZW1lbnQsXHJcbiAgICAgICAgICAgIGhpZGVFbGVtZW50OiBoaWRlRWxlbWVudCxcclxuICAgICAgICAgICAgcGx1Z0luOiBwbHVnSW5cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1vZHVsZVxyXG4gICAgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIHh0c2gpO1xyXG4gICAgfSBlbHNlIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICAgICAgdmFyIGpRdWVyeSA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0geHRzaChqUXVlcnkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBOb3JtYWwgc2NyaXB0IGxvYWQsIGlmIGpRdWVyeSBpcyBnbG9iYWwgKGF0IHdpbmRvdyksIGl0cyBleHRlbmRlZCBhdXRvbWF0aWNhbGx5ICAgICAgICBcclxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdy5qUXVlcnkgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICB4dHNoKHdpbmRvdy5qUXVlcnkpLnBsdWdJbih3aW5kb3cualF1ZXJ5KTtcclxuICAgIH1cclxuXHJcbn0pKCk7Iiwi77u/LyogU29tZSB1dGlsaXRpZXMgZm9yIHVzZSB3aXRoIGpRdWVyeSBvciBpdHMgZXhwcmVzc2lvbnNcclxuICAgIHRoYXQgYXJlIG5vdCBwbHVnaW5zLlxyXG4qL1xyXG5mdW5jdGlvbiBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKHN0cikge1xyXG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWyAjOyYsLisqflxcJzpcIiFeJFtcXF0oKT0+fFxcL10pL2csICdcXFxcJDEnKTtcclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICAgICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZTogZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZVxyXG4gICAgfTtcclxuIiwi77u/ZnVuY3Rpb24gbW92ZUZvY3VzVG8oZWwsIG9wdGlvbnMpIHtcclxuICAgIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgbWFyZ2luVG9wOiAzMCxcclxuICAgICAgICBkdXJhdGlvbjogNTAwXHJcbiAgICB9LCBvcHRpb25zKTtcclxuICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogJChlbCkub2Zmc2V0KCkudG9wIC0gb3B0aW9ucy5tYXJnaW5Ub3AgfSwgb3B0aW9ucy5kdXJhdGlvbiwgbnVsbCk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBtb3ZlRm9jdXNUbztcclxufSIsIu+7vy8qKiBDdXN0b20gTG9jb25vbWljcyAnbGlrZSBibG9ja1VJJyBwb3B1cHNcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnLi9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUsXHJcbiAgICBhdXRvRm9jdXMgPSByZXF1aXJlKCcuL2F1dG9Gb2N1cycpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJy4vanF1ZXJ5Lnh0c2gnKS5wbHVnSW4oJCk7XHJcblxyXG5mdW5jdGlvbiBzbW9vdGhCb3hCbG9jayhjb250ZW50Qm94LCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykge1xyXG4gICAgLy8gTG9hZCBvcHRpb25zIG92ZXJ3cml0aW5nIGRlZmF1bHRzXHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge1xyXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcclxuICAgICAgICBjZW50ZXI6IGZhbHNlLFxyXG4gICAgICAgIC8qIGFzIGEgdmFsaWQgb3B0aW9ucyBwYXJhbWV0ZXIgZm9yIExDLmhpZGVFbGVtZW50IGZ1bmN0aW9uICovXHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiA2MDAsXHJcbiAgICAgICAgICAgIGVmZmVjdDogJ2ZhZGUnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvZm9jdXM6IHRydWUsXHJcbiAgICAgICAgYXV0b2ZvY3VzT3B0aW9uczogeyBtYXJnaW5Ub3A6IDYwIH0sXHJcbiAgICAgICAgd2lkdGg6ICdhdXRvJ1xyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgY29udGVudEJveCA9ICQoY29udGVudEJveCk7XHJcbiAgICB2YXIgZnVsbCA9IGZhbHNlO1xyXG4gICAgaWYgKGJsb2NrZWQgPT0gZG9jdW1lbnQgfHwgYmxvY2tlZCA9PSB3aW5kb3cpIHtcclxuICAgICAgICBibG9ja2VkID0gJCgnYm9keScpO1xyXG4gICAgICAgIGZ1bGwgPSB0cnVlO1xyXG4gICAgfSBlbHNlXHJcbiAgICAgICAgYmxvY2tlZCA9ICQoYmxvY2tlZCk7XHJcblxyXG4gICAgdmFyIGJveEluc2lkZUJsb2NrZWQgPSAhYmxvY2tlZC5pcygnYm9keSx0cix0aGVhZCx0Ym9keSx0Zm9vdCx0YWJsZSx1bCxvbCxkbCcpO1xyXG5cclxuICAgIC8vIEdldHRpbmcgYm94IGVsZW1lbnQgaWYgZXhpc3RzIGFuZCByZWZlcmVuY2luZ1xyXG4gICAgdmFyIGJJRCA9IGJsb2NrZWQuZGF0YSgnc21vb3RoLWJveC1ibG9jay1pZCcpO1xyXG4gICAgaWYgKCFiSUQpXHJcbiAgICAgICAgYklEID0gKGNvbnRlbnRCb3guYXR0cignaWQnKSB8fCAnJykgKyAoYmxvY2tlZC5hdHRyKCdpZCcpIHx8ICcnKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgaWYgKGJJRCA9PSAnLXNtb290aEJveEJsb2NrJykge1xyXG4gICAgICAgIGJJRCA9ICdpZC0nICsgZ3VpZEdlbmVyYXRvcigpICsgJy1zbW9vdGhCb3hCbG9jayc7XHJcbiAgICB9XHJcbiAgICBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnLCBiSUQpO1xyXG4gICAgdmFyIGJveCA9ICQoJyMnICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShiSUQpKTtcclxuICAgIFxyXG4gICAgLy8gSGlkaW5nL2Nsb3NpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcblxyXG4gICAgICAgIGJveC54aGlkZShvcHRpb25zLmNsb3NlT3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIFJlc3RvcmluZyB0aGUgQ1NTIHBvc2l0aW9uIGF0dHJpYnV0ZSBvZiB0aGUgYmxvY2tlZCBlbGVtZW50XHJcbiAgICAgICAgLy8gdG8gYXZvaWQgc29tZSBwcm9ibGVtcyB3aXRoIGxheW91dCBvbiBzb21lIGVkZ2UgY2FzZXMgYWxtb3N0XHJcbiAgICAgICAgLy8gdGhhdCBtYXkgYmUgbm90IGEgcHJvYmxlbSBkdXJpbmcgYmxvY2tpbmcgYnV0IHdoZW4gdW5ibG9ja2VkLlxyXG4gICAgICAgIHZhciBwcmV2ID0gYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJyk7XHJcbiAgICAgICAgYmxvY2tlZC5jc3MoJ3Bvc2l0aW9uJywgcHJldiB8fCAnJyk7XHJcbiAgICAgICAgYmxvY2tlZC5kYXRhKCdzYmItcHJldmlvdXMtY3NzLXBvc2l0aW9uJywgbnVsbCk7XHJcblxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICBib3hjXHJcbiAgICAgICAgLm9uKCdjbGljaycsICcuY2xvc2UtYWN0aW9uJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBudWxsLCBib3guZGF0YSgnbW9kYWwtYm94LW9wdGlvbnMnKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcsIHRydWUpO1xyXG4gICAgYm94Yy5hcHBlbmQoY29udGVudEJveCk7XHJcbiAgICBib3hjLndpZHRoKG9wdGlvbnMud2lkdGgpO1xyXG4gICAgYm94LmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuICAgIGlmIChib3hJbnNpZGVCbG9ja2VkKSB7XHJcbiAgICAgICAgLy8gQm94IHBvc2l0aW9uaW5nIHNldHVwIHdoZW4gaW5zaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQ6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIGJsb2NrZWQuY3NzKCd6LWluZGV4JykgKyAxMCk7XHJcbiAgICAgICAgaWYgKCFibG9ja2VkLmNzcygncG9zaXRpb24nKSB8fCBibG9ja2VkLmNzcygncG9zaXRpb24nKSA9PSAnc3RhdGljJykge1xyXG4gICAgICAgICAgICBibG9ja2VkLmRhdGEoJ3NiYi1wcmV2aW91cy1jc3MtcG9zaXRpb24nLCBibG9ja2VkLmNzcygncG9zaXRpb24nKSk7XHJcbiAgICAgICAgICAgIGJsb2NrZWQuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJveGMuY3NzKCd0b3AnLCBjdCAtIGJveGMub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyKTtcclxuICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07Iiwi77u/LyoqXHJcbiAgSXQgdG9nZ2xlcyBhIGdpdmVuIHZhbHVlIHdpdGggdGhlIG5leHQgaW4gdGhlIGdpdmVuIGxpc3QsXHJcbiAgb3IgdGhlIGZpcnN0IGlmIGlzIHRoZSBsYXN0IG9yIG5vdCBtYXRjaGVkLlxyXG4gIFRoZSByZXR1cm5lZCBmdW5jdGlvbiBjYW4gYmUgdXNlZCBkaXJlY3RseSBvciBcclxuICBjYW4gYmUgYXR0YWNoZWQgdG8gYW4gYXJyYXkgKG9yIGFycmF5IGxpa2UpIG9iamVjdCBhcyBtZXRob2RcclxuICAob3IgdG8gYSBwcm90b3R5cGUgYXMgQXJyYXkucHJvdG90eXBlKSBhbmQgdXNlIGl0IHBhc3NpbmdcclxuICBvbmx5IHRoZSBmaXJzdCBhcmd1bWVudC5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9nZ2xlKGN1cnJlbnQsIGVsZW1lbnRzKSB7XHJcbiAgaWYgKHR5cGVvZiAoZWxlbWVudHMpID09PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICB0eXBlb2YgKHRoaXMubGVuZ3RoKSA9PT0gJ251bWJlcicpXHJcbiAgICBlbGVtZW50cyA9IHRoaXM7XHJcblxyXG4gIHZhciBpID0gZWxlbWVudHMuaW5kZXhPZihjdXJyZW50KTtcclxuICBpZiAoaSA+IC0xICYmIGkgPCBlbGVtZW50cy5sZW5ndGggLSAxKVxyXG4gICAgcmV0dXJuIGVsZW1lbnRzW2kgKyAxXTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZWxlbWVudHNbMF07XHJcbn07XHJcbiIsIu+7vy8qKlxyXG4gICAgVXNlciBwcml2YXRlIGRhc2hib2FyZCBzZWN0aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG52YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnTEMvYWpheEZvcm1zJyk7XHJcblxyXG4vLyBDb2RlIG9uIHBhZ2UgcmVhZHlcclxuJChmdW5jdGlvbiAoKSB7XHJcbiAgICAvKiBTaWRlYmFyICovXHJcbiAgICB2YXIgXHJcbiAgICB0b2dnbGUgPSByZXF1aXJlKCcuLi9MQy90b2dnbGUnKSxcclxuICAgIFByb3ZpZGVyUG9zaXRpb24gPSByZXF1aXJlKCcuLi9MQy9Qcm92aWRlclBvc2l0aW9uJyk7XHJcbiAgICAvLyBBdHRhY2hpbmcgJ2NoYW5nZSBwb3NpdGlvbicgYWN0aW9uIHRvIHRoZSBzaWRlYmFyIGxpbmtzXHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnW2hyZWYgPSBcIiN0b2dnbGVQb3NpdGlvblN0YXRlXCJdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBcclxuICAgICAgJHQgPSAkKHRoaXMpLFxyXG4gICAgICB2ID0gJHQudGV4dCgpLFxyXG4gICAgICBuID0gdG9nZ2xlKHYsIFsnb24nLCAnb2ZmJ10pLFxyXG4gICAgICBwb3NpdGlvbklkID0gJHQuY2xvc2VzdCgnW2RhdGEtcG9zaXRpb24taWRdJykuZGF0YSgncG9zaXRpb24taWQnKTtcclxuXHJcbiAgICAgICAgdmFyIHBvcyA9IG5ldyBQcm92aWRlclBvc2l0aW9uKHBvc2l0aW9uSWQpO1xyXG4gICAgICAgIHBvc1xyXG4gICAgLm9uKHBvcy5zdGF0ZUNoYW5nZWRFdmVudCwgZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgICAgJHQudGV4dChzdGF0ZSk7XHJcbiAgICB9KVxyXG4gICAgLmNoYW5nZVN0YXRlKG4pO1xyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KVxyXG4gICAgLm9uKCdjbGljaycsICcuZGVsZXRlLXBvc2l0aW9uIGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uSWQgPSAkKHRoaXMpLmNsb3Nlc3QoJ1tkYXRhLXBvc2l0aW9uLWlkXScpLmRhdGEoJ3Bvc2l0aW9uLWlkJyk7XHJcbiAgICAgICAgdmFyIHBvcyA9IG5ldyBQcm92aWRlclBvc2l0aW9uKHBvc2l0aW9uSWQpO1xyXG5cclxuICAgICAgICBwb3NcclxuICAgIC5vbihwb3MucmVtb3ZlZEV2ZW50LCBmdW5jdGlvbiAobXNnKSB7XHJcbiAgICAgICAgLy8gQ3VycmVudCBwb3NpdGlvbiBwYWdlIGRvZXNuJ3QgZXhpc3QgYW55bW9yZSwgb3V0IVxyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC95b3VyLXdvcmsvJztcclxuICAgIH0pXHJcbiAgICAucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8qIFByb21vdGUgKi9cclxuICAgIHZhciBnZW5lcmF0ZUJvb2tOb3dCdXR0b24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9nZW5lcmF0ZUJvb2tOb3dCdXR0b24nKTtcclxuICAgIC8vIExpc3RlbiBvbiBEYXNoYm9hcmRQcm9tb3RlIGluc3RlYWQgb2YgdGhlIG1vcmUgY2xvc2UgY29udGFpbmVyIERhc2hib2FyZEJvb2tOb3dCdXR0b25cclxuICAgIC8vIGFsbG93cyB0byBjb250aW51ZSB3b3JraW5nIHdpdGhvdXQgcmUtYXR0YWNobWVudCBhZnRlciBodG1sLWFqYXgtcmVsb2FkcyBmcm9tIGFqYXhGb3JtLlxyXG4gICAgZ2VuZXJhdGVCb29rTm93QnV0dG9uLm9uKCcuRGFzaGJvYXJkUHJvbW90ZScpOyAvLycuRGFzaGJvYXJkQm9va05vd0J1dHRvbidcclxuXHJcbiAgICAvKiBQcml2YWN5ICovXHJcbiAgICB2YXIgcHJpdmFjeVNldHRpbmdzID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpdmFjeVNldHRpbmdzJyk7XHJcbiAgICBwcml2YWN5U2V0dGluZ3Mub24oJy5EYXNoYm9hcmRQcml2YWN5Jyk7XHJcblxyXG4gICAgLyogUGF5bWVudHMgKi9cclxuICAgIHZhciBwYXltZW50QWNjb3VudCA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL3BheW1lbnRBY2NvdW50Jyk7XHJcbiAgICBwYXltZW50QWNjb3VudC5vbignLkRhc2hib2FyZFBheW1lbnRzJyk7XHJcblxyXG4gICAgLyogYWJvdXQteW91ICovXHJcbiAgICAkKCdodG1sJykub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJy5EYXNoYm9hcmRBYm91dFlvdSBmb3JtLmFqYXgnLCBpbml0QWJvdXRZb3UpO1xyXG4gICAgaW5pdEFib3V0WW91KCk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIGluaXQgKi9cclxuICAgICQoJ2h0bWwnKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnLkRhc2hib2FyZFlvdXJXb3JrIGZvcm0uYWpheCcsIGluaXRZb3VyV29ya0RvbSk7XHJcbiAgICBpbml0WW91cldvcmtEb20oKTtcclxuXHJcbiAgICAvKiBBdmFpbGFiaWx0eSAqL1xyXG4gICAgaW5pdEF2YWlsYWJpbGl0eSgpO1xyXG4gICAgJCgnLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpLm9uKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIGluaXRBdmFpbGFiaWxpdHkpO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gICAgSW5zdGFudCBzYXZpbmcgYW5kIGNvcnJlY3QgY2hhbmdlcyB0cmFja2luZ1xyXG4qKi9cclxuZnVuY3Rpb24gc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oc2VjdGlvblNlbGVjdG9yKSB7XHJcblxyXG4gICAgdmFyICRzZWN0aW9uID0gJChzZWN0aW9uU2VsZWN0b3IpO1xyXG5cclxuICAgIGlmICgkc2VjdGlvbi5kYXRhKCdpbnN0YW50LXNhdmluZycpKSB7XHJcbiAgICAgICAgJHNlY3Rpb24ub24oJ2NoYW5nZScsICc6aW5wdXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGFqYXhGb3Jtcy5kb0luc3RhbnRTYXZpbmcoJHNlY3Rpb24sIFt0aGlzXSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRBYm91dFlvdSgpIHtcclxuICAgIC8qIFByb2ZpbGUgcGhvdG8gKi9cclxuICAgIHZhciBjaGFuZ2VQcm9maWxlUGhvdG8gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9jaGFuZ2VQcm9maWxlUGhvdG8nKTtcclxuICAgIGNoYW5nZVByb2ZpbGVQaG90by5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gICAgLyogQWJvdXQgeW91IC8gZWR1Y2F0aW9uICovXHJcbiAgICB2YXIgZWR1Y2F0aW9uID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvZWR1Y2F0aW9uQ3J1ZGwnKTtcclxuICAgIGVkdWNhdGlvbi5vbignLkRhc2hib2FyZEFib3V0WW91Jyk7XHJcblxyXG4gICAgLyogQWJvdXQgeW91IC8gdmVyaWZpY2F0aW9ucyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvdmVyaWZpY2F0aW9uc0FjdGlvbnMnKS5vbignLkRhc2hib2FyZFZlcmlmaWNhdGlvbnMnKTtcclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNDcnVkbCcpLm9uKCcuRGFzaGJvYXJkQWJvdXRZb3UnKTtcclxuXHJcbiAgICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gICAgc2V0SW5zdGFudFNhdmluZ1NlY3Rpb24oJy5EYXNoYm9hcmRQdWJsaWNCaW8nKTtcclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkUGVyc29uYWxXZWJzaXRlJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluaXRBdmFpbGFiaWxpdHkoZSkge1xyXG4gIC8vIFdlIG5lZWQgdG8gYXZvaWQgdGhpcyBsb2dpYyB3aGVuIGFuIGV2ZW50IGJ1YmJsZVxyXG4gIC8vIGZyb20gdGhlIGFueSBmaWVsZHNldC5hamF4LCBiZWNhdXNlIGl0cyBhIHN1YmZvcm0gZXZlbnRcclxuICAvLyBhbmQgbXVzdCBub3QgcmVzZXQgdGhlIG1haW4gZm9ybSAoIzUwNClcclxuICBpZiAoZSAmJiBlLnRhcmdldCAmJiAvZmllbGRzZXQvaS50ZXN0KGUudGFyZ2V0Lm5vZGVOYW1lKSlcclxuICAgIHJldHVybjtcclxuXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbW9udGhseVNjaGVkdWxlJykub24oKTtcclxuICB2YXIgd2Vla2x5ID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvd2Vla2x5U2NoZWR1bGUnKS5vbigpO1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2NhbGVuZGFyU3luYycpLm9uKCk7XHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvYXBwb2ludG1lbnRzQ3J1ZGwnKS5vbignLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpO1xyXG5cclxuICAvLyBJbnN0YW50IHNhdmluZ1xyXG4gIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkV2Vla2x5U2NoZWR1bGUnKTtcclxuICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZE1vbnRobHlTY2hlZHVsZScpO1xyXG4gIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gIEluaXRpYWxpemUgRG9tIGVsZW1lbnRzIGFuZCBldmVudHMgaGFuZGxlcnMgZm9yIFlvdXItd29yayBsb2dpYy5cclxuXHJcbiAgTk9URTogLkRhc2hib2FyZFlvdXJXb3JrIGlzIGFuIGFqYXgtYm94IHBhcmVudCBvZiB0aGUgZm9ybS5hamF4LCBldmVyeSBzZWN0aW9uXHJcbiAgaXMgaW5zaWRlIHRoZSBmb3JtIGFuZCByZXBsYWNlZCBvbiBodG1sIHJldHVybmVkIGZyb20gc2VydmVyLlxyXG4qKi9cclxuZnVuY3Rpb24gaW5pdFlvdXJXb3JrRG9tKCkge1xyXG4gICAgLyogWW91ciB3b3JrIC8gcHJpY2luZyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvcHJpY2luZ0NydWRsJykub24oKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBzZXJ2aWNlcyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvc2VydmljZUF0dHJpYnV0ZXNWYWxpZGF0aW9uJykuc2V0dXAoJCgnLkRhc2hib2FyZFlvdXJXb3JrIGZvcm0nKSk7XHJcbiAgICAvLyBJbnN0YW50IHNhdmluZyBhbmQgY29ycmVjdCBjaGFuZ2VzIHRyYWNraW5nXHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZFNlcnZpY2VzJyk7XHJcblxyXG4gICAgLyogWW91ciB3b3JrIC8gY2FuY2VsbGF0aW9uICovXHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZENhbmNlbGxhdGlvblBvbGljeScpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHNjaGVkdWxpbmcgKi9cclxuICAgIHNldEluc3RhbnRTYXZpbmdTZWN0aW9uKCcuRGFzaGJvYXJkU2NoZWR1bGluZ09wdGlvbnMnKTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBsb2NhdGlvbnMgKi9cclxuICAgIHJlcXVpcmUoJy4vZGFzaGJvYXJkL2xvY2F0aW9uc0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIGxpY2Vuc2VzICovXHJcbiAgICByZXF1aXJlKCcuL2Rhc2hib2FyZC9saWNlbnNlc0NydWRsJykub24oJy5EYXNoYm9hcmRZb3VyV29yaycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHBob3RvcyAqL1xyXG4gICAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvbWFuYWdlUGhvdG9zVUknKS5vbignLkRhc2hib2FyZFlvdXJXb3JrJyk7XHJcbiAgICBzZXRJbnN0YW50U2F2aW5nU2VjdGlvbignLkRhc2hib2FyZFBob3RvcycpO1xyXG5cclxuICAgIC8qIFlvdXIgd29yayAvIHJldmlld3MgKi9cclxuICAgICQoJy5EYXNoYm9hcmRZb3VyV29yaycpLm9uKCdhamF4U3VjY2Vzc1Bvc3QnLCAnZm9ybScsIGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xyXG4gICAgICAgIC8vIFJlc2V0aW5nIHRoZSBlbWFpbCBhZGRyZXNzZXMgb24gc3VjY2VzcyB0byBhdm9pZCByZXNlbmQgYWdhaW4gbWVzc2FnZXMgYmVjYXVzZVxyXG4gICAgICAgIC8vIG1pc3Rha2Ugb2YgYSBzZWNvbmQgc3VibWl0LlxyXG4gICAgICAgIHZhciB0YiA9ICQoJy5EYXNoYm9hcmRSZXZpZXdzIFtuYW1lPWNsaWVudHNlbWFpbHNdJyk7XHJcbiAgICAgICAgLy8gT25seSBpZiB0aGVyZSB3YXMgYSB2YWx1ZTpcclxuICAgICAgICBpZiAodGIudmFsKCkpIHtcclxuICAgICAgICAgICAgdGJcclxuICAgICAgLnZhbCgnJylcclxuICAgICAgLmF0dHIoJ3BsYWNlaG9sZGVyJywgdGIuZGF0YSgnc3VjY2Vzcy1tZXNzYWdlJykpXHJcbiAgICAgICAgICAgIC8vIHN1cHBvcnQgZm9yIElFLCAnbm9uLXBsYWNlaG9sZGVyLWJyb3dzZXJzJ1xyXG4gICAgICAucGxhY2Vob2xkZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvKiBZb3VyIHdvcmsgLyBhZGQtcG9zaXRpb24gKi9cclxuICAgIHZhciBhZGRQb3NpdGlvbiA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2FkZFBvc2l0aW9uJyk7XHJcbiAgICBhZGRQb3NpdGlvbi5pbml0KCcuRGFzaGJvYXJkQWRkUG9zaXRpb24nKTtcclxuICAgICQoJ2JvZHknKS5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnLkRhc2hib2FyZEFkZFBvc2l0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGFkZFBvc2l0aW9uLmluaXQoKTtcclxuICAgIH0pO1xyXG59Iiwi77u/LyoqXHJcbiogQWRkIFBvc2l0aW9uOiBsb2dpYyBmb3IgdGhlIGFkZC1wb3NpdGlvbiBwYWdlIHVuZGVyIC9kYXNoYm9hcmQveW91ci13b3JrLzAvLFxyXG4gIHdpdGggYXV0b2NvbXBsZXRlLCBwb3NpdGlvbiBkZXNjcmlwdGlvbiBhbmQgJ2FkZGVkIHBvc2l0aW9ucycgbGlzdC5cclxuXHJcbiAgVE9ETzogQ2hlY2sgaWYgaXMgbW9yZSBjb252ZW5pZW50IGEgcmVmYWN0b3IgYXMgcGFydCBvZiBMQy9Qcm92aWRlclBvc2l0aW9uLmpzXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBzZWxlY3RvcnMgPSB7XHJcbiAgbGlzdDogJy5EYXNoYm9hcmRBZGRQb3NpdGlvbi1wb3NpdGlvbnNMaXN0JyxcclxuICBzZWxlY3RQb3NpdGlvbjogJy5EYXNoYm9hcmRBZGRQb3NpdGlvbi1zZWxlY3RQb3NpdGlvbicsXHJcbiAgZGVzYzogJy5EYXNoYm9hcmRBZGRQb3NpdGlvbi1zZWxlY3RQb3NpdGlvbi1kZXNjcmlwdGlvbidcclxufTtcclxuXHJcbmV4cG9ydHMuaW5pdCA9IGZ1bmN0aW9uIGluaXRBZGRQb3NpdGlvbihzZWxlY3Rvcikge1xyXG4gIHNlbGVjdG9yID0gc2VsZWN0b3IgfHwgJy5EYXNoYm9hcmRBZGRQb3NpdGlvbic7XHJcbiAgdmFyIGMgPSAkKHNlbGVjdG9yKTtcclxuXHJcbiAgLy8gVGVtcGxhdGUgcG9zaXRpb24gaXRlbSB2YWx1ZSBtdXN0IGJlIHJlc2V0IG9uIGluaXQgKGJlY2F1c2Ugc29tZSBmb3JtLXJlY292ZXJpbmcgYnJvd3NlciBmZWF0dXJlcyB0aGF0IHB1dCBvbiBpdCBiYWQgdmFsdWVzKVxyXG4gIGMuZmluZChzZWxlY3RvcnMubGlzdCArICcgbGkuaXMtdGVtcGxhdGUgW25hbWU9cG9zaXRpb25dJykudmFsKCcnKTtcclxuXHJcbiAgLy8gQXV0b2NvbXBsZXRlIHBvc2l0aW9ucyBhbmQgYWRkIHRvIHRoZSBsaXN0XHJcbiAgdmFyIHBvc2l0aW9uc0xpc3QgPSBudWxsLCB0cGwgPSBudWxsO1xyXG4gIHZhciBwb3NpdGlvbnNBdXRvY29tcGxldGUgPSBjLmZpbmQoJy5EYXNoYm9hcmRBZGRQb3NpdGlvbi1zZWxlY3RQb3NpdGlvbi1zZWFyY2gnKS5hdXRvY29tcGxldGUoe1xyXG4gICAgc291cmNlOiBMY1VybC5Kc29uUGF0aCArICdHZXRQb3NpdGlvbnMvQXV0b2NvbXBsZXRlLycsXHJcbiAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgbWluTGVuZ3RoOiAwLFxyXG4gICAgc2VsZWN0OiBmdW5jdGlvbiAoZXZlbnQsIHVpKSB7XHJcblxyXG4gICAgICBwb3NpdGlvbnNMaXN0ID0gcG9zaXRpb25zTGlzdCB8fCBjLmZpbmQoc2VsZWN0b3JzLmxpc3QgKyAnID4gdWwnKTtcclxuICAgICAgdHBsID0gdHBsIHx8IHBvc2l0aW9uc0xpc3QuY2hpbGRyZW4oJy5pcy10ZW1wbGF0ZTplcSgwKScpO1xyXG4gICAgICAvLyBObyB2YWx1ZSwgbm8gYWN0aW9uIDooXHJcbiAgICAgIGlmICghdWkgfHwgIXVpLml0ZW0gfHwgIXVpLml0ZW0udmFsdWUpIHJldHVybjtcclxuXHJcbiAgICAgIC8vIEFkZCBpZiBub3QgZXhpc3RzIGluIHRoZSBsaXN0XHJcbiAgICAgIGlmIChwb3NpdGlvbnNMaXN0LmNoaWxkcmVuKCkuZmlsdGVyKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gJCh0aGlzKS5kYXRhKCdwb3NpdGlvbi1pZCcpID09IHVpLml0ZW0udmFsdWU7XHJcbiAgICAgIH0pLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgIC8vIENyZWF0ZSBpdGVtIGZyb20gdGVtcGxhdGU6XHJcbiAgICAgICAgcG9zaXRpb25zTGlzdC5hcHBlbmQodHBsLmNsb25lKClcclxuICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lzLXRlbXBsYXRlJylcclxuICAgICAgICAgICAgICAgICAgICAuZGF0YSgncG9zaXRpb24taWQnLCB1aS5pdGVtLnZhbHVlKVxyXG4gICAgICAgICAgICAgICAgICAgIC5jaGlsZHJlbignLm5hbWUnKS50ZXh0KHVpLml0ZW0ucG9zaXRpb25TaW5ndWxhcikgLy8gLmxhYmVsXHJcbiAgICAgICAgICAgICAgICAgICAgLmVuZCgpLmNoaWxkcmVuKCdbbmFtZT1wb3NpdGlvbl0nKS52YWwodWkuaXRlbS52YWx1ZSlcclxuICAgICAgICAgICAgICAgICAgICAuZW5kKCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjLmZpbmQoc2VsZWN0b3JzLmRlc2MgKyAnID4gdGV4dGFyZWEnKS52YWwodWkuaXRlbS5kZXNjcmlwdGlvbik7XHJcblxyXG4gICAgICAvLyBXZSB3YW50IHNob3cgdGhlIGxhYmVsIChwb3NpdGlvbiBuYW1lKSBpbiB0aGUgdGV4dGJveCwgbm90IHRoZSBpZC12YWx1ZVxyXG4gICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG4gICAgZm9jdXM6IGZ1bmN0aW9uIChldmVudCwgdWkpIHtcclxuICAgICAgaWYgKCF1aSB8fCAhdWkuaXRlbSB8fCAhdWkuaXRlbS5wb3NpdGlvblNpbmd1bGFyKTtcclxuICAgICAgLy8gV2Ugd2FudCB0aGUgbGFiZWwgaW4gdGV4dGJveCwgbm90IHRoZSB2YWx1ZVxyXG4gICAgICAkKHRoaXMpLnZhbCh1aS5pdGVtLnBvc2l0aW9uU2luZ3VsYXIpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIExvYWQgYWxsIHBvc2l0aW9ucyBpbiBiYWNrZ3JvdW5kIHRvIHJlcGxhY2UgdGhlIGF1dG9jb21wbGV0ZSBzb3VyY2UgKGF2b2lkaW5nIG11bHRpcGxlLCBzbG93IGxvb2stdXBzKVxyXG4gIC8qJC5nZXRKU09OKExjVXJsLkpzb25QYXRoICsgJ0dldFBvc2l0aW9ucy9BdXRvY29tcGxldGUvJyxcclxuICBmdW5jdGlvbiAoZGF0YSkge1xyXG4gIHBvc2l0aW9uc0F1dG9jb21wbGV0ZS5hdXRvY29tcGxldGUoJ29wdGlvbicsICdzb3VyY2UnLCBkYXRhKTtcclxuICB9XHJcbiAgKTsqL1xyXG5cclxuICAvLyBTaG93IGF1dG9jb21wbGV0ZSBvbiAncGx1cycgYnV0dG9uXHJcbiAgYy5maW5kKHNlbGVjdG9ycy5zZWxlY3RQb3NpdGlvbiArICcgLmFkZC1hY3Rpb24nKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICBwb3NpdGlvbnNBdXRvY29tcGxldGUuYXV0b2NvbXBsZXRlKCdzZWFyY2gnLCAnJyk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG4gIC8vIFJlbW92ZSBwb3NpdGlvbnMgZnJvbSB0aGUgbGlzdFxyXG4gIGMuZmluZChzZWxlY3RvcnMubGlzdCArICcgPiB1bCcpLm9uKCdjbGljaycsICdsaSA+IGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgJHQgPSAkKHRoaXMpO1xyXG4gICAgaWYgKCR0LmF0dHIoJ2hyZWYnKSA9PSAnI3JlbW92ZS1wb3NpdGlvbicpIHtcclxuICAgICAgLy8gUmVtb3ZlIGNvbXBsZXRlIGVsZW1lbnQgZnJvbSB0aGUgbGlzdCAobGFiZWwgYW5kIGhpZGRlbiBmb3JtIHZhbHVlKVxyXG4gICAgICAkdC5wYXJlbnQoKS5yZW1vdmUoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufTtcclxuIiwi77u/LyoqIEF2YWlsYWJpbGl0eTogY2FsZW5kYXIgYXBwb2ludG1lbnRzIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcblxyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpLFxyXG4gICAgY3J1ZGxTZWxlY3RvciA9ICcuRGFzaGJvYXJkQXBwb2ludG1lbnRzJyxcclxuICAgICRjcnVkbENvbnRhaW5lciA9ICRjLmZpbmQoY3J1ZGxTZWxlY3RvcikuY2xvc2VzdCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uJyksXHJcbiAgICAkb3RoZXJzID0gJGNydWRsQ29udGFpbmVyLnNpYmxpbmdzKClcclxuICAgICAgICAuYWRkKCRjcnVkbENvbnRhaW5lci5maW5kKCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24taW50cm9kdWN0aW9uJykpXHJcbiAgICAgICAgLmFkZCgkY3J1ZGxDb250YWluZXIuY2xvc2VzdCgnLkRhc2hib2FyZEF2YWlsYWJpbGl0eScpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwoY3J1ZGxTZWxlY3Rvcik7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsIGVkaXRvcikge1xyXG4gICAgLy8gRG9uZSBhZnRlciBhIHNtYWxsIGRlbGF5IHRvIGxldCB0aGUgZWRpdG9yIGJlIHZpc2libGVcclxuICAgIC8vIGFuZCBzZXR1cCB3b3JrIGFzIGV4cGVjdGVkXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgZWRpdEZvcm1TZXR1cChlZGl0b3IpO1xyXG4gICAgfSwgMTAwKTtcclxuICB9KTtcclxuXHJcbn07XHJcblxyXG5mdW5jdGlvbiBlZGl0Rm9ybVNldHVwKGYpIHtcclxuICB2YXIgcmVwZWF0ID0gZi5maW5kKCdbbmFtZT1yZXBlYXRdJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZi5maW5kKCcucmVwZWF0LW9wdGlvbnMnKTtcclxuICAgIGlmICh0aGlzLmNoZWNrZWQpXHJcbiAgICAgIGEuc2xpZGVEb3duKCdmYXN0Jyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGEuc2xpZGVVcCgnZmFzdCcpO1xyXG4gIH0pO1xyXG4gIHZhciBhbGxkYXkgPSBmLmZpbmQoJ1tuYW1lPWFsbGRheV0nKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGEgPSBmXHJcbiAgICAuZmluZCgnW25hbWU9c3RhcnR0aW1lXSxbbmFtZT1lbmR0aW1lXScpXHJcbiAgICAucHJvcCgnZGlzYWJsZWQnLCB0aGlzLmNoZWNrZWQpO1xyXG4gICAgaWYgKHRoaXMuY2hlY2tlZClcclxuICAgICAgYS5oaWRlKCdmYXN0Jyk7XHJcbiAgICBlbHNlXHJcbiAgICAgIGEuc2hvdygnZmFzdCcpO1xyXG4gIH0pO1xyXG4gIHZhciByZXBlYXRGcmVxdWVuY3kgPSBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1mcmVxdWVuY3ldJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBmcmVxID0gJCh0aGlzKS5jaGlsZHJlbignOnNlbGVjdGVkJyk7XHJcbiAgICB2YXIgdW5pdCA9IGZyZXEuZGF0YSgndW5pdCcpO1xyXG4gICAgZlxyXG4gICAgLmZpbmQoJy5yZXBlYXQtZnJlcXVlbmN5LXVuaXQnKVxyXG4gICAgLnRleHQodW5pdCk7XHJcbiAgICAvLyBJZiB0aGVyZSBpcyBubyB1bml0LCB0aGVyZSBpcyBub3QgaW50ZXJ2YWwvcmVwZWF0LWV2ZXJ5IGZpZWxkOlxyXG4gICAgdmFyIGludGVydmFsID0gZi5maW5kKCcucmVwZWF0LWV2ZXJ5Jyk7XHJcbiAgICBpZiAodW5pdClcclxuICAgICAgaW50ZXJ2YWwuc2hvdygnZmFzdCcpO1xyXG4gICAgZWxzZVxyXG4gICAgICBpbnRlcnZhbC5oaWRlKCdmYXN0Jyk7XHJcbiAgICAvLyBTaG93IGZyZXF1ZW5jeS1leHRyYSwgaWYgdGhlcmUgaXMgc29tZW9uZVxyXG4gICAgZi5maW5kKCcuZnJlcXVlbmN5LWV4dHJhLScgKyBmcmVxLnZhbCgpKS5zbGlkZURvd24oJ2Zhc3QnKTtcclxuICAgIC8vIEhpZGUgYWxsIG90aGVyIGZyZXF1ZW5jeS1leHRyYVxyXG4gICAgZi5maW5kKCcuZnJlcXVlbmN5LWV4dHJhOm5vdCguZnJlcXVlbmN5LWV4dHJhLScgKyBmcmVxLnZhbCgpICsgJyknKS5zbGlkZVVwKCdmYXN0Jyk7XHJcbiAgfSk7XHJcbiAgLy8gYXV0by1zZWxlY3Qgc29tZSBvcHRpb25zIHdoZW4gaXRzIHZhbHVlIGNoYW5nZVxyXG4gIGYuZmluZCgnW25hbWU9cmVwZWF0LW9jdXJyZW5jZXNdJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIGYuZmluZCgnW25hbWU9cmVwZWF0LWVuZHNdW3ZhbHVlPW9jdXJyZW5jZXNdJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gIH0pO1xyXG4gIGYuZmluZCgnW25hbWU9cmVwZWF0LWVuZC1kYXRlXScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XHJcbiAgICBmLmZpbmQoJ1tuYW1lPXJlcGVhdC1lbmRzXVt2YWx1ZT1kYXRlXScpLnByb3AoJ2NoZWNrZWQnLCB0cnVlKTtcclxuICB9KTtcclxuICAvLyBzdGFydC1kYXRlIHRyaWdnZXJcclxuICBmLmZpbmQoJ1tuYW1lPXN0YXJ0ZGF0ZV0nKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gYXV0byBmaWxsIGVuZGRhdGUgd2l0aCBzdGFydGRhdGUgd2hlbiB0aGlzIGxhc3QgaXMgdXBkYXRlZFxyXG4gICAgZi5maW5kKCdbbmFtZT1lbmRkYXRlXScpLnZhbCh0aGlzLnZhbHVlKTtcclxuICAgIC8vIGlmIG5vIHdlZWstZGF5cyBvciBvbmx5IG9uZSwgYXV0by1zZWxlY3QgdGhlIGRheSB0aGF0IG1hdGNocyBzdGFydC1kYXRlXHJcbiAgICB2YXIgd2Vla0RheXMgPSBmLmZpbmQoJy53ZWVrbHktZXh0cmEgLndlZWstZGF5cyBpbnB1dCcpO1xyXG4gICAgaWYgKHdlZWtEYXlzLmFyZSgnOmNoZWNrZWQnLCB7IHVudGlsOiAxIH0pKSB7XHJcbiAgICAgIHZhciBkYXRlID0gJCh0aGlzKS5kYXRlcGlja2VyKFwiZ2V0RGF0ZVwiKTtcclxuICAgICAgaWYgKGRhdGUpIHtcclxuICAgICAgICB3ZWVrRGF5cy5wcm9wKCdjaGVja2VkJywgZmFsc2UpO1xyXG4gICAgICAgIHdlZWtEYXlzLmZpbHRlcignW3ZhbHVlPScgKyBkYXRlLmdldERheSgpICsgJ10nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gSW5pdDpcclxuICByZXBlYXQuY2hhbmdlKCk7XHJcbiAgYWxsZGF5LmNoYW5nZSgpO1xyXG4gIHJlcGVhdEZyZXF1ZW5jeS5jaGFuZ2UoKTtcclxuICAvLyBhZGQgZGF0ZSBwaWNrZXJzXHJcbiAgYXBwbHlEYXRlUGlja2VyKCk7XHJcbiAgLy8gYWRkIHBsYWNlaG9sZGVyIHN1cHBvcnQgKHBvbHlmaWxsKVxyXG4gIGYuZmluZCgnOmlucHV0JykucGxhY2Vob2xkZXIoKTtcclxufSIsIu+7vy8qKlxyXG4gIFJlcXVlc3RpbmcgYSBiYWNrZ3JvdW5kIGNoZWNrIHRocm91Z2ggdGhlIGJhY2tncm91bmRDaGVja0VkaXQgZm9ybSBpbnNpZGUgYWJvdXQteW91L3ZlcmlmaWNhdGlvbnMuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLyoqXHJcbiAgU2V0dXAgdGhlIERPTSBlbGVtZW50cyBpbiB0aGUgY29udGFpbmVyIEAkY1xyXG4gIHdpdGggdGhlIGJhY2tncm91bmQtY2hlY2stcmVxdWVzdCBsb2dpYy5cclxuKiovXHJcbmV4cG9ydHMuc2V0dXBGb3JtID0gZnVuY3Rpb24gc2V0dXBGb3JtQmFja2dyb3VuZENoZWNrKCRjKSB7XHJcblxyXG4gIHZhciBzZWxlY3RlZEl0ZW0gPSBudWxsO1xyXG5cclxuICAkYy5vbignY2xpY2snLCAnLmJ1eS1hY3Rpb24nLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgXHJcbiAgICB2YXIgZiA9ICRjLmZpbmQoJy5EYXNoYm9hcmRCYWNrZ3JvdW5kQ2hlY2stcmVxdWVzdEZvcm0nKTtcclxuICAgIHZhciBiY2lkID0gJCh0aGlzKS5kYXRhKCdiYWNrZ3JvdW5kLWNoZWNrLWlkJyk7XHJcbiAgICBzZWxlY3RlZEl0ZW0gPSAkKHRoaXMpLmNsb3Nlc3QoJy5EYXNoYm9hcmRCYWNrZ3JvdW5kQ2hlY2staXRlbScpO1xyXG4gICAgdmFyIHBzMSA9ICRjLmZpbmQoJy5wb3B1cC5idXktc3RlcC0xJyk7XHJcblxyXG4gICAgZi5maW5kKCdbbmFtZT1CYWNrZ3JvdW5kQ2hlY2tJRF0nKS52YWwoYmNpZCk7XHJcbiAgICBmLmZpbmQoJy5tYWluLWFjdGlvbicpLnZhbCgkKHRoaXMpLnRleHQoKSk7XHJcblxyXG4gICAgc21vb3RoQm94QmxvY2sub3BlbihwczEsICRjLCAnYmFja2dyb3VuZC1jaGVjaycpO1xyXG4gIH0pO1xyXG5cclxuICAkYy5vbignYWpheFN1Y2Nlc3NQb3N0JywgJy5EYXNoYm9hcmRCYWNrZ3JvdW5kQ2hlY2stcmVxdWVzdEZvcm0nLCBmdW5jdGlvbiAoZSwgZGF0YSwgdGV4dCwgangsIGN0eCkge1xyXG4gICAgaWYgKGRhdGEuQ29kZSA9PT0gMTEwKSB7XHJcbiAgICAgIHZhciBwczIgPSAkYy5maW5kKCcucG9wdXAuYnV5LXN0ZXAtMicpO1xyXG4gICAgICB2YXIgYm94ID0gc21vb3RoQm94QmxvY2sub3BlbihwczIsICRjLCAnYmFja2dyb3VuZC1jaGVjaycpO1xyXG4gICAgICAvLyBSZW1vdmUgZnJvbSB0aGUgbGlzdCB0aGUgcmVxdWVzdGVkIGl0ZW1cclxuICAgICAgc2VsZWN0ZWRJdGVtLnJlbW92ZSgpO1xyXG4gICAgICAvLyBGb3JjZSB2aWV3ZXIgbGlzdCByZWxvYWRcclxuICAgICAgJGMudHJpZ2dlcigncmVsb2FkTGlzdCcpO1xyXG4gICAgICAvLyBJZiB0aGVyZSBpcyBubyBtb3JlIGl0ZW1zIGluIHRoZSBsaXN0OlxyXG4gICAgICBpZiAoJGMuZmluZCgnLkRhc2hib2FyZEJhY2tncm91bmRDaGVjay1pdGVtJykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgLy8gdGhlIGNsb3NlIGJ1dHRvbiBvbiB0aGUgcG9wdXAgbXVzdCBjbG9zZSB0aGUgZWRpdG9yIHRvbzpcclxuICAgICAgICBib3guZmluZCgnLmNsb3NlLWFjdGlvbicpLmFkZENsYXNzKCdjcnVkbC1jYW5jZWwnKTtcclxuICAgICAgICAvLyBUaGUgYWN0aW9uIGJveCBtdXN0IGRpc2FwcGVhclxyXG4gICAgICAgICRjLmNsb3Nlc3QoJy5jcnVkbCcpLmZpbmQoJy5CYWNrZ3JvdW5kQ2hlY2tBY3Rpb25Cb3gnKS5yZW1vdmUoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxufTsiLCLvu78vKiogQXZhaWxhYmlsaXR5OiBDYWxlbmRhciBTeW5jIHNlY3Rpb24gc2V0dXBcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgICBjb250YWluZXJTZWxlY3RvciA9IGNvbnRhaW5lclNlbGVjdG9yIHx8ICcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jJztcclxuICAgIHZhciBjb250YWluZXIgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgICAgICBmaWVsZFNlbGVjdG9yID0gJy5EYXNoYm9hcmRDYWxlbmRhclN5bmMtcHJpdmF0ZVVybEZpZWxkJyxcclxuICAgICAgICBidXR0b25TZWxlY3RvciA9ICcuRGFzaGJvYXJkQ2FsZW5kYXJTeW5jLXJlc2V0LWFjdGlvbic7XHJcblxyXG4gICAgLy8gU2VsZWN0aW5nIHByaXZhdGUtdXJsIGZpZWxkIHZhbHVlIG9uIGZvY3VzIGFuZCBjbGljazpcclxuICAgIGNvbnRhaW5lci5maW5kKGZpZWxkU2VsZWN0b3IpLm9uKCdmb2N1cyBjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNlbGVjdCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUmVzZXRpbmcgcHJpdmF0ZS11cmxcclxuICAgIGNvbnRhaW5lclxyXG4gIC5vbignY2xpY2snLCBidXR0b25TZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgdmFyIHQgPSAkKHRoaXMpLFxyXG4gICAgICB1cmwgPSB0LmF0dHIoJ2hyZWYnKSxcclxuICAgICAgZmllbGQgPSBjb250YWluZXIuZmluZChmaWVsZFNlbGVjdG9yKTtcclxuXHJcbiAgICAgIGZpZWxkLnZhbCgnJyk7XHJcblxyXG4gICAgICBmdW5jdGlvbiBvbmVycm9yKCkge1xyXG4gICAgICAgICAgZmllbGQudmFsKGZpZWxkLmRhdGEoJ2Vycm9yLW1lc3NhZ2UnKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgICQuZ2V0SlNPTih1cmwsIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPT09IDApIHtcclxuICAgICAgICAgICAgICBmaWVsZC52YWwoZGF0YS5SZXN1bHQpLmNoYW5nZSgpO1xyXG4gICAgICAgICAgICAgIGZpZWxkWzBdLnNlbGVjdCgpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBvbmVycm9yKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH0pLmZhaWwob25lcnJvcik7XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcbn07Iiwi77u/LyoqIGNoYW5nZVByb2ZpbGVQaG90bywgaXQgdXNlcyAndXBsb2FkZXInIHVzaW5nIGh0bWw1LCBhamF4IGFuZCBhIHNwZWNpZmljIHBhZ2VcclxuICB0byBtYW5hZ2Ugc2VydmVyLXNpZGUgdXBsb2FkIG9mIGEgbmV3IHVzZXIgcHJvZmlsZSBwaG90by5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbi8vIFRPRE86IHJlaW1wbGVtZW50IHRoaXMgYW5kIHRoZSBzZXJ2ZXItc2lkZSBmaWxlIHRvIGF2b2lkIGlmcmFtZXMgYW5kIGV4cG9zaW5nIGdsb2JhbCBmdW5jdGlvbnMsXHJcbi8vIGRpcmVjdCBBUEkgdXNlIHdpdGhvdXQgaWZyYW1lLW5vcm1hbCBwb3N0IHN1cHBvcnQgKGN1cnJlbnQgYnJvd3NlciBtYXRyaXggYWxsb3cgdXMgdGhpcz8pXHJcbi8vIFRPRE86IGltcGxlbWVudCBhcyByZWFsIG1vZHVsYXIsIG5leHQgYXJlIHRoZSBrbm93ZWQgbW9kdWxlcyBpbiB1c2UgYnV0IG5vdCBsb2FkaW5nIHRoYXQgYXJlIGV4cGVjdGVkXHJcbi8vIHRvIGJlIGluIHNjb3BlIHJpZ2h0IG5vdyBidXQgbXVzdCBiZSB1c2VkIHdpdGggdGhlIG5leHQgY29kZSB1bmNvbW1lbnRlZC5cclxuLy8gcmVxdWlyZSgndXBsb2FkZXInKTtcclxuLy8gcmVxdWlyZSgnTGNVcmwnKTtcclxuLy8gdmFyIGJsb2NrUHJlc2V0cyA9IHJlcXVpcmUoJy4uL0xDL2Jsb2NrUHJlc2V0cycpXHJcbi8vIHZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuICAkYy5vbignY2xpY2snLCAnW2hyZWY9XCIjY2hhbmdlLXByb2ZpbGUtcGhvdG9cIl0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBwb3B1cChMY1VybC5MYW5nUGF0aCArICdkYXNoYm9hcmQvQWJvdXRZb3UvQ2hhbmdlUGhvdG8vJywgeyB3aWR0aDogMjQwLCBoZWlnaHQ6IDI0MCB9KTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbiAgLy8gTk9URTogV2UgYXJlIGV4cG9zaW5nIGdsb2JhbCBmdW5jdGlvbnMgZnJvbSBoZXJlIGJlY2F1c2UgdGhlIHNlcnZlciBwYWdlL2lmcmFtZSBleHBlY3RzIHRoaXNcclxuICAvLyB0byB3b3JrLlxyXG4gIC8vIFRPRE86IHJlZmFjdG9yIHRvIGF2b2lkIHRoaXMgd2F5LlxyXG4gIHdpbmRvdy5yZWxvYWRVc2VyUGhvdG8gPSBmdW5jdGlvbiByZWxvYWRVc2VyUGhvdG8oKSB7XHJcbiAgICAkYy5maW5kKCcuRGFzaGJvYXJkUHVibGljQmlvLXBob3RvIC5hdmF0YXInKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIHNyYyA9IHRoaXMuZ2V0QXR0cmlidXRlKCdzcmMnKTtcclxuICAgICAgLy8gYXZvaWQgY2FjaGUgdGhpcyB0aW1lXHJcbiAgICAgIHNyYyA9IHNyYyArIFwiP3Y9XCIgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZSgnc3JjJywgc3JjKTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIHdpbmRvdy5kZWxldGVVc2VyUGhvdG8gPSBmdW5jdGlvbiBkZWxldGVVc2VyUGhvdG8oKSB7XHJcbiAgICAkLmJsb2NrVUkoTEMuYmxvY2tQcmVzZXRzLmxvYWRpbmcpO1xyXG4gICAgJC5hamF4KHtcclxuICAgICAgdXJsOiBMY1VybC5MYW5nVXJsICsgXCJkYXNoYm9hcmQvQWJvdXRZb3UvQ2hhbmdlUGhvdG8vP2RlbGV0ZT10cnVlXCIsXHJcbiAgICAgIG1ldGhvZDogXCJHRVRcIixcclxuICAgICAgY2FjaGU6IGZhbHNlLFxyXG4gICAgICBkYXRhVHlwZTogXCJqc29uXCIsXHJcbiAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgaWYgKGRhdGEuQ29kZSA9PT0gMClcclxuICAgICAgICAgICQuYmxvY2tVSShMQy5ibG9ja1ByZXNldHMuaW5mbyhkYXRhLlJlc3VsdCkpO1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICQuYmxvY2tVSShMQy5ibG9ja1ByZXNldHMuZXJyb3IoZGF0YS5SZXN1bHQuRXJyb3JNZXNzYWdlKSk7XHJcbiAgICAgICAgJCgnLmJsb2NrVUkgLmNsb3NlLXBvcHVwJykuY2xpY2soZnVuY3Rpb24gKCkgeyAkLnVuYmxvY2tVSSgpOyB9KTtcclxuICAgICAgICByZWxvYWRVc2VyUGhvdG8oKTtcclxuICAgICAgfSxcclxuICAgICAgZXJyb3I6IGFqYXhFcnJvclBvcHVwSGFuZGxlclxyXG4gICAgfSk7XHJcbiAgfTtcclxuXHJcbn07XHJcbiIsIu+7vy8qKiBFZHVjYXRpb24gcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vL3JlcXVpcmUoJ0xDL2pxdWVyeS54dHNoJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS11aScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIHNlY3Rpb25TZWxlY3RvciA9ICcuRGFzaGJvYXJkRWR1Y2F0aW9uJyxcclxuICAgICRzZWN0aW9uID0gJGMuZmluZChzZWN0aW9uU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRzZWN0aW9uLnNpYmxpbmdzKClcclxuICAgICAgICAuYWRkKCRzZWN0aW9uLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSlcclxuICAgICAgICAuYWRkKCRzZWN0aW9uLmNsb3Nlc3QoJy5EYXNoYm9hcmRBYm91dFlvdScpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwoc2VjdGlvblNlbGVjdG9yKTtcclxuICAvL2NydWRsLnNldHRpbmdzLmVmZmVjdHNbJ3Nob3ctdmlld2VyJ10gPSB7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG4gICAgLy8gU2V0dXAgYXV0b2NvbXBsZXRlXHJcbiAgICAkZWRpdG9yLmZpbmQoJ1tuYW1lPWluc3RpdHV0aW9uXScpLmF1dG9jb21wbGV0ZSh7XHJcbiAgICAgIHNvdXJjZTogTGNVcmwuSnNvblBhdGggKyAnR2V0SW5zdGl0dXRpb25zL0F1dG9jb21wbGV0ZS8nLFxyXG4gICAgICBhdXRvRm9jdXM6IGZhbHNlLFxyXG4gICAgICBkZWxheTogMjAwLFxyXG4gICAgICBtaW5MZW5ndGg6IDVcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59O1xyXG4iLCLvu78vKipcclxuICBnZW5lcmF0ZUJvb2tOb3dCdXR0b246IHdpdGggdGhlIHByb3BlciBodG1sIGFuZCBmb3JtXHJcbiAgcmVnZW5lcmF0ZXMgdGhlIGJ1dHRvbiBzb3VyY2UtY29kZSBhbmQgcHJldmlldyBhdXRvbWF0aWNhbGx5LlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICBmdW5jdGlvbiByZWdlbmVyYXRlQnV0dG9uQ29kZSgpIHtcclxuICAgIHZhclxyXG4gICAgICBzaXplID0gYy5maW5kKCdbbmFtZT1zaXplXTpjaGVja2VkJykudmFsKCksXHJcbiAgICAgIHBvc2l0aW9uaWQgPSBjLmZpbmQoJ1tuYW1lPXBvc2l0aW9uaWRdOmNoZWNrZWQnKS52YWwoKSxcclxuICAgICAgc291cmNlQ29udGFpbmVyID0gYy5maW5kKCdbbmFtZT1idXR0b24tc291cmNlLWNvZGVdJyksXHJcbiAgICAgIHByZXZpZXdDb250YWluZXIgPSBjLmZpbmQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvblNpemVzLXByZXZpZXcnKSxcclxuICAgICAgYnV0dG9uVHBsID0gYy5maW5kKCcuRGFzaGJvYXJkQm9va05vd0J1dHRvbi1idXR0b25Db2RlLWJ1dHRvblRlbXBsYXRlJykudGV4dCgpLFxyXG4gICAgICBsaW5rVHBsID0gYy5maW5kKCcuRGFzaGJvYXJkQm9va05vd0J1dHRvbi1idXR0b25Db2RlLWxpbmtUZW1wbGF0ZScpLnRleHQoKSxcclxuICAgICAgdHBsID0gKHNpemUgPT0gJ2xpbmstb25seScgPyBsaW5rVHBsIDogYnV0dG9uVHBsKSxcclxuICAgICAgdHBsVmFycyA9ICQoJy5EYXNoYm9hcmRCb29rTm93QnV0dG9uLWJ1dHRvbkNvZGUnKTtcclxuXHJcbiAgICBwcmV2aWV3Q29udGFpbmVyLmh0bWwodHBsKTtcclxuICAgIHByZXZpZXdDb250YWluZXIuZmluZCgnYScpLmF0dHIoJ2hyZWYnLFxyXG4gICAgICB0cGxWYXJzLmRhdGEoJ2Jhc2UtdXJsJykgKyAocG9zaXRpb25pZCA/IHBvc2l0aW9uaWQgKyAnLycgOiAnJykpO1xyXG4gICAgcHJldmlld0NvbnRhaW5lci5maW5kKCdpbWcnKS5hdHRyKCdzcmMnLFxyXG4gICAgICB0cGxWYXJzLmRhdGEoJ2Jhc2Utc3JjJykgKyBzaXplKTtcclxuICAgIHNvdXJjZUNvbnRhaW5lci52YWwocHJldmlld0NvbnRhaW5lci5odG1sKCkudHJpbSgpKTtcclxuICB9XHJcblxyXG4gIC8vIEZpcnN0IGdlbmVyYXRpb25cclxuICBpZiAoYy5sZW5ndGggPiAwKSByZWdlbmVyYXRlQnV0dG9uQ29kZSgpO1xyXG4gIC8vIGFuZCBvbiBhbnkgZm9ybSBjaGFuZ2VcclxuICBjLm9uKCdjaGFuZ2UnLCAnaW5wdXQnLCByZWdlbmVyYXRlQnV0dG9uQ29kZSk7XHJcbn07Iiwi77u/LyoqIExpY2Vuc2VzIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICBsaWNlbnNlc1NlbGVjdG9yID0gJy5EYXNoYm9hcmRMaWNlbnNlcycsXHJcbiAgICAkbGljZW5zZXMgPSAkYy5maW5kKGxpY2Vuc2VzU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLFxyXG4gICAgJG90aGVycyA9ICRsaWNlbnNlcy5zaWJsaW5ncygpXHJcbiAgICAgIC5hZGQoJGxpY2Vuc2VzLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSlcclxuICAgICAgLmFkZCgkbGljZW5zZXMuY2xvc2VzdCgnLkRhc2hib2FyZFlvdXJXb3JrJykuc2libGluZ3MoKSk7XHJcblxyXG4gIHZhciBjcnVkbCA9IGluaXRDcnVkbChsaWNlbnNlc1NlbGVjdG9yKTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KTtcclxufTtcclxuIiwi77u/LyoqIExvY2F0aW9ucyBwYWdlIHNldHVwIGZvciBDUlVETCB1c2VcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBtYXBSZWFkeSA9IHJlcXVpcmUoJ0xDL2dvb2dsZU1hcFJlYWR5Jyk7XHJcbi8vIEluZGlyZWN0bHkgdXNlZDogcmVxdWlyZSgnTEMvaGFzQ29uZmlybVN1cHBvcnQnKTtcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3RvciksXHJcbiAgICBsb2NhdGlvbnNTZWxlY3RvciA9ICcuRGFzaGJvYXJkTG9jYXRpb25zJyxcclxuICAgICRsb2NhdGlvbnMgPSAkYy5maW5kKGxvY2F0aW9uc1NlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkbG9jYXRpb25zLnNpYmxpbmdzKClcclxuICAgICAgLmFkZCgkbG9jYXRpb25zLmZpbmQoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbi1pbnRyb2R1Y3Rpb24nKSlcclxuICAgICAgLmFkZCgkbG9jYXRpb25zLmNsb3Nlc3QoJy5EYXNoYm9hcmRZb3VyV29yaycpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwobG9jYXRpb25zU2VsZWN0b3IpO1xyXG5cclxuICB2YXIgbG9jYXRpb25NYXA7XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LWVuZHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54c2hvdyh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmF0aW9uOiAnc2xvdycgfSk7XHJcbiAgfSlcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0b3ItcmVhZHknXSwgZnVuY3Rpb24gKGUsICRlZGl0b3IpIHtcclxuICAgIC8vRm9yY2UgZXhlY3V0aW9uIG9mIHRoZSAnaGFzLWNvbmZpcm0nIHNjcmlwdFxyXG4gICAgJGVkaXRvci5maW5kKCdmaWVsZHNldC5oYXMtY29uZmlybSA+IC5jb25maXJtIGlucHV0JykuY2hhbmdlKCk7XHJcblxyXG4gICAgc2V0dXBDb3B5TG9jYXRpb24oJGVkaXRvcik7XHJcblxyXG4gICAgbG9jYXRpb25NYXAgPSBzZXR1cEdlb3Bvc2l0aW9uaW5nKCRlZGl0b3IpO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdG9yLXNob3dlZCddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG4gICAgaWYgKGxvY2F0aW9uTWFwKVxyXG4gICAgICBtYXBSZWFkeS5yZWZyZXNoTWFwKGxvY2F0aW9uTWFwKTtcclxuICB9KTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwQ29weUxvY2F0aW9uKCRlZGl0b3IpIHtcclxuICAkZWRpdG9yLmZpbmQoJ3NlbGVjdC5jb3B5LWxvY2F0aW9uJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAkdC5jbG9zZXN0KCcuY3J1ZGwtZm9ybScpLnJlbG9hZChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgJCh0aGlzKS5kYXRhKCdhamF4LWZpZWxkc2V0LWFjdGlvbicpLnJlcGxhY2UoL0xvY2F0aW9uSUQ9XFxkKy9naSwgJ0xvY2F0aW9uSUQ9JyArICR0LnZhbCgpKSArXHJcbiAgICAgICAgJyYnICsgJHQuZGF0YSgnZXh0cmEtcXVlcnknKVxyXG4gICAgICApO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8qKiBMb2NhdGUgdXNlciBwb3NpdGlvbiBvciB0cmFuc2xhdGUgYWRkcmVzcyB0ZXh0IGludG8gYSBnZW9jb2RlIHVzaW5nXHJcbiAgYnJvd3NlciBhbmQgR29vZ2xlIE1hcHMgc2VydmljZXMuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cEdlb3Bvc2l0aW9uaW5nKCRlZGl0b3IpIHtcclxuICB2YXIgbWFwO1xyXG4gIG1hcFJlYWR5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAvLyBSZWdpc3RlciBpZiB1c2VyIHNlbGVjdHMgb3Igd3JpdGVzIGEgcG9zaXRpb24gKHRvIG5vdCBvdmVyd3JpdGUgaXQgd2l0aCBhdXRvbWF0aWMgcG9zaXRpb25pbmcpXHJcbiAgICB2YXIgcG9zaXRpb25lZEJ5VXNlciA9IGZhbHNlO1xyXG4gICAgLy8gU29tZSBjb25mc1xyXG4gICAgdmFyIGRldGFpbGVkWm9vbUxldmVsID0gMTc7XHJcbiAgICB2YXIgZ2VuZXJhbFpvb21MZXZlbCA9IDk7XHJcbiAgICB2YXIgZm91bmRMb2NhdGlvbnMgPSB7XHJcbiAgICAgIGJ5VXNlcjogbnVsbCxcclxuICAgICAgYnlHZW9sb2NhdGlvbjogbnVsbCxcclxuICAgICAgYnlHZW9jb2RlOiBudWxsLFxyXG4gICAgICBvcmlnaW5hbDogbnVsbFxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbCA9ICRlZGl0b3IuZmluZCgnLmxvY2F0aW9uLW1hcCcpO1xyXG4gICAgdmFyIG0gPSBsLmZpbmQoJy5tYXAtc2VsZWN0b3IgPiAuZ29vZ2xlLW1hcCcpLmdldCgwKTtcclxuICAgIHZhciAkbGF0ID0gbC5maW5kKCdbbmFtZT1sYXRpdHVkZV0nKTtcclxuICAgIHZhciAkbG5nID0gbC5maW5kKCdbbmFtZT1sb25naXR1ZGVdJyk7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgcG9zaXRpb24gY29vcmRpbmF0ZXNcclxuICAgIHZhciBteUxhdGxuZztcclxuICAgIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBfbGF0X3ZhbHVlID0gJGxhdC52YWwoKSwgX2xuZ192YWx1ZSA9ICRsbmcudmFsKCk7XHJcbiAgICAgIGlmIChfbGF0X3ZhbHVlICYmIF9sbmdfdmFsdWUpIHtcclxuICAgICAgICBteUxhdGxuZyA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoJGxhdC52YWwoKSwgJGxuZy52YWwoKSk7XHJcbiAgICAgICAgLy8gV2UgY29uc2lkZXIgYXMgJ3Bvc2l0aW9uZWQgYnkgdXNlcicgd2hlbiB0aGVyZSB3YXMgYSBzYXZlZCB2YWx1ZSBmb3IgdGhlIHBvc2l0aW9uIGNvb3JkaW5hdGVzICh3ZSBhcmUgZWRpdGluZyBhIGxvY2F0aW9uKVxyXG4gICAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSAobXlMYXRsbmcubGF0KCkgIT09IDAgJiYgbXlMYXRsbmcubG5nKCkgIT09IDApO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIERlZmF1bHQgcG9zaXRpb24gd2hlbiB0aGVyZSBhcmUgbm90IG9uZSAoU2FuIEZyYW5jaXNjbyBqdXN0IG5vdyk6XHJcbiAgICAgICAgbXlMYXRsbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKDM3Ljc1MzM0NDM5MjI2Mjk4LCAtMTIyLjQyNTQ2MDYwMzUxNTYpO1xyXG4gICAgICB9XHJcbiAgICB9KSgpO1xyXG4gICAgLy8gUmVtZW1iZXIgb3JpZ2luYWwgZm9ybSBsb2NhdGlvblxyXG4gICAgZm91bmRMb2NhdGlvbnMub3JpZ2luYWwgPSBmb3VuZExvY2F0aW9ucy5jb25maXJtZWQgPSBteUxhdGxuZztcclxuXHJcbiAgICAvLyBDcmVhdGUgbWFwXHJcbiAgICB2YXIgbWFwT3B0aW9ucyA9IHtcclxuICAgICAgem9vbTogKHBvc2l0aW9uZWRCeVVzZXIgPyBkZXRhaWxlZFpvb21MZXZlbCA6IGdlbmVyYWxab29tTGV2ZWwpLCAvLyBCZXN0IGRldGFpbCB3aGVuIHdlIGFscmVhZHkgaGFkIGEgbG9jYXRpb25cclxuICAgICAgY2VudGVyOiBteUxhdGxuZyxcclxuICAgICAgbWFwVHlwZUlkOiBnb29nbGUubWFwcy5NYXBUeXBlSWQuUk9BRE1BUFxyXG4gICAgfTtcclxuICAgIG1hcCA9IG5ldyBnb29nbGUubWFwcy5NYXAobSwgbWFwT3B0aW9ucyk7XHJcbiAgICAvLyBDcmVhdGUgdGhlIHBvc2l0aW9uIG1hcmtlclxyXG4gICAgdmFyIG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xyXG4gICAgICBwb3NpdGlvbjogbXlMYXRsbmcsXHJcbiAgICAgIG1hcDogbWFwLFxyXG4gICAgICBkcmFnZ2FibGU6IGZhbHNlLFxyXG4gICAgICBhbmltYXRpb246IGdvb2dsZS5tYXBzLkFuaW1hdGlvbi5EUk9QXHJcbiAgICB9KTtcclxuICAgIC8vIExpc3RlbiB3aGVuIHVzZXIgY2xpY2tzIG1hcCBvciBtb3ZlIHRoZSBtYXJrZXIgdG8gbW92ZSBtYXJrZXIgb3Igc2V0IHBvc2l0aW9uIGluIHRoZSBmb3JtXHJcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdkcmFnZW5kJywgc2F2ZUNvb3JkaW5hdGVzKTtcclxuICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcCwgJ2NsaWNrJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIGlmICghbWFya2VyLmdldERyYWdnYWJsZSgpKSByZXR1cm47XHJcbiAgICAgIHBsYWNlTWFya2VyKGV2ZW50LmxhdExuZyk7XHJcbiAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICBmb3VuZExvY2F0aW9ucy5ieVVzZXIgPSBldmVudC5sYXRMbmc7XHJcbiAgICB9KTtcclxuICAgIGZ1bmN0aW9uIHBsYWNlTWFya2VyKGxhdGxuZywgZG96b29tLCBhdXRvc2F2ZSkge1xyXG4gICAgICBtYXJrZXIuc2V0UG9zaXRpb24obGF0bG5nKTtcclxuICAgICAgLy8gTW92ZSBtYXBcclxuICAgICAgbWFwLnBhblRvKGxhdGxuZyk7XHJcbiAgICAgIHNhdmVDb29yZGluYXRlcyhhdXRvc2F2ZSk7XHJcbiAgICAgIGlmIChkb3pvb20pXHJcbiAgICAgIC8vIFNldCB6b29tIHRvIHNvbWV0aGluZyBtb3JlIGRldGFpbGVkXHJcbiAgICAgICAgbWFwLnNldFpvb20oZGV0YWlsZWRab29tTGV2ZWwpO1xyXG4gICAgICByZXR1cm4gbWFya2VyO1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gc2F2ZUNvb3JkaW5hdGVzKGluRm9ybSkge1xyXG4gICAgICB2YXIgbGF0TG5nID0gbWFya2VyLmdldFBvc2l0aW9uKCk7XHJcbiAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICBmb3VuZExvY2F0aW9ucy5ieVVzZXIgPSBsYXRMbmc7XHJcbiAgICAgIGlmIChpbkZvcm0gPT09IHRydWUpIHtcclxuICAgICAgICAkbGF0LnZhbChsYXRMbmcubGF0KCkpOyAvL21hcmtlci5wb3NpdGlvbi5YYVxyXG4gICAgICAgICRsbmcudmFsKGxhdExuZy5sbmcoKSk7IC8vbWFya2VyLnBvc2l0aW9uLllhXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIExpc3RlbiB3aGVuIHVzZXIgY2hhbmdlcyBmb3JtIGNvb3JkaW5hdGVzIHZhbHVlcyB0byB1cGRhdGUgdGhlIG1hcFxyXG4gICAgJGxhdC5jaGFuZ2UodXBkYXRlTWFwTWFya2VyKTtcclxuICAgICRsbmcuY2hhbmdlKHVwZGF0ZU1hcE1hcmtlcik7XHJcbiAgICBmdW5jdGlvbiB1cGRhdGVNYXBNYXJrZXIoKSB7XHJcbiAgICAgIHBvc2l0aW9uZWRCeVVzZXIgPSB0cnVlO1xyXG4gICAgICB2YXIgbmV3UG9zID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZygkbGF0LnZhbCgpLCAkbG5nLnZhbCgpKTtcclxuICAgICAgLy8gTW92ZSBtYXJrZXJcclxuICAgICAgbWFya2VyLnNldFBvc2l0aW9uKG5ld1Bvcyk7XHJcbiAgICAgIC8vIE1vdmUgbWFwXHJcbiAgICAgIG1hcC5wYW5UbyhuZXdQb3MpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qPT09PT09PT09PT09PT09PT09PVxyXG4gICAgKiBBVVRPIFBPU0lUSU9OSU5HXHJcbiAgICAqL1xyXG4gICAgZnVuY3Rpb24gdXNlR2VvbG9jYXRpb24oZm9yY2UsIGF1dG9zYXZlKSB7XHJcbiAgICAgIHZhciBvdmVycmlkZSA9IGZvcmNlIHx8ICFwb3NpdGlvbmVkQnlVc2VyO1xyXG4gICAgICAvLyBVc2UgYnJvd3NlciBnZW9sb2NhdGlvbiBzdXBwb3J0IHRvIGdldCBhbiBhdXRvbWF0aWMgbG9jYXRpb24gaWYgdGhlcmUgaXMgbm8gYSBsb2NhdGlvbiBzZWxlY3RlZCBieSB1c2VyXHJcbiAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGJyb3dzZXIgc3VwcG9ydHMgZ2VvbG9jYXRpb24uXHJcbiAgICAgIGlmIChvdmVycmlkZSAmJiBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24pIHtcclxuXHJcbiAgICAgICAgLy8gVGhpcyBpcyB0aGUgbG9jYXRpb24gbWFya2VyIHRoYXQgd2Ugd2lsbCBiZSB1c2luZ1xyXG4gICAgICAgIC8vIG9uIHRoZSBtYXAuIExldCdzIHN0b3JlIGEgcmVmZXJlbmNlIHRvIGl0IGhlcmUgc29cclxuICAgICAgICAvLyB0aGF0IGl0IGNhbiBiZSB1cGRhdGVkIGluIHNldmVyYWwgcGxhY2VzLlxyXG4gICAgICAgIHZhciBsb2NhdGlvbk1hcmtlciA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIEdldCB0aGUgbG9jYXRpb24gb2YgdGhlIHVzZXIncyBicm93c2VyIHVzaW5nIHRoZVxyXG4gICAgICAgIC8vIG5hdGl2ZSBnZW9sb2NhdGlvbiBzZXJ2aWNlLiBXaGVuIHdlIGludm9rZSB0aGlzIG1ldGhvZFxyXG4gICAgICAgIC8vIG9ubHkgdGhlIGZpcnN0IGNhbGxiYWNrIGlzIHJlcXVpZWQuIFRoZSBzZWNvbmRcclxuICAgICAgICAvLyBjYWxsYmFjayAtIHRoZSBlcnJvciBoYW5kbGVyIC0gYW5kIHRoZSB0aGlyZFxyXG4gICAgICAgIC8vIGFyZ3VtZW50IC0gb3VyIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyAtIGFyZSBvcHRpb25hbC5cclxuICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uZ2V0Q3VycmVudFBvc2l0aW9uKFxyXG4gICAgICAgICAgZnVuY3Rpb24gKHBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGVyZSBpcyBhbHJlYWR5IGEgbG9jYXRpb24uXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgYnVnIGluIEZpcmVGb3ggd2hlcmUgdGhpcyBnZXRzXHJcbiAgICAgICAgICAgIC8vIGludm9rZWQgbW9yZSB0aGFuIG9uY2Ugd2l0aCBhIGNhY2hlZCByZXN1bHQuXHJcbiAgICAgICAgICAgIGlmIChsb2NhdGlvbk1hcmtlcikge1xyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gTW92ZSBtYXJrZXIgdG8gdGhlIG1hcCB1c2luZyB0aGUgcG9zaXRpb24sIG9ubHkgaWYgdXNlciBkb2Vzbid0IHNldCBhIHBvc2l0aW9uXHJcbiAgICAgICAgICAgIGlmIChvdmVycmlkZSkge1xyXG4gICAgICAgICAgICAgIHZhciBsYXRMbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxhdGl0dWRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24uY29vcmRzLmxvbmdpdHVkZVxyXG4gICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgIGxvY2F0aW9uTWFya2VyID0gcGxhY2VNYXJrZXIobGF0TG5nLCB0cnVlLCBhdXRvc2F2ZSk7XHJcbiAgICAgICAgICAgICAgZm91bmRMb2NhdGlvbnMuYnlHZW9sb2NhdGlvbiA9IGxhdExuZztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmxvZykgY29uc29sZS5sb2coXCJTb21ldGhpbmcgd2VudCB3cm9uZzogXCIsIGVycm9yKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpbWVvdXQ6ICg1ICogMTAwMCksXHJcbiAgICAgICAgICAgIG1heGltdW1BZ2U6ICgxMDAwICogNjAgKiAxNSksXHJcbiAgICAgICAgICAgIGVuYWJsZUhpZ2hBY2N1cmFjeTogdHJ1ZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG5cclxuICAgICAgICAvLyBOb3cgdGhhdCB3ZSBoYXZlIGFza2VkIGZvciB0aGUgcG9zaXRpb24gb2YgdGhlIHVzZXIsXHJcbiAgICAgICAgLy8gbGV0J3Mgd2F0Y2ggdGhlIHBvc2l0aW9uIHRvIHNlZSBpZiBpdCB1cGRhdGVzLiBUaGlzXHJcbiAgICAgICAgLy8gY2FuIGhhcHBlbiBpZiB0aGUgdXNlciBwaHlzaWNhbGx5IG1vdmVzLCBvZiBpZiBtb3JlXHJcbiAgICAgICAgLy8gYWNjdXJhdGUgbG9jYXRpb24gaW5mb3JtYXRpb24gaGFzIGJlZW4gZm91bmQgKGV4LlxyXG4gICAgICAgIC8vIEdQUyB2cy4gSVAgYWRkcmVzcykuXHJcbiAgICAgICAgLy9cclxuICAgICAgICAvLyBOT1RFOiBUaGlzIGFjdHMgbXVjaCBsaWtlIHRoZSBuYXRpdmUgc2V0SW50ZXJ2YWwoKSxcclxuICAgICAgICAvLyBpbnZva2luZyB0aGUgZ2l2ZW4gY2FsbGJhY2sgYSBudW1iZXIgb2YgdGltZXMgdG9cclxuICAgICAgICAvLyBtb25pdG9yIHRoZSBwb3NpdGlvbi4gQXMgc3VjaCwgaXQgcmV0dXJucyBhIFwidGltZXIgSURcIlxyXG4gICAgICAgIC8vIHRoYXQgY2FuIGJlIHVzZWQgdG8gbGF0ZXIgc3RvcCB0aGUgbW9uaXRvcmluZy5cclxuICAgICAgICB2YXIgcG9zaXRpb25UaW1lciA9IG5hdmlnYXRvci5nZW9sb2NhdGlvbi53YXRjaFBvc2l0aW9uKFxyXG4gICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBNb3ZlIGFnYWluIHRvIHRoZSBuZXcgb3IgYWNjdXJhdGVkIHBvc2l0aW9uLCBpZiB1c2VyIGRvZXNuJ3Qgc2V0IGEgcG9zaXRpb25cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3ZlcnJpZGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXRMbmcgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbi5jb29yZHMubGF0aXR1ZGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLmNvb3Jkcy5sb25naXR1ZGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb25NYXJrZXIgPSBwbGFjZU1hcmtlcihsYXRMbmcsIHRydWUsIGF1dG9zYXZlKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24gPSBsYXRMbmc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgICBuYXZpZ2F0b3IuZ2VvbG9jYXRpb24uY2xlYXJXYXRjaChwb3NpdGlvblRpbWVyKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBwb3NpdGlvbiBoYXNuJ3QgdXBkYXRlZCB3aXRoaW4gNSBtaW51dGVzLCBzdG9wXHJcbiAgICAgICAgLy8gbW9uaXRvcmluZyB0aGUgcG9zaXRpb24gZm9yIGNoYW5nZXMuXHJcbiAgICAgICAgc2V0VGltZW91dChcclxuICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIENsZWFyIHRoZSBwb3NpdGlvbiB3YXRjaGVyLlxyXG4gICAgICAgICAgICAgICAgICAgIG5hdmlnYXRvci5nZW9sb2NhdGlvbi5jbGVhcldhdGNoKHBvc2l0aW9uVGltZXIpO1xyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAoMTAwMCAqIDYwICogNSlcclxuICAgICAgICAgICAgICApO1xyXG4gICAgICB9IC8vIEVuZHMgZ2VvbG9jYXRpb24gcG9zaXRpb25cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHVzZUdtYXBzR2VvY29kZShpbml0aWFsTG9va3VwLCBhdXRvc2F2ZSkge1xyXG4gICAgICB2YXIgZ2VvY29kZXIgPSBuZXcgZ29vZ2xlLm1hcHMuR2VvY29kZXIoKTtcclxuXHJcbiAgICAgIC8vIGxvb2t1cCBvbiBhZGRyZXNzIGZpZWxkcyBjaGFuZ2VzIHdpdGggY29tcGxldGUgaW5mb3JtYXRpb25cclxuICAgICAgdmFyICRmb3JtID0gJGVkaXRvci5maW5kKCcuY3J1ZGwtZm9ybScpLCBmb3JtID0gJGZvcm0uZ2V0KDApO1xyXG4gICAgICBmdW5jdGlvbiBnZXRGb3JtQWRkcmVzcygpIHtcclxuICAgICAgICB2YXIgYWQgPSBbXTtcclxuICAgICAgICBmdW5jdGlvbiBhZGQoZmllbGQpIHtcclxuICAgICAgICAgIGlmIChmb3JtLmVsZW1lbnRzW2ZpZWxkXS52YWx1ZSkgYWQucHVzaChmb3JtLmVsZW1lbnRzW2ZpZWxkXS52YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFkZCgnYWRkcmVzc2xpbmUxJyk7XHJcbiAgICAgICAgYWRkKCdhZGRyZXNzbGluZTInKTtcclxuICAgICAgICBhZGQoJ2NpdHknKTtcclxuICAgICAgICBhZGQoJ3Bvc3RhbGNvZGUnKTtcclxuICAgICAgICB2YXIgcyA9IGZvcm0uZWxlbWVudHMuc3RhdGU7XHJcbiAgICAgICAgaWYgKHMudmFsdWUpIGFkLnB1c2gocy5vcHRpb25zW3Muc2VsZWN0ZWRJbmRleF0ubGFiZWwpO1xyXG4gICAgICAgIGFkLnB1c2goJ1VTQScpO1xyXG4gICAgICAgIC8vIE1pbmltdW0gZm9yIHZhbGlkIGFkZHJlc3M6IDQgZmllbGRzIGZpbGxlZCBvdXRcclxuICAgICAgICByZXR1cm4gYWQubGVuZ3RoID49IDUgPyBhZC5qb2luKCcsICcpIDogbnVsbDtcclxuICAgICAgfVxyXG4gICAgICAkZm9ybS5vbignY2hhbmdlJywgJ1tuYW1lPWFkZHJlc3NsaW5lMV0sIFtuYW1lPWFkZHJlc3NsaW5lMl0sIFtuYW1lPWNpdHldLCBbbmFtZT1wb3N0YWxjb2RlXSwgW25hbWU9c3RhdGVdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBhZGRyZXNzID0gZ2V0Rm9ybUFkZHJlc3MoKTtcclxuICAgICAgICBpZiAoYWRkcmVzcylcclxuICAgICAgICAgIGdlb2NvZGVMb29rdXAoYWRkcmVzcywgZmFsc2UpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEluaXRpYWwgbG9va3VwXHJcbiAgICAgIGlmIChpbml0aWFsTG9va3VwKSB7XHJcbiAgICAgICAgdmFyIGFkZHJlc3MgPSBnZXRGb3JtQWRkcmVzcygpO1xyXG4gICAgICAgIGlmIChhZGRyZXNzKVxyXG4gICAgICAgICAgZ2VvY29kZUxvb2t1cChhZGRyZXNzLCB0cnVlKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZnVuY3Rpb24gZ2VvY29kZUxvb2t1cChhZGRyZXNzLCBvdmVycmlkZSkge1xyXG4gICAgICAgIGdlb2NvZGVyLmdlb2NvZGUoeyAnYWRkcmVzcyc6IGFkZHJlc3MgfSwgZnVuY3Rpb24gKHJlc3VsdHMsIHN0YXR1cykge1xyXG4gICAgICAgICAgaWYgKHN0YXR1cyA9PSBnb29nbGUubWFwcy5HZW9jb2RlclN0YXR1cy5PSykge1xyXG4gICAgICAgICAgICB2YXIgbGF0TG5nID0gcmVzdWx0c1swXS5nZW9tZXRyeS5sb2NhdGlvbjtcclxuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oJ0dlb2NvZGUgcmV0cmlldmVkOiAnICsgbGF0TG5nICsgJyBmb3IgYWRkcmVzcyBcIicgKyBhZGRyZXNzICsgJ1wiJyk7XHJcbiAgICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmJ5R2VvY29kZSA9IGxhdExuZztcclxuXHJcbiAgICAgICAgICAgIHBsYWNlTWFya2VyKGxhdExuZywgdHJ1ZSwgYXV0b3NhdmUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignR2VvY29kZSB3YXMgbm90IHN1Y2Nlc3NmdWwgZm9yIHRoZSBmb2xsb3dpbmcgcmVhc29uOiAnICsgc3RhdHVzICsgJyBvbiBhZGRyZXNzIFwiJyArIGFkZHJlc3MgKyAnXCInKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEV4ZWN1dGluZyBhdXRvIHBvc2l0aW9uaW5nIChjaGFuZ2VkIHRvIGF1dG9zYXZlOnRydWUgdG8gYWxsIHRpbWUgc2F2ZSB0aGUgbG9jYXRpb24pOlxyXG4gICAgLy91c2VHZW9sb2NhdGlvbih0cnVlLCBmYWxzZSk7XHJcbiAgICB1c2VHbWFwc0dlb2NvZGUoZmFsc2UsIHRydWUpO1xyXG5cclxuICAgIC8vIExpbmsgb3B0aW9ucyBsaW5rczpcclxuICAgIGwub24oJ2NsaWNrJywgJy5vcHRpb25zIGEnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciB0YXJnZXQgPSAkKHRoaXMpLmF0dHIoJ2hyZWYnKS5zdWJzdHIoMSk7XHJcbiAgICAgIHN3aXRjaCAodGFyZ2V0KSB7XHJcbiAgICAgICAgY2FzZSAnZ2VvbG9jYXRpb24nOlxyXG4gICAgICAgICAgaWYgKGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24pXHJcbiAgICAgICAgICAgIHBsYWNlTWFya2VyKGZvdW5kTG9jYXRpb25zLmJ5R2VvbG9jYXRpb24sIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB1c2VHZW9sb2NhdGlvbih0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2dlb2NvZGUnOlxyXG4gICAgICAgICAgaWYgKGZvdW5kTG9jYXRpb25zLmJ5R2VvY29kZSlcclxuICAgICAgICAgICAgcGxhY2VNYXJrZXIoZm91bmRMb2NhdGlvbnMuYnlHZW9jb2RlLCB0cnVlLCB0cnVlKTtcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgdXNlR21hcHNHZW9jb2RlKHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnY29uZmlybSc6XHJcbiAgICAgICAgICBzYXZlQ29vcmRpbmF0ZXModHJ1ZSk7XHJcbiAgICAgICAgICBtYXJrZXIuc2V0RHJhZ2dhYmxlKGZhbHNlKTtcclxuICAgICAgICAgIGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCA9IG1hcmtlci5nZXRQb3NpdGlvbigpO1xyXG4gICAgICAgICAgbC5maW5kKCcuZ3BzLWxhdCwgLmdwcy1sbmcsIC5hZHZpY2UsIC5maW5kLWFkZHJlc3MtZ2VvY29kZScpLmhpZGUoJ2Zhc3QnKTtcclxuICAgICAgICAgIHZhciBlZGl0ID0gbC5maW5kKCcuZWRpdC1hY3Rpb24nKTtcclxuICAgICAgICAgIGVkaXQudGV4dChlZGl0LmRhdGEoJ2VkaXQtbGFiZWwnKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdlZGl0Y29vcmRpbmF0ZXMnOlxyXG4gICAgICAgICAgdmFyIGEgPSBsLmZpbmQoJy5ncHMtbGF0LCAuZ3BzLWxuZywgLmFkdmljZSwgLmZpbmQtYWRkcmVzcy1nZW9jb2RlJyk7XHJcbiAgICAgICAgICB2YXIgYiA9ICFhLmlzKCc6dmlzaWJsZScpO1xyXG4gICAgICAgICAgbWFya2VyLnNldERyYWdnYWJsZShiKTtcclxuICAgICAgICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICAgICAgICBpZiAoYikge1xyXG4gICAgICAgICAgICAkdC5kYXRhKCdlZGl0LWxhYmVsJywgJHQudGV4dCgpKTtcclxuICAgICAgICAgICAgJHQudGV4dCgkdC5kYXRhKCdjYW5jZWwtbGFiZWwnKSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkdC50ZXh0KCR0LmRhdGEoJ2VkaXQtbGFiZWwnKSk7XHJcbiAgICAgICAgICAgIC8vIFJlc3RvcmUgbG9jYXRpb246XHJcbiAgICAgICAgICAgIHBsYWNlTWFya2VyKGZvdW5kTG9jYXRpb25zLmNvbmZpcm1lZCwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBhLnRvZ2dsZSgnZmFzdCcpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gbWFwO1xyXG59Iiwi77u/LyoqIFVJIGxvZ2ljIHRvIG1hbmFnZSBwcm92aWRlciBwaG90b3MgKHlvdXItd29yay9waG90b3MpLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LXVpJyk7XHJcbnZhciBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJ0xDL3Ntb290aEJveEJsb2NrJyk7XHJcbnZhciBjaGFuZ2VzTm90aWZpY2F0aW9uID0gcmVxdWlyZSgnTEMvY2hhbmdlc05vdGlmaWNhdGlvbicpO1xyXG5cclxudmFyIHNlY3Rpb25TZWxlY3RvciA9ICcuRGFzaGJvYXJkUGhvdG9zJztcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgc2V0dXBDcnVkbERlbGVnYXRlcygkYyk7XHJcblxyXG4gIGluaXRFbGVtZW50cygkYyk7XHJcblxyXG4gIC8vIEFueSB0aW1lIHRoYXQgdGhlIGZvcm0gY29udGVudCBodG1sIGlzIHJlbG9hZGVkLFxyXG4gIC8vIHJlLWluaXRpYWxpemUgZWxlbWVudHNcclxuICAkYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZnVuY3Rpb24gKCkge1xyXG4gICAgaW5pdEVsZW1lbnRzKCRjKTtcclxuICB9KTtcclxufTtcclxuXHJcbi8qIFNldHVwIHRoZSBjb2RlIHRoYXQgd29ya3Mgb24gdGhlIGRpZmZlcmVudCBDUlVETCBhY3Rpb25zIG9uIHRoZSBwaG90b3MuXHJcbiAgQWxsIHRoaXMgYXJlIGRlbGVnYXRlcywgb25seSBuZWVkIHRvIGJlIHNldHVwIG9uY2Ugb24gdGhlIHBhZ2VcclxuICAoaWYgdGhlIGNvbnRhaW5lciAkYyBpcyBub3QgcmVwbGFjZWQsIG9ubHkgdGhlIGNvbnRlbnRzLCBkb2Vzbid0IG5lZWQgdG8gY2FsbCBhZ2FpbiB0aGlzKS5cclxuKi9cclxuZnVuY3Rpb24gc2V0dXBDcnVkbERlbGVnYXRlcygkYykge1xyXG4gICRjXHJcbiAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtdG9vbHMtdXBsb2FkID4gYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBwb3NJRCA9ICQodGhpcykuY2xvc2VzdCgnZm9ybScpLmZpbmQoJ2lucHV0W25hbWU9cG9zaXRpb25JRF0nKS52YWwoKTtcclxuICAgIHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ2Rhc2hib2FyZC9Zb3VyV29yay9VcGxvYWRQaG90by8/UG9zaXRpb25JRD0nICsgcG9zSUQsICdzbWFsbCcpO1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pXHJcbiAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtZ2FsbGVyeSBsaSBhJywgZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgIHZhciBmb3JtID0gJHQuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpO1xyXG4gICAgdmFyIGVkaXRQYW5lbCA9ICQoJy5wb3NpdGlvbnBob3Rvcy1lZGl0JywgZm9ybSk7XHJcblxyXG4gICAgLy8gSWYgdGhlIGZvcm0gaGFkIGNoYW5nZXMsIHN1Ym1pdCBpdCB0byBzYXZlIGl0OlxyXG4gICAgLy8gUmVtb3ZlIHRoZSBmb2N1cyBvZiBjdXJyZW50IGZvY3VzZWQgZWxlbWVudCB0byBhdm9pZCBcclxuICAgIC8vIGNoYW5nZWQgZWxlbWVudHMgbm90IG5vdGlmeSB0aGUgY2hhbmdlIHN0YXR1c1xyXG4gICAgJCgnOmZvY3VzJykuYmx1cigpO1xyXG4gICAgdmFyIGYgPSBlZGl0UGFuZWwuY2xvc2VzdCgnZmllbGRzZXQuYWpheCcpO1xyXG4gICAgdmFyIGNoYW5nZWRFbHMgPSBmLmZpbmQoJy5jaGFuZ2VkOmlucHV0JykubWFwKGZ1bmN0aW9uKCl7IHJldHVybiB0aGlzLm5hbWU7IH0pLmdldCgpO1xyXG4gICAgaWYgKGNoYW5nZWRFbHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAvLyBNYXJrIGNoYW5nZXMgYXJlIHNhdmVkXHJcbiAgICAgIGYub25lKCdhamF4Rm9ybVJldHVybmVkSHRtbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZShmLmNsb3Nlc3QoJ2Zvcm0nKS5nZXQoMCksIGNoYW5nZWRFbHMpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIEZvcmNlIGEgZmllbGRzZXQuYWpheCBzdWJtaXQ6XHJcbiAgICAgIGYuZmluZCgnLmFqYXgtZmllbGRzZXQtc3VibWl0JykuY2xpY2soKTtcclxuICAgIH1cclxuXHJcbiAgICBzbW9vdGhCb3hCbG9jay5jbG9zZUFsbChmb3JtKTtcclxuICAgIC8vIFNldCB0aGlzIHBob3RvIGFzIHNlbGVjdGVkXHJcbiAgICB2YXIgc2VsZWN0ZWQgPSAkdC5jbG9zZXN0KCdsaScpO1xyXG4gICAgc2VsZWN0ZWQuYWRkQ2xhc3MoJ3NlbGVjdGVkJykuc2libGluZ3MoKS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKTtcclxuICAgIC8vdmFyIHNlbGVjdGVkID0gJCgnLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbCA+IGxpLnNlbGVjdGVkJywgZm9ybSk7XHJcbiAgICBpZiAoc2VsZWN0ZWQgIT09IG51bGwgJiYgc2VsZWN0ZWQubGVuZ3RoID4gMCkge1xyXG4gICAgICB2YXIgc2VsSW1nID0gc2VsZWN0ZWQuZmluZCgnaW1nJyk7XHJcbiAgICAgIC8vIE1vdmluZyBzZWxlY3RlZCB0byBiZSBlZGl0IHBhbmVsXHJcbiAgICAgIHZhciBwaG90b0lEID0gc2VsZWN0ZWQuYXR0cignaWQnKS5tYXRjaCgvXlVzZXJQaG90by0oXFxkKykkLylbMV07XHJcbiAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbChwaG90b0lEKTtcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycsIHNlbEltZy5hdHRyKCdzcmMnKSk7XHJcbiAgICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1waG90by1jYXB0aW9uXScpLnZhbChzZWxJbWcuYXR0cignYWx0JykpO1xyXG4gICAgICB2YXIgaXNQcmltYXJ5VmFsdWUgPSBzZWxlY3RlZC5oYXNDbGFzcygnaXMtcHJpbWFyeS1waG90bycpID8gJ1RydWUnIDogJ0ZhbHNlJztcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICAgICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dW3ZhbHVlPScgKyBpc1ByaW1hcnlWYWx1ZSArICddJykucHJvcCgnY2hlY2tlZCcsIHRydWUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pXHJcbiAgLm9uKCdjbGljaycsICcucG9zaXRpb25waG90b3MtZWRpdC1kZWxldGUgYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBlZGl0UGFuZWwgPSAkKHRoaXMpLmNsb3Nlc3QoJy5wb3NpdGlvbnBob3Rvcy1lZGl0Jyk7XHJcbiAgICAvLyBDaGFuZ2UgdGhlIGZpZWxkIGRlbGV0ZS1waG90byB0byBUcnVlIGFuZCBzZW5kIGZvcm0gZm9yIGFuIGFqYXggcmVxdWVzdCB3aXRoXHJcbiAgICAvLyBzZXJ2ZXIgZGVsZXRlIHRhc2sgYW5kIGNvbnRlbnQgcmVsb2FkXHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9ZGVsZXRlLXBob3RvXScpLnZhbCgnVHJ1ZScpO1xyXG4gICAgLy8gRm9yY2UgYSBmaWVsZHNldC5hamF4IHN1Ym1pdDpcclxuICAgIGVkaXRQYW5lbC5jbG9zZXN0KCdmaWVsZHNldC5hamF4JykuZmluZCgnLmFqYXgtZmllbGRzZXQtc3VibWl0JykuY2xpY2soKTtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxufVxyXG5cclxuLyogSW5pdGlhbGl6ZSB0aGUgcGhvdG9zIGVsZW1lbnRzIHRvIGJlIHNvcnRhYmxlcywgc2V0IHRoZSBwcmltYXJ5IHBob3RvXHJcbiAgaW4gdGhlIGhpZ2hsaWdodGVkIGFyZSBhbmQgaW5pdGlhbGl6ZSB0aGUgJ2RlbGV0ZSBwaG90bycgZmxhZy5cclxuICBUaGlzIGlzIHJlcXVpcmVkIHRvIGJlIGV4ZWN1dGVkIGFueSB0aW1lIHRoZSBlbGVtZW50cyBodG1sIGlzIHJlcGxhY2VkXHJcbiAgYmVjYXVzZSBuZWVkcyBkaXJlY3QgYWNjZXNzIHRvIHRoZSBET00gZWxlbWVudHMuXHJcbiovXHJcbmZ1bmN0aW9uIGluaXRFbGVtZW50cyhmb3JtKSB7XHJcbiAgLy8gUHJlcGFyZSBzb3J0YWJsZSBzY3JpcHRcclxuICAkKFwiLnBvc2l0aW9ucGhvdG9zLWdhbGxlcnkgPiBvbFwiLCBmb3JtKS5zb3J0YWJsZSh7XHJcbiAgICBwbGFjZWhvbGRlcjogXCJ1aS1zdGF0ZS1oaWdobGlnaHRcIixcclxuICAgIHVwZGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyBHZXQgcGhvdG8gb3JkZXIsIGEgY29tbWEgc2VwYXJhdGVkIHZhbHVlIG9mIGl0ZW1zIElEc1xyXG4gICAgICB2YXIgb3JkZXIgPSAkKHRoaXMpLnNvcnRhYmxlKFwidG9BcnJheVwiKS50b1N0cmluZygpO1xyXG4gICAgICAvLyBTZXQgb3JkZXIgaW4gdGhlIGZvcm0gZWxlbWVudCwgdG8gYmUgc2VudCBsYXRlciB3aXRoIHRoZSBmb3JtXHJcbiAgICAgICQodGhpcykuY2xvc2VzdChzZWN0aW9uU2VsZWN0b3IpLmZpbmQoJ1tuYW1lPWdhbGxlcnktb3JkZXJdJykudmFsKG9yZGVyKS5jaGFuZ2UoKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gU2V0IHByaW1hcnkgcGhvdG8gdG8gYmUgZWRpdGVkXHJcbiAgdmFyIGVkaXRQYW5lbCA9ICQoJy5wb3NpdGlvbnBob3Rvcy1lZGl0JywgZm9ybSk7XHJcbiAgLy8gTG9vayBmb3IgYSBzZWxlY3RlZCBwaG90byBpbiB0aGUgbGlzdFxyXG4gIHZhciBzZWxlY3RlZCA9ICQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2wgPiBsaS5zZWxlY3RlZCcsIGZvcm0pO1xyXG4gIGlmIChzZWxlY3RlZCAhPT0gbnVsbCAmJiBzZWxlY3RlZC5sZW5ndGggPiAwKSB7XHJcbiAgICB2YXIgc2VsSW1nID0gc2VsZWN0ZWQuZmluZCgnaW1nJyk7XHJcbiAgICAvLyBNb3Zpbmcgc2VsZWN0ZWQgdG8gYmUgZWRpdCBwYW5lbFxyXG4gICAgdmFyIHBob3RvSUQgPSBzZWxlY3RlZC5hdHRyKCdpZCcpLm1hdGNoKC9eVXNlclBob3RvLShcXGQrKSQvKVsxXTtcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbChwaG90b0lEKTtcclxuICAgIGVkaXRQYW5lbC5maW5kKCdpbWcnKS5hdHRyKCdzcmMnLCBzZWxJbWcuYXR0cignc3JjJykpO1xyXG4gICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPXBob3RvLWNhcHRpb25dJykudmFsKHNlbEltZy5hdHRyKCdhbHQnKSk7XHJcbiAgICB2YXIgaXNQcmltYXJ5VmFsdWUgPSBzZWxlY3RlZC5oYXNDbGFzcygnaXMtcHJpbWFyeS1waG90bycpID8gJ1RydWUnIDogJ0ZhbHNlJztcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1pcy1wcmltYXJ5LXBob3RvXScpLnByb3AoJ2NoZWNrZWQnLCBmYWxzZSk7XHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9aXMtcHJpbWFyeS1waG90b11bdmFsdWU9JyArIGlzUHJpbWFyeVZhbHVlICsgJ10nKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGlmIChmb3JtLmZpbmQoJy5wb3NpdGlvbnBob3Rvcy1nYWxsZXJ5ID4gb2wgPiBsaScpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGZvcm0uZmluZCgnLm5vLXBob3RvcycpLCBlZGl0UGFuZWwsICcnLCB7IGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKGZvcm0uZmluZCgnLm5vLXByaW1hcnktcGhvdG8nKSwgZWRpdFBhbmVsLCAnJywgeyBhdXRvZm9jdXM6IGZhbHNlIH0pO1xyXG4gICAgfVxyXG4gICAgLy8gUmVzZXQgaGlkZGVuIGZpZWxkcyBtYW51YWxseSB0byBhdm9pZCBicm93c2VyIG1lbW9yeSBicmVha2luZyB0aGluZ3NcclxuICAgIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1QaG90b0lEXScpLnZhbCgnJyk7XHJcbiAgICBlZGl0UGFuZWwuZmluZCgnW25hbWU9cGhvdG8tY2FwdGlvbl0nKS52YWwoJycpO1xyXG4gICAgZWRpdFBhbmVsLmZpbmQoJ1tuYW1lPWlzLXByaW1hcnktcGhvdG9dJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcclxuICB9XHJcbiAgLy8gUmVzZXQgZGVsZXRlIG9wdGlvblxyXG4gIGVkaXRQYW5lbC5maW5kKCdbbmFtZT1kZWxldGUtcGhvdG9dJykudmFsKCdGYWxzZScpO1xyXG5cclxufVxyXG4iLCLvu78vKiogQXZhaWxhYmlsaXR5OiBXZWVrbHkgU2NoZWR1bGUgc2VjdGlvbiBzZXR1cFxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGF2YWlsYWJpbGl0eUNhbGVuZGFyID0gcmVxdWlyZSgnTEMvYXZhaWxhYmlsaXR5Q2FsZW5kYXInKTtcclxudmFyIGJhdGNoRXZlbnRIYW5kbGVyID0gcmVxdWlyZSgnTEMvYmF0Y2hFdmVudEhhbmRsZXInKTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIG1vbnRobHlMaXN0ID0gYXZhaWxhYmlsaXR5Q2FsZW5kYXIuTW9udGhseS5lbmFibGVBbGwoKTtcclxuXHJcbiAgICAkLmVhY2gobW9udGhseUxpc3QsIGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgdmFyIG1vbnRobHkgPSB0aGlzO1xyXG5cclxuICAgICAgICAvLyBTZXR1cGluZyB0aGUgY2FsZW5kYXIgZGF0YSBmaWVsZFxyXG4gICAgICAgIHZhciBmb3JtID0gbW9udGhseS4kZWwuY2xvc2VzdCgnZm9ybS5hamF4LGZpZWxkc2V0LmFqYXgnKTtcclxuICAgICAgICB2YXIgZmllbGQgPSBmb3JtLmZpbmQoJ1tuYW1lPW1vbnRobHldJyk7XHJcbiAgICAgICAgaWYgKGZpZWxkLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgZmllbGQgPSAkKCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJtb250aGx5XCIgLz4nKS5pbnNlcnRBZnRlcihtb250aGx5LiRlbCk7XHJcblxyXG4gICAgICAgIC8vIFNhdmUgd2hlbiB0aGUgZm9ybSBpcyB0byBiZSBzdWJtaXR0ZWRcclxuICAgICAgICBmb3JtLm9uKCdwcmVzdWJtaXQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZpZWxkLnZhbChKU09OLnN0cmluZ2lmeShtb250aGx5LmdldFVwZGF0ZWREYXRhKCkpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVXBkYXRpbmcgZmllbGQgb24gY2FsZW5kYXIgY2hhbmdlcyAodXNpbmcgYmF0Y2ggdG8gYXZvaWQgaHVydCBwZXJmb3JtYW5jZSlcclxuICAgICAgICAvLyBhbmQgcmFpc2UgY2hhbmdlIGV2ZW50ICh0aGlzIGZpeGVzIHRoZSBzdXBwb3J0IGZvciBjaGFuZ2VzTm90aWZpY2F0aW9uXHJcbiAgICAgICAgLy8gYW5kIGluc3RhbnQtc2F2aW5nKS5cclxuICAgICAgICBtb250aGx5LmV2ZW50cy5vbignZGF0YUNoYW5nZWQnLCBiYXRjaEV2ZW50SGFuZGxlcihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZpZWxkXHJcbiAgICAgICAgICAgIC52YWwoSlNPTi5zdHJpbmdpZnkobW9udGhseS5nZXRVcGRhdGVkRGF0YSgpKSlcclxuICAgICAgICAgICAgLmNoYW5nZSgpO1xyXG4gICAgICAgIH0pKTtcclxuICAgIH0pO1xyXG59OyIsIu+7vy8qKlxyXG5wYXltZW50OiB3aXRoIHRoZSBwcm9wZXIgaHRtbCBhbmQgZm9ybVxyXG5yZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuZm9ybWF0dGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gb25QYXltZW50QWNjb3VudChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICB2YXIgZmluaXQgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgZm9ybWF0dGVycyBvbiBwYWdlLXJlYWR5Li5cclxuICAgIGluaXRGb3JtYXR0ZXJzKCRjKTtcclxuXHJcbiAgICBjaGFuZ2VQYXltZW50TWV0aG9kKCRjKTtcclxuXHJcbiAgfTtcclxuICAkKGZpbml0KTtcclxuICAvLyBhbmQgYW55IGFqYXgtcG9zdCBvZiB0aGUgZm9ybSB0aGF0IHJldHVybnMgbmV3IGh0bWw6XHJcbiAgJGMub24oJ2FqYXhGb3JtUmV0dXJuZWRIdG1sJywgJ2Zvcm0uYWpheCcsIGZpbml0KTtcclxufTtcclxuXHJcbi8qKiBJbml0aWFsaXplIHRoZSBmaWVsZCBmb3JtYXR0ZXJzIHJlcXVpcmVkIGJ5IHRoZSBwYXltZW50LWFjY291bnQtZm9ybSwgYmFzZWRcclxuICBvbiB0aGUgZmllbGRzIG5hbWVzLlxyXG4qKi9cclxuZnVuY3Rpb24gaW5pdEZvcm1hdHRlcnMoJGNvbnRhaW5lcikge1xyXG4gICRjb250YWluZXIuZmluZCgnW25hbWU9XCJiaXJ0aGRhdGVcIl0nKS5mb3JtYXR0ZXIoe1xyXG4gICAgJ3BhdHRlcm4nOiAne3s5OX19L3t7OTl9fS97ezk5OTl9fScsXHJcbiAgICAncGVyc2lzdGVudCc6IGZhbHNlXHJcbiAgfSk7XHJcbiAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cInNzblwiXScpLmZvcm1hdHRlcih7XHJcbiAgICAncGF0dGVybic6ICd7ezk5OX19LXt7OTl9fS17ezk5OTl9fScsXHJcbiAgICAncGVyc2lzdGVudCc6IGZhbHNlXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNoYW5nZVBheW1lbnRNZXRob2QoJGNvbnRhaW5lcikge1xyXG5cclxuICB2YXIgJGJhbmsgPSAkY29udGFpbmVyLmZpbmQoJy5EYXNoYm9hcmRQYXltZW50QWNjb3VudC1iYW5rJyksXHJcbiAgICAkZWxzID0gJGNvbnRhaW5lci5maW5kKCcuRGFzaGJvYXJkUGF5bWVudEFjY291bnQtY2hhbmdlTWV0aG9kJylcclxuICAgIC5hZGQoJGJhbmspO1xyXG5cclxuICAkY29udGFpbmVyLmZpbmQoJy5BY3Rpb25zLS1jaGFuZ2VQYXltZW50TWV0aG9kJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xyXG4gICAgJGVscy50b2dnbGVDbGFzcygnaXMtdmVubW9BY2NvdW50IGlzLWJhbmtBY2NvdW50Jyk7XHJcblxyXG4gICAgaWYgKCRiYW5rLmhhc0NsYXNzKCdpcy12ZW5tb0FjY291bnQnKSkge1xyXG4gICAgICAvLyBSZW1vdmUgYW5kIHNhdmUgbnVtYmVyc1xyXG4gICAgICAkYmFuay5maW5kKCdpbnB1dCcpLnZhbChmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgICQodGhpcykuZGF0YSgncHJldi12YWwnLCB2KTtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gUmVzdG9yZSBudW1iZXJzXHJcbiAgICAgICRiYW5rLmZpbmQoJ2lucHV0JykudmFsKGZ1bmN0aW9uIChpLCB2KSB7XHJcbiAgICAgICAgcmV0dXJuICQodGhpcykuZGF0YSgncHJldi12YWwnKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG59Iiwi77u/LyoqIFByaWNpbmcgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgVGltZVNwYW4gPSByZXF1aXJlKCdMQy9UaW1lU3BhbicpO1xyXG5yZXF1aXJlKCdMQy9UaW1lU3BhbkV4dHJhJykucGx1Z0luKFRpbWVTcGFuKTtcclxudmFyIHVwZGF0ZVRvb2x0aXBzID0gcmVxdWlyZSgnTEMvdG9vbHRpcHMnKS51cGRhdGVUb29sdGlwcztcclxuXHJcbi8vIFRPRE86IFJlcGxhY2UgYnkgcmVhbCByZXF1aXJlIGFuZCBub3QgZ2xvYmFsIExDOlxyXG4vL3ZhciBhamF4Rm9ybXMgPSByZXF1aXJlKCcuLi9MQy9hamF4Rm9ybXMnKTtcclxuLy92YXIgY3J1ZGwgPSByZXF1aXJlKCcuLi9MQy9jcnVkbCcpLnNldHVwKGFqYXhGb3Jtcy5vblN1Y2Nlc3MsIGFqYXhGb3Jtcy5vbkVycm9yLCBhamF4Rm9ybXMub25Db21wbGV0ZSk7XHJcbi8vTEMuaW5pdENydWRsID0gY3J1ZGwub247XHJcbnZhciBpbml0Q3J1ZGwgPSBMQy5pbml0Q3J1ZGw7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKHByaWNpbmdTZWxlY3Rvcikge1xyXG4gIHByaWNpbmdTZWxlY3RvciA9IHByaWNpbmdTZWxlY3RvciB8fCAnLkRhc2hib2FyZFByaWNpbmcnO1xyXG4gIHZhciAkcHJpY2luZyA9ICQocHJpY2luZ1NlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkcHJpY2luZy5zaWJsaW5ncygpXHJcbiAgICAgIC5hZGQoJHByaWNpbmcuZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAuYWRkKCRwcmljaW5nLmNsb3Nlc3QoJy5EYXNoYm9hcmRZb3VyV29yaycpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwocHJpY2luZ1NlbGVjdG9yKTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG5cclxuICAgIHNldHVwTm9QcmljZVJhdGVVcGRhdGVzKCRlZGl0b3IpO1xyXG4gICAgc2V0dXBQcm92aWRlclBhY2thZ2VTbGlkZXJzKCRlZGl0b3IpO1xyXG4gICAgdXBkYXRlVG9vbHRpcHMoKTtcclxuICAgIHNldHVwU2hvd01vcmVBdHRyaWJ1dGVzTGluaygkZWRpdG9yKTtcclxuXHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKiBIYW5kbGVyIGZvciBjaGFuZ2UgZXZlbnQgb24gJ25vdCB0byBzdGF0ZSBwcmljZSByYXRlJywgdXBkYXRpbmcgcmVsYXRlZCBwcmljZSByYXRlIGZpZWxkcy5cclxuICBJdHMgc2V0dXBlZCBwZXIgZWRpdG9yIGluc3RhbmNlLCBub3QgYXMgYW4gZXZlbnQgZGVsZWdhdGUuXHJcbiovXHJcbmZ1bmN0aW9uIHNldHVwTm9QcmljZVJhdGVVcGRhdGVzKCRlZGl0b3IpIHtcclxuICB2YXIgXHJcbiAgICBwciA9ICRlZGl0b3IuZmluZCgnW25hbWU9cHJpY2UtcmF0ZV0sW25hbWU9cHJpY2UtcmF0ZS11bml0XScpLFxyXG4gICAgbnByID0gJGVkaXRvci5maW5kKCdbbmFtZT1uby1wcmljZS1yYXRlXScpO1xyXG4gIG5wci5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgcHIucHJvcCgnZGlzYWJsZWQnLCBucHIucHJvcCgnY2hlY2tlZCcpKTtcclxuICB9KTtcclxuICAvLyBJbml0aWFsIHN0YXRlOlxyXG4gIG5wci5jaGFuZ2UoKTtcclxufVxyXG5cclxuLyoqIFNldHVwIHRoZSBVSSBTbGlkZXJzIG9uIHRoZSBlZGl0b3IuXHJcbioqL1xyXG5mdW5jdGlvbiBzZXR1cFByb3ZpZGVyUGFja2FnZVNsaWRlcnMoJGVkaXRvcikge1xyXG5cclxuICAvKiBIb3VzZWVrZWVwZXIgcHJpY2luZyAqL1xyXG4gIGZ1bmN0aW9uIHVwZGF0ZUF2ZXJhZ2UoJGMsIG1pbnV0ZXMpIHtcclxuICAgICRjLmZpbmQoJ1tuYW1lPXByb3ZpZGVyLWF2ZXJhZ2UtdGltZV0nKS52YWwobWludXRlcyk7XHJcbiAgICBtaW51dGVzID0gcGFyc2VJbnQobWludXRlcyk7XHJcbiAgICAkYy5maW5kKCcucHJldmlldyAudGltZScpLnRleHQoVGltZVNwYW4uZnJvbU1pbnV0ZXMobWludXRlcykudG9TbWFydFN0cmluZygpKTtcclxuICB9XHJcblxyXG4gICRlZGl0b3IuZmluZChcIi5wcm92aWRlci1hdmVyYWdlLXRpbWUtc2xpZGVyXCIpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyICRjID0gJCh0aGlzKS5jbG9zZXN0KCdbZGF0YS1zbGlkZXItdmFsdWVdJyk7XHJcbiAgICB2YXIgYXZlcmFnZSA9ICRjLmRhdGEoJ3NsaWRlci12YWx1ZScpLFxyXG4gICAgICBzdGVwID0gJGMuZGF0YSgnc2xpZGVyLXN0ZXAnKSB8fCAxO1xyXG4gICAgaWYgKCFhdmVyYWdlKSByZXR1cm47XHJcbiAgICB2YXIgc2V0dXAgPSB7XHJcbiAgICAgIHJhbmdlOiBcIm1pblwiLFxyXG4gICAgICB2YWx1ZTogYXZlcmFnZSxcclxuICAgICAgbWluOiBhdmVyYWdlIC0gMyAqIHN0ZXAsXHJcbiAgICAgIG1heDogYXZlcmFnZSArIDMgKiBzdGVwLFxyXG4gICAgICBzdGVwOiBzdGVwLFxyXG4gICAgICBzbGlkZTogZnVuY3Rpb24gKGV2ZW50LCB1aSkge1xyXG4gICAgICAgIHVwZGF0ZUF2ZXJhZ2UoJGMsIHVpLnZhbHVlKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIHZhciBzbGlkZXIgPSAkKHRoaXMpLnNsaWRlcihzZXR1cCk7XHJcblxyXG4gICAgJGMuZmluZCgnLnByb3ZpZGVyLWF2ZXJhZ2UtdGltZScpLm9uKCdjbGljaycsICdsYWJlbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyICR0ID0gJCh0aGlzKTtcclxuICAgICAgaWYgKCR0Lmhhc0NsYXNzKCdiZWxvdy1hdmVyYWdlLWxhYmVsJykpXHJcbiAgICAgICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBzZXR1cC5taW4pO1xyXG4gICAgICBlbHNlIGlmICgkdC5oYXNDbGFzcygnYXZlcmFnZS1sYWJlbCcpKVxyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgc2V0dXAudmFsdWUpO1xyXG4gICAgICBlbHNlIGlmICgkdC5oYXNDbGFzcygnYWJvdmUtYXZlcmFnZS1sYWJlbCcpKVxyXG4gICAgICAgIHNsaWRlci5zbGlkZXIoJ3ZhbHVlJywgc2V0dXAubWF4KTtcclxuICAgICAgdXBkYXRlQXZlcmFnZSgkYywgc2xpZGVyLnNsaWRlcigndmFsdWUnKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZXR1cCB0aGUgaW5wdXQgZmllbGQsIGhpZGRlbiBhbmQgd2l0aCBpbml0aWFsIHZhbHVlIHN5bmNocm9uaXplZCB3aXRoIHNsaWRlclxyXG4gICAgdmFyIGZpZWxkID0gJGMuZmluZCgnW25hbWU9cHJvdmlkZXItYXZlcmFnZS10aW1lXScpO1xyXG4gICAgZmllbGQuaGlkZSgpO1xyXG4gICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGZpZWxkLnZhbCgpIHx8IGF2ZXJhZ2U7XHJcbiAgICB1cGRhdGVBdmVyYWdlKCRjLCBjdXJyZW50VmFsdWUpO1xyXG4gICAgc2xpZGVyLnNsaWRlcigndmFsdWUnLCBjdXJyZW50VmFsdWUpO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vKiogVGhlIGluLWVkaXRvciBsaW5rICNzaG93LW1vcmUtYXR0cmlidXRlcyBtdXN0IHNob3cvaGlkZSB0aGUgY29udGFpbmVyIG9mXHJcbiAgZXh0cmEgYXR0cmlidXRlcyBmb3IgdGhlIHBhY2thZ2UvcHJpY2luZy1pdGVtLiBUaGlzIHNldHVwcyB0aGUgcmVxdWlyZWQgaGFuZGxlci5cclxuKiovXHJcbmZ1bmN0aW9uIHNldHVwU2hvd01vcmVBdHRyaWJ1dGVzTGluaygkZWRpdG9yKSB7XHJcbiAgLy8gSGFuZGxlciBmb3IgJ3Nob3ctbW9yZS1hdHRyaWJ1dGVzJyBidXR0b24gKHVzZWQgb25seSBvbiBlZGl0IGEgcGFja2FnZSlcclxuICAkZWRpdG9yLmZpbmQoJy5zaG93LW1vcmUtYXR0cmlidXRlcycpLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciAkdCA9ICQodGhpcyk7XHJcbiAgICB2YXIgYXR0cyA9ICR0LnNpYmxpbmdzKCcuc2VydmljZXMtbm90LWNoZWNrZWQnKTtcclxuICAgIGlmIChhdHRzLmlzKCc6dmlzaWJsZScpKSB7XHJcbiAgICAgICR0LnRleHQoJHQuZGF0YSgnc2hvdy10ZXh0JykpO1xyXG4gICAgICBhdHRzLnN0b3AoKS5oaWRlKCdmYXN0Jyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAkdC50ZXh0KCR0LmRhdGEoJ2hpZGUtdGV4dCcpKTtcclxuICAgICAgYXR0cy5zdG9wKCkuc2hvdygnZmFzdCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG59Iiwi77u/LyoqXHJcbiAgcHJpdmFjeVNldHRpbmdzOiBTZXR1cCBmb3IgdGhlIHNwZWNpZmljIHBhZ2UtZm9ybSBkYXNoYm9hcmQvcHJpdmFjeS9wcml2YWN5c2V0dGluZ3NcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbi8vIFRPRE8gSW1wbGVtZW50IGRlcGVuZGVuY2llcyBjb21taW5nIGZyb20gYXBwLmpzIGluc3RlYWQgb2YgZGlyZWN0IGxpbmtcclxuLy92YXIgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCdzbW9vdGhCb3hCbG9jaycpO1xyXG4vLyBUT0RPIFJlcGxhY2UgZG9tLXJlc3NvdXJjZXMgYnkgaTE4bi5nZXRUZXh0XHJcblxyXG52YXIgcHJpdmFjeSA9IHtcclxuICBhY2NvdW50TGlua3NTZWxlY3RvcjogJy5EYXNoYm9hcmRQcml2YWN5U2V0dGluZ3MtbXlBY2NvdW50IGEnLFxyXG4gIHJlc3NvdXJjZXNTZWxlY3RvcjogJy5EYXNoYm9hcmRQcml2YWN5LWFjY291bnRSZXNzb3VyY2VzJ1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwcml2YWN5O1xyXG5cclxucHJpdmFjeS5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAkYy5vbignY2xpY2snLCAnLmNhbmNlbC1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBzbW9vdGhCb3hCbG9jay5jbG9zZSgkYyk7XHJcbiAgfSk7XHJcblxyXG4gICRjLm9uKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgJy5hamF4LWJveCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICB9KTtcclxuICBcclxuICAkYy5vbignY2xpY2snLCBwcml2YWN5LmFjY291bnRMaW5rc1NlbGVjdG9yLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgdmFyIGIsXHJcbiAgICAgIGxyZXMgPSAkYy5maW5kKHByaXZhY3kucmVzc291cmNlc1NlbGVjdG9yKTtcclxuXHJcbiAgICBzd2l0Y2ggKCQodGhpcykuYXR0cignaHJlZicpKSB7XHJcbiAgICAgIGNhc2UgJyNkZWxldGUtbXktYWNjb3VudCc6XHJcbiAgICAgICAgYiA9IHNtb290aEJveEJsb2NrLm9wZW4obHJlcy5jaGlsZHJlbignLmRlbGV0ZS1tZXNzYWdlLWNvbmZpcm0nKS5jbG9uZSgpLCAkYyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJyNkZWFjdGl2YXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5kZWFjdGl2YXRlLW1lc3NhZ2UtY29uZmlybScpLmNsb25lKCksICRjKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnI3JlYWN0aXZhdGUtbXktYWNjb3VudCc6XHJcbiAgICAgICAgYiA9IHNtb290aEJveEJsb2NrLm9wZW4obHJlcy5jaGlsZHJlbignLnJlYWN0aXZhdGUtbWVzc2FnZS1jb25maXJtJykuY2xvbmUoKSwgJGMpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgaWYgKGIpIHtcclxuICAgICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBiLm9mZnNldCgpLnRvcCB9LCA1MDAsIG51bGwpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0pO1xyXG5cclxufTsiLCLvu78vKiogU2VydmljZSBBdHRyaWJ1dGVzIFZhbGlkYXRpb246IGltcGxlbWVudHMgdmFsaWRhdGlvbnMgdGhyb3VnaCB0aGUgXHJcbiAgJ2N1c3RvbVZhbGlkYXRpb24nIGFwcHJvYWNoIGZvciAncG9zaXRpb24gc2VydmljZSBhdHRyaWJ1dGVzJy5cclxuICBJdCB2YWxpZGF0ZXMgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBjYXRlZ29yeSwgYWxtb3N0LW9uZSBvciBzZWxlY3Qtb25lIG1vZGVzLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxudmFyIGdldFRleHQgPSByZXF1aXJlKCdMQy9nZXRUZXh0Jyk7XHJcbnZhciB2aCA9IHJlcXVpcmUoJ0xDL3ZhbGlkYXRpb25IZWxwZXInKTtcclxudmFyIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUgPSByZXF1aXJlKCdMQy9qcXVlcnlVdGlscycpLmVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU7XHJcblxyXG4vKiogRW5hYmxlIHZhbGlkYXRpb24gb2YgcmVxdWlyZWQgc2VydmljZSBhdHRyaWJ1dGVzIG9uXHJcbiAgdGhlIGZvcm0ocykgc3BlY2lmaWVkIGJ5IHRoZSBzZWxlY3RvciBvciBwcm92aWRlZFxyXG4qKi9cclxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uIHNldHVwU2VydmljZUF0dHJpYnV0ZXNWYWxpZGF0aW9uKGNvbnRhaW5lclNlbGVjdG9yLCBvcHRpb25zKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcbiAgb3B0aW9ucyA9ICQuZXh0ZW5kKHtcclxuICAgIHJlcXVpcmVkU2VsZWN0b3I6ICcuRGFzaGJvYXJkU2VydmljZXMtYXR0cmlidXRlcy1jYXRlZ29yeS5pcy1yZXF1aXJlZCcsXHJcbiAgICBzZWxlY3RPbmVDbGFzczogJ2pzLXZhbGlkYXRpb25TZWxlY3RPbmUnLFxyXG4gICAgZ3JvdXBFcnJvckNsYXNzOiAnaXMtZXJyb3InLFxyXG4gICAgdmFsRXJyb3JUZXh0S2V5OiAncmVxdWlyZWQtYXR0cmlidXRlLWNhdGVnb3J5LWVycm9yJ1xyXG4gIH0sIG9wdGlvbnMpO1xyXG5cclxuICAkYy5lYWNoKGZ1bmN0aW9uIHZhbGlkYXRlU2VydmljZUF0dHJpYnV0ZXMoKSB7XHJcbiAgICB2YXIgZiA9ICQodGhpcyk7XHJcbiAgICBpZiAoIWYuaXMoJ2Zvcm0sZmllbGRzZXQnKSkge1xyXG4gICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmVycm9yKSBjb25zb2xlLmVycm9yKCdUaGUgZWxlbWVudCB0byBhcHBseSB2YWxpZGF0aW9uIG11c3QgYmUgYSBmb3JtIG9yIGZpZWxkc2V0Jyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBmLmRhdGEoJ2N1c3RvbVZhbGlkYXRpb24nLCB7XHJcbiAgICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHZhbGlkID0gdHJ1ZSwgbGFzdFZhbGlkID0gdHJ1ZTtcclxuICAgICAgICB2YXIgdiA9IHZoLmZpbmRWYWxpZGF0aW9uU3VtbWFyeShmKTtcclxuXHJcbiAgICAgICAgZi5maW5kKG9wdGlvbnMucmVxdWlyZWRTZWxlY3RvcikuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICB2YXIgZnMgPSAkKHRoaXMpO1xyXG4gICAgICAgICAgdmFyIGNhdCA9IGZzLmNoaWxkcmVuKCdsZWdlbmQnKS50ZXh0KCk7XHJcbiAgICAgICAgICAvLyBXaGF0IHR5cGUgb2YgdmFsaWRhdGlvbiBhcHBseT9cclxuICAgICAgICAgIGlmIChmcy5pcygnLicgKyBvcHRpb25zLnNlbGVjdE9uZUNsYXNzKSlcclxuICAgICAgICAgIC8vIGlmIHRoZSBjYXQgaXMgYSAndmFsaWRhdGlvbi1zZWxlY3Qtb25lJywgYSAnc2VsZWN0JyBlbGVtZW50IHdpdGggYSAncG9zaXRpdmUnXHJcbiAgICAgICAgICAvLyA6c2VsZWN0ZWQgdmFsdWUgbXVzdCBiZSBjaGVja2VkXHJcbiAgICAgICAgICAgIGxhc3RWYWxpZCA9ICEhKGZzLmZpbmQoJ29wdGlvbjpzZWxlY3RlZCcpLnZhbCgpKTtcclxuICAgICAgICAgIGVsc2VcclxuICAgICAgICAgIC8vIE90aGVyd2lzZSwgbG9vayBmb3IgJ2FsbW9zdCBvbmUnIGNoZWNrZWQgdmFsdWVzOlxyXG4gICAgICAgICAgICBsYXN0VmFsaWQgPSAoZnMuZmluZCgnaW5wdXQ6Y2hlY2tlZCcpLmxlbmd0aCA+IDApO1xyXG5cclxuICAgICAgICAgIGlmICghbGFzdFZhbGlkKSB7XHJcbiAgICAgICAgICAgIHZhbGlkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGZzLmFkZENsYXNzKG9wdGlvbnMuZ3JvdXBFcnJvckNsYXNzKTtcclxuICAgICAgICAgICAgdmFyIGVyciA9IGdldFRleHQob3B0aW9ucy52YWxFcnJvclRleHRLZXksIGNhdCk7XHJcbiAgICAgICAgICAgIGlmICh2LmZpbmQoJ2xpW3RpdGxlPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoY2F0KSArICdcIl0nKS5sZW5ndGggPT09IDApXHJcbiAgICAgICAgICAgICAgdi5jaGlsZHJlbigndWwnKS5hcHBlbmQoJCgnPGxpLz4nKS50ZXh0KGVycikuYXR0cigndGl0bGUnLCBjYXQpKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZzLnJlbW92ZUNsYXNzKG9wdGlvbnMuZ3JvdXBFcnJvckNsYXNzKTtcclxuICAgICAgICAgICAgdi5maW5kKCdsaVt0aXRsZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGNhdCkgKyAnXCJdJykucmVtb3ZlKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmICh2YWxpZCkge1xyXG4gICAgICAgICAgdmguc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGYpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB2aC5zZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IoZik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2YWxpZDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIH0pO1xyXG59O1xyXG4iLCLvu78vKiogSXQgcHJvdmlkZXMgdGhlIGNvZGUgZm9yIHRoZSBhY3Rpb25zIG9mIHRoZSBWZXJpZmljYXRpb25zIHNlY3Rpb24uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG4vL3ZhciBMY1VybCA9IHJlcXVpcmUoJy4uL0xDL0xjVXJsJyk7XHJcbi8vdmFyIHBvcHVwID0gcmVxdWlyZSgnLi4vTEMvcG9wdXAnKTtcclxuXHJcbnZhciBhY3Rpb25zID0gZXhwb3J0cy5hY3Rpb25zID0ge307XHJcblxyXG5hY3Rpb25zLmZhY2Vib29rID0gZnVuY3Rpb24gKCkge1xyXG4gIC8qIEZhY2Vib29rIGNvbm5lY3QgKi9cclxuICB2YXIgRmFjZWJvb2tDb25uZWN0ID0gcmVxdWlyZSgnTEMvRmFjZWJvb2tDb25uZWN0Jyk7XHJcbiAgdmFyIGZiID0gbmV3IEZhY2Vib29rQ29ubmVjdCh7XHJcbiAgICByZXN1bHRUeXBlOiAnanNvbicsXHJcbiAgICB1cmxTZWN0aW9uOiAnVmVyaWZ5JyxcclxuICAgIGFwcElkOiAkKCdodG1sJykuZGF0YSgnZmItYXBwaWQnKSxcclxuICAgIHBlcm1pc3Npb25zOiAnZW1haWwsdXNlcl9hYm91dF9tZScsXHJcbiAgICBsb2FkaW5nVGV4dDogJ1ZlcmlmaW5nJ1xyXG4gIH0pO1xyXG4gICQoZG9jdW1lbnQpLm9uKGZiLmNvbm5lY3RlZEV2ZW50LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKGRvY3VtZW50KS5vbigncG9wdXAtY2xvc2VkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG4gIGZiLmNvbm5lY3QoKTtcclxufTtcclxuXHJcbmFjdGlvbnMuZW1haWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgcG9wdXAoTGNVcmwuTGFuZ1BhdGggKyAnQWNjb3VudC8kUmVzZW5kQ29uZmlybWF0aW9uRW1haWwvbm93LycsIHBvcHVwLnNpemUoJ3NtYWxsJykpO1xyXG59O1xyXG5cclxudmFyIGxpbmtzID0gZXhwb3J0cy5saW5rcyA9IHtcclxuICAnI2Nvbm5lY3Qtd2l0aC1mYWNlYm9vayc6IGFjdGlvbnMuZmFjZWJvb2ssXHJcbiAgJyNjb25maXJtLWVtYWlsJzogYWN0aW9ucy5lbWFpbFxyXG59O1xyXG5cclxuZXhwb3J0cy5vbiA9IGZ1bmN0aW9uIChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAkYy5vbignY2xpY2snLCAnYScsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIEdldCB0aGUgYWN0aW9uIGxpbmsgb3IgZW1wdHlcclxuICAgIHZhciBsaW5rID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ2hyZWYnKSB8fCAnJztcclxuXHJcbiAgICAvLyBFeGVjdXRlIHRoZSBhY3Rpb24gYXR0YWNoZWQgdG8gdGhhdCBsaW5rXHJcbiAgICB2YXIgYWN0aW9uID0gbGlua3NbbGlua10gfHwgbnVsbDtcclxuICAgIGlmICh0eXBlb2YgKGFjdGlvbikgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgYWN0aW9uKCk7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9KTtcclxufTtcclxuIiwi77u/LyoqIFZlcmlmaWNhdGlvbnMgcGFnZSBzZXR1cCBmb3IgQ1JVREwgdXNlXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gVE9ETzogUmVwbGFjZSBieSByZWFsIHJlcXVpcmUgYW5kIG5vdCBnbG9iYWwgTEM6XHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxudmFyIGluaXRDcnVkbCA9IExDLmluaXRDcnVkbDtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIHNlY3Rpb25TZWxlY3RvciA9ICcuRGFzaGJvYXJkVmVyaWZpY2F0aW9ucycsXHJcbiAgICAkc2VjdGlvbiA9ICRjLmZpbmQoc2VjdGlvblNlbGVjdG9yKS5jbG9zZXN0KCcuRGFzaGJvYXJkU2VjdGlvbi1wYWdlLXNlY3Rpb24nKSxcclxuICAgICRvdGhlcnMgPSAkc2VjdGlvbi5zaWJsaW5ncygpXHJcbiAgICAgIC5hZGQoJHNlY3Rpb24uZmluZCgnLkRhc2hib2FyZFNlY3Rpb24tcGFnZS1zZWN0aW9uLWludHJvZHVjdGlvbicpKVxyXG4gICAgICAuYWRkKCRzZWN0aW9uLmNsb3Nlc3QoJy5EYXNoYm9hcmRBYm91dFlvdScpLnNpYmxpbmdzKCkpO1xyXG5cclxuICB2YXIgY3J1ZGwgPSBpbml0Q3J1ZGwoc2VjdGlvblNlbGVjdG9yKTtcclxuXHJcbiAgY3J1ZGwuZWxlbWVudHNcclxuICAub24oY3J1ZGwuc2V0dGluZ3MuZXZlbnRzWydlZGl0LXN0YXJ0cyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhoaWRlKHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXQtZW5kcyddLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAkb3RoZXJzLnhzaG93KHsgZWZmZWN0OiAnaGVpZ2h0JywgZHVyYXRpb246ICdzbG93JyB9KTtcclxuICB9KVxyXG4gIC5vbihjcnVkbC5zZXR0aW5ncy5ldmVudHNbJ2VkaXRvci1yZWFkeSddLCBmdW5jdGlvbiAoZSwgJGVkaXRvcikge1xyXG4gICAgcmVxdWlyZSgnLi9iYWNrZ3JvdW5kQ2hlY2tSZXF1ZXN0Jykuc2V0dXBGb3JtKCRlZGl0b3IuZmluZCgnLkRhc2hib2FyZEJhY2tncm91bmRDaGVjaycpKTtcclxuICB9KTtcclxufTtcclxuIiwi77u/LyoqIEF2YWlsYWJpbGl0eTogV2Vla2x5IFNjaGVkdWxlIHNlY3Rpb24gc2V0dXBcclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBhdmFpbGFiaWxpdHlDYWxlbmRhciA9IHJlcXVpcmUoJ0xDL2F2YWlsYWJpbGl0eUNhbGVuZGFyJyk7XHJcbnZhciBiYXRjaEV2ZW50SGFuZGxlciA9IHJlcXVpcmUoJ0xDL2JhdGNoRXZlbnRIYW5kbGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciB3b3JrSG91cnNMaXN0ID0gYXZhaWxhYmlsaXR5Q2FsZW5kYXIuV29ya0hvdXJzLmVuYWJsZUFsbCgpO1xyXG5cclxuICAgICQuZWFjaCh3b3JrSG91cnNMaXN0LCBmdW5jdGlvbiAoaSwgdikge1xyXG4gICAgICAgIHZhciB3b3JraG91cnMgPSB0aGlzO1xyXG5cclxuICAgICAgICAvLyBTZXR1cGluZyB0aGUgV29ya0hvdXJzIGNhbGVuZGFyIGRhdGEgZmllbGRcclxuICAgICAgICB2YXIgZm9ybSA9IHdvcmtob3Vycy4kZWwuY2xvc2VzdCgnZm9ybS5hamF4LCBmaWVsZHNldC5hamF4Jyk7XHJcbiAgICAgICAgdmFyIGZpZWxkID0gZm9ybS5maW5kKCdbbmFtZT13b3JraG91cnNdJyk7XHJcbiAgICAgICAgaWYgKGZpZWxkLmxlbmd0aCA9PT0gMClcclxuICAgICAgICAgICAgZmllbGQgPSAkKCc8aW5wdXQgdHlwZT1cImhpZGRlblwiIG5hbWU9XCJ3b3JraG91cnNcIiAvPicpLmluc2VydEFmdGVyKHdvcmtob3Vycy4kZWwpO1xyXG5cclxuICAgICAgICAvLyBTYXZlIHdoZW4gdGhlIGZvcm0gaXMgdG8gYmUgc3VibWl0dGVkXHJcbiAgICAgICAgZm9ybS5vbigncHJlc3VibWl0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmaWVsZC52YWwoSlNPTi5zdHJpbmdpZnkod29ya2hvdXJzLmRhdGEpKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVXBkYXRpbmcgZmllbGQgb24gY2FsZW5kYXIgY2hhbmdlcyAodXNpbmcgYmF0Y2ggdG8gYXZvaWQgaHVydCBwZXJmb3JtYW5jZSlcclxuICAgICAgICAvLyBhbmQgcmFpc2UgY2hhbmdlIGV2ZW50ICh0aGlzIGZpeGVzIHRoZSBzdXBwb3J0IGZvciBjaGFuZ2VzTm90aWZpY2F0aW9uXHJcbiAgICAgICAgLy8gYW5kIGluc3RhbnQtc2F2aW5nKS5cclxuICAgICAgICB3b3JraG91cnMuZXZlbnRzLm9uKCdkYXRhQ2hhbmdlZCcsIGJhdGNoRXZlbnRIYW5kbGVyKGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgIGZpZWxkXHJcbiAgICAgICAgICAgIC52YWwoSlNPTi5zdHJpbmdpZnkod29ya2hvdXJzLmRhdGEpKVxyXG4gICAgICAgICAgICAuY2hhbmdlKCk7XHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAvLyBEaXNhYmxpbmcgY2FsZW5kYXIgb24gZmllbGQgYWxsdGltZVxyXG4gICAgICAgIGZvcm0uZmluZCgnW25hbWU9YWxsdGltZV0nKS5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHQgPSAkKHRoaXMpLFxyXG4gICAgICAgIGNsID0gd29ya2hvdXJzLmNsYXNzZXMuZGlzYWJsZWQ7XHJcbiAgICAgICAgICAgIGlmIChjbClcclxuICAgICAgICAgICAgICAgIHdvcmtob3Vycy4kZWwudG9nZ2xlQ2xhc3MoY2wsICR0LnByb3AoJ2NoZWNrZWQnKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSk7XHJcbn07XHJcbiJdfQ==
;