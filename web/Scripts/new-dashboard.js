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
  ajaxCallbacks = require('./ajaxCallbacks');

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
  stateChangedDeclinedEvent: 'state-changed-declined'
};

/** changeState to the one given, it will raise a stateChangedEvent on success
  or stateChangedDeclinedEvent on error.
  @state: 'on' or 'off'
**/
ProviderPosition.prototype.changeState = function changePositionState(state) {
  var page = state == 'on' ? '$Reactivate' : '$Deactivate';
  var $d = $(document);
  var that = this;
  var ctx = { form: $d, box: $d };
  $.ajax({
    url: LcUrl.LangPath + 'NewDashboard/Position/' + page + '/?PositionID=' + this.positionId,
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
            smoothBoxBlock.open(msg, pos, that.declinedPopupClass, { closable: true, center: false, autofocus: false });
          }
        }
      });
      // Process the result, that eventually will call ajaxSuccessPost
      ajaxCallbacks.doJSONAction(data, text, jx, ctx);
    }
  });
  return this;
};

module.exports = ProviderPosition;
},{"./LcUrl":1,"./ajaxCallbacks":3,"./smoothBoxBlock":13}],3:[function(require,module,exports){
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
},{"./changesNotification":5,"./createIframe":6,"./moveFocusTo":10,"./popup":11,"./redirectTo":12,"./smoothBoxBlock":13,"./validationHelper":15}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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
},{"./getXPath":7,"./jqueryUtils":9}],6:[function(require,module,exports){
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


},{}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
function moveFocusTo(el, options) {
    options = $.extend({
        marginTop: 30
    }, options);
    $('html,body').stop(true, true).animate({ scrollTop: $(el).offset().top - options.marginTop }, 500, null);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = moveFocusTo;
}
},{}],11:[function(require,module,exports){
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
},{"./createIframe":6,"./moveFocusTo":10,"./smoothBoxBlock":13}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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
},{"./autoFocus":4,"./jquery.xtsh":8,"./jqueryUtils":9,"./moveFocusTo":10}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
/** changeProfilePhoto, it uses 'uploader' using html5, ajax and a specific page
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
    popup(LcUrl.LangPath + 'NewDashboard/AboutYou/ChangePhoto/', { width: 240, height: 240 });
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
      url: LcUrl.LangUrl + "NewDashboard/AboutYou/ChangePhoto/?delete=true",
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

},{}],17:[function(require,module,exports){
/** Education page setup for CRUDL use
**/
var $ = require('jquery');
require('jquery.blockUI');

//var ajaxForms = require('../LC/ajaxForms');
//var crudl = require('../LC/crudl').setup(ajaxForms.onSuccess, ajaxForms.onError, ajaxForms.onComplete);
//LC.initCrudl = crudl.on;

exports.on = function (containerSelector) {
  var $c = $(containerSelector),
    educationSelector = '.DashboardEducation',
    $others = $c.find(educationSelector).closest('.DashboardSection-page-section').siblings();

  var crudl = LC.initCrudl(educationSelector);
  //crudl.settings.effects['show-viewer'] = { effect: 'height', duration: 'slow' };

  crudl.elements
  .on(crudl.settings.events['edit-starts'], function () {
    $others.xhide({ effect: 'height', duraction: 'slow' });
  })
  .on(crudl.settings.events['edit-ends'], function () {
    $others.xshow({ effect: 'height', duraction: 'slow' });
  });
};

},{}],18:[function(require,module,exports){
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
},{}],19:[function(require,module,exports){
/**
payment: with the proper html and form
regenerates the button source-code and preview automatically.
**/
var $ = require('jquery');
require('jquery.formatter');

exports.on = function onPaymentAccount(containerSelector) {
  var $c = $(containerSelector);

  // Initialize the formatters on page-ready..
  var finit = function () { initFormatters($c); };
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
},{}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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
    requiredCatClass: 'is-required',
    selectOneClass: 'js-validationSelectOne',
    groupErrorClass: 'is-error',
    valErrorTextKey: 'required-attribute-category-error'
  }, options);

  $c.each(function validateServiceAttributes() {
    var f = $(this);
    if (!f.is('form')) {
      if (console && console.error) console.error('The element to apply validation must be a form');
      return;
    }

    f.data('customValidation', {
      validate: function () {
        var valid = true, lastValid = true;
        var v = vh.findValidationSummary(f);

        f.find('.' + options.requiredCatClass).each(function () {
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

},{}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
/**
    User private dashboard section
**/
var $ = require('jquery');

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

  /* Profile photo */
  var changeProfilePhoto = require('./dashboard/changeProfilePhoto');
  changeProfilePhoto.on('.DashboardAboutYou');

  /* About you / education */
  var education = require('./dashboard/educationCrudl');
  education.on('.DashboardAboutYou');

  /* About you / verifications */
  require('./dashboard/verificationsActions').on('.DashboardVerifications');

  /* Your work / services */
  require('./dashboard/serviceAttributesValidation').setup($('.DashboardYourWork form'));

});
},{"../LC/ProviderPosition":2,"../LC/toggle":14,"./dashboard/changeProfilePhoto":16,"./dashboard/educationCrudl":17,"./dashboard/generateBookNowButton":18,"./dashboard/paymentAccount":19,"./dashboard/privacySettings":20,"./dashboard/serviceAttributesValidation":21,"./dashboard/verificationsActions":22}]},{},[23])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXElhZ29cXFByb3hlY3Rvc1xcTG9jb25vbWljcy5jb21cXHNvdXJjZVxcd2ViXFxub2RlX21vZHVsZXNcXGdydW50LWJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyLXBhY2tcXF9wcmVsdWRlLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL0xjVXJsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL0xDL1Byb3ZpZGVyUG9zaXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvYWpheENhbGxiYWNrcy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9hdXRvRm9jdXMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvY2hhbmdlc05vdGlmaWNhdGlvbi5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9jcmVhdGVJZnJhbWUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvZ2V0WFBhdGguanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5Lnh0c2guanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvanF1ZXJ5VXRpbHMuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvbW92ZUZvY3VzVG8uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcG9wdXAuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvcmVkaXJlY3RUby5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy9zbW9vdGhCb3hCbG9jay5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9MQy90b2dnbGUuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvTEMvdmFsaWRhdGlvbkhlbHBlci5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2NoYW5nZVByb2ZpbGVQaG90by5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvZGFzaGJvYXJkL2VkdWNhdGlvbkNydWRsLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvZ2VuZXJhdGVCb29rTm93QnV0dG9uLmpzIiwiQzovVXNlcnMvSWFnby9Qcm94ZWN0b3MvTG9jb25vbWljcy5jb20vc291cmNlL3dlYi9TY3JpcHRzL2FwcC9kYXNoYm9hcmQvcGF5bWVudEFjY291bnQuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9wcml2YWN5U2V0dGluZ3MuanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC9zZXJ2aWNlQXR0cmlidXRlc1ZhbGlkYXRpb24uanMiLCJDOi9Vc2Vycy9JYWdvL1Byb3hlY3Rvcy9Mb2Nvbm9taWNzLmNvbS9zb3VyY2Uvd2ViL1NjcmlwdHMvYXBwL2Rhc2hib2FyZC92ZXJpZmljYXRpb25zQWN0aW9ucy5qcyIsIkM6L1VzZXJzL0lhZ28vUHJveGVjdG9zL0xvY29ub21pY3MuY29tL3NvdXJjZS93ZWIvU2NyaXB0cy9hcHAvbmV3LWRhc2hib2FyZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiogSW1wbGVtZW50cyBhIHNpbWlsYXIgTGNVcmwgb2JqZWN0IGxpa2UgdGhlIHNlcnZlci1zaWRlIG9uZSwgYmFzaW5nXHJcbiAgICBpbiB0aGUgaW5mb3JtYXRpb24gYXR0YWNoZWQgdG8gdGhlIGRvY3VtZW50IGF0ICdodG1sJyB0YWcgaW4gdGhlIFxyXG4gICAgJ2RhdGEtYmFzZS11cmwnIGF0dHJpYnV0ZSAodGhhdHMgdmFsdWUgaXMgdGhlIGVxdWl2YWxlbnQgZm9yIEFwcFBhdGgpLFxyXG4gICAgYW5kIHRoZSBsYW5nIGluZm9ybWF0aW9uIGF0ICdkYXRhLWN1bHR1cmUnLlxyXG4gICAgVGhlIHJlc3Qgb2YgVVJMcyBhcmUgYnVpbHQgZm9sbG93aW5nIHRoZSB3aW5kb3cubG9jYXRpb24gYW5kIHNhbWUgcnVsZXNcclxuICAgIHRoYW4gaW4gdGhlIHNlcnZlci1zaWRlIG9iamVjdC5cclxuKiovXHJcblxyXG52YXIgYmFzZSA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYmFzZS11cmwnKSxcclxuICAgIGxhbmcgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLWN1bHR1cmUnKSxcclxuICAgIGwgPSB3aW5kb3cubG9jYXRpb24sXHJcbiAgICB1cmwgPSBsLnByb3RvY29sICsgJy8vJyArIGwuaG9zdDtcclxuLy8gbG9jYXRpb24uaG9zdCBpbmNsdWRlcyBwb3J0LCBpZiBpcyBub3QgdGhlIGRlZmF1bHQsIHZzIGxvY2F0aW9uLmhvc3RuYW1lXHJcblxyXG5iYXNlID0gYmFzZSB8fCAnLyc7XHJcblxyXG52YXIgTGNVcmwgPSB7XHJcbiAgICBTaXRlVXJsOiB1cmwsXHJcbiAgICBBcHBQYXRoOiBiYXNlLFxyXG4gICAgQXBwVXJsOiB1cmwgKyBiYXNlLFxyXG4gICAgTGFuZ0lkOiBsYW5nLFxyXG4gICAgTGFuZ1BhdGg6IGJhc2UgKyBsYW5nICsgJy8nLFxyXG4gICAgTGFuZ1VybDogdXJsICsgYmFzZSArIGxhbmdcclxufTtcclxuTGNVcmwuTGFuZ1VybCA9IHVybCArIExjVXJsLkxhbmdQYXRoO1xyXG5MY1VybC5Kc29uUGF0aCA9IExjVXJsLkxhbmdQYXRoICsgJ0pTT04vJztcclxuTGNVcmwuSnNvblVybCA9IHVybCArIExjVXJsLkpzb25QYXRoO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMY1VybDsiLCIvKiogUHJvdmlkZXJQb3NpdGlvbiBjbGFzc1xyXG4gIEl0IHByb3ZpZGVzIG1pbmltdW4gbGlrZS1qcXVlcnkgZXZlbnQgbGlzdGVuZXJzXHJcbiAgd2l0aCBtZXRob2RzICdvbicgYW5kICdvZmYnLCBhbmQgaW50ZXJuYWxseSAndGhpcy5ldmVudHMnXHJcbiAgYmVpbmcgYSBqUXVlcnkuQ2FsbGJhY2tzLlxyXG4qKi9cclxudmFyIFxyXG4gICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICBMY1VybCA9IHJlcXVpcmUoJy4vTGNVcmwnKSxcclxuICBzbW9vdGhCb3hCbG9jayA9IHJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKSxcclxuICBhamF4Q2FsbGJhY2tzID0gcmVxdWlyZSgnLi9hamF4Q2FsbGJhY2tzJyk7XHJcblxyXG4vKiogQ29uc3RydWN0b3JcclxuKiovXHJcbnZhciBQcm92aWRlclBvc2l0aW9uID0gZnVuY3Rpb24gKHBvc2l0aW9uSWQpIHtcclxuICB0aGlzLnBvc2l0aW9uSWQgPSBwb3NpdGlvbklkO1xyXG5cclxuICAvLyBFdmVudHMgc3VwcG9ydCB0aHJvdWdoIGpxdWVyeS5DYWxsYmFja1xyXG4gIHRoaXMuZXZlbnRzID0gJC5DYWxsYmFja3MoKTtcclxuICB0aGlzLm9uID0gZnVuY3Rpb24gKCkgeyB0aGlzLmV2ZW50cy5hZGQuYXBwbHkodGhpcy5ldmVudHMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCkpOyByZXR1cm4gdGhpczsgfTtcclxuICB0aGlzLm9mZiA9IGZ1bmN0aW9uICgpIHsgdGhpcy5ldmVudHMucmVtb3ZlLmFwcGx5KHRoaXMuZXZlbnRzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTsgcmV0dXJuIHRoaXM7IH07XHJcbn07XHJcblxyXG4vLyBVc2luZyBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gYXMgcHJvdG90eXBlXHJcblByb3ZpZGVyUG9zaXRpb24ucHJvdG90eXBlID0ge1xyXG4gIGRlY2xpbmVkTWVzc2FnZUNsYXNzOiAnaW5mbycsXHJcbiAgZGVjbGluZWRQb3B1cENsYXNzOiAncG9zaXRpb24tc3RhdGUtY2hhbmdlJyxcclxuICBzdGF0ZUNoYW5nZWRFdmVudDogJ3N0YXRlLWNoYW5nZWQnLFxyXG4gIHN0YXRlQ2hhbmdlZERlY2xpbmVkRXZlbnQ6ICdzdGF0ZS1jaGFuZ2VkLWRlY2xpbmVkJ1xyXG59O1xyXG5cclxuLyoqIGNoYW5nZVN0YXRlIHRvIHRoZSBvbmUgZ2l2ZW4sIGl0IHdpbGwgcmFpc2UgYSBzdGF0ZUNoYW5nZWRFdmVudCBvbiBzdWNjZXNzXHJcbiAgb3Igc3RhdGVDaGFuZ2VkRGVjbGluZWRFdmVudCBvbiBlcnJvci5cclxuICBAc3RhdGU6ICdvbicgb3IgJ29mZidcclxuKiovXHJcblByb3ZpZGVyUG9zaXRpb24ucHJvdG90eXBlLmNoYW5nZVN0YXRlID0gZnVuY3Rpb24gY2hhbmdlUG9zaXRpb25TdGF0ZShzdGF0ZSkge1xyXG4gIHZhciBwYWdlID0gc3RhdGUgPT0gJ29uJyA/ICckUmVhY3RpdmF0ZScgOiAnJERlYWN0aXZhdGUnO1xyXG4gIHZhciAkZCA9ICQoZG9jdW1lbnQpO1xyXG4gIHZhciB0aGF0ID0gdGhpcztcclxuICB2YXIgY3R4ID0geyBmb3JtOiAkZCwgYm94OiAkZCB9O1xyXG4gICQuYWpheCh7XHJcbiAgICB1cmw6IExjVXJsLkxhbmdQYXRoICsgJ05ld0Rhc2hib2FyZC9Qb3NpdGlvbi8nICsgcGFnZSArICcvP1Bvc2l0aW9uSUQ9JyArIHRoaXMucG9zaXRpb25JZCxcclxuICAgIGNvbnRleHQ6IGN0eCxcclxuICAgIGVycm9yOiBhamF4Q2FsbGJhY2tzLmVycm9yLFxyXG4gICAgc3VjY2VzczogZnVuY3Rpb24gKGRhdGEsIHRleHQsIGp4KSB7XHJcbiAgICAgICRkLm9uZSgnYWpheFN1Y2Nlc3NQb3N0JywgZnVuY3Rpb24gKGV2ZW50LCBkYXRhLCB0LCBqLCBjdHgpIHtcclxuICAgICAgICBpZiAoZGF0YSAmJiBkYXRhLkNvZGUgPiAxMDApIHtcclxuICAgICAgICAgIGlmIChkYXRhLkNvZGUgPT0gMTAxKSB7XHJcbiAgICAgICAgICAgIHRoYXQuZXZlbnRzLmZpcmUoc3RhdGUpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gU2hvdyBtZXNzYWdlOlxyXG4gICAgICAgICAgICB2YXIgbXNnID0gJCgnPGRpdi8+JykuYWRkQ2xhc3ModGhhdC5kZWNsaW5lZE1lc3NhZ2VDbGFzcykuYXBwZW5kKGRhdGEuUmVzdWx0Lk1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBzbW9vdGhCb3hCbG9jay5vcGVuKG1zZywgcG9zLCB0aGF0LmRlY2xpbmVkUG9wdXBDbGFzcywgeyBjbG9zYWJsZTogdHJ1ZSwgY2VudGVyOiBmYWxzZSwgYXV0b2ZvY3VzOiBmYWxzZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICAvLyBQcm9jZXNzIHRoZSByZXN1bHQsIHRoYXQgZXZlbnR1YWxseSB3aWxsIGNhbGwgYWpheFN1Y2Nlc3NQb3N0XHJcbiAgICAgIGFqYXhDYWxsYmFja3MuZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQcm92aWRlclBvc2l0aW9uOyIsIi8qIFNldCBvZiBjb21tb24gTEMgY2FsbGJhY2tzIGZvciBtb3N0IEFqYXggb3BlcmF0aW9uc1xyXG4gKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxudmFyIHBvcHVwID0gcmVxdWlyZSgnLi9wb3B1cCcpLFxyXG4gICAgdmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vdmFsaWRhdGlvbkhlbHBlcicpLFxyXG4gICAgY2hhbmdlc05vdGlmaWNhdGlvbiA9IHJlcXVpcmUoJy4vY2hhbmdlc05vdGlmaWNhdGlvbicpLFxyXG4gICAgY3JlYXRlSWZyYW1lID0gcmVxdWlyZSgnLi9jcmVhdGVJZnJhbWUnKSxcclxuICAgIHJlZGlyZWN0VG8gPSByZXF1aXJlKCcuL3JlZGlyZWN0VG8nKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpLFxyXG4gICAgc21vb3RoQm94QmxvY2sgPSByZXF1aXJlKCcuL3Ntb290aEJveEJsb2NrJyk7XHJcblxyXG4vLyBBS0E6IGFqYXhFcnJvclBvcHVwSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uRXJyb3IoangsIG1lc3NhZ2UsIGV4KSB7XHJcbiAgICAvLyBJZiBpcyBhIGNvbm5lY3Rpb24gYWJvcnRlZCwgbm8gc2hvdyBtZXNzYWdlLlxyXG4gICAgLy8gcmVhZHlTdGF0ZSBkaWZmZXJlbnQgdG8gJ2RvbmU6NCcgbWVhbnMgYWJvcnRlZCB0b28sIFxyXG4gICAgLy8gYmVjYXVzZSB3aW5kb3cgYmVpbmcgY2xvc2VkL2xvY2F0aW9uIGNoYW5nZWRcclxuICAgIGlmIChtZXNzYWdlID09ICdhYm9ydCcgfHwgangucmVhZHlTdGF0ZSAhPSA0KVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICB2YXIgbSA9IG1lc3NhZ2U7XHJcbiAgICB2YXIgaWZyYW1lID0gbnVsbDtcclxuICAgIHNpemUgPSBwb3B1cC5zaXplKCdsYXJnZScpO1xyXG4gICAgc2l6ZS5oZWlnaHQgLT0gMzQ7XHJcbiAgICBpZiAobSA9PSAnZXJyb3InKSB7XHJcbiAgICAgICAgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGp4LnJlc3BvbnNlVGV4dCwgc2l6ZSk7XHJcbiAgICAgICAgaWZyYW1lLmF0dHIoJ2lkJywgJ2Jsb2NrVUlJZnJhbWUnKTtcclxuICAgICAgICBtID0gbnVsbDtcclxuICAgIH0gIGVsc2VcclxuICAgICAgICBtID0gbSArIFwiOyBcIiArIGV4O1xyXG5cclxuICAgIC8vIEJsb2NrIGFsbCB3aW5kb3csIG5vdCBvbmx5IGN1cnJlbnQgZWxlbWVudFxyXG4gICAgJC5ibG9ja1VJKGVycm9yQmxvY2sobSwgbnVsbCwgcG9wdXAuc3R5bGUoc2l6ZSkpKTtcclxuICAgIGlmIChpZnJhbWUpXHJcbiAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAkKCcuYmxvY2tVSSAuY2xvc2UtcG9wdXAnKS5jbGljayhmdW5jdGlvbiAoKSB7ICQudW5ibG9ja1VJKCk7IHJldHVybiBmYWxzZTsgfSk7XHJcbn1cclxuXHJcbi8vIEFLQTogYWpheEZvcm1zQ29tcGxldGVIYW5kbGVyXHJcbmZ1bmN0aW9uIGxjT25Db21wbGV0ZSgpIHtcclxuICAgIC8vIERpc2FibGUgbG9hZGluZ1xyXG4gICAgY2xlYXJUaW1lb3V0KHRoaXMubG9hZGluZ3RpbWVyIHx8IHRoaXMubG9hZGluZ1RpbWVyKTtcclxuICAgIC8vIFVuYmxvY2tcclxuICAgIGlmICh0aGlzLmF1dG9VbmJsb2NrTG9hZGluZykge1xyXG4gICAgICAgIC8vIERvdWJsZSB1bi1sb2NrLCBiZWNhdXNlIGFueSBvZiB0aGUgdHdvIHN5c3RlbXMgY2FuIGJlaW5nIHVzZWQ6XHJcbiAgICAgICAgc21vb3RoQm94QmxvY2suY2xvc2UodGhpcy5ib3gpO1xyXG4gICAgICAgIHRoaXMuYm94LnVuYmxvY2soKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gQUtBOiBhamF4Rm9ybXNTdWNjZXNzSGFuZGxlclxyXG5mdW5jdGlvbiBsY09uU3VjY2VzcyhkYXRhLCB0ZXh0LCBqeCkge1xyXG4gICAgdmFyIGN0eCA9IHRoaXM7XHJcbiAgICAvLyBTdXBwb3J0ZWQgdGhlIGdlbmVyaWMgY3R4LmVsZW1lbnQgZnJvbSBqcXVlcnkucmVsb2FkXHJcbiAgICBpZiAoY3R4LmVsZW1lbnQpIGN0eC5mb3JtID0gY3R4LmVsZW1lbnQ7XHJcbiAgICAvLyBTcGVjaWZpYyBzdHVmZiBvZiBhamF4Rm9ybXNcclxuICAgIGlmICghY3R4LmZvcm0pIGN0eC5mb3JtID0gJCh0aGlzKTtcclxuICAgIGlmICghY3R4LmJveCkgY3R4LmJveCA9IGN0eC5mb3JtO1xyXG4gICAgY3R4LmF1dG9VbmJsb2NrTG9hZGluZyA9IHRydWU7XHJcblxyXG4gICAgLy8gRG8gSlNPTiBhY3Rpb24gYnV0IGlmIGlzIG5vdCBKU09OIG9yIHZhbGlkLCBtYW5hZ2UgYXMgSFRNTDpcclxuICAgIGlmICghZG9KU09OQWN0aW9uKGRhdGEsIHRleHQsIGp4LCBjdHgpKSB7XHJcbiAgICAgICAgLy8gUG9zdCAnbWF5YmUnIHdhcyB3cm9uZywgaHRtbCB3YXMgcmV0dXJuZWQgdG8gcmVwbGFjZSBjdXJyZW50IFxyXG4gICAgICAgIC8vIGZvcm0gY29udGFpbmVyOiB0aGUgYWpheC1ib3guXHJcblxyXG4gICAgICAgIC8vIGNyZWF0ZSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIEhUTUxcclxuICAgICAgICB2YXIgbmV3aHRtbCA9IG5ldyBqUXVlcnkoKTtcclxuICAgICAgICAvLyBBdm9pZCBlbXB0eSBkb2N1bWVudHMgYmVpbmcgcGFyc2VkIChyYWlzZSBlcnJvcilcclxuICAgICAgICBpZiAoJC50cmltKGRhdGEpKSB7XHJcbiAgICAgICAgICAgIC8vIFRyeS1jYXRjaCB0byBhdm9pZCBlcnJvcnMgd2hlbiBhIG1hbGZvcm1lZCBkb2N1bWVudCBpcyByZXR1cm5lZDpcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIC8vIHBhcnNlSFRNTCBzaW5jZSBqcXVlcnktMS44IGlzIG1vcmUgc2VjdXJlOlxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiAoJC5wYXJzZUhUTUwpID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgICAgICAgICAgIG5ld2h0bWwgPSAkKCQucGFyc2VIVE1MKGRhdGEpKTtcclxuICAgICAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgICAgICBuZXdodG1sID0gJChkYXRhKTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXgpIHtcclxuICAgICAgICAgICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihleCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEZvciAncmVsb2FkJyBzdXBwb3J0LCBjaGVjayB0b28gdGhlIGNvbnRleHQubW9kZVxyXG4gICAgICAgIGN0eC5ib3hJc0NvbnRhaW5lciA9IGN0eC5ib3hJc0NvbnRhaW5lciB8fCAoY3R4Lm9wdGlvbnMgJiYgY3R4Lm9wdGlvbnMubW9kZSA9PT0gJ3JlcGxhY2UtY29udGVudCcpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgcmV0dXJuZWQgZWxlbWVudCBpcyB0aGUgYWpheC1ib3gsIGlmIG5vdCwgZmluZFxyXG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGluIHRoZSBuZXdodG1sOlxyXG4gICAgICAgIHZhciBqYiA9IG5ld2h0bWw7XHJcbiAgICAgICAgaWYgKCFjdHguYm94SXNDb250YWluZXIgJiYgIW5ld2h0bWwuaXMoJy5hamF4LWJveCcpKVxyXG4gICAgICAgICAgICBqYiA9IG5ld2h0bWwuZmluZCgnLmFqYXgtYm94OmVxKDApJyk7XHJcbiAgICAgICAgaWYgKCFqYiB8fCBqYi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gYWpheC1ib3gsIHVzZSBhbGwgZWxlbWVudCByZXR1cm5lZDpcclxuICAgICAgICAgICAgamIgPSBuZXdodG1sO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY3R4LmJveElzQ29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIC8vIGpiIGlzIGNvbnRlbnQgb2YgdGhlIGJveCBjb250YWluZXI6XHJcbiAgICAgICAgICAgIGN0eC5ib3guaHRtbChqYik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gYm94IGlzIGNvbnRlbnQgdGhhdCBtdXN0IGJlIHJlcGxhY2VkIGJ5IHRoZSBuZXcgY29udGVudDpcclxuICAgICAgICAgICAgY3R4LmJveC5yZXBsYWNlV2l0aChqYik7XHJcbiAgICAgICAgICAgIC8vIGFuZCByZWZyZXNoIHRoZSByZWZlcmVuY2UgdG8gYm94IHdpdGggdGhlIG5ldyBlbGVtZW50XHJcbiAgICAgICAgICAgIGN0eC5ib3ggPSBqYjtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGN0eC5ib3guaXMoJ2Zvcm0nKSlcclxuICAgICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94O1xyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgICAgY3R4LmZvcm0gPSBjdHguYm94LmZpbmQoJ2Zvcm06ZXEoMCknKTtcclxuXHJcbiAgICAgICAgLy8gQ2hhbmdlc25vdGlmaWNhdGlvbiBhZnRlciBhcHBlbmQgZWxlbWVudCB0byBkb2N1bWVudCwgaWYgbm90IHdpbGwgbm90IHdvcms6XHJcbiAgICAgICAgLy8gRGF0YSBub3Qgc2F2ZWQgKGlmIHdhcyBzYXZlZCBidXQgc2VydmVyIGRlY2lkZSByZXR1cm5zIGh0bWwgaW5zdGVhZCBhIEpTT04gY29kZSwgcGFnZSBzY3JpcHQgbXVzdCBkbyAncmVnaXN0ZXJTYXZlJyB0byBhdm9pZCBmYWxzZSBwb3NpdGl2ZSk6XHJcbiAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgIGNoYW5nZXNOb3RpZmljYXRpb24ucmVnaXN0ZXJDaGFuZ2UoXHJcbiAgICAgICAgICAgICAgICBjdHguZm9ybS5nZXQoMCksXHJcbiAgICAgICAgICAgICAgICBjdHguY2hhbmdlZEVsZW1lbnRzXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIE1vdmUgZm9jdXMgdG8gdGhlIGVycm9ycyBhcHBlYXJlZCBvbiB0aGUgcGFnZSAoaWYgdGhlcmUgYXJlKTpcclxuICAgICAgICB2YXIgdmFsaWRhdGlvblN1bW1hcnkgPSBqYi5maW5kKCcudmFsaWRhdGlvbi1zdW1tYXJ5LWVycm9ycycpO1xyXG4gICAgICAgIGlmICh2YWxpZGF0aW9uU3VtbWFyeS5sZW5ndGgpXHJcbiAgICAgICAgICBtb3ZlRm9jdXNUbyh2YWxpZGF0aW9uU3VtbWFyeSk7XHJcbiAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCBbamIsIGN0eC5mb3JtLCBqeF0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKiBVdGlsaXR5IGZvciBKU09OIGFjdGlvbnNcclxuICovXHJcbmZ1bmN0aW9uIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIG1lc3NhZ2UsIGRhdGEpIHtcclxuICAgIC8vIFVuYmxvY2sgbG9hZGluZzpcclxuICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgLy8gQmxvY2sgd2l0aCBtZXNzYWdlOlxyXG4gICAgbWVzc2FnZSA9IG1lc3NhZ2UgfHwgY3R4LmZvcm0uZGF0YSgnc3VjY2Vzcy1wb3N0LW1lc3NhZ2UnKSB8fCAnRG9uZSEnO1xyXG4gICAgY3R4LmJveC5ibG9jayhpbmZvQmxvY2sobWVzc2FnZSwge1xyXG4gICAgICAgIGNzczogcG9wdXAuc3R5bGUocG9wdXAuc2l6ZSgnc21hbGwnKSlcclxuICAgIH0pKVxyXG4gICAgLm9uKCdjbGljaycsICcuY2xvc2UtcG9wdXAnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgY3R4LmJveC51bmJsb2NrKCk7XHJcbiAgICAgICAgY3R4LmJveC50cmlnZ2VyKCdhamF4U3VjY2Vzc1Bvc3RNZXNzYWdlQ2xvc2VkJywgW2RhdGFdKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7IFxyXG4gICAgfSk7XHJcbiAgICAvLyBEbyBub3QgdW5ibG9jayBpbiBjb21wbGV0ZSBmdW5jdGlvbiFcclxuICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxufVxyXG5cclxuLyogVXRpbGl0eSBmb3IgSlNPTiBhY3Rpb25zXHJcbiovXHJcbmZ1bmN0aW9uIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhKSB7XHJcbiAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICBjdHguYm94LnVuYmxvY2soKTtcclxuXHJcbiAgICB2YXIgY29udGVudCA9ICQoJzxkaXYgY2xhc3M9XCJvay1nby1ib3hcIi8+Jyk7XHJcbiAgICBjb250ZW50LmFwcGVuZCgkKCc8c3BhbiBjbGFzcz1cInN1Y2Nlc3MtbWVzc2FnZVwiLz4nKS5hcHBlbmQoZGF0YS5TdWNjZXNzTWVzc2FnZSkpO1xyXG4gICAgaWYgKGRhdGEuQWRkaXRpb25hbE1lc3NhZ2UpXHJcbiAgICAgICAgY29udGVudC5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cImFkZGl0aW9uYWwtbWVzc2FnZVwiLz4nKS5hcHBlbmQoZGF0YS5BZGRpdGlvbmFsTWVzc2FnZSkpO1xyXG5cclxuICAgIHZhciBva0J0biA9ICQoJzxhIGNsYXNzPVwiYWN0aW9uIG9rLWFjdGlvbiBjbG9zZS1hY3Rpb25cIiBocmVmPVwiI29rXCIvPicpLmFwcGVuZChkYXRhLk9rTGFiZWwpO1xyXG4gICAgdmFyIGdvQnRuID0gJyc7XHJcbiAgICBpZiAoZGF0YS5Hb1VSTCAmJiBkYXRhLkdvTGFiZWwpIHtcclxuICAgICAgICBnb0J0biA9ICQoJzxhIGNsYXNzPVwiYWN0aW9uIGdvLWFjdGlvblwiLz4nKS5hdHRyKCdocmVmJywgZGF0YS5Hb1VSTCkuYXBwZW5kKGRhdGEuR29MYWJlbCk7XHJcbiAgICAgICAgLy8gRm9yY2luZyB0aGUgJ2Nsb3NlLWFjdGlvbicgaW4gc3VjaCBhIHdheSB0aGF0IGZvciBpbnRlcm5hbCBsaW5rcyB0aGUgcG9wdXAgZ2V0cyBjbG9zZWQgaW4gYSBzYWZlIHdheTpcclxuICAgICAgICBnb0J0bi5jbGljayhmdW5jdGlvbiAoKSB7IG9rQnRuLmNsaWNrKCk7IGN0eC5ib3gudHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsIFtkYXRhXSk7IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnRlbnQuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJhY3Rpb25zIGNsZWFyZml4XCIvPicpLmFwcGVuZChva0J0bikuYXBwZW5kKGdvQnRuKSk7XHJcblxyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjdHguYm94LCBudWxsLCB7XHJcbiAgICAgICAgY2xvc2VPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjdHguYm94LnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBbZGF0YV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICBjdHguYXV0b1VuYmxvY2tMb2FkaW5nID0gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRvSlNPTkFjdGlvbihkYXRhLCB0ZXh0LCBqeCwgY3R4KSB7XHJcbiAgICAvLyBJZiBpcyBhIEpTT04gcmVzdWx0OlxyXG4gICAgaWYgKHR5cGVvZiAoZGF0YSkgPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgaWYgKGN0eC5ib3gpXHJcbiAgICAgICAgICAgIC8vIENsZWFuIHByZXZpb3VzIHZhbGlkYXRpb24gZXJyb3JzXHJcbiAgICAgICAgICAgIHZhbGlkYXRpb24uc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGN0eC5ib3gpO1xyXG5cclxuICAgICAgICBpZiAoZGF0YS5Db2RlID09PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAwOiBnZW5lcmFsIHN1Y2Nlc3MgY29kZSwgc2hvdyBtZXNzYWdlIHNheWluZyB0aGF0ICdhbGwgd2FzIGZpbmUnXHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LCBkYXRhKTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAxOiBkbyBhIHJlZGlyZWN0XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gMSkge1xyXG4gICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAyKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAyOiBzaG93IGxvZ2luIHBvcHVwICh3aXRoIHRoZSBnaXZlbiB1cmwgYXQgZGF0YS5SZXN1bHQpXHJcbiAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICBwb3B1cChkYXRhLlJlc3VsdCwgeyB3aWR0aDogNDEwLCBoZWlnaHQ6IDMyMCB9KTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSAzKSB7XHJcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgQ29kZSAzOiByZWxvYWQgY3VycmVudCBwYWdlIGNvbnRlbnQgdG8gdGhlIGdpdmVuIHVybCBhdCBkYXRhLlJlc3VsdClcclxuICAgICAgICAgICAgLy8gTm90ZTogdG8gcmVsb2FkIHNhbWUgdXJsIHBhZ2UgY29udGVudCwgaXMgYmV0dGVyIHJldHVybiB0aGUgaHRtbCBkaXJlY3RseSBmcm9tXHJcbiAgICAgICAgICAgIC8vIHRoaXMgYWpheCBzZXJ2ZXIgcmVxdWVzdC5cclxuICAgICAgICAgICAgLy9jb250YWluZXIudW5ibG9jaygpOyBpcyBibG9ja2VkIGFuZCB1bmJsb2NrZWQgYWdhaW4gYnkgdGhlIHJlbG9hZCBtZXRob2Q6XHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgY3R4LmJveC5yZWxvYWQoZGF0YS5SZXN1bHQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDQpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyBTdWNjZXNzTWVzc2FnZSwgYXR0YWNoaW5nIGFuZCBldmVudCBoYW5kbGVyIHRvIGdvIHRvIFJlZGlyZWN0VVJMXHJcbiAgICAgICAgICAgIGN0eC5ib3gub24oJ2FqYXhTdWNjZXNzUG9zdE1lc3NhZ2VDbG9zZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZWRpcmVjdFRvKGRhdGEuUmVzdWx0LlJlZGlyZWN0VVJMKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNob3dTdWNjZXNzTWVzc2FnZShjdHgsIGRhdGEuUmVzdWx0LlN1Y2Nlc3NNZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGRhdGEuQ29kZSA9PSA1KSB7XHJcbiAgICAgICAgICAgIC8vIENoYW5nZSBtYWluLWFjdGlvbiBidXR0b24gbWVzc2FnZTpcclxuICAgICAgICAgICAgdmFyIGJ0biA9IGN0eC5mb3JtLmZpbmQoJy5tYWluLWFjdGlvbicpO1xyXG4gICAgICAgICAgICB2YXIgZG1zZyA9IGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKTtcclxuICAgICAgICAgICAgaWYgKCFkbXNnKVxyXG4gICAgICAgICAgICAgICAgYnRuLmRhdGEoJ2RlZmF1bHQtdGV4dCcsIGJ0bi50ZXh0KCkpO1xyXG4gICAgICAgICAgICB2YXIgbXNnID0gZGF0YS5SZXN1bHQgfHwgYnRuLmRhdGEoJ3N1Y2Nlc3MtcG9zdC10ZXh0JykgfHwgJ0RvbmUhJztcclxuICAgICAgICAgICAgYnRuLnRleHQobXNnKTtcclxuICAgICAgICAgICAgLy8gQWRkaW5nIHN1cHBvcnQgdG8gcmVzZXQgYnV0dG9uIHRleHQgdG8gZGVmYXVsdCBvbmVcclxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgRmlyc3QgbmV4dCBjaGFuZ2VzIGhhcHBlbnMgb24gdGhlIGZvcm06XHJcbiAgICAgICAgICAgICQoY3R4LmZvcm0pLm9uZSgnbGNDaGFuZ2VzTm90aWZpY2F0aW9uQ2hhbmdlUmVnaXN0ZXJlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIGJ0bi50ZXh0KGJ0bi5kYXRhKCdkZWZhdWx0LXRleHQnKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIGV2ZW50IGZvciBjdXN0b20gaGFuZGxlcnNcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPT0gNikge1xyXG4gICAgICAgICAgICAvLyBPay1HbyBhY3Rpb25zIHBvcHVwIHdpdGggJ3N1Y2Nlc3MnIGFuZCAnYWRkaXRpb25hbCcgbWVzc2FnZXMuXHJcbiAgICAgICAgICAgIHNob3dPa0dvUG9wdXAoY3R4LCBkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgIGN0eC5mb3JtLnRyaWdnZXIoJ2FqYXhTdWNjZXNzUG9zdCcsIFtkYXRhLCB0ZXh0LCBqeF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YS5Db2RlID09IDcpIHtcclxuICAgICAgICAgICAgLy8gU3BlY2lhbCBDb2RlIDc6IHNob3cgbWVzc2FnZSBzYXlpbmcgY29udGFpbmVkIGF0IGRhdGEuUmVzdWx0Lk1lc3NhZ2UuXHJcbiAgICAgICAgICAgIC8vIFRoaXMgY29kZSBhbGxvdyBhdHRhY2ggYWRkaXRpb25hbCBpbmZvcm1hdGlvbiBpbiBkYXRhLlJlc3VsdCB0byBkaXN0aW5ndWlzaFxyXG4gICAgICAgICAgICAvLyBkaWZmZXJlbnQgcmVzdWx0cyBhbGwgc2hvd2luZyBhIG1lc3NhZ2UgYnV0IG1heWJlIG5vdCBiZWluZyBhIHN1Y2Nlc3MgYXQgYWxsXHJcbiAgICAgICAgICAgIC8vIGFuZCBtYXliZSBkb2luZyBzb21ldGhpbmcgbW9yZSBpbiB0aGUgdHJpZ2dlcmVkIGV2ZW50IHdpdGggdGhlIGRhdGEgb2JqZWN0LlxyXG4gICAgICAgICAgICBzaG93U3VjY2Vzc01lc3NhZ2UoY3R4LCBkYXRhLlJlc3VsdC5NZXNzYWdlLCBkYXRhKTtcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4XSk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChkYXRhLkNvZGUgPiAxMDApIHtcclxuICAgICAgICAgICAgLy8gVXNlciBDb2RlOiB0cmlnZ2VyIGN1c3RvbSBldmVudCB0byBtYW5hZ2UgcmVzdWx0czpcclxuICAgICAgICAgICAgY3R4LmZvcm0udHJpZ2dlcignYWpheFN1Y2Nlc3NQb3N0JywgW2RhdGEsIHRleHQsIGp4LCBjdHhdKTtcclxuICAgICAgICB9IGVsc2UgeyAvLyBkYXRhLkNvZGUgPCAwXHJcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGFuIGVycm9yIGNvZGUuXHJcblxyXG4gICAgICAgICAgICAvLyBEYXRhIG5vdCBzYXZlZDpcclxuICAgICAgICAgICAgaWYgKGN0eC5jaGFuZ2VkRWxlbWVudHMpXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKGN0eC5mb3JtLmdldCgwKSwgY3R4LmNoYW5nZWRFbGVtZW50cyk7XHJcblxyXG4gICAgICAgICAgICAvLyBVbmJsb2NrIGxvYWRpbmc6XHJcbiAgICAgICAgICAgIGN0eC5ib3gudW5ibG9jaygpO1xyXG4gICAgICAgICAgICAvLyBCbG9jayB3aXRoIG1lc3NhZ2U6XHJcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gXCJFcnJvcjogXCIgKyBkYXRhLkNvZGUgKyBcIjogXCIgKyBKU09OLnN0cmluZ2lmeShkYXRhLlJlc3VsdCA/IChkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgPyBkYXRhLlJlc3VsdC5FcnJvck1lc3NhZ2UgOiBkYXRhLlJlc3VsdCkgOiAnJyk7XHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oJCgnPGRpdi8+JykuYXBwZW5kKG1lc3NhZ2UpLCBjdHguYm94LCBudWxsLCB7IGNsb3NhYmxlOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gbm90IHVuYmxvY2sgaW4gY29tcGxldGUgZnVuY3Rpb24hXHJcbiAgICAgICAgICAgIGN0eC5hdXRvVW5ibG9ja0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgICAgICBlcnJvcjogbGNPbkVycm9yLFxyXG4gICAgICAgIHN1Y2Nlc3M6IGxjT25TdWNjZXNzLFxyXG4gICAgICAgIGNvbXBsZXRlOiBsY09uQ29tcGxldGUsXHJcbiAgICAgICAgZG9KU09OQWN0aW9uOiBkb0pTT05BY3Rpb25cclxuICAgIH07XHJcbn0iLCIvKiBGb2N1cyB0aGUgZmlyc3QgZWxlbWVudCBpbiB0aGUgZG9jdW1lbnQgKG9yIGluIEBjb250YWluZXIpXHJcbndpdGggdGhlIGh0bWw1IGF0dHJpYnV0ZSAnYXV0b2ZvY3VzJyAob3IgYWx0ZXJuYXRpdmUgQGNzc1NlbGVjdG9yKS5cclxuSXQncyBmaW5lIGFzIGEgcG9seWZpbGwgYW5kIGZvciBhamF4IGxvYWRlZCBjb250ZW50IHRoYXQgd2lsbCBub3RcclxuZ2V0IHRoZSBicm93c2VyIHN1cHBvcnQgb2YgdGhlIGF0dHJpYnV0ZS5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuXHJcbmZ1bmN0aW9uIGF1dG9Gb2N1cyhjb250YWluZXIsIGNzc1NlbGVjdG9yKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCk7XHJcbiAgICBjb250YWluZXIuZmluZChjc3NTZWxlY3RvciB8fCAnW2F1dG9mb2N1c10nKS5mb2N1cygpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGF1dG9Gb2N1czsiLCIvKj0gQ2hhbmdlc05vdGlmaWNhdGlvbiBjbGFzc1xyXG4qIHRvIG5vdGlmeSB1c2VyIGFib3V0IGNoYW5nZXMgaW4gZm9ybXMsXHJcbiogdGFicywgdGhhdCB3aWxsIGJlIGxvc3QgaWYgZ28gYXdheSBmcm9tXHJcbiogdGhlIHBhZ2UuIEl0IGtub3dzIHdoZW4gYSBmb3JtIGlzIHN1Ym1pdHRlZFxyXG4qIGFuZCBzYXZlZCB0byBkaXNhYmxlIG5vdGlmaWNhdGlvbiwgYW5kIGdpdmVzXHJcbiogbWV0aG9kcyBmb3Igb3RoZXIgc2NyaXB0cyB0byBub3RpZnkgY2hhbmdlc1xyXG4qIG9yIHNhdmluZy5cclxuKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKSxcclxuICAgIGdldFhQYXRoID0gcmVxdWlyZSgnLi9nZXRYUGF0aCcpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxudmFyIGNoYW5nZXNOb3RpZmljYXRpb24gPSB7XHJcbiAgICBjaGFuZ2VzTGlzdDoge30sXHJcbiAgICBkZWZhdWx0czoge1xyXG4gICAgICAgIHRhcmdldDogbnVsbCxcclxuICAgICAgICBnZW5lcmljQ2hhbmdlU3VwcG9ydDogdHJ1ZSxcclxuICAgICAgICBnZW5lcmljU3VibWl0U3VwcG9ydDogZmFsc2UsXHJcbiAgICAgICAgY2hhbmdlZEZvcm1DbGFzczogJ2hhcy1jaGFuZ2VzJyxcclxuICAgICAgICBjaGFuZ2VkRWxlbWVudENsYXNzOiAnY2hhbmdlZCcsXHJcbiAgICAgICAgbm90aWZ5Q2xhc3M6ICdub3RpZnktY2hhbmdlcydcclxuICAgIH0sXHJcbiAgICBpbml0OiBmdW5jdGlvbiAob3B0aW9ucykge1xyXG4gICAgICAgIC8vIFVzZXIgbm90aWZpY2F0aW9uIHRvIHByZXZlbnQgbG9zdCBjaGFuZ2VzIGRvbmVcclxuICAgICAgICAkKHdpbmRvdykub24oJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGNoYW5nZXNOb3RpZmljYXRpb24ubm90aWZ5KCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRoaXMuZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG4gICAgICAgIGlmICghb3B0aW9ucy50YXJnZXQpXHJcbiAgICAgICAgICAgIG9wdGlvbnMudGFyZ2V0ID0gZG9jdW1lbnQ7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMuZ2VuZXJpY0NoYW5nZVN1cHBvcnQpXHJcbiAgICAgICAgICAgICQob3B0aW9ucy50YXJnZXQpLm9uKCdjaGFuZ2UnLCAnZm9ybTpub3QoLmNoYW5nZXMtbm90aWZpY2F0aW9uLWRpc2FibGVkKSA6aW5wdXRbbmFtZV0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyQ2hhbmdlKCQodGhpcykuY2xvc2VzdCgnZm9ybScpLmdldCgwKSwgdGhpcyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIGlmIChvcHRpb25zLmdlbmVyaWNTdWJtaXRTdXBwb3J0KVxyXG4gICAgICAgICAgICAkKG9wdGlvbnMudGFyZ2V0KS5vbignc3VibWl0JywgJ2Zvcm06bm90KC5jaGFuZ2VzLW5vdGlmaWNhdGlvbi1kaXNhYmxlZCknLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VzTm90aWZpY2F0aW9uLnJlZ2lzdGVyU2F2ZSh0aGlzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9LFxyXG4gICAgbm90aWZ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gQWRkIG5vdGlmaWNhdGlvbiBjbGFzcyB0byB0aGUgZG9jdW1lbnRcclxuICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5ub3RpZnlDbGFzcyk7XHJcbiAgICAgICAgLy8gQ2hlY2sgaWYgdGhlcmUgaXMgYWxtb3N0IG9uZSBjaGFuZ2UgaW4gdGhlIHByb3BlcnR5IGxpc3QgcmV0dXJuaW5nIHRoZSBtZXNzYWdlOlxyXG4gICAgICAgIGZvciAodmFyIGMgaW4gdGhpcy5jaGFuZ2VzTGlzdClcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVpdE1lc3NhZ2UgfHwgKHRoaXMucXVpdE1lc3NhZ2UgPSAkKCcjbGNyZXMtcXVpdC13aXRob3V0LXNhdmUnKS50ZXh0KCkpIHx8ICcnO1xyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyQ2hhbmdlOiBmdW5jdGlvbiAoZiwgZSkge1xyXG4gICAgICAgIGlmICghZSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBmbmFtZSA9IGdldFhQYXRoKGYpO1xyXG4gICAgICAgIHZhciBmbCA9IHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdID0gdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gfHwgW107XHJcbiAgICAgICAgaWYgKCQuaXNBcnJheShlKSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGUubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyQ2hhbmdlKGYsIGVbaV0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBuID0gZTtcclxuICAgICAgICBpZiAodHlwZW9mIChlKSAhPT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgbiA9IGUubmFtZTtcclxuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgcmVhbGx5IHRoZXJlIHdhcyBhIGNoYW5nZSBjaGVja2luZyBkZWZhdWx0IGVsZW1lbnQgdmFsdWVcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiAoZS5kZWZhdWx0VmFsdWUpICE9ICd1bmRlZmluZWQnICYmXHJcbiAgICAgICAgICAgICAgICB0eXBlb2YgKGUuY2hlY2tlZCkgPT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIHR5cGVvZiAoZS5zZWxlY3RlZCkgPT0gJ3VuZGVmaW5lZCcgJiZcclxuICAgICAgICAgICAgICAgIGUudmFsdWUgPT0gZS5kZWZhdWx0VmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIC8vIFRoZXJlIHdhcyBubyBjaGFuZ2UsIG5vIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAvLyBhbmQgbWF5YmUgaXMgYSByZWdyZXNzaW9uIGZyb20gYSBjaGFuZ2UgYW5kIG5vdyB0aGUgb3JpZ2luYWwgdmFsdWUgYWdhaW5cclxuICAgICAgICAgICAgICAgIC8vIHRyeSB0byByZW1vdmUgZnJvbSBjaGFuZ2VzIGxpc3QgZG9pbmcgcmVnaXN0ZXJTYXZlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZ2lzdGVyU2F2ZShmLCBbbl0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICQoZSkuYWRkQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRWxlbWVudENsYXNzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCEobiBpbiBmbCkpXHJcbiAgICAgICAgICAgIGZsLnB1c2gobik7XHJcbiAgICAgICAgJChmKVxyXG4gICAgICAgIC5hZGRDbGFzcyh0aGlzLmRlZmF1bHRzLmNoYW5nZWRGb3JtQ2xhc3MpXHJcbiAgICAgICAgLy8gcGFzcyBkYXRhOiBmb3JtLCBlbGVtZW50IG5hbWUgY2hhbmdlZCwgZm9ybSBlbGVtZW50IGNoYW5nZWQgKHRoaXMgY2FuIGJlIG51bGwpXHJcbiAgICAgICAgLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvbkNoYW5nZVJlZ2lzdGVyZWQnLCBbZiwgbiwgZV0pO1xyXG4gICAgfSxcclxuICAgIHJlZ2lzdGVyU2F2ZTogZnVuY3Rpb24gKGYsIGVscykge1xyXG4gICAgICAgIHZhciBmbmFtZSA9IGdldFhQYXRoKGYpO1xyXG4gICAgICAgIGlmICghdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0pIHJldHVybjtcclxuICAgICAgICB2YXIgcHJldkVscyA9ICQuZXh0ZW5kKFtdLCB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXSk7XHJcbiAgICAgICAgdmFyIHIgPSB0cnVlO1xyXG4gICAgICAgIGlmIChlbHMpIHtcclxuICAgICAgICAgICAgdGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0gPSAkLmdyZXAodGhpcy5jaGFuZ2VzTGlzdFtmbmFtZV0sIGZ1bmN0aW9uIChlbCkgeyByZXR1cm4gKCQuaW5BcnJheShlbCwgZWxzKSA9PSAtMSk7IH0pO1xyXG4gICAgICAgICAgICAvLyBEb24ndCByZW1vdmUgJ2YnIGxpc3QgaWYgaXMgbm90IGVtcHR5XHJcbiAgICAgICAgICAgIHIgPSB0aGlzLmNoYW5nZXNMaXN0W2ZuYW1lXS5sZW5ndGggPT09IDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChyKSB7XHJcbiAgICAgICAgICAgICQoZikucmVtb3ZlQ2xhc3ModGhpcy5kZWZhdWx0cy5jaGFuZ2VkRm9ybUNsYXNzKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuY2hhbmdlc0xpc3RbZm5hbWVdO1xyXG4gICAgICAgICAgICAvLyBsaW5rIGVsZW1lbnRzIGZyb20gZWxzIHRvIGNsZWFuLXVwIGl0cyBjbGFzc2VzXHJcbiAgICAgICAgICAgIGVscyA9IHByZXZFbHM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIHBhc3MgZGF0YTogZm9ybSwgZWxlbWVudHMgcmVnaXN0ZXJlZCBhcyBzYXZlICh0aGlzIGNhbiBiZSBudWxsKSwgYW5kICdmb3JtIGZ1bGx5IHNhdmVkJyBhcyB0aGlyZCBwYXJhbSAoYm9vbClcclxuICAgICAgICAkKGYpLnRyaWdnZXIoJ2xjQ2hhbmdlc05vdGlmaWNhdGlvblNhdmVSZWdpc3RlcmVkJywgW2YsIGVscywgcl0pO1xyXG4gICAgICAgIHZhciBsY2huID0gdGhpcztcclxuICAgICAgICBpZiAoZWxzKSAkLmVhY2goZWxzLCBmdW5jdGlvbiAoKSB7ICQoJ1tuYW1lPVwiJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUodGhpcykgKyAnXCJdJykucmVtb3ZlQ2xhc3MobGNobi5kZWZhdWx0cy5jaGFuZ2VkRWxlbWVudENsYXNzKTsgfSk7XHJcbiAgICAgICAgcmV0dXJuIHByZXZFbHM7XHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyBNb2R1bGVcclxuaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGNoYW5nZXNOb3RpZmljYXRpb247XHJcbn0iLCIvKiBVdGlsaXR5IHRvIGNyZWF0ZSBpZnJhbWUgd2l0aCBpbmplY3RlZCBodG1sL2NvbnRlbnQgaW5zdGVhZCBvZiBVUkwuXHJcbiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUlmcmFtZShjb250ZW50LCBzaXplKSB7XHJcbiAgICB2YXIgJGlmcmFtZSA9ICQoJzxpZnJhbWUgd2lkdGg9XCInICsgc2l6ZS53aWR0aCArICdcIiBoZWlnaHQ9XCInICsgc2l6ZS5oZWlnaHQgKyAnXCIgc3R5bGU9XCJib3JkZXI6bm9uZTtcIj48L2lmcmFtZT4nKTtcclxuICAgIHZhciBpZnJhbWUgPSAkaWZyYW1lLmdldCgwKTtcclxuICAgIC8vIFdoZW4gdGhlIGlmcmFtZSBpcyByZWFkeVxyXG4gICAgdmFyIGlmcmFtZWxvYWRlZCA9IGZhbHNlO1xyXG4gICAgaWZyYW1lLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBVc2luZyBpZnJhbWVsb2FkZWQgdG8gYXZvaWQgaW5maW5pdGUgbG9vcHNcclxuICAgICAgICBpZiAoIWlmcmFtZWxvYWRlZCkge1xyXG4gICAgICAgICAgICBpZnJhbWVsb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBpbmplY3RJZnJhbWVIdG1sKGlmcmFtZSwgY29udGVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiAkaWZyYW1lO1xyXG59O1xyXG5cclxuLyogUHV0cyBmdWxsIGh0bWwgaW5zaWRlIHRoZSBpZnJhbWUgZWxlbWVudCBwYXNzZWQgaW4gYSBzZWN1cmUgYW5kIGNvbXBsaWFudCBtb2RlICovXHJcbmZ1bmN0aW9uIGluamVjdElmcmFtZUh0bWwoaWZyYW1lLCBodG1sKSB7XHJcbiAgICAvLyBwdXQgYWpheCBkYXRhIGluc2lkZSBpZnJhbWUgcmVwbGFjaW5nIGFsbCB0aGVpciBodG1sIGluIHNlY3VyZSBcclxuICAgIC8vIGNvbXBsaWFudCBtb2RlICgkLmh0bWwgZG9uJ3Qgd29ya3MgdG8gaW5qZWN0IDxodG1sPjxoZWFkPiBjb250ZW50KVxyXG5cclxuICAgIC8qIGRvY3VtZW50IEFQSSB2ZXJzaW9uIChwcm9ibGVtcyB3aXRoIElFLCBkb24ndCBleGVjdXRlIGlmcmFtZS1odG1sIHNjcmlwdHMpICovXHJcbiAgICAvKnZhciBpZnJhbWVEb2MgPVxyXG4gICAgLy8gVzNDIGNvbXBsaWFudDogbnMsIGZpcmVmb3gtZ2Vja28sIGNocm9tZS9zYWZhcmktd2Via2l0LCBvcGVyYSwgaWU5XHJcbiAgICBpZnJhbWUuY29udGVudERvY3VtZW50IHx8XHJcbiAgICAvLyBvbGQgSUUgKDUuNSspXHJcbiAgICAoaWZyYW1lLmNvbnRlbnRXaW5kb3cgPyBpZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudCA6IG51bGwpIHx8XHJcbiAgICAvLyBmYWxsYmFjayAodmVyeSBvbGQgSUU/KVxyXG4gICAgZG9jdW1lbnQuZnJhbWVzW2lmcmFtZS5pZF0uZG9jdW1lbnQ7XHJcbiAgICBpZnJhbWVEb2Mub3BlbigpO1xyXG4gICAgaWZyYW1lRG9jLndyaXRlKGh0bWwpO1xyXG4gICAgaWZyYW1lRG9jLmNsb3NlKCk7Ki9cclxuXHJcbiAgICAvKiBqYXZhc2NyaXB0IFVSSSB2ZXJzaW9uICh3b3JrcyBmaW5lIGV2ZXJ5d2hlcmUhKSAqL1xyXG4gICAgaWZyYW1lLmNvbnRlbnRXaW5kb3cuY29udGVudHMgPSBodG1sO1xyXG4gICAgaWZyYW1lLnNyYyA9ICdqYXZhc2NyaXB0OndpbmRvd1tcImNvbnRlbnRzXCJdJztcclxuXHJcbiAgICAvLyBBYm91dCB0aGlzIHRlY2huaXF1ZSwgdGhpcyBodHRwOi8vc3BhcmVjeWNsZXMud29yZHByZXNzLmNvbS8yMDEyLzAzLzA4L2luamVjdC1jb250ZW50LWludG8tYS1uZXctaWZyYW1lL1xyXG59XHJcblxyXG4iLCIvKiogUmV0dXJucyB0aGUgcGF0aCB0byB0aGUgZ2l2ZW4gZWxlbWVudCBpbiBYUGF0aCBjb252ZW50aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuZnVuY3Rpb24gZ2V0WFBhdGgoZWxlbWVudCkge1xyXG4gICAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5pZClcclxuICAgICAgICByZXR1cm4gJy8vKltAaWQ9XCInICsgZWxlbWVudC5pZCArICdcIl0nO1xyXG4gICAgdmFyIHhwYXRoID0gJyc7XHJcbiAgICBmb3IgKDsgZWxlbWVudCAmJiBlbGVtZW50Lm5vZGVUeXBlID09IDE7IGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGUpIHtcclxuICAgICAgICB2YXIgaWQgPSAkKGVsZW1lbnQucGFyZW50Tm9kZSkuY2hpbGRyZW4oZWxlbWVudC50YWdOYW1lKS5pbmRleChlbGVtZW50KSArIDE7XHJcbiAgICAgICAgaWQgPSAoaWQgPiAxID8gJ1snICsgaWQgKyAnXScgOiAnJyk7XHJcbiAgICAgICAgeHBhdGggPSAnLycgKyBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSArIGlkICsgeHBhdGg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4geHBhdGg7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gZ2V0WFBhdGg7XHJcbiIsIi8qKiBFeHRlbmRlZCB0b2dnbGUtc2hvdy1oaWRlIGZ1bnRpb25zLlxyXG4gICAgSWFnb1NSTEBnbWFpbC5jb21cclxuICAgIERlcGVuZGVuY2llczoganF1ZXJ5XHJcbiAqKi9cclxuKGZ1bmN0aW9uKCl7XHJcblxyXG4gICAgLyoqIEltcGxlbWVudGF0aW9uOiByZXF1aXJlIGpRdWVyeSBhbmQgcmV0dXJucyBvYmplY3Qgd2l0aCB0aGVcclxuICAgICAgICBwdWJsaWMgbWV0aG9kcy5cclxuICAgICAqKi9cclxuICAgIGZ1bmN0aW9uIHh0c2goalF1ZXJ5KSB7XHJcbiAgICAgICAgdmFyICQgPSBqUXVlcnk7XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEhpZGUgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ2hpZGUnIGFuZCAnZmFkZU91dCcgZWZmZWN0cywgZXh0ZW5kZWRcclxuICAgICAgICAgKiBqcXVlcnktdWkgZWZmZWN0cyAoaXMgbG9hZGVkKSBvciBjdXN0b20gYW5pbWF0aW9uIHRocm91Z2gganF1ZXJ5ICdhbmltYXRlJy5cclxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgICogLSBpZiBub3QgcHJlc2VudCwgalF1ZXJ5LmhpZGUob3B0aW9ucylcclxuICAgICAgICAgKiAtICdhbmltYXRlJzogalF1ZXJ5LmFuaW1hdGUob3B0aW9ucy5wcm9wZXJ0aWVzLCBvcHRpb25zKVxyXG4gICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGZ1bmN0aW9uIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgdmFyICRlID0gJChlbGVtZW50KTtcclxuICAgICAgICAgICAgc3dpdGNoIChvcHRpb25zLmVmZmVjdCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnYW5pbWF0ZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuYW5pbWF0ZShvcHRpb25zLnByb3BlcnRpZXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuZmFkZU91dChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuc2xpZGVVcChvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIC8vICdzaXplJyB2YWx1ZSBhbmQganF1ZXJ5LXVpIGVmZmVjdHMgZ28gdG8gc3RhbmRhcmQgJ2hpZGUnXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlICdzaXplJzpcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuaGlkZShvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4aGlkZScsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAqIFNob3cgYW4gZWxlbWVudCB1c2luZyBqUXVlcnksIGFsbG93aW5nIHVzZSBzdGFuZGFyZCAgJ3Nob3cnIGFuZCAnZmFkZUluJyBlZmZlY3RzLCBleHRlbmRlZFxyXG4gICAgICAgICoganF1ZXJ5LXVpIGVmZmVjdHMgKGlzIGxvYWRlZCkgb3IgY3VzdG9tIGFuaW1hdGlvbiB0aHJvdWdoIGpxdWVyeSAnYW5pbWF0ZScuXHJcbiAgICAgICAgKiBEZXBlbmRpbmcgb24gb3B0aW9ucy5lZmZlY3Q6XHJcbiAgICAgICAgKiAtIGlmIG5vdCBwcmVzZW50LCBqUXVlcnkuaGlkZShvcHRpb25zKVxyXG4gICAgICAgICogLSAnYW5pbWF0ZSc6IGpRdWVyeS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucylcclxuICAgICAgICAqIC0gJ2ZhZGUnOiBqUXVlcnkuZmFkZU91dFxyXG4gICAgICAgICovXHJcbiAgICAgICAgZnVuY3Rpb24gc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICB2YXIgJGUgPSAkKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAvLyBXZSBwZXJmb3JtcyBhIGZpeCBvbiBzdGFuZGFyZCBqUXVlcnkgZWZmZWN0c1xyXG4gICAgICAgICAgICAvLyB0byBhdm9pZCBhbiBlcnJvciB0aGF0IHByZXZlbnRzIGZyb20gcnVubmluZ1xyXG4gICAgICAgICAgICAvLyBlZmZlY3RzIG9uIGVsZW1lbnRzIHRoYXQgYXJlIGFscmVhZHkgdmlzaWJsZSxcclxuICAgICAgICAgICAgLy8gd2hhdCBsZXRzIHRoZSBwb3NzaWJpbGl0eSBvZiBnZXQgYSBtaWRkbGUtYW5pbWF0ZWRcclxuICAgICAgICAgICAgLy8gZWZmZWN0LlxyXG4gICAgICAgICAgICAvLyBXZSBqdXN0IGNoYW5nZSBkaXNwbGF5Om5vbmUsIGZvcmNpbmcgdG8gJ2lzLXZpc2libGUnIHRvXHJcbiAgICAgICAgICAgIC8vIGJlIGZhbHNlIGFuZCB0aGVuIHJ1bm5pbmcgdGhlIGVmZmVjdC5cclxuICAgICAgICAgICAgLy8gVGhlcmUgaXMgbm8gZmxpY2tlcmluZyBlZmZlY3QsIGJlY2F1c2UgalF1ZXJ5IGp1c3QgcmVzZXRzXHJcbiAgICAgICAgICAgIC8vIGRpc3BsYXkgb24gZWZmZWN0IHN0YXJ0LlxyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wdGlvbnMuZWZmZWN0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdhbmltYXRlJzpcclxuICAgICAgICAgICAgICAgICAgICAkZS5hbmltYXRlKG9wdGlvbnMucHJvcGVydGllcywgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBGaXhcclxuICAgICAgICAgICAgICAgICAgICAkZS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZhZGVJbihvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRml4XHJcbiAgICAgICAgICAgICAgICAgICAgJGUuY3NzKCdkaXNwbGF5JywgJ25vbmUnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zbGlkZURvd24ob3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAvLyAnc2l6ZScgdmFsdWUgYW5kIGpxdWVyeS11aSBlZmZlY3RzIGdvIHRvIHN0YW5kYXJkICdzaG93J1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZSAnc2l6ZSc6XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeFxyXG4gICAgICAgICAgICAgICAgICAgICRlLmNzcygnZGlzcGxheScsICdub25lJylcclxuICAgICAgICAgICAgICAgICAgICAuc2hvdyhvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAkZS50cmlnZ2VyKCd4c2hvdycsIFtvcHRpb25zXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKiogR2VuZXJpYyB1dGlsaXR5IGZvciBoaWdobHkgY29uZmlndXJhYmxlIGpRdWVyeS50b2dnbGUgd2l0aCBzdXBwb3J0XHJcbiAgICAgICAgICAgIHRvIHNwZWNpZnkgdGhlIHRvZ2dsZSB2YWx1ZSBleHBsaWNpdHkgZm9yIGFueSBraW5kIG9mIGVmZmVjdDoganVzdCBwYXNzIHRydWUgYXMgc2Vjb25kIHBhcmFtZXRlciAndG9nZ2xlJyB0byBzaG93XHJcbiAgICAgICAgICAgIGFuZCBmYWxzZSB0byBoaWRlLiBUb2dnbGUgbXVzdCBiZSBzdHJpY3RseSBhIEJvb2xlYW4gdmFsdWUgdG8gYXZvaWQgYXV0by1kZXRlY3Rpb24uXHJcbiAgICAgICAgICAgIFRvZ2dsZSBwYXJhbWV0ZXIgY2FuIGJlIG9taXR0ZWQgdG8gYXV0by1kZXRlY3QgaXQsIGFuZCBzZWNvbmQgcGFyYW1ldGVyIGNhbiBiZSB0aGUgYW5pbWF0aW9uIG9wdGlvbnMuXHJcbiAgICAgICAgICAgIEFsbCB0aGUgb3RoZXJzIGJlaGF2ZSBleGFjdGx5IGFzIGhpZGVFbGVtZW50IGFuZCBzaG93RWxlbWVudC5cclxuICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiB0b2dnbGVFbGVtZW50KGVsZW1lbnQsIHRvZ2dsZSwgb3B0aW9ucykge1xyXG4gICAgICAgICAgICAvLyBJZiB0b2dnbGUgaXMgbm90IGEgYm9vbGVhblxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlICE9PSB0cnVlICYmIHRvZ2dsZSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIC8vIElmIHRvZ2dsZSBpcyBhbiBvYmplY3QsIHRoZW4gaXMgdGhlIG9wdGlvbnMgYXMgc2Vjb25kIHBhcmFtZXRlclxyXG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdCh0b2dnbGUpKVxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB0b2dnbGU7XHJcbiAgICAgICAgICAgICAgICAvLyBBdXRvLWRldGVjdCB0b2dnbGUsIGl0IGNhbiB2YXJ5IG9uIGFueSBlbGVtZW50IGluIHRoZSBjb2xsZWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgLy8gdGhlbiBkZXRlY3Rpb24gYW5kIGFjdGlvbiBtdXN0IGJlIGRvbmUgcGVyIGVsZW1lbnQ6XHJcbiAgICAgICAgICAgICAgICAkKGVsZW1lbnQpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldXNpbmcgZnVuY3Rpb24sIHdpdGggZXhwbGljaXQgdG9nZ2xlIHZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgdG9nZ2xlRWxlbWVudCh0aGlzLCAhJCh0aGlzKS5pcygnOnZpc2libGUnKSwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodG9nZ2xlKVxyXG4gICAgICAgICAgICAgICAgc2hvd0VsZW1lbnQoZWxlbWVudCwgb3B0aW9ucyk7XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KGVsZW1lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvKiogRG8galF1ZXJ5IGludGVncmF0aW9uIGFzIHh0b2dnbGUsIHhzaG93LCB4aGlkZVxyXG4gICAgICAgICAqKi9cclxuICAgICAgICBmdW5jdGlvbiBwbHVnSW4oalF1ZXJ5KSB7XHJcbiAgICAgICAgICAgIC8qKiB0b2dnbGVFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeHRvZ2dsZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54dG9nZ2xlID0gZnVuY3Rpb24geHRvZ2dsZSh0b2dnbGUsIG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRvZ2dsZUVsZW1lbnQodGhpcywgdG9nZ2xlLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLyoqIHNob3dFbGVtZW50IGFzIGEgalF1ZXJ5IG1ldGhvZDogeGhpZGVcclxuICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54c2hvdyA9IGZ1bmN0aW9uIHhzaG93KG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIHNob3dFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAvKiogaGlkZUVsZW1lbnQgYXMgYSBqUXVlcnkgbWV0aG9kOiB4aGlkZVxyXG4gICAgICAgICAgICAgKiovXHJcbiAgICAgICAgICAgIGpRdWVyeS5mbi54aGlkZSA9IGZ1bmN0aW9uIHhoaWRlKG9wdGlvbnMpIHtcclxuICAgICAgICAgICAgICAgIGhpZGVFbGVtZW50KHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBFeHBvcnRpbmc6XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdG9nZ2xlRWxlbWVudDogdG9nZ2xlRWxlbWVudCxcclxuICAgICAgICAgICAgc2hvd0VsZW1lbnQ6IHNob3dFbGVtZW50LFxyXG4gICAgICAgICAgICBoaWRlRWxlbWVudDogaGlkZUVsZW1lbnQsXHJcbiAgICAgICAgICAgIHBsdWdJbjogcGx1Z0luXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBNb2R1bGVcclxuICAgIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xyXG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCB4dHNoKTtcclxuICAgIH0gZWxzZSBpZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG4gICAgICAgIHZhciBqUXVlcnkgPSByZXF1aXJlKCdqcXVlcnknKTtcclxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHh0c2goalF1ZXJ5KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gTm9ybWFsIHNjcmlwdCBsb2FkLCBpZiBqUXVlcnkgaXMgZ2xvYmFsIChhdCB3aW5kb3cpLCBpdHMgZXh0ZW5kZWQgYXV0b21hdGljYWxseSAgICAgICAgXHJcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cualF1ZXJ5ICE9PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAgeHRzaCh3aW5kb3cualF1ZXJ5KS5wbHVnSW4od2luZG93LmpRdWVyeSk7XHJcbiAgICB9XHJcblxyXG59KSgpOyIsIi8qIFNvbWUgdXRpbGl0aWVzIGZvciB1c2Ugd2l0aCBqUXVlcnkgb3IgaXRzIGV4cHJlc3Npb25zXHJcbiAgICB0aGF0IGFyZSBub3QgcGx1Z2lucy5cclxuKi9cclxuZnVuY3Rpb24gZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShzdHIpIHtcclxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFsgIzsmLC4rKn5cXCc6XCIhXiRbXFxdKCk9PnxcXC9dKS9nLCAnXFxcXCQxJyk7XHJcbn1cclxuXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWU6IGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWVcclxuICAgIH07XHJcbiIsImZ1bmN0aW9uIG1vdmVGb2N1c1RvKGVsLCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gJC5leHRlbmQoe1xyXG4gICAgICAgIG1hcmdpblRvcDogMzBcclxuICAgIH0sIG9wdGlvbnMpO1xyXG4gICAgJCgnaHRtbCxib2R5Jykuc3RvcCh0cnVlLCB0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiAkKGVsKS5vZmZzZXQoKS50b3AgLSBvcHRpb25zLm1hcmdpblRvcCB9LCA1MDAsIG51bGwpO1xyXG59XHJcblxyXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gbW92ZUZvY3VzVG87XHJcbn0iLCIvKiBQb3B1cCBmdW5jdGlvbnNcclxuICovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5JyksXHJcbiAgICBjcmVhdGVJZnJhbWUgPSByZXF1aXJlKCcuL2NyZWF0ZUlmcmFtZScpLFxyXG4gICAgbW92ZUZvY3VzVG8gPSByZXF1aXJlKCcuL21vdmVGb2N1c1RvJyk7XHJcbnJlcXVpcmUoJ2pxdWVyeS5ibG9ja1VJJyk7XHJcbnJlcXVpcmUoJy4vc21vb3RoQm94QmxvY2snKTtcclxuXHJcbi8qKioqKioqKioqKioqKioqKioqXHJcbiogUG9wdXAgcmVsYXRlZCBcclxuKiBmdW5jdGlvbnNcclxuKi9cclxuZnVuY3Rpb24gcG9wdXBTaXplKHNpemUpIHtcclxuICAgIHZhciBzID0gKHNpemUgPT0gJ2xhcmdlJyA/IDAuOCA6IChzaXplID09ICdtZWRpdW0nID8gMC41IDogKHNpemUgPT0gJ3NtYWxsJyA/IDAuMiA6IHNpemUgfHwgMC41KSkpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB3aWR0aDogTWF0aC5yb3VuZCgkKHdpbmRvdykud2lkdGgoKSAqIHMpLFxyXG4gICAgICAgIGhlaWdodDogTWF0aC5yb3VuZCgkKHdpbmRvdykuaGVpZ2h0KCkgKiBzKSxcclxuICAgICAgICBzaXplRmFjdG9yOiBzXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwU3R5bGUoc2l6ZSkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBjdXJzb3I6ICdkZWZhdWx0JyxcclxuICAgICAgICB3aWR0aDogc2l6ZS53aWR0aCArICdweCcsXHJcbiAgICAgICAgbGVmdDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLndpZHRoKCkgLSBzaXplLndpZHRoKSAvIDIpIC0gMjUgKyAncHgnLFxyXG4gICAgICAgIGhlaWdodDogc2l6ZS5oZWlnaHQgKyAncHgnLFxyXG4gICAgICAgIHRvcDogTWF0aC5yb3VuZCgoJCh3aW5kb3cpLmhlaWdodCgpIC0gc2l6ZS5oZWlnaHQpIC8gMikgLSAzMiArICdweCcsXHJcbiAgICAgICAgcGFkZGluZzogJzM0cHggMjVweCAzMHB4JyxcclxuICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgIGJvcmRlcjogJ25vbmUnLFxyXG4gICAgICAgICctbW96LWJhY2tncm91bmQtY2xpcCc6ICdwYWRkaW5nJyxcclxuICAgICAgICAnLXdlYmtpdC1iYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnLFxyXG4gICAgICAgICdiYWNrZ3JvdW5kLWNsaXAnOiAncGFkZGluZy1ib3gnXHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHBvcHVwKHVybCwgc2l6ZSwgY29tcGxldGUsIGxvYWRpbmdUZXh0LCBvcHRpb25zKSB7XHJcbiAgICBpZiAodHlwZW9mICh1cmwpID09PSAnb2JqZWN0JylcclxuICAgICAgICBvcHRpb25zID0gdXJsO1xyXG5cclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICB1cmw6IHR5cGVvZiAodXJsKSA9PT0gJ3N0cmluZycgPyB1cmwgOiAnJyxcclxuICAgICAgICBzaXplOiBzaXplIHx8IHsgd2lkdGg6IDAsIGhlaWdodDogMCB9LFxyXG4gICAgICAgIGNvbXBsZXRlOiBjb21wbGV0ZSxcclxuICAgICAgICBsb2FkaW5nVGV4dDogbG9hZGluZ1RleHQsXHJcbiAgICAgICAgY2xvc2FibGU6IHtcclxuICAgICAgICAgICAgb25Mb2FkOiBmYWxzZSxcclxuICAgICAgICAgICAgYWZ0ZXJMb2FkOiB0cnVlLFxyXG4gICAgICAgICAgICBvbkVycm9yOiB0cnVlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBhdXRvU2l6ZTogZmFsc2UsXHJcbiAgICAgICAgY29udGFpbmVyQ2xhc3M6ICcnLFxyXG4gICAgICAgIGF1dG9Gb2N1czogdHJ1ZVxyXG4gICAgfSwgb3B0aW9ucyk7XHJcblxyXG4gICAgLy8gUHJlcGFyZSBzaXplIGFuZCBsb2FkaW5nXHJcbiAgICBvcHRpb25zLmxvYWRpbmdUZXh0ID0gb3B0aW9ucy5sb2FkaW5nVGV4dCB8fCAnJztcclxuICAgIGlmICh0eXBlb2YgKG9wdGlvbnMuc2l6ZS53aWR0aCkgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIG9wdGlvbnMuc2l6ZSA9IHBvcHVwU2l6ZShvcHRpb25zLnNpemUpO1xyXG5cclxuICAgICQuYmxvY2tVSSh7XHJcbiAgICAgICAgbWVzc2FnZTogKG9wdGlvbnMuY2xvc2FibGUub25Mb2FkID8gJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXBcIiBocmVmPVwiI2Nsb3NlLXBvcHVwXCI+WDwvYT4nIDogJycpICtcclxuICAgICAgICc8aW1nIHNyYz1cIicgKyBMY1VybC5BcHBQYXRoICsgJ2ltZy90aGVtZS9sb2FkaW5nLmdpZlwiLz4nICsgb3B0aW9ucy5sb2FkaW5nVGV4dCxcclxuICAgICAgICBjZW50ZXJZOiBmYWxzZSxcclxuICAgICAgICBjc3M6IHBvcHVwU3R5bGUob3B0aW9ucy5zaXplKSxcclxuICAgICAgICBvdmVybGF5Q1NTOiB7IGN1cnNvcjogJ2RlZmF1bHQnIH0sXHJcbiAgICAgICAgZm9jdXNJbnB1dDogdHJ1ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTG9hZGluZyBVcmwgd2l0aCBBamF4IGFuZCBwbGFjZSBjb250ZW50IGluc2lkZSB0aGUgYmxvY2tlZC1ib3hcclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcclxuICAgICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgICAgIG9wdGlvbnM6IG9wdGlvbnMsXHJcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJCgnLmJsb2NrTXNnJylcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250YWluZXIgPSB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhvcHRpb25zLmNvbnRhaW5lckNsYXNzKTtcclxuICAgICAgICAgICAgLy8gQWRkIGNsb3NlIGJ1dHRvbiBpZiByZXF1aXJlcyBpdCBvciBlbXB0eSBtZXNzYWdlIGNvbnRlbnQgdG8gYXBwZW5kIHRoZW4gbW9yZVxyXG4gICAgICAgICAgICBjb250YWluZXIuaHRtbChvcHRpb25zLmNsb3NhYmxlLmFmdGVyTG9hZCA/ICc8YSBjbGFzcz1cImNsb3NlLXBvcHVwXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JyA6ICcnKTtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRIb2xkZXIgPSBjb250YWluZXIuYXBwZW5kKCc8ZGl2IGNsYXNzPVwiY29udGVudFwiLz4nKS5jaGlsZHJlbignLmNvbnRlbnQnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgKGRhdGEpID09PSAnb2JqZWN0Jykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuQ29kZSAmJiBkYXRhLkNvZGUgPT0gMikge1xyXG4gICAgICAgICAgICAgICAgICAgICQudW5ibG9ja1VJKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAoZGF0YS5SZXN1bHQsIHsgd2lkdGg6IDQxMCwgaGVpZ2h0OiAzMjAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgY29kZSwgc2hvdyByZXN1bHRcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhLlJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBQYWdlIGNvbnRlbnQgZ290LCBwYXN0ZSBpbnRvIHRoZSBwb3B1cCBpZiBpcyBwYXJ0aWFsIGh0bWwgKHVybCBzdGFydHMgd2l0aCAkKVxyXG4gICAgICAgICAgICAgICAgaWYgKC8oKF5cXCQpfChcXC9cXCQpKS8udGVzdChvcHRpb25zLnVybCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SG9sZGVyLmFwcGVuZChkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5hdXRvRm9jdXMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRIb2xkZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmF1dG9TaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2b2lkIG1pc2NhbGN1bGF0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJldldpZHRoID0gY29udGVudEhvbGRlclswXS5zdHlsZS53aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgJ2F1dG8nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByZXZIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnN0eWxlLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsICdhdXRvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdldCBkYXRhXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxXaWR0aCA9IGNvbnRlbnRIb2xkZXJbMF0uc2Nyb2xsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWxIZWlnaHQgPSBjb250ZW50SG9sZGVyWzBdLnNjcm9sbEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRXaWR0aCA9IGNvbnRhaW5lci53aWR0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udEhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhV2lkdGggPSBjb250YWluZXIub3V0ZXJXaWR0aCh0cnVlKSAtIGNvbnRXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhSGVpZ2h0ID0gY29udGFpbmVyLm91dGVySGVpZ2h0KHRydWUpIC0gY29udEhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoID0gJCh3aW5kb3cpLndpZHRoKCkgLSBleHRyYVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4SGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpIC0gZXh0cmFIZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBhbmQgYXBwbHlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogYWN0dWFsV2lkdGggPiBtYXhXaWR0aCA/IG1heFdpZHRoIDogYWN0dWFsV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGFjdHVhbEhlaWdodCA+IG1heEhlaWdodCA/IG1heEhlaWdodCA6IGFjdHVhbEhlaWdodFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXIuYW5pbWF0ZShzaXplLCAzMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBtaXNjYWxjdWxhdGlvbnMgY29ycmVjdGlvbnNcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ3dpZHRoJywgcHJldldpZHRoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudEhvbGRlci5jc3MoJ2hlaWdodCcsIHByZXZIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRWxzZSwgaWYgdXJsIGlzIGEgZnVsbCBodG1sIHBhZ2UgKG5vcm1hbCBwYWdlKSwgcHV0IGNvbnRlbnQgaW50byBhbiBpZnJhbWVcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaWZyYW1lID0gY3JlYXRlSWZyYW1lKGRhdGEsIHRoaXMub3B0aW9ucy5zaXplKTtcclxuICAgICAgICAgICAgICAgICAgICBpZnJhbWUuYXR0cignaWQnLCAnYmxvY2tVSUlmcmFtZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlcGxhY2UgYmxvY2tpbmcgZWxlbWVudCBjb250ZW50ICh0aGUgbG9hZGluZykgd2l0aCB0aGUgaWZyYW1lOlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnRIb2xkZXIucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJsb2NrTXNnJykuYXBwZW5kKGlmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXV0b0ZvY3VzKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRm9jdXNUbyhpZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgZXJyb3I6IGZ1bmN0aW9uIChqLCB0LCBleCkge1xyXG4gICAgICAgICAgICAkKCdkaXYuYmxvY2tNc2cnKS5odG1sKChvcHRpb25zLmNsb3NhYmxlLm9uRXJyb3IgPyAnPGEgY2xhc3M9XCJjbG9zZS1wb3B1cFwiIGhyZWY9XCIjY2xvc2UtcG9wdXBcIj5YPC9hPicgOiAnJykgKyAnPGRpdiBjbGFzcz1cImNvbnRlbnRcIj5QYWdlIG5vdCBmb3VuZDwvZGl2PicpO1xyXG4gICAgICAgICAgICBpZiAoY29uc29sZSAmJiBjb25zb2xlLmluZm8pIGNvbnNvbGUuaW5mbyhcIlBvcHVwLWFqYXggZXJyb3I6IFwiICsgZXgpO1xyXG4gICAgICAgIH0sIGNvbXBsZXRlOiBvcHRpb25zLmNvbXBsZXRlXHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgcmV0dXJuZWRCbG9jayA9ICQoJy5ibG9ja1VJJyk7XHJcblxyXG4gICAgcmV0dXJuZWRCbG9jay5vbignY2xpY2snLCAnLmNsb3NlLXBvcHVwJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgICByZXR1cm5lZEJsb2NrLnRyaWdnZXIoJ3BvcHVwLWNsb3NlZCcpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuZWRCbG9jay5jbG9zZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAkLnVuYmxvY2tVSSgpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiByZXR1cm5lZEJsb2NrO1xyXG59XHJcblxyXG4vKiBTb21lIHBvcHVwIHV0aWxpdGl0ZXMvc2hvcnRoYW5kcyAqL1xyXG5mdW5jdGlvbiBtZXNzYWdlUG9wdXAobWVzc2FnZSwgY29udGFpbmVyKSB7XHJcbiAgICBjb250YWluZXIgPSAkKGNvbnRhaW5lciB8fCAnYm9keScpO1xyXG4gICAgdmFyIGNvbnRlbnQgPSAkKCc8ZGl2Lz4nKS50ZXh0KG1lc3NhZ2UpO1xyXG4gICAgc21vb3RoQm94QmxvY2sub3Blbihjb250ZW50LCBjb250YWluZXIsICdtZXNzYWdlLXBvcHVwIGZ1bGwtYmxvY2snLCB7IGNsb3NhYmxlOiB0cnVlLCBjZW50ZXI6IHRydWUsIGF1dG9mb2N1czogZmFsc2UgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbm5lY3RQb3B1cEFjdGlvbihhcHBseVRvU2VsZWN0b3IpIHtcclxuICAgIGFwcGx5VG9TZWxlY3RvciA9IGFwcGx5VG9TZWxlY3RvciB8fCAnLnBvcHVwLWFjdGlvbic7XHJcbiAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCBhcHBseVRvU2VsZWN0b3IsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYyA9ICQoJCh0aGlzKS5hdHRyKCdocmVmJykpLmNsb25lKCk7XHJcbiAgICAgICAgaWYgKGMubGVuZ3RoID09IDEpXHJcbiAgICAgICAgICAgIHNtb290aEJveEJsb2NrLm9wZW4oYywgZG9jdW1lbnQsIG51bGwsIHsgY2xvc2FibGU6IHRydWUsIGNlbnRlcjogdHJ1ZSB9KTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLy8gVGhlIHBvcHVwIGZ1bmN0aW9uIGNvbnRhaW5zIGFsbCB0aGUgb3RoZXJzIGFzIG1ldGhvZHNcclxucG9wdXAuc2l6ZSA9IHBvcHVwU2l6ZTtcclxucG9wdXAuc3R5bGUgPSBwb3B1cFN0eWxlO1xyXG5wb3B1cC5jb25uZWN0QWN0aW9uID0gY29ubmVjdFBvcHVwQWN0aW9uO1xyXG5wb3B1cC5tZXNzYWdlID0gbWVzc2FnZVBvcHVwO1xyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcG9wdXA7IiwiLyoqIEFwcGx5IGV2ZXIgYSByZWRpcmVjdCB0byB0aGUgZ2l2ZW4gVVJMLCBpZiB0aGlzIGlzIGFuIGludGVybmFsIFVSTCBvciBzYW1lXHJcbnBhZ2UsIGl0IGZvcmNlcyBhIHBhZ2UgcmVsb2FkIGZvciB0aGUgZ2l2ZW4gVVJMLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVkaXJlY3RUbyh1cmwpIHtcclxuICAgIC8vIEJsb2NrIHRvIGF2b2lkIG1vcmUgdXNlciBpbnRlcmFjdGlvbnM6XHJcbiAgICAkLmJsb2NrVUkoeyBtZXNzYWdlOiAnJyB9KTsgLy9sb2FkaW5nQmxvY2spO1xyXG4gICAgLy8gQ2hlY2tpbmcgaWYgaXMgYmVpbmcgcmVkaXJlY3Rpbmcgb3Igbm90XHJcbiAgICB2YXIgcmVkaXJlY3RlZCA9IGZhbHNlO1xyXG4gICAgJCh3aW5kb3cpLm9uKCdiZWZvcmV1bmxvYWQnLCBmdW5jdGlvbiBjaGVja1JlZGlyZWN0KCkge1xyXG4gICAgICAgIHJlZGlyZWN0ZWQgPSB0cnVlO1xyXG4gICAgfSk7XHJcbiAgICAvLyBOYXZpZ2F0ZSB0byBuZXcgbG9jYXRpb246XHJcbiAgICB3aW5kb3cubG9jYXRpb24gPSB1cmw7XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBJZiBwYWdlIG5vdCBjaGFuZ2VkIChzYW1lIHVybCBvciBpbnRlcm5hbCBsaW5rKSwgcGFnZSBjb250aW51ZSBleGVjdXRpbmcgdGhlbiByZWZyZXNoOlxyXG4gICAgICAgIGlmICghcmVkaXJlY3RlZClcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSwgNTApO1xyXG59O1xyXG4iLCIvKiogQ3VzdG9tIExvY29ub21pY3MgJ2xpa2UgYmxvY2tVSScgcG9wdXBzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpLFxyXG4gICAgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZSA9IHJlcXVpcmUoJy4vanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlLFxyXG4gICAgYXV0b0ZvY3VzID0gcmVxdWlyZSgnLi9hdXRvRm9jdXMnKSxcclxuICAgIG1vdmVGb2N1c1RvID0gcmVxdWlyZSgnLi9tb3ZlRm9jdXNUbycpO1xyXG5yZXF1aXJlKCcuL2pxdWVyeS54dHNoJykucGx1Z0luKCQpO1xyXG5cclxuZnVuY3Rpb24gc21vb3RoQm94QmxvY2soY29udGVudEJveCwgYmxvY2tlZCwgYWRkY2xhc3MsIG9wdGlvbnMpIHtcclxuICAgIC8vIExvYWQgb3B0aW9ucyBvdmVyd3JpdGluZyBkZWZhdWx0c1xyXG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHtcclxuICAgICAgICBjbG9zYWJsZTogZmFsc2UsXHJcbiAgICAgICAgY2VudGVyOiBmYWxzZSxcclxuICAgICAgICAvKiBhcyBhIHZhbGlkIG9wdGlvbnMgcGFyYW1ldGVyIGZvciBMQy5oaWRlRWxlbWVudCBmdW5jdGlvbiAqL1xyXG4gICAgICAgIGNsb3NlT3B0aW9uczoge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogNjAwLFxyXG4gICAgICAgICAgICBlZmZlY3Q6ICdmYWRlJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgYXV0b2ZvY3VzOiB0cnVlLFxyXG4gICAgICAgIGF1dG9mb2N1c09wdGlvbnM6IHsgbWFyZ2luVG9wOiA2MCB9LFxyXG4gICAgICAgIHdpZHRoOiAnYXV0bydcclxuICAgIH0sIG9wdGlvbnMpO1xyXG5cclxuICAgIGNvbnRlbnRCb3ggPSAkKGNvbnRlbnRCb3gpO1xyXG4gICAgdmFyIGZ1bGwgPSBmYWxzZTtcclxuICAgIGlmIChibG9ja2VkID09IGRvY3VtZW50IHx8IGJsb2NrZWQgPT0gd2luZG93KSB7XHJcbiAgICAgICAgYmxvY2tlZCA9ICQoJ2JvZHknKTtcclxuICAgICAgICBmdWxsID0gdHJ1ZTtcclxuICAgIH0gZWxzZVxyXG4gICAgICAgIGJsb2NrZWQgPSAkKGJsb2NrZWQpO1xyXG5cclxuICAgIHZhciBib3hJbnNpZGVCbG9ja2VkID0gIWJsb2NrZWQuaXMoJ2JvZHksdHIsdGhlYWQsdGJvZHksdGZvb3QsdGFibGUsdWwsb2wsZGwnKTtcclxuXHJcbiAgICAvLyBHZXR0aW5nIGJveCBlbGVtZW50IGlmIGV4aXN0cyBhbmQgcmVmZXJlbmNpbmdcclxuICAgIHZhciBiSUQgPSBibG9ja2VkLmRhdGEoJ3Ntb290aC1ib3gtYmxvY2staWQnKTtcclxuICAgIGlmICghYklEKVxyXG4gICAgICAgIGJJRCA9IChjb250ZW50Qm94LmF0dHIoJ2lkJykgfHwgJycpICsgKGJsb2NrZWQuYXR0cignaWQnKSB8fCAnJykgKyAnLXNtb290aEJveEJsb2NrJztcclxuICAgIGlmIChiSUQgPT0gJy1zbW9vdGhCb3hCbG9jaycpIHtcclxuICAgICAgICBiSUQgPSAnaWQtJyArIGd1aWRHZW5lcmF0b3IoKSArICctc21vb3RoQm94QmxvY2snO1xyXG4gICAgfVxyXG4gICAgYmxvY2tlZC5kYXRhKCdzbW9vdGgtYm94LWJsb2NrLWlkJywgYklEKTtcclxuICAgIHZhciBib3ggPSAkKCcjJyArIGVzY2FwZUpRdWVyeVNlbGVjdG9yVmFsdWUoYklEKSk7XHJcbiAgICAvLyBIaWRpbmcgYm94OlxyXG4gICAgaWYgKGNvbnRlbnRCb3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94LnhoaWRlKG9wdGlvbnMuY2xvc2VPcHRpb25zKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgYm94YztcclxuICAgIGlmIChib3gubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgYm94YyA9ICQoJzxkaXYgY2xhc3M9XCJzbW9vdGgtYm94LWJsb2NrLWVsZW1lbnRcIi8+Jyk7XHJcbiAgICAgICAgYm94ID0gJCgnPGRpdiBjbGFzcz1cInNtb290aC1ib3gtYmxvY2stb3ZlcmxheVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGJveC5hZGRDbGFzcyhhZGRjbGFzcyk7XHJcbiAgICAgICAgaWYgKGZ1bGwpIGJveC5hZGRDbGFzcygnZnVsbC1ibG9jaycpO1xyXG4gICAgICAgIGJveC5hcHBlbmQoYm94Yyk7XHJcbiAgICAgICAgYm94LmF0dHIoJ2lkJywgYklEKTtcclxuICAgICAgICBpZiAoYm94SW5zaWRlQmxvY2tlZClcclxuICAgICAgICAgICAgYmxvY2tlZC5hcHBlbmQoYm94KTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoYm94KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYm94YyA9IGJveC5jaGlsZHJlbignLnNtb290aC1ib3gtYmxvY2stZWxlbWVudCcpO1xyXG4gICAgfVxyXG4gICAgLy8gSGlkZGVuIGZvciB1c2VyLCBidXQgYXZhaWxhYmxlIHRvIGNvbXB1dGU6XHJcbiAgICBjb250ZW50Qm94LnNob3coKTtcclxuICAgIGJveC5zaG93KCkuY3NzKCdvcGFjaXR5JywgMCk7XHJcbiAgICAvLyBTZXR0aW5nIHVwIHRoZSBib3ggYW5kIHN0eWxlcy5cclxuICAgIGJveGMuY2hpbGRyZW4oKS5yZW1vdmUoKTtcclxuICAgIGlmIChvcHRpb25zLmNsb3NhYmxlKVxyXG4gICAgICAgIGJveGMuYXBwZW5kKCQoJzxhIGNsYXNzPVwiY2xvc2UtcG9wdXAgY2xvc2UtYWN0aW9uXCIgaHJlZj1cIiNjbG9zZS1wb3B1cFwiPlg8L2E+JykpO1xyXG4gICAgYm94LmRhdGEoJ21vZGFsLWJveC1vcHRpb25zJywgb3B0aW9ucyk7XHJcbiAgICBpZiAoIWJveGMuZGF0YSgnX2Nsb3NlLWFjdGlvbi1hZGRlZCcpKVxyXG4gICAgICAgIGJveGNcclxuICAgICAgICAub24oJ2NsaWNrJywgJy5jbG9zZS1hY3Rpb24nLCBmdW5jdGlvbiAoKSB7IHNtb290aEJveEJsb2NrKG51bGwsIGJsb2NrZWQsIG51bGwsIGJveC5kYXRhKCdtb2RhbC1ib3gtb3B0aW9ucycpKTsgcmV0dXJuIGZhbHNlOyB9KVxyXG4gICAgICAgIC5kYXRhKCdfY2xvc2UtYWN0aW9uLWFkZGVkJywgdHJ1ZSk7XHJcbiAgICBib3hjLmFwcGVuZChjb250ZW50Qm94KTtcclxuICAgIGJveGMud2lkdGgob3B0aW9ucy53aWR0aCk7XHJcbiAgICBib3guY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgaWYgKGJveEluc2lkZUJsb2NrZWQpIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBpbnNpZGUgdGhlIGJsb2NrZWQgZWxlbWVudDpcclxuICAgICAgICBib3guY3NzKCd6LWluZGV4JywgYmxvY2tlZC5jc3MoJ3otaW5kZXgnKSArIDEwKTtcclxuICAgICAgICBpZiAoIWJsb2NrZWQuY3NzKCdwb3NpdGlvbicpIHx8IGJsb2NrZWQuY3NzKCdwb3NpdGlvbicpID09ICdzdGF0aWMnKVxyXG4gICAgICAgICAgICBibG9ja2VkLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcclxuICAgICAgICAvL29mZnMgPSBibG9ja2VkLnBvc2l0aW9uKCk7XHJcbiAgICAgICAgYm94LmNzcygndG9wJywgMCk7XHJcbiAgICAgICAgYm94LmNzcygnbGVmdCcsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBCb3ggcG9zaXRpb25pbmcgc2V0dXAgd2hlbiBvdXRzaWRlIHRoZSBibG9ja2VkIGVsZW1lbnQsIGFzIGEgZGlyZWN0IGNoaWxkIG9mIEJvZHk6XHJcbiAgICAgICAgYm94LmNzcygnei1pbmRleCcsIE1hdGguZmxvb3IoTnVtYmVyLk1BWF9WQUxVRSkpO1xyXG4gICAgICAgIGJveC5jc3MoYmxvY2tlZC5vZmZzZXQoKSk7XHJcbiAgICB9XHJcbiAgICAvLyBEaW1lbnNpb25zIG11c3QgYmUgY2FsY3VsYXRlZCBhZnRlciBiZWluZyBhcHBlbmRlZCBhbmQgcG9zaXRpb24gdHlwZSBiZWluZyBzZXQ6XHJcbiAgICBib3gud2lkdGgoYmxvY2tlZC5vdXRlcldpZHRoKCkpO1xyXG4gICAgYm94LmhlaWdodChibG9ja2VkLm91dGVySGVpZ2h0KCkpO1xyXG5cclxuICAgIGlmIChvcHRpb25zLmNlbnRlcikge1xyXG4gICAgICAgIGJveGMuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG4gICAgICAgIHZhciBjbCwgY3Q7XHJcbiAgICAgICAgaWYgKGZ1bGwpIHtcclxuICAgICAgICAgICAgY3QgPSBzY3JlZW4uaGVpZ2h0IC8gMjtcclxuICAgICAgICAgICAgY2wgPSBzY3JlZW4ud2lkdGggLyAyO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGN0ID0gYm94Lm91dGVySGVpZ2h0KHRydWUpIC8gMjtcclxuICAgICAgICAgICAgY2wgPSBib3gub3V0ZXJXaWR0aCh0cnVlKSAvIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJveGMuY3NzKCd0b3AnLCBjdCAtIGJveGMub3V0ZXJIZWlnaHQodHJ1ZSkgLyAyKTtcclxuICAgICAgICBib3hjLmNzcygnbGVmdCcsIGNsIC0gYm94Yy5vdXRlcldpZHRoKHRydWUpIC8gMik7XHJcbiAgICB9XHJcbiAgICAvLyBMYXN0IHNldHVwXHJcbiAgICBhdXRvRm9jdXMoYm94KTtcclxuICAgIC8vIFNob3cgYmxvY2tcclxuICAgIGJveC5hbmltYXRlKHsgb3BhY2l0eTogMSB9LCAzMDApO1xyXG4gICAgaWYgKG9wdGlvbnMuYXV0b2ZvY3VzKVxyXG4gICAgICAgIG1vdmVGb2N1c1RvKGNvbnRlbnRCb3gsIG9wdGlvbnMuYXV0b2ZvY3VzT3B0aW9ucyk7XHJcbiAgICByZXR1cm4gYm94O1xyXG59XHJcbmZ1bmN0aW9uIHNtb290aEJveEJsb2NrQ2xvc2VBbGwoY29udGFpbmVyKSB7XHJcbiAgICAkKGNvbnRhaW5lciB8fCBkb2N1bWVudCkuZmluZCgnLnNtb290aC1ib3gtYmxvY2stb3ZlcmxheScpLmhpZGUoKTtcclxufVxyXG5cclxuLy8gTW9kdWxlXHJcbmlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cylcclxuICAgIG1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgICAgIG9wZW46IHNtb290aEJveEJsb2NrLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbihibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucykgeyBzbW9vdGhCb3hCbG9jayhudWxsLCBibG9ja2VkLCBhZGRjbGFzcywgb3B0aW9ucyk7IH0sXHJcbiAgICAgICAgY2xvc2VBbGw6IHNtb290aEJveEJsb2NrQ2xvc2VBbGxcclxuICAgIH07IiwiLyoqXHJcbiAgSXQgdG9nZ2xlcyBhIGdpdmVuIHZhbHVlIHdpdGggdGhlIG5leHQgaW4gdGhlIGdpdmVuIGxpc3QsXHJcbiAgb3IgdGhlIGZpcnN0IGlmIGlzIHRoZSBsYXN0IG9yIG5vdCBtYXRjaGVkLlxyXG4gIFRoZSByZXR1cm5lZCBmdW5jdGlvbiBjYW4gYmUgdXNlZCBkaXJlY3RseSBvciBcclxuICBjYW4gYmUgYXR0YWNoZWQgdG8gYW4gYXJyYXkgKG9yIGFycmF5IGxpa2UpIG9iamVjdCBhcyBtZXRob2RcclxuICAob3IgdG8gYSBwcm90b3R5cGUgYXMgQXJyYXkucHJvdG90eXBlKSBhbmQgdXNlIGl0IHBhc3NpbmdcclxuICBvbmx5IHRoZSBmaXJzdCBhcmd1bWVudC5cclxuKiovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gdG9nZ2xlKGN1cnJlbnQsIGVsZW1lbnRzKSB7XHJcbiAgaWYgKHR5cGVvZiAoZWxlbWVudHMpID09PSAndW5kZWZpbmVkJyAmJlxyXG4gICAgICB0eXBlb2YgKHRoaXMubGVuZ3RoKSA9PT0gJ251bWJlcicpXHJcbiAgICBlbGVtZW50cyA9IHRoaXM7XHJcblxyXG4gIHZhciBpID0gZWxlbWVudHMuaW5kZXhPZihjdXJyZW50KTtcclxuICBpZiAoaSA+IC0xICYmIGkgPCBlbGVtZW50cy5sZW5ndGggLSAxKVxyXG4gICAgcmV0dXJuIGVsZW1lbnRzW2kgKyAxXTtcclxuICBlbHNlXHJcbiAgICByZXR1cm4gZWxlbWVudHNbMF07XHJcbn07XHJcbiIsIi8qKiBWYWxpZGF0aW9uIGxvZ2ljIHdpdGggbG9hZCBhbmQgc2V0dXAgb2YgdmFsaWRhdG9ycyBhbmQgXHJcbiAgICB2YWxpZGF0aW9uIHJlbGF0ZWQgdXRpbGl0aWVzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnbW9kZXJuaXpyJyk7XHJcblxyXG4vLyBVc2luZyBvbiBzZXR1cCBhc3luY3Jvbm91cyBsb2FkIGluc3RlYWQgb2YgdGhpcyBzdGF0aWMtbGlua2VkIGxvYWRcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanMnKTtcclxuLy8gcmVxdWlyZSgnanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS51bm9idHJ1c2l2ZS5taW4uanMnKTtcclxuXHJcbmZ1bmN0aW9uIHNldHVwVmFsaWRhdGlvbihyZWFwcGx5T25seVRvKSB7XHJcbiAgICByZWFwcGx5T25seVRvID0gcmVhcHBseU9ubHlUbyB8fCBkb2N1bWVudDtcclxuICAgIGlmICghd2luZG93LmpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHdpbmRvdy5qcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gZmFsc2U7XHJcbiAgICBpZiAoIWpxdWVyeVZhbGlkYXRlVW5vYnRydXNpdmVMb2FkZWQpIHtcclxuICAgICAgICBqcXVlcnlWYWxpZGF0ZVVub2J0cnVzaXZlTG9hZGVkID0gdHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICBNb2Rlcm5penIubG9hZChbXHJcbiAgICAgICAgICAgICAgICB7IGxvYWQ6IExjVXJsLkFwcFBhdGggKyBcIlNjcmlwdHMvanF1ZXJ5L2pxdWVyeS52YWxpZGF0ZS5taW4uanNcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBsb2FkOiBMY1VybC5BcHBQYXRoICsgXCJTY3JpcHRzL2pxdWVyeS9qcXVlcnkudmFsaWRhdGUudW5vYnRydXNpdmUubWluLmpzXCIgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgZmlyc3QgaWYgdmFsaWRhdGlvbiBpcyBlbmFibGVkIChjYW4gaGFwcGVuIHRoYXQgdHdpY2UgaW5jbHVkZXMgb2ZcclxuICAgICAgICAvLyB0aGlzIGNvZGUgaGFwcGVuIGF0IHNhbWUgcGFnZSwgYmVpbmcgZXhlY3V0ZWQgdGhpcyBjb2RlIGFmdGVyIGZpcnN0IGFwcGVhcmFuY2VcclxuICAgICAgICAvLyB3aXRoIHRoZSBzd2l0Y2gganF1ZXJ5VmFsaWRhdGVVbm9idHJ1c2l2ZUxvYWRlZCBjaGFuZ2VkXHJcbiAgICAgICAgLy8gYnV0IHdpdGhvdXQgdmFsaWRhdGlvbiBiZWluZyBhbHJlYWR5IGxvYWRlZCBhbmQgZW5hYmxlZClcclxuICAgICAgICBpZiAoJCAmJiAkLnZhbGlkYXRvciAmJiAkLnZhbGlkYXRvci51bm9idHJ1c2l2ZSkge1xyXG4gICAgICAgICAgICAvLyBBcHBseSB0aGUgdmFsaWRhdGlvbiBydWxlcyB0byB0aGUgbmV3IGVsZW1lbnRzXHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndmFsaWRhdG9yJyk7XHJcbiAgICAgICAgICAgICQocmVhcHBseU9ubHlUbykucmVtb3ZlRGF0YSgndW5vYnRydXNpdmVWYWxpZGF0aW9uJyk7XHJcbiAgICAgICAgICAgICQudmFsaWRhdG9yLnVub2J0cnVzaXZlLnBhcnNlKHJlYXBwbHlPbmx5VG8pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyogVXRpbGl0aWVzICovXHJcblxyXG4vKiBDbGVhbiBwcmV2aW91cyB2YWxpZGF0aW9uIGVycm9ycyBvZiB0aGUgdmFsaWRhdGlvbiBzdW1tYXJ5XHJcbmluY2x1ZGVkIGluICdjb250YWluZXInIGFuZCBzZXQgYXMgdmFsaWQgdGhlIHN1bW1hcnlcclxuKi9cclxuZnVuY3Rpb24gc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkKGNvbnRhaW5lcikge1xyXG4gICAgY29udGFpbmVyID0gY29udGFpbmVyIHx8IGRvY3VtZW50O1xyXG4gICAgJCgnLnZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnLCBjb250YWluZXIpXHJcbiAgICAucmVtb3ZlQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKVxyXG4gICAgLmFkZENsYXNzKCd2YWxpZGF0aW9uLXN1bW1hcnktdmFsaWQnKVxyXG4gICAgLmZpbmQoJz51bD5saScpLnJlbW92ZSgpO1xyXG5cclxuICAgIC8vIFNldCBhbGwgZmllbGRzIHZhbGlkYXRpb24gaW5zaWRlIHRoaXMgZm9ybSAoYWZmZWN0ZWQgYnkgdGhlIHN1bW1hcnkgdG9vKVxyXG4gICAgLy8gYXMgdmFsaWQgdG9vXHJcbiAgICAkKCcuZmllbGQtdmFsaWRhdGlvbi1lcnJvcicsIGNvbnRhaW5lcilcclxuICAgIC5yZW1vdmVDbGFzcygnZmllbGQtdmFsaWRhdGlvbi1lcnJvcicpXHJcbiAgICAuYWRkQ2xhc3MoJ2ZpZWxkLXZhbGlkYXRpb24tdmFsaWQnKVxyXG4gICAgLnRleHQoJycpO1xyXG5cclxuICAgIC8vIFJlLWFwcGx5IHNldHVwIHZhbGlkYXRpb24gdG8gZW5zdXJlIGlzIHdvcmtpbmcsIGJlY2F1c2UganVzdCBhZnRlciBhIHN1Y2Nlc3NmdWxcclxuICAgIC8vIHZhbGlkYXRpb24sIGFzcC5uZXQgdW5vYnRydXNpdmUgdmFsaWRhdGlvbiBzdG9wcyB3b3JraW5nIG9uIGNsaWVudC1zaWRlLlxyXG4gICAgTEMuc2V0dXBWYWxpZGF0aW9uKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNFcnJvcihjb250YWluZXIpIHtcclxuICB2YXIgdiA9IGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpO1xyXG4gIHYuYWRkQ2xhc3MoJ3ZhbGlkYXRpb24tc3VtbWFyeS1lcnJvcnMnKS5yZW1vdmVDbGFzcygndmFsaWRhdGlvbi1zdW1tYXJ5LXZhbGlkJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdvVG9TdW1tYXJ5RXJyb3JzKGZvcm0pIHtcclxuICAgIHZhciBvZmYgPSBmb3JtLmZpbmQoJy52YWxpZGF0aW9uLXN1bW1hcnktZXJyb3JzJykub2Zmc2V0KCk7XHJcbiAgICBpZiAob2ZmKVxyXG4gICAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogb2ZmLnRvcCB9LCA1MDApO1xyXG4gICAgZWxzZVxyXG4gICAgICAgIGlmIChjb25zb2xlICYmIGNvbnNvbGUuZXJyb3IpIGNvbnNvbGUuZXJyb3IoJ2dvVG9TdW1tYXJ5RXJyb3JzOiBubyBzdW1tYXJ5IHRvIGZvY3VzJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRWYWxpZGF0aW9uU3VtbWFyeShjb250YWluZXIpIHtcclxuICBjb250YWluZXIgPSBjb250YWluZXIgfHwgZG9jdW1lbnQ7XHJcbiAgcmV0dXJuICQoJ1tkYXRhLXZhbG1zZy1zdW1tYXJ5PXRydWVdJyk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgc2V0dXA6IHNldHVwVmFsaWRhdGlvbixcclxuICAgIHNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZDogc2V0VmFsaWRhdGlvblN1bW1hcnlBc1ZhbGlkLFxyXG4gICAgc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yOiBzZXRWYWxpZGF0aW9uU3VtbWFyeUFzRXJyb3IsXHJcbiAgICBnb1RvU3VtbWFyeUVycm9yczogZ29Ub1N1bW1hcnlFcnJvcnMsXHJcbiAgICBmaW5kVmFsaWRhdGlvblN1bW1hcnk6IGZpbmRWYWxpZGF0aW9uU3VtbWFyeVxyXG59OyIsIi8qKiBjaGFuZ2VQcm9maWxlUGhvdG8sIGl0IHVzZXMgJ3VwbG9hZGVyJyB1c2luZyBodG1sNSwgYWpheCBhbmQgYSBzcGVjaWZpYyBwYWdlXHJcbiAgdG8gbWFuYWdlIHNlcnZlci1zaWRlIHVwbG9hZCBvZiBhIG5ldyB1c2VyIHByb2ZpbGUgcGhvdG8uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuYmxvY2tVSScpO1xyXG4vLyBUT0RPOiByZWltcGxlbWVudCB0aGlzIGFuZCB0aGUgc2VydmVyLXNpZGUgZmlsZSB0byBhdm9pZCBpZnJhbWVzIGFuZCBleHBvc2luZyBnbG9iYWwgZnVuY3Rpb25zLFxyXG4vLyBkaXJlY3QgQVBJIHVzZSB3aXRob3V0IGlmcmFtZS1ub3JtYWwgcG9zdCBzdXBwb3J0IChjdXJyZW50IGJyb3dzZXIgbWF0cml4IGFsbG93IHVzIHRoaXM/KVxyXG4vLyBUT0RPOiBpbXBsZW1lbnQgYXMgcmVhbCBtb2R1bGFyLCBuZXh0IGFyZSB0aGUga25vd2VkIG1vZHVsZXMgaW4gdXNlIGJ1dCBub3QgbG9hZGluZyB0aGF0IGFyZSBleHBlY3RlZFxyXG4vLyB0byBiZSBpbiBzY29wZSByaWdodCBub3cgYnV0IG11c3QgYmUgdXNlZCB3aXRoIHRoZSBuZXh0IGNvZGUgdW5jb21tZW50ZWQuXHJcbi8vIHJlcXVpcmUoJ3VwbG9hZGVyJyk7XHJcbi8vIHJlcXVpcmUoJ0xjVXJsJyk7XHJcbi8vIHZhciBibG9ja1ByZXNldHMgPSByZXF1aXJlKCcuLi9MQy9ibG9ja1ByZXNldHMnKVxyXG4vLyB2YXIgYWpheEZvcm1zID0gcmVxdWlyZSgnLi4vTEMvYWpheEZvcm1zJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyICRjID0gJChjb250YWluZXJTZWxlY3Rvcik7XHJcbiAgJGMub24oJ2NsaWNrJywgJ1tocmVmPVwiI2NoYW5nZS1wcm9maWxlLXBob3RvXCJdJywgZnVuY3Rpb24gKCkge1xyXG4gICAgcG9wdXAoTGNVcmwuTGFuZ1BhdGggKyAnTmV3RGFzaGJvYXJkL0Fib3V0WW91L0NoYW5nZVBob3RvLycsIHsgd2lkdGg6IDI0MCwgaGVpZ2h0OiAyNDAgfSk7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSk7XHJcblxyXG4gIC8vIE5PVEU6IFdlIGFyZSBleHBvc2luZyBnbG9iYWwgZnVuY3Rpb25zIGZyb20gaGVyZSBiZWNhdXNlIHRoZSBzZXJ2ZXIgcGFnZS9pZnJhbWUgZXhwZWN0cyB0aGlzXHJcbiAgLy8gdG8gd29yay5cclxuICAvLyBUT0RPOiByZWZhY3RvciB0byBhdm9pZCB0aGlzIHdheS5cclxuICB3aW5kb3cucmVsb2FkVXNlclBob3RvID0gZnVuY3Rpb24gcmVsb2FkVXNlclBob3RvKCkge1xyXG4gICAgJGMuZmluZCgnLkRhc2hib2FyZFB1YmxpY0Jpby1waG90byAuYXZhdGFyJykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBzcmMgPSB0aGlzLmdldEF0dHJpYnV0ZSgnc3JjJyk7XHJcbiAgICAgIC8vIGF2b2lkIGNhY2hlIHRoaXMgdGltZVxyXG4gICAgICBzcmMgPSBzcmMgKyBcIj92PVwiICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHNyYyk7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICB3aW5kb3cuZGVsZXRlVXNlclBob3RvID0gZnVuY3Rpb24gZGVsZXRlVXNlclBob3RvKCkge1xyXG4gICAgJC5ibG9ja1VJKExDLmJsb2NrUHJlc2V0cy5sb2FkaW5nKTtcclxuICAgICQuYWpheCh7XHJcbiAgICAgIHVybDogTGNVcmwuTGFuZ1VybCArIFwiTmV3RGFzaGJvYXJkL0Fib3V0WW91L0NoYW5nZVBob3RvLz9kZWxldGU9dHJ1ZVwiLFxyXG4gICAgICBtZXRob2Q6IFwiR0VUXCIsXHJcbiAgICAgIGNhY2hlOiBmYWxzZSxcclxuICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxyXG4gICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIGlmIChkYXRhLkNvZGUgPT09IDApXHJcbiAgICAgICAgICAkLmJsb2NrVUkoTEMuYmxvY2tQcmVzZXRzLmluZm8oZGF0YS5SZXN1bHQpKTtcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAkLmJsb2NrVUkoTEMuYmxvY2tQcmVzZXRzLmVycm9yKGRhdGEuUmVzdWx0LkVycm9yTWVzc2FnZSkpO1xyXG4gICAgICAgICQoJy5ibG9ja1VJIC5jbG9zZS1wb3B1cCcpLmNsaWNrKGZ1bmN0aW9uICgpIHsgJC51bmJsb2NrVUkoKTsgfSk7XHJcbiAgICAgICAgcmVsb2FkVXNlclBob3RvKCk7XHJcbiAgICAgIH0sXHJcbiAgICAgIGVycm9yOiBhamF4RXJyb3JQb3B1cEhhbmRsZXJcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG59O1xyXG4iLCIvKiogRWR1Y2F0aW9uIHBhZ2Ugc2V0dXAgZm9yIENSVURMIHVzZVxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuXHJcbi8vdmFyIGFqYXhGb3JtcyA9IHJlcXVpcmUoJy4uL0xDL2FqYXhGb3JtcycpO1xyXG4vL3ZhciBjcnVkbCA9IHJlcXVpcmUoJy4uL0xDL2NydWRsJykuc2V0dXAoYWpheEZvcm1zLm9uU3VjY2VzcywgYWpheEZvcm1zLm9uRXJyb3IsIGFqYXhGb3Jtcy5vbkNvbXBsZXRlKTtcclxuLy9MQy5pbml0Q3J1ZGwgPSBjcnVkbC5vbjtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKSxcclxuICAgIGVkdWNhdGlvblNlbGVjdG9yID0gJy5EYXNoYm9hcmRFZHVjYXRpb24nLFxyXG4gICAgJG90aGVycyA9ICRjLmZpbmQoZWR1Y2F0aW9uU2VsZWN0b3IpLmNsb3Nlc3QoJy5EYXNoYm9hcmRTZWN0aW9uLXBhZ2Utc2VjdGlvbicpLnNpYmxpbmdzKCk7XHJcblxyXG4gIHZhciBjcnVkbCA9IExDLmluaXRDcnVkbChlZHVjYXRpb25TZWxlY3Rvcik7XHJcbiAgLy9jcnVkbC5zZXR0aW5ncy5lZmZlY3RzWydzaG93LXZpZXdlciddID0geyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhdGlvbjogJ3Nsb3cnIH07XHJcblxyXG4gIGNydWRsLmVsZW1lbnRzXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1zdGFydHMnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJG90aGVycy54aGlkZSh7IGVmZmVjdDogJ2hlaWdodCcsIGR1cmFjdGlvbjogJ3Nsb3cnIH0pO1xyXG4gIH0pXHJcbiAgLm9uKGNydWRsLnNldHRpbmdzLmV2ZW50c1snZWRpdC1lbmRzJ10sIGZ1bmN0aW9uICgpIHtcclxuICAgICRvdGhlcnMueHNob3coeyBlZmZlY3Q6ICdoZWlnaHQnLCBkdXJhY3Rpb246ICdzbG93JyB9KTtcclxuICB9KTtcclxufTtcclxuIiwiLyoqXHJcbiAgZ2VuZXJhdGVCb29rTm93QnV0dG9uOiB3aXRoIHRoZSBwcm9wZXIgaHRtbCBhbmQgZm9ybVxyXG4gIHJlZ2VuZXJhdGVzIHRoZSBidXR0b24gc291cmNlLWNvZGUgYW5kIHByZXZpZXcgYXV0b21hdGljYWxseS5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gKGNvbnRhaW5lclNlbGVjdG9yKSB7XHJcbiAgdmFyIGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgZnVuY3Rpb24gcmVnZW5lcmF0ZUJ1dHRvbkNvZGUoKSB7XHJcbiAgICB2YXJcclxuICAgICAgc2l6ZSA9IGMuZmluZCgnW25hbWU9c2l6ZV06Y2hlY2tlZCcpLnZhbCgpLFxyXG4gICAgICBwb3NpdGlvbmlkID0gYy5maW5kKCdbbmFtZT1wb3NpdGlvbmlkXTpjaGVja2VkJykudmFsKCksXHJcbiAgICAgIHNvdXJjZUNvbnRhaW5lciA9IGMuZmluZCgnW25hbWU9YnV0dG9uLXNvdXJjZS1jb2RlXScpLFxyXG4gICAgICBwcmV2aWV3Q29udGFpbmVyID0gYy5maW5kKCcuRGFzaGJvYXJkQm9va05vd0J1dHRvbi1idXR0b25TaXplcy1wcmV2aWV3JyksXHJcbiAgICAgIGJ1dHRvblRwbCA9IGMuZmluZCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uQ29kZS1idXR0b25UZW1wbGF0ZScpLnRleHQoKSxcclxuICAgICAgbGlua1RwbCA9IGMuZmluZCgnLkRhc2hib2FyZEJvb2tOb3dCdXR0b24tYnV0dG9uQ29kZS1saW5rVGVtcGxhdGUnKS50ZXh0KCksXHJcbiAgICAgIHRwbCA9IChzaXplID09ICdsaW5rLW9ubHknID8gbGlua1RwbCA6IGJ1dHRvblRwbCksXHJcbiAgICAgIHRwbFZhcnMgPSAkKCcuRGFzaGJvYXJkQm9va05vd0J1dHRvbi1idXR0b25Db2RlJyk7XHJcblxyXG4gICAgcHJldmlld0NvbnRhaW5lci5odG1sKHRwbCk7XHJcbiAgICBwcmV2aWV3Q29udGFpbmVyLmZpbmQoJ2EnKS5hdHRyKCdocmVmJyxcclxuICAgICAgdHBsVmFycy5kYXRhKCdiYXNlLXVybCcpICsgKHBvc2l0aW9uaWQgPyBwb3NpdGlvbmlkICsgJy8nIDogJycpKTtcclxuICAgIHByZXZpZXdDb250YWluZXIuZmluZCgnaW1nJykuYXR0cignc3JjJyxcclxuICAgICAgdHBsVmFycy5kYXRhKCdiYXNlLXNyYycpICsgc2l6ZSk7XHJcbiAgICBzb3VyY2VDb250YWluZXIudmFsKHByZXZpZXdDb250YWluZXIuaHRtbCgpLnRyaW0oKSk7XHJcbiAgfVxyXG5cclxuICAvLyBGaXJzdCBnZW5lcmF0aW9uXHJcbiAgaWYgKGMubGVuZ3RoID4gMCkgcmVnZW5lcmF0ZUJ1dHRvbkNvZGUoKTtcclxuICAvLyBhbmQgb24gYW55IGZvcm0gY2hhbmdlXHJcbiAgYy5vbignY2hhbmdlJywgJ2lucHV0JywgcmVnZW5lcmF0ZUJ1dHRvbkNvZGUpO1xyXG59OyIsIi8qKlxyXG5wYXltZW50OiB3aXRoIHRoZSBwcm9wZXIgaHRtbCBhbmQgZm9ybVxyXG5yZWdlbmVyYXRlcyB0aGUgYnV0dG9uIHNvdXJjZS1jb2RlIGFuZCBwcmV2aWV3IGF1dG9tYXRpY2FsbHkuXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5yZXF1aXJlKCdqcXVlcnkuZm9ybWF0dGVyJyk7XHJcblxyXG5leHBvcnRzLm9uID0gZnVuY3Rpb24gb25QYXltZW50QWNjb3VudChjb250YWluZXJTZWxlY3Rvcikge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG5cclxuICAvLyBJbml0aWFsaXplIHRoZSBmb3JtYXR0ZXJzIG9uIHBhZ2UtcmVhZHkuLlxyXG4gIHZhciBmaW5pdCA9IGZ1bmN0aW9uICgpIHsgaW5pdEZvcm1hdHRlcnMoJGMpOyB9O1xyXG4gICQoZmluaXQpO1xyXG4gIC8vIGFuZCBhbnkgYWpheC1wb3N0IG9mIHRoZSBmb3JtIHRoYXQgcmV0dXJucyBuZXcgaHRtbDpcclxuICAkYy5vbignYWpheEZvcm1SZXR1cm5lZEh0bWwnLCAnZm9ybS5hamF4JywgZmluaXQpO1xyXG59O1xyXG5cclxuLyoqIEluaXRpYWxpemUgdGhlIGZpZWxkIGZvcm1hdHRlcnMgcmVxdWlyZWQgYnkgdGhlIHBheW1lbnQtYWNjb3VudC1mb3JtLCBiYXNlZFxyXG4gIG9uIHRoZSBmaWVsZHMgbmFtZXMuXHJcbioqL1xyXG5mdW5jdGlvbiBpbml0Rm9ybWF0dGVycygkY29udGFpbmVyKSB7XHJcbiAgJGNvbnRhaW5lci5maW5kKCdbbmFtZT1cImJpcnRoZGF0ZVwiXScpLmZvcm1hdHRlcih7XHJcbiAgICAncGF0dGVybic6ICd7ezk5fX0ve3s5OX19L3t7OTk5OX19JyxcclxuICAgICdwZXJzaXN0ZW50JzogZmFsc2VcclxuICB9KTtcclxuICAkY29udGFpbmVyLmZpbmQoJ1tuYW1lPVwic3NuXCJdJykuZm9ybWF0dGVyKHtcclxuICAgICdwYXR0ZXJuJzogJ3t7OTk5fX0te3s5OX19LXt7OTk5OX19JyxcclxuICAgICdwZXJzaXN0ZW50JzogZmFsc2VcclxuICB9KTtcclxufSIsIi8qKlxyXG4gIHByaXZhY3lTZXR0aW5nczogU2V0dXAgZm9yIHRoZSBzcGVjaWZpYyBwYWdlLWZvcm0gZGFzaGJvYXJkL3ByaXZhY3kvcHJpdmFjeXNldHRpbmdzXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG4vLyBUT0RPIEltcGxlbWVudCBkZXBlbmRlbmNpZXMgY29tbWluZyBmcm9tIGFwcC5qcyBpbnN0ZWFkIG9mIGRpcmVjdCBsaW5rXHJcbi8vdmFyIHNtb290aEJveEJsb2NrID0gcmVxdWlyZSgnc21vb3RoQm94QmxvY2snKTtcclxuLy8gVE9ETyBSZXBsYWNlIGRvbS1yZXNzb3VyY2VzIGJ5IGkxOG4uZ2V0VGV4dFxyXG5cclxudmFyIHByaXZhY3kgPSB7XHJcbiAgYWNjb3VudExpbmtzU2VsZWN0b3I6ICcuRGFzaGJvYXJkUHJpdmFjeVNldHRpbmdzLW15QWNjb3VudCBhJyxcclxuICByZXNzb3VyY2VzU2VsZWN0b3I6ICcuRGFzaGJvYXJkUHJpdmFjeS1hY2NvdW50UmVzc291cmNlcydcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcHJpdmFjeTtcclxuXHJcbnByaXZhY3kub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgJGMub24oJ2NsaWNrJywgJy5jYW5jZWwtYWN0aW9uJywgZnVuY3Rpb24gKCkge1xyXG4gICAgc21vb3RoQm94QmxvY2suY2xvc2UoJGMpO1xyXG4gIH0pO1xyXG5cclxuICAkYy5vbignYWpheFN1Y2Nlc3NQb3N0TWVzc2FnZUNsb3NlZCcsICcuYWpheC1ib3gnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgfSk7XHJcbiAgXHJcbiAgJGMub24oJ2NsaWNrJywgcHJpdmFjeS5hY2NvdW50TGlua3NTZWxlY3RvciwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIHZhciBiLFxyXG4gICAgICBscmVzID0gJGMuZmluZChwcml2YWN5LnJlc3NvdXJjZXNTZWxlY3Rvcik7XHJcblxyXG4gICAgc3dpdGNoICgkKHRoaXMpLmF0dHIoJ2hyZWYnKSkge1xyXG4gICAgICBjYXNlICcjZGVsZXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5kZWxldGUtbWVzc2FnZS1jb25maXJtJykuY2xvbmUoKSwgJGMpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICcjZGVhY3RpdmF0ZS1teS1hY2NvdW50JzpcclxuICAgICAgICBiID0gc21vb3RoQm94QmxvY2sub3BlbihscmVzLmNoaWxkcmVuKCcuZGVhY3RpdmF0ZS1tZXNzYWdlLWNvbmZpcm0nKS5jbG9uZSgpLCAkYyk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJyNyZWFjdGl2YXRlLW15LWFjY291bnQnOlxyXG4gICAgICAgIGIgPSBzbW9vdGhCb3hCbG9jay5vcGVuKGxyZXMuY2hpbGRyZW4oJy5yZWFjdGl2YXRlLW1lc3NhZ2UtY29uZmlybScpLmNsb25lKCksICRjKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGlmIChiKSB7XHJcbiAgICAgICQoJ2h0bWwsYm9keScpLnN0b3AodHJ1ZSwgdHJ1ZSkuYW5pbWF0ZSh7IHNjcm9sbFRvcDogYi5vZmZzZXQoKS50b3AgfSwgNTAwLCBudWxsKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbn07IiwiLyoqIFNlcnZpY2UgQXR0cmlidXRlcyBWYWxpZGF0aW9uOiBpbXBsZW1lbnRzIHZhbGlkYXRpb25zIHRocm91Z2ggdGhlIFxyXG4gICdjdXN0b21WYWxpZGF0aW9uJyBhcHByb2FjaCBmb3IgJ3Bvc2l0aW9uIHNlcnZpY2UgYXR0cmlidXRlcycuXHJcbiAgSXQgdmFsaWRhdGVzIHRoZSByZXF1aXJlZCBhdHRyaWJ1dGUgY2F0ZWdvcnksIGFsbW9zdC1vbmUgb3Igc2VsZWN0LW9uZSBtb2Rlcy5cclxuKiovXHJcbnZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XHJcbnZhciBnZXRUZXh0ID0gcmVxdWlyZSgnTEMvZ2V0VGV4dCcpO1xyXG52YXIgdmggPSByZXF1aXJlKCdMQy92YWxpZGF0aW9uSGVscGVyJyk7XHJcbnZhciBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlID0gcmVxdWlyZSgnTEMvanF1ZXJ5VXRpbHMnKS5lc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlO1xyXG5cclxuLyoqIEVuYWJsZSB2YWxpZGF0aW9uIG9mIHJlcXVpcmVkIHNlcnZpY2UgYXR0cmlidXRlcyBvblxyXG4gIHRoZSBmb3JtKHMpIHNwZWNpZmllZCBieSB0aGUgc2VsZWN0b3Igb3IgcHJvdmlkZWRcclxuKiovXHJcbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiBzZXR1cFNlcnZpY2VBdHRyaWJ1dGVzVmFsaWRhdGlvbihjb250YWluZXJTZWxlY3Rvciwgb3B0aW9ucykge1xyXG4gIHZhciAkYyA9ICQoY29udGFpbmVyU2VsZWN0b3IpO1xyXG4gIG9wdGlvbnMgPSAkLmV4dGVuZCh7XHJcbiAgICByZXF1aXJlZENhdENsYXNzOiAnaXMtcmVxdWlyZWQnLFxyXG4gICAgc2VsZWN0T25lQ2xhc3M6ICdqcy12YWxpZGF0aW9uU2VsZWN0T25lJyxcclxuICAgIGdyb3VwRXJyb3JDbGFzczogJ2lzLWVycm9yJyxcclxuICAgIHZhbEVycm9yVGV4dEtleTogJ3JlcXVpcmVkLWF0dHJpYnV0ZS1jYXRlZ29yeS1lcnJvcidcclxuICB9LCBvcHRpb25zKTtcclxuXHJcbiAgJGMuZWFjaChmdW5jdGlvbiB2YWxpZGF0ZVNlcnZpY2VBdHRyaWJ1dGVzKCkge1xyXG4gICAgdmFyIGYgPSAkKHRoaXMpO1xyXG4gICAgaWYgKCFmLmlzKCdmb3JtJykpIHtcclxuICAgICAgaWYgKGNvbnNvbGUgJiYgY29uc29sZS5lcnJvcikgY29uc29sZS5lcnJvcignVGhlIGVsZW1lbnQgdG8gYXBwbHkgdmFsaWRhdGlvbiBtdXN0IGJlIGEgZm9ybScpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgZi5kYXRhKCdjdXN0b21WYWxpZGF0aW9uJywge1xyXG4gICAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciB2YWxpZCA9IHRydWUsIGxhc3RWYWxpZCA9IHRydWU7XHJcbiAgICAgICAgdmFyIHYgPSB2aC5maW5kVmFsaWRhdGlvblN1bW1hcnkoZik7XHJcblxyXG4gICAgICAgIGYuZmluZCgnLicgKyBvcHRpb25zLnJlcXVpcmVkQ2F0Q2xhc3MpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyIGZzID0gJCh0aGlzKTtcclxuICAgICAgICAgIHZhciBjYXQgPSBmcy5jaGlsZHJlbignbGVnZW5kJykudGV4dCgpO1xyXG4gICAgICAgICAgLy8gV2hhdCB0eXBlIG9mIHZhbGlkYXRpb24gYXBwbHk/XHJcbiAgICAgICAgICBpZiAoZnMuaXMoJy4nICsgb3B0aW9ucy5zZWxlY3RPbmVDbGFzcykpXHJcbiAgICAgICAgICAvLyBpZiB0aGUgY2F0IGlzIGEgJ3ZhbGlkYXRpb24tc2VsZWN0LW9uZScsIGEgJ3NlbGVjdCcgZWxlbWVudCB3aXRoIGEgJ3Bvc2l0aXZlJ1xyXG4gICAgICAgICAgLy8gOnNlbGVjdGVkIHZhbHVlIG11c3QgYmUgY2hlY2tlZFxyXG4gICAgICAgICAgICBsYXN0VmFsaWQgPSAhIShmcy5maW5kKCdvcHRpb246c2VsZWN0ZWQnKS52YWwoKSk7XHJcbiAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAvLyBPdGhlcndpc2UsIGxvb2sgZm9yICdhbG1vc3Qgb25lJyBjaGVja2VkIHZhbHVlczpcclxuICAgICAgICAgICAgbGFzdFZhbGlkID0gKGZzLmZpbmQoJ2lucHV0OmNoZWNrZWQnKS5sZW5ndGggPiAwKTtcclxuXHJcbiAgICAgICAgICBpZiAoIWxhc3RWYWxpZCkge1xyXG4gICAgICAgICAgICB2YWxpZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmcy5hZGRDbGFzcyhvcHRpb25zLmdyb3VwRXJyb3JDbGFzcyk7XHJcbiAgICAgICAgICAgIHZhciBlcnIgPSBnZXRUZXh0KG9wdGlvbnMudmFsRXJyb3JUZXh0S2V5LCBjYXQpO1xyXG4gICAgICAgICAgICBpZiAodi5maW5kKCdsaVt0aXRsZT1cIicgKyBlc2NhcGVKUXVlcnlTZWxlY3RvclZhbHVlKGNhdCkgKyAnXCJdJykubGVuZ3RoID09PSAwKVxyXG4gICAgICAgICAgICAgIHYuY2hpbGRyZW4oJ3VsJykuYXBwZW5kKCQoJzxsaS8+JykudGV4dChlcnIpLmF0dHIoJ3RpdGxlJywgY2F0KSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBmcy5yZW1vdmVDbGFzcyhvcHRpb25zLmdyb3VwRXJyb3JDbGFzcyk7XHJcbiAgICAgICAgICAgIHYuZmluZCgnbGlbdGl0bGU9XCInICsgZXNjYXBlSlF1ZXJ5U2VsZWN0b3JWYWx1ZShjYXQpICsgJ1wiXScpLnJlbW92ZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodmFsaWQpIHtcclxuICAgICAgICAgIHZoLnNldFZhbGlkYXRpb25TdW1tYXJ5QXNWYWxpZChmKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgdmguc2V0VmFsaWRhdGlvblN1bW1hcnlBc0Vycm9yKGYpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdmFsaWQ7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICB9KTtcclxufTtcclxuIiwiLyoqIEl0IHByb3ZpZGVzIHRoZSBjb2RlIGZvciB0aGUgYWN0aW9ucyBvZiB0aGUgVmVyaWZpY2F0aW9ucyBzZWN0aW9uLlxyXG4qKi9cclxudmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcclxucmVxdWlyZSgnanF1ZXJ5LmJsb2NrVUknKTtcclxuLy92YXIgTGNVcmwgPSByZXF1aXJlKCcuLi9MQy9MY1VybCcpO1xyXG4vL3ZhciBwb3B1cCA9IHJlcXVpcmUoJy4uL0xDL3BvcHVwJyk7XHJcblxyXG52YXIgYWN0aW9ucyA9IGV4cG9ydHMuYWN0aW9ucyA9IHt9O1xyXG5cclxuYWN0aW9ucy5mYWNlYm9vayA9IGZ1bmN0aW9uICgpIHtcclxuICAvKiBGYWNlYm9vayBjb25uZWN0ICovXHJcbiAgdmFyIEZhY2Vib29rQ29ubmVjdCA9IHJlcXVpcmUoJ0xDL0ZhY2Vib29rQ29ubmVjdCcpO1xyXG4gIHZhciBmYiA9IG5ldyBGYWNlYm9va0Nvbm5lY3Qoe1xyXG4gICAgcmVzdWx0VHlwZTogJ2pzb24nLFxyXG4gICAgdXJsU2VjdGlvbjogJ1ZlcmlmeScsXHJcbiAgICBhcHBJZDogJCgnaHRtbCcpLmRhdGEoJ2ZiLWFwcGlkJyksXHJcbiAgICBwZXJtaXNzaW9uczogJ2VtYWlsLHVzZXJfYWJvdXRfbWUnLFxyXG4gICAgbG9hZGluZ1RleHQ6ICdWZXJpZmluZydcclxuICB9KTtcclxuICAkKGRvY3VtZW50KS5vbihmYi5jb25uZWN0ZWRFdmVudCwgZnVuY3Rpb24gKCkge1xyXG4gICAgJChkb2N1bWVudCkub24oJ3BvcHVwLWNsb3NlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuICBmYi5jb25uZWN0KCk7XHJcbn07XHJcblxyXG5hY3Rpb25zLmVtYWlsID0gZnVuY3Rpb24gKCkge1xyXG4gIHBvcHVwKExjVXJsLkxhbmdQYXRoICsgJ0FjY291bnQvJFJlc2VuZENvbmZpcm1hdGlvbkVtYWlsL25vdy8nLCBwb3B1cC5zaXplKCdzbWFsbCcpKTtcclxufTtcclxuXHJcbnZhciBsaW5rcyA9IGV4cG9ydHMubGlua3MgPSB7XHJcbiAgJyNjb25uZWN0LXdpdGgtZmFjZWJvb2snOiBhY3Rpb25zLmZhY2Vib29rLFxyXG4gICcjY29uZmlybS1lbWFpbCc6IGFjdGlvbnMuZW1haWxcclxufTtcclxuXHJcbmV4cG9ydHMub24gPSBmdW5jdGlvbiAoY29udGFpbmVyU2VsZWN0b3IpIHtcclxuICB2YXIgJGMgPSAkKGNvbnRhaW5lclNlbGVjdG9yKTtcclxuXHJcbiAgJGMub24oJ2NsaWNrJywgJ2EnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBHZXQgdGhlIGFjdGlvbiBsaW5rIG9yIGVtcHR5XHJcbiAgICB2YXIgbGluayA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJykgfHwgJyc7XHJcblxyXG4gICAgLy8gRXhlY3V0ZSB0aGUgYWN0aW9uIGF0dGFjaGVkIHRvIHRoYXQgbGlua1xyXG4gICAgdmFyIGFjdGlvbiA9IGxpbmtzW2xpbmtdIHx8IG51bGw7XHJcbiAgICBpZiAodHlwZW9mIChhY3Rpb24pID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIGFjdGlvbigpO1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSk7XHJcbn07XHJcbiIsIi8qKlxyXG4gICAgVXNlciBwcml2YXRlIGRhc2hib2FyZCBzZWN0aW9uXHJcbioqL1xyXG52YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xyXG5cclxuLy8gQ29kZSBvbiBwYWdlIHJlYWR5XHJcbiQoZnVuY3Rpb24gKCkge1xyXG4gIC8qIFNpZGViYXIgKi9cclxuICB2YXIgXHJcbiAgICB0b2dnbGUgPSByZXF1aXJlKCcuLi9MQy90b2dnbGUnKSxcclxuICAgIFByb3ZpZGVyUG9zaXRpb24gPSByZXF1aXJlKCcuLi9MQy9Qcm92aWRlclBvc2l0aW9uJyk7XHJcbiAgLy8gQXR0YWNoaW5nICdjaGFuZ2UgcG9zaXRpb24nIGFjdGlvbiB0byB0aGUgc2lkZWJhciBsaW5rc1xyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdbaHJlZiA9IFwiI3RvZ2dsZVBvc2l0aW9uU3RhdGVcIl0nLCBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgXHJcbiAgICAgICR0ID0gJCh0aGlzKSxcclxuICAgICAgdiA9ICR0LnRleHQoKSxcclxuICAgICAgbiA9IHRvZ2dsZSh2LCBbJ29uJywgJ29mZiddKSxcclxuICAgICAgcG9zaXRpb25JZCA9ICR0LmNsb3Nlc3QoJ1tkYXRhLXBvc2l0aW9uLWlkXScpLmRhdGEoJ3Bvc2l0aW9uLWlkJyk7XHJcblxyXG4gICAgdmFyIHBvcyA9IG5ldyBQcm92aWRlclBvc2l0aW9uKHBvc2l0aW9uSWQpO1xyXG4gICAgcG9zXHJcbiAgICAub24ocG9zLnN0YXRlQ2hhbmdlZEV2ZW50LCBmdW5jdGlvbiAoc3RhdGUpIHtcclxuICAgICAgJHQudGV4dChzdGF0ZSk7XHJcbiAgICB9KVxyXG4gICAgLmNoYW5nZVN0YXRlKG4pO1xyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9KTtcclxuXHJcbiAgLyogUHJvbW90ZSAqL1xyXG4gIHZhciBnZW5lcmF0ZUJvb2tOb3dCdXR0b24gPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9nZW5lcmF0ZUJvb2tOb3dCdXR0b24nKTtcclxuICAvLyBMaXN0ZW4gb24gRGFzaGJvYXJkUHJvbW90ZSBpbnN0ZWFkIG9mIHRoZSBtb3JlIGNsb3NlIGNvbnRhaW5lciBEYXNoYm9hcmRCb29rTm93QnV0dG9uXHJcbiAgLy8gYWxsb3dzIHRvIGNvbnRpbnVlIHdvcmtpbmcgd2l0aG91dCByZS1hdHRhY2htZW50IGFmdGVyIGh0bWwtYWpheC1yZWxvYWRzIGZyb20gYWpheEZvcm0uXHJcbiAgZ2VuZXJhdGVCb29rTm93QnV0dG9uLm9uKCcuRGFzaGJvYXJkUHJvbW90ZScpOyAvLycuRGFzaGJvYXJkQm9va05vd0J1dHRvbidcclxuXHJcbiAgLyogUHJpdmFjeSAqL1xyXG4gIHZhciBwcml2YWN5U2V0dGluZ3MgPSByZXF1aXJlKCcuL2Rhc2hib2FyZC9wcml2YWN5U2V0dGluZ3MnKTtcclxuICBwcml2YWN5U2V0dGluZ3Mub24oJy5EYXNoYm9hcmRQcml2YWN5Jyk7XHJcblxyXG4gIC8qIFBheW1lbnRzICovXHJcbiAgdmFyIHBheW1lbnRBY2NvdW50ID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvcGF5bWVudEFjY291bnQnKTtcclxuICBwYXltZW50QWNjb3VudC5vbignLkRhc2hib2FyZFBheW1lbnRzJyk7XHJcblxyXG4gIC8qIFByb2ZpbGUgcGhvdG8gKi9cclxuICB2YXIgY2hhbmdlUHJvZmlsZVBob3RvID0gcmVxdWlyZSgnLi9kYXNoYm9hcmQvY2hhbmdlUHJvZmlsZVBob3RvJyk7XHJcbiAgY2hhbmdlUHJvZmlsZVBob3RvLm9uKCcuRGFzaGJvYXJkQWJvdXRZb3UnKTtcclxuXHJcbiAgLyogQWJvdXQgeW91IC8gZWR1Y2F0aW9uICovXHJcbiAgdmFyIGVkdWNhdGlvbiA9IHJlcXVpcmUoJy4vZGFzaGJvYXJkL2VkdWNhdGlvbkNydWRsJyk7XHJcbiAgZWR1Y2F0aW9uLm9uKCcuRGFzaGJvYXJkQWJvdXRZb3UnKTtcclxuXHJcbiAgLyogQWJvdXQgeW91IC8gdmVyaWZpY2F0aW9ucyAqL1xyXG4gIHJlcXVpcmUoJy4vZGFzaGJvYXJkL3ZlcmlmaWNhdGlvbnNBY3Rpb25zJykub24oJy5EYXNoYm9hcmRWZXJpZmljYXRpb25zJyk7XHJcblxyXG4gIC8qIFlvdXIgd29yayAvIHNlcnZpY2VzICovXHJcbiAgcmVxdWlyZSgnLi9kYXNoYm9hcmQvc2VydmljZUF0dHJpYnV0ZXNWYWxpZGF0aW9uJykuc2V0dXAoJCgnLkRhc2hib2FyZFlvdXJXb3JrIGZvcm0nKSk7XHJcblxyXG59KTsiXX0=
